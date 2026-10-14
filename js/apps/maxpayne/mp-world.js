(function (M) {
  'use strict';
  const CELL = 4;
  const EPS = 0.001;

  M.DECOR = {
    bench: { w: 1.8, h: 0.9, d: 0.6 },
    trash: { w: 0.6, h: 0.9, d: 0.6 },
    sofa: { w: 2.0, h: 0.85, d: 0.9 },
    armchair: { w: 0.9, h: 0.9, d: 0.9 },
    bed: { w: 1.6, h: 0.6, d: 2.1 },
    crib: { w: 0.7, h: 1.0, d: 1.3 },
    table: { w: 1.4, h: 0.78, d: 0.9 },
    tableside: { w: 1.4, h: 0.98, d: 0.45 },
    desk: { w: 1.5, h: 0.78, d: 0.75 },
    chair: { w: 0.5, h: 0.95, d: 0.5 },
    tvstand: { w: 0.9, h: 1.05, d: 0.6 },
    fridge: { w: 0.8, h: 1.8, d: 0.7 },
    stove: { w: 0.8, h: 0.95, d: 0.7 },
    counter: { w: 2.0, h: 0.95, d: 0.65 },
    shelf: { w: 1.6, h: 2.0, d: 0.45 },
    lockers: { w: 1.8, h: 2.0, d: 0.5 },
    car: { w: 1.9, h: 1.45, d: 4.8 },
    mercedes: { w: 1.9, h: 1.45, d: 5.0 },
    cruiser: { w: 1.9, h: 1.6, d: 4.9 },
    dumpster: { w: 1.9, h: 1.3, d: 1.1 },
    lamp: { w: 0.3, h: 4.2, d: 0.3 },
    hydrant: { w: 0.35, h: 0.8, d: 0.35 },
    turnstile: { w: 0.4, h: 1.0, d: 1.0 },
    booth: { w: 2.4, h: 2.6, d: 2.0 },
    pallet: { w: 1.2, h: 1.1, d: 1.0 },
    barrel: { w: 0.62, h: 0.9, d: 0.62 },
    console: { w: 2.2, h: 1.15, d: 0.8 },
    safe: { w: 1.0, h: 1.4, d: 0.8 },
    bar: { w: 3.0, h: 1.1, d: 0.7 },
    speaker: { w: 1.0, h: 1.8, d: 0.8 },
    altar: { w: 2.4, h: 1.1, d: 1.2 },
    throne: { w: 1.2, h: 2.2, d: 1.0 },
    candles: { w: 0.5, h: 0.6, d: 0.5 },
    pipes: { w: 0.4, h: 0.4, d: 4 },
    boiler: { w: 1.6, h: 2.2, d: 1.6 },
    washer: { w: 0.7, h: 0.9, d: 0.7 },
    toilet: { w: 0.45, h: 0.8, d: 0.7 },
    sink: { w: 0.6, h: 0.9, d: 0.5 },
    bathtub: { w: 0.8, h: 0.6, d: 1.7 },
    piano: { w: 1.5, h: 1.3, d: 0.6 },
    moneypile: { w: 1.0, h: 0.4, d: 0.7 },
    suitcase: { w: 0.8, h: 0.25, d: 0.5 },
    cage: { w: 1.4, h: 2.2, d: 1.4 },
    hoop: { w: 1.4, h: 3.6, d: 1.0 },
    rubble: { w: 2.0, h: 0.8, d: 2.0 },
    coatrack: { w: 0.5, h: 1.8, d: 0.5 },
    streetlight: { w: 0.3, h: 5, d: 0.3 },
    phonebooth: { w: 1.0, h: 2.3, d: 1.0 },
    stretcher: { w: 0.7, h: 0.9, d: 2.0 },
    target: { w: 0.8, h: 1.9, d: 0.1 },
    djbooth: { w: 2.6, h: 1.2, d: 1.2 },
    mixer: { w: 1.2, h: 1.0, d: 0.8 },
    cross: { w: 1.4, h: 3.0, d: 0.3 },
    statue: { w: 1.0, h: 2.6, d: 1.0 }
  };

  class World {
    constructor(o) {
      o = o || {};
      this.solids = [];
      this.lights = [];
      this.zones = [];
      this.decals = [];
      this.decor = [];
      this.water = [];
      this.propDefs = [];
      this.groups = {};
      this.dyn = [];
      this.stamp = 1;
      this.ambient = o.ambient || [0.09, 0.09, 0.11];
      this.fog = o.fog || { color: [0.02, 0.025, 0.035], near: 14, far: 70 };
      this.sky = o.sky || 'night';
      this.moon = o.moon || null;
      this.weather = o.weather || 'snow';
      this.grid = new Map();
      this.bounds = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] };
    }

    add(s) {
      s.index = this.solids.length;
      if (s.col === undefined) s.col = true;
      if (s.vis === undefined) s.vis = true;
      this.solids.push(s);
      if (s.group) {
        if (!this.groups[s.group]) this.groups[s.group] = { on: true, solids: [] };
        this.groups[s.group].solids.push(s.index);
      }
      for (let i = 0; i < 3; i++) {
        this.bounds.min[i] = Math.min(this.bounds.min[i], s.min[i]);
        this.bounds.max[i] = Math.max(this.bounds.max[i], s.max[i]);
      }
      if (this.finalized) this.index(s);
      return s;
    }

    finalize() {
      this.grid.clear();
      for (const s of this.solids) this.index(s);
      this.finalized = true;
    }

    index(s) {
      if (!s.col) return;
      const cx0 = Math.floor(s.min[0] / CELL), cx1 = Math.floor(s.max[0] / CELL);
      const cz0 = Math.floor(s.min[2] / CELL), cz1 = Math.floor(s.max[2] / CELL);
      for (let x = cx0; x <= cx1; x++) for (let z = cz0; z <= cz1; z++) {
        const k = x * 73856093 ^ z * 19349663;
        let arr = this.grid.get(k);
        if (!arr) { arr = []; this.grid.set(k, arr); }
        arr.push(s);
      }
    }

    active(s) {
      if (!s.col) return false;
      if (s.group && this.groups[s.group] && !this.groups[s.group].on) return false;
      return true;
    }

    setGroup(id, on) {
      if (this.groups[id]) this.groups[id].on = on;
    }

    each(minx, minz, maxx, maxz, fn) {
      const st = ++this.stamp;
      const cx0 = Math.floor(minx / CELL), cx1 = Math.floor(maxx / CELL);
      const cz0 = Math.floor(minz / CELL), cz1 = Math.floor(maxz / CELL);
      for (let x = cx0; x <= cx1; x++) for (let z = cz0; z <= cz1; z++) {
        const arr = this.grid.get(x * 73856093 ^ z * 19349663);
        if (!arr) continue;
        for (const s of arr) {
          if (s.st === st) continue;
          s.st = st;
          if (!this.active(s)) continue;
          if (fn(s) === false) return;
        }
      }
      for (const d of this.dyn) {
        if (!d.on) continue;
        if (d.max[0] < minx || d.min[0] > maxx || d.max[2] < minz || d.min[2] > maxz) continue;
        if (fn(d) === false) return;
      }
    }

    overlaps(min, max, skip) {
      let hit = null;
      this.each(min[0], min[2], max[0], max[2], s => {
        if (s === skip || s.noChar && skip === 'char') return;
        if (M.boxOverlap(min, max, s.min, s.max)) { hit = s; return false; }
      });
      return hit;
    }

    raycast(p, d, o) {
      o = o || {};
      let best = null;
      const test = s => {
        if (o.noGlass && s.glass) return;
        if (o.skip && o.skip === s) return;
        if (s.noShot && (o.shot || o.see)) return;
        const h = M.segBox(p, d, s.min, s.max);
        if (h && !h.inside && (!best || h.t < best.t)) best = { t: h.t, n: h.n, solid: s };
      };
      const x0 = p[0], z0 = p[2], x1 = p[0] + d[0], z1 = p[2] + d[2];
      let cx = Math.floor(x0 / CELL), cz = Math.floor(z0 / CELL);
      const ex = Math.floor(x1 / CELL), ez = Math.floor(z1 / CELL);
      const sx = d[0] > 0 ? 1 : -1, sz = d[2] > 0 ? 1 : -1;
      const tdx = Math.abs(d[0]) > 1e-9 ? CELL / Math.abs(d[0]) : 1e9;
      const tdz = Math.abs(d[2]) > 1e-9 ? CELL / Math.abs(d[2]) : 1e9;
      let tmx = Math.abs(d[0]) > 1e-9 ? ((sx > 0 ? (cx + 1) * CELL : cx * CELL) - x0) / d[0] : 1e9;
      let tmz = Math.abs(d[2]) > 1e-9 ? ((sz > 0 ? (cz + 1) * CELL : cz * CELL) - z0) / d[2] : 1e9;
      const st = ++this.stamp;
      let guard = 0;
      for (;;) {
        const arr = this.grid.get(cx * 73856093 ^ cz * 19349663);
        if (arr) for (const s of arr) {
          if (s.st === st) continue;
          s.st = st;
          if (!this.active(s)) continue;
          test(s);
        }
        const tExit = Math.min(tmx, tmz);
        if (best && best.t <= tExit) break;
        if ((cx === ex && cz === ez) || tExit > 1 || ++guard > 400) break;
        if (tmx < tmz) { tmx += tdx; cx += sx; } else { tmz += tdz; cz += sz; }
      }
      if (!o.noDyn) for (const s of this.dyn) if (s.on) test(s);
      if (best) best.pos = [p[0] + d[0] * best.t, p[1] + d[1] * best.t, p[2] + d[2] * best.t];
      return best;
    }

    visible(a, b) {
      return !this.raycast(a, M.sub(b, a), { noGlass: false });
    }

    groundAt(x, z, y, r) {
      r = r || 0.25;
      let top = -1e9, obj = null;
      this.each(x - r, z - r, x + r, z + r, s => {
        if (s.max[0] < x - r || s.min[0] > x + r || s.max[2] < z - r || s.min[2] > z + r) return;
        if (s.max[1] <= y + 0.02 && s.max[1] > top) { top = s.max[1]; obj = s; }
      });
      return { y: top, obj };
    }

    ceilingAt(x, z, y, r) {
      r = r || 0.25;
      let bot = 1e9;
      this.each(x - r, z - r, x + r, z + r, s => {
        if (s.max[0] < x - r || s.min[0] > x + r || s.max[2] < z - r || s.min[2] > z + r) return;
        if (s.min[1] >= y - 0.02 && s.min[1] < bot) bot = s.min[1];
      });
      return bot;
    }

    move(body, dt, o) {
      o = o || {};
      const r = body.r, h = body.h;
      const step = o.step === undefined ? 0.45 : o.step;
      const v = body.vel;
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(v[0]), Math.abs(v[2]), Math.abs(v[1])) * dt / (r * 0.7)));
      const sdt = dt / n;
      let blocked = false, hitWall = null;
      const wasGround = body.onGround;
      body.onGround = false;
      const box = (x, y, z) => [[x - r + 0.002, y, z - r + 0.002], [x + r - 0.002, y + h, z + r - 0.002]];
      for (let i = 0; i < n; i++) {
        for (const ax of [0, 2]) {
          const np = body.pos.slice();
          np[ax] += v[ax] * sdt;
          let [mn, mx] = box(np[0], np[1], np[2]);
          const hit = this.overlaps(mn, mx, 'char');
          if (!hit) { body.pos = np; continue; }
          if (step > 0 && (wasGround || body.onGround || o.forceStep) && hit.max[1] - np[1] <= step + EPS && hit.max[1] > np[1]) {
            const up = np.slice();
            up[1] = hit.max[1] + EPS;
            [mn, mx] = box(up[0], up[1], up[2]);
            if (!this.overlaps(mn, mx, 'char')) { body.pos = up; body.stepped = true; continue; }
          }
          if (v[ax] > 0) body.pos[ax] = Math.min(body.pos[ax], hit.min[ax] - r - EPS);
          else if (v[ax] < 0) body.pos[ax] = Math.max(body.pos[ax], hit.max[ax] + r + EPS);
          blocked = true;
          hitWall = hit;
          v[ax] = 0;
        }
        const np = body.pos.slice();
        np[1] += v[1] * sdt;
        const [mn, mx] = box(np[0], np[1], np[2]);
        const hit = this.overlaps(mn, mx, 'char');
        if (!hit) body.pos = np;
        else if (v[1] <= 0) {
          body.pos[1] = hit.max[1] + EPS;
          body.onGround = true;
          body.groundObj = hit;
          v[1] = 0;
        } else {
          body.pos[1] = Math.min(body.pos[1], hit.min[1] - h - EPS);
          v[1] = 0;
        }
      }
      if (!body.onGround) {
        const g = this.groundAt(body.pos[0], body.pos[2], body.pos[1] + 0.01, r * 0.95);
        if (g.y > -1e8 && body.pos[1] - g.y < 0.03 && v[1] <= 0) { body.onGround = true; body.groundObj = g.obj; }
        else if (wasGround && v[1] <= 0 && !o.noSnap && g.y > -1e8 && body.pos[1] - g.y <= step + 0.05) {
          body.pos[1] = g.y + EPS;
          body.onGround = true;
          body.groundObj = g.obj;
        }
      }
      if (!body.onGround) body.groundObj = null;
      return { blocked, wall: hitWall };
    }

    zoneAt(p) {
      let best = null, bv = Infinity;
      for (const z of this.zones) {
        if (!M.pointInBox(p, z.min, z.max)) continue;
        const v = (z.max[0] - z.min[0]) * (z.max[1] - z.min[1]) * (z.max[2] - z.min[2]);
        if (v < bv) { bv = v; best = z; }
      }
      return best;
    }

    lightAt(p, n, o) {
      o = o || {};
      const out = this.ambient.slice();
      const z = this.zoneAt(p);
      if (z && z.amb) { out[0] = z.amb[0]; out[1] = z.amb[1]; out[2] = z.amb[2]; }
      for (const L of this.lights) {
        if (L.off || (L.group && this.groups[L.group] && !this.groups[L.group].on)) continue;
        const dx = L.pos[0] - p[0], dy = L.pos[1] - p[1], dz = L.pos[2] - p[2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > L.r * L.r) continue;
        const d = Math.sqrt(d2) || 1e-6;
        let lam = n ? (dx * n[0] + dy * n[1] + dz * n[2]) / d : 0.7;
        if (n && lam <= 0) continue;
        if (!n) lam = 0.75;
        if (L.spot) {
          const c = -(dx * L.spot[0] + dy * L.spot[1] + dz * L.spot[2]) / d;
          if (c < L.cone) continue;
          lam *= M.smooth((c - L.cone) / Math.max(0.05, 1 - L.cone));
        }
        const att = Math.pow(1 - d / L.r, 1.6);
        if (att <= 0.003) continue;
        if (o.shadows !== false && L.shadow !== false) {
          const q = n ? [p[0] + n[0] * 0.03, p[1] + n[1] * 0.03, p[2] + n[2] * 0.03] : p;
          const hit = this.raycast(q, [L.pos[0] - q[0], L.pos[1] - q[1], L.pos[2] - q[2]], { noDyn: true, noGlass: true });
          if (hit && hit.t < 0.985 && !hit.solid.glass) continue;
        }
        const k = att * lam * L.i;
        out[0] += L.color[0] * k; out[1] += L.color[1] * k; out[2] += L.color[2] * k;
      }
      if (this.moon && z && z.outdoor) {
        const md = this.moon.dir;
        let lam = n ? -(md[0] * n[0] + md[1] * n[1] + md[2] * n[2]) : 0.6;
        if (lam > 0) {
          const q = n ? [p[0] + n[0] * 0.03, p[1] + n[1] * 0.03, p[2] + n[2] * 0.03] : p;
          const hit = o.shadows === false ? null : this.raycast(q, [-md[0] * 80, -md[1] * 80, -md[2] * 80], { noDyn: true });
          if (!hit) {
            out[0] += this.moon.color[0] * lam; out[1] += this.moon.color[1] * lam; out[2] += this.moon.color[2] * lam;
          }
        }
      }
      return out;
    }
  }
  M.World = World;

  function norm(x0, y0, z0, x1, y1, z1) {
    return [[Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)]];
  }

  function subtractRect(r, h) {
    if (h[2] <= r[0] || h[0] >= r[2] || h[3] <= r[1] || h[1] >= r[3]) return [r];
    const out = [];
    if (h[1] > r[1]) out.push([r[0], r[1], r[2], h[1]]);
    if (h[3] < r[3]) out.push([r[0], h[3], r[2], r[3]]);
    const z0 = Math.max(r[1], h[1]), z1 = Math.min(r[3], h[3]);
    if (h[0] > r[0]) out.push([r[0], z0, h[0], z1]);
    if (h[2] < r[2]) out.push([h[2], z0, r[2], z1]);
    return out.filter(q => q[2] - q[0] > 0.01 && q[3] - q[1] > 0.01);
  }

  class Builder {
    constructor(world) {
      this.w = world;
      this.gid = null;
    }
    group(id, fn, off) {
      const prev = this.gid;
      this.gid = id;
      fn();
      this.gid = prev;
      if (!this.w.groups[id]) this.w.groups[id] = { on: true, solids: [] };
      if (off) this.w.groups[id].on = false;
    }
    box(x0, y0, z0, x1, y1, z1, mat, o) {
      o = o || {};
      const [min, max] = norm(x0, y0, z0, x1, y1, z1);
      if (max[0] - min[0] < 1e-4 || max[1] - min[1] < 1e-4 || max[2] - min[2] < 1e-4) return null;
      return this.w.add(Object.assign({ min, max, mat, group: this.gid }, o));
    }
    slab(x0, z0, x1, z1, y, t, mat, o) { return this.box(x0, y - (t || 0.25), z0, x1, y, z1, mat, o); }
    ground(x0, z0, x1, z1, y, mat, o) { return this.box(x0, y - 1, z0, x1, y, z1, mat, o); }
    pillar(x, z, s, y0, y1, mat, o) { return this.box(x - s / 2, y0, z - s / 2, x + s / 2, y1, z + s / 2, mat, o); }
    clip(x0, y0, z0, x1, y1, z1) { return this.box(x0, y0, z0, x1, y1, z1, 'clip', { vis: false }); }

    stairs(x0, z0, x1, z1, y0, y1, dir, mat, o) {
      o = o || {};
      const rise = y1 - y0;
      const n = Math.max(1, Math.round(Math.abs(rise) / (o.stepH || 0.22)));
      const out = [];
      for (let i = 0; i < n; i++) {
        const top = y0 + rise * (i + 1) / n;
        const bottom = o.open ? top - 0.12 : Math.min(y0, y1) - (o.base || 0.02);
        let a, b;
        if (dir === 'n') { const L = z1 - z0; a = [x0, z1 - L * (i + 1) / n]; b = [x1, z1 - L * i / n]; }
        else if (dir === 's') { const L = z1 - z0; a = [x0, z0 + L * i / n]; b = [x1, z0 + L * (i + 1) / n]; }
        else if (dir === 'e') { const L = x1 - x0; a = [x0 + L * i / n, z0]; b = [x0 + L * (i + 1) / n, z1]; }
        else { const L = x1 - x0; a = [x1 - L * (i + 1) / n, z0]; b = [x1 - L * i / n, z1]; }
        out.push(this.box(a[0], bottom, a[1], b[0], top, b[1], mat, { tag: 'stairs', uvScale: o.uvScale }));
      }
      return out;
    }

    light(x, y, z, color, r, o) {
      o = o || {};
      const L = Object.assign({ pos: [x, y, z], color: color || [1, 0.9, 0.75], r: r || 8, i: o.i || 1, group: this.gid }, o);
      this.w.lights.push(L);
      return L;
    }
    spot(x, y, z, dir, cone, color, r, o) {
      return this.light(x, y, z, color, r, Object.assign({ spot: M.norm(dir), cone: Math.cos(cone) }, o || {}));
    }
    zone(x0, y0, z0, x1, y1, z1, o) {
      const [min, max] = norm(x0, y0, z0, x1, y1, z1);
      const zn = Object.assign({ min, max }, o || {});
      this.w.zones.push(zn);
      return zn;
    }
    decal(x, y, z, face, w, h, tex, o) {
      const d = Object.assign({ pos: [x, y, z], face, w, h, tex, group: this.gid }, o || {});
      this.w.decals.push(d);
      return d;
    }
    decor(model, x, y, z, yaw, o) {
      o = o || {};
      const d = Object.assign({ model, pos: [x, y, z], yaw: yaw || 0, group: this.gid }, o);
      this.w.decor.push(d);
      const sz = M.DECOR[model];
      if (sz && o.solid !== false) {
        const c = Math.abs(Math.cos(d.yaw)), s = Math.abs(Math.sin(d.yaw));
        const sc = o.scale || 1;
        const hw = (sz.w * c + sz.d * s) / 2 * sc, hd = (sz.w * s + sz.d * c) / 2 * sc;
        d.solid = this.box(x - hw, y, z - hd, x + hw, y + sz.h * sc, z + hd, 'clip', { vis: false, decor: true, noShot: !!o.noShot });
      }
      return d;
    }
    water(x0, z0, x1, z1, y, o) {
      const wt = Object.assign({ min: [x0, y - 1, z0], max: [x1, y, z1], y }, o || {});
      this.w.water.push(wt);
      return wt;
    }
    prop(def) {
      def.group = def.group || this.gid;
      this.w.propDefs.push(def);
      return def;
    }
    door(x, z, axis, w, o) {
      o = o || {};
      return this.prop(Object.assign({ kind: 'door', pos: [x, o.y || 0, z], axis, w: w || 1, h: o.h || 2.2 }, o));
    }

    plan(o) {
      const y = o.y || 0, H = o.h || 3, T = o.t || 0.2;
      const rooms = o.rooms.map(r => Object.assign({ h: H, y }, r));
      const lo = r => r.y - (r.floorT || 0.25);
      const hi = r => r.y + r.h + (r.noCeil ? 0 : (r.ceilT || 0.25));
      const roomsAt = (x, z) => rooms.filter(r => x > r.x0 + 1e-4 && x < r.x1 - 1e-4 && z > r.z0 + 1e-4 && z < r.z1 - 1e-4);
      const links = new Set((o.open || []).map(p => p.slice().sort().join('|')));
      const linked = (a, b) => a.id && b.id && links.has([a.id, b.id].sort().join('|'));
      const lines = new Map();
      const addEdge = (axis, c, a, b) => {
        const key = axis + ':' + c.toFixed(3);
        if (!lines.has(key)) lines.set(key, { axis, c, iv: [], ops: [] });
        lines.get(key).iv.push([a, b]);
      };
      for (const r of rooms) {
        if (r.noWalls === true) continue;
        addEdge('z', r.z0, r.x0, r.x1);
        addEdge('z', r.z1, r.x0, r.x1);
        addEdge('x', r.x0, r.z0, r.z1);
        addEdge('x', r.x1, r.z0, r.z1);
      }
      const sideSets = (L, along) => {
        const px = L.axis === 'z' ? along : L.c, pz = L.axis === 'z' ? L.c : along;
        const A = L.axis === 'z' ? roomsAt(px, pz - 0.05) : roomsAt(px - 0.05, pz);
        const Bs = L.axis === 'z' ? roomsAt(px, pz + 0.05) : roomsAt(px + 0.05, pz);
        const openA = r => r.noWalls === true || (r.noWalls && r.noWalls.includes(L.axis === 'z' ? 's' : 'e'));
        const openB = r => r.noWalls === true || (r.noWalls && r.noWalls.includes(L.axis === 'z' ? 'n' : 'w'));
        return [A.filter(r => !openA(r)), Bs.filter(r => !openB(r)), A.some(openA) || Bs.some(openB)];
      };
      const openings = [];
      const addOpening = (spec, kind) => {
        const arr = Array.isArray(spec);
        const x = arr ? spec[0] : spec.x, z = arr ? spec[1] : spec.z;
        const w = (arr ? spec[2] : spec.w) || 1;
        let line = null;
        for (const L of lines.values()) {
          if (!arr && spec.axis && spec.axis !== L.axis) continue;
          const along = L.axis === 'z' ? x : z, across = L.axis === 'z' ? z : x;
          if (Math.abs(across - L.c) > 0.02) continue;
          if (L.iv.some(iv => along >= iv[0] - 1e-3 && along <= iv[1] + 1e-3)) { line = L; break; }
        }
        if (!line) throw new Error('opening not on wall at ' + x + ',' + z);
        const along = line.axis === 'z' ? x : z;
        const [SA, SB] = sideSets(line, along);
        const ys = SA.concat(SB).map(r => r.y);
        const base = !arr && spec.y !== undefined ? spec.y : ys.length ? Math.max(...ys) : y;
        const op = Object.assign({ kind, a: along - w / 2, b: along + w / 2, line }, arr ? {} : spec);
        if (kind === 'door') { op.y0 = base; op.y1 = base + ((arr ? spec[3] : spec.h) || 2.2); }
        else if (kind === 'window') {
          const w0 = arr ? spec[3] : spec.y0, w1 = arr ? spec[4] : spec.y1;
          op.y0 = base + (w0 !== undefined ? w0 : 0.9);
          op.y1 = base + (w1 !== undefined ? w1 : 2.1);
        } else if (!arr && spec.y !== undefined) { op.y0 = spec.y; op.y1 = spec.y + (spec.h || 1e5); }
        else { op.y0 = -1e5; op.y1 = 1e5; }
        line.ops.push(op);
        openings.push(op);
        return op;
      };
      for (const d of o.doors || []) addOpening(d, 'door');
      for (const d of o.windows || []) addOpening(d, 'window');
      for (const d of o.gaps || []) addOpening(d, 'gap');
      const outer = o.outer || 'brick';
      for (const L of lines.values()) {
        const pts = new Set();
        for (const iv of L.iv) { pts.add(+iv[0].toFixed(4)); pts.add(+iv[1].toFixed(4)); }
        for (const op of L.ops) { pts.add(+op.a.toFixed(4)); pts.add(+op.b.toFixed(4)); }
        for (const r of rooms) {
          if (L.axis === 'z') { pts.add(+r.x0.toFixed(4)); pts.add(+r.x1.toFixed(4)); }
          else { pts.add(+r.z0.toFixed(4)); pts.add(+r.z1.toFixed(4)); }
        }
        const sorted = [...pts].sort((p, q) => p - q);
        const segs = [];
        for (let i = 0; i + 1 < sorted.length; i++) {
          const a = sorted[i], b = sorted[i + 1];
          if (b - a < 1e-3) continue;
          const mid = (a + b) / 2;
          if (!L.iv.some(iv => mid > iv[0] && mid < iv[1])) continue;
          const [SA, SB] = sideSets(L, mid);
          const aOnly = SA.filter(r => !SB.includes(r) && !SB.some(q => linked(r, q)));
          const bOnly = SB.filter(r => !SA.includes(r) && !SA.some(q => linked(r, q)));
          if (!aOnly.length && !bOnly.length) continue;
          const cuts = new Set();
          for (const r of aOnly.concat(bOnly)) { cuts.add(+lo(r).toFixed(4)); cuts.add(+hi(r).toFixed(4)); }
          const cs = [...cuts].sort((p, q) => p - q);
          const ivs = [];
          for (let k = 0; k + 1 < cs.length; k++) {
            const y0 = cs[k], y1 = cs[k + 1], ym = (y0 + y1) / 2;
            if (y1 - y0 < 1e-3) continue;
            const cov = r => ym > lo(r) && ym < hi(r);
            if (SA.some(r => SB.includes(r) && cov(r))) continue;
            if (SA.some(r => cov(r) && SB.some(q => cov(q) && linked(r, q)))) continue;
            const ra = SA.find(cov), rb = SB.find(cov);
            if (!ra && !rb) continue;
            if (!aOnly.some(cov) && !bOnly.some(cov)) continue;
            const matA = ra ? (ra.wall || 'plaster') : (rb && rb.outwall) || outer;
            const matB = rb ? (rb.wall || 'plaster') : (ra && ra.outwall) || outer;
            const last = ivs[ivs.length - 1];
            if (last && Math.abs(last.y1 - y0) < 1e-3 && last.matA === matA && last.matB === matB) last.y1 = y1;
            else ivs.push({ y0, y1, matA, matB });
          }
          if (!ivs.length) continue;
          const ops = L.ops.filter(q => mid > q.a && mid < q.b);
          segs.push({ a, b, ops, ivs, key: JSON.stringify(ivs) });
        }
        const merged = [];
        for (const p of segs) {
          const q = merged[merged.length - 1];
          if (q && !q.ops.length && !p.ops.length && Math.abs(q.b - p.a) < 1e-3 && q.key === p.key) q.b = p.b;
          else merged.push(Object.assign({}, p));
        }
        for (const p of merged) {
          for (const iv of p.ivs) {
            const mat = { side: iv.matA, top: 'trim', bottom: 'trim' };
            if (L.axis === 'z') { mat.nz = iv.matA; mat.pz = iv.matB; } else { mat.nx = iv.matA; mat.px = iv.matB; }
            const mk = (y0, y1) => {
              if (y1 - y0 < 0.01) return;
              if (L.axis === 'z') this.box(p.a, y0, L.c - T / 2, p.b, y1, L.c + T / 2, mat, { tag: 'wall' });
              else this.box(L.c - T / 2, y0, p.a, L.c + T / 2, y1, p.b, mat, { tag: 'wall' });
            };
            let parts = [[iv.y0, iv.y1]];
            for (const op of p.ops) {
              const next = [];
              for (const [y0, y1] of parts) {
                if (op.y1 <= y0 || op.y0 >= y1) { next.push([y0, y1]); continue; }
                if (op.y0 > y0) next.push([y0, op.y0]);
                if (op.y1 < y1) next.push([op.y1, y1]);
              }
              parts = next;
            }
            for (const [y0, y1] of parts) mk(y0, y1);
          }
        }
      }
      for (const op of openings) {
        const L = op.line;
        const cx = L.axis === 'z' ? (op.a + op.b) / 2 : L.c, cz = L.axis === 'z' ? L.c : (op.a + op.b) / 2;
        if (op.kind === 'window' && op.glass !== false && !op.bars && o.glass !== false) this.prop({ kind: 'glass', id: op.id, pos: [cx, op.y0, cz], axis: L.axis === 'z' ? 'x' : 'z', w: op.b - op.a, h: op.y1 - op.y0, group: this.gid, tint: op.tint });
        if (op.kind === 'window' && op.bars) {
          if (L.axis === 'z') this.box(op.a, op.y0, L.c - 0.03, op.b, op.y1, L.c + 0.03, 'bars', { noShot: true });
          else this.box(L.c - 0.03, op.y0, op.a, L.c + 0.03, op.y1, op.b, 'bars', { noShot: true });
        }
        if (op.kind === 'door' && op.door) this.prop(Object.assign({ kind: 'door', pos: [cx, op.y0, cz], axis: L.axis === 'z' ? 'x' : 'z', w: op.b - op.a, h: op.y1 - op.y0, group: this.gid }, op.door));
      }
      for (const r of rooms) {
        if (!r.noFloor) {
          let rects = [[r.x0, r.z0, r.x1, r.z1]];
          for (const h of r.holes || []) rects = rects.flatMap(q => subtractRect(q, h));
          for (const q of rects) this.box(q[0], r.y - (r.floorT || 0.25), q[1], q[2], r.y, q[3], { top: r.floor || 'concrete', side: 'trim', bottom: r.under || 'plaster' }, { tag: 'floor' });
        }
        if (!r.noCeil) {
          let rects = [[r.x0, r.z0, r.x1, r.z1]];
          for (const h of r.ceilHoles || []) rects = rects.flatMap(q => subtractRect(q, h));
          const top = r.y + r.h;
          for (const u of rooms) {
            if (u === r || u.noFloor) continue;
            const fb = u.y - (u.floorT || 0.25);
            if (fb >= top - 0.01 && fb <= top + 0.3) rects = rects.flatMap(q => subtractRect(q, [u.x0, u.z0, u.x1, u.z1]));
          }
          for (const q of rects) this.box(q[0], top, q[1], q[2], top + (r.ceilT || 0.25), q[3], { bottom: r.ceil || 'plaster', side: 'trim', top: r.roof || 'roof' }, { tag: 'ceil' });
        }
      }
      return { openings, rooms };
    }
  }
  M.Builder = Builder;

  M.buildLevel = (def, o) => {
    const w = new World(def.world || {});
    const B = new Builder(w);
    def.build(B, w, o || {});
    w.finalize();
    return w;
  };
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
