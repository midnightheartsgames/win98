(function (C) {
  'use strict';
  const { clamp, hash01, lerp } = C;
  const M = C.MAP, N = M.SIZE;
  const CELL = 16, GN = N / CELL;
  const RENDER_CELL = 32, RGN = N / RENDER_CELL;
  const TRUNK = { pine: 0.3, birch: 0.18, dead: 0.2, irontree: 0.2, willow: 0.28 };
  const TREE_SCALE = { pine: [0.8, 1.25], birch: [0.8, 1.2], dead: [0.7, 1.3], irontree: [0.8, 1.2], willow: [0.8, 1.2], bush: [0.8, 1.3] };

  class World {
    constructor(opts = {}) {
      this.seed = opts.seed || 1999;
      this.terrain = new C.Terrain(this.seed);
      const tex = C.buildTextures();
      this.textures = tex.list;
      this.texIndex = tex.index;
      const b = C.buildPlaces(tex.index, this.terrain);
      this.colliders = b.colliders;
      this.zones = b.zones;
      this.markers = b.markers;
      this.lights = b.lights;
      this.bins = b.bake(RGN, RENDER_CELL);
      this.triCount = b.tris.length / 18;
      this.buildColliderGrid();
      this.placeFlora();
      this.buildNav();
      this.sprites = opts.sprites || null;
    }

    buildColliderGrid() {
      this.cgrid = Array.from({ length: GN * GN }, () => []);
      this.colliders.forEach((c, i) => {
        const r = Math.hypot(c.hx, c.hy);
        c.r = r;
        const x0 = clamp(Math.floor((c.x - r) / CELL), 0, GN - 1), x1 = clamp(Math.floor((c.x + r) / CELL), 0, GN - 1);
        const y0 = clamp(Math.floor((c.y - r) / CELL), 0, GN - 1), y1 = clamp(Math.floor((c.y + r) / CELL), 0, GN - 1);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.cgrid[y * GN + x].push(i);
      });
    }

    collidersNear(x, y, r = 2) {
      const out = new Set();
      const x0 = clamp(Math.floor((x - r) / CELL), 0, GN - 1), x1 = clamp(Math.floor((x + r) / CELL), 0, GN - 1);
      const y0 = clamp(Math.floor((y - r) / CELL), 0, GN - 1), y1 = clamp(Math.floor((y + r) / CELL), 0, GN - 1);
      for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) for (const i of this.cgrid[gy * GN + gx]) out.add(i);
      return out;
    }

    blockedByStructure(x, y, margin) {
      for (const i of this.collidersNear(x, y, margin + 2)) {
        const c = this.colliders[i];
        const dx = x - c.x, dy = y - c.y;
        if (Math.abs(dx * c.c + dy * c.s) < c.hx + margin && Math.abs(-dx * c.s + dy * c.c) < c.hy + margin) return true;
      }
      for (const z of this.zones) {
        const dx = x - z.x, dy = y - z.y;
        if (Math.abs(dx * z.c + dy * z.s) < z.hx + margin && Math.abs(-dx * z.s + dy * z.c) < z.hy + margin) return true;
      }
      return false;
    }

    placeFlora() {
      const T = this.terrain, s = this.seed;
      this.trees = [];
      this.reeds = [];
      const keepOut = Object.values(M.POI).map(p => [p.x, p.y, p === M.POI.start ? 10 : 14]);
      const nearPOI = (x, y) => keepOut.some(([px, py, r]) => (x - px) ** 2 + (y - py) ** 2 < r * r);
      const forestKind = (x, y) => {
        let best = null, bd = 1e9;
        for (const f of M.FORESTS) { const d = Math.hypot(x - f.x, y - f.y) / f.r; if (d < bd) { bd = d; best = f; } }
        return best;
      };
      const fieldNear = (x, y) => C.DATA.FIELDS.some(f => Math.hypot(x - f.x, y - f.y) < f.r * 0.7);
      for (let gy = 4; gy < N - 4; gy += 5) for (let gx = 4; gx < N - 4; gx += 5) {
        const x = gx + (hash01(gx, gy, s + 1) - 0.5) * 4.4, y = gy + (hash01(gx, gy, s + 2) - 0.5) * 4.4;
        const i = Math.round(y) * N + Math.round(x);
        const h = T.height[i], f = T.forest[i], road = T.road[i];
        if (road > 0.2) continue;
        const r = hash01(gx, gy, s + 3);
        const slope = T.slopeAt(x, y);
        if (h > 0.35 && slope < 0.9) {
          let kind = null;
          if (f > 0.25) { const fd = forestKind(x, y); if (r < fd.density * f * 1.5) kind = fd.kinds[Math.floor(hash01(gx, gy, s + 4) * fd.kinds.length)]; }
          else if (r < 0.018) kind = ['birch', 'dead', 'bush', 'willow', 'bush'][Math.floor(hash01(gx, gy, s + 5) * 5)];
          else if (h < 1.2 && r < 0.05) kind = hash01(gx, gy, s + 6) < 0.5 ? 'willow' : 'bush';
          if (kind && !nearPOI(x, y) && !fieldNear(x, y) && !this.blockedByStructure(x, y, 3)) {
            const [a, b] = TREE_SCALE[kind];
            this.trees.push({ x, y, z: T.heightAt(x, y) - 0.15, kind, v: Math.floor(hash01(gx, gy, s + 7) * 3), scale: lerp(a, b, hash01(gx, gy, s + 8)), r: TRUNK[kind] || 0 });
          }
        }
      }
      for (let gy = 2; gy < N - 2; gy += 3) for (let gx = 2; gx < N - 2; gx += 3) {
        const x = gx + (hash01(gx, gy, s + 11) - 0.5) * 2.6, y = gy + (hash01(gx, gy, s + 12) - 0.5) * 2.6;
        const h = T.heightAt(x, y);
        if (h < -0.55 || h > 0.3) continue;
        if (hash01(gx, gy, s + 13) > 0.42) continue;
        if (C.fbm(x / 30, y / 30, s + 14, 2) < 0.42) continue;
        if (T.road[Math.round(y) * N + Math.round(x)] > 0.2 || nearPOI(x, y)) continue;
        this.reeds.push({ x, y, z: Math.max(h, -0.2) - 0.1, v: Math.floor(hash01(gx, gy, s + 15) * 3), scale: 0.8 + hash01(gx, gy, s + 16) * 0.5 });
      }
      this.treeGrid = Array.from({ length: GN * GN }, () => []);
      this.trees.forEach((t, i) => { const gx = clamp(Math.floor(t.x / CELL), 0, GN - 1), gy = clamp(Math.floor(t.y / CELL), 0, GN - 1); this.treeGrid[gy * GN + gx].push(i); });
      this.treeRender = Array.from({ length: RGN * RGN }, () => []);
      this.trees.forEach(t => { const gx = clamp(Math.floor(t.x / RENDER_CELL), 0, RGN - 1), gy = clamp(Math.floor(t.y / RENDER_CELL), 0, RGN - 1); this.treeRender[gy * RGN + gx].push(t); });
      this.reedRender = Array.from({ length: RGN * RGN }, () => []);
      this.reeds.forEach(t => { const gx = clamp(Math.floor(t.x / RENDER_CELL), 0, RGN - 1), gy = clamp(Math.floor(t.y / RENDER_CELL), 0, RGN - 1); this.reedRender[gy * RGN + gx].push(t); });
    }

    treesNear(x, y, r) {
      const out = [];
      const x0 = clamp(Math.floor((x - r) / CELL), 0, GN - 1), x1 = clamp(Math.floor((x + r) / CELL), 0, GN - 1);
      const y0 = clamp(Math.floor((y - r) / CELL), 0, GN - 1), y1 = clamp(Math.floor((y + r) / CELL), 0, GN - 1);
      for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) for (const i of this.treeGrid[gy * GN + gx]) out.push(this.trees[i]);
      return out;
    }

    colliderTop(c, x, y) {
      if (!c.ramp) return c.z1;
      const dx = x - c.x, dy = y - c.y, lx = dx * c.c + dy * c.s;
      const t = clamp((lx + c.hx) / (c.hx * 2), 0, 1);
      return lerp(c.ramp.h0, c.ramp.h1, t);
    }

    insideCollider(c, x, y, margin = 0) {
      const dx = x - c.x, dy = y - c.y;
      return Math.abs(dx * c.c + dy * c.s) <= c.hx + margin && Math.abs(-dx * c.s + dy * c.c) <= c.hy + margin;
    }

    groundAt(x, y, z, step = 0.55) {
      let g = this.terrain.heightAt(x, y), mat = null;
      for (const i of this.collidersNear(x, y, 1)) {
        const c = this.colliders[i];
        if (!c.walk) continue;
        if (!this.insideCollider(c, x, y, 0.05)) continue;
        const top = this.colliderTop(c, x, y);
        if (top <= z + step && top > g) { g = top; mat = c.mat; }
      }
      return { h: g, mat };
    }

    ceilingAt(x, y, z) {
      let ceil = 1e9;
      for (const i of this.collidersNear(x, y, 1)) {
        const c = this.colliders[i];
        if (!this.insideCollider(c, x, y, 0)) continue;
        if (c.z0 > z && c.z0 < ceil) ceil = c.z0;
      }
      return ceil;
    }

    collide(x, y, z0, z1, r) {
      for (let iter = 0; iter < 3; iter++) {
        let moved = false;
        for (const i of this.collidersNear(x, y, r + 1)) {
          const c = this.colliders[i];
          const top = c.ramp ? this.colliderTop(c, x, y) : c.z1;
          if (top <= z0 + 0.02 || c.z0 >= z1) continue;
          if (c.ramp && top <= z0 + 0.6) continue;
          const dx = x - c.x, dy = y - c.y;
          const lx = dx * c.c + dy * c.s, ly = -dx * c.s + dy * c.c;
          const qx = clamp(lx, -c.hx, c.hx), qy = clamp(ly, -c.hy, c.hy);
          let ex = lx - qx, ey = ly - qy;
          const d = Math.hypot(ex, ey);
          if (d >= r) continue;
          let px, py;
          if (d > 1e-6) { px = ex / d * (r - d); py = ey / d * (r - d); }
          else {
            const ox = c.hx - Math.abs(lx), oy = c.hy - Math.abs(ly);
            if (ox < oy) { px = Math.sign(lx || 1) * (ox + r); py = 0; } else { px = 0; py = Math.sign(ly || 1) * (oy + r); }
          }
          x += px * c.c - py * c.s; y += px * c.s + py * c.c;
          moved = true;
        }
        for (const t of this.treesNear(x, y, r + 1)) {
          if (!t.r) continue;
          const dx = x - t.x, dy = y - t.y, d = Math.hypot(dx, dy), rr = t.r + r;
          if (d < rr && d > 1e-6) { x = t.x + dx / d * rr; y = t.y + dy / d * rr; moved = true; }
        }
        if (!moved) break;
      }
      return [clamp(x, M.EDGE, N - M.EDGE), clamp(y, M.EDGE, N - M.EDGE)];
    }

    raycast(ox, oy, oz, dx, dy, dz, maxDist, opts = {}) {
      let best = null;
      const tr = this.terrain.raycast(ox, oy, oz, dx, dy, dz, maxDist);
      if (tr) best = { t: tr.t, kind: 'terrain', mat: this.terrain.materialAt(tr.x, tr.y) };
      if (!opts.noWater && dz < 0 && oz > 0) {
        const tw = (0 - oz) / dz;
        if (tw > 0 && tw < maxDist && (!best || tw < best.t) && this.terrain.heightAt(ox + dx * tw, oy + dy * tw) < 0) best = { t: tw, kind: 'water' };
      }
      const lim = best ? best.t : maxDist;
      const steps = Math.ceil(lim / CELL) + 1;
      const seen = new Set();
      for (let k = 0; k <= steps; k++) {
        const t = Math.min(lim, k * CELL);
        const px = ox + dx * t, py = oy + dy * t;
        for (const i of this.collidersNear(px, py, CELL * 0.75)) {
          if (seen.has(i)) continue; seen.add(i);
          const c = this.colliders[i];
          const h = this.rayOBB(c, ox, oy, oz, dx, dy, dz);
          if (h != null && h >= 0 && h < (best ? best.t : maxDist)) best = { t: h, kind: 'struct', mat: c.mat, collider: c };
        }
        if (!opts.noTrees) for (const tr2 of this.treesNear(px, py, CELL * 0.75)) {
          if (!tr2.r || seen.has(tr2)) continue; seen.add(tr2);
          const fx = ox - tr2.x, fy = oy - tr2.y, a = dx * dx + dy * dy, bq = 2 * (fx * dx + fy * dy), cq = fx * fx + fy * fy - tr2.r * tr2.r;
          const disc = bq * bq - 4 * a * cq;
          if (disc < 0 || a < 1e-9) continue;
          const th = (-bq - Math.sqrt(disc)) / (2 * a);
          if (th < 0 || th >= (best ? best.t : maxDist)) continue;
          const hz = oz + dz * th;
          if (hz < tr2.z || hz > tr2.z + 10 * tr2.scale) continue;
          best = { t: th, kind: 'tree', mat: 'wood' };
        }
      }
      if (best) { best.x = ox + dx * best.t; best.y = oy + dy * best.t; best.z = oz + dz * best.t; }
      return best;
    }

    rayOBB(c, ox, oy, oz, dx, dy, dz) {
      const rx = ox - c.x, ry = oy - c.y;
      const lox = rx * c.c + ry * c.s, loy = -rx * c.s + ry * c.c;
      const ldx = dx * c.c + dy * c.s, ldy = -dx * c.s + dy * c.c;
      let t0 = 0, t1 = 1e9;
      const slab = (o, d, lo, hi) => {
        if (Math.abs(d) < 1e-9) return o >= lo && o <= hi;
        let a = (lo - o) / d, b = (hi - o) / d;
        if (a > b) { const q = a; a = b; b = q; }
        if (a > t0) t0 = a;
        if (b < t1) t1 = b;
        return t0 <= t1;
      };
      if (!slab(lox, ldx, -c.hx, c.hx)) return null;
      if (!slab(loy, ldy, -c.hy, c.hy)) return null;
      const top = c.ramp ? Math.max(c.ramp.h0, c.ramp.h1) : c.z1;
      if (!slab(oz, dz, c.z0, top)) return null;
      if (c.ramp) {
        for (let t = t0; t <= t1; t += 0.2) {
          const px = ox + dx * t, py = oy + dy * t, pz = oz + dz * t;
          if (pz <= this.colliderTop(c, px, py) && pz >= c.z0) return t;
        }
        return null;
      }
      return t0;
    }

    lineOfSight(ax, ay, az, bx, by, bz, opts = {}) {
      const dx = bx - ax, dy = by - ay, dz = bz - az, d = Math.hypot(dx, dy, dz);
      if (d < 0.01) return true;
      const hit = this.raycast(ax, ay, az, dx / d, dy / d, dz / d, d - 0.3, Object.assign({ noWater: true }, opts));
      return !hit;
    }

    zoneAt(x, y, z) {
      let best = null;
      for (const zn of this.zones) {
        if (z < zn.z0 || z > zn.z1 + 0.5) continue;
        const dx = x - zn.x, dy = y - zn.y;
        if (Math.abs(dx * zn.c + dy * zn.s) <= zn.hx && Math.abs(-dx * zn.s + dy * zn.c) <= zn.hy) {
          if (!best || (zn.indoor && !best.indoor)) best = zn;
        }
      }
      return best;
    }

    buildNav() {
      const T = this.terrain;
      const nav = new Uint8Array(N * N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x, h = T.height[i];
        if (x < M.EDGE || y < M.EDGE || x >= N - M.EDGE || y >= N - M.EDGE) continue;
        if (h < -1.15) continue;
        const sx = T.height[i + 1] - T.height[i - 1], sy = T.height[i + N] - T.height[i - N];
        if (Math.hypot(sx, sy) * 0.5 > 0.95) continue;
        nav[i] = h < -0.3 ? 2 : T.road[i] > 0.5 ? 3 : 1;
      }
      for (const c of this.colliders) {
        const r = c.r + 0.6;
        for (let y = Math.floor(c.y - r); y <= c.y + r; y++) for (let x = Math.floor(c.x - r); x <= c.x + r; x++) {
          if (x < 0 || y < 0 || x >= N || y >= N) continue;
          if (!this.insideCollider(c, x + 0.5, y + 0.5, 0.35)) continue;
          const g = T.height[y * N + x];
          const top = c.ramp ? Math.max(c.ramp.h0, c.ramp.h1) : c.z1;
          if (top < g + 0.45 || c.z0 > g + 1.8) continue;
          nav[y * N + x] = 0;
        }
      }
      for (const t of this.trees) if (t.r) { const i = Math.round(t.y) * N + Math.round(t.x); nav[i] = 0; }
      this.nav = nav;
      this.navG = new Float32Array(N * N);
      this.navFrom = new Int32Array(N * N);
      this.navStamp = new Uint32Array(N * N);
      this.navClosed = new Uint32Array(N * N);
      this.navRun = 0;
    }

    walkable(x, y) {
      const ix = Math.round(x), iy = Math.round(y);
      if (ix < 0 || iy < 0 || ix >= N || iy >= N) return false;
      return this.nav[iy * N + ix] > 0;
    }

    nearestWalkable(x, y, maxR = 8) {
      if (this.walkable(x, y)) return [x, y];
      for (let r = 1; r <= maxR; r++) for (let a = 0; a < 16; a++) {
        const px = x + Math.cos(a / 16 * C.TAU) * r, py = y + Math.sin(a / 16 * C.TAU) * r;
        if (this.walkable(px, py)) return [px, py];
      }
      return null;
    }

    findPath(sx, sy, tx, ty, maxNodes = 12000) {
      const nav = this.nav;
      let s = this.nearestWalkable(sx, sy, 4), t = this.nearestWalkable(tx, ty, 8);
      if (!s || !t) return null;
      const si = Math.round(s[1]) * N + Math.round(s[0]), ti = Math.round(t[1]) * N + Math.round(t[0]);
      if (si === ti) return [[tx, ty]];
      const run = ++this.navRun;
      const G = this.navG, F = this.navFrom, st = this.navStamp, cl = this.navClosed;
      const heap = new C.MinHeap();
      const txi = ti % N, tyi = (ti / N) | 0;
      const hfun = i => { const dx = Math.abs((i % N) - txi), dy = Math.abs(((i / N) | 0) - tyi); return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy); };
      G[si] = 0; F[si] = -1; st[si] = run;
      heap.push(si, hfun(si));
      let expanded = 0, found = false, bestI = si, bestH = hfun(si);
      const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
      while (heap.size) {
        const cur = heap.pop();
        if (cl[cur] === run) continue;
        cl[cur] = run;
        if (cur === ti) { found = true; break; }
        if (++expanded > maxNodes) break;
        const cx = cur % N, cy = (cur / N) | 0;
        const hc = hfun(cur);
        if (hc < bestH) { bestH = hc; bestI = cur; }
        for (const [ddx, ddy, cost] of dirs) {
          const nx = cx + ddx, ny = cy + ddy;
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          const ni = ny * N + nx, v = nav[ni];
          if (!v) continue;
          if (ddx && ddy && (!nav[cy * N + nx] || !nav[ny * N + cx])) continue;
          const g = G[cur] + cost * (v === 2 ? 2.2 : v === 3 ? 0.85 : 1);
          if (st[ni] === run && g >= G[ni]) continue;
          st[ni] = run; G[ni] = g; F[ni] = cur;
          heap.push(ni, g + hfun(ni));
        }
      }
      const end = found ? ti : bestI;
      const cells = [];
      for (let i = end; i !== -1 && cells.length < 20000; i = F[i]) { cells.push(i); if (i === si) break; }
      cells.reverse();
      const pts = [];
      for (let k = 0; k < cells.length; k++) {
        const i = cells[k], x = i % N, y = (i / N) | 0;
        if (k > 0 && k < cells.length - 1 && k % 4 !== 0) continue;
        pts.push([x + 0.5, y + 0.5]);
      }
      if (found) pts.push([tx, ty]);
      return pts;
    }

    collectFlora(R, cam, bank, out) {
      const far = Math.min(R.far, 240), reedFar = 70;
      const cx = cam.x, cy = cam.y;
      const fx = Math.cos(cam.yaw), fy = Math.sin(cam.yaw);
      const cos = Math.cos(Math.min(Math.PI, R.hHalf + 0.3)), sideK = R.hHalf < 1.45 ? Math.tan(R.hHalf) + 0.35 : Infinity;
      const g0x = clamp(Math.floor((cx - far) / RENDER_CELL), 0, RGN - 1), g1x = clamp(Math.floor((cx + far) / RENDER_CELL), 0, RGN - 1);
      const g0y = clamp(Math.floor((cy - far) / RENDER_CELL), 0, RGN - 1), g1y = clamp(Math.floor((cy + far) / RENDER_CELL), 0, RGN - 1);
      for (let gy = g0y; gy <= g1y; gy++) for (let gx = g0x; gx <= g1x; gx++) {
        const mx = (gx + 0.5) * RENDER_CELL - cx, my = (gy + 0.5) * RENDER_CELL - cy, d = Math.hypot(mx, my);
        if (d > far + 24) continue;
        if (d > 40 && (mx * fx + my * fy) / d < cos - 0.5) continue;
        for (const t of this.treeRender[gy * RGN + gx]) {
          const dx = t.x - cx, dy = t.y - cy, dd = dx * fx + dy * fy;
          if (dd < -2 || dd > far) continue;
          out.push({ x: t.x, y: t.y, z: t.z, img: bank.trees[t.kind][t.v], scale: t.scale, zBias: 0.3 });
        }
        if (d < reedFar + 24) for (const t of this.reedRender[gy * RGN + gx]) {
          const dx = t.x - cx, dy = t.y - cy, dd = dx * fx + dy * fy;
          if (dd < 0.5 || dd > reedFar) continue;
          out.push({ x: t.x, y: t.y, z: t.z, img: bank.grass.reed[t.v], scale: t.scale });
        }
      }
      const T = this.terrain, s = this.seed;
      const gr = 26;
      const bx0 = Math.floor(cx - gr), by0 = Math.floor(cy - gr);
      for (let y = by0; y <= cy + gr; y += 1.5) for (let x = bx0; x <= cx + gr; x += 1.5) {
        const ix = Math.floor(x / 1.5), iy = Math.floor(y / 1.5);
        const hsh = hash01(ix, iy, s + 21);
        if (hsh > 0.55) continue;
        const px = ix * 1.5 + hash01(ix, iy, s + 22) * 1.4, py = iy * 1.5 + hash01(ix, iy, s + 23) * 1.4;
        const dx = px - cx, dy = py - cy, dd = dx * fx + dy * fy;
        if (dd < 0.8 || dx * dx + dy * dy > gr * gr) continue;
        if (Math.abs(dx * -fy + dy * fx) > dd * sideK + 1) continue;
        const ii = Math.round(py) * N + Math.round(px);
        const m = T.mat[ii];
        if (m !== 0 && m !== 1 && m !== 6) continue;
        if (T.height[ii] < 0.2) continue;
        out.push({ x: px, y: py, z: T.heightAt(px, py) - 0.05, img: bank.grass[m === 1 ? 'dry' : 'grass'][Math.floor(hsh * 5.4) % 3], scale: 0.8 + hsh });
      }
    }
  }

  C.World = World;
  C.WORLD_CELL = CELL;
  C.RENDER_CELL = RENDER_CELL;
  C.RGN = RGN;
})(globalThis.Cop98 = globalThis.Cop98 || {});
