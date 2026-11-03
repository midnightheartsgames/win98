(function (F) {
  'use strict';

  const S = F.S;
  const OC = 2;
  const PAVED = 8;
  const RANK = { hwy: 4, ave: 3, str: 2, old: 1, lane: 1 };
  const STREET_CARS = ['vaz2105', 'vaz2105', 'vaz2108', 'vaz2108', 'zaz968', 'moskvich2141', 'niva', 'gaz24', 'golf2', 'golf2', 'audi80', 'audi80', 'mazda626', 'e30', 'merc190', 'w124', 'sierra', 'uaz469'];
  const AIRPORT_CARS = ['golf2', 'audi80', 'audi80', 'mazda626', 'e30', 'merc190', 'w124', 'w124', 'vaz2108', 'vaz2105', 'gaz24', 'sierra', 'm5e39', 'celica'];
  const LTV_CARS = ['gaz24', 'gaz24', 'w124', 'audi80', 'audi80', 'golf2', 'vaz2108', 'vaz2105', 'mazda626', 'merc190', 'e30', 'moskvich2141'];
  const KIOSKS = ['prese', 'kafija', 'ziedi', 'loto', 'valuta', 'saldejums', 'hotdog', 'tabaka'];
  const TENTS = ['fruit', 'veg', 'flowers', 'clothes', 'honey', 'fish'];
  const LV = {
    vecriga: 'Vecrīga', centrs: 'Centrs', maskavas: 'Maskavas forštate', skanste: 'Skanste', petersala: 'Pētersala', avoti: 'Avoti', kipsala: 'Ķīpsala',
    agenskalns: 'Āgenskalns', tornakalns: 'Torņakalns', zakusala: 'Zaķusala', lucavsala: 'Lucavsala', dachi: 'Pārdaugava', kengarags: 'Ķengarags',
    purvciems: 'Purvciems', port: 'Rīgas osta', mezaparks: 'Mežaparks', vecmilgravis: 'Vecmīlgrāvis', ziepniekkalns: 'Ziepniekkalns', imanta: 'Imanta',
    zolitude: 'Zolitūde', airport: 'Lidosta', spilve: 'Spilve', bolderaja: 'Bolderāja', jurmala: 'Jūrmala', bikernieki: 'Biķernieki', tirgus: 'Centrāltirgus',
    ziepnieks: 'Ziepniekkalns', bauskas: 'Ziepniekkalns', csdd: 'Ziepniekkalns', bisumuiza: 'Bišumuiža', kometas: 'Bišumuiža', piens: 'Bišumuiža', muiza: 'Bišumuiža'
  };
  const GARDEN_CARS = ['zaz968', 'zaz968', 'moskvich2141', 'moskvich2141', 'vaz2105', 'vaz2105', 'niva', 'gaz24', 'vaz2108', 'uaz469'];
  const HUT_COLS = ['#7a9a62', '#6a88a8', '#c8b26a', '#a8785a', '#d8d4c4', '#8a6a48', '#b85a4a', '#5a7a6a'];
  const HUT_ROOFS = ['#8a4a3a', '#5a6a5a', '#7a7a80', '#9a6a3a', '#4a5a6a'];
  const PICKETS = ['#e8e4d8', '#7a9a6a', '#6a8aa8', '#a88a62', '#d0b868'];
  const SOVIET = new Set(['soviet', 'khrush']);
  const TAU = Math.PI * 2;

  const yawOf = (dx, dz) => Math.atan2(dx, -dz);
  const W = F.World.prototype;

  W.addPatch = function (p) {
    this.patches.push(p);
    const code = p.surf + 1, O = this.occ, SF = this.patchSurf, b = this.b;
    const mark = i => {
      SF[i] = code;
      if (p.occ !== false && (O[i] === 0 || O[i] === 7)) O[i] = PAVED;
    };
    if (p.poly) F.fillPoly(SF, this.onx, this.onz, b.x0 + OC / 2, b.z0 + OC / 2, OC, p.poly, mark);
    else for (let i = 0; i + 1 < p.pts.length; i++) this.rasterSeg(p.pts[i][0], p.pts[i][1], p.pts[i + 1][0], p.pts[i + 1][1], p.w / 2 + (p.margin || 0), mark);
    return p;
  };

  W.rectPoly = function (cx, cz, tx, tz, hl, hw) {
    const nx = -tz, nz = tx;
    return [[cx - tx * hl - nx * hw, cz - tz * hl - nz * hw], [cx + tx * hl - nx * hw, cz + tz * hl - nz * hw], [cx + tx * hl + nx * hw, cz + tz * hl + nz * hw], [cx - tx * hl + nx * hw, cz - tz * hl + nz * hw]];
  };

  W.lineFree = function (a, c, ok, step = 1.5) {
    const L = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k <= n; k++) {
      const i = this.oi(a[0] + (c[0] - a[0]) * k / n, a[1] + (c[1] - a[1]) * k / n);
      if (i < 0 || !ok(this.occ[i])) return false;
    }
    return true;
  };

  W.parkCar = function (x, z, fx, fz, pool, rng, lot) {
    const id = pool[Math.floor(rng() * pool.length)], car = F.Cars.get(id), yaw = yawOf(fx, fz), y = this.terrainH(x, z);
    const col = rng() < 0.45 ? car.col : F.PAINTS[Math.floor(rng() * F.PAINTS.length)];
    const p = { id, x, z, y, yaw, col, lot };
    this.parked.push(p);
    this.cityCols.push({ k: 'box', x, z, hx: car.sh.wid / 2 + 0.08, hz: car.sh.len / 2 + 0.08, c: Math.cos(yaw), s: Math.sin(yaw), y0: y - 1, y1: y + 1.6, src: p });
    return p;
  };

  W.baysAlong = function (lot, rng, pool, fill) {
    const { x, z, tx, tz, len, dep } = lot, nx = -tz, nz = tx, n = Math.floor(len / 2.6);
    for (let k = 0; k <= n; k++) {
      const u = -n * 1.3 + k * 2.6;
      this.paint.push({ a: [x + tx * u - nx * (dep / 2 - 0.5), z + tz * u - nz * (dep / 2 - 0.5)], b: [x + tx * u + nx * (dep / 2 - 0.5), z + tz * u + nz * (dep / 2 - 0.5)], w: 0.12, col: 'w' });
      if (k === n || rng() > fill) continue;
      const cu = u + 1.3, flip = rng() < 0.5 ? 1 : -1;
      this.parkCar(x + tx * cu, z + tz * cu, nx * flip, nz * flip, pool, rng, lot.id || 'city');
    }
  };

  W.buildCity = function () {
    const rng = F.rng(this.seed + 97);
    this.patches = [];
    this.paint = [];
    this.walkways = [];
    this.structs = [];
    this.cityCols = [];
    this.parked = [];
    this.planted = [];
    this.lots = [];
    this.markets = [];
    this.crossings = [];
    this.fountains = [];
    this.patchSurf = new Uint8Array(this.onx * this.onz);
    for (const pk of this.map.PARKS) if (pk.plaza) this.addPatch({ kind: 'tiles', poly: pk.poly, surf: S.PAVE, occ: false, plaza: pk.id });
    this.airport(rng);
    this.zakusala(rng);
    this.tirgus();
    this.parkPaths();
    this.blockWalks();
    this.marketSquares(rng);
    this.roadLots(rng);
    this.garageRows(rng);
    this.lucavsala();
    this.bisumuiza();
    this.zebras();
  };

  W.parkPaths = function () {
    for (const pk of this.map.PARKS) {
      if (pk.plaza || pk.field) continue;
      const poly = pk.poly, area = F.polyArea(poly);
      if (area < 3000) continue;
      const bb = F.polyBox(poly);
      let hub = null, deep = 0;
      for (let x = bb.x0 + 2; x <= bb.x1; x += 4) for (let z = bb.z0 + 2; z <= bb.z1; z += 4) {
        if (!F.inPoly(x, z, poly)) continue;
        const d = F.polyEdgeDist(x, z, poly);
        if (d > deep) { deep = d; hub = [x, z]; }
      }
      if (!hub || deep < 9) continue;
      const cand = [];
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[j], c = poly[i], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
        for (let s = 2; s < L - 2; s += 4) {
          const x = a[0] + (c[0] - a[0]) * s / L, z = a[1] + (c[1] - a[1]) * s / L;
          const nr = this.nearestRoad(x, z, 26, e => !e.bridge && e.k.lanes > 0);
          if (!nr) continue;
          const edge = nr.e.hw + (nr.e.k.side || 0);
          if (nr.d - edge > 9 || nr.d < edge) continue;
          cand.push({ x, z, gap: nr.d - edge, nr, edge });
        }
      }
      const want = F.clamp(Math.round(Math.sqrt(area) / 55), 2, 6), entries = [];
      while (entries.length < want) {
        let pick = null, score = -Infinity;
        for (const c of cand) {
          const dmin = entries.length ? Math.min(...entries.map(e => Math.hypot(e.x - c.x, e.z - c.z))) : 400;
          const sc = Math.min(dmin, 400) - c.gap * 3;
          if (dmin > 45 && sc > score) { score = sc; pick = c; }
        }
        if (!pick) break;
        entries.push(pick);
      }
      if (entries.length < 2) continue;
      const inside = (a, c) => {
        const L = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(1, Math.ceil(L / 3));
        for (let k = 1; k < n; k++) {
          const x = a[0] + (c[0] - a[0]) * k / n, z = a[1] + (c[1] - a[1]) * k / n;
          if (!F.inPoly(x, z, poly) || F.polyEdgeDist(x, z, poly) < 2.5) return false;
          const o = this.occ[this.oi(x, z)];
          if (o === 2 || o === 3 || o === 4) return false;
        }
        return true;
      };
      const route = (a, c) => {
        if (inside(a, c)) return [a, c];
        let best = null, bl = Infinity;
        for (let x = bb.x0 + 6; x <= bb.x1; x += 12) for (let z = bb.z0 + 6; z <= bb.z1; z += 12) {
          const m = [x, z], l = Math.hypot(m[0] - a[0], m[1] - a[1]) + Math.hypot(c[0] - m[0], c[1] - m[1]);
          if (l >= bl || !F.inPoly(x, z, poly) || F.polyEdgeDist(x, z, poly) < 6) continue;
          if (inside(a, m) && inside(m, c)) { bl = l; best = m; }
        }
        return best ? [a, best, c] : null;
      };
      const ring = entries.length >= 3 ? Math.min(10, deep * 0.45) : 0, w = area > 40000 ? 4 : 3;
      let made = 0;
      for (const en of entries) {
        const nr = en.nr, sx = nr.x + (en.x - nr.x) / nr.d * (en.edge - 0.3), sz = nr.z + (en.z - nr.z) / nr.d * (en.edge - 0.3);
        const dh = Math.hypot(hub[0] - en.x, hub[1] - en.z);
        const r = route([en.x + (hub[0] - en.x) * 3 / dh, en.z + (hub[1] - en.z) * 3 / dh], hub);
        if (!r) continue;
        const pts = [[sx, sz], [en.x, en.z]].concat(r);
        if (ring) {
          const last = pts[pts.length - 2], dl = Math.hypot(hub[0] - last[0], hub[1] - last[1]);
          pts[pts.length - 1] = [hub[0] + (last[0] - hub[0]) / dl * (ring - 0.5), hub[1] + (last[1] - hub[1]) / dl * (ring - 0.5)];
        }
        this.addPatch({ kind: 'path', pts, w, surf: S.GRAVEL, margin: 1 });
        this.walkways.push({ pts: pts.slice(1), w, park: pk.id });
        made++;
      }
      if (ring && made >= 2) {
        const circle = Array.from({ length: 24 }, (_, k) => [hub[0] + Math.cos(k / 24 * Math.PI * 2) * ring, hub[1] + Math.sin(k / 24 * Math.PI * 2) * ring]);
        this.addPatch({ kind: 'tiles', poly: circle, surf: S.PAVE });
        const fr = ring * 0.45, y = this.terrainH(hub[0], hub[1]);
        this.fountains.push({ x: hub[0], z: hub[1], r: fr, ring, y });
        this.cityCols.push({ k: 'circ', x: hub[0], z: hub[1], r: fr + 0.3, y0: y - 1, y1: y + 1.2 });
      }
    }
  };

  W.blockWalks = function (list = this.buildings) {
    const ok = v => v === 0 || v === 7 || v === PAVED;
    for (const bd of list) {
      if (!SOVIET.has(bd.style) || bd.w < 16 || !bd.tx) continue;
      const nr = this.nearestRoad(bd.x, bd.z, 90, e => !e.bridge && e.k.lanes > 0);
      if (!nr) continue;
      const nx = -bd.tz, nz = bd.tx, sg = (nr.x - bd.x) * nx + (nr.z - bd.z) * nz >= 0 ? 1 : -1;
      const off = bd.d / 2 + 1.7, hl = bd.w / 2 - 1;
      const a = [bd.x + nx * sg * off - bd.tx * hl, bd.z + nz * sg * off - bd.tz * hl], c = [bd.x + nx * sg * off + bd.tx * hl, bd.z + nz * sg * off + bd.tz * hl];
      if (!this.lineFree(a, c, ok)) continue;
      this.addPatch({ kind: 'walk', pts: [a, c], w: 2.2, surf: S.PAVE });
      for (const f of bd.w > 50 ? [-0.3, 0.3] : [0]) {
        const p = [bd.x + nx * sg * off + bd.tx * bd.w * f, bd.z + nz * sg * off + bd.tz * bd.w * f];
        const q = this.nearestRoad(p[0], p[1], 70, e => !e.bridge && e.k.lanes > 0);
        if (!q || q.d < 1) continue;
        const edge = q.e.hw + (q.e.k.side || 0), end = [q.x + (p[0] - q.x) / q.d * (edge - 0.3), q.z + (p[1] - q.z) / q.d * (edge - 0.3)];
        const L = Math.hypot(end[0] - p[0], end[1] - p[1]), at = this.nearestRoad(end[0], end[1], 20);
        if (L < 3 || L > 60 || !at || at.e !== q.e) continue;
        const mid = [p[0] + (end[0] - p[0]) * 1.4 / L, p[1] + (end[1] - p[1]) * 1.4 / L];
        if (!this.lineFree(mid, end, v => ok(v) || v === 1)) continue;
        this.addPatch({ kind: 'walk', pts: [p, end], w: 2, surf: S.PAVE });
        this.walkways.push({ pts: [p, end], w: 2, door: true });
      }
    }
  };

  W.lotSpot = function (e, s, side, len, dep, gap = 0.4) {
    if (s - len / 2 < 4 || s + len / 2 > e.len - 4) return null;
    const p = this.edgePoint(e, s), q0 = this.edgePoint(e, s - len / 2), q1 = this.edgePoint(e, s + len / 2);
    if (q0.tx * q1.tx + q0.tz * q1.tz < 0.985) return null;
    const off = e.hw + (e.k.side || 0) + gap + dep / 2, nx = p.rx * side, nz = p.rz * side, x = p.x + nx * off, z = p.z + nz * off;
    if (this.nearNode(x, z, len / 2 + 6) || !this.offRoad(x, z, dep / 2 + 1, e)) return null;
    const free = this.rasterRect(x + nx * 0.8, z + nz * 0.8, p.tx, p.tz, len / 2 + 0.5, dep / 2 - 0.4, i => this.occ[i] === 0 || this.occ[i] === 7);
    if (!free) return null;
    return { x, z, tx: p.tx, tz: p.tz, len, dep, side, e, s, nx, nz };
  };

  W.roadLots = function (rng) {
    for (const e of this.edges) {
      if (e.bridge || !e.k.lanes || e.kind === 'hwy' || e.kind === 'old' || e.own || e.len < 60) continue;
      const mid = this.edgePoint(e, e.len / 2), d = this.districtAt(mid.x, mid.z);
      if (!d || (!SOVIET.has(d.style) && d.style !== 'industry')) continue;
      for (let s = 25 + rng() * 30; s < e.len - 25; s += 50 + rng() * 80) {
        if (rng() < 0.55) continue;
        const len = 2.6 * rng.int(5, 10), side = rng() < 0.5 ? -1 : 1;
        const lot = this.lotSpot(e, s, side, len, 5.6);
        if (!lot || this.districtAt(lot.x, lot.z) !== d) continue;
        lot.id = 'yard';
        lot.poly = this.rectPoly(lot.x, lot.z, lot.tx, lot.tz, len / 2, 2.8);
        this.addPatch({ kind: 'lot', poly: lot.poly, surf: S.ASPHALT });
        this.lots.push(lot);
        this.baysAlong({ x: lot.x, z: lot.z, tx: lot.tx, tz: lot.tz, len, dep: 5.6, id: 'yard' }, rng, STREET_CARS, 0.48);
        s += len;
      }
    }
  };

  W.marketSquares = function (rng) {
    for (const d of this.districts) {
      if (!SOVIET.has(d.style)) continue;
      const bb = F.polyBox(d.poly), cx = (bb.x0 + bb.x1) / 2, cz = (bb.z0 + bb.z1) / 2;
      const midOf = e => e.pts[e.pts.length >> 1];
      const list = this.edges.filter(e => !e.bridge && !e.own && (e.kind === 'ave' || e.kind === 'str') && e.len > 80 && this.districtAt(midOf(e)[0], midOf(e)[1]) === d);
      list.sort((a, c) => Math.hypot(midOf(a)[0] - cx, midOf(a)[1] - cz) - Math.hypot(midOf(c)[0] - cx, midOf(c)[1] - cz));
      let done = false;
      for (const e of list) {
        for (let s = 40; s < e.len - 40 && !done; s += 25) {
          for (const side of [1, -1]) {
            const lot = this.lotSpot(e, s, side, 34, 22, 0.3);
            if (!lot || this.districtAt(lot.x, lot.z) !== d) continue;
            this.addPatch({ kind: 'lot', poly: this.rectPoly(lot.x, lot.z, lot.tx, lot.tz, 17, 11), surf: S.ASPHALT });
            this.markets.push({ x: lot.x, z: lot.z, tx: lot.tx, tz: lot.tz, nx: lot.nx, nz: lot.nz, y: this.terrainH(lot.x, lot.z), district: d.id, seed: Math.floor(rng() * 1e6) });
            done = true;
            break;
          }
        }
        if (done) break;
      }
    }
  };

  W.garageRows = function (rng) {
    for (const d of this.districts) {
      if (!SOVIET.has(d.style)) continue;
      const bb = F.polyBox(d.poly);
      let made = 0;
      for (let t = 0; t < 400 && made < 3; t++) {
        const x = rng.range(bb.x0, bb.x1), z = rng.range(bb.z0, bb.z1);
        if (!F.inPoly(x, z, d.poly)) continue;
        const nr = this.nearestRoad(x, z, 120, e => !e.bridge && !e.own && e.k.lanes > 0);
        if (!nr || nr.d < 22 || nr.d > 90) continue;
        const n = rng.int(7, 14), len = n * 3.4 + 0.4, tx = nr.tx, tz = nr.tz, nx = -tz, nz = tx;
        const sg = (nr.x - x) * nx + (nr.z - z) * nz >= 0 ? 1 : -1;
        if (!this.rasterRect(x + nx * sg * 3, z + nz * sg * 3, tx, tz, len / 2 + 3, 7, i => this.occ[i] === 0 || this.occ[i] === 7)) continue;
        const y = this.terrainH(x, z) - 0.05;
        this.structs.push({ type: 'garages', x, z, y, tx: tx * sg, tz: tz * sg, n, seed: Math.floor(rng() * 1e6) });
        this.rasterRect(x, z, tx, tz, len / 2, 3.2, i => { this.occ[i] = 3; });
        this.addPatch({ kind: 'lot', poly: this.rectPoly(x + nx * sg * 6.2, z + nz * sg * 6.2, tx, tz, len / 2, 3), surf: S.ASPHALT });
        this.cityCols.push({ k: 'box', x, z, hx: len / 2, hz: 3.1, c: tx, s: tz, y0: y - 1, y1: y + 2.8 });
        made++;
      }
    }
  };

  W.zebras = function () {
    for (const nd of this.nodes) {
      if (!nd.arms || nd.arms.length < 3) continue;
      for (const A of nd.arms) {
        const e = A.e;
        if (e.bridge || !A.side || (e.kind !== 'ave' && e.kind !== 'str') || e.len < A.mouth + 14) continue;
        const s = A.mouth + 2.6, p = this.armAt(A, s), q = this.armAt(A, s + 1), dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz) || 1;
        const tx = dx / l, tz = dz / l, rx = -tz, rz = tx;
        for (let lat = -A.hw + 0.55; lat <= A.hw - 0.45; lat += 1.1) {
          const cx = p.x + rx * lat, cz = p.z + rz * lat;
          this.paint.push({ a: [cx - tx * 1.6, cz - tz * 1.6], b: [cx + tx * 1.6, cz + tz * 1.6], w: 0.55, col: 'w', y: p.y + 0.03 });
        }
        this.crossings.push({ x: p.x, z: p.z, y: p.y, tx, tz, hw: A.hw, side: A.side, A });
      }
    }
  };

  W.airport = function (rng) {
    const AIR = this.map.AIR;
    if (!AIR) return;
    const road = this.edges.find(e => e.name === AIR.road);
    if (!road) return;
    this.air = { road, gates: [], fence: [], lights: [], planes: AIR.planes, hangars: AIR.hangars, tanks: AIR.tanks, radar: AIR.radar, sock: AIR.sock, totem: null };
    const pts = [];
    for (let s = 0; s <= road.len; s += 1) pts.push(this.edgePoint(road, s));
    const nearX = x => pts.reduce((b, p) => (Math.abs(p.x - x) < Math.abs(b.x - x) ? p : b), pts[0]);
    const side = (p, sign, off) => { const lat = (p.rz < 0 ? 1 : -1) * sign; return { x: p.x + p.rx * lat * off, z: p.z + p.rz * lat * off, lat }; };
    const kerb = road.hw + road.k.side;
    const edgeZ = x => side(nearX(x), 1, kerb).z;
    const fc = AIR.forecourt, court = [[fc.x0, fc.z0], [fc.x1, fc.z0]];
    for (let x = fc.x1; x >= fc.x0 - 0.01; x -= 4) court.push([x, edgeZ(x) - 0.2]);
    this.addPatch({ kind: 'tiles', poly: court, surf: S.PAVE });
    this.air.forecourt = court;
    const taxi = AIR.taxi, tz0 = edgeZ(taxi.x1) - 3.3, tz1 = edgeZ(taxi.x0) - 3.3, slope = (tz1 - tz0) / (taxi.x1 - taxi.x0);
    this.addPatch({ kind: 'lot', poly: [[taxi.x0, tz1], [taxi.x1, tz0], [taxi.x1, tz0 + 3.1], [taxi.x0, tz1 + 3.1]], surf: S.ASPHALT });
    for (let x = taxi.x1 - 3.2; x > taxi.x0 + 3; x -= 5.6) this.parkCar(x, tz0 + (x - taxi.x1) * -slope + 1.55, -1, slope, ['gaz24', 'gaz24', 'gaz24', 'w124', 'vaz2108'], rng, 'taxi');
    for (const L of AIR.lots) {
      const zEnd = Math.min(L.z1, edgeZ(L.x0) - 1.5, edgeZ(L.x1) - 1.5);
      const poly = [[L.x0, L.z0], [L.x1, L.z0], [L.x1, edgeZ(L.x1) - 0.2], [L.x0, edgeZ(L.x0) - 0.2]];
      this.addPatch({ kind: 'lot', poly, surf: S.ASPHALT });
      this.lots.push({ id: L.id, air: true, poly });
      const cols = Math.floor((L.x1 - L.x0 - 2) / 16.6), x0 = (L.x0 + L.x1) / 2 - cols * 8.3, len = zEnd - 6.5 - L.z0 - 1;
      for (let c = 0; c < cols; c++) for (const sd of [-1, 1]) this.baysAlong({ x: x0 + c * 16.6 + 8.3 + sd * 5.8, z: L.z0 + 1 + len / 2, tx: 0, tz: 1, len, dep: 5, id: L.id }, rng, AIRPORT_CARS, L.fill);
      for (const m of L.masts) {
        this.air.lights.push({ x: m[0], z: m[1], kind: 'mast' });
        this.cityCols.push({ k: 'circ', x: m[0], z: m[1], r: 0.35, y0: -1, y1: 12 });
      }
      for (let x = L.x0 + 4; x <= L.x1 - 4; x += 9) this.planted.push({ x, z: L.z0 - 3.5, kind: 'linden', s: 0.9 });
    }
    for (const pad of AIR.apron.pads) this.addPatch({ kind: 'apron', poly: pad, surf: S.ASPHALT });
    for (const m of AIR.apron.masts) {
      this.air.lights.push({ x: m[0], z: m[1], kind: 'mast' });
      this.cityCols.push({ k: 'circ', x: m[0], z: m[1], r: 0.35, y0: -1, y1: 12 });
    }
    for (const ln of AIR.apron.lines) this.paint.push({ a: ln[0], b: ln[1], w: ln[2] || 0.25, col: 'y', y: 0.01 });
    for (const pl of AIR.planes) {
      const fx = Math.sin(pl.yaw), fz = -Math.cos(pl.yaw), rx = -fz, rz = fx, half = pl.len / 2;
      this.paint.push({ a: [pl.x + fx * (half + 3), pl.z + fz * (half + 3)], b: [pl.x - fx * 58, pl.z - fz * 58], w: 0.22, col: 'y', y: 0.01 });
      this.paint.push({ a: [pl.x + fx * (half + 3) - rx * 2.5, pl.z + fz * (half + 3) - rz * 2.5], b: [pl.x + fx * (half + 3) + rx * 2.5, pl.z + fz * (half + 3) + rz * 2.5], w: 0.4, col: 'y', y: 0.01 });
      this.cityCols.push({ k: 'seg', x1: pl.x + fx * half * 0.92, z1: pl.z + fz * half * 0.92, x2: pl.x - fx * half * 0.92, z2: pl.z - fz * half * 0.92, r: pl.r, y0: -1, y1: 8, src: pl });
      if (pl.eng) for (const s of [-1, 1]) this.cityCols.push({ k: 'circ', x: pl.x + rx * s * pl.eng + fx * 1.5, z: pl.z + rz * s * pl.eng + fz * 1.5, r: 1.2, y0: -1, y1: 3, src: pl });
    }
    for (const h of AIR.hangars) {
      const c = Math.cos(h.yaw), s = Math.sin(h.yaw);
      this.cityCols.push({ k: 'box', x: h.x, z: h.z, hx: h.w / 2, hz: h.d / 2, c, s, y0: -2, y1: h.h + 1 });
      this.rasterRect(h.x, h.z, c, s, h.w / 2 + 2, h.d / 2 + 2, i => { this.occ[i] = 3; });
    }
    for (const t of AIR.tanks) {
      this.cityCols.push({ k: 'circ', x: t[0], z: t[1], r: t[2], y0: -1, y1: t[3] });
      this.rasterDisc(t[0], t[1], t[2] + 2, i => { this.occ[i] = 3; });
    }
    for (const b of AIR.blocks) this.addBuilding({ x: b.x, z: b.z, tx: 1, tz: 0, w: b.w, d: b.d, floors: b.floors, h: b.floors * 3.6 + 1, style: 'airport', fac: 'factory2', roof: 'flat', col: b.col, front: 1, y: this.terrainH(b.x, b.z) - 0.3 });
    const r = AIR.radar;
    this.cityCols.push({ k: 'circ', x: r.x, z: r.z, r: 2.4, y0: -1, y1: 16 });
    this.rasterDisc(r.x, r.z, 5, i => { this.occ[i] = 4; });
    for (let s = AIR.fence[0]; s < road.len - AIR.fence[1]; s += 3) {
      const p = this.edgePoint(road, s + 1.5), q = side(p, -1, kerb + 2.2);
      if (AIR.gates.some(g => Math.abs(q.x - g) < 7)) continue;
      this.air.fence.push({ x: q.x, z: q.z, yaw: yawOf(p.tx, p.tz) });
    }
    for (const g of AIR.gates) {
      const p = nearX(g), q = side(p, -1, kerb + 2.2);
      this.air.gates.push({ x: q.x, z: q.z, yaw: yawOf(p.tx, p.tz), w: 14 });
    }
    const tp = this.edgePoint(road, AIR.totem), tq = side(tp, 1, kerb + 4);
    this.air.totem = { x: tq.x, z: tq.z, y: this.terrainH(tq.x, tq.z), yaw: yawOf(tp.tx, tp.tz) };
    this.cityCols.push({ k: 'circ', x: tq.x, z: tq.z, r: 1.6, y0: -1, y1: 9 });
    this.rasterDisc(tq.x, tq.z, 3, i => { if (this.occ[i] === 0) this.occ[i] = 4; });
    const rw = this.edges.find(e => e.rid === 'runway');
    if (rw) {
      for (let s = 0; s <= rw.len + 0.01; s += rw.len / Math.round(rw.len / 30)) {
        const p = this.edgePoint(rw, s), end = s < 1 || s > rw.len - 1;
        for (const lat of [-1, 1]) this.air.lights.push({ x: p.x + p.rx * lat * (rw.hw + 1.5), z: p.z + p.rz * lat * (rw.hw + 1.5), kind: end ? 'end' : 'edge' });
      }
      const e0 = this.edgePoint(rw, rw.len);
      for (let k = 1; k <= 8; k++) this.air.lights.push({ x: e0.x + e0.tx * k * 30, z: e0.z + e0.tz * k * 30, kind: 'approach' });
    }
  };

  W.planTrees = function () {
    const O = this.occ;
    for (const t of this.planted || []) {
      const i = this.oi(t.x, t.z);
      if (i < 0 || (O[i] !== 0 && O[i] !== 7 && !(t.glade && O[i] === 6 && !this.patchSurf[i]))) continue;
      O[i] = 5;
      this.trees.push({ x: t.x, z: t.z, y: this.terrainH(t.x, t.z), kind: t.kind, s: t.s, street: true });
    }
  };

  W.signFor = function (A, nd) {
    const r = RANK[A.e.kind] || 1;
    let other = 0;
    for (const B of nd.arms) if (B !== A) other = Math.max(other, RANK[B.e.kind] || 1);
    if (r < other) return other - r >= 2 && F.hash2(nd.id, A.e.id, 5) < 0.35 ? 'stop' : 'yield';
    if (r > other || (r >= 3 && nd.arms.length >= 4)) return 'main';
    return null;
  };

  W.cityProps = function (add) {
    const rng = F.rng(this.seed + 43), O = this.occ;
    const clear = (x, z, r = 0.8) => {
      const i = this.oi(x, z);
      return i >= 0 && O[i] !== 2 && O[i] !== 3 && O[i] !== 4 && this.offRoad(x, z, r) && !this.isWaterAt(x, z);
    };
    const inYaw = A => Math.atan2(-A.dx, A.dz), outYaw = A => Math.atan2(A.dx, -A.dz);
    for (const nd of this.nodes) {
      if (!nd.arms || nd.arms.length < 3 || !nd.arms.every(A => A.e.k.lanes > 0 && !A.e.bridge)) continue;
      const big = nd.arms.length >= 4 && nd.arms.filter(A => (RANK[A.e.kind] || 1) >= 3).length >= 2;
      for (const A of nd.arms) {
        if (A.e.len < A.mouth + 12) continue;
        const lat = A.hw + (A.side ? Math.min(A.side * 0.5, 1.2) : 1.3);
        const kind = this.signFor(A, nd);
        const put = (s, l, yaw, o) => { const p = this.armAt(A, s, l); return clear(p.x, p.z, 0.4) ? add(o.type || 'sign', p.x, p.z, yaw, o) : null; };
        if (kind) put(A.mouth + 5.5, -lat, inYaw(A), { smash: true, mass: 40, sign: kind });
        if (this.crossings.some(c => c.A === A) && (A.e.kind === 'ave' || F.hash2(nd.id, A.e.id, 7) < 0.4)) put(A.mouth + 1.2, -lat, inYaw(A), { smash: true, mass: 40, sign: 'crossing' });
        if (big) put(A.mouth + 0.6, -(lat + 0.2), inYaw(A), { type: 'tlight', smash: true, mass: 120, go: (RANK[A.e.kind] || 1) >= 3 ? 'g' : 'r' });
        if ((A.e.kind === 'hwy' || A.e.kind === 'ave') && A.e.len > 160 && F.hash2(nd.id, A.e.id, 9) < 0.45) put(A.mouth + 22, lat, outYaw(A), { smash: true, mass: 40, sign: A.e.kind === 'hwy' ? 'v70' : 'v50' });
      }
    }
    this.signposts = [];
    for (const nd of this.nodes) {
      if (!nd.arms || nd.arms.length < 3 || nd.arms.filter(A => (RANK[A.e.kind] || 1) >= 3).length < 2) continue;
      for (const A of nd.arms) {
        if ((RANK[A.e.kind] || 1) < 3 || A.e.bridge || A.e.len < 140) continue;
        const lines = [];
        for (const B of nd.arms) {
          if (B === A || B.e.bridge) continue;
          const d = this.districtAt(nd.x + B.dx * 800, nd.z + B.dz * 800), name = d ? LV[d.id] : null;
          if (!name || lines.some(l => l[1] === name)) continue;
          const turn = Math.atan2(-A.dx * B.dz + A.dz * B.dx, -A.dx * B.dx - A.dz * B.dz);
          lines.push([Math.abs(turn) < 0.6 ? 'up' : turn > 0 ? 'right' : 'left', name]);
        }
        if (lines.length < 2) continue;
        lines.sort((a, c) => ['left', 'up', 'right'].indexOf(a[0]) - ['left', 'up', 'right'].indexOf(c[0]));
        const p = this.armAt(A, A.mouth + 55, -(A.hw + (A.side ? A.side * 0.6 : 2.2) + 0.8));
        if (!clear(p.x, p.z, 1.2) || this.signposts.some(b => Math.hypot(b.x - p.x, b.z - p.z) < 120)) continue;
        this.signposts.push({ x: p.x, z: p.z, y: this.groundY(p.x, p.z), yaw: inYaw(A), lines: lines.slice(0, 3), id: this.signposts.length });
        this.cityCols.push({ k: 'circ', x: p.x, z: p.z, r: 0.5, y0: -2, y1: 8 });
      }
    }
    for (const w of this.walkways) {
      if (w.door) {
        const p = w.pts[0], q = w.pts[1], L = Math.hypot(q[0] - p[0], q[1] - p[1]), tx = (q[0] - p[0]) / L, tz = (q[1] - p[1]) / L;
        for (const s of [-1, 1]) {
          const x = p[0] + tx * 2.4 - tz * s * 1.9, z = p[1] + tz * 2.4 + tx * s * 1.9;
          if (clear(x, z, 0.5)) add(s > 0 ? 'bench' : 'bin', x, z, yawOf(tz * s, -tx * s), { smash: true, mass: s > 0 ? 60 : 20 });
        }
        continue;
      }
      let acc = 6 + rng() * 6, k = 0;
      for (let i = 0; i + 1 < w.pts.length; i++) {
        const a = w.pts[i], c = w.pts[i + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1]), tx = (c[0] - a[0]) / L, tz = (c[1] - a[1]) / L;
        for (; acc < L; acc += 14 + rng() * 6, k++) {
          const side = k % 2 ? 1 : -1, off = w.w / 2 + 0.7;
          const x = a[0] + tx * acc - tz * side * off, z = a[1] + tz * acc + tx * side * off;
          if (!clear(x, z, 0.3)) continue;
          const face = yawOf(tz * side, -tx * side);
          if (k % 3 === 1) add('plamp', x, z, face, { smash: true, mass: 70 });
          else add(k % 3 === 0 ? 'bench' : 'bin', x, z, face, { smash: true, mass: k % 3 === 0 ? 60 : 20 });
        }
        acc -= L;
      }
    }
    for (const f of this.fountains) {
      if (f.bare) continue;
      for (let k = 0; k < 4; k++) {
        const a = k / 4 * Math.PI * 2 + Math.PI / 4, rr = (f.r + f.ring) / 2 + 0.6, x = f.x + Math.cos(a) * rr, z = f.z + Math.sin(a) * rr;
        if (clear(x, z, 0.3)) add('bench', x, z, yawOf(f.x - x, f.z - z) + Math.PI, { smash: true, mass: 60 });
      }
    }
    for (const pk of this.map.PARKS) {
      if (!pk.plaza) continue;
      const bb = F.polyBox(pk.poly), area = F.polyArea(pk.poly), th = this.adTheme((bb.x0 + bb.x1) / 2, (bb.z0 + bb.z1) / 2);
      let terrace = th === 'old' ? 2 : 0, stalls = th === 'old' ? 3 : 1;
      for (let k = 0, n = Math.round(area / 220); k < n; k++) {
        const x = F.lerp(bb.x0, bb.x1, F.hash2(k, 7, bb.x0 | 0)), z = F.lerp(bb.z0, bb.z1, F.hash2(k, 8, bb.z0 | 0));
        if (!F.inPoly(x, z, pk.poly) || F.polyEdgeDist(x, z, pk.poly) < 2.5 || !clear(x, z, 1.5) || O[this.oi(x, z)] !== 6) continue;
        const face = F.hash2(k, 9, 3) * Math.PI * 2;
        if (terrace > 0) {
          terrace--;
          for (const [dx, dz] of [[0, 0], [3.2, 0], [0, 3.2], [3.2, 3.2]]) if (clear(x + dx, z + dz, 1) && F.inPoly(x + dx, z + dz, pk.poly)) add('table', x + dx, z + dz, face, { smash: true, mass: 25 });
          continue;
        }
        if (stalls > 0) { stalls--; add('stall', x, z, face, { smash: true, mass: 45, goods: th === 'old' ? 'amber' : TENTS[k % TENTS.length] }); continue; }
        const t = k % 4;
        add(['flowers', 'bench', 'bin', 'phone'][t], x, z, face, { smash: true, mass: [80, 60, 20, 90][t] });
      }
    }
    for (const m of this.markets) {
      for (const [ri, off] of [-5.5, 5.5].entries()) {
        for (let k = 0; k < 5; k++) {
          const u = -12 + k * 6, x = m.x + m.tx * u + m.nx * off, z = m.z + m.tz * u + m.nz * off;
          add('stall', x, z, ri ? yawOf(-m.nx, -m.nz) : yawOf(m.nx, m.nz), { smash: true, mass: 45, goods: TENTS[(k + ri * 2 + m.seed) % TENTS.length] });
        }
      }
      for (let k = 0; k < 3; k++) {
        const u = -10 + k * 10;
        add('kiosk', m.x + m.tx * u - m.nx * 8.6, m.z + m.tz * u - m.nz * 8.6, yawOf(-m.nx, -m.nz), { solid: true, kind: KIOSKS[(m.seed + k * 3) % KIOSKS.length] });
      }
    }
    for (const st of this.map.RAIL.stations || []) {
      const nr = this.nearestRoad(st.x, st.z, 120, e => !e.bridge && e.k.lanes > 0 && e.k.side > 0);
      if (!nr) continue;
      const off = nr.e.hw + nr.e.k.side + 2.4, face = yawOf(-nr.rx * nr.side, -nr.rz * nr.side);
      for (let k = 0; k < 4; k++) {
        const u = -9 + k * 6, x = nr.x + nr.tx * u + nr.rx * off * nr.side, z = nr.z + nr.tz * u + nr.rz * off * nr.side;
        if (!clear(x, z, 1.8)) continue;
        if (k === 1 || k === 2) add('kiosk', x, z, face, { solid: true, kind: KIOSKS[(k + Math.abs(st.x | 0)) % KIOSKS.length] });
        else add('stall', x, z, face, { smash: true, mass: 45, goods: k ? 'flowers' : 'fruit' });
      }
    }
    for (const bd of this.buildings) {
      if (!SOVIET.has(bd.style) || !bd.tx || bd.w < 30 || F.hash2(bd.id, 3, 17) > 0.3) continue;
      const nr = this.nearestRoad(bd.x, bd.z, 90, e => !e.bridge && e.k.lanes > 0);
      if (!nr) continue;
      const nx = -bd.tz, nz = bd.tx, sg = (nr.x - bd.x) * nx + (nr.z - bd.z) * nz >= 0 ? -1 : 1;
      const x = bd.x + nx * sg * (bd.d / 2 + 11), z = bd.z + nz * sg * (bd.d / 2 + 11);
      if (!this.rasterRect(x, z, bd.tx, bd.tz, 7, 5, i => O[i] === 0 || O[i] === 7)) continue;
      const face = yawOf(-nx * sg, -nz * sg);
      this.addPatch({ kind: 'sand', poly: this.rectPoly(x, z, bd.tx, bd.tz, 7, 5), surf: S.SAND });
      add('swing', x - bd.tx * 3.5, z - bd.tz * 3.5, face, { solid: true, r: 1.4 });
      add('slide', x + bd.tx * 3.5, z + bd.tz * 3.5, face, { solid: true, r: 1.3 });
      add('sandbox', x + nx * sg * 2.5, z + nz * sg * 2.5, face, { smash: true, mass: 80 });
    }
    this.airProps(add);
    this.zakProps(add);
    this.lucProps(add);
    this.tirgusProps(add);
    this.bisProps(add);
  };

  W.zakusala = function (rng) {
    const Z = this.map.ZAK, lm = this.landmarks.find(l => l.type === 'ltv');
    if (!Z || !lm) return;
    const c = Math.cos(lm.yaw), sn = Math.sin(lm.yaw), tx = c, tz = sn, rx = -sn, rz = c;
    const L = (x, z) => [lm.x + c * x - sn * z, lm.z + sn * x + c * z];
    const box = (x0, x1, z0, z1) => [L(x0, z0), L(x1, z0), L(x1, z1), L(x0, z1)];
    const ltv = Z.ltv, zak = this.zak = { props: [], rails: [], promenade: Z.promenade, terrace: Z.terrace };
    this.addPatch({ kind: 'tiles', poly: box(...ltv.walk), surf: S.PAVE });
    this.addPatch({ kind: 'tiles', poly: box(...ltv.court), surf: S.PAVE });
    const lot = ltv.lot, lotPoly = box(...lot);
    this.addPatch({ kind: 'lot', poly: lotPoly, surf: S.ASPHALT });
    this.lots.push({ id: 'ltv', poly: lotPoly });
    const vanX = ltv.vans.map(v => v[0]), carsTo = Math.min(...vanX) - 4;
    const [cx, cz] = L((lot[0] + carsTo) / 2, (lot[2] + lot[3]) / 2);
    this.baysAlong({ x: cx, z: cz, tx, tz, len: carsTo - lot[0], dep: lot[3] - lot[2], id: 'ltv' }, rng, LTV_CARS, 0.72);
    for (const [x, z] of ltv.vans) { const [px, pz] = L(x, z); zak.props.push(['obvan', px, pz, yawOf(rx, rz), { solid: true, r: 1.7 }]); }
    for (let x = ltv.trees[0]; x <= ltv.trees[1]; x += 10) { const [px, pz] = L(x, ltv.trees[2]); this.planted.push({ x: px, z: pz, kind: 'linden', s: 0.85 }); }
    for (const x of ltv.flags) { const [px, pz] = L(x, -30.5); zak.props.push(['flagpole', px, pz, lm.yaw, { solid: true, r: 0.3, flag: 0 }]); }
    for (const x of ltv.lamps) { const [px, pz] = L(x, -33.4); zak.props.push(['alamp', px, pz, lm.yaw, { solid: true, r: 0.4 }]); }
    for (const [x, z, kind] of ltv.kiosks) { const [px, pz] = L(x, z); zak.props.push(['kiosk', px, pz, yawOf(-rx, -rz), { solid: true, kind }]); }
    for (let x = -96; x <= 96; x += 24) for (const d of [-2.2, 2.2]) { const [px, pz] = L(x + d, -27.6); zak.props.push([d < 0 ? 'bench' : 'bin', px, pz, yawOf(-rx, -rz), { smash: true, mass: d < 0 ? 60 : 20 }]); }
    const [sx, sz] = L(...ltv.shelter), sr = this.nearestRoad(sx, sz, 20);
    if (sr) this.extraStops = [{ x: sx, z: sz, y: sr.y, yaw: yawOf(-sr.rx * sr.side, -sr.rz * sr.side), p: sr, side: sr.side }];
    const T = Z.tower, tv = Z.tv, P = (deg, r) => [T[0] + Math.cos(deg * Math.PI / 180) * r, T[1] + Math.sin(deg * Math.PI / 180) * r];
    const ring = Array.from({ length: 41 }, (_, k) => P(k * 9, tv.ring[0]));
    this.addPatch({ kind: 'tiles', pts: ring, w: tv.ring[1], surf: S.PAVE });
    const lt = tv.lot, th = lt.at * Math.PI / 180, nx = Math.cos(th), nz = Math.sin(th), ux = -nz, uz = nx;
    const tvPoly = [[T[0] + nx * lt.r0 - ux * lt.len / 2, T[1] + nz * lt.r0 - uz * lt.len / 2], [T[0] + nx * lt.r0 + ux * lt.len / 2, T[1] + nz * lt.r0 + uz * lt.len / 2], [T[0] + nx * lt.r1 + ux * lt.len / 2, T[1] + nz * lt.r1 + uz * lt.len / 2], [T[0] + nx * lt.r1 - ux * lt.len / 2, T[1] + nz * lt.r1 - uz * lt.len / 2]];
    this.addPatch({ kind: 'lot', poly: tvPoly, surf: S.ASPHALT });
    this.lots.push({ id: 'tv', poly: tvPoly });
    for (const rr of [lt.r0 + 2.5, lt.r1 - 2.5]) this.baysAlong({ x: T[0] + nx * rr, z: T[1] + nz * rr, tx: ux, tz: uz, len: lt.len - 2, dep: 5, id: 'tv' }, rng, STREET_CARS, 0.6);
    for (let k = -1; k <= 1; k++) this.planted.push({ x: T[0] + nx * (lt.r1 + 4) + ux * k * 14, z: T[1] + nz * (lt.r1 + 4) + uz * k * 14, kind: 'linden', s: 0.9 });
    for (const [deg, kind] of tv.kiosks) { const [px, pz] = P(deg, tv.ring[0]); zak.props.push(['kiosk', px, pz, yawOf(px - T[0], pz - T[1]), { solid: true, kind }]); }
    for (const [deg, goods] of tv.stalls) { const [px, pz] = P(deg, tv.ring[0]); zak.props.push(['stall', px, pz, yawOf(px - T[0], pz - T[1]), { smash: true, mass: 45, goods }]); }
    for (const deg of tv.flags) { const [px, pz] = P(deg, tv.ring[0] + 2.2); zak.props.push(['flagpole', px, pz, (deg + 90) * Math.PI / 180, { solid: true, r: 0.3, flag: 0 }]); }
    for (let deg = 0; deg < 360; deg += 30) {
      if (tv.kiosks.some(k => Math.abs(F.wrap((k[0] - deg - 15) * Math.PI / 180)) < 0.12) || tv.stalls.some(k => Math.abs(F.wrap((k[0] - deg - 15) * Math.PI / 180)) < 0.12)) continue;
      const [bx, bz] = P(deg + 15, tv.ring[0] + 1.6);
      zak.props.push(['bench', bx, bz, yawOf(T[0] - bx, T[1] - bz), { smash: true, mass: 60 }]);
      const [lx, lz] = P(deg, tv.ring[0] - 2.6);
      zak.props.push([deg % 60 ? 'flowers' : 'plamp', lx, lz, 0, { smash: true, mass: deg % 60 ? 80 : 70 }]);
    }
    const prom = Z.promenade;
    this.addPatch({ kind: 'tiles', pts: prom, w: 5, surf: S.PAVE, margin: 0.6 });
    const [ex, ez, er] = Z.terrace;
    this.addPatch({ kind: 'tiles', poly: Array.from({ length: 24 }, (_, k) => [ex + Math.cos(k / 24 * Math.PI * 2) * er, ez + Math.sin(k / 24 * Math.PI * 2) * er]), surf: S.PAVE });
    const path = Z.path.map(q => q.slice()), pr = this.nearestRoad(path[0][0], path[0][1], 40);
    if (pr) { const edge = pr.e.hw + (pr.e.k.side || 0) - 0.3; path[0] = [pr.x + (path[0][0] - pr.x) / pr.d * edge, pr.z + (path[0][1] - pr.z) / pr.d * edge]; }
    this.addPatch({ kind: 'path', pts: path, w: 3.5, surf: S.GRAVEL, margin: 1 });
    this.walkways.push({ pts: path.slice(1), w: 3.5, park: 'zak' });
    const lane = this.edges.find(e => e.name === 'Закюсалас');
    if (lane) for (let s = 24; s < lane.len - 22; s += 13) {
      const q = this.edgePoint(lane, s);
      for (const sd of [-1, 1]) this.planted.push({ x: q.x + q.rx * sd * (lane.hw + 3.6), z: q.z + q.rz * sd * (lane.hw + 3.6), kind: 'linden', s: 0.8 + ((s / 13) % 3) * 0.08 });
    }
    const emb = this.edges.find(e => e.name === 'Набережная Закюсалас');
    if (emb) for (let s = 3; s < emb.len - 3; s += 2.6) {
      const q = this.edgePoint(emb, s + 1.3);
      for (const sd of [-1, 1]) {
        const off = emb.hw + emb.k.side + 0.35, x = q.x + q.rx * sd * off, z = q.z + q.rz * sd * off;
        if (!this.isWaterAt(x, z) && this.isWaterAt(x + q.rx * sd * 4, z + q.rz * sd * 4)) zak.rails.push([x, z, yawOf(q.tx, q.tz)]);
      }
    }
  };

  W.zakProps = function (add) {
    const zak = this.zak;
    if (!zak) return;
    for (const [type, x, z, yaw, o] of zak.props) add(type, x, z, yaw, o);
    for (const [x, z, yaw] of zak.rails) add('qrail', x, z, yaw, { smash: true, mass: 25, len: 2.6 });
    const prom = zak.promenade;
    let acc = 0, k = 0;
    for (let i = 0; i + 1 < prom.length; i++) {
      const a = prom[i], b = prom[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
      let nx = -tz, nz = tx;
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (!this.isWaterAt(mx + nx * 14, mz + nz * 14) && this.isWaterAt(mx - nx * 14, mz - nz * 14)) { nx = -nx; nz = -nz; }
      for (let s = 1.3; s < len; s += 2.6) {
        const x = a[0] + tx * s + nx * 3.2, z = a[1] + tz * s + nz * 3.2;
        if (this.offRoad(x, z, 2) && !this.isWaterAt(x, z)) add('qrail', x, z, yawOf(tx, tz), { smash: true, mass: 25, len: 2.6 });
      }
      for (; acc < len; acc += 12, k++) {
        const x = a[0] + tx * acc, z = a[1] + tz * acc;
        if (!this.offRoad(x, z, 4)) continue;
        if (k % 3 === 0) add('bench', x + nx * 1.9, z + nz * 1.9, yawOf(nx, nz), { smash: true, mass: 60 });
        else if (k % 3 === 1) add('plamp', x - nx * 3.1, z - nz * 3.1, 0, { smash: true, mass: 70 });
        else add('bin', x + nx * 1.9, z + nz * 1.9, yawOf(nx, nz), { smash: true, mass: 20 });
      }
      acc -= len;
    }
    const [ex, ez, er] = zak.terrace;
    let river = 0, near = Infinity;
    for (let d = 0; d < 360; d += 10) for (let r = er; r < er + 40; r += 2) {
      if (!this.isWaterAt(ex + Math.cos(d * Math.PI / 180) * r, ez + Math.sin(d * Math.PI / 180) * r)) continue;
      if (r < near) { near = r; river = d; }
      break;
    }
    for (const off of [-90, -45, 0, 45, 90]) {
      const a = (river + off) * Math.PI / 180, x = ex + Math.cos(a) * (er - 1.6), z = ez + Math.sin(a) * (er - 1.6);
      add('bench', x, z, yawOf(Math.cos(a), Math.sin(a)), { smash: true, mass: 60 });
    }
    add('plamp', ex, ez, 0, { smash: true, mass: 70 });
  };

  W.glade = function (poly) {
    const b = this.b, O = this.occ;
    F.fillPoly(O, this.onx, this.onz, b.x0 + OC / 2, b.z0 + OC / 2, OC, poly, i => { if (O[i] === 0 || O[i] === 7) O[i] = 6; });
  };

  W.alley = function (pts, w, out) {
    this.addPatch({ kind: 'tiles', pts, w, surf: S.PAVE, margin: 0.6 });
    let acc = 5.5, k = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], c = pts[i + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1]), tx = (c[0] - a[0]) / L, tz = (c[1] - a[1]) / L;
      for (; acc < L; acc += 5.5, k++) {
        const at = (sd, off) => [a[0] + tx * acc - tz * sd * off, a[1] + tz * acc + tx * sd * off];
        if (k % 2 === 0) {
          for (const sd of [-1, 1]) { const [x, z] = at(sd, w / 2 + 2.2); this.planted.push({ x, z, kind: 'linden', s: 0.85, glade: true }); }
          continue;
        }
        const sd = k % 4 === 1 ? 1 : -1, [lx, lz] = at(sd, w / 2 + 0.7), [bx, bz] = at(-sd, w / 2 + 0.8), seat = (k >> 1) % 3 !== 2;
        out.push(['plamp', lx, lz, 0, { smash: true, mass: 70 }]);
        out.push([seat ? 'bench' : 'bin', bx, bz, yawOf(-tz * sd, tx * sd), { smash: true, mass: seat ? 60 : 20 }]);
      }
      acc -= L;
    }
  };

  W.trail = function (pts, w, stop) {
    const path = pts.map(q => q.slice()), nr = this.nearestRoad(path[0][0], path[0][1], 40);
    if (nr && nr.d > 0.5) { const edge = nr.e.hw + (nr.e.k.side || 0) - 0.3; path[0] = [nr.x + (path[0][0] - nr.x) / nr.d * edge, nr.z + (path[0][1] - nr.z) / nr.d * edge]; }
    if (stop) {
      const last = path[path.length - 1], d = Math.hypot(last[0] - stop[0], last[1] - stop[1]) || 1;
      path[path.length - 1] = [stop[0] + (last[0] - stop[0]) / d * (stop[2] + 0.25), stop[1] + (last[1] - stop[1]) / d * (stop[2] + 0.25)];
    }
    this.addPatch({ kind: 'path', pts: path, w, surf: S.GRAVEL, margin: 1 });
    this.walkways.push({ pts: path.slice(1), w, park: 'luc' });
    return path;
  };

  W.lucavsala = function () {
    const LU = this.map.LUC;
    if (!LU) return;
    const rng = F.rng(this.seed + 131);
    this.luc = { props: [], plots: [], houses: [] };
    this.lucPark(LU.park, this.luc, rng);
    this.lucGarden(LU.garden, this.luc, rng);
  };

  W.lucPark = function (K, luc, rng) {
    const [ax, az] = K.dir, nx = az, nz = -ax, out = luc.props;
    const P = (u, d) => [K.gate[0] + ax * u + nx * d, K.gate[1] + az * u + nz * d];
    const line = pts => pts.map(q => P(q[0], q[1]));
    const box = (u0, u1, v0, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
    const disc = (c, r, n = 24) => Array.from({ length: n }, (_, k) => [c[0] + Math.cos(k / n * TAU) * r, c[1] + Math.sin(k / n * TAU) * r]);
    const polar = (c, ang, r) => P(c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r);
    const put = (type, u, d, yaw, o) => { const [x, z] = P(u, d); out.push([type, x, z, yaw, o]); };
    const tree = (q, s) => this.planted.push({ x: q[0], z: q[1], kind: 'linden', s, glade: true });
    const ln = (a, c) => this.paint.push({ a, b: c, w: 0.12, col: 'w' });
    const toAve = yawOf(-nx, -nz), toPark = yawOf(nx, nz), [d0, d1] = K.lotDepth;
    this.addPatch({ kind: 'tiles', poly: box(...K.plaza), surf: S.PAVE });
    for (const [u0, u1] of K.lots) {
      const poly = box(u0, u1, d0, d1), [cx, cz] = P((u0 + u1) / 2, d1 - 2.9);
      this.addPatch({ kind: 'lot', poly, surf: S.ASPHALT });
      this.lots.push({ id: 'lucpark', poly });
      this.baysAlong({ x: cx, z: cz, tx: ax, tz: az, len: u1 - u0 - 2, dep: 5.5, id: 'lucpark' }, rng, STREET_CARS, 0.42);
      put('sign', Math.abs(u0) > Math.abs(u1) ? u0 + 0.6 : u1 - 0.6, d0 + 0.5, toPark, { smash: true, mass: 40, sign: 'p' });
    }
    const gate = P(0, K.plaza[3] + 0.5), gy = this.terrainH(gate[0], gate[1]);
    out.push(['pgate', gate[0], gate[1], toPark, {}]);
    for (const sd of [-1, 1]) { const [x, z] = P(sd * 3.4, K.plaza[3] + 0.5); this.cityCols.push({ k: 'circ', x, z, r: 0.28, y0: gy - 1, y1: gy + 5 }); }
    put('kiosk', -9.5, 25, toAve, { solid: true, kind: 'saldejums' });
    put('kiosk', 9.5, 25, toAve, { solid: true, kind: 'kafija' });
    for (const sd of [-1, 1]) {
      put('flagpole', sd * 12.6, 12, toAve, { solid: true, r: 0.3, flag: 0 });
      put('bench', sd * 5.4, 17, yawOf(-ax * sd, -az * sd), { smash: true, mass: 60 });
      put('bin', sd * 5.4, 19.4, 0, { smash: true, mass: 20 });
      put('flowers', sd * 4.6, 27.4, toAve, { smash: true, mass: 80 });
    }
    put('phone', -12.2, 18, yawOf(ax, az), { smash: true, mass: 90 });
    const [hu, hd, hr] = K.hub, H = P(hu, hd), hy = this.terrainH(H[0], H[1]);
    this.addPatch({ kind: 'tiles', poly: disc(H, hr), surf: S.PAVE });
    this.fountains.push({ x: H[0], z: H[1], r: 4.2, ring: hr, y: hy, bare: true });
    this.cityCols.push({ k: 'circ', x: H[0], z: H[1], r: 4.5, y0: hy - 1, y1: hy + 1.2 });
    this.glade(disc(H, hr + 7));
    const [mu, md, mr] = K.monument, Mo = P(mu, md);
    this.addPatch({ kind: 'tiles', poly: disc(Mo, mr), surf: S.PAVE });
    this.addPatch({ kind: 'tiles', pts: line(K.link), w: 8, surf: S.PAVE });
    this.glade(disc(Mo, mr + 9));
    this.glade(this.map.PARKS.find(pk => pk.id === K.square).poly);
    const ap = line(K.approach), al = Math.hypot(ap[1][0] - ap[0][0], ap[1][1] - ap[0][1]), atx = (ap[1][0] - ap[0][0]) / al, atz = (ap[1][1] - ap[0][1]) / al;
    this.addPatch({ kind: 'tiles', pts: ap, w: 6, surf: S.PAVE, margin: 0.6 });
    const foot = P(K.link[1][0], K.link[1][1]);
    this.rasterSeg(ap[1][0], ap[1][1], foot[0], foot[1], 5, i => { if (this.occ[i] === 6) this.occ[i] = PAVED; });
    luc.gateway = { at: P(0, d0 - 0.8), to: P(K.plaza[0] - 1.5, d0 - 0.8) };
    this.glade(this.rectPoly((ap[0][0] + ap[1][0]) / 2, (ap[0][1] + ap[1][1]) / 2, atx, atz, al / 2, 9));
    for (const sd of [-1, 1]) {
      out.push(['plamp', ap[0][0] + atx * 3 - atz * sd * 3.8, ap[0][1] + atz * 3 + atx * sd * 3.8, 0, { smash: true, mass: 70 }]);
      out.push(['flowers', ap[0][0] + atx * 8 - atz * sd * 4.2, ap[0][1] + atz * 8 + atx * sd * 4.2, yawOf(atx, atz), { smash: true, mass: 80 }]);
      for (const at of [16, 28]) tree([ap[0][0] + atx * at - atz * sd * 6.4, ap[0][1] + atz * at + atx * sd * 6.4], 0.9);
    }
    for (let k = 0; k < 4; k++) {
      const g = Math.PI / 4 + k * Math.PI / 2, [lx, lz] = polar([hu, hd], g, hr - 1.1), [qx, qz] = polar([hu, hd], g, hr - 4.6);
      out.push(['plamp', lx, lz, 0, { smash: true, mass: 70 }], ['flowers', qx, qz, 0, { smash: true, mass: 80 }]);
      for (const dg of [-0.36, 0.36]) {
        const [bx, bz] = polar([hu, hd], g + dg, hr - 1.9);
        out.push(['bench', bx, bz, yawOf(H[0] - bx, H[1] - bz), { smash: true, mass: 60 }]);
        tree(polar([hu, hd], g + dg, hr + 4.6), 0.95);
      }
    }
    const rad = deg => deg * Math.PI / 180;
    for (const deg of K.lamps) { const [x, z] = polar([mu, md], rad(deg), mr - 1.1); out.push(['plamp', x, z, 0, { smash: true, mass: 70 }]); }
    for (const deg of K.seats) { const [x, z] = polar([mu, md], rad(deg), mr - 1.9); out.push(['bench', x, z, yawOf(Mo[0] - x, Mo[1] - z), { smash: true, mass: 60 }]); }
    for (let deg = 30; deg < 360; deg += 30) tree(polar([mu, md], rad(deg), mr + 4.6), 0.95);
    this.alley(line(K.spine), 5, out);
    this.alley(line(K.north), 4.5, out);
    this.alley(line(K.memorial), 4.5, out);
    this.alley(line(K.east), 4, out);
    const [ru, rd, rr] = K.rotunda, R = P(ru, rd);
    this.addPatch({ kind: 'tiles', poly: disc(R, rr), surf: S.PAVE });
    out.push(['rotunda', R[0], R[1], toPark, { solid: true, r: 3.5 }]);
    const [tu, td, tr] = K.terrace, T = P(tu, td);
    this.addPatch({ kind: 'tiles', poly: disc(T, tr), surf: S.PAVE });
    for (const dx of [-4.6, 0, 4.6]) out.push(['bench', T[0] + dx, T[1] - tr + 1.6 + Math.abs(dx) * 0.2, 0, { smash: true, mass: 60 }]);
    out.push(['plamp', T[0] - 6.2, T[1] + 3.4, 0, { smash: true, mass: 70 }], ['plamp', T[0] + 6.2, T[1] + 3.4, 0, { smash: true, mass: 70 }], ['bin', T[0] + 6.6, T[1] - 2, 0, { smash: true, mass: 20 }]);
    this.trail(line(K.bank), 3, [T[0], T[1], tr]);
    this.trail(K.shore, 3, [T[0], T[1], tr]);
    this.addPatch({ kind: 'beach', poly: K.beach, surf: S.SAND });
    const [cx0, cz0, cstep, cn] = K.cabins;
    for (let k = 0; k < cn; k++) out.push(['cabin', cx0 + k * cstep, cz0, 0, { solid: true, r: 0.9 }]);
    out.push(['lifeguard', K.guard[0], K.guard[1], 0, { solid: true, r: 1.7 }]);
    out.push(['cafe', K.cafe[0], K.cafe[1], Math.PI, { solid: true, r: 2.8 }]);
    for (const [dx, dz] of [[6, 2.4], [9.6, -0.6], [5.2, -2.6]]) out.push(['table', K.cafe[0] + dx, K.cafe[1] + dz, 0, { smash: true, mass: 25 }]);
    const [vx, vz] = K.net;
    out.push(['vnet', vx, vz, 0, { smash: true, mass: 40, r: 1.2, len: 9.5 }]);
    for (const [a, c] of [[[-8, -4.5], [8, -4.5]], [[-8, 4.5], [8, 4.5]], [[-8, -4.5], [-8, 4.5]], [[8, -4.5], [8, 4.5]]]) ln([vx + a[0], vz + a[1]], [vx + c[0], vz + c[1]]);
    for (const [bx, bz] of K.boats) out.push(['boat', bx, bz, yawOf(-0.9, -0.43), { smash: true, mass: 140, r: 1.1 }]);
    const busy = [[vx, vz, 11], [K.guard[0], K.guard[1], 5], [cx0 + cn * cstep / 2, cz0, cn * cstep / 2 + 3]].concat(K.boats.map(q => [q[0], q[1], 4]));
    const bb = F.polyBox(K.beach);
    for (let k = 0, made = 0; k < 60 && made < 9; k++) {
      const x = F.lerp(bb.x0, bb.x1, F.hash2(k, 1, 77)), z = F.lerp(bb.z0, bb.z1, F.hash2(k, 2, 77));
      if (!F.inPoly(x, z, K.beach) || F.polyEdgeDist(x, z, K.beach) < 3.5 || busy.some(q => Math.hypot(q[0] - x, q[1] - z) < q[2])) continue;
      out.push(['parasol', x, z, F.hash2(k, 3, 77) * TAU, { smash: true, mass: 25 }]);
      busy.push([x, z, 4.5]);
      made++;
    }
    const [yu, yd] = K.play, Y = P(yu, yd), face = yawOf(nx, nz);
    this.addPatch({ kind: 'sand', poly: this.rectPoly(Y[0], Y[1], ax, az, 7, 5), surf: S.SAND });
    put('swing', yu - 3.5, yd, face, { solid: true, r: 1.4 });
    put('slide', yu + 3.5, yd, face, { solid: true, r: 1.3 });
    put('sandbox', yu, yd + 2.6, face, { smash: true, mass: 80 });
    for (const du of [-4, 4]) put('bench', yu + du, yd - 6.4, face, { smash: true, mass: 60 });
    this.glade(box(...K.picnic));
    for (const [u, d] of K.tables) put('picnic', u, d, F.hash2(u | 0, d | 0, 5) * Math.PI, { smash: true, mass: 70, r: 0.9 });
    put('bin', K.tables[0][0] + 3, K.tables[0][1] + 2, 0, { smash: true, mass: 20 });
    const [pu, pd, pl, pw] = K.pitch, pitch = (u, d) => P(pu + u, pd + d);
    this.glade(box(pu - pw - 3, pu + pw + 3, pd - pl - 4, pd + pl + 4));
    for (const e of [-1, 1]) {
      ln(pitch(-pw, e * pl), pitch(pw, e * pl));
      ln(pitch(e * pw, -pl), pitch(e * pw, pl));
      ln(pitch(-6, e * (pl - 7)), pitch(6, e * (pl - 7)));
      for (const sd of [-6, 6]) ln(pitch(sd, e * pl), pitch(sd, e * (pl - 7)));
      const [gx, gz] = pitch(0, e * (pl + 0.5));
      out.push(['goal', gx, gz, yawOf(-nx * e, -nz * e), { smash: true, mass: 90, r: 2.2 }]);
    }
    ln(pitch(-pw, 0), pitch(pw, 0));
    for (let k = 0; k < 16; k++) ln(pitch(Math.cos(k / 16 * TAU) * 5, Math.sin(k / 16 * TAU) * 5), pitch(Math.cos((k + 1) / 16 * TAU) * 5, Math.sin((k + 1) / 16 * TAU) * 5));
    for (const du of [-5, 5]) put('bench', pu - pw - 2, pd + du, yawOf(ax, az), { smash: true, mass: 60 });
    const [cu, cd, cl, cw] = K.court, court = box(cu - cl, cu + cl, cd - cw, cd + cw);
    this.addPatch({ kind: 'lot', poly: court, surf: S.ASPHALT });
    for (let k = 0; k < 4; k++) ln(court[k], court[(k + 1) % 4]);
    ln(P(cu, cd - cw), P(cu, cd + cw));
    for (const e of [-1, 1]) put('hoop', cu + e * (cl + 0.35), cd, yawOf(-ax * e, -az * e), { solid: true, r: 0.3 });
  };

  W.lucPlot = function (L, [fx, fz], [gx, gz], w, dep, o, luc, rng) {
    const O = this.occ, [cx, cz] = L(0, dep / 2 + 1);
    if (!this.rasterRect(cx, cz, fx, fz, w / 2 - 0.2, dep / 2 - 1.2, i => O[i] === 0)) return false;
    const [mx, mz] = L(0, dep / 2);
    this.rasterRect(mx, mz, fx, fz, w / 2, dep / 2, i => { if (O[i] === 0) O[i] = 6; });
    const out = luc.props, col = rng.pick(PICKETS), gate = rng() < 0.5 ? -1 : 1, along = yawOf(fx, fz), deep = yawOf(gx, gz);
    const rail = (f, g, yaw, len) => { const [x, z] = L(f, g); out.push(['picket', x, z, yaw, { smash: true, mass: 25, r: 1.3, len, col }]); };
    for (let j = 0; j < 6; j++) if (j !== (gate < 0 ? 1 : 4)) rail(-w / 2 + (j + 0.5) * w / 6, 0.3, along, w / 6);
    for (const f of o.open ? [-w / 2, w / 2] : [w / 2]) for (let j = 0; j < 8; j++) rail(f, 0.3 + (j + 0.5) * dep / 8, deep, dep / 8);
    if (o.back) for (let j = 0; j < 6; j++) rail(-w / 2 + (j + 0.5) * w / 6, dep + 0.3, along, w / 6);
    const two = rng() < 0.12, hw = two ? rng.range(5.8, 6.8) : rng.range(4.2, 6.2), hd = two ? rng.range(5, 6) : rng.range(3.6, 5);
    const hf = -gate * Math.min(rng.range(2, 3.6), w / 2 - hw / 2 - 1.2), hg = rng.range(11, 15), [hx, hz] = L(hf, hg), fl = two ? 2 : 1;
    const hut = {
      x: hx, z: hz, tx: fx, tz: fz, w: hw, d: hd, floors: fl, h: fl * 3.2, style: 'wood', fac: rng.pick(['wood1', 'wood2']), roof: 'gable', col: rng.pick(HUT_COLS), front: 1, y: this.terrainH(hx, hz) - 0.3, garden: true,
      jv: { fx: -gx, fz: -gz, veranda: hw > 5.6 && rng() < 0.45, turret: false, gable: false, roof: rng.pick(HUT_ROOFS) }
    };
    this.addBuilding(hut);
    const item = (type, f, g, yaw, q) => { const [x, z] = L(f, g); out.push([type, x, z, yaw, q]); };
    const tree = (f, g) => { const [x, z] = L(f, g); this.planted.push({ x, z, kind: 'apple', s: rng.range(0.55, 0.78), glade: true }); };
    const car = rng() < 0.2;
    if (car) {
      const [px, pz] = L(gate * w / 4, 4.6), pad = this.rectPoly(px, pz, gx, gz, 3.2, 1.7), nose = rng() < 0.5 ? 1 : -1;
      this.addPatch({ kind: 'lot', poly: pad, surf: S.ASPHALT, occ: false });
      this.lots.push({ id: 'garden', poly: pad });
      this.parkCar(px, pz, gx * nose, gz * nose, GARDEN_CARS, rng, 'garden');
    }
    if (hut.jv.veranda) item('flowers', hf, hg - hd / 2 - 4.4, along, { smash: true, mass: 40 });
    else item('beds', hf, 4.8, rng() < 0.5 ? along : deep, {});
    item('beds', hf, 21.4, rng() < 0.5 ? along : deep, {});
    if (!car && rng() < 0.55) item('beds', gate * (w / 2 - 3.6), 8.6, deep, {});
    if (rng() < 0.4) item('ghouse', gate * (w / 2 - 3.1), 15.2, deep, { smash: true, mass: 60, r: 1.4 });
    if (rng() < 0.55) item('shed', gate * (w / 2 - 1.8), dep - 1.9, yawOf(-gx, -gz), { smash: true, mass: 90, r: 0.8 });
    if (rng() < 0.45) item('barrel', hf + gate * (hw / 2 + 0.6), hg - hd / 2 + 0.6, 0, { smash: true, mass: 45 });
    tree(-gate * (w / 2 - 2), rng.range(4.5, 8));
    tree(gate * 2.6, 21);
    if (rng() < 0.6) tree(-gate * (w / 2 - 2), 23);
    luc.plots.push({ x: mx, z: mz, hut: hut.id, car });
    return true;
  };

  W.lucGarden = function (G, luc, rng) {
    const [ux, uz] = G.dir, vx = -uz, vz = ux, out = luc.props;
    const Q = (s, t) => [G.gate[0] + ux * s + vx * t, G.gate[1] + uz * s + vz * t];
    const box = (s0, s1, t0, t1) => [Q(s0, t0), Q(s1, t0), Q(s1, t1), Q(s0, t1)];
    const disc = (c, r, n = 20) => Array.from({ length: n }, (_, k) => [c[0] + Math.cos(k / n * TAU) * r, c[1] + Math.sin(k / n * TAU) * r]);
    const put = (type, s, t, yaw, o) => { const [x, z] = Q(s, t); out.push([type, x, z, yaw, o]); };
    for (const row of G.rows) {
      const [du, dt] = row.dir, n = Math.round((row.run[1] - row.run[0]) / G.plot[0]), step = (row.run[1] - row.run[0]) / n;
      const fx = ux * du + vx * dt, fz = uz * du + vz * dt;
      for (const side of row.sides) {
        const gx = (ux * dt - vx * du) * side, gz = (uz * dt - vz * du) * side;
        let prev = false;
        for (let k = 0; k < n; k++) {
          const at = row.run[0] + (k + 0.5) * step, [bx, bz] = Q(row.at[0] + du * at, row.at[1] + dt * at), e = row.hw + 0.8;
          const L = (f, g) => [bx + fx * f + gx * (e + g), bz + fz * f + gz * (e + g)];
          prev = this.lucPlot(L, [fx, fz], [gx, gz], step, G.plot[1], { open: !prev, back: row.back.includes(side) }, luc, rng);
        }
      }
    }
    const st = this.edges.find(e => e.name === G.street), W0 = F.STYLES.wood;
    if (st) for (const side of [-1, 1]) {
      for (let at = 40; at < st.len - 55;) {
        const w = rng.range(9, 12.5), dp = rng.range(8.5, 11), sb = rng.range(5, 8), q = this.edgePoint(st, at + w / 2);
        const off = st.hw + st.k.side + sb + dp / 2 + 1.3, x = q.x + q.rx * off * side, z = q.z + q.rz * off * side;
        if (!this.rectFree(x, z, q.tx, q.tz, w / 2, dp / 2, 0.6)) { at += 4; continue; }
        const fl = rng() < 0.4 ? 2 : 1, bld = { x, z, tx: q.tx, tz: q.tz, w, d: dp, floors: fl, h: fl * W0.floorH, style: 'wood', fac: rng.pick(W0.fac), roof: 'gable', col: rng.pick(W0.cols), front: side, y: this.terrainH(x, z) - 0.3 };
        this.addBuilding(bld);
        luc.houses.push(bld.id);
        if (rng() < 0.7) this.pendingFence(st, at, w + 2, side, st.hw + st.k.side + 1.8, rng);
        for (const k of [-1, 1]) this.planted.push({ x: x + q.rx * side * (dp / 2 + 5) + q.tx * k * w * 0.4, z: z + q.rz * side * (dp / 2 + 5) + q.tz * k * w * 0.4, kind: 'apple', s: rng.range(0.6, 0.85) });
        at += w + rng.range(7, 13);
      }
    }
    const sq = G.square, toStreet = yawOf(vx, vz);
    this.addPatch({ kind: 'tiles', poly: box(sq[0], sq[1], sq[2], sq[3]), surf: S.PAVE });
    put('kiosk', -21, -19.5, toStreet, { solid: true, kind: 'seklas' });
    put('pump', -30.5, -12, toStreet, { smash: true, mass: 70 });
    put('bench', -13.5, -21, toStreet, { smash: true, mass: 60 });
    put('bin', -11, -21, 0, { smash: true, mass: 20 });
    put('phone', -30.5, -20.5, toStreet, { smash: true, mass: 90 });
    put('plamp', -9.8, -10.5, 0, { smash: true, mass: 70 });
    const lot = G.lot, lotPoly = box(lot[0], lot[1], lot[2], lot[3]), [lx, lz] = Q((lot[0] + lot[1]) / 2, (lot[2] + lot[3]) / 2);
    this.addPatch({ kind: 'lot', poly: lotPoly, surf: S.ASPHALT });
    this.lots.push({ id: 'garden', poly: lotPoly });
    this.baysAlong({ x: lx, z: lz, tx: ux, tz: uz, len: lot[1] - lot[0] - 2, dep: lot[3] - lot[2], id: 'garden' }, rng, GARDEN_CARS, 0.6);
    put('sign', lot[1] + 0.8, lot[2] + 0.4, yawOf(vx, vz), { smash: true, mass: 40, sign: 'p' });
    const [wx, wz, wr] = G.view, tower = this.map.ZAK.tower, tl = Math.hypot(tower[0] - wx, tower[1] - wz), dx = (tower[0] - wx) / tl, dz = (tower[1] - wz) / tl;
    this.addPatch({ kind: 'tiles', poly: disc([wx, wz], wr), surf: S.PAVE });
    const vr = this.nearestRoad(wx, wz, 60);
    if (vr) this.trail([0.25, 0.5, 0.75].map(k => [F.lerp(vr.x, wx, k), F.lerp(vr.z, wz, k)]), 3, [wx, wz, wr]);
    for (const k of [-1, 0, 1]) out.push(['bench', wx - dx * (wr - 2.2) - dz * k * 2.6, wz - dz * (wr - 2.2) + dx * k * 2.6, yawOf(dx, dz), { smash: true, mass: 60 }]);
    out.push(['bin', wx - dx * (wr - 1.2) - dz * 4.6, wz - dz * (wr - 1.2) + dx * 4.6, 0, { smash: true, mass: 20 }]);
    for (let k = 0; k < 14; k++) {
      const a = k / 14 * TAU, x = wx + Math.cos(a) * (wr - 0.3), z = wz + Math.sin(a) * (wr - 0.3);
      if (!this.isWaterAt(x, z) && this.isWaterAt(wx + Math.cos(a) * (wr + 8), wz + Math.sin(a) * (wr + 8))) out.push(['qrail', x, z, yawOf(-Math.sin(a), Math.cos(a)), { smash: true, mass: 25, len: 2.6 }]);
    }
    const [ax, az, al, aw] = G.landing;
    this.addPatch({ kind: 'beach', poly: this.rectPoly(ax, az, 1, 0, al, aw), surf: S.SAND });
    const ar = this.nearestRoad(ax, az - aw, 60);
    if (ar) this.trail([0.25, 0.5, 1].map(k => [F.lerp(ar.x, ax, k), F.lerp(ar.z, az - aw - 0.4, k)]), 4);
    for (const k of [-1, 1]) out.push(['boat', ax + k * 9, az + 3, yawOf(k * 0.25, 1), { smash: true, mass: 140, r: 1.1 }]);
    out.push(['bench', ax + 15, az - aw + 1.2, yawOf(0, 1), { smash: true, mass: 60 }], ['picnic', ax - 14, az - aw + 2.5, 0.3, { smash: true, mass: 70, r: 0.9 }]);
    const lane = this.edges.find(e => e.name === G.footpath), ave = lane && this.nearestRoad(lane.pts[lane.pts.length - 1][0], lane.pts[lane.pts.length - 1][1], 120, e => e.k.side > 0 && !e.bridge);
    if (ave) { const q = lane.pts[lane.pts.length - 1]; this.trail([0.12, 0.5, 0.97].map(k => [F.lerp(ave.x, q[0], k), F.lerp(ave.z, q[1], k)]), 2.5); }
    for (const [x, z] of G.groves) {
      for (let k = 0, n = rng.int(5, 8); k < n; k++) {
        const a = rng() * TAU, r = 2 + rng() * 9;
        this.planted.push({ x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, kind: k % 3 ? 'birch' : 'oak', s: rng.range(0.9, 1.3) });
      }
    }
  };

  W.lucProps = function (add) {
    if (!this.luc) return;
    for (const [type, x, z, yaw, o] of this.luc.props) add(type, x, z, yaw, o);
    const { at, to } = this.luc.gateway, lamp = this.props.find(p => p.type === 'lamp' && Math.hypot(p.x - at[0], p.z - at[1]) < 7);
    if (lamp) { lamp.x = to[0]; lamp.z = to[1]; }
  };

  W.tirgus = function () {
    const T = this.map.TIRGUS, lm = this.landmarks.find(l => l.type === 'market');
    if (!T || !lm) return;
    const rng = F.rng(this.seed + 173), c = Math.cos(T.yaw), s = Math.sin(T.yaw), y = lm.y, O = this.occ;
    const L = (u, v) => [T.at[0] + c * u - s * v, T.at[1] + s * u + c * v];
    const D = (du, dv) => [c * du - s * dv, s * du + c * dv];
    const trg = this.trg = { L, D, y, yaw: T.yaw, solids: [], crowds: [], sheds: [], trucks: [], buses: [], props: [] };
    const put = (type, u, v, du, dv, o) => { const [x, z] = L(u, v), [fx, fz] = D(du, dv); trg.props.push([type, x, z, yawOf(fx, fz), o]); };
    const boxAt = (x, z, hx, hz, bc, bs, h, kind) => {
      this.cityCols.push({ k: 'box', x, z, hx, hz, c: bc, s: bs, y0: y - 1, y1: y + Math.max(h, 2.5), src: lm });
      this.rasterRect(x, z, bc, bs, hx, hz, i => { if (O[i] !== 1) O[i] = 3; });
      trg.solids.push({ kind, x, z, hx, hz, c: bc, s: bs, h });
    };
    const solid = (u0, v0, u1, v1, h, kind) => { const [x, z] = L((u0 + u1) / 2, (v0 + v1) / 2); boxAt(x, z, (u1 - u0) / 2, (v1 - v0) / 2, c, s, h, kind); };
    const crowd = (u0, v0, u1, v1, base, n, face, vendor) => trg.crowds.push({ box: [u0, v0, u1, v1], y: base, n, face, vendor });
    const H = T.halls, M = T.meat, [mu0, mu1] = M.u, [mv0, mv1] = M.v, mid = (mu0 + mu1) / 2, side = H.hw + H.wing;
    const rect = (u0, v0, u1, v1) => [L(u0, v0), L(u1, v0), L(u1, v1), L(u0, v1)];
    solid(H.u[0], H.v[0] - side, H.u[1], H.v[H.v.length - 1] + side, H.top, 'hall');
    trg.block = rect(H.u[0], H.v[0] - side, H.u[1], H.v[H.v.length - 1] + side);
    trg.meat = rect(mu0, mv0, mu1, mv1);
    trg.roofs = H.v.map(v => rect(H.u[0], v - H.hw, H.u[1], v + H.hw)).concat([trg.meat]);
    for (const u of [mu0, mu1 - 1]) { solid(u, mv0, u + 1, M.door[0], H.top, 'wall'); solid(u, M.door[1], u + 1, mv1, H.top, 'wall'); }
    for (const v of [mv0, mv1 - 1]) { solid(mu0, v, mid - M.gate, v + 1, H.top, 'wall'); solid(mid + M.gate, v, mu1, v + 1, H.top, 'wall'); }
    for (const [d0, d1] of M.decks) {
      solid(mu0 + 1, d0, mid - M.aisle, d1, M.deck, 'deck');
      solid(mid + M.aisle, d0, mu1 - 1, d1, M.deck, 'deck');
      const n = Math.round((d1 - d0) / 4.6);
      crowd(mid - M.aisle - 2.5, d0 + 1, mid - M.aisle - 0.6, d1 - 1, M.deck, n, [-1, 0]);
      crowd(mid - M.aisle - 5.6, d0 + 2, mid - M.aisle - 4.4, d1 - 2, M.deck, n - 2, [1, 0], true);
      crowd(mid + M.aisle + 0.6, d0 + 1, mid + M.aisle + 2.5, d1 - 1, M.deck, n, [1, 0]);
      crowd(mid + M.aisle + 4.4, d0 + 2, mid + M.aisle + 5.6, d1 - 2, M.deck, n - 2, [-1, 0], true);
    }
    const SURF = { tiles: S.PAVE, lot: S.ASPHALT, sand: S.GRAVEL };
    for (const [kind, pts] of T.pads) {
      const poly = pts.map(q => L(q[0], q[1]));
      this.addPatch({ kind, poly, surf: SURF[kind] });
      if (kind === 'lot') this.lots.push({ id: 'tirgus', poly });
    }
    for (const [u, v, du, dv, len] of T.parks) {
      const [x, z] = L(u, v), [tx, tz] = D(du, dv);
      this.baysAlong({ x, z, tx, tz, len, dep: 5, id: 'tirgus' }, rng, STREET_CARS, 0.62);
    }
    for (const [u, v, goods] of T.sheds) {
      const [x, z] = L(u, v);
      solid(u - 10, v - 4.2, u + 10, v + 4.2, 3.7, 'shed');
      trg.sheds.push({ x, z, y, yaw: T.yaw, len: 20, goods });
      crowd(u - 9, v - 3.9, u + 9, v - 2.6, 0.22, 4, [0, 1]);
      crowd(u - 9, v + 2.6, u + 9, v + 3.9, 0.22, 4, [0, -1]);
      crowd(u - 8, v - 0.9, u + 8, v + 0.9, 0.22, 5, null, true);
      put('slamp', u, v, 1, 0, {});
    }
    for (const [u0, v0, u1, v1, n, face, goods] of T.rows) {
      const len = Math.hypot(u1 - u0, v1 - v0), du = (u1 - u0) / len, dv = (v1 - v0) / len;
      for (let k = 0; k < n; k++) put('stall', F.lerp(u0, u1, k / (n - 1)), F.lerp(v0, v1, k / (n - 1)), dv * face, -du * face, { smash: true, mass: 45, r: 1.3, goods: goods[k % goods.length] });
    }
    for (const [u0, v0, u1, v1, n, goods, box] of T.piles) {
      for (let k = 0; k < n; k++) put('crates', F.lerp(u0, u1, n > 1 ? k / (n - 1) : 0), F.lerp(v0, v1, n > 1 ? k / (n - 1) : 0), v1 - v0, u0 - u1, { smash: true, mass: 18, r: 0.75, goods, box: !!box });
    }
    const KIT = {
      plamp: { smash: true, mass: 70 }, bench: { smash: true, mass: 60 }, bin: { smash: true, mass: 20 }, table: { smash: true, mass: 25 }, phone: { smash: true, mass: 90 }, sign: { smash: true, mass: 40 },
      cart: { smash: true, mass: 30, r: 0.7 }, alamp: { solid: true, r: 0.4 }, flagpole: { solid: true, r: 0.3 }, kiosk: { solid: true }
    };
    for (const [type, list] of Object.entries(T.furniture)) for (const [u, v, du = 1, dv = 0, extra] of list) put(type, u, v, du, dv, Object.assign({}, KIT[type], extra));
    const TRUCK = { zil: [1.25, 3.6, 3.3], van: [1.05, 2.7, 2.5], kvass: [0.75, 1.5, 1.9] };
    for (const [u, v, du, dv, kind] of T.trucks) {
      const [x, z] = L(u, v), [fx, fz] = D(du, dv), yaw = yawOf(fx, fz), dim = TRUCK[kind];
      trg.trucks.push({ x, z, y, yaw, kind, seed: trg.trucks.length });
      boxAt(x, z, dim[0], dim[1], Math.cos(yaw), Math.sin(yaw), dim[2], 'truck');
    }
    const B = T.bus, [hu0, hu1, hv0, hv1] = B.hall, [du0, du1, dv0, dv1] = B.deck, [bx, bz] = L((hu0 + hu1) / 2, (hv0 + hv1) / 2), [tx, tz] = D(1, 0);
    const hall = { x: bx, z: bz, tx, tz, w: hu1 - hu0, d: hv1 - hv0, floors: 2, h: 10, style: 'industry', fac: 'glass', roof: 'flat', col: '#c4ccd0', front: 1, y: this.terrainH(bx, bz) - 0.3 };
    this.addBuilding(hall);
    trg.terminal = hall.id;
    solid(du0, dv0, du1, dv1, 0.3, 'deck');
    crowd(du0 + 2, dv0 + 1, du1 - 2, dv1 - 2.5, 0.3, 16, null);
    for (const u of B.lamps) put('slamp', u, dv0 + 3.5, 1, 0, { y: y + 0.3 });
    const [nx, nz] = D(0, 1), [sx, sz] = D(0, -1);
    const bus = (u, v, fx, fz, livery) => {
      const [x, z] = L(u, v), yaw = yawOf(fx, fz);
      trg.buses.push({ x, z, y, yaw, livery });
      boxAt(x, z, 1.3, 5.8, Math.cos(yaw), Math.sin(yaw), 3.2, 'bus');
    };
    B.bays.forEach((u, i) => {
      for (const e of [-3.4, 3.4]) this.paint.push({ a: L(u + e, dv0 - 0.6), b: L(u + e, dv0 - 13), w: 0.14, col: 'w' });
      if (i !== B.gone) bus(u, dv0 - 7, nx, nz, i % 3);
    });
    B.spare.forEach(([u, v], i) => bus(u, v, sx, sz, (i + 1) % 3));
    for (const [u0, v0, u1, v1, w, col, dash] of B.marks) {
      const len = Math.hypot(u1 - u0, v1 - v0), n = dash ? Math.floor(len / dash / 2) : 1, step = dash ? dash / len : 1;
      const at = k => L(F.lerp(u0, u1, k), F.lerp(v0, v1, k));
      for (let k = 0; k < n; k++) this.paint.push({ a: at(k * 2 * step), b: at((k * 2 + 1) * step), w, col });
    }
    const [tu, tv, step, cabs] = B.taxi;
    for (let k = 0; k < cabs; k++) { const [x, z] = L(tu, tv + step * k); this.parkCar(x, z, sx, sz, ['gaz24', 'gaz24', 'gaz24', 'w124', 'vaz2108'], rng, 'taxi'); }
    T.stores.forEach(([u, v, du, dv, w, d, col], i) => {
      const [x, z] = L(u, v), [fx, fz] = D(du, dv);
      this.addBuilding({ x, z, tx: fx, tz: fz, w, d, floors: 2, h: 10, style: 'industry', fac: 'brick5', roof: 'gable', col, front: 1, y: this.terrainH(x, z) - 0.3, seed: 700 + i });
    });
    const [au, av, span] = T.arch, [ax, az] = L(au, av);
    trg.arch = { x: ax, z: az, y, yaw: T.yaw, span };
    for (const sd of [-1, 1]) { const [px, pz] = L(au + sd * span, av); this.cityCols.push({ k: 'circ', x: px, z: pz, r: 0.45, y0: y - 1, y1: y + 8, src: lm }); }
    trg.fence = T.fence.map(q => L(q[0], q[1]));
    for (let i = 0; i + 1 < trg.fence.length; i++) {
      const a = trg.fence[i], b = trg.fence[i + 1];
      this.cityCols.push({ k: 'seg', x1: a[0], z1: a[1], x2: b[0], z2: b[1], r: 0.22, y0: y - 1, y1: y + 2.2, src: lm });
    }
  };

  W.tirgusProps = function (add) {
    if (!this.trg) return;
    for (const [type, x, z, yaw, o] of this.trg.props) add(type, x, z, yaw, o);
  };

  W.stopExtras = function (o, p, side) {
    const along = (u, off) => [o.x + p.tx * u - p.rx * side * off, o.z + p.tz * u - p.rz * side * off];
    const [sx, sz] = along(3.4, 0.9);
    if (this.offRoad(sx, sz, 0.3)) this.props.push({ type: 'sign', x: sx, z: sz, y: this.groundY(sx, sz), yaw: yawOf(p.tx * side, p.tz * side), smash: true, mass: 40, sign: 'bus' });
    const d = this.districtAt(o.x, o.z);
    if (!d || !(SOVIET.has(d.style) || d.style === 'wood' || d.style === 'jugend')) return;
    const n = 1 + ((F.hash2(o.x | 0, o.z | 0, 21) * 2.5) | 0);
    for (let k = 0; k < n; k++) {
      const [x, z] = along(-6 - k * 3.6, -3.4);
      const i = this.oi(x, z);
      if (i < 0 || (this.occ[i] !== 0 && this.occ[i] !== 7 && this.occ[i] !== 1) || !this.offRoad(x, z, 2.2) || this.isWaterAt(x, z)) continue;
      this.props.push({ type: 'kiosk', x, z, y: this.terrainH(x, z), yaw: o.yaw, solid: true, kind: KIOSKS[(F.hash2(x | 0, z | 0, 23) * KIOSKS.length) | 0] });
      this.occ[i] = 4;
    }
    const [px, pz] = along(6.5, -1.6);
    if (this.offRoad(px, pz, 1) && !this.isWaterAt(px, pz)) this.props.push({ type: 'phone', x: px, z: pz, y: this.groundY(px, pz), yaw: o.yaw, smash: true, mass: 90 });
  };

  W.airProps = function (add) {
    const air = this.air, AIR = this.map.AIR;
    if (!air || !air.forecourt) return;
    const fc = AIR.forecourt;
    AIR.flags.forEach((x, i) => add('flagpole', x, fc.z0 + 5, 0, { solid: true, r: 0.3, flag: i }));
    for (let x = fc.x0 + 6; x <= fc.x1 - 6; x += 18) add('alamp', x, fc.z0 + 3.2, Math.PI, { solid: true, r: 0.4 });
    for (const [x, z] of AIR.trolleys) add('trolleys', x, z, Math.PI / 2, { smash: true, mass: 50 });
    for (const [x, z, k] of AIR.kiosks) add('kiosk', x, z, Math.PI, { solid: true, kind: k });
    for (const [x, z] of AIR.benches) add('bench', x, z, 0, { smash: true, mass: 60 });
    const road = air.road, kerb = road.hw + 0.45;
    for (let s = 2; s < road.len - 2; s += 5) {
      const p = this.edgePoint(road, s);
      if (p.x < fc.x0 || p.x > fc.x1 || (p.x > AIR.taxi.x0 - 3 && p.x < AIR.taxi.x1 + 3)) continue;
      const lat = p.rz < 0 ? 1 : -1;
      add('bollard', p.x + p.rx * lat * kerb, p.z + p.rz * lat * kerb, 0, { smash: true, mass: 35 });
    }
    for (const f of air.fence) add('afence', f.x, f.z, f.yaw, { smash: true, mass: 30, len: 3 });
    for (const g of air.gates) {
      const fx = Math.sin(g.yaw), fz = -Math.cos(g.yaw);
      for (const s of [-1, 1]) add('gatepost', g.x + fx * s * g.w / 2, g.z + fz * s * g.w / 2, g.yaw, { solid: true, r: 0.35 });
    }
    add('windsock', AIR.sock[0], AIR.sock[1], 0, { solid: true, r: 0.4 });
    for (const v of AIR.vehicles) add(v[2], v[0], v[1], v[3], { solid: true, r: v[4] || 1.5 });
  };

  W.bisumuiza = function () {
    const B = this.map.BIS;
    if (!B) return;
    const rng = F.rng(this.seed + 211), first = this.buildings.length;
    const bis = this.bis = { props: [], towers: [], signs: [], fence: [], stops: [], solids: [], trucks: [], gates: [] };
    for (const c of B.clear) for (let i = 0; i + 1 < c.pts.length; i++) {
      const a = c.pts[i], q = c.pts[i + 1], l = Math.hypot(q[0] - a[0], q[1] - a[1]);
      this.glade(this.rectPoly((a[0] + q[0]) / 2, (a[1] + q[1]) / 2, (q[0] - a[0]) / l, (q[1] - a[1]) / l, l / 2 + c.hw / 2, c.hw));
    }
    this.bisTram(B.tram, bis);
    this.bisManor(B.manor, bis, rng);
    this.bisDairy(B.dairy, bis, rng);
    this.bisCsdd(B.csdd, bis, rng);
    this.bisLine(B.line, bis);
    this.bisRows(B, rng);
    this.blockWalks(this.buildings.slice(first));
    this.bisLots(B, rng);
    this.bisGreen(B, rng);
  };

  W.bisReserve = function (x, z, r, code = 4) {
    const O = this.occ;
    this.rasterDisc(x, z, r, i => { if (O[i] === 0 || O[i] === 7) O[i] = code; });
  };

  W.bisFrame = function (type) {
    const lm = this.landmarks.find(l => l.type === type), c = Math.cos(lm.yaw), s = Math.sin(lm.yaw);
    return { lm, L: (u, v) => [lm.x + c * u - s * v, lm.z + s * u + c * v], D: (u, v) => [c * u - s * v, s * u + c * v] };
  };

  W.bisFence = function (bis, a, c, gap) {
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(1, Math.round(len / 3)), yaw = yawOf(c[0] - a[0], c[1] - a[1]);
    for (let j = 0; j < n; j++) {
      const x = a[0] + (c[0] - a[0]) * (j + 0.5) / n, z = a[1] + (c[1] - a[1]) * (j + 0.5) / n;
      if (gap && Math.hypot(x - gap[0], z - gap[1]) < gap[2]) continue;
      bis.fence.push({ x, z, yaw, len: len / n });
    }
  };

  W.bisTram = function (T, bis) {
    const named = id => this.edges[id].name === T.name, O = this.occ, g = T.gap, [cx, cz, R] = T.loop;
    let nd = this.nearestNode(T.from[0], T.from[1], n => n.edges.some(named)), prev = null;
    const path = [];
    for (let guard = 0; guard < 200; guard++) {
      const e = nd.edges.map(id => this.edges[id]).find(q => q.name === T.name && q !== prev);
      if (!e) break;
      const fwd = e.a === nd.id, n = e.pts.length;
      for (let k = path.length ? 1 : 0; k < n; k++) { const i = fwd ? k : n - 1 - k; path.push({ x: e.pts[i][0], z: e.pts[i][1], y: e.y[i], e }); }
      nd = this.nodes[fwd ? e.b : e.a];
      prev = e;
    }
    const s = [0];
    for (let i = 1; i < path.length; i++) s.push(s[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z));
    let iL = 0;
    path.forEach((p, i) => { if (Math.hypot(p.x - T.leave[0], p.z - T.leave[1]) < Math.hypot(path[iL].x - T.leave[0], path[iL].z - T.leave[1])) iL = i; });
    const at = d => {
      let i = 1;
      while (i < path.length - 1 && s[i] < d) i++;
      const a = path[i - 1], c = path[i], l = s[i] - s[i - 1] || 1, t = F.clamp((d - s[i - 1]) / l, 0, 1), tx = (c.x - a.x) / l, tz = (c.z - a.z) / l;
      return { x: a.x + (c.x - a.x) * t, z: a.z + (c.z - a.z) * t, y: a.y + (c.y - a.y) * t, tx, tz, rx: -tz, rz: tx, e: c.e };
    };
    const side = (d, k) => { const p = at(d); return [p.x + p.rx * g * k, p.z + p.rz * g * k]; };
    const tangent = (p, k) => {
      const dx = cx - p[0], dz = cz - p[1], d = Math.hypot(dx, dz), a = Math.atan2(dz, dx) + k * Math.asin(R / d), l = Math.sqrt(d * d - R * R);
      return [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l];
    };
    const leg = (k, d, rad) => {
      const corner = side(d, k), end = tangent(corner, k);
      return { from: d - 30, end, pts: F.resample(F.fillet([side(d - 30, k), corner, end], rad, false), 2) };
    };
    const sP = s[iL], south = leg(1, sP - 12, 20), north = leg(-1, sP + 10, 24);
    const a0 = Math.atan2(south.end[1] - cz, south.end[0] - cx), a1 = Math.atan2(north.end[1] - cz, north.end[0] - cx), sweep = ((a0 - a1) % TAU + TAU) % TAU, arc = [];
    for (let k = 1; k < 32; k++) arc.push([cx + Math.cos(a0 - sweep * k / 32) * R, cz + Math.sin(a0 - sweep * k / 32) * R]);
    const loop = south.pts.concat(arc, north.pts.slice().reverse());
    const track = (k, to) => { const out = []; for (let d = 0; d < to; d += 6) out.push(side(d, k)); out.push(side(to, k)); return out; };
    const kerb = q => { const nr = this.nearestRoad(q[0], q[1], 30, e => e.name === T.name); return nr ? nr.d - nr.e.hw : 99; };
    const run = pts => pts.map(q => { const k = kerb(q), bed = k > 2.9; return { x: q[0], z: q[1], y: this.ground(q[0], q[1], 1e4, false), bed, walk: !bed && k > 0 }; });
    const runs = [run(track(1, south.from)), run(loop), run(track(-1, north.from))];
    for (const r of runs) for (let i = 0; i + 1 < r.length; i++) if (r[i].bed || r[i + 1].bed) this.rasterSeg(r[i].x, r[i].z, r[i + 1].x, r[i + 1].z, 2.4, k => { if (O[k] === 0 || O[k] === 7) O[k] = 1; });
    const poles = [], spans = [];
    const stand = (x, z, e) => {
      const i = this.oi(x, z);
      return i >= 0 && O[i] !== 2 && O[i] !== 3 && !this.nearNode(x, z, 9) && this.offRoad(x, z, 0.6, e);
    };
    const pair = d => {
      const p = at(d), off = p.e.hw + (p.e.k.side || 0) + 0.45, a = [p.x - p.rx * off, p.z - p.rz * off], c = [p.x + p.rx * off, p.z + p.rz * off];
      if (!stand(a[0], a[1], p.e) || !stand(c[0], c[1], p.e)) return false;
      poles.push({ x: a[0], z: a[1], ax: 0, az: 0 }, { x: c[0], z: c[1], ax: 0, az: 0 });
      spans.push([a[0], a[1], c[0], c[1]]);
      return true;
    };
    for (let d = 18; d < south.from - 6; d += T.span) if (!pair(d) && !pair(d + 7)) pair(d - 7);
    const arm = 2.9, mid = [loop.reduce((a, q) => a + q[0], 0) / loop.length, loop.reduce((a, q) => a + q[1], 0) / loop.length];
    const inner = loop.length - north.pts.length;
    let acc = 8;
    for (let i = 1; i < loop.length - 1; i++) {
      acc += Math.hypot(loop[i][0] - loop[i - 1][0], loop[i][1] - loop[i - 1][1]);
      if (acc < 17 || kerb(loop[i]) < 2.9) continue;
      const tx = loop[i + 1][0] - loop[i - 1][0], tz = loop[i + 1][1] - loop[i - 1][1], l = Math.hypot(tx, tz) || 1;
      let nx = -tz / l, nz = tx / l;
      if (((loop[i][0] - mid[0]) * nx + (loop[i][1] - mid[1]) * nz < 0) !== (i > inner)) { nx = -nx; nz = -nz; }
      const x = loop[i][0] + nx * arm, z = loop[i][1] + nz * arm;
      if (!stand(x, z, null)) continue;
      poles.push({ x, z, ax: -nx * arm, az: -nz * arm });
      acc = 0;
    }
    for (const p of poles) {
      p.y = this.terrainH(p.x, p.z);
      this.bisReserve(p.x, p.z, 0.9);
    }
    const E = T.end, lay = north.pts.filter(q => kerb(q) > 5), a = lay[0], n0 = north.end, len = Math.hypot(n0[0] - a[0], n0[1] - a[1]);
    const ux = (n0[0] - a[0]) / len, uz = (n0[1] - a[1]) / len, px = uz, pz = -ux, face = yawOf(-px, -pz);
    const Q = (f, l) => [a[0] + ux * len * f + px * l, a[1] + uz * len * f + pz * l];
    const put = (type, q, yaw, o) => { bis.props.push([type, q[0], q[1], yaw, o]); this.bisReserve(q[0], q[1], 1.2); };
    this.addPatch({ kind: 'tiles', pts: [Q(E.platform[0], E.platform[2]), Q(E.platform[1], E.platform[2])], w: E.platform[3], surf: S.PAVE });
    const sh = Q(E.shelter[0], E.shelter[1]);
    bis.stops.push({ x: sh[0], z: sh[1], y: this.terrainH(sh[0], sh[1]), yaw: face, end: true });
    const [ho, hw, hd] = E.hut, hut = [cx + px * ho, cz + pz * ho];
    this.addBuilding({ x: hut[0], z: hut[1], tx: ux, tz: uz, w: hw, d: hd, floors: 1, h: 3.6, style: 'industry', fac: 'brick5', roof: 'flat', col: '#c8b8a8', front: 1, y: this.terrainH(hut[0], hut[1]) - 0.3 });
    for (const [o, along, kind] of E.kiosks) put('kiosk', [cx + px * o + ux * along, cz + pz * o + uz * along], yawOf(px, pz), { solid: true, kind });
    for (const f of E.seats) put('bench', Q(f, E.shelter[1]), face, { smash: true, mass: 60 });
    for (const f of E.lamps) put('plamp', Q(f, E.shelter[1] + 0.4), 0, { smash: true, mass: 70 });
    put('bin', Q(E.bin, E.shelter[1]), 0, { smash: true, mass: 20 });
    put('sign', Q(E.sign[0], E.sign[1]), face, { smash: true, mass: 40, sign: 'tram' });
    const name = Q(E.name[0], E.name[1]);
    bis.signs.push({ id: 'galap', x: name[0], z: name[1], y: this.terrainH(name[0], name[1]), yaw: yawOf(-ux, -uz), w: 4.4, h: 1.1, lift: 2.5 });
    this.cityCols.push({ k: 'circ', x: name[0], z: name[1], r: 0.3, y0: -1, y1: 5 });
    for (const st of T.stops) {
      const nr = this.nearestRoad(st[0], st[1], 40, e => e.name === T.name);
      if (!nr) continue;
      const k = (nr.rz > 0 ? 1 : -1) * st[2], off = nr.e.hw + nr.e.k.side - 0.85, x = nr.x + nr.rx * off * k, z = nr.z + nr.rz * off * k, yaw = yawOf(-nr.rx * k, -nr.rz * k);
      if (this.nearNode(x, z, 12) || !this.offRoad(x, z, 0.3, nr.e)) continue;
      bis.stops.push({ x, z, y: nr.y, yaw });
      bis.props.push(['sign', x + nr.tx * 4.2, z + nr.tz * 4.2, yaw, { smash: true, mass: 40, sign: 'tram' }]);
      bis.props.push(['bench', x - nr.tx * 4.4 + nr.rx * k * 0.5, z - nr.tz * 4.4 + nr.rz * k * 0.5, yaw, { smash: true, mass: 60 }]);
    }
    const car = Q(E.car, 0);
    bis.tram = { runs, poles, spans, car, dir: [-ux, -uz], loop: T.loop, len: s[iL], street: [at(0), at(sP)].map(p => [p.x, p.z]) };
  };

  W.bisManor = function (M, bis, rng) {
    const { lm, L, D } = this.bisFrame('bisumuiza'), [cu, cv, cr] = M.court, [fx, fz] = L(cu, cv), [ax, az] = D(1, 0);
    bis.solids.push({ x: lm.x, z: lm.z, hx: M.body[0], hz: M.body[1], tx: ax, tz: az });
    this.addPatch({ kind: 'court', poly: Array.from({ length: 24 }, (_, k) => [fx + Math.cos(k / 24 * TAU) * cr, fz + Math.sin(k / 24 * TAU) * cr]), surf: S.GRAVEL });
    this.addPatch({ kind: 'court', pts: M.walk.map(q => L(q[0], q[1])), w: 6, surf: S.GRAVEL });
    for (const [u, v, w, d, turn, fac, col] of M.houses) {
      const [x, z] = L(u, v), [tx, tz] = turn ? D(0, 1) : D(1, 0);
      if (!this.rectFree(x, z, tx, tz, w / 2, d / 2, 1.5)) continue;
      this.addBuilding({ x, z, tx, tz, w, d, floors: 1, h: 3.2, style: 'wood', fac, roof: 'gable', col, front: 1, y: this.terrainH(x, z) - 0.3 });
    }
    for (const [u, v, r] of M.lawns) { const [x, z] = L(u, v); this.bisReserve(x, z, r, 6); }
    for (const e of this.edges) {
      if (e.rid !== M.alley) continue;
      for (let s = 12, k = 0; s < e.len - 12; s += 7.5, k++) {
        const p = this.edgePoint(e, s);
        for (const sd of [-1, 1]) this.planted.push({ x: p.x + p.rx * sd * (e.hw + 2.9), z: p.z + p.rz * sd * (e.hw + 2.9), kind: 'linden', s: 1.02 + (k % 3) * 0.07 });
      }
    }
    const nr = this.nearestRoad(M.gate[0], M.gate[1], 12, e => e.rid === M.alley);
    if (nr) {
      for (const sd of [-1, 1]) {
        const x = nr.x + nr.rx * sd * (nr.e.hw + 1.7), z = nr.z + nr.rz * sd * (nr.e.hw + 1.7);
        bis.props.push(['gpier', x, z, yawOf(nr.tx, nr.tz), { solid: true, r: 0.6 }]);
        this.bisReserve(x, z, 1.4);
      }
    }
    const bb = F.polyBox(M.park), cell = 11.5, kinds = ['linden', 'oak', 'linden', 'birch', 'oak', 'linden'];
    for (let z = bb.z0; z < bb.z1; z += cell) for (let x = bb.x0; x < bb.x1; x += cell) {
      const px = x + rng() * cell, pz = z + rng() * cell, kind = kinds[Math.floor(rng() * kinds.length)], s = 0.95 + rng() * 0.4;
      if (!F.inPoly(px, pz, M.park)) continue;
      const q = this.nearestRoad(px, pz, 12, e => e.rid === M.alley);
      if (q && q.d < q.e.hw + 6) continue;
      this.planted.push({ x: px, z: pz, kind, s });
    }
    for (const [u, v] of M.seats) { const [x, z] = L(u, v); bis.props.push(['bench', x, z, yawOf(fx - x, fz - z) + Math.PI, { smash: true, mass: 60 }]); }
    for (const [u, v] of M.lamps) { const [x, z] = L(u, v); bis.props.push(['plamp', x, z, 0, { smash: true, mass: 70 }]); }
  };

  W.bisDairy = function (Dy, bis, rng) {
    const { lm, L, D } = this.bisFrame('piens'), [tx, tz] = D(1, 0), y = lm.y;
    const box = (x0, z0, x1, z1, h) => {
      const [x, z] = L((x0 + x1) / 2, (z0 + z1) / 2);
      bis.solids.push({ x, z, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2, tx, tz });
      this.cityCols.push({ k: 'box', x, z, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2, c: tx, s: tz, y0: y - 2, y1: y + h, src: lm });
    };
    const drum = (u, v, r, h) => { const [x, z] = L(u, v); this.cityCols.push({ k: 'circ', x, z, r, y0: y - 2, y1: y + h, src: lm }); };
    box(...Dy.hall);
    box(...Dy.boiler);
    drum(Dy.stack[0], Dy.stack[1], Dy.stack[2], Dy.stack[3]);
    for (const [u, v] of Dy.silos) drum(u, v, Dy.silo[0], Dy.silo[1]);
    const [y0u, y0v, y1u, y1v] = Dy.yard, hall = Dy.hall;
    const yard = [[y0u, y0v], [y1u, y0v], [y1u, y1v], [hall[0] - 1, y1v], [hall[0] - 1, hall[3]], [hall[2] + 1, hall[3]], [hall[2] + 1, hall[1]], [y0u, hall[1]]].map(q => L(q[0], q[1]));
    this.addPatch({ kind: 'lot', poly: yard, surf: S.ASPHALT });
    this.lots.push({ id: 'piens', poly: yard });
    const [gu, gv, gw] = Dy.gate, gate = L(gu, gv);
    this.addPatch({ kind: 'lot', poly: [L(gu - gw / 2, gv - 1.6), L(gu + gw / 2, gv - 1.6), L(gu + gw / 2, gv + 0.8), L(gu - gw / 2, gv + 0.8)], surf: S.ASPHALT });
    bis.gates.push(gate);
    for (let i = 0; i + 1 < Dy.front.length; i++) this.bisFence(bis, L(...Dy.front[i]), L(...Dy.front[i + 1]), [gate[0], gate[1], gw / 2 + 0.4]);
    for (const sd of [-1, 1]) { const [x, z] = L(gu + sd * gw / 2, gv); bis.props.push(['gatepost', x, z, yawOf(tx, tz), { solid: true, r: 0.35 }]); }
    const [bu, bv, bw] = Dy.board, bp = L(bu, bv), [nx, nz] = D(0, -1);
    bis.signs.push({ id: 'piens', x: bp[0], z: bp[1], y: this.terrainH(bp[0], bp[1]), yaw: yawOf(nx, nz), w: bw, h: bw / 4, lift: 0.5 });
    this.cityCols.push({ k: 'box', x: bp[0], z: bp[1], hx: bw / 2, hz: 0.2, c: tx, s: tz, y0: y - 1, y1: y + 2.4 });
    for (const [u, v, len] of Dy.bays) { const [x, z] = L(u, v); this.baysAlong({ x, z, tx, tz, len, dep: 5.4, id: 'piens' }, rng, STREET_CARS, 0.55); }
    for (const [u, v] of Dy.trucks) {
      const [x, z] = L(u, v), [fx, fz] = D(0, -1), yaw = yawOf(fx, fz);
      bis.trucks.push({ x, z, y, yaw });
      this.cityCols.push({ k: 'box', x, z, hx: 1.25, hz: 3.9, c: Math.cos(yaw), s: Math.sin(yaw), y0: y - 1, y1: y + 3.2 });
    }
    for (const [u, v, w, d, fl, turn] of Dy.sheds) {
      const [x, z] = L(u, v), [sx, sz] = turn ? D(0, 1) : D(1, 0);
      if (!this.rectFree(x, z, sx, sz, w / 2, d / 2, 2)) continue;
      this.addBuilding({ x, z, tx: sx, tz: sz, w, d, floors: fl, h: Math.min(15, fl * 5 + 1), style: 'industry', fac: fl > 2 ? 'factory1' : 'factory2', roof: 'flat', col: fl > 2 ? '#c0b8a8' : '#b8bcb8', front: 1, y: this.terrainH(x, z) - 0.3 });
    }
  };

  W.bisCsdd = function (C, bis, rng) {
    const [ux, uz] = C.dir, nx = -uz, nz = ux, L = (a, c) => [C.c[0] + ux * a + nx * c, C.c[1] + uz * a + nz * c];
    const yard = [L(-C.hl, -C.hw), L(C.hl, -C.hw), L(C.hl, C.hw), L(-C.hl, C.hw)];
    this.addPatch({ kind: 'lot', poly: yard, surf: S.ASPHALT });
    this.lots.push({ id: 'csdd', poly: yard });
    const house = (a, c, w, d, fl, brick) => {
      const [x, z] = L(a, c);
      this.addBuilding({ x, z, tx: ux, tz: uz, w, d, floors: fl, h: brick ? fl * 2.9 + 1 : fl * 5 + 1, style: 'industry', fac: brick ? 'brick5' : 'factory2', roof: 'flat', col: brick ? '#d8d0c0' : '#c8ccd0', front: 1, y: this.terrainH(x, z) - 0.3 });
      return this.buildings[this.buildings.length - 1];
    };
    const hall = house(...C.hall, false);
    house(...C.office, true);
    const [ba, bc, bw] = C.board, bp = L(ba, bc);
    bis.signs.push({ id: 'csdd', x: bp[0], z: bp[1], y: this.terrainH(bp[0], bp[1]), yaw: yawOf(-ux, -uz), w: bw, h: bw * 0.375, lift: 2.6 });
    this.cityCols.push({ k: 'circ', x: bp[0], z: bp[1], r: 0.3, y0: -1, y1: 6 });
    const [ra, rc, rw] = C.roofSign, rp = L(ra, rc);
    bis.signs.push({ id: 'csdd', x: rp[0], z: rp[1], y: hall.y + hall.h, yaw: yawOf(-nx, -nz), w: rw, h: rw * 0.375, lift: 0.4 });
    const gate = L(C.gate[0], C.gate[1]);
    for (let k = 0; k < 4; k++) this.bisFence(bis, yard[k], yard[(k + 1) % 4], [gate[0], gate[1], 6.6]);
    for (const sd of [-1, 1]) bis.props.push(['gatepost', gate[0] + nx * sd * 6.2, gate[1] + nz * sd * 6.2, yawOf(nx, nz), { solid: true, r: 0.35 }]);
    const [pa, pc, pl] = C.bays, pp = L(pa, pc);
    this.baysAlong({ x: pp[0], z: pp[1], tx: ux, tz: uz, len: pl, dep: 5.2, id: 'csdd' }, rng, ['vaz2105', 'vaz2105', 'vaz2108', 'golf2', 'vaz2108', 'audi80', 'moskvich2141'], 0.5);
    const line = (a, c, w = 0.12, col = 'w') => this.paint.push({ a: L(a[0], a[1]), b: L(c[0], c[1]), w, col });
    const cone = (a, c) => { const [x, z] = L(a, c); bis.props.push(['cone', x, z, 0, { smash: true, mass: 4, r: 0.3 }]); };
    const [s0, s1, sn] = C.slalom;
    for (let k = 0; k < sn; k++) cone(F.lerp(s0[0], s1[0], k / (sn - 1)), s0[1]);
    for (const c of [-3.4, 3.4]) line([s0[0] - 6, s0[1] + c], [s1[0] + 6, s1[1] + c], 0.12, 'y');
    for (const a of [s0[0] - 6, s1[0] + 6]) line([a, s0[1] - 3.4], [a, s0[1] + 3.4], 0.3);
    const [ea, ec, er] = C.eight;
    for (const sd of [-1, 1]) {
      for (let k = 0; k < 20; k++) {
        const g0 = k / 20 * TAU, g1 = (k + 1) / 20 * TAU, oa = ea + sd * er;
        line([oa + Math.cos(g0) * er, ec + Math.sin(g0) * er], [oa + Math.cos(g1) * er, ec + Math.sin(g1) * er], 0.12, 'y');
      }
      cone(ea + sd * er, ec);
    }
    const [xa, xc, xl, xw] = C.box;
    for (const [p, q] of [[[0, 0], [xl, 0]], [[0, xw], [xl, xw]], [[xl, 0], [xl, xw]]]) line([xa + p[0], xc + p[1]], [xa + q[0], xc + q[1]]);
    for (const [a, c] of [[0, 0], [0, xw], [xl, 0], [xl, xw]]) cone(xa + a, xc + c);
    for (const [a, c] of C.masts) { const [x, z] = L(a, c); bis.props.push(['alamp', x, z, yawOf(ux, uz), { solid: true, r: 0.4 }]); }
    C.flags.forEach(([a, c], k) => { const [x, z] = L(a, c); bis.props.push(['flagpole', x, z, yawOf(nx, nz), { solid: true, r: 0.3, flag: k === 1 ? 2 : 0 }]); });
  };

  W.bisLine = function (line, bis) {
    line.forEach((q, k) => {
      const a = line[Math.max(0, k - 1)], c = line[Math.min(line.length - 1, k + 1)], l = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1, tx = (c[0] - a[0]) / l, tz = (c[1] - a[1]) / l;
      const ghost = q[2] === 0, spot = ghost ? q : this.freeSpot(q[0], q[1], 4, 30) || q, x = spot[0], z = spot[1], y = ghost ? 0 : this.terrainH(x, z), h = q[2] || 27;
      bis.towers.push({ x, z, y, tx, tz, h, ghost });
      if (ghost) return;
      this.bisReserve(x, z, 5);
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) this.cityCols.push({ k: 'circ', x: x + (tx * u - tz * v) * h * 0.105, z: z + (tz * u + tx * v) * h * 0.105, r: 0.34, y0: y - 1, y1: y + 5 });
    });
  };

  W.bisRows = function (B, rng) {
    const zoneAt = (x, z) => B.rows.find(q => F.inPoly(x, z, q.poly));
    const own = this.edges.filter(e => e.own && !e.bridge && e.k.lanes > 0);
    const make = (kind, st, x, z, tx, tz, w, d, side) => {
      const fl = rng.int(st.floors[0], st.floors[1]), works = kind === 'works', flat = works || st.roof === 'flat';
      const h = works ? Math.min(15, fl * 5 + 1) : flat ? Math.min(15, fl * st.floorH + 1) : fl * st.floorH;
      this.addBuilding({ x, z, tx, tz, w, d, floors: fl, h, style: works ? 'industry' : kind, fac: rng.pick(st.fac), roof: works ? 'flat' : st.roof, col: rng.pick(st.cols), front: side, y: this.terrainH(x, z) - 0.3 });
    };
    for (const e of own) {
      const base = e.hw + (e.k.side || 0);
      for (const side of [-1, 1]) {
        let s = 5 + rng() * 6;
        while (s < e.len - 5) {
          const q = this.edgePoint(e, s), zn = zoneAt(q.x + q.rx * (base + 13) * side, q.z + q.rz * (base + 13) * side);
          if (!zn || !zn.style) { s += 7; continue; }
          const st = B[zn.style] || F.STYLES[zn.style], w = rng.range(st.width[0], st.width[1]), dp = rng.range(st.depth[0], st.depth[1]), sb = rng.range(st.setback[0], st.setback[1]);
          if (rng() > st.fill) { s += w; continue; }
          const p = this.edgePoint(e, s + w / 2), off = base + sb + dp / 2 + 1.3, cx = p.x + p.rx * off * side, cz = p.z + p.rz * off * side;
          if (s + w > e.len - 3 || zoneAt(cx, cz) !== zn || !this.rectFree(cx, cz, p.tx, p.tz, w / 2, dp / 2, zn.style === 'wood' ? 0.6 : 2.5)) { s += 4; continue; }
          make(zn.style, st, cx, cz, p.tx, p.tz, w, dp, side);
          if (st.fence && rng() < st.fence) this.pendingFence(e, s, w + 2, side, base + 1.8, rng);
          s += w + rng.range(st.gap[0], st.gap[1]);
        }
      }
    }
    for (const zn of B.rows) {
      if (zn.style !== 'works') continue;
      const bb = F.polyBox(zn.poly);
      for (let t = Math.round(F.polyArea(zn.poly) / 1300); t > 0; t--) {
        const x = rng.range(bb.x0, bb.x1), z = rng.range(bb.z0, bb.z1), w = rng.range(26, 58), dp = rng.range(14, 26), turn = rng() < 0.35;
        const nr = this.nearestRoad(x, z, 160, e => e.own && e.k.lanes > 0);
        if (!nr || zoneAt(x, z) !== zn) continue;
        const tx = turn ? -nr.tz : nr.tx, tz = turn ? nr.tx : nr.tz;
        if (this.rectFree(x, z, tx, tz, w / 2, dp / 2, 6)) make('works', B.works, x, z, tx, tz, w, dp, 1);
      }
    }
  };

  W.bisLots = function (B, rng) {
    const zoneAt = (x, z) => B.rows.find(q => F.inPoly(x, z, q.poly));
    for (const e of this.edges) {
      if (!e.own || e.bridge || !e.k.lanes || e.len < 60 || e.kind === 'ave') continue;
      for (let s = 24 + rng() * 20; s < e.len - 24; s += 46 + rng() * 60) {
        const len = 2.6 * rng.int(4, 8), side = rng() < 0.5 ? -1 : 1, p = this.edgePoint(e, s);
        const zn = zoneAt(p.x + p.rx * side * (e.hw + 8), p.z + p.rz * side * (e.hw + 8));
        if (!zn || (zn.style !== 'khrush' && zn.style !== 'works')) continue;
        const lot = this.lotSpot(e, s, side, len, 5.6);
        if (!lot) continue;
        lot.id = 'bisyard';
        lot.poly = this.rectPoly(lot.x, lot.z, lot.tx, lot.tz, len / 2, 2.8);
        this.addPatch({ kind: 'lot', poly: lot.poly, surf: S.ASPHALT });
        this.lots.push(lot);
        this.baysAlong({ x: lot.x, z: lot.z, tx: lot.tx, tz: lot.tz, len, dep: 5.6, id: 'bisyard' }, rng, STREET_CARS, zn.style === 'works' ? 0.4 : 0.52);
        s += len;
      }
    }
  };

  W.bisGreen = function (B, rng) {
    for (const wood of [B.forest, B.edge]) {
      const bb = F.polyBox(wood.poly), cell = 1 / Math.sqrt(wood.density);
      for (let z = bb.z0; z < bb.z1; z += cell) for (let x = bb.x0; x < bb.x1; x += cell) {
        const px = x + rng() * cell, pz = z + rng() * cell, kind = wood.kinds[Math.floor(rng() * wood.kinds.length)], s = 0.85 + rng() * 0.45;
        if (F.inPoly(px, pz, wood.poly)) this.planted.push({ x: px, z: pz, kind, s });
      }
    }
    for (const e of this.edges) {
      if (e.rid !== B.forest.rows.road) continue;
      for (let s = 8, k = 0; s < e.len - 8; s += B.forest.rows.step, k++) {
        const p = this.edgePoint(e, s), off = e.hw + B.forest.rows.off;
        for (const sd of [-1, 1]) {
          const x = p.x + p.rx * sd * off, z = p.z + p.rz * sd * off;
          if (F.inPoly(x, z, B.forest.poly)) this.planted.push({ x, z, kind: (k + (sd > 0 ? 1 : 0)) % 3 ? 'pine' : 'spruce', s: 1 + (k % 4) * 0.08 });
        }
      }
    }
    for (const e of this.edges) {
      if (e.rid !== B.bank.road) continue;
      for (let s = 10, k = 0; s < e.len - 8; s += B.bank.trees, k++) {
        const p = this.edgePoint(e, s), sd = p.rz > 0 ? -1 : 1, off = e.hw + e.k.side + 2.4;
        this.planted.push({ x: p.x + p.rx * sd * off, z: p.z + p.rz * sd * off, kind: 'linden', s: 0.92 + (k % 4) * 0.05 });
      }
    }
    for (const zn of B.rows) {
      if (zn.style !== 'khrush' && zn.style !== 'wood') continue;
      const zb = F.polyBox(zn.poly), cell = zn.style === 'wood' ? 21 : 24, kinds = zn.style === 'wood' ? ['apple', 'birch', 'linden', 'apple', 'oak'] : ['birch', 'linden', 'birch', 'spruce'];
      for (let z = zb.z0; z < zb.z1; z += cell) for (let x = zb.x0; x < zb.x1; x += cell) {
        const px = x + rng() * cell, pz = z + rng() * cell, kind = kinds[Math.floor(rng() * kinds.length)], s = 0.8 + rng() * 0.4;
        if (F.inPoly(px, pz, zn.poly)) this.planted.push({ x: px, z: pz, kind, s });
      }
    }
  };

  W.bisProps = function (add) {
    const bis = this.bis, B = this.map.BIS;
    if (!bis) return;
    for (const [type, x, z, yaw, o] of bis.props) add(type, x, z, yaw, o);
    for (const f of bis.fence) add('afence', f.x, f.z, f.yaw, { smash: true, mass: 30, len: f.len });
    for (const p of bis.tram.poles) add('tpole', p.x, p.z, yawOf(p.ax, p.az), { solid: true, r: 0.2, arm: Math.hypot(p.ax, p.az) });
    for (const e of this.edges) {
      if (!e.own || e.bridge || !e.k.lamps) continue;
      const off = e.hw + Math.max(0.6, (e.k.side || 0) - 0.5), tram = e.name === B.tram.name;
      for (let s = tram ? 17 : 12 + e.id * 7 % 10, k = e.id; s < e.len - 10; s += e.k.lamps, k++) {
        const p = this.edgePoint(e, s), side = tram ? (p.rz > 0 ? -1 : 1) : k % 2 ? 1 : -1, x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
        if (!this.nearNode(x, z, 4) && this.offRoad(x, z, 0.8, e) && !bis.gates.some(g => Math.hypot(g[0] - x, g[1] - z) < 9)) add('lamp', x, z, Math.atan2(p.tx, -p.tz) + (side > 0 ? -Math.PI / 2 : Math.PI / 2), { smash: true, mass: 90 });
      }
    }
    for (const sp of B.posts) {
      const nr = this.nearestRoad(sp.at[0], sp.at[1], 20, e => e.own), k = (sp.to[0] - nr.x) * nr.tx + (sp.to[1] - nr.z) * nr.tz > 0 ? 1 : -1, off = nr.e.hw + (nr.e.k.side || 0) * 0.6 + 0.8;
      const x = nr.x - nr.tz * k * off, z = nr.z + nr.tx * k * off;
      this.signposts.push({ x, z, y: this.groundY(x, z), yaw: yawOf(nr.tx * k, nr.tz * k), lines: sp.lines, id: this.signposts.length });
      this.cityCols.push({ k: 'circ', x, z, r: 0.5, y0: -2, y1: 8 });
    }
    const b = this.b, tint = (poly, v) => F.fillPoly(this.biome, this.nx, this.nz, b.x0, b.z0, 10, poly, i => { if (!this.water[i]) this.biome[i] = v; });
    tint(B.forest.poly, 4);
    tint(B.edge.poly, 4);
    for (const zn of B.rows) if (zn.style === 'works') tint(zn.poly, 6); else if (zn.style === 'khrush') tint(zn.poly, 3);
  };

  W.bisAds = function () {
    if (!this.bis) return;
    for (const q of this.bis.stops) {
      const c = Math.cos(q.yaw), s = Math.sin(q.yaw);
      this.ads.push({ kind: 'shelter', x: q.x, z: q.z, y: q.y, yaw: q.yaw, seed: this.ads.length * 7919 + 13, theme: this.adTheme(q.x, q.z), cols: [{ k: 'box', x: q.x, z: q.z, hx: 2.3, hz: 0.7, c, s, y0: q.y - 1, y1: q.y + 3 }] });
    }
  };

  W.lotAt = function (x, z) {
    for (const l of this.lots) if (F.inPoly(x, z, l.poly)) return l;
    return null;
  };

  F.City = { PAVED, RANK, LV, KIOSKS, TENTS, STREET_CARS, AIRPORT_CARS };
})(globalThis.Forza = globalThis.Forza || {});
