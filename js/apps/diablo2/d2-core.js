(function (D) {
  'use strict';
  const W = 800, H = 600;
  const HX = 32, HY = 16, ZS = 36;

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
  const smooth = t => t * t * (3 - 2 * t);

  function hash(n) {
    n = (n ^ 61) ^ (n >>> 16);
    n = (n + (n << 3)) | 0;
    n ^= n >>> 4;
    n = Math.imul(n, 0x27d4eb2d);
    n ^= n >>> 15;
    return n >>> 0;
  }

  function hash2(x, y, s) {
    return hash(Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 1, 1274126177)) / 4294967296;
  }

  function strHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  class RNG {
    constructor(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
    next() {
      let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
    range(a, b) { return a + this.next() * (b - a); }
    chance(p) { return this.next() < p; }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
      return arr;
    }
    weighted(list, wf) {
      let total = 0;
      for (const x of list) total += wf(x);
      if (total <= 0) return list[0];
      let r = this.next() * total;
      for (const x of list) { r -= wf(x); if (r <= 0) return x; }
      return list[list.length - 1];
    }
  }

  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = smooth(x - xi), fy = smooth(y - yi);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
  }

  function fbm(x, y, s, oct) {
    let v = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < (oct || 4); i++) { v += vnoise(x * f, y * f, s + i * 17) * amp; norm += amp; amp *= 0.5; f *= 2; }
    return v / norm;
  }

  function pnoise(x, y, p, s) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = smooth(x - xi), fy = smooth(y - yi);
    const m = v => ((v % p) + p) % p;
    const a = hash2(m(xi), m(yi), s), b = hash2(m(xi + 1), m(yi), s), c = hash2(m(xi), m(yi + 1), s), d = hash2(m(xi + 1), m(yi + 1), s);
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
  }

  function pfbm(x, y, p, s, oct) {
    let v = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < (oct || 4); i++) { v += pnoise(x * f, y * f, p * f, s + i * 31) * amp; norm += amp; amp *= 0.5; f *= 2; }
    return v / norm;
  }

  const toScreenX = (x, y) => (x - y) * HX;
  const toScreenY = (x, y, z) => (x + y) * HY - (z || 0) * ZS;
  const toWorld = (sx, sy) => ({ x: (sy / HY + sx / HX) / 2, y: (sy / HY - sx / HX) / 2 });

  function dir16(a) {
    const t = (a / (Math.PI * 2)) * 16;
    return ((Math.round(t) % 16) + 16) % 16;
  }

  function plural(n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }

  function rgb(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  function shade(hex, k) {
    const [r, g, b] = rgb(hex);
    const f = c => Math.round(clamp(k >= 0 ? c + (255 - c) * k : c * (1 + k), 0, 255));
    return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }

  function mix(h1, h2, t) {
    const a = rgb(h1), b = rgb(h2);
    const f = i => Math.round(lerp(a[i], b[i], t));
    return '#' + ((1 << 24) | (f(0) << 16) | (f(1) << 8) | f(2)).toString(16).slice(1);
  }

  const COL = {
    white: '#e0e0e0', gray: '#8a8a8a', blue: '#6c6cff', yellow: '#ffff64', green: '#18fc00', gold: '#c7b377',
    orange: '#ffa800', red: '#ff4d4d', dim: '#9a9a9a', dark: '#5c5c5c', tan: '#d8c39a', purple: '#b060ff'
  };

  const FONT = "'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif";
  const DIFFS = ['Норма', 'Кошмар', 'Ад'];
  const DIFF_KEYS = ['normal', 'nightmare', 'hell'];

  Object.assign(D, {
    W, H, HX, HY, ZS, clamp, lerp, dist, angleTo, smooth, hash, hash2, strHash, RNG, vnoise, fbm, pnoise, pfbm,
    toScreenX, toScreenY, toWorld, dir16, plural, rgb, shade, mix, COL, FONT, DIFFS, DIFF_KEYS
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
