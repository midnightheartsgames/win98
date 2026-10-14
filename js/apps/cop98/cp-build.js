(function (C) {
  'use strict';
  const { clamp } = C;
  const FLAG = { TWO_SIDED: 1, INDOOR: 2, EMISSIVE: 4, ALPHA: 8 };
  const FACES = ['e', 'w', 'n', 's', 't', 'b'];

  class Builder {
    constructor(texIndex) {
      this.texIndex = texIndex;
      this.tris = [];
      this.colliders = [];
      this.zones = [];
      this.markers = {};
      this.flats = [];
      this.lights = [];
      this.frames = [];
      this.frame = { ox: 0, oy: 0, oz: 0, c: 1, s: 0, yaw: 0 };
    }

    push(ox, oy, oz, yaw = 0) {
      this.frames.push(this.frame);
      const f = this.frame;
      const wx = f.ox + ox * f.c - oy * f.s, wy = f.oy + ox * f.s + oy * f.c, wz = f.oz + oz, a = f.yaw + yaw;
      this.frame = { ox: wx, oy: wy, oz: wz, c: Math.cos(a), s: Math.sin(a), yaw: a };
      return this;
    }
    pop() { this.frame = this.frames.pop(); return this; }
    world(x, y, z) { const f = this.frame; return [f.ox + x * f.c - y * f.s, f.oy + x * f.s + y * f.c, f.oz + z]; }
    worldYaw(yaw) { return this.frame.yaw + yaw; }

    tex(name) { const i = this.texIndex[name]; if (i == null) throw new Error('texture ' + name); return i; }

    faceLight(n, flags) {
      if (flags & FLAG.INDOOR) return 0.78 + n[2] * 0.12 + Math.abs(n[0]) * 0.06;
      const s = C.SUN, d = n[0] * s[0] + n[1] * s[1] + n[2] * s[2];
      return 0.52 + Math.max(0, d) * 0.62 + (n[2] < -0.5 ? -0.18 : 0);
    }

    quadWorld(p, uv, texName, flags = 0, lightOverride) {
      const ax = p[1][0] - p[0][0], ay = p[1][1] - p[0][1], az = p[1][2] - p[0][2];
      const bx = p[2][0] - p[0][0], by = p[2][1] - p[0][1], bz = p[2][2] - p[0][2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const light = lightOverride != null ? lightOverride : this.faceLight([nx, ny, nz], flags);
      const t = this.tex(texName);
      this.tri(p[0], p[1], p[2], uv[0], uv[1], uv[2], light, t, flags);
      if (p.length > 3) this.tri(p[0], p[2], p[3], uv[0], uv[2], uv[3], light, t, flags);
    }

    tri(a, b, c, ua, ub, uc, light, tex, flags) {
      this.tris.push(a[0], a[1], a[2], ua[0], ua[1], b[0], b[1], b[2], ub[0], ub[1], c[0], c[1], c[2], uc[0], uc[1], light, tex, flags);
    }

    quad(p, texName, opts = {}) {
      const w = p.map(q => this.world(q[0], q[1], q[2]));
      const us = opts.uv || 2;
      let uv = opts.uvs;
      if (!uv) {
        const e1 = Math.hypot(w[1][0] - w[0][0], w[1][1] - w[0][1], w[1][2] - w[0][2]);
        const e2 = Math.hypot(w[3][0] - w[0][0], w[3][1] - w[0][1], w[3][2] - w[0][2]);
        const u0 = opts.u0 || 0, v0 = opts.v0 || 0;
        uv = [[u0, v0 + e2 / us], [u0 + e1 / us, v0 + e2 / us], [u0 + e1 / us, v0], [u0, v0]];
        if (opts.planar) {
          uv = w.map(q => [q[0] / us, q[1] / us]);
        }
      }
      this.quadWorld(w, uv, texName, opts.flags || 0, opts.light);
    }

    box(cx, cy, z0, lx, ly, h, yaw, texName, opts = {}) {
      this.push(cx, cy, z0, yaw);
      const hx = lx / 2, hy = ly / 2;
      const top = opts.top || texName, faces = opts.faces || FACES, indoor = opts.indoor || '', us = opts.uv || 2;
      const fl = k => (indoor.includes(k) ? FLAG.INDOOR : 0) | (opts.flags || 0);
      const inward = opts.inward;
      const add = (k, pts, tex, extra = {}) => {
        if (!faces.includes(k)) return;
        const q = inward ? [pts[1], pts[0], pts[3], pts[2]] : pts;
        this.quad(q, tex, Object.assign({ uv: us, flags: fl(k) }, extra));
      };
      add('s', [[-hx, -hy, 0], [hx, -hy, 0], [hx, -hy, h], [-hx, -hy, h]], texName);
      add('n', [[hx, hy, 0], [-hx, hy, 0], [-hx, hy, h], [hx, hy, h]], texName);
      add('e', [[hx, -hy, 0], [hx, hy, 0], [hx, hy, h], [hx, -hy, h]], texName);
      add('w', [[-hx, hy, 0], [-hx, -hy, 0], [-hx, -hy, h], [-hx, hy, h]], texName);
      add('t', [[-hx, -hy, h], [hx, -hy, h], [hx, hy, h], [-hx, hy, h]], top, { planar: !opts.topUV, uv: opts.topUV || us });
      add('b', [[-hx, hy, 0], [hx, hy, 0], [hx, -hy, 0], [-hx, -hy, 0]], top, { planar: true });
      this.pop();
      if (opts.collide !== false) this.collider(cx, cy, z0, lx, ly, h, yaw, opts.mat || 'concrete', opts.walk !== false);
    }

    collider(cx, cy, z0, lx, ly, h, yaw, mat = 'concrete', walk = true, ramp = null) {
      const [wx, wy, wz] = this.world(cx, cy, z0), a = this.worldYaw(yaw);
      this.colliders.push({ x: wx, y: wy, z0: wz, z1: wz + h, hx: lx / 2, hy: ly / 2, c: Math.cos(a), s: Math.sin(a), mat, walk, ramp });
    }

    ramp(cx, cy, z0, lx, ly, rise, yaw, texName, opts = {}) {
      this.push(cx, cy, z0, yaw);
      const hx = lx / 2, hy = ly / 2, th = opts.thick || 0.25;
      const fl = (opts.indoor ? FLAG.INDOOR : 0);
      this.quad([[-hx, -hy, 0], [hx, -hy, rise], [hx, hy, rise], [-hx, hy, 0]], texName, { uv: opts.uv || 1.5, flags: fl | (opts.twoSided ? FLAG.TWO_SIDED : 0) });
      this.quad([[-hx, -hy, -th], [hx, -hy, rise - th], [hx, -hy, rise], [-hx, -hy, 0]], opts.side || texName, { uv: 2, flags: fl });
      this.quad([[hx, hy, rise - th], [-hx, hy, -th], [-hx, hy, 0], [hx, hy, rise]], opts.side || texName, { uv: 2, flags: fl });
      this.quad([[hx, -hy, rise - th], [-hx, -hy, -th], [-hx, hy, -th], [hx, hy, rise - th]], opts.side || texName, { uv: 2, flags: fl });
      if (opts.rails) {
        for (const sy of [-hy, hy]) {
          this.quad([[-hx, sy, 0.95], [hx, sy, rise + 0.95], [hx, sy, rise + 1.0], [-hx, sy, 1.0]], 'metal', { flags: FLAG.TWO_SIDED | fl });
          for (let k = 0; k <= 4; k++) { const t = k / 4, px = -hx + lx * t; this.quad([[px - 0.03, sy, rise * t], [px + 0.03, sy, rise * t], [px + 0.03, sy, rise * t + 1.0], [px - 0.03, sy, rise * t + 1.0]], 'metal', { flags: FLAG.TWO_SIDED | fl }); }
        }
      }
      this.pop();
      const [wx, wy, wz] = this.world(cx, cy, z0), a = this.worldYaw(yaw);
      this.colliders.push({ x: wx, y: wy, z0: wz - th, z1: wz + rise, hx, hy, c: Math.cos(a), s: Math.sin(a), mat: opts.mat || 'metal', walk: true, ramp: { h0: wz, h1: wz + rise } });
    }

    wall(x0, y0, x1, y1, z0, h, thick, texName, opts = {}) {
      const len = Math.hypot(x1 - x0, y1 - y0), yaw = Math.atan2(y1 - y0, x1 - x0);
      const ops = (opts.openings || []).slice().sort((a, b) => a.a - b.a);
      const pieces = [];
      let cur = 0;
      for (const o of ops) {
        if (o.a > cur) pieces.push({ a: cur, b: o.a, z0: 0, z1: h });
        if (o.z0 > 0) pieces.push({ a: o.a, b: o.b, z0: 0, z1: o.z0, sill: true });
        if (o.z1 < h) pieces.push({ a: o.a, b: o.b, z0: o.z1, z1: h, lintel: true });
        if (o.glass) this.windowPane(x0, y0, yaw, o, z0, opts);
        cur = o.b;
      }
      if (cur < len) pieces.push({ a: cur, b: len, z0: 0, z1: h });
      const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
      const inside = opts.inside;
      const indoor = inside === 'left' ? 'n' : inside === 'right' ? 's' : inside === 'both' ? 'nsew' : '';
      for (const p of pieces) {
        const mid = (p.a + p.b) / 2, pl = p.b - p.a;
        if (pl < 0.01) continue;
        const faces = ['n', 's', 't', 'b'];
        if (p.a === 0 && !opts.noCaps) faces.push('w');
        if (p.b === len && !opts.noCaps) faces.push('e');
        if (p.a > 0) faces.push('w');
        if (p.b < len) faces.push('e');
        this.box(x0 + ux * mid, y0 + uy * mid, z0 + p.z0, pl, thick, p.z1 - p.z0, yaw, texName, {
          faces, indoor: indoor + (p.lintel ? 'b' : '') + (inside ? 'ew' : ''), uv: opts.uv || 2, top: opts.top || texName, mat: opts.mat, collide: opts.collide
        });
      }
    }

    windowPane(x0, y0, yaw, o, z0, opts) {
      const ux = Math.cos(yaw), uy = Math.sin(yaw);
      const a = o.a, b = o.b;
      this.push(x0, y0, z0, yaw);
      this.quad([[a, 0, o.z0], [b, 0, o.z0], [b, 0, o.z1], [a, 0, o.z1]], 'window', { uvs: [[0, 1], [1, 1], [1, 0], [0, 0]], flags: FLAG.TWO_SIDED | (opts.inside ? FLAG.INDOOR : 0) });
      this.pop();
      return [ux, uy];
    }

    room(cx, cy, z0, lx, ly, h, yaw, opts = {}) {
      this.push(cx, cy, z0, yaw);
      const hx = lx / 2, hy = ly / 2, t = opts.thick || 0.3, tex = opts.wall || 'brick', inTex = opts.inner;
      const doors = opts.doors || {}, wins = opts.windows || {};
      const sideOps = (k, len) => {
        const list = [];
        for (const d of doors[k] || []) list.push({ a: len / 2 + d - 0.8 * (opts.doorW || 1) , b: len / 2 + d + 0.8 * (opts.doorW || 1), z0: 0, z1: 2.3 });
        for (const w of wins[k] || []) list.push({ a: len / 2 + w - 0.7, b: len / 2 + w + 0.7, z0: 1.0, z1: 2.1, glass: opts.glass !== false });
        return list;
      };
      const wallOpts = k => ({ openings: sideOps(k, k === 's' || k === 'n' ? lx : ly), inside: 'left', uv: 2, mat: opts.mat, top: tex });
      this.wall(-hx, -hy, hx, -hy, 0, h, t, tex, wallOpts('s'));
      this.wall(hx, -hy, hx, hy, 0, h, t, tex, wallOpts('e'));
      this.wall(hx, hy, -hx, hy, 0, h, t, tex, wallOpts('n'));
      this.wall(-hx, hy, -hx, -hy, 0, h, t, tex, wallOpts('w'));
      if (opts.floor !== false) this.quad([[-hx, -hy, 0.02], [hx, -hy, 0.02], [hx, hy, 0.02], [-hx, hy, 0.02]], opts.floorTex || 'concrete', { planar: true, uv: 2, flags: FLAG.INDOOR });
      if (opts.ceiling !== false) this.quad([[-hx, hy, h], [hx, hy, h], [hx, -hy, h], [-hx, -hy, h]], opts.ceilTex || 'plaster', { planar: true, uv: 2, flags: FLAG.INDOOR });
      if (opts.roof === 'flat') {
        this.box(0, 0, h, lx + 0.4, ly + 0.4, 0.3, 0, opts.roofEdge || tex, { top: opts.roofTex || 'roof', faces: ['n', 's', 'e', 'w', 't'], mat: opts.mat });
      } else if (opts.roof === 'gable') {
        const rh = opts.ridge || ly * 0.35, ov = 0.5;
        this.quad([[-hx - ov, -hy - ov, h], [hx + ov, -hy - ov, h], [hx + ov, 0, h + rh], [-hx - ov, 0, h + rh]], opts.roofTex || 'slate', { uv: 2.5 });
        this.quad([[hx + ov, hy + ov, h], [-hx - ov, hy + ov, h], [-hx - ov, 0, h + rh], [hx + ov, 0, h + rh]], opts.roofTex || 'slate', { uv: 2.5 });
        this.quad([[-hx - ov, 0, h + rh], [hx + ov, 0, h + rh], [hx + ov, -hy - ov, h], [-hx - ov, -hy - ov, h]], opts.roofTex || 'slate', { uv: 2.5, flags: FLAG.INDOOR, light: 0.6 });
        this.quad([[hx + ov, 0, h + rh], [-hx - ov, 0, h + rh], [-hx - ov, hy + ov, h], [hx + ov, hy + ov, h]], opts.roofTex || 'slate', { uv: 2.5, flags: FLAG.INDOOR, light: 0.6 });
        for (const sx of [-hx, hx]) {
          const pts = sx < 0 ? [[sx, hy, h], [sx, -hy, h], [sx, 0, h + rh]] : [[sx, -hy, h], [sx, hy, h], [sx, 0, h + rh]];
          const w = pts.map(q => this.world(q[0], q[1], q[2]));
          this.tri(w[0], w[1], w[2], [0, 1], [ly / 2, 1], [ly / 4, 1 - rh / 2], this.faceLight([Math.sign(sx) * this.frame.c, Math.sign(sx) * this.frame.s, 0], 0), this.tex(opts.gableTex || tex), FLAG.TWO_SIDED);
        }
        this.collider(0, 0, h, lx + 1, ly + 1, 0.2, 0, 'wood', false);
      }
      this.pop();
      if (opts.zone !== false) this.zone(cx, cy, z0, lx - t, ly - t, h, yaw, opts.zoneInfo || {});
    }

    zone(cx, cy, z0, lx, ly, h, yaw, info = {}) {
      const corners = [[-lx / 2, -ly / 2], [lx / 2, -ly / 2], [lx / 2, ly / 2], [-lx / 2, ly / 2]].map(([x, y]) => { this.push(cx, cy, z0, yaw); const w = this.world(x, y, 0); this.pop(); return w; });
      const [wx, wy, wz] = this.world(cx, cy, z0), a = this.worldYaw(yaw);
      const z = Object.assign({ x: wx, y: wy, z0: wz - 0.5, z1: wz + h, hx: lx / 2, hy: ly / 2, c: Math.cos(a), s: Math.sin(a), indoor: true, corners }, info);
      this.zones.push(z);
      return z;
    }

    cylinder(cx, cy, z0, r, h, texName, opts = {}) {
      const seg = opts.seg || 12;
      this.push(cx, cy, z0, 0);
      const circ = 2 * Math.PI * r, us = opts.uv || 2;
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * C.TAU, a1 = ((i + 1) / seg) * C.TAU;
        const p0 = [Math.cos(a0) * r, Math.sin(a0) * r], p1 = [Math.cos(a1) * r, Math.sin(a1) * r];
        const u0 = (i / seg) * circ / us, u1 = ((i + 1) / seg) * circ / us;
        this.quad([[p0[0], p0[1], 0], [p1[0], p1[1], 0], [p1[0], p1[1], h], [p0[0], p0[1], h]], texName, { uvs: [[u0, h / us], [u1, h / us], [u1, 0], [u0, 0]], flags: opts.flags || 0 });
        if (opts.cap !== false) {
          const w = [[0, 0, h], [p0[0], p0[1], h], [p1[0], p1[1], h]].map(q => this.world(q[0], q[1], q[2]));
          this.tri(w[0], w[1], w[2], [0.5, 0.5], [0.5 + p0[0] / us, 0.5 + p0[1] / us], [0.5 + p1[0] / us, 0.5 + p1[1] / us], this.faceLight([0, 0, 1], 0), this.tex(opts.capTex || texName), 0);
        }
      }
      this.pop();
      if (opts.collide !== false) this.collider(cx, cy, z0, r * 1.7, r * 1.7, h, 0, opts.mat || 'metal', true);
    }

    hcylinder(cx, cy, z0, r, len, yaw, texName, opts = {}) {
      const seg = opts.seg || 10;
      this.push(cx, cy, z0 + r, yaw);
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * C.TAU, a1 = ((i + 1) / seg) * C.TAU;
        const y0 = Math.cos(a0) * r, z0q = Math.sin(a0) * r, y1 = Math.cos(a1) * r, z1q = Math.sin(a1) * r;
        this.quad([[-len / 2, y1, z1q], [len / 2, y1, z1q], [len / 2, y0, z0q], [-len / 2, y0, z0q]], texName, { uv: opts.uv || 2, flags: opts.flags || 0 });
        if (opts.cap !== false) {
          for (const sx of [-len / 2, len / 2]) {
            const pts = sx > 0 ? [[sx, 0, 0], [sx, y0, z0q], [sx, y1, z1q]] : [[sx, 0, 0], [sx, y1, z1q], [sx, y0, z0q]];
            const w = pts.map(q => this.world(q[0], q[1], q[2]));
            this.tri(w[0], w[1], w[2], [0.5, 0.5], [0.5 + y0 / 2, 0.5 + z0q / 2], [0.5 + y1 / 2, 0.5 + z1q / 2], 0.8, this.tex(opts.capTex || texName), 0);
          }
        }
      }
      this.pop();
      if (opts.collide !== false) this.collider(cx, cy, z0, len, r * 1.8, r * 2, yaw, opts.mat || 'metal', true);
    }

    beam(x0, y0, z0, x1, y1, z1, w, texName, opts = {}) {
      const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, len = Math.hypot(dx, dy, dz);
      const ux = dx / len, uy = dy / len, uz = dz / len;
      let px = -uy, py = ux, pz = 0;
      if (Math.hypot(px, py) < 1e-3) { px = 1; py = 0; }
      const pl = Math.hypot(px, py, pz); px /= pl; py /= pl; pz /= pl;
      const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px;
      const h = w / 2;
      const corner = (s, t, e) => [x0 + dx * e + (px * s + qx * t) * h, y0 + dy * e + (py * s + qy * t) * h, z0 + dz * e + (pz * s + qz * t) * h];
      const faces = [[[1, 1], [-1, 1]], [[-1, 1], [-1, -1]], [[-1, -1], [1, -1]], [[1, -1], [1, 1]]];
      for (const [a, b] of faces) {
        const p = [corner(a[0], a[1], 0), corner(b[0], b[1], 0), corner(b[0], b[1], 1), corner(a[0], a[1], 1)].map(q => this.world(q[0], q[1], q[2]));
        this.quadWorld([p[1], p[0], p[3], p[2]], [[0, len / 2], [0.25, len / 2], [0.25, 0], [0, 0]], texName, (opts.flags || 0) | FLAG.TWO_SIDED);
      }
    }

    lattice(cx, cy, z0, base, topW, h, texName = 'metal', opts = {}) {
      const levels = Math.max(2, Math.round(h / (opts.step || 3)));
      const leg = (sx, sy, t) => { const w = (base + (topW - base) * t) / 2; return [sx * w, sy * w, h * t]; };
      this.push(cx, cy, z0, opts.yaw || 0);
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      const bw = opts.beam || 0.22;
      for (const [sx, sy] of corners) { const a = leg(sx, sy, 0), b = leg(sx, sy, 1); this.beam(a[0], a[1], a[2], b[0], b[1], b[2], bw * 1.4, texName); }
      for (let l = 0; l < levels; l++) {
        const t0 = l / levels, t1 = (l + 1) / levels;
        for (let k = 0; k < 4; k++) {
          const [ax, ay] = corners[k], [bx, by] = corners[(k + 1) % 4];
          const p0 = leg(ax, ay, t0), p1 = leg(bx, by, t1), p2 = leg(bx, by, t0), p3 = leg(ax, ay, t1), p4 = leg(bx, by, t1);
          this.beam(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], bw, texName);
          this.beam(p2[0], p2[1], p2[2], p3[0], p3[1], p3[2], bw, texName);
          this.beam(p3[0], p3[1], p3[2], p4[0], p4[1], p4[2], bw, texName);
        }
      }
      this.pop();
      if (opts.collide !== false) for (const [sx, sy] of corners) { const a = leg(sx, sy, 0); this.push(cx, cy, z0, opts.yaw || 0); this.collider(a[0], a[1], 0, 0.6, 0.6, h * 0.5, 0, 'metal', false); this.pop(); }
    }

    marker(name, x, y, z, yaw = 0, extra = {}) {
      const [wx, wy, wz] = this.world(x, y, z);
      this.markers[name] = Object.assign({ x: wx, y: wy, z: wz, yaw: this.worldYaw(yaw) }, extra);
      return this.markers[name];
    }

    lamp(x, y, z, size = 0.35, color = [1, 0.85, 0.6], opts = {}) {
      const [wx, wy, wz] = this.world(x, y, z);
      this.lights.push({ x: wx, y: wy, z: wz, color, size, flicker: !!opts.flicker, indoor: opts.indoor !== false, beacon: !!opts.beacon });
      this.push(x, y, z, 0);
      const s = size / 2;
      this.quad([[-s, -s, 0], [s, -s, 0], [s, s, 0], [-s, s, 0]], 'lamp', { uvs: [[0, 1], [1, 1], [1, 0], [0, 0]], flags: FLAG.EMISSIVE | FLAG.TWO_SIDED });
      this.pop();
    }

    flatten(x, y, w, d, yaw, h, blend) { const [wx, wy] = this.world(x, y, 0); this.flats.push({ x: wx, y: wy, w, d, yaw: this.worldYaw(yaw), h, blend }); }

    bake(gridN, cellSize) {
      const bins = new Array(gridN * gridN);
      const counts = new Int32Array(gridN * gridN);
      const n = this.tris.length / 18;
      const binOf = new Int32Array(n);
      for (let t = 0; t < n; t++) {
        const o = t * 18;
        const x = (this.tris[o] + this.tris[o + 5] + this.tris[o + 10]) / 3, y = (this.tris[o + 1] + this.tris[o + 6] + this.tris[o + 11]) / 3;
        const gx = clamp(Math.floor(x / cellSize), 0, gridN - 1), gy = clamp(Math.floor(y / cellSize), 0, gridN - 1);
        binOf[t] = gy * gridN + gx; counts[binOf[t]]++;
      }
      for (let i = 0; i < bins.length; i++) if (counts[i]) bins[i] = { data: new Float32Array(counts[i] * 18), count: 0 };
      for (let t = 0; t < n; t++) {
        const b = bins[binOf[t]], o = t * 18;
        for (let k = 0; k < 18; k++) b.data[b.count * 18 + k] = this.tris[o + k];
        b.count++;
      }
      return bins;
    }
  }

  C.Builder = Builder;
  C.FLAG = FLAG;
})(globalThis.Cop98 = globalThis.Cop98 || {});
