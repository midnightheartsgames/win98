(function (T) {
  'use strict';
  const FPS = 60;
  const DT = 1 / FPS;
  const TAU = Math.PI * 2;

  const IN = { U: 1, D: 2, B: 4, F: 8, P1: 16, P2: 32, K3: 64, K4: 128, START: 256 };
  const BTN = IN.P1 | IN.P2 | IN.K3 | IN.K4;
  const DIRS = IN.U | IN.D | IN.B | IN.F;

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const wrapAngle = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  const lerpAngle = (a, b, t) => a + wrapAngle(b - a) * t;
  const approach = (v, target, step) => v < target ? Math.min(target, v + step) : Math.max(target, v - step);

  const EASE = {
    lin: t => t,
    in: t => t * t,
    out: t => 1 - (1 - t) * (1 - t),
    io: t => smooth(t),
    snap: t => 1 - Math.pow(1 - t, 3),
    back: t => { const s = 1.7; const u = t - 1; return 1 + u * u * ((s + 1) * u + s); },
    hold: t => t < 1 ? 0 : 1
  };

  const v3 = (x, y, z) => [x || 0, y || 0, z || 0];
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const vscale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlen = a => Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  const vnorm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vlerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const vmad = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];

  const M_ID = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const mmul = (a, b) => [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
  ];
  const mvec = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
  const mtvec = (m, v) => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 1, 0, s, 0, c]; };
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const rotYPR = (yaw, pitch, roll) => mmul(mmul(rotY(yaw || 0), rotZ(-(pitch || 0))), rotX(roll || 0));
  const mcol = (m, i) => [m[i], m[3 + i], m[6 + i]];

  class RNG {
    constructor(seed) { this.s = (seed >>> 0) || 1; }
    next() {
      let t = (this.s = (this.s + 0x6D2B79F5) >>> 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(a, b) { return a + (b - a) * this.next(); }
    int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
    weighted(items, wf) {
      let sum = 0;
      for (const it of items) sum += Math.max(0, wf(it));
      if (sum <= 0) return null;
      let r = this.next() * sum;
      for (const it of items) { r -= Math.max(0, wf(it)); if (r <= 0) return it; }
      return items[items.length - 1];
    }
  }

  const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  const rgb = hex => {
    const n = parseInt(hex.slice(1), 16);
    if (hex.length === 4) return [((n >> 8) & 15) / 15, ((n >> 4) & 15) / 15, (n & 15) / 15];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const shade = (c, k) => [clamp(c[0] * k, 0, 1), clamp(c[1] * k, 0, 1), clamp(c[2] * k, 0, 1)];
  const css = (c, a) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a === undefined ? 1 : a})`;

  const fmtTime = frames => {
    const cs = Math.floor(frames * 100 / FPS);
    const m = Math.floor(cs / 6000), s = Math.floor(cs / 100) % 60, c = cs % 100;
    return `${m}'${String(s).padStart(2, '0')}"${String(c).padStart(2, '0')}`;
  };

  Object.assign(T, {
    FPS, DT, TAU, IN, BTN, DIRS, clamp, lerp, smooth, wrapAngle, lerpAngle, approach, EASE,
    v3, vadd, vsub, vscale, vdot, vcross, vlen, vnorm, vlerp, vmad,
    M_ID, mmul, mvec, mtvec, rotY, rotZ, rotX, rotYPR, mcol, RNG, hashStr, rgb, mixc, shade, css, fmtTime
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
