(function (F) {
  'use strict';

  const W = F.World.prototype;
  const BLEND = 420;
  const CELL = 5;
  const RASTER = 25;
  const GAP = 25;
  const LAMPS = 900;
  const GROVE = 1150;
  const BRAKE = 8;
  const RACE_BRAKE = 30;
  const INSET = 8;
  const EASE = 40;
  const SEAM = 30;
  const ID0 = 100000;
  const ZONES = ['water', 'forest', 'meadow', 'dunes', 'pines', 'villas', 'blocks', 'houses', 'fields', 'works'];
  const URBAN = new Set(['blocks', 'houses', 'villas', 'works']);
  const BIOME = { forest: 4, meadow: 2, dunes: 1, pines: 4, villas: 4, blocks: 3, houses: 7, fields: 2, works: 6 };
  const GROVES = {
    forest: { step: 12, fill: 0.86, kinds: ['pine', 'pine', 'pine', 'spruce', 'spruce', 'birch', 'birch', 'oak'] },
    pines: { step: 11, fill: 0.9, kinds: ['pine', 'pine', 'pine', 'pine', 'birch'] },
    villas: { step: 15, fill: 0.72, kinds: ['pine', 'pine', 'pine', 'pine', 'birch', 'oak'] },
    blocks: { step: 24, fill: 0.42, kinds: ['birch', 'linden', 'linden', 'poplar', 'maple'] },
    houses: { step: 18, fill: 0.5, kinds: ['apple', 'apple', 'birch', 'linden', 'oak'] },
    meadow: { step: 40, fill: 0.25, kinds: ['birch', 'oak', 'spruce', 'birch'] },
    fields: { step: 70, fill: 0.14, kinds: ['birch', 'willow', 'oak'] },
    works: { step: 42, fill: 0.2, kinds: ['birch', 'poplar'] },
    dunes: { step: 30, fill: 0.12, kinds: ['pine'] }
  };
  const near = [];
  const HOMES = {
    blocks: { style: 'soviet', cell: 100, fill: 0.9, setback: [26, 40], gap: [18, 34], pad: 9 },
    houses: { style: 'wood', cell: 34, fill: 0.75, setback: [6, 10], gap: [7, 14], pad: 3 },
    villas: { style: 'villa', cell: 58, fill: 0.7, setback: [10, 15], gap: [14, 24], pad: 5 },
    works: { style: 'industry', cell: 90, fill: 0.7, setback: [14, 24], gap: [16, 30], pad: 7 }
  };

  function lineDist(pts, x, z) {
    let best = Infinity;
    for (let i = 0; i + 1 < pts.length; i++) {
      const ax = pts[i][0], az = pts[i][1], dx = pts[i + 1][0] - ax, dz = pts[i + 1][1] - az, l2 = dx * dx + dz * dz;
      let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = ax + dx * t - x, qz = az + dz * t - z, d = qx * qx + qz * qz;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }

  function boxOf(pts, pad) {
    const bb = F.polyBox(pts);
    return { x0: bb.x0 - pad, z0: bb.z0 - pad, x1: bb.x1 + pad, z1: bb.z1 + pad };
  }

  W.outside = function (x, z) {
    const b = this.b;
    return x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1;
  };

  W.edgeDist = function (x, z) {
    const b = this.b;
    return Math.hypot(x - F.clamp(x, b.x0, b.x1), z - F.clamp(z, b.z0, b.z1));
  };

  W.outCoast = function (x, z) {
    const o = this.out;
    if (z > o.coastZ + 600) return z - o.coastZ;
    const d = lineDist(o.coast, x, z);
    return F.inPoly(x, z, o.sea) ? -d : d;
  };

  W.outWater = function (x, z) {
    const o = this.out, R = o.raster;
    if (R) {
      const fx = (x - R.x0) / R.cell - 0.5, fz = (z - R.z0) / R.cell - 0.5, i = Math.floor(fx), j = Math.floor(fz);
      if (i >= 0 && j >= 0 && i < R.nx - 1 && j < R.nz - 1) {
        const tx = fx - i, tz = fz - j, k = j * R.nx + i, D = R.sd;
        const v = (D[k] * (1 - tx) + D[k + 1] * tx) * (1 - tz) + (D[k + R.nx] * (1 - tx) + D[k + R.nx + 1] * tx) * tz;
        if (v > 40 || v < -40) return v;
      }
    }
    let d = this.outCoast(x, z);
    for (const r of o.rivers) {
      if (x < r.bb.x0 || x > r.bb.x1 || z < r.bb.z0 || z > r.bb.z1) continue;
      const q = lineDist(r.pts, x, z) - r.hw;
      if (q < d) d = q;
    }
    return d;
  };

  W.outZone = function (x, z, sd) {
    const o = this.out, c = sd !== undefined && sd > 400 ? sd : this.outCoast(x, z);
    if (c < 95) return c < 36 ? 'dunes' : 'pines';
    for (const zn of o.zones) if (x >= zn.bb.x0 && x <= zn.bb.x1 && z >= zn.bb.z0 && z <= zn.bb.z1 && F.inPoly(x, z, zn.poly)) return zn.kind;
    return F.noise2(x / 380, z / 380, 331) > 0.62 ? 'meadow' : 'forest';
  };

  W.outKind = function (x, z) {
    const R = this.out.raster, i = Math.floor((x - R.x0) / R.cell), j = Math.floor((z - R.z0) / R.cell);
    if (i < 1 || j < 1 || i >= R.nx - 1 || j >= R.nz - 1) return null;
    const C = R.cells, k = j * R.nx + i;
    if (!C[k] || !C[k - 1] || !C[k + 1] || !C[k - R.nx] || !C[k + R.nx]) return null;
    return ZONES[C[k]];
  };

  W.outerH = function (x, z) {
    const b = this.b, cx = F.clamp(x, b.x0, b.x1), cz = F.clamp(z, b.z0, b.z1);
    const d = Math.hypot(x - cx, z - cz), base = this.terrainH(cx, cz), sd = this.outWater(x, z), t = F.smooth(0, BLEND, d);
    const shore = F.smooth(0, 160, sd);
    const target = sd < 0 ? Math.max(-6.1, F.WATER_Y - 0.5 + sd * 0.1) : 0.55 + shore * ((F.noise2(x / 520, z / 520, 311) - 0.5) * 5.5 + (F.noise2(x / 150, z / 150, 313) - 0.5) * 1.3);
    const h = base + (target - base) * t;
    const shoreH = sd < 0 ? Math.min(h, F.WATER_Y - 0.35 + Math.max(-0.4, sd * 0.05)) : Math.max(h, F.WATER_Y + 0.25 + Math.min(1, sd / 40) * 0.25);
    return h + (shoreH - h) * F.smooth(0, SEAM, d);
  };

  W.outTerrain = function (x, z) {
    let h = this.outerH(x, z);
    const o = this.out;
    if (!o.raster || !o.raster.road || !this.outNearRoad(x, z)) return h;
    near.length = 0;
    for (const sg of o.grid.query(x - 24, z - 24, x + 24, z + 24, near, F.stamp())) {
      const dx = sg.bx - sg.ax, dz = sg.bz - sg.az, l2 = dx * dx + dz * dz;
      let t = l2 > 0 ? ((x - sg.ax) * dx + (z - sg.az) * dz) / l2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const d = Math.hypot(sg.ax + dx * t - x, sg.az + dz * t - z), edge = sg.hw + sg.side + 0.5;
      if (d > edge + 12) continue;
      const y = sg.ay + (sg.by - sg.ay) * t - 0.08, out = Math.max(0, d - edge);
      if (h > y + 0.4 * out) h = y + 0.4 * out;
      if (h < y - 0.6 * out) h = y - 0.6 * out;
    }
    return h;
  };

  W.outOcc = function (x, z) {
    const o = this.out, ix = Math.floor((x - o.ox) / CELL), iz = Math.floor((z - o.oz) / CELL);
    if (ix < 0 || iz < 0 || ix >= o.onx || iz >= o.onz) return 3;
    return o.occ[iz * o.onx + ix];
  };

  W.outMark = function (x0, z0, x1, z1, test, v) {
    const o = this.out;
    const i0 = Math.max(0, Math.floor((x0 - o.ox) / CELL)), i1 = Math.min(o.onx - 1, Math.floor((x1 - o.ox) / CELL));
    const j0 = Math.max(0, Math.floor((z0 - o.oz) / CELL)), j1 = Math.min(o.onz - 1, Math.floor((z1 - o.oz) / CELL));
    let free = true;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = o.ox + (i + 0.5) * CELL, z = o.oz + (j + 0.5) * CELL;
      if (!test(x, z)) continue;
      const k = j * o.onx + i;
      if (v < 0) { if (o.occ[k]) { free = false; return free; } } else if (!o.occ[k] || v < o.occ[k]) o.occ[k] = v;
    }
    return free;
  };

  W.outSeg = function (pts, r, v) {
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], c = pts[i + 1];
      this.outMark(Math.min(a[0], c[0]) - r, Math.min(a[1], c[1]) - r, Math.max(a[0], c[0]) + r, Math.max(a[1], c[1]) + r, (x, z) => F.segDist(x, z, a[0], a[1], c[0], c[1]).d < r, v);
    }
  };

  W.outRect = function (x, z, tx, tz, hw, hd, v) {
    const ext = Math.abs(tx) * hw + Math.abs(tz) * hd, ezt = Math.abs(tz) * hw + Math.abs(tx) * hd;
    return this.outMark(x - ext, z - ezt, x + ext, z + ezt, (px, pz) => {
      const dx = px - x, dz = pz - z;
      return Math.abs(dx * tx + dz * tz) <= hw && Math.abs(-dx * tz + dz * tx) <= hd;
    }, v);
  };

  W.outRoadNear = function (x, z, except, pad) {
    for (const sg of this.out.grid.query(x - 30, z - 30, x + 30, z + 30, [], F.stamp())) {
      if (sg.e === except) continue;
      if (F.segDist(x, z, sg.ax, sg.az, sg.bx, sg.bz).d < sg.hw + pad) return true;
    }
    return false;
  };

  W.buildOutskirts = function () {
    const M = this.map.OUT, b = this.b, R = M.ring;
    const coast = M.coast.west.concat(this.map.SEA.filter(p => p[1] > -3600), M.coast.east);
    const o = this.out = {
      ring: R, limit: { x0: b.x0 + INSET, z0: b.z0 + INSET, x1: b.x1 - INSET, z1: b.z1 - INSET, brake: BRAKE, race: RACE_BRAKE },
      x0: b.x0 - R, z0: b.z0 - R, x1: b.x1 + R, z1: b.z1 + R,
      coast, coastZ: Math.max(...coast.map(p => p[1])), sea: coast.concat([[coast[coast.length - 1][0] + 400, b.z0 - R - 400], [coast[0][0] - 400, b.z0 - R - 400]]),
      rivers: M.rivers.map(r => ({ name: r.name, pts: r.line, hw: r.w / 2, bb: boxOf(r.line, r.w / 2 + 320) })),
      zones: M.zones.map(zn => ({ kind: zn.kind, poly: zn.poly, bb: F.polyBox(zn.poly) })),
      roads: [], exits: new Map(), grid: new F.Grid(40), buildings: [], trees: [], lamps: [], rail: null
    };
    o.ox = o.x0 - 100; o.oz = o.z0 - 100;
    o.onx = Math.ceil((o.x1 - o.x0 + 200) / CELL); o.onz = Math.ceil((o.z1 - o.z0 + 200) / CELL);
    o.occ = new Uint8Array(o.onx * o.onz);
    this.outMark(b.x0 - GAP, b.z0 - GAP, b.x1 + GAP, b.z1 + GAP, () => true, 3);
    const rng = F.rng(this.seed + 307);
    this.outRaster();
    this.outRoads();
    this.outSeamCap();
    this.outRail();
    this.outRoadMask();
    this.outHomes(rng);
    this.outGroves(rng);
    this.outLamps();
  };

  W.outRoads = function () {
    const o = this.out, M = this.map.OUT, used = new Set();
    const add = (def, nd, arm) => {
      const kind = def.kind || arm.e.kind, k = F.KINDS[kind];
      let ctrl = def.pts.map(p => [p[0], p[1]]);
      let y0 = null, walk = true;
      if (nd) {
        const e = arm.e, n = e.pts.length, at0 = arm.end === 0, p = at0 ? e.pts[0] : e.pts[n - 1], q = at0 ? e.pts[Math.min(3, n - 1)] : e.pts[Math.max(0, n - 4)];
        const dx = p[0] - q[0], dz = p[1] - q[1], l = Math.hypot(dx, dz) || 1;
        const tx = def.dir ? def.dir[0] : dx / l, tz = def.dir ? def.dir[1] : dz / l;
        ctrl = [[nd.x, nd.z], [nd.x + tx * 40, nd.z + tz * 40]].concat(ctrl);
        y0 = def.dir ? nd.y : at0 ? e.y[0] : e.y[n - 1];
        walk = !!(e.walks && e.walks[1] && e.walks[1].length && e.walks[-1] && e.walks[-1].length) && !def.dir;
      }
      const pts = F.resample(F.fillet(ctrl, k.r, false), 6), n = pts.length;
      const s = new Float32Array(n), y = new Float32Array(n);
      for (let i = 1; i < n; i++) s[i] = s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      for (let i = 0; i < n; i++) {
        const h = this.outerH(pts[i][0], pts[i][1]) + 0.12;
        y[i] = y0 === null ? h : y0 + (h - y0) * F.smooth(EASE, 200, s[i]);
      }
      const bb = F.polyBox(pts);
      const r = {
        id: ID0 + o.roads.length, outer: true, name: def.name || (arm ? arm.e.name : kind), kind, k, w: k.w, hw: k.w / 2, surf: k.surf, bridge: null, own: true,
        a: nd ? nd.id : -1, b: -1, pts, y, s, len: s[n - 1], x0: bb.x0, z0: bb.z0, x1: bb.x1, z1: bb.z1, walk, walks: null, side: 0, arm: arm || null
      };
      o.roads.push(r);
      if (nd) o.exits.set(nd.id, r);
      return r;
    };
    for (const def of M.roads) {
      let best = null, bd = 15;
      for (const nd of this.nodes) { const d = Math.hypot(nd.x - def.at[0], nd.z - def.at[1]); if (d < bd) { bd = d; best = nd; } }
      if (!best || used.has(best.id)) continue;
      used.add(best.id);
      const arm = best.arms.length === 1 ? best.arms[0] : best.arms.find(A => A.e.kind === def.kind) || best.arms[0];
      const dir = best.arms.length === 1 ? null : (() => { const p = def.pts[0], l = Math.hypot(p[0] - best.x, p[1] - best.z); return [(p[0] - best.x) / l, (p[1] - best.z) / l]; })();
      add(Object.assign({}, def, { dir }), best, arm);
    }
    const b = this.b;
    for (const nd of this.nodes) {
      if (used.has(nd.id) || !nd.arms || nd.arms.length !== 1 || this.outside(nd.x, nd.z)) continue;
      const A = nd.arms[0], e = A.e;
      if (!e.k.lanes) continue;
      const n = e.pts.length, p = A.end === 0 ? e.pts[0] : e.pts[n - 1], q = A.end === 0 ? e.pts[Math.min(3, n - 1)] : e.pts[Math.max(0, n - 4)];
      const dx = p[0] - q[0], dz = p[1] - q[1], l = Math.hypot(dx, dz) || 1;
      const sides = [[nd.x - b.x0, -1, 0], [b.x1 - nd.x, 1, 0], [nd.z - b.z0, 0, -1], [b.z1 - nd.z, 0, 1]].sort((u, v) => u[0] - v[0]);
      if (sides[0][0] > 30 || (dx * sides[0][1] + dz * sides[0][2]) / l < 0.7) continue;
      used.add(nd.id);
      add({ pts: [[nd.x + dx / l * 1600, nd.z + dz / l * 1600]] }, nd, A);
    }
    for (const def of M.streets) add(def, null, null);
    for (const r of o.roads) {
      this.outSeg(r.pts, r.hw + r.k.side + 2, 1);
      r.segs = [];
      for (let i = 0; i + 1 < r.pts.length; i++) {
        const a = r.pts[i], c = r.pts[i + 1], m = r.hw + r.k.side + 0.5;
        const sg = { e: r, i, ax: a[0], az: a[1], bx: c[0], bz: c[1], ay: r.y[i], by: r.y[i + 1], hw: r.hw, side: 0 };
        r.segs.push(sg);
        o.grid.add(sg, Math.min(a[0], c[0]) - m, Math.min(a[1], c[1]) - m, Math.max(a[0], c[0]) + m, Math.max(a[1], c[1]) + m);
      }
    }
    for (const r of o.roads) {
      const urban = s => {
        const p = this.edgePoint(r, s);
        return this.edgeDist(p.x, p.z) < 1250 && URBAN.has(this.outZone(p.x, p.z)) && !this.outRoadNear(p.x, p.z, r, r.k.side + 2.5);
      };
      const runs = [];
      if (r.k.side && (r.a < 0 || r.walk)) {
        let open = null;
        for (let s = 0; s <= r.len; s += 4) {
          const ok = s < 30 && r.a >= 0 ? true : urban(s);
          if (ok && open === null) open = s;
          if ((!ok || s + 4 > r.len) && open !== null) {
            const e1 = ok ? r.len : s - 2;
            if (e1 - open > 12) runs.push({ a: { sIn: open, sOut: open, cap: !(open === 0 && r.a >= 0) }, b: { sIn: e1, sOut: e1, cap: true } });
            open = null;
          }
        }
      }
      r.walks = { '-1': runs, '1': runs };
      r.side = runs.length ? r.k.side : 0;
      const inRun = s => runs.some(q => s >= q.a.sIn && s <= q.b.sIn);
      for (const sg of r.segs) {
        sg.side = inRun((r.s[sg.i] + r.s[sg.i + 1]) / 2) ? r.k.side : 0;
        const m = r.hw + sg.side + 0.5;
        if (sg.i || r.a < 0) this.segGrid.add(sg, Math.min(sg.ax, sg.bx) - m, Math.min(sg.az, sg.bz) - m, Math.max(sg.ax, sg.bx) + m, Math.max(sg.az, sg.bz) + m);
      }
    }
  };

  W.outSeamCap = function () {
    const H = this.h, b = this.b, nx = this.nx, nz = this.nz;
    for (const r of this.out.exits.values()) {
      for (const sg of r.segs) {
        if (this.edgeDist(sg.ax, sg.az) > 24) continue;
        const edge = sg.hw + sg.side + 0.5, reach = edge + 12;
        const ix0 = Math.max(0, Math.floor((Math.min(sg.ax, sg.bx) - reach - b.x0) / 10)), ix1 = Math.min(nx - 1, Math.ceil((Math.max(sg.ax, sg.bx) + reach - b.x0) / 10));
        const iz0 = Math.max(0, Math.floor((Math.min(sg.az, sg.bz) - reach - b.z0) / 10)), iz1 = Math.min(nz - 1, Math.ceil((Math.max(sg.az, sg.bz) + reach - b.z0) / 10));
        for (let iz = iz0; iz <= iz1; iz++) {
          for (let ix = ix0; ix <= ix1; ix++) {
            const q = F.segDist(b.x0 + ix * 10, b.z0 + iz * 10, sg.ax, sg.az, sg.bx, sg.bz);
            if (q.d > reach) continue;
            const cap = sg.ay + (sg.by - sg.ay) * q.t - 0.08 + 0.4 * Math.max(0, q.d - edge), j = iz * nx + ix;
            if (H[j] > cap) H[j] = cap;
          }
        }
      }
    }
  };

  W.outRail = function () {
    const o = this.out, rail = this.rail, def = this.map.OUT.rail;
    if (!rail || !def) return;
    const last = rail.pts[rail.pts.length - 1];
    const pts = F.resample(F.fillet([[last[0], last[1]]].concat(def.slice(1)), 400, false), 6), n = pts.length;
    const s = new Float32Array(n), y = new Float32Array(n), y0 = rail.y[rail.y.length - 1];
    for (let i = 1; i < n; i++) s[i] = s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    for (let i = 0; i < n; i++) y[i] = y0 + (this.outerH(pts[i][0], pts[i][1]) + 0.6 - y0) * F.smooth(10, 160, s[i]);
    o.rail = { pts, y, s, len: s[n - 1], s0: rail.s[rail.s.length - 1] };
    this.outSeg(pts, 7, 4);
    for (let i = 0; i + 1 < n; i++) {
      const a = pts[i], c = pts[i + 1];
      o.grid.add({ e: null, rail: true, i, ax: a[0], az: a[1], bx: c[0], bz: c[1], ay: y[i], by: y[i + 1], hw: 2.7, side: 0 }, Math.min(a[0], c[0]) - 3.2, Math.min(a[1], c[1]) - 3.2, Math.max(a[0], c[0]) + 3.2, Math.max(a[1], c[1]) + 3.2);
    }
  };

  W.outRoadMask = function () {
    const o = this.out, R = o.raster, mask = R.road = new Uint8Array(R.nx * R.nz), pad = 40;
    for (const arr of o.grid.map.values()) {
      for (const sg of arr) {
        const i0 = Math.max(0, Math.floor((Math.min(sg.ax, sg.bx) - pad - R.x0) / R.cell)), i1 = Math.min(R.nx - 1, Math.floor((Math.max(sg.ax, sg.bx) + pad - R.x0) / R.cell));
        const j0 = Math.max(0, Math.floor((Math.min(sg.az, sg.bz) - pad - R.z0) / R.cell)), j1 = Math.min(R.nz - 1, Math.floor((Math.max(sg.az, sg.bz) + pad - R.z0) / R.cell));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) mask[j * R.nx + i] = 1;
      }
    }
  };

  W.outNearRoad = function (x, z) {
    const R = this.out.raster, i = Math.floor((x - R.x0) / R.cell), j = Math.floor((z - R.z0) / R.cell);
    return i < 0 || j < 0 || i >= R.nx || j >= R.nz || R.road[j * R.nx + i] === 1;
  };

  W.outFits = function (x, z, tx, tz, hw, hd, pad) {
    for (const [u, v] of [[0, 0], [-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const px = x + tx * u * hw - tz * v * hd, pz = z + tz * u * hw + tx * v * hd;
      if (this.edgeDist(px, pz) < GAP + pad || this.outWater(px, pz) < 10) return false;
    }
    return this.outRect(x, z, tx, tz, hw + pad, hd + pad, -1);
  };

  W.outHome = function (zone, x, z, tx, tz, w, dp, rng, ty, side) {
    const H = HOMES[zone], st = F.STYLES[H.style];
    if (!this.outFits(x, z, tx, tz, w / 2, dp / 2, H.pad)) return null;
    const fl = ty ? rng.int(ty.floors[0], ty.floors[1]) : rng.int(st.floors[0], st.floors[1]);
    const hw = w / 2, hd = dp / 2, nx = -tz, nz = tx;
    const P = (a, c) => [x + tx * a + nx * c, z + tz * a + nz * c];
    const poly = [P(-hw, -hd), P(hw, -hd), P(hw, hd), P(-hw, hd)];
    let y = Infinity;
    for (const p of poly.concat([[x, z]])) y = Math.min(y, this.outTerrain(p[0], p[1]));
    const bd = {
      x, z, tx, tz, w, d: dp, floors: fl, h: fl * st.floorH + (st.roof === 'flat' ? 1 : 0), style: H.style,
      fac: ty ? st.fac[ty.fac] || st.fac[0] : rng.pick(st.fac), roof: st.roof, col: rng.pick(st.cols), front: side || 1, y: y - 0.3,
      poly, faces: ['s', 's', 's', 's'], id: ID0 + this.out.buildings.length, seed: ID0 * 3 + this.out.buildings.length * 7919, outer: true
    };
    if (zone === 'villas' && side) this.resortVilla(bd, { rx: nx, rz: nz }, side);
    this.outRect(x, z, tx, tz, hw + H.pad, hd + H.pad, 2);
    this.out.buildings.push(bd);
    return bd;
  };

  W.outHomes = function (rng) {
    const o = this.out;
    const pickType = (zone, kind) => {
      const st = F.STYLES[HOMES[zone].style];
      if (!st.types) return null;
      if (zone === 'blocks' && (kind === 'str' || kind === 'lane')) return rng() < 0.6 ? st.types[2] : rng.pick(st.types);
      return rng.pick(st.types);
    };
    const size = (zone, ty) => {
      const st = F.STYLES[HOMES[zone].style];
      return ty ? [rng.range(ty.w[0], ty.w[1]), rng.range(ty.d[0], ty.d[1])] : [rng.range(st.width[0], st.width[1]), rng.range(st.depth[0], st.depth[1])];
    };
    for (const r of o.roads) {
      for (const side of [-1, 1]) {
        let s = 26 + rng() * 20;
        while (s < r.len - 20) {
          const p = this.edgePoint(r, s);
          if (this.edgeDist(p.x, p.z) > 1300) break;
          const zone = this.outZone(p.x + p.rx * side * 36, p.z + p.rz * side * 36);
          const H = HOMES[zone];
          if (!H || rng() > H.fill) { s += H ? 18 : 30; continue; }
          const ty = pickType(zone, r.kind), [w, dp] = size(zone, ty), sb = rng.range(H.setback[0], H.setback[1]);
          const q = this.edgePoint(r, s + w / 2), off = r.hw + r.side + sb + dp / 2;
          const x = q.x + q.rx * off * side, z = q.z + q.rz * off * side;
          if (this.outZone(x, z) === zone && this.outHome(zone, x, z, q.tx, q.tz, w, dp, rng, ty, side)) s += w + rng.range(H.gap[0], H.gap[1]);
          else s += 7;
        }
      }
    }
    for (const zn of o.zones) {
      const H = HOMES[zn.kind];
      if (!H) continue;
      for (let z = zn.bb.z0; z < zn.bb.z1; z += H.cell) {
        for (let x = zn.bb.x0; x < zn.bb.x1; x += H.cell) {
          const px = x + rng() * H.cell, pz = z + rng() * H.cell;
          if (rng() > H.fill || !F.inPoly(px, pz, zn.poly) || this.edgeDist(px, pz) > 1300 || this.outZone(px, pz) !== zn.kind) continue;
          let tx = 1, tz = 0, best = 160;
          for (const sg of o.grid.query(px - 160, pz - 160, px + 160, pz + 160, [], F.stamp())) {
            const d = F.segDist(px, pz, sg.ax, sg.az, sg.bx, sg.bz).d;
            if (d < best) { best = d; const l = Math.hypot(sg.bx - sg.ax, sg.bz - sg.az) || 1; tx = (sg.bx - sg.ax) / l; tz = (sg.bz - sg.az) / l; }
          }
          if (zn.kind === 'blocks' && rng() < 0.4) { const t = tx; tx = -tz; tz = t; }
          const ty = pickType(zn.kind, 'ave'), [w, dp] = size(zn.kind, ty);
          this.outHome(zn.kind, px, pz, tx, tz, w, dp, rng, ty, 0);
        }
      }
    }
  };

  W.outGroves = function (rng) {
    const o = this.out, b = this.b, step = 12;
    const put = (x, z, kind, s, street) => {
      if (this.outOcc(x, z) || (!this.outKind(x, z) && this.outWater(x, z) < 3) || (!street && this.outRoadNear(x, z, null, 4.5))) return false;
      o.trees.push({ x, z, y: this.outTerrain(x, z), kind, s, street: !!street, outer: true });
      return true;
    };
    for (const r of o.roads) {
      if (!r.side) continue;
      for (const side of [-1, 1]) {
        for (let s = 18 + (r.id % 5) * 3; s < r.len - 10; s += 15) {
          if (!r.walks[1].some(q => s > q.a.sIn + 6 && s < q.b.sIn - 6)) continue;
          const p = this.edgePoint(r, s), off = r.hw + r.side + 2.6;
          const x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
          if (this.edgeDist(x, z) < 12 || this.outRoadNear(x, z, r, 3)) continue;
          put(x, z, F.hash2(Math.round(x), Math.round(z), 7) < 0.7 ? 'linden' : 'maple', 0.9 + F.hash2(Math.round(x), Math.round(z), 9) * 0.25, true);
        }
      }
    }
    for (let z = o.z0; z < o.z1; z += step) {
      for (let x = o.x0; x < o.x1; x += step) {
        if (x > b.x0 - 8 && x < b.x1 + 8 && z > b.z0 - 8 && z < b.z1 + 8) continue;
        const d = this.edgeDist(x, z);
        if (d > GROVE) continue;
        let zone = this.outKind(x, z);
        if (!zone) {
          const sd = this.outWater(x, z);
          if (sd < 3) continue;
          zone = this.outZone(x, z, sd);
        }
        const G = GROVES[zone];
        if (!G || F.hash2(Math.round(x), Math.round(z), 401) > (step * step) / (G.step * G.step)) continue;
        const thin = d > 500 ? 0.6 : 1;
        if (rng() > G.fill * thin * (0.75 + 0.5 * F.noise2(x / 90, z / 90, 403))) continue;
        const px = x + (rng() - 0.5) * step * 0.9, pz = z + (rng() - 0.5) * step * 0.9;
        if (this.edgeDist(px, pz) < 8) continue;
        put(px, pz, G.kinds[Math.floor(rng() * G.kinds.length)], 0.8 + rng() * 0.45, false);
      }
    }
  };

  W.outLamps = function () {
    const o = this.out;
    for (const r of o.roads) {
      if (!r.k.lamps || !r.side) continue;
      const off = r.hw + Math.max(0.6, r.side - 0.5);
      let side = r.id % 2 ? 1 : -1;
      for (let s = 16; s < r.len - 10; s += r.k.lamps) {
        const p = this.edgePoint(r, s);
        if (this.edgeDist(p.x, p.z) > LAMPS) break;
        if (r.walks[1].some(q => s > q.a.sIn + 3 && s < q.b.sIn - 3)) {
          const x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
          if (!this.outRoadNear(x, z, r, 1.5)) o.lamps.push({ type: 'lamp', x, z, y: p.y, yaw: Math.atan2(p.tx, -p.tz) + (side > 0 ? -Math.PI / 2 : Math.PI / 2), outer: true });
        }
        side = -side;
      }
    }
  };

  W.outCover = function (x, z) {
    const CK = F.FLORA.CK, sd = this.outWater(x, z), occ = this.outOcc(x, z);
    if (sd < 1.5 || occ === 2 || occ === 4) return 0;
    const g = this.roadGap(x, z, 12);
    if (g < 0.35) return 0;
    const zone = this.outZone(x, z, sd), n1 = F.noise2(x / 9, z / 9, 71), n2 = F.noise2(x / 27, z / 27, 72);
    if (sd < 7 && zone !== 'dunes') return n1 > 0.3 ? CK.reed * 16 + 13 : CK.tall * 16 + 8;
    if (zone === 'dunes') return this.outCoast(x, z) > 15 && n1 > 0.32 ? CK.dune * 16 + 9 : 0;
    if (zone === 'forest' || zone === 'pines' || zone === 'villas') return n1 > 0.45 ? CK.berry * 16 + 9 : n2 > 0.7 ? CK.fern * 16 + 8 : CK.grass * 16 + 4;
    if (zone === 'works') return n1 > 0.6 ? CK.nettle * 16 + 9 : CK.dry * 16 + 6;
    if (zone === 'blocks') return n1 > 0.66 ? CK.yellow * 16 + 8 : n2 > 0.78 ? CK.daisy * 16 + 7 : CK.lawn * 16 + 7;
    if (zone === 'houses') return n1 > 0.7 ? CK.daisy * 16 + 8 : CK.grass * 16 + 7;
    if (g < 2.6) return CK.tall * 16 + 10;
    return n1 > 0.64 ? CK.daisy * 16 + 9 : n1 < 0.16 ? CK.yellow * 16 + 8 : CK.tall * 16 + 9;
  };

  W.outRaster = function () {
    const o = this.out;
    if (o.raster) return o.raster;
    const nx = Math.ceil((o.x1 - o.x0) / RASTER), nz = Math.ceil((o.z1 - o.z0) / RASTER), cells = new Uint8Array(nx * nz), sd = new Float32Array(nx * nz).fill(NaN);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = o.x0 + (i + 0.5) * RASTER, z = o.z0 + (j + 0.5) * RASTER;
      if (!this.outside(x, z)) continue;
      const d = sd[j * nx + i] = this.outWater(x, z);
      cells[j * nx + i] = d < 0 ? 0 : ZONES.indexOf(this.outZone(x, z, d));
    }
    o.raster = { x0: o.x0, z0: o.z0, cell: RASTER, nx, nz, cells, sd };
    return o.raster;
  };

  F.OUT = { BIOME, ZONES };
})(globalThis.Forza = globalThis.Forza || {});
