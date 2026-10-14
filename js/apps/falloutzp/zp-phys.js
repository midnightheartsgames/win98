(function (Z) {
  'use strict';

  const CELL = 8;

  class CollisionWorld {
    constructor(terrain) {
      this.terrain = terrain || null;
      this.hash = new Z.SpatialHash(CELL);
      this.solids = [];
      this.floors = [];
      this.fhash = new Z.SpatialHash(CELL);
      this.stamp = 0;
    }

    insert(s) {
      s.id = this.solids.length;
      this.solids.push(s);
      this.hash.insert(s, s.box[0], s.box[1], s.box[2], s.box[3]);
      return s;
    }

    addPoly(poly, y0, y1, tag) {
      const box = Z.polyBox(poly);
      return this.insert({ k: 'poly', poly, y0, y1, tag, box });
    }

    addBox(cx, cz, sx, sz, yaw, y0, y1, tag) {
      const c = Math.cos(yaw), s = Math.sin(yaw), hx = sx / 2, hz = sz / 2;
      const poly = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([x, z]) => [cx + x * c - z * s, cz + x * s + z * c]);
      if (Z.polyArea(poly) < 0) poly.reverse();
      return this.addPoly(poly, y0, y1, tag);
    }

    addCyl(x, z, r, y0, y1, tag) {
      return this.insert({ k: 'cyl', x, z, r, y0, y1, tag, box: [x - r, z - r, x + r, z + r] });
    }

    addFloor(poly, y, tag, slope) {
      const box = Z.polyBox(poly);
      const f = { poly, y, tag, box, slope: slope || null };
      f.id = this.floors.length;
      this.floors.push(f);
      this.fhash.insert(f, box[0], box[1], box[2], box[3]);
      return f;
    }

    floorY(f, x, z) {
      if (!f.slope) return f.y;
      const s = f.slope;
      return f.y + (x - s.x) * s.gx + (z - s.z) * s.gz;
    }

    terrainH(x, z) { return this.terrain ? this.terrain.groundH(x, z) : -1000; }

    groundAt(x, z, yRef, step = 0.55) {
      let g = this.terrainH(x, z);
      for (const f of this.fhash.at(x, z)) {
        if (f.disabled) continue;
        if (x < f.box[0] || x > f.box[2] || z < f.box[1] || z > f.box[3]) continue;
        if (!Z.pointInPoly(x, z, f.poly)) continue;
        const fy = this.floorY(f, x, z);
        if (fy <= yRef + step && fy > g) g = fy;
      }
      for (const s of this.hash.at(x, z)) {
        if (!s.walk || s.disabled) continue;
        if (s.y1 > yRef + step || s.y1 <= g) continue;
        if (this.inside(s, x, z, 0)) g = s.y1;
      }
      return g;
    }

    inside(s, x, z, r) {
      if (s.k === 'cyl') return Math.hypot(x - s.x, z - s.z) < s.r + r;
      if (x < s.box[0] - r || x > s.box[2] + r || z < s.box[1] - r || z > s.box[3] + r) return false;
      return Z.pointInPoly(x, z, s.poly);
    }

    resolve(pos, r, yFeet, h) {
      let hit = false;
      for (let iter = 0; iter < 3; iter++) {
        let moved = false;
        const cand = this.hash.query(pos.x - r - 1, pos.z - r - 1, pos.x + r + 1, pos.z + r + 1);
        for (const s of cand) {
          if (s.disabled || s.ghost) continue;
          if (yFeet >= s.y1 - (s.walk ? 0.5 : 0.02) || yFeet + h <= s.y0) continue;
          if (s.k === 'cyl') {
            const dx = pos.x - s.x, dz = pos.z - s.z, d = Math.hypot(dx, dz), m = s.r + r;
            if (d < m) {
              const nx = d > 1e-6 ? dx / d : 1, nz = d > 1e-6 ? dz / d : 0;
              pos.x = s.x + nx * m; pos.z = s.z + nz * m;
              moved = hit = true;
            }
            continue;
          }
          if (pos.x < s.box[0] - r || pos.x > s.box[2] + r || pos.z < s.box[1] - r || pos.z > s.box[3] + r) continue;
          const P = s.poly;
          const ins = Z.pointInPoly(pos.x, pos.z, P);
          let best = null;
          for (let i = 0; i < P.length; i++) {
            const a = P[i], b = P[(i + 1) % P.length];
            const q = Z.segDist(pos.x, pos.z, a[0], a[1], b[0], b[1]);
            if (!best || q.d < best.d) best = { d: q.d, x: q.x, z: q.z, a, b };
          }
          if (!best) continue;
          if (ins) {
            const ex = best.b[0] - best.a[0], ez = best.b[1] - best.a[1], L = Math.hypot(ex, ez) || 1;
            const nx = ez / L, nz = -ex / L;
            pos.x = best.x + nx * (r + 0.01); pos.z = best.z + nz * (r + 0.01);
            moved = hit = true;
          } else if (best.d < r) {
            let nx = pos.x - best.x, nz = pos.z - best.z;
            const L = Math.hypot(nx, nz) || 1;
            nx /= L; nz /= L;
            pos.x = best.x + nx * r; pos.z = best.z + nz * r;
            moved = hit = true;
          }
        }
        if (!moved) break;
      }
      return hit;
    }

    raySolids(ox, oy, oz, dx, dy, dz, maxT, skip) {
      let best = null;
      const steps = Math.ceil(maxT / CELL) + 1;
      const seen = new Set();
      for (let i = 0; i <= steps; i++) {
        const t = Math.min(maxT, i * CELL);
        const x = ox + dx * t, z = oz + dz * t;
        for (const s of this.hash.query(x - CELL, z - CELL, x + CELL, z + CELL)) {
          if (seen.has(s) || s.disabled || s.noRay || (skip && skip(s))) continue;
          seen.add(s);
          const h = this.rayPrism(s, ox, oy, oz, dx, dy, dz, best ? best.t : maxT);
          if (h && (!best || h.t < best.t)) best = h;
        }
        if (best && best.t < t - CELL) break;
      }
      return best;
    }

    rayPrism(s, ox, oy, oz, dx, dy, dz, maxT) {
      let best = Infinity, bn = null;
      if (s.k === 'cyl') {
        const fx = ox - s.x, fz = oz - s.z;
        const A = dx * dx + dz * dz, B = 2 * (fx * dx + fz * dz), C = fx * fx + fz * fz - s.r * s.r;
        if (C <= 0 && oy >= s.y0 && oy <= s.y1) return { t: 0, n: [0, 1, 0], s, x: ox, y: oy, z: oz };
        if (A > 1e-12) {
          const D = B * B - 4 * A * C;
          if (D >= 0) {
            const t0 = (-B - Math.sqrt(D)) / (2 * A);
            const y = oy + dy * t0;
            if (t0 >= 0 && t0 < maxT && y >= s.y0 && y <= s.y1) { best = t0; const px = fx + dx * t0, pz = fz + dz * t0, L = Math.hypot(px, pz) || 1; bn = [px / L, 0, pz / L]; }
          }
        }
        if (Math.abs(dy) > 1e-9) {
          const yy = dy < 0 ? s.y1 : s.y0, t = (yy - oy) / dy;
          if (t >= 0 && t < best && t < maxT && Math.hypot(fx + dx * t, fz + dz * t) <= s.r) { best = t; bn = [0, dy < 0 ? 1 : -1, 0]; }
        }
      } else {
        const P = s.poly;
        if (Math.abs(dy) > 1e-9) {
          const yy = dy < 0 ? s.y1 : s.y0, t = (yy - oy) / dy;
          if (t >= 0 && t < maxT && Z.pointInPoly(ox + dx * t, oz + dz * t, P)) { best = t; bn = [0, dy < 0 ? 1 : -1, 0]; }
        }
        for (let i = 0; i < P.length; i++) {
          const a = P[i], b = P[(i + 1) % P.length];
          const ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez) || 1;
          const nx = ez / L, nz = -ex / L;
          if (nx * dx + nz * dz >= 0) continue;
          const den = dx * ez - dz * ex;
          if (Math.abs(den) < 1e-12) continue;
          const wx = a[0] - ox, wz = a[1] - oz;
          const t = (wx * ez - wz * ex) / den, u = (wx * dz - wz * dx) / den;
          if (t < 0 || t >= best || t >= maxT || u < 0 || u > 1) continue;
          const y = oy + dy * t;
          if (y < s.y0 || y > s.y1) continue;
          best = t; bn = [nx, 0, nz];
        }
        if (!bn && oy >= s.y0 && oy <= s.y1 && Z.pointInPoly(ox, oz, P)) return { t: 0, n: [0, 1, 0], s, x: ox, y: oy, z: oz };
      }
      if (!bn) return null;
      return { t: best, n: bn, s, x: ox + dx * best, y: oy + dy * best, z: oz + dz * best };
    }

    rayTerrain(ox, oy, oz, dx, dy, dz, maxT) {
      if (!this.terrain) return null;
      let prevT = 0;
      if (oy - this.terrainH(ox, oz) < 0) return { t: 0, x: ox, y: oy, z: oz, n: [0, 1, 0], terrain: true };
      const step = 0.8;
      for (let t = step; t <= maxT + step; t += step) {
        const tt = Math.min(t, maxT);
        const x = ox + dx * tt, y = oy + dy * tt, z = oz + dz * tt;
        const d = y - this.terrainH(x, z);
        if (d < 0) {
          let a = prevT, b = tt;
          for (let k = 0; k < 6; k++) {
            const m = (a + b) / 2, mx = ox + dx * m, my = oy + dy * m, mz = oz + dz * m;
            if (my - this.terrainH(mx, mz) < 0) b = m; else a = m;
          }
          const hx = ox + dx * b, hz = oz + dz * b;
          return { t: b, x: hx, y: oy + dy * b, z: hz, n: this.terrain.normal(hx, hz), terrain: true };
        }
        prevT = tt;
        if (tt >= maxT) break;
      }
      return null;
    }

    rayFloors(ox, oy, oz, dx, dy, dz, maxT) {
      if (Math.abs(dy) < 1e-6) return null;
      let best = null;
      const steps = Math.ceil(maxT / CELL) + 1;
      const seen = new Set();
      for (let i = 0; i <= steps; i++) {
        const t = Math.min(maxT, i * CELL), x = ox + dx * t, z = oz + dz * t;
        for (const f of this.fhash.query(x - CELL, z - CELL, x + CELL, z + CELL)) {
          if (seen.has(f) || f.disabled) continue;
          seen.add(f);
          const fy = f.slope ? this.floorY(f, x, z) : f.y;
          const tt = (fy - oy) / dy;
          if (tt < 0 || tt > maxT || (best && tt >= best.t)) continue;
          const hx = ox + dx * tt, hz = oz + dz * tt;
          if (Z.pointInPoly(hx, hz, f.poly)) best = { t: tt, x: hx, y: fy, z: hz, n: [0, dy < 0 ? 1 : -1, 0], floor: f };
        }
      }
      return best;
    }

    raycast(ox, oy, oz, dx, dy, dz, maxT, opts = {}) {
      let best = this.raySolids(ox, oy, oz, dx, dy, dz, maxT, opts.skip);
      const lim = best ? best.t : maxT;
      if (!opts.noTerrain) { const t = this.rayTerrain(ox, oy, oz, dx, dy, dz, lim); if (t && (!best || t.t < best.t)) best = t; }
      const f = this.rayFloors(ox, oy, oz, dx, dy, dz, best ? best.t : maxT);
      if (f && (!best || f.t < best.t)) best = f;
      return best;
    }

    los(ax, ay, az, bx, by, bz) {
      const dx = bx - ax, dy = by - ay, dz = bz - az, L = Math.hypot(dx, dy, dz);
      if (L < 0.01) return true;
      const h = this.raycast(ax, ay, az, dx / L, dy / L, dz / L, L - 0.3, { coarse: true });
      return !h;
    }
  }

  Z.CollisionWorld = CollisionWorld;

  Z.moveActor = (cw, a, dt, opts = {}) => {
    const r = a.radius || 0.35, h = a.height || 1.8;
    const steps = Math.max(1, Math.ceil(Math.hypot(a.vx, a.vz) * dt / (r * 0.8)));
    const sdt = dt / steps;
    const water = opts.water;
    for (let s = 0; s < steps; s++) {
      const nx = a.x + a.vx * sdt, nz = a.z + a.vz * sdt;
      const ng = cw.groundAt(nx, nz, a.y);
      const climb = ng - a.y;
      const slopeBlock = (() => {
        if (!cw.terrain || climb <= 0.05) return false;
        const tg = cw.terrainH(nx, nz);
        if (Math.abs(tg - ng) > 0.05) return false;
        const n = cw.terrain.normal(nx, nz);
        return n[1] < 0.66;
      })();
      if (climb > (a.onGround ? 0.55 : 0.3) || slopeBlock) {
        const p2 = { x: nx, z: a.z };
        if (cw.groundAt(p2.x, p2.z, a.y) - a.y <= 0.55) { a.x = p2.x; }
        else { const p3 = { x: a.x, z: nz }; if (cw.groundAt(p3.x, p3.z, a.y) - a.y <= 0.55) a.z = p3.z; }
        a.blocked = true;
      } else {
        a.x = nx; a.z = nz;
      }
      const pos = { x: a.x, z: a.z };
      if (cw.resolve(pos, r, a.y, h)) a.blocked = true;
      a.x = pos.x; a.z = pos.z;
    }
    a.ground = cw.groundAt(a.x, a.z, a.y);
    const swimY = water ? water(a) : null;
    if (swimY !== null && swimY !== undefined && a.y < swimY) {
      a.swim = true;
      a.vy = Z.approach(a.vy, 0, 6 * dt);
      a.y = Math.max(a.y + a.vy * dt, a.ground);
      if (a.y < swimY) a.y = Z.approach(a.y, swimY, 2.5 * dt);
      a.onGround = a.y <= a.ground + 0.02;
      return;
    }
    a.swim = false;
    if (a.onGround && a.vy <= 0 && a.y - a.ground < 0.6 && a.y - a.ground > -0.6) {
      a.y = a.ground;
      a.vy = 0;
    } else {
      a.vy -= Z.G * dt;
      a.y += a.vy * dt;
      if (a.y <= a.ground) {
        a.landSpeed = -a.vy;
        a.y = a.ground;
        a.vy = 0;
        a.onGround = true;
        return;
      }
    }
    a.onGround = a.y <= a.ground + 0.02;
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
