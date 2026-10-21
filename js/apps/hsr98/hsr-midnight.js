(function (H) {
  'use strict';
  const G = H.Gfx, R3 = H.R3, M = R3.M, K = H.Cine.Kit;
  const { W, HGT, C } = H.UI_CONST;
  const { cl, lerp, sm, eOut, eIn, seg, rgba, glow, lighter, poly, rect, ell, line, ring, vgrad } = K;
  const LW = 320, LH = 240, CX = 160, CY = 120;
  const hx = G.hash;
  const RCOL = { 3: '#7ab0ff', 4: '#c08aff', 5: '#ffd060' };
  const RHOT = { 3: '#e0eeff', 4: '#f4e4ff', 5: '#fff2c8' };
  const FOG = '#d8b850', VEL = '#1a2a8a';
  const SHOTS = [['clock', 1.5], ['tv', 1.7], ['touch', 1.0], ['fall', 1.6], ['velvet', 1.6]];
  const total = list => list.reduce((s, x) => s + x[1], 0);
  const CINE = total(SHOTS);
  const HOP = 0.35, CARD = 1.0, CRUSH = 0.5;
  const CUTS = {
    yu: [['fog', 0.9], ['shades', 0.9], ['voice', 1.1], ['crush', 0.8], ['zio', 0.9], ['pose', 1.4]],
    yosuke: [['bike', 1.0], ['junes', 1.0], ['shadow', 1.1], ['jiraiya', 0.9], ['pose', 1.3]],
    chie: [['kick', 1.0], ['steak', 0.9], ['shadow', 1.2], ['tomoe', 0.9], ['pose', 1.3]],
    yukiko: [['inn', 1.0], ['laugh', 0.9], ['cage', 1.2], ['sakuya', 0.9], ['pose', 1.3]],
    kanji: [['gang', 1.0], ['shop', 1.0], ['shadow', 1.2], ['mikazuchi', 1.0], ['stitch', 0.8], ['pose', 1.4]],
    rise: [['stage', 1.0], ['tofu', 0.9], ['shadow', 1.2], ['himiko', 1.0], ['scan', 0.8], ['pose', 1.4]]
  };
  const CUT_SFX = {
    yu: [[0.1, 'glint'], [0.95, 'rumble'], [1.9, 'tech'], [2.9, 'break_obj'], [3.0, 'ult'], [3.85, 'crit'], [3.95, 'hit'], [4.8, 'star5']],
    yosuke: [[0.1, 'step'], [0.5, 'break_obj'], [0.62, 'deny'], [1.1, 'text'], [1.65, 'debuff'], [2.6, 'buff'], [3.1, 'whoosh'], [3.25, 'swing'], [4.0, 'star4']],
    chie: [[0.35, 'swing'], [0.42, 'hit'], [1.05, 'chest'], [2.05, 'debuff'], [2.6, 'buff'], [3.1, 'whoosh'], [3.3, 'break'], [4.0, 'star4']],
    yukiko: [[0.1, 'door'], [0.4, 'step'], [1.1, 'text'], [1.4, 'text'], [2.0, 'debuff'], [2.6, 'break'], [3.1, 'ult'], [3.2, 'steam'], [4.0, 'star4']],
    kanji: [[0.1, 'deny'], [0.5, 'step'], [1.1, 'strum'], [2.3, 'debuff'], [2.9, 'buff'], [3.25, 'rumble'], [3.8, 'break'], [4.25, 'tech'], [4.55, 'crit'], [5.05, 'star5']],
    rise: [[0.1, 'win'], [1.1, 'text'], [2.2, 'debuff'], [2.75, 'buff'], [3.2, 'tech'], [4.1, 'select'], [4.45, 'deny'], [4.6, 'shield'], [5.0, 'star5']]
  };
  const QUOTES = { yu: 'Правда где-то в этом тумане. Я её найду.', yosuke: 'Партнёр, прикрою! Только про мусорку никому.', chie: 'Сначала драка, потом говядина!', yukiko: 'Куда мне идти, я теперь выберу сама.', kanji: 'Плевать, что скажут. Я такой, какой есть.', rise: 'Я на связи. Всегда, со всеми вами.' };
  function pick(list, t) {
    let s = 0;
    for (const [n, d] of list) { if (t < s + d) return [n, t - s]; s += d; }
    const last = list[list.length - 1];
    return [last[0], t - s + last[1]];
  }
  const shotStart = name => { let s = 0; for (const [n, d] of SHOTS) { if (n === name) return s; s += d; } return s; };
  const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  const meshCache = new Map();
  function cached(key, fn) { let m = meshCache.get(key); if (!m) { m = fn(); meshCache.set(key, m); } return m; }

  function figure(g, look, x, y, k, o = {}) {
    const cv = G.figureCanvas(look, k), s = o.s || 1, w = cv.width * s, h = cv.height * s, fy = G.FIG_FOOT * k * s;
    g.save();
    g.imageSmoothingEnabled = false;
    if (o.a != null) g.globalAlpha = cl(o.a);
    g.translate(Math.round(x), Math.round(y));
    g.drawImage(o.tint ? K.tinted(cv, o.tint, o.ta == null ? 1 : o.ta) : cv, Math.round(-w / 2), Math.round(-fy), Math.round(w), Math.round(h));
    g.restore();
  }

  const vars = new Map();
  function vlook(look, v) {
    let m = vars.get(look);
    if (!m) vars.set(look, m = new Map());
    const key = JSON.stringify(v);
    let out = m.get(key);
    if (!out) { out = Object.assign({}, look, v); m.set(key, out); }
    return out;
  }

  function star4(g, x, y, r, col, a, thin) {
    if (r <= 0 || a <= 0) return;
    const w = r * (thin || 0.16);
    poly(g, rgba(col, a), [x, y - r, x + w, y - w, x + r, y, x + w, y + w, x, y + r, x - w, y + w, x - r, y, x - w, y - w]);
  }

  const backTex = () => R3.paint('mid_back', 32, 48, (g, w, h) => {
    rect(g, '#efe2b0', 0, 0, w, h); rect(g, VEL, 2, 2, w - 4, h - 4);
    g.strokeStyle = '#d8b050'; g.strokeRect(4.5, 4.5, w - 9, h - 9);
    ell(g, '#d8b050', w / 2, h / 2, 7, 7); ell(g, VEL, w / 2 + 2, h / 2 - 1, 6, 6);
    for (let i = 0; i < 4; i++) star4(g, 8 + (i % 2) * 16, 10 + (i >> 1) * 28, 2.2, '#f0d890', 1);
  });
  const staticTex = i => R3.paint('mid_static_' + i, 32, 24, (g, w, h) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = hx(x + i * 37, y, 5); rect(g, v > 0.55 ? '#f4e070' : v > 0.3 ? '#b89a30' : '#4a3a14', x, y, 1, 1); }
    for (let y = 0; y < h; y += 3) rect(g, 'rgba(0,0,0,0.25)', 0, y, w, 1);
  });

  function roomMesh() {
    return cached('room', () => {
      const m = R3.mesh();
      R3.grid(m, -4, -3, 4, 3, 0, 6, 6, '#3a1c22');
      R3.quad(m, [-4, 0, -1.2, 4, 0, -1.2, 4, 3, -1.2, -4, 3, -1.2], '#2a2032');
      R3.box(m, 0, 0.25, 0, 1.6, 0.5, 1.0, '#4a2e22');
      R3.box(m, 0, 0.98, -0.1, 1.24, 0.96, 0.9, '#2e2e36', { cols: ['#3e3e48', '#1e1e24', '#2a2a32', '#2a2a32', '#44444e', '#1a1a20'] });
      R3.box(m, 0.52, 0.6, 0.36, 0.04, 0.04, 0.02, '#c84040', { emit: 1 });
      R3.box(m, -2.8, 1.2, -1.15, 1.6, 1.0, 0.04, '#0a0c1e');
      return m;
    });
  }
  function screenMesh(i) {
    return cached('screen' + i, () => {
      const m = R3.mesh(), t = i < 0 ? null : staticTex(i);
      R3.quad(m, [-0.48, 0.66, 0.36, 0.48, 0.66, 0.36, 0.48, 1.32, 0.36, -0.48, 1.32, 0.36], i < 0 ? '#06060a' : '#ffffff', t ? { tex: t, emit: 1 } : { emit: 0.2 });
      return m;
    });
  }
  function cardMesh() { return cached('card', () => { const m = R3.mesh(), t = backTex(); R3.quad(m, [-0.3, -0.45, 0, 0.3, -0.45, 0, 0.3, 0.45, 0, -0.3, 0.45, 0], '#ffffff', { tex: t, two: true }); return m; }); }
  function fan(m, r, y, n, col) {
    const c = R3.vert(m, 0, y, 0, 0, 1, 0);
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; R3.vert(m, Math.cos(a) * r, y, Math.sin(a) * r, 0, 1, 0); }
    for (let i = 0; i < n; i++) R3.face(m, c, c + 2 + i, c + 1 + i, col, { two: true });
  }
  function ringsMesh() {
    return cached('rings', () => {
      const m = R3.mesh();
      for (let i = 0; i < 6; i++) fan(m, 6 - i, 0.03 * i, 32, i % 2 ? '#141012' : '#b82428');
      R3.grid(m, -30, -30, 30, 30, -0.06, 6, 6, '#3a3014');
      return m;
    });
  }
  function carMesh() {
    return cached('car', () => {
      const m = R3.mesh();
      R3.quad(m, [-1.6, 0, 3, 1.6, 0, 3, 1.6, 0, -7, -1.6, 0, -7], '#2a1c4a');
      R3.quad(m, [-1.6, 2.6, -7, 1.6, 2.6, -7, 1.6, 2.6, 3, -1.6, 2.6, 3], '#0c0c26');
      for (const s of [-1, 1]) {
        const x = 1.6 * s;
        R3.quad(m, s > 0 ? [x, 0, 3, x, 0, -7, x, 2.6, -7, x, 2.6, 3] : [x, 0, -7, x, 0, 3, x, 2.6, 3, x, 2.6, -7], VEL);
        for (let k = 0; k < 4; k++) {
          const z0 = 2 - k * 2.4, z1 = z0 - 1.6, xi = x - 0.01 * s;
          R3.quad(m, s > 0 ? [xi, 1.0, z0, xi, 1.0, z1, xi, 2.1, z1, xi, 2.1, z0] : [xi, 1.0, z1, xi, 1.0, z0, xi, 2.1, z0, xi, 2.1, z1], FOG, { emit: 0.85 });
          R3.box(m, x - 0.35 * s, 0.35, z0 - 0.8, 0.5, 0.7, 1.4, '#22306a');
        }
      }
      R3.quad(m, [-1.6, 0, -7, 1.6, 0, -7, 1.6, 2.6, -7, -1.6, 2.6, -7], '#101a5a');
      R3.cyl(m, 0, 0, -3, 0.12, 0.12, 0.85, 8, '#3a2a18');
      R3.cyl(m, 0, 0.85, -3, 0.9, 0.9, 0.06, 20, '#141a4a', { emit: 0.1 });
      return m;
    });
  }

  function seg7(g, x, y, s, str, col) {
    const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
    let cx = x;
    for (const ch of str) {
      if (ch === ':') { rect(g, col, cx + s * 0.2, y + s * 0.6, s * 0.3, s * 0.3); rect(g, col, cx + s * 0.2, y + s * 1.4, s * 0.3, s * 0.3); cx += s * 0.8; continue; }
      const on = SEG[ch] || '', w = s, t = s * 0.22;
      const P = { a: [0, 0, w, t], b: [w - t, 0, t, w], c: [w - t, w, t, w], d: [0, 2 * w - t, w, t], e: [0, w, t, w], f: [0, 0, t, w], g: [0, w - t / 2, w, t] };
      for (const k of 'abcdefg') rect(g, on.includes(k) ? col : rgba(col, 0.08), cx + P[k][0], y + P[k][1], P[k][2], P[k][3]);
      cx += s * 1.4;
    }
  }

  function hand(g, x, y, s, a) {
    g.save(); g.globalAlpha = cl(a); g.translate(x, y); g.scale(s, s);
    poly(g, '#1c1c24', [-14, 60, 14, 60, 10, 10, -10, 10]);
    poly(g, '#e8c4a8', [-10, 12, 10, 12, 12, -6, -12, -6]);
    for (let i = 0; i < 4; i++) poly(g, '#f0d0b4', [-11 + i * 6, -4, -7 + i * 6, -4, -6 + i * 6, -22 + Math.abs(i - 1.5) * 3, -10 + i * 6, -22 + Math.abs(i - 1.5) * 3]);
    poly(g, '#f0d0b4', [10, 6, 14, 4, 20, -8, 16, -10]);
    g.restore();
  }

  function igor(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    poly(g, '#05060e', [-26, 40, 26, 40, 20, 4, -20, 4]);
    ell(g, '#05060e', 0, -6, 13, 15);
    poly(g, '#05060e', [6, -8, 30, -2, 8, 2]);
    ell(g, '#e8e8f0', -4, -9, 2.6, 2.6); ell(g, '#e8e8f0', 5, -9, 2.6, 2.6);
    ell(g, '#05060e', -3.4, -9, 1, 1); ell(g, '#05060e', 5.6, -9, 1, 1);
    g.restore();
  }

  class MidnightShow {
    constructor(ui, res, opts = {}) {
      this.ui = ui; this.res = res; this.game = ui.game; this.ban = opts.ban || 'mid';
      this.best = Math.max(...res.map(r => r.rar));
      this.R = new R3.Raster(LW, LH);
      this.phase = 'cine'; this.t = 0; this.cue = 0; this.rt = 0;
      this.queue = []; this.cur = -1; this.seen = new Set(); this.fade = 0; this.done = false; this.hop = 0; this.rc = [];
      this.cues = this.cueList();
      const top = res.filter(r => r.rar === this.best && r.kind === 'char')[0];
      this.shadow = top ? top.id : this.game.state.mcPath === 'trail_p' ? 'trail' : 'trail';
    }

    cueList() {
      const tv = shotStart('tv'), fall = shotStart('fall'), vel = shotStart('velvet');
      return [[0.15, 'step'], [0.55, 'step'], [0.95, 'glint'], [tv + 0.15, 'shutter'], [tv + 0.6, 'rumble'], [tv + 1.3, this.best >= 4 ? 'star4' : 'glint'], [shotStart('touch') + 0.35, 'splash'], [fall + 0.05, 'whoosh'], [fall + 1.45, 'break'], [vel + 0.3, 'door'], [vel + 1.25, this.best === 5 ? 'star5' : this.best === 4 ? 'star4' : 'chest']].sort((a, b) => a[0] - b[0]);
    }

    item() { return this.res[this.cur]; }

    own(r) { return r.kind === 'char' && CUTS[r.id] ? CUTS[r.id] : null; }

    length(r) {
      const gold = r.rar === 5 ? 0.4 : 0, own = this.own(r);
      if (own) return CARD + total(own) + 0.6;
      return r.kind === 'char' ? CARD + CRUSH + 1.6 + gold : CARD + 0.9 + gold;
    }

    intro() { return this.hop + this.length(this.item()); }

    revealCues(r) {
      const list = [[0.05, 'ticket'], [0.35, 'swing'], [0.6, r.rar === 5 ? 'star5' : r.rar === 4 ? 'star4' : 'glint']];
      const own = this.own(r);
      if (own) for (const [x, id] of CUT_SFX[r.id] || []) list.push([CARD + x, id]);
      else if (r.kind === 'char') list.push([CARD + 0.02, 'break_obj'], [CARD + CRUSH, 'whoosh']);
      return list;
    }

    tick(dt) {
      this.fade = Math.max(0, this.fade - dt * 2.4);
      if (this.phase === 'cine') {
        this.t += dt;
        while (this.cue < this.cues.length && this.cues[this.cue][0] <= this.t) this.ui.sfx(this.cues[this.cue++][1]);
        if (this.t >= CINE) this.begin(this.res.map((r, i) => i));
        return;
      }
      const before = this.rt;
      this.rt += dt;
      if (this.phase !== 'reveal') return;
      for (const [x, id] of this.rc) if (before < this.hop + x && this.rt >= this.hop + x) this.ui.sfx(id);
    }

    begin(queue) {
      const first = this.phase === 'cine';
      this.phase = 'reveal';
      this.queue = queue.filter(i => !this.seen.has(i));
      this.next(first);
      if (first) this.fade = 0.9;
    }

    next(first) {
      if (!this.queue.length) { if (this.res.length > 1) this.toRack(); else this.done = true; return; }
      this.cur = this.queue.shift();
      this.seen.add(this.cur);
      this.hop = first ? 0 : HOP;
      this.rt = 0;
      this.rc = (this.hop ? [[-this.hop + 0.02, 'whoosh']] : []).concat(this.revealCues(this.item()));
    }

    toRack() { this.phase = 'rack'; this.rt = 0; this.fade = 0.6; this.ui.sfx('confirm'); }

    skip() {
      if (this.res.length === 1) { if (this.phase === 'cine') this.begin([0]); else this.done = true; return; }
      if (this.phase === 'rack') { this.done = true; return; }
      const five = this.res.map((r, i) => i).filter(i => this.res[i].rar === 5 && !this.seen.has(i));
      if (five.length) this.begin(five); else this.toRack();
    }

    enter() {
      if (this.phase === 'cine') this.begin(this.res.map((r, i) => i));
      else if (this.phase === 'reveal') { if (this.rt < this.intro()) this.rt = this.intro(); else this.next(); }
      else if (this.rt < 0.8) this.rt = 0.8;
      else this.done = true;
    }

    shot() {
      let s = 0;
      for (const [n, d] of SHOTS) { if (this.t < s + d) return [n, this.t - s]; s += d; }
      const last = SHOTS[SHOTS.length - 1];
      return [last[0], last[1]];
    }

    clock(g, t, T) {
      vgrad(g, 0, LH, [[0, '#0c0a16'], [1, '#1c1424']]);
      rect(g, '#05060e', 150, 20, 150, 120);
      g.save(); g.beginPath(); g.rect(154, 24, 142, 112); g.clip();
      vgrad(g, 24, 136, [[0, '#04061a'], [1, '#141c48']]);
      K.stars(g, T, 30, 41, 0.6, 140);
      for (let i = 0; i < 40; i++) { const x = 150 + ((hx(i, 3, 7) * 160 + T * 40) % 160), y = 20 + ((hx(7, i, 3) * 120 + T * 300 + i * 9) % 120); line(g, rgba('#9ab4e0', 0.5), 1, x, y, x - 3, y + 9); }
      g.restore();
      rect(g, '#3a2418', 146, 18, 158, 4); rect(g, '#3a2418', 146, 138, 158, 4); rect(g, '#3a2418', 146, 18, 4, 124); rect(g, '#3a2418', 300, 18, 4, 124); rect(g, '#3a2418', 223, 18, 4, 124);
      rect(g, '#2a1a14', 0, 170, LW, 70); rect(g, '#4a3020', 0, 168, LW, 4);
      const on = t >= 0.95, blink = on || Math.floor(T * 2) % 2 === 0;
      rect(g, '#141418', 40, 120, 92, 50); rect(g, '#060608', 46, 126, 80, 34);
      seg7(g, 50, 132, 9, on ? '00:00' : '23:59', blink ? '#ff3a3a' : '#5a1414');
      lighter(g, () => glow(g, 86, 143, 40, '#ff2a2a', 0.18));
      const kg = 0.4 + 0.6 * seg(t, 0.95, 1.4);
      lighter(g, () => glow(g, 210, 186, 18 + 10 * kg, '#5a7aff', 0.6 * kg));
      g.save(); g.translate(198, 174); G.itemIcon(g, 'vkey', 0, 0, 24); g.restore();
      K.vignette(g, 0.55);
      K.flash(g, '#000000', 1 - seg(t, 0, 0.3));
    }

    tvScene(R, eye, at, fov, t, T) {
      const lit = seg(t, 0.15, 0.3), col = R3.rgb(t > 1.2 ? RCOL[this.best] : FOG);
      R.light({ amb: [0.22, 0.2, 0.26], sun: null, pts: lit ? [{ p: [0, 1.0, 1.4], r: 5, c: col.map(v => v / 255 * 1.3 * lit) }] : [] });
      R.look(eye, at, fov);
      R.clear('#04040a', '#0e0a14');
      R.draw(roomMesh(), M.id());
      R.draw(screenMesh(lit > 0.5 ? Math.floor(T * 14) % 4 : -1), M.id());
      if (lit) R.glow([0, 1.0, 0.5], 1.6, t > 1.2 ? RCOL[this.best] : FOG, { a: 0.25 * lit, depth: false });
      R.bake();
    }

    screenRect(R) {
      const a = R.project([-0.48, 1.32, 0.36]), b = R.project([0.48, 0.66, 0.36]);
      return a && b ? [a[0], a[1], b[0] - a[0], b[1] - a[1]] : null;
    }

    silhouette(g, R, t, T, a) {
      const sr = this.screenRect(R);
      if (!sr || a <= 0) return;
      const [x, y, w, h] = sr, look = G.lookOf(this.shadow, this.game);
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      const k = h / 100, sway = Math.sin(T * 3) * w * 0.02;
      figure(g, look, x + w / 2 + sway, y + h * 1.05, 2, { s: k * 0.9, tint: '#100c08', ta: 1, a: a * (0.75 + 0.25 * Math.sin(T * 23)) });
      if (this.best === 5 && t > 1.3) lighter(g, () => { const ex = x + w / 2 + sway, ey = y + h * 0.3; glow(g, ex - w * 0.04, ey, 3, '#ffd040', 1); glow(g, ex + w * 0.04, ey, 3, '#ffd040', 1); });
      if (t > 1.2) lighter(g, () => rect(g, rgba(RCOL[this.best], 0.35 * seg(t, 1.2, 1.5)), x, y, w, h));
      g.restore();
    }

    tv(R, g, t, T) {
      const k = sm(t / 1.7);
      this.tvScene(R, lerp3([0.9, 1.4, 3.6], [0.1, 1.1, 2.4], k), [0, lerp(0.9, 1.0, k), 0], 46, t, T);
      this.silhouette(g, R, t, T, seg(t, 0.5, 1.1));
      K.vignette(g, 0.5);
    }

    touch(R, g, t, T) {
      const push = eIn(seg(t, 0.4, 1.0));
      this.tvScene(R, [0.02, 1.0, lerp(1.6, 0.6, push)], [0, 1.0, 0], lerp(46, 30, push), 1.7 + t, T);
      this.silhouette(g, R, 1.7, T, 1 - seg(t, 0.2, 0.6));
      const sr = this.screenRect(R);
      if (sr) {
        const [x, y, w, h] = sr, cx = x + w / 2, cy = y + h / 2, rip = seg(t, 0.35, 1.0);
        if (rip > 0) lighter(g, () => { for (let i = 0; i < 4; i++) { const q = (rip * 1.6 + i * 0.25) % 1; g.strokeStyle = rgba(FOG, (1 - q) * 0.9); g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, cy, q * w * 0.7, q * h * 0.5, 0, 0, Math.PI * 2); g.stroke(); } });
      }
      hand(g, lerp(250, CX + 6, eOut(seg(t, 0, 0.4))), lerp(300, CY + 40, eOut(seg(t, 0, 0.4))), 1.2 + push, 1 - seg(t, 0.75, 0.95));
      if (push > 0.4) K.speedLines(g, T, CX, CY, 24, FOG, 0.4 * push, 30);
      K.flash(g, '#fff2b0', seg(t, 0.8, 1.0));
    }

    fall(R, g, t, T) {
      const k = eIn(t / 1.6), y = lerp(13, 1.4, k);
      R.light({ amb: [1, 1, 1], sun: null, fog: { near: 1.5, far: 13, col: R3.rgb('#c8a840'), max: 0.9 } });
      R.look([0.01, y, 0.02], [0, y - 5, 0], 70, T * 0.9);
      R.clear('#e8d070', '#8a7020');
      R.draw(ringsMesh(), M.ry(T * 0.4), { lit: false, cull: false });
      for (let i = 0; i < 18; i++) {
        const a = hx(i, 1, 61) * Math.PI * 2, r = 0.8 + hx(i, 2, 61) * 2.6, cy = ((hx(i, 3, 61) * 16 + T * 6) % 16);
        R.draw(cardMesh(), M.of(M.t(Math.cos(a) * r, cy, Math.sin(a) * r), M.ry(T * 3 + i), M.rx(T * 2 + i), M.s(0.7)), { lit: false });
      }
      for (let i = 0; i < 26; i++) { const a = hx(i, 4, 63) * Math.PI * 2, r = 0.5 + hx(i, 5, 63) * 3.2, yy = y - 1 - hx(i, 6, 63) * 6; R.streak([Math.cos(a) * r, yy, Math.sin(a) * r], [Math.cos(a) * r, yy + 1.4, Math.sin(a) * r], 0.02, '#fff4c0', '#fff4c0', { world: true, a: 0.6 }); }
      R.bake();
      K.vignette(g, 0.45, '#3a2a08');
      K.flash(g, '#fff6d0', seg(t, 1.42, 1.6));
    }

    tableCards() {
      const n = this.res.length;
      return this.res.map((r, i) => { const a = (i - (n - 1) / 2) * (n > 1 ? 1.9 / Math.max(4, n) : 0); return [Math.sin(a) * 0.55, 0.92, -3 + 0.1 - Math.cos(a) * 0.5 + 0.5, a]; });
    }

    velvetRoom(R, eye, at, fov, T, rise) {
      R.light({ amb: [0.5, 0.52, 0.75], sun: null, pts: [{ p: [0, 2.2, -3], r: 4.5, c: [0.7, 0.75, 1.1] }], fog: { near: 4, far: 12, col: R3.rgb('#0a0c2a'), max: 0.5 } });
      R.look(eye, at, fov);
      R.clear('#04051a', '#0a0c2a');
      R.draw(carMesh(), M.id());
      const cards = this.tableCards(), bi = this.res.findIndex(r => r.rar === this.best);
      cards.forEach(([x, y, z, a], i) => {
        const up = i === bi ? rise : 0;
        R.draw(cardMesh(), M.of(M.t(x, y + 0.01 + up * 0.7, z), M.ry(-a), M.rx(-Math.PI / 2 + up * 1.3), M.s(0.42)), { lit: false });
        R.glow([x, y + 0.03 + up * 0.7, z], 0.12 + up * 0.3, RCOL[this.res[i].rar], { a: 0.35 + 0.25 * Math.sin(T * 4 + i) + up, depth: false });
      });
    }

    velvet(R, g, t, T) {
      const k = sm(t / 1.6), rise = seg(t, 1.1, 1.5);
      this.velvetRoom(R, [0, lerp(1.5, 1.35, k), lerp(2.6, -0.8, k)], [0, lerp(1.2, 0.95, k), -3], 50, T, rise);
      R.bake();
      const p = this.R.project([0, 1.2, -4.6]);
      if (p) igor(g, p[0], p[1], this.R.fl / p[2] * 0.011);
      for (let i = 0; i < 20; i++) { const ph = (T * 0.2 + hx(i, 1, 71)) % 1; rect(g, rgba('#9ab4ff', Math.sin(Math.PI * ph) * 0.6), Math.round(hx(i, 2, 71) * LW), Math.round(LH - ph * LH), 1, 1); }
      K.vignette(g, 0.5);
      K.flash(g, RHOT[this.best], seg(t, 1.35, 1.6));
    }

    velvetBack(g, T) {
      vgrad(g, 0, LH, [[0, '#04051a'], [0.6, '#0c1450'], [1, '#1a2a8a']]);
      for (let x = 0; x < LW; x += 20) { rect(g, 'rgba(0,0,0,0.25)', x, 0, 6, LH); rect(g, 'rgba(120,150,255,0.06)', x + 6, 0, 2, LH); }
      lighter(g, () => glow(g, CX, LH + 10, 160, '#3a5ae0', 0.4));
      for (let i = 0; i < 24; i++) { const ph = (T * 0.25 + hx(i, 1, 73)) % 1; rect(g, rgba('#b4c8ff', Math.sin(Math.PI * ph) * 0.7), Math.round(hx(i, 2, 73) * LW), Math.round(LH - ph * LH), 1, 1); }
    }

    tarotFront(g, r, x, y, w, h) {
      const V = H.VELVET, ar = V.arcanaOf(r.kind === 'char' ? r.id : H.CONES[r.id] && H.CONES[r.id].sig, r.kind === 'cone' ? r.id : null);
      rect(g, '#05061a', x - 1, y - 1, w + 2, h + 2);
      rect(g, '#f2e4b0', x, y, w, h);
      rect(g, VEL, x + 3, y + 3, w - 6, h - 6);
      g.strokeStyle = RCOL[r.rar]; g.lineWidth = 1; g.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
      g.save(); g.beginPath(); g.rect(x + 7, y + 22, w - 14, h - 42); g.clip();
      if (r.kind === 'char') {
        const cv = G.bustCanvas(G.lookOf(r.id, this.game), 128), s = (w - 14) / cv.width * 1.1;
        g.imageSmoothingEnabled = false;
        g.drawImage(cv, Math.round(x + w / 2 - cv.width * s / 2), Math.round(y + h - 20 - cv.height * s), Math.round(cv.width * s), Math.round(cv.height * s));
      } else {
        const cv = G.coneArt(r.id, 72, 100), s = (h - 42) / cv.height;
        g.drawImage(cv, Math.round(x + w / 2 - cv.width * s / 2), y + 22, Math.round(cv.width * s), Math.round(cv.height * s));
      }
      g.restore();
      g.font = 'bold ' + Math.round(w / 6) + 'px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#f2e4b0';
      g.fillText(V.ROMAN[ar], x + w / 2, y + 18);
      g.font = Math.max(7, Math.round(w / 10)) + 'px Georgia, serif';
      g.fillText(V.ARCANA[ar], x + w / 2, y + h - 8);
      g.textAlign = 'left';
    }

    cardShot(g, r, t, T) {
      this.velvetBack(g, T);
      const f = seg(t, 0.1, 0.55), sx = Math.abs(Math.cos(Math.PI * f)), w = 110, h = 170, x = CX - w / 2, y = 30 + Math.sin(T * 2) * 2;
      lighter(g, () => { glow(g, CX, y + h / 2, 110, RCOL[r.rar], 0.35 * seg(t, 0.5, 0.8)); if (r.rar === 5) for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + T; star4(g, CX + Math.cos(a) * 90, y + h / 2 + Math.sin(a) * 70, 5, RHOT[5], 0.8 * seg(t, 0.6, 0.9)); } });
      g.save(); g.translate(CX, 0); g.scale(Math.max(0.02, sx), 1); g.translate(-CX, 0);
      if (f < 0.5) {
        rect(g, '#05061a', x - 1, y - 1, w + 2, h + 2); rect(g, '#efe2b0', x, y, w, h); rect(g, VEL, x + 4, y + 4, w - 8, h - 8);
        g.strokeStyle = '#d8b050'; g.strokeRect(x + 8.5, y + 8.5, w - 17, h - 17);
        ell(g, '#d8b050', CX, y + h / 2, 22, 22); ell(g, VEL, CX + 6, y + h / 2 - 3, 19, 19);
      } else this.tarotFront(g, r, x, y, w, h);
      g.restore();
    }

    crushShot(g, r, t, T) {
      this.velvetBack(g, T);
      const k = seg(t, 0, CRUSH);
      if (k < 0.25) { g.save(); g.globalAlpha = 1 - k * 4; this.tarotFront(g, r, CX - 55, 30, 110, 170); g.restore(); }
      lighter(g, () => {
        glow(g, CX, 115, 40 + 140 * k, '#5a8aff', 0.8 * (1 - k));
        for (let i = 0; i < 40; i++) {
          const a = hx(i, 1, 77) * Math.PI * 2, v = 40 + hx(i, 2, 77) * 140, px = CX + Math.cos(a) * v * eOut(k), py = 115 + Math.sin(a) * v * eOut(k) - 30 * k;
          poly(g, rgba(i % 3 ? '#7aa8ff' : '#e0ecff', 1 - k), [px, py - 5, px + 3, py, px, py + 2, px - 3, py]);
        }
      });
      K.flash(g, '#c8d8ff', 1 - seg(t, 0, 0.18));
    }

    poseShot(g, r, t, T) {
      this.velvetBack(g, T);
      const look = G.lookOf(r.id, this.game), col = RCOL[r.rar];
      lighter(g, () => { poly(g, rgba('#b4c8ff', 0.16), [CX - 20, 0, CX + 20, 0, CX + 90, LH, CX - 90, LH]); glow(g, CX, 222, 70, col, 0.45); });
      ell(g, 'rgba(0,0,0,0.45)', CX, 226, 46, 8);
      for (let i = 0; i < 12; i++) { const ph = (T * 0.4 + hx(i, 1, 79)) % 1, x = 40 + hx(i, 2, 79) * 240; g.save(); g.globalAlpha = Math.sin(Math.PI * ph) * 0.6; g.translate(x, 20 + ph * 200); g.rotate(T + i); rect(g, '#efe2b0', -3, -4, 6, 8); rect(g, VEL, -2, -3, 4, 6); g.restore(); }
      figure(g, look, CX - 2, 230 + Math.sin(T * 1.4) * 1.5, 3, { s: 0.72, tint: col, ta: 1 });
      figure(g, look, CX, 230 + Math.sin(T * 1.4) * 1.5, 3, { s: 0.72 });
      if (r.rar === 5) { const s = seg(t, 1.6, 2.0); if (s > 0 && s < 1) lighter(g, () => { ring(g, rgba(RHOT[5], 1 - s), 2, CX, 140, 20 + 160 * eOut(s)); glow(g, CX, 140, 60 * (1 - s), '#ffffff', 0.7 * (1 - s)); }); }
      K.vignette(g, 0.45);
      K.flash(g, '#ffffff', 0.7 * (1 - seg(t, 0, 0.25)));
    }

    hopShot(g, t) {
      rect(g, '#02030c', 0, 0, LW, LH);
      const k = seg(t, 0, HOP);
      lighter(g, () => { g.lineWidth = 2; for (let i = 0; i < 3; i++) { const q = seg(k, i * 0.15, 0.7 + i * 0.15); if (q > 0 && q < 1) { g.strokeStyle = rgba('#7a9aff', (1 - q) * 0.7); g.beginPath(); g.ellipse(CX, CY, q * 180, q * 120, 0, 0, Math.PI * 2); g.stroke(); } } });
    }

    rackBg(g, T) {
      vgrad(g, 0, LH, [[0, '#0a0e3a'], [1, '#1a2470']]);
      for (let y = 0; y < LH; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < LW; x += 4) rect(g, 'rgba(255,255,255,0.025)', x, y, 1, 1);
      lighter(g, () => glow(g, CX, CY, 180, '#3a5ae0', 0.25));
      for (let i = 0; i < 16; i++) { const ph = (T * 0.2 + hx(i, 1, 83)) % 1; rect(g, rgba('#b4c8ff', Math.sin(Math.PI * ph) * 0.6), Math.round(hx(i, 2, 83) * LW), Math.round(hx(i, 3, 83) * LH), 1, 1); }
    }

    studio(g, T, fog) {
      vgrad(g, 0, LH, [[0, '#5a4a18'], [0.55, '#b89a3a'], [1, '#d8c070']]);
      for (let i = 0; i < 5; i++) { const x = 20 + i * 70; rect(g, '#2a2410', x, 0, 4, 34); rect(g, '#2a2410', x - 8, 30, 20, 8); lighter(g, () => poly(g, rgba('#fff4c0', 0.08), [x - 6, 38, x + 10, 38, x + 40, LH, x - 36, LH])); }
      g.save(); g.translate(CX, 214); g.scale(1, 0.28);
      for (let r = 6; r >= 1; r--) ell(g, r % 2 ? '#b82428' : '#141012', 0, 0, r * 34, r * 34);
      g.restore();
      lighter(g, () => { for (let i = 0; i < 6; i++) { const y = 40 + i * 34 + Math.sin(T * 0.8 + i) * 6; rect(g, rgba('#fff0b0', 0.05 + 0.04 * (i % 2)), 0, y, LW, 18); } });
      if (fog > 0) rect(g, rgba('#d8c070', fog), 0, 0, LW, LH);
    }

    bust(g, look, x, y, size, s) {
      const cv = G.bustCanvas(look, size);
      g.save(); g.imageSmoothingEnabled = false; g.translate(Math.round(x), Math.round(y)); g.scale(s, s); g.drawImage(cv, -size / 2, -size); g.restore();
    }

    bustAt(look, x, y, size, s, side) {
      const [bx, by] = G.bustEye(look, side), u = size * s / 64;
      return [x + (bx - 32) * u, y - size * s + by * u, u];
    }

    glasses(g, look, x, y, size, s, lift, col) {
      const [lx, ly, u] = this.bustAt(look, x, y, size, s, -1), [rx] = this.bustAt(look, x, y, size, s, 1), dy = lift;
      g.save(); g.strokeStyle = col || '#3a3a44'; g.lineWidth = Math.max(1, u * 1.1);
      for (const ex of [lx, rx]) g.strokeRect(Math.round(ex - u * 4.4), Math.round(ly - u * 2.6 + dy), Math.round(u * 8.8), Math.round(u * 5.6));
      g.beginPath(); g.moveTo(lx + u * 4.4, ly + dy); g.lineTo(rx - u * 4.4, ly + dy); g.stroke();
      lighter(g, () => { g.fillStyle = rgba('#fff8d0', 0.25); for (const ex of [lx, rx]) g.fillRect(ex - u * 3.6, ly - u * 2 + dy, u * 2, u * 4.4); });
      g.restore();
    }

    shade(g, x, y, s, T, a, seed) {
      if (a <= 0) return;
      g.save(); g.globalAlpha = cl(a); g.translate(x, y); g.scale(s, s);
      g.fillStyle = '#0a080c'; g.beginPath();
      for (let i = 0; i <= 16; i++) { const an = i / 16 * Math.PI * 2, r = 14 + Math.sin(an * 3 + T * 5 + seed) * 2.4; g.lineTo(Math.cos(an) * r, -14 + Math.sin(an) * r * 0.9); }
      g.closePath(); g.fill();
      for (let i = 0; i < 3; i++) { const an = Math.PI * (0.2 + i * 0.3) + Math.sin(T * 4 + i + seed) * 0.2; poly(g, '#0a080c', [Math.cos(an) * 8, -2, Math.cos(an) * 26, 6 + i * 2, Math.cos(an) * 10, 4]); }
      ell(g, '#eef0f8', 0, -18, 8, 9);
      poly(g, '#2a5ad8', [-6, -22, -1, -20, -6, -18]); poly(g, '#2a5ad8', [6, -22, 1, -20, 6, -18]);
      ell(g, '#ffd040', -3.4, -16, 1, 1); ell(g, '#ffd040', 3.4, -16, 1, 1);
      g.restore();
    }

    bolt(g, x0, y0, x1, y1, seed, T, a) {
      if (a <= 0) return;
      lighter(g, () => {
        for (const [w, c] of [[5, rgba('#b46aff', 0.4 * a)], [1.6, rgba('#f4e8ff', a)]]) {
          g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0);
          for (let i = 1; i < 8; i++) { const k = i / 8; g.lineTo(lerp(x0, x1, k) + (hx(i, seed, Math.floor(T * 20)) - 0.5) * 22, lerp(y0, y1, k)); }
          g.lineTo(x1, y1); g.stroke();
        }
        glow(g, x1, y1, 16, '#d8b0ff', 0.8 * a);
      });
    }

    figEyes(look, x, y, k, s) {
      const u = k * s, out = [];
      for (const side of [-1, 1]) { const [ex, ey] = G.figEye(look, side); out.push([x + (ex - G.FIG_W / 2) * u, y + (ey - G.FIG_FOOT) * u]); }
      return out;
    }

    trashCan(g, x, y, s, rot, lid) {
      g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
      rect(g, '#7a8088', -10, -26, 20, 26); rect(g, '#9aa0a8', -10, -26, 4, 26);
      for (let i = 0; i < 3; i++) rect(g, '#5a6068', -10, -22 + i * 8, 20, 1.4);
      if (lid !== false) { rect(g, '#8a9098', -12, -29, 24, 4); rect(g, '#5a6068', -3, -32, 6, 3); }
      g.restore();
    }

    junesFront(g, T) {
      vgrad(g, 0, LH, [[0, '#0a0c22'], [1, '#2a2440']]);
      rect(g, '#d8d4cc', 20, 50, 280, 150); rect(g, '#bcb6ac', 20, 186, 280, 14);
      rect(g, '#c8242e', 20, 50, 280, 34);
      g.save(); g.font = 'bold 22px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText('ДЖУНС', CX, 76); g.textAlign = 'left'; g.restore();
      for (let i = 0; i < 6; i++) { rect(g, '#f4e8a0', 34 + i * 46, 98, 36, 52); rect(g, rgba('#ffffff', 0.25), 34 + i * 46, 98, 8, 52); }
      rect(g, '#1a1a24', 0, 200, LW, 40);
      lighter(g, () => glow(g, CX, 130, 160, '#ffe8a0', 0.18));
    }

    roadBack(g, T) {
      vgrad(g, 0, 150, [[0, '#9ab4c8'], [1, '#d8dcd0']]);
      rect(g, '#6a8a4a', 0, 120, LW, 40);
      for (let i = 0; i < 9; i++) rect(g, '#5a7a3a', i * 40 + ((T * 6) % 40), 128 + (i % 3) * 8, 26, 2);
      rect(g, '#8a8a86', 0, 160, LW, 80); rect(g, '#f2f0e8', 0, 196, LW, 3);
      for (let i = 0; i < 4; i++) { const x = 30 + i * 80; rect(g, '#4a3a2a', x, 70, 3, 92); line(g, '#3a3a40', 1, x, 74, x + 80, 78); }
    }

    yosukeBike(g, t, T, look) {
      this.roadBack(g, T);
      const ride = seg(t, 0, 0.45), crash = seg(t, 0.45, 0.6), x = lerp(-40, 196, ride), wob = Math.sin(T * 22) * 3 * ride * (1 - crash);
      this.trashCan(g, 230, 196, 1.3, crash * 1.4, crash < 0.2);
      if (crash < 1) {
        g.save(); g.translate(x, 196); g.rotate(wob * 0.02);
        ring(g, '#2a2a30', 2, -18, -8, 9); ring(g, '#2a2a30', 2, 18, -8, 9); line(g, '#c8242e', 2, -18, -8, 0, -22); line(g, '#c8242e', 2, 0, -22, 18, -8); line(g, '#c8242e', 2, 0, -22, 14, -28);
        g.restore();
        figure(g, look, x - 2, 182 + wob, 2, { s: 0.75 });
      } else {
        g.save(); g.translate(236, 194); g.rotate(1.3); ring(g, '#2a2a30', 2, -18, -8, 9); ring(g, '#2a2a30', 2, 18, -8, 9); line(g, '#c8242e', 2, -18, -8, 18, -8); g.restore();
        g.save(); g.translate(208, 186); g.rotate(-Math.PI / 2 - 0.3); figure(g, look, 0, 0, 2, { s: 0.7 }); g.restore();
        this.trashCan(g, 196, 190, 1.4, -1.2, false);
      }
      if (crash > 0 && crash < 1) lighter(g, () => star4(g, 226, 170, 24 * (1 - crash), '#ffffff', 1));
      if (t > 0.65) H.ExplosionKit.bubble(g, 196, 120, 'Помогите…', seg(t, 0.65, 0.75), true);
    }

    yosukeJunes(g, t, T, look) {
      this.junesFront(g, T);
      figure(g, look, 64, 228, 3, { s: 0.56 });
      const ap = seg(t, 0.35, 0.7);
      g.save(); g.beginPath(); g.rect(34 + 4 * 46, 98, 36, 52); g.rect(34 + 5 * 46, 98, 36, 52); g.clip();
      figure(g, look, 266, 170, 2, { s: 0.42, tint: '#1a1410', ta: 1, a: ap });
      if (ap > 0.5) lighter(g, () => this.figEyes(look, 266, 170, 2, 0.42).forEach(([ex, ey]) => glow(g, ex, ey, 2.4, '#ffd040', 1)));
      g.restore();
      if (t > 0.1) H.ExplosionKit.bubble(g, 112, 22, 'В «Джунс» каждый день отличный!', seg(t, 0.1, 0.2), false);
      if (t > 0.6) H.ExplosionKit.bubble(g, 236, 156, 'Тебе здесь просто скучно.', seg(t, 0.6, 0.72), true);
    }

    yosukeShadow(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#2a2008'], [1, '#6a5418']]);
      lighter(g, () => glow(g, 230, 130, 110, '#ffd040', 0.25));
      const accept = seg(t, 0.5, 0.7), sx = 230;
      figure(g, look, sx, 228, 3, { s: 0.72, tint: '#120e08', ta: 1, a: 1 - accept * 0.8 });
      if (accept < 1) lighter(g, () => this.figEyes(look, sx, 228, 3, 0.72).forEach(([ex, ey]) => glow(g, ex, ey, 3, '#ffd040', 1 - accept)));
      if (accept > 0) lighter(g, () => glow(g, sx, 150, 90 * accept, '#5fe0a8', 0.5 * accept));
      figure(g, look, 92, 230, 3, { s: 0.72 });
      if (t < 0.55) H.ExplosionKit.bubble(g, 92, 40, 'Ты не я!', seg(t, 0.05, 0.15), false);
      else H.ExplosionKit.bubble(g, 92, 40, 'Ладно. Ты это я. Я это ты.', seg(t, 0.55, 0.65), false);
    }

    yosukeJiraiya(g, t, T, look) {
      this.roadBack(g, T);
      rect(g, 'rgba(10,30,20,0.35)', 0, 0, LW, LH);
      const rise = eOut(seg(t, 0, 0.5));
      lighter(g, () => { for (let k = 0; k < 3; k++) { g.strokeStyle = rgba('#8affc8', 0.6 - k * 0.15); g.lineWidth = 2; g.beginPath(); g.ellipse(CX + 20, 150, 60 + k * 30 + rise * 20, 18 + k * 8, T * 3 + k, 0, Math.PI * 1.4); g.stroke(); } });
      H.Personas.draw(g, 'jiraiya', CX + 20, 238 - (1 - rise) * 40, 190, { a: rise, t: T });
      this.trashCan(g, lerp(250, 340, seg(t, 0.3, 0.9)), lerp(196, 120, seg(t, 0.3, 0.9)), 1.2, T * 8, false);
      figure(g, look, 70, 230, 3, { s: 0.66 });
      for (let i = 0; i < 18; i++) { const ph = (T * 1.6 + hx(i, 1, 101)) % 1; poly(g, rgba(i % 2 ? '#5a9a3a' : '#c8e8a0', 0.9), [ph * LW + hx(i, 2, 101) * 40, 60 + hx(i, 3, 101) * 140, ph * LW + 6 + hx(i, 2, 101) * 40, 58 + hx(i, 3, 101) * 140, ph * LW + 4 + hx(i, 2, 101) * 40, 63 + hx(i, 3, 101) * 140]); }
      if (t > 0.1) H.ExplosionKit.bubble(g, 70, 70, 'Джирайя!', seg(t, 0.1, 0.2), false);
    }

    yosukePose(g, t, T, look) {
      this.roadBack(g, T);
      rect(g, 'rgba(10,30,20,0.3)', 0, 0, LW, LH);
      H.Personas.draw(g, 'jiraiya', CX + 52, 226, 200, { a: 0.9, t: T });
      lighter(g, () => { glow(g, CX, 200, 90, '#5fe0a8', 0.3); for (let k = 0; k < 2; k++) { g.strokeStyle = rgba('#8affc8', 0.4); g.lineWidth = 1.5; g.beginPath(); g.ellipse(CX - 20, 200, 70 + k * 26, 14 + k * 6, T * 2 + k, 0, Math.PI * 1.3); g.stroke(); } });
      const x = CX - 26, y = 232 + Math.sin(T * 1.6) * 1.5;
      figure(g, look, x - 2, y, 3, { s: 0.72, tint: '#5fe0a8', ta: 1 });
      figure(g, look, x, y, 3, { s: 0.72 });
      this.trashCan(g, 270, 236, 1.1, 0, true);
      K.vignette(g, 0.4, '#0a2a1a');
      K.flash(g, '#ffffff', 0.6 * (1 - seg(t, 0, 0.2)));
    }

    riverBack(g, T) {
      vgrad(g, 0, 150, [[0, '#f0b070'], [1, '#f8dca0']]);
      lighter(g, () => glow(g, 250, 60, 50, '#fff0c0', 0.6));
      rect(g, '#7a9a5a', 0, 130, LW, 30);
      vgrad(g, 150, 190, [[0, '#6a8aa8'], [1, '#4a6a88']]);
      for (let i = 0; i < 10; i++) rect(g, rgba('#f8e0b0', 0.5), (i * 37 + T * 10) % LW, 158 + (i % 4) * 7, 14, 1);
      rect(g, '#8a7a5a', 0, 186, LW, 54);
    }

    iceSpike(g, x, y, h, a) {
      if (a <= 0 || h <= 0) return;
      poly(g, rgba('#bfe8ff', a), [x - h * 0.22, y, x, y - h, x + h * 0.22, y]);
      poly(g, rgba('#ffffff', a * 0.8), [x - h * 0.06, y, x, y - h, x + h * 0.08, y - h * 0.3]);
    }

    chieKick(g, t, T, look) {
      this.riverBack(g, T);
      const hit = seg(t, 0.4, 0.5), shake = hit > 0 && hit < 1 ? Math.sin(T * 60) * 2 : 0;
      g.save(); g.translate(206 + shake, 200); g.rotate(hit * 0.15);
      rect(g, '#6a4a2a', -6, -70, 12, 70); rect(g, '#8a6a3a', -14, -62, 28, 8); rect(g, '#8a6a3a', -14, -34, 28, 8);
      g.restore();
      const lean = eOut(seg(t, 0.25, 0.45)) * (1 - seg(t, 0.7, 0.9));
      g.save(); g.translate(150, 214); g.rotate(-0.45 * lean);
      figure(g, look, 0, 0, 3, { s: 0.62 });
      g.restore();
      if (lean > 0.3) lighter(g, () => { g.strokeStyle = rgba('#ffffff', 0.8 * lean); g.lineWidth = 3; g.beginPath(); g.arc(150, 214, 64, -1.6, -0.55); g.stroke(); });
      if (hit > 0 && hit < 1) lighter(g, () => { star4(g, 196, 150, 26 * (1 - hit), '#ffffff', 1); ring(g, rgba('#ffffff', 1 - hit), 2, 196, 150, 8 + hit * 30); });
      if (t > 0.35) H.ExplosionKit.bubble(g, 90, 46, 'Хья-а-а!', seg(t, 0.35, 0.45), false);
    }

    chieSteak(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#3a2414'], [1, '#6a4020']]);
      rect(g, '#5a3018', 0, 0, LW, 40); for (let i = 0; i < 3; i++) rect(g, '#f2e2b8', 14 + i * 102, 8, 90, 24);
      g.save(); g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#7a2414'; g.textAlign = 'center'; ['«АЙЯ»', 'МЕГАГОВЯДИНА', 'В ДОЖДЬ'].forEach((s, i) => g.fillText(s, 59 + i * 102, 24)); g.textAlign = 'left'; g.restore();
      rect(g, '#7a4a28', 0, 170, LW, 70); rect(g, '#a06a3a', 0, 168, LW, 4);
      this.bust(g, look, 118, LH + 8, 128, 1.3);
      const bowl = eOut(seg(t, 0, 0.3)), bx = 228, by = 182;
      ell(g, '#f2f2ee', bx, by, 54 * bowl, 14 * bowl);
      ell(g, '#c8242e', bx, by - 4, 50 * bowl, 30 * bowl);
      ell(g, '#8a3a1a', bx, by - 26 * bowl, 46 * bowl, 34 * bowl);
      for (let i = 0; i < 6; i++) ell(g, '#b0582a', bx - 30 + i * 12, by - 40 * bowl + (i % 2) * 6, 9 * bowl, 5 * bowl, 0.3);
      lighter(g, () => { for (let i = 0; i < 4; i++) { const ph = (T * 0.8 + i * 0.25) % 1; g.strokeStyle = rgba('#ffffff', 0.4 * (1 - ph)); g.lineWidth = 1.5; g.beginPath(); g.moveTo(bx - 20 + i * 12, by - 60 - ph * 30); g.quadraticCurveTo(bx - 10 + i * 12, by - 70 - ph * 30, bx - 20 + i * 12, by - 84 - ph * 30); g.stroke(); } });
      if (t > 0.3) { lighter(g, () => { const [ex, ey] = this.bustAt(look, 118, LH + 8, 128, 1.3, -1), [rx] = this.bustAt(look, 118, LH + 8, 128, 1.3, 1); star4(g, ex, ey, 6, '#ffe080', 1); star4(g, rx, ey, 6, '#ffe080', 1); }); H.ExplosionKit.bubble(g, 120, 50, 'Мясо! Вот где сила!', seg(t, 0.3, 0.4), false); }
    }

    chieShadow(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#2a2008'], [1, '#6a5418']]);
      lighter(g, () => glow(g, 230, 130, 110, '#ffd040', 0.25));
      const accept = seg(t, 0.6, 0.8), sx = 230;
      figure(g, look, sx, 228, 3, { s: 0.68, tint: '#120e08', ta: 1, a: 1 - accept * 0.8 });
      if (accept < 1) lighter(g, () => this.figEyes(look, sx, 228, 3, 0.68).forEach(([ex, ey]) => glow(g, ex, ey, 3, '#ffd040', 1 - accept)));
      if (accept > 0) lighter(g, () => glow(g, sx, 150, 90 * accept, '#8adfff', 0.5 * accept));
      figure(g, look, 92, 230, 3, { s: 0.68 });
      if (t > 0.05) H.ExplosionKit.bubble(g, 228, 40, 'Тебе нужна слабая Юкико.', seg(t, 0.05, 0.15) * (1 - accept), true);
      if (t < 0.6) H.ExplosionKit.bubble(g, 92, 70, 'Неправда!', seg(t, 0.25, 0.35), false);
      else H.ExplosionKit.bubble(g, 92, 70, 'Правда. И это тоже я.', seg(t, 0.6, 0.7), false);
    }

    chieTomoe(g, t, T, look) {
      this.riverBack(g, T);
      rect(g, 'rgba(10,30,60,0.4)', 0, 0, LW, LH);
      const rise = eOut(seg(t, 0, 0.45)), kick = seg(t, 0.35, 0.7);
      lighter(g, () => glow(g, CX + 30, 150, 120, '#8adfff', 0.35 * rise));
      H.Personas.draw(g, 'tomoe', CX + 40, 240 - (1 - rise) * 40, 190, { a: rise, swing: lerp(0.4, -0.5, kick) });
      for (let i = 0; i < 7; i++) this.iceSpike(g, 120 + i * 30, 214, (30 + hx(i, 1, 111) * 40) * eOut(seg(kick, i * 0.08, i * 0.08 + 0.4)), 0.95);
      g.save(); g.translate(70, 228); g.rotate(-0.4 * eOut(kick)); figure(g, look, 0, 0, 3, { s: 0.62 }); g.restore();
      for (let i = 0; i < 20; i++) { const ph = (T * 1.2 + hx(i, 1, 113)) % 1; star4(g, 30 + hx(i, 2, 113) * 260, 220 - ph * 180, 2.4, '#e8f8ff', Math.sin(Math.PI * ph)); }
      if (t > 0.05) H.ExplosionKit.bubble(g, 74, 60, 'Томоэ! Буфу!', seg(t, 0.05, 0.15), false);
    }

    chiePose(g, t, T, look) {
      this.riverBack(g, T);
      rect(g, 'rgba(10,30,60,0.3)', 0, 0, LW, LH);
      H.Personas.draw(g, 'tomoe', CX + 54, 226, 196, { a: 0.9, swing: 0.1 * Math.sin(T * 1.4) });
      lighter(g, () => glow(g, CX, 200, 90, '#8adfff', 0.3));
      for (let i = 0; i < 5; i++) this.iceSpike(g, 30 + i * 60 + (i > 2 ? 40 : 0), 236, 24 + hx(i, 3, 115) * 20, 0.8);
      const x = CX - 26, y = 232 + Math.sin(T * 1.6) * 1.5;
      figure(g, look, x - 2, y, 3, { s: 0.72, tint: '#8adfff', ta: 1 });
      figure(g, look, x, y, 3, { s: 0.72 });
      K.vignette(g, 0.4, '#0a1a2a');
      K.flash(g, '#ffffff', 0.6 * (1 - seg(t, 0, 0.2)));
    }

    innBack(g, T) {
      vgrad(g, 0, LH, [[0, '#1a1428'], [1, '#3a2a30']]);
      poly(g, '#2a1a14', [10, 70, CX, 20, 310, 70]);
      rect(g, '#5a3a24', 30, 70, 260, 130); rect(g, '#3a2418', 30, 70, 260, 6);
      for (let i = 0; i < 6; i++) rect(g, '#f2e4c0', 40 + i * 42, 90, 34, 60);
      for (let i = 0; i < 6; i++) rect(g, 'rgba(90,58,36,0.6)', 56 + i * 42, 90, 2, 60);
      rect(g, '#2a2a6a', 120, 120, 80, 40); for (let i = 0; i < 4; i++) rect(g, '#1a1a4a', 128 + i * 18, 120, 2, 40);
      g.save(); g.font = 'bold 10px Georgia, serif'; g.fillStyle = '#f2e4c0'; g.textAlign = 'center'; g.fillText('АМАГИ', CX, 142); g.textAlign = 'left'; g.restore();
      for (const x of [70, 250]) { lighter(g, () => glow(g, x, 110, 26, '#ffb060', 0.6 + 0.1 * Math.sin(T * 5 + x))); ell(g, '#e85a2a', x, 110, 9, 12); rect(g, '#3a2418', x - 6, 97, 12, 3); rect(g, '#3a2418', x - 6, 120, 12, 3); }
      rect(g, '#6a6a70', 0, 200, LW, 40);
    }

    petals(g, T, n, seed, col) {
      for (let i = 0; i < n; i++) { const ph = (T * 0.35 + hx(i, 1, seed)) % 1, x = hx(i, 2, seed) * LW + Math.sin(T * 2 + i) * 10, y = ph * LH; g.save(); g.translate(x, y); g.rotate(T * 2 + i); ell(g, i % 3 ? col : '#ffffff', 0, 0, 2.6, 1.4); g.restore(); }
    }

    flames(g, T, x, y, w, h, a) {
      if (a <= 0) return;
      lighter(g, () => {
        glow(g, x, y - h * 0.3, w, '#ff6a20', 0.5 * a);
        for (let i = 0; i < 9; i++) { const fx = x + (i - 4) * w / 9, fh = h * (0.5 + 0.5 * hx(i, Math.floor(T * 10), 121)); poly(g, rgba(i % 2 ? '#ffb040' : '#ff5a1a', a), [fx - w / 14, y, fx + Math.sin(T * 8 + i) * 4, y - fh, fx + w / 14, y]); }
      });
    }

    yukikoInn(g, t, T, look) {
      this.innBack(g, T);
      const bow = Math.sin(Math.PI * seg(t, 0.3, 0.9)) * 0.35;
      g.save(); g.translate(CX, 214); g.rotate(bow * 0.5);
      figure(g, look, 0, 0, 3, { s: 0.6 });
      g.restore();
      if (t > 0.15) H.ExplosionKit.bubble(g, CX, 22, 'Добро пожаловать в гостиницу «Амаги».', seg(t, 0.15, 0.25), false);
    }

    yukikoLaugh(g, t, T, look) {
      this.innBack(g, T);
      rect(g, 'rgba(10,6,20,0.45)', 0, 0, LW, LH);
      const sh = Math.sin(T * 40) * 2 * seg(t, 0.2, 0.3);
      this.bust(g, t > 0.08 ? vlook(look, { closed: true, mouth: 'open', blush: true }) : look, CX + sh, LH + 10, 128, 1.45);
      g.save(); g.font = 'bold 13px Georgia, serif';
      [['Пф…', 40, 60, 0.1], ['Ха-ха!', 210, 50, 0.3], ['Ха-ха-ха!', 60, 120, 0.45], ['Ха-ха…', 230, 130, 0.6]].forEach(([s, x, y, at]) => { const a = seg(t, at, at + 0.1); if (a > 0) { g.globalAlpha = a; g.fillStyle = '#1a0a10'; g.fillText(s, x + 1, y + 1); g.fillStyle = '#ffd0e0'; g.fillText(s, x, y); } });
      g.restore();
    }

    yukikoCage(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#2a0a14'], [1, '#5a1a2a']]);
      lighter(g, () => glow(g, 228, 120, 110, '#ffd040', 0.22));
      const brk = seg(t, 0.65, 0.95), cx = 228;
      figure(g, look, cx, 214, 3, { s: 0.55, tint: '#120808', ta: 1, a: 1 - seg(t, 0.75, 1) * 0.8 });
      if (brk < 0.6) lighter(g, () => this.figEyes(look, cx, 214, 3, 0.55).forEach(([ex, ey]) => glow(g, ex, ey, 2.6, '#ffd040', 1 - brk)));
      for (let i = 0; i < 9; i++) {
        const a = -0.9 + i * 0.225, x0 = cx + Math.sin(a) * 52, fly = brk * (i - 4) * 14;
        g.save(); g.globalAlpha = 1 - brk; g.translate(fly, brk * 30 * Math.abs(i - 4));
        line(g, '#d8b050', 2, cx, 36, x0, 90); line(g, '#d8b050', 2, x0, 90, x0, 218);
        g.restore();
      }
      if (brk < 1) { g.save(); g.globalAlpha = 1 - brk; ell(g, '#d8b050', cx, 218, 56, 6); ring(g, '#d8b050', 2, cx, 30, 6); g.restore(); }
      if (brk > 0) lighter(g, () => glow(g, cx, 150, 90 * brk, '#ff8ab0', 0.5 * brk));
      figure(g, look, 80, 230, 3, { s: 0.68 });
      if (t > 0.05) H.ExplosionKit.bubble(g, 228, 8, 'Увезите меня отсюда!', seg(t, 0.05, 0.15) * (1 - brk), true);
      if (t < 0.6) H.ExplosionKit.bubble(g, 80, 60, 'Я не такая!', seg(t, 0.3, 0.4), false);
      else H.ExplosionKit.bubble(g, 80, 60, 'Я хотела уйти. Это тоже я.', seg(t, 0.6, 0.7), false);
    }

    yukikoSakuya(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#1a0610'], [1, '#4a0e1e']]);
      const rise = eOut(seg(t, 0, 0.5));
      this.flames(g, T, CX + 30, 236, 220, 80 + rise * 60, 0.9);
      H.Personas.draw(g, 'sakuya', CX + 30, 236 - (1 - rise) * 40, 196, { a: rise, t: T });
      this.petals(g, T, 26, 123, '#ff9ac0');
      figure(g, look, 70, 230, 3, { s: 0.66 });
      if (t > 0.05) H.ExplosionKit.bubble(g, 74, 60, 'Конохана Сакуя! Аги!', seg(t, 0.05, 0.15), false);
      K.flash(g, '#ffd0a0', 0.5 * (1 - seg(t, 0, 0.2)));
    }

    yukikoPose(g, t, T, look) {
      this.innBack(g, T);
      rect(g, 'rgba(40,6,20,0.45)', 0, 0, LW, LH);
      H.Personas.draw(g, 'sakuya', CX + 54, 224, 196, { a: 0.9, t: T });
      this.flames(g, T, CX, 240, 260, 40, 0.6);
      this.petals(g, T, 20, 125, '#ff9ac0');
      const x = CX - 26, y = 232 + Math.sin(T * 1.6) * 1.5;
      figure(g, look, x - 2, y, 3, { s: 0.72, tint: '#ff8ab0', ta: 1 });
      figure(g, look, x, y, 3, { s: 0.72 });
      K.vignette(g, 0.4, '#2a0610');
      K.flash(g, '#ffffff', 0.6 * (1 - seg(t, 0, 0.2)));
    }

    bunny(g, x, y, s, a) {
      if (a <= 0) return;
      g.save(); g.globalAlpha = cl(a); g.translate(x, y); g.scale(s, s);
      ell(g, '#f4f0ec', 0, 0, 10, 9);
      ell(g, '#f4f0ec', -5, -14, 3, 9, -0.2); ell(g, '#f4f0ec', 5, -14, 3, 9, 0.2);
      ell(g, '#ffb0c0', -5, -13, 1.2, 6, -0.2); ell(g, '#ffb0c0', 5, -13, 1.2, 6, 0.2);
      ell(g, '#1e1e22', -3, -1, 1, 1); ell(g, '#1e1e22', 3, -1, 1, 1); ell(g, '#ff8aa0', 0, 2, 1, 0.7);
      for (let i = 0; i < 4; i++) line(g, '#c8242e', 0.8, -6 + i * 4, 7, -4 + i * 4, 5);
      g.restore();
    }

    nightRiver(g, T) {
      vgrad(g, 0, LH, [[0, '#04061a'], [0.6, '#10183a'], [1, '#1a1a24']]);
      K.stars(g, T, 40, 131, 0.6, 110);
      rect(g, '#0e1430', 0, 130, LW, 40);
      for (let i = 0; i < 10; i++) rect(g, rgba('#6a8ab8', 0.5), (i * 37 + T * 8) % LW, 140 + (i % 4) * 6, 12, 1);
      rect(g, '#2a2a30', 0, 170, LW, 70);
    }

    kanjiGang(g, t, T, look) {
      this.nightRiver(g, T);
      const run = seg(t, 0.4, 1.0);
      for (let i = 0; i < 3; i++) {
        const x = lerp(210 + i * 30, 360 + i * 30, run), y = 214, b = Math.abs(Math.sin(T * 14 + i)) * 4;
        g.save(); g.translate(x, y - b);
        ell(g, '#0a0a12', 0, -38, 7, 8); poly(g, '#0a0a12', [-9, -30, 9, -30, 7, -8, -7, -8]); poly(g, '#0a0a12', [-7, -8, -2, -8, -6, 0, -10, 0]); poly(g, '#0a0a12', [7, -8, 2, -8, 8, 0, 12, 0]);
        if (run < 0.2) { ell(g, '#ffffff', -2, -39, 1, 1); ell(g, '#ffffff', 2, -39, 1, 1); }
        g.restore();
      }
      ell(g, '#3a3a40', 270, 214, 24, 6); ring(g, '#5a5a62', 3, 252, 204, 9); ring(g, '#5a5a62', 3, 290, 204, 9);
      figure(g, look, 96, 228, 3, { s: 0.7 });
      g.save(); g.translate(128, 104); g.rotate(0.35); rect(g, '#7a7a84', -12, -2, 24, 4); rect(g, '#9a9aa4', 8, -26, 4, 26); rect(g, '#6a6a72', -12, 2, 3, 20); rect(g, '#6a6a72', 9, 2, 3, 20); rect(g, '#5a5a62', -10, 12, 20, 2); g.restore();
      if (t > 0.05) H.ExplosionKit.bubble(g, 120, 30, 'Кто тут шумит по ночам?!', seg(t, 0.05, 0.15), false);
      if (t > 0.45) H.ExplosionKit.bubble(g, 256, 120, 'Это Канджи! Бежим!', seg(t, 0.45, 0.55), true);
    }

    kanjiShop(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#1a1018'], [1, '#3a2418']]);
      for (let i = 0; i < 6; i++) { const x = i * 54; rect(g, '#2a1a14', x, 20, 50, 110); for (let j = 0; j < 4; j++) rect(g, ['#c8243a', '#3a6ac8', '#e8d070', '#f2ece0', '#6ac87a'][(i + j) % 5], x + 3, 26 + j * 26, 44, 20); }
      lighter(g, () => glow(g, 180, 60, 60, '#ffd890', 0.4));
      rect(g, '#5a3a26', 0, 170, LW, 70);
      this.bust(g, look, 112, LH + 10, 128, 1.4);
      const sew = seg(t, 0, 0.8);
      this.bunny(g, 230, 180, 3.2, 1);
      lighter(g, () => { g.strokeStyle = rgba('#f4f4ff', 0.9); g.lineWidth = 1; g.beginPath(); g.moveTo(170, 150); g.quadraticCurveTo(200 + Math.sin(T * 6) * 10, 120, 230 - 20 + sew * 40, 196); g.stroke(); star4(g, 230 - 20 + sew * 40, 196, 4, '#ffffff', 1); });
      for (let i = 0; i < 8; i++) { const ph = (T * 0.5 + hx(i, 1, 141)) % 1; star4(g, 150 + hx(i, 2, 141) * 160, 210 - ph * 160, 2.4, '#ffe8f0', Math.sin(Math.PI * ph)); }
      if (t > 0.3) H.ExplosionKit.bubble(g, 112, 40, 'Ровнее стежок. Вот так.', seg(t, 0.3, 0.4), true);
    }

    kanjiShadow(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#2a0e08'], [1, '#5a2410']]);
      lighter(g, () => { glow(g, 230, 130, 110, '#ffd040', 0.22); for (let i = 0; i < 10; i++) { const ph = (T * 0.3 + hx(i, 1, 143)) % 1; rect(g, rgba('#ffc890', 0.3 * Math.sin(Math.PI * ph)), hx(i, 2, 143) * LW, LH - ph * LH, 3, 3); } });
      const accept = seg(t, 0.62, 0.82), sx = 230;
      figure(g, look, sx, 228, 3, { s: 0.7, tint: '#120808', ta: 1, a: 1 - accept * 0.8 });
      if (accept < 1) lighter(g, () => this.figEyes(look, sx, 228, 3, 0.7).forEach(([ex, ey]) => glow(g, ex, ey, 3, '#ffd040', 1 - accept)));
      this.bunny(g, sx + 26, 150, 1.6, 1 - accept);
      if (accept > 0) lighter(g, () => glow(g, sx, 150, 90 * accept, '#ffd040', 0.5 * accept));
      figure(g, look, 88, 230, 3, { s: 0.7 });
      if (t > 0.05) H.ExplosionKit.bubble(g, 222, 22, 'Ты боишься, что тебя засмеют.', seg(t, 0.05, 0.15) * (1 - accept), true);
      if (t < 0.62) H.ExplosionKit.bubble(g, 88, 50, 'Заткнись!', seg(t, 0.3, 0.4), false);
      else H.ExplosionKit.bubble(g, 92, 50, 'Боюсь. И всё равно шью.', seg(t, 0.62, 0.72), false);
    }

    kanjiMikazuchi(g, t, T, look) {
      this.nightRiver(g, T);
      const rise = eOut(seg(t, 0, 0.45)), slam = seg(t, 0.55, 0.65), shake = slam > 0 && slam < 1 ? Math.sin(T * 70) * 3 : 0;
      g.save(); g.translate(shake, 0);
      lighter(g, () => glow(g, CX + 30, 150, 120, '#ffd040', 0.3 * rise));
      H.Personas.draw(g, 'mikazuchi', CX + 30, 238 - (1 - rise) * 40, 204, { a: rise, swing: lerp(-0.4, 1.3, eOut(slam)) });
      if (slam > 0) { for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.1 + i * 0.16); line(g, '#ffd040', 2, 250, 222, 250 + Math.cos(a) * 60 * slam, 222 + Math.sin(a) * 10 * slam); } this.bolt(g, 250, 0, 250, 222, 7, T, 1 - seg(t, 0.7, 0.95)); }
      figure(g, look, 70, 230, 3, { s: 0.66 });
      g.restore();
      if (t > 0.05) H.ExplosionKit.bubble(g, 74, 60, 'Такэ-Микадзути!', seg(t, 0.05, 0.15), false);
      K.flash(g, '#fff4c0', 0.7 * slam * (1 - seg(t, 0.65, 0.8)));
    }

    kanjiStitch(g, t, T, look) {
      this.nightRiver(g, T);
      const pull = eOut(seg(t, 0, 0.45)), hit = seg(t, 0.5, 0.65), a = 1 - seg(t, 0.6, 0.8);
      this.shade(g, lerp(80, 136, pull), 196, 1.4, T, a, 1);
      this.shade(g, lerp(250, 196, pull), 196, 1.4, T, a, 2);
      lighter(g, () => { g.strokeStyle = rgba('#fff4f8', 0.95 * a); g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i <= 12; i++) { const x = lerp(lerp(80, 136, pull), lerp(250, 196, pull), i / 12), y = 172 + (i % 2 ? -8 : 8) * (1 - pull * 0.6); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); });
      if (hit > 0) { this.bolt(g, CX + 6, 0, CX + 6, 180, 9, T, 1 - seg(t, 0.7, 0.9)); lighter(g, () => { ring(g, rgba('#ffd040', 1 - hit), 3, CX + 6, 180, 10 + hit * 80); glow(g, CX + 6, 180, 70 * (1 - hit), '#ffffff', 0.8); }); }
      if (t > 0.05) H.ExplosionKit.bubble(g, CX, 40, 'Сшил. Теперь получайте оба!', seg(t, 0.05, 0.15), false);
    }

    kanjiPose(g, t, T, look) {
      this.nightRiver(g, T);
      H.Personas.draw(g, 'mikazuchi', CX + 54, 228, 206, { a: 0.92, swing: 0.2 * Math.sin(T * 1.2) });
      lighter(g, () => glow(g, CX, 200, 90, '#ffd040', 0.28));
      for (let i = 0; i < 2; i++) if (hx(i, Math.floor(T * 5), 147) > 0.55) this.bolt(g, CX + 70 + i * 16, 30, CX + 40 + i * 30, 150, i + 21, T, 0.5);
      const x = CX - 26, y = 232 + Math.sin(T * 1.4) * 1.5;
      figure(g, look, x - 2, y, 3, { s: 0.72, tint: '#ffd040', ta: 1 });
      figure(g, look, x, y, 3, { s: 0.72 });
      this.bunny(g, x + 30, y - 120, 1.4, 1);
      K.vignette(g, 0.4, '#1a1004');
      K.flash(g, '#ffffff', 0.6 * (1 - seg(t, 0, 0.2)));
    }

    idolStage(g, T, tint) {
      vgrad(g, 0, LH, [[0, '#0a0418'], [1, '#2a0a2a']]);
      lighter(g, () => { for (const [x, a] of [[60, 0.4], [160, -0.1], [260, -0.4]]) poly(g, rgba(tint || '#ff9ad8', 0.14), [x - 8, 0, x + 8, 0, x + 60 + a * 80, 200, x - 60 + a * 80, 200]); });
      rect(g, '#1a0a1e', 0, 196, LW, 44); rect(g, '#ff6ab0', 0, 196, LW, 2);
      for (let i = 0; i < 26; i++) { const x = 6 + i * 12, y = 226 + Math.sin(T * 6 + i) * 4; line(g, i % 3 ? '#ff8ac8' : '#7ae0ff', 2, x, y, x + Math.sin(T * 6 + i) * 4, y - 10); }
    }

    tofuShop(g, T) {
      vgrad(g, 0, LH, [[0, '#2a2418'], [1, '#4a3a28']]);
      rect(g, '#f2ece0', 20, 20, 280, 40); rect(g, '#2a4a8a', 20, 20, 280, 6);
      g.save(); g.font = 'bold 14px Georgia, serif'; g.fillStyle = '#2a4a8a'; g.textAlign = 'center'; g.fillText('ТОФУ «МАРУКЮ»', CX, 50); g.textAlign = 'left'; g.restore();
      rect(g, '#6a4a2a', 0, 170, LW, 70); rect(g, '#8a6a3a', 0, 168, LW, 4);
      for (let i = 0; i < 4; i++) { rect(g, '#5a7aa8', 170 + i * 34, 150, 30, 20); rect(g, '#f8f8f2', 174 + i * 34, 152, 22, 12); }
    }

    hud(g, x, y, w, h, T, title) {
      rect(g, rgba('#1a0a24', 0.8), x, y, w, h); g.strokeStyle = '#ff6ab0'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      rect(g, '#ff6ab0', x, y, w, 11);
      g.save(); g.font = 'bold 8px Georgia, serif'; g.fillStyle = '#1a0a24'; g.fillText(title, x + 4, y + 9); g.restore();
    }

    riseStage(g, t, T, look) {
      this.idolStage(g, T);
      const x = CX, y = 200 + Math.abs(Math.sin(T * 6)) * -3;
      lighter(g, () => glow(g, x, 130, 80, '#ff9ad8', 0.4));
      figure(g, look, x, y, 3, { s: 0.62 });
      for (let i = 0; i < 6; i++) { const a = T * 2 + i; star4(g, x + Math.cos(a) * 60, 110 + Math.sin(a) * 30, 4, '#fff0f8', 0.8); }
      if (t > 0.1) H.ExplosionKit.bubble(g, x, 20, 'Всем привет! Это Рисетт!', seg(t, 0.1, 0.2), false);
    }

    riseTofu(g, t, T, look) {
      this.tofuShop(g, T);
      this.bust(g, look, 110, LH + 8, 128, 1.35);
      this.glasses(g, look, 110, LH + 8, 128, 1.35, 0, '#2a2a30');
      if (t > 0.2) H.ExplosionKit.bubble(g, 200, 82, 'Тофу свежий. Только не узнавайте меня.', seg(t, 0.2, 0.3), true);
    }

    riseShadow(g, t, T, look) {
      this.idolStage(g, T, '#ffd040');
      const accept = seg(t, 0.62, 0.82), sx = 228;
      figure(g, look, sx, 214, 3, { s: 0.62, tint: '#140810', ta: 1, a: 1 - accept * 0.8 });
      if (accept < 1) lighter(g, () => this.figEyes(look, sx, 214, 3, 0.62).forEach(([ex, ey]) => glow(g, ex, ey, 3, '#ffd040', 1 - accept)));
      if (accept > 0) lighter(g, () => glow(g, sx, 140, 90 * accept, '#ff9ad8', 0.5 * accept));
      figure(g, look, 88, 222, 3, { s: 0.66 });
      if (t > 0.05) H.ExplosionKit.bubble(g, 222, 16, 'Смотрите! Какая я настоящая?', seg(t, 0.05, 0.15) * (1 - accept), true);
      if (t < 0.62) H.ExplosionKit.bubble(g, 88, 46, 'Ты не я!', seg(t, 0.3, 0.4), false);
      else H.ExplosionKit.bubble(g, 92, 46, 'Я и Рисетт, и Рисе. Обе.', seg(t, 0.62, 0.72), false);
    }

    riseHimiko(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#04061a'], [1, '#1a0a3a']]);
      const rise = eOut(seg(t, 0, 0.5));
      lighter(g, () => { for (let i = 0; i < 4; i++) { const q = (T * 0.8 + i * 0.25) % 1; g.strokeStyle = rgba('#ffd850', (1 - q) * 0.7 * rise); g.lineWidth = 1.5; g.beginPath(); g.ellipse(CX + 30, 80, 20 + q * 150, 10 + q * 80, 0, 0, Math.PI * 2); g.stroke(); } glow(g, CX + 30, 120, 110, '#ff9ad8', 0.3 * rise); });
      H.Personas.draw(g, 'himiko', CX + 30, 238 - (1 - rise) * 40, 196, { a: rise, t: T });
      figure(g, look, 70, 230, 3, { s: 0.66 });
      if (t > 0.05) H.ExplosionKit.bubble(g, 74, 60, 'Химико! Начинаю анализ.', seg(t, 0.05, 0.15), false);
    }

    riseScan(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#04061a'], [1, '#140a2a']]);
      for (let x = 0; x < LW; x += 16) rect(g, rgba('#ff6ab0', 0.12), x, 0, 1, LH);
      for (let y = 0; y < LH; y += 16) rect(g, rgba('#ff6ab0', 0.12), 0, y, LW, 1);
      this.shade(g, 110, 190, 2.4, T, 1, 5);
      const k = eOut(seg(t, 0, 0.3));
      g.save(); g.translate(lerp(LW + 10, 180, k), 30);
      this.hud(g, 0, 0, 130, 120, T, 'ПОЛНЫЙ АНАЛИЗ');
      g.font = '8px Georgia, serif';
      [['phys', 'Слаб'], ['fire', 'Слаб'], ['ice', 'Сопр.'], ['elec', '—']].forEach(([e, s], i) => { G.elemIcon(g, e, 10, 24 + i * 14, 5); g.fillStyle = s === 'Слаб' ? '#ffd850' : '#bfb0d0'; g.fillText(H.ELEMENTS[e].name + ': ' + s, 20, 27 + i * 14); });
      g.fillStyle = '#ff6ab0'; g.fillText('Следующий ход:', 8, 92); g.fillStyle = '#ffffff'; g.fillText('удар по всем', 8, 104);
      g.restore();
      const w = seg(t, 0.45, 0.6);
      if (w > 0 && Math.floor(T * 6) % 2 === 0) { g.save(); g.font = 'bold 16px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#ff3a5a'; g.fillText('ОСТОРОЖНО!', 110, 70); g.textAlign = 'left'; g.restore(); }
      if (w > 0.5) lighter(g, () => { ring(g, rgba('#7ae0ff', 0.8), 2, 60, 210, 20); ring(g, rgba('#7ae0ff', 0.8), 2, 160, 210, 20); });
    }

    risePose(g, t, T, look) {
      this.idolStage(g, T);
      H.Personas.draw(g, 'himiko', CX + 56, 222, 200, { a: 0.9, t: T });
      lighter(g, () => { glow(g, CX, 190, 90, '#ff9ad8', 0.3); for (let i = 0; i < 3; i++) { const q = (T * 0.6 + i / 3) % 1; ring(g, rgba('#ffd850', (1 - q) * 0.5), 1, CX + 56, 120, 10 + q * 90); } });
      const x = CX - 26, y = 222 + Math.sin(T * 1.6) * 1.5;
      figure(g, look, x - 2, y, 3, { s: 0.7, tint: '#ff9ad8', ta: 1 });
      figure(g, look, x, y, 3, { s: 0.7 });
      for (let i = 0; i < 6; i++) { const ph = (T * 0.4 + i / 6) % 1, hx0 = 30 + i * 50; g.save(); g.globalAlpha = Math.sin(Math.PI * ph); g.translate(hx0, 190 - ph * 150); ell(g, '#ff8ac8', -2, 0, 2.6, 2.6); ell(g, '#ff8ac8', 2, 0, 2.6, 2.6); poly(g, '#ff8ac8', [-4.4, 0.6, 4.4, 0.6, 0, 5.4]); g.restore(); }
      K.vignette(g, 0.4, '#1a0418');
      K.flash(g, '#ffffff', 0.6 * (1 - seg(t, 0, 0.2)));
    }

    yuFog(g, t, T, look) {
      this.studio(g, T, 0);
      const on = seg(t, 0.25, 0.6), fog = 0.85 - 0.6 * on;
      rect(g, rgba('#d8c070', fog), 0, 0, LW, LH);
      const x = 150, y = LH + 10, size = 128, s = 1.5;
      this.bust(g, look, x, y, size, s);
      rect(g, rgba('#d8c070', fog * 0.5), 0, 0, LW, LH);
      this.glasses(g, look, x, y, size, s, lerp(60, 0, eOut(on)), '#4a4a56');
      if (on > 0.95) { const [gx, gy] = this.bustAt(look, x, y, size, s, 1); lighter(g, () => star4(g, gx + 6, gy - 4, 8 * (1 - seg(t, 0.6, 0.9)), '#ffffff', 1)); }
    }

    yuShades(g, t, T, look) {
      this.studio(g, T, 0.15);
      const k = eOut(seg(t, 0, 0.8));
      [[40, 180, 1.1, 0], [90, 196, 1.3, 1], [240, 192, 1.25, 2], [290, 176, 1.05, 3]].forEach(([x, y, s, i]) => this.shade(g, lerp(x < CX ? -40 : LW + 40, x, k), y + Math.sin(T * 3 + i) * 2, s, T, 1, i));
      figure(g, look, CX, 214, 2, { s: 0.95 });
      if (t > 0.5) H.ExplosionKit.bubble(g, 214, 60, 'Тени. Много теней.', seg(t, 0.5, 0.62), false);
    }

    yuVoice(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#02030c'], [1, '#0c1450']]);
      lighter(g, () => glow(g, 100, 110, 120, '#3a5ae0', 0.4));
      this.bust(g, look, 220, LH + 14, 128, 1.6);
      this.glasses(g, look, 220, LH + 14, 128, 1.6, 0, '#4a4a56');
      const cy = lerp(-60, 104, eOut(seg(t, 0.2, 0.7))), sp = Math.sin(T * 2.4) * 0.12;
      lighter(g, () => glow(g, 96, cy + 30, 40, '#7aa8ff', 0.6));
      g.save(); g.translate(96, cy + 30); g.scale(Math.cos(T * 1.6 + sp), 1); g.translate(-96, -(cy + 30));
      this.tarotFront(g, { kind: 'char', id: 'yu', rar: 5 }, 72, cy, 48, 74);
      g.restore();
      const a = seg(t, 0.35, 0.55) * (1 - seg(t, 1.0, 1.1));
      if (a > 0) {
        g.save(); g.globalAlpha = a; g.font = 'italic 13px Georgia, serif'; g.textAlign = 'center';
        lighter(g, () => { g.fillStyle = rgba('#7aa8ff', 0.6); g.fillText('Я есть ты… Ты есть я…', CX + 1, 31); });
        g.fillStyle = '#e8eeff'; g.fillText('Я есть ты… Ты есть я…', CX, 30);
        g.textAlign = 'left'; g.restore();
      }
    }

    yuCrush(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#02030c'], [1, '#0c1450']]);
      const rise = eOut(seg(t, 0.15, 0.7));
      lighter(g, () => { glow(g, CX, 150, 70 + 80 * rise, '#3a6aff', 0.7); for (let i = 0; i < 26; i++) { const ph = (T * 1.4 + hx(i, 1, 91)) % 1, x = CX + (hx(i, 2, 91) - 0.5) * 160; poly(g, rgba(i % 2 ? '#7aa8ff' : '#c8d8ff', (1 - ph) * 0.8), [x - 4, 220 - ph * 160, x, 200 - ph * 180, x + 4, 220 - ph * 160]); } });
      H.Personas.draw(g, 'izanagi', CX + 30, 236 + (1 - rise) * 60, 220, { a: rise, tint: rise < 0.6 ? '#1a2a6a' : null });
      figure(g, look, CX - 40, 230, 3, { s: 0.7 });
      const k = seg(t, 0, 0.18);
      if (k < 1) { g.save(); g.globalAlpha = 1 - k; this.tarotFront(g, { kind: 'char', id: 'yu', rar: 5 }, CX - 64, 96, 40, 62); g.restore(); }
      K.shards(g, seg(t, 0, 0.5), CX - 44, 126, 24, 9, '#9ac0ff', 70, '#ffffff');
      if (t > 0.1) H.ExplosionKit.bubble(g, 70, 56, 'Персона!', seg(t, 0.1, 0.22), false);
      K.flash(g, '#c8d8ff', 0.8 * (1 - seg(t, 0, 0.15)));
    }

    yuZio(g, t, T, look) {
      this.studio(g, T, 0.05);
      const hit = seg(t, 0.3, 0.45), boom = seg(t, 0.4, 0.85);
      [[44, 176, 1.1], [100, 194, 1.3], [236, 190, 1.25], [292, 174, 1.05]].forEach(([x, y, s], i) => { if (boom < 0.3) this.shade(g, x, y, s, T, 1 - boom * 3, i); });
      H.Personas.draw(g, 'izanagi', CX + 10, 230, 230, { swing: lerp(-0.6, 0.9, eOut(seg(t, 0.1, 0.35))) });
      figure(g, look, CX - 60, 230, 3, { s: 0.66 });
      [[44, 160], [100, 176], [236, 172], [292, 158]].forEach(([x, y], i) => this.bolt(g, CX + 40 + i * 6, 20, x, y, i + 3, T, hit * (1 - seg(t, 0.7, 0.9))));
      if (boom > 0 && boom < 1) lighter(g, () => [[44, 160], [100, 176], [236, 172], [292, 158]].forEach(([x, y]) => { ring(g, rgba('#e8d8ff', 1 - boom), 2, x, y, 6 + boom * 40); glow(g, x, y, 30 * (1 - boom), '#ffffff', 0.8); }));
      K.flash(g, '#f0e8ff', 0.6 * hit * (1 - seg(t, 0.45, 0.6)));
    }

    yuPose(g, t, T, look) {
      this.studio(g, T, 0.12);
      H.Personas.draw(g, 'izanagi', CX + 46, 222, 204, { a: 0.85 + 0.1 * Math.sin(T * 2), swing: 0.3 + 0.05 * Math.sin(T * 1.3) });
      lighter(g, () => glow(g, CX, 200, 90, '#ffd040', 0.25));
      for (let i = 0; i < 3; i++) if (hx(i, Math.floor(T * 6), 97) > 0.6) this.bolt(g, CX + 50 + i * 10, 40, CX + 20 + i * 20, 120 + i * 20, i + 11, T, 0.5);
      const x = CX - 26, y = 232 + Math.sin(T * 1.4) * 1.5;
      figure(g, look, x - 2, y, 3, { s: 0.72, tint: '#ffd040', ta: 1 });
      figure(g, look, x, y, 3, { s: 0.72 });
      K.vignette(g, 0.4, '#3a2a08');
      K.flash(g, '#ffffff', 0.6 * (1 - seg(t, 0, 0.2)));
    }

    cutShot(g, r, t, T) {
      const look = G.lookOf(r.id, this.game), [beat, bt] = pick(CUTS[r.id], t), fn = this[r.id + beat[0].toUpperCase() + beat.slice(1)];
      if (fn) fn.call(this, g, bt, T, look);
    }

    paint() {
      const R = this.R, g = R.g, T = this.t + this.rt;
      if (this.phase === 'cine') {
        const [n, t] = this.shot();
        if (n === 'clock') this.clock(g, t, T);
        else if (n === 'tv') this.tv(R, g, t, T);
        else if (n === 'touch') this.touch(R, g, t, T);
        else if (n === 'fall') this.fall(R, g, t, T);
        else this.velvet(R, g, t, T);
      } else if (this.phase === 'reveal') {
        const r = this.item(), t = this.rt - this.hop;
        if (t < 0) this.hopShot(g, this.rt);
        else if (t < CARD || r.kind !== 'char') this.cardShot(g, r, Math.min(t, CARD + 0.4), T);
        else if (this.own(r)) this.cutShot(g, r, t - CARD, T);
        else if (t < CARD + CRUSH) this.crushShot(g, r, t - CARD, T);
        else this.poseShot(g, r, t - CARD - CRUSH, T);
      } else this.rackBg(g, T);
      H.Cine.dither(g);
      return R.cv;
    }

    render() { return this.paint(); }

    draw(c) {
      const cv = this.paint(), was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(cv, 0, 0, W, HGT);
      c.imageSmoothingEnabled = was;
      if (this.phase === 'cine') this.cineOverlay(c);
      else if (this.phase === 'reveal') this.revealOverlay(c);
      else this.rackOverlay(c);
      if (this.fade > 0) { c.fillStyle = 'rgba(255,255,255,' + this.fade.toFixed(3) + ')'; c.fillRect(0, 0, W, HGT); }
    }

    skipButton(c, label) {
      const ui = this.ui, w = ui.measure(label, 10) + 44, x = W - w - 10, y = 10;
      c.fillStyle = 'rgba(4,6,26,0.6)'; c.fillRect(x, y, w, 20);
      c.strokeStyle = 'rgba(150,170,255,0.7)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 19);
      const kw = ui.keycap(x + 6, y + 4, 'Esc');
      ui.text(label, x + 12 + kw, y + 5, { size: 10, col: C.cream });
      ui.hit(x, y, w, 20, () => this.skip());
    }

    cineOverlay(c) {
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Пропустить');
      this.ui.hints([['Enter', 'Пропустить ролик']], 12, HGT - 20, { col: 'rgba(200,210,240,0.8)' });
    }

    plate(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui, ch = r.kind === 'char', d = ch ? H.CHARS[r.id] : H.CONES[r.id], name = ch ? d.fullName || d.name : r.name, V = H.VELVET;
      const ar = V.arcanaOf(ch ? r.id : d && d.sig, ch ? null : r.id);
      const x0 = Math.round(30 - 50 * (1 - eOut(a))), y = 372;
      c.save(); c.globalAlpha = cl(a);
      const gr = c.createLinearGradient(x0 - 30, 0, x0 + 360, 0);
      gr.addColorStop(0, 'rgba(4,6,26,0.85)'); gr.addColorStop(0.7, 'rgba(4,6,26,0.5)'); gr.addColorStop(1, 'rgba(4,6,26,0)');
      c.fillStyle = gr; c.fillRect(x0 - 30, y - 8, 390, 64);
      c.fillStyle = '#efe2b0'; c.fillRect(x0, y, 24, 36); c.fillStyle = VEL; c.fillRect(x0 + 2, y + 2, 20, 32);
      ui.text(V.ROMAN[ar], x0 + 12, y + 10, { size: 10, bold: true, serif: true, align: 'center', col: '#f2e4b0', shadow: false });
      const size = ui.measure(name, 20, true, true) > 260 ? 15 : 20;
      ui.text(name, x0 + 34, y - 2, { size, bold: true, serif: true, col: '#ffffff' });
      const subLine = '★'.repeat(r.rar) + ' · ' + V.ARCANA[ar] + (ch ? ' · ' + H.PATHS[d.path].name : ' · Световой конус');
      ui.text(subLine, x0 + 34, y + 24, { size: 11, col: RCOL[r.rar] });
      if (ch) G.pathIcon(c, d.path, Math.round(x0 + 38 + ui.measure(subLine, 11)), y + 23, 14, RCOL[r.rar]);
      if (ch && r.res === 'new') { const nx = Math.round(x0 + 40 + ui.measure(name, size, true, true)); c.fillStyle = '#e8c860'; c.fillRect(nx, y + 2, 38, 12); ui.text('НОВЫЙ', nx + 19, y + 3, { size: 8, bold: true, align: 'center', col: '#1a1406', shadow: false }); }
      c.restore();
    }

    quote(c, q, a) {
      if (!q || a <= 0) return;
      const ui = this.ui, s = '«' + q + '»', lw = Math.min(600, ui.measure(s, 12) + 34);
      c.save(); c.globalAlpha = cl(a);
      c.fillStyle = 'rgba(4,6,26,0.82)'; c.fillRect(Math.round(W / 2 - lw / 2), HGT - 50, Math.round(lw), 22);
      ui.text(s, W / 2, HGT - 46, { size: 12, align: 'center', col: C.cream });
      c.restore();
    }

    resultTag(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui;
      c.save(); c.globalAlpha = cl(a);
      ui.resultTag(W - 196, 50, r, [['Новый персонаж!', C.ok], ['присоединился к экипажу', C.cream]]);
      c.restore();
    }

    revealOverlay(c) {
      const ui = this.ui, r = this.item(), t = this.rt - this.hop, L = this.length(r);
      if (t >= 0) {
        const own = this.own(r);
        if (own) {
          const at = CARD + total(own) - own[own.length - 1][1] + 0.3;
          this.plate(c, r, seg(t, at, at + 0.4));
          this.quote(c, QUOTES[r.id], seg(t, at + 0.2, at + 0.5));
        } else if (r.kind === 'char') {
          const b = t - CARD - CRUSH;
          this.plate(c, r, seg(b, 0.3, 0.7));
          this.quote(c, H.WarpIntro ? H.WarpIntro.line(r.id, this.game) : '', seg(b, 0.5, 0.8));
        } else this.plate(c, r, seg(t, 0.6, 0.9));
        this.resultTag(c, r, seg(t, L - 0.4, L - 0.1));
      }
      if (this.res.length > 1) ui.plate(12, 10, (this.cur + 1) + ' / ' + this.res.length);
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Закрыть');
      ui.hints([['Enter', this.rt < this.intro() ? 'Показать' : this.queue.length || this.res.length > 1 ? 'Далее' : 'Готово']], 12, HGT - 20);
    }

    rackOverlay(c) {
      const ui = this.ui, t = this.rt, n = this.res.length, cw = 92, ch = 150, gap = 10, per = Math.min(5, n), rows = Math.ceil(n / per);
      ui.text('РАСКЛАД', W / 2, 18, { size: 26, bold: true, serif: true, align: 'center', col: '#f2e4b0' });
      ui.text('«Добро пожаловать в Бархатную комнату.»', W / 2, 52, { size: 11, align: 'center', col: '#b4c0ec' });
      const y0 = rows > 1 ? 74 : 150;
      this.res.forEach((r, i) => {
        const k = eOut(seg(t, i * 0.06, i * 0.06 + 0.35));
        if (k <= 0) return;
        const row = Math.floor(i / per), inRow = Math.min(per, n - row * per), col = i - row * per;
        const x = Math.round(W / 2 - (inRow * cw + (inRow - 1) * gap) / 2 + col * (cw + gap)), y = Math.round(y0 + row * (ch + 12) + (1 - k) * 30);
        const cv = this.cardCanvas(r);
        c.save(); c.globalAlpha = k; c.imageSmoothingEnabled = false; c.drawImage(cv, x, y, cw, ch); c.restore();
        if (r.kind === 'char' && r.res === 'new') { c.fillStyle = '#e8c860'; c.fillRect(x + 8, y + ch - 18, cw - 16, 12); ui.text('НОВЫЙ', x + cw / 2, y + ch - 17, { size: 8, bold: true, align: 'center', col: '#1a1406', shadow: false }); }
      });
      const five = this.res.filter(r => r.rar === 5).length, four = this.res.filter(r => r.rar === 4).length;
      ui.text('5★: ' + five + ' · 4★: ' + four, W / 2, HGT - 50, { align: 'center', size: 11, col: C.sub });
      ui.hints([['Enter', 'Готово']], W / 2, HGT - 26, { align: 'center' });
    }

    cardCanvas(r) {
      this.cards = this.cards || new Map();
      let cv = this.cards.get(r);
      if (!cv) { cv = G.mkCanvas(92, 150); this.tarotFront(cv.getContext('2d'), r, 0, 0, 92, 150); this.cards.set(r, cv); }
      return cv;
    }
  }

  H.MidnightShow = MidnightShow;
  Object.assign(H, { MIDNIGHT_SHOTS: SHOTS, MIDNIGHT_CINE: CINE, MIDNIGHT_CUTS: CUTS, MidnightKit: { RCOL, CARD, CRUSH, QUOTES, cutLen: id => total(CUTS[id]) } });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
