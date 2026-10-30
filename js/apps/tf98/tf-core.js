(function (T) {
  'use strict';
  T.TICK = 1 / 60;
  T.HU = 0.01905;
  T.hu = v => v * T.HU;
  T.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  T.lerp = (a, b, t) => a + (b - a) * t;

  T.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  T.hash = function (str) {
    let h = 2166136261;
    const s = String(str);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 2246822507); h ^= h >>> 16;
    return h >>> 0;
  };

  T.dir = function (yaw, pitch) {
    const cp = Math.cos(pitch);
    return { x: Math.sin(yaw) * cp, y: Math.sin(pitch), z: Math.cos(yaw) * cp };
  };

  T.aimBasis = function (yaw, pitch) {
    const f = T.dir(yaw, pitch);
    const r = { x: -Math.cos(yaw), y: 0, z: Math.sin(yaw) };
    const u = { x: -r.z * f.y, y: r.z * f.x - r.x * f.z, z: r.x * f.y };
    return { f, r, u };
  };

  T.M4 = {
    mul(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 4; r++) {
          o[c * 4 + r] = a[r] * b[c * 4] + a[r + 4] * b[c * 4 + 1] + a[r + 8] * b[c * 4 + 2] + a[r + 12] * b[c * 4 + 3];
        }
      }
      return o;
    },
    perspective(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far), m = new Float32Array(16);
      m[0] = f / aspect; m[5] = f; m[10] = (far + near) * nf; m[11] = -1; m[14] = 2 * far * near * nf;
      return m;
    },
    lookAt(ex, ey, ez, cx, cy, cz) {
      let zx = ex - cx, zy = ey - cy, zz = ez - cz;
      let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
      let xx = zz, xz = -zx;
      l = Math.hypot(xx, xz) || 1; xx /= l; xz /= l;
      const yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;
      const m = new Float32Array(16);
      m[0] = xx; m[1] = yx; m[2] = zx; m[5] = yy; m[6] = zy; m[8] = xz; m[9] = yz; m[10] = zz;
      m[12] = -(xx * ex + xz * ez); m[13] = -(yx * ex + yy * ey + yz * ez); m[14] = -(zx * ex + zy * ey + zz * ez); m[15] = 1;
      return m;
    },
    place(x, y, z, yaw, sy) {
      const m = new Float32Array(16), c = Math.cos(yaw), s = Math.sin(yaw);
      m[0] = c; m[2] = -s; m[5] = sy; m[8] = s; m[10] = c; m[12] = x; m[13] = y; m[14] = z; m[15] = 1;
      return m;
    },
    basis(b, x, y, z, sr, su, sf) {
      const m = new Float32Array(16);
      m[0] = b.r.x * sr; m[1] = b.r.y * sr; m[2] = b.r.z * sr;
      m[4] = b.u.x * su; m[5] = b.u.y * su; m[6] = b.u.z * su;
      m[8] = b.f.x * sf; m[9] = b.f.y * sf; m[10] = b.f.z * sf;
      m[12] = x; m[13] = y; m[14] = z; m[15] = 1;
      return m;
    },
    scaleAt(x, y, z, s) {
      const m = new Float32Array(16);
      m[0] = m[5] = m[10] = s; m[12] = x; m[13] = y; m[14] = z; m[15] = 1;
      return m;
    }
  };

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
