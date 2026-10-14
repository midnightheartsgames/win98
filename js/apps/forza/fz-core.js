(function (F) {
  'use strict';

  F.TICK = 1 / 60;
  F.SUB = 2;
  F.G = 9.81;
  F.RHO = 1.225;
  F.WATER_Y = -1.2;

  F.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  F.lerp = (a, b, t) => a + (b - a) * t;
  F.smooth = (a, b, t) => {
    const x = F.clamp((t - a) / (b - a), 0, 1);
    return x * x * (3 - 2 * x);
  };
  F.approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
  F.wrap = a => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };
  F.yawOf = (dx, dz) => Math.atan2(dx, -dz);
  F.fwd = yaw => [Math.sin(yaw), -Math.cos(yaw)];
  F.right = yaw => [Math.cos(yaw), Math.sin(yaw)];

  F.rng = seed => {
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
    return next;
  };

  F.hash2 = (x, y, s = 0) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };

  F.noise2 = (x, y, s = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = F.hash2(xi, yi, s), b = F.hash2(xi + 1, yi, s), c = F.hash2(xi, yi + 1, s), d = F.hash2(xi + 1, yi + 1, s);
    return F.lerp(F.lerp(a, b, u), F.lerp(c, d, u), v);
  };

  F.fbm = (x, y, oct, s = 0) => {
    let sum = 0, amp = 1, norm = 0, f = 1;
    for (let i = 0; i < oct; i++) {
      sum += F.noise2(x * f, y * f, s + i * 17) * amp;
      norm += amp;
      amp *= 0.5;
      f *= 2;
    }
    return sum / norm;
  };

  F.segDist = (px, pz, ax, az, bx, bz) => {
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz;
    let t = l2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0;
    t = F.clamp(t, 0, 1);
    const qx = ax + dx * t, qz = az + dz * t;
    return { d: Math.hypot(px - qx, pz - qz), t, x: qx, z: qz };
  };

  F.segIntersect = (ax, az, bx, bz, cx, cz, dx, dz) => {
    const rx = bx - ax, rz = bz - az, sx = dx - cx, sz = dz - cz;
    const den = rx * sz - rz * sx;
    if (Math.abs(den) < 1e-9) return null;
    const t = ((cx - ax) * sz - (cz - az) * sx) / den;
    const u = ((cx - ax) * rz - (cz - az) * rx) / den;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return { t, u, x: ax + rx * t, z: az + rz * t };
  };

  F.inPoly = (x, z, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  };

  F.polyBox = poly => {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const [x, z] of poly) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (z < z0) z0 = z;
      if (z > z1) z1 = z;
    }
    return { x0, z0, x1, z1 };
  };

  F.polyArea = poly => {
    let a = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
    return Math.abs(a / 2);
  };

  F.polyEdgeDist = (x, z, poly) => {
    let best = Infinity;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const d = F.segDist(x, z, poly[j][0], poly[j][1], poly[i][0], poly[i][1]).d;
      if (d < best) best = d;
    }
    return best;
  };

  F.polylineLength = pts => {
    let l = 0;
    for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return l;
  };

  F.resample = (pts, step) => {
    const out = [[pts[0][0], pts[0][1]]];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0], az = pts[i - 1][1], bx = pts[i][0], bz = pts[i][1];
      const len = Math.hypot(bx - ax, bz - az);
      let pos = step - carry;
      while (pos < len) {
        const t = pos / len;
        out.push([ax + (bx - ax) * t, az + (bz - az) * t]);
        pos += step;
      }
      carry = len - (pos - step);
    }
    const last = pts[pts.length - 1];
    const tail = out[out.length - 1];
    if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > step * 0.35) out.push([last[0], last[1]]);
    else out[out.length - 1] = [last[0], last[1]];
    return out;
  };

  F.fillet = (pts, radius, closed) => {
    if (pts.length < 3) return pts.map(p => [p[0], p[1]]);
    const out = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const isEnd = !closed && (i === 0 || i === n - 1);
      if (isEnd) { out.push([p[0], p[1]]); continue; }
      const a = pts[(i - 1 + n) % n], c = pts[(i + 1) % n];
      const r = p[2] !== undefined ? p[2] : radius;
      const l1 = Math.hypot(p[0] - a[0], p[1] - a[1]), l2 = Math.hypot(c[0] - p[0], c[1] - p[1]);
      const d1x = (p[0] - a[0]) / l1, d1z = (p[1] - a[1]) / l1, d2x = (c[0] - p[0]) / l2, d2z = (c[1] - p[1]) / l2;
      const turn = Math.acos(F.clamp(d1x * d2x + d1z * d2z, -1, 1));
      if (turn < 0.02 || r <= 0) { out.push([p[0], p[1]]); continue; }
      let cut = r * Math.tan(turn / 2);
      cut = Math.min(cut, l1 * 0.48, l2 * 0.48);
      const sx = p[0] - d1x * cut, sz = p[1] - d1z * cut, ex = p[0] + d2x * cut, ez = p[1] + d2z * cut;
      const steps = Math.max(2, Math.ceil(turn / 0.12));
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const qx = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * p[0] + t * t * ex;
        const qz = (1 - t) * (1 - t) * sz + 2 * (1 - t) * t * p[1] + t * t * ez;
        out.push([qx, qz]);
      }
    }
    if (closed) out.push([out[0][0], out[0][1]]);
    return out;
  };

  F.catmull = (pts, step, closed) => {
    const n = pts.length;
    const get = i => (closed ? pts[(i + n) % n] : pts[F.clamp(i, 0, n - 1)]);
    const out = [];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const k = Math.max(1, Math.ceil(len / step));
      for (let j = 0; j < k; j++) {
        const t = j / k, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        const q = [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
        if (p1.length > 2) q.push(f(p0[2] ?? p1[2], p1[2], p2[2] ?? p1[2], p3[2] ?? p2[2] ?? p1[2]));
        out.push(q);
      }
    }
    if (closed) out.push(out[0].slice());
    else out.push(pts[n - 1].slice());
    return out;
  };

  const M4 = {
    ident() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
    persp(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      const m = new Float32Array(16);
      m[0] = f / aspect; m[5] = f; m[10] = (far + near) * nf; m[11] = -1; m[14] = 2 * far * near * nf;
      return m;
    },
    lookAt(ex, ey, ez, tx, ty, tz, ux = 0, uy = 1, uz = 0) {
      let zx = ex - tx, zy = ey - ty, zz = ez - tz;
      let l = Math.hypot(zx, zy, zz) || 1;
      zx /= l; zy /= l; zz /= l;
      let xx = uy * zz - uz * zy, xy = uz * zx - ux * zz, xz = ux * zy - uy * zx;
      l = Math.hypot(xx, xy, xz) || 1;
      xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      const m = new Float32Array(16);
      m[0] = xx; m[1] = yx; m[2] = zx;
      m[4] = xy; m[5] = yy; m[6] = zy;
      m[8] = xz; m[9] = yz; m[10] = zz;
      m[12] = -(xx * ex + xy * ey + xz * ez);
      m[13] = -(yx * ex + yy * ey + yz * ez);
      m[14] = -(zx * ex + zy * ey + zz * ez);
      m[15] = 1;
      return m;
    },
    ortho(l, r, b, t, n, f) {
      const m = new Float32Array(16);
      m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n);
      m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1;
      return m;
    },
    mul(a, b, out = new Float32Array(16)) {
      for (let c = 0; c < 4; c++) {
        const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
        out[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
        out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
        out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
        out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
      }
      return out;
    },
    pose(x, y, z, yaw, pitch = 0, roll = 0, s = 1, out = new Float32Array(16)) {
      const cy = Math.cos(-yaw), sy = Math.sin(-yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
      out[0] = (cy * cr + sy * sp * sr) * s; out[1] = (cp * sr) * s; out[2] = (-sy * cr + cy * sp * sr) * s; out[3] = 0;
      out[4] = (-cy * sr + sy * sp * cr) * s; out[5] = (cp * cr) * s; out[6] = (sy * sr + cy * sp * cr) * s; out[7] = 0;
      out[8] = (sy * cp) * s; out[9] = (-sp) * s; out[10] = (cy * cp) * s; out[11] = 0;
      out[12] = x; out[13] = y; out[14] = z; out[15] = 1;
      return out;
    },
    invert(m) {
      const inv = new Float32Array(16);
      inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
      inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
      inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
      inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
      inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
      inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
      inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
      inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
      inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
      inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
      inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
      inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
      inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
      inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
      inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
      inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
      let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
      det = det ? 1 / det : 0;
      for (let i = 0; i < 16; i++) inv[i] *= det;
      return inv;
    },
    apply(m, x, y, z) {
      const w = m[3] * x + m[7] * y + m[11] * z + m[15];
      return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w, w];
    },
    planes(m) {
      const p = [
        [m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]],
        [m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]],
        [m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]],
        [m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]],
        [m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]],
        [m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]]
      ];
      for (const q of p) {
        const l = Math.hypot(q[0], q[1], q[2]) || 1;
        q[0] /= l; q[1] /= l; q[2] /= l; q[3] /= l;
      }
      return p;
    },
    boxVisible(planes, x0, y0, z0, x1, y1, z1) {
      for (const p of planes) {
        const x = p[0] > 0 ? x1 : x0, y = p[1] > 0 ? y1 : y0, z = p[2] > 0 ? z1 : z0;
        if (p[0] * x + p[1] * y + p[2] * z + p[3] < 0) return false;
      }
      return true;
    }
  };
  F.M4 = M4;

  F.CLASSES = [
    { c: 'D', min: 100, max: 500, col: '#4fb3e8' },
    { c: 'C', min: 501, max: 600, col: '#f2c230' },
    { c: 'B', min: 601, max: 700, col: '#f08a2c' },
    { c: 'A', min: 701, max: 800, col: '#e8453c' },
    { c: 'S1', min: 801, max: 900, col: '#a24fd8' },
    { c: 'S2', min: 901, max: 998, col: '#3a64e0' },
    { c: 'X', min: 999, max: 999, col: '#3fc46a' }
  ];
  F.classOf = pi => F.CLASSES.find(k => pi <= k.max) || F.CLASSES[F.CLASSES.length - 1];
  F.classIndex = c => F.CLASSES.findIndex(k => k.c === c);

  F.RARITY = {
    common: { name: 'ОБЫЧНАЯ', col: '#6fb52c' },
    rare: { name: 'РЕДКАЯ', col: '#2f86d6' },
    epic: { name: 'ЭПИЧЕСКАЯ', col: '#8d45c9' },
    legendary: { name: 'ЛЕГЕНДАРНАЯ', col: '#e3a114' }
  };

  F.PAINTS = [
    '#e8e6dc', '#c9c9c4', '#8a8d90', '#3b3d40', '#141416', '#b7282e', '#e24a22', '#f0a81c', '#f2e04a', '#8fc23a',
    '#2f8a4a', '#1f5a3c', '#6f9fc8', '#2a62b8', '#1a2f6e', '#5a2d82', '#c0558a', '#7a4a2a', '#c8b98a', '#5f7f86'
  ];

  F.fmtCR = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  F.fmtTime = sec => {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60), ms = Math.floor((sec * 1000) % 1000);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(ms).padStart(3, '0');
  };
  F.fmtDist = m => (m >= 1000 ? (m / 1000).toFixed(1) + ' км' : Math.round(m) + ' м');
  F.plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };
  F.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  F.hexRgb = hex => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  };

  F.Grid = class {
    constructor(cell) {
      this.cell = cell;
      this.map = new Map();
    }
    key(ix, iz) { return ix * 73856093 ^ iz * 19349663; }
    add(item, x0, z0, x1, z1) {
      const c = this.cell;
      for (let ix = Math.floor(x0 / c); ix <= Math.floor(x1 / c); ix++) {
        for (let iz = Math.floor(z0 / c); iz <= Math.floor(z1 / c); iz++) {
          const k = this.key(ix, iz);
          let arr = this.map.get(k);
          if (!arr) this.map.set(k, arr = []);
          arr.push(item);
        }
      }
    }
    query(x0, z0, x1, z1, out = [], stamp = null) {
      const c = this.cell;
      for (let ix = Math.floor(x0 / c); ix <= Math.floor(x1 / c); ix++) {
        for (let iz = Math.floor(z0 / c); iz <= Math.floor(z1 / c); iz++) {
          const arr = this.map.get(this.key(ix, iz));
          if (!arr) continue;
          for (const it of arr) {
            if (stamp !== null) {
              if (it._q === stamp) continue;
              it._q = stamp;
            }
            out.push(it);
          }
        }
      }
      return out;
    }
  };
  let qStamp = 1;
  F.stamp = () => ++qStamp;
})(globalThis.Forza = globalThis.Forza || {});
