(function (S) {
  'use strict';
  const M = S.METRICS, H = S.House;
  const DX = [0, 1, 0, -1, 1, 1, -1, -1], DZ = [-1, 0, 1, 0, -1, 1, 1, -1];
  const COST = [1, 1, 1, 1, Math.SQRT2, Math.SQRT2, Math.SQRT2, Math.SQRT2];
  const BODY = 0.22, SAMPLE = 0.1, THIN = 0.25, OVERLAP = 0.1;
  const CLUSTER = M.chunk, LONG_RUN = 12, DIRECT_LIMIT = 6000, NEAR_GOAL = 40;
  const dirOf = (dx, dz) => {
    for (let i = 0; i < 8; i++) {
      if (DX[i] === dx && DZ[i] === dz) return i;
    }
    return -1;
  };

  class Heap {
    constructor() {
      this.keys = new Float32Array(1024);
      this.vals = new Int32Array(1024);
      this.size = 0;
    }

    push(f, n) {
      if (this.size === this.keys.length) {
        const keys = new Float32Array(this.size * 2), vals = new Int32Array(this.size * 2);
        keys.set(this.keys);
        vals.set(this.vals);
        this.keys = keys;
        this.vals = vals;
      }
      const { keys, vals } = this;
      let i = this.size++;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (keys[p] <= f) break;
        keys[i] = keys[p];
        vals[i] = vals[p];
        i = p;
      }
      keys[i] = f;
      vals[i] = n;
    }

    pop() {
      const { keys, vals } = this, top = vals[0], size = --this.size;
      if (size > 0) {
        const f = keys[size], n = vals[size];
        let i = 0;
        for (;;) {
          let c = i * 2 + 1;
          if (c >= size) break;
          if (c + 1 < size && keys[c + 1] < keys[c]) c++;
          if (keys[c] >= f) break;
          keys[i] = keys[c];
          vals[i] = vals[c];
          i = c;
        }
        keys[i] = f;
        vals[i] = n;
      }
      return top;
    }
  }

  class Grid {
    constructor(w, d, floors) {
      this.w = w;
      this.d = d;
      this.floors = floors;
      this.size = w * d;
      const total = this.size * floors;
      this.g = new Float32Array(total);
      this.from = new Int32Array(total);
      this.seen = new Uint32Array(total);
      this.round = 0;
      this.links = new Map();
      this.free = [];
      this.pass = [];
      this.heap = new Heap();
    }

    node(k, x, z) {
      return k * this.size + x + z * this.w;
    }

    floorOf(n) {
      return Math.floor(n / this.size);
    }

    tileOf(n) {
      const cell = n % this.size;
      return [cell % this.w, Math.floor(cell / this.w)];
    }

    isFree(k, x, z) {
      return x >= 0 && z >= 0 && x < this.w && z < this.d && this.free[k][x + z * this.w] === 1;
    }

    canGo(k, x, z, dx, dz) {
      const dir = dirOf(dx, dz);
      return dir >= 0 && x >= 0 && z >= 0 && x < this.w && z < this.d && (this.pass[k][x + z * this.w] >> dir & 1) === 1;
    }

    find(start, goal, avoid, limit) {
      const { g, from, seen } = this, heap = this.heap, [gx, gz] = this.tileOf(goal), round = ++this.round, goalFloor = this.floorOf(goal);
      heap.size = 0;
      const guess = n => {
        const cell = n % this.size, x = cell % this.w, z = (cell - x) / this.w, dx = Math.abs(x - gx), dz = Math.abs(z - gz);
        return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz) + Math.abs(this.floorOf(n) - goalFloor) * 2;
      };
      g[start] = 0;
      from[start] = -1;
      seen[start] = round;
      heap.push(guess(start), start);
      let best = start, bestGuess = guess(start), reached = false, opened = 0;
      while (heap.size) {
        const cur = heap.pop();
        if (cur === goal) {
          reached = true;
          best = goal;
          break;
        }
        if (limit && ++opened > limit) break;
        const left = guess(cur);
        if (left < bestGuess) {
          bestGuess = left;
          best = cur;
        }
        const k = this.floorOf(cur), cell = cur % this.size, x = cell % this.w, z = (cell - x) / this.w, bits = this.pass[k][cell];
        const score = g[cur];
        for (let i = 0; i < 8; i++) {
          if (!(bits >> i & 1)) continue;
          const next = k * this.size + x + DX[i] + (z + DZ[i]) * this.w;
          if (avoid && avoid.has(next) && next !== goal) continue;
          const s = score + COST[i];
          if (seen[next] === round && g[next] <= s) continue;
          seen[next] = round;
          g[next] = s;
          from[next] = cur;
          heap.push(s + guess(next), next);
        }
        const links = this.links.get(cur);
        if (links) {
          for (const link of links) {
            const next = link.to;
            if (avoid && avoid.has(next) && next !== goal) continue;
            const s = score + M.stairRun + 2;
            if (seen[next] === round && g[next] <= s) continue;
            seen[next] = round;
            g[next] = s;
            from[next] = cur;
            heap.push(s + guess(next), next);
          }
        }
      }
      const nodes = [];
      for (let n = best; n !== -1; n = from[n]) nodes.push(n);
      nodes.reverse();
      return { nodes, reached };
    }

    clear(k, ax, az, bx, bz, avoid) {
      const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      if (len < 1e-6) return true;
      const px = -dz / len * BODY, pz = dx / len * BODY, count = Math.ceil(len / SAMPLE);
      for (const off of [0, 1, -1]) {
        let tx = Math.floor(ax), tz = Math.floor(az);
        for (let i = 0; i <= count; i++) {
          const t = i / count, x = Math.floor(ax + dx * t + px * off), z = Math.floor(az + dz * t + pz * off);
          if (x === tx && z === tz) continue;
          if (Math.abs(x - tx) > 1 || Math.abs(z - tz) > 1 || !this.canGo(k, tx, tz, x - tx, z - tz)) return false;
          if (avoid && avoid.has(this.node(k, x, z))) return false;
          tx = x;
          tz = z;
        }
      }
      return true;
    }

    route(start, nodes, avoid) {
      const out = [];
      let ax = start.x, az = start.z, k = start.floor, i = 0;
      const center = n => {
        const [x, z] = this.tileOf(n);
        return [x + 0.5, z + 0.5];
      };
      const add = (x, z, floor, slope) => {
        out.push({ x, z, floor, slope: slope || 0 });
        ax = x;
        az = z;
      };
      while (i < nodes.length - 1) {
        const cur = nodes[i], next = nodes[i + 1];
        if (this.floorOf(cur) !== this.floorOf(next)) {
          const link = this.links.get(cur).find(l => l.to === next), col = link.col, [cx, cz] = center(cur), [nx, nz] = center(next);
          if (Math.hypot(ax - cx, az - cz) > 1e-3) add(cx, cz, k);
          if (link.up) {
            add(col.start[0], col.start[1], k);
            add(col.end[0], col.end[1], k + 1, 1);
            k += 1;
          } else {
            add(col.end[0], col.end[1], k);
            add(col.start[0], col.start[1], k - 1, -1);
            k -= 1;
          }
          add(nx, nz, k);
          i += 1;
          continue;
        }
        let far = i + 1, last = i + 1;
        while (last < nodes.length - 1 && this.floorOf(nodes[last + 1]) === k) last++;
        let lo = i + 1, hi = last;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1, [jx, jz] = center(nodes[mid]);
          if (this.clear(k, ax, az, jx, jz, avoid)) {
            far = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        const [fx, fz] = center(nodes[far]);
        add(fx, fz, k);
        i = far;
      }
      return out;
    }

    nearestFree(k, x, z) {
      const tx = Math.floor(x), tz = Math.floor(z);
      for (let r = 0; r < Math.max(this.w, this.d); r++) {
        for (let dz = -r; dz <= r; dz++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dz)) === r && this.isFree(k, tx + dx, tz + dz)) return this.node(k, tx + dx, tz + dz);
          }
        }
      }
      return -1;
    }

    fillBits(k, stepFn) {
      const { w, d } = this, free = this.free[k], pass = this.pass[k];
      for (let z = 0; z < d; z++) {
        for (let x = 0; x < w; x++) {
          let out = 0;
          for (let i = 0; i < 4; i++) {
            if (stepFn(x, z, DX[i], DZ[i])) out |= 1 << i;
          }
          for (let i = 4; i < 8; i++) {
            const dx = DX[i], dz = DZ[i], tx = x + dx, tz = z + dz;
            if (tx >= 0 && tz >= 0 && tx < w && tz < d && free[tx + tz * w] && stepFn(x, z, dx, 0) && stepFn(x, z, 0, dz) && stepFn(tx, z, 0, dz) && stepFn(x, tz, dx, 0)) out |= 1 << i;
          }
          pass[x + z * w] = out;
        }
      }
    }
  }

  class Nav extends Grid {
    constructor(h) {
      super(h.w, h.d, h.floors.length);
      this.h = h;
      this.rebuild();
    }

    rebuild() {
      const h = this.h, { w, d } = this;
      this.free = [];
      this.thin = new Set();
      this.links = new Map();
      for (let k = 0; k < this.floors; k++) {
        const f = H.floorOf(h, k), free = new Uint8Array(w * d);
        H.rooms(h, k);
        for (let z = 0; z < d; z++) {
          for (let x = 0; x < w; x++) {
            const c = (x + z * w) * 4, floored = f.paint[c] || f.paint[c + 1] || f.paint[c + 2] || f.paint[c + 3];
            const diagonal = f.walls.has(H.keyOf(h, x, z, x + 1, z + 1)) || f.walls.has(H.keyOf(h, x, z + 1, x + 1, z));
            free[x + z * w] = (k === 0 || floored) && !diagonal ? 1 : 0;
          }
        }
        this.free.push(free);
      }
      for (const item of h.items) this.blockItem(item);
      for (const stair of h.stairs) {
        for (const [x, z] of H.stairTiles(stair)) {
          this.free[stair.floor][x + z * w] = 0;
          if (stair.floor + 1 < this.floors) this.free[stair.floor + 1][x + z * w] = 0;
        }
      }
      this.pass = this.free.map(() => new Uint8Array(w * d));
      for (let k = 0; k < this.floors; k++) this.fillBits(k, (x, z, dx, dz) => this.step(k, x, z, dx, dz));
      for (const stair of h.stairs) {
        for (const col of H.stairColumns(stair)) {
          const a = this.node(stair.floor, col.entry[0], col.entry[1]), b = this.node(stair.floor + 1, col.exit[0], col.exit[1]);
          if (!this.isFree(stair.floor, col.entry[0], col.entry[1]) || !this.isFree(stair.floor + 1, col.exit[0], col.exit[1])) continue;
          this.addLink(a, { to: b, col, up: true });
          this.addLink(b, { to: a, col, up: false });
        }
      }
    }

    addLink(n, link) {
      if (!this.links.has(n)) this.links.set(n, []);
      this.links.get(n).push(link);
    }

    blockItem(item) {
      const kind = S.KINDS[S.KIND_ID[item.kind]];
      if (kind.opening || item.seg || !kind.w) return;
      const free = this.free[item.floor], turned = item.facing % 2 === 1, hw = (turned ? kind.d : kind.w) / 2, hd = (turned ? kind.w : kind.d) / 2;
      if (Math.min(kind.w, kind.d) < THIN) {
        const x0 = Math.round(item.x - hw), x1 = Math.round(item.x + hw), z0 = Math.round(item.z - hd), z1 = Math.round(item.z + hd);
        if (hw > hd) this.thin.add(this.edgeKey(item.floor, x0, z0, x1, z0));
        else this.thin.add(this.edgeKey(item.floor, x0, z0, x0, z1));
        return;
      }
      const lowX = Math.floor(item.x - hw + OVERLAP), highX = Math.ceil(item.x + hw - OVERLAP), lowZ = Math.floor(item.z - hd + OVERLAP), highZ = Math.ceil(item.z + hd - OVERLAP);
      for (let z = lowZ; z < highZ; z++) {
        for (let x = lowX; x < highX; x++) {
          if (x >= 0 && z >= 0 && x < this.w && z < this.d) free[x + z * this.w] = 0;
        }
      }
    }

    edgeKey(k, x0, z0, x1, z1) {
      return k + '|' + H.keyOf(this.h, x0, z0, x1, z1);
    }

    edgeOpen(k, x, z, dx, dz) {
      let x0 = x, z0 = z, x1 = x, z1 = z;
      if (dx === 1) { x0 = x + 1; x1 = x + 1; z1 = z + 1; } else if (dx === -1) { z1 = z + 1; } else if (dz === 1) { z0 = z + 1; z1 = z + 1; x1 = x + 1; } else { x1 = x + 1; }
      if (x0 < 0 || z0 < 0 || x1 > this.w || z1 > this.d) return true;
      if (this.thin.has(this.edgeKey(k, x0, z0, x1, z1))) return false;
      const seg = H.wallAt(this.h, k, x0, z0, x1, z1);
      return !seg || (!!seg.cut && seg.cut.y0 === 0);
    }

    step(k, x, z, dx, dz) {
      return this.isFree(k, x + dx, z + dz) && this.edgeOpen(k, x, z, dx, dz);
    }

    groundY(k, x, z, outside) {
      const h = this.h;
      if (k > 0) return H.floorY(h, k);
      const tx = Math.floor(x), tz = Math.floor(z);
      if (tx < 0 || tz < 0 || tx >= this.w || tz >= this.d) return outside === undefined ? h.base : outside;
      const f = h.floors[0], c = (tx + tz * this.w) * 4, built = f.paint[c] || f.paint[c + 1] || f.paint[c + 2] || f.paint[c + 3] || f.tri[c] > 0 || f.tri[c + 1] > 0 || f.tri[c + 2] > 0 || f.tri[c + 3] > 0;
      return built ? H.floorY(h, 0) : h.base;
    }

    entryOf(floor) {
      for (const stair of this.h.stairs) {
        if (stair.floor === floor - 1 || stair.floor === 0) return H.stairColumns(stair)[0].entry;
      }
      return null;
    }
  }

  class TownNav extends Grid {
    constructor(terrain, lots, blocked) {
      super(M.town, M.town, 1);
      this.terrain = terrain;
      this.lots = lots;
      this.blocked = blocked || [];
      this.lotMap = new Uint8Array(this.size);
      for (const lot of lots) {
        for (let z = lot.z; z < lot.z + lot.d; z++) {
          for (let x = lot.x; x < lot.x + lot.w; x++) this.lotMap[x + z * this.w] = lot.index + 1;
        }
      }
      this.rebuild();
    }

    lotAt(x, z) {
      const tx = Math.floor(x), tz = Math.floor(z);
      if (tx < 0 || tz < 0 || tx >= this.w || tz >= this.d) return null;
      const id = this.lotMap[tx + tz * this.w];
      return id ? this.lots[id - 1] : null;
    }

    rebuild() {
      const { w, d, terrain, lotMap } = this, free = new Uint8Array(this.size);
      for (let z = 0; z < d; z++) {
        for (let x = 0; x < w; x++) {
          const at = x + z * w, id = lotMap[at];
          if (id) {
            const lot = this.lots[id - 1];
            free[at] = lot.nav.free[0][x - lot.x + (z - lot.z) * lot.w];
          } else {
            const paint = terrain.paint[at];
            free[at] = paint === S.PAINT.seabed || paint === S.PAINT.rock ? 0 : 1;
          }
        }
      }
      for (const [x, z] of this.blocked) free[x + z * w] = 0;
      this.free = [free];
      this.pass = [new Uint8Array(this.size)];
      this.fillBits(0, (x, z, dx, dz) => this.groundStep(x, z, dx, dz));
      this.buildPortals();
    }

    groundStep(x, z, dx, dz) {
      const tx = x + dx, tz = z + dz, w = this.w;
      if (tx < 0 || tz < 0 || tx >= w || tz >= this.d || !this.free[0][tx + tz * w]) return false;
      const a = this.lotMap[x + z * w], b = this.lotMap[tx + tz * w];
      if (!a && !b) return true;
      if (a) {
        const lot = this.lots[a - 1];
        if (!lot.nav.edgeOpen(0, x - lot.x, z - lot.z, dx, dz)) return false;
      }
      if (b && b !== a) {
        const lot = this.lots[b - 1];
        if (!lot.nav.edgeOpen(0, tx - lot.x, tz - lot.z, -dx, -dz)) return false;
      }
      return true;
    }

    buildPortals() {
      const n = M.town / CLUSTER, px = [], pz = [], mate = [], home = [];
      const lists = Array.from({ length: n * n }, () => []);
      const add = (x, z, cluster) => {
        px.push(x);
        pz.push(z);
        home.push(cluster);
        lists[cluster].push(px.length - 1);
        return px.length - 1;
      };
      const pair = (ax, az, ca, bx, bz, cb) => {
        const a = add(ax, az, ca), b = add(bx, bz, cb);
        mate[a] = b;
        mate[b] = a;
      };
      const runs = (from, to, open, put) => {
        let start = -1;
        for (let t = from; t <= to; t++) {
          const on = t < to && open(t);
          if (on && start < 0) start = t;
          if (!on && start >= 0) {
            const len = t - start;
            if (len >= LONG_RUN) {
              put(start + Math.floor(len / 4));
              put(start + Math.floor(len * 3 / 4));
            } else {
              put(start + Math.floor(len / 2));
            }
            start = -1;
          }
        }
      };
      for (let cz = 0; cz < n; cz++) {
        for (let cx = 0; cx < n; cx++) {
          const c = cx + cz * n, x0 = cx * CLUSTER, z0 = cz * CLUSTER;
          if (cx + 1 < n) {
            const x = x0 + CLUSTER - 1;
            runs(z0, z0 + CLUSTER, z => this.canGo(0, x, z, 1, 0) && this.canGo(0, x + 1, z, -1, 0), z => pair(x, z, c, x + 1, z, c + 1));
          }
          if (cz + 1 < n) {
            const z = z0 + CLUSTER - 1;
            runs(x0, x0 + CLUSTER, x => this.canGo(0, x, z, 0, 1) && this.canGo(0, x, z + 1, 0, -1), x => pair(x, z, c, x, z + 1, c + n));
          }
        }
      }
      this.portalX = px;
      this.portalZ = pz;
      this.portalMate = mate;
      this.portalHome = home;
      this.clusterPortals = lists;
      this.clusterEdges = new Array(n * n).fill(null);
      this.flood = new Float32Array(CLUSTER * CLUSTER);
      this.queueA = new Int32Array(CLUSTER * CLUSTER * 8);
      this.queueB = new Int32Array(CLUSTER * CLUSTER * 8);
      this.portalG = new Float32Array(px.length + 2);
      this.portalFrom = new Int32Array(px.length + 2);
      this.portalSeen = new Uint32Array(px.length + 2);
      this.portalRound = 0;
    }

    clusterOf(x, z) {
      const n = M.town / CLUSTER;
      return S.clamp(Math.floor(x / CLUSTER), 0, n - 1) + S.clamp(Math.floor(z / CLUSTER), 0, n - 1) * n;
    }

    floodFrom(x, z) {
      const n = M.town / CLUSTER, c = this.clusterOf(x, z), x0 = (c % n) * CLUSTER, z0 = Math.floor(c / n) * CLUSTER, flood = this.flood;
      const w = this.w, pass = this.pass[0], straight = this.queueA, slant = this.queueB;
      let sHead = 0, sTail = 0, dHead = 0, dTail = 0;
      flood.fill(Infinity);
      flood[(x - x0) + (z - z0) * CLUSTER] = 0;
      straight[sTail++] = x + z * w;
      while (sHead < sTail || dHead < dTail) {
        let cur;
        if (dHead >= dTail) cur = straight[sHead++];
        else if (sHead >= sTail) cur = slant[dHead++];
        else {
          const a = straight[sHead], b = slant[dHead], ax = a % w, ad = flood[(ax - x0) + ((a - ax) / w - z0) * CLUSTER], bx = b % w, bd = flood[(bx - x0) + ((b - bx) / w - z0) * CLUSTER];
          if (ad <= bd) cur = straight[sHead++];
          else cur = slant[dHead++];
        }
        const tx = cur % w, tz = (cur - tx) / w, d = flood[(tx - x0) + (tz - z0) * CLUSTER], bits = pass[cur];
        for (let i = 0; i < 8; i++) {
          if (!(bits >> i & 1)) continue;
          const nx = tx + DX[i], nz = tz + DZ[i];
          if (nx < x0 || nz < z0 || nx >= x0 + CLUSTER || nz >= z0 + CLUSTER) continue;
          const at = (nx - x0) + (nz - z0) * CLUSTER, s = d + COST[i];
          if (s < flood[at] - 1e-4) {
            flood[at] = s;
            if (i < 4) straight[sTail++] = nx + nz * w;
            else slant[dTail++] = nx + nz * w;
          }
        }
      }
      return { c, x0, z0 };
    }

    edgesOf(c) {
      if (this.clusterEdges[c]) return this.clusterEdges[c];
      const list = this.clusterPortals[c], edges = new Map();
      for (const p of list) {
        const { x0, z0 } = this.floodFrom(this.portalX[p], this.portalZ[p]), out = [];
        for (const q of list) {
          if (q === p) continue;
          const d = this.flood[(this.portalX[q] - x0) + (this.portalZ[q] - z0) * CLUSTER];
          if (d < Infinity) out.push([q, d]);
        }
        edges.set(p, out);
      }
      this.clusterEdges[c] = edges;
      return edges;
    }

    plan(sx, sz, gx, gz) {
      const stx = Math.floor(sx), stz = Math.floor(sz), gtx = Math.floor(gx), gtz = Math.floor(gz);
      const dist = Math.hypot(stx - gtx, stz - gtz);
      if (dist < NEAR_GOAL) {
        const near = this.find(stx + stz * this.w, gtx + gtz * this.w, null, DIRECT_LIMIT);
        if (near.reached) return { points: [[gtx + 0.5, gtz + 0.5]], reached: true, near: true };
      }
      const startFlood = this.floodFrom(stx, stz), starts = [];
      for (const p of this.clusterPortals[startFlood.c]) {
        const d = this.flood[(this.portalX[p] - startFlood.x0) + (this.portalZ[p] - startFlood.z0) * CLUSTER];
        if (d < Infinity) starts.push([p, d]);
      }
      if (startFlood.c === this.clusterOf(gtx, gtz)) {
        const d = this.flood[(gtx - startFlood.x0) + (gtz - startFlood.z0) * CLUSTER];
        if (d < Infinity) return { points: [[gtx + 0.5, gtz + 0.5]], reached: true, near: true };
      }
      const goalFlood = this.floodFrom(gtx, gtz), ends = new Map();
      for (const p of this.clusterPortals[goalFlood.c]) {
        const d = this.flood[(this.portalX[p] - goalFlood.x0) + (this.portalZ[p] - goalFlood.z0) * CLUSTER];
        if (d < Infinity) ends.set(p, d);
      }
      const G = this.portalG, F = this.portalFrom, seen = this.portalSeen, round = ++this.portalRound, heap = this.heap, px = this.portalX, pz = this.portalZ;
      heap.size = 0;
      const guess = p => {
        const dx = Math.abs(px[p] - gtx), dz = Math.abs(pz[p] - gtz);
        return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
      };
      for (const [p, d] of starts) {
        seen[p] = round;
        G[p] = d;
        F[p] = -1;
        heap.push(d + guess(p), p);
      }
      let best = -1, bestCost = Infinity;
      while (heap.size) {
        const f = heap.keys[0], cur = heap.pop();
        if (f >= bestCost) break;
        const here = G[cur];
        if (ends.has(cur)) {
          const total = here + ends.get(cur);
          if (total < bestCost) {
            bestCost = total;
            best = cur;
          }
        }
        const visit = (next, cost) => {
          const s = here + cost;
          if (seen[next] === round && G[next] <= s) return;
          seen[next] = round;
          G[next] = s;
          F[next] = cur;
          heap.push(s + guess(next), next);
        };
        visit(this.portalMate[cur], 1);
        const inner = this.edgesOf(this.portalHome[cur]).get(cur);
        for (const [q, d] of inner) visit(q, d);
      }
      if (best < 0) return { points: [], reached: false };
      const chain = [];
      for (let p = best; p !== -1; p = F[p]) chain.push([px[p] + 0.5, pz[p] + 0.5]);
      chain.reverse();
      chain.push([gtx + 0.5, gtz + 0.5]);
      return { points: chain, reached: true, near: false, cost: bestCost };
    }
  }

  S.Grid = Grid;
  S.Nav = Nav;
  S.TownNav = TownNav;
})(globalThis.Sims98 = globalThis.Sims98 || {});
