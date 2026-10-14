(function (X) {
  'use strict';
  const TAU = Math.PI * 2;
  X.TAU = TAU;
  X.DEG = Math.PI / 180;
  X.TICK = 1 / 60;
  X.GRAVITY = 16;
  X.STEP = 0.45;
  X.PLAYER_R = 0.34;
  X.PLAYER_H = 1.8;
  X.CROUCH_H = 1.15;
  X.EYE = 1.64;
  X.CROUCH_EYE = 1.02;

  X.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  X.lerp = (a, b, t) => a + (b - a) * t;
  X.smooth = t => t * t * (3 - 2 * t);
  X.approach = (v, target, d) => (v < target ? Math.min(target, v + d) : Math.max(target, v - d));

  X.v3 = (x, y, z) => [x || 0, y || 0, z || 0];
  X.vcopy = a => [a[0], a[1], a[2]];
  X.vset = (o, a) => { o[0] = a[0]; o[1] = a[1]; o[2] = a[2]; return o; };
  X.vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  X.vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  X.vscale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  X.vma = (a, s, b) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
  X.vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  X.vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  X.vlen = a => Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  X.vdist = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  X.hdist = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2);
  X.vlerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  X.vnorm = a => {
    const l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0];
  };

  X.fwd = (yaw, pitch) => {
    const cp = Math.cos(pitch || 0);
    return [-Math.sin(yaw) * cp, Math.sin(pitch || 0), -Math.cos(yaw) * cp];
  };
  X.right = yaw => [Math.cos(yaw), 0, -Math.sin(yaw)];
  X.yawTo = (from, to) => Math.atan2(-(to[0] - from[0]), -(to[2] - from[2]));
  X.pitchTo = (from, to) => Math.atan2(to[1] - from[1], Math.hypot(to[0] - from[0], to[2] - from[2]));
  X.angDiff = (a, b) => {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU;
    return d;
  };
  X.wrap = a => { a %= TAU; if (a > Math.PI) a -= TAU; else if (a < -Math.PI) a += TAU; return a; };
  X.turnTo = (a, target, maxStep) => {
    const d = X.angDiff(a, target);
    return X.wrap(a + X.clamp(d, -maxStep, maxStep));
  };

  X.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    const next = function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.range = (a, b) => a + (b - a) * next();
    next.int = n => Math.floor(next() * n);
    next.pick = arr => arr[Math.floor(next() * arr.length)];
    next.sign = () => (next() < 0.5 ? -1 : 1);
    next.state = () => s;
    return next;
  };

  X.hash = function (str) {
    let h = 2166136261;
    const s = String(str);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 2246822507); h ^= h >>> 16;
    return h >>> 0;
  };

  X.fmtTime = function (sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  };

  X.rayCapsule = function (o, d, a, b, r) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ao = [o[0] - a[0], o[1] - a[1], o[2] - a[2]];
    const abab = X.vdot(ab, ab), abd = X.vdot(ab, d), abao = X.vdot(ab, ao);
    const A = abab - abd * abd;
    const B = abab * X.vdot(ao, d) - abao * abd;
    const C = abab * X.vdot(ao, ao) - abao * abao - r * r * abab;
    const h = B * B - A * C;
    if (h >= 0 && A > 1e-9) {
      const t = (-B - Math.sqrt(h)) / A;
      const y = abao + t * abd;
      if (y > 0 && y < abab && t >= 0) return t;
    }
    const end = (p) => {
      const oc = [o[0] - p[0], o[1] - p[1], o[2] - p[2]];
      const bb = X.vdot(oc, d), cc = X.vdot(oc, oc) - r * r;
      const hh = bb * bb - cc;
      if (hh < 0) return -1;
      const t = -bb - Math.sqrt(hh);
      return t >= 0 ? t : -1;
    };
    const t1 = end(a), t2 = end(b);
    if (t1 < 0) return t2;
    if (t2 < 0) return t1;
    return Math.min(t1, t2);
  };

  X.raySphere = function (o, d, c, r) {
    const oc = [o[0] - c[0], o[1] - c[1], o[2] - c[2]];
    const b = X.vdot(oc, d), cc = X.vdot(oc, oc) - r * r;
    const h = b * b - cc;
    if (h < 0) return -1;
    const t = -b - Math.sqrt(h);
    return t >= 0 ? t : (cc < 0 ? 0 : -1);
  };

  const M4 = {
    ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
    mul(a, b, o) {
      const r = o && o !== a && o !== b ? o : new Float32Array(16);
      for (let c = 0; c < 4; c++) {
        const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
        r[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
        r[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
        r[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
        r[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
      }
      if (o && (o === a || o === b)) { o.set(r); return o; }
      return r;
    },
    persp(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
    },
    ortho(l, r, b, t, n, f) {
      return new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1]);
    },
    lookAt(eye, target, up) {
      let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
      let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
      const u = up || [0, 1, 0];
      let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx;
      l = Math.hypot(xx, xy, xz);
      if (l < 1e-6) { xx = 1; xy = 0; xz = 0; l = 1; }
      xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([
        xx, yx, zx, 0,
        xy, yy, zy, 0,
        xz, yz, zz, 0,
        -(xx * eye[0] + xy * eye[1] + xz * eye[2]), -(yx * eye[0] + yy * eye[1] + yz * eye[2]), -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1
      ]);
    },
    view(eye, yaw, pitch, roll) {
      const f = X.fwd(yaw, pitch);
      let up = [0, 1, 0];
      if (roll) {
        const r = X.right(yaw);
        up = X.vnorm([Math.sin(roll) * r[0], Math.cos(roll), Math.sin(roll) * r[2]]);
      }
      return M4.lookAt(eye, [eye[0] + f[0], eye[1] + f[1], eye[2] + f[2]], up);
    },
    trs(x, y, z, yaw, pitch, roll, s) {
      const cy = Math.cos(yaw || 0), sy = Math.sin(yaw || 0);
      const cp = Math.cos(pitch || 0), sp = Math.sin(pitch || 0);
      const cr = Math.cos(roll || 0), sr = Math.sin(roll || 0);
      const k = s === undefined ? 1 : s;
      const m = new Float32Array(16);
      m[0] = (cy * cr + sy * sp * sr) * k; m[1] = cp * sr * k; m[2] = (-sy * cr + cy * sp * sr) * k;
      m[4] = (-cy * sr + sy * sp * cr) * k; m[5] = cp * cr * k; m[6] = (sy * sr + cy * sp * cr) * k;
      m[8] = sy * cp * k; m[9] = -sp * k; m[10] = cy * cp * k;
      m[12] = x; m[13] = y; m[14] = z; m[15] = 1;
      return m;
    },
    point(m, p) {
      return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
    },
    dir(m, p) {
      return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2], m[1] * p[0] + m[5] * p[1] + m[9] * p[2], m[2] * p[0] + m[6] * p[1] + m[10] * p[2]];
    },
    project(m, p) {
      const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
      const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
      const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
      if (w <= 0.001) return null;
      return [x / w, y / w, w];
    },
    frustum(m) {
      const planes = [];
      const add = (a, b, c, d) => { const l = Math.hypot(a, b, c) || 1; planes.push([a / l, b / l, c / l, d / l]); };
      add(m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]);
      add(m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
      add(m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]);
      add(m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
      add(m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]);
      add(m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);
      return planes;
    },
    boxVisible(planes, mn, mx) {
      for (const p of planes) {
        const x = p[0] > 0 ? mx[0] : mn[0], y = p[1] > 0 ? mx[1] : mn[1], z = p[2] > 0 ? mx[2] : mn[2];
        if (p[0] * x + p[1] * y + p[2] * z + p[3] < 0) return false;
      }
      return true;
    },
    sphereVisible(planes, c, r) {
      for (const p of planes) if (p[0] * c[0] + p[1] * c[1] + p[2] * c[2] + p[3] < -r) return false;
      return true;
    }
  };
  X.M4 = M4;
})(globalThis.XIII = globalThis.XIII || {});
