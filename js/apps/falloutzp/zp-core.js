(function (Z) {
  'use strict';

  Z.TICK = 1 / 60;
  Z.G = 9.81;
  Z.WATER_Y = 0;

  Z.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  Z.lerp = (a, b, t) => a + (b - a) * t;
  Z.smooth = (a, b, t) => {
    const x = Z.clamp((t - a) / (b - a), 0, 1);
    return x * x * (3 - 2 * x);
  };
  Z.approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
  Z.wrap = a => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };
  Z.angDiff = (a, b) => Z.wrap(b - a);
  Z.turnTo = (a, b, step) => {
    const d = Z.wrap(b - a);
    return Math.abs(d) <= step ? b : Z.wrap(a + Math.sign(d) * step);
  };
  Z.yawOf = (dx, dz) => Math.atan2(dx, -dz);
  Z.dist2d = (ax, az, bx, bz) => Math.hypot(bx - ax, bz - az);
  Z.dist3 = (a, b) => Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);

  Z.rng = seed => {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.range = (lo, hi) => lo + (hi - lo) * next();
    next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    next.pick = arr => arr[Math.floor(next() * arr.length)];
    next.chance = p => next() < p;
    next.weighted = list => {
      let sum = 0;
      for (const it of list) sum += it[1];
      let r = next() * sum;
      for (const it of list) { r -= it[1]; if (r <= 0) return it[0]; }
      return list[list.length - 1][0];
    };
    next.state = () => a;
    next.setState = s => { a = s >>> 0; };
    return next;
  };

  Z.hash2 = (x, y, s = 0) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  Z.hashStr = str => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  Z.noise2 = (x, y, s = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = Z.hash2(xi, yi, s), b = Z.hash2(xi + 1, yi, s), c = Z.hash2(xi, yi + 1, s), d = Z.hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  Z.fbm = (x, y, oct, s = 0) => {
    let sum = 0, amp = 1, norm = 0, f = 1;
    for (let i = 0; i < oct; i++) {
      sum += Z.noise2(x * f, y * f, s + i * 17) * amp;
      norm += amp;
      amp *= 0.5;
      f *= 2;
    }
    return sum / norm;
  };

  Z.segDist = (px, pz, ax, az, bx, bz) => {
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1e-9;
    let t = ((px - ax) * dx + (pz - az) * dz) / L2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + dx * t, qz = az + dz * t;
    return { d: Math.hypot(px - qx, pz - qz), t, x: qx, z: qz };
  };
  Z.pointInPoly = (x, z, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  };
  Z.polyArea = poly => {
    let s = 0;
    for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; s += p[0] * q[1] - q[0] * p[1]; }
    return s / 2;
  };
  Z.polyCentroid = poly => {
    let a = 0, x = 0, z = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], c = p[0] * q[1] - q[0] * p[1];
      a += c; x += (p[0] + q[0]) * c; z += (p[1] + q[1]) * c;
    }
    if (Math.abs(a) < 1e-9) return [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];
    return [x / (3 * a), z / (3 * a)];
  };
  Z.polyBox = poly => {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const p of poly) { if (p[0] < x0) x0 = p[0]; if (p[1] < z0) z0 = p[1]; if (p[0] > x1) x1 = p[0]; if (p[1] > z1) z1 = p[1]; }
    return [x0, z0, x1, z1];
  };
  Z.unflat = f => {
    const o = [];
    let x = 0, z = 0;
    for (let k = 0; k < f.length; k += 2) { x += f[k]; z += f[k + 1]; o.push([x / 10, z / 10]); }
    return o;
  };
  Z.polyLen = pts => {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  };
  Z.alongPoly = (pts, s) => {
    for (let i = 1; i < pts.length; i++) {
      const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (s <= L || i === pts.length - 1) {
        const t = L > 0 ? Z.clamp(s / L, 0, 1) : 0;
        return { x: Z.lerp(pts[i - 1][0], pts[i][0], t), z: Z.lerp(pts[i - 1][1], pts[i][1], t), dx: (pts[i][0] - pts[i - 1][0]) / (L || 1), dz: (pts[i][1] - pts[i - 1][1]) / (L || 1), i };
      }
      s -= L;
    }
    const p = pts[pts.length - 1];
    return { x: p[0], z: p[1], dx: 0, dz: 1, i: pts.length - 1 };
  };

  Z.b64 = s => {
    if (typeof atob === 'function') {
      const bin = atob(s), out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return new Uint8Array(Buffer.from(s, 'base64'));
  };

  Z.M4 = {
    ident() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
    persp(fov, aspect, near, far, out = new Float32Array(16)) {
      const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
      out.fill(0);
      out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf; out[11] = -1; out[14] = 2 * far * near * nf;
      return out;
    },
    ortho(l, r, b, t, n, f, out = new Float32Array(16)) {
      out.fill(0);
      out[0] = 2 / (r - l); out[5] = 2 / (t - b); out[10] = -2 / (f - n);
      out[12] = -(r + l) / (r - l); out[13] = -(t + b) / (t - b); out[14] = -(f + n) / (f - n); out[15] = 1;
      return out;
    },
    lookAt(ex, ey, ez, tx, ty, tz, ux = 0, uy = 1, uz = 0, out = new Float32Array(16)) {
      let fx = ex - tx, fy = ey - ty, fz = ez - tz;
      let L = Math.hypot(fx, fy, fz) || 1; fx /= L; fy /= L; fz /= L;
      let sx = uy * fz - uz * fy, sy = uz * fx - ux * fz, sz = ux * fy - uy * fx;
      L = Math.hypot(sx, sy, sz) || 1; sx /= L; sy /= L; sz /= L;
      const vx = fy * sz - fz * sy, vy = fz * sx - fx * sz, vz = fx * sy - fy * sx;
      out[0] = sx; out[1] = vx; out[2] = fx; out[3] = 0;
      out[4] = sy; out[5] = vy; out[6] = fy; out[7] = 0;
      out[8] = sz; out[9] = vz; out[10] = fz; out[11] = 0;
      out[12] = -(sx * ex + sy * ey + sz * ez); out[13] = -(vx * ex + vy * ey + vz * ez); out[14] = -(fx * ex + fy * ey + fz * ez); out[15] = 1;
      return out;
    },
    mul(a, b, out = new Float32Array(16)) {
      const r = out === a || out === b ? new Float32Array(16) : out;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        r[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
      }
      if (r !== out) out.set(r);
      return out;
    },
    invert(m, out = new Float32Array(16)) {
      const a = m, r = out === m ? new Float32Array(16) : out;
      const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4];
      const b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6];
      const b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12];
      const b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
      let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if (!det) return null;
      det = 1 / det;
      r[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * det; r[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * det;
      r[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * det; r[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * det;
      r[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * det; r[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * det;
      r[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * det; r[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * det;
      r[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * det; r[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * det;
      r[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * det; r[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * det;
      r[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * det; r[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * det;
      r[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * det; r[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * det;
      if (r !== out) out.set(r);
      return out;
    },
    trs(x, y, z, yaw, pitch, roll, sx = 1, sy = sx, sz = sx, out = new Float32Array(16)) {
      const cy = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
      out[0] = (cy * cr + syw * sp * sr) * sx; out[1] = (cp * sr) * sx; out[2] = (-syw * cr + cy * sp * sr) * sx; out[3] = 0;
      out[4] = (-cy * sr + syw * sp * cr) * sy; out[5] = (cp * cr) * sy; out[6] = (syw * sr + cy * sp * cr) * sy; out[7] = 0;
      out[8] = (syw * cp) * sz; out[9] = (-sp) * sz; out[10] = (cy * cp) * sz; out[11] = 0;
      out[12] = x; out[13] = y; out[14] = z; out[15] = 1;
      return out;
    },
    transform(m, x, y, z) {
      return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
    },
    dir(m, x, y, z) {
      return [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z];
    }
  };

  Z.Emitter = class {
    constructor() { this.handlers = {}; this.queue = []; }
    on(t, fn) { (this.handlers[t] = this.handlers[t] || []).push(fn); return () => { this.handlers[t] = (this.handlers[t] || []).filter(f => f !== fn); }; }
    emit(t, data) {
      const ev = Object.assign({}, data || {}, { t });
      this.queue.push(ev);
      if (this.queue.length > 400) this.queue.splice(0, this.queue.length - 400);
      for (const fn of this.handlers[t] || []) fn(ev);
      for (const fn of this.handlers['*'] || []) fn(ev);
      return ev;
    }
    drain() { const q = this.queue; this.queue = []; return q; }
  };

  Z.fmtTime = minutes => {
    const m = Math.floor(minutes) % 1440;
    const h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  };
  Z.plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
