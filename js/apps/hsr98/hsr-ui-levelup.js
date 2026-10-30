(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const fmt = H.fmt;
  const P = { x: 366, y: 42, w: 266, h: 412 };
  const SLOT = { size: 58, step: 66, y: P.y + 158 };
  const STATS = [['hp', 'HP'], ['atk', 'Атака'], ['def', 'Защита']];

  Object.assign(H.UI.prototype, {
    drawUpPanel(c, st) {
      const { x, y, w, h } = P, lx = x + 14, rx = x + w - 14;
      this.win(x, y, w, h, { alpha: 0.9 });
      if (st.asc) {
        const gw = 54, ax = lx + 4, bx = rx - gw + 4;
        this.ascGems(c, ax, y + 18, st.asc.from, { r: 3.5, step: 9 });
        this.text('»', x + w / 2, y + 10, { size: 14, bold: true, align: 'center', col: C.gold });
        this.ascGems(c, bx, y + 18, st.asc.to, { r: 3.5, step: 9 });
        this.text('Ур. ' + st.lvl + '/' + st.asc.capFrom, lx, y + 30, { size: 14, bold: true, serif: true, col: C.gold });
        this.text('Ур. ' + st.lvl + '/' + st.asc.capTo, rx, y + 30, { size: 14, bold: true, serif: true, align: 'right', col: C.ok });
      } else {
        this.text('Ур. ' + st.lvl, lx, y + 12, { size: 18, bold: true, serif: true, col: C.gold });
        const mx = lx + this.measure('Ур. ' + st.lvl, 18, true, true) + 4;
        if (st.plus) this.text('+' + st.plus, mx, y + 17, { size: 13, bold: true, col: C.ok });
        else if (st.cap) this.text('/' + st.cap, mx, y + 18, { size: 11, col: C.dim });
        if (st.gain) this.text('+' + fmt(st.gain), rx, y + 12, { size: 11, bold: true, align: 'right', col: C.ok });
        this.text(st.expText, rx, y + 28, { size: 9, align: 'right', col: C.sub });
        if (st.arrows) {
          this.button(lx + 106, y + 13, 18, 18, '◄', st.arrows[0], { size: 9, disabled: !st.arrows[2] });
          this.button(lx + 128, y + 13, 18, 18, '►', st.arrows[1], { size: 9, disabled: !st.arrows[3] });
        }
        if (st.gems) {
          this.ascGems(c, lx + 4, y + 36, st.gems[0], { r: 2.5, step: 7 });
          this.text('»', lx + 50, y + 29, { size: 10, bold: true, col: C.gold });
          this.ascGems(c, lx + 66, y + 36, st.gems[1], { r: 2.5, step: 7 });
        }
        this.rail(lx, y + 46, w - 28, st.frac);
        if (st.gain) {
          const to = st.plus ? 1 : st.fracTo, x0 = lx + Math.round(st.frac * (w - 28)), x1 = lx + Math.round(to * (w - 28));
          c.fillStyle = 'rgba(140,240,170,0.7)'; c.fillRect(x0, y + 45, Math.max(1, x1 - x0), 3);
        }
      }
      STATS.forEach(([key, name], i) => {
        const ry = y + 60 + i * 23, a = st.now[key], b = st.then[key];
        if (i % 2 === 0) { c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(x + 8, ry - 3, w - 16, 23); }
        G.statIcon(c, key, lx, ry + 1, 12, '#c8d0f0');
        this.text(name, lx + 18, ry, { size: 12, col: C.sub });
        if (b !== a) {
          this.text(fmt(a), rx - 74, ry, { size: 12, bold: true, align: 'right' });
          this.text('→', rx - 66, ry, { size: 11, col: C.sub });
          this.text(fmt(b) + ' ▲', rx, ry, { size: 12, bold: true, align: 'right', col: C.ok });
        } else this.text(fmt(a), rx, ry, { size: 12, bold: true, align: 'right' });
      });
      this.text('Материалы', lx, y + 136, { size: 11, bold: true, serif: true, col: C.gold });
      c.fillStyle = C.brassDk; c.fillRect(lx + 68, y + 143, st.toggle ? 30 : w - 96, 1);
      if (st.toggle) {
        this.text('Быстрое повышение', rx - 38, y + 137, { size: 9, align: 'right', col: C.sub });
        this.domainToggle(c, rx - 32, y + 134, st.toggle.on);
        this.hit(rx - 130, y + 130, 132, 20, st.toggle.fn);
      }
      if (st.small) {
        st.slots.slice(0, 10).forEach((sl, i) => {
          const sx = lx + (i % 5) * 46, sy = y + 154 + Math.floor(i / 5) * 58;
          G.rarityCell(c, sx, sy, 42, 42, H.ITEMS[sl.id] ? H.ITEMS[sl.id].rar : 3);
          G.itemIcon(c, sl.id, sx + 3, sy + 2, 36);
          this.text(H.fmt(sl.have) + '/' + H.fmt(sl.use), sx + 21, sy + 44, { size: 8, bold: true, align: 'center', col: sl.bad ? C.bad : C.cream });
          this.hit(sx, sy, 42, 42, () => st.onSlot(i));
        });
        if (st.pill) this.text(st.pill, x + w / 2, y + 276, { size: 10, bold: true, align: 'center', col: C.gold });
        if (st.note) this.wrap(st.note, w - 28, 10).slice(0, 2).forEach((l, i) => this.text(l, lx, y + 292 + i * 12, { size: 10, col: C.bad }));
        this.text('Необходимые кредиты', lx, y + 324, { size: 11, col: C.sub });
        const qw = this.measure('×' + fmt(st.credits), 12, true);
        G.itemIcon(c, 'credits', rx - qw - 19, y + 322, 16);
        this.text('×' + fmt(st.credits), rx, y + 324, { size: 12, bold: true, align: 'right', col: st.creditsBad ? C.bad : C.cream });
        this.button(lx - 2, y + h - 56, w - 24, 34, st.btn.label, st.btn.fn, { size: 13, bold: true, active: !!st.btn.active, disabled: !!st.btn.disabled });
        return;
      }
      const sz = st.feed ? 52 : SLOT.size, stp = st.feed ? 60 : SLOT.step;
      st.slots.forEach((sl, i) => {
        const sx = lx + i * stp, on = i === st.sel;
        G.rarityCell(c, sx, SLOT.y, sz, sz, H.ITEMS[sl.id].rar);
        G.itemIcon(c, sl.id, sx + 5, SLOT.y + 3, sz - 10);
        if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(sx - 1, SLOT.y - 1, sz + 2, sz + 2); c.lineWidth = 1; }
        this.text(fmt(sl.have) + '/' + fmt(sl.use), sx + sz / 2, SLOT.y + 61, { size: 10, bold: true, align: 'center', col: sl.bad ? C.bad : sl.use ? C.gold : sl.have ? C.cream : C.dim });
        this.hit(sx, SLOT.y, sz, sz, btn => st.onSlot(i, btn === 2 ? -1 : 1));
        if (st.steppers) {
          this.button(sx, SLOT.y + 76, sz / 2 - 2, 18, '−', () => st.onSlot(i, -1), { size: 12, disabled: !sl.use });
          this.button(sx + sz / 2 + 2, SLOT.y + 76, sz / 2 - 2, 18, '+', () => st.onSlot(i, 1), { size: 12, disabled: !sl.more });
        }
      });
            if (st.feed) {
        const sx = lx + 3 * stp;
        G.rarityCell(c, sx, SLOT.y, sz, sz, st.feed.count ? 4 : 2);
        G.menuIcon(c, 'cones', sx + 10, SLOT.y + 8, sz - 20, st.feed.count ? '#fff0c0' : '#c8cce4');
        this.text(st.feed.count ? '+' + st.feed.count : 'Конусы', sx + sz / 2, SLOT.y + 61, { size: 10, bold: true, align: 'center', col: st.feed.count ? C.gold : st.feed.free ? C.cream : C.dim });
        this.hit(sx, SLOT.y, sz, sz, st.feed.fn);
        this.button(sx, SLOT.y + 76, sz, 18, st.feed.count ? fmt(st.feed.exp) : 'Выбрать', st.feed.fn, { size: 9, disabled: !st.feed.free });
      }
      const cur = st.slots[st.sel];
      const ty = st.steppers ? y + 256 : y + 236;
      if (cur) {
        this.text(this.fitText(H.ITEMS[cur.id].name, 11, w - 28, true), lx, ty, { size: 11, bold: true, col: C.cream });
        this.text(this.fitText(cur.note, 10, w - 28), lx, ty + 15, { size: 10, col: C.sub });
      }
      if (st.note) this.wrap(st.note, w - 28, 10).slice(0, 2).forEach((l, i) => this.text(l, lx, y + 288 + i * 12, { size: 10, col: C.dim }));
      if (st.lines) st.lines.slice(0, 4).forEach((l, i) => this.text(this.fitText(l, 10, w - 28), lx, y + 266 + i * 13, { size: 10, col: l.col || '#c8d8ff' }));
      this.text('Необходимые кредиты', lx, y + 324, { size: 11, col: C.sub });
      const crW = this.measure('×' + fmt(st.credits), 12, true);
      G.itemIcon(c, 'credits', rx - crW - 19, y + 322, 16);
      this.text('×' + fmt(st.credits), rx, y + 324, { size: 12, bold: true, align: 'right', col: st.creditsBad ? C.bad : C.cream });
      this.button(lx - 2, y + h - 56, w - 24, 34, st.btn.label, st.btn.fn, { size: 13, bold: true, active: !!st.btn.active, disabled: !!st.btn.disabled });
    },

    upHeader(c, title, sub) {
      this.plate(12, 10, title);
      this.closeBtn(W - 32, 10, () => this.top().key('back'));
      const s = this.game.state, w = this.measure(fmt(s.credits), 11, true) + 24;
      c.fillStyle = 'rgba(4,6,20,0.7)'; c.fillRect(W - 44 - w, 12, w + 6, 18);
      this.money(W - 41 - w, 13, 'credits', s.credits);
      if (sub) this.text(sub, 16, 34, { size: 12, bold: true, col: C.cream });
    },

    openLevelUp(k, o = {}) {
      const ui = this, g = this.game;
      const scr = this.push({
        full: true, upHero: k, picks: {}, slot: 0, fx: null, target: null, quick: g.upQuick('hero'),
        books() { return g.expBooks(); },
        heroes() { return ui.rosterKeys().filter(x => !g.state.roster[x].guest); },
        setHero(d) {
          const list = this.heroes(), i = list.indexOf(this.upHero);
          this.upHero = list[(i + d + list.length) % list.length];
          this.picks = {}; this.fx = null; this.target = null;
          ui.sfx('select');
        },
        setQuick() {
          this.quick = !this.quick;
          g.setUpQuick('hero', this.quick);
          this.target = null; this.picks = {};
          ui.sfx('select');
        },
        plan() {
          const k = this.upHero;
          if (this.target == null) this.target = g.upDefault(k);
          return g.planUp(k, this.target);
        },
        moveTarget(d) {
          const k = this.upHero, r = g.state.roster[k], to = H.clamp((this.target == null ? g.upDefault(k) : this.target) + d, r.lvl + 1, Math.max(r.lvl + 1, g.upLimit(k)));
          if (to === this.target || g.upLimit(k) <= r.lvl) { ui.sfx('deny'); return; }
          this.target = to;
          ui.sfx('select');
        },
        quickAct() {
          const k = this.upHero, p = this.plan(), inv = g.state.inv.items;
          if (p.ok) {
            const before = g.charStats(k), res = g.applyUp(k, this.target);
            if (!res) { ui.sfx('deny'); return; }
            this.target = null;
            if (res.ascTo > res.ascFrom) { ui.openAscendResult(k, { from: res.ascFrom, to: res.ascTo, cap: H.ascCap(res.ascTo), pass: res.pass }, before); return; }
            ui.sfx('levelup');
            this.fx = { t: 0.8, text: 'Уровень ' + g.state.roster[k].lvl + '!' };
            return;
          }
          if (p.target <= p.from) { ui.sfx('deny'); return; }
          if (p.short.length && g.matPlan(p.items)) { ui.openSynth(null, 1); return; }
          const miss = p.short.find(id => (inv[id] || 0) < p.items[id]);
          if (miss) { ui.upSource(k, miss); return; }
          if (p.expShort) { ui.upSource(k, 'exp3'); return; }
          if (p.creditsShort) ui.upNoCredits();
        },
        quickItem() {
          const k = this.upHero, inv = g.state.inv.items, info = g.ascInfo(k);
          if (this.quick) { const p = this.plan(); return p.short[0] || (p.expShort ? 'exp3' : p.creditsShort ? 'credits' : null); }
          if (info.atCap && info.asc < 6) return info.short[0] || (info.why === 'credits' ? 'credits' : null);
          return (inv.exp3 || 0) < 1 ? 'exp3' : null;
        },
        quickGet() {
          const k = this.upHero, id = this.quickItem();
          if (!id) { ui.sfx('deny'); ui.toast('Сейчас всего хватает.'); return; }
          if (ui.traceQuickRow(id)) { ui.traceQuick(k, id); return; }
          if (id === 'credits') { ui.upNoCredits(); return; }
          ui.upSource(k, id);
        },
        drawQuick(c, k, r) {
          const s = g.state, p = this.plan(), now = g.charStats(k), shown = p.ok ? p.to : p.target, then = p.target > r.lvl ? g.statsAt(k, shown, p.ascTo) : now, need = H.expToNext(r.lvl), inv = s.inv.items, lim = g.upLimit(k);
          const reach = g.upReach(k), books = g.expBooks().filter(b => p.books[b.id]);
          const slots = books.map(b => ({ id: b.id, have: b.have, use: p.books[b.id] })).concat(Object.entries(p.items).map(([id, n]) => ({ id, have: inv[id] || 0, use: n, bad: (inv[id] || 0) < n })));
          const synthable = p.short.length > 0 && !!g.matPlan(p.items);
          const btn = lim <= r.lvl ? { label: 'Нужен Уровень Освоения ' + H.ASC.tl[g.ascOf(k) + 1], disabled: true }
            : p.ok ? { label: 'Быстрое повышение уровня', active: true, fn: () => this.quickAct() }
              : synthable ? { label: 'Синтез материалов', fn: () => this.quickAct() }
                : p.short.length || p.expShort ? { label: 'Где взять', fn: () => this.quickAct() }
                  : { label: 'Не хватает кредитов', fn: () => this.quickAct() };
          ui.drawUpPanel(c, {
            lvl: r.lvl, plus: Math.max(0, shown - r.lvl), gain: p.ok ? p.sum : p.need, frac: r.lvl >= H.ascCap(p.ascFrom) ? 1 : r.exp / need, fracTo: p.ok ? p.exp / H.expToNext(p.to) : 1, expText: fmt(r.exp) + '/' + fmt(need), now, then, small: true,
            gems: p.ascTo > p.ascFrom ? [p.ascFrom, p.ascTo] : null, arrows: [() => this.moveTarget(-1), () => this.moveTarget(1), p.target > r.lvl + 1, p.target < lim],
            toggle: { on: true, fn: () => this.setQuick() }, slots, onSlot: i => ui.upSource(k, slots[i].id),
            pill: reach > r.lvl ? 'Можно повысить до ур. ' + reach : 'Запасов не хватает даже на +1',
            note: p.expShort ? 'Не хватает опыта: ' + fmt(p.expShort) : null,
            credits: p.credits, creditsBad: p.creditsShort > 0, btn
          });
          ui.hints([['←→', 'Цель ±1'], ['↑↓', 'Цель ±10'], ['T', 'Тумблер'], ['Q/E', 'Герой'], ['R', 'Получить'], ['Enter', 'Повысить']], 14, HGT - 18);
        },
        gain() { return this.books().reduce((a, b) => a + (this.picks[b.id] || 0) * b.exp, 0); },
        adjust(i, d) {
          const b = this.books()[i];
          this.slot = i;
          const n = this.picks[b.id] || 0, need = g.expToCap(this.upHero), to = n + d;
          if (to < 0 || to > b.have || (d > 0 && this.gain() >= need)) { ui.sfx('deny'); return; }
          this.picks[b.id] = to;
          ui.sfx('select');
        },
        apply() {
          const k = this.upHero, res = g.useExp(k, this.picks);
          if (!res) { ui.sfx('deny'); return; }
          ui.sfx(res.to > res.from ? 'levelup' : 'confirm');
          this.fx = { t: 0.8, text: res.to > res.from ? 'Уровень ' + res.to + '!' : '+' + fmt(res.gain) + ' опыта' };
          this.picks = {};
        },
        act() {
          const k = this.upHero, r = g.state.roster[k], gain = this.gain(), info = g.ascInfo(k);
          if (this.quick && r.lvl < H.MAX_LVL) { this.quickAct(); return; }
          if (info.atCap && info.asc < 6) { this.ascAct(k, info); return; }
          if (r.lvl >= g.levelCap(k)) { ui.sfx('deny'); return; }
          if (!gain) { ui.sfx('deny'); ui.toast('Выберите книги опыта.'); return; }
          if (g.state.credits < g.expCredits(gain)) { ui.upNoCredits(); return; }
          this.apply();
        },
        tick(dt) { if (this.fx) { this.fx.t -= dt; if (this.fx.t <= 0) this.fx = null; } },
        draw(c) {
          const k = this.upHero, s = g.state, r = s.roster[k], kitId = g.kitOf(k), kit = H.CHARS[kitId], look = G.lookOf(kitId, g);
          ui.fullBg(c, 392);
          ui.platform(c, 186, 404, 130);
          G.drawBust(c, look, 26, 66, 5);
          const info = g.ascInfo(k), quickMode = this.quick && r.lvl < H.MAX_LVL, ascMode = info.atCap && info.asc < 6 && !quickMode;
          ui.upHeader(c, ascMode ? 'Возвышение' : 'Повышение уровня', null);
          G.pathIcon(c, kit.path, 16, 34, 14);
          ui.text(H.PATHS[kit.path].name + ' / ' + (k === 'trail' ? s.name : kit.name), 34, 35, { size: 12, bold: true, col: C.cream });
          const name = k === 'trail' ? s.name : kit.name, nw = ui.measure(name, 16, true, true);
          c.fillStyle = 'rgba(4,6,20,0.82)'; c.fillRect(0, 386, 366, 42);
          c.fillStyle = C.brassDk; c.fillRect(0, 386, 366, 1);
          ui.text(name, 186 - nw / 2, 392, { size: 16, bold: true, serif: true, col: C.gold });
          ui.text('★'.repeat(kit.rarity), 186, 411, { size: 11, align: 'center', col: G.RARITY[kit.rarity] });
          ui.keycap(40, 400, 'Q'); ui.hit(30, 390, 34, 34, () => this.setHero(-1));
          ui.keycap(322, 400, 'E'); ui.hit(312, 390, 34, 34, () => this.setHero(1));
          ui.button(14, 434, 170, 22, 'Быстрое получение', () => this.quickGet(), { size: 11, disabled: !this.quickItem() });
          ui.keycap(190, 438, 'R');
          if (quickMode) { this.drawQuick(c, k, r); this.drawBustExtras(); return; }
          if (ascMode) { this.drawAscend(c, k, r, info); this.drawBustExtras(); return; }
          const cap = g.levelCap(k), atCap = r.lvl >= cap, gain = this.gain(), to = g.expAfter(k, gain), cost = g.expCredits(gain), books = this.books();
          const need = H.expToNext(r.lvl), now = g.charStats(k), then = to.lvl === r.lvl ? now : g.statsAt(k, to.lvl);
          if (this.slot >= books.length) this.slot = 0;
          const left = g.expToCap(k), short = s.credits < cost;
          const btn = atCap ? { label: r.lvl >= H.MAX_LVL ? 'Максимальный уровень' : 'Нужно возвышение', disabled: true }
            : !gain ? { label: 'Повысить уровень', disabled: true }
              : short ? { label: 'Не хватает кредитов', fn: () => this.act() }
                : { label: 'Повысить уровень', active: true, fn: () => this.act() };
          ui.drawUpPanel(c, {
            lvl: r.lvl, cap: H.ascCap(g.ascOf(k)), plus: to.lvl - r.lvl, gain, frac: atCap ? 1 : r.exp / need, fracTo: to.exp / need,
            expText: atCap ? 'Опыт на пределе' : fmt(r.exp) + '/' + fmt(need), now, then, sel: this.slot, steppers: true,
            slots: books.map(b => ({ id: b.id, have: b.have, use: this.picks[b.id] || 0, more: (this.picks[b.id] || 0) < b.have && gain < left, note: '+' + fmt(b.exp) + ' опыта за штуку' })),
            note: books.every(b => !b.have) ? 'Книг нет. Они в сундуках, магазинах и Бутоне воспоминаний.' : gain && !left ? '' : null,
            credits: cost, creditsBad: short, onSlot: (i, d) => this.adjust(i, d), btn, toggle: { on: false, fn: () => this.setQuick() }
          });
          this.drawBustExtras();
          ui.hints([['←→', 'Книга'], ['↑↓', 'Количество'], ['Q/E', 'Герой'], ['Enter', 'Повысить'], ['Esc', 'Назад']], 14, HGT - 18);
        },
        drawBustExtras() { if (this.fx) ui.text(this.fx.text, 186, 356 - (0.8 - this.fx.t) * 24, { size: 16, bold: true, serif: true, align: 'center', col: C.gold }); },
        ascItems(info) { return Object.entries(info.cost.items).map(([id, n]) => ({ id, n })); },
        drawAscend(c, k, r, info) {
          const s = g.state, cost = info.cost, items = this.ascItems(info), now = g.charStats(k), then = g.statsAt(k, r.lvl, cost.to), tlBad = g.trailLevel() < cost.tl;
          if (this.slot >= items.length) this.slot = 0;
          const btn = tlBad ? { label: 'Нужен Уровень Освоения ' + cost.tl, disabled: true }
            : info.synth ? { label: 'Синтез материалов', fn: () => this.act() }
              : info.short.length ? { label: 'Где взять', fn: () => this.act() }
                : info.why === 'credits' ? { label: 'Не хватает кредитов', fn: () => this.act() }
                  : { label: 'Возвысить', active: true, fn: () => this.act() };
          const lines = g.ascUnlocks(k, cost.to);
          if (cost.to % 2 === 1) lines.push('Награда: Звёздный пропуск');
          ui.drawUpPanel(c, {
            lvl: r.lvl, asc: { from: info.asc, to: cost.to, capFrom: H.ascCap(info.asc), capTo: H.ascCap(cost.to) }, now, then, sel: this.slot, steppers: false,
            slots: items.map(it => ({ id: it.id, have: s.inv.items[it.id] || 0, use: it.n, bad: (s.inv.items[it.id] || 0) < it.n, note: ui.upSourceText(it.id) })),
            lines, credits: cost.credits, creditsBad: s.credits < cost.credits, onSlot: i => { this.slot = i; ui.upSource(k, items[i].id); }, btn, toggle: { on: false, fn: () => this.setQuick() }
          });
          ui.hints([['←→', 'Материал'], ['Q/E', 'Герой'], ['Enter', btn.label === 'Возвысить' ? 'Возвысить' : 'Подробнее'], ['Esc', 'Назад']], 14, HGT - 18);
        },
        ascAct(k, info) {
          if (g.trailLevel() < info.cost.tl) { ui.sfx('deny'); ui.toast('Нужен Уровень Освоения ' + info.cost.tl + '.'); return; }
          if (info.synth) { ui.openSynth(null, 1); return; }
          if (info.short.length) { ui.upSource(k, info.short[0]); return; }
          if (info.why === 'credits') { ui.upNoCredits(); return; }
          const before = g.charStats(k), res = g.ascend(k);
          if (!res) { ui.sfx('deny'); return; }
          this.picks = {}; this.slot = 0;
          ui.openAscendResult(k, res, before);
        },
        key(kk, code) {
          this.fx = null;
          if (code === 'KeyQ') return this.setHero(-1);
          if (code === 'KeyE') return this.setHero(1);
          if (kk === 'back') { ui.pop(); return; }
          if (code === 'KeyT') return this.setQuick();
          if (code === 'KeyR') return this.quickGet();
          if (this.quick && g.state.roster[this.upHero].lvl < H.MAX_LVL) {
            if (kk === 'left' || kk === 'right') return this.moveTarget(kk === 'left' ? -1 : 1);
            if (kk === 'up' || kk === 'down') return this.moveTarget(kk === 'down' ? -10 : 10);
            if (kk === 'ok') this.act();
            return;
          }
          const info = g.ascInfo(this.upHero), asc = info.atCap && info.asc < 6;
          const n = asc ? this.ascItems(info).length : this.books().length;
          if (asc && (kk === 'up' || kk === 'down')) return;
          if (kk === 'left' || kk === 'right') { this.slot = (this.slot + (kk === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); return; }
          if (kk === 'up') return this.adjust(this.slot, 1);
          if (kk === 'down') return this.adjust(this.slot, -1);
          if (kk === 'ok') this.act();
        }
      });
      if (o.pick) { const i = scr.books().findIndex(b => b.id === o.pick); if (i >= 0) { scr.slot = i; scr.adjust(i, 1); } }
      return scr;
    },

    upSourceText(id) {
      const g = this.game, src = g.needSource ? g.needSource(id) : null;
      return src && src.row ? src.src : this.traceSource(id);
    },

    upSource(k, id) {
      const ui = this, g = this.game, it = H.ITEMS[id], quick = ui.traceQuickRow ? ui.traceQuickRow(id) : null;
      this.push({
        draw(c) {
          const x = W / 2 - 170, y = 150, w = 340, h = 160, have = g.state.inv.items[id] || 0;
          ui.win(x, y, w, h, { title: 'Где взять' });
          ui.closeBtn(x + w - 30, y + 8, () => ui.pop());
          G.rarityCell(c, x + 16, y + 24, 56, 56, it.rar);
          G.itemIcon(c, id, x + 20, y + 26, 48);
          ui.wrap(it.name, w - 104, 12, true).slice(0, 2).forEach((l, i) => ui.text(l, x + 84, y + 24 + i * 15, { size: 12, bold: true, col: C.gold }));
          ui.text('В наличии: ' + fmt(have), x + 84, y + 62, { size: 11, col: C.sub });
          ui.wrap(ui.upSourceText(id) || 'Источник появится позже.', w - 32, 11).slice(0, 2).forEach((l, i) => ui.text(l, x + 16, y + 88 + i * 14, { size: 11, col: C.cream }));
          if (quick) ui.button(x + 16, y + h - 36, 160, 26, 'Быстрое получение', () => { ui.screens.pop(); if (k) ui.traceQuick(k, id); else ui.upQuickFarm(id); }, { size: 11 });
          ui.button(x + w - 126, y + h - 36, 110, 26, 'Закрыть', () => ui.pop(), { size: 11, active: !quick });
        },
        key(kk) { if (kk === 'back' || kk === 'ok') ui.pop(); }
      });
    },

    openAscendResult(k, res, before) {
      const ui = this, g = this.game, lines = [];
      for (let p = res.from + 1; p <= res.to; p++) lines.push(...g.ascUnlocks(k, p));
      const hasNode = lines.some(l => /Доп\. способность|Следы характеристик/.test(l));
      if (res.pass) lines.push(res.pass === true || res.pass === 1 ? 'Получен Звёздный пропуск' : 'Получено Звёздных пропусков: ' + res.pass);
      if (lines.length > 4) lines.splice(0, lines.length - 4);
      ui.sfx('levelup');
      this.push({
        t: 0,
        tick(dt) { this.t += dt; },
        draw(c) {
          const x = W / 2 - 200, y = 92, w = 400, h = 284, kit = H.CHARS[g.kitOf(k)], now = g.charStats(k), lit = this.t > 0.45 ? res.to : res.from;
          c.fillStyle = 'rgba(2,3,12,0.66)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Возвышение завершено' });
          ui.portraitCard(c, G.lookOf(g.kitOf(k), g), x + 18, y + 24, 64, { elem: kit.elem });
          ui.text(ui.shortName(k), x + 96, y + 24, { size: 15, bold: true, serif: true, col: C.gold });
          ui.ascGems(c, x + 100, y + 54, lit, { r: 5, step: 14 });
          if (this.t > 0.35 && this.t < 0.75) { const a = 1 - Math.abs(this.t - 0.55) / 0.2; c.fillStyle = 'rgba(255,240,180,' + Math.max(0, a) + ')'; c.beginPath(); c.arc(x + 100 + (res.to - 1) * 14, y + 54, 9, 0, Math.PI * 2); c.fill(); }
          ui.text('Предел уровня: ' + H.ascCap(res.from) + ' → ' + res.cap, x + 96, y + 68, { size: 12, bold: true, col: C.cream });
          [['hp', 'HP'], ['atk', 'Атака'], ['def', 'Защита']].forEach(([key, name], i) => {
            const ry = y + 100 + i * 21;
            G.statIcon(c, key, x + 20, ry + 1, 12, '#c8d0f0');
            ui.text(name, x + 38, ry, { size: 12, col: C.sub });
            ui.text(fmt(before[key]) + ' → ' + fmt(now[key]), x + w - 20, ry, { size: 12, bold: true, align: 'right', col: C.ok });
          });
          c.fillStyle = C.brassDk; c.fillRect(x + 16, y + 166, w - 32, 1);
          lines.slice(0, 4).forEach((l, i) => ui.text(ui.fitText(l, 11, w - 40), x + 20, y + 172 + i * 15, { size: 11, col: C.cream }));
          ui.button(x + w / 2 - 150, y + h - 42, 140, 28, 'Дальше', () => ui.pop(), { size: 12, active: true });
          ui.button(x + w / 2 + 10, y + h - 42, 140, 28, 'К Следам', () => this.toTraces(), { size: 12, disabled: !hasNode });
        },
        toTraces() {
          if (!hasNode) { ui.sfx('deny'); return; }
          ui.screens.pop();
          ui.openChars(k);
          ui.top().sec = 1;
          ui.sfx('select');
        },
        key(kk, code) {
          if (kk === 'ok' || kk === 'back') { ui.pop(); return; }
          if (code === 'KeyT') this.toTraces();
        }
      });
    },

    openAscNotice() {
      const ui = this, g = this.game;
      g.state.flags.asc_note = true;
      const k = g.state.party.slice(0, 4).find(x => g.state.roster[x] && g.state.roster[x].lvl >= g.levelCap(x)) || g.state.party[0];
      this.push({
        draw(c) {
          const x = W / 2 - 210, y = 130, w = 420, h = 200;
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Предел уровня' });
          ui.portraitCard(c, G.lookOf(g.kitOf(k), g), x + 18, y + 26, 64, { elem: H.CHARS[g.kitOf(k)].elem });
          ui.wrap(ui.shortName(k) + ' достигает предела уровня. Новый опыт за бои больше не идёт, пока героя не возвысить.', w - 110, 12).forEach((l, i) => ui.text(l, x + 96, y + 26 + i * 16, { size: 12, col: C.cream }));
          ui.wrap('Возвышение стоит кредитов и материалов врагов, а с третьей фазы и материалов Застойных теней. Оно поднимает предел, характеристики и уровни Следов.', w - 36, 11).forEach((l, i) => ui.text(l, x + 18, y + 100 + i * 14, { size: 11, col: C.sub }));
          ui.button(x + w / 2 - 150, y + h - 42, 140, 28, 'Возвысить', () => { ui.screens.pop(); ui.openLevelUp(k); }, { size: 12, active: true });
          ui.button(x + w / 2 + 10, y + h - 42, 140, 28, 'Позже', () => ui.pop(), { size: 12 });
        },
        key(kk) {
          if (kk === 'ok') { ui.screens.pop(); ui.openLevelUp(k); return; }
          if (kk === 'back') ui.pop();
        }
      });
    },

    upQuickFarm(id) {
      const row = this.traceQuickRow(id), g = this.game;
      if (!row) { this.sfx('deny'); this.toast('Это нельзя получить за Топливные купоны.'); return; }
      this.openQuickFarm(row.id, Math.max(0, g.tiersOpen().lastIndexOf(true)));
    },

    upNoCredits() {
      const ui = this, g = this.game;
      ui.sfx('deny');
      if (!g.state.flags.express_intro) { ui.toast('Не хватает кредитов.'); return; }
      ui.toast('Не хватает кредитов. Их приносит Бутон сокровищ.');
      ui.openIpg('index');
      const s = ui.top(), cat = H.GUIDE_INDEX.findIndex(x => x.id === 'golden');
      if (cat >= 0) s.cat = cat;
    }
  });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
