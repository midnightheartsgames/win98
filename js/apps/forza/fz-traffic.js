(function (F) {
  'use strict';

  const MODELS = [
    ['vaz2105', 22], ['vaz2108', 10], ['moskvich2141', 8], ['gaz24', 7], ['zaz968', 5], ['niva', 4], ['uaz469', 3], ['raf2203', 4],
    ['audi80', 8], ['mazda626', 5], ['golf2', 8], ['e30', 5], ['w124', 6], ['merc190', 4], ['g500', 1], ['m5e39', 1], ['celica', 1], ['silvia', 1]
  ];
  const COLORS = ['#e8e6dc', '#c9c9c4', '#8a8d90', '#3b3d40', '#141416', '#b7282e', '#7a2a2a', '#c8b98a', '#2f5a3a', '#1a2f6e', '#6f9fc8', '#8a6a3a', '#5a6b3c', '#a0a8b0', '#2a4a8a', '#d8c060'];
  const TOTAL = MODELS.reduce((a, m) => a + m[1], 0);
  const RANK = { hwy: 4, ave: 3, str: 2, lane: 1, old: 1 };
  const LUT = 16;
  const SAMPLES = 16;
  const CLEAR = 3;
  const REGION = 160;
  const TRIES = 3;
  const drivable = e => e.k.traffic > 0 && e.k.lanes > 0;
  const headingOf = p => Math.atan2(p.tx, -p.tz);

  class Traffic {
    constructor(world, o = {}) {
      this.w = world;
      this.cars = [];
      this.max = o.max || 24;
      this.rng = F.rng(o.seed || 99);
      this.edges = world.edges.filter(drivable);
      this.uid = 0;
      this.density = 1;
      this.frames = new Map();
    }

    clear() { this.cars.length = 0; }

    pickModel() {
      let r = this.rng() * TOTAL;
      for (const [id, wgt] of MODELS) { r -= wgt; if (r <= 0) return id; }
      return 'vaz2105';
    }

    around(px, pz, far) {
      const cx = Math.floor(px / REGION), cz = Math.floor(pz / REGION), key = cx + ':' + cz + ':' + far;
      if (this.aroundKey !== key) {
        const mx = (cx + 0.5) * REGION, mz = (cz + 0.5) * REGION, reach = far + REGION;
        this.aroundKey = key;
        this.aroundList = this.edges.filter(e => Math.abs((e.x0 + e.x1) / 2 - mx) <= reach + e.len && Math.abs((e.z0 + e.z1) / 2 - mz) <= reach + e.len);
      }
      return this.aroundList;
    }

    spawn(px, pz, near = 200, far = 480) {
      const rng = this.rng, list = this.around(px, pz, far);
      for (let tries = 0; tries < TRIES && list.length; tries++) {
        const e = list[Math.floor(rng() * list.length)];
        if (Math.abs((e.x0 + e.x1) / 2 - px) > far + e.len || Math.abs((e.z0 + e.z1) / 2 - pz) > far + e.len) continue;
        if (rng() > e.k.traffic * this.density) continue;
        const t = rng() * e.len;
        const p = this.w.edgePoint(e, t);
        const d = Math.hypot(p.x - px, p.z - pz);
        if (d < near || d > far) continue;
        const dir = rng() < 0.5 ? 1 : -1;
        const along = dir > 0 ? t : e.len - t;
        const id = this.pickModel();
        const spec = F.Cars.spec(id, {});
        const car = {
          uid: ++this.uid, id, e, dir, lane: Math.floor(rng() * this.perDir(e)), t: 0, u: 0, seg: 'edge', plan: null,
          v: e.k.speed * 0.7, pace: rng.range(0.82, 1.12), aMax: rng.range(1.7, 2.6), bTrig: rng.range(1.3, 2.1), bMax: 7, aLat: rng.range(1.8, 2.8), hold: rng.range(0.4, 1.1),
          paint1: F.hexRgb(rng.pick(COLORS)), mass: spec.mass, hl: spec.len / 2, hw: spec.wid / 2, L: spec.L, track: spec.track,
          state: 'drive', x: p.x, z: p.z, y: p.y, yaw: 0, pitch: 0, roll: 0, steer: 0, tx: 0, tz: -1, rx: 0, rz: 0,
          vx: 0, vz: 0, r: 0, hitT: 0, wheel: 0, brake: 0, missed: false, next: null, holding: false, lead: null, stuck: 0, ghost: 0,
          bp: 0, bpV: 0, br: 0, brV: 0, aLong: 0
        };
        car.off = this.laneOff(e, car.lane);
        this.plan(car);
        car.t = Math.min(along, e.len - car.plan.inT - 25);
        if (car.t < 25) continue;
        const f = this.front(car);
        if (this.cars.some(c => (c.e === e && c.dir === dir && Math.abs(c.t - car.t) < 25) || Math.hypot(c.x - f.x, c.z - f.z) < 25)) continue;
        car.rx = f.x - f.tx * car.L;
        car.rz = f.z - f.tz * car.L;
        this.follow(car, 0);
        this.pose(car, 0);
        this.cars.push(car);
        return car;
      }
      return null;
    }

    perDir(e) { return Math.max(1, e.k.lanes / 2); }

    laneOff(e, lane) {
      const lanes = Math.max(2, e.k.lanes);
      return (lane + 0.5) * (e.w / lanes) * 0.95;
    }

    frame(e) {
      let f = this.frames.get(e);
      if (f) return f;
      const P = e.pts, n = P.length;
      const nx = new Float32Array(n), nz = new Float32Array(n), k = new Float32Array(n);
      const unit = (a, b) => {
        const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
        return l > 1e-6 ? [dx / l, dz / l, l] : null;
      };
      for (let i = 0; i < n; i++) {
        const d0 = i > 0 ? unit(P[i - 1], P[i]) : null, d1 = i < n - 1 ? unit(P[i], P[i + 1]) : null;
        const u0 = d0 || d1, u1 = d1 || d0;
        let rx = -(u0[1] + u1[1]), rz = u0[0] + u1[0];
        const rl = Math.hypot(rx, rz) || 1;
        rx /= rl; rz /= rl;
        const cos = Math.max(0.6, rx * -u0[1] + rz * u0[0]);
        nx[i] = rx / cos; nz[i] = rz / cos;
        if (d0 && d1) k[i] = Math.abs(Math.atan2(u0[0] * u1[1] - u0[1] * u1[0], u0[0] * u1[0] + u0[1] * u1[1])) / Math.max(1, (d0[2] + d1[2]) / 2);
      }
      f = { nx, nz, k };
      this.frames.set(e, f);
      return f;
    }

    segAt(e, s) {
      let lo = 0, hi = e.pts.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (e.s[mid] <= s) lo = mid; else hi = mid;
      }
      return lo;
    }

    at(e, dir, t, off) {
      const s = F.clamp(dir > 0 ? t : e.len - t, 0, e.len);
      const i = this.segAt(e, s), j = Math.min(i + 1, e.pts.length - 1);
      const L = e.s[j] - e.s[i], u = L > 0 ? (s - e.s[i]) / L : 0;
      const a = e.pts[i], b = e.pts[j], f = this.frame(e), o = off * dir;
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
      return {
        x: a[0] + dx * u + (f.nx[i] + (f.nx[j] - f.nx[i]) * u) * o,
        z: a[1] + dz * u + (f.nz[i] + (f.nz[j] - f.nz[i]) * u) * o,
        tx: dx / l * dir, tz: dz / l * dir
      };
    }

    curve(p0, p3, uturn) {
      const chord = Math.hypot(p3.x - p0.x, p3.z - p0.z);
      const cr = p0.tx * p3.tz - p0.tz * p3.tx, dt = p0.tx * p3.tx + p0.tz * p3.tz;
      const th = Math.abs(Math.atan2(cr, dt));
      let h0 = 0, h3 = 0;
      if (!uturn && th > 0.05 && th < 2.8) {
        const rx = p3.x - p0.x, rz = p3.z - p0.z;
        const a = (rx * p3.tz - rz * p3.tx) / cr, b = (rx * p0.tz - rz * p0.tx) / cr;
        const k = (4 / 3) * Math.tan(th / 4) / Math.tan(th / 2);
        if (a > 0 && b > 0 && a < chord * 1.5 && b < chord * 1.5) { h0 = a * k; h3 = b * k; }
      }
      if (!h0) {
        const ratio = th < 0.05 ? 0.5 : Math.tan(th / 4) / Math.sin(th / 2);
        h0 = h3 = Math.max(chord * (2 / 3) * ratio, uturn ? 6 : 0.5);
      }
      const P = [p0.x, p0.z, p0.x + p0.tx * h0, p0.z + p0.tz * h0, p3.x - p3.tx * h3, p3.z - p3.tz * h3, p3.x, p3.z];
      const cv = { P, lut: new Float32Array(LUT + 1), len: 0, kmax: 0, pts: [], end: p3 };
      let px = P[0], pz = P[1];
      for (let i = 1; i <= LUT; i++) {
        const q = this.bezAt(cv, i / LUT);
        cv.lut[i] = cv.lut[i - 1] + Math.hypot(q.x - px, q.z - pz);
        px = q.x; pz = q.z;
        const k = Math.abs(q.dx * q.ddz - q.dz * q.ddx) / Math.pow(Math.max(1e-3, q.dx * q.dx + q.dz * q.dz), 1.5);
        if (k > cv.kmax) cv.kmax = k;
      }
      cv.len = cv.lut[LUT];
      for (let i = 0; i <= SAMPLES; i++) {
        const q = this.bezAt(cv, i / SAMPLES);
        cv.pts.push(q.x, q.z);
      }
      return cv;
    }

    bezAt(cv, u) {
      const P = cv.P, m = 1 - u;
      const b0 = m * m * m, b1 = 3 * m * m * u, b2 = 3 * m * u * u, b3 = u * u * u;
      const d0 = 3 * m * m, d1 = 6 * m * u, d2 = 3 * u * u;
      const e0 = 6 * m, e1 = 6 * u;
      return {
        x: b0 * P[0] + b1 * P[2] + b2 * P[4] + b3 * P[6],
        z: b0 * P[1] + b1 * P[3] + b2 * P[5] + b3 * P[7],
        dx: d0 * (P[2] - P[0]) + d1 * (P[4] - P[2]) + d2 * (P[6] - P[4]),
        dz: d0 * (P[3] - P[1]) + d1 * (P[5] - P[3]) + d2 * (P[7] - P[5]),
        ddx: e0 * (P[4] - 2 * P[2] + P[0]) + e1 * (P[6] - 2 * P[4] + P[2]),
        ddz: e0 * (P[5] - 2 * P[3] + P[1]) + e1 * (P[7] - 2 * P[5] + P[3])
      };
    }

    bez(cv, s) {
      const lut = cv.lut;
      if (s >= cv.len) {
        const d = s - cv.len, p = cv.end;
        return { x: p.x + p.tx * d, z: p.z + p.tz * d, tx: p.tx, tz: p.tz };
      }
      let i = 0;
      while (i < LUT - 1 && lut[i + 1] < s) i++;
      const seg = lut[i + 1] - lut[i];
      const q = this.bezAt(cv, (i + (seg > 0 ? (s - lut[i]) / seg : 0)) / LUT);
      const l = Math.hypot(q.dx, q.dz) || 1;
      return { x: q.x, z: q.z, tx: q.dx / l, tz: q.dz / l };
    }

    pick(e, dir, node) {
      const nd = this.w.nodes[node];
      const hin = headingOf(this.at(e, dir, e.len - 0.5, 0));
      const opts = [];
      let sum = 0;
      for (const id of nd.edges) {
        const n = this.w.edges[id];
        if (n === e || !drivable(n)) continue;
        const d = n.a === node ? 1 : -1;
        const th = F.wrap(headingOf(this.at(n, d, 0.5, 0)) - hin);
        if (Math.abs(th) > 2.5) continue;
        const wgt = n.k.traffic * (Math.abs(th) < 0.6 ? 1.6 : 1);
        opts.push({ e: n, dir: d, wgt });
        sum += wgt;
      }
      if (!opts.length) return { e, dir: -dir };
      let r = this.rng() * sum;
      for (const o of opts) { r -= o.wgt; if (r <= 0) return o; }
      return opts[opts.length - 1];
    }

    makePlan(c, e, dir, t, lane) {
      const node = dir > 0 ? e.b : e.a, nd = this.w.nodes[node];
      const nx = this.pick(e, dir, node);
      const uturn = nx.e === e;
      const endIn = dir > 0 ? 1 : 0, endOut = nx.dir > 0 ? 0 : 1;
      const th = uturn ? Math.PI : F.wrap(headingOf(this.at(nx.e, nx.dir, 0.5, 0)) - headingOf(this.at(e, dir, e.len - 0.5, 0)));
      let deg = 0, top = 0, mouthIn = 0, mouthOut = 0;
      for (const A of nd.arms || []) {
        if (A.e === e && A.end === endIn) mouthIn = A.mouth;
        if (A.e === nx.e && A.end === endOut) mouthOut = A.mouth;
        if (!drivable(A.e)) continue;
        deg++;
        if (!(A.e === e && A.end === endIn)) top = Math.max(top, RANK[A.e.kind] || 1);
      }
      const perIn = this.perDir(e), perOut = this.perDir(nx.e);
      let laneIn = Math.min(lane, perIn - 1), laneOut;
      if (uturn || th < -0.5) { laneIn = 0; laneOut = 0; }
      else if (th > 0.5) { laneIn = perIn - 1; laneOut = perOut - 1; }
      else laneOut = Math.min(laneIn, perOut - 1);
      const base = 2.5 + 5.5 * Math.abs(th) / Math.PI;
      const pad = deg >= 3 ? 1.5 : 0;
      let inT = uturn ? 8 : Math.min(Math.max(mouthIn + pad, base), e.len * 0.45);
      if (deg >= 3 && !uturn) inT = this.stopLine(nd, e, endIn, dir, this.laneOff(e, laneIn), c.hw, inT, Math.min(40, e.len - t - 1));
      let outT = uturn ? 8 : Math.max(mouthOut + pad, base);
      inT = Math.max(0, Math.min(inT, e.len - t));
      outT = uturn ? inT : Math.min(outT, nx.e.len * 0.45);
      const p0 = this.at(e, dir, e.len - inT, this.laneOff(e, laneIn));
      const p3 = this.at(nx.e, nx.dir, outT, this.laneOff(nx.e, laneOut));
      const cv = this.curve(p0, p3, uturn);
      return {
        e, dir, node, nd, nx, uturn, th, inT, outT, laneIn, laneOut, deg, cv,
        minor: deg >= 3 && (RANK[e.kind] || 1) < top,
        vTurn: F.clamp(Math.sqrt(c.aLat / Math.max(cv.kmax, 1e-4)), 2.2, 40),
        go: false, stopT: 0, wait: 0
      };
    }

    plan(c) {
      c.plan = this.makePlan(c, c.e, c.dir, c.t, c.lane);
      c.lane = c.plan.laneIn;
      c.next = null;
    }

    stopLine(nd, e, endIn, dir, off, hw, s, lim) {
      for (; s < lim; s += 1) {
        const p = this.at(e, dir, e.len - s, off);
        let clear = true;
        for (const B of nd.arms) {
          if ((B.e === e && B.end === endIn) || !drivable(B.e)) continue;
          const q = this.w.armProj(B, p.x, p.z);
          if (q && q.d < B.hw + hw + 0.4) { clear = false; break; }
        }
        if (clear) return s;
      }
      return Math.max(s, lim);
    }

    front(c) {
      return c.seg === 'turn' ? this.bez(c.plan.cv, c.u) : this.at(c.e, c.dir, c.t, c.off);
    }

    ahead(c, dist) {
      if (c.seg === 'turn') return this.bez(c.plan.cv, c.u + dist);
      const t0 = c.e.len - c.plan.inT, t = c.t + dist;
      return t <= t0 ? this.at(c.e, c.dir, t, c.off) : this.bez(c.plan.cv, t - t0);
    }

    enterTurn(c) {
      const p = c.plan;
      p.cv = this.curve(this.at(c.e, c.dir, c.t, c.off), p.cv.end, p.uturn);
      p.vTurn = F.clamp(Math.sqrt(c.aLat / Math.max(p.cv.kmax, 1e-4)), 2.2, 40);
      p.go = true;
      c.seg = 'turn';
      c.u = 0;
      c.next = this.makePlan(c, p.nx.e, p.nx.dir, p.outT, p.laneOut);
    }

    exitTurn(c) {
      const p = c.plan;
      c.e = p.nx.e;
      c.dir = p.nx.dir;
      c.t = p.outT;
      c.off = this.laneOff(c.e, p.laneOut);
      c.seg = 'edge';
      c.plan = c.next || this.makePlan(c, c.e, c.dir, c.t, p.laneOut);
      c.lane = c.plan.laneIn;
      c.next = null;
    }

    advance(c, ds) {
      for (let k = 0; k < 4 && ds > 0; k++) {
        if (c.seg === 'edge') {
          const t0 = c.e.len - c.plan.inT;
          if (c.t + ds < t0) { c.t += ds; return; }
          if (c.holding) { c.t = t0; c.v = 0; return; }
          ds -= Math.max(0, t0 - c.t);
          c.t = t0;
          this.enterTurn(c);
        } else {
          const L = c.plan.cv.len;
          if (c.u + ds < L) { c.u += ds; return; }
          ds -= L - c.u;
          this.exitTurn(c);
        }
      }
    }

    upcoming(c) {
      if (c.seg === 'edge') return { q: c.plan, d: c.e.len - c.plan.inT - c.t };
      const n = c.next;
      return n ? { q: n, d: c.plan.cv.len - c.u + (n.e.len - n.inT - c.plan.outT) } : null;
    }

    conflict(pts, list) {
      for (let i = 0; i < pts.length; i += 2) {
        for (let j = 0; j < list.length; j += 2) {
          const dx = pts[i] - list[j], dz = pts[i + 1] - list[j + 1];
          if (dx * dx + dz * dz < CLEAR * CLEAR) return true;
        }
      }
      return false;
    }

    crossing(pts, x, z, vx, vz) {
      for (let s = 0; s <= 2.5; s += 0.5) {
        const px = x + vx * s, pz = z + vz * s;
        for (let i = 0; i < pts.length; i += 2) {
          const dx = pts[i] - px, dz = pts[i + 1] - pz;
          if (dx * dx + dz * dz < 3.2 * 3.2) return true;
        }
      }
      return false;
    }

    blocked(c, P, veh, others, impatient) {
      const pts = P.cv.pts;
      if ((!impatient || veh.speed > 1) && this.crossing(pts, veh.x, veh.z, veh.vx, veh.vz)) return true;
      for (const o of others) {
        if (Math.abs(o.x - P.nd.x) > 60 || Math.abs(o.z - P.nd.z) > 60) continue;
        if (this.crossing(pts, o.x, o.z, Math.sin(o.yaw) * o.v, -Math.cos(o.yaw) * o.v)) return true;
      }
      const clash = (Q, o) => Q && Q.node === P.node && !(this.sameFile(c, P, o, Q)) && this.conflict(pts, Q.cv.pts);
      const exit = P.nx, exitOff = this.laneOff(exit.e, P.laneOut);
      for (const o of this.cars) {
        if (o === c || o.state === 'hit') continue;
        if (o.seg === 'edge' && o.e === exit.e && o.dir === exit.dir && o.v < 1.5 && o.t < P.outT + o.hl + c.hl + 5 && Math.abs(o.off - exitOff) < 1.5) return true;
        if (o.seg === 'turn' && clash(o.plan, o)) return true;
        const up = this.upcoming(o);
        if (!up || up.q.node !== P.node) continue;
        const soon = up.d < Math.max(8, o.v * 4.5) && (o.v > 1 || up.d < 3);
        if (up.q.go && soon && clash(up.q, o)) return true;
        if (P.minor && !impatient && !up.q.go && !up.q.minor && soon && clash(up.q, o)) return true;
      }
      return false;
    }

    sameFile(c, P, o, Q) {
      if (Q.e !== P.e || Q.dir !== P.dir || Q.laneIn !== P.laneIn) return false;
      const lat = o.seg === 'turn' && o.plan !== Q ? this.laneOff(Q.e, o.plan.laneOut) : o.off;
      return Math.abs(lat - c.off) < 1.5;
    }

    occupied(c, P) {
      for (const o of this.cars) {
        if (o === c || o.state === 'hit' || o.seg !== 'turn' || o.plan.node !== P.node) continue;
        const Q = o.plan;
        if (this.sameFile(c, P, o, Q)) continue;
        if (this.conflict(P.cv.pts, Q.cv.pts)) return true;
      }
      return false;
    }

    junction(c, P, d, dt, veh, others, limit) {
      if (P.deg < 3) return;
      if (P.go) {
        const reach = d - 0.6;
        if (reach > 0.1 && c.v * c.v < 2 * c.bMax * reach && this.occupied(c, P)) { c.holding = true; limit(0, reach); }
        return;
      }
      if (c.v < 0.4 && d < 4) { P.wait += dt; P.stopT += dt; }
      let stop = P.minor && P.stopT < c.hold;
      if (!stop && d < Math.max(35, c.v * c.v / 3 + 15)) stop = this.blocked(c, P, veh, others, P.wait > 9);
      if (stop) {
        const reach = Math.max(0, d - 0.6);
        if (c.v > 3 && c.v * c.v > 2 * c.bMax * reach) P.go = true;
        else { c.holding = true; limit(0, reach); }
      } else if (d < c.v * c.v / 4 + 6) P.go = true;
    }

    leader(c, veh, others) {
      const range = Math.max(25, c.v * 3.2), nose = c.hl - c.L / 2;
      const path = [];
      for (let s = 0; s <= range; s += 3) path.push(this.ahead(c, s));
      let gap = Infinity, vl = 0, lead = null;
      const test = (o, x, y, z, hl, hw, yaw, vx, vz) => {
        if (Math.abs(y - c.y) > 2.5) return;
        const qx = x - c.x, qz = z - c.z;
        if (qx * qx + qz * qz > (range + 8) * (range + 8)) return;
        const ox = Math.sin(yaw), oz = -Math.cos(yaw);
        for (let k = 0; k < path.length; k++) {
          const p = path[k];
          const dx = x - p.x, dz = z - p.z;
          const cs = Math.abs(ox * p.tx + oz * p.tz), sn = Math.abs(ox * p.tz - oz * p.tx);
          const ext = cs * hl + sn * hw, along = dx * p.tx + dz * p.tz;
          if (along < -1.6 - ext || along > 1.6 + ext) continue;
          if (Math.abs(dx * p.tz - dz * p.tx) > c.hw + sn * hl + cs * hw + 0.3) continue;
          const g = k * 3 + along - nose - ext;
          if (g < gap) { gap = g; vl = Math.max(0, vx * p.tx + vz * p.tz); lead = o; }
          return;
        }
      };
      for (const o of this.cars) {
        if (o === c || (c.ghost > 0 && o.lead === c)) continue;
        if (o.state === 'hit') test(o, o.x, o.y, o.z, o.hl, o.hw, o.yaw, o.vx, o.vz);
        else test(o, o.x, o.y, o.z, o.hl, o.hw, o.yaw, o.tx * o.v, o.tz * o.v);
      }
      test(veh, veh.x, veh.y, veh.z, veh.spec.len / 2, veh.spec.wid / 2, veh.yaw, veh.vx, veh.vz);
      for (const o of others) test(o, o.x, o.y, o.z, o.hl, o.hw, o.yaw, Math.sin(o.yaw) * o.v, -Math.cos(o.yaw) * o.v);
      return { gap, vl, lead };
    }

    accel(c, veh, others, dt) {
      const p = c.plan, e = c.e;
      let v0 = e.k.speed * c.pace;
      if (c.seg === 'turn') {
        const vn = p.nx.e.k.speed * c.pace;
        v0 = c.u < p.cv.len * 0.6 ? Math.min(v0, vn, p.vTurn) : vn;
      }
      let a = Math.max(-3, c.aMax * (1 - Math.pow(c.v / Math.max(0.5, v0), 4)));
      const limit = (vc, d) => {
        if (c.v <= vc) return;
        const need = d > 0.05 ? (c.v * c.v - vc * vc) / (2 * d) : 99;
        if (need > c.bTrig) a = Math.min(a, -need);
        else if (need > c.bTrig * 0.5) a = Math.min(a, 0);
      };
      c.holding = false;
      if (c.seg === 'edge') {
        const d = e.len - p.inT - c.t;
        this.bends(c, d, limit);
        limit(p.vTurn, d);
        this.junction(c, p, d, dt, veh, others, limit);
      } else if (c.next) {
        const n = c.next, d = p.cv.len - c.u + (n.e.len - n.inT - p.outT);
        limit(n.vTurn, d);
        this.junction(c, n, d, dt, veh, others, limit);
      }
      const ld = this.leader(c, veh, others);
      if (ld.gap < Infinity) {
        const s = Math.max(0.05, ld.gap);
        const sStar = 2.2 + c.v * 1.1 + c.v * (c.v - ld.vl) / (2 * Math.sqrt(c.aMax * 2.5));
        a = Math.min(a, c.aMax * (1 - Math.pow(Math.max(0, sStar) / s, 2)));
      }
      c.lead = ld.lead;
      c.gap = ld.gap;
      const o = ld.lead, mutual = c.v < 0.2 && o && o.lead === c && o.v < 0.2;
      c.stuck = mutual ? c.stuck + dt : 0;
      if (c.stuck > 1.5 && (c.gap > o.gap || (c.gap === o.gap && c.uid > o.uid))) { c.ghost = 2.5; c.stuck = 0; }
      if (c.ghost > 0) c.ghost -= dt;
      return F.clamp(a, -c.bMax, c.aMax);
    }

    bends(c, d, limit) {
      const e = c.e, S = e.s, n = S.length, k = this.frame(e).k;
      const s = c.dir > 0 ? c.t : e.len - c.t;
      const range = Math.min(d, 70);
      const i0 = this.segAt(e, s);
      if (c.dir > 0) {
        for (let i = i0 + 1; i < n - 1 && S[i] - s <= range; i++) if (k[i] > 0.004) limit(Math.sqrt(c.aLat / k[i]), S[i] - s - 2);
      } else {
        for (let i = i0; i > 0 && s - S[i] <= range; i--) if (k[i] > 0.004) limit(Math.sqrt(c.aLat / k[i]), s - S[i] - 2);
      }
    }

    laneFree(c, off) {
      for (const o of this.cars) {
        if (o === c || o.e !== c.e || o.dir !== c.dir || o.seg !== 'edge') continue;
        if (Math.abs(o.off - off) < 1.8 && Math.abs(o.t - c.t) < 10 + Math.abs(o.v - c.v) * 2) return false;
      }
      return true;
    }

    drive(c, dt, veh, others) {
      const acc = this.accel(c, veh, others, dt);
      c.v = Math.max(0, c.v + acc * dt);
      c.brake = acc < -0.8 || (c.v < 0.3 && c.holding) ? 1 : 0;
      const want = this.laneOff(c.e, c.lane);
      if (Math.abs(want - c.off) > 0.01 && this.laneFree(c, want)) c.off = F.approach(c.off, want, 0.9 * dt);
      this.advance(c, c.v * dt);
      c.wheel += c.v * dt / 0.3;
      const rate = this.follow(c, dt);
      this.pose(c, dt, rate, acc, c.v);
    }

    follow(c, dt) {
      const f = this.front(c);
      let dx = f.x - c.rx, dz = f.z - c.rz;
      const l = Math.hypot(dx, dz) || 1;
      dx /= l; dz /= l;
      c.rx = f.x - dx * c.L;
      c.rz = f.z - dz * c.L;
      c.x = c.rx + dx * c.L / 2;
      c.z = c.rz + dz * c.L / 2;
      const yaw = Math.atan2(dx, -dz);
      const rate = dt > 0 ? F.wrap(yaw - c.yaw) / dt : 0;
      c.yaw = yaw;
      c.tx = dx; c.tz = dz;
      c.steer = F.clamp(F.wrap(headingOf(f) - yaw), -0.6, 0.6);
      return rate;
    }

    pose(c, dt, rate = 0, acc = 0, speed = 0) {
      const w = this.w, fx = Math.sin(c.yaw), fz = -Math.cos(c.yaw), rx = -fz, rz = fx;
      const h = c.L / 2, ht = c.track / 2, ref = c.y + 1.2;
      const yF = w.ground(c.x + fx * h, c.z + fz * h, ref, false);
      const yB = w.ground(c.x - fx * h, c.z - fz * h, ref, false);
      const yR = w.ground(c.x + rx * ht, c.z + rz * ht, ref, false);
      const yL = w.ground(c.x - rx * ht, c.z - rz * ht, ref, false);
      const k = Math.min(dt, 0.05);
      c.aLong += (acc - c.aLong) * (1 - Math.exp(-k * 8));
      const tp = F.clamp(c.aLong * 0.0065, -0.05, 0.03), tr = F.clamp(speed * rate * 0.011, -0.055, 0.055);
      c.bpV += ((tp - c.bp) * 100 - c.bpV * 9) * k;
      c.bp += c.bpV * k;
      c.brV += ((tr - c.br) * 100 - c.brV * 9) * k;
      c.br += c.brV * k;
      c.pitch = Math.atan2(yF - yB, 2 * h) + c.bp;
      c.roll = Math.atan2(yR - yL, 2 * ht) + c.br;
      c.y = (yF + yB + yR + yL) / 4 + 0.02;
    }

    update(dt, veh, opts = {}) {
      const px = veh.x, pz = veh.z;
      const others = opts.others || [];
      const want = Math.round(this.max * this.density * (opts.scale || 1));
      if (this.cars.length < want) this.spawn(px, pz);
      for (let i = this.cars.length - 1; i >= 0; i--) {
        const c = this.cars[i];
        const d = Math.hypot(c.x - px, c.z - pz);
        if (d > 620 || (c.state === 'hit' && c.hitT > 8 && d > 90) || (c.state === 'hit' && c.hitT > 30)) { this.cars.splice(i, 1); continue; }
        if (c.state === 'hit') {
          c.hitT += dt;
          const k = Math.exp(-dt * 1.4);
          c.vx *= k; c.vz *= k; c.r *= Math.exp(-dt * 2);
          c.x += c.vx * dt; c.z += c.vz * dt; c.yaw += c.r * dt;
          c.tx = Math.sin(c.yaw); c.tz = -Math.cos(c.yaw);
          const sp = Math.hypot(c.vx, c.vz);
          c.wheel += sp * dt / 0.3;
          c.steer *= k;
          this.pose(c, dt, c.r, 0, sp);
          continue;
        }
        this.drive(c, dt, veh, others);
      }
    }

    collide(veh, game) {
      const o = veh.obb();
      for (const c of this.cars) {
        if (Math.abs(c.x - veh.x) > 7 || Math.abs(c.z - veh.z) > 7) continue;
        if (Math.abs(c.y - veh.y) > 2.5) continue;
        const fx = Math.sin(c.yaw), fz = -Math.cos(c.yaw);
        const box = { x: c.x, z: c.z, hx: c.hl, hz: c.hw, c: fx, s: fz };
        const hit = F.Coll.obbObb(o, box);
        if (!hit) continue;
        veh.x += hit.nx * hit.d; veh.z += hit.nz * hit.d;
        const cvx = c.state === 'hit' ? c.vx : c.tx * c.v, cvz = c.state === 'hit' ? c.vz : c.tz * c.v;
        const rvx = veh.vx - cvx, rvz = veh.vz - cvz;
        const vn = rvx * hit.nx + rvz * hit.nz;
        if (vn >= 0) continue;
        const m1 = veh.spec.mass, m2 = c.mass;
        const J = -(1.3 * vn) / (1 / m1 + 1 / m2);
        veh.vx += J * hit.nx / m1; veh.vz += J * hit.nz / m1;
        const rpx = hit.px - veh.x, rpz = hit.pz - veh.z;
        veh.r += ((-rpz * hit.nx + rpx * hit.nz) * J / veh.spec.Iz) * 0.35;
        if (c.state !== 'hit') { c.state = 'hit'; c.vx = cvx; c.vz = cvz; c.hitT = 0; }
        c.vx -= J * hit.nx / m2; c.vz -= J * hit.nz / m2;
        c.r += (this.rng() - 0.5) * Math.min(3, -vn * 0.25);
        c.hitByPlayer = true;
        if (game) game.emit({ t: 'carhit', impact: -vn, traffic: c });
        if (game && game.trafficHit) game.trafficHit(c, -vn);
        if (game && game.carCrash) game.carCrash(c, hit, -vn);
      }
    }

    collideRival(a) {
      const o = a.obb();
      const [avx, avz] = a.velocity();
      for (const c of this.cars) {
        if (Math.abs(c.x - a.x) > 7 || Math.abs(c.z - a.z) > 7 || Math.abs(c.y - a.y) > 2.5) continue;
        const hit = F.Coll.obbObb(o, { x: c.x, z: c.z, hx: c.hl, hz: c.hw, c: Math.sin(c.yaw), s: -Math.cos(c.yaw) });
        if (!hit) continue;
        c.x -= hit.nx * hit.d; c.z -= hit.nz * hit.d;
        const cvx = c.state === 'hit' ? c.vx : c.tx * c.v, cvz = c.state === 'hit' ? c.vz : c.tz * c.v;
        const vn = (avx - cvx) * hit.nx + (avz - cvz) * hit.nz;
        if (vn >= 0) continue;
        const J = -(1.2 * vn) / (1 / a.mass + 1 / c.mass);
        a.push(J * hit.nx, J * hit.nz);
        if (c.state !== 'hit') { c.state = 'hit'; c.vx = cvx; c.vz = cvz; c.hitT = 0; }
        c.vx -= J * hit.nx / c.mass; c.vz -= J * hit.nz / c.mass;
        c.r += (this.rng() - 0.5) * Math.min(3, -vn * 0.25);
        if (this.crash) this.crash(a, c, hit, -vn);
      }
    }
  }

  Traffic.MODELS = MODELS.map(m => m[0]);
  F.Traffic = Traffic;
})(globalThis.Forza = globalThis.Forza || {});
