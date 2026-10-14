(function (H) {
  'use strict';

  const INF = 1e9;
  const CELL = H.CELL;
  const VOID = { f: 60, c: INF, top: INF, t: 'rock', w: 'rock', ct: 'plaster', rt: 'roof', solidVoid: true };

  function normLegend(src) {
    const out = {};
    for (const ch of Object.keys(src)) {
      const e = Object.assign({ f: 0, c: INF, t: 'concrete', w: 'concrete', ct: 'plaster', rt: 'roof', wl: -INF, wt: 'water' }, src[ch]);
      if (e.c < INF && e.top === undefined) e.top = e.c + 0.4;
      if (e.c >= INF) e.top = INF;
      e.ch = ch;
      out[ch] = e;
    }
    if (!out[' ']) out[' '] = Object.assign({ ch: ' ', wl: -INF, wt: 'water' }, VOID);
    return out;
  }

  class Builder {
    constructor(world) {
      this.world = world;
      this.boxes = [];
      this.ramps = [];
      this.lights = [];
      this.spawns = [];
      this.zones = {};
      this.paths = {};
      this.spots = {};
      this.ladders = [];
      this.caches = [];
      this.signs = [];
      this.models = [];
    }
    box(x1, y1, z1, x2, y2, z2, tex = 'concrete', o = {}) {
      const b = {
        x1: Math.min(x1, x2), y1: Math.min(y1, y2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), y2: Math.max(y1, y2), z2: Math.max(z1, z2),
        tex, top: o.top || tex, bottom: o.bottom || tex, side: o.side || tex, solid: o.solid !== false, visible: o.visible !== false,
        alpha: o.alpha || 0, uvScale: o.uvScale || 1, id: o.id || null, nav: o.nav !== false, glow: o.glow || 0
      };
      this.boxes.push(b);
      return b;
    }
    clip(x1, y1, z1, x2, y2, z2) {
      return this.box(x1, y1, z1, x2, y2, z2, 'concrete', { visible: false });
    }
    ramp(x1, z1, x2, z2, y0, y1, dir, tex = 'concrete', o = {}) {
      const r = {
        x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2), y0, y1, dir, tex,
        side: o.side || tex, stairs: !!o.stairs, base: o.base !== undefined ? o.base : Math.min(y0, y1) - 0.3
      };
      this.ramps.push(r);
      return r;
    }
    stairs(x1, z1, x2, z2, y0, y1, dir, tex = 'concrete', o = {}) {
      return this.ramp(x1, z1, x2, z2, y0, y1, dir, tex, Object.assign({ stairs: true }, o));
    }
    light(x, y, z, r, g, b, radius = 8, o = {}) {
      const l = { x, y, z, r, g, b, radius, flicker: o.flicker || 0, id: o.id || null, model: o.model || null };
      this.lights.push(l);
      return l;
    }
    spawn(kind, type, x, z, o = {}) {
      const s = Object.assign({ kind, type, x, z }, o);
      this.spawns.push(s);
      return s;
    }
    npc(type, x, z, o = {}) { return this.spawn('npc', type, x, z, o); }
    prop(type, x, z, o = {}) { return this.spawn('prop', type, x, z, o); }
    item(type, x, z, o = {}) { return this.spawn('item', type, x, z, o); }
    door(id, x1, y1, z1, x2, y2, z2, o = {}) {
      const oo = Object.assign({}, o);
      const type = oo.type || oo.kind || 'slide';
      delete oo.kind;
      return this.spawn('door', type, (x1 + x2) / 2, (z1 + z2) / 2, Object.assign({ id, box: [Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2), Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2)] }, oo, { type }));
    }
    forcefield(id, x1, y1, z1, x2, y2, z2, o = {}) {
      return this.door(id, x1, y1, z1, x2, y2, z2, Object.assign({ type: 'field', tex: 'field' }, o));
    }
    charger(type, x, y, z, yaw, o = {}) { return this.spawn('charger', type, x, z, Object.assign({ y, yaw }, o)); }
    vehicle(type, x, z, yaw, o = {}) { return this.spawn('vehicle', type, x, z, Object.assign({ yaw }, o)); }
    button(id, x, y, z, yaw, o = {}) { return this.spawn('button', 'button', x, z, Object.assign({ id, y, yaw }, o)); }
    hazard(id, x1, y1, z1, x2, y2, z2, kind, o = {}) {
      return this.spawn('hazard', kind, (x1 + x2) / 2, (z1 + z2) / 2, Object.assign({ id, box: [Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2), Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2)] }, o));
    }
    seesaw(id, x, z, len, yPivot, axis, o = {}) { return this.spawn('seesaw', 'seesaw', x, z, Object.assign({ id, len, yPivot, axis }, o)); }
    floatramp(id, x1, z1, x2, z2, yLow, yHigh, o = {}) { return this.spawn('floatramp', 'floatramp', (x1 + x2) / 2, (z1 + z2) / 2, Object.assign({ id, rect: [x1, z1, x2, z2], yLow, yHigh }, o)); }
    zone(id, x1, z1, x2, z2, y1 = -INF, y2 = INF) {
      this.zones[id] = { x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2), y1, y2 };
    }
    path(id, pts) { this.paths[id] = pts.map(p => ({ x: p[0], y: p.length > 2 ? p[2] : null, z: p[1] })); }
    spot(id, x, z, y = null, yaw = 0) { this.spots[id] = { x, y, z, yaw }; }
    ladder(x1, z1, x2, z2, y0, y1, o = {}) {
      this.ladders.push({ x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2), y0, y1 });
      if (o.visible !== false) this.box(x1, y0, z1, x2, y1, z2, 'ladder', { solid: false });
    }
    cache(x1, z1, x2, z2) { this.caches.push({ x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2) }); }
    sign(text, x, y, z, yaw, w = 2, h = 0.6, o = {}) { this.signs.push({ text, x, y, z, yaw, w, h, bg: o.bg || '#1c2a33', fg: o.fg || '#e8e0c8', glow: !!o.glow }); }
    model(kind, x, y, z, yaw = 0, o = {}) {
      const m = Object.assign({ kind, x, y, z, yaw, scale: 1 }, o);
      this.models.push(m);
      if (o.solid) this.box(x - o.solid[0], y, z - o.solid[2], x + o.solid[0], y + o.solid[1], z + o.solid[2], 'metal', { visible: false });
      return m;
    }
  }

  class World {
    constructor(def) {
      this.def = def;
      this.env = Object.assign({ sky: 'city', fog: [0.55, 0.6, 0.64], fogNear: 30, fogFar: 140, ambient: [0.42, 0.44, 0.48], sun: null }, def.env || {});
      this.legend = normLegend(def.legend || {});
      const grid = def.grid || ['.'];
      this.h = grid.length;
      this.w = grid.reduce((m, r) => Math.max(m, r.length), 0);
      this.cells = new Array(this.w * this.h);
      for (let j = 0; j < this.h; j++) {
        for (let i = 0; i < this.w; i++) {
          const ch = grid[j][i] || ' ';
          const e = this.legend[ch];
          if (!e) throw new Error(`hl2 map ${def.id}: unknown legend char '${ch}' at ${i},${j}`);
          this.cells[j * this.w + i] = e;
        }
      }
      this.buildCorners();
      const b = new Builder(this);
      if (def.build) def.build(b, this);
      this.boxes = b.boxes;
      this.ramps = b.ramps;
      this.lights = b.lights;
      this.spawns = b.spawns;
      this.zones = b.zones;
      this.paths = b.paths;
      this.spots = b.spots;
      this.ladders = b.ladders;
      this.caches = b.caches;
      this.signs = b.signs;
      this.models = b.models;
      this.buildHash();
      this.stamp = 1;
      this.boxStamp = new Uint32Array(this.boxes.length + 1);
      this.rampStamp = new Uint32Array(this.ramps.length + 1);
      this.lightCache = new Map();
      this.expoCache = new Map();
      this.nav = null;
    }

    idx(i, j) { return j * this.w + i; }
    cell(i, j) {
      if (i < 0 || j < 0 || i >= this.w || j >= this.h) return VOID;
      return this.cells[j * this.w + i];
    }
    cellAt(x, z) { return this.cell(Math.floor(x / CELL), Math.floor(z / CELL)); }

    buildCorners() {
      const W = this.w + 1, Hh = this.h + 1;
      this.corner = new Float32Array(W * Hh);
      for (let j = 0; j < Hh; j++) {
        for (let i = 0; i < W; i++) {
          let sum = 0, n = 0;
          for (const [di, dj] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
            const e = this.cell(i + di, j + dj);
            if (e.smooth) { sum += e.f; n++; }
          }
          this.corner[j * W + i] = n ? sum / n : 0;
        }
      }
    }
    cornerH(i, j) { return this.corner[j * (this.w + 1) + i]; }

    terrainH(x, z) {
      const i = Math.floor(x / CELL), j = Math.floor(z / CELL);
      const e = this.cell(i, j);
      if (!e.smooth) return e.f;
      const fx = x / CELL - i, fz = z / CELL - j;
      const h00 = this.cornerH(i, j), h10 = this.cornerH(i + 1, j), h01 = this.cornerH(i, j + 1), h11 = this.cornerH(i + 1, j + 1);
      if (fx >= fz) return h00 + (h10 - h00) * fx + (h11 - h10) * fz;
      return h00 + (h11 - h01) * fx + (h01 - h00) * fz;
    }

    buildHash() {
      const n = this.w * this.h;
      this.boxHash = new Array(n);
      this.rampHash = new Array(n);
      for (let k = 0; k < n; k++) { this.boxHash[k] = null; this.rampHash[k] = null; }
      const add = (hash, list, o, k) => {
        const i1 = Math.max(0, Math.floor(o.x1 / CELL)), i2 = Math.min(this.w - 1, Math.floor((o.x2 - 1e-4) / CELL));
        const j1 = Math.max(0, Math.floor(o.z1 / CELL)), j2 = Math.min(this.h - 1, Math.floor((o.z2 - 1e-4) / CELL));
        for (let j = j1; j <= j2; j++) {
          for (let i = i1; i <= i2; i++) {
            const id = j * this.w + i;
            (hash[id] || (hash[id] = [])).push(k);
          }
        }
      };
      this.boxes.forEach((b, k) => { b.index = k; if (b.solid) add(this.boxHash, this.boxes, b, k); });
      this.ramps.forEach((r, k) => { r.index = k; add(this.rampHash, this.ramps, r, k); });
    }

    waterAt(x, z) {
      const e = this.cellAt(x, z);
      return e.wl > e.f - 0.01 && e.wl > -INF ? e.wl : -INF;
    }
    waterType(x, z) { return this.cellAt(x, z).wt; }

    rampH(r, x, z) {
      let t;
      if (r.dir === 'x+') t = (x - r.x1) / (r.x2 - r.x1);
      else if (r.dir === 'x-') t = (r.x2 - x) / (r.x2 - r.x1);
      else if (r.dir === 'z+') t = (z - r.z1) / (r.z2 - r.z1);
      else t = (r.z2 - z) / (r.z2 - r.z1);
      return r.y0 + (r.y1 - r.y0) * H.clamp(t, 0, 1);
    }

    surfaceAt(x, z, y, r = 0.3) {
      let best = -INF;
      const pts = r > 0 ? [[x, z], [x - r, z - r], [x + r, z - r], [x - r, z + r], [x + r, z + r]] : [[x, z]];
      for (const [px, pz] of pts) {
        const i = Math.floor(px / CELL), j = Math.floor(pz / CELL);
        const e = this.cell(i, j);
        const f = e.smooth ? this.terrainH(px, pz) : e.f;
        if (f <= y + 0.02 && f > best) best = f;
        if (e.c < INF && e.top <= y + 0.02 && e.top > best) best = e.top;
        if (i >= 0 && j >= 0 && i < this.w && j < this.h) {
          const k = j * this.w + i;
          const bl = this.boxHash[k];
          if (bl) {
            for (const bi of bl) {
              const b = this.boxes[bi];
              if (px >= b.x1 && px <= b.x2 && pz >= b.z1 && pz <= b.z2 && b.y2 <= y + 0.02 && b.y2 > best) best = b.y2;
            }
          }
          const rl = this.rampHash[k];
          if (rl) {
            for (const ri of rl) {
              const rp = this.ramps[ri];
              if (px >= rp.x1 && px <= rp.x2 && pz >= rp.z1 && pz <= rp.z2) {
                const rh = this.rampH(rp, px, pz);
                if (rh <= y + 0.02 && rh > best) best = rh;
              }
            }
          }
        }
      }
      return best;
    }

    spawnY(x, z, from, r = 0.2) {
      const e = this.cellAt(x, z);
      const base = e.smooth ? this.terrainH(x, z) : e.f;
      const y = this.surfaceAt(x, z, from !== undefined && from !== null ? from : base + 1.6, r);
      return y > -1e6 ? y : base;
    }

    heightFieldAt(x, z, r, feet) {
      let best = -INF;
      const pts = [[x, z], [x - r, z - r], [x + r, z - r], [x - r, z + r], [x + r, z + r]];
      for (const [px, pz] of pts) {
        const i = Math.floor(px / CELL), j = Math.floor(pz / CELL);
        const e = this.cell(i, j);
        if (e.smooth) {
          const h = this.terrainH(px, pz);
          if (h > best) best = h;
        }
        if (i < 0 || j < 0 || i >= this.w || j >= this.h) continue;
        const rl = this.rampHash[j * this.w + i];
        if (rl) {
          for (const ri of rl) {
            const rp = this.ramps[ri];
            if (px >= rp.x1 && px <= rp.x2 && pz >= rp.z1 && pz <= rp.z2) {
              const rh = this.rampH(rp, px, pz);
              if (feet >= rp.base - 0.05 && rh > best) best = rh;
            }
          }
        }
      }
      return best;
    }

    gather(x1, y1, z1, x2, y2, z2, out) {
      const i1 = Math.floor(x1 / CELL), i2 = Math.floor(x2 / CELL), j1 = Math.floor(z1 / CELL), j2 = Math.floor(z2 / CELL);
      const st = ++this.stamp;
      for (let j = j1; j <= j2; j++) {
        for (let i = i1; i <= i2; i++) {
          const e = this.cell(i, j);
          const cx = i * CELL, cz = j * CELL;
          if (!e.smooth) {
            if (y1 < e.f) out.push({ x1: cx, y1: -INF, z1: cz, x2: cx + CELL, y2: e.f, z2: cz + CELL });
          } else {
            const lo = Math.min(this.cornerH(i, j), this.cornerH(i + 1, j), this.cornerH(i, j + 1), this.cornerH(i + 1, j + 1)) - 0.6;
            if (y1 < lo) out.push({ x1: cx, y1: -INF, z1: cz, x2: cx + CELL, y2: lo, z2: cz + CELL });
          }
          if (e.c < INF && y2 > e.c && y1 < e.top) out.push({ x1: cx, y1: e.c, z1: cz, x2: cx + CELL, y2: e.top, z2: cz + CELL });
          if (i < 0 || j < 0 || i >= this.w || j >= this.h) continue;
          const bl = this.boxHash[j * this.w + i];
          if (bl) {
            for (const bi of bl) {
              if (this.boxStamp[bi] === st) continue;
              this.boxStamp[bi] = st;
              const b = this.boxes[bi];
              if (b.x2 > x1 && b.x1 < x2 && b.y2 > y1 && b.y1 < y2 && b.z2 > z1 && b.z1 < z2) out.push(b);
            }
          }
        }
      }
      return out;
    }

    overlaps(x, y, z, hx, hh, hz, extra) {
      const list = this.gather(x - hx, y, z - hz, x + hx, y + hh, z + hz, []);
      if (extra) for (const o of extra) list.push(o);
      for (const o of list) {
        if (o.x2 > x - hx + 1e-4 && o.x1 < x + hx - 1e-4 && o.y2 > y + 1e-4 && o.y1 < y + hh - 1e-4 && o.z2 > z - hz + 1e-4 && o.z1 < z + hz - 1e-4) return o;
      }
      const hf = this.heightFieldAt(x, z, Math.min(hx, hz) * 0.9, y);
      if (hf > y + 0.05 && hf < y + hh) return { heightfield: true };
      return null;
    }

    static sweep(list, p, hx, hh, hz, axis, d) {
      const eps = 1e-4;
      const minX = p.x - hx, maxX = p.x + hx, minY = p.y, maxY = p.y + hh, minZ = p.z - hz, maxZ = p.z + hz;
      let hit = null;
      for (const o of list) {
        if (axis === 'x') {
          if (o.y2 <= minY + eps || o.y1 >= maxY - eps || o.z2 <= minZ + eps || o.z1 >= maxZ - eps) continue;
          if (d > 0 && o.x1 >= maxX - eps) { const a = o.x1 - maxX; if (a < d) { d = Math.max(0, a); hit = o; } }
          else if (d < 0 && o.x2 <= minX + eps) { const a = o.x2 - minX; if (a > d) { d = Math.min(0, a); hit = o; } }
        } else if (axis === 'z') {
          if (o.y2 <= minY + eps || o.y1 >= maxY - eps || o.x2 <= minX + eps || o.x1 >= maxX - eps) continue;
          if (d > 0 && o.z1 >= maxZ - eps) { const a = o.z1 - maxZ; if (a < d) { d = Math.max(0, a); hit = o; } }
          else if (d < 0 && o.z2 <= minZ + eps) { const a = o.z2 - minZ; if (a > d) { d = Math.min(0, a); hit = o; } }
        } else {
          if (o.x2 <= minX + eps || o.x1 >= maxX - eps || o.z2 <= minZ + eps || o.z1 >= maxZ - eps) continue;
          if (d > 0 && o.y1 >= maxY - eps) { const a = o.y1 - maxY; if (a < d) { d = Math.max(0, a); hit = o; } }
          else if (d < 0 && o.y2 <= minY + eps) { const a = o.y2 - minY; if (a > d) { d = Math.min(0, a); hit = o; } }
        }
      }
      return { d, hit };
    }

    moveBox(pos, hx, hh, delta, o = {}) {
      const step = o.step || 0;
      const extra = o.extra || null;
      const res = { hitX: null, hitZ: null, hitY: null, onGround: false, stepped: false, ground: null };
      const pad = step + 0.1;
      const x1 = Math.min(pos.x, pos.x + delta.x) - hx - 0.1, x2 = Math.max(pos.x, pos.x + delta.x) + hx + 0.1;
      const z1 = Math.min(pos.z, pos.z + delta.z) - hx - 0.1, z2 = Math.max(pos.z, pos.z + delta.z) + hx + 0.1;
      const y1 = Math.min(pos.y, pos.y + delta.y) - 0.1, y2 = Math.max(pos.y, pos.y + delta.y) + hh + pad;
      const list = this.gather(x1, y1, z1, x2, y2, z2, []);
      if (extra) for (const e of extra) if (e.x2 > x1 && e.x1 < x2 && e.y2 > y1 && e.y1 < y2 && e.z2 > z1 && e.z1 < z2) list.push(e);
      const hz = o.hz || hx;
      const horiz = (axis, d) => {
        if (Math.abs(d) < 1e-7) return;
        const r = World.sweep(list, pos, hx, hh, hz, axis, d);
        let moved = r.d;
        let hit = r.hit;
        if (hit && step > 0 && o.grounded && Math.abs(moved) < Math.abs(d) - 1e-4) {
          const up = World.sweep(list, pos, hx, hh, hz, 'y', step);
          if (up.d > 0.05) {
            const raised = { x: pos.x, y: pos.y + up.d, z: pos.z };
            const r2 = World.sweep(list, raised, hx, hh, hz, axis, d);
            if (Math.abs(r2.d) > Math.abs(moved) + 1e-3) {
              raised[axis] += r2.d;
              const down = World.sweep(list, raised, hx, hh, hz, 'y', -up.d);
              const landY = raised.y + down.d;
              if (down.hit || landY <= pos.y + 1e-3) {
                pos[axis] = raised[axis];
                pos.y = landY;
                res.stepped = true;
                hit = r2.hit;
                moved = null;
              }
            }
          }
        }
        if (moved !== null) pos[axis] += moved;
        if (hit) res[axis === 'x' ? 'hitX' : 'hitZ'] = hit;
        const hf = this.heightFieldAt(pos.x, pos.z, Math.min(hx, hz) * 0.9, pos.y);
        if (hf > pos.y) {
          const rise = hf - pos.y;
          const run = moved !== null ? Math.abs(moved) : Math.abs(d);
          if (o.climbAny || (rise <= Math.max(step, 0.02) + 0.05 && rise <= (o.maxSlope || 1.15) * run + 0.03)) {
            const up = World.sweep(list, pos, hx, hh, hz, 'y', hf - pos.y);
            pos.y += up.d;
          } else if (moved !== null) {
            pos[axis] -= moved;
            res[axis === 'x' ? 'hitX' : 'hitZ'] = { heightfield: true };
          }
        }
      };
      horiz('x', delta.x);
      horiz('z', delta.z);
      if (Math.abs(delta.y) > 1e-7) {
        const r = World.sweep(list, pos, hx, hh, hz, 'y', delta.y);
        pos.y += r.d;
        if (r.hit) {
          res.hitY = r.hit;
          if (delta.y < 0) { res.onGround = true; res.ground = r.hit; }
        }
      }
      const hf = this.heightFieldAt(pos.x, pos.z, Math.min(hx, hz) * 0.9, pos.y);
      if (hf > -INF && pos.y <= hf + 0.02 && delta.y <= 0.001) {
        if (pos.y < hf) pos.y = hf;
        res.onGround = true;
        res.ground = res.ground || { heightfield: true };
        if (delta.y < 0 && !res.hitY) res.hitY = res.ground;
      }
      return res;
    }

    raycast(o, d, maxT, opt = {}) {
      const best = { t: maxT, n: null, tex: null, box: null };
      const dx = d.x, dy = d.y, dz = d.z;
      let i = Math.floor(o.x / CELL), j = Math.floor(o.z / CELL);
      const stepI = dx > 0 ? 1 : -1, stepJ = dz > 0 ? 1 : -1;
      const tDX = Math.abs(dx) > 1e-9 ? CELL / Math.abs(dx) : INF;
      const tDZ = Math.abs(dz) > 1e-9 ? CELL / Math.abs(dz) : INF;
      let tMaxX = Math.abs(dx) > 1e-9 ? ((dx > 0 ? (i + 1) * CELL - o.x : o.x - i * CELL) / Math.abs(dx)) : INF;
      let tMaxZ = Math.abs(dz) > 1e-9 ? ((dz > 0 ? (j + 1) * CELL - o.z : o.z - j * CELL) / Math.abs(dz)) : INF;
      let tEnter = 0;
      let enterN = null;
      const st = ++this.stamp;
      const water = opt.water;
      for (let guard = 0; guard < 4000; guard++) {
        const tExit = Math.min(tMaxX, tMaxZ, maxT);
        const e = this.cell(i, j);
        this.rayCell(e, i, j, o, d, tEnter, tExit, enterN, best, st, water);
        if (best.t <= tExit + 1e-6) break;
        if (tExit >= maxT) break;
        if (tMaxX < tMaxZ) { i += stepI; tEnter = tMaxX; tMaxX += tDX; enterN = { x: -stepI, y: 0, z: 0 }; }
        else { j += stepJ; tEnter = tMaxZ; tMaxZ += tDZ; enterN = { x: 0, y: 0, z: -stepJ }; }
        if (i < -2 || j < -2 || i > this.w + 1 || j > this.h + 1) break;
      }
      if (!best.n) return null;
      best.point = { x: o.x + dx * best.t, y: o.y + dy * best.t, z: o.z + dz * best.t };
      return best;
    }

    rayCell(e, i, j, o, d, t0, t1, enterN, best, st, water) {
      if (t0 > best.t) return;
      const y0 = o.y + d.y * t0, y1 = o.y + d.y * t1;
      const setHit = (t, n, tex) => {
        if (t < best.t && t >= 0) { best.t = t; best.n = n; best.tex = tex; best.box = null; best.cell = e; }
      };
      if (e.solidVoid || i < 0 || j < 0 || i >= this.w || j >= this.h) {
        if (y0 < e.f || e.solidVoid) setHit(t0, enterN || { x: 0, y: 1, z: 0 }, e.w);
      }
      if (!e.smooth) {
        if (y0 < e.f - 1e-6) setHit(t0, enterN || { x: 0, y: 1, z: 0 }, e.w);
        else if (d.y < 0 && y1 < e.f) setHit((e.f - o.y) / d.y, { x: 0, y: 1, z: 0 }, e.t);
      } else {
        this.rayTerrain(i, j, o, d, t0, t1, setHit, e);
      }
      if (e.c < INF) {
        if (y0 > e.c && y0 < e.top) setHit(t0, enterN || { x: 0, y: -1, z: 0 }, e.w);
        else if (d.y > 0 && y0 <= e.c && y1 > e.c) setHit((e.c - o.y) / d.y, { x: 0, y: -1, z: 0 }, e.ct);
        else if (d.y < 0 && y0 >= e.top && y1 < e.top) setHit((e.top - o.y) / d.y, { x: 0, y: 1, z: 0 }, e.rt);
      }
      if (water && e.wl > -INF && e.wl > e.f) {
        if (d.y < 0 && y0 >= e.wl && y1 < e.wl) {
          const t = (e.wl - o.y) / d.y;
          if (t < best.t) { best.t = t; best.n = { x: 0, y: 1, z: 0 }; best.tex = e.wt; best.water = true; best.box = null; }
        }
      }
      if (i < 0 || j < 0 || i >= this.w || j >= this.h) return;
      const k = j * this.w + i;
      const bl = this.boxHash[k];
      if (bl) {
        for (const bi of bl) {
          if (this.boxStamp[bi] === st) continue;
          this.boxStamp[bi] = st;
          const b = this.boxes[bi];
          const h = H.rayBox(o, d, b.x1, b.y1, b.z1, b.x2, b.y2, b.z2);
          if (h && h.t < best.t && h.t >= 0) {
            best.t = h.t; best.n = h.n; best.box = b; best.cell = null;
            best.tex = h.n.y > 0.5 ? b.top : h.n.y < -0.5 ? b.bottom : b.side;
          }
        }
      }
      const rl = this.rampHash[k];
      if (rl) {
        for (const ri of rl) {
          if (this.rampStamp[ri] === st) continue;
          this.rampStamp[ri] = st;
          this.rayRamp(this.ramps[ri], o, d, best);
        }
      }
    }

    rayRamp(r, o, d, best) {
      const bb = H.rayBox(o, d, r.x1, r.base, r.z1, r.x2, Math.max(r.y0, r.y1), r.z2);
      if (!bb) return;
      let tIn = bb.t, tOut = bb.tOut;
      const steps = 12;
      let prev = null;
      for (let s = 0; s <= steps; s++) {
        const t = tIn + (tOut - tIn) * (s / steps);
        const px = o.x + d.x * t, py = o.y + d.y * t, pz = o.z + d.z * t;
        const below = py <= this.rampH(r, px, pz) + 1e-4;
        if (below) {
          let tt = t;
          if (prev !== null) {
            let a = prev, b = t;
            for (let k = 0; k < 8; k++) {
              const m = (a + b) / 2;
              const my = o.y + d.y * m;
              if (my <= this.rampH(r, o.x + d.x * m, o.z + d.z * m)) b = m; else a = m;
            }
            tt = b;
          }
          if (tt < best.t) {
            best.t = tt; best.box = null; best.cell = null; best.tex = r.tex;
            best.n = s === 0 ? bb.n : this.rampNormal(r);
          }
          return;
        }
        prev = t;
      }
    }

    rampNormal(r) {
      const len = r.dir[0] === 'x' ? r.x2 - r.x1 : r.z2 - r.z1;
      const rise = r.y1 - r.y0;
      const l = Math.hypot(len, rise) || 1;
      const s = r.dir[1] === '+' ? -1 : 1;
      if (r.dir[0] === 'x') return { x: s * rise / l, y: len / l, z: 0 };
      return { x: 0, y: len / l, z: s * rise / l };
    }

    rayTerrain(i, j, o, d, t0, t1, setHit, e) {
      const x0 = i * CELL, z0 = j * CELL;
      const p00 = { x: x0, y: this.cornerH(i, j), z: z0 };
      const p10 = { x: x0 + CELL, y: this.cornerH(i + 1, j), z: z0 };
      const p01 = { x: x0, y: this.cornerH(i, j + 1), z: z0 + CELL };
      const p11 = { x: x0 + CELL, y: this.cornerH(i + 1, j + 1), z: z0 + CELL };
      for (const tri of [[p00, p11, p10], [p00, p01, p11]]) {
        const h = H.rayTri(o, d, tri[0], tri[1], tri[2]);
        if (h && h.t >= t0 - 1e-4 && h.t <= t1 + 1e-4) setHit(h.t, h.n, e.t);
      }
      const y0 = o.y + d.y * t0;
      const px = o.x + d.x * t0, pz = o.z + d.z * t0;
      if (y0 < this.terrainH(px, pz) - 0.05) setHit(t0, { x: 0, y: 1, z: 0 }, e.t);
    }

    lineClear(a, b) {
      const d = H.vsub(b, a);
      const len = H.vlen(d);
      if (len < 1e-4) return true;
      const h = this.raycast(a, H.vscale(d, 1 / len), len);
      return !h;
    }

    lightAt(x, y, z) {
      const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
      let v = this.lightCache.get(key);
      if (!v) {
        const p = { x: Math.floor(x) + 0.5, y: Math.floor(y) + 0.5, z: Math.floor(z) + 0.5 };
        const up = this.bakeLight(p, { x: 0, y: 1, z: 0 }, true);
        const s1 = this.bakeLight(p, { x: 0.7, y: 0.3, z: 0.6 }, true);
        const s2 = this.bakeLight(p, { x: -0.7, y: 0.3, z: -0.6 }, true);
        v = [(up[0] + s1[0] + s2[0]) / 3, (up[1] + s1[1] + s2[1]) / 3, (up[2] + s1[2] + s2[2]) / 3];
        this.lightCache.set(key, v);
      }
      return v;
    }

    exposure(p) {
      const key = `${Math.round(p.x * 2)},${Math.round(p.y * 2)},${Math.round(p.z * 2)}`;
      let v = this.expoCache.get(key);
      if (v === undefined) {
        const dirs = [[0, 1, 0], [0.5, 0.8, 0], [-0.5, 0.8, 0], [0, 0.8, 0.5], [0, 0.8, -0.5]];
        let open = 0;
        for (const dd of dirs) {
          const dn = H.vnorm({ x: dd[0], y: dd[1], z: dd[2] });
          if (!this.raycast(p, dn, 80)) open++;
        }
        v = open / dirs.length;
        this.expoCache.set(key, v);
      }
      return v;
    }

    bakeLight(p, n, soft) {
      const env = this.env;
      const q = { x: p.x + n.x * 0.12, y: p.y + n.y * 0.12, z: p.z + n.z * 0.12 };
      const expo = this.exposure(q);
      const hemi = 0.72 + 0.28 * n.y;
      const indoor = env.indoorAmbient || [0.2, 0.2, 0.22];
      let r = indoor[0] + (env.ambient[0] - indoor[0]) * expo;
      let g = indoor[1] + (env.ambient[1] - indoor[1]) * expo;
      let b = indoor[2] + (env.ambient[2] - indoor[2]) * expo;
      r *= hemi; g *= hemi; b *= hemi;
      if (env.sun && expo > 0) {
        const sd = H.vnorm({ x: -env.sun.dir[0], y: -env.sun.dir[1], z: -env.sun.dir[2] });
        const nd = n.x * sd.x + n.y * sd.y + n.z * sd.z;
        if (nd > 0 || soft) {
          const lit = this.raycast(q, sd, 150) ? 0 : 1;
          const k = Math.max(0, soft ? 0.5 + nd * 0.5 : nd) * lit;
          r += env.sun.col[0] * k; g += env.sun.col[1] * k; b += env.sun.col[2] * k;
        }
      }
      for (const l of this.lights) {
        const lx = l.x - q.x, ly = l.y - q.y, lz = l.z - q.z;
        const dist = Math.sqrt(lx * lx + ly * ly + lz * lz);
        if (dist >= l.radius) continue;
        const inv = 1 / (dist || 1);
        const nd = soft ? 0.6 + 0.4 * ((lx * n.x + ly * n.y + lz * n.z) * inv) : (lx * n.x + ly * n.y + lz * n.z) * inv;
        if (nd <= 0) continue;
        const fall = 1 - dist / l.radius;
        const vis = this.raycast(q, { x: lx * inv, y: ly * inv, z: lz * inv }, Math.max(0, dist - 0.3)) ? 0 : 1;
        if (!vis) continue;
        const k = nd * fall * fall * 1.6;
        r += l.r * k; g += l.g * k; b += l.b * k;
      }
      return [Math.min(r, 1.6), Math.min(g, 1.6), Math.min(b, 1.6)];
    }

    zoneHas(id, p) {
      const z = this.zones[id];
      if (!z) return false;
      return p.x >= z.x1 && p.x <= z.x2 && p.z >= z.z1 && p.z <= z.z2 && p.y >= z.y1 && p.y <= z.y2;
    }

    onLadder(p, r) {
      for (const l of this.ladders) {
        if (p.x + r >= l.x1 - 0.25 && p.x - r <= l.x2 + 0.25 && p.z + r >= l.z1 - 0.25 && p.z - r <= l.z2 + 0.25 && p.y >= l.y0 - 0.2 && p.y <= l.y1 + 0.2) return l;
      }
      return null;
    }

    buildNav() {
      const res = 1;
      const nw = this.w * CELL / res, nh = this.h * CELL / res;
      const nodes = [];
      const grid = new Array(nw * nh);
      const agentR = 0.3, agentH = 1.5;
      for (let j = 0; j < nh; j++) {
        for (let i = 0; i < nw; i++) {
          const x = (i + 0.5) * res, z = (j + 0.5) * res;
          const e = this.cellAt(x, z);
          if (e.solidVoid) { grid[j * nw + i] = null; continue; }
          const cand = [];
          cand.push(e.smooth ? this.terrainH(x, z) : e.f);
          if (e.c < INF) cand.push(e.top);
          const k = Math.floor(z / CELL) * this.w + Math.floor(x / CELL);
          const bl = this.boxHash[k];
          if (bl) for (const bi of bl) { const b = this.boxes[bi]; if (b.nav && x >= b.x1 && x <= b.x2 && z >= b.z1 && z <= b.z2) cand.push(b.y2); }
          const rl = this.rampHash[k];
          if (rl) for (const ri of rl) { const r = this.ramps[ri]; if (x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2) cand.push(this.rampH(r, x, z)); }
          cand.sort((a, b) => a - b);
          const list = [];
          let last = -INF;
          for (const hgt of cand) {
            if (hgt - last < 0.3) continue;
            const surf = this.surfaceAt(x, z, hgt + 0.05, 0);
            if (Math.abs(surf - hgt) > 0.08) continue;
            if (this.overlaps(x, hgt + 0.25, z, agentR, agentH, agentR, null)) continue;
            last = hgt;
            const wl = e.wl > e.f ? e.wl : -INF;
            const node = { id: nodes.length, x, y: hgt, z, i, j, links: [], deep: wl - hgt > 1.1, hurt: !!e.hurt, sand: !!e.sand };
            nodes.push(node);
            list.push(node);
          }
          grid[j * nw + i] = list.length ? list : null;
        }
      }
      const at = (i, j) => (i < 0 || j < 0 || i >= nw || j >= nh ? null : grid[j * nw + i]);
      for (const n of nodes) {
        for (let dj = -1; dj <= 1; dj++) {
          for (let di = -1; di <= 1; di++) {
            if (!di && !dj) continue;
            const list = at(n.i + di, n.j + dj);
            if (!list) continue;
            for (const m of list) {
              const dy = m.y - n.y;
              if (dy > 0.62) continue;
              const drop = dy < -0.62;
              if (dy < -4.5) continue;
              if (di && dj) {
                const a = at(n.i + di, n.j), b = at(n.i, n.j + dj);
                const okA = a && a.some(q => Math.abs(q.y - n.y) < 0.7 || Math.abs(q.y - m.y) < 0.7);
                const okB = b && b.some(q => Math.abs(q.y - n.y) < 0.7 || Math.abs(q.y - m.y) < 0.7);
                if (!okA || !okB) continue;
              }
              const mx = (n.x + m.x) / 2, mz = (n.z + m.z) / 2, my = Math.max(n.y, m.y);
              if (!drop && this.overlaps(mx, my + 0.3, mz, agentR * 0.9, agentH - 0.1, agentR * 0.9, null)) continue;
              const cost = Math.hypot(di, dj) * res + (drop ? 2 + Math.abs(dy) : Math.max(0, dy)) + (m.hurt ? 30 : 0) + (m.deep ? 6 : 0);
              n.links.push({ to: m.id, cost, drop });
            }
          }
        }
      }
      this.nav = { res, nw, nh, grid, nodes };
      return this.nav;
    }

    navNode(p, maxDy = 2.2) {
      const nav = this.nav || this.buildNav();
      const ci = Math.floor(p.x / nav.res), cj = Math.floor(p.z / nav.res);
      let best = null, bestD = INF;
      for (let r = 0; r <= 3 && !best; r++) {
        for (let dj = -r; dj <= r; dj++) {
          for (let di = -r; di <= r; di++) {
            if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
            const i = ci + di, j = cj + dj;
            if (i < 0 || j < 0 || i >= nav.nw || j >= nav.nh) continue;
            const list = nav.grid[j * nav.nw + i];
            if (!list) continue;
            for (const n of list) {
              const dy = p.y - n.y;
              if (dy < -0.8 || dy > maxDy) continue;
              const d = Math.hypot(n.x - p.x, n.z - p.z) + Math.abs(dy) * 0.5;
              if (d < bestD) { bestD = d; best = n; }
            }
          }
        }
      }
      return best;
    }

    findPath(from, to, o = {}) {
      const nav = this.nav || this.buildNav();
      const a = this.navNode(from), b = this.navNode(to, o.targetDy || 2.2);
      if (!a || !b) return null;
      if (a === b) return [{ x: to.x, y: b.y, z: to.z }];
      const maxN = o.max || 6000;
      const g = new Map(), came = new Map();
      const heap = new H.Heap();
      g.set(a.id, 0);
      heap.push(a.id, 0);
      const hfn = n => Math.hypot(n.x - b.x, n.z - b.z) + Math.abs(n.y - b.y);
      let found = false, count = 0;
      const closed = new Set();
      while (heap.size && count < maxN) {
        const id = heap.pop();
        if (closed.has(id)) continue;
        closed.add(id);
        count++;
        if (id === b.id) { found = true; break; }
        const n = nav.nodes[id];
        const gn = g.get(id);
        for (const l of n.links) {
          if (o.noDeep && nav.nodes[l.to].deep) continue;
          if (o.noSand && nav.nodes[l.to].sand) continue;
          const ng = gn + l.cost;
          const old = g.get(l.to);
          if (old === undefined || ng < old) {
            g.set(l.to, ng);
            came.set(l.to, id);
            heap.push(l.to, ng + hfn(nav.nodes[l.to]));
          }
        }
      }
      if (!found) return null;
      const pts = [];
      let cur = b.id;
      while (cur !== undefined && cur !== a.id) {
        const n = nav.nodes[cur];
        pts.push({ x: n.x, y: n.y, z: n.z });
        cur = came.get(cur);
      }
      pts.reverse();
      return this.smoothPath(from, pts);
    }

    walkLine(a, b) {
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      const n = Math.ceil(d / 0.5);
      let y = a.y;
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const p = { x: a.x + (b.x - a.x) * t, y, z: a.z + (b.z - a.z) * t };
        const node = this.navNode(p, 0.7);
        if (!node || Math.abs(node.y - y) > 0.65 || Math.hypot(node.x - p.x, node.z - p.z) > 0.9) return false;
        y = node.y;
      }
      return true;
    }

    smoothPath(from, pts) {
      if (pts.length < 3) return pts;
      const out = [];
      let anchor = { x: from.x, y: pts[0].y, z: from.z };
      let k = 0;
      while (k < pts.length) {
        let far = k;
        for (let m = pts.length - 1; m > k; m--) {
          if (m - k > 24) continue;
          if (this.walkLine(anchor, pts[m])) { far = m; break; }
        }
        out.push(pts[far]);
        anchor = pts[far];
        k = far + 1;
      }
      return out;
    }
  }

  H.rayBox = (o, d, x1, y1, z1, x2, y2, z2) => {
    let tmin = -INF, tmax = INF, n = null;
    const axes = [['x', x1, x2, { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], ['y', y1, y2, { x: 0, y: -1, z: 0 }, { x: 0, y: 1, z: 0 }], ['z', z1, z2, { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 }]];
    for (const [ax, lo, hi, nlo, nhi] of axes) {
      const od = o[ax], dd = d[ax];
      if (Math.abs(dd) < 1e-12) {
        if (od < lo || od > hi) return null;
        continue;
      }
      let t1 = (lo - od) / dd, t2 = (hi - od) / dd;
      let n1 = nlo, n2 = nhi;
      if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; const nn = n1; n1 = n2; n2 = nn; }
      if (t1 > tmin) { tmin = t1; n = n1; }
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return null;
    }
    if (tmax < 0) return null;
    if (tmin < 0) return { t: 0, tOut: tmax, n: n || { x: 0, y: 1, z: 0 }, inside: true };
    return { t: tmin, tOut: tmax, n };
  };

  H.rayTri = (o, d, a, b, c) => {
    const e1 = H.vsub(b, a), e2 = H.vsub(c, a);
    const p = H.vcross(d, e2);
    const det = H.vdot(e1, p);
    if (Math.abs(det) < 1e-9) return null;
    const inv = 1 / det;
    const s = H.vsub(o, a);
    const u = H.vdot(s, p) * inv;
    if (u < 0 || u > 1) return null;
    const q = H.vcross(s, e1);
    const v = H.vdot(d, q) * inv;
    if (v < 0 || u + v > 1) return null;
    const t = H.vdot(e2, q) * inv;
    if (t < 0) return null;
    let n = H.vnorm(H.vcross(e1, e2));
    if (n.y < 0) n = H.vscale(n, -1);
    return { t, n };
  };

  H.World = World;
  H.Builder = Builder;
  H.INF = INF;
  H.maps = H.maps || {};

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
