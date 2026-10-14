(function (M) {
  'use strict';
  M.TICK = 1 / 60;
  M.BT_SCALE = 0.28;
  M.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  M.lerp = (a, b, t) => a + (b - a) * t;
  M.smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  M.wrap = a => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };
  M.angDiff = (a, b) => M.wrap(b - a);
  M.turnTo = (a, b, step) => {
    const d = M.wrap(b - a);
    return Math.abs(d) <= step ? b : M.wrap(a + Math.sign(d) * step);
  };
  M.v = (x, y, z) => [x || 0, y || 0, z || 0];
  M.add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  M.sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  M.scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  M.addScaled = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
  M.dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  M.cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  M.len = a => Math.hypot(a[0], a[1], a[2]);
  M.dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  M.dist2d = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  M.norm = a => {
    const l = Math.hypot(a[0], a[1], a[2]);
    return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0];
  };
  M.mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  M.dirFromYawPitch = (yaw, pitch) => [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
  M.yawOf = (dx, dz) => Math.atan2(-dx, -dz);
  M.fwdOf = yaw => [-Math.sin(yaw), 0, -Math.cos(yaw)];
  M.rightOf = yaw => [Math.cos(yaw), 0, -Math.sin(yaw)];

  M.segBox = (p, d, min, max) => {
    let t0 = 0, t1 = 1, axis = -1, sign = 0;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-12) {
        if (p[i] < min[i] || p[i] > max[i]) return null;
        continue;
      }
      const inv = 1 / d[i];
      let a = (min[i] - p[i]) * inv, b = (max[i] - p[i]) * inv, s = -1;
      if (a > b) { const t = a; a = b; b = t; s = 1; }
      if (a > t0) { t0 = a; axis = i; sign = s; }
      if (b < t1) t1 = b;
      if (t0 > t1) return null;
    }
    if (axis < 0) return { t: 0, n: [0, 0, 0], inside: true };
    const n = [0, 0, 0];
    n[axis] = sign;
    return { t: t0, n };
  };
  M.segSphere = (p, d, c, r) => {
    const m = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    const a = M.dot(d, d);
    if (a < 1e-12) return M.dot(m, m) <= r * r ? 0 : -1;
    const b = M.dot(m, d), cc = M.dot(m, m) - r * r;
    if (cc > 0 && b > 0) return -1;
    const disc = b * b - a * cc;
    if (disc < 0) return -1;
    const t = (-b - Math.sqrt(disc)) / a;
    if (t > 1) return -1;
    return t < 0 ? 0 : t;
  };
  M.boxOverlap = (amin, amax, bmin, bmax) =>
    amin[0] < bmax[0] && amax[0] > bmin[0] && amin[1] < bmax[1] && amax[1] > bmin[1] && amin[2] < bmax[2] && amax[2] > bmin[2];
  M.pointInBox = (p, min, max, pad) => {
    pad = pad || 0;
    return p[0] >= min[0] - pad && p[0] <= max[0] + pad && p[1] >= min[1] - pad && p[1] <= max[1] + pad && p[2] >= min[2] - pad && p[2] <= max[2] + pad;
  };

  class RNG {
    constructor(seed) { this.s = (seed >>> 0) || 1; }
    next() {
      let t = (this.s += 0x6d2b79f5) >>> 0;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(a, b) { return a + (b - a) * this.next(); }
    int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
  }
  M.RNG = RNG;

  M.hash = (x, y) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  M.levels = M.levels || {};
  M.levelOrder = ['tutorial', 'prologue', 'roscoe', 'crimescene', 'bogart', 'bloodveins', 'gun', 'wings', 'brutality', 'ragnarock', 'empire'];
  M.defineLevel = def => { M.levels[def.id] = def; return def; };
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
