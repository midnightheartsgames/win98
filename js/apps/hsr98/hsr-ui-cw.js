(function (H) {
  'use strict';
  const G = H.Gfx, CW = H.CW, TUN = CW.TUN;
  const { W, HGT, C } = H.UI_CONST;
  const K = { gold: '#ffd471', goldDk: '#8a6420', led: '#5cff8a', ledDim: '#0f3a1c', red: '#ff5a5a', paper: '#f4ecd8', ink: '#2a2018', stamp: '#c8323a', deep: '#04081c', line: 'rgba(255,212,113,0.5)' };
  const TICKER = [
    'ПЕРИОД «ИГРА С НУЛЕВОЙ СУММОЙ»', 'КУРС: 1 АЛМАЗ = 10 МОНЕТ ПРОЦЕНТОВ', 'КОНКУРЕНТ НЕДЕЛИ: ОХРАННЫЙ КОРПУС «ЖЕЛЕЗНЫЙ ЩИТ»',
    'СЕРИЯ ПОБЕД ПРИНОСИТ ДОПЛАТУ', 'ТРИ ОДИНАКОВЫХ ГЕРОЯ СОЕДИНЯЮТСЯ В ОДНОГО', 'НЕ ТРАТЬТЕ ВСЁ: КАЖДЫЕ 10 МОНЕТ ДАЮТ 1 МОНЕТУ ПРОЦЕНТОВ'
  ];
  const RULES = [
    'Партия идёт по узлам измерения. Перед каждым узлом этап подготовки: купите героев в магазине, расставьте их и начните узел.',
    'На поле до четырёх героев: они дерутся сами. Остальные выставленные герои стоят вне поля: врагам их не достать, они ходят по шкале и помогают отряду.',
    'Выставить можно столько героев, сколько уровень. Опыт покупается за монеты и приходит после каждой битвы.',
    'Три одинаковых героя одной звёздности сразу соединяются в героя на звезду выше.',
    'Связи считают разных выставленных героев. Чем больше членов, тем выше ступень.',
    'Битву нужно выиграть до конца отсчёта. Смертельный удар не убивает героя, но отнимает 15 от отсчёта. Не успели: команда теряет НР.',
    'После битвы приходят базовые монеты, доплата за серию побед и проценты: 1 монета за каждые 10 на руках, не больше 5.'
  ];
  const KIND_NAME = { reward: 'Награды', fight: 'Битва', supply: 'Снабжение', boss: 'Босс' };

  Object.assign(H.UI.prototype, {
    cwDiamond(cx, cy, r, t) {
      const c = this.ctx, sq = Math.cos(t || 0), w = r * (0.55 + 0.45 * Math.abs(sq));
      const top = [cx, cy - r], bot = [cx, cy + r * 1.15], l = [cx - w, cy - r * 0.15], rr = [cx + w, cy - r * 0.15];
      const face = (pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) c.lineTo(p[0], p[1]); c.closePath(); c.fill(); };
      face([top, rr, bot, l], '#1a1206');
      face([top, [cx + w * sq * 0.4, cy - r * 0.15], bot, l], '#ffe9a8');
      face([top, rr, bot, [cx + w * sq * 0.4, cy - r * 0.15]], '#c8962c');
      face([l, rr, [cx + w * 0.6, cy - r * 0.55], [cx - w * 0.6, cy - r * 0.55]], 'rgba(255,255,255,0.35)');
      c.strokeStyle = '#4a3410'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(top[0], top[1]); c.lineTo(rr[0], rr[1]); c.lineTo(bot[0], bot[1]); c.lineTo(l[0], l[1]); c.closePath(); c.stroke();
    },

    cwTicker(c, y, list, t) {
      c.fillStyle = '#000000'; c.fillRect(0, y, W, 16);
      c.fillStyle = K.ledDim; for (let x = 0; x < W; x += 3) c.fillRect(x, y + 14, 2, 1);
      const line = list.join('   ◆   ') + '   ◆   ', w = this.measure(line, 10, true), off = (t * 40) % w;
      c.save(); c.beginPath(); c.rect(0, y, W, 16); c.clip();
      for (let x = -off; x < W; x += w) this.text(line, x, y + 2, { size: 10, bold: true, col: K.led, shadow: false });
      c.restore();
    },

    cwStars(x, y, n, size, align) {
      const s = size || 5, total = n * (s * 2 + 1), x0 = align === 'center' ? x - total / 2 + s : x + s;
      for (let i = 0; i < n; i++) this.fhStar(x0 + i * (s * 2 + 1), y, s, true);
    },

    cwCell(c, u, x, y, s, o = {}) {
      const d = CW.UNITS[u.id], kitId = o.kit || d.kitOn, kit = H.CHARS[kitId];
      this.portraitCard(c, G.lookOf(kitId, this.game), x, y, s, { elem: kit.elem, border: o.border || CW.COST_COL[d.cost] });
      if (o.border) { c.strokeStyle = CW.COST_COL[d.cost]; c.strokeRect(x + 1.5, y + 1.5, s - 3, s - 3); }
      c.fillStyle = 'rgba(4,6,20,0.78)'; c.fillRect(x, y + s - (s >= 40 ? 12 : 9), s, s >= 40 ? 12 : 9);
      this.cwStars(x + s / 2, y + s - (s >= 40 ? 6 : 4.5), u.star, s >= 40 ? 4.5 : 3, 'center');
      if (o.wrong) { c.fillStyle = '#d82828'; c.fillRect(x + s - 11, y + 1, 10, 11); this.text('!', x + s - 6, y + 1, { align: 'center', size: 10, bold: true, col: '#ffffff', shadow: false }); }
    },

    cwSlot(c, x, y, s, label, on) {
      c.fillStyle = on ? 'rgba(255,212,113,0.18)' : 'rgba(6,10,34,0.82)'; c.fillRect(x, y, s, s);
      c.strokeStyle = on ? K.gold : '#2a3460'; c.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      if (label) this.text(label, x + s / 2, y + s / 2 - 6, { align: 'center', size: s >= 40 ? 14 : 10, col: '#2a3460', shadow: false });
    },

    cwCostChip(x, y, cost, label) {
      const c = this.ctx;
      c.fillStyle = '#000000'; c.fillRect(x, y, 13, 13);
      c.fillStyle = CW.COST_COL[cost]; c.fillRect(x + 1, y + 1, 11, 11);
      this.text(String(label == null ? cost : label), x + 6.5, y + 1, { align: 'center', size: 9, bold: true, col: '#141018', shadow: false });
    },

    cwCoin(x, y, r) {
      const c = this.ctx;
      c.fillStyle = '#4a3410'; c.beginPath(); c.arc(x, y, r + 1, 0, Math.PI * 2); c.fill();
      c.fillStyle = K.gold; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff4c8'; c.fillRect(x - r * 0.5, y - r * 0.5, Math.max(1, r * 0.4), Math.max(1, r * 0.4));
      this.diamond(x, y, r * 0.5, '#a87a24');
    },

    openUi_cw() {
      const s = this.openCwHub();
      s.onClose = () => this.finishPending();
    },

    cwMusic() { this.audio.music('sim'); },

    cwLeaveMusic() { const g = this.game; if (this.mode === 'field' && g.map) this.audio.music(g.mapMusic(g.map.def)); },

    openCwHub() {
      const ui = this, g = this.game;
      this.cwMusic();
      const items = () => {
        const run = g.cwRun(), cl = g.cwClaimable();
        const list = [{ id: 'go', label: run ? 'Продолжить партию' : 'Запустить Валютные войны' }];
        list.push({ id: 'asc', tile: 'Уровень продвижения', badge: cl.asc }, { id: 'week', tile: 'Награды за очки', badge: cl.week }, { id: 'rankRew', tile: 'Награды за ранг', badge: cl.rank }, { id: 'links', tile: 'Соединение связи', badge: cl.links, sub: g.cwPerks().links.done.length + ' / ' + CW.LINK_BONDS.length * 3 }, { id: 'bank', tile: 'Банк данных', badge: cl.bank, sub: g.cwBankState().pct + '%' }, { id: 'profit', tile: 'Ожидаемый доход', badge: cl.profit, sub: g.cwGoals().profit.length + ' / ' + CW.PROFIT.reduce((a, x) => a + x.tasks.length, 0) }, { id: 'hist', tile: 'История партий' }, { id: 'guide', mark: 'Руководство', badge: cl.guide }, { id: 'perks', mark: 'Преимущества', sub: g.cwPerks().notes }, { id: 'lineups', mark: 'Все руководства' });
        if (run) list.push({ id: 'quit', label: 'Сдаться' });
        list.push({ id: 'rules', label: 'Правила' }, { id: 'close', label: 'Закрыть терминал' });
        return list;
      };
      const act = id => {
        if (id === 'go') { if (g.cwRun()) ui.cwResume(); else ui.openCwMode(); return; }
        if (id === 'quit') { ui.cwConfirmQuit(); return; }
        if (id === 'rules') { ui.openCwRules(); return; }
        if (id === 'asc') { ui.openCwAsc(); return; }
        if (id === 'week') { ui.openCwWeek(); return; }
        if (id === 'rankRew') { ui.openCwRankRewards(); return; }
        if (id === 'hist') { ui.openCwHistory(); return; }
        if (id === 'links') { ui.openCwLinks(); return; }
        if (id === 'bank') { ui.openCwBank(); return; }
        if (id === 'perks') { ui.openCwPerks(); return; }
        if (id === 'profit') { ui.openCwProfit(); return; }
        if (id === 'guide') { ui.openCwGuide(); return; }
        if (id === 'lineups') { ui.openCwLineups(); return; }
        if (id === 'close') { ui.pop(); ui.cwLeaveMusic(); }
      };
      return this.push({
        full: true, cw: true, hub: true, sel: 0,
        draw(c) {
          const list = items(), run = g.cwRun(), C0 = g.cwMeta();
          if (this.sel >= list.length) this.sel = list.length - 1;
          const gr = c.createLinearGradient(0, 0, 0, HGT);
          gr.addColorStop(0, '#0a0e2e'); gr.addColorStop(1, '#02030c');
          c.fillStyle = gr; c.fillRect(0, 0, W, HGT);
          c.fillStyle = ui.dither(); c.fillRect(0, 0, W, HGT);
          const tick = TICKER.concat(C0.hist.slice(0, 3).map(h => 'ИТОГ ' + h.rank + ': ' + (h.cleared ? 'ПОБЕДА' : 'БЕЗ ПОБЕДЫ') + ', НР ' + h.hp));
          ui.cwTicker(c, 0, tick, ui.t);
          ui.plate(16, 26, 'Валютные войны');
          ui.text('Период «Игра с нулевой суммой»', 16, 50, { size: 11, col: C.sub });
          if (C0.plate) { c.fillStyle = '#3a2a08'; c.fillRect(16, 64, 150, 16); c.fillStyle = K.gold; c.fillRect(16, 64, 2, 16); ui.text(C0.plate, 24, 66, { size: 10, bold: true, col: K.gold }); }
          for (let i = 0; i < 9; i++) { const x = 60 + i * 26, h = 30 + ((i * 37) % 50); c.fillStyle = 'rgba(92,255,138,0.08)'; c.fillRect(x, 260 - h, 18, h); }
          const glow = c.createRadialGradient(170, 170, 10, 170, 170, 110);
          glow.addColorStop(0, 'rgba(255,212,113,0.35)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = glow; c.fillRect(40, 60, 260, 220);
          const last = C0.hist[0];
          if (last) last.team.slice(0, 6).forEach((u, i) => { const a = -Math.PI + i * Math.PI / 5, hx = 170 + Math.cos(a) * 118, hy = 196 + Math.sin(a) * 40; c.globalAlpha = 0.28; G.drawSprite(c, G.lookOf(CW.UNITS[u.id].kitOn, g), 'down', 0, hx - 16, hy - 40); c.globalAlpha = 1; });
          ui.cwDiamond(170, 160 + Math.sin(ui.t * 1.6) * 4, 50, ui.t * 0.9);
          c.fillStyle = '#1a1e3e'; c.fillRect(110, 232, 120, 10); c.fillStyle = '#2a3068'; c.fillRect(100, 242, 140, 14);
          c.fillStyle = K.gold; c.fillRect(100, 242, 140, 1);
          ui.win(16, 266, 308, 96, { title: run ? 'Партия идёт' : 'Новая партия', border: '#5a4a2a' });
          if (run) {
            ui.text(CW.MODES[run.mode].name + ' · ' + g.cwRank(run.tier, run.sub).code + (run.promo ? ' · матч продвижения' : ''), 30, 288, { size: 11, bold: true, col: K.gold });
            ui.text('Измерение ' + (run.plane + 1) + ', узел ' + (run.node + 1) + ' из ' + run.nodes.length + ' · ' + KIND_NAME[g.cwNodeKind(run)], 30, 304, { size: 11, col: C.cream });
            ui.text('НР команды ' + run.hp + ' / ' + run.hpMax + ' · монеты ' + run.gold + ' · уровень ' + run.lvl, 30, 320, { size: 10, col: run.hp < 40 ? C.bad : C.sub });
            g.cwDeployed(run).slice(0, 9).forEach((u, i) => ui.cwCell(c, u, 30 + i * 30, 334, 24));
          } else {
            ui.text('Три измерения, три конкурента из семи.', 30, 288, { size: 11, col: C.cream });
            ui.text('Стандартная игра: 23 узла, Быстрая: 16.', 30, 304, { size: 10, col: C.sub });
            if (last) ui.text('Прошлая партия: ' + last.rank + ', ' + (last.cleared ? 'победа' : 'без победы') + ', НР ' + last.hp, 30, 320, { size: 10, col: last.cleared ? C.ok : C.dim });
          }
          const wk = C0.week, wl = g.cwWeekLeft();
          ui.win(16, 372, 308, 52, { corners: false, border: '#5a4a2a' });
          ui.text('Очки за неделю', 28, 380, { size: 10, bold: true, col: K.gold });
          ui.text(H.fmt(wk.pts) + ' / ' + H.fmt(CW.META.weekMax), 312, 380, { align: 'right', size: 10, bold: true, col: C.cream });
          ui.bar(28, 396, 284, 5, wk.pts / CW.META.weekMax, K.gold);
          ui.text('Сброс через ' + Math.floor(wl / 3600000) + ' ч ' + Math.floor(wl % 3600000 / 60000) + ' мин', 28, 406, { size: 9, col: C.dim });
          const best = g.cwRankBest(), R = CW.RANKS[best.tier];
          ui.win(340, 30, 284, 52, { corners: false, border: K.gold });
          ui.cwRankMark(best.tier, 364, 56, 40);
          ui.text(R.code, 364, 74, { align: 'center', size: 8, bold: true, col: K.gold });
          ui.text(R.name, 390, 40, { size: 12, bold: true, col: K.gold });
          ui.text('Наивысший ранг ' + R.code + '-' + best.sub + (g.cwGate() ? ' · ждёт матч продвижения' : ''), 390, 58, { size: 9, col: C.sub });
          const lv = g.cwAscLvl(), pts = C0.asc.pts, per = CW.META.ascPer;
          ui.win(340, 88, 284, 44, { corners: false, border: '#5a4a2a' });
          ui.text('Уровень продвижения', 352, 96, { size: 10, bold: true, col: C.cream });
          ui.text(lv >= CW.META.ascMax ? 'Макс. уровень' : String(lv), 612, 94, { align: 'right', size: 14, bold: true, serif: true, col: K.gold });
          ui.bar(352, 116, 260, 5, lv >= CW.META.ascMax ? 1 : (pts % per) / per, '#80c0ff');
          const tiles = list.filter(x => x.tile);
          list.forEach((it, i) => {
            if (!it.tile) return;
            const j = tiles.indexOf(it), tx = 340 + (j % 2) * 144, ty = 138 + Math.floor(j / 2) * 36, on = i === this.sel;
            c.fillStyle = on ? 'rgba(255,212,113,0.2)' : 'rgba(6,10,34,0.88)'; c.fillRect(tx, ty, 140, 32);
            c.strokeStyle = on ? K.gold : '#2a3460'; c.strokeRect(tx + 0.5, ty + 0.5, 139, 31);
            ui.text(ui.clip(it.tile, 120, 10, true), tx + 8, ty + (it.sub ? 4 : 10), { size: 10, bold: true, col: on ? K.gold : C.cream });
            if (it.sub) ui.text(it.sub, tx + 8, ty + 17, { size: 9, col: C.sub });
            if (it.badge) { c.fillStyle = K.red; c.beginPath(); c.arc(tx + 130, ty + 9, 6, 0, Math.PI * 2); c.fill(); ui.text(String(it.badge), tx + 130, ty + 3, { align: 'center', size: 8, bold: true, col: '#ffffff', shadow: false }); }
            ui.hit(tx, ty, 140, 32, () => { this.sel = i; act(it.id); });
          });
          const pv = g.cwRunPreview('standard', best.tier);
          c.fillStyle = 'rgba(80,60,10,0.85)'; c.fillRect(340, 284, 284, 16);
          ui.text(wk.dbl > 0 ? 'Двойные очки продвижения: осталось ' + H.fmt(wk.dbl) : 'Двойные очки продвижения кончились', 348, 286, { size: 9, bold: true, col: wk.dbl > 0 ? K.gold : C.dim });
          list.filter(x => x.mark).forEach((it, j) => {
            const i = list.indexOf(it), on = i === this.sel, mw = [92, 96, 116][j], mx = 16 + [0, 96, 196][j], my = 84;
            c.fillStyle = '#000000'; c.fillRect(mx, my, mw, 20);
            c.fillStyle = on ? K.gold : ['#8a3428', '#2a6a44', '#2a4a7a'][j]; c.fillRect(mx + 1, my + 1, mw - 2, 18);
            c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(mx + 1, my + 1, mw - 2, 3);
            ui.text(it.mark, mx + mw / 2, my + 4, { align: 'center', size: 9, bold: true, col: on ? '#141018' : '#ffffff', shadow: false });
            if (it.badge) { c.fillStyle = K.red; c.beginPath(); c.arc(mx + mw - 4, my + 3, 4, 0, Math.PI * 2); c.fill(); }
            ui.hit(mx, my, mw, 20, () => { this.sel = i; act(it.id); });
          });
          list.filter(x => !x.tile && !x.mark).forEach((it, j) => {
            const i = list.indexOf(it), y = j ? 342 + (j - 1) * 28 : 304;
            ui.button(340, y, 284, j ? 24 : 34, it.label + (j === 0 && !run ? ' · ' + H.fmt(pv.asc) + (pv.bonus ? ' + ' + H.fmt(pv.bonus) : '') + ' оч.' : ''), () => { this.sel = i; act(it.id); }, { active: i === this.sel, bold: j === 0, icon: j === 0 ? 'warp' : null });
          });
          ui.hints([['↑↓', 'Выбор'], ['Enter', 'Открыть'], ['R', 'Правила'], ['Esc', 'Закрыть']], 340, HGT - 22);
        },
        key(k, code) {
          const list = items();
          if (code === 'KeyR') { ui.openCwRules(); return; }
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'ok') act(list[this.sel].id);
          if (k === 'back') { ui.pop(); ui.cwLeaveMusic(); }
        }
      });
    },

    cwResume() {
      const g = this.game, run = g.cwRun();
      if (!run) return;
      this.sfx('warp');
      this.openCwBoard();
    },

    openCwMode() {
      const ui = this, g = this.game, keys = Object.keys(CW.MODES);
      const TEXT = {
        standard: ['Три измерения, 23 узла.', 'Проценты с накоплений.', 'Встречи с ранга A2.'],
        quick: ['Три измерения, 16 узлов.', 'Старт: уровень 4, 8 монет.', 'Каждый узел: +3 монеты, +2 опыта.', 'Процентов нет.']
      };
      this.push({
        full: true, cw: true, sel: Math.max(0, keys.indexOf(g.cw().pick.mode)),
        draw(c) {
          ui.cwBoardBack(c);
          ui.plate(16, 14, 'Выбор режима');
          keys.forEach((k, i) => {
            const M = CW.MODES[k], x = 24, y = 60 + i * 150, on = i === this.sel;
            c.fillStyle = '#000000'; c.fillRect(x - 1, y - 1, 282, 132);
            c.fillStyle = on ? '#f4ecd8' : '#cfc6b0'; c.fillRect(x, y, 280, 130);
            for (let j = 0; j < 280; j += 8) { c.fillStyle = 'rgba(42,32,24,0.08)'; c.fillRect(x + j, y + 104, 4, 1); }
            ui.text(M.name.toUpperCase(), x + 14, y + 12, { size: 14, bold: true, serif: true, col: K.ink, shadow: false });
            TEXT[k].forEach((l, j) => ui.text(l, x + 14, y + 38 + j * 16, { size: 11, col: '#4a3a2a', shadow: false }));
            c.save(); c.translate(x + 236, y + 104); c.rotate(-0.2);
            c.strokeStyle = k === 'standard' ? '#2a4a9a' : '#1a8a8a'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 18, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
            ui.text('КММ', 0, -5, { align: 'center', size: 10, bold: true, col: k === 'standard' ? '#2a4a9a' : '#1a8a8a', shadow: false });
            c.restore();
            if (on) { c.strokeStyle = K.gold; c.lineWidth = 2; c.strokeRect(x - 3, y - 3, 286, 136); c.lineWidth = 1; }
            ui.hit(x, y, 280, 130, () => { if (this.sel === i) this.next(); else { this.sel = i; ui.sfx('select'); } });
          });
          const M = CW.MODES[keys[this.sel]];
          ui.win(330, 60, 290, 280, { title: M.name, border: K.gold });
          const pv = g.cwRunPreview(keys[this.sel], g.cwRankBest().tier), streak = (() => { let n = 0; for (const h of g.cw().hist) { if (!h.cleared) break; n++; } return n; })();
          const rows = [['Измерений', '3'], ['Узлов', String(M.planes.reduce((a, p) => a + p.length, 0))], ['Старт', 'уровень ' + M.lvl + ', ' + M.gold + ' монет'], ['Проценты', M.interest ? 'да, до 5 за узел' : 'нет'], ['Повышение ранга', M.interest ? 'на наивысшем ранге' : 'нет'], ['Очки за прохождение', H.fmt(pv.week)], ['Очки продвижения', H.fmt(pv.asc) + (pv.bonus ? ' + ' + H.fmt(pv.bonus) : '')], ['Побед подряд', String(streak)]];
          rows.forEach(([a, b], i) => { ui.text(a, 346, 86 + i * 20, { size: 11, col: C.sub }); ui.text(b, 604, 86 + i * 20, { align: 'right', size: 11, bold: true, col: C.cream }); });
          const h = g.cw().hist.find(x => x.mode === keys[this.sel]);
          if (h) ui.text('Прошлая партия: ' + h.rank + ', ' + (h.cleared ? 'победа' : 'без победы') + ', НР ' + h.hp, 346, 256, { size: 10, col: h.cleared ? C.ok : C.dim });
          ui.button(346, 296, 124, 22, 'История партий', () => ui.openCwHistory(), { size: 10 });
          ui.button(480, 296, 124, 22, 'Награды за ранг', () => ui.openCwRankRewards(), { size: 10 });
          ui.button(330, 356, 290, 28, 'К выбору ранга', () => this.next(), { active: true, bold: true });
          ui.hints([['↑↓', 'Режим'], ['Enter', 'Дальше'], ['Esc', 'Назад']], W / 2, HGT - 22, { align: 'center' });
        },
        next() { ui.sfx('confirm'); ui.openCwRankPick(keys[this.sel]); },
        key(k) {
          if (k === 'up' || k === 'down' || k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'ok') this.next();
          if (k === 'back') ui.pop();
        }
      });
    },

    openCwRankPick(mode) {
      const ui = this, g = this.game, P = g.cw().pick, best = g.cwRankBest(), bestIdx = g.cwMeta().rank.best;
      const okAt = (t, s) => CW.rankIndex(t, s) <= bestIdx;
      const t0 = okAt(P.tier || 0, P.sub || 1) ? P.tier || 0 : best.tier, s0 = okAt(P.tier || 0, P.sub || 1) ? P.sub || 1 : best.sub;
      this.push({
        full: true, cw: true, tier: t0, sub: s0,
        draw(c) {
          ui.cwBoardBack(c);
          ui.plate(16, 14, 'Выбор ранга · ' + CW.MODES[mode].name);
          CW.RANKS.forEach((R, i) => {
            const y = 46 + i * 40, on = i === this.tier, x = on ? 16 : 24, w = on ? 236 : 220, open = i <= best.tier, done = i < best.tier;
            c.fillStyle = on ? 'rgba(255,212,113,0.22)' : open ? 'rgba(6,10,34,0.85)' : 'rgba(6,8,20,0.6)'; c.fillRect(x, y, w, 34);
            c.strokeStyle = on ? K.gold : '#2a3460'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 33);
            c.globalAlpha = open ? 1 : 0.35; ui.cwRankMark(i, x + 18, y + 17, 28); c.globalAlpha = 1;
            ui.text(R.code, x + 18, y + 25, { align: 'center', size: 7, bold: true, col: '#ffffff' });
            ui.text(R.name, x + 40, y + 5, { size: 11, bold: true, col: on ? K.gold : open ? C.cream : C.dim });
            ui.text(open ? 'подуровни 1-' + (i === best.tier ? best.sub + ' из ' + R.subs : R.subs) + ', сложность ' + R.diff + '+' : 'закрыт', x + 40, y + 19, { size: 9, col: open ? C.sub : C.dim });
            if (done) ui.text('✓', x + w - 12, y + 10, { align: 'center', size: 12, bold: true, col: C.ok });
            ui.hit(x, y, w, 34, () => { if (!open) { ui.sfx('deny'); return; } this.tier = i; this.sub = Math.min(this.sub, i === best.tier ? best.sub : R.subs); ui.sfx('select'); });
          });
          const R = CW.RANKS[this.tier], rk = g.cwRank(this.tier, this.sub), maxSub = this.tier === best.tier ? best.sub : R.subs;
          const promo = mode === 'standard' && this.tier === best.tier && this.sub === best.sub && g.cwGate();
          ui.win(270, 46, 354, 300, { title: rk.code + ' ' + R.name, border: K.gold });
          ui.text('Подуровень', 286, 70, { size: 11, col: C.sub });
          ui.button(380, 66, 22, 18, '<', () => this.step(-1), { size: 11, bold: true, disabled: this.sub <= 1 });
          ui.text(this.sub + ' / ' + R.subs, 436, 69, { align: 'center', size: 12, bold: true, col: C.cream });
          ui.button(470, 66, 22, 18, '>', () => this.step(1), { size: 11, bold: true, disabled: this.sub >= maxSub });
          ui.button(506, 66, 108, 18, 'К наивысшему', () => this.top(), { size: 9, disabled: this.tier === best.tier && this.sub === best.sub });
          if (promo) {
            const nx = CW.RANKS[this.tier + 1];
            c.fillStyle = 'rgba(90,20,24,0.85)'; c.fillRect(282, 88, 330, 18);
            ui.text('Матч продвижения: сложность ' + nx.code + '-6, победа открывает ' + nx.code, 288, 91, { size: 10, bold: true, col: '#ffd0a0' });
          }
          const prk = promo ? g.cwRank(this.tier + 1, 6) : rk;
          ui.text('Сложность противников ' + prk.diff, 286, 112, { size: 12, bold: true, col: K.gold });
          const row = prk.row;
          ['Измерение 1', 'Измерение 2', 'Измерение 3'].forEach((n, p) => ui.text(n + ': АТК +' + row[p * 3] + '%, НР +' + row[p * 3 + 1] + '%, скорость +' + row[p * 3 + 2] + '%', 286, 130 + p * 15, { size: 10, col: C.cream }));
          ui.text('Правила ранга (эффект может складываться)', 286, 182, { size: 11, bold: true, col: K.gold });
          let y = 200;
          for (const r of g.cwRankRules(this.tier)) {
            for (const l of ui.wrap(r.code + ': ' + r.text, 320, 10).slice(0, 2)) { ui.text(l, 286, y, { size: 10, col: C.cream }); y += 12; }
            if (y > 330) break;
          }
          const pv = g.cwRunPreview(mode, promo ? this.tier + 1 : this.tier), aff = CW.affixCount(promo ? this.tier + 1 : this.tier);
          [['Продвижение', H.fmt(pv.asc), pv.dblPct ? '+' + pv.dblPct + '%' : ''], ['Очки', H.fmt(pv.week), ''], ['Сложность', String(prk.diff), ''], ['Аффиксы', String(aff), '']].forEach(([n, v, x2], i) => {
            const hx = 300 + i * 84;
            ui.cwHex(hx, 368, 14, i ? '#5a6490' : K.gold, '');
            ui.text(v, hx + 20, 358, { size: 11, bold: true, col: C.cream });
            ui.text(n + (x2 ? ' ' + x2 : ''), hx + 20, 372, { size: 8, col: x2 ? K.gold : C.sub });
          });
          ui.button(270, 394, 354, 28, promo ? 'Начать матч продвижения' : 'Начать партию', () => this.start(), { active: true, bold: true, icon: 'warp' });
          ui.hints([['↑↓', 'Ранг'], ['←→', 'Подуровень'], ['H', 'К наивысшему'], ['Enter', 'Начать'], ['Esc', 'Назад']], W / 2, HGT - 20, { align: 'center' });
        },
        step(d) { const n = this.tier === best.tier ? best.sub : CW.RANKS[this.tier].subs; this.sub = Math.max(1, Math.min(n, this.sub + d)); ui.sfx('select'); },
        top() { this.tier = best.tier; this.sub = best.sub; ui.sfx('select'); },
        start() {
          g.cwNew({ mode, tier: this.tier, sub: this.sub });
          ui.screens = ui.screens.filter(s => !s.cw || s.hub);
          ui.sfx('warp');
          ui.openCwBoard();
          ui.openCwRivals();
        },
        key(k, code) {
          if (k === 'up' || k === 'down') { const n = best.tier + 1; this.tier = (this.tier + (k === 'up' ? n - 1 : 1)) % n; this.sub = Math.min(this.sub, this.tier === best.tier ? best.sub : CW.RANKS[this.tier].subs); ui.sfx('select'); }
          if (k === 'left' || k === 'right') this.step(k === 'left' ? -1 : 1);
          if (code === 'KeyH') this.top();
          if (k === 'ok') this.start();
          if (k === 'back') ui.pop();
        }
      });
    },

    cwRankMark(t, x, y, s) { if (G.cwRankIcon) G.cwRankIcon(this.ctx, t, x - s / 2, y - s / 2, s); },

    cwHex(x, y, r, col, label) {
      const c = this.ctx;
      c.fillStyle = '#000000'; c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; c.lineTo(x + Math.cos(a) * (r + 1), y + Math.sin(a) * (r + 1)); } c.closePath(); c.fill();
      c.fillStyle = col; c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill();
      if (label) this.text(label, x, y - 6, { align: 'center', size: 10, bold: true, col: '#141018', shadow: false });
    },

    openCwRivals() {
      const ui = this, g = this.game;
      this.push({
        full: true, cw: true,
        draw(c) {
          const run = g.cwRun();
          if (!run) { ui.pop(); return; }
          const gr = c.createLinearGradient(0, 0, 0, HGT);
          gr.addColorStop(0, '#2a0608'); gr.addColorStop(1, '#0a0204');
          c.fillStyle = gr; c.fillRect(0, 0, W, HGT);
          c.fillStyle = ui.dither(); c.fillRect(0, 0, W, HGT);
          ui.plate(16, 14, 'Конкуренты партии');
          ui.text(CW.MODES[run.mode].name + ' · ' + g.cwRank(run.tier, run.sub).code + ' · сложность ' + run.diff, 16, 40, { size: 11, col: '#e8b0a8' });
          run.opps.forEach((k, i) => {
            const O = CW.OPPONENTS[k], x = 22 + i * 206, y = 64, hidden = i === 2 && run.plane < 2;
            c.fillStyle = '#000000'; c.fillRect(x - 1, y - 1, 194, 322);
            c.fillStyle = '#d8c8a0'; c.fillRect(x, y, 192, 320);
            c.fillStyle = '#b8a070'; c.fillRect(x + 120, y - 10, 60, 12);
            ui.text('ИЗМЕРЕНИЕ ' + (i + 1), x + 12, y + 10, { size: 11, bold: true, col: '#5a1a14', shadow: false });
            c.fillStyle = '#1a0a0a'; c.fillRect(x + 12, y + 30, 168, 180);
            G.drawEnemy(c, H.ENEMIES[O.boss], x + 96, y + 200, 150, { t: ui.t + i, alpha: hidden ? 0.18 : 1 });
            if (hidden) ui.text('?', x + 96, y + 90, { align: 'center', size: 40, bold: true, serif: true, col: '#d8c8a0' });
            ui.text('Фракция', x + 12, y + 220, { size: 9, col: '#6a5a40', shadow: false });
            for (const [j, l] of ui.wrap(O.name, 168, 11, true).slice(0, 2).entries()) ui.text(l, x + 12, y + 234 + j * 14, { size: 11, bold: true, col: '#2a1a10', shadow: false });
            ui.text('Босс: ' + (hidden ? 'неизвестен' : H.ENEMIES[O.boss].name.split(',')[0]), x + 12, y + 270, { size: 10, col: '#4a3a2a', shadow: false });
            c.save(); c.translate(x + 150, y + 296); c.rotate(-0.25); c.strokeStyle = '#a02020'; c.lineWidth = 2; c.strokeRect(-30, -9, 60, 18); c.lineWidth = 1;
            ui.text('ДОСЬЕ', 0, -6, { align: 'center', size: 10, bold: true, col: '#a02020', shadow: false }); c.restore();
          });
          ui.text('Битвы измерения ведут все три конкурента, босс измерения от своего.', W / 2, 400, { align: 'center', size: 11, col: '#e8b0a8' });
          ui.button(W / 2 - 100, 422, 200, 26, 'Далее', () => ui.pop(), { active: true, bold: true });
          ui.hit(0, 0, W, 410, () => ui.pop());
        },
        key(k) { if (k === 'ok' || k === 'back') ui.pop(); }
      });
    },

    openCwLost() {
      const ui = this, g = this.game;
      this.push({
        cw: true, lostPick: true, sel: 0,
        draw() {
          const run = g.cwRun();
          if (!run || run.phase !== 'lost') { ui.screens = ui.screens.filter(s => s !== this); return; }
          ui.win(W / 2 - 180, 160, 360, 140, { title: 'Узел не пройден', border: '#d86060' });
          ui.text('Прогресс ' + Math.round(run.fight.progress * 100) + '%. Что дальше?', W / 2, 186, { align: 'center', size: 12, col: C.cream });
          ['Переиграть бой', 'Принять результат'].forEach((l, i) => ui.button(W / 2 - 150, 214 + i * 34, 300, 26, l, () => this.go(i), { active: this.sel === i }));
        },
        go(i) {
          ui.screens = ui.screens.filter(s => s !== this);
          if (i === 0) { g.cwReplay(); ui.sfx('confirm'); return; }
          const rec = g.cwAccept();
          if (rec) ui.cwAfterBattle({ cw: rec });
        },
        key(k) {
          if (k === 'up' || k === 'down') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'ok') this.go(this.sel);
        }
      });
    },

    cwConfirmQuit() {
      const ui = this, g = this.game;
      this.push({
        cw: true, sel: 1,
        draw() {
          ui.win(W / 2 - 170, 170, 340, 120, { title: 'Сдаться', border: '#d86060' });
          ui.text('Партия закончится сейчас. Продолжить её будет нельзя.', W / 2, 196, { align: 'center', size: 11, col: C.cream });
          ui.button(W / 2 - 150, 236, 140, 26, 'Сдаться', () => this.go(0), { active: this.sel === 0 });
          ui.button(W / 2 + 10, 236, 140, 26, 'Отмена', () => this.go(1), { active: this.sel === 1 });
        },
        go(i) {
          ui.screens.pop();
          if (i === 0) { const sum = g.cwQuit(); if (sum) ui.openCwReport(sum); }
          ui.sfx(i === 0 ? 'cancel' : 'select');
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'ok') this.go(this.sel);
          if (k === 'back') this.go(1);
        }
      });
    },

    openCwRules() {
      const ui = this;
      this.push({
        cw: true,
        draw() {
          ui.win(60, 50, 520, 380, { title: 'Правила', border: K.gold });
          let y = 74;
          for (const p of RULES) { for (const l of ui.wrap(p, 488, 11)) { ui.text(l, 76, y, { size: 11, col: C.cream }); y += 14; } y += 7; }
          ui.hints([['Esc', 'Назад']], W / 2, 406, { align: 'center' });
          ui.hit(0, 0, W, HGT, () => ui.pop());
        },
        key(k) { if (k === 'back' || k === 'ok') ui.pop(); }
      });
    },

    cwAfterBattle(out) {
      const r = out.cw;
      this.cwMusic();
      if (r.end) { this.screens = this.screens.filter(s => !s.board); this.openCwReport(r.end); return; }
      const s = this.screens.find(x => x.board) || this.openCwBoard();
      s.receipt = { r, t: 0 };
    }
  });

  H.CW_UI = { K, KIND_NAME };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
