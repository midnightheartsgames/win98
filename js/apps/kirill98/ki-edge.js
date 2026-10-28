(function (K) {
  'use strict';

  const SIZE = K.MAP.size, BORDER = 10, FAR = 3200, FADE = 450, TREES_TO = 700;
  const NEAR_ROWS = Object.freeze([-1.5, 0, 3, 6, 12, 24, 48]);
  const FAR_ROWS = Object.freeze([48, 72, 100, 140, 190, 250, 330, 430, 560, 720, 920, 1160, 1450, 1800, 2200, 2700, FAR]);
  const CORNER = 8, RIVER_OUT = Object.freeze({ x: 788, dx: 0.094, wave: 30, len: 1600, level: -0.6, half: 7, bed: -3 });
  const REASONS = Object.freeze({ n: 'отвесные скалы хребта', w: 'непролазный бурелом', e: 'крутые склоны холмов', s: 'крутые склоны холмов', river: 'река уходит в топкие плавни' });

  const smooth = t => { const x = t < 0 ? 0 : t > 1 ? 1 : t; return x * x * (3 - 2 * x); };
  const hash = (x, z, s) => { const v = Math.sin(x * 127.1 + z * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
  const vnoise = (x, z, s) => {
    const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
  const fbm = (x, z, s, o) => { let t = 0, a = 0.5, f = 1, n = 0; for (let k = 0; k < o; k++) { t += a * vnoise(x * f, z * f, s + k * 13); n += a; a *= 0.5; f *= 2.03; } return t / n; };
  const ridged = (x, z, s) => { let t = 0, a = 0.5, f = 1; for (let k = 0; k < 4; k++) { t += a * (1 - Math.abs(vnoise(x * f, z * f, s + k * 7) * 2 - 1)); a *= 0.5; f *= 2.1; } return t / 0.9375; };

  const riverX = z => RIVER_OUT.x + RIVER_OUT.dx * (z - SIZE) + RIVER_OUT.wave * Math.sin((z - SIZE) / 210);
  const outside = (x, z) => x < 0 || z < 0 || x > SIZE || z > SIZE;
  const base = (x, z) => [Math.max(0, Math.min(SIZE, x)), Math.max(0, Math.min(SIZE, z))];

  function land(x, z) {
    const n = Math.max(0, -z), s = Math.max(0, z - SIZE), w = Math.max(0, -x), e = Math.max(0, x - SIZE), sum = n + s + w + e + 1e-6;
    const hills = 55 + 60 * fbm(x / 350, z / 350, 3, 4) + 22 * fbm(x / 110, z / 110, 9, 3);
    const ridge = 200 + 230 * smooth(n / 900) + 150 * ridged(x / 520, z / 380, 5) * smooth(n / 260);
    let plain = 6 + 16 * fbm(x / 420, z / 420, 11, 3);
    if (s > 0) {
      const d = Math.abs(x - riverX(z)), floor = d < RIVER_OUT.half ? RIVER_OUT.bed : -0.1 + (d - RIVER_OUT.half) * 0.12;
      plain = floor + (Math.max(plain, floor) - floor) * smooth((d - RIVER_OUT.half) / 150);
    }
    return (ridge * n + plain * s + hills * (w + e)) / sum;
  }

  function height(T, x, z) {
    if (!outside(x, z)) return T.meshHeightAt(x, z) - 0.3;
    const [bx, bz] = base(x, z), o = Math.hypot(x - bx, z - bz), edge = T.meshHeightAt(Math.min(bx, SIZE - 0.01), Math.min(bz, SIZE - 0.01));
    let h = edge + (land(x, z) - edge) * smooth(o / FADE);
    if (z > SIZE) {
      const d = Math.abs(x - riverX(z));
      if (d < 40) { const cut = d < RIVER_OUT.half ? RIVER_OUT.bed : RIVER_OUT.bed + (d - RIVER_OUT.half) * 0.35; if (cut < h) h += (cut - h) * smooth((o - 2 + Math.max(0, RIVER_OUT.half + 3 - d) * 4) / 40); }
    }
    return h;
  }

  function stations(spacing) {
    const out = [], n = Math.round(SIZE / spacing), sides = [
      { a: [0, 0], d: [1, 0], nrm: [0, -1] }, { a: [SIZE, 0], d: [0, 1], nrm: [1, 0] },
      { a: [SIZE, SIZE], d: [-1, 0], nrm: [0, 1] }, { a: [0, SIZE], d: [0, -1], nrm: [-1, 0] }
    ];
    sides.forEach((sd, i) => {
      for (let k = 0; k < n; k++) out.push({ b: [sd.a[0] + sd.d[0] * k * SIZE / n, sd.a[1] + sd.d[1] * k * SIZE / n], n: sd.nrm });
      const end = [sd.a[0] + sd.d[0] * SIZE, sd.a[1] + sd.d[1] * SIZE], a0 = Math.atan2(sd.nrm[1], sd.nrm[0]), a1 = a0 + Math.PI / 2;
      for (let k = 0; k < CORNER; k++) { const a = a0 + (a1 - a0) * k / CORNER; out.push({ b: end, n: [Math.cos(a), Math.sin(a)], corner: true }); }
    });
    return out;
  }

  function grid(T, rows, st, heights) {
    const P = [], cols = st.length;
    rows.forEach((o, r) => st.forEach((s, c) => {
      const x = s.b[0] + s.n[0] * o, z = s.b[1] + s.n[1] * o;
      P.push([x, heights ? heights(r, c, x, z) : height(T, x, z), z, o]);
    }));
    return { P, cols, rows: rows.length };
  }

  function emit(out, G) {
    const { P, cols, rows } = G, N = P.map(() => [0, 0, 0]);
    const tri = (a, b, c) => {
      const p = P[a], q = P[b], r = P[c], ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2], vx = r[0] - p[0], vy = r[1] - p[1], vz = r[2] - p[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const k of [a, b, c]) { N[k][0] += nx; N[k][1] += ny; N[k][2] += nz; }
    };
    const quads = [];
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols; c++) {
      const c1 = (c + 1) % cols, a = r * cols + c, b = r * cols + c1, d = (r + 1) * cols + c, e = (r + 1) * cols + c1;
      quads.push([a, d, b], [b, d, e]);
    }
    for (const [a, b, c] of quads) tri(a, b, c);
    for (const n of N) { const l = Math.hypot(n[0], n[1], n[2]) || 1; n[0] /= l; n[1] /= l; n[2] /= l; if (n[1] < 0) { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2]; } }
    for (const q of quads) for (const k of q) out.push(P[k][0], P[k][1], P[k][2], N[k][0], N[k][1], N[k][2], P[k][3]);
  }

  const meshCache = new WeakMap();
  function mesh(T) {
    if (meshCache.has(T)) return meshCache.get(T);
    const out = [], farSt = stations(24), nearSt = stations(3), farG = grid(T, FAR_ROWS, farSt), per = SIZE / 24 + CORNER, ratio = 8;
    emit(out, farG);
    const joinRow = NEAR_ROWS.length - 1;
    emit(out, grid(T, NEAR_ROWS, nearSt, (r, c, x, z) => {
      if (r !== joinRow) return height(T, x, z);
      const side = Math.floor(c / (SIZE / 3 + CORNER)), k = c - side * (SIZE / 3 + CORNER);
      if (k >= SIZE / 3) return farG.P[side * per + SIZE / 24 + (k - SIZE / 3)][1];
      const f = k / ratio, i0 = Math.floor(f), t = f - i0, a = side * per + i0, b = i0 + 1 < SIZE / 24 ? a + 1 : side * per + SIZE / 24;
      return farG.P[a][1] * (1 - t) + farG.P[b][1] * t;
    }));
    const data = new Float32Array(out);
    meshCache.set(T, data);
    return data;
  }

  const treeCache = new WeakMap();
  function trees(T, F) {
    if (treeCache.has(T)) return treeCache.get(T);
    const tr = F.trees, pool = { n: [], w: [], e: [], s: [] }, out = [];
    for (let i = 0; i < tr.count; i++) {
      const x = tr.X[i], z = tr.Z[i], key = z < 330 ? 'n' : x < 300 ? 'w' : x > SIZE - 300 ? 'e' : z > SIZE - 300 ? 's' : null;
      if (key && pool[key].length < 400) pool[key].push(i);
    }
    const CELL = 10;
    for (let z = -TREES_TO; z < SIZE + TREES_TO; z += CELL) for (let x = -TREES_TO; x < SIZE + TREES_TO; x += CELL) {
      const px = x + hash(x, z, 1) * CELL, pz = z + hash(x, z, 2) * CELL;
      if (!outside(px, pz)) continue;
      const [bx, bz] = base(px, pz), o = Math.hypot(px - bx, pz - bz);
      if (o < 8 || o > TREES_TO) continue;
      const key = pz < 0 ? 'n' : pz > SIZE ? (px < 0 ? 'w' : px > SIZE ? 'e' : 's') : px < 0 ? 'w' : 'e';
      const h = height(T, px, pz), nb = height(T, px + 6, pz) - h, nc = height(T, px, pz + 6) - h, slope = Math.hypot(nb, nc) / 6;
      let p = key === 's' ? (fbm(px / 160, pz / 160, 21, 2) > 0.62 ? 0.7 : 0.04) : key === 'n' ? (h < 195 ? 0.72 : 0) : 0.78;
      if (key === 's' && Math.abs(px - riverX(pz)) < 60) p = Math.max(p, 0.35);
      if (Math.abs(px - riverX(pz)) < RIVER_OUT.half + 4 && pz > SIZE) p = 0;
      if (slope > 0.85) p *= 0.2;
      if (hash(px, pz, 3) > p || !pool[key].length) continue;
      const src = pool[key][Math.floor(hash(px, pz, 4) * pool[key].length)];
      out.push(px, h - 0.15, pz, hash(px, pz, 5) * Math.PI * 2, tr.S[src] * (0.9 + 0.25 * hash(px, pz, 6)), tr.TINT[src], tr.V[src], 0);
    }
    const data = new Float32Array(out);
    treeCache.set(T, data);
    return data;
  }

  function water(T) {
    const out = [], L = RIVER_OUT, s0 = T.river.length, row = z => {
      const x = riverX(z), x2 = riverX(z + 1), l = Math.hypot(x2 - x, 1), tx = (x2 - x) / l, tz = 1 / l;
      return { x, z, tx, tz, s: s0 + (z - SIZE) };
    };
    const vert = (r, side) => { const w = L.half + 1; out.push(r.x - r.tz * w * side, L.level, r.z + r.tx * w * side, r.s, w * side, L.half, L.level - L.bed, 0, 0.6, 0, Math.atan2(r.tz, r.tx)); };
    let prev = row(SIZE - 3);
    for (let z = SIZE + 6; z <= SIZE + L.len; z += 6) {
      const cur = row(z);
      vert(prev, 1); vert(cur, 1); vert(prev, -1);
      vert(prev, -1); vert(cur, 1); vert(cur, -1);
      prev = cur;
    }
    return new Float32Array(out);
  }

  function reason(T, x, z) {
    if (z > SIZE - BORDER - 30 && Math.abs(x - riverX(SIZE)) < 30) return REASONS.river;
    const d = { n: z, s: SIZE - z, w: x, e: SIZE - x };
    return REASONS[Object.keys(d).sort((a, b) => d[a] - d[b])[0]];
  }

  function hold(pos) {
    const x = pos[0], z = pos[2], cx = Math.max(BORDER, Math.min(SIZE - BORDER, x)), cz = Math.max(BORDER, Math.min(SIZE - BORDER, z));
    return { x: cx, z: cz, held: cx !== x || cz !== z };
  }

  K.Edge = { SIZE, BORDER, FAR, REASONS, RIVER_OUT, riverX, land, height, mesh, trees, water, reason, hold };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
