(function (D) {
  'use strict';
  const { RNG, fbm, AREAS, THEMES, strHash } = D;

  const TER = ['void', 'grass', 'grassl', 'darkgrass', 'deadgrass', 'dirt', 'road', 'stone', 'moss', 'mud', 'water', 'ash', 'cobble', 'cavefloor', 'flag', 'tiles', 'catafloor'];
  const T = {};
  TER.forEach((n, i) => { T[n] = i; });

  const WK = { none: 0, cliff: 1, fence: 3, palisade: 4, dwall: 5, ruin: 6, water: 7, pillar: 8 };

  const BLOCKING = {
    tree: { w: 1, h: 1, fly: false }, deadtree: { w: 1, h: 1, fly: false }, rock: { w: 1, h: 1, fly: true }, bigrock: { w: 2, h: 2, fly: false },
    bush: { w: 1, h: 1, fly: true }, grave: { w: 1, h: 1, fly: true }, reed: { w: 0, h: 0 }, rubble: { w: 1, h: 1, fly: true }, cross: { w: 1, h: 1, fly: true },
    stash: { w: 1, h: 1, fly: true }, fire: { w: 1, h: 1, fly: true }, torch: { w: 1, h: 1, fly: true }, tent: { w: 3, h: 3, fly: false }, wagon: { w: 2, h: 3, fly: false },
    anvil: { w: 1, h: 1, fly: true }, forge: { w: 2, h: 2, fly: false }, crates: { w: 1, h: 1, fly: true }, cave: { w: 3, h: 3, fly: false }, tower: { w: 4, h: 4, fly: false },
    cairn: { w: 1, h: 1, fly: true }, inifuss: { w: 3, h: 3, fly: false }, cage: { w: 2, h: 2, fly: false }, tome: { w: 1, h: 1, fly: true }, malus: { w: 1, h: 1, fly: true },
    chest: { w: 1, h: 1, fly: true }, barrel: { w: 1, h: 1, fly: true }, urn: { w: 1, h: 1, fly: true }, shrine: { w: 1, h: 1, fly: true }, body: { w: 0, h: 0 },
    wp: { w: 0, h: 0 }, stairs_down: { w: 0, h: 0 }, stairs_up: { w: 0, h: 0 }, gate: { w: 0, h: 0 }, wirt: { w: 0, h: 0 }, altar: { w: 2, h: 1, fly: true },
    well: { w: 1, h: 1, fly: true }, wtorch: { w: 0, h: 0 }, bones: { w: 0, h: 0 }, throne: { w: 2, h: 2, fly: true }, banner: { w: 0, h: 0 }, exitsign: { w: 0, h: 0 }
  };

  const SHRINES = ['armor', 'combat', 'refill', 'experience', 'mana', 'skill', 'stamina', 'resist'];

  class Area {
    constructor(id, w, h, seed) {
      this.id = id; this.def = AREAS[id]; this.w = w; this.h = h; this.seed = seed;
      this.theme = THEMES[this.def.theme];
      const n = w * h;
      this.walk = new Uint8Array(n);
      this.fly = new Uint8Array(n);
      this.ter = new Uint8Array(n);
      this.wall = new Uint8Array(n);
      this.wvar = new Uint8Array(n);
      this.prot = new Uint8Array(n);
      this.seen = new Uint8Array(n);
      this.objs = [];
      this.packs = [];
      this.entries = {};
      this.exits = [];
      this.lights = [];
      this.decals = [];
      this.npcs = [];
      this.labels = [];
      this.dungeon = false;
      this.objSeq = 1;
      this.objCell = new Int32Array(n);
    }
    i(x, y) { return y * this.w + x; }
    in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    open(x, y, ter) {
      if (!this.in(x, y)) return;
      const i = this.i(x, y);
      this.walk[i] = 1; this.fly[i] = 1; this.wall[i] = 0;
      if (ter !== undefined) this.ter[i] = ter;
    }
    block(x, y, kind, fly) {
      if (!this.in(x, y)) return;
      const i = this.i(x, y);
      this.walk[i] = 0; this.fly[i] = fly ? 1 : 0; this.wall[i] = kind || 0;
    }
    isOpen(x, y) { return this.in(x, y) && this.walk[this.i(x, y)] === 1; }
    addObj(type, x, y, o) {
      const ob = Object.assign({ id: this.objSeq++, type, x, y }, o || {});
      const f = BLOCKING[type];
      if (f && f.w > 0) {
        const x0 = Math.floor(x - f.w / 2 + 0.01), y0 = Math.floor(y - f.h / 2 + 0.01);
        ob.cells = [];
        for (let yy = y0; yy < y0 + f.h; yy++) for (let xx = x0; xx < x0 + f.w; xx++) {
          if (!this.in(xx, yy)) continue;
          const i = this.i(xx, yy);
          this.walk[i] = 0;
          if (!f.fly) this.fly[i] = 0;
          this.objCell[i] = ob.id;
          ob.cells.push(i);
        }
      }
      this.objs.push(ob);
      return ob;
    }
    footprintFree(type, x, y) {
      const f = BLOCKING[type];
      if (!f || f.w === 0) return this.isOpen(Math.floor(x), Math.floor(y)) && !this.prot[this.i(Math.floor(x), Math.floor(y))];
      const x0 = Math.floor(x - f.w / 2 + 0.01), y0 = Math.floor(y - f.h / 2 + 0.01);
      for (let yy = y0 - 1; yy < y0 + f.h + 1; yy++) for (let xx = x0 - 1; xx < x0 + f.w + 1; xx++) {
        if (!this.in(xx, yy)) return false;
        const i = this.i(xx, yy);
        if (this.prot[i]) return false;
        const inner = xx >= x0 && xx < x0 + f.w && yy >= y0 && yy < y0 + f.h;
        if (inner && this.walk[i] !== 1) return false;
      }
      return true;
    }
    removeObj(ob) {
      const k = this.objs.indexOf(ob);
      if (k >= 0) this.objs.splice(k, 1);
      for (const c of ob.cells || []) { this.walk[c] = 1; this.fly[c] = 1; this.objCell[c] = 0; }
    }
    protect(x, y, r) {
      for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) {
        if (this.in(xx, yy) && Math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= r) this.prot[this.i(xx, yy)] = 1;
      }
    }
  }

  function edgePoint(area, side, p) {
    const { w, h } = area;
    if (side === 'n') return { x: Math.floor(w * p), y: 0, dx: 0, dy: 1 };
    if (side === 's') return { x: Math.floor(w * p), y: h - 1, dx: 0, dy: -1 };
    if (side === 'w') return { x: 0, y: Math.floor(h * p), dx: 1, dy: 0 };
    return { x: w - 1, y: Math.floor(h * p), dx: -1, dy: 0 };
  }

  function carveCorridor(area, x0, y0, x1, y1, width, ter, rng) {
    const pts = [];
    const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6));
    const ox = -(y1 - y0), oy = x1 - x0, ol = Math.hypot(ox, oy) || 1;
    pts.push([x0, y0]);
    for (let i = 1; i < n; i++) {
      const t = i / n, j = rng ? rng.range(-3, 3) : 0;
      pts.push([x0 + (x1 - x0) * t + ox / ol * j, y0 + (y1 - y0) * t + oy / ol * j]);
    }
    pts.push([x1, y1]);
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
      const d = Math.hypot(bx - ax, by - ay), m = Math.max(1, Math.ceil(d * 2));
      for (let i = 0; i <= m; i++) {
        const x = ax + (bx - ax) * i / m, y = ay + (by - ay) * i / m;
        const r = width / 2;
        for (let yy = Math.floor(y - r); yy <= Math.floor(y + r); yy++) for (let xx = Math.floor(x - r); xx <= Math.floor(x + r); xx++) {
          if (!area.in(xx, yy)) continue;
          if (Math.hypot(xx + 0.5 - x, yy + 0.5 - y) > r + 0.3) continue;
          const idx = area.i(xx, yy);
          if (area.border && area.border[idx] && !area.allowBorder) continue;
          area.open(xx, yy, ter !== undefined ? ter : area.ter[idx]);
          area.prot[idx] = 1;
        }
      }
    }
  }

  const SOFT = ['tree', 'deadtree', 'rock', 'bigrock', 'bush', 'grave', 'rubble'];

  function carvePath(area, a, b, width, ter, fix, rng) {
    const { w, h } = area;
    const n = w * h;
    const g = new Float32Array(n).fill(1e9);
    const from = new Int32Array(n).fill(-1);
    const heap = new D.Heap();
    const sx = Math.floor(a.x), sy = Math.floor(a.y), tx = Math.floor(b.x), ty = Math.floor(b.y);
    if (!area.in(sx, sy) || !area.in(tx, ty)) return false;
    const objAt = i => area.objs.find(o => o.id === area.objCell[i]);
    const pass = (x, y) => {
      if (!area.in(x, y)) return false;
      const i = area.i(x, y);
      if (area.border && area.border[i] && !area.allowBorder) return false;
      if (area.objCell[i]) { const ob = objAt(i); if (!(fix && ob && SOFT.includes(ob.type))) return false; }
      if (!fix && area.walk[i] !== 1) return false;
      return true;
    };
    const s = sy * w + sx, t = ty * w + tx;
    g[s] = 0;
    heap.push(0, s);
    let found = false, guard = 0;
    while (heap.size && guard++ < n * 4) {
      const c = heap.pop();
      if (c === t) { found = true; break; }
      const cx = c % w, cy = (c / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (!(nx === tx && ny === ty) && !pass(nx, ny)) continue;
        const ni = ny * w + nx;
        const cost = 1 + (rng ? D.hash2(nx, ny, area.seed + 77) * 2.5 : 0) + (fix && area.walk[ni] !== 1 ? 4 : 0);
        if (g[c] + cost < g[ni]) { g[ni] = g[c] + cost; from[ni] = c; heap.push(g[ni] + Math.abs(nx - tx) + Math.abs(ny - ty), ni); }
      }
    }
    if (!found) return false;
    const r = width / 2;
    for (let c = t; c !== -1; c = from[c]) {
      const x = c % w + 0.5, y = ((c / w) | 0) + 0.5;
      for (let yy = Math.floor(y - r); yy <= Math.floor(y + r); yy++) for (let xx = Math.floor(x - r); xx <= Math.floor(x + r); xx++) {
        if (!area.in(xx, yy) || Math.hypot(xx + 0.5 - x, yy + 0.5 - y) > r + 0.2) continue;
        const i = area.i(xx, yy);
        if (area.border && area.border[i] && !area.allowBorder) continue;
        if (area.objCell[i]) {
          const ob = objAt(i);
          if (fix && ob && SOFT.includes(ob.type)) area.removeObj(ob); else continue;
        }
        if (area.walk[i] !== 1 || ter !== undefined) area.open(xx, yy, ter !== undefined ? ter : (area.ter[i] === T.water ? T.mud : area.ter[i]));
        area.prot[i] = 1;
      }
    }
    return true;
  }

  function genOutdoor(area, rng, o) {
    const th = area.theme;
    const { w, h } = area;
    const s = area.seed;
    const base = T[th.base], alt = T[th.alt];
    area.border = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = area.i(x, y);
      const n = fbm(x * 0.09, y * 0.09, s, 4);
      area.ter[i] = n < th.altAmt ? alt : base;
      const bd = Math.min(x, y, w - 1 - x, h - 1 - y);
      const t = 2 + Math.floor(fbm(x * 0.13 + 50, y * 0.13 + 50, s + 3, 3) * 5);
      if (bd < t) {
        area.border[i] = 1;
        if (th.edge === 'trees') area.block(x, y, WK.none, false);
        else if (th.edge === 'wall') area.block(x, y, bd < t - 1 ? WK.cliff : WK.fence, bd >= t - 1);
        else area.block(x, y, WK.cliff, false);
        area.wvar[i] = Math.floor(rng.next() * 8);
      } else area.open(x, y, area.ter[i]);
    }
    if (th.edge === 'trees') {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = area.i(x, y);
        if (!area.border[i]) continue;
        const bd = Math.min(x, y, w - 1 - x, h - 1 - y);
        if (bd < 1) continue;
        if ((x + y * 3) % 2 === 0 || rng.chance(0.25)) area.objs.push({ id: area.objSeq++, type: rng.chance(0.8) ? 'tree' : 'deadtree', x: x + 0.5 + rng.range(-0.2, 0.2), y: y + 0.5 + rng.range(-0.2, 0.2), deco: true, v: rng.int(0, 7) });
      }
    }
    const links = (area.def.links || []).map((l, k) => Object.assign({}, l, { p: 0.3 + 0.4 * D.hash2(k, strHash(area.id + l.to), s) }));
    const cx = w / 2 + rng.range(-w * 0.08, w * 0.08), cy = h / 2 + rng.range(-h * 0.08, h * 0.08);
    const hubs = [];
    area.allowBorder = true;
    for (const l of links) {
      const e = edgePoint(area, l.side, l.p);
      const inner = { x: e.x + e.dx * 9 + 0.5, y: e.y + e.dy * 9 + 0.5 };
      carveCorridor(area, e.x + 0.5, e.y + 0.5, inner.x, inner.y, 4.2, T[th.road] || area.ter[area.i(e.x, e.y)], null);
      const zone = [];
      for (let k = -2; k <= 2; k++) for (let d = 0; d < 2; d++) {
        const zx = e.x + (e.dx === 0 ? k : e.dx * d), zy = e.y + (e.dy === 0 ? k : e.dy * d);
        if (area.isOpen(zx, zy)) zone.push(area.i(zx, zy));
      }
      const spawn = { x: e.x + e.dx * 5 + 0.5, y: e.y + e.dy * 5 + 0.5 };
      area.exits.push({ to: l.to, side: l.side, zone, spawn, gate: !!l.gate, x: e.x + 0.5 + e.dx * 1.5, y: e.y + 0.5 + e.dy * 1.5 });
      area.entries['from:' + l.to] = spawn;
      area.labels.push({ x: e.x + 0.5 + e.dx * 3, y: e.y + 0.5 + e.dy * 3, text: AREAS[l.to].name });
      if (l.gate) area.addObj('gate', e.x + 0.5 + e.dx * 2.5, e.y + 0.5 + e.dy * 2.5, { to: l.to, side: l.side, label: AREAS[l.to].name });
      hubs.push(inner);
    }
    area.allowBorder = false;
    area.entries.start = area.entries['from:' + (o && o.from)] || (hubs[0] ? area.exits[0].spawn : { x: cx, y: cy });
    const feats = hubs.slice();
    const reqs = hubs.slice();
    const place = (minEdge, avoid) => {
      for (let tries = 0; tries < 400; tries++) {
        const x = rng.int(minEdge, w - 1 - minEdge) + 0.5, y = rng.int(minEdge, h - 1 - minEdge) + 0.5;
        if (!area.isOpen(Math.floor(x), Math.floor(y)) || area.prot[area.i(Math.floor(x), Math.floor(y))]) continue;
        let ok = true;
        for (const p of feats) if (Math.hypot(p.x - x, p.y - y) < (avoid || 16)) { ok = false; break; }
        if (ok) return { x, y };
      }
      return { x: cx + rng.range(-5, 5), y: cy + rng.range(-5, 5) };
    };
    if (area.def.wp) {
      const p = place(10, 14);
      feats.push(p);
      area.protect(p.x, p.y, 3.5);
      area.addObj('wp', p.x, p.y);
      area.entries.wp = { x: p.x + 1.5, y: p.y + 1.5 };
      reqs.push(area.entries.wp);
      area.lights.push({ x: p.x, y: p.y, r: 5, c: '#80a0ff', f: 0.1 });
    }
    for (const f of area.def.features || []) {
      if (f.type === 'cave' || f.type === 'tower') {
        const p = place(9, 18);
        feats.push(p);
        const mouth = { x: p.x + (f.type === 'tower' ? 2.8 : 2.2), y: p.y + (f.type === 'tower' ? 2.8 : 2.2) };
        area.protect(mouth.x, mouth.y, 2.2);
        const ob = area.addObj(f.type, p.x, p.y, { to: f.to, label: f.label });
        ob.mouth = mouth;
        area.entries['from:' + f.to] = { x: mouth.x + 0.8, y: mouth.y + 0.8 };
        area.labels.push({ x: mouth.x, y: mouth.y, text: f.label });
        area.lights.push({ x: mouth.x, y: mouth.y, r: 3, c: '#ff9040', f: 0.2 });
        reqs.push(mouth);
      } else if (f.type === 'cairn') {
        const p = place(12, 16);
        feats.push(p);
        area.protect(p.x, p.y, 4.5);
        const order = rng.shuffle([0, 1, 2, 3, 4]);
        for (let k = 0; k < 5; k++) {
          const a = k / 5 * Math.PI * 2 - Math.PI / 2;
          const ob = area.addObj('cairn', Math.floor(p.x + Math.cos(a) * 3.2) + 0.5, Math.floor(p.y + Math.sin(a) * 3.2) + 0.5, { rune: k });
          ob.label = 'Камень Каирна';
        }
        area.cairn = { x: p.x, y: p.y, order };
        area.labels.push({ x: p.x, y: p.y, text: f.label });
        area.suPos = { x: p.x + 6, y: p.y + 4 };
        reqs.push(p);
      } else if (f.type === 'tome') {
        const p = place(10, 12);
        feats.push(p);
        area.protect(p.x, p.y, 1.8);
        area.addObj('tome', p.x, p.y, { label: 'Заплесневелый фолиант' });
        reqs.push({ x: p.x + 1, y: p.y + 1 });
      } else if (f.type === 'inifuss') {
        const p = place(12, 18);
        feats.push(p);
        const front = { x: p.x + 2.2, y: p.y + 2.2 };
        area.protect(front.x, front.y, 2.4);
        const ob = area.addObj('inifuss', p.x, p.y, { label: 'Древо Инифус' });
        ob.front = front;
        area.labels.push({ x: front.x, y: front.y, text: f.label });
        area.suPos = { x: p.x + 4, y: p.y + 5 };
        reqs.push(front);
      } else if (f.type === 'graves') {
        const p = { x: cx + 4, y: cy + 4 };
        feats.push(p);
        area.protect(p.x - 7, p.y, 1.5);
        for (let gy = -3; gy <= 3; gy++) for (let gx = -5; gx <= 5; gx += 2) {
          const x = Math.floor(p.x + gx + (gy % 2 ? 1 : 0)) + 0.5, y = Math.floor(p.y + gy * 2) + 0.5;
          if (area.footprintFree('grave', x, y)) area.addObj('grave', x, y, { v: rng.int(0, 3) });
        }
        area.suPos = { x: p.x, y: p.y };
        reqs.push({ x: p.x - 7, y: p.y });
      }
    }
    const center = D.nearestWalkable(area, cx, cy, 8) || { x: cx, y: cy };
    for (const p of reqs) carvePath(area, p, center, 2.2, T[th.road], false, rng);
    if (th.water) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = area.i(x, y);
        if (area.walk[i] !== 1 || area.prot[i]) continue;
        if (fbm(x * 0.07 + 200, y * 0.07 + 200, s + 9, 4) < th.water) { area.walk[i] = 0; area.fly[i] = 1; area.wall[i] = WK.water; area.ter[i] = T.water; }
      }
    }
    const types = th.obst || [];
    for (let y = 3; y < h - 3; y++) for (let x = 3; x < w - 3; x++) {
      if (!types.length) break;
      const dens = th.odens * (0.3 + 1.6 * fbm(x * 0.11 + 90, y * 0.11 + 90, s + 5, 3));
      if (!rng.chance(dens)) continue;
      const type = rng.pick(types);
      if (type === 'fence') {
        const len = rng.int(3, 8), dx = rng.chance(0.5) ? 1 : 0, dy = 1 - dx;
        let ok = true;
        for (let k = -1; k <= len; k++) { const xx = x + dx * k, yy = y + dy * k; if (!area.isOpen(xx, yy) || area.prot[area.i(xx, yy)]) { ok = false; break; } }
        if (!ok) continue;
        for (let k = 0; k < len; k++) { area.block(x + dx * k, y + dy * k, WK.fence, true); area.wvar[area.i(x + dx * k, y + dy * k)] = (dx ? 1 : 2) | (rng.int(0, 3) << 2); }
        continue;
      }
      const px = x + 0.5 + (type === 'bigrock' ? 0.5 : 0), py = y + 0.5 + (type === 'bigrock' ? 0.5 : 0);
      if (type === 'reed') { if (area.isOpen(x, y)) area.decals.push({ x: px, y: py, k: 'reed', v: rng.int(0, 3) }); continue; }
      if (!area.footprintFree(type, px, py)) continue;
      area.addObj(type, px, py, { v: rng.int(0, 7) });
    }
    finishOutdoorOrDungeon(area, rng, reqs);
  }

  function finishOutdoorOrDungeon(area, rng, required) {
    const st = area.entries.start;
    let dist = D.floodFrom(area, st.x, st.y);
    for (const p of required) {
      const i = area.i(Math.floor(p.x), Math.floor(p.y));
      if (dist[i] >= 0) continue;
      carvePath(area, p, st, 2.2, undefined, true, null);
      dist = D.floodFrom(area, st.x, st.y);
    }
    area.dist = dist;
  }

  function placePacks(area, rng, o) {
    const def = area.def;
    const dist = area.dist;
    const cells = [];
    let count = 0;
    for (let i = 0; i < dist.length; i++) if (dist[i] >= 0) { count++; if (!area.prot[i]) cells.push(i); }
    const npacks = Math.max(3, Math.round(count / (area.dungeon ? 95 : 210) * (def.dens || 1)));
    const safe = [area.entries.start].concat(area.entries.wp ? [area.entries.wp] : []);
    const placed = [];
    const maxd = Math.max(1, ...cells.map(i => dist[i]));
    for (let k = 0; k < npacks * 8 && placed.length < npacks; k++) {
      const i = rng.pick(cells);
      const x = (i % area.w) + 0.5, y = ((i / area.w) | 0) + 0.5;
      if (safe.some(p => Math.hypot(p.x - x, p.y - y) < (area.dungeon ? 10 : 13))) continue;
      if (placed.some(p => Math.hypot(p.x - x, p.y - y) < (area.dungeon ? 6 : 10))) continue;
      if (rng.next() > 0.35 + 0.65 * dist[i] / maxd) continue;
      let type = rng.pick(def.mon);
      const pk = { type, x, y, champ: rng.chance(0.06), unique: false };
      if (!pk.champ && rng.chance(0.035)) pk.unique = true;
      placed.push(pk);
    }
    if (def.su) {
      let p = area.suPos;
      if (!p) {
        let best = 0, bi = cells[0];
        for (const i of cells) if (dist[i] > best) { best = dist[i]; bi = i; }
        p = { x: (bi % area.w) + 0.5, y: ((bi / area.w) | 0) + 0.5 };
      }
      const np = D.nearestWalkable(area, p.x, p.y, 6) || p;
      placed.push({ su: def.su, x: np.x, y: np.y });
      area.suPos = np;
    }
    area.packs = placed;
  }

  function placeContainers(area, rng, n) {
    const dist = area.dist;
    const cand = [];
    for (let i = 0; i < dist.length; i++) if (dist[i] > 6 && !area.prot[i]) cand.push(i);
    let placed = 0, shrines = 0;
    for (let k = 0; k < n * 20 && placed < n; k++) {
      const i = rng.pick(cand);
      const x = (i % area.w) + 0.5, y = ((i / area.w) | 0) + 0.5;
      const r = rng.next();
      const type = r < 0.12 && shrines < 2 ? 'shrine' : r < 0.4 ? 'chest' : r < 0.55 && !area.dungeon ? 'body' : area.dungeon && r < 0.7 ? 'urn' : 'barrel';
      if (!area.footprintFree(type, x, y)) continue;
      let nb = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (area.isOpen(Math.floor(x) + dx, Math.floor(y) + dy)) nb++;
      if (nb < 9) continue;
      if (area.objs.some(ob => ob.cells && Math.abs(ob.x - x) < 2.6 && Math.abs(ob.y - y) < 2.6)) continue;
      if (area.packs.some(p => Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2)) continue;
      const ob = area.addObj(type, x, y, { v: rng.int(0, 3) });
      if (type === 'shrine') { ob.shrine = rng.pick(SHRINES); shrines++; area.lights.push({ x, y, r: 2.5, c: '#80c0ff', f: 0.15 }); }
      if (type === 'chest') ob.locked = rng.chance(0.12);
      placed++;
    }
    area.dist = D.floodFrom(area, area.entries.start.x, area.entries.start.y);
  }

  function wallsAround(area) {
    const { w, h } = area;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = area.i(x, y);
      if (area.walk[i] === 1 || area.wall[i] === WK.pillar) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (area.in(nx, ny) && area.walk[area.i(nx, ny)] === 1) { near = true; break; }
      }
      area.wall[i] = near ? WK.dwall : 0;
      area.fly[i] = 0;
      area.ter[i] = near ? area.ter[i] : 0;
    }
  }

  function genCave(area, rng) {
    const { w, h } = area;
    const floor = T[area.theme.floor];
    let g = new Uint8Array(w * h).fill(1);
    const cham = [];
    for (let t = 0; t < 300 && cham.length < 9; t++) {
      const c = { x: rng.int(8, w - 9), y: rng.int(8, h - 9), r: rng.range(3, 6) };
      if (cham.every(o => Math.hypot(o.x - c.x, o.y - c.y) > o.r + c.r + 5)) cham.push(c);
    }
    const disc = (x, y, r) => {
      for (let yy = Math.floor(y - r - 2); yy <= y + r + 2; yy++) for (let xx = Math.floor(x - r - 2); xx <= x + r + 2; xx++) {
        if (xx < 3 || yy < 3 || xx >= w - 3 || yy >= h - 3) continue;
        const rr = r * (0.75 + 0.5 * D.vnoise(xx * 0.35, yy * 0.35, area.seed));
        if (Math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= rr) g[yy * w + xx] = 0;
      }
    };
    for (const c of cham) disc(c.x, c.y, c.r);
    const joined = [0];
    const links = [];
    while (joined.length < cham.length) {
      let best = null, bd = 1e9;
      for (const i of joined) for (let j = 0; j < cham.length; j++) {
        if (joined.includes(j)) continue;
        const d = Math.hypot(cham[i].x - cham[j].x, cham[i].y - cham[j].y);
        if (d < bd) { bd = d; best = [i, j]; }
      }
      joined.push(best[1]); links.push(best);
    }
    for (let i = 0; i < cham.length; i++) for (let j = i + 1; j < cham.length; j++) if (rng.chance(0.12) && Math.hypot(cham[i].x - cham[j].x, cham[i].y - cham[j].y) < 22) links.push([i, j]);
    for (const [i, j] of links) {
      const A = cham[i], B = cham[j];
      const n = Math.ceil(Math.hypot(B.x - A.x, B.y - A.y) * 2);
      const ox = -(B.y - A.y), oy = B.x - A.x, ol = Math.hypot(ox, oy) || 1;
      const bend = rng.range(-6, 6);
      for (let k = 0; k <= n; k++) {
        const t = k / n, sw = Math.sin(t * Math.PI) * bend;
        disc(A.x + (B.x - A.x) * t + ox / ol * sw, A.y + (B.y - A.y) * t + oy / ol * sw, 1.3);
      }
    }
    for (let it = 0; it < 2; it++) {
      const ng = g.slice();
      for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
        let c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) c += g[(y + dy) * w + x + dx];
        ng[y * w + x] = c >= 6 ? 1 : c <= 3 ? 0 : g[y * w + x];
      }
      g = ng;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (g[y * w + x]) area.block(x, y, WK.dwall, false); else area.open(x, y, floor); }
    let best = null, bestN = 0;
    const seenR = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (area.walk[i] !== 1 || seenR[i]) continue;
      const d = D.floodFrom(area, (i % w) + 0.5, ((i / w) | 0) + 0.5);
      let n = 0;
      for (let k = 0; k < d.length; k++) if (d[k] >= 0) { n++; seenR[k] = 1; }
      if (n > bestN) { bestN = n; best = d; }
    }
    for (let i = 0; i < w * h; i++) if (area.walk[i] === 1 && best[i] < 0) { area.walk[i] = 0; area.fly[i] = 0; }
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
        const i = area.i(x, y);
        if (area.walk[i] === 1) continue;
        let c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (area.walk[area.i(x + dx, y + dy)] === 1) c++;
        if (c >= 5) area.open(x, y, floor);
      }
    }
    for (let i = 0; i < w * h; i++) if (area.walk[i] === 1) area.ter[i] = floor;
    wallsAround(area);
    area.dungeon = true;
    const cells = [];
    for (let i = 0; i < w * h; i++) if (area.walk[i] === 1) cells.push(i);
    const a0 = rng.pick(cells);
    let d = D.floodFrom(area, (a0 % w) + 0.5, ((a0 / w) | 0) + 0.5);
    let far = a0;
    for (const i of cells) if (d[i] > d[far]) far = i;
    d = D.floodFrom(area, (far % w) + 0.5, ((far / w) | 0) + 0.5);
    let far2 = far;
    for (const i of cells) if (d[i] > d[far2]) far2 = i;
    const st = { x: (far % w) + 0.5, y: ((far / w) | 0) + 0.5 };
    area.entries.start = st;
    area.entries['from:' + area.def.up] = st;
    area.addObj('stairs_up', st.x, st.y, { to: area.def.up, label: AREAS[area.def.up].name });
    area.labels.push({ x: st.x, y: st.y, text: AREAS[area.def.up].name });
    area.protect(st.x, st.y, 4);
    area.suPos = { x: (far2 % w) + 0.5, y: ((far2 / w) | 0) + 0.5 };
    area.lights.push({ x: st.x, y: st.y, r: 4, c: '#ffb070', f: 0.1 });
    area.dist = D.floodFrom(area, st.x, st.y);
    for (let k = 0; k < 10; k++) {
      const i = rng.pick(cells);
      area.decals.push({ x: (i % w) + 0.5, y: ((i / w) | 0) + 0.5, k: rng.chance(0.5) ? 'bones' : 'blood', v: rng.int(0, 3) });
    }
  }

  function genRooms(area, rng, o) {
    const { w, h } = area;
    const floor = T[area.theme.floor];
    o = o || {};
    for (let i = 0; i < w * h; i++) { area.walk[i] = 0; area.fly[i] = 0; area.ter[i] = 0; }
    const rooms = [];
    if (o.big) rooms.push(o.big);
    const target = o.rooms || Math.round(w * h / 380);
    for (let t = 0; t < 400 && rooms.length < target; t++) {
      const rw = rng.int(o.minR || 5, o.maxR || 11), rh = rng.int(o.minR || 5, o.maxR || 11);
      const x = rng.int(2, w - rw - 3), y = rng.int(2, h - rh - 3);
      if (rooms.some(r => x < r.x + r.w + 3 && x + rw + 3 > r.x && y < r.y + r.h + 3 && y + rh + 3 > r.y)) continue;
      rooms.push({ x, y, w: rw, h: rh });
    }
    for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) area.open(x, y, floor);
    const c = r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
    const inTree = [0];
    const edges = [];
    while (inTree.length < rooms.length) {
      let best = null, bd = 1e9;
      for (const a of inTree) for (let b = 0; b < rooms.length; b++) {
        if (inTree.includes(b)) continue;
        const d = Math.hypot(c(rooms[a]).x - c(rooms[b]).x, c(rooms[a]).y - c(rooms[b]).y);
        if (d < bd) { bd = d; best = [a, b]; }
      }
      inTree.push(best[1]);
      edges.push(best);
    }
    for (let a = 0; a < rooms.length; a++) for (let b = a + 1; b < rooms.length; b++) {
      if (edges.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a))) continue;
      const d = Math.hypot(c(rooms[a]).x - c(rooms[b]).x, c(rooms[a]).y - c(rooms[b]).y);
      if (d < 18 && rng.chance(0.25)) edges.push([a, b]);
    }
    const cw = o.corr || 2;
    for (const [a, b] of edges) {
      const A = c(rooms[a]), B = c(rooms[b]);
      const ax = Math.floor(A.x), ay = Math.floor(A.y), bx = Math.floor(B.x), by = Math.floor(B.y);
      const hf = rng.chance(0.5);
      const seg = (x0, y0, x1, y1) => {
        for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
          for (let k = 0; k < cw; k++) { if (y0 === y1) area.open(x, y + k - (cw >> 1), floor); else area.open(x + k - (cw >> 1), y, floor); }
      };
      if (hf) { seg(ax, ay, bx, ay); seg(bx, ay, bx, by); } else { seg(ax, ay, ax, by); seg(ax, by, bx, by); }
    }
    for (const r of rooms) {
      if (r.w >= 10 && r.h >= 10 && (o.pillars || rng.chance(0.5))) {
        for (let y = r.y + 2; y < r.y + r.h - 2; y += 3) for (let x = r.x + 2; x < r.x + r.w - 2; x += 4) {
          if ((x === r.x + 2 || x + 4 >= r.x + r.w - 2) || o.pillars) { area.block(x, y, WK.pillar, false); }
        }
      }
    }
    wallsAround(area);
    area.dungeon = true;
    area.rooms = rooms;
    let cells = [];
    for (let i = 0; i < w * h; i++) if (area.walk[i] === 1) cells.push(i);
    const r0 = o.startRoom !== undefined ? rooms[o.startRoom] : rooms.reduce((a, b) => (a.x + a.y < b.x + b.y ? a : b));
    let st = { x: Math.floor(c(r0).x) + 0.5, y: Math.floor(c(r0).y) + 0.5 };
    st = D.nearestWalkable(area, st.x, st.y, 5);
    area.entries.start = st;
    const d = D.floodFrom(area, st.x, st.y);
    for (let i = 0; i < w * h; i++) if (area.walk[i] === 1 && d[i] < 0) { area.walk[i] = 0; area.fly[i] = 0; }
    wallsAround(area);
    cells = cells.filter(i => area.walk[i] === 1);
    let farRoom = r0, farD = -1;
    for (const r of rooms) {
      if (r === r0) continue;
      const p = D.nearestWalkable(area, Math.floor(c(r).x) + 0.5, Math.floor(c(r).y) + 0.5, 4);
      if (!p) continue;
      const dd = d[area.i(Math.floor(p.x), Math.floor(p.y))];
      if (dd > farD) { farD = dd; farRoom = r; }
    }
    area.farRoom = farRoom;
    area.startRoom = r0;
    const up = area.def.up;
    area.addObj(area.def.upGate ? 'gate' : 'stairs_up', st.x, st.y, { to: up, label: AREAS[up].name });
    area.labels.push({ x: st.x, y: st.y, text: AREAS[up].name });
    area.entries['from:' + up] = D.nearestWalkable(area, st.x + 1, st.y + 1, 3) || st;
    area.protect(st.x, st.y, 4);
    const fc = D.nearestWalkable(area, Math.floor(c(farRoom).x) + 0.5, Math.floor(c(farRoom).y) + 0.5, 5);
    if (area.def.down) {
      const dn = area.def.down;
      area.addObj('stairs_down', fc.x, fc.y, { to: dn, label: AREAS[dn].name });
      area.labels.push({ x: fc.x, y: fc.y, text: AREAS[dn].name });
      area.entries['from:' + dn] = D.nearestWalkable(area, fc.x + 1, fc.y + 1, 3) || fc;
      area.protect(fc.x, fc.y, 2);
      area.suPos = D.nearestWalkable(area, fc.x - 3, fc.y - 2, 4) || fc;
    } else area.suPos = fc;
    if (area.def.wp) {
      const wp = D.nearestWalkable(area, st.x + 2.5, st.y + 2.5, 5) || st;
      area.addObj('wp', wp.x, wp.y);
      area.entries.wp = D.nearestWalkable(area, wp.x + 1, wp.y + 1, 3) || wp;
      area.protect(wp.x, wp.y, 2);
      area.lights.push({ x: wp.x, y: wp.y, r: 4, c: '#80a0ff', f: 0.1 });
    }
    area.dist = D.floodFrom(area, st.x, st.y);
    for (const r of rooms) {
      if (rng.chance(0.6)) {
        const tx = r.x + rng.int(1, r.w - 2), ty = r.y;
        if (area.isOpen(tx, ty) && !area.isOpen(tx, ty - 1)) {
          area.addObj('wtorch', tx + 0.5, ty + 0.15);
          area.lights.push({ x: tx + 0.5, y: ty + 0.6, r: 5, c: '#ff9a40', f: 0.25 });
        }
      }
    }
    for (let k = 0; k < rooms.length; k++) {
      const i = rng.pick(cells);
      area.decals.push({ x: (i % w) + 0.5, y: ((i / w) | 0) + 0.5, k: rng.chance(0.5) ? 'bones' : 'blood', v: rng.int(0, 3) });
    }
  }

  function genTown(area, rng) {
    const { w, h } = area;
    const cx = 30, cy = 32;
    area.border = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = area.i(x, y);
      const n = fbm(x * 0.1, y * 0.1, area.seed, 4);
      const inside = Math.hypot((x - cx) / 1.15, y - cy) < 14;
      area.open(x, y, inside ? (n < 0.62 ? T.dirt : T.grass) : (n < 0.36 ? T.dirt : T.grass));
      const bd = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (bd < 3 + Math.floor(fbm(x * 0.2, y * 0.2, area.seed + 1, 2) * 3)) { area.border[i] = 1; area.block(x, y, 0, false); if ((x + y) % 2 === 0 || rng.chance(0.3)) area.objs.push({ id: area.objSeq++, type: 'tree', x: x + 0.5, y: y + 0.5, deco: true, v: rng.int(0, 7) }); }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const d = Math.hypot((x + 0.5 - cx) / 1.15, y + 0.5 - cy);
      if (d >= 14 && d < 15.1) {
        const gate = x > cx + 10 && Math.abs(y + 0.5 - cy) < 2.6;
        if (!gate) { area.block(x, y, WK.palisade, false); area.wvar[area.i(x, y)] = rng.int(0, 7); }
      }
    }
    area.allowBorder = true;
    carveCorridor(area, cx + 16, cy + 0.5, w - 1, cy + 0.5, 4, T.road, null);
    area.allowBorder = false;
    const zone = [];
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = w - 2; x < w; x++) if (area.isOpen(x, y)) zone.push(area.i(x, y));
    area.exits.push({ to: 'bloodmoor', side: 'e', zone, spawn: { x: w - 7.5, y: cy + 0.5 }, x: w - 1.5, y: cy + 0.5 });
    area.entries['from:bloodmoor'] = { x: w - 7.5, y: cy + 0.5 };
    area.labels.push({ x: w - 4, y: cy + 0.5, text: AREAS.bloodmoor.name });
    area.addObj('fire', cx + 0.5, cy + 0.5);
    area.lights.push({ x: cx + 0.5, y: cy + 0.5, r: 8, c: '#ff9a40', f: 0.3 });
    area.addObj('tent', cx + 6.5, cy - 7.5, { v: 0 });
    area.addObj('forge', cx - 9, cy - 1, {});
    area.addObj('anvil', cx - 7.5, cy + 1.5, {});
    area.lights.push({ x: cx - 9, y: cy - 1, r: 5, c: '#ff7020', f: 0.35 });
    area.addObj('wagon', cx + 7, cy + 8.5, { v: 0 });
    area.addObj('wagon', cx + 11, cy + 3.5, { v: 1 });
    area.addObj('tent', cx - 4.5, cy - 9.5, { v: 1 });
    area.addObj('crates', cx + 9.5, cy + 6.5, {});
    area.addObj('crates', cx - 10.5, cy + 3.5, {});
    area.addObj('well', cx - 3.5, cy + 8.5, {});
    const stash = area.addObj('stash', cx + 2.5, cy + 3.5, { label: 'Сундук' });
    stash.label = 'Сундук';
    area.addObj('wp', cx - 4.5, cy + 4.5);
    area.lights.push({ x: cx - 4.5, y: cy + 4.5, r: 4, c: '#80a0ff', f: 0.1 });
    area.entries.wp = { x: cx - 3, y: cy + 6 };
    area.entries.start = { x: cx + 3.5, y: cy + 1.5 };
    area.entries.portal = { x: cx + 4.5, y: cy - 1.5 };
    area.entries.death = { x: cx + 2.5, y: cy + 0.5 };
    const torches = [[cx + 14, cy - 3.5], [cx + 14, cy + 4.5], [cx - 12, cy - 7], [cx - 12, cy + 7], [cx + 3, cy - 12], [cx + 4, cy + 12]];
    for (const [x, y] of torches) { area.addObj('torch', Math.floor(x) + 0.5, Math.floor(y) + 0.5); area.lights.push({ x: Math.floor(x) + 0.5, y: Math.floor(y) + 0.5, r: 4.5, c: '#ff9a40', f: 0.3 }); }
    area.npcs = [
      { id: 'akara', x: cx + 5.5, y: cy - 4.5 },
      { id: 'charsi', x: cx - 6.5, y: cy - 0.5 },
      { id: 'gheed', x: cx + 5, y: cy + 6.5 },
      { id: 'kashya', x: cx - 2.5, y: cy - 5.5 },
      { id: 'warriv', x: cx + 9.5, y: cy + 1.5 },
      { id: 'cain', x: cx + 1.5, y: cy - 2.5, needs: 'cain' },
      { id: 'flavie', x: cx + 15.5, y: cy - 2.5 }
    ];
    for (const n of area.npcs) area.protect(n.x, n.y, 1.5);
    for (let k = 0; k < 18; k++) {
      const x = rng.int(4, w - 5) + 0.5, y = rng.int(4, h - 5) + 0.5;
      if (Math.hypot((x - cx) / 1.15, y - cy) < 16.5) continue;
      if (area.footprintFree('tree', x, y)) area.addObj(rng.chance(0.7) ? 'tree' : 'rock', x, y, { v: rng.int(0, 7) });
    }
    area.dist = D.floodFrom(area, area.entries.start.x, area.entries.start.y);
  }

  function genTristram(area, rng) {
    const { w, h } = area;
    area.border = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = area.i(x, y);
      const n = fbm(x * 0.1, y * 0.1, area.seed, 4);
      const bd = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (bd < 3 + Math.floor(fbm(x * 0.2, y * 0.2, area.seed + 1, 2) * 3)) {
        area.border[i] = 1; area.block(x, y, 0, false);
        if ((x + y) % 2 === 0) area.objs.push({ id: area.objSeq++, type: 'deadtree', x: x + 0.5, y: y + 0.5, deco: true, v: rng.int(0, 7) });
      } else area.open(x, y, n < 0.45 ? T.cobble : T.ash);
    }
    const houses = [[10, 10, 8, 6], [24, 8, 7, 6], [40, 10, 9, 7], [9, 40, 7, 8], [42, 40, 9, 7], [26, 46, 8, 6], [46, 24, 6, 8]];
    for (const [hx, hy, hw, hh] of houses) {
      for (let y = hy; y < hy + hh; y++) for (let x = hx; x < hx + hw; x++) {
        const edge = x === hx || y === hy || x === hx + hw - 1 || y === hy + hh - 1;
        if (edge && rng.chance(0.72)) { area.block(x, y, WK.ruin, false); area.wvar[area.i(x, y)] = rng.int(0, 7); }
        else area.open(x, y, T.cobble);
      }
      area.lights.push({ x: hx + hw / 2, y: hy + hh / 2, r: 4, c: '#ff6020', f: 0.4 });
      area.decals.push({ x: hx + hw / 2, y: hy + hh / 2, k: 'embers', v: 0 });
    }
    const c = { x: 32.5, y: 30.5 };
    area.addObj('cage', c.x, c.y, { label: 'Клетка Каина' });
    area.protect(c.x, c.y, 3);
    area.labels.push({ x: c.x, y: c.y + 2, text: 'Декард Каин' });
    area.addObj('wirt', 22.5, 36.5, { label: 'Тело Вирта' });
    const pp = { x: 32.5, y: 52.5 };
    area.entries.start = pp;
    area.entries['from:stonyfield'] = pp;
    area.addObj('redportal', pp.x, pp.y - 1.5, { to: 'stonyfield', label: AREAS.stonyfield.name });
    area.protect(pp.x, pp.y, 5);
    area.suPos = { x: 45.5, y: 30.5 };
    for (let k = 0; k < 10; k++) {
      const x = rng.int(6, w - 7) + 0.5, y = rng.int(6, h - 7) + 0.5;
      if (area.footprintFree('deadtree', x, y)) area.addObj(rng.chance(0.5) ? 'deadtree' : 'rubble', x, y, { v: rng.int(0, 7) });
    }
    for (let k = 0; k < 12; k++) area.decals.push({ x: rng.int(6, w - 7) + 0.5, y: rng.int(6, h - 7) + 0.5, k: rng.chance(0.5) ? 'bones' : 'blood', v: rng.int(0, 3) });
    finishOutdoorOrDungeon(area, rng, [c, { x: 22.5, y: 36.5 }]);
  }

  function generate(id, seed, o) {
    const def = AREAS[id];
    const rng = new RNG(seed ^ strHash(id));
    const area = new Area(id, def.w, def.h, seed ^ strHash(id));
    if (def.gen === 'town') genTown(area, rng);
    else if (def.gen === 'outdoor') genOutdoor(area, rng, o);
    else if (def.gen === 'cave') genCave(area, rng);
    else if (def.gen === 'rooms') genRooms(area, rng, def.theme === 'jail' ? { minR: 4, maxR: 8, corr: 2 } : def.theme === 'monastery' ? { minR: 6, maxR: 12, corr: 3 } : {});
    else if (def.gen === 'cathedral') genRooms(area, rng, { big: { x: 16, y: 20, w: 28, h: 14 }, pillars: true, rooms: 7, corr: 3 });
    else if (def.gen === 'lair') genRooms(area, rng, { big: { x: 10, y: 24, w: 30, h: 22 }, pillars: true, rooms: 5, corr: 3, minR: 6, maxR: 8 });
    else if (def.gen === 'tristram') genTristram(area, rng);
    if (def.gen === 'lair') {
      area.suPos = D.nearestWalkable(area, 25, 38, 4);
      area.addObj('throne', 25, 43, {});
      area.lights.push({ x: 25, y: 40, r: 8, c: '#ff4060', f: 0.2 });
    }
    if (def.malus) {
      const r = area.farRoom;
      const p = D.nearestWalkable(area, r.x + 1.5, r.y + 1.5, 4);
      const ob = area.addObj('malus', p.x, p.y, { label: 'Молот Хорадрима' });
      area.lights.push({ x: p.x, y: p.y, r: 3, c: '#ffd080', f: 0.2 });
      area.suPos = D.nearestWalkable(area, p.x - 2, p.y - 2, 4) || p;
      ob.quest = 'tools';
    }
    if (def.gen === 'cathedral') {
      area.addObj('altar', 30, 22, {});
      area.lights.push({ x: 30, y: 22.5, r: 6, c: '#ffc080', f: 0.15 });
    }
    if (!def.town) {
      area.dist = D.floodFrom(area, area.entries.start.x, area.entries.start.y);
      placePacks(area, rng, o);
      placeContainers(area, rng, area.dungeon ? 10 : 12);
    }
    area.lvl = def.lvl;
    return area;
  }

  Object.assign(D, { TER, T, WK, BLOCKING, SHRINES, Area, generate });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
