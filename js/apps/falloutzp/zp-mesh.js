(function (Z) {
  'use strict';

  const STRIDE = 32;

  class MeshBuilder {
    constructor() {
      this.pos = [];
      this.nrm = [];
      this.uv = [];
      this.col = [];
      this.mat = [];
      this.idx = [];
      this.n = 0;
      this.tint = [128, 128, 128, 255];
      this.matv = [0, 0, 0, 0];
    }
    setMat(m, seed = 0, dmg = 0, flags = 0) { this.matv = [m, seed, dmg, flags]; return this; }
    setTint(r, g, b, ao = 255) { this.tint = [r, g, b, ao]; return this; }
    v(x, y, z, nx, ny, nz, u, w) {
      this.pos.push(x, y, z);
      this.nrm.push(nx, ny, nz);
      this.uv.push(u, w);
      this.col.push(this.tint[0], this.tint[1], this.tint[2], this.tint[3]);
      this.mat.push(this.matv[0], this.matv[1], this.matv[2], this.matv[3]);
      return this.n++;
    }
    tri(a, b, c) { this.idx.push(a, b, c); }
    quad(p, n, uv) {
      const a = this.v(p[0][0], p[0][1], p[0][2], n[0], n[1], n[2], uv[0][0], uv[0][1]);
      const b = this.v(p[1][0], p[1][1], p[1][2], n[0], n[1], n[2], uv[1][0], uv[1][1]);
      const c = this.v(p[2][0], p[2][1], p[2][2], n[0], n[1], n[2], uv[2][0], uv[2][1]);
      const d = this.v(p[3][0], p[3][1], p[3][2], n[0], n[1], n[2], uv[3][0], uv[3][1]);
      this.idx.push(a, b, c, a, c, d);
    }
    wall(ax, az, bx, bz, y0, y1, u0, u1, v0, v1, twoSided) {
      const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1;
      const nx = dz / L, nz = -dx / L;
      this.quad([[ax, y0, az], [ax, y1, az], [bx, y1, bz], [bx, y0, bz]], [nx, 0, nz], [[u0, v0], [u0, v1], [u1, v1], [u1, v0]]);
      if (twoSided) this.quad([[bx, y0, bz], [bx, y1, bz], [ax, y1, az], [ax, y0, az]], [-nx, 0, -nz], [[u1, v0], [u1, v1], [u0, v1], [u0, v0]]);
    }
    wallSlope(ax, az, bx, bz, ya0, ya1, yb0, yb1, u0, u1, v0, va1, vb1) {
      const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1;
      const nx = dz / L, nz = -dx / L;
      this.quad([[ax, ya0, az], [ax, ya1, az], [bx, yb1, bz], [bx, yb0, bz]], [nx, 0, nz], [[u0, v0], [u0, va1], [u1, vb1], [u1, v0]]);
    }
    box(cx, cy, cz, sx, sy, sz, yaw = 0, uvs = 1, sides = 63) {
      const c = Math.cos(yaw), s = Math.sin(yaw);
      const P = (x, y, z) => [cx + x * c - z * s, cy + y, cz + x * s + z * c];
      const hx = sx / 2, hz = sz / 2;
      const N = (x, z) => [x * c - z * s, 0, x * s + z * c];
      const us = typeof uvs === 'number' ? uvs : 1;
      const q = (a, b, c, d, n, w, h) => this.quad([d, c, b, a], n, [[w, 0], [w, h], [0, h], [0, 0]]);
      if (sides & 1) q(P(-hx, 0, hz), P(-hx, sy, hz), P(hx, sy, hz), P(hx, 0, hz), N(0, 1), sx * us, sy * us);
      if (sides & 2) q(P(hx, 0, -hz), P(hx, sy, -hz), P(-hx, sy, -hz), P(-hx, 0, -hz), N(0, -1), sx * us, sy * us);
      if (sides & 4) q(P(hx, 0, hz), P(hx, sy, hz), P(hx, sy, -hz), P(hx, 0, -hz), N(1, 0), sz * us, sy * us);
      if (sides & 8) q(P(-hx, 0, -hz), P(-hx, sy, -hz), P(-hx, sy, hz), P(-hx, 0, hz), N(-1, 0), sz * us, sy * us);
      if (sides & 16) q(P(hx, sy, -hz), P(hx, sy, hz), P(-hx, sy, hz), P(-hx, sy, -hz), [0, 1, 0], sx * us, sz * us);
      if (sides & 32) q(P(-hx, 0, -hz), P(-hx, 0, hz), P(hx, 0, hz), P(hx, 0, -hz), [0, -1, 0], sx * us, sz * us);
    }
    cyl(x, y, z, r0, r1, h, sides = 8, uvs = 1, caps = true) {
      const base = this.n;
      for (let i = 0; i <= sides; i++) {
        const a = i / sides * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const slope = (r0 - r1) / (h || 1), L = Math.hypot(1, slope);
        this.v(x + ca * r0, y, z + sa * r0, ca / L, slope / L, sa / L, i / sides * r0 * Math.PI * 2 * uvs, 0);
        this.v(x + ca * r1, y + h, z + sa * r1, ca / L, slope / L, sa / L, i / sides * r0 * Math.PI * 2 * uvs, h * uvs);
      }
      for (let i = 0; i < sides; i++) {
        const a = base + i * 2, b = a + 1, c = a + 2, d = a + 3;
        this.idx.push(a, b, d, a, d, c);
      }
      if (caps && r1 > 0.001) {
        const ct = this.v(x, y + h, z, 0, 1, 0, 0.5, 0.5);
        const ring = [];
        for (let i = 0; i <= sides; i++) { const a = i / sides * Math.PI * 2; ring.push(this.v(x + Math.cos(a) * r1, y + h, z + Math.sin(a) * r1, 0, 1, 0, 0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5)); }
        for (let i = 0; i < sides; i++) this.idx.push(ct, ring[i + 1], ring[i]);
      }
    }
    flatPoly(poly, y, uvScale = 1, up = true) {
      const tris = Z.earcut(poly);
      const base = this.n;
      for (const p of poly) this.v(p[0], y, p[1], 0, up ? 1 : -1, 0, p[0] * uvScale, p[1] * uvScale);
      for (let i = 0; i < tris.length; i += 3) {
        if (up) this.idx.push(base + tris[i], base + tris[i + 2], base + tris[i + 1]);
        else this.idx.push(base + tris[i], base + tris[i + 1], base + tris[i + 2]);
      }
    }
    append(other) {
      const off = this.n;
      for (let i = 0; i < other.pos.length; i++) this.pos.push(other.pos[i]);
      for (let i = 0; i < other.nrm.length; i++) this.nrm.push(other.nrm[i]);
      for (let i = 0; i < other.uv.length; i++) this.uv.push(other.uv[i]);
      for (let i = 0; i < other.col.length; i++) this.col.push(other.col[i]);
      for (let i = 0; i < other.mat.length; i++) this.mat.push(other.mat[i]);
      for (let i = 0; i < other.idx.length; i++) this.idx.push(other.idx[i] + off);
      this.n += other.n;
    }
    transformFrom(start, m, end = this.n) {
      for (let i = start; i < end; i++) {
        const p = Z.M4.transform(m, this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]);
        const d = Z.M4.dir(m, this.nrm[i * 3], this.nrm[i * 3 + 1], this.nrm[i * 3 + 2]);
        const L = Math.hypot(d[0], d[1], d[2]) || 1;
        this.pos[i * 3] = p[0]; this.pos[i * 3 + 1] = p[1]; this.pos[i * 3 + 2] = p[2];
        this.nrm[i * 3] = d[0] / L; this.nrm[i * 3 + 1] = d[1] / L; this.nrm[i * 3 + 2] = d[2] / L;
      }
    }
    pack() {
      const n = this.n, buf = new ArrayBuffer(n * STRIDE), f = new Float32Array(buf), b = new Int8Array(buf), u8 = new Uint8Array(buf);
      let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
      for (let i = 0; i < n; i++) {
        const o = i * 8, ob = i * STRIDE;
        const x = this.pos[i * 3], y = this.pos[i * 3 + 1], z = this.pos[i * 3 + 2];
        f[o] = x; f[o + 1] = y; f[o + 2] = z;
        if (x < x0) x0 = x; if (y < y0) y0 = y; if (z < z0) z0 = z; if (x > x1) x1 = x; if (y > y1) y1 = y; if (z > z1) z1 = z;
        b[ob + 12] = Math.round(Z.clamp(this.nrm[i * 3], -1, 1) * 127);
        b[ob + 13] = Math.round(Z.clamp(this.nrm[i * 3 + 1], -1, 1) * 127);
        b[ob + 14] = Math.round(Z.clamp(this.nrm[i * 3 + 2], -1, 1) * 127);
        b[ob + 15] = 0;
        f[o + 4] = this.uv[i * 2]; f[o + 5] = this.uv[i * 2 + 1];
        u8[ob + 24] = this.col[i * 4]; u8[ob + 25] = this.col[i * 4 + 1]; u8[ob + 26] = this.col[i * 4 + 2]; u8[ob + 27] = this.col[i * 4 + 3];
        u8[ob + 28] = this.mat[i * 4]; u8[ob + 29] = this.mat[i * 4 + 1]; u8[ob + 30] = this.mat[i * 4 + 2]; u8[ob + 31] = this.mat[i * 4 + 3];
      }
      return { buf, idx: n > 65535 ? new Uint32Array(this.idx) : new Uint16Array(this.idx), count: this.idx.length, verts: n, box: [x0, y0, z0, x1, y1, z1] };
    }
  }
  MeshBuilder.STRIDE = STRIDE;
  Z.MeshBuilder = MeshBuilder;

  Z.earcut = poly => {
    const n = poly.length;
    if (n < 3) return [];
    const idx = [];
    for (let i = 0; i < n; i++) idx.push(i);
    if (Z.polyArea(poly) < 0) idx.reverse();
    const out = [];
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const inTri = (p, a, b, c) => cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;
    let guard = 0;
    while (idx.length > 3 && guard++ < 5000) {
      let found = false;
      for (let i = 0; i < idx.length; i++) {
        const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length];
        const a = poly[ia], b = poly[ib], c = poly[ic];
        if (cross(a, b, c) <= 1e-9) continue;
        let ok = true;
        for (const j of idx) { if (j === ia || j === ib || j === ic) continue; if (inTri(poly[j], a, b, c)) { ok = false; break; } }
        if (!ok) continue;
        out.push(ia, ib, ic);
        idx.splice(i, 1);
        found = true;
        break;
      }
      if (!found) break;
    }
    if (idx.length === 3) out.push(idx[0], idx[1], idx[2]);
    return out;
  };

  Z.obb = poly => {
    const hull = Z.convexHull(poly);
    let best = null;
    for (let i = 0; i < hull.length; i++) {
      const p = hull[i], q = hull[(i + 1) % hull.length];
      const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
      if (L < 1e-6) continue;
      const ux = dx / L, uz = dz / L;
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (const h of hull) { const a = h[0] * ux + h[1] * uz, b = -h[0] * uz + h[1] * ux; if (a < a0) a0 = a; if (a > a1) a1 = a; if (b < b0) b0 = b; if (b > b1) b1 = b; }
      const area = (a1 - a0) * (b1 - b0);
      if (!best || area < best.area) best = { area, ux, uz, a0, a1, b0, b1 };
    }
    if (!best) return null;
    const { ux, uz, a0, a1, b0, b1 } = best;
    const ca = (a0 + a1) / 2, cb = (b0 + b1) / 2;
    const cx = ca * ux - cb * uz, cz = ca * uz + cb * ux;
    let len = a1 - a0, wid = b1 - b0, ax = ux, az = uz;
    if (wid > len) { const t = len; len = wid; wid = t; ax = -uz; az = ux; }
    return { cx, cz, len, wid, ax, az, area: best.area, yaw: Math.atan2(ax, -az) };
  };

  Z.convexHull = pts => {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], hi = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  };

  Z.offsetPoly = (poly, d) => {
    const n = poly.length, out = [];
    for (let i = 0; i < n; i++) {
      const a = poly[(i + n - 1) % n], b = poly[i], c = poly[(i + 1) % n];
      let n1x = b[1] - a[1], n1z = -(b[0] - a[0]), L1 = Math.hypot(n1x, n1z) || 1;
      let n2x = c[1] - b[1], n2z = -(c[0] - b[0]), L2 = Math.hypot(n2x, n2z) || 1;
      n1x /= L1; n1z /= L1; n2x /= L2; n2z /= L2;
      let mx = n1x + n2x, mz = n1z + n2z;
      const ml = Math.hypot(mx, mz) || 1;
      mx /= ml; mz /= ml;
      const cosh = Math.max(0.35, mx * n1x + mz * n1z);
      out.push([b[0] + mx * d / cosh, b[1] + mz * d / cosh]);
    }
    return out;
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
