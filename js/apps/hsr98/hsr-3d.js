(function (H) {
  'use strict';
  const G = H.Gfx;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const NEAR = 0.05;

  const M = {
    id() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]; },
    mul(a, b) {
      return [
        a[0] * b[0] + a[1] * b[4] + a[2] * b[8], a[0] * b[1] + a[1] * b[5] + a[2] * b[9], a[0] * b[2] + a[1] * b[6] + a[2] * b[10], a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3],
        a[4] * b[0] + a[5] * b[4] + a[6] * b[8], a[4] * b[1] + a[5] * b[5] + a[6] * b[9], a[4] * b[2] + a[5] * b[6] + a[6] * b[10], a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7],
        a[8] * b[0] + a[9] * b[4] + a[10] * b[8], a[8] * b[1] + a[9] * b[5] + a[10] * b[9], a[8] * b[2] + a[9] * b[6] + a[10] * b[10], a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11]
      ];
    },
    t(x, y, z) { return [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z]; },
    s(x, y, z) { return [x, 0, 0, 0, 0, y == null ? x : y, 0, 0, 0, 0, z == null ? x : z, 0]; },
    rx(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]; },
    ry(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]; },
    rz(a) { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]; },
    of(...ms) { return ms.reduce((a, b) => M.mul(a, b)); },
    pt(m, x, y, z) { return [m[0] * x + m[1] * y + m[2] * z + m[3], m[4] * x + m[5] * y + m[6] * z + m[7], m[8] * x + m[9] * y + m[10] * z + m[11]]; }
  };

  const rgb = c => (typeof c === 'string' ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : c);

  function mesh() { return { v: [], n: [], f: [] }; }

  function vert(m, x, y, z, nx, ny, nz) { m.v.push(x, y, z); m.n.push(nx || 0, ny || 0, nz || 0); return m.v.length / 3 - 1; }

  function face(m, a, b, c, col, o, uv) {
    m.f.push({ a, b, c, col: rgb(col), uv: uv || null, tex: (uv && o && o.tex) || null, emit: (o && o.emit) || 0, two: !!(o && o.two), sm: !!(o && o.sm) });
  }

  function quad(m, p, col, o = {}) {
    const i = m.v.length / 3;
    for (let k = 0; k < 12; k += 3) vert(m, p[k], p[k + 1], p[k + 2]);
    const T = o.tex, uv = T ? (o.uv || [0, T.h, T.w, T.h, T.w, 0, 0, 0]) : null;
    face(m, i, i + 1, i + 2, col, o, uv && [uv[0], uv[1], uv[2], uv[3], uv[4], uv[5]]);
    face(m, i, i + 2, i + 3, col, o, uv && [uv[0], uv[1], uv[4], uv[5], uv[6], uv[7]]);
  }

  function box(m, cx, cy, cz, w, h, d, col, o = {}) {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    const C = k => (o.cols && o.cols[k]) || col, base = { emit: o.emit, two: o.two };
    quad(m, [x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1], C(0), o.front ? Object.assign({}, base, o.front) : base);
    quad(m, [x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0], C(1), base);
    quad(m, [x1, y0, z1, x1, y0, z0, x1, y1, z0, x1, y1, z1], C(2), base);
    quad(m, [x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0], C(3), base);
    quad(m, [x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z0], C(4), o.top ? Object.assign({}, base, o.top) : base);
    quad(m, [x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1], C(5), base);
  }

  function cyl(m, cx, cy, cz, r0, r1, h, seg, col, o = {}) {
    const base = m.v.length / 3, side = { emit: o.emit, sm: o.sm !== false, two: o.two };
    for (let i = 0; i <= seg; i++) {
      const a = i / seg * Math.PI * 2 + (o.rot || 0), s = Math.sin(a), c = Math.cos(a);
      vert(m, cx + r0 * s, cy, cz + r0 * c, s, 0, c);
      vert(m, cx + r1 * s, cy + h, cz + r1 * c, s, 0, c);
    }
    for (let i = 0; i < seg; i++) {
      const a = base + i * 2, b = a + 2;
      face(m, a, b, b + 1, col, side);
      face(m, a, b + 1, a + 1, col, side);
    }
    if (o.cap === false) return;
    const capO = { emit: o.capEmit == null ? o.emit : o.capEmit }, capC = o.capCol || col;
    const top = vert(m, cx, cy + h, cz), bot = vert(m, cx, cy, cz);
    for (let i = 0; i < seg; i++) {
      const a = base + i * 2, b = a + 2;
      if (r1 > 0) face(m, top, a + 1, b + 1, capC, capO);
      if (r0 > 0 && o.bottom !== false) face(m, bot, b, a, capC, capO);
    }
  }

  function disc(m, x, y, z, r, h, seg, col, o) {
    const d = mesh();
    cyl(d, 0, 0, 0, r, r, h, seg, col, Object.assign({ sm: false }, o));
    merge(m, d, M.of(M.t(x, y, z), M.rx(Math.PI / 2)));
  }

  function ell(m, cx, cy, cz, rx, ry, rz, su, sv, col, o = {}) {
    const base = m.v.length / 3, row = su + 1, F = o.face;
    for (let j = 0; j <= sv; j++) {
      const phi = -Math.PI / 2 + j / sv * Math.PI, cp = Math.cos(phi), sp = Math.sin(phi);
      for (let i = 0; i <= su; i++) {
        const th = i / su * Math.PI * 2, s = Math.sin(th), c = Math.cos(th);
        const x = rx * cp * s, y = ry * sp, z = rz * cp * c;
        const nx = x / (rx * rx), ny = y / (ry * ry), nz = z / (rz * rz), l = Math.hypot(nx, ny, nz) || 1;
        vert(m, cx + x, cy + y, cz + z, nx / l, ny / l, nz / l);
      }
    }
    const uvOf = k => { const x = m.v[k * 3] - cx, y = m.v[k * 3 + 1] - cy; return [(x / rx * 0.5 + 0.5) * F.tex.w, (0.5 - y / ry * 0.5) * F.tex.h]; };
    const fo = { emit: o.emit, sm: o.sm !== false, two: o.two };
    const texO = F ? Object.assign({}, fo, { tex: F.tex }) : null;
    const front = (a, b, c) => F && [a, b, c].every(k => m.v[k * 3 + 2] - cz > F.z * rz);
    const put = (a, b, c) => {
      if (front(a, b, c)) { const A = uvOf(a), B = uvOf(b), C = uvOf(c); face(m, a, b, c, col, texO, [A[0], A[1], B[0], B[1], C[0], C[1]]); }
      else face(m, a, b, c, col, fo);
    };
    for (let j = 0; j < sv; j++) for (let i = 0; i < su; i++) {
      const a = base + j * row + i, b = a + 1, c = a + row + 1, d = a + row;
      if (j > 0) put(a, b, c);
      if (j < sv - 1) put(a, c, d);
    }
  }

  function loft(m, pa, za, pb, zb, col, o = {}) {
    const n = pa.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      quad(m, [pa[i][0], pa[i][1], za, pa[j][0], pa[j][1], za, pb[j][0], pb[j][1], zb, pb[i][0], pb[i][1], zb], (o.sideCol && o.sideCol(i)) || col, o);
    }
    if (o.cap === false) return;
    const capO = { emit: o.capEmit == null ? o.emit : o.capEmit };
    for (let i = 1; i < n - 1; i++) {
      const a = vert(m, pb[0][0], pb[0][1], zb), b = vert(m, pb[i][0], pb[i][1], zb), c = vert(m, pb[i + 1][0], pb[i + 1][1], zb);
      face(m, a, b, c, o.capCol || col, capO);
      const d = vert(m, pa[0][0], pa[0][1], za), e = vert(m, pa[i + 1][0], pa[i + 1][1], za), f = vert(m, pa[i][0], pa[i][1], za);
      face(m, d, e, f, o.backCol || o.capCol || col, capO);
    }
  }

  function grid(m, x0, z0, x1, z1, y, nx, nz, col, o = {}) {
    const T = o.tex, rep = o.rep || 1;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const ax = x0 + (x1 - x0) * i / nx, bx = x0 + (x1 - x0) * (i + 1) / nx, az = z1 - (z1 - z0) * j / nz, bz = z1 - (z1 - z0) * (j + 1) / nz;
      const c = o.check && (i + j) % 2 ? o.check : col;
      if (!T) { quad(m, [ax, y, az, bx, y, az, bx, y, bz, ax, y, bz], c, o); continue; }
      const u0 = i / nx * T.w * rep, u1 = (i + 1) / nx * T.w * rep, v0 = (1 - j / nz) * T.h * rep, v1 = (1 - (j + 1) / nz) * T.h * rep;
      quad(m, [ax, y, az, bx, y, az, bx, y, bz, ax, y, bz], c, Object.assign({}, o, { uv: [u0, v0, u1, v0, u1, v1, u0, v1] }));
    }
  }

  function merge(dst, src, mat) {
    const off = dst.v.length / 3;
    for (let i = 0; i < src.v.length; i += 3) {
      const x = src.v[i], y = src.v[i + 1], z = src.v[i + 2], nx = src.n[i], ny = src.n[i + 1], nz = src.n[i + 2];
      dst.v.push(mat[0] * x + mat[1] * y + mat[2] * z + mat[3], mat[4] * x + mat[5] * y + mat[6] * z + mat[7], mat[8] * x + mat[9] * y + mat[10] * z + mat[11]);
      const ax = mat[0] * nx + mat[1] * ny + mat[2] * nz, ay = mat[4] * nx + mat[5] * ny + mat[6] * nz, az = mat[8] * nx + mat[9] * ny + mat[10] * nz, l = Math.hypot(ax, ay, az) || 1;
      dst.n.push(ax / l, ay / l, az / l);
    }
    for (const f of src.f) dst.f.push(Object.assign({}, f, { a: f.a + off, b: f.b + off, c: f.c + off }));
    return dst;
  }

  const texCache = new WeakMap();
  function tex(cv) {
    let t = texCache.get(cv);
    if (!t) {
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      const pot = (cv.width & (cv.width - 1)) === 0 && (cv.height & (cv.height - 1)) === 0;
      t = { w: cv.width, h: cv.height, d, wrap: pot };
      texCache.set(cv, t);
    }
    return t;
  }

  const drawn = new Map();
  function paint(key, w, h, fn) {
    let t = drawn.get(key);
    if (t) return t;
    const cv = G.mkCanvas(w, h), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    fn(g, w, h);
    t = tex(cv);
    drawn.set(key, t);
    return t;
  }

  class Raster {
    constructor(w, h) {
      this.w = w; this.h = h;
      this.cv = G.mkCanvas(w, h);
      this.g = this.cv.getContext('2d');
      this.img = this.g.createImageData(w, h);
      this.px = this.img.data;
      this.zb = new Float32Array(w * h);
      this.row = new Uint8ClampedArray(w * 4);
      this.W = new Float32Array(3 * 64); this.V = new Float32Array(3 * 64); this.N = new Float32Array(3 * 64);
      this.edge = new Float64Array(9);
      this.snap = true;
      this.look([0, 0, 5], [0, 0, 0], 50);
      this.light();
    }

    light(o = {}) {
      this.amb = o.amb || [0.4, 0.4, 0.45];
      const d = o.dir || [0.3, 0.8, 0.5], l = Math.hypot(d[0], d[1], d[2]);
      this.sun = o.sun === null ? null : { d: [d[0] / l, d[1] / l, d[2] / l], c: o.sun || [0.8, 0.78, 0.7] };
      this.pts = o.pts || [];
      this.fog = o.fog || null;
      this.toon = o.toon || null;
    }

    look(eye, at, fov, roll, ortho) {
      const fx = at[0] - eye[0], fy = at[1] - eye[1], fz = at[2] - eye[2], fl = Math.hypot(fx, fy, fz) || 1;
      const f = [fx / fl, fy / fl, fz / fl];
      let r = [f[1] * 0 - f[2] * 1, f[2] * 0 - f[0] * 0, f[0] * 1 - f[1] * 0];
      let rl = Math.hypot(r[0], r[1], r[2]);
      if (rl < 1e-5) { r = [1, 0, 0]; rl = 1; }
      r = [r[0] / rl, r[1] / rl, r[2] / rl];
      let u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
      if (roll) {
        const c = Math.cos(roll), s = Math.sin(roll);
        const r2 = [r[0] * c + u[0] * s, r[1] * c + u[1] * s, r[2] * c + u[2] * s];
        u = [u[0] * c - r[0] * s, u[1] * c - r[1] * s, u[2] * c - r[2] * s];
        r = r2;
      }
      this.eye = eye.slice(); this.fw = f; this.rt = r; this.up = u;
      this.fl = this.h / 2 / Math.tan((fov || 50) * Math.PI / 360);
      this.ok = ortho || 0;
      this.cx = this.w / 2; this.cy = this.h / 2;
    }

    view(p) {
      const dx = p[0] - this.eye[0], dy = p[1] - this.eye[1], dz = p[2] - this.eye[2], R = this.rt, U = this.up, F = this.fw;
      return [dx * R[0] + dy * R[1] + dz * R[2], dx * U[0] + dy * U[1] + dz * U[2], dx * F[0] + dy * F[1] + dz * F[2]];
    }

    project(p) {
      const v = this.view(p);
      if (v[2] < NEAR) return null;
      const k = this.ok || this.fl / v[2];
      return [this.cx + k * v[0], this.cy - k * v[1], v[2]];
    }

    clear(top, bottom, mid) {
      if (top === null) { this.px.fill(0); this.zb.fill(0); return; }
      const A = rgb(top), B = rgb(bottom || top), Cm = mid ? rgb(mid) : null, w = this.w, h = this.h, row = this.row;
      for (let y = 0; y < h; y++) {
        let t = y / (h - 1), a = A, b = B;
        if (Cm) { if (t < 0.5) { b = Cm; t *= 2; } else { a = Cm; t = t * 2 - 1; } }
        const r = a[0] + (b[0] - a[0]) * t, g = a[1] + (b[1] - a[1]) * t, bl = a[2] + (b[2] - a[2]) * t;
        for (let x = 0, i = 0; x < w; x++, i += 4) { row[i] = r; row[i + 1] = g; row[i + 2] = bl; row[i + 3] = 255; }
        this.px.set(row, y * w * 4);
      }
      this.zb.fill(0);
    }

    stars(n, seed, a, drift) {
      const w = this.w, h = this.h, px = this.px;
      for (let i = 0; i < n; i++) {
        const x = Math.floor(((G.hash(i, seed, 2) * w + (drift || 0) * (0.3 + G.hash(i, 5, seed))) % w + w) % w), y = Math.floor(G.hash(seed, i, 3) * h);
        const k = a * (0.35 + 0.65 * G.hash(i, seed, 1)) * 255, o = (y * w + x) * 4;
        px[o] += k * 0.8; px[o + 1] += k * 0.88; px[o + 2] += k;
      }
    }

    grow(n) {
      if (this.W.length >= n * 3) return;
      const k = n * 3 * 2;
      this.W = new Float32Array(k); this.V = new Float32Array(k); this.N = new Float32Array(k);
    }

    shade(nx, ny, nz, wx, wy, wz, col, emit, out) {
      let lr = this.amb[0], lg = this.amb[1], lb = this.amb[2];
      const s = this.sun;
      if (s) { const d = nx * s.d[0] + ny * s.d[1] + nz * s.d[2]; if (d > 0) { lr += s.c[0] * d; lg += s.c[1] * d; lb += s.c[2] * d; } }
      for (const p of this.pts) {
        const lx = p.p[0] - wx, ly = p.p[1] - wy, lz = p.p[2] - wz, dist = Math.hypot(lx, ly, lz) || 1, at = 1 - dist / p.r;
        if (at <= 0) continue;
        const d = (nx * lx + ny * ly + nz * lz) / dist, k = ((d > 0 ? d : 0) * 0.75 + 0.25) * at * at;
        lr += p.c[0] * k; lg += p.c[1] * k; lb += p.c[2] * k;
      }
      if (this.toon) {
        const l = (lr + lg + lb) / 3;
        let q = l;
        for (const [thr, v] of this.toon) if (l >= thr) { q = v; break; }
        lr = lg = lb = q;
      }
      if (emit) { lr += (1 - lr) * emit; lg += (1 - lg) * emit; lb += (1 - lb) * emit; }
      out[0] = col[0] * lr; out[1] = col[1] * lg; out[2] = col[2] * lb;
    }

    draw(m, mat, o = {}) {
      const nv = m.v.length / 3;
      this.grow(nv);
      const W = this.W, V = this.V, N = this.N, E = this.eye, R = this.rt, U = this.up, F = this.fw, mv = m.v, mn = m.n;
      for (let k = 0; k < nv * 3; k += 3) {
        const x = mv[k], y = mv[k + 1], z = mv[k + 2];
        const wx = mat[0] * x + mat[1] * y + mat[2] * z + mat[3], wy = mat[4] * x + mat[5] * y + mat[6] * z + mat[7], wz = mat[8] * x + mat[9] * y + mat[10] * z + mat[11];
        W[k] = wx; W[k + 1] = wy; W[k + 2] = wz;
        const dx = wx - E[0], dy = wy - E[1], dz = wz - E[2];
        V[k] = dx * R[0] + dy * R[1] + dz * R[2]; V[k + 1] = dx * U[0] + dy * U[1] + dz * U[2]; V[k + 2] = dx * F[0] + dy * F[1] + dz * F[2];
        const nx = mn[k], ny = mn[k + 1], nz = mn[k + 2];
        const ax = mat[0] * nx + mat[1] * ny + mat[2] * nz, ay = mat[4] * nx + mat[5] * ny + mat[6] * nz, az = mat[8] * nx + mat[9] * ny + mat[10] * nz, l = Math.hypot(ax, ay, az) || 1;
        N[k] = ax / l; N[k + 1] = ay / l; N[k + 2] = az / l;
      }
      const lit = o.lit !== false, mode = o.mode === 'add' ? 1 : o.mode === 'alpha' ? 2 : 0, alpha = o.alpha == null ? 1 : o.alpha, tint = o.tint ? rgb(o.tint) : null;
      const emitAll = o.emit || 0, cull = o.cull !== false, zw = mode === 0 && o.zw !== false;
      const c0 = [0, 0, 0], c1 = [0, 0, 0], c2 = [0, 0, 0], base = [0, 0, 0];
      for (const f of m.f) {
        const a = f.a * 3, b = f.b * 3, c = f.c * 3;
        if (V[a + 2] < NEAR && V[b + 2] < NEAR && V[c + 2] < NEAR) continue;
        const ux = W[b] - W[a], uy = W[b + 1] - W[a + 1], uz = W[b + 2] - W[a + 2], vx = W[c] - W[a], vy = W[c + 1] - W[a + 1], vz = W[c + 2] - W[a + 2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const front = nx * (E[0] - W[a]) + ny * (E[1] - W[a + 1]) + nz * (E[2] - W[a + 2]) > 0;
        if (!front && !f.two && cull) continue;
        const col = f.col;
        base[0] = tint ? col[0] * tint[0] / 255 : col[0]; base[1] = tint ? col[1] * tint[1] / 255 : col[1]; base[2] = tint ? col[2] * tint[2] / 255 : col[2];
        const em = Math.min(1, f.emit + emitAll);
        if (!lit || em >= 1 || mode === 1) {
          c0[0] = c1[0] = c2[0] = base[0]; c0[1] = c1[1] = c2[1] = base[1]; c0[2] = c1[2] = c2[2] = base[2];
        } else if (f.sm) {
          const s = front ? 1 : -1;
          this.shade(N[a] * s, N[a + 1] * s, N[a + 2] * s, W[a], W[a + 1], W[a + 2], base, em, c0);
          this.shade(N[b] * s, N[b + 1] * s, N[b + 2] * s, W[b], W[b + 1], W[b + 2], base, em, c1);
          this.shade(N[c] * s, N[c + 1] * s, N[c + 2] * s, W[c], W[c + 1], W[c + 2], base, em, c2);
        } else {
          const l = Math.hypot(nx, ny, nz) || 1, s = front ? 1 / l : -1 / l;
          this.shade(nx * s, ny * s, nz * s, (W[a] + W[b] + W[c]) / 3, (W[a + 1] + W[b + 1] + W[c + 1]) / 3, (W[a + 2] + W[b + 2] + W[c + 2]) / 3, base, em, c0);
          c1[0] = c2[0] = c0[0]; c1[1] = c2[1] = c0[1]; c1[2] = c2[2] = c0[2];
        }
        const uv = f.uv;
        const pa = [V[a], V[a + 1], V[a + 2], c0[0], c0[1], c0[2], uv ? uv[0] : 0, uv ? uv[1] : 0];
        const pb = [V[b], V[b + 1], V[b + 2], c1[0], c1[1], c1[2], uv ? uv[2] : 0, uv ? uv[3] : 0];
        const pc = [V[c], V[c + 1], V[c + 2], c2[0], c2[1], c2[2], uv ? uv[4] : 0, uv ? uv[5] : 0];
        if (this.fog && mode !== 1) for (const p of [pa, pb, pc]) this.fogV(p);
        this.tri(pa, pb, pc, f.tex, mode, alpha, zw);
      }
    }

    fogV(p) {
      const F = this.fog, k = Math.max(0, Math.min(1, (p[2] - F.near) / (F.far - F.near))) * (F.max == null ? 1 : F.max);
      if (!k) return;
      const c = F.col;
      p[3] += (c[0] - p[3]) * k; p[4] += (c[1] - p[4]) * k; p[5] += (c[2] - p[5]) * k;
    }

    tri(pa, pb, pc, tex, mode, alpha, zw) {
      const inA = pa[2] >= NEAR, inB = pb[2] >= NEAR, inC = pc[2] >= NEAR;
      if (inA && inB && inC) { this.fill(this.proj(pa), this.proj(pb), this.proj(pc), tex, mode, alpha, zw); return; }
      const out = [], poly = [pa, pb, pc];
      for (let i = 0; i < 3; i++) {
        const p = poly[i], q = poly[(i + 1) % 3], pin = p[2] >= NEAR, qin = q[2] >= NEAR;
        if (pin) out.push(p);
        if (pin !== qin) {
          const t = (NEAR - p[2]) / (q[2] - p[2]), r = new Array(8);
          for (let k = 0; k < 8; k++) r[k] = p[k] + (q[k] - p[k]) * t;
          out.push(r);
        }
      }
      if (out.length < 3) return;
      const P = out.map(p => this.proj(p));
      for (let i = 1; i < P.length - 1; i++) this.fill(P[0], P[i], P[i + 1], tex, mode, alpha, zw);
    }

    proj(p) {
      const iz = 1 / p[2], k = this.ok || this.fl * iz;
      let x = this.cx + k * p[0], y = this.cy - k * p[1];
      if (this.snap) { x = Math.round(x); y = Math.round(y); }
      return [x, y, iz, p[3], p[4], p[5], p[6], p[7]];
    }

    fill(p0, p1, p2, tex, mode, alpha, zw) {
      let x0 = p0[0], y0 = p0[1], x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1];
      let area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
      if (!(Math.abs(area) > 1e-9)) return;
      if (area < 0) { const t = p1; p1 = p2; p2 = t; x1 = p1[0]; y1 = p1[1]; x2 = p2[0]; y2 = p2[1]; area = -area; }
      const w = this.w, h = this.h;
      const minY = Math.max(0, Math.ceil(Math.min(y0, y1, y2) - 0.5)), maxY = Math.min(h - 1, Math.floor(Math.max(y0, y1, y2) - 0.5));
      if (minY > maxY || Math.max(x0, x1, x2) < 0 || Math.min(x0, x1, x2) > w) return;
      const e = this.edge;
      const setE = (k, xa, ya, xb, yb) => { const A = ya - yb, B = xb - xa; e[k] = A; e[k + 1] = B; e[k + 2] = -(A * xa + B * ya); };
      setE(0, x0, y0, x1, y1); setE(3, x1, y1, x2, y2); setE(6, x2, y2, x0, y0);
      const dx1 = x1 - x0, dy1 = y1 - y0, dx2 = x2 - x0, dy2 = y2 - y0, inv = 1 / area;
      const gx = k => ((p1[k] - p0[k]) * dy2 - (p2[k] - p0[k]) * dy1) * inv, gy = k => ((p2[k] - p0[k]) * dx1 - (p1[k] - p0[k]) * dx2) * inv;
      const zx = gx(2), zy = gy(2), rx = gx(3), ry = gy(3), gxg = gx(4), gyg = gy(4), bx = gx(5), by = gy(5);
      const ux = tex ? gx(6) : 0, uy = tex ? gy(6) : 0, vx = tex ? gx(7) : 0, vy = tex ? gy(7) : 0;
      const px = this.px, zb = this.zb, tw = tex ? tex.w : 0, th = tex ? tex.h : 0, td = tex ? tex.d : null, wrap = tex && tex.wrap;
      for (let y = minY; y <= maxY; y++) {
        const yc = y + 0.5;
        let xl = 0, xr = w - 1, skip = false;
        for (let k = 0; k < 9; k += 3) {
          const A = e[k], B = e[k + 1], r = B * yc + e[k + 2], tl = A > 0 || (A === 0 && B > 0);
          if (A === 0) { if (tl ? r < 0 : r <= 0) { skip = true; break; } continue; }
          const t = -r / A - 0.5;
          if (A > 0) { const xs = tl ? Math.ceil(t) : Math.floor(t) + 1; if (xs > xl) xl = xs; }
          else { const xe = Math.ceil(t) - 1; if (xe < xr) xr = xe; }
        }
        if (skip || xl > xr) continue;
        const fx = xl + 0.5 - x0, fy = yc - y0;
        let iz = p0[2] + zx * fx + zy * fy, r = p0[3] + rx * fx + ry * fy, g = p0[4] + gxg * fx + gyg * fy, b = p0[5] + bx * fx + by * fy;
        let u = tex ? p0[6] + ux * fx + uy * fy : 0, v = tex ? p0[7] + vx * fx + vy * fy : 0;
        let idx = y * w + xl, o = idx * 4;
        for (let x = xl; x <= xr; x++, idx++, o += 4, iz += zx, r += rx, g += gxg, b += bx, u += ux, v += vx) {
          if (iz <= zb[idx]) continue;
          let cr = r, cg = g, cb = b, ca = alpha;
          if (td) {
            let tu = u | 0, tv = v | 0;
            if (wrap) { tu &= tw - 1; tv &= th - 1; }
            else { tu = tu < 0 ? 0 : tu >= tw ? tw - 1 : tu; tv = tv < 0 ? 0 : tv >= th ? th - 1 : tv; }
            const ti = (tv * tw + tu) * 4, ta = td[ti + 3];
            if (mode === 0 ? ta < 128 : ta === 0) continue;
            cr = cr * td[ti] / 255; cg = cg * td[ti + 1] / 255; cb = cb * td[ti + 2] / 255;
            if (mode) ca *= ta / 255;
          }
          if (mode === 0) { px[o] = cr; px[o + 1] = cg; px[o + 2] = cb; px[o + 3] = 255; if (zw) zb[idx] = iz; }
          else if (mode === 1) { px[o] += cr * ca; px[o + 1] += cg * ca; px[o + 2] += cb * ca; }
          else { px[o] += (cr - px[o]) * ca; px[o + 1] += (cg - px[o + 1]) * ca; px[o + 2] += (cb - px[o + 2]) * ca; }
        }
      }
    }

    spot(cx, cy, R, col, a, shape, iz, mode) {
      const w = this.w, h = this.h, px = this.px, zb = this.zb;
      const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(w - 1, Math.ceil(cx + R)), y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(h - 1, Math.ceil(cy + R));
      if (x0 > x1 || y0 > y1) return;
      const inv = 1 / Math.max(0.5, R), cr = col[0] * a, cg = col[1] * a, cb = col[2] * a;
      for (let y = y0; y <= y1; y++) {
        const dy = (y + 0.5 - cy) * inv, ady = Math.abs(dy);
        for (let x = x0; x <= x1; x++) {
          const dx = (x + 0.5 - cx) * inv, d2 = dx * dx + dy * dy;
          let k;
          if (shape === 1) {
            const adx = Math.abs(dx);
            k = Math.max(0, 1 - adx * 9) * (1 - ady) + Math.max(0, 1 - ady * 9) * (1 - adx) + Math.max(0, 1 - d2 * 12) * 0.9;
            if (ady > 1 || adx > 1 || k <= 0) continue;
          } else {
            if (d2 >= 1) continue;
            if (shape === 2) { k = 1 - Math.abs(Math.sqrt(d2) - 0.86) * 10; if (k <= 0) continue; }
            else if (shape === 3) k = 1;
            else if (shape === 4) { k = (1 - d2) * (0.75 + 0.25 * G.hash(x >> 1, y >> 1, 7)); k *= k; }
            else { k = 1 - d2; k *= k; }
          }
          const i = y * w + x;
          if (iz && iz <= zb[i]) continue;
          const o = i * 4;
          if (mode === 2) { const t = Math.min(1, a * k); px[o] += (col[0] - px[o]) * t; px[o + 1] += (col[1] - px[o + 1]) * t; px[o + 2] += (col[2] - px[o + 2]) * t; }
          else { px[o] += cr * k; px[o + 1] += cg * k; px[o + 2] += cb * k; }
        }
      }
    }

    glow(p, rad, col, o = {}) {
      const v = this.view(p);
      if (v[2] < NEAR) return;
      const s = this.fl / v[2], shape = { glow: 0, star: 1, ring: 2, disc: 3, puff: 4 }[o.shape || 'glow'];
      this.spot(this.cx + v[0] * s, this.cy - v[1] * s, Math.max(o.min || 0.6, rad * s), rgb(col), o.a == null ? 1 : o.a, shape, o.depth === false ? 0 : 1 / v[2], o.mode === 'alpha' ? 2 : 1);
    }

    flat(cx, cy, R, col, o = {}) {
      this.spot(cx, cy, R, rgb(col), o.a == null ? 1 : o.a, { glow: 0, star: 1, ring: 2, disc: 3, puff: 4 }[o.shape || 'glow'], 0, o.mode === 'alpha' ? 2 : 1);
    }

    streak(a, b, width, ca, cb, o = {}) {
      let va = this.view(a), vb = this.view(b), A = rgb(ca), B = rgb(cb || ca);
      if (va[2] < NEAR && vb[2] < NEAR) return;
      if (va[2] < NEAR) { const t = (NEAR - va[2]) / (vb[2] - va[2]); va = va.map((v, k) => v + (vb[k] - v) * t); A = A.map((c, k) => c + (B[k] - c) * t); }
      if (vb[2] < NEAR) { const t = (NEAR - vb[2]) / (va[2] - vb[2]); vb = vb.map((v, k) => v + (va[k] - v) * t); B = B.map((c, k) => c + (A[k] - c) * t); }
      const sa = [this.cx + this.fl * va[0] / va[2], this.cy - this.fl * va[1] / va[2]], sb = [this.cx + this.fl * vb[0] / vb[2], this.cy - this.fl * vb[1] / vb[2]];
      const wa = o.world ? Math.max(0.6, width * this.fl / va[2]) : width, wb = o.world ? Math.max(0.6, width * this.fl / vb[2]) : width;
      this.band(sa, sb, wa, wb, A, B, o.depth === false ? 1e9 : 1 / va[2], o.depth === false ? 1e9 : 1 / vb[2], o.a == null ? 1 : o.a);
    }

    band(sa, sb, wa, wb, A, B, iza, izb, a) {
      const dx = sb[0] - sa[0], dy = sb[1] - sa[1], l = Math.hypot(dx, dy);
      if (l < 0.01) { this.spot(sa[0], sa[1], Math.max(0.7, wa), A, a, 0, iza, 1); return; }
      const nx = -dy / l / 2, ny = dx / l / 2;
      const p = (x, y, iz, c) => [x, y, iz, c[0], c[1], c[2], 0, 0];
      const q0 = p(sa[0] + nx * wa, sa[1] + ny * wa, iza, A), q1 = p(sa[0] - nx * wa, sa[1] - ny * wa, iza, A);
      const q2 = p(sb[0] - nx * wb, sb[1] - ny * wb, izb, B), q3 = p(sb[0] + nx * wb, sb[1] + ny * wb, izb, B);
      this.fill(q0, q1, q2, null, 1, a, false);
      this.fill(q0, q2, q3, null, 1, a, false);
    }

    shaft(x, w, col, a) {
      const C = rgb(col), px = this.px, W = this.w, H = this.h, x0 = Math.max(0, Math.floor(x - w)), x1 = Math.min(W - 1, Math.ceil(x + w));
      for (let xx = x0; xx <= x1; xx++) {
        const k = Math.max(0, 1 - Math.abs(xx + 0.5 - x) / w) * a;
        if (k <= 0) continue;
        for (let y = 0; y < H; y++) { const o = (y * W + xx) * 4, f = k * (0.55 + 0.45 * Math.sin(y / H * Math.PI)); px[o] += C[0] * f; px[o + 1] += C[1] * f; px[o + 2] += C[2] * f; }
      }
    }

    haze(y0, y1, col, a) {
      const C = rgb(col), px = this.px, W = this.w, lo = Math.max(0, Math.floor(Math.min(y0, y1))), hi = Math.min(this.h - 1, Math.ceil(Math.max(y0, y1)));
      for (let y = lo; y <= hi; y++) {
        const k = a * Math.max(0, Math.min(1, (y - y0) / (y1 - y0)));
        if (k <= 0) continue;
        for (let x = 0, o = y * W * 4; x < W; x++, o += 4) { px[o] += C[0] * k; px[o + 1] += C[1] * k; px[o + 2] += C[2] * k; }
      }
    }

    bake() {
      this.g.putImageData(this.img, 0, 0);
      return this.cv;
    }

    finish(ctx, dx, dy, dw, dh) {
      const d = this.px, w = this.w, h = this.h;
      for (let y = 0, i = 0; y < h; y++) {
        const row = (y & 3) << 2;
        for (let x = 0; x < w; x++, i += 4) {
          const t = BAYER[row | (x & 3)] * 0.5 - 4;
          const r = d[i] + t, g = d[i + 1] + t, b = d[i + 2] + t;
          d[i] = r < 0 ? 0 : (r >> 3) << 3; d[i + 1] = g < 0 ? 0 : (g >> 3) << 3; d[i + 2] = b < 0 ? 0 : (b >> 3) << 3; d[i + 3] = 255;
        }
      }
      this.g.putImageData(this.img, 0, 0);
      const was = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.cv, dx, dy, dw, dh);
      ctx.imageSmoothingEnabled = was;
    }
  }

  H.R3 = { M, Raster, mesh, vert, face, quad, box, cyl, disc, ell, loft, grid, merge, tex, paint, rgb, NEAR };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
