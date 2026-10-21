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
  const WHY = { lvl: 'Нужен уровень героя ', pre: 'Сначала откройте узел «', credits: 'Не хватает кредитов.', mats: 'Не хватает материалов.', max: 'Узел уже на максимуме.' };

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
        if (locked) this.text('ур. ' + st.gate, p.x + 15, p.y - 5, { size: 9, col: C.dim });
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
      this.text('ур. ' + r.lvl + ' · фаза ' + H.tracePhase(r.lvl), px + pw - 12, py + 15, { size: 10, align: 'right', col: C.sub });
      sep(py + 34);
      if (!d || !st) { this.text('Следов пока нет.', px + 12, py + 46, { size: 11, col: C.dim }); return; }
      const n = st.node;
      let y = py + 42;
      this.wrap(this.traceTitle(k, n), pw - 24, 12).slice(0, 2).forEach(l => { this.text(l, px + 12, y, { size: 12, bold: true, col: C.cream }); y += 15; });
      if (n.kind === 'ability') {
        const cap = H.traceAbilityCap(id, r.lvl);
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
        this.text('Доп. способность · ур. ' + n.gate, px + 12, y, { size: 10, col: C.sub }); y += 15;
        this.wrap(n.text ? g.fill(n.text) : 'Описание появится вместе с переделкой героя.', pw - 24, 10).slice(0, 7).forEach(l => { this.text(l, px + 12, y, { size: 10, col: st.cur ? C.ok : '#c8d0f0' }); y += 12; });
      } else {
        this.text(this.traceStatText(n), px + 12, y, { size: 12, bold: true, col: st.cur ? C.ok : C.cream }); y += 16;
        this.text('Нужен уровень ' + n.gate, px + 12, y, { size: 10, col: C.sub }); y += 14;
      }
      y = Math.max(y + 6, py + 196);
      sep(y);
      y += 8;
      if (st.why === 'max') this.text(n.kind === 'tech' ? '' : 'Открыто полностью.', px + 12, y, { size: 11, col: C.ok });
      else if (st.cost) {
        this.text('Стоимость', px + 12, y, { size: 11, bold: true, col: C.gold }); y += 16;
        const inv = g.state.inv.items, rows = Object.entries(st.cost.items);
        rows.forEach(([m, need]) => {
          const have = inv[m] || 0, short = have < need;
          G.rarityCell(c, px + 12, y - 2, 20, 20, H.ITEMS[m].rar); G.itemIcon(c, m, px + 13, y - 1, 18);
          const nm = this.wrap(H.ITEMS[m].name, pw - 96, 9).slice(0, 2);
          nm.forEach((l, i) => this.text(l, px + 38, y + (nm.length > 1 ? -2 : 3) + i * 10, { size: 9, col: C.cream }));
          this.text(have + '/' + need, px + pw - 12, y + 2, { size: 10, bold: true, align: 'right', col: short ? C.bad : C.ok });
          y += 23;
        });
        this.text('Кредиты', px + 38, y + 2, { size: 10, col: C.cream });
        this.text(H.fmt(st.cost.credits), px + pw - 12, y + 2, { size: 10, bold: true, align: 'right', col: g.state.credits < st.cost.credits ? C.bad : C.ok });
        y += 18;
        const missing = rows.find(([m, need]) => (inv[m] || 0) < need);
        const why = st.why === 'lvl' ? WHY.lvl + st.gate + '.' : st.why === 'pre' ? WHY.pre + this.traceTitle(k, H.traceNodes(kit).find(x => x.id === n.pre)) + '».' : st.why === 'mats' && missing ? 'Где взять: ' + sourceOf(missing[0]) : st.why ? WHY[st.why] : '';
        this.wrap(why, pw - 24, 10).slice(0, 3).forEach(l => { this.text(l, px + 12, y, { size: 10, col: st.why === 'lvl' || st.why === 'pre' ? C.bad : C.sub }); y += 12; });
      }
      this.button(px + 12, py + ph - 38, pw - 24, 24, st.why === 'max' ? 'Открыто' : 'Улучшить', () => this.traceUpgrade(s, k, id), { size: 11, icon: 'traces', disabled: !st.ok });
    },

    traceHints(s) {
      return s.trFocus ? [['←↑↓→', 'Узел'], ['Enter', 'Улучшить'], ['Esc', 'Назад']] : [['Enter', 'К Следам']];
    },

    traceUpgrade(s, k, id) {
      const g = this.game, st = g.traceNode(k, id);
      if (!st || !st.ok) {
        this.sfx('deny');
        if (st && st.why) this.toast(st.why === 'lvl' ? WHY.lvl + st.gate + '.' : st.why === 'pre' ? 'Сначала откройте предыдущий узел.' : WHY[st.why]);
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
    },

    synthRows(mode) {
      const g = this.game, inv = g.state.inv.items;
      if (mode === 0) return g.synthList().map(r => ({ from: r.from, to: r.to, have: inv[r.from] || 0, n: 3 }));
      return Object.keys(H.ITEMS).filter(id => { const it = H.ITEMS[id]; return it.kind === 'mat' && (it.mat === 'path' || it.mat === 'foe'); }).map(to => ({ to, have: inv[to] || 0, n: 2 }));
    },

    openUi_synth() { this.openSynth(() => this.finishPending()); },

    openSynth(close) {
      const ui = this, g = this.game;
      this.push({
        full: true, mode: 0, sel: 0, qty: 1, src: 0,
        sources(row) {
          const inv = g.state.inv.items;
          return Object.keys(inv).filter(id => g.exchangeOk(id, row.to) && inv[id] >= 2).sort((a, b) => inv[b] - inv[a]);
        },
        draw(c) {
          const rows = ui.synthRows(this.mode), inv = g.state.inv.items;
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(4,6,20,0.5)'; c.fillRect(0, 0, W, HGT);
          ui.plate(12, 10, 'Омни-синтезатор');
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          [['Синтез', 0], ['Обмен', 1]].forEach(([label, m], i) => ui.button(190 + i * 96, 10, 90, 24, label, () => { this.mode = m; this.sel = 0; this.qty = 1; this.src = 0; ui.sfx('select'); }, { size: 11, active: this.mode === m, icon: 'synth' }));
          this.sel = Math.max(0, Math.min(this.sel, rows.length - 1));
          ui.win(12, 44, 410, 404, { alpha: 0.88, corners: false });
          const per = 2 * 8, top = Math.max(0, Math.min(rows.length - per, Math.floor(this.sel / 2) * 2 - 6));
          rows.slice(top, top + per).forEach((r, j) => {
            const i = top + j, x = 22 + (j % 2) * 200, y = 54 + Math.floor(j / 2) * 48, on = i === this.sel, it = H.ITEMS[r.to];
            c.fillStyle = on ? 'rgba(242,220,154,0.18)' : 'rgba(255,255,255,0.03)'; c.fillRect(x, y, 194, 44);
            if (on) { c.strokeStyle = C.brassHi; c.strokeRect(x + 0.5, y + 0.5, 193, 43); }
            if (r.from) { G.rarityCell(c, x + 4, y + 6, 32, 32, H.ITEMS[r.from].rar); G.itemIcon(c, r.from, x + 4, y + 6, 32); ui.text('→', x + 46, y + 14, { size: 13, bold: true, col: C.gold }); }
            const ix = r.from ? x + 60 : x + 4;
            G.rarityCell(c, ix, y + 6, 32, 32, it.rar); G.itemIcon(c, r.to, ix, y + 6, 32);
            ui.text(ui.fitText(it.name, 10, 194 - (ix - x) - 40), ix + 38, y + 8, { size: 10, col: C.cream });
            ui.text('есть ' + (inv[r.to] || 0) + (r.from ? ' · из ' + r.have : ''), ix + 38, y + 24, { size: 9, col: C.sub });
            ui.hit(x, y, 194, 44, () => { if (this.sel === i) this.key('ok'); else { this.sel = i; this.qty = 1; this.src = 0; } });
          });
          if (rows.length > per) ui.scrollBar(412, 54, 8 * 48 - 4, { top }, Math.ceil(rows.length / 2) * 2, per);
          const px = 432, py = 44, pw = 196, r = rows[this.sel];
          ui.win(px, py, pw, 404, { alpha: 0.9 });
          if (r) {
            const to = H.ITEMS[r.to];
            const src = this.mode === 0 ? r.from : this.sources(r)[this.src % Math.max(1, this.sources(r).length)];
            const max = src ? Math.floor((inv[src] || 0) / r.n) : 0;
            this.qty = Math.max(1, Math.min(this.qty, Math.max(1, max)));
            ui.text(this.mode === 0 ? 'Синтез' : 'Обмен', px + 12, py + 12, { size: 14, bold: true, serif: true, col: C.gold });
            ui.wrap(this.mode === 0 ? 'Три материала дают один материал следующей ступени. Бесплатно.' : 'Два материала того же вида и той же ступени дают один нужный.', pw - 24, 10).forEach((l, i) => ui.text(l, px + 12, py + 34 + i * 12, { size: 10, col: C.sub }));
            G.rarityCell(c, px + pw / 2 - 30, py + 70, 60, 60, to.rar); G.itemIcon(c, r.to, px + pw / 2 - 28, py + 72, 56);
            ui.wrap(to.name, pw - 24, 12).slice(0, 2).forEach((l, i) => ui.text(l, px + pw / 2, py + 136 + i * 15, { align: 'center', size: 12, bold: true, col: C.gold }));
            ui.text('В наличии: ' + (inv[r.to] || 0), px + pw / 2, py + 168, { align: 'center', size: 10, col: C.sub });
            if (src) {
              G.rarityCell(c, px + 12, py + 190, 32, 32, H.ITEMS[src].rar); G.itemIcon(c, src, px + 12, py + 190, 32);
              ui.wrap(H.ITEMS[src].name, pw - 70, 10).slice(0, 2).forEach((l, i) => ui.text(l, px + 52, py + 192 + i * 12, { size: 10, col: C.cream }));
              ui.text((inv[src] || 0) + ' / ' + r.n * this.qty, px + pw - 12, py + 216, { size: 10, bold: true, align: 'right', col: (inv[src] || 0) >= r.n * this.qty ? C.ok : C.bad });
              if (this.mode === 1 && this.sources(r).length > 1) ui.text('Tab: другой материал', px + 12, py + 232, { size: 9, col: C.dim });
              ui.text('Количество', px + 12, py + 256, { size: 11, col: C.sub });
              ui.text('◀ ' + this.qty + ' ▶', px + pw - 12, py + 256, { size: 12, bold: true, align: 'right' });
            } else ui.wrap(this.mode === 0 ? 'Нужно три материала.' : 'Нет двух одинаковых материалов той же ступени.', pw - 24, 10).forEach((l, i) => ui.text(l, px + 12, py + 196 + i * 12, { size: 10, col: C.dim }));
            ui.wrap(ui.traceSource(r.to), pw - 24, 9).slice(0, 3).forEach((l, i) => ui.text(l, px + 12, py + 290 + i * 12, { size: 9, col: C.dim }));
            ui.button(px + 12, py + 404 - 36, pw - 24, 24, this.mode === 0 ? 'Синтезировать' : 'Обменять', () => this.key('ok'), { size: 11, icon: 'synth', disabled: !src || max < 1 });
          }
          ui.hints([['Q/E', 'Режим'], ['←↑↓→', 'Выбор'], ['A/D', 'Количество'], ['Enter', this.mode === 0 ? 'Синтез' : 'Обмен'], ['Esc', 'Назад']], 12, HGT - 18);
        },
        key(kk, code) {
          const rows = ui.synthRows(this.mode), n = rows.length;
          if (code === 'KeyQ' || code === 'KeyE') { this.mode = 1 - this.mode; this.sel = 0; this.qty = 1; this.src = 0; ui.sfx('select'); return; }
          if (code === 'KeyA') { this.qty = Math.max(1, this.qty - 1); ui.sfx('select'); return; }
          if (code === 'KeyD') { this.qty++; ui.sfx('select'); return; }
          if (code === 'Tab') { this.src++; ui.sfx('select'); return; }
          if (kk === 'back') { ui.screens.pop(); ui.sfx('cancel'); if (close) close(); return; }
          if (!n) return;
          const mv = { left: -1, right: 1, up: -2, down: 2 }[kk];
          if (mv) { this.sel = Math.max(0, Math.min(n - 1, this.sel + mv)); this.qty = 1; this.src = 0; ui.sfx('select'); return; }
          if (kk === 'ok') {
            const r = rows[this.sel];
            const src = this.mode === 0 ? r.from : this.sources(r)[this.src % Math.max(1, this.sources(r).length)];
            const done = src && (this.mode === 0 ? g.synth(src, this.qty) : g.exchange(src, r.to, this.qty));
            if (!done) { ui.sfx('deny'); ui.toast('Не хватает материалов.'); return; }
            ui.sfx('chest');
            ui.toast('Получено: ' + H.ITEMS[r.to].name + ' ×' + this.qty + '.');
            this.qty = 1;
          }
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
