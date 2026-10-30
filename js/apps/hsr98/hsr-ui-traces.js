(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;

  const AREA = { x: 186, y: 60, w: 248, h: 410 };
  const RAIL_X = 310, ABIL_Y = 96, ROOT_Y = 154, BONUS_Y = { a2: 216, a4: 306, a6: 396 };
  const ABIL_X = { basic: 214, skill: 262, ult: 310, talent: 358, tech: 406 };
  const STEP_X = 30, STEP_Y = 24;
  const ABIL_NAME = { basic: 'Атака', skill: 'Навык', ult: 'Абсолютная', talent: 'Талант', tech: 'Техника' };
  const KIT_AB = { basic: 'basic', skill: 'skill', ult: 'ult' };
  const STAT_ICON = { hpP: 'hp', atkP: 'atk', defP: 'def', spd: 'spd', critR: 'critR', critD: 'critD', breakE: 'breakE', ehr: 'ehr', res: 'res' };
  const ELEM_OF = { physP: 'phys', fireP: 'fire', iceP: 'ice', elecP: 'elec', windP: 'wind', quantP: 'quant', imagP: 'imag' };
  const WHY = { pre: 'Сначала откройте узел «', credits: 'Не хватает кредитов.', mats: 'Не хватает материалов.', max: 'Узел уже на максимуме.' };

  const layouts = new Map();
  function layout(kit) {
    if (layouts.has(kit)) return layouts.get(kit);
    const nodes = H.traceNodes(kit), pos = { root: { x: RAIL_X, y: ROOT_Y } }, edges = [], kids = { root: [] };
    for (const [id, x] of Object.entries(ABIL_X)) pos[id] = { x, y: ABIL_Y };
    for (const id of ['a2', 'a4', 'a6']) { pos[id] = { x: RAIL_X, y: BONUS_Y[id] }; kids[id] = []; }
    for (const n of nodes) if (n.kind === 'stat') { const p = n.pre || 'root'; (kids[p] = kids[p] || []).push(n.id); }
    const place = (parent, x, y, dir) => (kids[parent] || []).forEach((id, i) => {
      const d = dir || (i % 2 ? 1 : -1), row = dir ? i : Math.floor(i / 2), cx = x + d * STEP_X, cy = y + row * STEP_Y;
      pos[id] = { x: cx, y: cy };
      edges.push([parent, id]);
      place(id, cx, cy, d);
    });
    for (const p of ['root', 'a2', 'a4', 'a6']) place(p, pos[p].x, pos[p].y, 0);
    for (const n of nodes) if (n.kind === 'bonus' && n.pre) edges.push([n.pre, n.id, true]);
    const out = { pos, edges, ids: nodes.map(n => n.id) };
    layouts.set(kit, out);
    return out;
  }

  const lineOf = path => Object.keys(H.TRACE_PATH_LINES).find(k => H.TRACE_PATH_LINES[k][0] === path);

  function sourceOf(id) {
    const it = H.ITEMS[id];
    if (!it) return '';
    if (it.src) return it.src;
    if (it.mat === 'path') { const c = H.CALYX.find(x => x.reward === 'path' && lineOf(x.path) === it.line); return (c ? c.name : 'Багровый чашелист') + ', синтез и обмен.'; }
    if (it.mat === 'foe') return it.line === 'scion' || it.line === 'artifex' ? 'Обмен в Омни-синтезаторе, лавка Немеркнущих углей.' : 'Остаётся после ' + H.TRACE_FOE_LINES[it.line][0] + '. Золотые чашелисты, синтез и обмен.';
    if (it.mat === 'echo') { const c = H.CALYX.find(x => x.mat === id); return c ? c.name + '.' : 'Эхо войны.'; }
    if (it.mat === 'tracks') return 'Награды проводника, «Снабжение», Виртуальная вселенная.';
    if (it.mat === 'shadow') return it.path === 'destruction' ? 'Награды проводника, магазины станции и Подземья.' : 'Сюжет Ярило-VI, магазин в Белобоге.';
    return '';
  }

  Object.assign(H.UI.prototype, {
    traceLayout: layout,
    traceSource: sourceOf,

    traceTitle(k, n) {
      if (n.kind === 'ability' || n.kind === 'tech') {
        const kit = H.CHARS[this.game.kitOf(k)], ab = n.id === 'talent' ? null : n.id === 'tech' ? kit.tech : kit.skills ? (n.id === 'skill' ? { name: kit.skills.map(s => s.name).join(' / ') } : kit[KIT_AB[n.id]]) : kit[KIT_AB[n.id]];
        return ABIL_NAME[n.id] + (ab && ab.name ? ': ' + ab.name : '');
      }
      if (n.kind === 'bonus') return n.title || 'Доп. способность ' + n.id.toUpperCase();
      return n.title;
    },

    traceStatText(n) { return (H.STAT_NAMES[n.stat] || n.stat) + ' +' + (n.stat === 'spd' ? n.value : String(Math.round(n.value * 1000) / 10).replace('.', ',') + '%'); },

    drawTraceNode(c, k, n, p, st, sel, focus, flash) {
      const on = st.cur > 0 && n.kind !== 'ability' ? true : n.kind === 'ability' ? st.cur > 1 || st.why === 'max' : n.kind === 'tech';
      const locked = st.why === 'lvl' || st.why === 'pre', ready = st.ok;
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 5);
      if (flash) { const gl = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, 26); gl.addColorStop(0, 'rgba(255,240,170,' + (0.9 * flash) + ')'); gl.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = gl; c.fillRect(p.x - 26, p.y - 26, 52, 52); }
      if (n.kind === 'ability' || n.kind === 'tech') {
        const r = n.kind === 'tech' ? 11 : 15;
        c.fillStyle = 'rgba(4,4,16,0.6)'; c.beginPath(); c.arc(p.x + 1, p.y + 2, r, 0, Math.PI * 2); c.fill();
        c.fillStyle = on ? '#3a2e14' : '#141a40'; c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();
        c.strokeStyle = ready ? 'rgba(122,224,240,' + (0.5 + 0.5 * pulse) + ')' : on ? C.brassHi : '#6a70a0'; c.lineWidth = 2; c.stroke(); c.lineWidth = 1;
        if (n.kind === 'tech') G.menuIcon(c, 'guide', p.x - 7, p.y - 7, 14, C.cream);
        else {
          this.text(String(st.cur + (st.up || 0)), p.x, p.y - 7, { align: 'center', size: 13, bold: true, serif: true, col: st.up ? C.cyan : on ? C.gold : C.cream });
        }
        this.text(ABIL_NAME[n.id], p.x, p.y + r + 2, { align: 'center', size: 9, col: sel ? C.gold : C.sub });
      } else if (n.kind === 'bonus') {
        this.diamond(p.x, p.y, 11, on ? '#fff0b0' : '#1a1e48', on ? '#8a6a20' : locked ? '#4a4e78' : ready ? '#7ae0f0' : '#9aa0d0');
        this.text(n.id.toUpperCase(), p.x, p.y - 5, { align: 'center', size: 9, bold: true, col: on ? '#3a2a08' : C.cream });
        if (locked) this.text(this.traceGate(st.gate), p.x + 15, p.y - 5, { size: 9, col: C.dim });
      } else {
        c.fillStyle = on ? '#4a3a14' : '#10142e'; c.beginPath(); c.arc(p.x, p.y, 9, 0, Math.PI * 2); c.fill();
        c.strokeStyle = ready ? 'rgba(122,224,240,' + (0.5 + 0.5 * pulse) + ')' : on ? C.brassHi : locked ? '#3a3e64' : '#7a80b0'; c.stroke();
        if (STAT_ICON[n.stat]) G.statIcon(c, STAT_ICON[n.stat], p.x - 6, p.y - 6, 12, on ? '#fff0c0' : locked ? '#5a5e80' : '#c8d0f0');
        else G.elemIcon(c, ELEM_OF[n.stat], p.x, p.y, 4.5);
      }
      if (sel) {
        const rr = (n.kind === 'stat' ? 13 : 19) + (focus ? Math.sin(this.t * 6) * 1.5 : 0);
        c.strokeStyle = focus ? C.brassHi : 'rgba(242,220,154,0.6)'; c.lineWidth = focus ? 2 : 1;
        c.beginPath(); c.moveTo(p.x, p.y - rr); c.lineTo(p.x + rr, p.y); c.lineTo(p.x, p.y + rr); c.lineTo(p.x - rr, p.y); c.closePath(); c.stroke(); c.lineWidth = 1;
      }
    },

    drawTraces(s, c, k) {
      const g = this.game, kit = g.kitOf(k);
      if (!H.TRACES[kit]) return;
      const L = layout(kit), sel = s.trSel || 'skill';
      c.fillStyle = 'rgba(4,6,22,0.62)'; c.fillRect(AREA.x, AREA.y, AREA.w, AREA.h);
      c.fillStyle = '#3a3020'; for (let y = ABIL_Y + 22; y < BONUS_Y.a6 + 30; y += 9) c.fillRect(RAIL_X - 6, y, 12, 2);
      c.fillStyle = '#8a7448'; c.fillRect(RAIL_X - 4, ABIL_Y + 16, 2, BONUS_Y.a6 - ABIL_Y + 6); c.fillRect(RAIL_X + 3, ABIL_Y + 16, 2, BONUS_Y.a6 - ABIL_Y + 6);
      c.fillStyle = '#8a7448'; c.fillRect(ABIL_X.basic, ABIL_Y - 1, ABIL_X.tech - ABIL_X.basic, 2);
      const st = {};
      for (const id of L.ids) st[id] = g.traceNode(k, id);
      const on = id => id === 'root' || (st[id] && st[id].cur > 0);
      for (const [a, b, dashed] of L.edges) {
        const pa = L.pos[a], pb = L.pos[b], lit = on(a) && on(b);
        c.strokeStyle = lit ? 'rgba(255,230,150,0.9)' : 'rgba(154,166,208,0.45)'; c.setLineDash(dashed ? [2, 3] : []);
        c.beginPath(); c.moveTo(pa.x, pa.y); c.lineTo(pa.x, pb.y); c.lineTo(pb.x, pb.y); c.stroke();
      }
      c.setLineDash([]);
      this.diamond(RAIL_X, ROOT_Y, 4, C.brassHi, '#1a1208');
      for (const id of L.ids) {
        const n = st[id].node, f = s.trFlash && s.trFlash.id === id ? Math.max(0, 1 - (this.t - s.trFlash.t) / 0.8) : 0;
        this.drawTraceNode(c, k, n, L.pos[id], st[id], id === sel, !!s.trFocus, f);
        this.hit(L.pos[id].x - 15, L.pos[id].y - 15, 30, 30, () => { if (s.trSel === id && s.trFocus) this.traceUpgrade(s, k, id); else { s.trSel = id; s.trFocus = true; this.sfx('select'); } });
      }
    },

    panelTraces(s, c, px, py, pw, ph, k) {
      const g = this.game, kit = g.kitOf(k), r = g.state.roster[k], d = H.TRACES[kit];
      const id = s.trSel || 'skill', st = g.traceNode(k, id);
      const sep = y => { c.fillStyle = 'rgba(242,220,154,0.35)'; c.fillRect(px + 10, y, pw - 20, 1); };
      this.text('Следы', px + 12, py + 12, { size: 14, bold: true, serif: true, col: C.gold });
      this.text('ур. ' + r.lvl + ' · фаза ' + (g.ascOf ? g.ascOf(k) : H.tracePhase(r.lvl)), px + pw - 12, py + 15, { size: 10, align: 'right', col: C.sub });
      sep(py + 34);
      if (!d || !st) { this.text('Следов пока нет.', px + 12, py + 46, { size: 11, col: C.dim }); return; }
      const n = st.node;
      let y = py + 42;
      this.wrap(this.traceTitle(k, n), pw - 24, 12).slice(0, 2).forEach(l => { this.text(l, px + 12, y, { size: 12, bold: true, col: C.cream }); y += 15; });
      if (n.kind === 'ability') {
        const cap = H.traceAbilityCap(id, g.ascOf ? H.TRACE_PHASE_LVL[g.ascOf(k)] : r.lvl);
        this.text('Уровень ' + st.cur + ' / ' + n.max + (st.up ? ' (+' + st.up + ')' : '') + ' · потолок ' + cap, px + 12, y, { size: 10, col: st.up ? C.cyan : C.sub }); y += 16;
        const kab = KIT_AB[id] && H.CHARS[kit][KIT_AB[id]];
        if (kab && kab.fx && !kab.text) {
          const now = this.describeFx(H.traceScaleAb(kab, id, st.cur + (st.up || 0), kit));
          this.wrap('Сейчас: ' + now, pw - 24, 10).slice(0, 3).forEach(l => { this.text(l, px + 12, y, { size: 10, col: '#c8d0f0' }); y += 12; });
          if (st.cur < n.max) this.wrap('Ур. ' + (st.cur + 1 + (st.up || 0)) + ': ' + this.describeFx(H.traceScaleAb(kab, id, st.cur + 1 + (st.up || 0), kit)), pw - 24, 10).slice(0, 3).forEach(l => { this.text(l, px + 12, y, { size: 10, col: C.ok }); y += 12; });
        } else this.wrap(id === 'talent' ? H.CHARS[kit].talent : kab && kab.text ? kab.text : '', pw - 24, 10).slice(0, 4).forEach(l => { this.text(l, px + 12, y, { size: 10, col: '#c8d0f0' }); y += 12; });
      } else if (n.kind === 'tech') {
        this.wrap(H.CHARS[kit].tech.text, pw - 24, 10).slice(0, 4).forEach(l => { this.text(l, px + 12, y, { size: 10, col: '#c8d0f0' }); y += 12; });
        this.text('Открыта с самого начала.', px + 12, y + 4, { size: 10, col: C.ok });
      } else if (n.kind === 'bonus') {
        this.text('Доп. способность · ' + this.traceGate(n.gate), px + 12, y, { size: 10, col: C.sub }); y += 15;
        this.wrap(n.text ? g.fill(n.text) : 'Описание появится вместе с переделкой героя.', pw - 24, 10).slice(0, 7).forEach(l => { this.text(l, px + 12, y, { size: 10, col: st.cur ? C.ok : '#c8d0f0' }); y += 12; });
      } else {
        this.text(this.traceStatText(n), px + 12, y, { size: 12, bold: true, col: st.cur ? C.ok : C.cream }); y += 16;
        this.text(this.traceGate(n.gate, true), px + 12, y, { size: 10, col: C.sub }); y += 14;
      }
      y = Math.max(y + 6, py + 196);
      sep(y);
      y += 8;
      if (st.why === 'max') this.text(n.kind === 'tech' ? '' : 'Открыто полностью.', px + 12, y, { size: 11, col: C.ok });
      else if (st.cost) {
        this.text('Стоимость', px + 12, y, { size: 11, bold: true, col: C.gold }); y += 16;
        const inv = g.state.inv.items, tearsOk = (st.tears || 0) <= (inv.tears || 0), rows = Object.entries(st.cost.items).concat(st.tears ? [['tears', st.tears]] : []);
        const covered = m => tearsOk && m !== 'tears' && H.ITEMS[m].mat === 'path';
        rows.forEach(([m, need]) => {
          const have = inv[m] || 0, short = have < need && !covered(m), quick = short && this.traceQuickRow(m);
          G.rarityCell(c, px + 12, y - 2, 20, 20, H.ITEMS[m].rar); G.itemIcon(c, m, px + 13, y - 1, 18);
          if (quick) this.guideCoupon(c, px + pw - 66, y + 7, 8, false, (inv.fuelv || 0) >= g.domainCoupons(quick.id), () => this.traceQuick(k, m));
          const nm = this.wrap(H.ITEMS[m].name, pw - (quick ? 112 : 96), 9).slice(0, 2);
          nm.forEach((l, i) => this.text(l, px + 38, y + (nm.length > 1 ? -2 : 3) + i * 10, { size: 9, col: C.cream }));
          this.text(have + '/' + need, px + pw - 12, y + 2, { size: 10, bold: true, align: 'right', col: short ? C.bad : have < need ? C.gold : C.ok });
          y += 23;
        });
        this.text('Кредиты', px + 38, y + 2, { size: 10, col: C.cream });
        this.text(H.fmt(st.cost.credits), px + pw - 12, y + 2, { size: 10, bold: true, align: 'right', col: g.state.credits < st.cost.credits ? C.bad : C.ok });
        y += 18;
        const missing = rows.find(([m, need]) => (inv[m] || 0) < need && !covered(m));
        const why = st.why === 'lvl' ? this.traceGate(st.gate, true) + '.' : st.why === 'pre' ? WHY.pre + this.traceTitle(k, H.traceNodes(kit).find(x => x.id === n.pre)) + '».' : st.why === 'mats' && missing ? 'Где взять: ' + sourceOf(missing[0]) : st.why ? WHY[st.why] : st.tears ? 'Недостающие материалы Пути заменят Слёзы мечтаний ×' + st.tears + '.' : '';
        this.wrap(why, pw - 24, 10).slice(0, 3).forEach(l => { this.text(l, px + 12, y, { size: 10, col: st.why === 'lvl' || st.why === 'pre' ? C.bad : C.sub }); y += 12; });
      }
      this.button(px + 12, py + ph - 38, pw - 24, 24, st.why === 'max' ? 'Открыто' : 'Улучшить', () => this.traceUpgrade(s, k, id), { size: 11, icon: 'traces', disabled: !st.ok });
    },

    traceHints(s) {
      return s.trFocus ? [['←↑↓→', 'Узел'], ['Enter', 'Улучшить'], ['R', 'Купон'], ['Esc', 'Назад']] : [['Enter', 'К Следам']];
    },

    traceGate(gate, long) {
      if (H.TUNING.ascOn && gate <= 70 && gate > 1) return (long ? 'Нужно возвышение ' : 'возв. ') + (gate - 10) / 10;
      return (long ? 'Нужен уровень ' : 'ур. ') + gate;
    },

    traceQuickRow(m) {
      const g = this.game, src = g.needSource ? g.needSource(m) : null, row = src && src.row;
      return row && row.kind === 'calyx' && row.open && g.domainCoupons(row.id) > 0 ? row : null;
    },

    traceShortQuick(k, id) {
      const g = this.game, st = g.traceNode(k, id), inv = g.state.inv.items;
      if (!st || !st.cost) return null;
      return Object.entries(st.cost.items).map(([m]) => m).find(m => (inv[m] || 0) < st.cost.items[m] && this.traceQuickRow(m)) || null;
    },

    traceQuick(k, m) {
      const ui = this, g = this.game, row = this.traceQuickRow(m);
      if (!row) { ui.sfx('deny'); ui.toast('Этот материал нельзя получить за Топливные купоны.'); return; }
      const tier = Math.max(0, g.tiersOpen().lastIndexOf(true)), open = o => ui.openQuickFarm(row.id, tier, o);
      if (g.guideTarget() === k) { open(); return; }
      const name = ui.shortName(k);
      this.push({
        sel: 0,
        draw(c) {
          const x = W / 2 - 190, y = HGT / 2 - 74;
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, 380, 148, { title: 'Цель развития' });
          ui.wrap('Назначить персонажа «' + name + '» целью развития? Тогда быстрое получение остановится, когда материалов для Следов хватит, а Индекс выживаемости покажет, где брать остальное.', 340, 11).slice(0, 4).forEach((l, i) => ui.text(l, x + 20, y + 22 + i * 15, { size: 11 }));
          ui.button(x + 20, y + 104, 164, 24, 'Сделать целью', () => { this.sel = 0; this.key('ok'); }, { size: 11, active: this.sel === 0 });
          ui.button(x + 196, y + 104, 164, 24, 'Только получить', () => { this.sel = 1; this.key('ok'); }, { size: 11, active: this.sel === 1 });
        },
        key(kk) {
          if (kk === 'left' || kk === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (kk === 'back') { ui.screens.pop(); ui.sfx('cancel'); return; }
          if (kk !== 'ok') return;
          ui.screens.pop();
          if (this.sel === 0) { g.setGuideTarget(k); ui.toast('Цель развития: ' + name + '.'); open(); }
          else open({ target: false });
        }
      });
    },

    traceUpgrade(s, k, id) {
      const g = this.game, st = g.traceNode(k, id);
      if (!st || !st.ok) {
        this.sfx('deny');
        if (st && st.why) this.toast(st.why === 'lvl' ? this.traceGate(st.gate, true) + '.' : st.why === 'pre' ? 'Сначала откройте предыдущий узел.' : WHY[st.why]);
        return false;
      }
      const rare = Object.keys(st.cost.items).filter(m => H.ITEMS[m].mat === 'echo' || H.ITEMS[m].mat === 'tracks');
      const go = () => {
        if (!g.trace(k, id)) { this.sfx('deny'); return; }
        s.trFlash = { id, t: this.t };
        this.sfx('confirm');
        this.drainGameEvents();
      };
      if (!rare.length) { go(); return true; }
      const ui = this;
      this.push({
        draw(c) {
          const x = W / 2 - 170, y = HGT / 2 - 70;
          c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, 340, 140, { title: 'Редкие материалы' });
          ui.wrap('Улучшение потратит: ' + rare.map(m => H.ITEMS[m].name + ' ×' + st.cost.items[m]).join(', ') + '. Продолжить?', 300, 11).forEach((l, i) => ui.text(l, x + 20, y + 30 + i * 15, { size: 11 }));
          ui.button(x + 20, y + 100, 140, 24, 'Улучшить', () => this.key('ok'), { size: 11, active: true });
          ui.button(x + 180, y + 100, 140, 24, 'Отмена', () => this.key('back'), { size: 11 });
        },
        key(kk) {
          if (kk === 'ok') { ui.screens.pop(); go(); }
          if (kk === 'back') { ui.screens.pop(); ui.sfx('cancel'); }
        }
      });
      return true;
    },

    tracesKey(s, kk, code, k) {
      const L = layout(this.game.kitOf(k)), cur = L.pos[s.trSel || 'skill'];
      if (code === 'KeyQ') { s.switchChar(-1); return; }
      if (code === 'KeyE') { s.switchChar(1); return; }
      if (code === 'KeyR') { const m = this.traceShortQuick(k, s.trSel || 'skill'); if (m) this.traceQuick(k, m); else { this.sfx('deny'); this.toast('Для этого узла нечего получать за Топливные купоны.'); } return; }
      const dir = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[kk];
      if (dir) {
        let best = null, bd = Infinity;
        for (const id of L.ids) {
          const p = L.pos[id], dx = p.x - cur.x, dy = p.y - cur.y, along = dx * dir[0] + dy * dir[1], side = Math.abs(dx * dir[1]) + Math.abs(dy * dir[0]);
          if (along <= 0) continue;
          const score = along + side * 2.2;
          if (score < bd) { bd = score; best = id; }
        }
        if (best) { s.trSel = best; this.sfx('select'); }
        return;
      }
      if (kk === 'ok') { this.traceUpgrade(s, k, s.trSel || 'skill'); return; }
      if (kk === 'back') { s.trFocus = false; this.sfx('cancel'); }
    },

    useShadowFlow(id) {
      const g = this.game, it = H.ITEMS[id], kit = it.path === 'destruction' ? 'trail' : 'trail_p';
      if (!g.useShadow(id)) {
        this.sfx('deny');
        this.toast(!(g.state.inv.items[id] > 0) ? 'Нет предмета «' + it.name + '».' : 'Все Эйдолоны этого Пути уже открыты.');
        return false;
      }
      const r = g.state.roster.trail, n = kit === g.state.mcPath ? r.eid : r.eidBy[kit];
      this.sfx('star4');
      this.toast('Эйдолон Первопроходца на Пути ' + H.TRACE_PATH_LINES[kit === 'trail' ? 'dest' : 'pres'][1] + ': ' + n + ' из 6.');
      return true;
    },

    traceBackNotice() {
      const g = this.game, s = g.state;
      if (!s.trBack || s.trBackSeen) return false;
      s.trBackSeen = true;
      const ui = this, list = Object.entries(s.trBack).map(([id, n]) => H.ITEMS[id].name + ' ×' + n);
      this.push({
        draw(c) {
          const lines = ui.wrap('Следы героев экипажа открыты до потолка их уровня. За то, что вы уже прошли, начислено: ' + list.join(', ') + '.', 400, 11);
          const h = 80 + lines.length * 15, x = W / 2 - 220, y = HGT / 2 - h / 2;
          c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, 440, h, { title: 'Патч 1.6: Следы' });
          G.menuIcon(c, 'traces', x + 14, y + 22, 28);
          lines.forEach((l, i) => ui.text(l, x + 50, y + 24 + i * 15, { size: 11 }));
          ui.hints([['Enter', 'Понятно']], W / 2, y + h - 22, { align: 'center' });
          ui.hit(0, 0, W, HGT, () => this.key('ok'));
        },
        key(kk) { if (kk === 'ok' || kk === 'back') { ui.screens.pop(); ui.sfx('confirm'); } }
      });
      return true;
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
