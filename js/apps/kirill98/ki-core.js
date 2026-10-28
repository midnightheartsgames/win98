(function (K) {
  'use strict';

  K.TITLE = 'Kirill The Game';

  K.METRICS = Object.freeze({
    heightHuman: 1.78,
    heightElf: 1.86,
    eyeStand: 1.65,
    eyeCrouch: 1.1,
    eyeChair: 1.2,
    eyeCrawl: 0.45,
    radiusBody: 0.35,
    radiusChair: 0.5,
    walk: 1.6,
    run: 4.5,
    sprint: 6.5,
    jumpHeight: 0.9,
    jumpLength: 2.6,
    step: 0.35,
    stair: 0.25,
    doorElf: 1.0,
    door: 1.2,
    doorWide: 1.4,
    trail: 2,
    road: 5,
    tract: 6,
    cart: 2.2,
    wallPalace: 10,
    wallFort: 7,
    ladder: 11,
    reach: Object.freeze({ knife: 0.8, sickle: 1.0, mace: 1.0, axe: 1.1, sword: 1.2, bardiche: 1.8, spear: 2.2 }),
    bowRange: 40,
    crossbowRange: 60
  });

  K.MAP = Object.freeze({ size: 1536, step: 3, samples: 513 });

  K.clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  K.lerp = (a, b, t) => a + (b - a) * t;

  K.rng = seed => {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  K.v3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: a => Math.hypot(a[0], a[1], a[2]),
    norm: a => {
      const l = Math.hypot(a[0], a[1], a[2]) || 1;
      return [a[0] / l, a[1] / l, a[2] / l];
    }
  };

  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ramp = (a, b, x) => {
    const t = K.clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  K.MOON = 28;
  K.moonPhase = day => ((((day || 1) - 1 + 14) % K.MOON) + K.MOON) % K.MOON / K.MOON;
  K.daylight = (hour, dayN, cloud) => {
    const h = ((hour % 24) + 24) % 24, day = h >= 6 && h <= 21;
    const phase = day ? (h - 6) / 15 : ((h - 21 + 24) % 24) / 9;
    const e = (day ? 1 : -1) * Math.sin(Math.PI * phase) * (day ? 62 : 38) * Math.PI / 180;
    const az = Math.PI * phase;
    const sunDir = [Math.cos(az) * Math.cos(e), Math.sin(e), Math.sin(az) * Math.cos(e)];
    const moonDir = [-sunDir[0], -sunDir[1], -sunDir[2]];
    const se = Math.sin(e), up = ramp(-0.08, 0.1, se), night = 1 - up, dusk = up * (1 - ramp(0.05, 0.32, se));
    const zenith = mix3(mix3([0.3, 0.47, 0.74], [0.24, 0.3, 0.5], dusk), [0.02, 0.03, 0.07], night);
    const horizon = mix3(mix3([0.72, 0.78, 0.84], [0.94, 0.62, 0.4], dusk), [0.07, 0.09, 0.15], night);
    const moon = K.moonPhase(dayN), lit = 0.5 - 0.5 * Math.cos(moon * Math.PI * 2), cover = cloud === undefined ? 0.42 : cloud;
    const nightLight = [0.2, 0.23, 0.33].map(c => c * (0.4 + 0.6 * lit)), nightAmb = [0.1, 0.11, 0.17].map(c => c * (0.75 + 0.25 * lit));
    const light = mix3(mix3([0.95, 0.9, 0.82], [0.85, 0.55, 0.34], dusk), nightLight, night).map(c => c * (1 - cover * 0.28));
    const ambient = mix3(mix3([0.42, 0.45, 0.52], [0.34, 0.3, 0.33], dusk), nightAmb, night).map(c => c * (1 + cover * 0.08));
    const sunFog = mix3([0.07, 0.06, 0.03], [0.34, 0.17, 0.05], dusk).map(c => c * up);
    return {
      hour: h, sunDir, moonDir, lightDir: night > 0.5 ? moonDir : sunDir, light, ambient,
      zenith, horizon, fogFar: 900 - 480 * night, night, dusk, moon, moonLit: lit, cloud: cover, sunFog,
      sun: mix3([1, 0.92, 0.75], [1, 0.55, 0.3], dusk).map(c => c * up)
    };
  };

  K.basis = (yaw, pitch) => {
    const cp = Math.cos(pitch);
    const fwd = [Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
    const right = [Math.cos(yaw), 0, Math.sin(yaw)];
    return { fwd, right, up: K.v3.cross(right, fwd) };
  };

  K.m4 = {
    perspective(fovY, aspect, near, far) {
      const f = 1 / Math.tan(fovY / 2), nf = 1 / (near - far);
      return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
    },
    ortho(l, r, b, t, n, f) {
      return new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1]);
    },
    lookAt(eye, at, up) {
      const z = K.v3.norm(K.v3.sub(eye, at));
      const x = K.v3.norm(K.v3.cross(up, z));
      const y = K.v3.cross(z, x);
      return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -K.v3.dot(x, eye), -K.v3.dot(y, eye), -K.v3.dot(z, eye), 1]);
    },
    multiply(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 4; r++) {
          o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
        }
      }
      return o;
    },
    transform(m, v) {
      return [0, 1, 2, 3].map(r => m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * v[3]);
    }
  };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
