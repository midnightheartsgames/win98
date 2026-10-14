(function (F) {
  'use strict';

  const STEP = 4;

  class Route {
    constructor(pts, closed = false) {
      this.closed = closed;
      const raw = pts;
      const cum = [0];
      for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
      const total = cum[cum.length - 1];
      const n = Math.max(2, Math.floor(total / STEP) + 1);
      this.n = n;
      this.total = closed ? n * STEP : (n - 1) * STEP;
      this.x = new Float32Array(n); this.z = new Float32Array(n); this.y = new Float32Array(n);
      this.hw = new Float32Array(n); this.surf = new Uint8Array(n); this.edge = new Int32Array(n);
      this.tx = new Float32Array(n); this.tz = new Float32Array(n); this.curv = new Float32Array(n);
      let j = 0;
      for (let i = 0; i < n; i++) {
        const s = Math.min(i * STEP * (closed ? total / (n * STEP) : total / ((n - 1) * STEP || 1)), total);
        while (j + 1 < raw.length - 1 && cum[j + 1] < s) j++;
        const a = raw[j], b = raw[Math.min(j + 1, raw.length - 1)];
        const L = cum[Math.min(j + 1, raw.length - 1)] - cum[j];
        const t = L > 0 ? F.clamp((s - cum[j]) / L, 0, 1) : 0;
        this.x[i] = a[0] + (b[0] - a[0]) * t;
        this.z[i] = a[1] + (b[1] - a[1]) * t;
        this.y[i] = (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * t;
        const near = t < 0.5 ? a : b;
        this.hw[i] = near[3] || 6;
        this.surf[i] = near[4] || 0;
        this.edge[i] = near[5] !== undefined ? near[5] : -1;
      }
      const ox = this.x.slice(), oz = this.z.slice();
      const nx = new Float32Array(n), nz = new Float32Array(n);
      for (let it = 0; it < 8; it++) {
        for (let i = 0; i < n; i++) {
          if (!closed && (i === 0 || i === n - 1)) { nx[i] = this.x[i]; nz[i] = this.z[i]; continue; }
          const a = this.idx(i - 1), b = this.idx(i + 1);
          let px = this.x[i] + 0.5 * ((this.x[a] + this.x[b]) / 2 - this.x[i]);
          let pz = this.z[i] + 0.5 * ((this.z[a] + this.z[b]) / 2 - this.z[i]);
          const dx = px - ox[i], dz = pz - oz[i];
          const d = Math.hypot(dx, dz), lim = Math.max(0.5, this.hw[i] * 0.5);
          if (d > lim) { px = ox[i] + dx / d * lim; pz = oz[i] + dz / d * lim; }
          nx[i] = px; nz[i] = pz;
        }
        this.x.set(nx); this.z.set(nz);
      }
      for (let i = 0; i < n; i++) {
        const a = this.idx(i - 1), b = this.idx(i + 1);
        let dx = this.x[b] - this.x[a], dz = this.z[b] - this.z[a];
        const l = Math.hypot(dx, dz) || 1;
        this.tx[i] = dx / l; this.tz[i] = dz / l;
      }
      this.off = new Float32Array(n);
      for (let i = 0; i < n; i++) this.off[i] = (this.x[i] - ox[i]) * -this.tz[i] + (this.z[i] - oz[i]) * this.tx[i];
      const raw2 = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const a = this.idx(i - 1), b = this.idx(i + 1);
        const cr = this.tx[a] * this.tz[b] - this.tz[a] * this.tx[b];
        const dt = Math.min(1, Math.max(-1, this.tx[a] * this.tx[b] + this.tz[a] * this.tz[b]));
        raw2[i] = Math.atan2(cr, dt) / (2 * STEP);
      }
      for (let i = 0; i < n; i++) {
        let best = 0, sum = 0;
        for (let k = -2; k <= 2; k++) {
          const c = raw2[this.idx(i + k)];
          sum += c;
          if (Math.abs(c) > Math.abs(best)) best = c;
        }
        this.curv[i] = Math.abs(best) * 0.7 + Math.abs(sum / 5) * 0.3;
        if (sum < 0) this.curv[i] = -this.curv[i];
      }
      this.line = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let sum = 0, cnt = 0;
        for (let k = -8; k <= 8; k++) { sum += this.curv[this.idx(i + k)] * (1 - Math.abs(k) / 9); cnt += 1 - Math.abs(k) / 9; }
        const c = sum / cnt;
        this.line[i] = F.clamp(c * 55, -1, 1) * Math.max(0, this.hw[i] - 2.2);
      }
    }

    idx(i) {
      if (this.closed) return ((i % this.n) + this.n) % this.n;
      return F.clamp(i, 0, this.n - 1);
    }

    wrapS(s) {
      if (!this.closed) return F.clamp(s, 0, this.total);
      return ((s % this.total) + this.total) % this.total;
    }

    point(s) {
      s = this.wrapS(s);
      const f = s / STEP;
      const i0 = Math.floor(f), t = f - i0;
      const a = this.idx(i0), b = this.idx(i0 + 1);
      return {
        x: this.x[a] + (this.x[b] - this.x[a]) * t,
        z: this.z[a] + (this.z[b] - this.z[a]) * t,
        y: this.y[a] + (this.y[b] - this.y[a]) * t,
        tx: this.tx[a] + (this.tx[b] - this.tx[a]) * t,
        tz: this.tz[a] + (this.tz[b] - this.tz[a]) * t,
        hw: this.hw[a], surf: this.surf[a], i: a, line: this.line[a] + (this.line[b] - this.line[a]) * t, edge: this.edge[a]
      };
    }

    project(x, z, hint = -1, win = 30) {
      let best = -1, bd = Infinity, bt = 0;
      const test = i => {
        const a = this.idx(i), b = this.idx(i + 1);
        if (!this.closed && a === this.n - 1) return;
        const q = F.segDist(x, z, this.x[a], this.z[a], this.x[b], this.z[b]);
        if (q.d < bd) { bd = q.d; best = a; bt = q.t; }
      };
      if (hint >= 0) for (let k = -win; k <= win; k++) test(hint + k);
      if (hint < 0 || bd > 60) for (let i = 0; i < this.n; i++) test(i);
      const a = best, b = this.idx(best + 1);
      const px = this.x[a] + (this.x[b] - this.x[a]) * bt, pz = this.z[a] + (this.z[b] - this.z[a]) * bt;
      const lat = (x - px) * -this.tz[a] + (z - pz) * this.tx[a];
      return { i: a, s: a * STEP + bt * STEP, d: bd, lat };
    }

    static fromVia(world, via, closed, pref) {
      const anchors = via.map(v => anchorAt(world, v));
      if (anchors.some(a => !a)) throw new Error('via off-road');
      const pts = [];
      const legs = closed ? anchors.length : anchors.length - 1;
      const res = [];
      let dirIn = 0, inEdge = null;
      for (let k = 0; k < legs; k++) {
        const A = anchors[k], B = anchors[(k + 1) % anchors.length];
        const last = closed && k === legs - 1 && res.length;
        const endDir = last ? res[0].dirStart : 0;
        const endForbid = last ? res[0].firstEdge : null;
        let leg = routeBetween(world, A, B, pref, dirIn, endDir, inEdge, endForbid);
        if (!leg && (endDir || endForbid)) leg = routeBetween(world, A, B, pref, dirIn, 0, inEdge, null);
        if (!leg) leg = routeBetween(world, A, B, pref, 0, 0, null, null);
        if (!leg) throw new Error('no route ' + k);
        res.push(leg);
        dirIn = leg.dirEnd;
        inEdge = leg.lastEdge;
      }
      for (const leg of res) {
        for (const p of leg.pts) {
          const last = pts[pts.length - 1];
          if (last && Math.hypot(last[0] - p[0], last[1] - p[1]) < 0.5) continue;
          pts.push(p);
        }
      }
      if (closed && pts.length > 2) {
        const f = pts[0], l = pts[pts.length - 1];
        if (Math.hypot(f[0] - l[0], f[1] - l[1]) < 1) pts.pop();
      }
      return new Route(pts, closed);
    }
  }

  function anchorAt(world, v) {
    for (const nd of world.nodes) {
      if (nd.edges.length < 3) continue;
      if (Math.abs(nd.x - v[0]) > 30 || Math.abs(nd.z - v[1]) > 30) continue;
      if (Math.hypot(nd.x - v[0], nd.z - v[1]) < nd.r + 6) return { node: nd.id, x: nd.x, z: nd.z };
    }
    return world.nearestRoad(v[0], v[1], 160);
  }

  function subEdge(e, s0, s1) {
    const out = [];
    const dir = s1 >= s0 ? 1 : -1;
    const p0 = edgePt(e, s0);
    out.push(p0);
    if (dir > 0) {
      for (let i = 0; i < e.pts.length; i++) if (e.s[i] > s0 + 0.5 && e.s[i] < s1 - 0.5) out.push([e.pts[i][0], e.pts[i][1], e.y[i], e.hw, e.surf, e.id]);
    } else {
      for (let i = e.pts.length - 1; i >= 0; i--) if (e.s[i] < s0 - 0.5 && e.s[i] > s1 + 0.5) out.push([e.pts[i][0], e.pts[i][1], e.y[i], e.hw, e.surf, e.id]);
    }
    out.push(edgePt(e, s1));
    return out;
  }

  function edgePt(e, s) {
    s = F.clamp(s, 0, e.len);
    let i = 0;
    while (i + 1 < e.pts.length - 1 && e.s[i + 1] < s) i++;
    const L = e.s[i + 1] - e.s[i] || 1;
    const t = F.clamp((s - e.s[i]) / L, 0, 1);
    const a = e.pts[i], b = e.pts[i + 1];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, e.y[i] + (e.y[i + 1] - e.y[i]) * t, e.hw, e.surf, e.id];
  }

  function routeBetween(world, A, B, pref, dirIn = 0, dirOut = 0, inEdge = null, endForbid = null) {
    const aNode = A.node !== undefined, bNode = B.node !== undefined;
    if (!aNode && !bNode && A.e === B.e) {
      const d = B.s >= A.s ? 1 : -1;
      if ((!dirIn || dirIn === d) && (!dirOut || dirOut === d)) return { pts: subEdge(A.e, A.s, B.s), dirStart: d, dirEnd: d, firstEdge: A.e, lastEdge: A.e };
    }
    const starts = aNode ? [{ node: A.node, cost: 0, dir: 0, pts: () => [], e: null }]
      : [{ node: A.e.a, cost: A.s, dir: -1, pts: () => subEdge(A.e, A.s, 0), e: A.e }, { node: A.e.b, cost: A.e.len - A.s, dir: 1, pts: () => subEdge(A.e, A.s, A.e.len), e: A.e }].filter(s => !dirIn || s.dir === dirIn);
    const ends = bNode ? [{ node: B.node, cost: 0, dir: 0, pts: () => [], e: null }]
      : [{ node: B.e.a, cost: B.s, dir: 1, pts: () => subEdge(B.e, 0, B.s), e: B.e }, { node: B.e.b, cost: B.e.len - B.s, dir: -1, pts: () => subEdge(B.e, B.e.len, B.s), e: B.e }].filter(e => !dirOut || e.dir === dirOut);
    const forbid = new Set();
    if (!aNode) forbid.add(A.e.id);
    if (!bNode) forbid.add(B.e.id);
    if (aNode && inEdge) forbid.add(inEdge.id);
    if (bNode && endForbid) forbid.add(endForbid.id);
    let best = null;
    for (const st of starts) {
      for (const en of ends) {
        if (st.node === en.node && aNode && bNode) continue;
        const path = st.node === en.node ? [] : world.route(st.node, en.node, pref, forbid);
        if (!path) continue;
        if (aNode && !path.length && !st.e && inEdge && en.e === inEdge) continue;
        let len = 0;
        for (const p of path) len += p.e.len * (pref && pref[p.e.kind] !== undefined ? pref[p.e.kind] : 1);
        const cost = st.cost + len + en.cost;
        if (!best || cost < best.cost) best = { cost, st, en, path };
      }
    }
    if (!best) return null;
    const pts = best.st.pts();
    for (const p of world.pathPoints(best.path)) pts.push(p);
    for (const p of best.en.pts()) pts.push(p);
    const firstEdge = best.st.e || (best.path[0] && best.path[0].e) || best.en.e;
    const lastEdge = best.en.e || (best.path.length && best.path[best.path.length - 1].e) || best.st.e;
    return { pts, dirStart: best.st.dir, dirEnd: best.en.dir, firstEdge, lastEdge };
  }

  const accCache = new Map();
  function accTable(spec) {
    const key = spec.id + JSON.stringify(spec.up);
    let t = accCache.get(key);
    if (t) return t;
    const veh = new F.Vehicle(spec);
    veh.place(0, 0, 0, F.NullWorld);
    t = new Float32Array(120);
    const dt = 1 / 60;
    let lastV = 0;
    for (let i = 0; i < 60 * 70; i++) {
      veh.step(dt, { thr: 1, brk: 0, steer: 0 }, F.NullWorld);
      const v = veh.speed;
      const bin = Math.floor(v / 1.2);
      const a = (v - lastV) / dt;
      if (bin < 120 && a > 0 && veh.shiftT <= 0) t[bin] = Math.max(t[bin], a);
      lastV = v;
    }
    let lastA = t[0] || 3;
    for (let i = 0; i < 120; i++) { if (t[i] <= 0) t[i] = lastA * 0.97; lastA = t[i]; }
    for (let i = 119; i > 0; i--) if (t[i] > t[i - 1] * 1.5) t[i] = t[i - 1];
    t.vmax = F.perf(spec).vmax / 3.6;
    accCache.set(key, t);
    return t;
  }
  F.accTable = accTable;

  const DIFF = [
    { name: 'Новичок', grip: 0.56, acc: 0.76, rb: 0.2, show: 0.92, pay: 0 },
    { name: 'Средний', grip: 0.66, acc: 0.83, rb: 0.12, show: 0.97, pay: 0.05 },
    { name: 'Опытный', grip: 0.77, acc: 0.9, rb: 0.07, show: 1, pay: 0.1 },
    { name: 'Профи', grip: 0.88, acc: 0.96, rb: 0.04, show: 1.03, pay: 0.2 },
    { name: 'Непобедимый', grip: 0.97, acc: 1.0, rb: 0.015, show: 1.06, pay: 0.35 }
  ];
  F.DIFF = DIFF;

  class Rival {
    constructor(race, o) {
      this.race = race;
      this.name = o.name;
      this.spec = o.spec;
      this.id = o.spec.id;
      this.paint1 = o.paint1; this.paint2 = o.paint2 || o.paint1;
      this.livery = o.livery || 'none';
      this.metal = !!o.metal;
      this.dirt = o.dirt || 0;
      this.skill = o.skill;
      this.s = o.s; this.d = o.d; this.vd = 0; this.v = 0;
      this.s0 = o.s; this.d0 = o.d; this.slide = 0;
      this.lap = 0; this.done = false; this.time = 0;
      this.mass = o.spec.mass;
      this.hl = o.spec.len / 2; this.hw = o.spec.wid / 2;
      this.acc = accTable(o.spec);
      this.vmax = this.acc.vmax;
      this.wheel = 0;
      this.mood = (F.hash2(o.seed || 1, 3, 7) - 0.5) * 0.04;
      this.plan();
      this.lineBias = (F.hash2(o.seed || 1, 5, 9) - 0.5) * 0.6;
      this.brakeLight = 0;
      this.x = 0; this.z = 0; this.y = 0; this.yaw = 0;
      const set = race.game && race.game.settings;
      this.dmg = F.Damage && !(set && set.dmg === 'off') ? new F.Damage(o.spec.car, { mech: false, wing: o.spec.wing, seed: (o.seed || 1) * 13 + 3 }) : null;
      this.pose();
    }

    plan() {
      const r = this.race.route, sp = this.spec;
      const n = r.n;
      const vc = new Float32Array(n);
      const wet = this.race.wet;
      const k = (0.5 * F.RHO * sp.cla) / (sp.mass * F.G) * 0.9;
      for (let i = 0; i < n; i++) {
        const mu = sp.grip * F.surfGrip(r.surf[i], sp.off, wet) * this.skill.grip * (1 + this.mood);
        const R = 1 / Math.max(Math.abs(r.curv[i]), 1e-4);
        const den = 1 - mu * F.G * R * k;
        let v = den > 0.08 ? Math.sqrt((mu * F.G * R) / den) : 200;
        vc[i] = Math.min(v, this.vmax * 0.99);
      }
      const dec = Math.min(sp.grip * 1.05, sp.brake) * F.G * 0.9 * this.skill.grip;
      const va = vc.slice();
      const passes = r.closed ? 2 : 1;
      for (let p = 0; p < passes; p++) {
        for (let i = n - 1; i >= 0; i--) {
          const nx = r.closed ? (i + 1) % n : i + 1;
          if (nx >= n) continue;
          const lim = Math.sqrt(va[nx] * va[nx] + 2 * dec * STEP);
          if (lim < va[i]) va[i] = lim;
        }
      }
      this.vPlan = va;
      this.dec = dec;
    }

    progress() { return this.lap * this.race.route.total + this.s; }

    step(dt, rivals, player) {
      const race = this.race, r = race.route;
      if (this.done) {
        const cruise = r.closed ? 12 : Math.max(0, Math.min(12, (r.total - this.s) * 0.4));
        this.v = F.approach(this.v, cruise, 5 * dt);
        this.s += this.v * dt;
        if (r.closed && this.s >= r.total) { this.s -= r.total; this.lap++; }
        if (!r.closed) this.s = Math.min(this.s, r.total);
        this.pose();
        return;
      }
      const s = r.wrapS(this.s);
      const f = s / STEP;
      const i0 = r.idx(Math.floor(f)), i1 = r.idx(Math.floor(f) + 1);
      let vt = F.lerp(this.vPlan[i0], this.vPlan[i1], f - Math.floor(f));
      vt *= race.rubber(this);
      if (this.dmg && this.dmg.log.length) vt *= this.dmg.paceK();
      let blockV = Infinity, avoid = null, sideL = false, sideR = false;
      const me = this.progress();
      const check = (o, op, od, ov) => {
        const gap = op - me;
        if (Math.abs(gap) < this.hl * 2 + 0.3 && Math.abs(od - this.d) < this.hw * 2 + 0.1) {
          const side = od > this.d ? -1 : od < this.d ? 1 : gap > 0 ? -1 : 1, room = r.hw[i0] - 1.4;
          avoid = F.clamp(this.d + side * 3, -room, room);
          if (gap > 0) blockV = Math.min(blockV, Math.max(0, ov - 2));
          return;
        }
        if (Math.abs(gap) < this.hl * 2 + 1 && Math.abs(od - this.d) < 2.8 && Math.abs(od - this.d) >= 1) {
          if (od > this.d) sideR = true; else sideL = true;
          const want = this.hw * 2 + 0.9, room = r.hw[i0] - 1.4;
          if (Math.abs(od - this.d) < want - 0.1) avoid = F.clamp(od + (od > this.d ? -want : want), -room, room);
        }
        if (gap > 0 && gap < Math.max(22, (this.v - ov) * 1.4) && Math.abs(od - this.d) < 2.6) {
          if (ov < this.v) {
            if (Math.abs(od - this.d) < this.hw * 2 + 0.4) blockV = Math.min(blockV, Math.max(0, ov) + Math.max(0, gap - this.hl * 2 - 1.5) * 0.8);
            const room = r.hw[i0] - 1.4;
            const left = od - 3.1, right = od + 3.1;
            const target = Math.abs(left) <= room && Math.abs(right) <= room ? (Math.abs(left - this.d) < Math.abs(right - this.d) ? left : right) : Math.abs(left) <= room ? left : Math.abs(right) <= room ? right : null;
            if (target === null) blockV = Math.min(blockV, ov + gap * 0.2);
            else if ((gap - this.hl * 2) / Math.max(0.1, this.v - ov) < 3) avoid = target;
          }
        }
      };
      for (const o of rivals) if (o !== this) check(o, o.progress(), o.d, o.v);
      if (player && race.playerProg !== undefined) check(null, race.playerProg, race.playerLat, race.playerSpeed);
      for (const o of race.traffic) {
        let gap = o.s - s;
        if (r.closed) gap -= Math.round(gap / r.total) * r.total;
        if (gap > -8 && gap < 30) check(null, me + gap, o.d, o.v);
      }
      vt = Math.min(vt, blockV);
      const inGrid = race.state !== 'race';
      if (inGrid) vt = 0;
      const surf = r.surf[i0];
      const trac = Math.min(1, F.surfGrip(surf, this.spec.off, race.wet) * 1.15);
      const acc = this.acc[Math.min(119, Math.floor(this.v / 1.2))] * this.skill.acc * trac * (race.launch && race.time < 2 ? 1 : 1);
      if (this.v < vt) { this.v = Math.min(vt, this.v + acc * dt); this.brakeLight = 0; }
      else { this.v = Math.max(vt, this.v - this.dec * dt * 1.1); this.brakeLight = this.v > vt + 0.5 ? 1 : 0; }
      const hw = r.hw[i0];
      const off = r.off[i0];
      let dTarget = F.lerp(this.d0, r.line[i0] * (0.8 + this.lineBias * 0.3) + this.lineBias * 1.2, F.smooth(10, 70, me - this.s0));
      if (avoid !== null) dTarget = avoid;
      dTarget = F.clamp(dTarget, -hw + 1.3 - off, hw - 1.3 - off);
      if ((sideR && dTarget > this.d) || (sideL && dTarget < this.d)) dTarget = this.d;
      const k = 1.6;
      this.vd += ((dTarget - this.d) * k - this.vd * 2.2) * dt;
      const lim = Math.min(4, this.v * 0.3) + this.slide;
      this.vd = F.clamp(this.vd, sideL ? -this.slide : -lim, sideR ? this.slide : lim);
      this.slide *= Math.exp(-dt * 2);
      this.d += this.vd * dt;
      this.d = F.clamp(this.d, -hw - 2 - off, hw + 2 - off);
      this.s += this.v * dt;
      if (r.closed && this.s >= r.total) { this.s -= r.total; this.lap++; }
      this.wheel += this.v * dt / 0.32;
      this.pose();
    }

    pose() {
      const p = this.race.route.point(this.s);
      const rx = -p.tz, rz = p.tx;
      this.x = p.x + rx * this.d;
      this.z = p.z + rz * this.d;
      this.y = p.y;
      const l = Math.hypot(p.tx, p.tz) || 1;
      this.yaw = Math.atan2(p.tx / l, -p.tz / l) + Math.atan2(this.vd, Math.max(this.v, 2)) * 0.8;
      const q = this.race.route.point(this.s + 3);
      const curv = this.race.route.curv[p.i];
      const acc = F.clamp((this.v - (this.lastV === undefined ? this.v : this.lastV)) * 60, -9, 6);
      this.lastV = this.v;
      this.bodyPitch = F.lerp(this.bodyPitch || 0, acc * 0.0035, 0.15);
      this.bodyRoll = F.lerp(this.bodyRoll || 0, F.clamp(this.v * this.v * curv * 0.006, -0.06, 0.06), 0.15);
      this.pitch = Math.atan2(q.y - p.y, 3) + this.bodyPitch;
      this.roll = this.bodyRoll;
      this.steer = F.clamp(curv * 2.6 + this.vd * 0.05, -0.5, 0.5);
    }

    obb() {
      const fx = Math.sin(this.yaw), fz = -Math.cos(this.yaw);
      return { x: this.x, z: this.z, fx, fz, rx: -fz, rz: fx, hl: this.hl, hw: this.hw };
    }

    velocity() {
      const p = this.race.route.point(this.s);
      return [p.tx * this.v + -p.tz * this.vd, p.tz * this.v + p.tx * this.vd, p];
    }

    push(jx, jz) {
      const [, , p] = this.velocity();
      const dv = (jx * p.tx + jz * p.tz) / this.mass;
      const dl = (jx * -p.tz + jz * p.tx) / this.mass;
      this.v = Math.max(0, this.v + dv);
      this.vd = F.clamp(this.vd + dl, -8, 8);
      this.slide = Math.min(8, this.slide + Math.abs(dl));
    }

    snap() { return [this.s, this.d, this.vd, this.v, this.lap, this.done ? 1 : 0, this.time, this.dmg ? this.dmg.mark() : null]; }
    restore(a) { [this.s, this.d, this.vd, this.v, this.lap] = a; this.done = !!a[5]; this.time = a[6]; if (this.dmg && a[7]) this.dmg.rewind(a[7]); this.pose(); }
  }

  class TrainRival {
    constructor(race, o) {
      this.race = race;
      this.world = race.world;
      this.name = o.name || 'Электричка ER2';
      this.kind = 'train';
      this.s0 = o.s0; this.s1 = o.s1;
      const pace = race.diff ? race.diff.show : 1;
      this.s = o.s0; this.v = 0; this.vmax = (o.vmax || 34) * pace; this.accel = (o.accel || 0.55) * pace;
      this.done = false; this.time = 0;
      this.pose();
    }
    progressFrac() { return (this.s - this.s0) / (this.s1 - this.s0); }
    step(dt) {
      if (this.race.state !== 'race') { this.pose(); return; }
      if (!this.done) {
        this.v = Math.min(this.vmax, this.v + this.accel * dt);
        this.s += this.v * dt;
        if (this.s >= this.s1) { this.s = this.s1; this.done = true; this.time = this.race.time; }
      } else this.v = Math.max(0, this.v - 2 * dt);
      this.pose();
    }
    pose() {
      const p = this.world.railPoint(this.s);
      this.x = p.x; this.y = p.y; this.z = p.z;
      this.yaw = Math.atan2(p.tx, -p.tz);
    }
    snap() { return [this.s, this.v, this.done ? 1 : 0, this.time]; }
    restore(a) { [this.s, this.v] = a; this.done = !!a[2]; this.time = a[3]; this.pose(); }
  }

  class PlaneRival {
    constructor(race, o) {
      this.race = race;
      this.name = o.name || 'Ан-2';
      this.kind = 'plane';
      const pts = F.catmull(o.path, 10, false);
      this.pts = pts;
      this.cum = [0];
      for (let i = 1; i < pts.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      this.len = this.cum[this.cum.length - 1];
      const pace = race.diff ? race.diff.show : 1;
      this.s = 0; this.v = 0; this.vmax = (o.vmax || 48) * pace; this.accel = (o.accel || 2.2) * pace;
      this.alt = o.alt || 45;
      this.done = false; this.time = 0; this.prop = 0;
      this.pose();
    }
    progressFrac() { return this.s / this.len; }
    step(dt) {
      if (this.race.state !== 'race') { this.pose(); return; }
      if (!this.done) {
        this.v = Math.min(this.vmax, this.v + this.accel * dt);
        this.s += this.v * dt;
        if (this.s >= this.len) { this.s = this.len; this.done = true; this.time = this.race.time; }
      }
      this.prop += dt * 40;
      this.pose();
    }
    pose() {
      let i = 0;
      while (i + 1 < this.pts.length - 1 && this.cum[i + 1] < this.s) i++;
      const L = this.cum[i + 1] - this.cum[i] || 1;
      const t = F.clamp((this.s - this.cum[i]) / L, 0, 1);
      const a = this.pts[i], b = this.pts[i + 1];
      this.x = a[0] + (b[0] - a[0]) * t; this.z = a[1] + (b[1] - a[1]) * t;
      const climb = F.smooth(0, 250, this.s) * F.smooth(0, 250, this.len - this.s);
      this.y = 1.8 + this.alt * climb + Math.sin(this.s * 0.01) * 4 * climb;
      this.yaw = Math.atan2(b[0] - a[0], -(b[1] - a[1]));
      const c = this.pts[Math.min(this.pts.length - 1, i + 2)];
      const turn = F.wrap(Math.atan2(c[0] - b[0], -(c[1] - b[1])) - this.yaw);
      this.roll = F.clamp(-turn * 3, -0.6, 0.6);
    }
    snap() { return [this.s, this.v, this.done ? 1 : 0, this.time]; }
    restore(a) { [this.s, this.v] = a; this.done = !!a[2]; this.time = a[3]; this.pose(); }
  }

  const NAMES = ['Jānis_B', 'Kolya_ER2', 'Mārtiņš', 'Liene', 'Andris_BMW', 'Oksana_R', 'Dmitrijs', 'Raimonds', 'Ilze', 'Edgars_Turbo', 'Sergejs', 'Laura', 'Artūrs', 'Kristaps', 'Vika_Riga', 'Gatis', 'Valdis', 'Inese', 'Aleksandrs', 'Toms', 'Zane', 'Roberts'];
  F.RIVAL_NAMES = NAMES;

  class Race {
    constructor(game, ev, o = {}) {
      this.game = game;
      this.world = game.world;
      this.ev = ev;
      this.laps = ev.laps || 1;
      this.wet = !!o.wet;
      this.route = o.route || Route.fromVia(this.world, ev.via, !!ev.closed, ev.pref || null);
      const r = this.route;
      this.startS = r.closed ? 0 : Math.min(70, r.total * 0.1);
      this.finishS = r.closed ? r.total * this.laps : r.total - 25;
      this.length = this.finishS - this.startS;
      this.state = 'grid';
      this.count = 3.6;
      this.time = 0;
      this.diff = DIFF[o.difficulty !== undefined ? o.difficulty : 2];
      this.rivals = [];
      this.special = null;
      this.lastIdx = -1;
      this.pProg = 0; this.playerProg = 0; this.playerLat = 0; this.playerSpeed = 0;
      this.traffic = []; this.trafficHint = new Map();
      this.checkS = []; this.nextCheck = 0;
      for (let s = 300; s < this.length - 40; s += 300) this.checkS.push(this.startS + s);
      this.checkS.push(this.finishS);
      this.wrong = 0; this.off = 0;
      this.pos = 1;
      this.lapTimes = []; this.lapStart = 0; this.curLap = 0;
      this.finished = false;
      this.rng = F.rng(o.seed || 7);
      this.gridSlots = [];
      const nR = ev.rivalCar === 'train' || ev.rivalCar === 'plane' ? 0 : (ev.rivals || 7);
      const total = nR + 1;
      for (let k = 0; k < total; k++) {
        const row = Math.floor(k / 2), col = k % 2;
        const s = r.closed ? r.wrapS(this.startS - 10 - row * 9) : this.startS - 10 - row * 9;
        const p = r.point(s);
        const lane = (col ? 1 : -1) * Math.min(2.6, p.hw * 0.45);
        this.gridSlots.push({ s: r.closed ? s - (s > r.total / 2 ? r.total : 0) : s, d: lane });
      }
      const playerSlot = this.gridSlots[total - 1];
      this.playerSlot = playerSlot;
      if (o.rivalSpecs) {
        o.rivalSpecs.forEach((rs, k) => {
          const g = this.gridSlots[k];
          const nm = rs.name || NAMES[(k * 7 + (o.seed || 0)) % NAMES.length];
          this.rivals.push(new Rival(this, { name: nm, spec: rs.spec, paint1: rs.paint1, paint2: rs.paint2, livery: rs.livery, metal: rs.metal, dirt: rs.dirt, skill: rs.skill || this.diff, s: g.s, d: g.d, seed: k + 1 }));
        });
      }
      if (ev.rivalCar === 'train') this.special = new TrainRival(this, ev.train);
      if (ev.rivalCar === 'plane') this.special = new PlaneRival(this, ev.plane);
      this.snaps = [];
    }

    placePlayer(veh) {
      const g = this.playerSlot;
      const p = this.route.point(g.s);
      veh.place(p.x + -p.tz * g.d, p.z + p.tx * g.d, Math.atan2(p.tx, -p.tz), this.world);
      this.lastIdx = p.i;
    }

    rubber(ai) {
      const gap = ai.progress() - this.pProg;
      const k = this.diff.rb;
      if (gap > 60) return 1 - k * F.clamp((gap - 60) / 250, 0, 1);
      if (gap < -70) return 1 + k * 0.6 * F.clamp((-gap - 70) / 250, 0, 1);
      return 1;
    }

    step(dt, veh) {
      const r = this.route;
      if (this.state === 'grid') {
        this.count -= dt;
        veh.frozen = true;
        if (this.count <= 0.6) {
          this.state = 'race';
          veh.frozen = false;
          const optimal = veh.rpm > veh.spec.rpmT * 0.9 && veh.rpm < veh.spec.red * 0.8;
          if (optimal) { veh.launch = 1; veh.launchT = 1.6; this.game.emit({ t: 'launch', good: true }); }
          else if (veh.rpm >= veh.spec.red * 0.8) { veh.launch = -0.35; veh.launchT = 1.2; this.game.emit({ t: 'launch', good: false }); }
        }
      } else if (this.state === 'race') {
        this.time += dt;
      }
      const pr = r.project(veh.x, veh.z, this.lastIdx, 25);
      if (pr.d < 90) {
        let s = pr.s;
        if (r.closed) {
          const lapBase = this.curLap * r.total;
          let cand = lapBase + s;
          const prev = this.pProg;
          if (cand < prev - r.total / 2) cand += r.total;
          if (cand > prev + r.total / 2) cand -= r.total;
          s = cand;
        }
        if (this.state !== 'race' || Math.abs(s - this.pProg) < 60) {
          this.pProg = s;
          this.lastIdx = pr.i;
        }
        this.off = pr.d > pr.lat * 0 + r.hw[pr.i] + 25 ? this.off + dt : 0;
        this.playerLat = pr.lat;
      } else this.off += dt;
      if (r.closed) {
        const lap = Math.floor(this.pProg / r.total);
        if (lap > this.curLap && this.nextCheck >= this.checkS.findIndex(c => c > this.curLap * r.total + r.total - 1) && this.state === 'race') {
          this.lapTimes.push(this.time - this.lapStart);
          this.lapStart = this.time;
          this.curLap = lap;
          if (this.curLap < this.laps) this.game.emit({ t: 'lap', lap: this.curLap + 1 });
        } else if (lap > this.curLap) this.curLap = lap;
      }
      this.playerProg = this.pProg;
      this.playerSpeed = veh.speed;
      const p = r.point(this.pProg);
      const along = veh.vx * p.tx + veh.vz * p.tz;
      this.wrong = along < -4 && this.state === 'race' ? this.wrong + dt : Math.max(0, this.wrong - dt * 2);
      while (this.nextCheck < this.checkS.length && this.pProg >= this.checkS[this.nextCheck] - 2 && this.state === 'race') {
        this.nextCheck++;
        if (this.nextCheck < this.checkS.length) this.game.emit({ t: 'checkpoint', i: this.nextCheck });
      }
      this.trafficOnRoute();
      for (const ai of this.rivals) ai.step(dt, this.rivals, veh);
      if (this.special) this.special.step(dt);
      if (this.state === 'race' && this.game.traffic) for (const ai of this.rivals) if (!ai.done) this.game.traffic.collideRival(ai);
      if (this.state === 'race') {
        for (const ai of this.rivals) {
          if (!ai.done && ai.progress() >= this.finishS) { ai.done = true; ai.time = this.time; }
        }
        this.collide(veh);
      }
      this.pos = 1;
      for (const ai of this.rivals) if (ai.done ? (!this.finished || ai.time < this.finishTime) : ai.progress() > this.pProg) this.pos++;
      if (this.special) {
        const mine = (this.pProg - this.startS) / this.length;
        if (this.special.done || this.special.progressFrac() > mine) this.pos = 2;
      }
      if (this.state === 'race' && !this.finished && this.pProg >= this.finishS && this.nextCheck >= this.checkS.length) {
        this.finished = true;
        this.finishTime = this.time;
        this.state = 'done';
        this.game.emit({ t: 'finish', pos: this.pos, time: this.time });
      }
      this.snapT = (this.snapT || 0) + dt;
      if (this.snapT > 0.1 && this.state === 'race') {
        this.snapT = 0;
        this.snaps.push(this.snap(veh));
        if (this.snaps.length > 160) this.snaps.shift();
      }
    }

    progressFrac() { return F.clamp((this.pProg - this.startS) / this.length, 0, 1); }

    trafficOnRoute() {
      const r = this.route, list = this.game.traffic ? this.game.traffic.cars : [];
      this.traffic.length = 0;
      for (const c of list) {
        if (!this.rivals.some(a => Math.abs(a.x - c.x) < 80 && Math.abs(a.z - c.z) < 80)) continue;
        const q = r.project(c.x, c.z, this.trafficHint.has(c.uid) ? this.trafficHint.get(c.uid) : -1, 12);
        this.trafficHint.set(c.uid, q.i);
        if (q.d > r.hw[q.i] + 2) continue;
        const vx = c.state === 'hit' ? c.vx : c.tx * c.v, vz = c.state === 'hit' ? c.vz : c.tz * c.v;
        this.traffic.push({ s: q.s, d: q.lat, v: vx * r.tx[q.i] + vz * r.tz[q.i] });
      }
      if (this.trafficHint.size > list.length * 3 + 32) this.trafficHint.clear();
    }

    collide(veh) {
      const o = veh.obb();
      for (const ai of this.rivals) {
        if (ai.done) continue;
        if (Math.abs(ai.x - veh.x) > 8 || Math.abs(ai.z - veh.z) > 8) continue;
        if (Math.abs(ai.y - veh.y) > 2.5) continue;
        const b = ai.obb();
        const box = { x: b.x, z: b.z, hx: b.hl, hz: b.hw, c: b.fx, s: b.fz };
        const hit = F.Coll.obbObb(o, box);
        if (!hit) continue;
        veh.x += hit.nx * hit.d * 0.6; veh.z += hit.nz * hit.d * 0.6;
        const [avx, avz] = ai.velocity();
        const rvx = veh.vx - avx, rvz = veh.vz - avz;
        const vn = rvx * hit.nx + rvz * hit.nz;
        if (vn < 0) {
          const m1 = veh.spec.mass, m2 = ai.mass;
          const J = -(1.25 * vn) / (1 / m1 + 1 / m2);
          veh.vx += J * hit.nx / m1; veh.vz += J * hit.nz / m1;
          const rpx = hit.px - veh.x, rpz = hit.pz - veh.z;
          veh.r += ((-rpz * hit.nx + rpx * hit.nz) * J / veh.spec.Iz) * 0.4;
          ai.push(-J * hit.nx, -J * hit.nz);
          if (-vn > 1.5) this.game.emit({ t: 'carhit', impact: -vn, ai });
          if (this.game.carCrash) this.game.carCrash(ai, hit, -vn);
        }
      }
    }

    snap(veh) {
      return { v: veh.snap(), r: this.rivals.map(a => a.snap()), sp: this.special ? this.special.snap() : null, t: this.time, p: this.pProg, li: this.lastIdx, nc: this.nextCheck, cl: this.curLap, ls: this.lapStart, lt: this.lapTimes.slice() };
    }

    restore(sn, veh) {
      veh.restore(sn.v);
      this.rivals.forEach((a, i) => a.restore(sn.r[i]));
      if (this.special && sn.sp) this.special.restore(sn.sp);
      this.time = sn.t; this.pProg = sn.p; this.lastIdx = sn.li; this.nextCheck = sn.nc; this.curLap = sn.cl; this.lapStart = sn.ls; this.lapTimes = sn.lt.slice();
    }

    standings() {
      const rows = [{ name: 'Вы', player: true, prog: this.pProg, done: this.finished, time: this.finishTime || this.time, car: this.game.playerCarId && this.game.playerCarId() }];
      for (const a of this.rivals) rows.push({ name: a.name, prog: a.progress(), done: a.done, time: a.time, car: a.id, ai: a });
      if (this.special) rows.push({ name: this.special.name, prog: this.startS + this.special.progressFrac() * this.length, done: this.special.done, time: this.special.time, special: true });
      for (const rw of rows) {
        if (!rw.done) {
          const rem = Math.max(0, this.finishS - rw.prog);
          const avg = rw.ai ? Math.max(8, rw.ai.v * 0.9) : 25;
          rw.est = this.time + rem / avg;
        } else rw.est = rw.time;
      }
      rows.sort((a, b) => a.est - b.est);
      return rows;
    }
  }

  F.Route = Route;
  F.Race = Race;
  F.Rival = Rival;
  F.routeBetween = routeBetween;
})(globalThis.Forza = globalThis.Forza || {});
