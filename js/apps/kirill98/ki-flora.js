(function (K) {
  'use strict';

  const P = K.Places;
  const CELL = 32, FINE = 8, CAND = 3, UCAND = 2, BAND = 6;
  const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

  const SPECIES = Object.freeze([
    Object.freeze({ id: 'pine', name: 'Сосна', h: [12, 20, 26], r: [0.18, 0.28, 0.38], crown: 0.17 }),
    Object.freeze({ id: 'spruce', name: 'Ель', h: [10, 18, 24], r: [0.16, 0.26, 0.36], crown: 0.2 }),
    Object.freeze({ id: 'birch', name: 'Берёза', h: [9, 15, 19], r: [0.1, 0.17, 0.23], crown: 0.22 }),
    Object.freeze({ id: 'oak', name: 'Дуб', h: [9, 15, 20], r: [0.2, 0.36, 0.55], crown: 0.42 }),
    Object.freeze({ id: 'alder', name: 'Ольха', h: [8, 12, 16], r: [0.12, 0.19, 0.26], crown: 0.25 }),
    Object.freeze({ id: 'linden', name: 'Липа', h: [9, 16, 21], r: [0.16, 0.28, 0.42], crown: 0.33 })
  ]);
  const VARIANTS = SPECIES.length * 3;
  const ELDER = Object.freeze({ x: 330, z: 700, r: 2, h: 46 });

  const fade = (d, R) => 1 - Math.min(1, Math.max(0, (d - (R - BAND)) / BAND));

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
  const fbm = (x, z, s) => (vnoise(x, z, s) * 0.6 + vnoise(x * 2.1, z * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, z * 4.3, s + 13) * 0.1);

  const CLEARINGS = [
    { rect: [775, 1230, 1020, 1480] }, { rect: [1120, 530, 1420, 790] },
    { at: [960, 105], r: 62 }, { at: [1240, 392], r: 32 }, { at: [1310, 1010], r: 78 }, { at: [1062, 1362], r: 22 },
    { at: [525, 1380], r: 30 }, { at: [630, 1412], r: 30 }, { at: [1160, 1400], r: 30 }, { at: [1328, 1288], r: 30 },
    { at: [340, 705], r: 34 }, { at: [520, 425], r: 16 }, { at: [172, 1058], r: 26 }, { at: [560, 300], r: 28 },
    { at: [686, 910], r: 38 }, { at: [1085, 225], r: 30 }, { at: [650, 200], r: 22 }, { at: [786, 752], r: 12 }
  ];

  const pick = (weights, r) => {
    let sum = 0;
    for (const w of weights) sum += Math.max(0, w);
    let t = r * sum;
    for (let i = 0; i < weights.length; i++) {
      t -= Math.max(0, weights[i]);
      if (t <= 0) return i;
    }
    return weights.length - 1;
  };

  function build(T, seed) {
    const sd = seed === undefined ? 1998 : seed;
    const rnd = K.rng(sd * 31 + 7);
    const N = T.N, STEP = T.STEP, SIZE = T.SIZE;

    const edge = new Float32Array(N * N).fill(99), edgeN = new Float32Array(N * N).fill(9);
    for (const road of P.ROADS) {
      const kind = P.KINDS[road.kind], half = kind.width / 2, reach = half + 16, thin = kind.cart ? 14 : 6;
      for (let s = 0; s < road.pts.length - 1; s++) {
        const [ax, az] = road.pts[s], [bx, bz] = road.pts[s + 1], len = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / len, tz = (bz - az) / len;
        const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - reach) / STEP)), i1 = Math.min(N - 1, Math.ceil((Math.max(ax, bx) + reach) / STEP));
        const j0 = Math.max(0, Math.floor((Math.min(az, bz) - reach) / STEP)), j1 = Math.min(N - 1, Math.ceil((Math.max(az, bz) + reach) / STEP));
        for (let j = j0; j <= j1; j++) {
          for (let i = i0; i <= i1; i++) {
            const x = i * STEP, z = j * STEP;
            let t = (x - ax) * tx + (z - az) * tz;
            t = t < 0 ? 0 : t > len ? len : t;
            const d = Math.hypot(x - (ax + tx * t), z - (az + tz * t)) - half, k = j * N + i;
            if (d < edge[k]) edge[k] = d;
            if (d / thin < edgeN[k]) edgeN[k] = d / thin;
          }
        }
      }
    }
    const segs = [];
    for (const road of P.ROADS) {
      const half = P.KINDS[road.kind].width / 2;
      for (let s = 0; s < road.pts.length - 1; s++) {
        const [ax, az] = road.pts[s], [bx, bz] = road.pts[s + 1], len = Math.hypot(bx - ax, bz - az);
        segs.push({ ax, az, tx: (bx - ax) / len, tz: (bz - az) / len, len, half });
      }
    }
    const edgeExact = (x, z) => {
      let best = 99;
      for (const g of segs) {
        let t = (x - g.ax) * g.tx + (z - g.az) * g.tz;
        t = t < 0 ? 0 : t > g.len ? g.len : t;
        const d = Math.hypot(x - (g.ax + g.tx * t), z - (g.az + g.tz * t)) - g.half;
        if (d < best) best = d;
      }
      return best;
    };
    const cellOf = (x, z) => Math.max(0, Math.min(N - 1, Math.round(z / STEP))) * N + Math.max(0, Math.min(N - 1, Math.round(x / STEP)));
    const edgeAt = (x, z) => edge[cellOf(x, z)];

    const footprints = [...P.BOXES, ...P.footprints(), ...P.WALLS.flatMap(P.wallBoxes)].map(b => {
      const rot = (b.rot || 0) * Math.PI / 180;
      return { x: b.x, z: b.z, hw: b.w / 2 + 2.5, hd: b.d / 2 + 2.5, c: Math.cos(rot), s: Math.sin(rot) };
    });
    const builtUp = (x, z) => {
      for (const f of footprints) {
        const dx = x - f.x, dz = z - f.z;
        if (Math.abs(dx) > f.hw + f.hd || Math.abs(dz) > f.hw + f.hd) continue;
        const u = dx * f.c + dz * f.s, v = -dx * f.s + dz * f.c;
        if (Math.abs(u) <= f.hw && Math.abs(v) <= f.hd) return true;
      }
      return false;
    };
    const cleared = (x, z) => CLEARINGS.some(c => c.rect ? x >= c.rect[0] && x <= c.rect[2] && z >= c.rect[1] && z <= c.rect[3] : Math.hypot(x - c.at[0], z - c.at[1]) < c.r);

    const density = (x, z, h) => {
      if (h > 185) return 0;
      if (T.normalAt(x, z)[1] < 0.77) return 0;
      if (Math.abs(x - T.riverX(z)) < 11) return 0;
      if (T.waterAt(x, z) > h - 0.05) return 0;
      const e = edgeAt(x, z), en = edgeN[cellOf(x, z)];
      if (e < 1.2) return 0;
      const zone = T.zoneAt(x, z), patch = fbm(x / 120, z / 120, sd + 3);
      let p;
      if (zone === 3) {
        p = (0.72 + 0.12 * patch) * (0.42 + 0.58 * smooth(en)) * (0.5 + 0.5 * smooth((1200 - z) / 60));
      } else if (zone === 4) {
        p = 0.22 * (1 - smooth((h - 110) / 70)) * (0.55 + 0.45 * patch) * (0.5 + 0.5 * smooth(en));
      } else {
        const g = fbm(x / 170 + 40, z / 170 + 40, sd + 11);
        p = 0.5 * smooth((g - 0.22) / 0.22) * (0.4 + 0.6 * smooth(en));
      }
      return p;
    };

    const DEN = new Float32Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) DEN[j * N + i] = density(i * STEP, j * STEP, T.H[j * N + i]);
    const densityAt = (x, z) => DEN[Math.max(0, Math.min(N - 1, Math.round(z / STEP))) * N + Math.max(0, Math.min(N - 1, Math.round(x / STEP)))];

    const fineCols = Math.ceil(SIZE / FINE);
    const fineHead = new Map();
    const X = [], Z = [], Y = [], YAW = [], S = [], TINT = [], V = [], RAD = [], HGT = [];
    const tooClose = (x, z) => {
      const ci = Math.floor(x / FINE), cj = Math.floor(z / FINE);
      for (let j = cj - 1; j <= cj + 1; j++) {
        for (let i = ci - 1; i <= ci + 1; i++) {
          const list = fineHead.get(j * fineCols + i);
          if (!list) continue;
          for (const t of list) if (Math.hypot(X[t] - x, Z[t] - z) < 1.7) return true;
        }
      }
      return false;
    };
    const ncand = Math.floor(SIZE / CAND);
    for (let j = 0; j < ncand; j++) {
      for (let i = 0; i < ncand; i++) {
        const x = (i + rnd()) * CAND, z = (j + rnd()) * CAND, roll = rnd(), r2 = rnd(), r3 = rnd(), r4 = rnd(), r5 = rnd(), r6 = rnd();
        if (Math.hypot(x - ELDER.x, z - ELDER.z) < 20) continue;
        if (cleared(x, z)) continue;
        const p = densityAt(x, z);
        if (p <= 0 || roll > p) continue;
        const h = T.heightAt(x, z);
        if (T.waterAt(x, z) > h - 0.05 || T.normalAt(x, z)[1] < 0.77) continue;
        if (edgeAt(x, z) < 5 && edgeExact(x, z) < 1.2) continue;
        if (builtUp(x, z) || tooClose(x, z)) continue;
        const zone = T.zoneAt(x, z);
        const wet = Math.max(smooth((70 - Math.abs(x - T.riverX(z))) / 50), smooth((170 - Math.hypot(x - P.SWAMP.at[0], z - P.SWAMP.at[1])) / 60));
        const north = smooth((640 - z) / 200), korni = smooth((190 - Math.hypot(x - 330, z - 700)) / 90);
        let w;
        if (zone === 4) w = [0.8, 0.2, 0, 0, 0, 0];
        else if (zone === 3) w = [0.14 + 0.2 * north, 0.18 + 0.32 * north, 0.16, 0.12 + 0.25 * korni - 0.08 * north, 0.06 + 0.45 * wet, 0.12 + 0.2 * korni - 0.06 * north];
        else w = [0.04, 0.04, 0.38, 0.2, 0.06 + 0.4 * wet, 0.28];
        const sp = pick(w, r2), variant = r3 < 0.28 - 0.15 * korni ? 0 : r3 < 0.8 - 0.2 * korni ? 1 : 2;
        const spc = SPECIES[sp], scale = 0.86 + 0.28 * r4;
        const t = X.length;
        X.push(x); Z.push(z); Y.push(h - 0.15); YAW.push(r5 * Math.PI * 2); S.push(scale); TINT.push(0.86 + 0.26 * r6);
        V.push(sp * 3 + variant); RAD.push(spc.r[variant] * scale); HGT.push(spc.h[variant] * scale);
        const key = Math.floor(z / FINE) * fineCols + Math.floor(x / FINE);
        if (!fineHead.has(key)) fineHead.set(key, []);
        fineHead.get(key).push(t);
      }
    }
    const count = X.length;

    const csr = (n, cols, size, xs, zs) => {
      const cells = cols * cols, start = new Int32Array(cells + 1), list = new Int32Array(n), fill = new Int32Array(cells);
      const keyOf = i => Math.min(cols - 1, Math.floor(zs[i] / size)) * cols + Math.min(cols - 1, Math.floor(xs[i] / size));
      for (let i = 0; i < n; i++) start[keyOf(i) + 1]++;
      for (let c = 0; c < cells; c++) start[c + 1] += start[c];
      for (let i = 0; i < n; i++) { const k = keyOf(i); list[start[k] + fill[k]++] = i; }
      return { cols, size, start, list };
    };
    const trees = {
      count, X: Float32Array.from(X), Z: Float32Array.from(Z), Y: Float32Array.from(Y), YAW: Float32Array.from(YAW),
      S: Float32Array.from(S), TINT: Float32Array.from(TINT), V: Uint8Array.from(V), RAD: Float32Array.from(RAD), H: Float32Array.from(HGT)
    };
    trees.cells = csr(count, Math.ceil(SIZE / CELL), CELL, trees.X, trees.Z);
    trees.fine = csr(count, fineCols, FINE, trees.X, trees.Z);

    const urnd = K.rng(sd * 17 + 3);
    const UX = [], UZ = [], UY = [], UYAW = [], US = [], UK = [];
    const nearTrunk = (x, z, gap) => {
      const f = trees.fine, ci = Math.floor(x / FINE), cj = Math.floor(z / FINE);
      for (let j = cj - 1; j <= cj + 1; j++) {
        for (let i = ci - 1; i <= ci + 1; i++) {
          if (i < 0 || j < 0 || i >= f.cols || j >= f.cols) continue;
          const c = j * f.cols + i;
          for (let q = f.start[c]; q < f.start[c + 1]; q++) {
            const t = f.list[q];
            if (Math.hypot(trees.X[t] - x, trees.Z[t] - z) < trees.RAD[t] + gap) return true;
          }
        }
      }
      return false;
    };
    const ucand = Math.floor(SIZE / UCAND);
    for (let j = 0; j < ucand; j++) {
      for (let i = 0; i < ucand; i++) {
        const x = (i + urnd()) * UCAND, z = (j + urnd()) * UCAND, roll = urnd(), r2 = urnd(), r3 = urnd();
        const p = densityAt(x, z);
        if (p < 0.2 || cleared(x, z) || Math.hypot(x - ELDER.x, z - ELDER.z) < 6) continue;
        const h = T.heightAt(x, z);
        const kind = roll < 0.3 * p ? 0 : roll < 0.3 * p + 0.12 * p ? 1 : -1;
        if (kind < 0 || edgeAt(x, z) < 0.8 || (edgeAt(x, z) < 4 && edgeExact(x, z) < 0.8) || builtUp(x, z) || nearTrunk(x, z, 0.5)) continue;
        UX.push(x); UZ.push(z); UY.push(h - 0.05); UYAW.push(r2 * Math.PI * 2);
        US.push(kind === 0 ? 0.7 + 0.4 * r3 : 1.2 + 0.8 * r3); UK.push(kind);
      }
    }
    const under = {
      count: UX.length, X: Float32Array.from(UX), Z: Float32Array.from(UZ), Y: Float32Array.from(UY), YAW: Float32Array.from(UYAW),
      S: Float32Array.from(US), KIND: Uint8Array.from(UK)
    };
    under.cells = csr(under.count, Math.ceil(SIZE / CELL), CELL, under.X, under.Z);
    under.fine = csr(under.count, fineCols, FINE, under.X, under.Z);

    const canopy = new Float32Array(N * N);
    for (let t = 0; t < count; t++) {
      const cr = SPECIES[Math.floor(trees.V[t] / 3)].crown * trees.H[t];
      const i0 = Math.max(0, Math.floor((trees.X[t] - cr) / STEP)), i1 = Math.min(N - 1, Math.ceil((trees.X[t] + cr) / STEP));
      const j0 = Math.max(0, Math.floor((trees.Z[t] - cr) / STEP)), j1 = Math.min(N - 1, Math.ceil((trees.Z[t] + cr) / STEP));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const q = Math.hypot(i * STEP - trees.X[t], j * STEP - trees.Z[t]) / cr;
          if (q < 1) canopy[j * N + i] += 0.5 * (1 - q * q);
        }
      }
    }
    if (T.shade) T.shade(canopy, 0.32);

    const zoneCount = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (let t = 0; t < count; t++) zoneCount[T.zoneAt(trees.X[t], trees.Z[t])]++;

    const eachNear = (grid, xs, zs, x, z, r, fn) => {
      const i0 = Math.max(0, Math.floor((x - r) / grid.size)), i1 = Math.min(grid.cols - 1, Math.floor((x + r) / grid.size));
      const j0 = Math.max(0, Math.floor((z - r) / grid.size)), j1 = Math.min(grid.cols - 1, Math.floor((z + r) / grid.size));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const c = j * grid.cols + i;
          for (let q = grid.start[c]; q < grid.start[c + 1]; q++) fn(grid.list[q]);
        }
      }
    };
    const trunksNear = (x, z, r, fn) => eachNear(trees.fine, trees.X, trees.Z, x, z, r + 0.7, t => {
      if (Math.hypot(trees.X[t] - x, trees.Z[t] - z) < r + trees.RAD[t]) fn(t);
    });
    const nearCells = (x, z, radius) => {
      const g = trees.cells, out = [];
      const i0 = Math.max(0, Math.floor((x - radius) / CELL)), i1 = Math.min(g.cols - 1, Math.floor((x + radius) / CELL));
      const j0 = Math.max(0, Math.floor((z - radius) / CELL)), j1 = Math.min(g.cols - 1, Math.floor((z + radius) / CELL));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const dx = Math.max(i * CELL - x, 0, x - (i + 1) * CELL), dz = Math.max(j * CELL - z, 0, z - (j + 1) * CELL);
          if (Math.hypot(dx, dz) <= radius) out.push(j * g.cols + i);
        }
      }
      return out;
    };
    const sight = (x, z, eye, dx, dz, max) => {
      const l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
      for (let s = 0.5; s <= max; s += 0.25) {
        const px = x + ux * s, pz = z + uz * s;
        let hit = false;
        eachNear(trees.fine, trees.X, trees.Z, px, pz, 0.7, t => {
          if (!hit && Math.hypot(trees.X[t] - px, trees.Z[t] - pz) < trees.RAD[t]) hit = true;
        });
        if (!hit) {
          eachNear(under.fine, under.X, under.Z, px, pz, 1, u => {
            if (!hit && under.KIND[u] === 1 && under.S[u] >= eye - 0.15 && Math.hypot(under.X[u] - px, under.Z[u] - pz) < 0.45 * under.S[u]) hit = true;
          });
        }
        if (hit) return s;
      }
      return max;
    };

    const bushAt = (x, z, r) => {
      let hit = false;
      eachNear(under.fine, under.X, under.Z, x, z, r + 1, u => { if (!hit && Math.hypot(under.X[u] - x, under.Z[u] - z) < r + 0.35 * under.S[u]) hit = true; });
      return hit;
    };
    return { trees, under, canopy, zoneCount, density, densityAt, edgeAt, cleared, trunksNear, bushAt, nearCells, sight, elder: ELDER };
  }

  K.Flora = { SPECIES, VARIANTS, CELL, BAND, ELDER, fade, build };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
