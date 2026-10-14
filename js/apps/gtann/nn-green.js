(function (N) {
  'use strict';

  const GT = N.GT;
  const H = (x, z, s) => N.hash2(Math.round(x * 10), Math.round(z * 10), s);
  const SOFT = [GT.GRASS, GT.FOREST, GT.FIELD];
  const LU_ORDER = 'Rlanvdhxzgpbeforskmqcjiytw';

  N.BUSHES = {
    lilac: { r: 1.25, h: 2.7 },
    jasmine: { r: 1.0, h: 2.2 },
    acacia: { r: 0.95, h: 2.5 },
    rosehip: { r: 0.85, h: 1.7 },
    spiraea: { r: 0.75, h: 1.25 },
    hazel: { r: 1.5, h: 3.4 },
    willowbush: { r: 1.5, h: 3.0 },
    hedge: { r: 0.5, h: 1.0 }
  };

  N.TREE_R = { birch: 0.17, linden: 0.26, poplar: 0.3, pollard: 0.38, pine: 0.24, spruce: 0.22, apple: 0.15, maple: 0.25, willow: 0.34, rowan: 0.13, ashmaple: 0.2 };

  N.GREEN = { drag: 0.55, hedgeDrag: 0.9, walk: 0.62, hideR: 6, hideSpeed: 3.2, rustle: 0.45 };

  const GUARD_R = {
    playground: 8, fountain: 9, monument: 5, kiosk: 3.2, busstop: 4, tent: 3.5, flowerbed: 3, ferris: 22, carousel: 9, goal: 4, pitchlines: 30,
    billboard: 5, metro: 6, globelamp: 1.4, lamp: 1, bench: 1.4, urn: 0.9, bin: 1.3, binpad: 2.2, crate: 1, barrel: 1, sign: 0.9, trafficlight: 1,
    phone: 1.3, slabs: 4.5, wreck: 4, canopy: 3, canopy2: 3, flag: 1.2, porch: 5, gate: 4, parkgate: 12, gazportal: 16, mosaicstand: 4, crane: 10,
    trailer: 6, boat: 10, barge: 14, pier: 10, gangway: 6, debarkader: 18, floodlight: 3, lampmast: 3, chimney: 6, gaipost: 4, ramp: 6, podezd: 2.2,
    ferrisbase: 12, tir: 7, shawarma: 5, cafetable: 1.8, autodrom: 13, swings: 10.5, waltz: 8.5, dancefloor: 13, pkoarch: 7, attrgate: 5, parkstatue: 2.5, posterstand: 2, infoboard: 2
  };

  const fillCells = (poly, L, code) => {
    const b = N.polyBounds(poly), n = poly.length, xs = [];
    const iz0 = Math.max(0, Math.floor((b.z0 - L.z0) / L.cs)), iz1 = Math.min(L.d - 1, Math.floor((b.z1 - L.z0) / L.cs));
    for (let iz = iz0; iz <= iz1; iz++) {
      const z = L.z0 + (iz + 0.5) * L.cs;
      xs.length = 0;
      for (let i = 0; i < n; i += 2) {
        const j = (i + 2) % n, az = poly[i + 1], bz = poly[j + 1];
        if ((az > z) !== (bz > z)) xs.push(poly[i] + (z - az) / (bz - az) * (poly[j] - poly[i]));
      }
      xs.sort((a, c) => a - c);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const ix0 = Math.max(0, Math.ceil((xs[k] - L.x0) / L.cs - 0.5)), ix1 = Math.min(L.w - 1, Math.floor((xs[k + 1] - L.x0) / L.cs - 0.5));
        for (let ix = ix0; ix <= ix1; ix++) L.lu[iz * L.w + ix] = code;
      }
    }
  };

  Object.assign(N.City.prototype, {
    wilds() {
      this.bushes = [];
      this.greenSpots = {};
      this.greenCount = {};
      this.landUse();
      this.guards();
      this.pollards();
      this.palisades();
      this.yardGreen();
      this.hedges();
      this.parkFloor();
      this.waterside();
      this.wasteland();
      this.bushHash = new N.SpatialHash(16);
      for (const b of this.bushes) {
        b.x0 = b.x - b.r; b.x1 = b.x + b.r; b.z0 = b.z - b.r; b.z1 = b.z + b.r;
        this.bushHash.insert(b);
      }
      this.guardHash = null;
    },

    landUse() {
      const cs = 4, x0 = Math.floor(this.PX0 - 80), z0 = Math.floor(this.PZ0 - 80);
      const L = { x0, z0, cs, w: Math.ceil((this.PX1 + 80 - x0) / cs), d: Math.ceil((this.PZ1 + 80 - z0) / cs) };
      L.lu = new Uint8Array(L.w * L.d);
      const land = this.land.slice().sort((p, q) => LU_ORDER.indexOf(p.k) - LU_ORDER.indexOf(q.k) || q.area - p.area);
      for (const l of land) {
        const code = LU_ORDER.indexOf(l.k) + 1;
        if (code > 0) fillCells(l.poly, L, code);
      }
      this.LU = L;
    },

    luAt(x, z) {
      const L = this.LU;
      if (!L) return '';
      const ix = Math.floor((x - L.x0) / L.cs), iz = Math.floor((z - L.z0) / L.cs);
      if (ix < 0 || iz < 0 || ix >= L.w || iz >= L.d) return '';
      const c = L.lu[iz * L.w + ix];
      return c ? LU_ORDER[c - 1] : '';
    },

    guards() {
      const g = new N.SpatialHash(16);
      const circ = (x, z, r) => g.insert({ x0: x - r, z0: z - r, x1: x + r, z1: z + r, cx: x, cz: z, r });
      const seg = (ax, az, bx, bz, w, walk) => g.insert({ x0: Math.min(ax, bx) - w, z0: Math.min(az, bz) - w, x1: Math.max(ax, bx) + w, z1: Math.max(az, bz) + w, ax, az, bx, bz, w, walk: walk || 0 });
      for (const id in this.places) { const p = this.places[id]; if (p && isFinite(p.x) && isFinite(p.z)) circ(p.x, p.z, 7); }
      for (const j of this.jumps) circ(j.x, j.z, 16);
      for (const r of this.ramps) if (isFinite(r.x0)) circ((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, Math.hypot(r.x1 - r.x0, r.z1 - r.z0) / 2 + 3);
      for (const s of this.stashes) circ(s.x, s.z, 3);
      for (const k of this.pickups) circ(k.x, k.z, 3);
      for (const p of this.parking) circ(p.x, p.z, 2.8);
      for (const q of this.doorPaths || []) seg(q.ax, q.az, q.bx, q.bz, q.w / 2 + 0.9);
      for (const f of this.foot) for (let i = 2; i < f.pts.length; i += 2) seg(f.pts[i - 2], f.pts[i - 1], f.pts[i], f.pts[i + 1], 1.3);
      for (const q of this.surf) for (let i = 2; i < q.pts.length; i += 2) seg(q.pts[i - 2], q.pts[i - 1], q.pts[i], q.pts[i + 1], (q.w || 3) / 2 + 0.4, 1);
      const W = this.walk;
      for (const e of W.edges) { const A = W.nodes[e.a], B = W.nodes[e.b]; if (A && B) seg(A.x, A.z, B.x, B.z, 1.1, e.cross ? 2 : 1); }
      for (const p of this.props) { const r = GUARD_R[p.type]; if (r) circ(p.x, p.z, p.type === 'fountain' && p.r ? Math.max(r, (p.l ? p.l / 2 : p.r) + 2.5) : p.w ? Math.max(r, p.w / 2 + 1) : r); }
      for (const q of this.plazas || []) { const b = N.polyBounds(q.poly); g.insert({ x0: b.x0 - 1, z0: b.z0 - 1, x1: b.x1 + 1, z1: b.z1 + 1, poly: q.poly }); }
      this.guardHash = g;
    },

    guarded(x, z, r, along) {
      return this.guardHash.query(x - r - 2, z - r - 2, x + r + 2, z + r + 2, it => {
        if (it.poly) return N.pointInPoly(it.poly, x, z) || !!N.circlePoly(x, z, r, it.poly) || undefined;
        if (it.ax !== undefined) {
          if (along && it.walk === 1) {
            const dx = it.bx - it.ax, dz = it.bz - it.az, L = Math.hypot(dx, dz) || 1;
            if (Math.abs((dx * along[0] + dz * along[1]) / L) > 0.8) return;
          }
          const [d2] = N.segDist2(x, z, it.ax, it.az, it.bx, it.bz);
          return d2 < (it.w + r) * (it.w + r) || undefined;
        }
        return (x - it.cx) * (x - it.cx) + (z - it.cz) * (z - it.cz) < (it.r + r) * (it.r + r) || undefined;
      });
    },

    greenOk(x, z, r, along, wet) {
      if (!this.inPlay(x, z)) return false;
      const okT = t => SOFT.includes(t) || (wet && (t === GT.SAND || t === GT.WATER));
      if (!okT(this.ground(x, z)) || !okT(this.ground(x + r, z)) || !okT(this.ground(x - r, z)) || !okT(this.ground(x, z + r)) || !okT(this.ground(x, z - r))) return false;
      if (this.surfaceAt(x, z) !== 3) return false;
      if (!this.freeAt(x, z, r * 0.7)) return false;
      if (!this.clearAt(x, z, r * 0.75)) return false;
      return !this.guarded(x, z, r, along);
    },

    tally(k) { this.greenCount[k] = (this.greenCount[k] || 0) + 1; },

    spot(kind, x, z, tx, tz) {
      const c = this.places.hotel_door || this.places.hotel_spawn || { x: 0, z: 0 }, d = Math.hypot(tx - c.x, tz - c.z), o = this.greenSpots[kind];
      if (!o || d < o.d) this.greenSpots[kind] = { x, z, tx, tz, d };
    },

    plantBush(kind, x, z, s, along) {
      const B = N.BUSHES[kind], sc = s || 0.8 + H(x, z, 41) * 0.4, r = B.r * sc;
      if (!this.greenOk(x, z, r, along, kind === 'willowbush')) return null;
      const p = this.prop('bush', x, z, H(x, z, 42) * 6.28, { kind, s: sc });
      this.bushes.push({ x, z, r: r * 0.9, h: B.h * sc, kind, p });
      this.claim(x - r * 0.75, z - r * 0.75, x + r * 0.75, z + r * 0.75);
      this.tally(kind);
      return p;
    },

    plantTree(kind, x, z, s) {
      const sc = s || 0.8 + H(x, z, 43) * 0.4, r = Math.max(0.12, N.TREE_R[kind] * sc);
      if (!this.greenOk(x, z, 1.1)) return null;
      const p = this.prop('tree', x, z, H(x, z, 9) * 6.28, { kind, s: sc });
      this.circle(x, z, r, 6, 'tree');
      this.claim(x - 0.7, z - 0.7, x + 0.7, z + 0.7);
      this.treeCount = (this.treeCount || 0) + 1;
      this.tally(kind);
      return p;
    },

    decor(type, x, z, r, o, solid, wet, along) {
      if (!this.greenOk(x, z, r, along, wet)) return null;
      const p = this.prop(type, x, z, o && o.rot !== undefined ? o.rot : H(x, z, 44) * 6.28, o);
      if (solid) this.circle(x, z, solid.r, solid.h, solid.kind);
      this.claim(x - r, z - r, x + r, z + r);
      this.tally(type);
      return p;
    },

    boulder(x, z, s, paint, wet, along) {
      const r = 0.55 * s;
      return this.decor('boulder', x, z, r + 0.15, { kind: Math.floor(H(x, z, 45) * 8), s, paint: paint ? 1 : 0 }, { r: r * 0.9, h: 0.72 * s, kind: 'rock' }, wet, along);
    },

    pollards() {
      for (const p of this.props) {
        if (p.type !== 'tree' || p.kind !== 'poplar' || H(p.x, p.z, 51) > 0.42) continue;
        if (this.nearestEdge(p.x, p.z, e => !e.plant && (e.main || e.rank >= 3), 9)) p.kind = 'pollard';
      }
    },

    palisades() {
      const doors = new Map();
      for (const p of this.props) if (p.type === 'podezd' && p.b !== undefined) { if (!doors.has(p.b)) doors.set(p.b, []); doors.get(p.b).push(p); }
      for (const b of this.buildings) {
        if (b.removed || b.lm || !b.res || b.h < 6 || !b.poly || !this.inPlay(b.cx, b.cz)) continue;
        const p = b.poly, n = p.length, garden = H(b.cx, b.cz, 61) < 0.62, ds = doors.get(b.id) || [];
        for (let i = 0; i < n; i += 2) {
          const j = (i + 2) % n, ax = p[i], az = p[i + 1], bx = p[j], bz = p[j + 1], L = Math.hypot(bx - ax, bz - az);
          if (L < 12) continue;
          const ux = (bx - ax) / L, uz = (bz - az) / L;
          let nx = uz, nz = -ux;
          if (N.pointInPoly(p, (ax + bx) / 2 + nx * 0.6, (az + bz) / 2 + nz * 0.6)) { nx = -nx; nz = -nz; }
          const on = ds.filter(d => Math.abs((d.x - ax) * nx + (d.z - az) * nz) < 0.8).map(d => (d.x - ax) * ux + (d.z - az) * uz).filter(s => s > -1 && s < L + 1);
          const w = { b, ax, az, ux, uz, nx, nz, L };
          if (on.length) this.entranceGreen(w, on.sort((a, c) => a - c));
          else if (garden) this.frontGarden(w);
        }
      }
    },

    frontGarden(w) {
      const PAL = ['lilac', 'lilac', 'lilac', 'jasmine', 'jasmine', 'acacia', 'rosehip', 'spiraea'];
      const at = (s, off) => [w.ax + w.ux * s + w.nx * off, w.az + w.uz * s + w.nz * off];
      const kind = PAL[Math.floor(H(w.ax, w.az, 62) * PAL.length)];
      let s = 2 + H(w.ax, w.az, 63) * 2;
      while (s < w.L - 2) {
        const [x, z] = at(s, 1.5 + H(w.ax + s, w.az, 64) * 1.3);
        const k = H(x, z, 65);
        let got = null;
        if (k < 0.08) got = this.plantTree(H(x, z, 66) < 0.6 ? 'rowan' : 'apple', x + w.nx * 0.9, z + w.nz * 0.9, 0.65 + H(x, z, 67) * 0.3);
        else if (k < 0.15) got = this.decor('tirebed', x, z, 0.55, { kind: Math.floor(H(x, z, 68) * 4), n: H(x, z, 69) < 0.4 ? 2 : 1 });
        else if (k < 0.85) got = this.plantBush(H(x, z, 70) < 0.7 ? kind : PAL[Math.floor(H(x, z, 71) * PAL.length)], x, z);
        if (got && got.type === 'bush') this.spot('yard', x + w.nx * 7 + w.ux * 3, z + w.nz * 7 + w.uz * 3, x, z);
        if (H(x, z, 72) < 0.25) { const q = at(s + 1.2, 0.75); this.decor('weeds', q[0], q[1], 0.4, { kind: 3, s: 0.8 + H(x, z, 73) * 0.4 }); }
        s += 2.3 + H(x, z, 74) * 1.7;
      }
    },

    entranceGreen(w, ds) {
      const at = (s, off) => [w.ax + w.ux * s + w.nx * off, w.az + w.uz * s + w.nz * off];
      const stops = [-3.2 + 1.2].concat(ds, [w.L + 2]);
      for (let k = 0; k + 1 < stops.length; k++) {
        const a = stops[k] + 3.2, b = stops[k + 1] - 3.2;
        if (b - a < 2.5) continue;
        const n = b - a > 8 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const s = a + (b - a) * (i + 1) / (n + 1), [x, z] = at(s, 1.4 + H(w.ax + s, w.az, 75) * 0.6);
          if (H(x, z, 76) < 0.6) this.plantBush(['lilac', 'jasmine', 'spiraea', 'lilac'][Math.floor(H(x, z, 77) * 4)], x, z);
        }
      }
      for (const d of ds) {
        const side = H(w.ax + d, w.az, 78) < 0.5 ? 1 : -1, h = H(w.ax + d, w.az, 79);
        if (h < 0.3) { const [x, z] = at(d + side * 2.7, 2.4); this.decor('tirebed', x, z, 0.55, { kind: Math.floor(h * 13) % 4, n: h < 0.12 ? 2 : 1 }); }
        if (h > 0.94) { const [x, z] = at(d - side * 2.9, 2.2); if (this.decor('swan', x, z, 0.6, { rot: Math.atan2(w.uz, w.ux) + (side > 0 ? 0 : Math.PI), tone: Math.floor(h * 100) % 3 })) this.spot('swan', x + w.nx * 4.5 + w.ux * 1.5, z + w.nz * 4.5 + w.uz * 1.5, x, z); }
      }
    },

    yardGreen() {
      const rng = N.rng(this.seed + 301);
      for (const l of this.land) {
        if (!'Rhdx'.includes(l.k)) continue;
        const b = l.box;
        if (b.x1 < this.PX0 || b.x0 > this.PX1 || b.z1 < this.PZ0 || b.z0 > this.PZ1) continue;
        const step = 30;
        for (let x = b.x0 + rng() * step; x < b.x1; x += step) for (let z = b.z0 + rng() * step; z < b.z1; z += step) {
          const px = x + (rng() - 0.5) * step * 0.8, pz = z + (rng() - 0.5) * step * 0.8, pick = rng(), cnt = 2 + Math.floor(rng() * 3), a0 = rng() * 6.28;
          if (pick > 0.42 || !N.pointInPoly(l.poly, px, pz) || !this.inPlay(px, pz) || !this.clearAt(px, pz, 3.5)) continue;
          const kind = ['lilac', 'acacia', 'spiraea', 'lilac', 'jasmine', 'rosehip'][Math.floor(pick / 0.42 * 6)];
          for (let k = 0; k < cnt; k++) {
            const a = a0 + k * 2.2, d = k ? 1.7 + (k % 2) * 0.6 : 0;
            this.plantBush(kind, px + Math.cos(a) * d, pz + Math.sin(a) * d);
          }
        }
      }
      for (const s of this.surf) {
        if (s.cls !== 'Y') continue;
        const p = s.pts, cum = N.cumLen(p), L = cum[cum.length - 1];
        if (L < 22) continue;
        const mid = N.plineAt(p, cum, L / 2);
        if (H(mid.x, mid.z, 81) > 0.3 || !this.inPlay(mid.x, mid.z)) continue;
        const side = H(mid.x, mid.z, 82) < 0.5 ? 1 : -1, tires = H(mid.x, mid.z, 83) < 0.55, paint = H(mid.x, mid.z, 84) < 0.5, off = s.w / 2 + 0.8;
        let t = 5 + H(mid.x, mid.z, 85) * 6;
        while (t < L - 6) {
          const run = 6 + H(mid.x + t, mid.z, 86) * 7;
          if (t + run > L - 4) break;
          const q = N.plineAt(p, cum, t + run / 2), x = q.x - q.dz * side * off, z = q.z + q.dx * side * off;
          if (tires) {
            const n = Math.floor(run / 0.66), ends = [-run / 2, 0, run / 2].map(u => [x + q.dx * u, z + q.dz * u]);
            if (ends.every(([ex, ez]) => this.greenOk(ex, ez, 0.4, [q.dx, q.dz]))) {
              this.prop('tires', x, z, Math.atan2(q.dz, q.dx), { n, tone: Math.floor(H(x, z, 87) * 5) });
              this.spot('tires', q.x + q.dx * (run / 2 + 5), q.z + q.dz * (run / 2 + 5), x, z);
              for (const [ex, ez] of ends) this.claim(ex - 0.5, ez - 0.5, ex + 0.5, ez + 0.5);
              this.tally('tires');
            }
          } else {
            for (let u = -run / 2; u <= run / 2; u += 2.6 + H(x + u, z, 88) * 0.8) this.boulder(x + q.dx * u, z + q.dz * u, 0.75 + H(x + u, z, 89) * 0.5, paint, false, [q.dx, q.dz]);
            this.spot('boulders', q.x + q.dx * (run / 2 + 5), q.z + q.dz * (run / 2 + 5), x, z);
          }
          t += run + 8 + H(mid.x + t, mid.z, 90) * 22;
        }
      }
    },

    hedges() {
      for (const e of this.edges) {
        if (e.plant || e.outer || !(e.main || e.rank >= 3)) continue;
        const tp = this.trimmed(e), cum = N.cumLen(tp), L = cum[cum.length - 1];
        if (L < 30) continue;
        for (const side of [1, -1]) {
          const sw = side > 0 ? e.swR : e.swL;
          if (!sw || H(e.id, side, 91) > 0.5) continue;
          const off = e.hw + sw + 0.75, h = 0.85 + H(e.id, side, 92) * 0.35, run = [];
          const flush = () => {
            if (run.length >= 4) for (const q of run) {
              this.prop('hedge', q.mx, q.mz, Math.atan2(q.along[1], q.along[0]), { w: q.len + 0.06, h, d: 0.8 });
              this.bushes.push({ x: q.mx, z: q.mz, r: 1.0, h, kind: 'hedge', hedge: true });
              this.claimPoly(this.rectPoly(q.mx, q.mz, q.along[0], q.along[1], q.len / 2, 0.45), 0.05);
              this.tally('hedge');
            }
            if (run.length >= 4) { const q = run[run.length >> 1]; this.spot('hedge', q.mx + q.nx * 7 + q.along[0] * 9, q.mz + q.nz * 7 + q.along[1] * 9, q.mx, q.mz); }
            run.length = 0;
          };
          for (let s = 6; s < L - 7; s += 1.9) {
            const a = N.plineAt(tp, cum, s), b = N.plineAt(tp, cum, s + 1.9);
            const ax = a.x - a.dz * side * off, az = a.z + a.dx * side * off, bx = b.x - b.dz * side * off, bz = b.z + b.dx * side * off;
            const len = Math.hypot(bx - ax, bz - az);
            const along = [(bx - ax) / (len || 1), (bz - az) / (len || 1)], mx = (ax + bx) / 2, mz = (az + bz) / 2;
            if (len < 1.2 || !this.greenOk(ax, az, 0.45, along) || !this.greenOk(bx, bz, 0.45, along) || !this.greenOk(mx, mz, 0.45, along)) { flush(); continue; }
            run.push({ mx, mz, len, along, nx: -a.dz * side, nz: a.dx * side });
          }
          flush();
        }
      }
    },

    parkFloor() {
      const rng = N.rng(this.seed + 311);
      for (const l of this.land) {
        if (l.k !== 'f' && l.k !== 'p') continue;
        const b = l.box, forest = l.k === 'f';
        if (b.x1 < this.PX0 || b.x0 > this.PX1 || b.z1 < this.PZ0 || b.z0 > this.PZ1) continue;
        const step = forest ? 11 : 16;
        for (let x = b.x0 + rng() * step; x < b.x1; x += step) for (let z = b.z0 + rng() * step; z < b.z1; z += step) {
          const px = x + (rng() - 0.5) * step * 0.8, pz = z + (rng() - 0.5) * step * 0.8, r = rng(), s = 0.75 + rng() * 0.45;
          if (r > (forest ? 0.5 : 0.32) || !N.pointInPoly(l.poly, px, pz)) continue;
          const t = r / (forest ? 0.5 : 0.32);
          if (forest && t < 0.2) this.decor('weeds', px, pz, 0.5, { kind: 2, s: 0.8 + s * 0.5 });
          else if (t < 0.32) this.plantTree('rowan', px, pz, s);
          else this.plantBush(forest || t < 0.75 ? 'hazel' : 'lilac', px, pz, s);
        }
        if (!forest) continue;
        for (let x = b.x0 + rng() * 34; x < b.x1; x += 34) for (let z = b.z0 + rng() * 34; z < b.z1; z += 34) {
          const px = x + (rng() - 0.5) * 24, pz = z + (rng() - 0.5) * 24, r = rng(), s = 0.75 + rng() * 0.5, a = rng() * Math.PI, len = 3.5 + rng() * 2.5;
          if (r > 0.42 || !N.pointInPoly(l.poly, px, pz)) continue;
          if (r < 0.26) this.decor('stump', px, pz, 0.55 * s, { s, kind: r < 0.08 ? 1 : 0 }, { r: 0.33 * s, h: 0.5 * s, kind: 'stump' });
          else {
            const ux = Math.cos(a), uz = Math.sin(a), ax = px - ux * len / 2, az = pz - uz * len / 2, bx = px + ux * len / 2, bz = pz + uz * len / 2, rr = 0.2 + s * 0.12;
            if (!this.greenOk(ax, az, 0.45) || !this.greenOk(bx, bz, 0.45) || !this.greenOk(px, pz, 0.45)) continue;
            this.prop('log', px, pz, a, { len, r: rr, kind: r < 0.32 ? 1 : 0 });
            this.segWall(ax, az, bx, bz, rr * 2, rr * 1.6, 'log');
            this.claimPoly(this.rectPoly(px, pz, ux, uz, len / 2 + 0.3, rr + 0.3), 0);
            this.tally('log');
          }
        }
      }
      const W = this.walk;
      for (const e of W.edges) {
        const A = W.nodes[e.a], B = W.nodes[e.b];
        if (!A || !B || e.cross) continue;
        const mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2, L = Math.hypot(B.x - A.x, B.z - A.z), h = H(mx, mz, 95);
        if (L > 6 && this.luAt(mx, mz) === 'f' && this.luAt(mx - (B.z - A.z) / L * 12, mz + (B.x - A.x) / L * 12) === 'f') this.spot('forest', A.x, A.z, mx - (B.z - A.z) / L * 10, mz + (B.x - A.x) / L * 10);
        if (L < 6 || h > 0.07 || !'fp'.includes(this.luAt(mx, mz))) continue;
        const nx = -(B.z - A.z) / L, nz = (B.x - A.x) / L, side = h < 0.035 ? 1 : -1, s = 0.8 + H(mx, mz, 96) * 0.7;
        if (this.boulder(mx + nx * side * 3.1, mz + nz * side * 3.1, s, false) && H(mx, mz, 97) < 0.5) this.boulder(mx + nx * side * 3.4 + (B.x - A.x) / L * 1.5, mz + nz * side * 3.4 + (B.z - A.z) / L * 1.5, s * 0.6, false);
      }
    },

    waterside() {
      for (const l of this.land) {
        if (l.k !== 'w') continue;
        const b = l.box;
        if (b.x1 < this.PX0 || b.x0 > this.PX1 || b.z1 < this.PZ0 || b.z0 > this.PZ1) continue;
        const p = l.poly, n = p.length;
        let acc = 0;
        for (let i = 0; i < n; i += 2) {
          const j = (i + 2) % n, ax = p[i], az = p[i + 1], bx = p[j], bz = p[j + 1], L = Math.hypot(bx - ax, bz - az);
          if (L < 0.5) continue;
          const ux = (bx - ax) / L, uz = (bz - az) / L;
          let nx = -uz, nz = ux;
          if (!N.pointInPoly(p, (ax + bx) / 2 + nx * 0.5, (az + bz) / 2 + nz * 0.5)) { nx = -nx; nz = -nz; }
          for (let s = 1; s < L; s += 2.4) {
            const x = ax + ux * s, z = az + uz * s, run = N.noise2((acc + s) * 0.035, l.id * 1.7, 5), h = H(x, z, 101);
            if (run > 0.45) {
              const off = 0.6 + h * 1.6, rx = x + nx * off, rz = z + nz * off, wa = this.waterAt(rx, rz);
              if (wa && wa.pond && wa.level - wa.bed < 1.3 && this.inPlay(rx, rz) && this.clearAt(rx, rz, 0.5) && !this.guarded(rx, rz, 0.6)) {
                this.prop('reeds', rx, rz, h * 6.28, { y: wa.bed, depth: wa.level - wa.bed, s: 0.8 + H(rx, rz, 102) * 0.45 });
                this.tally('reeds');
                this.spot('pond', x - nx * 9, z - nz * 9, rx, rz);
              }
            }
            if (h < 0.1) this.plantBush('willowbush', x - nx * (2.2 + h * 9), z - nz * (2.2 + h * 9));
            else if (h > 0.985) this.plantTree('willow', x - nx * 4.5, z - nz * 4.5);
          }
          acc += L;
        }
        if (l.area > 90000) continue;
        const rng = N.rng(l.id * 31 + 7), want = Math.min(26, Math.floor(l.area / 500));
        let made = 0;
        for (let k = 0; k < want * 6 && made < want; k++) {
          const x = b.x0 + rng() * (b.x1 - b.x0), z = b.z0 + rng() * (b.z1 - b.z0), wa = this.waterAt(x, z);
          if (!wa || !wa.pond || wa.d < 2.5 || wa.d > 14 || !this.inPlay(x, z) || this.guarded(x, z, 1)) continue;
          this.prop('lily', x, z, rng() * 6.28, { y: wa.level, s: 0.8 + rng() * 0.6 });
          made++;
          this.tally('lily');
        }
      }
      const K = this.bankL;
      if (!K || K.length < 4) return;
      const riprap = ['colonel', 'port', 'myza_bridge'].map(id => this.places[id]).filter(Boolean);
      for (let i = 2; i < K.length; i += 2) {
        const ax = K[i - 2], az = K[i - 1], bx = K[i], bz = K[i + 1], L = Math.hypot(bx - ax, bz - az);
        if (L < 0.5) continue;
        const ux = (bx - ax) / L, uz = (bz - az) / L;
        let nx = -uz, nz = ux;
        if (this.ground((ax + bx) / 2 + nx * 4, (az + bz) / 2 + nz * 4) !== GT.WATER) { nx = -nx; nz = -nz; }
        for (let s = 0; s < L; s += 1.3) {
          const x = ax + ux * s, z = az + uz * s, h = H(x, z, 111);
          if (!this.inPlay(x, z)) continue;
          if (riprap.some(q => Math.hypot(q.x - x, q.z - z) < 70)) {
            const o = 0.3 + h * 1.6;
            this.boulder(x + nx * o, z + nz * o, 0.55 + H(x, z, 112) * 0.5, false, true);
            this.spot('riprap', x - nx * 12 + ux * 6, z - nz * 12 + uz * 6, x, z);
          } else if (h < 0.035) this.plantBush('willowbush', x - nx * (4 + h * 60), z - nz * (4 + h * 60));
        }
      }
    },

    wasteland() {
      const rng = N.rng(this.seed + 321);
      for (const b of this.buildings) {
        if (b.removed || b.style !== 'garage' || !b.poly || !this.inPlay(b.cx, b.cz)) continue;
        const p = b.poly, n = p.length;
        for (let i = 0; i < n; i += 2) {
          const j = (i + 2) % n, ax = p[i], az = p[i + 1], bx = p[j], bz = p[j + 1], L = Math.hypot(bx - ax, bz - az);
          if (L < 6) continue;
          const ux = (bx - ax) / L, uz = (bz - az) / L;
          let nx = uz, nz = -ux;
          if (N.pointInPoly(p, (ax + bx) / 2 + nx * 0.6, (az + bz) / 2 + nz * 0.6)) { nx = -nx; nz = -nz; }
          for (let s = 1.5; s < L - 1; s += 2.6 + rng() * 1.6) {
            const r = rng(), x = ax + ux * s + nx * 0.85, z = az + uz * s + nz * 0.85;
            if (r < 0.32) this.decor('weeds', x, z, 0.45, { kind: r < 0.18 ? 0 : 1, s: 0.8 + rng() * 0.5 });
            else if (r > 0.975) this.plantTree('ashmaple', x + nx * 1.8, z + nz * 1.8, 0.7 + rng() * 0.4);
          }
        }
      }
      for (const l of this.land) {
        if (!'nuj'.includes(l.k)) continue;
        const b = l.box;
        if (b.x1 < this.PX0 || b.x0 > this.PX1 || b.z1 < this.PZ0 || b.z0 > this.PZ1) continue;
        const step = 22;
        for (let x = b.x0 + rng() * step; x < b.x1; x += step) for (let z = b.z0 + rng() * step; z < b.z1; z += step) {
          const px = x + (rng() - 0.5) * step * 0.8, pz = z + (rng() - 0.5) * step * 0.8, r = rng(), s = 0.7 + rng() * 0.5;
          if (r > 0.3 || !N.pointInPoly(l.poly, px, pz)) continue;
          const t = r / 0.3;
          if (t < 0.5) { for (let k = 0; k < 3; k++) this.decor('weeds', px + k * 1.1, pz + (k % 2) * 0.9, 0.45, { kind: k % 2, s }); }
          else if (t < 0.68) this.plantTree('birch', px, pz, 0.5 + s * 0.3);
          else if (t < 0.84) this.plantTree('ashmaple', px, pz, s);
          else this.decor('rubble', px, pz, 0.8 * s + 0.2, { kind: Math.floor(rng() * 8), s }, { r: 0.7 * s, h: 0.6 * s, kind: 'rock' });
        }
      }
    }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
