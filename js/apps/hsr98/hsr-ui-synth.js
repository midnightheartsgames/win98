(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;

  const TABS = [
    { id: 'food', label: 'Расходные предметы', icon: 'sfood' },
    { id: 'mat', label: 'Синтез материалов', icon: 'smat' },
    { id: 'swap', label: 'Обмен материалами', icon: 'sswap' },
    { id: 'relic', label: 'Реликвии', icon: 'relic' }
  ];
  const GRID = { x: 18, y: 54, cw: 58, ch: 66, gap: 6, cols: 3, rows: 5 };
  const PANEL = { x: 236, y: 44, w: 392, h: 404, mid: 432 };
  const SLIDER = { x: 304, y: 331, w: 240 };
  const TAB_ROW = { mid: 380, step: 44, y: 24, r: 15 };
  const NEED = { mat: 3, swap: 2 };
  const RELIC_GRID = { cavernY: 72, planarY: 334, pitch: 60, ch: 54 };

  Object.assign(H.UI.prototype, {
    synthTabs: TABS,

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
      const ui = this, t = TABS[scr.tab];
      G.menuIcon(c, 'synth', 10, 8, 28, C.brassHi);
      ui.text('Синтез', 44, 7, { size: 10, col: C.brass });
      ui.text(t.label, 44, 20, { size: 14, bold: true, serif: true, col: C.gold });
      const x0 = TAB_ROW.mid - (TABS.length - 1) * TAB_ROW.step / 2;
      ui.keycap(x0 - TAB_ROW.r - 22, TAB_ROW.y - 6, 'Q');
      ui.keycap(x0 + (TABS.length - 1) * TAB_ROW.step + TAB_ROW.r + 8, TAB_ROW.y - 6, 'E');
      TABS.forEach((tb, i) => {
        const cx = x0 + i * TAB_ROW.step, cy = TAB_ROW.y, on = i === scr.tab, locked = !!ui.synthLock(i);
        c.fillStyle = '#010208'; c.beginPath(); c.arc(cx, cy, TAB_ROW.r + 1, 0, Math.PI * 2); c.fill();
        c.fillStyle = on ? '#2c2e62' : '#0c1030'; c.beginPath(); c.arc(cx, cy, TAB_ROW.r, 0, Math.PI * 2); c.fill();
        c.strokeStyle = on ? C.brassHi : C.brassDk; c.lineWidth = on ? 2 : 1; c.beginPath(); c.arc(cx, cy, TAB_ROW.r - 1, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
        G.menuIcon(c, tb.icon, cx - 11, cy - 11, 22, locked ? '#4c5070' : on ? '#fff0c0' : '#c8cce0');
        if (on) { c.fillStyle = C.brassHi; c.fillRect(cx - 20, cy + TAB_ROW.r + 4, 40, 2); }
        ui.hit(cx - TAB_ROW.r, cy - TAB_ROW.r, TAB_ROW.r * 2, TAB_ROW.r * 2, () => scr.setTab(i));
      });
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

    synthGrid(c, scr, rows) {
      const ui = this, nRows = Math.ceil(rows.length / GRID.cols);
      ui.win(12, 44, 214, 404, { alpha: 0.88, corners: false });
      const top = ui.listTop(scr.sc, Math.floor(scr.sel / GRID.cols), nRows, GRID.rows);
      rows.slice(top * GRID.cols, (top + GRID.rows) * GRID.cols).forEach((r, j) => {
        const i = top * GRID.cols + j, x = GRID.x + (j % GRID.cols) * (GRID.cw + GRID.gap), y = GRID.y + Math.floor(j / GRID.cols) * (GRID.ch + 4);
        ui.synthCell(c, r.to, r.have, x, y, i === scr.sel, r.known === false);
        ui.hit(x, y, GRID.cw, GRID.ch, () => scr.pick(i));
      });
      if (!rows.length) ui.wrap(scr.filter ? 'Сейчас синтезировать нечего. F показывает всё.' : 'Пусто.', 180, 10).forEach((l, i) => ui.text(l, 119, 200 + i * 14, { align: 'center', size: 10, col: C.dim }));
      if (nRows > GRID.rows) ui.scrollBar(210, GRID.y, GRID.rows * (GRID.ch + 4) - 4, scr.sc, nRows, GRID.rows);
      ui.wheelZone(12, 44, 214, 360, d => { scr.sc.top += d; });
      ui.button(20, 414, 120, 22, scr.filter ? 'Фильтр: можно' : 'Фильтр: все', () => scr.toggleFilter(), { size: 10, active: scr.filter });
    },

    synthMedal(c, id, cx, cy, r, o = {}) {
      const it = H.ITEMS[id];
      if (o.lines !== false) {
        c.strokeStyle = 'rgba(201,164,92,0.35)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(PANEL.x + 18, cy + 0.5); c.lineTo(cx - r - 12, cy + 0.5); c.moveTo(cx + r + 12, cy + 0.5); c.lineTo(PANEL.x + PANEL.w - 18, cy + 0.5); c.stroke();
        for (const sx of [PANEL.x + 40, PANEL.x + PANEL.w - 40]) { c.beginPath(); c.arc(sx, cy + 0.5, 9, 0, Math.PI * 2); c.stroke(); this.diamond(sx, cy + 0.5, 2.5, C.brass); }
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

    synthFoodTop(c, r) {
      const ui = this, it = H.ITEMS[r.to], x = 372, w = PANEL.x + PANEL.w - 16 - x;
      ui.synthMedal(c, r.to, 316, 126, 40, { lines: false, sil: !r.known });
      ui.text('В наличии: ' + r.have, 316, 176, { align: 'center', size: 11, col: C.sub });
      ui.text(ui.fitText(it.name, 15, w, true), x, 58, { size: 15, bold: true, serif: true, col: C.gold });
      c.fillStyle = C.brassDk; c.fillRect(x, 80, w, 1);
      ui.text('Эффект', x, 88, { size: 11, col: C.sub });
      ui.wrap(it.text, w, 11).slice(0, 4).forEach((l, i) => ui.text(l, x, 104 + i * 14, { size: 11, col: C.cream }));
      if (!r.known) ui.text('Рецепт не изучен', x, 166, { size: 11, bold: true, col: C.bad });
    },

    synthDivider(c, y, label) {
      const ui = this, tw = ui.measure(label, 11) / 2 + 14;
      c.fillStyle = C.brassDk; c.fillRect(PANEL.x + 18, y + 6, PANEL.mid - tw - PANEL.x - 18, 1); c.fillRect(PANEL.mid + tw, y + 6, PANEL.x + PANEL.w - 18 - PANEL.mid - tw, 1);
      ui.diamond(PANEL.mid - tw, y + 6.5, 3, C.brass, '#1a1208'); ui.diamond(PANEL.mid + tw, y + 6.5, 3, C.brass, '#1a1208');
      ui.text(label, PANEL.mid, y, { align: 'center', size: 11, col: C.cream });
    },

    synthNeedCell(c, id, have, need, x, y) {
      const it = H.ITEMS[id];
      G.rarityCell(c, x, y, 46, 46, it.rar || 2);
      G.itemIcon(c, id, x + 5, y + 3, 36);
      this.text(have + '/' + need, x + 23, y + 50, { align: 'center', size: 12, bold: true, col: have >= need ? C.ok : C.bad });
    },

    synthPlaque(c, y, label) {
      const x = PANEL.x + 16, w = PANEL.w - 32;
      const gr = c.createLinearGradient(x, y, x, y + 22);
      gr.addColorStop(0, '#f0d898'); gr.addColorStop(1, '#b89048');
      c.fillStyle = '#1a1208'; c.fillRect(x - 1, y - 1, w + 2, 24);
      c.fillStyle = gr; c.fillRect(x, y, w, 22);
      this.text(label, PANEL.mid, y + 5, { align: 'center', size: 11, bold: true, col: '#20140c', shadow: false });
    },

    synthSlider(c, scr, max) {
      const ui = this;
      ui.text('Количество: ' + scr.qty, PANEL.mid, 304, { align: 'center', size: 11, col: C.cream });
      ui.button(PANEL.x + 16, 322, 30, 18, '−', () => scr.setQty(scr.qty - 1), { size: 12, bold: true, disabled: scr.qty <= 1 });
      ui.text('1', SLIDER.x - 12, 325, { align: 'center', size: 11, col: C.sub });
      ui.rail(SLIDER.x, SLIDER.y, SLIDER.w, max > 1 ? (scr.qty - 1) / (max - 1) : 1);
      ui.text(String(max), SLIDER.x + SLIDER.w + 16, 325, { align: 'center', size: 11, col: C.sub });
      ui.button(PANEL.x + PANEL.w - 46, 322, 30, 18, '+', () => scr.setQty(scr.qty + 1), { size: 12, bold: true, disabled: scr.qty >= max });
      ui.hit(SLIDER.x - 6, 322, SLIDER.w + 12, 18, (b, p) => {
        const set = q => scr.setQty(Math.round(1 + Math.max(0, Math.min(1, (q.x - SLIDER.x) / SLIDER.w)) * (max - 1)));
        if (p) { set(p); ui.drag = { move: set }; }
      });
    },

    synthPanel(c, scr, r) {
      const ui = this, g = this.game, inv = g.state.inv.items, id = TABS[scr.tab].id;
      ui.win(PANEL.x, PANEL.y, PANEL.w, PANEL.h, { alpha: 0.82 });
      if (!r) return;
      const it = H.ITEMS[r.to], src = scr.srcFor(r), max = ui.synthMax(scr.tab, r, src), needs = ui.synthNeeds(scr.tab, r, src);
      if (id === 'food') ui.synthFoodTop(c, r);
      else {
        ui.text(ui.fitText(it.name, 16, PANEL.w - 40, true), PANEL.mid, 56, { align: 'center', size: 16, bold: true, serif: true, col: C.gold });
        ui.text('В наличии: ' + (inv[r.to] || 0), PANEL.mid, 78, { align: 'center', size: 11, col: C.sub });
        ui.synthMedal(c, r.to, PANEL.mid, 146, 46);
      }
      ui.synthDivider(c, 210, 'Необходимые материалы');
      if (needs.length) {
        const x0 = PANEL.mid - (needs.length * 46 + (needs.length - 1) * 22) / 2;
        needs.forEach(([m, n], i) => ui.synthNeedCell(c, m, inv[m] || 0, n * scr.qty, x0 + i * 68, 230));
        if (id === 'swap') ui.hit(PANEL.mid - 23, 230, 46, 46, () => scr.openPicker());
      } else {
        const x = PANEL.mid - 23, y = 230;
        c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x, y, 46, 46);
        c.strokeStyle = C.brassDk; c.setLineDash([3, 3]); c.strokeRect(x + 0.5, y + 0.5, 45, 45); c.setLineDash([]);
        c.fillStyle = C.brassHi; c.fillRect(x + 22, y + 13, 2, 20); c.fillRect(x + 13, y + 22, 20, 2);
        ui.hit(x, y, 46, 46, () => scr.openPicker());
      }
      if (max >= 1) ui.synthSlider(c, scr, max);
      else ui.synthPlaque(c, 322, id === 'swap' && !src ? 'Пожалуйста, добавьте материалы' : r.known === false ? 'Рецепт не изучен' : 'Не хватает материалов');
      if (id === 'swap') {
        ui.button(PANEL.x + 16, 366, 172, 26, 'Автодобавление', () => scr.autoAdd(), { size: 11 });
        ui.button(PANEL.x + PANEL.w - 188, 366, 172, 26, 'Синтезировать', () => scr.key('ok'), { size: 11, icon: 'synth', disabled: max < 1 });
      } else ui.button(PANEL.mid - 100, 366, 200, 26, 'Синтезировать', () => scr.key('ok'), { size: 11, icon: 'synth', disabled: max < 1 });
      const lack = needs.find(([m, n]) => (inv[m] || 0) < n * scr.qty);
      const where = r.known === false ? H.recipeWhere(r.to) : id === 'food' ? (lack ? H.ITEMS[lack[0]].name + ': ' + ui.traceSource(lack[0]) : '') : 'Где взять: ' + ui.traceSource(r.to);
      ui.wrap(where, PANEL.w - 40, 9).slice(0, 2).forEach((l, i) => ui.text(l, PANEL.x + 20, 404 + i * 12, { size: 9, col: C.dim }));
    },

    relicSets() { return H.CAVERN_SETS.concat(H.PLANAR_SETS); },

    relicSlots(set) { return H.RELIC_SETS[set].planar ? H.PLANAR_SLOTS : H.CAVERN_SLOTS; },

    relicCellPos(i) {
      const nc = H.CAVERN_SETS.length, planar = i >= nc, j = planar ? i - nc : i;
      return { x: GRID.x + (j % GRID.cols) * (GRID.cw + GRID.gap), y: (planar ? RELIC_GRID.planarY : RELIC_GRID.cavernY) + Math.floor(j / GRID.cols) * RELIC_GRID.pitch };
    },

    relicHeader(c, y, label) {
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(20, y, 198, 16);
      this.diamond(28, y + 8, 3.5, '#e8a040', '#1a1208');
      this.text(label, 38, y + 2, { size: 11, col: C.cream });
    },

    synthRelicGrid(c, scr) {
      const ui = this, sets = ui.relicSets();
      ui.win(12, 44, 214, 404, { alpha: 0.88, corners: false });
      ui.relicHeader(c, RELIC_GRID.cavernY - 20, 'Пещерные реликвии');
      ui.relicHeader(c, RELIC_GRID.planarY - 20, 'Планарные украшения');
      sets.forEach((set, i) => {
        const { x, y } = ui.relicCellPos(i), slot = ui.relicSlots(set)[0].key, on = i === scr.rsel;
        G.rarityCell(c, x, y, GRID.cw, RELIC_GRID.ch, 4);
        G.itemIcon(c, 'relic:' + slot, x + 9, y + 3, 40, set);
        ui.text('★★★★', x + GRID.cw / 2, y + RELIC_GRID.ch - 13, { align: 'center', size: 8, col: '#ffe08a' });
        if (on) { c.strokeStyle = scr.rfocus === 'grid' ? C.brassHi : C.brass; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, GRID.cw + 2, RELIC_GRID.ch + 2); c.lineWidth = 1; }
        ui.hit(x, y, GRID.cw, RELIC_GRID.ch, () => { if (scr.rsel !== i) { scr.rsel = i; scr.rslot = 0; ui.sfx('select'); } scr.rfocus = 'grid'; });
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

    synthRelicPanel(c, scr) {
      const ui = this, g = this.game, inv = g.state.inv.items, set = ui.relicSets()[scr.rsel], def = H.RELIC_SETS[set], slots = ui.relicSlots(set);
      scr.rslot = Math.min(scr.rslot, slots.length - 1);
      ui.win(PANEL.x, PANEL.y, PANEL.w, PANEL.h, { alpha: 0.82 });
      ui.relicMedal(c, set, slots[scr.rslot].key, 316, 124, 40);
      const x = 372, w = PANEL.x + PANEL.w - 16 - x;
      ui.text(ui.fitText(def.name, 15, w, true), x, 58, { size: 15, bold: true, serif: true, col: C.gold });
      c.fillStyle = C.brassDk; c.fillRect(x, 80, w, 1);
      const lines = def.planar ? ui.wrap(def.text || def.short, w, 10) : ui.wrap('2 шт.: ' + ui.setBonusText(set, 2) + '.', w, 10).concat(ui.wrap('4 шт.: ' + ui.setBonusText(set, 4) + '.', w, 10));
      lines.slice(0, 6).forEach((l, i) => ui.text(l, x, 88 + i * 13, { size: 10, col: C.cream }));
      ui.synthDivider(c, 190, 'Выберите предмет для синтеза');
      const x0 = PANEL.mid - (slots.length - 1) * 40;
      slots.forEach((sl, i) => {
        const cx = x0 + i * 80, cy = 236, on = i === scr.rslot, focus = on && scr.rfocus === 'slot';
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
      ui.text('Стоимость: ' + H.RELIC_CRAFT.cost + ' Обломков Реликвии', PANEL.mid, 296, { align: 'center', size: 11, col: can ? C.cream : C.bad });
      ui.text('Основную характеристику выбирает Самомоделирующаяся смола.', PANEL.mid, 312, { align: 'center', size: 9, col: C.dim });
      ui.button(PANEL.mid - 100, 332, 200, 26, 'Синтезировать', () => ui.openRelicCraft(scr), { size: 11, icon: 'synth', disabled: !can });
      const left = g.resinLeft(), ok = left > 0 && have >= H.RELIC_CRAFT.resinCost;
      ui.button(PANEL.x + 16, 372, 230, 22, 'Смола за ' + H.RELIC_CRAFT.resinCost + ' Обломков', () => scr.buyResin(), { size: 10, disabled: !ok });
      ui.text('В этом часу: ' + left + '/' + H.RELIC_CRAFT.resinHour, PANEL.x + PANEL.w - 16, 377, { align: 'right', size: 10, col: left ? C.sub : C.bad });
      ui.wrap('Обломки дают расщеплённые реликвии: Инвентарь, вкладка «Реликвии», X.', PANEL.w - 40, 9).slice(0, 2).forEach((l, i) => ui.text(l, PANEL.x + 20, 404 + i * 12, { size: 9, col: C.dim }));
    },

    openRelicCraft(scr) {
      const ui = this, g = this.game, set = ui.relicSets()[scr.rsel], def = H.RELIC_SETS[set], slot = ui.relicSlots(set)[scr.rslot];
      if ((g.state.inv.items.remains || 0) < H.RELIC_CRAFT.cost) { ui.sfx('deny'); ui.toast('Нужно ' + H.RELIC_CRAFT.cost + ' Обломков Реликвии. Их дают расщеплённые реликвии.'); return; }
      const rows = [null].concat(slot.mains), name = def.pieces ? def.pieces[slot.key] : def.name + ': ' + slot.name.toLowerCase();
      this.push({
        sel: scr.useResin && (g.state.inv.items.resin || 0) > 0 ? 1 : 0, sc: { top: 0 },
        draw(c) {
          const inv = g.state.inv.items, vis = 8, rh = 20, x = W / 2 - 180, h = 134 + Math.min(vis, rows.length) * rh;
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
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
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
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
      g.recipeSync();
      this.push({
        full: true, tab: tab == null ? 1 : tab, sel: 0, qty: 1, src: null, filter: false, sc: { top: 0 },
        rsel: 0, rslot: 0, rfocus: 'grid', useResin: !!o.resin,
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
        setTab(t) { this.tab = (t + TABS.length) % TABS.length; this.sel = 0; this.qty = 1; this.src = null; this.sc = { top: 0 }; this.rfocus = 'grid'; ui.sfx('select'); },
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
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(4,6,20,0.5)'; c.fillRect(0, 0, W, HGT);
          ui.synthHeader(c, this);
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          const lock = ui.synthLock(this.tab);
          if (lock) { ui.synthLockedBody(c, lock); ui.hints([['Q/E', 'Раздел'], ['Esc', 'Назад']], 12, HGT - 18); return; }
          if (TABS[this.tab].id === 'relic') {
            const inv = g.state.inv.items;
            ui.money(494, 14, 'remains', inv.remains || 0);
            ui.money(560, 14, 'resin', inv.resin || 0);
            ui.synthRelicGrid(c, this);
            ui.synthRelicPanel(c, this);
            ui.hints(this.rfocus === 'slot' ? [['Q/E', 'Раздел'], ['←→', 'Слот'], ['Enter', 'Синтез'], ['R', 'Смола'], ['Esc', 'К наборам']] : [['Q/E', 'Раздел'], ['←↑↓→', 'Набор'], ['Enter', 'Слоты'], ['R', 'Смола'], ['Esc', 'Назад']], 12, HGT - 18);
            return;
          }
          const rows = this.rows();
          this.sel = Math.max(0, Math.min(this.sel, rows.length - 1));
          this.qty = Math.max(1, Math.min(this.qty, Math.max(1, this.maxNow())));
          ui.synthGrid(c, this, rows);
          ui.synthPanel(c, this, rows[this.sel]);
          const swap = TABS[this.tab].id === 'swap';
          ui.hints([['Q/E', 'Раздел'], ['←↑↓→', 'Выбор'], ['A/D', 'Количество'], ['Enter', swap && !this.srcFor(rows[this.sel] || {}) ? 'Добавить' : 'Синтез']].concat(swap ? [['Tab', 'Материал'], ['R', 'Авто']] : [], [['F', 'Фильтр'], ['Esc', 'Назад']]), 12, HGT - 18);
        },
        key(k, code) {
          if (code === 'KeyQ' || code === 'KeyE') { this.setTab(this.tab + (code === 'KeyQ' ? -1 : 1)); return; }
          if (TABS[this.tab].id === 'relic' && !ui.synthLock(this.tab) && ui.synthRelicKey(this, k, code)) return;
          if (k === 'back') { ui.pop(); if (close) close(); return; }
          if (ui.synthLock(this.tab)) return;
          if (code === 'KeyF') { this.toggleFilter(); return; }
          if (code === 'KeyA' || code === 'Minus' || code === 'NumpadSubtract') { this.setQty(this.qty - 1); return; }
          if (code === 'KeyD' || code === 'Equal' || code === 'NumpadAdd') { this.setQty(this.qty + 1); return; }
          if (code === 'Home') { this.setQty(1); return; }
          if (code === 'End') { this.setQty(this.maxNow()); return; }
          const swap = TABS[this.tab].id === 'swap';
          if (swap && code === 'Tab') { this.openPicker(); return; }
          if (swap && code === 'KeyR') { this.autoAdd(); return; }
          const rows = this.rows(), n = rows.length;
          if (!n) return;
          const mv = { left: -1, right: 1, up: -GRID.cols, down: GRID.cols }[k];
          if (mv) { this.pick(Math.max(0, Math.min(n - 1, this.sel + mv))); return; }
          if (k !== 'ok') return;
          const r = rows[this.sel], src = this.srcFor(r);
          if (swap && !src) { this.openPicker(); return; }
          if (r.known === false) { ui.sfx('deny'); ui.toast('Рецепт не изучен. ' + H.recipeWhere(r.to)); return; }
          const food = TABS[this.tab].id === 'food';
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
