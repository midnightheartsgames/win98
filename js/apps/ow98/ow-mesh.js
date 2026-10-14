(function (O) {
  'use strict';
  const M4 = O.M4;

  function colOf(c) {
    if (Array.isArray(c)) return c;
    return O.rgb(c);
  }

  class MB {
    constructor() { this.P = []; this.N = []; this.C = []; this.B = []; this.G = []; this.b = 0; this.stack = [M4.ident()]; this.emit = 0; this.gloss = 0; this.g = 0; this.glossMap = null; }
    get m() { return this.stack[this.stack.length - 1]; }
    bone(i) { this.b = i; return this; }
    push(mat) { this.stack.push(M4.mul(this.m, mat)); return this; }
    pop() { if (this.stack.length > 1) this.stack.pop(); return this; }
    at(x, y, z, rx = 0, ry = 0, rz = 0, s = 1) { return this.push(M4.trs(x, y, z, rx, ry, rz, s, s, s)); }
    with(x, y, z, rx, ry, rz, fn) { this.at(x, y, z, rx, ry, rz); fn(); this.pop(); return this; }
    glossFor(col, o) {
      if (o && o.gloss !== undefined) return o.gloss;
      if (this.glossMap && typeof col === 'number' && this.glossMap.has(col)) return this.glossMap.get(col);
      return this.gloss;
    }

    vert(p, n, c, e) {
      const m = this.m;
      const q = M4.point(m, p[0], p[1], p[2]);
      const nn = M4.vec(m, n[0], n[1], n[2]);
      const l = Math.hypot(nn[0], nn[1], nn[2]) || 1;
      this.P.push(q[0], q[1], q[2]);
      this.N.push(nn[0] / l, nn[1] / l, nn[2] / l);
      this.C.push(c[0], c[1], c[2], e);
      this.B.push(this.b);
      this.G.push(this.g);
    }

    tri(a, b, c, col, na, nb, nc, emit) {
      const cc = colOf(col);
      const e = emit === undefined ? this.emit : emit;
      if (!this.lockG) this.g = this.glossFor(col);
      if (!na) {
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
        na = nb = nc = n;
      }
      this.vert(a, na, cc, e); this.vert(b, nb, cc, e); this.vert(c, nc, cc, e);
    }

    quad(a, b, c, d, col, emit) { this.tri(a, b, c, col, null, null, null, emit); this.tri(a, c, d, col, null, null, null, emit); }

    box(cx, cy, cz, sx, sy, sz, col, o = {}) {
      const hx = sx / 2, hy = sy / 2, hz = sz / 2;
      const tx = o.tx === undefined ? 1 : o.tx, tz = o.tz === undefined ? 1 : o.tz;
      const bx = o.bx === undefined ? 1 : o.bx, bz = o.bz === undefined ? 1 : o.bz;
      const sh = o.shift || 0;
      if (o.rot) this.at(cx, cy, cz, o.rot[0], o.rot[1], o.rot[2]); else this.at(cx, cy, cz);
      const v = [
        [-hx * bx, -hy, -hz * bz], [hx * bx, -hy, -hz * bz], [hx * bx, -hy, hz * bz], [-hx * bx, -hy, hz * bz],
        [-hx * tx, hy, -hz * tz + sh], [hx * tx, hy, -hz * tz + sh], [hx * tx, hy, hz * tz + sh], [-hx * tx, hy, hz * tz + sh]
      ];
      const e = o.emit === undefined ? this.emit : o.emit;
      const lk = this.lockG;
      if (o.gloss !== undefined) { this.g = o.gloss; this.lockG = true; }
      const q = (a, b, c, d, cc) => this.quad(v[a], v[b], v[c], v[d], cc || col, e);
      q(4, 7, 6, 5, o.top);
      if (!o.noBottom) q(0, 1, 2, 3, o.bottom);
      q(3, 2, 6, 7, o.front);
      q(1, 0, 4, 5, o.back);
      q(2, 1, 5, 6, o.side);
      q(0, 3, 7, 4, o.side);
      this.lockG = lk;
      this.pop();
      return this;
    }

    cyl(cx, cy, cz, rb, rt, h, seg, col, o = {}) {
      if (o.rot) this.at(cx, cy, cz, o.rot[0], o.rot[1], o.rot[2]); else this.at(cx, cy, cz);
      const cc = colOf(col);
      const e = o.emit === undefined ? this.emit : o.emit;
      if (!this.lockG) this.g = this.glossFor(col, o);
      const y0 = -h / 2, y1 = h / 2;
      const sl = (rb - rt) / h;
      const sx = o.sx || 1, sz = o.sz || 1;
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const p00 = [c0 * rb * sx, y0, s0 * rb * sz], p01 = [c1 * rb * sx, y0, s1 * rb * sz], p10 = [c0 * rt * sx, y1, s0 * rt * sz], p11 = [c1 * rt * sx, y1, s1 * rt * sz];
        const n0 = [c0, sl, s0], n1 = [c1, sl, s1];
        this.vert(p00, n0, cc, e); this.vert(p11, n1, cc, e); this.vert(p01, n1, cc, e);
        this.vert(p00, n0, cc, e); this.vert(p10, n0, cc, e); this.vert(p11, n1, cc, e);
        if (o.caps !== false) {
          if (rt > 0.001) { const tc = colOf(o.capCol || col); this.vert([0, y1, 0], [0, 1, 0], tc, e); this.vert(p11, [0, 1, 0], tc, e); this.vert(p10, [0, 1, 0], tc, e); }
          if (rb > 0.001 && !o.noBottom) { const bc = colOf(o.capCol || col); this.vert([0, y0, 0], [0, -1, 0], bc, e); this.vert(p00, [0, -1, 0], bc, e); this.vert(p01, [0, -1, 0], bc, e); }
        }
      }
      this.pop();
      return this;
    }

    sphere(cx, cy, cz, rx, ry, rz, col, o = {}) {
      if (o.rot) this.at(cx, cy, cz, o.rot[0], o.rot[1], o.rot[2]); else this.at(cx, cy, cz);
      const cc = colOf(col);
      const e = o.emit === undefined ? this.emit : o.emit;
      if (!this.lockG) this.g = this.glossFor(col, o);
      const lat = o.lat || 6, lon = o.lon || 8;
      const cut = o.half ? lat / 2 : 0;
      const pt = (i, j) => {
        const th = (i / lat) * Math.PI, ph = (j / lon) * Math.PI * 2;
        const x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
        return [[x * rx, y * ry, z * rz], [x / rx, y / ry, z / rz]];
      };
      for (let i = 0; i < lat - cut; i++) {
        for (let j = 0; j < lon; j++) {
          const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
          if (i > 0) { this.vert(a[0], a[1], cc, e); this.vert(d[0], d[1], cc, e); this.vert(c[0], c[1], cc, e); }
          if (i < lat - 1) { this.vert(a[0], a[1], cc, e); this.vert(c[0], c[1], cc, e); this.vert(b[0], b[1], cc, e); }
        }
      }
      this.pop();
      return this;
    }

    torus(cx, cy, cz, R, r, col, o = {}) {
      if (o.rot) this.at(cx, cy, cz, o.rot[0], o.rot[1], o.rot[2]); else this.at(cx, cy, cz);
      const cc = colOf(col);
      const e = o.emit === undefined ? this.emit : o.emit;
      if (!this.lockG) this.g = this.glossFor(col, o);
      const s1 = o.seg || 10, s2 = o.seg2 || 5;
      const pt = (i, j) => {
        const a = (i / s1) * Math.PI * 2, b = (j / s2) * Math.PI * 2;
        const cxr = Math.cos(a), sxr = Math.sin(a);
        const x = (R + r * Math.cos(b)) * cxr, y = r * Math.sin(b), z = (R + r * Math.cos(b)) * sxr;
        return [[x, y, z], [Math.cos(b) * cxr, Math.sin(b), Math.cos(b) * sxr]];
      };
      for (let i = 0; i < s1; i++) for (let j = 0; j < s2; j++) {
        const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
        this.vert(a[0], a[1], cc, e); this.vert(c[0], c[1], cc, e); this.vert(b[0], b[1], cc, e);
        this.vert(a[0], a[1], cc, e); this.vert(d[0], d[1], cc, e); this.vert(c[0], c[1], cc, e);
      }
      this.pop();
      return this;
    }

    tube(pts, r, col, o = {}) {
      const seg = o.seg || 5;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz);
        if (l < 1e-5) continue;
        const pitch = Math.acos(Math.max(-1, Math.min(1, dy / l)));
        const yaw = Math.atan2(dx, dz);
        this.at((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 0, yaw, 0);
        this.at(0, 0, 0, pitch, 0, 0);
        this.cyl(0, 0, 0, o.r0 === undefined ? r : o.r0 + (o.r1 - o.r0) * i / (pts.length - 1), o.r1 === undefined ? r : o.r0 + (o.r1 - o.r0) * (i + 1) / (pts.length - 1), l, seg, col, { caps: false });
        this.pop(); this.pop();
      }
      return this;
    }

    data() {
      return { pos: new Float32Array(this.P), nrm: new Float32Array(this.N), col: new Float32Array(this.C), bone: new Float32Array(this.B), mat: new Float32Array(this.G), n: this.B.length };
    }
  }
  O.MB = MB;

  function orient(p, n) {
    const ux = p[1][0] - p[0][0], uy = p[1][1] - p[0][1], uz = p[1][2] - p[0][2];
    const vx = p[2][0] - p[0][0], vy = p[2][1] - p[0][1], vz = p[2][2] - p[0][2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * n[0] + cy * n[1] + cz * n[2] < 0) return [p[0], p[3], p[2], p[1]];
    return p;
  }

  class WorldMesh {
    constructor(map, opts = {}) {
      this.map = map;
      this.world = map.world;
      this.groups = new Map();
      this.opts = opts;
      const th = map.theme || {};
      this.sun = O.norm3({ x: (th.sun || [0.4, 0.8, 0.3])[0], y: (th.sun || [0.4, 0.8, 0.3])[1], z: (th.sun || [0.4, 0.8, 0.3])[2] });
      this.sunCol = O.rgb(th.sunCol === undefined ? 0xfff0dc : th.sunCol);
      this.amb = O.rgb(th.amb === undefined ? 0x8a90a8 : th.amb);
      this.gnd = O.rgb(th.ground === undefined ? 0x8a7a60 : th.ground);
      this.lights = map.vis.lights;
      this.cacheL = new Map();
      this.shadows = opts.shadows !== false;
      this.signs = [];
      this.alpha = new Map();
    }

    group(key, alpha) {
      const m = alpha ? this.alpha : this.groups;
      let g = m.get(key);
      if (!g) { g = { pos: [], uv: [], col: [], mat: key }; m.set(key, g); }
      return g;
    }

    light(x, y, z, nx, ny, nz, emit) {
      if (emit) { const e = -(1.15 * emit + 0.2); return [e, e, e]; }
      const key = ((x * 20) | 0) + ',' + ((y * 20) | 0) + ',' + ((z * 20) | 0) + ',' + ((nx * 4) | 0) + ((ny * 4) | 0) + ((nz * 4) | 0);
      const c = this.cacheL.get(key);
      if (c) return c;
      const a = this.amb, g = this.gnd, s = this.sun, sc = this.sunCol;
      const up = 0.5 + 0.5 * ny;
      let r = a[0] * up + g[0] * (1 - up) * 0.6, gg = a[1] * up + g[1] * (1 - up) * 0.6, b = a[2] * up + g[2] * (1 - up) * 0.6;
      const nd = nx * s.x + ny * s.y + nz * s.z;
      if (nd > 0) {
        let lit = 1;
        if (this.shadows) {
          const h = this.world.raycast(x + nx * 0.06 + s.x * 0.02, y + ny * 0.06 + s.y * 0.02, z + nz * 0.06 + s.z * 0.02, s.x, s.y, s.z, 90);
          if (h) lit = 0.06;
        }
        r += sc[0] * nd * lit; gg += sc[1] * nd * lit; b += sc[2] * nd * lit;
      }
      for (const L of this.lights) {
        const dx = L.x - x, dy = L.y - y, dz = L.z - z, d = Math.hypot(dx, dy, dz);
        if (d > L.r) continue;
        const f = (1 - d / L.r) ** 2 * L.k;
        const ln = d > 0.01 ? Math.max(0.15, (dx * nx + dy * ny + dz * nz) / d) : 1;
        r += L.c[0] * f * ln * 1.4; gg += L.c[1] * f * ln * 1.4; b += L.c[2] * f * ln * 1.4;
      }
      if (Math.abs(ny) < 0.5 && y < 3) {
        const k = 0.72 + 0.28 * Math.min(1, Math.max(0, y) / 1.6);
        r *= k; gg *= k; b *= k;
      }
      const res = [r, gg, b];
      this.cacheL.set(key, res);
      return res;
    }

    face(mat, pts, n, tint, o = {}) {
      const p = orient(pts, n);
      const g = this.group(o.key || mat, o.alpha);
      const sc = O.Tex.scale(mat) / (o.uv || 1);
      const tc = O.rgb(tint === undefined ? 0xffffff : tint);
      const cell = o.cell || 2.6;
      const e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
      const e3 = [p[3][0] - p[0][0], p[3][1] - p[0][1], p[3][2] - p[0][2]];
      const l1 = Math.hypot(...e1), l3 = Math.hypot(...e3);
      const nu = o.nosub ? 1 : Math.max(1, Math.min(24, Math.ceil(l1 / cell))), nv = o.nosub ? 1 : Math.max(1, Math.min(24, Math.ceil(l3 / cell)));
      const P = (u, v) => {
        const a = [p[0][0] + (p[1][0] - p[0][0]) * u, p[0][1] + (p[1][1] - p[0][1]) * u, p[0][2] + (p[1][2] - p[0][2]) * u];
        const b = [p[3][0] + (p[2][0] - p[3][0]) * u, p[3][1] + (p[2][1] - p[3][1]) * u, p[3][2] + (p[2][2] - p[3][2]) * u];
        return [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v, a[2] + (b[2] - a[2]) * v];
      };
      const UV = (q, u, v) => {
        if (o.local) return [u * l1 / sc, v * l3 / sc];
        if (o.fit) return [u, v];
        const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
        if (ay >= ax && ay >= az) return [q[0] / sc, q[2] / sc];
        if (ax >= az) return [q[2] / sc, -q[1] / sc];
        return [q[0] / sc, -q[1] / sc];
      };
      const emit = o.emit || 0;
      const vtx = (u, v) => {
        const q = P(u, v);
        const L = this.light(q[0], q[1], q[2], n[0], n[1], n[2], emit);
        const uv = UV(q, o.fit ? (o.flipU ? 1 - u : u) : u, o.fit ? 1 - v : v);
        g.pos.push(q[0], q[1], q[2]); g.uv.push(uv[0], uv[1]); g.col.push(L[0] * tc[0], L[1] * tc[1], L[2] * tc[2]);
      };
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        vtx(u0, v0); vtx(u1, v0); vtx(u1, v1);
        vtx(u0, v0); vtx(u1, v1); vtx(u0, v1);
      }
    }

    tri(mat, a, b, c, n, tint, o = {}) {
      const g = this.group(o.key || mat, o.alpha);
      const sc = O.Tex.scale(mat) / (o.uv || 1);
      const tc = O.rgb(tint === undefined ? 0xffffff : tint);
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const cr = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
      if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) { const t = b; b = c; c = t; }
      for (const q of [a, b, c]) {
        const L = this.light(q[0], q[1], q[2], n[0], n[1], n[2], o.emit || 0);
        const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
        let uv;
        if (ay >= ax && ay >= az) uv = [q[0] / sc, q[2] / sc]; else if (ax >= az) uv = [q[2] / sc, -q[1] / sc]; else uv = [q[0] / sc, -q[1] / sc];
        g.pos.push(q[0], q[1], q[2]); g.uv.push(uv[0], uv[1]); g.col.push(L[0] * tc[0], L[1] * tc[1], L[2] * tc[2]);
      }
    }

    box(b) {
      const { x0, y0, z0, x1, y1, z1 } = b;
      const sk = b.skip || {};
      const tint = b.tint, topTint = b.topTint === undefined ? tint : b.topTint;
      if (!sk.top) this.face(b.top, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], topTint, { uv: b.uv, emit: b.emit });
      if (!sk.bottom && y0 > 0.05) this.face(b.bottom, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], b.bottomTint === undefined ? tint : b.bottomTint, { uv: b.uv, emit: b.emit });
      const band = b.band && b.band.h < y1 - y0 ? b.band : null;
      const sides = [
        [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], 'n'],
        [[[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], 's'],
        [[[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0], 'e'],
        [[[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], 'w']
      ];
      for (const [pts, n, key] of sides) {
        if (sk[key] || sk.sides) continue;
        if (band) {
          const yb = y0 + band.h;
          const lo = pts.map(p => [p[0], p[1] === y1 ? yb : p[1], p[2]]);
          const hi = pts.map(p => [p[0], p[1] === y0 ? yb : p[1], p[2]]);
          this.face(band.mat, lo, n, band.tint, { uv: b.uv });
          this.face(b.mat, hi, n, tint, { uv: b.uv, emit: b.emit });
        } else this.face(b.mat, pts, n, tint, { uv: b.uv, emit: b.emit });
      }
    }

    ramp(r) {
      const { x0, z0, x1, z1, base, lo, hi, dir } = r;
      let c;
      if (dir === 1) c = [[x0, lo, z0], [x1, hi, z0], [x1, hi, z1], [x0, lo, z1]];
      else if (dir === 2) c = [[x0, hi, z0], [x1, lo, z0], [x1, lo, z1], [x0, hi, z1]];
      else if (dir === 3) c = [[x0, lo, z0], [x1, lo, z0], [x1, hi, z1], [x0, hi, z1]];
      else c = [[x0, hi, z0], [x1, hi, z0], [x1, lo, z1], [x0, lo, z1]];
      const ux = c[1][0] - c[0][0], uy = c[1][1] - c[0][1], uz = c[1][2] - c[0][2], vx = c[3][0] - c[0][0], vy = c[3][1] - c[0][1], vz = c[3][2] - c[0][2];
      let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
      const l = Math.hypot(...n); n = n.map(v => v / l); if (n[1] < 0) n = n.map(v => -v);
      this.face(r.mat, c, n, r.tint, { uv: r.uv });
      const side = r.side || r.mat, st = r.sideTint === undefined ? r.tint : r.sideTint;
      const edges = [
        [c[0], c[1], [0, 0, -1], z0], [c[3], c[2], [0, 0, 1], z1], [c[1], c[2], [1, 0, 0], x1], [c[0], c[3], [-1, 0, 0], x0]
      ];
      for (const [a, b2, nn] of edges) {
        const top = Math.max(a[1], b2[1]);
        if (top - base < 0.02) continue;
        const pa = [a[0], base, a[2]], pb = [b2[0], base, b2[2]];
        if (Math.abs(a[1] - b2[1]) < 1e-4) this.face(side, [pa, pb, [b2[0], b2[1], b2[2]], [a[0], a[1], a[2]]], nn, st, { uv: r.uv });
        else {
          this.face(side, [pa, pb, [b2[0], Math.min(a[1], b2[1]), b2[2]], [a[0], Math.min(a[1], b2[1]), a[2]]], nn, st, { uv: r.uv });
          const hiP = a[1] > b2[1] ? a : b2, loP = a[1] > b2[1] ? b2 : a;
          this.tri(side, [loP[0], loP[1], loP[2]], [hiP[0], hiP[1], hiP[2]], [hiP[0], loP[1], hiP[2]], nn, st, { uv: r.uv });
        }
      }
    }

    steps(s) {
      const { x0, z0, x1, z1, lo, hi, dir, n } = s;
      for (let i = 0; i < n; i++) {
        const y = lo + (hi - lo) * (i + 1) / n;
        let bx0 = x0, bx1 = x1, bz0 = z0, bz1 = z1;
        const f0 = i / n;
        if (dir === 1) bx0 = x0 + (x1 - x0) * f0;
        else if (dir === 2) bx1 = x1 - (x1 - x0) * f0;
        else if (dir === 3) bz0 = z0 + (z1 - z0) * f0;
        else bz1 = z1 - (z1 - z0) * f0;
        this.box({ x0: bx0, y0: s.base, z0: bz0, x1: bx1, y1: y, z1: bz1, mat: s.mat, top: s.mat, bottom: s.mat, tint: s.tint, uv: 1, skip: { bottom: true } });
      }
    }

    roof(r) {
      const o = r.over;
      const x0 = r.x0 - o, x1 = r.x1 + o, z0 = r.z0 - o, z1 = r.z1 + o, y = r.y, h = r.h;
      const mat = r.mat, t = r.tint;
      const curl = r.curl || 0;
      const soffit = (pts) => this.face('woodDark', pts, [0, -1, 0], 0x6a5a50, { uv: 1 });
      if (r.style === 'flat') {
        this.box({ x0, y0: y, z0, x1, y1: y + Math.max(0.3, h * 0.2), z1, mat, top: mat, bottom: mat, tint: t, uv: 1 });
        return;
      }
      if (r.style === 'gable-x' || r.style === 'gable-z') {
        const alongX = r.style === 'gable-x';
        if (alongX) {
          const zm = (z0 + z1) / 2;
          this.face(mat, [[x0, y - curl * 0.3, z0], [x1, y - curl * 0.3, z0], [x1, y + h, zm], [x0, y + h, zm]], this.nrm([x0, y, z0], [x1, y, z0], [x1, y + h, zm]), t, { local: true });
          this.face(mat, [[x1, y - curl * 0.3, z1], [x0, y - curl * 0.3, z1], [x0, y + h, zm], [x1, y + h, zm]], this.nrm([x1, y, z1], [x0, y, z1], [x0, y + h, zm]), t, { local: true });
          this.tri(r.trim || 'plaster', [r.x0, y, z0 + o], [r.x0, y, z1 - o], [r.x0, y + h, zm], [-1, 0, 0], r.trimTint === undefined ? 0xe8e0d0 : r.trimTint);
          this.tri(r.trim || 'plaster', [r.x1, y, z0 + o], [r.x1, y, z1 - o], [r.x1, y + h, zm], [1, 0, 0], r.trimTint === undefined ? 0xe8e0d0 : r.trimTint);
        } else {
          const xm = (x0 + x1) / 2;
          this.face(mat, [[x0, y - curl * 0.3, z1], [x0, y - curl * 0.3, z0], [xm, y + h, z0], [xm, y + h, z1]], this.nrm([x0, y, z1], [x0, y, z0], [xm, y + h, z0]), t, { local: true });
          this.face(mat, [[x1, y - curl * 0.3, z0], [x1, y - curl * 0.3, z1], [xm, y + h, z1], [xm, y + h, z0]], this.nrm([x1, y, z0], [x1, y, z1], [xm, y + h, z1]), t, { local: true });
          this.tri(r.trim || 'plaster', [x0 + o, y, r.z0], [x1 - o, y, r.z0], [xm, y + h, r.z0], [0, 0, -1], r.trimTint === undefined ? 0xe8e0d0 : r.trimTint);
          this.tri(r.trim || 'plaster', [x0 + o, y, r.z1], [x1 - o, y, r.z1], [xm, y + h, r.z1], [0, 0, 1], r.trimTint === undefined ? 0xe8e0d0 : r.trimTint);
        }
        soffit([[x0, y - 0.05, z0], [x1, y - 0.05, z0], [x1, y - 0.05, z1], [x0, y - 0.05, z1]]);
        return;
      }
      if (r.style && r.style.startsWith('shed')) {
        const d = r.style.slice(5);
        let c;
        if (d === 'e') c = [[x0, y + h, z0], [x1, y, z0], [x1, y, z1], [x0, y + h, z1]];
        else if (d === 'w') c = [[x0, y, z0], [x1, y + h, z0], [x1, y + h, z1], [x0, y, z1]];
        else if (d === 'n') c = [[x0, y + h, z0], [x1, y + h, z0], [x1, y, z1], [x0, y, z1]];
        else c = [[x0, y, z0], [x1, y, z0], [x1, y + h, z1], [x0, y + h, z1]];
        this.face(mat, c, this.upN(c), t, { local: true });
        soffit(c.map(p => [p[0], p[1] - 0.08, p[2]]));
        return;
      }
      if (r.style === 'dome' || r.style === 'onion') {
        const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, rad = Math.min(r.x1 - r.x0, r.z1 - r.z0) / 2;
        const seg = 12, rings = 6;
        const prof = i => {
          const f = i / rings;
          if (r.style === 'dome') return [Math.cos(f * Math.PI / 2) * rad, y + Math.sin(f * Math.PI / 2) * h];
          const bulge = f < 0.5 ? 1 + Math.sin(f * Math.PI * 2) * 0.28 : Math.max(0.02, (1 - f) * 2.2);
          return [rad * Math.min(1.28, bulge) * (f < 0.5 ? 1 : 1), y + f * h];
        };
        for (let i = 0; i < rings; i++) {
          const [ra, ya] = prof(i), [rb, yb] = prof(i + 1);
          for (let j = 0; j < seg; j++) {
            const a0 = j / seg * Math.PI * 2, a1 = (j + 1) / seg * Math.PI * 2;
            const p = [[cx + Math.cos(a0) * ra, ya, cz + Math.sin(a0) * ra], [cx + Math.cos(a1) * ra, ya, cz + Math.sin(a1) * ra], [cx + Math.cos(a1) * rb, yb, cz + Math.sin(a1) * rb], [cx + Math.cos(a0) * rb, yb, cz + Math.sin(a0) * rb]];
            const am = (a0 + a1) / 2;
            const n = O.norm3({ x: Math.cos(am), y: 0.5 + i / rings, z: Math.sin(am) });
            this.face(mat, p, [n.x, n.y, n.z], t, { local: true, nosub: true });
          }
        }
        return;
      }
      const w = x1 - x0, d = z1 - z0;
      const ridgeAlongX = w >= d;
      const inset = Math.min(w, d) / 2;
      let r0, r1;
      if (ridgeAlongX) { r0 = [x0 + inset, y + h, (z0 + z1) / 2]; r1 = [x1 - inset, y + h, (z0 + z1) / 2]; }
      else { r0 = [(x0 + x1) / 2, y + h, z0 + inset]; r1 = [(x0 + x1) / 2, y + h, z1 - inset]; }
      const cy = curl;
      const A = [x0, y + cy, z0], Bq = [x1, y + cy, z0], C = [x1, y + cy, z1], D = [x0, y + cy, z1];
      const midZ0 = [(x0 + x1) / 2, y, z0], midZ1 = [(x0 + x1) / 2, y, z1], midX0 = [x0, y, (z0 + z1) / 2], midX1 = [x1, y, (z0 + z1) / 2];
      if (ridgeAlongX) {
        this.quadSplit(mat, [A, midZ0, Bq], r0, r1, t, [0, 1, -1], true);
        this.quadSplit(mat, [C, midZ1, D], r1, r0, t, [0, 1, 1], true);
        this.hipTri(mat, [D, midX0, A], r0, t, [-1, 1, 0]);
        this.hipTri(mat, [Bq, midX1, C], r1, t, [1, 1, 0]);
      } else {
        this.quadSplit(mat, [D, midX0, A], r1, r0, t, [-1, 1, 0], false);
        this.quadSplit(mat, [Bq, midX1, C], r0, r1, t, [1, 1, 0], false);
        this.hipTri(mat, [A, midZ0, Bq], r0, t, [0, 1, -1]);
        this.hipTri(mat, [C, midZ1, D], r1, t, [0, 1, 1]);
      }
      soffit([[x0, y - 0.05, z0], [x1, y - 0.05, z0], [x1, y - 0.05, z1], [x0, y - 0.05, z1]]);
      if (r.style === 'pagoda') {
        const sx = (r.x1 - r.x0) * 0.3, sz = (r.z1 - r.z0) * 0.3;
        this.box({ x0: r.x0 + sx, y0: y + h * 0.55, z0: r.z0 + sz, x1: r.x1 - sx, y1: y + h * 0.95, z1: r.z1 - sz, mat: 'plaster', top: 'plaster', bottom: 'plaster', tint: r.trimTint === undefined ? 0xe8dcc4 : r.trimTint, uv: 1 });
        this.roof({ x0: r.x0 + sx * 0.8, z0: r.z0 + sz * 0.8, x1: r.x1 - sx * 0.8, z1: r.z1 - sz * 0.8, y: y + h * 0.95, h: h * 0.6, style: 'hip', mat, tint: t, over: o * 0.8, curl });
      }
    }

    nrm(a, b, c) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
      const l = Math.hypot(...n) || 1; n = n.map(v => v / l);
      if (n[1] < 0) n = n.map(v => -v);
      return n;
    }
    upN(c) { return this.nrm(c[0], c[1], c[2]); }

    quadSplit(mat, eave, ra, rb, t) {
      const [e0, , e2] = eave;
      const pts = [[e0[0], e0[1], e0[2]], [e2[0], e2[1], e2[2]], [rb[0], rb[1], rb[2]], [ra[0], ra[1], ra[2]]];
      const n = this.nrm(pts[0], pts[1], pts[2]);
      this.face(mat, pts, n, t, { local: true });
    }

    hipTri(mat, eave, apex, t) {
      const [e0, , e2] = eave;
      const n = this.nrm(e0, e2, apex);
      this.tri(mat, e0, e2, apex, n, t);
    }

    decal(d) {
      const w = d.w / 2, h = d.h / 2, off = d.off;
      let pts, n;
      if (d.face === 'n') { pts = [[d.x - w, d.y - h, d.z + off], [d.x + w, d.y - h, d.z + off], [d.x + w, d.y + h, d.z + off], [d.x - w, d.y + h, d.z + off]]; n = [0, 0, 1]; }
      else if (d.face === 's') { pts = [[d.x + w, d.y - h, d.z - off], [d.x - w, d.y - h, d.z - off], [d.x - w, d.y + h, d.z - off], [d.x + w, d.y + h, d.z - off]]; n = [0, 0, -1]; }
      else if (d.face === 'e') { pts = [[d.x + off, d.y - h, d.z + w], [d.x + off, d.y - h, d.z - w], [d.x + off, d.y + h, d.z - w], [d.x + off, d.y + h, d.z + w]]; n = [1, 0, 0]; }
      else if (d.face === 'w') { pts = [[d.x - off, d.y - h, d.z - w], [d.x - off, d.y - h, d.z + w], [d.x - off, d.y + h, d.z + w], [d.x - off, d.y + h, d.z - w]]; n = [-1, 0, 0]; }
      else { pts = [[d.x - w, d.y + off, d.z + h], [d.x + w, d.y + off, d.z + h], [d.x + w, d.y + off, d.z - h], [d.x - w, d.y + off, d.z - h]]; n = [0, 1, 0]; }
      let key = d.tex, alpha = !!O.Tex.ALPHA[d.tex];
      if (d.tex === 'sign') { key = 'sign#' + this.signs.length; this.signs.push({ key, text: d.text, bg: d.bg, fg: d.fg, font: d.font, w: d.w, h: d.h, glow: d.emit > 0 }); }
      else if (d.emit && (d.tex === 'window' || d.tex === 'shoji')) key = d.tex + 'Lit';
      const g = this.group('d:' + key, alpha);
      const tc = O.rgb(d.tint);
      const uvs = [[0, 1], [1, 1], [1, 0], [0, 0]];
      const idx = [0, 1, 2, 0, 2, 3];
      for (const i of idx) {
        const q = pts[i];
        const L = this.light(q[0], q[1], q[2], n[0], n[1], n[2], d.emit);
        g.pos.push(q[0], q[1], q[2]); g.uv.push(uvs[i][0], uvs[i][1]); g.col.push(L[0] * tc[0], L[1] * tc[1], L[2] * tc[2]);
      }
    }

    cyl(c) {
      const seg = c.seg;
      for (let i = 0; i < seg; i++) {
        const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, am = (a0 + a1) / 2;
        const p = [[c.x + Math.cos(a0) * c.r, c.y0, c.z + Math.sin(a0) * c.r], [c.x + Math.cos(a1) * c.r, c.y0, c.z + Math.sin(a1) * c.r], [c.x + Math.cos(a1) * c.r2, c.y1, c.z + Math.sin(a1) * c.r2], [c.x + Math.cos(a0) * c.r2, c.y1, c.z + Math.sin(a0) * c.r2]];
        this.face(c.mat, p, [Math.cos(am), 0, Math.sin(am)], c.tint, { local: true, cell: 3 });
        if (c.cap) this.tri(c.mat, [c.x, c.y1, c.z], p[3], p[2], [0, 1, 0], c.tint);
      }
    }

    quadRec(q) {
      const p = q.p;
      const ux = p[1][0] - p[0][0], uy = p[1][1] - p[0][1], uz = p[1][2] - p[0][2], vx = p[2][0] - p[0][0], vy = p[2][1] - p[0][1], vz = p[2][2] - p[0][2];
      let nn = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
      const l = Math.hypot(...nn) || 1; nn = nn.map(v => v / l);
      this.face(q.mat, p, nn, q.tint, { local: true, emit: q.emit });
      if (q.two) this.face(q.mat, [p[3], p[2], p[1], p[0]], nn.map(v => -v), q.tint, { local: true, emit: q.emit });
    }

    build() {
      const v = this.map.vis;
      for (const b of v.boxes) this.box(b);
      for (const r of v.ramps) this.ramp(r);
      for (const s of v.steps) this.steps(s);
      for (const r of v.roofs) this.roof(r);
      for (const d of v.decals) this.decal(d);
      for (const c of v.cyls) this.cyl(c);
      for (const q of v.quads) this.quadRec(q);
      const out = [];
      const pack = (m, alpha) => {
        for (const [key, g] of m) {
          if (!g.pos.length) continue;
          out.push({ key, alpha, pos: new Float32Array(g.pos), uv: new Float32Array(g.uv), col: new Float32Array(g.col), n: g.pos.length / 3 });
        }
      };
      pack(this.groups, false);
      pack(this.alpha, true);
      return { groups: out, signs: this.signs };
    }
  }
  O.WorldMesh = WorldMesh;
})(globalThis.Ow98 = globalThis.Ow98 || {});
