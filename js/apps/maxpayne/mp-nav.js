(function (M) {
  'use strict';
  const S = 0.5;
  const HALF = 0.24;
  const CLEAR = 1.65;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  class Nav {
    constructor(world, o) {
      o = o || {};
      this.w = world;
      this.cols = new Map();
      const b = o.bounds || world.bounds;
      this.i0 = Math.floor(b.min[0] / S);
      this.j0 = Math.floor(b.min[2] / S);
      this.i1 = Math.ceil(b.max[0] / S);
      this.j1 = Math.ceil(b.max[2] / S);
      this.blocks = (o.blocks || []).map(q => ({ min: q.min, max: q.max }));
      const xs = [], ys = [], zs = [];
      const tops = [];
      for (let i = this.i0; i < this.i1; i++) {
        for (let j = this.j0; j < this.j1; j++) {
          const x = (i + 0.5) * S, z = (j + 0.5) * S;
          tops.length = 0;
          world.each(x - 0.01, z - 0.01, x + 0.01, z + 0.01, s => {
            if (s.dynProp || s.noNav) return;
            if (x >= s.min[0] - 1e-5 && x <= s.max[0] + 1e-5 && z >= s.min[2] - 1e-5 && z <= s.max[2] + 1e-5) tops.push(s.max[1]);
          });
          if (!tops.length) continue;
          let list = null;
          const seen = new Set();
          for (const t of tops) {
            const key = Math.round(t * 100);
            if (seen.has(key)) continue;
            seen.add(key);
            if (!this.free(x, t, z)) continue;
            if (!list) { list = []; this.cols.set(this.key(i, j), list); }
            list.push(xs.length);
            xs.push(x); ys.push(t); zs.push(z);
          }
        }
      }
      const n = xs.length;
      this.n = n;
      this.x = Float32Array.from(xs);
      this.y = Float32Array.from(ys);
      this.z = Float32Array.from(zs);
      this.nb = new Int32Array(n * 16).fill(-1);
      for (let k = 0; k < n; k++) {
        const i = Math.floor(this.x[k] / S), j = Math.floor(this.z[k] / S);
        for (let d = 0; d < 8; d++) {
          const ni = i + DIRS[d][0], nj = j + DIRS[d][1];
          const cand = this.cols.get(this.key(ni, nj));
          if (!cand) continue;
          if (d >= 4) {
            const a = this.nodeNear(i + DIRS[d][0], j, this.y[k]);
            const c = this.nodeNear(i, j + DIRS[d][1], this.y[k]);
            if (a < 0 || c < 0) continue;
          }
          const ok = [];
          for (const q of cand) {
            const dy = Math.abs(this.y[q] - this.y[k]);
            if (dy > 0.8) continue;
            if (dy > 0.46 && !this.stepBetween(k, q)) continue;
            ok.push([dy, q]);
          }
          ok.sort((p, q) => p[0] - q[0]);
          for (let m = 0; m < Math.min(2, ok.length); m++) this.nb[k * 16 + d * 2 + m] = ok[m][1];
        }
      }
      this.g = new Float32Array(n);
      this.f = new Float32Array(n);
      this.from = new Int32Array(n);
      this.mark = new Uint32Array(n);
      this.closed = new Uint32Array(n);
      this.run = 1;
      this.comp = new Int32Array(n).fill(-1);
      let c = 0;
      const stack = [];
      for (let k = 0; k < n; k++) {
        if (this.comp[k] >= 0) continue;
        this.comp[k] = c;
        stack.push(k);
        while (stack.length) {
          const u = stack.pop();
          for (let d = 0; d < 16; d++) {
            const v = this.nb[u * 16 + d];
            if (v >= 0 && this.comp[v] < 0) { this.comp[v] = c; stack.push(v); }
          }
        }
        c++;
      }
    }
    key(i, j) { return i * 100003 + j; }
    stepBetween(a, b) {
      const ya = this.y[a], yb = this.y[b];
      const x = (this.x[a] + this.x[b]) / 2, z = (this.z[a] + this.z[b]) / 2;
      const top = Math.max(ya, yb) + 0.05;
      let mid = -1e9;
      this.w.each(x - 0.01, z - 0.01, x + 0.01, z + 0.01, s => {
        if (s.dynProp) return;
        if (x > s.min[0] && x < s.max[0] && z > s.min[2] && z < s.max[2] && s.max[1] <= top && s.max[1] > mid) mid = s.max[1];
      });
      return Math.abs(mid - ya) <= 0.46 && Math.abs(mid - yb) <= 0.46;
    }
    free(x, t, z) {
      const min = [x - HALF, t + 0.47, z - HALF], max = [x + HALF, t + CLEAR, z + HALF];
      let ok = true;
      this.w.each(min[0], min[2], max[0], max[2], s => {
        if (s.dynProp) return;
        if (M.boxOverlap(min, max, s.min, s.max)) { ok = false; return false; }
      });
      if (!ok) return false;
      for (const b of this.blocks) if (M.boxOverlap(min, max, b.min, b.max)) return false;
      const py = t + 0.04;
      this.w.each(x - 0.01, z - 0.01, x + 0.01, z + 0.01, s => {
        if (s.dynProp) return;
        if (x > s.min[0] && x < s.max[0] && z > s.min[2] && z < s.max[2] && py > s.min[1] && py < s.max[1]) { ok = false; return false; }
      });
      return ok;
    }
    nodeNear(i, j, y) {
      const cand = this.cols.get(this.key(i, j));
      if (!cand) return -1;
      for (const q of cand) if (Math.abs(this.y[q] - y) <= 0.5) return q;
      return -1;
    }
    nearest(p, maxR) {
      const i = Math.floor(p[0] / S), j = Math.floor(p[2] / S);
      maxR = maxR === undefined ? 4 : maxR;
      let best = -1, bd = 1e9;
      for (let r = 0; r <= maxR; r++) {
        for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
          const cand = this.cols.get(this.key(i + di, j + dj));
          if (!cand) continue;
          for (const q of cand) {
            const dy = p[1] - this.y[q];
            if (dy < -0.7 || dy > 2.6) continue;
            const d = Math.hypot(this.x[q] - p[0], this.z[q] - p[2]) + Math.abs(dy) * 1.5;
            if (d < bd) { bd = d; best = q; }
          }
        }
        if (best >= 0) return best;
      }
      return best;
    }
    pos(k) { return [this.x[k], this.y[k], this.z[k]]; }
    connected(a, b) { return a >= 0 && b >= 0 && this.comp[a] === this.comp[b]; }
    path(from, to, maxIter) {
      const s = this.nearest(from), t = this.nearest(to);
      if (s < 0 || t < 0 || !this.connected(s, t)) return null;
      if (s === t) return [to.slice()];
      const run = ++this.run;
      const heap = [s];
      this.g[s] = 0;
      this.f[s] = this.h(s, t);
      this.mark[s] = run;
      this.from[s] = -1;
      let iter = 0;
      const lim = maxIter || 90000;
      while (heap.length) {
        const u = this.pop(heap);
        if (u === t) break;
        if (this.closed[u] === run) continue;
        this.closed[u] = run;
        if (++iter > lim) return null;
        for (let e = 0; e < 16; e++) {
          const v = this.nb[u * 16 + e];
          if (v < 0 || this.closed[v] === run) continue;
          const d = e >> 1;
          const cost = (d < 4 ? S : S * 1.4142) + Math.abs(this.y[v] - this.y[u]) * 0.5 + (this.penalty ? this.penalty(v) : 0);
          const ng = this.g[u] + cost;
          if (this.mark[v] !== run || ng < this.g[v]) {
            this.mark[v] = run;
            this.g[v] = ng;
            this.f[v] = ng + this.h(v, t);
            this.from[v] = u;
            this.push(heap, v);
          }
        }
      }
      if (this.mark[t] !== run) return null;
      const out = [];
      for (let k = t; k >= 0; k = this.from[k]) out.push(k);
      out.reverse();
      return this.smooth(out, to);
    }
    h(a, b) { return Math.hypot(this.x[a] - this.x[b], this.z[a] - this.z[b]) + Math.abs(this.y[a] - this.y[b]); }
    push(heap, v) {
      heap.push(v);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (this.f[heap[p]] <= this.f[heap[i]]) break;
        const t = heap[p]; heap[p] = heap[i]; heap[i] = t;
        i = p;
      }
    }
    pop(heap) {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let m = i;
          if (l < heap.length && this.f[heap[l]] < this.f[heap[m]]) m = l;
          if (r < heap.length && this.f[heap[r]] < this.f[heap[m]]) m = r;
          if (m === i) break;
          const t = heap[m]; heap[m] = heap[i]; heap[i] = t;
          i = m;
        }
      }
      return top;
    }
    walkable(a, b) {
      const dx = b[0] - a[0], dz = b[2] - a[2];
      const L = Math.hypot(dx, dz);
      const n = Math.ceil(L / (S * 0.5));
      let y = a[1];
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const x = a[0] + dx * t, z = a[2] + dz * t;
        const q = this.nodeNear(Math.floor(x / S), Math.floor(z / S), y);
        if (q < 0) return false;
        y = this.y[q];
        const min = [x - 0.31, y + 0.47, z - 0.31], max = [x + 0.31, y + 1.6, z + 0.31];
        let hit = false;
        this.w.each(min[0], min[2], max[0], max[2], s => {
          if (s.dynProp) return;
          if (M.boxOverlap(min, max, s.min, s.max)) { hit = true; return false; }
        });
        if (hit) return false;
      }
      return Math.abs(y - b[1]) < 0.6;
    }
    smooth(ks, to) {
      const pts = ks.map(k => this.pos(k));
      pts[pts.length - 1] = [to[0], pts[pts.length - 1][1], to[2]];
      const out = [pts[0]];
      let i = 0;
      while (i < pts.length - 1) {
        let j = pts.length - 1;
        while (j > i + 1 && !this.walkable(pts[i], pts[j])) j--;
        out.push(pts[j]);
        i = j;
      }
      return out;
    }
    randomNear(p, r, rng, pred) {
      for (let tries = 0; tries < 24; tries++) {
        const a = rng.next() * Math.PI * 2, d = rng.next() * r;
        const q = this.nearest([p[0] + Math.cos(a) * d, p[1], p[2] + Math.sin(a) * d], 1);
        if (q < 0) continue;
        const pos = this.pos(q);
        if (Math.abs(pos[1] - p[1]) > 1.2) continue;
        if (pred && !pred(pos, q)) continue;
        return pos;
      }
      return null;
    }
    nodesIn(p, r) {
      const out = [];
      const i0 = Math.floor((p[0] - r) / S), i1 = Math.floor((p[0] + r) / S);
      const j0 = Math.floor((p[2] - r) / S), j1 = Math.floor((p[2] + r) / S);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const cand = this.cols.get(this.key(i, j));
        if (!cand) continue;
        for (const q of cand) if (Math.abs(this.y[q] - p[1]) < 1.3) out.push(q);
      }
      return out;
    }
  }
  M.Nav = Nav;
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
