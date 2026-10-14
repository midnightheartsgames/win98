(function (G) {
  'use strict';
  const T = 32;
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const BIT = [1, 2, 4, 8];
  const OPP = [2, 3, 0, 1];
  const DIR_ANGLE = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const dist2 = (ax, ay, bx, by) => (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
  const wrapAngle = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
  const approach = (v, target, step) => v < target ? Math.min(target, v + step) : Math.max(target, v - step);

  function hash2(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  class RNG {
    constructor(seed) { this.s = (seed >>> 0) || 1; }
    next() {
      let t = (this.s = (this.s + 0x6D2B79F5) >>> 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(a, b) { return a + (b - a) * this.next(); }
    int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
  }

  class Heap {
    constructor() { this.k = []; this.v = []; }
    get size() { return this.k.length; }
    push(key, val) {
      const k = this.k, v = this.v;
      let i = k.length;
      k.push(key); v.push(val);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (k[p] <= key) break;
        k[i] = k[p]; v[i] = v[p]; i = p;
      }
      k[i] = key; v[i] = val;
    }
    pop() {
      const k = this.k, v = this.v;
      const top = v[0];
      const lk = k.pop(), lv = v.pop();
      const n = k.length;
      if (n) {
        let i = 0;
        for (;;) {
          let c = i * 2 + 1;
          if (c >= n) break;
          if (c + 1 < n && k[c + 1] < k[c]) c++;
          if (k[c] >= lk) break;
          k[i] = k[c]; v[i] = v[c]; i = c;
        }
        k[i] = lk; v[i] = lv;
      }
      return top;
    }
  }

  class SpatialHash {
    constructor(cell) { this.cell = cell; this.map = new Map(); this.stamp = 1; this.marks = []; }
    key(cx, cy) { return cx * 65536 + cy; }
    insert(id, x0, y0, x1, y1) {
      const c = this.cell;
      for (let cy = Math.floor(y0 / c); cy <= Math.floor(y1 / c); cy++) for (let cx = Math.floor(x0 / c); cx <= Math.floor(x1 / c); cx++) {
        const k = this.key(cx, cy);
        let a = this.map.get(k);
        if (!a) { a = []; this.map.set(k, a); }
        a.push(id);
      }
      if (id >= this.marks.length) this.marks.length = id + 1;
    }
    query(x0, y0, x1, y1, out) {
      const res = out || [];
      res.length = 0;
      const c = this.cell, st = ++this.stamp, mk = this.marks;
      for (let cy = Math.floor(y0 / c); cy <= Math.floor(y1 / c); cy++) for (let cx = Math.floor(x0 / c); cx <= Math.floor(x1 / c); cx++) {
        const a = this.map.get(this.key(cx, cy));
        if (!a) continue;
        for (const id of a) if (mk[id] !== st) { mk[id] = st; res.push(id); }
      }
      return res;
    }
  }

  const fmtMoney = n => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const fmtTime = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const l = dx * dx + dy * dy;
    const t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }
  function segT(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const l = dx * dx + dy * dy;
    return l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
  }

  function decodePts(str) {
    const parts = str.split(',');
    const out = new Float32Array(parts.length);
    let x = 0, y = 0;
    for (let i = 0; i + 1 < parts.length; i += 2) {
      x += parseInt(parts[i], 36); y += parseInt(parts[i + 1], 36);
      out[i] = x; out[i + 1] = y;
    }
    return out;
  }

  function ringArea(r) {
    let a = 0;
    const n = r.length;
    for (let i = 0; i < n; i += 2) { const j = (i + 2) % n; a += r[i] * r[j + 1] - r[j] * r[i + 1]; }
    return a / 2;
  }
  function inRing(x, y, r) {
    let inside = false;
    const n = r.length;
    for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
      const yi = r[i + 1], yj = r[j + 1];
      if ((yi > y) !== (yj > y) && x < (r[j] - r[i]) * (y - yi) / (yj - yi) + r[i]) inside = !inside;
    }
    return inside;
  }
  function inRings(x, y, rings) {
    let inside = false;
    for (const r of rings) if (inRing(x, y, r)) inside = !inside;
    return inside;
  }
  function ringBox(r, out) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < r.length; i += 2) { const x = r[i], y = r[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const o = out || [0, 0, 0, 0];
    o[0] = x0; o[1] = y0; o[2] = x1; o[3] = y1;
    return o;
  }
  function lineLen(p) { let l = 0; for (let i = 2; i < p.length; i += 2) l += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]); return l; }
  function cumLen(p) {
    const n = p.length / 2;
    const c = new Float32Array(n);
    for (let i = 1; i < n; i++) c[i] = c[i - 1] + Math.hypot(p[i * 2] - p[i * 2 - 2], p[i * 2 + 1] - p[i * 2 - 1]);
    return c;
  }
  function pointAt(p, cum, s, out) {
    const n = cum.length;
    const o = out || [0, 0, 0];
    if (s <= 0 || n < 2) { const dx = p[2] - p[0], dy = p[3] - p[1]; o[0] = p[0] + (s < 0 ? dx / (cum[1] || 1) * s : 0); o[1] = p[1] + (s < 0 ? dy / (cum[1] || 1) * s : 0); o[2] = Math.atan2(dy, dx); return o; }
    if (s >= cum[n - 1]) {
      const dx = p[n * 2 - 2] - p[n * 2 - 4], dy = p[n * 2 - 1] - p[n * 2 - 3], l = Math.hypot(dx, dy) || 1, e = s - cum[n - 1];
      o[0] = p[n * 2 - 2] + dx / l * e; o[1] = p[n * 2 - 1] + dy / l * e; o[2] = Math.atan2(dy, dx); return o;
    }
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
    const seg = cum[hi] - cum[lo] || 1, t = (s - cum[lo]) / seg;
    const ax = p[lo * 2], ay = p[lo * 2 + 1], bx = p[hi * 2], by = p[hi * 2 + 1];
    o[0] = ax + (bx - ax) * t; o[1] = ay + (by - ay) * t; o[2] = Math.atan2(by - ay, bx - ax);
    return o;
  }
  function projectOn(p, cum, x, y, s0, s1) {
    const n = cum.length;
    let best = Infinity, bs = 0, bd = 0;
    let i0 = 0, i1 = n - 1;
    if (s0 != null) {
      let lo = 0, hi = n - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s0) lo = m; else hi = m; }
      i0 = lo;
      lo = 0; hi = n - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s1) lo = m; else hi = m; }
      i1 = Math.min(n - 1, hi);
    }
    for (let i = i0; i < i1; i++) {
      const ax = p[i * 2], ay = p[i * 2 + 1], bx = p[i * 2 + 2], by = p[i * 2 + 3];
      const t = segT(x, y, ax, ay, bx, by);
      const qx = ax + (bx - ax) * t, qy = ay + (by - ay) * t;
      const d = (x - qx) * (x - qx) + (y - qy) * (y - qy);
      if (d < best) { best = d; bs = cum[i] + (cum[i + 1] - cum[i]) * t; bd = (bx - ax) * (y - ay) - (by - ay) * (x - ax); }
    }
    return [bs, Math.sqrt(best), bd];
  }
  function offsetLine(p, off) {
    const n = p.length / 2;
    const out = new Float32Array(p.length);
    for (let i = 0; i < n; i++) {
      let nx = 0, ny = 0;
      if (i > 0) { const dx = p[i * 2] - p[i * 2 - 2], dy = p[i * 2 + 1] - p[i * 2 - 1], l = Math.hypot(dx, dy) || 1; nx += -dy / l; ny += dx / l; }
      if (i < n - 1) { const dx = p[i * 2 + 2] - p[i * 2], dy = p[i * 2 + 3] - p[i * 2 + 1], l = Math.hypot(dx, dy) || 1; nx += -dy / l; ny += dx / l; }
      const l = Math.hypot(nx, ny) || 1;
      nx /= l; ny /= l;
      let k = 1;
      if (i > 0 && i < n - 1) { const dx = p[i * 2 + 2] - p[i * 2], dy = p[i * 2 + 3] - p[i * 2 + 1], ll = Math.hypot(dx, dy) || 1; const c = (-dy / ll) * nx + (dx / ll) * ny; k = 1 / Math.max(0.5, c); }
      out[i * 2] = p[i * 2] + nx * off * k; out[i * 2 + 1] = p[i * 2 + 1] + ny * off * k;
    }
    return out;
  }
  function subLine(p, cum, s0, s1) {
    const out = [];
    const a = pointAt(p, cum, s0);
    out.push(a[0], a[1]);
    for (let i = 0; i < cum.length; i++) if (cum[i] > s0 + 0.5 && cum[i] < s1 - 0.5) out.push(p[i * 2], p[i * 2 + 1]);
    const b = pointAt(p, cum, s1);
    out.push(b[0], b[1]);
    return new Float32Array(out);
  }
  function reverseLine(p) {
    const n = p.length / 2;
    const out = new Float32Array(p.length);
    for (let i = 0; i < n; i++) { out[i * 2] = p[(n - 1 - i) * 2]; out[i * 2 + 1] = p[(n - 1 - i) * 2 + 1]; }
    return out;
  }

  function genderize(text, fem) {
    return String(text).replace(/\{([^|{}]*)\|([^|{}]*)\}/g, (m, a, b) => fem ? b : a);
  }

  Object.assign(G, { T, DX, DY, BIT, OPP, DIR_ANGLE, clamp, lerp, dist, dist2, wrapAngle, angleTo, approach, hash2, RNG, Heap, SpatialHash, fmtMoney, fmtTime, segDist, segT, genderize, decodePts, ringArea, inRing, inRings, ringBox, lineLen, cumLen, pointAt, projectOn, offsetLine, subLine, reverseLine });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
