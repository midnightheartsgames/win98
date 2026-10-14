(function (O) {
  'use strict';
  const STEP = 0.45;
  const CELL = 4;
  const DIRS = { 'x+': 1, 'x-': 2, 'z+': 3, 'z-': 4 };

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

  class World {
    constructor(solids, bounds) {
      this.solids = solids;
      this.bounds = bounds;
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

    blocks(s, team) {
      if (s.off || s.nomove) return false;
      if (s.blockTeam === undefined || s.blockTeam === -1) return true;
      return s.blockTeam === team;
    }

    groundAt(x, z, fromY = 200, r = 0, team = -2) {
      const list = this.near(x - r, z - r, x + r, z + r, this._q || (this._q = []));
      let best = -Infinity;
      for (const s of list) {
        if (team !== -2 && !this.blocks(s, team)) continue;
        if (s.nomove) continue;
        if (r > 0) {
          const cx = x < s.x0 ? s.x0 : x > s.x1 ? s.x1 : x, cz = z < s.z0 ? s.z0 : z > s.z1 ? s.z1 : z;
          if ((cx - x) * (cx - x) + (cz - z) * (cz - z) > r * r) continue;
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

    ceilingAt(x, z, feet, r, team) {
      const list = this.near(x - r, z - r, x + r, z + r, this._q2 || (this._q2 = []));
      let best = Infinity;
      for (const s of list) {
        if (!this.blocks(s, team)) continue;
        const cx = x < s.x0 ? s.x0 : x > s.x1 ? s.x1 : x, cz = z < s.z0 ? s.z0 : z > s.z1 ? s.z1 : z;
        if ((cx - x) * (cx - x) + (cz - z) * (cz - z) > r * r * 0.5) continue;
        if (s.y0 > feet + STEP && s.y0 < best) best = s.y0;
      }
      return best;
    }

    pushOut(e, x, z) {
      const r = e.r, feet = e.pos.y, head = feet + e.h;
      const list = this.near(x - r - 0.1, z - r - 0.1, x + r + 0.1, z + r + 0.1, this._q3 || (this._q3 = []));
      let wall = null;
      for (let it = 0; it < 3; it++) {
        let moved = false;
        for (const s of list) {
          if (!this.blocks(s, e.team)) continue;
          if (s.y0 >= head - 0.05) continue;
          const cx = x < s.x0 ? s.x0 : x > s.x1 ? s.x1 : x, cz = z < s.z0 ? s.z0 : z > s.z1 ? s.z1 : z;
          const top = s.ramp ? rampTop(s, cx, cz) : s.y1;
          if (top <= feet + STEP) continue;
          const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
          if (d2 >= r * r) continue;
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
      let x = p.x, z = p.z;
      e.wall = null;
      for (let i = 0; i < steps; i++) {
        const r = this.pushOut(e, x + dx / steps, z + dz / steps);
        if (this._wall) e.wall = this._wall;
        x = r[0]; z = r[1];
      }
      if (e.dyn) {
        for (const d of e.dyn) {
          const ddx = x - d.x, ddz = z - d.z, dd = Math.hypot(ddx, ddz), min = d.r + e.r;
          if (dd < min && p.y < d.y1 && p.y + e.h > d.y0) {
            if (d.top && p.y >= d.y1 - STEP) continue;
            const k = dd > 1e-6 ? min / dd : 0;
            if (k) { x = d.x + ddx * k; z = d.z + ddz * k; } else x = d.x + min;
          }
        }
      }
      if (e.bound) {
        const b = this.bounds;
        x = x < b.x0 ? b.x0 : x > b.x1 ? b.x1 : x;
        z = z < b.z0 ? b.z0 : z > b.z1 ? b.z1 : z;
      }
      const moved = Math.hypot(x - p.x, z - p.z);
      e.blocked = dist > 1e-5 ? 1 - moved / dist : 0;
      p.x = x; p.z = z;
      let y = p.y + v.y * dt;
      const ground = this.groundAt(x, z, Math.max(p.y, y) + STEP, e.r * 0.55, e.team);
      const wasGround = e.onGround;
      if (ground > -Infinity && y <= ground + 1e-4) {
        y = ground;
        if (v.y < 0) v.y = 0;
        e.onGround = true;
      } else if (wasGround && v.y <= 0.01 && ground > -Infinity && p.y - ground < 0.55) {
        y = ground; v.y = 0; e.onGround = true;
      } else {
        e.onGround = false;
      }
      if (v.y > 0) {
        const c = this.ceilingAt(x, z, p.y, e.r, e.team);
        if (y + e.h > c) { y = c - e.h; if (y < p.y) y = p.y; v.y = 0; }
      }
      p.y = y;
      e.groundY = ground;
    }

    wallNear(x, y, z, r) {
      const list = this.near(x - r, z - r, x + r, z + r, this._q4 || (this._q4 = []));
      let best = null, bd = r;
      for (const s of list) {
        if (s.nomove || s.blockTeam >= 0 || s.ramp) continue;
        if (s.y0 > y + 0.5 || s.y1 < y + 1.4) continue;
        const cx = x < s.x0 ? s.x0 : x > s.x1 ? s.x1 : x, cz = z < s.z0 ? s.z0 : z > s.z1 ? s.z1 : z;
        const d = Math.hypot(x - cx, z - cz);
        if (d < bd && d > 1e-6) { bd = d; best = { nx: (x - cx) / d, nz: (z - cz) / d, d, s }; }
      }
      return best;
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

    raycast(ox, oy, oz, dx, dy, dz, maxT, forMove) {
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
            if (s.off || s.role || (forMove ? s.nomove : s.nobul)) continue;
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

  O.World = World;
  O.World.STEP = STEP;
  O.topAt = topAt;

  const PROP_COL = {
    crate: [[-0.6, 0, -0.6, 0.6, 1.2, 0.6]],
    crates: [[-1.2, 0, -0.6, 1.2, 1.2, 0.6], [-0.6, 1.2, -0.6, 0.6, 2.4, 0.6]],
    barrel: [[-0.4, 0, -0.4, 0.4, 1.1, 0.4]],
    barrels: [[-0.9, 0, -0.45, 0.9, 1.1, 0.45]],
    tree_sakura: [[-0.3, 0, -0.3, 0.3, 3.2, 0.3]],
    tree_palm: [[-0.3, 0, -0.3, 0.3, 6, 0.3]],
    tree_olive: [[-0.3, 0, -0.3, 0.3, 2.6, 0.3]],
    tree_pine: [[-0.35, 0, -0.35, 0.35, 5, 0.35]],
    tree_round: [[-0.3, 0, -0.3, 0.3, 3, 0.3]],
    lamp: [[-0.18, 0, -0.18, 0.18, 4.2, 0.18]],
    lamp2: [[-0.18, 0, -0.18, 0.18, 4.6, 0.18]],
    lantern_stone: [[-0.4, 0, -0.4, 0.4, 1.7, 0.4]],
    bench: [[-1, 0, -0.3, 1, 0.55, 0.3]],
    car: [[-0.95, 0, -2.1, 0.95, 1.4, 2.1]],
    bus: [[-1.3, 0, -5, 1.3, 3.2, 5]],
    truck: [[-1.2, 0, -3.2, 1.2, 2.6, 3.2]],
    fountain: [[-2.4, 0, -2.4, 2.4, 0.9, 2.4], [-0.5, 0.9, -0.5, 0.5, 2.4, 0.5]],
    statue: [[-1, 0, -1, 1, 1.4, 1], [-0.5, 1.4, -0.5, 0.5, 4, 0.5]],
    phonebox: [[-0.55, 0, -0.55, 0.55, 2.6, 0.55]],
    stall: [[-1.5, 0, -0.9, 1.5, 1.1, 0.9]],
    planter: [[-0.8, 0, -0.8, 0.8, 0.8, 0.8]],
    hydrant: [[-0.2, 0, -0.2, 0.2, 0.8, 0.2]],
    vending: [[-0.5, 0, -0.4, 0.5, 2, 0.4]],
    rock: [[-1.2, 0, -1, 1.2, 1.4, 1]],
    bigrock: [[-2.4, 0, -2, 2.4, 3, 2]],
    table: [[-0.6, 0, -0.6, 0.6, 0.8, 0.6]],
    cart: [[-1.2, 0, -0.7, 1.2, 1.2, 0.7]],
    torii: [[-3.4, 0, -0.35, -2.7, 6, 0.35], [2.7, 0, -0.35, 3.4, 6, 0.35]],
    forklift: [[-0.8, 0, -1.4, 0.8, 2.2, 1.4]],
    container: [[-1.25, 0, -3, 1.25, 2.6, 3]],
    generator: [[-1, 0, -0.8, 1, 1.6, 0.8]],
    bollard: [[-0.15, 0, -0.15, 0.15, 0.9, 0.15]],
    column: [[-0.5, 0, -0.5, 0.5, 6, 0.5]],
    brokencol: [[-0.5, 0, -0.5, 0.5, 2.2, 0.5]],
    pot: [[-0.35, 0, -0.35, 0.35, 0.9, 0.35]],
    trailer: [[-1.4, 0, -3.8, 1.4, 3, 3.8]],
    crane: [[-1, 0, -1.3, 1, 1.2, 1.3]],
    spotlight: [[-0.35, 0, -0.35, 0.35, 2.2, 0.35]],
    saucer: [[1.43, 0, 2.86, 2.03, 2.6, 3.46], [1.57, 0, -3.38, 2.17, 2.6, -2.78], [-3.9, 0, -0.38, -3.3, 2.6, 0.22], [-4.2, 2.5, -4.2, 4.2, 4.1, 4.2]],
    cactus: [[-0.3, 0, -0.3, 0.3, 2.4, 0.3]],
    film_reel: [[-1.8, 0, -0.8, 1.8, 6, 0.8]],
    omnic: [[-0.6, 0, -0.5, 0.6, 2.4, 0.5]],
    core: [[-2.8, 0, -2.8, 2.8, 0.8, 2.8], [-1.6, 0.8, -1.6, 1.6, 10, 1.6]],
    pipes: null,
    bush: null, sign: null, flower: null, grass: null, papel: null, string: null, flag: null, mech: null, rocket: null,
    antenna: null, poster: null, cloud: null, skyline: null, windmill: null, neon: null, lanterns: null, cable: null, awning: null
  };
  O.PROP_COL = PROP_COL;

  class MapBuilder {
    constructor(opts = {}) {
      this.visual = opts.visual !== false;
      this.solids = [];
      this.vis = { boxes: [], ramps: [], steps: [], roofs: [], decals: [], props: [], lights: [], water: [], cyls: [], quads: [] };
      this.spawns = [];
      this.points = {};
      this.payload = null;
      this.health = [];
      this.hints = [];
      this.kill = -14;
      this.bnd = null;
      this.theme = {};
      this.cams = {};
    }

    solid(x0, y0, z0, x1, y1, z1, o = {}) {
      const s = { x0: Math.min(x0, x1), y0: Math.min(y0, y1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1: Math.max(y0, y1), z1: Math.max(z0, z1) };
      if (o.nobul) s.nobul = true;
      if (o.nomove) s.nomove = true;
      if (o.role) s.role = o.role;
      if (o.gate) s.gate = o.gate;
      if (o.stage) s.stage = o.stage;
      if (o.ramp) { s.ramp = o.ramp; s.lo = o.lo; s.hi = o.hi; }
      this.solids.push(s);
      return s;
    }

    box(x0, y0, z0, x1, y1, z1, mat, o = {}) {
      const s = o.col === false ? null : this.solid(x0, y0, z0, x1, y1, z1, o);
      if (this.visual && o.vis !== false) {
        this.vis.boxes.push({
          x0: Math.min(x0, x1), y0: Math.min(y0, y1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1: Math.max(y0, y1), z1: Math.max(z0, z1),
          mat, top: o.top || mat, bottom: o.bottom || mat, tint: o.tint === undefined ? 0xffffff : o.tint, topTint: o.topTint, bottomTint: o.bottomTint,
          uv: o.uv || 1, emit: o.emit || 0, skip: o.skip || null, band: o.band || null
        });
      }
      return s;
    }

    block(x, z, w, d, h, mat, o = {}) {
      const y0 = o.y || 0;
      return this.box(x - w / 2, y0, z - d / 2, x + w / 2, y0 + h, z + d / 2, mat, o);
    }

    floor(x0, z0, x1, z1, y, mat, o = {}) {
      return this.box(x0, y - (o.t || 1), z0, x1, y, z1, mat, Object.assign({ skip: { bottom: true } }, o));
    }

    slab(x0, z0, x1, z1, y, t, mat, o = {}) {
      return this.box(x0, y - t, z0, x1, y, z1, mat, o);
    }

    rail(x0, z0, x1, z1, y, mat, o = {}) {
      const t = o.t || 0.15;
      const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
      if (alongX) return this.box(x0, y, z0 - t / 2, x1, y + (o.h || 1.05), z0 + t / 2, mat || 'metal', Object.assign({ nobul: true }, o));
      return this.box(x0 - t / 2, y, z0, x0 + t / 2, y + (o.h || 1.05), z1, mat || 'metal', Object.assign({ nobul: true }, o));
    }

    wall(x0, z0, x1, z1, h, t, mat, o = {}) {
      const y0 = o.y || 0, y1 = y0 + h;
      const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
      const a0 = alongX ? Math.min(x0, x1) : Math.min(z0, z1), a1 = alongX ? Math.max(x0, x1) : Math.max(z0, z1);
      const c = alongX ? z0 : x0;
      const holes = (o.holes || []).map(hh => ({ a: a0 + hh[0], b: a0 + hh[1], y0: y0 + (hh[2] || 0), y1: y0 + (hh[3] === undefined ? Math.min(h, 3.2) : hh[3]) }));
      const cuts = [a0, a1];
      for (const hh of holes) { cuts.push(Math.max(a0, Math.min(a1, hh.a)), Math.max(a0, Math.min(a1, hh.b))); }
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
      const s = o.col === false ? null : this.solid(x0, base, z0, x1, Math.max(lo, hi), z1, Object.assign({}, o, { ramp: d, lo, hi }));
      if (this.visual && o.vis !== false) this.vis.ramps.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), base, lo, hi, dir: d, mat, tint: o.tint === undefined ? 0xffffff : o.tint, side: o.side || mat, sideTint: o.sideTint, uv: o.uv || 1 });
      return s;
    }

    stairs(x0, z0, x1, z1, lo, hi, dir, mat, o = {}) {
      const d = DIRS[dir];
      const s = this.solid(x0, o.base === undefined ? Math.min(lo, hi) : o.base, z0, x1, Math.max(lo, hi), z1, Object.assign({}, o, { ramp: d, lo, hi }));
      if (this.visual) this.vis.steps.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), base: o.base === undefined ? Math.min(lo, hi) : o.base, lo, hi, dir: d, mat, tint: o.tint === undefined ? 0xffffff : o.tint, n: o.n || Math.max(2, Math.round(Math.abs(hi - lo) / 0.3)) });
      return s;
    }

    roof(x0, z0, x1, z1, y, h, style, mat, o = {}) {
      if (this.visual) this.vis.roofs.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y, h, style, mat, tint: o.tint === undefined ? 0xffffff : o.tint, over: o.over === undefined ? 0.6 : o.over, trim: o.trim, trimTint: o.trimTint, curl: o.curl || 0 });
      if (o.col) {
        if (style === 'gable-x') {
          const zm = (z0 + z1) / 2;
          this.ramp(x0, z0, x1, zm, y, y + h, 'z+', mat, { vis: false, base: y });
          this.ramp(x0, zm, x1, z1, y, y + h, 'z-', mat, { vis: false, base: y });
        } else if (style === 'gable-z') {
          const xm = (x0 + x1) / 2;
          this.ramp(x0, z0, xm, z1, y, y + h, 'x+', mat, { vis: false, base: y });
          this.ramp(xm, z0, x1, z1, y, y + h, 'x-', mat, { vis: false, base: y });
        } else this.box(x0, y, z0, x1, y + h * 0.5, z1, mat, { vis: false });
      }
    }

    house(x0, z0, x1, z1, h, mat, o = {}) {
      const s = this.box(x0, o.y || 0, z0, x1, (o.y || 0) + h, z1, mat, o);
      if (o.roof) this.roof(x0, z0, x1, z1, (o.y || 0) + h, o.roofH || 2, o.roof, o.roofMat || 'roof', { tint: o.roofTint, over: o.over, curl: o.curl, trim: o.trim, trimTint: o.trimTint, col: o.roofCol });
      if (o.win) this.windows(x0, z0, x1, z1, (o.y || 0), h, o.win);
      return s;
    }

    windows(x0, z0, x1, z1, y0, h, w) {
      if (!this.visual) return;
      const tex = w.tex || 'window', ww = w.w || 1.2, wh = w.h || 1.6, sp = w.sp || 3.2, fl = w.fl || 3.4, sill = w.sill || 1.2;
      const sides = w.sides || 'nsew';
      const floors = Math.max(1, Math.floor((h - 0.6) / fl));
      const put = (face, a0, a1, fixed) => {
        const len = a1 - a0, n = Math.floor((len - 1) / sp);
        if (n < 1) return;
        const start = a0 + (len - (n - 1) * sp) / 2;
        for (let f = 0; f < floors; f++) {
          if (w.skipGround && f === 0) continue;
          const yy = y0 + f * fl + sill + wh / 2;
          if (yy + wh / 2 > y0 + h - 0.2) continue;
          for (let i = 0; i < n; i++) {
            const a = start + i * sp;
            const lit = w.lit ? (O.hash(face + a + ',' + yy + ',' + fixed) % 100) < w.lit : false;
            if (face === 'n') this.decal(a, yy, z1, 'n', ww, wh, tex, { emit: lit ? 1 : 0, tint: w.tint });
            else if (face === 's') this.decal(a, yy, z0, 's', ww, wh, tex, { emit: lit ? 1 : 0, tint: w.tint });
            else if (face === 'e') this.decal(x1, yy, a, 'e', ww, wh, tex, { emit: lit ? 1 : 0, tint: w.tint });
            else this.decal(x0, yy, a, 'w', ww, wh, tex, { emit: lit ? 1 : 0, tint: w.tint });
          }
        }
      };
      if (sides.includes('n')) put('n', x0, x1, z1);
      if (sides.includes('s')) put('s', x0, x1, z0);
      if (sides.includes('e')) put('e', z0, z1, x1);
      if (sides.includes('w')) put('w', z0, z1, x0);
    }

    decal(x, y, z, face, w, h, tex, o = {}) {
      if (!this.visual) return;
      this.vis.decals.push({ x, y, z, face, w, h, tex, tint: o.tint === undefined ? 0xffffff : o.tint, emit: o.emit || 0, off: o.off || 0.03, text: o.text, fg: o.fg, bg: o.bg, font: o.font });
    }

    sign(x, y, z, face, w, h, text, o = {}) {
      this.decal(x, y, z, face, w, h, 'sign', Object.assign({ text }, o));
    }

    cyl(x, z, y0, y1, r, mat, o = {}) {
      if (this.visual && o.vis !== false) this.vis.cyls.push({ x, z, y0, y1, r, r2: o.r2 === undefined ? r : o.r2, mat, tint: o.tint === undefined ? 0xffffff : o.tint, seg: o.seg || 8, cap: o.cap !== false });
      if (o.col !== false) this.solid(x - r * 0.85, y0, z - r * 0.85, x + r * 0.85, y1, z + r * 0.85, o);
    }

    quad(pts, mat, o = {}) {
      if (this.visual) this.vis.quads.push({ p: pts, mat, tint: o.tint === undefined ? 0xffffff : o.tint, emit: o.emit || 0, two: !!o.two, uv: o.uv || 1 });
    }

    prop(type, x, z, o = {}) {
      const p = { type, x, z, y: o.y, yaw: o.yaw || 0, s: o.s || 1, o };
      this.vis.props.push(p);
      return p;
    }

    light(x, y, z, color, radius, o = {}) {
      if (this.visual) this.vis.lights.push({ x, y, z, c: O.rgb(color), r: radius, k: o.k || 1 });
    }

    water(x0, z0, x1, z1, y, tint) {
      if (this.visual) this.vis.water.push({ x0, z0, x1, z1, y, tint: tint === undefined ? 0x3070a0 : tint });
    }

    spawnRoom(o) {
      const { x, z, w, d, h = 5, mat = 'metal', tint = 0xd8dde8 } = o;
      const exits = o.exits || [];
      const owners = o.owners || [{ role: o.role, stage: o.stage || [0, 9] }];
      const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y = o.y || 0;
      const sideDef = { n: [x0, z1, x1, z1], s: [x0, z0, x1, z0], e: [x1, z0, x1, z1], w: [x0, z0, x0, z1] };
      if (!o.noFloor) this.floor(x0, z0, x1, z1, y, o.floorMat || 'tiles', { tint: o.floorTint || 0xc8ccd4 });
      for (const side of 'nsew') {
        if (o.open && o.open.includes(side)) continue;
        const sd = sideDef[side];
        const ex = exits.filter(e => e.side === side);
        this.wall(sd[0], sd[1], sd[2], sd[3], h, 0.5, mat, { y, tint, holes: ex.map(e => [e.a, e.b, 0, e.h || 3.4]) });
      }
      for (const e of exits) {
        const alongX = e.side === 'n' || e.side === 's';
        const a = (alongX ? x0 : z0) + e.a, b = (alongX ? x0 : z0) + e.b;
        const c = e.side === 'n' ? z1 : e.side === 's' ? z0 : e.side === 'e' ? x1 : x0;
        const dy = e.h || 3.4;
        const g = alongX ? [a, y, c - 0.3, b, y + dy, c + 0.3] : [c - 0.3, y, a, c + 0.3, y + dy, b];
        for (const ow of owners) {
          this.solid(g[0], g[1], g[2], g[3], g[4], g[5], { role: ow.role === 'att' ? 'def' : 'att', nobul: true, stage: ow.stage, gate: 'spawn' });
          if (ow.role === 'att') this.solid(g[0], g[1], g[2], g[3], g[4], g[5], { role: 'att', nobul: true, gate: 'setup', stage: ow.stage });
        }
        if (this.visual) this.vis.decals.push({ x: (g[0] + g[3]) / 2, y: y + dy / 2, z: (g[2] + g[5]) / 2, face: alongX ? (e.side === 'n' ? 'n' : 's') : (e.side === 'e' ? 'e' : 'w'), w: b - a, h: dy, tex: 'spawnfield', tint: 0xffffff, emit: 1, off: 0.02 });
      }
      if (!o.noRoof) this.box(x0 - 0.3, y + h, z0 - 0.3, x1 + 0.3, y + h + 0.6, z1 + 0.3, mat, { tint });
      if (this.visual) this.light(x, y + h - 0.8, z, 0xd0e8ff, Math.max(w, d) * 0.9, { k: 0.8 });
      const pts = (o.pts || []).slice();
      if (!pts.length) for (let i = 0; i < 6; i++) pts.push([x0 + 2 + ((i % 3) + 0.5) * (w - 4) / 3, z0 + 2 + (Math.floor(i / 3) + 0.5) * (d - 4) / 2]);
      for (const ow of owners) {
        this.spawns.push({ role: ow.role, stage: ow.stage, room: [x0, z0, x1, z1], y, pts: pts.map(p => ({ x: p[0], z: p[1], yaw: p[2] === undefined ? (o.yaw || 0) : p[2] })) });
      }
    }

    point(id, x, z, r, o = {}) {
      this.points[id] = { id, x, z, y: o.y, r: r || 5, h: o.h || 3.5 };
    }

    path(pts, cps, o = {}) {
      this.payload = { pts: pts.map(p => ({ x: p[0], z: p[1], y: p[2] })), cps: cps || [], start: o.start || 0 };
    }

    healthPack(x, z, big, y) { this.health.push({ x, z, y, big: !!big }); }

    hint(kind, stage, x, z, o = {}) { this.hints.push({ kind, stage, x, z, y: o.y, yaw: o.yaw, tag: o.tag }); }

    bounds(x0, z0, x1, z1) { this.bnd = { x0, z0, x1, z1 }; }
    killY(y) { this.kill = y; }
    cam(name, x, y, z, tx, ty, tz) { this.cams[name] = { x, y, z, tx, ty, tz }; }

    finish() {
      const b = this.bnd || { x0: -80, z0: -80, x1: 80, z1: 80 };
      let world = new World(this.solids, b);
      for (const p of this.vis.props) {
        if (p.y === undefined) p.y = world.spawnY(p.x, p.z, p.o.from === undefined ? 60 : p.o.from);
        const col = PROP_COL[p.type];
        if (!col || p.o.col === false) continue;
        const rot = Math.round(p.yaw / (Math.PI / 2)) & 3;
        for (const c of col) {
          const [ax0, ay0, az0, ax1, ay1, az1] = c.map(v => v * p.s);
          let rx0 = ax0, rx1 = ax1, rz0 = az0, rz1 = az1;
          if (rot === 1) { rx0 = az0; rx1 = az1; rz0 = -ax1; rz1 = -ax0; }
          else if (rot === 2) { rx0 = -ax1; rx1 = -ax0; rz0 = -az1; rz1 = -az0; }
          else if (rot === 3) { rx0 = -az1; rx1 = -az0; rz0 = ax0; rz1 = ax1; }
          this.solid(p.x + rx0, p.y + ay0, p.z + rz0, p.x + rx1, p.y + ay1, p.z + rz1, { nobul: p.o.nobul });
        }
      }
      world = new World(this.solids, b);
      for (const k in this.points) { const pt = this.points[k]; if (pt.y === undefined) pt.y = world.spawnY(pt.x, pt.z, 3); }
      for (const hp of this.health) if (hp.y === undefined) hp.y = world.spawnY(hp.x, hp.z, 3);
      for (const h of this.hints) if (h.y === undefined) h.y = world.spawnY(h.x, h.z, 3);
      if (this.payload) {
        for (const p of this.payload.pts) if (p.y === undefined) p.y = world.spawnY(p.x, p.z, 3);
        let acc = 0;
        this.payload.pts[0].s = 0;
        for (let i = 1; i < this.payload.pts.length; i++) {
          const a = this.payload.pts[i - 1], c = this.payload.pts[i];
          acc += Math.hypot(c.x - a.x, c.z - a.z);
          c.s = acc;
        }
        this.payload.len = acc;
        this.payload.cpDist = this.payload.cps.map(i => this.payload.pts[i].s);
      }
      for (const sp of this.spawns) for (const p of sp.pts) p.y = world.spawnY(p.x, p.z, sp.y + 2);
      return { world, solids: this.solids, vis: this.vis, spawns: this.spawns, points: this.points, payload: this.payload, health: this.health, hints: this.hints, bounds: b, killY: this.kill, theme: this.theme, cams: this.cams };
    }
  }
  O.MapBuilder = MapBuilder;

  O.MAPS = O.MAPS || {};
  O.buildMap = function (id, stage, opts = {}) {
    const def = O.MAPS[id];
    if (!def) throw new Error('no map ' + id);
    const B = new MapBuilder(opts);
    const st = def.stages ? def.stages[stage || 0] : def;
    B.theme = Object.assign({}, def.theme || {}, st.theme || {});
    st.build(B, O);
    const m = B.finish();
    m.id = id;
    m.stage = stage || 0;
    m.def = def;
    m.mode = def.mode;
    m.name = st.name || def.name;
    return m;
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
