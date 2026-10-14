(function (X) {
  'use strict';
  const F = X.F;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  class Heap {
    constructor() { this.ids = []; this.keys = []; }
    push(id, k) {
      const a = this.ids, b = this.keys;
      let i = a.length;
      a.push(id); b.push(k);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (b[p] <= k) break;
        a[i] = a[p]; b[i] = b[p]; i = p;
      }
      a[i] = id; b[i] = k;
    }
    pop() {
      const a = this.ids, b = this.keys;
      const top = a[0];
      const lid = a.pop(), lk = b.pop();
      if (a.length) {
        let i = 0;
        const n = a.length;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i, mk = lk;
          if (l < n && b[l] < mk) { m = l; mk = b[l]; }
          if (r < n && b[r] < mk) { m = r; mk = b[r]; }
          if (m === i) break;
          a[i] = a[m]; b[i] = b[m]; i = m;
        }
        a[i] = lid; b[i] = lk;
      }
      return top;
    }
    get size() { return this.ids.length; }
  }

  class Nav {
    constructor(world, bounds, opts) {
      opts = opts || {};
      this.w = world;
      this.cs = opts.cell || 0.5;
      const b = bounds || [world.minx + 8, world.minz + 8, world.maxx - 8, world.maxz - 8];
      this.x0 = b[0]; this.z0 = b[1];
      this.nx = Math.max(1, Math.ceil((b[2] - b[0]) / this.cs));
      this.nz = Math.max(1, Math.ceil((b[3] - b[1]) / this.cs));
      this.build();
    }
    build() {
      const w = this.w, cs = this.cs, nx = this.nx, nz = this.nz;
      w.skipMovers = true;
      const cols = new Array(nx * nz);
      const cand = [];
      let count = 0;
      for (let k = 0; k < nz; k++) {
        for (let i = 0; i < nx; i++) {
          const x = this.x0 + (i + 0.5) * cs, z = this.z0 + (k + 0.5) * cs;
          cand.length = 0;
          w.forBlocks(x - 0.01, z - 0.01, x + 0.01, z + 0.01, bl => {
            if ((bl.flags & (F.SOLID | F.WALK)) !== (F.SOLID | F.WALK) || (bl.flags & F.NONAV)) return;
            if (X.circleRect(bl, x, z, 0.001)) cand.push(bl.top);
          });
          const tr = w.terrainObj(x, z);
          if (tr) {
            const h = tr.heightAt(x, z);
            const n = tr.normalAt(x, z);
            if (n[1] > 0.72) cand.push(h);
          }
          if (!cand.length) continue;
          cand.sort((a, c) => c - a);
          const ys = [];
          const wy = w.waterAt(x, z);
          for (const y of cand) {
            if (ys.some(q => Math.abs(q - y) < 0.3)) continue;
            if (wy !== null && y < wy - 0.85) continue;
            if (w.overlaps(x, z, 0.3, y + X.STEP, y + 1.7, F.SOLID)) continue;
            ys.push(y);
          }
          if (ys.length) { cols[k * nx + i] = ys; count += ys.length; }
        }
      }
      w.skipMovers = false;
      this.count = count;
      this.colStart = new Int32Array(nx * nz + 1);
      this.px = new Float32Array(count); this.py = new Float32Array(count); this.pz = new Float32Array(count);
      this.col = new Int32Array(count);
      let n = 0;
      for (let c = 0; c < nx * nz; c++) {
        this.colStart[c] = n;
        const ys = cols[c];
        if (!ys) continue;
        const i = c % nx, k = (c - i) / nx;
        for (const y of ys) {
          this.px[n] = this.x0 + (i + 0.5) * cs; this.py[n] = y; this.pz[n] = this.z0 + (k + 0.5) * cs; this.col[n] = c;
          n++;
        }
      }
      this.colStart[nx * nz] = n;
      this.nb = new Int32Array(count * 8).fill(-1);
      for (let id = 0; id < count; id++) {
        const c = this.col[id], i = c % nx, k = (c - i) / nx;
        for (let d = 0; d < 8; d++) {
          const ii = i + DIRS[d][0], kk = k + DIRS[d][1];
          if (ii < 0 || kk < 0 || ii >= nx || kk >= nz) continue;
          const m = this.match(ii, kk, this.py[id]);
          if (m < 0) continue;
          if (d >= 4) {
            const a = this.match(i + DIRS[d][0], k, this.py[id]), b = this.match(i, k + DIRS[d][1], this.py[id]);
            if (a < 0 || b < 0 || Math.abs(this.py[a] - this.py[m]) > X.STEP || Math.abs(this.py[b] - this.py[m]) > X.STEP) continue;
          }
          this.nb[id * 8 + d] = m;
        }
      }
      this.region = new Int32Array(count).fill(-1);
      let reg = 0;
      const q = new Int32Array(count);
      for (let s = 0; s < count; s++) {
        if (this.region[s] >= 0) continue;
        let h = 0, t = 0;
        q[t++] = s; this.region[s] = reg;
        while (h < t) {
          const u = q[h++];
          for (let d = 0; d < 8; d++) {
            const v = this.nb[u * 8 + d];
            if (v >= 0 && this.region[v] < 0) { this.region[v] = reg; q[t++] = v; }
          }
        }
        reg++;
      }
      this.regions = reg;
      this.g = new Float32Array(count);
      this.from = new Int32Array(count);
      this.seen = new Int32Array(count);
      this.closed = new Int32Array(count);
      this.gen = 0;
    }
    match(i, k, y) {
      const c = k * this.nx + i;
      let best = -1, bd = X.STEP + 1e-3;
      for (let n = this.colStart[c]; n < this.colStart[c + 1]; n++) {
        const d = Math.abs(this.py[n] - y);
        if (d < bd - 1e-4) { bd = d; best = n; }
      }
      return best;
    }
    nearest(p, maxR) {
      const cs = this.cs;
      const ci = Math.floor((p[0] - this.x0) / cs), ck = Math.floor((p[2] - this.z0) / cs);
      const R = maxR === undefined ? 4 : maxR;
      let best = -1, bd = 1e9;
      for (let r = 0; r <= R; r++) {
        for (let k = ck - r; k <= ck + r; k++) {
          for (let i = ci - r; i <= ci + r; i++) {
            if (Math.max(Math.abs(i - ci), Math.abs(k - ck)) !== r) continue;
            if (i < 0 || k < 0 || i >= this.nx || k >= this.nz) continue;
            const c = k * this.nx + i;
            for (let n = this.colStart[c]; n < this.colStart[c + 1]; n++) {
              const dy = this.py[n] - p[1];
              if (dy > 0.9 || dy < -1.6) continue;
              const d = Math.hypot(this.px[n] - p[0], this.pz[n] - p[2]) + Math.abs(dy) * 0.6;
              if (d < bd) { bd = d; best = n; }
            }
          }
        }
        if (best >= 0 && r >= 1) break;
      }
      return best;
    }
    pos(n) { return [this.px[n], this.py[n], this.pz[n]]; }
    connected(a, b) { return a >= 0 && b >= 0 && this.region[a] === this.region[b]; }
    find(a, b, maxExp) {
      if (a < 0 || b < 0 || this.region[a] !== this.region[b]) return null;
      if (a === b) return [a];
      const gen = ++this.gen;
      const g = this.g, from = this.from, seen = this.seen, closed = this.closed;
      const bx = this.px[b], by = this.py[b], bz = this.pz[b];
      const heap = new Heap();
      g[a] = 0; from[a] = -1; seen[a] = gen;
      heap.push(a, 0);
      let exp = 0;
      const lim = maxExp || 60000;
      while (heap.size) {
        const u = heap.pop();
        if (closed[u] === gen) continue;
        closed[u] = gen;
        if (u === b) break;
        if (++exp > lim) return null;
        const uy = this.py[u];
        for (let d = 0; d < 8; d++) {
          const v = this.nb[u * 8 + d];
          if (v < 0 || closed[v] === gen) continue;
          const cost = (d < 4 ? 1 : 1.4142) * this.cs + Math.abs(this.py[v] - uy) * 0.5 + (this.cost ? this.cost(v) : 0);
          const ng = g[u] + cost;
          if (seen[v] !== gen || ng < g[v]) {
            seen[v] = gen; g[v] = ng; from[v] = u;
            const hx = this.px[v] - bx, hy = this.py[v] - by, hz = this.pz[v] - bz;
            heap.push(v, ng + Math.sqrt(hx * hx + hy * hy + hz * hz) * 1.05);
          }
        }
      }
      if (closed[b] !== gen) return null;
      const out = [];
      for (let n = b; n >= 0; n = from[n]) out.push(n);
      out.reverse();
      return out;
    }
    walkable(a, b) {
      const w = this.w;
      const dx = b[0] - a[0], dz = b[2] - a[2];
      const len = Math.hypot(dx, dz);
      const n = Math.max(1, Math.ceil(len / 0.3));
      let y = a[1];
      w.skipMovers = true;
      let ok = true;
      for (let i = 1; i <= n && ok; i++) {
        const t = i / n;
        const x = a[0] + dx * t, z = a[2] + dz * t;
        const s = w.support(x, z, 0.12, y + X.STEP);
        if (s.y < y - 0.6 || s.y < -1e8) { ok = false; break; }
        const wy = w.waterAt(x, z);
        if (wy !== null && s.y < wy - 0.85) { ok = false; break; }
        if (w.overlaps(x, z, 0.3, s.y + X.STEP, s.y + 1.65, F.SOLID)) { ok = false; break; }
        y = s.y;
      }
      w.skipMovers = false;
      return ok && Math.abs(y - b[1]) < 0.6;
    }
    path(from, to) {
      const a = this.nearest(from), b = this.nearest(to);
      const ids = this.find(a, b);
      if (!ids) return null;
      const pts = ids.map(n => this.pos(n));
      if (this.walkable(pts[pts.length - 1], to) && Math.abs(to[1] - pts[pts.length - 1][1]) < 0.6) pts.push(to.slice());
      return this.smooth(from, pts);
    }
    smooth(from, pts) {
      const out = [];
      let cur = from.slice();
      let i = 0;
      while (i < pts.length) {
        let j = Math.min(pts.length - 1, i + 14);
        while (j > i && !this.walkable(cur, pts[j])) j--;
        out.push(pts[j]);
        cur = pts[j];
        i = j + 1;
      }
      return out;
    }
    nodesNear(p, r, fn) {
      const cs = this.cs;
      const i0 = Math.max(0, Math.floor((p[0] - r - this.x0) / cs)), i1 = Math.min(this.nx - 1, Math.floor((p[0] + r - this.x0) / cs));
      const k0 = Math.max(0, Math.floor((p[2] - r - this.z0) / cs)), k1 = Math.min(this.nz - 1, Math.floor((p[2] + r - this.z0) / cs));
      for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) {
        const c = k * this.nx + i;
        for (let n = this.colStart[c]; n < this.colStart[c + 1]; n++) fn(n);
      }
    }
  }
  X.Nav = Nav;
})(globalThis.XIII = globalThis.XIII || {});
