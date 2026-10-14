(function (AW) {
  'use strict';

  const CELL = 8;

  AW.WalkMap = class {
    constructor(w, h, cells) {
      this.w = w;
      this.h = h;
      this.cells = cells;
      this.dyn = new Uint8Array(w * h);
    }

    static fromLevel(map) {
      return new AW.WalkMap(map.w, map.h, AW.rleDecode(map.rle, map.w * map.h));
    }

    get(cx, cy) {
      if (cx < 0 || cy < 0 || cx >= this.w || cy >= this.h) return 0;
      return this.cells[cy * this.w + cx];
    }

    walkableCell(cx, cy) {
      const v = this.get(cx, cy);
      return v >= 1 && v < 100 && !this.dyn[cy * this.w + cx];
    }

    walkable(x, y) { return this.walkableCell(Math.floor(x / CELL), Math.floor(y / CELL)); }

    ground(x, y) {
      const v = this.get(Math.floor(x / CELL), Math.floor(y / CELL));
      return v >= 1 && v < 100 ? v : 0;
    }

    fillPoly(poly, val) {
      if (!poly || poly.length < 3) return;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of poly) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
      const c0 = Math.max(0, Math.floor(x0 / CELL)), c1 = Math.min(this.w - 1, Math.floor(x1 / CELL));
      const r0 = Math.max(0, Math.floor(y0 / CELL)), r1 = Math.min(this.h - 1, Math.floor(y1 / CELL));
      for (let cy = r0; cy <= r1; cy++) {
        for (let cx = c0; cx <= c1; cx++) {
          if (AW.pointInPoly(poly, cx * CELL + 4, cy * CELL + 4)) this.cells[cy * this.w + cx] = val;
        }
      }
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
        for (let k = 0; k <= n; k++) {
          const cx = Math.floor((a[0] + (b[0] - a[0]) * k / n) / CELL), cy = Math.floor((a[1] + (b[1] - a[1]) * k / n) / CELL);
          if (cx >= 0 && cy >= 0 && cx < this.w && cy < this.h) this.cells[cy * this.w + cx] = val;
        }
      }
    }

    nearestWalkable(x, y, maxR) {
      const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
      if (this.walkableCell(cx, cy)) return [x, y];
      const R = maxR || 40;
      for (let r = 1; r <= R; r++) {
        let best = null, bd = Infinity;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            if (this.walkableCell(cx + dx, cy + dy)) {
              const d = dx * dx + dy * dy * 4;
              if (d < bd) { bd = d; best = [(cx + dx) * CELL + 4, (cy + dy) * CELL + 4]; }
            }
          }
        }
        if (best) return best;
      }
      return null;
    }

    lineWalkable(x0, y0, x1, y1) {
      const d = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.max(1, Math.ceil(d / 4));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        if (!this.walkable(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
      }
      return true;
    }

    rayBlocked(x0, y0, x1, y1, thr) {
      const lim = thr === undefined ? 100 : thr;
      const d = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.max(1, Math.ceil(d / 6));
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const v = this.get(Math.floor((x0 + (x1 - x0) * t) / CELL), Math.floor((y0 + (y1 - y0) * t) / CELL));
        if (v > lim) return true;
      }
      return false;
    }

    findPath(x0, y0, x1, y1, opts) {
      const o = opts || {};
      const start = this.nearestWalkable(x0, y0, 6);
      let goal = this.nearestWalkable(x1, y1, o.goalRadius || 30);
      if (!start || !goal) return null;
      const sx = Math.floor(start[0] / CELL), sy = Math.floor(start[1] / CELL);
      const gx = Math.floor(goal[0] / CELL), gy = Math.floor(goal[1] / CELL);
      if (sx === gx && sy === gy) return [[goal[0], goal[1]]];
      if (this.lineWalkable(x0, y0, goal[0], goal[1])) return [[goal[0], goal[1]]];
      const W = this.w, H = this.h;
      const N = W * H;
      if (!this._g || this._g.length !== N) {
        this._g = new Float32Array(N);
        this._from = new Int32Array(N);
        this._stamp = new Uint32Array(N);
        this._closed = new Uint32Array(N);
        this._run = 1;
      }
      const run = ++this._run;
      const g = this._g, from = this._from, stamp = this._stamp, closed = this._closed;
      const heap = [];
      const push = (idx, f) => {
        heap.push([f, idx]);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p][0] <= heap[i][0]) break;
          const t = heap[p]; heap[p] = heap[i]; heap[i] = t; i = p;
        }
      };
      const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = i * 2 + 1, r = l + 1;
            let m = i;
            if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
            if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
            if (m === i) break;
            const t = heap[m]; heap[m] = heap[i]; heap[i] = t; i = m;
          }
        }
        return top;
      };
      const h = (cx, cy) => {
        const dx = Math.abs(cx - gx), dy = Math.abs(cy - gy);
        return (dx + dy) + (1.414 - 2) * Math.min(dx, dy);
      };
      const si = sy * W + sx, gi = gy * W + gx;
      g[si] = 0; stamp[si] = run; from[si] = -1;
      push(si, h(sx, sy));
      const maxIter = o.maxIter || 60000;
      let iter = 0, found = false, best = si, bestH = h(sx, sy);
      while (heap.length && iter++ < maxIter) {
        const [, cur] = pop();
        if (closed[cur] === run) continue;
        closed[cur] = run;
        if (cur === gi) { found = true; break; }
        const cx = cur % W, cy = (cur / W) | 0;
        const hc = h(cx, cy);
        if (hc < bestH) { bestH = hc; best = cur; }
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            if (!this.walkableCell(nx, ny)) continue;
            if (dx && dy && (!this.walkableCell(cx + dx, cy) || !this.walkableCell(cx, cy + dy))) continue;
            const ni = ny * W + nx;
            if (closed[ni] === run) continue;
            const ng = g[cur] + (dx && dy ? 1.414 : 1);
            if (stamp[ni] !== run || ng < g[ni]) {
              stamp[ni] = run; g[ni] = ng; from[ni] = cur;
              push(ni, ng + h(nx, ny));
            }
          }
        }
      }
      const endIdx = found ? gi : (o.partial ? best : -1);
      if (endIdx < 0) return null;
      const cells = [];
      let c = endIdx;
      while (c !== -1 && c !== si) { cells.push(c); c = from[c]; }
      cells.reverse();
      const pts = cells.map(ci => [(ci % W) * CELL + 4, ((ci / W) | 0) * CELL + 4]);
      if (found) pts[pts.length - 1] = [goal[0], goal[1]];
      return this.smooth([x0, y0], pts);
    }

    smooth(from, pts) {
      if (pts.length < 2) return pts;
      const out = [];
      let cur = from;
      let i = 0;
      while (i < pts.length) {
        let j = pts.length - 1;
        while (j > i && !this.lineWalkable(cur[0], cur[1], pts[j][0], pts[j][1])) j--;
        out.push(pts[j]);
        cur = pts[j];
        i = j + 1;
      }
      return out;
    }
  };
})(globalThis.AW = globalThis.AW || {});
