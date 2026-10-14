(function (N) {
  'use strict';

  const CELL = N.CELL;
  const LANE = 3.5;
  const GT = { GRASS: 0, ROAD: 1, WALK: 2, YARD: 3, DIRT: 4, CONC: 5, WATER: 6, PATH: 7, SAND: 8, RAIL: 9, PLAZA: 10, PITCH: 11, GRANITE: 12, FOREST: 13, MEDIAN: 14, FIELD: 15, FLOOR: 16 };
  N.GT = GT;
  const GY = [0, 0, 0.15, 0, 0, 0, -2.2, 0, 0, 0, 0, 0, 0, 0, 0.2, 0, 0.1];
  N.GROUND_Y = GY;
  N.WATER_Y = -1.6;
  N.BANK_SLOPE = 2.71 / 6.5;
  N.CURB = 0.15;
  N.LANE_W = LANE;
  N.INTERIOR_X = 20000;

  const SHOPS = ['ПРОДУКТЫ', 'АПТЕКА', 'ХЛЕБ', 'ОБМЕН ВАЛЮТЫ', 'ВИДЕОПРОКАТ', 'ПАРИКМАХЕРСКАЯ', 'СБЕРКАССА', 'ОПТИКА', 'ОБУВЬ', 'ГАСТРОНОМ', 'ВИНО · ВОДКА', 'КНИГИ', 'ФОТО', 'ПЕЙДЖЕРЫ', 'СОТОВЫЕ ТЕЛЕФОНЫ', 'УНИВЕРМАГ', 'КАФЕ «ВОЛНА»', 'СТОЛОВАЯ', 'ПОЧТА', 'РЮМОЧНАЯ', 'КОМПЬЮТЕРНЫЙ КЛУБ', 'ИГРОВЫЕ АВТОМАТЫ', 'ПЕЛЬМЕННАЯ', 'СЕКОНД ХЕНД', 'ТКАНИ', 'ЧАСЫ · РЕМОНТ', 'ЗООМАГАЗИН', 'ХОЗТОВАРЫ', 'МОЛОКО', 'КУЛИНАРИЯ', 'ОВОЩИ · ФРУКТЫ', 'АВТОЗАПЧАСТИ', 'РЕМОНТ ОБУВИ', 'ЛОМБАРД'];
  const KIOSKS = ['ПИВО · ВОДЫ', 'СИГАРЕТЫ', 'СОЮЗПЕЧАТЬ', 'ЦВЕТЫ', 'АУДИОКАССЕТЫ', 'МОРОЖЕНОЕ', 'ШАВЕРМА', 'ОБМЕН ВАЛЮТЫ', 'ЛОТЕРЕЯ', 'ПРОДУКТЫ 24 ЧАСА', 'ХОТ-ДОГИ', 'ЖЕВАТЕЛЬНАЯ РЕЗИНКА'];
  N.SHOPS = SHOPS;
  N.KIOSKS = KIOSKS;

  const int36 = s => (s.charCodeAt(0) === 45 ? -parseInt(s.slice(1), 36) : parseInt(s, 36));
  const decPts = str => {
    if (!str) return [];
    const a = str.split(',');
    const out = new Array(a.length);
    let x = 0, z = 0;
    for (let i = 0; i < a.length; i += 2) { x += int36(a[i]); z += int36(a[i + 1]); out[i] = x / 10; out[i + 1] = z / 10; }
    return out;
  };
  N.decPts = decPts;
  const recs = s => (s ? s.split('|') : []);

  const CLS = { M: 'main', S: 'sec', T: 'ter', R: 'res', P: 'plant' };
  const SPEED = { main: 17, sec: 15, ter: 13, res: 11, plant: 8 };
  const SIDEWALK = { main: 4.5, sec: 4, ter: 3, res: 2.5, plant: 0 };
  const CORNER = { main: 5, sec: 4.5, ter: 4, res: 3, plant: 2.5 };
  const RANK = { main: 4, sec: 3, ter: 2, res: 1, plant: 0 };
  const SURFW = { Y: 4.6, L: 5.6, D: 3.6 };
  const INNER_LEN = 25;
  const convexHull = pts => {
    const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = list => {
      const h = [];
      for (const p of list) {
        while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop();
        h.push(p);
      }
      h.pop();
      return h;
    };
    return half(P).concat(half(P.slice().reverse())).flat();
  };
  N.ROAD_CLASSES = CLS;
  N.GANG_ZONES = ['ГСК «Заря»'];
  N.HOSPITALS = ['hosp_n', 'hosp_s'];
  N.MILITIA = ['ovd_n', 'ovd_s'];
  const MODERN_ZONE = /^ЖК|^МЖК|Водный мир|^Юг$/;

  N.placeAt = (p, dx, dz) => {
    const r = p.rot || 0, c = Math.cos(r), s = Math.sin(r);
    return [p.x + dx * c - dz * s, p.z + dx * s + dz * c];
  };

  class City {
    constructor(seed = 2000) {
      this.seed = seed;
      this.nodes = [];
      this.edges = [];
      this.lanes = [];
      this.conns = [];
      this.surf = [];
      this.foot = [];
      this.buildings = [];
      this.land = [];
      this.water = [];
      this.rails = [];
      this.fences = [];
      this.props = [];
      this.signs = [];
      this.parking = [];
      this.boxes = [];
      this.circles = [];
      this.ramps = [];
      this.places = {};
      this.pedAreas = [];
      this.stashes = [];
      this.pickups = [];
      this.jumps = [];
      this.interiors = [];
      this.teleports = [];
      this.exits = [];
      this.decks = [];
      this.walk = { nodes: [], edges: [] };
      this.hash = new N.SpatialHash(16);
      this.occ = new N.SpatialHash(16);
      this.load();
      this.network();
      this.junctions();
      this.buildLanes();
      this.pruneAmbient();
      this.signals();
      this.compounds();
      this.zebras();
      this.roadIndex();
      this.raster();
      this.buildWalk();
      this.pruneWalk();
      this.placeBuildings();
      this.barriers();
      if (this.sites) this.sites();
      this.furniture();
      this.streetKit();
      this.greenery();
      this.parkingSpots();
      this.peopleAreas();
      this.boundary();
      this.club();
      if (this.metroLayout) this.metroLayout();
      this.collectibles();
      if (this.wilds) this.wilds();
      this.breakables();
      if (this.pathWalk) this.pathWalk();
      this.index();
      if (this.crowdIndex) this.crowdIndex();
    }

    load() {
      const D = (N.DISTRICTS || [])[0];
      if (!D) throw new Error('no district data');
      this.district0 = D;
      this.names = D.names;
      this.play = [];
      for (const p of D.play) this.play.push(p[0], p[1]);
      const pb = N.polyBounds(this.play);
      this.PX0 = pb.x0; this.PZ0 = pb.z0; this.PX1 = pb.x1; this.PZ1 = pb.z1;
      this.gaz = decPts(D.gaz);
      this.poi = [];
      for (const r of recs(D.poi)) {
        const f = r.split(':');
        this.poi.push({ k: f[0], x: int36(f[1]) / 10, z: int36(f[2]) / 10, name: f[3] ? this.names[parseInt(f[3], 36)] : '', extra: f[4] || '' });
      }
      this.poiBy = {};
      for (const p of this.poi) (this.poiBy[p.k] || (this.poiBy[p.k] = [])).push(p);
      let x0 = pb.x0, z0 = pb.z0, x1 = pb.x1, z1 = pb.z1;
      const grow = p => { for (let i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < z0) z0 = p[i + 1]; if (p[i + 1] > z1) z1 = p[i + 1]; } };
      this.nodeXY = decPts(D.nodes);
      grow(this.nodeXY);
      this.X0 = Math.floor(x0 - 40); this.Z0 = Math.floor(z0 - 40); this.X1 = Math.ceil(x1 + 40); this.Z1 = Math.ceil(z1 + 40);
      this.W = this.X1 - this.X0;
      this.D = this.Z1 - this.Z0;
      this.zoneList = [];
      for (const r of recs(D.zones)) {
        const f = r.split(':');
        const name = this.names[parseInt(f[0], 36)];
        if (!MODERN_ZONE.test(name)) this.zoneList.push({ name, poly: decPts(f[1]) });
      }
      for (const z of this.zoneList) { z.area = Math.abs(N.polyArea(z.poly)); z.box = N.polyBounds(z.poly); }
      this.zoneList.sort((a, b) => a.area - b.area);
    }

    inPlay(x, z) { return N.pointInPoly(this.play, x, z); }

    inside(x) { return x > N.INTERIOR_X - 500; }

    inClub(x, z) {
      const r = this.clubRoom;
      return !!r && x >= r.x0 - 2 && x <= r.x1 + 2 && z >= r.z0 - 2 && z <= r.z1 + 2;
    }

    inMetro(x, z) { return !!this.metroLine && this.metroLine.has(x, z); }

    outsidePos(x, z) {
      if (!this.inside(x)) return { x, z };
      if (this.inMetro(x, z)) return this.metroLine.outside(x, z);
      const d = this.places.club_door;
      return { x: d.x, z: d.z };
    }

    network() {
      const D = this.district0;
      const xy = this.nodeXY;
      const n = xy.length / 2;
      for (let i = 0; i < n; i++) this.nodes.push({ id: i, x: xy[i * 2], z: xy[i * 2 + 1], ends: [], deg: 0, light: false, phase: 0, grp: null, poly: null, r: 0 });
      for (const r of recs(D.segs)) {
        const f = r.split(':');
        const code = f[0];
        const cls = CLS[code[0]];
        const lanes = parseInt(code[1], 10) || 1;
        const flags = code.slice(2);
        const a = parseInt(f[1], 36), b = parseInt(f[2], 36);
        const name = f[3] ? this.names[parseInt(f[3], 36)] : '';
        const inner = decPts(f[4]);
        const A = this.nodes[a], B = this.nodes[b];
        const pts = [A.x, A.z].concat(inner, [B.x, B.z]);
        if (a === b && pts.length < 8) continue;
        this.addEdge(a, b, pts, { cls, lanes, oneway: flags.includes('o'), medL: flags.includes('m'), bridge: flags.includes('b'), trolley: flags.includes('t'), link: flags.includes('l'), ring: flags.includes('r'), name });
      }
      for (const nd of this.nodes) nd.deg = nd.ends.length;
      this.fillLaneGaps();
      for (const r of recs(D.surf)) {
        const f = r.split(':');
        const pts = decPts(f[1]);
        if (pts.length < 4) continue;
        this.surf.push({ id: this.surf.length, cls: f[0], pts, w: SURFW[f[0]] || 4.5 });
      }
      for (const r of recs(D.foot)) {
        const f = r.split(':');
        const pts = decPts(f[1]);
        if (pts.length < 4) continue;
        this.foot.push({ id: this.foot.length, cls: f[0], pts, w: f[0] === 'P' ? 4 : f[0] === 'S' ? 2 : 2.2 });
      }
      for (const r of recs(D.water)) this.water.push(decPts(r));
      const bk = recs(D.banks);
      this.bankL = decPts(bk[0]);
      this.bankR = decPts(bk[1]);
      for (const r of recs(D.land)) {
        const f = r.split(':');
        this.land.push({ id: this.land.length, k: f[0], name: f[1] ? this.names[parseInt(f[1], 36)] : '', poly: decPts(f[2]) });
      }
      for (const l of this.land) { l.box = N.polyBounds(l.poly); l.area = Math.abs(N.polyArea(l.poly)); }
      for (const r of recs(D.rail)) { const f = r.split(':'); this.rails.push({ k: f[0], pts: decPts(f[1]) }); }
      for (const r of recs(D.fences)) { const f = r.split(':'); this.fences.push({ k: f[0], pts: decPts(f[1]) }); }
    }

    fillLaneGaps() {
      const next = (n, e) => this.edges[n.ends.find(q => q.e !== e.id).e];
      for (const e of this.edges) {
        const A = this.nodes[e.a], B = this.nodes[e.b];
        if (e.plant || A === B || A.ends.length !== 2 || B.ends.length !== 2) continue;
        const p = next(A, e), q = next(B, e);
        if (p.oneway !== e.oneway || q.oneway !== e.oneway || p.plant || q.plant) continue;
        const lanes = Math.min(p.lanes, q.lanes);
        if (lanes <= e.lanes) continue;
        e.lanes = lanes;
        e.hw = e.oneway ? lanes * LANE / 2 : lanes * LANE;
        e.w = e.hw * 2;
      }
    }

    addEdge(a, b, pts, o) {
      const cls = o.cls;
      const lanes = Math.max(1, o.lanes);
      const hw = o.oneway ? lanes * LANE / 2 : lanes * LANE;
      const sw = o.link || o.ring ? 0 : SIDEWALK[cls];
      const e = {
        id: this.edges.length, a, b, pts, cls, lanes, oneway: !!o.oneway, med: 0, hw, w: hw * 2,
        swR: sw, swL: o.oneway && o.medL ? 0 : sw, medL: !!o.medL, name: o.name || '', plant: cls === 'plant', main: cls === 'main', rank: RANK[cls],
        bridge: !!o.bridge, trolley: !!o.trolley, link: !!o.link, ring: !!o.ring, ambient: cls !== 'plant', lanesF: [], lanesB: [], sa: 0, sb: 0
      };
      e.cum = N.cumLen(pts);
      e.len = e.cum[e.cum.length - 1];
      if (e.len < 0.5) return null;
      this.edges.push(e);
      this.nodes[a].ends.push({ e: e.id, atA: true });
      this.nodes[b].ends.push({ e: e.id, atA: false });
      return e;
    }

    endDir(e, atA) {
      const p = e.pts, n = p.length;
      let dx, dz;
      if (atA) {
        let k = 2;
        while (k < n - 2 && Math.hypot(p[k] - p[0], p[k + 1] - p[1]) < 4) k += 2;
        dx = p[k] - p[0]; dz = p[k + 1] - p[1];
      } else {
        let k = n - 4;
        while (k > 0 && Math.hypot(p[k] - p[n - 2], p[k + 1] - p[n - 1]) < 4) k -= 2;
        dx = p[k] - p[n - 2]; dz = p[k + 1] - p[n - 1];
      }
      const L = Math.hypot(dx, dz) || 1;
      return [dx / L, dz / L];
    }

    junctions() {
      for (const n of this.nodes) {
        const ends = n.ends;
        for (const en of ends) {
          const e = this.edges[en.e];
          const [ux, uz] = this.endDir(e, en.atA);
          en.ux = ux; en.uz = uz;
          en.ang = Math.atan2(uz, ux);
          en.hwP = e.hw; en.hwM = e.hw;
          en.swP = en.atA ? e.swR : e.swL;
          en.swM = en.atA ? e.swL : e.swR;
          en.req = 0;
          en.sb = 0;
        }
        ends.sort((p, q) => p.ang - q.ang);
        n.deg = ends.length;
        if (ends.length < 2) continue;
        const k = ends.length;
        n.corners = [];
        for (let i = 0; i < k; i++) {
          const A = ends[i], B = ends[(i + 1) % k];
          let dAng = B.ang - A.ang;
          if (i === k - 1) dAng += Math.PI * 2;
          const nx = -A.uz, nz = A.ux;
          const mx = B.uz, mz = -B.ux;
          const px = n.x + nx * A.hwP, pz = n.z + nz * A.hwP;
          const qx = n.x + mx * B.hwM, qz = n.z + mz * B.hwM;
          const det = A.ux * -B.uz - A.uz * -B.ux;
          let t = 0, s = 0, cx = null, cz = null;
          if (Math.abs(det) > 1e-4 && dAng < Math.PI - 0.05) {
            const rx = qx - px, rz = qz - pz;
            t = (rx * -B.uz - rz * -B.ux) / det;
            s = (A.ux * rz - A.uz * rx) / det;
            if (t > -1 && s > -1) { cx = px + A.ux * t; cz = pz + A.uz * t; }
            t = Math.max(0, t); s = Math.max(0, s);
            if (t > 60 || s > 60) { t = Math.min(t, 60); s = Math.min(s, 60); cx = null; }
          }
          A.req = Math.max(A.req, t);
          B.req = Math.max(B.req, s);
          n.corners.push({ i, j: (i + 1) % k, dAng, cx, cz });
        }
        const straight = k === 2 && Math.abs(Math.PI - Math.abs(N.wrap(ends[1].ang - ends[0].ang))) < 0.3;
        n.straight = straight;
        for (const en of ends) {
          const e = this.edges[en.e];
          const other = ends.filter(q => q !== en).map(q => this.edges[q.e]);
          const rc = Math.max(CORNER[e.cls], ...other.map(q => CORNER[q.cls]));
          en.sb = straight ? 0 : en.req + (k >= 3 ? rc : Math.min(rc, 2 + en.req * 0.3));
        }
      }
      for (const e of this.edges) {
        const A = this.nodes[e.a].ends.find(q => q.e === e.id && q.atA);
        const B = this.nodes[e.b].ends.find(q => q.e === e.id && !q.atA);
        let sa = A ? A.sb : 0, sb = B ? B.sb : 0;
        const room = e.len - 1.5;
        if (sa + sb > room) { const k = Math.max(0, room) / (sa + sb || 1); sa *= k; sb *= k; }
        e.sa = sa; e.sb = sb;
        if (A) A.sb = sa;
        if (B) B.sb = sb;
      }
      for (const n of this.nodes) {
        if (n.ends.length < 2 || n.straight) { n.r = Math.max(4, ...n.ends.map(q => q.hwP || 0)); continue; }
        const ends = n.ends, k = ends.length;
        const pts = [];
        const corner = [];
        for (let i = 0; i < k; i++) {
          const A = ends[i];
          const ax = n.x + A.ux * A.sb, az = n.z + A.uz * A.sb;
          A.mx = ax + A.uz * A.hwM; A.mz = az - A.ux * A.hwM;
          A.px = ax - A.uz * A.hwP; A.pz = az + A.ux * A.hwP;
        }
        for (let i = 0; i < k; i++) {
          const A = ends[i], B = ends[(i + 1) % k];
          const c = n.corners[i];
          pts.push(A.mx, A.mz, A.px, A.pz);
          const curve = [];
          if (c.cx !== null && k >= 2) {
            for (let s = 1; s < 6; s++) {
              const t = s / 6, u = 1 - t;
              curve.push(u * u * A.px + 2 * u * t * c.cx + t * t * B.mx, u * u * A.pz + 2 * u * t * c.cz + t * t * B.mz);
            }
          }
          for (let q = 0; q < curve.length; q += 2) pts.push(curve[q], curve[q + 1]);
          corner.push({ A, B, c, curve });
        }
        n.poly = pts;
        n.cornerList = corner;
        let r = 0;
        for (let i = 0; i < pts.length; i += 2) r = Math.max(r, Math.hypot(pts[i] - n.x, pts[i + 1] - n.z));
        n.r = r;
      }
      for (const e of this.edges) {
        const p = e.pts;
        let out = 0, tot = 0;
        for (let i = 0; i < p.length; i += 2) { tot++; if (!this.inPlay(p[i], p[i + 1])) out++; }
        const mid = N.plineAt(p, e.cum, e.len / 2);
        e.outer = !this.inPlay(mid.x, mid.z);
        if (out > 0) e.ambient = false;
        if (out === tot) e.outer = true;
      }
      for (const n of this.nodes) {
        if (n.deg === 1) {
          const e = this.edges[n.ends[0].e];
          e.stub = true;
        }
      }
      let changed = true;
      while (changed) {
        changed = false;
        for (const n of this.nodes) {
          const amb = n.ends.filter(q => { const e = this.edges[q.e]; return e.ambient && !e.stub; });
          if (amb.length === 1) { const e = this.edges[amb[0].e]; if (!e.stub) { e.stub = true; changed = true; } }
        }
      }
      for (const e of this.edges) if (e.stub) e.ambient = false;
      for (const n of this.nodes) n.adeg = n.ends.filter(q => this.edges[q.e].ambient).length;
    }

    trimmed(e) { return N.trimPline(e.pts, e.sa, e.len - e.sb); }

    buildLanes() {
      const L = this.lanes;
      for (const e of this.edges) {
        const tp = this.trimmed(e);
        const tpr = N.reversePoly(tp);
        const speed = SPEED[e.cls] * (e.link || e.ring ? 0.7 : 1);
        const mk = (pts, dir, k, n, from, to) => {
          const cum = N.cumLen(pts);
          const len = Math.max(0.5, cum[cum.length - 1]);
          const s = N.plineAt(pts, cum, 0), f = N.plineAt(pts, cum, len);
          const lane = { id: L.length, edge: e.id, dir, k, n, pts, cum, len, from, to, out: [], speed, ambient: e.ambient, x0: s.x, z0: s.z, x1: f.x, z1: f.z, dx0: s.dx, dz0: s.dz, dx1: f.dx, dz1: f.dz, dx: s.dx, dz: s.dz };
          L.push(lane);
          return lane;
        };
        const n = e.lanes;
        for (let k = 0; k < n; k++) {
          const off = e.oneway ? -e.hw + (k + 0.5) * LANE : e.med / 2 + (k + 0.5) * LANE;
          e.lanesF.push(mk(N.offsetPline(tp, off), 1, k, n, e.a, e.b).id);
          if (!e.oneway) e.lanesB.push(mk(N.offsetPline(tpr, off), -1, k, n, e.b, e.a).id);
        }
      }
      for (const nd of this.nodes) {
        const inc = [], outg = [];
        for (const en of nd.ends) {
          const e = this.edges[en.e];
          for (const id of e.lanesF.concat(e.lanesB)) { const l = L[id]; if (l.to === nd.id) inc.push(l); if (l.from === nd.id) outg.push(l); }
        }
        for (const lane of inc) {
          const e = this.edges[lane.edge];
          for (const l2 of outg) {
            if (l2.edge === lane.edge && nd.deg > 1) continue;
            const e2 = this.edges[l2.edge];
            const dot = lane.dx1 * l2.dx0 + lane.dz1 * l2.dz0;
            const cross = lane.dx1 * l2.dz0 - lane.dz1 * l2.dx0;
            if (dot < -0.72 && nd.deg > 1) continue;
            const turn = dot > 0.8 ? 'S' : cross > 0 ? 'R' : 'L';
            let ok;
            if (nd.deg <= 2 || nd.straight) ok = true;
            else if (nd.adeg <= 2 && e.ambient && e2.ambient) ok = turn === 'S' ? true : true;
            else if (turn === 'S') ok = l2.k === Math.min(lane.k, l2.n - 1) || (lane.k === lane.n - 1 && l2.k >= lane.n);
            else if (turn === 'R') ok = lane.k === lane.n - 1 && l2.k === l2.n - 1;
            else ok = lane.k === 0 && l2.k === 0;
            if (!ok) continue;
            const ax = lane.x1, az = lane.z1, bx = l2.x0, bz = l2.z0;
            const dist = Math.hypot(bx - ax, bz - az);
            const pts = [];
            if (turn === 'S' && dot > 0.97) pts.push(ax, az, bx, bz);
            else {
              const kk = Math.max(0.5, dist * 0.38);
              const c1x = ax + lane.dx1 * kk, c1z = az + lane.dz1 * kk, c2x = bx - l2.dx0 * kk, c2z = bz - l2.dz0 * kk;
              const S = 8;
              for (let i = 0; i <= S; i++) {
                const t = i / S, u = 1 - t;
                pts.push(u * u * u * ax + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * bx, u * u * u * az + 3 * u * u * t * c1z + 3 * u * t * t * c2z + t * t * t * bz);
              }
            }
            let len = 0;
            for (let i = 2; i < pts.length; i += 2) len += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
            const c = { id: this.conns.length, from: lane.id, to: l2.id, node: nd.id, turn, pts, len: Math.max(0.5, len), ambient: lane.ambient && l2.ambient };
            this.conns.push(c);
            lane.out.push(c.id);
          }
        }
      }
    }

    pruneAmbient() {
      const L = this.lanes, C = this.conns;
      const amb = L.filter(l => l.ambient);
      const succ = l => { const o = []; for (const id of l.out) { const c = C[id]; if (c.ambient && L[c.to].ambient) o.push(c.to); } return o; };
      const pred = new Map();
      for (const l of amb) for (const t of succ(l)) { if (!pred.has(t)) pred.set(t, []); pred.get(t).push(l.id); }
      const order = [], seen = new Uint8Array(L.length);
      for (const s of amb) {
        if (seen[s.id]) continue;
        const stack = [[s.id, 0]];
        seen[s.id] = 1;
        while (stack.length) {
          const top = stack[stack.length - 1];
          const nx = succ(L[top[0]]);
          if (top[1] < nx.length) { const t = nx[top[1]++]; if (!seen[t]) { seen[t] = 1; stack.push([t, 0]); } }
          else { order.push(top[0]); stack.pop(); }
        }
      }
      const comp = new Int32Array(L.length).fill(-1);
      let nc = 0;
      const size = [];
      for (let i = order.length - 1; i >= 0; i--) {
        const s = order[i];
        if (comp[s] >= 0) continue;
        const st = [s];
        comp[s] = nc;
        let cnt = 0;
        while (st.length) { const v = st.pop(); cnt++; for (const u of pred.get(v) || []) if (comp[u] < 0) { comp[u] = nc; st.push(u); } }
        size.push(cnt);
        nc++;
      }
      let big = 0;
      for (let i = 1; i < nc; i++) if (size[i] > size[big]) big = i;
      for (const l of amb) if (comp[l.id] !== big) l.ambient = false;
      for (const c of C) c.ambient = L[c.from].ambient && L[c.to].ambient;
      for (const e of this.edges) e.ambient = e.lanesF.concat(e.lanesB).some(id => L[id].ambient);
      for (const n of this.nodes) n.adeg = n.ends.filter(q => this.edges[q.e].ambient).length;
    }

    signals() {
      const sig = this.poiBy.L || [];
      const cand = [];
      for (const n of this.nodes) {
        if (n.deg < 3 || n.straight) continue;
        const ranks = n.ends.map(q => this.edges[q.e]).filter(e => !e.plant);
        if (ranks.length < 3) continue;
        if (ranks.every(e => e.rank <= 1)) continue;
        let near = false;
        for (const p of sig) if (Math.abs(p.x - n.x) < 28 && Math.abs(p.z - n.z) < 28) { near = true; break; }
        if (near) cand.push(n);
      }
      for (const n of cand) n.light = true;
      const par = new Map(cand.map(n => [n.id, n.id]));
      const find = i => { while (par.get(i) !== i) i = par.get(i); return i; };
      for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) {
        const a = cand[i], b = cand[j];
        if (Math.hypot(a.x - b.x, a.z - b.z) < 45) { const ra = find(a.id), rb = find(b.id); if (ra !== rb) par.set(rb, ra); }
      }
      const groups = new Map();
      for (const n of cand) { const r = find(n.id); (groups.get(r) || groups.set(r, []).get(r)).push(n); }
      for (const [r, list] of groups) {
        let best = null, bs = -1;
        for (const n of list) for (const en of n.ends) { const e = this.edges[en.e]; const s = e.rank * 10 + e.lanes; if (s > bs) { bs = s; best = en; } }
        const ax = best.ux, az = best.uz;
        const phase = N.hash2(this.nodes[r].x | 0, this.nodes[r].z | 0, 7) * 26;
        for (const n of list) {
          n.phase = phase;
          n.cluster = r;
          for (const en of n.ends) en.grp = Math.abs(en.ux * ax + en.uz * az) > 0.64 ? 0 : 1;
        }
      }
      for (const l of this.lanes) {
        const n = this.nodes[l.to];
        if (!n.light) { l.grp = 0; continue; }
        const e = this.edges[l.edge];
        const en = n.ends.find(q => q.e === e.id && q.atA === (l.dir < 0));
        l.grp = en ? en.grp : 0;
      }
    }

    compounds() {
      const par = new Map();
      const find = i => { while (par.get(i) !== i) i = par.get(i); return i; };
      for (const e of this.edges) {
        const A = this.nodes[e.a], B = this.nodes[e.b];
        if (e.plant || e.len >= INNER_LEN || !A.light || !B.light || A.cluster !== B.cluster) continue;
        e.inner = true;
        e.swR = 0;
        e.swL = 0;
        for (const n of [A, B]) {
          for (const en of n.ends) if (en.e === e.id) { en.swP = 0; en.swM = 0; }
          if (!par.has(n.id)) par.set(n.id, n.id);
        }
        const ra = find(e.a), rb = find(e.b);
        if (ra !== rb) par.set(rb, ra);
      }
      const groups = new Map();
      for (const id of par.keys()) { const r = find(id); (groups.get(r) || groups.set(r, []).get(r)).push(this.nodes[id]); }
      this.fills = [];
      for (const list of groups.values()) {
        if (list.length < 3) continue;
        const hull = convexHull(list.map(n => [n.x, n.z]));
        if (hull.length >= 6 && Math.abs(N.polyArea(hull)) > 1) this.fills.push(hull);
      }
    }

    zebras() {
      const X = this.poiBy.X || [];
      const can = en => {
        const e = this.edges[en.e];
        return !e.inner && e.len >= 12 && (e.swR > 0 || e.swL > 0);
      };
      const mapped = (n, en) => {
        const e = this.edges[en.e], lo = Math.max(2, en.sb - 6), hi = en.sb + 8, w = e.hw + 2.5;
        return X.some(p => {
          const dx = p.x - n.x, dz = p.z - n.z, along = dx * en.ux + dz * en.uz;
          return along > lo && along < hi && Math.abs(dz * en.ux - dx * en.uz) < w;
        });
      };
      const junction = n => n.poly && (n.light || n.deg >= 3) && !n.ends.some(q => this.edges[q.e].plant);
      const seen = new Set();
      for (const n of this.nodes) {
        if (!junction(n)) continue;
        for (const en of n.ends) {
          if (!can(en) || !mapped(n, en)) continue;
          en.zebra = true;
          if (n.light) seen.add(n.cluster);
        }
      }
      for (const n of this.nodes) {
        if (!n.light || seen.has(n.cluster) || !junction(n)) continue;
        for (const en of n.ends) {
          const e = this.edges[en.e], o = this.nodes[en.atA ? e.b : e.a];
          if (can(en) && !(o.light && o.cluster === n.cluster)) en.zebra = true;
        }
      }
    }

    lightState(n, t, grp) {
      if (!n.light) return 'g';
      const c = ((t + n.phase) % 26 + 26) % 26;
      if (grp === 0 || grp === 'v') return c < 11 ? 'g' : c < 13 ? 'y' : 'r';
      return c >= 13 && c < 24 ? 'g' : c >= 24 ? 'y' : 'r';
    }

    roadIndex() {
      const H = new N.SpatialHash(16);
      this.roadHash = H;
      for (const e of this.edges) {
        const p = e.pts;
        let s0 = 0;
        for (let i = 2; i < p.length; i += 2) {
          const ax = p[i - 2], az = p[i - 1], bx = p[i], bz = p[i + 1];
          const L = Math.hypot(bx - ax, bz - az);
          const ext = e.hw + Math.max(e.swL, e.swR) + 0.5;
          H.insert({ t: 0, e, ax, az, bx, bz, L, s0, x0: Math.min(ax, bx) - ext, z0: Math.min(az, bz) - ext, x1: Math.max(ax, bx) + ext, z1: Math.max(az, bz) + ext });
          s0 += L;
        }
      }
      for (const f of this.fills) { const b = N.polyBounds(f); H.insert({ t: 1, poly: f, x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1 }); }
      for (const n of this.nodes) {
        if (n.poly) { const b = N.polyBounds(n.poly); H.insert({ t: 1, n, poly: n.poly, x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1 }); }
        if (n.straight) this.straightJoins(n, H);
        if (!n.cornerList) continue;
        n.walkPolys = [];
        for (const c of n.cornerList) {
          const A = c.A, B = c.B;
          const sw = Math.min(A.swP, B.swM);
          if (sw <= 0) continue;
          if (c.c.dAng > Math.PI * 0.95) {
            const inner = [A.px, A.pz, B.mx, B.mz];
            const outer = [A.px - A.uz * sw, A.pz + A.ux * sw, B.mx + B.uz * sw, B.mz - B.ux * sw];
            const poly = inner.concat(N.reversePoly(outer));
            if (Math.abs(N.polyArea(poly)) < 0.2) continue;
            c.walk = { inner, outer, sw, reflex: true };
            n.walkPolys.push(poly);
            const b = N.polyBounds(poly);
            H.insert({ t: 2, n, poly, x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1 });
            continue;
          }
          const inner = [A.px, A.pz].concat(c.curve, [B.mx, B.mz]);
          const oA = [A.px - A.uz * sw, A.pz + A.ux * sw], oB = [B.mx + B.uz * sw, B.mz - B.ux * sw];
          let ox = null, oz = null;
          if (c.c.cx !== null) {
            const det = A.ux * -B.uz - A.uz * -B.ux;
            if (Math.abs(det) > 1e-4) {
              const px = n.x - A.uz * (A.hwP + sw), pz = n.z + A.ux * (A.hwP + sw), qx = n.x + B.uz * (B.hwM + sw), qz = n.z - B.ux * (B.hwM + sw);
              const rx = qx - px, rz = qz - pz;
              const t = (rx * -B.uz - rz * -B.ux) / det;
              ox = px + A.ux * t; oz = pz + A.uz * t;
            }
          }
          const outer = [];
          if (ox !== null) for (let s = 0; s <= 6; s++) { const t = s / 6, u = 1 - t; outer.push(u * u * oA[0] + 2 * u * t * ox + t * t * oB[0], u * u * oA[1] + 2 * u * t * oz + t * t * oB[1]); }
          else outer.push(oA[0], oA[1], oB[0], oB[1]);
          const poly = inner.concat(N.reversePoly(outer));
          c.walk = { inner, outer, sw };
          n.walkPolys.push(poly);
          const b = N.polyBounds(poly);
          H.insert({ t: 2, n, poly, x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1 });
        }
      }
      for (const s of this.surf) {
        const p = s.pts, hw = s.w / 2;
        for (let i = 2; i < p.length; i += 2) {
          const ax = p[i - 2], az = p[i - 1], bx = p[i], bz = p[i + 1];
          H.insert({ t: 3, s, hw, ax, az, bx, bz, x0: Math.min(ax, bx) - hw, z0: Math.min(az, bz) - hw, x1: Math.max(ax, bx) + hw, z1: Math.max(az, bz) + hw });
        }
      }
    }

    straightJoins(n, H) {
      const [A, B] = n.ends;
      n.joins = [];
      for (const [P, Q] of [[A, B], [B, A]]) {
        const rx = -P.uz, rz = P.ux, lx = Q.uz, lz = -Q.ux;
        const mx = rx + lx, mz = rz + lz;
        if (mx * P.ux + mz * P.uz >= -1e-3 || mx * Q.ux + mz * Q.uz >= -1e-3) continue;
        const hp = P.hwP, hq = Q.hwM;
        const road = [n.x, n.z, n.x + rx * hp, n.z + rz * hp, n.x + lx * hq, n.z + lz * hq];
        if (Math.abs(N.polyArea(road)) < 0.02) continue;
        const rb = N.polyBounds(road);
        H.insert({ t: 1, n, poly: road, x0: rb.x0, z0: rb.z0, x1: rb.x1, z1: rb.z1 });
        const j = { road };
        const sw = Math.min(P.swP, Q.swM);
        if (sw > 0) {
          const inner = [n.x + rx * hp, n.z + rz * hp, n.x + lx * hq, n.z + lz * hq];
          const outer = [n.x + rx * (hp + sw), n.z + rz * (hp + sw), n.x + lx * (hq + sw), n.z + lz * (hq + sw)];
          const poly = inner.concat(N.reversePoly(outer));
          j.walk = { inner, outer, sw, reflex: true };
          const b = N.polyBounds(poly);
          H.insert({ t: 2, n, poly, x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1 });
          (n.walkPolys || (n.walkPolys = [])).push(poly);
        }
        n.joins.push(j);
      }
    }

    surfaceAt(x, z) {
      let res = 3;
      this.roadHash.query(x, z, x, z, it => {
        if (it.t === 1) { if (N.pointInPoly(it.poly, x, z)) { res = 0; return true; } return; }
        if (it.t === 3) { const [d2] = N.segDist2(x, z, it.ax, it.az, it.bx, it.bz); if (d2 <= it.hw * it.hw) { res = 0; return true; } return; }
        if (it.t === 2) { if (res > 1 && N.pointInPoly(it.poly, x, z)) res = 1; return; }
        const e = it.e;
        const [d2, t] = N.segDist2(x, z, it.ax, it.az, it.bx, it.bz);
        const d = Math.sqrt(d2);
        if (d <= e.hw) { res = 0; return true; }
        if (res <= 1) return;
        const s = it.s0 + t * it.L;
        if (s < e.sa - 0.05 || s > e.len - e.sb + 0.05) return;
        const side = (x - it.ax) * -(it.bz - it.az) + (z - it.az) * (it.bx - it.ax);
        const sw = side > 0 ? e.swR : e.swL;
        if (sw > 0 && d <= e.hw + sw) res = 1;
      });
      return res;
    }

    isRoad(x, z) { return this.surfaceAt(x, z) === 0; }

    idx(x, z) {
      const ix = Math.floor((x - this.RX0) / CELL), iz = Math.floor((z - this.RZ0) / CELL);
      if (ix < 0 || iz < 0 || ix >= this.gw || iz >= this.gd) return -1;
      return iz * this.gw + ix;
    }

    raster() {
      this.RX0 = Math.floor(this.PX0 - 80);
      this.RZ0 = Math.floor(this.PZ0 - 80);
      this.gw = Math.ceil((this.PX1 + 80 - this.RX0) / CELL);
      this.gd = Math.ceil((this.PZ1 + 80 - this.RZ0) / CELL);
      this.g = new Uint8Array(this.gw * this.gd);
      const LT = { w: GT.WATER, f: GT.FOREST, e: GT.GRASS, s: GT.SAND, b: GT.GRASS, g: GT.GRASS, p: GT.GRASS, i: GT.PITCH, j: GT.DIRT, c: GT.YARD, t: GT.PATH, y: GT.SAND, o: GT.GRASS, q: GT.CONC, k: GT.YARD, m: GT.YARD, h: GT.GRASS, d: GT.GRASS, x: GT.GRASS, z: GT.GRASS, a: GT.FIELD, r: GT.YARD, n: GT.CONC, u: GT.DIRT, v: GT.YARD, l: GT.FIELD, R: GT.GRASS, P: GT.PLAZA };
      const ORDER = 'Rlanvdhxzgpbeforskmqcjiytw';
      const land = this.land.slice().sort((p, q) => ORDER.indexOf(p.k) - ORDER.indexOf(q.k) || q.area - p.area);
      for (const l of land) { const t = LT[l.k]; if (t !== undefined && t !== GT.GRASS) this.fillPoly(l.poly, t); }
      if (this.water[0]) this.fillPoly(this.water[0], GT.WATER);
      for (let i = 1; i < this.water.length; i++) this.fillPoly(this.water[i], GT.FOREST);
      for (const l of this.land) if (l.k === 'w') this.fillPoly(l.poly, GT.WATER);
      for (const r of this.rails) if (r.k !== 'A') this.fillLine(r.pts, r.k === 'T' ? 1.4 : 1.6, GT.RAIL);
      for (const s of this.surf) this.fillLine(s.pts, s.w / 2, s.cls === 'D' ? GT.DIRT : GT.YARD);
      for (const f of this.foot) this.fillLine(f.pts, 1, GT.PATH, [GT.GRASS, GT.FOREST, GT.FIELD]);
      for (const e of this.edges) {
        const tp = e.pts;
        if (e.swR || e.swL) {
          const t2 = this.trimmed(e);
          if (e.swR) this.fillLine(N.offsetPline(t2, e.hw + e.swR / 2), e.swR / 2, GT.WALK, null, true);
          if (e.swL) this.fillLine(N.offsetPline(t2, -(e.hw + e.swL / 2)), e.swL / 2, GT.WALK, null, true);
        }
        this.fillLine(tp, e.hw, GT.ROAD);
      }
      for (const n of this.nodes) {
        if (n.walkPolys) for (const p of n.walkPolys) this.fillPoly(p, GT.WALK, [GT.GRASS, GT.YARD, GT.FOREST, GT.DIRT, GT.PATH, GT.SAND, GT.CONC, GT.FIELD, GT.PLAZA]);
        if (n.poly) this.fillPoly(n.poly, GT.ROAD);
      }
      for (const f of this.fills) this.fillPoly(f, GT.ROAD);
    }

    fillPoly(p, t, only) {
      const b = N.polyBounds(p);
      const iz0 = Math.max(0, Math.floor((b.z0 - this.RZ0) / CELL)), iz1 = Math.min(this.gd - 1, Math.floor((b.z1 - this.RZ0) / CELL));
      const n = p.length;
      const xs = [];
      for (let iz = iz0; iz <= iz1; iz++) {
        const z = this.RZ0 + (iz + 0.5) * CELL;
        xs.length = 0;
        for (let i = 0; i < n; i += 2) {
          const j = (i + 2) % n;
          const az = p[i + 1], bz = p[j + 1];
          if ((az > z) !== (bz > z)) xs.push(p[i] + (z - az) / (bz - az) * (p[j] - p[i]));
        }
        xs.sort((a, c) => a - c);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const ix0 = Math.max(0, Math.ceil((xs[k] - this.RX0) / CELL - 0.5)), ix1 = Math.min(this.gw - 1, Math.floor((xs[k + 1] - this.RX0) / CELL - 0.5));
          for (let ix = ix0; ix <= ix1; ix++) {
            const i = iz * this.gw + ix;
            if (only && !only.includes(this.g[i])) continue;
            this.g[i] = t;
          }
        }
      }
    }

    fillLine(p, hw, t, only, soft) {
      for (let i = 2; i < p.length; i += 2) {
        const ax = p[i - 2], az = p[i - 1], bx = p[i], bz = p[i + 1];
        const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
        if (L < 1e-6) continue;
        const nx = -dz / L * hw, nz = dx / L * hw;
        const ex = dx / L * (soft ? 0 : hw * 0.5), ez = dz / L * (soft ? 0 : hw * 0.5);
        this.fillPoly([ax + nx - ex, az + nz - ez, bx + nx + ex, bz + nz + ez, bx - nx + ex, bz - nz + ez, ax - nx - ex, az - nz - ez], t, only || (t === GT.ROAD ? null : t === GT.WALK ? [GT.GRASS, GT.YARD, GT.FOREST, GT.DIRT, GT.PATH, GT.SAND, GT.CONC, GT.FIELD, GT.PLAZA, GT.PITCH] : null));
      }
    }

    onDeck(x, z) {
      for (const d of this.decks) { if (!d.box) d.box = N.polyBounds(d.poly); const b = d.box; if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && N.pointInPoly(d.poly, x, z)) return d; }
      return null;
    }

    ground(x, z) {
      if (this.decks.length && this.onDeck(x, z)) return GT.FLOOR;
      if (x > N.INTERIOR_X - 500) { for (const r of this.interiors) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return GT.FLOOR; return GT.FLOOR; }
      const i = this.idx(x, z);
      if (i < 0) return this.inWater(x, z) ? GT.WATER : GT.FIELD;
      const t = this.g[i];
      if (t === GT.ROAD || t === GT.WALK) {
        const s = this.surfaceAt(x, z);
        return s === 0 ? GT.ROAD : s === 1 ? GT.WALK : GT.YARD;
      }
      return t;
    }

    inWater(x, z) {
      if (!this.water[0]) return false;
      if (!N.pointInPoly(this.water[0], x, z)) return false;
      for (let i = 1; i < this.water.length; i++) if (N.pointInPoly(this.water[i], x, z)) return false;
      return true;
    }

    waterIndex() {
      const H = new N.SpatialHash(32), P = new N.SpatialHash(64);
      const add = (p, closed, pond) => {
        const n = p.length / 2;
        for (let i = 0; i + 1 < n + (closed ? 1 : 0); i++) {
          const j = (i + 1) % n;
          const ax = p[i * 2], az = p[i * 2 + 1], bx = p[j * 2], bz = p[j * 2 + 1];
          H.insert({ ax, az, bx, bz, pond, x0: Math.min(ax, bx), z0: Math.min(az, bz), x1: Math.max(ax, bx), z1: Math.max(az, bz) });
        }
      };
      if (this.bankL && this.bankL.length >= 4) add(this.bankL, false, null);
      for (let i = 1; i < this.water.length; i++) add(this.water[i], true, null);
      for (const l of this.land) {
        if (l.k !== 'w') continue;
        add(l.poly, true, l);
        P.insert({ l, x0: l.box.x0, z0: l.box.z0, x1: l.box.x1, z1: l.box.z1 });
      }
      this.wIdx = { H, P };
      return this.wIdx;
    }

    shoreDist(x, z, pond, W) {
      for (const r of [6, 24, 96]) {
        let best = Infinity;
        W.H.query(x - r, z - r, x + r, z + r, it => {
          if (it.pond !== pond) return;
          const [d2] = N.segDist2(x, z, it.ax, it.az, it.bx, it.bz);
          if (d2 < best) best = d2;
        });
        if (best <= r * r) return Math.sqrt(best);
      }
      return 96;
    }

    waterAt(x, z) {
      if (x > N.INTERIOR_X - 500) return null;
      const i = this.idx(x, z);
      const t = i < 0 ? (this.inWater(x, z) ? GT.WATER : GT.FIELD) : this.g[i];
      if (t !== GT.WATER) return null;
      if (this.decks.length && this.onDeck(x, z)) return null;
      if (this.surfaceAt(x, z) === 0) return null;
      const W = this.wIdx || this.waterIndex();
      let pond = null;
      W.P.query(x, z, x, z, it => { if (N.pointInPoly(it.l.poly, x, z)) { pond = it.l; return true; } });
      const d = this.shoreDist(x, z, pond, W);
      if (pond) return { level: 0, bed: -Math.min(2.6, 0.1 + d * 0.5), d, pond: true };
      return { level: N.WATER_Y, bed: Math.max(-7, 0.01 - d * N.BANK_SLOPE), d, pond: false };
    }

    groundY(x, z, py) {
      let y;
      if (x > N.INTERIOR_X - 500) y = this.metroLine && this.metroLine.has(x, z) ? this.metroLine.floorY(x, z, py) : GY[GT.FLOOR];
      else {
        const i = this.idx(x, z);
        const t = i < 0 ? (this.inWater(x, z) ? GT.WATER : GT.FIELD) : this.g[i];
        if (t === GT.WATER) { const w = this.surfaceAt(x, z) === 0 ? null : this.waterAt(x, z); y = w ? w.bed : 0; }
        else if (t === GT.ROAD || t === GT.WALK || t === GT.MEDIAN) y = this.surfaceAt(x, z) === 1 ? GY[GT.WALK] : 0;
        else y = 0;
      }
      if (this.decks.length) { const d = this.onDeck(x, z); if (d) y = Math.max(y, d.y); }
      for (let k = 0; k < this.ramps.length; k++) {
        const r = this.ramps[k];
        if (x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) continue;
        const lx = (x - r.cx) * r.fx + (z - r.cz) * r.fz, lw = (x - r.cx) * -r.fz + (z - r.cz) * r.fx;
        if (Math.abs(lw) > r.w / 2 || lx < -r.l / 2 || lx > r.l / 2) continue;
        const t = (lx + r.l / 2) / r.l;
        y = Math.max(y, 0.1 + r.h * t);
      }
      return y;
    }

    buildWalk() {
      const W = this.walk;
      const node = (x, z) => { const id = W.nodes.length; W.nodes.push({ id, x, z, links: [], k: 's' }); return id; };
      const link = (a, b, cross, road, sig) => {
        if (a === b || a === undefined || b === undefined) return;
        const A = W.nodes[a], B = W.nodes[b];
        const id = W.edges.length;
        W.edges.push({ id, a, b, cross: !!cross, len: Math.hypot(B.x - A.x, B.z - A.z), k: cross ? 'c' : 's', ow: cross ? 0.6 : 0.9, road: road === undefined ? -1 : road, sig: sig || null });
        A.links.push(id);
        B.links.push(id);
      };
      const sideNodes = new Map();
      for (const e of this.edges) {
        if (e.plant) continue;
        const tp = this.trimmed(e);
        for (const side of [1, -1]) {
          const sw = side > 0 ? e.swR : e.swL;
          if (!sw) continue;
          let line = N.offsetPline(tp, side * (e.hw + sw * 0.55));
          const cum = N.cumLen(line), L = cum[cum.length - 1];
          const ids = [];
          const steps = Math.max(1, Math.ceil(L / 45));
          for (let k = 0; k <= steps; k++) { const p = N.plineAt(line, cum, L * k / steps); ids.push(node(p.x, p.z)); }
          for (let k = 1; k < ids.length; k++) link(ids[k - 1], ids[k], false, e.id);
          sideNodes.set(e.id + ':' + side, [ids[0], ids[ids.length - 1]]);
        }
      }
      const endNode = (en, plus) => {
        const e = this.edges[en.e];
        const side = en.atA ? (plus ? 1 : -1) : (plus ? -1 : 1);
        const s = sideNodes.get(e.id + ':' + side);
        if (!s) return undefined;
        return en.atA ? s[0] : s[1];
      };
      for (const n of this.nodes) {
        if (!n.ends.length) continue;
        const k = n.ends.length;
        if (k >= 2) {
          for (let i = 0; i < k; i++) {
            const A = n.ends[i], B = n.ends[(i + 1) % k];
            const a = endNode(A, true), b = endNode(B, false);
            if (a !== undefined && b !== undefined) link(a, b);
          }
        }
        for (const en of n.ends) {
          if (k < 3 && k !== 1 && !n.light) continue;
          const a = endNode(en, true), b = endNode(en, false);
          if (a !== undefined && b !== undefined) link(a, b, true, en.e, n.light && !this.edges[en.e].inner ? { n: n.id, g: en.grp || 0 } : null);
        }
      }
      for (const p of this.poiBy.X || []) {
        let best = null, bd = 8;
        this.roadHash.query(p.x - 8, p.z - 8, p.x + 8, p.z + 8, it => {
          if (it.t !== 0 || it.e.plant || !it.e.swR || !it.e.swL) return;
          const [d2, t] = N.segDist2(p.x, p.z, it.ax, it.az, it.bx, it.bz);
          const d = Math.sqrt(d2);
          const s = it.s0 + t * it.L;
          if (d < bd && s > it.e.sa + 8 && s < it.e.len - it.e.sb - 8) { bd = d; best = { it, t, s }; }
        });
        if (!best) continue;
        const e = best.it.e;
        const c = N.plineAt(e.pts, e.cum, best.s);
        const rx = -c.dz, rz = c.dx;
        const oa = e.hw + e.swR * 0.55, ob = e.hw + e.swL * 0.55;
        const a = node(c.x + rx * oa, c.z + rz * oa), b = node(c.x - rx * ob, c.z - rz * ob);
        link(a, b, true, e.id);
        e.crossings = e.crossings || [];
        e.crossings.push(best.s);
        for (const [id, sgn] of [[a, 1], [b, -1]]) {
          const q = W.nodes[id];
          let bi = -1, bdd = 60;
          for (const wid of this.walkNear(q.x, q.z, 60)) { if (wid === id) continue; const w = W.nodes[wid]; const d = Math.hypot(w.x - q.x, w.z - q.z); if (d < bdd) { bdd = d; bi = wid; } }
          if (bi >= 0) link(id, bi);
        }
      }
    }

    pruneWalk() {
      const W = this.walk;
      const comp = new Int32Array(W.nodes.length).fill(-1);
      let nc = 0, big = -1, bs = 0;
      for (const s of W.nodes) {
        if (comp[s.id] >= 0) continue;
        const st = [s.id];
        comp[s.id] = nc;
        let cnt = 0;
        while (st.length) { const v = st.pop(); cnt++; for (const e of W.nodes[v].links) { const E = W.edges[e]; const o = E.a === v ? E.b : E.a; if (comp[o] < 0) { comp[o] = nc; st.push(o); } } }
        if (cnt > bs) { bs = cnt; big = nc; }
        nc++;
      }
      const map = new Int32Array(W.nodes.length).fill(-1);
      const nodes = [], edges = [];
      for (const n of W.nodes) if (comp[n.id] === big) { map[n.id] = nodes.length; n.id = nodes.length; n.links = []; nodes.push(n); }
      for (const e of W.edges) {
        if (map[e.a] < 0 || map[e.b] < 0) continue;
        e.id = edges.length;
        e.a = map[e.a];
        e.b = map[e.b];
        edges.push(e);
        nodes[e.a].links.push(e.id);
        nodes[e.b].links.push(e.id);
      }
      this.walk = { nodes, edges };
    }

    walkNear(x, z, r) {
      const W = this.walk;
      const out = [];
      for (const n of W.nodes) if (Math.abs(n.x - x) < r && Math.abs(n.z - z) < r) out.push(n.id);
      return out;
    }

    box(x0, z0, x1, z1, h, kind, extra) {
      const b = Object.assign({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y0: 0, y1: h, kind }, extra || {});
      this.boxes.push(b);
      this.hash.insert(b);
      return b;
    }

    poly(p, h, kind, extra) {
      const b = N.polyBounds(p);
      const it = Object.assign({ x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1, y0: 0, y1: h, kind, poly: p }, extra || {});
      this.boxes.push(it);
      this.hash.insert(it);
      return it;
    }

    obb(cx, cz, yaw, hl, hw, h, kind, extra) {
      const o = N.obb(cx, cz, yaw, hl, hw);
      const c = N.obbCorners(o);
      const p = [c[0][0], c[0][1], c[1][0], c[1][1], c[2][0], c[2][1], c[3][0], c[3][1]];
      return this.poly(N.polyArea(p) < 0 ? N.reversePoly(p) : p, h, kind, extra);
    }

    segWall(ax, az, bx, bz, t, h, kind, extra) {
      const L = Math.hypot(bx - ax, bz - az);
      if (L < 0.05) return null;
      const yaw = Math.atan2(bx - ax, -(bz - az));
      return this.obb((ax + bx) / 2, (az + bz) / 2, yaw, L / 2, t / 2, h, kind, extra);
    }

    circle(x, z, r, h, kind, extra) {
      const c = Object.assign({ x, z, r, y1: h, kind, x0: x - r, z0: z - r, x1: x + r, z1: z + r, circle: true }, extra || {});
      this.circles.push(c);
      this.hash.insert(c);
      return c;
    }

    claim(x0, z0, x1, z1, tag) { this.occ.insert({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), tag: tag || 1 }); }

    claimPoly(p, pad, tag) { const b = N.polyBounds(p); this.occ.insert({ x0: b.x0 - (pad || 0), z0: b.z0 - (pad || 0), x1: b.x1 + (pad || 0), z1: b.z1 + (pad || 0), poly: p, pad: pad || 0, tag: tag || 1 }); }

    freeAt(x, z, r) {
      let ok = true;
      this.occ.query(x - r, z - r, x + r, z + r, it => {
        if (it.poly) {
          if (N.pointInPoly(it.poly, x, z)) { ok = false; return true; }
          const c = N.circlePoly(x, z, r + it.pad, it.poly);
          if (c) { ok = false; return true; }
          return;
        }
        ok = false;
        return true;
      });
      return ok;
    }

    prop(type, x, z, rot, o) {
      const p = Object.assign({ type, x, z, rot: rot || 0 }, o || {});
      this.props.push(p);
      return p;
    }

    park(x, z, yaw, kinds, o) {
      this.parking.push(Object.assign({ x, z, yaw, kinds: kinds || null, id: this.parking.length }, o || {}));
    }

    pedArea(x0, z0, x1, z1, mix, n, poly) {
      this.pedAreas.push({ x0, z0, x1, z1, mix, n: n || 2, poly: poly || null });
    }

    put(id, x, z, yaw, extra) {
      this.places[id] = Object.assign({ id, x, z, yaw: yaw || 0 }, extra || {});
      return this.places[id];
    }

    nearestEdge(x, z, filter, maxD) {
      const R = maxD || 80;
      let best = null, bd = R;
      this.roadHash.query(x - R, z - R, x + R, z + R, it => {
        if (it.t !== 0) return;
        if (filter && !filter(it.e)) return;
        const [d2, t] = N.segDist2(x, z, it.ax, it.az, it.bx, it.bz);
        const d = Math.sqrt(d2);
        if (d < bd) { bd = d; best = { e: it.e, s: it.s0 + t * it.L, d }; }
      });
      if (best) { const p = N.plineAt(best.e.pts, best.e.cum, best.s); best.x = p.x; best.z = p.z; best.dx = p.dx; best.dz = p.dz; }
      return best;
    }

    roadSide(x, z, filter) {
      const ne = this.nearestEdge(x, z, filter, 120);
      if (!ne) return null;
      const rx = -ne.dz, rz = ne.dx;
      const side = (x - ne.x) * rx + (z - ne.z) * rz >= 0 ? 1 : -1;
      const e = ne.e;
      const sw = side > 0 ? e.swR : e.swL;
      return { e, s: ne.s, x: ne.x, z: ne.z, dx: ne.dx, dz: ne.dz, side, nx: rx * side, nz: rz * side, curb: e.hw, sw, d: ne.d };
    }

    zoneAt(x, z) {
      if (x > N.INTERIOR_X - 500) return this.metroLine && this.metroLine.has(x, z) ? this.metroLine.zone(x, z) : 'Клуб «Мираж»';
      for (const r of this.namedAreas || []) if (x >= r.box.x0 && x <= r.box.x1 && z >= r.box.z0 && z <= r.box.z1 && N.pointInPoly(r.poly, x, z)) return r.name;
      for (const r of this.zoneList) if (x >= r.box.x0 && x <= r.box.x1 && z >= r.box.z0 && z <= r.box.z1 && N.pointInPoly(r.poly, x, z)) return r.name;
      if (this.gaz.length && N.pointInPoly(this.gaz, x, z)) return 'Горьковский автозавод';
      if (this.inWater(x, z)) return 'Ока';
      let best = null, bd = Infinity;
      for (const r of this.zoneList) { const b = N.polyBounds(r.poly); const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2; const d = Math.hypot(cx - x, cz - z); if (d < bd) { bd = d; best = r.name; } }
      return bd < 900 && best ? best : 'Автозаводский район';
    }

    district(x, z) {
      if (this.centerPoly && N.pointInPoly(this.centerPoly, x, z)) return 'leninsky';
      return 'avtozavod';
    }

    freeSpot(x, z, r) {
      for (let k = 0; k < 260; k++) {
        const a = k * 2.399, d = Math.sqrt(k) * r / 14;
        const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
        const t = this.ground(px, pz);
        if (t === GT.ROAD || t === GT.WATER || t === GT.RAIL || t === GT.FOREST || t === GT.FIELD) continue;
        if (!this.inPlay(px, pz)) continue;
        let hit = false;
        this.hash.query(px - 1.3, pz - 1.3, px + 1.3, pz + 1.3, it => {
          if (it.circle) { if ((it.x - px) * (it.x - px) + (it.z - pz) * (it.z - pz) < (it.r + 1.2) * (it.r + 1.2)) { hit = true; return true; } return; }
          if (it.poly) { if (N.pointInPoly(it.poly, px, pz) || N.circlePoly(px, pz, 1.2, it.poly)) { hit = true; return true; } return; }
          if (px > it.x0 - 1.2 && px < it.x1 + 1.2 && pz > it.z0 - 1.2 && pz < it.z1 + 1.2) { hit = true; return true; }
        });
        if (hit) continue;
        return [px, pz];
      }
      return [x, z];
    }

    index() {
      this.hash = new N.SpatialHash(16);
      for (const b of this.boxes) this.hash.insert(b);
      for (const c of this.circles) { c.circle = true; this.hash.insert(c); }
      this.bhash = new N.SpatialHash(32);
      for (const b of this.buildings) this.bhash.insert(b);
      this.propHash = new N.SpatialHash(64);
      for (const p of this.props) { p.x0 = p.x - 1; p.x1 = p.x + 1; p.z0 = p.z - 1; p.z1 = p.z + 1; this.propHash.insert(p); }
      this.parkHash = new N.SpatialHash(64);
      for (const p of this.parking) { p.x0 = p.x; p.x1 = p.x; p.z0 = p.z; p.z1 = p.z; this.parkHash.insert(p); }
      this.laneHash = new N.SpatialHash(32);
      for (const l of this.lanes) {
        const p = l.pts;
        for (let i = 2; i < p.length; i += 2) this.laneHash.insert({ x0: Math.min(p[i - 2], p[i]) - 1, z0: Math.min(p[i - 1], p[i + 1]) - 1, x1: Math.max(p[i - 2], p[i]) + 1, z1: Math.max(p[i - 1], p[i + 1]) + 1, lane: l, i: i / 2 - 1 });
      }
      this.walkHash = new N.SpatialHash(32);
      for (const n of this.walk.nodes) this.walkHash.insert({ x0: n.x, z0: n.z, x1: n.x, z1: n.z, n });
    }

    roofAt(x, z) {
      let y = -1;
      this.hash.query(x, z, x, z, it => {
        if (it.circle || !it.walkRoof) return;
        if (it.poly ? N.pointInPoly(it.poly, x, z) : x >= it.x0 && x <= it.x1 && z >= it.z0 && z <= it.z1) { if (it.y1 > y) y = it.y1; }
      });
      return y;
    }

    lanePoint(l, s) {
      const p = N.plineAt(l.pts, l.cum, s);
      return { x: p.x, z: p.z, dx: p.dx, dz: p.dz };
    }

    nearestLane(x, z, maxD, filter) {
      let best = null, bd = maxD * maxD;
      this.laneHash.query(x - maxD, z - maxD, x + maxD, z + maxD, it => {
        const l = it.lane;
        if (filter && !filter(l, it.i)) return;
        const p = l.pts, i = it.i * 2;
        const [d2, t] = N.segDist2(x, z, p[i], p[i + 1], p[i + 2], p[i + 3]);
        if (d2 < bd) {
          bd = d2;
          const sx = p[i] + (p[i + 2] - p[i]) * t, sz = p[i + 1] + (p[i + 3] - p[i + 1]) * t;
          const L = Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]) || 1;
          best = { lane: l, s: l.cum[it.i] + t * L, x: sx, z: sz, d: Math.sqrt(d2), dx: (p[i + 2] - p[i]) / L, dz: (p[i + 3] - p[i + 1]) / L };
        }
      });
      return best;
    }

    nearestNode(x, z, filter) {
      let best = null, bd = Infinity;
      for (const n of this.nodes) {
        if (filter && !filter(n)) continue;
        const d = (n.x - x) * (n.x - x) + (n.z - z) * (n.z - z);
        if (d < bd) { bd = d; best = n; }
      }
      return best;
    }

    route(fromNode, toNode, allowPlant, anyWay) {
      const n = this.nodes.length;
      const dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
      dist[fromNode] = 0;
      const goal = this.nodes[toNode];
      const open = [fromNode];
      while (open.length) {
        let bi = 0, bf = Infinity;
        for (let i = 0; i < open.length; i++) {
          const q = this.nodes[open[i]];
          const f = dist[open[i]] + Math.hypot(q.x - goal.x, q.z - goal.z);
          if (f < bf) { bf = f; bi = i; }
        }
        const cur = open[bi];
        open[bi] = open[open.length - 1];
        open.pop();
        if (done[cur]) continue;
        done[cur] = 1;
        if (cur === toNode) break;
        const cn = this.nodes[cur];
        for (const en of cn.ends) {
          const e = this.edges[en.e];
          if (e.plant && !allowPlant) continue;
          if (e.stub && e.a !== toNode && e.b !== toNode && !allowPlant) continue;
          if (e.oneway && !anyWay && !en.atA) continue;
          const o = en.atA ? e.b : e.a;
          const nd = dist[cur] + e.len;
          if (nd < dist[o]) { dist[o] = nd; prev[o] = cur; open.push(o); }
        }
      }
      if (!isFinite(dist[toNode])) return null;
      const path = [toNode];
      while (path[0] !== fromNode) path.unshift(prev[path[0]]);
      return path;
    }

    edgeBetween(a, b) {
      const n = this.nodes[a];
      let best = null;
      for (const en of n.ends) {
        const e = this.edges[en.e];
        if ((e.a === a && e.b === b) || (e.b === a && e.a === b)) { if (!best || (!e.oneway || e.a === a) && best.oneway) best = e; }
      }
      return best;
    }

    laneFor(a, b, k) {
      const n = this.nodes[a];
      for (const en of n.ends) {
        const e = this.edges[en.e];
        if (!((e.a === a && e.b === b) || (e.b === a && e.a === b))) continue;
        const list = (e.a === a ? e.lanesF : e.lanesB).map(id => this.lanes[id]);
        if (list.length) return list[Math.min(k || 0, list.length - 1)];
      }
      return null;
    }

    connBetween(lane, next) {
      for (const cid of lane.out) if (this.conns[cid].to === next.id) return this.conns[cid];
      let best = null;
      for (const cid of lane.out) {
        const c = this.conns[cid];
        if (this.lanes[c.to].edge === next.edge) best = c;
      }
      return best;
    }
  }

  N.City = City;
  let shared = null;
  N.getCity = () => shared || (shared = new City(2000));

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
