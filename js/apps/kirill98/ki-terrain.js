(function (K) {
  'use strict';

  const N = K.MAP.samples, STEP = K.MAP.step, SIZE = K.MAP.size, CHUNK = 32;
  const P = K.Places;

  const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const cosFall = (d, r, fall) => d <= r ? 1 : d >= r + fall ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * (d - r) / fall);
  const dist = (x, z, ax, az) => Math.hypot(x - ax, z - az);
  const rectDist = (x, z, x0, z0, x1, z1) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));

  const hash = (ix, iz, s) => {
    let h = (Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iz | 0, 0x165667b1) ^ Math.imul(s | 0, 0x9e3779b9)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  const vnoise = (x, z, s) => {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash(ix, iz, s), b = hash(ix + 1, iz, s), c = hash(ix, iz + 1, s), d = hash(ix + 1, iz + 1, s);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
  };

  const fbm = (x, z, s, oct) => {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * vnoise(x * f, z * f, s + i * 17);
      norm += amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return sum / norm;
  };

  const monotone = pts => {
    const n = pts.length, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * a * d[i];
        m[i + 1] = t * b * d[i];
      }
    }
    return x => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0;
      while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  };

  const base = monotone([[0, 245], [40, 215], [105, 140], [150, 112], [200, 85], [250, 58], [330, 30], [420, 18], [650, 0], [1536, 0]]);
  const amp = z => 1.2 + 4.5 * smooth((820 - z) / 420) + 26 * smooth((95 - z) / 80);

  const polyline = pts => {
    const segs = [];
    let s = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = Math.hypot(bx - ax, bz - az);
      segs.push({ ax, az, bx, bz, len, s0: s, tx: (bx - ax) / len, tz: (bz - az) / len });
      s += len;
    }
    return { pts, segs, length: s };
  };

  const nearest = (line, x, z) => {
    let best = Infinity, bs = 0, bt = null;
    for (const g of line.segs) {
      let t = ((x - g.ax) * g.tx + (z - g.az) * g.tz);
      t = t < 0 ? 0 : t > g.len ? g.len : t;
      const px = g.ax + g.tx * t, pz = g.az + g.tz * t, d = Math.hypot(x - px, z - pz);
      if (d < best) { best = d; bs = g.s0 + t; bt = g; }
    }
    return { d: best, s: bs, seg: bt };
  };

  const pointAt = (line, s) => {
    for (const g of line.segs) {
      if (s <= g.s0 + g.len || g === line.segs[line.segs.length - 1]) {
        const t = Math.max(0, Math.min(g.len, s - g.s0));
        return { x: g.ax + g.tx * t, z: g.az + g.tz * t, tx: g.tx, tz: g.tz };
      }
    }
    return null;
  };

  const GROUND = Object.freeze(['meadow', 'field', 'forest', 'dirt', 'gravel', 'cobble', 'rock', 'scree', 'snow', 'mud', 'sand', 'plough']);
  const ROAD_MAT = Object.freeze({ tract: 4, street: 5, bridge: 5, road: 3, path: 3, trail: 3, goat: 7 });
  const ROAD_STYLE = Object.freeze({ tract: { id: 0, verge: 1.4, mat: 4 }, road: { id: 1, verge: 1.2, mat: 3 }, street: { id: 2, verge: 0.5, mat: 5 }, path: { id: 3, verge: 0.9, mat: 3 }, trail: { id: 4, verge: 0.8, mat: 3 }, goat: { id: 5, verge: 0.6, mat: 7 } });
  const DITCH = Object.freeze({ from: 0.7, to: 2.6, depth: 0.38 });

  const zoneAt = (x, z, riverX) => z < 330 ? 4 : z > 1200 ? 1 : x < riverX(z) ? 3 : 2;

  function build(seed) {
    const sd = seed === undefined ? 1998 : seed;
    const river = polyline(P.RIVER.pts);
    const riverX = z => {
      const pts = P.RIVER.pts;
      if (z <= pts[0][1]) return pts[0][0];
      for (let i = 0; i < pts.length - 1; i++) {
        if (z <= pts[i + 1][1]) return pts[i][0] + (pts[i + 1][0] - pts[i][0]) * (z - pts[i][1]) / (pts[i + 1][1] - pts[i][1]);
      }
      return pts[pts.length - 1][0];
    };

    const lakeLevel = Math.max(P.RIVER.floor, base(P.RIVER.pts[0][1]) - 1.0);
    const natural = (x, z) => {
      let h = base(z) + amp(z) * fbm(x / 150, z / 150, sd, 4);
      const rim = smooth((140 - Math.min(x, SIZE - x, SIZE - z)) / 140);
      if (rim > 0) {
        const gap = SIZE - z < 170 ? 1 - cosFall(Math.abs(x - 820), 40, 60) : 1;
        h += rim * gap * (38 + 22 * fbm(x / 90, z / 90, sd + 9, 3));
      }
      const pal = P.PALACE;
      h += (pal.h - h) * cosFall(rectDist(x, z, pal.x0 - 20, pal.z0 - 20, pal.x1 + 20, pal.z1 + 20), 0, 240);
      h += (35 - h) * cosFall(dist(x, z, 1240, 392), 20, 190);
      h += (12 - h) * cosFall(dist(x, z, 330, 700), 55, 150);
      const sw = P.SWAMP, ws = cosFall(dist(x, z, sw.at[0], sw.at[1]), sw.r, sw.fall);
      if (ws > 0) h += (sw.ground + 0.9 * fbm(x / 18, z / 18, sd + 5, 2) - h) * ws;
      h -= Math.max(0, h - 80) * cosFall(dist(x, z, 650, 200), 22, 60);
      const lk = P.RIVER.lake, ld = dist(x, z, lk.at[0], lk.at[1]), lw = cosFall(ld, lk.r, 14);
      if (lw > 0) h += ((ld < lk.r ? lakeLevel - lk.depth * (1 - (ld / lk.r) * (ld / lk.r)) : lakeLevel + 0.7) - h) * lw;
      h += (P.FORT.h - h) * cosFall(dist(x, z, P.FORT.at[0], P.FORT.at[1]), P.FORT.r, 22);
      h += (0.3 - h) * cosFall(rectDist(x, z, 785, 1240, 1010, 1470), 0, 40);
      h += (0.3 - h) * cosFall(dist(x, z, 750, 1325), 10, 20);
      h += (2 - h) * cosFall(dist(x, z, 1310, 1010), 60, 60);
      return h;
    };

    const H = new Float32Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) H[j * N + i] = natural(i * STEP, j * STEP);

    const roadMask = new Float32Array(N * N), roadMat = new Uint8Array(N * N).fill(3);
    const profiles = {};
    const bestD = new Float32Array(N * N).fill(Infinity), bestH = new Float32Array(N * N);
    for (const road of P.ROADS) {
      const kind = P.KINDS[road.kind];
      const line = polyline(road.pts);
      const n = Math.max(2, Math.ceil(line.length / 2) + 1), ds = line.length / (n - 1);
      const raw = new Float32Array(n), prof = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const p = pointAt(line, i * ds);
        raw[i] = natural(p.x, p.z);
      }
      for (let i = 0; i < n; i++) {
        let sum = 0, c = 0;
        for (let k = Math.max(0, i - 6); k <= Math.min(n - 1, i + 6); k++) { sum += raw[k]; c++; }
        prof[i] = sum / c;
      }
      const landings = [];
      for (let v = 1; v < road.pts.length - 1; v++) {
        const a = line.segs[v - 1], b = line.segs[v];
        if (a.tx * b.tx + a.tz * b.tz < -0.2) landings.push({ x: road.pts[v][0], z: road.pts[v][1], s: b.s0 });
      }
      if (kind.grade > 0) {
        const g = Math.tan(kind.grade * Math.PI / 180) * ds;
        for (let i = n - 2; i >= 0; i--) prof[i] = Math.min(prof[i + 1] + g, Math.max(prof[i + 1] - g, prof[i]));
        for (let i = 1; i < n; i++) prof[i] = Math.min(prof[i - 1] + g, Math.max(prof[i - 1] - g, prof[i]));
      }
      for (const L of landings) L.h = prof[Math.max(0, Math.min(n - 1, Math.round(L.s / ds)))];
      profiles[road.id] = { line, ds, raw, prof, landings };
      if (kind.deck || kind.wet) continue;
      const half = kind.width / 2, shoulder = 6, reach = half + shoulder, touched = [];
      for (const g of line.segs) {
        const i0 = Math.max(0, Math.floor((Math.min(g.ax, g.bx) - reach) / STEP)), i1 = Math.min(N - 1, Math.ceil((Math.max(g.ax, g.bx) + reach) / STEP));
        const j0 = Math.max(0, Math.floor((Math.min(g.az, g.bz) - reach) / STEP)), j1 = Math.min(N - 1, Math.ceil((Math.max(g.az, g.bz) + reach) / STEP));
        for (let j = j0; j <= j1; j++) {
          for (let i = i0; i <= i1; i++) {
            const x = i * STEP, z = j * STEP;
            let t = (x - g.ax) * g.tx + (z - g.az) * g.tz;
            t = t < 0 ? 0 : t > g.len ? g.len : t;
            const d = Math.hypot(x - (g.ax + g.tx * t), z - (g.az + g.tz * t));
            if (d > reach) continue;
            const k = j * N + i;
            if (bestD[k] === Infinity) touched.push(k);
            if (d < bestD[k]) {
              const f = (g.s0 + t) / ds, a = Math.min(n - 2, Math.floor(f)), b = f - a;
              bestD[k] = d;
              bestH[k] = prof[a] * (1 - b) + prof[a + 1] * b;
            }
          }
        }
      }
      for (const k of touched) {
        const d = bestD[k];
        const w = cosFall(d, Math.max(half + 0.5, 2.5), shoulder);
        H[k] += (bestH[k] - H[k]) * w;
        if (road.kind === 'tract' && d > half + DITCH.from && d < half + DITCH.to) H[k] -= DITCH.depth * Math.sin(Math.PI * (d - half - DITCH.from) / (DITCH.to - DITCH.from));
        const m = cosFall(d, half - 0.3, 1.2);
        if (m > roadMask[k]) { roadMask[k] = m; roadMat[k] = ROAD_MAT[road.kind] === undefined ? 3 : ROAD_MAT[road.kind]; }
        bestD[k] = Infinity;
      }
      for (const L of landings) {
        const r = 6, reach2 = r + shoulder;
        for (let j = Math.max(0, Math.floor((L.z - reach2) / STEP)); j <= Math.min(N - 1, Math.ceil((L.z + reach2) / STEP)); j++) {
          for (let i = Math.max(0, Math.floor((L.x - reach2) / STEP)); i <= Math.min(N - 1, Math.ceil((L.x + reach2) / STEP)); i++) {
            const k = j * N + i, w = cosFall(dist(i * STEP, j * STEP, L.x, L.z), r, shoulder);
            if (w > 0) H[k] += (L.h - H[k]) * w;
          }
        }
      }
    }

    const R = P.RIVER;
    const fordS = nearest(river, R.ford.at[0], R.ford.at[1]).s;
    const mountainW = z => smooth((R.mountainUntil + 60 - z) / 120);
    const cascadeEnd = nearest(river, R.cascade.until[0], R.cascade.until[1]).s;
    const steps = [];
    for (let s = R.cascade.step; s < cascadeEnd - R.cascade.step * 0.5; s += R.cascade.step) steps.push(s);
    steps.push(cascadeEnd);
    const natLevel = s => Math.max(R.floor, base(pointAt(river, s).z) - 1.0);
    const levelAt = s => s < cascadeEnd ? natLevel(Math.floor(Math.max(0, s) / R.cascade.step) * R.cascade.step) : natLevel(s);
    const falls = steps.filter(s => levelAt(s - 0.05) - levelAt(s + 0.05) > 0.3);
    steps.length = 0;
    steps.push(...falls);
    const halfAt = s => {
      const p = pointAt(river, s), m = mountainW(p.z);
      return R.half + (R.mountainHalf - R.half) * m;
    };
    const depthAt = s => {
      const p = pointAt(river, s), m = mountainW(p.z);
      const dep = R.depth + (R.mountainDepth - R.depth) * m;
      const f = cosFall(Math.abs(s - fordS), R.ford.len / 2, 6);
      return dep + (R.ford.depth - dep) * f;
    };
    const riverD = new Float32Array(N * N).fill(40), riverS = new Float32Array(N * N);
    {
      const reach = R.half + 11;
      for (const g of river.segs) {
        const i0 = Math.max(0, Math.floor((Math.min(g.ax, g.bx) - reach) / STEP)), i1 = Math.min(N - 1, Math.ceil((Math.max(g.ax, g.bx) + reach) / STEP));
        const j0 = Math.max(0, Math.floor((Math.min(g.az, g.bz) - reach) / STEP)), j1 = Math.min(N - 1, Math.ceil((Math.max(g.az, g.bz) + reach) / STEP));
        for (let j = j0; j <= j1; j++) {
          for (let i = i0; i <= i1; i++) {
            const x = i * STEP, z = j * STEP;
            let t = (x - g.ax) * g.tx + (z - g.az) * g.tz;
            t = t < 0 ? 0 : t > g.len ? g.len : t;
            const d = Math.hypot(x - (g.ax + g.tx * t), z - (g.az + g.tz * t)), k = j * N + i;
            if (d < riverD[k]) { riverD[k] = d; riverS[k] = g.s0 + t; }
          }
        }
      }
      for (let k = 0; k < N * N; k++) {
        const d = riverD[k];
        if (d >= R.half + 11 || (riverS[k] < cascadeEnd && d >= R.mountainHalf + 6)) continue;
        const s = riverS[k], hw = halfAt(s), L = levelAt(s), bed = L - depthAt(s), top = L + 0.5, h = H[k];
        const ford = cosFall(Math.abs(s - fordS), R.ford.len / 2, 6), ramp = (s < cascadeEnd ? 1.8 : 3) + 6 * ford, edge = hw - 2 + ramp, top2 = top - 0.3 * ford;
        let target;
        if (d <= hw - 2) target = bed;
        else if (d <= edge) target = bed + (top2 - bed) * smooth((d - (hw - 2)) / ramp);
        else if (d <= edge + (s < cascadeEnd ? 4 : 9)) target = top2 + (h - top2) * smooth((d - edge) / (s < cascadeEnd ? 4 : 9));
        else target = h;
        H[k] = target;
      }
    }

    const at = (i, j) => H[Math.max(0, Math.min(N - 1, j)) * N + Math.max(0, Math.min(N - 1, i))];
    const heightAt = (x, z) => {
      const fx = Math.max(0, Math.min(N - 1.0001, x / STEP)), fz = Math.max(0, Math.min(N - 1.0001, z / STEP));
      const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
      const a = H[j * N + i], b = H[j * N + i + 1], c = H[(j + 1) * N + i], d = H[(j + 1) * N + i + 1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
    const normalAt = (x, z) => {
      const e = STEP;
      const dx = (heightAt(x + e, z) - heightAt(x - e, z)) / (2 * e), dz = (heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e);
      const l = Math.hypot(dx, 1, dz);
      return [-dx / l, 1 / l, -dz / l];
    };

    const swamp = P.SWAMP;
    const lake = R.lake;
    const cascadeAt = (x, z) => { const r = nearest(river, x, z); return r.s < cascadeEnd && r.d <= halfAt(r.s) + 0.5; };
    const waterAt = (x, z) => {
      if (dist(x, z, lake.at[0], lake.at[1]) <= lake.r + 0.5) return lakeLevel;
      const r = nearest(river, x, z);
      if (r.d <= halfAt(r.s) + 1) return levelAt(r.s);
      if (dist(x, z, swamp.at[0], swamp.at[1]) <= swamp.reach) return swamp.level;
      return -Infinity;
    };
    const flowAt = (x, z) => {
      const r = nearest(river, x, z);
      if (r.d > halfAt(r.s) + 1) return [0, 0];
      const v = 0.6 + 0.6 * mountainW(pointAt(river, r.s).z);
      return [r.seg.tx * v, r.seg.tz * v];
    };

    const deckTop = Math.max(heightAt(753, 1325), heightAt(789, 1325)) + 0.15;

    const COL = {
      fields: [0.45, 0.52, 0.29], meadow: [0.43, 0.53, 0.27], forest: [0.25, 0.34, 0.17], mountain: [0.41, 0.42, 0.31],
      rock: [0.47, 0.46, 0.44], snow: [0.9, 0.91, 0.94], road: [0.57, 0.49, 0.35], bed: [0.35, 0.32, 0.26], swamp: [0.28, 0.32, 0.19], town: [0.53, 0.48, 0.37]
    };
    const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const NRM = new Float32Array(N * N * 3), COLS = new Float32Array(N * N * 3);
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const k = j * N + i, x = i * STEP, z = j * STEP;
        const dx = (at(i + 1, j) - at(i - 1, j)) / (2 * STEP), dz = (at(i, j + 1) - at(i, j - 1)) / (2 * STEP);
        const l = Math.hypot(dx, 1, dz), ny = 1 / l;
        NRM[k * 3] = -dx / l;
        NRM[k * 3 + 1] = ny;
        NRM[k * 3 + 2] = -dz / l;
        let c = COL.meadow;
        c = mix3(c, COL.fields, smooth((z - 1180) / 50));
        c = mix3(c, COL.forest, smooth((riverX(z) - x - 15) / 30) * (1 - smooth((z - 1180) / 50)) * (1 - smooth((350 - z) / 60)));
        c = mix3(c, COL.mountain, smooth((350 - z) / 60));
        c = mix3(c, COL.town, cosFall(rectDist(x, z, 785, 1240, 1010, 1470), 0, 25) * 0.6);
        c = mix3(c, COL.swamp, cosFall(dist(x, z, swamp.at[0], swamp.at[1]), swamp.r, swamp.fall));
        c = mix3(c, COL.rock, smooth((0.86 - ny) / 0.12));
        c = mix3(c, COL.snow, smooth((H[k] - 200) / 15) * smooth((ny - 0.6) / 0.1));
        c = mix3(c, COL.road, roadMask[k] * 0.9);
        if (riverD[k] < 40 && riverD[k] <= halfAt(riverS[k])) c = mix3(c, COL.bed, 0.85);
        COLS[k * 3] = c[0];
        COLS[k * 3 + 1] = c[1];
        COLS[k * 3 + 2] = c[2];
      }
    }

    const chunk = (cx, cz, step) => {
      const q = CHUNK / step, row = q + 1, nv = row * row + 4 * row, data = new Float32Array(nv * 9);
      let minY = Infinity, maxY = -Infinity, o = 0;
      const put = (i, j, drop) => {
        const k = j * N + i;
        const y = H[k] - drop;
        data[o++] = i * STEP; data[o++] = y; data[o++] = j * STEP;
        data[o++] = NRM[k * 3]; data[o++] = NRM[k * 3 + 1]; data[o++] = NRM[k * 3 + 2];
        data[o++] = COLS[k * 3]; data[o++] = COLS[k * 3 + 1]; data[o++] = COLS[k * 3 + 2];
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      };
      const i0 = cx * CHUNK, j0 = cz * CHUNK;
      for (let b = 0; b <= q; b++) for (let a = 0; a <= q; a++) put(i0 + a * step, j0 + b * step, 0);
      for (let a = 0; a <= q; a++) put(i0 + a * step, j0, 6);
      for (let a = 0; a <= q; a++) put(i0 + q * step, j0 + a * step, 6);
      for (let a = 0; a <= q; a++) put(i0 + a * step, j0 + q * step, 6);
      for (let a = 0; a <= q; a++) put(i0, j0 + a * step, 6);
      return { data, minY, maxY, x0: i0 * STEP, z0: j0 * STEP, size: CHUNK * STEP };
    };

    const chunkIndices = step => {
      const q = CHUNK / step, row = q + 1, idx = [];
      for (let b = 0; b < q; b++) {
        for (let a = 0; a < q; a++) {
          const v = b * row + a;
          idx.push(v, v + row, v + 1, v + 1, v + row, v + row + 1);
        }
      }
      const borders = [a => a, a => a * row + q, a => q * row + a, a => a * row];
      for (let e = 0; e < 4; e++) {
        const start = row * row + e * row;
        for (let a = 0; a < q; a++) {
          const b0 = borders[e](a), b1 = borders[e](a + 1), s0 = start + a, s1 = start + a + 1;
          idx.push(b0, s0, b1, b1, s0, s1);
        }
      }
      return new Uint16Array(idx);
    };

    const waterMesh = () => {
      const out = [], len = river.length, bridgeS = nearest(river, 771, 1325).s;
      const fordW = s => cosFall(Math.abs(s - fordS), R.ford.len / 2, 6);
      const foamAt = s => {
        let f = fordW(s) * 0.4 + cosFall(Math.abs(s - bridgeS), 3, 6) * 0.8 + cosFall(s, 2, 6) * 0.3;
        for (const st of steps) if (s >= st) f = Math.max(f, Math.exp(-(s - st) / 5));
        return Math.min(1, f);
      };
      const row = s => {
        const p = pointAt(river, s);
        return { p, s, hw: halfAt(s) + 1, y: levelAt(s), dep: depthAt(s), foam: foamAt(s), speed: 0.6 + 0.6 * mountainW(p.z) + 0.6 * fordW(s) + (s < cascadeEnd ? 0.8 : 0), ang: Math.atan2(p.tz, p.tx) };
      };
      const vert = (r, side, kind) => { const w = kind === 3 ? r.hw - 1.6 : r.s < cascadeEnd ? r.hw - 1.2 : r.hw; out.push(r.p.x - r.p.tz * w * side, r.y, r.p.z + r.p.tx * w * side, r.s, w * side, r.hw - 1, r.dep, kind, r.speed, r.foam, r.ang); };
      const ss = [];
      for (let s = 0; s < len; s += 2) if (!steps.some(st => s > st - 0.1 && s < st + 0.75)) ss.push(s);
      for (const st of steps) ss.push(st - 0.02, st + 0.7);
      ss.push(len);
      ss.sort((a, b) => a - b);
      let prev = null;
      for (const s of ss) {
        if (prev && s - prev.s < 0.01) continue;
        const cur = row(s);
        if (prev) {
          const kind = prev.y - cur.y > 0.3 && steps.some(st => prev.s < st && cur.s > st) ? 3 : 0;
          vert(prev, 1, kind); vert(cur, 1, kind); vert(prev, -1, kind);
          vert(prev, -1, kind); vert(cur, 1, kind); vert(cur, -1, kind);
        }
        prev = cur;
      }
      const disc = (cx, cz, y, r, depth, kind, speed) => {
        const seg = 48, R1 = r + 1.5;
        for (let i = 0; i < seg; i++) {
          const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
          out.push(cx, y, cz, 0, 0, r, depth, kind, speed, 0, 0);
          out.push(cx + Math.cos(a0) * R1, y, cz + Math.sin(a0) * R1, 0, R1, r, depth, kind, speed, 0, 0);
          out.push(cx + Math.cos(a1) * R1, y, cz + Math.sin(a1) * R1, 0, R1, r, depth, kind, speed, 0, 0);
        }
      };
      disc(lake.at[0], lake.at[1], lakeLevel, lake.r, lake.depth, 1, 0.04);
      disc(swamp.at[0], swamp.at[1], swamp.level, swamp.reach, Math.max(0.3, swamp.level - swamp.ground + 0.1), 2, 0);
      return new Float32Array(out);
    };
    const WATER_LAYOUT = [3, 4, 4];

    const spots = P.SPOTS.slice().sort((a, b) => a.r - b.r);
    const spotAt = (x, z) => spots.find(s => dist(x, z, s.at[0], s.at[1]) <= s.r) || null;

    const SHADE = new Float32Array(N * N).fill(1), CANOPY = new Float32Array(N * N);
    let groundCache = null;
    const shade = (mask, amount) => {
      groundCache = null;
      for (let k = 0; k < N * N; k++) {
        const f = 1 - amount * Math.min(1, mask[k]);
        SHADE[k] *= f;
        CANOPY[k] = Math.max(CANOPY[k], Math.min(1, mask[k]));
        COLS[k * 3] *= f;
        COLS[k * 3 + 1] *= f;
        COLS[k * 3 + 2] *= f;
      }
    };

    const meshHeightAt = (x, z) => {
      const fx = Math.max(0, Math.min(N - 1.001, x / STEP)), fz = Math.max(0, Math.min(N - 1.001, z / STEP)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
      const a = H[j * N + i], b = H[j * N + i + 1], c = H[(j + 1) * N + i], d = H[(j + 1) * N + i + 1];
      return u + v <= 1 ? a + (b - a) * u + (c - a) * v : d + (c - d) * (1 - u) + (b - d) * (1 - v);
    };

    const roadGeometry = () => {
      const out = [], LIFT = 0.03;
      for (const r of P.ROADS) {
        const st = ROAD_STYLE[r.kind];
        if (!st) continue;
        const line = polyline(r.pts), half = P.KINDS[r.kind].width / 2, edge = half + st.verge, cols = [-edge, -half, -half * 0.45, 0, half * 0.45, half, edge];
        const tangent = s => { const a = pointAt(line, Math.max(0, s - 2.5)), b = pointAt(line, Math.min(line.length, s + 2.5)), dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
        const n = Math.max(2, Math.ceil(line.length / 1.5));
        let prev = null;
        for (let q = 0; q <= n; q++) {
          const s = line.length * q / n, p = pointAt(line, s), [tx, tz] = tangent(s), row = [];
          for (const a of cols) {
            const x = p.x - tz * a, z = p.z + tx * a, nr = normalAt(x, z);
            row.push([x, meshHeightAt(x, z) + LIFT, z, nr[0], nr[1], nr[2], a / edge, s, st.id]);
          }
          if (prev) for (let c = 0; c < cols.length - 1; c++) for (const v of [prev[c], row[c], prev[c + 1], prev[c + 1], row[c], row[c + 1]]) out.push(...v);
          prev = row;
        }
      }
      return new Float32Array(out);
    };

    const ground = () => {
      if (groundCache) return groundCache;
      const M = GROUND.length, weights = new Uint8Array(N * N * M), aux = new Uint8Array(N * N * 4), w = new Float32Array(M), TROD = new Float32Array(N * N);
      for (const B of P.BUILDINGS) {
        const r = (B.rot || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), hw = B.w / 2, hd = B.d / 2, reach = Math.hypot(hw, hd) + 4;
        for (let j = Math.max(0, Math.floor((B.z - reach) / STEP)); j <= Math.min(N - 1, Math.ceil((B.z + reach) / STEP)); j++) {
          for (let i = Math.max(0, Math.floor((B.x - reach) / STEP)); i <= Math.min(N - 1, Math.ceil((B.x + reach) / STEP)); i++) {
            const dx = i * STEP - B.x, dz = j * STEP - B.z, u = dx * c + dz * s, v = -dx * s + dz * c, d = Math.hypot(Math.max(0, Math.abs(u) - hw), Math.max(0, Math.abs(v) - hd)), k = j * N + i;
            TROD[k] = Math.max(TROD[k], cosFall(d, 2.2, 5));
          }
        }
      }
      const to = (m, a) => { if (a <= 0) return; a = Math.min(1, a); for (let q = 0; q < M; q++) w[q] *= 1 - a; w[m] += a; };
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const k = j * N + i, x = i * STEP, z = j * STEP, ny = NRM[k * 3 + 1], h = H[k];
          w.fill(0);
          w[0] = 1;
          const fieldW = smooth((z - 1180) / 50), mountW = smooth((350 - z) / 60);
          const forestW = smooth((riverX(z) - x - 15) / 30) * (1 - fieldW) * (1 - mountW);
          const n1 = fbm(x / 55, z / 55, sd + 31, 3), n2 = fbm(x / 23, z / 23, sd + 47, 2);
          to(1, fieldW);
          to(11, fieldW * smooth((n1 - 0.22) / 0.1) * (1 - cosFall(rectDist(x, z, 785, 1240, 1010, 1470), 0, 30)));
          to(1, (1 - fieldW) * (1 - forestW) * (1 - mountW) * smooth((n1 + 0.15) / 0.2) * 0.45);
          to(2, forestW);
          to(2, CANOPY[k] * 0.85);
          to(7, mountW * smooth((n2 + 0.05) / 0.25) * 0.7);
          to(3, cosFall(rectDist(x, z, 785, 1240, 1010, 1470), 0, 25) * 0.55);
          to(9, cosFall(dist(x, z, swamp.at[0], swamp.at[1]), swamp.r, swamp.fall));
          to(3, TROD[k] * 0.85);
          const rockW = smooth((0.86 - ny) / 0.12);
          to(7, smooth((0.95 - ny) / 0.08) * (1 - rockW) * (0.35 + 0.5 * mountW));
          to(6, rockW);
          to(8, smooth((h - 200) / 15) * smooth((ny - 0.6) / 0.1));
          const rd = riverD[k], hw = rd < 40 ? halfAt(riverS[k]) : 0;
          if (rd < 40) { const bm = riverS[k] < cascadeEnd + 8 ? 6 : mountainW(z) > 0.5 ? 7 : 10; to(bm, cosFall(rd, hw + 1.2, 2.5) * 0.9); if (rd <= hw) to(bm, 0.95); }
          const ldk = dist(x, z, lake.at[0], lake.at[1]);
          if (ldk < lake.r + 6) to(ldk < lake.r - 4 ? 6 : 7, cosFall(ldk, lake.r + 2, 4) * 0.9);
          to(roadMat[k], roadMask[k] * 0.97);
          let sum = 0;
          for (let q = 0; q < M; q++) sum += w[q];
          let left = 255;
          const o = k * M;
          for (let q = 0; q < M; q++) { const b = q === M - 1 ? left : Math.min(left, Math.round(w[q] / sum * 255)); weights[o + q] = b; left -= b; }
          aux[k * 4] = Math.round(Math.max(0, Math.min(1, SHADE[k])) * 255);
          aux[k * 4 + 1] = Math.round(Math.max(cosFall(rd, hw + 1, 4), cosFall(dist(x, z, swamp.at[0], swamp.at[1]), swamp.r, swamp.fall)) * 255);
          aux[k * 4 + 2] = Math.round((n1 * 0.5 + 0.5) * 255);
          aux[k * 4 + 3] = 255;
        }
      }
      groundCache = { M, weights, aux, names: GROUND };
      return groundCache;
    };
    const groundAt = (x, z) => {
      const g = ground(), i = Math.max(0, Math.min(N - 1, Math.round(x / STEP))), j = Math.max(0, Math.min(N - 1, Math.round(z / STEP))), o = (j * N + i) * g.M, out = {};
      GROUND.forEach((n, q) => { out[n] = g.weights[o + q] / 255; });
      return out;
    };

    return {
      ground, groundAt, GROUND, meshHeightAt, roadGeometry, DITCH,
      seed: sd, N, STEP, SIZE, CHUNK, H, roadMask, profiles, river, deckTop, shade,
      base, natural, heightAt, normalAt, waterAt, flowAt, levelAt, halfAt, depthAt,
      riverX, zoneAt: (x, z) => zoneAt(x, z, riverX), spotAt, chunk, chunkIndices, waterMesh, WATER_LAYOUT, lakeLevel, steps, cascadeEnd, cascadeAt,
      nearestRiver: (x, z) => nearest(river, x, z), fordS
    };
  }

  K.Terrain = { GROUND, ROAD_STYLE, build, polyline, nearest, pointAt, smooth, cosFall };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
