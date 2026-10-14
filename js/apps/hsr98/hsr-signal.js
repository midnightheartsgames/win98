(function (H) {
  'use strict';
  const G = H.Gfx, R3 = H.R3, M = R3.M;
  const { W, HGT, C } = H.UI_CONST;
  const LW = 320, LH = 240;
  const RANK = { 5: 'S', 4: 'A', 3: 'B' };
  const RCOL = { 5: '#ffb030', 4: '#c060ff', 3: '#40a8ff' };
  const RDARK = { 5: '#5a3408', 4: '#3a1660', 3: '#0c2a5a' };
  const BEAT = 60 / 144;
  const SHOTS = [['power', 0.035 + 5 * BEAT], ['dial', 6 * BEAT], ['glitch', 2 * BEAT], ['pyramid', 8 * BEAT]];
  const CINE = SHOTS.reduce((s, x) => s + x[1], 0);
  const GOLD = 6 * BEAT;
  const TURNS = [[0.02, 0.52], [0.85, 1.35], [1.69, 2.19]];
  const HOP = 0.5;
  const MALE = new Set(['welt', 'gepard', 'yanqing', 'danheng', 'arlan', 'sampo', 'scar', 'kazuma']);
  const QUOTES = { miyabi: 'Приветствую. Я Хосими Мияби, командир Секции 6.', yanagi: 'Здравствуйте. Цукисиро Янаги, заместитель командира Секции 6.', kazuma: 'Сато Казума, авантюрист. Меня засосало в телевизор?' };
  const hx = G.hash;
  const cl = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = t => t * t * (3 - 2 * t);
  const eOut = t => 1 - (1 - t) * (1 - t) * (1 - t);
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const shotStart = name => { let s = 0; for (const [n, d] of SHOTS) { if (n === name) return s; s += d; } return s; };
  const shotLen = name => SHOTS.find(x => x[0] === name)[1];

  const UNITS = [
    ['tv', -2.55, 0, 1.1, 0.92], ['spk', -1.55, 0, 0.82, 1.02], ['tv', -0.45, 0, 1.25, 1.05], ['spk', 0.68, 0, 0.8, 0.9], ['tv', 1.66, 0, 1.12, 0.96], ['spk', 2.66, 0, 0.78, 1.12],
    ['tv', -2.05, 1.02, 1.0, 0.84], ['tv', -0.98, 1.06, 1.06, 0.9], ['spk', 0.06, 0.92, 0.8, 0.84], ['tv', 1.08, 0.98, 1.12, 0.9], ['tv', 2.14, 1.14, 0.9, 0.8],
    ['tv', -1.42, 1.92, 1.0, 0.84], ['spk', -0.46, 1.98, 0.74, 0.8], ['tv', 0.52, 1.9, 1.06, 0.86], ['tv', 1.52, 1.98, 0.9, 0.8],
    ['tv', -0.82, 2.78, 0.96, 0.8], ['tv', 0.24, 2.8, 0.96, 0.82], ['spk', 1.16, 2.8, 0.7, 0.76],
    ['tv', -0.26, 3.6, 0.9, 0.76]
  ].map(([k, x, y, w, h], i) => ({ k, x, y: y + h / 2, w, h, d: k === 'tv' ? 0.8 : 0.6, z: (hx(i, 3, 91) - 0.5) * 0.24, ry: (hx(i, 4, 91) - 0.5) * 0.3, wood: k === 'tv' && hx(i, 5, 91) > 0.6, i }));
  const TVS = UNITS.filter(u => u.k === 'tv');
  const ORDER = [1, 4, 0, 6, 3, 2, 7, 8, 9, 5, 10, 11, 12];
  const HERO = TVS[1];
  const CLOSE_TV = { k: 'tv', i: 99, x: 1.05, y: 1.25, w: 1.5, h: 1.2, d: 0.8, z: -0.6, ry: -0.25, wood: true };

  function rankTex(rar, lit) {
    return R3.paint('sig|L|' + rar + '|' + (lit ? 1 : 0), 64, 48, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, lit ? G.light(RCOL[rar], 0.35) : RDARK[rar]); gr.addColorStop(1, lit ? RCOL[rar] : '#08080c');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.font = 'bold 40px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = lit ? G.dark(RCOL[rar], 0.55) : '#000000'; g.fillText(RANK[rar], w / 2 + 3, h / 2 + 4);
      g.fillStyle = lit ? '#ffffff' : G.light(RDARK[rar], 0.2); g.fillText(RANK[rar], w / 2, h / 2 + 1);
      g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < h; y += 2) g.fillRect(0, y, w, 1);
    });
  }

  const staticTex = n => R3.paint('sig|static|' + n, 64, 48, (g, w, h) => {
    g.fillStyle = '#101014'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x += 2) { const v = Math.floor(40 + 200 * hx(x + n * 97, y, 13)); g.fillStyle = 'rgb(' + v + ',' + v + ',' + Math.min(255, v + 20) + ')'; g.fillRect(x, y, 2, 1); }
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, Math.floor(hx(n, 2, 5) * h), w, 2);
  });

  const darkTex = () => R3.paint('sig|dark', 64, 48, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.6);
    gr.addColorStop(0, '#2a3038'); gr.addColorStop(1, '#0a0c10');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(6, 4, 18, 3);
  });

  const logoTex = () => R3.paint('sig|logo', 64, 48, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#d8f0ff'); gr.addColorStop(1, '#8ab8e8');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8e040'; g.fillRect(4, h / 2 - 9, w - 8, 18);
    g.fillStyle = '#14140a'; g.font = 'bold 11px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('СИГНАЛ', w / 2, h / 2 + 1);
    g.fillStyle = '#2a5a9a'; for (let i = 0; i < 5; i++) g.fillRect(8 + i * 11, h - 8, 7, 3);
  });

  const dialBgTex = () => R3.paint('sig|dialbg', 64, 48, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e8f4ff'); gr.addColorStop(0.5, '#9ac8f0'); gr.addColorStop(1, '#3a6aa8');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(w / 2, h / 2, 10 + i * 9, 0, Math.PI * 2); g.stroke(); }
  });

  const spkTex = () => R3.paint('sig|spk', 32, 32, (g, w, h) => {
    g.fillStyle = '#121216'; g.fillRect(0, 0, w, h);
    const ring = (r, col) => { g.fillStyle = col; g.beginPath(); g.arc(w / 2, h / 2, r, 0, Math.PI * 2); g.fill(); };
    ring(14, '#3a3a44'); ring(12, '#1a1a20'); ring(9, '#26262e'); ring(5, '#40404a'); ring(3, '#5a5a66');
    g.fillStyle = '#5a5a66'; g.fillRect(2, 2, 2, 2); g.fillRect(w - 4, 2, 2, 2); g.fillRect(2, h - 4, 2, 2); g.fillRect(w - 4, h - 4, 2, 2);
  });

  const wallTex = () => R3.paint('sig|wall', 64, 64, (g, w, h) => {
    g.fillStyle = '#1c1e26'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#24262f'; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 7);
    g.fillStyle = '#121318'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 1, h);
  });

  const floorTex = () => R3.paint('sig|floor', 64, 64, (g, w, h) => {
    g.fillStyle = '#16171c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#20222a'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect((hx(i, 1, 8) * w) | 0, (hx(i, 2, 8) * h) | 0, 2, 1); }
  });

  function wordTex(key, lines, col) {
    return R3.paint('sig|word|' + key, 256, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const fs = lines.length > 1 ? 26 : 44;
      g.font = 'bold ' + fs + 'px Georgia, serif';
      lines.forEach((s, i) => {
        const y = lines.length > 1 ? 18 + i * 30 : h / 2;
        for (let k = 6; k > 0; k--) { g.fillStyle = k > 1 ? '#202028' : '#5a5a68'; g.fillText(s, w / 2 + k, y + k); }
        g.fillStyle = col; g.fillText(s, w / 2, y);
      });
    });
  }

  const meshCache = new Map();
  function cached(key, fn) { let m = meshCache.get(key); if (!m) { m = fn(); meshCache.set(key, m); } return m; }
  const texId = new WeakMap();
  let texN = 0;
  const tid = t => { if (!t) return 'none'; let k = texId.get(t); if (!k) { k = ++texN; texId.set(t, k); } return k; };

  function unitMesh(u, screen) { return cached('u|' + u.i + '|' + u.x + '|' + tid(screen), () => buildUnit(u, screen)); }

  function buildUnit(u, screen) {
    const m = R3.mesh(), w = u.w, h = u.h, d = u.d;
    if (u.k === 'spk') {
      R3.box(m, 0, 0, 0, w, h, d, '#18181e');
      R3.quad(m, [-w * 0.42, -h * 0.44, d / 2 + 0.02, w * 0.42, -h * 0.44, d / 2 + 0.02, w * 0.42, h * 0.44, d / 2 + 0.02, -w * 0.42, h * 0.44, d / 2 + 0.02], '#ffffff', { tex: spkTex() });
      return m;
    }
    const body = u.wood ? '#6a4c30' : '#3a3c46';
    R3.box(m, 0, 0, 0, w, h, d, body, { cols: [G.light(body, 0.1), body, G.dark(body, 0.2), G.dark(body, 0.2), G.light(body, 0.2), G.dark(body, 0.4)] });
    R3.box(m, 0, 0, -d * 0.55, w * 0.7, h * 0.7, d * 0.5, G.dark(body, 0.25));
    const sx = w * 0.36, sy = h * 0.36, cx = -w * 0.08, z = d / 2 + 0.02;
    R3.quad(m, [cx - sx - 0.04, -sy - 0.04, z - 0.005, cx + sx + 0.04, -sy - 0.04, z - 0.005, cx + sx + 0.04, sy + 0.04, z - 0.005, cx - sx - 0.04, sy + 0.04, z - 0.005], '#08080a');
    if (screen) R3.quad(m, [cx - sx, -sy, z + 0.015, cx + sx, -sy, z + 0.015, cx + sx, sy, z + 0.015, cx - sx, sy, z + 0.015], '#ffffff', { tex: screen, emit: 1 });
    for (let i = 0; i < 2; i++) R3.box(m, w * 0.38, sy * 0.6 - i * h * 0.24, z + 0.02, 0.07, 0.07, 0.05, '#1a1a1e');
    R3.box(m, w * 0.38, -sy * 0.7, z + 0.01, 0.12, 0.02, 0.02, '#18181c');
    return m;
  }

  function unitMat(u) { return M.of(M.t(u.x, u.y, u.z), M.ry(u.ry)); }

  function screenCenter(u) { return M.pt(unitMat(u), -u.w * 0.08, 0, u.d / 2 + 0.05); }

  let roomMesh = null;
  function room() {
    if (roomMesh) return roomMesh;
    const m = R3.mesh();
    R3.grid(m, -9, -6, 9, 6, 0, 6, 4, '#ffffff', { tex: floorTex(), rep: 3 });
    const wt = wallTex();
    for (let i = 0; i < 9; i++) {
      const a0 = -1.2 + i * 0.3, a1 = a0 + 0.3, r = 6.5, x0 = Math.sin(a0) * r, z0 = -Math.cos(a0) * r, x1 = Math.sin(a1) * r, z1 = -Math.cos(a1) * r;
      R3.quad(m, [x0, 0, z0, x1, 0, z1, x1, 7, z1, x0, 7, z0], '#ffffff', { tex: wt, uv: [0, wt.h * 2, wt.w, wt.h * 2, wt.w, 0, 0, 0] });
    }
    roomMesh = m;
    return m;
  }

  function dialMesh() { return cached('dial', buildDial); }

  function buildDial() {
    const m = R3.mesh();
    R3.disc(m, 0, 0, 0, 0.34, 0.04, 20, '#e8f0f8');
    for (let i = 0; i < 10; i++) {
      const a = -0.4 - i * 0.48;
      R3.disc(m, Math.cos(a) * 0.235, Math.sin(a) * 0.235, 0.06, 0.055, 0.01, 8, '#3a4a6a');
    }
    R3.disc(m, 0, 0, 0.06, 0.11, 0.01, 12, '#5aa8e8');
    R3.disc(m, 0, 0, 0.085, 0.05, 0.01, 10, '#ffffff');
    return m;
  }

  function lightRig(R, y, col, a) {
    const m = cached('rig|' + y, () => { const r = R3.mesh(); R3.cyl(r, 0, y, 0, 0.9, 0.9, 0.12, 16, '#2a2a32', { cap: false }); return r; });
    const d = cached('rigd|' + y + '|' + col, () => { const r = R3.mesh(); R3.disc(r, 0, y - 0.02, 0, 0.55, 0.02, 16, col, { emit: 1 }); return r; });
    R.draw(m, M.id());
    R.draw(d, M.id(), { tint: a < 1 ? '#' + Math.round(40 + 215 * a).toString(16).padStart(2, '0').repeat(3) : null });
    R.glow([0, y - 0.1, 0], 0.9, col, { a: a * 0.8, depth: false });
  }

  function figureQuad(look, h) {
    const cv = G.figureCanvas(look, 2), t = R3.tex(cv);
    return cached('fig|' + tid(t) + '|' + h, () => buildFig(cv, t, h));
  }

  function buildFig(cv, t, h) {
    const w = h * cv.width / cv.height, m = R3.mesh();
    R3.quad(m, [-w / 2, 0, 0, w / 2, 0, 0, w / 2, h, 0, -w / 2, h, 0], '#ffffff', { tex: t, two: true });
    return m;
  }

  class SignalShow {
    constructor(ui, res, opts = {}) {
      this.ui = ui; this.res = res; this.game = ui.game; this.ban = opts.ban || 'sig';
      this.best = Math.max(...res.map(r => r.rar));
      this.R = new R3.Raster(LW, LH);
      this.phase = 'cine'; this.t = 0; this.cue = 0; this.rt = 0;
      this.queue = []; this.cur = -1; this.seen = new Set(); this.fade = 0; this.done = false; this.hop = 0;
      this.slots = res.map((r, i) => TVS[ORDER[i % ORDER.length]]);
      this.cues = this.cueList();
      this.singer = res.find(r => r.kind === 'char' && r.rar === 5) || null;
    }

    cueList() {
      const g = shotStart('glitch'), p = shotStart('pyramid'), d = shotStart('dial'), list = [[0.37, 'shutter'], [0.82, 'glint'], [g + 0.02, 'break'], [p + 0.1, 'rumble']];
      TURNS.forEach(([a]) => list.push([d + a, 'lever']));
      this.res.forEach((r, i) => list.push([p + this.lightAt(i), r.rar >= 4 ? 'star4' : 'select']));
      list.push([p + GOLD, this.best === 5 ? 'star5' : this.best === 4 ? 'star4' : 'chest']);
      return list.sort((a, b) => a[0] - b[0]);
    }

    item() { return this.res[this.cur]; }

    lightAt(i) { return GOLD - BEAT - (this.res.length - 1 - i) * BEAT / 2; }

    sing() {
      const r = this.phase === 'reveal' ? this.item() : null;
      if (r && r.kind === 'char' && r.rar === 5 && this.rt >= this.hop) this.singer = r;
      if (this.singer && (this.phase !== 'cine' || this.t >= shotStart('glitch'))) this.ui.audio.songVoice(this.voiceOf(this.singer));
    }

    voiceOf(r) { return r.id === 'trail' ? (r.gender || this.game.state.gender) : MALE.has(r.id) ? 'm' : 'f'; }

    closeAt(r) { return r.kind !== 'char' ? null : r.rar === 5 ? 2.4 : H.SignalTV && H.SignalTV.has(r.id) ? 1.6 : null; }

    length(r) { const c = this.closeAt(r); return r.kind === 'char' ? (c != null ? c + 2.0 : 2.2) : r.rar === 5 ? 2.0 : r.rar === 4 ? 1.4 : 1.0; }

    intro() { const r = this.item(); return this.hop + this.length(r); }

    tick(dt) {
      this.step(dt);
      this.sing();
    }

    step(dt) {
      this.fade = Math.max(0, this.fade - dt * 2.2);
      if (this.phase === 'cine') {
        this.t += dt;
        while (this.cue < this.cues.length && this.cues[this.cue][0] <= this.t) this.ui.sfx(this.cues[this.cue++][1]);
        if (this.t >= CINE) this.begin(this.res.map((r, i) => i));
        return;
      }
      const before = this.rt;
      this.rt += dt;
      if (this.phase !== 'reveal') return;
      const r = this.item(), t0 = this.hop, cross = x => before < t0 + x && this.rt >= t0 + x;
      if (this.hop && before < 0.05 && this.rt >= 0.05) this.ui.sfx('whoosh');
      if (r.kind === 'char') { const c = this.closeAt(r); if (cross(r.rar === 5 ? 0.55 : 0.35)) this.ui.sfx(r.rar === 5 ? 'star5' : 'star4'); if (c != null && cross(c)) this.ui.sfx('glint'); }
      else if (cross(0.3)) this.ui.sfx(r.rar === 5 ? 'star5' : r.rar === 4 ? 'star4' : 'glint');
    }

    begin(queue) {
      const first = this.phase === 'cine';
      this.phase = 'reveal';
      this.queue = queue.filter(i => !this.seen.has(i));
      this.next(first);
      if (first) this.fade = 0.8;
    }

    next(first) {
      if (!this.queue.length) { if (this.res.length > 1) this.toRack(); else this.done = true; return; }
      this.cur = this.queue.shift();
      this.seen.add(this.cur);
      this.hop = first ? 0 : HOP;
      this.rt = 0;
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

    pyramid(R, t, o = {}) {
      R.light({ amb: [0.22, 0.22, 0.28], dir: [0.3, 0.9, 0.6], sun: [0.45, 0.45, 0.52], fog: { near: 6, far: 16, col: [10, 10, 14], max: 0.7 } });
      R.clear('#0c0d12', '#1a1c24');
      R.draw(room(), M.id());
      const st = staticTex(Math.floor(t * 14) % 4);
      UNITS.forEach(u => {
        let scr = null;
        if (u.k === 'tv') {
          const i = this.slots.indexOf(u), on = o.lit ? o.lit(i, u) : 0;
          if (o.screen) scr = o.screen(i, u);
          else if (i >= 0 && on > 0) scr = rankTex(this.res[i].rar, on >= 1);
          else scr = o.static ? st : darkTex();
          R.draw(unitMesh(u, scr), unitMat(u));
          if (i >= 0 && on > 0) R.glow(screenCenter(u), 0.55 * u.w, RCOL[this.res[i].rar], { a: 0.35 * on, depth: false });
        } else R.draw(unitMesh(u, null), unitMat(u));
      });
      R.glow([0, 6, -2], 4, '#8090c0', { a: 0.12, depth: false });
    }

    cine(R) {
      const [n, t] = this.shot();
      if (n === 'power') {
        const k = sm(seg(t, 0, shotLen('power'))), c = screenCenter(HERO);
        R.look([c[0] + lerp(0.7, 0.35, k), c[1] + 0.15, c[2] + lerp(2.4, 1.7, k)], [c[0], c[1], c[2]], 46);
        const on = seg(t, 0.42, 0.72);
        this.pyramid(R, t, { screen: (i, u) => (u === HERO ? (on > 0 ? logoTex() : darkTex()) : darkTex()) });
        if (t > 0.37 && t < 0.77) { const p = R.project(c); if (p) for (let x = -40; x <= 40; x++) R.flat(p[0] + x, p[1], 1.2 * (1 - Math.abs(x) / 40) * (1 - seg(t, 0.57, 0.77)) * 3, '#e8f4ff', { a: 0.6 }); }
        return;
      }
      if (n === 'dial') {
        const k = sm(seg(t, 0, shotLen('dial'))), c = screenCenter(HERO);
        R.look([c[0] + lerp(0.25, 0.05, k), c[1] + lerp(0.12, 0.02, k), c[2] + lerp(1.4, 0.75, k)], [c[0], c[1], c[2] - 0.1], 44);
        this.pyramid(R, t, { screen: (i, u) => (u === HERO ? dialBgTex() : darkTex()) });
        let a = 0;
        for (const [a0, a1] of TURNS) a += (t < a1 ? Math.sin(Math.PI * seg(t, a0, a1)) : 0) * 1.6;
        R.light({ amb: [0.75, 0.78, 0.85], dir: [0.2, 0.6, 1], sun: [0.4, 0.4, 0.4] });
        R.draw(dialMesh(), M.of(M.t(c[0], c[1], c[2] + 0.02), M.ry(HERO.ry), M.s(0.62), M.rz(-a)));
        return;
      }
      if (n === 'glitch') {
        R.look([0.4, 1.0, 7.6], [0, 1.7, 0], 52);
        this.pyramid(R, t, { static: true });
        return;
      }
      const k = sm(seg(t, 0, shotLen('pyramid'))), ang = lerp(-0.45, 0.25, k), r = lerp(7.2, 6.4, k);
      R.look([Math.sin(ang) * r, lerp(0.35, 0.7, k), Math.cos(ang) * r], [0, lerp(1.9, 1.6, k), 0], 54);
      this.pyramid(R, t, { lit: i => (i < 0 ? 0 : seg(t, this.lightAt(i), this.lightAt(i) + 0.1) * (t > GOLD || this.res[i].rar < 5 ? 1 : 0.6)) });
      if (t > GOLD) {
        const b = this.res.findIndex(x => x.rar === this.best), u = this.slots[b], f = 1 - seg(t, GOLD, shotLen('pyramid'));
        R.glow(screenCenter(u), 1.3, RCOL[this.best], { a: 0.6 * f, depth: false });
      }
    }

    hopShot(R, i, t) {
      const u = this.slots[i], c = screenCenter(u), k = sm(seg(t, 0, HOP));
      R.look([lerp(0.5, c[0], k * 0.8), lerp(1.2, c[1], k * 0.8), lerp(7, c[2] + 1.2, k)], c, 52);
      this.pyramid(R, t, { lit: j => (j < 0 ? 0 : 1) });
      R.glow(c, 0.8, RCOL[this.res[i].rar], { a: 0.4 + 0.6 * k, depth: false });
    }

    stageSet(R, t, col, dim) {
      R.light({ amb: [0.18, 0.18, 0.24], dir: [0, 1, 0.5], sun: [0.5 * (1 - dim), 0.5 * (1 - dim), 0.55 * (1 - dim)], pts: [{ p: [0, 3, 1.5], r: 6, c: R3.rgb(col).map(v => v / 255 * (1 - dim)) }] });
      R.clear('#08090c', '#16171e');
      R.draw(room(), M.id());
      const st = staticTex(Math.floor(t * 12) % 4);
      UNITS.forEach((u, i) => {
        const mat = M.of(M.t(0, -0.3, -5.2), M.s(1.35), unitMat(u));
        R.draw(unitMesh(u, u.k === 'tv' ? (hx(i, 9, 3) > 0.7 ? st : hx(i, 8, 3) > 0.6 ? rankTex([3, 4, 3, 5][i % 4], false) : darkTex()) : null), mat);
      });
      R.draw(cached('stage', () => { const p = R3.mesh(); R3.cyl(p, 0, 0, 0, 1.4, 1.4, 0.18, 20, '#2a2a30', { capCol: '#30303a' }); R3.cyl(p, 0, 0.18, 0, 0.75, 0.75, 0.06, 20, '#e8902a', { capCol: '#1e1e24' }); return p; }), M.id());
      lightRig(R, 3.4, '#ffffff', 1 - dim);
    }

    coneScene(R, r, t) {
      const rar = r.rar, k = sm(seg(t, 0, this.length(r)));
      R.look([lerp(0.6, 0, k), 1.2, lerp(3.8, 3.2, k)], [0, 1.0, 0], 50);
      this.stageSet(R, t, RCOL[rar], 0);
      const tx = R3.tex(G.coneArt(r.id, 72, 100)), m = cached('cone|' + tid(tx), () => { const q = R3.mesh(); R3.quad(q, [-0.5, 0, 0, 0.5, 0, 0, 0.5, 1.39, 0, -0.5, 1.39, 0], '#ffffff', { tex: tx, two: true, emit: 0.5 }); return q; });
      R.draw(m, M.of(M.t(0, 0.62 + Math.sin(t * 2) * 0.03, 0), M.ry(t * 1.4 - 0.6)));
      R.glow([0, 1.0, 0], 1.2, RCOL[rar], { a: 0.35 * seg(t, 0, 0.3), depth: false });
      if (rar === 5) R.shaft(LW / 2, 26, RCOL[5], 0.25 * seg(t, 0.2, 0.6));
    }

    agentScene(R, r, t) {
      const five = r.rar === 5, on = five ? 0.55 : 0.35, lit = seg(t, on, on + 0.1), look = G.lookOf(r.id, this.game), c = this.closeAt(r);
      if (c != null && t > c) { this.closeScene(R, r, t - c); return; }
      const k = sm(seg(t, 0, c || 2.4));
      R.look([lerp(-0.4, 0.2, k), lerp(1.2, 1.0, k), lerp(4.6, 4.0, k)], [0, 1.15, 0], 50);
      this.stageSet(R, t, RCOL[r.rar], 1 - lit);
      if (lit > 0) {
        const fly = eOut(seg(t, on, on + 0.6)), w1 = wordTex('agent' + r.rar, ['АГЕНТ ' + RANK[r.rar]], '#f4f4f8'), w2 = wordTex('contract', ['КОНТРАКТ', 'ЗАКЛЮЧЁН'], '#f4f4f8');
        const q = (tx, w, h) => cached('word|' + tid(tx), () => { const m = R3.mesh(); R3.quad(m, [-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0], '#ffffff', { tex: tx, two: true, emit: 1 }); return m; });
        R.light({ amb: [1, 1, 1], sun: null });
        R.draw(q(w1, 2.4, 0.6), M.of(M.t(lerp(-4.4, -1.7, fly), 1.85, -0.9), M.ry(0.5)), { mode: 'alpha', alpha: fly, zw: false });
        R.draw(q(w2, 2.4, 0.6), M.of(M.t(lerp(4.4, 1.7, fly), 1.85, -0.9), M.ry(-0.5)), { mode: 'alpha', alpha: fly, zw: false });
      }
      R.light({ amb: [1, 1, 1], sun: null });
      R.draw(figureQuad(look, 2.0), M.t(0, 0.24, 0.1), { lit: false, tint: lit < 1 ? (lit > 0 ? '#ffffff' : '#0c0c12') : null });
      if (t > on && t < on + 0.3) R.shaft(LW / 2, 60, '#ffffff', 0.6 * (1 - seg(t, on, on + 0.3)));
    }

    closeScene(R, r, t) {
      R.light({ amb: [0.3, 0.3, 0.36], dir: [0.4, 0.6, 0.8], sun: [0.5, 0.5, 0.5] });
      R.look([lerp(0.15, 0.05, sm(seg(t, 0, 2))), 1.2, 2.2], [0.4, 1.2, 0], 44);
      R.clear('#14151a', '#20222a');
      R.draw(room(), M.id());
      const tv = H.SignalTV && H.SignalTV.has(r.id) ? H.SignalTV : null;
      const pic = tv ? tv.screen(r.id, t, this.game) : H.Eidolons && H.Eidolons.has(r.id) ? R3.tex(H.Eidolons.pic(r.id).colorD) : logoTex();
      const lit = tv ? tv.light(r.id, t) : { col: '#a0c8ff', a: 0.2 };
      R.draw(unitMesh(CLOSE_TV, pic), unitMat(CLOSE_TV));
      R.glow(screenCenter(CLOSE_TV), 0.9, lit.col, { a: lit.a, depth: false });
    }

    render() { this.scene(); return this.R.bake(); }

    scene() {
      const R = this.R;
      if (this.phase === 'cine') this.cine(R);
      else if (this.phase === 'reveal') {
        const r = this.item();
        if (this.rt < this.hop) this.hopShot(R, this.cur, this.rt);
        else if (r.kind === 'char') this.agentScene(R, r, this.rt - this.hop);
        else this.coneScene(R, r, this.rt - this.hop);
      } else {
        R.look([0.2, 1.2, 7.6], [0, 1.7, 0], 52);
        this.pyramid(R, this.rt, { lit: i => (i < 0 ? 0 : 0.6) });
      }
    }

    draw(c) {
      const R = this.R;
      this.scene();
      R.finish(c, 0, 0, W, HGT);
      if (this.phase === 'cine') this.cineOverlay(c);
      else if (this.phase === 'reveal') this.revealOverlay(c);
      else this.rackOverlay(c);
      if (this.fade > 0) { c.fillStyle = 'rgba(255,255,255,' + this.fade.toFixed(3) + ')'; c.fillRect(0, 0, W, HGT); }
    }

    skipButton(c, label) {
      const ui = this.ui, w = ui.measure(label, 10) + 44, x = W - w - 10, y = 10;
      c.fillStyle = 'rgba(4,6,20,0.6)'; c.fillRect(x, y, w, 20);
      c.strokeStyle = 'rgba(232,224,64,0.7)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 19);
      const kw = ui.keycap(x + 6, y + 4, 'Esc');
      ui.text(label, x + 12 + kw, y + 5, { size: 10, col: C.cream });
      ui.hit(x, y, w, 20, () => this.skip());
    }

    bigLetter(c, rar, x, y, s, a) {
      if (a <= 0) return;
      const ui = this.ui;
      c.save(); c.globalAlpha = a;
      for (let k = 6; k > 0; k--) ui.text(RANK[rar], x + k, y + k, { size: s, bold: true, serif: true, align: 'center', col: k > 1 ? '#1a1004' : RDARK[rar], shadow: false });
      ui.text(RANK[rar], x, y, { size: s, bold: true, serif: true, align: 'center', col: RCOL[rar], shadow: false });
      c.restore();
    }

    cineOverlay(c) {
      const [n, t] = this.shot(), ui = this.ui;
      if (n === 'power' && t < 0.42) { c.fillStyle = '#000'; c.fillRect(0, 0, W, HGT); }
      if (n === 'glitch') {
        for (let i = 0; i < 18; i++) {
          const y = Math.floor(hx(i, Math.floor(t * 30), 7) * HGT), h = 4 + Math.floor(hx(i, 2, Math.floor(t * 30)) * 18), dx = (hx(i, 3, Math.floor(t * 30)) - 0.5) * 80;
          c.drawImage(this.R.cv, 0, Math.floor(y / 2), LW, Math.max(1, Math.floor(h / 2)), dx, y, W, h);
        }
        c.fillStyle = 'rgba(' + R3.rgb(RCOL[this.best]).join(',') + ',0.35)'; c.fillRect(0, 0, W, HGT);
        this.bigLetter(c, this.best, W / 2 + (hx(1, Math.floor(t * 24), 4) - 0.5) * 24, 150, 160, 1);
      }
      const flash = shotLen('dial') - 0.15;
      if (n === 'dial' && t > flash) { c.fillStyle = 'rgba(255,255,255,' + seg(t, flash, flash + 0.15).toFixed(3) + ')'; c.fillRect(0, 0, W, HGT); }
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Пропустить');
      ui.hints([['Enter', 'Пропустить ролик']], 12, HGT - 20, { col: 'rgba(200,210,240,0.8)' });
    }

    plate(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui, name = r.kind === 'char' ? H.CHARS[r.id].fullName || H.CHARS[r.id].name : r.name, w = Math.max(160, ui.measure(name, 12, true) + 40), x = W / 2 - w / 2, y = r.kind === 'char' ? HGT - 84 : HGT - 64;
      c.save(); c.globalAlpha = a;
      c.fillStyle = 'rgba(10,10,14,0.88)'; c.fillRect(x, y, w, 22);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 21);
      ui.text(name, W / 2, y + 4, { size: 12, bold: true, align: 'center', col: '#ffffff' });
      c.restore();
    }

    headline(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui, word = r.kind === 'char' ? 'АГЕНТ' : 'КОНУС', x = W / 2 - 50, y = HGT - 116;
      c.save(); c.globalAlpha = a;
      for (let k = 6; k > 0; k--) ui.text(word, x + k, y + k, { size: 40, bold: true, serif: true, align: 'center', col: k > 1 ? '#18181e' : '#4a4a58', shadow: false });
      ui.text(word, x, y, { size: 40, bold: true, serif: true, align: 'center', col: '#e8e8f0', shadow: false });
      this.bigLetter(c, r.rar, x + 118, y - 8, 56, 1);
      c.restore();
    }

    resultTag(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui;
      const lines = r.kind === 'char'
        ? (r.res === 'new' ? [['Контракт заключён!', C.ok], ['новый агент в экипаже', C.cream]] : r.res === 'eid' ? [['Дубликат', C.sub], ['Эйдолон +1', C.gold]] : [['Дубликат', C.sub], ['+3 000 кредитов', C.gold]])
        : r.sup > 1 ? [['Дубликат', C.sub], ['Наложение S' + r.sup, C.gold]] : [['Световой конус', C.sub], ['добавлен в инвентарь', C.cream]];
      const x = W - 196, y = HGT - 104;
      c.save(); c.globalAlpha = a;
      ui.win(x, y, 182, 50, { alpha: 0.9 });
      lines.forEach(([s, col], i) => ui.text(s, x + 14, y + 10 + i * 16, { size: i ? 11 : 12, bold: !i, col }));
      c.restore();
    }

    revealOverlay(c) {
      const ui = this.ui, r = this.item(), t = this.rt - this.hop, L = this.length(r);
      if (t >= 0) {
        if (r.kind === 'char') {
          const on = r.rar === 5 ? 0.55 : 0.35;
          if (t > on && t < on + 0.25) { c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - seg(t, on, on + 0.25))).toFixed(3) + ')'; c.fillRect(0, 0, W, HGT); }
          const ca = this.closeAt(r);
          if (ca != null && t > ca) {
            const k = eOut(seg(t, ca, ca + 0.5));
            G.drawBust(c, G.lookOf(r.id, this.game), Math.round(lerp(-120, 30, k)), 120, 4);
            const q = QUOTES[r.id] || (H.WarpIntro && H.WarpIntro.line ? H.WarpIntro.line(r.id, this.game) : '');
            if (q) {
              const lw = Math.min(560, ui.measure('«' + q + '»', 12) + 30);
              c.globalAlpha = seg(t, ca + 0.5, ca + 0.8); c.fillStyle = 'rgba(8,8,12,0.8)'; c.fillRect(W / 2 - lw / 2, HGT - 56, lw, 22);
              ui.text('«' + q + '»', W / 2, HGT - 52, { size: 12, align: 'center', col: C.cream }); c.globalAlpha = 1;
            }
          }
          this.plate(c, r, seg(t, on + 0.2, on + 0.5));
          this.resultTag(c, r, seg(t, L - 0.6, L - 0.3));
        } else {
          this.headline(c, r, seg(t, 0.15, 0.4));
          this.plate(c, r, seg(t, 0.3, 0.55));
          this.resultTag(c, r, seg(t, L - 0.4, L - 0.1));
        }
      }
      if (this.res.length > 1) ui.plate(12, 10, (this.cur + 1) + ' / ' + this.res.length);
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Закрыть');
      ui.hints([['Enter', this.rt < this.intro() ? 'Показать' : this.queue.length || this.res.length > 1 ? 'Далее' : 'Готово']], 12, HGT - 20);
    }

    rackOverlay(c) {
      const ui = this.ui, t = this.rt, g = this.game;
      c.fillStyle = 'rgba(6,6,10,0.62)'; c.fillRect(0, 0, W, HGT);
      for (let k = 5; k > 0; k--) ui.text('ИТОГИ ПОИСКА', W / 2 + k, 56 + k, { size: 30, bold: true, serif: true, align: 'center', col: k > 1 ? '#121216' : '#3a3a44', shadow: false });
      ui.text('ИТОГИ ПОИСКА', W / 2, 56, { size: 30, bold: true, serif: true, align: 'center', col: '#e8e8f0', shadow: false });
      const n = this.res.length, cols = Math.min(5, n), rows = Math.ceil(n / 5), cw = 92, ch = 104, x0 = W / 2 - cols * cw / 2, y0 = 116 + (rows === 1 ? 52 : 0);
      this.res.forEach((r, i) => {
        const k = seg(t, i * 0.06, i * 0.06 + 0.25);
        if (k <= 0) return;
        const x = x0 + (i % 5) * cw + 4, y = y0 + Math.floor(i / 5) * ch;
        c.save(); c.globalAlpha = k;
        c.fillStyle = '#060608'; c.fillRect(x - 1, y - 1, cw - 6, 82);
        const gr = c.createLinearGradient(0, y, 0, y + 80); gr.addColorStop(0, G.light(RCOL[r.rar], 0.15)); gr.addColorStop(1, RDARK[r.rar]);
        c.fillStyle = gr; c.fillRect(x, y, cw - 8, 80);
        if (r.kind === 'char') G.drawPortrait(c, G.lookOf(r.id, g), x + (cw - 8) / 2 - 36, y + 4, 72);
        else G.drawConeCard(c, r.id, x + (cw - 8) / 2 - 24, y + 6, 48, 68, { info: false });
        ui.rankBadge(x + 2, y + 62, r.rar, 16);
        if (r.kind === 'char' && r.res === 'new') { c.fillStyle = '#e8e040'; c.fillRect(x + cw - 44, y + 2, 34, 12); ui.text('НОВЫЙ', x + cw - 27, y + 3, { size: 8, bold: true, align: 'center', col: '#14140a', shadow: false }); }
        let name = r.kind === 'char' ? H.CHARS[r.id].name : r.name;
        while (name.length > 2 && ui.measure(name, 10, r.rar >= 4) > cw - 8) name = name.slice(0, -2) + '…';
        ui.text(name, x + (cw - 8) / 2, y + 84, { size: 10, bold: r.rar >= 4, align: 'center', col: r.rar >= 4 ? RCOL[r.rar] : C.cream });
        c.restore();
      });
      const s = this.res.filter(r => r.rar === 5).length, a = this.res.filter(r => r.rar === 4).length;
      ui.text('Сигналов S: ' + s + ' · A: ' + a, W / 2, HGT - 46, { align: 'center', size: 11, col: C.sub });
      ui.hints([['Enter', 'Готово']], W / 2, HGT - 24, { align: 'center' });
    }
  }

  H.SignalShow = SignalShow;
  Object.assign(H, { SIGNAL_SHOTS: SHOTS, SIGNAL_CINE: CINE, SignalKit: { RANK, RCOL, UNITS, TVS, QUOTES } });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
