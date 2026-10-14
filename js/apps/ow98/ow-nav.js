(function (O) {
  'use strict';
  const NC = 1;
  const CLEAR = 0.42;
  const MAXSTEP = 0.62;
  const F_JUMP = 1, F_DROP = 2;

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
      this.build();
    }

    colIndex(x, z) {
      const i = Math.floor((x - this.x0) / NC), j = Math.floor((z - this.z0) / NC);
      if (i < 0 || j < 0 || i >= this.nx || j >= this.nz) return -1;
      return j * this.nx + i;
    }

    surfaces(x, z) {
      const w = this.world;
      const list = w.near(x - 0.01, z - 0.01, x + 0.01, z + 0.01, this._l || (this._l = []));
      const tops = [];
      for (const s of list) {
        if (s.nomove || s.role) continue;
        if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
        tops.push(O.topAt(s, x, z));
      }
      tops.sort((a, b) => b - a);
      const res = [];
      for (const t of tops) {
        if (res.length && Math.abs(res[res.length - 1] - t) < 0.3) continue;
        let ok = true;
        for (const s of list) {
          if (s.nomove || s.role) continue;
          if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
          const top = O.topAt(s, x, z);
          if (top > t + 0.05 && s.y0 < t + 1.9) { ok = false; break; }
        }
        if (ok && this.clearance(x, t, z)) res.push(t);
      }
      return res;
    }

    clearance(x, y, z) {
      const w = this.world;
      const list = w.near(x - CLEAR, z - CLEAR, x + CLEAR, z + CLEAR, this._c || (this._c = []));
      for (const s of list) {
        if (s.nomove || s.role) continue;
        if (s.y0 > y + 1.8) continue;
        const cx = x < s.x0 ? s.x0 : x > s.x1 ? s.x1 : x, cz = z < s.z0 ? s.z0 : z > s.z1 ? s.z1 : z;
        if ((cx - x) * (cx - x) + (cz - z) * (cz - z) > CLEAR * CLEAR) continue;
        const top = O.topAt(s, cx, cz);
        if (top > y + O.World.STEP && s.y0 < y + 1.8) return false;
      }
      return true;
    }

    build() {
      const nx = this.nx, nz = this.nz;
      const xs = [], ys = [], zs = [], cols = [];
      this.colStart = new Int32Array(nx * nz + 1);
      for (let j = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++) {
          const c = j * nx + i;
          this.colStart[c] = xs.length;
          const x = this.x0 + (i + 0.5) * NC, z = this.z0 + (j + 0.5) * NC;
          const tops = this.surfaces(x, z);
          for (let k = tops.length - 1; k >= 0; k--) { xs.push(x); ys.push(tops[k]); zs.push(z); cols.push(c); }
        }
      }
      this.colStart[nx * nz] = xs.length;
      const n = xs.length;
      this.n = n;
      this.x = Float32Array.from(xs); this.y = Float32Array.from(ys); this.z = Float32Array.from(zs);
      this.col = Int32Array.from(cols);
      this.role = new Int8Array(n);
      this.team = new Int8Array(n).fill(-1);
      this.spawnNodes = this.map.spawns.map(sp => {
        const [x0, z0, x1, z1] = sp.room;
        const list = [];
        for (let k = 0; k < n; k++) {
          if (this.x[k] > x0 && this.x[k] < x1 && this.z[k] > z0 && this.z[k] < z1 && Math.abs(this.y[k] - sp.y) < 2) { list.push(k); this.role[k] = 1; }
        }
        return list;
      });
      const adj = [], flags = [], start = new Int32Array(n + 1);
      const w = this.world;
      const findNear = (c, y) => {
        if (c < 0) return -1;
        let best = -1, bd = MAXSTEP + 1e-3;
        for (let k = this.colStart[c]; k < this.colStart[c + 1]; k++) {
          const d = Math.abs(this.y[k] - y);
          if (d < bd) { bd = d; best = k; }
        }
        return best;
      };
      for (let a = 0; a < n; a++) {
        start[a] = adj.length;
        const c = this.col[a], ci = c % nx, cj = (c / nx) | 0;
        const ya = this.y[a];
        for (let dj = -1; dj <= 1; dj++) {
          for (let di = -1; di <= 1; di++) {
            if (!di && !dj) continue;
            const i2 = ci + di, j2 = cj + dj;
            if (i2 < 0 || j2 < 0 || i2 >= nx || j2 >= nz) continue;
            const c2 = j2 * nx + i2;
            if (di && dj) {
              if (findNear(cj * nx + i2, ya) < 0 || findNear(j2 * nx + ci, ya) < 0) continue;
            }
            let hasLevel = false;
            for (let b = this.colStart[c2]; b < this.colStart[c2 + 1]; b++) {
              const dy = this.y[b] - ya;
              if (Math.abs(dy) <= MAXSTEP) {
                hasLevel = true;
                const my = Math.max(ya, this.y[b]) + 0.7;
                const ddx = this.x[b] - this.x[a], ddz = this.z[b] - this.z[a], dl = Math.hypot(ddx, ddz);
                if (w.raycast(this.x[a], my, this.z[a], ddx / dl, 0, ddz / dl, dl, true)) continue;
                adj.push(b); flags.push(0);
              }
            }
            if (!hasLevel && !(di && dj)) {
              for (let b = this.colStart[c2]; b < this.colStart[c2 + 1]; b++) {
                const dy = this.y[b] - ya;
                if (dy < -MAXSTEP && dy > -9) {
                  const ddx = this.x[b] - this.x[a], ddz = this.z[b] - this.z[a], dl = Math.hypot(ddx, ddz);
                  if (w.raycast(this.x[a], ya + 0.8, this.z[a], ddx / dl, 0, ddz / dl, dl, true)) continue;
                  let ok = true;
                  for (let b2 = this.colStart[c2]; b2 < this.colStart[c2 + 1]; b2++) if (this.y[b2] > this.y[b] + 0.3 && this.y[b2] < ya + 1.8) ok = false;
                  if (ok) { adj.push(b); flags.push(F_DROP); }
                } else if (dy > MAXSTEP && dy <= 1.25 && !this.noJump) {
                  const ddx = this.x[b] - this.x[a], ddz = this.z[b] - this.z[a], dl = Math.hypot(ddx, ddz);
                  if (w.raycast(this.x[a], this.y[b] + 0.7, this.z[a], ddx / dl, 0, ddz / dl, dl, true)) continue;
                  if (w.ceilingAt(this.x[a], this.z[a], ya, 0.3, -1) < ya + 3.2) continue;
                  adj.push(b); flags.push(F_JUMP);
                }
              }
            }
          }
        }
      }
      start[n] = adj.length;
      this.start = start;
      this.adj = Int32Array.from(adj);
      this.flag = Uint8Array.from(flags);
      this.g = new Float32Array(n);
      this.from = new Int32Array(n);
      this.gen = new Uint32Array(n);
      this.closed = new Uint32Array(n);
      this.curGen = 0;
      this.heap = new Heap(Math.max(16, adj.length + n));
      this.labelComponents();
    }

    labelComponents() {
      const n = this.n;
      const comp = new Int32Array(n).fill(-1);
      const stack = new Int32Array(n);
      let id = 0;
      const radj = new Array(n);
      for (let a = 0; a < n; a++) radj[a] = [];
      for (let a = 0; a < n; a++) for (let k = this.start[a]; k < this.start[a + 1]; k++) radj[this.adj[k]].push(a);
      for (let s = 0; s < n; s++) {
        if (comp[s] >= 0) continue;
        let sp = 0; stack[sp++] = s; comp[s] = id;
        while (sp) {
          const a = stack[--sp];
          for (let k = this.start[a]; k < this.start[a + 1]; k++) { const b = this.adj[k]; if (comp[b] < 0) { comp[b] = id; stack[sp++] = b; } }
          for (const b of radj[a]) if (comp[b] < 0) { comp[b] = id; stack[sp++] = b; }
        }
        id++;
      }
      this.comp = comp;
      const sizes = new Int32Array(id);
      for (let a = 0; a < n; a++) sizes[comp[a]]++;
      this.compSize = sizes;
    }

    setTeams(attTeam, stage) {
      this.team.fill(-1);
      this.map.spawns.forEach((sp, i) => {
        if (stage < sp.stage[0] || stage > sp.stage[1]) return;
        const t = sp.role === 'att' ? attTeam : 1 - attTeam;
        for (const k of this.spawnNodes[i]) this.team[k] = t;
      });
    }

    nearest(x, y, z, maxR = 4) {
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
              const dy = this.y[k] - y;
              const pen = dy > 1.2 ? 30 + dy * 4 : dy < -3 ? 6 + Math.abs(dy) : Math.abs(dy) * 1.5;
              const d = (this.x[k] - x) ** 2 + (this.z[k] - z) ** 2 + pen * pen;
              if (d < bd) { bd = d; best = k; }
            }
          }
        }
        if (best >= 0 && r >= 1) break;
      }
      return best;
    }

    path(a, b, team, maxIter = 40000) {
      if (a < 0 || b < 0) return null;
      if (a === b) return [a];
      if (this.comp[a] !== this.comp[b]) return null;
      if (this.team[b] >= 0 && this.team[b] !== team) return null;
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
          const tm = this.team[m];
          if (tm >= 0 && tm !== team) continue;
          const f = this.flag[k];
          const dx = this.x[m] - this.x[cur], dy = this.y[m] - this.y[cur], dz = this.z[m] - this.z[cur];
          let cost = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (f === F_JUMP) cost = cost * 2.5 + 1;
          else if (f === F_DROP) cost += 1.5;
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

    walkLine(ax, ay, az, bx, bz) {
      const d = Math.hypot(bx - ax, bz - az);
      const n = Math.max(1, Math.ceil(d / 0.5));
      let y = ay;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        const c = this.colIndex(x, z);
        if (c < 0) return false;
        let found = false, ny = 0;
        for (let k = this.colStart[c]; k < this.colStart[c + 1]; k++) {
          if (Math.abs(this.y[k] - y) <= 0.55) { found = true; ny = this.y[k]; break; }
        }
        if (!found) return false;
        y = ny;
      }
      return true;
    }

    randomNear(x, y, z, r, rand, tries = 12) {
      const base = this.nearest(x, y, z, 6);
      for (let i = 0; i < tries; i++) {
        const a = rand() * Math.PI * 2, d = rand() * r;
        const k = this.nearest(x + Math.cos(a) * d, y, z + Math.sin(a) * d, 2);
        if (k >= 0 && base >= 0 && this.comp[k] === this.comp[base] && Math.abs(this.y[k] - y) < 4 && this.role[k] === 0) return k;
      }
      return base;
    }
  }
  Nav.F_JUMP = F_JUMP;
  Nav.F_DROP = F_DROP;
  O.Nav = Nav;
})(globalThis.Ow98 = globalThis.Ow98 || {});
