(function (C) {
  'use strict';
  const { clamp } = C;
  const FAR_Z = C.FAR_Z;
  const SKY_STEP = 8, CH = 9;
  const CLOUD_SCALE = 36, CIRRUS_HEIGHT = 0.5, CLOUD_SOFT = 0.24;
  const STARS = (() => {
    const r = C.makeRandom(1986), n = 2600, t = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const z = 0.03 + r() * 0.97, a = r() * C.TAU, h = Math.sqrt(1 - z * z);
      t[i * 4] = Math.cos(a) * h; t[i * 4 + 1] = Math.sin(a) * h; t[i * 4 + 2] = z; t[i * 4 + 3] = Math.pow(r(), 3.2);
    }
    return t;
  })();
  const RAIN_BOX = 20, RAIN_SHUTTER = 0.045;
  const EXP_RES = 64, EXP_MAX = 24;
  const EXP = (() => { const t = new Float32Array(EXP_MAX * 2 * EXP_RES + 2); for (let i = 0; i < t.length; i++) t[i] = Math.exp(EXP_MAX - i / EXP_RES); return t; })();
  const ex = x => EXP[((x < -EXP_MAX ? -EXP_MAX : x > EXP_MAX ? EXP_MAX : x) + EXP_MAX) * EXP_RES | 0];
  const RND = (() => { const r = C.makeRandom(4242), t = new Float32Array(4096 * 4); for (let i = 0; i < t.length; i++) t[i] = r(); return t; })();
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const GFOG = (() => { const t = new Float32Array(EXP_MAX * 2 * EXP_RES + 2); for (let i = 0; i < t.length; i++) { const x = i / EXP_RES - EXP_MAX; t[i] = Math.abs(x) < 1e-3 ? 1 - x / 2 : (1 - Math.exp(-x)) / x; } return t; })();
  const pack = (r, g, b) => 0xff000000 | ((b > 255 ? 255 : b < 0 ? 0 : b | 0) << 16) | ((g > 255 ? 255 : g < 0 ? 0 : g | 0) << 8) | (r > 255 ? 255 : r < 0 ? 0 : r | 0);

  function periodicNoise(size, seed, cellsX, cellsY, octaves, gain) {
    const out = new Float32Array(size * size);
    let amp = 1;
    for (let o = 0; o < octaves; o++, amp *= gain) {
      const px = cellsX << o, py = cellsY << o, kx = px / size, ky = py / size, s = seed + o * 17;
      for (let y = 0; y < size; y++) {
        const fy = y * ky, iy = fy | 0, ty = fy - iy, vy = ty * ty * (3 - 2 * ty), y0 = iy % py, y1 = (iy + 1) % py;
        for (let x = 0; x < size; x++) {
          const fx = x * kx, ix = fx | 0, tx = fx - ix, vx = tx * tx * (3 - 2 * tx), x0 = ix % px, x1 = (ix + 1) % px;
          const a = C.hash01(x0, y0, s), b = C.hash01(x1, y0, s), c = C.hash01(x0, y1, s), d = C.hash01(x1, y1, s);
          out[y * size + x] += amp * (a + (b - a) * vx + (c - a) * vy + (a - b - c + d) * vx * vy);
        }
      }
    }
    return out;
  }

  function equalize(t) {
    let lo = Infinity, hi = -Infinity;
    for (const v of t) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const bins = 4096, hist = new Float64Array(bins + 1), k = bins / (hi - lo || 1);
    for (const v of t) hist[((v - lo) * k) | 0]++;
    for (let i = 1; i <= bins; i++) hist[i] += hist[i - 1];
    const out = new Float32Array(t.length), n = t.length;
    for (let i = 0; i < n; i++) out[i] = hist[((t[i] - lo) * k) | 0] / n;
    return out;
  }

  function mipChain(data, size) {
    const chain = [{ s: size, d: data }];
    while (chain[chain.length - 1].s > 8) {
      const p = chain[chain.length - 1], s = p.s >> 1, d = new Float32Array(s * s);
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const i = y * 2 * p.s + x * 2;
        d[y * s + x] = (p.d[i] + p.d[i + 1] + p.d[i + p.s] + p.d[i + p.s + 1]) * 0.25;
      }
      chain.push({ s, d });
    }
    return chain;
  }

  function makeStreaks(n, seed) {
    const t = new Float32Array(n * n), rnd = C.makeRandom(seed);
    for (let k = 0; k < 460; k++) {
      const x = (rnd() * n) | 0, y0 = (rnd() * n) | 0, len = 6 + ((rnd() * 20) | 0), b = 0.35 + rnd() * 0.65;
      for (let j = 0; j < len; j++) t[((y0 + j) % n) * n + x] += b * Math.sin((j + 0.5) / len * Math.PI);
    }
    return t;
  }

  let SKY = null;
  function skyTextures() {
    if (SKY) return SKY;
    const wisp = periodicNoise(64, 404, 3, 3, 3, 0.55);
    let lo = Infinity, hi = -Infinity;
    for (const v of wisp) { if (v < lo) lo = v; if (v > hi) hi = v; }
    for (let i = 0; i < wisp.length; i++) wisp[i] = (wisp[i] - lo) / (hi - lo);
    SKY = {
      cum: mipChain(equalize(periodicNoise(256, 101, 4, 4, 6, 0.52)), 256),
      cir: mipChain(equalize(periodicNoise(256, 202, 2, 12, 4, 0.55)), 256),
      streaks: makeStreaks(128, 303),
      wisp: { s: 64, d: wisp }
    };
    return SKY;
  }

  function samp(L, u, v) {
    const s = L.s, m = s - 1, d = L.d;
    const iu = Math.floor(u), iv = Math.floor(v), fu = u - iu, fv = v - iv;
    const x0 = iu & m, x1 = (iu + 1) & m, y0 = (iv & m) * s, y1 = ((iv + 1) & m) * s;
    const a = d[y0 + x0], b = d[y0 + x1], c = d[y1 + x0], e = d[y1 + x1];
    return a + (b - a) * fu + (c - a) * fv + (a - b - c + e) * fu * fv;
  }

  function sampLevel(chain, u, v, lod) {
    const l = lod <= 0 ? 0 : lod >= chain.length - 1 ? chain.length - 1 : lod | 0, k = 1 / (1 << l);
    return samp(chain[l], u * k, v * k);
  }

  function sampLod(chain, u, v, lod) {
    if (lod <= 0) return samp(chain[0], u, v);
    const max = chain.length - 1;
    if (lod >= max) { const k = 1 / (1 << max); return samp(chain[max], u * k, v * k); }
    const l0 = lod | 0, f = lod - l0, k = 1 / (1 << l0);
    const a = samp(chain[l0], u * k, v * k);
    return f < 0.03 ? a : a + (samp(chain[l0 + 1], u * k * 0.5, v * k * 0.5) - a) * f;
  }

  const coverOf = w => w.cover != null ? w.cover : w.cloud;
  const densityFrom = (n, cover) => { const d = (n - (1 - cover * 1.15)) / CLOUD_SOFT; return d < 0 ? 0 : d > 1 ? 1 : d; };

  const Sky = {
    densityAt(w, dir) {
      const cover = coverOf(w);
      if (!(dir[2] > 0.03)) return cover;
      const T = skyTextures(), X = dir[0] / dir[2], Y = dir[1] / dir[2];
      return densityFrom(sampLod(T.cum, (X - w.cloudX) * CLOUD_SCALE, (Y - w.cloudY) * CLOUD_SCALE, 1.5), cover);
    }
  };

  Object.assign(C.Renderer.prototype, {
    prepareSky(env) {
      const sk = this.sk || (this.sk = {});
      const rgb = c => [C.red(c), C.green(c), C.blue(c)];
      sk.hor = rgb(env.skyHorizon); sk.top = rgb(env.skyTop); sk.fog = [this.fogR, this.fogG, this.fogB];
      sk.sun = env.sunDir || [0, 0, 1]; sk.sunC = rgb(env.sunColor || 0xffffffff);
      sk.sunH = Math.hypot(sk.sun[0], sk.sun[1]) || 1;
      const cover = env.cover || 0;
      sk.halo = (env.sunVisible || 0) * (1 - cover * 0.55);
      sk.dusk = (1 - C.smoothstep(0.02, 0.4, Math.abs(sk.sun[2]))) * C.smoothstep(-0.32, -0.1, sk.sun[2]) * (1 - cover * 0.65);
      sk.moon = env.moonDir || [0, 0, -1]; sk.moonVis = env.moonVisible || 0;
      sk.thr = 1 - cover * 1.15;
      sk.clouds = cover > 0.01;
      sk.shadeK = 0.22 + (env.cloudDark || 0) * 0.62;
      sk.lit = env.cloudLit || [230, 230, 230]; sk.sh = env.cloudShade || [140, 140, 150];
      const light = sk.sun[2] > -0.08 ? sk.sun : sk.moon, lh = Math.hypot(light[0], light[1]) || 1;
      sk.lu = light[0] / lh * 5; sk.lv = light[1] / lh * 5;
      sk.rim = (env.sunVisible || 0) * 0.9;
      sk.cir = env.cirrus || 0; sk.cirA = Math.min(1, sk.cir) * 0.5; sk.cirThr = 1 - sk.cir * 0.55;
      sk.ox = env.cloudX || 0; sk.oy = env.cloudY || 0;
      sk.stars = env.stars || 0; sk.t = env.time || 0;
      sk.rain = env.rain || 0; sk.storm = env.storm || 0;
      const b = env.bolt;
      if (b && b.k > 0) { const s = b.dist / 230; sk.boltK = b.k; sk.bX = Math.cos(b.az) * s; sk.bY = Math.sin(b.az) * s; sk.boltR = 1 / (s * s * 0.03 + 0.35); }
      else sk.boltK = 0;
      sk.sunOcc = env.sunVisible > 0 ? Sky.densityAt(env, sk.sun) : 1;
      sk.moonOcc = sk.moonVis > 0 ? Sky.densityAt(env, sk.moon) : 1;
    },

    skyNode(gx, gy) {
      const k = gy * this.skyW + gx;
      if (this.skyStamp[k] === this.skyFrame) return;
      this.skyStamp[k] = this.skyFrame;
      const sk = this.sk, f = this.focal;
      const a = (gx * SKY_STEP + 0.5 - this.halfW) / f, b = (this.halfH - gy * SKY_STEP - 0.5) / f;
      const up = this.sinP + b * this.cosP, fwd = this.cosP - b * this.sinP;
      const wx = fwd * this.fx + a * this.rx, wy = fwd * this.fy + a * this.ry;
      const hl = Math.sqrt(wx * wx + wy * wy), len = Math.sqrt(hl * hl + up * up);
      const el = Math.atan2(up, hl), sinEl = up / len;
      const k0 = el < 0 ? Math.min(1, -el * 3) : Math.pow(Math.min(1, el / 0.9), 0.55), to = el < 0 ? sk.fog : sk.top, H0 = sk.hor;
      let r = H0[0] + (to[0] - H0[0]) * k0, g = H0[1] + (to[1] - H0[1]) * k0, bl = H0[2] + (to[2] - H0[2]) * k0;
      const S = sk.sun, cs = (wx * S[0] + wy * S[1] + up * S[2]) / len;
      if (sk.halo > 0 && cs > 0) {
        const c2 = cs * cs, c4 = c2 * c2, c8 = c4 * c4, c16 = c8 * c8, c64 = c16 * c16 * c16 * c16;
        const h = sk.halo * (c8 * 0.14 + c64 * 0.32);
        r += sk.sunC[0] * h; g += sk.sunC[1] * h; bl += sk.sunC[2] * h;
      }
      if (sk.dusk > 0 && hl > 1e-6) {
        const ch = (wx * S[0] + wy * S[1]) / (hl * sk.sunH);
        if (ch > 0) {
          const q = sk.dusk * ch * ch * ch * ex(Math.abs(el) * 7) * 0.55;
          r += (sk.sunC[0] - r) * q; g += (sk.sunC[1] * 0.8 - g) * q; bl += (sk.sunC[2] * 0.6 - bl) * q;
        }
      }
      if (sk.moonVis > 0) {
        const M = sk.moon, cm = (wx * M[0] + wy * M[1] + up * M[2]) / len;
        if (cm > 0.9) { const c = (cm - 0.9) * 10, q = c * c * c * c * sk.moonVis * 0.22 * (1 - sk.moonOcc * 0.6); r += 150 * q; g += 165 * q; bl += 190 * q; }
      }
      const s = sinEl > 0.02 ? sinEl : 0.02, X = wx / len / s, Y = wy / len / s, ps = 1 / (f * s * s);
      const lod = Math.log2(ps * CLOUD_SCALE * 1.5);
      const G = this.skyGrid, o = k * CH;
      G[o] = r; G[o + 1] = g; G[o + 2] = bl; G[o + 3] = el; G[o + 4] = X; G[o + 5] = Y; G[o + 6] = lod > 0 ? lod : 0; G[o + 7] = cs; G[o + 8] = ps;
    },

    renderSky() {
      const W = this.W, H = this.H, fb = this.fb, zb = this.zb, env = this.env, S = SKY_STEP;
      const T = skyTextures();
      const gw = Math.ceil(W / S) + 1, gh = Math.ceil(H / S) + 1;
      if (!this.skyGrid || this.skyGrid.length !== gw * gh * CH) { this.skyGrid = new Float32Array(gw * gh * CH); this.skyStamp = new Int32Array(gw * gh); this.skyFrame = 0; }
      this.skyW = gw; this.skyFrame++;
      this.prepareSky(env);
      const sk = this.sk, G = this.skyGrid, L = this._skyL || (this._skyL = new Float64Array(CH)), R = this._skyR || (this._skyR = new Float64Array(CH)), D = this._skyD || (this._skyD = new Float64Array(CH));
      const cum = T.cum, cir = T.cir, cumOn = sk.clouds, cirOn = sk.cir > 0.01;
      if (!this._skyCache || this._skyCache.length !== W * 6) { this._skyCache = new Float32Array(W * 6); this._skyStamp = new Int32Array(W); }
      const cache = this._skyCache, cStamp = this._skyStamp.fill(-9);
      const starsOn = sk.stars > 0.02;
      if (starsOn && (!this._clearBuf || this._clearBuf.length !== W * H)) this._clearBuf = new Uint8Array(W * H);
      const clearBuf = this._clearBuf;
      const thr = sk.thr, invSoft = 1 / CLOUD_SOFT, shadeK = sk.shadeK, lu = sk.lu, lv = sk.lv, ox = sk.ox, oy = sk.oy;
      const litR = sk.lit[0], litG = sk.lit[1], litB = sk.lit[2], shR = sk.sh[0], shG = sk.sh[1], shB = sk.sh[2];
      const sunR = sk.sunC[0], sunG = sk.sunC[1], sunB = sk.sunC[2], rimK = sk.rim;
      const cirA = sk.cirA, cirThr = sk.cirThr, t = sk.t, rainK = sk.rain, storm = sk.storm;
      const boltK = sk.boltK, bX = sk.bX, bY = sk.bY, boltR = sk.boltR, cloudK = 1 - (env.fog || 0) * 0.55;
      for (let gy = 0; gy + 1 < gh; gy++) {
        const y0 = gy * S, y1 = Math.min(H, y0 + S);
        for (let gx = 0; gx + 1 < gw; gx++) {
          const x0 = gx * S, x1 = Math.min(W, x0 + S);
          let open = false;
          for (let y = y0; y < y1 && !open; y++) for (let i = y * W + x0, e = y * W + x1; i < e; i++) if (zb[i] >= FAR_Z) { open = true; break; }
          if (!open) continue;
          this.skyNode(gx, gy); this.skyNode(gx + 1, gy); this.skyNode(gx, gy + 1); this.skyNode(gx + 1, gy + 1);
          const o00 = (gy * gw + gx) * CH, o10 = o00 + CH, o01 = o00 + gw * CH, o11 = o01 + CH;
          for (let y = y0; y < y1; y++) {
            const ty = (y - y0) / S;
            for (let c = 0; c < CH; c++) {
              L[c] = G[o00 + c] + (G[o01 + c] - G[o00 + c]) * ty;
              R[c] = G[o10 + c] + (G[o11 + c] - G[o10 + c]) * ty;
              D[c] = (R[c] - L[c]) / S;
            }
            let r = L[0], g = L[1], bl = L[2], el = L[3], X = L[4], Y = L[5], lod = L[6], cs = L[7], ps = L[8];
            const brow = (y & 3) << 2, odd = (y & 1) === 1;
            let lastX = -9, qc = 0, ca = 0, ccR = 0, ccG = 0, ccB = 0, vq = 0;
            for (let i = y * W + x0, e = y * W + x1, x = x0; i < e; i++, x++, r += D[0], g += D[1], bl += D[2], el += D[3], X += D[4], Y += D[5], lod += D[6], cs += D[7], ps += D[8]) {
              if (zb[i] < FAR_Z) continue;
              const xe2 = x & ~1, co = xe2 * 6;
              if (odd && cStamp[xe2] === y - 1) {
                qc = cache[co]; ca = cache[co + 1]; ccR = cache[co + 2]; ccG = cache[co + 3]; ccB = cache[co + 4]; vq = cache[co + 5];
              } else if (x !== lastX + 1 || (x & 1) === 0) {
                qc = 0; ca = 0; vq = 0;
                if (el > 0.012) {
                  const fade = (el < 0.15 ? (el - 0.012) / 0.138 : 1) * cloudK, dl = lod + BAYER[brow | (x & 3)] - 0.5;
                  if (cirOn) {
                    const dc = (sampLevel(cir, (X * CIRRUS_HEIGHT - ox * 0.35) * CLOUD_SCALE, (Y * CIRRUS_HEIGHT - oy * 0.35) * CLOUD_SCALE, dl - 1) - cirThr) * 3;
                    if (dc > 0) qc = (dc > 1 ? 1 : dc) * cirA * fade;
                  }
                  if (cumOn) {
                    const u = (X - ox) * CLOUD_SCALE, v = (Y - oy) * CLOUD_SCALE;
                    const n = sampLevel(cum, u, v, dl);
                    let d = (n - thr) * invSoft;
                    if (d > 0) {
                      if (d > 1) d = 1;
                      const th = (n - thr) * 1.3;
                      let s = (sampLevel(cum, u + lu, v + lv, dl + 1) - n) * 2.4 + (th > 1 ? 1 : th) * shadeK;
                      s = s < 0 ? 0 : s > 1 ? 1 : s;
                      ccR = litR + (shR - litR) * s; ccG = litG + (shG - litG) * s; ccB = litB + (shB - litB) * s;
                      if (rimK > 0 && cs > 0.55) { const c = (cs - 0.55) * 2.2, q = rimK * c * c * (1 - d) * d * 4; ccR += sunR * q; ccG += sunG * q; ccB += sunB * q; }
                      if (boltK > 0) { const dx = X - bX, dy = Y - bY, q = boltK * ex((dx * dx + dy * dy) * boltR) * (0.35 + d); ccR += 200 * q; ccG += 205 * q; ccB += 235 * q; }
                      if (storm > 0) { const q = storm * (0.5 + 0.5 * Math.sin(t * 2.3 + X * 1.7 + Y * 1.1)) * d; ccR += 80 * q; ccG += 18 * q; ccB += 8 * q; }
                      ca = d * 0.97 * fade;
                    }
                  }
                }
                if (rainK > 0 && el < 0.28 && el > -0.02) {
                  const il = 1 / Math.sqrt(X * X + Y * Y + 1e-6);
                  vq = rainK * 0.32 * (1 - (el + 0.02) / 0.3) * samp(cum[2], X * il * 22 + t * 0.3, Y * il * 22);
                }
                if (!odd && x === xe2) { cStamp[xe2] = y; cache[co] = qc; cache[co + 1] = ca; cache[co + 2] = ccR; cache[co + 3] = ccG; cache[co + 4] = ccB; cache[co + 5] = vq; }
              }
              lastX = x;
              let pr = r, pg = g, pb = bl;
              if (qc > 0) { pr += (litR - pr) * qc; pg += (litG - pg) * qc; pb += (litB - pb) * qc; }
              if (ca > 0) { pr += (ccR - pr) * ca; pg += (ccG - pg) * ca; pb += (ccB - pb) * ca; }
              if (starsOn) clearBuf[i] = ca < 0.9 ? ((1 - ca) * cloudK * 255) | 0 : 0;
              if (vq > 0) { pr *= 1 - vq; pg *= 1 - vq; pb *= 1 - vq * 0.8; }
              fb[i] = 0xff000000 | ((pb > 255 ? 255 : pb | 0) << 16) | ((pg > 255 ? 255 : pg | 0) << 8) | (pr > 255 ? 255 : pr | 0);
            }
          }
        }
      }
      if (starsOn) this.drawStars(sk.stars, sk.t);
      this.drawSunMoon(env);
      if (env.bolt && env.bolt.k > 0) this.drawBolt(env.bolt);
    },

    drawStars(k, t) {
      const W = this.W, H = this.H, fb = this.fb, zb = this.zb, clr = this._clearBuf, f = this.focal;
      const fx = this.fx, fy = this.fy, rx = this.rx, ry = this.ry, sp = this.sinP, cp = this.cosP;
      for (let s = 0, n = STARS.length; s < n; s += 4) {
        const dx = STARS[s], dy = STARS[s + 1], dz = STARS[s + 2], h = dx * fx + dy * fy, zc = h * cp + dz * sp;
        if (zc < 0.05) continue;
        const px = (this.halfW + (dx * rx + dy * ry) / zc * f) | 0, py = (this.halfH - (dz * cp - h * sp) / zc * f) | 0;
        if (px < 0 || py < 0 || px >= W || py >= H) continue;
        const i = py * W + px;
        if (zb[i] < FAR_Z || !clr[i]) continue;
        const mag = STARS[s + 3], m = (0.3 + mag * 0.7) * k * clr[i] / 255 * (dz < 0.2 ? dz / 0.2 : 1) * (0.7 + 0.3 * Math.sin(t * (2 + mag * 3) + s));
        const c = fb[i], r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
        fb[i] = 0xff000000 | ((b + (255 - b) * m) << 16) | ((g + (240 - g) * m) << 8) | (r + (232 - r) * m);
        if (mag > 0.55 && px + 1 < W && py + 1 < H) {
          const q = m * 0.4;
          for (const j of [i + 1, i + W]) { if (zb[j] < FAR_Z) continue; const c2 = fb[j], r2 = c2 & 255, g2 = (c2 >>> 8) & 255, b2 = (c2 >>> 16) & 255; fb[j] = 0xff000000 | ((b2 + (255 - b2) * q) << 16) | ((g2 + (240 - g2) * q) << 8) | (r2 + (232 - r2) * q); }
        }
      }
    },

    drawSunMoon(env) {
      const sk = this.sk, f = this.focal;
      if (env.sunVisible > 0) {
        const S = sk.sun, p = this.project(this.cx + S[0] * 1000, this.cy + S[1] * 1000, this.cz + S[2] * 1000);
        if (p) {
          const vis = env.sunVisible * (1 - sk.sunOcc * 0.94);
          this.glow(p.sx, p.sy, FAR_Z * 0.5, f * 0.07, env.sunColor, vis * 0.4);
          this.disc(p.sx, p.sy, Math.max(1.2, f * 0.011), [255, 250, 236], vis, false);
        }
      }
      if (sk.moonVis > 0.01) {
        const M = sk.moon, p = this.project(this.cx + M[0] * 1000, this.cy + M[1] * 1000, this.cz + M[2] * 1000);
        if (p) {
          const vis = sk.moonVis * (1 - sk.moonOcc * 0.9);
          this.glow(p.sx, p.sy, FAR_Z * 0.5, f * 0.05, C.rgb(150, 165, 200), vis * 0.35);
          this.disc(p.sx, p.sy, Math.max(1.5, f * 0.016), [226, 230, 236], vis, true);
        }
      }
    },

    disc(sx, sy, rad, rgb, k, craters) {
      if (!(k > 0.01)) return;
      const W = this.W, H = this.H, fb = this.fb, zb = this.zb;
      const x0 = Math.max(0, Math.floor(sx - rad - 1)), x1 = Math.min(W - 1, Math.ceil(sx + rad + 1));
      const y0 = Math.max(0, Math.floor(sy - rad - 1)), y1 = Math.min(H - 1, Math.ceil(sy + rad + 1));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * W + x;
        if (zb[i] < FAR_Z * 0.5) continue;
        const dx = x + 0.5 - sx, dy = y + 0.5 - sy, d = Math.sqrt(dx * dx + dy * dy);
        let cov = rad + 0.5 - d;
        if (cov <= 0) continue;
        if (cov > 1) cov = 1;
        const sh = craters ? 0.72 + 0.28 * C.valueNoise(dx / rad * 2.6 + 5, dy / rad * 2.6 + 3, 99) - (d / rad) * 0.12 : 1;
        const a = cov * k, c = fb[i];
        const r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
        fb[i] = pack(r + (rgb[0] * sh - r) * a, g + (rgb[1] * sh - g) * a, b + (rgb[2] * sh - b) * a);
      }
    },

    toCam(x, y, z, out) {
      const dx = x - this.cx, dy = y - this.cy, dz = z - this.cz, h = dx * this.fx + dy * this.fy;
      out[0] = dx * this.rx + dy * this.ry; out[1] = dz * this.cosP - h * this.sinP; out[2] = h * this.cosP + dz * this.sinP;
      return out;
    },

    glowLine(x0, y0, z0, x1, y1, z1, core, halo, width, a0, a1) {
      const A = this.toCam(x0, y0, z0, this._ga || (this._ga = new Float64Array(3))), B = this.toCam(x1, y1, z1, this._gb || (this._gb = new Float64Array(3)));
      const near = 0.1;
      if (A[2] < near && B[2] < near) return;
      if (A[2] < near || B[2] < near) {
        const t = (near - A[2]) / (B[2] - A[2]);
        if (A[2] < near) { for (let k = 0; k < 3; k++) A[k] += (B[k] - A[k]) * t; a0 += (a1 - a0) * t; }
        else { for (let k = 0; k < 3; k++) B[k] = A[k] + (B[k] - A[k]) * t; a1 = a0 + (a1 - a0) * t; }
      }
      const W = this.W, H = this.H, fb = this.fb, zb = this.zb, f = this.focal;
      const sx0 = this.halfW + A[0] / A[2] * f, sy0 = this.halfH - A[1] / A[2] * f, sx1 = this.halfW + B[0] / B[2] * f, sy1 = this.halfH - B[1] / B[2] * f;
      const dx = sx1 - sx0, dy = sy1 - sy0, n = Math.min(900, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))) + 1);
      if ((sx0 < -40 && sx1 < -40) || (sx0 > W + 40 && sx1 > W + 40) || (sy0 < -40 && sy1 < -40) || (sy0 > H + 40 && sy1 > H + 40)) return;
      const iz0 = 1 / A[2], iz1 = 1 / B[2], xMajor = Math.abs(dx) >= Math.abs(dy);
      for (let s = 0; s <= n; s++) {
        const t = s / n, px = sx0 + dx * t, py = sy0 + dy * t;
        if (px < -4 || py < -4 || px > W + 4 || py > H + 4) continue;
        const zc = 1 / (iz0 + (iz1 - iz0) * t), a = a0 + (a1 - a0) * t;
        const w = Math.max(0.6, width * f / zc), reach = Math.min(6, Math.ceil(w + 0.5));
        const cx = px | 0, cy = py | 0;
        for (let o = -reach; o <= reach; o++) {
          const x = xMajor ? cx : cx + o, y = xMajor ? cy + o : cy;
          if (x < 0 || y < 0 || x >= W || y >= H) continue;
          const i = y * W + x;
          if (zc >= zb[i]) continue;
          const ao = Math.abs(o), fall = ao === 0 ? 1 : Math.max(0, 1 - ao / (w + 1)) * 0.7;
          if (fall <= 0) continue;
          const col = ao < w * 0.5 ? core : halo, k = a * fall;
          const c = fb[i];
          fb[i] = pack((c & 255) + col[0] * k, ((c >>> 8) & 255) + col[1] * k, ((c >>> 16) & 255) + col[2] * k);
        }
      }
    },

    drawTracer(tr) {
      const life = tr.life || 0.06, p = clamp(1 - tr.t / life, 0, 1);
      const dx = tr.bx - tr.ax, dy = tr.by - tr.ay, dz = tr.bz - tr.az, len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len < 0.2) return;
      const seg = Math.min(1, 7 / len), head = Math.min(1, p * (1 + seg)), tail = Math.max(0, head - seg);
      const core = tr.core || [255, 236, 190], halo = tr.halo || [255, 150, 60];
      this.glowLine(tr.ax + dx * tail, tr.ay + dy * tail, tr.az + dz * tail, tr.ax + dx * head, tr.ay + dy * head, tr.az + dz * head, core, halo, 0.018, 0.05, 0.95);
    },

    drawArc(tr, time) {
      const dx = tr.bx - tr.ax, dy = tr.by - tr.ay, dz = tr.bz - tr.az, len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len < 0.05) return;
      const hl = Math.hypot(dx, dy), vert = hl < len * 0.2, px = vert ? 1 : -dy / hl, py = vert ? 0 : dx / hl;
      const seed = (tr.seed || ((tr.ax * 131 + tr.ay * 71) | 0)) + ((time * 30) | 0), n = 7, amp = len * 0.16;
      const col = tr.color || 0xb0d8ff, core = [230, 244, 255], halo = [(col >> 16) & 255, (col >> 8) & 255, col & 255].map(v => v * 0.8);
      let lx = tr.ax, ly = tr.ay, lz = tr.az;
      for (let k = 1; k <= n; k++) {
        const t = k / n, j = k === n ? 0 : 1;
        const o1 = (C.hash01(k, seed, 31) - 0.5) * amp * j, o2 = (C.hash01(k, seed, 32) - 0.5) * amp * j;
        const x = tr.ax + dx * t + px * o1, y = tr.ay + dy * t + py * o1 + (vert ? o2 : 0), z = tr.az + dz * t + (vert ? 0 : o2);
        this.glowLine(lx, ly, lz, x, y, z, core, halo, 0.02, 0.9, 0.9);
        lx = x; ly = y; lz = z;
      }
    },

    drawBolt(b) {
      const sd = b.seed || 1, dist = b.dist, ca = Math.cos(b.az), sa = Math.sin(b.az);
      const bx = this.cx + ca * dist, by = this.cy + sa * dist, top = 230, px = -sa, py = ca;
      const pts = [[bx, by, top], [bx + px * 20, by + py * 20, 0]];
      let amp = 70;
      for (let level = 0; level < 5; level++, amp *= 0.52) {
        const next = [pts[0]];
        for (let k = 0; k + 1 < pts.length; k++) {
          const A = pts[k], B = pts[k + 1], o = (C.hash01(level * 97 + k, sd, 41) - 0.5) * amp, oz = (C.hash01(level * 97 + k, sd, 42) - 0.5) * amp * 0.3;
          next.push([(A[0] + B[0]) / 2 + px * o, (A[1] + B[1]) / 2 + py * o, (A[2] + B[2]) / 2 + oz], B);
        }
        pts.length = 0; pts.push(...next);
      }
      const k = Math.min(1, b.k), core = [245, 246, 255], halo = [150, 160, 255];
      for (let i = 0; i + 1 < pts.length; i++) this.glowLine(pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], core, halo, 2.4, k, k);
      for (let br = 0; br < 3; br++) {
        const start = 4 + ((C.hash01(br, sd, 43) * (pts.length - 12)) | 0), side = C.hash01(br, sd, 44) < 0.5 ? -1 : 1;
        let [x, y, z] = pts[start];
        for (let s = 0; s < 6; s++) {
          const nx = x + px * side * (8 + C.hash01(s, sd + br, 45) * 16), ny = y + py * side * (8 + C.hash01(s, sd + br, 46) * 16), nz = z - 10 - C.hash01(s, sd + br, 47) * 14;
          this.glowLine(x, y, z, nx, ny, nz, core, halo, 1.2, k * 0.6, k * 0.35);
          x = nx; y = ny; z = nz;
        }
      }
    },

    drawSpark(pt) {
      const k = (pt.alpha == null ? 1 : pt.alpha) * Math.min(1, pt.life * 5);
      this.glowLine(pt.x - pt.vx * 0.03, pt.y - pt.vy * 0.03, pt.z - pt.vz * 0.03, pt.x, pt.y, pt.z, [255, 240, 190], [255, 150, 50], 0.008, k * 0.3, k);
    },

    drawFlash(sx, sy, rad, seed, o = {}) {
      if (!(rad > 0.8)) return;
      const W = this.W, H = this.H, fb = this.fb, zb = this.zb, zt = o.z || 0;
      const ux = o.dirX == null ? 1 : o.dirX, uy = o.dirY == null ? 0 : o.dirY, st = o.stretch || 1, heat = o.heat == null ? 1 : o.heat;
      const n = 4 + (seed % 3), rot = C.hash01(seed, 1, 51) * C.TAU;
      const pc = new Float64Array(n), ps = new Float64Array(n), pl = new Float64Array(n);
      for (let k = 0; k < n; k++) { const a = rot + k * C.TAU / n + (C.hash01(seed, k, 52) - 0.5) * 0.5; pc[k] = Math.cos(a); ps[k] = Math.sin(a); pl[k] = 0.55 + C.hash01(seed, k, 53) * 0.45; }
      const R = rad * Math.max(1, st);
      const x0 = Math.max(0, Math.floor(sx - R)), x1 = Math.min(W - 1, Math.ceil(sx + R)), y0 = Math.max(0, Math.floor(sy - R)), y1 = Math.min(H - 1, Math.ceil(sy + R));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * W + x;
        if (zt && zt >= zb[i]) continue;
        const dx = (x + 0.5 - sx) / rad, dy = (y + 0.5 - sy) / rad;
        const al = (dx * ux + dy * uy) / st, ac = -dx * uy + dy * ux, r2 = al * al + ac * ac;
        if (r2 >= 1) continue;
        const r = Math.sqrt(r2), inv = 1 / (r + 1e-4);
        let pm = 0;
        for (let k = 0; k < n; k++) {
          const c = (al * pc[k] + ac * ps[k]) * inv;
          if (c > 0.72 && r < pl[k]) { let v = (c - 0.72) / 0.28; v = v * v * v * (1 - r / pl[k]); if (v > pm) pm = v; }
        }
        const I = (ex(r2 * 14) * 1.3 + pm * 0.95 + (1 - r) * (1 - r) * 0.14) * heat;
        if (I < 0.01) continue;
        const cr = 255 * I, cg = (110 + 140 * (I > 1 ? 1 : I)) * I, cb = (30 + 200 * (I > 0.65 ? (I > 1.2 ? 0.55 : I - 0.65) : 0)) * I;
        const c = fb[i];
        fb[i] = pack((c & 255) + cr, ((c >>> 8) & 255) + cg, ((c >>> 16) & 255) + cb);
      }
    },

    pointLight(x, y, z, radius, color, k) {
      const P = this.toCam(x, y, z, this._pl || (this._pl = new Float64Array(3))), lx = P[0], ly = P[1], lz = P[2];
      if (lz < -radius || !(k > 0.01)) return;
      const W = this.W, H = this.H, fb = this.fb, zb = this.zb, f = this.focal;
      let x0 = 0, x1 = W - 1, y0 = 0, y1 = H - 1;
      if (lz > radius * 1.05) {
        const sx = this.halfW + lx / lz * f, sy = this.halfH - ly / lz * f, e = radius * f / (lz - radius);
        x0 = Math.max(0, Math.floor(sx - e)); x1 = Math.min(W - 1, Math.ceil(sx + e));
        y0 = Math.max(0, Math.floor(sy - e)); y1 = Math.min(H - 1, Math.ceil(sy + e));
        if (x1 < x0 || y1 < y0) return;
      }
      const r2 = radius * radius, ir2 = 1 / r2, cr = C.red(color) / 255 * k, cg = C.green(color) / 255 * k, cb = C.blue(color) / 255 * k;
      for (let yy = y0; yy <= y1; yy++) {
        const b = (this.halfH - yy - 0.5) / f;
        for (let xx = x0, i = yy * W + x0; xx <= x1; xx++, i++) {
          const zc = zb[i];
          if (zc >= FAR_Z) continue;
          const a = (xx + 0.5 - this.halfW) / f, px = a * zc - lx, py = b * zc - ly, pz = zc - lz, d2 = px * px + py * py + pz * pz;
          if (d2 >= r2) continue;
          let w = 1 - d2 * ir2;
          w *= w;
          const c = fb[i], r = c & 255, g = (c >>> 8) & 255, bb = (c >>> 16) & 255;
          const nr = r * (1 + w * cr * 1.5) + w * cr * 16, ng = g * (1 + w * cg * 1.5) + w * cg * 16, nb = bb * (1 + w * cb * 1.5) + w * cb * 16;
          fb[i] = 0xff000000 | ((nb > 255 ? 255 : nb | 0) << 16) | ((ng > 255 ? 255 : ng | 0) << 8) | (nr > 255 ? 255 : nr | 0);
        }
      }
    },

    applyAtmosphere(env, indoor) {
      const hf = (env.hfog || 0) * (indoor ? 0.3 : 1), rain = env.rain || 0;
      if (hf < 0.0004 && rain < 0.02) return;
      const T = skyTextures(), W = this.W, H = this.H, fb = this.fb, zb = this.zb, rl = this.rayLen, f = this.focal;
      const Hs = env.hfogH || 7, base = hf * Math.exp(-Math.max(0, this.cz) / Hs), iHs = 1 / Hs;
      const fr = this.fogR, fg = this.fogG, fbb = this.fogB, sc = env.sunColor || 0xffffffff;
      const sunIn = (env.sunLit || 0) * 0.5 * (hf > 0.0004 ? 1 : 0), sr = C.red(sc), sg = C.green(sc), sbb = C.blue(sc);
      const sd = env.sunDir || [0, 0, 1];
      const scx = sd[0] * this.rx + sd[1] * this.ry, scz = (sd[0] * this.fx + sd[1] * this.fy) * this.cosP + sd[2] * this.sinP, scy = sd[2] * this.cosP - (sd[0] * this.fx + sd[1] * this.fy) * this.sinP;
      const t = env.time || 0, wox = ((env.windX || 0) * t * 0.09) % 64, woy = ((env.windY || 0) * t * 0.09) % 64, wd = T.wisp.d, wispOn = hf > 0.012;
      let wispX = -9, wn = 1, lastZ = 0, lastFo = 0;
      const st = T.streaks, scroll = t * H * 1.9, yawOff = Math.atan2(this.fy, this.fx) * f * 0.8;
      const wr = (env.windX || 0) * this.rx + (env.windY || 0) * this.ry, slant = clamp(-wr / 12, -0.7, 0.7);
      const lum = (this.lr + this.lg + this.lb) / 3, rc = Math.min(255, fr * 0.55 + 120 * lum), rg = Math.min(255, fg * 0.55 + 124 * lum), rb = Math.min(255, fbb * 0.55 + 132 * lum);
      const rainK = rain * 0.2, cx = this.cx, cy = this.cy, fx = this.fx, fy = this.fy, rx = this.rx, ry = this.ry;
      const E = EXP, G = GFOG, R0 = EXP_MAX * EXP_RES, TOP = EXP_MAX * 2 * EXP_RES, hx = this.halfW;
      const skyZ = 320 + (env.fog || 0) * 600;
      for (let y = 0; y < H; y++) {
        const b = (this.halfH - y - 0.5) / f, up = this.sinP + b * this.cosP, hw = this.cosP - b * this.sinP, upH = up * iHs;
        const srow = ((((y - scroll) | 0) & 127) << 7), shear = y * slant + yawOff, sunRow = b * scy + scz;
        for (let x = 0, i = y * W; x < W; x++, i++) {
          let z = zb[i];
          const sky = z >= FAR_Z;
          if (sky) z = skyZ;
          const d = z * rl[i];
          let fo = 0, rs = 0;
          if (base > 0 && (z > lastZ * 1.03 || z < lastZ * 0.97 || x === 0 || wispOn)) {
            lastZ = z;
            let gi = (z * upH * EXP_RES + R0) | 0;
            gi = gi < 0 ? 0 : gi > TOP ? TOP : gi;
            let tau = base * d * G[gi];
            if (wispOn && d < 70 && !sky) {
              if ((x & 1) === 0 || x !== wispX + 1) {
                const a = (x + 0.5 - hx) / f, u = (cx + z * (hw * fx + a * rx)) * 0.09 - wox + 128, v = (cy + z * (hw * fy + a * ry)) * 0.09 - woy + 128;
                const iu = u | 0, iv = v | 0, fu = u - iu, fv = v - iv, x0 = iu & 63, x1 = (iu + 1) & 63, y0 = (iv & 63) << 6, y1 = ((iv + 1) & 63) << 6;
                const p0 = wd[y0 + x0], p1 = wd[y0 + x1], p2 = wd[y1 + x0], p3 = wd[y1 + x1];
                wn = 0.35 + (p0 + (p1 - p0) * fu + (p2 - p0) * fv + (p0 - p1 - p2 + p3) * fu * fv) * 1.3;
              }
              wispX = x;
              const near = d / 70;
              tau *= wn * (1 - near) + near;
            }
            if (tau > 0.004) { const ti = (R0 + tau * EXP_RES) | 0; fo = 1 - E[ti > TOP ? TOP : ti]; }
            lastFo = fo;
          } else fo = lastFo;
          if (rainK > 0 && d > 6) {
            const sv = st[srow + (((x + shear) | 0) & 127)];
            if (sv > 0) rs = rainK * sv * (d > 40 ? 1 : (d - 6) / 34) * (indoor && d < 10 ? 0 : 1);
          }
          if (fo < 0.004 && rs < 0.004) continue;
          const c = fb[i];
          let r = c & 255, g = (c >>> 8) & 255, bb = (c >>> 16) & 255;
          if (fo > 0) {
            let tr = fr, tg = fg, tb = fbb;
            if (sunIn > 0) {
              const cs = ((x + 0.5 - hx) / f * scx + sunRow) / rl[i];
              if (cs > 0) { const c2 = cs * cs, q = sunIn * c2 * c2; tr += (sr - tr) * q; tg += (sg - tg) * q; tb += (sbb - tb) * q; }
            }
            r += (tr - r) * fo; g += (tg - g) * fo; bb += (tb - bb) * fo;
          }
          if (rs > 0) { r += (rc - r) * rs; g += (rg - g) * rs; bb += (rb - bb) * rs; }
          fb[i] = 0xff000000 | ((bb | 0) << 16) | ((g | 0) << 8) | (r | 0);
        }
      }
    },

    renderRain(env, terrain, indoor) {
      const k = env.rain || 0;
      if (k < 0.03 || indoor) return;
      const W = this.W, H = this.H, fb = this.fb, zb = this.zb, f = this.focal, B = RAIN_BOX, HB = B / 2;
      const t = env.time || 0, wx = env.windX || 0, wy = env.windY || 0;
      const lum = (this.lr + this.lg + this.lb) / 3;
      const cr = Math.min(255, this.fogR * 0.45 + 150 * lum), cg = Math.min(255, this.fogG * 0.45 + 155 * lum), cb = Math.min(255, this.fogB * 0.45 + 165 * lum);
      const cx = this.cx, cy = this.cy, cz = this.cz, fx = this.fx, fy = this.fy, rx = this.rx, ry = this.ry, sp = this.sinP, cp = this.cosP;
      const n = Math.round(k * W * H / 150);
      for (let i = 0; i < n; i++) {
        const j = (i & 4095) * 4, spd = 8.5 + RND[j + 3] * 2.5;
        let x = RND[j] * B + wx * t - cx, y = RND[j + 1] * B + wy * t - cy, z = RND[j + 2] * B - spd * t - cz;
        x -= B * Math.round(x / B); y -= B * Math.round(y / B); z -= B * Math.round(z / B);
        const r2 = x * x + y * y;
        if (r2 < 0.9) continue;
        const x2 = x - wx * RAIN_SHUTTER, y2 = y - wy * RAIN_SHUTTER, z2 = z + spd * RAIN_SHUTTER;
        const h0 = x * fx + y * fy, h1 = x2 * fx + y2 * fy;
        const z0 = h0 * cp + z * sp, z1 = h1 * cp + z2 * sp;
        if (z0 < 0.35 || z1 < 0.35) continue;
        const sx0 = this.halfW + (x * rx + y * ry) / z0 * f, sy0 = this.halfH - (z * cp - h0 * sp) / z0 * f;
        const sx1 = this.halfW + (x2 * rx + y2 * ry) / z1 * f, sy1 = this.halfH - (z2 * cp - h1 * sp) / z1 * f;
        const a = 0.55 * (1 - Math.sqrt(r2 + z * z) / (HB * 1.25));
        if (a <= 0.02) continue;
        const dx = sx1 - sx0, dy = sy1 - sy0, steps = Math.min(48, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))) + 1);
        for (let s = 0; s <= steps; s++) {
          const q = s / steps, px = (sx0 + dx * q) | 0, py = (sy0 + dy * q) | 0;
          if (px < 0 || py < 0 || px >= W || py >= H) continue;
          const pi = py * W + px, zc = z0 + (z1 - z0) * q;
          if (zc >= zb[pi]) continue;
          const c = fb[pi], al = a * (0.45 + 0.55 * q);
          fb[pi] = pack((c & 255) + (cr - (c & 255)) * al, ((c >>> 8) & 255) + (cg - ((c >>> 8) & 255)) * al, ((c >>> 16) & 255) + (cb - ((c >>> 16) & 255)) * al);
        }
      }
      if (!terrain) return;
      const m = Math.round(k * 90);
      for (let i = 0; i < m; i++) {
        const j = ((i * 7 + 3) & 4095) * 4, clock = t * 6 + RND[j + 3] * 6, ep = Math.floor(clock), ph = clock - ep;
        if (ph > 0.45) continue;
        const h = C.hashInt(i, ep, 811), x = cx + (((h & 1023) / 1023) - 0.5) * 22, y = cy + ((((h >>> 10) & 1023) / 1023) - 0.5) * 22;
        const gz = terrain.heightAt(x, y);
        if (gz < 0.02 || Math.abs(gz - cz) > 8) continue;
        const p = this.project(x, y, gz + 0.03);
        if (!p || p.z > 24) continue;
        const s = Math.max(1, Math.round(0.05 * f / p.z)), al = (1 - ph / 0.45) * 0.55 * k, px = p.sx | 0, py = p.sy | 0;
        for (const [ox, oy] of [[0, 0], [-s, -s], [s, -s], [0, -s]]) {
          const X = px + ox, Y = py + oy;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const pi = Y * W + X;
          if (p.z - 0.08 >= zb[pi]) continue;
          const c = fb[pi];
          fb[pi] = pack((c & 255) + (cr - (c & 255)) * al, ((c >>> 8) & 255) + (cg - ((c >>> 8) & 255)) * al, ((c >>> 16) & 255) + (cb - ((c >>> 16) & 255)) * al);
        }
      }
    },

    sunShafts(env) {
      const occ = this.sk ? this.sk.sunOcc : 0, K = (env.shafts || 0) * (1 - occ * 0.9);
      if (!(K > 0.02)) return;
      const sd = env.sunDir, p = this.project(this.cx + sd[0] * 1000, this.cy + sd[1] * 1000, this.cz + sd[2] * 1000);
      const W = this.W, H = this.H;
      if (!p || p.sx < -W * 0.5 || p.sx > W * 1.5 || p.sy < -H * 0.5 || p.sy > H * 1.5) return;
      const q = 4, w = Math.ceil(W / q), h = Math.ceil(H / q), n = w * h;
      if (!this._shM || this._shM.length !== n) { this._shM = new Float32Array(n); this._shA = new Float32Array(n); }
      const M = this._shM, A = this._shA, fb = this.fb, zb = this.zb, sx = p.sx / q, sy = p.sy / q, R2 = 1 / (w * w * 0.16);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const px = Math.min(W - 1, x * q + 2), py = Math.min(H - 1, y * q + 2), i = py * W + px;
        if (zb[i] < FAR_Z) { M[y * w + x] = 0; continue; }
        const c = fb[i], l = ((c & 255) * 0.3 + ((c >>> 8) & 255) * 0.5 + ((c >>> 16) & 255) * 0.2) / 255;
        const dx = x - sx, dy = y - sy;
        const b = l > 0.5 ? (l - 0.5) * 2 : 0;
        M[y * w + x] = b * b * ex((dx * dx + dy * dy) * R2);
      }
      const N = 16;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = (sx - x) / N * 0.85, dy = (sy - y) / N * 0.85;
        let sum = 0, wt = 1, px = x + 0.5, py = y + 0.5;
        for (let s = 0; s < N; s++, px += dx, py += dy, wt *= 0.93) {
          const ix = px | 0, iy = py | 0;
          if (ix < 0 || iy < 0 || ix >= w || iy >= h) continue;
          sum += M[iy * w + ix] * wt;
        }
        A[y * w + x] = sum / N;
      }
      const cr = C.red(env.sunColor) * K * 1.2, cg = C.green(env.sunColor) * K * 1.2, cb = C.blue(env.sunColor) * K * 1.2;
      for (let y = 0; y < H; y++) {
        const fy = y / q - 0.5, iy = fy < 0 ? 0 : fy | 0, ty = fy < 0 ? 0 : fy - iy, iy2 = iy + 1 < h ? iy + 1 : iy;
        for (let x = 0, i = y * W; x < W; x++, i++) {
          const fxx = x / q - 0.5, ix = fxx < 0 ? 0 : fxx | 0, tx = fxx < 0 ? 0 : fxx - ix, ix2 = ix + 1 < w ? ix + 1 : ix;
          const a = A[iy * w + ix], b = A[iy * w + ix2], c = A[iy2 * w + ix], d = A[iy2 * w + ix2];
          const v = a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
          if (v < 0.004) continue;
          const col = fb[i];
          const nr = (col & 255) + cr * v, ng = ((col >>> 8) & 255) + cg * v, nb = ((col >>> 16) & 255) + cb * v;
          fb[i] = 0xff000000 | ((nb > 255 ? 255 : nb | 0) << 16) | ((ng > 255 ? 255 : ng | 0) << 8) | (nr > 255 ? 255 : nr | 0);
        }
      }
    }
  });

  C.Sky = Sky;
})(globalThis.Cop98 = globalThis.Cop98 || {});
