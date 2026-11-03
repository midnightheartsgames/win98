(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const POM = { x: 192, foot: 414, s: 4 };
  const MIRROR = { x: 274, y: 148, w: 82, h: 254 };
  const PANEL = { x: 372, cx: 500, w: 236 };
  const CARD = { y: 152, big: [90, 120, 72], small: [60, 84, 48], gap: 86 };
  const SPIN = 0.36, HOP = 0.5, SAY = 3.4;
  const RACK = { x: 68, y: 84 };
  const NOTE_COL = ['#e4f6ff', '#bfe6ff', '#fff4d8'];
  let room = null;

  function pill(g, x, y, w, h) {
    const r = w / 2;
    g.beginPath(); g.moveTo(x, y + h - r); g.lineTo(x, y + r); g.arc(x + r, y + r, r, Math.PI, 0); g.lineTo(x + w, y + h - r); g.arc(x + r, y + h - r, r, 0, Math.PI); g.closePath();
  }

  function paintRoom() {
    if (room) return room;
    const w = W / 2, h = HGT / 2;
    room = G.mkCanvas(w, h);
    const g = room.getContext('2d');
    g.fillStyle = '#0b1236'; g.fillRect(0, 0, w, 36);
    for (let i = 0; i < 46; i++) { g.fillStyle = i % 4 ? 'rgba(220,230,255,0.75)' : '#fff6d8'; g.fillRect(Math.floor(G.hash(i, 3, 7) * w), Math.floor(G.hash(i, 5, 7) * 34), 1, 1); }
    g.fillStyle = '#c9a45c'; for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 2, 36);
    g.fillStyle = '#6a5328'; g.fillRect(0, 34, w, 3); g.fillStyle = '#f2dc9a'; g.fillRect(0, 34, w, 1);
    const wall = g.createLinearGradient(0, 37, 0, 190);
    wall.addColorStop(0, '#2c0c10'); wall.addColorStop(1, '#4c161a');
    g.fillStyle = wall; g.fillRect(0, 37, w, 153);
    for (let i = 0; i < 10; i++) {
      const x = -8 + i * 34, red = i % 2 === 0, top = 48 + (i % 3) * 4;
      pill(g, x, top, 30, 190 - top + 15);
      g.fillStyle = red ? '#7c2428' : '#cbb690'; g.fill();
      g.save(); pill(g, x + 3, top + 3, 24, 190 - top + 9); g.clip();
      g.fillStyle = red ? '#923036' : '#dccaa6'; g.fillRect(x, top, 30, 190 - top);
      g.strokeStyle = red ? 'rgba(60,8,12,0.35)' : 'rgba(120,90,50,0.25)'; g.lineWidth = 1;
      for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(x + 15, 190); g.lineTo(x + 15 + k * 5, top); g.stroke(); }
      g.restore();
      g.strokeStyle = '#c9a45c'; g.lineWidth = 1; pill(g, x + 0.5, top + 0.5, 29, 190 - top + 14); g.stroke();
    }
    g.fillStyle = '#6a5328'; g.fillRect(0, 186, w, 6); g.fillStyle = '#c9a45c'; g.fillRect(0, 186, w, 1);
    const floor = g.createLinearGradient(0, 192, 0, h);
    floor.addColorStop(0, '#3e2418'); floor.addColorStop(1, '#160c08');
    g.fillStyle = floor; g.fillRect(0, 192, w, h - 192);
    for (let y = 196, n = 0; y < h; y += 7, n++) {
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, y, w, 1);
      for (let x = (n % 2) * 23; x < w; x += 46) g.fillRect(x, y - 6, 1, 6);
    }
    g.fillStyle = 'rgba(255,220,170,0.07)'; g.fillRect(0, 196, w, 10);
    g.fillStyle = '#4a1218'; g.beginPath(); g.ellipse(96, 208, 64, 13, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c9a45c'; g.lineWidth = 1;
    for (const [rx, ry] of [[60, 11.5], [50, 9]]) { g.beginPath(); g.ellipse(96, 208, rx, ry, 0, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#6a5328'; g.fillRect(6, 40, 2, 156); g.fillRect(60, 40, 2, 156); g.fillRect(4, 194, 6, 2); g.fillRect(58, 194, 6, 2);
    g.fillStyle = '#c9a45c'; g.fillRect(6, 40, 56, 2); g.fillRect(7, 41, 1, 154); g.fillRect(61, 41, 1, 154);
    g.fillStyle = '#3a2016'; g.fillRect(MIRROR.x / 2 - 3, MIRROR.y / 2 + MIRROR.h / 2 - 4, MIRROR.w / 2 + 6, 6);
    return room;
  }

  function garment(c, id, x, y) {
    const P = (px, py, pw, ph, col) => { c.fillStyle = col; c.fillRect(x + px * 4, y + py * 4, pw * 4, ph * 4); };
    const o = H.POM_OUTFITS[id], L = H.pomOutfitLook(id), gold = L.trim;
    P(0, -1, 1, 2, '#d8d0b8');
    P(-6, 1, 13, 1, '#6a4a2a'); P(-7, 2, 2, 1, '#6a4a2a'); P(6, 2, 2, 1, '#6a4a2a');
    if (o.look && o.look.coat === 'pajamas') {
      const stripe = (px, py, pw, ph) => { for (let i = 0; i < pw; i++) P(px + i, py, 1, ph, (px + i) % 2 ? L.stripe : L.top); };
      stripe(-5, 3, 11, 9); stripe(-6, 12, 13, 6);
      P(-6, 17, 13, 1, '#5a7eae');
      P(-3, 3, 7, 2, L.bib); P(-2, 5, 2, 1, L.bib); P(1, 5, 2, 1, L.bib); P(-3, 2, 7, 1, gold);
      P(-5, 2, 11, 1, L.beard); P(2, 10, 1, 1, gold);
      P(-8, -1, 4, 5, L.cap); P(-9, 4, 3, 5, L.cap); P(-10, 8, 4, 4, L.beard); P(-8, -1, 4, 1, gold); P(-9, 6, 1, 3, '#5a7eae');
      return;
    }
    P(-5, 3, 11, 13, L.top); P(3, 3, 3, 13, '#7c1620'); P(-5, 15, 11, 2, L.ear);
    P(-1, 3, 3, 12, L.hair);
    for (let i = 0; i < 4; i++) P(-1 + Math.floor(i / 2), 6 + i * 2, 1, 1, gold);
    P(-4, 2, 9, 1, L.beard); P(0, 3, 1, 1, gold);
    P(6, -9, 7, 8, L.top); P(11, -9, 2, 8, '#7c1620'); P(5, -2, 9, 1, '#1d1b26'); P(8, -7, 3, 3, gold); P(9, -6, 1, 1, '#dde2ea');
  }

  function note(c, x, y, col, a) {
    c.globalAlpha = a; c.fillStyle = '#0a0c20';
    c.beginPath(); c.ellipse(x + 1, y + 1, 4.2, 3.2, -0.4, 0, Math.PI * 2); c.fill();
    c.fillRect(x + 4, y - 11, 2, 12);
    c.fillStyle = col;
    c.beginPath(); c.ellipse(x, y, 4, 3, -0.4, 0, Math.PI * 2); c.fill();
    c.fillRect(x + 3, y - 12, 2, 12);
    c.beginPath(); c.moveTo(x + 5, y - 12); c.quadraticCurveTo(x + 12, y - 9, x + 9, y - 3); c.lineTo(x + 8, y - 4); c.quadraticCurveTo(x + 9, y - 8, x + 5, y - 9); c.fill();
    c.globalAlpha = 1;
  }

  function sparkle(c, x, y, r, a) {
    c.globalAlpha = a; c.fillStyle = '#fff6d8';
    c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.28, y - r * 0.28); c.lineTo(x + r, y); c.lineTo(x + r * 0.28, y + r * 0.28); c.lineTo(x, y + r); c.lineTo(x - r * 0.28, y + r * 0.28); c.lineTo(x - r, y); c.lineTo(x - r * 0.28, y - r * 0.28); c.closePath(); c.fill();
    c.globalAlpha = 1;
  }

  Object.assign(H.UI.prototype, {
    openUi_coatroom() { return this.openCoatroom(() => this.finishPending()); },

    openCoatroom(done) {
      const ui = this, g = this.game, ids = Object.keys(H.POM_OUTFITS);
      if (g.guest) { ui.sfx('deny'); ui.toast('Наряд проводнику выбирает хозяин Экспресса.'); if (done) done(); return null; }
      const first = Math.max(0, ids.indexOf(g.pomWorn()));
      return this.push({
        full: true, coatroom: true, sel: first, shown: ids[first], row: 0, t: 0,
        spin: null, hop: null, say: null, notes: [], sparks: [],
        onClose() { if (done) done(); },
        pick(i) {
          if (i < 0 || i >= ids.length || i === this.sel) return;
          this.sel = i; ui.sfx('select');
          this.spin = { t: 0, to: ids[i] };
        },
        wear() {
          const id = ids[this.sel], o = H.POM_OUTFITS[id];
          if (!g.pomOwns(id)) { ui.sfx('deny'); ui.toast(o.how || 'Этого костюма пока нет в гардеробной.'); return; }
          if (g.pomWorn() === id) { ui.sfx('deny'); return; }
          g.pomWear(id);
          ui.sfx('sparkle');
          this.wears = (this.wears || 0) + 1;
          this.hop = { t: 0 };
          this.say = { t: 0, text: g.fill(o.wear[(this.wears - 1) % o.wear.length]) };
          for (let i = 0; i < 5; i++) this.notes.push({ x: POM.x - 70 + i * 34 + G.hash(i, this.wears, 3) * 10, y: 230 + G.hash(i, this.wears, 5) * 40, t: -i * 0.18, sway: G.hash(i, this.wears, 7) * 6, col: NOTE_COL[i % NOTE_COL.length] });
        },
        toggleScenes() { g.pomSetScenes(!g.pomState().scenes); ui.sfx('select'); },
        tick(dt) {
          this.t += dt;
          if (this.spin) {
            const was = this.spin.t;
            this.spin.t += dt;
            if (was < SPIN / 4 && this.spin.t >= SPIN / 4) {
              this.shown = this.spin.to;
              for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; this.sparks.push({ x: POM.x + Math.cos(a) * 70, y: 300 + Math.sin(a) * 90, t: 0, r: 4 + (i % 3) * 2 }); }
            }
            if (this.spin.t >= SPIN) this.spin = null;
          }
          if (this.hop) { this.hop.t += dt; if (this.hop.t >= HOP) this.hop = null; }
          if (this.say) { this.say.t += dt; if (this.say.t >= SAY) this.say = null; }
          for (const n of this.notes) n.t += dt;
          this.notes = this.notes.filter(n => n.t < 2.6);
          for (const s of this.sparks) s.t += dt;
          this.sparks = this.sparks.filter(s => s.t < 0.6);
        },
        figure(c) {
          const look = H.pomOutfitLook(this.shown), k = this.spin ? this.spin.t / SPIN : 0, sx = Math.cos(k * Math.PI * 2);
          const lift = this.hop ? Math.sin(this.hop.t / HOP * Math.PI) * 16 : 0, bob = this.hop ? 0 : Math.round(Math.sin(this.t * 2.4) * 1.5);
          c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(POM.x, POM.foot + 2, 70 - lift, 11 - lift * 0.3, 0, 0, Math.PI * 2); c.fill();
          c.save();
          c.translate(POM.x, 0); c.scale(Math.abs(sx) < 0.08 ? 0.08 : sx, 1);
          G.drawFigure(c, look, 0, POM.foot - lift + bob, POM.s);
          c.restore();
        },
        mirror(c) {
          const m = MIRROR, look = H.pomOutfitLook(this.shown);
          c.save();
          pill(c, m.x, m.y, m.w, m.h); c.clip();
          const gr = c.createLinearGradient(m.x, m.y, m.x + m.w, m.y + m.h);
          gr.addColorStop(0, '#a4bede'); gr.addColorStop(0.6, '#62769e'); gr.addColorStop(1, '#3c4a72');
          c.fillStyle = gr; c.fillRect(m.x, m.y, m.w, m.h);
          G.drawFigure(c, look, m.x + m.w / 2 + 6, m.y + m.h - 26, 2.4, { flip: true, alpha: 0.42 });
          c.fillStyle = 'rgba(255,255,255,0.16)';
          c.beginPath(); c.moveTo(m.x + 10, m.y + m.h); c.lineTo(m.x + 24, m.y + m.h); c.lineTo(m.x + m.w, m.y + 70); c.lineTo(m.x + m.w, m.y + 46); c.fill();
          c.restore();
          c.strokeStyle = '#1a1208'; c.lineWidth = 6; pill(c, m.x, m.y, m.w, m.h); c.stroke();
          c.strokeStyle = C.brass; c.lineWidth = 4; pill(c, m.x, m.y, m.w, m.h); c.stroke();
          c.strokeStyle = C.brassHi; c.lineWidth = 1; pill(c, m.x - 1.5, m.y - 1.5, m.w + 3, m.h + 3); c.stroke();
        },
        rack(c) {
          const hang = ids.filter(id => id !== this.shown && g.pomOwns(id)).slice(0, 2);
          hang.forEach((id, i) => garment(c, id, RACK.x + (i - (hang.length - 1) / 2) * 52, RACK.y));
        },
        bubble(c) {
          if (!this.say) return;
          const a = Math.min(1, this.say.t * 6, (SAY - this.say.t) * 3), lines = ui.wrap(this.say.text, 210, 11).slice(0, 3);
          const w = Math.max(...lines.map(l => ui.measure(l, 11))) + 18, h = lines.length * 14 + 12, x = Math.round(Math.max(10, Math.min(PANEL.x - w - 8, POM.x - w / 2 + 30))), y = 126 - h;
          c.save(); c.globalAlpha = a;
          c.fillStyle = '#1a1208'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
          c.fillStyle = '#fff8e6'; c.fillRect(x, y, w, h);
          c.fillStyle = '#1a1208'; c.beginPath(); c.moveTo(POM.x + 10, y + h); c.lineTo(POM.x + 22, y + h); c.lineTo(POM.x + 8, y + h + 14); c.fill();
          c.fillStyle = '#fff8e6'; c.beginPath(); c.moveTo(POM.x + 11.5, y + h - 1); c.lineTo(POM.x + 20.5, y + h - 1); c.lineTo(POM.x + 9.5, y + h + 11); c.fill();
          lines.forEach((l, i) => ui.text(l, x + 9, y + 7 + i * 14, { size: 11, col: '#2a1a10', shadow: false }));
          c.restore();
        },
        card(c, id, cx, size, on, a) {
          const [w, h, b] = size, o = H.POM_OUTFITS[id], own = g.pomOwns(id), worn = g.pomWorn() === id, y = CARD.y - h / 2;
          c.save(); c.globalAlpha = a;
          if (on) { c.fillStyle = 'rgba(242,220,154,0.35)'; c.beginPath(); c.ellipse(cx, CARD.y, w / 2 + 6, h / 2 + 6, 0, 0, Math.PI * 2); c.fill(); }
          c.fillStyle = '#1a1208'; c.beginPath(); c.ellipse(cx, CARD.y, w / 2 + 2, h / 2 + 2, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = on ? C.brassHi : C.brass; c.beginPath(); c.ellipse(cx, CARD.y, w / 2, h / 2, 0, 0, Math.PI * 2); c.fill();
          c.save();
          c.beginPath(); c.ellipse(cx, CARD.y, w / 2 - 3, h / 2 - 3, 0, 0, Math.PI * 2); c.clip();
          const gr = c.createLinearGradient(0, y, 0, y + h);
          gr.addColorStop(0, o.rarity === 5 ? '#6a4c22' : '#4c2c7c'); gr.addColorStop(1, o.rarity === 5 ? '#24180c' : '#1a1034');
          c.fillStyle = gr; c.fillRect(cx - w / 2, y, w, h);
          G.drawPortrait(c, H.pomOutfitLook(id), Math.round(cx - b / 2), Math.round(y + h * 0.16), b);
          if (!own) { c.fillStyle = 'rgba(4,6,20,0.55)'; c.fillRect(cx - w / 2, y, w, h); ui.domainLock(c, cx, CARD.y - 6, C.cream); }
          c.fillStyle = 'rgba(8,8,24,0.82)'; c.fillRect(cx - w / 2, y + h * 0.72, w, h * 0.3);
          c.restore();
          ui.text(worn ? 'Надет' : own ? 'В коллекции' : 'Не получен', cx, Math.round(y + h * 0.75), { size: on ? 10 : 8, bold: on, align: 'center', col: worn ? C.ok : own ? C.cream : C.dim });
          c.restore();
        },
        panel(c) {
          const gr = c.createLinearGradient(PANEL.x - 24, 0, PANEL.x + 40, 0);
          gr.addColorStop(0, 'rgba(6,8,26,0)'); gr.addColorStop(1, 'rgba(6,8,26,0.9)');
          c.fillStyle = gr; c.fillRect(PANEL.x - 24, 0, 64, HGT);
          c.fillStyle = 'rgba(6,8,26,0.9)'; c.fillRect(PANEL.x + 40, 0, W - PANEL.x - 40, HGT);
          const qx = PANEL.cx - 116, qw = 232;
          c.fillStyle = '#05060e'; c.fillRect(qx - 1, 43, qw + 2, 40);
          c.fillStyle = 'rgba(40,46,90,0.95)'; c.fillRect(qx, 44, qw, 38);
          c.strokeStyle = 'rgba(242,220,154,0.5)'; c.strokeRect(qx + 2.5, 46.5, qw - 5, 33);
          ['Помогите Пом-Пом выбрать', 'сегодняшний наряд~'].forEach((l, i) => ui.text(l, PANEL.cx, 49 + i * 15, { size: 12, align: 'center', col: C.cream }));
          c.fillStyle = C.brass; c.fillRect(PANEL.cx - 1, 82, 2, 8);
          const order = [this.sel - 1, this.sel + 1, this.sel].filter(i => i >= 0 && i < ids.length);
          for (const i of order) {
            const d = i - this.sel, on = d === 0, cx = PANEL.cx + d * CARD.gap;
            this.card(c, ids[i], cx, on ? CARD.big : CARD.small, on, on ? 1 : 0.7);
            const [w, h] = on ? CARD.big : CARD.small;
            ui.hit(cx - w / 2, CARD.y - h / 2, w, h, () => { this.row = 0; if (on) this.wear(); else this.pick(i); });
          }
          ui.wheelZone(PANEL.x, CARD.y - 64, W - PANEL.x, 128, d => this.pick(this.sel + d));
          ids.forEach((id, i) => ui.diamond(PANEL.cx + (i - (ids.length - 1) / 2) * 14, 220, 3.5, i === this.sel ? C.brassHi : 'rgba(154,166,208,0.35)', '#0a0c20'));
          const id = ids[this.sel], o = H.POM_OUTFITS[id], own = g.pomOwns(id), worn = g.pomWorn() === id, x = PANEL.x + 16;
          const names = ui.wrap(o.name, PANEL.w, 14, true, true).slice(0, 2);
          names.forEach((l, i) => ui.text(l, PANEL.cx, 230 + i * 17, { size: 14, bold: true, serif: true, align: 'center', col: C.gold }));
          const sy = 232 + names.length * 17;
          c.fillStyle = 'rgba(201,164,92,0.5)'; c.fillRect(x, sy + 2, PANEL.w, 1);
          ui.text('★'.repeat(o.rarity) + '  Костюм Пом-Пом', x, sy + 8, { size: 10, bold: true, col: G.RARITY[o.rarity] });
          const desc = ui.wrap(o.text, PANEL.w, 10).slice(0, 8);
          desc.forEach((l, i) => ui.text(l, x, sy + 24 + i * 12, { size: 10, col: '#c8d0f0' }));
          const status = worn ? 'Пом-Пом носит этот костюм.' : own ? 'Костюм в коллекции.' : o.how || 'Костюма пока нет в гардеробной.';
          ui.wrap(status, PANEL.w, 10).slice(0, 2).forEach((l, i) => ui.text(l, x, sy + 28 + desc.length * 12 + i * 12, { size: 10, bold: true, col: worn ? C.ok : own ? C.cream : C.bad }));
          const on = g.pomState().scenes, fy = 410, focus = this.row === 1;
          if (focus) { c.fillStyle = 'rgba(242,220,154,0.15)'; c.fillRect(x - 4, fy - 3, PANEL.w + 8, 30); }
          c.fillStyle = '#05060e'; c.fillRect(x, fy, 13, 13);
          c.strokeStyle = focus ? C.brassHi : C.brass; c.strokeRect(x + 0.5, fy + 0.5, 12, 12);
          if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 3, fy + 7); c.lineTo(x + 6, fy + 10); c.lineTo(x + 11, fy + 3); c.stroke(); c.lineWidth = 1; }
          ui.text('Наряд в сюжетных сценах', x + 20, fy, { size: 11, bold: focus, col: focus ? C.gold : C.cream });
          ui.text('Ролики и передачи. В Прыжке всегда униформа.', x + 20, fy + 14, { size: 9, col: C.dim });
          ui.hit(x - 4, fy - 3, PANEL.w + 8, 30, () => { this.row = 1; this.toggleScenes(); });
          const label = !own ? 'Не получен' : worn ? 'Надет' : 'Сменить';
          ui.button(x, 444, PANEL.w, 26, label, () => { this.row = 0; this.wear(); }, { size: 12, bold: true, active: own && !worn && this.row === 0, disabled: !own || worn });
        },
        draw(c) {
          const was = c.imageSmoothingEnabled;
          c.imageSmoothingEnabled = false;
          c.drawImage(paintRoom(), 0, 0, W, HGT);
          c.imageSmoothingEnabled = was;
          this.mirror(c);
          this.rack(c);
          this.figure(c);
          for (const s of this.sparks) sparkle(c, s.x, s.y - s.t * 30, s.r * (1 - s.t / 0.6 * 0.5), 1 - s.t / 0.6);
          for (const n of this.notes) if (n.t > 0) note(c, n.x + Math.sin(n.t * 4 + n.sway) * 6, n.y - n.t * 46, n.col, Math.min(1, n.t * 4, (2.6 - n.t) * 1.6));
          this.bubble(c);
          this.panel(c);
          ui.plate(12, 10, 'Гардеробная комната Пом-Пом');
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          ui.hints([['←→', 'Костюм'], ['↑↓', 'Переключатель'], ['Enter', 'Сменить'], ['Esc', 'Выйти']], 14, HGT - 18);
        },
        key(k) {
          if (k === 'back') { ui.pop(); return; }
          if (k === 'up' || k === 'down') { const to = k === 'down' ? 1 : 0; if (to !== this.row) { this.row = to; ui.sfx('select'); } return; }
          if (this.row === 1) { if (k === 'ok' || k === 'left' || k === 'right') this.toggleScenes(); return; }
          if (k === 'left') this.pick(this.sel - 1);
          else if (k === 'right') this.pick(this.sel + 1);
          else if (k === 'ok') this.wear();
        }
      });
    }
  });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
