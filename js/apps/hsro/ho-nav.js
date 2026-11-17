(function (HO) {
  'use strict';
  const CELL = 1;
  const PAD = 0.6;
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41421356], [1, -1, 1.41421356], [-1, 1, 1.41421356], [-1, -1, 1.41421356]];

  class Nav {
    constructor(zone, gates) {
      this.zone = zone;
      let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
      for (const b of zone.boxes) { x0 = Math.min(x0, b[0]); z0 = Math.min(z0, b[2]); x1 = Math.max(x1, b[3]); z1 = Math.max(z1, b[5]); }
      this.x0 = Math.floor(x0); this.z0 = Math.floor(z0);
      this.w = Math.ceil(x1 - this.x0) + 1; this.h = Math.ceil(z1 - this.z0) + 1;
      this.build(gates || {});
    }

    build(gates) {
      const w = this.w, h = this.h, free = new Uint8Array(w * h);
      const floors = [], walls = [];
      for (const b of this.zone.boxes) {
        if (b[6] === 'gate' && gates[b[7]]) continue;
        if (b[4] <= 0.45 && b[4] >= -0.5) floors.push(b);
        else if (b[1] < 1.8 && b[4] > 0.45) walls.push(b);
      }
      for (const b of floors) this.mark(free, b, 0, 1);
      for (const b of walls) this.mark(free, b, PAD, 0);
      this.free = free;
      this.key = JSON.stringify(gates);
    }

    mark(grid, b, pad, v) {
      const ix0 = Math.max(0, Math.ceil(b[0] - pad - this.x0 - 0.5)), ix1 = Math.min(this.w - 1, Math.floor(b[3] + pad - this.x0 - 0.5));
      const iz0 = Math.max(0, Math.ceil(b[2] - pad - this.z0 - 0.5)), iz1 = Math.min(this.h - 1, Math.floor(b[5] + pad - this.z0 - 0.5));
      for (let z = iz0; z <= iz1; z++) for (let x = ix0; x <= ix1; x++) {
        const cx = this.x0 + x + 0.5, cz = this.z0 + z + 0.5;
        if (v === 1 ? cx > b[0] && cx < b[3] && cz > b[2] && cz < b[5] : cx > b[0] - pad && cx < b[3] + pad && cz > b[2] - pad && cz < b[5] + pad) grid[z * this.w + x] = v;
      }
    }

    cellOf(x, z) {
      const ix = Math.floor(x - this.x0), iz = Math.floor(z - this.z0);
      if (ix < 0 || iz < 0 || ix >= this.w || iz >= this.h) return -1;
      return iz * this.w + ix;
    }

    walkable(x, z) {
      const c = this.cellOf(x, z);
      return c >= 0 && this.free[c] === 1;
    }

    nearestFree(x, z) {
      const c = this.cellOf(x, z);
      if (c >= 0 && this.free[c]) return c;
      for (let r = 1; r < 6; r++) {
        let best = -1, bd = Infinity;
        for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
          const cc = this.cellOf(x + dx * CELL, z + dz * CELL);
          if (cc >= 0 && this.free[cc]) { const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = cc; } }
        }
        if (best >= 0) return best;
      }
      return -1;
    }

    clear(ax, az, bx, bz) {
      const dx = bx - ax, dz = bz - az, len = Math.sqrt(dx * dx + dz * dz), n = Math.max(1, Math.ceil(len / 0.4));
      for (let i = 0; i <= n; i++) if (!this.walkable(ax + dx * i / n, az + dz * i / n)) return false;
      return true;
    }

    center(c) {
      return [this.x0 + (c % this.w) + 0.5, this.z0 + Math.floor(c / this.w) + 0.5];
    }

    path(sx, sz, tx, tz, limit) {
      const start = this.nearestFree(sx, sz), goal = this.nearestFree(tx, tz);
      if (start < 0 || goal < 0) return null;
      if (start === goal) return [[tx, tz]];
      const w = this.w, n = this.free.length, g = new Float64Array(n).fill(Infinity), from = new Int32Array(n).fill(-1), closed = new Uint8Array(n);
      const gx = goal % w, gz = Math.floor(goal / w);
      const heap = [];
      const push = (c, f) => {
        heap.push([f, c]);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p][0] < heap[i][0] || (heap[p][0] === heap[i][0] && heap[p][1] <= heap[i][1])) break;
          const t = heap[p]; heap[p] = heap[i]; heap[i] = t; i = p;
        }
      };
      const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = i * 2 + 1, r = l + 1;
            let m = i;
            const less = (a, b) => heap[a][0] < heap[b][0] || (heap[a][0] === heap[b][0] && heap[a][1] < heap[b][1]);
            if (l < heap.length && less(l, m)) m = l;
            if (r < heap.length && less(r, m)) m = r;
            if (m === i) break;
            const t = heap[m]; heap[m] = heap[i]; heap[i] = t; i = m;
          }
        }
        return top;
      };
      const hfun = c => { const x = c % w, z = Math.floor(c / w), dx = Math.abs(x - gx), dz = Math.abs(z - gz); return Math.max(dx, dz) + 0.41421356 * Math.min(dx, dz); };
      g[start] = 0;
      push(start, hfun(start));
      let steps = 0;
      while (heap.length) {
        const [, c] = pop();
        if (closed[c]) continue;
        closed[c] = 1;
        if (c === goal) break;
        if (++steps > (limit || 40000)) return null;
        const x = c % w, z = Math.floor(c / w);
        for (const [dx, dz, cost] of DIRS) {
          const nx = x + dx, nz = z + dz;
          if (nx < 0 || nz < 0 || nx >= w || nz >= this.h) continue;
          const nc = nz * w + nx;
          if (!this.free[nc] || closed[nc]) continue;
          if (dx && dz && (!this.free[z * w + nx] || !this.free[nz * w + x])) continue;
          const ng = g[c] + cost;
          if (ng < g[nc]) { g[nc] = ng; from[nc] = c; push(nc, ng + hfun(nc)); }
        }
      }
      if (from[goal] < 0) return null;
      const cells = [];
      for (let c = goal; c !== start; c = from[c]) cells.push(c);
      cells.reverse();
      const pts = cells.map(c => this.center(c));
      pts[pts.length - 1] = this.walkable(tx, tz) ? [tx, tz] : pts[pts.length - 1];
      const out = [];
      let ax = sx, az = sz, i = 0;
      while (i < pts.length) {
        let j = pts.length - 1;
        while (j > i && !this.clear(ax, az, pts[j][0], pts[j][1])) j--;
        out.push(pts[j]);
        ax = pts[j][0]; az = pts[j][1];
        i = j + 1;
      }
      return out;
    }

    reachable(sx, sz) {
      const start = this.nearestFree(sx, sz), seen = new Uint8Array(this.free.length);
      if (start < 0) return seen;
      const queue = [start];
      seen[start] = 1;
      while (queue.length) {
        const c = queue.pop(), x = c % this.w, z = Math.floor(c / this.w);
        for (const [dx, dz] of DIRS.slice(0, 4)) {
          const nx = x + dx, nz = z + dz, nc = nz * this.w + nx;
          if (nx < 0 || nz < 0 || nx >= this.w || nz >= this.h || seen[nc] || !this.free[nc]) continue;
          seen[nc] = 1;
          queue.push(nc);
        }
      }
      return seen;
    }
  }

  HO.Nav = Nav;

  const ARRIVE = [[0, 2], [0, -2], [2, 0], [-2, 0], [1.5, 1.5], [-1.5, 1.5], [1.5, -1.5], [-1.5, -1.5]];
  const spots = {};
  HO.anchorSpot = function (id) {
    if (!spots[id]) {
      const an = HO.ANCHORS[id], nav = new Nav(HO.ZONES[an.zone], {});
      const t = ARRIVE.find(([dx, dz]) => nav.walkable(an.x + dx, an.z + dz) && nav.walkable(an.x + dx / 2, an.z + dz / 2)) || [0, 0];
      spots[id] = { zone: an.zone, x: an.x + t[0], z: an.z + t[1] };
    }
    return spots[id];
  };
  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
