(function (S) {
  'use strict';
  const { clamp } = S;
  const CELL = 4;

  class World {
    constructor(def) {
      this.def = def;
      this.boxes = def.boxes.filter(b => b.solid !== false);
      this.grid = new Map();
      for (const b of this.boxes) {
        for (let gx = Math.floor(b.x0 / CELL); gx <= Math.floor(b.x1 / CELL); gx++) for (let gz = Math.floor(b.z0 / CELL); gz <= Math.floor(b.z1 / CELL); gz++) {
          const k = gx * 65536 + gz; let l = this.grid.get(k); if (!l) this.grid.set(k, l = []); l.push(b);
        }
      }
      this.mark = 0; this.dyn = [];
      this.voidY = def.voidY == null ? -12 : def.voidY;
    }
    near(x0, z0, x1, z1, fn) {
      this.mark++;
      for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++) for (let gz = Math.floor(z0 / CELL); gz <= Math.floor(z1 / CELL); gz++) {
        const l = this.grid.get(gx * 65536 + gz); if (!l) continue;
        for (const b of l) { if (b.mk === this.mark) continue; b.mk = this.mark; if (fn(b) === false) return; }
      }
      for (const b of this.dyn) if (b.on && b.x1 >= x0 && b.x0 <= x1 && b.z1 >= z0 && b.z0 <= z1) if (fn(b) === false) return;
    }
    groundAt(x, z, r = 0.3, yRef = 1e9, step = 0.45) {
      let best = -Infinity;
      this.near(x - r, z - r, x + r, z + r, b => {
        if (b.noWalk || b.y1 > yRef + step) return;
        if (x + r * 0.6 < b.x0 || x - r * 0.6 > b.x1 || z + r * 0.6 < b.z0 || z - r * 0.6 > b.z1) return;
        if (b.y1 > best) best = b.y1;
      });
      return best;
    }
    collide(e, step = 0.45) {
      const r = e.r, y0 = e.y + step, y1 = e.y + e.h;
      let hit = false;
      for (let pass = 0; pass < 2; pass++) {
        this.near(e.x - r, e.z - r, e.x + r, e.z + r, b => {
          if (b.y1 <= y0 || b.y0 >= y1 || (b.pass && e.team === 'foe')) return;
          const cx = clamp(e.x, b.x0, b.x1), cz = clamp(e.z, b.z0, b.z1);
          let dx = e.x - cx, dz = e.z - cz; const d2 = dx * dx + dz * dz;
          if (d2 >= r * r) return;
          if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; e.x += dx * k; e.z += dz * k; }
          else {
            const px = Math.min(e.x - b.x0, b.x1 - e.x), pz = Math.min(e.z - b.z0, b.z1 - e.z);
            if (px < pz) e.x = e.x - b.x0 < b.x1 - e.x ? b.x0 - r : b.x1 + r; else e.z = e.z - b.z0 < b.z1 - e.z ? b.z0 - r : b.z1 + r;
          }
          hit = true;
        });
      }
      const B = this.def.bounds;
      if (B) { e.x = clamp(e.x, B[0] + r, B[2] - r); e.z = clamp(e.z, B[1] + r, B[3] - r); }
      return hit;
    }
    ray(ox, oy, oz, dx, dy, dz, max, opaqueOnly = true) {
      let best = max;
      const x1 = ox + dx * max, z1 = oz + dz * max;
      this.near(Math.min(ox, x1) - 0.1, Math.min(oz, z1) - 0.1, Math.max(ox, x1) + 0.1, Math.max(oz, z1) + 0.1, b => {
        if (opaqueOnly && (b.seeThrough || b.pass)) return;
        let t0 = 0, t1 = best;
        for (const [o, d, lo, hi] of [[ox, dx, b.x0, b.x1], [oy, dy, b.y0, b.y1], [oz, dz, b.z0, b.z1]]) {
          if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return; continue; }
          let a = (lo - o) / d, c = (hi - o) / d; if (a > c) { const s = a; a = c; c = s; }
          if (a > t0) t0 = a; if (c < t1) t1 = c; if (t0 > t1) return;
        }
        if (t0 < best) best = t0;
      });
      return best;
    }
    see(a, b) {
      const dx = b.x - a.x, dy = (b.y + 1.2) - (a.y + 1.2), dz = b.z - a.z, d = Math.hypot(dx, dy, dz) || 1;
      return this.ray(a.x, a.y + 1.2, a.z, dx / d, dy / d, dz / d, d) >= d - 0.3;
    }
  }

  class Builder {
    constructor(id) {
      this.def = { id, boxes: [], props: [], lights: [], doors: [], fights: [], grips: [], triggers: [], items: [], spawns: {}, statues: [], breakables: [], orbs: [], fx: [], hazards: [], switches: [], barriers: [], foes: [], special: [], env: null, bounds: null };
    }
    env(o) { this.def.env = Object.assign({ amb: [0.35, 0.33, 0.4], sun: [0.3, 0.8, 0.4], sunCol: [0.5, 0.48, 0.45], fog: [0.05, 0.05, 0.08], fogD: 0.025, sky: 'night', music: 'explore' }, o); return this; }
    bounds(x0, z0, x1, z1) { this.def.bounds = [x0, z0, x1, z1]; return this; }
    box(x0, y0, z0, x1, y1, z1, tex = 'stone', o = {}) {
      const b = Object.assign({ x0: Math.min(x0, x1), y0: Math.min(y0, y1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1: Math.max(y0, y1), z1: Math.max(z0, z1), tex, top: o.top || tex, side: o.side || tex, uvs: 2, render: true }, o);
      this.def.boxes.push(b); return b;
    }
    floor(x0, z0, x1, z1, y = 0, tex = 'stone', o = {}) { return this.box(x0, y - 1, z0, x1, y, z1, o.side || tex, Object.assign({ top: tex, noBottom: true }, o)); }
    ceil(x0, z0, x1, z1, y, tex = 'stone', o = {}) { return this.box(x0, y, z0, x1, y + 0.6, z1, tex, Object.assign({ noWalk: true }, o)); }
    wallX(z, x0, x1, h, tex = 'stone', gaps = [], o = {}) {
      const t = o.t || 0.6, y = o.y || 0; let cur = Math.min(x0, x1); const end = Math.max(x0, x1);
      for (const g of gaps.slice().sort((a, b) => a[0] - b[0])) {
        if (g[0] > cur) this.box(cur, y, z - t / 2, g[0], y + h, z + t / 2, tex, o);
        if (g[2] != null && g[2] < h) this.box(g[0], y + g[2], z - t / 2, g[1], y + h, z + t / 2, tex, o);
        cur = g[1];
      }
      if (end > cur) this.box(cur, y, z - t / 2, end, y + h, z + t / 2, tex, o);
      return this;
    }
    wallZ(x, z0, z1, h, tex = 'stone', gaps = [], o = {}) {
      const t = o.t || 0.6, y = o.y || 0; let cur = Math.min(z0, z1); const end = Math.max(z0, z1);
      for (const g of gaps.slice().sort((a, b) => a[0] - b[0])) {
        if (g[0] > cur) this.box(x - t / 2, y, cur, x + t / 2, y + h, g[0], tex, o);
        if (g[2] != null && g[2] < h) this.box(x - t / 2, y + g[2], g[0], x + t / 2, y + h, g[1], tex, o);
        cur = g[1];
      }
      if (end > cur) this.box(x - t / 2, y, cur, x + t / 2, y + h, end, tex, o);
      return this;
    }
    room(x0, z0, x1, z1, h, o = {}) {
      const w = o.wall || 'stone', g = o.gaps || {};
      this.floor(x0, z0, x1, z1, o.y || 0, o.floor || 'stone');
      this.wallX(z0, x0, x1, h, w, g.s || [], { y: o.y || 0 }); this.wallX(z1, x0, x1, h, w, g.n || [], { y: o.y || 0 });
      this.wallZ(x0, z0, z1, h, w, g.w || [], { y: o.y || 0 }); this.wallZ(x1, z0, z1, h, w, g.e || [], { y: o.y || 0 });
      if (o.ceil) this.ceil(x0, z0, x1, z1, (o.y || 0) + h, o.ceil);
      this.bounds(x0, z0, x1, z1);
      return this;
    }
    pillar(x, z, r, h, tex = 'marble', o = {}) { this.box(x - r, o.y || 0, z - r, x + r, (o.y || 0) + h, z + r, tex, o); this.prop('capital', x, (o.y || 0) + h, z, 0, r); return this; }
    stairs(x0, z0, x1, z1, y0, y1, dir, tex = 'stone') {
      const n = Math.max(1, Math.ceil(Math.abs(y1 - y0) / 0.3));
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n, y = y0 + (y1 - y0) * t1;
        if (dir === 'n') this.box(x0, y0 - 0.1, z0 + (z1 - z0) * t0, x1, y, z1, tex);
        else if (dir === 's') this.box(x0, y0 - 0.1, z0, x1, y, z1 - (z1 - z0) * t0, tex);
        else if (dir === 'e') this.box(x0 + (x1 - x0) * t0, y0 - 0.1, z0, x1, y, z1, tex);
        else this.box(x0, y0 - 0.1, z0, x1 - (x1 - x0) * t0, y, z1, tex);
      }
      return this;
    }
    light(x, y, z, r, c) { this.def.lights.push({ x, y, z, r, c }); return this; }
    prop(kind, x, y, z, rot = 0, s = 1, o = {}) { const p = Object.assign({ kind, x, y, z, rot, s }, o); this.def.props.push(p); return p; }
    solidProp(kind, x, y, z, rot, s, hx, hy, hz, o = {}) {
      this.prop(kind, x, y, z, rot, s, o);
      const sw = Math.abs(Math.sin(rot)) > 0.7; const ax = sw ? hz : hx, az = sw ? hx : hz;
      this.box(x - ax, y, z - az, x + ax, y + hy, z + az, 'stone', { render: false });
      return this;
    }
    breakable(kind, x, z, y = 0, orbs = 6, rot = 0) { this.def.breakables.push({ kind, x, y, z, orbs, rot }); return this; }
    orbs(x, y, z, n = 1, kind = 'red') { this.def.orbs.push({ x, y, z, n, kind }); return this; }
    door(id, x, z, face, to, o = {}) {
      const d = Object.assign({ id, x, z, face, to, w: 3, h: 4, y: 0 }, o), fx = Math.sin(face), fz = Math.cos(face), bx = x - fx * 0.9, bz = z - fz * 0.9;
      this.def.doors.push(d);
      if (Math.abs(fx) > 0.5) this.box(bx - 0.3, d.y - 1, z - d.w / 2 - 0.3, bx + 0.3, d.y + 7, z + d.w / 2 + 0.3, 'stone', { render: false });
      else this.box(x - d.w / 2 - 0.3, d.y - 1, bz - 0.3, x + d.w / 2 + 0.3, d.y + 7, bz + 0.3, 'stone', { render: false });
      return this;
    }
    spawn(id, x, z, face = 0, y = 0) { this.def.spawns[id] = { x, y, z, face }; return this; }
    statue(x, z, face = 0, y = 0) { this.def.statues.push({ x, y, z, face }); this.box(x - 0.7, y, z - 0.7, x + 0.7, y + 3.2, z + 0.7, 'stone', { render: false }); return this; }
    fight(id, zone, waves, o = {}) { this.def.fights.push(Object.assign({ id, zone, waves, seal: true }, o)); return this; }
    grip(x, y, z, o = {}) { this.def.grips.push(Object.assign({ x, y, z }, o)); return this; }
    trigger(id, zone, o = {}) { this.def.triggers.push(Object.assign({ id, zone }, o)); return this; }
    item(id, x, y, z, o = {}) { this.def.items.push(Object.assign({ id, x, y, z }, o)); return this; }
    fx(kind, x, y, z, o = {}) { this.def.fx.push(Object.assign({ kind, x, y, z }, o)); return this; }
    hazard(kind, zone, o = {}) { this.def.hazards.push(Object.assign({ kind, zone }, o)); return this; }
    sw(id, x, y, z, o = {}) { this.def.switches.push(Object.assign({ id, x, y, z }, o)); return this; }
    barrier(id, x0, z0, x1, z1, o = {}) { this.def.barriers.push(Object.assign({ id, x0, z0, x1, z1, h: 5 }, o)); return this; }
    foe(type, x, z, o = {}) { this.def.foes.push(Object.assign({ type, x, z }, o)); return this; }
    special(kind, o = {}) { this.def.special.push(Object.assign({ kind }, o)); return this; }
    done() { if (!this.def.env) this.env({}); return this.def; }
  }

  S.World = World; S.Builder = Builder;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
