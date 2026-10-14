(function (Z) {
  'use strict';

  const C = { none: 0, grass: 1, field: 2, scrub: 3, park: 4, wood: 5, wetland: 6, sand: 7, rock: 8, urban: 9, industrial: 10, landfill: 11, cemetery: 12, pitch: 13, garden: 14, water: 15 };
  Z.COVER = C;
  Z.ROAD_PAVED = { P: 1, S: 1, T: 1, R: 1, W: 1, V: 1 };

  class SpatialHash {
    constructor(size) { this.size = size; this.cells = new Map(); }
    key(cx, cz) { return cx * 73856093 ^ cz * 19349663; }
    insert(item, x0, z0, x1, z1) {
      const s = this.size;
      for (let cx = Math.floor(x0 / s); cx <= Math.floor(x1 / s); cx++) for (let cz = Math.floor(z0 / s); cz <= Math.floor(z1 / s); cz++) {
        const k = this.key(cx, cz);
        let a = this.cells.get(k);
        if (!a) { a = []; this.cells.set(k, a); }
        a.push(item);
      }
    }
    query(x0, z0, x1, z1, out = new Set()) {
      const s = this.size;
      for (let cx = Math.floor(x0 / s); cx <= Math.floor(x1 / s); cx++) for (let cz = Math.floor(z0 / s); cz <= Math.floor(z1 / s); cz++) {
        const a = this.cells.get(this.key(cx, cz));
        if (a) for (const it of a) out.add(it);
      }
      return out;
    }
    at(x, z) { return this.cells.get(this.key(Math.floor(x / this.size), Math.floor(z / this.size))) || []; }
  }
  Z.SpatialHash = SpatialHash;

  class WorldMap {
    constructor(geo) {
      const G = geo || Z.GEO;
      this.G = G;
      this.cell = G.cover.cell;
      this.cols = G.cover.cols;
      this.rows = G.cover.rows;
      this.x0 = G.bounds[0];
      this.z0 = G.bounds[1];
      this.x1 = G.bounds[2];
      this.z1 = G.bounds[3];
      this.names = G.names;
      this.decodeCover();
      this.decodeVectors();
      this.buildHeights();
    }

    decodeCover() {
      const buf = Z.b64(this.G.cover.rle);
      const cov = new Uint8Array(this.cols * this.rows);
      let i = 0;
      const rd = () => { let v = 0, m = 1, b; do { b = buf[i++]; v += (b & 127) * m; m *= 128; } while (b & 128); return v; };
      for (let r = 0; r < this.rows; r++) {
        let c = 0;
        while (c < this.cols) { const v = buf[i++]; const n = rd(); cov.fill(v, r * this.cols + c, r * this.cols + c + n); c += n; }
      }
      this.cover = cov;
    }

    decodeVectors() {
      const G = this.G;
      this.roads = G.roads.map(r => ({ k: r[0], w: r[1] / 10, name: r[2] >= 0 ? G.names[r[2]] : '', layer: r[3], bridge: !!r[4], pts: Z.unflat(r[5]) }));
      this.rails = G.rails.map(r => ({ k: r[0], layer: r[1], bridge: !!r[2], pts: Z.unflat(r[3]) }));
      this.cliffs = G.cliffs.map(c => ({ k: c[0], name: c[1] >= 0 ? G.names[c[1]] : '', pts: Z.unflat(c[2]) }));
      this.bridgeAreas = G.bridges.map(b => ({ name: b[0] >= 0 ? G.names[b[0]] : '', poly: Z.unflat(b[1]) }));
      this.buildings = G.buildings.map((b, i) => {
        const poly = Z.unflat(b[5]);
        if (Z.polyArea(poly) < 0) poly.reverse();
        return { i, type: b[0], levels: b[1], name: b[2] >= 0 ? G.names[b[2]] : '', inside: !!b[3], osm: b[4], poly, box: Z.polyBox(poly), c: Z.polyCentroid(poly) };
      });
      this.district = Z.unflat(G.district);
      this.pois = G.pois.map(p => ({ name: G.names[p[0]], x: p[1] / 10, z: p[2] / 10, kind: p[3] }));
      this.roadHash = new SpatialHash(16);
      for (const r of this.roads) {
        for (let i = 1; i < r.pts.length; i++) {
          const a = r.pts[i - 1], b = r.pts[i], h = r.w / 2 + 1;
          this.roadHash.insert({ r, a, b }, Math.min(a[0], b[0]) - h, Math.min(a[1], b[1]) - h, Math.max(a[0], b[0]) + h, Math.max(a[1], b[1]) + h);
        }
      }
      this.bHash = new SpatialHash(24);
      for (const b of this.buildings) this.bHash.insert(b, b.box[0], b.box[1], b.box[2], b.box[3]);
    }

    demAt(x, z) {
      const D = this.dem;
      const fx = Z.clamp((x - this.x0) / D.step, 0, D.cols - 1.001), fz = Z.clamp((z - this.z0) / D.step, 0, D.rows - 1.001);
      const ix = Math.floor(fx), iz = Math.floor(fz), tx = fx - ix, tz = fz - iz;
      const g = (c, r) => D.h[Z.clamp(r, 0, D.rows - 1) * D.cols + Z.clamp(c, 0, D.cols - 1)];
      const cr = (p0, p1, p2, p3, t) => p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
      const row = r => cr(g(ix - 1, r), g(ix, r), g(ix + 1, r), g(ix + 2, r), tx);
      return Math.max(0, cr(row(iz - 1), row(iz), row(iz + 1), row(iz + 2), tz));
    }

    buildHeights() {
      const G = this.G, cols = this.cols, rows = this.rows, cell = this.cell, N = cols * rows;
      const raw = Z.b64(G.dem.data);
      this.dem = { step: G.dem.step, cols: G.dem.cols, rows: G.dem.rows, h: new Float32Array(raw.length) };
      for (let i = 0; i < raw.length; i++) this.dem.h[i] = raw[i] / 4;
      const cov = this.cover;
      const BIG = 1e6;
      const dl = new Float32Array(N), dw = new Float32Array(N);
      for (let i = 0; i < N; i++) { const w = cov[i] === C.water; dl[i] = w ? 0 : BIG; dw[i] = w ? BIG : 0; }
      const chamfer = (d) => {
        const a = cell, b = cell * 1.4142;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          let v = d[i];
          if (c > 0 && d[i - 1] + a < v) v = d[i - 1] + a;
          if (r > 0) {
            if (d[i - cols] + a < v) v = d[i - cols] + a;
            if (c > 0 && d[i - cols - 1] + b < v) v = d[i - cols - 1] + b;
            if (c < cols - 1 && d[i - cols + 1] + b < v) v = d[i - cols + 1] + b;
          }
          d[i] = v;
        }
        for (let r = rows - 1; r >= 0; r--) for (let c = cols - 1; c >= 0; c--) {
          const i = r * cols + c;
          let v = d[i];
          if (c < cols - 1 && d[i + 1] + a < v) v = d[i + 1] + a;
          if (r < rows - 1) {
            if (d[i + cols] + a < v) v = d[i + cols] + a;
            if (c < cols - 1 && d[i + cols + 1] + b < v) v = d[i + cols + 1] + b;
            if (c > 0 && d[i + cols - 1] + b < v) v = d[i + cols - 1] + b;
          }
          d[i] = v;
        }
      };
      chamfer(dl);
      chamfer(dw);
      this.distWater = dl;
      const H = new Float32Array(N);
      for (let r = 0; r < rows; r++) {
        const z = this.z0 + (r + 0.5) * cell;
        for (let c = 0; c < cols; c++) {
          const x = this.x0 + (c + 0.5) * cell, i = r * cols + c, k = cov[i];
          if (k === C.water) {
            const d = dw[i];
            H[i] = -Math.min(7.5, 0.35 + d * 0.2 + Z.noise2(x * 0.05, z * 0.05, 3) * 0.6 * Z.smooth(4, 20, d));
            continue;
          }
          let h = this.demAt(x, z);
          const d = dl[i];
          const reach = k === C.sand ? 26 : k === C.wetland ? 22 : 12;
          if (d < reach) {
            const bank = 0.3 + d * (k === C.sand ? 0.06 : 0.1);
            h = Z.lerp(Math.min(h, bank + 0.6), h, Z.smooth(0, reach, d));
          }
          if (k === C.wetland) h = Math.min(h, 0.25 + Z.noise2(x * 0.08, z * 0.08, 5) * 0.5 + d * 0.03);
          let n = 0;
          if (k === C.rock) n = Z.fbm(x * 0.09, z * 0.09, 3, 11) * 3.2;
          else if (k === C.wood || k === C.scrub) n = (Z.fbm(x * 0.03, z * 0.03, 3, 7) - 0.5) * 1.4;
          else if (k === C.grass || k === C.field || k === C.none) n = (Z.fbm(x * 0.025, z * 0.025, 3, 9) - 0.5) * 1.0;
          else if (k === C.sand) n = (Z.noise2(x * 0.06, z * 0.06, 13) - 0.5) * 0.3;
          H[i] = Math.max(0.15, h + n * Z.smooth(0, 6, d));
        }
      }
      this.cellH = H;
      this.applyCliffs();
      this.applyRoads();
      this.applyBuildings();
      this.applyEdits();
      const vc = cols + 1, vr = rows + 1;
      const V = new Float32Array(vc * vr);
      for (let r = 0; r < vr; r++) for (let c = 0; c < vc; c++) {
        let s = 0, n = 0;
        for (let dr = -1; dr <= 0; dr++) for (let dc = -1; dc <= 0; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
          s += H[rr * cols + cc]; n++;
        }
        V[r * vc + c] = s / n;
      }
      this.vcols = vc;
      this.vrows = vr;
      this.h = V;
    }

    cellIndex(x, z) {
      const c = Math.floor((x - this.x0) / this.cell), r = Math.floor((z - this.z0) / this.cell);
      if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
      return r * this.cols + c;
    }

    forCells(x0, z0, x1, z1, fn) {
      const c0 = Math.max(0, Math.floor((x0 - this.x0) / this.cell)), c1 = Math.min(this.cols - 1, Math.floor((x1 - this.x0) / this.cell));
      const r0 = Math.max(0, Math.floor((z0 - this.z0) / this.cell)), r1 = Math.min(this.rows - 1, Math.floor((z1 - this.z0) / this.cell));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) fn(r * this.cols + c, this.x0 + (c + 0.5) * this.cell, this.z0 + (r + 0.5) * this.cell);
    }

    applyCliffs() {
      const H = this.cellH, cov = this.cover;
      for (const cl of this.cliffs) {
        if (cl.k !== 'c') continue;
        const pts = cl.pts;
        const sideSample = (sign, d0, d1) => {
          const vals = [];
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i];
            const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
            const nx = dz / L * sign, nz = -dx / L * sign;
            for (let t = 0; t <= 1; t += 0.25) for (let d = d0; d <= d1; d += 2) {
              const k = this.cellIndex(a[0] + dx * t + nx * d, a[1] + dz * t + nz * d);
              if (k >= 0 && cov[k] !== C.water) vals.push(H[k]);
            }
          }
          vals.sort((p, q) => p - q);
          return vals.length ? vals[Math.floor(vals.length / 2)] : null;
        };
        const top = sideSample(-1, 3, 10), bot = sideSample(1, 3, 12);
        if (top === null) continue;
        let low = bot === null ? 0.3 : bot;
        if (top - low < 4) low = Math.max(0.3, top - Z.clamp(top * 0.5, 4, 9));
        const box = Z.polyBox(pts);
        this.forCells(box[0] - 12, box[1] - 12, box[2] + 12, box[3] + 12, (i, x, z) => {
          if (cov[i] === C.water) return;
          let best = null;
          for (let s = 1; s < pts.length; s++) {
            const q = Z.segDist(x, z, pts[s - 1][0], pts[s - 1][1], pts[s][0], pts[s][1]);
            if (!best || q.d < best.d) { best = q; best.s = s; }
          }
          if (!best || best.d > 11) return;
          const a = pts[best.s - 1], b = pts[best.s];
          const side = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]);
          if (side < 0) {
            if (best.d < 4) H[i] = Math.max(H[i], top);
          } else {
            const f = Z.smooth(0.4, 5, best.d);
            const target = Z.lerp(top - (top - low) * 0.12, low, f);
            H[i] = Math.min(H[i], Z.lerp(H[i], target, 1 - Z.smooth(6, 11, best.d)));
            cov[i] = cov[i] === C.sand || cov[i] === C.wetland ? cov[i] : best.d < 3.5 ? C.rock : cov[i];
          }
        });
      }
    }

    applyRoads() {
      const H = this.cellH, cov = this.cover;
      const weight = new Float32Array(H.length);
      const target = new Float32Array(H.length);
      const SMOOTH = { P: 14, S: 12, T: 10, R: 8, W: 8, V: 8, K: 6 };
      this.roadMask = new Uint8Array(H.length);
      for (const r of this.roads) {
        if (r.bridge || !SMOOTH[r.k]) continue;
        const pts = r.pts, L = Z.polyLen(pts);
        if (L < 1) continue;
        const n = Math.max(2, Math.ceil(L / 2));
        const hs = new Float32Array(n + 1), ps = [];
        for (let i = 0; i <= n; i++) {
          const p = Z.alongPoly(pts, L * i / n);
          ps.push(p);
          const k = this.cellIndex(p.x, p.z);
          hs[i] = k >= 0 ? H[k] : 0;
        }
        const win = Math.max(1, Math.round(SMOOTH[r.k] / (L / n)));
        const sm = new Float32Array(n + 1);
        for (let i = 0; i <= n; i++) {
          let s = 0, c = 0;
          for (let j = Math.max(0, i - win); j <= Math.min(n, i + win); j++) { s += hs[j]; c++; }
          sm[i] = Math.max(0.35, s / c);
        }
        r.hs = sm;
        r.len = L;
        const half = r.w / 2, sh = r.k === 'K' ? 1.5 : 3;
        const cum = [0];
        for (let j = 1; j < pts.length; j++) cum.push(cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i];
          this.forCells(Math.min(a[0], b[0]) - half - sh, Math.min(a[1], b[1]) - half - sh, Math.max(a[0], b[0]) + half + sh, Math.max(a[1], b[1]) + half + sh, (k, x, z) => {
            if (cov[k] === C.water) return;
            const q = Z.segDist(x, z, a[0], a[1], b[0], b[1]);
            if (q.d > half + sh) return;
            const w = 1 - Z.smooth(half, half + sh, q.d);
            if (w <= weight[k]) return;
            const s = cum[i - 1] + q.t * (cum[i] - cum[i - 1]);
            const fi = Z.clamp(s / L * n, 0, n), i0 = Math.floor(fi), i1 = Math.min(n, i0 + 1);
            weight[k] = w;
            target[k] = Z.lerp(sm[i0], sm[i1], fi - i0);
            if (q.d <= half + 0.5) this.roadMask[k] = r.k === 'K' ? 2 : 1;
          });
        }
      }
      for (let i = 0; i < H.length; i++) if (weight[i] > 0) H[i] = Z.lerp(H[i], target[i], weight[i]);
    }

    applyBuildings() {
      const H = this.cellH, cov = this.cover;
      for (const b of this.buildings) {
        let s = 0, n = 0, mn = Infinity, mx = -Infinity;
        this.forCells(b.box[0], b.box[1], b.box[2], b.box[3], (k, x, z) => {
          if (!Z.pointInPoly(x, z, b.poly)) return;
          s += H[k]; n++;
          if (H[k] < mn) mn = H[k];
          if (H[k] > mx) mx = H[k];
        });
        if (!n) { const k = this.cellIndex(b.c[0], b.c[1]); mn = mx = s = k >= 0 ? H[k] : 0.5; n = 1; }
        const pad = Math.max(0.4, s / n);
        b.ground = pad;
        b.low = Math.max(0, mn);
        b.high = mx;
        const grow = 2.5;
        this.forCells(b.box[0] - grow - 3, b.box[1] - grow - 3, b.box[2] + grow + 3, b.box[3] + grow + 3, (k, x, z) => {
          if (cov[k] === C.water) return;
          let d = 0;
          if (!Z.pointInPoly(x, z, b.poly)) {
            d = Infinity;
            for (let i = 0; i < b.poly.length; i++) {
              const p = b.poly[i], q = b.poly[(i + 1) % b.poly.length];
              const e = Z.segDist(x, z, p[0], p[1], q[0], q[1]).d;
              if (e < d) d = e;
            }
          }
          if (d > grow + 3) return;
          const w = 1 - Z.smooth(grow, grow + 3, d);
          H[k] = Z.lerp(H[k], pad, w);
        });
      }
    }

    applyEdits() {
      const H = this.cellH, cov = this.cover;
      for (const e of Z.TERRAIN_EDITS || []) {
        const soft = e.soft === undefined ? 4 : e.soft;
        if (e.t === 'pad' || e.t === 'rect') {
          const hx = e.t === 'pad' ? e.r : e.sx / 2, hz = e.t === 'pad' ? e.r : e.sz / 2;
          const c = Math.cos(e.yaw || 0), s = Math.sin(e.yaw || 0), R = Math.hypot(hx, hz) + soft;
          const inside = (x, z) => {
            const dx = x - e.x, dz = z - e.z;
            if (e.t === 'pad') return Math.max(0, Math.hypot(dx, dz) - e.r);
            const u = Math.abs(dx * c + dz * s) - hx, v = Math.abs(-dx * s + dz * c) - hz;
            return Math.hypot(Math.max(u, 0), Math.max(v, 0));
          };
          let y = e.y;
          if (y === undefined) {
            let sum = 0, n = 0;
            this.forCells(e.x - R, e.z - R, e.x + R, e.z + R, (k, x, z) => { if (inside(x, z) === 0 && cov[k] !== C.water) { sum += H[k]; n++; } });
            y = n ? sum / n : 0.5;
          }
          e.yUsed = y;
          this.forCells(e.x - R, e.z - R, e.x + R, e.z + R, (k, x, z) => {
            const d = inside(x, z);
            if (d > soft) return;
            if (cov[k] === C.water && !e.fill) return;
            const w = 1 - Z.smooth(0, Math.max(0.01, soft), d);
            H[k] = Z.lerp(H[k], y, w);
            if (e.cover !== undefined && d === 0) cov[k] = C[e.cover];
          });
        } else if (e.t === 'mound') {
          this.forCells(e.x - e.r, e.z - e.r, e.x + e.r, e.z + e.r, (k, x, z) => {
            const d = Math.hypot(x - e.x, z - e.z) / e.r;
            if (d >= 1) return;
            const f = 0.5 + 0.5 * Math.cos(d * Math.PI);
            H[k] += e.h * f;
            if (e.cover !== undefined && d < 0.9) cov[k] = C[e.cover];
          });
        } else if (e.t === 'cover') {
          const b = Z.polyBox(e.poly);
          this.forCells(b[0], b[1], b[2], b[3], (k, x, z) => { if (cov[k] !== C.water && Z.pointInPoly(x, z, e.poly)) cov[k] = C[e.cover]; });
        }
      }
    }

    groundH(x, z) {
      const fx = (x - this.x0) / this.cell, fz = (z - this.z0) / this.cell;
      const ix = Math.floor(fx), iz = Math.floor(fz);
      if (ix < 0 || iz < 0 || ix >= this.vcols - 1 || iz >= this.vrows - 1) return 0;
      const tx = fx - ix, tz = fz - iz, vc = this.vcols, V = this.h, i = iz * vc + ix;
      if (tx + tz <= 1) return V[i] + (V[i + 1] - V[i]) * tx + (V[i + vc] - V[i]) * tz;
      return V[i + vc + 1] + (V[i + vc] - V[i + vc + 1]) * (1 - tx) + (V[i + 1] - V[i + vc + 1]) * (1 - tz);
    }

    normal(x, z) {
      const e = this.cell;
      const nx = this.groundH(x - e, z) - this.groundH(x + e, z), nz = this.groundH(x, z - e) - this.groundH(x, z + e);
      const L = Math.hypot(nx, 2 * e, nz);
      return [nx / L, 2 * e / L, nz / L];
    }

    coverAt(x, z) {
      const k = this.cellIndex(x, z);
      return k < 0 ? C.none : this.cover[k];
    }

    waterDepth(x, z) { return Math.max(0, Z.WATER_Y - this.groundH(x, z)); }

    roadAt(x, z) {
      let best = null;
      for (const s of this.roadHash.at(x, z)) {
        const q = Z.segDist(x, z, s.a[0], s.a[1], s.b[0], s.b[1]);
        if (q.d <= s.r.w / 2 && (!best || q.d < best.d)) best = { r: s.r, d: q.d };
      }
      return best;
    }

    buildingAt(x, z, pad = 0) {
      for (const b of this.bHash.at(x, z)) {
        if (x < b.box[0] - pad || x > b.box[2] + pad || z < b.box[1] - pad || z > b.box[3] + pad) continue;
        if (Z.pointInPoly(x, z, b.poly)) return b;
      }
      return null;
    }

    inDistrict(x, z) { return Z.pointInPoly(x, z, this.district); }
  }

  Z.WorldMap = WorldMap;
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
