(function (H) {
  'use strict';
  const G = H.Gfx, R3 = H.R3, M = R3.M, K = H.Cine.Kit;
  const { W, HGT, C } = H.UI_CONST;
  const { cl, lerp, sm, eOut, seg, rgba, glow, lighter, poly, rect, ell, line, ring, vgrad } = K;
  const LW = 320, LH = 240, CX = 160, CY = 120;
  const hx = G.hash;
  const RCOL = { 3: '#8cc4ff', 4: '#b48cff', 5: '#ffc860' };
  const RHOT = { 3: '#e6f4ff', 4: '#f2e6ff', 5: '#fff0c8' };
  const RDEEP = { 3: '#10284a', 4: '#26124a', 5: '#3e2606' };
  const SHOTS = [['tide', 1.4], ['dive', 0.5], ['comet', 1.8], ['vortex', 1.6], ['flash', 0.4]];
  const CINE = SHOTS.reduce((s, x) => s + x[1], 0);
  const SHIFT = 1.05, HOP = 0.4;
  const CUTS = {
    phrolova: [['lily', 0.8], ['hall', 0.9], ['baton', 0.9], ['lines', 0.8], ['face', 0.9], ['seats', 1.0], ['pose', 1.1]],
    scar: [['book', 1.1], ['fire', 0.9], ['fence', 1.0], ['dome', 1.0], ['shadow', 1.0], ['pose', 1.4]],
    kazuma: [['wash', 1.0], ['scan', 1.1], ['echo', 1.0], ['steal', 0.9], ['catch', 1.1], ['pose', 1.4]]
  };
  const CUT_SFX = {
    phrolova: [[0.05, 'glint'], [0.85, 'rumble'], [1.75, 'swing'], [2.6, 'break'], [3.45, 'glint'], [4.25, 'whoosh'], [5.2, 'star5']],
    scar: [[0.1, 'ticket'], [0.55, 'steam'], [1.15, 'rumble'], [2.05, 'swing'], [3.0, 'shield'], [3.1, 'break'], [4.05, 'debuff'], [5.0, 'star5']],
    kazuma: [[0.05, 'splash'], [0.6, 'splash'], [1.05, 'tech'], [1.6, 'glint'], [1.9, 'deny'], [2.15, 'rumble'], [2.45, 'splash'], [3.12, 'whoosh'], [3.65, 'glint'], [4.1, 'chest'], [4.55, 'step'], [5.15, 'star4']]
  };
  const QUOTES = { phrolova: 'Пора завершить представление, которого мы ждали. Вместе.', scar: 'Так кем ты будешь: пастухом или чёрным ягнёнком?', kazuma: 'Сато Казума, авантюрист. Меня что, опять куда-то призвали?' };
  const EYES = [[44.6, 19], [46.2, 24.4], [45.6, 30], [55.4, 19], [53.8, 24.4], [54.4, 30]];
  const RAINBOW = ['#ff5a5a', '#ffb04a', '#ffe85a', '#6aff8a', '#5ad8ff', '#7a7aff', '#d07aff'];
  const total = list => list.reduce((s, x) => s + x[1], 0);
  const shotStart = name => { let s = 0; for (const [n, d] of SHOTS) { if (n === name) return s; s += d; } return s; };
  const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const mixc = (a, b, t) => { const A = R3.rgb(a), B = R3.rgb(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };

  function pick(list, t) {
    let s = 0;
    for (const [n, d] of list) { if (t < s + d) return [n, t - s]; s += d; }
    const last = list[list.length - 1];
    return [last[0], t - s + last[1]];
  }

  const meshCache = new Map();
  function cached(key, fn) { let m = meshCache.get(key); if (!m) { m = fn(); meshCache.set(key, m); } return m; }
  const texId = new WeakMap();
  let texN = 0;
  const tid = t => { if (!t) return 'none'; let k = texId.get(t); if (!k) { k = ++texN; texId.set(t, k); } return k; };
  const sprites = new Map();
  function sprite(key, w, h, fn) {
    let c = sprites.get(key);
    if (!c) { c = G.mkCanvas(w, h); fn(c.getContext('2d'), w, h); sprites.set(key, c); }
    return c;
  }

  function blit(g, cv, x, y, s, rot, a, op) {
    if (a <= 0 || s <= 0) return;
    g.save();
    g.globalAlpha = cl(a);
    if (op) g.globalCompositeOperation = op;
    g.translate(x, y);
    if (rot) g.rotate(rot);
    g.scale(s, s);
    g.drawImage(cv, -cv.width / 2, -cv.height / 2);
    g.restore();
  }

  function star4(g, x, y, r, col, a, thin) {
    if (r <= 0 || a <= 0) return;
    const w = r * (thin || 0.16);
    poly(g, rgba(col, a), [x, y - r, x + w, y - w, x + r, y, x + w, y + w, x, y + r, x - w, y + w, x - r, y, x - w, y - w]);
  }

  function figure(g, look, x, y, k, o = {}) {
    const cv = G.figureCanvas(look, k), s = o.s || 1, w = cv.width * s, h = cv.height * s, fy = G.FIG_FOOT * k * s;
    g.save();
    g.imageSmoothingEnabled = false;
    if (o.a != null) g.globalAlpha = cl(o.a);
    if (o.op) g.globalCompositeOperation = o.op;
    g.translate(Math.round(x), Math.round(y));
    if (o.flip) g.scale(-1, 1);
    g.drawImage(o.tint ? K.tinted(cv, o.tint, o.ta == null ? 1 : o.ta) : cv, Math.round(-w / 2), Math.round(-fy), Math.round(w), Math.round(h));
    g.restore();
  }

  function rimFigure(g, look, x, y, k, rim, o = {}) {
    figure(g, look, x - 2, y, k, Object.assign({}, o, { tint: rim, ta: 1 }));
    figure(g, look, x, y, k, o);
  }

  function bust(g, look, x, y, size, s, o = {}) {
    const cv = G.bustCanvas(look, size);
    g.save();
    g.imageSmoothingEnabled = false;
    if (o.a != null) g.globalAlpha = cl(o.a);
    g.translate(Math.round(x), Math.round(y));
    if (o.flip) g.scale(-1, 1);
    g.scale(s, s);
    if (o.rim) g.drawImage(K.tinted(cv, o.rim, 1), -size / 2 - 2, -size);
    g.drawImage(cv, -size / 2, -size);
    g.restore();
  }

  function lily(g, x, y, r, rot, col, hi, a) {
    if (r <= 1) return;
    g.save();
    g.translate(x, y);
    g.rotate(rot || 0);
    if (a != null) g.globalAlpha = cl(a);
    g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      g.save();
      g.rotate(i / 6 * Math.PI * 2 + hx(i, 3, 71) * 0.4);
      g.fillStyle = col;
      g.beginPath(); g.moveTo(0, 0);
      g.quadraticCurveTo(r * 0.3, -r * 0.16, r * 0.62, -r * 0.1);
      g.bezierCurveTo(r * 0.86, -r * 0.06, r * 0.86, r * 0.2, r * 0.66, r * 0.17);
      g.quadraticCurveTo(r * 0.72, r * 0.06, r * 0.56, r * 0.03);
      g.quadraticCurveTo(r * 0.3, r * 0.04, 0, 0);
      g.fill();
      g.strokeStyle = hi; g.lineWidth = Math.max(1, r * 0.02);
      g.beginPath(); g.moveTo(r * 0.08, -r * 0.03); g.quadraticCurveTo(r * 0.32, -r * 0.13, r * 0.6, -r * 0.08); g.stroke();
      g.strokeStyle = col; g.lineWidth = Math.max(1, r * 0.012);
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(r * 0.45, -r * 0.3 * s - r * 0.05, r * 0.9, -r * 0.42 * s, r * 1.08, -r * 0.18 * s);
        g.stroke();
        ell(g, hi, r * 1.08, -r * 0.18 * s, Math.max(1, r * 0.025), Math.max(1, r * 0.025));
      }
      g.restore();
    }
    glow(g, 0, 0, r * 0.25, hi, 0.5);
    g.restore();
  }

  function knife(g, x, y, len, rot, a) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.globalAlpha = cl(a == null ? 1 : a);
    poly(g, '#16121a', [0, -len * 0.5, len * 0.09, len * 0.12, 0, len * 0.2, -len * 0.06, len * 0.12]);
    rect(g, '#2e242a', -len * 0.05, len * 0.2, len * 0.1, len * 0.3);
    line(g, '#ff6a5a', 1, len * 0.02, -len * 0.4, len * 0.07, len * 0.1);
    g.restore();
  }

  function hexDome(g, cx, cy, R0, size, col, a, reveal) {
    if (a <= 0) return;
    const s3 = Math.sqrt(3), n = Math.ceil(R0 / size) + 1, open = reveal == null ? 1 : reveal;
    const warp = (x, y) => { const d = Math.hypot(x, y) / R0; if (d >= 1) return null; const f = d > 0 ? Math.sin(d * Math.PI / 2) / d : Math.PI / 2; return [cx + x * f, cy + y * f * 0.86]; };
    g.save();
    g.strokeStyle = rgba(col, a); g.lineWidth = 1;
    g.beginPath();
    for (let r = -n; r <= n; r++) for (let q = -n; q <= n; q++) {
      const x = size * s3 * (q + r / 2), y = size * 1.5 * r, d = Math.hypot(x, y) / R0;
      if (d > 0.97 || d < 1 - open) continue;
      let first = true;
      for (let k = 0; k <= 6; k++) {
        const ang = Math.PI / 6 + k * Math.PI / 3, p = warp(x + Math.cos(ang) * size, y + Math.sin(ang) * size);
        if (!p) { first = true; continue; }
        if (first) { g.moveTo(p[0], p[1]); first = false; } else g.lineTo(p[0], p[1]);
      }
    }
    g.stroke();
    g.restore();
  }

  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return lerp(lerp(hx(xi, yi, s), hx(xi + 1, yi, s), u), lerp(hx(xi, yi + 1, s), hx(xi + 1, yi + 1, s), u), v);
  }

  let burnF = null;
  function burnField() {
    if (burnF) return burnF;
    burnF = new Float32Array(80 * 60);
    for (let y = 0; y < 60; y++) for (let x = 0; x < 80; x++) burnF[y * 80 + x] = vnoise(x / 9, y / 9, 301) * 0.6 + vnoise(x / 4, y / 4, 302) * 0.4;
    return burnF;
  }

  function burn(g, thr, T) {
    const F = burnField(), flick = Math.floor(T * 14);
    for (let y = 0; y < 60; y++) for (let x = 0; x < 80; x++) {
      const v = F[y * 80 + x] * 0.42 + ((79 - x) / 79 * 0.58 + (59 - y) / 59 * 0.42) * 0.58;
      if (v >= thr + 0.04) continue;
      if (v < thr - 0.05) rect(g, '#060304', x * 4, y * 4, 4, 4);
      else if (v < thr) rect(g, hx(x, y, flick) > 0.5 ? '#ffb040' : '#ff6a1a', x * 4, y * 4, 4, 4);
      else rect(g, 'rgba(70,34,10,0.55)', x * 4, y * 4, 4, 4);
    }
  }

  const arts = new WeakMap();
  function lineArt(src) {
    let out = arts.get(src);
    if (out) return out;
    const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
    out = G.mkCanvas(w, h);
    const o = out.getContext('2d'), img = o.createImageData(w, h), q = img.data;
    const A = i => d[i * 4 + 3] >= 128, L = i => d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, inside = A(i), k = i * 4;
      const edge = inside
        ? (x < w - 1 && A(i + 1) && Math.abs(L(i) - L(i + 1)) > 46) || (y < h - 1 && A(i + w) && Math.abs(L(i) - L(i + w)) > 46)
        : (x > 0 && A(i - 1)) || (x < w - 1 && A(i + 1)) || (y > 0 && A(i - w)) || (y < h - 1 && A(i + w));
      if (edge) { q[k] = 240; q[k + 1] = 236; q[k + 2] = 255; q[k + 3] = 255; }
      else if (inside) { q[k] = 6; q[k + 1] = 4; q[k + 2] = 8; q[k + 3] = 255; }
    }
    o.putImageData(img, 0, 0);
    arts.set(src, out);
    return out;
  }

  function warm(look) { G.figureCanvas(look, 2); G.figureCanvas(look, 3); lineArt(G.bustCanvas(look, 128)); }

  function cloudRing(rar, dark) {
    return sprite('conv|ring|' + rar + '|' + (dark ? 1 : 0), 220, 220, (g, w) => {
      const c = w / 2, base = dark ? '#262c3a' : RCOL[rar], hi = dark ? '#4a5266' : RHOT[rar], deep = dark ? '#0a0c14' : RDEEP[rar];
      for (let i = 0; i < 110; i++) {
        const a = hx(i, 1, 61) * Math.PI * 2, lobe = dark ? 12 * Math.cos(a * 9) : 0, r = 50 + lobe + hx(i, 2, 61) * 44, pr = 9 + hx(i, 3, 61) * 17;
        const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r, gr = g.createRadialGradient(x, y, 0, x, y, pr);
        gr.addColorStop(0, rgba(r < 62 ? deep : hx(i, 4, 61) > 0.55 ? hi : base, dark ? 0.8 : 0.5));
        gr.addColorStop(1, rgba(base, 0));
        g.fillStyle = gr; g.fillRect(x - pr, y - pr, pr * 2, pr * 2);
      }
      g.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        const a0 = hx(i, 5, 61) * Math.PI * 2, r = 60 + hx(i, 6, 61) * 34;
        g.strokeStyle = rgba(hi, dark ? 0.25 : 0.4); g.lineWidth = 1 + hx(i, 7, 61) * 2;
        g.beginPath(); g.arc(c, c, r, a0, a0 + 0.6 + hx(i, 8, 61)); g.stroke();
      }
    });
  }

  function lamb(g, x, y, s, black) {
    const wool = black ? '#2a2428' : '#fbf8ee', edge = black ? '#120e10' : '#6a5a48', puffs = [[0, 0], [5, -2], [-5, -2], [3, 2], [-3, 2]];
    for (const dx of [-5, -2, 2, 5]) line(g, '#2a2420', 1.2, x + dx * s, y + 2 * s, x + dx * s, y + 8 * s);
    for (const [dx, dy] of puffs) ell(g, edge, x + dx * s, y + dy * s, 5.4 * s, 4.4 * s);
    for (const [dx, dy] of puffs) ell(g, wool, x + dx * s, y + dy * s, 4.6 * s, 3.6 * s);
    ell(g, '#2a2420', x + 9 * s, y - 2 * s, 3 * s, 2.4 * s);
    ell(g, '#2a2420', x + 8 * s, y - 4.4 * s, 1.6 * s, 0.8 * s, -0.5);
  }

  function bookPage() {
    return sprite('conv|book', LW, LH, g => {
      g.fillStyle = '#ecdcb8'; g.fillRect(0, 0, LW, LH);
      for (let i = 0; i < 260; i++) { g.fillStyle = rgba(hx(i, 1, 113) > 0.5 ? '#d8c49a' : '#f6ead0', 0.7); g.fillRect(Math.floor(hx(i, 2, 113) * LW), Math.floor(hx(i, 3, 113) * LH), 1 + Math.floor(hx(i, 4, 113) * 3), 1); }
      const vg = g.createRadialGradient(CX, CY, 80, CX, CY, 210);
      vg.addColorStop(0, 'rgba(120,80,40,0)'); vg.addColorStop(1, 'rgba(120,80,40,0.45)');
      g.fillStyle = vg; g.fillRect(0, 0, LW, LH);
      g.save();
      g.beginPath(); g.rect(22, 18, 276, 160); g.clip();
      vgrad(g, 18, 178, [[0, '#c8dce4'], [1, '#efe4c8']], 22, 276);
      ell(g, '#f2c25a', 252, 48, 14, 14);
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; line(g, '#e0a840', 1.5, 252 + Math.cos(a) * 18, 48 + Math.sin(a) * 18, 252 + Math.cos(a) * 25, 48 + Math.sin(a) * 25); }
      g.fillStyle = '#a8c47e';
      g.beginPath(); g.moveTo(22, 128); g.quadraticCurveTo(100, 88, 170, 118); g.quadraticCurveTo(236, 142, 298, 106); g.lineTo(298, 178); g.lineTo(22, 178); g.closePath(); g.fill();
      for (let x = 120; x < 244; x += 12) line(g, '#7a5a3a', 1.5, x, 114 + (x - 120) * 0.08, x, 102 + (x - 120) * 0.08);
      line(g, '#7a5a3a', 1.2, 118, 105, 242, 115); line(g, '#7a5a3a', 1.2, 118, 110, 242, 120);
      g.fillStyle = '#86a660';
      g.beginPath(); g.moveTo(22, 152); g.quadraticCurveTo(120, 130, 200, 150); g.quadraticCurveTo(250, 160, 298, 146); g.lineTo(298, 178); g.lineTo(22, 178); g.closePath(); g.fill();
      [[72, 146, 1], [104, 158, 1.1], [150, 142, 0.9], [192, 160, 1.1], [134, 168, 1]].forEach(([x, y, s]) => lamb(g, x, y, s, false));
      lamb(g, 264, 160, 1.1, true);
      poly(g, '#8a5a3a', [34, 170, 50, 170, 46, 142, 38, 142]);
      ell(g, '#f0d0b0', 42, 136, 4, 4);
      ell(g, '#6a4a2a', 42, 132, 6, 2.2);
      line(g, '#5a3a20', 1.5, 54, 172, 54, 128);
      g.strokeStyle = '#5a3a20'; g.lineWidth = 1.5; g.beginPath(); g.arc(51, 128, 3, 0, Math.PI, true); g.stroke();
      g.restore();
      g.strokeStyle = '#6a4a2a'; g.lineWidth = 1;
      g.strokeRect(20.5, 16.5, 279, 163); g.strokeRect(17.5, 13.5, 285, 169);
      g.fillStyle = '#4a2e18'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.font = 'italic bold 15px Georgia, serif'; g.fillText('Сказка о чёрном ягнёнке', CX, 204);
      g.font = 'italic 10px Georgia, serif'; g.fillText('Жили-были ягнята, белые как снег. И один чёрный.', CX, 222);
    });
  }

  const poolTex = () => R3.paint('conv|pool', 256, 256, (g, w) => {
    const c = w / 2;
    g.fillStyle = '#2a5068'; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 500; i++) { g.fillStyle = rgba(hx(i, 1, 41) > 0.5 ? '#3e6c86' : '#1e4058', 0.6); g.fillRect(Math.floor(hx(i, 2, 41) * w), Math.floor(hx(i, 3, 41) * w), 4 + Math.floor(hx(i, 4, 41) * 14), 1); }
    for (let arm = 0; arm < 9; arm++) {
      g.beginPath();
      for (let k = 0; k <= 64; k++) { const r = 5 + k * 1.9, a = arm / 9 * Math.PI * 2 + Math.log(r) * 2.3; if (k) g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); else g.moveTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
      g.strokeStyle = rgba('#8ab4cc', 0.5); g.lineWidth = 4; g.stroke();
      g.strokeStyle = rgba('#dceef8', 0.45); g.lineWidth = 1; g.stroke();
    }
    const core = g.createRadialGradient(c, c, 0, c, c, 64);
    core.addColorStop(0, '#02060c'); core.addColorStop(0.3, 'rgba(4,14,24,0.9)'); core.addColorStop(1, 'rgba(20,48,68,0)');
    g.fillStyle = core; g.fillRect(0, 0, w, w);
    const edge = g.createRadialGradient(c, c, 92, c, c, 127);
    edge.addColorStop(0, 'rgba(42,80,104,0)'); edge.addColorStop(1, '#2a5068');
    g.fillStyle = edge; g.fillRect(0, 0, w, w);
  });

  const ridgeTex = () => R3.paint('conv|ridge', 512, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(0, h);
    const P = Math.PI * 2 / w;
    for (let x = 0; x <= w; x += 2) g.lineTo(x, h - 4 - 14 * (1 + Math.sin(x * P * 3 + 1)) - 7 * (1 + Math.sin(x * P * 7 + 2)) * (0.6 + 0.4 * Math.sin(x * P * 2)) - 2 * (1 + Math.sin(x * P * 19 + 0.5)));
    g.lineTo(w, h); g.closePath(); g.fill();
  });

  const coinTex = id => R3.paint('conv|coin|' + id, 32, 32, g => { g.clearRect(0, 0, 32, 32); G.itemIcon(g, id, 0, 0, 32); });

  const shoreTex = () => R3.paint('conv|shore', 64, 64, (g, w, h) => {
    g.fillStyle = '#0a1220'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = rgba(hx(i, 1, 91) > 0.5 ? '#1c2a40' : '#060a12', 0.8); g.fillRect(Math.floor(hx(i, 2, 91) * w), Math.floor(hx(i, 3, 91) * h), 4 + Math.floor(hx(i, 4, 91) * 10), 1); }
  });

  const stageTex = () => R3.paint('conv|stage', 128, 128, (g, w) => {
    const c = w / 2;
    g.clearRect(0, 0, w, w);
    g.fillStyle = '#3a0a14'; g.beginPath(); g.arc(c, c, 63, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c8963a'; g.lineWidth = 2;
    for (const r of [61, 50, 26]) { g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke(); }
    g.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      g.beginPath(); g.moveTo(c + Math.cos(a) * 26, c + Math.sin(a) * 26); g.quadraticCurveTo(c + Math.cos(a + 0.26) * 46, c + Math.sin(a + 0.26) * 46, c + Math.cos(a + 0.52) * 26, c + Math.sin(a + 0.52) * 26); g.stroke();
      g.beginPath(); g.moveTo(c + Math.cos(a) * 50, c + Math.sin(a) * 50); g.lineTo(c + Math.cos(a) * 61, c + Math.sin(a) * 61); g.stroke();
    }
    const gr = g.createRadialGradient(c, c, 0, c, c, 16);
    gr.addColorStop(0, '#ff9aa8'); gr.addColorStop(1, '#a02a3a');
    g.fillStyle = gr; g.beginPath(); g.arc(c, c, 14, 0, Math.PI * 2); g.fill();
  });

  const tierTex = () => R3.paint('conv|tier', 64, 64, (g, w, h) => {
    g.fillStyle = '#160810'; g.fillRect(0, 0, w, h);
    for (const y of [6, 28, 50]) {
      g.fillStyle = '#34101a'; g.fillRect(0, y, w, 10);
      g.fillStyle = '#8a6438'; g.fillRect(0, y, w, 1);
      g.fillStyle = '#4a1824'; for (let x = 2; x < w; x += 6) g.fillRect(x, y + 4, 4, 5);
    }
    g.fillStyle = '#0c0408'; g.fillRect(0, 0, 2, h);
  });

  function seaMesh() { return cached('sea', () => { const m = R3.mesh(); R3.grid(m, -80, -80, 80, 80, -0.02, 24, 24, '#2a5068'); return m; }); }

  function poolMesh() { const t = poolTex(); return cached('pool|' + tid(t), () => { const m = R3.mesh(); R3.grid(m, -10, -10, 10, 10, 0, 16, 16, '#ffffff', { tex: t }); return m; }); }

  function hillsMesh() {
    const t = ridgeTex();
    return cached('hills|' + tid(t), () => {
      const m = R3.mesh(), n = 18, r = 46;
      for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
        const u0 = (i % 6) / 6 * t.w, u1 = u0 + t.w / 6;
        R3.quad(m, [Math.sin(a0) * r, -0.5, Math.cos(a0) * r, Math.sin(a1) * r, -0.5, Math.cos(a1) * r, Math.sin(a1) * r, 5.5, Math.cos(a1) * r, Math.sin(a0) * r, 5.5, Math.cos(a0) * r], '#1c2c3a', { tex: t, two: true, uv: [u0, t.h, u1, t.h, u1, 0, u0, 0] });
      }
      return m;
    });
  }

  function flatQuad(key, t, w, h, o = {}) {
    return cached(key + '|' + tid(t) + '|' + w + '|' + h, () => { const m = R3.mesh(); R3.quad(m, [-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0], '#ffffff', Object.assign({ tex: t, two: true }, o)); return m; });
  }

  function figureQuad(look, h) {
    const cv = G.figureCanvas(look, 2), t = R3.tex(cv);
    return cached('fig|' + tid(t) + '|' + h, () => { const w = h * cv.width / cv.height, m = R3.mesh(); R3.quad(m, [-w / 2, 0, 0, w / 2, 0, 0, w / 2, h, 0, -w / 2, h, 0], '#ffffff', { tex: t, two: true }); return m; });
  }

  function shoreMesh() { const t = shoreTex(); return cached('shore|' + tid(t), () => { const m = R3.mesh(); R3.grid(m, -12, -12, 12, 12, 0, 8, 8, '#ffffff', { tex: t, rep: 4 }); return m; }); }

  function stageMesh() {
    const st = stageTex();
    return cached('stage|' + tid(st), () => {
      const m = R3.mesh();
      R3.cyl(m, 0, 0, 0, 3.7, 3.7, 0.3, 28, '#2a0a12', { capCol: '#200a10' });
      R3.cyl(m, 0, 0.3, 0, 3.05, 3.05, 0.36, 28, '#46101a', { cap: false });
      R3.quad(m, [-3.05, 0.67, 3.05, 3.05, 0.67, 3.05, 3.05, 0.67, -3.05, -3.05, 0.67, -3.05], '#ffffff', { tex: st });
      return m;
    });
  }

  function hallMesh() {
    const tt = tierTex();
    return cached('hall|' + tid(tt), () => {
      const m = R3.mesh(), n = 28, r = 15;
      R3.grid(m, -18, -18, 18, 18, 0, 9, 9, '#1a0a10');
      for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
        R3.quad(m, [Math.sin(a0) * r, 0, Math.cos(a0) * r, Math.sin(a1) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 9, Math.cos(a1) * r, Math.sin(a0) * r, 9, Math.cos(a0) * r], '#ffffff', { tex: tt, two: true, uv: [0, tt.h * 2, tt.w, tt.h * 2, tt.w, 0, 0, 0] });
      }
      return m;
    });
  }

  function seatsMesh() {
    return cached('seats', () => {
      const m = R3.mesh();
      R3.grid(m, -7, -4, 7, 12, 0, 7, 8, '#1c0a10');
      for (let row = 0; row < 6; row++) {
        const z = 3.4 + row * 1.1, y = row * 0.3;
        if (y > 0) R3.box(m, 0, y / 2, z, 14, y, 1.1, '#1c0a10');
        for (let i = 1; i <= 4; i++) for (const s of [-1, 1]) {
          const x = s * (0.3 + i * 0.95);
          R3.box(m, x, y + 0.22, z, 0.8, 0.44, 0.62, '#741424', { cols: ['#8a1a2c', '#5a0e1a', '#6a1222', '#6a1222', '#a42638', '#3a0810'] });
          R3.box(m, x, y + 0.78, z + 0.34, 0.82, 0.86, 0.16, '#8a1a2c', { cols: ['#9a2234', '#4a0c16', '#6a1222', '#6a1222', '#b02a3e', '#3a0810'] });
          R3.box(m, x - s * 0.44, y + 0.4, z, 0.08, 0.36, 0.62, '#2a1a20');
        }
      }
      return m;
    });
  }

  function doorMesh() {
    return cached('door', () => {
      const m = R3.mesh();
      R3.box(m, 0, 2.6, -4.8, 9, 5.4, 0.2, '#14060a');
      R3.quad(m, [-0.9, 0.54, -4.6, 0.9, 0.54, -4.6, 0.9, 4.2, -4.6, -0.9, 4.2, -4.6], '#fff4ec', { emit: 1 });
      for (const s of [-1, 1]) R3.quad(m, [s * 0.9, 0.54, -4.55, s * 2.4, 0.54, -4.1, s * 2.3, 4.6, -4.1, s * 0.9, 4.6, -4.55], '#5a0c18', { two: true });
      return m;
    });
  }

  function villageMesh() {
    return cached('village', () => {
      const m = R3.mesh(), wood = '#5a4030';
      R3.grid(m, -18, -18, 18, 18, 0, 9, 9, '#2a2016');
      for (const [x, z, ry, s] of [[-5.6, -4.2, 0.5, 1], [-1.4, -7.2, 0.08, 1.15], [3.8, -5.8, -0.35, 1], [7.2, -1.6, -0.9, 0.9], [-7.6, 0.8, 1.0, 0.95], [6.4, 4.4, -1.8, 0.9]]) {
        const h = R3.mesh(), roof = R3.mesh(), tri = [[-1.45, 0], [1.45, 0], [0, 1.2]];
        R3.box(h, 0, 0.9, 0, 2.6, 1.8, 2.0, '#5a4636');
        R3.loft(roof, tri, -1.12, tri, 1.12, '#2a1c16');
        R3.merge(h, roof, M.t(0, 1.8, 0));
        R3.quad(h, [-0.35, 0.6, 1.01, 0.35, 0.6, 1.01, 0.35, 1.2, 1.01, -0.35, 1.2, 1.01], '#ffb04a', { emit: 1 });
        R3.merge(m, h, M.of(M.t(x, 0, z), M.ry(ry), M.s(s)));
      }
      const x0 = 1.6, x1 = 5.2, z0 = 0.8, z1 = 3.8;
      for (let x = x0; x <= x1 + 0.01; x += 0.6) for (const z of [z0, z1]) R3.box(m, x, 0.4, z, 0.1, 0.8, 0.1, wood);
      for (let z = z0 + 0.6; z < z1 - 0.01; z += 0.6) for (const x of [x0, x1]) R3.box(m, x, 0.4, z, 0.1, 0.8, 0.1, wood);
      for (const y of [0.35, 0.7]) {
        for (const z of [z0, z1]) R3.box(m, (x0 + x1) / 2, y, z, x1 - x0, 0.06, 0.06, '#6a4a34');
        for (const x of [x0, x1]) R3.box(m, x, y, (z0 + z1) / 2, 0.06, 0.06, z1 - z0, '#6a4a34');
      }
      for (const [x, z, ry] of [[2.4, 1.6, 0.3], [3.6, 2.6, -0.6], [4.4, 1.5, 1.2], [2.7, 3.1, 2.4]]) {
        const sh = R3.mesh();
        R3.ell(sh, 0, 0.44, 0, 0.42, 0.3, 0.3, 8, 6, '#e8e2d6');
        R3.box(sh, 0.44, 0.52, 0, 0.2, 0.22, 0.18, '#2a2420');
        for (const [lx, lz] of [[0.2, 0.12], [0.2, -0.12], [-0.2, 0.12], [-0.2, -0.12]]) R3.box(sh, lx, 0.12, lz, 0.06, 0.24, 0.06, '#2a2420');
        R3.merge(m, sh, M.of(M.t(x, 0, z), M.ry(ry)));
      }
      for (let i = 0; i < 4; i++) { const l = R3.mesh(); R3.box(l, 0, 0.1, 0, 1.3, 0.16, 0.16, '#3a2414'); R3.merge(m, l, M.ry(i * Math.PI / 4)); }
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; R3.box(m, Math.cos(a) * 0.95, 0.08, Math.sin(a) * 0.95, 0.24, 0.16, 0.2, '#4a4a50'); }
      return m;
    });
  }

  function fenceMesh() {
    return cached('fence', () => {
      const m = R3.mesh(), col = '#141018';
      R3.grid(m, -14, -10, 14, 4, 0, 6, 4, '#0c0a12');
      for (let i = -6; i <= 6; i++) R3.box(m, i * 0.9, 0.6, 0, 0.12, 1.2, 0.12, col);
      R3.box(m, 0, 1.1, 0, 12, 0.08, 0.08, col);
      R3.box(m, 0, 0.62, 0, 12, 0.08, 0.08, col);
      return m;
    });
  }

  class ConveneShow {
    constructor(ui, res, opts = {}) {
      this.ui = ui; this.res = res; this.game = ui.game; this.ban = opts.ban || 'conv';
      const B = H.BANNERS[this.ban];
      this.pass = (B && B.pass) || 'rtide';
      this.best = Math.max(...res.map(r => r.rar));
      this.R = new R3.Raster(LW, LH);
      this.phase = 'cine'; this.t = 0; this.cue = 0; this.rt = 0;
      this.queue = []; this.cur = -1; this.seen = new Set(); this.fade = 0; this.done = false; this.hop = 0; this.rc = [];
      this.cues = this.cueList();
      for (const r of res) if (r.kind === 'char' && CUTS[r.id]) warm(G.lookOf(r.id, this.game));
    }

    cueList() {
      const c = shotStart('comet'), v = shotStart('vortex');
      const list = [[0.05, 'rumble'], [0.45, 'ticket'], [1.22, 'splash'], [c + 0.05, 'whoosh'], [c + SHIFT, this.best >= 4 ? 'star4' : 'glint'], [v + 0.45, 'break'], [shotStart('flash'), this.best === 5 ? 'star5' : this.best === 4 ? 'star4' : 'chest']];
      return list.sort((a, b) => a[0] - b[0]);
    }

    item() { return this.res[this.cur]; }

    waveLen(r) { return r.rar === 5 ? 1.3 : 0.9; }

    length(r) {
      if (r.kind !== 'char') return r.rar === 5 ? 2.2 : r.rar === 4 ? 1.7 : 1.3;
      return this.waveLen(r) + (CUTS[r.id] ? total(CUTS[r.id]) + 0.6 : r.rar === 5 ? 1.8 : 1.5);
    }

    intro() { return this.hop + this.length(this.item()); }

    revealCues(r) {
      if (r.kind !== 'char') return [[0.28, 'break_obj'], [0.42, r.rar === 5 ? 'star5' : r.rar === 4 ? 'star4' : 'glint']];
      const pre = this.waveLen(r), list = [[0.05, 'glint'], [0.45, 'ticket'], [r.rar === 5 ? 0.85 : 0.7, r.rar === 5 ? 'star5' : 'star4']];
      if (CUTS[r.id]) for (const [x, id] of CUT_SFX[r.id]) list.push([pre + x, id]);
      else list.push([pre, 'whoosh']);
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

    sea(R, eye, at, fov, T) {
      R.light({ amb: [1, 1, 1], sun: null });
      R.look(eye, at, fov);
      R.clear('#08121e', '#24384a');
      R.stars(50, 12, 0.3);
      const fx = at[0] - eye[0], fz = at[2] - eye[2], fl = Math.hypot(fx, fz) || 1, hp = R.project([eye[0] + fx / fl * 400, 0, eye[2] + fz / fl * 400]);
      if (hp) R.haze(hp[1] - 60, hp[1] + 2, '#4a6a80', 1);
      R.draw(hillsMesh(), M.id(), { lit: false });
      R.light({ amb: [1, 1, 1], sun: null, fog: { near: 9, far: 40, col: R3.rgb('#56788e'), max: 0.92 } });
      R.draw(seaMesh(), M.id(), { lit: false, zw: false });
      R.draw(poolMesh(), M.ry(-T * 0.7), { lit: false });
    }

    tideCam(t) {
      const k = sm(t / 1.9), a = lerp(0.62, 0.18, k), r = lerp(9.4, 6.2, k), h = lerp(2.9, 2.2, k);
      return [[Math.sin(a) * r, h, Math.cos(a) * r], [0, lerp(0.3, -0.2, k), 0]];
    }

    tide(R, g, t, T) {
      const [eye, at] = this.tideCam(t);
      this.sea(R, eye, at, 50, T);
      const fall = seg(t, 0.15, 1.1), y = lerp(3.2, 0.1, fall * fall);
      if (t < 1.12) {
        for (let j = 1; j < 8; j++) R.glow([Math.sin(j * 1.7) * 0.06, y + j * 0.18, Math.cos(j * 1.3) * 0.06], 0.03, '#ffe8b0', { a: 0.8 * (1 - j / 8), shape: 'star', depth: false });
        R.glow([0, y, 0], 0.6, '#ffe2a0', { a: 0.55, depth: false });
        R.draw(flatQuad('coin', coinTex(this.pass), 1, 1), M.of(M.t(0, y, 0), M.ry(T * 7), M.s(0.8)), { lit: false });
      }
      const hit = seg(t, 1.1, 1.4);
      if (hit > 0 && hit < 1) {
        R.glow([0, 0.1, 0], 0.7, '#ffffff', { a: 0.8 * (1 - hit), depth: false });
        for (let k = 0; k < 2; k++) {
          const rr = (0.3 + hit * 3.2) * (1 - k * 0.4);
          for (let i = 0; i < 28; i++) { const a0 = i / 28 * Math.PI * 2, a1 = (i + 1) / 28 * Math.PI * 2; R.streak([Math.cos(a0) * rr, 0.03, Math.sin(a0) * rr], [Math.cos(a1) * rr, 0.03, Math.sin(a1) * rr], 0.05, '#cfeaff', '#cfeaff', { world: true, depth: false, a: 0.8 * (1 - hit) }); }
        }
      }
      R.bake();
      K.vignette(g, 0.55);
    }

    dive(R, g, t, T) {
      const [e0, a0] = this.tideCam(1.4), k = sm(t / 0.5);
      this.sea(R, lerp3(e0, [0.05, 0.35, 0.25], k * k), lerp3(a0, [0, -3, 0], k), lerp(50, 74, k), T);
      R.bake();
      const s = seg(t, 0.12, 0.5);
      if (s > 0) {
        lighter(g, () => {
          for (let i = 0; i < 26; i++) {
            const a = i / 26 * Math.PI * 2 + hx(i, 1, 51) * 0.3, len = lerp(20, 240, eOut(s)) * (0.6 + 0.4 * hx(i, 2, 51)), wd = 0.06 + 0.08 * hx(i, 3, 51);
            poly(g, rgba(i % 3 ? '#9ad0f0' : '#ffffff', 0.5 * (1 - s * 0.5)), [CX + Math.cos(a - wd) * 10, CY + Math.sin(a - wd) * 8, CX + Math.cos(a) * len, CY + Math.sin(a) * len * 0.8, CX + Math.cos(a + wd) * 10, CY + Math.sin(a + wd) * 8]);
          }
        });
        K.shards(g, s, CX, CY, 30, 52, '#bfe4ff', 160, '#ffffff');
      }
      K.flash(g, '#ffffff', seg(t, 0.3, 0.5));
    }

    cometCol(t) { return mixc('#dcecff', RCOL[this.best], seg(t, SHIFT, SHIFT + 0.3)); }

    cometPos(u) {
      const v = Math.max(0, u), q = Math.pow(1 - Math.min(1, v), 2), back = Math.min(0, u);
      return [0.03 + 1.7 * q - back * 1.2, 0.04 - 1.25 * q + back * 0.9, -1.4 - 30 * Math.pow(v, 1.25) - back * 4];
    }

    space(R, T) {
      R.light({ amb: [1, 1, 1], sun: null });
      R.look([0, 0, 0], [0, 0, -1], 58);
      R.clear('#02040a', '#0a1222');
      R.stars(150, 23, 0.6, T * 6);
    }

    comet(R, g, t, T) {
      this.space(R, T);
      const u = t / 1.8 * 0.8 + 0.06, col = this.cometCol(t), hot = mixc('#ffffff', col, 0.3);
      for (let j = 0; j < 16; j++) {
        const f = 1 - j / 16, a = this.cometPos(u - j * 0.03), b = this.cometPos(u - (j + 1) * 0.03);
        R.streak(a, b, 0.07 + j * 0.03, col, col, { world: true, depth: false, a: 0.25 * f });
        R.streak(a, b, 0.02 + j * 0.011, mixc(hot, col, j / 16), col, { world: true, depth: false, a: f });
      }
      for (let j = 0; j < 22; j++) {
        const p = this.cometPos(u - 0.02 - j * 0.022), jit = j / 22;
        p[0] += (hx(j, 1, 81) - 0.5) * 0.14 * jit; p[1] += (hx(j, 2, 81) - 0.5) * 0.14 * jit;
        R.glow(p, 0.014, col, { a: (1 - jit) * 0.8 * (0.5 + 0.5 * Math.sin(T * 30 + j)), shape: 'star', depth: false });
      }
      const head = this.cometPos(u);
      R.glow(head, 0.16, col, { a: 0.6, depth: false });
      R.glow(head, 0.05, '#ffffff', { a: 1, depth: false });
      R.bake();
      lighter(g, () => {
        g.strokeStyle = rgba('#9ab8e0', 0.14); g.lineWidth = 1;
        for (const [r, a] of [[150, 0.2], [214, -0.3]]) { g.beginPath(); g.ellipse(CX + 30, CY - 20, r, r * 0.8, a + T * 0.05, 0.2, Math.PI * 1.3); g.stroke(); }
      });
      K.speedLines(g, T, CX, CY, 18, '#a8c8f0', 0.25, 40);
      const bloom = seg(t, 1.35, 1.8);
      if (bloom > 0) blit(g, cloudRing(this.best, true), CX, CY, lerp(0.1, 0.35, bloom), T * 0.3, bloom * 0.9);
    }

    vortex(R, g, t, T) {
      this.space(R, T);
      R.bake();
      const rar = this.best, col = RCOL[rar], hot = RHOT[rar], lit = seg(t, 0.25, 0.9);
      blit(g, cloudRing(rar, true), CX, CY, lerp(0.35, 2.2, eOut(seg(t, -0.4, 0.8))), T * 0.25, (1 - lit * 0.8) * 0.95);
      for (let i = 0; i < 7; i++) {
        const d = ((i / 7) + t * 0.42) % 1, a = lit * Math.sin(Math.PI * d) * 0.85;
        blit(g, cloudRing(rar, false), CX, CY, lerp(0.3, 3.4, d * d), T * (0.5 + i * 0.07) * (i % 2 ? 1 : -1) + i * 1.3, a, i % 2 ? 'lighter' : null);
      }
      const ci = seg(t, 0, 0.5);
      if (ci > 0 && ci < 1) {
        const k = eOut(ci), px = lerp(-20, CX, k), py = lerp(196, CY, k), l = Math.hypot(CX + 20, CY - 196), ux = (CX + 20) / l, uy = (CY - 196) / l, len = 120 * (1 - k * 0.6);
        lighter(g, () => {
          const gr = g.createLinearGradient(px, py, px - ux * len, py - uy * len);
          gr.addColorStop(0, rgba(hot, 0.95)); gr.addColorStop(1, rgba(col, 0));
          g.fillStyle = gr;
          g.beginPath(); g.moveTo(px, py); g.lineTo(px - ux * len - uy * 5, py - uy * len + ux * 5); g.lineTo(px - ux * len + uy * 5, py - uy * len - ux * 5); g.closePath(); g.fill();
          glow(g, px, py, 10, hot, 0.9);
        });
      }
      const b = seg(t, 0.5, 0.95), core = seg(t, 0.5, 1.6);
      lighter(g, () => {
        if (b > 0 && b < 1) { ring(g, rgba(hot, 1 - b), 2, CX, CY, 4 + b * 70); ring(g, rgba(col, (1 - b) * 0.6), 4, CX, CY, b * 50); }
        g.lineWidth = 1;
        for (let k = 0; k < 3; k++) { g.strokeStyle = rgba(hot, 0.35 * lit); g.beginPath(); g.ellipse(CX, CY, 40 + k * 28, 14 + k * 8, -0.4 + T * 0.8 + k, 0, Math.PI * 1.2); g.stroke(); }
        glow(g, CX, CY, 10 + 40 * core, hot, 0.5 + 0.5 * core);
        star4(g, CX, CY, 6 + 30 * eOut(seg(t, 0.6, 1.6)), '#ffffff', 0.9);
      });
    }

    flashShot(R, g, t, T) {
      this.vortex(R, g, 1.6 + t * 0.6, T);
      const k = seg(t, 0, 0.38);
      lighter(g, () => { glow(g, CX, CY, 60 + 200 * k, RHOT[this.best], 0.8); star4(g, CX, CY, 40 + 260 * eOut(k), RHOT[this.best], 0.9, 0.12); });
      K.flash(g, '#ffffff', eOut(k));
    }

    hopShot(g, t) {
      rect(g, '#000000', 0, 0, LW, LH);
      const k = seg(t, 0, HOP);
      lighter(g, () => {
        g.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const q = seg(k, i * 0.15, 0.7 + i * 0.15);
          if (q > 0 && q < 1) { g.strokeStyle = rgba('#9ad0ff', (1 - q) * 0.7); g.beginPath(); g.ellipse(CX, CY, q * 190, q * 70, 0, 0, Math.PI * 2); g.stroke(); }
        }
        K.hgrad(g, 0, LW, CY - 1, CY + 1, [[0, rgba('#9ad0ff', 0)], [0.5, rgba('#ffffff', 0.9 * (1 - k))], [1, rgba('#9ad0ff', 0)]]);
      });
    }

    waveShot(g, r, t, T) {
      rect(g, '#000000', 0, 0, LW, LH);
      const rar = r.rar, col = RCOL[rar], hot = RHOT[rar], grow = eOut(seg(t, 0.05, 0.42)), half = 92 * grow;
      lighter(g, () => {
        if (half > 2) {
          for (const [wd, a, c] of [[3, 0.25, col], [1, 0.95, hot]]) {
            g.strokeStyle = rgba(c, a); g.lineWidth = wd; g.beginPath();
            for (let x = -half; x <= half; x += 2) {
              const e = 1 - Math.abs(x) / (half + 1), spike = Math.exp(-x * x / 30) * 16 + Math.exp(-Math.pow(((x + 300) % 13) - 6.5, 2) / 3) * 3 * e;
              const y = CY + Math.sin(x * 0.9 + T * 26) * spike * e * 0.5;
              if (x === -half) g.moveTo(CX + x, y); else g.lineTo(CX + x, y);
            }
            g.stroke();
          }
          star4(g, CX, CY, 4 + 18 * grow, hot, 0.9, 0.08);
        }
        for (let i = 0; i < rar; i++) {
          const p = eOut(seg(t, 0.45 + i * 0.07, 0.6 + i * 0.07)), x = CX + (i - (rar - 1) / 2) * 13;
          if (p <= 0) continue;
          glow(g, x, CY, 10 * p, col, 0.6);
          star4(g, x, CY, 6 * p, hot, 1, 0.22);
        }
        const s = rar === 5 ? seg(t, 0.85, 1.3) : 0;
        if (s > 0 && s < 1) {
          const rr = 12 + 150 * eOut(s), a = 1 - s;
          RAINBOW.forEach((h, k) => ring(g, rgba(h, 0.22 * a), 2, CX, CY, rr + 6 + k * 2));
          ring(g, rgba('#ffffff', a), 1.5, CX, CY, rr);
          for (let k = 0; k < 72; k++) {
            const ang = k / 72 * Math.PI * 2, l = 4 + 14 * hx(k, Math.floor(T * 12), 7), r0 = rr * 0.7;
            line(g, rgba(hot, 0.5 * a), 1, CX + Math.cos(ang) * r0, CY + Math.sin(ang) * r0, CX + Math.cos(ang) * (r0 + l), CY + Math.sin(ang) * (r0 + l));
          }
          glow(g, CX, CY, 60 * a + 10, '#ffffff', 0.8 * a);
        }
      });
    }

    shore(R, g, r, t, T) {
      const look = G.lookOf(r.id, this.game), col = RCOL[r.rar], k = sm(t / 2.4);
      R.light({ amb: [1, 1, 1], sun: null, fog: { near: 3, far: 13, col: R3.rgb('#0c1424'), max: 0.95 } });
      R.look([lerp(-1.4, -0.8, k), lerp(0.55, 0.95, k), lerp(3.0, 3.9, k)], [-0.45, lerp(1.1, 1.0, k), 0], 46);
      R.clear('#04060c', '#0c1424');
      R.stars(80, 37, 0.4);
      R.draw(figureQuad(look, 2.0), M.s(1, -1, 1), { lit: false, mode: 'alpha', alpha: 0.3, tint: '#6080b0' });
      R.draw(shoreMesh(), M.id(), { lit: false, mode: 'alpha', alpha: 0.85 });
      const pts = [];
      for (let i = 0; i <= 26; i++) { const x = -4 + i * 0.32; pts.push([x, 0.08 + 0.22 * Math.sin(x * 1.3 + T * 2.2) + 0.12 * Math.sin(x * 3.1 - T * 3), -1.0 - 0.2 * Math.cos(x)]); }
      for (let i = 0; i < pts.length - 1; i++) {
        R.streak(pts[i], pts[i + 1], 0.12, col, col, { world: true, a: 0.22 });
        R.streak(pts[i], pts[i + 1], 0.035, RHOT[r.rar], RHOT[r.rar], { world: true, a: 0.9 });
      }
      R.glow([0, 1.25, -0.5], 1.3, col, { a: 0.3 * seg(t, 0, 0.5), depth: false });
      R.draw(figureQuad(look, 2.0), M.id(), { lit: false });
      R.bake();
      lighter(g, () => {
        for (let i = 0; i < 18; i++) { const ph = (T * 0.25 + hx(i, 1, 93)) % 1; rect(g, rgba(col, Math.sin(Math.PI * ph) * 0.8), Math.round(60 + hx(i, 2, 93) * 200), Math.round(200 - ph * 160), hx(i, 3, 93) > 0.7 ? 2 : 1, 1); }
      });
      K.vignette(g, 0.6);
      K.flash(g, '#ffffff', 0.8 * (1 - seg(t, 0, 0.25)));
    }

    coneScene(R, g, r, t, T) {
      const rar = r.rar, col = RCOL[rar];
      R.light({ amb: [1, 1, 1], sun: null });
      R.look([0, 0, 4.4], [0, 0, 0], 46);
      R.clear('#050816', '#1a2442', '#0c1226');
      R.stars(120, 51, 0.55, T * 3);
      for (let i = 0; i < 6; i++) R.flat(40 + hx(i, 1, 95) * 240, 30 + hx(i, 2, 95) * 180, 40 + hx(i, 3, 95) * 40, i % 2 ? '#2a3a70' : R3.rgb(col).map(v => v * 0.35), { shape: 'puff', a: 0.35 });
      for (let w = 0; w < 2; w++) for (let i = 0; i < 24; i++) {
        const f = x => [x, 0.35 * Math.sin(x * (0.9 + w * 0.4) + T * (1 + w * 0.6) + w * 2) + (w ? -0.2 : 0.15), -1.6];
        R.streak(f(-4 + i / 3), f(-4 + (i + 1) / 3), 0.03, w ? '#d8e8ff' : col, w ? '#d8e8ff' : col, { world: true, a: 0.6 * Math.sin(Math.PI * i / 24) });
      }
      const bub = seg(t, 0, 0.3);
      if (t < 0.34) {
        const s = 0.5 + 0.55 * eOut(bub);
        R.glow([0.9, 0, 0.3], s * 0.95, '#6aa0d8', { a: 0.25, depth: false });
        R.glow([0.9, 0, 0.3], s, '#cfe8ff', { shape: 'ring', a: 0.9, depth: false });
        R.glow([0.9 - s * 0.35, s * 0.4, 0.4], s * 0.2, '#ffffff', { a: 0.6, depth: false });
      }
      const show = seg(t, 0.28, 0.6);
      let mat = null;
      if (show > 0) {
        R.glow([0.9, 0, -0.4], 1.5, col, { a: 0.45 * show, depth: false });
        mat = M.of(M.t(0.9, 0.04 * Math.sin(T * 1.6), 0), M.rz(-0.5), M.ry(0.3 * Math.sin(T * 0.9)), M.s(lerp(0.7, 1, eOut(show))));
        R.draw(flatQuad('cone', R3.tex(G.coneArt(r.id, 72, 100)), 1.1, 1.53), mat, show < 1 ? { lit: false, mode: 'alpha', alpha: show } : { lit: false });
      }
      R.bake();
      if (t > 0.28 && t < 1.0) { const bp = R.project([0.9, 0, 0.3]); if (bp) K.shards(g, seg(t, 0.28, 1.0), bp[0], bp[1], 24, 97, '#bfe4ff', 120, '#ffffff'); }
      if (mat) {
        const tip = R.project(M.pt(mat, 0.5, 0.72, 0));
        if (tip) lighter(g, () => star4(g, tip[0], tip[1], 7 + 3 * Math.sin(T * 7), RHOT[rar], 0.8 * show, 0.12));
      }
      if (t > 0.28 && t < 0.45) K.flash(g, '#ffffff', 0.5 * (1 - seg(t, 0.28, 0.45)));
    }

    cutShot(R, g, r, t, T) {
      const look = G.lookOf(r.id, this.game), [n, lt] = pick(CUTS[r.id], t);
      if (r.id === 'kazuma') {
        if (n === 'wash') this.kazWash(g, lt, T, look);
        else if (n === 'scan') this.kazScan(g, lt, T, look);
        else if (n === 'echo') this.kazEcho(g, lt, T, look);
        else if (n === 'steal') H.ExplosionKit.beat(g, this.game, 'kazuma', 'steal', lt * 0.8 / 0.9, T);
        else if (n === 'catch') this.kazCatch(g, lt, T, look);
        else this.kazPose(g, lt, T, look);
      } else if (r.id === 'phrolova') {
        if (n === 'lily') this.lilyShot(g, lt, T);
        else if (n === 'hall') this.hallShot(R, g, lt, T, look);
        else if (n === 'baton') this.batonShot(g, lt, T);
        else if (n === 'lines') this.linesShot(g, lt, T, look);
        else if (n === 'face') this.faceShot(g, lt, T, look);
        else if (n === 'seats') this.seatsShot(R, g, lt, T, look);
        else this.phroPose(g, lt, T, look);
      } else if (n === 'book') this.bookShot(g, lt, T);
      else if (n === 'fire') this.fireShot(R, g, lt, T);
      else if (n === 'fence') this.fenceShot(R, g, lt, T, look);
      else if (n === 'dome') this.domeShot(g, lt, T, look);
      else if (n === 'shadow') this.shadowShot(g, lt, T, look);
      else this.scarPose(g, lt, T, look);
      if (lt < 0.12 && t > 0.2) K.flash(g, '#000000', 1 - lt / 0.12);
    }

    lilyShot(g, t, T) {
      vgrad(g, 0, LH, [[0, '#2a060c'], [0.5, '#5a1220'], [1, '#2a060c']]);
      lighter(g, () => { for (let i = 0; i < 8; i++) glow(g, hx(i, 1, 101) * LW, hx(i, 2, 101) * LH, 36 + hx(i, 3, 101) * 50, i % 2 ? '#c02a3a' : '#8a1a2a', 0.35); });
      const z = lerp(1, 1.55, sm(t / 0.8));
      lily(g, 262 - 40 * t, 52 + 10 * t, 66 * z, -0.7 + t * 0.25, '#8a1424', '#e0505e', 0.75);
      lily(g, 60 + 20 * t, 196, 50 * z, 1.2 - t * 0.3, '#7a1222', '#c84a58', 0.6);
      lily(g, 150 - 20 * t, 124, 118 * z, 0.25 + t * 0.4, '#e01e32', '#ff96a2', 1);
      for (let i = 0; i < 16; i++) { const ph = (T * 0.4 + hx(i, 4, 101)) % 1; ell(g, rgba(i % 3 ? '#ff4a5e' : '#ffb0b8', 0.85), (hx(i, 5, 101) * 360 + ph * 60) % LW, ph * LH, 3, 1.2, T * 3 + i); }
      const w = seg(t, 0.55, 0.8);
      if (w > 0) { g.save(); g.globalAlpha = 0.35; for (let i = 1; i <= 4; i++) g.drawImage(g.canvas, -i * 14 * w, 0); g.restore(); K.flash(g, '#ff7a8a', 0.5 * w); }
    }

    hallShot(R, g, t, T, look) {
      const k = sm(t / 0.9);
      R.light({ amb: [0.32, 0.22, 0.28], sun: null, pts: [{ p: [0, 5, 0], r: 10, c: [1.3, 1.05, 1.1] }], fog: { near: 9, far: 24, col: [12, 4, 8], max: 0.8 } });
      R.look([0, lerp(5.4, 4.0, k), lerp(12.6, 9.8, k)], [0, 1.0, 0], 46);
      R.clear('#08030a', '#1a0a10');
      R.draw(hallMesh(), M.id());
      R.draw(stageMesh(), M.id());
      for (let i = 0; i < 10; i++) { const a = Math.PI * (0.55 + i * 0.09), rr = 5.4 + hx(i, 1, 103) * 2.2; R.glow([Math.sin(a) * rr * (i % 2 ? 1 : -1), 0.3, Math.cos(a) * rr], 1.1, '#5a2a8a', { a: 0.45, shape: 'puff' }); }
      R.draw(figureQuad(look, 1.15), M.t(0, 0.67, 0), { lit: false });
      R.glow([0, 0.75, 0], 0.9, '#ff9ab0', { a: 0.35, depth: false });
      R.bake();
      for (let i = 0; i < 12; i++) {
        const s = i % 2 ? 1 : -1, p = R.project([s * (4.2 + hx(i, 2, 103) * 3), 0.25, -0.5 - hx(i, 3, 103) * 5]);
        if (p) lily(g, p[0], p[1], 0.55 * R.fl / p[2], T * 0.3 + i, '#5a2a8a', '#b07aff', 0.85);
      }
      const p0 = R.project([0, 10, 0]), p1 = R.project([0, 0.67, 0]);
      if (p0 && p1) lighter(g, () => {
        const w0 = 0.35 * R.fl / p0[2], w1 = 1.1 * R.fl / p1[2], gr = g.createLinearGradient(0, p0[1], 0, p1[1]);
        gr.addColorStop(0, rgba('#ffe8f0', 0.05)); gr.addColorStop(1, rgba('#ffe0ea', 0.35));
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(p0[0] - w0, p0[1]); g.lineTo(p0[0] + w0, p0[1]); g.lineTo(p1[0] + w1, p1[1]); g.lineTo(p1[0] - w1, p1[1]); g.closePath(); g.fill();
        ell(g, rgba('#ffd0dc', 0.35), p1[0], p1[1], w1, w1 * 0.3);
      });
      K.vignette(g, 0.5);
    }

    batonShot(g, t, T) {
      vgrad(g, 0, LH, [[0, '#0c060a'], [1, '#26101a']]);
      lighter(g, () => { for (let i = 0; i < 12; i++) glow(g, hx(i, 1, 105) * LW, hx(i, 2, 105) * LH, 4 + hx(i, 3, 105) * 8, '#ff9a6a', 0.3); });
      const a0 = Math.PI + 0.42 + Math.sin(t * 2.4) * 0.04 - t * 0.08, sx = 372, sy = 236, L = 262;
      const dx = Math.cos(a0), dy = Math.sin(a0), nx = -dy, ny = dx, wx = sx + dx * L, wy = sy + dy * L, th = d => lerp(26, 11, d / L);
      const side = (d, k) => [sx + dx * d + nx * th(d) * k, sy + dy * d + ny * th(d) * k];
      lighter(g, () => glow(g, wx + 30, wy - 20, 90, '#ff8a9a', 0.18));
      poly(g, '#3a1018', [...side(0, 1.12), ...side(L, 1.15), ...side(L, -1.15), ...side(0, -1.12)]);
      poly(g, '#cdc6d8', [...side(0, 1), ...side(L, 1), ...side(L, -1), ...side(0, -1)]);
      poly(g, '#f4f0fa', [...side(0, 1), ...side(L, 1), ...side(L, 0.1), ...side(0, 0.2)]);
      for (let d = 6; d < L - 4; d += 7) line(g, rgba('#a8a0b8', 0.5), 1, ...side(d, 0.95), ...side(d + 3, -0.95));
      for (let d = 14; d < L - 16; d += 21) {
        line(g, '#a8102a', 2.5, ...side(d, 1.02), ...side(d + 14, -1.02));
        line(g, '#d8203a', 2.5, ...side(d, -1.02), ...side(d + 14, 1.02));
      }
      const skin = '#f4dcd2', edge = '#9a6458', px = wx + dx * 9, py = wy + dy * 9;
      g.save(); g.lineCap = 'round';
      ell(g, edge, px, py, 12.5, 9, a0);
      ell(g, skin, px, py, 11.5, 8, a0);
      for (let f = 0; f < 4; f++) {
        const bx = px + dx * 7 + nx * (f - 1.5) * 4.2, by = py + dy * 7 + ny * (f - 1.5) * 4.2, fa = a0 + (f - 1.5) * 0.17 + 0.12, fl = 16 - Math.abs(f - 1.2) * 2.2;
        const mx = bx + Math.cos(fa) * fl * 0.55, my = by + Math.sin(fa) * fl * 0.55, ex = mx + Math.cos(fa + 0.25) * fl * 0.45, ey = my + Math.sin(fa + 0.25) * fl * 0.45;
        for (const [w, c] of [[3.6, edge], [2.5, skin]]) { line(g, c, w, bx, by, mx, my); line(g, c, w, mx, my, ex, ey); }
      }
      for (const [w, c] of [[3.8, edge], [2.7, skin]]) line(g, c, w, px - nx * 6, py - ny * 6, px - nx * 6 + Math.cos(a0 - 0.8) * 11, py - ny * 6 + Math.sin(a0 - 0.8) * 11);
      g.restore();
      for (let p = 0; p < 6; p++) { const pa = p / 6 * Math.PI * 2 + T * 0.5; ell(g, '#b8b0c8', wx + Math.cos(pa) * 6, wy + Math.sin(pa) * 6, 4.4, 2.8, pa); ell(g, '#fbf8ff', wx + Math.cos(pa) * 6, wy + Math.sin(pa) * 6, 3.6, 2.2, pa); }
      ell(g, '#d8203a', wx, wy, 2.5, 2.5);
      const bk = seg(t, 0.35, 0.9);
      if (bk > 0) {
        const tip = s => { const a = lerp(-1.9, -2.6, eOut(cl(s))); return [380 + Math.cos(a) * 210, 300 + Math.sin(a) * 210]; };
        const [tx, ty] = tip(bk);
        lighter(g, () => { for (let j = 1; j < 12; j++) { const [ax, ay] = tip(bk - j * 0.035); glow(g, ax, ay, 7 - j * 0.4, '#ff2a4a', 0.5 * (1 - j / 12)); } });
        line(g, '#4a0a14', 2, 380, 300, tx, ty);
        lighter(g, () => glow(g, tx, ty, 16, '#ff2a4a', 0.85));
        lily(g, tx, ty, 10, T * 3, '#ff2a40', '#ffb0c0', 1);
      }
    }

    linesShot(g, t, T, look) {
      rect(g, '#060205', 0, 0, LW, LH);
      lighter(g, () => { glow(g, 40, 210, 140, '#a0101e', 0.7); glow(g, 290, 30, 120, '#900c1a', 0.6); });
      g.save(); g.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const y0 = hx(i, 1, 107) * LH, ph = T * (0.8 + i * 0.1) + i;
        g.strokeStyle = rgba(i % 2 ? '#c0101e' : '#e0283a', 0.85); g.lineWidth = 4 + hx(i, 2, 107) * 10;
        g.beginPath(); g.moveTo(-20, y0); g.bezierCurveTo(90, y0 + Math.sin(ph) * 90, 220, y0 - Math.cos(ph) * 100, 340, y0 + Math.sin(ph * 1.3) * 60); g.stroke();
      }
      g.restore();
      const art = lineArt(G.bustCanvas(look, 128)), s = lerp(1.9, 2.1, sm(t / 0.8)), w = art.width, h = art.height;
      g.save();
      g.imageSmoothingEnabled = false;
      g.translate(176, 262); g.rotate(-0.16 + t * 0.06); g.scale(s, s);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55;
      g.drawImage(K.tinted(art, '#ff2050', 1), -w / 2 - 2, -h);
      g.drawImage(K.tinted(art, '#30d0ff', 1), -w / 2 + 2, -h);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.drawImage(art, -w / 2, -h);
      g.restore();
      K.glitch(g, T, 0, 0, LW, LH, 0.25 * seg(t, 0.5, 0.8), 7);
    }

    faceShot(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#12050a'], [1, '#34101a']]);
      lighter(g, () => { glow(g, 260, 50, 170, '#ff2a4a', 0.4); glow(g, 40, 220, 120, '#7a1a6a', 0.3); });
      bust(g, look, 150, 272 + 12 * t, 128, lerp(2.2, 2.45, sm(t / 0.9)), { rim: '#ff4a6a' });
      lighter(g, () => glow(g, 214, 186, 52, '#ff2050', 0.55 + 0.2 * Math.sin(T * 5)));
      lily(g, 214, 186, 30 + 3 * Math.sin(T * 3), T * 0.4, '#e01a30', '#ff9aa8', 1);
      for (let i = 0; i < 10; i++) { const ph = (T * 0.3 + hx(i, 1, 109)) % 1; ell(g, rgba('#ff5a6a', 0.8), (hx(i, 2, 109) * LW + T * 10) % LW, LH - ph * LH, 2.4, 1, T + i); }
      K.vignette(g, 0.6);
    }

    seatsShot(R, g, t, T, look) {
      const k = sm(t / 1.0);
      R.light({ amb: [0.28, 0.16, 0.2], sun: null, pts: [{ p: [0, 3.2, -3.0], r: 13, c: [1.4, 1.15, 1.1] }], fog: { near: 6, far: 20, col: [16, 6, 10], max: 0.6 } });
      R.look([lerp(0.7, 0.25, k), lerp(3.7, 3.4, k), lerp(11.6, 10.6, k)], [0, 1.3, -3], 48);
      R.clear('#0a0408', '#1c0a10');
      R.draw(seatsMesh(), M.id());
      R.draw(stageMesh(), M.of(M.t(0, 0, -3), M.s(0.8)));
      R.draw(doorMesh(), M.id());
      R.glow([0, 2.4, -4.4], 2.2, '#fff0e0', { a: 0.5, depth: false });
      R.draw(figureQuad(look, 1.2), M.t(0, 0.54, -3), { lit: false, tint: '#5a3a44' });
      R.bake();
      for (let i = 0; i < 7; i++) {
        const p = R.project([(i % 2 ? 1 : -1) * (1.4 + hx(i, 1, 111) * 2.5), 1.3 + hx(i, 2, 111) * 0.6 + i * 0.06, 3.6 + hx(i, 3, 111) * 4.5]), bloom = eOut(seg(t, 0.15 + i * 0.07, 0.55 + i * 0.07));
        if (!p || bloom <= 0) continue;
        const r = 0.75 * R.fl / p[2] * bloom;
        lighter(g, () => glow(g, p[0], p[1], r * 1.6, '#ff2a40', 0.45));
        lily(g, p[0], p[1], r, T * 0.5 + i, '#e01830', '#ff8a9a', 1);
      }
      for (let i = 0; i < 14; i++) { const ph = (T * 0.35 + hx(i, 4, 111)) % 1; ell(g, rgba('#ff4a5e', 0.85), (hx(i, 5, 111) * LW + ph * 40) % LW, ph * LH, 2.4, 1, T * 2 + i); }
      K.vignette(g, 0.5);
    }

    phroPose(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#0e050a'], [0.6, '#260a14'], [1, '#3a1220']]);
      lighter(g, () => { poly(g, rgba('#ffe8d8', 0.9), [6, 0, 40, 0, 64, LH, 0, LH]); glow(g, 30, 110, 140, '#ffd0b8', 0.45); });
      g.save(); g.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const cy = 30 + i * 30, rx = 150 - i * 8;
        g.strokeStyle = '#3a0c16'; g.lineWidth = 9 - i * 0.6; g.beginPath(); g.ellipse(262, cy, rx, 42, 0.42, Math.PI * 0.92, Math.PI * 1.62); g.stroke();
        g.strokeStyle = rgba('#a03040', 0.6); g.lineWidth = 1.5; g.beginPath(); g.ellipse(262, cy - 3, rx, 42, 0.42, Math.PI * 0.95, Math.PI * 1.55); g.stroke();
      }
      g.restore();
      line(g, '#2a0810', 12, 300, -10, 316, LH);
      for (let i = 0; i < 20; i++) { const ph = (T * 0.25 + hx(i, 1, 121)) % 1; ell(g, rgba(i % 3 ? '#d01a30' : '#ff7a8a', 0.9), (hx(i, 2, 121) * LW + T * 12 * (0.5 + hx(i, 3, 121))) % LW, ph * LH, 2.6, 1.1, T * 2 + i); }
      const bob = Math.sin(T * 1.6) * 2;
      rimFigure(g, look, 196, 250 + bob, 3, '#ff5a78', { s: 0.86 });
      lighter(g, () => glow(g, 136, 66 + bob, 26, '#ff2a4a', 0.75 + 0.15 * Math.sin(T * 6)));
      lily(g, 136, 66 + bob, 12, T * 1.2, '#ff2a40', '#ffc0c8', 1);
      K.vignette(g, 0.5);
    }

    bookShot(g, t, T) {
      const z = lerp(1, 1.08, sm(t / 1.1));
      g.save(); g.translate(CX, CY); g.scale(z, z); g.translate(-CX, -CY); g.drawImage(bookPage(), 0, 0); g.restore();
      const thr = lerp(-0.05, 1.05, seg(t, 0.4, 1.1));
      if (thr > -0.05) { burn(g, thr, T); K.embers(g, T, 20, 9, 0, LW, LH, '#ffa040'); }
    }

    fireShot(R, g, t, T) {
      const k = sm(t / 0.9), fl = 0.85 + 0.15 * Math.sin(T * 17) * Math.sin(T * 7.3), a = lerp(-0.55, -0.15, k);
      R.light({ amb: [0.1, 0.09, 0.16], sun: null, pts: [{ p: [0, 1.1, 0], r: 10 * fl, c: [1.7, 0.85, 0.35] }], fog: { near: 7, far: 19, col: [6, 6, 14], max: 0.9 } });
      R.look([Math.sin(a) * 6.4, 1.25, Math.cos(a) * 6.4], [0, 0.9, -1.2], 50);
      R.clear('#04050e', '#181222');
      R.stars(90, 77, 0.45);
      R.draw(villageMesh(), M.id());
      for (let i = 0; i < 14; i++) {
        const ph = (T * 1.6 + hx(i, 1, 115)) % 1, ang = hx(i, 2, 115) * Math.PI * 2, r0 = 0.25 * (1 - ph);
        R.glow([Math.cos(ang) * r0, 0.2 + ph * 1.3, Math.sin(ang) * r0], 0.34 * (1 - ph) + 0.06, ph < 0.4 ? '#ffe070' : ph < 0.7 ? '#ff8a2a' : '#c03a10', { a: 0.85 * (1 - ph * 0.6) });
      }
      R.glow([0, 0.7, 0], 1.6, '#ff7a30', { a: 0.4 * fl, depth: false });
      for (let i = 0; i < 16; i++) { const ph = (T * 0.7 + hx(i, 3, 115)) % 1; R.glow([(hx(i, 4, 115) - 0.5) * 1.2 + Math.sin(T * 3 + i) * 0.2, 0.5 + ph * 3.4, (hx(i, 5, 115) - 0.5) * 1.2], 0.03, '#ffc060', { a: 1 - ph, shape: 'disc' }); }
      R.bake();
      K.vignette(g, 0.55);
    }

    fenceShot(R, g, t, T, look) {
      const k = sm(t / 1.0);
      R.light({ amb: [1, 1, 1], sun: null });
      R.look([lerp(-0.9, -0.5, k), lerp(0.55, 0.7, k), lerp(4.6, 4.0, k)], [0.3, 1.85, 0], 50);
      R.clear('#070820', '#3a2440');
      R.stars(120, 81, 0.6);
      const mp = R.project([0.3, 2.7, 0]), mx = mp ? mp[0] + 16 : 200, my = mp ? mp[1] - 14 : 70;
      R.flat(mx, my, 70, '#6a5a8a', { a: 0.35 });
      R.flat(mx, my, 34, '#f6eedc', { shape: 'disc', mode: 'alpha' });
      R.flat(mx + 8, my - 6, 9, '#ddd2b8', { shape: 'disc', mode: 'alpha', a: 0.6 });
      R.draw(fenceMesh(), M.id(), { lit: false });
      R.draw(figureQuad(look, 1.75), M.t(0.3, 1.14, 0), { lit: false, tint: '#3a2a3a' });
      R.bake();
      const hp = R.project([0.62, 2.55, 0]);
      if (hp) {
        const ph = (T * 1.4) % 1, up = Math.sin(ph * Math.PI) * 22;
        knife(g, hp[0], hp[1] - up, 14, T * 11, 1);
        lighter(g, () => star4(g, hp[0] + 2, hp[1] - up - 6, 5, '#ffe0e0', 0.5 + 0.5 * Math.sin(T * 20)));
      }
      g.fillStyle = '#05040a';
      g.beginPath(); g.moveTo(0, LH);
      for (let x = 0; x <= LW; x += 4) g.lineTo(x, LH - 6 - 10 * hx(x, 2, 119));
      g.lineTo(LW, LH); g.closePath(); g.fill();
    }

    domeShot(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#0c0306'], [1, '#2a0808']]);
      const k = eOut(seg(t, 0, 0.3));
      lighter(g, () => { glow(g, CX, CY, 160, '#ff5a20', 0.25); hexDome(g, CX, CY + 10, 230, 14, '#ff8a3a', 0.4, k); hexDome(g, CX, CY + 10, 230, 14, '#ffd0a0', 0.25 * (1 - seg(t, 0.3, 0.6)), k); });
      if (t > 0.28 && t < 0.4) K.flash(g, '#ffb070', 0.5 * (1 - seg(t, 0.28, 0.4)));
      for (const [x, s0] of [[64, 0.08], [252, 0.2], [118, 0.32], [212, 0.44]]) {
        const a = 1 - seg(t, s0, s0 + 0.28);
        if (t >= s0 && a > 0) figure(g, look, x, 232, 2, { tint: '#b040ff', ta: 0.75, a: a * 0.8 });
      }
      const c = eOut(seg(t, 0.5, 0.75));
      if (c > 0) bust(g, look, lerp(380, 228, c), 262, 128, 1.9, { rim: '#ff7a3a' });
      K.embers(g, T, 18, 13, 0, LW, LH, '#ff9a4a');
    }

    nightmare(g, x, y, n, tint, a, eyes, T) {
      const nc = G.foeCanvas('scar_nightmare', n, Math.floor(T * 2.2) % 2), nx = x - n / 2, ny = y - n;
      g.save(); g.imageSmoothingEnabled = false; g.globalAlpha = cl(a); g.drawImage(K.tinted(nc, tint, 1), nx, ny, n, n); g.restore();
      if (eyes > 0) lighter(g, () => { for (const [ex, ey] of EYES) { glow(g, nx + ex * n / 100, ny + ey * n / 100, n / 36, '#ffe040', eyes); rect(g, rgba('#fff6c0', eyes), Math.round(nx + ex * n / 100) - 1, Math.round(ny + ey * n / 100), 2, 1); } });
    }

    shadowShot(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#08070e'], [0.62, '#18121c'], [0.63, '#100c12'], [1, '#1c1418']]);
      lighter(g, () => glow(g, 196, 112, 150, '#5a4a70', 0.45));
      const m = seg(t, 0.25, 0.7);
      figure(g, look, 204, 214, 2, { s: 1.08, tint: '#000000', a: 0.85 * (1 - m) });
      this.nightmare(g, 204, 228, 222, '#000000', 0.9 * m, seg(t, 0.55, 0.8), T);
      figure(g, look, 90, 264, 2, { s: 1.05, tint: '#ff6a3a', ta: 1, a: 0.8 });
      figure(g, look, 92, 264, 2, { s: 1.05, tint: '#1a1018', ta: 0.55 });
      K.embers(g, T, 16, 21, 0, LW, LH, '#ff8a3a');
    }

    scarPose(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#0c0406'], [0.6, '#2a0808'], [1, '#4a1206']]);
      lighter(g, () => { glow(g, CX, 270, 230, '#ff6a20', 0.5); hexDome(g, CX, CY, 260, 16, '#ff8a3a', 0.12, 1); });
      this.nightmare(g, 176, 234, 232, '#160610', 0.55, 0.5 + 0.3 * Math.sin(T * 4), T);
      K.embers(g, T, 30, 17, 0, LW, LH, '#ff8a3a');
      for (let i = 0; i < 3; i++) { const a = T * 0.9 + i * 2.1; knife(g, 166 + Math.cos(a) * 104, 124 + Math.sin(a) * 40, 18, a + Math.PI / 2, 0.9); }
      rimFigure(g, look, 168, 250 + Math.sin(T * 1.4) * 1.5, 3, '#ff7a3a', { s: 0.86 });
    }

    kazShore(g, T, sea) {
      vgrad(g, 0, 112, [[0, '#03050c'], [1, '#141c3a']]);
      K.stars(g, T, 70, 131, 0.7, 110);
      lighter(g, () => glow(g, 252, 40, 60, '#bcd0ff', 0.35));
      ell(g, '#eef2ff', 252, 40, 15, 15); ell(g, '#cdd6f0', 258, 36, 4, 4);
      vgrad(g, 110, 168, [[0, '#0c2238'], [1, '#1c4a68']]);
      for (let i = 0; i < 14; i++) rect(g, rgba('#bcd8ff', 0.5), Math.round((hx(i, 1, 133) * LW + T * 8) % LW), 116 + Math.floor(hx(i, 2, 133) * 48), 4 + Math.floor(hx(i, 3, 133) * 8), 1);
      lighter(g, () => {
        g.strokeStyle = rgba(RCOL[4], 0.8); g.lineWidth = 1; g.beginPath();
        for (let x = 0; x <= LW; x += 2) { const y = 111 + Math.sin(x * 0.11 + T * 4) * 2 + Math.exp(-Math.pow((x - 200) / 18, 2)) * Math.sin(T * 20) * 6 * (sea || 0); if (x) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke();
      });
      vgrad(g, 166, LH, [[0, '#3a3448'], [1, '#1a1622']]);
    }

    kazFoam(g, T, reach) {
      for (const [k, col] of [[1, rgba('#d8ecff', 0.75)], [0.8, rgba('#5a8ab0', 0.35)]]) {
        g.fillStyle = col; g.beginPath(); g.moveTo(0, 164);
        for (let x = 0; x <= LW; x += 8) g.lineTo(x, 164 + reach * k + Math.sin(x * 0.07 + T * 3) * 4);
        g.lineTo(LW, 164); g.closePath(); g.fill();
      }
    }

    kazWash(g, t, T, look) {
      this.kazShore(g, T);
      g.save(); g.translate(232, 206); g.rotate(-Math.PI / 2); figure(g, look, 0, 0, 2, { s: 0.75 }); g.restore();
      this.kazFoam(g, T, 12 + 34 * Math.max(0, Math.sin(t * 4.2)));
      if (t > 0.6) {
        for (let i = 0; i < 7; i++) { const q = seg(t, 0.6 + i * 0.02, 0.95), a = -Math.PI * (0.35 + 0.3 * hx(i, 1, 135)); if (q > 0 && q < 1) ell(g, rgba('#bfe4ff', 1 - q), 96 + Math.cos(a) * 40 * q, 190 + Math.sin(a) * 40 * q + 30 * q * q, 2, 2.5); }
        H.ExplosionKit.bubble(g, 110, 136, 'Кха! Кха!', 1, false);
      }
      K.vignette(g, 0.5);
    }

    kazScan(g, t, T, look) {
      vgrad(g, 0, LH, [[0, '#030814'], [1, '#0c1e3a']]);
      for (let x = 0; x < LW; x += 16) rect(g, rgba('#2a5a8a', 0.25), x, 0, 1, LH);
      for (let y = 0; y < LH; y += 16) rect(g, rgba('#2a5a8a', 0.25), 0, y, LW, 1);
      const wow = seg(t, 0.55, 0.7), sh = wow > 0 ? Math.sin(T * 50) * 2 * (1 - seg(t, 0.7, 1.0)) : 0;
      bust(g, look, lerp(20, 76, eOut(seg(t, 0, 0.3))) - wow * 6, LH + 8, 128, 1.3);
      const k = eOut(seg(t, 0.05, 0.35)), px = Math.round(lerp(LW + 20, 150, k) + sh), py = 36;
      g.save(); g.translate(px, py);
      rect(g, rgba('#0a2a4a', 0.85), 0, 0, 158, 164); g.strokeStyle = '#6ac8ff'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 157, 163);
      rect(g, '#6ac8ff', 0, 0, 158, 12);
      g.font = 'bold 8px Georgia, serif'; g.fillStyle = '#04182a'; g.fillText('АНАЛИЗ РЕЗОНАНСА', 6, 9);
      lighter(g, () => {
        g.strokeStyle = rgba('#9ae0ff', 0.9); g.beginPath();
        for (let x = 0; x <= 146; x += 2) { const amp = 2 + wow * 16 * Math.exp(-Math.pow((x - 100) / 14, 2)), y = 34 + Math.sin(x * 0.5 + T * 18) * amp; if (x) g.lineTo(6 + x, y); else g.moveTo(6, y); }
        g.stroke();
      });
      g.font = '8px Georgia, serif';
      [['Сила', 0.32], ['Ловкость', 0.4], ['Магия', 0.28], ['Интеллект', 0.44]].forEach(([n, v], i) => {
        const y = 62 + i * 13;
        g.fillStyle = '#bfe4ff'; g.fillText(n, 6, y + 6);
        rect(g, '#1c3a5a', 62, y, 88, 5); rect(g, '#6aa8d8', 62, y, Math.round(88 * v * seg(t, 0.3 + i * 0.05, 0.5 + i * 0.05)), 5);
      });
      g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#ffe080'; g.fillText('Удача', 6, 126);
      rect(g, '#1c3a5a', 62, 119, 88, 8);
      const lw = Math.round(eOut(seg(t, 0.5, 0.8)) * 260);
      if (lw > 0) { lighter(g, () => glow(g, 62 + lw, 123, 18, '#fff4b0', 0.9)); rect(g, '#d8b040', 62, 119, lw, 8); rect(g, '#fff4b0', 62, 119, lw, 2); }
      const st = seg(t, 0.75, 0.9);
      if (st > 0) { g.save(); g.globalAlpha = st; g.translate(104, 147); g.rotate(-0.1); g.strokeStyle = '#ffe080'; g.lineWidth = 2; g.strokeRect(-40, -10, 80, 17); g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#ffe080'; g.textAlign = 'center'; g.fillText('РЕЗОНАТОР?', 0, 3); g.textAlign = 'left'; g.restore(); }
      g.restore();
      if (wow > 0) {
        g.save(); g.globalAlpha = wow; g.font = 'bold 22px Georgia, serif'; g.fillStyle = '#04080e'; g.fillText('!?', 34, 98); g.fillStyle = '#ffe080'; g.fillText('!?', 32, 96); g.restore();
      }
    }

    kazEcho(g, t, T, look) {
      const rise = eOut(seg(t, 0, 0.45)), roar = seg(t, 0.4, 0.55) * (1 - seg(t, 0.8, 1));
      g.save();
      if (roar > 0) g.translate(Math.round(Math.sin(T * 60) * 2 * roar), Math.round(Math.cos(T * 47) * 2 * roar));
      this.kazShore(g, T, 1);
      const tx = 214, ty = lerp(250, 186, rise);
      lighter(g, () => glow(g, tx - 10, ty - 50, 90, '#9a6aff', 0.35 * rise));
      g.save(); g.beginPath(); g.rect(0, 0, LW, 178); g.clip();
      H.ExplosionKit.toad(g, tx, ty, 0.95, T, { gape: roar, puff: 0.2 + 0.1 * Math.sin(T * 9) });
      g.restore();
      const mx = tx - 44 * 0.95, my = ty - 106 * 0.95;
      lighter(g, () => { glow(g, mx, my, 14, '#c8a0ff', 0.9 * rise); ring(g, rgba('#e8d8ff', rise), 1.5, mx, my, 6); });
      for (let i = 0; i < 3; i++) { const q = (T * 0.9 + i / 3) % 1; lighter(g, () => { g.strokeStyle = rgba('#b48cff', (1 - q) * 0.7 * rise); g.lineWidth = 1; g.beginPath(); g.ellipse(tx - 20, 172, 40 + q * 150, 6 + q * 14, 0, 0, Math.PI * 2); g.stroke(); }); }
      this.kazFoam(g, T, 10 + 6 * Math.sin(T * 3));
      g.restore();
      const kk = eOut(seg(t, 0.35, 0.6));
      bust(g, look, lerp(-60, 54, kk), LH + 6, 110, 1);
      if (kk > 0.8) H.ExplosionKit.bubble(g, 70, 96, 'Опять жабы?!', 1, false);
    }

    kazCatch(g, t, T, look) {
      this.kazShore(g, T);
      rect(g, 'rgba(4,6,16,0.35)', 0, 0, LW, LH);
      const shrink = seg(t, 0, 0.35), fly = seg(t, 0.35, 0.55), hx0 = 196, hy0 = 118;
      if (shrink < 1) {
        lighter(g, () => glow(g, 110, 150, 70 * (1 - shrink) + 10, '#b48cff', 0.6));
        H.ExplosionKit.toad(g, 110, 190 - 30 * shrink, 0.9 * (1 - shrink) + 0.05, T, {});
        lighter(g, () => { g.strokeStyle = rgba('#e8d8ff', 1 - shrink); g.lineWidth = 2; g.beginPath(); g.arc(110, 150, 90 * (1 - shrink), 0, Math.PI * 2); g.stroke(); });
      }
      bust(g, look, 200, LH + 6, 140, 1);
      if (shrink >= 1 && fly < 1) { const x = lerp(110, hx0, sm(fly)), y = lerp(160, hy0, sm(fly)) - Math.sin(fly * Math.PI) * 40; lighter(g, () => { glow(g, x, y, 14, '#c8a0ff', 0.9); star4(g, x, y, 6, '#ffffff', 1, 0.2); }); }
      if (fly >= 1) {
        const hop = (1 - seg(t, 0.55, 0.65)) * 8;
        lighter(g, () => glow(g, hx0, hy0 - 6, 16, '#b48cff', 0.45));
        H.ExplosionKit.toad(g, hx0 + 8, hy0 - hop, 0.2, T, {});
        if (t > 0.65) { g.save(); g.globalAlpha = seg(t, 0.65, 0.75); g.font = 'bold 10px Georgia, serif'; g.fillStyle = '#04080e'; g.fillText('Ква.', hx0 + 21, hy0 - 15); g.fillStyle = '#e8d8ff'; g.fillText('Ква.', hx0 + 20, hy0 - 16); g.restore(); }
      }
      if (t > 0.7) H.ExplosionKit.bubble(g, 98, 40, 'Это… моё Эхо?', 1, false);
    }

    kazPose(g, t, T, look) {
      this.kazShore(g, T);
      this.kazFoam(g, T, 8 + 4 * Math.sin(T * 2));
      for (let i = 0; i < 16; i++) { const ph = (T * 0.25 + hx(i, 1, 137)) % 1; rect(g, rgba(i % 3 ? '#b48cff' : '#e8d8ff', Math.sin(Math.PI * ph) * 0.8), Math.round(30 + hx(i, 2, 137) * 260), Math.round(220 - ph * 180), 1, 1); }
      const x = 168, y = 252 + Math.sin(T * 1.4) * 1.5, u = 3 * 0.76, ey = G.figEye(look, 1)[1];
      rimFigure(g, look, x, y, 3, '#b48cff', { s: 0.76 });
      const ty = y + (ey - 13 - G.FIG_FOOT) * u;
      lighter(g, () => glow(g, x, ty - 8, 16, '#b48cff', 0.4));
      H.ExplosionKit.toad(g, x + 8, ty - Math.abs(Math.sin(T * 3)) * 2, 0.2, T, {});
      K.vignette(g, 0.45);
    }

    rackBg(R, T) {
      this.space(R, T);
      for (let i = 0; i < 5; i++) R.flat(hx(i, 1, 117) * LW, 40 + hx(i, 2, 117) * 160, 60 + hx(i, 3, 117) * 40, i % 2 ? '#1a2a5a' : R3.rgb(RCOL[this.best]).map(v => v * 0.25), { shape: 'puff', a: 0.5 });
      R.bake();
    }

    paint() {
      const R = this.R, g = R.g, T = this.t + this.rt;
      if (this.phase === 'cine') {
        const [n, t] = this.shot();
        if (n === 'tide') this.tide(R, g, t, T);
        else if (n === 'dive') this.dive(R, g, t, T);
        else if (n === 'comet') this.comet(R, g, t, T);
        else if (n === 'vortex') this.vortex(R, g, t, T);
        else this.flashShot(R, g, t, T);
      } else if (this.phase === 'reveal') {
        const r = this.item(), t = this.rt - this.hop;
        if (t < 0) this.hopShot(g, this.rt);
        else if (r.kind !== 'char') this.coneScene(R, g, r, t, T);
        else if (t < this.waveLen(r)) this.waveShot(g, r, t, T);
        else if (CUTS[r.id]) this.cutShot(R, g, r, t - this.waveLen(r), T);
        else this.shore(R, g, r, t - this.waveLen(r), T);
      } else this.rackBg(R, T);
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
      c.fillStyle = 'rgba(4,8,20,0.6)'; c.fillRect(x, y, w, 20);
      c.strokeStyle = 'rgba(160,210,255,0.7)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 19);
      const kw = ui.keycap(x + 6, y + 4, 'Esc');
      ui.text(label, x + 12 + kw, y + 5, { size: 10, col: C.cream });
      ui.hit(x, y, w, 20, () => this.skip());
    }

    cineOverlay(c) {
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Пропустить');
      this.ui.hints([['Enter', 'Пропустить ролик']], 12, HGT - 20, { col: 'rgba(200,220,240,0.8)' });
    }

    sparkRow(c, x, y, n, col, s) {
      c.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const cx = x + i * s * 2.4, w = s * 0.3;
        c.beginPath();
        c.moveTo(cx, y - s); c.lineTo(cx + w, y - w); c.lineTo(cx + s, y); c.lineTo(cx + w, y + w);
        c.lineTo(cx, y + s); c.lineTo(cx - w, y + w); c.lineTo(cx - s, y); c.lineTo(cx - w, y - w);
        c.closePath(); c.fill();
      }
    }

    plate(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui, ch = r.kind === 'char', d = ch ? H.CHARS[r.id] : H.CONES[r.id], path = d && d.path, name = ch ? d.fullName || d.name : r.name;
      const x0 = Math.round(36 - 50 * (1 - eOut(a))), y = 178;
      c.save(); c.globalAlpha = cl(a);
      const gr = c.createLinearGradient(x0 - 36, 0, x0 + 334, 0);
      gr.addColorStop(0, 'rgba(4,8,20,0.78)'); gr.addColorStop(0.7, 'rgba(4,8,20,0.45)'); gr.addColorStop(1, 'rgba(4,8,20,0)');
      c.fillStyle = gr; c.fillRect(x0 - 36, y - 10, 370, 88);
      ui.diamond(x0 + 20, y + 22, 20, 'rgba(8,12,28,0.92)', RCOL[r.rar]);
      if (path) G.pathIcon(c, path, x0 + 8, y + 10, 24, RHOT[r.rar]);
      const size = ui.measure(name, 22, true, true) > 240 ? 16 : 22;
      ui.text(name, x0 + 50, y + (size === 22 ? 2 : 6), { size, bold: true, serif: true, col: '#ffffff' });
      if (ch && r.res === 'new') {
        const nx = Math.round(x0 + 56 + ui.measure(name, size, true, true));
        c.fillStyle = '#e8c860'; c.fillRect(nx, y + 6, 38, 12);
        ui.text('НОВЫЙ', nx + 19, y + 7, { size: 8, bold: true, align: 'center', col: '#1a1406', shadow: false });
      }
      this.sparkRow(c, x0 + 58, y + 38, r.rar, RCOL[r.rar], 5);
      if (ch) { G.elemIcon(c, d.elem, x0 + 57, y + 60, 6); ui.text(H.PATHS[d.path].name + ' · ' + H.ELEMENTS[d.elem].name, x0 + 68, y + 54, { size: 11, col: C.sub }); }
      else ui.text('Световой конус' + (path ? ' · ' + H.PATHS[path].name : ''), x0 + 50, y + 54, { size: 11, col: C.sub });
      c.restore();
    }

    quote(c, q, a) {
      if (!q || a <= 0) return;
      const ui = this.ui, s = '«' + q + '»', lw = Math.min(600, ui.measure(s, 12) + 34);
      c.save(); c.globalAlpha = cl(a);
      c.fillStyle = 'rgba(6,8,16,0.8)'; c.fillRect(Math.round(W / 2 - lw / 2), HGT - 50, Math.round(lw), 22);
      ui.text(s, W / 2, HGT - 46, { size: 12, align: 'center', col: C.cream });
      c.restore();
    }

    resultTag(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui;
      const lines = r.kind === 'char'
        ? (r.res === 'new' ? [['Новый персонаж!', C.ok], ['присоединился к экипажу', C.cream]] : r.res === 'eid' ? [['Дубликат', C.sub], ['Эйдолон +1', C.gold]] : [['Дубликат', C.sub], ['+3 000 кредитов', C.gold]])
        : r.sup > 1 ? [['Дубликат', C.sub], ['Наложение S' + r.sup, C.gold]] : [['Световой конус', C.sub], ['добавлен в инвентарь', C.cream]];
      const x = W - 196, y = HGT - 108;
      c.save(); c.globalAlpha = cl(a);
      ui.win(x, y, 182, 50, { alpha: 0.9 });
      lines.forEach(([s, col], i) => ui.text(s, x + 14, y + 10 + i * 16, { size: i ? 11 : 12, bold: !i, col }));
      c.restore();
    }

    revealOverlay(c) {
      const ui = this.ui, r = this.item(), t = this.rt - this.hop, L = this.length(r);
      if (t >= 0) {
        if (r.kind === 'char') {
          const b = t - this.waveLen(r), at = CUTS[r.id] ? total(CUTS[r.id]) : 0.5;
          this.plate(c, r, seg(b, at, at + 0.4));
          this.quote(c, QUOTES[r.id] || (H.WarpIntro ? H.WarpIntro.line(r.id, this.game) : ''), seg(b, at + 0.2, at + 0.5));
        } else this.plate(c, r, seg(t, 0.45, 0.8));
        this.resultTag(c, r, seg(t, L - 0.4, L - 0.1));
      }
      if (this.res.length > 1) ui.plate(12, 10, (this.cur + 1) + ' / ' + this.res.length);
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Закрыть');
      ui.hints([['Enter', this.rt < this.intro() ? 'Показать' : this.queue.length || this.res.length > 1 ? 'Далее' : 'Готово']], 12, HGT - 20);
    }

    rackCard(c, r, x, y, w, h) {
      const g = this.game;
      c.fillStyle = '#04060c'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
      const gr = c.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, RDEEP[r.rar]); gr.addColorStop(0.7, '#080c18'); gr.addColorStop(1, G.mix(RDEEP[r.rar], RCOL[r.rar], 0.5));
      c.fillStyle = gr; c.fillRect(x, y, w, h);
      c.save();
      c.beginPath(); c.rect(x, y, w, h); c.clip();
      c.imageSmoothingEnabled = false;
      if (r.kind === 'char') { const cv = G.figureCanvas(G.lookOf(r.id, g), 2), s = 1.3; c.drawImage(cv, Math.round(x + w / 2 - cv.width * s / 2), y + 8, Math.round(cv.width * s), Math.round(cv.height * s)); }
      else { const cv = G.coneArt(r.id, 72, 100), s = h / cv.height; c.drawImage(cv, Math.round(x + w / 2 - cv.width * s / 2), y, Math.round(cv.width * s), h); }
      c.restore();
      c.strokeStyle = RCOL[r.rar]; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.fillStyle = 'rgba(4,6,12,0.75)'; c.fillRect(x + 1, y + h - 24, w - 2, 23);
      this.sparkRow(c, x + w / 2 - (r.rar - 1) * 3.12, y + h - 12, r.rar, RCOL[r.rar], 2.6);
      if (r.kind === 'char' && r.res === 'new') { c.fillStyle = '#e8c860'; c.fillRect(x + 4, y + 4, w - 8, 12); this.ui.text('НОВЫЙ', x + w / 2, y + 5, { size: 8, bold: true, align: 'center', col: '#1a1406', shadow: false }); }
    }

    rackOverlay(c) {
      const ui = this.ui, t = this.rt, n = this.res.length;
      c.fillStyle = 'rgba(4,6,14,0.35)'; c.fillRect(0, 0, W, HGT);
      for (let k = 5; k > 0; k--) ui.text('ИТОГИ ПРИЗЫВА', W / 2 + k, 26 + k, { size: 28, bold: true, serif: true, align: 'center', col: k > 1 ? '#0a1020' : '#2a3a5a', shadow: false });
      ui.text('ИТОГИ ПРИЗЫВА', W / 2, 26, { size: 28, bold: true, serif: true, align: 'center', col: '#eef4ff', shadow: false });
      const cw = 56, gap = 4, ch = 300, x0 = Math.round(W / 2 - (n * cw + (n - 1) * gap) / 2), y0 = 80;
      this.res.forEach((r, i) => {
        const k = eOut(seg(t, i * 0.06, i * 0.06 + 0.35));
        if (k <= 0) return;
        c.save(); c.globalAlpha = k;
        this.rackCard(c, r, Math.round(x0 + i * (cw + gap) + (1 - k) * 40), y0, cw, ch);
        c.restore();
      });
      const five = this.res.filter(r => r.rar === 5).length, four = this.res.filter(r => r.rar === 4).length, news = this.res.filter(r => r.kind === 'char' && r.res === 'new').length;
      ui.text('5★: ' + five + ' · 4★: ' + four + (news ? ' · новых персонажей: ' + news : ''), W / 2, HGT - 50, { align: 'center', size: 11, col: C.sub });
      ui.hints([['Enter', 'Готово']], W / 2, HGT - 26, { align: 'center' });
    }
  }

  H.ConveneShow = ConveneShow;
  Object.assign(H, { CONVENE_SHOTS: SHOTS, CONVENE_CINE: CINE, CONVENE_CUTS: CUTS, ConveneKit: { RCOL, QUOTES, cutLen: id => total(CUTS[id]) } });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
