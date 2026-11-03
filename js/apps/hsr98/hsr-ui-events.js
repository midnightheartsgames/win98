(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const EVENTS = [
    { id: 'comet', title: 'Подарок кометы', icon: 'spass' },
    { id: 'will', title: 'Воля Первопроходца', icon: 'pass' }
  ];
  H.EVENT_TABS = EVENTS;
  const PX = 188, PY = 40, PW = 440, PH = 412;
  const STAMP = '#d0343e';
  const MAIL_VIS = 6, MAIL_ROW = 56, LETTER_STEP = 8, MAIL_GIFTS = 4;
  const WILL_PAGE = 4;
  const COMET_NAV = { right: [1, 2, 6, 4, 5, 6, 6], left: [0, 0, 1, 3, 3, 4, 2], up: [0, 1, 2, 0, 1, 2, 6], down: [3, 4, 5, 3, 4, 5, 6] };
  const pad2 = n => String(n).padStart(2, '0');
  const clockLeft = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor(s / 60) % 60) + ':' + pad2(s % 60); };
  const shortLeft = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 3600 ? 'Через ' + Math.ceil(s / 3600) + ' ч' : 'Через ' + pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); };
  const dateOf = ms => { const d = new Date(ms); return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear(); };
  const rarOf = id => (H.ITEMS[id] ? H.ITEMS[id].rar : 5);
  const rewardList = g => [...(g.jade ? [['jade', g.jade]] : []), ...Object.entries(g.items || {})].sort((a, b) => (a[0] === 'jade') - (b[0] === 'jade'));

  Object.assign(H.UI.prototype, {
    stamp(x, y, label) {
      const c = this.ctx, w = Math.round(this.measure(label, 11, true) + 16), h = 19;
      c.save();
      c.translate(Math.round(x), Math.round(y)); c.rotate(-0.16);
      c.globalAlpha = 0.92;
      c.strokeStyle = STAMP; c.lineWidth = 2; c.strokeRect(-w / 2, -h / 2, w, h);
      c.lineWidth = 1; c.strokeRect(-w / 2 + 3.5, -h / 2 + 3.5, w - 7, h - 7);
      this.text(label, 0, -6, { align: 'center', size: 11, bold: true, col: STAMP, shadow: false });
      c.restore();
    },

    rewardCell(c, id, n, x, y, s) {
      G.rarityCell(c, x, y, s, s, rarOf(id));
      G.itemIcon(c, id, x + Math.round(s * 0.1), y + Math.round(s * 0.06), Math.round(s * 0.8));
      const label = H.fmt(n), bw = Math.round(this.measure(label, 9, true) + 6);
      c.fillStyle = '#0a0a10'; c.fillRect(x + s - bw, y + s - 12, bw, 12);
      this.text(label, x + s - bw / 2, y + s - 11, { align: 'center', size: 9, bold: true, col: '#ffffff', shadow: false });
    },

    outfitCell(c, id, x, y, s) {
      G.rarityCell(c, x, y, s, s, H.OUTFITS[id].rarity);
      G.drawPortrait(c, H.outfitLook(id, this.game.state.gender), x + 2, y + 1, s - 4);
      G.menuIcon(c, 'outfit', x + s - 14, y + s - 14, 14, '#fff0c0');
    },

    pomCell(c, id, x, y, s) {
      G.rarityCell(c, x, y, s, s, H.POM_OUTFITS[id].rarity);
      G.drawPortrait(c, H.pomOutfitLook(id), x + 2, y + 1, s - 4);
      G.menuIcon(c, 'outfit', x + s - 14, y + s - 14, 14, '#fff0c0');
    },

    openEventsNotice() {
      const ui = this, g = this.game;
      g.state.flags.events_note = true;
      this.push({
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT);
          const x = W / 2 - 236, y = 104, w = 472, h = 244;
          ui.win(x, y, w, h, { title: 'Новое в телефоне' });
          G.menuIcon(c, 'events', x + 22, y + 24, 48, C.brassHi);
          ui.text('Открыты события', x + 86, y + 24, { size: 20, bold: true, serif: true, col: C.gold });
          ui.text('В телефоне (Esc) появился раздел «События».', x + 86, y + 52, { size: 11 });
          [['spass', 'Подарок кометы', 'Каждый час новый подарок: 10 Особых звёздных пропусков за 7 часов. Через 5 часов круг повторится.'], ['pass', 'Воля Первопроходца', 'Награды за уровни освоения с 5 по 70: пропуски, нефрит и особый наряд.']].forEach(([icon, title, text], i) => {
            const ry = y + 84 + i * 56;
            G.rarityCell(c, x + 26, ry, 40, 40, 5); G.itemIcon(c, icon, x + 30, ry + 3, 32);
            ui.text(title, x + 80, ry + 1, { bold: true, col: C.cream });
            ui.wrap(text, w - 104, 11).forEach((l, j) => ui.text(l, x + 80, ry + 18 + j * 14, { size: 11, col: C.sub }));
          });
          ui.button(x + 70, y + h - 46, 170, 28, 'Открыть события', () => { this.sel = 0; this.key('ok'); }, { active: this.sel === 0, bold: true, icon: 'events' });
          ui.button(x + w - 240, y + h - 46, 170, 28, 'Позже', () => { this.sel = 1; this.key('ok'); }, { active: this.sel === 1 });
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'back') ui.pop();
          if (k === 'ok') { ui.screens.pop(); if (this.sel === 0) ui.openEvents('comet'); else ui.sfx('cancel'); }
        }
      });
      this.sfx('levelup');
    },

    openEvents(id) {
      const ui = this, g = this.game, tabs = () => EVENTS.filter(e => !e.show || e.show(g));
      const startPick = e => (e && e.id === 'will' ? Math.max(0, H.TRAIL_WILL.findIndex(w => !g.state.will.includes(w.lvl))) : 0);
      const tab = Math.max(0, tabs().findIndex(e => e.id === id));
      this.push({
        full: true, tab, pick: startPick(tabs()[tab]),
        ev() { return tabs()[this.tab] || tabs()[0]; },
        setTab(i) { if (i === this.tab) return; this.tab = i; this.pick = startPick(tabs()[i]); ui.sfx('select'); },
        report(got) {
          if (!got || !got.length) { ui.sfx('deny'); return false; }
          ui.sfx('chest'); ui.toast('Получено: ' + got.join(', '));
          return true;
        },
        claim(i) {
          this.pick = i;
          const comet = this.ev().id === 'comet', got = comet ? g.claimComet(i) : g.claimWill(i);
          if (this.report(got)) return;
          const taken = comet ? g.state.comet.got[i] : g.state.will.includes(H.TRAIL_WILL[i].lvl);
          ui.toast(taken ? 'Эта награда уже получена.' : comet ? 'Подарок откроется через ' + clockLeft(g.cometOpensAt(i) - g.now()) + '.' : 'Нужен уровень освоения ' + H.TRAIL_WILL[i].lvl + '.');
        },
        claimAll() { if (!this.report(g.claimEvent(this.ev().id))) ui.toast('Сейчас нечего получать.'); },
        draw(c) {
          ui.fullBg(c, false);
          ui.plate(12, 10, 'События');
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          ui.win(PX, PY, PW, PH, { top: '#121848', bottom: '#060924' });
          tabs().forEach((e, i) => ui.eventTab(c, e, i, i === this.tab, () => this.setTab(i)));
          const ev = this.ev();
          if (ev.id === 'comet') ui.cometPage(c, this); else if (ev.id === 'will') ui.willPage(c, this); else ui[ev.page](c, this);
          ui.hints(ev.id === 'will' ? [['Q/E', 'Событие'], ['←→', 'Награда'], ['PgUp/PgDn', 'Страница'], ['Enter', 'Получить'], ['F', 'Получить всё'], ['Esc', 'Назад']] : [['Q/E', 'Событие'], ['←↑↓→', 'Награда'], ['Enter', 'Получить'], ['F', 'Получить всё'], ['Esc', 'Назад']], 12, HGT - 18);
        },
        key(k, code) {
          if (k === 'back') { ui.pop(); return; }
          if (code === 'KeyQ' || code === 'KeyE') { const n = tabs().length; this.setTab((this.tab + (code === 'KeyQ' ? n - 1 : 1)) % n); return; }
          if (code === 'KeyF') { this.claimAll(); return; }
          if ((code === 'PageUp' || code === 'PageDown') && this.ev().id === 'will') {
            const page = Math.max(0, Math.min(Math.ceil(H.TRAIL_WILL.length / WILL_PAGE) - 1, Math.floor(this.pick / WILL_PAGE) + (code === 'PageUp' ? -1 : 1)));
            if (page * WILL_PAGE !== this.pick - this.pick % WILL_PAGE) { this.pick = page * WILL_PAGE; ui.sfx('select'); }
            return;
          }
          if (this.ev().key) { this.ev().key(ui, this, k); return; }
          if (k === 'ok') { this.claim(this.pick); return; }
          if (!k || !COMET_NAV[k]) return;
          const next = this.ev().id === 'comet' ? COMET_NAV[k][this.pick] : Math.max(0, Math.min(H.TRAIL_WILL.length - 1, this.pick + (k === 'left' ? -1 : k === 'right' ? 1 : 0)));
          if (next !== this.pick) { this.pick = next; ui.sfx('select'); }
        }
      });
    },

    eventTab(c, e, i, on, pick) {
      const g = this.game, x = 12, y = PY + 4 + i * 66, w = on ? PX - 10 : PX - 18, h = 58;
      const done = e.done ? e.done(g) : e.id === 'comet' ? g.cometAllGot() : H.TRAIL_WILL.every(t => g.state.will.includes(t.lvl));
      const bg = c.createLinearGradient(x, 0, x + w, 0);
      bg.addColorStop(0, on ? '#343a82' : '#141a44'); bg.addColorStop(1, on ? '#1c2256' : '#0c1030');
      c.fillStyle = '#000'; c.fillRect(x, y, w, h);
      c.fillStyle = bg; c.fillRect(x + 1, y + 1, w - 2, h - 2);
      c.fillStyle = on ? C.brassHi : '#3a4070'; c.fillRect(x + 1, y + 1, 3, h - 2);
      if (on) { c.fillStyle = C.brass; c.fillRect(x + 1, y + 1, w - 2, 1); c.fillRect(x + 1, y + h - 2, w - 2, 1); }
      G.rarityCell(c, x + 10, y + 9, 40, 40, 5);
      G.itemIcon(c, e.icon, x + 14, y + 12, 32);
      this.wrap(e.title, 90, 12).slice(0, 2).forEach((l, j) => this.text(l, x + 58, y + 7 + j * 14, { size: 12, bold: true, col: on ? C.gold : C.cream }));
      const sub = done ? (e.id === 'comet' ? 'Снова через ' + clockLeft(g.cometRenewAt() - g.now()) : 'Всё получено') : e.sub ? e.sub(g) : e.id === 'comet' ? 'Открыто: ' + g.cometOpen() + ' из ' + H.COMET_GIFT.length : 'Ур. освоения ' + g.trailLevel();
      this.text(sub, x + 58, y + 39, { size: 10, col: done ? C.ok : C.sub });
      if (!done && g.eventReady(e.id)) this.badge(x + w - 12, y + 12);
      this.hit(x, y, w, h, pick);
    },

    cometPage(c, scr) {
      const g = this.game, cm = g.cometTick(), open = g.cometOpen(), t = this.t;
      const hx = PX + 4, hy = PY + 4, hw = PW - 8, hh = 94;
      const sky = c.createLinearGradient(hx, hy, hx + hw, hy + hh);
      sky.addColorStop(0, '#070a24'); sky.addColorStop(0.6, '#1a1848'); sky.addColorStop(1, '#3a2458');
      c.fillStyle = sky; c.fillRect(hx, hy, hw, hh);
      for (let i = 0; i < 46; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.7 * G.hash(i, 21, 3)) + ')'; c.fillRect(Math.round(hx + G.hash(i, 22, 4) * hw), Math.round(hy + G.hash(23, i, 5) * hh), 1, 1); }
      const cx = hx + hw - 70, cy = hy + 30;
      const tail = c.createLinearGradient(cx, cy, cx - 190, cy + 58);
      tail.addColorStop(0, 'rgba(255,240,200,0.75)'); tail.addColorStop(0.4, 'rgba(160,200,255,0.3)'); tail.addColorStop(1, 'rgba(120,120,255,0)');
      c.fillStyle = tail; c.beginPath(); c.moveTo(cx + 4, cy - 6); c.lineTo(cx - 190, cy + 50); c.lineTo(cx - 180, cy + 66); c.lineTo(cx + 3, cy + 7); c.closePath(); c.fill();
      const glow = c.createRadialGradient(cx, cy, 1, cx, cy, 22);
      glow.addColorStop(0, 'rgba(255,255,240,1)'); glow.addColorStop(0.3, 'rgba(255,230,170,0.7)'); glow.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = glow; c.fillRect(cx - 22, cy - 22, 44, 44);
      const r = 9 + Math.sin(t * 3) * 1.5;
      c.fillStyle = '#ffffff'; c.beginPath();
      c.moveTo(cx, cy - r); c.lineTo(cx + 1.6, cy - 1.6); c.lineTo(cx + r, cy); c.lineTo(cx + 1.6, cy + 1.6); c.lineTo(cx, cy + r); c.lineTo(cx - 1.6, cy + 1.6); c.lineTo(cx - r, cy); c.lineTo(cx - 1.6, cy - 1.6);
      c.closePath(); c.fill();
      c.fillStyle = C.brass; c.fillRect(hx, hy + hh, hw, 1);
      this.text('Подарок кометы', hx + 12, hy + 10, { size: 24, bold: true, serif: true, col: '#fff4d8' });
      const period = 'Круг: 7 часов подарков и 5 часов перерыва', pw = Math.round(this.measure(period, 10, true) + 20);
      const pill = c.createLinearGradient(0, hy + 46, 0, hy + 62);
      pill.addColorStop(0, '#f6e0a0'); pill.addColorStop(1, '#d8aa50');
      c.fillStyle = '#1a1208'; c.fillRect(hx + 11, hy + 45, pw + 2, 18);
      c.fillStyle = pill; c.fillRect(hx + 12, hy + 46, pw, 16);
      this.text(period, hx + 22, hy + 48, { size: 10, bold: true, col: '#2a1a08', shadow: false });
      this.text('Каждый час открывается следующий подарок.', hx + 12, hy + 72, { size: 11, col: '#d8d4f4' });
      const y0 = PY + 108, cw = 88, ch = 114;
      H.COMET_GIFT.forEach((n, i) => {
        const big = i === 6;
        const x = big ? PX + 300 : PX + 12 + (i % 3) * (cw + 8), y = big ? y0 : y0 + Math.floor(i / 3) * (ch + 8);
        this.cometCard(c, scr, cm, open, i, n, x, y, big ? PW - 12 - 300 : cw, big ? ch * 2 + 8 : ch, big);
      });
      const fy = y0 + ch * 2 + 18;
      this.text('Открыто: ' + open + ' из ' + H.COMET_GIFT.length, PX + 14, fy, { size: 12, bold: true, col: C.gold });
      const all = g.cometAllGot();
      const note = all ? 'Всё получено. Новый круг через ' + clockLeft(g.cometRenewAt() - g.now()) + '.' : open >= H.COMET_GIFT.length ? 'Все подарки открыты: заберите оставшиеся.' : 'Следующий подарок через ' + clockLeft(g.cometOpensAt(open) - g.now()) + '.';
      this.text(note, PX + 124, fy + 1, { size: 11, col: all ? C.ok : C.sub });
      this.text('Подарки не сгорают: новый круг начнётся через 5 ч после последнего.', PX + 14, fy + 19, { size: 10, col: C.dim });
      this.text('Особые пропуски принимают прыжки события: герои и их световые конусы.', PX + 14, fy + 33, { size: 10, col: C.dim });
    },

    cometCard(c, scr, cm, open, i, n, x, y, w, h, big) {
      const got = !!cm.got[i], ready = i < open && !got, on = scr.pick === i;
      const bg = c.createLinearGradient(0, y, 0, y + h);
      bg.addColorStop(0, ready ? '#3e3264' : '#1c2048'); bg.addColorStop(1, ready ? '#1e1838' : '#0c0f28');
      c.fillStyle = '#000'; c.fillRect(x, y, w, h);
      c.fillStyle = bg; c.fillRect(x + 1, y + 1, w - 2, h - 2);
      c.fillStyle = this.dither(); c.fillRect(x + 1, y + 1, w - 2, h - 2);
      c.strokeStyle = on ? C.brassHi : ready ? C.brass : '#3a4070'; c.lineWidth = on ? 2 : 1;
      c.strokeRect(x + (on ? 1 : 0.5), y + (on ? 1 : 0.5), w - (on ? 2 : 1), h - (on ? 2 : 1)); c.lineWidth = 1;
      c.fillStyle = ready ? 'rgba(242,220,154,0.14)' : 'rgba(255,255,255,0.05)'; c.fillRect(x + 2, y + 2, w - 4, 20);
      this.text('Час ' + (i + 1), x + w / 2, y + 5, { align: 'center', size: 12, bold: true, serif: true, col: ready ? C.gold : C.cream });
      const s = big ? 76 : 44, ix = Math.round(x + (w - s) / 2), iy = big ? y + 70 : y + 28;
      if (big || ready) {
        const gl = c.createRadialGradient(ix + s / 2, iy + s / 2, 2, ix + s / 2, iy + s / 2, s);
        gl.addColorStop(0, ready ? 'rgba(255,220,140,0.5)' : 'rgba(255,220,140,0.22)'); gl.addColorStop(1, 'rgba(255,220,140,0)');
        c.save(); c.beginPath(); c.rect(x + 1, y + 23, w - 2, h - 24); c.clip();
        c.fillStyle = gl; c.fillRect(ix - s / 2, iy - s / 2, s * 2, s * 2);
        c.restore();
      }
      this.rewardCell(c, 'spass', n, ix, iy, s);
      this.text('★★★★★', x + w / 2, iy + s + 4, { align: 'center', size: 8, col: G.RARITY[5] });
      const by = y + h - 28;
      if (got) {
        c.fillStyle = 'rgba(4,6,20,0.45)'; c.fillRect(x + 1, y + 23, w - 2, h - 24);
        this.stamp(x + w / 2, by + 10, 'Получено');
      } else if (ready) this.button(x + 6, by, w - 12, 22, 'Получить', () => scr.claim(i), { active: on, size: 11 });
      else this.text(shortLeft(this.game.cometOpensAt(i) - this.game.now()), x + w / 2, by + 5, { align: 'center', size: 11, col: C.dim });
      this.hit(x, y, w, h - 30, () => { if (scr.pick !== i) { scr.pick = i; this.sfx('select'); } });
    },

    willPage(c, scr) {
      const g = this.game, lvl = g.trailLevel();
      const hx = PX + 4, hy = PY + 4, hw = PW - 8, hh = PH - 8;
      const sky = c.createLinearGradient(0, hy, 0, hy + hh);
      sky.addColorStop(0, '#0a1440'); sky.addColorStop(0.7, '#12225a'); sky.addColorStop(1, '#1c2a5e');
      c.fillStyle = sky; c.fillRect(hx, hy, hw, hh);
      for (let i = 0; i < 70; i++) { c.fillStyle = 'rgba(220,230,255,' + (0.25 + 0.6 * G.hash(i, 31, 3)) + ')'; c.fillRect(Math.round(hx + G.hash(i, 32, 4) * hw), Math.round(hy + G.hash(33, i, 5) * hh), 1, 1); }
      c.strokeStyle = 'rgba(150,180,255,0.12)';
      for (const [a, b, r] of [[0.2, 0.3, 90], [0.8, 0.5, 130], [0.5, 0.9, 160]]) { c.beginPath(); c.arc(hx + a * hw, hy + b * hh, r, 0, Math.PI * 2); c.stroke(); }
      G.menuIcon(c, 'guide', hx + 12, hy + 10, 14, C.sub);
      this.text('Опыт новичка', hx + 30, hy + 11, { size: 10, col: C.sub });
      this.text('Воля Первопроходца', hx + 12, hy + 26, { size: 24, bold: true, serif: true, col: '#ffffff' });
      const tag = 'Постоянное событие', tw = Math.round(this.measure(tag, 10, true) + 26);
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(hx + 12, hy + 58, tw, 16);
      c.strokeStyle = C.brass; c.strokeRect(hx + 12.5, hy + 58.5, tw - 1, 15);
      c.strokeStyle = C.gold; c.beginPath(); c.arc(hx + 21, hy + 66, 4.5, 0, Math.PI * 2); c.moveTo(hx + 21, hy + 63); c.lineTo(hx + 21, hy + 66); c.lineTo(hx + 23, hy + 67); c.stroke();
      this.text(tag, hx + 30, hy + 60, { size: 10, bold: true, col: C.gold });
      const pages = Math.ceil(H.TRAIL_WILL.length / WILL_PAGE), page = Math.floor(scr.pick / WILL_PAGE), first = page * WILL_PAGE;
      const stations = H.TRAIL_WILL.slice(first, first + WILL_PAGE), prev = H.TRAIL_WILL[first - 1], next = H.TRAIL_WILL[first + WILL_PAGE];
      const owned = stations.some((w, i) => !g.state.will.includes(w.lvl) && g.willOwned(first + i));
      const top = H.OUTFITS[H.TRAIL_WILL[H.TRAIL_WILL.length - 1].give.outfit];
      const note = owned ? '«' + top.name + '» уже куплен: на 70 уровне придёт ' + H.fmt(top.price) + ' нефрита.' : page ? 'Дальний путь до 70 уровня: на последней станции ждёт особый наряд.' : 'Повышайте уровень освоения: на каждой станции пути ждёт награда.';
      this.text(note, hx + 12, hy + 82, { size: 10, col: owned ? C.gold : '#c8d4f4' });
      this.willPager(c, scr, page, pages, hx + hw - 104, hy + 10);
      const railY = PY + PH - 58, rx0 = PX + 18, rx1 = PX + PW - 18;
      const xs = stations.map((w, i) => PX + 64 + i * 104);
      const pts = [[prev ? prev.lvl : 1, rx0], ...stations.map((w, i) => [w.lvl, xs[i]]), [next ? next.lvl : H.TL_MAX, rx1]];
      let mx = lvl <= pts[0][0] ? rx0 : rx1;
      for (let i = 1; i < pts.length && lvl > pts[0][0]; i++) if (lvl <= pts[i][0]) { const [l0, x0] = pts[i - 1], [l1, x1] = pts[i]; mx = x0 + (x1 - x0) * (lvl - l0) / Math.max(1, l1 - l0); break; }
      stations.forEach((w, k) => {
        const i = first + k, x = xs[k], my = PY + 190 - k * 12, got = g.state.will.includes(w.lvl), ready = !got && lvl >= w.lvl, on = scr.pick === i, last = w.lvl >= H.TL_MAX;
        c.setLineDash([2, 3]); c.strokeStyle = got || ready ? 'rgba(242,220,154,0.6)' : 'rgba(150,170,230,0.35)';
        c.beginPath(); c.moveTo(x + 0.5, my + 108); c.lineTo(x + 0.5, railY - 6); c.stroke(); c.setLineDash([]);
        if (ready || on || last) {
          const gl = c.createRadialGradient(x, my, 10, x, my, 60);
          gl.addColorStop(0, ready ? 'rgba(255,214,120,0.35)' : on ? 'rgba(160,190,255,0.25)' : 'rgba(255,214,120,0.16)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = gl; c.fillRect(x - 60, my - 60, 120, 120);
        }
        const face = c.createRadialGradient(x - 10, my - 14, 4, x, my, 40);
        face.addColorStop(0, got ? '#2a3050' : last ? '#5a4690' : '#34469a'); face.addColorStop(1, got ? '#12162c' : last ? '#22164a' : '#101a4c');
        c.fillStyle = '#020410'; c.beginPath(); c.arc(x, my, 41, 0, Math.PI * 2); c.fill();
        c.fillStyle = face; c.beginPath(); c.arc(x, my, 39, 0, Math.PI * 2); c.fill();
        c.strokeStyle = on ? C.brassHi : ready || last ? C.brass : '#5a6aa8'; c.lineWidth = on ? 3 : 2;
        c.beginPath(); c.arc(x, my, 38, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
        c.strokeStyle = 'rgba(242,220,154,0.25)'; c.beginPath(); c.arc(x, my, 33, 0, Math.PI * 2); c.stroke();
        if (last) {
          c.strokeStyle = got ? 'rgba(201,164,92,0.4)' : C.brass; c.setLineDash([3, 3]);
          c.beginPath(); c.arc(x, my, 45, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
          for (const a of [-0.5, 0.5]) this.diamond(x + Math.sin(a) * 45, my - Math.cos(a) * 45, 3, got ? '#8a7a50' : C.brassHi, '#1a1208');
        }
        this.diamond(x, my - 38, 4, on || ready || last ? C.brassHi : '#8a94c8', '#1a1208');
        this.text('Уровень', x, my - 26, { align: 'center', size: 9, col: last && !got ? C.gold : C.sub });
        this.text('освоения', x, my - 16, { align: 'center', size: 9, col: last && !got ? C.gold : C.sub });
        this.text(String(w.lvl), x, my - 4, { align: 'center', size: 26, bold: true, serif: true, col: got ? C.dim : '#ffffff' });
        const fits = w.give.outfit && !g.willOwned(i) ? [['outfit', w.give.outfit]] : [];
        const list = fits.concat(rewardList(g.willGive(i))), cs = 30, gap = 6, total = list.length * cs + (list.length - 1) * gap;
        list.forEach(([id, n], j) => {
          const rx = Math.round(x - total / 2 + j * (cs + gap));
          if (id === 'outfit') this.outfitCell(c, n, rx, my + 46, cs); else this.rewardCell(c, id, n, rx, my + 46, cs);
        });
        const by = my + 82;
        if (got) this.stamp(x, by + 10, 'Получено');
        else if (ready) this.button(x - 44, by, 88, 22, 'Получить', () => scr.claim(i), { active: on, size: 11 });
        else this.text('С ' + w.lvl + ' уровня', x, by + 5, { align: 'center', size: 11, col: C.dim });
        if (fits.length && !got) this.text('Особый наряд', x, my + 112, { align: 'center', size: 9, col: '#ffb860' });
        this.hit(x - 44, my - 40, 88, 120, () => { if (scr.pick !== i) { scr.pick = i; this.sfx('select'); } });
      });
      this.rail(rx0, railY, rx1 - rx0, lvl >= H.TL_MAX ? 1 : (mx - rx0) / (rx1 - rx0));
      xs.forEach((x, i) => this.diamond(x, railY + 0.5, 5, lvl >= stations[i].lvl ? C.gold : '#3a4478', '#0a0c1c'));
      const label = 'Текущий уровень освоения: ' + lvl, lw = Math.round(this.measure(label, 11, true) + 18);
      const lx = Math.round(Math.max(PX + 8, Math.min(PX + PW - 8 - lw, mx - lw / 2)));
      c.fillStyle = 'rgba(4,6,20,0.8)'; c.fillRect(lx, railY + 14, lw, 20);
      c.strokeStyle = C.brass; c.strokeRect(lx + 0.5, railY + 14.5, lw - 1, 19);
      c.fillStyle = C.brass; c.beginPath(); c.moveTo(mx - 4, railY + 14); c.lineTo(mx + 4, railY + 14); c.lineTo(mx, railY + 8); c.fill();
      this.text(label, lx + lw / 2, railY + 18, { align: 'center', size: 11, bold: true, col: C.gold });
    },

    willPager(c, scr, page, pages, x, y) {
      const go = p => { if (p === page || p < 0 || p >= pages) return; scr.pick = p * WILL_PAGE; this.sfx('select'); };
      this.button(x, y, 24, 22, '◄', () => go(page - 1), { size: 10, disabled: page <= 0 });
      this.text('Стр. ' + (page + 1) + ' / ' + pages, x + 52, y + 5, { align: 'center', size: 11, bold: true, col: C.gold });
      this.button(x + 80, y, 24, 22, '►', () => go(page + 1), { size: 10, disabled: page >= pages - 1 });
      for (let p = 0; p < pages; p++) {
        const dx = x + 52 + (p - (pages - 1) / 2) * 12;
        this.diamond(dx, y + 30.5, 3, p === page ? C.brassHi : '#3a4478', '#0a0c1c');
        this.hit(dx - 5, y + 25, 10, 12, () => go(p));
      }
    },

    openMail() {
      const ui = this, g = this.game;
      const scr = this.push({
        full: true, sc: { top: 0 }, bsc: { top: 0 }, asc: { top: 0 },
        list() { return g.mailbox(); },
        cur() { const l = this.list(); return l[Math.min(this.sel, l.length - 1)] || null; },
        read() { const x = this.cur(); if (x) g.readMail(x.m.id); },
        select(i) { const n = this.list().length; if (!n) return; const v = Math.max(0, Math.min(n - 1, i)); if (v !== this.sel) { this.sel = v; ui.sfx('select'); } this.read(); },
        report(got, none) { if (!got || !got.length) { ui.sfx('deny'); if (none) ui.toast(none); return; } ui.sfx('chest'); ui.toast('Получено: ' + got.join(', ')); },
        claim() { const x = this.cur(); if (x) this.report(g.claimMail(x.m.id), x.m.give ? 'Вложения этого письма уже получены.' : 'В этом письме нет вложений.'); },
        claimAll() { this.report(g.claimAllMail(), 'Все вложения уже получены.'); this.read(); },
        askDelete() {
          const n = g.mailbox().filter(x => x.st.read && (x.st.got || !x.m.give)).length;
          if (!n) { ui.sfx('deny'); ui.toast('Прочитанных писем без вложений нет.'); return; }
          ui.confirmMailDelete(n, () => { g.deleteReadMail(); this.sel = 0; this.read(); });
        },
        draw(c) {
          const list = this.list(), cur = this.cur();
          ui.fullBg(c, false);
          ui.plate(12, 10, 'Почта');
          ui.text('Писем: ' + list.length, 90, 13, { size: 11, col: C.sub });
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          ui.win(12, 40, 226, 368, { top: '#121848', bottom: '#060924' });
          if (!list.length) ui.text('Пусто', 28, 56, { size: 11, col: C.dim });
          const vis = MAIL_VIS, bar = list.length > vis, rw = bar ? 196 : 210, first = ui.listTop(this.sc, Math.min(this.sel, list.length - 1), list.length, vis);
          ui.wheelZone(12, 40, 226, 368, d => { this.sc.top += d; });
          list.slice(first, first + vis).forEach((x, j) => {
            const i = first + j, y = 50 + j * MAIL_ROW, on = !!cur && cur.m.id === x.m.id, fresh = g.mailNew(x);
            c.fillStyle = on ? 'rgba(242,220,154,0.2)' : i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.15)'; c.fillRect(20, y, rw, 52);
            if (on) { c.fillStyle = C.brassHi; c.fillRect(20, y, 2, 52); }
            G.menuIcon(c, 'mail', 28, y + 12, 26, x.st.read ? '#7a82a8' : C.brassHi);
            ui.wrap(x.m.title, rw - 62, 11).slice(0, 2).forEach((l, k) => ui.text(l, 60, y + 6 + k * 13, { size: 11, bold: !x.st.read, col: x.st.read ? C.sub : C.cream }));
            ui.text(dateOf(x.st.at), 60, y + 35, { size: 9, col: C.dim });
            if (x.m.give && !x.st.got) G.itemIcon(c, 'jade', 20 + rw - 24, y + 30, 18);
            if (fresh && !x.st.read) ui.badge(20 + rw - 8, y + 8);
            ui.hit(20, y, rw, 52, () => this.select(i));
          });
          if (bar) ui.scrollBar(222, 50, vis * MAIL_ROW - 4, this.sc, list.length, vis);
          const any = list.some(x => x.m.give && !x.st.got), old = list.some(x => x.st.read && (x.st.got || !x.m.give));
          ui.button(12, 414, 126, 26, 'Удалить прочитанные', () => this.askDelete(), { disabled: !old, size: 10 });
          ui.button(142, 414, 96, 26, 'Получить все', () => this.claimAll(), { disabled: !any, size: 10 });
          ui.mailLetter(c, cur, () => this.claim(), this.bsc, this.asc);
          const gifts = cur && cur.m.give && this.asc.more ? [['←→', 'Вложения']] : [];
          ui.hints([['↑↓', 'Письмо'], ['PgUp/PgDn', 'Текст']].concat(gifts, [['Enter', 'Получить'], ['F', 'Получить все'], ['Del', gifts.length ? 'Удалить' : 'Удалить прочитанные'], ['Esc', 'Назад']]), 12, HGT - 18);
        },
        key(k, code) {
          if (k === 'back') { ui.pop(); return; }
          if (k === 'up' || k === 'down') { this.select(this.sel + (k === 'up' ? -1 : 1)); return; }
          if (k === 'left' || k === 'right') {
            const top = Math.max(0, Math.min(this.asc.max || 0, this.asc.top + (k === 'left' ? -1 : 1)));
            if (this.asc.more && top !== this.asc.top) { this.asc.top = top; ui.sfx('select'); }
            return;
          }
          if (code === 'PageUp' || code === 'PageDown') { this.bsc.top += (code === 'PageUp' ? -1 : 1) * Math.max(1, (this.bsc.vis || 2) - 2); return; }
          if (k === 'ok') { this.claim(); return; }
          if (code === 'KeyF') { this.claimAll(); return; }
          if (code === 'Delete') this.askDelete();
        }
      });
      scr.read();
    },

    mailLetter(c, x, claim, sc, asc) {
      const lx = 246, ly = 40, lw = 382, lh = 412;
      this.win(lx, ly, lw, lh, { top: '#141a4c', bottom: '#070a26' });
      if (asc) asc.more = false;
      if (!x) {
        G.menuIcon(c, 'mail', lx + lw / 2 - 24, 170, 48, C.dim);
        this.text('Писем нет', lx + lw / 2, 230, { align: 'center', size: 14, bold: true, serif: true, col: C.cream });
        this.wrap('Сюда приходят письма от команды игры: новости версий и подарки.', lw - 80, 11).forEach((l, i) => this.text(l, lx + lw / 2, 254 + i * 14, { align: 'center', size: 11, col: C.sub }));
        return;
      }
      const m = x.m, st = x.st;
      c.fillStyle = '#020410'; c.beginPath(); c.arc(lx + 34, ly + 36, 20, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1c2a6a'; c.beginPath(); c.arc(lx + 34, ly + 36, 18, 0, Math.PI * 2); c.fill();
      c.strokeStyle = C.brass; c.lineWidth = 2; c.beginPath(); c.arc(lx + 34, ly + 36, 17, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
      G.menuIcon(c, 'warp', lx + 22, ly + 24, 24, C.brassHi);
      const title = this.wrap(m.title, lw - 176, 14).slice(0, 2);
      title.forEach((l, i) => this.text(l, lx + 62, ly + 16 + i * 17, { size: 14, bold: true, serif: true, col: C.gold }));
      const my = ly + 20 + title.length * 17;
      this.text('От: ' + m.from, lx + 62, my, { size: 10, col: C.sub });
      this.text('Получено: ' + dateOf(st.at), lx + 62, my + 13, { size: 10, col: C.dim });
      const px = lx + lw - 44, py = ly + 42;
      c.save(); c.globalAlpha = 0.5; c.strokeStyle = STAMP; c.lineWidth = 2;
      c.beginPath(); c.arc(px, py, 24, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 1; c.beginPath(); c.arc(px, py, 19, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 3; i++) { c.beginPath(); for (let s = 0; s <= 28; s++) { const xx = px - 56 + s, yy = py - 8 + i * 8 + Math.sin(s * 0.35) * 2.5; if (s) c.lineTo(xx, yy); else c.moveTo(xx, yy); } c.stroke(); }
      this.text('ЭКСПРЕСС', px, py - 11, { align: 'center', size: 7, bold: true, col: STAMP, shadow: false });
      this.text('1.1', px, py - 3, { align: 'center', size: 10, bold: true, col: STAMP, shadow: false });
      this.text(dateOf(st.at).slice(0, 5), px, py + 8, { align: 'center', size: 7, bold: true, col: STAMP, shadow: false });
      c.restore();
      const top = my + 32;
      c.fillStyle = 'rgba(201,164,92,0.45)'; c.fillRect(lx + 14, top - 8, lw - 28, 1);
      const ay = ly + lh - 104, bottom = m.give ? ay - 16 : ly + lh - 12;
      this.letterBody(m, lx, top, lw, bottom - top, sc || { top: 0 });
      if (!m.give) return;
      c.fillStyle = 'rgba(201,164,92,0.45)'; c.fillRect(lx + 14, ay - 10, lw - 28, 1);
      this.text('Вложения', lx + 20, ay, { size: 11, bold: true, col: C.sub });
      const fits = [].concat(m.give.outfit || []).filter(id => H.OUTFITS && H.OUTFITS[id]).map(id => ['outfit', id]).concat([].concat(m.give.pom || []).filter(id => H.POM_OUTFITS && H.POM_OUTFITS[id]).map(id => ['pom', id])).concat([].concat(m.give.skin || []).filter(id => H.PHONE_SKINS && H.PHONE_SKINS[id]).map(id => ['skin', id]));
      const gifts = fits.concat(rewardList(m.give));
      const strip = this.giftStrip(gifts, m.id, asc || { top: 0 });
      if (strip.more) {
        this.text((strip.first + 1) + '–' + (strip.first + strip.shown.length) + ' из ' + gifts.length, lx + 86, ay + 1, { size: 10, col: C.dim });
        const back = strip.first > 0, next = strip.first < strip.max;
        this.button(lx + 14, ay + 26, 14, 26, '◄', back && (() => { asc.top--; this.sfx('select'); }), { size: 9, disabled: !back });
        this.button(lx + 216, ay + 26, 14, 26, '►', next && (() => { asc.top++; this.sfx('select'); }), { size: 9, disabled: !next });
        this.wheelZone(lx + 14, ay + 14, 216, 52, d => { asc.top += d; });
      }
      const gx = strip.more ? lx + 34 : lx + 20;
      strip.shown.forEach(([id, n], i) => {
        const cx = gx + i * strip.step;
        if (id === 'outfit') this.outfitCell(c, n, cx, ay + 18, strip.cs);
        else if (id === 'pom') this.pomCell(c, n, cx, ay + 18, strip.cs);
        else if (id === 'skin') this.phoneThumb(c, n, cx, ay + 18, strip.cs, strip.cs);
        else this.rewardCell(c, id, n, cx, ay + 18, strip.cs);
        if (st.got) { c.fillStyle = 'rgba(4,6,20,0.5)'; c.fillRect(cx, ay + 18, strip.cs, strip.cs); }
      });
      if (st.got) this.stamp(lx + lw - 76, ay + 42, 'Получено');
      else this.button(lx + lw - 140, ay + 30, 120, 28, 'Получить', claim, { active: true, bold: true });
    },

    giftStrip(gifts, id, asc) {
      if (asc.id !== id) { asc.id = id; asc.top = 0; }
      const more = gifts.length > MAIL_GIFTS, max = Math.max(0, gifts.length - MAIL_GIFTS);
      asc.top = Math.max(0, Math.min(max, Math.round(asc.top)));
      asc.more = more; asc.max = max;
      const first = asc.top, shown = gifts.slice(first, first + MAIL_GIFTS);
      const cs = more ? 40 : gifts.length > 3 ? 42 : 48, step = more ? 46 : gifts.length > 3 ? 48 : 58;
      return { more, max, first, shown, cs, step };
    },

    letterBody(m, lx, top, lw, h, sc) {
      const c = this.ctx, layout = width => {
        const lines = [];
        let y = 0;
        for (const para of m.text) {
          for (const l of this.wrap(para, width, 12)) { lines.push([l, y]); y += 16; }
          y += 6;
        }
        return { lines, total: y - 6 };
      };
      let { lines, total } = layout(lw - 40);
      const bar = total > h;
      if (bar) ({ lines, total } = layout(lw - 56));
      const n = Math.ceil(total / LETTER_STEP), vis = Math.floor(h / LETTER_STEP);
      if (sc.id !== m.id) { sc.id = m.id; sc.top = 0; }
      sc.vis = vis;
      sc.top = bar ? Math.max(0, Math.min(Math.round(sc.top), n - vis)) : 0;
      const off = sc.top * LETTER_STEP;
      c.save(); c.beginPath(); c.rect(lx + 8, top - 2, lw - 16, h + 2); c.clip();
      for (const [l, y] of lines) if (y + 16 > off && y < off + h) this.text(l, lx + 20, top + y - off, { size: 12, col: C.cream });
      c.restore();
      if (!bar) return;
      this.wheelZone(lx, top, lw, h, d => { sc.top += d * 2; });
      this.scrollBar(lx + lw - 24, top, h, sc, n, vis);
    },

    confirmMailDelete(n, done) {
      const ui = this;
      this.push({
        sel: 1,
        draw() {
          ui.win(W / 2 - 180, 176, 360, 124, { title: 'Удалить письма' });
          ui.text('Удалить прочитанные письма: ' + n + '?', W / 2, 198, { align: 'center', size: 12 });
          ui.text('Письма с неполученными вложениями останутся.', W / 2, 216, { align: 'center', size: 11, col: C.sub });
          ui.button(W / 2 - 160, 252, 150, 26, 'Удалить', () => { this.sel = 0; this.key('ok'); }, { active: this.sel === 0 });
          ui.button(W / 2 + 10, 252, 150, 26, 'Отмена', () => { this.sel = 1; this.key('ok'); }, { active: this.sel === 1 });
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'back') ui.pop();
          if (k === 'ok') { ui.screens.pop(); if (this.sel === 0) { done(); ui.sfx('break_obj'); ui.toast('Прочитанные письма удалены.'); } else ui.sfx('cancel'); }
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
