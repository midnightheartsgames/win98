(function (H) {
  'use strict';

  H.TICK = 1 / 60;
  H.GRAVITY = 16;
  H.CELL = 2;

  H.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  H.lerp = (a, b, t) => a + (b - a) * t;
  H.approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
  H.wrapAngle = a => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };
  H.turnTo = (a, target, step) => {
    const d = H.wrapAngle(target - a);
    return Math.abs(d) <= step ? target : H.wrapAngle(a + Math.sign(d) * step);
  };
  H.dist2 = (a, b) => {
    const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz;
  };
  H.dist = (a, b) => Math.sqrt(H.dist2(a, b));
  H.distXZ = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  H.yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
  H.v = (x = 0, y = 0, z = 0) => ({ x, y, z });
  H.vcopy = a => ({ x: a.x, y: a.y, z: a.z });
  H.vadd = (a, b, s = 1) => ({ x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s });
  H.vsub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  H.vscale = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s });
  H.vlen = a => Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  H.vnorm = a => {
    const l = H.vlen(a) || 1;
    return { x: a.x / l, y: a.y / l, z: a.z / l };
  };
  H.vdot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  H.vcross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
  H.forward = (yaw, pitch = 0) => {
    const c = Math.cos(pitch);
    return { x: Math.sin(yaw) * c, y: Math.sin(pitch), z: Math.cos(yaw) * c };
  };
  H.rightOf = yaw => ({ x: -Math.cos(yaw), y: 0, z: Math.sin(yaw) });

  H.rng = seed => {
    let s = seed >>> 0 || 1;
    const f = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (a, b) => a + (b - a) * f();
    f.int = (a, b) => Math.floor(a + (b - a + 1) * f());
    f.pick = arr => arr[Math.floor(f() * arr.length)];
    return f;
  };

  H.hash2 = (x, y) => {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  const M4 = {
    identity() {
      const m = new Float32Array(16);
      m[0] = m[5] = m[10] = m[15] = 1;
      return m;
    },
    perspective(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far), m = new Float32Array(16);
      m[0] = f / aspect; m[5] = f; m[10] = (far + near) * nf; m[11] = -1; m[14] = 2 * far * near * nf;
      return m;
    },
    lookAt(eye, target, up) {
      let zx = eye.x - target.x, zy = eye.y - target.y, zz = eye.z - target.z;
      let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
      let xx = up.y * zz - up.z * zy, xy = up.z * zx - up.x * zz, xz = up.x * zy - up.y * zx;
      l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      const m = new Float32Array(16);
      m[0] = xx; m[1] = yx; m[2] = zx;
      m[4] = xy; m[5] = yy; m[6] = zy;
      m[8] = xz; m[9] = yz; m[10] = zz;
      m[12] = -(xx * eye.x + xy * eye.y + xz * eye.z);
      m[13] = -(yx * eye.x + yy * eye.y + yz * eye.z);
      m[14] = -(zx * eye.x + zy * eye.y + zz * eye.z);
      m[15] = 1;
      return m;
    },
    mul(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 4; r++) {
          o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
        }
      }
      return o;
    },
    trs(x, y, z, yaw, pitch, roll, sx = 1, sy = 1, sz = 1) {
      const cy = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
      const m = new Float32Array(16);
      m[0] = (cy * cr - syw * sp * sr) * sx; m[1] = (cp * sr) * sx; m[2] = (-syw * cr - cy * sp * sr) * sx;
      m[4] = (-cy * sr - syw * sp * cr) * sy; m[5] = (cp * cr) * sy; m[6] = (syw * sr - cy * sp * cr) * sy;
      m[8] = (syw * cp) * sz; m[9] = sp * sz; m[10] = (cy * cp) * sz;
      m[12] = x; m[13] = y; m[14] = z; m[15] = 1;
      return m;
    },
    point(m, x, y, z) {
      return {
        x: m[0] * x + m[4] * y + m[8] * z + m[12],
        y: m[1] * x + m[5] * y + m[9] * z + m[13],
        z: m[2] * x + m[6] * y + m[10] * z + m[14]
      };
    },
    dir(m, x, y, z) {
      return { x: m[0] * x + m[4] * y + m[8] * z, y: m[1] * x + m[5] * y + m[9] * z, z: m[2] * x + m[6] * y + m[10] * z };
    }
  };
  H.M4 = M4;

  class Heap {
    constructor() { this.items = []; this.keys = []; }
    get size() { return this.items.length; }
    push(item, key) {
      const it = this.items, ks = this.keys;
      let i = it.length;
      it.push(item); ks.push(key);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (ks[p] <= key) break;
        it[i] = it[p]; ks[i] = ks[p];
        i = p;
      }
      it[i] = item; ks[i] = key;
    }
    pop() {
      const it = this.items, ks = this.keys, top = it[0];
      const lastI = it.pop(), lastK = ks.pop();
      if (it.length) {
        let i = 0;
        const n = it.length;
        for (;;) {
          let c = i * 2 + 1;
          if (c >= n) break;
          if (c + 1 < n && ks[c + 1] < ks[c]) c++;
          if (ks[c] >= lastK) break;
          it[i] = it[c]; ks[i] = ks[c];
          i = c;
        }
        it[i] = lastI; ks[i] = lastK;
      }
      return top;
    }
  }
  H.Heap = Heap;

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
