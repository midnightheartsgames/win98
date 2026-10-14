(function (P) {
  'use strict';
  const W = 800, H = 600;
  const HUD_TOP = 44, HUD_BOTTOM = 540;
  const FLOOR = { x0: 16, x1: 784, y0: 212, y1: 532 };
  const USE_Y = 226;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
  const easeOutBack = t => { const c = 1.70158; const u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
  const easeOutQuad = t => 1 - (1 - t) * (1 - t);
  const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function hash(str) {
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h;
  }

  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }

  function weighted(r, weights) {
    const keys = Object.keys(weights).filter(k => weights[k] > 0);
    const total = keys.reduce((s, k) => s + weights[k], 0);
    let x = r() * total;
    for (const k of keys) { x -= weights[k]; if (x <= 0) return k; }
    return keys[keys.length - 1];
  }

  function money(n) {
    const v = Math.round(n);
    const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (v < 0 ? '−' : '') + s;
  }

  function plural(n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }

  function inRect(x, y, r) { return x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h; }

  Object.assign(P, { W, H, HUD_TOP, HUD_BOTTOM, FLOOR, USE_Y, clamp, lerp, dist, approach, easeOutBack, easeOutQuad, easeInOut, hash, rng, pick, weighted, money, plural, inRect });
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(globalThis.Plov = globalThis.Plov || {});
