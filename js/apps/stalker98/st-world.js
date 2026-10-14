/**
 * S.T.A.L.K.E.R. 98 — level builder DSL and the compiled world:
 * sculpted heightfield (hills, embankments, ravines, road beds, building sites, holes for tunnels and bunkers),
 * axis-aligned boxes, cylinder movement with steps and steep-slope blocking, ray casts, and a 1 m nav grid with A*.
 */
(function (S) {
  'use strict';
  const { clamp, smooth, fbm, lerp, lineDist, RNG } = S;
  const STEP = 0.55, GRAVITY = 20, CELL = 4, NOHOLE = -1000;

  // ================================================================ level builder
  // Directions: N = +z, S = -z, E = +x, W = -x. All y values are absolute.
  class Builder {
    constructor(opt) {
      this.opt = opt;
      this.T = Object.assign({ seed: 1, amp: 3, scale: 70, base: 0, hills: [], ridges: [], ravines: [], flats: [], holes: [], roads: [] }, opt.terrain || {});
      this.boxes = []; this.props = []; this.roads = []; this.rails = []; this.trees = []; this.npcs = []; this.mutants = []; this.items = [];
      this.stashes = []; this.anomalies = []; this.arts = []; this.rads = []; this.zones = []; this.exits = []; this.spawns = {}; this.lights = [];
      this.waters = []; this.paths = {}; this.signs = []; this.clear = [];
      this.hm = null; this.rng = RNG(this.T.seed * 977 + 5);
    }
    // ---- terrain (must be declared before ready())
    hill(x, z, r, h, o = {}) { this.T.hills.push(Object.assign({ x, z, r, h }, o)); }
    ridge(pts, top, y, slope, o = {}) { this.T.ridges.push(Object.assign({ pts, top, y, slope }, o)); }
    ravine(pts, w, y, slope) { this.T.ravines.push({ pts, w, y, slope }); }
    flat(x0, z0, x1, z1, y, pad = 6) { this.T.flats.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y, pad }); }
    hole(x0, z0, x1, z1) { this.T.holes.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) }); }
    // road: bed flattened across its width; kind asphalt | dirt | gravel
    road(pts, w = 7, kind = 'asphalt', o = {}) { const r = Object.assign({ pts, w, kind }, o); this.roads.push(r); if (o.bed !== false) this.T.roads.push(r); return r; }
    ready() {
      if (this.hm) return;
      const [x0, z0, x1, z1] = this.opt.bounds;
      this.hm = new TerrainField(this.T, x0, z0, x1, z1);
    }
    h(x, z) { this.ready(); return this.hm.sample(x, z); }
    // ---- geometry
    box(x0, z0, x1, z1, y0, y1, tex = 'concrete', o = {}) {
      const b = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y0, y1, tex, top: o.top || tex, side: o.side || null, uvs: o.uvs || 3, collide: o.collide !== false, render: o.render !== false, thin: !!o.thin, tint: o.tint || null, noBottom: !!o.noBottom, alpha: !!o.alpha };
      this.boxes.push(b); return b;
    }
    // wall running along x (dir 'x') or z (dir 'z'); openings [{a, b, y0, y1}] measured from the wall start and base y
    wall(dir, a0, a1, c, thick, y, h, tex, openings = [], o = {}) {
      const mk = (a, b, ya, yb) => {
        if (b - a < 0.01 || yb - ya < 0.01) return;
        if (dir === 'x') this.box(a, c - thick / 2, b, c + thick / 2, ya, yb, tex, o);
        else this.box(c - thick / 2, a, c + thick / 2, b, ya, yb, tex, o);
      };
      const ops = openings.map(p => ({ a: a0 + p.a, b: a0 + p.b, y0: y + (p.y0 || 0), y1: y + (p.y1 == null ? 2.2 : p.y1) })).sort((p, q) => p.a - q.a);
      let a = a0;
      for (const p of ops) { mk(a, p.a, y, y + h); mk(p.a, p.b, y, p.y0); mk(p.a, p.b, p.y1, y + h); a = p.b; }
      mk(a, a1, y, y + h);
    }
    // rectangular building: doors [{side:'s'|'n'|'e'|'w', at: offset from the west/south corner, w}], windows every ~3.2 m
    building(x0, z0, x1, z1, o = {}) {
      const y = o.y != null ? o.y : this.h((x0 + x1) / 2, (z0 + z1) / 2), h = o.h || 3, t = o.t || 0.3, tex = o.tex || 'brick', floors = o.floors || 1, H = h * floors;
      const doors = o.doors || [{ side: 's', at: (x1 - x0) / 2 - 0.9, w: 1.8 }];
      const ops = side => {
        const len = side === 's' || side === 'n' ? x1 - x0 : z1 - z0, list = [];
        for (const d of doors) if (d.side === side) list.push({ a: d.at, b: d.at + (d.w || 1.8), y0: 0, y1: d.h || 2.2 });
        if (o.windows !== false) {
          for (let f = 0; f < floors; f++) {
            const n = Math.floor((len - 1) / 3.2);
            for (let i = 0; i < n; i++) {
              const a = (len - n * 3.2) / 2 + i * 3.2 + 1.0, b = a + 1.2;
              if (list.some(p => p.b > a - 0.4 && p.a < b + 0.4)) continue;
              if ((o.noWin || []).includes(side)) continue;
              list.push({ a, b, y0: f * h + 1.0, y1: f * h + 2.1 });
            }
          }
        }
        return list;
      };
      this.wall('x', x0, x1, z0 + t / 2, t, y, H, tex, ops('s'));
      this.wall('x', x0, x1, z1 - t / 2, t, y, H, tex, ops('n'));
      this.wall('z', z0 + t, z1 - t, x0 + t / 2, t, y, H, tex, ops('w'));
      this.wall('z', z0 + t, z1 - t, x1 - t / 2, t, y, H, tex, ops('e'));
      // floor & ceilings (interior floors are walkable slabs)
      this.box(x0 + t, z0 + t, x1 - t, z1 - t, y - 0.3, y + 0.05, o.floorTex || 'planks', { top: o.floorTex || 'planks' });
      for (let f = 1; f < floors; f++) {
        const fy0 = y + f * h - 0.2, fy1 = y + f * h, ix0 = x0 + t, iz0 = z0 + t, ix1 = x1 - t, iz1 = z1 - t, ft = { top: o.floorTex || 'planks' };
        if (!o.stairs) { this.box(ix0, iz0, ix1, iz1, fy0, fy1, 'concrete', ft); continue; }
        // leave a stairwell opening over the stairs
        const [sx0, sz0, sx1, sz1] = o.stairs;
        this.box(ix0, iz0, sx0, iz1, fy0, fy1, 'concrete', ft); this.box(sx1, iz0, ix1, iz1, fy0, fy1, 'concrete', ft);
        this.box(sx0, iz0, sx1, sz0, fy0, fy1, 'concrete', ft); this.box(sx0, sz1, sx1, iz1, fy0, fy1, 'concrete', ft);
      }
      if (o.stairs) { const s = o.stairs; for (let f = 1; f < floors; f++) this.stairs(s[0], s[1], s[2], s[3], y + (f - 1) * h, y + f * h, s[4] || 'n', 'concrete'); }
      const roof = o.roof || 'flat', rt = o.roofTex || (roof === 'flat' ? 'tar' : 'tin');
      if (roof === 'flat') this.box(x0 - 0.2, z0 - 0.2, x1 + 0.2, z1 + 0.2, y + H, y + H + 0.35, 'concrete', { top: rt });
      else {
        this.box(x0, z0, x1, z1, y + H, y + H + 0.15, 'planks', { top: 'planks' });
        const alongX = o.ridge ? o.ridge === 'x' : (x1 - x0) >= (z1 - z0);
        this.prop('roof', (x0 + x1) / 2, (z0 + z1) / 2, { y: y + H, w: x1 - x0 + 0.8, d: z1 - z0 + 0.8, rh: o.roofH || 2, alongX, tex: rt, gable: tex });
        // collision: stepped wedge so nobody walks through the roof
        const n = 3, rh = o.roofH || 2;
        for (let i = 0; i < n; i++) {
          const f = (i + 1) / (n + 1);
          if (alongX) { const hz = (z1 - z0) / 2 * (1 - f); this.box(x0, (z0 + z1) / 2 - hz, x1, (z0 + z1) / 2 + hz, y + H, y + H + rh * f + 0.2, tex, { render: false }); }
          else { const hx = (x1 - x0) / 2 * (1 - f); this.box((x0 + x1) / 2 - hx, z0, (x0 + x1) / 2 + hx, z1, y + H, y + H + rh * f + 0.2, tex, { render: false }); }
        }
      }
      if (o.interior !== false) this.lights.push(...(o.lamps || []));
      return { x0, z0, x1, z1, y, h: H, inner: [x0 + t, z0 + t, x1 - t, z1 - t] };
    }
    stairs(x0, z0, x1, z1, y0, y1, dir = 'n', tex = 'concrete', stepH = 0.3) {
      const n = Math.max(1, Math.round((y1 - y0) / stepH)), h = (y1 - y0) / n;
      for (let i = 0; i < n; i++) {
        const f0 = i / n, f1 = (i + 1) / n, top = y0 + h * (i + 1);
        if (dir === 'n') this.box(x0, z0 + (z1 - z0) * f0, x1, z0 + (z1 - z0) * f1, top - 0.3, top, tex);
        else if (dir === 's') this.box(x0, z1 - (z1 - z0) * f1, x1, z1 - (z1 - z0) * f0, top - 0.3, top, tex);
        else if (dir === 'e') this.box(x0 + (x1 - x0) * f0, z0, x0 + (x1 - x0) * f1, z1, top - 0.3, top, tex);
        else this.box(x1 - (x1 - x0) * f1, z0, x1 - (x1 - x0) * f0, z1, top - 0.3, top, tex);
      }
    }
    // fence along a polyline: concrete | wood | wire
    fence(pts, kind = 'concrete', o = {}) {
      const K = { concrete: { h: 2.6, t: 0.22, tex: 'fence' }, wood: { h: 1.5, t: 0.1, tex: 'planks' }, wire: { h: 2.2, t: 0.08, tex: 'wire', thin: true } }[kind];
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = Math.hypot(bx - ax, bz - az);
        const y = o.y != null ? o.y : null;
        if (Math.abs(ax - bx) < 0.01 || Math.abs(az - bz) < 0.01) {
          const n = Math.max(1, Math.ceil(len / 4));
          for (let k = 0; k < n; k++) {
            const t0 = k / n, t1 = (k + 1) / n, px0 = lerp(ax, bx, t0), pz0 = lerp(az, bz, t0), px1 = lerp(ax, bx, t1), pz1 = lerp(az, bz, t1);
            const gy = y != null ? y : Math.min(this.h(px0, pz0), this.h(px1, pz1), this.h((px0 + px1) / 2, (pz0 + pz1) / 2)) - 0.3;
            const top = (y != null ? y : Math.max(this.h(px0, pz0), this.h(px1, pz1))) + K.h;
            if (Math.abs(ax - bx) < 0.01) this.box(ax - K.t / 2, Math.min(pz0, pz1), ax + K.t / 2, Math.max(pz0, pz1), gy, top, K.tex, { thin: K.thin, alpha: K.thin });
            else this.box(Math.min(px0, px1), az - K.t / 2, Math.max(px0, px1), az + K.t / 2, gy, top, K.tex, { thin: K.thin, alpha: K.thin });
          }
        } else {
          const n = Math.ceil(len / 0.8);
          for (let k = 0; k < n; k++) {
            const t = (k + 0.5) / n, px = lerp(ax, bx, t), pz = lerp(az, bz, t), gy = this.h(px, pz);
            this.box(px - 0.4, pz - 0.4, px + 0.4, pz + 0.4, gy - 0.3, gy + K.h, K.tex, { render: false, thin: K.thin });
          }
          const ns = Math.ceil(len / 3), gy = [];
          for (let s = 0; s <= ns; s++) gy.push(this.h(lerp(ax, bx, s / ns), lerp(az, bz, s / ns)));
          this.prop('fence', (ax + bx) / 2, (az + bz) / 2, { ax, az, bx, bz, fkind: kind, h: K.h, gy });
        }
      }
    }
    rail(pts, o = {}) { this.rails.push(Object.assign({ pts }, o)); }
    prop(kind, x, z, o = {}) { const p = Object.assign({ kind, x, z, y: o.y != null ? o.y : this.h(x, z), rot: 0, s: 1 }, o); this.props.push(p); return p; }
    // invisible solid for a rotated footprint (axis-aligned bounds of the rotated rectangle)
    solid(x, z, hw, hd, y0, y1, rot = 0, shrink = 0.9, o = {}) {
      const c = Math.abs(Math.cos(rot)), s = Math.abs(Math.sin(rot)), ex = (hw * c + hd * s) * shrink, ez = (hw * s + hd * c) * shrink;
      // long diagonal objects: split into a chain of smaller boxes along the axis
      if (Math.min(c, s) > 0.3 && Math.max(hw, hd) > 2 * Math.min(hw, hd)) {
        const long = Math.max(hw, hd), short = Math.min(hw, hd), ax = hw >= hd ? [Math.cos(rot), -Math.sin(rot)] : [Math.sin(rot), Math.cos(rot)];
        const n = Math.ceil(long / short);
        for (let i = 0; i < n; i++) { const t = ((i + 0.5) / n) * 2 - 1, px = x + ax[0] * long * t, pz = z + ax[1] * long * t; this.box(px - short * shrink, pz - short * shrink, px + short * shrink, pz + short * shrink, y0, y1, 'metal', Object.assign({ render: false }, o)); }
        return;
      }
      this.box(x - ex, z - ez, x + ex, z + ez, y0, y1, 'metal', Object.assign({ render: false }, o));
    }
    // vehicles and big props with collision
    vehicle(kind, x, z, rot = 0, o = {}) {
      const dims = { car: [0.85, 2.0, 1.4], uaz: [0.95, 2.0, 1.9], truck: [1.25, 3.6, 2.6], bus: [1.3, 5.2, 2.9], btr: [1.45, 3.7, 2.3], heli: [1.3, 6.5, 3.0], tractor: [1.0, 1.8, 2.4], wagon: [1.5, 7.0, 3.6], tank: [1.8, 3.5, 2.3], cistern: [1.4, 5.5, 3.2] }[kind];
      const y = o.y != null ? o.y : this.h(x, z);
      this.prop(kind, x, z, Object.assign({ rot, y }, o));
      if (kind === 'heli') { this.solid(x, z, dims[0], dims[1] * 0.55, y, y + dims[2], rot); return; }
      this.solid(x, z, dims[0], dims[1], y - 0.2, y + dims[2] * (o.flat ? 0.5 : 1), rot, 0.95);
    }
    tree(x, z, kind = 'birch', s = 1) {
      this.trees.push({ x, z, kind, s, y: this.h(x, z), rot: ((x * 7.13 + z * 3.71) % 6.283) });
      const r = kind === 'bush' || kind === 'deadbush' ? 0 : 0.25 * s;
      if (r) this.box(x - r, z - r, x + r, z + r, this.h(x, z) - 0.5, this.h(x, z) + 6 * s, 'bark', { render: false });
    }
    // scatter trees in a rectangle, avoiding roads, boxes, cleared areas and holes
    forest(x0, z0, x1, z1, n, kinds = ['birch', 'pine', 'willow', 'bush'], o = {}) {
      const r = RNG(Math.floor(x0 * 13 + z0 * 7 + n) & 0xffff);
      let placed = 0;
      for (let tries = 0; tries < n * 6 && placed < n; tries++) {
        const x = r.range(x0, x1), z = r.range(z0, z1);
        if (!this.freeSpot(x, z, o.gap || 2.5)) continue;
        const kind = kinds[r.int(kinds.length)], s = r.range(o.smin || 0.75, o.smax || 1.25);
        this.tree(x, z, kind, s); placed++;
      }
    }
    freeSpot(x, z, gap) {
      for (const rd of this.roads) if (lineDist(x, z, rd.pts).d < rd.w / 2 + gap) return false;
      for (const rl of this.rails) if (lineDist(x, z, rl.pts).d < 3 + gap) return false;
      for (const b of this.boxes) if (x > b.x0 - gap && x < b.x1 + gap && z > b.z0 - gap && z < b.z1 + gap) return false;
      for (const c of this.clear) if (x > c[0] && x < c[2] && z > c[1] && z < c[3]) return false;
      for (const hl of this.T.holes) if (x > hl.x0 - 2 && x < hl.x1 + 2 && z > hl.z0 - 2 && z < hl.z1 + 2) return false;
      for (const w of this.waters) if (x > w.x0 - 1 && x < w.x1 + 1 && z > w.z0 - 1 && z < w.z1 + 1) return false;
      for (const a of this.anomalies) if (Math.hypot(a.x - x, a.z - z) < 4) return false;
      const [bx0, bz0, bx1, bz1] = this.opt.bounds; if (x < bx0 + 2 || x > bx1 - 2 || z < bz0 + 2 || z > bz1 - 2) return false;
      return true;
    }
    clearArea(x0, z0, x1, z1) { this.clear.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]); }
    // ---- actors, items and gameplay markup
    npc(tpl, x, z, o = {}) { const n = Object.assign({ tpl, x, z, yaw: 0, beh: 'guard' }, o); this.npcs.push(n); return n; }
    mutant(type, x, z, o = {}) { const m = Object.assign({ type, x, z, yaw: 0 }, o); this.mutants.push(m); return m; }
    pack(type, n, x, z, r = 4, o = {}) { const rr = RNG(Math.floor(x * 31 + z * 17 + n) & 0xffff); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rr() * 0.5; this.mutant(type, x + Math.cos(a) * r * rr.range(0.3, 1), z + Math.sin(a) * r * rr.range(0.3, 1), Object.assign({ yaw: rr() * 6.28 }, o)); } }
    item(id, x, z, o = {}) { this.items.push(Object.assign({ id, x, z }, o)); }
    stash(id, x, z, items, o = {}) { this.stashes.push(Object.assign({ id, x, z, items, kind: 'backpack', hidden: true }, o)); }
    crate(id, x, z, items, o = {}) { this.stash(id, x, z, items, Object.assign({ kind: 'crate', hidden: false }, o)); }
    anomaly(type, x, z, o = {}) { this.anomalies.push(Object.assign({ type, x, z }, o)); }
    field(type, n, x, z, r, arts = [], o = {}) {
      const rr = RNG(Math.floor(x * 11 + z * 23 + n * 7) & 0xffff);
      const pts = [];
      for (let i = 0, tries = 0; i < n && tries < 200; tries++) {
        const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * r, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
        if (pts.some(p => Math.hypot(p[0] - px, p[1] - pz) < 5)) continue;
        pts.push([px, pz]); this.anomaly(type, px, pz, o); i++;
      }
      // artifacts lie between the anomalies
      arts.forEach((id, i) => { const p = pts[i % pts.length] || [x, z], a = rr() * 6.28; this.art(id, p[0] + Math.cos(a) * 2.6, p[1] + Math.sin(a) * 2.6); });
    }
    art(id, x, z, o = {}) { this.arts.push(Object.assign({ id, x, z }, o)); }
    rad(x, z, r, power) { this.rads.push({ x, z, r, power }); }
    zone(id, x0, z0, x1, z1) { this.zones.push({ id, x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) }); }
    exit(id, x0, z0, x1, z1, to, spawn, label, o = {}) { this.exits.push(Object.assign({ id, x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), to, spawn, label }, o)); }
    spawn(id, x, z, yaw = 0, y = null) { this.spawns[id] = { x, z, yaw, y }; }
    light(x, y, z, r, c, o = {}) { this.lights.push(Object.assign({ x, y, z, r, c }, o)); }
    campfire(x, z, o = {}) { const y = this.h(x, z); this.prop('campfire', x, z, { y }); this.lights.push({ x, y: y + 0.8, z, r: o.r || 12, c: [1.4, 0.75, 0.3], fire: true, emit: true }); return { x, z, y }; }
    lamp(x, y, z, o = {}) { this.prop('lamp', x, z, { y }); this.lights.push({ x, y: y - 0.2, z, r: o.r || 9, c: o.c || [1.1, 1.0, 0.75], lamp: true }); }
    water(x0, z0, x1, z1, y) { this.waters.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y }); }
    path(id, pts) { this.paths[id] = pts; }
    sign(x, y, z, rot, text, o = {}) { this.signs.push(Object.assign({ x, y, z, rot, text, w: 2.4, h: 0.8 }, o)); }
    build() {
      this.ready();
      const o = this.opt;
      return {
        id: o.id, name: o.name, env: o.env, bounds: o.bounds, T: this.T, field: this.hm, map: o.map || null,
        boxes: this.boxes, props: this.props, roads: this.roads, rails: this.rails, trees: this.trees, npcs: this.npcs, mutants: this.mutants,
        items: this.items, stashes: this.stashes, anomalies: this.anomalies, arts: this.arts, rads: this.rads, zones: this.zones, exits: this.exits,
        spawns: this.spawns, lights: this.lights, water: this.waters, paths: this.paths, signs: this.signs, labels: o.labels || []
      };
    }
  }

  // ================================================================ terrain field (1 m heightmap)
  class TerrainField {
    constructor(T, x0, z0, x1, z1) {
      this.T = T; this.x0 = x0; this.z0 = z0; this.nx = x1 - x0 + 1; this.nz = z1 - z0 + 1;
      const hm = new Float32Array(this.nx * this.nz);
      // building sites without an explicit height sit at the base relief of their centre
      for (const f of T.flats) if (f.y == null) f.y = this.base((f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2);
      for (let j = 0; j < this.nz; j++) for (let i = 0; i < this.nx; i++) hm[j * this.nx + i] = this.eval(x0 + i, z0 + j);
      this.hm = hm; let mx = -Infinity; for (const v of hm) if (v > mx) mx = v; this.max = mx;
      this.holes = T.holes;
    }
    base(x, z) {
      const T = this.T;
      let h = T.base + T.amp * (fbm(x / T.scale, z / T.scale, T.seed, 4) - 0.5) * 2 + (T.rough || 0) * (fbm(x / 9, z / 9, T.seed + 3, 2) - 0.5);
      for (const hl of T.hills) {
        const dx = (x - hl.x) / (hl.rx || hl.r), dz = (z - hl.z) / (hl.rz || hl.r), d = Math.hypot(dx, dz);
        if (d < 1) { const k = 0.5 + 0.5 * Math.cos(d * Math.PI); h += hl.h * k * (hl.noise ? 0.8 + 0.4 * fbm(x / 6, z / 6, T.seed + 11, 2) : 1); }
      }
      return h;
    }
    eval(x, z) {
      const T = this.T;
      let h = this.base(x, z);
      for (const rv of T.ravines) { const q = lineDist(x, z, rv.pts); if (q.d < rv.w / 2 + rv.slope) h = lerp(h, Math.min(h, rv.y), 1 - smooth(rv.w / 2, rv.w / 2 + rv.slope, q.d)); }
      for (const rd of T.roads) {
        const q = lineDist(x, z, rd.pts); if (q.d > rd.w / 2 + 4) continue;
        const a = rd.pts[q.i], b = rd.pts[q.i + 1], cx = lerp(a[0], b[0], q.t), cz = lerp(a[1], b[1], q.t);
        h = lerp(h, this.base(cx, cz), 1 - smooth(rd.w / 2, rd.w / 2 + 4, q.d));
      }
      for (const rg of T.ridges) {
        const q = lineDist(x, z, rg.pts); if (q.d > rg.top / 2 + rg.slope) continue;
        let k = 1 - smooth(rg.top / 2, rg.top / 2 + rg.slope, q.d);
        if (rg.gaps) for (const g of rg.gaps) { const gd = Math.hypot(x - g[0], z - g[1]); if (gd < g[2] + 6) k *= smooth(g[2], g[2] + 6, gd); }
        h = lerp(h, Math.max(h, rg.y), k);
      }
      for (const f of T.flats) {
        const dx = Math.max(f.x0 - x, 0, x - f.x1), dz = Math.max(f.z0 - z, 0, z - f.z1), d = Math.hypot(dx, dz);
        if (d < f.pad) h = lerp(h, f.y, 1 - smooth(0, f.pad, d));
      }
      return h;
    }
    sample(x, z) {
      const fx = clamp(x - this.x0, 0, this.nx - 1.001), fz = clamp(z - this.z0, 0, this.nz - 1.001);
      const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, n = this.nx, k = j * n + i, h = this.hm;
      return (h[k] * (1 - u) + h[k + 1] * u) * (1 - v) + (h[k + n] * (1 - u) + h[k + n + 1] * u) * v;
    }
    inHole(x, z) { for (const hl of this.holes) if (x > hl.x0 && x < hl.x1 && z > hl.z0 && z < hl.z1) return true; return false; }
  }

  // ================================================================ world
  class World {
    constructor(def) {
      this.def = def;
      const [bx0, bz0, bx1, bz1] = def.bounds;
      this.bx0 = bx0; this.bz0 = bz0; this.bx1 = bx1; this.bz1 = bz1;
      this.F = def.field;
      this.boxes = def.boxes.filter(b => b.collide).map(b => Object.assign({}, b, { off: false }));
      for (const w of [[bx0 - 5, bz0 - 5, bx0 + 0.5, bz1 + 5], [bx1 - 0.5, bz0 - 5, bx1 + 5, bz1 + 5], [bx0 - 5, bz0 - 5, bx1 + 5, bz0 + 0.5], [bx0 - 5, bz1 - 0.5, bx1 + 5, bz1 + 5]]) {
        this.boxes.push({ x0: w[0], z0: w[1], x1: w[2], z1: w[3], y0: -200, y1: 500, invisible: true, collide: true, off: false });
      }
      this.stamp = 1; this.stamps = new Uint32Array(this.boxes.length);
      this.buildGrid();
      this.buildNav();
    }
    // ---------------------------------------------------------------- grid of boxes
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
    // ---------------------------------------------------------------- terrain
    terrainAt(x, z) { return this.F.sample(x, z); }
    // collision terrain: holes (tunnels, bunkers) have no ground of their own
    groundH(x, z) { return this.F.inHole(x, z) ? NOHOLE : this.F.sample(x, z); }
    terrainNormal(x, z) {
      const e = 0.7, hx = this.terrainAt(x + e, z) - this.terrainAt(x - e, z), hz = this.terrainAt(x, z + e) - this.terrainAt(x, z - e);
      const l = Math.hypot(hx, 2 * e, hz); return [-hx / l, 2 * e / l, -hz / l];
    }
    // ---------------------------------------------------------------- queries
    floorAt(x, z, r, maxY) {
      let fl = this.groundH(x, z); const q = r * 0.7;
      this.near(x - q, z - q, x + q, z + q, b => {
        if (b.invisible || b.y1 > maxY || b.y1 <= fl) return;
        if (x + q > b.x0 && x - q < b.x1 && z + q > b.z0 && z - q < b.z1) fl = b.y1;
      });
      return fl;
    }
    // standing height climbing only from the ground up (ignores roofs above)
    groundAt(x, z, r = 0.25, from = null) {
      let fl = from != null ? from : this.groundH(x, z); const list = [];
      this.near(x - r, z - r, x + r, z + r, b => { if (!b.invisible && x + r > b.x0 && x - r < b.x1 && z + r > b.z0 && z - r < b.z1) list.push(b); });
      list.sort((a, b) => a.y0 - b.y0);
      if (fl <= NOHOLE + 1) { let lo = Infinity; for (const b of list) if (b.y1 < lo) lo = b.y1; if (lo < Infinity) fl = lo; }
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
          const dx = o.x - cx, dz = o.z - cz, d2 = dx * dx + dz * dz;
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
    // integrate a body {x,y,z,vx,vy,vz,r,h,ground}; steep terrain (> ~48°) cannot be climbed
    move(o, dt) {
      o.hitWall = false;
      const sp = Math.max(Math.abs(o.vx), Math.abs(o.vz)) * dt, n = clamp(Math.ceil(sp / (o.r * 0.7)), 1, 10);
      const stepAllow = o.ground ? STEP : 0.25;
      for (let i = 0; i < n; i++) {
        const px = o.x, pz = o.z;
        o.x += (o.vx * dt) / n; o.z += (o.vz * dt) / n;
        this.resolve(o, stepAllow);
        // steep slopes: only blocks when on bare terrain (no floor box underneath)
        const g0 = this.groundH(px, pz), g1 = this.groundH(o.x, o.z), hd = Math.hypot(o.x - px, o.z - pz);
        if (hd > 1e-4 && g1 > g0 + 0.02 && g1 > NOHOLE + 1 && g0 > NOHOLE + 1 && o.y < g1 + 0.3 && (g1 - g0) / hd > 1.1 && this.floorAt(o.x, o.z, o.r, o.y + STEP) <= g1 + 0.01) {
          // slide along the contour instead of stopping dead
          const nrm = this.terrainNormal(o.x, o.z), l = Math.hypot(nrm[0], nrm[2]) || 1, tx = -nrm[2] / l, tz = nrm[0] / l;
          const mx = o.x - px, mz = o.z - pz, dot = mx * tx + mz * tz;
          o.x = px + tx * dot * 0.8; o.z = pz + tz * dot * 0.8;
          if (this.groundH(o.x, o.z) > g0 + hd * 1.1 + 0.02) { o.x = px; o.z = pz; }
          o.hitWall = true;
        }
      }
      let land = 0;
      o.vy -= GRAVITY * dt;
      let ny = o.y + o.vy * dt;
      const fl = this.floorAt(o.x, o.z, o.r, o.y + (o.ground ? STEP : 0.3));
      if (ny <= fl) { if (o.vy < 0) land = -o.vy; ny = fl; o.vy = 0; o.ground = true; }
      else if (o.ground && o.vy <= 0 && ny - fl < STEP) { ny = fl; o.vy = 0; }
      else o.ground = false;
      const c = this.ceilAt(o.x, o.z, o.r, o.y + o.h - 0.4);
      if (ny + o.h > c) { ny = Math.max(fl, c - o.h); if (o.vy > 0) o.vy = 0; }
      o.y = ny;
      // slide down very steep terrain
      if (o.ground && fl > NOHOLE + 1 && Math.abs(fl - this.groundH(o.x, o.z)) < 0.05) {
        const nrm = this.terrainNormal(o.x, o.z);
        if (nrm[1] < 0.6) { o.x += nrm[0] * dt * 4; o.z += nrm[2] * dt * 4; this.resolve(o, STEP); }
      }
      return land;
    }

    // ray cast; returns { t, n, box, terrain } or null. shots=true ignores invisible walls and thin fences
    ray(ox, oy, oz, dx, dy, dz, maxT, shots = false, noTerrain = false) {
      let best = maxT, hit = null;
      const len = Math.hypot(dx, dz);
      const test = b => {
        if (shots && (b.invisible || b.thin)) return;
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
        let dist = 0;
        for (let guard = 0; guard < 600; guard++) {
          if (cx >= 0 && cz >= 0 && cx < this.gw && cz < this.gh) {
            for (const bi of this.grid[cz * this.gw + cx]) { if (this.stamps[bi] === st) continue; this.stamps[bi] = st; const b = this.boxes[bi]; if (!b.off) test(b); }
          } else if ((cx < 0 && sx < 0) || (cz < 0 && sz < 0) || (cx >= this.gw && sx > 0) || (cz >= this.gh && sz > 0)) break;
          if (dist > best * len) break;
          if (tmx < tmz) { dist = tmx; tmx += tdx; cx += sx; } else { dist = tmz; tmz += tdz; cz += sz; }
        }
      }
      if (!noTerrain) {
        const top = this.F.max + 1;
        let ta = 0, tb = best;
        if (dy >= 0 && oy > top) tb = -1;
        else if (oy > top && dy < 0) ta = (top - oy) / dy;
        else if (dy > 0) tb = Math.min(tb, (top - oy) / dy);
        if (tb > ta) {
          const L = Math.max(1e-6, Math.hypot(dx, dy, dz)), stepT = 0.6 / L;
          let prev = ta;
          for (let t = ta; t <= tb + stepT; t += stepT) {
            const tt = Math.min(t, tb), x = ox + dx * tt, z = oz + dz * tt, y = oy + dy * tt;
            if (y < this.groundH(x, z)) {
              let lo = prev, hi = tt;
              for (let k = 0; k < 8; k++) { const m = (lo + hi) / 2; if (oy + dy * m < this.groundH(ox + dx * m, oz + dz * m)) hi = m; else lo = m; }
              if (hi < best) { best = hi; hit = { t: hi, n: this.terrainNormal(ox + dx * hi, oz + dz * hi), box: null, terrain: true }; }
              break;
            }
            prev = tt; if (tt >= tb) break;
          }
        }
      }
      return hit;
    }
    los(ax, ay, az, bx, by, bz, shots = true) { return !this.ray(ax, ay, az, bx - ax, by - ay, bz - az, 1, shots); }

    // ---------------------------------------------------------------- nav grid & A*
    buildNav() {
      this.nw = this.bx1 - this.bx0; this.nh = this.bz1 - this.bz0;
      const N = this.nw * this.nh;
      this.navH = new Float32Array(N); this.navOK = new Uint8Array(N); this.navCost = new Uint8Array(N);
      for (let j = 0; j < this.nh; j++) for (let i = 0; i < this.nw; i++) this.navCell(i, j);
      this.gS = new Float32Array(N); this.par = new Int32Array(N); this.seen = new Uint32Array(N); this.closed = new Uint32Array(N); this.gen = 1;
      this.heap = new Int32Array(N); this.hf = new Float32Array(N);
    }
    navCell(i, j) {
      const cx = this.bx0 + i + 0.5, cz = this.bz0 + j + 0.5, k = j * this.nw + i, e = 0.34;
      let fl = this.groundH(cx, cz), ok = 1;
      const list = [];
      this.near(cx - e, cz - e, cx + e, cz + e, b => { if (cx + e > b.x0 && cx - e < b.x1 && cz + e > b.z0 && cz - e < b.z1) list.push(b); });
      list.sort((a, b) => a.y0 - b.y0);
      if (fl <= NOHOLE + 1) { let lo = Infinity; for (const b of list) if (!b.invisible && b.y1 < lo) lo = b.y1; if (lo < Infinity) fl = lo; else ok = 0; }
      let onBox = false;
      for (const b of list) {
        if (b.invisible) { ok = 0; break; }
        if (b.y0 <= fl + STEP) { if (b.y1 > fl) { if (b.y1 - fl > 2.2) { ok = 0; break; } fl = b.y1; onBox = true; } }
        else if (b.y0 < fl + 1.9) { ok = 0; break; }
      }
      if (ok && !onBox) { const n = this.terrainNormal(cx, cz); if (n[1] < 0.68) ok = 0; }
      this.navH[k] = fl; this.navOK[k] = ok;
    }
    cellOf(x, z) {
      const i = Math.floor(x - this.bx0), j = Math.floor(z - this.bz0);
      if (i < 0 || j < 0 || i >= this.nw || j >= this.nh) return -1;
      return j * this.nw + i;
    }
    // mark hazardous cells (anomalies) so actors route around them
    markCost(x, z, r, cost) {
      const i0 = clamp(Math.floor(x - r - this.bx0), 0, this.nw - 1), i1 = clamp(Math.ceil(x + r - this.bx0), 0, this.nw - 1);
      const j0 = clamp(Math.floor(z - r - this.bz0), 0, this.nh - 1), j1 = clamp(Math.ceil(z + r - this.bz0), 0, this.nh - 1);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (Math.hypot(this.bx0 + i + 0.5 - x, this.bz0 + j + 0.5 - z) <= r) this.navCost[j * this.nw + i] = Math.max(this.navCost[j * this.nw + i], cost);
    }
    // nearest walkable cell within rad cells (spiral)
    nearestOK(x, z, rad = 6) {
      const c = this.cellOf(x, z); if (c >= 0 && this.navOK[c]) return c;
      const ci = Math.floor(x - this.bx0), cj = Math.floor(z - this.bz0);
      for (let r = 1; r <= rad; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= this.nw || j >= this.nh) continue;
        const k = j * this.nw + i; if (this.navOK[k]) return k;
      }
      return -1;
    }
    passable(a, b) { const d = this.navH[b] - this.navH[a]; return d < 1.0 && d > -3.5; }
    // A* on the 1 m grid; returns array of [x, z] waypoints (string-pulled) or null
    findPath(ax, az, bx, bz, maxNodes = 5000) {
      const s = this.nearestOK(ax, az, 3), t = this.nearestOK(bx, bz, 6); if (s < 0 || t < 0) return null;
      if (s === t) return [[bx, bz]];
      const W = this.nw, g = this.gS, par = this.par, seen = this.seen, closed = this.closed, heap = this.heap, hf = this.hf, ok = this.navOK, cost = this.navCost;
      const gen = ++this.gen; if (gen > 0xfffffff0) { seen.fill(0); closed.fill(0); this.gen = 1; }
      const ti = t % W, tj = (t / W) | 0;
      const hEst = k => { const dx = Math.abs(k % W - ti), dz = Math.abs(((k / W) | 0) - tj); return (dx + dz) + (1.4142 - 2) * Math.min(dx, dz); };
      let hn = 0;
      const push = (k, f) => { let i = hn++; heap[i] = k; hf[i] = f; while (i > 0) { const p = (i - 1) >> 1; if (hf[p] <= hf[i]) break; const tk = heap[p], tf = hf[p]; heap[p] = heap[i]; hf[p] = hf[i]; heap[i] = tk; hf[i] = tf; i = p; } };
      const pop = () => { const top = heap[0]; hn--; if (hn > 0) { heap[0] = heap[hn]; hf[0] = hf[hn]; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < hn && hf[l] < hf[m]) m = l; if (r < hn && hf[r] < hf[m]) m = r; if (m === i) break; const tk = heap[m], tf = hf[m]; heap[m] = heap[i]; hf[m] = hf[i]; heap[i] = tk; hf[i] = tf; i = m; } } return top; };
      g[s] = 0; seen[s] = gen; par[s] = -1; push(s, hEst(s));
      const DX = [1, -1, 0, 0, 1, 1, -1, -1], DZ = [0, 0, 1, -1, 1, -1, 1, -1], DC = [1, 1, 1, 1, 1.4142, 1.4142, 1.4142, 1.4142];
      let n = 0, found = false, bestK = s, bestH = hEst(s);
      while (hn > 0 && n < maxNodes) {
        const a = pop(); if (closed[a] === gen) continue; closed[a] = gen; n++;
        if (a === t) { found = true; break; }
        const hh = hEst(a); if (hh < bestH) { bestH = hh; bestK = a; }
        const ai = a % W, aj = (a / W) | 0;
        for (let k = 0; k < 8; k++) {
          const bi = ai + DX[k], bj = aj + DZ[k]; if (bi < 0 || bj < 0 || bi >= W || bj >= this.nh) continue;
          const b = bj * W + bi; if (!ok[b] || closed[b] === gen || !this.passable(a, b)) continue;
          if (k >= 4) { const o1 = aj * W + bi, o2 = bj * W + ai; if (!ok[o1] || !ok[o2]) continue; }
          const ng = g[a] + DC[k] * (1 + cost[b] * 0.25);
          if (seen[b] !== gen || ng < g[b]) { seen[b] = gen; g[b] = ng; par[b] = a; push(b, ng + hEst(b) * 1.15); }
        }
      }
      const end = found ? t : bestK; if (end === s) return null;
      const cells = []; for (let k = end; k !== -1; k = par[k]) cells.push(k); cells.reverse();
      // string pulling
      const pts = []; let anchor = 0;
      for (let i = 2; i < cells.length; i++) if (!this.walkLine(cells[anchor], cells[i])) { pts.push(this.cellXZ(cells[i - 1])); anchor = i - 1; }
      pts.push(found ? [bx, bz] : this.cellXZ(end));
      return pts;
    }
    cellXZ(k) { return [this.bx0 + (k % this.nw) + 0.5, this.bz0 + ((k / this.nw) | 0) + 0.5]; }
    walkLine(a, b) {
      const W = this.nw; let x0 = a % W, z0 = (a / W) | 0; const x1 = b % W, z1 = (b / W) | 0;
      const dx = Math.abs(x1 - x0), dz = Math.abs(z1 - z0), sx = x0 < x1 ? 1 : -1, sz = z0 < z1 ? 1 : -1; let err = dx - dz, prev = a;
      for (let guard = 0; guard < 400; guard++) {
        const k = z0 * W + x0; if (!this.navOK[k] || this.navCost[k] > 2 || !this.passable(prev, k)) return false; prev = k;
        if (x0 === x1 && z0 === z1) return true;
        const e2 = 2 * err; if (e2 > -dz) { err -= dz; x0 += sx; } if (e2 < dx) { err += dx; z0 += sz; }
      }
      return false;
    }
    walkableAt(x, z) { const c = this.cellOf(x, z); return c >= 0 && !!this.navOK[c]; }
  }

  S.Builder = Builder; S.World = World; S.TerrainField = TerrainField; S.PHYS = { STEP, GRAVITY, NOHOLE };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
