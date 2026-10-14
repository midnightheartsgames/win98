(function (D) {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, az, bx, bz) => Math.hypot(bx - ax, bz - az);
  const TAU = Math.PI * 2;
  const wrapAngle = a => {
    a %= TAU;
    if (a > Math.PI) a -= TAU;
    if (a < -Math.PI) a += TAU;
    return a;
  };
  const angleTo = (ax, az, bx, bz) => Math.atan2(bx - ax, bz - az);
  const turnToward = (cur, want, maxStep) => {
    const d = wrapAngle(want - cur);
    return Math.abs(d) <= maxStep ? want : cur + Math.sign(d) * maxStep;
  };

  class RNG {
    constructor(seed) { this.s = (seed >>> 0) || 0x2545f491; }
    next() {
      this.s = (this.s + 0x6d2b79f5) | 0;
      let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
    range(a, b) { return a + this.next() * (b - a); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
  }

  const hash2 = (x, z, s) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + Math.imul(s | 0, 2147483647)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const smooth = t => t * t * (3 - 2 * t);
  const valueNoise = (x, z, s) => {
    const xi = Math.floor(x), zi = Math.floor(z), fx = smooth(x - xi), fz = smooth(z - zi);
    const a = hash2(xi, zi, s), b = hash2(xi + 1, zi, s), c = hash2(xi, zi + 1, s), d = hash2(xi + 1, zi + 1, s);
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
  };
  const fbm = (x, z, s, oct) => {
    let v = 0, amp = 0.5, f = 1, tot = 0;
    for (let i = 0; i < (oct || 4); i++) { v += valueNoise(x * f, z * f, s + i * 17) * amp; tot += amp; amp *= 0.5; f *= 2; }
    return v / tot;
  };

  class Heap {
    constructor() { this.k = []; this.v = []; }
    get size() { return this.k.length; }
    push(v, k) {
      const K = this.k, V = this.v;
      let i = K.length;
      K.push(k); V.push(v);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (K[p] <= k) break;
        K[i] = K[p]; V[i] = V[p]; i = p;
      }
      K[i] = k; V[i] = v;
    }
    pop() {
      const K = this.k, V = this.v, top = V[0];
      const lk = K.pop(), lv = V.pop();
      if (K.length) {
        let i = 0;
        const n = K.length;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let m = i, mk = lk;
          if (l < n && K[l] < mk) { m = l; mk = K[l]; }
          if (r < n && K[r] < mk) { m = r; mk = K[r]; }
          if (m === i) break;
          K[i] = K[m]; V[i] = V[m]; i = m;
        }
        K[i] = lk; V[i] = lv;
      }
      return top;
    }
  }

  class Nav {
    constructor(w, h) {
      this.w = w; this.h = h;
      this.walk = new Uint8Array(w * h);
      this.opaque = new Uint8Array(w * h);
      this.block = new Uint8Array(w * h);
      this.small = new Uint8Array(w * h);
      this.slow = new Uint8Array(w * h);
      this.hv = new Float32Array((w + 1) * (h + 1));
    }
    inside(cx, cz) { return cx >= 0 && cz >= 0 && cx < this.w && cz < this.h; }
    ok(cx, cz, small) {
      if (!this.inside(cx, cz)) return false;
      const i = cz * this.w + cx;
      if (this.block[i]) return false;
      return this.walk[i] === 1 || (small && this.small[i] === 1);
    }
    okAt(x, z, small) { return this.ok(Math.floor(x), Math.floor(z), small); }
    seeThrough(cx, cz) { return this.inside(cx, cz) && !this.opaque[cz * this.w + cx]; }
    corner(cx, cz) {
      cx = clamp(cx, 0, this.w); cz = clamp(cz, 0, this.h);
      return this.hv[cz * (this.w + 1) + cx];
    }
    heightAt(x, z) {
      const cx = clamp(Math.floor(x), 0, this.w - 1), cz = clamp(Math.floor(z), 0, this.h - 1);
      const fx = clamp(x - cx, 0, 1), fz = clamp(z - cz, 0, 1);
      const a = this.corner(cx, cz), b = this.corner(cx + 1, cz), c = this.corner(cx, cz + 1), d = this.corner(cx + 1, cz + 1);
      return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
    }
  }

  const cellsOnLine = (ax, az, bx, bz, fn) => {
    let cx = Math.floor(ax), cz = Math.floor(az);
    const ex = Math.floor(bx), ez = Math.floor(bz);
    const dx = bx - ax, dz = bz - az;
    const sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
    const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity, tdz = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    let tmx = dx !== 0 ? (dx > 0 ? cx + 1 - ax : ax - cx) * tdx : Infinity;
    let tmz = dz !== 0 ? (dz > 0 ? cz + 1 - az : az - cz) * tdz : Infinity;
    let guard = 0;
    if (fn(cx, cz) === false) return false;
    while ((cx !== ex || cz !== ez) && guard++ < 4096) {
      if (Math.abs(tmx - tmz) < 1e-9) {
        if (tmx > 1) break;
        if (fn(cx + sx, cz) === false || fn(cx, cz + sz) === false) return false;
        tmx += tdx; tmz += tdz; cx += sx; cz += sz;
      } else if (tmx < tmz) {
        if (tmx > 1) break;
        tmx += tdx; cx += sx;
      } else {
        if (tmz > 1) break;
        tmz += tdz; cz += sz;
      }
      if (fn(cx, cz) === false) return false;
    }
    return true;
  };

  const walkLine = (nav, ax, az, bx, bz, small) => {
    const nx = bz - az, nz = -(bx - ax), len = Math.hypot(nx, nz) || 1;
    const ox = (nx / len) * 0.3, oz = (nz / len) * 0.3;
    const test = (cx, cz) => nav.ok(cx, cz, small);
    return cellsOnLine(ax + ox, az + oz, bx + ox, bz + oz, test) && cellsOnLine(ax - ox, az - oz, bx - ox, bz - oz, test);
  };
  const sightLine = (nav, ax, az, bx, bz) => cellsOnLine(ax, az, bx, bz, (cx, cz) => nav.seeThrough(cx, cz));

  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];

  const nearestWalkable = (nav, x, z, maxR, small) => {
    const cx = Math.floor(x), cz = Math.floor(z);
    if (nav.ok(cx, cz, small)) return [cx + 0.5, cz + 0.5];
    for (let r = 1; r <= (maxR || 12); r++) {
      let best = null, bd = Infinity;
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (!nav.ok(cx + dx, cz + dz, small)) continue;
        const d = dist(x, z, cx + dx + 0.5, cz + dz + 0.5);
        if (d < bd) { bd = d; best = [cx + dx + 0.5, cz + dz + 0.5]; }
      }
      if (best) return best;
    }
    return null;
  };

  const findPath = (nav, sx, sz, tx, tz, opt) => {
    const small = opt && opt.small;
    const w = nav.w, h = nav.h;
    const start = nearestWalkable(nav, sx, sz, 3, small);
    const goal = nearestWalkable(nav, tx, tz, (opt && opt.reach) || 6, small);
    if (!start || !goal) return null;
    const s = Math.floor(start[1]) * w + Math.floor(start[0]);
    const gcx = Math.floor(goal[0]), gcz = Math.floor(goal[1]), gi = gcz * w + gcx;
    if (s === gi) return [nav.okAt(tx, tz, small) ? [tx, tz] : goal];
    const g = new Float32Array(w * h).fill(Infinity);
    const from = new Int32Array(w * h).fill(-1);
    const closed = new Uint8Array(w * h);
    const heap = new Heap();
    g[s] = 0;
    heap.push(s, 0);
    const limit = (opt && opt.limit) || 40000;
    let found = false, n = 0, bestI = s, bestH = Infinity;
    while (heap.size && n++ < limit) {
      const i = heap.pop();
      if (closed[i]) continue;
      closed[i] = 1;
      if (i === gi) { found = true; break; }
      const cx = i % w, cz = (i / w) | 0;
      const hh = Math.abs(cx - gcx) + Math.abs(cz - gcz);
      if (hh < bestH) { bestH = hh; bestI = i; }
      for (const [dx, dz, c] of DIRS) {
        const nx = cx + dx, nz = cz + dz;
        if (!nav.ok(nx, nz, small)) continue;
        if (dx && dz && (!nav.ok(cx + dx, cz, small) || !nav.ok(cx, cz + dz, small))) continue;
        const ni = nz * w + nx;
        if (closed[ni]) continue;
        const ng = g[i] + c * (nav.slow[ni] ? 2.2 : 1);
        if (ng < g[ni]) {
          g[ni] = ng; from[ni] = i;
          const ddx = Math.abs(nx - gcx), ddz = Math.abs(nz - gcz);
          heap.push(ni, ng + Math.max(ddx, ddz) + 0.4142 * Math.min(ddx, ddz));
        }
      }
    }
    let end = found ? gi : ((opt && opt.partial) ? bestI : -1);
    if (end < 0) return null;
    const cells = [];
    for (let i = end; i !== -1 && i !== s; i = from[i]) cells.push(i);
    cells.reverse();
    const pts = cells.map(i => [(i % w) + 0.5, ((i / w) | 0) + 0.5]);
    if (found) pts[pts.length - 1] = nav.okAt(tx, tz, small) ? [tx, tz] : goal;
    const out = [];
    let ax = sx, az = sz, k = 0;
    while (k < pts.length) {
      let j = pts.length - 1;
      while (j > k && !walkLine(nav, ax, az, pts[j][0], pts[j][1], small)) j--;
      out.push(pts[j]);
      ax = pts[j][0]; az = pts[j][1];
      k = j + 1;
    }
    return out;
  };

  const COPPER_PER_SILVER = 100, COPPER_PER_GOLD = 10000;
  const coins = c => {
    c = Math.max(0, Math.floor(c));
    return { g: Math.floor(c / COPPER_PER_GOLD), s: Math.floor((c % COPPER_PER_GOLD) / COPPER_PER_SILVER), c: c % COPPER_PER_SILVER };
  };
  const fmtMoney = c => {
    const m = coins(c);
    const parts = [];
    if (m.g) parts.push(m.g + ' з');
    if (m.s || m.g) parts.push(m.s + ' с');
    parts.push(m.c + ' м');
    return parts.join(' ');
  };

  const XP_TABLE = [0, 0, 1000, 2400, 4200, 6400, 9000, 12000, 15500, 19500, 24000, 29000, 35000];
  const xpForLevel = l => l < XP_TABLE.length ? XP_TABLE[l] : XP_TABLE[XP_TABLE.length - 1] + (l - XP_TABLE.length + 1) * 8000;
  const levelForXp = xp => { let l = 1; while (xpForLevel(l + 1) <= xp) l++; return l; };

  const uid = (() => { let n = 1; return () => n++; })();

  Object.assign(D, {
    clamp, lerp, dist, wrapAngle, angleTo, turnToward, TAU, RNG, hash2, valueNoise, fbm, Heap, Nav,
    cellsOnLine, walkLine, sightLine, nearestWalkable, findPath, coins, fmtMoney, xpForLevel, levelForXp, uid,
    COPPER_PER_GOLD, COPPER_PER_SILVER
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
