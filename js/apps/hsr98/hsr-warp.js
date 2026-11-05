(function (H) {
  'use strict';
  const G = H.Gfx, R3 = H.R3, M = R3.M;
  const { W, HGT, C } = H.UI_CONST;
  const LW = 320, LH = 240;
  const LIGHT = { 3: '#5aa8ff', 4: '#c47cff', 5: '#ffcc50' };
  const SHOTS = [['ticket', 1.4], ['tunnel', 3.0], ['flyby', 1.5], ['brake', 1.4], ['walk', 2.0], ['door', 3.4]];
  const CINE = SHOTS.reduce((s, x) => s + x[1], 0);
  const PRE = 1.6;
  const GOLD = '#d8a848';
  const SILVER = '#b4b0a8', SKIRT = '#26262e', WIN = '#ffd890', BRASS = '#b8955a';
  const hx = G.hash;
  const cl = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = t => t * t * (3 - 2 * t);
  const eOut = t => 1 - (1 - t) * (1 - t) * (1 - t);
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const shotStart = name => { let s = 0; for (const [n, d] of SHOTS) { if (n === name) return s; s += d; } return s; };

  function fit(ui, s, w, size, bold) {
    if (ui.measure(s, size, bold) <= w) return s;
    while (s.length > 1 && ui.measure(s + '…', size, bold) > w) s = s.slice(0, -1);
    return s.trimEnd() + '…';
  }

  function keys(t, list) {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      if (t > list[i][0]) continue;
      const [t0, a] = list[i - 1], [t1, b] = list[i], k = sm((t - t0) / (t1 - t0));
      return a.map((v, j) => lerp(v, b[j], k));
    }
    return list[list.length - 1][1];
  }

  function star4(g, x, y, r, col) {
    g.fillStyle = col; g.beginPath();
    g.moveTo(x, y - r); g.lineTo(x + r * 0.22, y - r * 0.22); g.lineTo(x + r, y); g.lineTo(x + r * 0.22, y + r * 0.22);
    g.lineTo(x, y + r); g.lineTo(x - r * 0.22, y + r * 0.22); g.lineTo(x - r, y); g.lineTo(x - r * 0.22, y - r * 0.22);
    g.closePath(); g.fill();
  }

  const TX = {
    ticket: () => R3.paint('w|ticket', 64, 32, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d23a48'); gr.addColorStop(1, '#801828');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f0c868'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h);
      g.fillStyle = '#5a1018'; g.fillRect(3, 3, w - 6, 1); g.fillRect(3, h - 4, w - 6, 1);
      g.fillStyle = '#3a0a12'; g.beginPath(); g.arc(14, 16, 10, 0, Math.PI * 2); g.fill();
      star4(g, 14, 16, 9, '#ffe08a');
      g.fillStyle = '#fff8e0'; g.fillRect(13, 15, 2, 2);
      g.fillStyle = '#f2d890'; g.fillRect(28, 8, 22, 3); g.fillRect(28, 14, 16, 1); g.fillRect(28, 18, 19, 1); g.fillRect(28, 22, 11, 1);
      g.fillStyle = '#e8c060'; for (let y = 5; y < h - 4; y += 3) g.fillRect(55, y, 2, 1);
    }),
    ticketStd: () => R3.paint('w|tickets', 64, 32, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#c4e4ec'); gr.addColorStop(1, '#6a9cae');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f2f8fa'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h);
      g.fillStyle = '#3e6a7a'; g.fillRect(3, 3, w - 6, 1); g.fillRect(3, h - 4, w - 6, 1);
      g.fillStyle = '#2a4a58'; g.beginPath(); g.arc(14, 16, 10, 0, Math.PI * 2); g.fill();
      star4(g, 14, 16, 9, '#f6e6a8');
      g.fillStyle = '#ffffff'; g.fillRect(13, 15, 2, 2);
      g.fillStyle = '#2a4a58'; g.fillRect(28, 8, 22, 3); g.fillRect(28, 14, 16, 1); g.fillRect(28, 18, 19, 1); g.fillRect(28, 22, 11, 1);
      g.fillStyle = '#d8b060'; for (let y = 5; y < h - 4; y += 3) g.fillRect(55, y, 2, 1);
    }),
    ticketStdBack: () => R3.paint('w|ticketsb', 64, 32, (g, w, h) => {
      g.fillStyle = '#5a8a9c'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#9ac4d2'; g.lineWidth = 1;
      for (let i = -3; i < 10; i++) { g.beginPath(); g.moveTo(i * 8, 2); g.lineTo(i * 8 + 26, h - 2); g.stroke(); }
      g.fillStyle = '#f2f8fa'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h);
      star4(g, 32, 16, 7, '#f6e6a8');
    }),
    ticketBack: () => R3.paint('w|ticketb', 64, 32, (g, w, h) => {
      g.fillStyle = '#7a1622'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#a8742e'; g.lineWidth = 1;
      for (let i = -3; i < 10; i++) { g.beginPath(); g.moveTo(i * 8, 2); g.lineTo(i * 8 + 26, h - 2); g.stroke(); }
      g.fillStyle = '#e8c060'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h);
      star4(g, 32, 16, 7, '#f0c868');
    }),
    table: () => R3.paint('w|table', 128, 128, (g, w, h) => {
      g.fillStyle = '#c9ad74'; g.fillRect(0, 0, w, h);
      const arc = (x, y, r, a0, a1) => { g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); };
      for (const [col, lw, o] of [['#977438', 5, 0], ['#fff0bc', 1.5, -1.5]]) {
        g.strokeStyle = col; g.lineWidth = lw;
        arc(64, 150, 74 + o, Math.PI, Math.PI * 2); arc(64, 150, 48 + o, Math.PI, Math.PI * 2);
        arc(0, 36, 52 + o, -0.6, 1.3); arc(128, 36, 52 + o, Math.PI - 1.3, Math.PI + 0.6);
        g.beginPath(); g.moveTo(0, 16 + o); g.bezierCurveTo(40, 4, 88, 44, 128, 16 + o); g.stroke();
        g.beginPath(); g.moveTo(64 + o, 0); g.lineTo(64 + o, 30); g.stroke();
      }
      g.fillStyle = '#e8d49a';
      for (let i = 0; i < 70; i++) g.fillRect((hx(i, 1, 4) * w) | 0, (hx(i, 2, 4) * h) | 0, 1, 1);
    }),
    path: id => R3.paint('w|path|' + id, 64, 64, g => G.pathIcon(g, id, 0, 0, 64, '#ffffff')),
    cone: id => R3.tex(G.coneArt(id, 72, 100)),
    bust: (look, id, gender) => R3.tex(G.splashPortrait(id, gender, 120, 128) || G.bustCanvas(look, 64))
  };

  function sideQ(m, x, s, y0, y1, z0, z1, col, o) {
    if (s > 0) R3.quad(m, [x, y0, z1, x, y0, z0, x, y1, z0, x, y1, z1], col, o);
    else R3.quad(m, [x, y0, z0, x, y0, z1, x, y1, z1, x, y1, z0], col, o);
  }

  function frontQ(m, z, x0, x1, y0, y1, col, o) { R3.quad(m, [x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z], col, o); }

  function diamond(m, x, y, z, r, col, o) { R3.quad(m, [x, y - r, z, x + r, y, z, x, y + r, z, x - r, y, z], col, o); }

  function wheel(m, x, y, z) {
    const d = R3.mesh();
    R3.cyl(d, 0, -0.06, 0, 0.3, 0.3, 0.12, 7, '#1a1a20', { sm: false, capCol: '#4a4a54' });
    R3.merge(m, d, M.of(M.t(x, y, z), M.rz(Math.PI / 2)));
  }

  const CAR_P = [[-1.25, 0], [1.25, 0], [1.25, 1.55], [1.13, 2.2], [0.62, 2.55], [-0.62, 2.55], [-1.13, 2.2], [-1.25, 1.55]];
  const bodyCol = i => (i === 4 ? '#7a7882' : i === 3 || i === 5 ? '#9896a0' : i === 0 ? SKIRT : SILVER);

  function carSides(m, z0, z1, wins, door) {
    for (const s of [-1, 1]) {
      sideQ(m, s * 1.262, s, 0.04, 0.13, z0, z1, GOLD, { emit: 0.6 });
      sideQ(m, s * 1.262, s, 1.46, 1.51, z0, z1, GOLD, { emit: 0.45 });
      for (const z of wins) {
        sideQ(m, s * 1.265, s, 0.72, 1.4, z - 0.5, z + 0.5, '#2e2e36');
        sideQ(m, s * 1.28, s, 0.77, 1.35, z - 0.44, z + 0.44, WIN, { emit: 1 });
      }
      if (door) sideQ(m, s * 1.262, s, 0.14, 1.44, door - 0.5, door + 0.5, '#3c3c46');
    }
  }

  function buildCar() {
    const m = R3.mesh(), L = 3.1;
    R3.loft(m, CAR_P, -L, CAR_P, L, SILVER, { sideCol: bodyCol, capCol: '#8a8680' });
    R3.box(m, 0, -0.2, 0, 2.3, 0.4, 2 * L - 0.6, SKIRT);
    carSides(m, -L, L, [-2.3, -1.15, 0, 1.15], 2.45);
    const C = CAR_P.map(([x, y]) => [x * 0.96, y * 0.99]);
    R3.loft(m, C, L, C, L + 0.35, '#3a3842', { cap: false });
    R3.box(m, 0, -0.2, L + 0.175, 2.2, 0.4, 0.95, SKIRT);
    for (const s of [-1, 1]) for (const z of [-2.35, -1.6, 1.6, 2.35]) wheel(m, s * 0.98, -0.34, z);
    for (const s of [-1, 1]) R3.cyl(m, s * 0.5, 2.1, 3.15, 0.07, 0.07, 0.4, 6, GOLD, { sm: false });
    return m;
  }

  function buildLoco() {
    const m = R3.mesh();
    const NOSE = CAR_P.map(([x, y]) => [x * 0.7, 0.3 + y * 0.78]);
    R3.loft(m, CAR_P, -2.5, CAR_P, 1.6, SILVER, { sideCol: bodyCol, capCol: '#8a8680' });
    R3.loft(m, CAR_P, 1.6, NOSE, 2.5, '#c4bcae', { sideCol: i => (i === 0 ? SKIRT : i === 4 ? '#8a8490' : '#c4bcae'), capCol: '#2c2834' });
    R3.box(m, 0, -0.2, -0.3, 2.3, 0.4, 4.2, SKIRT);
    carSides(m, -2.5, 1.6, [-1.4, -0.1], null);
    R3.disc(m, 0, 1.25, 2.5, 0.62, 0.05, 12, GOLD, { emit: 0.25 });
    R3.disc(m, 0, 1.25, 2.55, 0.48, 0.03, 12, '#2a2632');
    R3.disc(m, 0, 1.25, 2.58, 0.32, 0.03, 12, '#eaf6ff', { emit: 1 });
    R3.box(m, 0, 2.02, 2.25, 0.18, 0.56, 0.14, GOLD, { emit: 0.25 });
    for (const s of [-1, 1]) { R3.box(m, s * 0.66, 1.62, 2.4, 0.44, 0.07, 0.1, GOLD, { emit: 0.25 }); R3.box(m, s * 0.74, 0.86, 2.4, 0.3, 0.07, 0.1, GOLD, { emit: 0.25 }); }
    R3.loft(m, [[-1.1, -0.45], [1.1, -0.45], [1.0, 0.3], [-1.0, 0.3]], 2.2, [[-0.5, -0.45], [0.5, -0.45], [0.6, 0.18], [-0.6, 0.18]], 3.0, '#6a5028', { capCol: GOLD });
    for (const s of [-1, 1]) for (const z of [-1.8, -1.0, 0.6, 1.4]) wheel(m, s * 0.98, -0.34, z);
    return m;
  }

  function buildConsole() {
    const m = R3.mesh();
    R3.grid(m, -1.8, -1.2, 1.8, 2.0, 0, 8, 8, '#ffffff', { tex: TX.table() });
    R3.box(m, 0, 0.1, -1.36, 3.8, 0.2, 0.32, '#e2d0a0', { cols: ['#d6c08a'] });
    R3.box(m, 0, 0.13, -1.2, 3.0, 0.07, 0.012, '#90ecff', { emit: 1 });
    R3.box(m, 0, 1.2, -1.9, 7, 2.8, 0.2, '#2c2216');
    for (const s of [-1, 1]) {
      R3.box(m, s * 1.1, 1.2, -1.72, 0.36, 2.6, 0.16, BRASS);
      R3.box(m, s * 0.66, 1.3, -1.74, 0.07, 2.4, 0.08, '#8a6a38');
      R3.box(m, s * 1.55, 1.2, -1.75, 0.07, 2.6, 0.08, '#8a6a38');
    }
    const SH = [[-0.42, 1.75], [-0.42, 1.08], [0, 0.4], [0.42, 1.08], [0.42, 1.75]], SI = [[-0.24, 1.75], [-0.24, 1.12], [0, 0.7], [0.24, 1.12], [0.24, 1.75]];
    R3.loft(m, SH, -1.72, SH, -1.64, '#d8b870');
    R3.loft(m, SI, -1.64, SI, -1.62, '#2c2216');
    return m;
  }

  function buildTicket(std) {
    const m = R3.mesh(), w = 0.32, d = 0.15;
    R3.quad(m, [-w, 0, d, w, 0, d, w, 0, -d, -w, 0, -d], '#ffffff', { tex: std ? TX.ticketStd() : TX.ticket(), emit: 0.35 });
    R3.quad(m, [-w, 0, -d, w, 0, -d, w, 0, d, -w, 0, d], '#ffffff', { tex: std ? TX.ticketStdBack() : TX.ticketBack(), emit: 0.35 });
    return m;
  }

  function buildPlatform() {
    const m = R3.mesh();
    R3.grid(m, -11, -0.2, 11, 4.2, 0, 22, 5, '#565a66', { check: '#5e6270' });
    R3.box(m, 0, 0.012, -0.15, 22, 0.025, 0.1, GOLD, { emit: 0.55 });
    R3.box(m, 0, -0.3, -0.26, 22, 0.6, 0.06, '#1c1e26');
    return m;
  }

  function buildDoor() {
    const frame = R3.mesh(), panel = R3.mesh(), glass = R3.mesh(), light = R3.mesh(), rim = R3.mesh();
    R3.box(frame, -0.53, 1.0, 0.03, 0.07, 2.06, 0.06, BRASS);
    R3.box(frame, 0.53, 1.0, 0.03, 0.07, 2.06, 0.06, BRASS);
    R3.box(frame, 0, 2.03, 0.03, 1.13, 0.07, 0.06, BRASS);
    R3.cyl(frame, 0.68, 0.45, 0.1, 0.022, 0.022, 1.25, 6, '#e0b868', { sm: false });
    for (const y of [0.5, 1.64]) R3.box(frame, 0.63, y, 0.06, 0.1, 0.03, 0.03, '#e0b868');
    for (const x of [0.86, 0.98]) { R3.cyl(frame, x, 1.6, 0.04, 0.045, 0.045, 0.5, 7, '#c8a060', { sm: false }); for (let i = 0; i < 5; i++) R3.cyl(frame, x, 1.65 + i * 0.09, 0.04, 0.056, 0.056, 0.025, 7, '#8a6a38', { sm: false, cap: false }); }
    R3.box(panel, 0, 1.0, 0.035, 0.98, 1.96, 0.04, '#3e3e48');
    R3.box(panel, 0, 1.38, 0.062, 0.58, 1.02, 0.006, '#202028');
    R3.box(panel, 0.36, 0.95, 0.068, 0.03, 0.5, 0.018, '#c8a060');
    frontQ(glass, 0.072, -0.24, 0.24, 0.93, 1.83, '#ffffff', { emit: 1 });
    frontQ(light, 0.01, -0.5, 0.5, 0, 2.0, '#ffffff', { emit: 1 });
    for (const [x0, x1, y0, y1] of [[-0.5, -0.47, 0, 2.0], [0.47, 0.5, 0, 2.0], [-0.5, 0.5, 1.97, 2.0]]) frontQ(rim, 0.08, x0, x1, y0, y1, '#ffffff', { emit: 1 });
    return { frame, panel, glass, light, rim };
  }

  let MOD = null;
  function mod() {
    if (!MOD) MOD = { ticket: buildTicket(false), ticketStd: buildTicket(true), console: buildConsole(), car: buildCar(), loco: buildLoco(), platform: buildPlatform(), door: buildDoor() };
    return MOD;
  }

  const meshCache = new Map();
  function cached(key, fn) { let m = meshCache.get(key); if (!m) { m = fn(); meshCache.set(key, m); } return m; }

  function cardMesh(id) {
    return cached('card|' + id, () => {
      const m = R3.mesh();
      R3.box(m, 0, 0, 0, 1.04, 1.44, 0.05, '#c6cad6', { cols: [null, '#2a2e3a'] });
      frontQ(m, 0.05, -0.47, 0.47, -0.67, 0.67, '#ffffff', { tex: TX.cone(id), emit: 0.55 });
      return m;
    });
  }

  function glassMesh() {
    return cached('glass', () => { const m = R3.mesh(); frontQ(m, 0, -0.55, 0.55, -0.76, 0.76, '#ffffff', { two: true }); return m; });
  }

  function emblemMesh(path) {
    return cached('emblem|' + path, () => { const m = R3.mesh(); frontQ(m, 0, -0.5, 0.5, -0.5, 0.5, '#ffffff', { tex: TX.path(path), emit: 1 }); return m; });
  }

  function pathOf(r) { return r.kind === 'char' ? H.CHARS[r.id].path : (H.CONES[r.id] || {}).path; }

  function plateMesh(r, game) {
    return cached('plate|' + r.kind + '|' + r.id + '|' + (G.hasSplash(r.id, game && game.state.gender) ? 1 : 0), () => {
      const m = R3.mesh(), rar = r.rar;
      R3.box(m, 0, 0, 0, 1.6, 0.9, 0.06, '#141c40', { cols: ['#1a2452'] });
      frontQ(m, 0.045, -0.8, 0.8, -0.45, -0.405, G.RARITY[rar], { emit: 0.8 });
      if (r.kind === 'cone') {
        R3.box(m, 0.36, 0.03, 0.07, 0.58, 0.8, 0.04, '#c6cad6');
        frontQ(m, 0.105, 0.1, 0.62, -0.34, 0.4, '#ffffff', { tex: TX.cone(r.id), emit: 0.6 });
      } else frontQ(m, 0.05, 0.0, 0.8, -0.405, 0.45, '#ffffff', { tex: TX.bust(G.lookOf(r.id, game), r.id, game && game.state.gender), emit: 0.9 });
      const p = pathOf(r);
      if (p) frontQ(m, 0.05, -0.64, -0.3, -0.02, 0.32, '#f2dc9a', { tex: TX.path(p), emit: 1 });
      for (let i = 0; i < rar; i++) diamond(m, -0.47 + (i - (rar - 1) / 2) * 0.1, -0.2, 0.05, 0.045, LIGHT[rar], { emit: 1 });
      return m;
    });
  }

  function spaceBg(R, t, drift) {
    R.clear('#040816', '#0e1c40', '#0a1430');
    R.stars(120, 3, 0.8, (drift || 0) * t);
  }

  function shotTicket(R, t, S) {
    const Mo = mod(), k = sm(cl(t / 1.4)), ticket = S && S.std ? Mo.ticketStd : Mo.ticket;
    R.light({ amb: [0.5, 0.46, 0.4], dir: [0.1, 1, 0.5], sun: [0.55, 0.5, 0.42], pts: [{ p: [0, 0.3, -1.05], c: [0.35, 0.95, 1.25], r: 2.4 + t }] });
    R.look([0, lerp(0.62, 0.3, k), lerp(2.3, 0.45, k)], [0, lerp(0.24, 0.15, k), -1.2], 54);
    R.clear('#140e08', '#2a1e10');
    R.draw(Mo.console, M.id());
    const hover = 1 - sm(seg(t, 0.35, 0.8)), e = sm(seg(t, 0.35, 0.95));
    const tp = [0, lerp(0.34, 0.03, e) + Math.sin(t * 5) * 0.02 * hover, lerp(0.7, -1.18, e)];
    if (t < 1.0) {
      R.draw(ticket, M.of(M.t(tp[0], tp[1], tp[2]), M.rx(lerp(1.2, -0.08, e)), M.rz(Math.sin(t * 3) * 0.1 * hover)));
      for (let i = 0; i < 6; i++) { const a = t * 2 + i * 1.05; R.glow([tp[0] + Math.cos(a) * 0.4, tp[1] + Math.sin(a) * 0.15, tp[2]], 0.03, '#fff0c0', { shape: 'star', a: hover * (0.5 + 0.5 * Math.sin(t * 9 + i)), min: 1.4 }); }
    }
    const g = seg(t, 0.8, 1.35);
    R.glow([0, 0.14, -1.2], 0.3 + g * 2.8, '#50c8ff', { a: 0.35 + g * 0.9, depth: false });
    R.glow([0, 0.14, -1.2], 0.1 + g * 0.7, '#ffffff', { a: 0.6 + g, depth: false });
    for (let i = 0; i < 16; i++) {
      const x = (hx(i, 1, 21) - 0.5) * 2.8, ph = (t * (0.6 + hx(i, 2, 21)) + hx(i, 3, 21)) % 1;
      R.glow([x, 0.16 + ph * 0.5, -1.15], 0.03, '#c8f6ff', { a: (1 - ph) * (0.4 + g), shape: 'star', min: 1.2 });
    }
  }

  function ticketPos(t) {
    return keys(t, [[0, [0.05, -0.05, -1.7]], [1.1, [0.55, -0.12, -4.2]], [1.9, [0.95, 0.25, -3.4]], [2.6, [-1.6, 1.3, -0.4]]]);
  }

  function shotTunnel(R, t, S) {
    const Mo = mod();
    R.light({ amb: [0.45, 0.5, 0.7], dir: [0, 0.4, 1], sun: [0.7, 0.8, 1.0] });
    R.look([0, 0, 0], [Math.sin(t * 1.3) * 0.15, 0.1, -10], 62, Math.sin(t * 0.7) * 0.06);
    R.clear('#040a1c', '#06122c', '#0c2a58');
    R.stars(90, 11, 0.7);
    const star = [0.25, 0.9, -70], pulse = 1 + Math.sin(t * 9) * 0.08;
    R.glow(star, 22 * pulse, '#2050b0', { a: 0.7, depth: false });
    R.glow(star, 7, '#90d0ff', { a: 1, depth: false });
    R.glow(star, 13 * pulse, '#ffffff', { shape: 'star', a: 0.9, depth: false });
    R.glow(star, 40, '#0c2a6a', { a: 0.5, depth: false });
    const dist = 30 * t - (10 / 3) * t * t, spd = 30 - 6.67 * t;
    for (let i = 0; i < 230; i++) {
      const a = hx(i, 1, 3) * Math.PI * 2, r = 0.8 + hx(i, 2, 3) * 6.5, k = 0.8 + hx(i, 4, 3) * 0.5;
      const z = -60 + ((hx(i, 3, 3) * 60 + dist * k) % 60);
      if (z > -0.3) continue;
      const x = Math.cos(a) * r, y = Math.sin(a) * r, len = spd * 0.12 * k, near = cl((z + 60) / 50);
      R.streak([x, y, z], [x, y, z - len], 1 + near * 1.5, mix([200, 240, 255], [110, 180, 255], hx(i, 5, 3)).map(v => v * (0.3 + near * 0.7)), '#061430', { depth: false });
    }
    const f = seg(t, 1.0, 2.9), zl = lerp(-62, -3.4, Math.pow(f, 2.4));
    if (t > 1.0) {
      for (let i = 0; i < 3; i++) R.draw(Mo.car, M.t(0, -1.25, zl - 3.0 - 2.5 - 0.35 - 3.1 - i * 6.55));
      R.draw(Mo.loco, M.t(0, -1.25, zl - 3.0));
      R.glow([0, 0.0, zl - 0.35], 0.9 + f * 1.2, '#c8ecff', { a: 0.9, depth: false });
      R.glow([0, 0.0, zl - 0.35], 1.2, '#ffffff', { shape: 'star', a: 0.8 * f, depth: false });
    }
    const tp = ticketPos(t);
    R.draw(S && S.std ? Mo.ticketStd : Mo.ticket, M.of(M.t(tp[0], tp[1], tp[2]), M.rx(t * 4.1), M.ry(t * 2.3 + 0.4), M.rz(t * 1.7), M.s(1.3)));
    const ring = seg(t, 0.2, 0.6) * (1 - seg(t, 0.9, 1.4)), sp = R.project(star);
    if (ring > 0 && sp) [[255, 70, 90], [90, 255, 130], [90, 130, 255]].forEach((col, i) => R.flat(sp[0] + (R.w / 2 - sp[0]) * 0.3, sp[1] + (LH / 2 - sp[1]) * 0.3, 128 + i * 7, col, { shape: 'ring', a: ring * 0.16 }));
  }

  function trainAt(R, zf) {
    const Mo = mod();
    R.draw(Mo.loco, M.t(0, 0, zf - 3.0));
    let z = zf - 3.0 - 2.5 - 0.35 - 3.1;
    for (let i = 0; i < 3; i++, z -= 6.55) R.draw(Mo.car, M.t(0, 0, z));
  }

  function sparks(R, t, n, seed, origin, vel, life, span, cols) {
    for (let i = 0; i < n; i++) {
      const ts = hx(i, seed, 1) * span, age = t - ts, lf = life * (0.6 + hx(i, seed, 2) * 0.8);
      if (age < 0 || age > lf) continue;
      const o = origin(i, ts), v = vel(i, ts);
      const p = [o[0] + v[0] * age, o[1] + v[1] * age - 5 * age * age, o[2] + v[2] * age];
      const q = [p[0] - v[0] * 0.04, p[1] - (v[1] - 10 * age) * 0.04, p[2] - v[2] * 0.04];
      const fade = 1 - age / lf;
      R.streak(p, q, 1.2, mul(R3.rgb(cols[0]), fade), mul(R3.rgb(cols[1]), fade * 0.6));
    }
  }

  function shotFlyby(R, t) {
    R.light({ amb: [0.42, 0.46, 0.62], dir: [0.7, 0.5, 0.5], sun: [0.95, 0.9, 0.78] });
    const sh = (1 - seg(t, 0.4, 1.5)) * 0.03;
    R.look([2.45 + Math.sin(t * 47) * sh, -0.35 + Math.cos(t * 39) * sh, 4.2], [0.35, 1.3, -8], 64, 0.1);
    spaceBg(R, t, 40);
    const zf = -4 + 26 * t;
    trainAt(R, zf);
    sparks(R, t, 110, 17, (i, ts) => [1.18, -0.42, -4 + 26 * ts - 2 - hx(i, 9, 1) * 22], i => [2 + hx(i, 1, 9) * 6, 0.5 + hx(i, 2, 9) * 2.6, 8 + hx(i, 3, 9) * 14], 0.35, 1.5, ['#fff0a0', '#ff5010']);
    for (let i = 0; i < 12; i++) {
      const z = zf - 1.2 - i * 0.9 - hx(i, 3, 5) * 0.5, tw = 0.5 + 0.5 * Math.sin(t * 25 + i * 2);
      R.glow([1.3 + hx(i, 1, 5) * 0.4, 1.7 + hx(i, 2, 5) * 0.8, z], 0.06, '#80e8ff', { shape: 'star', a: tw, min: 1.5 });
    }
  }

  function platLight(R, S, glow) {
    const pts = [];
    if (glow > 0) pts.push({ p: [0, 1.2, 0.15], c: mul(S.col, 1.7 * glow / 255), r: 3.4 });
    R.light({ amb: [0.34, 0.34, 0.4], dir: [0.35, 0.9, 0.8], sun: [0.62, 0.58, 0.52], pts });
  }

  function platDraw(R, carX) {
    R.clear('#060a18', '#101a34', '#0a1226');
    R.stars(80, 5, 0.6, 0);
    const Mo = mod();
    R.draw(Mo.platform, M.id());
    R.draw(Mo.loco, M.of(M.t(carX + 5.95, 0.35, -1.52), M.ry(Math.PI / 2)));
    for (let i = 0; i < 3; i++) {
      R.draw(Mo.car, M.of(M.t(carX - i * 6.55, 0.35, -1.52), M.ry(Math.PI / 2)));
      if (i > 0) drawDoor(R, null, 0, 0, carX + 2.45 - i * 6.55);
    }
  }

  function drawDoor(R, S, glow, open, x) {
    const D = mod().door, base = M.t(x, 0.35, -0.265), c = (S && S.col) || [255, 216, 144];
    R.draw(D.frame, base);
    if (open > 0) R.draw(D.light, base, { tint: mix(c, [255, 255, 255], 0.55).map(v => Math.min(255, v * (0.4 + open))) });
    R.draw(D.panel, M.of(base, M.t(open * 0.97, 0, 0)));
    R.draw(D.glass, M.of(base, M.t(open * 0.97, 0, 0)), { tint: mix([255, 216, 144], mix(c, [255, 255, 255], 0.3), cl(glow * 1.4)) });
    if (glow > 0) R.draw(D.rim, base, { mode: 'add', alpha: glow, tint: c });
  }

  function shotBrake(R, t, S) {
    const carAt = x => -2.45 - 8 * Math.pow(1 - cl(x / 1.3), 3);
    const e = 1 - Math.pow(1 - cl(t / 1.3), 3), carX = carAt(t), sh = (1 - e) * 0.025, spd = 1 - e;
    platLight(R, S, 0);
    R.look([-1.5 + Math.sin(t * 43) * sh + t * 0.3, 0.26 + Math.cos(t * 37) * sh, 2.2], [-2.7 + t * 0.4, 0.6, -0.3], 56);
    platDraw(R, carX);
    drawDoor(R, S, 0, 0, carX + 2.45);
    for (let i = 0; i < 16 && spd > 0.05; i++) {
      const y = 0.45 + hx(i, 1, 51) * 1.9, x = carX - 9 + hx(i, 2, 51) * 17, len = 1.5 + spd * 5;
      R.streak([x, y, -0.2], [x - len, y, -0.2], 1, mul([200, 200, 210], spd * 0.5), [0, 0, 0], { depth: false });
    }
    sparks(R, t, 90, 29, (i, ts) => [carAt(ts) - 9.5 + hx(i, 4, 2) * 17.5, 0.14, -0.22], (i, ts) => [7 * Math.pow(1 - cl(ts / 1.3), 2) - hx(i, 1, 7) * 2, 0.6 + hx(i, 2, 7) * 2.2, 1.2 + hx(i, 3, 7) * 3.2], 0.34, 1.3, ['#fff2b0', '#ff6020']);
  }

  function walkState(t) {
    const e = cl(t / 1.6), x = lerp(-1.8, 0, 1 - (1 - e) * (1 - e));
    const ph = t * 12, go = 1 - seg(t, 1.35, 1.6);
    return { x, y: 0, z: 0.8, yaw: lerp(Math.PI / 2, 0, sm(seg(t, 1.45, 1.95))), leg: Math.sin(ph) * 0.5 * go, bob: Math.abs(Math.sin(ph)) * 0.03 * go, armSwing: Math.sin(ph) * 0.35 * go, ear: Math.sin(ph - 0.6) * 0.08 * go, tilt: 0.04 };
  }

  function shotWalk(R, t, S) {
    const p = walkState(t), k = sm(seg(t, 1.45, 2.0));
    const eye = [lerp(p.x + 0.6, 0, k), lerp(0.2, 0.5, k), lerp(1.8, 2.3, k)], at = [lerp(p.x + 0.05, 0, k), lerp(0.3, 1.0, k), lerp(0.8, 0.5, k)];
    platLight(R, S, 0);
    R.look(eye, at, 55);
    platDraw(R, -2.45);
    drawDoor(R, S, 0, 0, 0);
    H.PomPom.draw(R, p);
  }

  function doorPlan(t, five) {
    if (!five) {
      const spread = sm(seg(t, 0.5, 0.85));
      return {
        pom: { x: 0, y: 0, z: 0.8, armPitch: lerp(-1.9, -0.35, spread), armYaw: lerp(0.78, 0, spread), armRoll: lerp(0, 1.3, spread), ear: lerp(0, 1.25, eOut(seg(t, 0.52, 0.9))), happy: t > 0.62, tilt: lerp(0.06, -0.12, spread), bob: Math.sin(t * 3) * 0.006 },
        cam: keys(t, [[0, [0, 0.52, 2.3, 0, 1.0, 0.5]], [0.5, [0, 0.46, 2.1, 0, 1.02, 0.55]], [1.0, [0, 0.44, 1.95, 0, 1.08, 0.6]], [1.45, [0, 0.82, 1.52, 0, 1.13, 0.92]], [2.0, [0.9, 1.05, 1.85, 0.15, 1.18, -0.22]], [3.4, [0.72, 1.05, 1.45, 0.08, 1.2, -0.22]]])
      };
    }
    const crouch = sm(seg(t, 0.5, 0.72)), jump = eOut(seg(t, 0.72, 1.3));
    return {
      pom: { x: 0, y: jump * 2.4 + Math.max(0, t - 1.3) * 4, z: lerp(0.8, 1.75, jump), sq: lerp(1, 0.8, crouch) * (1 - jump) + lerp(1.15, 1, jump) * jump, armPitch: lerp(-1.9, -2.9, jump), armYaw: lerp(0.78, 0, jump), armRoll: lerp(0, 0.9, jump), ear: lerp(0, -0.6, crouch) * (1 - jump) + jump * 1.1, happy: t > 0.72, tilt: -0.25 * jump, pitch: 0.85 * jump },
      cam: keys(t, [[0, [0, 0.52, 2.3, 0, 1.0, 0.5]], [0.5, [0, 0.46, 2.1, 0, 1.02, 0.55]], [0.75, [0, 0.36, 2.0, 0, 0.95, 0.6]], [1.8, [0.3, 0.95, 2.2, 0.05, 1.12, -0.2]], [3.4, [0.2, 1.0, 1.6, 0.02, 1.2, -0.22]]])
    };
  }

  function shotDoor(R, t, S) {
    const plan = doorPlan(t, S.five), five = S.five;
    if (five && t > 0.7 && t < 1.8) {
      const f = sm(seg(t, 0.72, 0.95)) * (1 - sm(seg(t, 1.25, 1.8))), p = plan.pom;
      plan.cam = plan.cam.map((v, i) => lerp(v, [0, 0.3, 2.5, p.x, p.y + 0.8, p.z][i], f));
    }
    const glow = cl(t / 0.6) * 0.55 + seg(t, 1.2, 2.0) * 0.45;
    const open = sm(seg(t, 2.0, 2.45));
    const c = plan.cam, shake = seg(t, 2.1, 3.4) * 0.012 + (five ? seg(t, 0.72, 0.8) * (1 - seg(t, 0.8, 1.2)) * 0.04 : 0);
    platLight(R, S, glow * (1 + open));
    R.look([c[0] + Math.sin(t * 51) * shake, c[1] + Math.cos(t * 43) * shake, c[2]], [c[3], c[4], c[5]], 56);
    platDraw(R, -2.45);
    drawDoor(R, S, glow, open, 0);
    if (!five || t < 2.2) {
      const lamp = H.PomPom.draw(R, plan.pom).lamp;
      R.glow(lamp, 0.07, '#fff6d0', { a: 1 });
      R.glow(lamp, 0.22 + (five ? 0 : seg(t, 1.0, 1.45) * 0.3), '#ffe8a0', { a: 0.55, depth: false });
    }
    const st0 = five ? 0.72 : 0.52, pal = five ? [255, 236, 200] : [236, 240, 250];
    for (let i = 0; i < (five ? 34 : S.best === 4 ? 26 : 18); i++) {
      const s = i % 2 ? 1 : -1, ts = st0 + hx(i, 1, 13) * 0.3, age = t - ts;
      if (age < 0 || age > 2.2) continue;
      const k = eOut(cl(age / 1.6)), sp = 0.7 + hx(i, 2, 13) * 1.6;
      const p = [s * (0.25 + k * sp), 0.25 + hx(i, 3, 13) * 0.7 + k * (0.2 + hx(i, 4, 13) * 0.5) + (five ? Math.min(plan.pom.y, 2.4) * 0.3 : 0), 0.75 + (hx(i, 5, 13) - 0.3) * 0.6];
      R.glow(p, 0.16 + k * 0.5, mix(pal, S.col, 0.18), { shape: 'puff', mode: 'alpha', a: 0.55 * (1 - cl(age / 2.2)) });
    }
    if (open > 0 || t > 1.9) {
      const k = seg(t, 1.95, 2.6), cx = 0, cy = 1.35, cz = -0.3, P0 = R.project([cx, cy, cz]);
      if (P0) {
        const n = S.best === 5 ? 16 : S.best === 4 ? 13 : 10;
        for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2 + hx(i, 3, 3) * 0.4 + t * 0.25, len = (1.4 + hx(i, 1, 3) * 2.6) * k;
          const P1 = R.project([cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.8, cz + 0.4]);
          if (P1) R.band(P0, P1, 1, 6 + hx(i, 2, 3) * 14, mix(S.col, [255, 255, 255], 0.6), mul(S.col, 0.15), 1e9, 1e9, 0.5 * k);
        }
        R.glow([cx, cy, cz], 0.6 + k * 1.4, mix(S.col, [255, 255, 255], 0.35), { a: 0.6 * k, depth: false });
      }
      for (let i = 0; i < 20; i++) {
        const ph = (t * (0.5 + hx(i, 1, 41)) + hx(i, 2, 41)) % 1;
        R.glow([(hx(i, 3, 41) - 0.5) * 1.6, 0.4 + ph * 2.0, 0.2 + hx(i, 4, 41) * 0.8], 0.035, mix(S.col, [255, 255, 255], 0.5), { shape: 'star', a: (1 - ph) * open, min: 1.4 });
      }
    }
  }

  const SHOT_FN = { ticket: shotTicket, tunnel: shotTunnel, flyby: shotFlyby, brake: shotBrake, walk: shotWalk, door: shotDoor };

  function drawRays(R, c, n, t, col, a, seed, len) {
    const P0 = R.project(c);
    if (!P0) return;
    for (let i = 0; i < n; i++) {
      const ang = i / n * Math.PI * 2 + hx(i, seed, 1) * 0.35 + t * 0.12, l = len * (0.55 + hx(i, seed, 2) * 0.7);
      const P1 = R.project([c[0] + Math.cos(ang) * l, c[1] + Math.sin(ang) * l, c[2]]);
      if (P1) R.band(P0, P1, 1, 8 + hx(i, seed, 3) * 22, mix(col, [255, 255, 255], 0.45), mul(col, 0.2), 1e9, 1e9, a);
    }
  }

  function drawRing(R, c, rad, col, a, t) {
    if (a <= 0) return;
    const m = M.of(M.t(c[0], c[1], c[2]), M.rx(0.3), M.ry(-0.35), M.rz(t * 0.15)), n = 72;
    for (let i = 0; i < n; i++) {
      if (i % 3 === 2) continue;
      const a0 = i / n * Math.PI * 2, a1 = (i + 0.8) / n * Math.PI * 2;
      R.streak(M.pt(m, Math.cos(a0) * rad, Math.sin(a0) * rad, 0), M.pt(m, Math.cos(a1) * rad, Math.sin(a1) * rad, 0), 1, mul(col, a), mul(col, a), { depth: false });
    }
    for (let i = 0; i < 8; i++) {
      const an = i / 8 * Math.PI * 2 + 0.2;
      R.glow(M.pt(m, Math.cos(an) * rad, Math.sin(an) * rad, 0), 0.09, col, { shape: 'ring', a, depth: false, min: 2 });
    }
  }

  function stageBg(R, rar, t, burst) {
    const col = R3.rgb(LIGHT[rar]);
    R.clear('#050a1e', '#0a1838', mix([10, 22, 60], col, 0.12));
    R.stars(70, 7, 0.7, t * 4);
    R.flat(R.w * 0.57, LH * 0.5, 170, col, { a: 0.14 + burst * 0.2 });
    R.haze(LH * 0.66, LH, mix(col, [255, 255, 255], 0.5), 0.12 + burst * 0.25);
  }

  function coneStage(R, r, t) {
    const rar = r.rar, col = R3.rgb(LIGHT[rar]);
    const burst = seg(t, 0.3, 0.55) * (1 - seg(t, 0.8, 1.6)) + 0.25;
    stageBg(R, rar, t, burst);
    R.light({ amb: [0.6, 0.6, 0.66], dir: [-0.4, 0.6, 1], sun: [0.65, 0.65, 0.7] });
    R.look([0, 0, 4.2], [0, 0, 0], 40);
    drawRays(R, [0.45, 0.05, -1.8], 16, t, col, burst * 0.7, 3, 4.2);
    drawRing(R, [0.45, 0.05, -0.9], lerp(1.2, 1.75, eOut(seg(t, 0.3, 0.9))), mix(col, [255, 255, 255], 0.5), seg(t, 0.3, 0.5) * (0.35 + 0.65 * (1 - seg(t, 1.0, 1.8))), t);
    const k = eOut(seg(t, 0, 0.55)), f = 1 - k, bob = Math.sin(t * 1.6) * 0.03 * k;
    const pos = M.t(lerp(0.45, 1.5, f), lerp(0.05, 2.7, f) + bob, lerp(0, 2.3, f));
    const rot = M.of(M.rz(lerp(0.07, 0.6, f)), M.ry(lerp(-0.34, -1.2, f) + Math.sin(t * 0.9) * 0.05 * k), M.rx(lerp(0.04, 0.8, f)));
    const glass = M.of(pos, rot, M.t(0.1, -0.08, -0.13));
    R.draw(glassMesh(), glass, { mode: 'alpha', alpha: 0.22, tint: '#b8d4ff', cull: false, lit: false });
    const corners = [[-0.55, -0.76], [0.55, -0.76], [0.55, 0.76], [-0.55, 0.76]].map(([x, y]) => M.pt(glass, x, y, 0));
    for (let i = 0; i < 4; i++) R.streak(corners[i], corners[(i + 1) % 4], 1, [150, 170, 200], [150, 170, 200], { depth: false });
    R.draw(cardMesh(r.id), M.of(pos, rot));
    const flare = seg(t, 0.45, 0.6) * (1 - seg(t, 0.6, 1.0));
    if (flare > 0) R.glow(M.pt(M.of(pos, rot), 0.5, 0.7, 0.05), 0.5 * flare, '#ffffff', { shape: 'star', a: flare, depth: false });
  }

  function prelude(R, t, r) {
    R.light({ amb: [0.5, 0.5, 0.5] });
    R.look([0, 0, 4.2], [0, 0, 0], 40);
    R.clear('#020308', '#070b1c');
    const gold = [255, 214, 110];
    for (let i = 0; i < 5; i++) {
      const a = seg(t, 0.15 + i * 0.05, 0.3 + i * 0.05) * (1 - seg(t, 0.55 + i * 0.04, 0.95));
      R.shaft(R.w * (0.36 + i * 0.07 + (hx(i, 1, 2) - 0.5) * 0.04), 4 + hx(i, 2, 2) * 8, '#3a5ab0', a * 0.6);
    }
    const p = pathOf(r);
    if (p) R.draw(emblemMesh(p), M.of(M.t(0, 0, -0.4), M.s(1.7 + t * 0.08)), { mode: 'add', alpha: 0.28 * seg(t, 0.1, 0.5), tint: '#9098b8' });
    const f = seg(t, 0.28, 0.4) * (1 - seg(t, 0.45, 0.75));
    if (f > 0) R.glow([0, 0, 0], 1.1 * f, '#ffffff', { shape: 'star', depth: false });
    const at = [0.66, 0.58, 0.5, 0.58, 0.66];
    [-0.95, -0.52, 0, 0.52, 0.95].forEach((x, i) => {
      if (t < at[i]) return;
      const s = i === 2 ? 0.5 : 0.2, pop = 1 + 0.5 * (1 - seg(t, at[i], at[i] + 0.16));
      R.glow([x, 0, 0], s * 1.8 * pop, gold, { a: 0.25, depth: false });
      R.glow([x, 0, 0], s * pop, gold, { shape: 'star', depth: false });
    });
    const b = seg(t, 1.05, 1.55);
    if (b > 0) {
      const P0 = [R.w / 2, LH / 2];
      for (let i = 0; i < 26; i++) {
        const a = i / 26 * Math.PI * 2 + hx(i, 1, 31) * 0.2, l = (60 + hx(i, 2, 31) * 140) * b;
        R.band(P0, [P0[0] + Math.cos(a) * l, P0[1] + Math.sin(a) * l], 1, 4 + hx(i, 3, 31) * 8, gold, [90, 60, 10], 1e9, 1e9, 0.7 * b);
      }
    }
  }

  function rackSlots(n) {
    if (n === 1) return [[0, 0]];
    const out = [];
    const rows = [[0.55, 1.34, 3], [0, 0, 4], [-0.55, -1.34, 3]];
    for (const [shift, y, k] of rows) for (let i = 0; i < k; i++) out.push([(i - (k - 1) / 2) * 1.85 + shift, y]);
    return out.slice(0, n);
  }

  function rackCam(R) { R.look([0.9, -0.6, 7.9], [0.15, 0.05, 0], 44, -0.13); }

  function drawRack(R, res, t, game) {
    R.light({ amb: [0.62, 0.62, 0.7], dir: [-0.2, 0.5, 1], sun: [0.55, 0.55, 0.6] });
    rackCam(R);
    R.clear('#04070f', '#0e1a38', '#0a1228');
    R.stars(90, 9, 0.6, t * 3);
    R.haze(LH * 0.75, LH, [60, 90, 160], 0.25);
    const slots = rackSlots(res.length);
    res.forEach((r, i) => {
      const [x, y] = slots[i], s0 = i * 0.07, k = eOut(seg(t, s0, s0 + 0.45));
      if (k <= 0) return;
      const base = M.of(M.t(x + (1 - k) * 4, y - (1 - k) * 1.5, (1 - k) * 2.5), M.ry(-0.4 * (1 - k)));
      R.draw(plateMesh(r, game), base);
      if (r.rar >= 4) {
        const col = R3.rgb(LIGHT[r.rar]), a = 0.45 + 0.25 * Math.sin(t * 4 + i), cs = [[-0.82, -0.49], [0.82, -0.49], [0.82, 0.49], [-0.82, 0.49]].map(([u, v]) => M.pt(base, u, v, 0.04));
        for (let j = 0; j < 4; j++) R.streak(cs[j], cs[(j + 1) % 4], 2, mul(col, a), mul(col, a), { depth: false });
        const sw = seg(t, s0 + 0.35, s0 + 0.8);
        if (sw > 0 && sw < 1) R.glow(M.pt(base, lerp(-0.8, 0.8, sw), 0, 0.05), 0.35, col, { a: 1 - sw, depth: false });
      }
    });
  }

  class WarpShow {
    constructor(ui, res, opts = {}) {
      this.ui = ui; this.res = res; this.game = ui.game; this.std = opts.ban === 'std';
      this.best = Math.max(...res.map(r => r.rar));
      this.col = R3.rgb(LIGHT[this.best]);
      this.five = this.best === 5;
      this.R = new R3.Raster(ui && ui.wide && ui.wide() ? 427 : LW, LH);
      this.phase = 'cine'; this.t = 0; this.cue = 0; this.rt = 0;
      this.queue = []; this.cur = -1; this.seen = new Set(); this.fade = 0; this.done = false;
      this.cues = this.cueList();
    }

    cueList() {
      const d = shotStart('door'), list = [[0.05, 'warp'], [0.95, 'ticket'], [1.35, 'whoosh'], [3.9, 'rumble'], [shotStart('brake'), 'brake']];
      for (let t = shotStart('walk') + 0.1; t < shotStart('walk') + 1.5; t += 0.27) list.push([t, 'step']);
      list.push([d + (this.five ? 0.72 : 0.52), 'steam'], [d + 2.0, 'door'], [d + 2.15, this.five ? 'star5' : this.best === 4 ? 'star4' : 'chest'], [d + 2.95, 'glint']);
      return list.sort((a, b) => a[0] - b[0]);
    }

    item() { return this.res[this.cur]; }

    intro() { const r = this.item(); return (r.rar === 5 ? PRE : 0) + (r.kind === 'char' ? H.WarpIntro.length(r.id, this.game, r.outfit) : 0.9); }

    tick(dt) {
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
      const r = this.item(), pre = r.rar === 5 ? PRE : 0;
      const cross = x => before < x && this.rt >= x;
      if (pre) { for (const x of [0.5, 0.58, 0.66]) if (cross(x)) this.ui.sfx('glint'); if (cross(1.05)) this.ui.sfx('whoosh'); }
      if (r.kind === 'char') { for (const [x, id] of H.WarpIntro.cues(r, this.game)) if (cross(pre + x)) this.ui.sfx(id); }
      else if (cross(pre + 0.3)) this.ui.sfx(r.rar === 5 ? 'star5' : r.rar === 4 ? 'star4' : 'glint');
    }

    begin(queue) {
      const first = this.phase === 'cine';
      this.phase = 'reveal';
      this.queue = queue.filter(i => !this.seen.has(i));
      this.next();
      if (first) this.fade = 1;
    }

    next() {
      if (!this.queue.length) { if (this.res.length > 1) this.toRack(); else this.done = true; return; }
      this.cur = this.queue.shift();
      this.seen.add(this.cur);
      this.rt = 0; this.fade = 0.3;
    }

    toRack() { this.phase = 'rack'; this.rt = 0; this.fade = 0.8; this.ui.sfx('confirm'); }

    skip() {
      if (this.res.length === 1) { if (this.phase === 'cine') this.begin([0]); else this.done = true; return; }
      if (this.phase === 'rack') { this.done = true; return; }
      const five = this.res.map((r, i) => i).filter(i => this.res[i].rar === 5 && !this.seen.has(i));
      if (five.length) this.begin(five); else this.toRack();
    }

    enter() {
      if (this.phase === 'cine') this.begin(this.res.map((r, i) => i));
      else if (this.phase === 'reveal') { if (this.rt < this.intro()) this.rt = this.intro(); else this.next(); }
      else if (this.rt < 1.3) this.rt = 1.3;
      else this.done = true;
    }

    shot() {
      let s = 0;
      for (const [n, d] of SHOTS) { if (this.t < s + d) return [n, this.t - s]; s += d; }
      const last = SHOTS[SHOTS.length - 1];
      return [last[0], last[1]];
    }

    draw(c) {
      const ui = this.ui, rw = ui && ui.wide && ui.wide() ? 427 : LW;
      if (this.R.w !== rw) this.R = new R3.Raster(rw, LH);
      const R = this.R;
      let flat = null;
      if (this.phase === 'cine') { const [n, lt] = this.shot(); SHOT_FN[n](R, lt, this); }
      else if (this.phase === 'reveal') {
        const r = this.item(), pre = r.rar === 5 ? PRE : 0;
        if (this.rt < pre) prelude(R, this.rt, r);
        else if (r.kind === 'char') flat = H.WarpIntro.render(this.game, r, this.rt - pre, this.std, rw > LW);
        else coneStage(R, r, this.rt - pre);
      } else drawRack(R, this.res, this.rt, this.game);
      if (flat) { const was = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false; c.drawImage(flat, ui.left, 0, ui.vw, HGT); c.imageSmoothingEnabled = was; }
      else R.finish(c, ui.left, 0, ui.vw, HGT);
      if (this.phase === 'cine') this.cineOverlay(c);
      else if (this.phase === 'reveal') this.revealOverlay(c);
      else this.rackOverlay(c);
      if (this.fade > 0) { c.fillStyle = 'rgba(255,255,255,' + this.fade.toFixed(3) + ')'; c.fillRect(ui.left, 0, ui.vw, HGT); }
    }

    flash(c, col, a) {
      if (a <= 0) return;
      const ui = this.ui;
      c.fillStyle = 'rgba(' + col.map(v => Math.round(v)).join(',') + ',' + Math.min(1, a).toFixed(3) + ')';
      c.fillRect(ui.left, 0, ui.vw, HGT);
    }

    skipButton(c, label) {
      const ui = this.ui, w = ui.measure(label, 10) + 44, x = ui.right - w - 10, y = 10;
      c.fillStyle = 'rgba(4,6,20,0.6)'; c.fillRect(x, y, w, 20);
      c.strokeStyle = 'rgba(242,220,154,0.6)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 19);
      const kw = ui.keycap(x + 6, y + 4, 'Esc');
      ui.text(label, x + 12 + kw, y + 5, { size: 10, col: C.cream });
      ui.hit(x, y, w, 20, () => this.skip());
    }

    cineOverlay(c) {
      const t = this.t;
      this.flash(c, [200, 245, 255], t < 1.4 ? seg(t, 1.1, 1.4) : 1 - seg(t, 1.4, 1.8));
      const d = shotStart('door');
      this.flash(c, mix(this.col, [255, 255, 255], 0.7), seg(t, d + 2.95, d + 3.4));
      this.flash(c, [0, 0, 0], 1 - seg(t, 0, 0.25));
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Пропустить');
      this.ui.hints([['Enter', 'Пропустить ролик']], this.ui.left + 12, HGT - 20, { col: 'rgba(200,210,240,0.8)' });
    }

    revealOverlay(c) {
      const ui = this.ui, r = this.item(), pre = r.rar === 5 ? PRE : 0, t = this.rt - pre;
      if (pre && t >= 0) this.flash(c, [255, 240, 200], 1 - seg(t, 0, 0.45));
      if (t >= 0 && r.kind === 'char') {
        const ct = this.rt - this.intro();
        H.WarpIntro.overlay(ui, c, r, t, this.game);
        this.namePlate(c, r, seg(ct, 0.05, 0.4));
        this.resultTag(c, r, seg(ct, 0.4, 0.7));
      } else if (t >= 0) {
        this.namePlate(c, r, seg(t, 0.4, 0.75));
        this.resultTag(c, r, seg(t, 0.8, 1.1));
      }
      if (this.res.length > 1) ui.plate(ui.left + 12, 10, (this.cur + 1) + ' / ' + this.res.length);
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Закрыть');
      ui.hints([['Enter', this.rt < this.intro() ? 'Показать' : this.queue.length || this.res.length > 1 ? 'Далее' : 'Готово']], ui.left + 12, HGT - 20);
    }

    namePlate(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui, x0 = ui.left + Math.round(-360 * (1 - eOut(a))), y = 292, path = pathOf(r);
      const gr = c.createLinearGradient(x0, 0, x0 + 380, 0);
      gr.addColorStop(0, 'rgba(4,6,20,0.9)'); gr.addColorStop(0.7, 'rgba(4,6,20,0.65)'); gr.addColorStop(1, 'rgba(4,6,20,0)');
      c.fillStyle = gr; c.fillRect(x0, y, 380, 84);
      c.fillStyle = C.brass; c.fillRect(x0, y, 320, 1); c.fillRect(x0, y + 83, 320, 1);
      ui.diamond(x0 + 320, y + 0.5, 3, C.brassHi); ui.diamond(x0 + 320, y + 83.5, 3, C.brassHi);
      c.fillStyle = '#0a0e26'; c.beginPath(); c.arc(x0 + 42, y + 34, 22, 0, Math.PI * 2); c.fill();
      c.strokeStyle = C.brass; c.lineWidth = 1; c.stroke();
      if (path) G.pathIcon(c, path, x0 + 26, y + 18, 32, C.gold);
      const size = ui.measure(r.name, 22, true, true) > 250 ? 16 : 22;
      ui.text(r.name, x0 + 76, y + (size === 22 ? 8 : 12), { size, bold: true, serif: true, col: '#fff4d8' });
      ui.text('★'.repeat(r.rar), x0 + 78, y + 36, { size: 14, col: LIGHT[r.rar] });
      if (r.kind === 'char') {
        const d = H.CHARS[r.id], said = H.WarpIntro.line(r.id, this.game, r.outfit);
        G.elemIcon(c, d.elem, x0 + 85, y + 64, 7);
        ui.text('Путь: ' + H.PATHS[d.path].name + ' · ' + H.ELEMENTS[d.elem].name, x0 + 96, y + 58, { size: 11, col: C.sub });
        if (said) {
          const q = '«' + said + '»', lw = ui.measure(q, 12) + 36, sg = c.createLinearGradient(x0, 0, x0 + lw + 40, 0);
          sg.addColorStop(0, 'rgba(4,6,20,0.82)'); sg.addColorStop(0.75, 'rgba(4,6,20,0.6)'); sg.addColorStop(1, 'rgba(4,6,20,0)');
          c.fillStyle = sg; c.fillRect(x0, y + 90, lw + 40, 24);
          ui.text(q, x0 + 22, y + 95, { size: 12, col: C.cream });
        }
      } else ui.text('Световой конус · ' + (path ? H.PATHS[path].name : ''), x0 + 78, y + 58, { size: 11, col: C.sub });
    }

    resultTag(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui;
      c.save(); c.globalAlpha = a;
      ui.resultTag(ui.right - 196, HGT - 104, r, [['Новый персонаж!', C.ok], ['присоединился к экипажу', C.cream]]);
      c.restore();
    }

    rackOverlay(c) {
      const ui = this.ui, R = this.R, t = this.rt;
      ui.plate(ui.left + 12, 10, 'Результаты прыжка');
      const slots = rackSlots(this.res.length);
      rackCam(R);
      this.res.forEach((r, i) => {
        const s0 = i * 0.07, k = seg(t, s0 + 0.3, s0 + 0.6);
        if (k <= 0) return;
        const [x, y] = slots[i], p = R.project([x, y - 0.6, 0]), q = R.project([x + 0.8, y + 0.48, 0]);
        if (!p) return;
        c.save(); c.globalAlpha = k;
        ui.text(fit(ui, r.name, 118, 10, r.rar >= 4), ui.left + p[0] * 2, p[1] * 2 - 2, { size: 10, bold: r.rar >= 4, align: 'center', col: r.rar >= 4 ? LIGHT[r.rar] : C.cream });
        if (r.kind === 'char' && q) {
          const tag = r.res === 'new' ? 'НОВЫЙ' : r.res === 'eid' ? 'Эйдолон +1' : r.res === 'max' ? 'Эйдолоны VI' : '+3000 кр.';
          const w = ui.measure(tag, 9, true) + 10, tx = ui.left + q[0] * 2 - w + 6, ty = q[1] * 2 - 8;
          c.fillStyle = r.res === 'new' ? '#e8c060' : '#2a3060'; c.fillRect(tx, ty, w, 13);
          c.strokeStyle = '#1a1208'; c.strokeRect(tx + 0.5, ty + 0.5, w - 1, 12);
          ui.text(tag, tx + w / 2, ty + 1, { size: 9, bold: true, align: 'center', col: r.res === 'new' ? '#20140c' : C.cream, shadow: r.res !== 'new' });
        }
        c.restore();
      });
      const best = this.res.filter(r => r.rar >= 4).length, news = this.res.filter(r => r.kind === 'char' && r.res === 'new').length;
      const sum = { starlight: 0, embers: 0 };
      for (const r of this.res) { const gl = ui.glowOf(r); if (gl) sum[gl.cur] += gl.n; }
      const note = '4★ и выше: ' + best + (news ? ' · новых персонажей: ' + news : '') + (sum.starlight ? ' · звёздный свет +' + sum.starlight : '') + (sum.embers ? ' · пепел +' + sum.embers : '');
      ui.text(note, W / 2, HGT - 42, { align: 'center', size: 11, col: C.sub });
      ui.hints([['Enter', 'Готово']], W / 2, HGT - 22, { align: 'center' });
    }
  }

  H.WarpShow = WarpShow;
  Object.assign(H, { WARP_SHOTS: SHOTS, WARP_CINE: CINE, WARP_PRE: PRE, WarpKit: { mod, trainAt, spaceBg, sparks, platDraw, platLight } });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
