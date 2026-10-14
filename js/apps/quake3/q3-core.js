(function (Q) {
  'use strict';
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  Q.TAU = TAU;
  Q.DEG = DEG;
  Q.TICK = 1 / 60;
  Q.GRAVITY = 800;
  Q.STEPSIZE = 18;
  Q.JUMP_VELOCITY = 270;
  Q.MIN_WALK_NORMAL = 0.7;
  Q.OVERCLIP = 1.001;
  Q.PLAYER_MINS = [-15, -15, -24];
  Q.PLAYER_MAXS = [15, 15, 32];
  Q.CROUCH_MAXZ = 16;
  Q.DEAD_MAXZ = -8;
  Q.VIEWHEIGHT = 26;
  Q.CROUCH_VIEWHEIGHT = 12;
  Q.DEAD_VIEWHEIGHT = -16;

  Q.CONTENTS = { SOLID: 1, LAVA: 8, SLIME: 16, PLAYERCLIP: 0x10000, BODY: 0x2000000 };
  Q.MASK_PLAYER = 1 | 0x10000;
  Q.MASK_SHOT = 1;
  Q.MASK_OPAQUE = 1;
  Q.MASK_LIQUID = 8 | 16;

  Q.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  Q.lerp = (a, b, t) => a + (b - a) * t;
  Q.smooth = t => t * t * (3 - 2 * t);

  Q.v3 = (x, y, z) => [x || 0, y || 0, z || 0];
  Q.vcopy = a => [a[0], a[1], a[2]];
  Q.vset = (o, a) => { o[0] = a[0]; o[1] = a[1]; o[2] = a[2]; return o; };
  Q.vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  Q.vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  Q.vscale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  Q.vma = (a, s, b) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
  Q.vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  Q.vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  Q.vlen = a => Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  Q.vlen2 = a => Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  Q.vdist = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  Q.vdist2 = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
  Q.vlerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  Q.vnorm = a => {
    const l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0];
  };

  Q.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    const next = function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.crandom = () => next() * 2 - 1;
    next.int = n => Math.floor(next() * n);
    next.pick = arr => arr[Math.floor(next() * arr.length)];
    next.state = () => s;
    return next;
  };

  Q.hash = function (str) {
    let h = 2166136261;
    const s = String(str);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 2246822507); h ^= h >>> 16;
    return h >>> 0;
  };

  Q.angDiff = function (a, b) {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU;
    return d;
  };
  Q.wrapAng = a => { a %= TAU; if (a > Math.PI) a -= TAU; else if (a < -Math.PI) a += TAU; return a; };
  Q.quantAng = a => {
    const s = Math.round(a / TAU * 65536) & 0xffff;
    return (s >= 32768 ? s - 65536 : s) * TAU / 65536;
  };
  Q.angToShort = a => Math.round(a / TAU * 65536) & 0xffff;
  Q.shortToAng = s => (s >= 32768 ? s - 65536 : s) * TAU / 65536;

  Q.angleVectors = function (yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const fwd = [cp * cy, cp * sy, -sp];
    const right = [sy, -cy, 0];
    const up = [sp * cy, sp * sy, cp];
    return { fwd, right, up };
  };
  Q.vecToAngles = function (d) {
    const yaw = Math.atan2(d[1], d[0]);
    const pitch = -Math.atan2(d[2], Math.sqrt(d[0] * d[0] + d[1] * d[1]));
    return { yaw, pitch };
  };

  Q.boxOverlap = (amin, amax, bmin, bmax) =>
    amin[0] <= bmax[0] && amax[0] >= bmin[0] && amin[1] <= bmax[1] && amax[1] >= bmin[1] && amin[2] <= bmax[2] && amax[2] >= bmin[2];

  Q.rayBox = function (start, dir, len, bmin, bmax) {
    let t0 = 0, t1 = len;
    for (let i = 0; i < 3; i++) {
      const d = dir[i];
      if (Math.abs(d) < 1e-12) {
        if (start[i] < bmin[i] || start[i] > bmax[i]) return -1;
        continue;
      }
      let a = (bmin[i] - start[i]) / d, b = (bmax[i] - start[i]) / d;
      if (a > b) { const t = a; a = b; b = t; }
      if (a > t0) t0 = a;
      if (b < t1) t1 = b;
      if (t0 > t1) return -1;
    }
    return t0;
  };

  const M4 = {
    ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
    mul(a, b, o) {
      o = o || new Float32Array(16);
      const r = new Float32Array(16);
      for (let c = 0; c < 4; c++) {
        for (let rr = 0; rr < 4; rr++) {
          r[c * 4 + rr] = a[rr] * b[c * 4] + a[4 + rr] * b[c * 4 + 1] + a[8 + rr] * b[c * 4 + 2] + a[12 + rr] * b[c * 4 + 3];
        }
      }
      o.set(r);
      return o;
    },
    persp(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
    },
    ortho(l, r, b, t, n, f) {
      return new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1]);
    },
    fromBasis(origin, fwd, left, up) {
      return new Float32Array([fwd[0], fwd[1], fwd[2], 0, left[0], left[1], left[2], 0, up[0], up[1], up[2], 0, origin[0], origin[1], origin[2], 1]);
    },
    view(eye, yaw, pitch, roll) {
      const { fwd, right, up } = Q.angleVectors(yaw, pitch);
      let r = right, u = up;
      if (roll) {
        const c = Math.cos(roll), s = Math.sin(roll);
        r = [right[0] * c + up[0] * s, right[1] * c + up[1] * s, right[2] * c + up[2] * s];
        u = [up[0] * c - right[0] * s, up[1] * c - right[1] * s, up[2] * c - right[2] * s];
      }
      const b = [-fwd[0], -fwd[1], -fwd[2]];
      return new Float32Array([
        r[0], u[0], b[0], 0,
        r[1], u[1], b[1], 0,
        r[2], u[2], b[2], 0,
        -Q.vdot(r, eye), -Q.vdot(u, eye), -Q.vdot(b, eye), 1
      ]);
    },
    translate(m, x, y, z) {
      const t = M4.ident();
      t[12] = x; t[13] = y; t[14] = z;
      return M4.mul(m, t);
    },
    rotX(m, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return M4.mul(m, new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]));
    },
    rotY(m, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return M4.mul(m, new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]));
    },
    rotZ(m, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return M4.mul(m, new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
    },
    scale(m, x, y, z) {
      return M4.mul(m, new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]));
    },
    point(m, p) {
      return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
    },
    dir(m, p) {
      return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2], m[1] * p[0] + m[5] * p[1] + m[9] * p[2], m[2] * p[0] + m[6] * p[1] + m[10] * p[2]];
    }
  };
  Q.M4 = M4;

  Q.fmtTime = function (sec) {
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  };
  Q.place = function (n) {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
