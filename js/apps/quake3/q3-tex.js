(function (Q) {
  'use strict';

  function mkCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  Q.mkCanvas = mkCanvas;

  function noiseGrid(n, rnd) {
    const g = new Float32Array(n * n);
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    return g;
  }

  function valueNoise(size, cells, rnd) {
    const g = noiseGrid(cells, rnd);
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const fx = x / size * cells, fy = y / size * cells;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = fx - x0, ty = fy - y0;
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        const a = g[(y0 % cells) * cells + (x0 % cells)], b = g[(y0 % cells) * cells + ((x0 + 1) % cells)];
        const c = g[((y0 + 1) % cells) * cells + (x0 % cells)], d = g[((y0 + 1) % cells) * cells + ((x0 + 1) % cells)];
        out[y * size + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
      }
    }
    return out;
  }

  function fbm(size, base, oct, seed) {
    const rnd = Q.rng(seed);
    const out = new Float32Array(size * size);
    let amp = 1, tot = 0;
    for (let o = 0; o < oct; o++) {
      const n = valueNoise(size, base << o, rnd);
      for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
      tot += amp;
      amp *= 0.5;
    }
    for (let i = 0; i < out.length; i++) out[i] /= tot;
    return out;
  }
  Q.fbm = fbm;

  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  class Tex {
    constructor(w, h) {
      this.w = w; this.h = h || w;
      this.d = new Float32Array(this.w * this.h * 4);
      for (let i = 3; i < this.d.length; i += 4) this.d[i] = 255;
    }
    fill(c) { const [r, g, b] = typeof c === 'string' ? hex(c) : c; for (let i = 0; i < this.d.length; i += 4) { this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; } return this; }
    idx(x, y) { x = ((x % this.w) + this.w) % this.w; y = ((y % this.h) + this.h) % this.h; return (y * this.w + x) * 4; }
    mul(x, y, f) { const i = this.idx(x, y); this.d[i] *= f; this.d[i + 1] *= f; this.d[i + 2] *= f; }
    add(x, y, v) { const i = this.idx(x, y); this.d[i] += v; this.d[i + 1] += v; this.d[i + 2] += v; }
    set(x, y, c, a) {
      const i = this.idx(x, y);
      if (a === undefined || a >= 1) { this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; return; }
      this.d[i] += (c[0] - this.d[i]) * a; this.d[i + 1] += (c[1] - this.d[i + 1]) * a; this.d[i + 2] += (c[2] - this.d[i + 2]) * a;
    }
    alpha(x, y, a) { this.d[this.idx(x, y) + 3] = a; }
    noise(n, amt, sz) {
      sz = sz || this.w;
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.mul(x, y, 1 + (n[(y % sz) * sz + (x % sz)] - 0.5) * amt);
      return this;
    }
    tint(n, c, amt, sz) {
      sz = sz || this.w;
      const col = typeof c === 'string' ? hex(c) : c;
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const v = n[(y % sz) * sz + (x % sz)];
        if (v > 0.5) this.set(x, y, col, Math.min(1, (v - 0.5) * 2 * amt));
      }
      return this;
    }
    rect(x0, y0, w, h, c, a) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, c, a); return this; }
    shade(x0, y0, w, h, f) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.mul(x, y, f); return this; }
    bevel(x0, y0, w, h, b, hi, lo) {
      for (let k = 0; k < b; k++) {
        for (let x = x0 + k; x < x0 + w - k; x++) { this.mul(x, y0 + k, hi); this.mul(x, y0 + h - 1 - k, lo); }
        for (let y = y0 + k + 1; y < y0 + h - 1 - k; y++) { this.mul(x0 + k, y, hi); this.mul(x0 + w - 1 - k, y, lo); }
      }
      return this;
    }
    circle(cx, cy, r, c, a, soft) {
      for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d > r) continue;
        const k = soft ? Math.min(1, (r - d) / soft) : 1;
        this.set(x, y, c, (a === undefined ? 1 : a) * k);
      }
      return this;
    }
    line(x0, y0, x1, y1, c, a, wdt) {
      const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) + 1;
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
        if (wdt && wdt > 1) this.circle(x, y, wdt / 2, c, a); else this.set(Math.round(x), Math.round(y), c, a);
      }
      return this;
    }
    crack(rnd, x, y, len, c) {
      let a = rnd() * Math.PI * 2;
      for (let i = 0; i < len; i++) {
        this.set(Math.round(x), Math.round(y), c, 0.55);
        a += (rnd() - 0.5) * 0.9;
        x += Math.cos(a); y += Math.sin(a);
      }
      return this;
    }
    toImage() {
      const c = mkCanvas(this.w, this.h);
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(this.w, this.h);
      for (let i = 0; i < this.d.length; i++) img.data[i] = Math.max(0, Math.min(255, this.d[i]));
      ctx.putImageData(img, 0, 0);
      return c;
    }
  }
  Q.Tex = Tex;

  function blocks(t, rnd, rows, cols, stagger, mortar, base, varAmt, bev) {
    const bw = t.w / cols, bh = t.h / rows;
    const [r, g, b] = hex(base);
    for (let j = 0; j < rows; j++) {
      const off = stagger && j % 2 ? bw / 2 : 0;
      for (let i = -1; i < cols; i++) {
        const x0 = Math.round(i * bw + off), y0 = Math.round(j * bh);
        const v = 1 + (rnd() - 0.5) * varAmt, hue = (rnd() - 0.5) * 12;
        for (let y = y0; y < y0 + bh; y++) for (let x = x0; x < x0 + bw; x++) {
          const xi = ((x % t.w) + t.w) % t.w;
          t.set(xi, y, [r * v + hue, g * v, b * v - hue * 0.5]);
        }
        const xs = ((x0 % t.w) + t.w) % t.w;
        for (let y = y0; y < y0 + bh; y++) for (let k = 0; k < mortar; k++) t.set(xs + k, y, hex('#1c1612'), 0.85);
        for (let x = x0; x < x0 + bw; x++) for (let k = 0; k < mortar; k++) t.set(x, y0 + k, hex('#1c1612'), 0.85);
        if (bev) t.bevel(xs + mortar, y0 + mortar, Math.round(bw) - mortar, Math.round(bh) - mortar, bev, 1.12, 0.8);
      }
    }
  }

  const GEN = {
    gfloor(rnd) {
      const t = new Tex(256).fill('#6e5d4c');
      blocks(t, rnd, 2, 2, false, 3, '#6e5d4c', 0.22, 3);
      t.noise(fbm(256, 8, 5, 11), 0.55).tint(fbm(256, 4, 3, 12), '#4a3a2c', 0.5);
      for (let i = 0; i < 9; i++) t.crack(rnd, rnd() * 256, rnd() * 256, 20 + rnd() * 40, [30, 24, 20]);
      return t;
    },
    gfloor2(rnd) {
      const t = new Tex(128).fill('#5e5046');
      blocks(t, rnd, 2, 2, false, 2, '#5e5046', 0.12, 2);
      for (let k = 0; k < 4; k++) {
        const cx = (k % 2) * 64 + 32, cy = Math.floor(k / 2) * 64 + 32;
        for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) if (Math.abs(x) + Math.abs(y) <= 14) t.set(cx + x, cy + y, hex('#7a3a26'), Math.abs(x) + Math.abs(y) > 11 ? 0.9 : 0.55);
      }
      t.noise(fbm(128, 8, 4, 21), 0.45);
      return t;
    },
    gwall(rnd) {
      const t = new Tex(256).fill('#6f5a47');
      blocks(t, rnd, 8, 4, true, 2, '#6f5a47', 0.25, 2);
      t.noise(fbm(256, 8, 5, 31), 0.6).tint(fbm(256, 4, 3, 32), '#3e2e22', 0.45);
      return t;
    },
    gblock(rnd) {
      const t = new Tex(256).fill('#8a7560');
      blocks(t, rnd, 4, 2, true, 3, '#8a7560', 0.16, 4);
      t.noise(fbm(256, 8, 5, 41), 0.45).tint(fbm(256, 4, 3, 42), '#5a4636', 0.4);
      return t;
    },
    gbrick(rnd) {
      const t = new Tex(128).fill('#7a3f2c');
      blocks(t, rnd, 8, 4, true, 2, '#7a3f2c', 0.28, 1);
      t.noise(fbm(128, 8, 4, 51), 0.5);
      return t;
    },
    gtrim(rnd) {
      const t = new Tex(128, 64).fill('#6c5638');
      t.noise(fbm(128, 8, 3, 61), 0.4, 128);
      for (let x = 0; x < 128; x++) { t.mul(x, 0, 0.5); t.mul(x, 1, 0.7); t.mul(x, 62, 1.3); t.mul(x, 63, 0.5); t.mul(x, 8, 1.3); t.mul(x, 55, 0.7); }
      for (let k = 0; k < 4; k++) {
        const cx = k * 32 + 16;
        t.circle(cx, 32, 12, hex('#8d7248'), 1).circle(cx, 32, 12, hex('#3a2c1a'), 0.35, 2);
        t.circle(cx, 32, 7, hex('#4e3c24'), 1).circle(cx - 2, 30, 3, hex('#b09060'), 0.6);
        t.line(cx + 16, 14, cx + 16, 50, hex('#3a2c1a'), 0.8);
      }
      return t;
    },
    gskull(rnd) {
      const t = new Tex(128, 64).fill('#5e4a36');
      t.noise(fbm(128, 8, 3, 71), 0.4, 128);
      for (let k = 0; k < 4; k++) {
        const cx = k * 32 + 16;
        t.circle(cx, 28, 11, hex('#c8b890'), 1, 2).circle(cx - 4, 27, 3, hex('#201810'), 1).circle(cx + 4, 27, 3, hex('#201810'), 1);
        t.rect(cx - 6, 36, 12, 7, hex('#b8a880'), 1);
        for (let i = -5; i <= 5; i += 3) t.line(cx + i, 37, cx + i, 42, hex('#302418'), 1);
        t.circle(cx, 31, 1.5, hex('#302418'), 1);
      }
      for (let x = 0; x < 128; x++) { t.mul(x, 0, 0.5); t.mul(x, 63, 0.5); }
      return t;
    },
    gcol(rnd) {
      const t = new Tex(64, 128).fill('#7d6a55');
      for (let x = 0; x < 64; x++) {
        const f = 0.8 + 0.35 * Math.abs(Math.sin(x / 64 * Math.PI * 6));
        for (let y = 0; y < 128; y++) t.mul(x, y, f);
      }
      t.noise(fbm(128, 8, 4, 81), 0.35, 128);
      return t;
    },
    gceil(rnd) {
      const t = new Tex(128).fill('#3e3228');
      blocks(t, rnd, 4, 4, false, 2, '#3e3228', 0.2, 1);
      for (let i = 0; i < 128; i++) { t.set(i, i, hex('#5a4a3a'), 0.8); t.set(127 - i, i, hex('#5a4a3a'), 0.8); }
      t.noise(fbm(128, 8, 4, 91), 0.5);
      return t;
    },
    gmetal(rnd) {
      const t = new Tex(128).fill('#4a4440');
      blocks(t, rnd, 2, 2, false, 2, '#4a4440', 0.15, 2);
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) for (const [ox, oy] of [[8, 8], [56, 8], [8, 56], [56, 56]]) t.circle(i * 64 + ox, j * 64 + oy, 2.5, hex('#8a8078'), 1).circle(i * 64 + ox + 0.7, j * 64 + oy + 0.7, 1.2, hex('#2a2420'), 0.8);
      t.noise(fbm(128, 8, 5, 101), 0.5).tint(fbm(128, 4, 4, 102), '#7a4020', 0.6);
      return t;
    },
    gold(rnd) {
      const t = new Tex(128).fill('#a07a30');
      t.noise(fbm(128, 8, 4, 111), 0.5);
      for (let k = 0; k < 4; k++) t.circle(k * 32 + 16, 64, 12, hex('#e0b860'), 0.5, 3);
      return t;
    },
    gbone() { return new Tex(64).fill('#c8b898').noise(fbm(64, 4, 3, 121), 0.4); },
    lightpanel() {
      const t = new Tex(64).fill('#fff4d8');
      t.bevel(0, 0, 64, 64, 4, 0.7, 0.5);
      return t;
    },
    lightred() { return new Tex(64).fill('#ff4020').noise(fbm(64, 4, 3, 131), 0.5); },
    lightblue() { const t = new Tex(64).fill('#80b8ff'); t.bevel(0, 0, 64, 64, 3, 0.8, 0.6); return t; },
    rust(rnd) {
      const t = new Tex(128).fill('#6a4630');
      t.noise(fbm(128, 8, 5, 141), 0.7).tint(fbm(128, 8, 4, 142), '#3a2418', 0.6);
      blocks(t, rnd, 1, 2, false, 2, '#6a4630', 0.1, 0);
      return t;
    },
    metal(rnd) {
      const t = new Tex(128).fill('#5c6068');
      blocks(t, rnd, 2, 1, false, 2, '#5c6068', 0.08, 2);
      for (let y = 0; y < 128; y += 64) for (let x = 6; x < 128; x += 20) t.circle(x, y + 6, 1.8, hex('#9aa0a8'), 1);
      t.noise(fbm(128, 8, 4, 151), 0.35);
      return t;
    },
    techfloor(rnd) {
      const t = new Tex(64).fill('#545860');
      for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) {
        const o = (y / 8) % 2 ? 4 : 0;
        t.line(x + o, y + 2, x + o + 3, y + 5, hex('#8a9098'), 1);
        t.line(x + o + 1, y + 2, x + o + 4, y + 5, hex('#2a2c30'), 0.6);
      }
      t.noise(fbm(64, 4, 3, 161), 0.3);
      return t;
    },
    grate() {
      const t = new Tex(64).fill('#1a1a1c');
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (x % 8 < 2 || y % 8 < 2) t.set(x, y, hex('#6a6e74'));
      return t;
    },
    tech(rnd) {
      const t = new Tex(128).fill('#4a5058');
      blocks(t, rnd, 4, 2, false, 2, '#4a5058', 0.1, 2);
      t.rect(12, 44, 40, 6, hex('#6ab0ff'), 0.9).rect(76, 108, 30, 4, hex('#ffb040'), 0.9);
      for (let i = 0; i < 6; i++) t.rect(80 + i * 6, 14, 3, 20, hex('#2a3038'), 1);
      t.noise(fbm(128, 8, 4, 171), 0.3);
      return t;
    },
    hazard() {
      const t = new Tex(64).fill('#d8b020');
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (((x + y) % 32) < 16) t.set(x, y, hex('#202020'));
      t.noise(fbm(64, 4, 3, 181), 0.3);
      return t;
    },
    flesh(rnd) {
      const t = new Tex(128).fill('#6a2a22');
      t.noise(fbm(128, 4, 5, 191), 0.8).tint(fbm(128, 8, 4, 192), '#a04030', 0.6);
      for (let i = 0; i < 14; i++) t.crack(rnd, rnd() * 128, rnd() * 128, 30 + rnd() * 50, [40, 8, 8]);
      return t;
    },
    lava() {
      const t = new Tex(128).fill('#c83808');
      const n = fbm(128, 4, 5, 201);
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        const v = n[y * 128 + x];
        t.set(x, y, [255 * Math.min(1, v * 1.6), 200 * Math.max(0, v - 0.35) * 2.2, 40 * Math.max(0, v - 0.6) * 4]);
      }
      return t;
    },
    slime() {
      const t = new Tex(128).fill('#40a020');
      t.noise(fbm(128, 4, 5, 211), 0.9);
      return t;
    },
    sky() {
      const t = new Tex(256);
      const n = fbm(256, 4, 6, 221);
      for (let i = 0; i < n.length; i++) { const v = Math.pow(n[i], 1.6) * 255 * 1.3; t.d[i * 4] = v; t.d[i * 4 + 1] = v; t.d[i * 4 + 2] = v; }
      return t;
    },
    stone(rnd) {
      const t = new Tex(128).fill('#5a5550');
      t.noise(fbm(128, 8, 5, 231), 0.6);
      return t;
    },
    marble(rnd) {
      const t = new Tex(128).fill('#8a8078');
      const n = fbm(128, 4, 5, 241);
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const v = Math.abs(Math.sin((x + n[y * 128 + x] * 90) / 9)); t.mul(x, y, 0.75 + v * 0.35); }
      blocks(t, rnd, 2, 2, false, 1, '#8a8078', 0, 0);
      return t;
    },
    wood(rnd) {
      const t = new Tex(128).fill('#5a3a20');
      const n = fbm(128, 4, 4, 251);
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) t.mul(x, y, 0.8 + 0.3 * Math.sin((y + n[y * 128 + x] * 40) / 3));
      return t;
    }
  };
  Q.TEXGEN = GEN;

  Q.MAT_TEX = {
    gfloor: { tex: 'gfloor', size: 256 }, gfloor2: { tex: 'gfloor2', size: 128 }, gwall: { tex: 'gwall', size: 256 }, gblock: { tex: 'gblock', size: 256 },
    gbrick: { tex: 'gbrick', size: 128 }, gtrim: { tex: 'gtrim', size: 64, sx: 128 }, gskull: { tex: 'gskull', size: 64, sx: 128 }, gcol: { tex: 'gcol', size: 64, sy: 128 },
    gceil: { tex: 'gceil', size: 128 }, gmetal: { tex: 'gmetal', size: 128 }, gold: { tex: 'gold', size: 64 }, gbone: { tex: 'gbone', size: 64 },
    lightpanel: { tex: 'lightpanel', size: 32, glow: 1 }, lightred: { tex: 'lightred', size: 64, glow: 1 }, lightblue: { tex: 'lightblue', size: 32, glow: 1 },
    rust: { tex: 'rust', size: 128 }, metal: { tex: 'metal', size: 128 }, techfloor: { tex: 'techfloor', size: 64 }, grate: { tex: 'grate', size: 32 },
    tech: { tex: 'tech', size: 128 }, hazard: { tex: 'hazard', size: 64 }, flesh: { tex: 'flesh', size: 128 }, lava: { tex: 'lava', size: 128, lava: 1 },
    slime: { tex: 'slime', size: 128, lava: 1 }, stone: { tex: 'stone', size: 128 }, marble: { tex: 'marble', size: 128 }, wood: { tex: 'wood', size: 128 },
    jumppad: { tex: 'metal', size: 64, glow: 1 }, glass: { tex: 'grate', size: 32 }
  };

  const DECALS = {
    emblem(t) {
      const S = t.w, c = S / 2;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) t.d[(y * S + x) * 4 + 3] = 0;
      const put = (x, y, col, a) => { const i = t.idx(x, y); t.d[i] = col[0]; t.d[i + 1] = col[1]; t.d[i + 2] = col[2]; t.d[i + 3] = Math.max(t.d[i + 3], a * 255); };
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const dx = x - c, dy = y - c * 0.94, d = Math.hypot(dx / 1.18, dy);
        if (d > S * 0.3 && d < S * 0.4) put(x, y, [120, 20, 16], 0.9);
        if (d > S * 0.39 && d < S * 0.42) put(x, y, [60, 10, 8], 0.9);
        const bw = S * 0.055 * (1 - Math.max(0, (y - c) / (S * 0.5)) * 0.6);
        if (Math.abs(dx) < bw && y > S * 0.12 && y < S * 0.97) put(x, y, [140, 24, 18], 0.95);
      }
      return t;
    },
    rosewin(t) {
      const S = t.w, c = S / 2;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const dx = x - c, dy = y - c, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        const i = (y * S + x) * 4;
        if (d > c - 1) { t.d[i + 3] = 0; continue; }
        const petal = Math.abs(Math.cos(a * 6)) * c * 0.55 + c * 0.25;
        let col = d < c * 0.18 ? [255, 190, 60] : d < petal ? [200, 40, 30] : [60, 30, 120];
        if (Math.abs(d - petal) < 2 || Math.abs(d - c * 0.18) < 2 || d > c - 6) col = [40, 30, 24];
        t.d[i] = col[0]; t.d[i + 1] = col[1]; t.d[i + 2] = col[2]; t.d[i + 3] = 255;
      }
      return t;
    },
    demon(t) {
      const S = t.w;
      const n = fbm(S, 4, 4, 261);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const i = (y * S + x) * 4;
        const u = x / S - 0.5, v = y / S;
        const face = Math.pow(u / 0.5, 2) + Math.pow((v - 0.45) / 0.46, 2);
        let a = face < 1 ? 1 : 0;
        if (v > 0.84 && Math.abs(u) < 0.45) a = 0;
        const shade = 0.55 + n[y * S + x] * 0.6 - face * 0.25;
        let col = [120 * shade, 70 * shade, 50 * shade];
        const eye = Math.min(Math.hypot(u + 0.19, (v - 0.42) * 1.6), Math.hypot(u - 0.19, (v - 0.42) * 1.6));
        if (eye < 0.07) col = [255, 60 + 100 * (1 - eye / 0.07), 20];
        else if (eye < 0.1) col = [30, 10, 8];
        if (v < 0.3 && Math.abs(Math.abs(u) - 0.3 + v * 0.6) < 0.05) col = [70, 40, 30];
        const hornL = Math.hypot(u + 0.36, v - 0.1), hornR = Math.hypot(u - 0.36, v - 0.1);
        if ((hornL < 0.1 || hornR < 0.1) && v < 0.2) { col = [180, 150, 110]; a = 1; }
        if (Math.abs(u) < 0.05 && v > 0.45 && v < 0.62) col = [60, 30, 22];
        t.d[i] = col[0]; t.d[i + 1] = col[1]; t.d[i + 2] = col[2]; t.d[i + 3] = a * 255;
      }
      return t;
    },
    jumppad(t) {
      const S = t.w, c = S / 2;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - c, y - c) / c;
        const i = (y * S + x) * 4;
        let a = 0, col = [255, 140, 40];
        if (d < 1) {
          const ring = Math.abs(Math.sin(d * Math.PI * 3.5));
          a = d > 0.92 ? 1 : 0.35 + ring * 0.65;
          if (d > 0.92) col = [60, 50, 40];
          if (d < 0.2) col = [255, 230, 150];
        }
        t.d[i] = col[0]; t.d[i + 1] = col[1]; t.d[i + 2] = col[2]; t.d[i + 3] = a * 255;
      }
      return t;
    },
    telepad(t) {
      const S = t.w, c = S / 2;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - c, y - c) / c, a = Math.atan2(y - c, x - c);
        const i = (y * S + x) * 4;
        const sw = 0.5 + 0.5 * Math.sin(a * 3 + d * 12);
        t.d[i] = 120 + 100 * sw; t.d[i + 1] = 140 + 80 * sw; t.d[i + 2] = 255; t.d[i + 3] = d < 1 ? (1 - d) * 255 : 0;
      }
      return t;
    },
    blood(t, rnd) {
      const S = t.w, c = S / 2;
      for (let i = 0; i < t.d.length; i += 4) t.d[i + 3] = 0;
      for (let k = 0; k < 14; k++) {
        const r = k === 0 ? S * 0.22 : S * (0.04 + rnd() * 0.08);
        const a = rnd() * Math.PI * 2, d = k === 0 ? 0 : S * (0.15 + rnd() * 0.3);
        const cx = c + Math.cos(a) * d, cy = c + Math.sin(a) * d;
        for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
          if (x < 0 || y < 0 || x >= S || y >= S) continue;
          if (Math.hypot(x - cx, y - cy) > r) continue;
          const i = (y * S + x) * 4;
          t.d[i] = 110; t.d[i + 1] = 6; t.d[i + 2] = 4; t.d[i + 3] = 230;
        }
      }
      return t;
    },
    burn(t) {
      const S = t.w, c = S / 2;
      const n = fbm(S, 4, 4, 271);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - c, y - c) / c;
        const i = (y * S + x) * 4;
        const v = Math.max(0, 1 - d * (0.8 + n[y * S + x] * 0.6));
        t.d[i] = 10; t.d[i + 1] = 8; t.d[i + 2] = 6; t.d[i + 3] = Math.min(1, v * 1.6) * 235;
      }
      return t;
    },
    hole(t) {
      const S = t.w, c = S / 2;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - c, y - c) / c;
        const i = (y * S + x) * 4;
        t.d[i] = 20; t.d[i + 1] = 18; t.d[i + 2] = 16; t.d[i + 3] = d < 0.35 ? 255 : d < 1 ? (1 - d) * 150 : 0;
      }
      return t;
    },
    energy(t) {
      const S = t.w, c = S / 2;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - c, y - c) / c;
        const i = (y * S + x) * 4;
        const v = d < 1 ? Math.pow(1 - d, 1.5) : 0;
        t.d[i] = 255 * v; t.d[i + 1] = 255 * v; t.d[i + 2] = 255 * v; t.d[i + 3] = 255;
      }
      return t;
    },
    flare(t) {
      const S = t.w, c = S / 2;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - c + 0.5, y - c + 0.5) / c;
        const i = (y * S + x) * 4;
        const v = d < 1 ? Math.pow(1 - d, 2.2) : 0;
        t.d[i] = 255; t.d[i + 1] = 255; t.d[i + 2] = 255; t.d[i + 3] = v * 255;
      }
      return t;
    },
    smoke(t) {
      const S = t.w, c = S / 2;
      const n = fbm(S, 4, 4, 281);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - c, y - c) / c;
        const i = (y * S + x) * 4;
        const v = Math.max(0, 1 - d) * (0.5 + n[y * S + x]);
        t.d[i] = 255; t.d[i + 1] = 255; t.d[i + 2] = 255; t.d[i + 3] = Math.min(1, v) * 255;
      }
      return t;
    },
    fire(t) {
      const S = t.w, c = S / 2;
      const n = fbm(S, 4, 5, 291);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - c, y - c) / c;
        const i = (y * S + x) * 4;
        const v = Math.max(0, 1 - d * (0.7 + n[y * S + x] * 0.6));
        t.d[i] = 255; t.d[i + 1] = 90 + 165 * Math.min(1, v * 1.3); t.d[i + 2] = 40 * v; t.d[i + 3] = Math.min(1, v * 1.8) * 255;
      }
      return t;
    },
    spark(t) {
      const S = t.w, c = S / 2;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const dx = Math.abs(x - c + 0.5) / c, dy = Math.abs(y - c + 0.5) / c;
        const i = (y * S + x) * 4;
        const v = Math.max(0, 1 - Math.min(dx * 4 + dy, dy * 4 + dx) * 0.9) + Math.max(0, 1 - Math.hypot(dx, dy) * 2);
        t.d[i] = 255; t.d[i + 1] = 255; t.d[i + 2] = 255; t.d[i + 3] = Math.min(1, v) * 255;
      }
      return t;
    },
    beam(t) {
      const S = t.w;
      for (let y = 0; y < t.h; y++) for (let x = 0; x < S; x++) {
        const d = Math.abs(y - t.h / 2 + 0.5) / (t.h / 2);
        const i = (y * S + x) * 4;
        const v = Math.pow(Math.max(0, 1 - d), 1.5);
        t.d[i] = 255; t.d[i + 1] = 255; t.d[i + 2] = 255; t.d[i + 3] = v * 255;
      }
      return t;
    },
    bolt(t, rnd) {
      const S = t.w, H = t.h;
      for (let i = 0; i < t.d.length; i += 4) { t.d[i] = 255; t.d[i + 1] = 255; t.d[i + 2] = 255; t.d[i + 3] = 0; }
      for (let k = 0; k < 3; k++) {
        let y = H / 2;
        for (let x = 0; x < S; x++) {
          y += (rnd() - 0.5) * 5;
          y += (H / 2 - y) * 0.08;
          for (let dy = -3; dy <= 3; dy++) {
            const yy = Math.round(y + dy);
            if (yy < 0 || yy >= H) continue;
            const i = (yy * S + x) * 4;
            t.d[i + 3] = Math.max(t.d[i + 3], (1 - Math.abs(dy) / 3.5) * (k === 0 ? 255 : 150));
          }
        }
      }
      return t;
    }
  };
  Q.DECALGEN = DECALS;

  Q.genTexture = function (key) {
    const rnd = Q.rng(Q.hash(key));
    if (GEN[key]) return GEN[key](rnd);
    if (DECALS[key]) {
      const size = key === 'beam' ? 16 : key === 'bolt' ? 128 : key === 'demon' || key === 'emblem' ? 256 : key === 'rosewin' ? 128 : 64;
      const t = new Tex(key === 'bolt' || key === 'beam' ? 128 : size, key === 'bolt' ? 32 : key === 'beam' ? 16 : size);
      return DECALS[key](t, rnd);
    }
    return new Tex(8).fill('#ff00ff');
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
