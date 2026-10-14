/**
 * Doom 98 — procedural graphics. Every wall texture, flat, sprite, weapon and status-bar graphic is painted
 * by code straight into 8-bit palette indices (no image files). Works in the browser and in Node.
 * Pic: { w, h, px: Uint8Array row-major, ox, oy }. Index 0 is transparent for sprites.
 */
(function (D) {
  'use strict';
  if (!D.DATA && typeof require !== 'undefined') require('./doom-data.js');
  const { RAMP: R, C } = D.DATA;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ---------------------------------------------------------------- primitives
  class Pic {
    constructor(w, h) { this.w = w; this.h = h; this.px = new Uint8Array(w * h); this.ox = w >> 1; this.oy = h; this.dx = 0; this.dy = 0; }
    set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h && c) this.px[y * this.w + x] = c; }
    get(x, y) { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : 0; }
    fill(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = fn(x, y); if (c) this.px[y * this.w + x] = c; } return this; }
    rect(x, y, w, h, c) { for (let j = Math.max(0, Math.floor(y)); j < Math.min(this.h, Math.floor(y + h)); j++) for (let i = Math.max(0, Math.floor(x)); i < Math.min(this.w, Math.floor(x + w)); i++) { const v = typeof c === 'function' ? c(i, j) : c; if (v) this.px[j * this.w + i] = v; } return this; }
    clone() { const p = new Pic(this.w, this.h); p.px.set(this.px); p.ox = this.ox; p.oy = this.oy; p.dx = this.dx; p.dy = this.dy; return p; }
  }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  // tileable value noise
  function vnoise(w, h, cell, seed) {
    const gw = Math.max(1, Math.round(w / cell)), gh = Math.max(1, Math.round(h / cell)), r = rng(seed), g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = r();
    return (x, y) => {
      const fx = x / w * gw, fy = y / h * gh, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const X0 = ((x0 % gw) + gw) % gw, X1 = (X0 + 1) % gw, Y0 = ((y0 % gh) + gh) % gh, Y1 = (Y0 + 1) % gh;
      const a = g[Y0 * gw + X0], b = g[Y0 * gw + X1], c = g[Y1 * gw + X0], d = g[Y1 * gw + X1];
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
  }
  function fbm(w, h, seed, oct = [[32, 0.5], [16, 0.25], [8, 0.15], [4, 0.1]]) {
    const ns = oct.map(([c, a], i) => [vnoise(w, h, c, seed * 7 + i * 131), a]);
    return (x, y) => { let v = 0; for (const [n, a] of ns) v += n(x, y) * a; return v; };
  }
  const L = { x: -0.42, y: -0.55, z: 0.72 };
  function shadeAt(nx, ny, nz, base, con) { const lam = nx * L.x + ny * L.y + nz * L.z; return base + (lam - 0.35) * con; }
  // shaded ellipse
  function blob(p, cx, cy, rx, ry, ramp, base, con = 6, noise = 0, seed = 1) {
    const r = noise ? rng(seed) : null;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d2 = dx * dx + dy * dy; if (d2 > 1) continue;
      let s = shadeAt(dx, dy, Math.sqrt(1 - d2), base, con); if (r) s += (r() - 0.5) * noise;
      p.set(x, y, C(ramp, clamp(s, 1, 15)));
    }
  }
  // shaded capsule (limbs)
  function limb(p, x0, y0, x1, y1, r0, r1, ramp, base, con = 5) {
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1, rm = Math.max(r0, r1);
    for (let y = Math.floor(Math.min(y0, y1) - rm); y <= Math.ceil(Math.max(y0, y1) + rm); y++) for (let x = Math.floor(Math.min(x0, x1) - rm); x <= Math.ceil(Math.max(x0, x1) + rm); x++) {
      const px = x + 0.5, py = y + 0.5; let t = ((px - x0) * dx + (py - y0) * dy) / l2; t = clamp(t, 0, 1);
      const qx = x0 + dx * t, qy = y0 + dy * t, r = r0 + (r1 - r0) * t, ex = px - qx, ey = py - qy, d = Math.hypot(ex, ey);
      if (d > r) continue;
      const nx = ex / r, ny = ey / r; p.set(x, y, C(ramp, clamp(shadeAt(nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), base, con), 1, 15)));
    }
  }
  function poly(p, pts, c) {
    let y0 = Infinity, y1 = -Infinity; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [], py = y + 0.5;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py)) xs.push(xi + (py - yi) * (xj - xi) / (yj - yi)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x < Math.ceil(xs[k + 1] - 0.5); x++) p.set(x, y, typeof c === 'function' ? c(x, y) : c);
    }
  }
  function line(p, x0, y0, x1, y1, c, w = 1) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) + 1;
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; if (w <= 1) p.set(x, y, c); else p.rect(x - w / 2, y - w / 2, w, w, c); }
  }
  function disc(p, cx, cy, r, c) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) p.set(x, y, typeof c === 'function' ? c(x, y) : c); }
  // darken opaque pixels on the silhouette edge so sprites read against any wall
  function edge(p, amt = 3) {
    const out = p.px.slice();
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      const c = p.px[y * p.w + x]; if (!c) continue;
      if (!p.get(x - 1, y) || !p.get(x + 1, y) || !p.get(x, y - 1) || !p.get(x, y + 1)) { const s = c & 15; out[y * p.w + x] = (c & 0xf0) | Math.max(1, s - amt); }
    }
    p.px.set(out); return p;
  }
  function darken(c, n) { return (c & 0xf0) | clamp((c & 15) - n, (c & 0xf0) === 0 ? 1 : 0, 15) || 1; }
  function mirror(p) { const q = p.clone(); for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) q.px[y * p.w + x] = p.px[y * p.w + (p.w - 1 - x)]; q.ox = p.w - p.ox; return q; }
  // rotate around (px,py) by angle (radians) into a new pic of given size, pivot placed at (qx,qy)
  function rotate(p, ang, px, py, w, h, qx, qy) {
    const q = new Pic(w, h), c = Math.cos(ang), s = Math.sin(ang);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = x + 0.5 - qx, dy = y + 0.5 - qy; const sx = c * dx + s * dy + px, sy = -s * dx + c * dy + py; const v = p.get(sx, sy); if (v) q.px[y * w + x] = v; }
    return q;
  }
  function blit(dst, src, x, y) { for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) { const c = src.px[j * src.w + i]; if (c) dst.set(x + i, y + j, c); } }
  function scalePic(p, sx, sy) { const w = Math.max(1, Math.round(p.w * sx)), h = Math.max(1, Math.round(p.h * sy)), q = new Pic(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) q.px[y * w + x] = p.get(x / sx, y / sy); q.ox = Math.round(p.ox * sx); q.oy = Math.round(p.oy * sy); return q; }

  // tiny 3x5 font for labels baked into graphics
  const F3 = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
    I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
    Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110',
    6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110', '/': '001001010100100', '%': '101001010100101', '-': '000000111000000', '.': '000000000000010', ':': '000010000010000', ' ': '000000000000000'
  };
  function text3(p, str, x, y, c, scale = 1, shadow = 0) {
    for (const ch of str.toUpperCase()) {
      const g = F3[ch] || F3[' '];
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') { if (shadow) p.rect(x + i * scale + 1, y + j * scale + 1, scale, scale, shadow); p.rect(x + i * scale, y + j * scale, scale, scale, c); }
      x += 4 * scale;
    }
  }

  // ================================================================ WALL TEXTURES
  const T = {}, FL = {}, S = {}, HUD = {};
  function panelWall(w, h, ramp, base, seed, bands, bandRamp) {
    const p = new Pic(w, h), n = fbm(w, h, seed, [[16, 0.5], [8, 0.3], [4, 0.2]]), r = rng(seed);
    p.fill((x, y) => C(ramp, base + (n(x, y) - 0.5) * 3 + (r() - 0.5) * 0.8));
    for (const [y0, bh] of bands) {
      p.rect(0, y0, w, bh, (x, y) => C(bandRamp, 5 + (n(x, y) - 0.5) * 2 + (y === y0 ? 3 : y === y0 + bh - 1 ? -2 : 0)));
      for (let x = 4; x < w; x += 16) { p.set(x, y0 + (bh >> 1), C(bandRamp, 12)); p.set(x + 1, y0 + (bh >> 1) + 1, C(bandRamp, 2)); }
    }
    for (let y = 0; y < h; y++) { p.set(0, y, C(ramp, base - 4)); p.set(1, y, C(ramp, base + 3)); p.set(w - 1, y, C(ramp, base - 3)); }
    return p;
  }
  function bricks(w, h, ramp, base, bw, bh, seed, mortar = 2) {
    const p = new Pic(w, h), n = fbm(w, h, seed, [[8, 0.5], [4, 0.3], [2, 0.2]]), r = rng(seed + 5), off = [];
    for (let i = 0; i < 256; i++) off.push((r() - 0.5) * 2.5);
    p.fill((x, y) => {
      const row = Math.floor(y / bh), sx = (x + (row & 1) * (bw >> 1)) % w, col = Math.floor(sx / bw), ly = y % bh, lx = sx % bw;
      if (ly === bh - 1 || lx === bw - 1) return C(ramp, mortar);
      let s = base + off[(row * 7 + col) & 255] + (n(x, y) - 0.5) * 4;
      if (ly === 0 || lx === 0) s += 2; if (ly === bh - 2 || lx === bw - 2) s -= 2;
      return C(ramp, s);
    });
    return p;
  }
  function embossTex(w, h, ramp, base, seed, cell = 16, k = 14) {
    const p = new Pic(w, h), n = fbm(w, h, seed, [[cell, 0.55], [cell / 2, 0.3], [cell / 4, 0.15]]);
    p.fill((x, y) => C(ramp, base + (n(x, y) - 0.5) * 4 + (n(x - 1, y - 1) - n(x + 1, y + 1)) * k));
    return p;
  }

  function genTextures() {
    // STARTAN: beige tech panels with steel bands
    T.STARTAN = panelWall(64, 128, R.CONCRETE, 9, 11, [[0, 6], [58, 8], [122, 6]], R.STEEL);
    T.STARG = panelWall(64, 128, R.STEEL, 8, 12, [[0, 6], [60, 6], [122, 6]], R.OLIVE);
    T.STARGR = panelWall(64, 128, R.OLIVE, 7, 13, [[0, 5], [40, 4], [84, 4], [123, 5]], R.STEEL);
    // TEKWALL: dark steel with conduits and lights
    { const p = new Pic(64, 128), n = fbm(64, 128, 21); p.fill((x, y) => C(R.STEEL, 4 + (n(x, y) - 0.5) * 3));
      for (const cx of [10, 30, 50]) for (let y = 0; y < 128; y++) { p.set(cx - 2, y, C(R.STEEL, 3)); p.set(cx - 1, y, C(R.STEEL, 9)); p.set(cx, y, C(R.STEEL, 7)); p.set(cx + 1, y, C(R.STEEL, 5)); p.set(cx + 2, y, C(R.STEEL, 2)); }
      for (let y = 8; y < 128; y += 32) { p.rect(0, y, 64, 3, C(R.STEEL, 8)); p.rect(0, y + 3, 64, 1, C(R.STEEL, 2)); }
      for (let y = 20; y < 128; y += 32) { p.rect(18, y, 4, 3, C(R.RED, 13)); p.rect(38, y + 8, 4, 3, C(R.GREEN, 13)); }
      T.TEKWALL = p; }
    T.BROWN1 = bricks(64, 128, R.BROWN, 7, 32, 16, 31, 2);
    T.BRICK = bricks(64, 64, R.RUST, 8, 32, 12, 33, 2);
    T.GRAYBRIK = bricks(64, 64, R.CONCRETE, 7, 32, 16, 34, 3);
    T.BROWNHUG = embossTex(64, 128, R.BROWN, 6, 41, 16, 18);
    // STONE: irregular gray blocks
    { const p = bricks(64, 128, R.CONCRETE, 7, 64, 32, 51, 2), n = fbm(64, 128, 52, [[8, 0.6], [4, 0.4]]);
      p.fill((x, y) => { const c = p.px[y * 64 + x]; return (c & 15) <= 2 ? c : C(R.CONCRETE, (c & 15) + (n(x - 1, y - 1) - n(x + 1, y + 1)) * 10); });
      for (let y = 0; y < 128; y += 32) for (let x = 0; x < 64; x++) if (((x * 7 + y) % 23) < 2) p.set(x, y + 16, C(R.CONCRETE, 3));
      T.STONE = p; }
    T.ROCK = embossTex(64, 128, R.CONCRETE, 6, 55, 16, 20);
    T.RROCK = embossTex(64, 128, R.RUST, 6, 56, 16, 20);
    // COMPUTE: computer banks with blinking lights and a screen
    for (let v = 1; v <= 2; v++) {
      const p = new Pic(64, 128), r = rng(60 + v), n = fbm(64, 128, 62 + v);
      p.fill((x, y) => C(R.STEEL, 6 + (n(x, y) - 0.5) * 2));
      p.rect(3, 6, 58, 116, C(R.STEEL, 2));
      for (let y = 10; y < 120; y += 12) for (let x = 6; x < 58; x += 6) {
        const k = r(); const col = k < 0.15 ? C(R.RED, 12) : k < 0.3 ? C(R.GREEN, 13) : k < 0.4 ? C(R.YELLOW, 13) : k < 0.5 ? C(R.BLUE, 12) : C(R.STEEL, 4);
        p.rect(x, y, 3, 2, col);
      }
      if (v === 2) { p.rect(12, 34, 40, 28, C(R.GREEN, 2)); for (let y = 36; y < 60; y += 3) p.rect(14, y, 10 + Math.floor(r() * 24), 1, C(R.GREEN, 11)); p.rect(12, 34, 40, 1, C(R.STEEL, 9)); }
      p.rect(0, 0, 64, 3, C(R.STEEL, 10)); p.rect(0, 125, 64, 3, C(R.STEEL, 3));
      T['COMPUTE' + v] = p;
    }
    // DOOR1: steel door
    function door(w, band) {
      const p = new Pic(w, 128), n = fbm(w, 128, 71);
      p.fill((x, y) => C(R.STEEL, 7 + (n(x, y) - 0.5) * 2));
      for (let y = 8; y < 128; y += 16) { p.rect(3, y, w - 6, 1, C(R.STEEL, 11)); p.rect(3, y + 1, w - 6, 1, C(R.STEEL, 3)); }
      p.rect(0, 0, 3, 128, C(R.STEEL, 4)); p.rect(w - 3, 0, 3, 128, C(R.STEEL, 3)); p.rect(0, 0, w, 2, C(R.STEEL, 11));
      p.rect((w >> 1) - 1, 0, 2, 128, C(R.STEEL, 3));
      for (let y = 4; y < 128; y += 16) for (const x of [6, w - 8]) { p.set(x, y, C(R.STEEL, 13)); p.set(x + 1, y + 1, C(R.STEEL, 2)); }
      p.rect(w / 2 - 10, 100, 20, 12, C(R.YELLOW, 11)); for (let i = 0; i < 20; i += 4) p.rect(w / 2 - 10 + i, 100, 2, 12, C(R.GRAY, 2));
      if (band) { p.rect(3, 52, w - 6, 16, C(band, 9)); p.rect(3, 52, w - 6, 1, C(band, 14)); p.rect(3, 67, w - 6, 1, C(band, 4)); p.rect(w / 2 - 4, 55, 8, 10, C(band, 14)); p.rect(w / 2 - 2, 57, 4, 3, C(R.GRAY, 2)); }
      return p;
    }
    T.DOOR1 = door(64); T.BIGDOOR = door(128); T.DOORRED = door(64, R.RED); T.DOORBLU = door(64, R.BLUE); T.DOORYEL = door(64, R.YELLOW);
    // door tracks
    { const p = new Pic(16, 128); p.fill((x, y) => C(R.STEEL, [3, 6, 9, 7, 4, 2, 5, 8, 8, 5, 2, 4, 7, 9, 6, 3][x] + ((y & 7) === 0 ? 2 : 0))); T.DOORTRAK = p; }
    for (const [nm, ramp] of [['LITERED', R.RED], ['LITEBLU', R.BLUE], ['LITEYEL', R.YELLOW]]) { const p = new Pic(16, 128); p.fill((x, y) => x < 3 || x > 12 ? C(R.STEEL, 4 + (x & 1)) : C(ramp, 13 - Math.abs(x - 8) + ((y >> 3) & 1))); T[nm] = p; }
    // switches (drawn over STARTAN, lower-unpegged so the plate is 40..72 above the floor)
    function sw(base, on, exit) {
      const p = base.clone(), x0 = 20, y0 = 56;
      p.rect(x0 - 2, y0 - 2, 28, 36, C(R.STEEL, 3)); p.rect(x0, y0, 24, 32, C(R.STEEL, 7)); p.rect(x0, y0, 24, 1, C(R.STEEL, 12)); p.rect(x0, y0 + 31, 24, 1, C(R.STEEL, 2));
      if (exit) {
        p.rect(x0 + 3, y0 + 3, 18, 7, C(R.GRAY, 2)); text3(p, 'EXIT', x0 + 4, y0 + 4, C(R.RED, 14));
        disc(p, x0 + 12, y0 + 21, 6, C(on ? R.GREEN : R.RED, 6)); disc(p, x0 + 11, y0 + 20, 4, C(on ? R.GREEN : R.RED, on ? 14 : 12));
      } else {
        p.rect(x0 + 9, y0 + 4, 6, 24, C(R.STEEL, 2));
        if (on) { p.rect(x0 + 10, y0 + 16, 4, 12, C(R.STEEL, 11)); p.rect(x0 + 9, y0 + 25, 6, 4, C(R.GRAY, 12)); p.rect(x0 + 3, y0 + 4, 4, 4, C(R.GREEN, 14)); }
        else { p.rect(x0 + 10, y0 + 4, 4, 12, C(R.STEEL, 11)); p.rect(x0 + 9, y0 + 3, 6, 4, C(R.GRAY, 12)); p.rect(x0 + 3, y0 + 4, 4, 4, C(R.RED, 13)); }
      }
      return p;
    }
    T.SW1OFF = sw(T.STARTAN, false); T.SW1ON = sw(T.STARTAN, true);
    T.SW2OFF = sw(T.STARTAN, false, true); T.SW2ON = sw(T.STARTAN, true, true);
    T.SW3OFF = sw(T.STONE, false); T.SW3ON = sw(T.STONE, true);
    T.SW4OFF = sw(T.BROWN1, false); T.SW4ON = sw(T.BROWN1, true);
    // exit sign
    { const p = new Pic(64, 16); p.fill(() => C(R.GRAY, 2)); p.rect(0, 0, 64, 1, C(R.STEEL, 9)); p.rect(0, 15, 64, 1, C(R.STEEL, 3)); text3(p, 'EXIT', 9, 3, C(R.RED, 15), 3 / 1 > 2 ? 2 : 2); T.EXITSIGN = p; }
    // support beam
    { const p = new Pic(32, 128), n = fbm(32, 128, 81); p.fill((x, y) => C(R.STEEL, 6 + (n(x, y) - 0.5) * 2 + (x < 3 ? -3 : x > 28 ? -2 : x === 3 ? 4 : 0)));
      for (let y = 0; y < 128; y += 32) { line(p, 4, y + 2, 27, y + 30, C(R.STEEL, 3), 2); line(p, 27, y + 2, 4, y + 30, C(R.STEEL, 3), 2); p.rect(0, y, 32, 2, C(R.STEEL, 10)); }
      for (let y = 6; y < 128; y += 16) { p.set(1, y, C(R.STEEL, 13)); p.set(30, y, C(R.STEEL, 13)); }
      T.SUPPORT = p; }
    // rusty metal plates
    { const p = new Pic(64, 128), n = fbm(64, 128, 91), m = fbm(64, 128, 92, [[16, 0.6], [4, 0.4]]);
      p.fill((x, y) => { const rust = m(x, y) > 0.55; return C(rust ? R.RUST : R.STEEL, (rust ? 7 : 6) + (n(x, y) - 0.5) * 4 - ((y & 31) === 31 || (x & 31) === 31 ? 3 : 0) + ((y & 31) === 0 ? 2 : 0)); });
      for (let y = 3; y < 128; y += 32) for (let x = 3; x < 64; x += 29) { p.set(x, y, C(R.STEEL, 13)); p.set(x + 1, y + 1, C(R.STEEL, 2)); p.set(x, y + 25, C(R.STEEL, 13)); }
      T.METAL = p; }
    // light panel
    { const p = new Pic(16, 128); p.fill((x, y) => x < 2 || x > 13 ? C(R.STEEL, 5) : ((y & 31) < 2 ? C(R.STEEL, 4) : C(R.CYAN, 15 - Math.abs(x - 7.5) * 0.6))); T.LITE = p; }
    // crates
    { const p = new Pic(64, 64), n = fbm(64, 64, 101, [[16, 0.4], [4, 0.3], [2, 0.3]]);
      p.fill((x, y) => C(R.BROWN, 8 + (n(x, y * 0.25) - 0.5) * 5 - ((x & 15) === 15 ? 3 : 0)));
      p.rect(0, 0, 64, 5, C(R.BROWN, 6)); p.rect(0, 59, 64, 5, C(R.BROWN, 5)); p.rect(0, 0, 5, 64, C(R.BROWN, 6)); p.rect(59, 0, 5, 64, C(R.BROWN, 5));
      line(p, 5, 5, 58, 58, C(R.BROWN, 5), 4); line(p, 58, 5, 5, 58, C(R.BROWN, 6), 4);
      for (const [x, y] of [[2, 2], [61, 2], [2, 61], [61, 61]]) p.rect(x - 1, y - 1, 2, 2, C(R.STEEL, 12));
      T.CRATE = p; }
    { const p = new Pic(64, 64), n = fbm(64, 64, 102);
      p.fill((x, y) => C(R.STEEL, 7 + (n(x, y) - 0.5) * 3));
      p.rect(0, 0, 64, 4, C(R.STEEL, 11)); p.rect(0, 60, 64, 4, C(R.STEEL, 3)); p.rect(0, 0, 4, 64, C(R.STEEL, 10)); p.rect(60, 0, 4, 64, C(R.STEEL, 3));
      text3(p, 'UAC', 20, 26, C(R.YELLOW, 10), 2);
      T.CRATE2 = p; }
    { const p = new Pic(64, 16); p.fill((x, y) => C(R.CONCRETE, y < 2 ? 12 : y > 13 ? 4 : 8 + ((x >> 4) & 1) - ((x & 15) === 0 ? 3 : 0))); T.STEP = p; }
    { const p = new Pic(64, 64); p.fill((x, y) => y < 6 || y > 57 ? C(R.STEEL, y < 3 || y > 60 ? 10 : 5) : (((x + y) >> 3) & 1 ? C(R.YELLOW, 11) : C(R.GRAY, 2))); T.PLAT1 = p; }
    // marble
    { const p = new Pic(64, 128), n = fbm(64, 128, 111, [[32, 0.5], [16, 0.3], [8, 0.2]]);
      p.fill((x, y) => { const v = Math.abs(Math.sin((x + y * 0.4) * 0.09 + n(x, y) * 9)); return C(R.GREEN, v < 0.08 ? 2 : 4 + n(x, y) * 4 + v * 1.5); });
      p.rect(0, 0, 64, 2, C(R.OLIVE, 9)); p.rect(0, 126, 64, 2, C(R.OLIVE, 2));
      T.MARBLE = p;
      const f = p.clone(); blob(f, 32, 60, 16, 20, R.GREEN, 7, 7); disc(f, 25, 56, 4, C(R.GRAY, 1)); disc(f, 39, 56, 4, C(R.GRAY, 1)); disc(f, 25, 56, 1.5, C(R.RED, 12)); disc(f, 39, 56, 1.5, C(R.RED, 12));
      for (let i = 0; i < 5; i++) f.rect(24 + i * 3.5, 70, 2, 4, C(R.CONCRETE, 12)); poly(f, [[22, 44], [16, 30], [26, 42]], C(R.OLIVE, 10)); poly(f, [[42, 44], [48, 30], [38, 42]], C(R.OLIVE, 10));
      T.MARBFACE = f; }
    // flesh
    { const p = new Pic(64, 128), n = fbm(64, 128, 121), v = fbm(64, 128, 122, [[16, 0.6], [8, 0.4]]);
      p.fill((x, y) => { const vein = Math.abs(v(x, y) - 0.5) < 0.025; return vein ? C(R.RED, 4) : C(R.PINK, 6 + (n(x, y) - 0.5) * 5 + (n(x - 1, y - 1) - n(x + 1, y + 1)) * 14); });
      T.SKIN = p; }
    // lava wall (3 frames)
    for (let f = 0; f < 3; f++) { const p = new Pic(64, 128), n = fbm(64, 128, 131);
      p.fill((x, y) => { const v = n(x, y + f * 43) * 0.7 + n(x * 2, y * 0.5 - f * 21) * 0.3; return v > 0.55 ? C(R.YELLOW, 8 + v * 8) : C(R.ORANGE, v * 18 - 2); });
      T['FIREWALL' + (f + 1)] = p; }
    // wood
    { const p = new Pic(64, 128), n = fbm(64, 128, 141, [[16, 0.3], [4, 0.4], [2, 0.3]]);
      p.fill((x, y) => C(R.BROWN, 6 + Math.sin((x % 16) * 0.8 + n(x, y) * 6) * 1.5 + (n(x, y * 0.1) - 0.5) * 3 - ((x & 15) === 15 ? 4 : 0) + ((x & 15) === 0 ? 2 : 0)));
      T.WOOD = p; }
    // pipes
    { const p = new Pic(64, 128); p.fill((x, y) => C(R.STEEL, 2));
      for (const [cx, r] of [[8, 6], [24, 4], [40, 7], [56, 5]]) for (let y = 0; y < 128; y++) for (let x = cx - r; x <= cx + r; x++) { const nx = (x - cx) / r; p.set(x, y, C(R.STEEL, shadeAt(nx, 0, Math.sqrt(Math.max(0, 1 - nx * nx)), 8, 6) + ((y & 31) < 2 ? 3 : 0))); }
      T.PIPES = p; }
    // grate (masked)
    { const p = new Pic(64, 128); for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) { if ((x & 7) < 2) p.set(x, y, C(R.STEEL, (x & 7) === 0 ? 9 : 4)); if (y < 4 || y > 123 || (y & 31) === 16) p.set(x, y, C(R.STEEL, y & 1 ? 5 : 8)); } T.GRATE = p; }
    // bloody tech wall
    { const p = T.STARTAN.clone(), n = fbm(64, 128, 151, [[16, 0.6], [4, 0.4]]); p.fill((x, y) => n(x, y) + (y / 128) * 0.3 > 0.72 ? C(R.RED, 3 + n(x, y) * 6) : 0); T.STARBLD = p; }
    // skies
    function sky(w, top, bot, farRamp, nearRamp, seed, hell) {
      const p = new Pic(w, 128), r1 = fbm(w, 1, seed, [[64, 0.6], [16, 0.25], [4, 0.15]]), r2 = fbm(w, 1, seed + 1, [[32, 0.6], [8, 0.3], [4, 0.1]]), cl = fbm(w, 128, seed + 2, [[64, 0.5], [16, 0.3], [8, 0.2]]);
      p.fill((x, y) => {
        const h1 = 60 + r1(x, 0) * 44, h2 = 84 + r2(x, 0) * 40;
        if (y > h2) return C(nearRamp, 2 + (y - h2) * 0.05 + r2(x * 3, y) * 2);
        if (y > h1) return C(farRamp, 4 + (h1 - y) * 0.02 + r1(x * 5, y) * 2);
        const t = y / 90, c = cl(x, y);
        if (hell) return C(c > 0.55 ? R.ORANGE : R.RED, top + t * (bot - top) + (c - 0.5) * 8);
        return C(R.STEEL, top + t * (bot - top) + (c - 0.5) * 3);
      });
      return p;
    }
    T.SKY1 = sky(512, 3, 10, R.STEEL, R.CONCRETE, 161, false);
    T.SKY3 = sky(512, 2, 10, R.RUST, R.GRAY, 171, true);
  }

  // ================================================================ FLATS (64x64)
  function genFlats() {
    const F = (fn) => new Pic(64, 64).fill(fn);
    { const n = fbm(64, 64, 201, [[8, 0.5], [4, 0.3], [2, 0.2]]); FL.FLOOR4 = F((x, y) => { const lx = x & 31, ly = y & 31; let s = 7 + (n(x, y) - 0.5) * 3; if (lx === 0 || ly === 0) s -= 4; else if (lx === 1 || ly === 1) s += 3; if (((x + y) & 7) === 0 && lx > 3 && ly > 3 && lx < 29 && ly < 29) s += 1.5; return C(R.CONCRETE, s); }); }
    { const n = fbm(64, 64, 202); FL.FLOOR5 = F((x, y) => C(R.BROWN, 7 + (n(x, y) - 0.5) * 3 + ((x & 15) === 0 || (y & 15) === 0 ? -3 : 0) + ((((x >> 4) + (y >> 4)) & 1) ? 1 : -1))); }
    { const n = fbm(64, 64, 203, [[16, 0.4], [4, 0.3], [2, 0.3]]); FL.FLOOR7 = F((x, y) => C(R.BROWN, 5 + (n(x, y) - 0.5) * 6 + (n(x - 1, y - 1) - n(x + 1, y + 1)) * 10)); }
    { const n = fbm(64, 64, 204); FL.FLAT20 = F((x, y) => C(R.STEEL, 7 + (n(x, y) - 0.5) * 2 + ((y & 15) === 0 ? -3 : (y & 15) === 1 ? 3 : 0) + ((x & 3) === 0 && (y & 3) === 2 ? 2 : 0))); }
    { const n = fbm(64, 64, 205, [[4, 0.5], [2, 0.5]]); FL.FLAT14 = F((x, y) => C(R.BLUE, 4 + (n(x, y) - 0.5) * 3)); }
    { const n = fbm(64, 64, 206); FL.CEIL3 = F((x, y) => { const lx = x & 31, ly = y & 31; return C(R.CONCRETE, 6 + (n(x, y) - 0.5) * 2 + (lx < 2 || ly < 2 ? -4 : 0) + (lx === 2 || ly === 2 ? 2 : 0)); }); }
    { const n = fbm(64, 64, 207); FL.CEIL5 = F((x, y) => C(R.STEEL, 3 + (n(x, y) - 0.5) * 2 + ((x & 15) === 0 ? 2 : 0))); }
    { const b = FL.CEIL3; FL.TLITE = b.clone(); disc(FL.TLITE, 32, 32, 16, C(R.STEEL, 4)); disc(FL.TLITE, 32, 32, 13, (x, y) => C(R.GRAY, 15 - Math.hypot(x - 32, y - 32) * 0.25)); }
    { FL.TLITE2 = FL.CEIL5.clone(); FL.TLITE2.rect(8, 26, 48, 12, C(R.STEEL, 5)); FL.TLITE2.rect(10, 28, 44, 8, C(R.CYAN, 15)); }
    { const n = fbm(64, 64, 208, [[16, 0.4], [4, 0.3], [2, 0.3]]); FL.CRATOP = F((x, y) => (x < 4 || y < 4 || x > 59 || y > 59) ? C(R.BROWN, 5) : C(R.BROWN, 8 + (n(x * 0.3, y) - 0.5) * 5 - ((y & 15) === 15 ? 3 : 0))); }
    { const n = fbm(64, 64, 209); FL.CRATOP2 = F((x, y) => (x < 3 || y < 3 || x > 60 || y > 60) ? C(R.STEEL, 10) : C(R.STEEL, 6 + (n(x, y) - 0.5) * 2)); }
    { const n = fbm(64, 64, 210); FL.STEP1 = F((x, y) => C(R.CONCRETE, 8 + (n(x, y) - 0.5) * 2 + ((x & 15) === 0 || (y & 15) === 0 ? -3 : 0))); }
    for (const [nm, ramp, hi, seed] of [['NUKAGE', R.GREEN, R.GREEN, 221], ['LAVA', R.ORANGE, R.YELLOW, 222], ['BLOOD', R.RED, R.RED, 223], ['SLIME', R.OLIVE, R.OLIVE, 224]]) {
      const n = fbm(64, 64, seed, [[16, 0.5], [8, 0.3], [4, 0.2]]), m = fbm(64, 64, seed + 9, [[8, 0.6], [4, 0.4]]);
      for (let f = 0; f < 3; f++) FL[nm + (f + 1)] = F((x, y) => { const v = n(x + f * 21, y + f * 7) * 0.7 + m(x - f * 13, y + f * 17) * 0.3; return v > 0.62 ? C(hi, 12 + (v - 0.62) * 20) : C(ramp, 4 + v * 10); });
    }
    FL.RROCK = new Pic(64, 64); { const n = fbm(64, 64, 231, [[16, 0.5], [8, 0.3], [4, 0.2]]); FL.RROCK.fill((x, y) => C(R.RUST, 6 + (n(x, y) - 0.5) * 5 + (n(x - 1, y - 1) - n(x + 1, y + 1)) * 16)); }
    FL.GRNROCK = new Pic(64, 64); { const n = fbm(64, 64, 232, [[16, 0.5], [8, 0.3], [4, 0.2]]); FL.GRNROCK.fill((x, y) => C(R.CONCRETE, 5 + (n(x, y) - 0.5) * 5 + (n(x - 1, y - 1) - n(x + 1, y + 1)) * 16)); }
    { const n = fbm(64, 64, 241, [[32, 0.5], [8, 0.5]]); FL.MFLR = F((x, y) => { const v = Math.abs(Math.sin((x - y) * 0.12 + n(x, y) * 8)); return C(R.GREEN, (x & 31) === 0 || (y & 31) === 0 ? 2 : 5 + n(x, y) * 4 + (v < 0.07 ? -3 : 0)); }); }
    { FL.GATE = F((x, y) => { const d = Math.max(Math.abs(x - 31.5), Math.abs(y - 31.5)); return C(R.ORANGE, (Math.floor(d) % 8 < 3 ? 13 : 5) - d * 0.08); }); }
    { const n = fbm(64, 64, 251); FL.FLOOR1 = F((x, y) => C(R.STEEL, 6 + (n(x, y) - 0.5) * 2 + ((x & 7) === 0 || (y & 7) === 0 ? -2 : 0))); }
    { const n = fbm(64, 64, 252); FL.FLAT5 = F((x, y) => C(R.RUST, 6 + (n(x, y) - 0.5) * 3 + ((x + y) % 8 === 0 || (x - y + 64) % 8 === 0 ? -3 : 0))); }
    FL.F_SKY1 = F(() => C(R.STEEL, 6));
  }

  // ================================================================ SPRITES
  function put(name, pic) { S[name] = pic; }
  const SZ = { w: 64, h: 76 };

  // humanoid rig (zombies, imp, baron, marine)
  function humanoid(cfg, pose) {
    const s = cfg.scale || 1, W = Math.round(SZ.w * s), H = Math.round(SZ.h * s), p = new Pic(W, H), cx = W / 2, yb = H - 1;
    const view = pose.view, ph = (pose.walk || 0) * Math.PI / 2, bob = pose.walk != null ? Math.abs(Math.sin(ph)) * 1.2 : 0;
    const hipY = yb - 26 * s + bob, torsoY = yb - 37 * s + bob, shY = yb - 45 * s + bob, headY = yb - 51.5 * s + bob;
    const legR = 3.4 * s * (cfg.legW || 1), armR = 2.6 * s * (cfg.armW || 1);
    const Lg = cfg.legs, Bd = cfg.body, Sk = cfg.skin, Bt = cfg.boots || cfg.legs;
    const drawLeg = (hx, fx, lift, dark) => {
      const ky = yb - 13 * s - lift * 3.5 * s, fy = yb - 2 * s - lift * 4 * s, kx = (hx + fx) / 2 + (cfg.goat ? (view === 'S' ? -3 * s : 0) : 0);
      limb(p, hx, hipY, kx, ky, legR * 1.1, legR, Lg[0], Lg[1] - dark);
      limb(p, kx, ky, fx, fy, legR, legR * 0.85, Lg[0], Lg[1] - 1 - dark);
      if (cfg.goat) limb(p, fx - 2 * s, fy + 1, fx + 3 * s, fy + 1, 2 * s, 2 * s, Bt[0], Bt[1] - dark);
      else blob(p, fx + (view === 'S' ? 2 * s : 0), fy, 4 * s, 2.4 * s, Bt[0], Bt[1] - dark, 5);
    };
    const drawArm = (sx, sy, hx, hy, dark, claw) => {
      const ex = (sx + hx) / 2 + (hx > sx ? -1 : 1) * 0.5, ey = (sy + hy) / 2 + 3 * s;
      limb(p, sx, sy, ex, ey, armR * 1.15, armR, cfg.arms ? cfg.arms[0] : Sk[0], (cfg.arms ? cfg.arms[1] : Sk[1]) - dark);
      limb(p, ex, ey, hx, hy, armR, armR * 0.9, Sk[0], Sk[1] - dark);
      blob(p, hx, hy, 2.8 * s, 2.8 * s, Sk[0], Sk[1] - 1 - dark, 5);
      if (claw) for (let i = -1; i <= 1; i++) line(p, hx + i * 1.5 * s, hy + 1, hx + i * 2.2 * s, hy + 4 * s, C(claw[0], claw[1]));
    };
    const walkL = pose.walk != null ? Math.max(0, Math.sin(ph)) : 0, walkR = pose.walk != null ? Math.max(0, -Math.sin(ph)) : 0;
    // legs
    if (view === 'S') {
      const sw = pose.walk != null ? Math.sin(ph) * 7 * s : 0;
      drawLeg(cx - 1, cx - sw, walkR * 0.6, 2); drawLeg(cx + 1, cx + sw, walkL * 0.6, 0);
    } else {
      drawLeg(cx - 4.6 * s, cx - 5.4 * s, walkL, view === 'B' ? 1 : 0); drawLeg(cx + 4.6 * s, cx + 5.4 * s, walkR, view === 'B' ? 1 : 0);
    }
    // arms behind torso (side/back views)
    const arm = pose.arm || 'down';
    if (view === 'S' && arm === 'down') drawArm(cx - 1, shY + 1, cx - Math.sin(ph) * 5 * s, yb - 27 * s + bob, 2, cfg.claw);
    if (view === 'B') { drawArm(cx - 8.5 * s, shY + 1, cx - 11 * s, yb - 28 * s, 1); drawArm(cx + 8.5 * s, shY + 1, cx + 11 * s, yb - 28 * s, 1); }
    // torso
    if (view === 'S') blob(p, cx, torsoY, 7 * s * (cfg.bulk || 1), 11.5 * s, Bd[0], Bd[1], 6, 1.2, 7);
    else blob(p, cx, torsoY, 10 * s * (cfg.bulk || 1), 11.5 * s, Bd[0], Bd[1], 6, 1.2, 7);
    if (cfg.vest && view !== 'S') { blob(p, cx, torsoY - 2 * s, 8 * s, 7 * s, cfg.vest[0], cfg.vest[1], 5); if (view === 'F') p.rect(cx - 0.5, torsoY - 8 * s, 1, 12 * s, C(cfg.vest[0], cfg.vest[1] - 3)); }
    if (cfg.belt) p.rect(cx - (view === 'S' ? 7 : 9.5) * s, hipY - 3 * s, (view === 'S' ? 14 : 19) * s, 2.5 * s, C(cfg.belt[0], cfg.belt[1]));
    if (cfg.spikes && view !== 'F') for (let i = 0; i < 4; i++) { const yy = torsoY - 8 * s + i * 5 * s; poly(p, [[cx - 2 * s, yy], [cx + 2 * s, yy], [cx, yy - 5 * s]], C(R.CONCRETE, 12)); }
    if (cfg.spikes) for (const sx of [-1, 1]) if (view !== 'S' || sx > 0) poly(p, [[cx + sx * 8 * s, shY - 1], [cx + sx * 12 * s, shY - 1], [cx + sx * 12 * s, shY - 7 * s]], C(R.CONCRETE, 13));
    // head
    const hx = view === 'S' ? cx + 2 * s : cx, hr = 5.6 * s * (cfg.headS || 1);
    limb(p, cx, shY, hx, headY + 3, 2.6 * s, 2.4 * s, Sk[0], Sk[1] - 2);
    blob(p, hx, headY, hr * (view === 'S' ? 1.05 : 0.95), hr, Sk[0], Sk[1], 6);
    if (cfg.hair) { if (view === 'B') blob(p, hx, headY, hr * 0.95, hr, cfg.hair[0], cfg.hair[1], 4); else blob(p, hx - (view === 'S' ? 1 : 0), headY - hr * 0.55, hr * 0.95, hr * 0.5, cfg.hair[0], cfg.hair[1], 4); }
    if (cfg.helmet) blob(p, hx, headY - hr * 0.3, hr * 1.05, hr * 0.8, cfg.helmet[0], cfg.helmet[1], 5);
    if (cfg.horns) for (const sx of view === 'S' ? [1] : [-1, 1]) { const bx = hx + sx * hr * 0.7; limb(p, bx, headY - hr * 0.6, bx + sx * 4 * s, headY - hr * 1.6, 2 * s, 0.8 * s, R.CONCRETE, 11); limb(p, bx + sx * 4 * s, headY - hr * 1.6, bx + sx * 3 * s, headY - hr * 2.6, 0.9 * s, 0.5 * s, R.CONCRETE, 13); }
    if (view !== 'B') {
      const ey = headY - 0.5 * s, eyeC = cfg.eyes || C(R.GRAY, 1);
      if (view === 'F') { p.rect(hx - 3 * s, ey, 2 * s, 1.4 * s, eyeC); p.rect(hx + 1 * s, ey, 2 * s, 1.4 * s, eyeC); p.rect(hx - 2 * s, headY + 3 * s, 4 * s, 1, C(R.RED, 3)); if (cfg.fangs) { p.set(hx - 1.5 * s, headY + 4 * s, C(R.CONCRETE, 14)); p.set(hx + 1.5 * s, headY + 4 * s, C(R.CONCRETE, 14)); } }
      else { p.rect(hx + 2 * s, ey, 2 * s, 1.4 * s, eyeC); p.rect(hx + 3 * s, headY + 3 * s, 2.5 * s, 1, C(R.RED, 3)); }
    }
    // arms in front
    const gun = cfg.gun;
    if (view === 'F') {
      if (arm === 'down') { drawArm(cx - 9 * s, shY + 1, cx - 11.5 * s, yb - 27 * s + bob, 0, cfg.claw); drawArm(cx + 9 * s, shY + 1, cx + 11.5 * s, yb - 27 * s + bob, 0, cfg.claw); if (gun) { p.rect(cx + 9.5 * s, yb - 34 * s, 3 * s, 16 * s, C(R.STEEL, 3)); p.rect(cx + 10 * s, yb - 34 * s, 1, 16 * s, C(R.STEEL, 7)); } }
      else if (arm === 'aim' || arm === 'fire') {
        drawArm(cx - 9 * s, shY + 1, cx - 3 * s, torsoY + 1, 0); drawArm(cx + 9 * s, shY + 1, cx + 3 * s, torsoY + 2, 0);
        if (gun) { const gw = gun === 'shotgun' ? 7 : 5; p.rect(cx - gw / 2 * s, torsoY - 7 * s, gw * s, 9 * s, C(R.STEEL, 3)); p.rect(cx - gw / 2 * s, torsoY - 7 * s, gw * s, 1, C(R.STEEL, 8)); disc(p, cx, torsoY - 4 * s, 1.6 * s, C(R.GRAY, 1)); if (gun === 'shotgun') disc(p, cx - 1.8 * s, torsoY - 4 * s, 1.3 * s, C(R.GRAY, 1)); }
        if (arm === 'fire') { blob(p, cx, torsoY - 5 * s, 7 * s, 6 * s, R.YELLOW, 15, 3); blob(p, cx, torsoY - 5 * s, 4 * s, 3.5 * s, R.GRAY, 15, 1); }
      } else if (arm === 'throw1') {
        drawArm(cx - 9 * s, shY + 1, cx - 13 * s, headY - 8 * s, 0, cfg.claw); drawArm(cx + 9 * s, shY + 1, cx + 11 * s, yb - 28 * s, 0, cfg.claw);
        if (cfg.ball) blob(p, cx - 13 * s, headY - 11 * s, 5 * s, 5 * s, cfg.ball, 13, 4);
      } else if (arm === 'throw2') {
        drawArm(cx - 9 * s, shY + 1, cx - 4 * s, headY - 11 * s, 0, cfg.claw); drawArm(cx + 9 * s, shY + 1, cx + 12 * s, yb - 28 * s, 0, cfg.claw);
        if (cfg.ball) blob(p, cx - 3 * s, headY - 14 * s, 6 * s, 6 * s, cfg.ball, 14, 3);
      } else if (arm === 'throw3') {
        drawArm(cx - 9 * s, shY + 1, cx - 2 * s, torsoY - 6 * s, 0, cfg.claw); drawArm(cx + 9 * s, shY + 1, cx + 12 * s, yb - 28 * s, 0, cfg.claw);
      } else if (arm === 'pain') {
        drawArm(cx - 9 * s, shY + 1, cx - 13 * s, shY - 6 * s, 0, cfg.claw); drawArm(cx + 9 * s, shY + 1, cx + 13 * s, shY - 6 * s, 0, cfg.claw);
      }
    } else if (view === 'S') {
      if (arm === 'down') drawArm(cx + 1, shY + 1, cx + Math.sin(ph) * 5 * s, yb - 27 * s + bob, 0, cfg.claw);
      else { drawArm(cx + 1, shY + 1, cx + 10 * s, torsoY - 3 * s, 0); if (gun) { p.rect(cx + 4 * s, torsoY - 6 * s, 20 * s, 3 * s, C(R.STEEL, 4)); p.rect(cx + 4 * s, torsoY - 6 * s, 20 * s, 1, C(R.STEEL, 9)); } }
      if (gun && arm === 'down') { p.rect(cx - 2 * s, torsoY - 4 * s, 18 * s, 3 * s, C(R.STEEL, 4)); }
    }
    if (pose.blood) for (let i = 0; i < pose.blood; i++) { const r = rng(pose.blood * 31 + i); blob(p, cx + (r() - 0.5) * 12 * s, torsoY + (r() - 0.6) * 16 * s, 2 + r() * 2, 2 + r() * 2, R.RED, 6, 3); }
    edge(p, 3);
    p.ox = Math.round(W / 2); p.oy = H - 1;
    return p;
  }
  // death sequence from a standing pic: tilt back, fall, lie in blood
  function deathFrames(base, n, bloodRamp = R.RED) {
    const out = [], W = base.w + Math.round(base.h * 0.9), H = base.h;
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / n, ang = -t * Math.PI / 2 * 0.98;
      let q = rotate(base, ang, base.w / 2, base.h - 1, W, H, W / 2 + base.h * 0.42 * Math.sin(t * Math.PI / 2), H - 1 - t * 2);
      if (t >= 0.99) q = scalePic(q, 1, 0.75);
      const pool = new Pic(q.w, q.h); blit(pool, q, 0, 0);
      if (i >= n - 2) { const r = rng(i + 7); for (let k = 0; k < 6 + i * 2; k++) blob(pool, q.w / 2 + (r() - 0.5) * 40, q.h - 2 - r() * 3, 3 + r() * 5, 1.5 + r(), bloodRamp, 4 + r() * 2, 2); blit(pool, q, 0, 0); }
      pool.ox = pool.w >> 1; pool.oy = pool.h - 1;
      out.push(pool);
    }
    return out;
  }
  function gibFrames(ramp, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const p = new Pic(72, 64), t = i / (n - 1), r = rng(77), spread = Math.sin(Math.min(1, t * 1.6) * Math.PI / 2);
      const fall = t > 0.5 ? (t - 0.5) * 2 : 0;
      for (let k = 0; k < 14; k++) {
        const ang = r() * Math.PI * 2, d = 6 + r() * 20, x = 36 + Math.cos(ang) * d * spread, y = 40 - Math.abs(Math.sin(ang)) * d * spread * (1 - fall) + fall * (22 - r() * 4) + (1 - spread) * -4;
        const sz = 2 + r() * 4 * (1 - t * 0.4);
        if (k % 4 === 0) limb(p, x - 3, y, x + 3, y + 1, 1.3, 1.3, R.CONCRETE, 12); else blob(p, x, y, sz, sz * 0.8, k % 3 ? R.RED : ramp, 7 + r() * 3, 4);
      }
      if (t < 0.4) { blob(p, 36, 40, 7 * (1 - t), 12 * (1 - t), ramp, 7, 4); blob(p, 36, 30, 6 * (1 - t), 5 * (1 - t), R.RED, 8, 4); }
      if (t > 0.6) for (let k = 0; k < 10; k++) blob(p, 36 + (r() - 0.5) * 36, 61 - r() * 3, 3 + r() * 4, 1.5, R.RED, 4, 2);
      edge(p, 2); p.oy = 63; out.push(p);
    }
    return out;
  }
  function regHuman(code, cfg, frames) {
    for (const v of ['F', 'S', 'B']) for (let i = 0; i < 4; i++) put(code + 'ABCD'[i] + v, humanoid(cfg, { view: v, walk: i }));
    const atk = frames.attack || [['E', 'aim'], ['F', 'fire']];
    for (const [f, arm] of atk) { put(code + f + 'F', humanoid(cfg, { view: 'F', arm })); put(code + f + 'S', humanoid(cfg, { view: 'S', arm })); }
    put(code + frames.pain, humanoid(cfg, { view: 'F', arm: 'pain', blood: 3 }));
    const dead = deathFrames(humanoid(cfg, { view: 'F', arm: 'pain', blood: 4 }), frames.death.length);
    frames.death.forEach((f, i) => put(code + f, dead[i]));
    if (frames.xdeath) gibFrames(cfg.body[0], frames.xdeath.length).forEach((pic, i) => put(code + frames.xdeath[i], pic));
  }

  function genMonsters() {
    const zombie = { body: [R.OLIVE, 8], vest: [R.GRAY, 4], legs: [R.BROWN, 6], boots: [R.GRAY, 3], skin: [R.SKIN, 9], hair: [R.BROWN, 4], gun: 'rifle', belt: [R.BROWN, 3], eyes: C(R.RED, 9) };
    regHuman('POSS', zombie, { pain: 'G', death: ['H', 'I', 'J', 'K', 'L'], xdeath: ['M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'] });
    const sarge = { body: [R.STEEL, 4], vest: [R.GRAY, 2], legs: [R.OLIVE, 5], boots: [R.GRAY, 2], skin: [R.SKIN, 10], gun: 'shotgun', belt: [R.RED, 6], eyes: C(R.RED, 10), bulk: 1.05 };
    regHuman('SPOS', sarge, { pain: 'G', death: ['H', 'I', 'J', 'K', 'L'], xdeath: ['M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'] });
    const imp = { body: [R.BROWN, 7], legs: [R.BROWN, 6], boots: [R.BROWN, 4], skin: [R.BROWN, 8], arms: [R.BROWN, 7], spikes: true, eyes: C(R.ORANGE, 15), claw: [R.CONCRETE, 13], ball: R.ORANGE, fangs: true, headS: 1.05 };
    regHuman('TROO', imp, { attack: [['E', 'throw1'], ['F', 'throw2'], ['G', 'throw3']], pain: 'H', death: ['I', 'J', 'K', 'L', 'M'], xdeath: ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'] });
    const baron = { scale: 1.2, body: [R.PINK, 8], legs: [R.BROWN, 7], boots: [R.GRAY, 3], skin: [R.PINK, 9], arms: [R.PINK, 8], horns: true, goat: true, eyes: C(R.GREEN, 13), claw: [R.GREEN, 13], ball: R.GREEN, fangs: true, bulk: 1.15, legW: 1.3, armW: 1.25 };
    regHuman('BOSS', baron, { attack: [['E', 'throw1'], ['F', 'throw2'], ['G', 'throw3']], pain: 'H', death: ['I', 'J', 'K', 'L', 'M', 'N', 'O'] });
    const marine = { body: [R.GREEN, 7], vest: [R.GREEN, 5], legs: [R.GREEN, 5], boots: [R.BROWN, 4], skin: [R.SKIN, 9], helmet: [R.GREEN, 7], gun: 'rifle', belt: [R.BROWN, 4], eyes: C(R.GRAY, 2) };
    regHuman('PLAY', marine, { pain: 'G', death: ['H', 'I', 'J', 'K', 'L', 'M', 'N'], xdeath: ['O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'] });

    // ---- Demon (pinky)
    function demon(view, ph, jaw) {
      const p = new Pic(76, 64), cx = 38, yb = 63, bob = ph != null ? Math.abs(Math.sin(ph)) * 1.5 : 0;
      const legs = (x, lift, dark) => { limb(p, x, yb - 22 + bob, x + (view === 'S' ? -3 : 0), yb - 10 - lift * 3, 6, 5, R.PINK, 7 - dark); limb(p, x - (view === 'S' ? 3 : 0), yb - 10 - lift * 3, x, yb - 3 - lift * 3, 5, 4, R.PINK, 6 - dark); blob(p, x + (view === 'S' ? 3 : 0), yb - 2 - lift * 3, 6, 3, R.BROWN, 5 - dark, 4); };
      const l1 = ph != null ? Math.max(0, Math.sin(ph)) : 0, l2 = ph != null ? Math.max(0, -Math.sin(ph)) : 0;
      if (view === 'S') { const sw = ph != null ? Math.sin(ph) * 8 : 0; legs(cx - 8 - sw, l2, 2); legs(cx + 6 + sw, l1, 0); }
      else { legs(cx - 12, l1, view === 'B' ? 1 : 0); legs(cx + 12, l2, view === 'B' ? 1 : 0); }
      if (view === 'S') {
        blob(p, cx - 4, yb - 30 + bob, 20, 15, R.PINK, 8, 6, 1.5, 3);
        blob(p, cx + 14, yb - 34 + bob, 12, 12, R.PINK, 9, 6);
        const o = 3 + (jaw || 0) * 3; poly(p, [[cx + 14, yb - 32 + bob], [cx + 27, yb - 34 + bob - o], [cx + 27, yb - 28 + bob + o], [cx + 14, yb - 26 + bob]], C(R.RED, 3));
        for (let i = 0; i < 4; i++) { p.set(cx + 17 + i * 3, yb - 33 + bob - o + 1, C(R.CONCRETE, 14)); p.set(cx + 17 + i * 3, yb - 27 + bob + o - 1, C(R.CONCRETE, 14)); }
        p.rect(cx + 18, yb - 41 + bob, 3, 2, C(R.YELLOW, 13));
        limb(p, cx + 6, yb - 30 + bob, cx + 14, yb - 20 + bob, 3.5, 3, R.PINK, 7);
      } else {
        blob(p, cx, yb - 30 + bob, 22, 17, R.PINK, 8, 6, 1.5, 3);
        if (view === 'F') {
          const o = (jaw || 0) * 4;
          blob(p, cx, yb - 38 + bob, 15, 12, R.PINK, 9, 6);
          blob(p, cx, yb - 30 + bob + o / 2, 11, 5 + o, R.RED, 3, 2);
          for (let i = -4; i <= 4; i++) { poly(p, [[cx + i * 2.4 - 1, yb - 35 + bob], [cx + i * 2.4 + 1, yb - 35 + bob], [cx + i * 2.4, yb - 31 + bob]], C(R.CONCRETE, 14)); poly(p, [[cx + i * 2.4 - 1, yb - 25 + bob + o], [cx + i * 2.4 + 1, yb - 25 + bob + o], [cx + i * 2.4, yb - 29 + bob + o]], C(R.CONCRETE, 13)); }
          p.rect(cx - 7, yb - 45 + bob, 3, 2, C(R.YELLOW, 13)); p.rect(cx + 4, yb - 45 + bob, 3, 2, C(R.YELLOW, 13));
          limb(p, cx - 16, yb - 36 + bob, cx - 20, yb - 22 + bob, 4, 3, R.PINK, 7); limb(p, cx + 16, yb - 36 + bob, cx + 20, yb - 22 + bob, 4, 3, R.PINK, 7);
        } else { for (let i = 0; i < 5; i++) blob(p, cx, yb - 44 + i * 5 + bob, 3, 2.5, R.PINK, 11, 3); limb(p, cx - 18, yb - 36 + bob, cx - 21, yb - 24 + bob, 4, 3, R.PINK, 6); limb(p, cx + 18, yb - 36 + bob, cx + 21, yb - 24 + bob, 4, 3, R.PINK, 6); }
      }
      edge(p, 3); p.oy = 63; return p;
    }
    for (const v of ['F', 'S', 'B']) for (let i = 0; i < 4; i++) put('SARG' + 'ABCD'[i] + v, demon(v, i * Math.PI / 2, 0));
    put('SARGEF', demon('F', null, 1)); put('SARGFF', demon('F', null, 2)); put('SARGGF', demon('F', null, 0.5));
    put('SARGES', demon('S', null, 1)); put('SARGFS', demon('S', null, 2)); put('SARGGS', demon('S', null, 0.5));
    { const pn = demon('F', null, 1.5); for (let k = 0; k < 4; k++) blob(pn, 30 + k * 5, 30 + (k % 2) * 6, 3, 3, R.RED, 6, 3); put('SARGH', pn); }
    deathFrames(demon('F', null, 2), 6).forEach((pic, i) => put('SARG' + 'IJKLMN'[i], pic));

    // ---- Cacodemon
    function caco(view, mouth, eyeShut, glow) {
      const p = new Pic(72, 72), cx = 36, cy = 38, r = 27;
      if (view !== 'B' || true) for (const sx of [-1, 1]) { if (view === 'S' && sx < 0) continue; limb(p, cx + sx * 12, cy - 20, cx + sx * 18, cy - 33, 3.5, 1.2, R.CONCRETE, 11); }
      blob(p, cx, cy, r, r, R.RED, 8, 7, 2, 5);
      const bumps = rng(9); for (let k = 0; k < 16; k++) { const a = bumps() * 6.28, d = bumps() * r * 0.85; blob(p, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2, 2, R.RED, 10, 3); }
      if (view === 'F') {
        const m = 6 + (mouth || 0) * 5;
        blob(p, cx, cy + 10, 17, m, R.RED, 2, 1);
        blob(p, cx, cy + 12 + m * 0.3, 10, m * 0.45, R.BLUE, 7, 4);
        for (let i = -6; i <= 6; i++) { poly(p, [[cx + i * 2.6 - 1.2, cy + 10 - m + 1], [cx + i * 2.6 + 1.2, cy + 10 - m + 1], [cx + i * 2.6, cy + 10 - m + 5]], C(R.CONCRETE, 14)); poly(p, [[cx + i * 2.4 - 1.2, cy + 10 + m - 1], [cx + i * 2.4 + 1.2, cy + 10 + m - 1], [cx + i * 2.4, cy + 10 + m - 4]], C(R.CONCRETE, 13)); }
        if (glow) blob(p, cx, cy + 10, 8, m * 0.6, R.PURPLE, 15, 2);
        blob(p, cx, cy - 10, 8, 7, R.CONCRETE, 13, 4);
        if (eyeShut) p.rect(cx - 8, cy - 10, 16, 2, C(R.RED, 4)); else { blob(p, cx, cy - 10, 4.5, 5, R.GREEN, 11, 4); disc(p, cx, cy - 10, 1.6, C(R.GRAY, 1)); }
      } else if (view === 'S') {
        blob(p, cx + 18, cy + 8, 9, 6, R.RED, 2, 1);
        for (let i = 0; i < 4; i++) p.set(cx + 14 + i * 3, cy + 4, C(R.CONCRETE, 14));
        blob(p, cx + 18, cy - 10, 5, 6, R.CONCRETE, 13, 4); blob(p, cx + 21, cy - 10, 2.5, 3.5, R.GREEN, 11, 3);
      }
      edge(p, 3); p.oy = 71; return p;
    }
    for (const v of ['F', 'S', 'B']) put('HEADA' + v, caco(v, 0));
    put('HEADBF', caco('F', 0.6)); put('HEADCF', caco('F', 1.2)); put('HEADDF', caco('F', 1.4, false, true));
    put('HEADEF', caco('F', 0.3, true)); put('HEADFF', caco('F', 0.5, true));
    { const base = caco('F', 1.5, true); const ds = [];
      for (let i = 0; i < 6; i++) { const t = (i + 1) / 6, q = scalePic(base, 1 + t * 0.15, 1 - t * 0.55); const p = new Pic(90, 72); blit(p, q, (90 - q.w) >> 1, 71 - q.h + Math.round(t * 2)); const r = rng(i + 3); for (let k = 0; k < i * 3; k++) blob(p, 45 + (r() - 0.5) * 60, 68 - r() * 6 * (1 - t), 3 + r() * 3, 2, R.RED, 4 + r() * 3, 2); if (i >= 1) for (let k = 0; k < 4; k++) blob(p, 45 + (r() - 0.5) * 30, 30 + r() * 30, 3, 3, R.BLUE, 6, 3); p.oy = 71; ds.push(p); }
      ds.forEach((pic, i) => put('HEAD' + 'GHIJKL'[i], pic)); }

    // ---- Lost soul
    function soul(ph, open, flame = true) {
      const p = new Pic(44, 56), cx = 22, cy = 34, r = rng(ph * 13 + 1);
      if (flame) for (let k = 0; k < 22; k++) { const a = r() * Math.PI * 2, d = 8 + r() * 6; blob(p, cx + Math.cos(a) * d * 0.9, cy - 8 + Math.sin(a) * d * 0.7 - r() * 12, 3 + r() * 3, 4 + r() * 4, r() < 0.5 ? R.ORANGE : R.YELLOW, 11 + r() * 4, 4); }
      blob(p, cx, cy, 12, 13, R.CONCRETE, 12, 6);
      blob(p, cx - 5, cy - 1, 3.5, 3.5, R.GRAY, 1, 0); blob(p, cx + 5, cy - 1, 3.5, 3.5, R.GRAY, 1, 0);
      disc(p, cx - 5, cy - 1, 1, C(R.ORANGE, 15)); disc(p, cx + 5, cy - 1, 1, C(R.ORANGE, 15));
      poly(p, [[cx - 1.5, cy + 4], [cx + 1.5, cy + 4], [cx, cy + 7]], C(R.GRAY, 2));
      const m = open ? 5 : 2; p.rect(cx - 6, cy + 8, 12, m, C(R.GRAY, 2)); for (let i = -5; i <= 5; i += 2) { p.rect(cx + i, cy + 8, 1.5, 2, C(R.CONCRETE, 14)); p.rect(cx + i, cy + 6 + m, 1.5, 2, C(R.CONCRETE, 13)); }
      edge(p, 2); p.oy = 55; return p;
    }
    put('SKULA', soul(1)); put('SKULB', soul(2)); put('SKULC', soul(3, true)); put('SKULD', soul(4, true)); put('SKULE', soul(5, true));
    explosionFrames(R.ORANGE, 6, 0.8).forEach((pic, i) => put('SKUL' + 'FGHIJK'[i], pic));

    // ---- Cyberdemon
    function cyber(view, ph, fire) {
      const p = new Pic(128, 124), cx = 64, yb = 123, bob = ph != null ? Math.abs(Math.sin(ph)) * 2 : 0, sw = ph != null ? Math.sin(ph) * 12 : 0;
      const legL = (fx, lift, dark) => { limb(p, cx - 12, yb - 50 + bob, fx, yb - 26 - lift * 6, 9, 7, R.BROWN, 6 - dark); limb(p, fx, yb - 26 - lift * 6, fx - 3, yb - 6 - lift * 6, 7, 5, R.BROWN, 5 - dark); blob(p, fx - 2, yb - 4 - lift * 6, 8, 4, R.GRAY, 3, 4); };
      const legR = (fx, lift, dark) => { limb(p, cx + 12, yb - 50 + bob, fx, yb - 26 - lift * 6, 8, 6, R.STEEL, 8 - dark); limb(p, fx, yb - 26 - lift * 6, fx + 2, yb - 5 - lift * 6, 5, 4, R.STEEL, 9 - dark); blob(p, fx + 2, yb - 4 - lift * 6, 8, 4, R.STEEL, 6, 4); };
      if (view === 'S') { legL(cx - sw, Math.max(0, -Math.sin(ph || 0)), 2); legR(cx + sw, Math.max(0, Math.sin(ph || 0)), 0); }
      else { legL(cx - 18, Math.max(0, Math.sin(ph || 0)), 0); legR(cx + 18, Math.max(0, -Math.sin(ph || 0)), 0); }
      blob(p, cx, yb - 70 + bob, view === 'S' ? 20 : 30, 26, R.BROWN, 7, 6, 2, 11);
      if (view !== 'S') for (let i = 0; i < 3; i++) p.rect(cx - 16, yb - 78 + i * 8 + bob, 32, 2, C(R.BROWN, 4));
      const hx = view === 'S' ? cx + 8 : cx; blob(p, hx, yb - 98 + bob, 10, 10, R.BROWN, 8, 6);
      for (const sx of view === 'S' ? [1] : [-1, 1]) { limb(p, hx + sx * 7, yb - 104 + bob, hx + sx * 16, yb - 112 + bob, 3, 1.5, R.CONCRETE, 12); limb(p, hx + sx * 16, yb - 112 + bob, hx + sx * 14, yb - 121 + bob, 1.5, 0.6, R.CONCRETE, 14); }
      if (view !== 'B') { p.rect(hx - 5 + (view === 'S' ? 4 : 0), yb - 100 + bob, 3, 2, C(R.YELLOW, 14)); if (view === 'F') p.rect(hx + 2, yb - 100 + bob, 3, 2, C(R.YELLOW, 14)); p.rect(hx - 4, yb - 93 + bob, 8, 2, C(R.RED, 3)); }
      // rocket arm (screen left in front view)
      if (view === 'F') {
        limb(p, cx - 26, yb - 86 + bob, cx - 34, yb - 62 + bob, 7, 6, R.BROWN, 7);
        limb(p, cx - 34, yb - 70 + bob, cx - 34, yb - 44 + bob, 8, 8, R.STEEL, 8); disc(p, cx - 34, yb - 44 + bob, 5, C(R.GRAY, 1));
        limb(p, cx + 26, yb - 86 + bob, cx + 34, yb - 56 + bob, 7, 5, R.BROWN, 7); blob(p, cx + 34, yb - 54 + bob, 5, 5, R.BROWN, 6, 4);
        if (fire) { blob(p, cx - 34, yb - 44 + bob, 12, 12, R.YELLOW, 15, 2); blob(p, cx - 34, yb - 44 + bob, 6, 6, R.GRAY, 15, 1); }
      } else if (view === 'S') {
        limb(p, cx, yb - 86 + bob, cx + 22, yb - 70 + bob, 7, 6, R.BROWN, 7); limb(p, cx + 16, yb - 70 + bob, cx + 44, yb - 70 + bob, 7, 7, R.STEEL, 8);
      } else { limb(p, cx - 26, yb - 86 + bob, cx - 34, yb - 60 + bob, 7, 6, R.BROWN, 6); limb(p, cx + 26, yb - 86 + bob, cx + 34, yb - 60 + bob, 7, 6, R.STEEL, 7); }
      edge(p, 3); p.oy = 123; return p;
    }
    for (const v of ['F', 'S', 'B']) for (let i = 0; i < 4; i++) put('CYBR' + 'ABCD'[i] + v, cyber(v, i * Math.PI / 2));
    put('CYBREF', cyber('F', null, false)); put('CYBRFF', cyber('F', null, true));
    { const g = cyber('F', null); for (let k = 0; k < 6; k++) blob(g, 50 + k * 6, 60 + (k % 3) * 8, 4, 4, R.RED, 6, 3); put('CYBRG', g); }
    { const base = cyber('F', null), exp = explosionFrames(R.ORANGE, 4, 1.4), dead = deathFrames(base, 5);
      const seq = [];
      for (let i = 0; i < 9; i++) { const d = dead[Math.min(4, Math.floor(i / 2))], p = new Pic(d.w, 124); blit(p, d, 0, 124 - d.h); if (i < 6) { const e = exp[i % 4]; blit(p, e, (d.w >> 1) - (e.w >> 1) + (i % 2 ? 18 : -14), 70 - (e.h >> 1) + i * 6); } p.oy = 123; seq.push(p); }
      seq.forEach((pic, i) => put('CYBR' + 'HIJKLMNOP'[i], pic)); }
  }

  function explosionFrames(ramp, n, size = 1) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / n, R0 = (10 + t * 20) * size, W = Math.ceil(R0 * 2 + 8), p = new Pic(W, W), c = W / 2, r = rng(i * 17 + 3);
      for (let k = 0; k < 18; k++) { const a = r() * 6.28, d = r() * R0 * 0.6; blob(p, c + Math.cos(a) * d, c + Math.sin(a) * d, R0 * (0.35 + r() * 0.3) * (1 - t * 0.3), R0 * (0.35 + r() * 0.3) * (1 - t * 0.3), t > 0.7 && k % 3 === 0 ? R.GRAY : (k % 2 ? ramp : R.YELLOW), 15 - t * 7 - r() * 2, 3); }
      if (t < 0.6) blob(p, c, c, R0 * 0.35, R0 * 0.35, R.GRAY, 15, 1);
      p.ox = W >> 1; p.oy = Math.round(c + R0 * 0.5); out.push(p);
    }
    return out;
  }

  function genMissiles() {
    const ball = (ramp, r, n, hot = R.YELLOW) => { const out = []; for (let i = 0; i < n; i++) { const p = new Pic(r * 2 + 6, r * 2 + 6), c = r + 3, g = rng(i + r); blob(p, c, c, r, r, ramp, 12, 3); blob(p, c - 1, c - 1, r * 0.6, r * 0.6, hot, 15, 2); for (let k = 0; k < 5; k++) p.set(c + (g() - 0.5) * r * 2.4, c + (g() - 0.5) * r * 2.4, C(hot, 15)); p.ox = c; p.oy = c + 4; out.push(p); } return out; };
    const reg = (code, frames, deathRamp) => { frames.forEach((p, i) => put(code + 'AB'[i], p)); explosionFrames(deathRamp, 3, 0.6).forEach((p, i) => put(code + 'CDE'[i], p)); };
    reg('BAL1', ball(R.ORANGE, 6, 2), R.ORANGE);
    reg('BAL2', ball(R.PURPLE, 6, 2, R.PINK), R.PURPLE);
    reg('BAL7', ball(R.GREEN, 8, 2), R.GREEN);
    { const p = new Pic(24, 16); limb(p, 5, 8, 17, 8, 3, 3, R.STEEL, 9); poly(p, [[17, 5], [23, 8], [17, 11]], C(R.RED, 9)); blob(p, 4, 8, 4, 3, R.YELLOW, 15, 2); p.ox = 12; p.oy = 12; put('MISLA', p); }
    explosionFrames(R.ORANGE, 3, 1.2).forEach((p, i) => put('MISL' + 'BCD'[i], p));
    ball(R.BLUE, 6, 2, R.CYAN).forEach((p, i) => put('PLSS' + 'AB'[i], p));
    explosionFrames(R.CYAN, 5, 0.5).forEach((p, i) => put('PLSS' + 'CDEFG'[i], p));
    ball(R.GREEN, 13, 2, R.GRAY).forEach((p, i) => put('BFS1' + 'AB'[i], p));
    explosionFrames(R.GREEN, 6, 1.6).forEach((p, i) => put('BFS1' + 'CDEFGH'[i], p));
    explosionFrames(R.GREEN, 4, 0.8).forEach((p, i) => put('BFE2' + 'ABCD'[i], p));
    // bullet puff, blood
    { const a = new Pic(12, 12); blob(a, 6, 6, 3, 3, R.YELLOW, 15, 2); a.oy = 9; put('PUFFA', a);
      for (let i = 0; i < 3; i++) { const p = new Pic(16, 16); blob(p, 8, 8, 3 + i * 1.5, 3 + i * 1.5, R.GRAY, 11 - i * 2, 3); p.oy = 12 - i; put('PUFF' + 'BCD'[i], p); } }
    for (let i = 0; i < 3; i++) { const p = new Pic(14, 14), r = rng(i + 91); for (let k = 0; k < 3 + i * 2; k++) blob(p, 7 + (r() - 0.5) * (4 + i * 3), 7 + (r() - 0.5) * (4 + i * 3), 1.5 + r() * (1 + i * 0.6), 1.5 + r() * (1 + i * 0.6), R.RED, 7, 3); p.oy = 10; put('BLUD' + 'ABC'[i], p); }
    // teleport & item fog
    for (let i = 0; i < 10; i++) { const p = new Pic(40, 64), r = rng(i * 7 + 5), t = i / 9; for (let k = 0; k < 26; k++) { const x = 20 + (r() - 0.5) * 30 * (0.4 + t), y = 60 - r() * 58 * (1 - t * 0.4); blob(p, x, y, 1.5 + r() * 3 * (1 - t), 1.5 + r() * 3 * (1 - t), k % 3 ? R.GREEN : R.GRAY, 13 - t * 4, 2); } p.oy = 63; put('TFOG' + 'ABCDEFGHIJ'[i], p); }
    for (let i = 0; i < 5; i++) { const p = new Pic(28, 32), r = rng(i * 11 + 7), t = i / 4; for (let k = 0; k < 14; k++) blob(p, 14 + (r() - 0.5) * 20 * (0.4 + t), 28 - r() * 26, 1 + r() * 2 * (1 - t) + 0.5, 1 + r() * 2 * (1 - t) + 0.5, k % 2 ? R.YELLOW : R.GRAY, 14 - t * 5, 2); p.oy = 31; put('IFOG' + 'ABCDE'[i], p); }
  }

  function genItems() {
    const P = (w, h, fn, oy) => { const p = new Pic(w, h); fn(p); edge(p, 2); p.oy = oy != null ? oy : h - 1; return p; };
    // barrel
    const barrel = (ph) => P(26, 34, p => { for (let y = 4; y < 34; y++) for (let x = 1; x < 25; x++) { const nx = (x - 12.5) / 12; p.set(x, y, C(R.STEEL, shadeAt(nx, 0, Math.sqrt(1 - nx * nx), 8, 7) - ((y - 4) % 10 < 2 ? 2 : 0))); } blob(p, 13, 5, 11, 3.5, R.GREEN, 12 + ph, 3); for (let x = 3; x < 23; x += 3) p.set(x, 8 + (x % 2), C(R.GREEN, 13)); }, 33);
    put('BAR1A', barrel(0)); put('BAR1B', barrel(2));
    explosionFrames(R.ORANGE, 5, 1.1).forEach((p, i) => put('BAR1' + 'CDEFG'[i], p));
    // ammo
    put('CLIPA', P(8, 14, p => { p.rect(1, 1, 6, 12, C(R.STEEL, 4)); p.rect(1, 1, 2, 12, C(R.STEEL, 8)); p.rect(2, 0, 4, 2, C(R.GOLD, 12)); }));
    put('AMMOA', P(30, 18, p => { p.rect(1, 6, 28, 11, C(R.OLIVE, 6)); p.rect(1, 6, 28, 2, C(R.OLIVE, 10)); p.rect(1, 15, 28, 2, C(R.OLIVE, 3)); for (let x = 3; x < 27; x += 3) { p.rect(x, 1, 2, 6, C(R.GOLD, 11)); p.set(x, 1, C(R.GOLD, 14)); } text3(p, 'AMMO', 7, 9, C(R.OLIVE, 13)); }));
    put('SHELA', P(18, 10, p => { for (let i = 0; i < 4; i++) { limb(p, 2 + i * 4, 3, 2 + i * 4, 8, 1.6, 1.6, R.RED, 9); p.rect(1 + i * 4, 7, 3, 2, C(R.GOLD, 12)); } }));
    put('SBOXA', P(32, 16, p => { p.rect(1, 3, 30, 12, C(R.RED, 7)); p.rect(1, 3, 30, 2, C(R.RED, 11)); p.rect(1, 13, 30, 2, C(R.RED, 3)); p.rect(4, 0, 24, 4, C(R.GOLD, 11)); text3(p, 'SHEL', 8, 7, C(R.GOLD, 13)); }));
    put('ROCKA', P(10, 28, p => { limb(p, 5, 6, 5, 24, 3, 3, R.OLIVE, 8); poly(p, [[2, 7], [8, 7], [5, 0]], C(R.RED, 10)); p.rect(1, 22, 8, 5, C(R.STEEL, 6)); }));
    put('BROKA', P(54, 22, p => { p.rect(1, 6, 52, 15, C(R.BROWN, 6)); p.rect(1, 6, 52, 2, C(R.BROWN, 10)); for (let i = 0; i < 5; i++) { limb(p, 6 + i * 10, 4, 6 + i * 10, 10, 3, 3, R.OLIVE, 9); p.set(6 + i * 10, 1, C(R.RED, 11)); } }));
    put('CELLA', P(16, 12, p => { p.rect(1, 2, 14, 9, C(R.STEEL, 6)); p.rect(1, 2, 14, 2, C(R.STEEL, 10)); p.rect(4, 5, 8, 3, C(R.GREEN, 13)); p.rect(6, 0, 4, 2, C(R.STEEL, 9)); }));
    put('CELPA', P(32, 22, p => { p.rect(1, 3, 30, 18, C(R.STEEL, 6)); p.rect(1, 3, 30, 2, C(R.STEEL, 11)); p.rect(4, 8, 24, 8, C(R.GREEN, 12)); for (let x = 6; x < 28; x += 4) p.rect(x, 9, 2, 6, C(R.GREEN, 15)); p.rect(12, 0, 8, 3, C(R.STEEL, 9)); }));
    put('BPAKA', P(24, 22, p => { blob(p, 12, 13, 10, 9, R.BROWN, 7, 5); p.rect(5, 12, 14, 2, C(R.BROWN, 3)); blob(p, 12, 5, 6, 3, R.BROWN, 9, 4); p.rect(4, 15, 2, 6, C(R.GRAY, 3)); p.rect(18, 15, 2, 6, C(R.GRAY, 3)); }));
    // health
    put('STIMA', P(16, 18, p => { p.rect(1, 3, 14, 14, C(R.GRAY, 13)); p.rect(1, 3, 14, 2, C(R.GRAY, 15)); p.rect(1, 15, 14, 2, C(R.GRAY, 9)); p.rect(6, 6, 4, 9, C(R.RED, 10)); p.rect(3, 9, 10, 3, C(R.RED, 10)); p.rect(5, 0, 6, 3, C(R.GRAY, 11)); }));
    put('MEDIA', P(30, 22, p => { p.rect(1, 5, 28, 16, C(R.GRAY, 13)); p.rect(1, 5, 28, 2, C(R.GRAY, 15)); p.rect(1, 19, 28, 2, C(R.GRAY, 9)); p.rect(12, 7, 6, 12, C(R.RED, 10)); p.rect(8, 10, 14, 6, C(R.RED, 10)); p.rect(11, 1, 8, 4, C(R.GRAY, 10)); }));
    for (let i = 0; i < 4; i++) put('BON1' + 'ABCD'[i], P(14, 20, p => { blob(p, 7, 13, 6, 6, R.BLUE, 8 + i, 5); limb(p, 7, 3, 7, 8, 2, 2, R.BLUE, 7 + i); p.rect(5, 0, 5, 3, C(R.BROWN, 8)); blob(p, 5, 11, 2, 2, R.CYAN, 15, 1); }));
    for (let i = 0; i < 4; i++) put('BON2' + 'ABCD'[i], P(18, 16, p => { blob(p, 9, 9, 8, 7, R.GREEN, 7 + i * 0.7, 6); p.rect(1, 9, 16, 6, 0); for (let x = 1; x < 17; x++) for (let y = 9; y < 16; y++) p.px[y * 18 + x] = 0; p.rect(3, 9, 12, 2, C(R.GREEN, 4)); p.rect(5, 6, 8, 2, C(R.CYAN, 12 + i * 0.7)); }));
    const armor = (ramp, lit) => P(32, 20, p => { blob(p, 16, 10, 14, 9, ramp, 8 + lit, 6); p.rect(13, 2, 6, 5, 0); for (let y = 1; y < 7; y++) for (let x = 12; x < 20; x++) p.px[y * 32 + x] = 0; limb(p, 6, 3, 10, 12, 3, 3, ramp, 9 + lit); limb(p, 26, 3, 22, 12, 3, 3, ramp, 9 + lit); p.rect(8, 13, 16, 2, C(ramp, 4)); });
    put('ARM1A', armor(R.GREEN, 0)); put('ARM1B', armor(R.GREEN, 3)); put('ARM2A', armor(R.BLUE, 0)); put('ARM2B', armor(R.BLUE, 3));
    const sphere = (ramp, i, face = true) => P(28, 28, p => { blob(p, 14, 14, 12, 12, ramp, 9 + i, 6); if (face) { disc(p, 10, 12, 1.8, C(ramp, 3 + i)); disc(p, 18, 12, 1.8, C(ramp, 3 + i)); p.rect(10, 18, 8, 1.5, C(ramp, 4 + i)); } blob(p, 10, 8, 3, 2.5, R.GRAY, 15, 1); }, 26);
    for (let i = 0; i < 4; i++) { put('SOUL' + 'ABCD'[i], sphere(R.BLUE, i * 0.8)); put('PINV' + 'ABCD'[i], sphere(R.GREEN, i * 0.8)); put('PINS' + 'ABCD'[i], (() => { const p = sphere(R.RED, i * 0.8, false); for (let k = 0; k < p.px.length; k++) if (p.px[k] && ((k + (k / p.w | 0) + i) & 1)) p.px[k] = 0; return p; })()); }
    put('PSTRA', P(24, 20, p => { p.rect(1, 4, 22, 15, C(R.GRAY, 2)); p.rect(1, 4, 22, 2, C(R.GRAY, 6)); p.rect(9, 6, 6, 11, C(R.RED, 11)); p.rect(5, 9, 14, 5, C(R.RED, 11)); p.rect(8, 0, 8, 4, C(R.GRAY, 5)); }));
    put('SUITA', P(22, 48, p => { blob(p, 11, 8, 6, 7, R.GREEN, 9, 5); p.rect(7, 6, 8, 5, C(R.CYAN, 11)); blob(p, 11, 22, 9, 10, R.GREEN, 8, 5); limb(p, 7, 30, 6, 46, 3.5, 3, R.GREEN, 7); limb(p, 15, 30, 16, 46, 3.5, 3, R.GREEN, 7); limb(p, 3, 16, 1, 30, 2.5, 2, R.GREEN, 7); limb(p, 19, 16, 21, 30, 2.5, 2, R.GREEN, 7); }));
    for (let i = 0; i < 4; i++) put('PMAP' + 'ABCD'[i], P(28, 22, p => { p.rect(1, 4, 26, 17, C(R.STEEL, 6)); p.rect(1, 4, 26, 2, C(R.STEEL, 11)); p.rect(4, 8, 20, 10, C(R.GREEN, 3)); for (let k = 0; k < 5; k++) p.rect(5 + ((k * 7 + i * 3) % 16), 9 + ((k * 5 + i) % 8), 3, 1, C(R.GREEN, 14)); }));
    for (let i = 0; i < 2; i++) put('PVIS' + 'AB'[i], P(26, 12, p => { blob(p, 7, 6, 6, 5, R.GRAY, 3, 4); blob(p, 19, 6, 6, 5, R.GRAY, 3, 4); disc(p, 7, 6, 3, C(R.RED, 9 + i * 4)); disc(p, 19, 6, 3, C(R.RED, 9 + i * 4)); p.rect(12, 5, 2, 2, C(R.GRAY, 5)); }));
    for (const [code, ramp] of [['RKEY', R.RED], ['BKEY', R.BLUE], ['YKEY', R.YELLOW]]) for (let i = 0; i < 2; i++) put(code + 'AB'[i], P(10, 14, p => { p.rect(1, 1, 8, 12, C(ramp, 8 + i * 5)); p.rect(1, 1, 8, 2, C(ramp, 12 + i * 3)); p.rect(3, 5, 4, 4, C(R.GRAY, i ? 15 : 10)); }));
    // weapons on the floor
    put('CSAWA', P(62, 22, p => { p.rect(2, 8, 34, 8, C(R.STEEL, 9)); for (let x = 2; x < 36; x += 3) { p.set(x, 7, C(R.STEEL, 13)); p.set(x + 1, 16, C(R.STEEL, 13)); } blob(p, 44, 12, 12, 8, R.ORANGE, 9, 5); limb(p, 48, 3, 58, 3, 2, 2, R.GRAY, 3); limb(p, 50, 3, 52, 12, 1.5, 1.5, R.GRAY, 3); }));
    put('SHOTA', P(62, 12, p => { p.rect(2, 3, 38, 3, C(R.STEEL, 5)); p.rect(2, 6, 34, 2, C(R.STEEL, 3)); p.rect(20, 5, 12, 4, C(R.BROWN, 7)); poly(p, [[38, 3], [60, 5], [60, 11], [44, 9], [38, 8]], C(R.BROWN, 6)); }));
    put('SGN2A', P(56, 14, p => { p.rect(2, 3, 32, 3, C(R.STEEL, 6)); p.rect(2, 6, 32, 3, C(R.STEEL, 4)); poly(p, [[32, 2], [54, 5], [54, 12], [40, 10], [32, 9]], C(R.BROWN, 6)); }));
    put('MGUNA', P(56, 18, p => { for (let i = 0; i < 3; i++) p.rect(2, 4 + i * 3, 30, 2, C(R.STEEL, 6 + i)); blob(p, 38, 9, 10, 7, R.STEEL, 5, 5); limb(p, 42, 14, 46, 17, 2, 2, R.GRAY, 3); p.rect(28, 1, 14, 3, C(R.STEEL, 8)); }));
    put('LAUNA', P(64, 18, p => { limb(p, 4, 8, 50, 8, 6, 6, R.OLIVE, 7); disc(p, 4, 8, 4, C(R.GRAY, 1)); p.rect(30, 12, 6, 5, C(R.GRAY, 3)); p.rect(50, 4, 12, 9, C(R.OLIVE, 5)); }));
    put('PLASA', P(56, 18, p => { p.rect(2, 6, 40, 6, C(R.STEEL, 7)); for (let x = 6; x < 38; x += 6) p.rect(x, 5, 2, 8, C(R.CYAN, 12)); blob(p, 46, 10, 9, 7, R.STEEL, 6, 5); p.rect(38, 13, 4, 4, C(R.GRAY, 3)); }));
    put('BFUGA', P(64, 32, p => { p.rect(2, 6, 52, 22, C(R.STEEL, 6)); p.rect(2, 6, 52, 3, C(R.STEEL, 11)); blob(p, 22, 17, 9, 7, R.GREEN, 13, 3); p.rect(54, 10, 8, 14, C(R.STEEL, 4)); p.rect(8, 26, 40, 3, C(R.STEEL, 3)); }));
    // decorations
    put('COLUA', P(24, 50, p => { limb(p, 12, 16, 12, 46, 2.5, 3, R.STEEL, 7); blob(p, 12, 47, 8, 3, R.STEEL, 5, 4); blob(p, 12, 9, 9, 8, R.GRAY, 14, 3); blob(p, 12, 8, 5, 4, R.GRAY, 15, 1); }));
    put('ELECA', P(32, 128, p => { for (let y = 0; y < 128; y++) for (let x = 3; x < 29; x++) { const nx = (x - 16) / 13; p.set(x, y, C(R.STEEL, shadeAt(nx, 0, Math.sqrt(Math.max(0, 1 - nx * nx)), 7, 6) + ((y & 31) < 3 ? 3 : 0))); } for (let y = 12; y < 128; y += 32) { p.rect(10, y, 12, 8, C(R.GRAY, 2)); p.rect(12, y + 2, 3, 2, C(R.RED, 13)); p.rect(17, y + 4, 3, 2, C(R.GREEN, 13)); } }));
    for (const [code, ramp] of [['TRED', R.RED], ['TBLU', R.BLUE], ['TGRN', R.GREEN]]) for (let i = 0; i < 4; i++) put(code + 'ABCD'[i], P(20, 70, p => { limb(p, 10, 22, 10, 68, 2.5, 3, R.STEEL, 6); blob(p, 10, 20, 5, 3, R.STEEL, 8, 4); const r = rng(i * 5 + ramp); for (let k = 0; k < 9; k++) blob(p, 10 + (r() - 0.5) * 7, 13 - r() * 10, 2 + r() * 2, 3 + r() * 3, k % 3 ? ramp : R.GRAY, 12 + r() * 3, 3); }));
    put('CANDA', P(8, 16, p => { p.rect(2, 6, 4, 10, C(R.CONCRETE, 13)); blob(p, 4, 3, 2, 3, R.YELLOW, 15, 1); }));
    put('CBRAA', P(30, 62, p => { limb(p, 15, 14, 15, 58, 2, 2.5, R.GOLD, 9); blob(p, 15, 59, 9, 3, R.GOLD, 7, 4); limb(p, 5, 14, 25, 14, 1.5, 1.5, R.GOLD, 10); for (const x of [5, 15, 25]) { p.rect(x - 1.5, 7, 3, 7, C(R.CONCRETE, 13)); blob(p, x, 4, 2, 3, R.YELLOW, 15, 1); } }));
    for (let i = 0; i < 3; i++) put('FCAN' + 'ABC'[i], P(36, 44, p => { for (let y = 18; y < 44; y++) for (let x = 5; x < 31; x++) { const nx = (x - 18) / 13; p.set(x, y, C(R.RUST, shadeAt(nx, 0, Math.sqrt(Math.max(0, 1 - nx * nx)), 7, 6) - ((y - 18) % 9 < 2 ? 2 : 0))); } const r = rng(i * 3 + 1); for (let k = 0; k < 14; k++) blob(p, 18 + (r() - 0.5) * 20, 16 - r() * 14, 2 + r() * 3, 3 + r() * 4, k % 2 ? R.ORANGE : R.YELLOW, 12 + r() * 3, 3); }));
    put('POL5A', P(36, 12, p => { const r = rng(5); for (let k = 0; k < 14; k++) blob(p, 18 + (r() - 0.5) * 26, 8 + (r() - 0.5) * 4, 2 + r() * 4, 1.5 + r() * 2, k % 4 ? R.RED : R.CONCRETE, 5 + r() * 5, 3); }));
    put('POB1A', P(40, 8, p => { blob(p, 20, 5, 18, 3, R.RED, 4, 2); blob(p, 14, 4, 6, 1.5, R.RED, 7, 2); }));
    put('POL4A', P(20, 66, p => { limb(p, 10, 16, 10, 64, 1.5, 1.5, R.BROWN, 6); blob(p, 10, 9, 7, 8, R.CONCRETE, 12, 5); disc(p, 7, 8, 1.8, C(R.GRAY, 1)); disc(p, 13, 8, 1.8, C(R.GRAY, 1)); p.rect(7, 13, 6, 2, C(R.GRAY, 3)); }));
    for (let i = 0; i < 3; i++) put('CEYE' + 'ABC'[i], P(20, 56, p => { limb(p, 10, 22, 10, 54, 2, 3, R.OLIVE, 5); blob(p, 10, 12, 8, 8, R.CONCRETE, 12, 5); blob(p, 10, 12, 4, 4, R.GREEN, 10 + i * 2, 3); disc(p, 10 + (i - 1) * 1.5, 12, 1.5, C(R.GRAY, 1)); }));
    put('TRE1A', P(40, 66, p => { limb(p, 20, 64, 20, 22, 4, 2.5, R.BROWN, 5); limb(p, 20, 34, 8, 16, 2, 1, R.BROWN, 5); limb(p, 20, 28, 33, 10, 2, 1, R.BROWN, 5); limb(p, 20, 22, 18, 4, 1.5, 0.8, R.BROWN, 6); limb(p, 11, 20, 4, 18, 1, 0.6, R.BROWN, 5); }));
    put('COL1A', P(32, 66, p => { for (let y = 4; y < 62; y++) for (let x = 5; x < 27; x++) { const nx = (x - 16) / 11; p.set(x, y, C(R.GREEN, shadeAt(nx, 0, Math.sqrt(Math.max(0, 1 - nx * nx)), 7, 6))); } p.rect(2, 0, 28, 5, C(R.GREEN, 9)); p.rect(2, 61, 28, 5, C(R.GREEN, 5)); }));
  }

  // ================================================================ HUD WEAPONS (320x200 screen space)
  function hand(p, x, y, sc = 1, dark = 0) { blob(p, x, y, 12 * sc, 10 * sc, R.SKIN, 9 - dark, 6); for (let i = 0; i < 4; i++) blob(p, x - 7 * sc + i * 4.6 * sc, y - 7 * sc, 3 * sc, 3.4 * sc, R.SKIN, 10 - dark, 5); }
  function genWeapons() {
    const W = (w, h, fn) => { const p = new Pic(w, h); fn(p); edge(p, 2); p.ox = w >> 1; p.oy = h; return p; };
    const flash = (base, cx, cy, r, ramp = R.YELLOW) => { const p = new Pic(base.w, base.h); blob(p, cx, cy, r, r * 0.8, ramp, 14, 2); blob(p, cx, cy, r * 0.5, r * 0.4, R.GRAY, 15, 1); const g = rng(r * 7); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28 + g() * 0.3; line(p, cx, cy, cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r * 1.2, C(ramp, 15), 2); } p.ox = base.ox; p.oy = base.oy; p.dx = base.dx; p.dy = base.dy; return p; };
    // fist
    const fist = (k) => W(120, 90, p => { const x = 80 - k * 18, y = 70 - k * 22, s = 1 + k * 0.35; limb(p, x + 20 * s, 95, x + 6, y + 10, 12 * s, 11 * s, R.SKIN, 8); blob(p, x, y, 16 * s, 14 * s, R.SKIN, 9, 6); for (let i = 0; i < 4; i++) blob(p, x - 11 * s + i * 7 * s, y - 9 * s, 4.2 * s, 4.5 * s, R.SKIN, 10, 5); limb(p, x - 14 * s, y + 2, x - 6 * s, y - 4 * s, 4 * s, 3.5 * s, R.SKIN, 10); });
    HUD.PUNGA = fist(0); HUD.PUNGB = fist(0.5); HUD.PUNGC = fist(1); HUD.PUNGD = fist(0.7);
    for (const k of ['A', 'B', 'C', 'D']) HUD['PUNG' + k].dx = 40;
    // ---------------------------------------------------------------- 3D weapon models
    // Each first-person weapon is a small scene of boxes, cylinders and ellipsoids in view space
    // (x right, y up, z forward, eye at the origin) ray-traced into palette indices with the same
    // 90° projection as the game view, so perspective and shading are always consistent.
    const PW = 300, PH = 150, FOC = 340, PITCH = 0.1, CAMY = -0.6, HEAVY_CAMY = 0.2, HORIZON_ROW = 64, CX0 = PW / 2, CY0 = HORIZON_ROW + FOC * Math.tan(PITCH), PC = Math.cos(PITCH), PSN = Math.sin(PITCH);
    const ray = (px, py) => { const sx = (px + 0.5 - CX0) / FOC, sy = -(py + 0.5 - CY0) / FOC; return [sx, sy * PC - PSN, PC + sy * PSN]; };
    const LV = (() => { const l = [-0.62, 0.45, -0.64], n = Math.hypot(...l); return l.map(v => v / n); })();
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const box = (x0, y0, z0, x1, y1, z1, ramp, base, o = {}) => Object.assign({ k: 'box', lo: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], hi: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)], ramp, base }, o);
    const cyl = (a, b, r, ramp, base, o = {}) => Object.assign({ k: 'cyl', a, b, r, ramp, base }, o);
    const ell = (c, r, ramp, base, o = {}) => Object.assign({ k: 'ell', c, r, ramp, base }, o);
    function hit(pr, d) {
      if (pr.k === 'box') {
        let t0 = 0, t1 = Infinity, ax = -1, sg = 0;
        for (let i = 0; i < 3; i++) {
          if (Math.abs(d[i]) < 1e-9) { if (0 < pr.lo[i] || 0 > pr.hi[i]) return null; continue; }
          let a = pr.lo[i] / d[i], b = pr.hi[i] / d[i], s = -1; if (a > b) { const t = a; a = b; b = t; s = 1; }
          if (a > t0) { t0 = a; ax = i; sg = s * Math.sign(d[i]) * -1 * -1; } if (b < t1) t1 = b; if (t0 > t1) return null;
        }
        if (ax < 0) return null;
        const n = [0, 0, 0]; n[ax] = d[ax] > 0 ? -1 : 1;
        return { t: t0, n };
      }
      if (pr.k === 'ell') {
        const o = [-pr.c[0] / pr.r[0], -pr.c[1] / pr.r[1], -pr.c[2] / pr.r[2]], dd = [d[0] / pr.r[0], d[1] / pr.r[1], d[2] / pr.r[2]];
        const A = dot(dd, dd), B = 2 * dot(o, dd), Cc = dot(o, o) - 1, disc = B * B - 4 * A * Cc; if (disc < 0) return null;
        const t = (-B - Math.sqrt(disc)) / (2 * A); if (t <= 0) return null;
        const p = [d[0] * t - pr.c[0], d[1] * t - pr.c[1], d[2] * t - pr.c[2]], n = [p[0] / (pr.r[0] * pr.r[0]), p[1] / (pr.r[1] * pr.r[1]), p[2] / (pr.r[2] * pr.r[2])], l = Math.hypot(...n);
        return { t, n: n.map(v => v / l) };
      }
      // finite cylinder with caps, axis a->b
      const ax = sub(pr.b, pr.a), L = Math.hypot(...ax), u = ax.map(v => v / L), oc = sub([0, 0, 0], pr.a);
      const dp = sub(d, u.map(v => v * dot(d, u))), op = sub(oc, u.map(v => v * dot(oc, u)));
      const A = dot(dp, dp), B = 2 * dot(dp, op), Cc = dot(op, op) - pr.r * pr.r;
      let best = null;
      const disc = B * B - 4 * A * Cc;
      if (A > 1e-12 && disc >= 0) {
        const t = (-B - Math.sqrt(disc)) / (2 * A);
        if (t > 0) { const h = dot(sub(d.map(v => v * t), pr.a), u); if (h >= 0 && h <= L) { const p = sub(d.map(v => v * t), pr.a), q = sub(p, u.map(v => v * h)), l = Math.hypot(...q); best = { t, n: q.map(v => v / l), h }; } }
      }
      for (const [c, nrm] of [[pr.a, u.map(v => -v)], [pr.b, u]]) {
        const den = dot(d, nrm); if (Math.abs(den) < 1e-9) continue;
        const t = dot(c, nrm) / den; if (t <= 0 || (best && t >= best.t)) continue;
        const p = sub(d.map(v => v * t), c); if (dot(p, p) <= pr.r * pr.r) best = { t, n: nrm, cap: c === pr.b ? 'far' : 'near', h: c === pr.b ? L : 0, rr: Math.sqrt(dot(p, p)) / pr.r };
      }
      return best;
    }
    const proj = (x, y0, z, camY = CAMY) => { const y = y0 - camY, zc = z * PC - y * PSN, yc = y * PC + z * PSN; return [CX0 + FOC * x / zc, CY0 - FOC * yc / zc]; };
    function model(prims, camY = CAMY) {
      const p = new Pic(PW, PH);
      for (const pr of prims) { if (pr.k === 'box') { pr.lo = [pr.lo[0], pr.lo[1] - camY, pr.lo[2]]; pr.hi = [pr.hi[0], pr.hi[1] - camY, pr.hi[2]]; } else if (pr.k === 'ell') pr.c = [pr.c[0], pr.c[1] - camY, pr.c[2]]; else { pr.a = [pr.a[0], pr.a[1] - camY, pr.a[2]]; pr.b = [pr.b[0], pr.b[1] - camY, pr.b[2]]; } }
      // screen-space bounds of every primitive (points projected from its bounding box)
      for (const pr of prims) {
        let lo, hi; if (pr.k === 'box') { lo = pr.lo; hi = pr.hi; } else if (pr.k === 'ell') { lo = pr.c.map((v, i) => v - pr.r[i]); hi = pr.c.map((v, i) => v + pr.r[i]); } else { lo = pr.a.map((v, i) => Math.min(v, pr.b[i]) - pr.r); hi = pr.a.map((v, i) => Math.max(v, pr.b[i]) + pr.r); }
        const zs = Math.max(0.5, lo[2]); let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [zs, Math.max(zs, hi[2])]) { const [sx, sy] = proj(x, y + camY, z, camY); x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); }
        pr.sb = [x0 - 1, y0 - 1, x1 + 1, y1 + 1];
      }
      for (let py = 0; py < PH; py++) for (let px = 0; px < PW; px++) {
        const d = ray(px, py);
        let best = null, bp = null;
        for (const pr of prims) { const b = pr.sb; if (px < b[0] || px > b[2] || py < b[1] || py > b[3]) continue; const h = hit(pr, d); if (h && (!best || h.t < best.t)) { best = h; bp = pr; } }
        if (!best) continue;
        if (bp.bore && best.cap === 'far' && best.rr < bp.bore) { p.set(px, py, C(R.GRAY, 1)); continue; }
        let s = bp.glow != null ? bp.glow : bp.base + (Math.max(-0.3, dot(best.n, LV)) - 0.35) * (bp.con || 11) - (bp.ramp === R.STEEL ? 1.2 : 0);
        const hp = d.map(v => v * best.t);
        if (bp.pat) s += bp.pat(hp, best);
        if (bp.k === 'box' && bp.glow == null) { let e = Infinity; for (let i = 0; i < 3; i++) if (!best.n[i]) e = Math.min(e, hp[i] - bp.lo[i], bp.hi[i] - hp[i]); if (e < 0.07) s += dot(best.n, LV) > 0 ? 2.5 : -1.5; }
        if (bp.glow == null) { const h = [LV[0], LV[1], LV[2] - 1], hl = Math.hypot(...h), sp = Math.max(0, dot(best.n, h) / hl); s += Math.pow(sp, 14) * (bp.ramp === R.SKIN ? 2 : 5); }
        if (bp.ramp !== R.SKIN && bp.glow == null) s += (((Math.sin(hp[0] * 91.7 + hp[1] * 47.3 + hp[2] * 13.1) * 43758.5) % 1) - 0.5) * 0.45;
        p.set(px, py, C(bp.ramp, clamp(s, 1, 15)));
      }
      edge(p, 2); p.ox = PW >> 1; p.oy = PH; p.camY = camY;
      return p;
    }
        const flashAt = (base, pt, r, ramp) => { const [x, y] = proj(...pt, base.camY); return flash(base, x, y, r, ramp); };
    const skin = (c, r, o) => ell(c, r, R.SKIN, 9, Object.assign({ con: 7 }, o));
    // a fist wrapped around something: palm plus four knuckles in an arc; dir = +1 fingers point right, -1 left
    const grasp = (x, y, z, s = 1, dir = 1) => [
      skin([x, y, z], [0.95 * s, 0.8 * s, 1.05 * s]),
      ...[0, 1, 2, 3].map(i => skin([x + dir * (0.55 - i * 0.02) * s, y + (0.45 - i * 0.32) * s, z + (0.75 - i * 0.05) * s], [0.36 * s, 0.26 * s, 0.34 * s], { base: 10 })),
      skin([x - dir * 0.75 * s, y + 0.35 * s, z + 0.2 * s], [0.28 * s, 0.3 * s, 0.7 * s], { base: 10 })
    ];
    // left hand cupping a fore-end from below
    const foreHand = (x, y, z) => [
      skin([x - 0.2, y - 0.55, z], [0.95, 0.55, 1.4]),
      ...[0, 1, 2].map(i => skin([x - 0.95, y + 0.25, z - 0.7 + i * 0.7], [0.3, 0.55, 0.32], { base: 10 })),
      skin([x + 0.85, y + 0.3, z + 0.1], [0.26, 0.42, 0.85], { base: 10 })
    ];
    const grooves = (period, amt) => (p) => ((p[2] * period) % 1 < 0.28 ? -amt : 0);

    // chainsaw: rounded orange engine, top handle, long bar with a running chain
    const saw = (ph, cut) => { const j = cut ? (ph ? 0.1 : -0.1) : (ph ? 0.03 : 0), y = -3.6; return model([
      box(-1.05 + j, y - 1.7, 13.2, 1.05 + j, y + 0.2, 17.2, R.ORANGE, 9), box(-0.6 + j, y + 0.2, 14, 0.6 + j, y + 0.5, 16.5, R.GRAY, 4),
      box(-0.9 + j, y - 1.4, 13.6, 0.9 + j, y - 0.2, 15, R.GRAY, 3),
      box(-0.13 + j, y - 0.35, 17, 0.13 + j, y + 0.55, 38, R.STEEL, 10),
      box(-0.17 + j, y - 0.5, 17, 0.17 + j, y - 0.35, 38, R.GRAY, 4, { pat: p => ((p[2] * 1.6 + ph * 0.5) % 1 < 0.4 ? 5 : 0) }),
      box(-0.17 + j, y + 0.55, 17, 0.17 + j, y + 0.7, 38, R.GRAY, 4, { pat: p => ((p[2] * 1.6 - ph * 0.5) % 1 < 0.4 ? 5 : 0) }),
      cyl([-1.1 + j, y + 1.1, 14.2], [1.1 + j, y + 1.1, 14.2], 0.17, R.GRAY, 3), cyl([-1.1 + j, y + 0.2, 14.2], [-1.1 + j, y + 1.1, 14.2], 0.17, R.GRAY, 3), cyl([1.1 + j, y + 0.2, 14.2], [1.1 + j, y + 1.1, 14.2], 0.17, R.GRAY, 3),
      ...grasp(-0.5 + j, y + 1.05, 14.2, 0.6, 1), ...grasp(0.9 + j, y - 1.4, 12.8, 0.75, -1)
    ]); };
    HUD.SAWGA = saw(0, true); HUD.SAWGB = saw(1, true); HUD.SAWGC = saw(0, false); HUD.SAWGD = saw(1, false);
    // pistol
    const pistol = (up, back) => { const y = -2.4 + up, z = 15 - back; return model([
      box(-1.0, y - 1.1, z, 1.0, y + 0.3, z + 10, R.STEEL, 8, { pat: p => (p[2] > z + 1.3 && p[2] < z + 3.2 && Math.abs(p[0]) > 0.99 ? ((p[2] * 4) % 1 < 0.5 ? -2 : 0) : 0) }),
      box(-0.85, y - 1.8, z + 5, 0.85, y - 1.1, z + 10.4, R.STEEL, 6),
      box(-0.18, y + 0.3, z + 9.2, 0.18, y + 0.72, z + 9.8, R.STEEL, 4),
      box(-0.95, y + 0.3, z + 0.1, -0.35, y + 0.68, z + 0.6, R.STEEL, 4), box(0.35, y + 0.3, z + 0.1, 0.95, y + 0.68, z + 0.6, R.STEEL, 4),
      box(-0.8, y - 5, z + 0.3, 0.8, y - 1.1, z + 2.6, R.STEEL, 4),
      ...grasp(0.1, y - 1.75, z + 1.3, 1.25, 1)
    ]); };
    HUD.PISGA = pistol(0, 0); HUD.PISGB = pistol(0.8, 1.5); HUD.PISGC = pistol(0.45, 0.8); HUD.PISGD = pistol(0.15, 0.3);
    HUD.PISFA = flashAt(HUD.PISGA, [0, -2.5, 26], 8);
    // pump shotgun
    const shotgun = (pump, dip) => { const y = -3.8 - dip, pz = 24 - pump * 4; return model([
      box(-0.75, y - 2.1, 13, 0.75, y + 0.45, 17, R.STEEL, 5),
      cyl([0, y, 13], [0, y, 45], 0.64, R.STEEL, 8, { bore: 0.72 }),
      cyl([0, y - 1.12, 13], [0, y - 1.12, 41], 0.52, R.STEEL, 6),
      cyl([0, y - 0.62, pz], [0, y - 0.62, pz + 7], 1.18, R.BROWN, 8, { pat: grooves(1.3, 2) }),
      box(-0.12, y + 0.55, 43.5, 0.12, y + 0.9, 44.5, R.STEEL, 11),
      ...foreHand(-0.1, y - 1.6, pz + 3.5)
    ]); };
    HUD.SHTGA = shotgun(0, 0); HUD.SHTGB = shotgun(0.5, 0.3); HUD.SHTGC = shotgun(1, 0.5); HUD.SHTGD = shotgun(0.6, 0.3);
    HUD.SHTFA = flashAt(HUD.SHTGA, [0, -3.8, 46], 12); HUD.SHTFB = flashAt(HUD.SHTGA, [0, -3.8, 46], 8);
    // super shotgun: side-by-side barrels hinged at the breech; open = barrels tipped down
    const ssg = (tip, lift, shells) => { const y = -3.9 + lift, hz = 14, a = tip * 0.45, bz = hz + 28 * Math.cos(a), by = y - 28 * Math.sin(a); return model([
      box(-1.2, y - 2.2, 11.5, 1.2, y + 0.35, hz + 0.4, R.STEEL, 5),
      ...[-1, 1].map(s => cyl([s * 0.63, y, hz], [s * 0.63, by, bz], 0.61, R.STEEL, s < 0 ? 8 : 7, { bore: 0.72 })),
      cyl([0, y + 0.55, hz + 1], [0, by + 0.55, bz - 1], 0.14, R.STEEL, 10),
      box(-1.1, y - 1.35 - 7 * Math.sin(a), hz + 3 * Math.cos(a), 1.1, y - 0.5 - 7 * Math.sin(a), hz + 11 * Math.cos(a), R.BROWN, 7),
      ...(tip > 0.3 ? [-1, 1].map(s => ell([s * 0.63, y + 0.02, hz - 0.12], [0.5, 0.5, 0.1], shells ? R.GOLD : R.GRAY, shells ? 12 : 1)) : []),
      ...foreHand(-0.3, y - 1.9 - tip * 2.4, hz + 7),
      ...(shells && shells < 1 ? [...grasp(2.4, y - 1.6 + shells * 1.8, hz, 1, -1), cyl([1.6, y - 0.8 + shells * 1.8, hz - 1], [1.6, y - 0.8 + shells * 1.8, hz + 1.2], 0.42, R.RED, 10)] : [])
    ]); };
    HUD.SHT2A = ssg(0, 0); HUD.SHT2B = ssg(0, 0.6); HUD.SHT2C = ssg(0.1, 0.3); HUD.SHT2D = ssg(0.6, 0); HUD.SHT2E = ssg(0.6, 0, 0.5); HUD.SHT2F = ssg(0.6, 0, 1); HUD.SHT2G = ssg(0.3, 0, 1); HUD.SHT2H = ssg(0.1, 0);
    HUD.SHT2FI = flashAt(HUD.SHT2A, [0, -3.9, 43], 14); HUD.SHT2FJ = flashAt(HUD.SHT2A, [0, -3.9, 43], 9);
    // chaingun: rotating cluster of six barrels
    const cgun = (ph) => { const y = -4.3; const parts = [
      box(-1.25, y - 2.0, 12.5, 1.25, y + 1.05, 16, R.STEEL, 5),
      cyl([0, y, 15.5], [0, y, 17.5], 1.3, R.STEEL, 7), cyl([0, y, 27], [0, y, 28.3], 1.18, R.STEEL, 7), cyl([0, y, 36], [0, y, 37], 1.12, R.STEEL, 8),
      box(-0.2, y + 1.05, 13, 0.2, y + 1.7, 15.5, R.STEEL, 4),
      ...grasp(-1.8, y - 1.3, 14, 1, 1), ...grasp(1.8, y - 1.5, 13.6, 1, -1)];
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + ph * Math.PI / 6; parts.push(cyl([Math.cos(a) * 0.72, y + Math.sin(a) * 0.72, 16], [Math.cos(a) * 0.72, y + Math.sin(a) * 0.72, 38], 0.3, R.STEEL, 8, { bore: 0.75 })); }
      return model(parts, HEAVY_CAMY); };
    HUD.CHGGA = cgun(0); HUD.CHGGB = cgun(1);
    HUD.CHGFA = flashAt(HUD.CHGGA, [0, -4.3, 39], 12); HUD.CHGFB = flashAt(HUD.CHGGA, [0, -4.3, 39], 9);
    // rocket launcher: fat tube with a sight on top
    const rl = (back) => { const y = -4.9, z = 13 - back; return model([
      cyl([0, y, z], [0, y, z + 24], 1.6, R.OLIVE, 8, { bore: 0.8, pat: (p) => (Math.abs(p[2] - z - 13) < 0.45 || Math.abs(p[2] - z - 4) < 0.35 ? -3 : 0) }),
      cyl([0, y, z + 23], [0, y, z + 24.5], 1.75, R.OLIVE, 6, { bore: 0.75 }),
      box(-0.45, y + 1.5, z + 5, 0.45, y + 2.2, z + 10, R.OLIVE, 5), box(-0.1, y + 2.2, z + 9, 0.1, y + 2.6, z + 9.6, R.GRAY, 3),
      ...grasp(-1.9, y - 0.9, z + 3, 1.05, 1), ...grasp(1.7, y - 1.6, z + 2, 1.05, -1)
    ], HEAVY_CAMY); };
    HUD.MISGA = rl(0); HUD.MISGB = rl(2);
    ['A', 'B', 'C', 'D'].forEach((f, i) => { HUD['MISF' + f] = flashAt(HUD.MISGA, [0, -4.9, 38], 10 + i * 4, i > 1 ? R.ORANGE : R.YELLOW); });
    // plasma rifle: boxy body with glowing coils along the barrel
    const pg = (hot) => { const y = -4.5; return model([
      box(-1.35, y - 2.0, 13, 1.35, y + 0.8, 20, R.STEEL, 7),
      box(-0.95, y - 1.0, 20, 0.95, y + 0.6, 32, R.STEEL, 8),
      cyl([0, y - 0.2, 31], [0, y - 0.2, 34], 0.62, R.STEEL, 6, { bore: 0.7 }),
      ...[21.5, 24, 26.5, 29].map(z => box(-1.04, y - 1.06, z, 1.04, y + 0.66, z + 0.35, R.CYAN, 0, { glow: hot ? 15 : 11 })),
      box(-0.22, y + 0.8, 14.5, 0.22, y + 1.05, 18.5, R.CYAN, 0, { glow: hot ? 14 : 9 }),
      ...grasp(-1.9, y - 1.2, 15, 1, 1), ...grasp(1.9, y - 1.4, 14.5, 1, -1)
    ], HEAVY_CAMY); };
    HUD.PLSGA = pg(false); HUD.PLSGB = pg(true);
    HUD.PLSFA = flashAt(HUD.PLSGA, [0, -4.6, 35], 12, R.CYAN); HUD.PLSFB = flashAt(HUD.PLSGA, [0, -4.6, 35], 9, R.BLUE);
    // BFG9000: wide chassis with a green core
    const bfg = (charge) => { const y = -5.0; return model([
      box(-2.2, y - 2.2, 13, 2.2, y + 0.9, 25, R.STEEL, 7),
      box(-1.6, y - 1.6, 25, 1.6, y + 0.6, 30, R.STEEL, 8),
      cyl([0, y - 0.5, 29.5], [0, y - 0.5, 31], 1.1, R.STEEL, 5, { bore: 0.75 }),
      ell([0, y + 0.9, 19], [1.1, 0.45, 5.5], R.GREEN, 0, { glow: 11 + charge * 4 }),
      box(-2.35, y - 1.0, 15, -2.15, y - 0.2, 23, R.GREEN, 0, { glow: 10 + charge * 4 }), box(2.15, y - 1.0, 15, 2.35, y - 0.2, 23, R.GREEN, 0, { glow: 10 + charge * 4 }),
      ...grasp(-2.7, y - 1.1, 15, 1.05, 1), ...grasp(2.7, y - 1.3, 15, 1.05, -1)
    ], HEAVY_CAMY); };
    HUD.BFGGA = bfg(0); HUD.BFGGB = bfg(1);
    HUD.BFGFA = flashAt(HUD.BFGGA, [0, -5.5, 32], 22, R.GREEN); HUD.BFGFB = flashAt(HUD.BFGGA, [0, -5.5, 32], 14, R.GREEN);
    for (const k of ['A', 'B', 'C', 'D']) { const p = HUD['PUNG' + k], q = scalePic(p, 1.4, 1.4); q.ox = q.w >> 1; q.oy = q.h; q.dx = Math.round(p.dx * 1.4); HUD['PUNG' + k] = q; }
  }

  // ================================================================ STATUS BAR
  const BIG = {
    0: ['11111', '10001', '10001', '10001', '10001', '10001', '11111'], 1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'], 2: ['11111', '00001', '00001', '11111', '10000', '10000', '11111'],
    3: ['11111', '00001', '00001', '01111', '00001', '00001', '11111'], 4: ['10001', '10001', '10001', '11111', '00001', '00001', '00001'], 5: ['11111', '10000', '10000', '11111', '00001', '00001', '11111'],
    6: ['11111', '10000', '10000', '11111', '10001', '10001', '11111'], 7: ['11111', '00001', '00001', '00010', '00100', '00100', '00100'], 8: ['11111', '10001', '10001', '11111', '10001', '10001', '11111'],
    9: ['11111', '10001', '10001', '11111', '00001', '00001', '11111'], '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'], '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000']
  };
  function genStatus() {
    for (const k in BIG) {
      const p = new Pic(14, 16), g = BIG[k];
      for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (g[j][i] === '1') { p.rect(i * 2 + 2, j * 2 + 2, 2, 2, C(R.GRAY, 1)); }
      for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (g[j][i] === '1') p.rect(i * 2 + 1, j * 2 + 1, 2, 2, (x, y) => C(R.RED, 13 - (y - 1) * 0.5));
      HUD['STTNUM' + k] = p;
    }
    for (const [pre, ramp, sh] of [['STYSNUM', R.YELLOW, 13], ['STGNUM', R.CONCRETE, 10]]) for (const k of '0123456789') { const p = new Pic(4, 6); text3(p, k, 0, 0, C(ramp, sh)); HUD[pre + k] = p; }
    const n = fbm(320, 32, 301, [[16, 0.5], [8, 0.3], [4, 0.2]]);
    const bar = new Pic(320, 32);
    bar.fill((x, y) => C(R.CONCRETE, 6 + (n(x, y) - 0.5) * 4 + (n(x - 1, y - 1) - n(x + 1, y + 1)) * 8));
    const box = (x, y, w, h) => { bar.rect(x, y, w, h, C(R.CONCRETE, 3)); bar.rect(x, y, w, 1, C(R.CONCRETE, 2)); bar.rect(x, y, 1, h, C(R.CONCRETE, 2)); bar.rect(x, y + h - 1, w, 1, C(R.CONCRETE, 10)); bar.rect(x + w - 1, y, 1, h, C(R.CONCRETE, 10)); };
    bar.rect(0, 0, 320, 1, C(R.CONCRETE, 11));
    box(2, 2, 44, 22); text3(bar, 'AMMO', 11, 25, C(R.GRAY, 13), 1, C(R.GRAY, 2));
    box(49, 2, 56, 22); text3(bar, 'HEALTH', 61, 25, C(R.GRAY, 13), 1, C(R.GRAY, 2));
    box(107, 2, 36, 29); text3(bar, 'ARMS', 117, 25, C(R.GRAY, 13), 1, C(R.GRAY, 2));
    box(144, 1, 32, 31); bar.rect(145, 2, 30, 29, C(R.STEEL, 3));
    box(178, 2, 56, 22); text3(bar, 'ARMOR', 193, 25, C(R.GRAY, 13), 1, C(R.GRAY, 2));
    box(236, 2, 12, 28);
    box(250, 2, 68, 28);
    const labels = ['BULL', 'SHEL', 'RCKT', 'CELL']; labels.forEach((l, i) => text3(bar, l, 253, 5 + i * 6, C(R.YELLOW, 11)));
    for (let i = 0; i < 4; i++) text3(bar, '/', 289, 5 + i * 6, C(R.YELLOW, 11));
    HUD.STBAR = bar;
    // key icons
    [['STKEYS0', R.BLUE], ['STKEYS1', R.YELLOW], ['STKEYS2', R.RED]].forEach(([k, ramp]) => { const p = new Pic(8, 6); p.rect(0, 0, 8, 6, C(ramp, 11)); p.rect(0, 0, 8, 1, C(ramp, 14)); p.rect(2, 2, 3, 2, C(R.GRAY, 12)); HUD[k] = p; });
    // faces
    for (let lvl = 0; lvl < 5; lvl++) {
      for (let i = 0; i < 3; i++) HUD[`STFST${lvl}${i}`] = face(lvl, { look: [0, -1, 1][i] });
      HUD[`STFTR${lvl}0`] = face(lvl, { turn: 1 }); HUD[`STFTL${lvl}0`] = face(lvl, { turn: -1 });
      HUD[`STFOUCH${lvl}`] = face(lvl, { expr: 'ouch' }); HUD[`STFEVL${lvl}`] = face(lvl, { expr: 'evil' }); HUD[`STFKILL${lvl}`] = face(lvl, { expr: 'kill' });
    }
    HUD.STFGOD0 = face(0, { expr: 'god' }); HUD.STFDEAD0 = face(4, { expr: 'dead' });
  }
  function face(lvl, o) {
    const p = new Pic(24, 29), turn = o.turn || 0, look = o.look || 0, expr = o.expr || 'normal', cx = 12 + turn * 1.5, dead = expr === 'dead';
    const skinR = dead ? R.CONCRETE : R.SKIN, sk = 9 - lvl * 0.5;
    limb(p, 12, 26, 12, 29, 6, 7, skinR, sk - 2);
    blob(p, cx, 14, 9.5, 12.5, skinR, sk, 6);
    blob(p, cx - turn * 0.5, 4.5, 9, 4.5, R.BROWN, 4, 3);
    for (let x = -8; x <= 8; x += 2) p.set(cx + x, 8 + (x & 2 ? 1 : 0), C(R.BROWN, 3));
    blob(p, cx - 9.5 + turn * 1.5, 14, 1.8, 3, skinR, sk - 2, 3); blob(p, cx + 9.5 + turn * 1.5, 14, 1.8, 3, skinR, sk - 2, 3);
    const ey = 12, ex1 = cx - 4 + turn, ex2 = cx + 4 + turn;
    if (dead) { for (const ex of [ex1, ex2]) { line(p, ex - 1.5, ey - 1.5, ex + 1.5, ey + 1.5, C(R.GRAY, 2)); line(p, ex + 1.5, ey - 1.5, ex - 1.5, ey + 1.5, C(R.GRAY, 2)); } }
    else if (expr === 'god') { for (const ex of [ex1, ex2]) p.rect(ex - 1.5, ey - 1, 3, 2, C(R.YELLOW, 15)); }
    else {
      const wide = expr === 'ouch' ? 1 : 0;
      for (const ex of [ex1, ex2]) { p.rect(ex - 1.5, ey - 1 - wide, 3, 2 + wide, C(R.CONCRETE, 14)); p.rect(ex - 0.5 + look + turn * 0.6, ey - 1, 1, 2, C(R.BLUE, 3)); }
      const angry = expr === 'kill' || expr === 'evil' ? 1 : 0;
      line(p, ex1 - 2, ey - 3 - angry * 0 + 0, ex1 + 2, ey - 3 + angry, C(R.BROWN, 3)); line(p, ex2 - 2, ey - 3 + angry, ex2 + 2, ey - 3, C(R.BROWN, 3));
      if (lvl >= 3) { p.set(ex1 - 1, ey + 1, C(R.PURPLE, 5)); p.set(ex1, ey + 2, C(R.PURPLE, 4)); }
    }
    line(p, cx + turn * 1.5, 13, cx + turn * 2, 17, C(skinR, sk - 3));
    const my = 21;
    if (expr === 'ouch' || dead) { blob(p, cx + turn, my, 3, 2.5, R.RED, 2, 1); p.rect(cx + turn - 2, my - 2, 4, 1, C(R.CONCRETE, 13)); }
    else if (expr === 'evil') { p.rect(cx - 4 + turn, my - 1, 8, 2, C(R.CONCRETE, 14)); p.set(cx - 5 + turn, my - 2, C(R.RED, 3)); p.set(cx + 4 + turn, my - 2, C(R.RED, 3)); p.rect(cx - 4 + turn, my + 1, 8, 1, C(R.RED, 3)); }
    else if (expr === 'kill') { p.rect(cx - 3 + turn, my - 1, 6, 3, C(R.CONCRETE, 13)); for (let x = -3; x < 3; x += 2) p.set(cx + x + turn, my, C(R.GRAY, 4)); }
    else p.rect(cx - 3 + turn, my, 6, 1, C(R.RED, 4));
    const r = rng(lvl * 13 + 5 + (turn + 1) * 3);
    for (let k = 0; k < lvl * 3 + (dead ? 6 : 0); k++) { const x = cx + (r() - 0.5) * 14, y = 6 + r() * 14; line(p, x, y, x + (r() - 0.5) * 2, y + 2 + r() * 5, C(R.RED, 6 + r() * 3)); }
    edge(p, 2); return p;
  }

  // ================================================================ build
  let built = null;
  function build() {
    if (built) return built;
    genTextures(); genFlats(); genMonsters(); genMissiles(); genItems(); genWeapons(); genStatus();
    // column-major copies for fast wall/sprite drawing
    for (const k in T) { const p = T[k]; p.cols = colMajor(p); p.masked = k === 'GRATE'; }
    for (const k in S) { const p = S[k]; p.cols = colMajor(p); p.spans = spans(p); }
    for (const k in HUD) { const p = HUD[k]; p.cols = colMajor(p); }
    const anims = {
      tex: { FIREWALL1: ['FIREWALL1', 'FIREWALL2', 'FIREWALL3'] },
      flat: { NUKAGE1: ['NUKAGE1', 'NUKAGE2', 'NUKAGE3'], LAVA1: ['LAVA1', 'LAVA2', 'LAVA3'], BLOOD1: ['BLOOD1', 'BLOOD2', 'BLOOD3'], SLIME1: ['SLIME1', 'SLIME2', 'SLIME3'] }
    };
    built = { textures: T, flats: FL, sprites: S, hud: HUD, anims, switches: { SW1OFF: 'SW1ON', SW1ON: 'SW1OFF', SW2OFF: 'SW2ON', SW2ON: 'SW2OFF', SW3OFF: 'SW3ON', SW3ON: 'SW3OFF', SW4OFF: 'SW4ON', SW4ON: 'SW4OFF' }, Pic };
    return built;
  }
  function colMajor(p) { const c = new Uint8Array(p.w * p.h); for (let x = 0; x < p.w; x++) for (let y = 0; y < p.h; y++) c[x * p.h + y] = p.px[y * p.w + x]; return c; }
  // opaque vertical extent of each column (lets the renderer skip empty rows)
  function spans(p) { const s = new Int16Array(p.w * 2); for (let x = 0; x < p.w; x++) { let a = -1, b = -2; for (let y = 0; y < p.h; y++) if (p.px[y * p.w + x]) { if (a < 0) a = y; b = y; } s[x * 2] = a; s[x * 2 + 1] = b; } return s; }

  D.GFX = { build, Pic, text3, F3 };
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Doom98 = globalThis.Doom98 || {});
