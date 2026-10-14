(function (F) {
  'use strict';

  const STRIDE = 28;
  const MAXV = 65000;

  const colCache = new Map();
  function C(hex, a = 1) {
    const key = hex + a;
    let c = colCache.get(key);
    if (!c) {
      const h = hex.replace('#', '');
      c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), Math.round(a * 255)];
      colCache.set(key, c);
    }
    return c;
  }
  F.col = C;
  const shade = (c, k) => [F.clamp(Math.round(c[0] * k), 0, 255), F.clamp(Math.round(c[1] * k), 0, 255), F.clamp(Math.round(c[2] * k), 0, 255), c[3]];

  const MAT = { NONE: 0, PAINT: 1, PAINT2: 2, HEAD: 3, TAIL: 4, GLASS: 5, WATER: 6, CHROME: 7, LAMP: 8, WINDOWS: 9, DIAL: 10, TRIM: 11, LENS: 12, REVERSE: 13, INTERIOR: 14, AD: 15, TRI: 16, CRACK: 17 };
  F.MAT = MAT;

  class Batch {
    constructor(cap = 4096) {
      this.parts = [];
      this.alloc(cap);
      this.m = null;
      this.stack = [];
      this.uvw = [0.25, 0.25];
    }
    alloc(cap) {
      this.cap = cap;
      this.buf = new ArrayBuffer(cap * STRIDE);
      this.f = new Float32Array(this.buf);
      this.i8 = new Int8Array(this.buf);
      this.u8 = new Uint8Array(this.buf);
      this.n = 0;
      this.idx = new Uint16Array(cap * 2);
      this.ni = 0;
    }
    grow(minV, minI) {
      if (minV > this.cap) {
        const nc = Math.max(minV, this.cap * 2);
        const nb = new ArrayBuffer(nc * STRIDE);
        new Uint8Array(nb).set(this.u8.subarray(0, this.n * STRIDE));
        this.buf = nb; this.f = new Float32Array(nb); this.i8 = new Int8Array(nb); this.u8 = new Uint8Array(nb);
        this.cap = nc;
      }
      if (minI > this.idx.length) {
        const ni = new Uint16Array(Math.max(minI, this.idx.length * 2));
        ni.set(this.idx.subarray(0, this.ni));
        this.idx = ni;
      }
    }
    need(v, i) {
      if (this.n + v > MAXV) this.flush();
      if (this.n + v > this.cap || this.ni + i > this.idx.length) this.grow(this.n + v, this.ni + i);
    }
    flush() {
      if (!this.n) return;
      this.parts.push({ data: this.u8.slice(0, this.n * STRIDE), idx: this.idx.slice(0, this.ni), nv: this.n, ni: this.ni });
      this.alloc(Math.min(this.cap, 16384));
    }
    finish() {
      this.flush();
      return this.parts;
    }
    get empty() { return !this.parts.length && !this.n; }
    setM(x, y, z, yaw = 0, s = 1) {
      const c = Math.cos(-yaw), si = Math.sin(-yaw);
      this.m = [c * s, 0, -si * s, 0, s, 0, si * s, 0, c * s, x, y, z, c, si];
    }
    clearM() { this.m = null; }
    v(x, y, z, u, v, nx, ny, nz, col, mat = 0) {
      const m = this.m;
      if (m) {
        const X = m[0] * x + m[3] * y + m[6] * z + m[9];
        const Y = m[1] * x + m[4] * y + m[7] * z + m[10];
        const Z = m[2] * x + m[5] * y + m[8] * z + m[11];
        const NX = m[12] * nx + m[13] * nz, NZ = -m[13] * nx + m[12] * nz;
        x = X; y = Y; z = Z; nx = NX; nz = NZ;
      }
      const k = this.n++;
      const b = k * 7;
      const f = this.f;
      f[b] = x; f[b + 1] = y; f[b + 2] = z; f[b + 3] = u; f[b + 4] = v;
      const ib = (b + 5) * 4;
      this.i8[ib] = nx * 127; this.i8[ib + 1] = ny * 127; this.i8[ib + 2] = nz * 127; this.i8[ib + 3] = mat;
      const cb = (b + 6) * 4;
      const u8 = this.u8;
      u8[cb] = col[0]; u8[cb + 1] = col[1]; u8[cb + 2] = col[2]; u8[cb + 3] = col[3];
      return k;
    }
    tri(a, b, c) { const I = this.idx; I[this.ni++] = a; I[this.ni++] = b; I[this.ni++] = c; }
    quadIdx(a, b, c, d) { this.tri(a, b, c); this.tri(a, c, d); }
    quad(p0, p1, p2, p3, col, mat = 0, uv = null, nrm = null) {
      this.need(4, 6);
      let nx, ny, nz;
      if (nrm) { nx = nrm[0]; ny = nrm[1]; nz = nrm[2]; } else {
        const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
        const bx = p3[0] - p0[0], by = p3[1] - p0[1], bz = p3[2] - p0[2];
        nx = ay * bz - az * by; ny = az * bx - ax * bz; nz = ax * by - ay * bx;
        let l = Math.hypot(nx, ny, nz);
        if (l < 1e-9) {
          const cx = p2[0] - p0[0], cy = p2[1] - p0[1], cz = p2[2] - p0[2];
          nx = ay * cz - az * cy; ny = az * cx - ax * cz; nz = ax * cy - ay * cx;
          l = Math.hypot(nx, ny, nz) || 1;
        }
        nx /= l; ny /= l; nz /= l;
      }
      const u = uv || [this.uvw[0], this.uvw[1], this.uvw[0], this.uvw[1], this.uvw[0], this.uvw[1], this.uvw[0], this.uvw[1]];
      const a = this.v(p0[0], p0[1], p0[2], u[0], u[1], nx, ny, nz, col, mat);
      const b = this.v(p1[0], p1[1], p1[2], u[2], u[3], nx, ny, nz, col, mat);
      const c = this.v(p2[0], p2[1], p2[2], u[4], u[5], nx, ny, nz, col, mat);
      const d = this.v(p3[0], p3[1], p3[2], u[6], u[7], nx, ny, nz, col, mat);
      this.quadIdx(a, b, c, d);
    }
    triangle(p0, p1, p2, col, mat = 0, uv = null) {
      this.need(3, 3);
      const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
      const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      const u = uv || [this.uvw[0], this.uvw[1], this.uvw[0], this.uvw[1], this.uvw[0], this.uvw[1]];
      const a = this.v(p0[0], p0[1], p0[2], u[0], u[1], nx, ny, nz, col, mat);
      const b = this.v(p1[0], p1[1], p1[2], u[2], u[3], nx, ny, nz, col, mat);
      const c = this.v(p2[0], p2[1], p2[2], u[4], u[5], nx, ny, nz, col, mat);
      this.tri(a, b, c);
    }
    box(cx, cy, cz, hx, hy, hz, col, mat = 0, o = {}) {
      const x0 = cx - hx, x1 = cx + hx, y0 = cy - hy, y1 = cy + hy, z0 = cz - hz, z1 = cz + hz;
      const top = o.top || col, side = o.side || col;
      const s = o.shade === false ? 1 : 0.86;
      this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], top, mat, o.uvTop);
      this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], shade(side, s), mat, o.uvZ);
      this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], shade(side, s), mat, o.uvZ);
      this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], side, mat, o.uvX);
      this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], side, mat, o.uvX);
      if (o.bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], shade(col, 0.5), mat);
    }
    cyl(cx, y0, cz, r, h, seg, col, mat = 0, o = {}) {
      const r2 = o.r2 !== undefined ? o.r2 : r;
      const y1 = y0 + h;
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const cc = o.stripes ? o.stripes(i) : col;
        this.quad([cx + c0 * r, y0, cz + s0 * r], [cx + c0 * r2, y1, cz + s0 * r2], [cx + c1 * r2, y1, cz + s1 * r2], [cx + c1 * r, y0, cz + s1 * r], shade(cc, 0.8 + 0.2 * Math.abs(Math.cos(a0 * 0.5 + 0.6))), mat);
        if (o.top !== false && r2 > 0.001) this.triangle([cx, y1, cz], [cx + c1 * r2, y1, cz + s1 * r2], [cx + c0 * r2, y1, cz + s0 * r2], o.topCol || col, mat);
      }
    }
    cone(cx, y0, cz, r, h, seg, col, mat = 0) {
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
        this.triangle([cx + Math.cos(a0) * r, y0, cz + Math.sin(a0) * r], [cx, y0 + h, cz], [cx + Math.cos(a1) * r, y0, cz + Math.sin(a1) * r], shade(col, 0.8 + 0.2 * Math.abs(Math.cos(a0 * 0.5 + 0.6))), mat);
      }
    }
    disc(cx, y, cz, r, seg, col, mat = 0, uvFn = null) {
      this.need(seg + 1, seg * 3);
      const c = this.v(cx, y, cz, uvFn ? uvFn(cx, cz)[0] : this.uvw[0], uvFn ? uvFn(cx, cz)[1] : this.uvw[1], 0, 1, 0, col, mat);
      const first = this.n;
      for (let i = 0; i < seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
        const uv = uvFn ? uvFn(x, z) : this.uvw;
        this.v(x, y, z, uv[0], uv[1], 0, 1, 0, col, mat);
      }
      for (let i = 0; i < seg; i++) this.tri(c, first + ((i + 1) % seg), first + i);
    }
    beam(p0, p1, w, col, mat = 0) {
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2];
      const l = Math.hypot(dx, dy, dz) || 1;
      let ux = 0, uy = 1, uz = 0;
      if (Math.abs(dy / l) > 0.9) { ux = 1; uy = 0; }
      let sx = dy * uz - dz * uy, sy = dz * ux - dx * uz, sz = dx * uy - dy * ux;
      let sl = Math.hypot(sx, sy, sz) || 1;
      sx = sx / sl * w; sy = sy / sl * w; sz = sz / sl * w;
      let tx = (dy * sz - dz * sy) / l, ty = (dz * sx - dx * sz) / l, tz = (dx * sy - dy * sx) / l;
      const A = (p, a, b) => [p[0] + sx * a + tx * b, p[1] + sy * a + ty * b, p[2] + sz * a + tz * b];
      const q = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      for (let i = 0; i < 4; i++) {
        const a = q[i], b = q[(i + 1) % 4];
        this.quad(A(p0, a[0], a[1]), A(p0, b[0], b[1]), A(p1, b[0], b[1]), A(p1, a[0], a[1]), shade(col, 0.8 + 0.1 * i), mat);
      }
    }
  }
  F.Batch = Batch;
  F.STRIDE = STRIDE;

  const LM = {};
  LM.bandstand = (b) => {
    const wood = C('#b88a58'), dark = C('#6a4a2a');
    const seg = 10;
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * (i / seg), a1 = Math.PI * ((i + 1) / seg);
      for (let j = 0; j < 4; j++) {
        const t0 = j / 4, t1 = (j + 1) / 4;
        const r0 = 34 * (1 - t0 * 0.3), r1 = 34 * (1 - t1 * 0.3);
        const h0 = 4 + t0 * 22, h1 = 4 + t1 * 22;
        b.quad([Math.cos(a0) * r0, h0, -Math.sin(a0) * r0 * 0.6 + t0 * 18], [Math.cos(a1) * r0, h0, -Math.sin(a1) * r0 * 0.6 + t0 * 18], [Math.cos(a1) * r1, h1, -Math.sin(a1) * r1 * 0.6 + t1 * 18], [Math.cos(a0) * r1, h1, -Math.sin(a0) * r1 * 0.6 + t1 * 18], (i + j) % 2 ? wood : shade(wood, 1.12), 0);
      }
    }
    b.box(0, 1, 5, 34, 1, 16, dark, 0);
    for (let i = -3; i <= 3; i++) b.box(i * 9, 12, -18, 0.6, 12, 0.6, dark, 0);
    return 28;
  };
  LM.ferris = (b) => {
    const steel = C('#c8ccd4');
    for (const s of [-1, 1]) {
      b.beam([-10, 0, s * 3], [0, 28, s * 3], 0.5, steel, 0);
      b.beam([10, 0, s * 3], [0, 28, s * 3], 0.5, steel, 0);
    }
    return 55;
  };
  LM.spilve = (b) => {
    const wall = C('#dcd2b8'), orn = C('#c0b090');
    b.box(0, 6, 0, 55, 6, 13, wall, MAT.WINDOWS);
    b.box(0, 14, 0, 12, 14, 10, wall, MAT.WINDOWS);
    b.box(0, 29, 0, 5, 2, 5, orn, 0);
    b.cone(0, 31, 0, 3.5, 14, 4, orn, 0);
    b.box(0, 45.5, 0, 0.4, 0.4, 0.4, C('#d02020'), 0);
    return 46;
  };
  LM.lighthouse = (b) => {
    const red = C('#c83028'), white = C('#f0f0ea');
    b.cyl(0, 0, 0, 4, 32, 10, white, 0, { r2: 2.8, stripes: () => white });
    for (let k = 0; k < 4; k++) b.cyl(0, 4 + k * 7, 0, 3.9 - k * 0.3, 3, 10, red, 0);
    b.cyl(0, 32, 0, 2.4, 3, 8, C('#f8f0b0'), MAT.LAMP);
    b.cone(0, 35, 0, 2.8, 2.5, 8, red, 0);
    return 38;
  };
  LM.grandstand = (b) => {
    const conc = C('#b0aca4'), seat = C('#2a5ab8'), roof = C('#e8e8e8');
    for (let i = 0; i < 6; i++) b.box(0, 0.8 + i * 1.3, -6 + i * 2.2, 80, 0.8 + i * 1.3, 1.1, i % 2 ? seat : shade(seat, 1.15), 0);
    b.box(0, 13, 1, 80, 0.3, 8, roof, 0);
    for (let i = -8; i <= 8; i++) b.box(i * 10, 6.5, 6.5, 0.3, 6.5, 0.3, conc, 0);
    b.box(-86, 8, -2, 4, 8, 4, conc, MAT.WINDOWS);
    b.box(-86, 17, -2, 5, 1.5, 5, C('#e6146e'), 0);
    return 18;
  };
  LM.crane = (b) => {
    const yel = C('#e8b020'), blue = C('#2a5a9a');
    for (const [x, z] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) b.box(x, 6, z, 0.6, 6, 0.6, blue, 0);
    b.box(0, 13, 0, 6, 1, 6, blue, 0);
    b.box(0, 22, 0, 2, 8, 2, yel, 0);
    b.box(0, 31, 0, 3, 1.5, 4, yel, 0);
    b.beam([0, 32, 0], [-34, 44, 0], 0.8, yel, 0);
    b.beam([0, 32, 0], [10, 34, 0], 0.8, yel, 0);
    b.box(10, 32, 0, 2, 2, 2, C('#707070'), 0);
    return 45;
  };
  LM.containers = (b, rng) => {
    const cols = ['#c83a2a', '#2a6ab8', '#e8a020', '#3a8a4a', '#8a8a8a', '#e8e8e0', '#6a3a8a'];
    for (let row = -1; row <= 1; row++) {
      for (let i = -3; i <= 3; i++) {
        const stack = 1 + Math.floor(rng() * 3);
        for (let k = 0; k < stack; k++) b.box(i * 8.5, 1.3 + k * 2.6, row * 7, 6.1, 1.3, 1.25, C(cols[Math.floor(rng() * cols.length)]), 0);
      }
    }
    return 8;
  };
  LM.tower = (b) => {
    b.box(0, 24, 0, 11, 24, 11, C('#d8d4cc'), MAT.WINDOWS);
    return 48;
  };

  function gable(b, cx, y, cz, hx, hz, h, roof, wall, alongZ = false) {
    if (!alongZ) {
      b.quad([cx - hx - 0.4, y, cz - hz - 0.4], [cx - hx - 0.4, y + h, cz], [cx + hx + 0.4, y + h, cz], [cx + hx + 0.4, y, cz - hz - 0.4], roof, 0);
      b.quad([cx + hx + 0.4, y, cz + hz + 0.4], [cx + hx + 0.4, y + h, cz], [cx - hx - 0.4, y + h, cz], [cx - hx - 0.4, y, cz + hz + 0.4], roof, 0);
      b.triangle([cx - hx, y, cz + hz], [cx - hx, y + h, cz], [cx - hx, y, cz - hz], wall, 0);
      b.triangle([cx + hx, y, cz - hz], [cx + hx, y + h, cz], [cx + hx, y, cz + hz], wall, 0);
    } else {
      b.quad([cx + hx + 0.4, y, cz - hz - 0.4], [cx, y + h, cz - hz - 0.4], [cx, y + h, cz + hz + 0.4], [cx + hx + 0.4, y, cz + hz + 0.4], roof, 0);
      b.quad([cx - hx - 0.4, y, cz + hz + 0.4], [cx, y + h, cz + hz + 0.4], [cx, y + h, cz - hz - 0.4], [cx - hx - 0.4, y, cz - hz - 0.4], roof, 0);
      b.triangle([cx - hx, y, cz - hz], [cx, y + h, cz - hz], [cx + hx, y, cz - hz], wall, 0);
      b.triangle([cx + hx, y, cz + hz], [cx, y + h, cz + hz], [cx - hx, y, cz + hz], wall, 0);
    }
  }

  function ferrisWheel() {
    const b = new Batch(1024);
    const steel = C('#e0e4ea'), cab = [C('#e6146e'), C('#ffc81e'), C('#30b4ff'), C('#ff7a1a')];
    const R = 25, n = 16;
    for (const s of [-1, 1]) {
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
        b.beam([Math.cos(a0) * R, Math.sin(a0) * R, s * 2], [Math.cos(a1) * R, Math.sin(a1) * R, s * 2], 0.25, steel, 0);
        b.beam([0, 0, s * 2], [Math.cos(a0) * R, Math.sin(a0) * R, s * 2], 0.12, steel, 0);
      }
    }
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      b.box(Math.cos(a) * R, Math.sin(a) * R - 1.6, 0, 1.1, 1, 1.1, cab[i % 4], MAT.LAMP);
    }
    for (let i = 0; i < 48; i++) {
      const a = ((i + 0.5) / 48) * Math.PI * 2;
      for (const s of [-1, 1]) b.box(Math.cos(a) * (R + 0.3), Math.sin(a) * (R + 0.3), s * 2.1, 0.12, 0.12, 0.12, i % 2 ? C('#fff4c0') : C('#ff5aa0'), MAT.LAMP);
    }
    return b;
  }

  function buildTrain() {
    const b = new Batch(1024);
    const green = C('#2e6a4a'), stripe = C('#e8c848'), red = C('#c8302a'), roof = C('#8a8e90');
    for (let k = 0; k < 4; k++) {
      const z0 = k * 20.5;
      b.box(0, 2.5, z0 + 10, 1.6, 1.4, 9.9, green, 0, { top: roof });
      b.box(0, 3.95, z0 + 10, 1.5, 0.12, 9.8, roof, 0);
      b.box(0, 2.35, z0 + 10, 1.62, 0.1, 9.92, stripe, 0);
      for (let w = 0; w < 7; w++) for (const s of [-1, 1]) b.quad([s * 1.61, 2.7, z0 + 2 + w * 2.6], [s * 1.61, 3.5, z0 + 2 + w * 2.6], [s * 1.61, 3.5, z0 + 3.8 + w * 2.6], [s * 1.61, 2.7, z0 + 3.8 + w * 2.6], C('#2a3440'), MAT.WINDOWS, null, [s, 0, 0]);
      b.box(0, 0.9, z0 + 10, 1.3, 0.35, 9, C('#2a2a2a'), 0);
    }
    b.box(0, 2.2, -0.6, 1.62, 1.1, 0.6, red, 0);
    b.box(0, 2.5, 82.6, 1.62, 1.4, 0.6, red, 0);
    b.quad([-1.3, 2.9, -1.25], [-1.3, 3.6, -1.1], [1.3, 3.6, -1.1], [1.3, 2.9, -1.25], C('#2a3440'), MAT.GLASS);
    b.box(0, 4.5, 4, 0.1, 0.5, 1.2, C('#404040'), 0);
    return b;
  }

  function buildPlane() {
    const b = new Batch(512);
    const body = C('#e8e4d8'), red = C('#c8302a'), dark = C('#2a2a2a');
    b.box(0, 0, 0, 0.9, 1, 6, body, 0);
    b.box(0, 0.2, -6.4, 0.8, 0.8, 0.5, red, 0);
    b.box(0, 1.9, -1.5, 9, 0.12, 1.2, body, 0);
    b.box(0, -0.9, -1.4, 7.5, 0.12, 1.1, body, 0);
    for (const s of [-1, 1]) b.beam([s * 5, -0.9, -1.4], [s * 5, 1.9, -1.4], 0.08, dark, 0);
    b.box(0, 0.6, 5.8, 2.6, 0.08, 0.7, red, 0);
    b.box(0, 1.5, 5.9, 0.08, 1.1, 0.6, red, 0);
    b.box(0, 0.8, -3.6, 0.7, 0.5, 0.8, C('#40505a'), MAT.GLASS);
    for (const s of [-1, 1]) b.box(s * 1.2, -1.7, -2.2, 0.1, 0.5, 0.1, dark, 0);
    return b;
  }

  const PROPS = {};

  function buildProp(b, p, rng, t) {
    const pole = C('#5a5e62');
    switch (p.type) {
      case 'lamp': {
        b.cyl(0, 0, 0, 0.12, 8, 5, pole, 0);
        b.beam([0, 8, 0], [0, 8.4, -1.6], 0.07, pole, 0);
        b.box(0, 8.25, -1.8, 0.25, 0.12, 0.45, C('#d8d8c8'), MAT.LAMP);
        break;
      }
      case 'blamp': {
        b.cyl(0, 0, 0, 0.1, 7, 5, C('#8a8e92'), 0);
        b.box(0, 7.1, -0.9, 0.2, 0.1, 0.8, C('#d8d8c8'), MAT.LAMP);
        break;
      }
      case 'fence': {
        const l = (p.len || 3) / 2;
        const col = C(p.col || '#6a5236');
        b.box(0, 0.6, 0, 0.04, 0.6, l, col, 0);
        b.box(0, 0.65, -l, 0.06, 0.65, 0.06, shade(col, 0.7), 0);
        break;
      }
      case 'bin': b.cyl(0, 0, 0, 0.3, 0.9, 6, C('#3a5a3a'), 0); break;
      case 'bench': b.box(0, 0.45, 0, 0.9, 0.05, 0.25, C('#8a5a30'), 0); b.box(0, 0.8, 0.22, 0.9, 0.2, 0.03, C('#8a5a30'), 0); b.box(0, 0.22, 0, 0.8, 0.22, 0.2, C('#3a3a3a'), 0); break;
      case 'cabin': {
        const pal = [['#2a6ab8', '#f4f4f0'], ['#c83a2a', '#f4f4f0'], ['#3a8a4a', '#f4f4f0'], ['#e8a020', '#f4f4f0']][Math.floor(rng() * 4)];
        const c1 = C(pal[0]), c2 = C(pal[1]);
        for (let i = 0; i < 4; i++) b.box(-0.54 + i * 0.36, 1.1, 0, 0.18, 1.1, 0.62, i % 2 ? c2 : c1, 0);
        b.cone(0, 2.2, 0, 0.95, 0.55, 4, c1, 0);
        b.box(0, 0.06, 0, 0.8, 0.06, 0.8, C('#9a7a52'), 0);
        break;
      }
      case 'lifeguard': {
        const wood = C('#b89a70'), red = C('#c8302a'), white = C('#f0f0ea');
        for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) b.beam([x * 1.25, 0, z * 1.25], [x, 2.7, z], 0.09, wood, 0);
        b.box(0, 2.75, 0, 1.25, 0.08, 1.25, wood, 0);
        b.box(0, 3.6, 0.35, 1.1, 0.8, 0.75, white, 0);
        b.box(0, 3.3, -1.15, 1.2, 0.45, 0.05, red, 0);
        for (const x of [-1.15, 1.15]) b.box(x, 3.65, -1.15, 0.06, 0.85, 0.06, wood, 0);
        b.box(0, 4.55, 0, 1.45, 0.08, 1.45, red, 0);
        for (const x of [-0.4, 0.4]) b.beam([x, 0, 2.3], [x, 2.75, 1.25], 0.05, wood, 0);
        for (let k = 1; k <= 5; k++) b.box(0, k * 0.46, 2.3 - k * 0.175, 0.4, 0.03, 0.03, wood, 0);
        b.cyl(1.3, 4.6, 1.3, 0.035, 1.8, 4, white, 0);
        b.triangle([1.3, 6.3, 1.3], [1.3, 5.7, 1.3], [2.2, 6.0, 1.3], red, 0);
        b.triangle([1.3, 5.7, 1.3], [1.3, 6.3, 1.3], [2.2, 6.0, 1.3], red, 0);
        break;
      }
      case 'parasol': {
        const cols = ['#e6146e', '#ffc81e', '#30b4ff', '#ff7a1a', '#f4f4f0', '#3aa84a'];
        const col = C(cols[Math.floor(rng() * cols.length)]);
        b.cyl(0, 0, 0, 0.04, 2.4, 4, C('#e8e8e8'), 0);
        b.cone(0, 2.0, 0, 1.4, 0.55, 8, col, 0);
        b.cone(0, 2.0, 0, 1.4, -0.12, 8, shade(col, 0.75), 0);
        b.cyl(0, 0, 0, 0.45, 0.72, 8, C('#f0f0ea'), 0);
        break;
      }
      case 'cafe': {
        const wood = C('#9a6a42'), dark = C('#5a3c24');
        b.box(0, 1.5, 0, 2.6, 1.5, 1.8, wood, 0);
        b.quad([-2.2, 1.0, -1.81], [-2.2, 2.4, -1.81], [2.2, 2.4, -1.81], [2.2, 1.0, -1.81], C('#3a4a5a'), MAT.WINDOWS, null, [0, 0, -1]);
        b.box(0, 3.1, -0.4, 3.2, 0.1, 2.6, C('#e8e4da'), 0);
        b.box(0, 3.65, -1.7, 1.8, 0.45, 0.08, C('#c8202e'), 0);
        b.box(0, 0.95, -2.1, 2.4, 0.05, 0.3, dark, 0);
        break;
      }
      case 'flowers': {
        const cols = ['#e6146e', '#ffc81e', '#f4f4f0', '#ff7a1a', '#b040c0'];
        b.box(0, 0.25, 0, 0.7, 0.25, 0.35, C('#b8b4ac'), 0);
        for (let i = 0; i < 4; i++) b.box(-0.48 + i * 0.32, 0.62, 0, 0.16, 0.14, 0.26, i % 2 ? C('#3a7a3a') : C(cols[Math.floor(rng() * cols.length)]), 0);
        break;
      }
      case 'tires': {
        const l = (p.len || 9) / 2;
        const tc = [C('#1a1a1a'), C('#e8e8e8'), C('#c82020')];
        for (let i = 0; i < 8; i++) b.cyl(0, 0, -l + 0.55 + i * (2 * l - 1.1) / 7, 0.5, 1.1, 6, i % 3 === 1 ? tc[1] : tc[0], 0);
        break;
      }
      default: if (PROPS[p.type]) PROPS[p.type](b, p, rng, t); break;
    }
  }

  F.Models = { Batch, LM, PROPS, gable, ferrisWheel, buildTrain, buildPlane, buildProp, shade, C };
})(globalThis.Forza = globalThis.Forza || {});
