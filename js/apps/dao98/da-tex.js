(function (D) {
  'use strict';
  const hash = (x, y, s) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const sm = t => t * t * (3 - 2 * t);
  const tnoise = (x, y, p, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi);
    const m = v => ((v % p) + p) % p;
    const a = hash(m(xi), m(yi), s), b = hash(m(xi + 1), m(yi), s), c = hash(m(xi), m(yi + 1), s), d = hash(m(xi + 1), m(yi + 1), s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  const tfbm = (x, y, p, s, oct) => {
    let v = 0, amp = 0.5, tot = 0, f = 1;
    for (let i = 0; i < (oct || 4); i++) { v += tnoise(x * f, y * f, p * f, s + i * 31) * amp; tot += amp; amp *= 0.5; f *= 2; }
    return v / tot;
  };
  const hex = c => {
    const n = parseInt(c.slice(1), 16);
    if (c.length === 4) return [((n >> 8) & 15) * 17, ((n >> 4) & 15) * 17, (n & 15) * 17];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const clamp255 = v => (v < 0 ? 0 : v > 255 ? 255 : v | 0);

  const canvas = (w, h) => {
    const c = typeof OffscreenCanvas !== 'undefined' && !D.noOffscreen ? new OffscreenCanvas(w, h) : document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };
  const make = (size, fn) => {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const o = fn(x, y);
      const i = (y * size + x) * 4;
      d[i] = clamp255(o[0]); d[i + 1] = clamp255(o[1]); d[i + 2] = clamp255(o[2]); d[i + 3] = o[3] === undefined ? 255 : clamp255(o[3]);
    }
    ctx.putImageData(img, 0, 0);
    return c;
  };
  const shade = (col, k) => [col[0] * k, col[1] * k, col[2] * k];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  const voronoi = (x, y, n, p, s) => {
    const fx = x / p * n, fy = y / p * n;
    const cx = Math.floor(fx), cy = Math.floor(fy);
    let d1 = 9, d2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const gx = cx + i, gy = cy + j;
      const wx = ((gx % n) + n) % n, wy = ((gy % n) + n) % n;
      const px = gx + 0.15 + hash(wx, wy, s) * 0.7, py = gy + 0.15 + hash(wx, wy, s + 9) * 0.7;
      const d = Math.hypot(px - fx, py - fy);
      if (d < d1) { d2 = d1; d1 = d; id = wx * 131 + wy; } else if (d < d2) d2 = d;
    }
    return { d1, d2, id, edge: d2 - d1 };
  };

  const P = {};
  P.flag = () => make(128, (x, y) => {
    const row = Math.floor(y / 32), off = (row % 2) * 20;
    const bx = Math.floor((x + off) / 42), lx = (x + off) % 42, ly = y % 32;
    const edge = Math.min(lx, 42 - lx, ly, 32 - ly);
    const k = 0.75 + hash(bx, row, 3) * 0.25;
    const n = tfbm(x / 16, y / 16, 8, 5, 4);
    const base = mix([112, 104, 92], [138, 128, 112], n);
    if (edge < 1.5) return shade([60, 54, 46], 0.9 + n * 0.2);
    return shade(base, k * (edge < 3 ? 0.88 : 1) * (0.9 + tfbm(x / 4, y / 4, 32, 7, 2) * 0.2));
  });
  P.cobble = () => make(128, (x, y) => {
    const v = voronoi(x, y, 8, 128, 11);
    const n = tfbm(x / 8, y / 8, 16, 2, 3);
    if (v.edge < 0.08) return [48, 44, 40];
    const k = 0.75 + hash(v.id, 1, 4) * 0.3;
    const dome = Math.min(1, v.edge * 3);
    return shade(mix([96, 92, 86], [130, 124, 112], n), k * (0.75 + dome * 0.3));
  });
  P.wood = () => make(64, (x, y) => {
    const plank = Math.floor(y / 16), ly = y % 16;
    const k = 0.8 + hash(plank, 0, 8) * 0.25;
    const g = tfbm(x / 32 + plank * 3, y / 3, 4, 9, 3);
    const grain = Math.sin((x / 64) * 6.28 * 3 + g * 8) * 0.5 + 0.5;
    let c = mix([92, 60, 34], [130, 88, 52], grain * 0.6 + g * 0.4);
    if (ly === 0 || ly === 15) c = shade(c, 0.5);
    if ((x + plank * 23) % 64 < 2 && ly > 3 && ly < 12) c = shade(c, 0.6);
    if (((x + plank * 23) % 64 === 4) && (ly === 4 || ly === 11)) c = [40, 36, 34];
    return shade(c, k);
  });
  P.carpet = () => make(64, (x, y) => {
    const n = tfbm(x / 4, y / 4, 16, 12, 2);
    const bx = Math.min(x, 63 - x);
    let c = [132, 22, 24];
    if (bx < 6) c = bx < 2 ? [60, 14, 16] : [184, 150, 60];
    else if (bx < 9) c = [96, 16, 18];
    else if (((x + y) % 16 < 2 || (x - y + 64) % 16 < 2) && bx > 12) c = [150, 36, 30];
    return shade(c, 0.85 + n * 0.3);
  });
  P.rug = () => make(64, (x, y) => {
    const cx = Math.abs(x - 32), cy = Math.abs(y - 32);
    const n = tfbm(x / 4, y / 4, 16, 13, 2);
    let c = [40, 50, 110];
    if (cx > 27 || cy > 27) c = [150, 120, 50];
    else if (cx + cy < 14) c = [150, 40, 40];
    else if (Math.abs(cx - cy) < 2) c = [170, 140, 70];
    return shade(c, 0.85 + n * 0.3);
  });
  const soil = (a, b, s, sc, fleck) => () => make(64, (x, y) => {
    const n = tfbm(x / sc, y / sc, 64 / sc, s, 4);
    let c = mix(a, b, n);
    const f = hash(x, y, s + 1);
    if (fleck && f > 0.93) c = mix(c, fleck, 0.6);
    return shade(c, 0.9 + hash(x >> 1, y >> 1, s) * 0.15);
  });
  P.dirt = soil([88, 68, 46], [124, 98, 66], 21, 8, [150, 140, 120]);
  P.mud = soil([54, 42, 30], [84, 66, 44], 22, 8, [40, 34, 28]);
  P.sand = soil([168, 150, 110], [196, 178, 138], 23, 8, [140, 120, 90]);
  P.ash = soil([56, 54, 52], [84, 80, 76], 24, 8, [140, 60, 30]);
  P.road = () => make(64, (x, y) => {
    const n = tfbm(x / 8, y / 8, 8, 25, 4);
    let c = mix([104, 84, 60], [138, 114, 84], n);
    if (Math.abs(x - 16) < 3 || Math.abs(x - 48) < 3) c = shade(c, 0.82);
    if (hash(x, y, 26) > 0.95) c = [150, 144, 132];
    return c;
  });
  P.grass = () => make(64, (x, y) => {
    const n = tfbm(x / 8, y / 8, 8, 31, 4);
    let c = mix([54, 78, 30], [92, 116, 44], n);
    const b = hash(x, y, 32);
    if (b > 0.82) c = mix(c, [120, 150, 60], 0.5);
    if (b < 0.1) c = shade(c, 0.7);
    return c;
  });
  P.forest = () => make(64, (x, y) => {
    const n = tfbm(x / 8, y / 8, 8, 33, 4);
    let c = mix([56, 48, 30], [84, 82, 40], n);
    const v = voronoi(x, y, 10, 64, 34);
    if (v.d1 < 0.22 && hash(v.id, 0, 35) > 0.5) c = mix(c, hash(v.id, 1, 36) > 0.5 ? [120, 70, 30] : [100, 96, 40], 0.7);
    return c;
  });
  P.marsh = () => make(64, (x, y) => {
    const n = tfbm(x / 10, y / 10, 6.4, 37, 4);
    let c = mix([40, 48, 30], [70, 76, 44], n);
    if (n < 0.38) c = mix(c, [30, 40, 36], 0.7);
    return c;
  });
  P.moss = () => make(64, (x, y) => {
    const v = voronoi(x, y, 5, 64, 38);
    const n = tfbm(x / 6, y / 6, 64 / 6, 39, 3);
    let c = mix([84, 88, 80], [110, 112, 100], n);
    if (v.edge < 0.07) c = [50, 60, 40];
    if (n > 0.55) c = mix(c, [70, 100, 44], (n - 0.55) * 2);
    return c;
  });
  P.straw = () => make(64, (x, y) => {
    const n = tfbm(x / 16, y / 2, 4, 40, 3);
    return mix([150, 120, 60], [200, 170, 90], n * (0.6 + hash(x, y >> 2, 41) * 0.4));
  });
  P.dwarf = () => make(128, (x, y) => {
    const lx = x % 64, ly = y % 64;
    const n = tfbm(x / 16, y / 16, 8, 42, 3);
    let c = mix([92, 60, 44], [120, 82, 58], n);
    const e = Math.min(lx, 64 - lx, ly, 64 - ly);
    if (e < 2) c = [40, 28, 22];
    else if (e < 5) c = [170, 130, 60];
    const cx = Math.abs(lx - 32), cy = Math.abs(ly - 32);
    if (Math.abs(cx + cy - 18) < 1.5) c = [160, 120, 56];
    if (cx + cy < 6) c = [110, 70, 40];
    return c;
  });
  P.deeproad = () => make(128, (x, y) => {
    const v = voronoi(x, y, 5, 128, 43);
    const n = tfbm(x / 12, y / 12, 128 / 12, 44, 4);
    let c = mix([54, 50, 48], [82, 76, 70], n);
    if (v.edge < 0.05) c = [26, 24, 24];
    return shade(c, 0.8 + hash(v.id, 2, 45) * 0.3);
  });
  P.stone = () => make(64, (x, y) => {
    const n = tfbm(x / 8, y / 8, 8, 46, 4);
    return mix([80, 80, 78], [120, 118, 112], n);
  });
  P.marble = () => make(128, (x, y) => {
    const lx = x % 64, ly = y % 64;
    const n = tfbm(x / 16, y / 16, 8, 47, 4);
    const vein = Math.abs(Math.sin((x + y) / 20 + n * 9));
    let c = mix([168, 166, 170], [210, 208, 212], n);
    if (vein < 0.08) c = shade(c, 0.75);
    if (Math.min(lx, 64 - lx, ly, 64 - ly) < 1.5) c = [90, 88, 96];
    return c;
  });
  P.elfstone = () => make(128, (x, y) => {
    const n = tfbm(x / 16, y / 16, 8, 48, 4);
    let c = mix([150, 160, 140], [186, 196, 176], n);
    const lx = x % 32, ly = y % 32;
    if (Math.min(lx, 32 - lx, ly, 32 - ly) < 1) c = [96, 110, 90];
    if (tfbm(x / 10, y / 10, 12.8, 49, 3) > 0.62) c = mix(c, [70, 110, 60], 0.6);
    return c;
  });
  P.ruin = () => make(128, (x, y) => {
    const row = Math.floor(y / 40), off = (row % 2) * 30;
    const lx = (x + off) % 60, ly = y % 40;
    const n = tfbm(x / 12, y / 12, 128 / 12, 50, 4);
    let c = mix([96, 92, 80], [126, 120, 104], n);
    if (Math.min(lx, 60 - lx, ly, 40 - ly) < 2) c = [50, 50, 42];
    const m = tfbm(x / 20, y / 20, 6.4, 51, 3);
    if (m > 0.56) c = mix(c, [60, 90, 40], Math.min(1, (m - 0.56) * 4));
    return c;
  });
  P.fade = () => make(64, (x, y) => {
    const n = tfbm(x / 8, y / 8, 8, 52, 4);
    const s = Math.sin(n * 12) * 0.5 + 0.5;
    return mix([60, 50, 80], [90, 130, 110], s * 0.7 + n * 0.3);
  });
  P.lava = () => make(64, (x, y) => {
    const v = voronoi(x, y, 5, 64, 53);
    const n = tfbm(x / 8, y / 8, 8, 54, 3);
    if (v.edge < 0.12) return mix([255, 200, 60], [255, 120, 20], n);
    return mix([60, 20, 10], [140, 40, 10], n * (1 - v.edge));
  });

  const masonry = (bw, bh, base, dark, s, moss) => () => make(128, (x, y) => {
    const row = Math.floor(y / bh), off = (row % 2) * (bw / 2);
    const bx = Math.floor((x + off) / bw), lx = (x + off) % bw, ly = y % bh;
    const n = tfbm(x / 10, y / 10, 12.8, s, 4);
    let c = mix(base, shade(base, 1.25), n);
    c = shade(c, 0.8 + hash(bx, row, s) * 0.3);
    const e = Math.min(lx, bw - lx, ly, bh - ly);
    if (e < 1.5) c = dark;
    else if (e < 3) c = shade(c, 0.85);
    if (moss) { const m = tfbm(x / 16, y / 16, 8, s + 3, 3); if (m > 0.58 && y > 60) c = mix(c, [60, 84, 40], (m - 0.58) * 3); }
    return c;
  });
  P.w_stone = masonry(42, 21, [104, 98, 88], [48, 44, 40], 60);
  P.w_ruin = masonry(64, 32, [110, 104, 88], [50, 48, 40], 61, true);
  P.w_brick = masonry(24, 10, [128, 70, 50], [70, 60, 50], 62);
  P.w_marble = masonry(64, 32, [150, 148, 156], [80, 78, 90], 63);
  P.w_dark = masonry(32, 32, [50, 46, 44], [22, 20, 20], 64);
  P.w_plaster = () => make(64, (x, y) => {
    const n = tfbm(x / 8, y / 8, 8, 65, 4);
    return mix([176, 166, 146], [210, 200, 180], n);
  });
  P.w_timber = () => make(128, (x, y) => {
    const n = tfbm(x / 8, y / 8, 16, 66, 4);
    const beam = x % 64 < 8 || y < 8 || y > 119 || Math.abs((x % 64) - (y % 64)) < 5 && y > 40 && y < 100;
    if (beam) return mix([70, 46, 28], [96, 64, 38], tfbm(x / 20, y / 3, 6.4, 67, 3));
    return mix([176, 164, 140], [206, 196, 172], n);
  });
  P.w_dwarf = () => make(128, (x, y) => {
    const n = tfbm(x / 12, y / 12, 128 / 12, 68, 4);
    let c = mix([88, 62, 48], [118, 86, 64], n);
    const lx = x % 32;
    if (lx < 3) c = shade(c, 0.6);
    if (y % 64 < 6) c = mix([150, 110, 56], [180, 140, 70], n);
    if (y % 64 > 58) c = shade(c, 0.6);
    const cx = Math.abs(lx - 17), cy = Math.abs((y % 64) - 32);
    if (Math.abs(cx * 2 + cy - 20) < 2 && cy < 18) c = [150, 110, 56];
    return c;
  });
  P.w_cave = () => make(128, (x, y) => {
    const n = tfbm(x / 10, y / 10, 12.8, 69, 5);
    const v = voronoi(x, y, 4, 128, 70);
    let c = mix([62, 56, 50], [104, 94, 84], n);
    if (v.edge < 0.06) c = shade(c, 0.55);
    return c;
  });
  P.w_rock = () => make(128, (x, y) => {
    const n = tfbm(x / 10, y / 14, 12.8, 71, 5);
    const st = Math.sin(y / 6 + n * 6) * 0.5 + 0.5;
    let c = mix([84, 78, 70], [128, 120, 106], n * 0.7 + st * 0.3);
    const m = tfbm(x / 20, y / 20, 6.4, 72, 3);
    if (m > 0.6) c = mix(c, [70, 90, 50], (m - 0.6) * 2.5);
    return c;
  });
  P.w_elfruin = () => make(128, (x, y) => {
    const n = tfbm(x / 12, y / 12, 128 / 12, 73, 4);
    let c = mix([140, 150, 132], [176, 186, 166], n);
    const lx = x % 64, ly = y % 64;
    if (Math.min(lx, 64 - lx, ly, 64 - ly) < 2) c = [84, 94, 78];
    const r = Math.hypot(lx - 32, ly - 32);
    if (Math.abs(r - 18) < 1.5) c = [110, 124, 104];
    const vine = Math.abs(x - 64 - Math.sin(y / 9) * 14);
    if (vine < 3 + tfbm(x / 5, y / 5, 25.6, 74, 2) * 3) c = mix([40, 80, 34], [70, 110, 50], n);
    return c;
  });
  P.w_fade = () => make(64, (x, y) => {
    const n = tfbm(x / 8, y / 8, 8, 75, 5);
    return mix([50, 40, 70], [100, 120, 110], Math.sin(n * 10 + y / 8) * 0.5 + 0.5);
  });
  P.w_palisade = () => make(64, (x, y) => {
    const log = Math.floor(x / 16), lx = x % 16;
    const n = tfbm(x / 16, y / 2, 4, 76, 3);
    let c = mix([84, 60, 36], [116, 86, 52], n);
    c = shade(c, 0.7 + Math.sin(lx / 16 * Math.PI) * 0.4);
    return shade(c, 0.9 + hash(log, 0, 77) * 0.2);
  });
  P.w_hedge = () => make(64, (x, y) => {
    const n = tfbm(x / 5, y / 5, 64 / 5, 78, 4);
    return mix([30, 56, 22], [70, 110, 40], n);
  });
  P.thatch = () => make(64, (x, y) => {
    const n = tfbm(x / 3, y / 16, 64 / 3, 79, 3);
    let c = mix([120, 96, 54], [168, 140, 80], n);
    if (y % 16 < 2) c = shade(c, 0.7);
    return c;
  });
  P.slate = () => make(64, (x, y) => {
    const row = Math.floor(y / 8), off = (row % 2) * 8;
    const lx = (x + off) % 16, ly = y % 8;
    let c = shade([70, 74, 84], 0.8 + hash(Math.floor((x + off) / 16), row, 80) * 0.3);
    if (lx < 1 || ly < 1) c = [36, 38, 44];
    return c;
  });
  P.bark = () => make(64, (x, y) => {
    const n = tfbm(x / 4, y / 16, 16, 81, 4);
    const r = Math.sin(x / 64 * 6.28 * 5 + n * 5);
    return shade(mix([66, 50, 36], [100, 80, 58], n), r > 0.6 ? 0.6 : 1);
  });
  P.leaves = () => make(64, (x, y) => {
    const v = voronoi(x, y, 9, 64, 82);
    const n = tfbm(x / 6, y / 6, 64 / 6, 83, 3);
    const edgeFade = Math.hypot(x - 32, y - 32) / 32;
    const a = v.d1 < 0.42 && hash(v.id, 3, 84) > 0.12 + edgeFade * 0.55 ? 255 : 0;
    return [...shade(mix([40, 70, 26], [90, 130, 46], n), 0.8 + hash(v.id, 4, 85) * 0.4), a];
  });
  P.pine = () => make(64, (x, y) => {
    const n = tfbm(x / 3, y / 8, 64 / 3, 86, 3);
    const w = (y / 64) * 30 + 2;
    const inside = Math.abs(x - 32) < w * (0.7 + 0.3 * Math.sin(y / 3)) && y > 2;
    return [...mix([24, 50, 30], [50, 86, 46], n), inside ? 255 : 0];
  });
  P.water = () => make(64, (x, y) => {
    const n = tfbm(x / 8, y / 8, 8, 87, 4);
    const r = Math.sin((x + n * 20) / 5) * 0.5 + 0.5;
    return [...mix([30, 60, 70], [80, 120, 130], n * 0.6 + r * 0.25), 190];
  });
  P.cloth = () => make(64, (x, y) => {
    const w = (x % 4 < 2) !== (y % 4 < 2) ? 1 : 0.9;
    return shade([220, 220, 220], w * (0.85 + tfbm(x / 8, y / 8, 8, 88, 3) * 0.2));
  });
  P.leather = () => make(64, (x, y) => {
    const n = tfbm(x / 6, y / 6, 64 / 6, 89, 4);
    let c = shade([200, 190, 180], 0.75 + n * 0.35);
    if (y % 32 === 0 || x % 32 === 0) c = shade(c, 0.6);
    if ((x % 32 === 3 || x % 32 === 29) && y % 6 < 2) c = shade(c, 0.7);
    return c;
  });
  P.studded = () => make(64, (x, y) => {
    const n = tfbm(x / 6, y / 6, 64 / 6, 90, 4);
    let c = shade([200, 190, 180], 0.75 + n * 0.35);
    const sx = x % 16 - 8, sy = y % 16 - 8;
    if (sx * sx + sy * sy < 6) c = sx + sy < 0 ? [240, 240, 240] : [150, 150, 150];
    return c;
  });
  P.chain = () => make(64, (x, y) => {
    const ox = (Math.floor(y / 4) % 2) * 2;
    const rx = ((x + ox) % 4) - 2, ry = (y % 4) - 2;
    const r = Math.hypot(rx + 0.5, ry + 0.5);
    let k = r > 0.9 && r < 2.1 ? 1.0 : 0.35;
    if (ry < -1) k *= 1.15;
    return shade([210, 212, 218], k * (0.9 + hash(x, y, 91) * 0.15));
  });
  P.plate = () => make(64, (x, y) => {
    const n = tfbm(x / 16, y / 2, 4, 92, 3);
    let c = shade([220, 222, 228], 0.8 + n * 0.25);
    if (y % 21 < 2) c = shade(c, 0.55);
    if (y % 21 === 3 && x % 12 === 6) c = [255, 255, 255];
    return c;
  });
  P.robe = () => make(64, (x, y) => {
    const fold = Math.sin(x / 64 * 6.28 * 4 + tfbm(x / 16, y / 16, 4, 93, 2) * 3) * 0.12 + 0.9;
    let c = shade([225, 225, 225], fold);
    if (y > 58) c = [230, 190, 90];
    if (Math.abs(x - 32) < 2) c = [230, 190, 90];
    return c;
  });
  P.skin = () => make(32, (x, y) => shade([235, 235, 235], 0.92 + tfbm(x / 4, y / 4, 8, 94, 3) * 0.12));
  P.hair = () => make(32, (x, y) => shade([235, 235, 235], 0.65 + tfbm(x / 1.5, y / 8, 21.3, 95, 3) * 0.55));
  P.fur = () => make(64, (x, y) => shade([230, 230, 230], 0.65 + tfbm(x / 2, y / 6, 32, 96, 4) * 0.5));
  P.chitin = () => make(64, (x, y) => {
    const v = voronoi(x, y, 6, 64, 97);
    return shade([200, 200, 200], v.edge < 0.07 ? 0.4 : 0.8 + v.edge * 0.4);
  });
  P.darkspawn = () => make(64, (x, y) => {
    const n = tfbm(x / 5, y / 5, 64 / 5, 98, 4);
    let c = mix([90, 88, 84], [128, 124, 118], n);
    const vein = Math.abs(Math.sin(x / 7 + tfbm(x / 10, y / 10, 6.4, 99, 2) * 6));
    if (vein < 0.06) c = [70, 40, 50];
    return c;
  });
  P.bone = () => make(32, (x, y) => mix([200, 190, 160], [230, 224, 200], tfbm(x / 4, y / 4, 8, 100, 3)));
  P.metal = () => make(32, (x, y) => shade([200, 202, 210], 0.75 + tfbm(x / 8, y / 1.5, 4, 101, 3) * 0.35));
  P.gold = () => make(32, (x, y) => shade([230, 180, 70], 0.75 + tfbm(x / 6, y / 6, 5.3, 102, 3) * 0.4));
  P.plain = () => make(8, () => [255, 255, 255]);
  P.glow = () => make(64, (x, y) => {
    const r = Math.hypot(x - 31.5, y - 31.5) / 32;
    const a = Math.max(0, 1 - r);
    return [255, 255, 255, a * a * 255];
  });
  P.spark = () => make(32, (x, y) => {
    const r = Math.hypot(x - 15.5, y - 15.5) / 16;
    const a = Math.max(0, 1 - r * 1.3);
    const s = Math.max(0, 1 - Math.abs(x - 15.5) / 2) + Math.max(0, 1 - Math.abs(y - 15.5) / 2);
    return [255, 255, 255, Math.min(255, (a * a + s * a * 0.6) * 255)];
  });
  P.smoke = () => make(64, (x, y) => {
    const r = Math.hypot(x - 31.5, y - 31.5) / 32;
    const n = tfbm(x / 8, y / 8, 8, 103, 4);
    return [255, 255, 255, Math.max(0, 1 - r) * n * 380];
  });
  P.blood = () => make(32, (x, y) => {
    const r = Math.hypot(x - 15.5, y - 15.5) / 16;
    const n = tfbm(x / 4, y / 4, 8, 104, 3);
    return [255, 255, 255, r < 0.5 + n * 0.5 ? 255 : 0];
  });
  P.ring = () => make(64, (x, y) => {
    const r = Math.hypot(x - 31.5, y - 31.5) / 32;
    const a = Math.max(0, 1 - Math.abs(r - 0.82) * 9);
    return [255, 255, 255, a * 255];
  });
  P.shadow = () => make(32, (x, y) => {
    const r = Math.hypot(x - 15.5, y - 15.5) / 16;
    return [0, 0, 0, Math.max(0, 1 - r) * 170];
  });
  P.cloud = () => make(128, (x, y) => {
    const n = tfbm(x / 16, y / 16, 8, 105, 5);
    const a = Math.max(0, (n - 0.45) * 3.2);
    return [255, 255, 255, Math.min(255, a * 255)];
  });
  P.web = () => make(64, (x, y) => {
    const dx = x - 32, dy = y - 32;
    const a = Math.atan2(dy, dx), r = Math.hypot(dx, dy);
    const spoke = Math.abs(Math.sin(a * 6)) < 0.05;
    const circ = Math.abs(Math.sin(r / 2.8)) < 0.12 && r < 31;
    return [230, 230, 230, spoke || circ ? 200 : 0];
  });
  P.mirror = () => make(64, (x, y) => {
    const n = tfbm(x / 8, y / 8, 8, 106, 4);
    return mix([30, 60, 60], [120, 200, 190], Math.sin(n * 14 + y / 10) * 0.5 + 0.5);
  });
  P.book = () => make(32, (x, y) => {
    const col = [[120, 30, 30], [40, 60, 110], [50, 90, 40], [110, 80, 30], [70, 40, 80]][Math.floor(x / 4) % 5];
    let c = shade(col, 0.7 + hash(Math.floor(x / 4), 0, 107) * 0.5);
    if (x % 4 === 0) c = [30, 20, 14];
    if (y % 16 < 2) c = [60, 40, 24];
    return c;
  });
  P.banner = () => make(64, (x, y) => {
    const n = tfbm(x / 8, y / 8, 8, 108, 3);
    let c = shade([230, 230, 230], 0.8 + n * 0.25);
    const cx = Math.abs(x - 32), cy = Math.abs(y - 28);
    if (cx + cy < 12 && cx + cy > 8) c = [240, 210, 110];
    if (y > 58 && (x % 8) < 4) c = [240, 210, 110];
    return c;
  });
  P.fire = () => make(32, (x, y) => {
    const r = Math.hypot((x - 15.5) * 1.2, (y - 18) * 0.8) / 16;
    const a = Math.max(0, 1 - r);
    return [255, 255, 255, a * 255];
  });

  const FLOOR_TEX = { flag: 'flag', cobble: 'cobble', wood: 'wood', carpet: 'carpet', dirt: 'dirt', grass: 'grass', forest: 'forest', mud: 'mud', marsh: 'marsh', sand: 'sand', dwarf: 'dwarf', deeproad: 'deeproad', fade: 'fade', marble: 'marble', straw: 'straw', ruin: 'ruin', road: 'road', rug: 'rug', lava: 'lava', stone: 'stone', elfstone: 'elfstone', moss: 'moss', ash: 'ash' };
  const WALL_TEX = { stone: 'w_stone', plaster: 'w_plaster', timber: 'w_timber', dwarf: 'w_dwarf', cave: 'w_cave', ruin: 'w_ruin', elfruin: 'w_elfruin', marble: 'w_marble', fade: 'w_fade', rock: 'w_rock', palisade: 'w_palisade', hedge: 'w_hedge', brick: 'w_brick', dark: 'w_dark' };

  const faceCache = new Map();
  const face = look => {
    const key = [look.race, look.sex, look.skin, look.hair, look.eyes, look.beard, look.tattoo, look.kind, look.ghost].join('|');
    if (faceCache.has(key)) return faceCache.get(key);
    const c = canvas(64, 64);
    const g = c.getContext('2d');
    const skin = look.skin || '#e0b896';
    const hair = look.hair || '#3a2414';
    const ds = look.race === 'hurlock' || look.race === 'genlock' || look.kind === 'hurlock' || look.kind === 'genlock' || look.kind === 'ogre';
    g.fillStyle = skin; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.05) + ')'; g.fillRect(Math.random() * 64, Math.random() * 64, 3, 3); }
    const grad = g.createRadialGradient(32, 34, 8, 32, 34, 40);
    grad.addColorStop(0, 'rgba(255,255,255,0.08)'); grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    if (ds) {
      g.fillStyle = '#111'; g.fillRect(14, 24, 12, 6); g.fillRect(38, 24, 12, 6);
      g.fillStyle = '#c33'; g.fillRect(18, 26, 3, 2); g.fillRect(42, 26, 3, 2);
      g.fillStyle = '#2a1a1a'; g.fillRect(16, 42, 32, 10);
      g.fillStyle = '#ddc'; for (let i = 0; i < 8; i++) { g.fillRect(17 + i * 4, 42, 2, 4); g.fillRect(18 + i * 4, 48, 2, 4); }
      g.strokeStyle = 'rgba(60,20,30,0.6)'; g.beginPath(); g.moveTo(10, 10); g.lineTo(26, 40); g.moveTo(54, 12); g.lineTo(40, 38); g.stroke();
    } else {
      const eye = look.eyes || '#3a5a8a';
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(13, 24, 14, 8); g.fillRect(37, 24, 14, 8);
      g.fillStyle = '#eee8e0'; g.fillRect(15, 27, 10, 4); g.fillRect(39, 27, 10, 4);
      g.fillStyle = eye; g.fillRect(18, 27, 4, 4); g.fillRect(42, 27, 4, 4);
      g.fillStyle = '#000'; g.fillRect(19, 28, 2, 2); g.fillRect(43, 28, 2, 2);
      g.fillStyle = hair; g.fillRect(13, 22 - (look.sex === 'f' ? 0 : 1), 14, look.sex === 'f' ? 2 : 3); g.fillRect(37, 22 - (look.sex === 'f' ? 0 : 1), 14, look.sex === 'f' ? 2 : 3);
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(30, 30, 4, 12); g.fillRect(28, 40, 8, 3);
      g.fillStyle = look.sex === 'f' ? '#a04848' : 'rgba(90,40,30,0.7)'; g.fillRect(24, 47, 16, look.sex === 'f' ? 4 : 3);
      if (look.sex === 'f') { g.fillStyle = 'rgba(255,120,120,0.12)'; g.fillRect(10, 36, 10, 6); g.fillRect(44, 36, 10, 6); }
      if (look.tattoo === 'vallaslin') {
        g.strokeStyle = look.race === 'elf' ? '#2a4a6a' : '#3a5a3a'; g.lineWidth = 2; g.beginPath();
        g.moveTo(32, 8); g.lineTo(32, 22); g.moveTo(22, 12); g.quadraticCurveTo(16, 30, 8, 34); g.moveTo(42, 12); g.quadraticCurveTo(48, 30, 56, 34);
        g.moveTo(20, 50); g.lineTo(14, 60); g.moveTo(44, 50); g.lineTo(50, 60); g.stroke();
      } else if (look.tattoo === 'brand') {
        g.fillStyle = 'rgba(60,20,20,0.7)'; g.fillRect(44, 34, 8, 10); g.fillStyle = 'rgba(20,10,10,0.6)'; g.fillRect(46, 36, 4, 6);
      } else if (look.tattoo === 'scar') {
        g.strokeStyle = 'rgba(120,50,50,0.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(40, 14); g.lineTo(50, 40); g.stroke();
      }
      const b = look.beard;
      if (b && b !== 'none' && look.sex !== 'f') {
        g.fillStyle = hair;
        g.globalAlpha = b === 'stubble' ? 0.35 : 1;
        if (b === 'goatee') { g.fillRect(26, 50, 12, 12); g.fillRect(22, 44, 20, 3); }
        else { g.fillRect(8, 40, 48, 24); g.globalAlpha = b === 'stubble' ? 0.35 : 1; g.fillStyle = skin; if (b !== 'stubble') g.fillRect(24, 46, 16, 5); g.fillStyle = hair; g.fillRect(20, 43, 24, 3); }
        g.globalAlpha = 1;
        if (b === 'braided') { g.fillStyle = 'rgba(0,0,0,0.3)'; for (let i = 0; i < 4; i++) g.fillRect(14 + i * 10, 52, 2, 12); }
      }
    }
    if (look.ghost) { g.fillStyle = 'rgba(160,200,255,0.4)'; g.fillRect(0, 0, 64, 64); }
    faceCache.set(key, c);
    return c;
  };

  D.TEX = { P, FLOOR_TEX, WALL_TEX, face, hex, tfbm, hash, canvas };
})(globalThis.Dao98 = globalThis.Dao98 || {});
