(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;

  const FRAME = { x: 16, y: 30, w: 608, h: 400 };
  const PIC = { x: 30, y: 46, w: 200, h: 206 };
  const RAIL = { x: 54, y: 74, step: 50, r: 14 };
  const R = { x: 244, w: 366 };
  const SLIDE = { x: 290, y: 318, w: 274 };
  const KIND_NAME = { golden: 'Чашелист (золотой)', crimson: 'Чашелист (багровый)', shadow: 'Застойная тень', cavern: 'Пещера коррозии', echo: 'Эхо войны' };
  const KIND_ART = { golden: 'gold', crimson: 'crimson', shadow: 'shadow', cavern: 'cavern', echo: 'shadow' };
  const KIND_COL = { golden: '#e8c060', crimson: '#e05a5a', shadow: '#b080ff', cavern: '#5ad0c0', echo: '#ff8a5a' };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  const FOES_MAX = 5;

  Object.assign(H.UI.prototype, {
    domainFoes(c, tier) {
      const lvl = H.CALYX_TIERS[tier].lvl, out = [];
      const add = (id, lv, tag) => { if (H.ENEMIES[id] && !out.some(o => o.id === id)) out.push({ id, d: H.ENEMIES[id], lv, tag: tag || (H.ENEMIES[id].boss ? 'boss' : H.ENEMIES[id].elite ? 'elite' : '') }); };
      if (c.waves) c.waves.forEach(w => w.forEach(id => add(id, lvl + (H.ENEMIES[id] && H.ENEMIES[id].boss ? 2 : 0))));
      else if (c.boss) { add(c.boss, lvl + 2, 'boss'); (c.adds || []).forEach(id => add(id, lvl)); }
      else { (c.elite || []).forEach(id => add(id, lvl, 'elite')); (c.pool || []).forEach(id => add(id, lvl)); }
      return out.slice(0, FOES_MAX);
    },

    domainLock(c, x, y, col) {
      c.fillStyle = col; c.fillRect(x - 4, y - 1, 8, 7);
      c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y - 1, 3, Math.PI, 0); c.stroke();
    },

    domainPicture(c, cx, kind) {
      const ui = this, t = ui.t;
      c.save();
      c.beginPath(); c.rect(PIC.x, PIC.y, PIC.w, PIC.h); c.clip();
      c.drawImage(G.bgCanvas('sim', PIC.w, PIC.h), PIC.x, PIC.y);
      const gr = c.createRadialGradient(PIC.x + 128, PIC.y + 110, 6, PIC.x + 128, PIC.y + 110, 110);
      gr.addColorStop(0, 'rgba(255,230,170,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gr; c.fillRect(PIC.x, PIC.y, PIC.w, PIC.h);
      c.fillStyle = ui.dither(); c.fillRect(PIC.x, PIC.y, PIC.w, PIC.h);
      const k = H.guideCalyxKind(cx);
      if (cx.boss) G.drawEnemy(c, H.ENEMIES[cx.boss], PIC.x + 130, PIC.y + 190, 150, { t });
      else if (k === 'cavern' && cx.elite) G.drawEnemy(c, H.ENEMIES[cx.elite[0]], PIC.x + 130, PIC.y + 186, 130, { t });
      else {
        c.translate(PIC.x + 130 - 48, PIC.y + 40);
        c.scale(3, 3);
        G.drawObject(c, 'domain', 0, 16, { art: KIND_ART[k], phase: 0 }, t);
      }
      c.restore();
      c.strokeStyle = '#010208'; c.strokeRect(PIC.x - 0.5, PIC.y - 0.5, PIC.w + 1, PIC.h + 1);
      c.strokeStyle = C.brassDk; c.strokeRect(PIC.x + 0.5, PIC.y + 0.5, PIC.w - 1, PIC.h - 1);
    },

    domainTiers(c, scr) {
      const ui = this, g = this.game, open = g.tiersOpen();
      c.fillStyle = 'rgba(4,6,16,0.75)'; c.fillRect(RAIL.x - 2, RAIL.y, 4, RAIL.step * (H.CALYX_TIERS.length - 1));
      c.fillStyle = C.brassDk; c.fillRect(RAIL.x - 1, RAIL.y, 1, RAIL.step * (H.CALYX_TIERS.length - 1));
      H.CALYX_TIERS.forEach((t, i) => {
        const y = RAIL.y + i * RAIL.step, on = scr.tier === i;
        c.fillStyle = '#010208'; c.beginPath(); c.arc(RAIL.x, y, RAIL.r + 2, 0, Math.PI * 2); c.fill();
        c.fillStyle = on ? '#f4eedc' : open[i] ? '#1a2050' : '#16182a'; c.beginPath(); c.arc(RAIL.x, y, RAIL.r, 0, Math.PI * 2); c.fill();
        c.strokeStyle = on ? C.brassHi : open[i] ? C.brass : '#3a3c52'; c.lineWidth = 1; c.beginPath(); c.arc(RAIL.x, y, RAIL.r - 0.5, 0, Math.PI * 2); c.stroke();
        if (on) { c.strokeStyle = 'rgba(242,220,154,' + (0.5 + 0.4 * Math.sin(ui.t * 4)).toFixed(2) + ')'; c.setLineDash([2, 3]); c.beginPath(); c.arc(RAIL.x, y, RAIL.r + 5, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
        if (open[i]) ui.text(ROMAN[i], RAIL.x, y - 7, { align: 'center', size: 12, bold: true, serif: true, col: on ? '#20140c' : C.cream, shadow: !on });
        else ui.domainLock(c, RAIL.x, y, '#5c6078');
        ui.hit(RAIL.x - RAIL.r - 2, y - RAIL.r - 2, RAIL.r * 2 + 4, RAIL.r * 2 + 4, () => scr.setTier(i));
      });
    },

    domainToggle(c, x, y, on) {
      c.fillStyle = '#000'; c.fillRect(x, y, 34, 16);
      c.fillStyle = on ? '#b08a44' : '#16182a'; c.fillRect(x + 1, y + 1, 32, 14);
      c.fillStyle = on ? 'rgba(255,255,255,0.4)' : 'rgba(170,190,255,0.2)'; c.fillRect(x + 1, y + 1, 32, 1);
      const kx = on ? x + 19 : x + 2;
      c.fillStyle = '#1a1208'; c.fillRect(kx, y + 2, 13, 12);
      c.fillStyle = on ? '#f4eedc' : '#5c6078'; c.fillRect(kx + 1, y + 3, 11, 10);
    },

    domainInfo(c, x, y) {
      c.fillStyle = '#010208'; c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2); c.fill();
      c.strokeStyle = C.brass; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 7.5, 0, Math.PI * 2); c.stroke();
      c.fillStyle = C.brassHi; c.fillRect(x - 1, y - 4, 2, 2); c.fillRect(x - 1, y - 1, 2, 6);
    },

    domainStartButton(c, x, y, w, h, cost, ok, fn, label) {
      const ui = this;
      const gr = c.createLinearGradient(x, y, x, y + h);
      gr.addColorStop(0, ok ? '#f2dc9a' : '#2a2c44'); gr.addColorStop(1, ok ? '#b08a44' : '#16182a');
      c.fillStyle = '#000'; c.fillRect(x, y, w, h);
      c.fillStyle = gr; c.fillRect(x + 1, y + 1, w - 2, h - 2);
      c.fillStyle = ok ? 'rgba(255,255,255,0.6)' : 'rgba(170,190,255,0.25)'; c.fillRect(x + 1, y + 1, w - 2, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(x + 1, y + h - 2, w - 2, 1);
      G.itemIcon(c, 'power', x + 8, y + (h - 18) / 2, 18);
      ui.text('×' + cost, x + 30, y + (h - 12) / 2 - 1, { size: 12, bold: true, col: ok ? '#20140c' : C.bad, shadow: !ok });
      c.fillStyle = ok ? 'rgba(32,20,12,0.5)' : 'rgba(170,190,255,0.3)';
      for (let i = 4; i < h - 4; i += 3) c.fillRect(x + 84, y + i, 1, 1);
      ui.text(label || 'Начать испытание', x + 84 + (w - 84) / 2, y + (h - 13) / 2 - 1, { align: 'center', size: 13, bold: true, col: ok ? '#1c1208' : C.cream, shadow: !ok });
      ui.hit(x, y, w, h, fn);
    },

    domainSlider(c, scr, max, cap) {
      const ui = this, live = cap > 1;
      ui.text('Количество испытаний: ' + scr.n, R.x + R.w / 2, 291, { align: 'center', size: 11, col: live ? C.cream : C.dim });
      ui.button(R.x + 6, 309, 30, 18, '−', () => scr.setN(scr.n - 1), { size: 12, bold: true, disabled: !live || scr.n <= 1 });
      ui.text('1', SLIDE.x - 12, 312, { align: 'center', size: 11, col: C.sub });
      ui.rail(SLIDE.x, SLIDE.y, SLIDE.w, max > 1 ? (scr.n - 1) / (max - 1) : 1, live ? null : '#5c6078');
      ui.text(String(max), SLIDE.x + SLIDE.w + 16, 312, { align: 'center', size: 11, col: C.sub });
      ui.button(R.x + R.w - 36, 309, 30, 18, '+', () => scr.setN(scr.n + 1), { size: 12, bold: true, disabled: !live || scr.n >= max });
      if (live) ui.hit(SLIDE.x - 6, 309, SLIDE.w + 12, 18, (b, p) => {
        const set = q => scr.setN(Math.round(1 + Math.max(0, Math.min(1, (q.x - SLIDE.x) / SLIDE.w)) * (max - 1)));
        if (p) { set(p); ui.drag = { move: set }; }
      });
    },

    domainPay(id, tier, n) {
      const g = this.game, c = H.CALYX.find(x => x.id === id), p = g.powerInfo(), need = c.cost * n;
      if (c.reward === 'echo' && !g.echoLeft()) return { ok: true, need: 0, take: 0, free: true };
      if (p.cur >= need) return { ok: true, need, take: 0 };
      const take = need - p.cur;
      return g.powerAuto() && p.res >= take ? { ok: true, need, take } : { ok: false, need, short: take };
    },

    openDomain(id, close, o = {}) {
      const ui = this, g = this.game, cx = H.CALYX.find(x => x.id === id);
      if (!cx) return;
      const kind = H.guideCalyxKind(cx), pref = g.domainPref(id), opens = g.tiersOpen();
      const firstOpen = Math.max(0, opens.lastIndexOf(true));
      ui.push({
        domain: id,
        tier: opens[pref.tier] ? pref.tier : firstOpen,
        n: pref.n,
        cap() { return g.domainRunCap(id); },
        max() { return Math.max(1, Math.min(this.cap(), g.domainRunMax(id, this.tier) || 1)); },
        setTier(i) {
          if (i < 0 || i >= H.CALYX_TIERS.length) return;
          if (!g.tiersOpen()[i]) { ui.sfx('deny'); ui.toast('Сложность ' + ROMAN[i] + ' откроется дальше по сюжету.'); return; }
          if (i !== this.tier) { this.tier = i; ui.sfx('select'); }
        },
        setN(v) {
          const n = Math.max(1, Math.min(this.max(), Math.round(v)));
          if (n !== this.n) { this.n = n; ui.sfx('select'); }
        },
        start() {
          if (o.enter) { ui.screens.pop(); o.enter(); return; }
          if (!g.calyxOpen(cx)) { ui.sfx('deny'); return; }
          const n = Math.min(this.n, this.max()), pay = ui.domainPay(id, this.tier, n);
          if (!pay.ok) { ui.sfx('deny'); ui.toast('Не хватает Энергии освоения: ещё ' + pay.short + '.'); ui.openPower(pay.short); return; }
          g.setDomainPref(id, n, this.tier);
          ui.screens = [];
          close();
          g.startCalyx(id, this.tier, n);
          ui.drainGameEvents();
        },
        quick() {
          if (!g.domainCoupons(id)) { ui.sfx('deny'); ui.toast('Пещеры коррозии и Эхо войны не принимают Топливные купоны.'); return; }
          ui.openQuickFarm(id, this.tier);
        },
        draw(c) {
          const open = g.calyxOpen(cx), cap = this.cap(), max = this.max();
          if (this.n > max) this.n = max;
          ui.win(FRAME.x, FRAME.y, FRAME.w, FRAME.h, { title: KIND_NAME[kind] });
          let hx = W - 48;
          hx -= ui.measure(H.fmt(g.state.inv.items.fuelv || 0), 11, true) + 22;
          if (g.state.inv.items.fuelv || cx && g.domainCoupons(id)) ui.money(hx, 40, 'fuelv', g.state.inv.items.fuelv || 0);
          ui.powerChip(hx - 128, 40, { sep: ' / ' });
          ui.closeBtn(W - 42, 36, () => this.key('back'));

          ui.domainPicture(c, cx, kind);
          ui.domainTiers(c, this);
          c.fillStyle = 'rgba(4,6,16,0.55)'; c.fillRect(PIC.x, 260, PIC.w, 96);
          c.fillStyle = C.brass; c.fillRect(PIC.x, 260, 3, 96);
          ui.text('Описание', PIC.x + 10, 265, { size: 11, bold: true, col: C.gold });
          ui.wrap(cx.text, PIC.w - 18, 10).slice(0, 6).forEach((l, i) => ui.text(l, PIC.x + 10, 282 + i * 12, { size: 10, col: '#c8d8ff' }));
          const coupons = g.domainCoupons(id);
          if (coupons) {
            ui.button(PIC.x, 364, PIC.w, 26, 'Быстрое получение', () => this.quick(), { size: 11, disabled: !open || !(g.state.inv.items.fuelv >= coupons) });
            G.itemIcon(c, 'fuelv', PIC.x + PIC.w - 26, 368, 18);
          } else ui.text('Без быстрого получения', PIC.x + PIC.w / 2, 371, { align: 'center', size: 10, col: C.dim });

          const place = g.guidePlace(g.guideSite('calyx', id));
          G.mapIcon(c, 'pin', R.x, 47, 12);
          ui.text(ui.clip(place || 'Экспресс, Симулятор', R.w - 200, 10), R.x + 14, 48, { size: 10, col: KIND_COL[kind] });
          ui.text(ui.clip(cx.name.split(': ').slice(1).join(': ') || cx.name, R.w - 8, 16, true, true), R.x, 62, { size: 16, bold: true, serif: true, col: C.gold });
          const t = H.CALYX_TIERS[this.tier];
          c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(R.x, 84, R.w - 4, 18);
          c.fillStyle = C.brass; c.fillRect(R.x, 84, 3, 18);
          ui.text('Сложность ' + ROMAN[this.tier] + ' · ур. ' + t.lvl, R.x + 10, 87, { size: 11, bold: true, col: C.cream });

          c.fillStyle = 'rgba(120,18,36,0.38)'; c.fillRect(R.x, 108, R.w - 4, 92);
          c.fillStyle = 'rgba(255,120,140,0.25)'; c.fillRect(R.x, 108, R.w - 4, 1);
          ui.text('Возможные противники', R.x + 8, 111, { size: 11, col: '#ffc0c8' });
          ui.domainFoes(cx, this.tier).forEach((f, i) => {
            const x = R.x + 8 + i * 70, y = 128;
            c.save(); c.beginPath(); c.rect(x, y, 64, 66); c.clip();
            G.foeIcon(c, f.d, x, y - 4, 70, { border: false });
            c.restore();
            c.fillStyle = 'rgba(4,6,16,0.85)'; c.fillRect(x, y + 52, 64, 14);
            f.d.weak.slice(0, 3).forEach((e, k) => G.elemIcon(c, e, x + 6 + k * 9, y + 59, 4));
            ui.text('Ур. ' + f.lv, x + 62, y + 54, { align: 'right', size: 9, bold: true, col: C.cream });
            c.strokeStyle = f.tag === 'boss' ? '#ff7070' : f.tag === 'elite' ? C.brassHi : '#3a1420'; c.strokeRect(x - 0.5, y - 0.5, 65, 67);
          });

          ui.text('Можно получить', R.x + 8, 204, { size: 11, col: C.sub });
          c.fillStyle = C.brassDk; c.fillRect(R.x + 110, 211, R.w - 118, 1);
          const drops = ui.calyxDrops(cx);
          drops.forEach((rk, i) => { const it = H.ITEMS[rk], x = R.x + 8 + i * 40; G.rarityCell(c, x, 220, 34, 34, it ? it.rar : 4); G.itemIcon(c, rk, x + 3, 223, 28, cx.sets ? cx.sets[i % cx.sets.length] : 'thunder'); });

          if (kind === 'echo') {
            const left = g.echoLeft();
            ui.text('Награды Эха войны в этот час: ' + left + ' из ' + H.TRACE_ECHO_LIMIT, R.x + 8, 270, { size: 11, col: left ? C.cream : C.bad });
            if (!left) ui.text('Бой без награды и без энергии.', R.x + 8, 288, { size: 10, col: C.sub });
          } else {
            c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(R.x, 262, R.w - 4, 22);
            c.fillStyle = 'rgba(242,220,154,0.18)'; c.fillRect(R.x, 284, R.w - 4, 1);
            ui.domainInfo(c, R.x + 14, 273);
            ui.hit(R.x + 4, 263, 20, 20, () => ui.toast('Если энергии освоения не хватает, недостающее берётся из резерва. Топливо Экспресса и нефрит не тратятся.'));
            ui.text('Быстрое восстановление энергии Освоения', R.x + 30, 267, { size: 11, col: C.cream });
            ui.domainToggle(c, R.x + R.w - 44, 265, g.powerAuto());
            ui.hit(R.x + 30, 262, R.w - 34, 22, () => this.key(null, 'KeyT'));
            ui.domainSlider(c, this, max, cap);
          }

          const n = Math.min(this.n, max), pay = ui.domainPay(id, this.tier, n);
          ui.domainStartButton(c, R.x, 342, R.w - 4, 32, pay.free ? 0 : cx.cost * n, open && (pay.ok || !!o.enter), () => this.key('ok'), o.enter ? 'Войти' : 'Начать испытание');
          const note = !open ? (cx.ownsMat ? 'Нужен герой с этим материалом в экипаже.' : cx.owns ? 'Нужен герой этого Пути в экипаже.' : 'Откроется дальше по сюжету.')
            : !pay.ok ? 'Не хватает энергии: ещё ' + pay.short + '. Enter откроет пополнение.'
            : pay.take ? 'Из резерва возьмётся ' + pay.take + ' энергии.'
            : kind === 'golden' || kind === 'crimson' ? (n > 1 ? n + ' волн в одном бою, награда за каждую.' : 'Одна волна противников.')
            : kind === 'echo' ? 'Один бой.' : n > 1 ? n + ' боя подряд, награда после каждой победы.' : 'Один бой.';
          ui.text(note, R.x + (R.w - 4) / 2, 380, { align: 'center', size: 10, col: !open || !pay.ok ? C.bad : C.sub });

          const hints = [['↑↓', 'Сложность']];
          if (cap > 1) hints.push(['←→', 'Количество']);
          hints.push(['Enter', o.enter ? 'Войти' : 'Начать']);
          if (coupons) hints.push(['Q', 'Быстрое получение']);
          if (kind !== 'echo') hints.push(['T', 'Резерв']);
          hints.push(['P', 'Энергия'], ['Esc', 'Назад']);
          ui.hints(hints, W / 2, 440, { align: 'center' });
        },
        key(k, code) {
          if (code === 'KeyP') { ui.openPower(); return; }
          if (code === 'KeyQ') { this.quick(); return; }
          if (code === 'KeyT' && kind !== 'echo') { g.setPowerAuto(!g.powerAuto()); ui.sfx('select'); return; }
          if (code === 'Home') { this.setN(1); return; }
          if (code === 'End') { this.setN(this.max()); return; }
          if (k === 'up') { for (let i = this.tier - 1; i >= 0; i--) if (g.tiersOpen()[i]) { this.setTier(i); break; } return; }
          if (k === 'down') { for (let i = this.tier + 1; i < H.CALYX_TIERS.length; i++) if (g.tiersOpen()[i]) { this.setTier(i); break; } return; }
          if (k === 'left') { this.setN(this.n - 1); return; }
          if (k === 'right') { this.setN(this.n + 1); return; }
          if (k === 'ok') { this.start(); return; }
          if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); if (!o.fromList && !o.enter) close(); }
        }
      });
    },

    openCalyx(close, only) {
      const ui = this, g = this.game, calyxList = () => g.calyxList().filter(x => !only || only.includes(x.c.id));
      if (only && only.length === 1) return ui.openDomain(only[0], close);
      this.push({
        lsc: { top: 0 },
        draw(c) {
          const list = calyxList();
          ui.win(30, 36, 580, 410, { title: 'Симулятор Экспресса' });
          ui.powerChip(420, 50, { sep: ' / ' });
          ui.list(42, 72, 556, list.map(x => ({ label: x.c.name, right: x.open ? x.c.cost + ' энерг.' : 'закрыто', disabled: !x.open, icon: (cc, ix, iy) => G.menuIcon(cc, 'calyx', ix, iy - 9, 18, x.open ? KIND_COL[H.guideCalyxKind(x.c)] : '#4a4e68'), iconW: 22 })), this.sel, { rowH: 26, max: 6, scroll: this.lsc, onClick: i => { if (this.sel === i) this.key('ok'); else this.sel = i; } });
          const cur = list[this.sel];
          c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(42, 250, 556, 150);
          if (cur) {
            ui.wrap(cur.c.text, 530, 12).slice(0, 3).forEach((l, i) => ui.text(l, 54, 256 + i * 15, { col: '#c8d8ff' }));
            if (!cur.open) ui.text(cur.c.ownsMat ? 'Нужен герой с этим материалом в экипаже.' : cur.c.owns ? 'Нужен герой Пути ' + H.TRACE_PATH_LINES[Object.keys(H.TRACE_PATH_LINES).find(k => H.TRACE_PATH_LINES[k][0] === cur.c.owns)][1] + '.' : 'Откроется дальше по сюжету.', 54, 304, { col: C.bad });
            ui.text('Награда:', 54, 334);
            ui.calyxDrops(cur.c).forEach((rk, i) => { const it = H.ITEMS[rk]; G.rarityCell(c, 120 + i * 40, 324, 36, 36, it ? it.rar : 4); G.itemIcon(c, rk, 122 + i * 40, 326, 32, cur.c.sets ? cur.c.sets[i % cur.c.sets.length] : 'thunder'); });
            const cap = g.domainRunCap(cur.c.id);
            ui.text(cap > 1 ? (H.guideCalyxKind(cur.c) === 'golden' || H.guideCalyxKind(cur.c) === 'crimson' ? 'До ' + cap + ' волн за заход.' : 'До ' + cap + ' боёв подряд.') : 'Один бой за заход.', 586, 372, { align: 'right', size: 11, col: C.sub });
          }
          ui.hints([['↑↓', 'Вызов'], ['Enter', 'Открыть'], ['P', 'Энергия'], ['Esc', 'Назад']], W / 2, 420, { align: 'center' });
        },
        key(k, code) {
          const list = calyxList();
          if (code === 'KeyP') { ui.openPower(); return; }
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'ok') {
            const cur = list[this.sel];
            if (!cur || !cur.open) return ui.sfx('deny');
            ui.sfx('select');
            ui.openDomain(cur.c.id, close, { fromList: true });
          }
          if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); close(); }
        }
      });
    }
  });

  const QF = { x: 60, y: 104, w: 520, h: 272 };
  const QS = { x: 152, y: 252, w: 268 };

  Object.assign(H.UI.prototype, {
    quickBand(c, y, h) {
      const gr = c.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, '#f0d898'); gr.addColorStop(1, '#c8a058');
      c.fillStyle = '#1a1208'; c.fillRect(QF.x + 4, y - 1, QF.w - 8, h + 2);
      c.fillStyle = gr; c.fillRect(QF.x + 5, y, QF.w - 10, h);
      c.fillStyle = 'rgba(120,80,20,0.18)'; for (let x = QF.x + 6; x < QF.x + QF.w - 6; x += 4) c.fillRect(x, y + ((x >> 2) % 2) * 2 + 2, 1, 1);
    },

    quickChevrons(c, x, y, col) {
      c.fillStyle = col;
      for (const dy of [-4, 1]) for (let i = 0; i < 4; i++) { c.fillRect(x - i - 1, y + dy + i, 2, 1); c.fillRect(x + i - 1, y + dy + i, 2, 1); }
    },

    quickOrnament(c, y) {
      const ui = this, mid = QF.x + QF.w / 2;
      c.fillStyle = C.brassDk; c.fillRect(QF.x + 24, y, QF.w / 2 - 40, 1); c.fillRect(mid + 16, y, QF.w / 2 - 40, 1);
      ui.diamond(mid - 12, y + 0.5, 2.5, C.brass); ui.diamond(mid + 12, y + 0.5, 2.5, C.brass);
      c.strokeStyle = C.brassHi; c.lineWidth = 1; c.beginPath(); c.arc(mid, y + 0.5, 4, 0, Math.PI * 2); c.stroke();
    },

    openQuickFarm(id, tier, qo = {}) {
      const ui = this, g = this.game, cx = H.CALYX.find(x => x.id === id), per = g.domainCoupons(id);
      const why = g.quickWhy(id, tier);
      if (why) {
        ui.sfx('deny');
        ui.toast(why === 'kind' ? 'Пещеры коррозии и Эхо войны не принимают Топливные купоны.' : why === 'place' ? 'Быстрое получение сейчас недоступно.' : 'Испытание ещё закрыто.');
        return;
      }
      const cap = () => Math.max(1, Math.min(H.DOMAIN_QUICK_MAX, Math.floor((g.state.inv.items.fuelv || 0) / per)));
      ui.push({
        quickFarm: id,
        n: 1,
        setN(v) { const n = Math.max(1, Math.min(cap(), Math.round(v))); if (n !== this.n) { this.n = n; ui.sfx('select'); } },
        state() {
          const coupons = g.state.inv.items.fuelv || 0, power = g.powerInfo().cur, n = Math.min(this.n, cap());
          return { n, cost: cx.cost * n, fuel: per * n, coupons, power, noFuel: coupons < per * n, short: Math.max(0, cx.cost * n - power) };
        },
        confirm() {
          const st = this.state();
          if (st.noFuel) { ui.sfx('deny'); ui.toast('Не хватает Топливных купонов.'); return; }
          if (st.short) { ui.sfx('deny'); ui.openPower(st.short); return; }
          const r = g.quickFarm(id, tier, st.n, { target: qo.target });
          if (!r.ok) { ui.sfx('deny'); ui.toast('Быстрое получение не удалось.'); return; }
          ui.screens.pop();
          ui.sfx('chest');
          ui.drainGameEvents();
          ui.openQuickResult(id, tier, r);
        },
        draw(c) {
          const st = this.state(), mid = QF.x + QF.w / 2, max = cap();
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          ui.win(QF.x, QF.y, QF.w, QF.h);
          ui.text('Быстрое получение', mid, QF.y + 14, { align: 'center', size: 17, bold: true, serif: true, col: C.gold });
          ui.quickOrnament(c, QF.y + 42);
          const lines = ui.wrap('Вы уверены, что хотите начать быстрое получение материалов испытания ' + cx.name + ' • Сложность ' + ROMAN[tier] + '?', QF.w - 60, 12);
          lines.slice(0, 3).forEach((l, i) => ui.text(l, mid, QF.y + 58 + i * 17, { align: 'center', size: 12, col: C.cream }));
          if (qo.target !== false && g.targetRowNeeds(id).length) ui.text('Остановится, когда материалов для цели развития хватит.', mid, QF.y + 112, { align: 'center', size: 10, col: C.ok });
          ui.text('Попыток получения: ' + st.n, mid, QF.y + 128, { align: 'center', size: 12, col: C.sub });
          ui.button(QF.x + 24, QS.y - 9, 44, 18, '−', () => this.setN(this.n - 1), { size: 13, bold: true, disabled: st.n <= 1 });
          ui.text('1', QS.x - 16, QS.y - 7, { align: 'center', size: 12, col: C.sub });
          ui.rail(QS.x, QS.y, QS.w, max > 1 ? (st.n - 1) / (max - 1) : 1);
          ui.text(String(max), QS.x + QS.w + 18, QS.y - 7, { align: 'center', size: 12, col: C.sub });
          ui.button(QF.x + QF.w - 120, QS.y - 9, 44, 18, '+', () => this.setN(this.n + 1), { size: 13, bold: true, disabled: st.n >= max });
          ui.button(QF.x + QF.w - 68, QS.y - 9, 44, 18, '', () => this.setN(max), { disabled: st.n >= max });
          ui.quickChevrons(c, QF.x + QF.w - 46, QS.y, st.n >= max ? '#5c6078' : C.brassHi);
          ui.hit(QS.x - 6, QS.y - 9, QS.w + 12, 18, (b, p) => {
            const set = q => this.setN(Math.round(1 + Math.max(0, Math.min(1, (q.x - QS.x) / QS.w)) * (max - 1)));
            if (p) { set(p); ui.drag = { move: set }; }
          });
          const by = QF.y + 174;
          ui.quickBand(c, by, 26);
          const parts = [['Расход:', null], [String(st.cost), 'power', st.short > 0], [String(st.fuel), 'fuelv', st.noFuel]];
          let tw = 0;
          for (const [t, ic] of parts) tw += ui.measure(t, 13, true) + (ic ? 26 : 10);
          let tx = mid - tw / 2;
          for (const [t, ic, bad] of parts) {
            if (ic) { G.itemIcon(c, ic, tx, by + 3, 20); tx += 24; }
            ui.text(t, tx, by + 6, { size: 13, bold: true, col: bad ? '#a01818' : '#20140c', shadow: false });
            tx += ui.measure(t, 13, true) + (ic ? 2 : 10);
          }
          c.fillStyle = '#16130e'; c.fillRect(QF.x + 5, by + 27, QF.w - 10, QF.h - (by + 27 - QF.y) - 5);
          c.fillStyle = ui.dither(); c.fillRect(QF.x + 5, by + 27, QF.w - 10, QF.h - (by + 27 - QF.y) - 5);
          ui.button(QF.x + 36, by + 44, 210, 30, '⊗  Отменить', () => this.key('back'), { size: 13 });
          ui.button(QF.x + QF.w - 246, by + 44, 210, 30, st.noFuel ? 'Нет купонов' : st.short ? '+  Пополнить' : '▶  Подтвердить', () => this.key('ok'), { size: 13, active: !st.noFuel && !st.short, disabled: st.noFuel });
          if (st.short && !st.noFuel) ui.text('Не хватает энергии: ещё ' + st.short + '. Резерв здесь не тратится сам.', mid, by + 80, { align: 'center', size: 10, col: C.bad });
          ui.hints([['←→', 'Попытки'], ['M', 'Максимум'], ['Enter', st.short ? 'Пополнить' : 'Подтвердить'], ['Esc', 'Отменить']], W / 2, QF.y + QF.h + 10, { align: 'center' });
        },
        key(k, code) {
          if (code === 'KeyM' || code === 'End') { this.setN(cap()); return; }
          if (code === 'Home') { this.setN(1); return; }
          if (k === 'left' || k === 'down') { this.setN(this.n - 1); return; }
          if (k === 'right' || k === 'up') { this.setN(this.n + 1); return; }
          if (k === 'ok') { this.confirm(); return; }
          if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); }
        }
      });
    },

    openQuickResult(id, tier, r) {
      const ui = this, g = this.game, cx = H.CALYX.find(x => x.id === id);
      ui.push({
        quickResult: r,
        more() {
          const rr = this.quickResult, n = Math.min(rr.left, Math.floor((g.state.inv.items.fuelv || 0) / g.domainCoupons(id)), Math.floor(g.powerInfo().cur / cx.cost));
          if (!(n > 0)) { ui.sfx('deny'); ui.toast('Не хватает энергии или Топливных купонов.'); return; }
          const nx = g.quickFarm(id, tier, n, { target: false });
          if (!nx.ok) { ui.sfx('deny'); return; }
          ui.sfx('chest');
          const sum = { items: Object.assign({}, rr.delta.items), credits: rr.delta.credits + nx.delta.credits, jade: rr.delta.jade + nx.delta.jade, relics: rr.delta.relics.concat(nx.delta.relics) };
          for (const [k, v] of Object.entries(nx.delta.items)) sum.items[k] = (sum.items[k] || 0) + v;
          this.quickResult = { ok: true, runs: rr.runs + nx.runs, n: rr.n, left: 0, stopped: null, delta: sum, spent: { power: rr.spent.power + nx.spent.power, fuelv: rr.spent.fuelv + nx.spent.fuelv }, exp: rr.exp + nx.exp };
        },
        draw(c) {
          const rr = this.quickResult, mid = W / 2, stop = rr.stopped === 'target';
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          ui.win(QF.x, 80, QF.w, 290, { title: stop ? 'Материалы для цели собраны' : 'Получено' });
          ui.text(ui.clip(cx.name, QF.w - 40, 13, true, true), mid, 98, { align: 'center', size: 13, bold: true, serif: true, col: C.gold });
          ui.text('Попыток: ' + rr.runs + ' · Сложность ' + ROMAN[tier], mid, 118, { align: 'center', size: 11, col: C.sub });
          let mx = QF.x + 24;
          mx += ui.money(mx, 140, 'power', '−' + rr.spent.power) + 16;
          mx += ui.money(mx, 140, 'fuelv', '−' + rr.spent.fuelv) + 16;
          mx += ui.money(mx, 140, 'exp2', 'Опыт Освоения +' + rr.exp) + 16;
          if (rr.delta.credits) ui.money(mx, 140, 'credits', '+' + H.fmt(rr.delta.credits));
          c.fillStyle = C.brassDk; c.fillRect(QF.x + 24, 162, QF.w - 48, 1);
          const loot = ui.domainLoot(rr.delta);
          if (loot.length) ui.domainLootGrid(c, loot, QF.x + 24, 172, 11, 3);
          else ui.text('Ничего', QF.x + 24, 174, { size: 11, col: C.dim });
          if (stop) {
            ui.text('Цели развития хватает этих материалов. Попыток осталось: ' + rr.left + '.', mid, 304, { align: 'center', size: 11, col: C.ok });
            ui.button(QF.x + 36, 328, 210, 28, 'Завершить', () => this.key('back'), { size: 12 });
            ui.button(QF.x + QF.w - 246, 328, 210, 28, 'Продолжить', () => this.key('ok'), { size: 12, active: true });
            ui.hints([['Enter', 'Продолжить'], ['Esc', 'Завершить']], W / 2, 380, { align: 'center' });
          } else {
            ui.button(mid - 105, 328, 210, 28, 'Готово', () => this.key('ok'), { size: 12, active: true });
            ui.hints([['Enter', 'Готово']], W / 2, 380, { align: 'center' });
          }
        },
        key(k) {
          const stop = this.quickResult.stopped === 'target';
          if (k === 'ok' && stop) { this.more(); return; }
          if (k === 'ok' || k === 'back') { ui.screens.pop(); ui.sfx(k === 'ok' ? 'select' : 'cancel'); }
        }
      });
    }
  });

  const NEXT_SEC = 3;
  const UP = H.UI.prototype;
  const domainWin = out => !!(out && out.calyx && !out.lost && !out.fled && !out.su && !out.fh);

  Object.assign(UP, {
    domainLoot(d) {
      const g = this.game, out = [];
      for (const uid of d.relics) { const r = g.state.inv.relics.find(x => x.uid === uid); if (r) out.push({ relic: r }); }
      Object.entries(d.items).map(([id, n]) => ({ id, n, rar: (H.ITEMS[id] || {}).rar || 1 })).sort((a, b) => b.rar - a.rar).forEach(x => out.push(x));
      return out;
    },

    domainLootGrid(c, list, x, y, cols, rows) {
      const ui = this, S = 38, STEP = 42, room = cols * rows;
      list.slice(0, room).forEach((e, i) => {
        const cx = x + (i % cols) * STEP, cy = y + Math.floor(i / cols) * STEP;
        if (e.relic) { G.rarityCell(c, cx, cy, S, S, 4); G.itemIcon(c, 'relic:' + e.relic.slot, cx + 3, cy + 3, 32, e.relic.set); return; }
        G.rarityCell(c, cx, cy, S, S, e.rar);
        G.itemIcon(c, e.id, cx + 3, cy + 3, 32);
        ui.text('×' + H.fmt(e.n), cx + S - 2, cy + S - 12, { align: 'right', size: 9, bold: true, col: C.cream });
      });
      if (list.length > room) ui.text('и ещё ' + (list.length - room), x + cols * STEP - 4, y + rows * STEP - 2, { align: 'right', size: 10, col: C.sub });
    },

    drawDomainResult(c, out) {
      const ui = this, g = this.game, bt = this.bt, run = out.series, more = !!(run && run.more), total = run && !more ? run.total : null;
      const cx = H.CALYX.find(x => x.id === out.calyx.id), d = total || out.calyx.delta;
      c.fillStyle = 'rgba(2,3,12,0.62)'; c.fillRect(0, 0, W, HGT);
      const X = W / 2 - 230, Y = 54;
      ui.win(X, Y, 460, 372, { title: total ? 'Итоги серии' : 'Победа' });
      ui.text(ui.clip(cx.name, 420, 14, true, true), W / 2, Y + 18, { align: 'center', size: 14, bold: true, serif: true, col: C.gold });
      const sub = out.waves ? 'Пройдено волн: ' + out.waves.done + ' из ' + out.waves.n
        : run ? (total ? 'Побед в серии: ' + run.wins + ' из ' + run.n : 'Испытание ' + run.k + ' из ' + run.n)
        : 'Сложность ' + ROMAN[out.calyx.tier];
      ui.text(sub + ' · ' + KIND_NAME[H.guideCalyxKind(cx)], W / 2, Y + 38, { align: 'center', size: 11, col: C.sub });
      let mx = X + 24;
      if (!total) mx += ui.money(mx, Y + 62, 'exp2', 'Опыт +' + out.exp) + 18;
      mx += ui.money(mx, Y + 62, 'credits', '+' + H.fmt(d.credits)) + 18;
      if (d.jade) ui.money(mx, Y + 62, 'jade', '+' + d.jade);
      if (!total && out.levelUps && out.levelUps.length) ui.text('▲ Новый уровень: ' + out.levelUps.map(l => ui.shortName(l.key) + ' ' + l.lvl).join(', '), W / 2, Y + 84, { align: 'center', size: 10, bold: true, col: C.ok });
      ui.text(total ? 'Добыча за серию' : 'Добыча', X + 24, Y + 104, { size: 12, bold: true, serif: true, col: C.gold });
      c.fillStyle = C.brassDk; c.fillRect(X + 24, Y + 120, 412, 1);
      const loot = ui.domainLoot(d);
      if (loot.length) ui.domainLootGrid(c, loot, X + 24, Y + 130, 10, more ? 3 : 4);
      else ui.text('Ничего', X + 24, Y + 132, { size: 11, col: C.dim });
      (out.lines || []).slice(0, 1).forEach(l => ui.text(l, W / 2, Y + 300, { align: 'center', size: 11, col: C.pink }));
      const by = Y + 330;
      if (more) {
        for (let i = 0; i < run.n; i++) ui.diamond(W / 2 - (run.n - 1) * 9 + i * 18, Y + 266, 5, i < run.wins ? C.brassHi : '#20263e', '#1a1208');
        const left = Math.max(0, Math.ceil(bt.nextT == null ? NEXT_SEC : bt.nextT));
        ui.text('Следующее испытание через ' + left + ' с', W / 2, Y + 282, { align: 'center', size: 11, col: C.cream });
        ui.button(X + 24, by, 200, 26, 'Завершить', () => ui.battleKey('back'), { size: 12 });
        ui.button(X + 236, by, 200, 26, 'Дальше', () => ui.battleKey('ok'), { size: 12, active: true });
        ui.hints([['Enter', 'Дальше'], ['Esc', 'Завершить']], W / 2, Y + 380, { align: 'center' });
      } else {
        ui.button(X + 24, by, 200, 26, 'Ещё раз', () => ui.battleKey(null, 'KeyR'), { size: 12 });
        ui.button(X + 236, by, 200, 26, 'Продолжить', () => ui.battleKey('ok'), { size: 12, active: true });
        ui.hints([['R', 'Ещё раз'], ['Enter', 'Продолжить']], W / 2, Y + 380, { align: 'center' });
      }
    },

    domainLostLine(out) {
      if (out.waves && out.waves.done > 0) return 'Пройдено волн: ' + out.waves.done + ' из ' + out.waves.n + ', награда за них получена.';
      if (out.series && out.series.wins > 0) return 'Побед в серии: ' + out.series.wins + ', их добыча сохранена.';
      return '';
    },

    domainNext() {
      const g = this.game, bt = this.bt, r = g.calyxNext();
      if (!r.ok) {
        this.sfx('deny');
        this.toast(r.why === 'power' ? 'Не хватает энергии освоения: ещё ' + r.short + '. Серия остановлена.' : 'Серия остановлена.');
        const st = g.calyxStop();
        Object.assign(bt.result.series, { more: false, total: st ? st.total : bt.result.calyx.delta });
        return false;
      }
      bt.autoSticky = bt.auto;
      this.lastBattle = null;
      this.drainGameEvents();
      return true;
    },

    domainAgain() {
      const g = this.game, bt = this.bt;
      if (!g.calyxRepeat()) { this.sfx('deny'); this.toast('Не хватает Энергии освоения для повтора.'); return false; }
      bt.autoSticky = bt.auto;
      this.lastBattle = null;
      this.drainGameEvents();
      return true;
    }
  });

  const baseDrawBattle = UP.drawBattle;
  UP.drawBattle = function (c) {
    baseDrawBattle.call(this, c);
    const g = this.game, b = g.battle, ctx = g.battleCtx, cx = ctx && ctx.calyx, bt = this.bt;
    if (!b || !cx || !bt || bt.result || bt.intro > 0) return;
    const label = (cx.n || 1) > 1 ? 'Волна ' + (b.wave + 1) + ' / ' + b.waves.length : cx.run && cx.run.n > 1 ? 'Испытание ' + cx.run.k + ' / ' + cx.run.n : '';
    if (label) this.plate(66, 10, label);
  };

  const baseDrawResult = UP.drawResult;
  UP.drawResult = function (c) {
    const out = this.bt.result;
    if (domainWin(out)) { this.drawDomainResult(c, out); return; }
    baseDrawResult.call(this, c);
    const line = out && out.calyx && (out.lost || out.fled) ? this.domainLostLine(out) : '';
    if (line) this.text(line, W / 2, out.lost ? 194 : 210, { align: 'center', size: 10, col: C.gold });
  };

  const baseBattleKey = UP.battleKey;
  UP.battleKey = function (k, code) {
    const bt = this.bt, out = bt && bt.result;
    if (!domainWin(out)) return baseBattleKey.call(this, k, code);
    const more = !!(out.series && out.series.more);
    if (code === 'KeyR' && !more) { this.domainAgain(); return; }
    if (k === 'ok') { if (more) this.domainNext(); else this.closeResult(); return; }
    if (k === 'back') {
      if (!more) { this.closeResult(); return; }
      const st = this.game.calyxStop();
      Object.assign(out.series, { more: false, total: st ? st.total : out.calyx.delta });
      bt.nextT = null;
      this.sfx('cancel');
    }
  };

  const baseUpdateBattle = UP.updateBattle;
  UP.updateBattle = function (dt) {
    baseUpdateBattle.call(this, dt);
    const bt = this.bt, out = bt && bt.result;
    if (!domainWin(out) || !out.series || !out.series.more) return;
    if (bt.nextT == null) bt.nextT = NEXT_SEC;
    bt.nextT -= dt;
    if (bt.nextT <= 0) { bt.nextT = null; this.domainNext(); }
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
