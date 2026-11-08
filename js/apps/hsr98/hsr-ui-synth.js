(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;

  const TABS = [
    { id: 'food', label: 'Расходные предметы', icon: 'sfood' },
    { id: 'mat', label: 'Синтез материалов', icon: 'smat' },
    { id: 'swap', label: 'Обмен материалами', icon: 'sswap' },
    { id: 'relic', label: 'Реликвии', icon: 'relic' },
    { id: 'relicSalvage', label: 'Разбор Реликвий', icon: 'rsalv' },
    { id: 'coneSalvage', label: 'Разбор Световых конусов', icon: 'csalv' }
  ];
  const GRID = { x: 18, y: 54, cw: 58, ch: 66, gap: 6, cols: 3, rows: 5 };
  const PANEL = { x: 236, y: 44, w: 392, h: 404, mid: 432 };
  const SLIDER = { x: 304, y: 331, w: 240 };
  const TAB_ROW = { mid: 334, step: 34, y: 19, r: 13 };
  const NEED = { mat: 3, swap: 2 };
  const RELIC_GRID = { cavernY: 72, planarY: 334, pitch: 60, ch: 54 };

  Object.assign(H.UI.prototype, {
    synthTabs: TABS,

    synthBox() {
      const wide = this.wide(), lx = this.left + 12, rx = this.right;
      const gw = wide ? 280 : 214;
      const grid = { x: lx + (wide ? 8 : 6), y: GRID.y, cw: GRID.cw, ch: GRID.ch, gap: GRID.gap, cols: wide ? 4 : GRID.cols, rows: GRID.rows, wx: lx, wy: 44, ww: gw, wh: 404 };
      const px = wide ? lx + gw + 10 : PANEL.x, pw = wide ? rx - 12 - px : PANEL.w;
      const panel = { x: px, y: PANEL.y, w: pw, h: PANEL.h, mid: Math.round(px + pw / 2) };
      const slider = { x: px + 68, y: SLIDER.y, w: pw - 152 };
      return { wide, lx, rx, grid, panel, slider };
    },

    salvageBox() {
      const wide = this.wide(), px = this.left + 12, rx = this.right, pw = wide ? 236 : 192;
      const gx = px + pw + 8, gw = rx - 12 - gx, cols = wide ? 10 : 7;
      return { wide, px, pw, gx, gw, cols, rx };
    },

    synthLock(tab) {
      const id = TABS[tab].id;
      return id === 'relic' && !this.game.relicCraftOpen() ? 'с уровня Освоения ' + H.RELIC_CRAFT.tl + ' или после знакомства с Залом забвения' : null;
    },

    synthRows(tab) {
      const g = this.game, inv = g.state.inv.items, id = TABS[tab].id;
      if (id === 'food') return Object.keys(H.RECIPES).map(to => ({ to, have: inv[to] || 0, known: g.recipeKnown(to) }));
      if (id === 'mat') return g.synthList().map(r => ({ to: r.to, from: r.from, have: inv[r.to] || 0 }));
      if (id === 'swap') return Object.keys(H.ITEMS).filter(k => { const it = H.ITEMS[k]; return it.kind === 'mat' && (it.mat === 'path' || it.mat === 'foe'); }).map(to => ({ to, have: inv[to] || 0 }));
      return [];
    },

    synthSources(to) {
      const g = this.game, inv = g.state.inv.items;
      return Object.keys(inv).filter(id => g.exchangeOk(id, to) && inv[id] >= NEED.swap).sort((a, b) => inv[b] - inv[a]);
    },

    synthNeeds(tab, r, src) {
      const id = TABS[tab].id;
      if (id === 'food') return Object.entries(H.RECIPES[r.to]);
      if (id === 'mat') return [[r.from, NEED.mat]];
      return src ? [[src, NEED.swap]] : [];
    },

    synthMax(tab, r, src) {
      const inv = this.game.state.inv.items, id = TABS[tab].id;
      if (!r) return 0;
      if (id === 'food') return this.game.cookMax(r.to);
      if (id === 'mat') return Math.floor((inv[r.from] || 0) / NEED.mat);
      if (id === 'swap') return src ? Math.floor((inv[src] || 0) / NEED.swap) : 0;
      return 0;
    },

    synthCan(tab, r) {
      return TABS[tab].id === 'swap' ? this.synthSources(r.to).length > 0 : this.synthMax(tab, r) > 0;
    },

    synthHeader(c, scr) {
      const ui = this, g = this.game, t = TABS[scr.tab], inv = g.state.inv.items, b = ui.synthBox();
      G.menuIcon(c, 'synth', ui.left + 10, 6, 26, C.brassHi);
      ui.text('Синтез и Разборка', ui.left + 42, 6, { size: 9, col: C.brass });
      ui.text(ui.fitText(t.label, 13, b.wide ? 240 : 170, true), ui.left + 42, 18, { size: 13, bold: true, serif: true, col: C.gold });
      const mid = b.wide ? W / 2 : TAB_ROW.mid, x0 = mid - (TABS.length - 1) * TAB_ROW.step / 2;
      const qx = x0 - TAB_ROW.r - 20, ex = x0 + (TABS.length - 1) * TAB_ROW.step + TAB_ROW.r + 6;
      ui.keycap(qx, TAB_ROW.y - 6, 'Q');
      ui.hit(qx - 2, TAB_ROW.y - 9, 18, 18, () => scr.setTab(scr.tab - 1));
      ui.keycap(ex, TAB_ROW.y - 6, 'E');
      ui.hit(ex - 2, TAB_ROW.y - 9, 18, 18, () => scr.setTab(scr.tab + 1));
      TABS.forEach((tb, i) => {
        const cx = x0 + i * TAB_ROW.step, cy = TAB_ROW.y, on = i === scr.tab, locked = !!ui.synthLock(i);
        c.fillStyle = '#010208'; c.beginPath(); c.arc(cx, cy, TAB_ROW.r + 1, 0, Math.PI * 2); c.fill();
        c.fillStyle = on ? '#2c2e62' : '#0c1030'; c.beginPath(); c.arc(cx, cy, TAB_ROW.r, 0, Math.PI * 2); c.fill();
        c.strokeStyle = on ? C.brassHi : C.brassDk; c.lineWidth = on ? 2 : 1; c.beginPath(); c.arc(cx, cy, TAB_ROW.r - 1, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
        G.menuIcon(c, tb.icon, cx - 10, cy - 10, 20, locked ? '#4c5070' : on ? '#fff0c0' : '#c8cce0');
        if (on) { c.fillStyle = C.brassHi; c.fillRect(cx - 12, cy + TAB_ROW.r + 3, 24, 2); }
        ui.hit(cx - TAB_ROW.r, cy - TAB_ROW.r, TAB_ROW.r * 2, TAB_ROW.r * 2, () => scr.setTab(i));
      });
      if (ui.synthLock(scr.tab)) return;
      const rx = b.rx;
      if (t.id === 'relic') {
        ui.money(rx - 166, 11, 'remains', inv.remains || 0);
        ui.money(rx - 96, 11, 'resin', inv.resin || 0);
      } else if (t.id === 'relicSalvage') {
        ui.button(rx - 182, 8, 72, 22, 'Правила', () => ui.openRelicSalvageRules(), { size: 9, icon: 'info' });
        ui.money(rx - 104, 11, 'remains', inv.remains || 0);
      } else if (t.id === 'coneSalvage') {
        ui.button(rx - 120, 8, 80, 22, 'Правила', () => ui.openConeSalvageRules(), { size: 10, icon: 'info' });
      }
    },

    synthCell(c, id, n, x, y, on, sil) {
      const it = H.ITEMS[id], ui = this;
      G.rarityCell(c, x, y, GRID.cw, 48, sil ? 1 : it.rar || 2);
      if (sil) G.itemSilhouette(c, id, x + 9, y + 2, 40); else G.itemIcon(c, id, x + 9, y + 2, 40);
      ui.text('★'.repeat(it.rar || 2), x + GRID.cw / 2, y + 38, { align: 'center', size: 8, col: '#ffe08a' });
      c.fillStyle = '#0a0c1e'; c.fillRect(x, y + 48, GRID.cw, 16);
      c.fillStyle = G.RARITY[it.rar || 2]; c.fillRect(x, y + 63, GRID.cw, 1);
      ui.text(sil ? '?' : String(n), x + GRID.cw / 2, y + 50, { align: 'center', size: 11, bold: true, col: n && !sil ? C.cream : C.dim });
      if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, GRID.cw + 2, GRID.ch); c.lineWidth = 1; }
    },

    synthGrid(c, scr, rows, b = this.synthBox()) {
      const ui = this, gr = b.grid, nRows = Math.ceil(rows.length / gr.cols);
      ui.win(gr.wx, gr.wy, gr.ww, gr.wh, { alpha: 0.88, corners: false });
      const top = ui.listTop(scr.sc, Math.floor(scr.sel / gr.cols), nRows, gr.rows);
      rows.slice(top * gr.cols, (top + gr.rows) * gr.cols).forEach((r, j) => {
        const i = top * gr.cols + j, x = gr.x + (j % gr.cols) * (gr.cw + gr.gap), y = gr.y + Math.floor(j / gr.cols) * (gr.ch + 4);
        ui.synthCell(c, r.to, r.have, x, y, i === scr.sel, r.known === false);
        ui.hit(x, y, gr.cw, gr.ch, () => scr.pick(i));
      });
      if (!rows.length) ui.wrap(scr.filter ? 'Сейчас синтезировать нечего. F показывает всё.' : 'Пусто.', gr.ww - 34, 10).forEach((l, i) => ui.text(l, gr.wx + gr.ww / 2, 200 + i * 14, { align: 'center', size: 10, col: C.dim }));
      if (nRows > gr.rows) ui.scrollBar(gr.wx + gr.ww - 16, gr.y, gr.rows * (gr.ch + 4) - 4, scr.sc, nRows, gr.rows);
      ui.wheelZone(gr.wx, gr.wy, gr.ww, 360, d => { scr.sc.top += d; });
      ui.button(gr.wx + 8, 414, 120, 22, scr.filter ? 'Фильтр: можно' : 'Фильтр: все', () => scr.toggleFilter(), { size: 10, active: scr.filter });
    },

    synthMedal(c, id, cx, cy, r, o = {}, p = this.synthBox().panel) {
      const it = H.ITEMS[id];
      if (o.lines !== false) {
        c.strokeStyle = 'rgba(201,164,92,0.35)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(p.x + 18, cy + 0.5); c.lineTo(cx - r - 12, cy + 0.5); c.moveTo(cx + r + 12, cy + 0.5); c.lineTo(p.x + p.w - 18, cy + 0.5); c.stroke();
        for (const sx of [p.x + 40, p.x + p.w - 40]) { c.beginPath(); c.arc(sx, cy + 0.5, 9, 0, Math.PI * 2); c.stroke(); this.diamond(sx, cy + 0.5, 2.5, C.brass); }
      }
      c.fillStyle = '#010208'; c.beginPath(); c.arc(cx, cy, r + 6, 0, Math.PI * 2); c.fill();
      const ring = c.createLinearGradient(cx, cy - r, cx, cy + r);
      ring.addColorStop(0, C.brassHi); ring.addColorStop(1, C.brassDk);
      c.fillStyle = ring; c.beginPath(); c.arc(cx, cy, r + 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = G.RARITY[o.sil ? 1 : it.rar || 2]; c.beginPath(); c.arc(cx, cy, r + 1, 0, Math.PI * 2); c.fill();
      const core = c.createRadialGradient(cx, cy - r / 3, 4, cx, cy, r);
      core.addColorStop(0, '#3a3c70'); core.addColorStop(1, '#0a0c24');
      c.fillStyle = core; c.beginPath(); c.arc(cx, cy, r - 1, 0, Math.PI * 2); c.fill();
      const s = Math.round(r * 1.4);
      if (o.sil) G.itemSilhouette(c, id, cx - s / 2, cy - s / 2, s); else G.itemIcon(c, id, cx - s / 2, cy - s / 2, s);
    },

    synthFoodTop(c, r, b = this.synthBox()) {
      const ui = this, p = b.panel, it = H.ITEMS[r.to], mx = p.x + (b.wide ? 96 : 80), x = p.x + (b.wide ? 168 : 136), w = p.x + p.w - 16 - x;
      ui.synthMedal(c, r.to, mx, 126, 40, { lines: false, sil: !r.known }, p);
      ui.text('В наличии: ' + r.have, mx, 176, { align: 'center', size: 11, col: C.sub });
      ui.text(ui.fitText(it.name, 15, w, true), x, 58, { size: 15, bold: true, serif: true, col: C.gold });
      c.fillStyle = C.brassDk; c.fillRect(x, 80, w, 1);
      ui.text('Эффект', x, 88, { size: 11, col: C.sub });
      ui.wrap(it.text, w, 11).slice(0, 4).forEach((l, i) => ui.text(l, x, 104 + i * 14, { size: 11, col: C.cream }));
      if (!r.known) ui.text('Рецепт не изучен', x, 166, { size: 11, bold: true, col: C.bad });
    },

    synthDivider(c, y, label, p = this.synthBox().panel) {
      const ui = this, tw = ui.measure(label, 11) / 2 + 14;
      c.fillStyle = C.brassDk; c.fillRect(p.x + 18, y + 6, p.mid - tw - p.x - 18, 1); c.fillRect(p.mid + tw, y + 6, p.x + p.w - 18 - p.mid - tw, 1);
      ui.diamond(p.mid - tw, y + 6.5, 3, C.brass, '#1a1208'); ui.diamond(p.mid + tw, y + 6.5, 3, C.brass, '#1a1208');
      ui.text(label, p.mid, y, { align: 'center', size: 11, col: C.cream });
    },

    synthNeedCell(c, id, have, need, x, y) {
      const it = H.ITEMS[id];
      G.rarityCell(c, x, y, 46, 46, it.rar || 2);
      G.itemIcon(c, id, x + 5, y + 3, 36);
      this.text(have + '/' + need, x + 23, y + 50, { align: 'center', size: 12, bold: true, col: have >= need ? C.ok : C.bad });
    },

    synthPlaque(c, y, label, p = this.synthBox().panel) {
      const x = p.x + 16, w = p.w - 32;
      const gr = c.createLinearGradient(x, y, x, y + 22);
      gr.addColorStop(0, '#f0d898'); gr.addColorStop(1, '#b89048');
      c.fillStyle = '#1a1208'; c.fillRect(x - 1, y - 1, w + 2, 24);
      c.fillStyle = gr; c.fillRect(x, y, w, 22);
      this.text(label, p.mid, y + 5, { align: 'center', size: 11, bold: true, col: '#20140c', shadow: false });
    },

    synthSlider(c, scr, max, b = this.synthBox()) {
      const ui = this, p = b.panel, sl = b.slider;
      ui.text('Количество: ' + scr.qty, p.mid, 304, { align: 'center', size: 11, col: C.cream });
      ui.button(p.x + 16, 322, 30, 18, '−', () => scr.setQty(scr.qty - 1), { size: 12, bold: true, disabled: scr.qty <= 1 });
      ui.text('1', sl.x - 12, 325, { align: 'center', size: 11, col: C.sub });
      ui.rail(sl.x, sl.y, sl.w, max > 1 ? (scr.qty - 1) / (max - 1) : 1);
      ui.text(String(max), sl.x + sl.w + 16, 325, { align: 'center', size: 11, col: C.sub });
      ui.button(p.x + p.w - 46, 322, 30, 18, '+', () => scr.setQty(scr.qty + 1), { size: 12, bold: true, disabled: scr.qty >= max });
      ui.hit(sl.x - 6, 322, sl.w + 12, 18, (btn, pt) => {
        const set = q => scr.setQty(Math.round(1 + Math.max(0, Math.min(1, (q.x - sl.x) / sl.w)) * (max - 1)));
        if (pt) { set(pt); ui.drag = { move: set }; }
      });
    },

    synthPanel(c, scr, r, b = this.synthBox()) {
      const ui = this, g = this.game, inv = g.state.inv.items, id = TABS[scr.tab].id, p = b.panel;
      ui.win(p.x, p.y, p.w, p.h, { alpha: 0.82 });
      if (!r) return;
      const it = H.ITEMS[r.to], src = scr.srcFor(r), max = ui.synthMax(scr.tab, r, src), needs = ui.synthNeeds(scr.tab, r, src);
      if (id === 'food') ui.synthFoodTop(c, r, b);
      else {
        ui.text(ui.fitText(it.name, 16, p.w - 40, true), p.mid, 56, { align: 'center', size: 16, bold: true, serif: true, col: C.gold });
        ui.text('В наличии: ' + (inv[r.to] || 0), p.mid, 78, { align: 'center', size: 11, col: C.sub });
        ui.synthMedal(c, r.to, p.mid, 146, 46, {}, p);
      }
      ui.synthDivider(c, 210, 'Необходимые материалы', p);
      if (needs.length) {
        const x0 = p.mid - (needs.length * 46 + (needs.length - 1) * 22) / 2;
        needs.forEach(([m, n], i) => ui.synthNeedCell(c, m, inv[m] || 0, n * scr.qty, x0 + i * 68, 230));
        if (id === 'swap') ui.hit(p.mid - 23, 230, 46, 46, () => scr.openPicker());
      } else {
        const x = p.mid - 23, y = 230;
        c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x, y, 46, 46);
        c.strokeStyle = C.brassDk; c.setLineDash([3, 3]); c.strokeRect(x + 0.5, y + 0.5, 45, 45); c.setLineDash([]);
        c.fillStyle = C.brassHi; c.fillRect(x + 22, y + 13, 2, 20); c.fillRect(x + 13, y + 22, 20, 2);
        ui.hit(x, y, 46, 46, () => scr.openPicker());
      }
      if (max >= 1) ui.synthSlider(c, scr, max, b);
      else ui.synthPlaque(c, 322, id === 'swap' && !src ? 'Пожалуйста, добавьте материалы' : r.known === false ? 'Рецепт не изучен' : 'Не хватает материалов', p);
      if (id === 'swap') {
        const bw = b.wide ? 210 : 172;
        ui.button(p.x + 16, 366, bw, 26, 'Автодобавление', () => scr.autoAdd(), { size: 11 });
        ui.button(p.x + p.w - 16 - bw, 366, bw, 26, 'Синтезировать', () => scr.key('ok'), { size: 11, icon: 'synth', disabled: max < 1 });
      } else ui.button(p.mid - 100, 366, 200, 26, 'Синтезировать', () => scr.key('ok'), { size: 11, icon: 'synth', disabled: max < 1 });
      const lack = needs.find(([m, n]) => (inv[m] || 0) < n * scr.qty);
      const where = r.known === false ? H.recipeWhere(r.to) : id === 'food' ? (lack ? H.ITEMS[lack[0]].name + ': ' + ui.traceSource(lack[0]) : '') : 'Где взять: ' + ui.traceSource(r.to);
      ui.wrap(where, p.w - 40, 9).slice(0, 2).forEach((l, i) => ui.text(l, p.x + 20, 404 + i * 12, { size: 9, col: C.dim }));
    },

    relicSets() { return H.CAVERN_SETS.concat(H.PLANAR_SETS); },

    relicSlots(set) { return H.RELIC_SETS[set].planar ? H.PLANAR_SLOTS : H.CAVERN_SLOTS; },

    relicCellPos(i, b = this.synthBox()) {
      const gr = b.grid, nc = H.CAVERN_SETS.length, planar = i >= nc, j = planar ? i - nc : i;
      const py = b.wide ? 286 : RELIC_GRID.planarY;
      return { x: gr.x + (j % gr.cols) * (gr.cw + gr.gap), y: (planar ? py : RELIC_GRID.cavernY) + Math.floor(j / gr.cols) * RELIC_GRID.pitch };
    },

    relicHeader(c, y, label, gr = this.synthBox().grid) {
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(gr.wx + 8, y, gr.ww - 16, 16);
      this.diamond(gr.wx + 16, y + 8, 3.5, '#e8a040', '#1a1208');
      this.text(label, gr.wx + 26, y + 2, { size: 11, col: C.cream });
    },

    synthRelicGrid(c, scr, b = this.synthBox()) {
      const ui = this, sets = ui.relicSets(), gr = b.grid, py = b.wide ? 286 : RELIC_GRID.planarY;
      ui.win(gr.wx, gr.wy, gr.ww, gr.wh, { alpha: 0.88, corners: false });
      ui.relicHeader(c, RELIC_GRID.cavernY - 20, 'Пещерные реликвии', gr);
      ui.relicHeader(c, py - 20, 'Планарные украшения', gr);
      sets.forEach((set, i) => {
        const { x, y } = ui.relicCellPos(i, b), slot = ui.relicSlots(set)[0].key, on = i === scr.rsel;
        G.rarityCell(c, x, y, gr.cw, RELIC_GRID.ch, 4);
        G.itemIcon(c, 'relic:' + slot, x + 9, y + 3, 40, set);
        ui.text('★★★★', x + gr.cw / 2, y + RELIC_GRID.ch - 13, { align: 'center', size: 8, col: '#ffe08a' });
        if (on) { c.strokeStyle = scr.rfocus === 'grid' ? C.brassHi : C.brass; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, gr.cw + 2, RELIC_GRID.ch + 2); c.lineWidth = 1; }
        ui.hit(x, y, gr.cw, RELIC_GRID.ch, () => { if (scr.rsel !== i) { scr.rsel = i; scr.rslot = 0; ui.sfx('select'); } scr.rfocus = 'grid'; });
      });
    },

    relicMedal(c, set, slot, cx, cy, r) {
      c.fillStyle = '#010208'; c.beginPath(); c.arc(cx, cy, r + 6, 0, Math.PI * 2); c.fill();
      const ring = c.createLinearGradient(cx, cy - r, cx, cy + r);
      ring.addColorStop(0, C.brassHi); ring.addColorStop(1, C.brassDk);
      c.fillStyle = ring; c.beginPath(); c.arc(cx, cy, r + 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = G.RARITY[4]; c.beginPath(); c.arc(cx, cy, r + 1, 0, Math.PI * 2); c.fill();
      const core = c.createRadialGradient(cx, cy - r / 3, 4, cx, cy, r);
      core.addColorStop(0, '#5a4630'); core.addColorStop(1, '#1a1208');
      c.fillStyle = core; c.beginPath(); c.arc(cx, cy, r - 1, 0, Math.PI * 2); c.fill();
      const s = Math.round(r * 1.4);
      G.itemIcon(c, 'relic:' + slot, cx - s / 2, cy - s / 2, s, set);
    },

    synthRelicPanel(c, scr, b = this.synthBox()) {
      const ui = this, g = this.game, inv = g.state.inv.items, set = ui.relicSets()[scr.rsel], def = H.RELIC_SETS[set], slots = ui.relicSlots(set), p = b.panel;
      scr.rslot = Math.min(scr.rslot, slots.length - 1);
      ui.win(p.x, p.y, p.w, p.h, { alpha: 0.82 });
      ui.relicMedal(c, set, slots[scr.rslot].key, p.x + (b.wide ? 96 : 80), 124, 40);
      const x = p.x + (b.wide ? 168 : 136), w = p.x + p.w - 16 - x;
      ui.text(ui.fitText(def.name, 15, w, true), x, 58, { size: 15, bold: true, serif: true, col: C.gold });
      c.fillStyle = C.brassDk; c.fillRect(x, 80, w, 1);
      const lines = def.planar ? ui.wrap(def.text || def.short, w, 10) : ui.wrap('2 шт.: ' + ui.setBonusText(set, 2) + '.', w, 10).concat(ui.wrap('4 шт.: ' + ui.setBonusText(set, 4) + '.', w, 10));
      lines.slice(0, 6).forEach((l, i) => ui.text(l, x, 88 + i * 13, { size: 10, col: C.cream }));
      ui.synthDivider(c, 190, 'Выберите предмет для синтеза', p);
      const step = b.wide ? 96 : 80, x0 = p.mid - (slots.length - 1) * (step / 2);
      slots.forEach((sl, i) => {
        const cx = x0 + i * step, cy = 236, on = i === scr.rslot, focus = on && scr.rfocus === 'slot';
        c.fillStyle = '#010208'; c.beginPath(); c.arc(cx, cy, 25, 0, Math.PI * 2); c.fill();
        const bg = c.createRadialGradient(cx, cy - 8, 3, cx, cy, 24);
        bg.addColorStop(0, '#5a5c80'); bg.addColorStop(1, '#1a1c34');
        c.fillStyle = bg; c.beginPath(); c.arc(cx, cy, 24, 0, Math.PI * 2); c.fill();
        c.strokeStyle = focus ? C.brassHi : on ? C.brass : '#3a3c5a'; c.lineWidth = focus ? 3 : 2; c.beginPath(); c.arc(cx, cy, 23, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
        G.itemIcon(c, 'relic:' + sl.key, cx - 17, cy - 17, 34, set);
        ui.text(sl.name, cx, cy + 30, { align: 'center', size: 11, bold: on, col: on ? C.gold : C.cream });
        ui.hit(cx - 25, cy - 25, 50, 64, () => { if (scr.rslot === i && scr.rfocus === 'slot') ui.openRelicCraft(scr); else { scr.rslot = i; scr.rfocus = 'slot'; ui.sfx('select'); } });
      });
      const have = inv.remains || 0, can = have >= H.RELIC_CRAFT.cost;
      ui.text('Стоимость: ' + H.RELIC_CRAFT.cost + ' Обломков Реликвии', p.mid, 296, { align: 'center', size: 11, col: can ? C.cream : C.bad });
      ui.text('Основную характеристику выбирает Самомоделирующаяся смола.', p.mid, 312, { align: 'center', size: 9, col: C.dim });
      ui.button(p.mid - 100, 332, 200, 26, 'Синтезировать', () => ui.openRelicCraft(scr), { size: 11, icon: 'synth', disabled: !can });
      const left = g.resinLeft(), ok = left > 0 && have >= H.RELIC_CRAFT.resinCost;
      ui.button(p.x + 16, 372, 230, 22, 'Смола за ' + H.RELIC_CRAFT.resinCost + ' Обломков', () => scr.buyResin(), { size: 10, disabled: !ok });
      ui.text('В этом часу: ' + left + '/' + H.RELIC_CRAFT.resinHour, p.x + p.w - 16, 377, { align: 'right', size: 10, col: left ? C.sub : C.bad });
      ui.wrap('Обломки дают расщеплённые реликвии в разделе «Разбор Реликвий».', p.w - 168, 9).slice(0, 2).forEach((l, i) => ui.text(l, p.x + 16, 404 + i * 12, { size: 9, col: C.dim }));
      ui.button(p.x + p.w - 144, 404, 128, 22, 'Разбор Реликвий', () => scr.setTab(4), { size: 10, icon: 'rsalv' });
    },

    openRelicCraft(scr) {
      const ui = this, g = this.game, set = ui.relicSets()[scr.rsel], def = H.RELIC_SETS[set], slot = ui.relicSlots(set)[scr.rslot];
      if ((g.state.inv.items.remains || 0) < H.RELIC_CRAFT.cost) { ui.sfx('deny'); ui.toast('Нужно ' + H.RELIC_CRAFT.cost + ' Обломков Реликвии. Их дают расщеплённые реликвии.'); return; }
      const rows = [null].concat(slot.mains), name = def.pieces ? def.pieces[slot.key] : def.name + ': ' + slot.name.toLowerCase();
      this.push({
        sel: scr.useResin && (g.state.inv.items.resin || 0) > 0 ? 1 : 0, sc: { top: 0 },
        draw(c) {
          const inv = g.state.inv.items, vis = 8, rh = 20, x = W / 2 - 180, h = 134 + Math.min(vis, rows.length) * rh;
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.win(x, 60, 360, h, { title: 'Синтез реликвии' });
          G.rarityCell(c, x + 16, 76, 40, 40, 4); G.itemIcon(c, 'relic:' + slot.key, x + 18, 78, 36, set);
          ui.text(ui.fitText(name, 12, 280, true), x + 66, 80, { size: 12, bold: true, col: C.gold });
          ui.text('Уровень +' + Math.min(15, Math.floor(g.avgLevel() / 3)) + ', доп. характеристики случайные', x + 66, 98, { size: 9, col: C.sub });
          ui.text('Основная характеристика', x + 16, 124, { size: 11, col: C.cream });
          const top = ui.listTop(this.sc, this.sel, rows.length, vis), resin = inv.resin || 0;
          rows.slice(top, top + vis).forEach((m, j) => {
            const i = top + j, y = 142 + j * rh, on = i === this.sel, need = m && !resin;
            c.fillStyle = on ? 'rgba(242,220,154,0.18)' : 'rgba(255,255,255,0.03)'; c.fillRect(x + 16, y, 316, rh - 2);
            if (on) { c.strokeStyle = C.brassHi; c.strokeRect(x + 16.5, y + 0.5, 315, rh - 3); }
            ui.text(m ? H.STAT_NAMES[m] || m : 'Случайная', x + 24, y + 3, { size: 11, col: need ? C.dim : on ? C.gold : C.cream });
            ui.text(m ? 'смола ×1' : 'без смолы', x + 324, y + 4, { align: 'right', size: 9, col: need ? C.bad : C.sub });
            ui.hit(x + 16, y, 316, rh - 2, () => { if (this.sel === i) this.key('ok'); else this.sel = i; });
          });
          if (rows.length > vis) ui.scrollBar(x + 336, 142, vis * rh - 2, this.sc, rows.length, vis);
          const fy = 142 + Math.min(vis, rows.length) * rh + 8, pick = rows[this.sel];
          ui.money(x + 16, fy, 'remains', (inv.remains || 0) + '/' + H.RELIC_CRAFT.cost, { col: (inv.remains || 0) >= H.RELIC_CRAFT.cost ? C.ok : C.bad });
          if (pick) ui.money(x + 130, fy, 'resin', resin + '/1', { col: resin ? C.ok : C.bad });
          ui.button(x + 222, fy - 4, 122, 24, 'Синтезировать', () => this.key('ok'), { size: 11, disabled: !!pick && !resin });
          ui.hints([['↑↓', 'Характеристика'], ['Enter', 'Синтез'], ['Esc', 'Назад']], W / 2, 60 + h + 8, { align: 'center' });
        },
        key(k) {
          if (k === 'back') { ui.pop(); return; }
          if (k === 'up' || k === 'down') { this.sel = (this.sel + (k === 'up' ? rows.length - 1 : 1)) % rows.length; ui.sfx('select'); return; }
          if (k !== 'ok') return;
          const pick = rows[this.sel];
          if (pick && !(g.state.inv.items.resin > 0)) { ui.sfx('deny'); ui.toast('Нужна Самомоделирующаяся смола.'); return; }
          const rel = g.craftRelic(set, slot.key, pick);
          if (!rel) { ui.sfx('deny'); ui.toast('Не хватает Обломков Реликвии.'); return; }
          ui.screens.pop();
          ui.sfx('chest');
          ui.openRelicResult(rel);
        }
      });
    },

    openRelicResult(rel) {
      const ui = this, lab = this.relicLabel(rel), def = H.RELIC_SETS[rel.set], slot = H.RELIC_SLOTS.find(x => x.key === rel.slot);
      this.push({
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          const x = W / 2 - 160;
          ui.win(x, 130, 320, 190, { title: 'Создана реликвия' });
          G.rarityCell(c, x + 16, 150, 56, 56, 4); G.itemIcon(c, 'relic:' + rel.slot, x + 20, 154, 48, rel.set);
          ui.text(ui.fitText(def.pieces ? def.pieces[rel.slot] : def.name, 12, 220, true), x + 82, 154, { size: 12, bold: true, col: C.gold });
          ui.text(slot.name + ' · +' + rel.lvl, x + 82, 172, { size: 10, col: C.sub });
          ui.text(lab.main, x + 82, 188, { size: 11, bold: true, col: C.cream });
          rel.subs.forEach(([k, v], i) => ui.text(H.STAT_NAMES[k] + ' ' + ui.fmtStat(k, v), x + 24 + (i % 2) * 150, 224 + Math.floor(i / 2) * 18, { size: 10, col: C.cream }));
          ui.hints([['Enter', 'Готово']], W / 2, 296, { align: 'center' });
          ui.hit(0, 0, W, HGT, () => this.key('ok'));
        },
        key(k) { if (k === 'ok' || k === 'back') ui.pop(); }
      });
    },

    openSalvage() {
      const ui = this, g = this.game;
      this.push({
        lvl: 6,
        draw(c) {
          const p = g.salvagePreview(this.lvl), x = W / 2 - 170;
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, 140, 340, 170, { title: 'Расщепить лишнее' });
          ui.wrap('Все реликвии, которые никто не носит, до выбранного уровня включительно.', 300, 10).forEach((l, i) => ui.text(l, x + 20, 158 + i * 13, { size: 10, col: C.sub }));
          ui.text('Уровень до', x + 20, 196, { size: 11, col: C.cream });
          ui.button(x + 120, 192, 24, 20, '−', () => this.set(this.lvl - 1), { size: 12, bold: true, disabled: this.lvl <= 0 });
          ui.text('+' + this.lvl, x + 166, 194, { align: 'center', size: 13, bold: true, col: C.gold });
          ui.button(x + 188, 192, 24, 20, '+', () => this.set(this.lvl + 1), { size: 12, bold: true, disabled: this.lvl >= 15 });
          ui.text('Реликвий: ' + p.list.length, x + 20, 224, { size: 11, col: p.list.length ? C.cream : C.dim });
          ui.money(x + 20, 244, 'credits', '+' + H.fmt(p.credits));
          ui.money(x + 140, 244, 'remains', '+' + p.remains);
          ui.button(x + 200, 270, 120, 24, 'Расщепить', () => this.key('ok'), { size: 11, disabled: !p.list.length });
          ui.hints([['←→', 'Уровень'], ['Enter', 'Расщепить'], ['Esc', 'Назад']], W / 2, 318, { align: 'center' });
        },
        set(n) { const v = Math.max(0, Math.min(15, n)); if (v !== this.lvl) { this.lvl = v; ui.sfx('select'); } },
        key(k) {
          if (k === 'back') { ui.pop(); return; }
          if (k === 'left' || k === 'right') { this.set(this.lvl + (k === 'left' ? -1 : 1)); return; }
          if (k !== 'ok') return;
          const p = g.salvageMany(this.lvl);
          if (!p.list.length) { ui.sfx('deny'); ui.toast('Нечего расщеплять.'); return; }
          ui.screens.pop();
          ui.sfx('chest');
          ui.toast('Расщеплено реликвий: ' + p.list.length + '. +' + H.fmt(p.credits) + ' кредитов, +' + p.remains + ' Обломков Реликвии.');
        }
      });
    },

    drawRelicStatIcon(c, stat, x, y, size, col) {
      const elem = String(stat || '').endsWith('P') ? stat.slice(0, -1) : '';
      if (H.ELEMENTS && H.ELEMENTS[elem]) {
        G.elemIcon(c, elem, x + size / 2, y + size / 2, Math.max(4, Math.round(size / 2) - 1));
        return;
      }
      const key = G.STAT_ART && G.STAT_ART[stat] ? stat : String(stat || '').replace(/[FP]$/, '');
      G.statIcon(c, key, x, y, size, col);
    },

    drawToggleSwitch(c, x, y, on, onClick) {
      const w = 28, h = 14, r = 7;
      c.save();
      c.fillStyle = on ? '#e69c3a' : 'rgba(18,22,48,0.92)';
      c.beginPath();
      c.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
      c.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
      c.closePath();
      c.fill();
      c.strokeStyle = on ? '#ffe8a0' : 'rgba(154,166,208,0.5)';
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = on ? '#fffdf4' : '#9aa6d0';
      c.beginPath();
      c.arc(x + (on ? w - r : r), y + r, 5, 0, Math.PI * 2);
      c.fill();
      c.restore();
      if (onClick) this.hit(x - 2, y - 2, w + 4, h + 4, onClick);
    },

    drawRelicSlotBar(c, x, y, w, activeSlot, onSelect, onStep) {
      const ui = this, tabs = H.RELIC_CRAFT.slotTabs;
      ui.keycap(x, y + 4, 'Z');
      if (onStep) ui.hit(x - 2, y, 18, 22, () => onStep(-1));
      const bx = x + 20, bw = w - 40, tw = Math.floor(bw / tabs.length);
      c.fillStyle = 'rgba(8,10,28,0.72)';
      c.fillRect(bx, y, bw, 22);
      c.strokeStyle = 'rgba(154,166,208,0.22)';
      c.strokeRect(bx + 0.5, y + 0.5, bw - 1, 21);
      tabs.forEach((t, i) => {
        const tx = bx + i * tw, cellW = i === tabs.length - 1 ? bw - i * tw : tw, on = (activeSlot || 'all') === t.key;
        if (on) {
          c.fillStyle = 'rgba(242,220,154,0.18)';
          c.fillRect(tx + 1, y + 1, cellW - 2, 20);
          c.fillStyle = C.brassHi;
          c.fillRect(tx + 4, y + 19, cellW - 8, 2);
        }
        G.slotTabIcon(c, t.key, tx + (cellW - 14) / 2, y + 4, on ? C.gold : C.sub);
        ui.hit(tx, y, cellW, 22, () => onSelect(t.key));
      });
      ui.keycap(x + w - 16, y + 4, 'C');
      if (onStep) ui.hit(x + w - 18, y, 18, 22, () => onStep(1));
    },

    drawRelicCardCell(c, rel, x, y, w, h, opts = {}) {
      const ui = this, g = this.game, rar = (rel.lvl || 0) >= 6 ? 5 : 4;
      G.rarityCell(c, x, y, w, h, rar);
      const icSz = Math.min(w - 8, h - 16);
      G.itemIcon(c, 'relic:' + rel.slot, x + (w - icSz) / 2, y + 2, icSz, rel.set);
      if (opts.slotBadge) G.slotBadge(c, rel.slot, x + 2, y + 2);
      if (opts.wornBy) {
        ui.circlePortrait(c, G.lookOf(g.kitOf(opts.wornBy), g), x + w - 17, y + 1, 16, C.brassHi);
      }
      if (rel.lock) {
        G.lockIcon(c, x + w - 14, y + h - 25, true, { badge: true, r: 6 });
      } else if (rel.trash) {
        G.trashIcon(c, x + w - 14, y + h - 25, true, { badge: true, r: 6 });
      }
      c.fillStyle = 'rgba(6,8,20,0.88)';
      c.fillRect(x, y + h - 12, w, 12);
      ui.text('+' + (rel.lvl || 0), x + w / 2, y + h - 12, { size: 9, bold: true, align: 'center', col: C.cream });
      if (opts.selected) {
        c.fillStyle = 'rgba(40,160,80,0.28)';
        c.fillRect(x, y, w, h - 12);
        c.strokeStyle = '#f2dc9a';
        c.lineWidth = 1.6;
        c.strokeRect(x + 0.8, y + 0.8, w - 1.6, h - 1.6);
        c.lineWidth = 1;
        c.fillStyle = '#e69c3a';
        c.fillRect(x + 2, y + h - 24, 11, 11);
        ui.text('✓', x + 7.5, y + h - 24, { size: 9, bold: true, align: 'center', col: '#181206', shadow: false });
        G.minusBadge(c, x + w - 10, y - 3, 6);
      }
    },

    drawRelicDetailPane(c, rel, px, py, pw, ph, opts = {}) {
      const ui = this, g = this.game;
      ui.win(px, py, pw, ph, { alpha: 0.9, corners: false });
      if (!rel) {
        c.strokeStyle = 'rgba(154,166,208,0.35)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(px + pw / 2, py + 162, 10, Math.PI, 0, false);
        c.lineTo(px + pw / 2 + 10, py + 178);
        c.lineTo(px + pw / 2 - 10, py + 178);
        c.closePath();
        c.stroke();
        c.lineWidth = 1;
        ui.text(opts.emptyText || 'Выберите предмет для разбора', px + pw / 2, py + 190, { align: 'center', size: 10, col: C.dim });
        return;
      }
      g.relicOf(rel.uid);
      const set = H.RELIC_SETS[rel.set] || { name: rel.set, bonus: {} };
      const slot = H.RELIC_SLOTS.find(x => x.key === rel.slot) || { key: rel.slot, name: rel.slot };
      const pieceName = set.pieces ? set.pieces[rel.slot] : set.name;
      const rarCol = G.RARITY[(rel.lvl || 0) >= 6 ? 5 : 4];
      ui.text(ui.fitText(pieceName, 11, pw - 34, true), px + 9, py + 8, { size: 11, bold: true, col: rarCol });
      G.slotTabIcon(c, rel.slot, px + pw - 22, py + 7, C.sub);
      c.fillStyle = rarCol;
      c.fillRect(px + 9, py + 23, pw - 18, 1.5);
      const ax = px + 9, ay = py + 28, aw = pw - 18, ah = 58;
      G.rarityCell(c, ax, ay, aw, ah, (rel.lvl || 0) >= 6 ? 5 : 4);
      G.itemIcon(c, 'relic:' + rel.slot, ax + Math.round(aw / 2) - 24, ay + 4, 48, rel.set);
      ui.text(slot.name, ax + 6, ay + 22, { size: 9, col: C.cream });
      ui.text('+' + (rel.lvl || 0), ax + 6, ay + 36, { size: 13, bold: true, col: C.gold });
      G.lockIcon(c, ax + aw - 20, ay + 6, !!rel.lock, { badge: true, r: 7 });
      if (opts.onToggleLock) ui.hit(ax + aw - 23, ay + 3, 20, 20, opts.onToggleLock);
      G.trashIcon(c, ax + aw - 20, ay + 32, !!rel.trash, { badge: true, r: 7 });
      if (opts.onToggleTrash) ui.hit(ax + aw - 23, ay + 29, 20, 20, opts.onToggleTrash);
      let y = ay + ah + 6;
      c.fillStyle = 'rgba(242,220,154,0.18)';
      c.fillRect(px + 9, y, pw - 18, 20);
      c.fillStyle = C.brassHi;
      c.fillRect(px + 9, y, 3, 20);
      ui.drawRelicStatIcon(c, rel.main, px + 15, y + 4, 12, C.gold);
      ui.text(ui.fitText(H.STAT_NAMES[rel.main] || rel.main, 10, pw - 86, true), px + 30, y + 4, { size: 10, bold: true, col: C.gold });
      ui.text(ui.fmtStat(rel.main, rel.mv), px + pw - 12, y + 4, { size: 11, bold: true, align: 'right', col: C.gold });
      y += 23;
      const recSubs = g.relicSetRecs ? g.relicSetRecs(rel.set).subs : [];
      (rel.subs || []).forEach(([sk, sv]) => {
        const good = recSubs.includes(sk);
        if (good) {
          c.fillStyle = 'rgba(242,220,154,0.08)';
          c.fillRect(px + 9, y, pw - 18, 15);
        }
        ui.drawRelicStatIcon(c, sk, px + 14, y + 2, 11, good ? C.gold : '#c8d0f0');
        ui.text(ui.fitText(H.STAT_NAMES[sk] || sk, 9, pw - 80, false), px + 28, y + 2, { size: 9, col: good ? C.gold : C.cream });
        ui.text(ui.fmtStat(sk, sv), px + pw - 12, y + 2, { size: 9, bold: good, align: 'right', col: good ? C.gold : C.cream });
        y += 15;
      });
      y += 4;
      c.fillStyle = 'rgba(242,220,154,0.22)';
      c.fillRect(px + 9, y, pw - 18, 1);
      y += 5;
      ui.text(ui.fitText(set.name, 10, pw - 18, true), px + 9, y, { size: 10, bold: true, col: set.planar ? '#d8c0ff' : C.ok });
      y += 13;
      const bonusLines = set.planar
        ? ui.wrap('2 шт.: ' + (set.text || set.short || ''), pw - 18, 9)
        : ui.wrap('2 шт.: ' + ui.setBonusText(rel.set, 2) + '.', pw - 18, 9).concat(ui.wrap('4 шт.: ' + ui.setBonusText(rel.set, 4) + '.', pw - 18, 9));
      const footerTop = py + ph - (opts.inInventory ? 76 : 44);
      const maxBonus = Math.max(1, Math.floor((footerTop - y) / 11));
      bonusLines.slice(0, maxBonus).forEach((l, i) => ui.text(l, px + 9, y + i * 11, { size: 9, col: C.sub }));
      const wornBy = opts.wornBy !== undefined ? opts.wornBy : g.relicWornBy(rel.uid);
      if (wornBy) {
        const wy = footerTop;
        c.fillStyle = 'rgba(20,42,36,0.75)';
        c.fillRect(px + 9, wy, pw - 18, 18);
        c.strokeStyle = 'rgba(90,208,160,0.45)';
        c.strokeRect(px + 9.5, wy + 0.5, pw - 19, 17);
        ui.circlePortrait(c, G.lookOf(g.kitOf(wornBy), g), px + 13, wy + 1, 16, C.brassHi);
        ui.text('Экипировано: ' + ui.shortName(wornBy), px + 33, wy + 3, { size: 9, bold: true, col: C.ok });
      } else if (!opts.inInventory) {
        ui.text('Разбор: +' + g.salvageValue(rel) + ' Обломков, +150 кр.', px + 9, py + ph - 20, { size: 9, col: C.dim });
      }
      if (opts.inInventory) {
        const by = py + ph - 52;
        if (!wornBy) ui.text('X: расщепить 1 шт. (+' + g.salvageValue(rel) + ' Обл., +150 кр.)', px + 9, by - 14, { size: 8, col: C.dim });
        ui.button(px + 9, by, pw - 18, 20, 'Синтез реликвий', () => ui.openSynth(null, 3), { size: 10, icon: 'synth' });
        ui.button(px + 9, by + 23, pw - 18, 22, 'Разобрать · R', () => ui.openRelicSalvage(), { size: 11, icon: 'synth', active: true });
      }
    },

    makeRelicSalvageState(initFilter) {
      const ui = this, g = this.game, sorts = H.RELIC_CRAFT.sorts;
      return {
        full: true, lvl: 6, picked: new Set(), focusUid: null, sel: 0, sc: { top: 0 },
        includeEnhanced: false, sortKey: 'lvl', sortDir: 1, sortMenu: false,
        filter: H.relicMakeFilter(initFilter),
        list() {
          return g.relicSalvageList({
            includeEnhanced: this.includeEnhanced,
            filter: this.filter,
            sortKey: this.sortKey,
            sortDir: this.sortDir,
            trashFirst: true
          });
        },
        syncPicked() {
          for (const uid of [...this.picked]) {
            const rel = g.relicOf(uid);
            if (!rel || !g.relicCanSalvage(rel, { includeEnhanced: this.includeEnhanced })) this.picked.delete(uid);
          }
        },
        setSlot(slotKey) {
          this.filter.slot = slotKey || 'all';
          this.sel = 0;
          this.sc.top = 0;
          ui.sfx('select');
        },
        stepSlot(delta) {
          const tabs = H.RELIC_CRAFT.slotTabs;
          const idx = Math.max(0, tabs.findIndex(t => t.key === (this.filter.slot || 'all')));
          const next = (idx + delta + tabs.length) % tabs.length;
          this.setSlot(tabs[next].key);
        },
        toggleEnhanced() {
          this.includeEnhanced = !this.includeEnhanced;
          this.syncPicked();
          this.sel = 0;
          this.sc.top = 0;
          ui.sfx('select');
        },
        togglePick(rel) {
          if (!rel) return;
          this.focusUid = rel.uid;
          if (rel.lock) { ui.sfx('select'); return; }
          if (this.picked.has(rel.uid)) {
            this.picked.delete(rel.uid);
            ui.sfx('cancel');
            return;
          }
          if (this.picked.size >= H.RELIC_CRAFT.salvageCap) {
            ui.sfx('deny');
            ui.toast('Выбрано максимум предметов (' + H.RELIC_CRAFT.salvageCap + ').');
            return;
          }
          this.picked.add(rel.uid);
          ui.sfx('select');
        },
        act() {
          this.syncPicked();
          const prev = g.relicSalvagePreview([...this.picked]);
          if (!prev.count) { ui.sfx('deny'); ui.toast('Выберите Реликвии для разбора.'); return; }
          ui.openRelicSalvageConfirm(this, prev);
        },
        drawSortPopup(c) {
          const sb = ui.salvageBox(), mx = sb.gx + 142, my = 426 - sorts.length * 26 - 6, mw = 136, mh = sorts.length * 26 + 4;
          ui.hit(ui.left, 0, ui.vw, HGT, () => { this.sortMenu = false; });
          c.fillStyle = 'rgba(6,8,20,0.96)'; c.fillRect(mx, my, mw, mh);
          c.strokeStyle = C.brass; c.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
          sorts.forEach((s, i) => {
            const ry = my + 2 + i * 26, on = s.id === this.sortKey;
            if (on) { c.fillStyle = 'rgba(242,220,154,0.16)'; c.fillRect(mx + 2, ry, mw - 4, 25); }
            if (i > 0) { c.fillStyle = 'rgba(154,166,208,0.2)'; c.fillRect(mx + 8, ry, mw - 16, 1); }
            ui.text(s.label, mx + 10, ry + 7, { size: 10, bold: on, col: on ? C.gold : C.cream });
            const rcx = mx + mw - 16, rcy = ry + 13;
            c.strokeStyle = on ? '#e69c3a' : C.sub; c.lineWidth = 1.4;
            c.beginPath(); c.arc(rcx, rcy, 5.5, 0, Math.PI * 2); c.stroke();
            if (on) { c.fillStyle = '#e69c3a'; c.beginPath(); c.arc(rcx, rcy, 2.8, 0, Math.PI * 2); c.fill(); }
            c.lineWidth = 1;
            ui.hit(mx + 2, ry, mw - 4, 25, () => { this.sortKey = s.id; this.sortMenu = false; this.sel = 0; ui.sfx('select'); });
          });
        }
      };
    },

    drawRelicSalvageBody(c, st, opts = {}) {
      const ui = this, g = this.game, sb = ui.salvageBox(), COLS = sb.cols, CW = 58, CH = 60, VIS = 5, sorts = H.RELIC_CRAFT.sorts;
      st.syncPicked();
      const all = st.list(), rows = Math.ceil(all.length / COLS);
      if (st.sel >= all.length) st.sel = Math.max(0, all.length - 1);
      const focusRel = st.focusUid != null ? g.relicOf(st.focusUid) : null;
      ui.drawRelicDetailPane(c, focusRel, sb.px, 36, sb.pw, 384, {
        onToggleLock: focusRel ? () => {
          const locked = g.toggleRelicLock(focusRel.uid);
          if (locked) st.picked.delete(focusRel.uid);
          ui.sfx('select');
        } : null,
        onToggleTrash: focusRel ? () => {
          g.toggleRelicTrash(focusRel.uid);
          ui.sfx('select');
        } : null
      });
      const gx = sb.gx, gy = 84, gw = sb.gw, gh = 308;
      ui.text('Количество: ' + g.state.inv.relics.length + '/' + H.RELIC_CRAFT.invCap, gx, 38, { size: 10, col: C.cream });
      ui.text('Можно разобрать ' + g.relicSalvageableTotal({ includeEnhanced: st.includeEnhanced }), gx + 114, 38, { size: 10, col: C.sub });
      ui.text('Включать усиленные Реликвии', gx + gw - 34, 39, { size: 9, align: 'right', col: st.includeEnhanced ? C.gold : C.sub });
      ui.drawToggleSwitch(c, gx + gw - 30, 36, st.includeEnhanced, () => st.toggleEnhanced());
      ui.drawRelicSlotBar(c, gx, 54, gw, st.filter.slot, k => st.setSlot(k), d => st.stepSlot(d));
      ui.win(gx - 4, gy - 4, gw + 4, gh + 4, { alpha: 0.85, corners: false });
      const start = ui.listTop(st.sc, Math.floor(st.sel / COLS), rows, VIS) * COLS;
      ui.wheelZone(gx, gy, gw, gh, d => { st.sc.top += d; });
      if (rows > VIS) ui.scrollBar(gx + gw - 10, gy + 2, gh - 8, st.sc, rows, VIS);
      all.slice(start, start + COLS * VIS).forEach((rel, j) => {
        const i = start + j, cx = gx + 4 + (j % COLS) * CW, cy = gy + 4 + Math.floor(j / COLS) * CH;
        const isPicked = st.picked.has(rel.uid), isFocus = st.focusUid === rel.uid || i === st.sel;
        if (isFocus && !isPicked) { c.fillStyle = 'rgba(242,220,154,0.22)'; c.fillRect(cx - 2, cy - 2, 54, 58); }
        ui.drawRelicCardCell(c, rel, cx, cy, 50, 54, { selected: isPicked });
        ui.hit(cx, cy, 50, 54, () => { st.sel = i; st.togglePick(rel); });
        if (isPicked) ui.hit(cx + 36, cy - 5, 16, 16, () => { st.focusUid = rel.uid; st.picked.delete(rel.uid); ui.sfx('cancel'); });
      });
      if (!all.length) {
        const msg = !st.includeEnhanced && g.relicSalvageableTotal({ includeEnhanced: true }) > 0
          ? 'Нет Реликвий +0. Включите «Включать усиленные Реликвии».'
          : 'Нет подходящих Реликвий для разбора.';
        ui.text(msg, gx + gw / 2, gy + gh / 2 - 6, { align: 'center', size: 10, col: C.dim });
      }
      const prev = g.relicSalvagePreview([...st.picked]);
      ui.text('Выбрано ', gx, 402, { size: 11, col: C.cream });
      const w0 = ui.measure('Выбрано ', 11);
      ui.text(String(prev.count), gx + w0, 402, { size: 11, bold: true, col: '#e69c3a' });
      ui.text(' / ' + H.RELIC_CRAFT.salvageCap, gx + w0 + ui.measure(String(prev.count), 11, true), 402, { size: 11, col: C.cream });
      if (prev.items.length) {
        const rx0 = sb.rx - 12 - prev.items.length * 46;
        ui.text('Результат', rx0 - 6, 402, { size: 10, align: 'right', col: C.sub });
        prev.items.forEach((it, idx) => {
          const ix = rx0 + idx * 46, iy = 392;
          G.rarityCell(c, ix, iy, 42, 30, it.rar);
          G.itemIcon(c, it.id, ix + 9, iy + 1, 22);
          c.fillStyle = 'rgba(6,8,20,0.88)'; c.fillRect(ix + 1, iy + 20, 40, 9);
          ui.text(H.fmt(it.count), ix + 21, iy + 20, { size: 8, bold: true, align: 'center', col: C.cream });
          ui.hit(ix, iy, 42, 30, () => ui.toast(it.name + ': ×' + H.fmt(it.count)));
        });
      }
      const hasFilter = !H.relicFilterEmpty(st.filter);
      c.fillStyle = hasFilter ? 'rgba(242,220,154,0.22)' : 'rgba(18,22,48,0.9)';
      c.fillRect(gx, 426, 26, 24);
      c.strokeStyle = hasFilter ? C.brassHi : C.brass;
      c.strokeRect(gx + 0.5, 426.5, 25, 23);
      G.filterIcon(c, gx + 7, 432, hasFilter ? C.gold : C.cream);
      if (hasFilter) { c.fillStyle = '#e69c3a'; c.beginPath(); c.arc(gx + 21, 430, 3, 0, Math.PI * 2); c.fill(); }
      ui.hit(gx, 426, 26, 24, () => { ui.openRelicFilterDrawer(st); ui.sfx('select'); });
      ui.button(gx + 30, 426, 108, 24, 'Умный выброс', () => { ui.openRelicSmartDiscard(st); ui.sfx('select'); }, { size: 10 });
      const curSort = (sorts.find(s => s.id === st.sortKey) || sorts[0]).label, sw = sb.wide ? 96 : 78;
      ui.button(gx + 142, 426, sw, 24, ui.fitText(curSort, 9, sw - 20) + ' ▾', () => { st.sortMenu = !st.sortMenu; ui.sfx('select'); }, { size: 9, active: st.sortMenu });
      ui.button(gx + 144 + sw, 426, 26, 24, st.sortDir === 1 ? '1↓' : '1↑', () => { st.sortDir = -st.sortDir; ui.sfx('select'); }, { size: 9 });
      const actW = sb.wide ? 96 : 74, qkW = sb.wide ? 110 : 86, actX = gx + gw - actW, qkX = actX - (sb.wide ? 6 : 4) - qkW;
      ui.button(qkX, 426, qkW, 24, 'Быстрый выбор', () => { ui.openRelicQuickSelect(st); ui.sfx('select'); }, { size: 10 });
      ui.button(actX, 426, actW, 24, 'Разобрать', () => st.act(), { size: 10, active: prev.count > 0, disabled: prev.count === 0 });
      const enhKey = opts.inSynth ? 'T' : 'E';
      const baseHints = [['←↑↓→', 'Выбор'], ['Enter', 'Отметить'], ['Z/C', 'Слот'], ['L/V', 'Замок/Выброс'], [enhKey, 'Усиленные'], ['F', 'Фильтр'], ['M', 'Выброс'], ['A', 'Быстрый выбор'], ['X', 'Разобрать']];
      ui.hints(opts.inSynth ? [['Q/E', 'Раздел']].concat(baseHints) : baseHints, sb.px, HGT - 16);
      if (st.sortMenu) st.drawSortPopup(c);
    },

    relicSalvageKey(st, kk, code, opts = {}) {
      const ui = this, g = this.game, COLS = ui.salvageBox().cols, sorts = H.RELIC_CRAFT.sorts;
      if (st.sortMenu) {
        const idx = sorts.findIndex(s => s.id === st.sortKey);
        if (kk === 'up' || kk === 'down') {
          const next = (idx + (kk === 'up' ? sorts.length - 1 : 1)) % sorts.length;
          st.sortKey = sorts[next].id;
          ui.sfx('select');
          return true;
        }
        if (kk === 'ok' || kk === 'back' || code === 'KeyS') { st.sortMenu = false; ui.sfx('select'); return true; }
        return true;
      }
      if (kk === 'back') {
        if (opts.inSynth) return false;
        ui.pop();
        return true;
      }
      if (code === 'KeyI') { ui.openRelicSalvageRules(); return true; }
      if (code === 'KeyZ') { st.stepSlot(-1); return true; }
      if (code === 'KeyC') { st.stepSlot(1); return true; }
      if (code === 'KeyT' || code === 'KeyU' || (!opts.inSynth && code === 'KeyE')) { st.toggleEnhanced(); return true; }
      if (code === 'KeyF') { ui.openRelicFilterDrawer(st); ui.sfx('select'); return true; }
      if (code === 'KeyM') { ui.openRelicSmartDiscard(st); ui.sfx('select'); return true; }
      if (code === 'KeyA') { ui.openRelicQuickSelect(st); ui.sfx('select'); return true; }
      if (code === 'KeyS') { st.sortMenu = !st.sortMenu; ui.sfx('select'); return true; }
      if (code === 'KeyD') { st.sortDir = -st.sortDir; ui.sfx('select'); return true; }
      if (code === 'KeyX') { st.act(); return true; }
      const all = st.list(), n = all.length;
      if (!n) return true;
      const target = (st.focusUid != null && g.relicOf(st.focusUid)) || all[st.sel];
      if (code === 'KeyL' && target) {
        const locked = g.toggleRelicLock(target.uid);
        if (locked) st.picked.delete(target.uid);
        ui.sfx('select');
        return true;
      }
      if (code === 'KeyV' && target) {
        g.toggleRelicTrash(target.uid);
        ui.sfx('select');
        return true;
      }
      const to = kk === 'left' ? st.sel - 1 : kk === 'right' ? st.sel + 1 : kk === 'up' ? st.sel - COLS : kk === 'down' ? st.sel + COLS : st.sel;
      if (to !== st.sel && to >= 0 && to < n) {
        st.sel = to;
        st.focusUid = all[st.sel].uid;
        ui.sfx('select');
        return true;
      }
      if (kk === 'ok' && all[st.sel]) { st.togglePick(all[st.sel]); return true; }
      return false;
    },

    openRelicSalvage(initFilter) {
      const ui = this, g = this.game, st = ui.makeRelicSalvageState(initFilter);
      st.draw = function (c) {
        const rx = ui.right;
        ui.fullBg(c, false);
        c.fillStyle = 'rgba(4,6,20,0.6)'; c.fillRect(ui.left, 0, ui.vw, HGT);
        G.menuIcon(c, 'bag', ui.left + 14, 9, 20, C.gold);
        ui.text('Инвентарь', ui.left + 38, 6, { size: 9, col: C.sub });
        ui.text('Разбор Реликвий', ui.left + 38, 16, { size: 13, bold: true, serif: true, col: C.gold });
        ui.button(rx - 236, 8, 78, 22, 'Правила', () => ui.openRelicSalvageRules(), { size: 10, icon: 'info' });
        ui.money(rx - 150, 9, 'remains', g.state.inv.items.remains || 0);
        ui.closeBtn(rx - 32, 8, () => ui.pop());
        ui.drawRelicSalvageBody(c, this, { inSynth: false });
      };
      st.key = function (kk, code) {
        ui.relicSalvageKey(this, kk, code, { inSynth: false });
      };
      return this.push(st);
    },

    openRelicSmartDiscard(salvage) {
      const ui = this, g = this.game;
      return this.push({
        unmatchedMain: true, maxUsefulSubs: null, protect: true, cursor: 0,
        candidates() {
          return g.relicSmartDiscardCandidates({
            unmatchedMain: this.unmatchedMain,
            maxUsefulSubs: this.maxUsefulSubs,
            protect: this.protect,
            includeEnhanced: !!(salvage && salvage.includeEnhanced)
          });
        },
        clearAll() {
          this.unmatchedMain = false;
          this.maxUsefulSubs = null;
          ui.sfx('cancel');
        },
        apply() {
          const uids = g.relicApplySmartDiscard({
            unmatchedMain: this.unmatchedMain,
            maxUsefulSubs: this.maxUsefulSubs,
            protect: this.protect,
            includeEnhanced: !!(salvage && salvage.includeEnhanced)
          });
          if (salvage && salvage.picked) {
            for (const uid of uids) {
              if (salvage.picked.size >= H.RELIC_CRAFT.salvageCap) break;
              salvage.picked.add(uid);
            }
            if (!salvage.focusUid && uids[0]) salvage.focusUid = uids[0];
          }
          ui.screens.pop();
          ui.sfx('confirm');
          ui.toast(uids.length ? 'Отмечено на выброс и выбрано: ' + uids.length + ' шт.' : 'Подходящих для выброса Реликвий не найдено.');
        },
        draw(c) {
          const x = 90, y = 104, w = 460, h = 256, cands = this.candidates();
          c.fillStyle = 'rgba(2,3,12,0.66)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Реликвии на выброс · Выбрано ' + cands.length + '/' + H.RELIC_CRAFT.salvageCap });
          ui.closeBtn(x + w - 28, y + 6, () => ui.pop());
          ui.text('Отбор Реликвий, соответствующих любому из следующих условий:', x + 16, y + 32, { size: 10, col: C.sub });
          ui.text('• Основная характеристика', x + 16, y + 52, { size: 11, bold: true, col: C.gold });
          const mx = x + 16, my = y + 70, mw = w - 32, mh = 26;
          c.fillStyle = this.unmatchedMain ? 'rgba(242,220,154,0.2)' : 'rgba(255,255,255,0.06)';
          c.fillRect(mx, my, mw, mh);
          c.strokeStyle = this.unmatchedMain ? C.brassHi : this.cursor === 0 ? C.sub : 'rgba(154,166,208,0.3)';
          c.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
          ui.text('Не подходит никому из рекомендованных персонажей', mx + 10, my + 7, { size: 10, bold: this.unmatchedMain, col: this.unmatchedMain ? C.gold : C.cream });
          const cbx = mx + mw - 20, cby = my + 6;
          c.fillStyle = this.unmatchedMain ? '#e69c3a' : 'rgba(10,12,28,0.85)';
          c.fillRect(cbx, cby, 14, 14);
          c.strokeStyle = this.unmatchedMain ? '#ffe8a0' : C.sub;
          c.strokeRect(cbx + 0.5, cby + 0.5, 13, 13);
          if (this.unmatchedMain) ui.text('✓', cbx + 7, cby + 1, { size: 10, bold: true, align: 'center', col: '#18140a', shadow: false });
          ui.hit(mx, my, mw, mh, () => { this.cursor = 0; this.unmatchedMain = !this.unmatchedMain; ui.sfx('select'); });
          ui.text('• Число совпадений полезных доп. характеристик', x + 16, y + 108, { size: 11, bold: true, col: C.gold });
          const subOpts = [[0, '0', mx, y + 126, 208], [1, '1 и менее', mx + 220, y + 126, 208]];
          subOpts.forEach(([val, label, ox, oy, ow], idx) => {
            const on = this.maxUsefulSubs === val, cur = this.cursor === idx + 1;
            c.fillStyle = on ? 'rgba(242,220,154,0.2)' : 'rgba(255,255,255,0.06)';
            c.fillRect(ox, oy, ow, 26);
            c.strokeStyle = on ? C.brassHi : cur ? C.sub : 'rgba(154,166,208,0.3)';
            c.strokeRect(ox + 0.5, oy + 0.5, ow - 1, 25);
            ui.text(label, ox + 10, oy + 7, { size: 10, bold: on, col: on ? C.gold : C.cream });
            const rx = ox + ow - 13, ry = oy + 13;
            c.strokeStyle = on ? '#e69c3a' : C.sub; c.lineWidth = 1.4;
            c.beginPath(); c.arc(rx, ry, 5, 0, Math.PI * 2); c.stroke();
            if (on) { c.fillStyle = '#e69c3a'; c.beginPath(); c.arc(rx, ry, 2.5, 0, Math.PI * 2); c.fill(); }
            c.lineWidth = 1;
            ui.hit(ox, oy, ow, 26, () => { this.cursor = idx + 1; this.maxUsefulSubs = this.maxUsefulSubs === val ? null : val; ui.sfx('select'); });
          });
          c.fillStyle = 'rgba(0,0,0,0.35)';
          c.fillRect(x + 8, y + 164, w - 16, 36);
          ui.text('Редкие основные характеристики (Скорость, Восст. энергии, криты) и двойной крит защищены.', x + 16, y + 170, { size: 8, col: C.dim });
          ui.text('Защита от выброса', x + w - 48, y + 183, { size: 10, align: 'right', col: this.protect ? C.gold : C.sub });
          ui.drawToggleSwitch(c, x + w - 42, y + 181, this.protect, () => { this.protect = !this.protect; ui.sfx('select'); });
          const hasAny = this.unmatchedMain || this.maxUsefulSubs !== null;
          ui.button(x + 60, y + h - 42, 156, 28, 'Очистить всё', () => this.clearAll(), { size: 11, disabled: !hasAny });
          ui.button(x + w - 216, y + h - 42, 156, 28, 'Подтвердить', () => this.apply(), { size: 11, active: hasAny, disabled: !hasAny });
        },
        key(kk, code) {
          if (kk === 'back') { ui.pop(); return; }
          if (code === 'KeyC') { this.clearAll(); return; }
          if (code === 'KeyP') { this.protect = !this.protect; ui.sfx('select'); return; }
          if (kk === 'up' || kk === 'down' || kk === 'left' || kk === 'right') {
            const d = (kk === 'up' || kk === 'left') ? 2 : 1;
            this.cursor = (this.cursor + d) % 3;
            ui.sfx('select');
            return;
          }
          if (code === 'Space') {
            if (this.cursor === 0) this.unmatchedMain = !this.unmatchedMain;
            else if (this.cursor === 1) this.maxUsefulSubs = this.maxUsefulSubs === 0 ? null : 0;
            else this.maxUsefulSubs = this.maxUsefulSubs === 1 ? null : 1;
            ui.sfx('select');
            return;
          }
          if (kk === 'ok') this.apply();
        }
      });
    },

    openRelicQuickSelect(salvage) {
      const ui = this, g = this.game, tiers = H.RELIC_CRAFT.quickTiers;
      const hasTrash = g.state.inv.relics.some(r => r.trash && !r.lock && !g.relicWorn(r.uid));
      return this.push({
        pickTrash: hasTrash, tierId: hasTrash ? null : 'q0', cursor: 0,
        apply() {
          if (!this.pickTrash && !this.tierId) { ui.sfx('deny'); ui.toast('Выберите условие быстрого выбора.'); return; }
          const list = salvage ? salvage.list() : g.relicSalvageList({ includeEnhanced: false });
          const uids = g.relicQuickPick({
            pickTrash: this.pickTrash,
            tierId: this.tierId,
            includeEnhanced: !!(salvage && salvage.includeEnhanced),
            list
          });
          if (salvage && salvage.picked) {
            salvage.picked.clear();
            for (const uid of uids) salvage.picked.add(uid);
            if (!salvage.focusUid && uids[0]) salvage.focusUid = uids[0];
          }
          ui.screens.pop();
          ui.sfx('confirm');
          ui.toast(uids.length ? 'Выбрано Реликвий: ' + uids.length + '.' : 'Подходящих Реликвий для быстрого выбора нет.');
        },
        draw(c) {
          const x = 100, y = 112, w = 440, h = 236;
          c.fillStyle = 'rgba(2,3,12,0.66)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Быстрый выбор' });
          ui.closeBtn(x + w - 28, y + 6, () => ui.pop());
          ui.text('• Выбрать из Реликвий на выброс:', x + 16, y + 34, { size: 11, bold: true, col: C.gold });
          const tx = x + 16, ty = y + 52, tw = 240, th = 26;
          c.fillStyle = this.pickTrash ? 'rgba(242,220,154,0.2)' : 'rgba(255,255,255,0.06)';
          c.fillRect(tx, ty, tw, th);
          c.strokeStyle = this.pickTrash ? C.brassHi : this.cursor === 0 ? C.sub : 'rgba(154,166,208,0.3)';
          c.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
          ui.text('Выбрать всё с меткой «на выброс»', tx + 10, ty + 7, { size: 10, bold: this.pickTrash, col: this.pickTrash ? C.gold : C.cream });
          const rcx = tx + tw - 13, rcy = ty + 13;
          c.strokeStyle = this.pickTrash ? '#e69c3a' : C.sub; c.lineWidth = 1.4;
          c.beginPath(); c.arc(rcx, rcy, 5, 0, Math.PI * 2); c.stroke();
          if (this.pickTrash) { c.fillStyle = '#e69c3a'; c.beginPath(); c.arc(rcx, rcy, 2.5, 0, Math.PI * 2); c.fill(); }
          c.lineWidth = 1;
          ui.hit(tx, ty, tw, th, () => { this.cursor = 0; this.pickTrash = !this.pickTrash; ui.sfx('select'); });
          ui.text('• Выбрать из Реликвий не на выброс:', x + 16, y + 90, { size: 11, bold: true, col: C.gold });
          tiers.forEach((t, i) => {
            const ox = x + 16 + (i % 2) * 206, oy = y + 108 + Math.floor(i / 2) * 32, ow = 200, oh = 26;
            const on = this.tierId === t.id, cur = this.cursor === i + 1;
            c.fillStyle = on ? 'rgba(242,220,154,0.2)' : 'rgba(255,255,255,0.06)';
            c.fillRect(ox, oy, ow, oh);
            c.strokeStyle = on ? C.brassHi : cur ? C.sub : 'rgba(154,166,208,0.3)';
            c.strokeRect(ox + 0.5, oy + 0.5, ow - 1, oh - 1);
            ui.text(t.label, ox + 10, oy + 7, { size: 10, bold: on, col: on ? C.gold : C.cream });
            const rx = ox + ow - 13, ry = oy + 13;
            c.strokeStyle = on ? '#e69c3a' : C.sub; c.lineWidth = 1.4;
            c.beginPath(); c.arc(rx, ry, 5, 0, Math.PI * 2); c.stroke();
            if (on) { c.fillStyle = '#e69c3a'; c.beginPath(); c.arc(rx, ry, 2.5, 0, Math.PI * 2); c.fill(); }
            c.lineWidth = 1;
            ui.hit(ox, oy, ow, oh, () => { this.cursor = i + 1; this.tierId = this.tierId === t.id ? null : t.id; ui.sfx('select'); });
          });
          const canConfirm = this.pickTrash || !!this.tierId;
          ui.button(W / 2 - 80, y + h - 40, 160, 28, 'Подтвердить', () => this.apply(), { size: 11, active: canConfirm, disabled: !canConfirm });
        },
        key(kk, code) {
          if (kk === 'back') { ui.pop(); return; }
          if (kk === 'up' || kk === 'down' || kk === 'left' || kk === 'right') {
            const d = (kk === 'up' || kk === 'left') ? 4 : 1;
            this.cursor = (this.cursor + d) % 5;
            if (this.cursor > 0) this.tierId = tiers[this.cursor - 1].id;
            ui.sfx('select');
            return;
          }
          if (code === 'Space') {
            if (this.cursor === 0) this.pickTrash = !this.pickTrash;
            else {
              const tid = tiers[this.cursor - 1].id;
              this.tierId = this.tierId === tid ? null : tid;
            }
            ui.sfx('select');
            return;
          }
          if (kk === 'ok') this.apply();
        }
      });
    },

    openRelicFilterDrawer(host) {
      const ui = this, g = this.game;
      const f = host.filter || (host.filter = H.relicMakeFilter());
      return this.push({
        tab: 0,
        reset() {
          const keepSlot = f.slot || 'all';
          Object.assign(f, H.relicMakeFilter({ slot: keepSlot }));
          if (host.sel != null) host.sel = 0;
          ui.sfx('cancel');
        },
        batch(mode) {
          const list = host.list ? host.list() : g.filterRelics(g.state.inv.relics, f);
          const n = g.relicBatchFilterAction(list, mode);
          if (host.syncPicked) host.syncPicked();
          ui.sfx(n ? 'confirm' : 'deny');
          ui.toast(n ? (mode === 'lock' ? 'Заблокировано Реликвий: ' : 'Отмечено на выброс: ') + n + '.' : 'Нет подходящих Реликвий для действия.');
        },
        saveTpl() {
          if (H.relicFilterEmpty(f)) { ui.sfx('deny'); ui.toast('Задайте хотя бы одно условие фильтра перед сохранением.'); return; }
          const saved = g.saveRelicFilterTpl(f);
          if (!saved) { ui.sfx('deny'); ui.toast('Достигнут лимит шаблонов (' + H.RELIC_CRAFT.tplCap + ').'); return; }
          ui.sfx('confirm');
          ui.toast('Сохранён «' + saved.name + '».');
        },
        draw(c) {
          if (host && host.draw) {
            const hitsAt = ui.hits.length;
            host.draw(c);
            ui.hits.length = hitsAt;
          }
          const dw = 248, dx = ui.right - dw, dy = 0, dh = HGT;
          c.fillStyle = 'rgba(2,3,14,0.45)';
          c.fillRect(ui.left, 0, dx - ui.left, HGT);
          ui.hit(ui.left, 0, dx - ui.left, HGT, () => { ui.pop(); ui.sfx('cancel'); });
          const gr = c.createLinearGradient(dx, 0, dx + dw, 0);
          gr.addColorStop(0, 'rgba(8,10,30,0.98)');
          gr.addColorStop(1, 'rgba(14,18,46,0.98)');
          c.fillStyle = gr;
          c.fillRect(dx, dy, dw, dh);
          c.fillStyle = C.brassDk;
          c.fillRect(dx, 0, 1, dh);
          ui.hit(dx, dy, dw, dh, () => {});
          ['Характеристики', 'Статус'].forEach((label, idx) => {
            const tx = dx + 14 + idx * 112, tw = 104, on = this.tab === idx;
            ui.text(label, tx + tw / 2, 16, { align: 'center', size: 11, bold: on, col: on ? C.gold : C.sub });
            if (on) { c.fillStyle = C.brassHi; c.fillRect(tx + 8, 33, tw - 16, 2); }
            ui.hit(tx, 10, tw, 26, () => { this.tab = idx; ui.sfx('select'); });
          });
          c.fillStyle = 'rgba(154,166,208,0.22)';
          c.fillRect(dx + 12, 36, dw - 24, 1);
          if (this.tab === 0) {
            const drawPickRow = (title, summary, y, onClick) => {
              ui.text(title, dx + 14, y, { size: 10, col: C.sub });
              const rx = dx + 14, ry = y + 15, rw = dw - 28, rh = 24;
              c.fillStyle = 'rgba(220,224,238,0.92)';
              c.fillRect(rx, ry, rw - 26, rh);
              c.fillStyle = '#ffffff';
              c.fillRect(rx + rw - 26, ry, 26, rh);
              ui.text(ui.fitText(summary, 10, rw - 38), rx + 8, ry + 6, { size: 10, col: '#181c30', shadow: false });
              ui.text('+', rx + rw - 13, ry + 4, { align: 'center', size: 14, bold: true, col: '#181c30', shadow: false });
              ui.hit(rx, ry, rw, rh, onClick);
            };
            const setLabel = f.sets.length ? f.sets.map(k => (H.RELIC_SETS[k] || {}).name || k).join(', ') : 'Выбрать';
            drawPickRow('Набор', setLabel, 48, () => ui.openRelicFilterMultiPick(f, 'sets', host));
            ui.text('Редкость / Уровень', dx + 14, 98, { size: 10, col: C.sub });
            H.RELIC_CRAFT.tiers.forEach((t, i) => {
              const px = dx + 14 + i * 56, py = 114, pw = 50, ph = 22, on = f.tiers.includes(t.id);
              c.fillStyle = on ? 'rgba(242,220,154,0.24)' : 'rgba(255,255,255,0.06)';
              c.fillRect(px, py, pw, ph);
              c.strokeStyle = on ? C.brassHi : 'rgba(154,166,208,0.35)';
              c.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
              ui.text(t.label, px + pw / 2, py + 5, { align: 'center', size: 10, bold: on, col: on ? C.gold : C.cream });
              ui.hit(px, py, pw, ph, () => {
                const idx = f.tiers.indexOf(t.id);
                if (idx >= 0) f.tiers.splice(idx, 1); else f.tiers.push(t.id);
                ui.sfx('select');
              });
            });
            const mainLabel = f.mains.length ? f.mains.map(k => H.STAT_NAMES[k] || k).join(', ') : 'Выбрать';
            drawPickRow('Основная характеристика', mainLabel, 148, () => ui.openRelicFilterMultiPick(f, 'mains', host));
            const subLabel = f.subs.length ? f.subs.map(k => H.STAT_NAMES[k] || k).join(', ') : 'Выбрать';
            drawPickRow('Доп. характеристики', subLabel, 198, () => ui.openRelicFilterMultiPick(f, 'subs', host));
            ui.text('Быстрое действие', dx + 14, 254, { size: 10, col: C.sub });
            const bx1 = dx + 14, bx2 = dx + 130, by = 272, bw = 104, bh = 26;
            c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(bx1, by, bw, bh);
            c.strokeStyle = 'rgba(154,166,208,0.4)'; c.strokeRect(bx1 + 0.5, by + 0.5, bw - 1, bh - 1);
            G.lockIcon(c, bx1 + 10, by + 7, true);
            ui.text('Блокировка', bx1 + 24, by + 7, { size: 10, col: C.cream });
            ui.hit(bx1, by, bw, bh, () => this.batch('lock'));
            c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(bx2, by, bw, bh);
            c.strokeStyle = 'rgba(154,166,208,0.4)'; c.strokeRect(bx2 + 0.5, by + 0.5, bw - 1, bh - 1);
            G.trashIcon(c, bx2 + 10, by + 7, true);
            ui.text('Выброс', bx2 + 28, by + 7, { size: 10, col: C.cream });
            ui.hit(bx2, by, bw, bh, () => this.batch('trash'));
          } else {
            const drawStatusGroup = (title, field, opts, y) => {
              ui.text(title, dx + 14, y, { size: 10, col: C.sub });
              opts.forEach(([val, label], i) => {
                const ox = dx + 14 + i * 112, oy = y + 16, ow = 104, oh = 24, on = f[field] === val;
                c.fillStyle = on ? 'rgba(242,220,154,0.22)' : 'rgba(255,255,255,0.06)';
                c.fillRect(ox, oy, ow, oh);
                c.strokeStyle = on ? C.brassHi : 'rgba(154,166,208,0.35)';
                c.strokeRect(ox + 0.5, oy + 0.5, ow - 1, oh - 1);
                ui.text(label, ox + ow / 2, oy + 6, { align: 'center', size: 9, bold: on, col: on ? C.gold : C.cream });
                ui.hit(ox, oy, ow, oh, () => { f[field] = f[field] === val ? 'all' : val; ui.sfx('select'); });
              });
            };
            drawStatusGroup('Блокировка', 'lock', [['locked', 'Заблокировано'], ['unlocked', 'Без замка']], 52);
            drawStatusGroup('Метка выброса', 'trash', [['trash', 'На выброс'], ['notrash', 'Без метки']], 110);
            drawStatusGroup('Статус усиления', 'enh', [['enh', 'Усиленные'], ['unenh', 'Только +0']], 168);
          }
          const fy = HGT - 42;
          ui.button(dx + 14, fy, 30, 26, '↻', () => this.reset(), { size: 12 });
          ui.button(dx + 50, fy, 88, 26, 'Шаблоны', () => ui.openRelicFilterTemplates(f, host), { size: 10 });
          ui.button(dx + 144, fy, 90, 26, 'Сохранить', () => this.saveTpl(), { size: 10, active: !H.relicFilterEmpty(f) });
        },
        key(kk, code) {
          if (kk === 'back' || code === 'KeyF') { ui.pop(); return; }
          if (code === 'KeyQ' || code === 'KeyE' || kk === 'left' || kk === 'right') { this.tab = 1 - this.tab; ui.sfx('select'); return; }
          if (code === 'KeyR') { this.reset(); return; }
          if (code === 'KeyT') { ui.openRelicFilterTemplates(f, host); return; }
          if (code === 'KeyS') { this.saveTpl(); return; }
        }
      });
    },

    openRelicFilterMultiPick(filter, field, host) {
      const ui = this;
      const items = field === 'sets'
        ? Object.entries(H.RELIC_SETS).map(([k, d]) => ({ id: k, label: d.name }))
        : field === 'mains'
          ? [...new Set(H.RELIC_SLOTS.flatMap(s => s.mains))].map(k => ({ id: k, label: H.STAT_NAMES[k] || k }))
          : Object.keys(H.STAT_ROLL).map(k => ({ id: k, label: H.STAT_NAMES[k] || k }));
      const title = field === 'sets' ? 'Выбор наборов Реликвий' : field === 'mains' ? 'Основная характеристика' : 'Доп. характеристики';
      return this.push({
        sel: 0, sc: { top: 0 },
        toggle(id) {
          const arr = filter[field];
          const idx = arr.indexOf(id);
          if (idx >= 0) { arr.splice(idx, 1); ui.sfx('cancel'); return; }
          if (field === 'subs' && arr.length >= 4) { ui.sfx('deny'); ui.toast('Можно выбрать не более 4 доп. характеристик.'); return; }
          arr.push(id);
          ui.sfx('select');
        },
        draw(c) {
          const x = W / 2 - 190, y = 64, w = 380, h = 340, vis = 9, rh = 26;
          c.fillStyle = 'rgba(2,3,12,0.66)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.win(x, y, w, h, { title });
          ui.closeBtn(x + w - 28, y + 6, () => ui.pop());
          const top = ui.listTop(this.sc, this.sel, items.length, vis);
          ui.wheelZone(x + 12, y + 32, w - 24, vis * rh, d => { this.sc.top += d; });
          if (items.length > vis) ui.scrollBar(x + w - 18, y + 32, vis * rh - 4, this.sc, items.length, vis);
          items.slice(top, top + vis).forEach((it, j) => {
            const i = top + j, ry = y + 32 + j * rh, on = filter[field].includes(it.id), cur = i === this.sel;
            c.fillStyle = on ? 'rgba(242,220,154,0.2)' : cur ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
            c.fillRect(x + 14, ry, w - 36, rh - 2);
            if (on || cur) { c.strokeStyle = on ? C.brassHi : C.sub; c.strokeRect(x + 14.5, ry + 0.5, w - 37, rh - 3); }
            if (field === 'sets') G.itemIcon(c, 'relic:' + (H.RELIC_SETS[it.id].planar ? 'sphere' : 'head'), x + 18, ry + 2, 20, it.id);
            else ui.drawRelicStatIcon(c, it.id, x + 20, ry + 6, 12, on ? C.gold : '#c8d0f0');
            ui.text(ui.fitText(it.label, 10, w - 96), x + 42, ry + 6, { size: 10, bold: on, col: on ? C.gold : C.cream });
            if (on) ui.text('✓', x + w - 34, ry + 6, { size: 11, bold: true, align: 'center', col: C.gold });
            ui.hit(x + 14, ry, w - 36, rh - 2, () => { this.sel = i; this.toggle(it.id); });
          });
          ui.button(x + 36, y + h - 40, 136, 26, 'Сбросить', () => { filter[field].length = 0; ui.sfx('cancel'); }, { size: 11, disabled: !filter[field].length });
          ui.button(x + w - 172, y + h - 40, 136, 26, 'Готово', () => { if (host && host.sel != null) host.sel = 0; ui.pop(); }, { size: 11, active: true });
        },
        key(kk) {
          if (kk === 'back') { ui.pop(); return; }
          if (kk === 'up' || kk === 'down') { this.sel = (this.sel + (kk === 'up' ? items.length - 1 : 1)) % items.length; ui.sfx('select'); return; }
          if (kk === 'ok' && items[this.sel]) this.toggle(items[this.sel].id);
        }
      });
    },

    openRelicFilterTemplates(filter, host) {
      const ui = this, g = this.game;
      g.ensureRelics();
      return this.push({
        sel: 0,
        draw(c) {
          const tpls = g.state.relicFilterTpls, x = W / 2 - 170, y = 110, w = 340, h = 230;
          c.fillStyle = 'rgba(2,3,12,0.66)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.win(x, y, w, h, { title: 'Шаблоны фильтров (' + tpls.length + '/' + H.RELIC_CRAFT.tplCap + ')' });
          ui.closeBtn(x + w - 28, y + 6, () => ui.pop());
          if (!tpls.length) {
            ui.text('Сохранённых шаблонов пока нет.', W / 2, y + 96, { align: 'center', size: 10, col: C.dim });
          } else {
            tpls.forEach((t, i) => {
              const ry = y + 34 + i * 30, on = i === this.sel;
              c.fillStyle = on ? 'rgba(242,220,154,0.2)' : 'rgba(255,255,255,0.05)';
              c.fillRect(x + 16, ry, w - 72, 26);
              if (on) { c.strokeStyle = C.brassHi; c.strokeRect(x + 16.5, ry + 0.5, w - 73, 25); }
              ui.text(t.name, x + 24, ry + 7, { size: 10, bold: on, col: on ? C.gold : C.cream });
              ui.hit(x + 16, ry, w - 72, 26, () => {
                const keepSlot = filter.slot || 'all';
                Object.assign(filter, H.relicMakeFilter(t.filter), { slot: keepSlot });
                if (host && host.sel != null) host.sel = 0;
                ui.screens.pop();
                ui.sfx('confirm');
                ui.toast('Применён «' + t.name + '».');
              });
              ui.button(x + w - 50, ry + 1, 34, 24, '✕', () => {
                g.deleteRelicFilterTpl(t.id);
                this.sel = Math.max(0, Math.min(this.sel, g.state.relicFilterTpls.length - 1));
                ui.sfx('cancel');
              }, { size: 10 });
            });
          }
          ui.button(W / 2 - 70, y + h - 38, 140, 26, 'Закрыть', () => ui.pop(), { size: 11, active: true });
        },
        key(kk, code) {
          const tpls = g.state.relicFilterTpls;
          if (kk === 'back') { ui.pop(); return; }
          if (!tpls.length) { if (kk === 'ok') ui.pop(); return; }
          if (kk === 'up' || kk === 'down') { this.sel = (this.sel + (kk === 'up' ? tpls.length - 1 : 1)) % tpls.length; ui.sfx('select'); return; }
          if (code === 'Delete' || code === 'KeyX') {
            g.deleteRelicFilterTpl(tpls[this.sel].id);
            this.sel = Math.max(0, Math.min(this.sel, tpls.length - 1));
            ui.sfx('cancel');
            return;
          }
          if (kk === 'ok' && tpls[this.sel]) {
            const keepSlot = filter.slot || 'all';
            Object.assign(filter, H.relicMakeFilter(tpls[this.sel].filter), { slot: keepSlot });
            if (host && host.sel != null) host.sel = 0;
            ui.screens.pop();
            ui.sfx('confirm');
          }
        }
      });
    },

    openRelicSalvageRules() {
      const ui = this;
      const lines = [
        '1. Для разборки доступны неэкипированные и незаблокированные Реликвии. По умолчанию отображаются только Реликвии +0; переключатель «Включать усиленные Реликвии» добавляет в список предметы +1..+15.',
        '2. За каждую разобранную Реликвию начисляется 150 кредитов и Обломки Реликвии (10 шт. базово + 4 шт. за каждый уровень усиления).',
        '3. Метки «Блокировка» (L) и «На выброс» (V) взаимоисключающие: блокировка защищает предмет от разбора, а метка «на выброс» позволяет отобрать ненужные Реликвии в одно нажатие.',
        '4. «Умный выброс» сверяет основные и доп. характеристики с рекомендованными сборками персонажей и защищает редкие комбинации (Скорость, Восст. энергии, криты).'
      ];
      return this.push({
        draw(c) {
          const x = W / 2 - 220, y = 96, w = 440, h = 272;
          c.fillStyle = 'rgba(2,3,12,0.66)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.win(x, y, w, h, { title: 'Правила разборки Реликвий' });
          ui.closeBtn(x + w - 28, y + 6, () => ui.pop());
          let ry = y + 32;
          lines.forEach(p => {
            ui.wrap(p, w - 32, 10).forEach(l => {
              ui.text(l, x + 16, ry, { size: 10, col: C.cream });
              ry += 13;
            });
            ry += 6;
          });
          ui.button(W / 2 - 70, y + h - 40, 140, 26, 'Понятно', () => ui.pop(), { size: 11, active: true });
        },
        key(kk) { if (kk === 'ok' || kk === 'back') ui.pop(); }
      });
    },

    openRelicSalvageConfirm(salvage, prev) {
      const ui = this, g = this.game;
      return this.push({
        sel: 0,
        draw(c) {
          const x = W / 2 - 190, y = 128, w = 380, h = 214;
          c.fillStyle = 'rgba(2,3,12,0.66)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.win(x, y, w, h, { title: 'Подтверждение разборки' });
          ui.text('Выбрано Реликвий: ' + prev.count, W / 2, y + 28, { align: 'center', size: 12, bold: true, col: C.cream });
          if (prev.hasEnhanced) ui.text('Внимание: среди выбранных есть усиленные Реликвии (до +' + prev.maxLvl + ')!', W / 2, y + 46, { align: 'center', size: 10, bold: true, col: C.bad });
          else ui.text('Разобранные Реликвии исчезнут безвозвратно.', W / 2, y + 46, { align: 'center', size: 10, col: C.sub });
          ui.text('Вы получите:', W / 2, y + 68, { align: 'center', size: 11, col: C.gold });
          const totalW = prev.items.length * 64 - 8, sx0 = Math.round(W / 2 - totalW / 2);
          prev.items.forEach((it, idx) => {
            const ix = sx0 + idx * 64, iy = y + 86;
            G.rarityCell(c, ix, iy, 56, 48, it.rar);
            G.itemIcon(c, it.id, ix + 12, iy + 4, 32);
            ui.text('×' + H.fmt(it.count), ix + 52, iy + 34, { size: 9, bold: true, align: 'right', col: C.cream });
          });
          ui.button(x + 30, y + h - 42, 146, 28, 'Разобрать', () => { this.sel = 0; this.key('ok'); }, { size: 12, active: this.sel === 0 });
          ui.button(x + w - 176, y + h - 42, 146, 28, 'Отмена', () => { this.sel = 1; this.key('ok'); }, { size: 12, active: this.sel === 1 });
        },
        key(kk) {
          if (kk === 'left' || kk === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (kk === 'back') { ui.pop(); return; }
          if (kk !== 'ok') return;
          ui.screens.pop();
          if (this.sel === 1) return;
          const res = g.relicSalvage([...salvage.picked]);
          salvage.picked.clear();
          if (!res) { ui.sfx('deny'); return; }
          ui.sfx('chest');
          ui.toast('Получено: ' + res.items.map(it => it.name + ' ×' + H.fmt(it.count)).join(', ') + '.');
        }
      });
    },

    synthLockedBody(c, why) {
      this.win(W / 2 - 150, 190, 300, 80, { alpha: 0.9 });
      this.text('Раздел закрыт', W / 2, 206, { align: 'center', size: 13, bold: true, serif: true, col: C.gold });
      this.text('Доступно ' + why + '.', W / 2, 232, { align: 'center', size: 11, col: C.sub });
    },

    openSynthPicker(scr, r) {
      const ui = this, inv = this.game.state.inv.items, list = this.synthSources(r.to);
      if (!list.length) { ui.sfx('deny'); ui.toast('Нет двух одинаковых материалов той же ступени.'); return; }
      this.push({
        sel: Math.max(0, list.indexOf(scr.src)), sc: { top: 0 },
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          const x = W / 2 - 160, vis = 6, rh = 44, h = 64 + Math.min(vis, list.length) * rh;
          ui.win(x, 100, 320, h, { title: 'Выберите материал' });
          ui.text('Два таких дают один «' + ui.fitText(H.ITEMS[r.to].name, 10, 150) + '»', W / 2, 116, { align: 'center', size: 10, col: C.sub });
          const top = ui.listTop(this.sc, this.sel, list.length, vis);
          list.slice(top, top + vis).forEach((id, j) => {
            const i = top + j, y = 136 + j * rh, on = i === this.sel, it = H.ITEMS[id];
            c.fillStyle = on ? 'rgba(242,220,154,0.18)' : 'rgba(255,255,255,0.03)'; c.fillRect(x + 12, y, 296, rh - 4);
            if (on) { c.strokeStyle = C.brassHi; c.strokeRect(x + 12.5, y + 0.5, 295, rh - 5); }
            G.rarityCell(c, x + 18, y + 4, 32, 32, it.rar); G.itemIcon(c, id, x + 18, y + 4, 32);
            ui.text(ui.fitText(it.name, 11, 190), x + 58, y + 6, { size: 11, col: C.cream });
            ui.text('×' + inv[id], x + 300, y + 13, { align: 'right', size: 12, bold: true, col: C.gold });
            ui.hit(x + 12, y, 296, rh - 4, () => { this.sel = i; this.key('ok'); });
          });
          if (list.length > vis) ui.scrollBar(x + 312 - 10, 136, vis * rh - 4, this.sc, list.length, vis);
          ui.hints([['↑↓', 'Выбор'], ['Enter', 'Добавить'], ['Esc', 'Назад']], W / 2, 100 + h + 8, { align: 'center' });
        },
        key(k) {
          if (k === 'back') { ui.pop(); return; }
          if (k === 'up' || k === 'down') { this.sel = (this.sel + (k === 'up' ? list.length - 1 : 1)) % list.length; ui.sfx('select'); return; }
          if (k === 'ok') { scr.src = list[this.sel]; scr.qty = 1; ui.screens.pop(); ui.sfx('confirm'); }
        }
      });
    },

    openUi_synth() { this.openSynth(() => this.finishPending()); },

    relicMove(scr, k) {
      const n = this.relicSets().length, at = this.relicCellPos(scr.rsel);
      if (k === 'left' || k === 'right') { scr.rsel = Math.max(0, Math.min(n - 1, scr.rsel + (k === 'left' ? -1 : 1))); return; }
      const dir = k === 'up' ? -1 : 1, cand = [];
      for (let i = 0; i < n; i++) { const p = this.relicCellPos(i); if ((p.y - at.y) * dir > 0) cand.push({ i, dy: Math.abs(p.y - at.y), dx: Math.abs(p.x - at.x) }); }
      if (!cand.length) return;
      const dy = Math.min(...cand.map(o => o.dy));
      scr.rsel = cand.filter(o => o.dy === dy).sort((a, b) => a.dx - b.dx)[0].i;
    },

    synthRelicKey(scr, k, code) {
      const ui = this, slots = ui.relicSlots(ui.relicSets()[scr.rsel]);
      if (code === 'KeyR') { scr.buyResin(); return true; }
      if (scr.rfocus === 'slot') {
        if (k === 'back' || k === 'up') { scr.rfocus = 'grid'; ui.sfx('cancel'); return true; }
        if (k === 'left' || k === 'right') { scr.rslot = (scr.rslot + (k === 'left' ? slots.length - 1 : 1)) % slots.length; ui.sfx('select'); return true; }
        if (k === 'ok') { ui.openRelicCraft(scr); return true; }
        return true;
      }
      if (['left', 'right', 'up', 'down'].includes(k)) { const was = scr.rsel; ui.relicMove(scr, k); if (was !== scr.rsel) { scr.rslot = 0; ui.sfx('select'); } return true; }
      if (k === 'ok') { scr.rfocus = 'slot'; ui.sfx('select'); return true; }
      return false;
    },

    openSynth(close, tab, o = {}) {
      const ui = this, g = this.game;
      const resolveTab = t => {
        if (typeof t === 'string') {
          const idx = TABS.findIndex(x => x.id === t);
          return idx >= 0 ? idx : 1;
        }
        return t == null ? 1 : ((t % TABS.length) + TABS.length) % TABS.length;
      };
      g.recipeSync();
      return this.push({
        full: true, tab: resolveTab(tab), sel: 0, qty: 1, src: null, filter: false, sc: { top: 0 },
        rsel: 0, rslot: 0, rfocus: 'grid', useResin: !!o.resin,
        relicSalvage: ui.makeRelicSalvageState(o.relicFilter),
        coneSalvage: ui.makeConeSalvageState(),
        buyResin() {
          if (g.resinFromRemains()) { ui.sfx('chest'); ui.toast('Получено: ' + H.ITEMS.resin.name + '.'); return; }
          ui.sfx('deny');
          ui.toast(g.resinLeft() <= 0 ? 'В этом часу смола уже получена дважды.' : 'Нужно ' + H.RELIC_CRAFT.resinCost + ' Обломков Реликвии.');
        },
        rows() { const all = ui.synthRows(this.tab); return this.filter ? all.filter(r => ui.synthCan(this.tab, r)) : all; },
        srcFor(r) {
          if (TABS[this.tab].id === 'mat') return r.from;
          const inv = g.state.inv.items;
          return this.src && g.exchangeOk(this.src, r.to) && (inv[this.src] || 0) >= NEED.swap ? this.src : null;
        },
        current() { return this.rows()[this.sel]; },
        maxNow() { const r = this.current(); return r ? ui.synthMax(this.tab, r, this.srcFor(r)) : 0; },
        setTab(t) {
          this.tab = typeof t === 'string' ? resolveTab(t) : (t + TABS.length) % TABS.length;
          this.sel = 0; this.qty = 1; this.src = null; this.sc = { top: 0 }; this.rfocus = 'grid';
          if (this.relicSalvage) this.relicSalvage.sortMenu = false;
          if (this.coneSalvage) this.coneSalvage.sortMenu = false;
          ui.sfx('select');
        },
        setQty(n) { const m = Math.max(1, this.maxNow()), q = Math.max(1, Math.min(m, n)); if (q !== this.qty) ui.sfx('select'); this.qty = q; },
        pick(i) { if (i !== this.sel) { this.sel = i; this.qty = 1; ui.sfx('select'); } },
        toggleFilter() { this.filter = !this.filter; this.sel = 0; this.qty = 1; this.sc = { top: 0 }; ui.sfx('select'); },
        openPicker() { const r = this.current(); if (r && TABS[this.tab].id === 'swap') ui.openSynthPicker(this, r); },
        autoAdd() {
          const r = this.current();
          if (!r || TABS[this.tab].id !== 'swap') return;
          const best = ui.synthSources(r.to)[0];
          if (!best) { ui.sfx('deny'); ui.toast('Нет двух одинаковых материалов той же ступени.'); return; }
          this.src = best; this.qty = 1; ui.sfx('confirm');
        },
        draw(c) {
          const id = TABS[this.tab].id, b = ui.synthBox();
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(4,6,20,0.5)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.synthHeader(c, this);
          ui.closeBtn(b.rx - 32, 8, () => this.key('back'));
          const lock = ui.synthLock(this.tab);
          if (lock) { ui.synthLockedBody(c, lock); ui.hints([['Q/E', 'Раздел'], ['Esc', 'Назад']], b.lx, HGT - 18); return; }
          if (id === 'relicSalvage') { ui.drawRelicSalvageBody(c, this.relicSalvage, { inSynth: true }); return; }
          if (id === 'coneSalvage') { ui.drawConeSalvageBody(c, this.coneSalvage, { inSynth: true }); return; }
          if (id === 'relic') {
            ui.synthRelicGrid(c, this, b);
            ui.synthRelicPanel(c, this, b);
            ui.hints(this.rfocus === 'slot' ? [['Q/E', 'Раздел'], ['←→', 'Слот'], ['Enter', 'Синтез'], ['R', 'Смола'], ['Esc', 'К наборам']] : [['Q/E', 'Раздел'], ['←↑↓→', 'Набор'], ['Enter', 'Слоты'], ['R', 'Смола'], ['Esc', 'Назад']], b.lx, HGT - 18);
            return;
          }
          const rows = this.rows();
          this.sel = Math.max(0, Math.min(this.sel, rows.length - 1));
          this.qty = Math.max(1, Math.min(this.qty, Math.max(1, this.maxNow())));
          ui.synthGrid(c, this, rows, b);
          ui.synthPanel(c, this, rows[this.sel], b);
          const swap = id === 'swap';
          ui.hints([['Q/E', 'Раздел'], ['←↑↓→', 'Выбор'], ['A/D', 'Количество'], ['Enter', swap && !this.srcFor(rows[this.sel] || {}) ? 'Добавить' : 'Синтез']].concat(swap ? [['Tab', 'Материал'], ['R', 'Авто']] : [], [['F', 'Фильтр'], ['Esc', 'Назад']]), b.lx, HGT - 18);
        },
        key(k, code) {
          const id = TABS[this.tab].id;
          if (code === 'KeyQ' || code === 'KeyE') { this.setTab(this.tab + (code === 'KeyQ' ? -1 : 1)); return; }
          if (id === 'relicSalvage' && ui.relicSalvageKey(this.relicSalvage, k, code, { inSynth: true })) return;
          if (id === 'coneSalvage' && ui.coneSalvageKey(this.coneSalvage, k, code, { inSynth: true })) return;
          if (id === 'relic' && !ui.synthLock(this.tab) && ui.synthRelicKey(this, k, code)) return;
          if (k === 'back') { ui.pop(); if (close) close(); return; }
          if (ui.synthLock(this.tab)) return;
          if (code === 'KeyF') { this.toggleFilter(); return; }
          if (code === 'KeyA' || code === 'Minus' || code === 'NumpadSubtract') { this.setQty(this.qty - 1); return; }
          if (code === 'KeyD' || code === 'Equal' || code === 'NumpadAdd') { this.setQty(this.qty + 1); return; }
          if (code === 'Home') { this.setQty(1); return; }
          if (code === 'End') { this.setQty(this.maxNow()); return; }
          const swap = id === 'swap';
          if (swap && code === 'Tab') { this.openPicker(); return; }
          if (swap && code === 'KeyR') { this.autoAdd(); return; }
          const rows = this.rows(), n = rows.length, cols = ui.synthBox().grid.cols;
          if (!n) return;
          const mv = { left: -1, right: 1, up: -cols, down: cols }[k];
          if (mv) { this.pick(Math.max(0, Math.min(n - 1, this.sel + mv))); return; }
          if (k !== 'ok') return;
          const r = rows[this.sel], src = this.srcFor(r);
          if (swap && !src) { this.openPicker(); return; }
          if (r.known === false) { ui.sfx('deny'); ui.toast('Рецепт не изучен. ' + H.recipeWhere(r.to)); return; }
          const food = id === 'food';
          const done = this.maxNow() >= this.qty && (food ? g.cook(r.to, this.qty) : swap ? g.exchange(src, r.to, this.qty) : g.synth(src, this.qty));
          if (!done) { ui.sfx('deny'); ui.toast('Не хватает материалов.'); return; }
          ui.sfx('chest');
          ui.toast('Получено: ' + H.ITEMS[r.to].name + ' ×' + this.qty + '.');
          this.qty = 1;
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
