(function (K) {
  'use strict';
  const { clamp, lerp, smooth, fbm, noise2, hash2, segDist2, rng } = K;

  const HALF = 600, CELL = 4, N = HALF * 2 / CELL + 1;
  const NAV = 2, NN = HALF * 2 / NAV;
  const CH = 64, CHN = Math.ceil(HALF * 2 / CH);
  const WATER_Y = 0;

  const PLACES = {
    town: { id: 'town', name: 'Развилки', x: 40, z: 140, r: 62, blend: 40, zone: 'folk' },
    palace: { id: 'palace', name: 'Дворец', x: 40, z: -405, r: 78, blend: 45, zone: 'emp' },
    village: { id: 'village', name: 'Листва', x: -380, z: 40, r: 58, blend: 30, zone: 'elf' },
    camp: { id: 'camp', name: 'Лагерь партизан', x: -480, z: -170, r: 18, blend: 14, zone: 'elf' },
    fort: { id: 'fort', name: 'Старый форт', x: 410, z: 255, r: 52, blend: 34, zone: 'evil', h: 52 },
    lookout: { id: 'lookout', name: 'Скальный уступ', x: 342, z: 158, r: 7, blend: 58, zone: 'evil', h: 64 },
    tower: { id: 'tower', name: 'Эльфийская вышка', x: -250, z: -95, r: 10, blend: 12, zone: 'elf' },
    farm: { id: 'farm', name: 'Хутор Кривой Плетень', x: -70, z: -120, r: 26, blend: 22, zone: 'folk' },
    ford: { id: 'ford', name: 'Застава на Военном тракте', x: 250, z: -175, r: 14, blend: 18, zone: 'emp' }
  };
  const LAKE = { x: 165, z: 235, r: 46 };

  const NODES = {
    town: [40, 140], palace: [40, -342], village: [-327, 40], fort: [355, 252], camp: [-470, -160],
    jw: [-60, 122], jn: [40, -230], jne: [150, -300], tower: [-250, -82], farm: [-70, -110], pass: [300, 128], ford: [250, -168]
  };
  const ROADS = [
    { id: 'north', a: 'town', b: 'jn', pts: [[40, 140], [44, 70], [58, -40], [62, -150], [40, -230]] },
    { id: 'north2', a: 'jn', b: 'palace', pts: [[40, -230], [34, -290], [40, -342]] },
    { id: 'east', a: 'town', b: 'fort', pts: [[40, 140], [110, 128], [190, 150], [250, 165], [292, 205], [318, 246], [338, 226], [355, 252]] },
    { id: 'west', a: 'town', b: 'jw', pts: [[40, 140], [-10, 128], [-60, 122]] },
    { id: 'west2', a: 'jw', b: 'village', pts: [[-60, 122], [-130, 96], [-200, 74], [-270, 52], [-327, 40]] },
    { id: 'farmroad', a: 'jw', b: 'farm', pts: [[-60, 122], [-75, 20], [-70, -110]] },
    { id: 'military', a: 'palace', b: 'jne', pts: [[40, -342], [90, -330], [150, -300]] },
    { id: 'military2', a: 'jne', b: 'ford', pts: [[150, -300], [205, -240], [250, -168]] },
    { id: 'military3', a: 'ford', b: 'pass', pts: [[250, -168], [282, -90], [302, 10], [300, 128]] },
    { id: 'military4', a: 'pass', b: 'fort', pts: [[300, 128], [306, 180], [318, 246]] },
    { id: 'raid', a: 'jn', b: 'tower', pts: [[40, -230], [-40, -200], [-130, -160], [-200, -120], [-250, -82]] },
    { id: 'raid2', a: 'tower', b: 'village', pts: [[-250, -82], [-300, -40], [-345, 0], [-372, 18]] },
    { id: 'camptrail', a: 'village', b: 'camp', pts: [[-372, 18], [-410, -40], [-450, -110], [-470, -160]] }
  ];
  const FIELDS = [
    { x: 120, z: -300, w: 70, d: 60, rot: 0.2 }, { x: -40, z: -330, w: 60, d: 50, rot: -0.15 }, { x: 140, z: -200, w: 50, d: 70, rot: 0.1 },
    { x: -20, z: 60, w: 60, d: 40, rot: 0.05 }, { x: 110, z: 60, w: 50, d: 45, rot: -0.1 }, { x: -40, z: -60, w: 40, d: 50, rot: 0.3 }, { x: -100, z: -130, w: 36, d: 30, rot: 0 }
  ];

  const SPECIES = [
    { id: 'pine', name: 'Сосна', h: 15, r: 0.32 },
    { id: 'oak', name: 'Дуб', h: 11, r: 0.45 },
    { id: 'birch', name: 'Берёза', h: 12, r: 0.25 },
    { id: 'spruce', name: 'Ель', h: 13, r: 0.3 },
    { id: 'dead', name: 'Сухое дерево', h: 8, r: 0.28 }
  ];

  class World {
    constructor(seed) {
      this.seed = seed == null ? 1998 : seed;
      this.places = PLACES; this.nodes = NODES; this.lake = LAKE; this.fields = FIELDS; this.species = SPECIES;
      this.parts = []; this.colliders = []; this.containers = []; this.spots = {}; this.routes = {}; this.uses = [];
      this.burn = {}; this.gates = {}; this.signs = [];
      this.buildRoads();
      this.buildHeights();
      this.buildAll();
      this.buildColliderGrid();
      this.buildTrees();
      this.buildNav();
    }

    zoneAt(x, z) {
      const n = (noise2(x / 90, z / 90, this.seed + 5) - 0.5) * 60;
      if (x + n > 205 && !(z < -140 && x < 275)) return 'evil';
      if (x - n < -165) return 'elf';
      if (z + n < -215 || (z < -140 && x > 170)) return 'emp';
      return 'folk';
    }

    roadDist(x, z) {
      let best = 1e9, bi = -1, bt = 0, bs = 0;
      const cx = Math.floor((x + HALF) / 32), cz = Math.floor((z + HALF) / 32);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const list = this.roadGrid.get((cx + dx) + ',' + (cz + dz)); if (!list) continue;
        for (const k of list) {
          const s = this.roadSegs[k], r = segDist2(x, z, s.ax, s.az, s.bx, s.bz);
          if (r.d2 < best) { best = r.d2; bi = k; bt = r.t; }
        }
      }
      if (bi < 0) return { d: 1e9, h: 0, seg: null };
      const s = this.roadSegs[bi];
      bs = s.ha + (s.hb - s.ha) * bt;
      return { d: Math.sqrt(best), h: bs, seg: s };
    }

    buildRoads() {
      this.roadSegs = []; this.roadGrid = new Map(); this.roadPaths = {};
      for (const r of ROADS) {
        const dense = [];
        for (let i = 0; i < r.pts.length - 1; i++) {
          const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1];
          const l = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(l / 4));
          for (let k = 0; k < n; k++) {
            const t = k / n, p0 = r.pts[Math.max(0, i - 1)], p3 = r.pts[Math.min(r.pts.length - 1, i + 2)];
            const t2 = t * t, t3 = t2 * t;
            const cr = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
            dense.push([cr(p0[0], ax, bx, p3[0]), cr(p0[1], az, bz, p3[1])]);
          }
        }
        dense.push(r.pts[r.pts.length - 1].slice());
        r.dense = dense;
        this.roadPaths[r.id] = r;
      }
    }

    rawHeight(x, z) {
      const s = this.seed;
      let h = 3 + fbm(x / 160, z / 160, s, 4) * 12 - 4;
      h += (fbm(x / 40, z / 40, s + 9, 2) - 0.5) * 2;
      const mm = smooth(165, 330, x + (fbm(x / 200, z / 200, s + 3, 3) - 0.5) * 90) * (1 - smooth(-200, -330, z) * smooth(260, 180, x));
      if (mm > 0) {
        const rid = 1 - Math.abs(2 * fbm(x / 170, z / 170, s + 21, 4) - 1);
        let m = 30 + 95 * rid * rid;
        const pass = this.passFactor ? this.passFactor(x, z) : 1;
        h += mm * m * pass;
      }
      const dp = Math.hypot(x - PLACES.palace.x, z - PLACES.palace.z);
      h += 20 * Math.exp(-(dp * dp) / (125 * 125));
      const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
      h -= 9 * smooth(LAKE.r + 34, LAKE.r * 0.2, dl);
      const e = Math.max(Math.abs(x), Math.abs(z));
      h += smooth(520, 600, e) * 40 * (0.6 + fbm(x / 60, z / 60, s + 33, 2));
      return h;
    }

    buildHeights() {
      const passSegs = [];
      for (const id of ['military', 'military2', 'military3', 'military4', 'east']) for (const p of this.roadPaths[id].dense) passSegs.push(p);
      this.passFactor = (x, z) => {
        if (x < 150) return 1;
        let best = 1e9;
        for (let i = 0; i < passSegs.length; i += 3) { const dx = x - passSegs[i][0], dz = z - passSegs[i][1], d = dx * dx + dz * dz; if (d < best) best = d; }
        return 1 - 0.82 * Math.exp(-best / (48 * 48));
      };
      const H = new Float32Array(N * N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) H[j * N + i] = this.rawHeight(-HALF + i * CELL, -HALF + j * CELL);
      this.H = H;
      for (const id in PLACES) {
        const p = PLACES[id];
        if (p.h == null) p.h = this.sampleGrid(p.x, p.z);
        if (id === 'fort') p.h = Math.max(p.h, this.sampleGrid(p.x, p.z) - 6);
      }
      PLACES.fort.h = 52; PLACES.lookout.h = 64;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = -HALF + i * CELL, z = -HALF + j * CELL;
        let h = H[j * N + i];
        for (const id in PLACES) {
          const p = PLACES[id], d = Math.hypot(x - p.x, z - p.z);
          if (d < p.r + p.blend) h = lerp(h, p.h + (id === 'fort' ? 0 : (noise2(x / 12, z / 12, 7) - 0.5) * 0.6), smooth(p.r + p.blend, p.r, d));
        }
        H[j * N + i] = h;
      }
      for (const r of ROADS) {
        const hs = r.dense.map(p => this.sampleGrid(p[0], p[1]));
        const sm = hs.map((_, i) => { let s = 0, n = 0; for (let k = -4; k <= 4; k++) { const v = hs[clamp(i + k, 0, hs.length - 1)]; s += v; n++; } return s / n; });
        sm.forEach((v, i) => { const p = r.dense[i]; if (Math.hypot(p[0] - LAKE.x, p[1] - LAKE.z) < LAKE.r + 8) sm[i] = Math.max(v, 1.2); });
        for (const id in PLACES) { const p = PLACES[id]; r.dense.forEach((q, i) => { const d = Math.hypot(q[0] - p.x, q[1] - p.z); if (d < p.r) sm[i] = lerp(sm[i], p.h, smooth(p.r, p.r * 0.6, d)); }); }
        r.h = sm;
        for (let i = 0; i < r.dense.length - 1; i++) {
          const seg = { ax: r.dense[i][0], az: r.dense[i][1], bx: r.dense[i + 1][0], bz: r.dense[i + 1][1], ha: sm[i], hb: sm[i + 1], road: r.id };
          const k = this.roadSegs.push(seg) - 1;
          const minx = Math.floor((Math.min(seg.ax, seg.bx) - 12 + HALF) / 32), maxx = Math.floor((Math.max(seg.ax, seg.bx) + 12 + HALF) / 32);
          const minz = Math.floor((Math.min(seg.az, seg.bz) - 12 + HALF) / 32), maxz = Math.floor((Math.max(seg.az, seg.bz) + 12 + HALF) / 32);
          for (let a = minx; a <= maxx; a++) for (let b = minz; b <= maxz; b++) { const key = a + ',' + b; if (!this.roadGrid.has(key)) this.roadGrid.set(key, []); this.roadGrid.get(key).push(k); }
        }
      }
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = -HALF + i * CELL, z = -HALF + j * CELL;
        const rd = this.roadDist(x, z);
        if (rd.d < 13) H[j * N + i] = lerp(H[j * N + i], rd.h, smooth(13, 4, rd.d));
      }
    }

    sampleGrid(x, z) {
      const fx = clamp((x + HALF) / CELL, 0, N - 1.001), fz = clamp((z + HALF) / CELL, 0, N - 1.001);
      const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, H = this.H;
      const a = H[j * N + i], b = H[j * N + i + 1], c = H[(j + 1) * N + i], d = H[(j + 1) * N + i + 1];
      if (u + v <= 1) return a + (b - a) * u + (c - a) * v;
      return d + (c - d) * (1 - u) + (b - d) * (1 - v);
    }
    height(x, z) { return this.sampleGrid(x, z); }
    normal(x, z) {
      const e = 1.5, hx = this.height(x + e, z) - this.height(x - e, z), hz = this.height(x, z + e) - this.height(x, z - e);
      const l = Math.hypot(hx, 2 * e, hz);
      return [-hx / l, 2 * e / l, -hz / l];
    }
    slope(x, z) { const n = this.normal(x, z); return Math.acos(clamp(n[1], -1, 1)); }
    inField(x, z) {
      for (const f of FIELDS) {
        const c = Math.cos(f.rot), s = Math.sin(f.rot), dx = x - f.x, dz = z - f.z;
        const lx = dx * c + dz * s, lz = -dx * s + dz * c;
        if (Math.abs(lx) < f.w / 2 && Math.abs(lz) < f.d / 2) return true;
      }
      return false;
    }
    surfaceAt(x, z) {
      const h = this.height(x, z);
      if (h < WATER_Y - 0.15) return 'water';
      if (this.roadDist(x, z).d < 3.2) return 'road';
      const zn = this.zoneAt(x, z), sl = this.slope(x, z);
      if (h > 100) return 'snow';
      if (sl > 0.75 || (zn === 'evil' && h > 45 && sl > 0.45)) return 'rock';
      if (h < WATER_Y + 1.2 && Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 14) return 'sand';
      if (this.inField(x, z)) return 'field';
      if (zn === 'elf') return 'forest';
      return 'grass';
    }
    placeAt(x, z) {
      for (const id in PLACES) { const p = PLACES[id]; if (Math.hypot(x - p.x, z - p.z) < p.r + 10) return p; }
      return null;
    }

    toWorld(o, lx, lz) { const c = Math.cos(o.rot), s = Math.sin(o.rot); return [o.x + lx * c - lz * s, o.z + lx * s + lz * c]; }
    part(o, p) {
      const [wx, wz] = this.toWorld(o, p.x || 0, p.z || 0);
      const base = p.abs ? 0 : (o.y != null ? o.y : this.height(o.x, o.z));
      const q = { s: p.s || 'box', x: wx, z: wz, y: base + (p.y || 0), w: p.w, h: p.h, d: p.d, rot: o.rot + (p.rot || 0), mat: p.mat || 'plank', burn: p.burn || o.burn || null, solid: p.solid !== false, gate: p.gate || null, top: p.top, dec: !!p.dec };
      this.parts.push(q);
      if (q.solid && q.s !== 'cone' && q.s !== 'sphere') this.addCollider(q);
      return q;
    }
    addCollider(q) {
      const c = Math.cos(q.rot), s = Math.sin(q.rot);
      if (q.s === 'cyl') { this.colliders.push({ t: 'cyl', x: q.x, z: q.z, r: q.w / 2, y0: q.y, y1: q.y + q.h, burn: q.burn, gate: q.gate }); return; }
      if (q.s === 'prism') { this.colliders.push({ t: 'box', x: q.x, z: q.z, hw: q.w / 2, hd: q.d / 2, c, s, y0: q.y, y1: q.y + q.h * 0.5, burn: q.burn, gate: q.gate, roof: true }); return; }
      this.colliders.push({ t: q.s === 'ramp' ? 'ramp' : 'box', x: q.x, z: q.z, hw: q.w / 2, hd: q.d / 2, c, s, y0: q.y, y1: q.y + q.h, burn: q.burn, gate: q.gate });
    }
    spot(id, o, lx, lz, yaw, y) {
      const [x, z] = this.toWorld(o, lx, lz);
      this.spots[id] = { x, z, y: y != null ? y : null, yaw: yaw != null ? o.rot + yaw : 0 };
      return this.spots[id];
    }
    container(id, o, lx, lz, name, items, gold, fac, ly) {
      const [x, z] = this.toWorld(o, lx, lz);
      const y = (o.y != null ? o.y : this.height(o.x, o.z)) + (ly || 0);
      this.part(o, { x: lx, z: lz, y: ly || 0, w: 1.0, h: 0.7, d: 0.65, mat: 'chest' });
      const c = { id, x, y, z, name, items: items || [], gold: gold || 0, fac: fac || null, open: false };
      this.containers.push(c);
      return c;
    }
    use(kind, o, lx, lz, extra) {
      const [x, z] = this.toWorld(o, lx, lz);
      const u = Object.assign({ kind, x, z, y: (o.y != null ? o.y : this.height(o.x, o.z)) + ((extra && extra.ly) || 0) }, extra || {});
      this.uses.push(u);
      return u;
    }
    wallLine(o, x1, z1, x2, z2, t, h, mat, extra) {
      const l = Math.hypot(x2 - x1, z2 - z1), rot = Math.atan2(z2 - z1, x2 - x1);
      const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
      const [wx, wz] = this.toWorld(o, cx, cz);
      const base = (extra && extra.y != null) ? extra.y : (o.y != null ? o.y : this.height(o.x, o.z));
      const q = Object.assign({ s: 'box', x: wx, z: wz, y: base + ((extra && extra.dy) || 0), w: l, h, d: t, rot: o.rot + rot, mat, solid: true, burn: null, gate: null }, extra || {});
      q.y = base + ((extra && extra.dy) || 0);
      this.parts.push(q); this.addCollider(q);
      return q;
    }

    house(o, opts = {}) {
      const w = opts.w || 7, d = opts.d || 6, h = opts.h || 3, t = 0.35, door = opts.door || 1.6, mat = opts.mat || 'plaster', roof = opts.roof || 'thatch';
      o.burn = opts.burn || null;
      const P = (p) => this.part(o, p);
      P({ x: 0, z: -d / 2 + t / 2, w, h, d: t, mat });
      P({ x: -w / 2 + t / 2, z: 0, w: t, h, d: d - t * 2, mat });
      P({ x: w / 2 - t / 2, z: 0, w: t, h, d: d - t * 2, mat });
      const side = (w - door) / 2;
      P({ x: -w / 2 + side / 2, z: d / 2 - t / 2, w: side, h, d: t, mat });
      P({ x: w / 2 - side / 2, z: d / 2 - t / 2, w: side, h, d: t, mat });
      P({ x: 0, z: d / 2 - t / 2, y: h - 0.6, w: door, h: 0.6, d: t, mat });
      P({ s: 'prism', x: 0, z: 0, y: h, w: w + 0.8, h: opts.roofH || 2.2, d: d + 0.8, mat: roof, solid: false });
      P({ x: 0, z: 0, y: h - 0.05, w: w - 0.1, h: 0.1, d: d - 0.1, mat: 'plank', solid: false, dec: true });
      P({ x: 0, z: 0, y: 0.02, w: w - 0.2, h: 0.05, d: d - 0.2, mat: mat === 'stone' || mat === 'dark_stone' ? mat : 'plank', solid: false, dec: true });
      if (opts.chimney) P({ x: w / 4, z: -d / 4, y: h, w: 0.7, h: 2.6, d: 0.7, mat: 'stone', solid: false });
      if (opts.table) { P({ x: -w / 4, z: -d / 6, w: 1.4, h: 0.8, d: 0.9, mat: 'wood_dark' }); }
      if (opts.bed) { P({ x: w / 2 - 1.1, z: -d / 2 + 1.3, w: 1.0, h: 0.5, d: 2.0, mat: 'bed' }); this.use('bed', o, w / 2 - 1.1, -d / 2 + 1.3, { bed: opts.bed }); }
      o.burn = null;
    }
    logHouse(o, opts = {}) {
      this.house(o, Object.assign({ mat: 'log', roof: 'moss', w: 6.5, d: 5.5, h: 2.8, roofH: 2.4 }, opts));
    }
    treehouse(o, opts = {}) {
      const H = opts.hgt || 4.2, w = 7;
      o.burn = opts.burn || null;
      const P = (p) => this.part(o, p);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P({ s: 'cyl', x: sx * (w / 2 - 0.4), z: sz * (w / 2 - 0.4), w: 0.45, h: H, d: 0.45, mat: 'log' });
      P({ x: 0, z: 0, y: H, w, h: 0.3, d: w, mat: 'plank' });
      const hw = 4.2, hd = 3.6, hh = 2.6, t = 0.3, Y = H + 0.3;
      P({ x: 0, z: -hd / 2, y: Y, w: hw, h: hh, d: t, mat: 'log' });
      P({ x: -hw / 2, z: 0, y: Y, w: t, h: hh, d: hd, mat: 'log' });
      P({ x: hw / 2, z: 0, y: Y, w: t, h: hh, d: hd, mat: 'log' });
      P({ x: -hw / 2 + 0.75, z: hd / 2, y: Y, w: 1.5, h: hh, d: t, mat: 'log' });
      P({ x: hw / 2 - 0.75, z: hd / 2, y: Y, w: 1.5, h: hh, d: t, mat: 'log' });
      P({ s: 'prism', x: 0, z: 0, y: Y + hh, w: hw + 0.8, h: 1.8, d: hd + 0.8, mat: 'moss', solid: false });
      P({ x: 0, z: w / 2 - 0.1, y: H + 0.3, w: 1.2, h: 0.9, d: 0.1, mat: 'log', solid: false });
      P({ s: 'ramp', x: w / 2 + 3.5, z: 1.2, y: 0, w: 1.4, h: H + 0.3, d: 9, rot: Math.PI / 2, mat: 'plank' });
      o.burn = null;
    }
    stall(o, cloth) {
      const P = (p) => this.part(o, p);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P({ x: sx * 1.6, z: sz * 1.1, w: 0.15, h: 2.5, d: 0.15, mat: 'wood_dark', solid: false });
      P({ x: 0, z: 0.9, w: 3.2, h: 0.95, d: 0.6, mat: 'plank' });
      P({ s: 'prism', x: 0, z: 0, y: 2.5, w: 3.6, h: 0.6, d: 2.6, mat: cloth || 'cloth_red', solid: false });
    }
    tower(o, w, h, mat, crenel) {
      const P = (p) => this.part(o, p);
      P({ x: 0, z: 0, w, h, d: w, mat });
      if (crenel) for (let i = 0; i < 4; i++) for (let k = -1; k <= 1; k += 2) {
        const a = i * Math.PI / 2, ox = Math.cos(a) * (w / 2 - 0.3), oz = Math.sin(a) * (w / 2 - 0.3);
        const tx = -Math.sin(a) * k * w / 4, tz = Math.cos(a) * k * w / 4;
        P({ x: ox + tx, z: oz + tz, y: h, w: 0.8, h: 0.9, d: 0.8, mat, solid: false });
      }
    }
    tent(o, mat, burn) {
      o.burn = burn || null;
      this.part(o, { s: 'prism', x: 0, z: 0, w: 4.2, h: 2.6, d: 5, mat: mat || 'canvas', solid: false });
      this.part(o, { x: 0, z: 0, w: 3.4, h: 1.2, d: 4.6, mat: mat || 'canvas', dec: true });
      o.burn = null;
    }
    fence(o, pts, mat) {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, z1] = pts[i], [x2, z2] = pts[i + 1];
        this.wallLine(o, x1, z1, x2, z2, 0.12, 1.1, mat || 'fence');
      }
    }

    buildTown() {
      const T = PLACES.town, y = T.h, at = (dx, dz, rot) => ({ x: T.x + dx, z: T.z + dz, rot: rot || 0, y });
      this.part(at(0, 0), { s: 'cyl', w: 2.4, h: 0.9, d: 2.4, mat: 'stone' });
      this.part(at(0, 0), { x: -1, y: 0.9, w: 0.15, h: 1.8, d: 0.15, mat: 'wood_dark', solid: false });
      this.part(at(0, 0), { x: 1, y: 0.9, w: 0.15, h: 1.8, d: 0.15, mat: 'wood_dark', solid: false });
      this.part(at(0, 0), { s: 'prism', y: 2.7, w: 2.6, h: 0.8, d: 1.6, mat: 'shingle', solid: false });
      this.use('well', at(0, 0), 0, 1.6);
      this.stall(at(-9, -8, 0.1), 'cloth_red'); this.stall(at(-2, -11), 'cloth_green'); this.stall(at(6, -10, -0.15), 'cloth_blue');
      this.spot('stall1', at(-9, -8, 0.1), 0, 2.2, Math.PI); this.spot('stall2', at(-2, -11), 0, 2.2, Math.PI); this.spot('stall3', at(6, -10, -0.15), 0, 2.2, Math.PI);
      const shops = [
        ['healer', -24, -22, 0.4, { w: 6, d: 5, mat: 'plaster', roof: 'thatch', chimney: true }],
        ['pros', 22, -24, -0.35, { w: 8, d: 6, mat: 'plank', roof: 'shingle', table: true }],
        ['smith', 30, 8, Math.PI / 2, { w: 8, d: 6, mat: 'stone', roof: 'shingle', chimney: true }],
        ['store', -28, 6, -Math.PI / 2, { w: 7, d: 6, mat: 'plaster', roof: 'shingle' }],
        ['inn', 4, 26, Math.PI, { w: 13, d: 9, h: 4, mat: 'plank', roof: 'shingle', chimney: true, table: true }],
        ['headman', -14, 30, Math.PI + 0.3, { w: 8, d: 6, mat: 'plaster', roof: 'shingle', table: true }]
      ];
      for (const [id, dx, dz, rot, opts] of shops) {
        const o = at(dx, dz, rot);
        this.house(o, opts);
        this.spot('shop_' + id, o, 0, -0.6, 0);
        this.spot('door_' + id, o, 0, (opts.d || 6) / 2 + 1.6, 0);
        this.signs.push({ id, o, d: (opts.d || 6) });
      }
      this.part(at(30, 8, Math.PI / 2), { x: 0, z: 5, w: 1.0, h: 0.8, d: 0.5, mat: 'iron' });
      this.spot('inn_room', at(4, 26, Math.PI), 4, -2, 0);
      this.use('bed', at(4, 26, Math.PI), 5, -2.5, { bed: 'inn' });
      const sale = at(-40, -30, -0.93);
      this.house(sale, { w: 7, d: 6, mat: 'plank', roof: 'thatch', bed: 'house', table: true });
      this.spot('house_sale', sale, 0, 0, 0);
      this.container('house_chest', sale, -2.4, -1.8, 'Сундук в вашем доме', [], 0, 'player');
      const homes = [[36, -42, 0.3], [-46, 14, 1.2], [44, 34, -0.9], [-34, 46, 2.6], [14, -46, 0.1], [52, -12, -1.4], [-54, -6, 1.6], [26, 52, 3.0], [-4, 54, 3.3], [58, 22, -1.1]];
      homes.forEach(([dx, dz, rot], i) => {
        const face = Math.atan2(dx, -dz) + rot * 0.12;
        this.house(at(dx, dz, face), { w: 6 + (i % 3), d: 5 + (i % 2), mat: i % 2 ? 'plaster' : 'plank', roof: i % 3 ? 'thatch' : 'shingle', chimney: i % 2 === 0 });
        this.spot('home' + i, at(dx, dz, face), 0, 4.5, 0);
      });
      this.fence(at(0, 0), [[60, 40], [80, 46], [84, 70], [64, 76], [56, 58]]);
      this.spot('cowpen', at(70, 58), 0, 0);
      for (let i = 0; i < 5; i++) this.part(at(-60 - i * 4, 50 + (i % 2) * 3, i), { s: 'cyl', w: 2.6, h: 2.2, d: 2.6, mat: 'straw' });
      this.spot('militia_post', at(-10, -36), 0, 0, Math.PI);
      this.spot('town_square', at(0, -2), 0, 0);
      this.part(at(-12, -36, 0.0), { x: 0, z: 0, w: 2.4, h: 2.6, d: 2.4, mat: 'plank' });
      this.part(at(-12, -36, 0.0), { s: 'prism', y: 2.6, w: 3, h: 1.2, d: 3, mat: 'thatch', solid: false });
      this.routes.town = [[0, -20], [-20, -10], [-30, 15], [0, 40], [30, 30], [40, 0], [20, -30]].map(([a, b]) => [T.x + a, T.z + b]);
    }

    buildPalace() {
      const P0 = PLACES.palace, y = P0.h, at = (dx, dz, rot) => ({ x: P0.x + dx, z: P0.z + dz, rot: rot || 0, y });
      const W = 56, D = 46, t = 2.6, h = 7, g = 6;
      const o = at(0, 0);
      this.wallLine(o, -W, -D, W, -D, t, h, 'stone');
      this.wallLine(o, -W, -D, -W, D, t, h, 'stone');
      this.wallLine(o, W, -D, W, D, t, h, 'stone');
      this.wallLine(o, -W, D, -g / 2, D, t, h, 'stone');
      this.wallLine(o, g / 2, D, W, D, t, h, 'stone');
      this.wallLine(o, -g / 2, D, g / 2, D, t, 2.2, 'stone', { dy: h - 2.2 });
      this.wallLine(o, -g / 2, D, g / 2, D, 0.6, h - 2.2, 'gate', { gate: 'palace_gate' });
      this.gates.palace_gate = { id: 'palace_gate', hp: 480, max: 480, closed: false, name: 'Ворота дворца' };
      const cren = (x1, z1, x2, z2) => {
        const l = Math.hypot(x2 - x1, z2 - z1), n = Math.floor(l / 2.2);
        for (let i = 0; i <= n; i++) {
          const k = i / n, x = lerp(x1, x2, k), z = lerp(z1, z2, k), nx = -(z2 - z1) / l, nz = (x2 - x1) / l;
          this.part(o, { x: x + nx * (t / 2 - 0.25), z: z + nz * (t / 2 - 0.25), y: h, w: 0.8, h: 0.9, d: 0.5, rot: Math.atan2(z2 - z1, x2 - x1), mat: 'stone', solid: false });
        }
      };
      cren(-W, -D, W, -D); cren(-W, D, -W, -D); cren(W, -D, W, D); cren(W, D, g / 2 + 1, D); cren(-g / 2 - 1, D, -W, D);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this.tower(at(sx * W, sz * D), 7, 11, 'stone', true);
      this.tower(at(-g / 2 - 2.5, D + 0.5), 4.5, 9.5, 'stone', true);
      this.tower(at(g / 2 + 2.5, D + 0.5), 4.5, 9.5, 'stone', true);
      this.part(o, { s: 'ramp', x: -W + 12, z: D - t / 2 - 1.2, w: 2.4, h: h, d: 14, rot: -Math.PI / 2, mat: 'stone' });
      this.part(o, { s: 'ramp', x: W - 12, z: D - t / 2 - 1.2, w: 2.4, h: h, d: 14, rot: Math.PI / 2, mat: 'stone' });
      this.part(o, { s: 'ramp', x: -W + t / 2 + 1.2, z: -D + 14, w: 2.4, h: h, d: 14, rot: Math.PI, mat: 'stone' });
      const kw = 28, kd = 20, kh = 9, kz = -D + kd / 2 + 6, kt = 0.8;
      const keep = at(0, kz);
      this.part(keep, { x: 0, z: -kd / 2, w: kw, h: kh, d: kt, mat: 'stone_light' });
      this.part(keep, { x: -kw / 2, z: 0, w: kt, h: kh, d: kd, mat: 'stone_light' });
      this.part(keep, { x: kw / 2, z: 0, w: kt, h: kh, d: kd, mat: 'stone_light' });
      this.part(keep, { x: -kw / 4 - 1, z: kd / 2, w: kw / 2 - 2, h: kh, d: kt, mat: 'stone_light' });
      this.part(keep, { x: kw / 4 + 1, z: kd / 2, w: kw / 2 - 2, h: kh, d: kt, mat: 'stone_light' });
      this.part(keep, { x: 0, z: kd / 2, y: 4.2, w: 4, h: kh - 4.2, d: kt, mat: 'stone_light' });
      this.part(keep, { s: 'prism', x: 0, z: 0, y: kh, w: kw + 1, h: 5, d: kd + 1, mat: 'roof_red', solid: false });
      this.part(keep, { x: 0, z: 0, y: kh - 0.1, w: kw - 1, h: 0.1, d: kd - 1, mat: 'plank', solid: false, dec: true });
      this.part(keep, { x: 0, z: 0, y: 0.01, w: kw - 1, h: 0.04, d: kd - 1, mat: 'stone_light', solid: false, dec: true });
      for (let i = -2; i <= 2; i++) if (i) { this.part(keep, { s: 'cyl', x: i * 4.5, z: 2, w: 0.9, h: kh, d: 0.9, mat: 'stone_light' }); }
      this.part(keep, { x: 0, z: -kd / 2 + 3, w: 8, h: 0.5, d: 4, mat: 'carpet' });
      this.part(keep, { x: 0, z: -kd / 2 + 2.5, y: 0.5, w: 1.6, h: 2.6, d: 1.0, mat: 'gold' });
      this.part(keep, { x: 0, z: 0, y: 0.02, w: 2.4, h: 0.04, d: kd - 4, mat: 'carpet', solid: false, dec: true });
      for (const sx of [-1, 1]) this.part(keep, { x: sx * 5, z: -kd / 2 + 0.5, y: 3, w: 1.6, h: 4, d: 0.1, mat: 'cloth_red', solid: false });
      this.spot('throne', keep, 0, -kd / 2 + 3.6, 0, y + 0.5);
      this.spot('keep_door', keep, 0, kd / 2 + 2, Math.PI);
      this.spot('keep_inside', keep, 0, 2, Math.PI);
      for (let i = 0; i < 4; i++) this.spot('throne_guard' + i, keep, (i < 2 ? -1 : 1) * (3 + (i % 2) * 3), -kd / 2 + 6 + (i % 2) * 4, 0);
      const bar = at(-W + 9, 6, -Math.PI / 2);
      this.house(bar, { w: 22, d: 9, h: 3.6, mat: 'stone', roof: 'roof_red', table: true });
      for (let i = 0; i < 4; i++) { this.part(bar, { x: -8 + i * 4, z: -3, w: 1.0, h: 0.5, d: 2, mat: 'bed' }); this.use('bed', bar, -8 + i * 4, -3, { bed: 'barracks' }); }
      this.container('barracks_chest', bar, 8.5, -3, 'Сундук в казарме', [['arrows', 20], ['bandage', 2], ['rota', 1]], 25, 'emp');
      this.spot('barracks_in', bar, 0, 0, 0);
      this.spot('barracks_door', bar, 0, 6.5, 0);
      const qm = at(W - 10, 8, Math.PI / 2);
      this.house(qm, { w: 10, d: 7, h: 3.4, mat: 'stone', roof: 'roof_red' });
      this.spot('shop_quarter', qm, 0, -0.5, 0);
      this.signs.push({ id: 'quarter', o: qm, d: 7 });
      const st = at(0, 18);
      this.part(st, { x: 0, z: 0, w: 2.6, h: 0.5, d: 1.6, mat: 'stone' });
      this.part(st, { x: 0, z: 0, y: 0.5, w: 2.0, h: 3.2, d: 0.5, mat: 'chronicle' });
      this.use('chronicle', st, 0, 1.4);
      this.spot('commander', at(-14, 20, Math.PI), 0, 0, 0);
      this.spot('medic_emp', at(14, 28), 0, 0, Math.PI);
      this.spot('gate_post', at(4.5, D + 4.5), 0, 0, 0);
      this.spot('gate_post2', at(-4.5, D + 4.5), 0, 0, 0);
      this.spot('gate_in', at(0, D - 6), 0, 0, 0);
      this.spot('gate_out', at(0, D + 14), 0, 0, Math.PI);
      this.spot('palace_yard', at(0, 20), 0, 0, 0);
      this.spot('raid_muster', at(0, D + 22), 0, 0, 0);
      for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) this.container('palace_supply' + (sx + 1) + (sz + 1), at(W - 6 + sx * 1.4, -D + 6 + sz, 0), 0, 0, 'Ящик с припасами', [['grain', 1]], 0, 'emp');
      this.spot('supply_depot', at(W - 10, -D + 10), 0, 0, 0);
      const ww = [];
      for (const [x, z] of [[-W + 3, D - 0.2], [-W + 0.2, -D + 3], [W - 0.2, -D + 3], [W - 0.2, D - 0.2], [g / 2 + 4, D - 0.2]]) ww.push([P0.x + x, P0.z + z]);
      this.routes.wall = ww;
      this.routes.wallY = y + h;
      this.routes.yard = [[-30, 10], [30, 10], [30, 30], [-30, 30]].map(([a, b]) => [P0.x + a, P0.z + b]);
      for (const [sx, sz] of [[-1, 1], [1, 1]]) {
        const p = at(sx * 20, 34);
        this.part(p, { s: 'cyl', w: 0.2, h: 7, d: 0.2, mat: 'wood_dark', solid: false });
        this.part(p, { x: sx * 0.9, y: 4.6, w: 1.6, h: 2.2, d: 0.05, mat: 'cloth_red', solid: false });
      }
      const post = PLACES.ford, po = { x: post.x, z: post.z, rot: 0.6, y: post.h };
      this.house(po, { w: 6, d: 5, mat: 'stone', roof: 'roof_red' });
      this.spot('ford_post', po, 0, 5, 0);
      this.part({ x: post.x, z: post.z, rot: 0.6, y: post.h }, { x: 6, z: 3, w: 2.4, h: 6, d: 2.4, mat: 'stone' });
    }

    buildVillage() {
      const V = PLACES.village, y = V.h, at = (dx, dz, rot) => ({ x: V.x + dx, z: V.z + dz, rot: rot || 0, y });
      const oak = at(0, 0);
      this.part(oak, { s: 'cyl', w: 3.2, h: 12, d: 3.2, mat: 'bark' });
      this.part(oak, { s: 'sphere', y: 9, w: 20, h: 11, d: 20, mat: 'leaves_big', solid: false });
      this.part(oak, { s: 'sphere', x: 6, y: 9, w: 11, h: 7, d: 11, mat: 'leaves_big', solid: false });
      this.part(oak, { s: 'sphere', x: -6, z: 4, y: 9.5, w: 12, h: 7, d: 12, mat: 'leaves_big', solid: false });
      this.part(oak, { x: 0, y: 7, w: 9, h: 0.3, d: 9, mat: 'plank', solid: true });
      this.part(oak, { s: 'ramp', x: 5.3, z: 3, w: 1.4, h: 7.3, d: 14, rot: Math.PI, mat: 'plank' });
      this.spot('elder', oak, 0, 4.2, 0);
      this.spot('elder_platform', oak, -2, -2, 0, y + 7.3);
      this.spot('village_center', oak, 0, 9, 0);
      const houses = [
        ['lh1', -18, -12, 0.6, 'log'], ['lh2', 16, -16, -0.7, 'log'], ['lh3', -22, 14, 2.2, 'log'], ['lh4', 20, 18, -2.4, 'log'],
        ['th1', -32, -2, 1.5, 'tree'], ['th2', 2, -30, 0.1, 'tree'], ['th3', 34, 2, -1.6, 'tree'], ['th4', -6, 32, 3.1, 'tree'], ['lh5', 36, -28, -0.9, 'log'], ['lh6', -38, 26, 2.5, 'log']
      ];
      this.villageHouses = [];
      for (const [id, dx, dz, rot, kind] of houses) {
        const o = at(dx, dz, Math.atan2(dx, -dz) + rot * 0.1), burn = 'elf_' + id;
        this.burn[burn] = { id: burn, state: 'ok', t: 0, name: kind === 'tree' ? 'дом на сваях' : 'бревенчатый дом', x: o.x, z: o.z };
        if (kind === 'tree') this.treehouse(o, { burn }); else this.logHouse(o, { burn, bed: id === 'lh1' ? 'elfhome' : null });
        this.villageHouses.push(burn);
        this.spot('vh_' + id, o, 0, 5, 0);
      }
      const herb = at(-12, 22, 2.8);
      this.part(herb, { s: 'prism', w: 4, h: 2.4, d: 4, mat: 'moss', solid: false });
      this.part(herb, { x: 0, z: -1.2, w: 2.6, h: 0.9, d: 0.8, mat: 'wood_dark' });
      this.spot('shop_herbs', herb, 0, -0.2, Math.PI);
      const bow = at(14, -2, -1.5);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this.part(bow, { x: sx * 2, z: sz * 1.5, w: 0.2, h: 2.6, d: 0.2, mat: 'log', solid: false });
      this.part(bow, { s: 'prism', y: 2.6, w: 4.6, h: 0.8, d: 3.6, mat: 'moss', solid: false });
      this.part(bow, { x: 0, z: -1.2, w: 3, h: 0.9, d: 0.6, mat: 'plank' });
      this.spot('shop_bowyer', bow, 0, 0, Math.PI);
      const carv = at(-4, -18, 0.2);
      this.logHouse(carv, { w: 6, d: 5, burn: null });
      this.spot('shop_carver', carv, 0, -0.5, 0);
      for (let i = 0; i < 3; i++) {
        const tg = at(-6 + i * 5, 48, Math.PI);
        this.part(tg, { s: 'cyl', y: 0.2, w: 1.4, h: 0.25, d: 1.4, rot: 0, mat: 'target', solid: false });
        this.part(tg, { x: 0, z: 0.2, w: 0.15, h: 1.4, d: 0.15, mat: 'log', solid: false });
      }
      this.spot('archery', at(0, 30), 0, 0, 0);
      this.part(at(8, 10), { s: 'cyl', w: 1.6, h: 0.3, d: 1.6, mat: 'stone', solid: false });
      this.use('fire', at(8, 10), 0, 0);
      this.container('elf_stash', at(-18, -12, 0.6), 1.5, -1.4, 'Сундук в доме', [['herbs', 3], ['arrows', 20]], 15, 'elf');
      this.spot('village_east', at(46, 2), 0, 0, 0);
      this.spot('village_north', at(4, -44), 0, 0, 0);
      this.routes.village = [[-26, -24], [26, -24], [36, 10], [10, 38], [-30, 30], [-40, 0]].map(([a, b]) => [V.x + a, V.z + b]);
      const C = PLACES.camp, co = { x: C.x, z: C.z, rot: 0.3, y: C.h };
      this.tent(co, 'canvas_green'); this.tent({ x: C.x + 7, z: C.z + 3, rot: -0.4, y: C.h }, 'canvas_green');
      this.part({ x: C.x - 4, z: C.z + 6, rot: 0, y: C.h }, { s: 'cyl', w: 1.4, h: 0.3, d: 1.4, mat: 'stone', solid: false });
      this.use('fire', { x: C.x - 4, z: C.z + 6, rot: 0, y: C.h }, 0, 0);
      this.spot('camp', co, 0, 6, 0);
      const Tw = PLACES.tower, to = { x: Tw.x, z: Tw.z, rot: 0.4, y: Tw.h }, burn = 'elf_tower';
      this.burn[burn] = { id: burn, state: 'ok', t: 0, name: 'эльфийская вышка', x: Tw.x, z: Tw.z };
      to.burn = burn;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this.part(to, { s: 'cyl', x: sx * 1.6, z: sz * 1.6, w: 0.4, h: 9, d: 0.4, mat: 'log' });
      this.part(to, { y: 9, w: 4.2, h: 0.3, d: 4.2, mat: 'plank' });
      this.part(to, { s: 'prism', y: 10.9, w: 4.6, h: 1.4, d: 4.6, mat: 'moss', solid: false });
      this.part(to, { s: 'ramp', x: 9.1, z: 0, w: 1.2, h: 9.3, d: 15, rot: Math.PI / 2, mat: 'plank' });
      to.burn = null;
      this.spot('tower', to, -4, 0, 0);
    }

    buildFort() {
      const F = PLACES.fort, y = F.h, at = (dx, dz, rot) => ({ x: F.x + dx, z: F.z + dz, rot: rot || 0, y });
      const o = at(0, 0), W = 36, D = 30, t = 2.4, h = 6;
      this.wallLine(o, -W, -D, -6, -D, t, h, 'dark_stone');
      this.wallLine(o, 2, -D, W, -D, t, h - 1.5, 'dark_stone');
      this.wallLine(o, W, -D, W, 8, t, h, 'dark_stone');
      this.wallLine(o, W, 16, W, D, t, h - 2, 'dark_stone');
      this.wallLine(o, -W, D, W, D, t, h, 'dark_stone');
      this.wallLine(o, -W, -D, -W, -4, t, h, 'dark_stone');
      this.wallLine(o, -W, 4, -W, D, t, h, 'dark_stone');
      this.wallLine(o, -W, -4, -W, 4, t, 2, 'dark_stone', { dy: h - 2 });
      this.wallLine(o, -W, -4, -W, 4, 0.6, h - 2, 'gate', { gate: 'fort_gate' });
      this.gates.fort_gate = { id: 'fort_gate', hp: 380, max: 380, closed: false, name: 'Ворота форта' };
      for (const [sx, sz, hh] of [[-1, -1, 10], [1, -1, 6], [-1, 1, 10], [1, 1, 10]]) this.tower(at(sx * W, sz * D), 6.5, hh, 'dark_stone', hh > 7);
      this.tower(at(-W - 0.5, -7), 4, 9, 'dark_stone', true);
      this.tower(at(-W - 0.5, 7), 4, 9, 'dark_stone', true);
      for (let i = 0; i < 9; i++) this.part(at(-4 + (i % 3) * 1.5, -D + 1.5 * Math.floor(i / 3) - 1.5, i), { w: 1.4, h: 0.6 + (i % 2) * 0.4, d: 1.1, mat: 'dark_stone' });
      this.part(o, { s: 'ramp', x: -W + t / 2 + 1.2, z: D - 10, w: 2.4, h, d: 12, rot: 0, mat: 'dark_stone' });
      this.part(o, { s: 'ramp', x: 10, z: D - t / 2 - 1.2, w: 2.4, h, d: 12, rot: -Math.PI / 2, mat: 'dark_stone' });
      const keep = at(18, -6, Math.PI / 2);
      this.house(keep, { w: 16, d: 12, h: 6, mat: 'dark_stone', roof: 'roof_black', door: 2.6 });
      this.part(keep, { x: 0, z: -2, w: 4, h: 0.9, d: 2.2, mat: 'wood_dark' });
      this.part(keep, { x: 0, z: -2, y: 0.9, w: 3.2, h: 0.04, d: 1.8, mat: 'map', solid: false });
      this.use('wartable', keep, 0, 0);
      this.spot('wartable', keep, 0, 0.4, Math.PI);
      this.spot('villain', keep, 2.5, 1.5, 0);
      this.spot('keep_fort_door', keep, 0, 8, 0);
      this.part(keep, { x: 0, z: -5.4, y: 0, w: 2, h: 2.4, d: 1, mat: 'throne_black' });
      for (let i = 0; i < 3; i++) {
        const id = 'fort_tent' + i, to = at(-14 + i * 9, 18, Math.PI + (i - 1) * 0.2);
        this.burn[id] = { id, state: 'ok', t: 0, name: 'палатка с припасами', x: to.x, z: to.z };
        this.tent(to, 'canvas', id);
        this.container('fort_supply' + i, to, 0, 0, 'Припасы форта', [['grain', 2], ['nails', 1]], 0, 'evil');
      }
      for (let i = 0; i < 4; i++) { const to = at(-20 + i * 7, -14, 0.1 * i); this.tent(to, 'canvas_black'); this.use('bed', to, 0, 0, { bed: 'fort' }); }
      const smithy = at(-18, -24, 0);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this.part(smithy, { x: sx * 2.6, z: sz * 1.8, w: 0.3, h: 3, d: 0.3, mat: 'wood_dark', solid: false });
      this.part(smithy, { s: 'prism', y: 3, w: 6, h: 1, d: 4.4, mat: 'roof_black', solid: false });
      this.part(smithy, { x: 1.2, z: 0, w: 1, h: 0.8, d: 0.5, mat: 'iron' });
      this.part(smithy, { x: -1.6, z: -0.8, w: 1.4, h: 1.1, d: 1.4, mat: 'stone' });
      this.use('fire', smithy, -1.6, -0.8, { ly: 1.1 });
      this.spot('shop_forge', smithy, 0, 1.2, Math.PI);
      const board = at(-6, 6, -Math.PI / 2);
      this.part(board, { x: 0, z: 0, w: 2.4, h: 1.6, d: 0.15, y: 0.8, mat: 'board' });
      this.part(board, { x: -1, z: 0, w: 0.15, h: 2.4, d: 0.15, mat: 'wood_dark', solid: false });
      this.part(board, { x: 1, z: 0, w: 0.15, h: 2.4, d: 0.15, mat: 'wood_dark', solid: false });
      this.spot('shop_recruit', board, 0, 1.6, Math.PI);
      this.spot('shop_horsedoc', at(10, 20), 0, 0, Math.PI);
      this.spot('fort_yard', at(0, 4), 0, 0, 0);
      this.spot('fort_gate_in', at(-W + 6, 0), 0, 0, -Math.PI / 2);
      this.spot('fort_gate_out', at(-W - 14, 0), 0, 0, Math.PI / 2);
      this.spot('fort_muster', at(-W - 22, 4), 0, 0, -Math.PI / 2);
      this.routes.fort = [[-20, -4], [0, -20], [24, -20], [24, 20], [0, 24], [-24, 18]].map(([a, b]) => [F.x + a, F.z + b]);
      this.routes.fortWall = [[-W + 0.2, D - 0.2], [W - 0.2, D - 0.2]].map(([a, b]) => [F.x + a, F.z + b]);
      this.routes.fortWallY = y + h;
      for (let i = 0; i < 6; i++) this.part(at(-30 + i * 11, -8 + (i % 2) * 22, i), { s: 'cyl', w: 0.9, h: 1.1, d: 0.9, mat: 'barrel' });
      const L = PLACES.lookout;
      this.part({ x: L.x, z: L.z, rot: 0, y: L.h }, { x: 0, z: 0, w: 3, h: 1.0, d: 2, mat: 'rock', solid: true });
      this.spot('lookout', { x: L.x, z: L.z, rot: 0, y: L.h }, 0, 2.5, 0);
      const fm = PLACES.farm, fo = { x: fm.x, z: fm.z, rot: 0.3, y: fm.h };
      this.house(fo, { w: 8, d: 6, mat: 'plank', roof: 'thatch', chimney: true, table: true });
      this.house({ x: fm.x + 12, z: fm.z + 6, rot: -0.4, y: fm.h }, { w: 10, d: 7, h: 3.6, mat: 'plank', roof: 'thatch', door: 3 });
      this.fence({ x: fm.x, z: fm.z, rot: 0, y: fm.h }, [[-20, -14], [20, -16], [22, 18], [-18, 20], [-20, -14]]);
      this.spot('farm', fo, 0, 6, 0);
    }

    buildAll() {
      this.buildTown();
      this.buildPalace();
      this.buildVillage();
      this.buildFort();
    }

    buildColliderGrid() {
      this.cgrid = new Map();
      this.colliders.forEach((c, i) => {
        const r = c.t === 'cyl' ? c.r : Math.hypot(c.hw, c.hd);
        c.br = r;
        const x0 = Math.floor((c.x - r + HALF) / 16), x1 = Math.floor((c.x + r + HALF) / 16), z0 = Math.floor((c.z - r + HALF) / 16), z1 = Math.floor((c.z + r + HALF) / 16);
        for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) { const k = a * 1000 + b; let l = this.cgrid.get(k); if (!l) this.cgrid.set(k, l = []); l.push(i); }
      });
    }
    nearColliders(x, z, r, out) {
      out.length = 0;
      const x0 = Math.floor((x - r + HALF) / 16), x1 = Math.floor((x + r + HALF) / 16), z0 = Math.floor((z - r + HALF) / 16), z1 = Math.floor((z + r + HALF) / 16);
      const seen = this._seen || (this._seen = new Set()); seen.clear();
      for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) {
        const l = this.cgrid.get(a * 1000 + b); if (!l) continue;
        for (const i of l) if (!seen.has(i)) { seen.add(i); out.push(this.colliders[i]); }
      }
      return out;
    }
    colliderOn(c) {
      if (c.gate) { const g = this.gates[c.gate]; return g && g.closed && g.hp > 0; }
      return true;
    }
    colTop(c, x, z) {
      if (c.t === 'cyl') { const dx = x - c.x, dz = z - c.z; return dx * dx + dz * dz <= c.r * c.r ? c.y1 : null; }
      const dx = x - c.x, dz = z - c.z, lx = dx * c.c + dz * c.s, lz = -dx * c.s + dz * c.c;
      if (Math.abs(lx) > c.hw || Math.abs(lz) > c.hd) return null;
      if (c.t === 'ramp') return c.y0 + (c.y1 - c.y0) * clamp((lz + c.hd) / (2 * c.hd), 0, 1);
      return c.y1;
    }
    floorAt(x, z, y, step) {
      let f = this.height(x, z);
      const list = this.nearColliders(x, z, 0.5, this._fl || (this._fl = []));
      const lim = y + (step == null ? 0.65 : step);
      for (const c of list) {
        if (c.roof || !this.colliderOn(c)) continue;
        const t = this.colTop(c, x, z);
        if (t != null && t <= lim && t > f) f = t;
      }
      return f;
    }
    groundAt(x, z) { return this.floorAt(x, z, this.height(x, z) + 0.3, 0.65); }
    ceilingAt(x, z, y) {
      let best = Infinity;
      const list = this.nearColliders(x, z, 0.5, this._cl || (this._cl = []));
      for (const c of list) {
        if (c.roof || !this.colliderOn(c)) continue;
        if (c.t === 'ramp') continue;
        const t = this.colTop(c, x, z);
        if (t != null && c.y0 > y + 0.3 && c.y0 < best) best = c.y0;
      }
      return best;
    }
    pushOut(e, r, hgt) {
      const list = this.nearColliders(e.x, e.z, r + 0.5, this._pl || (this._pl = []));
      let hit = false;
      for (const c of list) {
        if (c.roof || !this.colliderOn(c)) continue;
        if (c.y0 > e.y + hgt || c.y1 <= e.y + 0.62) {
          if (c.t !== 'ramp') continue;
        }
        if (c.t === 'cyl') {
          const dx = e.x - c.x, dz = e.z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
          if (d < m && d > 1e-6) { e.x = c.x + dx / d * m; e.z = c.z + dz / d * m; hit = true; }
          continue;
        }
        const dx = e.x - c.x, dz = e.z - c.z;
        let lx = dx * c.c + dz * c.s, lz = -dx * c.s + dz * c.c;
        if (c.t === 'ramp') {
          const top = c.y0 + (c.y1 - c.y0) * clamp((clamp(lz, -c.hd, c.hd) + c.hd) / (2 * c.hd), 0, 1);
          if (top <= e.y + 0.62 || c.y0 > e.y + hgt) continue;
          if (lz < -c.hd + 0.01 && Math.abs(lx) < c.hw) continue;
        }
        const ex = c.hw + r, ez = c.hd + r;
        if (Math.abs(lx) >= ex || Math.abs(lz) >= ez) continue;
        const px = ex - Math.abs(lx), pz = ez - Math.abs(lz);
        if (px < pz) lx = Math.sign(lx || 1) * ex; else lz = Math.sign(lz || 1) * ez;
        e.x = c.x + lx * c.c - lz * c.s; e.z = c.z + lx * c.s + lz * c.c;
        hit = true;
      }
      const tl = this.nearTrees(e.x, e.z, r + 1.2, this._tl || (this._tl = []));
      for (const i of tl) {
        const tx = this.tx[i], tz = this.tz[i], tr = this.tr[i];
        const dx = e.x - tx, dz = e.z - tz, d = Math.hypot(dx, dz), m = tr + r;
        if (e.y > this.ty[i] + this.th[i] * 0.6) continue;
        if (d < m && d > 1e-6) { e.x = tx + dx / d * m; e.z = tz + dz / d * m; hit = true; }
      }
      const lim = HALF - 12;
      if (e.x < -lim) e.x = -lim; if (e.x > lim) e.x = lim; if (e.z < -lim) e.z = -lim; if (e.z > lim) e.z = lim;
      return hit;
    }

    nearBuilding(x, z, pad) {
      const list = this.nearColliders(x, z, pad + 1, this._nb || (this._nb = []));
      for (const c of list) {
        const dx = x - c.x, dz = z - c.z;
        if (c.t === 'cyl') { if (Math.hypot(dx, dz) < c.r + pad) return true; continue; }
        const lx = dx * c.c + dz * c.s, lz = -dx * c.s + dz * c.c;
        if (Math.abs(lx) < c.hw + pad && Math.abs(lz) < c.hd + pad) return true;
      }
      if (!this.roundParts) this.roundParts = this.parts.filter(p => p.s === 'sphere' || p.s === 'prism');
      for (const p of this.roundParts) {
        if (Math.hypot(x - p.x, z - p.z) < Math.max(p.w, p.d) / 2 + pad) return true;
      }
      return false;
    }

    buildTrees() {
      const R = rng(this.seed * 7 + 3);
      const xs = [], zs = [], sp = [], sc = [];
      const tryTree = (x, z, kind) => {
        const h = this.height(x, z);
        if (h < WATER_Y + 0.8 || h > 96) return;
        if (Math.abs(x) > HALF - 8 || Math.abs(z) > HALF - 8) return;
        if (this.slope(x, z) > 0.85) return;
        const rd = this.roadDist(x, z).d; if (rd < 5.5) return;
        for (const id in PLACES) { const p = PLACES[id]; const d = Math.hypot(x - p.x, z - p.z); if (d < p.r * (id === 'village' ? 0.35 : 1) + (id === 'village' ? 0 : 6)) return; }
        if (this.inField(x, z)) return;
        if (this.nearBuilding(x, z, 2.8)) return;
        xs.push(x); zs.push(z); sp.push(kind); sc.push(0.75 + R() * 0.55);
      };
      for (let z = -HALF + 10; z < HALF - 10; z += 5) for (let x = -HALF + 10; x < HALF - 10; x += 5) {
        const jx = x + (R() - 0.5) * 4.2, jz = z + (R() - 0.5) * 4.2;
        const zn = this.zoneAt(jx, jz), h = this.height(jx, jz), n = fbm(jx / 70, jz / 70, this.seed + 41, 3);
        const v = R();
        if (zn === 'elf') {
          const clearing = fbm(jx / 35, jz / 35, this.seed + 77, 2) < 0.3;
          if (clearing && v < 0.75) continue;
          if (v > 0.9) continue;
          const pick = R();
          tryTree(jx, jz, pick < 0.3 ? 1 : pick < 0.52 ? 2 : pick < 0.8 ? 3 : 0);
        } else if (zn === 'evil') {
          if (h > 70 && v > 0.12) continue;
          if (h > 45 && v > 0.3) continue;
          if (v > 0.45 * n + 0.05) continue;
          tryTree(jx, jz, h > 60 ? 4 : R() < 0.6 ? 0 : 3);
        } else {
          const grove = n > 0.58;
          if (!grove && v > 0.012) continue;
          if (grove && v > 0.5) continue;
          tryTree(jx, jz, R() < 0.5 ? 2 : R() < 0.6 ? 1 : 0);
        }
      }
      const n = xs.length;
      this.treeCount = n;
      this.tx = new Float32Array(xs); this.tz = new Float32Array(zs); this.ts = new Float32Array(sc); this.tsp = new Uint8Array(sp);
      this.ty = new Float32Array(n); this.tr = new Float32Array(n); this.th = new Float32Array(n); this.trot = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        this.ty[i] = this.height(xs[i], zs[i]) - 0.15;
        const s = SPECIES[sp[i]];
        this.tr[i] = s.r * sc[i]; this.th[i] = s.h * sc[i]; this.trot[i] = R() * Math.PI * 2;
      }
      this.tgrid = new Map();
      for (let i = 0; i < n; i++) {
        const k = Math.floor((xs[i] + HALF) / 8) * 1000 + Math.floor((zs[i] + HALF) / 8);
        let l = this.tgrid.get(k); if (!l) this.tgrid.set(k, l = []); l.push(i);
      }
      this.tchunks = [];
      for (let i = 0; i < CHN * CHN; i++) this.tchunks.push([]);
      for (let i = 0; i < n; i++) {
        const cx = clamp(Math.floor((xs[i] + HALF) / CH), 0, CHN - 1), cz = clamp(Math.floor((zs[i] + HALF) / CH), 0, CHN - 1);
        this.tchunks[cz * CHN + cx].push(i);
      }
    }
    nearTrees(x, z, r, out) {
      out.length = 0;
      const x0 = Math.floor((x - r + HALF) / 8), x1 = Math.floor((x + r + HALF) / 8), z0 = Math.floor((z - r + HALF) / 8), z1 = Math.floor((z + r + HALF) / 8);
      const r2 = r * r;
      for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) {
        const l = this.tgrid.get(a * 1000 + b); if (!l) continue;
        for (const i of l) { const dx = this.tx[i] - x, dz = this.tz[i] - z; if (dx * dx + dz * dz <= r2) out.push(i); }
      }
      return out;
    }
    treeDensity(x, z) {
      const l = this.nearTrees(x, z, 10, this._td || (this._td = []));
      return l.length / 12;
    }

    buildNav() {
      const b = new Uint8Array(NN * NN), op = new Uint8Array(NN * NN);
      for (let j = 0; j < NN; j++) for (let i = 0; i < NN; i++) {
        const x = -HALF + (i + 0.5) * NAV, z = -HALF + (j + 0.5) * NAV;
        const h = this.height(x, z);
        if (h < WATER_Y - 0.6) b[j * NN + i] = 1;
        else {
          const hx = Math.abs(this.height(x + NAV, z) - this.height(x - NAV, z)), hz = Math.abs(this.height(x, z + NAV) - this.height(x, z - NAV));
          if (Math.max(hx, hz) > 2.6 * NAV) b[j * NN + i] = 1;
        }
        if (Math.abs(x) > HALF - 14 || Math.abs(z) > HALF - 14) b[j * NN + i] = 1;
      }
      this.navBase = b;
      this.nav = b;
      this.opaque = op;
      this.rebuildNavColliders();
      for (let i = 0; i < this.treeCount; i++) {
        const ci = Math.floor((this.tx[i] + HALF) / NAV), cj = Math.floor((this.tz[i] + HALF) / NAV);
        if (ci >= 0 && cj >= 0 && ci < NN && cj < NN && this.tr[i] > 0.38) this.navTree[cj * NN + ci] = 1;
      }
    }
    rebuildNavColliders() {
      const nc = new Uint8Array(NN * NN), op = this.opaque; op.fill(0);
      this.navTree = this.navTree || new Uint8Array(NN * NN);
      for (const c of this.colliders) {
        if (c.roof || !this.colliderOn(c)) continue;
        const r = c.br + 1;
        const i0 = Math.max(0, Math.floor((c.x - r + HALF) / NAV)), i1 = Math.min(NN - 1, Math.floor((c.x + r + HALF) / NAV));
        const j0 = Math.max(0, Math.floor((c.z - r + HALF) / NAV)), j1 = Math.min(NN - 1, Math.floor((c.z + r + HALF) / NAV));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const x = -HALF + (i + 0.5) * NAV, z = -HALF + (j + 0.5) * NAV;
          const g = this.height(x, z);
          let inside = false;
          if (c.t === 'cyl') inside = Math.hypot(x - c.x, z - c.z) < c.r + 0.45;
          else { const dx = x - c.x, dz = z - c.z, lx = dx * c.c + dz * c.s, lz = -dx * c.s + dz * c.c; inside = Math.abs(lx) < c.hw + 0.45 && Math.abs(lz) < c.hd + 0.45; }
          if (!inside) continue;
          if (c.t === 'ramp') continue;
          if (c.y1 > g + 0.7 && c.y0 < g + 1.8) nc[j * NN + i] = 1;
          if (c.y1 > g + 1.6 && c.y0 < g + 1.6) op[j * NN + i] = 1;
        }
      }
      this.navCol = nc;
      this.navEpoch = (this.navEpoch || 0) + 1;
    }
    navCell(x, z) { return [clamp(Math.floor((x + HALF) / NAV), 0, NN - 1), clamp(Math.floor((z + HALF) / NAV), 0, NN - 1)]; }
    blockedCell(i, j) { if (i < 0 || j < 0 || i >= NN || j >= NN) return true; const k = j * NN + i; return this.navBase[k] === 1 || this.navCol[k] === 1 || this.navTree[k] === 1; }
    blockedAt(x, z) { const [i, j] = this.navCell(x, z); return this.blockedCell(i, j); }
    lineClear(ax, az, bx, bz) {
      const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 1.0);
      for (let k = 1; k <= n; k++) { const t = k / n; if (this.blockedAt(ax + (bx - ax) * t, az + (bz - az) * t)) return false; }
      return true;
    }
    sightClear(ax, ay, az, bx, by, bz) {
      const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 2);
      for (let k = 1; k < n; k++) {
        const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ay + (by - ay) * t;
        const [i, j] = this.navCell(x, z);
        if (this.opaque[j * NN + i] && y < this.height(x, z) + 5) return false;
        if (this.height(x, z) > y + 0.2) return false;
      }
      return true;
    }
    findPath(ax, az, bx, bz, maxNodes) {
      const [si, sj] = this.navCell(ax, az);
      let [ei, ej] = this.navCell(bx, bz);
      if (this.blockedCell(ei, ej)) {
        let found = false;
        for (let r = 1; r < 6 && !found; r++) for (let dj = -r; dj <= r && !found; dj++) for (let di = -r; di <= r && !found; di++) if (!this.blockedCell(ei + di, ej + dj)) { ei += di; ej += dj; found = true; }
        if (!found) return null;
      }
      const lim = maxNodes || 5000;
      const key = (i, j) => j * NN + i;
      const g = new Map(), came = new Map(), open = [];
      const h = (i, j) => Math.hypot(i - ei, j - ej);
      const push = (n) => { open.push(n); let k = open.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (open[p].f <= open[k].f) break; [open[p], open[k]] = [open[k], open[p]]; k = p; } };
      const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < open.length && open[l].f < open[m].f) m = l; if (r < open.length && open[r].f < open[m].f) m = r; if (m === k) break; [open[m], open[k]] = [open[k], open[m]]; k = m; } } return top; };
      g.set(key(si, sj), 0); push({ i: si, j: sj, f: h(si, sj) });
      let n = 0, best = null, bestH = Infinity;
      while (open.length && n++ < lim) {
        const c = pop(), ck = key(c.i, c.j), cg = g.get(ck);
        const ch = h(c.i, c.j);
        if (ch < bestH) { bestH = ch; best = c; }
        if (c.i === ei && c.j === ej) { best = c; bestH = 0; break; }
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const ni = c.i + di, nj = c.j + dj;
          if (this.blockedCell(ni, nj)) continue;
          if (di && dj && (this.blockedCell(c.i + di, c.j) || this.blockedCell(c.i, c.j + dj))) continue;
          const nk = key(ni, nj), ng = cg + (di && dj ? 1.414 : 1);
          if (g.has(nk) && g.get(nk) <= ng) continue;
          g.set(nk, ng); came.set(nk, ck); push({ i: ni, j: nj, f: ng + h(ni, nj) * 1.15 });
        }
      }
      if (!best) return null;
      const out = [];
      let k = key(best.i, best.j);
      while (k != null) { const i = k % NN, j = Math.floor(k / NN); out.push([-HALF + (i + 0.5) * NAV, -HALF + (j + 0.5) * NAV]); k = came.get(k); }
      out.reverse();
      const simp = [out[0]];
      for (let i = 1; i < out.length; i++) {
        const last = simp[simp.length - 1];
        if (i + 1 < out.length && this.lineClear(last[0], last[1], out[i + 1][0], out[i + 1][1])) continue;
        simp.push(out[i]);
      }
      if (bestH === 0) simp.push([bx, bz]);
      return { pts: simp, complete: bestH === 0 };
    }

    roadRoute(from, to) {
      const adj = {};
      for (const r of ROADS) { (adj[r.a] = adj[r.a] || []).push({ to: r.b, r, fwd: true }); (adj[r.b] = adj[r.b] || []).push({ to: r.a, r, fwd: false }); }
      const dist = { [from]: 0 }, prev = {}, q = [from], done = new Set();
      while (q.length) {
        q.sort((a, b) => dist[a] - dist[b]);
        const u = q.shift(); if (done.has(u)) continue; done.add(u);
        if (u === to) break;
        for (const e of adj[u] || []) {
          const l = e.r.dense.length;
          if (dist[u] + l < (dist[e.to] == null ? Infinity : dist[e.to])) { dist[e.to] = dist[u] + l; prev[e.to] = { from: u, e }; q.push(e.to); }
        }
      }
      if (dist[to] == null) return null;
      const chain = [];
      for (let v = to; v !== from; v = prev[v].from) chain.unshift(prev[v].e);
      const pts = [];
      for (const e of chain) {
        const d = e.fwd ? e.r.dense : e.r.dense.slice().reverse();
        for (let i = pts.length ? 1 : 0; i < d.length; i += (i === 0 ? 1 : 2)) pts.push(d[i]);
        if (pts[pts.length - 1] !== d[d.length - 1]) pts.push(d[d.length - 1]);
      }
      return pts;
    }
    nearestNode(x, z) {
      let best = null, bd = Infinity;
      for (const id in NODES) { const [nx, nz] = NODES[id], d = Math.hypot(nx - x, nz - z); if (d < bd) { bd = d; best = id; } }
      return best;
    }
  }

  K.World = World;
  K.WORLD = { HALF, CELL, N, NAV, NN, CH, CHN, WATER_Y, PLACES, ROADS, NODES, SPECIES, LAKE };
})(globalThis.Korovany = globalThis.Korovany || {});
