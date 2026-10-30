(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const fmt = H.fmt;
  const NAV = [{ id: 'info', icon: 'info' }, { id: 'up', icon: 'cones' }, { id: 'sup', icon: 'warp', label: 'Наложить' }];

  Object.assign(H.UI.prototype, {
    openConeUp(uid, o = {}) {
      const ui = this, g = this.game;
      return this.push({
        full: true, coneUid: uid, picks: {}, slot: 0, fx: null, target: null, quick: g.upQuick('cone'), tab: 1, feed: [], supSel: 0, supSc: { top: 0 },
        cone() { return g.coneFix(g.coneOf(this.coneUid)); },
        list() { return o.only ? [this.coneUid] : g.state.inv.cones.map(x => x.uid); },
        holder() { return Object.keys(g.state.roster).find(k => g.state.roster[k].cone === this.coneUid) || null; },
        setCone(d) {
          const list = this.list(), i = list.indexOf(this.coneUid);
          if (list.length < 2) { ui.sfx('deny'); return; }
          this.coneUid = list[(i + d + list.length) % list.length];
          this.picks = {}; this.feed = []; this.supSel = 0; this.fx = null; this.target = null; this.slot = 0;
          ui.sfx('select');
        },
        setQuick() {
          this.quick = !this.quick;
          g.setUpQuick('cone', this.quick);
          this.target = null; this.picks = {}; this.feed = [];
          ui.sfx('select');
        },
        pick(i) {
          if (NAV[i].id === 'info') { const cn = this.cone(); ui.openConeView(cn.id, cn.uid, { fromUp: true }); return; }
          this.tab = i;
          ui.sfx('select');
        },
        gain() { return g.coneBooks().reduce((a, b) => a + (this.picks[b.id] || 0) * b.exp, 0) + g.coneFeedExp(this.feed); },
        adjust(i, d) {
          const b = g.coneBooks()[i], cn = this.cone();
          this.slot = i;
          const n = this.picks[b.id] || 0, to = n + d;
          if (to < 0 || to > b.have || (d > 0 && this.gain() >= g.coneToCap(cn))) { ui.sfx('deny'); return; }
          this.picks[b.id] = to;
          ui.sfx('select');
        },
        plan() {
          const cn = this.cone();
          if (this.target == null) this.target = g.coneDefault(cn);
          return g.conePlan(cn, this.target);
        },
        moveTarget(d) {
          const cn = this.cone(), lim = g.coneLimit(cn), to = H.clamp((this.target == null ? g.coneDefault(cn) : this.target) + d, cn.lvl + 1, Math.max(cn.lvl + 1, lim));
          if (to === this.target || lim <= cn.lvl) { ui.sfx('deny'); return; }
          this.target = to;
          ui.sfx('select');
        },
        quickItem() {
          const cn = this.cone(), inv = g.state.inv.items, info = g.coneAscInfo(cn);
          if (this.quick) { const p = this.plan(); return p.short[0] || (p.expShort ? 'aether3' : p.creditsShort ? 'credits' : null); }
          if (info.atCap && info.asc < 6) return info.short[0] || (info.why === 'credits' ? 'credits' : null);
          return (inv.aether3 || 0) < 1 ? 'aether3' : null;
        },
        quickGet() {
          const id = this.quickItem();
          if (!id) { ui.sfx('deny'); ui.toast('Сейчас всего хватает.'); return; }
          if (ui.traceQuickRow(id)) { ui.upQuickFarm(id); return; }
          if (id === 'credits') { ui.upNoCredits(); return; }
          ui.upSource(null, id);
        },
        act() {
          const cn = this.cone(), info = g.coneAscInfo(cn);
          if (this.tab !== 1) { ui.sfx('deny'); return; }
          if (this.quick && cn.lvl < H.MAX_LVL) return this.quickAct(cn);
          if (info.atCap && info.asc < 6) return this.ascAct(cn, info);
          const gain = this.gain();
          if (cn.lvl >= H.MAX_LVL) { ui.sfx('deny'); return; }
          if (!gain) { ui.sfx('deny'); ui.toast('Выберите эфир.'); return; }
          if (g.state.credits < g.coneCredits(gain)) { ui.upNoCredits(); return; }
          if (g.coneFeedRisky(this.feed)) { ui.openConeFeedConfirm(this, cn); return; }
          this.spend(cn);
        },
        spend(cn) {
          const res = g.coneUseExp(cn, this.picks, this.feed);
          if (!res) { ui.sfx('deny'); return; }
          ui.sfx(res.to > res.from ? 'levelup' : 'confirm');
          this.fx = { t: 0.8, text: res.to > res.from ? 'Уровень ' + res.to + '!' : '+' + fmt(res.gain) + ' опыта' };
          this.picks = {}; this.feed = [];
        },
        pickFeed() {
          const cn = this.cone();
          if (cn.lvl >= H.ascCap(cn.asc)) { ui.sfx('deny'); return; }
          if (!g.coneFree(cn).length) { ui.sfx('deny'); ui.toast('Нет свободных конусов.'); return; }
          ui.openConeFeed(this, cn);
        },
        ascAct(cn, info) {
          if (g.trailLevel() < info.cost.tl) { ui.sfx('deny'); ui.toast('Нужен Уровень Освоения ' + info.cost.tl + '.'); return; }
          if (info.synth) { ui.openSynth(null, 1); return; }
          if (info.short.length) { ui.upSource(null, info.short[0]); return; }
          if (info.why === 'credits') { ui.upNoCredits(); return; }
          const before = g.coneStatsOf(cn), res = g.coneAscend(cn);
          if (!res) { ui.sfx('deny'); return; }
          this.slot = 0;
          ui.openConeResult(cn, res.from, res.to, before);
        },
        quickAct(cn) {
          const p = this.plan(), inv = g.state.inv.items;
          if (p.ok) {
            const before = g.coneStatsOf(cn), res = g.coneApply(cn, this.target);
            if (!res) { ui.sfx('deny'); return; }
            this.target = null;
            if (res.ascTo > res.ascFrom) { ui.openConeResult(cn, res.ascFrom, res.ascTo, before); return; }
            ui.sfx('levelup');
            this.fx = { t: 0.8, text: 'Уровень ' + cn.lvl + '!' };
            return;
          }
          if (p.target <= p.from) { ui.sfx('deny'); return; }
          if (p.short.length && g.matPlan(p.items)) { ui.openSynth(null, 1); return; }
          const miss = p.short.find(id => (inv[id] || 0) < p.items[id]);
          if (miss) { ui.upSource(null, miss); return; }
          if (p.expShort) { ui.upSource(null, 'aether3'); return; }
          if (p.creditsShort) ui.upNoCredits();
        },
        tick(dt) { if (this.fx) { this.fx.t -= dt; if (this.fx.t <= 0) this.fx = null; } },
        drawNav(c, cn) {
          const info = g.coneAscInfo(cn), upLabel = info.atCap && info.asc < 6 && !this.quick ? 'Возвысить' : 'Повысить уровень';
          NAV.forEach((n, i) => {
            const y = 70 + i * 44, on = i === this.tab, label = n.id === 'info' ? 'Подробнее' : n.id === 'up' ? upLabel : n.label;
            if (on) { const gr = c.createLinearGradient(12, 0, 170, 0); gr.addColorStop(0, 'rgba(242,220,154,0.3)'); gr.addColorStop(1, 'rgba(242,220,154,0)'); c.fillStyle = gr; c.fillRect(12, y - 4, 156, 34); c.fillStyle = C.brassHi; c.fillRect(12, y - 4, 2, 34); }
            c.fillStyle = on ? 'rgba(242,220,154,0.25)' : 'rgba(10,12,40,0.6)'; c.beginPath(); c.arc(34, y + 13, 15, 0, Math.PI * 2); c.fill();
            c.strokeStyle = on ? C.brassHi : 'rgba(154,166,208,0.5)'; c.lineWidth = 1; c.stroke();
            G.menuIcon(c, n.icon, 24, y + 3, 20, on ? '#fff0c0' : '#c8cce4');
            ui.text(label, 56, y + 6, { size: 12, bold: on, serif: on, col: on ? C.gold : C.cream });
            ui.hit(12, y - 4, 156, 34, () => this.pick(i));
          });
        },
        drawCard(c, cn) {
          const d = H.CONES[cn.id], cx = 268, cy = 196, w = 148, h = 206;
          c.save();
          c.translate(cx, cy); c.rotate(-0.07);
          G.drawConeCard(c, cn.id, -w / 2, -h / 2, w, h, { sup: cn.sup || 1 });
          c.restore();
          ui.hit(cx - w / 2, cy - h / 2, w, h, () => this.pick(0));
          const nm = ui.wrap(d.name, 196, 13, true, true).slice(0, 2), sy = 310 + nm.length * 16;
          nm.forEach((l, i) => ui.text(l, cx, 310 + i * 16, { size: 13, bold: true, serif: true, align: 'center', col: C.gold, shadow: true }));
          const pn = H.PATHS[d.path].name, stars = '★'.repeat(d.rarity), rowW = 18 + ui.measure(pn, 11) + 8 + ui.measure(stars, 11), rx0 = cx - rowW / 2;
          G.pathIcon(c, d.path, rx0, sy + 2, 14);
          ui.text(pn, rx0 + 18, sy + 3, { size: 11, col: C.sub });
          ui.text(stars, rx0 + rowW, sy + 3, { size: 11, align: 'right', col: G.RARITY[d.rarity] });
          const hk = this.holder();
          ui.text(hk ? 'Надет: ' + ui.shortName(hk) : 'Не надет', 14, 216, { size: 11, bold: true, col: hk ? C.ok : C.dim });
          ui.button(14, 234, 148, 24, 'Надеть на…', () => ui.openConeTarget(cn.uid), { size: 11, icon: 'chars' });
          if (this.list().length > 1) {
            ui.keycap(180, 380, 'Q'); ui.hit(172, 374, 30, 26, () => this.setCone(-1));
            ui.keycap(340, 380, 'E'); ui.hit(332, 374, 30, 26, () => this.setCone(1));
          }
        },
        drawSup(c, cn) {
          const d = H.CONES[cn.id], { x, y, w, h } = { x: 366, y: 42, w: 266, h: 412 }, lx = x + 14, have = cn.sup || 1;
          ui.win(x, y, w, h, { alpha: 0.9 });
          ui.text('Наложение', lx, y + 12, { size: 16, bold: true, serif: true, col: C.gold });
          for (let i = 1; i <= 5; i++) {
            const bx = lx + (i - 1) * 47, on = i === have;
            c.fillStyle = on ? C.brass : i < have ? 'rgba(242,220,154,0.3)' : 'rgba(0,0,0,0.45)'; c.fillRect(bx, y + 38, 44, 22);
            ui.text('S' + i, bx + 22, y + 42, { size: 12, bold: true, align: 'center', col: on ? '#1a1408' : i <= have ? C.cream : C.dim });
          }
          ui.text(d.skill || 'Эффект', lx, y + 74, { size: 12, bold: true, serif: true, col: C.gold });
          ui.coneLines(cn.id, have, w - 28, 11, 6).forEach((l, i) => ui.richText(l, lx, y + 92 + i * 14, { size: 11, col: C.cream }));
          const copies = g.coneCopies(cn), vis = 5, ry = y + 200;
          ui.text('Копии этого конуса', lx, ry - 18, { size: 12, bold: true, serif: true, col: C.gold });
          if (this.supSel >= copies.length) this.supSel = Math.max(0, copies.length - 1);
          const top = copies.length > vis ? ui.listTop(this.supSc, this.supSel, copies.length, vis) : 0;
          copies.slice(top, top + vis).forEach((x, j) => {
            const i = top + j, yy = ry + j * 26, on = i === this.supSel, sum = have + (x.sup || 1), okSum = sum <= 5;
            c.fillStyle = on ? 'rgba(242,220,154,0.18)' : 'rgba(255,255,255,0.04)'; c.fillRect(lx - 4, yy, w - 20, 24);
            if (on) { c.fillStyle = C.brassHi; c.fillRect(lx - 4, yy, 2, 24); }
            ui.text('Ур. ' + (x.lvl || 1) + ' · S' + (x.sup || 1), lx + 4, yy + 6, { size: 11, col: okSum ? C.cream : C.dim });
            ui.text(okSum ? 'S' + have + ' + S' + (x.sup || 1) + ' = S' + sum : 'выше S5 нельзя', lx + w - 34, yy + 6, { size: 11, bold: okSum, align: 'right', col: okSum ? C.gold : C.dim });
            ui.hit(lx - 4, yy, w - 20, 24, () => { if (this.supSel === i) this.supAct(); else { this.supSel = i; ui.sfx('select'); } });
          });
          if (copies.length > vis) ui.scrollBar(lx + w - 28, ry, vis * 26 - 2, this.supSc, copies.length, vis);
          const note = !copies.length ? (g.coneSupMode() === 'auto' ? 'Копий нет. Дубликаты накладываются сами: режим меняется в настройках.' : 'Копий нет. Получите ещё один такой конус.') : 'Надетую копию потратить нельзя.';
          ui.wrap(note, w - 28, 10).slice(0, 2).forEach((l, i) => ui.text(l, lx, y + h - 40 + i * 12, { size: 10, col: C.sub }));
        },
        supAct() {
          const cn = this.cone(), x = g.coneCopies(cn)[this.supSel];
          if (!x) { ui.sfx('deny'); return; }
          if ((cn.sup || 1) + (x.sup || 1) > 5) { ui.sfx('deny'); ui.toast('Выше S5 наложить нельзя.'); return; }
          ui.openConeMerge(cn, x);
        },
        drawQuick(c, cn) {
          const s = g.state, p = this.plan(), now = g.coneStatsOf(cn), shown = p.ok ? p.to : p.target, need = g.coneNeed(cn, cn.lvl), inv = s.inv.items, lim = g.coneLimit(cn), reach = g.coneReach(cn);
          const then = p.target > cn.lvl ? H.coneStatsAt(cn.id, shown, p.ascTo) : now, books = g.coneBooks().filter(b => p.books[b.id]);
          const slots = books.map(b => ({ id: b.id, have: b.have, use: p.books[b.id] })).concat(Object.entries(p.items).map(([id, n]) => ({ id, have: inv[id] || 0, use: n, bad: (inv[id] || 0) < n })));
          const synthable = p.short.length > 0 && !!g.matPlan(p.items), act = () => this.act();
          const btn = lim <= cn.lvl ? { label: 'Нужен Уровень Освоения ' + H.ASC.tl[cn.asc + 1], disabled: true }
            : p.ok ? { label: 'Быстрое повышение уровня', active: true, fn: act }
              : synthable ? { label: 'Синтез материалов', fn: act }
                : p.short.length || p.expShort ? { label: 'Где взять', fn: act }
                  : { label: 'Не хватает кредитов', fn: act };
          ui.drawUpPanel(c, {
            lvl: cn.lvl, plus: Math.max(0, shown - cn.lvl), gain: p.ok ? p.sum : p.need, frac: cn.lvl >= H.ascCap(p.ascFrom) ? 1 : cn.exp / need, fracTo: p.ok ? p.exp / g.coneNeed(cn, p.to) : 1, expText: fmt(cn.exp) + '/' + fmt(need), now, then, small: true,
            gems: p.ascTo > p.ascFrom ? [p.ascFrom, p.ascTo] : null, arrows: [() => this.moveTarget(-1), () => this.moveTarget(1), p.target > cn.lvl + 1, p.target < lim],
            toggle: { on: true, fn: () => this.setQuick() }, slots, onSlot: i => ui.upSource(null, slots[i].id),
            pill: reach > cn.lvl ? 'Можно повысить до ур. ' + reach : 'Запасов не хватает даже на +1',
            note: p.expShort ? 'Не хватает опыта: ' + fmt(p.expShort) : null, credits: p.credits, creditsBad: p.creditsShort > 0, btn
          });
        },
        drawAscend(c, cn, info) {
          const s = g.state, cost = info.cost, items = Object.entries(cost.items).map(([id, n]) => ({ id, n })), tlBad = g.trailLevel() < cost.tl, act = () => this.act();
          if (this.slot >= items.length) this.slot = 0;
          const btn = tlBad ? { label: 'Нужен Уровень Освоения ' + cost.tl, disabled: true }
            : info.synth ? { label: 'Синтез материалов', fn: act }
              : info.short.length ? { label: 'Где взять', fn: act }
                : info.why === 'credits' ? { label: 'Не хватает кредитов', fn: act }
                  : { label: 'Возвысить', active: true, fn: act };
          ui.drawUpPanel(c, {
            lvl: cn.lvl, asc: { from: info.asc, to: cost.to, capFrom: H.ascCap(info.asc), capTo: H.ascCap(cost.to) }, now: g.coneStatsOf(cn), then: H.coneStatsAt(cn.id, cn.lvl, cost.to), sel: this.slot, steppers: false,
            slots: items.map(it => ({ id: it.id, have: s.inv.items[it.id] || 0, use: it.n, bad: (s.inv.items[it.id] || 0) < it.n, note: ui.upSourceText(it.id) })),
            lines: ['Поднимает предел уровня и характеристики.'], credits: cost.credits, creditsBad: s.credits < cost.credits, onSlot: i => { this.slot = i; ui.upSource(null, items[i].id); }, btn, toggle: { on: false, fn: () => this.setQuick() }
          });
        },
        drawManual(c, cn) {
          const s = g.state, gain = this.gain(), to = g.coneAfter(cn, gain), need = g.coneNeed(cn, cn.lvl), cost = g.coneCredits(gain), short = s.credits < cost, books = g.coneBooks(), left = g.coneToCap(cn), now = g.coneStatsOf(cn), atMax = cn.lvl >= H.MAX_LVL;
          const btn = atMax ? { label: 'Максимальный уровень', disabled: true } : !gain ? { label: 'Повысить уровень', disabled: true } : short ? { label: 'Не хватает кредитов', fn: () => this.act() } : { label: 'Повысить уровень', active: true, fn: () => this.act() };
          ui.drawUpPanel(c, {
            lvl: cn.lvl, cap: H.ascCap(cn.asc), plus: to.lvl - cn.lvl, gain, frac: atMax ? 1 : cn.exp / need, fracTo: to.exp / need, expText: atMax ? 'Опыт на пределе' : fmt(cn.exp) + '/' + fmt(need), now, then: to.lvl === cn.lvl ? now : H.coneStatsAt(cn.id, to.lvl, cn.asc), sel: this.slot, steppers: true,
            slots: books.map(b => ({ id: b.id, have: b.have, use: this.picks[b.id] || 0, more: (this.picks[b.id] || 0) < b.have && gain < left, note: '+' + fmt(b.exp) + ' опыта за штуку' })),
            note: books.every(b => !b.have) ? 'Эфира нет. Он в Бутоне эфира, магазинах и наградах проводника.' : null,
            credits: cost, creditsBad: short, onSlot: (i, d) => this.adjust(i, d), btn, toggle: { on: false, fn: () => this.setQuick() },
            feed: { count: this.feed.length, exp: g.coneFeedExp(this.feed), free: g.coneFree(cn).length > 0, fn: () => this.pickFeed() }
          });
        },
        draw(c) {
          const cn = this.cone(), info = g.coneAscInfo(cn), quickMode = this.quick && cn.lvl < H.MAX_LVL, ascMode = info.atCap && info.asc < 6 && !quickMode;
          ui.fullBg(c, 392);
          ui.upHeader(c, 'Световой конус', null);
          this.drawNav(c, cn);
          this.drawCard(c, cn);
          if (this.tab === 2) { this.drawSup(c, cn); ui.hints([['↑↓', 'Копия'], ['Enter', 'Наложить'], ['Tab', 'Раздел'], ['Q/E', 'Конус'], ['V', 'Подробнее'], ['Esc', 'Назад']], 14, HGT - 18); return; }
          ui.button(14, 434, 170, 22, 'Быстрое получение', () => this.quickGet(), { size: 11, disabled: !this.quickItem() });
          ui.keycap(190, 438, 'R');
          if (quickMode) this.drawQuick(c, cn);
          else if (ascMode) this.drawAscend(c, cn, info);
          else this.drawManual(c, cn);
          if (this.fx) ui.text(this.fx.text, 268, 150 - (0.8 - this.fx.t) * 24, { size: 16, bold: true, serif: true, align: 'center', col: C.gold, shadow: true });
          ui.hints(quickMode ? [['←→', 'Цель ±1'], ['↑↓', 'Цель ±10'], ['T', 'Тумблер'], ['Tab', 'Раздел'], ['Q/E', 'Конус'], ['Enter', 'Повысить']] : ascMode ? [['←→', 'Материал'], ['T', 'Тумблер'], ['Tab', 'Раздел'], ['Q/E', 'Конус'], ['Enter', 'Возвысить']] : [['←→', 'Эфир'], ['↑↓', 'Количество'], ['C', 'Конусы'], ['T', 'Тумблер'], ['Tab', 'Раздел'], ['Q/E', 'Конус'], ['Enter', 'Повысить']], 14, HGT - 18);
        },
        key(kk, code) {
          this.fx = null;
          if (kk === 'back') { ui.pop(); return; }
          if (code === 'KeyQ') return this.setCone(-1);
          if (code === 'KeyE') return this.setCone(1);
          if (code === 'KeyV') return this.pick(0);
          if (code === 'Tab') { this.tab = this.tab === 1 ? 2 : 1; ui.sfx('select'); return; }
          if (this.tab === 2) {
            const n2 = g.coneCopies(this.cone()).length;
            if (n2 && (kk === 'up' || kk === 'down')) { this.supSel = (this.supSel + (kk === 'up' ? n2 - 1 : 1)) % n2; ui.sfx('select'); }
            if (kk === 'ok') this.supAct();
            return;
          }
          if (code === 'KeyT') return this.setQuick();
          if (code === 'KeyC' && !this.quick) return this.pickFeed();
          if (code === 'KeyR') return this.quickGet();
          const cn = this.cone(), info = g.coneAscInfo(cn), n = 3;
          if (this.quick && cn.lvl < H.MAX_LVL) {
            if (kk === 'left' || kk === 'right') return this.moveTarget(kk === 'left' ? -1 : 1);
            if (kk === 'up' || kk === 'down') return this.moveTarget(kk === 'down' ? -10 : 10);
            if (kk === 'ok') this.act();
            return;
          }
          if (info.atCap && info.asc < 6) {
            const m = Object.keys(info.cost.items).length;
            if (kk === 'left' || kk === 'right') { this.slot = (this.slot + (kk === 'left' ? m - 1 : 1)) % m; ui.sfx('select'); }
            if (kk === 'ok') this.act();
            return;
          }
          if (kk === 'left' || kk === 'right') { this.slot = (this.slot + (kk === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); return; }
          if (kk === 'up') return this.adjust(this.slot, 1);
          if (kk === 'down') return this.adjust(this.slot, -1);
          if (kk === 'ok') this.act();
        }
      });
    },

    openConeMerge(cn, donor) {
      const ui = this, g = this.game, sum = (cn.sup || 1) + (donor.sup || 1), risky = (donor.lvl || 1) > 1;
      this.push({
        sel: 0,
        draw(c) {
          const x = W / 2 - 190, y = 110, w = 380, h = 250;
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Наложение' });
          G.drawConeCard(c, cn.id, x + 18, y + 24, 60, 84, { sup: cn.sup || 1 });
          ui.text('+', x + 92, y + 56, { size: 18, bold: true, col: C.gold });
          G.drawConeCard(c, donor.id, x + 110, y + 24, 60, 84, { sup: donor.sup || 1 });
          ui.text('→', x + 184, y + 56, { size: 18, bold: true, col: C.gold });
          ui.text('S' + sum, x + 216, y + 52, { size: 26, bold: true, serif: true, col: C.gold });
          ui.text('Ур. ' + (donor.lvl || 1) + ', S' + (donor.sup || 1) + ': копия исчезнет', x + 110, y + 112, { size: 10, col: C.sub });
          ui.coneLines(cn.id, sum, w - 36, 11, 4).forEach((l, i) => ui.richText(l, x + 18, y + 130 + i * 14, { size: 11, col: C.cream }));
          if (risky) ui.text('Вложенный в копию эфир и материалы не вернутся.', x + 18, y + 190, { size: 11, bold: true, col: C.bad });
          ui.button(x + 30, y + h - 40, 140, 28, 'Наложить', () => { this.sel = 0; this.key('ok'); }, { size: 12, active: this.sel === 0 });
          ui.button(x + w - 170, y + h - 40, 140, 28, 'Отмена', () => { this.sel = 1; this.key('ok'); }, { size: 12, active: this.sel === 1 });
        },
        key(kk) {
          if (kk === 'left' || kk === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (kk === 'back') { ui.pop(); return; }
          if (kk !== 'ok') return;
          if (this.sel === 1) { ui.pop(); return; }
          ui.screens.pop();
          if (g.coneMerge(cn, donor)) { ui.sfx('chest'); ui.toast('Наложение: теперь S' + cn.sup + '.'); } else ui.sfx('deny');
        }
      });
    },

    openConeFeed(up, cn) {
      const ui = this, g = this.game, COLS = 8, CW = 70, CH = 104, VIS = 3;
      const list = () => g.coneFree(cn);
      this.push({
        sel: 0, sc: { top: 0 },
        toggle(uid) {
          const i = up.feed.indexOf(uid);
          if (i >= 0) { up.feed.splice(i, 1); ui.sfx('cancel'); return; }
          if (up.gain() >= g.coneToCap(cn)) { ui.sfx('deny'); ui.toast('Опыта уже хватает до предела.'); return; }
          up.feed.push(uid);
          ui.sfx('select');
        },
        draw(c) {
          const all = list(), x = 24, y = 30, w = 592, h = 420, rows = Math.ceil(all.length / COLS);
          ui.win(x, y, w, h, { title: 'Конусы на опыт' });
          ui.closeBtn(x + w - 30, y + 8, () => ui.pop());
          if (this.sel >= all.length) this.sel = Math.max(0, all.length - 1);
          const start = ui.listTop(this.sc, Math.floor(this.sel / COLS), rows, VIS) * COLS;
          ui.wheelZone(36, 46, 576, VIS * CH, d => { this.sc.top += d; });
          if (rows > VIS) ui.scrollBar(600, 47, VIS * CH - 10, this.sc, rows, VIS);
          all.slice(start, start + COLS * VIS).forEach((cc, j) => {
            const i = start + j, cx = 36 + (j % COLS) * CW, cy = 50 + Math.floor(j / COLS) * CH, on = i === this.sel, picked = up.feed.includes(cc.uid), d = H.CONES[cc.id];
            if (on) { c.fillStyle = 'rgba(242,220,154,0.25)'; c.fillRect(cx, cy - 3, CW - 4, CH - 8); }
            G.drawConeCard(c, cc.id, cx + 6, cy, 56, 78, { sup: cc.sup || 1 });
            ui.text('ур.' + (cc.lvl || 1), cx + 9, cy + 67, { size: 9, bold: true, col: C.cream });
            if (picked) { c.fillStyle = 'rgba(40,160,80,0.45)'; c.fillRect(cx + 6, cy, 56, 78); ui.text('✓', cx + 34, cy + 26, { size: 22, bold: true, align: 'center', col: '#ffffff' }); }
            ui.text('+' + fmt(H.ASC.coneFodder[d.rarity]), cx + 34, cy + 81, { size: 9, align: 'center', col: picked ? C.ok : C.sub });
            ui.hit(cx, cy, CW - 4, CH - 10, () => { this.sel = i; this.toggle(cc.uid); });
          });
          c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(36, 364, 568, 40);
          ui.text('Выбрано: ' + up.feed.length + ' · опыт +' + fmt(g.coneFeedExp(up.feed)) + ' · кредиты ×' + fmt(g.coneCredits(g.coneFeedExp(up.feed))), 46, 370, { size: 12, bold: true, col: C.gold });
          ui.text('Вложенное в потраченный конус не возвращается. Надетые здесь не показаны.', 46, 386, { size: 10, col: C.sub });
          ui.button(W / 2 - 70, 410, 140, 26, 'Готово', () => ui.pop(), { size: 12, active: true });
        },
        key(kk, code) {
          const all = list(), n = all.length;
          if (kk === 'back' || code === 'KeyC') { ui.pop(); return; }
          if (!n) return;
          const to = kk === 'left' ? this.sel - 1 : kk === 'right' ? this.sel + 1 : kk === 'up' ? this.sel - COLS : kk === 'down' ? this.sel + COLS : this.sel;
          if (to !== this.sel && to >= 0 && to < n) { this.sel = to; ui.sfx('select'); return; }
          if (kk === 'ok') this.toggle(all[this.sel].uid);
        }
      });
    },

    openConeFeedConfirm(up, cn) {
      const ui = this, g = this.game;
      this.push({
        sel: 1,
        draw(c) {
          const x = W / 2 - 190, y = 170, w = 380, h = 140, s = g.state, names = up.feed.map(uid => { const q = s.inv.cones.find(z => z.uid === uid); return q && ((q.lvl || 1) > 1 || (q.sup || 1) > 1 || H.CONES[q.id].rarity >= 5) ? H.CONES[q.id].name : null; }).filter(Boolean);
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Потратить ценные конусы?' });
          ui.wrap(names.slice(0, 3).join(', ') + (names.length > 3 ? ' и ещё ' + (names.length - 3) : ''), w - 32, 11).slice(0, 2).forEach((l, i) => ui.text(l, x + 16, y + 24 + i * 14, { size: 11, bold: true, col: C.gold }));
          ui.text('Они исчезнут. Вложенное в них не вернётся.', x + 16, y + 58, { size: 11, col: C.bad });
          ui.button(x + 30, y + h - 40, 140, 28, 'Потратить', () => { this.sel = 0; this.key('ok'); }, { size: 12, active: this.sel === 0 });
          ui.button(x + w - 170, y + h - 40, 140, 28, 'Отмена', () => { this.sel = 1; this.key('ok'); }, { size: 12, active: this.sel === 1 });
        },
        key(kk) {
          if (kk === 'left' || kk === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (kk === 'back') { ui.pop(); return; }
          if (kk !== 'ok') return;
          ui.screens.pop();
          if (this.sel === 0) up.spend(cn);
        }
      });
    },

    openConeResult(cn, from, to, before) {
      const ui = this, g = this.game;
      ui.sfx('levelup');
      this.push({
        t: 0,
        tick(dt) { this.t += dt; },
        draw(c) {
          const x = W / 2 - 180, y = 110, w = 360, h = 230, now = g.coneStatsOf(cn), lit = this.t > 0.45 ? to : from;
          c.fillStyle = 'rgba(2,3,12,0.66)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Возвышение завершено' });
          G.drawConeCard(c, cn.id, x + 18, y + 22, 54, 76, { sup: cn.sup || 1 });
          ui.text(ui.fitText(H.CONES[cn.id].name, 13, w - 110, true), x + 86, y + 24, { size: 13, bold: true, serif: true, col: C.gold });
          ui.ascGems(c, x + 90, y + 52, lit, { r: 5, step: 14 });
          ui.text('Предел уровня: ' + H.ascCap(from) + ' → ' + H.ascCap(to), x + 86, y + 68, { size: 12, bold: true, col: C.cream });
          [['hp', 'HP'], ['atk', 'Атака'], ['def', 'Защита']].forEach(([key, name], i) => {
            const ry = y + 108 + i * 21;
            G.statIcon(c, key, x + 20, ry + 1, 12, '#c8d0f0');
            ui.text(name, x + 38, ry, { size: 12, col: C.sub });
            ui.text(fmt(before[key]) + ' → ' + fmt(now[key]), x + w - 20, ry, { size: 12, bold: true, align: 'right', col: C.ok });
          });
          ui.button(x + w / 2 - 70, y + h - 42, 140, 28, 'Дальше', () => ui.pop(), { size: 12, active: true });
        },
        key(kk) { if (kk === 'ok' || kk === 'back') ui.pop(); }
      });
    }
  });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
