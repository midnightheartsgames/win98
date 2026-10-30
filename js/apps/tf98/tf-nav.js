(function (T) {
  'use strict';
  const NC = 1;
  const CLEAR = 0.42;
  const CLEAR_WET = 0.15;
  const HEAD = 1.7;
  const LINK = 1.3;
  const PROBE = 0.25;
  const MAX_DROP = 5;
  const MAX_JUMP = 0.85;
  const MAX_HIGH = 1.25;
  const CLIMB_OUT = 0.9;
  const DEEP = 1;
  const WET_COST = 1.7;
  const DANGER_COST = 6;
  const F_WALK = 0, F_JUMP = 1, F_DROP = 2, F_HIGH = 3, F_SWIM = 4, F_OUT = 5;
  const TEAM_CODE = { hot: 1, cold: 2 };
  const STEP = T.RULES.stepUp;

  const isDoor = s => !!(s.only || s.oneWay);
  const covers = (s, x, z) => x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1;

  class Heap {
    constructor(n) { this.ids = new Int32Array(n); this.keys = new Float32Array(n); this.size = 0; }
    clear() { this.size = 0; }
    push(id, k) {
      let i = this.size++;
      const ids = this.ids, keys = this.keys;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (keys[p] <= k) break;
        ids[i] = ids[p]; keys[i] = keys[p]; i = p;
      }
      ids[i] = id; keys[i] = k;
    }
    pop() {
      const ids = this.ids, keys = this.keys;
      const top = ids[0];
      const n = --this.size;
      if (n > 0) {
        const id = ids[n], k = keys[n];
        let i = 0;
        for (;;) {
          let c = 2 * i + 1;
          if (c >= n) break;
          if (c + 1 < n && keys[c + 1] < keys[c]) c++;
          if (keys[c] >= k) break;
          ids[i] = ids[c]; keys[i] = keys[c]; i = c;
        }
        ids[i] = id; keys[i] = k;
      }
      return top;
    }
  }

  class Nav {
    constructor(map) {
      this.map = map;
      this.world = map.world;
      const b = map.bounds;
      this.x0 = b.x0; this.z0 = b.z0;
      this.nx = Math.ceil((b.x1 - b.x0) / NC); this.nz = Math.ceil((b.z1 - b.z0) / NC);
      this.danger = { 1: null, 2: null };
      this.build();
      this.label();
    }

    depthAt(x, y, z) {
      const top = this.world.waterTop(x, y + 0.01, z);
      return top === -Infinity ? 0 : top - y;
    }

    surfaces(x, z) {
      const list = this.world.near(x - 0.01, z - 0.01, x + 0.01, z + 0.01, this._l || (this._l = []));
      const tops = [];
      for (const s of list) {
        if (!s.nomove && !s.clip && !isDoor(s) && covers(s, x, z)) tops.push(T.topAt(s, x, z));
      }
      tops.sort((a, b) => b - a);
      const res = [];
      for (const t of tops) {
        if (res.length && Math.abs(res[res.length - 1] - t) < 0.3) continue;
        let free = true;
        for (const s of list) {
          if (s.nomove || isDoor(s) || !covers(s, x, z)) continue;
          if (T.topAt(s, x, z) > t + 0.05 && s.y0 < t + HEAD) { free = false; break; }
        }
        if (free && this.clearance(x, t, z, this.depthAt(x, t, z) > DEEP ? CLEAR_WET : CLEAR)) res.push(t);
      }
      return res;
    }

    clearance(x, y, z, r) {
      const list = this.world.near(x - r, z - r, x + r, z + r, this._c || (this._c = []));
      for (const s of list) {
        if (s.nomove || isDoor(s) || s.y0 > y + HEAD) continue;
        const cx = x < s.x0 ? s.x0 : x > s.x1 ? s.x1 : x, cz = z < s.z0 ? s.z0 : z > s.z1 ? s.z1 : z;
        if ((cx - x) * (cx - x) + (cz - z) * (cz - z) > r * r) continue;
        if (T.topAt(s, cx, cz) > y + STEP) return false;
      }
      return true;
    }

    lowWall(x, y, z) {
      const list = this.world.near(x, z, x, z, this._w || (this._w = []));
      for (const s of list) {
        if (s.nomove || isDoor(s) || !covers(s, x, z)) continue;
        if (s.y0 < y + HEAD && T.topAt(s, x, z) > y + STEP + 0.02) return true;
      }
      return false;
    }

    walkable(ax, ay, az, bx, by, bz) {
      const d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / PROBE));
      let y = ay;
      for (let i = 1; i <= n; i++) {
        const k = i / n, x = ax + (bx - ax) * k, z = az + (bz - az) * k;
        const g = this.world.groundAt(x, z, y + STEP + 0.02, 0);
        if (g === -Infinity || y - g > STEP + 0.05 || this.lowWall(x, y, z)) return false;
        y = g;
      }
      return Math.abs(y - by) < 0.3;
    }

    doorOn(ax, az, bx, bz) {
      const list = this.world.near(Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz), this._d || (this._d = []));
      for (const s of list) {
        if (!isDoor(s)) continue;
        let t0 = 0, t1 = 1;
        for (const [o, d, lo, hi] of [[ax, bx - ax, s.x0, s.x1], [az, bz - az, s.z0, s.z1]]) {
          if (Math.abs(d) < 1e-9) {
            if (o < lo || o > hi) { t0 = 2; break; }
          } else {
            const a = (lo - o) / d, b = (hi - o) / d;
            t0 = Math.max(t0, Math.min(a, b));
            t1 = Math.min(t1, Math.max(a, b));
          }
        }
        if (t0 <= t1) return s;
      }
      return null;
    }

    sightBlocked(ax, ay, az, bx, by, bz) {
      const l = Math.hypot(bx - ax, bz - az);
      return !!this.world.raycast(ax, Math.max(ay, by), az, (bx - ax) / l, 0, (bz - az) / l, l);
    }

    nodes() {
      const nx = this.nx, nz = this.nz, xs = [], ys = [], zs = [], cols = [], wet = [];
      this.colStart = new Int32Array(nx * nz + 1);
      for (let j = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++) {
          const c = j * nx + i;
          this.colStart[c] = xs.length;
          const x = this.x0 + (i + 0.5) * NC, z = this.z0 + (j + 0.5) * NC;
          const tops = this.surfaces(x, z);
          for (let k = tops.length - 1; k >= 0; k--) {
            const depth = this.depthAt(x, tops[k], z);
            xs.push(x); ys.push(tops[k]); zs.push(z); cols.push(c); wet.push(depth > DEEP ? depth : 0);
          }
        }
      }
      this.colStart[nx * nz] = xs.length;
      this.n = xs.length;
      this.x = Float32Array.from(xs); this.y = Float32Array.from(ys); this.z = Float32Array.from(zs);
      this.col = Int32Array.from(cols);
      this.wet = Float32Array.from(wet);
    }

    build() {
      this.nodes();
      const n = this.n, nx = this.nx, nz = this.nz;
      const adj = [], flags = [], teams = [], start = new Int32Array(n + 1);
      const add = (a, b, flag) => {
        const door = this.doorOn(this.x[a], this.z[a], this.x[b], this.z[b]);
        let team = 0;
        if (door && door.oneWay) {
          const dx = this.x[b] - this.x[a], dz = this.z[b] - this.z[a];
          const along = door.oneWay === 'x+' ? dx : door.oneWay === 'x-' ? -dx : door.oneWay === 'z+' ? dz : -dz;
          if (along <= 0) return;
        }
        if (door && door.only) team = TEAM_CODE[door.only];
        adj.push(b); flags.push(flag); teams.push(team);
      };
      for (let a = 0; a < n; a++) {
        start[a] = adj.length;
        const c = this.col[a], ci = c % nx, cj = (c / nx) | 0;
        const ya = this.y[a], xa = this.x[a], za = this.z[a], wa = this.wet[a];
        for (let dj = -1; dj <= 1; dj++) {
          for (let di = -1; di <= 1; di++) {
            if (!di && !dj) continue;
            const i2 = ci + di, j2 = cj + dj;
            if (i2 < 0 || j2 < 0 || i2 >= nx || j2 >= nz) continue;
            const c2 = j2 * nx + i2, straight = !di || !dj;
            let level = false;
            for (let b = this.colStart[c2]; b < this.colStart[c2 + 1]; b++) {
              const xb = this.x[b], yb = this.y[b], zb = this.z[b], wb = this.wet[b], dy = yb - ya;
              if (wa && wb) {
                const swim = Math.max(ya + wa, yb + wb) - 0.3;
                if (!this.sightBlocked(xa, swim, za, xb, swim, zb)) { level = true; add(a, b, F_SWIM); }
                continue;
              }
              if (wa && dy > STEP) {
                if (straight && yb - (ya + wa) <= CLIMB_OUT && !this.sightBlocked(xa, yb + 0.8, za, xb, yb + 0.8, zb)) { level = true; add(a, b, F_OUT); }
                continue;
              }
              if (Math.abs(dy) > LINK) continue;
              if (this.sightBlocked(xa, ya + 0.8, za, xb, yb + 0.8, zb)) continue;
              if (this.walkable(xa, ya, za, xb, yb, zb)) {
                level = true;
                add(a, b, F_WALK);
              } else if (straight) {
                if (dy > STEP && dy <= MAX_JUMP) add(a, b, F_JUMP);
                else if (dy > MAX_JUMP && dy <= MAX_HIGH) add(a, b, F_HIGH);
              }
            }
            if (level || !straight) continue;
            for (let b = this.colStart[c2]; b < this.colStart[c2 + 1]; b++) {
              const dy = this.y[b] - ya;
              if (dy >= -STEP || dy + this.wet[b] < -MAX_DROP) continue;
              if (Math.abs(this.world.groundAt(this.x[b], this.z[b], ya + 0.02, 0) - this.y[b]) > 0.05) continue;
              if (!this.sightBlocked(xa, ya + 0.8, za, this.x[b], ya + 0.8, this.z[b])) add(a, b, F_DROP);
            }
          }
        }
      }
      start[n] = adj.length;
      this.start = start;
      this.adj = Int32Array.from(adj);
      this.flag = Uint8Array.from(flags);
      this.edgeTeam = Uint8Array.from(teams);
      this.g = new Float32Array(n);
      this.from = new Int32Array(n);
      this.gen = new Uint32Array(n);
      this.closed = new Uint32Array(n);
      this.curGen = 0;
      this.heap = new Heap(Math.max(16, adj.length + n));
    }

    label() {
      const parent = new Int32Array(this.n);
      for (let i = 0; i < this.n; i++) parent[i] = i;
      const find = i => {
        while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
        return i;
      };
      for (let a = 0; a < this.n; a++) {
        for (let k = this.start[a]; k < this.start[a + 1]; k++) parent[find(a)] = find(this.adj[k]);
      }
      this.comp = new Int32Array(this.n);
      for (let i = 0; i < this.n; i++) this.comp[i] = find(i);
    }

    nearest(x, y, z, maxR = 4, seeing = false) {
      const ci = Math.floor((x - this.x0) / NC), cj = Math.floor((z - this.z0) / NC);
      let best = -1, bd = Infinity;
      for (let r = 0; r <= maxR; r++) {
        for (let dj = -r; dj <= r; dj++) {
          for (let di = -r; di <= r; di++) {
            if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
            const i = ci + di, j = cj + dj;
            if (i < 0 || j < 0 || i >= this.nx || j >= this.nz) continue;
            const c = j * this.nx + i;
            for (let k = this.colStart[c]; k < this.colStart[c + 1]; k++) {
              const top = this.y[k] + this.wet[k];
              const dy = this.wet[k] ? (y > top ? top - y : y < this.y[k] ? this.y[k] - y : 0) : this.y[k] - y;
              const pen = dy > 1.2 ? 30 + dy * 4 : dy < -3 ? 6 + Math.abs(dy) : Math.abs(dy) * 1.5;
              const d = (this.x[k] - x) ** 2 + (this.z[k] - z) ** 2 + pen * pen;
              if (d >= bd) continue;
              if (seeing && !this.world.clear(x, y + 0.6, z, this.x[k], this.y[k] + 0.6, this.z[k])) continue;
              bd = d;
              best = k;
            }
          }
        }
        if (best >= 0 && r >= 1) break;
      }
      return best;
    }

    path(a, b, team, maxIter = 12000) {
      if (a < 0 || b < 0 || this.comp[a] !== this.comp[b]) return null;
      if (a === b) return [a];
      const code = TEAM_CODE[team] || 0, danger = this.danger[code];
      const gen = ++this.curGen;
      const g = this.g, from = this.from, gens = this.gen, closed = this.closed, heap = this.heap;
      const bx = this.x[b], by = this.y[b], bz = this.z[b];
      heap.clear();
      g[a] = 0; gens[a] = gen; from[a] = -1;
      heap.push(a, 0);
      let it = 0, found = false;
      while (heap.size && it++ < maxIter) {
        const cur = heap.pop();
        if (closed[cur] === gen) continue;
        closed[cur] = gen;
        if (cur === b) { found = true; break; }
        const gc = g[cur];
        for (let k = this.start[cur]; k < this.start[cur + 1]; k++) {
          const m = this.adj[k];
          if (closed[m] === gen) continue;
          const et = this.edgeTeam[k];
          if (et && et !== code) continue;
          const f = this.flag[k];
          const dx = this.x[m] - this.x[cur], dy = this.y[m] - this.y[cur], dz = this.z[m] - this.z[cur];
          let cost = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (f === F_JUMP) cost = cost * 2.5 + 1;
          else if (f === F_HIGH) cost = cost * 3 + 2;
          else if (f === F_DROP) cost += 1.5;
          else if (f === F_SWIM) cost *= WET_COST;
          else if (f === F_OUT) cost = cost * 3 + 2;
          if (danger) cost += danger[m];
          const ng = gc + cost;
          if (gens[m] !== gen || ng < g[m]) {
            gens[m] = gen; g[m] = ng; from[m] = cur;
            const hx = bx - this.x[m], hy = by - this.y[m], hz = bz - this.z[m];
            heap.push(m, ng + Math.sqrt(hx * hx + hy * hy + hz * hz));
          }
        }
      }
      if (!found) return null;
      const out = [];
      for (let c = b; c >= 0; c = from[c]) out.push(c);
      out.reverse();
      return out;
    }

    edgeFlag(a, b) {
      for (let k = this.start[a]; k < this.start[a + 1]; k++) if (this.adj[k] === b) return this.flag[k];
      return -1;
    }

    setDanger(team, hydrants) {
      const code = TEAM_CODE[team];
      if (!hydrants.length) { this.danger[code] = null; return; }
      const d = this.danger[code] = new Float32Array(this.n);
      for (const b of hydrants) {
        const r = b.def.range, my = b.pos.y + b.h * 0.8;
        const i0 = Math.max(0, Math.floor((b.pos.x - r - this.x0) / NC)), i1 = Math.min(this.nx - 1, Math.floor((b.pos.x + r - this.x0) / NC));
        const j0 = Math.max(0, Math.floor((b.pos.z - r - this.z0) / NC)), j1 = Math.min(this.nz - 1, Math.floor((b.pos.z + r - this.z0) / NC));
        for (let j = j0; j <= j1; j++) {
          for (let i = i0; i <= i1; i++) {
            const c = j * this.nx + i;
            for (let k = this.colStart[c]; k < this.colStart[c + 1]; k++) {
              const x = this.x[k], y = this.y[k] + 1, z = this.z[k];
              if (Math.hypot(x - b.pos.x, y - my, z - b.pos.z) > r) continue;
              if (this.world.clear(b.pos.x, my, b.pos.z, x, y, z)) d[k] += DANGER_COST;
            }
          }
        }
      }
    }
  }

  Nav.F_WALK = F_WALK;
  Nav.F_JUMP = F_JUMP;
  Nav.F_DROP = F_DROP;
  Nav.F_HIGH = F_HIGH;
  Nav.F_SWIM = F_SWIM;
  Nav.F_OUT = F_OUT;
  T.Nav = Nav;

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
