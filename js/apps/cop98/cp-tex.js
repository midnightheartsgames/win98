(function (C) {
  'use strict';
  const { clamp, fbm, valueNoise, hash01, rgb } = C;

  function canvas(size) {
    const data = new Uint32Array(size * size);
    const put = (x, y, r, g, b, a = 255) => { data[(y & (size - 1)) * size + (x & (size - 1))] = ((a & 255) << 24 | (clamp(b | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(r | 0, 0, 255)) >>> 0; };
    return { size, data, put };
  }

  const tileNoise = (x, y, size, scale, seed, oct = 3) => {
    const fx = x / size, fy = y / size;
    const a = fbm(x / scale, y / scale, seed, oct), b = fbm((x - size) / scale, y / scale, seed, oct);
    const c = fbm(x / scale, (y - size) / scale, seed, oct), d = fbm((x - size) / scale, (y - size) / scale, seed, oct);
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  };

  const PAINTERS = {
    rust(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 9, 11, 4), m = tileNoise(x, y, s, 3, 12, 2), h = hash01(x, y, 13);
        const k = 0.74 + n * 0.36 + (h - 0.5) * 0.1;
        const rustAmt = clamp((n - 0.35) * 1.8 + (m - 0.5) * 0.7, 0, 1);
        t.put(x, y, (76 + rustAmt * 40) * k, (70 + rustAmt * 12) * k, (62 - rustAmt * 10) * k);
      }
    },
    hull(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 10, 21, 4), streak = tileNoise(x, y * 0.25, s, 4, 22, 2), h = hash01(x, y, 23);
        const seam = (y % 32 === 0 || x % 64 === 0) ? 0.72 : 1;
        const rivet = ((y % 32 === 3) && (x % 8 === 4)) ? 1.25 : 1;
        const rustAmt = clamp((streak - 0.5) * 2.0 + (n - 0.5) * 0.5, 0, 1);
        const k = (0.8 + n * 0.28 + (h - 0.5) * 0.08) * seam * rivet;
        const r = 62 + rustAmt * 44, g = 70 + rustAmt * 8, b = 66 - rustAmt * 12;
        t.put(x, y, r * k, g * k, b * k);
      }
    },
    hullred(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 8, 31, 4), h = hash01(x, y, 33), streak = tileNoise(x, y * 0.3, s, 5, 32, 2);
        const k = 0.7 + n * 0.45 + (h - 0.5) * 0.12;
        const dirt = clamp((streak - 0.4) * 2, 0, 1);
        t.put(x, y, (92 - dirt * 24) * k, (52 + dirt * 8) * k, (42 + dirt * 4) * k);
      }
    },
    deck(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 7, 41, 3), h = hash01(x, y, 43);
        const plate = (x % 32 === 0 || y % 32 === 0) ? 0.6 : 1;
        const tread = ((x + y) % 6 === 0 || (x - y + 64) % 6 === 0) ? 1.12 : 1;
        const k = (0.68 + n * 0.5 + (h - 0.5) * 0.1) * plate * tread;
        t.put(x, y, 92 * k, 84 * k, 72 * k);
      }
    },
    concrete(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 12, 51, 4), h = hash01(x, y, 53), stain = tileNoise(x, y, s, 20, 54, 2);
        const joint = (y % 32 === 0) ? 0.78 : 1;
        const k = (0.72 + n * 0.35 + (h - 0.5) * 0.18) * joint * (1 - clamp(stain - 0.6, 0, 1) * 0.8);
        t.put(x, y, 132 * k, 128 * k, 118 * k);
      }
    },
    panel(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 10, 61, 4), h = hash01(x, y, 63), streak = tileNoise(x, y * 0.2, s, 6, 64, 2);
        const joint = (x % 64 === 0 || y % 64 === 0) ? 0.55 : 1;
        const k = (0.75 + n * 0.3 + (h - 0.5) * 0.14) * joint * (1 - clamp(streak - 0.55, 0, 1));
        t.put(x, y, 150 * k, 146 * k, 132 * k);
      }
    },
    brick(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const row = (y / 8) | 0, off = (row & 1) * 8, bx = ((x + off) / 16) | 0;
        const mortar = (y % 8 === 0) || ((x + off) % 16 === 0);
        const n = tileNoise(x, y, s, 6, 71, 3), bv = hash01(bx, row, 72), h = hash01(x, y, 73);
        if (mortar) t.put(x, y, 110 + n * 30, 104 + n * 30, 94 + n * 25);
        else { const k = 0.7 + bv * 0.35 + n * 0.25 + (h - 0.5) * 0.1; t.put(x, y, 132 * k, 66 * k, 48 * k); }
      }
    },
    whitebrick(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const row = (y / 8) | 0, off = (row & 1) * 8;
        const mortar = (y % 8 === 0) || ((x + off) % 16 === 0);
        const n = tileNoise(x, y, s, 6, 75, 3), soot = tileNoise(x, y, s, 18, 76, 2), h = hash01(x, y, 77);
        const k = (mortar ? 0.72 : 0.9 + (h - 0.5) * 0.12) * (0.8 + n * 0.3) * (1 - clamp(soot - 0.55, 0, 1) * 1.2);
        t.put(x, y, 178 * k, 172 * k, 156 * k);
      }
    },
    planks(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const board = (x / 11) | 0, gap = x % 11 === 0;
        const grain = valueNoise(board * 7.1 + x * 0.05, y / 3.4, 81) * 0.5 + valueNoise(board * 3.3, y / 12, 82) * 0.5, h = hash01(x, y, 83);
        const bv = hash01(board, 0, 84);
        const k = gap ? 0.35 : 0.62 + grain * 0.4 + bv * 0.18 + (h - 0.5) * 0.08;
        t.put(x, y, 104 * k, 86 * k, 62 * k);
      }
    },
    darkplanks(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const board = (y / 9) | 0, gap = y % 9 === 0;
        const grain = valueNoise(x / 4, board * 5.1 + y * 0.05, 85), h = hash01(x, y, 86), bv = hash01(board, 1, 87);
        const k = gap ? 0.3 : 0.55 + grain * 0.35 + bv * 0.2 + (h - 0.5) * 0.08;
        t.put(x, y, 78 * k, 66 * k, 52 * k);
      }
    },
    logs(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const log = (y / 16) | 0, ly = (y % 16) / 16;
        const round = Math.sin(ly * Math.PI);
        const grain = valueNoise(x / 6, log * 4 + ly * 2, 91), h = hash01(x, y, 92);
        const k = (0.35 + round * 0.7) * (0.8 + grain * 0.3 + (h - 0.5) * 0.08);
        t.put(x, y, 112 * k, 88 * k, 60 * k);
      }
    },
    corrugated(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const wave = Math.sin(x / s * Math.PI * 16) * 0.5 + 0.5;
        const n = tileNoise(x, y, s, 9, 101, 3), streak = tileNoise(x * 0.3, y, s, 5, 102, 2), h = hash01(x, y, 103);
        const rustAmt = clamp((streak - 0.45) * 2 + (n - 0.5), 0, 1);
        const k = (0.6 + wave * 0.35) * (0.8 + n * 0.3 + (h - 0.5) * 0.1);
        t.put(x, y, (118 + rustAmt * 40) * k, (120 - rustAmt * 20) * k, (116 - rustAmt * 50) * k);
      }
    },
    roof(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const wave = Math.sin(x / s * Math.PI * 12) * 0.5 + 0.5;
        const n = tileNoise(x, y, s, 8, 111, 3), moss = tileNoise(x, y, s, 14, 112, 2), h = hash01(x, y, 113);
        const k = (0.62 + wave * 0.3) * (0.8 + n * 0.3 + (h - 0.5) * 0.1);
        const m = clamp((moss - 0.55) * 3, 0, 1);
        t.put(x, y, (118 - m * 40) * k, (116 - m * 10) * k, (108 - m * 50) * k);
      }
    },
    slate(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const row = (y / 8) | 0, off = (row & 1) * 6;
        const edge = (y % 8 === 7) || ((x + off) % 12 === 0);
        const n = tileNoise(x, y, s, 7, 121, 3), h = hash01(x, y, 123);
        const k = (edge ? 0.55 : 0.8 + n * 0.3) + (h - 0.5) * 0.08;
        t.put(x, y, 84 * k, 88 * k, 90 * k);
      }
    },
    window(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const frame = x < 4 || x >= s - 4 || y < 4 || y >= s - 4 || Math.abs(x - s / 2) < 2 || Math.abs(y - s / 2 + 6) < 2;
        const n = tileNoise(x, y, s, 8, 131, 2), h = hash01(x, y, 132);
        if (frame) t.put(x, y, 88 + n * 20, 76 + n * 16, 58 + n * 10);
        else { const broken = n > 0.62; t.put(x, y, broken ? 14 : 38 + h * 14, broken ? 14 : 46 + h * 12, broken ? 12 : 50 + h * 12, 255); }
      }
    },
    door(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 8, 141, 3), h = hash01(x, y, 142);
        const frame = x < 3 || x >= s - 3 || y < 3;
        const panel = (Math.abs(x - s / 2) > 20 || Math.abs(y - 20) > 12) && (Math.abs(y - 44) > 12 || Math.abs(x - s / 2) > 20);
        const k = (frame ? 0.5 : panel ? 0.85 : 0.72) * (0.8 + n * 0.3) + (h - 0.5) * 0.06;
        t.put(x, y, 88 * k, 90 * k, 70 * k);
      }
    },
    metal(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 6, 151, 3), h = hash01(x, y, 152), rustAmt = clamp((tileNoise(x, y, s, 10, 153, 2) - 0.5) * 3, 0, 1);
        const k = 0.72 + n * 0.35 + (h - 0.5) * 0.12;
        t.put(x, y, (100 + rustAmt * 40) * k, (100 - rustAmt * 10) * k, (98 - rustAmt * 40) * k);
      }
    },
    grate(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const bar = (x % 8 < 2) || (y % 8 < 2);
        const n = tileNoise(x, y, s, 6, 161, 2);
        if (bar) t.put(x, y, 92 + n * 30, 80 + n * 20, 66 + n * 10); else t.put(x, y, 0, 0, 0, 0);
      }
    },
    lattice(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const d1 = Math.abs(((x - y) % s + s) % s - s / 2) < 2.2, d2 = Math.abs(((x + y) % s) - s / 2) < 2.2;
        const frame = x < 4 || x >= s - 4 || y < 3;
        const n = tileNoise(x, y, s, 6, 171, 2);
        if (d1 || d2 || frame) t.put(x, y, 112 + n * 40, 72 + n * 20, 52 + n * 10); else t.put(x, y, 0, 0, 0, 0);
      }
    },
    fence(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 10, 181, 3), h = hash01(x, y, 182);
        const pattern = ((x / 8 | 0) + (y / 8 | 0)) & 1;
        const edge = x < 2 || x >= s - 2 || y < 2 || y >= s - 2;
        const k = (edge ? 0.6 : 0.78 + pattern * 0.08) * (0.8 + n * 0.3) + (h - 0.5) * 0.1;
        t.put(x, y, 128 * k, 126 * k, 116 * k);
      }
    },
    heli(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 9, 191, 3), camo = tileNoise(x, y, s, 16, 192, 2), h = hash01(x, y, 193);
        const seam = (x % 32 === 0 || y % 21 === 0) ? 0.7 : 1;
        const burnt = clamp((tileNoise(x, y, s, 12, 194, 3) - 0.6) * 3, 0, 1);
        const k = (0.7 + n * 0.35 + (h - 0.5) * 0.1) * seam * (1 - burnt * 0.7);
        const c = camo > 0.52 ? [76, 84, 52] : [96, 100, 66];
        t.put(x, y, c[0] * k, c[1] * k, c[2] * k);
      }
    },
    tarp(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 8, 201, 3), weave = ((x + y) & 1) ? 1.04 : 0.96, h = hash01(x, y, 202);
        const k = (0.7 + n * 0.4) * weave + (h - 0.5) * 0.06;
        t.put(x, y, 82 * k, 88 * k, 62 * k);
      }
    },
    tile(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const joint = (x % 16 === 0 || y % 16 === 0);
        const n = tileNoise(x, y, s, 8, 211, 3), h = hash01((x / 16) | 0, (y / 16) | 0, 212), dirt = tileNoise(x, y, s, 20, 213, 2);
        const k = (joint ? 0.6 : 0.85 + h * 0.15) * (0.8 + n * 0.25) * (1 - clamp(dirt - 0.55, 0, 1));
        t.put(x, y, 150 * k, 150 * k, 138 * k);
      }
    },
    plaster(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 9, 221, 4), h = hash01(x, y, 222), peel = tileNoise(x, y, s, 14, 223, 3);
        const brick = peel > 0.66;
        const k = 0.78 + n * 0.3 + (h - 0.5) * 0.1;
        if (brick) t.put(x, y, 120 * k, 64 * k, 46 * k); else t.put(x, y, 150 * k, 146 * k, 120 * k);
      }
    },
    rubber(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 6, 231, 2), h = hash01(x, y, 232);
        const k = 0.8 + n * 0.3 + (h - 0.5) * 0.1;
        t.put(x, y, 36 * k, 36 * k, 34 * k);
      }
    },
    rails(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const tie = (y % 16) < 5;
        const rail = Math.abs(x - 14) < 2 || Math.abs(x - 50) < 2;
        const n = tileNoise(x, y, s, 5, 241, 3), h = hash01(x, y, 242);
        let r = 92, g = 86, b = 80;
        if (tie) { r = 74; g = 58; b = 42; }
        if (rail) { r = 128; g = 104; b = 88; }
        const k = 0.75 + n * 0.35 + (h - 0.5) * 0.2;
        t.put(x, y, r * k, g * k, b * k);
      }
    },
    rock(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 10, 251, 5), h = hash01(x, y, 252), c = tileNoise(x, y, s, 4, 253, 2);
        const k = 0.6 + n * 0.5 + (c - 0.5) * 0.2 + (h - 0.5) * 0.1;
        t.put(x, y, 112 * k, 108 * k, 98 * k);
      }
    },
    earth(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 8, 261, 4), h = hash01(x, y, 262);
        const k = 0.7 + n * 0.4 + (h - 0.5) * 0.15;
        t.put(x, y, 96 * k, 82 * k, 60 * k);
      }
    },
    cloth(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 7, 271, 3), weave = ((x >> 1) + (y >> 1)) & 1 ? 1.05 : 0.95;
        const k = (0.7 + n * 0.35) * weave;
        t.put(x, y, 118 * k, 64 * k, 44 * k);
      }
    },
    sign(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 6, 281, 3);
        const tri = y > 10 && y < 54 && Math.abs(x - 32) < (y - 10) * 0.62;
        const inner = y > 20 && y < 48 && Math.abs(x - 32) < (y - 20) * 0.42;
        const mark = Math.abs(x - 32) < 3 && ((y > 26 && y < 40) || (y > 42 && y < 46));
        let c = [60, 58, 50];
        if (tri) c = [196, 168, 40];
        if (tri && !inner) c = [30, 28, 24];
        if (mark) c = [30, 28, 24];
        const k = 0.75 + n * 0.35;
        t.put(x, y, c[0] * k, c[1] * k, c[2] * k);
      }
    },
    lamp(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const d = Math.hypot(x - s / 2, y - s / 2) / (s / 2);
        const k = clamp(1.3 - d, 0, 1);
        t.put(x, y, 255 * k + 40, 220 * k + 30, 150 * k + 20);
      }
    },
    bar(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 5, 291, 3), h = hash01(x, y, 292);
        const shelf = y % 21 < 3;
        const bottle = !shelf && (x % 9 < 4) && (y % 21 > 8);
        const bc = hash01((x / 9) | 0, (y / 21) | 0, 293);
        let c = [72, 54, 36];
        if (shelf) c = [100, 80, 54];
        if (bottle) c = bc > 0.6 ? [60, 110, 50] : bc > 0.3 ? [150, 110, 50] : [190, 200, 190];
        const k = 0.75 + n * 0.3 + (h - 0.5) * 0.08;
        t.put(x, y, c[0] * k, c[1] * k, c[2] * k);
      }
    },
    poster(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 6, 301, 3);
        const border = x < 3 || x >= s - 3 || y < 3 || y >= s - 3;
        const star = Math.hypot(x - 32, y - 24) < 10 && ((Math.atan2(y - 24, x - 32) * 5 / Math.PI + 10) % 2 < 1.2);
        const text = y > 42 && y < 56 && x > 8 && x < 56 && ((x + (y >> 2)) % 5 < 3) && (y % 4 < 2);
        let c = [176, 160, 120];
        if (border) c = [120, 40, 30];
        if (star) c = [170, 40, 30];
        if (text) c = [50, 40, 30];
        const k = 0.72 + n * 0.35;
        t.put(x, y, c[0] * k, c[1] * k, c[2] * k);
      }
    },
    screen(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const border = x < 5 || x >= s - 5 || y < 5 || y >= s - 5;
        const line = (y % 3 === 0);
        const k = border ? 0.4 : line ? 0.5 : 0.8;
        t.put(x, y, border ? 60 : 50 * k, border ? 60 : 160 * k, border ? 56 : 90 * k);
      }
    },
    sand(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 6, 311, 3), h = hash01(x, y, 312);
        const k = 0.8 + n * 0.3 + (h - 0.5) * 0.2;
        t.put(x, y, 150 * k, 134 * k, 98 * k);
      }
    },
    stripes(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const band = ((x + y) >> 4) & 1;
        const n = tileNoise(x, y, s, 6, 321, 3), k = 0.75 + n * 0.35;
        const c = band ? [200, 170, 40] : [36, 34, 30];
        t.put(x, y, c[0] * k, c[1] * k, c[2] * k);
      }
    },
    graffiti(t, s) {
      PAINTERS.concrete(t, s);
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const stroke = Math.abs(Math.sin(x / 7) * 10 + 32 - y) < 2.4 || Math.abs(x - 10 - y * 0.3) < 1.6 && y > 18 && y < 46;
        if (stroke && x > 4 && x < 60) t.put(x, y, 150, 40, 36);
      }
    },
    olive(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const n = tileNoise(x, y, s, 8, 151, 4), m = tileNoise(x, y, s, 3, 152, 2), h = hash01(x, y, 153);
        const rustAmt = clamp((n - 0.58) * 2.4 + (m - 0.5) * 0.5, 0, 1), seam = (y % 32 === 0 || x % 48 === 0) ? 0.7 : 1;
        const k = (0.78 + n * 0.3 + (h - 0.5) * 0.08) * seam;
        t.put(x, y, (74 + rustAmt * 40) * k, (80 - rustAmt * 6) * k, (52 - rustAmt * 14) * k);
      }
    },
    charred(t, s) {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const log = (y / 16) | 0, ly = (y % 16) / 16, round = Math.sin(ly * Math.PI);
        const crack = Math.abs(valueNoise(x / 3, log * 7 + ly * 3, 141) - 0.5) < 0.05 ? 0.35 : 1, n = tileNoise(x, y, s, 7, 142, 3), h = hash01(x, y, 143);
        const ember = clamp((n - 0.62) * 4, 0, 1) * 0.6;
        const k = (0.3 + round * 0.55) * crack * (0.75 + n * 0.4 + (h - 0.5) * 0.12);
        t.put(x, y, (38 + ember * 50) * k + 6, (32 + ember * 14) * k + 5, 28 * k + 5);
      }
    }
  };

  const ORDER = Object.keys(PAINTERS);

  function buildTextures() {
    const list = [], index = {};
    for (const name of ORDER) {
      const t = canvas(64);
      PAINTERS[name](t, 64);
      index[name] = list.length;
      list.push({ name, w: 64, h: 64, shift: 6, data: t.data });
    }
    return { list, index };
  }

  C.TEXTURE_NAMES = ORDER;
  C.buildTextures = buildTextures;
})(globalThis.Cop98 = globalThis.Cop98 || {});
