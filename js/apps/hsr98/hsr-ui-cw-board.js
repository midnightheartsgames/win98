(function (H) {
  'use strict';
  const G = H.Gfx, CW = H.CW, TUN = CW.TUN;
  const { W, HGT, C } = H.UI_CONST;
  const { K, KIND_NAME } = H.CW_UI;
  const ZONES = ['on', 'off', 'bench', 'shop'];
  const COUNT = { on: TUN.onField, off: TUN.offField, bench: TUN.bench, shop: TUN.shopSize, inv: 15 };
  const BOND_KEYS = Object.keys(CW.BONDS);
  const GO_LABEL = { reward: 'За наградами', fight: 'К сражению', enc: 'К встрече', supply: 'Снабжение', boss: 'К боссу' };

  const cell = (zone, i) => {
    if (zone === 'on') return { x: 170 + i * 76, y: 58, s: 64 };
    if (zone === 'off') return { x: 168 + i * 34, y: 162, s: 30 };
    if (zone === 'bench') return { x: 120 + i * 40, y: 314, s: 36 };
    if (zone === 'inv') return { x: 490 + (i % 5) * 28, y: 152 + Math.floor(i / 5) * 28, s: 24 };
    return { x: 8 + i * 124, y: 358, s: 88, w: 118 };
  };
  const SHOP_AREA = { x: 8, y: 356, w: 614, h: 92 };
  const inside = (p, x, y, w, h) => p.x >= x && p.y >= y && p.x < x + w && p.y < y + h;

  function zoneAt(p) {
    for (const z of ['on', 'off', 'bench', 'inv']) for (let i = 0; i < COUNT[z]; i++) { const r = cell(z, i); if (inside(p, r.x - 3, r.y - 3, r.s + 6, r.s + 6)) return { zone: z, i }; }
    if (inside(p, SHOP_AREA.x, SHOP_AREA.y, SHOP_AREA.w, SHOP_AREA.h)) return { zone: 'shop', i: 0 };
    const pp = H.UI.prototype.cwPeppyCell();
    if (inside(p, pp.x - 3, pp.y - 3, pp.s + 6, pp.s + 6)) return { zone: 'peppy', i: 0 };
    return null;
  }

  Object.assign(H.UI.prototype, {
    cwSay(err) {
      const T = {
        gold: 'Не хватает монет.', bench: 'Зона подготовки заполнена. Продайте героя или выставьте его.', team: 'Команда заполнена. Поднимите уровень, чтобы выставить больше героев.',
        field: 'Поставьте хотя бы одного героя на поле.', full: 'Нет свободного места.', empty: 'Здесь пусто.', max: 'Уровень уже наибольший.',
        replay: 'Перед переигровкой можно только переставлять героев.', locked: 'Стратегия закрыла это на несколько узлов.'
      };
      if (T[err]) this.toast(T[err]);
      this.sfx('deny');
    },

    openCwBoard() {
      const ui = this, g = this.game;
      this.cwMusic();
      const run = () => g.cwRun();
      const unitAt = (z, i) => { const r = run(); return r && r.board[z] ? r.board[z][i] : null; };
      const scr = {
        full: true, cw: true, board: true, cur: { zone: 'shop', i: 0 }, held: null, drag: null, bondInfo: null, receipt: null, lastClick: null,
        draw(c) {
          const r = run();
          if (!r) { ui.screens = ui.screens.filter(s => s !== scr); return; }
          if (r.phase === 'supply' && !ui.screens.some(s => s.supply)) { ui.openCwSupply(); return; }
          if (r.phase === 'enc' && !ui.screens.some(s => s.enc)) { ui.openCwEncounter(); return; }
          if (r.choice && !ui.screens.some(s => s.choice)) { ui.openCwChoice(); return; }
          if (r.phase === 'lost' && !ui.screens.some(s => s.lostPick) && !this.receipt) { ui.openCwLost(); return; }
          if (r.envPick && !ui.screens.some(s => s.envPick)) { ui.openCwEnv(); return; }
          if (r.stratPick && !ui.screens.some(s => s.stratPick) && !this.receipt) { ui.openCwStrat(); return; }
          if (r.numbyPaid && !r.numbyPaid.shown && !this.receipt) { r.numbyPaid.shown = true; ui.toast('Счетовод вернул ' + r.numbyPaid.amt + (r.numbyPaid.gain ? ' + доход ' + r.numbyPaid.gain : '') + ' мон.'); ui.sfx('glint'); }
          ui.cwBoardBack(c);
          this.drawTop(c, r);
          this.drawBonds(c, r);
          this.drawRows(c, r);
          this.drawInfo(c, r);
          this.drawPurse(c, r);
          this.drawBench(c, r);
          this.drawShop(c, r);
          const kind = g.cwNodeKind(r), pv = g.cwPreview(r), replay = r.phase === 'replay';
          ui.button(482, 452, 150, 24, replay ? 'Переиграть бой' : GO_LABEL[kind], () => this.go(), { active: true, bold: true, icon: 'warp' });
          if (pv.harvest && !replay) ui.button(372, 452, 104, 24, 'Сбор · H', () => this.harvest(), { bold: true });
          if (r.bond.orders && !replay) ui.button(372, 452, 104, 24, r.bond.order ? 'Заказ взят' : 'Заказ · O', () => ui.openCwOrders(), { bold: !r.bond.order, active: !r.bond.order });
          if (replay) { c.fillStyle = 'rgba(40,8,12,0.7)'; c.fillRect(SHOP_AREA.x, SHOP_AREA.y, SHOP_AREA.w, SHOP_AREA.h); ui.text('Переигровка: тот же бой. Магазин, опыт и продажа закрыты, героев можно переставить.', W / 2, SHOP_AREA.y + 38, { align: 'center', size: 11, bold: true, col: '#ffd0d0' }); }
          ui.hints([['Enter', 'Взять'], ['1-5', 'Купить'], ['F', 'Опыт'], ['R', 'Обновить'], ['Del', 'Продать'], ['Space', 'Начать']], 8, 458);
          if (this.drag && this.drag.moved) this.drawDrag(c, r);
          if (this.bondInfo) this.drawBondInfo(c, r);
          if (this.receipt) this.drawReceipt(c);
        },
        drawTop(c, r) {
          c.fillStyle = 'rgba(4,6,20,0.85)'; c.fillRect(0, 0, W, 34);
          c.fillStyle = K.gold; c.fillRect(0, 34, W, 1);
          ui.button(8, 7, 58, 20, 'Выход', () => this.leave(), { size: 11 });
          const x0 = 92, step = 34;
          ui.rail(x0 - 10, 17, step * (r.nodes.length - 1) + 20, r.node / Math.max(1, r.nodes.length - 1), K.gold);
          r.nodes.forEach((k, i) => {
            const x = x0 + i * step, on = i === r.node, done = i < r.node;
            if (r.frenzy.includes(i) && !done) { c.strokeStyle = '#ff4a4a'; c.lineWidth = 2; c.beginPath(); c.arc(x, 17, 12, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1; }
            c.fillStyle = '#000000'; c.fillRect(x - 9, 8, 18, 18);
            c.fillStyle = on ? K.gold : done ? '#3a3020' : '#141a3a'; c.fillRect(x - 8, 9, 16, 16);
            ui.cwNodeGlyph(c, k, x, 17, on ? '#1a1206' : done ? '#8a7a5a' : '#9aa6d0');
            if (i === r.strat) ui.diamond(x + 9, 9, 3, done ? '#5a5040' : '#c8a8ff', '#1a1208');
          });
          const k = g.cwNodeKind(r);
          ui.text((r.plane + 1) + '-' + (r.node + 1) + ' ' + KIND_NAME[k], x0 + step * (r.nodes.length - 1) + 22, 5, { size: 11, bold: true, col: K.gold });
          ui.text(g.cwRank(r.tier, r.sub).code + (r.mode === 'quick' ? ' · быстрая' : '') + (r.diffPlus ? ' · сложн. ' + (r.diffPlus > 0 ? '+' : '') + r.diffPlus : ''), x0 + step * (r.nodes.length - 1) + 22, 19, { size: 9, col: C.sub });
          ui.cwHeart(c, 492, 17, 7);
          ui.text(r.hp + ' / ' + r.hpMax, 504, 10, { size: 12, bold: true, col: r.hp < 40 ? C.bad : C.cream });
          ui.button(566, 7, 30, 20, 'Св', () => { this.bondInfo = this.bondInfo ? null : { k: null }; ui.sfx('select'); }, { size: 10 });
          ui.button(602, 7, 30, 20, '?', () => ui.openCwRules(), { size: 11, bold: true });
        },
        drawBonds(c, r) {
          const st = g.cwBonds(r), cu = this.curUnit(r), x = 8, y = 42, w = 150, rowH = 25, max = 9;
          ui.win(x, y, w, 252, { alpha: 0.9, corners: false });
          ui.text('Связи', x + 10, y + 7, { size: 12, bold: true, serif: true, col: K.gold });
          const keys = BOND_KEYS.filter(k => st[k].n > 0).sort((a, b) => st[b].tier - st[a].tier || st[b].n - st[a].n);
          if (!keys.length) ui.wrap('Выставьте героев, и здесь появятся их связи.', w - 20, 10).forEach((l, i) => ui.text(l, x + 10, y + 30 + i * 12, { size: 10, col: C.dim }));
          const top = Math.max(0, Math.min(this.bondTop || 0, keys.length - max));
          this.bondTop = top;
          ui.wheelZone(x, y + 24, w, max * rowH, d => { this.bondTop = Math.max(0, Math.min(keys.length - max, (this.bondTop || 0) + d)); });
          keys.slice(top, top + max).forEach((k, i) => {
            const B = CW.BONDS[k], s = st[k], ry = y + 26 + i * rowH, lit = cu && CW.UNITS[cu.id] && CW.UNITS[cu.id].bonds.includes(k), on = s.tier >= 0;
            if (lit) { c.fillStyle = 'rgba(255,212,113,0.16)'; c.fillRect(x + 4, ry - 2, w - 8, rowH - 1); c.fillStyle = K.gold; c.fillRect(x + 4, ry - 2, 2, rowH - 1); }
            G.cwBondIcon(c, k, x + 8, ry - 1, 12, on ? B.col : '#5a5e72');
            ui.text(ui.clip(B.name, 88, 10, true), x + 23, ry, { size: 10, bold: true, col: on ? B.col : C.dim });
            ui.text(s.n + (s.next ? ' / ' + s.next : ''), x + w - 10, ry, { align: 'right', size: 10, bold: true, col: on ? C.cream : C.dim });
            if (s.members.includes('yu') && !CW.UNITS.yu.bonds.includes(k)) ui.diamond(x + 7, ry + 5, 2.5, '#ffd0ff', '#2a1030');
            if (s.members.includes('peppy')) ui.diamond(x + 7, ry + 12, 2.5, '#ffb8c8', '#2a1020');
            B.steps.forEach((n, j) => {
              const bx = x + 10 + j * 18, ok = j <= s.tier;
              c.fillStyle = '#000000'; c.fillRect(bx, ry + 13, 16, 7);
              c.fillStyle = ok ? CW.TIER_COL[Math.min(4, j + 1)] : '#181c38'; c.fillRect(bx + 1, ry + 14, 14, 5);
            });
            ui.hit(x + 4, ry - 2, w - 8, rowH, () => { this.bondInfo = { k }; ui.sfx('select'); });
          });
          if (top > 0) ui.diamond(x + w - 10, y + 12, 3, C.brassHi);
          if (top + max < keys.length) ui.diamond(x + w - 10, y + 246, 3, C.brassHi);
        },
        drawRows(c, r) {
          const team = g.cwDeployed(r).length, cap = g.cwTeamSize(r);
          ui.text('НА ПОЛЕ', 170, 42, { size: 10, bold: true, col: K.gold });
          ui.text('команда ' + team + ' / ' + cap, 474, 42, { align: 'right', size: 10, bold: true, col: team >= cap ? C.cream : C.ok });
          for (let i = 0; i < COUNT.on; i++) this.drawCell(c, r, 'on', i);
          ui.text('ВНЕ ПОЛЯ', 168, 148, { size: 10, bold: true, col: K.gold });
          ui.text('врагам не достать, ходят по шкале', 474, 148, { align: 'right', size: 9, col: C.dim });
          for (let i = 0; i < COUNT.off; i++) this.drawCell(c, r, 'off', i);
        },
        drawCell(c, r, z, i) {
          const p = cell(z, i), u = r.board[z][i], on = this.cur.zone === z && this.cur.i === i, held = this.held && this.held.zone === z && this.held.i === i;
          const dragging = this.drag && this.drag.moved && this.drag.zone === z && this.drag.i === i;
          if (!u || dragging) {
            ui.cwSlot(c, p.x, p.y, p.s, z === 'on' ? '+' : '', on);
            if (z === 'bench' && r.benchCap && i >= r.benchCap) { c.fillStyle = 'rgba(40,8,12,0.75)'; c.fillRect(p.x, p.y, p.s, p.s); c.strokeStyle = '#8a3040'; c.beginPath(); c.moveTo(p.x + 6, p.y + 6); c.lineTo(p.x + p.s - 6, p.y + p.s - 6); c.moveTo(p.x + p.s - 6, p.y + 6); c.lineTo(p.x + 6, p.y + p.s - 6); c.stroke(); }
          } else {
            const d = CW.UNITS[u.id], wrong = (z === 'on' && d.pos === 'off') || (z === 'off' && d.pos === 'on');
            ui.cwCell(c, u, p.x, p.y, p.s, { kit: z === 'off' ? d.kitOff : d.kitOn, wrong, border: on ? '#ffffff' : null });
            if (held) { c.fillStyle = 'rgba(255,212,113,0.35)'; c.fillRect(p.x, p.y, p.s, p.s); }
            if (z === 'on') ui.text(ui.clip(H.CHARS[d.kitOn].name, p.s + 8, 9), p.x + p.s / 2, p.y + p.s + 3, { align: 'center', size: 9, col: on ? K.gold : C.sub });
            ui.cwSpecialBadges(c, r, u, p);
            if (z === 'bench' && ui.cwMarked(r, u.id)) ui.diamond(p.x + 5, p.y + 5, 3.5, '#9affb0', '#0a2a14');
            const its = u.items || [];
            if (z === 'on') its.forEach((it, j) => ui.cwItemIcon(c, it, p.x + p.s - 15, p.y + 2 + j * 15, 13));
            else its.forEach((it, j) => { c.fillStyle = '#000000'; c.fillRect(p.x + 1 + j * 7, p.y + 1, 6, 6); c.fillStyle = (CW.ITEMS[it.id].col || (CW.ITEMS[it.id].from ? CW.ITEMS[CW.ITEMS[it.id].from[0]].col : '#ffffff')); c.fillRect(p.x + 2 + j * 7, p.y + 2, 4, 4); });
          }
          if (on && !(this.drag && this.drag.moved)) { c.strokeStyle = K.gold; c.lineWidth = 2; c.strokeRect(p.x - 2, p.y - 2, p.s + 4, p.s + 4); c.lineWidth = 1; }
          ui.hit(p.x, p.y, p.s, p.s, (btn, q) => this.press(z, i, btn, q));
        },
        drawInfo(c, r) {
          const x = 166, y = 200, w = 308, h = 94, z = this.cur.zone;
          ui.win(x, y, w, h, { alpha: 0.88, corners: false, border: '#5a4a2a' });
          if (z === 'inv') {
            const it = this.invAt(this.cur.i);
            if (!it) { ui.text('Пустая ячейка инвентаря.', x + 10, y + 8, { size: 11, col: C.sub }); return; }
            ui.cwItemIcon(c, it, x + 10, y + 8, 26);
            ui.text(g.cwItemName(it), x + 44, y + 8, { size: 11, bold: true, col: it.sp ? K.gold : C.cream });
            const recFor = g.cwRecFor(r).get(it.id);
            if (recFor) ui.text('Рекомендовано: ' + recFor.map(id => H.CHARS[CW.UNITS[id].kitOn].name).join(', '), x + 44, y + 22, { size: 9, col: K.gold });
            let ly = y + 40;
            for (const l of ui.cwItemLines(it)) for (const s of ui.wrap(l, w - 20, 9)) { if (ly > y + h - 10) break; ui.text(s, x + 10, ly, { size: 9, col: '#d8dcf0' }); ly += 11; }
            return;
          }
          const id = z === 'shop' ? r.shop[this.cur.i] : (unitAt(z, this.cur.i) || {}).id;
          const u = z === 'shop' ? (id ? { id, star: 1 } : null) : unitAt(z, this.cur.i);
          if (!u) {
            const pv = g.cwPreview(r);
            ui.text('Следующий узел: ' + KIND_NAME[pv.kind] + (pv.opp ? ' · ' + pv.opp.short : ''), x + 10, y + 8, { size: 11, bold: true, col: C.cream });
            let lines = pv.kind === 'supply' ? ['Выберите одного из пяти героев бесплатно.'] : pv.kind === 'reward' ? ['Лёгкий бой без отсчёта. Враги роняют монеты и руду.', pv.harvest ? 'Можно не драться: «Сбор» даёт средние награды.' : 'Первый узел наград открывает «Сбор».'] : ['Отсчёт ' + pv.countdown + '. Не успели: команда теряет НР.', 'За бой: ' + pv.base + ' базовых, серия +' + pv.streak + ', проценты +' + pv.interest + '.'];
            if (pv.kind === 'enc') lines = ['Встреча: выберите лёгкую или трудную ветвь.', 'Трудная ветвь сильнее врагов, но дороже награда.'];
            if (pv.frenzy) lines = ['Неистовый узел: враги крепче, монет в полтора раза больше.'].concat(lines.slice(0, 1));
            if (pv.strat) lines = lines.slice(0, 1).concat(['После этой битвы выбор инвестиционной стратегии.']);
            const fc = g.cwForecast(r);
            if (fc && fc.length) lines = lines.slice(0, 2).concat(['Прогноз: ' + fc.map(f => (KIND_NAME[f.kind] || 'Встреча') + (f.opp ? ' (' + f.opp + ')' : '')).join(', ')]);
            lines.forEach((l, i) => ui.text(l, x + 10, y + 28 + i * 14, { size: 10, col: C.sub }));
            ui.text('Перетащите героя мышью или выберите его клавишей Enter.', x + 10, y + h - 18, { size: 9, col: C.dim });
            return;
          }
          const d = CW.UNITS[u.id], kit = H.CHARS[d.kitOn];
          ui.cwCostChip(x + 10, y + 8, d.cost);
          ui.text(kit.name, x + 28, y + 7, { size: 12, bold: true, col: C.cream });
          ui.cwStars(x + w - 12 - u.star * 9, y + 13, u.star, 4);
          ui.text(H.PATHS[kit.path].name + ' · ' + CW.ROLE[d.role] + ' · ' + CW.POS[d.pos], x + 10, y + 26, { size: 10, col: C.sub });
          let bx = x + 10;
          for (const k of d.bonds) {
            const live = !!CW.BONDS[k], name = CW.BOND_NAMES[k], tw = ui.measure(name, 9, true) + 10;
            if (bx + tw > x + w - 8) break;
            c.fillStyle = live ? 'rgba(255,212,113,0.15)' : 'rgba(40,44,70,0.6)'; c.fillRect(bx, y + 42, tw, 13);
            ui.text(name, bx + 5, y + 43, { size: 9, bold: true, col: live ? CW.BONDS[k].col : C.dim });
            bx += tw + 4;
          }
          const wrong = (z === 'on' && d.pos === 'off') || (z === 'off' && d.pos === 'on');
          let note = z === 'shop' ? 'Купить за ' + d.cost + '. Клавиша ' + (this.cur.i + 1) + ' или щелчок.' : 'Продать за ' + g.cwSellValue(u) + '. Клавиша Del или перетащить на магазин.';
          if (wrong) note = z === 'on' ? 'Не на своём месте: на поле дерётся с силой героя 1 стоимости.' : 'Не на своём месте: вне поля не действует, связи считаются.';
          ui.wrap(note, w - 20, 10).slice(0, 2).forEach((l, i) => ui.text(l, x + 10, y + 60 + i * 13, { size: 10, col: wrong ? C.bad : C.cream }));
          (u.items || []).forEach((it, j) => ui.cwItemIcon(c, it, x + w - 70 + j * 20, y + 24, 16));
          const owned = new Set(g.cwInv(r).map(i2 => i2.id).concat(g.cwUnits(r).flatMap(xx => (xx.u.items || []).map(i2 => i2.id))));
          const recs = g.cwRec(u.id).map(id2 => (owned.has(id2) ? '✓ ' : '') + CW.ITEMS[id2].name);
          ui.text(ui.clip('Снаряжение: ' + recs.join(', '), w - 20, 9), x + 10, y + h - 14, { size: 9, col: C.dim });
        },
        drawPurse(c, r) {
          const x = 482, y = 42, w = 150, pv = g.cwPreview(r);
          ui.win(x, y, w, 252, { alpha: 0.9, corners: false });
          ui.cwCoin(x + 20, y + 20, 9);
          ui.text(String(r.gold), x + 36, y + 8, { size: 22, bold: true, serif: true, col: K.gold });
          ui.text('+' + g.cwInterest(r.gold, r) + ' %', x + w - 10, y + 8, { align: 'right', size: 10, bold: true, col: C.cream });
          ui.text('серия ' + r.streak + (pv.streak ? ' +' + pv.streak : ''), x + w - 10, y + 21, { align: 'right', size: 9, col: C.sub });
          ui.text('Уровень ' + r.lvl, x + 10, y + 40, { size: 11, bold: true, col: C.cream });
          const need = g.cwNeed(r);
          ui.text(need ? r.exp + ' / ' + need : 'наибольший', x + w - 10, y + 41, { align: 'right', size: 10, col: C.sub });
          ui.bar(x + 10, y + 56, w - 20, 4, need ? r.exp / need : 1, '#80c0ff');
          g.cwOdds(r).forEach((o, i) => { const ox = x + 8 + i * 28; ui.cwCostChip(ox, y + 66, o.cost); ui.text(o.v + '', ox + 15, y + 67, { size: 8, bold: true, col: C.cream }); });
          c.fillStyle = K.line; c.fillRect(x + 8, y + 86, w - 16, 1);
          const inv = g.cwInv(r), rec = g.cwRecFor(r), rows = Math.max(1, Math.ceil(inv.length / 5));
          ui.text('Инвентарь ' + inv.length, x + 10, y + 92, { size: 10, bold: true, col: K.gold });
          if (rows > 3) ui.text((this.invTop + 1) + '-' + (this.invTop + 3) + ' / ' + rows, x + w - 10, y + 93, { align: 'right', size: 9, col: C.sub });
          this.invTop = Math.max(0, Math.min(this.invTop || 0, rows - 3));
          ui.wheelZone(x, y + 108, w, 86, d => { this.invTop = Math.max(0, Math.min(rows - 3, (this.invTop || 0) + d)); });
          for (let i = 0; i < 15; i++) {
            const q = cell('inv', i), it = inv[i + this.invTop * 5], on = this.cur.zone === 'inv' && this.cur.i === i;
            const dragging = this.drag && this.drag.moved && this.drag.zone === 'inv' && this.drag.i === i;
            if (!it || dragging) ui.cwSlot(c, q.x, q.y, q.s, '', on);
            else {
              ui.cwItemIcon(c, it, q.x, q.y, q.s, { rec: rec.has(it.id), border: on ? '#ffffff' : null });
              if (this.held && this.held.zone === 'inv' && this.held.i === i) { c.fillStyle = 'rgba(255,212,113,0.35)'; c.fillRect(q.x, q.y, q.s, q.s); }
            }
            if (on) { c.strokeStyle = K.gold; c.lineWidth = 2; c.strokeRect(q.x - 2, q.y - 2, q.s + 4, q.s + 4); c.lineWidth = 1; }
            ui.hit(q.x, q.y, q.s, q.s, (btn, pt) => this.press('inv', i, btn, pt));
          }
          ui.text('Тяните на героя или на предмет.', x + 10, y + 196, { size: 8, col: C.dim });
          ui.text('I: инвентарь, Enter: взять', x + 10, y + 208, { size: 8, col: C.dim });
          ui.button(x + 8, y + 224, w - 16, 20, 'Условия партии · T', () => ui.openCwStratList(), { size: 10, bold: true });
        },
        invAt(i) { return g.cwInv(run())[i + (this.invTop || 0) * 5]; },
        invIndex(i) { return i + (this.invTop || 0) * 5; },
        applyItem(from, t) {
          const r = run(), i = this.invIndex(from);
          const it = g.cwInv(r)[i];
          if (!it) return;
          let res;
          if (t.zone === 'peppy') { const err = ui.cwPeppyShown(r) ? g.cwPeppyGive(i) : 'target'; if (err) ui.cwSpecialSay(err); else { ui.sfx('confirm'); ui.toast('Пеппи несёт ' + CW.ITEMS[it.id].name); } return; }
          if (t.zone === 'inv') { const j = this.invIndex(t.i); if (j === i) { if (CW.ITEMS[it.id].on === 'self') res = g.cwOpenBox(i); else return; } else res = g.cwInvCombine(i, j); }
          else if (['on', 'off', 'bench'].includes(t.zone)) res = g.cwEquip(i, t.zone, t.i);
          else return;
          this.itemSay(res);
        },
        itemSay(res) {
          const T = { slots: 'У героя уже три предмета.', unique: 'Этот предмет один на героя.', member: 'Герой уже состоит в этой связи.', nocombine: 'Эти предметы не соединяются.', trash: 'Для золотого мешка нужны три мусорных мешка.', target: 'Этот предмет сюда не применить.', noitems: 'На герое нет предметов.', cost: 'Проектор копирует героев стоимости до 3.', pool: 'Копий этого героя не осталось.', bench: 'Зона подготовки заполнена.', phase: 'Сейчас нельзя.' };
          if (res === 'choice') { ui.openCwChoice(); ui.sfx('confirm'); return; }
          if (res && typeof res === 'object') { ui.sfx('confirm'); for (const m of res.merged || []) ui.toast(H.CHARS[CW.UNITS[m.id].kitOn].name + ': ' + m.star + '★'); return; }
          if (res) { if (T[res]) ui.toast(T[res]); ui.sfx('deny'); return; }
          ui.sfx('confirm');
        },
        drawBench(c, r) {
          ui.text('ЗОНА ПОДГОТОВКИ', 120, 300, { size: 10, bold: true, col: K.gold });
          ui.text(r.board.bench.filter(Boolean).length + ' / ' + COUNT.bench, 516, 300, { align: 'right', size: 10, col: C.sub });
          for (let i = 0; i < COUNT.bench; i++) this.drawCell(c, r, 'bench', i);
          const maxed = r.lvl >= CW.lvlMax(r), dog = ui.cwPeppyShown(r);
          ui.button(8, 314, dog ? 66 : 104, 36, maxed ? 'Опыт: всё' : dog ? 'Опыт · ' + TUN.expCost : 'Опыт +' + TUN.expPerBuy + ' · ' + TUN.expCost, () => this.buyExp(), { disabled: maxed || r.gold < TUN.expCost, size: dog ? 10 : 11, bold: true });
          if (dog) {
            const pp = ui.cwPeppyCell(), on = this.cur.zone === 'peppy';
            ui.cwPeppy(c, r, on);
            if (on) { c.strokeStyle = K.gold; c.lineWidth = 2; c.strokeRect(pp.x - 2, pp.y - 2, pp.s + 4, pp.s + 4); c.lineWidth = 1; }
            ui.hit(pp.x, pp.y, pp.s, pp.s, btn => this.pressPeppy(btn));
          }
          ui.button(524, 314, 108, 17, (r.free ? 'Обновить · даром ' + r.free : 'Обновить · ' + TUN.refreshCost), () => this.refresh(), { disabled: !r.free && r.gold < TUN.refreshCost, size: 10 });
          ui.button(524, 333, 108, 17, r.lock ? 'Закреплено' : 'Закрепить', () => this.lock(), { active: r.lock, size: 10 });
        },
        drawShop(c, r) {
          const st = g.cwBonds(r), deployed = new Set(g.cwDeployed(r).map(u => u.id));
          const selling = this.drag && this.drag.moved && this.drag.zone !== 'shop' && this.drag.zone !== 'inv';
          for (let i = 0; i < COUNT.shop; i++) {
            const p = cell('shop', i), id = r.shop[i], on = this.cur.zone === 'shop' && this.cur.i === i;
            if (!id) { ui.cwSlot(c, p.x, p.y, p.w, '', on); c.fillStyle = 'rgba(6,10,34,0.82)'; c.fillRect(p.x, p.y + p.w, p.w, p.s - p.w); ui.text('продано', p.x + p.w / 2, p.y + 38, { align: 'center', size: 10, col: '#2a3460' }); }
            else {
              const d = CW.UNITS[id], kit = H.CHARS[d.kitOn], can = !g.cwCanBuy(i);
              c.fillStyle = '#000000'; c.fillRect(p.x, p.y, p.w, p.s);
              const gr = c.createLinearGradient(0, p.y, 0, p.y + p.s);
              gr.addColorStop(0, '#1a2050'); gr.addColorStop(1, '#080a22');
              c.fillStyle = gr; c.fillRect(p.x + 1, p.y + 1, p.w - 2, p.s - 2);
              c.fillStyle = CW.COST_COL[d.cost]; c.fillRect(p.x + 1, p.y + 1, p.w - 2, 2); c.fillRect(p.x + 1, p.y + p.s - 3, p.w - 2, 2);
              ui.portraitCard(c, G.lookOf(d.kitOn, g), p.x + 5, p.y + 7, 40, { elem: kit.elem, border: CW.COST_COL[d.cost] });
              if (ui.cwMarked(r, id)) ui.diamond(p.x + 9, p.y + 11, 4, '#9affb0', '#0a2a14');
              ui.text(ui.clip(kit.name, p.w - 54, 10, true), p.x + 50, p.y + 7, { size: 10, bold: true, col: C.cream });
              ui.cwCoin(p.x + 56, p.y + 27, 5);
              ui.text(String(g.cwShopPrice(r, i)), p.x + 64, p.y + 21, { size: 11, bold: true, col: can ? K.gold : C.bad });
              if (r.shopStar && r.shopStar[i] === 2) { c.fillStyle = 'rgba(4,6,20,0.8)'; c.fillRect(p.x + 5, p.y + 37, 40, 10); ui.cwStars(p.x + 25, p.y + 42, 2, 4, 'center'); }
              ui.text(d.pos === 'on' ? 'поле' : d.pos === 'off' ? 'вне' : 'оба', p.x + p.w - 6, p.y + 21, { align: 'right', size: 9, col: C.sub });
              d.bonds.slice(0, 3).forEach((k, j) => {
                const B = CW.BONDS[k], s = st[k], up = B && !deployed.has(id) && s.next && s.n + 1 >= s.next;
                ui.text((up ? '▲ ' : '') + ui.clip(CW.BOND_NAMES[k], p.w - 14, 9), p.x + 6, p.y + 50 + j * 11, { size: 9, bold: !!B, col: B ? (up ? '#ffffff' : B.col) : C.dim });
              });
              if (on) { c.strokeStyle = K.gold; c.lineWidth = 2; c.strokeRect(p.x - 1, p.y - 1, p.w + 2, p.s + 2); c.lineWidth = 1; }
              ui.text(String(i + 1), p.x + p.w - 8, p.y + 6, { align: 'center', size: 9, col: C.dim });
            }
            ui.hit(p.x, p.y, p.w, p.s, btn => { this.cur = { zone: 'shop', i }; if (btn === 2) ui.openCwCard({ id, star: 1 }); else this.buy(i); });
          }
          if (selling) {
            const u = unitAt(this.drag.zone, this.drag.i);
            c.fillStyle = 'rgba(40,8,12,0.82)'; c.fillRect(SHOP_AREA.x, SHOP_AREA.y, SHOP_AREA.w, SHOP_AREA.h);
            c.strokeStyle = C.bad; c.strokeRect(SHOP_AREA.x + 0.5, SHOP_AREA.y + 0.5, SHOP_AREA.w - 1, SHOP_AREA.h - 1);
            if (u) ui.text('Отпустите здесь, чтобы продать за ' + g.cwSellValue(u), W / 2, SHOP_AREA.y + 8, { align: 'center', size: 13, bold: true, col: '#ffd0d0' });
          }
        },
        drawDrag(c, r) {
          if (this.drag.zone === 'inv') { const it = this.invAt(this.drag.i), p = this.drag.p; if (it && p) { c.globalAlpha = 0.85; ui.cwItemIcon(c, it, p.x - 14, p.y - 14, 28); c.globalAlpha = 1; } const t = zoneAt(p); if (t && t.zone !== 'shop') { const q = cell(t.zone, t.i); c.strokeStyle = '#ffffff'; c.strokeRect(q.x - 2.5, q.y - 2.5, q.s + 5, q.s + 5); } return; }
          const u = unitAt(this.drag.zone, this.drag.i), p = this.drag.p;
          if (!u || !p) return;
          c.globalAlpha = 0.8;
          ui.cwCell(c, u, p.x - 22, p.y - 22, 44);
          c.globalAlpha = 1;
          const t = zoneAt(p);
          if (t && t.zone !== 'shop') { const q = cell(t.zone, t.i); c.strokeStyle = '#ffffff'; c.strokeRect(q.x - 2.5, q.y - 2.5, q.s + 5, q.s + 5); }
        },
        drawBondInfo(c, r) {
          const st = g.cwBonds(r), bd = r.bond, x = 16, y = 36, w = 608, h = 414;
          if (!this.bondInfo.k) this.bondInfo.k = BOND_KEYS.find(k => st[k].n > 0) || BOND_KEYS[0];
          const k = this.bondInfo.k, B = CW.BONDS[k], s = st[k];
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Связи', border: K.gold });
          BOND_KEYS.forEach((key, i) => {
            const b = CW.BONDS[key], ss = st[key], ry = y + 22 + i * 14.5, on = key === k;
            if (i === 13) { c.fillStyle = K.line; c.fillRect(x + 10, ry - 3, 168, 1); }
            if (on) { c.fillStyle = 'rgba(255,212,113,0.2)'; c.fillRect(x + 8, ry - 1, 172, 14); }
            G.cwBondIcon(c, key, x + 12, ry, 10, ss.tier >= 0 ? b.col : '#5a5e72');
            ui.text(b.name, x + 25, ry, { size: 9, bold: on, col: ss.tier >= 0 ? b.col : ss.n ? C.cream : C.dim });
            if (ss.n) ui.text(ss.n + (ss.next ? '/' + ss.next : ''), x + 176, ry, { align: 'right', size: 9, bold: true, col: ss.tier >= 0 ? C.cream : C.sub });
            ui.hit(x + 8, ry - 1, 172, 14, () => { this.bondInfo.k = key; ui.sfx('select'); });
          });
          const dx = x + 196, dw = w - 210;
          c.fillStyle = K.line; c.fillRect(dx - 8, y + 10, 1, h - 40);
          let cy = y + 14;
          G.cwBondIcon(c, k, dx, cy - 2, 22, B.col);
          ui.text(B.name, dx + 28, cy, { size: 15, bold: true, serif: true, col: B.col });
          ui.text((B.kind === 'faction' ? 'Фракция' : B.kind === 'special' ? 'Особая связь' : 'Направление') + ' · ' + s.n + (s.next ? ' из ' + s.next + ' до следующей ступени' : ' членов'), dx, cy + 20, { size: 10, col: C.sub });
          cy += 40;
          for (const l of ui.wrap(B.text, dw, 10)) { ui.text(l, dx, cy, { size: 10, col: C.cream }); cy += 13; }
          cy += 6;
          B.tiers.forEach((t, j) => {
            const on = j <= s.tier, col = on ? CW.TIER_COL[Math.min(4, j + 1)] : C.dim;
            ui.diamond(dx + 4, cy + 5, 3.5, on ? col : '#2a3050');
            for (const l of ui.wrap(t, dw - 14, 10)) { ui.text(l, dx + 14, cy, { size: 10, col }); cy += 12; }
            cy += 2;
          });
          cy += 6;
          const prog = [];
          if (k === 'scholars') { const nx = B.rewards[bd.dnaAt]; prog.push('ДНК: ' + bd.dna + (nx ? ', следующая награда на ' + nx[0] : ', все награды получены')); }
          if (k === 'underworld') { const nx = B.rewards[bd.geoAt]; prog.push('Жила: ' + bd.geo + ' геомарроу' + (nx ? ', следующая награда на ' + nx[0] : ', все награды получены')); }
          if (k === 'fractsidus') prog.push('Эхо в запасе: ' + bd.echoes.length + (bd.echoes.length ? ' (' + bd.echoes.map(e => H.ENEMIES[e.id].name.split(',')[0]).join(', ') + ')' : ''));
          if (k === 'hares') prog.push(bd.order ? 'Заказ: ' + CW.ORDERS.find(o => o.id === bd.order).text : 'Заказ не выбран.');
          if (k === 'mentor' && !g.cwMentorOpen(r)) prog.push('Закрыта: её откроет стратегия «Вспышка: Отражение луны» или «Вспышка: Фамильный меч».');
          if (k === 'hares' && bd.debt) prog.push('Долг агентству: ' + bd.debt.amount + ' монет через ' + Math.max(0, bd.debt.due - r.step) + ' узла.');
          for (const p of prog) for (const l of ui.wrap(p, dw, 10)) { ui.text(l, dx, cy, { size: 10, bold: true, col: K.gold }); cy += 13; }
          const members = (B.members || CW.POOL.filter(id => CW.UNITS[id].bonds.includes(k))).slice().sort((a, b) => s.members.includes(b) - s.members.includes(a) || CW.UNITS[a].cost - CW.UNITS[b].cost);
          const my = y + h - 70;
          ui.text('Члены связи', dx, my - 14, { size: 10, bold: true, col: C.sub });
          if (B.kind !== 'special') { const tr = g.cwTracked(r).bonds.includes(k); ui.button(dx + dw - 132, my - 20, 132, 18, tr ? 'Отслеживается' : 'Отслеживать связь', () => { g.cwTrack('bonds', k); ui.sfx(tr ? 'cancel' : 'confirm'); }, { size: 9, active: tr }); }
          members.forEach((id, j) => { c.globalAlpha = s.members.includes(id) ? 1 : 0.35; ui.portraitCard(c, G.lookOf(CW.UNITS[id].kitOn, g), dx + (j % 14) * 28, my + Math.floor(j / 14) * 28, 24, { elem: H.CHARS[CW.UNITS[id].kitOn].elem, border: CW.COST_COL[CW.UNITS[id].cost] }); c.globalAlpha = 1; });
          ui.hints([['↑↓', 'Связь'], ['Esc', 'Закрыть']], x + w / 2, y + h - 18, { align: 'center' });
        },
        drawReceipt(c) {
          const R = this.receipt, rc = R.r;
          R.t += 1 / 60;
          R.coins = R.coins || 0;
          if (rc.interest > 0 && R.coins < 3 && R.t >= 0.15 * R.coins) { R.coins++; ui.sfx('coin'); }
          if ((ui.options.battleSpeed || 1) >= 3 && R.t > 3) { this.receipt = null; return; }
          const x = 220, y = 60, w = 200, lines = [], name = id => H.CHARS[CW.UNITS[id].kitOn].name;
          if (rc.harvest) lines.push(['Сбор', '+' + rc.coins]);
          else if (rc.kind === 'reward') lines.push(['Монеты с врагов', '+' + (rc.coins - (rc.bondGold || 0))]);
          else {
            lines.push(['Базовые монеты', '+' + rc.base], ['Серия побед', '+' + rc.streak], ['Проценты', '+' + rc.interest]);
            if (rc.branch != null) lines.push(['Встреча ' + CW.BRANCHES[rc.branch].roman, '+' + (rc.coins - (rc.bondGold || 0))]);
          }
          const ores = {};
          for (const o of rc.ores || []) { const e = ores[o.ore] || (ores[o.ore] = { n: 0, gold: 0 }); e.n++; e.gold += o.gold; }
          for (const [k, o] of Object.entries(ores)) lines.push([CW.ORES[k].name.replace(' кристальная руда', ' руда') + (o.n > 1 ? ' ×' + o.n : ''), '+' + o.gold, k]);
          if (rc.frenzyGold) lines.push(['Неистовый узел', '+' + rc.frenzyGold]);
          const extra = [];
          if (rc.exp || rc.encExp) extra.push(['Опыт', '+' + ((rc.exp || 0) + (rc.encExp || 0))]);
          for (const o of rc.ores || []) { if (o.hero) extra.push(['Из руды', name(o.hero) + (o.star === 2 ? ' 2★' : '')]); if (o.item) extra.push(['Из руды', ui.clip(g.cwItemName(o.item), 110, 10)]); }
          if (rc.item) extra.push(['Встреча', ui.clip(g.cwItemName(rc.item), 110, 10)]);
          if (rc.bondItems) extra.push(['Предметы связей', '+' + rc.bondItems]);
          if (rc.hero) extra.push(['Награда встречи', name(rc.hero)]);
          if (rc.free) extra.push(['Бесплатные обновления', '+' + rc.free]);
          if (rc.hpLoss) extra.push([rc.minFail ? 'НР (прогресс ниже 40%)' : 'НР команды', '−' + rc.hpLoss]);
          if (!rc.win && rc.kind !== 'reward') extra.push(['Прогресс', Math.round(rc.progress * 100) + '%']);
          if (rc.strat) extra.push(['Стратегия', 'выбор в подготовке']);
          if (rc.ace) extra.push(['Туз в рукаве', 'НР 40']);
          if (rc.planeDone && !rc.end) extra.push(['Измерение ' + rc.planeDone, rc.win ? 'босс повержен' : 'закрыто']);
          if (rc.dna) extra.push(['ДНК', '+' + rc.dna]);
          if (rc.geo) extra.push(['Геомарроу', '+' + rc.geo]);
          if (rc.echoes) extra.push(['Эхо собрано', '+' + rc.echoes]);
          if (rc.order) extra.push(['Заказ', rc.order.done ? 'выполнен' : 'провален']);
          if (rc.jury) extra.push(['Оценка жюри', 'руда']);
          for (const l of rc.bondLines || []) extra.push(['Награда связи', l]);
          for (const n of rc.bondHeroes || []) extra.push(['Герой связи', n]);
          if (rc.bondGold) lines.push(['Связи', '+' + rc.bondGold]);
          const paid = run() && run().debtPaid;
          if (paid) { extra.push(['Долг агентству', '−' + paid.gold + (paid.hp ? ', НР −' + paid.hp : '')]); run().debtPaid = null; }
          const rb = run() && run().bonus;
          if (rb && !rc.end) extra.push(['Быстрая игра', '+' + rb.gold + ' мон., +' + rb.exp + ' оп.']);
          const h = 116 + (lines.length + extra.length) * 16;
          c.fillStyle = 'rgba(2,3,12,0.45)'; c.fillRect(0, 0, W, HGT);
          c.fillStyle = '#1a1206'; c.fillRect(x + 3, y + 3, w, h);
          c.fillStyle = K.paper; c.fillRect(x, y, w, h);
          for (let i = 0; i < w; i += 6) { c.fillStyle = K.paper; c.fillRect(x + i, y + h, 3, 2); }
          ui.text('КВИТАНЦИЯ УЗЛА ' + (rc.node + 1), x + w / 2, y + 10, { align: 'center', size: 11, bold: true, col: K.ink, shadow: false });
          c.fillStyle = '#b8a888'; c.fillRect(x + 10, y + 26, w - 20, 1);
          let ly = y + 34;
          for (const [a, b, ic] of lines) { const ox = ic && G.cwOreIcon ? (G.cwOreIcon(c, ic, x + 10, ly - 1, 12), 14) : 0; ui.text(a, x + 12 + ox, ly, { size: 10, col: K.ink, shadow: false }); ui.text(b, x + w - 12, ly, { align: 'right', size: 10, bold: true, col: K.ink, shadow: false }); ly += 16; }
          c.fillStyle = K.ink; c.fillRect(x + 10, ly, w - 20, 1); ly += 6;
          ui.text('Итого', x + 12, ly, { size: 11, bold: true, col: K.ink, shadow: false });
          ui.text('+' + rc.total, x + w - 12, ly, { align: 'right', size: 12, bold: true, col: K.ink, shadow: false }); ly += 20;
          for (const [a, b] of extra) { ui.text(a, x + 12, ly, { size: 10, col: '#5a4a38', shadow: false }); ui.text(b, x + w - 12, ly, { align: 'right', size: 10, bold: true, col: b[0] === '−' ? K.stamp : '#5a4a38', shadow: false }); ly += 16; }
          c.save();
          c.translate(x + w / 2, y + h - 18);
          c.rotate(-0.18);
          c.globalAlpha = 0.85;
          const word = rc.win ? 'ОПЛАЧЕНО' : 'ПРОСРОЧЕНО', sw = ui.measure(word, 12, true) + 12;
          c.strokeStyle = K.stamp; c.lineWidth = 2; c.strokeRect(-sw / 2, -9, sw, 18); c.lineWidth = 1;
          ui.text(word, 0, -6, { align: 'center', size: 12, bold: true, col: K.stamp, shadow: false });
          c.restore();
          c.fillStyle = 'rgba(2,3,12,0.85)'; c.fillRect(W / 2 - 50, y + h + 8, 100, 20);
          ui.hints([['Enter', 'Дальше']], W / 2, y + h + 12, { align: 'center' });
          ui.hit(0, 0, W, HGT, () => { this.receipt = null; ui.sfx('select'); });
        },
        curUnit(r) {
          const z = this.cur.zone;
          if (z === 'shop') { const id = r.shop[this.cur.i]; return id ? { id, star: 1 } : null; }
          return r.board[z] ? r.board[z][this.cur.i] : null;
        },
        press(z, i, btn, q) {
          this.cur = { zone: z, i };
          if (btn === 2) { const cu = this.curUnit(run()); if (cu) ui.openCwCard(cu); return; }
          const r = run(), u = r && r.board[z] && r.board[z][i];
          if (u && z === 'bench' && this.lastClick != null && ui.t - this.lastClick < 0.35 && this.lastAt === z + i) { this.lastClick = null; this.place(); return; }
          if (z === 'inv') { if (this.held && this.held.zone === 'inv') { this.applyItem(this.held.i, { zone: z, i }); this.held = null; return; } }
          else if (!u) { if (this.held) this.dropHeld(z, i); return; }
          else if (this.held && this.held.zone === 'inv') { this.applyItem(this.held.i, { zone: z, i }); this.held = null; return; }
          if (!q) return;
          if (z === 'inv' && !this.invAt(i)) { if (this.held && this.held.zone === 'inv') { this.applyItem(this.held.i, { zone: z, i }); this.held = null; } return; }
          const d = this.drag = { zone: z, i, p: q, start: q, moved: false };
          ui.drag = {
            move: p => { d.p = p; if (Math.abs(p.x - d.start.x) + Math.abs(p.y - d.start.y) > 4) d.moved = true; },
            drop: p => {
              this.drag = null;
              if (d.moved) { this.lastClick = null; this.dropAt(d, p); }
              else { this.lastClick = ui.t; this.lastAt = z + i; }
            }
          };
        },
        pressPeppy(btn) {
          const r = run();
          this.cur = { zone: 'peppy', i: 0 };
          if (this.held && this.held.zone === 'inv') { this.applyItem(this.held.i, { zone: 'peppy', i: 0 }); this.held = null; return; }
          if (btn === 2) { const err = g.cwPeppyTake(); if (err) ui.cwSpecialSay(err); else ui.sfx('cancel'); return; }
          ui.toast('Пеппи: ' + g.cwSpecial(r).peppy.length + ' / ' + g.cwPeppySlots(r) + ' эмблем. Правая кнопка или Del: снять.');
          ui.sfx('select');
        },
        dropAt(d, p) {
          const t = zoneAt(p);
          if (!t) return;
          if (d.zone === 'inv') { this.applyItem(d.i, t); return; }
          if (t.zone === 'inv' || t.zone === 'peppy') return;
          if (t.zone === 'shop') { this.sellAt(d.zone, d.i); return; }
          const err = g.cwMove(d.zone, d.i, t.zone, t.i);
          if (err && err !== 'same') ui.cwSay(err); else if (!err) { ui.sfx('select'); this.cur = t; }
        },
        dropHeld(z, i) {
          const h = this.held;
          this.held = null;
          if (h.zone === 'inv') { this.applyItem(h.i, { zone: z, i }); return; }
          if (z === 'inv') return;
          const err = g.cwMove(h.zone, h.i, z, i);
          if (err && err !== 'same') ui.cwSay(err); else ui.sfx('select');
        },
        buy(i) {
          const err = g.cwCanBuy(i);
          if (err) { if (err !== 'empty') ui.cwSay(err); else ui.sfx('deny'); return; }
          const res = g.cwBuy(i);
          ui.sfx('confirm');
          this.mergeFx(res.merged);
        },
        mergeFx(list) {
          for (const m of list || []) { ui.sfx(m.star >= 3 ? 'star5' : 'star4'); ui.toast(H.CHARS[CW.UNITS[m.id].kitOn].name + ': ' + m.star + '★'); }
        },
        sellAt(z, i) {
          const v = g.cwSell(z, i);
          if (!v) { if (run().phase === 'replay') ui.cwSay('replay'); else ui.sfx('deny'); return; }
          if (this.held && this.held.zone === z && this.held.i === i) this.held = null;
          ui.sfx('coin');
          ui.toast('Продано за ' + v);
        },
        buyExp() {
          const r = run();
          if (r.phase === 'replay') { ui.cwSay('replay'); return; }
          if (r.lvl >= CW.lvlMax(r)) { ui.cwSay('max'); return; }
          const res = g.cwBuyExp();
          if (!res) { ui.cwSay('gold'); return; }
          ui.sfx(res.ups ? 'levelup' : 'select');
          if (res.ups) ui.toast('Уровень ' + r.lvl + ': команда до ' + g.cwTeamSize(r) + ' героев');
        },
        refresh() { if (g.cwRefresh()) ui.sfx('shuffle'); else ui.cwSay(run().phase === 'replay' ? 'replay' : 'gold'); },
        harvest() {
          const rc = g.cwHarvest();
          if (!rc) { ui.sfx('deny'); return; }
          ui.sfx('chest');
          if (rc.end) { ui.cwAfterBattle({ cw: rc }); return; }
          this.receipt = { r: rc, t: 0 };
        },
        lock() { ui.sfx(g.cwToggleLock() ? 'confirm' : 'cancel'); },
        place() {
          const z = this.cur.zone;
          if (z === 'shop') return;
          const err = g.cwPlace(z, this.cur.i);
          if (err) ui.cwSay(err); else ui.sfx('select');
        },
        go() {
          const r = run();
          const kind = r.phase === 'replay' ? 'replay' : g.cwNodeKind(r);
          if (kind !== 'supply' && !r.board.on.some(Boolean)) { ui.cwSay('field'); return; }
          if (kind === 'supply') { g.cwGo(); ui.openCwSupply(); return; }
          if (kind === 'enc') { g.cwGo(); ui.openCwEncounter(); return; }
          ui.cwLaunch(() => g.cwGo());
        },
        leave() {
          ui.screens = ui.screens.filter(s => s !== scr);
          g.emit({ t: 'autosave' });
          ui.drainGameEvents();
          if (!ui.screens.some(s => s.cw)) ui.openCwHub();
          ui.sfx('cancel');
        },
        move(k) {
          if (this.cur.zone === 'peppy') this.cur = { zone: 'bench', i: 0 };
          const z = this.cur.zone, n = COUNT[z];
          if (k === 'left' && z === 'bench' && this.cur.i === 0 && ui.cwPeppyShown(run())) { this.cur = { zone: 'peppy', i: 0 }; ui.sfx('select'); return; }
          if (k === 'left') this.cur.i = (this.cur.i + n - 1) % n;
          if (k === 'right') this.cur.i = (this.cur.i + 1) % n;
          if (k === 'up' || k === 'down') {
            const zi = ZONES.indexOf(z) + (k === 'up' ? -1 : 1), to = ZONES[(zi + ZONES.length) % ZONES.length], m = COUNT[to];
            this.cur = { zone: to, i: Math.round(this.cur.i * (m - 1) / Math.max(1, n - 1)) };
          }
          ui.sfx('select');
        },
        key(k, code) {
          if (this.receipt) { if (k || code) { this.receipt = null; ui.sfx('select'); } return; }
          if (this.bondInfo) {
            if (k === 'up' || k === 'down') { const i = BOND_KEYS.indexOf(this.bondInfo.k); this.bondInfo.k = BOND_KEYS[(i + (k === 'up' ? BOND_KEYS.length - 1 : 1)) % BOND_KEYS.length]; ui.sfx('select'); }
            if (k === 'back' || k === 'ok' || code === 'KeyB') { this.bondInfo = null; ui.sfx('cancel'); }
            return;
          }
          if (code === 'Space') { this.go(); return; }
          if (/^Digit[1-5]$/.test(code)) { const i = +code.slice(5) - 1; this.cur = { zone: 'shop', i }; this.buy(i); return; }
          if (code === 'KeyF') { this.buyExp(); return; }
          if (code === 'KeyH') { this.harvest(); return; }
          if (code === 'KeyO') { if (run().bond.orders) ui.openCwOrders(); else ui.sfx('deny'); return; }
          if (code === 'KeyR') { this.refresh(); return; }
          if (code === 'KeyL') { this.lock(); return; }
          if (code === 'KeyB') { this.bondInfo = { k: null }; ui.sfx('select'); return; }
          if (code === 'KeyT') { ui.openCwStratList(); ui.sfx('select'); return; }
          if (code === 'KeyC') { const cu = this.curUnit(run()); if (cu) ui.openCwCard(cu); else ui.sfx('deny'); return; }
          if (code === 'KeyI') { this.cur = this.cur.zone === 'inv' ? { zone: 'shop', i: 0 } : { zone: 'inv', i: 0 }; ui.sfx('select'); return; }
          if (this.cur.zone === 'inv' && ['up', 'down', 'left', 'right'].includes(k)) {
            const i = this.cur.i, col = i % 5, row = Math.floor(i / 5);
            if (k === 'left') this.cur.i = row * 5 + (col + 4) % 5;
            if (k === 'right') this.cur.i = row * 5 + (col + 1) % 5;
            if (k === 'up') { if (row > 0) this.cur.i -= 5; else if (this.invTop > 0) this.invTop--; }
            if (k === 'down') { if (row < 2) this.cur.i += 5; else this.invTop++; }
            ui.sfx('select');
            return;
          }
          if (code === 'Tab') { this.cur = this.cur.zone === 'shop' ? { zone: 'bench', i: 0 } : { zone: 'shop', i: 0 }; ui.sfx('select'); return; }
          if (code === 'Delete') { if (this.cur.zone === 'peppy') this.pressPeppy(2); else if (this.cur.zone !== 'shop') this.sellAt(this.cur.zone, this.cur.i); return; }
          if (code === 'KeyX') { this.held = null; this.place(); return; }
          if (['up', 'down', 'left', 'right'].includes(k)) { this.move(k); return; }
          if (k === 'ok') {
            const z = this.cur.zone, i = this.cur.i;
            if (z === 'shop') { this.held = null; this.buy(i); return; }
            if (z === 'peppy') { this.pressPeppy(0); return; }
            if (this.held) { this.dropHeld(z, i); return; }
            if (z === 'inv') { const it = this.invAt(i); if (!it) { ui.sfx('deny'); return; } if (CW.ITEMS[it.id].on === 'self') { this.itemSay(g.cwOpenBox(this.invIndex(i))); return; } this.held = { zone: 'inv', i }; ui.sfx('select'); return; }
            if (unitAt(z, i)) { this.held = { zone: z, i }; ui.sfx('select'); } else ui.sfx('deny');
            return;
          }
          if (k === 'back') { if (this.held) { this.held = null; ui.sfx('cancel'); } else this.leave(); }
        }
      };
      return this.push(scr);
    },

    cwBoardBack(c) {
      const gr = c.createLinearGradient(0, 0, 0, HGT);
      gr.addColorStop(0, '#0c1236'); gr.addColorStop(1, '#03040e');
      c.fillStyle = gr; c.fillRect(0, 0, W, HGT);
      c.fillStyle = this.dither(); c.fillRect(0, 0, W, HGT);
      c.fillStyle = 'rgba(255,212,113,0.05)';
      for (let x = 0; x < W; x += 32) c.fillRect(x, 0, 1, HGT);
      for (let y = 0; y < HGT; y += 32) c.fillRect(0, y, W, 1);
    },

    cwLaunch(fn) {
      const hub = this.screens.find(s => s.cw && s.onClose);
      this.screens = this.screens.filter(s => !s.cw);
      if (hub) this.finishPending();
      fn();
      this.drainGameEvents();
    },

    openCwEncounter() {
      const ui = this, g = this.game;
      const scr = {
        full: true, cw: true, enc: true, sel: 0,
        draw(c) {
          const r = g.cwRun();
          if (!r || r.phase !== 'enc') { ui.screens = ui.screens.filter(s => s !== scr); return; }
          ui.cwBoardBack(c);
          const list = r.branches || [], O = g.cwOpp(r), final = list.length > 2;
          ui.plate(16, 14, final ? 'Финальная встреча' : 'Встреча');
          ui.text((O ? O.name : '') + ' · отсчёт ' + g.cwCountdown(r, 'enc'), 16, 40, { size: 11, col: C.sub });
          if (r.tier >= 4) ui.text('Награду даёт только прогресс от 40%.', W - 16, 40, { align: 'right', size: 11, bold: true, col: C.bad });
          const cw = final ? 146 : 280, gap = final ? 8 : 40, x0 = (W - (cw * list.length + gap * (list.length - 1))) / 2;
          c.strokeStyle = '#6a5a3a'; c.lineWidth = 3;
          list.forEach((b, i) => { const x = x0 + i * (cw + gap) + cw / 2; c.beginPath(); c.moveTo(W / 2, 400); c.lineTo(W / 2, 360); c.lineTo(x, 300); c.stroke(); });
          c.lineWidth = 1;
          list.forEach((bi, i) => {
            const B = CW.BRANCHES[bi], x = x0 + i * (cw + gap), y = 80, on = i === this.sel, hard = bi >= 2;
            ui.win(x, y + (on ? -6 : 0), cw, 220, { alpha: 0.92, corners: false, border: on ? K.gold : hard ? '#c86060' : '#6cce9f' });
            ui.text(B.roman, x + cw / 2, y + 16 + (on ? -6 : 0), { align: 'center', size: 30, bold: true, serif: true, col: hard ? '#ff9a8a' : '#a8f0c8' });
            ui.text(hard ? 'Трудная ветвь' : 'Лёгкая ветвь', x + cw / 2, y + 60 + (on ? -6 : 0), { align: 'center', size: 11, bold: true, col: C.cream });
            ui.text(B.diff ? 'Сложность +' + B.diff : 'Обычные враги', x + cw / 2, y + 78 + (on ? -6 : 0), { align: 'center', size: 10, col: B.diff ? C.bad : C.sub });
            const lines = ui.wrap(B.text + ' (+' + (B.gold + r.plane * 2) + ' монет' + (B.exp ? ', +' + B.exp + ' опыта' : '') + (B.free ? ', +' + B.free + ' обновления' : '') + ').', cw - 20, 10);
            lines.slice(0, 5).forEach((l, j) => ui.text(l, x + 10, y + 104 + j * 13 + (on ? -6 : 0), { size: 10, col: '#e0e4f4' }));
            ui.hit(x, y - 6, cw, 226, () => { if (this.sel === i) this.take(); else { this.sel = i; ui.sfx('select'); } });
          });
          ui.button(W / 2 - 90, 420, 180, 26, 'Выбрать ветвь', () => this.take(), { active: true, bold: true, icon: 'warp' });
          if (g.cwPerkOn('branchRoll')) ui.button(W / 2 + 100, 420, 130, 26, r.branchRolled ? 'Перетасовано' : 'Перетасовать · R', () => this.roll(), { disabled: !!r.branchRolled, size: 10 });
          ui.hints([['←→', 'Ветвь'], ['Enter', 'В бой']], W / 2, HGT - 18, { align: 'center' });
        },
        take() { const i = this.sel; ui.sfx('confirm'); ui.cwLaunch(() => g.cwPickBranch(i)); },
        roll() { if (g.cwRerollBranches()) { ui.sfx('deny'); return; } this.sel = 0; ui.sfx('shuffle'); },
        key(k, code) {
          if (code === 'KeyR') { this.roll(); return; }
          const n = ((g.cwRun() || {}).branches || []).length;
          if ((k === 'left' || k === 'right') && n) { this.sel = (this.sel + (k === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); }
          if (k === 'ok') this.take();
        }
      };
      return this.push(scr);
    },

    openCwOrders() {
      const ui = this, g = this.game;
      this.push({
        cw: true, sel: 0,
        draw(c) {
          const r = g.cwRun();
          if (!r || !r.bond.orders) { ui.screens = ui.screens.filter(s => s !== this); return; }
          const B = CW.BONDS.hares, t = g.cwBonds(r).hares.tier;
          ui.win(80, 90, 480, 300, { title: 'Агентство «Хитрые зайцы»', border: '#ff9a6a' });
          ui.text('Выберите заказ на этот бой. Выполненный заказ платит ' + B.pay[Math.max(0, t)] + ' монет' + (B.free[Math.max(0, t)] ? ' и 1 обновление' : '') + '.', 320, 112, { align: 'center', size: 11, col: C.cream });
          r.bond.orders.forEach((id, i) => {
            const O = CW.ORDERS.find(o => o.id === id), x = 96 + i * 152, y = 138, on = i === this.sel, taken = r.bond.order === id;
            c.fillStyle = '#000000'; c.fillRect(x - 1, y - 1, 142, 132);
            c.fillStyle = taken ? '#f6e0c8' : on ? '#f4ecd8' : '#cfc6b0'; c.fillRect(x, y, 140, 130);
            ui.text('ЗАКАЗ ' + (i + 1), x + 70, y + 8, { align: 'center', size: 10, bold: true, col: '#7a3a1a', shadow: false });
            ui.wrap(O.text, 120, 11).forEach((l, j) => ui.text(l, x + 10, y + 30 + j * 14, { size: 11, bold: true, col: K.ink, shadow: false }));
            if (taken) { c.save(); c.translate(x + 70, y + 104); c.rotate(-0.15); c.strokeStyle = '#c8323a'; c.lineWidth = 2; c.strokeRect(-40, -10, 80, 20); c.lineWidth = 1; ui.text('ВЗЯТ', 0, -7, { align: 'center', size: 12, bold: true, col: '#c8323a', shadow: false }); c.restore(); }
            if (on) { c.strokeStyle = K.gold; c.lineWidth = 2; c.strokeRect(x - 3, y - 3, 146, 136); c.lineWidth = 1; }
            ui.hit(x, y, 140, 130, () => { this.sel = i; this.take(); });
          });
          if (t >= 1) {
            const can = g.cwCanAdvance(r);
            ui.button(96, 290, 448, 24, can ? 'Аванс Николь: +' + B.advance + ' монет сейчас, ' + B.debt + ' вернуть через ' + B.debtNodes + ' узла' : r.bond.debt ? 'Аванс взят: вернуть ' + r.bond.debt.amount + ' через ' + Math.max(0, r.bond.debt.due - r.step) + ' узла' : 'Аванс уже брали в этом измерении', () => this.advance(), { disabled: !can, size: 10 });
          }
          ui.hints([['←→', 'Заказ'], ['Enter', 'Взять'], ['N', 'Аванс'], ['Esc', 'Назад']], 320, 360, { align: 'center' });
        },
        take() { const r = g.cwRun(); if (g.cwPickOrder(r.bond.orders[this.sel])) { ui.sfx('confirm'); ui.screens = ui.screens.filter(s => s !== this); } else ui.sfx('deny'); },
        advance() { if (g.cwTakeAdvance()) { ui.sfx('chest'); ui.toast('Аванс Николь: +' + CW.BONDS.hares.advance + ' монет'); } else ui.sfx('deny'); },
        key(k, code) {
          if (k === 'left' || k === 'right') { this.sel = (this.sel + (k === 'left' ? 2 : 1)) % 3; ui.sfx('select'); }
          if (code === 'KeyN') this.advance();
          if (k === 'ok') this.take();
          if (k === 'back') ui.pop();
        }
      });
    },

    cwItemGlyph(c, id, x, y, s, col) {
      const m = s / 16;
      c.fillStyle = col;
      const R = (a, b, w, h) => c.fillRect(Math.round(x + a * m), Math.round(y + b * m), Math.max(1, Math.round(w * m)), Math.max(1, Math.round(h * m)));
      if (id === 'skates') { R(3, 4, 9, 5); R(3, 9, 11, 2); R(4, 12, 2, 2); R(10, 12, 2, 2); }
      else if (id === 'knife') { for (let i = 0; i < 8; i++) R(4 + i, 11 - i, 2, 2); R(2, 12, 3, 3); }
      else if (id === 'pistol') { R(3, 5, 10, 3); R(4, 8, 3, 5); R(8, 8, 2, 2); }
      else if (id === 'star') { R(7, 2, 2, 12); R(2, 7, 12, 2); R(4, 4, 8, 8); }
      else if (id === 'flower') { R(6, 2, 4, 4); R(2, 6, 4, 4); R(10, 6, 4, 4); R(6, 10, 4, 4); R(7, 7, 2, 2); }
      else if (id === 'armor') { R(3, 3, 10, 6); R(4, 9, 8, 2); R(6, 11, 4, 2); }
      else if (id === 'drill') { R(3, 4, 10, 2); R(5, 6, 6, 2); R(6, 8, 4, 2); R(7, 10, 2, 3); }
      else { R(5, 2, 6, 2); R(4, 4, 8, 10); }
    },

    cwItemIcon(c, it, x, y, s, o = {}) {
      const D = CW.ITEMS[it.id];
      if (!D) return;
      c.fillStyle = '#000000'; c.fillRect(x - 1, y - 1, s + 2, s + 2);
      const art = G.cwItemCanvas ? G.cwItemCanvas(it.id, Math.max(8, Math.round(s))) : null;
      if (art) {
        if (D.kind === 'adv') {
          const [a, b] = D.from.map(k => CW.ITEMS[k].col);
          c.fillStyle = G.dark(a, 0.55); c.beginPath(); c.moveTo(x, y); c.lineTo(x + s, y); c.lineTo(x, y + s); c.closePath(); c.fill();
          c.fillStyle = G.dark(b, 0.55); c.beginPath(); c.moveTo(x + s, y); c.lineTo(x + s, y + s); c.lineTo(x, y + s); c.closePath(); c.fill();
        } else { c.fillStyle = D.kind === 'gem' || it.id === 'goldTrash' ? '#2a1a06' : D.kind === 'emblem' ? '#0a0c1e' : '#141a3a'; c.fillRect(x, y, s, s); }
        const was = c.imageSmoothingEnabled;
        c.imageSmoothingEnabled = false;
        c.drawImage(art, Math.round(x), Math.round(y), s, s);
        c.imageSmoothingEnabled = was;
      } else if (D.kind === 'basic') {
        c.fillStyle = '#141a3a'; c.fillRect(x, y, s, s);
        this.cwItemGlyph(c, it.id, x, y, s, D.col);
      } else if (D.kind === 'adv') {
        const [a, b] = D.from.map(k => CW.ITEMS[k].col);
        c.fillStyle = a; c.beginPath(); c.moveTo(x, y); c.lineTo(x + s, y); c.lineTo(x, y + s); c.closePath(); c.fill();
        c.fillStyle = b; c.beginPath(); c.moveTo(x + s, y); c.lineTo(x + s, y + s); c.lineTo(x, y + s); c.closePath(); c.fill();
        c.fillStyle = 'rgba(8,10,30,0.55)'; c.fillRect(x + 2, y + 2, s - 4, s - 4);
        this.cwItemGlyph(c, D.from[0], x + s * 0.15, y + s * 0.15, s * 0.7, '#ffffff');
      } else if (D.kind === 'emblem') {
        c.fillStyle = '#141a3a'; c.fillRect(x, y, s, s);
        const col = (CW.BONDS[D.bond] || {}).col || '#ffffff';
        this.diamond(x + s / 2, y + s / 2, s * 0.42, col, '#000000');
        this.text(CW.BOND_NAMES[D.bond][0], x + s / 2, y + s / 2 - Math.max(4, s * 0.25), { align: 'center', size: Math.max(7, Math.round(s * 0.42)), bold: true, col: '#141018', shadow: false });
      } else if (D.kind === 'diamond') {
        c.fillStyle = '#141a3a'; c.fillRect(x, y, s, s);
        this.diamond(x + s / 2, y + s / 2, s * 0.4, D.col, '#ffffff');
      } else if (D.kind === 'gem') {
        c.fillStyle = '#2a1a06'; c.fillRect(x, y, s, s);
        this.cwDiamond(x + s / 2, y + s * 0.48, s * 0.36, 0.4);
      } else if (D.kind === 'trash') {
        c.fillStyle = '#141a3a'; c.fillRect(x, y, s, s);
        c.fillStyle = D.col; c.beginPath(); c.arc(x + s / 2, y + s * 0.6, s * 0.32, 0, Math.PI * 2); c.fill(); c.fillRect(x + s * 0.42, y + s * 0.15, s * 0.16, s * 0.2);
      } else {
        c.fillStyle = '#20243e'; c.fillRect(x, y, s, s);
        c.fillStyle = D.col; c.fillRect(x + 2, y + 2, s - 4, s - 4);
        this.text(D.name[0], x + s / 2, y + s / 2 - Math.max(4, s * 0.25), { align: 'center', size: Math.max(7, Math.round(s * 0.45)), bold: true, col: '#141018', shadow: false });
      }
      c.strokeStyle = it.sp ? '#ffd471' : o.border || '#3a4470'; c.lineWidth = it.sp ? 2 : 1; c.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1); c.lineWidth = 1;
      if (o.rec) this.diamond(x + s - 3, y + 3, 3, '#ffd471', '#1a1208');
    },

    cwItemLines(it) {
      const D = CW.ITEMS[it.id], out = [];
      const stats = Object.entries(D.stats).map(([k, v]) => { const n = Array.isArray(v) ? v[it.sp ? 1 : 0] : v; return CW.ITEM_STAT_NAMES[k] + ' ' + (k === 'en' ? '+' + n : '+' + Math.round(n * 100) + '%'); });
      if (stats.length) out.push(stats.join(', '));
      if (D.text) {
        const p = Array.isArray(D.p) ? D.p[it.sp ? 1 : 0] : D.p, q = Array.isArray(D.q) ? D.q[it.sp ? 1 : 0] : D.q;
        const f = v => (v < 1 && v > 0 ? Math.round(v * 100) : v);
        out.push(D.text.replace(/#00%/g, (p * 100) + '%').replace(/#/g, f(p)).replace(/@/g, f(q)));
      }
      if (D.from) out.push('Из: ' + D.from.map(k => CW.ITEMS[k].name).join(' + '));
      return out;
    },

    openCwChoice() {
      const ui = this, g = this.game;
      return this.push({
        cw: true, choice: true, sel: 0,
        draw(c) {
          const r = g.cwRun(), ch = r && r.choice;
          if (!ch) { ui.screens = ui.screens.filter(s => s !== this); return; }
          const n = ch.options.length, w = 140, gap = 12, x0 = W / 2 - (n * w + (n - 1) * gap) / 2;
          ui.win(x0 - 20, 110, n * w + (n - 1) * gap + 40, 270, { title: ch.kind === 'p1' ? 'Первый игрок: выберите одно' : 'Выберите одно', border: K.gold });
          ch.options.forEach((o, i) => {
            const x = x0 + i * (w + gap), y = 136, on = i === this.sel;
            c.fillStyle = on ? 'rgba(255,212,113,0.15)' : 'rgba(6,10,34,0.8)'; c.fillRect(x, y, w, 200);
            c.strokeStyle = on ? K.gold : '#2a3460'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 199);
            if (o.hero) {
              const d = CW.UNITS[o.hero];
              ui.portraitCard(c, G.lookOf(d.kitOn, g), x + w / 2 - 30, y + 12, 60, { elem: H.CHARS[d.kitOn].elem, border: CW.COST_COL[d.cost] });
              ui.text(ui.clip(H.CHARS[d.kitOn].name, w - 10, 11, true), x + w / 2, y + 80, { align: 'center', size: 11, bold: true, col: C.cream });
              ui.text(CW.POS[d.pos], x + w / 2, y + 96, { align: 'center', size: 9, col: C.sub });
              d.bonds.slice(0, 3).forEach((k, j) => ui.text(ui.clip(CW.BOND_NAMES[k], w - 12, 9), x + 8, y + 116 + j * 12, { size: 9, col: CW.BONDS[k] ? CW.BONDS[k].col : C.dim }));
            } else if (o.p1 || o.hack) ui.cwChoiceSpecial(c, o, x, y, w);
            else {
              ui.cwItemIcon(c, o, x + w / 2 - 20, y + 12, 40);
              ui.wrap(g.cwItemName(o), w - 12, 10, true).slice(0, 2).forEach((l, j) => ui.text(l, x + w / 2, y + 60 + j * 12, { align: 'center', size: 10, bold: true, col: o.sp ? K.gold : C.cream }));
              let yy = y + 90;
              for (const l of ui.cwItemLines(o)) for (const s of ui.wrap(l, w - 12, 9).slice(0, 4)) { if (yy > y + 190) break; ui.text(s, x + 6, yy, { size: 9, col: '#d8dcf0' }); yy += 11; }
            }
            ui.hit(x, y, w, 200, () => { if (this.sel === i) this.take(); else { this.sel = i; ui.sfx('select'); } });
          });
          ui.hints([['←→', 'Выбор'], ['Enter', 'Взять'], ['Esc', 'Позже']], W / 2, 350, { align: 'center' });
        },
        take() {
          const res = g.cwChoose(this.sel);
          if (res === 'bench') { ui.cwSay('bench'); return; }
          if (res === 'empty') { ui.sfx('deny'); return; }
          ui.sfx('confirm');
          if (res && res.promoted) ui.toast('Серебряный Волк: Leveling_Solo, стоимость 5');
          if (res && res.hack) ui.toast('Компонент взлома: ' + CW.HACKS[res.hack].name);
          if (res && res.merged) for (const m of res.merged) ui.toast(H.CHARS[CW.UNITS[m.id].kitOn].name + ': ' + m.star + '★');
        },
        key(k) {
          const r = g.cwRun(), n = r && r.choice ? r.choice.options.length : 0;
          if ((k === 'left' || k === 'right') && n) { this.sel = (this.sel + (k === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); }
          if (k === 'ok') this.take();
          if (k === 'back') { g.cwCancelChoice(); ui.sfx('cancel'); }
        }
      });
    },

    openCwCard(u) {
      const ui = this, g = this.game;
      if (!u || !CW.UNITS[u.id]) return null;
      return this.push({
        cw: true, card: true, top: 0,
        draw(c) {
          const d = CW.UNITS[u.id], kit = H.CHARS[d.kitOn], S = CW.STARS[d.cost], x = 40, y = 30, w = 560, h = 420;
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: kit.name, border: CW.COST_COL[d.cost] });
          c.fillStyle = '#0a0e2a'; c.fillRect(x + 14, y + 18, 132, 132);
          G.drawBust(c, G.lookOf(d.kitOn, g), x + 16, y + 20, 2);
          ui.cwCostChip(x + 14, y + 156, d.cost);
          ui.cwStars(x + 34, y + 162, u.star || 1, 5);
          ui.text(CW.POS[d.pos], x + 14, y + 176, { size: 10, col: C.sub });
          ui.text(CW.ROLE[d.role], x + 14, y + 190, { size: 10, col: C.sub });
          d.bonds.forEach((k, j) => { G.cwBondIcon(c, k, x + 14, y + 207 + j * 12, 10); ui.text(ui.clip(CW.BOND_NAMES[k], 118, 9), x + 27, y + 208 + j * 12, { size: 9, bold: !!CW.BONDS[k], col: CW.BONDS[k] ? CW.BONDS[k].col : C.dim }); });
          ui.cwSpecialCardButton(g.cwRun(), u, x + 14, y + 214 + d.bonds.length * 12);
          const stars = S.pow.length, cols = ['Звёзды'].concat(Array.from({ length: stars }, (_, i) => (i + 1) + '★'));
          const rows = [['НР', (d.hpHero ? S.hpH : S.hp).map(v => '+' + Math.round(v * 100) + '%')], ['Сила', (d.hpHero ? S.powH : S.pow).map(String)], ['Скорость', S.spd.map(v => '+' + Math.round(v * 100) + '%')]];
          if (d.role === 'l') rows.push(['Исцеление', CW.HEAL_POW[d.cost].map(String)]);
          if (d.role === 's') rows.push(['Щит', CW.SHIELD_POW[d.cost].map(String)]);
          const tx = x + 160;
          cols.forEach((t, i) => ui.text(t, tx + (i ? 70 + (i - 1) * 50 : 0), y + 18, { size: 9, bold: true, col: i === (u.star || 1) ? K.gold : C.sub }));
          rows.forEach(([n, vals], r) => { ui.text(n, tx, y + 32 + r * 13, { size: 9, col: C.cream }); vals.forEach((v, i) => ui.text(v, tx + 70 + i * 50, y + 32 + r * 13, { size: 9, bold: i + 1 === (u.star || 1), col: i + 1 === (u.star || 1) ? K.gold : '#c8d0e8' })); });
          let cy = y + 40 + rows.length * 13;
          const live = !!CW.KITS[u.id];
          ui.text('Совершенствование', tx, cy, { size: 11, bold: true, col: K.gold });
          cy += 16;
          const lines = [];
          for (const p of (CW.KIT_TEXT[u.id] || []).concat(ui.cwSpecialLines(u))) { for (const l of ui.wrap(p, w - 180, 10)) lines.push(l); lines.push(''); }
          const max = 17, top = Math.max(0, Math.min(this.top, lines.length - max));
          this.top = top;
          lines.slice(top, top + max).forEach((l, i) => ui.text(l, tx, cy + i * 12, { size: 10, col: live ? '#e0e4f4' : C.dim }));
          if (lines.length > max) ui.text((top + 1) + '-' + Math.min(lines.length, top + max) + ' / ' + lines.length, x + w - 16, cy - 16, { align: 'right', size: 9, col: C.sub });
          ui.wheelZone(tx, cy, w - 180, max * 12, dd => { this.top = Math.max(0, this.top + dd * 2); });
          const gy = y + h - 64;
          ui.text('Рекомендованное снаряжение', x + 14, gy, { size: 10, bold: true, col: C.sub });
          g.cwRec(u.id).forEach((id, i) => { ui.cwItemIcon(c, { id }, x + 14 + i * 150, gy + 16, 22); ui.text(ui.clip(CW.ITEMS[id].name, 120, 9), x + 40 + i * 150, gy + 22, { size: 9, col: C.cream }); });
          if ((u.items || []).length) { ui.text('Надето', x + w - 110, gy, { size: 10, bold: true, col: C.sub }); u.items.forEach((it, i) => ui.cwItemIcon(c, it, x + w - 110 + i * 28, gy + 16, 22)); }
          ui.hints([['↑↓', 'Листать'], ['Esc', 'Закрыть']], x + w / 2, y + h - 18, { align: 'center' });
        },
        key(k, code) {
          if (k === 'up') this.top = Math.max(0, this.top - 2);
          if (k === 'down') this.top += 2;
          if (k === 'back' || k === 'ok' || code === 'KeyC') ui.pop();
        }
      });
    },

    cwNodeGlyph(c, k, x, y, col) {
      if (G.cwNodeIcon && G.cwNodeIcon(c, k, x - 7, y - 7, 14, col)) return;
      c.fillStyle = col;
      if (k === 'enc') { c.fillRect(x - 1, y, 2, 5); c.fillRect(x - 4, y - 4, 2, 5); c.fillRect(x + 2, y - 4, 2, 5); c.fillRect(x - 3, y - 1, 6, 2); return; }
      if (k === 'reward') { c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); }
      else if (k === 'supply') { c.fillRect(x - 4, y - 3, 8, 7); c.fillStyle = '#000000'; c.fillRect(x - 4, y - 1, 8, 1); }
      else if (k === 'boss') { c.beginPath(); c.arc(x, y - 1, 4, 0, Math.PI * 2); c.fill(); c.fillRect(x - 2, y + 2, 4, 3); c.fillStyle = '#000000'; c.fillRect(x - 2, y - 2, 1, 2); c.fillRect(x + 1, y - 2, 1, 2); }
      else { for (let i = -3; i <= 3; i++) { c.fillRect(x + i, y + i, 1, 1); c.fillRect(x + i, y - i, 1, 1); } c.fillRect(x - 4, y - 4, 2, 2); c.fillRect(x + 3, y - 4, 2, 2); }
    },

    cwHeart(c, x, y, r) {
      c.fillStyle = '#ff6a7a';
      c.beginPath(); c.arc(x - r / 2, y - r / 4, r / 2, 0, Math.PI * 2); c.arc(x + r / 2, y - r / 4, r / 2, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.lineTo(x, y + r); c.closePath(); c.fill();
    },

    openCwSupply() {
      const ui = this, g = this.game;
      const scr = {
        full: true, cw: true, supply: true, sel: 0,
        draw(c) {
          const r = g.cwRun();
          if (!r || r.phase !== 'supply') { ui.screens = ui.screens.filter(s => s !== scr); return; }
          ui.cwBoardBack(c);
          ui.plate(16, 14, 'Снабжение');
          ui.text('Выберите одного героя. Он придёт в зону подготовки бесплатно.', 16, 40, { size: 11, col: C.sub });
          const list = r.offer || [];
          if (this.sel >= list.length) this.sel = Math.max(0, list.length - 1);
          list.forEach((id, i) => {
            const step = list.length > 5 ? 102 : 122, cwid = step - 8, d = CW.UNITS[id], kit = H.CHARS[d.kitOn], x = 16 + i * step, y = 90, on = i === this.sel;
            ui.win(x, y + (on ? -8 : 0), cwid, 230, { alpha: 0.92, corners: false, border: on ? K.gold : CW.COST_COL[d.cost] });
            ui.portraitCard(c, G.lookOf(d.kitOn, g), x + (cwid - 80) / 2, y + 14 + (on ? -8 : 0), 80, { elem: kit.elem, border: CW.COST_COL[d.cost] });
            ui.text(ui.clip(kit.name, cwid - 10, 11, true), x + cwid / 2, y + 102 + (on ? -8 : 0), { align: 'center', size: 11, bold: true, col: C.cream });
            ui.cwCostChip(x + 10, y + 120 + (on ? -8 : 0), d.cost);
            ui.text(CW.POS[d.pos], x + 28, y + 121 + (on ? -8 : 0), { size: 9, col: C.sub });
            d.bonds.slice(0, 3).forEach((k, j) => ui.text(ui.clip(CW.BOND_NAMES[k], 100, 9), x + 10, y + 168 + j * 12 + (on ? -8 : 0), { size: 9, bold: !!CW.BONDS[k], col: CW.BONDS[k] ? CW.BONDS[k].col : C.dim }));
            const gear = r.offerItems && r.offerItems[i];
            if (gear) { ui.cwItemIcon(c, { id: gear }, x + 10, y + 140 + (on ? -8 : 0), 18); ui.text(ui.clip(CW.ITEMS[gear].name, 76, 9), x + 32, y + 144 + (on ? -8 : 0), { size: 9, col: C.cream }); }
            ui.hit(x, y - 8, cwid, 238, () => { if (this.sel === i) this.take(); else { this.sel = i; ui.sfx('select'); } });
          });
          ui.button(W / 2 - 160, 360, 150, 26, 'Взять', () => this.take(), { active: true, bold: true });
          ui.button(W / 2 + 10, 360, 150, 26, 'Пропустить', () => this.skip());
          if (g.cwPerkOn('supplyRoll')) ui.button(W / 2 - 75, 392, 150, 22, r.supplyRolled ? 'Перетасовано' : 'Перетасовать · R', () => this.roll(), { disabled: !!r.supplyRolled, size: 10 });
          ui.hints([['←→', 'Выбор'], ['Enter', 'Взять'], ['Esc', 'Пропустить']], W / 2, HGT - 22, { align: 'center' });
        },
        take() {
          const res = g.cwTakeOffer(this.sel);
          if (!res) { ui.sfx('deny'); return; }
          if (res.full) { ui.cwSay('bench'); return; }
          ui.sfx('confirm');
          for (const m of res.merged || []) ui.toast(H.CHARS[CW.UNITS[m.id].kitOn].name + ': ' + m.star + '★');
          ui.screens = ui.screens.filter(s => s !== scr);
        },
        skip() { g.cwSkipOffer(); ui.sfx('cancel'); ui.screens = ui.screens.filter(s => s !== scr); },
        roll() { if (g.cwRerollSupply()) { ui.sfx('deny'); return; } this.sel = 0; ui.sfx('shuffle'); },
        key(k, code) {
          if (code === 'KeyR') { this.roll(); return; }
          const n = (g.cwRun() && g.cwRun().offer || []).length;
          if (k === 'left' || k === 'right') { this.sel = (this.sel + (k === 'left' ? n - 1 : 1)) % Math.max(1, n); ui.sfx('select'); }
          if (k === 'ok') this.take();
          if (k === 'back') this.skip();
        }
      };
      return this.push(scr);
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
