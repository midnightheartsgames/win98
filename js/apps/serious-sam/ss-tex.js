/**
 * Serious Sam 98 — procedural tileable textures drawn on canvases: sand, sandstone blocks, hieroglyph reliefs,
 * limestone, floor tiles, fluted columns, gold, canyon rock, tomb bricks, bronze gates, palms, water, sky clouds.
 * Browser only (needs a canvas). Results are cached for the page lifetime.
 */
(function (S) {
  'use strict';
  const { RNG, clamp } = S;
  let cache = null;

  // tileable value noise with integer period
  function hashP(x, y, p, seed) { x = ((x % p) + p) % p; y = ((y % p) + p) % p; return S.hash2(x, y, seed); }
  function pnoise(x, y, p, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hashP(xi, yi, p, seed), b = hashP(xi + 1, yi, p, seed), c = hashP(xi, yi + 1, p, seed), d = hashP(xi + 1, yi + 1, p, seed);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  }
  function pfbm(x, y, p, seed, oct = 4) { let s = 0, a = 0.5, n = 0, f = 1; for (let i = 0; i < oct; i++) { s += a * pnoise(x * f, y * f, p * f, seed + i * 31); n += a; a *= 0.5; f *= 2; } return s / n; }

  const N = 256;
  function canvas(n = N) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }
  // per-pixel fill: fn(x, y) -> [r,g,b(,a)]
  function pixels(c, fn) {
    const n = c.width, ctx = c.getContext('2d'), img = ctx.createImageData(n, n), d = img.data;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = fn(x, y), k = (y * n + x) * 4; d[k] = clamp(v[0], 0, 255); d[k + 1] = clamp(v[1], 0, 255); d[k + 2] = clamp(v[2], 0, 255); d[k + 3] = v[3] == null ? 255 : clamp(v[3], 0, 255); }
    ctx.putImageData(img, 0, 0); return ctx;
  }
  // multiply a noise grain over what is drawn
  function grain(c, amount, seed, scale = 16) {
    const n = c.width, ctx = c.getContext('2d'), img = ctx.getImageData(0, 0, n, n), d = img.data, per = n / scale;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const k = (y * n + x) * 4, g = 1 + (pfbm(x / scale, y / scale, per, seed, 3) - 0.5) * amount + (S.hash2(x, y, seed + 7) - 0.5) * amount * 0.35;
      d[k] *= g; d[k + 1] *= g; d[k + 2] *= g;
    }
    ctx.putImageData(img, 0, 0);
  }
  const col = (r, g, b, k = 1) => `rgb(${r * k | 0},${g * k | 0},${b * k | 0})`;

  // blocks with mortar and bevels
  function blocks(c, rowH, minW, maxW, base, seed, mortar = 2, varr = 0.1) {
    const ctx = c.getContext('2d'), r = RNG(seed), n = c.width;
    ctx.fillStyle = col(base[0], base[1], base[2], 0.62); ctx.fillRect(0, 0, n, n);
    for (let y = 0; y < n; y += rowH) {
      let x = -Math.floor(r() * maxW);
      while (x < n) {
        const w = Math.floor(minW + r() * (maxW - minW)), k = 1 - varr + r() * varr * 2;
        const draw = ox => {
          ctx.fillStyle = col(base[0], base[1], base[2], k); ctx.fillRect(ox + x + mortar, y + mortar, w - mortar, rowH - mortar);
          ctx.fillStyle = 'rgba(255,255,240,0.18)'; ctx.fillRect(ox + x + mortar, y + mortar, w - mortar, 2); ctx.fillRect(ox + x + mortar, y + mortar, 2, rowH - mortar);
          ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(ox + x + mortar, y + rowH - 2, w - mortar, 2); ctx.fillRect(ox + x + w - 2, y + mortar, 2, rowH - mortar);
        };
        draw(0); if (x + w > n) draw(-n); if (x < 0) draw(n);
        x += w;
      }
    }
  }

  // ---------------------------------------------------------------- glyphs
  function glyph(ctx, kind, x, y, s, r) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 24, s / 24); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    switch (kind) {
      case 0: ctx.arc(0, -7, 5, 0, Math.PI * 2); ctx.moveTo(0, -2); ctx.lineTo(0, 12); ctx.moveTo(-7, 2); ctx.lineTo(7, 2); break; // ankh
      case 1: ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2); ctx.moveTo(3, 0); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.moveTo(-3, 4); ctx.lineTo(-5, 11); ctx.moveTo(2, 4); ctx.quadraticCurveTo(7, 10, 3, 11); break; // eye
      case 2: ctx.moveTo(-8, 8); ctx.lineTo(-2, 0); ctx.quadraticCurveTo(2, -10, 7, -8); ctx.lineTo(9, -6); ctx.moveTo(-2, 0); ctx.lineTo(6, 2); ctx.lineTo(-1, 6); ctx.moveTo(0, 8); ctx.lineTo(0, 11); ctx.moveTo(3, 8); ctx.lineTo(4, 11); break; // bird
      case 3: for (let i = 0; i < 3; i++) { ctx.moveTo(-9, -6 + i * 6); for (let k = 0; k < 6; k++) ctx.lineTo(-9 + k * 3.6 + 1.8, -6 + i * 6 + (k % 2 ? -2 : 2)); } break; // water
      case 4: ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.moveTo(2, 0); ctx.arc(0, 0, 2, 0, Math.PI * 2); break; // sun
      case 5: ctx.moveTo(0, 11); ctx.lineTo(0, -10); ctx.moveTo(0, -10); ctx.quadraticCurveTo(6, -8, 3, -3); ctx.moveTo(0, -4); ctx.lineTo(-4, -8); break; // reed
      case 6: ctx.ellipse(0, 1, 6, 8, 0, 0, Math.PI * 2); ctx.moveTo(-6, -2); ctx.lineTo(-10, -5); ctx.moveTo(6, -2); ctx.lineTo(10, -5); ctx.moveTo(-6, 4); ctx.lineTo(-10, 7); ctx.moveTo(6, 4); ctx.lineTo(10, 7); ctx.moveTo(-6, -4); ctx.lineTo(6, -4); break; // scarab
      case 7: ctx.arc(0, -8, 3, 0, Math.PI * 2); ctx.moveTo(0, -5); ctx.lineTo(0, 3); ctx.lineTo(6, 3); ctx.lineTo(6, 11); ctx.moveTo(0, 3); ctx.lineTo(-3, 11); ctx.moveTo(0, -3); ctx.lineTo(6, -1); break; // seated man
      case 8: ctx.moveTo(-9, 10); ctx.lineTo(0, -10); ctx.lineTo(9, 10); ctx.closePath(); break; // pyramid
      case 9: ctx.moveTo(-8, -8); ctx.lineTo(8, -8); ctx.moveTo(0, -8); ctx.lineTo(0, 10); ctx.moveTo(-5, 10); ctx.lineTo(5, 10); ctx.moveTo(-4, -3); ctx.lineTo(4, -3); break; // djed-ish
      default: ctx.moveTo(-9, 0); ctx.quadraticCurveTo(-3, -9, 3, 0); ctx.quadraticCurveTo(7, 8, 10, 0); break; // snake
    }
    void r; ctx.stroke(); ctx.restore();
  }
  function hieroBand(ctx, x0, y0, w, h, seed, paint) {
    const r = RNG(seed), cw = 32;
    for (let x = x0; x < x0 + w - 4; x += cw) for (let y = y0 + 4; y < y0 + h - 20; y += 34) {
      const k = r.int(11), px = x + cw / 2, py = y + 15;
      const pc = paint && r() < 0.35 ? r.pick(['#2a5aa8', '#a83a28', '#c89830', '#2a8a6a']) : null;
      ctx.strokeStyle = 'rgba(255,245,220,0.35)'; glyph(ctx, k, px + 1, py + 1, 24, r);
      ctx.strokeStyle = pc || 'rgba(70,45,20,0.75)'; glyph(ctx, k, px, py, 24, r);
    }
  }

  function build() {
    const T = {};
    // sand
    T.sand = canvas(); pixels(T.sand, (x, y) => {
      const n = pfbm(x / 64, y / 64, 4, 3), f = pfbm(x / 8, y / 8, 32, 5, 2), rip = Math.sin((x + y * 0.3 + pfbm(x / 32, y / 32, 8, 9) * 60) / 5.5) * 0.04;
      const k = 0.86 + n * 0.22 + (f - 0.5) * 0.1 + rip + (S.hash2(x, y, 1) - 0.5) * 0.07;
      return [206 * k, 170 * k, 120 * k];
    });
    // sandstone blocks
    T.block = canvas(); blocks(T.block, 64, 70, 150, [206, 170, 116], 11); grain(T.block, 0.28, 12);
    // hieroglyph relief
    T.hiero = canvas(); { const ctx = T.hiero.getContext('2d'); blocks(T.hiero, 128, 128, 256, [214, 182, 128], 21, 2, 0.05); grain(T.hiero, 0.22, 22);
      ctx.fillStyle = 'rgba(120,80,40,0.55)'; ctx.fillRect(0, 10, 256, 4); ctx.fillRect(0, 124, 256, 4); ctx.fillRect(0, 138, 256, 4); ctx.fillRect(0, 250, 256, 4);
      for (let x = 0; x < 256; x += 32) ctx.fillRect(x, 14, 2, 110), ctx.fillRect(x, 142, 2, 108);
      hieroBand(ctx, 0, 16, 256, 108, 5, true); hieroBand(ctx, 0, 144, 256, 106, 6, true); }
    // limestone
    T.lime = canvas(); blocks(T.lime, 128, 128, 256, [232, 216, 184], 31, 1, 0.04); grain(T.lime, 0.16, 32, 32);
    // floor tiles
    T.tile = canvas(); { const ctx = T.tile.getContext('2d'), r = RNG(41);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const k = ((x + y) % 2 ? 0.9 : 1.02) * (0.95 + r() * 0.1); ctx.fillStyle = col(196, 164, 118, k); ctx.fillRect(x * 64, y * 64, 64, 64); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x * 64, y * 64, 64, 2); ctx.fillRect(x * 64, y * 64, 2, 64); ctx.fillStyle = 'rgba(255,240,210,0.12)'; ctx.fillRect(x * 64 + 2, y * 64 + 2, 60, 2); }
      grain(T.tile, 0.25, 42); }
    // fluted column
    T.column = canvas(); pixels(T.column, (x, y) => { const f = 0.8 + 0.2 * Math.abs(Math.sin((x / 256) * Math.PI * 16)), n = pfbm(x / 32, y / 32, 8, 51); const k = f * (0.85 + n * 0.25); return [224 * k, 196 * k, 150 * k]; });
    { const ctx = T.column.getContext('2d'); for (const [y, c] of [[8, '#2a5aa8'], [18, '#a83a28'], [28, '#c89830']]) { ctx.fillStyle = c; ctx.globalAlpha = 0.55; ctx.fillRect(0, y, 256, 7); } ctx.globalAlpha = 1; }
    // gold
    T.gold = canvas(); pixels(T.gold, (x, y) => { const n = pfbm(x / 32, y / 32, 8, 61), h = Math.pow(pfbm(x / 16, y / 64, 16, 62), 2); const k = 0.75 + n * 0.35 + h * 0.4; return [255 * k, 196 * k, 70 * k]; });
    // canyon rock with strata
    T.rock = canvas(); pixels(T.rock, (x, y) => {
      const s = pfbm(x / 128, y / 24, 2, 71, 3), band = Math.sin((y + s * 60) / 256 * Math.PI * 10) * 0.08, n = pfbm(x / 32, y / 32, 8, 72), fine = S.hash2(x, y, 73) * 0.08;
      const crack = Math.abs(pnoise(x / 20, y / 40, 12.8, 74) - 0.5) < 0.02 ? 0.7 : 1; const k = (0.72 + n * 0.35 + band + fine) * crack;
      return [196 * k, 132 * k, 88 * k];
    });
    // tomb stone
    T.dark = canvas(); blocks(T.dark, 32, 48, 96, [128, 104, 80], 81, 2, 0.12); grain(T.dark, 0.3, 82);
    // bronze gate
    T.gate = canvas(); { const ctx = T.gate.getContext('2d'); pixels(T.gate, (x, y) => { const n = pfbm(x / 32, y / 32, 8, 91); const k = 0.7 + n * 0.4; return [150 * k, 104 * k, 52 * k]; });
      ctx.strokeStyle = 'rgba(40,24,8,0.8)'; ctx.lineWidth = 6; ctx.strokeRect(6, 6, 244, 244); ctx.lineWidth = 3; ctx.strokeRect(20, 20, 216, 216);
      ctx.fillStyle = 'rgba(40,24,8,0.6)'; for (let y = 50; y < 256; y += 60) ctx.fillRect(20, y, 216, 5);
      ctx.fillStyle = '#e0b860'; for (let i = 0; i < 8; i++) for (const [x, y] of [[12 + i * 33, 12], [12 + i * 33, 244]]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); }
      ctx.strokeStyle = '#f0c870'; ctx.lineWidth = 3; glyph(ctx, 0, 128, 128, 90); ctx.strokeStyle = 'rgba(40,24,8,0.7)'; glyph(ctx, 0, 130, 130, 90); }
    // palm bark
    T.palm = canvas(); pixels(T.palm, (x, y) => { const ring = ((y + x * 0.15) % 32) / 32, k = 0.6 + Math.pow(ring, 0.6) * 0.45 + (pfbm(x / 16, y / 16, 16, 101) - 0.5) * 0.2; return [128 * k, 92 * k, 58 * k]; });
    // leaf
    T.leaf = canvas(); pixels(T.leaf, (x, y) => { const v = Math.abs(x - 128) < 4 ? 0.7 : 1, d = Math.abs(((x - 128) * 0.5 + y) % 16 - 8) < 1 ? 0.85 : 1, n = 0.9 + pfbm(x / 16, y / 16, 16, 111) * 0.2; const k = v * d * n; return [235 * k, 245 * k, 225 * k]; });
    // rose granite with glyph column
    T.marble = canvas(); pixels(T.marble, (x, y) => { const n = pfbm(x / 16, y / 16, 16, 121), sp = S.hash2(x, y, 122) > 0.93 ? 0.7 : 1; const k = (0.78 + n * 0.3) * sp; return [190 * k, 112 * k, 96 * k]; });
    { const ctx = T.marble.getContext('2d'); ctx.strokeStyle = 'rgba(60,20,16,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(96, 4, 64, 248); const r = RNG(123); for (let y = 24; y < 250; y += 36) { ctx.strokeStyle = 'rgba(60,20,16,0.8)'; glyph(ctx, r.int(11), 128, y, 26, r); } }
    // water
    T.water = canvas(); pixels(T.water, (x, y) => { const c = Math.abs(pfbm(x / 32, y / 32, 8, 131) - 0.5) < 0.04 ? 1.35 : 1, n = 0.85 + pfbm(x / 64, y / 64, 4, 132) * 0.3; const k = c * n; return [50 * k, 120 * k, 140 * k]; });
    // generic model detail
    T.flesh = canvas(128); pixels(T.flesh, (x, y) => { const k = 0.82 + pfbm(x / 16, y / 16, 8, 141) * 0.28 + (S.hash2(x, y, 142) - 0.5) * 0.1; return [255 * k, 255 * k, 255 * k]; });
    T.plain = canvas(8); pixels(T.plain, () => [255, 255, 255]);
    // soft particle
    T.particle = canvas(64); pixels(T.particle, (x, y) => { const d = Math.hypot(x - 31.5, y - 31.5) / 32, a = Math.pow(clamp(1 - d, 0, 1), 1.6); return [255, 255, 255, a * 255]; });
    // cloud cover (alpha)
    T.cloud = canvas(); pixels(T.cloud, (x, y) => { const n = pfbm(x / 64, y / 64, 4, 151, 5); const a = clamp((n - 0.45) * 3.2, 0, 1); return [255, 255, 255, a * 255]; });
    return T;
  }

  S.textures = function () { if (!cache) cache = build(); return cache; };
  S.TEX_NAMES = ['sand', 'block', 'hiero', 'lime', 'tile', 'column', 'gold', 'rock', 'dark', 'gate', 'palm', 'leaf', 'marble', 'water', 'flesh', 'plain', 'particle', 'cloud'];
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.SeriousSam98 = globalThis.SeriousSam98 || {});
