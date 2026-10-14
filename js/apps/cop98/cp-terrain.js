(function (C) {
  'use strict';
  const { clamp, lerp, smoothstep, fbm, valueNoise, hash01, rgb, red, green, blue } = C;
  const M = C.MAP;
  const N = M.SIZE;

  const MAT = { GRASS: 0, DRY: 1, SAND: 2, MUD: 3, ROAD: 4, ROCK: 5, FOREST: 6, CONCRETE: 7, SCORCHED: 8, GRAVEL: 9, BED: 10 };
  const MAT_COLORS = [
    [90, 94, 56], [126, 116, 78], [150, 138, 104], [70, 62, 46], [112, 100, 76], [112, 108, 100],
    [72, 72, 48], [124, 122, 114], [50, 43, 36], [98, 92, 84], [80, 74, 58]
  ];
  const SUN = (() => { const v = [0.46, -0.52, 0.72], l = Math.hypot(...v); return v.map(c => c / l); })();

  class Terrain {
    constructor(seed = 1999) {
      this.seed = seed;
      this.size = N;
      this.height = new Float32Array(N * N);
      this.mat = new Uint8Array(N * N);
      this.color = new Uint32Array(N * N);
      this.road = new Float32Array(N * N);
      this.forest = new Float32Array(N * N);
      this.generateHeight();
      this.assignMaterials();
      this.bakeColor();
    }

    coarseField(step, fn) {
      const n = Math.floor(N / step) + 2, out = new Float32Array(n * n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) out[j * n + i] = fn(i * step, j * step);
      return { n, step, out };
    }
    sampleField(f, x, y) {
      const fx = x / f.step, fy = y / f.step, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, n = f.n, o = f.out;
      const a = o[j * n + i], b = o[j * n + i + 1], c = o[(j + 1) * n + i], d = o[(j + 1) * n + i + 1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }

    decodeWater() {
      const Z = C.ZATON_WATER, n = Z.size, cell = Z.cell, rle = Z.rle, A = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      const g = new Float32Array(n * n);
      let p = 0;
      const next = () => { const c = rle[p++]; if (c === '~') { const a = A.indexOf(rle[p++]), b = A.indexOf(rle[p++]); return a * 62 + b; } return A.indexOf(c); };
      for (let y = 0; y < n; y++) { let x = 0, cur = 0; while (x < n) { const r = next(); for (let k = 0; k < r; k++) g[y * n + x++] = cur; cur ^= 1; } }
      const W = new Uint8Array(N * N), s = this.seed;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const gx = clamp((x + 0.5) / cell - 0.5, 0, n - 1.001), gy = clamp((y + 0.5) / cell - 0.5, 0, n - 1.001);
        const i = gx | 0, j = gy | 0, u = gx - i, v = gy - j, k = j * n + i;
        const a = g[k], b = g[k + 1], c = g[k + n], d = g[k + n + 1];
        const w = a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
        if (w > 0.5 + (valueNoise(x / 3.1, y / 3.1, s + 5) - 0.5) * 0.36) W[y * N + x] = 1;
      }
      return W;
    }

    distanceField(W, target) {
      const D = new Float32Array(N * N), R2 = Math.SQRT2;
      for (let i = 0; i < N * N; i++) D[i] = W[i] === target ? 0 : 1e6;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x; let d = D[i];
        if (d === 0) continue;
        if (x > 0) d = Math.min(d, D[i - 1] + 1);
        if (y > 0) { d = Math.min(d, D[i - N] + 1); if (x > 0) d = Math.min(d, D[i - N - 1] + R2); if (x < N - 1) d = Math.min(d, D[i - N + 1] + R2); }
        D[i] = d;
      }
      for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) {
        const i = y * N + x; let d = D[i];
        if (d === 0) continue;
        if (x < N - 1) d = Math.min(d, D[i + 1] + 1);
        if (y < N - 1) { d = Math.min(d, D[i + N] + 1); if (x < N - 1) d = Math.min(d, D[i + N + 1] + R2); if (x > 0) d = Math.min(d, D[i + N - 1] + R2); }
        D[i] = d;
      }
      return D;
    }

    regionWeight(r, x, y) {
      if (r.line) { const { d } = C.polylineDistance(x, y, r.line); return 1 - smoothstep(r.w * 0.3, r.w * 0.5, d); }
      const q = Math.hypot((x - r.x) / r.rx, (y - r.y) / r.ry);
      return 1 - smoothstep(0.6, 1, q);
    }

    depthCap(x, y) {
      let cap = 0.95;
      for (const r of M.DEEP) { if (r.line ? x < 690 : Math.abs(x - r.x) > r.rx || Math.abs(y - r.y) > r.ry) continue; const w = this.regionWeight(r, x, y); if (w > 0) cap = lerp(cap, Math.max(cap, r.depth), w); }
      for (const r of M.SHALLOW) { if (Math.abs(x - r.x) > r.rx || Math.abs(y - r.y) > r.ry) continue; const w = this.regionWeight(r, x, y); if (w > 0) cap = lerp(cap, Math.min(cap, r.depth), w); }
      return cap;
    }

    generateHeight() {
      const s = this.seed, H = this.height;
      const Wt = this.decodeWater();
      this.water = Wt;
      const dW = this.distanceField(Wt, 1), dL = this.distanceField(Wt, 0);
      this.shoreDist = dW;
      const big = this.coarseField(4, (x, y) => fbm(x / 160, y / 160, s, 4) - 0.5);
      const rimN = this.coarseField(4, (x, y) => fbm(x / 90, y / 90, s + 7, 3));
      const capF = this.coarseField(8, (x, y) => this.depthCap(x, y));
      const ring = M.BASIN.concat([M.BASIN[0]]);
      const basin = this.coarseField(4, (x, y) => { const { d } = C.polylineDistance(x, y, ring); return C.pointInPolygon(x, y, M.BASIN) ? -d : d; });
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x;
        let h;
        if (Wt[i]) {
          const cap = this.sampleField(capF, x, y);
          h = -Math.min(cap, 0.26 + dL[i] * 0.2) - valueNoise(x / 6, y / 6, s + 9) * 0.12;
        } else {
          const d = dW[i];
          h = 0.24 + 1.3 * smoothstep(0, 7, d) + 5.4 * smoothstep(5, 85, d);
          h += this.sampleField(big, x, y) * 3.4 * smoothstep(4, 34, d) + (valueNoise(x / 9, y / 9, s + 3) - 0.5) * 0.45 * smoothstep(1, 6, d);
          const sb = this.sampleField(basin, x, y);
          if (sb > 0) h += 3 + 20 * smoothstep(0, 80, sb) + this.sampleField(rimN, x, y) * 16 * smoothstep(0, 45, sb);
          else { const k = 1 - smoothstep(0, 70, -sb); h += 3 * k * k; }
        }
        H[i] = h;
      }
      this.applyHills(dW);
      this.blur(1);
      this.applyPlateau();
      for (const b of M.BOWLS) this.carveBowl(b);
      for (const c of M.CUTS) this.carveCut(c);
      for (const f of M.FORDS) this.raiseFord(f);
      this.applyRailway();
      for (const p of M.PADS) this.flattenPad(p);
      for (const r of M.RECTS) this.flattenRect(r.x, r.y, r.w, r.d, r.yaw, r.h, r.blend);
      this.applyBridge();
      this.markRoads();
      this.smoothRoads();
      this.markForests();
    }

    applyHills(dW) {
      const H = this.height, Wt = this.water;
      for (const hl of M.HILLS) {
        const x0 = Math.max(0, Math.floor(hl.x - hl.rx)), x1 = Math.min(N - 1, Math.ceil(hl.x + hl.rx)), y0 = Math.max(0, Math.floor(hl.y - hl.ry)), y1 = Math.min(N - 1, Math.ceil(hl.y + hl.ry));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const i = y * N + x;
          if (Wt[i]) continue;
          const q = Math.hypot((x - hl.x) / hl.rx, (y - hl.y) / hl.ry);
          if (q >= 1) continue;
          H[i] += hl.h * (1 - smoothstep(0, 1, q)) * smoothstep(0, 12, dW[i]);
        }
      }
    }

    applyPlateau() {
      const P = M.PLATEAU, H = this.height, s = this.seed, poly = P.poly;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      const ring = poly.concat([poly[0]]);
      for (let y = Math.floor(y0 - 34); y <= y1 + 34; y++) for (let x = Math.floor(x0 - 34); x <= x1 + 34; x++) {
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        const { d } = C.polylineDistance(x, y, ring);
        const sd = C.pointInPolygon(x, y, poly) ? -d : d;
        const i = y * N + x;
        if (sd > 0) { H[i] = Math.min(H[i], lerp(9, H[i], smoothstep(P.cliff, 34, sd))); continue; }
        const top = P.top + (fbm(x / 18, y / 18, s + 22, 2) - 0.5) * 1.4 - smoothstep(-26, -4, sd) * 0.6;
        const k = smoothstep(0, P.cliff, -sd);
        H[i] = lerp(H[i], top, k);
      }
    }

    carveBowl(b) {
      const H = this.height, hc = this.height[Math.round(b.y) * N + Math.round(b.x)], ext = b.r * 1.45;
      for (let y = Math.floor(b.y - ext); y <= b.y + ext; y++) for (let x = Math.floor(b.x - ext); x <= b.x + ext; x++) {
        const q = Math.hypot(x - b.x, y - b.y) / b.r, i = y * N + x;
        if (q < 1) H[i] = Math.min(H[i], hc - b.depth * (1 - q * q) + b.rim * smoothstep(0.75, 1, q));
        else if (q < 1.45 && b.rim) H[i] += b.rim * (1 - smoothstep(0, 0.45, q - 1));
      }
    }

    carveCut(c) {
      const H = this.height, pts = c.pts, half = c.w / 2, bank = 1.4;
      let total = 0; for (let k = 0; k + 1 < pts.length; k++) total += Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      const reach = half + bank + 1, orig = new Map();
      for (let y = Math.floor(y0 - reach); y <= y1 + reach; y++) for (let x = Math.floor(x0 - reach); x <= x1 + reach; x++) {
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        const { d, along } = C.polylineDistance(x, y, pts);
        if (d > half + bank) continue;
        const i = y * N + x;
        if (!orig.has(i)) orig.set(i, H[i]);
        const surf = orig.get(i);
        const t = total > 0 ? along / total : 0;
        const te = c.taperEnd != null ? c.taperEnd : c.taper, tap = Math.min(c.taper ? smoothstep(0, c.taper, along) : 1, te ? smoothstep(0, te, total - along) : 1);
        let bottom = c.bottom != null ? c.bottom : surf - c.depth * tap;
        if (c.slopeTo != null) bottom = Math.max(Math.min(bottom, lerp(surf - c.depth, c.slopeTo, t * t)), c.slopeTo);
        if (c.bottom == null && c.slopeTo == null) bottom = Math.max(bottom, surf - c.depth);
        const k = 1 - smoothstep(half, half + bank, d);
        const target = lerp(surf, bottom, k);
        if (target < H[i]) H[i] = target;
      }
    }

    raiseFord(f) {
      const H = this.height;
      for (let y = Math.floor(f.y - f.r * 2); y <= f.y + f.r * 2; y++) for (let x = Math.floor(f.x - f.r * 2); x <= f.x + f.r * 2; x++) {
        const d = Math.hypot(x - f.x, y - f.y), i = y * N + x;
        const w = 1 - smoothstep(f.r * 0.6, f.r * 2, d);
        const target = lerp(H[i], f.h, w);
        if (target > H[i]) H[i] = target;
      }
    }

    applyRailway() {
      const R = M.RAILWAY, H = this.height, pts = R.pts;
      let total = 0; for (let k = 0; k + 1 < pts.length; k++) total += Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
      const zA = this.heightAt(pts[0][0], pts[0][1]), zB = M.RECTS[1].h;
      let acc = 0;
      for (let k = 0; k + 1 < pts.length; k++) {
        const [ax, ay] = pts[k], [bx, by] = pts[k + 1], len = Math.hypot(bx - ax, by - ay);
        const reach = R.w + 10;
        for (let y = Math.floor(Math.min(ay, by) - reach); y <= Math.max(ay, by) + reach; y++) for (let x = Math.floor(Math.min(ax, bx) - reach); x <= Math.max(ax, bx) + reach; x++) {
          if (x < 0 || y < 0 || x >= N || y >= N) continue;
          const { d, t } = C.segmentDistance(x, y, ax, ay, bx, by);
          const along = (acc + t * len) / total;
          const rh = lerp(zA, zB, along);
          const i = y * N + x;
          const w = 1 - smoothstep(R.w * 0.5, R.w * 0.5 + 8, d);
          if (w <= 0) continue;
          H[i] = lerp(H[i], rh, w);
          if (d < R.w * 0.5 + 1.5) this.mat[i] = 200;
        }
        acc += len;
      }
    }

    applyBridge() {
      const B = M.BRIDGE, H = this.height, half = B.w / 2 + 1;
      for (let y = Math.floor(B.y0 - 24); y <= B.y1 + 24; y++) for (let x = Math.floor(B.x - half - 8); x <= B.x + half + 8; x++) {
        const i = y * N + x, h = H[i];
        const lat = 1 - smoothstep(half, half + 8, Math.abs(x - B.x));
        if (lat <= 0) continue;
        let target;
        if (y < B.y0) target = lerp(h, B.z, smoothstep(B.y0 - 24, B.y0, y));
        else if (y > B.y1) target = lerp(h, B.z, 1 - smoothstep(B.y1, B.y1 + 24, y));
        else if (h > B.z - 4) target = lerp(h, B.z, smoothstep(B.z - 4, B.z - 1.5, h));
        else continue;
        H[i] = lerp(h, Math.max(h, target), lat);
      }
    }

    flattenPad(p) {
      const H = this.height;
      if (p.h == null) p.h = H[Math.round(p.y) * N + Math.round(p.x)];
      const ext = p.blend + 2;
      for (let y = Math.max(0, Math.floor(p.y - p.ry - ext)); y <= Math.min(N - 1, p.y + p.ry + ext); y++) for (let x = Math.max(0, Math.floor(p.x - p.rx - ext)); x <= Math.min(N - 1, p.x + p.rx + ext); x++) {
        const q = Math.hypot((x - p.x) / p.rx, (y - p.y) / p.ry);
        const d = q <= 1 ? 0 : (q - 1) * Math.min(p.rx, p.ry);
        const w = 1 - smoothstep(0, p.blend, d);
        const i = y * N + x;
        H[i] = lerp(H[i], p.h, w);
        if (q < 0.9 && p.mat != null && this.mat[i] !== 200) this.mat[i] = 100 + p.mat;
      }
    }

    markRoads() {
      const R = this.road;
      for (const road of M.ROADS) {
        const pts = road.pts;
        for (let k = 0; k + 1 < pts.length; k++) {
          const [ax, ay] = pts[k], [bx, by] = pts[k + 1], reach = road.w + 3;
          for (let y = Math.max(0, Math.floor(Math.min(ay, by) - reach)); y <= Math.min(N - 1, Math.max(ay, by) + reach); y++) for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - reach)); x <= Math.min(N - 1, Math.max(ax, bx) + reach); x++) {
            const { d } = C.segmentDistance(x, y, ax, ay, bx, by);
            const v = 1 - smoothstep(road.w * 0.5 - 1, road.w * 0.5 + 1.2, d);
            const i = y * N + x;
            if (v > R[i]) R[i] = v;
          }
        }
      }
    }

    smoothRoads() {
      const H = this.height, R = this.road, src = Float32Array.from(H);
      for (const road of M.ROADS) {
        const pts = road.pts, reach = road.w * 0.5 + 3;
        for (let k = 0; k + 1 < pts.length; k++) {
          const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
          for (let y = Math.max(1, Math.floor(Math.min(ay, by) - reach)); y <= Math.min(N - 2, Math.max(ay, by) + reach); y++) for (let x = Math.max(1, Math.floor(Math.min(ax, bx) - reach)); x <= Math.min(N - 2, Math.max(ax, bx) + reach); x++) {
            const { d, t } = C.segmentDistance(x, y, ax, ay, bx, by);
            if (d > reach) continue;
            const cx = ax + (bx - ax) * t, cy = ay + (by - ay) * t;
            let sum = 0, cnt = 0;
            for (let s = -3; s <= 3; s++) { const px = Math.round(cx + (bx - ax) / Math.hypot(bx - ax, by - ay) * s * 2), py = Math.round(cy + (by - ay) / Math.hypot(bx - ax, by - ay) * s * 2); if (px < 0 || py < 0 || px >= N || py >= N) continue; sum += src[py * N + px]; cnt++; }
            const target = Math.max(sum / cnt, 0.32);
            const i = y * N + x, w = (1 - smoothstep(road.w * 0.5, reach, d)) * 0.85;
            if (this.mat[i] >= 100 && this.mat[i] !== 200) continue;
            if (Math.abs(x - M.BRIDGE.x) < M.BRIDGE.w && y > M.BRIDGE.y0 - 26 && y < M.BRIDGE.y1 + 26) continue;
            H[i] = lerp(H[i], target, w);
            if (R[i] < 0.5 && H[i] < 0.3 && target >= 0.32) H[i] = Math.max(H[i], lerp(H[i], 0.32, w));
          }
        }
      }
    }

    markForests() {
      const F = this.forest, s = this.seed;
      for (const f of M.FORESTS) {
        for (let y = Math.max(0, Math.floor(f.y - f.r)); y <= Math.min(N - 1, f.y + f.r); y++) for (let x = Math.max(0, Math.floor(f.x - f.r)); x <= Math.min(N - 1, f.x + f.r); x++) {
          const d = Math.hypot(x - f.x, y - f.y) / f.r + (fbm(x / 45, y / 45, s + 62, 3) - 0.5) * 0.7;
          if (d >= 1) continue;
          const v = (1 - smoothstep(0.55, 1, d)) * smoothstep(0.35, 0.55, fbm(x / 60, y / 60, s + 61, 3) + 0.12);
          const i = y * N + x;
          if (v > F[i]) F[i] = v;
        }
      }
    }

    blur(passes) {
      const H = this.height, T = new Float32Array(N * N);
      for (let p = 0; p < passes; p++) {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          let sum = 0, cnt = 0;
          for (let dy = -1; dy <= 1; dy++) { const yy = y + dy; if (yy < 0 || yy >= N) continue; for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx < 0 || xx >= N) continue; sum += H[yy * N + xx]; cnt++; } }
          T[y * N + x] = sum / cnt;
        }
        H.set(T);
      }
    }

    assignMaterials() {
      const H = this.height, Mt = this.mat, s = this.seed, dW = this.shoreDist;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x, h = H[i];
        const pre = Mt[i];
        const sx = H[y * N + Math.min(N - 1, x + 1)] - H[y * N + Math.max(0, x - 1)];
        const sy = H[Math.min(N - 1, y + 1) * N + x] - H[Math.max(0, y - 1) * N + x];
        const slope = Math.hypot(sx, sy) * 0.5;
        let m;
        const n1 = fbm(x / 26, y / 26, s + 71, 3), n2 = valueNoise(x / 7, y / 7, s + 72);
        if (pre === 200) m = MAT.GRAVEL;
        else if (h < -0.05) m = n2 > 0.5 ? MAT.BED : MAT.MUD;
        else if (slope > 0.85) m = MAT.ROCK;
        else if (pre >= 100) m = pre - 100;
        else if (this.road[i] > 0.5) m = MAT.ROAD;
        else if (h < 0.7 || dW[i] < 3) m = n1 > 0.56 ? MAT.SAND : n2 > 0.42 ? MAT.MUD : MAT.GRASS;
        else if (this.forest[i] > 0.35) m = MAT.FOREST;
        else if (slope > 0.5) m = n2 > 0.5 ? MAT.ROCK : MAT.DRY;
        else m = n1 > 0.52 ? MAT.DRY : MAT.GRASS;
        if (m === MAT.CONCRETE && n1 > 0.62) m = MAT.GRAVEL;
        Mt[i] = m;
      }
      for (const p of M.PADS) if (p.mat === MAT.SCORCHED) this.scorch(p.x, p.y, Math.max(p.rx, p.ry));
      for (const r of M.PAINT) this.paintRect(r);
    }

    scorch(cx, cy, r) {
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        const d = Math.hypot(x - cx, y - cy) / r + (valueNoise(x / 5, y / 5, this.seed + 81) - 0.5) * 0.5;
        if (d < 1 && this.height[y * N + x] > -0.05) this.mat[y * N + x] = MAT.SCORCHED;
      }
    }

    paintRect(r) {
      const c = Math.cos(r.yaw), s = Math.sin(r.yaw), ext = Math.hypot(r.w, r.d) / 2 + 2;
      for (let y = Math.floor(r.y - ext); y <= r.y + ext; y++) for (let x = Math.floor(r.x - ext); x <= r.x + ext; x++) {
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        const lx = (x - r.x) * c + (y - r.y) * s, ly = -(x - r.x) * s + (y - r.y) * c;
        const edge = Math.min(r.w / 2 - Math.abs(lx), r.d / 2 - Math.abs(ly)) + (valueNoise(x / 3, y / 3, this.seed + 84) - 0.5) * 3;
        const i = y * N + x;
        if (edge > 0 && this.height[i] > -0.05 && this.mat[i] !== MAT.ROAD) this.mat[i] = r.mat;
      }
    }

    paintMaterial(cx, cy, r, mat, noiseAmount = 0.4) {
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        const d = Math.hypot(x - cx, y - cy) / r + (valueNoise(x / 4, y / 4, this.seed + 83) - 0.5) * noiseAmount;
        if (d < 1 && this.height[y * N + x] > -0.05) this.mat[y * N + x] = mat;
      }
    }

    flattenRect(cx, cy, w, d, yaw, h, blend = 4) {
      const c = Math.cos(yaw), s = Math.sin(yaw), H = this.height, r = Math.hypot(w, d) / 2 + blend + 1;
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        const lx = (x - cx) * c + (y - cy) * s, ly = -(x - cx) * s + (y - cy) * c;
        const ox = Math.max(0, Math.abs(lx) - w / 2), oy = Math.max(0, Math.abs(ly) - d / 2);
        const k = 1 - smoothstep(0, blend, Math.hypot(ox, oy));
        if (k <= 0) continue;
        const i = y * N + x;
        H[i] = lerp(H[i], h, k);
      }
    }

    bakeColor() {
      const H = this.height, Mt = this.mat, Col = this.color, s = this.seed;
      const [lx, ly, lz] = SUN, horiz = Math.hypot(lx, ly), rise = lz / horiz, stepX = lx / horiz, stepY = ly / horiz;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x, h = H[i];
        const hx = H[y * N + Math.min(N - 1, x + 1)] - H[y * N + Math.max(0, x - 1)];
        const hy = H[Math.min(N - 1, y + 1) * N + x] - H[Math.max(0, y - 1) * N + x];
        const nx = -hx * 0.5, ny = -hy * 0.5, nl = Math.hypot(nx, ny, 1);
        let diffuse = Math.max(0, (nx * lx + ny * ly + lz) / nl);
        let shadow = 1;
        let px = x, py = y, ph = Math.max(h, 0);
        for (let k = 1; k < 48; k++) {
          px += stepX * 2; py += stepY * 2; ph += rise * 2;
          const ix = px | 0, iy = py | 0;
          if (ix < 0 || iy < 0 || ix >= N || iy >= N) break;
          if (H[iy * N + ix] > ph + 0.2) { shadow = 0.45; break; }
          if (ph > 40) break;
        }
        let avg = 0;
        for (const [dx, dy] of [[-5, 0], [5, 0], [0, -5], [0, 5], [-4, -4], [4, 4], [-4, 4], [4, -4]]) {
          const xx = clamp(x + dx, 0, N - 1), yy = clamp(y + dy, 0, N - 1); avg += H[yy * N + xx];
        }
        avg /= 8;
        const ao = clamp(1 - (avg - h) * 0.07, 0.62, 1.08);
        const m = Mt[i], base = MAT_COLORS[m];
        const v = 0.84 + fbm(x / 11, y / 11, s + 91, 2) * 0.3 + (hash01(x, y, s) - 0.5) * 0.08;
        let r = base[0] * v, g = base[1] * v, b = base[2] * v;
        if (m === MAT.GRASS || m === MAT.DRY) {
          const t = fbm(x / 55, y / 55, s + 93, 2);
          r *= 0.9 + t * 0.25; g *= 1.02 - t * 0.08;
        }
        if (this.forest[i] > 0.2 && m !== MAT.ROAD) { const k = 1 - this.forest[i] * 0.22; r *= k; g *= k; b *= k; }
        if ((m === MAT.GRASS || m === MAT.DRY || m === MAT.FOREST) && h > 0.4) {
          const sp = valueNoise(x / 2.3, y / 2.3, s + 95), cl = fbm(x / 40, y / 40, s + 96, 2);
          if (sp > 0.8 - cl * 0.12) { const k = 0.66 + (1 - sp) * 0.6; r *= k; g *= k * 1.04; b *= k; }
        }
        if (this.road[i] > 0 && this.road[i] <= 0.5 && m !== MAT.ROAD && h > 0) { const t = this.road[i] * 0.8; r = lerp(r, 108, t); g = lerp(g, 92, t); b = lerp(b, 66, t); }
        const light = (0.5 + 0.72 * diffuse * shadow) * ao;
        Col[i] = rgb(r * light, g * light, b * light);
      }
    }

    heightAt(x, y) {
      if (x < 0) x = 0; else if (x > N - 1.001) x = N - 1.001;
      if (y < 0) y = 0; else if (y > N - 1.001) y = N - 1.001;
      const ix = x | 0, iy = y | 0, u = x - ix, v = y - iy, H = this.height, i = iy * N + ix;
      const a = H[i], b = H[i + 1], c = H[i + N], d = H[i + N + 1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    floorAt(x, y) { return Math.max(this.heightAt(x, y), M.WATER_LEVEL); }
    materialAt(x, y) {
      const ix = clamp(Math.round(x), 0, N - 1), iy = clamp(Math.round(y), 0, N - 1);
      return this.mat[iy * N + ix];
    }
    waterDepth(x, y) { return M.WATER_LEVEL - this.heightAt(x, y); }
    normalAt(x, y) {
      const hx = this.heightAt(x + 1, y) - this.heightAt(x - 1, y), hy = this.heightAt(x, y + 1) - this.heightAt(x, y - 1);
      const nx = -hx * 0.5, ny = -hy * 0.5, l = Math.hypot(nx, ny, 1);
      return [nx / l, ny / l, 1 / l];
    }
    slopeAt(x, y) {
      const hx = this.heightAt(x + 0.5, y) - this.heightAt(x - 0.5, y), hy = this.heightAt(x, y + 0.5) - this.heightAt(x, y - 0.5);
      return Math.hypot(hx, hy);
    }
    raycast(ox, oy, oz, dx, dy, dz, maxDist) {
      let t = 0.05;
      const step = 0.35;
      while (t < maxDist) {
        const x = ox + dx * t, y = oy + dy * t, z = oz + dz * t;
        if (x < 0 || y < 0 || x >= N || y >= N) return null;
        const h = this.heightAt(x, y);
        if (z < h) {
          let lo = t - step, hi = t;
          for (let k = 0; k < 6; k++) { const mid = (lo + hi) / 2; if (oz + dz * mid < this.heightAt(ox + dx * mid, oy + dy * mid)) hi = mid; else lo = mid; }
          return { t: hi, x: ox + dx * hi, y: oy + dy * hi, z: oz + dz * hi, water: false };
        }
        t += step;
      }
      return null;
    }
  }

  C.Terrain = Terrain;
  C.TMAT = MAT;
  C.SUN = SUN;
})(globalThis.Cop98 = globalThis.Cop98 || {});
