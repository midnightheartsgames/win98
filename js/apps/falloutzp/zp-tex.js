(function (Z) {
  'use strict';

  const tn = (x, y, p, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const w = (a) => ((a % p) + p) % p;
    const h = (a, b) => Z.hash2(w(a), w(b), s);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const tfbm = (x, y, p, oct, s) => {
    let sum = 0, amp = 1, norm = 0, f = 1;
    for (let i = 0; i < oct; i++) { sum += tn(x * f, y * f, p * f, s + i * 31) * amp; norm += amp; amp *= 0.5; f *= 2; }
    return sum / norm;
  };
  const cellular = (x, y, p, s) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    let d1 = 9, d2 = 9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = xi + i, cy = yi + j, wx = ((cx % p) + p) % p, wy = ((cy % p) + p) % p;
      const px = cx + Z.hash2(wx, wy, s), py = cy + Z.hash2(wx, wy, s + 7);
      const d = Math.hypot(x - px, y - py);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    return [d1, d2];
  };
  Z.TexNoise = { tn, tfbm, cellular };

  const mk = (w, h) => {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };
  Z.mkCanvas = mk;

  const paint = (S, fn) => {
    const c = mk(S, S), g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const o = fn(x / S, y / S, x, y);
      const i = (y * S + x) * 4;
      d[i] = Z.clamp(o[0], 0, 255); d[i + 1] = Z.clamp(o[1], 0, 255); d[i + 2] = Z.clamp(o[2], 0, 255); d[i + 3] = o.length > 3 ? Z.clamp(o[3], 0, 255) : 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  };
  Z.paintTex = paint;

  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

  Z.TERRAIN_MATS = ['grass', 'steppe', 'dirt', 'forest', 'sand', 'rock', 'mud', 'rubble'];

  const terrainPainters = {
    grass: (u, v) => {
      const n = tfbm(u * 8, v * 8, 8, 4, 1), b = tfbm(u * 64, v * 16, 64, 2, 2), sp = tn(u * 128, v * 128, 128, 3);
      let c = mix3([62, 86, 38], [104, 124, 52], n);
      c = mix3(c, [128, 120, 66], Z.smooth(0.6, 0.9, tfbm(u * 4, v * 4, 4, 3, 4)) * 0.6);
      c = mul3(c, 0.78 + b * 0.4 + (sp > 0.85 ? 0.15 : 0));
      return c;
    },
    steppe: (u, v) => {
      const n = tfbm(u * 6, v * 6, 6, 4, 11), st = tfbm(u * 96, v * 24, 96, 2, 12), d = tn(u * 160, v * 160, 160, 13);
      let c = mix3([150, 132, 78], [178, 160, 98], n);
      c = mix3(c, [112, 108, 62], Z.smooth(0.55, 0.85, tfbm(u * 5, v * 5, 5, 3, 14)) * 0.7);
      c = mix3(c, [96, 80, 56], d > 0.88 ? 0.5 : 0);
      return mul3(c, 0.8 + st * 0.35);
    },
    dirt: (u, v) => {
      const n = tfbm(u * 10, v * 10, 10, 5, 21), [d1] = cellular(u * 24, v * 24, 24, 22), p = tn(u * 200, v * 200, 200, 23);
      let c = mix3([98, 78, 58], [136, 112, 84], n);
      if (d1 < 0.18) c = mix3(c, [160, 150, 136], (0.18 - d1) / 0.18 * 0.8);
      return mul3(c, 0.88 + p * 0.22);
    },
    forest: (u, v) => {
      const n = tfbm(u * 8, v * 8, 8, 4, 31), [d1, d2] = cellular(u * 20, v * 20, 20, 32), lf = tn(u * 40, v * 40, 40, 33);
      let c = mix3([58, 48, 34], [86, 72, 48], n);
      const leaf = Z.smooth(0.0, 0.12, d2 - d1);
      const tint = lf < 0.33 ? [120, 82, 40] : lf < 0.66 ? [96, 92, 44] : [132, 104, 52];
      c = mix3(c, tint, leaf * 0.55);
      return mul3(c, 0.85 + tn(u * 150, v * 150, 150, 34) * 0.25);
    },
    sand: (u, v) => {
      const n = tfbm(u * 6, v * 6, 6, 3, 41), g = tn(u * 220, v * 220, 220, 42), r = Math.sin((u * 18 + tfbm(u * 4, v * 4, 4, 2, 43) * 2) * Math.PI * 2) * 0.5 + 0.5;
      const c = mix3([186, 166, 124], [214, 196, 152], n);
      return mul3(c, 0.88 + g * 0.16 + r * 0.06);
    },
    rock: (u, v) => {
      const n = tfbm(u * 6, v * 6, 6, 5, 51), [d1, d2] = cellular(u * 9, v * 9, 9, 52), sp = tn(u * 180, v * 180, 180, 53), li = tfbm(u * 12, v * 12, 12, 3, 54);
      let c = mix3([104, 98, 96], [150, 138, 130], n);
      c = mix3(c, [168, 128, 118], Z.smooth(0.55, 0.8, tfbm(u * 3, v * 3, 3, 3, 55)) * 0.35);
      const crack = 1 - Z.smooth(0.0, 0.05, d2 - d1);
      c = mul3(c, 1 - crack * 0.45);
      if (sp > 0.9) c = mul3(c, 0.6); else if (sp < 0.07) c = mul3(c, 1.25);
      c = mix3(c, [128, 136, 70], Z.smooth(0.68, 0.85, li) * 0.6);
      return c;
    },
    mud: (u, v) => {
      const n = tfbm(u * 8, v * 8, 8, 4, 61), w = tfbm(u * 5, v * 5, 5, 3, 62);
      let c = mix3([54, 46, 34], [84, 72, 52], n);
      c = mix3(c, [70, 82, 60], Z.smooth(0.5, 0.8, w) * 0.5);
      return mul3(c, 0.9 + tn(u * 120, v * 120, 120, 63) * 0.2);
    },
    rubble: (u, v) => {
      const n = tfbm(u * 10, v * 10, 10, 4, 71), [d1, d2] = cellular(u * 14, v * 14, 14, 72), b = tn(u * 14, v * 14, 14, 73);
      let c = mix3([82, 82, 80], [124, 122, 116], n);
      const piece = Z.hash2(Math.floor(u * 14), Math.floor(v * 14), 74);
      if (piece > 0.82) c = mix3(c, [132, 76, 58], 0.6);
      const crack = 1 - Z.smooth(0.0, 0.04, d2 - d1);
      c = mul3(c, 1 - crack * 0.5);
      return mul3(c, 0.86 + b * 0.1 + tn(u * 200, v * 200, 200, 75) * 0.15);
    }
  };

  Z.Tex = {
    terrain(S = 256) { return Z.TERRAIN_MATS.map(k => paint(S, terrainPainters[k])); },
    paint,
    painters: terrainPainters
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
