(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const { W, HGT, C } = H.UI_CONST;
  const PINK = '#ff9ae0', VIOLET = '#b48aff';
  const RAINBOW = ['#ff5a6a', '#ffa040', '#ffe060', '#7ae08a', '#6ac8ff', '#c08aff'];
  const MASKS = {
    punch: { face: '#ff7a3a', hi: '#ffc070', dark: '#5a1408', mouth: '#2a0604', teeth: '#fff4e0', horn: '#ffb050', glow: '#ff6a2a' },
    stat: { face: '#f4f0f8', hi: '#ffffff', dark: '#3a3448', mouth: '#1e1a2a', teeth: '#ffffff', horn: '#d8d2e4', glow: null },
    aha: { face: '#fff4fa', hi: '#ffffff', dark: '#4a1a4a', mouth: '#2a0a2a', teeth: '#ffffff', horn: '#ffd0f0', glow: '#ff9ae0' }
  };
  const HELP = [
    { title: 'Юмор', text: 'Юмор копится у всего отряда. Его дают способности Казумы и провалы в бою, свои и чужие: промах, провал, сопротивление.' },
    { title: 'Аха и Миг Ахи', text: 'Когда Юмор есть, на шкалу действий встаёт Аха. Его ход называется Миг Ахи: герои Радости применяют Навык Радости. Чем больше Юмора, тем сильнее удар.' },
    { title: 'Настоящий хит', text: 'После Мига весь Юмор становится Настоящим хитом героя Радости на два его хода. Пока Хит есть, Кража, Связывание и Великая кража добавляют Урон Радости.' }
  ];
  const isHero = u => !!u && u.side === 'ally' && !u.summon && u.path === 'elation';

  function maskArt(p, pal) {
    const sh = (pts, dx, dy) => pts.map((v, i) => v + (i % 2 ? dy : dx));
    const hornL = [9, 11, 3.5, 2.5, 6.5, 3, 12.5, 8.5], hornR = [23, 11, 28.5, 2.5, 25.5, 3, 19.5, 8.5];
    p.poly(pal.dark, sh(hornL, 0.6, 0.8)); p.poly(pal.dark, sh(hornR, 0.6, 0.8));
    p.poly(pal.horn, hornL); p.poly(pal.horn, hornR);
    p.ell(pal.dark, 16.6, 18, 11.4, 11.6);
    p.ell(pal.face, 16, 17.2, 11, 11.2);
    p.ell(pal.hi, 12.4, 11.6, 4.2, 2.4, -0.5);
    p.poly(pal.mouth, [8.4, 13.4, 13.6, 11.4, 13.4, 15.2, 9.6, 15.8]);
    p.poly(pal.mouth, [23.6, 13.4, 18.4, 11.4, 18.6, 15.2, 22.4, 15.8]);
    p.poly(pal.mouth, [7.6, 18.6, 24.4, 18.6, 22.2, 23.8, 16, 26.6, 9.8, 23.8]);
    p.poly(pal.teeth, [9.4, 19.2, 22.6, 19.2, 21.8, 20.8, 10.2, 20.8]);
    for (const x of [12.2, 15.2, 18.2]) p.rect(pal.mouth, x, 19.2, 0.7, 1.6);
    p.poly('#ff4a6a', [13.2, 24, 18.8, 24, 16, 25.8]);
  }

  function drawMask(c, kind, x, y, size) {
    const pal = MASKS[kind] || MASKS.punch, s = Math.max(8, Math.round(size));
    const cv = G.pixelArt('ahamask|' + kind + '|' + s, s, s, (p0, g) => { const p = G.pen(g, s / 32, 0, 0); maskArt(p, pal); });
    if (pal.glow) {
      const gl = c.createRadialGradient(x + s / 2, y + s / 2, 1, x + s / 2, y + s / 2, s * 0.75);
      gl.addColorStop(0, G.light(pal.glow, 0.2) + '99'); gl.addColorStop(1, pal.glow + '00');
      c.fillStyle = gl; c.fillRect(x - s * 0.3, y - s * 0.3, s * 1.6, s * 1.6);
    }
    const was = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    c.drawImage(cv, Math.round(x), Math.round(y));
    c.imageSmoothingEnabled = was;
  }

  Object.assign(G, { ahaMask: drawMask });

  const K = H.Cine.Kit;
  const { LW, LH, BAR, cl, lerp, sm, eOut, seg, hx, rgba, vgrad, glow, lighter, poly, rect, ell, ring, flash, vignette } = K;
  const FLOOR = LH - BAR, FADE = 0.25;
  const SKIN = '#f6dcc6', SKIN_D = '#d8a888', INK = '#5a3828', GLOVE = '#f4f0f8', GLOVE_D = '#b8b0c8';
  const buf = { cv: null };

  function fist(g, x, y, s, col, dark) {
    ell(g, dark, x + 0.6 * s, y + 0.8 * s, 7.4 * s, 6.4 * s);
    ell(g, col, x, y, 7 * s, 6 * s);
    for (let i = 0; i < 4; i++) { ell(g, dark, x - 4.5 * s + i * 3 * s, y - 4.6 * s, 1.7 * s, 1.5 * s); ell(g, col, x - 4.5 * s + i * 3 * s, y - 5 * s, 1.5 * s, 1.4 * s); }
    ell(g, dark, x - 6.2 * s, y + 1 * s, 2.4 * s, 3.4 * s, 0.4);
    ell(g, col, x - 6 * s, y + 0.6 * s, 2.2 * s, 3.2 * s, 0.4);
  }
  function finger(g, x, y, s, len, ang, col, dark) {
    g.save(); g.translate(x, y); g.rotate(ang);
    rect(g, dark, Math.round(-1.4 * s + 0.6 * s), Math.round(-len * s), Math.round(2.8 * s), Math.round(len * s));
    rect(g, col, Math.round(-1.4 * s), Math.round(-len * s), Math.round(2.6 * s), Math.round(len * s));
    ell(g, col, 0, -len * s, 1.3 * s, 1.3 * s);
    g.restore();
  }
  function hand(g, kind, x, y, s, glove) {
    const col = glove ? GLOVE : SKIN, dark = glove ? GLOVE_D : SKIN_D;
    if (kind === 'paper') {
      for (let i = 0; i < 4; i++) finger(g, x - 4.2 * s + i * 2.8 * s, y - 3 * s, s, 9 - Math.abs(i - 1.5) * 1.4, (i - 1.5) * 0.12, col, dark);
      finger(g, x - 6.4 * s, y + 1 * s, s, 6, -1.0, col, dark);
      ell(g, dark, x + 0.6 * s, y + 0.8 * s, 7 * s, 6.2 * s);
      ell(g, col, x, y, 6.8 * s, 6 * s);
    } else {
      if (kind === 'scissors') { finger(g, x - 2.6 * s, y - 3 * s, s, 10, -0.28, col, dark); finger(g, x + 1.4 * s, y - 3 * s, s, 10, 0.28, col, dark); }
      fist(g, x, y, s, col, dark);
    }
    if (glove) { rect(g, '#ff7ad0', Math.round(x - 6 * s), Math.round(y + 5 * s), Math.round(12 * s), Math.round(3 * s)); }
  }
  function confettiRain(g, T, n, a) {
    const x0 = g._wide ? -53 : 0, w = g._wide ? 427 : LW;
    for (let i = 0; i < n; i++) {
      const ph = (T * (0.18 + hx(i, 5, 71) * 0.16) + hx(i, 3, 71)) % 1, x = x0 + hx(i, 4, 71) * w + Math.sin(T * 2 + i) * 6, y = ph * (LH + 20) - 10;
      rect(g, rgba(RAINBOW[i % RAINBOW.length], a * (0.5 + 0.4 * Math.sin(ph * Math.PI))), Math.round(x), Math.round(y), 1 + Math.round(Math.abs(Math.cos(T * 5 + i)) * 2), 2);
    }
  }
  function partyBg(S, tint) {
    const g = S.g, x0 = g._wide ? -54 : 0, span = g._wide ? 528 : 420;
    vgrad(g, 0, LH, [[0, '#1a0628'], [0.55, tint || '#4a1446'], [1, '#12041a']]);
    for (let i = 0; i < (g._wide ? 10 : 8); i++) { const off = ((S.T * 160 + i * 52) % span) + x0 - 60; poly(g, rgba(i % 2 ? '#ff9ae0' : '#b48aff', 0.06), [off, 0, off + 22, 0, off - 90, LH, off - 112, LH]); }
    confettiRain(g, S.T, g._wide ? 54 : 40, 1);
  }

  const CUTS = {
    kazuma: {
      d: 1.5, title: 'НАВЫК РАДОСТИ', name: 'Камень, ножницы, бумага!', line: 'Камень, ножницы, бумага! Со мной не выиграть.',
      calls: [[0.08, 'КАМЕНЬ…'], [0.48, 'НОЖНИЦЫ…'], [0.88, 'БУМАГА!']],
      sfx: [[0.08, 'clap'], [0.48, 'clap'], [0.88, 'snap'], [0.92, 'cheer'], [1.0, 'glint']],
      draw(S, P) {
        const g = S.g, t = S.t, rev = seg(t, 0.88, 1.0), win = seg(t, 1.0, 1.5);
        partyBg(S);
        const mb = Math.sin(S.T * 9) * 2;
        drawMask(g, 'aha', 214, 22 + mb, 78);
        lighter(g, () => glow(g, 253, 60, 60, '#ff9ae0', 0.25));
        const pump = t < 0.88 ? Math.abs(Math.sin(((t - 0.08) / 0.4) * Math.PI)) : 0;
        const bob = t < 0.88 ? pump * 10 : 0;
        g.save(); g.translate(96, FLOOR + 10 + bob * 0.3);
        S.bust(P.look, 0, 0, 160, t > 0.88 ? { v: { mouth: 'open' } } : {});
        g.restore();
        const hx0 = 168, hy0 = 136 - bob;
        if (t < 0.88) hand(g, 'rock', hx0, hy0, 2.4, false);
        else {
          lighter(g, () => glow(g, hx0, hy0, 40 * (1 - win * 0.5), '#fff0c0', 0.8 * (1 - win * 0.6)));
          hand(g, 'paper', hx0, hy0, 2.6 + 0.4 * eOut(rev), false);
        }
        const gx = 262, gy = 140 - (t < 0.88 ? bob : 0);
        if (t < 0.88) hand(g, 'rock', gx, gy, 2.2, true);
        else {
          hand(g, 'rock', gx + win * 10, gy + win * 18, 2.2, true);
          if (win > 0) for (let i = 0; i < 18; i++) { const q = hx(i, 7, 73) * Math.PI * 2, r = eOut(win) * (30 + hx(i, 8, 73) * 70); rect(g, rgba(RAINBOW[i % 6], 1 - win), Math.round(hx0 + Math.cos(q) * r), Math.round(hy0 + Math.sin(q) * r), 3, 2); }
        }
        if (t >= 0.88 && t < 0.98) flash(g, '#ffffff', 0.7 * (1 - seg(t, 0.88, 0.98)));
        vignette(g, 0.35);
      }
    },
    laugh: {
      d: 1.2, title: 'АХА', name: 'Да будет смех', line: 'Ха-ха-ха-ха!',
      sfx: [[0, 'ult'], [0.2, 'cheer'], [0.6, 'clap'], [0.8, 'clap']],
      draw(S) {
        const g = S.g, t = S.t, k = eOut(seg(t, 0, 0.35));
        vgrad(g, 0, LH, [[0, '#2a0630'], [1, '#100418']]);
        lighter(g, () => { for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + S.T * 0.8; poly(g, rgba(RAINBOW[i % 6], 0.12), [LW / 2, LH / 2, LW / 2 + Math.cos(a) * 300, LH / 2 + Math.sin(a) * 300, LW / 2 + Math.cos(a + 0.18) * 300, LH / 2 + Math.sin(a + 0.18) * 300]); } });
        confettiRain(g, S.T, 50, 1);
        const s = lerp(30, 120, k) + Math.sin(S.T * 14) * 4 * k;
        drawMask(g, 'aha', LW / 2 - s / 2, LH / 2 - s / 2 - 10 + Math.sin(S.T * 18) * 2 * k, s);
        for (let i = 0; i < 3; i++) ring(g, rgba('#ffd0f0', 0.5 * (1 - seg(t, 0.2 + i * 0.25, 0.6 + i * 0.25))), 1, LW / 2, LH / 2 - 10, 20 + seg(t, 0.2 + i * 0.25, 0.6 + i * 0.25) * 140);
        vignette(g, 0.3);
      },
      over(ui, t) { for (let i = 0; i < 12; i++) { const a = hx(i, 2, 79) * Math.PI * 2, r = 120 + seg(t, i * 0.05, 0.6 + i * 0.05) * 160; if (t < i * 0.05) continue; ui.text('ХА', W / 2 + Math.cos(a) * r, HGT / 2 - 20 + Math.sin(a) * r * 0.6, { align: 'center', size: 14 + (i % 3) * 8, bold: true, col: RAINBOW[i % 6] }); } }
    },
    aha: {
      d: 1.0, title: 'МИГ АХИ', name: 'Аха выходит на сцену', line: '',
      sfx: [[0, 'ult'], [0.4, 'glint']],
      draw(S) {
        const g = S.g, t = S.t, k = eOut(seg(t, 0, 0.45));
        partyBg(S, '#3a0e3a');
        const x = lerp(16, LW / 2, k), y = lerp(30, 92, k), s = lerp(20, 90, k);
        lighter(g, () => glow(g, x, y, s, '#ff9ae0', 0.5 * k));
        drawMask(g, 'aha', x - s / 2, y - s / 2, s);
        for (let i = 0; i < 2; i++) ring(g, rgba('#ff9ae0', 0.6 * (1 - seg(t, 0.4 + i * 0.2, 0.9 + i * 0.2))), 1, LW / 2, 92, 30 + seg(t, 0.4 + i * 0.2, 0.9 + i * 0.2) * 100);
      },
      over(ui, t, P) { if (t > 0.45) { ui.text('МИГ АХИ', W / 2, 300, { align: 'center', size: 30, bold: true, serif: true, col: PINK }); ui.text('Юмор ' + P.punch + ' · ×' + H.punchMul(P.punch).toFixed(2).replace('.', ','), W / 2, 338, { align: 'center', size: 13, col: C.cream }); } }
    },
    card: {
      d: 1.3, title: 'МИГ АХИ', name: 'Итог', line: '',
      sfx: [[0, 'star4']],
      draw(S) { partyBg(S, '#2a0a2a'); },
      over(ui, t, P) {
        const w = 300, x = W / 2 - w / 2, y = 190, c = ui.ctx;
        c.fillStyle = 'rgba(14,6,26,0.92)'; c.fillRect(x, y, w, 76);
        c.strokeStyle = PINK; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, 74); c.lineWidth = 1;
        drawMask(c, 'aha', x + 10, y + 12, 34);
        ui.text('Миг Ахи', x + 52, y + 10, { size: 13, bold: true, serif: true, col: PINK });
        ui.rainbowText(H.fmt(P.total) + ' урона', x + 162, y + 28, 20);
        ui.text('Юмор ' + P.punch + ' → Настоящий хит +' + P.punch, W / 2, y + 56, { size: 11, align: 'center', col: C.cream });
      }
    }
  };

  class ElationShow {
    constructor(ui, id, o = {}) {
      this.ui = ui; this.game = ui.game; this.id = id; this.def = CUTS[id];
      const look = G.lookOf(id === 'laugh' || id === 'aha' || id === 'card' ? 'kazuma' : id, ui.game);
      this.P = { look, punch: o.punch || 0, total: o.total || 0 };
      this.t = 0; this.T = 0; this.cue = 0; this.fade = 0; this.done = false;
    }
    get length() { return this.def.d + FADE; }
    get fading() { return this.fade > 0; }
    tick(dt) {
      if (this.done) return;
      if (this.fade > 0) { this.fade += dt; if (this.fade >= FADE) this.done = true; return; }
      this.t += dt; this.T += dt;
      const cues = this.def.sfx || [];
      while (this.cue < cues.length && cues[this.cue][0] <= this.t) this.ui.sfx(cues[this.cue++][1]);
      if (this.t >= this.def.d) this.fade = 0.001;
    }
    skip() { if (!this.fade) this.fade = 0.001; }
    render() {
      const wide = !!(this.ui && this.ui.wide && this.ui.wide()), rw = wide ? 427 : LW, ox = (rw - LW) >> 1;
      const cv = buf.cv && buf.cv.width === rw ? buf.cv : (buf.cv = G.mkCanvas(rw, LH)), g = cv.getContext('2d');
      g._wide = wide;
      g.save();
      g.imageSmoothingEnabled = false;
      if (ox) g.translate(ox, 0);
      const S = H.Cine.stage(g, this.game, this.T);
      S.t = Math.min(this.t, this.def.d); S.d = this.def.d;
      this.def.draw(S, this.P);
      if (this.t < 0.1) flash(g, '#ffffff', 0.6 * (1 - this.t / 0.1));
      g.restore();
      H.Cine.dither(g);
      return cv;
    }
    paint(c) {
      const ui = this.ui, d = this.def, t = Math.min(this.t, d.d), cv = this.render(), x0 = ui.left || 0, vw = ui.vw || W;
      c.save();
      c.globalAlpha = this.fade > 0 ? 1 - cl(this.fade / FADE) : 1;
      c.imageSmoothingEnabled = false;
      c.drawImage(cv, x0, 0, vw, HGT);
      c.fillStyle = '#000000'; c.fillRect(x0, 0, vw, BAR * 2); c.fillRect(x0, HGT - BAR * 2, vw, BAR * 2);
      c.fillStyle = rgba(PINK, 0.7); c.fillRect(x0, BAR * 2 - 1, vw, 1); c.fillRect(x0, HGT - BAR * 2, vw, 1);
      ui.text(d.title, x0 + 14, 18, { size: 10, bold: true, col: '#ffd0f0' });
      ui.text(d.name, x0 + 14, 32, { size: 13, bold: true, serif: true, col: C.gold });
      if (d.calls) { let call = null; for (const [at, s] of d.calls) if (t >= at) call = [at, s]; if (call) { const k = eOut(cl((t - call[0]) / 0.12)); ui.text(call[1], W / 2, 76 - (1 - k) * 12, { align: 'center', size: 26 + (call[1].endsWith('!') ? 6 : 0), bold: true, serif: true, col: call[1].endsWith('!') ? '#fff0a0' : PINK }); } }
      if (d.over) d.over(ui, t, this.P);
      if (d.line && t > 0.1) { c.globalAlpha *= cl((t - 0.1) / 0.15); ui.text(this.id === 'kazuma' ? 'Казума' : 'Аха', W / 2, HGT - BAR * 2 + 10, { align: 'center', size: 11, bold: true, serif: true, col: C.gold }); ui.text(d.line, W / 2, HGT - BAR * 2 + 27, { align: 'center', size: 13, col: C.cream }); }
      c.restore();
    }
    draw(c) {
      const ui = this.ui;
      this.paint(c);
      if (!this.fade) { ui.hints([['Esc', 'Пропустить']], (ui.right || W) - 12, 20, { align: 'right' }); ui.hit(ui.left || 0, 0, ui.vw || W, HGT, () => this.skip()); }
    }
  }

  class ElationChain {
    constructor(list) { this.list = list; this.i = 0; }
    get cur() { return this.list[this.i]; }
    get done() { return this.i >= this.list.length; }
    get fading() { return false; }
    get length() { return this.list.reduce((a, s) => a + s.length, 0); }
    tick(dt) { if (this.done) return; this.cur.tick(dt); if (this.cur.done) this.i++; }
    skip() { if (!this.done) this.cur.skip(); }
    draw(c) { if (!this.done) this.cur.draw(c); }
  }

  const DEBUG_CUTS = [['kazuma', 'Казума: Камень, ножницы, бумага!'], ['laugh', 'Да будет смех'], ['instant', 'Миг Ахи целиком']];
  const DEBUG_PUNCH = [1, 10, 20, 50, 240];
  const ahaPreview = { key: null, shows: null, cv: null };


  Object.assign(H.UI.prototype, {
    elUi() { const bt = this.bt; return bt.el || (bt.el = { punch: 0, shown: 0, bump: 0, fx: null, card: null, laugh: null, banger: new Map(), on: false }); },

    rainbowText(text, x, y, size) {
      let cx = x - this.measure(text, size, true) / 2;
      const shift = Math.floor(this.t * 10);
      [...text].forEach((ch, i) => {
        this.text(ch, cx, y, { size, bold: true, col: RAINBOW[(i + shift) % RAINBOW.length] });
        cx += this.measure(ch, size, true);
      });
    },

    confetti(n, x0, y0, spread) {
      for (let i = 0; i < n; i++) this.particles.push({ x: x0 + (Math.random() - 0.5) * spread, y: y0, vx: (Math.random() - 0.5) * 240, vy: -Math.random() * 220 - 40, g: 260, t: 0.9 + Math.random() * 0.6, col: RAINBOW[i % RAINBOW.length] });
    },

    elationEvent(e) {
      const bt = this.bt, E = this.elUi();
      switch (e.t) {
        case 'punch':
          E.punch = e.v;
          E.seen = true;
          if (e.add > 0) E.bump = 0.35;
          if (!e.quiet && e.add > 0) { const b = this.game.battle, at = (b && b.elHeroes()[0]) || e.src; if (at) this.floatAt(at, 'Юмор +' + e.add, PINK, 10); }
          return true;
        case 'aha':
          E.on = !!e.on;
          if (e.on && !(this.game.state.flags && this.game.state.flags.seen_elation) && !bt.auto) bt.elHelp = { page: 0, first: true };
          return true;
        case 'ahaStart':
          E.fx = { t: 0, d: 0.9, punch: e.punch };
          bt.shake = Math.max(bt.shake, 6);
          this.confetti(46, W / 2, 120, 420);
          this.sfx('ult');
          e.hold = 0.9;
          return true;
        case 'elCut':
          e.hold = 0.25;
          if (CUTS[e.id] && this.elCineOn(e.id)) { bt.ult = new ElationShow(this, e.id, { punch: E.punch }); e.hold = 0.01; }
          return true;
        case 'rps':
          this.floatAt(e.tgt, e.hand, e.win ? '#9affb0' : '#d0c8e0', 11);
          e.hold = 0.12;
          return true;
        case 'ahaEnd':
          E.card = { t: 1.6, total: e.total, punch: e.punch };
          this.confetti(24, W / 2, 140, 300);
          this.sfx('star4');
          e.hold = 1.1;
          return true;
        case 'banger':
          E.banger.set(e.u, e.v);
          if (e.add > 0) this.floatAt(e.u, 'Хит +' + e.add, PINK, 10);
          return true;
        case 'laugh':
          if (this.elCineOn('laugh')) { bt.ult = new ElationShow(this, 'laugh', { punch: E.punch }); e.hold = 0.01; return true; }
          E.laugh = { t: 1.3, ha: Array.from({ length: 14 }, (_, i) => ({ x: 60 + Math.random() * (W - 120), y: 90 + Math.random() * 180, s: 12 + Math.floor(Math.random() * 3) * 6, d: i * 0.06 })) };
          bt.shake = Math.max(bt.shake, 5);
          this.sfx('ult');
          e.hold = 1.0;
          return true;
        case 'laughHit':
          bt.flash.set(e.u, 0.15);
          e.hold = 0.07;
          return true;
      }
      return false;
    },

    elCineOn(id) {
      const mode = this.options.ultCine || 'on', bt = this.bt;
      if (mode === 'off') return false;
      if (mode === 'first' && bt.ultSeen.has('el:' + id)) return false;
      bt.ultSeen.add('el:' + id);
      return true;
    },

    debugAhaForm(st) {
      const ui = this, A = st.aha || (st.aha = { i: 0, p: 2 });
      return {
        rows: [
          { label: 'Сценка', value: DEBUG_CUTS[A.i][1], col: PINK, step: k => { A.i = (A.i + k + DEBUG_CUTS.length) % DEBUG_CUTS.length; } },
          { label: 'Юмор', value: String(DEBUG_PUNCH[A.p]) + ' · ×' + H.punchMul(DEBUG_PUNCH[A.p]).toFixed(2).replace('.', ','), step: k => { A.p = H.clamp(A.p + k, 0, DEBUG_PUNCH.length - 1); } }
        ],
        acts: [
          { label: 'Смотреть', icon: 'warp', view: true, fn: () => ui.openDebugAha(st, false) },
          { label: 'Все подряд', icon: 'team', view: true, fn: () => ui.openDebugAha(st, true) }
        ]
      };
    },

    debugAhaCatalog(c, st, x, y, w) {
      const A = st.aha || (st.aha = { i: 0, p: 2 });
      this.list(x, y, w, DEBUG_CUTS.map(([id, name]) => ({ label: name, col: PINK, right: id === 'instant' ? 'цепочка' : (CUTS[id].d + FADE).toFixed(1).replace('.', ',') + ' с', rcol: C.sub, icon: (cc, ix, iy) => drawMask(cc, id === 'kazuma' ? 'punch' : 'aha', ix, iy - 9, 18), iconW: 22 })), A.i, { rowH: 19, max: 19, size: 11, focus: st.row === 1, onClick: i => { A.i = i; st.row = 1; this.sfx('select'); } });
    },

    debugAhaNotes(st) {
      const A = st.aha || (st.aha = { i: 0, p: 2 }), [id, name] = DEBUG_CUTS[A.i], p = DEBUG_PUNCH[A.p], sec = v => v.toFixed(1).replace('.', ',') + ' с';
      return [
        '«' + name + '» · ' + (id === 'instant' ? 'цепочка из трёх сценок' : sec(CUTS[id].d + FADE)),
        'Юмор ' + p + ': урон Мига ×' + H.punchMul(p).toFixed(2).replace('.', ',') + '.',
        'Сценка не идёт в бой и не меняет сохранение.'
      ];
    },

    debugAhaPreview(c, st, x, y) {
      const wide = !!(this.wide && this.wide()), pw = wide ? 288 : 224, ph = wide ? 162 : 168;
      const A = st.aha || (st.aha = { i: 0, p: 2 }), id = DEBUG_CUTS[A.i][0], px = x + Math.round((316 - pw) / 2), py = y + 12 + Math.round((168 - ph) / 2);
      c.fillStyle = '#000000'; c.fillRect(px - 1, py - 1, pw + 2, ph + 2);
      const key = id + '|' + A.p;
      if (ahaPreview.key !== key) {
        const made = this.debugAhaShow(id, DEBUG_PUNCH[A.p]);
        ahaPreview.key = key;
        ahaPreview.shows = made instanceof ElationChain ? made.list : [made];
      }
      const shows = ahaPreview.shows, total = shows.reduce((a, s) => a + s.def.d, 0);
      let at = this.t % total, k = 0;
      while (k < shows.length - 1 && at >= shows[k].def.d) at -= shows[k++].def.d;
      const vw = this.vw || W, x0 = this.left || 0;
      const show = shows[k], cv = ahaPreview.cv && ahaPreview.cv.width === vw ? ahaPreview.cv : (ahaPreview.cv = G.mkCanvas(vw, HGT)), pc = cv.getContext('2d'), main = this.ctx;
      show.t = show.T = at;
      pc.clearRect(0, 0, vw, HGT);
      pc.save();
      if (x0) pc.translate(-x0, 0);
      this.ctx = pc;
      try { show.paint(pc); } finally { this.ctx = main; pc.restore(); }
      const was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = true;
      c.drawImage(cv, px, py, pw, ph);
      c.imageSmoothingEnabled = was;
      c.strokeStyle = PINK; c.strokeRect(px - 0.5, py - 0.5, pw + 1, ph + 1);
    },

    debugAhaShow(id, punch) {
      if (id !== 'instant') return new ElationShow(this, id, { punch });
      const total = Math.round(320 * H.punchMul(punch) * 3);
      return new ElationChain([new ElationShow(this, 'aha', { punch }), new ElationShow(this, 'kazuma', { punch }), new ElationShow(this, 'card', { punch, total })]);
    },

    openDebugAha(st, all) {
      const ui = this, A = st.aha || (st.aha = { i: 0, p: 2 });
      const scr = {
        full: true, debug: true, show: null, all: !!all,
        begin(d) {
          if (d) { A.i = (A.i + d + DEBUG_CUTS.length) % DEBUG_CUTS.length; ui.sfx('select'); }
          this.show = ui.debugAhaShow(DEBUG_CUTS[A.i][0], DEBUG_PUNCH[A.p]);
        },
        stop() { this.show = null; this.all = false; },
        next() { if (this.all && A.i < DEBUG_CUTS.length - 1) this.begin(1); else this.stop(); },
        tick(dt) { if (this.show) { this.show.tick(dt); if (this.show.done) this.next(); } },
        draw(c) {
          if (this.show) {
            this.show.draw(c);
            if (this.all) ui.text('Подряд ' + (A.i + 1) + ' / ' + DEBUG_CUTS.length + ' · Backspace: стоп', W / 2, HGT - 14, { align: 'center', size: 10, col: C.sub });
            return;
          }
          ui.fullBg(c, false);
          const x = W / 2 - 170, y = 168;
          ui.win(x, y, 340, 118, { alpha: 0.92, border: PINK });
          ui.text('Миг Ахи', W / 2, y + 14, { align: 'center', size: 11, col: C.sub });
          ui.text(DEBUG_CUTS[A.i][1], W / 2, y + 32, { align: 'center', size: 15, bold: true, serif: true, col: PINK });
          ui.text('Сценка закончилась.', W / 2, y + 56, { align: 'center', size: 11, col: C.dim });
          ui.button(x + 24, y + 80, 140, 24, 'Ещё раз', () => this.key('ok', 'Enter'), { size: 11, bold: true, icon: 'warp' });
          ui.button(x + 176, y + 80, 140, 24, 'В меню', () => this.key('back', 'Escape'), { size: 11 });
          ui.hints([['Enter', 'Ещё раз'], ['←→', 'Сценка'], ['Esc', 'В меню']], 12, HGT - 18);
        },
        key(k, code) {
          if (this.show) {
            if (code === 'Backspace') { this.stop(); return; }
            if (k === 'left' || k === 'right') { this.begin(k === 'left' ? -1 : 1); return; }
            if (k === 'ok' || k === 'back') this.show.skip();
            return;
          }
          if (k === 'ok') this.begin(0);
          else if (k === 'left' || k === 'right') this.begin(k === 'left' ? -1 : 1);
          else if (k === 'back') { ui.pop(); ui.sfx('cancel'); }
        }
      };
      this.push(scr);
      scr.begin(0);
      return scr;
    },

    elationUpdate(dt) {
      const E = this.bt && this.bt.el;
      if (!E) return;
      const speed = (this.options.battleSpeed || 1) * (this.held.includes('ShiftLeft') || this.held.includes('ShiftRight') ? 2 : 1);
      if (E.bump > 0) E.bump = Math.max(0, E.bump - dt);
      if (E.shown !== E.punch) E.shown = E.punch;
      if (E.fx) { E.fx.t += dt * speed; if (E.fx.t > E.fx.d + 0.3) E.fx = null; }
      if (E.card) { E.card.t -= dt * speed; if (E.card.t <= 0) E.card = null; }
      if (E.laugh) { E.laugh.t -= dt * speed; if (E.laugh.t <= 0) E.laugh = null; }
    },

    ahaIcon(c, x, y, size) {
      const gr = c.createLinearGradient(0, y, 0, y + size);
      gr.addColorStop(0, '#ff7ad0'); gr.addColorStop(1, '#4a1a6a');
      c.fillStyle = gr; c.fillRect(x, y, size, size);
      drawMask(c, 'aha', x + size * 0.08, y + size * 0.06, size * 0.84);
    },

    drawPunch(c, b, x, y) {
      if (!b.el && !b.allies.some(isHero)) return;
      const E = this.elUi(), v = E.seen ? E.punch : b.el ? b.el.punch : 0, s = 18 + Math.round(E.bump * 10);
      const mx = x + 96, my = y - 2;
      drawMask(c, 'punch', mx + 9 - s / 2, my + 9 - s / 2, s);
      this.text(String(v), mx + 21, my - 1, { size: 16, bold: true, serif: true, col: PINK });
      this.text('×' + H.punchMul(v).toFixed(2).replace('.', ','), mx + 21, my + 16, { size: 8, bold: true, col: '#ffd0f0' });
      this.text('юмор', mx + 22 + this.measure(String(v), 16, true, true), my + 5, { size: 8, col: C.sub });
      this.hit(mx, my, 44, 24, () => { if (!this.bt.elHelp) { this.bt.elHelp = { page: 0 }; this.sfx('confirm'); } });
    },

    elationCard(c, u, x, y, tx) {
      if (!isHero(u)) return tx;
      const b = this.game.battle || this.lastBattle, E = this.elUi();
      const v = E.banger.has(u) ? E.banger.get(u) : b ? b.bangerOf(u) : 0;
      drawMask(c, 'stat', x + 6, y + 87, 11);
      this.text('Хит ' + v, x + 19, y + 88, { size: 9, bold: true, col: v > 0 ? PINK : C.dim });
      return x + 24 + this.measure('Хит ' + v, 9, true);
    },

    skillPunchTag(u, i, x, yy, w) {
      const ab = u.kit.skills && u.kit.skills[i];
      if (!isHero(u) || !ab || !ab.punch) return;
      this.text('+' + ab.punch, x + w - 6, yy, { size: 9, bold: true, align: 'right', col: PINK });
    },

    elationOver(c) {
      const bt = this.bt, E = bt && bt.el;
      if (E && E.fx) {
        const f = E.fx, k = Math.min(1, f.t / 0.35), out = Math.max(0, (f.t - f.d) / 0.3), a = 1 - out;
        c.globalAlpha = 0.45 * a; c.fillStyle = '#1a0a24'; c.fillRect(0, 0, W, HGT); c.globalAlpha = a;
        const sx = 32, sy = 50, tx = W / 2, ty = 124, s = 28 + 52 * k;
        const mx = sx + (tx - sx) * k, my = sy + (ty - sy) * k;
        drawMask(c, 'aha', mx - s / 2, my - s / 2 + Math.sin(this.t * 8) * 2, s);
        if (k >= 1) {
          this.text('МИГ АХИ', W / 2, 166, { align: 'center', size: 30, bold: true, serif: true, col: PINK });
          this.text('Юмор ' + f.punch + ' · ×' + H.punchMul(f.punch).toFixed(2).replace('.', ','), W / 2, 202, { align: 'center', size: 13, col: C.cream });
        }
        c.globalAlpha = 1;
      }
      if (E && E.card) {
        const a = Math.min(1, E.card.t * 3), w = 300, x = W / 2 - w / 2, y = 112;
        c.globalAlpha = a;
        c.fillStyle = 'rgba(14,6,26,0.92)'; c.fillRect(x, y, w, 76);
        c.strokeStyle = PINK; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, 74); c.lineWidth = 1;
        c.fillStyle = VIOLET; c.fillRect(x + 6, y + 6, w - 12, 1);
        drawMask(c, 'aha', x + 10, y + 12, 34);
        this.text('Миг Ахи', x + 52, y + 10, { size: 13, bold: true, serif: true, col: PINK });
        this.rainbowText(H.fmt(E.card.total) + ' урона', x + 162, y + 28, 20);
        this.text('Юмор ' + E.card.punch + ' → Настоящий хит +' + E.card.punch, W / 2, y + 56, { size: 11, align: 'center', col: C.cream });
        c.globalAlpha = 1;
      }
      if (E && E.laugh) {
        const L = E.laugh, a = Math.min(1, L.t * 2);
        c.globalAlpha = a;
        drawMask(c, 'aha', W / 2 - 50, 60, 100);
        for (const h of L.ha) { const age = 1.3 - L.t - h.d; if (age < 0) continue; this.text('ХА', h.x, h.y - age * 30, { size: h.s, bold: true, align: 'center', col: RAINBOW[Math.floor(h.x) % RAINBOW.length] }); }
        this.text('ДА БУДЕТ СМЕХ', W / 2, 172, { align: 'center', size: 28, bold: true, serif: true, col: PINK });
        c.globalAlpha = 1;
      }
      if (bt && bt.elHelp) this.drawElHelp(c);
    },

    drawElHelp(c) {
      const h = this.bt.elHelp, page = HELP[h.page], w = 380, x = W / 2 - w / 2, y = 120;
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, W, HGT);
      this.win(x, y, w, 196, { title: 'Путь Радости · ' + (h.page + 1) + '/' + HELP.length, border: PINK });
      drawMask(c, h.page === 0 ? 'punch' : h.page === 1 ? 'aha' : 'stat', x + 18, y + 40, 48);
      this.text(page.title, x + 80, y + 40, { size: 14, bold: true, serif: true, col: PINK });
      this.wrap(page.text, w - 100, 11).forEach((l, i) => this.text(l, x + 80, y + 64 + i * 15, { size: 11, col: C.cream }));
      this.text(h.page < HELP.length - 1 ? 'Enter: дальше · Esc: закрыть' : 'Enter: в бой', W / 2, y + 170, { size: 10, align: 'center', col: C.sub });
      this.hit(0, 0, W, HGT, () => this.elHelpKey('ok'));
    },

    elHelpKey(k) {
      const h = this.bt.elHelp;
      if (!h) return;
      if (k === 'ok' && h.page < HELP.length - 1) { h.page++; this.sfx('select'); return; }
      if (k === 'ok' || k === 'back') {
        this.bt.elHelp = null;
        this.game.state.flags.seen_elation = true;
        this.sfx('confirm');
      }
    }
  });

  const runeCard = (b, x, y, w, h, rot) => {
    b.g.save();
    b.g.translate(x * b.k, y * b.kh); b.g.rotate(rot || 0); b.g.translate(-x * b.k, -y * b.kh);
    b.rect('#0e1238', x - w / 2 - 0.4, y - h / 2 - 0.4, w + 0.8, h + 0.8);
    b.rect('#1e2a6a', x - w / 2, y - h / 2, w, h);
    b.line('#c89aff', [x - w * 0.18, y - h * 0.3, x + w * 0.12, y - h * 0.1, x - w * 0.12, y + h * 0.1, x + w * 0.18, y + h * 0.3], 0.5);
    b.glow(x, y, w * 0.6, 'rgba(180,130,255,0.35)');
    b.g.restore();
  };
  const flame = (b, x, y, s, flip) => {
    const f = v => x + v * s * (flip ? -1 : 1);
    b.poly('#8a2a8a', [f(0), y + 14 * s, f(-6), y + 4 * s, f(-4), y - 6 * s, f(-1), y - 2 * s, f(0), y - 14 * s, f(3), y - 4 * s, f(6), y - 8 * s, f(6), y + 4 * s]);
    b.poly('#f0b030', [f(0), y + 12 * s, f(-4.4), y + 4 * s, f(-2.6), y - 3 * s, f(0), y - 10 * s, f(2.4), y - 2 * s, f(4.4), y + 4 * s]);
    b.poly('#fff0d8', [f(0), y + 10 * s, f(-2.6), y + 4 * s, f(-0.6), y - 3 * s, f(1.6), y + 1 * s, f(2.6), y + 5 * s]);
  };
  const leaf = (b, x, y, len, ang, col) => {
    const c = Math.cos(ang), s = Math.sin(ang);
    b.poly(col, [x, y, x + c * len * 0.5 - s * len * 0.16, y + s * len * 0.5 + c * len * 0.16, x + c * len, y + s * len, x + c * len * 0.5 + s * len * 0.16, y + s * len * 0.5 - c * len * 0.16]);
  };

  Object.assign(G.CONE_SCENES, {
    sneering(b) {
      b.sky(['#24080e', '#4a1620', '#1a060a']);
      b.glow(50, 66, 66, 'rgba(255,214,180,0.45)');
      b.poly('#e8b896', [12, 8, 88, 8, 90, 40, 80, 62, 72, 90, 70, 112, 78, 128, 22, 128, 30, 112, 28, 90, 20, 62, 10, 40]);
      b.poly('#f6d8c0', [18, 12, 82, 12, 84, 40, 74, 62, 66, 92, 64, 112, 70, 126, 30, 126, 36, 112, 34, 92, 26, 62, 16, 40]);
      b.glow(50, 66, 28, 'rgba(255,244,230,0.75)');
      for (const m of [1, -1]) {
        const X = v => 50 + v * m;
        b.line('#f2907e', [X(-30), 50, X(-18), 58, X(-8), 70], 1.3);
        b.line('#f2907e', [X(-34), 68, X(-20), 76, X(-6), 84], 1.1);
        b.line('#f4a890', [X(-26), 92, X(-14), 102, X(-4), 116], 0.9);
        b.line('#f4a890', [X(-30), 104, X(-18), 112, X(-8), 126], 0.8);
      }
      const crown = [0, 0, 100, 0, 100, 22];
      for (let i = 0; i <= 12; i++) { const x = 100 - i * 100 / 12, deep = i % 2 ? 26 + (6 - Math.abs(6 - i)) * 4.6 : 20 + (6 - Math.abs(6 - i)) * 2; crown.push(x, deep); }
      crown.push(0, 22);
      b.poly('#5a1828', crown);
      for (let i = 0; i < 9; i++) b.rect('#4a1220', 6 + i * 11, 24 + (i % 3) * 3, 1.2, 6 + (i % 2) * 5);
      b.poly('#5a1828', [50, 46, 54, 54, 50, 62, 46, 54]);
      b.poly('#e8a888', [50, 28, 53, 33, 50, 38, 47, 33]);
      for (const [x, y] of [[22, 12], [40, 8], [60, 8], [78, 12], [32, 18], [68, 18]]) b.twinkle(x, y, 2.2, '#e0a848');
      for (const [x, y] of [[14, 20], [86, 20], [44, 16], [56, 16]]) b.poly('#f0b898', [x, y - 1.6, x + 1.2, y, x, y + 1.6, x - 1.2, y]);
      b.poly('#4a1220', [30, 64, 70, 64, 66, 74, 58, 82, 52, 86, 52, 112, 58, 128, 42, 128, 48, 112, 48, 86, 42, 82, 34, 74]);
      for (let i = 0; i < 8; i++) b.rect('#fff4ea', 33 + i * 4.3, 65.4, 2.8, 3.6);
      b.glow(50, 70, 10, 'rgba(255,200,180,0.25)');
      flame(b, 12, 40, 1.4, false); flame(b, 20, 32, 1.1, true); flame(b, 88, 40, 1.4, true); flame(b, 80, 32, 1.1, false);
      b.front();
      for (const [x, y, len, a] of [[4, 120, 30, -1.1], [10, 124, 26, -0.6], [2, 104, 22, -0.3], [14, 128, 20, -1.6], [96, 122, 26, -2.2], [90, 126, 22, -2.6], [98, 108, 18, -2.9]]) leaf(b, x, y, len, a, '#140a0c');
      b.poly('#100406', [0, 126, 26, 122, 50, 127, 74, 121, 100, 124, 100, 140, 0, 140]);
      b.line('#b03a80', [0, 131, 18, 128, 38, 132, 58, 129, 80, 133, 100, 129], 0.7);
    },
    goodluck(b) {
      const YG = Object.assign({}, G.lookOf('aqua', null), { hair: '#e8eef6', hairHi: '#ffffff', tips: '#3ab8b0', tipsFade: true, tipsAt: 62, eye: '#8a62d8', eye2: '#c8a8f4', bangs: 'messy', top: '#f2f2f6', trim: '#c8b060', inner: '#f2f2f6', neck: '#f2f2f6', lower: '#3aa8a0', acc: [] });
      const FX = Object.assign({}, G.lookOf('fuxuan', null), { top: '#f6f0f4', trim: '#f0a8c8', inner: '#5a2a6a', collar: 'bare' });
      b.sky(['#2a1410', '#8a3420', '#c8602e']);
      b.poly('rgba(255,244,214,0.55)', [62, 0, 100, 0, 100, 44, 80, 52]);
      for (let i = 0; i < 4; i++) b.line('rgba(255,250,230,0.35)', [72 + i * 7, 0, 60 + i * 7, 60], 1.4);
      b.ell('rgba(52,82,40,0.75)', 8, 26, 16, 24); b.ell('rgba(74,110,52,0.6)', 20, 16, 12, 14); b.ell('rgba(40,64,32,0.7)', 4, 50, 10, 14);
      for (const [x0, y0, x1, y1] of [[10, 22, 16, 30], [16, 30, 26, 28], [76, 34, 84, 30], [84, 30, 88, 36]]) b.line('rgba(240,236,255,0.7)', [x0, y0, x1, y1], 0.4);
      for (const [x, y] of [[10, 22], [16, 30], [26, 28], [76, 34], [84, 30], [88, 36], [40, 12], [92, 58]]) b.ell('#f8f4ff', x, y, 0.9, 0.9);
      b.poly('#b84a2a', [0, 62, 100, 46, 100, 140, 0, 140]);
      b.poly('#d8683a', [0, 62, 100, 46, 100, 50, 0, 66]);
      for (let i = 0; i < 5; i++) { const x = 4 + i * 9; b.line('#d8a848', [x, 60 - i * 1.4, x, 52 - i * 1.4, x + 6, 51 - i * 1.4, x + 6, 56 - i * 1.4, x + 3, 56.4 - i * 1.4], 0.9); }
      b.line('#d8a848', [0, 61, 46, 53.6], 1);
      b.bust(YG, 70, 56, 58);
      b.poly('#1e5a6a', [58, 40, 52, 26, 58, 18, 62, 30]); b.poly('#2a8a8a', [60, 38, 58, 22, 64, 20, 64, 32]); b.poly('#e8a8c8', [62, 40, 68, 32, 70, 40]);
      b.line('#d8b048', [50, 44, 68, 36], 0.8);
      b.ell('#f8e2d4', 88, 34, 3.4, 4);
      runeCard(b, 86, 26, 7, 10, 0.4); runeCard(b, 91, 28, 7, 10, 0.7);
      b.ring('#c8ccd8', 88, 39, 2.6, 1.2, 0.6);
      b.bust(FX, 34, 96, 74);
      b.poly('#f0a8c8', [24, 68, 29, 58, 35, 66]); b.poly('#f0a8c8', [34, 66, 40, 56, 45, 66]); b.ell('#d8b048', 34, 67, 4.4, 2.4); b.line('#d8b048', [22, 70, 48, 62], 0.7);
      b.ell('#f8e2d4', 14, 104, 3.6, 4.2); runeCard(b, 13, 96, 7, 10, -0.15);
      b.ell('#f8e2d4', 44, 100, 3.4, 4); runeCard(b, 45, 92, 7, 10, 0.12);
      b.front();
      b.glow(10, 130, 18, 'rgba(170,80,230,0.6)');
      b.ell('#6a2aa0', 9, 131, 12, 11); b.ell('#a85ae0', 6, 128, 6, 5); b.ell('#e8c8ff', 4, 126, 1.6, 1.4);
      b.ring('#c8a040', 9, 131, 14, 12, 0.9); b.ring('#c8a040', 9, 131, 14, 5, 0.7, 0.4); b.ring('#c8a040', 9, 131, 5, 12, 0.7);
      b.poly('#6a3a1e', [58, 128, 100, 116, 100, 140, 54, 140]);
      b.poly('#8a5230', [58, 128, 100, 116, 100, 119, 60, 131]);
      runeCard(b, 76, 128, 9, 6, -0.25);
      b.ell('#e8dcc0', 94, 132, 5, 3, -0.3); b.rect('#2a6a6a', 90, 129, 2, 6);
    }
  });

  H.ELATION_HELP = HELP;
  H.ELATION_CUTS = CUTS;
  H.ElationShow = ElationShow;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
