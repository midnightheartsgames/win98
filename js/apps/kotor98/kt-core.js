(function (K) {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, az, bx, bz) => Math.hypot(bx - ax, bz - az);
  const wrapAngle = a => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };

  class RNG {
    constructor(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
    next() {
      this.s = (this.s + 0x6D2B79F5) | 0;
      let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
    d(n, sides) { let s = 0; for (let i = 0; i < n; i++) s += 1 + Math.floor(this.next() * sides); return s; }
    d20() { return this.int(1, 20); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    }
  }

  class Heap {
    constructor() { this.a = []; }
    get size() { return this.a.length; }
    push(item, pri) {
      const a = this.a;
      a.push([pri, item]);
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (a[p][0] <= a[i][0]) break;
        const t = a[p]; a[p] = a[i]; a[i] = t; i = p;
      }
    }
    pop() {
      const a = this.a;
      const top = a[0];
      const last = a.pop();
      if (a.length) {
        a[0] = last;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let m = i;
          if (l < a.length && a[l][0] < a[m][0]) m = l;
          if (r < a.length && a[r][0] < a[m][0]) m = r;
          if (m === i) break;
          const t = a[m]; a[m] = a[i]; a[i] = t; i = m;
        }
      }
      return top[1];
    }
  }

  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];

  function nearestWalkable(w, h, walk, tx, tz, maxR) {
    tx = clamp(Math.floor(tx), 0, w - 1);
    tz = clamp(Math.floor(tz), 0, h - 1);
    if (walk(tx, tz)) return [tx, tz];
    for (let r = 1; r <= (maxR || 4); r++) {
      let best = null, bd = 1e9;
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const x = tx + dx, z = tz + dz;
          if (x < 0 || z < 0 || x >= w || z >= h || !walk(x, z)) continue;
          const d = dx * dx + dz * dz;
          if (d < bd) { bd = d; best = [x, z]; }
        }
      }
      if (best) return best;
    }
    return null;
  }

  function findPath(w, h, walk, sx, sz, tx, tz, maxNodes) {
    sx = Math.floor(sx); sz = Math.floor(sz);
    const goal = nearestWalkable(w, h, walk, tx, tz, 5);
    if (!goal) return null;
    const gx = goal[0], gz = goal[1];
    if (!walk(sx, sz)) {
      const s = nearestWalkable(w, h, walk, sx, sz, 2);
      if (!s) return null;
      sx = s[0]; sz = s[1];
    }
    const start = sz * w + sx, target = gz * w + gx;
    if (start === target) return [[gx + 0.5, gz + 0.5]];
    const g = new Map([[start, 0]]);
    const from = new Map();
    const closed = new Set();
    const heap = new Heap();
    const hfn = (x, z) => { const dx = Math.abs(x - gx), dz = Math.abs(z - gz); return Math.max(dx, dz) + 0.4142 * Math.min(dx, dz); };
    heap.push(start, hfn(sx, sz));
    let n = 0;
    const limit = maxNodes || 6000;
    while (heap.size) {
      const cur = heap.pop();
      if (cur === target) break;
      if (closed.has(cur)) continue;
      closed.add(cur);
      if (++n > limit) return null;
      const cx = cur % w, cz = (cur - cx) / w;
      const cg = g.get(cur);
      for (const [dx, dz, c] of DIRS) {
        const nx = cx + dx, nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= w || nz >= h || !walk(nx, nz)) continue;
        if (dx && dz && (!walk(cx + dx, cz) || !walk(cx, cz + dz))) continue;
        const ni = nz * w + nx;
        const ng = cg + c;
        if (ng < (g.has(ni) ? g.get(ni) : 1e9)) {
          g.set(ni, ng);
          from.set(ni, cur);
          heap.push(ni, ng + hfn(nx, nz));
        }
      }
    }
    if (!from.has(target)) return null;
    const out = [];
    let c = target;
    while (c !== start) {
      const x = c % w;
      out.push([x + 0.5, (c - x) / w + 0.5]);
      c = from.get(c);
    }
    out.reverse();
    return out;
  }

  function lineClear(test, x0, z0, x1, z1, step) {
    const d = dist(x0, z0, x1, z1);
    const n = Math.max(1, Math.ceil(d / (step || 0.2)));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (!test(Math.floor(lerp(x0, x1, t)), Math.floor(lerp(z0, z1, t)))) return false;
    }
    return true;
  }

  function walkLineClear(walk, x0, z0, x1, z1, r) {
    const d = dist(x0, z0, x1, z1);
    if (d < 1e-4) return true;
    const nx = -(z1 - z0) / d * r, nz = (x1 - x0) / d * r;
    return lineClear(walk, x0, z0, x1, z1, 0.2) && lineClear(walk, x0 + nx, z0 + nz, x1 + nx, z1 + nz, 0.2) && lineClear(walk, x0 - nx, z0 - nz, x1 - nx, z1 - nz, 0.2);
  }

  function smoothPath(walk, sx, sz, path, r) {
    if (!path || path.length < 2) return path;
    const out = [];
    let cx = sx, cz = sz, i = 0;
    while (i < path.length) {
      let j = path.length - 1;
      while (j > i && !walkLineClear(walk, cx, cz, path[j][0], path[j][1], r)) j--;
      out.push(path[j]);
      cx = path[j][0]; cz = path[j][1];
      i = j + 1;
    }
    return out;
  }

  const mod = v => Math.floor((v - 10) / 2);
  const xpForLevel = n => Math.round(500 * n * (n - 1) / 2 * (1 + Math.max(0, n - 5) * 0.3));
  const levelForXp = xp => { let l = 1; while (l < 20 && xp >= xpForLevel(l + 1)) l++; return l; };
  const fmtSigned = v => (v >= 0 ? '+' : '') + v;

  Object.assign(K, { clamp, lerp, dist, wrapAngle, RNG, Heap, findPath, nearestWalkable, lineClear, walkLineClear, smoothPath, mod, xpForLevel, levelForXp, fmtSigned });
  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
