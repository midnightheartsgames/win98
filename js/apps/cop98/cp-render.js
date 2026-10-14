(function (C) {
  'use strict';
  const { clamp, lerp } = C;
  const FAR_Z = 1e9;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const BAYER4 = BAYER.map(v => (v + 0.5) / 16);
  const VL = new Float32Array(7), VR = new Float32Array(7);
  const VTEX = (() => { const t = new Float32Array(64 * 64); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) t[y * 64 + x] = C.valueNoise(x / 4, y / 4, 77) * 0.6 + C.hash01(x, y, 78) * 0.4; return t; })();
  const vt = (a, b) => VTEX[((b | 0) & 63) * 64 + ((a | 0) & 63)];
  function viewTex(mat, x, y, z) {
    if (mat === 1) { const g = Math.sin(z * 420 + vt(x * 26, z * 60 + y * 30) * 6); return 0.84 + 0.1 * g + 0.1 * vt(x * 9, z * 9 + 17); }
    if (mat === 2) return 0.9 + 0.12 * vt(x * 520, (z + y) * 70);
    if (mat === 3) return 0.86 + 0.16 * vt(x * 150, (z + y) * 150);
    return 0.93 + 0.08 * vt(x * 700, (z + y) * 700);
  }

  function makeGrain(size, seed) {
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const n = C.fbm(x / 3.3, y / 3.3, seed, 3), m = C.hash01(x, y, seed + 5);
      out[y * size + x] = 0.8 + n * 0.3 + (m - 0.5) * 0.14;
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const a = out[y * size + x], b = out[y * size + ((x + 1) & (size - 1))], c = out[((y + 1) & (size - 1)) * size + x];
      out[y * size + x] = (a * 2 + b + c) / 4;
    }
    return out;
  }

  function makeRipples(size, seed) {
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const a = Math.sin((x / size) * C.TAU * 3 + C.fbm(x / 8, y / 8, seed, 2) * 6) * 0.5 + 0.5;
      const b = Math.sin((y / size) * C.TAU * 2 + C.fbm(x / 6 + 9, y / 6, seed + 1, 2) * 5) * 0.5 + 0.5;
      out[y * size + x] = 0.82 + (a * b) * 0.32;
    }
    return out;
  }

  function makeRings(size, frames, seed) {
    const out = new Float32Array(size * size * frames), cell = 8, cells = size / cell;
    for (let cy = 0; cy < cells; cy++) for (let cx = 0; cx < cells; cx++) {
      const ph = C.hash01(cx, cy, seed), ox = 2 + C.hash01(cx, cy, seed + 1) * 4, oy = 2 + C.hash01(cx, cy, seed + 2) * 4;
      for (let f = 0; f < frames; f++) {
        const age = (f / frames + ph) % 1, rad = 0.4 + age * 3.6, k = (1 - age) * (1 - age);
        for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) {
          const band = 1 - Math.abs(Math.hypot(x + 0.5 - ox, y + 0.5 - oy) - rad) / 0.9;
          if (band > 0) out[f * size * size + (cy * cell + y) * size + cx * cell + x] += band * k;
        }
      }
    }
    return out;
  }

  const PUDDLE_MAT = [0.25, 0.35, 0.15, 1, 1, 0, 0.05, 0.75, 0.2, 0.6, 0];
  function makePuddles(T) {
    const N = T.size, Hm = T.height, mat = T.mat, out = new Uint8Array(N * N);
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      const i = y * N + x;
      if (Hm[i] < 0.05) continue;
      const m = mat[i], mf = m >= 100 ? 0.55 : PUDDLE_MAT[m] || 0;
      if (!mf) continue;
      const flat = 1 - (Math.abs(Hm[i + 1] - Hm[i - 1]) + Math.abs(Hm[i + N] - Hm[i - N])) / 0.16;
      if (flat <= 0) continue;
      const n = C.valueNoise(x / 5.5, y / 5.5, 612) * 0.7 + C.valueNoise(x / 1.7, y / 1.7, 613) * 0.3;
      if (n > 0.38) out[i] = Math.min(255, flat * mf * (n - 0.38) / 0.62 * 420) | 0;
    }
    return out;
  }

  class Renderer {
    constructor(w, h) {
      this.grain = makeGrain(64, 7);
      this.ripples = makeRipples(64, 9);
      this.rings = makeRings(64, 8, 21);
      this.stats = { tris: 0, sprites: 0, samples: 0 };
      this.dither = true;
      this.textures = [];
      this.fogTab = new Float32Array(2048);
      this.setSize(w, h);
    }

    setSize(w, h) {
      this.W = w; this.H = h;
      this.fb = new Uint32Array(w * h);
      this.zb = new Float32Array(w * h);
      this.rayLen = new Float32Array(w * h);
      this.rayLenFocal = 0;
    }

    setupCamera(cam) {
      const W = this.W, H = this.H;
      this.cam = cam;
      this.cx = cam.x; this.cy = cam.y; this.cz = cam.z;
      this.fx = Math.cos(cam.yaw); this.fy = Math.sin(cam.yaw);
      this.rx = Math.sin(cam.yaw); this.ry = -Math.cos(cam.yaw);
      let pitch = clamp(cam.pitch, -1.5, 1.5);
      if (Math.abs(pitch) < 1e-4) pitch = -1e-4;
      this.sinP = Math.sin(pitch); this.cosP = Math.cos(pitch);
      this.focal = (W / 2) / Math.tan(cam.fov / 2);
      this.halfW = W / 2; this.halfH = H / 2;
      const edgeFwd = this.cosP - Math.abs(this.sinP) * this.halfH / this.focal;
      this.hHalf = edgeFwd > 0.02 ? Math.atan(this.halfW / this.focal / edgeFwd) : Math.PI;
      if (this.rayLenFocal !== this.focal) this.buildRayLen();
    }

    buildRayLen() {
      const W = this.W, H = this.H, f = this.focal, rl = this.rayLen;
      for (let y = 0, i = 0; y < H; y++) {
        const b = (H / 2 - y - 0.5) / f, b2 = 1 + b * b;
        for (let x = 0; x < W; x++, i++) { const a = (x + 0.5 - W / 2) / f; rl[i] = Math.sqrt(b2 + a * a); }
      }
      this.rayLenFocal = f;
    }

    setupEnv(env) {
      this.env = env;
      const far = env.fogEnd, start = env.fogStart;
      this.far = far;
      for (let i = 0; i < 2048; i++) {
        const z = i * 0.25;
        const t = clamp((z - start) / (far - start), 0, 1);
        this.fogTab[i] = t * t * (3 - 2 * t) * env.fogMax;
      }
      this.fogR = C.red(env.fogColor); this.fogG = C.green(env.fogColor); this.fogB = C.blue(env.fogColor);
      this.lr = env.light[0]; this.lg = env.light[1]; this.lb = env.light[2];
      this.wetK = 1 - (env.wet || 0) * 0.22;
    }

    puddlesFor(T) {
      if (this.puddleOf !== T) { this.puddleOf = T; this.puddles = T.puddles || (T.puddles = makePuddles(T)); }
      return this.puddles;
    }

    fogAt(z) { const i = (z * 4) | 0; return i < 2048 ? this.fogTab[i] : this.env.fogMax; }

    project(x, y, z) {
      const dx = x - this.cx, dy = y - this.cy, dz = z - this.cz;
      const h = dx * this.fx + dy * this.fy;
      const zc = h * this.cosP + dz * this.sinP;
      if (zc < 0.05) return null;
      const xc = dx * this.rx + dy * this.ry, yc = dz * this.cosP - h * this.sinP;
      return { sx: this.halfW + xc / zc * this.focal, sy: this.halfH - yc / zc * this.focal, z: zc };
    }

    glow(sx, sy, z, radius, color, strength) {
      const W = this.W, H = this.H, fb = this.fb, zb = this.zb;
      const r0 = C.red(color), g0 = C.green(color), b0 = C.blue(color);
      const x0 = Math.max(0, Math.floor(sx - radius)), x1 = Math.min(W - 1, Math.ceil(sx + radius));
      const y0 = Math.max(0, Math.floor(sy - radius)), y1 = Math.min(H - 1, Math.ceil(sy + radius));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * W + x;
        if (zb[i] < z) continue;
        const d = Math.hypot(x + 0.5 - sx, y + 0.5 - sy) / radius;
        if (d >= 1) continue;
        const k = (1 - d) * (1 - d) * strength;
        const c = fb[i];
        fb[i] = 0xff000000 | (Math.min(255, ((c >>> 16) & 255) + b0 * k) << 16) | (Math.min(255, ((c >>> 8) & 255) + g0 * k) << 8) | Math.min(255, (c & 255) + r0 * k);
      }
    }

    renderTerrain(T) {
      const W = this.W, H = this.H, vx = W / 2, vy = H / 2 - this.focal * this.cosP / this.sinP;
      const corners = [0, 0, W, 0, 0, H, W, H];
      let reach = 0, a0 = -Math.PI, a1 = Math.PI;
      for (let k = 0; k < 8; k += 2) reach = Math.max(reach, Math.hypot(corners[k] - vx, corners[k + 1] - vy));
      if (vx < 0 || vx > W || vy < 0 || vy > H) {
        const base = Math.atan2(H / 2 - vy, W / 2 - vx);
        let lo = Infinity, hi = -Infinity;
        for (let k = 0; k < 8; k += 2) {
          const r = C.wrapAngle(Math.atan2(corners[k + 1] - vy, corners[k] - vx) - base);
          lo = Math.min(lo, r); hi = Math.max(hi, r);
        }
        a0 = base + lo; a1 = base + hi;
      }
      if (this.peakOf !== T) { this.peakOf = T; this.peak = T.height.reduce((m, h) => h > m ? h : m, 0); }
      this.stats.samples = 0;
      for (let al = a0, k = 0; ; k++) {
        const dx = Math.cos(al), dy = Math.sin(al);
        this.renderTerrainLine(T, vx, vy, dx, dy, k ? reach / 2 ** (32 - Math.clz32(k & -k)) : 0);
        if (al >= a1) break;
        al = Math.min(a1, al + 0.98 * Math.max(Math.abs(dx), Math.abs(dy)) / reach);
      }
    }

    renderTerrainLine(T, vx, vy, dx, dy, skipNear) {
      const W = this.W, H = this.H;
      let t0 = 0, t1 = Infinity;
      if (Math.abs(dx) > 1e-12) { const ta = -vx / dx, tb = (W - vx) / dx; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb)); } else if (vx < 0 || vx > W) return;
      if (Math.abs(dy) > 1e-12) { const ta = -vy / dy, tb = (H - vy) / dy; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb)); } else if (vy < 0 || vy > H) return;
      if (t1 <= t0) return;
      const vert = Math.abs(dy) >= Math.abs(dx);
      const major = vert ? dy : dx, orgMaj = vert ? vy : vx, orgMin = vert ? vx : vy, slope = vert ? dx / dy : dy / dx;
      const majLim = vert ? H : W, minLim = vert ? W : H, majStride = vert ? W : 1, minStride = vert ? 1 : W;
      const mA = orgMaj + t0 * major, mB = orgMaj + t1 * major;
      const pLo = Math.max(0, Math.ceil(Math.min(mA, mB) - 0.5)), pHi = Math.min(majLim - 1, Math.floor(Math.max(mA, mB) - 0.5));
      if (pHi < pLo) return;
      const sp = this.sinP, cp = this.cosP, lookUp = sp > 0;
      const dir = (major > 0) !== lookUp ? 1 : -1;
      let end = dir > 0 ? pHi : pLo, front = dir > 0 ? pLo : pHi;
      const minStep = slope * dir;
      if (skipNear > 0) {
        const edge = orgMaj + skipNear * major - 0.5;
        if (lookUp) end = dir > 0 ? Math.min(end, Math.floor(edge)) : Math.max(end, Math.ceil(edge));
        else front = dir > 0 ? Math.max(front, Math.ceil(edge)) : Math.min(front, Math.floor(edge));
        if (dir > 0 ? front > end : front < end) return;
      }
      const phi = Math.atan2(dx / Math.abs(sp), lookUp ? dy : -dy), gs = Math.sin(phi), gc = Math.cos(phi);
      const gx = gc * this.fx + gs * this.rx, gy = gc * this.fy + gs * this.ry;
      const gyc = -gc * sp, gzc = gc * cp;
      const fb = this.fb, zb = this.zb, N = T.size, Hm = T.height, Cm = T.color, grain = this.grain, rip = this.ripples;
      const focal = this.focal, halfMaj = vert ? H / 2 : W / 2, cx = this.cx, cy = this.cy, cz = this.cz;
      const far = this.far, fogTab = this.fogTab, fogMax = this.env.fogMax, fr = this.fogR, fg = this.fogG, fbb = this.fogB;
      const lr = this.lr, lg = this.lg, lb = this.lb;
      const env = this.env, t = env.time || 0;
      const wr = C.red(env.waterColor), wg = C.green(env.waterColor), wb = C.blue(env.waterColor);
      const sr = C.red(env.skyHorizon), sg = C.green(env.skyHorizon), sb = C.blue(env.skyHorizon);
      const ripShiftX = (t * 1.3) % 64, ripShiftY = (t * 0.7) % 64;
      const wet = env.wet || 0, rainK = env.rain || 0, rings = this.rings, ringOff = (((t * 9) | 0) & 7) << 12;
      const puddles = wet > 0.02 ? this.puddlesFor(T) : null, pudThr = 255 * (1 - wet * 0.9), wetDark = 1 - wet * 0.3;
      const nearStep = 0.025 - 0.012 * clamp(-sp, 0, 1), peakRise = this.peak - cz;
      const Nm = N - 1.001;
      let samples = 0, lastDepth = 0.05, steps = 0, slopeAt = front, frontSlope = this.lineSlopeAt(front, vert, orgMaj, orgMin, slope);
      for (let z = 0.05; z < far; z += nearStep + z * 0.011) {
        if ((++steps & 7) === 0) {
          if (slopeAt !== front) { slopeAt = front; frontSlope = this.lineSlopeAt(front, vert, orgMaj, orgMin, slope); }
          if (frontSlope > 0 && peakRise < z * frontSlope) break;
        }
        let px = cx + gx * z, py = cy + gy * z;
        if (px < 0) px = 0; else if (px > Nm) px = Nm;
        if (py < 0) py = 0; else if (py > Nm) py = Nm;
        const ix = px | 0, iy = py | 0, ci = iy * N + ix;
        let h;
        if (z < 70) {
          const u = px - ix, v = py - iy;
          const a = Hm[ci], b = Hm[ci + 1], c = Hm[ci + N], d = Hm[ci + N + 1];
          h = a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
        } else h = Hm[ci];
        const water = h < 0;
        const rise = (water ? 0 : h) - cz;
        const depth = z * gzc + rise * sp;
        let target;
        if (depth <= 0.02) {
          if (lookUp) continue;
          target = end;
        } else {
          const m = vert ? halfMaj - focal * (z * gyc + rise * cp) / depth : halfMaj + focal * z * gs / depth;
          target = dir > 0 ? Math.min(end, Math.floor(m - 0.5)) : Math.max(end, Math.ceil(m - 0.5));
          lastDepth = depth;
        }
        if (dir > 0 ? target >= front : target <= front) {
          samples++;
          const col0 = Cm[ci];
          let r = col0 & 255, g = (col0 >>> 8) & 255, b = (col0 >>> 16) & 255;
          if (z < 40) {
            const u = px - ix, v = py - iy, c1 = Cm[ci + 1], c2 = Cm[ci + N], c3 = Cm[ci + N + 1];
            const w0 = (1 - u) * (1 - v), w1 = u * (1 - v), w2 = (1 - u) * v, w3 = u * v;
            r = r * w0 + (c1 & 255) * w1 + (c2 & 255) * w2 + (c3 & 255) * w3;
            g = g * w0 + ((c1 >>> 8) & 255) * w1 + ((c2 >>> 8) & 255) * w2 + ((c3 >>> 8) & 255) * w3;
            b = b * w0 + ((c1 >>> 16) & 255) * w1 + ((c2 >>> 16) & 255) * w2 + ((c3 >>> 16) & 255) * w3;
          }
          if (z < 34) {
            const gk = grain[((py * 4) & 63) * 64 + ((px * 4) & 63)];
            r *= gk; g *= gk; b *= gk;
          }
          if (water) {
            const glance = clamp(cz / z, 0, 1);
            const refl = clamp(1 - glance * 2.2, 0.15, 0.8);
            const rp = rip[((((py * 1.6 + ripShiftY) | 0) & 63) << 6) + (((px * 1.6 + ripShiftX) | 0) & 63)];
            const deepK = clamp(-h / 0.9, 0.25, 1), rk = refl * 0.55 * (1 - rainK * 0.35);
            let wR = lerp(r * 0.55, wr, deepK), wG = lerp(g * 0.55, wg, deepK), wB = lerp(b * 0.55, wb, deepK);
            wR = lerp(wR, sr / (lr + 0.001) * 0.9, rk) * rp;
            wG = lerp(wG, sg / (lg + 0.001) * 0.9, rk) * rp;
            wB = lerp(wB, sb / (lb + 0.001) * 0.9, rk) * rp;
            if (rainK > 0 && z < 45) {
              const ring = rings[ringOff + ((((py * 6) | 0) & 63) << 6) + (((px * 6) | 0) & 63)] * rainK * (1 - z / 45);
              wR += 70 * ring; wG += 74 * ring; wB += 80 * ring;
            }
            r = wR; g = wG; b = wB;
          } else if (puddles) {
            r *= wetDark; g *= wetDark; b *= wetDark;
            const cap = z < 70 ? puddles[ci] : 0;
            if (cap > pudThr) {
              const pk = Math.min(1, (cap - pudThr) / 50) * 0.9, rp2 = rip[((((py * 2.3 + ripShiftY) | 0) & 63) << 6) + (((px * 2.3 + ripShiftX) | 0) & 63)];
              let pR = lerp(r * 0.5, sr / (lr + 0.001) * 0.82, 0.7) * rp2, pG = lerp(g * 0.5, sg / (lg + 0.001) * 0.82, 0.7) * rp2, pB = lerp(b * 0.5, sb / (lb + 0.001) * 0.82, 0.7) * rp2;
              if (rainK > 0 && z < 40) {
                const ring = rings[ringOff + ((((py * 7) | 0) & 63) << 6) + (((px * 7) | 0) & 63)] * rainK;
                pR += 80 * ring; pG += 84 * ring; pB += 90 * ring;
              }
              r += (pR - r) * pk; g += (pG - g) * pk; b += (pB - b) * pk;
            }
          }
          r *= lr; g *= lg; b *= lb;
          const fi = (Math.sqrt(z * z + rise * rise) * 4) | 0, f = fi < 2048 ? fogTab[fi] : fogMax;
          r += (fr - r) * f; g += (fg - g) * f; b += (fbb - b) * f;
          const pix = 0xff000000 | ((b > 255 ? 255 : b | 0) << 16) | ((g > 255 ? 255 : g | 0) << 8) | (r > 255 ? 255 : r | 0);
          for (let p = front, mn = orgMin + (front + 0.5 - orgMaj) * slope; ; p += dir, mn += minStep) {
            const i = p * majStride + (mn < 0 ? 0 : mn >= minLim ? minLim - 1 : mn | 0) * minStride;
            if (lastDepth < zb[i]) { fb[i] = pix; zb[i] = lastDepth; }
            if (p === target) break;
          }
          front = target + dir;
          if (dir > 0 ? front > end : front < end) break;
        }
      }
      this.stats.samples += samples;
    }

    lineSlopeAt(p, vert, orgMaj, orgMin, slope) {
      const mn = orgMin + (p + 0.5 - orgMaj) * slope, x = vert ? mn : p + 0.5, y = vert ? p + 0.5 : mn;
      const a = (x - this.halfW) / this.focal, b = (this.halfH - y) / this.focal, fwd = this.cosP - b * this.sinP;
      return (this.sinP + b * this.cosP) / Math.sqrt(fwd * fwd + a * a);
    }

    clear() {
      this.fb.fill(0xff000000);
      this.zb.fill(FAR_Z);
      this.stats.tris = 0; this.stats.sprites = 0;
    }

    renderMeshes(bins, cellSize, gridN) {
      const far = this.far + 20;
      const cellR = cellSize * 0.75;
      const cx = this.cx, cy = this.cy;
      const cos = Math.cos(Math.min(Math.PI, this.hHalf + 0.35));
      const c0x = Math.max(0, Math.floor((cx - far) / cellSize)), c1x = Math.min(gridN - 1, Math.floor((cx + far) / cellSize));
      const c0y = Math.max(0, Math.floor((cy - far) / cellSize)), c1y = Math.min(gridN - 1, Math.floor((cy + far) / cellSize));
      for (let gy = c0y; gy <= c1y; gy++) for (let gx = c0x; gx <= c1x; gx++) {
        const bin = bins[gy * gridN + gx];
        if (!bin || !bin.count) continue;
        const mx = (gx + 0.5) * cellSize - cx, my = (gy + 0.5) * cellSize - cy, d = Math.hypot(mx, my);
        if (d > far + cellR) continue;
        if (d > cellR * 1.5 && (mx * this.fx + my * this.fy) / d < cos - cellR / d * 1.2) continue;
        this.drawTriangles(bin.data, bin.count);
      }
    }

    drawTriangles(data, count) {
      const cx = this.cx, cy = this.cy, cz = this.cz, fx = this.fx, fy = this.fy, rx = this.rx, ry = this.ry, sp = this.sinP, cp = this.cosP;
      const poly = this._poly || (this._poly = new Float32Array(8 * 5));
      const clip = this._clip || (this._clip = new Float32Array(8 * 5));
      const near = 0.08, farZ = this.far + 10;
      for (let t = 0; t < count; t++) {
        const o = t * 18;
        let n = 0, allNear = true, allFar = true;
        for (let v = 0; v < 3; v++) {
          const b = o + v * 5;
          const dx = data[b] - cx, dy = data[b + 1] - cy, dz = data[b + 2] - cz;
          const h = dx * fx + dy * fy, zc = h * cp + dz * sp;
          poly[n++] = dx * rx + dy * ry;
          poly[n++] = dz * cp - h * sp;
          poly[n++] = zc;
          poly[n++] = data[b + 3];
          poly[n++] = data[b + 4];
          if (zc >= near) allNear = false;
          if (zc <= farZ) allFar = false;
        }
        if (allNear || allFar) continue;
        const flags = data[o + 17];
        let cnt = 3, src = poly;
        if (poly[2] < near || poly[7] < near || poly[12] < near) {
          cnt = this.clipNear(poly, 3, clip, near);
          if (cnt < 3) continue;
          src = clip;
        }
        this.rasterPolygon(src, cnt, data[o + 15], data[o + 16] | 0, flags);
      }
    }

    clipNear(inp, n, out, near) {
      let m = 0;
      for (let i = 0; i < n; i++) {
        const a = i * 5, b = ((i + 1) % n) * 5;
        const za = inp[a + 2], zb = inp[b + 2];
        const ina = za >= near, inb = zb >= near;
        if (ina) { for (let k = 0; k < 5; k++) out[m * 5 + k] = inp[a + k]; m++; }
        if (ina !== inb) {
          const t = (near - za) / (zb - za);
          for (let k = 0; k < 5; k++) out[m * 5 + k] = inp[a + k] + (inp[b + k] - inp[a + k]) * t;
          m++;
        }
      }
      return m;
    }

    rasterPolygon(p, n, light, texId, flags) {
      const focal = this.focal, hw = this.halfW, hz = this.halfH;
      const sv = this._sv || (this._sv = new Float32Array(8 * 5));
      for (let i = 0; i < n; i++) {
        const b = i * 5, iz = 1 / p[b + 2];
        sv[b] = hw + p[b] * iz * focal;
        sv[b + 1] = hz - p[b + 1] * iz * focal;
        sv[b + 2] = iz;
        sv[b + 3] = p[b + 3] * iz;
        sv[b + 4] = p[b + 4] * iz;
      }
      const area = (sv[5] - sv[0]) * (sv[11] - sv[1]) - (sv[10] - sv[0]) * (sv[6] - sv[1]);
      if (!(flags & 1) && area >= 0) return;
      const tex = this.textures[texId];
      if (!tex) return;
      const indoor = flags & 2;
      const L = this.env;
      let lr, lg, lb;
      if (indoor) { lr = L.indoor[0] * light; lg = L.indoor[1] * light; lb = L.indoor[2] * light; }
      else { const k = light * this.wetK; lr = this.lr * k; lg = this.lg * k; lb = this.lb * k; }
      const emissive = flags & 4;
      if (emissive) { lr = lg = lb = 1; }
      for (let i = 1; i + 1 < n; i++) this.rasterTri(sv, 0, i * 5, (i + 1) * 5, tex, lr, lg, lb, flags);
    }

    rasterTri(sv, ia, ib, ic, tex, lr, lg, lb, flags) {
      let a = ia, b = ib, c = ic, tmp;
      if (sv[b + 1] < sv[a + 1]) { tmp = a; a = b; b = tmp; }
      if (sv[c + 1] < sv[a + 1]) { tmp = a; a = c; c = tmp; }
      if (sv[c + 1] < sv[b + 1]) { tmp = b; b = c; c = tmp; }
      const W = this.W, H = this.H;
      const y0 = sv[a + 1], y1 = sv[b + 1], y2 = sv[c + 1];
      if (y2 <= 0 || y0 >= H || y2 - y0 < 1e-6) return;
      this.stats.tris++;
      const fb = this.fb, zb = this.zb, rl = this.rayLen, td = tex.data, tw = tex.w, twm = tw - 1, thm = tex.h - 1, tsh = tex.shift;
      const fogTab = this.fogTab, fogMax = this.env.fogMax, fr = this.fogR, fg = this.fogG, fbb = this.fogB;
      const alphaTest = flags & 8;
      const noFog = flags & 4;
      const x0 = sv[a], x1 = sv[b], x2 = sv[c];
      const long = (y2 - y0);
      const ys = Math.max(0, Math.ceil(y0 - 0.5)), ye = Math.min(H - 1, Math.ceil(y2 - 0.5) - 1);
      for (let y = ys; y <= ye; y++) {
        const py = y + 0.5;
        const tl = (py - y0) / long;
        let xl = x0 + (x2 - x0) * tl, zl = sv[a + 2] + (sv[c + 2] - sv[a + 2]) * tl, ul = sv[a + 3] + (sv[c + 3] - sv[a + 3]) * tl, vl = sv[a + 4] + (sv[c + 4] - sv[a + 4]) * tl;
        let xr, zr, ur, vr;
        if (py < y1) {
          const d = y1 - y0; const ts = d > 1e-6 ? (py - y0) / d : 0;
          xr = x0 + (x1 - x0) * ts; zr = sv[a + 2] + (sv[b + 2] - sv[a + 2]) * ts; ur = sv[a + 3] + (sv[b + 3] - sv[a + 3]) * ts; vr = sv[a + 4] + (sv[b + 4] - sv[a + 4]) * ts;
        } else {
          const d = y2 - y1; const ts = d > 1e-6 ? (py - y1) / d : 0;
          xr = x1 + (x2 - x1) * ts; zr = sv[b + 2] + (sv[c + 2] - sv[b + 2]) * ts; ur = sv[b + 3] + (sv[c + 3] - sv[b + 3]) * ts; vr = sv[b + 4] + (sv[c + 4] - sv[b + 4]) * ts;
        }
        if (xl > xr) { let s = xl; xl = xr; xr = s; s = zl; zl = zr; zr = s; s = ul; ul = ur; ur = s; s = vl; vl = vr; vr = s; }
        const xs = Math.max(0, Math.ceil(xl - 0.5)), xe = Math.min(W - 1, Math.ceil(xr - 0.5) - 1);
        if (xe < xs) continue;
        const span = xr - xl, inv = span > 1e-6 ? 1 / span : 0;
        const dz = (zr - zl) * inv, du = (ur - ul) * inv, dv = (vr - vl) * inv;
        const off = xs + 0.5 - xl;
        let iz = zl + dz * off, uz = ul + du * off, vz = vl + dv * off;
        let i = y * W + xs;
        for (let x = xs; x <= xe; x++, i++, iz += dz, uz += du, vz += dv) {
          const z = 1 / iz;
          if (z >= zb[i]) continue;
          const tu = (uz * z * tw) | 0, tv = (vz * z * tex.h) | 0;
          const tx = td[((tv & thm) << tsh) + (tu & twm)];
          if (alphaTest && (tx >>> 24) < 128) continue;
          let r = (tx & 255) * lr, g = ((tx >>> 8) & 255) * lg, b = ((tx >>> 16) & 255) * lb;
          if (!noFog) {
            const fi = (z * rl[i] * 4) | 0, f = fi < 2048 ? fogTab[fi] : fogMax;
            r += (fr - r) * f; g += (fg - g) * f; b += (fbb - b) * f;
          }
          fb[i] = 0xff000000 | ((b > 255 ? 255 : b | 0) << 16) | ((g > 255 ? 255 : g | 0) << 8) | (r > 255 ? 255 : r | 0);
          zb[i] = z;
        }
      }
    }

    drawSprite(s) {
      const img = s.img;
      if (!img) return;
      const dx = s.x - this.cx, dy = s.y - this.cy, dz = s.z - this.cz;
      if (dx * dx + dy * dy > this.far * this.far) return;
      const sp = this.sinP, cp = this.cosP, h = dx * this.fx + dy * this.fy;
      const face = s.face != null ? s.face : (s.mode || 0) !== 0;
      const tiltS = face ? 0 : sp, tiltC = face ? 1 : cp;
      const X0 = dx * this.rx + dy * this.ry, Y0 = dz * cp - h * sp, Z0 = h * cp + dz * sp;
      const dist = Z0 * tiltC - Y0 * tiltS;
      if (dist < 0.15) return;
      const focal = this.focal, W = this.W, H = this.H, iw = img.w, ih = img.h, ax = img.ax, ay = img.ay;
      const q = (s.scale || 1) / img.ppm;
      if (Z0 > 0.15 && iw * q * focal / Z0 < 0.4) return;
      const wTop = ay * q, wBot = (ay - ih) * q, zTop = Z0 + wTop * tiltS, zBot = Z0 + wBot * tiltS;
      const yTop = zTop > 0.01 ? this.halfH - focal * (Y0 + wTop * tiltC) / zTop : -Infinity;
      const yBot = zBot > 0.01 ? this.halfH - focal * (Y0 + wBot * tiltC) / zBot : Infinity;
      const y0 = Math.max(0, Math.ceil(yTop - 0.5)), y1 = Math.min(H - 1, Math.ceil(yBot - 0.5) - 1);
      if (y1 < y0) return;
      this.stats.sprites++;
      const fb = this.fb, zb = this.zb, data = img.data;
      const f = s.noFog ? 0 : this.fogAt(Math.sqrt(dx * dx + dy * dy + dz * dz));
      const lr = s.light ? s.light[0] : this.lr, lg = s.light ? s.light[1] : this.lg, lb = s.light ? s.light[2] : this.lb;
      const fr = this.fogR, fg = this.fogG, fbb = this.fogB;
      const mode = s.mode || 0, alphaK = s.alpha == null ? 1 : s.alpha;
      const flip = !!s.flip, zBias = s.zBias || 0;
      const tint = s.tint;
      const tr = tint ? tint[0] : 1, tg = tint ? tint[1] : 1, tb = tint ? tint[2] : 1;
      const anchorUp = Y0 * tiltC + Z0 * tiltS;
      for (let y = y0; y <= y1; y++) {
        const b = (this.halfH - y - 0.5) / focal, den = tiltC - b * tiltS;
        if (den <= 1e-6) continue;
        const zc = dist / den;
        const v = Math.floor(ay - (zc * (b * tiltC + tiltS) - anchorUp) / q);
        if (v < 0 || v >= ih) continue;
        const inv = zc / (focal * q), left = this.halfW + focal * (X0 - ax * q) / zc;
        const x0 = Math.max(0, Math.ceil(left - 0.5)), x1 = Math.min(W - 1, Math.ceil(left + iw / inv - 0.5) - 1);
        const zTest = zc - zBias, row = v * iw;
        for (let x = x0, i = y * W + x0; x <= x1; x++, i++) {
          if (zTest >= zb[i]) continue;
          let u = ((x + 0.5 - left) * inv) | 0;
          if (u < 0 || u >= iw) continue;
          if (flip) u = iw - 1 - u;
          const tx = data[row + u];
          const al = tx >>> 24;
          if (al < 24) continue;
          let r = (tx & 255) * lr * tr, g = ((tx >>> 8) & 255) * lg * tg, b = ((tx >>> 16) & 255) * lb * tb;
          if (mode === 0) {
            if (al < 128) continue;
            r += (fr - r) * f; g += (fg - g) * f; b += (fbb - b) * f;
            fb[i] = 0xff000000 | ((b > 255 ? 255 : b | 0) << 16) | ((g > 255 ? 255 : g | 0) << 8) | (r > 255 ? 255 : r | 0);
            zb[i] = zc;
          } else if (mode === 1) {
            const k = (al / 255) * alphaK * (1 - f);
            const c = fb[i];
            const nr = (c & 255) + r * k, ng = ((c >>> 8) & 255) + g * k, nb = ((c >>> 16) & 255) + b * k;
            fb[i] = 0xff000000 | ((nb > 255 ? 255 : nb | 0) << 16) | ((ng > 255 ? 255 : ng | 0) << 8) | (nr > 255 ? 255 : nr | 0);
          } else if (mode === 2) {
            const k = (al / 255) * alphaK;
            r += (fr - r) * f; g += (fg - g) * f; b += (fbb - b) * f;
            const c = fb[i];
            const nr = (c & 255) + (r - (c & 255)) * k, ng = ((c >>> 8) & 255) + (g - ((c >>> 8) & 255)) * k, nb = ((c >>> 16) & 255) + (b - ((c >>> 16) & 255)) * k;
            fb[i] = 0xff000000 | ((nb | 0) << 16) | ((ng | 0) << 8) | (nr | 0);
          } else if (mode === 3) {
            const sx2 = clamp(x + Math.round(Math.sin(y * 0.7 + (s.phase || 0)) * 2 * alphaK), 0, W - 1);
            const sy2 = clamp(y + Math.round(Math.cos(x * 0.6 + (s.phase || 0)) * 1.5 * alphaK), 0, H - 1);
            fb[i] = fb[sy2 * W + sx2];
          }
        }
      }
    }

    drawParticle(p) {
      const q = this.project(p.x, p.y, p.z);
      if (!q || q.z > this.far) return;
      const size = Math.max(1, p.size * this.focal / q.z);
      const W = this.W, H = this.H, fb = this.fb, zb = this.zb;
      const x0 = Math.max(0, Math.floor(q.sx - size / 2)), x1 = Math.min(W - 1, Math.floor(q.sx + size / 2));
      const y0 = Math.max(0, Math.floor(q.sy - size / 2)), y1 = Math.min(H - 1, Math.floor(q.sy + size / 2));
      const r0 = C.red(p.color), g0 = C.green(p.color), b0 = C.blue(p.color);
      const k = p.alpha == null ? 1 : p.alpha, add = p.mode === 'add';
      const f = this.fogAt(Math.hypot(p.x - this.cx, p.y - this.cy, p.z - this.cz));
      const lit = p.lit ? [this.lr, this.lg, this.lb] : [1, 1, 1];
      const round = size >= 3, ir2 = 4 / (size * size), soft = round ? 1 / Math.max(0.15, p.size * 0.6) : 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * W + x;
        if (q.z >= zb[i]) continue;
        let w = k;
        if (round) {
          const dx = x + 0.5 - q.sx, dy = y + 0.5 - q.sy, d2 = (dx * dx + dy * dy) * ir2;
          if (d2 >= 1) continue;
          const depth = (zb[i] - q.z) * soft;
          w *= (1 - d2) * (depth < 1 ? depth : 1);
        }
        const c = fb[i];
        let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
        if (add) { const kk = w * (1 - f); r += r0 * kk; g += g0 * kk; b += b0 * kk; }
        else { r += (r0 * lit[0] - r) * w; g += (g0 * lit[1] - g) * w; b += (b0 * lit[2] - b) * w; }
        fb[i] = 0xff000000 | ((b > 255 ? 255 : b | 0) << 16) | ((g > 255 ? 255 : g | 0) << 8) | (r > 255 ? 255 : r | 0);
      }
    }

    beginViewLayer() {
      const n = this.W * this.H;
      if (!this.vzb || this.vzb.length !== n) this.vzb = new Float32Array(n);
      this.vzb.fill(0);
      this.viewFocal = this.W * 0.6;
    }

    projectView(p) {
      const z = Math.max(0.01, p[2]);
      return [this.W / 2 + p[0] / z * this.viewFocal, this.H / 2 - p[1] / z * this.viewFocal];
    }

    drawViewMesh(mesh, m, light) {
      const d = mesh.data, count = mesh.count, S = C.VIEW_STRIDE, F = 7;
      const vin = this._vin7 || (this._vin7 = new Float32Array(F * 3));
      const vout = this._vout7 || (this._vout7 = new Float32Array(F * 4));
      const sv = this._sv7 || (this._sv7 = new Float32Array(F * 4));
      const Lx = -0.42, Ly = 0.62, Lz = -0.66, Hx = -0.42, Hy = 0.62, Hz = -1.66, hl = Math.hypot(Hx, Hy, Hz);
      const near = 0.02, focal = this.viewFocal, hw = this.W / 2, hh = this.H / 2;
      for (let t = 0; t < count; t++) {
        const o = t * S;
        let cx = 0, cy = 0, cz = 0, anyNear = false, allNear = true;
        for (let v = 0; v < 3; v++) {
          const b = o + v * 6, x = d[b], y = d[b + 1], z = d[b + 2];
          const px = m[0] * x + m[3] * y + m[6] * z + m[9], py = m[1] * x + m[4] * y + m[7] * z + m[10], pz = m[2] * x + m[5] * y + m[8] * z + m[11];
          const nx = m[0] * d[b + 3] + m[3] * d[b + 4] + m[6] * d[b + 5], ny = m[1] * d[b + 3] + m[4] * d[b + 4] + m[7] * d[b + 5], nz = m[2] * d[b + 3] + m[5] * d[b + 4] + m[8] * d[b + 5];
          const diff = nx * Lx + ny * Ly + nz * Lz, spec = (nx * Hx + ny * Hy + nz * Hz) / hl;
          const k = 0.34 + 0.78 * (diff > 0 ? diff : 0) + (spec > 0 ? Math.pow(spec, 14) * 0.45 : 0) + (nz < 0 ? -nz * 0.08 : 0);
          const q = v * F;
          vin[q] = px; vin[q + 1] = py; vin[q + 2] = pz; vin[q + 3] = k; vin[q + 4] = x; vin[q + 5] = y; vin[q + 6] = z;
          cx += px; cy += py; cz += pz;
          if (pz < near) anyNear = true; else allNear = false;
        }
        if (allNear) continue;
        const fx = m[0] * d[o + 18] + m[3] * d[o + 19] + m[6] * d[o + 20], fy = m[1] * d[o + 18] + m[4] * d[o + 19] + m[7] * d[o + 20], fz = m[2] * d[o + 18] + m[5] * d[o + 19] + m[8] * d[o + 20];
        if (fx * cx + fy * cy + fz * cz > 0) continue;
        let src = vin, n = 3;
        if (anyNear) {
          n = 0;
          for (let i = 0; i < 3; i++) {
            const a = i * F, b = ((i + 1) % 3) * F, za = vin[a + 2], zb = vin[b + 2];
            if (za >= near) { for (let k = 0; k < F; k++) vout[n * F + k] = vin[a + k]; n++; }
            if ((za >= near) !== (zb >= near)) {
              const q = (near - za) / (zb - za);
              for (let k = 0; k < F; k++) vout[n * F + k] = vin[a + k] + (vin[b + k] - vin[a + k]) * q;
              n++;
            }
          }
          if (n < 3) continue;
          src = vout;
        }
        for (let i = 0; i < n; i++) {
          const b = i * F, iz = 1 / src[b + 2];
          sv[b] = hw + src[b] * iz * focal; sv[b + 1] = hh - src[b + 1] * iz * focal; sv[b + 2] = iz; sv[b + 3] = src[b + 3];
          sv[b + 4] = src[b + 4] * iz; sv[b + 5] = src[b + 5] * iz; sv[b + 6] = src[b + 6] * iz;
        }
        const glow = d[o + 24], mat = S > 25 ? d[o + 25] : 0;
        const r = d[o + 21] * light[0], g = d[o + 22] * light[1], bl = d[o + 23] * light[2];
        const gr = d[o + 21] * glow, gg = d[o + 22] * glow, gb = d[o + 23] * glow;
        for (let i = 1; i + 1 < n; i++) this.rasterViewTri(sv, 0, i * F, (i + 1) * F, r, g, bl, gr, gg, gb, mat);
      }
    }

    rasterViewTri(sv, ia, ib, ic, cr, cg, cb, gr, gg, gb, mat) {
      let a = ia, b = ib, c = ic, tmp;
      if (sv[b + 1] < sv[a + 1]) { tmp = a; a = b; b = tmp; }
      if (sv[c + 1] < sv[a + 1]) { tmp = a; a = c; c = tmp; }
      if (sv[c + 1] < sv[b + 1]) { tmp = b; b = c; c = tmp; }
      const W = this.W, H = this.H, fb = this.fb, vzb = this.vzb;
      const y0 = sv[a + 1], y1 = sv[b + 1], y2 = sv[c + 1];
      if (y2 <= 0 || y0 >= H || y2 - y0 < 1e-6) return;
      const x0 = sv[a], x1 = sv[b], x2 = sv[c], long = y2 - y0;
      const ys = Math.max(0, Math.ceil(y0 - 0.5)), ye = Math.min(H - 1, Math.ceil(y2 - 0.5) - 1);
      const L = VL, R = VR;
      for (let y = ys; y <= ye; y++) {
        const py = y + 0.5, tl = (py - y0) / long;
        let xl = x0 + (x2 - x0) * tl, xr;
        for (let k = 2; k < 7; k++) L[k] = sv[a + k] + (sv[c + k] - sv[a + k]) * tl;
        if (py < y1) {
          const dd = y1 - y0, ts = dd > 1e-6 ? (py - y0) / dd : 0;
          xr = x0 + (x1 - x0) * ts;
          for (let k = 2; k < 7; k++) R[k] = sv[a + k] + (sv[b + k] - sv[a + k]) * ts;
        } else {
          const dd = y2 - y1, ts = dd > 1e-6 ? (py - y1) / dd : 0;
          xr = x1 + (x2 - x1) * ts;
          for (let k = 2; k < 7; k++) R[k] = sv[b + k] + (sv[c + k] - sv[b + k]) * ts;
        }
        let P = L, Q = R;
        if (xl > xr) { const s = xl; xl = xr; xr = s; P = R; Q = L; }
        const xs = Math.max(0, Math.ceil(xl - 0.5)), xe = Math.min(W - 1, Math.ceil(xr - 0.5) - 1);
        if (xe < xs) continue;
        const span = xr - xl, inv = span > 1e-6 ? 1 / span : 0, off = xs + 0.5 - xl;
        const dz = (Q[2] - P[2]) * inv, dk = (Q[3] - P[3]) * inv, du = (Q[4] - P[4]) * inv, dv = (Q[5] - P[5]) * inv, dw = (Q[6] - P[6]) * inv;
        let iz = P[2] + dz * off, k = P[3] + dk * off, u = P[4] + du * off, v = P[5] + dv * off, w = P[6] + dw * off, i = y * W + xs;
        const brow = (y & 3) << 2;
        for (let x = xs; x <= xe; x++, i++, iz += dz, k += dk, u += du, v += dv, w += dw) {
          if (iz <= vzb[i]) continue;
          vzb[i] = iz;
          let kk = k;
          if (mat) { const zz = 1 / iz; kk *= viewTex(mat, u * zz, v * zz, w * zz); }
          const q = Math.floor(kk * 7 + BAYER4[brow | (x & 3)]) / 7;
          const r = cr * q + gr, g = cg * q + gg, bb = cb * q + gb;
          fb[i] = 0xff000000 | ((bb > 255 ? 255 : bb | 0) << 16) | ((g > 255 ? 255 : g | 0) << 8) | (r > 255 ? 255 : r | 0);
        }
      }
    }

    postProcess(fx) {
      const W = this.W, H = this.H, fb = this.fb, zb = this.zb;
      const flash = fx.flashlight;
      const tintK = fx.tintAmount || 0, tr = fx.tint ? fx.tint[0] : 1, tg = fx.tint ? fx.tint[1] : 1, tb = fx.tint ? fx.tint[2] : 1;
      const noise = fx.noise || 0, flashK = fx.whiteFlash || 0;
      const dither = this.dither;
      const cx = W / 2, cy = H / 2, rad = Math.min(W, H) * 0.62;
      const seed = (fx.frame || 0) * 7919;
      const vign = fx.vignette || 0, vr = fx.vignetteColor ? fx.vignetteColor[0] : 0, vg = fx.vignetteColor ? fx.vignetteColor[1] : 0, vb = fx.vignetteColor ? fx.vignetteColor[2] : 0;
      const grade = fx.grade, sat = grade ? grade.sat : 1, con = grade ? grade.con : 1;
      const gr = grade ? grade.tint[0] : 1, gg = grade ? grade.tint[1] : 1, gb = grade ? grade.tint[2] : 1;
      for (let y = 0; y < H; y++) {
        const bayerRow = (y & 3) << 2;
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          let c = fb[i];
          let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
          if (flash) {
            const z = zb[i];
            if (z < flash.range) {
              const d = Math.hypot(x - cx, (y - cy) * 1.15) / rad;
              if (d < 1) {
                const k = (1 - d * d) * (1 - z / flash.range) * flash.power;
                const m = 1 + k * 4;
                r = r * m + k * 26; g = g * m + k * 24; b = b * m + k * 18;
              }
            }
          }
          if (grade) {
            const l = r * 0.299 + g * 0.587 + b * 0.114;
            r = ((l + (r - l) * sat) - 118) * con + 118; g = ((l + (g - l) * sat) - 118) * con + 118; b = ((l + (b - l) * sat) - 118) * con + 118;
            r *= gr; g *= gg; b *= gb;
          }
          if (tintK) { r = lerp(r, r * tr, tintK); g = lerp(g, g * tg, tintK); b = lerp(b, b * tb, tintK); }
          if (vign) {
            const d = Math.hypot((x - cx) / cx, (y - cy) / cy);
            const k = clamp((d - 0.55) * 1.4, 0, 1) * vign;
            r = lerp(r, vr, k); g = lerp(g, vg, k); b = lerp(b, vb, k);
          }
          if (noise) {
            const n = ((C.hashInt(x, y, seed) & 255) - 128) * noise;
            r += n; g += n; b += n;
          }
          if (flashK) { r = lerp(r, 255, flashK); g = lerp(g, 250, flashK); b = lerp(b, 240, flashK); }
          if (dither) {
            const d = BAYER[bayerRow + (x & 3)] * 0.5 - 4;
            r += d; g += d * 0.5; b += d;
            r = r < 0 ? 0 : r > 255 ? 248 : (r | 0) & 0xf8;
            g = g < 0 ? 0 : g > 255 ? 252 : (g | 0) & 0xfc;
            b = b < 0 ? 0 : b > 255 ? 248 : (b | 0) & 0xf8;
          } else {
            r = r < 0 ? 0 : r > 255 ? 255 : r | 0; g = g < 0 ? 0 : g > 255 ? 255 : g | 0; b = b < 0 ? 0 : b > 255 ? 255 : b | 0;
          }
          fb[i] = 0xff000000 | (b << 16) | (g << 8) | r;
        }
      }
    }
  }

  C.Renderer = Renderer;
  C.FAR_Z = FAR_Z;
})(globalThis.Cop98 = globalThis.Cop98 || {});
