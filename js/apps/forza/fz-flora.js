(function (F) {
  'use strict';

  const OC = 2;
  const CS = 10;
  const TAU = Math.PI * 2;
  const W = F.World.prototype;

  const BUSH = {
    hazel: { h: [2.4, 3.8], w: [2.6, 4.2], drag: 0.06, leaf: [0.32, 0.5, 0.2] },
    lilac: { h: [2.2, 3.4], w: [2.2, 3.4], drag: 0.06, leaf: [0.6, 0.45, 0.7] },
    jasmine: { h: [1.6, 2.6], w: [1.8, 2.8], drag: 0.05, leaf: [0.85, 0.88, 0.8] },
    juniper: { h: [1.4, 3.2], w: [0.9, 1.6], drag: 0.05, leaf: [0.2, 0.32, 0.24] },
    willow: { h: [2.2, 3.6], w: [2.4, 3.8], drag: 0.05, leaf: [0.52, 0.6, 0.42] },
    rose: { h: [1.0, 1.8], w: [1.4, 2.4], drag: 0.04, leaf: [0.82, 0.4, 0.5] },
    fir: { h: [1.2, 3.0], w: [1.0, 2.0], drag: 0.07, leaf: [0.16, 0.3, 0.2] },
    sapling: { h: [2.5, 4.5], w: [1.2, 2.2], drag: 0.04, leaf: [0.55, 0.68, 0.3] },
    hedge: { h: [1.0, 1.5], w: [0.9, 1.3], drag: 0.09, leaf: [0.3, 0.46, 0.22] },
    ant: { h: [0.6, 1.0], w: [1.4, 2.2], drag: 0.03, leaf: [0.4, 0.28, 0.16] }
  };
  const COVER = ['grass', 'lawn', 'tall', 'dry', 'daisy', 'yellow', 'lupin', 'fern', 'berry', 'reed', 'dune', 'nettle'];
  const CK = {};
  COVER.forEach((k, i) => { CK[k] = i + 1; });
  const COUNTRY = new Set(['spilve']);
  const URBAN = new Set(['hansa', 'jugend']);
  const SOVIET = new Set(['soviet', 'khrush']);
  const HOUSES = new Set(['wood', 'villa']);
  const WASTE = new Set(['industry', 'port']);
  const SKIP = new Set(['airport', 'tirgus', 'zakusala']);

  W.speciesPass = function () {
    const D = this.shoreMap();
    for (const t of this.trees) {
      if (t.street || t.kind === 'pine' || t.kind === 'spruce' || t.kind === 'apple') continue;
      const h = F.hash2(Math.round(t.x * 10), Math.round(t.z * 10), 61), gi = this.gi(t.x, t.z);
      const d = this.districtAt(t.x, t.z), st = d ? d.style : null, oi = this.oi(t.x, t.z), park = oi >= 0 && this.occ[oi] === 5 && this.inPark(t.x, t.z);
      if (D[gi] <= 1 && !URBAN.has(st)) { if (h < 0.3) t.kind = 'willow'; continue; }
      if (SOVIET.has(st) && !park) {
        if (t.kind === 'birch' && h < 0.35) t.kind = 'poplar';
        else if (t.kind === 'linden') t.kind = h < 0.18 ? 'poplar' : h < 0.4 ? 'maple' : 'linden';
        continue;
      }
      if (t.kind === 'linden' && (park || URBAN.has(st) || HOUSES.has(st))) { t.kind = h < 0.22 ? 'chestnut' : h < 0.44 ? 'maple' : 'linden'; continue; }
      if (t.kind === 'linden' && !d && h < 0.18) t.kind = 'maple';
    }
  };

  W.inPark = function (x, z) {
    for (const p of this.map.PARKS) {
      if (p.plaza || p.field) continue;
      const bb = p.bb || (p.bb = F.polyBox(p.poly));
      if (x >= bb.x0 && x <= bb.x1 && z >= bb.z0 && z <= bb.z1 && F.inPoly(x, z, p.poly)) return p;
    }
    return null;
  };

  W.shoreMap = function () {
    if (this.landShore) return this.landShore;
    const n = this.nx * this.nz, D = new Uint8Array(n).fill(255), q = [];
    for (let i = 0; i < n; i++) if (this.water[i]) { D[i] = 0; q.push(i); }
    for (let h = 0; h < q.length; h++) {
      const i = q[h], d = D[i] + 1;
      if (d > 8) continue;
      const ix = i % this.nx;
      for (const j of [ix > 0 ? i - 1 : -1, ix < this.nx - 1 ? i + 1 : -1, i - this.nx, i + this.nx]) if (j >= 0 && j < n && D[j] > d) { D[j] = d; q.push(j); }
    }
    this.landShore = D;
    return D;
  };

  W.floraMasks = function () {
    const M = new Uint8Array(this.onx * this.onz), b = this.b;
    const mark = bit => i => { M[i] |= bit; };
    if (this.rail) for (let i = 0; i + 1 < this.rail.pts.length; i++) { const p = this.rail.pts[i], q = this.rail.pts[i + 1]; this.rasterSeg(p[0], p[1], q[0], q[1], 4.5, mark(1)); }
    for (const lm of this.landmarks) {
      const d = lm.def;
      if (d.soft && d.box) this.rasterRect(lm.x, lm.z, Math.cos(lm.yaw), Math.sin(lm.yaw), d.box[0] / 2 + 3, d.box[1] / 2 + 3, mark(2));
    }
    if (this.festPads) for (const pd of this.festPads.list) F.fillPoly(M, this.onx, this.onz, b.x0 + OC / 2, b.z0 + OC / 2, OC, pd.poly, mark(2));
    for (const r of this.ramps || []) {
      const fx = Math.sin(r.yaw), fz = -Math.cos(r.yaw);
      this.rasterSeg(r.x - fx * 15, r.z - fz * 15, r.x + fx * 80, r.z + fz * 80, 26, mark(4));
    }
    for (const o of this.map.OUTPOSTS || []) this.rasterDisc(o.x, o.z, 24, mark(4));
    const hub = this.map.HUB;
    if (hub) this.rasterDisc(hub.x, hub.z, 60, mark(4));
    if (F.EV && F.Route) {
      for (const ev of F.EV.EVENTS) {
        const r = F.Route.fromVia(this, ev.via, !!ev.closed, ev.pref || null);
        for (let i = 0; i < r.n; i += 3) {
          const j = Math.min(r.n - 1, i + 3), R = r.hw[i] + 6 + Math.min(10, Math.abs(r.curv[i]) * 900);
          this.rasterSeg(r.x[i], r.z[i], r.x[j], r.z[j], R, mark(8));
        }
      }
    }
    const fk = new Uint8Array(this.nx * this.nz);
    for (const f of this.map.FORESTS) F.fillPoly(fk, this.nx, this.nz, b.x0, b.z0, CS, f.poly, i => { fk[i] = f.kind === 'pine' ? 1 : 2; });
    this.floraMask = M;
    this.forestKind = fk;
  };

  W.roadGap = function (x, z, R = 20) {
    const buf = this.gapBuf || (this.gapBuf = []);
    buf.length = 0;
    let best = R;
    for (const sg of this.segGrid.query(x - R, z - R, x + R, z + R, buf, F.stamp())) {
      const d = F.segDist(x, z, sg.ax, sg.az, sg.bx, sg.bz).d - sg.hw - (sg.side || 0);
      if (d < best) best = d;
    }
    return best;
  };

  W.coverAt = function (x, z) {
    const i = this.oi(x, z);
    if (i < 0) return this.out && this.outside(x, z) ? this.outCover(x, z) : 0;
    const O = this.occ[i];
    if (O === 2 || O === 3 || O === 4 || O === 8 || this.patchSurf[i] || (this.floraMask[i] & 3)) return 0;
    const gi = this.gi(x, z), bi = this.biome[gi];
    if (bi === 0) return 0;
    let gap = -1;
    const roadGap = () => (gap < 0 ? (gap = this.roadGap(x, z, 12)) : gap);
    if (O === 1 && roadGap() > 2.4) return 0;
    if (roadGap() < 0.35) return 0;
    const dist = this.district[gi], d = dist ? this.districts[dist - 1] : null, st = d ? d.style : null;
    const n1 = F.noise2(x / 9, z / 9, 71), n2 = F.noise2(x / 27, z / 27, 72);
    const shore = this.landShore[gi];
    if (shore <= 1 && bi !== 1 && !URBAN.has(st) && (this.isWaterAt(x + 3, z) || this.isWaterAt(x - 3, z) || this.isWaterAt(x, z + 3) || this.isWaterAt(x, z - 3))) return n1 > 0.3 ? CK.reed * 16 + 13 : CK.tall * 16 + 8;
    if (bi === 1) return shore >= 3 && n1 > 0.32 ? CK.dune * 16 + 9 : 0;
    if (bi === 4) {
      const pine = this.forestKind[gi] === 1;
      if (pine) return n1 > 0.42 ? CK.berry * 16 + 10 : n2 > 0.7 ? CK.fern * 16 + 7 : CK.grass * 16 + 3;
      return n1 > 0.5 ? CK.fern * 16 + 10 : n2 < 0.3 ? CK.berry * 16 + 7 : CK.grass * 16 + 4;
    }
    if (bi === 6 || WASTE.has(st)) return n1 > 0.6 ? CK.nettle * 16 + 9 : CK.dry * 16 + 6;
    if (bi === 5 || bi === 9 || bi === 8 || URBAN.has(st)) return O === 7 || O === 5 ? CK.lawn * 16 + 6 : 0;
    if (bi === 7 || (d && SKIP.has(d.id))) return CK.lawn * 16 + 5;
    if (O === 6) return CK.lawn * 16 + 6;
    const country = !d || COUNTRY.has(d.id) || st === 'none';
    if (country && !d) {
      const g = roadGap();
      if (g > 1 && g < 9 && n2 > 0.56) return CK.lupin * 16 + 11;
      if (g < 2.6) return CK.tall * 16 + 10;
      if (n1 > 0.64) return CK.daisy * 16 + 9;
      if (n1 < 0.16) return CK.yellow * 16 + 8;
      return CK.tall * 16 + 9;
    }
    if (SOVIET.has(st) || bi === 3) {
      if (n1 > 0.66) return CK.yellow * 16 + 8;
      if (n2 > 0.78) return CK.daisy * 16 + 7;
      return CK.lawn * 16 + 7;
    }
    if (HOUSES.has(st)) return n1 > 0.7 ? CK.daisy * 16 + 8 : n1 < 0.15 ? CK.yellow * 16 + 7 : CK.grass * 16 + 7;
    return n1 > 0.7 ? CK.daisy * 16 + 8 : CK.grass * 16 + 8;
  };

  W.floraOk = function (x, z, o) {
    const i = this.oi(x, z);
    if (i < 0) return false;
    const O = this.occ[i];
    if (!(O === 0 || O === 5 || O === 7 || (o.glade && O === 6))) return false;
    if (this.patchSurf[i] || (this.floraMask[i] & (o.solid ? 15 : 11))) return false;
    const r = o.r || 0.5;
    if (r > 0.9) {
      for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
        const k = this.oi(x + dx, z + dz);
        if (k < 0 || this.patchSurf[k]) return false;
        const v = this.occ[k];
        if (v === 2 || v === 3 || v === 4 || v === 8) return false;
      }
    }
    if (this.roadGap(x, z, Math.max(12, o.road + 2)) < o.road) return false;
    if (this.nodeNear(x, z, o.node || 6)) return false;
    const d = this.districtAt(x, z);
    if (d && (d.style === 'airport' || SKIP.has(d.id))) return false;
    const R = r + (o.gap || 0.8) + 3;
    const box = { x, z, fx: 1, fz: 0, rx: 0, rz: 1, hl: r + (o.gap || 0.8), hw: r + (o.gap || 0.8) };
    const C = F.Coll;
    for (const c of this.colliders(x - R, z - R, x + R, z + R)) {
      let hit = null;
      if (c.k === 'box') hit = C.obbObb(box, c);
      else if (c.k === 'poly') hit = C.obbPoly(box, c);
      else if (c.k === 'seg' || (c.k === 'brush' && c.x1 !== undefined)) hit = C.obbSeg(box, c);
      else hit = C.obbCirc(box, c.x, c.z, c.r);
      if (hit) return false;
    }
    const pg = this.floraProps;
    if (pg) {
      const near = pg.query(x - R, z - R, x + R, z + R, [], F.stamp());
      for (const p of near) if (Math.hypot(p.x - x, p.z - z) < r + (p.r || 0.8) + 0.6) return false;
    }
    return true;
  };

  W.nodeNear = function (x, z, extra) {
    const g = this.nodeGrid;
    if (!g) return this.nearNode(x, z, extra);
    for (const nd of g.query(x - 40, z - 40, x + 40, z + 40, this.nodeBuf || (this.nodeBuf = []), F.stamp())) if (Math.hypot(nd.x - x, nd.z - z) < nd.r + extra) { this.nodeBuf.length = 0; return nd; }
    this.nodeBuf.length = 0;
    return null;
  };

  W.addFlora = function (f) {
    f.y = this.terrainH(f.x, f.z);
    this.flora.push(f);
    const c = this.floraCollider(f);
    if (c) f.col = this.addCollider(c);
    const r = f.type === 'hedge' ? f.len / 2 + f.w : f.type === 'pile' ? f.len / 2 + 1 : f.type === 'log' ? f.len / 2 + 0.6 : f.r || 1;
    this.floraProps.add({ x: f.x, z: f.z, r: f.type === 'hedge' || f.type === 'log' || f.type === 'pile' ? 0.8 : r }, f.x - r, f.z - r, f.x + r, f.z + r);
    return f;
  };

  W.floraCollider = function (f) {
    const y = f.y;
    if (f.type === 'bush') return { k: 'brush', x: f.x, z: f.z, r: f.w * 0.36, drag: BUSH[f.kind].drag, y0: y - 1, y1: y + f.h, src: f };
    if (f.type === 'hedge') {
      const tx = Math.sin(f.yaw), tz = -Math.cos(f.yaw), l = f.len / 2;
      return { k: 'brush', x: f.x, z: f.z, r: l + f.w / 2, x1: f.x - tx * l, z1: f.z - tz * l, x2: f.x + tx * l, z2: f.z + tz * l, w: f.w / 2, drag: BUSH.hedge.drag, y0: y - 1, y1: y + f.h, src: f, seg: true };
    }
    if (f.type === 'rock') return f.kind === 'boulder' ? { k: 'circ', x: f.x, z: f.z, r: f.r * 0.86, y0: y - 1, y1: y + f.h, src: f } : null;
    if (f.type === 'stump') return { k: 'circ', x: f.x, z: f.z, r: f.r + 0.05, y0: y - 1, y1: y + f.h, src: f };
    if (f.type === 'log') {
      const tx = Math.sin(f.yaw), tz = -Math.cos(f.yaw), l = f.len / 2;
      return { k: 'seg', x1: f.x - tx * l, z1: f.z - tz * l, x2: f.x + tx * l, z2: f.z + tz * l, r: f.r + 0.05, y0: y - 1, y1: y + f.r * 2 + 0.1, src: f };
    }
    if (f.type === 'pile') return { k: 'box', x: f.x, z: f.z, hx: f.len / 2, hz: f.d / 2, c: Math.cos(f.yaw + Math.PI / 2), s: Math.sin(f.yaw + Math.PI / 2), y0: y - 1, y1: y + f.h, src: f };
    return null;
  };

  W.putBush = function (rng, kind, x, z, o = {}) {
    const B = BUSH[kind];
    const s = o.s || 1, h = rng.range(B.h[0], B.h[1]) * s, w = rng.range(B.w[0], B.w[1]) * s;
    if (!this.floraOk(x, z, { r: w * 0.4, road: o.road || 3, node: 8, glade: o.glade })) return null;
    return this.addFlora({ type: 'bush', kind, x, z, h, w, yaw: rng() * TAU, seed: Math.floor(rng() * 1e6) });
  };

  W.putRock = function (rng, x, z, R, o = {}) {
    const big = R >= 0.6;
    if (!this.floraOk(x, z, { r: R, road: big ? o.road || 6 : 1.5, node: big ? 15 : 6, solid: big })) return null;
    return this.addFlora({ type: 'rock', kind: big ? 'boulder' : 'stone', x, z, r: R, h: R * rng.range(0.55, 0.85), yaw: rng() * TAU, moss: o.moss ? rng.range(0.3, 0.8) : rng.range(0, 0.25), seed: Math.floor(rng() * 1e6) });
  };

  W.putStones = function (rng, x, z, n, spread) {
    for (let k = 0; k < n; k++) {
      const a = rng() * TAU, d = rng.range(0.8, spread);
      this.putRock(rng, x + Math.cos(a) * d, z + Math.sin(a) * d, rng.range(0.14, 0.42));
    }
  };

  W.lineOk = function (x, z, yaw, len, r, o) {
    const tx = Math.sin(yaw), tz = -Math.cos(yaw), n = 2 * Math.max(1, Math.ceil(len / 3.2));
    for (let k = 0; k <= n; k++) {
      const t = k / n - 0.5;
      if (!this.floraOk(x + tx * len * t, z + tz * len * t, Object.assign({ r }, o))) return false;
    }
    return true;
  };

  W.forestFlora = function (rng) {
    for (const f of this.map.FORESTS) {
      const pine = f.kind === 'pine', bb = F.polyBox(f.poly), area = F.polyArea(f.poly);
      const scatter = (dens, fn) => {
        const n = Math.round(area * dens);
        for (let k = 0; k < n; k++) {
          const x = rng.range(bb.x0, bb.x1), z = rng.range(bb.z0, bb.z1);
          if (F.inPoly(x, z, f.poly)) fn(x, z);
        }
      };
      if (pine) {
        scatter(0.0005, (x, z) => this.putBush(rng, 'juniper', x, z));
        scatter(0.00022, (x, z) => this.putBush(rng, 'fir', x, z));
        scatter(0.00016, (x, z) => this.putBush(rng, 'ant', x, z, { road: 4 }));
      } else {
        scatter(0.0007, (x, z) => this.putBush(rng, 'hazel', x, z));
        scatter(0.00035, (x, z) => this.putBush(rng, 'fir', x, z));
        scatter(0.00018, (x, z) => this.putBush(rng, 'sapling', x, z));
      }
      scatter(pine ? 0.00005 : 0.00008, (x, z) => { const r = this.putRock(rng, x, z, rng.range(0.7, 1.7), { moss: true }); if (r) this.putStones(rng, x, z, rng.int(0, 3), 4); });
      scatter(pine ? 0.00028 : 0.00024, (x, z) => {
        const r = rng.range(0.25, 0.45);
        if (this.floraOk(x, z, { r: r + 0.3, road: 6, node: 15, solid: true })) this.addFlora({ type: 'stump', x, z, r, h: rng.range(0.3, 0.7), yaw: rng() * TAU, seed: Math.floor(rng() * 1e6) });
      });
      scatter(pine ? 0.0001 : 0.0002, (x, z) => {
        const len = rng.range(4, 9), r = rng.range(0.16, 0.3), yaw = rng() * TAU;
        if (this.lineOk(x, z, yaw, len, r + 0.4, { road: 6, node: 15, solid: true })) this.addFlora({ type: 'log', x, z, len, r, yaw, seed: Math.floor(rng() * 1e6) });
      });
      const edge = pine ? ['juniper', 'fir', 'rose', 'fir'] : ['hazel', 'hazel', 'rose', 'fir', 'sapling'];
      for (let i = 0, j = f.poly.length - 1; i < f.poly.length; j = i++) {
        const a = f.poly[j], c = f.poly[i], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
        if (L < 1) continue;
        const tx = (c[0] - a[0]) / L, tz = (c[1] - a[1]) / L;
        for (let s = rng.range(2, 10); s < L; s += rng.range(6, 15)) {
          let nx = -tz, nz = tx;
          const px = a[0] + tx * s, pz = a[1] + tz * s;
          if (!F.inPoly(px + nx * 4, pz + nz * 4, f.poly)) { nx = -nx; nz = -nz; }
          const off = rng.range(2, 10);
          this.putBush(rng, rng.pick(edge), px + nx * off, pz + nz * off);
        }
      }
    }
  };

  W.parkFlora = function (rng) {
    for (const p of this.map.PARKS) {
      if (p.plaza || p.field || p.trees === 'none') continue;
      const bb = F.polyBox(p.poly), n = Math.round(F.polyArea(p.poly) * 0.00028);
      for (let k = 0; k < n; k++) {
        const x = rng.range(bb.x0, bb.x1), z = rng.range(bb.z0, bb.z1);
        if (!F.inPoly(x, z, p.poly) || F.polyEdgeDist(x, z, p.poly) < 4) continue;
        const kind = rng.pick(['lilac', 'jasmine', 'lilac', 'rose', 'hazel']), m = rng.int(2, 5);
        for (let q = 0; q < m; q++) {
          const a = rng() * TAU, d = q ? rng.range(1.8, 4.5) : 0;
          this.putBush(rng, kind, x + Math.cos(a) * d, z + Math.sin(a) * d, { road: 3 });
        }
      }
    }
  };

  W.yardFlora = function (rng) {
    for (const bd of this.buildings) {
      if (!bd.tx || bd.style === undefined) continue;
      const nx = -bd.tz, nz = bd.tx;
      if (SOVIET.has(bd.style) && bd.w >= 16) {
        const off = bd.d / 2 + 12, front = this.roadGap(bd.x + nx * off, bd.z + nz * off, 60) <= this.roadGap(bd.x - nx * off, bd.z - nz * off, 60) ? 1 : -1;
        for (const side of [front, -front]) {
          const base = bd.d / 2 + (side === front ? 3.8 : 1.6), hl = bd.w / 2 - 2;
          let s = -hl + rng.range(0, 3);
          while (s < hl - 2) {
            const len = Math.min(hl - s, rng.range(4, 8));
            if (len < 2.5) break;
            const mid = s + len / 2;
            if (Math.abs(mid) < 4 && side === front) { s += 4.5; continue; }
            let placed = false;
            for (const off of [base, base + 1.4, base + 2.8]) {
              const x = bd.x + bd.tx * mid + nx * side * off, z = bd.z + bd.tz * mid + nz * side * off, yaw = Math.atan2(bd.tx, -bd.tz);
              const w = rng.range(0.9, 1.25), h = rng.range(0.9, 1.4);
              if (rng() < 0.62 && this.lineOk(x, z, yaw, len, w / 2 + 0.2, { road: 2, node: 6 })) {
                this.addFlora({ type: 'hedge', x, z, yaw, len, w, h, seed: Math.floor(rng() * 1e6) });
                placed = true;
                break;
              }
            }
            if (!placed && rng() < 0.55) {
              const x = bd.x + bd.tx * mid + nx * side * (base + 1.2), z = bd.z + bd.tz * mid + nz * side * (base + 1.2);
              this.putBush(rng, rng.pick(['lilac', 'lilac', 'jasmine', 'rose']), x, z, { road: 2.5 });
            }
            s += len + rng.range(1.5, 4);
          }
        }
      } else if (HOUSES.has(bd.style)) {
        const n = rng.int(0, 3);
        for (let k = 0; k < n; k++) {
          const along = rng.range(-0.5, 0.5) * bd.w, side = rng() < 0.75 ? -(bd.front || 1) : rng() < 0.5 ? 1 : -1, off = bd.d / 2 + rng.range(2, 6);
          const x = bd.x + bd.tx * along + nx * side * off, z = bd.z + bd.tz * along + nz * side * off;
          this.putBush(rng, rng.pick(['lilac', 'jasmine', 'lilac', 'rose', 'hazel']), x, z, { road: 2.5 });
        }
      }
    }
  };

  W.shoreFlora = function (rng) {
    const D = this.landShore, nx = this.nx;
    for (let i = 0; i < D.length; i++) {
      if (D[i] < 1 || D[i] > 2) continue;
      const x = this.b.x0 + (i % nx) * CS, z = this.b.z0 + Math.floor(i / nx) * CS;
      if (this.biome[i] === 1 || F.noise2(x / 40, z / 40, 81) < 0.55 || rng() > 0.32) continue;
      const d = this.districtAt(x, z);
      if (d && (URBAN.has(d.style) || d.own)) continue;
      this.putBush(rng, 'willow', x + rng.range(-4, 4), z + rng.range(-4, 4), { road: 3 });
    }
  };

  W.countryAt = function (x, z) {
    const d = this.districtAt(x, z);
    return (!d || COUNTRY.has(d.id)) && this.biome[this.gi(x, z)] === 2;
  };

  W.fieldFlora = function (rng) {
    const b = this.b, area = (b.x1 - b.x0) * (b.z1 - b.z0);
    const n = Math.round(area * 0.000012);
    for (let k = 0; k < n; k++) {
      const x = rng.range(b.x0 + 40, b.x1 - 40), z = rng.range(b.z0 + 40, b.z1 - 40);
      if (!this.countryAt(x, z)) continue;
      const r = this.putRock(rng, x, z, rng.range(0.6, 2.2), { road: 7 });
      if (r) this.putStones(rng, x, z, rng.int(1, 4), 4.5);
    }
    for (let k = 0; k < Math.round(area * 0.00002); k++) {
      const x = rng.range(b.x0 + 40, b.x1 - 40), z = rng.range(b.z0 + 40, b.z1 - 40);
      if (this.countryAt(x, z)) this.putBush(rng, rng.pick(['rose', 'hazel', 'willow', 'sapling']), x, z, { road: 4 });
    }
    this.bales = [];
    for (let g = 0, tries = 0; g < 46 && tries < 4000; tries++) {
      const x = rng.range(b.x0 + 60, b.x1 - 60), z = rng.range(b.z0 + 60, b.z1 - 60);
      if (!this.countryAt(x, z) || this.roadGap(x, z, 30) < 14) continue;
      if (this.buildings.some(bd => Math.abs(bd.x - x) < 50 && Math.abs(bd.z - z) < 50)) continue;
      const yaw = rng() * TAU, tx = Math.sin(yaw), tz = -Math.cos(yaw), m = rng.int(3, 7), gapL = rng.range(6, 10), wrap = rng() < 0.3;
      let put = 0;
      for (let q = 0; q < m; q++) {
        const t = (q - (m - 1) / 2) * gapL, px = x + tx * t + rng.range(-1, 1), pz = z + tz * t + rng.range(-1, 1);
        if (!this.countryAt(px, pz) || !this.floraOk(px, pz, { r: 1.1, road: 8, node: 15, solid: true })) continue;
        const p = { type: 'bale', x: px, z: pz, y: this.terrainH(px, pz), yaw: yaw + Math.PI / 2 + rng.range(-0.3, 0.3), smash: true, mass: 240, r: 0.9, wrap };
        this.props.push(p);
        p.col_ = this.addCollider({ k: 'smash', x: px, z: pz, r: 0.9, mass: 240, y0: p.y - 1, y1: p.y + 2, src: p });
        this.floraProps.add({ x: px, z: pz, r: 1 }, px - 1, pz - 1, px + 1, pz + 1);
        this.bales.push(p);
        put++;
      }
      if (put) g++;
    }
  };

  W.roadsideFlora = function (rng) {
    for (const e of this.edges) {
      if (e.bridge || e.own || e.len < 60) continue;
      const m = this.edgePoint(e, e.len / 2);
      if (!this.countryAt(m.x, m.z)) continue;
      for (let s = rng.range(10, 40); s < e.len - 10; s += rng.range(28, 75)) {
        const p = this.edgePoint(e, s), side = rng() < 0.5 ? -1 : 1, edge = e.hw + (e.k.side || 0);
        if (rng() < 0.12) {
          const off = edge + rng.range(8, 14), x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
          const r = this.putRock(rng, x, z, rng.range(0.6, 1.3), { road: 7 });
          if (r) this.putStones(rng, x, z, rng.int(0, 2), 3);
          continue;
        }
        const off = edge + rng.range(3.5, 9), x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
        const kind = rng.pick(['rose', 'willow', 'hazel', 'sapling', 'rose']), m2 = rng.int(1, 3);
        for (let q = 0; q < m2; q++) this.putBush(rng, kind, x + p.tx * q * rng.range(1.8, 3), z + p.tz * q * rng.range(1.8, 3), { road: 3.5 });
      }
    }
  };

  W.wasteFlora = function (rng) {
    for (const d of this.districts) {
      if (!WASTE.has(d.style)) continue;
      const bb = F.polyBox(d.poly), n = Math.round(F.polyArea(d.poly) * 0.00022);
      for (let k = 0; k < n; k++) {
        const x = rng.range(bb.x0, bb.x1), z = rng.range(bb.z0, bb.z1);
        if (F.inPoly(x, z, d.poly)) this.putBush(rng, rng.pick(['sapling', 'sapling', 'willow', 'rose']), x, z, { road: 3 });
      }
    }
  };

  W.forestPiles = function (rng) {
    for (const e of this.edges) {
      if (e.bridge || e.own || e.kind === 'hwy' || e.len < 120) continue;
      const m = this.edgePoint(e, e.len / 2);
      if (this.forestKind[this.gi(m.x, m.z)] === 0) continue;
      for (let s = rng.range(40, 160); s < e.len - 40; s += rng.range(180, 340)) {
        const p = this.edgePoint(e, s);
        if (this.forestKind[this.gi(p.x, p.z)] === 0) continue;
        const side = rng() < 0.5 ? -1 : 1, len = rng.range(4, 6), dep = rng.range(1.6, 2.2), h = rng.range(1.1, 1.6);
        const off = e.hw + (e.k.side || 0) + 5 + dep / 2, x = p.x + p.rx * off * side, z = p.z + p.rz * off * side, yaw = Math.atan2(p.tx, -p.tz);
        if (this.lineOk(x, z, yaw, len, dep / 2 + 0.3, { road: 5, node: 20, solid: true })) this.addFlora({ type: 'pile', x, z, yaw, len, d: dep, h, seed: Math.floor(rng() * 1e6) });
      }
    }
  };

  W.buildFlora = function () {
    this.flora = [];
    this.shoreMap();
    this.floraMasks();
    this.speciesPass();
    const pg = new F.Grid(12);
    for (const p of this.props) pg.add(p, p.x - 1, p.z - 1, p.x + 1, p.z + 1);
    for (const p of this.parked || []) pg.add({ x: p.x, z: p.z, r: 2.6 }, p.x - 3, p.z - 3, p.x + 3, p.z + 3);
    this.floraProps = pg;
    this.nodeGrid = new F.Grid(40);
    for (const nd of this.nodes) this.nodeGrid.add(nd, nd.x - 1, nd.z - 1, nd.x + 1, nd.z + 1);
    const seed = this.seed + 263;
    this.forestPiles(F.rng(seed + 1));
    this.forestFlora(F.rng(seed + 2));
    this.parkFlora(F.rng(seed + 3));
    this.yardFlora(F.rng(seed + 4));
    this.shoreFlora(F.rng(seed + 5));
    this.fieldFlora(F.rng(seed + 6));
    this.roadsideFlora(F.rng(seed + 7));
    this.wasteFlora(F.rng(seed + 8));
    this.floraProps = null;
    this.nodeGrid = null;
  };

  F.FLORA = { BUSH, COVER, CK };
})(globalThis.Forza = globalThis.Forza || {});
