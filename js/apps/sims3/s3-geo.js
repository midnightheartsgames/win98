(function (S) {
  'use strict';
  const STRIDE = 12;
  const colCache = new Map();
  function col(c) {
    if (Array.isArray(c)) return c;
    if (!c) return [1, 1, 1];
    let v = colCache.get(c);
    if (!v) { v = S.hexToRgb(c); colCache.set(c, v); }
    return v;
  }
  function mul(c, k) { const a = col(c); return [a[0] * k, a[1] * k, a[2] * k]; }
  function mix(a, b, t) { a = col(a); b = col(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  class Geo {
    constructor(atlas) {
      this.atlas = atlas;
      this.data = [];
      this.tf = null;
      this.minZ = 1e9; this.maxZ = -1e9;
    }
    get count() { return this.data.length / STRIDE; }
    setTransform(cx, cy, cz, sx, sy, fx, fy, scale) { this.tf = { cx, cy, cz: cz || 0, sx, sy, fx, fy, k: scale || 1 }; }
    clearTransform() { this.tf = null; }
    cell(name) { const a = this.atlas; return a ? a.get(name || 'white') : { u0: 0, v0: 0, u1: 0, v1: 0 }; }
    vert(x, y, z, nx, ny, nz, c, e, u, v) {
      const t = this.tf;
      if (t) {
        const k = t.k;
        const wx = t.cx + (x * t.sx + y * t.fx) * k, wy = t.cy + (x * t.sy + y * t.fy) * k;
        const wnx = nx * t.sx + ny * t.fx, wny = nx * t.sy + ny * t.fy;
        x = wx; y = wy; z = t.cz + z * k; nx = wnx; ny = wny;
      }
      if (z < this.minZ) this.minZ = z;
      if (z > this.maxZ) this.maxZ = z;
      this.data.push(x, y, z, nx, ny, nz, c[0], c[1], c[2], e || 0, u, v);
    }
    tri(p0, p1, p2, c, o) {
      o = o || {};
      const n = o.n || normal(p0, p1, p2);
      const C = col(c), e = o.e || 0;
      const uv = o.uv || [[0, 0], [0, 0], [0, 0]];
      const cl = this.cell(o.cell);
      const U = t => cl.u0 + (cl.u1 - cl.u0) * t[0], V = t => cl.v0 + (cl.v1 - cl.v0) * t[1];
      const ns = o.ns;
      this.vert(p0[0], p0[1], p0[2], ns ? ns[0][0] : n[0], ns ? ns[0][1] : n[1], ns ? ns[0][2] : n[2], C, e, U(uv[0]), V(uv[0]));
      this.vert(p1[0], p1[1], p1[2], ns ? ns[1][0] : n[0], ns ? ns[1][1] : n[1], ns ? ns[1][2] : n[2], C, e, U(uv[1]), V(uv[1]));
      this.vert(p2[0], p2[1], p2[2], ns ? ns[2][0] : n[0], ns ? ns[2][1] : n[1], ns ? ns[2][2] : n[2], C, e, U(uv[2]), V(uv[2]));
    }
    quad(p0, p1, p2, p3, c, o) {
      o = o || {};
      const uv = o.uv || [[0, 1], [1, 1], [1, 0], [0, 0]];
      const n = o.n || normal(p0, p1, p2);
      const oo = Object.assign({}, o, { n });
      this.tri(p0, p1, p2, c, Object.assign(oo, { uv: [uv[0], uv[1], uv[2]], ns: o.ns ? [o.ns[0], o.ns[1], o.ns[2]] : null }));
      this.tri(p0, p2, p3, c, Object.assign({}, oo, { uv: [uv[0], uv[2], uv[3]], ns: o.ns ? [o.ns[0], o.ns[2], o.ns[3]] : null }));
    }
    box(x0, y0, z0, x1, y1, z1, c, o) {
      o = o || {};
      const cs = o.side || c, ct = o.topc || c;
      const cellS = o.cell, cellT = o.top || o.cell;
      const e = o.e || 0;
      const uvS = o.uvs || [[0, 1], [1, 1], [1, 0], [0, 0]];
      const uvT = o.uvt || [[0, 1], [1, 1], [1, 0], [0, 0]];
      if (!o.noTop) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], ct, { cell: cellT, e, uv: [[0, 0], [1, 0], [1, 1], [0, 1]], n: [0, 0, 1] });
      if (o.bottom) this.quad([x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0], cs, { cell: cellS, e, n: [0, 0, -1] });
      const fc = o.front || cs;
      if (!o.noFront) this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], fc, { cell: o.frontCell || cellS, e: o.fe !== undefined ? o.fe : e, uv: o.uvf || uvS, n: [0, 1, 0] });
      if (!o.noBack) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y0, z1], [x1, y0, z1], cs, { cell: cellS, e, uv: uvS, n: [0, -1, 0] });
      if (!o.noRight) this.quad([x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [x1, y1, z1], cs, { cell: cellS, e, uv: uvS, n: [1, 0, 0] });
      if (!o.noLeft) this.quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], cs, { cell: cellS, e, uv: uvS, n: [-1, 0, 0] });
    }
    cyl(cx, cy, z0, z1, r0, r1, seg, c, o) {
      o = o || {};
      seg = seg || 8;
      const rx0 = r0, ry0 = o.ry0 !== undefined ? o.ry0 : r0, rx1 = r1, ry1 = o.ry1 !== undefined ? o.ry1 : r1;
      const e = o.e || 0, cell = o.cell;
      const a0 = o.a0 || 0, a1 = o.a1 !== undefined ? o.a1 : Math.PI * 2;
      const slope = (r0 - r1) / Math.max(0.001, z1 - z0);
      for (let i = 0; i < seg; i++) {
        const t0 = a0 + (a1 - a0) * i / seg, t1 = a0 + (a1 - a0) * (i + 1) / seg;
        const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
        const n0 = norm([c0, s0, slope]), n1 = norm([c1, s1, slope]);
        const p0 = [cx + c0 * rx0, cy + s0 * ry0, z0], p1 = [cx + c1 * rx0, cy + s1 * ry0, z0], p2 = [cx + c1 * rx1, cy + s1 * ry1, z1], p3 = [cx + c0 * rx1, cy + s0 * ry1, z1];
        this.quad(p0, p1, p2, p3, c, { cell, e, ns: o.flat ? null : [n0, n1, n1, n0], n: norm([(c0 + c1) / 2, (s0 + s1) / 2, slope]), uv: [[i / seg, 1], [(i + 1) / seg, 1], [(i + 1) / seg, 0], [i / seg, 0]] });
        if (!o.noTop && (r1 > 0.0001)) this.tri([cx, cy, z1], p3, p2, o.topc || c, { n: [0, 0, 1], cell: o.top || cell, e, uv: [[0.5, 0.5], [0.5 + c0 * 0.5, 0.5 + s0 * 0.5], [0.5 + c1 * 0.5, 0.5 + s1 * 0.5]] });
        if (o.bottom) this.tri([cx, cy, z0], p1, p0, c, { n: [0, 0, -1], cell, e });
      }
    }
    sphere(cx, cy, cz, rx, ry, rz, seg, rings, c, o) {
      o = o || {};
      seg = seg || 10; rings = rings || 6;
      const e = o.e || 0, cell = o.cell;
      const lat0 = o.lat0 !== undefined ? o.lat0 : 0, lat1 = o.lat1 !== undefined ? o.lat1 : Math.PI;
      for (let j = 0; j < rings; j++) {
        const la0 = lat0 + (lat1 - lat0) * j / rings, la1 = lat0 + (lat1 - lat0) * (j + 1) / rings;
        for (let i = 0; i < seg; i++) {
          const lo0 = i / seg * Math.PI * 2, lo1 = (i + 1) / seg * Math.PI * 2;
          const P = (la, lo) => [Math.sin(la) * Math.cos(lo), Math.sin(la) * Math.sin(lo), Math.cos(la)];
          const a = P(la0, lo0), b = P(la0, lo1), cc = P(la1, lo1), d = P(la1, lo0);
          const W = v => [cx + v[0] * rx, cy + v[1] * ry, cz + v[2] * rz];
          const N = v => norm([v[0] / rx, v[1] / ry, v[2] / rz]);
          const uv = [[i / seg, j / rings], [(i + 1) / seg, j / rings], [(i + 1) / seg, (j + 1) / rings], [i / seg, (j + 1) / rings]];
          this.quad(W(d), W(cc), W(b), W(a), c, { cell, e, ns: o.flat ? null : [N(d), N(cc), N(b), N(a)], uv: [uv[3], uv[2], uv[1], uv[0]] });
        }
      }
    }
    disk(cx, cy, z, rx, ry, seg, c, o) {
      o = o || {};
      for (let i = 0; i < seg; i++) {
        const t0 = i / seg * Math.PI * 2, t1 = (i + 1) / seg * Math.PI * 2;
        this.tri([cx, cy, z], [cx + Math.cos(t0) * rx, cy + Math.sin(t0) * ry, z], [cx + Math.cos(t1) * rx, cy + Math.sin(t1) * ry, z], c, { n: [0, 0, 1], cell: o.cell, e: o.e, uv: [[0.5, 0.5], [0.5 + Math.cos(t0) * 0.5, 0.5 + Math.sin(t0) * 0.5], [0.5 + Math.cos(t1) * 0.5, 0.5 + Math.sin(t1) * 0.5]] });
      }
    }
    panel(x0, x1, z0, z1, y, c, o) {
      o = o || {};
      this.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], c, { cell: o.cell, e: o.e, n: [0, o.back ? -1 : 1, 0], uv: o.uv || [[0, 1], [1, 1], [1, 0], [0, 0]] });
    }
    beam(p0, p1, r, c, o) {
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2];
      const L = Math.hypot(dx, dy, dz);
      if (L < 1e-5) return;
      const ax = [dx / L, dy / L, dz / L];
      let up = Math.abs(ax[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      const s = norm(cross(ax, up)), t = cross(s, ax);
      const pts = [];
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pts.push([s[0] * a * r + t[0] * b * r, s[1] * a * r + t[1] * b * r, s[2] * a * r + t[2] * b * r]);
      for (let i = 0; i < 4; i++) {
        const a = pts[i], b = pts[(i + 1) % 4];
        this.quad([p0[0] + a[0], p0[1] + a[1], p0[2] + a[2]], [p0[0] + b[0], p0[1] + b[1], p0[2] + b[2]], [p1[0] + b[0], p1[1] + b[1], p1[2] + b[2]], [p1[0] + a[0], p1[1] + a[1], p1[2] + a[2]], c, o);
      }
    }
    append(other) { for (let i = 0; i < other.data.length; i++) this.data.push(other.data[i]); this.minZ = Math.min(this.minZ, other.minZ); this.maxZ = Math.max(this.maxZ, other.maxZ); }
    toArray() { return new Float32Array(this.data); }
  }

  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function normal(p0, p1, p2) { return norm(cross([p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]])); }

  Object.assign(S, { Geo, GEO_STRIDE: STRIDE, col, mulCol: mul, mixCol: mix, cross, norm, normal });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
