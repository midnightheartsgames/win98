(function (N) {
  'use strict';

  const GT = N.GT;
  const AI = N.AI;

  const DAY = {
    street: [0.08, 0.05, 0.04, 0.04, 0.05, 0.12, 0.35, 0.75, 0.9, 0.7, 0.65, 0.7, 0.8, 0.8, 0.75, 0.8, 0.9, 1, 0.95, 0.8, 0.6, 0.42, 0.28, 0.15],
    home: [0.05, 0.03, 0.02, 0.02, 0.03, 0.1, 0.4, 0.7, 0.6, 0.5, 0.6, 0.7, 0.75, 0.75, 0.75, 0.8, 0.9, 1, 1, 0.95, 0.8, 0.5, 0.25, 0.1],
    transit: [0.05, 0.02, 0.02, 0.02, 0.05, 0.3, 0.9, 1.6, 1.4, 0.8, 0.6, 0.6, 0.7, 0.7, 0.7, 0.8, 1.2, 1.5, 1.4, 0.9, 0.6, 0.4, 0.25, 0.12],
    shop: [0.04, 0.03, 0.02, 0.02, 0.02, 0.04, 0.1, 0.3, 0.6, 0.9, 1, 1, 1.1, 1, 1, 1, 1.1, 1.2, 1.1, 0.9, 0.6, 0.3, 0.12, 0.06],
    work: [0.1, 0.05, 0.05, 0.05, 0.1, 0.4, 1.8, 2, 0.8, 0.3, 0.3, 0.4, 0.6, 0.5, 0.4, 1.2, 2, 1.6, 0.6, 0.3, 0.2, 0.15, 0.3, 0.2],
    leisure: [0.1, 0.05, 0.02, 0.02, 0.02, 0.03, 0.05, 0.1, 0.2, 0.35, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 1, 1.1, 1.15, 1.1, 0.8, 0.45, 0.2]
  };
  const LAYERS = ['home', 'transit', 'shop', 'work', 'leisure'];
  N.CROWD_DAY = DAY;
  N.crowdHour = (k, h) => {
    const a = DAY[k], f = ((h % 24) + 24) % 24, i = Math.floor(f), t = f - i;
    return a[i] + (a[(i + 1) % 24] - a[i]) * t;
  };

  const CELL = 40;
  const SNAP = 1, SAMPLE = 2.5, STEP = 24, NEAR_SW = 7, NEAR_PATH = 3.5, DOOR_REACH = 22;
  const STREET = { main: 1, sec: 0.85, ter: 0.65, res: 0.45 };
  const PATHS = { F: [0.35, 0.5], S: [0.3, 0.3], P: [0.9, 1.4], Y: [0.22, 1.3], L: [0.18, 1.5] };
  const BLOCK = new Set(['building', 'fence', 'edge', 'wall', 'barrier']);
  const SOURCES = { podezd: ['home', 0.06, 70], playground: ['home', 0.2, 60], busstop: ['transit', 0.6, 60], metro: ['transit', 1.2, 90], kiosk: ['shop', 0.25, 40] };
  const PLACES = {
    market: ['shop', 2, 160], univermag: ['shop', 1.2, 120], gaz_gate: ['work', 2.5, 220], port_gate: ['work', 0.6, 120], hosp_n: ['work', 0.4, 90], hosp_s: ['work', 0.4, 90],
    dk: ['leisure', 1.2, 150], cinema: ['leisure', 1, 120], stadium_gate: ['leisure', 0.6, 200], ferris: ['leisure', 1.2, 140],
    park_square: ['leisure', 1, 110], park_dance: ['leisure', 0.5, 80], park_gate: ['leisure', 0.6, 90]
  };
  const SPOTS = new Set(['busstop', 'bench', 'kiosk', 'metro']);
  const POP = { rho: 0.04, cap: 75, still: 0.3, near: 100, ring0: 26, ringVis: 72, ring1: 96, hide: 104 };
  N.CROWD = POP;
  const CALM = new Set(['walk', 'area', 'wait', 'bench', 'chat']);
  const STILL = new Set(['wait', 'bench', 'chat']);
  const PAIRS = {
    woman: ['woman', 'girl', 'babushka'], girl: ['girl', 'student'], student: ['student', 'girl'], babushka: ['babushka', 'pensioner'], pensioner: ['pensioner', 'babushka'],
    worker: ['worker', 'muzhik'], muzhik: ['muzhik', 'worker'], business: ['business', 'girl'], chelnok: ['chelnok', 'woman']
  };
  const BENCH_KINDS = [['babushka', 5], ['pensioner', 4], ['woman', 1], ['muzhik', 1], ['student', 0.5], ['girl', 0.5]];
  const NIGHT_BENCH = [['gopnik', 3], ['muzhik', 2], ['student', 1], ['girl', 1]];

  Object.assign(N.City.prototype, {
    pathWalk() {
      const W = this.walk, cells = new Map();
      const ck = (ix, iz) => ix * 131071 + iz;
      const node = (x, z, k) => {
        const ix = Math.round(x / SNAP), iz = Math.round(z / SNAP);
        if (k === 'p') {
          for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
            const list = cells.get(ck(ix + a, iz + b));
            if (list) for (const id of list) { const n = W.nodes[id]; if (Math.abs(n.x - x) < SNAP && Math.abs(n.z - z) < SNAP) return id; }
          }
        }
        const id = W.nodes.length;
        W.nodes.push({ id, x, z, links: [], k });
        if (k === 'p') { const key = ck(ix, iz), list = cells.get(key); if (list) list.push(id); else cells.set(key, [id]); }
        return id;
      };
      const link = (a, b, o) => {
        if (a === b) return null;
        const A = W.nodes[a], B = W.nodes[b];
        for (const id of A.links) { const q = W.edges[id]; if (q.a === b || q.b === b) return q; }
        const e = Object.assign({ id: W.edges.length, a, b, cross: false, len: Math.hypot(B.x - A.x, B.z - A.z), k: 'p', ow: 0.5, road: -1, sig: null, f0: 0 }, o);
        W.edges.push(e);
        A.links.push(e.id);
        B.links.push(e.id);
        return e;
      };
      const bad = (x, z) => {
        const i = this.idx(x, z);
        if (i < 0) return true;
        const t = this.g[i];
        return t === GT.ROAD || t === GT.WATER;
      };
      const chain = (pts, o) => {
        let prev = -1, acc = 0, lx = 0, lz = 0;
        const put = (x, z) => { const id = node(x, z, 'p'); if (prev >= 0) link(prev, id, o); prev = id; acc = 0; };
        const flush = () => { if (prev >= 0 && acc > 0.8) put(lx, lz); prev = -1; acc = 0; };
        for (let i = 0; i + 3 < pts.length; i += 2) {
          const ax = pts[i], az = pts[i + 1], bx = pts[i + 2], bz = pts[i + 3];
          const L = Math.hypot(bx - ax, bz - az);
          if (L < 1e-3) continue;
          const n = Math.max(1, Math.ceil(L / SAMPLE));
          let turn = false;
          if (i + 5 < pts.length) {
            const cx = pts[i + 4] - bx, cz = pts[i + 5] - bz, M = Math.hypot(cx, cz);
            turn = M > 1e-3 && ((bx - ax) * cx + (bz - az) * cz) / (L * M) < 0.94;
          }
          for (let s = i === 0 ? 0 : 1; s <= n; s++) {
            const x = ax + (bx - ax) * s / n, z = az + (bz - az) * s / n;
            if (bad(x, z)) { flush(); continue; }
            if (prev < 0) { put(x, z); lx = x; lz = z; continue; }
            acc += Math.hypot(x - lx, z - lz);
            lx = x; lz = z;
            if (acc >= STEP || s === n && turn && acc >= 3) put(x, z);
          }
        }
        flush();
      };
      for (const f of this.foot) { const c = PATHS[f.cls] || PATHS.F; chain(f.pts, { f0: c[0], ow: c[1] }); }
      for (const s of this.surf) { const c = PATHS[s.cls]; if (c && s.cls !== 'D') chain(s.pts, { f0: c[0], ow: c[1] }); }
      const eh = new N.SpatialHash(16);
      for (const e of W.edges) {
        if (e.k !== 's' && e.k !== 'p') continue;
        const A = W.nodes[e.a], B = W.nodes[e.b];
        eh.insert({ e, x0: Math.min(A.x, B.x), z0: Math.min(A.z, B.z), x1: Math.max(A.x, B.x), z1: Math.max(A.z, B.z) });
      }
      const near = (x, z, r, skip) => {
        const out = [];
        eh.query(x - r, z - r, x + r, z + r, it => {
          const e = it.e;
          if (skip && skip(e)) return;
          const A = W.nodes[e.a], B = W.nodes[e.b];
          const [d2, t] = N.segDist2(x, z, A.x, A.z, B.x, B.z);
          const d = Math.sqrt(d2);
          if (d <= r) out.push({ e, t, d, px: A.x + (B.x - A.x) * t, pz: A.z + (B.z - A.z) * t });
        });
        return out.sort((p, q) => p.d - q.d);
      };
      const atts = [];
      const ends = W.nodes.filter(n => n.k === 'p' && n.links.length === 1);
      for (const q of ends) {
        const own = W.edges[q.links[0]], nb = own.a === q.id ? own.b : own.a;
        const skip = e => e.a === q.id || e.b === q.id || e.a === nb || e.b === nb;
        const hit = near(q.x, q.z, NEAR_SW, skip).filter(c => c.d <= (c.e.k === 's' ? NEAR_SW : NEAR_PATH)).slice(0, 3).find(c => !this.walkBlocked(q.x, q.z, c.px, c.pz));
        if (hit) atts.push({ e: hit.e, t: hit.t, from: q.id, o: { k: 'p', f0: own.f0, ow: own.ow } });
      }
      for (const q of this.doorPaths || []) {
        const L = Math.hypot(q.bx - q.ax, q.bz - q.az);
        if (L < 0.5) continue;
        const ux = (q.bx - q.ax) / L, uz = (q.bz - q.az) / L;
        const hit = near(q.bx, q.bz, DOOR_REACH).slice(0, 4).find(c => !this.walkBlocked(q.bx, q.bz, c.px, c.pz));
        if (!hit) continue;
        const dn = node(q.ax + ux * 0.35, q.az + uz * 0.35, 'd'), en = node(q.bx, q.bz, 'd');
        Object.assign(W.nodes[dn], { door: true, yaw: N.yawOf(ux, uz) });
        link(dn, en, { k: 'd', ow: 0.15 });
        atts.push({ e: hit.e, t: hit.t, from: en, o: { k: 'd', ow: 0.3 } });
      }
      const byEdge = new Map();
      for (const a of atts) { if (!byEdge.has(a.e.id)) byEdge.set(a.e.id, []); byEdge.get(a.e.id).push(a); }
      for (const list of byEdge.values()) {
        const e = list[0].e, A = W.nodes[e.a], B = W.nodes[e.b], L = e.len, cuts = [];
        list.sort((p, q) => p.t - q.t);
        for (const a of list) {
          const s = a.t * L;
          let to;
          if (s < 1.2) to = e.a;
          else if (L - s < 1.2) to = e.b;
          else {
            const c = cuts.find(c => Math.abs(c.s - s) < 1.2);
            if (c) to = c.id;
            else { to = node(A.x + (B.x - A.x) * a.t, A.z + (B.z - A.z) * a.t, e.k); if (to !== e.a && to !== e.b) cuts.push({ s, id: to }); }
          }
          link(a.from, to, a.o);
        }
        if (!cuts.length) continue;
        const b0 = e.b, proto = { cross: e.cross, k: e.k, ow: e.ow, road: e.road, sig: e.sig, f0: e.f0 };
        B.links.splice(B.links.indexOf(e.id), 1);
        e.b = cuts[0].id;
        const M = W.nodes[e.b];
        M.links.push(e.id);
        e.len = Math.hypot(M.x - A.x, M.z - A.z);
        for (let i = 0; i < cuts.length; i++) link(cuts[i].id, i + 1 < cuts.length ? cuts[i + 1].id : b0, proto);
      }
      this.pruneWalk();
    },

    walkBlocked(ax, az, bx, bz) {
      const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 0.7));
      for (let s = 0; s <= n; s++) if (this.ground(ax + (bx - ax) * s / n, az + (bz - az) * s / n) === GT.WATER) return true;
      let hit = false;
      this.hash.query(Math.min(ax, bx) - 0.5, Math.min(az, bz) - 0.5, Math.max(ax, bx) + 0.5, Math.max(az, bz) + 0.5, it => {
        if (it.circle || !BLOCK.has(it.kind) || it.y1 <= 0.6) return;
        for (let s = 0; s <= n; s++) {
          const x = ax + (bx - ax) * s / n, z = az + (bz - az) * s / n;
          if (it.poly ? N.pointInPoly(it.poly, x, z) || N.circlePoly(x, z, 0.25, it.poly) : x > it.x0 - 0.25 && x < it.x1 + 0.25 && z > it.z0 - 0.25 && z < it.z1 + 0.25) { hit = true; return true; }
        }
      });
      return hit;
    },

    walkOk(e) {
      if (e.k === 's' || e.k === 'c') return true;
      if (e.ok === undefined) { const A = this.walk.nodes[e.a], B = this.walk.nodes[e.b]; e.ok = !this.walkBlocked(A.x, A.z, B.x, B.z); }
      return e.ok;
    },

    crowdIndex() {
      const W = this.walk;
      this.walkEdgeHash = new N.SpatialHash(32);
      let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
      for (const n of W.nodes) { x0 = Math.min(x0, n.x); z0 = Math.min(z0, n.z); x1 = Math.max(x1, n.x); z1 = Math.max(z1, n.z); }
      for (const e of W.edges) {
        const A = W.nodes[e.a], B = W.nodes[e.b];
        e.mx = (A.x + B.x) / 2;
        e.mz = (A.z + B.z) / 2;
        if (e.k === 's') e.f0 = e.road >= 0 && this.edges[e.road] ? STREET[this.edges[e.road].cls] || 0.45 : 0.45;
        else if (e.k !== 'p') e.f0 = 0;
        this.walkEdgeHash.insert({ e, x0: Math.min(A.x, B.x), z0: Math.min(A.z, B.z), x1: Math.max(A.x, B.x), z1: Math.max(A.z, B.z) });
      }
      this.pedSpots = new N.SpatialHash(32);
      for (const p of this.props) if (SPOTS.has(p.type)) this.pedSpots.insert({ p, type: p.type, x0: p.x, z0: p.z, x1: p.x, z1: p.z });
      const gw = Math.max(1, Math.ceil((x1 - x0) / CELL) + 1), gd = Math.max(1, Math.ceil((z1 - z0) / CELL) + 1);
      const L = {};
      for (const k of LAYERS) L[k] = new Float32Array(gw * gd);
      const add = (k, x, z, w, r) => {
        const i0 = Math.max(0, Math.floor((x - r - x0) / CELL)), i1 = Math.min(gw - 1, Math.floor((x + r - x0) / CELL));
        const j0 = Math.max(0, Math.floor((z - r - z0) / CELL)), j1 = Math.min(gd - 1, Math.floor((z + r - z0) / CELL));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const d = Math.hypot(x0 + (i + 0.5) * CELL - x, z0 + (j + 0.5) * CELL - z);
          if (d < r) L[k][j * gw + i] += w * (1 - d / r);
        }
      };
      for (const p of this.props) { const s = SOURCES[p.type]; if (s) add(s[0], p.x, p.z, s[1], s[2]); }
      for (const p of (this.poiBy && this.poiBy.S) || []) add('shop', p.x, p.z, 0.18, 60);
      for (const [id, s] of Object.entries(PLACES)) { const p = this.places[id]; if (p) add(s[0], p.x, p.z, s[1], s[2]); }
      for (const b of this.buildings) if (!b.removed && (b.style === 'school' || b.style === 'kinder')) add('work', b.cx, b.cz, 0.35, 90);
      for (const A of this.pedAreas) if (A.mix === 'park') add('leisure', (A.x0 + A.x1) / 2, (A.z0 + A.z1) / 2, 0.8, Math.max(80, Math.min(220, Math.hypot(A.x1 - A.x0, A.z1 - A.z0) / 2)));
      this.ffGrid = { x0, z0, gw, gd, L };
    },

    layerAt(k, x, z) {
      const G = this.ffGrid;
      if (!G) return 0;
      const i = Math.floor((x - G.x0) / CELL), j = Math.floor((z - G.z0) / CELL);
      if (i < 0 || j < 0 || i >= G.gw || j >= G.gd) return 0;
      return G.L[k][j * G.gw + i];
    },

    footfall(x, z, h) {
      let s = 0;
      for (const k of LAYERS) s += this.layerAt(k, x, z) * N.crowdHour(k, h);
      return s;
    },

    edgeFootfall(e, h) {
      if (e.k === 'c' || e.k === 'd') return 0;
      return e.f0 * N.crowdHour('street', h) + this.footfall(e.mx, e.mz, h);
    }
  });

  const placeOk = (w, x, z, warm, vis) => {
    const pl = w.player, d = Math.hypot(x - pl.x, z - pl.z);
    if (d < (warm ? 8 : POP.ring0) || d > POP.ring1) return false;
    return warm || d >= (vis || POP.ringVis) || !AI.visible(w, x, z);
  };

  AI.crowdKind = (w, x, z, h, mix) => {
    const city = w.city;
    const night = h < 6 || h >= 22, eve = h >= 18 && h < 22, day = h >= 8 && h < 18;
    if (w.rng() < 0.035) return 'militia';
    if (N.GANG_ZONES.includes(city.zoneAt(x, z)) && w.rng() < (night ? 0.16 : 0.08)) return 'zarechny';
    if (city.district(x, z) === 'avtozavod' && w.rng() < (night ? 0.06 : 0.03)) return 'bandit';
    const base = mix && N.CIVIL_MIX[mix] ? N.CIVIL_MIX[mix] : N.CIVIL_MIX[city.district(x, z)] || N.CIVIL_MIX.avtozavod;
    const work = city.layerAt('work', x, z) * N.crowdHour('work', h);
    const bias = {
      babushka: night ? 0.1 : h < 8 ? 0.6 : 1.2, pensioner: night ? 0.15 : 1.1, gopnik: night ? 2.4 : eve ? 1.6 : 0.8, muzhik: night ? 1.6 : 1,
      student: day ? 1.2 : eve ? 1.1 : 0.4, girl: day ? 1.1 : eve ? 1.3 : 0.5, worker: 1 + Math.min(3, work * 1.5)
    };
    return w.rng.weighted(base.map(([k, v]) => [k, v * (bias[k] || 1)]));
  };

  AI.companion = (w, kind) => w.rng.pick(PAIRS[kind] || [kind]);

  AI.crowd = w => {
    const pl = w.player, city = w.city;
    if (!city.walkEdgeHash) return;
    const C = w.passers || (w.passers = { cx: 1e9, cz: 1e9, t: -9, px: null, pz: null, edges: [], spots: [], doors: [], areas: [], sum: 0, seen: new Map(), live: 0, still: 0, target: 0 });
    const h = w.clock / 60;
    const jump = C.px === null || Math.hypot(pl.x - C.px, pl.z - C.pz) > 60;
    C.px = pl.x; C.pz = pl.z;
    const mover = pl.veh || pl;
    C.vx = mover.vx || 0; C.vz = mover.vz || 0;
    if (jump || Math.hypot(pl.x - C.cx, pl.z - C.cz) > 12 || w.t - C.t > 3) AI.crowdScan(w, C, h);
    let n = 0, still = 0;
    const hide = Math.hypot(C.vx, C.vz) > 5 ? 64 : POP.hide;
    for (let i = w.peds.length - 1; i >= 0; i--) {
      const p = w.peds[i];
      if (p.isPlayer || p.persistent || p.veh || p.dead) continue;
      const d = Math.hypot(p.x - pl.x, p.z - pl.z);
      if (d > hide && p.ai && !p.ai.mission && CALM.has(p.ai.mode) && !AI.visible(w, p.x, p.z)) { w.removePed(p); continue; }
      if (d < POP.near) { n++; if (p.ai && STILL.has(p.ai.mode)) still++; }
    }
    C.target = Math.min(Math.round(POP.cap * w.settings.peds), Math.round(POP.rho * C.sum * w.settings.peds * w.wx.crowd));
    C.live = n;
    C.still = still;
    let budget = Math.min(jump ? 99 : 3, C.target - n);
    for (let k = 0; k < (jump ? 160 : 12) && budget > 0; k++) {
      const got = AI.crowdSpawn(w, C, h, jump, budget);
      budget -= got;
      C.live += got;
    }
  };

  AI.crowdScan = (w, C, h) => {
    const pl = w.player, city = w.city, R = POP.near + 8;
    C.cx = pl.x; C.cz = pl.z; C.t = w.t;
    C.edges.length = 0; C.spots.length = 0; C.doors.length = 0; C.areas.length = 0;
    let sum = 0;
    city.walkEdgeHash.query(pl.x - R, pl.z - R, pl.x + R, pl.z + R, it => {
      const e = it.e, d = Math.hypot(e.mx - pl.x, e.mz - pl.z);
      if (d > R) return;
      const ff = city.edgeFootfall(e, h);
      if (ff <= 0) return;
      if (d < POP.near) sum += e.len * ff;
      C.edges.push({ e, w: e.len * ff, d });
    });
    C.sum = sum;
    city.pedSpots.query(pl.x - R, pl.z - R, pl.x + R, pl.z + R, it => { if (Math.hypot(it.p.x - pl.x, it.p.z - pl.z) < R) C.spots.push(it); });
    city.walkHash.query(pl.x - R, pl.z - R, pl.x + R, pl.z + R, it => { if (it.n.door) C.doors.push(it.n); });
    for (const A of city.pedAreas) if (!A.stop && A.x1 > pl.x - R && A.x0 < pl.x + R && A.z1 > pl.z - R && A.z0 < pl.z + R) C.areas.push(A);
  };

  AI.crowdSpawn = (w, C, h, warm, max) => {
    if (C.still < C.target * POP.still && (C.spots.length || C.doors.length) && w.rng() < 0.6) return AI.spawnStill(w, C, h, warm, max);
    const r = w.rng();
    if (r < 0.18 * N.crowdHour('home', h) && C.doors.length) return AI.spawnAtDoor(w, C, h, max);
    if (r < 0.3 && C.areas.length) return AI.spawnInArea(w, C, h, warm);
    return AI.spawnOnPath(w, C, h, warm, max);
  };

  AI.spawnOnPath = (w, C, h, warm, max) => {
    const city = w.city, W = city.walk;
    const pl = w.player, sp = Math.hypot(C.vx, C.vz);
    const fit = c => warm || c.d > POP.ring0 - 12;
    const lean = c => {
      if (warm || sp < 5) return c.w;
      const dot = ((c.e.mx - pl.x) * C.vx + (c.e.mz - pl.z) * C.vz) / ((c.d || 1) * sp);
      return c.w * (dot > 0.3 ? 3 : dot < -0.3 ? 0.15 : 1);
    };
    let tot = 0;
    for (const c of C.edges) if (fit(c)) tot += lean(c);
    if (tot <= 0) return 0;
    let pick = w.rng() * tot, c = null;
    for (const q of C.edges) { if (!fit(q)) continue; pick -= lean(q); if (pick <= 0) { c = q; break; } }
    if (!c || !city.walkOk(c.e)) return 0;
    const e = c.e, A = W.nodes[e.a], B = W.nodes[e.b], t = w.rng();
    const x = A.x + (B.x - A.x) * t, z = A.z + (B.z - A.z) * t;
    if (!placeOk(w, x, z, warm)) return 0;
    if (max >= 3 && w.rng() < 0.07 && e.ow >= 0.8) {
      const side = (w.rng() < 0.5 ? 1 : -1) * (e.ow + 0.5), L = e.len || 1;
      return AI.spawnChat(w, x - (B.z - A.z) / L * side, z + (B.x - A.x) / L * side, h, max);
    }
    const kind = AI.crowdKind(w, x, z, h, null);
    const size = kind === 'militia' ? (w.rng() < 0.7 ? 2 : 1) : kind === 'gopnik' && w.rng() < 0.4 ? 3 : w.rng() < 0.26 ? 2 : 1;
    return AI.spawnWalkers(w, kind, x, z, e, w.rng() < 0.5 ? e.a : e.b, Math.min(size, max));
  };

  AI.spawnWalkers = (w, kind, x, z, e, to, size) => {
    const W = w.city.walk, T = W.nodes[to], F = W.nodes[to === e.a ? e.b : e.a];
    const yaw = N.yawOf(T.x - F.x, T.z - F.z), fx = Math.sin(yaw), fz = -Math.cos(yaw);
    const lead = w.spawnPed(kind, x, z, yaw);
    const old = lead.look && lead.look.old;
    lead.ai = { mode: 'walk', edge: e.id, to, off: (w.rng() * 2 - 1) * Math.min(e.ow, 1), speed: (old ? 0.95 : 1.2) + w.rng() * 0.35 + (w.wx.rain || 0) * 0.25 };
    let n = 1;
    for (let i = 1; i < size; i++) {
      const s = i === 1 ? 1 : -1, qx = x - fx * 0.3 * i - fz * 0.72 * s, qz = z - fz * 0.3 * i + fx * 0.72 * s;
      if (!w.pedSpotFree(qx, qz)) continue;
      const k2 = kind === 'militia' || kind === 'gopnik' || kind === 'zarechny' || kind === 'bandit' ? kind : AI.companion(w, kind);
      const q = w.spawnPed(k2, qx, qz, yaw);
      q.ai = { mode: 'walk', edge: e.id, to, off: lead.ai.off, speed: lead.ai.speed, lead, side: s };
      n++;
    }
    return n;
  };

  AI.spawnStill = (w, C, h, warm, max) => {
    if (C.spots.length && (w.rng() < 0.6 || !C.doors.length)) return AI.spawnAtSpot(w, C, h, warm, max);
    const n = C.doors[Math.floor(w.rng() * C.doors.length)];
    if (max < 2 || w.rng() > N.crowdHour('home', h) * (1 - (w.wx.rain || 0) * 0.8)) return 0;
    const cx = n.x + Math.sin(n.yaw) * 2.4, cz = n.z - Math.cos(n.yaw) * 2.4;
    if (!placeOk(w, cx, cz, warm, 60) || w.peds.some(q => Math.abs(q.x - cx) < 3 && Math.abs(q.z - cz) < 3)) return 0;
    return AI.spawnChat(w, cx, cz, h, max);
  };

  AI.spawnChat = (w, cx, cz, h, max) => {
    if (!w.pedSpotFree(cx, cz) || w.city.surfaceAt(cx, cz) === 0) return 0;
    const night = h < 6 || h >= 21;
    let kind = night || w.rng() < 0.2 ? 'gopnik' : AI.crowdKind(w, cx, cz, h, null);
    if (kind === 'militia' || kind === 'bandit') kind = 'muzhik';
    const size = Math.min(max, kind === 'gopnik' ? 3 : w.rng() < 0.3 ? 3 : 2);
    const g = { who: null, sw: 0, at: -1, done: false, members: [] };
    const a0 = w.rng() * Math.PI * 2;
    for (let i = 0; i < size; i++) {
      const a = a0 + i / size * Math.PI * 2, px = cx + Math.cos(a) * 0.75, pz = cz + Math.sin(a) * 0.75;
      const k = i === 0 || kind === 'gopnik' || kind === 'zarechny' ? kind : AI.companion(w, kind);
      const p = w.spawnPed(k, px, pz, N.yawOf(cx - px, cz - pz));
      p.ai = { mode: 'chat', g, x: px, z: pz, cx, cz, t: w.rng.range(25, 80) };
      g.members.push(p);
    }
    if (w.passers) w.passers.still += size;
    return size;
  };

  AI.spawnAtDoor = (w, C, h, max) => {
    const W = w.city.walk, n = C.doors[Math.floor(w.rng() * C.doors.length)], pl = w.player;
    const d = Math.hypot(n.x - pl.x, n.z - pl.z);
    if (d < 10 || d > POP.ring1 || !n.links.length) return 0;
    const e = W.edges[n.links[0]];
    if (!w.city.walkOk(e) || w.peds.some(q => Math.abs(q.x - n.x) < 1.2 && Math.abs(q.z - n.z) < 1.2)) return 0;
    const kind = AI.crowdKind(w, n.x, n.z, h, null);
    return AI.spawnWalkers(w, kind, n.x, n.z, e, e.a === n.id ? e.b : e.a, kind !== 'militia' && max > 1 && w.rng() < 0.2 ? 2 : 1);
  };

  AI.spawnInArea = (w, C, h, warm) => {
    const A = C.areas[Math.floor(w.rng() * C.areas.length)];
    const k = A.mix === 'market' ? N.crowdHour('shop', h) : A.mix === 'park' ? N.crowdHour('leisure', h) : N.crowdHour('street', h);
    if (w.rng() > k) return 0;
    const [x, z] = AI.areaPoint(w, A);
    if (!placeOk(w, x, z, warm, 60) || !w.pedSpotFree(x, z)) return 0;
    const p = w.spawnPed(AI.crowdKind(w, x, z, h, A.mix), x, z, w.rng() * Math.PI * 2);
    p.ai = { mode: 'area', rect: A };
    return 1;
  };

  AI.spawnAtSpot = (w, C, h, warm, max) => {
    const s = C.spots[Math.floor(w.rng() * C.spots.length)], p = s.p;
    if (!placeOk(w, p.x, p.z, warm, 60)) return 0;
    const until = C.seen.get(p);
    if (until !== undefined && until > w.t) return 0;
    C.seen.set(p, w.t + w.rng.range(40, 80));
    if (p.brk && w.broken.has(p.brk)) return 0;
    const here = w.peds.filter(q => q.ai && q.ai.spot === p && !q.dead);
    const dry = 1 - (w.wx.rain || 0);
    const night = h < 7 || h >= 22;
    if (s.type === 'bench') {
      if (here.length || w.rng() > 0.55 * Math.max(N.crowdHour('home', h), N.crowdHour('leisure', h)) * dry * (night ? 0.3 : 1)) return 0;
      const n = max > 1 && w.rng() < 0.35 ? 2 : 1;
      let got = 0;
      for (let i = 0; i < n; i++) {
        const kind = w.rng.weighted(night ? NIGHT_BENCH : BENCH_KINDS);
        if (AI.seatOn(w, p, kind, n === 1 ? (w.rng() - 0.5) * 0.6 : i ? 0.42 : -0.42, -0.02, 0.47, w.rng.range(60, 240))) got++;
      }
      C.still += got;
      return got;
    }
    const want = s.type === 'busstop' ? Math.round(N.crowdHour('transit', h) * w.rng.range(1.2, 3.2) * w.wx.crowd)
      : s.type === 'kiosk' ? Math.round(N.crowdHour('shop', h) * w.rng.range(0.4, 1.6))
        : Math.round(N.crowdHour('transit', h) * w.rng.range(0.5, 1.8));
    let got = 0;
    for (let i = here.length; i < Math.min(6, want) && got < max; i++) {
      if (s.type === 'busstop' && i < 2 && w.rng() < 0.6 * (0.5 + dry * 0.5)) {
        if (AI.seatOn(w, p, AI.crowdKind(w, p.x, p.z, h, null), i ? 0.75 : -0.75, 0.17, 0.52, w.rng.range(30, 120))) got++;
        continue;
      }
      let lx, lz, yaw;
      if (s.type === 'busstop') { lx = w.rng.range(-2.5, 2.5); lz = w.rng.range(-1.9, -0.8); yaw = (p.rot || 0) + w.rng.range(-0.5, 0.5); }
      else if (s.type === 'kiosk') { lx = w.rng.range(-0.8, 0.8); lz = -2.1 - i * 0.75; yaw = (p.rot || 0) + Math.PI; }
      else { const f = p.face || 1; lx = f * w.rng.range(2.3, 3.6); lz = w.rng.range(-2.6, 2.6); yaw = w.rng() * Math.PI * 2; }
      const [x, z] = N.placeAt(p, lx, lz);
      if (!w.pedSpotFree(x, z) || w.city.surfaceAt(x, z) === 0) continue;
      const kind = s.type === 'kiosk' ? w.rng.pick(['muzhik', 'worker', 'woman', 'babushka', 'gopnik', 'student']) : AI.crowdKind(w, x, z, h, null);
      const q = w.spawnPed(kind, x, z, yaw);
      q.ai = { mode: 'wait', spot: p, x, z, yaw, t: s.type === 'kiosk' ? w.rng.range(15, 45) : w.rng.range(30, 120) };
      got++;
    }
    C.still += got;
    return got;
  };

  AI.seatOn = (w, b, kind, lx, lz, y, t) => {
    const [x, z] = N.placeAt(b, lx, lz);
    if (w.peds.some(q => q.bench && Math.hypot(q.bench.x - x, q.bench.z - z) < 0.55)) return false;
    const p = w.spawnPed(kind, x, z, b.rot || 0);
    p.bench = { x, z, yaw: b.rot || 0, y };
    p.ai = { mode: 'bench', spot: b, t };
    return true;
  };

  AI.standUp = (w, p) => {
    const b = p.bench;
    if (!b) return;
    p.bench = null;
    const x = b.x + Math.sin(b.yaw) * 0.6, z = b.z - Math.cos(b.yaw) * 0.6;
    if (w.pedSpotFree(x, z)) { p.x = x; p.z = z; }
  };

  AI.crowdPre = (w, p) => {
    if (p.bench && p.ai.mode !== 'bench') AI.standUp(w, p);
    if (p.anim.talk && p.ai.mode !== 'chat') p.anim.talk = 0;
  };

  AI.pmodes.wait = (w, p, dt) => {
    const ai = p.ai;
    ai.t -= dt;
    if (!ai.arrived && Math.hypot(ai.x - p.x, ai.z - p.z) > 0.4) AI.moveTo(p, ai.x, ai.z, 1.1, dt);
    else { ai.arrived = true; p.wantVx = p.wantVz = 0; p.yaw = N.turnTo(p.yaw, ai.yaw, dt * 3); }
    if (ai.t <= 0) p.ai = { mode: 'walk', edge: -1 };
  };

  AI.pmodes.bench = (w, p, dt) => {
    const ai = p.ai, b = p.bench;
    ai.t -= dt;
    p.wantVx = p.wantVz = 0;
    if (!b || ai.t <= 0 || ai.spot.brk && w.broken.has(ai.spot.brk) || Math.hypot(p.x - b.x, p.z - b.z) > 0.3) { AI.standUp(w, p); p.ai = { mode: 'walk', edge: -1 }; return; }
    p.vx = p.vz = 0;
    p.x = b.x; p.z = b.z; p.yaw = b.yaw;
  };

  AI.pmodes.chat = (w, p, dt) => {
    const ai = p.ai, g = ai.g;
    ai.t -= dt;
    if (g.done || ai.t <= 0) { AI.endChat(w, g); return; }
    if (Math.hypot(ai.x - p.x, ai.z - p.z) > 0.5) AI.moveTo(p, ai.x, ai.z, 1.1, dt);
    else { p.wantVx = p.wantVz = 0; p.yaw = N.turnTo(p.yaw, N.yawOf(ai.cx - p.x, ai.cz - p.z), dt * 4); }
    if (g.at !== w.t) {
      g.at = w.t;
      g.sw -= dt;
      if (g.sw <= 0) {
        g.sw = w.rng.range(2, 6);
        const live = g.members.filter(q => !q.dead && !q.removed && q.ai && q.ai.g === g);
        g.who = live.length ? w.rng.pick(live) : null;
      }
    }
    p.anim.talk = g.who === p ? 1 : 0;
  };

  AI.endChat = (w, g) => {
    if (g.done) return;
    g.done = true;
    let lead = null, side = 1;
    for (const q of g.members) {
      if (q.dead || q.removed || !q.ai || q.ai.g !== g) continue;
      q.anim.talk = 0;
      if (lead) { q.ai = { mode: 'walk', edge: -1, lead, side }; side = -side; }
      else { q.ai = { mode: 'walk', edge: -1 }; lead = q; }
    }
  };

  AI.joinWalk = (w, p) => {
    const city = w.city, W = city.walk, ai = p.ai;
    let best = null, bd = Infinity;
    for (const r of [25, 80, 220]) {
      city.walkHash.query(p.x - r, p.z - r, p.x + r, p.z + r, it => {
        const n = it.n;
        if (n.k === 'd') return;
        const d = N.dist2(n.x, n.z, p.x, p.z);
        if (d < bd) { bd = d; best = n; }
      });
      if (best) break;
    }
    if (!best) return false;
    const ok = best.links.filter(id => { const e = W.edges[id]; return e.k !== 'd' && e.k !== 'c' && city.walkOk(e); });
    const list = ok.length ? ok : best.links;
    if (!list.length) return false;
    const e = W.edges[list[Math.floor(w.rng() * list.length)]];
    ai.edge = e.id;
    ai.to = best.id;
    ai.off = (w.rng() * 2 - 1) * Math.min(e.ow, 1);
    if (!ai.speed) ai.speed = (p.look && p.look.old ? 0.95 : 1.2) + w.rng() * 0.35;
    return true;
  };

  AI.followLead = (w, p, dt) => {
    const ai = p.ai, L = ai.lead;
    if (!L || L.dead || L.removed || !L.ai || L.ai.mode !== 'walk' || L.ai.lead) return false;
    const fx = Math.sin(L.yaw), fz = -Math.cos(L.yaw), s = ai.side || 1;
    const tx = L.x - fz * 0.72 * s - fx * (s < 0 ? 0.45 : 0.1), tz = L.z + fx * 0.72 * s - fz * (s < 0 ? 0.45 : 0.1);
    const d = Math.hypot(tx - p.x, tz - p.z);
    if (d > 14) return false;
    const lv = Math.hypot(L.vx, L.vz);
    if (d < 0.3 && lv < 0.2) { p.wantVx = p.wantVz = 0; p.yaw = N.turnTo(p.yaw, L.yaw, dt * 4); return true; }
    AI.moveTo(p, tx + fx * lv * 0.4, tz + fz * lv * 0.4, Math.min(2.6, lv + d * 1.2 + 0.2), dt);
    return true;
  };

  AI.crossFree = (w, e, fn, tn) => {
    const city = w.city, need = Math.min(10, e.len / 1.7) + 0.5;
    if (e.sig) {
      const n = city.nodes[e.sig.n];
      if (city.lightState(n, w.t, e.sig.g) !== 'r') return false;
      const c = ((w.t + n.phase) % 26 + 26) % 26;
      return (e.sig.g === 0 ? 26 - c : 13 - c) > need;
    }
    const mx = (fn.x + tn.x) / 2, mz = (fn.z + tn.z) / 2;
    let free = true;
    w.near(mx, mz, 45, v => {
      if (v.kind !== 'veh' || v.dead) return;
      const sp = Math.hypot(v.vx, v.vz);
      if (sp < 1.5) return;
      const ux = v.vx / sp, uz = v.vz / sp, rx = mx - v.x, rz = mz - v.z;
      const along = rx * ux + rz * uz;
      if (along < -2 || along > 45 || Math.abs(rz * ux - rx * uz) > e.len / 2 + 2.5) return;
      if (along / sp < need + 1) { free = false; return true; }
    });
    return free;
  };

  AI.nextEdge = (w, p, tn) => {
    const ai = p.ai, city = w.city, W = city.walk;
    const cur = W.edges[ai.edge];
    if (tn.door) {
      if (ai.home && !p.persistent) {
        for (const q of w.peds.slice()) if (q.ai && q.ai.lead === p && Math.hypot(q.x - p.x, q.z - p.z) < 6) w.removePed(q);
        w.removePed(p);
        return;
      }
      ai.to = cur.a === tn.id ? cur.b : cur.a;
      return;
    }
    const fn = W.nodes[cur.a === tn.id ? cur.b : cur.a];
    const hx = tn.x - fn.x, hz = tn.z - fn.z, hl = Math.hypot(hx, hz) || 1;
    const h = w.clock / 60, homeK = N.crowdHour('home', h);
    const opts = [];
    let tot = 0;
    for (const id of tn.links) {
      if (id === ai.edge) continue;
      const e = W.edges[id];
      if (!city.walkOk(e)) continue;
      const on = W.nodes[e.a === tn.id ? e.b : e.a];
      const dot = ((on.x - tn.x) * hx + (on.z - tn.z) * hz) / ((e.len || 1) * hl);
      let wt = (0.3 + Math.max(0, dot) * Math.max(0, dot) * 2) * (0.6 + city.edgeFootfall(e, h));
      if (e.k === 'c') wt = (0.3 + Math.max(0, dot)) * 0.55;
      if (e.k === 'd') wt = tn.k === 'd' ? 1 : homeK * 0.35;
      opts.push([e, wt]);
      tot += wt;
    }
    if (!opts.length) { ai.to = fn.id; return; }
    let r = w.rng() * tot, pick = opts[opts.length - 1][0];
    for (const [e, wt] of opts) { r -= wt; if (r <= 0) { pick = e; break; } }
    if (pick.k === 'd' && tn.k !== 'd') ai.home = true;
    ai.edge = pick.id;
    ai.to = pick.a === tn.id ? pick.b : pick.a;
    ai.off = N.clamp(ai.off || 0, -pick.ow, pick.ow);
    if (pick.k === 'c') { ai.wait = 0; ai.waitT = 0; }
  };

  AI.pmodes.walk = (w, p, dt) => {
    const ai = p.ai, W = w.city.walk;
    if (ai.lead) {
      if (AI.followLead(w, p, dt)) return;
      ai.lead = null;
      ai.edge = -1;
    }
    if (ai.edge === undefined || ai.edge < 0 || !W.edges[ai.edge] || ai.to === undefined) {
      if (!AI.joinWalk(w, p)) { p.ai = { mode: 'idle' }; return; }
    }
    const e = W.edges[ai.edge], tn = W.nodes[ai.to], fn = W.nodes[e.a === ai.to ? e.b : e.a];
    if (ai.wait !== undefined) {
      ai.wait += dt;
      ai.waitT -= dt;
      if (ai.waitT <= 0) {
        ai.waitT = 0.3;
        if (ai.wait > 25 || AI.crossFree(w, e, fn, tn)) ai.wait = undefined;
      }
      if (ai.wait !== undefined) {
        p.wantVx = p.wantVz = 0;
        p.yaw = N.turnTo(p.yaw, N.yawOf(tn.x - fn.x, tn.z - fn.z), dt * 4);
        return;
      }
    }
    const ex = tn.x - fn.x, ez = tn.z - fn.z, L = Math.hypot(ex, ez) || 1;
    const off = N.clamp(ai.off || 0, -e.ow, e.ow);
    const d = AI.moveTo(p, tn.x - ez / L * off, tn.z + ex / L * off, (ai.speed || 1.35) * (e.k === 'c' ? 1.25 : 1), dt);
    ai.stuck = Math.hypot(p.vx, p.vz) < 0.25 ? (ai.stuck || 0) + dt : 0;
    if (ai.stuck > 3.5) { ai.stuck = 0; ai.to = fn.id; ai.home = false; return; }
    if (d < 1.2) AI.nextEdge(w, p, tn);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
