(function (W) {
  'use strict';

  const clamp8 = v => v < 0 ? 0 : v > 255 ? 255 : v | 0;
  const rgb = (r, g, b) => ((255 << 24) | (clamp8(b) << 16) | (clamp8(g) << 8) | clamp8(r)) >>> 0;
  const R = c => c & 255, G = c => (c >>> 8) & 255, B = c => (c >>> 16) & 255;
  const hex = s => rgb(parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16));
  const shade = (c, k) => rgb(R(c) * k, G(c) * k, B(c) * k);
  const mix = (a, b, t) => rgb(R(a) + (R(b) - R(a)) * t, G(a) + (G(b) - G(a)) * t, B(a) + (B(b) - B(a)) * t);

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Pic {
    constructor(w, h) { this.w = w; this.h = h; this.px = new Uint32Array(w * h); }
    set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c; }
    get(x, y) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : 0; }
    rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c); return this; }
    ellipse(cx, cy, rx, ry, c) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, typeof c === 'function' ? c(x, y, dx, dy) : c);
      }
      return this;
    }
    poly(pts, c) {
      let y0 = Infinity, y1 = -Infinity;
      for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
      }
      return this;
    }
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (;;) {
        this.set(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
      return this;
    }
    map(fn, x = 0, y = 0, w = this.w, h = this.h) {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
        if (i < 0 || j < 0 || i >= this.w || j >= this.h) continue;
        const k = j * this.w + i; this.px[k] = fn(this.px[k], i, j);
      }
      return this;
    }
    blit(src, dx, dy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.px[y * src.w + x]; if (c) this.set(dx + x, dy + y, c); } return this; }
    clone() { const p = new Pic(this.w, this.h); p.px.set(this.px); return p; }
  }

  function valueNoise(seed, cells) {
    const r = rng(seed), g = [];
    for (let i = 0; i < cells * cells; i++) g.push(r());
    const at = (x, y) => g[((y % cells + cells) % cells) * cells + ((x % cells + cells) % cells)];
    return (x, y) => {
      const fx = x / 64 * cells, fy = y / 64 * cells, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
  }

  function stones(seed, pal, mortar, opt = {}) {
    const p = new Pic(64, 64), r = rng(seed), rows = opt.rows || 4, rh = 64 / rows, widths = opt.widths || [12, 16, 20, 24, 28];
    for (let row = 0; row < rows; row++) {
      const start = Math.floor(r() * 24);
      let x = start;
      while (x < start + 64) {
        const w = Math.min(widths[Math.floor(r() * widths.length)], start + 64 - x);
        const base = pal[Math.floor(r() * pal.length)], k = 0.86 + r() * 0.26;
        for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < w; xx++) {
          let c = shade(base, k * (0.9 + r() * 0.18));
          if (yy === 0 || xx === 0) c = shade(c, 1.2);
          else if (yy === rh - 2 || xx === w - 2) c = shade(c, 0.78);
          if (yy === rh - 1 || xx === w - 1) c = mortar;
          p.set((x + xx) & 63, row * rh + yy, c);
        }
        if (opt.cracks && r() < opt.cracks) {
          let cx = x + 2 + r() * (w - 4), cy = row * rh + 2 + r() * (rh - 4);
          for (let i = 0; i < 6; i++) { p.set(cx & 63, cy, shade(base, 0.5)); cx += r() < 0.5 ? 1 : 0; cy += 1; if (cy >= row * rh + rh - 1) break; }
        }
        x += w;
      }
    }
    return p;
  }

  function bricks(seed, pal, mortar, bw = 16, bh = 8) {
    const p = new Pic(64, 64), r = rng(seed);
    for (let row = 0; row < 64 / bh; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let bx = -1; bx < 64 / bw + 1; bx++) {
        const base = pal[Math.floor(r() * pal.length)], k = 0.85 + r() * 0.3;
        for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) {
          const X = bx * bw + off + xx;
          if (X < 0 || X >= 64) continue;
          let c = shade(base, k * (0.9 + r() * 0.2));
          if (yy === 0) c = shade(c, 1.15);
          if (yy === bh - 1 || xx === bw - 1) c = shade(mortar, 0.9 + r() * 0.2);
          p.set(X, row * bh + yy, c);
        }
      }
    }
    return p;
  }

  const EAGLE = [[0, 0.04], [0.07, 0.05], [0.1, 0.11], [0.06, 0.17], [0.08, 0.23], [0.2, 0.15], [0.33, 0.07], [0.46, 0.01], [0.5, 0.07],
    [0.47, 0.17], [0.43, 0.19], [0.45, 0.28], [0.37, 0.3], [0.39, 0.4], [0.29, 0.4], [0.29, 0.48], [0.18, 0.45], [0.12, 0.56], [0.11, 0.7],
    [0.17, 0.84], [0.12, 0.92], [0.06, 0.87], [0, 0.96]];
  function eagle(p, x, y, w, h, c) {
    const right = EAGLE.map(([u, v]) => [x + w / 2 + u * w, y + v * h]);
    const left = EAGLE.slice().reverse().map(([u, v]) => [x + w / 2 - u * w, y + v * h]);
    p.poly(right.concat(left), c);
  }

  function wood(seed) {
    const p = new Pic(64, 64), r = rng(seed), pal = [hex('#8a5a2c'), hex('#7a4c24'), hex('#946231'), hex('#83532a')];
    const planks = [];
    for (let i = 0; i < 8; i++) planks.push({ c: pal[Math.floor(r() * pal.length)], ph: r() * 10, f: 0.18 + r() * 0.2 });
    p.map((c, x, y) => {
      const pl = planks[x >> 3], xx = x & 7;
      let k = 0.9 + 0.12 * Math.sin(y * pl.f + pl.ph + xx * 0.6) + (r() - 0.5) * 0.08;
      if (xx === 0) k *= 1.18;
      if (xx === 7) k *= 0.55;
      if (y < 3 || y > 60) k *= 0.7;
      if (y === 3 || y === 60) k *= 0.5;
      return shade(pl.c, k);
    });
    return p;
  }

  function metal(seed, base = hex('#6c7888')) {
    const p = new Pic(64, 64), r = rng(seed);
    p.map((c, x, y) => {
      const lx = x & 31, ly = y & 31;
      let k = 0.94 + (r() - 0.5) * 0.08;
      if (lx === 0 || ly === 0) k = 1.25;
      if (lx === 31 || ly === 31) k = 0.5;
      if (lx === 30 || ly === 30) k = 0.8;
      return shade(base, k);
    });
    for (const [ox, oy] of [[3, 3], [27, 3], [3, 27], [27, 27]]) for (let qy = 0; qy < 64; qy += 32) for (let qx = 0; qx < 64; qx += 32) {
      p.set(qx + ox, qy + oy, shade(base, 1.45)); p.set(qx + ox + 1, qy + oy + 1, shade(base, 0.45)); p.set(qx + ox + 1, qy + oy, shade(base, 1.1));
    }
    for (let i = 0; i < 14; i++) { const x = r() * 64, y = r() * 64; p.line(x, y, x + 3 + r() * 5, y + r() * 2, shade(base, 1.12)); }
    return p;
  }

  function buildTextures() {
    const T = {};
    const greyPal = [hex('#7c7c7c'), hex('#6c6c6c'), hex('#848484'), hex('#747474'), hex('#606060')];
    const greyM = hex('#383838');
    const grey = seed => stones(seed, greyPal, greyM, { cracks: 0.25 });
    const bluePal = [hex('#24348c'), hex('#2c3c98'), hex('#1c2c7c'), hex('#2838a0')];
    const blue = seed => stones(seed, bluePal, hex('#0c1440'), { widths: [16, 24, 32], cracks: 0.1 });

    T.grey = grey(11);
    T.grey2 = stones(12, [hex('#6a706a'), hex('#5c625c'), hex('#747a70')], hex('#30342e'), { rows: 4, widths: [10, 14, 18, 22], cracks: 0.5 });

    T.flag = grey(13);
    {
      const p = T.flag;
      p.map((c, x, y) => {
        if (x < 15 || x > 48 || y < 3 || y > 56) return c;
        const k = 0.8 + 0.2 * Math.cos((x - 15) / 34 * Math.PI * 4);
        let col = shade(hex('#b01414'), k);
        if (x === 15 || x === 48) col = shade(col, 0.6);
        return col;
      });
      p.rect(13, 1, 38, 2, hex('#c09030')); p.rect(13, 3, 38, 1, hex('#604010'));
      for (let x = 15; x <= 48; x++) { const t = (x & 3) < 2 ? 1 : 0; p.rect(x, 55, 1, 2 + t, hex('#d8a830')); }
      p.ellipse(32, 26, 11, 11, hex('#101010')); p.ellipse(32, 26, 9.5, 9.5, hex('#e8e8e0'));
      eagle(p, 24, 18, 16, 15, hex('#181818'));
    }

    T.portrait = grey(14);
    {
      const p = T.portrait;
      p.rect(13, 6, 38, 52, hex('#a87820'));
      p.map((c, x, y) => (x + y) % 3 === 0 ? shade(c, 1.25) : c, 13, 6, 38, 52);
      p.rect(13, 6, 38, 1, hex('#e0b850')); p.rect(13, 57, 38, 1, hex('#503808')); p.rect(13, 6, 1, 52, hex('#d0a040')); p.rect(50, 6, 1, 52, hex('#604010'));
      p.rect(17, 10, 30, 44, hex('#2c2418'));
      p.map((c, x, y) => mix(hex('#40382a'), hex('#1c1810'), (y - 10) / 44), 17, 10, 30, 44);
      p.ellipse(32, 52, 14, 10, (x, y, dx) => shade(hex('#4c5a40'), dx < -0.2 ? 1.1 : dx > 0.4 ? 0.75 : 0.95));
      p.poly([[27, 44], [32, 51], [37, 44], [35, 54], [29, 54]], hex('#d8d0c0'));
      p.rect(31, 46, 2, 7, hex('#202020'));
      p.ellipse(32, 34, 6.5, 8.5, (x, y, dx) => shade(hex('#d89a70'), dx > 0.35 ? 0.8 : 1));
      p.ellipse(32, 25.5, 9, 3.6, hex('#46543a')); p.rect(25, 27, 14, 2, hex('#141414')); p.rect(31, 24, 2, 2, hex('#c0c0b0'));
      p.set(29, 33, hex('#202020')); p.set(35, 33, hex('#202020')); p.rect(30, 39, 4, 1, hex('#803c30')); p.rect(32, 35, 1, 3, hex('#b07850'));
    }

    T.eagle = grey(15);
    {
      const p = T.eagle;
      p.ellipse(32, 30, 20, 20, (x, y) => shade(p.get(x, y), 0.8));
      eagle(p, 15, 13, 34, 32, hex('#363636'));
      eagle(p, 14, 12, 34, 32, hex('#a4a4a4'));
      p.map((c, x, y) => c === hex('#a4a4a4') ? shade(c, 0.9 + ((x * 7 + y * 13) % 5) * 0.04) : c);
    }

    T.blue = blue(21);
    const cell = skel => {
      const p = blue(skel ? 23 : 22);
      p.map((c, x, y) => mix(hex('#06060e'), hex('#14141e'), Math.max(0, (y - 44) / 18)), 10, 5, 44, 57);
      if (skel) {
        const bone = hex('#dcd6c0'), dark = hex('#8a8470');
        p.ellipse(32, 23, 4.5, 5, bone); p.set(30, 22, dark); p.set(34, 22, dark); p.rect(31, 26, 3, 1, dark);
        p.rect(31, 28, 2, 16, bone);
        for (let i = 0; i < 4; i++) p.rect(27, 31 + i * 3, 11, 1, i % 2 ? dark : bone);
        p.line(26, 30, 22, 44, bone); p.line(38, 30, 42, 44, bone);
        p.ellipse(32, 45, 5, 2.5, bone);
        p.line(28, 46, 22, 52, bone); p.line(22, 52, 26, 59, bone); p.line(36, 46, 42, 52, bone); p.line(42, 52, 38, 59, bone);
      }
      for (const bx of [12, 20, 28, 36, 44, 51]) { p.rect(bx, 5, 1, 57, hex('#9aa2b2')); p.rect(bx + 1, 5, 1, 57, hex('#565e70')); }
      p.rect(10, 5, 44, 2, hex('#7a8294')); p.rect(10, 29, 44, 2, hex('#7a8294')); p.rect(10, 30, 44, 1, hex('#464e5e')); p.rect(10, 60, 44, 2, hex('#5a6274'));
      return p;
    };
    T.cell = cell(false);
    T.cellskel = cell(true);

    T.wood = wood(31);
    T.woodeagle = wood(32);
    {
      const p = T.woodeagle;
      p.ellipse(32, 31, 17, 17, hex('#4a2c12')); p.ellipse(32, 31, 15.5, 15.5, hex('#6a4018'));
      eagle(p, 19, 18, 26, 25, hex('#604008'));
      eagle(p, 18, 17, 26, 25, hex('#e0b030'));
      p.map((c, x, y) => c === hex('#e0b030') ? shade(c, y < 28 ? 1.08 : 0.92) : c);
    }
    T.woodpaint = wood(33);
    {
      const p = T.woodpaint;
      p.rect(11, 9, 42, 46, hex('#b08020')); p.rect(11, 9, 42, 1, hex('#f0c860')); p.rect(11, 54, 42, 1, hex('#503000'));
      p.map((c, x, y) => mix(hex('#5070b8'), hex('#c0d0e8'), (y - 13) / 22), 15, 13, 34, 38);
      p.poly([[15, 38], [22, 27], [28, 33], [36, 22], [49, 37], [49, 51], [15, 51]], hex('#6a7080'));
      p.poly([[33, 25], [36, 22], [39, 26]], hex('#f0f0f0'));
      p.poly([[15, 42], [26, 37], [38, 41], [49, 38], [49, 51], [15, 51]], hex('#3a6a2a'));
      p.rect(37, 33, 6, 6, hex('#3a3a40')); p.rect(36, 31, 2, 3, hex('#3a3a40')); p.rect(42, 31, 2, 3, hex('#3a3a40'));
      p.map((c, x, y) => (x * 3 + y * 5) % 7 === 0 ? shade(c, 0.92) : c, 15, 13, 34, 38);
    }

    const brickPal = [hex('#8c2c1c'), hex('#7c2416'), hex('#983422'), hex('#842a1a')];
    T.brick = bricks(41, brickPal, hex('#9a948a'));
    T.brickbanner = bricks(42, brickPal, hex('#9a948a'));
    {
      const p = T.brickbanner;
      p.map((c, x, y) => {
        const k = 0.85 + 0.15 * Math.cos((x - 19) / 26 * Math.PI * 3);
        return shade(hex('#3c0808'), k);
      }, 19, 2, 26, 56);
      p.rect(18, 1, 28, 2, hex('#c09030')); p.rect(19, 2, 1, 56, hex('#c09030')); p.rect(44, 2, 1, 56, hex('#c09030'));
      p.poly([[19, 58], [32, 63], [45, 58]], hex('#3c0808')); p.line(19, 58, 32, 63, hex('#c09030')); p.line(32, 63, 45, 58, hex('#c09030'));
      p.ellipse(32, 25, 9, 9, hex('#d8a830')); p.ellipse(32, 25, 7.5, 7.5, hex('#3c0808'));
      eagle(p, 26, 19, 12, 12, hex('#d8a830'));
    }

    T.metal = metal(51);
    T.metalsign = metal(52);
    {
      const p = T.metalsign;
      p.rect(17, 17, 30, 30, hex('#141414')); p.rect(19, 19, 26, 26, hex('#e0c020'));
      for (let i = 0; i < 26; i++) for (let j = 0; j < 3; j++) { if (((i >> 2) & 1) === 0) { p.set(19 + i, 19 + j, hex('#141414')); p.set(19 + i, 42 + j, hex('#141414')); } }
      p.poly([[34, 23], [26, 33], [31, 33], [28, 41], [38, 30], [33, 30], [36, 23]], hex('#141414'));
    }
    T.labtile = new Pic(64, 64);
    {
      const p = T.labtile, r = rng(61);
      const stain = new Set([5, 18, 27, 44, 51, 60]);
      p.map((c, x, y) => {
        const tx = x >> 3, ty = y >> 3, id = ty * 8 + tx, lx = x & 7, ly = y & 7;
        let col = stain.has(id) ? hex('#b0b8a0') : hex('#c8d0d8');
        col = shade(col, 0.95 + r() * 0.08);
        if (lx === 0 || ly === 0) col = shade(col, 1.06);
        if (lx === 7 || ly === 7) col = hex('#707880');
        return col;
      });
      p.line(36, 18, 40, 24, hex('#808890')); p.line(40, 24, 39, 28, hex('#808890'));
      for (let i = 0; i < 9; i++) p.set(12 + (i & 1), 40 + i * 2, hex('#8a7a50'));
    }
    T.purple = stones(71, [hex('#6c2c6c'), hex('#5c245c'), hex('#7c347c')], hex('#28102a'), { cracks: 0.2 });
    T.brown = stones(72, [hex('#7c5634'), hex('#6c4a2c'), hex('#86603a')], hex('#2c1c10'), { widths: [14, 18, 24, 30], cracks: 0.3 });
    T.cave = new Pic(64, 64);
    {
      const n1 = valueNoise(81, 8), n2 = valueNoise(82, 16), r = rng(83);
      T.cave.map((c, x, y) => {
        const v = n1(x, y) * 0.65 + n2(x, y) * 0.35;
        let col = mix(hex('#3c3228'), hex('#8a7a62'), v);
        if (Math.abs(n1(x * 1.3 + 7, y) - 0.5) < 0.025) col = hex('#241c14');
        return shade(col, 0.92 + r() * 0.12);
      });
    }
    T.moss = grey(91);
    {
      const n = valueNoise(92, 8), r = rng(93);
      T.moss.map((c, x, y) => {
        const v = n(x, y) + (1 - y / 64) * 0.35;
        return v > 0.78 ? mix(c, shade(hex('#3a6a24'), 0.8 + r() * 0.4), 0.75) : v > 0.7 ? mix(c, hex('#4a6a34'), 0.35) : c;
      });
    }
    T.marble = new Pic(64, 64);
    {
      const n = valueNoise(101, 4), n2 = valueNoise(102, 16);
      T.marble.map((c, x, y) => {
        const v = Math.sin((x * 0.09 + y * 0.05 + n(x, y) * 6) * Math.PI);
        let col = mix(hex('#5a6478'), hex('#7a8498'), n2(x, y));
        if (Math.abs(v) < 0.08) col = hex('#c8ccd8');
        if ((x & 31) === 31 || y === 63) col = hex('#2c3240');
        if ((x & 31) === 0 || y === 0) col = shade(col, 1.2);
        return col;
      });
    }
    T.bluesign = blue(24);
    {
      const p = T.bluesign;
      p.rect(18, 16, 28, 30, hex('#202020')); p.rect(19, 17, 26, 28, hex('#e8e8e0'));
      p.ellipse(32, 31, 10, 10, hex('#c01818')); p.ellipse(32, 31, 7.5, 7.5, hex('#e8e8e0'));
      p.poly([[25, 26], [27, 24], [39, 36], [37, 38]], hex('#c01818'));
    }
    T.stainglass = grey(25);
    {
      const p = T.stainglass, cols = [hex('#c02020'), hex('#2040c0'), hex('#e0c020'), hex('#209040'), hex('#8030a0')];
      p.rect(14, 4, 36, 56, hex('#2a2a2a'));
      p.map((c, x, y) => {
        const ax = (x - 32) / 16, ay = (y - 22) / 18;
        if (y < 22 && ax * ax + ay * ay > 1) return c;
        const id = ((x - 16) >> 3) + ((y - 6) >> 3) * 5 + ((x + y) >> 4);
        if ((x - 16) % 8 === 0 || (y - 6) % 8 === 0) return hex('#1a1a1a');
        return shade(cols[((id % 5) + 5) % 5], 0.85 + ((x * y) % 7) * 0.04);
      }, 16, 6, 32, 52);
      p.ellipse(32, 30, 5, 5, hex('#f0e080'));
    }
    T.elevator = new Pic(64, 64);
    {
      const p = T.elevator, r = rng(111);
      p.map((c, x, y) => {
        const lx = x & 7;
        let col = lx < 4 ? hex('#8a92a2') : hex('#6c7484');
        if (lx === 7) col = hex('#3a4050');
        if (lx === 0) col = hex('#a8b0c0');
        if (y < 2 || y > 61) col = hex('#3a4050');
        return shade(col, 0.95 + r() * 0.08);
      });
      p.map((c, x, y) => shade(hex('#b08830'), y === 28 ? 1.4 : y === 35 ? 0.55 : 1 + 0.15 * Math.sin(y)), 0, 28, 64, 8);
      for (let x = 4; x < 64; x += 8) { p.set(x, 31, hex('#f0d070')); p.set(x, 32, hex('#604010')); }
    }
    const sw = down => {
      const p = T.elevator.clone();
      p.rect(19, 14, 26, 36, hex('#262630')); p.rect(20, 15, 24, 34, hex('#4c4c58')); p.rect(20, 15, 24, 1, hex('#787884'));
      p.rect(30, 19, 4, 26, hex('#0c0c10'));
      p.rect(23, 17, 3, 3, down ? hex('#401010') : hex('#30e040')); p.rect(38, 17, 3, 3, down ? hex('#ff3030') : hex('#103010'));
      const ky = down ? 38 : 20;
      p.rect(29, ky, 6, 6, hex('#c02020')); p.rect(29, ky, 6, 1, hex('#ff7070')); p.rect(29, ky + 5, 6, 1, hex('#600808'));
      p.rect(31, down ? 30 : 26, 2, 8, hex('#b0b0b8'));
      return p;
    };
    T.switch = sw(false);
    T.switchdown = sw(true);
    const door = (seed, base) => {
      const p = new Pic(64, 64), r = rng(seed);
      p.map((c, x, y) => {
        const ly = y % 16;
        let k = 0.95 + (r() - 0.5) * 0.06;
        if (ly === 0) k = 1.3; else if (ly === 15) k = 0.45; else if (ly === 14) k = 0.75;
        if (x === 0 || x === 63) k *= 0.5;
        if (x === 1) k *= 1.2;
        return shade(base, k);
      });
      for (let y = 4; y < 64; y += 16) { p.rect(6, y, 52, 8, shade(base, 0.82)); p.rect(6, y, 52, 1, shade(base, 0.6)); p.rect(6, y + 7, 52, 1, shade(base, 1.2)); }
      return p;
    };
    T.door = door(121, hex('#5c7890'));
    const lockDoor = (seed, plate) => {
      const p = door(seed, hex('#5c7890'));
      p.rect(25, 24, 14, 16, shade(plate, 0.6)); p.rect(26, 25, 12, 14, plate); p.rect(26, 25, 12, 1, shade(plate, 1.3));
      p.ellipse(32, 30, 2, 2, hex('#101010')); p.rect(31, 31, 2, 5, hex('#101010'));
      return p;
    };
    T.doorlock1 = lockDoor(122, hex('#d8a828'));
    T.doorlock2 = lockDoor(123, hex('#b8c0c8'));
    T.doorelev = new Pic(64, 64);
    {
      const p = T.doorelev, r = rng(124);
      p.map((c, x, y) => {
        let col = (x >> 2) & 1 ? hex('#9aa2b0') : hex('#848c9c');
        if ((x & 3) === 3) col = hex('#5a6270');
        return shade(col, 0.95 + r() * 0.07);
      });
      p.map((c, x, y) => ((x + y) >> 2) & 1 ? hex('#e0c020') : hex('#202020'), 0, 29, 64, 6);
      p.rect(0, 28, 64, 1, hex('#404040')); p.rect(0, 35, 64, 1, hex('#404040'));
    }
    T.doorside = new Pic(64, 64);
    {
      const p = T.doorside, r = rng(125);
      p.map((c, x, y) => shade(hex('#404a58'), 0.92 + r() * 0.1));
      for (const x0 of [10, 50]) { p.rect(x0, 0, 4, 64, hex('#6a7686')); p.rect(x0, 0, 1, 64, hex('#8a96a6')); p.rect(x0 + 3, 0, 1, 64, hex('#242a34')); }
      for (let y = 6; y < 64; y += 14) { p.set(11, y, hex('#c0c8d0')); p.set(51, y, hex('#c0c8d0')); }
    }

    const out = {};
    for (const name of W.Data.TEXTURES) {
      const p = T[name];
      const light = new Uint32Array(4096), dark = new Uint32Array(4096);
      for (let x = 0; x < 64; x++) for (let y = 0; y < 64; y++) { const c = p.px[y * 64 + x]; light[x * 64 + y] = c; dark[x * 64 + y] = shade(c, 0.74); }
      out[name] = { pic: p, light, dark };
    }
    return out;
  }

  const LIGHT = (() => { const l = [-0.42, 0.55, 0.72], n = Math.hypot(...l); return l.map(v => v / n); })();
  const RAMP = [0.5, 0.72, 0.94, 1.14];

  function euler(rot) {
    const [ax, ay, az] = rot || [0, 0, 0];
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
    const Rx = [1, 0, 0, 0, cx, -sx, 0, sx, cx], Ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy], Rz = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
    const mul = (a, b) => { const o = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]; return o; };
    return mul(Rz, mul(Ry, Rx));
  }

  function prepPrim(p) {
    const q = Object.assign({}, p);
    const m = typeof q.m === 'number' ? { c: q.m } : (q.m || { c: hex('#ff00ff') });
    q.mat = m;
    q.g = q.g !== undefined ? q.g : m.c;
    if (q.t === 'ell' || q.t === 'box') {
      const Rm = euler(q.rot);
      q.Rt = [Rm[0], Rm[3], Rm[6], Rm[1], Rm[4], Rm[7], Rm[2], Rm[5], Rm[8]];
      q.Rm = Rm;
      const ext = q.t === 'ell' ? q.r : q.h;
      q.bc = q.c; q.br = (q.t === 'box' ? Math.hypot(ext[0], ext[1], ext[2]) : Math.max(ext[0], ext[1], ext[2])) + 0.01;
    } else {
      q.bc = [(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2, (q.a[2] + q.b[2]) / 2];
      q.br = Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1], q.b[2] - q.a[2]) / 2 + q.r + 0.01;
    }
    return q;
  }

  const HN = [0, 0, 0];
  function hitPrim(q, o, d) {
    const ocx = q.bc[0] - o[0], ocy = q.bc[1] - o[1], ocz = q.bc[2] - o[2];
    const tca = ocx * d[0] + ocy * d[1] + ocz * d[2];
    if (ocx * ocx + ocy * ocy + ocz * ocz - tca * tca > q.br * q.br) return -1;
    if (q.t === 'ell') {
      const Rt = q.Rt, px = o[0] - q.c[0], py = o[1] - q.c[1], pz = o[2] - q.c[2];
      const lox = (Rt[0] * px + Rt[1] * py + Rt[2] * pz) / q.r[0], loy = (Rt[3] * px + Rt[4] * py + Rt[5] * pz) / q.r[1], loz = (Rt[6] * px + Rt[7] * py + Rt[8] * pz) / q.r[2];
      const ldx = (Rt[0] * d[0] + Rt[1] * d[1] + Rt[2] * d[2]) / q.r[0], ldy = (Rt[3] * d[0] + Rt[4] * d[1] + Rt[5] * d[2]) / q.r[1], ldz = (Rt[6] * d[0] + Rt[7] * d[1] + Rt[8] * d[2]) / q.r[2];
      const a = ldx * ldx + ldy * ldy + ldz * ldz, b = lox * ldx + loy * ldy + loz * ldz, c = lox * lox + loy * loy + loz * loz - 1;
      const disc = b * b - a * c;
      if (disc < 0) return -1;
      const sq = Math.sqrt(disc);
      for (const t of [(-b - sq) / a, (-b + sq) / a]) {
        if (t <= 0) continue;
        const ux = lox + ldx * t, uy = loy + ldy * t, uz = loz + ldz * t;
        if (q.clip !== undefined && uy * q.r[1] < q.clip) continue;
        if (q.clipz !== undefined && uz * q.r[2] < q.clipz) continue;
        const nx = ux / q.r[0], ny = uy / q.r[1], nz = uz / q.r[2], Rm = q.Rm;
        let mx = Rm[0] * nx + Rm[1] * ny + Rm[2] * nz, my = Rm[3] * nx + Rm[4] * ny + Rm[5] * nz, mz = Rm[6] * nx + Rm[7] * ny + Rm[8] * nz;
        const l = Math.hypot(mx, my, mz) || 1;
        HN[0] = mx / l; HN[1] = my / l; HN[2] = mz / l;
        return t;
      }
      return -1;
    }
    if (q.t === 'box') {
      const Rt = q.Rt, px = o[0] - q.c[0], py = o[1] - q.c[1], pz = o[2] - q.c[2];
      const lo = [Rt[0] * px + Rt[1] * py + Rt[2] * pz, Rt[3] * px + Rt[4] * py + Rt[5] * pz, Rt[6] * px + Rt[7] * py + Rt[8] * pz];
      const ld = [Rt[0] * d[0] + Rt[1] * d[1] + Rt[2] * d[2], Rt[3] * d[0] + Rt[4] * d[1] + Rt[5] * d[2], Rt[6] * d[0] + Rt[7] * d[1] + Rt[8] * d[2]];
      let tn = -Infinity, tf = Infinity, ax = 0, sg = 1;
      for (let i = 0; i < 3; i++) {
        if (Math.abs(ld[i]) < 1e-9) { if (Math.abs(lo[i]) > q.h[i]) return -1; continue; }
        let t1 = (-q.h[i] - lo[i]) / ld[i], t2 = (q.h[i] - lo[i]) / ld[i], s = -1;
        if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; s = 1; }
        if (t1 > tn) { tn = t1; ax = i; sg = s; }
        if (t2 < tf) tf = t2;
        if (tn > tf) return -1;
      }
      if (tn <= 0) return -1;
      const n = [0, 0, 0]; n[ax] = sg;
      const Rm = q.Rm;
      HN[0] = Rm[0] * n[0] + Rm[1] * n[1] + Rm[2] * n[2]; HN[1] = Rm[3] * n[0] + Rm[4] * n[1] + Rm[5] * n[2]; HN[2] = Rm[6] * n[0] + Rm[7] * n[1] + Rm[8] * n[2];
      return tn;
    }
    const ax = q.a[0], ay = q.a[1], az = q.a[2];
    const bax = q.b[0] - ax, bay = q.b[1] - ay, baz = q.b[2] - az;
    const oax = o[0] - ax, oay = o[1] - ay, oaz = o[2] - az;
    const baba = bax * bax + bay * bay + baz * baz, bard = bax * d[0] + bay * d[1] + baz * d[2], baoa = bax * oax + bay * oay + baz * oaz;
    const rdoa = d[0] * oax + d[1] * oay + d[2] * oaz, oaoa = oax * oax + oay * oay + oaz * oaz;
    if (q.t === 'cap') {
      const a = baba - bard * bard, b = baba * rdoa - baoa * bard, c = baba * oaoa - baoa * baoa - q.r * q.r * baba;
      let h = b * b - a * c;
      if (h < 0) return -1;
      let t = (-b - Math.sqrt(h)) / a;
      const y = baoa + t * bard;
      if (!(y > 0 && y < baba)) {
        const ocx2 = y <= 0 ? oax : o[0] - q.b[0], ocy2 = y <= 0 ? oay : o[1] - q.b[1], ocz2 = y <= 0 ? oaz : o[2] - q.b[2];
        const b2 = d[0] * ocx2 + d[1] * ocy2 + d[2] * ocz2, c2 = ocx2 * ocx2 + ocy2 * ocy2 + ocz2 * ocz2 - q.r * q.r;
        h = b2 * b2 - c2;
        if (h <= 0) return -1;
        t = -b2 - Math.sqrt(h);
      }
      if (t <= 0) return -1;
      const hx = o[0] + d[0] * t - ax, hy = o[1] + d[1] * t - ay, hz = o[2] + d[2] * t - az;
      const k = Math.max(0, Math.min(1, (hx * bax + hy * bay + hz * baz) / baba));
      const nx = hx - bax * k, ny = hy - bay * k, nz = hz - baz * k, l = Math.hypot(nx, ny, nz) || 1;
      HN[0] = nx / l; HN[1] = ny / l; HN[2] = nz / l;
      return t;
    }
    const k2 = baba - bard * bard, k1 = baba * rdoa - baoa * bard, k0 = baba * oaoa - baoa * baoa - q.r * q.r * baba;
    let h = k1 * k1 - k2 * k0;
    if (h < 0) return -1;
    h = Math.sqrt(h);
    let t = (-k1 - h) / k2;
    const y = baoa + t * bard;
    if (y > 0 && y < baba && t > 0) {
      const nx = oax + t * d[0] - bax * y / baba, ny = oay + t * d[1] - bay * y / baba, nz = oaz + t * d[2] - baz * y / baba, l = Math.hypot(nx, ny, nz) || 1;
      HN[0] = nx / l; HN[1] = ny / l; HN[2] = nz / l;
      return t;
    }
    t = ((y < 0 ? 0 : baba) - baoa) / bard;
    if (t > 0 && Math.abs(k1 + k2 * t) < h) {
      const s = y < 0 ? -1 : 1, l = Math.sqrt(baba);
      HN[0] = bax * s / l; HN[1] = bay * s / l; HN[2] = baz * s / l;
      return t;
    }
    return -1;
  }

  function renderModel(model, o = {}) {
    const w = o.w || 64, h = o.h || 64, cx = o.cx !== undefined ? o.cx : w / 2, cy = o.cy !== undefined ? o.cy : h - 0.5, sc = o.scale || 1;
    const yaw = o.yaw || 0, pitch = o.pitch || 0, cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const toModel = (x, y, z) => { const y1 = y * cp + z * sp, z1 = -y * sp + z * cp; return [x * cyw - z1 * syw, y1, x * syw + z1 * cyw]; };
    const toCam = (x, y, z) => { const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw; return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; };
    const prims = model.prims.map(prepPrim);
    const pic = new Pic(w, h), depth = new Float32Array(w * h), grp = new Array(w * h), mats = new Array(w * h);
    const persp = o.persp;
    const eye = persp ? toModel(0, 0, 0) : null;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const X = (px + 0.5 - cx) / sc, Y = (cy - (py + 0.5)) / sc;
      let orig, dir;
      if (persp) {
        const l = Math.hypot(X, Y, persp);
        dir = toModel(X / l, Y / l, -persp / l); orig = eye;
      } else { orig = toModel(X, Y, 400); dir = toModel(0, 0, -1); }
      let best = Infinity, bq = null, bn = [0, 0, 0];
      for (const q of prims) {
        const t = hitPrim(q, orig, dir);
        if (t > 0 && t < best) { best = t; bq = q; bn[0] = HN[0]; bn[1] = HN[1]; bn[2] = HN[2]; }
      }
      const k = py * w + px;
      if (!bq) { depth[k] = Infinity; continue; }
      depth[k] = best; grp[k] = bq.g; mats[k] = bq.mat;
      const m = bq.mat;
      let col = m.c;
      if (m.fn) col = m.fn(orig[0] + dir[0] * best, orig[1] + dir[1] * best, orig[2] + dir[2] * best);
      if (m.glow) { pic.px[k] = col; continue; }
      const nc = toCam(bn[0], bn[1], bn[2]);
      const lam = Math.max(0, nc[0] * LIGHT[0] + nc[1] * LIGHT[1] + nc[2] * LIGHT[2]);
      const it = 0.28 + 0.8 * lam + (m.shine ? Math.pow(lam, 12) * 0.6 : 0);
      const lv = it < 0.48 ? 0 : it < 0.74 ? 1 : it < 0.98 ? 2 : 3;
      pic.px[k] = shade(col, RAMP[lv] * (m.k || 1));
    }
    if (o.outline !== false) {
      const out = pic.px.slice();
      for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
        const k = py * w + px;
        if (!pic.px[k] || (mats[k] && mats[k].glow)) continue;
        let edge = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = px + dx, y = py + dy;
          if (x < 0 || y < 0 || x >= w || y >= h) { edge = true; break; }
          const q = y * w + x;
          if (!pic.px[q]) { edge = true; break; }
          if (grp[q] !== grp[k] && depth[q] - depth[k] > (o.edge || 2.5)) { edge = true; break; }
        }
        if (edge) out[k] = shade(pic.px[k], 0.42);
      }
      pic.px.set(out);
    }
    for (const mk of model.marks || []) {
      const c = toCam(mk.p[0], mk.p[1], mk.p[2]);
      let sx, sy, t;
      if (persp) { if (c[2] >= -0.1) continue; sx = cx + c[0] / -c[2] * persp * sc; sy = cy - c[1] / -c[2] * persp * sc; t = Math.hypot(c[0], c[1], c[2]); }
      else { sx = cx + c[0] * sc; sy = cy - c[1] * sc; t = 400 - c[2]; }
      const [mw, mh] = mk.s || [1, 1];
      for (let j = 0; j < mh; j++) for (let i = 0; i < mw; i++) {
        const X = Math.floor(sx - mw / 2 + 0.5) + i, Y = Math.floor(sy - mh / 2 + 0.5) + j;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const k = Y * w + X;
        if (depth[k] === Infinity || t > depth[k] + (mk.tol || 1.6)) continue;
        pic.px[k] = mk.c;
      }
    }
    return pic;
  }

  const V3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    rx: (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c]; },
    ry: (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]; },
    rz: (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; }
  };
  const { add, sub, mul, norm, cross } = V3;
  const limb = (p, r) => [Math.sin(r), -Math.cos(p) * Math.cos(r), Math.sin(p) * Math.cos(r)];
  const E = (c, r, m, extra) => Object.assign({ t: 'ell', c, r, m }, extra || {});
  const C = (a, b, r, m, extra) => Object.assign({ t: 'cap', a, b, r, m }, extra || {});
  const Y = (a, b, r, m, extra) => Object.assign({ t: 'cyl', a, b, r, m }, extra || {});
  const X = (c, h, m, extra) => Object.assign({ t: 'box', c, h, m }, extra || {});
  const glow = c => ({ c: hex(c), glow: true });

  function transformModel(model, fn, rz) {
    for (const p of model.prims) {
      if (p.t === 'ell' || p.t === 'box') { p.c = fn(p.c); if (rz) { const r = p.rot ? p.rot.slice() : [0, 0, 0]; r[2] += rz; p.rot = r; } }
      else { p.a = fn(p.a); p.b = fn(p.b); }
    }
    for (const m of model.marks) m.p = fn(m.p);
    return model;
  }

  function gunPrims(kind, hand, g, side, flash, prims, out) {
    const up = [0, 1, 0];
    let u = norm(cross(g, up)); if (!isFinite(u[0])) u = [1, 0, 0];
    const v = norm(cross(u, g));
    const dark = hex('#2a2a30'), steel = hex('#50545e');
    let tip = null;
    if (kind === 'pistol') {
      prims.push(Y(add(hand, mul(g, 0.5)), add(hand, mul(g, 6.5)), 1.15, dark));
      prims.push(E(add(hand, mul(v, 0.6)), [1.8, 1.8, 1.8], dark));
      tip = add(hand, mul(g, 7.3));
    } else if (kind === 'mg') {
      prims.push(Y(add(hand, mul(g, -4)), add(hand, mul(g, 11)), 1.35, dark));
      prims.push(Y(add(hand, mul(g, 2)), add(add(hand, mul(g, 2)), mul(v, -5.5)), 0.95, steel));
      prims.push(Y(add(hand, mul(g, -4)), add(add(hand, mul(g, -7)), mul(v, -2)), 1.0, dark));
      tip = add(hand, mul(g, 12));
    } else if (kind === 'chain') {
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI * 2 / 3, off = add(mul(u, Math.cos(a) * 1.7), mul(v, Math.sin(a) * 1.7));
        prims.push(Y(add(add(hand, mul(g, -2)), off), add(add(hand, mul(g, 13)), off), 0.95, i ? steel : dark));
      }
      prims.push(Y(add(hand, mul(g, -3)), add(hand, mul(g, 3)), 2.6, hex('#3a3a42')));
      tip = add(hand, mul(g, 14));
    } else if (kind === 'rocket') {
      prims.push(Y(add(hand, mul(g, -10)), add(hand, mul(g, 9)), 2.5, hex('#4a5a3a')));
      prims.push(Y(add(hand, mul(g, 8.5)), add(hand, mul(g, 10)), 2.9, hex('#2a3020')));
      prims.push(Y(add(hand, mul(g, -11)), add(hand, mul(g, -9.5)), 2.8, hex('#2a3020')));
      tip = add(hand, mul(g, 11));
    } else if (kind === 'syringe') {
      prims.push(Y(add(hand, mul(g, -1)), add(hand, mul(g, 7)), 1.3, { c: hex('#c8e8f0'), shine: true }));
      prims.push(Y(add(hand, mul(g, 1)), add(hand, mul(g, 6)), 0.8, hex('#40c040')));
      prims.push(Y(add(hand, mul(g, 7)), add(hand, mul(g, 11)), 0.3, hex('#e0e0e0')));
      prims.push(Y(add(hand, mul(g, -2.5)), add(hand, mul(g, -1)), 1.8, hex('#d0d0d0')));
    } else if (kind === 'fire') {
      prims.push(E(add(hand, mul(g, 2)), [3.2, 3.2, 3.2], glow('#ffb020')));
      prims.push(E(add(hand, mul(g, 2)), [2.0, 2.0, 2.0], glow('#fff0a0')));
    }
    if (flash && tip) {
      prims.push(E(add(tip, mul(g, 1.6)), [2.0, 2.0, 2.0], glow('#fffbe0')));
      prims.push(E(add(tip, mul(g, 2.2)), [3.8, 3.8, 3.8], glow('#ffc030')));
    }
    if (out) out.tip = tip;
  }

  function humanoid(S, P = {}) {
    const prims = [], marks = [];
    const bulk = S.bulk || 1, skin = hex(S.skin || '#e0a47c'), shirt = hex(S.shirt), pants = hex(S.pants || S.shirt), boots = hex(S.boots || '#1c1c1c');
    const belt = hex(S.belt || '#2a1c10'), sleeve = S.sleeve ? hex(S.sleeve) : shirt, glove = S.glove ? hex(S.glove) : skin;
    const lean = P.lean || 0, roll = P.roll || 0, twist = P.twist || 0;
    const pelvis = [0, 24 - (P.crouch || 0), 0];
    const T = v => add(pelvis, V3.rz(V3.rx(V3.ry(sub(v, [0, 24, 0]), twist), lean), roll));
    const Td = v => V3.rz(V3.rx(V3.ry(v, twist), lean), roll);
    const lift = P.lift || 0;
    for (const side of [-1, 1]) {
      const th = side < 0 ? (P.thighR || 0) : (P.thighL || 0), kn = side < 0 ? (P.kneeR || 0) : (P.kneeL || 0);
      const spread = side < 0 ? (P.spreadR || 0) : (P.spreadL || 0);
      const hip = [side * 4.3 * Math.min(bulk, 1.25), pelvis[1], 0];
      const d1 = limb(th, side * spread), knee = add(hip, mul(d1, 11.5));
      const d2 = limb(th - kn, side * spread), ankle = add(knee, mul(d2, 10.8));
      prims.push(C(hip, knee, 3.7 * Math.min(bulk, 1.3), pants));
      prims.push(C(knee, ankle, 3.2 * Math.min(bulk, 1.3), S.highBoots === false ? pants : boots));
      const foot = norm([0, Math.sin(th - kn) * 0.3, Math.cos(th - kn)]);
      prims.push(E(add(add(ankle, [0, -1.1, 0]), mul(foot, 1.6)), [3.1 * Math.min(bulk, 1.2), 2.4, 4.4], boots, { rot: [-(th - kn) * 0.8, 0, 0] }));
    }
    if (S.coat) {
      const coat = hex(S.coat);
      prims.push(X(T([0, 28, -0.2]), [8.9 * bulk, 12.5, 5.2 * bulk], coat, { rot: [lean, twist, roll] }));
      prims.push(X(T([0, 16.5, -0.2]), [9.8 * bulk, 3.5, 5.6 * bulk], coat, { rot: [lean, twist, roll] }));
      for (let y = 18; y <= 38; y += 4) marks.push({ p: T([0, y, 5.25 * bulk]), c: shade(coat, 0.55), s: [1, 2] });
    }
    prims.push(E(pelvis, [8 * Math.min(bulk, 1.3), 4.8, 5.4 * Math.min(bulk, 1.3)], pants));
    prims.push(E(T([0, 35.5, 0]), [9.6 * bulk, 7.4, 5.0 * bulk], shirt, { rot: [lean, twist, roll] }));
    prims.push(E(T([0, 29.5, 0]), [8.3 * bulk, 6.4, 4.8 * bulk], shirt, { rot: [lean, twist, roll] }));
    prims.push(X(T([0, 33, 0]), [8.4 * bulk, 6.5, 3.6 * bulk], shirt, { rot: [lean, twist, roll] }));
    if (S.belly) prims.push(E(T([0, 29, 2.5]), [8.6 * bulk, 8, 6.5 * bulk + S.belly], shirt, { rot: [lean, twist, roll] }));
    if (S.armor) prims.push(E(T([0, 35, 0.8]), [9.6 * bulk, 8, 6.4 * bulk], hex(S.armor), { rot: [lean, twist, roll], shine: true, m: { c: hex(S.armor), shine: true } }));
    if (!S.noBelt) {
      prims.push(E(T([0, 25.6, 0]), [8.7 * bulk, 1.7, 5.9 * bulk + (S.belly ? S.belly * 0.6 : 0)], belt, { rot: [lean, twist, roll] }));
      marks.push({ p: T([0, 25.6, 5.9 * bulk + 0.4 + (S.belly ? S.belly * 0.6 : 0)]), c: hex(S.buckle || '#b0a060'), s: [2, 1] });
    }
    if (S.straps) { prims.push(C(T([-5 * bulk, 38, 5 * bulk]), T([4 * bulk, 27, 5.6 * bulk]), 0.8, hex(S.straps))); }
    for (const side of [-1, 1]) prims.push(E(T([side * 8.4 * bulk, 39.4, 0]), [3.8 * bulk, 3.4, 3.8], S.epaulet ? hex(S.epaulet) : shirt));
    prims.push(E(T([0, 42.4, 0]), [4.2 * bulk, 1.5, 3.7], S.collar ? hex(S.collar) : shirt));
    prims.push(C(T([0, 41, 0]), T([0, 45, 0.4]), 2.3 * Math.min(bulk, 1.3), skin));
    const hy = P.headYaw || 0, hp = P.headPitch || 0;
    const H = v => T(add([0, 48.6, 0.6], V3.ry(V3.rx(v, hp), hy)));
    const headRot = [lean + hp, twist + hy, roll];
    if (!S.noHead) {
      prims.push(E(H([0, 0, 0]), [5.0, 5.8, 5.3], skin, { rot: headRot }));
      const eye = hex(S.eye || '#1c1c24');
      if (S.headgear === 'mask') {
        prims.push(E(H([0, -1.4, 3.8]), [3.6, 3.4, 2.4], hex('#4a4e48'), { rot: headRot }));
        prims.push(Y(H([0, -2.6, 5.4]), H([0, -4.2, 8.2]), 1.4, hex('#2a2c28')));
        marks.push({ p: H([-2.0, 0.8, 4.9]), c: hex('#80c0d0'), s: [2, 2] }, { p: H([2.0, 0.8, 4.9]), c: hex('#80c0d0'), s: [2, 2] });
      } else {
        marks.push({ p: H([-1.9, 0.5, 5.05]), c: eye }, { p: H([1.9, 0.5, 5.05]), c: eye });
        if (S.glasses) marks.push({ p: H([-1.9, 0.5, 5.2]), c: hex('#d8f0ff'), s: [2, 1] }, { p: H([1.9, 0.5, 5.2]), c: hex('#d8f0ff'), s: [2, 1] });
        marks.push({ p: H([0, -3.3, 4.7]), c: hex(P.mouth || S.mouth || '#7a3028'), s: P.mouthOpen ? [2, 2] : [2, 1] });
        if (S.mustache) marks.push({ p: H([0, -2.2, 5.0]), c: hex('#141414'), s: [2, 1] });
        if (S.scar) marks.push({ p: H([2.4, -0.8, 4.4]), c: hex('#a03030'), s: [1, 2] });
      }
      const gear = S.headgear || 'none', hat = hex(S.hat || '#404040'), hair = hex(S.hair || '#4a3018');
      if (gear === 'helmet') {
        prims.push(E(H([0, 2.4, -0.3]), [6.4, 5.6, 6.7], hat, { rot: headRot, clip: -0.6 }));
        prims.push(E(H([0, 1.9, -0.3]), [7.0, 0.9, 7.2], hat, { rot: headRot }));
      } else if (gear === 'cap') {
        prims.push(E(H([0, 5.0, 0]), [6.4, 2.4, 6.9], hat, { rot: headRot }));
        prims.push(E(H([0, 3.5, 0]), [5.5, 1.3, 5.7], hex(S.band || '#1c1c1c'), { rot: headRot }));
        prims.push(X(H([0, 2.7, 5.3]), [4.2, 0.45, 1.7], hex('#141414'), { rot: [headRot[0] - 0.25, headRot[1], headRot[2]] }));
        marks.push({ p: H([0, 5.2, 6.6]), c: hex('#d0d0c0'), s: [1, 1] });
      } else if (gear === 'hair' || gear === 'braids' || gear === 'side') {
        prims.push(E(H([0, 1.8, -0.8]), [5.4, 4.6, 5.6], hair, { rot: headRot, clip: -0.4 }));
        if (gear === 'side') prims.push(E(H([1.8, 3.2, 3.0]), [3.4, 1.6, 2.6], hair, { rot: headRot }));
        if (gear === 'braids') for (const side of [-1, 1]) {
          prims.push(C(H([side * 4.4, 0, -2.4]), T([side * 5.2, 37, -4.6]), 1.6, hair));
          prims.push(E(T([side * 5.2, 36.4, -4.6]), [1.6, 1.6, 1.6], hex('#c03030')));
        }
      } else if (gear === 'flattop') {
        prims.push(X(H([0, 4.5, -0.4]), [5.0, 2.1, 5.1], hair, { rot: headRot }));
        prims.push(E(H([0, 1.6, -1.2]), [5.3, 3.6, 5.0], hair, { rot: headRot, clip: -0.5 }));
      }
    }
    const hands = {};
    for (const side of [-1, 1]) {
      const a = (side < 0 ? P.armR : P.armL) || { p: 0.1, r: 0.12, e: 0.25 };
      const sh = T([side * 9.1 * bulk, 39.4, 0]);
      const d1 = Td(limb(a.p, side * a.r)), elbow = add(sh, mul(d1, 8.6));
      const d2 = Td(limb(a.p + a.e, side * (a.r2 !== undefined ? a.r2 : a.r))), wrist = add(elbow, mul(d2, 7.8));
      prims.push(C(sh, elbow, 2.9 * Math.min(bulk, 1.35), sleeve));
      prims.push(C(elbow, wrist, 2.6 * Math.min(bulk, 1.35), sleeve));
      const hand = add(wrist, mul(d2, 1.3));
      prims.push(E(hand, [2.3, 2.3, 2.3], glove));
      hands[side] = { hand, dir: d2 };
    }
    const tipOut = {};
    if (S.gun) gunPrims(S.gun, hands[-1].hand, hands[-1].dir, -1, P.flash, prims, tipOut);
    if (S.gun2) gunPrims(S.gun2, hands[1].hand, hands[1].dir, 1, P.flash2 !== undefined ? P.flash2 : P.flash, prims, {});
    if (S.extra) S.extra(prims, marks, { T, H, hands, P });
    const model = { prims, marks };
    if (P.fall) {
      const pivot = [0, 0, 0], f = P.fall;
      transformModel(model, v => add(V3.rz(sub(v, pivot), f), [P.fallShift || 0, P.fallDrop || 0, 0]), f);
    }
    if (P.hover) transformModel(model, v => add(v, [0, P.hover, 0]));
    if (S.size && S.size !== 1) transformModel(model, v => mul(v, S.size));
    return model;
  }

  const SPEC = {
    guard: { skin: '#e0a47c', shirt: '#8c6e3e', pants: '#6c552e', boots: '#241a12', belt: '#3a2614', hat: '#5a4c2c', headgear: 'helmet', gun: 'pistol', collar: '#5a6a3a' },
    officer: { skin: '#e4aa82', shirt: '#d8d8cc', pants: '#c4c4b8', boots: '#141414', belt: '#4a2a10', hat: '#dcdcd0', band: '#1c1c1c', headgear: 'cap', gun: 'pistol', epaulet: '#c0b060' },
    ss: { skin: '#dca07a', shirt: '#34488a', pants: '#2a3a70', boots: '#141414', belt: '#101010', hat: '#283040', headgear: 'helmet', gun: 'mg', straps: '#101010' },
    mutant: { skin: '#a8b490', shirt: '#5c6a4c', pants: '#3c4434', boots: '#2a2620', belt: '#2a2a20', headgear: 'none', gun: 'pistol', sleeve: '#a8b490', eye: '#c02020', mouth: '#401010', scar: true, highBoots: false },
    bj: { skin: '#e4a878', shirt: '#6c7c4c', pants: '#3c4c6c', boots: '#2c2018', belt: '#3a2a18', hair: '#e8c040', headgear: 'flattop', eye: '#2848a0' },
    hans: { skin: '#dca07a', shirt: '#54627a', pants: '#3e4a5c', boots: '#141414', belt: '#1a1a1a', hat: '#3a4250', headgear: 'helmet', gun: 'chain', gun2: 'chain', bulk: 1.35, size: 1.1, armor: '#6a7488' },
    gretel: { skin: '#e4aa86', shirt: '#6a6c74', pants: '#4a4c54', boots: '#141414', belt: '#1a1a1a', hair: '#e8c848', headgear: 'braids', gun: 'chain', gun2: 'chain', bulk: 1.3, size: 1.08, armor: '#7a7c86', mouth: '#b03040' },
    schabbs: { skin: '#e8b090', shirt: '#9aa0b0', pants: '#3a3a40', boots: '#141414', coat: '#e8e8e8', headgear: 'none', gun: 'syringe', glasses: true, bulk: 1.15, size: 1.06, noBelt: true },
    hitler: { skin: '#e0a07c', shirt: '#5a5a48', pants: '#4a4a3a', boots: '#141414', belt: '#2a1c10', hair: '#1c1810', headgear: 'side', mustache: true, gun: 'chain', gun2: 'chain', bulk: 1.12, size: 1.04, coat: '#4c4c3c' },
    fake: { skin: '#f0f0f0', shirt: '#e8e8f0', pants: '#e8e8f0', boots: '#d0d0e0', hair: '#c0c0d0', headgear: 'side', mustache: true, gun: 'fire', coat: '#f4f4ff', noBelt: true, sleeve: '#e8e8f0' },
    otto: { skin: '#dca07a', shirt: '#6c5236', pants: '#54402a', boots: '#1a1410', belt: '#2a1c10', headgear: 'mask', gun: 'rocket', bulk: 1.25, size: 1.08, straps: '#2a1c10' },
    fett: { skin: '#e4a888', shirt: '#6c7458', pants: '#565c46', boots: '#141414', belt: '#2a1c10', hat: '#6c7458', band: '#2a1c10', headgear: 'cap', gun: 'rocket', gun2: 'chain', bulk: 1.45, belly: 3.5, size: 1.08, epaulet: '#c0a040' },
    armor: { skin: '#9aa0aa', shirt: '#9aa0aa', pants: '#8a9098', boots: '#7a8088', belt: '#5a6068', hat: '#a8aeb8', headgear: 'helmet', glove: '#8a9098', sleeve: '#9aa0aa', eye: '#101010', mouth: '#505860', noBelt: true }
  };

  const walkPose = (f, aimArm) => {
    const s = [0, 1, 0, -1][f], a = 0.42 * s;
    return { thighL: a, kneeL: s < 0 ? 0.45 : 0.15, thighR: -a, kneeR: s > 0 ? 0.45 : 0.15, armL: { p: -a * 0.8, r: 0.12, e: 0.3 }, armR: aimArm || { p: a * 0.8 + 0.15, r: 0.1, e: 0.45 }, lift: 0 };
  };
  const standPose = () => ({ armL: { p: 0.05, r: 0.13, e: 0.2 }, armR: { p: 0.25, r: 0.08, e: 0.65 } });
  const aimArm = { p: 1.45, r: -0.05, e: 0.05, r2: -0.02 };
  const mgArms = { armR: { p: 0.75, r: 0.05, e: 0.65 }, armL: { p: 0.95, r: -0.45, e: 0.55, r2: -0.7 } };

  function soldierFrames(type) {
    const S = SPEC[type], out = {};
    const two = type === 'ss';
    const aim = two ? mgArms : { armR: aimArm, armL: { p: 0.1, r: 0.12, e: 0.25 } };
    for (let r = 0; r < 8; r++) {
      const yaw = r * Math.PI / 4;
      out['s' + r] = renderModel(humanoid(S, Object.assign(standPose(), two ? { armR: { p: 0.35, r: 0.05, e: 0.6 }, armL: { p: 0.55, r: -0.35, e: 0.6, r2: -0.6 } } : {})), { yaw });
      for (let f = 0; f < 4; f++) {
        const wp = walkPose(f);
        if (two) Object.assign(wp, { armR: { p: 0.35 + wp.armL.p * 0.2, r: 0.05, e: 0.6 }, armL: { p: 0.55, r: -0.35, e: 0.6, r2: -0.6 } });
        out[`w${f}_${r}`] = renderModel(humanoid(S, wp), { yaw });
      }
    }
    out.shoot1 = renderModel(humanoid(S, Object.assign({}, aim, { thighL: 0.1, thighR: -0.1 })), {});
    out.shoot2 = renderModel(humanoid(S, Object.assign({}, aim, { thighL: 0.1, thighR: -0.1, flash: true })), {});
    out.shoot3 = renderModel(humanoid(S, Object.assign({}, aim, { thighL: 0.1, thighR: -0.1, lean: -0.06 }, two ? {} : { armR: { p: 1.6, r: -0.05, e: 0.05 } })), {});
    out.shoot4 = renderModel(humanoid(S, Object.assign({}, aim, { thighL: 0.1, thighR: -0.1, flash: true, lean: -0.05 })), {});
    out.pain1 = renderModel(humanoid(S, { lean: -0.22, roll: 0.12, headPitch: -0.3, armL: { p: 0.4, r: 0.6, e: 0.6 }, armR: { p: 0.5, r: 0.5, e: 0.7 }, thighL: 0.2, kneeL: 0.3, mouthOpen: true }), {});
    out.pain2 = renderModel(humanoid(S, { lean: -0.18, roll: -0.14, headPitch: -0.2, armL: { p: 0.6, r: 0.5, e: 0.8 }, armR: { p: 0.3, r: 0.6, e: 0.5 }, thighR: -0.2, kneeR: 0.3, mouthOpen: true }), {});
    out.die1 = renderModel(humanoid(S, { lean: -0.3, roll: 0.2, headPitch: -0.4, armL: { p: 0.8, r: 0.9, e: 0.4 }, armR: { p: 0.6, r: 0.9, e: 0.4 }, crouch: 2, kneeL: 0.5, kneeR: 0.4, thighL: 0.3, thighR: 0.25, fall: 0.25, mouthOpen: true }), {});
    out.die2 = renderModel(humanoid(S, { lean: -0.4, roll: 0.3, headPitch: -0.5, armL: { p: 1.2, r: 1.1, e: 0.3 }, armR: { p: 1.0, r: 1.2, e: 0.3 }, crouch: 6, kneeL: 1.0, kneeR: 0.9, thighL: 0.7, thighR: 0.6, fall: 0.75, fallShift: 4 }), {});
    out.die3 = renderModel(humanoid(S, { lean: -0.2, roll: 0.2, armL: { p: 1.5, r: 1.3, e: 0.2 }, armR: { p: 1.4, r: 1.3, e: 0.2 }, crouch: 3, kneeL: 0.6, kneeR: 0.4, thighL: 0.4, thighR: 0.3, fall: 1.25, fallShift: 12, fallDrop: 4 }), { pitch: 0.3 });
    out.dead = renderModel(humanoid(S, { armL: { p: 0.3, r: 1.4, e: 0.3 }, armR: { p: 2.6, r: 0.3, e: 0.6 }, thighL: 0.2, thighR: -0.15, kneeL: 0.2, fall: Math.PI / 2, fallShift: 26, fallDrop: 6 }), { pitch: 0.6, cy: 56 });
    blood(out.die3, 0.6); blood(out.dead, 1);
    return out;
  }

  function blood(pic, amount) {
    const r = rng(pic.w * 31 + amount * 7);
    let x0 = pic.w, x1 = -1, yb = -1;
    for (let y = 0; y < pic.h; y++) for (let x = 0; x < pic.w; x++) if (pic.px[y * pic.w + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); yb = Math.max(yb, y); }
    if (x1 < 0) return;
    const cx = (x0 + x1) / 2, w = (x1 - x0) * 0.55 * amount + 3;
    for (let y = yb - 2; y <= Math.min(pic.h - 1, yb + 2); y++) for (let x = Math.floor(cx - w); x <= cx + w; x++) {
      const k = y * pic.w + x;
      if (x < 0 || x >= pic.w) continue;
      const t = Math.abs(x - cx) / w;
      if (!pic.px[k] && r() > t * 0.9) pic.px[k] = shade(hex('#8a0808'), 0.75 + r() * 0.4);
    }
  }

  function dogModel(P = {}) {
    const prims = [], marks = [];
    const fur = hex('#a87a44'), dark = hex('#3a2a1a'), light = hex('#c8a070');
    const pitch = P.pitch || 0, bob = P.bob || 0;
    const B = v => add([0, 15 + bob, 0], V3.rx(sub(v, [0, 15, 0]), -pitch));
    prims.push(E(B([0, 15, -1]), [4.6, 5.2, 11], fur, { rot: [-pitch, 0, 0] }));
    prims.push(E(B([0, 17.4, -2]), [4.8, 4.0, 9], dark, { rot: [-pitch, 0, 0], clip: 0.6 }));
    prims.push(E(B([0, 15, 7]), [4.4, 5.6, 5], light, { rot: [-pitch, 0, 0] }));
    prims.push(C(B([0, 17.5, 8]), B([0, 21.5, 12]), 3.1, fur));
    const hp = P.headPitch || 0;
    const Hd = v => add(B([0, 22.6, 13.4]), V3.rx(v, -hp));
    prims.push(E(Hd([0, 0, 0]), [3.8, 3.8, 4.2], fur));
    prims.push(E(Hd([0, -1.4, 4.2]), [2.2, P.mouthOpen ? 2.4 : 1.9, 3.3], light));
    if (P.mouthOpen) prims.push(E(Hd([0, -3.4, 4.0]), [1.9, 1.0, 2.8], hex('#c84848')));
    for (const s of [-1, 1]) prims.push(C(Hd([s * 2, 2.6, -0.8]), Hd([s * 2.6, 6.4, -1.4]), 1.2, dark));
    marks.push({ p: Hd([0, -0.6, 7.6]), c: hex('#101010'), s: [2, 1] }, { p: Hd([-1.7, 1.0, 3.6]), c: hex('#141010') }, { p: Hd([1.7, 1.0, 3.6]), c: hex('#141010') });
    const legs = P.legs || [0, 0, 0, 0];
    [[-2.8, 7], [2.8, 7], [-2.8, -8], [2.8, -8]].forEach(([x, z], i) => {
      const top = B([x, 13, z]), a = legs[i];
      const d = [0, -Math.cos(a), Math.sin(a)], mid = add(top, mul(d, 6.5));
      const d2 = [0, -Math.cos(a * 0.4 - (i > 1 ? 0.35 : -0.1)), Math.sin(a * 0.4 - (i > 1 ? 0.35 : -0.1))], paw = add(mid, mul(d2, 6.6));
      prims.push(C(top, mid, 1.8, i > 1 ? fur : light));
      prims.push(C(mid, paw, 1.4, light));
      prims.push(E(add(paw, [0, 0, 0.8]), [1.6, 1.1, 2.2], light));
    });
    const ta = P.tail || 0;
    prims.push(C(B([0, 17.5, -11]), B([Math.sin(ta) * 3, 13 + Math.cos(ta) * 2, -17]), 1.4, dark));
    return { prims, marks };
  }

  function dogFrames() {
    const out = {}, sc = 1.25;
    for (let r = 0; r < 8; r++) {
      const yaw = r * Math.PI / 4;
      out['s' + r] = renderModel(dogModel({}), { yaw, scale: sc });
      for (let f = 0; f < 4; f++) {
        const s = Math.sin(f * Math.PI / 2), c = Math.cos(f * Math.PI / 2);
        out[`w${f}_${r}`] = renderModel(dogModel({ legs: [0.55 * s, -0.55 * s, -0.55 * c, 0.55 * c], bob: Math.abs(s) * 0.8, tail: s * 0.6 }), { yaw, scale: sc });
      }
    }
    out.jump1 = renderModel(dogModel({ pitch: 0.18, legs: [0.5, 0.4, -0.3, -0.2], mouthOpen: true }), { scale: sc });
    out.jump2 = renderModel(dogModel({ pitch: 0.4, bob: 4, legs: [0.9, 0.8, -0.6, -0.5], mouthOpen: true, headPitch: -0.2 }), { scale: sc });
    out.jump3 = renderModel(dogModel({ pitch: 0.1, bob: 1, legs: [0.3, 0.2, -0.2, 0.1] }), { scale: sc });
    const fallen = (f, sh) => { const m = dogModel({ legs: [0.3, -0.3, 0.2, -0.2], mouthOpen: true }); transformModel(m, v => add(V3.rz(v, f), [sh, 0, 0]), f); return m; };
    out.die1 = renderModel(fallen(0.5, 4), { scale: sc });
    out.die2 = renderModel(fallen(1.1, 10), { pitch: 0.3, scale: sc });
    out.dead = renderModel(fallen(Math.PI / 2, 14), { yaw: 0.9, pitch: 0.7, cy: 58, scale: sc });
    blood(out.dead, 1);
    return out;
  }

  function bossFrames(type) {
    const S = SPEC[type], out = {};
    const dual = !!S.gun2;
    const armsAim = dual ? { armR: { p: 1.35, r: -0.05, e: 0.1 }, armL: { p: 1.35, r: -0.05, e: 0.1 } } : { armR: { p: 1.4, r: -0.05, e: 0.05 }, armL: { p: 0.2, r: 0.15, e: 0.3 } };
    const shoulder = S.gun === 'rocket';
    const rocketArm = { p: 1.25, r: -0.35, e: 0.35, r2: -0.25 };
    for (let f = 0; f < 4; f++) {
      const wp = walkPose(f);
      if (dual) Object.assign(wp, { armR: { p: 0.8 + wp.armR.p * 0.15, r: 0.05, e: 0.4 }, armL: { p: 0.8 - wp.armR.p * 0.15, r: 0.05, e: 0.4 } });
      if (shoulder) wp.armR = rocketArm;
      if (S.coat && type === 'fake') { wp.thighL = wp.thighR = 0; wp.hover = 5 + Math.sin(f * Math.PI / 2) * 1.5; }
      out['w' + f] = renderModel(humanoid(S, wp), {});
    }
    const shootPose = (flash, flash2, extra) => {
      const p = Object.assign({ thighL: 0.12, thighR: -0.12 }, armsAim, { flash, flash2 }, extra || {});
      if (shoulder) p.armR = rocketArm;
      if (type === 'fake') { p.hover = 5; p.thighL = p.thighR = 0; p.armR = { p: 1.3, r: -0.2, e: 0.2 }; }
      if (type === 'schabbs') { p.armR = flash ? { p: 1.9, r: -0.2, e: 0.3 } : { p: -0.6, r: 0.2, e: 1.2 }; p.flash = false; }
      return p;
    };
    out.shoot1 = renderModel(humanoid(S, shootPose(false, false)), {});
    out.shoot2 = renderModel(humanoid(S, shootPose(true, false)), {});
    out.shoot3 = renderModel(humanoid(S, shootPose(false, true, { lean: -0.04 })), {});
    out.shoot4 = renderModel(humanoid(S, shootPose(true, true, { lean: -0.05 })), {});
    const dieBase = type === 'fake' ? { hover: 3 } : {};
    out.die1 = renderModel(humanoid(S, Object.assign({ lean: -0.25, roll: 0.15, headPitch: -0.3, armL: { p: 1.1, r: 0.8, e: 0.3 }, armR: { p: 1.0, r: 0.9, e: 0.3 }, mouthOpen: true }, dieBase)), {});
    out.die2 = renderModel(humanoid(S, Object.assign({ lean: -0.35, roll: 0.25, armL: { p: 1.6, r: 1.0, e: 0.3 }, armR: { p: 1.5, r: 1.1, e: 0.2 }, crouch: 5, kneeL: 1, kneeR: 1, thighL: 0.6, thighR: 0.6, fall: 0.5, fallShift: 3, mouthOpen: true }, dieBase)), {});
    out.die3 = renderModel(humanoid(S, { lean: -0.2, armL: { p: 1.6, r: 1.3, e: 0.2 }, armR: { p: 1.5, r: 1.2, e: 0.2 }, crouch: 3, kneeL: 0.7, kneeR: 0.5, thighL: 0.4, thighR: 0.3, fall: 1.15, fallShift: 12, fallDrop: 4 }), { pitch: 0.3 });
    out.dead = renderModel(humanoid(S, { armL: { p: 0.3, r: 1.4, e: 0.3 }, armR: { p: 2.6, r: 0.3, e: 0.6 }, fall: Math.PI / 2, fallShift: 28, fallDrop: 6 }), { pitch: 0.6, cy: 56 });
    if (type !== 'fake') { blood(out.die3, 0.7); blood(out.dead, 1.2); }
    else { for (const k of ['die1', 'die2', 'die3', 'dead']) out[k] = puff(out[k], k === 'dead' ? 1 : k === 'die3' ? 0.7 : k === 'die2' ? 0.4 : 0.15); }
    return out;
  }

  function puff(pic, t) {
    const out = new Pic(pic.w, pic.h), r = rng(77);
    for (let i = 0; i < pic.px.length; i++) if (pic.px[i] && r() > t) out.px[i] = mix(pic.px[i], hex('#ffffff'), t);
    if (t >= 1) return new Pic(pic.w, pic.h);
    return out;
  }

  function mechaModel(P = {}) {
    const prims = [], marks = [];
    const steel = { c: hex('#7a8290'), shine: true }, dark = hex('#3a4048'), red = hex('#8a1c1c');
    const s = [0, 1, 0, -1][P.walk || 0], a = 0.25 * s;
    for (const side of [-1, 1]) {
      const th = side < 0 ? -a : a;
      const hip = [side * 7, 25, 0], knee = add(hip, mul(limb(th, 0), 11)), ankle = add(knee, mul(limb(th - 0.2, 0), 11));
      prims.push(C(hip, knee, 5.2, steel));
      prims.push(C(knee, ankle, 4.6, steel));
      prims.push(X(add(ankle, [0, -1.5, 2]), [5, 2.4, 7], dark));
    }
    prims.push(X([0, 37, 0], [12, 11, 8], steel));
    prims.push(X([0, 37, 8.2], [8, 7, 0.6], red));
    prims.push(E([0, 27, 0], [11, 4, 8], dark));
    for (const side of [-1, 1]) {
      prims.push(E([side * 13.5, 46, 0], [6, 5, 6.5], steel));
      const hand = [side * 15, 31 + (P.recoil ? 1 : 0), 6];
      prims.push(C([side * 14, 44, 0], [side * 15, 35, 3], 4, steel));
      for (const dx of [-1.6, 1.6]) {
        prims.push(Y(add(hand, [dx, 0, -4]), add(hand, [dx, 0, 12]), 1.3, dark));
        if ((side < 0 ? P.flash : P.flash2)) prims.push(E(add(hand, [dx, 0, 14]), [2.8, 2.8, 2.8], glow('#ffd040')));
      }
      prims.push(X(hand, [3.6, 3, 4], steel));
    }
    prims.push(E([0, 52.5, 0], [7.5, 6.5, 7], steel, { clip: -2 }));
    prims.push(X([0, 51.5, 6.2], [4, 1.5, 0.8], hex('#141414')));
    marks.push({ p: [-1.8, 51.5, 7.1], c: hex('#ff3030') }, { p: [1.8, 51.5, 7.1], c: hex('#ff3030') });
    for (const p of [[-9, 44, 8.2], [9, 44, 8.2], [-9, 30, 8.2], [9, 30, 8.2]]) marks.push({ p, c: hex('#c8d0d8') });
    const m = { prims, marks };
    if (P.fall) transformModel(m, v => add(V3.rz(v, P.fall), [P.fallShift || 0, 0, 0]), P.fall);
    if (P.broken) { m.prims = m.prims.filter((_, i) => i % 3 !== 1); }
    transformModel(m, v => mul(v, 1.08));
    return m;
  }

  function mechaFrames() {
    const out = {};
    for (let f = 0; f < 4; f++) out['w' + f] = renderModel(mechaModel({ walk: f }), {});
    out.shoot1 = renderModel(mechaModel({}), {});
    out.shoot2 = renderModel(mechaModel({ flash: true }), {});
    out.shoot3 = renderModel(mechaModel({ flash2: true, recoil: true }), {});
    out.die1 = renderModel(mechaModel({ broken: true }), {});
    out.die2 = renderModel(mechaModel({ broken: true, fall: 0.3, fallShift: 2 }), {});
    out.die3 = renderModel(mechaModel({ broken: true, fall: 0.8, fallShift: 8 }), { pitch: 0.2 });
    out.dead = renderModel(mechaModel({ broken: true, fall: Math.PI / 2, fallShift: 30 }), { pitch: 0.55, cy: 58 });
    return out;
  }

  function ghostFrames() {
    const out = {};
    const colors = ['#e02020', '#f080c0', '#30d0e0', '#f0a030'];
    colors.forEach((col, ci) => {
      for (let f = 0; f < 2; f++) {
        const prims = [], marks = [], c = hex(col), y0 = 22 + f * 1.5;
        prims.push(E([0, y0 + 12, 0], [11, 12, 10], c, { clip: -3 }));
        prims.push(Y([0, y0 + 2, 0], [0, y0 + 10, 0], 10.6, c));
        for (let i = 0; i < 4; i++) prims.push(E([-7.5 + i * 5 + (f ? 1.2 : 0), y0 + 1.5, 0], [2.6, 3.4, 2.6 + (i % 2) * 0.5], c));
        for (const s of [-1, 1]) {
          prims.push(E([s * 4.2, y0 + 15, 7.6], [2.8, 3.4, 1.6], { c: hex('#ffffff') }));
          marks.push({ p: [s * 4.2 + 0.6, y0 + 14.4, 9.3], c: hex('#2030c0'), s: [2, 2] });
        }
        out[`w${f}_${ci}`] = renderModel({ prims, marks }, { scale: 1.7, cy: 63.5 + 22 * 1.7 - 18 });
      }
    });
    return out;
  }

  function bjFrames() {
    const out = {};
    for (let f = 0; f < 4; f++) {
      const wp = walkPose(f);
      wp.thighL *= 1.5; wp.thighR *= 1.5; wp.armL.p *= 1.6; wp.armR = { p: -wp.armL.p, r: 0.1, e: 0.9 }; wp.armL.e = 0.9; wp.lean = 0.12;
      out['run' + f] = renderModel(humanoid(SPEC.bj, wp), {});
    }
    out.jump1 = renderModel(humanoid(SPEC.bj, { armL: { p: 2.6, r: 0.4, e: 0.2 }, armR: { p: 2.6, r: 0.4, e: 0.2 }, thighL: 0.4, kneeL: 0.9, thighR: 0.4, kneeR: 0.9, hover: 6, mouthOpen: true }), {});
    out.jump2 = renderModel(humanoid(SPEC.bj, { armL: { p: 2.9, r: 0.3, e: 0.1 }, armR: { p: 2.9, r: 0.3, e: 0.1 }, hover: 2, mouthOpen: true }), {});
    out.stand = renderModel(humanoid(SPEC.bj, standPose()), {});
    return out;
  }

  function bust(spec, P, size = 48, breath = 0) {
    const m = humanoid(spec, Object.assign({ armL: { p: 0.05, r: 0.2, e: 0.2 }, armR: { p: 0.05, r: 0.2, e: 0.2 } }, P || {}));
    m.prims = m.prims.filter(p => (p.t === 'ell' || p.t === 'box' ? p.c[1] : Math.max(p.a[1], p.b[1])) > 26 * (spec.size || 1));
    transformModel(m, v => add(v, [0, -30 * (spec.size || 1) + breath, 0]));
    return renderModel(m, { w: size, h: size, scale: size / (30 * (spec.size || 1)), cx: size / 2, cy: size - 0.5 });
  }

  const SPR_CACHE = {};
  function actorSprites(type) {
    if (SPR_CACHE[type]) return SPR_CACHE[type];
    let s;
    if (type === 'guard' || type === 'officer' || type === 'ss' || type === 'mutant') s = soldierFrames(type);
    else if (type === 'dog') s = dogFrames();
    else if (type === 'mecha') s = mechaFrames();
    else if (type === 'ghost') s = ghostFrames();
    else if (type === 'bj') s = bjFrames();
    else s = bossFrames(type);
    SPR_CACHE[type] = s;
    return s;
  }

  function staticModel(name) {
    const P = [], M = [];
    const gold = { c: hex('#e0b030'), shine: true }, silver = { c: hex('#c0c8d0'), shine: true }, woodc = hex('#7a4a22'), bone = hex('#e0dcc8');
    let o = { pitch: 0.35 };
    const ring = (cy, r, h, m) => P.push(Y([0, cy - h, 0], [0, cy + h, 0], r, m));
    const skeleton = (x0, y0, z0, lying) => {
      if (lying) {
        P.push(E([x0, y0 + 2, z0 - 9], [3.2, 2.6, 3.4], bone));
        P.push(C([x0, y0 + 1.5, z0 - 6], [x0, y0 + 1.5, z0 + 3], 0.9, bone));
        for (let i = 0; i < 4; i++) P.push(C([x0 - 3, y0 + 1.6, z0 - 5 + i * 1.8], [x0 + 3, y0 + 1.6, z0 - 5 + i * 1.8], 0.55, bone));
        P.push(C([x0 - 1.5, y0 + 1, z0 + 3], [x0 - 3, y0 + 1, z0 + 12], 0.8, bone));
        P.push(C([x0 + 1.5, y0 + 1, z0 + 3], [x0 + 4, y0 + 1, z0 + 11], 0.8, bone));
        P.push(C([x0 - 4, y0 + 1, z0 - 5], [x0 - 8, y0 + 1, z0 + 1], 0.7, bone));
        P.push(C([x0 + 4, y0 + 1, z0 - 5], [x0 + 7, y0 + 1, z0 + 2], 0.7, bone));
        M.push({ p: [x0 - 1.2, y0 + 3, z0 - 6.4], c: hex('#302820') }, { p: [x0 + 1.2, y0 + 3, z0 - 6.4], c: hex('#302820') });
      } else {
        P.push(E([x0, y0 + 20, z0], [3.2, 3.6, 3.2], bone));
        M.push({ p: [x0 - 1.2, y0 + 20.4, z0 + 3], c: hex('#302820') }, { p: [x0 + 1.2, y0 + 20.4, z0 + 3], c: hex('#302820') });
        P.push(C([x0, y0 + 16, z0], [x0, y0 + 7, z0], 0.9, bone));
        for (let i = 0; i < 4; i++) P.push(C([x0 - 3, y0 + 15 - i * 1.8, z0 + 0.5], [x0 + 3, y0 + 15 - i * 1.8, z0 + 0.5], 0.55, bone));
        P.push(C([x0 - 3.5, y0 + 16, z0], [x0 - 4.5, y0 + 6, z0 + 1], 0.7, bone));
        P.push(C([x0 + 3.5, y0 + 16, z0], [x0 + 4.5, y0 + 6, z0 + 1], 0.7, bone));
        P.push(E([x0, y0 + 6.5, z0], [3, 1.5, 2], bone));
        P.push(C([x0 - 1.5, y0 + 6, z0], [x0 - 2, y0 - 6, z0], 0.8, bone));
        P.push(C([x0 + 1.5, y0 + 6, z0], [x0 + 2, y0 - 6, z0], 0.8, bone));
      }
    };
    switch (name) {
      case 'puddle': P.push(E([0, 0.2, 0], [15, 0.5, 10], { c: hex('#2a4a9a'), shine: true })); M.push({ p: [-4, 0.8, 2], c: hex('#7090e0'), s: [4, 1] }); o = { pitch: 0.7 }; break;
      case 'lamp':
        P.push(Y([0, 64, 0], [0, 57, 0], 0.5, hex('#202020')));
        P.push(E([0, 55, 0], [7.5, 3.4, 7.5], hex('#2a7a3a'), { clip: -0.4 }));
        P.push(E([0, 53.6, 0], [2.4, 1.8, 2.4], glow('#fff8c0')));
        o = { pitch: -0.3 }; break;
      case 'chandelier':
        P.push(Y([0, 64, 0], [0, 56, 0], 0.4, hex('#504020')));
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4, x = Math.cos(a) * 9, z = Math.sin(a) * 9;
          P.push(E([x, 53, z], [2.2, 1, 2.2], gold));
          if (i % 2 === 0) { P.push(Y([x, 53.5, z], [x, 57, z], 0.7, hex('#f0f0e0'))); P.push(E([x, 58.2, z], [0.8, 1.3, 0.8], glow('#ffd040'))); }
        }
        P.push(E([0, 53, 0], [3, 2.2, 3], gold));
        o = { pitch: -0.25 }; break;
      case 'barrel':
        P.push(Y([0, 0, 0], [0, 22, 0], 8, hex('#3a6a3a')));
        ring(4, 8.4, 0.9, hex('#2a3a2a')); ring(18, 8.4, 0.9, hex('#2a3a2a'));
        P.push(Y([0, 22, 0], [0, 22.4, 0], 7.4, hex('#4a7a4a')));
        break;
      case 'woodbarrel':
        P.push(E([0, 11, 0], [8.6, 11.5, 8.6], woodc, { clip: -10.5 }));
        P.push(Y([0, 20.5, 0], [0, 21, 0], 7.2, hex('#5a3418')));
        ring(4, 8.5, 0.8, hex('#404040')); ring(18, 8.5, 0.8, hex('#404040'));
        break;
      case 'tablechairs':
        P.push(X([0, 16.5, 0], [12, 1.1, 8], woodc));
        for (const [x, z] of [[-10, -6], [10, -6], [-10, 6], [10, 6]]) P.push(Y([x, 0, z], [x, 15.5, z], 0.9, hex('#5a3418')));
        for (const s of [-1, 1]) {
          P.push(X([s * 17, 10, 0], [3.5, 0.8, 3.5], hex('#6a3c1c')));
          P.push(X([s * 20.5, 17, 0], [0.7, 7, 3.5], hex('#6a3c1c')));
          for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) P.push(Y([s * 17 + x, 0, z], [s * 17 + x, 9.5, z], 0.6, hex('#4a2a10')));
        }
        M.push({ p: [-3, 17.7, 2], c: hex('#e0e0e0'), s: [3, 1] }, { p: [4, 17.7, -2], c: hex('#c0a040'), s: [2, 1] });
        o = { pitch: 0.42 }; break;
      case 'table':
        P.push(Y([0, 16, 0], [0, 17.2, 0], 12, woodc));
        P.push(Y([0, 0, 0], [0, 16, 0], 1.6, hex('#5a3418')));
        P.push(Y([0, 0, 0], [0, 1, 0], 6, hex('#5a3418')));
        o = { pitch: 0.42 }; break;
      case 'stove':
        P.push(X([0, 10, 0], [10, 10, 7], hex('#2c2c2c')));
        P.push(X([0, 20.4, 0], [10.5, 0.6, 7.5], hex('#444444')));
        P.push(Y([-4, 21, 0], [-4, 27, 0], 4, { c: hex('#808890'), shine: true }));
        M.push({ p: [0, 10, 7.2], c: hex('#ff8020'), s: [6, 3] }, { p: [0, 14, 7.2], c: hex('#606060'), s: [12, 1] });
        o = { pitch: 0.3 }; break;
      case 'pillar':
        P.push(Y([0, 4, 0], [0, 60, 0], 7, hex('#8a8a8a')));
        P.push(X([0, 2, 0], [9, 2, 9], hex('#6a6a6a')));
        P.push(X([0, 62, 0], [9, 2, 9], hex('#6a6a6a')));
        o = { pitch: 0 }; break;
      case 'plant':
        P.push(Y([0, 0, 0], [0, 9, 0], 5, hex('#a85028')));
        P.push(Y([0, 8.5, 0], [0, 10, 0], 5.8, hex('#c06030')));
        for (let i = 0; i < 9; i++) {
          const a = i * 2.39, rr = 2 + (i % 3) * 2.2, y = 13 + (i % 4) * 4.5;
          P.push(E([Math.cos(a) * rr, y, Math.sin(a) * rr], [4.5, 3, 4.5], hex(i % 2 ? '#2a7a2a' : '#3a9a32'), { rot: [0.4 * Math.sin(a), a, 0.3] }));
        }
        break;
      case 'vase':
        P.push(E([0, 9, 0], [6, 9, 6], { c: hex('#3050b0'), shine: true }));
        P.push(Y([0, 15, 0], [0, 22, 0], 2.8, { c: hex('#3050b0'), shine: true }));
        P.push(Y([0, 21.5, 0], [0, 23, 0], 3.6, hex('#2a40a0')));
        M.push({ p: [0, 10, 6], c: hex('#e8e8f0'), s: [5, 1] }, { p: [0, 7, 5.8], c: hex('#e8e8f0'), s: [3, 1] });
        o = { pitch: 0.25 }; break;
      case 'bones':
        P.push(E([-5, 2.2, 2], [3, 2.6, 3.2], bone));
        P.push(C([-1, 0.8, -3], [8, 0.8, 2], 0.9, bone)); P.push(C([2, 0.8, 5], [9, 0.8, -1], 0.8, bone)); P.push(C([-9, 0.8, -4], [-2, 0.8, -7], 0.8, bone));
        M.push({ p: [-6, 2.8, 4.8], c: hex('#302820') }, { p: [-4, 2.8, 4.8], c: hex('#302820') });
        o = { pitch: 0.7 }; break;
      case 'skeleton': skeleton(0, 0, 0, true); o = { pitch: 0.75 }; break;
      case 'hangskel':
        P.push(Y([0, 64, 0], [0, 50, 0], 0.5, hex('#8a6a3a')));
        skeleton(0, 28, 0, false);
        o = { pitch: 0 }; break;
      case 'bloodbones':
        P.push(E([0, 0.4, 0], [11, 0.6, 7], hex('#8a0c0c')));
        P.push(E([4, 0.8, -2], [5, 0.8, 4], hex('#a01414')));
        P.push(C([-6, 1.2, 1], [3, 1.2, 4], 0.9, bone));
        P.push(E([-6, 2, -3], [2.6, 2.2, 2.6], hex('#c84040')));
        o = { pitch: 0.7 }; break;
      case 'pans':
        P.push(Y([-16, 58, 0], [16, 58, 0], 0.8, hex('#404040')));
        for (const [x, r] of [[-10, 4.5], [0, 5.5], [10, 4]]) {
          P.push(Y([x, 57.5, 0], [x, 50, 0], 0.4, hex('#606060')));
          P.push(Y([x, 50 - r * 2, -0.6], [x, 50 - r * 2, 0.6], r, { c: hex('#9a9aa2'), shine: true }));
        }
        o = { pitch: 0 }; break;
      case 'flag':
        P.push(Y([0, 1, 0], [0, 58, 0], 0.9, gold));
        P.push(E([0, 59, 0], [1.6, 1.6, 1.6], gold));
        P.push(Y([0, 0, 0], [0, 2, 0], 5, hex('#3a3a3a')));
        P.push(X([6, 46, 0], [5.4, 9.5, 0.5], hex('#b01818')));
        M.push({ p: [6, 46, 0.7], c: hex('#e8e8e0'), s: [5, 5] }, { p: [6, 46, 0.9], c: hex('#181818'), s: [3, 3] });
        o = { pitch: 0.05 }; break;
      case 'cage': case 'cageskel':
        if (name === 'cageskel') skeleton(0, 8, 0, false);
        P.push(Y([0, 0, 0], [0, 2, 0], 10, hex('#4a4a4a')));
        P.push(Y([0, 44, 0], [0, 46, 0], 10, hex('#4a4a4a')));
        P.push(Y([0, 46, 0], [0, 64, 0], 0.6, hex('#303030')));
        for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; P.push(Y([Math.cos(a) * 9.5, 1, Math.sin(a) * 9.5], [Math.cos(a) * 9.5, 45, Math.sin(a) * 9.5], 0.6, hex('#6a6a70'))); }
        o = { pitch: 0.12 }; break;
      case 'well':
        P.push(Y([0, 0, 0], [0, 13, 0], 12, hex('#7a7a7a')));
        P.push(Y([0, 12.8, 0], [0, 13.2, 0], 9.8, hex('#1a2a5a')));
        P.push(Y([0, 13, 0], [0, 13.4, 0], 9.2, { c: hex('#2a4aa0'), shine: true }));
        for (let i = 0; i < 6; i++) M.push({ p: [Math.cos(i) * 12, 4 + (i % 3) * 3.5, Math.sin(i) * 12], c: hex('#4a4a4a'), s: [3, 1] });
        o = { pitch: 0.5 }; break;
      case 'spears':
        P.push(Y([-12, 30, -1], [12, 30, -1], 0.8, woodc));
        P.push(Y([-12, 2, -1], [12, 2, -1], 0.8, woodc));
        for (let i = 0; i < 5; i++) {
          const x = -10 + i * 5;
          P.push(Y([x, 0, 0], [x, 50, 0], 0.7, hex('#6a4a2a')));
          P.push(E([x, 53, 0], [1.4, 3.4, 0.6], silver));
        }
        o = { pitch: 0.05 }; break;
      case 'bed':
        P.push(X([0, 6, 0], [10, 3, 17], woodc));
        P.push(X([0, 10, 0.5], [9.4, 1.6, 16], hex('#e8e8e0')));
        P.push(X([0, 11, 4], [9.6, 1.4, 11], hex('#7a2a2a')));
        P.push(E([0, 12.5, -12], [6, 1.8, 3], hex('#f4f4f0')));
        P.push(X([0, 13, -17.5], [10, 7, 1], woodc));
        o = { pitch: 0.5, yaw: 0.5 }; break;
      case 'armor': {
        const m = humanoid(SPEC.armor, { armL: { p: 0.1, r: 0.12, e: 0.3 }, armR: { p: 0.3, r: 0.1, e: 0.5 } });
        m.prims.forEach(p => { p.m = { c: typeof p.m === 'number' ? p.m : p.m.c, shine: true }; });
        m.prims.push(Y([0, -1, 0], [0, 1, 0], 9, hex('#4a3a2a')));
        m.prims.push(Y([-8, 0, 3], [-10, 58, 3], 0.6, woodc));
        m.prims.push(E([-10.2, 60, 3], [1.2, 3, 0.6], silver));
        return renderModel(m, { pitch: 0.05 });
      }
      case 'clip':
        P.push(X([0, 3, 0], [5, 3, 3.2], hex('#4a5236')));
        P.push(X([0, 6.3, 0], [5.2, 0.4, 3.4], hex('#3a4228')));
        M.push({ p: [-2, 6.8, 0], c: hex('#e0b040'), s: [1, 1] }, { p: [0, 6.8, 0], c: hex('#e0b040') }, { p: [2, 6.8, 0], c: hex('#e0b040') }, { p: [0, 3, 3.3], c: hex('#d0d0b0'), s: [4, 1] });
        o = { pitch: 0.5 }; break;
      case 'food':
        P.push(Y([0, 0, 0], [0, 1, 0], 10, { c: hex('#f0f0f0'), shine: true }));
        P.push(E([0, 4.2, 0], [6.5, 3.8, 4.8], hex('#b06a2a')));
        P.push(C([5, 3, 2], [9, 4.2, 4], 1.4, hex('#c07a3a'))); P.push(C([-5, 3, 2], [-9, 4.2, 4], 1.4, hex('#c07a3a')));
        P.push(E([9.5, 4.4, 4.2], [1.3, 1.3, 1.3], hex('#f0f0e0'))); P.push(E([-9.5, 4.4, 4.2], [1.3, 1.3, 1.3], hex('#f0f0e0')));
        o = { pitch: 0.5 }; break;
      case 'dogfood':
        P.push(E([0, 2.4, 0], [7, 2.6, 7], hex('#c03030'), { clip: -2.4 }));
        P.push(Y([0, 4.2, 0], [0, 4.6, 0], 5.6, hex('#7a4a28')));
        o = { pitch: 0.55 }; break;
      case 'firstaid':
        P.push(X([0, 5, 0], [8, 5, 6], hex('#e8e8e8')));
        M.push({ p: [0, 5, 6.1], c: hex('#d01818'), s: [2, 6] }, { p: [0, 5, 6.1], c: hex('#d01818'), s: [6, 2] }, { p: [0, 10.1, 0], c: hex('#d01818'), s: [2, 4] }, { p: [0, 10.1, 0], c: hex('#d01818'), s: [5, 2] });
        o = { pitch: 0.45 }; break;
      case 'key1': case 'key2': {
        const m = name === 'key1' ? gold : silver;
        for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; P.push(E([Math.cos(a) * 4, 15 + Math.sin(a) * 4, 0], [1.4, 1.4, 1.4], m)); }
        P.push(Y([0, 11, 0], [0, 1, 0], 1.0, m));
        P.push(X([2, 3, 0], [2, 1, 0.6], m)); P.push(X([2, 6, 0], [1.5, 0.8, 0.6], m));
        o = { pitch: 0.15 }; break;
      }
      case 'cross':
        P.push(X([0, 9, 0], [1.5, 8, 1.2], gold)); P.push(X([0, 12, 0], [5, 1.5, 1.2], gold));
        P.push(X([0, 0.8, 0], [4, 0.8, 3], gold));
        M.push({ p: [0, 12, 1.3], c: hex('#e02020') }, { p: [0, 6, 1.3], c: hex('#2040e0') });
        o = { pitch: 0.2 }; break;
      case 'chalice':
        P.push(E([0, 15, 0], [5.5, 4.5, 5.5], gold, { clip: -1.8 }));
        P.push(Y([0, 15.5, 0], [0, 16, 0], 5, hex('#806010')));
        P.push(Y([0, 2, 0], [0, 12, 0], 1.0, gold));
        P.push(E([0, 1, 0], [4.5, 1, 4.5], gold));
        M.push({ p: [-2, 14, 4.8], c: hex('#e02020') }, { p: [2, 14, 4.8], c: hex('#20b040') }, { p: [0, 13.2, 5.3], c: hex('#2040e0') });
        o = { pitch: 0.25 }; break;
      case 'chest':
        P.push(X([0, 5, 0], [9, 5, 6], woodc));
        P.push(X([0, 13, -6], [9, 4, 1], hex('#6a3c1c'), { rot: [-0.5, 0, 0] }));
        for (let i = 0; i < 7; i++) P.push(E([-6 + (i % 4) * 4, 10 + (i > 3 ? 1.5 : 0), -2 + (i % 3) * 2], [2.4, 1.8, 2.4], gold));
        M.push({ p: [-3, 12, 1], c: hex('#e02020'), s: [2, 1] }, { p: [3, 12, 2], c: hex('#2040e0') }, { p: [0, 5, 6.2], c: hex('#e0c040'), s: [2, 2] });
        P.push(X([-9.2, 5, 0], [0.4, 5, 6.2], hex('#404040'))); P.push(X([9.2, 5, 0], [0.4, 5, 6.2], hex('#404040')));
        o = { pitch: 0.45 }; break;
      case 'crown':
        P.push(Y([0, 1, 0], [0, 7, 0], 6.5, gold));
        P.push(Y([0, 1.5, 0], [0, 6.5, 0], 6.2, hex('#a01818')));
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; P.push(E([Math.cos(a) * 6.3, 9, Math.sin(a) * 6.3], [1.3, 2.4, 1.3], gold)); }
        P.push(Y([0, 1, 0], [0, 2.2, 0], 6.9, gold)); P.push(Y([0, 6, 0], [0, 7.2, 0], 6.9, gold));
        M.push({ p: [0, 4, 6.9], c: hex('#2040e0'), s: [2, 2] }, { p: [-4, 4, 5.4], c: hex('#20c040') }, { p: [4, 4, 5.4], c: hex('#ffffff') });
        o = { pitch: 0.35 }; break;
      case 'oneup':
        P.push(E([0, 14, 0], [11, 11, 11], { c: hex('#3060e0'), shine: true }));
        M.push({ p: [-3.6, 17, 9.8], c: hex('#e8e8ff'), s: [2, 2] }, { p: [3.6, 17, 9.8], c: hex('#e8e8ff'), s: [2, 2] }, { p: [0, 10.4, 10.2], c: hex('#e8e8ff'), s: [6, 1] }, { p: [0, 22.5, 8], c: hex('#f0d040'), s: [9, 2] });
        o = { pitch: 0.1 }; break;
      case 'mg': case 'chain': {
        const g = [1, 0, 0];
        gunPrims(name, [-4, 3, 0], g, -1, false, P, {});
        if (name === 'mg') P.push(X([-9, 3, 0], [4, 1.5, 1.2], hex('#4a3020')));
        else P.push(X([-6, 6, 0], [3, 1, 1], hex('#3a3a42')));
        o = { pitch: 0.6, yaw: 0.35 }; break;
      }
      case 'needle':
        P.push(Y([-6, 32, 0], [4, 32, 0], 1.4, { c: hex('#c8e8f0'), shine: true }));
        P.push(Y([-5, 32, 0], [3, 32, 0], 0.9, hex('#40c040')));
        P.push(Y([4, 32, 0], [8, 32, 0], 0.35, hex('#e0e0e0')));
        o = { pitch: 0, yaw: 0.7 }; break;
      case 'rocket':
        P.push(Y([0, 32, -7], [0, 32, 5], 2.3, hex('#7a7a6a')));
        P.push(E([0, 32, 5.5], [2.3, 2.3, 3], hex('#a02020')));
        for (const a of [0, 1.57, 3.14, 4.71]) P.push(X([Math.cos(a) * 3, 32 + Math.sin(a) * 3, -6], [Math.abs(Math.cos(a)) * 1.2 + 0.2, Math.abs(Math.sin(a)) * 1.2 + 0.2, 1.5], hex('#5a5a4a')));
        o = { pitch: 0.15, yaw: 0.6 }; break;
      case 'fire0': case 'fire1': {
        const f = name === 'fire1';
        P.push(E([0, 32, 0], [6 + (f ? 1 : 0), 6.5, 6], glow('#ff6010')));
        P.push(E([f ? 1 : -1, 33, 1], [4, 4.5, 4], glow('#ffb030')));
        P.push(E([0, 33, 2], [2.2, 2.2, 2.2], glow('#fff0b0')));
        o = { pitch: 0 }; break;
      }
      case 'smoke0': case 'smoke1': case 'smoke2': {
        const k = +name.slice(5);
        P.push(E([0, 32, 0], [3 + k * 1.5, 3 + k * 1.5, 3 + k * 1.5], hex(['#a0a0a0', '#808080', '#606060'][k])));
        o = { pitch: 0, outline: false }; break;
      }
      case 'boom0': case 'boom1': case 'boom2': {
        const k = +name.slice(4);
        P.push(E([0, 32, 0], [6 + k * 4, 6 + k * 4, 6 + k * 4], glow(['#fff0a0', '#ffa020', '#c04010'][k])));
        if (k < 2) P.push(E([0, 32, 4], [3 + k * 3, 3 + k * 3, 3 + k * 3], glow(['#ffffff', '#fff0a0'][k])));
        o = { pitch: 0 }; break;
      }
      default: P.push(E([0, 8, 0], [6, 8, 6], hex('#ff00ff')));
    }
    const SCALE = { puddle: 1.5, barrel: 1.45, woodbarrel: 1.45, tablechairs: 1.2, table: 1.35, stove: 1.4, plant: 1.5, vase: 1.6, bones: 1.6, skeleton: 1.4,
      bloodbones: 1.5, well: 1.35, bed: 1.25, clip: 1.9, food: 1.7, dogfood: 1.8, firstaid: 1.8, key1: 1.6, key2: 1.6, cross: 1.7, chalice: 1.7, chest: 1.6,
      crown: 1.8, oneup: 1.3, mg: 1.6, chain: 1.6 };
    if (SCALE[name]) o.scale = SCALE[name];
    return renderModel({ prims: P, marks: M }, o);
  }

  let STATIC_CACHE = null;
  const STATIC_NAMES = () => Object.keys(W.Data.DECOR).concat(Object.keys(W.Data.PICKUPS).filter(k => k !== 'gibs' && k !== 'clip2'), ['bloodbones', 'needle', 'rocket', 'fire0', 'fire1', 'smoke0', 'smoke1', 'smoke2', 'boom0', 'boom1', 'boom2']);
  function staticSprites() {
    if (STATIC_CACHE) return STATIC_CACHE;
    const out = {};
    for (const n of STATIC_NAMES()) if (!out[n]) out[n] = staticModel(n);
    out.gibs = out.bloodbones; out.clip2 = out.clip;
    STATIC_CACHE = out;
    return out;
  }

  function weaponModel(id, frame, view = 'fp') {
    const P = [], M = [];
    const skin = hex('#e0a47c'), sleeve = hex('#6c7c4c'), dark = hex('#34343c'), steel = { c: hex('#6a6e7a'), shine: true }, woodc = hex('#6a3c1c');
    const fp = view === 'fp';
    let kick = 0, push = 0, lift = 0, flash = false, spin = 0;
    if (id === 'knife') { push = [0, -2, 9, 3, -1][frame]; lift = [0, 2, -1, 0, 1][frame]; }
    else { kick = [0, 0.6, 1.6, 1.0, 0.3][frame]; flash = frame === 2 || (frame === 3 && id !== 'pistol'); spin = frame * 0.7; }
    const base0 = id === 'chain' ? [1.6, -11 + lift - kick * 0.4, -13.5 - push + kick * 0.8] : [3.2, -8.8 + lift - kick * 0.5, -12.5 - push + kick * 0.9];
    const base = [base0[0], base0[1], base0[2] * 2.7];
    const g = fp ? norm([id === 'chain' ? 0.14 : 0.12, -(kick * 0.06 + (id === 'knife' ? 0.3 : id === 'chain' ? 0.34 : 0.36)), 1]) : [0, 0, 1];
    const rotG = [Math.asin(-g[1]), Math.atan2(g[0], g[2]), 0], rotGrip = [rotG[0] + 0.32, rotG[1], 0];
    if (fp) {
      P.push(C(add(base, [3, -9, 9]), add(base, [1, -1.5, 3]), 3.8, sleeve));
      P.push(E(add(base, [0.4, -0.6, 1.2]), [2.9, 2.7, 3.3], skin));
      P.push(C(add(base, [-2.1, 0.5, 0.3]), add(base, [-2.6, 1.6, -1.6]), 1.0, skin));
      if (id !== 'knife') for (let i = 0; i < 3; i++) P.push(C(add(base, [-1.25, 0.4 - i * 0.95, -1.5]), add(base, [1.25, 0.4 - i * 0.95, -1.6]), 0.55, skin));
    }
    const at = (v, k) => add(base, add(v, mul(g, k)));
    let tip = null;
    if (id === 'knife') {
      P.push(Y(at([0, 0.5, 0], 2), at([0, 0.5, 0], -3), 1.6, hex('#3a2010')));
      P.push(X(at([0, 0.5, 0], -3.6), [3, 1, 0.5], { c: hex('#b0a070'), shine: true }, { rot: rotG }));
      P.push(X(at([0, 0.8, 0], -9.5), [0.5, 1.4, 6], { c: hex('#d8dce4'), shine: true }, { rot: rotG }));
      P.push(E(at([0, 0.8, 0], -15.2), [0.45, 1.2, 1.2], { c: hex('#d8dce4'), shine: true }));
    } else if (id === 'pistol') {
      P.push(X(at([0, 3.5, 0], -4.6), [1.0, 1.05, 6.4], steel, { rot: rotG }));
      P.push(X(at([0, 2.3, 0], -3.8), [0.92, 0.6, 5.2], dark, { rot: rotG }));
      P.push(X(at([0, 4.75, 0], 1.3), [0.95, 0.3, 0.45], dark, { rot: rotG }));
      P.push(X(at([0, 4.75, 0], -10.2), [0.22, 0.35, 0.4], dark, { rot: rotG }));
      P.push(Y(at([0, 3.4, 0], -10.9), at([0, 3.4, 0], -11.5), 0.55, hex('#0c0c10')));
      P.push(X(at([0, 0.8, 0], 0.5), [0.95, 2.6, 1.3], hex('#3c2a1c'), { rot: rotGrip }));
      for (let i = 0; i < 4; i++) for (const sx of [-1.02, 1.02]) M.push({ p: at([sx, 3.5, 0], 0.6 - i * 0.7), c: hex('#2a2c34') });
      M.push({ p: at([0, 4.56, 0], -4.6), c: hex('#a8acb8'), s: [1, 1] });
      tip = at([0, 3.4, 0], -11.5);
    } else if (id === 'mg') {
      P.push(Y(at([0, 3.6, 0], 6), at([0, 3.6, 0], -14), 1.7, steel));
      P.push(Y(at([0, 3.6, 0], -14), at([0, 3.6, 0], -21), 0.9, dark));
      P.push(X(at([0, -1.4, 0], -6), [0.9, 4, 1.3], dark, { rot: rotG }));
      P.push(X(at([0, 0.6, 0], 1), [1.1, 2.4, 1.4], dark, { rot: rotGrip }));
      P.push(Y(at([0, 4, 0], 6), at([0, 2.5, 0], 12), 0.7, dark));
      tip = at([0, 3.6, 0], -21);
    } else if (id === 'chain') {
      for (let i = 0; i < 6; i++) {
        const a = spin + i * Math.PI / 3, off = [Math.cos(a) * 2.1, 4.2 + Math.sin(a) * 2.1, 0];
        P.push(Y(at(off, -2), at(off, -21), 0.85, i % 2 ? { c: hex('#8a8e9a'), shine: true } : steel));
      }
      P.push(Y(at([0, 4.2, 0], -16), at([0, 4.2, 0], -17.2), 3.1, hex('#4a4e58')));
      P.push(Y(at([0, 4.2, 0], 3), at([0, 4.2, 0], -3), 3.0, { c: hex('#5a5e6a'), shine: true }));
      P.push(X(at([0, 8.2, 0], 0), [0.8, 1, 4], dark, { rot: rotG }));
      P.push(X(at([0, 0.6, 0], 1), [1.2, 2.4, 1.5], dark, { rot: rotGrip }));
      if (fp) {
        P.push(C(add(base, [-9, -10, 8]), add(base, [-4.5, 1.5, -5]), 3.6, sleeve));
        P.push(E(add(base, [-3.8, 2.6, -6.5]), [2.8, 2.5, 3.0], skin));
      }
      tip = at([0, 4.2, 0], -20);
    }
    if (flash && tip) {
      const k = id === 'chain' ? 0.6 : id === 'mg' ? 0.8 : 1;
      const f = add(tip, mul(g, -2.5));
      P.push(E(f, [2.2 * k, 2.2 * k, 2.2 * k], glow('#fffbe0')));
      P.push(E(add(f, mul(g, -1.5)), [4.2 * k, 4.2 * k, 2.5 * k], glow('#ffc030')));
      P.push(E(add(f, mul(g, -3)), [5.6 * k, 5.6 * k, 1.6 * k], glow('#ff8020')));
    }
    if (fp) return renderModel({ prims: P, marks: M }, { persp: 140, cx: 32, cy: 30, edge: 1.5 });
    const icon = { prims: P.filter(p => p.m !== skin && p.m !== sleeve), marks: [] };
    transformModel(icon, v => sub(v, base));
    return renderModel(icon, { w: 48, h: 24, yaw: Math.PI / 2, pitch: 0.12, scale: id === 'knife' ? 1.9 : id === 'pistol' ? 1.7 : 1.15, cx: id === 'knife' ? 14 : 22, cy: 13 });
  }

  let WEAPON_CACHE = null;
  function weaponSprites() {
    if (WEAPON_CACHE) return WEAPON_CACHE;
    const out = {};
    for (const id of ['knife', 'pistol', 'mg', 'chain']) {
      out[id] = [0, 1, 2, 3, 4].map(f => weaponModel(id, f));
      out[id + '_icon'] = weaponModel(id, 0, 'icon');
    }
    WEAPON_CACHE = out;
    return out;
  }

  function drawFace(level, look, mode) {
    const p = new Pic(24, 32);
    const pale = level >= 5 || mode === 'dead';
    let skin = hex(pale ? '#d4a088' : '#e2a476');
    if (mode === 'dead') skin = hex('#b8a8a0');
    const hair = hex('#e8c040'), hairD = hex('#b08a20'), dark = hex('#3a2010'), blood = hex('#b01010'), blood2 = hex('#e02020');
    const lx = look;
    p.rect(0, 0, 24, 32, hex('#000000'));
    p.rect(7, 26, 10, 6, shade(skin, 0.75));
    p.rect(3, 29, 18, 3, hex('#6c7c4c')); p.rect(3, 29, 18, 1, hex('#8a9a62'));
    p.ellipse(12 + lx * 0.5, 16, 7.6, 10.4, (x, y, dx) => shade(skin, dx > 0.5 ? 0.78 : dx < -0.55 ? 0.9 : 1));
    p.ellipse(4 + lx * 0.3, 16, 1.6, 2.6, shade(skin, 0.82)); p.ellipse(20 + lx * 0.3, 16, 1.6, 2.6, shade(skin, 0.72));
    if (mode === 'baby') {
      p.ellipse(12, 6, 10, 6.5, hex('#e0e0f8')); p.rect(2, 6, 20, 3, hex('#e0e0f8')); p.rect(2, 8, 20, 1, hex('#b0b0d0'));
    } else {
      p.rect(5 + lx, 2, 14, 5, hair); p.rect(5 + lx, 2, 14, 1, hex('#f8e080')); p.rect(5 + lx, 6, 14, 1, hairD);
      p.rect(4 + lx, 5, 2, 6, hairD); p.rect(18 + lx, 5, 2, 6, hairD);
    }
    const ex = 12 + lx;
    const browY = 11;
    if (mode === 'grin' || mode === 'angry') { p.line(ex - 6, browY - 1, ex - 2, browY + 1, hairD); p.line(ex + 6, browY - 1, ex + 2, browY + 1, hairD); }
    else if (mode === 'scared') { p.line(ex - 6, browY + 1, ex - 2, browY - 1, hairD); p.line(ex + 6, browY + 1, ex + 2, browY - 1, hairD); }
    else { p.rect(ex - 6, browY, 4, 1, hairD); p.rect(ex + 2, browY, 4, 1, hairD); }
    const eyeL = ex - 4, eyeR = ex + 4, ey = 13;
    const closedL = mode === 'dead' || level >= 4, closedR = mode === 'dead' || level >= 6;
    const eyeCol = mode === 'god' ? hex('#ffe040') : mode === 'angry' ? hex('#c02020') : hex('#2848a0');
    const eye = (x, closed) => {
      if (closed) { p.rect(x - 1, ey + 1, 3, 1, shade(skin, 0.55)); return; }
      p.rect(x - 1, ey, 3, 2, hex('#f0f0f0'));
      p.rect(x + Math.max(-1, Math.min(1, look)), ey, 1, 2, eyeCol);
      if (mode === 'god') p.rect(x - 1, ey, 3, 2, eyeCol);
    };
    eye(eyeL, closedL); eye(eyeR, closedR);
    p.rect(ex, 14, 1, 5, shade(skin, 0.8)); p.rect(ex - 1, 18, 3, 1, shade(skin, 0.7));
    const my = 22;
    if (mode === 'grin' || mode === 'baby') {
      p.rect(ex - 4, my - 1, 9, 3, dark); p.rect(ex - 3, my - 1, 7, 1, hex('#f0f0f0'));
      if (mode === 'baby') { p.ellipse(ex + 0.5, my + 0.5, 3, 2.5, hex('#f0a0c0')); p.rect(ex - 1, my, 3, 1, hex('#ffffff')); }
    } else if (mode === 'scared') { p.ellipse(ex + 0.5, my + 0.5, 2, 2, dark); p.set(ex + 6, 9, hex('#a0d0ff')); p.set(ex + 6, 10, hex('#a0d0ff')); }
    else if (level >= 5 || mode === 'dead') { p.rect(ex - 2, my - 1, 5, 3, dark); }
    else if (level >= 3) { p.rect(ex - 3, my, 7, 1, dark); p.set(ex - 3, my - 1, dark); p.set(ex + 3, my + 1, dark); }
    else p.rect(ex - 3, my, 7, 1, hex('#7a3020'));
    if (level >= 1) { p.set(ex + 5, 18, blood); p.set(ex + 6, 19, blood); }
    if (level >= 2) { p.ellipse(eyeL, 14, 2.5, 2, (x, y) => mix(p.get(x, y), hex('#7a3a7a'), 0.45)); }
    if (level >= 3) { for (let y = 3; y < 13; y++) p.set(ex - 2 + (y >> 2), y, y < 7 ? blood2 : blood); p.set(ex + 4, 24, blood); }
    if (level >= 4) { p.ellipse(eyeL, 13.5, 2.8, 2.2, (x, y) => mix(p.get(x, y), hex('#6a2a5a'), 0.55)); p.rect(ex - 1, my + 1, 1, 4, blood); }
    if (level >= 5) { for (let y = 2; y < 20; y++) p.set(ex + 3 + ((y * 3) % 2), y, blood2); p.rect(ex - 6, 18, 3, 2, blood); }
    if (level >= 6 || mode === 'dead') { p.rect(ex - 5, 4, 3, 10, blood); p.rect(ex + 5, 20, 2, 6, blood); for (let i = 0; i < 6; i++) p.set(ex - 6 + i * 2, 26 + (i & 1), blood); }
    if (mode === 'angry') { for (let y = 4; y < 12; y++) p.set(ex + 4, y, blood2); }
    return p;
  }

  let FACE_CACHE = null;
  function faces() {
    if (FACE_CACHE) return FACE_CACHE;
    const out = {};
    for (let l = 0; l < 7; l++) for (const lk of [-1, 0, 1]) out[`f${l}_${lk}`] = drawFace(l, lk, '');
    out.grin = drawFace(0, 0, 'grin');
    out.dead = drawFace(6, 0, 'dead');
    for (let l = 0; l < 7; l++) out['god' + l] = drawFace(Math.max(0, l - 3), 0, 'god');
    out.skill0 = drawFace(0, 0, 'baby'); out.skill1 = drawFace(1, 0, 'scared'); out.skill2 = drawFace(0, 0, 'grin'); out.skill3 = drawFace(3, 0, 'angry');
    FACE_CACHE = out;
    return out;
  }

  const DIGITS = [
    ['.####.', '##..##', '##..##', '##.###', '###.##', '##..##', '##..##', '.####.'],
    ['..##..', '.###..', '..##..', '..##..', '..##..', '..##..', '..##..', '.####.'],
    ['.####.', '##..##', '....##', '...##.', '..##..', '.##...', '##....', '######'],
    ['.####.', '##..##', '....##', '..###.', '....##', '....##', '##..##', '.####.'],
    ['...##.', '..###.', '.####.', '##.##.', '######', '...##.', '...##.', '...##.'],
    ['######', '##....', '#####.', '....##', '....##', '....##', '##..##', '.####.'],
    ['.####.', '##....', '##....', '#####.', '##..##', '##..##', '##..##', '.####.'],
    ['######', '....##', '...##.', '..##..', '.##...', '.##...', '.##...', '.##...'],
    ['.####.', '##..##', '##..##', '.####.', '##..##', '##..##', '##..##', '.####.'],
    ['.####.', '##..##', '##..##', '##..##', '.#####', '....##', '....##', '.####.']
  ];
  let DIGIT_CACHE = null;
  function digits() {
    if (DIGIT_CACHE) return DIGIT_CACHE;
    DIGIT_CACHE = DIGITS.map(rows => {
      const p = new Pic(8, 16);
      rows.forEach((row, y) => { for (let x = 0; x < 6; x++) if (row[x] === '#') { const c = y < 3 ? hex('#ffffff') : y < 6 ? hex('#e0e0e0') : hex('#b8b8b8'); p.set(x + 1, y * 2, c); p.set(x + 1, y * 2 + 1, shade(c, 0.85)); } });
      return p;
    });
    return DIGIT_CACHE;
  }

  function keyIcon(gold) {
    const p = new Pic(8, 16), c = gold ? hex('#e8b830') : hex('#c8d0d8'), d = shade(c, 0.6);
    p.ellipse(4, 4, 3.4, 3.4, c); p.ellipse(4, 4, 1.4, 1.4, 0);
    p.rect(3, 7, 2, 8, c); p.rect(5, 11, 2, 1, c); p.rect(5, 13, 2, 1, c); p.rect(4, 7, 1, 8, d);
    return p;
  }

  let MISC_CACHE = null;
  function misc() {
    if (MISC_CACHE) return MISC_CACHE;
    const out = { key1: keyIcon(true), key2: keyIcon(false) };
    const bosses = ['hans', 'schabbs', 'hitler', 'otto', 'gretel', 'fett'];
    bosses.forEach((b, i) => { out['ep' + (i + 1)] = bust(SPEC[b], { mouthOpen: b === 'hans' }, 40); });
    out.bjBust = [0, 1, 2, 3].map(k => bust(SPEC.bj, { headYaw: [0, 0.15, 0, -0.15][k] }, 72, Math.sin(k * Math.PI / 2) * 0.4));
    out.bjBig = bust(SPEC.bj, { headYaw: -0.2 }, 120);
    out.bjDead = bust(Object.assign({}, SPEC.bj, { skin: '#c0a090' }), { headPitch: 0.4, mouthOpen: true }, 72);
    MISC_CACHE = out;
    return out;
  }

  W.Gfx = { rgb, hex, shade, mix, rng, Pic, renderModel, humanoid, SPEC, buildTextures, actorSprites, staticSprites, weaponSprites, faces, digits, misc, eagle, R, G, B };
})(globalThis.Wolf3D = globalThis.Wolf3D || {});
