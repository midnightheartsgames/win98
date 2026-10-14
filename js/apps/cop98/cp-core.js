(function (C) {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const TAU = Math.PI * 2;
  const wrapAngle = a => { a %= TAU; if (a > Math.PI) a -= TAU; else if (a < -Math.PI) a += TAU; return a; };
  const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
  const dist = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);

  function makeRandom(seed) {
    let state = (seed >>> 0) || 0x9e3779b9;
    const next = () => {
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.range = (a, b) => a + (b - a) * next();
    next.int = n => Math.floor(next() * n);
    next.pick = list => list[Math.floor(next() * list.length)];
    next.chance = p => next() < p;
    next.state = () => state;
    next.setState = s => { state = s | 0; };
    return next;
  }

  function hashInt(x, y, seed) {
    let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul((seed | 0) + 0x3c6ef372, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
  }
  const hash01 = (x, y, seed) => hashInt(x, y, seed) / 4294967296;

  function valueNoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash01(xi, yi, seed), b = hash01(xi + 1, yi, seed), c = hash01(xi, yi + 1, seed), d = hash01(xi + 1, yi + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, seed, octaves = 4, gain = 0.5) {
    let sum = 0, amp = 1, freq = 1, norm = 0;
    for (let i = 0; i < octaves; i++) { sum += amp * valueNoise(x * freq, y * freq, seed + i * 131); norm += amp; amp *= gain; freq *= 2.07; }
    return sum / norm;
  }
  function ridged(x, y, seed, octaves = 4) {
    let sum = 0, amp = 1, freq = 1, norm = 0;
    for (let i = 0; i < octaves; i++) { const n = 1 - Math.abs(valueNoise(x * freq, y * freq, seed + i * 71) * 2 - 1); sum += amp * n * n; norm += amp; amp *= 0.5; freq *= 2.11; }
    return sum / norm;
  }

  const rgb = (r, g, b) => (0xff000000 | (clamp(b | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(r | 0, 0, 255)) >>> 0;
  const red = c => c & 255, green = c => (c >>> 8) & 255, blue = c => (c >>> 16) & 255, alpha = c => c >>> 24;
  const hex = h => rgb((h >> 16) & 255, (h >> 8) & 255, h & 255);
  const mixColor = (a, b, t) => rgb(lerp(red(a), red(b), t), lerp(green(a), green(b), t), lerp(blue(a), blue(b), t));
  const scaleColor = (c, k) => rgb(red(c) * k, green(c) * k, blue(c) * k);
  const cssColor = c => `rgb(${red(c)},${green(c)},${blue(c)})`;

  function segmentDistance(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    const t = l2 > 0 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
    return { d: Math.hypot(px - ax - dx * t, py - ay - dy * t), t };
  }
  function polylineDistance(px, py, pts) {
    let best = Infinity, along = 0, total = 0, bestAlong = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const s = segmentDistance(px, py, a[0], a[1], b[0], b[1]);
      if (s.d < best) { best = s.d; bestAlong = total + s.t * len; }
      total += len;
    }
    along = bestAlong;
    return { d: best, along, total };
  }
  function pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  class MinHeap {
    constructor() { this.keys = []; this.vals = []; }
    get size() { return this.keys.length; }
    push(val, key) {
      const k = this.keys, v = this.vals; let i = k.length; k.push(key); v.push(val);
      while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; }
      k[i] = key; v[i] = val;
    }
    pop() {
      const k = this.keys, v = this.vals, top = v[0], lastK = k.pop(), lastV = v.pop(), n = k.length;
      if (n > 0) {
        let i = 0;
        for (;;) { let c = i * 2 + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= lastK) break; k[i] = k[c]; v[i] = v[c]; i = c; }
        k[i] = lastK; v[i] = lastV;
      }
      return top;
    }
  }

  const Mat = {
    identity() { return [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]; },
    fromEuler(rx, ry, rz, tx = 0, ty = 0, tz = 0) {
      const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
      return [
        cz * cy, sz * cy, -sy,
        cz * sy * sx - sz * cx, sz * sy * sx + cz * cx, cy * sx,
        cz * sy * cx + sz * sx, sz * sy * cx - cz * sx, cy * cx,
        tx, ty, tz
      ];
    },
    mul(a, b) {
      const o = new Array(12);
      for (let c = 0; c < 3; c++) {
        const bx = b[c * 3], by = b[c * 3 + 1], bz = b[c * 3 + 2];
        o[c * 3] = a[0] * bx + a[3] * by + a[6] * bz;
        o[c * 3 + 1] = a[1] * bx + a[4] * by + a[7] * bz;
        o[c * 3 + 2] = a[2] * bx + a[5] * by + a[8] * bz;
      }
      const tx = b[9], ty = b[10], tz = b[11];
      o[9] = a[0] * tx + a[3] * ty + a[6] * tz + a[9];
      o[10] = a[1] * tx + a[4] * ty + a[7] * tz + a[10];
      o[11] = a[2] * tx + a[5] * ty + a[8] * tz + a[11];
      return o;
    },
    apply(m, x, y, z) { return [m[0] * x + m[3] * y + m[6] * z + m[9], m[1] * x + m[4] * y + m[7] * z + m[10], m[2] * x + m[5] * y + m[8] * z + m[11]]; },
    rotate(m, x, y, z) { return [m[0] * x + m[3] * y + m[6] * z, m[1] * x + m[4] * y + m[7] * z, m[2] * x + m[5] * y + m[8] * z]; },
    invert(m) {
      const r = [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8], 0, 0, 0];
      const tx = m[9], ty = m[10], tz = m[11];
      r[9] = -(r[0] * tx + r[3] * ty + r[6] * tz);
      r[10] = -(r[1] * tx + r[4] * ty + r[7] * tz);
      r[11] = -(r[2] * tx + r[5] * ty + r[8] * tz);
      return r;
    }
  };

  function formatMoney(v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' RU'; }
  function formatClock(minutes) {
    const m = ((Math.floor(minutes) % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  Object.assign(C, {
    clamp, lerp, smoothstep, TAU, wrapAngle, angleTo, dist, makeRandom, hashInt, hash01, valueNoise, fbm, ridged,
    rgb, red, green, blue, alpha, hex, mixColor, scaleColor, cssColor, segmentDistance, polylineDistance, pointInPolygon,
    MinHeap, Mat, formatMoney, formatClock
  });
  if (typeof module !== 'undefined') module.exports = C;
})(globalThis.Cop98 = globalThis.Cop98 || {});
