(function () {
  const { M4, V3, Builder, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Art = window.StairsArt;

  const RISE = 0.165;
  const RUN = 0.31;
  const HALF = 2.1;
  const CHEEK = 0.42;
  const PLAN = [['flight', 14], ['land', 2.0], ['flight', 30], ['land', 2.2], ['flight', 26], ['land', 16]];

  const SEGS = [];
  (() => {
    let s = 0, y = 0;
    PLAN.forEach(([kind, v]) => {
      if (kind === 'flight') {
        SEGS.push({ kind, s0: s, s1: s + v * RUN, y0: y, y1: y + v * RISE, n: v });
        s += v * RUN;
        y += v * RISE;
      } else {
        SEGS.push({ kind, s0: s, s1: s + v, y0: y, y1: y });
        s += v;
      }
    });
  })();
  const TOP_S = SEGS[SEGS.length - 1].s0;
  const TOP_Y = SEGS[SEGS.length - 1].y0;
  const END_S = SEGS[SEGS.length - 1].s1;

  function segAt(s) {
    for (const g of SEGS) if (s < g.s1) return g;
    return SEGS[SEGS.length - 1];
  }

  function stepY(s) {
    if (s < 0) return 0;
    const g = segAt(s);
    if (g.kind === 'land') return g.y0;
    const i = Math.min(g.n - 1, Math.floor((s - g.s0) / RUN));
    return g.y0 + (i + 1) * RISE;
  }

  function pitchY(s) {
    if (s <= 0) return 0;
    const g = segAt(s);
    if (g.kind === 'land') return g.y0;
    return lerp(g.y0, g.y1, (s - g.s0) / (g.s1 - g.s0));
  }

  function groundAt(x, z) {
    const s = -z;
    if (Math.abs(x) <= HALF) return stepY(s);
    if (Math.abs(x) <= HALF + CHEEK) return pitchY(s) + 0.38;
    return x < 0 ? Math.max(0, pitchY(s) - 0.55) : pitchY(s) + 0.25;
  }

  const N_UP = [0, 1, 0];

  function quadN(b, a, bb, c, d, col, uvs, n) {
    b.quad(a, bb, c, d, col, uvs, n ? [n, n, n, n] : null);
  }

  function wallX(b, x, z0, z1, y0a, y1a, y0b, y1b, col, nx, uvk) {
    const k = uvk || 1;
    quadN(b, [x, y0a, z0], [x, y0b, z1], [x, y1b, z1], [x, y1a, z0], col, [[z0 * k, y0a * k], [z1 * k, y0b * k], [z1 * k, y1b * k], [z0 * k, y1a * k]], [nx, 0, 0]);
  }

  function wallZ(b, z, x0, x1, y0, y1, col, nz, uvk) {
    const k = uvk || 1;
    quadN(b, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, [[x0 * k, y0 * k], [x1 * k, y0 * k], [x1 * k, y1 * k], [x0 * k, y1 * k]], [0, 0, nz]);
  }

  function floor(b, x0, x1, z0, z1, y, col, uvk) {
    const k = uvk || 1;
    quadN(b, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], col, [[x0 * k, z0 * k], [x1 * k, z0 * k], [x1 * k, z1 * k], [x0 * k, z1 * k]], N_UP);
  }

  function slab(b, x0, x1, s0, s1, ya, yb, col, uvk) {
    const k = uvk || 1;
    const n = V3.norm([0, s1 - s0, yb - ya]);
    quadN(b, [x0, ya, -s0], [x1, ya, -s0], [x1, yb, -s1], [x0, yb, -s1], col, [[x0 * k, s0 * k], [x1 * k, s0 * k], [x1 * k, s1 * k], [x0 * k, s1 * k]], n);
  }

  function box(b, x, y, z, sx, sy, sz, col) {
    b.at(x, y, z, q => q.box(sx, sy, sz, col));
  }

  function bar(b, p0, p1, rad, col, sides) {
    K.tube(b, [p0, p1], [rad, rad], sides || 6, col);
  }

  function pitchPts(s0, s1, step) {
    const out = [s0];
    SEGS.forEach(g => { if (g.s0 > s0 && g.s0 < s1) out.push(g.s0); });
    for (let s = s0 + step; s < s1; s += step) out.push(s);
    out.push(s1);
    return [...new Set(out.map(v => Math.round(v * 1000) / 1000))].sort((a, b) => a - b);
  }

  function buildSteps(b) {
    const tread = [0.68, 0.7, 0.7, 0];
    const nose = [0.9, 0.91, 0.9, 0];
    const riser = [0.36, 0.38, 0.39, 0];
    SEGS.forEach(g => {
      if (g.kind === 'land') {
        floor(b, -HALF, HALF, -g.s0, -g.s1, g.y0, tread, 0.5);
        return;
      }
      for (let i = 0; i < g.n; i++) {
        const sa = g.s0 + i * RUN, sb = sa + RUN;
        const ya = g.y0 + i * RISE, yb = ya + RISE;
        quadN(b, [-HALF, ya, -sa], [HALF, ya, -sa], [HALF, yb, -sa], [-HALF, yb, -sa], riser, [[-HALF * 0.5, ya * 0.5], [HALF * 0.5, ya * 0.5], [HALF * 0.5, yb * 0.5], [-HALF * 0.5, yb * 0.5]], [0, 0, 1]);
        quadN(b, [-HALF, yb, -sa], [HALF, yb, -sa], [HALF, yb, -sa - 0.05], [-HALF, yb, -sa - 0.05], nose, null, N_UP);
        floor(b, -HALF, HALF, -sa - 0.05, -sb, yb, tread, 0.5);
      }
    });
  }

  function buildCheeks(b) {
    const top = [0.92, 0.91, 0.88, 0];
    const side = [0.62, 0.62, 0.6, 0];
    [-1, 1].forEach(k => {
      const xi = k * HALF, xo = k * (HALF + CHEEK);
      const pts = pitchPts(-0.3, END_S, 50);
      for (let i = 0; i < pts.length - 1; i++) {
        const s0 = pts[i], s1 = pts[i + 1];
        const y0 = pitchY(s0) + 0.38, y1 = pitchY(s1) + 0.38;
        slab(b, Math.min(xi, xo), Math.max(xi, xo), s0, s1, y0, y1, top, 1.2);
        wallX(b, xi, -s0, -s1, y0 - 1.6, y0, y1 - 1.6, y1, side, -k, 1.2);
        const low = k < 0 ? -0.55 : 0.25;
        wallX(b, xo, -s0, -s1, pitchY(s0) + low - 0.02, y0, pitchY(s1) + low - 0.02, y1, side, k, 1.2);
      }
      wallZ(b, 0.3, Math.min(xi, xo), Math.max(xi, xo), 0, 0.38, side, 1, 1.2);
    });
  }

  function buildTerraces(b) {
    const col = [0.5, 0.5, 0.48, 0];
    const pts = pitchPts(0.0, END_S, 50);
    for (let i = 0; i < pts.length - 1; i++) {
      const s0 = pts[i], s1 = pts[i + 1];
      slab(b, -4.6, -(HALF + CHEEK), s0, s1, Math.max(0, pitchY(s0) - 0.55), Math.max(0, pitchY(s1) - 0.55), col, 0.6);
      slab(b, HALF + CHEEK, HALF + 0.95, s0, s1, pitchY(s0) + 0.25, pitchY(s1) + 0.25, col, 0.6);
    }
  }

  function buildRetaining(b) {
    const col = [0.62, 0.61, 0.58, 0];
    const pts = pitchPts(0.0, END_S, 50);
    for (let i = 0; i < pts.length - 1; i++) {
      const s0 = pts[i], s1 = pts[i + 1];
      wallX(b, HALF + 0.95, -s0, -s1, pitchY(s0) + 0.2, pitchY(s0) + 2.4, pitchY(s1) + 0.2, pitchY(s1) + 2.4, col, -1, 0.45);
      slab(b, HALF + 0.95, 5.3, s0, s1, pitchY(s0) + 2.4, pitchY(s1) + 2.4, [0.4, 0.4, 0.38, 0], 0.5);
    }
  }

  function buildFacades(b) {
    const w = [1, 1, 1, 0];
    const zs = [0.0, -(END_S + 6)];
    quadN(b, [-4.6, -0.5, zs[0]], [-4.6, -0.5, zs[1]], [-4.6, 34, zs[1]], [-4.6, 34, zs[0]], w, [[0, 0], [(zs[0] - zs[1]) / 3.2, 0], [(zs[0] - zs[1]) / 3.2, 34.5 / 3.2], [0, 34.5 / 3.2]], [1, 0, 0]);
    quadN(b, [5.3, -0.5, zs[0]], [5.3, -0.5, zs[1]], [5.3, 40, zs[1]], [5.3, 40, zs[0]], w, [[0, 0], [(zs[0] - zs[1]) / 3.2, 0], [(zs[0] - zs[1]) / 3.2, 40.5 / 3.2], [0, 40.5 / 3.2]], [-1, 0, 0]);
    quadN(b, [-14, -0.5, 0.0], [-4.6, -0.5, 0.0], [-4.6, 34, 0.0], [-14, 34, 0.0], w, [[0, 0], [9.4 / 3.2, 0], [9.4 / 3.2, 34.5 / 3.2], [0, 34.5 / 3.2]], [0, 0, 1]);
    quadN(b, [5.3, -0.5, 0.0], [16, -0.5, 0.0], [16, 40, 0.0], [5.3, 40, 0.0], w, [[0, 0], [10.7 / 3.2, 0], [10.7 / 3.2, 40.5 / 3.2], [0, 40.5 / 3.2]], [0, 0, 1]);
  }

  function buildGround(b) {
    const col = [0.6, 0.6, 0.58, 0];
    floor(b, -HALF - CHEEK, HALF + CHEEK, -TOP_S, -(END_S + 6), TOP_Y, col, 0.5);
    floor(b, -4.6, -HALF - CHEEK, -TOP_S, -(END_S + 6), TOP_Y - 0.02, col, 0.5);
  }

  function fireEscape(b, x, dir, z0, z1, y0, floors, story) {
    const iron = 0x1c1a18, rust = 0x3a2418;
    const depth = 1.15;
    for (let f = 0; f < floors; f++) {
      const y = y0 + f * story;
      const xo = x + dir * depth;
      box(b, (x + xo) / 2, y, (z0 + z1) / 2, depth, 0.05, Math.abs(z1 - z0), rust);
      for (let k = 0; k < 6; k++) box(b, (x + xo) / 2, y - 0.04, z0 + (z1 - z0) * (k + 0.5) / 6, depth * 0.95, 0.02, 0.02, iron);
      bar(b, [xo, y + 0.95, z0], [xo, y + 0.95, z1], 0.018, iron, 4);
      bar(b, [xo, y + 0.5, z0], [xo, y + 0.5, z1], 0.012, iron, 4);
      [z0, z1].forEach(z => {
        bar(b, [x, y + 0.95, z], [xo, y + 0.95, z], 0.018, iron, 4);
        bar(b, [xo, y, z], [xo, y + 0.95, z], 0.02, iron, 4);
      });
      const n = Math.max(4, Math.floor(Math.abs(z1 - z0) / 0.14));
      for (let k = 1; k < n; k++) {
        const z = z0 + (z1 - z0) * k / n;
        bar(b, [xo, y, z], [xo, y + 0.95, z], 0.008, iron, 3);
      }
      if (f < floors - 1) {
        const za = lerp(z0, z1, 0.15), zb = lerp(z0, z1, 0.62);
        const xa = x + dir * depth * 0.3, xb = x + dir * depth * 0.75;
        [xa, xb].forEach(xx => bar(b, [xx, y + 0.02, zb], [xx, y + story, za], 0.025, iron, 4));
        for (let k = 1; k < 12; k++) {
          const u = k / 12;
          const yy = y + story * u, zz = lerp(zb, za, u);
          bar(b, [xa, yy, zz], [xb, yy, zz], 0.012, iron, 3);
        }
        bar(b, [xa, y + 0.95, zb], [xa, y + story + 0.95, za], 0.012, iron, 3);
      }
    }
    box(b, x + dir * depth * 0.5, y0 - 0.6, lerp(z0, z1, 0.2), 0.04, 1.2, 0.04, iron);
  }

  function lamp(b, x, y, z, h) {
    const pole = 0x2a3c5c;
    b.at(x, y, z, q => {
      q.prism(10, 0.12, 0.12, 0, 0.1, 0.1, 0.5, pole, { capTop: false });
      q.prism(8, 0.07, 0.07, 0.5, 0.045, 0.045, h, pole, { capTop: false });
      q.prism(8, 0.05, 0.05, h - 0.02, 0.09, 0.09, h + 0.1, 0x1a1c22, { capTop: false });
      q.prism(8, 0.11, 0.11, h + 0.1, 0.16, 0.16, h + 0.55, [0.62, 0.64, 0.62, 0.12], { capTop: false });
      q.prism(8, 0.18, 0.18, h + 0.55, 0.05, 0.05, h + 0.72, 0x1a1c22);
      q.prism(6, 0.02, 0.02, h + 0.72, 0.005, 0.005, h + 0.85, 0x1a1c22);
    });
  }

  const LAMPS = [[-2.9, -1.4, 4.0], [3.05, -2.6, 4.2], [-2.75, 5.3, 3.8], [2.85, 5.0, 3.8], [-2.75, 16.6, 3.8], [2.85, 16.8, 3.8], [-2.6, TOP_S + 1.6, 3.9], [2.6, TOP_S + 1.6, 3.9], [-2.6, TOP_S + 9, 3.9], [2.6, TOP_S + 9, 3.9]];

  function lampY(x, s) {
    if (s < 0) return 0.15;
    if (Math.abs(x) <= HALF + CHEEK) return stepY(s);
    return x < 0 ? Math.max(0, pitchY(s) - 0.55) : pitchY(s) + 0.25;
  }

  function buildIron(b) {
    const iron = 0x16181a;
    [-1, 1].forEach(k => {
      const x = k * (HALF - 0.14);
      const pts = pitchPts(0.15, TOP_S + 0.8, 0.8);
      const rail = pts.map(s => [x, pitchY(s) + (s < 0.6 ? 0.92 : 0.92) + RISE * 0.5, -s]);
      K.tube(b, rail, rail.map(() => 0.026), 6, iron);
      const low = pts.map(s => [x, pitchY(s) + 0.45 + RISE * 0.5, -s]);
      K.tube(b, low, low.map(() => 0.016), 5, iron);
      let last = -9;
      pts.forEach((s, i) => {
        if (s - last < 1.4 && i !== pts.length - 1) return;
        last = s;
        const y0 = stepY(s + 0.01);
        bar(b, [x, y0, -s], [x, pitchY(s) + 0.92 + RISE * 0.5, -s], 0.024, iron, 6);
        b.at(x, y0, -s, q => q.prism(8, 0.045, 0.045, 0, 0.04, 0.04, 0.05, iron));
      });
      const tz = -(TOP_S + 0.8);
      bar(b, [x, TOP_Y + 0.92 + RISE * 0.5, tz], [x + k * 0.0, TOP_Y + 0.92 + RISE * 0.5, tz - 1.2], 0.026, iron, 6);
      bar(b, [x, TOP_Y, tz - 1.2], [x, TOP_Y + 1.0, tz - 1.2], 0.024, iron, 6);
    });
    [-1, 1].forEach(k => {
      const x = k * (HALF + CHEEK + 0.05);
      const pts = pitchPts(0.0, TOP_S, 1.0);
      const rail = pts.map(s => [x, pitchY(s) + 0.38 + 0.95, -s]);
      K.tube(b, rail, rail.map(() => 0.022), 5, iron);
      let last = -9;
      pts.forEach((s, i) => {
        if (s - last < 1.9 && i !== pts.length - 1) return;
        last = s;
        bar(b, [x, pitchY(s) + 0.38, -s], [x, pitchY(s) + 0.38 + 0.95, -s], 0.02, iron, 5);
      });
    });
  }

  function bag(b, x, y, z, sx, sy, sz, seed) {
    const g = rand(seed);
    const col = g() < 0.3 ? 0x2a3038 : g() < 0.6 ? 0x1a1d22 : 0x111316;
    const h = sy * 0.62;
    b.push(M4.translate(x, y + h * 0.75, z), M4.rotY(g() * PI), M4.rotZ((g() - 0.5) * 0.5), M4.rotX((g() - 0.5) * 0.4));
    b.ellipsoid(sx * 0.8, h, sz * 0.8, 10, 7, col, { colorAt: (p) => p[1] > h * 0.5 && p[0] > 0 ? 0x3a424c : col });
    b.at(sx * 0.15, h * 0.85, 0, q => q.ellipsoid(sx * 0.35, h * 0.35, sz * 0.3, 6, 4, col));
    b.at(0, h * 0.95, -sz * 0.2, q => q.prism(5, sx * 0.1, sz * 0.1, 0, sx * 0.03, sz * 0.03, h * 0.35, col));
    b.pop();
  }

  function bagPile(b, x, z, n, spread, seed, ground, scale) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      const s = (0.26 + g() * 0.18) * (scale || 1);
      bag(b, x + (g() - 0.5) * spread * 2, (ground === undefined ? groundAt(x, z) : ground) + (g() < 0.3 ? s * 0.8 : 0), z + (g() - 0.5) * spread, s, s * (0.85 + g() * 0.3), s * (0.9 + g() * 0.2), seed * 13 + i);
    }
  }

  function wheel(b, x, y, z, rad, wid) {
    b.push(M4.translate(x, y, z), M4.rotZ(PI / 2));
    b.prism(14, rad, rad, -wid / 2, rad, rad, wid / 2, 0x141414, { capBottom: true });
    b.prism(10, rad * 0.55, rad * 0.55, wid / 2 - 0.004, rad * 0.55, rad * 0.55, wid / 2 + 0.01, 0x9a9a98, { capBottom: true });
    b.pop();
  }

  function car(b, kind, col, x, z, yaw) {
    const glass = [0.2, 0.24, 0.26, 0];
    b.push(M4.translate(x, 0, z), M4.rotY(yaw));
    const L = kind === 'wagon' ? 5.3 : 5.0;
    box(b, 0, 0.62, 0, 1.95, 0.55, L, col);
    box(b, 0, 0.42, L / 2 + 0.06, 2.0, 0.16, 0.14, 0xb8b8b4);
    box(b, 0, 0.42, -L / 2 - 0.06, 2.0, 0.16, 0.14, 0xb8b8b4);
    if (kind === 'wagon') {
      box(b, 0, 1.12, -0.45, 1.8, 0.48, 3.6, glass);
      box(b, 0, 1.38, -0.45, 1.86, 0.05, 3.7, col);
      [-1, 1].forEach(s => box(b, s * 0.985, 0.66, -0.2, 0.02, 0.32, 4.2, 0x6a4422));
    } else {
      b.at(0, 0.9, -0.15, q => q.prism(4, 1.25, 1.7, 0, 0.92, 1.05, 0.46, glass, { phase: PI / 4 }));
      box(b, 0, 1.37, -0.15, 1.3, 0.04, 1.45, col);
    }
    [-1.55, 1.6].forEach(zz => [-0.92, 0.92].forEach(xx => wheel(b, xx, 0.34, zz, 0.34, 0.22)));
    [-0.62, 0.62].forEach(xx => box(b, xx, 0.7, L / 2 + 0.01, 0.34, 0.14, 0.03, 0xe8e6d8));
    [-0.7, 0.7].forEach(xx => box(b, xx, 0.72, -L / 2 - 0.01, 0.3, 0.12, 0.03, 0x8a1a14));
    b.pop();
  }

  function streetBits(b) {
    const curb = [0.62, 0.6, 0.57, 0];
    box(b, 0, 0.075, 3.08, 60, 0.15, 0.16, curb);
    box(b, 0, 0.075, 12.92, 60, 0.15, 0.16, curb);
    car(b, 'wagon', 0xb8a070, -6.5, 4.4, PI / 2);
    car(b, 'sedan', 0xb89430, 0.8, 4.3, PI / 2);
    car(b, 'sedan', 0x8a7a6a, 7.2, 4.4, -PI / 2);
    car(b, 'wagon', 0xc8b48a, -3.2, 11.6, PI / 2);
    car(b, 'sedan', 0xc8b040, 3.4, 11.7, -PI / 2);
    car(b, 'sedan', 0x5a3a2a, 10.5, 11.6, PI / 2);
    bagPile(b, -9.5, 14.0, 16, 1.6, 11, 0.15);
    bagPile(b, -1.5, 14.0, 9, 1.2, 12, 0.15);
    bagPile(b, 6.0, 14.2, 12, 1.4, 13, 0.15);
    bagPile(b, -6.0, 2.2, 7, 0.9, 14, 0.15);
    bagPile(b, 7.5, 2.1, 6, 0.8, 15, 0.15);
    lamp(b, -6.4, 0.15, 13.5, 4.4);
    lamp(b, 4.0, 0.15, 2.6, 4.4);
  }

  function buildSet(r, A) {
    const parts = {};
    const add = (key, fn) => {
      const b = new Builder();
      fn(b);
      parts[key] = r.mesh(b);
    };
    add('steps', buildSteps);
    add('cheeks', b => { buildCheeks(b); buildTerraces(b); });
    add('retain', buildRetaining);
    add('facade', buildFacades);
    add('ground', buildGround);
    add('iron', b => {
      buildIron(b);
      fireEscape(b, -4.6, 1, -1.2, -5.6, 3.2, 8, 3.1);
      fireEscape(b, -4.6, 1, -12.0, -16.5, 8.4, 8, 3.1);
      fireEscape(b, -4.6, 1, -22.5, -27.0, 13.2, 7, 3.1);
      fireEscape(b, 5.3, -1, -3.0, -7.4, 9.0, 8, 3.1);
      fireEscape(b, 5.3, -1, -14.5, -19.0, 14.0, 7, 3.1);
      fireEscape(b, 5.3, -1, -26.0, -30.5, 18.0, 6, 3.1);
      LAMPS.forEach(([x, s, h]) => lamp(b, x, lampY(x, s), -s, h));
      bagPile(b, -3.4, -1.2, 5, 0.6, 21);
      bagPile(b, 3.2, -0.6, 3, 0.4, 22);
    });
    add('street', streetBits);
    add('road', b => {
      floor(b, -40, 40, 3.0, 13.0, 0, [1, 1, 1, 0], 0.25);
    });
    add('walks', b => {
      floor(b, -40, 40, -0.0, 3.0, 0.15, [1, 1, 1, 0], 0.5);
      floor(b, -40, 40, 13.0, 16.5, 0.15, [1, 1, 1, 0], 0.5);
    });
    add('lines', b => {
      for (let x = -40; x < 40; x += 4.5) floor(b, x, x + 3, 7.9, 8.06, 0.012, [0.86, 0.7, 0.18, 0]);
      floor(b, -40, 40, 8.12, 8.24, 0.012, [0.86, 0.7, 0.18, 0]);
    });
    add('across', b => {
      quadN(b, [-40, 0, 16.5], [40, 0, 16.5], [40, 18, 16.5], [-40, 18, 16.5], [1, 1, 1, 0], [[0, 0], [80 / 3.2, 0], [80 / 3.2, 18 / 3.2], [0, 18 / 3.2]], [0, 0, -1]);
    });
    add('sky', b => {
      const top = [0.9, 0.95, 0.94, 1], low = [0.95, 0.98, 0.96, 1];
      b.quad([-120, -20, -(END_S + 60)], [120, -20, -(END_S + 60)], [120, 140, -(END_S + 60)], [-120, 140, -(END_S + 60)], [low, low, top, top], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      b.quad([-120, 60, 80], [120, 60, 80], [120, 60, -(END_S + 60)], [-120, 60, -(END_S + 60)], [top, top, top, top], null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    });
    const GRAF = [
      { x: HALF + 0.94, s: 3.0, y: 1.6, w: 2.6, h: 1.1, tag: 0, n: -1 },
      { x: HALF + 0.94, s: 9.5, y: 1.2, w: 3.2, h: 1.3, tag: 1, n: -1 },
      { x: HALF + 0.94, s: 14.0, y: 2.1, w: 2.4, h: 1.0, tag: 2, n: -1 },
      { x: HALF + 0.94, s: 20.0, y: 1.4, w: 2.8, h: 1.2, tag: 3, n: -1 },
      { x: -4.58, s: 2.0, y: 1.2, w: 2.2, h: 1.0, tag: 4, n: 1 },
      { x: -4.58, s: 9.0, y: 0.9, w: 3.0, h: 1.4, tag: 0, n: 1 },
      { x: -4.58, s: 17.5, y: 0.8, w: 2.4, h: 1.1, tag: 5, n: 1 },
      { x: -4.58, s: 24.0, y: 0.7, w: 2.6, h: 1.0, tag: 1, n: 1 }
    ];
    const graf = GRAF.map(gf => {
      const b = new Builder();
      const base = gf.n < 0 ? pitchY(gf.s) + 0.25 : Math.max(0, pitchY(gf.s) - 0.55);
      const y0 = base + gf.y * 0.8, y1 = y0 + gf.h * 0.6, z0 = -gf.s + gf.w * 0.3, z1 = -gf.s - gf.w * 0.3;
      const zA = gf.n < 0 ? z1 : z0, zB = gf.n < 0 ? z0 : z1;
      quadN(b, [gf.x, y0, zA], [gf.x, y0, zB], [gf.x, y1, zB], [gf.x, y1, zA], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [gf.n, 0, 0]);
      return { m: r.mesh(b), tag: gf.tag };
    });
    return {
      draw(opts) {
        const o = opts || {};
        r.draw(parts.sky, null, { noFog: true });
        r.draw(parts.steps, null, { texture: A.tex('steps') });
        r.draw(parts.cheeks, null, { texture: A.tex('granite') });
        r.draw(parts.retain, null, { texture: A.tex('graniteDark') });
        r.draw(parts.facade, null, { texture: A.tex('facade') });
        r.draw(parts.ground, null, { texture: A.tex('steps') });
        r.draw(parts.iron);
        graf.forEach(gf => r.draw(gf.m, null, { texture: A.tex('graf' + gf.tag), tint: [0.4, 0.38, 0.42] }));
        if (o.street !== false) {
          r.draw(parts.road, null, { texture: A.tex('asphalt') });
          r.draw(parts.walks, null, { texture: A.tex('sidewalk') });
          r.draw(parts.lines);
          r.draw(parts.across, null, { texture: A.tex('facadeStone') });
          r.draw(parts.street);
        }
      }
    };
  }

  function buildHall(r, A) {
    const wall = K.mesh(r, b => {
      wallX(b, -0.9, 3, -30, 0, 2.7, 0, 2.7, [1, 1, 1, 0], 1, 0.6);
      wallX(b, 0.9, 3, -30, 0, 2.7, 0, 2.7, [1, 1, 1, 0], -1, 0.6);
    });
    const plain = K.mesh(r, b => {
      floor(b, -0.9, 0.9, 3, -30, 0, [0.22, 0.2, 0.16, 0]);
      quadN(b, [-0.9, 2.7, 3], [0.9, 2.7, 3], [0.9, 2.7, -30], [-0.9, 2.7, -30], [0.42, 0.44, 0.4, 0], null, [0, -1, 0]);
      for (let z = 1; z > -30; z -= 3.2) {
        box(b, 0, 2.66, z, 0.3, 0.05, 1.3, [0.72, 0.95, 0.98, 1]);
        box(b, 0, 2.69, z, 0.36, 0.02, 1.36, 0x2a2a28);
      }
      for (let z = -2; z > -30; z -= 4.5) {
        [-1, 1].forEach(s => {
          box(b, s * 0.89, 1.05, z, 0.04, 2.1, 0.95, 0x3a3428);
          box(b, s * 0.87, 1.05, z, 0.02, 1.95, 0.82, 0x5a4a34);
          box(b, s * 0.85, 1.0, z + 0.3, 0.03, 0.05, 0.05, 0xb89a50);
        });
      }
      wallZ(b, -14, -0.9, 0.9, 0, 2.7, [0.3, 0.34, 0.32, 0], 1);
      box(b, 0, 1.1, -13.95, 0.9, 2.1, 0.04, [0.82, 0.95, 0.92, 1]);
    });
    return {
      draw() {
        r.draw(wall, null, { texture: A.tex('hall') });
        r.draw(plain);
      }
    };
  }

  function buildDoor(r, A) {
    const steelM = K.mesh(r, b => {
      box(b, 0.05, 1.2, 0, 0.16, 2.4, 0.06, [1, 1, 1, 0]);
    });
    const plain = K.mesh(r, b => {
      box(b, 0.5, 1.2, -0.05, 0.84, 2.4, 0.04, 0x6a5a3c);
      box(b, -0.5, 1.2, -0.5, 1.2, 2.4, 0.04, 0x0c0c0c);
      [0.9, 1.25, 1.62].forEach(y => b.at(0.05, y, 0.03, q => q.ellipsoid(0.022, 0.022, 0.016, 10, 6, 0x4a4436)));
      box(b, -0.06, 1.2, 0.02, 0.012, 2.4, 0.03, 0x2a2618);
      box(b, 0.15, 1.2, 0.02, 0.012, 2.4, 0.03, 0x2a2618);
    });
    const panel = K.mesh(r, b => {
      quadN(b, [0.14, 0, -0.03], [0.95, 0, -0.03], [0.95, 2.4, -0.03], [0.14, 2.4, -0.03], [1, 1, 1, 0], [[0, 0], [1.5, 0], [1.5, 4], [0, 4]], [0, 0, 1]);
    });
    return {
      draw() {
        r.draw(steelM, null, { texture: A.tex('steel') });
        r.draw(plain);
        r.draw(panel, null, { texture: A.tex('concrete') });
      }
    };
  }

  function buildLift(r, A) {
    const glow = K.mesh(r, b => quadN(b, [-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 0.85, 0.6, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [0, 0, 1]));
    const panels = K.mesh(r, b => {
      wallZ(b, -1.6, -0.85, 0.85, 0, 2.4, [1, 1, 1, 0], 1, 0.9);
      wallX(b, -0.85, 0, -1.6, 0, 2.4, 0, 2.4, [1, 1, 1, 0], 1, 0.9);
      wallX(b, 0.85, 0, -1.6, 0, 2.4, 0, 2.4, [1, 1, 1, 0], -1, 0.9);
    });
    const plain = K.mesh(r, b => {
      floor(b, -0.85, 0.85, 0.3, -1.6, 0, [0.16, 0.12, 0.1, 0]);
      quadN(b, [-0.85, 2.4, 0.3], [0.85, 2.4, 0.3], [0.85, 2.4, -1.6], [-0.85, 2.4, -1.6], [0.22, 0.18, 0.12, 0], null, [0, -1, 0]);
      box(b, 0, 2.37, -0.75, 0.9, 0.04, 0.6, [1.0, 0.96, 0.82, 1]);
      box(b, 0, 2.38, -0.75, 1.0, 0.03, 0.7, 0x2a2014);
      [-1, 1].forEach(s => {
        for (let k = 0; k < 3; k++) box(b, s * 0.84, 1.2, -0.2 - k * 0.55, 0.02, 2.4, 0.015, 0x1a0e06);
      });
      for (let k = 0; k < 4; k++) box(b, -0.85 + 0.42 * (k + 0.5), 1.2, -1.59, 0.015, 2.4, 0.02, 0x1a0e06);
      box(b, 0, 0.06, -1.59, 1.7, 0.12, 0.03, 0x24160a);
      [-1, 1].forEach(s => {
        box(b, s * 1.05, 1.25, 0.32, 0.4, 2.6, 0.08, 0x2c2a22);
        box(b, s * 0.87, 1.25, 0.32, 0.05, 2.5, 0.12, 0x4a4436);
      });
      box(b, 0, 2.55, 0.32, 2.4, 0.3, 0.1, 0x2c2a22);
    });
    const door = K.mesh(r, b => box(b, 0, 1.2, 0, 1.75, 2.4, 0.04, 0x0e0d0b));
    return {
      draw(opts) {
        const o = opts || {};
        r.draw(panels, null, { texture: A.tex('wood'), tint: [0.72, 0.62, 0.55] });
        r.draw(glow, M4.chain(M4.translate(0, 2.05, -1.58), M4.scale(1.3, 1.0, 1)), { texture: A.tex('glow'), additive: true, alpha: 0.55 });
        r.draw(plain);
        if (o.door !== undefined && o.door > 0) r.draw(door, M4.translate(lerp(-1.75, 0, o.door), 0, 0.42));
      }
    };
  }

  function buildAvenue(r, A) {
    const bricks = K.mesh(r, b => {
      quadN(b, [-3.2, 0, 5], [-3.2, 0, -60], [-3.2, 22, -60], [-3.2, 22, 5], [1, 1, 1, 0], [[0, 0], [65 / 3.2, 0], [65 / 3.2, 22 / 3.2], [0, 22 / 3.2]], [1, 0, 0]);
    });
    const walk = K.mesh(r, b => floor(b, -3.2, 2.2, 5, -60, 0.15, [1, 1, 1, 0], 0.5));
    const road = K.mesh(r, b => floor(b, 2.2, 30, 5, -60, 0, [1, 1, 1, 0], 0.25));
    const across = K.mesh(r, b => {
      quadN(b, [14, 0, 5], [14, 0, -60], [14, 26, -60], [14, 26, 5], [1, 1, 1, 0], [[0, 0], [65 / 3.2, 0], [65 / 3.2, 26 / 3.2], [0, 26 / 3.2]], [-1, 0, 0]);
      quadN(b, [-3.2, 0, -60], [30, 0, -60], [30, 30, -60], [-3.2, 30, -60], [1, 1, 1, 0], [[0, 0], [33 / 3.2, 0], [33 / 3.2, 30 / 3.2], [0, 30 / 3.2]], [0, 0, 1]);
    });
    const plain = K.mesh(r, b => {
      box(b, 2.2, 0.075, -27, 0.16, 0.15, 64, [0.6, 0.58, 0.55, 0]);
      for (let z = 2; z > -50; z -= 7) {
        box(b, -3.1, 1.3, z, 0.12, 2.4, 1.1, 0x2a2622);
        box(b, -3.15, 1.5, z - 3, 0.1, 1.4, 1.6, 0x1c2024);
      }
      [[1.75, -0.6, 7, 0.9], [1.85, -3.0, 9, 0.8], [1.8, -6.0, 7, 0.9], [1.9, -11.0, 6, 0.8], [1.9, -17.0, 6, 0.9], [-2.7, -6.2, 2, 0.3]].forEach(([x, z, n, sp], i) => bagPile(b, x, z, n, sp, 40 + i, 0.15, 0.62));
      b.at(1.0, 0.15, -24, q => {
        q.box(1.5, 1.3, 1.0, 0xc8b020, { base: true });
        q.at(0, 1.3, 0, w => w.box(1.7, 0.1, 1.2, 0xb81e1a, { base: true }));
        q.at(0, 1.4, 0, w => w.box(0.06, 1.0, 0.06, 0x8a8a8a, { base: true }));
        q.at(0, 2.4, 0, w => w.prism(8, 1.3, 1.3, 0, 0.1, 0.1, 0.5, 0xd84030));
      });
      [[4.5, -14], [5.0, -30], [4.6, -44]].forEach(([x, z]) => {
        b.at(x, 0, z, q => {
          q.prism(8, 0.14, 0.14, 0, 0.1, 0.1, 3.4, 0x3a2a1c);
          for (let k = 0; k < 9; k++) {
            const g = rand(k * 7 + Math.round(z));
            q.at((g() - 0.5) * 2.6, 3.4 + g() * 2.6, (g() - 0.5) * 2.6, w => w.ellipsoid(0.8 + g() * 0.6, 0.6 + g() * 0.5, 0.8 + g() * 0.6, 7, 5, [0.2 + g() * 0.08, 0.24 + g() * 0.08, 0.14, 0]));
          }
        });
      });
      car(b, 'sedan', 0x8a8a7a, 6.0, -18, 0);
      car(b, 'sedan', 0xd0c8b0, 9.0, -34, PI);
      car(b, 'wagon', 0x6a5a3a, 6.2, -40, 0);
    });
    const sign = K.mesh(r, b => {
      quadN(b, [0.25, 1.6, -23.49], [1.75, 1.6, -23.49], [1.75, 2.25, -23.49], [0.25, 2.25, -23.49], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0, 0, 1]);
    });
    const graf = [0, 3, 1].map((tag, i) => ({
      m: K.mesh(r, b => quadN(b, [-3.18, 0.6 + i * 0.2, -1 - i * 6], [-3.18, 0.6 + i * 0.2, -4 - i * 6], [-3.18, 2.0 + i * 0.2, -4 - i * 6], [-3.18, 2.0 + i * 0.2, -1 - i * 6], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 0, 0])),
      tag
    }));
    const bus = K.mesh(r, b => {
      box(b, 0, 1.75, 0, 12, 3.0, 2.55, 0x1f4f7a);
      box(b, 0, 2.3, 1.29, 11, 1.0, 0.02, 0x1a2a34);
      box(b, 0, 0.55, 1.29, 12, 0.3, 0.02, 0xd8d8d0);
      [-4.2, 4.0].forEach(x => [-1.2, 1.2].forEach(z => wheel(b, x, 0.5, z, 0.5, 0.3)));
      box(b, -6.01, 2.6, 0, 0.02, 0.5, 2.0, [1, 0.75, 0.3, 1]);
      box(b, -6.01, 0.9, 0.8, 0.02, 0.25, 0.4, [1, 0.6, 0.2, 1]);
    });
    return {
      draw(opts) {
        const o = opts || {};
        r.draw(bricks, null, { texture: A.tex('paleBrick') });
        r.draw(walk, null, { texture: A.tex('sidewalk') });
        r.draw(road, null, { texture: A.tex('asphalt') });
        r.draw(across, null, { texture: A.tex('facade') });
        r.draw(plain);
        r.draw(sign, null, { texture: A.tex('sign') });
        graf.forEach(gf => r.draw(gf.m, null, { texture: A.tex('graf' + gf.tag) }));
        if (o.busX !== undefined) {
          r.draw(bus, M4.translate(o.busX, 0, -4.0), { blend: true, alpha: 0.55 });
          for (let k = -4; k <= 4; k++) if (k) r.draw(bus, M4.translate(o.busX + k * 0.3, 0.02 * k, -4.0), { blend: true, alpha: 0.16 });
        }
      },
      bus
    };
  }

  function build(r) {
    const cache = {};
    const PAINT = {
      steps: [512, (c, w, h) => Art.steps(c, w, h)],
      granite: [512, (c, w, h) => Art.granite(c, w, h, { base: '#a6a49c', rows: 2 })],
      graniteDark: [512, (c, w, h) => Art.granite(c, w, h, { base: '#56544e', rows: 4, seed: 9 })],
      facade: [512, (c, w, h) => Art.facade(c, w, h, { base: [92, 66, 56], mortar: '#3e3832', glassTop: '#2a3034', glassBot: '#0e1214', frame: '#5e5a52', sill: '#4e4a44' })],
      facadeStone: [512, (c, w, h) => Art.facade(c, w, h, { base: [140, 128, 112], mortar: '#6a645a', seed: 21, glassTop: '#5a6468' })],
      paleBrick: [512, (c, w, h) => Art.facade(c, w, h, { base: [196, 180, 140], mortar: '#a89c80', seed: 33, glassTop: '#4a5458' })],
      asphalt: [512, (c, w, h) => Art.asphalt(c, w, h)],
      sidewalk: [512, (c, w, h) => Art.sidewalk(c, w, h)],
      hall: [256, (c, w, h) => Art.hallWall(c, w, h)],
      steel: [256, (c, w, h) => Art.steel(c, w, h)],
      wallPaint: [256, (c, w, h) => Art.woodPanel(c, w, h)],
      concrete: [256, (c, w, h) => Art.granite(c, w, h, { base: '#8e8064', rows: 1, seed: 17 })],
      glow: [128, (c, w, h) => Art.glow(c, w, h)],
      wood: [512, (c, w, h) => Art.wood(c, w, h)],
      sign: [256, (c, w, h) => Art.storeSign(c, w, h)]
    };
    Art.TAGS.forEach((_, i) => { PAINT['graf' + i] = [256, Art.graffiti(i), 128]; });
    const A = {
      tex(key) {
        if (!cache[key]) {
          const p = PAINT[key];
          cache[key] = r.texture(p[0], p[1], p[2] ? { height: p[2] } : {});
        }
        return cache[key];
      }
    };
    const sets = {};
    const makers = { stairs: buildSet, hall: buildHall, door: buildDoor, lift: buildLift, avenue: buildAvenue };
    return {
      A,
      get(name) {
        if (!sets[name]) sets[name] = makers[name](r, A);
        return sets[name];
      },
      keys: Object.keys(makers),
      textures: Object.keys(PAINT)
    };
  }

  window.StairsWorld = { RISE, RUN, HALF, CHEEK, SEGS, TOP_S, TOP_Y, END_S, LAMPS, stepY, pitchY, groundAt, build };
})();
