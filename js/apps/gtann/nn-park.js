(function (N) {
  'use strict';

  const GT = N.GT;
  const TAU = Math.PI * 2;
  const SOFT = [GT.GRASS, GT.FOREST, GT.FIELD, GT.YARD, GT.DIRT, GT.PATH];

  const PARK = N.PARK = {
    gate: [-54, 6],
    square: { x: -213.5, z: -20, r: 20.5, basin: 11 },
    pool: { x: -139.65, z: -8.5, l: 28.2, w: 5.16, a: Math.atan2(0.152, 0.988) },
    parterre: [-172, -20, -175, -4, -117, 5, -114, -15],
    east: { from: [-56, 5.6], to: [-115, -5], w: 8 },
    link: { from: [-173.5, -15.2], to: [-194.5, -18.8], w: 6 },
    doubles: [
      { id: 'fountains', a: [-232, -24.5], b: [-453, -56.5], paths: [[-230, -31, -452, -62], [-232, -18, -454, -51]], fountains: 14, beds: true },
      { id: 'north', a: [-210.5, -38.5], b: [-189, -185.5], paths: [[-219, -40, -197, -187], [-202, -37, -181, -184]], beds: true },
      { id: 'south', a: [-216, -4], b: [-236.5, 129.5], paths: [[-224, -5, -245, 136], [-208, -3, -228, 123]] }
    ],
    ring: { x: -460, z: -57, r: 8.6 },
    round: { x: -509.6, z: -65.3, r: 4.2, plaza: 8.6 },
    cinema: { x: -476, z: -194, ax: 0.08, az: 0.997, hl: 17, hw: 9, h: 8.6 },
    dance: { x: -257.5, z: -153, r: 9.4 },
    side: [-249, -226],
    attr: {
      gate: [-334, 243.8], fence: [-302, 248, -397, 235],
      pave: [-394, 240, -338, 248.5, -326, 262, -334, 281, -352, 312, -361, 331, -380, 350, -404, 352],
      kiosks: [[-366, 288, -1, 0, 'МОРОЖЕНОЕ'], [-349, 301, -0.7, -0.7, 'ПИВО · ВОДЫ']]
    },
    wheel: { x: -368, z: 325, a: -0.183, r: 14, hub: 16.25, hang: 1.65, n: 24, period: 140, ticket: 20 },
    rides: [
      { type: 'autodrom', x: -385, z: 270, rot: Math.PI / 2, hl: 10, hw: 8 },
      { type: 'swings', x: -385, z: 298, r: 8.4 },
      { type: 'waltz', x: -371, z: 252, r: 6.4 },
      { type: 'carousel', x: -396, z: 342, r: 5.4 }
    ],
    tir: {
      x: -352.5, z: 260, rot: Math.PI / 2, price: 10, shots: 10, w: 8, d: 6.6, wall: 6.46,
      ducks: { n: 6, y: 2.33, z: 6.04, r: 0.08, span: 6.6, speed: 0.55 },
      figures: [
        { kind: 'bear', u: -2.6, y: 1.66, z: 6.14, r: 0.07 }, { kind: 'hare', u: -1.3, y: 1.62, z: 6.14, r: 0.065 }, { kind: 'wolf', u: 0, y: 1.6, z: 6.14, r: 0.07 },
        { kind: 'fox', u: 1.3, y: 1.6, z: 6.14, r: 0.065 }, { kind: 'boar', u: 2.6, y: 1.6, z: 6.14, r: 0.07 },
        { kind: 'mill', u: -2.1, y: 1.24, z: 6.16, r: 0.065 }, { kind: 'bell', u: 0.15, y: 1.0, z: 6.16, r: 0.06 }, { kind: 'plane', u: 2.1, y: 1.12, z: 6.16, r: 0.065 }
      ],
      bias: [0.035, 0.085]
    },
    foods: [
      { x: -189, z: -1, face: [-1, -0.6], name: 'square' },
      { x: -320.5, z: 268, face: [-1, 0.08], name: 'attr' },
      { name: 'side', side: [7.6, 3.4] }
    ],
    meet: [-452, 212],
    cars: [-470, 196],
    menu: [
      { id: 'shawarma', name: 'Шаурма в лаваше', price: 60, hp: 35, dur: 3.2 },
      { id: 'double', name: 'Шаурма двойная', price: 100, hp: 70, dur: 4.6 },
      { id: 'kvass', name: 'Квас, кружка', price: 10, hp: 5, dur: 1.6 }
    ],
    prizes: [[10, 200, 'Главный приз'], [8, 50, 'Приз'], [6, 20, 'Утешительный приз']],
    firstPrize: 1000
  };

  const ringPoly = (cx, cz, r, n) => { const p = []; for (let i = 0; i < (n || 24); i++) { const a = i / (n || 24) * TAU; p.push(cx + Math.cos(a) * r, cz + Math.sin(a) * r); } return p; };
  const segPoly = (ax, az, bx, bz, hw) => {
    const L = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / L * hw, nz = (bx - ax) / L * hw;
    const p = [ax + nx, az + nz, bx + nx, bz + nz, bx - nx, bz - nz, ax - nx, az - nz];
    return N.polyArea(p) < 0 ? N.reversePoly(p) : p;
  };
  const frameOf = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax) / L, uz = (bz - az) / L; return { ax, az, L, ux, uz, vx: -uz, vz: ux }; };
  const at = (f, s, v) => [f.ax + f.ux * s + f.vx * v, f.az + f.uz * s + f.vz * v];
  N.parkRing = ringPoly;

  N.wheelPose = (W, ang, i, out) => {
    const o = out || {};
    const ph = ang + i / W.n * TAU, ux = Math.cos(W.a), uz = Math.sin(W.a);
    const s = Math.sin(ph) * W.r, y = W.hub - Math.cos(ph) * W.r;
    o.px = W.x + ux * s; o.pz = W.z + uz * s; o.py = y;
    o.x = o.px; o.z = o.pz; o.y = y - W.hang;
    o.ph = ((ph % TAU) + TAU) % TAU;
    return o;
  };
  N.wheelAngle = (W, t) => (t / W.period) * TAU;

  Object.assign(N.City.prototype, {
    sitePark() {
      const park = this.land.find(l => /Автозаводский парк/.test(l.name));
      if (park) {
        this.namedAreas.push({ name: 'Автозаводский парк', poly: park.poly, box: park.box });
        this.pedArea(park.box.x0, park.box.z0, park.box.x1, park.box.z1, 'park', 8, park.poly);
      }
      this.parkData = { foods: [], fountains: [], benches: 0, trees: 0, lamps: 0, wheel: null, tir: null, rides: [], dance: null, cinema: null };
      this.parkSquare();
      this.parkEastAlley();
      for (const d of PARK.doubles) this.parkDouble(d);
      this.parkRound();
      this.parkCinema();
      this.parkDance();
      this.parkSide();
      this.parkAttractions();
      this.parkFoodStalls();
      this.parkMeet();
      this.parkTower();
    },

    parkPave(poly, tex, fill) {
      this.plazas.push({ poly, tex });
      this.fillPoly(poly, fill === undefined ? GT.PLAZA : fill, SOFT);
      this.claimPoly(poly, 0);
    },

    parkTree(x, z, s) {
      const t = this.ground(x, z);
      if (t !== GT.GRASS && t !== GT.FOREST && t !== GT.FIELD && t !== GT.PATH) return false;
      if (!this.freeAt(x, z, 0.9) || !this.inPlay(x, z) || this.surfaceAt(x, z) !== 3 || this.nearFoot(x, z, 0.45)) return false;
      this.prop('tree', x, z, N.hash2(x * 10 | 0, z * 10 | 0, 9) * TAU, { kind: 'linden', s: s || 1.0 + N.hash2(x | 0, z | 0, 5) * 0.2, white: 1.35 });
      this.circle(x, z, 0.27, 6, 'tree');
      this.claim(x - 0.7, z - 0.7, x + 0.7, z + 0.7);
      this.parkData.trees++;
      return true;
    },

    nearFoot(x, z, d) {
      for (const f of this.foot) {
        const p = f.pts;
        for (let i = 2; i < p.length; i += 2) {
          if (Math.min(p[i - 2], p[i]) - d - f.w > x || Math.max(p[i - 2], p[i]) + d + f.w < x || Math.min(p[i - 1], p[i + 1]) - d - f.w > z || Math.max(p[i - 1], p[i + 1]) + d + f.w < z) continue;
          const r = d + f.w / 2;
          if (N.segDist2(x, z, p[i - 2], p[i - 1], p[i], p[i + 1])[0] < r * r) return true;
        }
      }
      return false;
    },

    parkBench(x, z, fx, fz, urn) {
      if (!this.freeAt(x, z, 0.5) || this.nearFoot(x, z, 0.4)) return false;
      this.propBox(this.prop('bench', x, z, N.yawOf(fx, fz)), 0.86, 0.24, 0.9);
      this.claim(x - 1, z - 1, x + 1, z + 1);
      this.parkData.benches++;
      if (urn) {
        const rx = -fz, rz = fx, ux = x + rx * 1.35, uz = z + rz * 1.35;
        if (this.freeAt(ux, uz, 0.3)) { this.circle(ux, uz, 0.26, 0.7, 'prop', { bp: this.prop('urn', ux, uz, 0) }); this.claim(ux - 0.4, uz - 0.4, ux + 0.4, uz + 0.4); }
      }
      return true;
    },

    parkLamp(x, z) {
      if (!this.freeAt(x, z, 0.35) || this.nearFoot(x, z, 0.3)) return false;
      this.circle(x, z, 0.12, 4, 'lamp', { bp: this.prop('lamp', x, z, 0, { park: true }) });
      this.claim(x - 0.45, z - 0.45, x + 0.45, z + 0.45);
      this.parkData.lamps++;
      return true;
    },

    parkFountain(x, z, kind, r, o) {
      const p = this.prop('fountain', x, z, (o && o.rot) || 0, Object.assign({ kind, r }, o || {}));
      if (kind === 'pool') this.obb(x, z, p.rot, o.l / 2 + 0.2, o.w / 2 + 0.2, 0.7, 'prop');
      else this.circle(x, z, r + 0.15, 0.7, 'prop');
      this.parkData.fountains.push({ x, z, kind, r, rot: p.rot, l: o && o.l, w: o && o.w, big: !!(o && o.big) });
      return p;
    },

    footNear(ax, az, bx, bz, tol) {
      const t = tol || 3;
      let best = null, bd = Infinity;
      for (const f of this.foot) {
        const n = f.pts.length;
        const d1 = Math.hypot(f.pts[0] - ax, f.pts[1] - az) + Math.hypot(f.pts[n - 2] - bx, f.pts[n - 1] - bz);
        const d2 = Math.hypot(f.pts[0] - bx, f.pts[1] - bz) + Math.hypot(f.pts[n - 2] - ax, f.pts[n - 1] - az);
        const d = Math.min(d1, d2);
        if (d < bd) { bd = d; best = f; }
      }
      return bd < t * 2 ? best : null;
    },

    parkSquare() {
      const S = PARK.square;
      const disk = ringPoly(S.x, S.z, S.r, 32);
      this.clearProps(disk);
      this.parkPave(disk, 'plaza');
      this.parkFountain(S.x, S.z, 'tiers', S.basin);
      this.put('park_square', S.x + S.basin + 3, S.z, -Math.PI / 2);
      this.put('park_fountain', S.x + S.basin + 2.6, S.z + 3, -Math.PI / 2);
      const ends = [];
      for (const f of this.foot) for (const k of [0, f.pts.length - 2]) { const d = Math.hypot(f.pts[k] - S.x, f.pts[k + 1] - S.z); if (d > 14 && d < 25) ends.push(Math.atan2(f.pts[k + 1] - S.z, f.pts[k] - S.x)); }
      const open = (a, w) => ends.some(e => Math.abs(N.wrap(a - e)) < w);
      for (let k = 0; k < 20; k++) {
        const a = (k + 0.5) / 20 * TAU;
        if (open(a, 0.2)) continue;
        this.parkBench(S.x + Math.cos(a) * 16.4, S.z + Math.sin(a) * 16.4, -Math.cos(a), -Math.sin(a), k % 2 === 0);
      }
      for (let k = 0; k < 12; k++) {
        const a = (k + 0.5) / 12 * TAU;
        if (open(a, 0.14)) continue;
        const x = S.x + Math.cos(a) * 21.5, z = S.z + Math.sin(a) * 21.5;
        if (this.freeAt(x, z, 0.4) && !this.nearFoot(x, z, 0.2)) { this.circle(x, z, 0.2, 4, 'lamp', { bp: this.prop('globelamp', x, z, a) }); this.claim(x - 0.5, z - 0.5, x + 0.5, z + 0.5); this.parkData.lamps++; }
      }
      for (const [x, z, text] of [[-194.5, -33, 'МОРОЖЕНОЕ'], [-233, -7, 'ПИВО · ВОДЫ']]) {
        const rot = N.yawOf(S.x - x, S.z - z);
        this.prop('kiosk', x, z, rot, { text });
        this.obb(x, z, rot, 1.5, 1.5, 2.6, 'prop');
        this.claim(x - 2.2, z - 2.2, x + 2.2, z + 2.2);
      }
      this.pedArea(S.x - S.r, S.z - S.r, S.x + S.r, S.z + S.r, 'park', 6, disk);
    },

    parkEastAlley() {
      const E = PARK.east, L = PARK.link;
      const a = this.footNear(-115, -5, -54, 6);
      if (a) a.w = E.w;
      const b = this.footNear(-195, -19, -173, -15);
      if (b) b.w = L.w;
      const c = this.footNear(-172, -20, -172, -20, 6);
      if (c && c.pts.length > 8) c.w = 3.6;
      const f = frameOf(E.from[0], E.from[1], E.to[0], E.to[1]);
      for (let s = 9; s < f.L - 2; s += 7) for (const v of [-1, 1]) this.parkTree(...at(f, s, v * (E.w / 2 + 2.2)));
      for (let s = 14, k = 0; s < f.L - 4; s += 15, k++) for (const v of [-1, 1]) { const q = at(f, s, v * (E.w / 2 + 0.7)); this.parkBench(q[0], q[1], -f.vx * v, -f.vz * v, k % 2 === 0); }
      for (let s = 21; s < f.L; s += 21) for (const v of [-1, 1]) this.parkLamp(...at(f, s + 3.5, v * (E.w / 2 + 0.55)));
      this.claimPoly(segPoly(f.ax, f.az, E.to[0], E.to[1], E.w / 2 + 2.9), 0);
      const P = PARK.pool;
      const pp = [];
      for (let i = 0; i < PARK.parterre.length; i += 2) pp.push(PARK.parterre[i], PARK.parterre[i + 1]);
      const lawn = N.polyArea(pp) < 0 ? N.reversePoly(pp) : pp;
      this.clearProps(lawn);
      this.claimPoly(lawn, 1);
      this.parkFountain(P.x, P.z, 'pool', 0, { l: P.l, w: P.w, rot: N.yawOf(Math.cos(P.a), Math.sin(P.a)) + Math.PI / 2 });
      const ux = Math.cos(P.a), uz = Math.sin(P.a);
      for (const s of [-1, 1]) {
        const x = P.x + ux * s * (P.l / 2 + 5), z = P.z + uz * s * (P.l / 2 + 5);
        this.prop('flowerbed', x, z, 0, { r: 2.4 });
        this.circle(x, z, 2.5, 0.5, 'prop');
      }
      const lf = frameOf(L.from[0], L.from[1], L.to[0], L.to[1]);
      for (const v of [-1, 1]) { this.parkLamp(...at(lf, lf.L / 2, v * (L.w / 2 + 0.6))); this.parkTree(...at(lf, 4, v * (L.w / 2 + 2))); this.parkTree(...at(lf, lf.L - 4, v * (L.w / 2 + 2))); }
      const g = PARK.gate;
      this.put('park_alley', g[0] - 9, g[1] - 1.5, N.yawOf(-1, -0.18));
    },

    parkDouble(d) {
      const f = frameOf(d.a[0], d.a[1], d.b[0], d.b[1]);
      const sides = d.paths.map(q => {
        const fp = this.footNear(q[0], q[1], q[2], q[3]);
        if (fp) fp.w = 4.2;
        const v0 = (q[0] - f.ax) * f.vx + (q[1] - f.az) * f.vz, v1 = (q[2] - f.ax) * f.vx + (q[3] - f.az) * f.vz;
        return { v0, v1 };
      });
      const vAt = (side, s) => N.lerp(side.v0, side.v1, N.clamp(s / f.L, 0, 1));
      const lo = sides[0].v0 < sides[1].v0 ? sides[0] : sides[1], hi = lo === sides[0] ? sides[1] : sides[0];
      const band = [];
      for (const s of [0, f.L]) band.push(...at(f, s, vAt(lo, s) - 7.5));
      for (const s of [f.L, 0]) band.push(...at(f, s, vAt(hi, s) + 7.5));
      const bandPoly = N.polyArea(band) < 0 ? N.reversePoly(band) : band;
      const lawn = [];
      for (const s of [3, f.L - 3]) lawn.push(...at(f, s, vAt(lo, s) + 2.3));
      for (const s of [f.L - 3, 3]) lawn.push(...at(f, s, vAt(hi, s) - 2.3));
      const lawnPoly = N.polyArea(lawn) < 0 ? N.reversePoly(lawn) : lawn;
      this.clearProps(lawnPoly);
      const fn = d.fountains || 0;
      for (let k = 0; k < fn; k++) {
        const s = f.L * (k + 0.5) / fn, half = (vAt(hi, s) - vAt(lo, s)) / 2 - 2.1;
        const [x, z] = at(f, s, (vAt(hi, s) + vAt(lo, s)) / 2);
        this.parkFountain(x, z, 'cup', N.clamp(half - 1.4, 1.6, 2.3));
      }
      if (d.beds) {
        const step = fn ? f.L / fn : 24;
        for (let s = fn ? step : 14; s < f.L - 6; s += step) {
          const mid = (vAt(hi, s) + vAt(lo, s)) / 2, [x, z] = at(f, s, mid);
          this.plazas.push({ poly: segPoly(...at(f, s - 2.6, mid), ...at(f, s + 2.6, mid), 1.1), tex: 'flowers' });
          this.claim(x - 1.5, z - 1.5, x + 1.5, z + 1.5);
        }
      }
      for (const [side, out] of [[lo, -1], [hi, 1]]) {
        for (let s = 5; s < f.L - 3; s += 7) this.parkTree(...at(f, s, vAt(side, s) + out * 4.9));
        const bStep = fn ? f.L / fn : 18;
        for (let s = fn ? bStep : 9, k = 0; s < f.L - 4; s += bStep, k++) {
          const q = at(f, s, vAt(side, s) + out * 2.8);
          this.parkBench(q[0], q[1], -f.vx * out, -f.vz * out, k % 2 === 1);
        }
        for (let s = fn ? bStep * 1.5 : 18, k = 0; s < f.L - 4; s += bStep * 2, k++) this.parkLamp(...at(f, s, vAt(side, s) + out * 2.6));
      }
      this.claimPoly(bandPoly, 0);
      this.pedArea(Math.min(f.ax, d.b[0]) - 8, Math.min(f.az, d.b[1]) - 8, Math.max(f.ax, d.b[0]) + 8, Math.max(f.az, d.b[1]) + 8, 'park', fn ? 6 : 3, bandPoly);
    },

    parkRound() {
      const R = PARK.round, C = PARK.ring;
      const disk = ringPoly(R.x, R.z, R.plaza, 24);
      this.clearProps(disk);
      this.parkPave(disk, 'plaza');
      this.parkFountain(R.x, R.z, 'cup', R.r, { big: true });
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.5; this.parkBench(R.x + Math.cos(a) * 10.4, R.z + Math.sin(a) * 10.4, -Math.cos(a), -Math.sin(a), k % 2 === 0); }
      const bed = ringPoly(C.x, C.z, C.r - 2.4, 20);
      this.clearProps(ringPoly(C.x, C.z, C.r + 1, 20));
      this.plazas.push({ poly: bed, tex: 'flowers' });
      this.claimPoly(ringPoly(C.x, C.z, C.r, 20), 0.5);
      this.prop('parkstatue', C.x, C.z, N.yawOf(1, 0.14));
      this.circle(C.x, C.z, 0.9, 3.6, 'monument');
      this.put('park_round', R.x + R.plaza - 1.5, R.z, -Math.PI / 2);
    },

    parkCinema() {
      const C = PARK.cinema;
      const rx = C.az, rz = -C.ax;
      const poly = [];
      for (const [u, v] of [[-C.hl, -C.hw], [C.hl, -C.hw], [C.hl, C.hw], [-C.hl, C.hw]]) poly.push(C.x + C.ax * u + rx * v, C.z + C.az * u + rz * v);
      const area = this.rectPoly(C.x - C.ax * 4, C.z - C.az * 4, C.ax, C.az, C.hl + 8, C.hw + 5);
      this.clearProps(area);
      const b = this.customBuilding(N.polyArea(poly) < 0 ? N.reversePoly(poly) : poly, C.h, 'wood', { k: 'o', name: 'Летний кинотеатр «Родина»', roof: 'flat' });
      b.lm = { type: 'rodina', ax: C.ax, az: C.az, hl: C.hl, hw: C.hw, cx: C.x, cz: C.z };
      b.walkRoof = false;
      const fx = C.x - C.ax * (C.hl + 5.5), fz = C.z - C.az * (C.hl + 5.5);
      const plaza = this.rectPoly(fx, fz, C.ax, C.az, 5.5, C.hw + 3);
      this.parkPave(plaza, 'plaza');
      this.claimPoly(area, 0);
      for (const v of [-1, 1]) {
        this.parkBench(fx + rx * v * (C.hw + 1.8), fz + rz * v * (C.hw + 1.8), -rx * v, -rz * v, true);
        this.parkLamp(fx - C.ax * 3.5 + rx * v * (C.hw - 1), fz - C.az * 3.5 + rz * v * (C.hw - 1));
      }
      for (const v of [-1, 1]) {
        const x = fx - C.ax * 1.2 + rx * v * 6.2, z = fz - C.az * 1.2 + rz * v * 6.2;
        this.prop('posterstand', x, z, N.yawOf(-C.ax, -C.az), { poster: v < 0 ? 0 : 1 });
        this.obb(x, z, N.yawOf(-C.ax, -C.az), 0.2, 1.1, 2.6, 'prop');
      }
      this.put('park_cinema', fx - C.ax * 3, fz - C.az * 3, N.yawOf(C.ax, C.az));
      const sx = C.x - C.ax * (C.hl - 2.9), sz = C.z - C.az * (C.hl - 2.9), ex = C.x - C.ax * (C.hl + 0.12), ez = C.z - C.az * (C.hl + 0.12);
      this.signs.push({ x: ex, y: 6.04, z: ez, w: 10.6, h: 0.66, nx: -C.ax, nz: -C.az, text: 'КИНОТЕАТР «РОДИНА»', style: 'paint', color: '#b8302a' });
      this.signs.push({ x: sx, y: 8.85, z: sz, w: 3.2, h: 0.5, nx: -C.ax, nz: -C.az, text: 'ЛЕТНИЙ', style: 'paint', color: '#b8302a' });
      for (const v of [-1, 1]) {
        const x = fx - C.ax * 1.2 + rx * v * 6.2 - C.ax * 0.03, z = fz - C.az * 1.2 + rz * v * 6.2 - C.az * 0.03;
        this.signs.push({ x, y: 1.66, z, w: 2.0, h: 1.92, nx: -C.ax, nz: -C.az, text: v < 0 ? 'БРАТ 2' : 'ДМБ', style: 'poster' });
      }
      this.parkData.cinema = { x: C.x, z: C.z, ax: C.ax, az: C.az, b: b.id };
    },

    parkDance() {
      const D = PARK.dance;
      const old = this.bNear(D.x, D.z, 14, q => q.area < 500);
      if (old) this.removeBuilding(old);
      const disk = ringPoly(D.x, D.z, D.r + 3.2, 28);
      this.clearProps(disk);
      this.parkPave(ringPoly(D.x, D.z, D.r + 3, 28), 'asphalt2');
      const door = 0.15;
      const n = 26;
      for (let k = 0; k < n; k++) {
        const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, am = (a0 + a1) / 2;
        if (Math.abs(N.wrap(am - door)) < 0.2) continue;
        if (Math.abs(N.wrap(am + Math.PI / 2)) < 0.42) continue;
        this.segWall(D.x + Math.cos(a0) * D.r, D.z + Math.sin(a0) * D.r, D.x + Math.cos(a1) * D.r, D.z + Math.sin(a1) * D.r, 0.12, 2.3, 'fence');
      }
      const sx = D.x, sz = D.z - D.r + 2.2;
      this.obb(sx, sz, 0, 2.2, 4.2, 1.0, 'prop');
      this.decks.push({ poly: this.rectPoly(sx, sz, 1, 0, 4.0, 2.0), y: 0.9 });
      this.prop('dancefloor', D.x, D.z, 0, { r: D.r, door });
      this.claimPoly(disk, 0.5);
      const ex = D.x + Math.cos(door) * (D.r + 2.4), ez = D.z + Math.sin(door) * (D.r + 2.4);
      this.put('park_dance', ex, ez, N.yawOf(D.x - ex, D.z - ez));
      this.parkData.dance = { x: D.x, z: D.z, r: D.r, door };
      for (const a of [door - 0.55, door + 0.55]) this.parkLamp(D.x + Math.cos(a) * (D.r + 1.6), D.z + Math.sin(a) * (D.r + 1.6));
    },

    parkSide() {
      const park = this.land.find(l => /Автозаводский парк культуры/.test(l.name));
      if (!park) return;
      const P = park.poly, [qx, qz] = PARK.side;
      let best = null, bd = Infinity;
      for (let i = 0; i < P.length; i += 2) {
        const j = (i + 2) % P.length, [d2, t] = N.segDist2(qx, qz, P[i], P[i + 1], P[j], P[j + 1]);
        if (d2 < bd) { bd = d2; const ex = P[j] - P[i], ez = P[j + 1] - P[i + 1], L = Math.hypot(ex, ez) || 1; best = { x: P[i] + ex * t, z: P[i + 1] + ez * t, ux: ex / L, uz: ez / L }; }
      }
      if (!best || bd > 400) return;
      let nx = best.uz, nz = -best.ux;
      if (N.pointInPoly(P, best.x + nx * 4, best.z + nz * 4)) { nx = -nx; nz = -nz; }
      const rot = N.yawOf(nx, nz);
      this.cutFences(best.x, best.z, best.ux, best.uz, 4.6, 2);
      this.prop('pkoarch', best.x, best.z, rot);
      for (const s of [-1, 1]) {
        const x = best.x + best.ux * s * 2.55, z = best.z + best.uz * s * 2.55;
        this.obb(x, z, rot, 0.45, 0.45, 2.6, 'prop');
        const wx = best.x + best.ux * s * 4.6, wz = best.z + best.uz * s * 4.6;
        this.obb(wx, wz, rot, 0.25, 1.6, 2.1, 'prop');
      }
      this.claimPoly(this.rectPoly(best.x, best.z, nx, nz, 4, 6), 0);
      this.put('park_side', best.x + nx * 6, best.z + nz * 6, N.yawOf(-nx, -nz));
      this.parkData.side = { x: best.x, z: best.z, ux: best.ux, uz: best.uz, nx, nz };
    },

    parkAttractions() {
      const A = PARK.attr, W = PARK.wheel;
      const fence = this.fences.find(f => f.pts.some((v, i) => i % 2 === 0 && Math.abs(v - A.fence[0]) < 3 && Math.abs(f.pts[i + 1] - A.fence[1]) < 3) && f.pts.some((v, i) => i % 2 === 0 && Math.abs(v - A.fence[2]) < 3 && Math.abs(f.pts[i + 1] - A.fence[3]) < 3));
      const poly = fence ? fence.pts.slice(0, fence.pts.length - (Math.hypot(fence.pts[0] - fence.pts[fence.pts.length - 2], fence.pts[1] - fence.pts[fence.pts.length - 1]) < 0.5 ? 2 : 0)) : this.rectPoly(-355, 305, 0, 1, 70, 45);
      const area = N.polyArea(poly) < 0 ? N.reversePoly(poly) : poly;
      this.parkData.attr = { poly: area };
      this.clearProps(area, true);
      this.namedAreas.unshift({ name: 'Городок аттракционов', poly: area, box: N.polyBounds(area) });
      const [gx, gz] = A.gate;
      const ex = A.fence[2] - A.fence[0], ez = A.fence[3] - A.fence[1], eL = Math.hypot(ex, ez), gux = ex / eL, guz = ez / eL;
      let gnx = guz, gnz = -gux;
      if (N.pointInPoly(area, gx + gnx * 4, gz + gnz * 4)) { gnx = -gnx; gnz = -gnz; }
      this.cutFences(gx, gz, gux, guz, 3.6, 2);
      const grot = N.yawOf(gnx, gnz);
      this.prop('attrgate', gx, gz, grot);
      for (const sd of [1, -1]) this.signs.push({ x: gx + gnx * 0.14 * sd, y: 5.18, z: gz + gnz * 0.14 * sd, w: 6.8, h: 0.95, nx: gnx * sd, nz: gnz * sd, text: 'ГОРОДОК АТТРАКЦИОНОВ', style: 'paint', color: '#fbf3c8' });
      for (const s of [-1, 1]) this.circle(gx + gux * s * 3.15, gz + guz * s * 3.15, 0.35, 6.5, 'prop');
      this.put('park_attr', gx - gnx * 10, gz - gnz * 10, N.yawOf(-gnx, -gnz));
      this.pedArea(-405, 240, -305, 370, 'park', 7, area);
      this.parkPave(this.rectPoly(gx - gnx * 7, gz - gnz * 7, gnx, gnz, 7, 4.5), 'asphalt2');
      const pave = N.polyArea(A.pave) < 0 ? N.reversePoly(A.pave.slice()) : A.pave.slice();
      this.plazas.push({ poly: pave, tex: 'asphalt2' });
      this.fillPoly(pave, GT.PLAZA, SOFT);
      this.parkData.attr.pave = pave;
      this.parkWheel();
      for (const r of PARK.rides) this.parkRide(r);
      this.parkTir();
      const kx = gx - gnx * 6 - gux * 6.5, kz = gz - gnz * 6 - guz * 6.5, krot = N.yawOf(-gux, -guz);
      this.prop('kiosk', kx, kz, krot, { text: 'КАССА' });
      this.obb(kx, kz, krot, 1.5, 1.5, 2.6, 'prop');
      for (const [dx, dz] of [[-6, -4], [6, 4], [12, -2]]) {
        const x = -330 + dx, z = 300 + dz;
        if (N.pointInPoly(area, x, z) && this.clearAt(x, z, 2)) this.parkTree(x, z, 1.1);
      }
      this.parkAttrFill(area, pave);
      this.claimPoly(area, 0);
    },

    parkAttrFill(area, pave) {
      const A = PARK.attr, [gx, gz] = A.gate;
      const edgeX = (p, z) => { for (let i = 0; i < p.length; i += 2) { const j = (i + 2) % p.length, z0 = p[i + 1], z1 = p[j + 1]; if ((z - z0) * (z - z1) <= 0 && z0 !== z1) { const x = p[i] + (p[j] - p[i]) * (z - z0) / (z1 - z0); if (x < -390) return x; } } return null; };
      const edgeZ = (p, x) => { let best = null; for (let i = 0; i < p.length; i += 2) { const j = (i + 2) % p.length, x0 = p[i], x1 = p[j]; if ((x - x0) * (x - x1) <= 0 && x0 !== x1) { const z = p[i + 1] + (p[j + 1] - p[i + 1]) * (x - x0) / (x1 - x0); if (best === null || z < best) best = z; } } return best; };
      for (let z = 247; z < 366; z += 7.5) {
        const xf = edgeX(area, z), xp = edgeX(pave, z);
        if (xf === null) continue;
        const x = xp === null ? xf + 2.2 : (xf + xp) / 2;
        if (N.pointInPoly(area, x, z)) this.parkTree(x, z, 1.05 + N.hash2(x | 0, z | 0, 3) * 0.2);
      }
      for (let x = -390; x < -342; x += 8.5) {
        if (Math.abs(x - gx) < 9) continue;
        const zf = edgeZ(area, x), zp = edgeZ(pave, x);
        if (zf === null || zp === null) continue;
        const z = (zf + zp) / 2;
        if (N.pointInPoly(area, x, z)) this.parkTree(x, z, 1.1);
      }
      let n = 0;
      for (let z = 283; z < 330; z += 11) { const x = edgeX(pave, z); if (x !== null) this.parkBench(x + 1.1, z, 1, 0, n++ % 2 === 0); }
      for (const x of [-388, -360, -345]) { const z = edgeZ(pave, x); if (z !== null) this.parkBench(x, z + 1.1, 0, 1, n++ % 2 === 0); }
      const W = PARK.wheel, wnx = -Math.sin(W.a), wnz = Math.cos(W.a), wux = Math.cos(W.a), wuz = Math.sin(W.a);
      for (const s of [-1, 1]) this.parkBench(W.x - wnx * 9.5 + wux * s * 6.5, W.z - wnz * 9.5 + wuz * s * 6.5, wnx, wnz, s > 0);
      for (const [kx, kz, fx, fz, text] of A.kiosks) {
        const rot = N.yawOf(fx, fz);
        if (!this.freeAt(kx, kz, 1.6)) continue;
        this.prop('kiosk', kx, kz, rot, { text });
        this.obb(kx, kz, rot, 1.5, 1.5, 2.6, 'prop');
        this.claim(kx - 2.2, kz - 2.2, kx + 2.2, kz + 2.2);
      }
      const lampRun = (pts, step) => {
        let side = 1;
        for (let i = 2; i < pts.length; i += 2) {
          const ax = pts[i - 2], az = pts[i - 1], bx = pts[i], bz = pts[i + 1], L = Math.hypot(bx - ax, bz - az);
          for (let d = step / 2; d < L; d += step) {
            const t = d / L, x = ax + (bx - ax) * t + (az - bz) / L * 2.1 * side, z = az + (bz - az) * t + (bx - ax) / L * 2.1 * side;
            if (N.pointInPoly(area, x, z) && this.parkLamp(x, z)) side = -side;
          }
        }
      };
      for (const f of this.foot) if (f.pts.some((v, i) => i % 2 === 0 && N.pointInPoly(area, v, f.pts[i + 1]))) lampRun(f.pts, 14);
      for (let z = 252; z < 350; z += 16) { const x = edgeX(pave, z); if (x !== null) this.parkLamp(x + 0.5, z); }
    },

    parkWheel() {
      const W = PARK.wheel;
      const ux = Math.cos(W.a), uz = Math.sin(W.a), nx = -uz, nz = ux;
      const yaw = N.yawOf(nx, nz);
      this.prop('ferrisbase', W.x, W.z, yaw, { r: W.r, hub: W.hub });
      for (const s of [-1, 1]) for (const k of [-1, 1]) this.circle(W.x + ux * s * 7.2 + nx * k * 1.9, W.z + uz * s * 7.2 + nz * k * 1.9, 0.45, 3, 'prop');
      this.decks.push({ poly: this.rectPoly(W.x, W.z, ux, uz, 3.4, 2.6), y: 0.6 });
      const sx = W.x - nx * 3.35, sz = W.z - nz * 3.35;
      this.ramps.push(Object.assign({ cx: sx, cz: sz, fx: nx, fz: nz, l: 1.5, w: 4.4, h: 0.5, stair: true }, N.polyBounds(this.rectPoly(sx, sz, nx, nz, 0.75, 2.2))));
      const bx = W.x - nx * 4.4 + ux * 6.2, bz = W.z - nz * 4.4 + uz * 6.2;
      this.obb(bx, bz, yaw, 1.2, 1.2, 2.6, 'prop');
      for (const s of [-1, 1]) this.segWall(W.x + ux * s * 9 - nx * 3.2, W.z + uz * s * 9 - nz * 3.2, W.x + ux * s * 9 + nx * 3.2, W.z + uz * s * 9 + nz * 3.2, 0.1, 1.05, 'fence');
      this.segWall(W.x - ux * 9 + nx * 3.2, W.z - uz * 9 + nz * 3.2, W.x + ux * 9 + nx * 3.2, W.z + uz * 9 + nz * 3.2, 0.1, 1.05, 'fence');
      this.segWall(W.x - ux * 9 - nx * 3.2, W.z - uz * 9 - nz * 3.2, W.x - ux * 2.6 - nx * 3.2, W.z - uz * 2.6 - nz * 3.2, 0.1, 1.05, 'fence');
      this.segWall(W.x + ux * 2.6 - nx * 3.2, W.z + uz * 2.6 - nz * 3.2, W.x + ux * 9 - nx * 3.2, W.z + uz * 9 - nz * 3.2, 0.1, 1.05, 'fence');
      const px = W.x - nx * 5.2, pz = W.z - nz * 5.2;
      this.put('ferris', px, pz, N.yawOf(nx, nz));
      this.signs.push({ x: W.x - nx * 6.4 - ux * 4.6, y: 2.25, z: W.z - nz * 6.4 - uz * 4.6, w: 4.2, h: 0.62, nx: -nx, nz: -nz, text: 'КОЛЕСО ОБОЗРЕНИЯ', style: 'park', post: true });
      this.signs.push({ x: W.x - nx * 5.53 + ux * 6.2, y: 2.05, z: W.z - nz * 5.53 + uz * 6.2, w: 1.6, h: 0.32, nx: -nx, nz: -nz, text: 'БИЛЕТ 20 р.', style: 'board' });
      this.parkData.wheel = Object.assign({}, W, { ux, uz, nx, nz, board: [W.x - nx * 1.2, W.z - nz * 1.2], exit: [W.x - nx * 4.5 + ux * 3.4, W.z - nz * 4.5 + uz * 3.4] });
      this.claimPoly(this.rectPoly(W.x, W.z, ux, uz, 10, 6), 0.5);
    },

    parkRide(r) {
      if (r.type === 'autodrom') {
        const p = this.prop('autodrom', r.x, r.z, r.rot, { hl: r.hl, hw: r.hw });
        const c = Math.cos(r.rot), s = Math.sin(r.rot);
        this.signs.push({ x: r.x + s * (r.hl + 0.46), y: 4.55, z: r.z - c * (r.hl + 0.46), w: 5.2, h: 0.46, nx: s, nz: -c, text: 'АВТОДРОМ', style: 'shop' });
        for (const [lx, lz] of [[-r.hw, -r.hl], [r.hw, -r.hl], [-r.hw, r.hl], [r.hw, r.hl]]) this.circle(r.x + lx * c - lz * s, r.z + lx * s + lz * c, 0.18, 4.5, 'pole');
        for (const side of [-1, 1]) this.segWall(r.x + (-r.hw + 0.6) * c - (side * (r.hl - 0.6)) * s, r.z + (-r.hw + 0.6) * s + (side * (r.hl - 0.6)) * c, r.x + (r.hw - 0.6) * c - (side * (r.hl - 0.6)) * s, r.z + (r.hw - 0.6) * s + (side * (r.hl - 0.6)) * c, 0.3, 0.6, 'prop');
        for (const side of [-1, 1]) {
          const x0 = side * (r.hw - 0.6);
          this.segWall(r.x + x0 * c - (-r.hl + 0.6) * s, r.z + x0 * s + (-r.hl + 0.6) * c, r.x + x0 * c - (-2) * s, r.z + x0 * s + (-2) * c, 0.3, 0.6, 'prop');
          this.segWall(r.x + x0 * c - 2 * s, r.z + x0 * s + 2 * c, r.x + x0 * c - (r.hl - 0.6) * s, r.z + x0 * s + (r.hl - 0.6) * c, 0.3, 0.6, 'prop');
        }
        this.parkData.rides.push({ type: 'autodrom', x: r.x, z: r.z, rot: r.rot, hl: r.hl, hw: r.hw, p });
        return;
      }
      const p = this.prop(r.type, r.x, r.z, 0, { r: r.r });
      this.circle(r.x, r.z, r.type === 'swings' ? 0.7 : r.type === 'waltz' ? 1.2 : r.r * 0.85, 3, 'prop');
      const fr = r.r + 1.2, n = Math.max(12, Math.round(fr * 2.2));
      for (let k = 0; k < n; k++) {
        const a0 = k / n * TAU, a1 = (k + 1) / n * TAU;
        if (k === 0) continue;
        this.segWall(r.x + Math.cos(a0) * fr, r.z + Math.sin(a0) * fr, r.x + Math.cos(a1) * fr, r.z + Math.sin(a1) * fr, 0.08, 1.0, 'fence');
      }
      this.parkData.rides.push({ type: r.type, x: r.x, z: r.z, r: r.r, fr, p });
    },

    parkTir() {
      const T = PARK.tir;
      const c = Math.cos(T.rot), s = Math.sin(T.rot);
      const L = (lx, lz) => [T.x + lx * c - lz * s, T.z + lx * s + lz * c];
      const hw = T.w / 2, D = T.d;
      this.prop('tir', T.x, T.z, T.rot, { w: T.w, d: D });
      const walls = [[-hw, 0, -hw, D], [hw, 0, hw, D], [-hw, D, hw, D]];
      for (const [a0, b0, a1, b1] of walls) { const p0 = L(a0, b0), p1 = L(a1, b1); this.segWall(p0[0], p0[1], p1[0], p1[1], 0.24, 3.4, 'building'); }
      const ca = L(-hw + 0.3, 0.3), cb = L(hw - 0.3, 0.3);
      this.segWall(ca[0], ca[1], cb[0], cb[1], 0.5, 1.05, 'prop');
      const front = L(0, -1.3);
      this.put('tir', front[0], front[1], N.yawOf(-s, c));
      const stand = L(0.3, -0.42);
      const keeper = L(-hw + 0.9, 1.3);
      const wallC = L(0, D - 0.3);
      this.parkData.tir = Object.assign({}, T, { c, s, stand: { x: stand[0], z: stand[1] }, keeper: { x: keeper[0], z: keeper[1] }, wall: { x: wallC[0], z: wallC[1] }, front: { x: front[0], z: front[1] } });
      this.signs.push({ x: L(0, -0.06)[0], y: 2.98, z: L(0, -0.06)[1], w: 3.4, h: 0.8, nx: s, nz: -c, text: 'ТИР', style: 'shop' });
      const pb = L(hw + 0.1, 2.1);
      this.signs.push({ x: pb[0], y: 2.05, z: pb[1], w: 2.1, h: 0.5, nx: c, nz: s, text: '10 ВЫСТРЕЛОВ — 10 р.', style: 'board' });
      const pb2 = L(hw + 0.1, 2.1);
      this.signs.push({ x: pb2[0], y: 1.55, z: pb2[1], w: 2.1, h: 0.42, nx: c, nz: s, text: 'ПРИЗЫ ЗА ВСЕ 10 ПОПАДАНИЙ', style: 'board' });
      this.claimPoly(this.rectPoly(T.x - s * (D / 2), T.z + c * (D / 2), -s, c, D / 2 + 2.5, hw + 1), 0.5);
    },

    parkFoodStalls() {
      PARK.foods.forEach((F, i) => {
        let x = F.x, z = F.z, face = F.face;
        if (F.side) {
          const S = this.parkData.side;
          if (!S) return;
          x = S.x + S.ux * F.side[0] + S.nx * F.side[1];
          z = S.z + S.uz * F.side[0] + S.nz * F.side[1];
          face = [S.nx, S.nz];
        }
        const gl = Math.hypot(face[0], face[1]) || 1, gx = face[0] / gl, gz = face[1] / gl;
        const rot = N.yawOf(gx, gz);
        this.clearProps(this.rectPoly(x, z, gx, gz, 2.6, 2.6));
        this.prop('shawarma', x, z, rot, {});
        this.signs.push({ x: x + gx * 1.38, y: 3.08, z: z + gz * 1.38, w: 2.8, h: 0.6, nx: gx, nz: gz, text: 'ШАУРМА', style: 'shop' });
        this.signs.push({ x: x + gx * 1.37, y: 0.62, z: z + gz * 1.37, w: 3.0, h: 0.38, nx: gx, nz: gz, text: 'ШАУРМА 60 · ДВОЙНАЯ 100 · КВАС 10', style: 'board' });
        this.obb(x, z, rot, 1.35, 1.6, 2.7, 'prop');
        const wx = x + gx * 2.25, wz = z + gz * 2.25;
        const id = 'food_' + F.name;
        this.put(id, wx, wz, N.yawOf(-gx, -gz));
        const rx = -gz, rz = gx;
        for (const k of [-1, 1]) {
          const tx = x + gx * 4.4 + rx * k * 3.1, tz = z + gz * 4.4 + rz * k * 3.1;
          if (this.freeAt(tx, tz, 1.1) && this.ground(tx, tz) !== GT.WATER) { this.prop('cafetable', tx, tz, N.hash2(i, k, 3) * TAU, { tone: (i + k + 2) % 3 }); this.circle(tx, tz, 0.45, 1.0, 'prop'); this.claim(tx - 1.4, tz - 1.4, tx + 1.4, tz + 1.4); }
        }
        this.claimPoly(this.rectPoly(x + gx * 1.6, z + gz * 1.6, gx, gz, 4.2, 3.4), 0.3);
        this.parkData.foods.push({ id, x, z, rot, gx, gz, wx, wz, place: id, vendor: { x: x + gx * 0.42, z: z + gz * 0.42, yaw: N.yawOf(gx, gz) } });
      });
    },

    parkMeet() {
      const [mx, mz] = PARK.meet, [cx, cz] = PARK.cars;
      this.put('park_meet', mx, mz, N.yawOf(1, 0.2));
      this.put('park_cars', cx, cz, N.yawOf(1, 0), { rot: N.yawOf(1, 0) });
      const W = PARK.wheel;
      this.claimPoly(segPoly(W.x, W.z, mx, mz, 13), 0);
    },

    parkTower() {
      const t = this.bNear(-277, -295, 40, b => b.kind === 't');
      if (!t) return;
      t.walkRoof = true;
      for (const it of this.boxes) if (it.ref === t.id) it.walkRoof = true;
      const w = this.wallToRoad(t, e => e.rank >= 2, 6);
      const [dx, dz] = this.at(w, 0, 2.5);
      this.put('tower_door', dx, dz, this.yawOut(w) + Math.PI);
      this.put('tower_roof', t.mb.cx - t.mb.ax * 3, t.mb.cz - t.mb.az * 3, Math.atan2(PARK.square.x - t.mb.cx, -(PARK.square.z - t.mb.cz)), { y: t.h });
      this.prop('roofbox', t.mb.cx + t.mb.ax * 4, t.mb.cz + t.mb.az * 4, 0, { y: t.h });
      this.teleports.push({ id: 'tower', a: 'tower_door', b: 'tower_roof', text: 'Подняться на крышу', back: 'Спуститься' });
      this.towerB = t;
    }
  });

  const STAFF = {
    food: { kind: 'worker', look: { top: '#f0f0ea', pants: '#34363c', topKind: 'jacket', hat: 'none' } },
    tir: { kind: 'pensioner', look: { top: '#4e5a46', pants: '#3a3a36', topKind: 'jacket', hat: 'cap' } }
  };
  const DANCE_KINDS = ['girl', 'student', 'girl', 'dancer', 'student', 'woman', 'gopnik', 'girl', 'worker', 'dancer'];

  class Park {
    constructor(w) {
      this.w = w;
      this.D = w.city.parkData;
      this.wt = 0;
      this.staff = new Map();
      this.lost = new Set();
      this.dancers = [];
      this.rng = N.rng((w.seed || 1) * 131 + 17);
      this.tir = this.D && this.D.tir ? this.makeTir() : null;
    }

    makeTir() {
      const P = N.PARK.tir;
      const figures = P.figures.map((f, i) => Object.assign({ id: i, down: 0, hit: false, spin: 0, swing: 0, t: 0 }, f));
      const ducks = [];
      for (let i = 0; i < P.ducks.n; i++) ducks.push({ kind: 'duck', id: 100 + i, i, down: 0, hit: false, lap: 0 });
      return { T: this.D.tir, P, figures, ducks, on: false, hits: 0, dents: [], bias: [0, 0], endT: -1, resetT: 0, saved: null, rounds: 0 };
    }

    wheelAng() { return N.wheelAngle(this.D.wheel, this.wt); }

    cabin(i, out) { return N.wheelPose(this.D.wheel, this.wheelAng(), i, out); }

    bottomCabin() {
      const W = this.D.wheel, a = this.wheelAng();
      let best = 0, bd = 9;
      for (let i = 0; i < W.n; i++) {
        const ph = ((a + i / W.n * TAU) % TAU + TAU) % TAU, d = Math.min(ph, TAU - ph);
        if (d < bd) { bd = d; best = i; }
      }
      return { i: best, d: bd };
    }

    atBottom(i) { const ph = this.cabin(i).ph; return Math.min(ph, TAU - ph) < 0.17; }

    board(p, o) {
      if (!this.D.wheel || p.ride || p.veh || p.dead) return false;
      const b = this.bottomCabin();
      this.w.resetPed(p);
      p.ride = { i: b.i, t: 0, loop: !!(o && o.loop) };
      this.carry(p);
      this.w.emit({ t: 'ride', on: true, x: p.x, z: p.z });
      return true;
    }

    carry(p) {
      const c = this.cabin(p.ride.i);
      p.x = c.x; p.z = c.z; p.y = c.y + 0.04;
      p.vx = p.vz = p.vy = 0;
      p.wantVx = p.wantVz = 0;
      p.onGround = true;
      p.deck = null;
      p.gy = p.y;
    }

    leave(p, force) {
      if (!p.ride) return false;
      if (!force && !this.atBottom(p.ride.i)) return false;
      const W = this.D.wheel, e = W.exit;
      p.ride = null;
      p.x = e[0]; p.z = e[1]; p.y = this.w.city.groundY(e[0], e[1]);
      p.vx = p.vz = p.vy = 0;
      p.yaw = N.yawOf(-W.nx, -W.nz);
      this.w.emit({ t: 'ride', on: false, x: p.x, z: p.z });
      return true;
    }

    act(p) {
      if (!p.ride) return false;
      if (!this.leave(p)) this.w.emit({ t: 'rideheld' });
      return true;
    }

    rideLeft(p) {
      if (!p.ride) return 0;
      const ph = this.cabin(p.ride.i).ph;
      return (TAU - ph) / TAU * this.D.wheel.period;
    }

    skip(p) {
      if (!p.ride) return false;
      const dt = this.rideLeft(p);
      this.wt += dt;
      p.ride.t += dt;
      this.w.clock = (this.w.clock + dt / 60) % 1440;
      this.carry(p);
      return this.leave(p, true);
    }

    advance(dt) {
      this.wt += dt;
      const pl = this.w.player;
      if (pl.ride) { pl.ride.t += dt; this.carry(pl); }
    }

    eye() {
      const pl = this.w.player;
      if (!pl.ride || pl.dead) return null;
      return { x: pl.x, y: pl.y + 1.56, z: pl.z };
    }

    services() {
      const out = [];
      for (const f of this.D.foods) out.push({ id: f.id, kind: 'food', x: f.vendor.x, z: f.vendor.z, yaw: f.vendor.yaw });
      if (this.D.tir) { const k = this.D.tir.keeper; out.push({ id: 'tir', kind: 'tir', x: k.x, z: k.z, yaw: N.yawOf(this.D.tir.c, this.D.tir.s) }); }
      return out;
    }

    open(id) {
      const p = this.staff.get(id);
      if (!p || p.dead || p.removed) return { ok: false, why: id === 'tir' ? 'Тир закрыт: хозяина нет на месте.' : 'Ларёк закрыт: продавца нет.' };
      if (p.duck > 0) return { ok: false, why: id === 'tir' ? 'Хозяин тира спрятался под прилавок.' : 'Продавец спрятался под прилавок.' };
      if (id !== 'tir' && this.w.wanted.level > 0) return { ok: false, why: 'Продавец захлопнул окошко: «С ментами на хвосте не обслуживаю!»' };
      return { ok: true, p };
    }

    staffStep(dt) {
      const w = this.w, pl = w.player;
      for (const s of this.services()) {
        const d = Math.hypot(s.x - pl.x, s.z - pl.z);
        let p = this.staff.get(s.id);
        if (p && p.removed) { this.staff.delete(s.id); p = null; }
        if (d > 230) {
          if (p) { w.removePed(p); this.staff.delete(s.id); }
          this.lost.delete(s.id);
          continue;
        }
        if (!p && d < 170 && !this.lost.has(s.id)) {
          const st = STAFF[s.kind];
          p = w.spawnPed(st.kind, s.x, s.z, s.yaw, { persistent: true, weapon: 'fists', look: N.makeLook(st.kind, this.rng, st.look) });
          p.fixed = true;
          p.staff = s.id;
          p.y = w.city.groundY(s.x, s.z);
          p.ai = { mode: 'idle', park: true, face: { x: s.x + Math.sin(s.yaw) * 4, z: s.z - Math.cos(s.yaw) * 4 } };
          p.duck = 0;
          this.staff.set(s.id, p);
        }
        if (!p) continue;
        if (p.dead) { this.lost.add(s.id); continue; }
        if (p.ai && p.ai.mode !== 'idle') { p.duck = 18; p.ai = { mode: 'idle', park: true, face: p.ai.face || { x: s.x, z: s.z } }; }
        p.x = s.x; p.z = s.z; p.vx = p.vz = 0; p.wantVx = p.wantVz = 0;
        p.yaw = s.yaw;
        if (p.duck > 0) p.duck = Math.max(0, p.duck - dt);
        p.hidden = p.duck > 0;
      }
    }

    danceStep() {
      const w = this.w, D = this.D.dance;
      if (!D) return;
      const h = w.clock / 60, pl = w.player;
      const on = h >= 19 && h < 23.6 && w.wx.rain < 0.15 && Math.hypot(pl.x - D.x, pl.z - D.z) < 120 && w.settings.ambient !== false;
      this.dancers = this.dancers.filter(p => !p.removed && !p.dead && p.ai && p.ai.park === 'dance');
      if (!on) {
        for (const p of this.dancers) w.removePed(p);
        this.dancers = [];
        return;
      }
      const want = Math.round(6 + 6 * N.smooth(19, 21, h) * (1 - N.smooth(22.6, 23.6, h)));
      while (this.dancers.length < want) {
        const a = this.rng() * TAU, r = Math.sqrt(this.rng()) * (D.r - 1.6);
        const x = D.x + Math.cos(a) * r, z = D.z + Math.sin(a) * r * 0.75 + 1.2;
        const p = w.spawnPed(DANCE_KINDS[this.dancers.length % DANCE_KINDS.length], x, z, this.rng() * TAU, { persistent: true });
        p.ai = { mode: 'idle', dance: true, park: 'dance' };
        this.dancers.push(p);
      }
      while (this.dancers.length > want) w.removePed(this.dancers.pop());
    }

    duckU(dk, t) {
      const P = N.PARK.tir.ducks, gap = P.span / P.n;
      const raw = dk.i * gap + P.speed * t;
      const lap = Math.floor(raw / P.span);
      return { u: raw - lap * P.span - P.span / 2, lap };
    }

    tirLocal(x, z) {
      const T = this.D.tir, rx = x - T.x, rz = z - T.z;
      return [rx * T.c + rz * T.s, -rx * T.s + rz * T.c];
    }

    tirWorld(lx, lz) {
      const T = this.D.tir;
      return [T.x + lx * T.c - lz * T.s, T.z + lx * T.s + lz * T.c];
    }

    tirTargets() {
      const t = this.tir, out = [];
      if (!t) return out;
      for (const f of t.figures) out.push({ tg: f, u: f.u, y: f.y, z: f.z, r: f.r });
      for (const dk of t.ducks) { const q = this.duckU(dk, this.wt); if (Math.abs(q.u) < 3.16) out.push({ tg: dk, u: q.u, y: t.P.ducks.y, z: t.P.ducks.z, r: t.P.ducks.r }); }
      return out;
    }

    rayTir(ox, oy, oz, dx, dy, dz, best) {
      const t = this.tir;
      if (!t) return null;
      const T = t.T;
      if (Math.abs(ox - T.x) > best + 12 || Math.abs(oz - T.z) > best + 12) return null;
      const [lx, lz] = this.tirLocal(ox, oz);
      const ldx = dx * T.c + dz * T.s, ldz = -dx * T.s + dz * T.c;
      if (ldz < 0.05) return null;
      let hit = null, bt = best;
      for (const q of this.tirTargets()) {
        if (q.tg.hit || q.tg.down > 0.01) continue;
        const tt = (q.z - lz) / ldz;
        if (tt <= 0 || tt >= bt) continue;
        const hx = lx + ldx * tt, hy = oy + dy * tt;
        if ((hx - q.u) * (hx - q.u) + (hy - q.y) * (hy - q.y) < q.r * q.r) { bt = tt; hit = { t: tt, kind: 'tir', target: q.tg }; }
      }
      const tw = (t.P.wall - lz) / ldz;
      if (!hit && tw > 0 && tw < bt) {
        const hx = lx + ldx * tw, hy = oy + dy * tw;
        if (Math.abs(hx) < T.w / 2 - 0.15 && hy > 0.3 && hy < 3.35) { bt = tw; hit = { t: tw, kind: 'tir', target: null }; }
      }
      return hit;
    }

    tirHit(hit, p, x, y, z) {
      const t = this.tir, tg = hit.target, mine = t.on && p.isPlayer;
      if (tg) {
        tg.hit = true;
        tg.t = 0;
        if (tg.kind === 'mill' || tg.kind === 'plane') tg.spin = tg.kind === 'mill' ? 9 : 40;
        if (tg.kind === 'bell') tg.swing = 1;
        if (mine) t.hits++;
        this.w.emit({ t: 'tirhit', x, y, z, kind: tg.kind, mine, hits: t.hits });
      } else {
        if (mine) { t.dents.push([x, y, z]); if (t.dents.length > 24) t.dents.shift(); }
        this.w.emit({ t: 'tirmiss', x, y, z, mine });
      }
    }

    biasFor(p, wid) {
      const t = this.tir;
      if (!t || !t.on || !p.isPlayer || wid !== 'izh38') return null;
      const T = t.T, k = 1 / 6.7;
      return [T.c * t.bias[0] * k, t.bias[1] * k, T.s * t.bias[0] * k];
    }

    tirStart(p) {
      const t = this.tir;
      if (!t || t.on || p.veh || p.dead || p.ride) return false;
      const T = t.T, P = t.P;
      this.w.resetPed(p);
      if (p.eat) this.stopEating(p);
      t.saved = { weapons: p.weapons, weapon: p.weapon };
      p.weapons = { fists: { ammo: 1, clip: 0 }, izh38: { ammo: P.shots - 1, clip: 1 } };
      p.weapon = 'izh38';
      p.reloadT = 0;
      p.fireT = 0.4;
      p.tir = true;
      p.x = T.stand.x; p.z = T.stand.z; p.y = this.w.city.groundY(p.x, p.z);
      p.vx = p.vz = p.vy = 0;
      p.yaw = N.yawOf(-T.s, T.c);
      for (const f of t.figures) { f.hit = false; f.down = 0; f.spin = 0; f.swing = 0; }
      for (const d of t.ducks) { d.hit = false; d.down = 0; }
      t.on = true;
      t.hits = 0;
      t.dents = [];
      t.endT = -1;
      t.rounds++;
      const a = this.rng() * TAU, m = N.lerp(P.bias[0], P.bias[1], this.rng());
      t.bias = [Math.cos(a) * m, Math.sin(a) * m];
      this.w.emit({ t: 'tirstart' });
      return true;
    }

    tirStop(quit) {
      const t = this.tir, p = this.w.player;
      if (!t || !t.on) return;
      t.on = false;
      t.resetT = 25;
      p.tir = false;
      p.reloadT = 0;
      if (t.saved) {
        p.weapons = t.saved.weapons;
        p.weapon = p.weapons[t.saved.weapon] ? t.saved.weapon : 'fists';
      }
      t.saved = null;
      this.w.emit({ t: 'tirend', hits: t.hits, shots: t.P.shots, quit: !!quit });
    }

    tirStep(dt) {
      const t = this.tir;
      if (!t) return;
      for (const f of t.figures) {
        if (f.hit) f.down = Math.min(1, f.down + dt * 5);
        f.spin = Math.max(0, f.spin - dt * (f.kind === 'plane' ? 6 : 1.8));
        f.swing = Math.max(0, f.swing - dt * 0.5);
        f.t += dt;
      }
      for (const d of t.ducks) {
        const q = this.duckU(d, this.wt);
        if (q.lap !== d.lap) { d.lap = q.lap; d.hit = false; d.down = 0; }
        if (d.hit) d.down = Math.min(1, d.down + dt * 6);
      }
      const p = this.w.player;
      if (t.on) {
        const sl = p.weapons && p.weapons.izh38;
        if (p.dead || p.veh || !sl) { this.tirStop(true); return; }
        if (sl.clip + sl.ammo <= 0 && !(p.reloadT > 0)) {
          if (t.endT < 0) t.endT = 1.1;
          t.endT -= dt;
          if (t.endT <= 0) this.tirStop(false);
        }
        const T = t.T;
        if (Math.hypot(p.x - T.stand.x, p.z - T.stand.z) > 2.5) { this.tirStop(true); return; }
        p.x = T.stand.x; p.z = T.stand.z;
      } else if (t.resetT > 0) {
        t.resetT -= dt;
        if (t.resetT <= 0) for (const f of t.figures) { f.hit = false; f.down = 0; }
      }
    }

    eat(p, item) {
      p.eat = { id: item.id, t: 0, dur: item.dur, hp: item.hp, got: 0, bite: 0.55 };
      this.w.emit({ t: 'eatstart', id: item.id, p });
    }

    stopEating(p) {
      if (!p.eat) return;
      p.eat = null;
      this.w.emit({ t: 'eatstop', p });
    }

    eatStep(p, dt) {
      const e = p.eat;
      if (!e) return;
      if (p.dead || p.veh || p.state === 'down' || p.ride || p.tir) { this.stopEating(p); return; }
      e.t += dt;
      const want = Math.min(e.hp, e.hp * e.t / e.dur), add = want - e.got;
      if (add > 0) { p.hp = Math.min(p.maxHp, p.hp + add); e.got = want; }
      e.bite -= dt;
      if (e.bite <= 0 && e.t < e.dur - 0.3) { e.bite = e.id === 'kvass' ? 0.7 : 0.9; this.w.emit({ t: 'chew', p, x: p.x, z: p.z, drink: e.id === 'kvass' }); }
      if (e.t >= e.dur) {
        p.eat = null;
        this.w.emit({ t: 'eatdone', id: e.id, p, x: p.x, z: p.z, burp: e.id !== 'kvass' && this.rng() < 0.4 });
      }
    }

    step(dt) {
      this.wt += dt;
      const pl = this.w.player;
      if (pl.ride) {
        if (pl.dead) pl.ride = null;
        else {
          pl.ride.t += dt;
          this.carry(pl);
          if (!pl.ride.loop && pl.ride.t > this.D.wheel.period * 0.9 && this.atBottom(pl.ride.i)) this.leave(pl);
        }
      }
      this.staffStep(dt);
      this.danceStep();
      this.tirStep(dt);
      if (pl.eat) this.eatStep(pl, dt);
    }
  }

  N.Park = Park;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
