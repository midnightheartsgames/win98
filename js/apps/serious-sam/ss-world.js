(function (S) {
  'use strict';
  const { clamp, smooth, fbm } = S;
  const STEP = 0.65, GRAVITY = 22, CELL = 4;

  class Builder {
    constructor(opt) {
      this.opt = opt; this.boxes = []; this.props = []; this.items = []; this.triggers = []; this.waves = {}; this.gates = {};
      this.enemies = []; this.lights = []; this.flats = []; this.secretCount = 0; this.fx = [];
    }
    box(x0, z0, x1, z1, y0, y1, tex = 'block', o = {}) {
      const b = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y0, y1, tex, top: o.top || tex, uvs: o.uvs || 4, collide: o.collide !== false, render: o.render !== false, gate: o.gate || null, tint: o.tint || null };
      this.boxes.push(b); return b;
    }

    walls(x0, z0, x1, z1, h, t = 1.5, tex = 'hiero', gaps = {}, o = {}) {
      const run = (list, a0, a1, fn) => {
        const g = (list || []).slice().sort((p, q) => p[0] - q[0]); let a = a0;
        for (const [ga, gb] of g) { if (ga > a) fn(a, ga); a = Math.max(a, gb); }
        if (a < a1) fn(a, a1);
      };
      run(gaps.s, x0, x1, (a, b) => this.box(a, z0, b, z0 + t, 0, h, tex, o));
      run(gaps.n, x0, x1, (a, b) => this.box(a, z1 - t, b, z1, 0, h, tex, o));
      run(gaps.w, z0 + t, z1 - t, (a, b) => this.box(x0, a, x0 + t, b, 0, h, tex, o));
      run(gaps.e, z0 + t, z1 - t, (a, b) => this.box(x1 - t, a, x1, b, 0, h, tex, o));

      if (o.lintel) {
        for (const [a, b] of gaps.s || []) this.box(a, z0, b, z0 + t, o.lintel, h, tex);
        for (const [a, b] of gaps.n || []) this.box(a, z1 - t, b, z1, o.lintel, h, tex);
        for (const [a, b] of gaps.w || []) this.box(x0, a, x0 + t, b, o.lintel, h, tex);
        for (const [a, b] of gaps.e || []) this.box(x1 - t, a, x1, b, o.lintel, h, tex);
      }
      if (o.cap) {
        const c = 0.3;
        run(gaps.s, x0, x1, (a, b) => this.box(a - c, z0 - c, b + c, z0 + t + c, h, h + 0.5, 'block', { collide: false }));
        run(gaps.n, x0, x1, (a, b) => this.box(a - c, z1 - t - c, b + c, z1 + c, h, h + 0.5, 'block', { collide: false }));
        run(gaps.w, z0 + t, z1 - t, (a, b) => this.box(x0 - c, a, x0 + t + c, b, h, h + 0.5, 'block', { collide: false }));
        run(gaps.e, z0 + t, z1 - t, (a, b) => this.box(x1 - t - c, a, x1 + c, b, h, h + 0.5, 'block', { collide: false }));
      }
    }

    stairs(x0, z0, x1, z1, y0, y1, dir = 'n', tex = 'block', stepH = 0.5) {
      const n = Math.max(1, Math.round((y1 - y0) / stepH)), h = (y1 - y0) / n;
      for (let i = 0; i < n; i++) {
        const f0 = i / n, top = y0 + h * (i + 1);
        if (dir === 'n') this.box(x0, z0 + (z1 - z0) * f0, x1, z1, y0, top, tex);
        else if (dir === 's') this.box(x0, z0, x1, z1 - (z1 - z0) * f0, y0, top, tex);
        else if (dir === 'e') this.box(x0 + (x1 - x0) * f0, z0, x1, z1, y0, top, tex);
        else this.box(x0, z0, x1 - (x1 - x0) * f0, z1, y0, top, tex);
      }
    }
    prop(kind, x, z, o = {}) { const p = Object.assign({ kind, x, z, y: 0, rot: 0, s: 1 }, o); this.props.push(p); return p; }
    column(x, z, h = 8, r = 0.8, o = {}) {
      this.prop('column', x, z, Object.assign({ h, r }, o));
      const y = o.y || 0;
      this.box(x - r * 0.8, z - r * 0.8, x + r * 0.8, z + r * 0.8, y, y + h, 'column', { render: false });
    }
    obelisk(x, z, h = 14) { this.prop('obelisk', x, z, { h }); const r = h * 0.07; this.box(x - r - 0.4, z - r - 0.4, x + r + 0.4, z + r + 0.4, 0, h, 'block', { render: false }); this.box(x - r - 0.9, z - r - 0.9, x + r + 0.9, z + r + 0.9, 0, 0.6, 'block'); }
    sphinx(x, z, rot = 0, s = 1) {
      this.prop('sphinx', x, z, { rot, s });
      const alongZ = Math.abs(Math.cos(rot)) > 0.5, L = 5.2 * s, W = 1.6 * s;
      if (alongZ) this.box(x - W, z - L, x + W, z + L, 0, 3.4 * s, 'block', { render: false });
      else this.box(x - L, z - W, x + L, z + W, 0, 3.4 * s, 'block', { render: false });
    }
    statue(x, z, rot = 0, s = 1, y = 0) { this.prop('statue', x, z, { rot, s, y }); this.box(x - 1.2 * s, z - 1.2 * s, x + 1.2 * s, z + 1.2 * s, y, y + 7.5 * s, 'block', { render: false }); }
    palm(x, z, h = 7, o = {}) { this.prop('palm', x, z, Object.assign({ h, rot: (x * 7.3 + z * 3.1) % 6.28 }, o)); this.box(x - 0.25, z - 0.25, x + 0.25, z + 0.25, 0, h, 'palm', { render: false }); }
    rock(x, z, s = 3, h = 4, o = {}) { this.prop('rock', x, z, Object.assign({ s, h, rot: (x * 1.7 + z * 2.3) % 6.28 }, o)); if (o.collide !== false) this.box(x - s * 0.75, z - s * 0.75, x + s * 0.75, z + s * 0.75, 0, h * 0.9, 'rock', { render: false }); }

    pyramid(x, z, half, h, o = {}) {
      this.prop('pyramid', x, z, Object.assign({ half, h }, o));
      if (o.collide) { const n = o.layers || 12; for (let i = 0; i < n; i++) { const y0 = (h * i) / n, y1 = (h * (i + 1)) / n, hw = half * (1 - (i + 0.5) / n); this.box(x - hw, z - hw, x + hw, z + hw, y0, y1, 'lime', { render: false }); } }
    }
    torch(x, y, z, o = {}) { this.prop('torch', x, z, { y, wall: o.wall }); this.lights.push({ x, y: y + 0.6, z, r: o.r || 11, c: o.c || [1.0, 0.62, 0.25] }); }
    brazier(x, z, y = 0) { this.prop('brazier', x, z, { y }); this.lights.push({ x, y: y + 1.6, z, r: 14, c: [1.0, 0.6, 0.22] }); this.box(x - 0.5, z - 0.5, x + 0.5, z + 0.5, y, y + 1.2, 'block', { render: false }); }
    gate(id, x0, z0, x1, z1, y0, y1, o = {}) {
      const b = this.box(x0, z0, x1, z1, y0, y1, o.tex || 'gate', { gate: id, uvs: o.uvs || 4 });
      this.gates[id] = { id, box: b, open: !!o.open, t: o.open ? 1 : 0, speed: o.speed || 0.8, h: y1 - y0 };
      return b;
    }
    item(type, x, z, o = {}) { this.items.push(Object.assign({ type, x, z, y: null }, o)); }
    items_(type, pts) { for (const [x, z] of pts) this.item(type, x, z); }
    row(type, x0, z0, x1, z1, n, o) { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); this.item(type, x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, o); } }
    trigger(x0, z0, x1, z1, actions, o = {}) { this.triggers.push(Object.assign({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), actions: [].concat(actions), once: true, y0: -99, y1: 999 }, o)); }
    secret(x0, z0, x1, z1, o = {}) { this.secretCount++; this.trigger(x0, z0, x1, z1, [{ secret: true }], o); }

    wave(id, groups, then = []) { this.waves[id] = { id, groups, then: [].concat(then) }; }
    enemy(t, x, z, o = {}) { this.enemies.push(Object.assign({ t, x, z, rot: 0 }, o)); }
    flat(x0, z0, x1, z1) { this.flats.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) }); }
    water(x0, z0, x1, z1, y = -0.4) { this.fx.push({ kind: 'water', x0, z0, x1, z1, y }); }
    build() {
      const o = this.opt;
      return {
        id: o.id, name: o.name, env: o.env, bounds: o.bounds, terrain: o.terrain, start: o.start, music: o.music, intro: o.intro, weapons: o.weapons,
        boxes: this.boxes, props: this.props, items: this.items, triggers: this.triggers, waves: this.waves, gates: this.gates,
        enemies: this.enemies, lights: this.lights, flats: this.flats, secrets: this.secretCount, fx: this.fx
      };
    }
  }

  class World {
    constructor(def) {
      this.def = def;
      const [bx0, bz0, bx1, bz1] = def.bounds;
      this.bx0 = bx0; this.bz0 = bz0; this.bx1 = bx1; this.bz1 = bz1;
      const T = def.terrain || {};
      this.tseed = T.seed || 1; this.tamp = T.amp == null ? 1.5 : T.amp; this.tscale = T.scale || 40; this.edge = T.edge == null ? 18 : T.edge; this.edgeInside = T.edgeInside == null ? 2.5 : T.edgeInside;
      this.boxes = def.boxes.filter(b => b.collide).map(b => Object.assign({}, b, { off: false, oy: 0, src: b }));
      const big = 200;
      for (const w of [[bx0 - 5, bz0 - 5, bx0, bz1 + 5], [bx1, bz0 - 5, bx1 + 5, bz1 + 5], [bx0 - 5, bz0 - 5, bx1 + 5, bz0], [bx0 - 5, bz1, bx1 + 5, bz1 + 5]]) {
        this.boxes.push({ x0: w[0], z0: w[1], x1: w[2], z1: w[3], y0: -50, y1: big, invisible: true, collide: true, off: false, oy: 0 });
      }
      this.gateBoxes = {};
      for (const b of this.boxes) if (b.gate) this.gateBoxes[b.gate] = b;
      this.stamp = 1; this.stamps = new Uint32Array(this.boxes.length);
      this.buildGrid();
      this.buildHeightmap();
      this.buildNav();
    }

    buildGrid() {
      this.gx0 = this.bx0 - 8; this.gz0 = this.bz0 - 8;
      this.gw = Math.ceil((this.bx1 - this.bx0 + 16) / CELL); this.gh = Math.ceil((this.bz1 - this.bz0 + 16) / CELL);
      this.grid = Array.from({ length: this.gw * this.gh }, () => []);
      this.boxes.forEach((b, i) => {
        const i0 = clamp(Math.floor((b.x0 - this.gx0) / CELL), 0, this.gw - 1), i1 = clamp(Math.floor((b.x1 - this.gx0) / CELL), 0, this.gw - 1);
        const j0 = clamp(Math.floor((b.z0 - this.gz0) / CELL), 0, this.gh - 1), j1 = clamp(Math.floor((b.z1 - this.gz0) / CELL), 0, this.gh - 1);
        for (let j = j0; j <= j1; j++) for (let k = i0; k <= i1; k++) this.grid[j * this.gw + k].push(i);
      });
    }

    near(x0, z0, x1, z1, fn) {
      const st = ++this.stamp;
      if (st >= 0xfffffff0) { this.stamps.fill(0); this.stamp = 1; }
      const i0 = clamp(Math.floor((x0 - this.gx0) / CELL), 0, this.gw - 1), i1 = clamp(Math.floor((x1 - this.gx0) / CELL), 0, this.gw - 1);
      const j0 = clamp(Math.floor((z0 - this.gz0) / CELL), 0, this.gh - 1), j1 = clamp(Math.floor((z1 - this.gz0) / CELL), 0, this.gh - 1);
      for (let j = j0; j <= j1; j++) for (let k = i0; k <= i1; k++) {
        for (const bi of this.grid[j * this.gw + k]) {
          if (this.stamps[bi] === this.stamp) continue; this.stamps[bi] = this.stamp;
          const b = this.boxes[bi]; if (b.off) continue;
          if (b.x1 < x0 || b.x0 > x1 || b.z1 < z0 || b.z0 > z1) continue;
          if (fn(b) === false) return;
        }
      }
    }

    rawTerrain(x, z) {
      if (!this.tamp) return 0;
      return this.tamp * smooth(0.36, 0.78, fbm(x / this.tscale, z / this.tscale, this.tseed, 3));
    }
    edgeTerm(x, z) {
      const dx = Math.max(this.bx0 - x, 0, x - this.bx1), dz = Math.max(this.bz0 - z, 0, z - this.bz1), d = Math.hypot(dx, dz);
      if (d > 0) return this.edgeInside + this.edge * smooth(0, 70, d) * (0.6 + 0.8 * fbm(x / 60, z / 60, this.tseed + 99, 3)) + this.tamp * 2 * fbm(x / 23, z / 23, this.tseed + 5, 2);
      const inside = Math.min(x - this.bx0, this.bx1 - x, z - this.bz0, this.bz1 - z);
      return this.edgeInside * (1 - smooth(0, 10, inside));
    }
    buildHeightmap() {
      const nx = this.bx1 - this.bx0 + 1, nz = this.bz1 - this.bz0 + 1;
      this.hnx = nx; this.hnz = nz;
      const f = new Float32Array(nx * nz).fill(1);
      const stampRect = (x0, z0, x1, z1, pad) => {
        const i0 = Math.max(0, Math.floor(x0 - pad - this.bx0)), i1 = Math.min(nx - 1, Math.ceil(x1 + pad - this.bx0));
        const j0 = Math.max(0, Math.floor(z0 - pad - this.bz0)), j1 = Math.min(nz - 1, Math.ceil(z1 + pad - this.bz0));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const x = this.bx0 + i, z = this.bz0 + j;
          const dx = Math.max(x0 - x, 0, x - x1), dz = Math.max(z0 - z, 0, z - z1), d = Math.hypot(dx, dz);
          const v = smooth(0, pad, d), k = j * nx + i; if (v < f[k]) f[k] = v;
        }
      };
      for (const b of this.def.boxes) if (b.y0 <= 0.6 && !b.gate) stampRect(b.x0, b.z0, b.x1, b.z1, 4);
      for (const r of this.def.flats) stampRect(r.x0, r.z0, r.x1, r.z1, 6);
      const hm = new Float32Array(nx * nz); let mx = -Infinity;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const x = this.bx0 + i, z = this.bz0 + j, k = j * nx + i;
        hm[k] = this.rawTerrain(x, z) * f[k] + this.edgeTerm(x, z);
        if (hm[k] > mx) mx = hm[k];
      }
      this.hm = hm; this.hmMax = mx;
    }
    terrainAt(x, z) {
      const fx = x - this.bx0, fz = z - this.bz0;
      if (fx < 0 || fz < 0 || fx >= this.hnx - 1 || fz >= this.hnz - 1) return this.rawTerrain(x, z) + this.edgeTerm(x, z);
      const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, n = this.hnx, k = j * n + i, h = this.hm;
      return (h[k] * (1 - u) + h[k + 1] * u) * (1 - v) + (h[k + n] * (1 - u) + h[k + n + 1] * u) * v;
    }
    terrainNormal(x, z) {
      const e = 0.5, hx = this.terrainAt(x + e, z) - this.terrainAt(x - e, z), hz = this.terrainAt(x, z + e) - this.terrainAt(x, z - e);
      const l = Math.hypot(hx, 2 * e, hz); return [-hx / l, 2 * e / l, -hz / l];
    }

    floorAt(x, z, r, maxY) {
      let fl = this.terrainAt(x, z); const q = r * 0.7;
      this.near(x - q, z - q, x + q, z + q, b => {
        if (b.invisible || b.y1 > maxY || b.y1 <= fl) return;
        if (x + q > b.x0 && x - q < b.x1 && z + q > b.z0 && z - q < b.z1) fl = b.y1;
      });
      return fl;
    }

    groundAt(x, z, r = 0.25) {
      let fl = this.terrainAt(x, z); const list = [];
      this.near(x - r, z - r, x + r, z + r, b => { if (!b.invisible && x + r > b.x0 && x - r < b.x1 && z + r > b.z0 && z - r < b.z1) list.push(b); });
      list.sort((a, b) => a.y0 - b.y0);
      for (const b of list) if (b.y0 <= fl + STEP && b.y1 > fl) fl = b.y1;
      return fl;
    }
    ceilAt(x, z, r, minY) {
      let c = Infinity; const q = r * 0.7;
      this.near(x - q, z - q, x + q, z + q, b => {
        if (b.invisible || b.y0 < minY || b.y0 >= c) return;
        if (x + q > b.x0 && x - q < b.x1 && z + q > b.z0 && z - q < b.z1) c = b.y0;
      });
      return c;
    }

    resolve(o, stepAllow) {
      const r = o.r;
      for (let it = 0; it < 3; it++) {
        let moved = false;
        this.near(o.x - r, o.z - r, o.x + r, o.z + r, b => {
          if (b.y1 <= o.y + stepAllow || b.y0 >= o.y + o.h) return;
          const cx = clamp(o.x, b.x0, b.x1), cz = clamp(o.z, b.z0, b.z1);
          let dx = o.x - cx, dz = o.z - cz; const d2 = dx * dx + dz * dz;
          if (d2 >= r * r) return;
          if (d2 > 1e-9) { const d = Math.sqrt(d2), p = r - d; o.x += (dx / d) * p; o.z += (dz / d) * p; }
          else {
            const pen = [o.x - b.x0 + r, b.x1 - o.x + r, o.z - b.z0 + r, b.z1 - o.z + r], m = Math.min(...pen), k = pen.indexOf(m);
            if (k === 0) o.x -= m; else if (k === 1) o.x += m; else if (k === 2) o.z -= m; else o.z += m;
          }
          o.hitWall = true; moved = true;
        });
        if (!moved) break;
      }
    }

    move(o, dt) {
      o.hitWall = false;
      const sp = Math.max(Math.abs(o.vx), Math.abs(o.vz)) * dt, n = clamp(Math.ceil(sp / (o.r * 0.7)), 1, 10);
      const stepAllow = o.fly ? 0 : (o.ground ? STEP : 0.3);
      for (let i = 0; i < n; i++) { o.x += (o.vx * dt) / n; o.z += (o.vz * dt) / n; this.resolve(o, stepAllow); }
      let land = 0;
      if (o.fly) {
        o.y += o.vy * dt;
        const fl = this.floorAt(o.x, o.z, o.r, o.y + 0.3);
        if (o.y < fl + 0.2) { o.y = fl + 0.2; if (o.vy < 0) o.vy = 0; }
        const c = this.ceilAt(o.x, o.z, o.r, o.y + 0.2); if (o.y + o.h > c) { o.y = c - o.h; if (o.vy > 0) o.vy = 0; }
        return 0;
      }
      o.vy -= (o.grav == null ? GRAVITY : o.grav) * dt;
      let ny = o.y + o.vy * dt;
      const fl = this.floorAt(o.x, o.z, o.r, o.y + (o.ground ? STEP : 0.3));
      if (ny <= fl) { if (o.vy < 0) land = -o.vy; ny = fl; o.vy = 0; o.ground = true; }
      else if (o.ground && o.vy <= 0 && ny - fl < STEP) { ny = fl; o.vy = 0; }
      else o.ground = false;
      const c = this.ceilAt(o.x, o.z, o.r, o.y + o.h - 0.4);
      if (ny + o.h > c) { ny = Math.max(fl, c - o.h); if (o.vy > 0) o.vy = 0; }
      o.y = ny;
      return land;
    }

    ray(ox, oy, oz, dx, dy, dz, maxT, shots = false, noTerrain = false) {
      let best = maxT, hit = null;

      const len = Math.hypot(dx, dz);
      const test = b => {
        if (shots && b.invisible) return;
        let t0 = 0, t1 = best, nAxis = -1, nSign = 0;
        const sl = (o, d, lo, hi, ax) => {
          if (Math.abs(d) < 1e-9) return o >= lo && o <= hi;
          let a = (lo - o) / d, c = (hi - o) / d; if (a > c) { const tt = a; a = c; c = tt; }
          if (a > t0) { t0 = a; nAxis = ax; nSign = d > 0 ? -1 : 1; }
          if (c < t1) t1 = c; return t0 <= t1;
        };
        if (!sl(ox, dx, b.x0, b.x1, 0) || !sl(oy, dy, b.y0, b.y1, 1) || !sl(oz, dz, b.z0, b.z1, 2)) return;
        if (t0 < best && t0 >= 0) { best = t0; const n = [0, 0, 0]; if (nAxis >= 0) n[nAxis] = nSign; else n[1] = 1; hit = { t: t0, n, box: b }; }
      };
      if (len < 1e-6) this.near(ox - 0.1, oz - 0.1, ox + 0.1, oz + 0.1, test);
      else {
        const st = ++this.stamp; const ux = dx / len, uz = dz / len;
        let cx = Math.floor((ox - this.gx0) / CELL), cz = Math.floor((oz - this.gz0) / CELL);
        const sx = ux > 0 ? 1 : -1, sz = uz > 0 ? 1 : -1;
        const tdx = Math.abs(ux) > 1e-9 ? CELL / Math.abs(ux) : Infinity, tdz = Math.abs(uz) > 1e-9 ? CELL / Math.abs(uz) : Infinity;
        let tmx = Math.abs(ux) > 1e-9 ? ((ux > 0 ? (cx + 1) * CELL : cx * CELL) - (ox - this.gx0)) / ux : Infinity;
        let tmz = Math.abs(uz) > 1e-9 ? ((uz > 0 ? (cz + 1) * CELL : cz * CELL) - (oz - this.gz0)) / uz : Infinity;
        let dist = 0; const maxH = best * len;
        for (let guard = 0; guard < 400; guard++) {
          if (cx >= 0 && cz >= 0 && cx < this.gw && cz < this.gh) {
            for (const bi of this.grid[cz * this.gw + cx]) { if (this.stamps[bi] === st) continue; this.stamps[bi] = st; const b = this.boxes[bi]; if (!b.off) test(b); }
          } else if ((cx < 0 && sx < 0) || (cz < 0 && sz < 0) || (cx >= this.gw && sx > 0) || (cz >= this.gh && sz > 0)) break;
          if (dist > Math.min(maxH, best * len)) break;
          if (tmx < tmz) { dist = tmx; tmx += tdx; cx += sx; } else { dist = tmz; tmz += tdz; cz += sz; }
        }
      }

      const hmTop = this.hmMax + this.edge + 3;
      let ta = 0, tb = best;
      if (noTerrain || (dy >= 0 && oy > hmTop)) tb = -1;
      else if (oy > hmTop && dy < 0) ta = (hmTop - oy) / dy;
      else if (dy > 0) tb = Math.min(tb, (hmTop - oy) / dy);
      if (tb > ta) {
        const stepT = 0.7 / Math.max(1e-6, Math.hypot(dx, dy, dz));
        let prev = ta;
        for (let t = ta; t <= tb; t += stepT) {
          const y = oy + dy * t, x = ox + dx * t, z = oz + dz * t;
          if (y < this.terrainAt(x, z)) {
            let lo = prev, hi = t;
            for (let k = 0; k < 8; k++) { const m = (lo + hi) / 2; if (oy + dy * m < this.terrainAt(ox + dx * m, oz + dz * m)) hi = m; else lo = m; }
            if (hi < best) { best = hi; hit = { t: hi, n: this.terrainNormal(ox + dx * hi, oz + dz * hi), box: null, terrain: true }; }
            break;
          }
          prev = t;
        }
      }
      return hit;
    }
    los(ax, ay, az, bx, by, bz) {
      const dx = bx - ax, dy = by - ay, dz = bz - az;
      return !this.ray(ax, ay, az, dx, dy, dz, 1, true);
    }

    buildNav() {
      this.nw = this.bx1 - this.bx0; this.nh = this.bz1 - this.bz0;
      const N = this.nw * this.nh;
      this.navH = new Float32Array(N); this.navOK = new Uint8Array(N); this.flow = new Uint16Array(N).fill(65535); this.queue = new Int32Array(N);
      for (let j = 0; j < this.nh; j++) for (let i = 0; i < this.nw; i++) this.navCell(i, j);
      this.flowCell = -1;
    }
    navCell(i, j) {
      const cx = this.bx0 + i + 0.5, cz = this.bz0 + j + 0.5, k = j * this.nw + i, e = 0.8;
      let fl = this.terrainAt(cx, cz), ok = 1;
      const list = [];
      this.near(cx - e, cz - e, cx + e, cz + e, b => { if (cx + e > b.x0 && cx - e < b.x1 && cz + e > b.z0 && cz - e < b.z1) list.push(b); });
      list.sort((a, b) => a.y0 - b.y0);
      for (const b of list) {
        if (b.invisible) { ok = 0; break; }
        if (b.y0 <= fl + STEP) { if (b.y1 > fl) fl = b.y1; }
        else if (b.y0 < fl + 2.2) { ok = 0; break; }
      }
      this.navH[k] = fl; this.navOK[k] = ok;
    }
    refreshNav(x0, z0, x1, z1) {
      const i0 = clamp(Math.floor(x0 - this.bx0) - 2, 0, this.nw - 1), i1 = clamp(Math.ceil(x1 - this.bx0) + 2, 0, this.nw - 1);
      const j0 = clamp(Math.floor(z0 - this.bz0) - 2, 0, this.nh - 1), j1 = clamp(Math.ceil(z1 - this.bz0) + 2, 0, this.nh - 1);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) this.navCell(i, j);
      this.flowCell = -1;
    }
    cellOf(x, z) {
      const i = Math.floor(x - this.bx0), j = Math.floor(z - this.bz0);
      if (i < 0 || j < 0 || i >= this.nw || j >= this.nh) return -1;
      return j * this.nw + i;
    }

    updateFlow(x, z, y) {
      const c = this.cellOf(x, z); if (c < 0) return;
      this.flowCell = c;
      const W = this.nw, H = this.nh, flow = this.flow, ok = this.navOK, nh = this.navH, q = this.queue;
      flow.fill(65535); let qh = 0, qt = 0;
      this.flowSeeds = 0;
      if (y != null) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
        const s = this.cellOf(x + dx, z + dz);
        if (s < 0 || flow[s] === 0 || !ok[s] || Math.abs(nh[s] - y) > 0.8) continue;
        flow[s] = 0; q[qt++] = s; this.flowSeeds++;
      }
      if (!qt) { flow[c] = 0; q[qt++] = c; }
      const DX = [1, -1, 0, 0, 1, 1, -1, -1], DZ = [0, 0, 1, -1, 1, -1, 1, -1];
      while (qh < qt) {
        const a = q[qh++], ai = a % W, aj = (a / W) | 0, d = flow[a] + 1, ha = nh[a];
        for (let k = 0; k < 8; k++) {
          const bi = ai + DX[k], bj = aj + DZ[k];
          if (bi < 0 || bj < 0 || bi >= W || bj >= H) continue;
          const b = bj * W + bi;
          if (flow[b] !== 65535 || !ok[b]) continue;
          if (ha - nh[b] > 1.1 || nh[b] - ha > 7) continue;
          if (k >= 4) { const o1 = aj * W + bi, o2 = bj * W + ai; if (!ok[o1] || !ok[o2] || Math.abs(nh[o1] - ha) > 1.1 || Math.abs(nh[o2] - ha) > 1.1) continue; }
          flow[b] = d; q[qt++] = b;
        }
      }
    }

    flowDir(x, z) {
      const c = this.cellOf(x, z); if (c < 0 || this.flow[c] === 65535) return null;
      if (this.flow[c] === 0) return null;
      const W = this.nw, ci = c % W, cj = (c / W) | 0, h = this.navH[c];
      let best = this.flow[c], bx = 0, bz = 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue; const i = ci + dx, j = cj + dz;
        if (i < 0 || j < 0 || i >= W || j >= this.nh) continue;
        const k = j * W + i; if (this.flow[k] >= best || this.navH[k] - h > 1.1) continue;
        if (dx && dz) { const o1 = cj * W + i, o2 = j * W + ci; if (!this.navOK[o1] || !this.navOK[o2]) continue; }
        best = this.flow[k]; bx = this.bx0 + i + 0.5; bz = this.bz0 + j + 0.5;
      }
      if (best === this.flow[c]) return null;
      const vx = bx - x, vz = bz - z, l = Math.hypot(vx, vz) || 1;
      return [vx / l, vz / l];
    }

    setGate(id, openT) {
      const b = this.gateBoxes[id]; if (!b) return;
      const off = (b.src.y1 - b.src.y0) * openT;
      b.y0 = b.src.y0 - off; b.y1 = b.src.y1 - off; b.off = openT >= 0.999;
      const state = openT >= 0.999 ? 2 : openT <= 0.001 ? 0 : openT > 0.5 ? 1.5 : 1;
      if (state !== b.navState) { b.navState = state; this.refreshNav(b.x0, b.z0, b.x1, b.z1); }
    }
  }

  S.Builder = Builder; S.World = World; S.PHYS = { STEP, GRAVITY };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.SeriousSam98 = globalThis.SeriousSam98 || {});
