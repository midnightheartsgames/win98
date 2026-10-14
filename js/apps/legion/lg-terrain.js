(function (L) {
  'use strict';

  const GRID = 8;

  class Terrain {
    constructor(key, meta, heights, forest, grass, opts) {
      this.key = key;
      this.meta = meta;
      this.opts = opts || {};
      this.W = meta.W;
      this.cell = L.CELL;
      this.size = (this.W - 1) * L.CELL;
      this.h = heights;
      this.forest = forest;
      this.forestN = meta.forestMap || 256;
      this.grass = grass;
      this.grassN = meta.grassMap || 0;
      this.hscale = this.opts.hscale || L.HSCALE;
      this.waterLevel = this.opts.water ? this.opts.water.level : null;
      this.fordDepth = this.opts.water ? (this.opts.water.ford || 1.6) : 0;
      if (this.opts.carve) this.carve(this.opts.carve);
      this.buildTypes();
      this.buildGrid();
    }

    carve(c) {
      const W = this.W, pts = c.pts, half = c.width, bank = c.bank || 8;
      const bed = (c.bed != null ? c.bed : this.waterLevel - c.depth) / this.hscale;
      for (let iz = 0; iz < W; iz++) {
        for (let ix = 0; ix < W; ix++) {
          const x = ix * this.cell, z = iz * this.cell;
          let d = Infinity;
          for (let i = 0; i < pts.length - 1; i++) {
            const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
            const dx = bx - ax, dz = bz - az;
            const t = L.clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
            d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t));
          }
          if (d > half + bank) continue;
          const k = d < half ? 1 - (d / half) * (d / half) * 0.35 : 0.65 * (1 - L.smooth((d - half) / bank));
          const i = iz * W + ix;
          const target = this.h[i] + (bed - this.h[i]) * k;
          if (target < this.h[i]) this.h[i] = target;
        }
      }
    }

    heightAt(x, z) {
      const W = this.W;
      const fx = L.clamp(x / this.cell, 0, W - 1.001);
      const fz = L.clamp(z / this.cell, 0, W - 1.001);
      const ix = fx | 0, iz = fz | 0;
      const tx = fx - ix, tz = fz - iz;
      const i = iz * W + ix;
      const h00 = this.h[i], h10 = this.h[i + 1], h01 = this.h[i + W], h11 = this.h[i + W + 1];
      const a = h00 + (h10 - h00) * tx, b = h01 + (h11 - h01) * tx;
      return (a + (b - a) * tz) * this.hscale;
    }

    rawAt(ix, iz) {
      const W = this.W;
      ix = L.clamp(ix, 0, W - 1);
      iz = L.clamp(iz, 0, W - 1);
      return this.h[iz * W + ix] * this.hscale;
    }

    normalAt(x, z) {
      const e = this.cell;
      const hx = this.heightAt(x + e, z) - this.heightAt(x - e, z);
      const hz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
      const nx = -hx, ny = 2 * e, nz = -hz;
      const l = Math.hypot(nx, ny, nz);
      return [nx / l, ny / l, nz / l];
    }

    slopeAt(x, z) {
      const e = this.cell;
      const hx = (this.heightAt(x + e, z) - this.heightAt(x - e, z)) / (2 * e);
      const hz = (this.heightAt(x, z + e) - this.heightAt(x, z - e)) / (2 * e);
      return Math.hypot(hx, hz);
    }

    forestAt(x, z) {
      const n = this.forestN;
      const fx = L.clamp(Math.floor(x / this.size * n), 0, n - 1);
      const fz = L.clamp(Math.floor(z / this.size * n), 0, n - 1);
      return this.forest[fz * n + fx];
    }

    grassAt(x, z) {
      if (!this.grass || !this.grassN) return 0;
      const n = this.grassN;
      const fx = L.clamp(Math.floor(x / this.size * n), 0, n - 1);
      const fz = L.clamp(Math.floor(z / this.size * n), 0, n - 1);
      return this.grass[fz * n + fx];
    }

    buildTypes() {
      const n = this.W - 1;
      this.tn = n;
      this.types = new Uint8Array(n * n);
      const o = this.opts;
      const forestOn = o.forest !== false;
      const dense = o.dense || 150, light = o.light || 70;
      const hill = o.hillSlope || 0.36;
      const marshBelow = o.marsh ? o.marsh.below : null;
      for (let z = 0; z < n; z++) {
        for (let x = 0; x < n; x++) {
          const wx = (x + 0.5) * this.cell, wz = (z + 0.5) * this.cell;
          const h = this.heightAt(wx, wz);
          let t = L.T.plain;
          const f = forestOn ? this.forestAt(wx, wz) : 0;
          if (f > dense) t = L.T.densewood;
          else if (f > light) t = L.T.lightwood;
          if (t === L.T.plain && this.slopeAt(wx, wz) > hill) t = L.T.hill;
          if (marshBelow != null && h < marshBelow * this.hscale && t !== L.T.densewood) t = L.T.marsh;
          if (this.waterLevel != null && h < this.waterLevel) t = h < this.waterLevel - this.fordDepth ? L.T.water : L.T.ford;
          this.types[z * n + x] = t;
        }
      }
      for (const ov of o.overrides || []) this.applyOverride(ov);
    }

    applyOverride(ov) {
      const n = this.tn;
      const t = L.T[ov.type];
      for (let z = 0; z < n; z++) {
        for (let x = 0; x < n; x++) {
          const wx = (x + 0.5) * this.cell, wz = (z + 0.5) * this.cell;
          let inside = false;
          if (ov.circle) inside = L.dist(wx, wz, ov.circle[0], ov.circle[1]) < ov.circle[2];
          else if (ov.rect) inside = wx >= ov.rect[0] && wz >= ov.rect[1] && wx <= ov.rect[2] && wz <= ov.rect[3];
          else if (ov.poly) inside = pointInPoly(wx, wz, ov.poly);
          if (!inside) continue;
          const cur = this.types[z * n + x];
          if (ov.only && !ov.only.includes(L.TERRAIN[cur].id)) continue;
          this.types[z * n + x] = t;
        }
      }
    }

    typeAt(x, z) {
      const n = this.tn;
      const cx = L.clamp(Math.floor(x / this.cell), 0, n - 1);
      const cz = L.clamp(Math.floor(z / this.cell), 0, n - 1);
      return this.types[cz * n + cx];
    }

    effAt(x, z, clsName) {
      return L.CLASSES[clsName].eff[this.typeAt(x, z)] / 100;
    }

    speedFactor(x, z, clsName) {
      const cls = L.CLASSES[clsName];
      const t = this.typeAt(x, z);
      const c = cls.move[t];
      if (c >= 999) return 0;
      let f = cls.move[0] / c;
      const s = this.slopeAt(x, z);
      if (s > 0.12) f *= L.clamp(1 - (s - 0.12) * 0.9, 0.55, 1);
      return f;
    }

    passable(x, z, clsName) {
      if (x < 2 || z < 2 || x > this.size - 2 || z > this.size - 2) return false;
      return L.CLASSES[clsName].move[this.typeAt(x, z)] < 999;
    }

    buildGrid() {
      const g = Math.ceil(this.size / GRID);
      this.gn = g;
      this.blocked = new Uint8Array(g * g);
      for (let z = 0; z < g; z++) {
        for (let x = 0; x < g; x++) {
          const t = this.typeAt((x + 0.5) * GRID, (z + 0.5) * GRID);
          if (t === L.T.water) this.blocked[z * g + x] = 1;
        }
      }
      this.anyBlocked = this.blocked.some(v => v);
    }

    lineClear(ax, az, bx, bz) {
      const d = L.dist(ax, az, bx, bz);
      const steps = Math.max(1, Math.ceil(d / (GRID * 0.5)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        const gx = L.clamp(Math.floor(x / GRID), 0, this.gn - 1), gz = L.clamp(Math.floor(z / GRID), 0, this.gn - 1);
        if (this.blocked[gz * this.gn + gx]) return false;
      }
      return true;
    }

    path(ax, az, bx, bz, clsName) {
      if (this.lineClear(ax, az, bx, bz)) return [[bx, bz]];
      const g = this.gn;
      const cls = L.CLASSES[clsName];
      const sx = L.clamp(Math.floor(ax / GRID), 0, g - 1), sz = L.clamp(Math.floor(az / GRID), 0, g - 1);
      let tx = L.clamp(Math.floor(bx / GRID), 0, g - 1), tz = L.clamp(Math.floor(bz / GRID), 0, g - 1);
      if (this.blocked[tz * g + tx]) {
        const near = this.nearestOpen(tx, tz);
        if (!near) return [[bx, bz]];
        [tx, tz] = near;
      }
      const N = g * g;
      const cost = new Float32Array(N).fill(Infinity);
      const from = new Int32Array(N).fill(-1);
      const closed = new Uint8Array(N);
      const heap = [];
      const push = (i, f) => {
        heap.push([f, i]);
        let k = heap.length - 1;
        while (k > 0) {
          const p = (k - 1) >> 1;
          if (heap[p][0] <= heap[k][0]) break;
          [heap[p], heap[k]] = [heap[k], heap[p]];
          k = p;
        }
      };
      const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          let k = 0;
          for (;;) {
            const l = k * 2 + 1, r = l + 1;
            let m = k;
            if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
            if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
            if (m === k) break;
            [heap[m], heap[k]] = [heap[k], heap[m]];
            k = m;
          }
        }
        return top;
      };
      const start = sz * g + sx, goal = tz * g + tx;
      cost[start] = 0;
      push(start, 0);
      const base = cls.move[0];
      let found = false;
      let guard = 0;
      while (heap.length && guard++ < 60000) {
        const [, i] = pop();
        if (closed[i]) continue;
        closed[i] = 1;
        if (i === goal) { found = true; break; }
        const ix = i % g, iz = (i / g) | 0;
        for (let dz = -1; dz <= 1; dz++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dz) continue;
            const nx = ix + dx, nz = iz + dz;
            if (nx < 0 || nz < 0 || nx >= g || nz >= g) continue;
            const j = nz * g + nx;
            if (this.blocked[j] || closed[j]) continue;
            const t = this.typeAt((nx + 0.5) * GRID, (nz + 0.5) * GRID);
            const step = (dx && dz ? 1.414 : 1) * Math.min(cls.move[t], 200) / base;
            const c = cost[i] + step;
            if (c < cost[j]) {
              cost[j] = c;
              from[j] = i;
              push(j, c + Math.hypot(nx - tx, nz - tz));
            }
          }
        }
      }
      if (!found) return [[bx, bz]];
      const cells = [];
      for (let i = goal; i !== -1 && i !== start; i = from[i]) cells.push(i);
      cells.reverse();
      const pts = cells.map(i => [(i % g + 0.5) * GRID, (((i / g) | 0) + 0.5) * GRID]);
      pts.push([bx, bz]);
      const out = [];
      let cx = ax, cz = az;
      for (let i = 0; i < pts.length; i++) {
        const nxt = pts[i + 1];
        if (nxt && this.lineClear(cx, cz, nxt[0], nxt[1])) continue;
        out.push(pts[i]);
        cx = pts[i][0];
        cz = pts[i][1];
      }
      return out.length ? out : [[bx, bz]];
    }

    nearestOpen(tx, tz) {
      const g = this.gn;
      for (let r = 1; r < 40; r++) {
        for (let dz = -r; dz <= r; dz++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
            const x = tx + dx, z = tz + dz;
            if (x < 0 || z < 0 || x >= g || z >= g) continue;
            if (!this.blocked[z * g + x]) return [x, z];
          }
        }
      }
      return null;
    }

    trees(seed, density) {
      const rnd = L.rng(seed);
      const out = [];
      const n = this.forestN;
      const step = this.size / n;
      const k = density == null ? 1 : density;
      const count = this.meta.trees.length;
      for (let z = 0; z < n; z++) {
        for (let x = 0; x < n; x++) {
          const f = this.forest[z * n + x];
          const wx = (x + 0.5) * step, wz = (z + 0.5) * step;
          let p = f > 150 ? 0.3 : f > 70 ? 0.12 : f > 30 ? 0.02 : 0.0012;
          p *= k;
          while (p > 0) {
            if (rnd.next() < p) {
              const px = wx + rnd.range(-0.5, 0.5) * step, pz = wz + rnd.range(-0.5, 0.5) * step;
              const t = this.typeAt(px, pz);
              if (t !== L.T.water && t !== L.T.ford) {
                out.push({ x: px, z: pz, y: this.heightAt(px, pz), s: rnd.range(8, 14) * (f > 150 ? 1.1 : 0.95), sprite: rnd.int(count), r: rnd.next() });
              }
            }
            p -= 1;
          }
        }
      }
      return out;
    }
  }

  function pointInPoly(x, z, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  }

  L.Terrain = Terrain;
  L.pointInPoly = pointInPoly;

  L.loadTerrain = async (key, opts) => {
    const dir = 'maps/' + key + '/';
    const meta = await L.readJSON(dir + 'map.json');
    const heights = new Float32Array(await L.readBinary(dir + 'height.bin'));
    const forest = new Uint8Array(await L.readBinary(dir + 'forest.bin'));
    let grass = null;
    if (meta.grassMap) grass = new Uint8Array(await L.readBinary(dir + 'grass.bin'));
    return new Terrain(key, meta, heights, forest, grass, opts);
  };
})(globalThis.Legion = globalThis.Legion || {});
