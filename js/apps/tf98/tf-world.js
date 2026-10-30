(function (T) {
  'use strict';
  const STEP = T.RULES.stepUp;
  const AIR_STEP = 0.04;
  const CELL = 4;
  const DIRS = { 'x+': 1, 'x-': 2, 'z+': 3, 'z-': 4 };
  const FACING = { 'x+': [1, 0], 'x-': [-1, 0], 'z+': [0, 1], 'z-': [0, -1] };

  function rampTop(s, x, z) {
    let f;
    if (s.ramp === 1) f = (x - s.x0) / (s.x1 - s.x0);
    else if (s.ramp === 2) f = (s.x1 - x) / (s.x1 - s.x0);
    else if (s.ramp === 3) f = (z - s.z0) / (s.z1 - s.z0);
    else f = (s.z1 - z) / (s.z1 - s.z0);
    f = f < 0 ? 0 : f > 1 ? 1 : f;
    return s.lo + (s.hi - s.lo) * f;
  }

  function topAt(s, x, z) { return s.ramp ? rampTop(s, x < s.x0 ? s.x0 : x > s.x1 ? s.x1 : x, z < s.z0 ? s.z0 : z > s.z1 ? s.z1 : z) : s.y1; }

  function onEntrySide(s, x, z) {
    if (s.oneWay === 'x+') return x < (s.x0 + s.x1) / 2;
    if (s.oneWay === 'x-') return x > (s.x0 + s.x1) / 2;
    if (s.oneWay === 'z+') return z < (s.z0 + s.z1) / 2;
    return z > (s.z0 + s.z1) / 2;
  }

  function circleHits(s, x, z, r) {
    const cx = x < s.x0 ? s.x0 : x > s.x1 ? s.x1 : x, cz = z < s.z0 ? s.z0 : z > s.z1 ? s.z1 : z;
    return (cx - x) * (cx - x) + (cz - z) * (cz - z) < r * r;
  }

  class World {
    constructor(solids, bounds, water, ladders) {
      this.solids = solids;
      this.bounds = bounds;
      this.water = water;
      this.ladders = ladders;
      this.stamp = 1;
      this.buildGrid();
    }

    buildGrid() {
      const b = this.bounds;
      this.gx0 = b.x0 - CELL; this.gz0 = b.z0 - CELL;
      this.gw = Math.ceil((b.x1 - b.x0) / CELL) + 3; this.gh = Math.ceil((b.z1 - b.z0) / CELL) + 3;
      this.cells = new Array(this.gw * this.gh);
      for (let i = 0; i < this.cells.length; i++) this.cells[i] = [];
      for (let i = 0; i < this.solids.length; i++) {
        const s = this.solids[i];
        s.idx = i; s.mark = 0;
        const i0 = Math.max(0, Math.floor((s.x0 - this.gx0) / CELL)), i1 = Math.min(this.gw - 1, Math.floor((s.x1 - this.gx0) / CELL));
        const j0 = Math.max(0, Math.floor((s.z0 - this.gz0) / CELL)), j1 = Math.min(this.gh - 1, Math.floor((s.z1 - this.gz0) / CELL));
        for (let j = j0; j <= j1; j++) for (let k = i0; k <= i1; k++) this.cells[j * this.gw + k].push(s);
      }
    }

    near(x0, z0, x1, z1, out) {
      const res = out || [];
      res.length = 0;
      const st = ++this.stamp;
      const i0 = Math.max(0, Math.floor((x0 - this.gx0) / CELL)), i1 = Math.min(this.gw - 1, Math.floor((x1 - this.gx0) / CELL));
      const j0 = Math.max(0, Math.floor((z0 - this.gz0) / CELL)), j1 = Math.min(this.gh - 1, Math.floor((z1 - this.gz0) / CELL));
      for (let j = j0; j <= j1; j++) {
        for (let k = i0; k <= i1; k++) {
          const c = this.cells[j * this.gw + k];
          for (let n = 0; n < c.length; n++) {
            const s = c[n];
            if (s.mark === st) continue;
            s.mark = st;
            if (s.off) continue;
            if (s.x1 < x0 || s.x0 > x1 || s.z1 < z0 || s.z0 > z1) continue;
            res.push(s);
          }
        }
      }
      return res;
    }

    blocks(s, e) {
      if (s.off || s.nomove) return false;
      if (s.only && s.only === e.team) return false;
      if (s.oneWay && e.through === s) return false;
      return true;
    }

    groundAt(x, z, fromY = 200, r = 0, e = null) {
      const list = this.near(x - r, z - r, x + r, z + r, this._q || (this._q = []));
      let best = -Infinity;
      for (const s of list) {
        if (s.nomove || (e && !this.blocks(s, e))) continue;
        if (r > 0) {
          if (!circleHits(s, x, z, r)) continue;
        } else if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
        const t = s.ramp ? topAt(s, x, z) : s.y1;
        if (t <= fromY + 1e-4 && t > best) best = t;
      }
      return best;
    }

    spawnY(x, z, fromY = 200) {
      const g = this.groundAt(x, z, fromY, 0);
      return g === -Infinity ? 0 : g;
    }

    ceilingAt(x, z, feet, r, e) {
      const list = this.near(x - r, z - r, x + r, z + r, this._q2 || (this._q2 = []));
      let best = Infinity;
      for (const s of list) {
        if (!this.blocks(s, e)) continue;
        if (!circleHits(s, x, z, r * 0.7)) continue;
        if (s.y0 > feet + STEP && s.y0 < best) best = s.y0;
      }
      return best;
    }

    fits(e, x, z, feet, h) {
      const r = e.r - 0.01;
      const list = this.near(x - r, z - r, x + r, z + r, this._q5 || (this._q5 = []));
      for (const s of list) {
        if (!this.blocks(s, e) || !circleHits(s, x, z, r)) continue;
        const top = s.ramp ? topAt(s, x, z) : s.y1;
        if (s.y0 < feet + h - 1e-3 && top > feet + STEP) return false;
      }
      return true;
    }

    pushOut(e, x, z, step) {
      const r = e.r, feet = e.pos.y, head = feet + e.h;
      const list = this.near(x - r - 0.1, z - r - 0.1, x + r + 0.1, z + r + 0.1, this._q3 || (this._q3 = []));
      let wall = null;
      for (let it = 0; it < 3; it++) {
        let moved = false;
        for (const s of list) {
          if (!this.blocks(s, e)) continue;
          if (s.y0 >= head - 0.05) continue;
          const cx = x < s.x0 ? s.x0 : x > s.x1 ? s.x1 : x, cz = z < s.z0 ? s.z0 : z > s.z1 ? s.z1 : z;
          const top = s.ramp ? rampTop(s, cx, cz) : s.y1;
          if (top <= feet + step) continue;
          const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
          if (d2 >= r * r) continue;
          if (s.oneWay && onEntrySide(s, x, z)) { e.through = s; continue; }
          if (d2 > 1e-10) {
            const d = Math.sqrt(d2);
            x = cx + dx / d * r; z = cz + dz / d * r;
            wall = { nx: dx / d, nz: dz / d, s, top };
          } else {
            const l = x - s.x0, rr = s.x1 - x, b = z - s.z0, t = s.z1 - z, m = Math.min(l, rr, b, t);
            if (m === l) { x = s.x0 - r; wall = { nx: -1, nz: 0, s, top }; }
            else if (m === rr) { x = s.x1 + r; wall = { nx: 1, nz: 0, s, top }; }
            else if (m === b) { z = s.z0 - r; wall = { nx: 0, nz: -1, s, top }; }
            else { z = s.z1 + r; wall = { nx: 0, nz: 1, s, top }; }
          }
          moved = true;
        }
        if (!moved) break;
      }
      this._wall = wall;
      return [x, z];
    }

    moveChar(e, dt) {
      const p = e.pos, v = e.vel;
      const dx = v.x * dt, dz = v.z * dt;
      const dist = Math.hypot(dx, dz);
      const steps = Math.max(1, Math.ceil(dist / (e.r * 0.7)));
      const step = e.onGround || e.climbing ? STEP : AIR_STEP;
      let x = p.x, z = p.z;
      e.wall = null;
      for (let i = 0; i < steps; i++) {
        const r = this.pushOut(e, x + dx / steps, z + dz / steps, step);
        if (this._wall) e.wall = this._wall;
        x = r[0]; z = r[1];
      }
      const b = this.bounds;
      x = x < b.x0 ? b.x0 : x > b.x1 ? b.x1 : x;
      z = z < b.z0 ? b.z0 : z > b.z1 ? b.z1 : z;
      if (e.wall) {
        const into = v.x * e.wall.nx + v.z * e.wall.nz + T.RULES.wallKeep;
        if (into < 0) { v.x -= into * e.wall.nx; v.z -= into * e.wall.nz; }
      }
      const moved = Math.hypot(x - p.x, z - p.z);
      e.blocked = dist > 1e-5 ? 1 - moved / dist : 0;
      p.x = x; p.z = z;
      if (e.through && !circleHits(e.through, x, z, e.r)) e.through = null;
      let y = p.y + v.y * dt;
      const ground = this.groundAt(x, z, Math.max(p.y, y) + step, e.r * 0.55, e);
      const wasGround = e.onGround;
      if (ground > -Infinity && y <= ground + 1e-4) {
        y = ground;
        if (v.y < 0) v.y = 0;
        e.onGround = true;
      } else if (wasGround && v.y <= 0.01 && ground > -Infinity && p.y - ground < STEP + 0.05) {
        y = ground; v.y = 0; e.onGround = true;
      } else {
        e.onGround = false;
      }
      if (v.y > 0) {
        const c = this.ceilingAt(x, z, p.y, e.r, e);
        if (y + e.h > c) { y = c - e.h; if (y < p.y) y = p.y; v.y = 0; }
      }
      p.y = y;
    }

    waterTop(x, y, z) {
      for (const w of this.water) {
        if (x >= w.x0 && x <= w.x1 && z >= w.z0 && z <= w.z1 && y >= w.y0 - 0.01 && y <= w.y1) return w.y1;
      }
      return -Infinity;
    }

    ladderAt(x, feet, z, r) {
      for (const l of this.ladders) {
        if (feet >= l.y0 - 0.1 && feet < l.y1 - 0.02 && circleHits(l, x, z, r)) return l;
      }
      return null;
    }

    rayBox(s, ox, oy, oz, dx, dy, dz, maxT) {
      let tmin = 0, tmax = maxT, nx = 0, ny = 0, nz = 0;
      if (Math.abs(dx) < 1e-9) { if (ox < s.x0 || ox > s.x1) return null; }
      else {
        const inv = 1 / dx; let t1 = (s.x0 - ox) * inv, t2 = (s.x1 - ox) * inv, n = -1;
        if (t1 > t2) { const t = t1; t1 = t2; t2 = t; n = 1; }
        if (t1 > tmin) { tmin = t1; nx = n; ny = 0; nz = 0; }
        if (t2 < tmax) tmax = t2;
        if (tmin > tmax) return null;
      }
      if (Math.abs(dy) < 1e-9) { if (oy < s.y0 || oy > s.y1) return null; }
      else {
        const inv = 1 / dy; let t1 = (s.y0 - oy) * inv, t2 = (s.y1 - oy) * inv, n = -1;
        if (t1 > t2) { const t = t1; t1 = t2; t2 = t; n = 1; }
        if (t1 > tmin) { tmin = t1; nx = 0; ny = n; nz = 0; }
        if (t2 < tmax) tmax = t2;
        if (tmin > tmax) return null;
      }
      if (Math.abs(dz) < 1e-9) { if (oz < s.z0 || oz > s.z1) return null; }
      else {
        const inv = 1 / dz; let t1 = (s.z0 - oz) * inv, t2 = (s.z1 - oz) * inv, n = -1;
        if (t1 > t2) { const t = t1; t1 = t2; t2 = t; n = 1; }
        if (t1 > tmin) { tmin = t1; nx = 0; ny = 0; nz = n; }
        if (t2 < tmax) tmax = t2;
        if (tmin > tmax) return null;
      }
      return { t: tmin, nx, ny, nz };
    }

    rayRamp(s, ox, oy, oz, dx, dy, dz, maxT) {
      let kx = 0, kz = 0, c;
      if (s.ramp === 1) { kx = (s.hi - s.lo) / (s.x1 - s.x0); c = s.lo - kx * s.x0; }
      else if (s.ramp === 2) { kx = -(s.hi - s.lo) / (s.x1 - s.x0); c = s.lo - kx * s.x1; }
      else if (s.ramp === 3) { kz = (s.hi - s.lo) / (s.z1 - s.z0); c = s.lo - kz * s.z0; }
      else { kz = -(s.hi - s.lo) / (s.z1 - s.z0); c = s.lo - kz * s.z1; }
      const planes = [[-1, 0, 0, -s.x0], [1, 0, 0, s.x1], [0, 0, -1, -s.z0], [0, 0, 1, s.z1], [0, -1, 0, -s.y0], [-kx, 1, -kz, c]];
      let tE = 0, tL = maxT, en = null;
      for (const pl of planes) {
        const num = pl[3] - (pl[0] * ox + pl[1] * oy + pl[2] * oz);
        const den = pl[0] * dx + pl[1] * dy + pl[2] * dz;
        if (Math.abs(den) < 1e-12) { if (num < 0) return null; continue; }
        const t = num / den;
        if (den < 0) { if (t > tE) { tE = t; en = pl; } }
        else if (t < tL) tL = t;
        if (tE > tL) return null;
      }
      if (!en) en = [0, 1, 0];
      const l = Math.hypot(en[0], en[1], en[2]) || 1;
      return { t: tE, nx: en[0] / l, ny: en[1] / l, nz: en[2] / l };
    }

    raycast(ox, oy, oz, dx, dy, dz, maxT, doorsBlock, shells) {
      let best = maxT, hit = null;
      const st = ++this.stamp;
      let cx = Math.floor((ox - this.gx0) / CELL), cz = Math.floor((oz - this.gz0) / CELL);
      const stepX = dx > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
      const tdx = Math.abs(dx) > 1e-9 ? CELL / Math.abs(dx) : Infinity;
      const tdz = Math.abs(dz) > 1e-9 ? CELL / Math.abs(dz) : Infinity;
      let tmx = Math.abs(dx) > 1e-9 ? ((cx + (dx > 0 ? 1 : 0)) * CELL + this.gx0 - ox) / dx : Infinity;
      let tmz = Math.abs(dz) > 1e-9 ? ((cz + (dz > 0 ? 1 : 0)) * CELL + this.gz0 - oz) / dz : Infinity;
      let t = 0, guard = 0;
      while (t <= best && guard++ < 400) {
        if (cx >= 0 && cz >= 0 && cx < this.gw && cz < this.gh) {
          const cell = this.cells[cz * this.gw + cx];
          for (let n = 0; n < cell.length; n++) {
            const s = cell[n];
            if (s.mark === st) continue;
            s.mark = st;
            if (s.off || (s.nobul && !(doorsBlock && (s.only || s.oneWay)) && !(shells && s.grate))) continue;
            const h = s.ramp ? this.rayRamp(s, ox, oy, oz, dx, dy, dz, best) : this.rayBox(s, ox, oy, oz, dx, dy, dz, best);
            if (h && h.t < best) { best = h.t; hit = h; hit.s = s; }
          }
        } else if ((cx < 0 && stepX < 0) || (cz < 0 && stepZ < 0) || (cx >= this.gw && stepX > 0) || (cz >= this.gh && stepZ > 0)) break;
        if (tmx < tmz) { t = tmx; tmx += tdx; cx += stepX; } else { t = tmz; tmz += tdz; cz += stepZ; }
      }
      return hit;
    }

    clear(ax, ay, az, bx, by, bz) {
      const dx = bx - ax, dy = by - ay, dz = bz - az, d = Math.hypot(dx, dy, dz);
      if (d < 1e-6) return true;
      return !this.raycast(ax, ay, az, dx / d, dy / d, dz / d, d);
    }
  }

  T.World = World;
  T.topAt = topAt;

  class MapBuilder {
    constructor(opts = {}) {
      this.visual = opts.visual !== false;
      this.solids = [];
      this.vis = { boxes: [], ramps: [], steps: [], water: [] };
      this.waterVolumes = [];
      this.ladders = [];
      this.spawns = [];
      this.dummies = [];
      this.targets = [];
      this.pickups = [];
      this.lockers = [];
      this.noBuildZones = [];
      this.patrols = [];
      this.turrets = [];
      this.roamPoints = [];
      this.flags = [];
      this.captures = [];
      this.hints = [];
      this.posts = [];
      this.labels = [];
      this.kill = -14;
      this.bnd = null;
    }

    solid(x0, y0, z0, x1, y1, z1, o = {}) {
      const s = { x0: Math.min(x0, x1), y0: Math.min(y0, y1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1: Math.max(y0, y1), z1: Math.max(z0, z1) };
      if (o.nobul) s.nobul = true;
      if (o.grate) s.grate = true;
      if (o.clip) s.clip = true;
      if (o.nomove) s.nomove = true;
      if (o.only) s.only = o.only;
      if (o.oneWay) s.oneWay = o.oneWay;
      if (o.ramp) { s.ramp = o.ramp; s.lo = o.lo; s.hi = o.hi; }
      this.solids.push(s);
      return s;
    }

    box(x0, y0, z0, x1, y1, z1, mat, o = {}) {
      const s = o.col === false ? null : this.solid(x0, y0, z0, x1, y1, z1, o);
      if (this.visual && o.vis !== false) {
        this.vis.boxes.push({
          x0: Math.min(x0, x1), y0: Math.min(y0, y1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1: Math.max(y0, y1), z1: Math.max(z0, z1),
          mat, grid: o.grid !== false
        });
      }
      return s;
    }

    block(x, z, w, d, h, mat, o = {}) {
      const y0 = o.y || 0;
      return this.box(x - w / 2, y0, z - d / 2, x + w / 2, y0 + h, z + d / 2, mat, o);
    }

    floor(x0, z0, x1, z1, y, mat, o = {}) {
      return this.box(x0, y - (o.t || 1), z0, x1, y, z1, mat, o);
    }

    ground(x0, z0, x1, z1, y, holes, mat, o = {}) {
      const xs = [x0, x1], zs = [z0, z1];
      for (const h of holes) { xs.push(h[0], h[2]); zs.push(h[1], h[3]); }
      xs.sort((a, b) => a - b); zs.sort((a, b) => a - b);
      for (let i = 0; i < xs.length - 1; i++) {
        for (let j = 0; j < zs.length - 1; j++) {
          if (xs[i + 1] - xs[i] < 1e-3 || zs[j + 1] - zs[j] < 1e-3) continue;
          const mx = (xs[i] + xs[i + 1]) / 2, mz = (zs[j] + zs[j + 1]) / 2;
          if (holes.some(h => mx > h[0] && mx < h[2] && mz > h[1] && mz < h[3])) continue;
          this.floor(xs[i], zs[j], xs[i + 1], zs[j + 1], y, mat, o);
        }
      }
    }

    wall(x0, z0, x1, z1, h, t, mat, o = {}) {
      const y0 = o.y || 0, y1 = y0 + h;
      const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
      const a0 = alongX ? Math.min(x0, x1) : Math.min(z0, z1), a1 = alongX ? Math.max(x0, x1) : Math.max(z0, z1);
      const c = alongX ? z0 : x0;
      const holes = (o.holes || []).map(hh => ({ a: a0 + hh[0], b: a0 + hh[1], y0: y0 + (hh[2] || 0), y1: y0 + (hh[3] === undefined ? h : hh[3]) }));
      const cuts = [a0, a1];
      for (const hh of holes) cuts.push(Math.max(a0, Math.min(a1, hh.a)), Math.max(a0, Math.min(a1, hh.b)));
      cuts.sort((p, q) => p - q);
      for (let i = 0; i < cuts.length - 1; i++) {
        const u0 = cuts[i], u1 = cuts[i + 1];
        if (u1 - u0 < 1e-3) continue;
        const mid = (u0 + u1) / 2;
        let spans = [[y0, y1]];
        for (const hh of holes) {
          if (hh.a > mid || hh.b < mid) continue;
          const next = [];
          for (const sp of spans) {
            if (hh.y1 <= sp[0] || hh.y0 >= sp[1]) { next.push(sp); continue; }
            if (hh.y0 > sp[0]) next.push([sp[0], hh.y0]);
            if (hh.y1 < sp[1]) next.push([hh.y1, sp[1]]);
          }
          spans = next;
        }
        for (const sp of spans) {
          if (sp[1] - sp[0] < 1e-3) continue;
          if (alongX) this.box(u0, sp[0], c - t / 2, u1, sp[1], c + t / 2, mat, o);
          else this.box(c - t / 2, sp[0], u0, c + t / 2, sp[1], u1, mat, o);
        }
      }
    }

    ramp(x0, z0, x1, z1, lo, hi, dir, mat, o = {}) {
      const d = DIRS[dir];
      const base = o.base === undefined ? Math.min(lo, hi) : o.base;
      const s = this.solid(x0, base, z0, x1, Math.max(lo, hi), z1, Object.assign({}, o, { ramp: d, lo, hi }));
      if (this.visual) this.vis.ramps.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), base, lo, hi, dir: d, mat });
      return s;
    }

    stairs(x0, z0, x1, z1, lo, hi, dir, mat, o = {}) {
      const d = DIRS[dir];
      const base = o.base === undefined ? Math.min(lo, hi) : o.base;
      const s = this.solid(x0, base, z0, x1, Math.max(lo, hi), z1, Object.assign({}, o, { ramp: d, lo, hi }));
      if (this.visual) this.vis.steps.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), base, lo, hi, dir: d, mat, n: o.n || Math.max(2, Math.round(Math.abs(hi - lo) / 0.3)) });
      return s;
    }

    bars(x0, z0, x1, z1, y0, y1, mat) {
      const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
      const a0 = alongX ? Math.min(x0, x1) : Math.min(z0, z1), a1 = alongX ? Math.max(x0, x1) : Math.max(z0, z1);
      const c = alongX ? z0 : x0, n = Math.max(2, Math.round((a1 - a0) / 0.3));
      for (let i = 0; i <= n; i++) {
        const u = a0 + (a1 - a0) * i / n;
        if (alongX) this.box(u - 0.03, y0, c - 0.03, u + 0.03, y1, c + 0.03, i % 2 ? 'dark' : mat, { col: false, grid: false });
        else this.box(c - 0.03, y0, u - 0.03, c + 0.03, y1, u + 0.03, i % 2 ? 'dark' : mat, { col: false, grid: false });
      }
    }

    gate(x0, z0, x1, z1, h, dir, o = {}) {
      const y0 = o.y || 0;
      this.solid(x0 === x1 ? x0 - 0.15 : x0, y0, z0 === z1 ? z0 - 0.15 : z0, x0 === x1 ? x1 + 0.15 : x1, y0 + h, z0 === z1 ? z1 + 0.15 : z1, { oneWay: dir, nobul: true });
      this.bars(x0, z0, x1, z1, y0, y0 + h, 'hazard');
    }

    door(x0, z0, x1, z1, h, team, o = {}) {
      const y0 = o.y || 0;
      this.solid(x0 === x1 ? x0 - 0.15 : x0, y0, z0 === z1 ? z0 - 0.15 : z0, x0 === x1 ? x1 + 0.15 : x1, y0 + h, z0 === z1 ? z1 + 0.15 : z1, { only: team, nobul: true });
      this.bars(x0, z0, x1, z1, y0, y0 + h, team);
    }

    water(x0, z0, x1, z1, y0, y1) {
      this.waterVolumes.push({ x0, z0, x1, z1, y0, y1 });
      if (this.visual) this.vis.water.push({ x0, z0, x1, z1, y: y1 });
    }

    ladder(x0, z0, x1, z1, y0, y1, facing) {
      const f = FACING[facing];
      this.ladders.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y0, y1, fx: f[0], fz: f[1] });
    }

    spawn(team, x, z, yaw, y) { this.spawns.push({ team, x, z, yaw, y }); }
    dummy(merc, team, x, z, yaw) { this.dummies.push({ merc, team, x, z, yaw }); }
    target(x, z, yaw) { this.targets.push({ x, z, yaw }); }
    patrol(merc, team, points) { this.patrols.push({ merc, team, points }); }
    turret(kind, team, x, z, yaw, merc) { this.turrets.push({ kind, team, x, z, yaw, merc }); }
    health(x, z, size) { this.pickups.push({ kind: 'health', size, x, z }); }
    ammo(x, z, size) { this.pickups.push({ kind: 'ammo', size, x, z }); }
    pickupAt(kind, x, z, size, y) { this.pickups.push({ kind, size, x, z, y }); }
    roam(x, z, y) { this.roamPoints.push({ x, z, y }); }
    flag(team, x, y, z) { this.flags.push({ team, x, y, z }); }
    capture(team, x, y, z, r) { this.captures.push({ team, x, y, z, r }); }
    hint(kind, team, x, y, z, yaw) { this.hints.push({ kind, team, x, y, z, yaw }); }
    post(team, role, x, z, y) { this.posts.push({ team, role, x, y, z }); }
    locker(x, z, y) {
      this.block(x, z, 0.9, 0.6, 2, 'locker', { y: y || 0 });
      this.lockers.push({ x, z, y });
    }
    label(x, y, z, text) { this.labels.push({ x, y, z, text }); }
    noBuild(x0, z0, x1, z1) { this.noBuildZones.push({ x0, z0, x1, z1 }); }
    bounds(x0, z0, x1, z1) { this.bnd = { x0, z0, x1, z1 }; }
    killY(y) { this.kill = y; }

    finish() {
      const b = this.bnd || { x0: -80, z0: -80, x1: 80, z1: 80 };
      const world = new World(this.solids, b, this.waterVolumes, this.ladders);
      for (const s of this.spawns) if (s.y === undefined) s.y = world.spawnY(s.x, s.z);
      for (const d of this.dummies) d.y = world.spawnY(d.x, d.z);
      for (const t of this.targets) t.y = world.spawnY(t.x, t.z);
      for (const p of this.pickups) if (p.y === undefined) p.y = world.spawnY(p.x, p.z);
      for (const r of this.roamPoints) if (r.y === undefined) r.y = world.spawnY(r.x, r.z);
      for (const l of this.lockers) if (l.y === undefined) l.y = world.spawnY(l.x + 1, l.z);
      for (const p of this.patrols) p.y = world.spawnY(p.points[0][0], p.points[0][1]);
      for (const t of this.turrets) t.y = world.spawnY(t.x, t.z);
      return { world, solids: this.solids, vis: this.vis, spawns: this.spawns, dummies: this.dummies, targets: this.targets, pickups: this.pickups, lockers: this.lockers, noBuild: this.noBuildZones, patrols: this.patrols, turrets: this.turrets, roam: this.roamPoints, flags: this.flags, captures: this.captures, hints: this.hints, posts: this.posts, labels: this.labels, bounds: b, killY: this.kill };
    }
  }
  T.MapBuilder = MapBuilder;

  T.MAPS = T.MAPS || {};
  T.buildMap = function (id, opts = {}) {
    const def = T.MAPS[id];
    if (!def) throw new Error('no map ' + id);
    const B = new MapBuilder(opts);
    def.build(B, T);
    const m = B.finish();
    m.id = id;
    m.name = def.name;
    return m;
  };

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
