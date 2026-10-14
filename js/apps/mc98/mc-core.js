(function (M) {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const TAU = Math.PI * 2;
  const floor = Math.floor;

  function makeRandom(seed) {
    let state = (seed >>> 0) || 0x9e3779b9;
    const next = () => {
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.range = (a, b) => a + (b - a) * next();
    next.int = n => floor(next() * n);
    next.pick = arr => arr[floor(next() * arr.length)];
    next.chance = p => next() < p;
    return next;
  }

  function hashInt(x, y, z, seed) {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (z | 0) * 2147483647 + (seed | 0) * 1274126177;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = Math.imul(h ^ (h >>> 16), 2246822519);
    return (h ^ (h >>> 15)) >>> 0;
  }
  const hash01 = (x, y, z, seed) => hashInt(x, y, z, seed) / 4294967296;

  function seedFromString(s) {
    s = String(s == null ? '' : s).trim();
    if (s === '') return (Math.random() * 4294967296) >>> 0;
    if (/^-?\d+$/.test(s)) return (parseInt(s, 10) >>> 0);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  class Perlin {
    constructor(seed) {
      const rnd = makeRandom(seed);
      const p = new Uint8Array(512);
      const base = new Uint8Array(256);
      for (let i = 0; i < 256; i++) base[i] = i;
      for (let i = 255; i > 0; i--) { const j = rnd.int(i + 1); const t = base[i]; base[i] = base[j]; base[j] = t; }
      for (let i = 0; i < 512; i++) p[i] = base[i & 255];
      this.p = p;
    }
    static fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    static grad2(h, x, y) {
      switch (h & 7) {
        case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y;
        case 4: return x; case 5: return -x; case 6: return y; default: return -y;
      }
    }
    static grad3(h, x, y, z) {
      const u = (h & 15) < 8 ? x : y, v = (h & 15) < 4 ? y : ((h & 15) === 12 || (h & 15) === 14 ? x : z);
      return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }
    noise2(x, y) {
      const p = this.p, X = floor(x) & 255, Y = floor(y) & 255;
      x -= floor(x); y -= floor(y);
      const u = Perlin.fade(x), v = Perlin.fade(y);
      const A = p[X] + Y, B = p[X + 1] + Y;
      return lerp(lerp(Perlin.grad2(p[A], x, y), Perlin.grad2(p[B], x - 1, y), u), lerp(Perlin.grad2(p[A + 1], x, y - 1), Perlin.grad2(p[B + 1], x - 1, y - 1), u), v);
    }
    noise3(x, y, z) {
      const p = this.p, X = floor(x) & 255, Y = floor(y) & 255, Z = floor(z) & 255;
      x -= floor(x); y -= floor(y); z -= floor(z);
      const u = Perlin.fade(x), v = Perlin.fade(y), w = Perlin.fade(z);
      const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z, B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
      return lerp(
        lerp(lerp(Perlin.grad3(p[AA], x, y, z), Perlin.grad3(p[BA], x - 1, y, z), u), lerp(Perlin.grad3(p[AB], x, y - 1, z), Perlin.grad3(p[BB], x - 1, y - 1, z), u), v),
        lerp(lerp(Perlin.grad3(p[AA + 1], x, y, z - 1), Perlin.grad3(p[BA + 1], x - 1, y, z - 1), u), lerp(Perlin.grad3(p[AB + 1], x, y - 1, z - 1), Perlin.grad3(p[BB + 1], x - 1, y - 1, z - 1), u), v), w);
    }
    fbm2(x, y, oct, lac = 2, gain = 0.5) {
      let a = 1, f = 1, s = 0, n = 0;
      for (let i = 0; i < oct; i++) { s += a * this.noise2(x * f, y * f); n += a; a *= gain; f *= lac; }
      return s / n;
    }
    ridged2(x, y, oct) {
      let a = 1, f = 1, s = 0, n = 0;
      for (let i = 0; i < oct; i++) { s += a * (1 - Math.abs(this.noise2(x * f, y * f))); n += a; a *= 0.5; f *= 2; }
      return s / n;
    }
  }

  class Mat4 {
    static identity() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; }
    static perspective(fov, aspect, near, far) {
      const f = 1 / Math.tan(fov / 2), m = new Float32Array(16);
      m[0] = f / aspect; m[5] = f; m[10] = (far + near) / (near - far); m[11] = -1; m[14] = 2 * far * near / (near - far);
      return m;
    }
    static ortho(l, r, b, t, n, f) {
      const m = new Float32Array(16);
      m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n); m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1;
      return m;
    }
    static multiply(a, b) {
      const o = new Float32Array(16);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
      return o;
    }
    static translate(x, y, z) { const m = Mat4.identity(); m[12] = x; m[13] = y; m[14] = z; return m; }
    static scale(x, y, z) { const m = Mat4.identity(); m[0] = x; m[5] = y; m[10] = z; return m; }
    static rotX(a) { const m = Mat4.identity(), c = Math.cos(a), s = Math.sin(a); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; }
    static rotY(a) { const m = Mat4.identity(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; }
    static rotZ(a) { const m = Mat4.identity(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; }
    static view(x, y, z, yaw, pitch) {
      return Mat4.multiply(Mat4.multiply(Mat4.rotX(-pitch), Mat4.rotY(-yaw)), Mat4.translate(-x, -y, -z));
    }
  }

  const rgb = (r, g, b) => [clamp(r | 0, 0, 255), clamp(g | 0, 0, 255), clamp(b | 0, 0, 255)];
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const scale = (c, s) => [c[0] * s, c[1] * s, c[2] * s];

  const key3 = (x, y, z) => x + ',' + y + ',' + z;
  const formatTime = ticks => {
    const t = ((ticks % 24000) + 24000) % 24000;
    const h = floor(((t / 1000) + 6) % 24), mnt = floor((t % 1000) / 1000 * 60);
    return String(h).padStart(2, '0') + ':' + String(mnt).padStart(2, '0');
  };

  Object.assign(M, { clamp, lerp, smoothstep, TAU, makeRandom, hashInt, hash01, seedFromString, Perlin, Mat4, rgb, mix, scale, key3, formatTime });
  if (typeof module !== 'undefined') module.exports = M;
})(globalThis.Mc98 = globalThis.Mc98 || {});
