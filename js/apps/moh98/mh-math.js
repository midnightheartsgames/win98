(function (S) {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const DEG = Math.PI / 180;
  const wrapAng = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

  function RNG(seed) {
    let s = (seed >>> 0) || 1;
    const f = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.range = (a, b) => a + (b - a) * f();
    f.int = n => Math.floor(f() * n);
    f.pick = arr => arr[Math.floor(f() * arr.length)];
    f.sign = () => (f() < 0.5 ? -1 : 1);
    return f;
  }

  function hash2(x, z, seed) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ Math.imul(seed | 0, 1103515245);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, z, seed) {
    const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
    const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    return lerp(lerp(hash2(xi, zi, seed), hash2(xi + 1, zi, seed), u), lerp(hash2(xi, zi + 1, seed), hash2(xi + 1, zi + 1, seed), u), v);
  }
  function fbm(x, z, seed, oct = 4) {
    let s = 0, a = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, z * f, seed + i * 17); n += a; a *= 0.5; f *= 2.03; }
    return s / n;
  }

  const M4 = {
    create() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
    identity(m) { m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; return m; },
    copy(o, a) { o.set(a); return o; },
    mul(o, a, b) {
      const r = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) {
        r[c * 4 + rr] = a[rr] * b[c * 4] + a[4 + rr] * b[c * 4 + 1] + a[8 + rr] * b[c * 4 + 2] + a[12 + rr] * b[c * 4 + 3];
      }
      o.set(r); return o;
    },
    translate(m, x, y, z) {
      m[12] += m[0] * x + m[4] * y + m[8] * z; m[13] += m[1] * x + m[5] * y + m[9] * z;
      m[14] += m[2] * x + m[6] * y + m[10] * z; m[15] += m[3] * x + m[7] * y + m[11] * z; return m;
    },
    rotX(m, a) { if (!a) return m; const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const y = m[4 + i], z = m[8 + i]; m[4 + i] = y * c + z * s; m[8 + i] = z * c - y * s; } return m; },
    rotY(m, a) { if (!a) return m; const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const x = m[i], z = m[8 + i]; m[i] = x * c - z * s; m[8 + i] = x * s + z * c; } return m; },
    rotZ(m, a) { if (!a) return m; const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const x = m[i], y = m[4 + i]; m[i] = x * c + y * s; m[4 + i] = y * c - x * s; } return m; },
    scale(m, x, y = x, z = x) { for (let i = 0; i < 4; i++) { m[i] *= x; m[4 + i] *= y; m[8 + i] *= z; } return m; },
    perspective(m, fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far); m.fill(0);
      m[0] = f / aspect; m[5] = f; m[10] = (far + near) * nf; m[11] = -1; m[14] = 2 * far * near * nf; return m;
    },
    view(m, ex, ey, ez, yaw, pitch, roll = 0) {
      const fx = Math.sin(yaw) * Math.cos(pitch), fy = Math.sin(pitch), fz = Math.cos(yaw) * Math.cos(pitch);
      let rx = -fz, ry = 0, rz = fx; const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
      let ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
      if (roll) { const c = Math.cos(roll), s = Math.sin(roll); const nrx = rx * c + ux * s, nry = ry * c + uy * s, nrz = rz * c + uz * s; ux = ux * c - rx * s; uy = uy * c - ry * s; uz = uz * c - rz * s; rx = nrx; ry = nry; rz = nrz; }
      m[0] = rx; m[4] = ry; m[8] = rz; m[12] = -(rx * ex + ry * ey + rz * ez);
      m[1] = ux; m[5] = uy; m[9] = uz; m[13] = -(ux * ex + uy * ey + uz * ez);
      m[2] = -fx; m[6] = -fy; m[10] = -fz; m[14] = fx * ex + fy * ey + fz * ez;
      m[3] = 0; m[7] = 0; m[11] = 0; m[15] = 1; return m;
    },
    xform(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; },
    xdir(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z]; }
  };

  class Mesh {
    constructor() { this.pos = []; this.nrm = []; this.uv = []; this.col = []; this.idx = []; this.M = null; }
    get count() { return this.pos.length / 3; }
    vert(x, y, z, nx, ny, nz, u, v, c) {
      if (this.M) { const p = M4.xform(this.M, x, y, z), n = M4.xdir(this.M, nx, ny, nz), l = Math.hypot(n[0], n[1], n[2]) || 1; x = p[0]; y = p[1]; z = p[2]; nx = n[0] / l; ny = n[1] / l; nz = n[2] / l; }
      this.pos.push(x, y, z); this.nrm.push(nx, ny, nz); this.uv.push(u, v); this.col.push(c[0], c[1], c[2], c[3] == null ? 1 : c[3]);
      return this.pos.length / 3 - 1;
    }
    with(m, fn) { const old = this.M; this.M = old ? M4.mul(M4.create(), old, m) : m; fn(this); this.M = old; return this; }
    quad(p, n, uvs, c) {
      const b = this.count;
      for (let i = 0; i < 4; i++) this.vert(p[i][0], p[i][1], p[i][2], n[0], n[1], n[2], uvs[i][0], uvs[i][1], c);
      this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); return this;
    }
    tri(p, n, uvs, c) {
      const b = this.count;
      for (let i = 0; i < 3; i++) this.vert(p[i][0], p[i][1], p[i][2], n[0], n[1], n[2], uvs[i][0], uvs[i][1], c);
      this.idx.push(b, b + 1, b + 2); return this;
    }
    box(x0, y0, z0, x1, y1, z1, c, uvs = 'unit', skip = null) {
      const w = uvs === 'unit' ? 0 : uvs;
      const U = (a0, a1, b0, b1) => (w ? [[a0 / w, b0 / w], [a1 / w, b0 / w], [a1 / w, b1 / w], [a0 / w, b1 / w]] : [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const f = (name) => !skip || !skip[name];
      if (f('py')) this.quad([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], U(x0, x1, z1, z0), c);
      if (f('ny')) this.quad([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], U(x0, x1, z0, z1), c);
      if (f('pz')) this.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], U(x0, x1, -y0, -y1).map(q => [q[0], q[1]]), c);
      if (f('nz')) this.quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], U(-x1, -x0, -y0, -y1), c);
      if (f('px')) this.quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], U(-z1, -z0, -y0, -y1), c);
      if (f('nx')) this.quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], U(z0, z1, -y0, -y1), c);
      return this;
    }
    cbox(cx, cy, cz, hx, hy, hz, c, uvs) { return this.box(cx - hx, cy - hy, cz - hz, cx + hx, cy + hy, cz + hz, c, uvs); }
    cyl(cx, cy, cz, r0, r1, h, n, c, caps = true, uScale = 1, vScale = 1) {
      const b = this.count, slope = (r0 - r1) / (h || 1);
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2, s = Math.sin(a), co = Math.cos(a), l = Math.hypot(1, slope);
        this.vert(cx + s * r0, cy, cz + co * r0, s / l, slope / l, co / l, (i / n) * uScale, 0, c);
        this.vert(cx + s * r1, cy + h, cz + co * r1, s / l, slope / l, co / l, (i / n) * uScale, -h * vScale, c);
      }
      for (let i = 0; i < n; i++) { const k = b + i * 2; this.idx.push(k, k + 2, k + 3, k, k + 3, k + 1); }
      if (caps) {
        if (r1 > 0.001) { const t = this.vert(cx, cy + h, cz, 0, 1, 0, 0.5, 0.5, c); const f = this.count; for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; this.vert(cx + Math.sin(a) * r1, cy + h, cz + Math.cos(a) * r1, 0, 1, 0, 0.5 + Math.sin(a) * 0.5, 0.5 + Math.cos(a) * 0.5, c); } for (let i = 0; i < n; i++) this.idx.push(t, f + i, f + i + 1); }
        if (r0 > 0.001) { const t = this.vert(cx, cy, cz, 0, -1, 0, 0.5, 0.5, c); const f = this.count; for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; this.vert(cx + Math.sin(a) * r0, cy, cz + Math.cos(a) * r0, 0, -1, 0, 0.5 + Math.sin(a) * 0.5, 0.5 + Math.cos(a) * 0.5, c); } for (let i = 0; i < n; i++) this.idx.push(t, f + i + 1, f + i); }
      }
      return this;
    }
    sphere(cx, cy, cz, rx, ry, rz, seg, rings, c) {
      const b = this.count;
      for (let j = 0; j <= rings; j++) {
        const v = j / rings, th = v * Math.PI, sy = Math.cos(th), sr = Math.sin(th);
        for (let i = 0; i <= seg; i++) {
          const u = i / seg, ph = u * Math.PI * 2, nx = Math.sin(ph) * sr, nz = Math.cos(ph) * sr;
          this.vert(cx + nx * rx, cy + sy * ry, cz + nz * rz, nx, sy, nz, u, v, c);
        }
      }
      for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
        const a = b + j * (seg + 1) + i, d = a + seg + 1;
        this.idx.push(a, d, a + 1, a + 1, d, d + 1);
      }
      return this;
    }
    pyramid(cx, cy, cz, half, h, c, w = 0) {
      const apex = [cx, cy + h, cz], P = [[cx - half, cy, cz + half], [cx + half, cy, cz + half], [cx + half, cy, cz - half], [cx - half, cy, cz - half]];
      for (let i = 0; i < 4; i++) {
        const a = P[i], b = P[(i + 1) % 4];
        const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [apex[0] - a[0], apex[1] - a[1], apex[2] - a[2]];
        let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const l = Math.hypot(...n); n = n.map(q => q / l);
        const sl = Math.hypot(half, h), U = w ? [[0, 0], [half * 2 / w, 0], [half / w, -sl / w]] : [[0, 1], [1, 1], [0.5, 0]];
        this.tri([a, b, apex], n, U, c);
      }
      return this;
    }
    append(o) {
      const b = this.count;
      for (let i = 0; i < o.count; i++) this.vert(o.pos[i * 3], o.pos[i * 3 + 1], o.pos[i * 3 + 2], o.nrm[i * 3], o.nrm[i * 3 + 1], o.nrm[i * 3 + 2], o.uv[i * 2], o.uv[i * 2 + 1], [o.col[i * 4], o.col[i * 4 + 1], o.col[i * 4 + 2], o.col[i * 4 + 3]]);
      for (const i of o.idx) this.idx.push(b + i);
      return this;
    }
    bounds() {
      const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < this.pos.length; i += 3) for (let k = 0; k < 3; k++) { const v = this.pos[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
      return { min: mn, max: mx };
    }
  }

  Mesh.prototype.cross = function (cx, cy, cz, w, h, n, c, rot = 0, v0 = 0, v1 = 1) {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI, dx = Math.cos(a) * w / 2, dz = Math.sin(a) * w / 2, nx = -Math.sin(a), nz = Math.cos(a);
      this.quad([[cx - dx, cy, cz - dz], [cx + dx, cy, cz + dz], [cx + dx, cy + h, cz + dz], [cx - dx, cy + h, cz - dz]], [nx * 0.3, 0.9, nz * 0.3], [[0, v1], [1, v1], [1, v0], [0, v0]], c);
    }
    return this;
  };
  Mesh.prototype.poly4 = function (a, b, c2, d, col, uvs) {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
    return this.quad([a, b, c2, d], n, uvs || [[0, 1], [1, 1], [1, 0], [0, 0]], col);
  };

  function segDist(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
    let t = l2 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0; t = clamp(t, 0, 1);
    return [Math.hypot(px - ax - dx * t, pz - az - dz * t), t];
  }
  function lineDist(px, pz, pts) {
    let best = { d: Infinity, i: 0, t: 0 };
    for (let i = 0; i < pts.length - 1; i++) { const [d, t] = segDist(px, pz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); if (d < best.d) best = { d, i, t }; }
    return best;
  }

  const rgb = (hex, a = 1) => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, a];
  S.segDist = segDist; S.lineDist = lineDist;

  S.clamp = clamp; S.lerp = lerp; S.smooth = smooth; S.DEG = DEG; S.wrapAng = wrapAng;
  S.RNG = RNG; S.hash2 = hash2; S.vnoise = vnoise; S.fbm = fbm; S.M4 = M4; S.Mesh = Mesh; S.rgb = rgb;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Moh98 = globalThis.Moh98 || {});
