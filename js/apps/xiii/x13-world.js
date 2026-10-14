(function (X) {
  'use strict';
  const F = { SOLID: 1, SHOT: 2, SIGHT: 4, WALK: 8, GLASS: 16, NONAV: 32, PROP: 64 };
  F.WALL = F.SOLID | F.SHOT | F.SIGHT | F.WALK;
  X.F = F;
  const clamp = X.clamp;

  class Terrain {
    constructor(x0, z0, cell, nx, nz) {
      this.x0 = x0; this.z0 = z0; this.cell = cell; this.nx = nx; this.nz = nz;
      this.h = new Float32Array((nx + 1) * (nz + 1));
      this.x1 = x0 + nx * cell; this.z1 = z0 + nz * cell;
      this.minY = 0; this.maxY = 0;
      this.holes = [];
    }
    inHole(x, z) {
      for (const h of this.holes) if (x > h[0] && x < h[2] && z > h[1] && z < h[3]) return true;
      return false;
    }
    fill(fn) {
      let mn = Infinity, mx = -Infinity;
      for (let k = 0; k <= this.nz; k++) {
        for (let i = 0; i <= this.nx; i++) {
          const v = fn(this.x0 + i * this.cell, this.z0 + k * this.cell);
          this.h[k * (this.nx + 1) + i] = v;
          if (v < mn) mn = v; if (v > mx) mx = v;
        }
      }
      this.minY = mn; this.maxY = mx;
    }
    at(i, k) { return this.h[k * (this.nx + 1) + i]; }
    heightAt(x, z) {
      const gx = (x - this.x0) / this.cell, gz = (z - this.z0) / this.cell;
      if (gx < 0 || gz < 0 || gx > this.nx || gz > this.nz) return null;
      if (this.holes.length && this.inHole(x, z)) return null;
      const i = Math.min(this.nx - 1, Math.floor(gx)), k = Math.min(this.nz - 1, Math.floor(gz));
      const fx = gx - i, fz = gz - k;
      const a = this.at(i, k), b = this.at(i + 1, k), c = this.at(i + 1, k + 1), d = this.at(i, k + 1);
      if (fz > fx) return a + (c - d) * fx + (d - a) * fz;
      return a + (b - a) * fx + (c - b) * fz;
    }
    normalAt(x, z) {
      const e = this.cell * 0.5;
      const hl = this.heightAt(x - e, z), hr = this.heightAt(x + e, z), hd = this.heightAt(x, z - e), hu = this.heightAt(x, z + e);
      if (hl === null || hr === null || hd === null || hu === null) return [0, 1, 0];
      return X.vnorm([hl - hr, 2 * e, hd - hu]);
    }
  }
  X.Terrain = Terrain;

  function blockDerive(b) {
    b.c = Math.cos(b.yaw || 0); b.s = Math.sin(b.yaw || 0);
    const ex = Math.abs(b.c) * b.hx + Math.abs(b.s) * b.hz;
    const ez = Math.abs(b.s) * b.hx + Math.abs(b.c) * b.hz;
    b.minx = b.x - ex; b.maxx = b.x + ex; b.minz = b.z - ez; b.maxz = b.z + ez;
    b.top = b.y + b.hy; b.bot = b.y - b.hy;
    return b;
  }
  X.blockDerive = blockDerive;

  function circleRect(b, px, pz, r) {
    const dx = px - b.x, dz = pz - b.z;
    const lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
    const qx = clamp(lx, -b.hx, b.hx), qz = clamp(lz, -b.hz, b.hz);
    const ox = lx - qx, oz = lz - qz;
    return ox * ox + oz * oz < r * r;
  }
  X.circleRect = circleRect;

  function pushCircle(b, px, pz, r) {
    const dx = px - b.x, dz = pz - b.z;
    const lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
    const qx = clamp(lx, -b.hx, b.hx), qz = clamp(lz, -b.hz, b.hz);
    const ox = lx - qx, oz = lz - qz;
    const d2 = ox * ox + oz * oz;
    if (d2 >= r * r) return null;
    let nx, nz, pen;
    if (d2 > 1e-12) {
      const d = Math.sqrt(d2); nx = ox / d; nz = oz / d; pen = r - d;
    } else {
      const a = b.hx - lx, bb = lx + b.hx, c = b.hz - lz, e = lz + b.hz;
      const m = Math.min(a, bb, c, e);
      if (m === a) { nx = 1; nz = 0; pen = a + r; } else if (m === bb) { nx = -1; nz = 0; pen = bb + r; } else if (m === c) { nx = 0; nz = 1; pen = c + r; } else { nx = 0; nz = -1; pen = e + r; }
    }
    return [(nx * b.c + nz * b.s) * pen, (-nx * b.s + nz * b.c) * pen];
  }

  function rayBlock(b, o, d, maxT) {
    const dx = o[0] - b.x, dz = o[2] - b.z;
    const lo = [dx * b.c - dz * b.s, o[1] - b.y, dx * b.s + dz * b.c];
    const ld = [d[0] * b.c - d[2] * b.s, d[1], d[0] * b.s + d[2] * b.c];
    const h = [b.hx, b.hy, b.hz];
    let t0 = 0, t1 = maxT, axis = -1, sign = 0;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(ld[i]) < 1e-12) {
        if (lo[i] < -h[i] || lo[i] > h[i]) return null;
        continue;
      }
      let a = (-h[i] - lo[i]) / ld[i], c = (h[i] - lo[i]) / ld[i];
      let sg = -1;
      if (a > c) { const t = a; a = c; c = t; sg = 1; }
      if (a > t0) { t0 = a; axis = i; sign = sg; }
      if (c < t1) t1 = c;
      if (t0 > t1) return null;
    }
    if (axis < 0) return { t: 0, n: [-d[0], -d[1], -d[2]] };
    const ln = [0, 0, 0]; ln[axis] = sign;
    return { t: t0, n: [ln[0] * b.c + ln[2] * b.s, ln[1], -ln[0] * b.s + ln[2] * b.c] };
  }
  X.rayBlock = rayBlock;

  class World {
    constructor() {
      this.blocks = [];
      this.movers = [];
      this.terrains = [];
      this.waters = [];
      this.ladders = [];
      this.visuals = [];
      this.lights = [];
      this.interiors = [];
      this.cell = 4;
      this.grid = new Map();
      this.stamp = 1;
      this.minx = -50; this.maxx = 50; this.minz = -50; this.maxz = 50;
    }
    key(ix, iz) { return (ix + 32768) * 65536 + (iz + 32768); }
    addBlock(b) {
      b.flags = b.flags === undefined ? F.WALL : b.flags;
      blockDerive(b);
      b.stamp = 0;
      b.index = this.blocks.length;
      this.blocks.push(b);
      return b;
    }
    addMover(b) {
      b.flags = b.flags === undefined ? (F.SOLID | F.SHOT | F.SIGHT | F.WALK) : b.flags;
      blockDerive(b);
      b.stamp = 0;
      b.isMover = true;
      this.movers.push(b);
      return b;
    }
    finalize() {
      let mnx = Infinity, mxx = -Infinity, mnz = Infinity, mxz = -Infinity;
      for (const b of this.blocks) { mnx = Math.min(mnx, b.minx); mxx = Math.max(mxx, b.maxx); mnz = Math.min(mnz, b.minz); mxz = Math.max(mxz, b.maxz); }
      for (const t of this.terrains) { mnx = Math.min(mnx, t.x0); mxx = Math.max(mxx, t.x1); mnz = Math.min(mnz, t.z0); mxz = Math.max(mxz, t.z1); }
      if (mnx === Infinity) { mnx = -10; mxx = 10; mnz = -10; mxz = 10; }
      this.minx = mnx - 8; this.maxx = mxx + 8; this.minz = mnz - 8; this.maxz = mxz + 8;
      this.grid.clear();
      const cs = this.cell;
      for (const b of this.blocks) {
        const i0 = Math.floor(b.minx / cs), i1 = Math.floor(b.maxx / cs), k0 = Math.floor(b.minz / cs), k1 = Math.floor(b.maxz / cs);
        for (let i = i0; i <= i1; i++) for (let k = k0; k <= k1; k++) {
          const key = this.key(i, k);
          let l = this.grid.get(key);
          if (!l) { l = []; this.grid.set(key, l); }
          l.push(b);
        }
      }
    }
    forBlocks(x0, z0, x1, z1, fn) {
      const cs = this.cell, st = ++this.stamp;
      const i0 = Math.floor(x0 / cs), i1 = Math.floor(x1 / cs), k0 = Math.floor(z0 / cs), k1 = Math.floor(z1 / cs);
      for (let i = i0; i <= i1; i++) for (let k = k0; k <= k1; k++) {
        const l = this.grid.get(this.key(i, k));
        if (!l) continue;
        for (let j = 0; j < l.length; j++) {
          const b = l[j];
          if (b.stamp === st) continue;
          b.stamp = st;
          if (b.dead || b.maxx < x0 || b.minx > x1 || b.maxz < z0 || b.minz > z1) continue;
          fn(b);
        }
      }
      for (let j = 0; j < this.movers.length; j++) {
        const b = this.movers[j];
        if ((this.skipMovers && !b.grp) || b.dead || b.maxx < x0 || b.minx > x1 || b.maxz < z0 || b.minz > z1) continue;
        fn(b);
      }
    }
    moveMover(b, x, y, z, yaw) {
      b.x = x; b.y = y; b.z = z; if (yaw !== undefined) b.yaw = yaw;
      blockDerive(b);
    }
    terrainAt(x, z) {
      let best = null;
      for (let i = 0; i < this.terrains.length; i++) {
        const h = this.terrains[i].heightAt(x, z);
        if (h !== null && (best === null || h > best)) best = h;
      }
      return best;
    }
    terrainObj(x, z) {
      for (let i = 0; i < this.terrains.length; i++) if (this.terrains[i].heightAt(x, z) !== null) return this.terrains[i];
      return null;
    }
    support(x, z, r, maxY, noTerrain) {
      let best = -1e9, bb = null;
      this.forBlocks(x - r, z - r, x + r, z + r, b => {
        if (!(b.flags & F.SOLID) || b.top > maxY || b.top <= best) return;
        if (!circleRect(b, x, z, r)) return;
        best = b.top; bb = b;
      });
      if (!noTerrain) {
        const h = this.terrainAt(x, z);
        if (h !== null && h <= maxY + 0.02 && h > best) { best = h; bb = null; }
      }
      return { y: best, block: bb };
    }
    ceiling(x, z, r, minY) {
      let best = 1e9;
      this.forBlocks(x - r, z - r, x + r, z + r, b => {
        if (!(b.flags & F.SOLID) || b.bot < minY || b.bot >= best) return;
        if (!circleRect(b, x, z, r)) return;
        best = b.bot;
      });
      return best;
    }
    collide(p, r, y0, y1, ignore) {
      let hit = false;
      for (let it = 0; it < 4; it++) {
        let moved = false;
        this.forBlocks(p[0] - r, p[2] - r, p[0] + r, p[2] + r, b => {
          if (!(b.flags & F.SOLID) || b === ignore || b.top <= y0 || b.bot >= y1) return;
          const d = pushCircle(b, p[0], p[2], r);
          if (d) { p[0] += d[0]; p[2] += d[1]; moved = true; hit = true; }
        });
        if (!moved) break;
      }
      return hit;
    }
    overlaps(x, z, r, y0, y1, mask) {
      let hit = false;
      this.forBlocks(x - r, z - r, x + r, z + r, b => {
        if (hit || !(b.flags & (mask || F.SOLID)) || b.top <= y0 || b.bot >= y1) return;
        if (circleRect(b, x, z, r)) hit = true;
      });
      return hit;
    }
    waterAt(x, z) {
      for (const w of this.waters) if (x >= w.x0 && x <= w.x1 && z >= w.z0 && z <= w.z1) return w.y;
      return null;
    }
    ladderAt(x, y, z, r) {
      for (const l of this.ladders) {
        if (x < l.x0 - r || x > l.x1 + r || z < l.z0 - r || z > l.z1 + r || y < l.y0 - 0.2 || y > l.y1) continue;
        return l;
      }
      return null;
    }
    ray(o, d, maxT, mask, ignore) {
      mask = mask || F.SHOT;
      let best = maxT, hit = null;
      const cs = this.cell;
      let ix = Math.floor(o[0] / cs), iz = Math.floor(o[2] / cs);
      const sx = d[0] > 0 ? 1 : -1, sz = d[2] > 0 ? 1 : -1;
      const adx = Math.abs(d[0]), adz = Math.abs(d[2]);
      const tdx = adx > 1e-9 ? cs / adx : Infinity, tdz = adz > 1e-9 ? cs / adz : Infinity;
      let tmx = adx > 1e-9 ? (d[0] > 0 ? (ix + 1) * cs - o[0] : o[0] - ix * cs) / adx : Infinity;
      let tmz = adz > 1e-9 ? (d[2] > 0 ? (iz + 1) * cs - o[2] : o[2] - iz * cs) / adz : Infinity;
      const st = ++this.stamp;
      const imin = Math.floor(this.minx / cs) - 1, imax = Math.floor(this.maxx / cs) + 1, kmin = Math.floor(this.minz / cs) - 1, kmax = Math.floor(this.maxz / cs) + 1;
      let t = 0, guard = 0;
      while (t <= best && guard++ < 4000) {
        const l = this.grid.get(this.key(ix, iz));
        if (l) {
          for (let j = 0; j < l.length; j++) {
            const b = l[j];
            if (b.stamp === st) continue;
            b.stamp = st;
            if (b.dead || !(b.flags & mask) || b === ignore) continue;
            const r = rayBlock(b, o, d, best);
            if (r && r.t < best) { best = r.t; hit = { t: r.t, n: r.n, block: b }; }
          }
        }
        if (tmx < tmz) { t = tmx; tmx += tdx; ix += sx; } else { t = tmz; tmz += tdz; iz += sz; }
        if ((ix < imin && sx < 0) || (ix > imax && sx > 0) || (iz < kmin && sz < 0) || (iz > kmax && sz > 0)) break;
      }
      for (const b of this.movers) {
        if (b.dead || !(b.flags & mask) || b === ignore) continue;
        const r = rayBlock(b, o, d, best);
        if (r && r.t < best) { best = r.t; hit = { t: r.t, n: r.n, block: b }; }
      }
      if (mask & (F.SHOT | F.SIGHT)) {
        for (const tr of this.terrains) {
          const th = this.rayTerrain(tr, o, d, best);
          if (th !== null && th < best) { best = th; const p = X.vma(o, th, d); hit = { t: th, n: tr.normalAt(p[0], p[2]), terrain: tr }; }
        }
      }
      if (hit) hit.p = X.vma(o, hit.t, d);
      return hit;
    }
    rayTerrain(tr, o, d, maxT) {
      let t0 = 0, t1 = maxT;
      for (const [lo, hi, oi, di] of [[tr.x0, tr.x1, o[0], d[0]], [tr.z0, tr.z1, o[2], d[2]]]) {
        if (Math.abs(di) < 1e-12) { if (oi < lo || oi > hi) return null; continue; }
        let a = (lo - oi) / di, b = (hi - oi) / di;
        if (a > b) { const t = a; a = b; b = t; }
        t0 = Math.max(t0, a); t1 = Math.min(t1, b);
        if (t0 > t1) return null;
      }
      if (o[1] + d[1] * t0 > tr.maxY + 0.5 && d[1] >= 0) return null;
      const step = Math.min(tr.cell * 0.5, 1.5);
      let prevT = t0, prevD = null;
      for (let t = t0; t <= t1 + step; t += step) {
        const tt = Math.min(t, t1);
        const x = o[0] + d[0] * tt, y = o[1] + d[1] * tt, z = o[2] + d[2] * tt;
        const h = tr.heightAt(x, z);
        if (h === null) { prevD = null; prevT = tt; continue; }
        const dd = y - h;
        if (dd <= 0) {
          if (prevD === null) { prevT = tt; continue; }
          let a = prevT, b = tt;
          for (let i = 0; i < 8; i++) {
            const m = (a + b) * 0.5;
            const hm = tr.heightAt(o[0] + d[0] * m, o[2] + d[2] * m);
            if (hm !== null && o[1] + d[1] * m <= hm) b = m; else a = m;
          }
          return b;
        }
        prevD = dd; prevT = tt;
        if (tt >= t1) break;
      }
      return null;
    }
    visible(a, b, ignore) {
      const d = X.vsub(b, a), l = X.vlen(d);
      if (l < 1e-6) return true;
      return !this.ray(a, X.vscale(d, 1 / l), l - 0.05, F.SIGHT, ignore);
    }
    groundY(x, z, fromY) {
      const s = this.support(x, z, 0.05, fromY === undefined ? 1e6 : fromY);
      return s.y;
    }
  }
  X.World = World;

  class Builder {
    constructor(world) {
      this.w = world;
      this.tf = { x: 0, y: 0, z: 0, yaw: 0, c: 1, s: 0 };
      this.stack = [];
      this.spawns = [];
      this.items = [];
      this.triggers = [];
      this.usables = [];
      this.doors = [];
      this.alarms = [];
      this.cams = {};
      this.secCams = [];
      this.grapples = [];
      this.zones = [];
      this.objects = [];
      this.paths = {};
      this.player = { pos: [0, 0, 0], yaw: 0 };
      this.navBounds = null;
      this.idn = 0;
      this.groups = [];
      this.grp = null;
      this.barrels = [];
      this.searchlights = [];
      this.vehicles = [];
    }
    at(x, y, z, yaw, fn) {
      this.stack.push(this.tf);
      const p = this.pt(x, y, z);
      const ny = this.tf.yaw + (yaw || 0);
      this.tf = { x: p[0], y: p[1], z: p[2], yaw: ny, c: Math.cos(ny), s: Math.sin(ny) };
      fn(this);
      this.tf = this.stack.pop();
    }
    pt(x, y, z) {
      const t = this.tf;
      return [t.x + x * t.c + z * t.s, t.y + y, t.z - x * t.s + z * t.c];
    }
    ryaw(y) { return this.tf.yaw + (y || 0); }
    vis(v) { if (this.grp) v.grp = this.grp; this.w.visuals.push(v); return v; }
    group(id, x, y, z, yaw, fn, o) {
      const p = this.pt(x, y, z);
      const g = { id, pos: p, yaw: this.ryaw(yaw), blocks: [], vel: [0, 0, 0], path: null, pathT: 0, speed: 0, moving: false, carry: (o && o.carry) || null, ev: null };
      const saveTf = this.tf, saveStack = this.stack, prev = this.grp;
      this.stack = []; this.tf = { x: 0, y: 0, z: 0, yaw: 0, c: 1, s: 0 };
      this.grp = g;
      fn(this);
      this.grp = prev; this.tf = saveTf; this.stack = saveStack;
      this.groups.push(g);
      X.placeGroup(g, g.pos, g.yaw);
      return g;
    }
    rawBox(cx, cy, cz, hx, hy, hz, yaw, mat, o) {
      o = o || {};
      const p = this.pt(cx, cy, cz);
      const ry = this.ryaw(yaw);
      let b = null;
      if (o.solid !== false) {
        const blk = { x: p[0], y: p[1], z: p[2], hx, hy, hz, yaw: ry, flags: o.flags, mat, id: o.id };
        if (this.grp) {
          blk.local = { x: p[0], y: p[1], z: p[2], yaw: ry };
          blk.grp = this.grp;
          b = this.w.addMover(blk);
          this.grp.blocks.push(b);
        } else b = o.mover ? this.w.addMover(blk) : this.w.addBlock(blk);
      }
      if (o.vis !== false && mat) {
        this.vis({ t: 'box', x: p[0], y: p[1], z: p[2], hx, hy, hz, yaw: ry, mat, top: o.top, bot: o.bot, side: o.side, tint: o.tint, uv: o.uv, block: b, noG: o.noG, emit: o.emit });
      }
      return b;
    }
    box(x0, y0, z0, x1, y1, z1, mat, o) {
      if (x0 > x1) { const t = x0; x0 = x1; x1 = t; }
      if (y0 > y1) { const t = y0; y0 = y1; y1 = t; }
      if (z0 > z1) { const t = z0; z0 = z1; z1 = t; }
      return this.rawBox((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, 0, mat, o);
    }
    vbox(x0, y0, z0, x1, y1, z1, mat, o) { return this.box(x0, y0, z0, x1, y1, z1, mat, Object.assign({}, o, { solid: false })); }
    obox(cx, cy, cz, hx, hy, hz, yaw, mat, o) { return this.rawBox(cx, cy, cz, hx, hy, hz, yaw, mat, o); }
    clip(x0, y0, z0, x1, y1, z1, flags) { return this.box(x0, y0, z0, x1, y1, z1, null, { vis: false, flags: flags === undefined ? F.SOLID : flags }); }
    floor(x0, z0, x1, z1, y, mat, t, o) { return this.box(x0, y - (t || 0.25), z0, x1, y, z1, mat, o); }
    ceil(x0, z0, x1, z1, y, mat, t, o) { return this.box(x0, y, z0, x1, y + (t || 0.2), z1, mat, Object.assign({ flags: F.SOLID | F.SHOT | F.SIGHT }, o)); }
    wall(x0, z0, x1, z1, y0, y1, mat, o) {
      o = o || {};
      const t = o.t || 0.2;
      const alongX = Math.abs(z1 - z0) < 1e-6;
      const len = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
      const sx = alongX ? Math.min(x0, x1) : Math.min(z0, z1);
      const fixed = alongX ? z0 : x0;
      const holes = (o.holes || []).map(h => ({ a: Math.max(0, h[0]), b: Math.min(len, h[0] + h[1]), h0: h[2] || 0, h1: h[3] === undefined ? Math.min(2.2, y1 - y0) : h[3], glass: h[4] })).sort((p, q) => p.a - q.a);
      const piece = (a, b, ya, yb, m, oo) => {
        if (b - a < 1e-4 || yb - ya < 1e-4) return;
        if (alongX) this.box(sx + a, ya, fixed - t / 2, sx + b, yb, fixed + t / 2, m, oo);
        else this.box(fixed - t / 2, ya, sx + a, fixed + t / 2, yb, sx + b, m, oo);
      };
      let cur = 0;
      const wo = { tint: o.tint, top: o.top, uv: o.uv, flags: o.flags };
      for (const h of holes) {
        piece(cur, h.a, y0, y1, mat, wo);
        piece(h.a, h.b, y0, y0 + h.h0, mat, wo);
        piece(h.a, h.b, y0 + h.h1, y1, mat, wo);
        if (h.glass) {
          const gm = h.glass === true ? 'glass' : h.glass;
          if (alongX) this.glass(sx + h.a, y0 + h.h0, fixed - 0.03, sx + h.b, y0 + h.h1, fixed + 0.03, gm);
          else this.glass(fixed - 0.03, y0 + h.h0, sx + h.a, fixed + 0.03, y0 + h.h1, sx + h.b, gm);
        }
        cur = h.b;
      }
      piece(cur, len, y0, y1, mat, wo);
    }
    glass(x0, y0, z0, x1, y1, z1, mat, o) {
      const b = this.box(x0, y0, z0, x1, y1, z1, null, { vis: false, flags: F.SOLID | F.SHOT | F.GLASS });
      const p = this.pt((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      this.vis({ t: 'glass', x: p[0], y: p[1], z: p[2], hx: Math.abs(x1 - x0) / 2, hy: Math.abs(y1 - y0) / 2, hz: Math.abs(z1 - z0) / 2, yaw: this.ryaw(0), mat: mat || 'glass', block: b, tint: o && o.tint });
      b.glassVis = true;
      return b;
    }
    room(x0, z0, x1, z1, y0, h, o) {
      o = o || {};
      const t = o.t || 0.2, wm = o.wall || 'plaster';
      if (o.floor !== null) this.floor(x0, z0, x1, z1, y0, o.floor || 'concrete', 0.3);
      if (o.ceil !== null) this.ceil(x0, z0, x1, z1, y0 + h, o.ceil || 'ceiling', 0.25);
      const d = o.doors || {}, win = o.windows || {};
      const mk = side => (d[side] || []).map(q => [q[0], q[1] || 1.3, 0, q[2] || 2.2]).concat((win[side] || []).map(q => [q[0], q[1] || 1.4, q[2] === undefined ? 1.0 : q[2], q[3] === undefined ? 2.2 : q[3], q[4] === undefined ? true : q[4]]));
      const skip = o.skip || '';
      if (!skip.includes('n')) this.wall(x0 - t / 2, z0, x1 + t / 2, z0, y0, y0 + h, wm, { t, holes: mk('n').map(q => [q[0] + t / 2].concat(q.slice(1))), tint: o.tint });
      if (!skip.includes('s')) this.wall(x0 - t / 2, z1, x1 + t / 2, z1, y0, y0 + h, wm, { t, holes: mk('s').map(q => [q[0] + t / 2].concat(q.slice(1))), tint: o.tint });
      if (!skip.includes('w')) this.wall(x0, z0 + t / 2, x0, z1 - t / 2, y0, y0 + h, wm, { t, holes: mk('w').map(q => [q[0] - t / 2].concat(q.slice(1))), tint: o.tint });
      if (!skip.includes('e')) this.wall(x1, z0 + t / 2, x1, z1 - t / 2, y0, y0 + h, wm, { t, holes: mk('e').map(q => [q[0] - t / 2].concat(q.slice(1))), tint: o.tint });
    }
    stairs(x0, z0, x1, z1, y0, y1, dir, mat, o) {
      o = o || {};
      const rise = y1 - y0, n = Math.max(1, Math.ceil(Math.abs(rise) / (o.step || 0.2)));
      const along = (dir === 'n' || dir === 's') ? Math.abs(z1 - z0) : Math.abs(x1 - x0);
      const run = along / n;
      const mnx = Math.min(x0, x1), mxx = Math.max(x0, x1), mnz = Math.min(z0, z1), mxz = Math.max(z0, z1);
      for (let i = 0; i < n; i++) {
        const top = y0 + rise * (i + 1) / n;
        const bottom = o.solid ? Math.min(y0, top) - 0.05 : top - Math.max(0.2, rise / n) - 0.1;
        let a, b;
        if (dir === 'n') { b = mxz - run * i; a = b - run; this.box(mnx, bottom, a, mxx, top, b, mat, { top: o.top }); }
        else if (dir === 's') { a = mnz + run * i; b = a + run; this.box(mnx, bottom, a, mxx, top, b, mat, { top: o.top }); }
        else if (dir === 'e') { a = mnx + run * i; b = a + run; this.box(a, bottom, mnz, b, top, mxz, mat, { top: o.top }); }
        else { b = mxx - run * i; a = b - run; this.box(a, bottom, mnz, b, top, mxz, mat, { top: o.top }); }
      }
    }
    ramp(x0, z0, x1, z1, y0, y1, dir, mat, o) {
      o = o || {};
      const n = Math.max(2, Math.ceil(Math.abs(y1 - y0) / 0.08));
      const mnx = Math.min(x0, x1), mxx = Math.max(x0, x1), mnz = Math.min(z0, z1), mxz = Math.max(z0, z1);
      for (let i = 0; i < n; i++) {
        const top = y0 + (y1 - y0) * (i + 1) / n;
        const f0 = i / n, f1 = (i + 1) / n;
        const bot = Math.min(y0, y1) - 0.1;
        if (dir === 'n') this.clip(mnx, bot, mxz - (mxz - mnz) * f1, mxx, top, mxz - (mxz - mnz) * f0, F.WALL);
        else if (dir === 's') this.clip(mnx, bot, mnz + (mxz - mnz) * f0, mxx, top, mnz + (mxz - mnz) * f1, F.WALL);
        else if (dir === 'e') this.clip(mnx + (mxx - mnx) * f0, bot, mnz, mnx + (mxx - mnx) * f1, top, mxz, F.WALL);
        else this.clip(mxx - (mxx - mnx) * f1, bot, mnz, mxx - (mxx - mnx) * f0, top, mxz, F.WALL);
      }
      let pts;
      if (dir === 'n') pts = [[mnx, y0, mxz], [mxx, y0, mxz], [mxx, y1, mnz], [mnx, y1, mnz]];
      else if (dir === 's') pts = [[mxx, y0, mnz], [mnx, y0, mnz], [mnx, y1, mxz], [mxx, y1, mxz]];
      else if (dir === 'e') pts = [[mnx, y0, mnz], [mnx, y0, mxz], [mxx, y1, mxz], [mxx, y1, mnz]];
      else pts = [[mxx, y0, mxz], [mxx, y0, mnz], [mnx, y1, mnz], [mnx, y1, mxz]];
      this.quad(pts, mat, o);
      if (o.sides !== false) {
        const lo = Math.min(y0, y1) - 0.1;
        if (dir === 'n' || dir === 's') {
          for (const x of [mnx, mxx]) this.quad([[x, lo, mnz], [x, lo, mxz], [x, dir === 's' ? y1 : y0, mxz], [x, dir === 's' ? y0 : y1, mnz]], o.sideMat || mat, { two: true });
        } else {
          for (const z of [mnz, mxz]) this.quad([[mnx, lo, z], [mxx, lo, z], [mxx, dir === 'e' ? y1 : y0, z], [mnx, dir === 'e' ? y0 : y1, z]], o.sideMat || mat, { two: true });
        }
      }
    }
    quad(pts, mat, o) {
      o = o || {};
      return this.vis({ t: 'quad', p: pts.map(q => this.pt(q[0], q[1], q[2])), mat, uv: o.uv, two: o.two, tint: o.tint, noG: o.noG, alpha: o.alpha, emit: o.emit, uvs: o.uvs });
    }
    roof(x0, z0, x1, z1, y, h, axis, mat, o) {
      o = o || {};
      const ov = o.over === undefined ? 0.4 : o.over;
      const mnx = Math.min(x0, x1) - ov, mxx = Math.max(x0, x1) + ov, mnz = Math.min(z0, z1) - ov, mxz = Math.max(z0, z1) + ov;
      if (axis === 'x') {
        const mz = (mnz + mxz) / 2;
        this.quad([[mnx, y, mnz], [mxx, y, mnz], [mxx, y + h, mz], [mnx, y + h, mz]], mat, { two: true });
        this.quad([[mxx, y, mxz], [mnx, y, mxz], [mnx, y + h, mz], [mxx, y + h, mz]], mat, { two: true });
        if (o.gable !== false) {
          this.quad([[mnx + ov, y, mnz + ov], [mnx + ov, y, mxz - ov], [mnx + ov, y + h * (1 - ov / ((mxz - mnz) / 2)), mz], [mnx + ov, y + h * (1 - ov / ((mxz - mnz) / 2)), mz]], o.gableMat || o.wall || 'siding', { two: true });
          this.quad([[mxx - ov, y, mxz - ov], [mxx - ov, y, mnz + ov], [mxx - ov, y + h * (1 - ov / ((mxz - mnz) / 2)), mz], [mxx - ov, y + h * (1 - ov / ((mxz - mnz) / 2)), mz]], o.gableMat || o.wall || 'siding', { two: true });
        }
      } else {
        const mx = (mnx + mxx) / 2;
        this.quad([[mnx, y, mxz], [mnx, y, mnz], [mx, y + h, mnz], [mx, y + h, mxz]], mat, { two: true });
        this.quad([[mxx, y, mnz], [mxx, y, mxz], [mx, y + h, mxz], [mx, y + h, mnz]], mat, { two: true });
        if (o.gable !== false) {
          this.quad([[mnx + ov, y, mnz + ov], [mxx - ov, y, mnz + ov], [mx, y + h * (1 - ov / ((mxx - mnx) / 2)), mnz + ov], [mx, y + h * (1 - ov / ((mxx - mnx) / 2)), mnz + ov]], o.gableMat || o.wall || 'siding', { two: true });
          this.quad([[mxx - ov, y, mxz - ov], [mnx + ov, y, mxz - ov], [mx, y + h * (1 - ov / ((mxx - mnx) / 2)), mxz - ov], [mx, y + h * (1 - ov / ((mxx - mnx) / 2)), mxz - ov]], o.gableMat || o.wall || 'siding', { two: true });
        }
      }
      if (o.solid !== false) this.box(Math.min(x0, x1), y, Math.min(z0, z1), Math.max(x0, x1), y + h * 0.5, Math.max(z0, z1), null, { vis: false, flags: F.SOLID | F.SHOT | F.SIGHT });
    }
    shed(x0, z0, x1, z1, yLow, yHigh, dir, mat, o) {
      o = o || {};
      const ov = o.over === undefined ? 0.3 : o.over;
      const mnx = Math.min(x0, x1) - ov, mxx = Math.max(x0, x1) + ov, mnz = Math.min(z0, z1) - ov, mxz = Math.max(z0, z1) + ov;
      let pts;
      if (dir === 'n') pts = [[mnx, yLow, mxz], [mxx, yLow, mxz], [mxx, yHigh, mnz], [mnx, yHigh, mnz]];
      else if (dir === 's') pts = [[mxx, yLow, mnz], [mnx, yLow, mnz], [mnx, yHigh, mxz], [mxx, yHigh, mxz]];
      else if (dir === 'e') pts = [[mnx, yLow, mnz], [mnx, yLow, mxz], [mxx, yHigh, mxz], [mxx, yHigh, mnz]];
      else pts = [[mxx, yLow, mxz], [mxx, yLow, mnz], [mnx, yHigh, mnz], [mnx, yHigh, mxz]];
      this.quad(pts, mat, { two: true });
      const th = o.thick === undefined ? 0.12 : o.thick;
      if (th > 0) this.quad(pts.map(p => [p[0], p[1] - th, p[2]]).reverse(), o.under || mat, {});
      if (o.solid) this.box(Math.min(x0, x1), Math.min(yLow, yHigh) - 0.1, Math.min(z0, z1), Math.max(x0, x1), Math.min(yLow, yHigh), Math.max(z0, z1), null, { vis: false, flags: F.SOLID | F.SHOT | F.SIGHT });
    }
    cyl(x, y, z, r, h, mat, o) {
      o = o || {};
      const p = this.pt(x, y, z);
      let b = null;
      if (o.solid !== false) b = this.w.addBlock({ x: p[0], y: p[1] + h / 2, z: p[2], hx: r * 0.85, hy: h / 2, hz: r * 0.85, yaw: this.ryaw(Math.PI / 4), flags: o.flags });
      this.vis({ t: 'cyl', x: p[0], y: p[1], z: p[2], r, r2: o.r2 === undefined ? r : o.r2, h, sides: o.sides || 10, mat, cap: o.cap !== false, tint: o.tint, yaw: this.ryaw(0), noG: o.noG, emit: o.emit });
      return b;
    }
    hcyl(x, y, z, r, len, axisYaw, mat, o) {
      o = o || {};
      const p = this.pt(x, y, z);
      this.vis({ t: 'hcyl', x: p[0], y: p[1], z: p[2], r, len, yaw: this.ryaw(axisYaw), sides: o.sides || 10, mat, tint: o.tint, cap: o.cap !== false });
      if (o.solid) this.w.addBlock({ x: p[0], y: p[1], z: p[2], hx: r, hy: r, hz: len / 2, yaw: this.ryaw(axisYaw), flags: o.flags });
    }
    strip(pts, w, mat, o) {
      o = o || {};
      const lift = o.lift === undefined ? 0.07 : o.lift;
      const H = (x, z) => (this.w.terrainAt(x, z) || 0) + lift;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
        if (l < 1e-6) continue;
        const n = Math.max(1, Math.ceil(l / 2));
        const px = -dz / l * w / 2, pz = dx / l * w / 2;
        for (let k = 0; k < n; k++) {
          const x0 = a[0] + dx * k / n, z0 = a[1] + dz * k / n, x1 = a[0] + dx * (k + 1) / n, z1 = a[1] + dz * (k + 1) / n;
          this.quad([[x0 - px, H(x0 - px, z0 - pz), z0 - pz], [x0 + px, H(x0 + px, z0 + pz), z0 + pz], [x1 + px, H(x1 + px, z1 + pz), z1 + pz], [x1 - px, H(x1 - px, z1 - pz), z1 - pz]], mat, { two: true, uv: o.uv || 3 });
        }
      }
    }
    beam(a, b, r, mat, o) {
      o = o || {};
      return this.vis({ t: 'beam', a: this.pt(a[0], a[1], a[2]), b: this.pt(b[0], b[1], b[2]), r, sides: o.sides || 6, mat: mat || 'metal_dark', tint: o.tint, emit: o.emit });
    }
    vehicle(kind, x, y, z, o) {
      o = o || {};
      const v = Object.assign({ id: o.id || (kind + this.vehicles.length), kind, pos: this.pt(x, y, z), yaw: this.ryaw(o.yaw || 0), hp: 800, r: 2.2, active: false }, o);
      v.pos = this.pt(x, y, z); v.yaw = this.ryaw(o.yaw || 0);
      this.vehicles.push(v);
      return v;
    }
    sphere(x, y, z, r, mat, o) {
      o = o || {};
      const p = this.pt(x, y, z);
      this.vis({ t: 'sphere', x: p[0], y: p[1], z: p[2], r, mat, tint: o.tint, emit: o.emit, sy: o.sy, noG: o.noG });
      if (o.solid) this.w.addBlock({ x: p[0], y: p[1], z: p[2], hx: r * 0.8, hy: r * (o.sy || 1) * 0.9, hz: r * 0.8, yaw: 0, flags: o.flags });
    }
    terrain(o) {
      const cell = o.cell || 2;
      const nx = Math.ceil((o.x1 - o.x0) / cell), nz = Math.ceil((o.z1 - o.z0) / cell);
      const t = new Terrain(o.x0, o.z0, cell, nx, nz);
      t.fill(o.fn);
      t.holes = o.holes || [];
      this.w.terrains.push(t);
      this.vis({ t: 'terrain', ref: t, mat: o.mat || 'grass', steep: o.steep, low: o.low, lowY: o.lowY === undefined ? -1e9 : o.lowY, high: o.high, highY: o.highY === undefined ? 1e9 : o.highY, uv: o.uv });
      return t;
    }
    water(x0, z0, x1, z1, y, o) {
      o = o || {};
      const w = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y, deep: o.deep !== false };
      this.w.waters.push(w);
      this.vis({ t: 'water', x0: w.x0, z0: w.z0, x1: w.x1, z1: w.z1, y, mat: o.mat || 'water', color: o.color });
      return w;
    }
    ladder(x, z, y0, y1, yaw, width, o) {
      o = o || {};
      const w = width || 0.7;
      const p = this.pt(x, 0, z);
      const ry = this.ryaw(yaw);
      const f = X.fwd(ry, 0), r = X.right(ry);
      const hw = w / 2;
      const c = [p[0], p[2]];
      const pts = [[c[0] + r[0] * hw, c[1] + r[2] * hw], [c[0] - r[0] * hw, c[1] - r[2] * hw], [c[0] + r[0] * hw - f[0] * 0.5, c[1] + r[2] * hw - f[2] * 0.5], [c[0] - r[0] * hw - f[0] * 0.5, c[1] - r[2] * hw - f[2] * 0.5]];
      const lx0 = Math.min(...pts.map(q => q[0])), lx1 = Math.max(...pts.map(q => q[0])), lz0 = Math.min(...pts.map(q => q[1])), lz1 = Math.max(...pts.map(q => q[1]));
      const lad = { x0: lx0, z0: lz0, x1: lx1, z1: lz1, y0: p[1] + y0, y1: p[1] + y1, yaw: ry, x: c[0], z: c[1] };
      this.w.ladders.push(lad);
      if (o.vis !== false) {
        const mat = o.mat || 'metal_dark';
        for (const sd of [-1, 1]) {
          const q = [c[0] + r[0] * hw * sd - f[0] * 0.06, c[1] + r[2] * hw * sd - f[2] * 0.06];
          this.vis({ t: 'box', x: q[0], y: p[1] + (y0 + y1) / 2, z: q[1], hx: 0.03, hy: (y1 - y0) / 2, hz: 0.03, yaw: ry, mat });
        }
        for (let yy = y0 + 0.3; yy < y1; yy += 0.3) this.vis({ t: 'box', x: c[0] - f[0] * 0.06, y: p[1] + yy, z: c[1] - f[2] * 0.06, hx: hw, hy: 0.02, hz: 0.02, yaw: ry, mat });
      }
      return lad;
    }
    fence(x0, z0, x1, z1, y, h, o) {
      o = o || {};
      const a = this.pt(x0, y, z0), b = this.pt(x1, y, z1);
      this.vis({ t: 'fence', a, b, h, mat: o.mat || 'chainlink' });
      const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
      const yaw = Math.atan2(-(b[2] - a[2]), b[0] - a[0]);
      if (o.solid !== false) this.w.addBlock({ x: (a[0] + b[0]) / 2, y: a[1] + h / 2, z: (a[2] + b[2]) / 2, hx: len / 2, hy: h / 2, hz: 0.06, yaw, flags: F.SOLID | (o.walkTop ? F.WALK : 0) });
      if (o.posts !== false) {
        const n = Math.max(1, Math.round(len / (o.span || 3)));
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          this.vis({ t: 'cyl', x: a[0] + (b[0] - a[0]) * t, y: a[1], z: a[2] + (b[2] - a[2]) * t, r: 0.04, r2: 0.04, h: h + 0.05, sides: 6, mat: o.postMat || 'metal_grey', cap: true, yaw: 0 });
        }
      }
    }
    sign(text, x, y, z, w, h, yaw, o) {
      o = o || {};
      const p = this.pt(x, y, z);
      return this.vis({ t: 'sign', text, x: p[0], y: p[1], z: p[2], w, h, yaw: this.ryaw(yaw), bg: o.bg || '#e8dcc0', fg: o.fg || '#2a1a10', font: o.font || 'serif', border: o.border, emit: o.emit, style: o.style, two: o.two });
    }
    tree(kind, x, z, o) {
      o = o || {};
      const y = o.y === undefined ? this.w.terrainAt(this.pt(x, 0, z)[0], this.pt(x, 0, z)[2]) : o.y;
      const p = this.pt(x, 0, z);
      const gy = (y === null || y === undefined) ? p[1] : y;
      const h = o.h || 9, r = o.r || h * 0.28;
      this.vis({ t: 'tree', kind, x: p[0], y: gy, z: p[2], h, r, seed: o.seed === undefined ? X.hash(kind + x + ',' + z) : o.seed, snow: o.snow, color: o.color });
      if (o.solid !== false) this.w.addBlock({ x: p[0], y: gy + 2, z: p[2], hx: Math.max(0.18, h * 0.025), hy: 2, hz: Math.max(0.18, h * 0.025), yaw: 0, flags: F.SOLID | F.SHOT | F.SIGHT });
    }
    rock(x, z, r, o) {
      o = o || {};
      const p = this.pt(x, 0, z);
      const y = o.y === undefined ? (this.w.terrainAt(p[0], p[2]) || 0) : o.y;
      this.vis({ t: 'rock', x: p[0], y, z: p[2], r, seed: X.hash('rock' + x + ',' + z), mat: o.mat || 'rock', sy: o.sy || 0.7, snow: o.snow });
      if (o.solid !== false) this.w.addBlock({ x: p[0], y: y + r * (o.sy || 0.7) * 0.45, z: p[2], hx: r * 0.75, hy: r * (o.sy || 0.7) * 0.5, hz: r * 0.75, yaw: 0.4, flags: F.WALL });
    }
    barrel(x, y, z, o) {
      o = o || {};
      const b = this.cyl(x, y, z, 0.3, 0.92, o.mat || 'barrel_red', { sides: 12 });
      const v = this.w.visuals[this.w.visuals.length - 1];
      v.dyn = true;
      const p = this.pt(x, y + 0.45, z);
      const br = { pos: p, block: b, hp: o.hp || 12, id: o.id || ('barrel' + this.barrels.length), vis: v, radius: o.radius || 5, dmg: o.dmg || 200 };
      b.barrel = br;
      this.barrels.push(br);
      return br;
    }
    light(x, y, z, color, radius, o) {
      o = o || {};
      const p = this.pt(x, y, z);
      const l = { p, color: color || [1, 0.85, 0.6], r: radius || 8, flicker: o.flicker || 0, id: o.id, on: o.on !== false };
      this.w.lights.push(l);
      if (o.bulb !== false) this.vis({ t: 'sphere', x: p[0], y: p[1], z: p[2], r: o.bulbR || 0.12, mat: 'bulb', emit: true, tint: color || [1, 0.9, 0.7], light: l });
      return l;
    }
    spawnPlayer(x, y, z, yaw) { const p = this.pt(x, y === null ? 0 : y, z); if (y === null) p[1] = null; this.player = { pos: p, yaw: this.ryaw(yaw) }; }
    char(type, x, z, o) {
      o = o || {};
      const p = this.pt(x, o.y || 0, z);
      if (o.y === undefined) p[1] = null;
      const s = Object.assign({}, o, { type, pos: p, yaw: this.ryaw(o.yaw !== undefined ? o.yaw : (o.look || 0)), id: o.id || (type + '_' + (this.idn++)) });
      if (this.grp) {
        const g = this.grp, c = Math.cos(g.yaw), sn = Math.sin(g.yaw);
        s.grp = g.id;
        s.pos = [g.pos[0] + p[0] * c + p[2] * sn, g.pos[1] + (p[1] || 0), g.pos[2] - p[0] * sn + p[2] * c];
        s.yaw += g.yaw;
      }
      if (o.path) s.path = o.path.map(q => this.pt(q[0], q[2] === undefined ? 0 : q[1], q[2] === undefined ? q[1] : q[2]));
      if (o.look !== undefined) s.lookYaw = this.ryaw(o.look);
      this.spawns.push(s);
      return s;
    }
    item(kind, x, y, z, o) {
      o = o || {};
      const it = Object.assign({}, o, { kind, pos: this.pt(x, y, z), id: o.id || ('it' + this.items.length) });
      if (this.grp) { it.grp = this.grp.id; it.pos = X.groupPoint(this.grp, it.pos); }
      this.items.push(it);
      return it;
    }
    object(kind, x, y, z, yaw, o) {
      o = o || {};
      const ob = Object.assign({}, o, { kind, pos: this.pt(x, y, z), yaw: this.ryaw(yaw || 0), id: o.id || ('ob' + this.objects.length) });
      this.objects.push(ob);
      return ob;
    }
    trigger(id, x0, y0, z0, x1, y1, z1, o) {
      const a = this.pt(x0, y0, z0), b = this.pt(x1, y1, z1);
      const t = Object.assign({ id, min: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])], max: [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])] }, o || {});
      this.triggers.push(t);
      return t;
    }
    usable(id, x, y, z, o) {
      o = o || {};
      const u = Object.assign({ id, pos: this.pt(x, y, z), r: o.r || 1.4, label: o.label || 'Использовать', once: o.once !== false, enabled: o.enabled !== false }, o);
      if (this.grp) { u.grp = this.grp.id; u.pos = X.groupPoint(this.grp, u.pos); }
      this.usables.push(u);
      return u;
    }
    door(x, z, y, w, h, axis, o) {
      o = o || {};
      const t = o.t || 0.08;
      const hinge = o.hinge === 'right' ? 1 : 0;
      let hx, hz, closedYaw;
      if (axis === 'x') { hx = hinge ? x + w / 2 : x - w / 2; hz = z; closedYaw = hinge ? Math.PI : 0; }
      else { hx = x; hz = hinge ? z + w / 2 : z - w / 2; closedYaw = hinge ? Math.PI / 2 : -Math.PI / 2; }
      const hp = this.pt(hx, y, hz);
      const baseYaw = this.ryaw(closedYaw);
      const id = o.id || ('door' + this.doors.length);
      const kind = o.slide ? 'slide' : 'swing';
      const blk = this.w.addMover({ x: hp[0], y: hp[1] + h / 2, z: hp[2], hx: w / 2, hy: h / 2, hz: t, yaw: baseYaw, flags: o.flags === undefined ? (F.SOLID | F.SHOT | F.SIGHT) : o.flags, mat: o.mat || 'door' });
      const d = { id, kind, block: blk, hinge: [hp[0], hp[2]], y: hp[1], w, h, baseYaw, angle: 0, target: 0, open: 0, locked: o.locked || null, openSign: o.dir || 1, speed: o.speed || 2.6, mat: o.mat || 'door', slideAxis: o.slide ? X.right(baseYaw) : null, auto: !!o.auto, bars: !!o.bars, label: o.label, noAI: !!o.noAI, keyName: o.keyName };
      this.doors.push(d);
      this.vis({ t: 'door', door: d, mat: d.mat, bars: d.bars });
      return d;
    }
    searchlight(x, y, z, yaw, o) {
      o = o || {};
      const p = this.pt(x, y, z);
      const l = this.light(x, y, z, o.color || [1, 0.96, 0.8], o.r || 9, { bulb: false });
      const s = { pos: p, yaw: this.ryaw(yaw), sweep: o.sweep === undefined ? 0.8 : o.sweep, speed: o.speed || 0.35, pitch: o.pitch === undefined ? -0.35 : o.pitch, range: o.range || 45, light: l, id: o.id || ('sl' + this.searchlights.length), phase: o.phase || 0 };
      this.searchlights.push(s);
      if (!o.noProp) this.at(x, y - 1.1, z, yaw, () => X.PROPS.searchlight(this, {}));
      return s;
    }
    alarm(x, y, z, yaw, o) {
      const p = this.pt(x, y, z);
      const a = Object.assign({ pos: p, yaw: this.ryaw(yaw || 0), id: 'alarm' + this.alarms.length }, o || {});
      this.alarms.push(a);
      this.vis({ t: 'alarm', x: p[0], y: p[1], z: p[2], yaw: a.yaw });
      return a;
    }
    cam(name, pos, look, fov) {
      this.cams[name] = { pos: this.pt(pos[0], pos[1], pos[2]), look: this.pt(look[0], look[1], look[2]), fov: fov || 45 };
    }
    secCam(x, y, z, yaw, sweep, o) {
      const p = this.pt(x, y, z);
      const c = Object.assign({ pos: p, yaw: this.ryaw(yaw), sweep: sweep === undefined ? 0.7 : sweep, id: 'cam' + this.secCams.length, range: 14 }, o || {});
      this.secCams.push(c);
      return c;
    }
    grapple(x, y, z, bottom, yaw, o) {
      const p = this.pt(x, y, z);
      const g = Object.assign({ pos: p, bottom: bottom + this.tf.y, yaw: this.ryaw(yaw || 0), id: 'hook' + this.grapples.length }, o || {});
      this.grapples.push(g);
      this.vis({ t: 'hook', x: p[0], y: p[1], z: p[2], yaw: g.yaw });
      return g;
    }
    zone(kind, x0, z0, x1, z1, o) {
      const a = this.pt(x0, 0, z0), b = this.pt(x1, 0, z1);
      const zz = Object.assign({ kind, x0: Math.min(a[0], b[0]), z0: Math.min(a[2], b[2]), x1: Math.max(a[0], b[0]), z1: Math.max(a[2], b[2]), y0: -1e9, y1: 1e9 }, o || {});
      this.zones.push(zz);
      return zz;
    }
    path(name, pts) { this.paths[name] = pts.map(q => this.pt(q[0], q[1], q[2])); }
    interior(x0, y0, z0, x1, y1, z1) {
      const a = this.pt(x0, y0, z0), b = this.pt(x1, y1, z1);
      this.w.interiors.push([Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])]);
    }
    clad(x0, z0, x1, z1, y0, y1, mat, side, o) {
      o = o || {};
      const t = 0.03, d = (o.off || 0.12) * side;
      if (Math.abs(z1 - z0) < 1e-6) this.vbox(Math.min(x0, x1), y0, z0 + d - t / 2, Math.max(x0, x1), y1, z0 + d + t / 2, mat);
      else this.vbox(x0 + d - t / 2, y0, Math.min(z0, z1), x0 + d + t / 2, y1, Math.max(z0, z1), mat);
    }
    bounds(x0, z0, x1, z1) { this.navBounds = [Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]; }
    prop(kind, x, y, z, yaw, o) {
      const fn = X.PROPS[kind];
      if (!fn) throw new Error('Unknown prop ' + kind);
      this.at(x, y, z, yaw || 0, () => fn(this, o || {}));
    }
  }
  X.Builder = Builder;

  X.placeGroup = function (g, pos, yaw) {
    const c = Math.cos(yaw), sn = Math.sin(yaw);
    g.pos = pos; g.yaw = yaw;
    for (const b of g.blocks) {
      const l = b.local;
      b.x = pos[0] + l.x * c + l.z * sn;
      b.y = pos[1] + l.y;
      b.z = pos[2] - l.x * sn + l.z * c;
      b.yaw = yaw + l.yaw;
      blockDerive(b);
    }
  };
  X.groupPoint = function (g, l) {
    const c = Math.cos(g.yaw), sn = Math.sin(g.yaw);
    return [g.pos[0] + l[0] * c + l[2] * sn, g.pos[1] + l[1], g.pos[2] - l[0] * sn + l[2] * c];
  };
  X.PROPS = X.PROPS || {};

  X.buildLevel = function (def, opts) {
    const world = new World();
    const B = new Builder(world);
    def.build(B, opts || {});
    world.finalize();
    for (const s of B.spawns) if (s.pos[1] === null) s.pos[1] = world.groundY(s.pos[0], s.pos[2], 1e6);
    if (B.player.pos[1] === null || Number.isNaN(B.player.pos[1])) B.player.pos[1] = world.groundY(B.player.pos[0], B.player.pos[2], 1e6);
    return { world, B };
  };
})(globalThis.XIII = globalThis.XIII || {});
