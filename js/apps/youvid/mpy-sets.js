(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Props = window.MpyProps;

  const UNLIT = 1;

  function skyDome(b, R, yMin) {
    const NU = 36, NV = 12;
    const y0 = yMin === undefined ? -0.15 : yMin;
    for (let j = 0; j < NV; j++) {
      for (let i = 0; i < NU; i++) {
        const pt = (ii, jj) => {
          const a = (ii / NU) * PI * 2, e = y0 + (PI / 2 - y0) * (jj / NV);
          return [S(a) * C(e) * R, S(e) * R, C(a) * C(e) * R];
        };
        const uv = (ii, jj) => [ii / NU * 3, 1 - jj / NV];
        b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), rgb(0xffffff, UNLIT), [uv(i, j), uv(i + 1, j), uv(i + 1, j + 1), uv(i, j + 1)]);
      }
    }
    return b;
  }

  function field(b, o) {
    const { x0, z0, w, d, nx, nz, h, col, uv } = o;
    const P = (i, j) => {
      const x = x0 + (i / nx) * w, z = z0 + (j / nz) * d;
      return [x, h(x, z), z];
    };
    const N = (i, j) => {
      const e = 0.5;
      const x = x0 + (i / nx) * w, z = z0 + (j / nz) * d;
      return V3.norm([h(x - e, z) - h(x + e, z), 2 * e, h(x, z - e) - h(x, z + e)]);
    };
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
        const pts = q.map(([a, c]) => P(a, c));
        b.quad(pts[0], pts[3], pts[2], pts[1], [pts[0], pts[3], pts[2], pts[1]].map(p => rgb(col ? col(p[0], p[2], p[1]) : 0xffffff)), [pts[0], pts[3], pts[2], pts[1]].map(p => [p[0] * uv, p[2] * uv]), [N(q[0][0], q[0][1]), N(q[3][0], q[3][1]), N(q[2][0], q[2][1]), N(q[1][0], q[1][1])]);
      }
    }
    return b;
  }

  function hump(x, z, cx, cz, r, hgt) {
    const d = Math.hypot(x - cx, z - cz) / r;
    return d >= 1 ? 0 : hgt * (0.5 + 0.5 * C(d * PI));
  }

  const VALLEY_HILLS = [[0, 0, 9, 2.6], [22, 30, 26, 6], [-30, 36, 22, 7], [40, 70, 34, 12], [-10, 70, 30, 9], [70, 40, 30, 10], [-60, 70, 34, 14], [10, 110, 40, 18], [60, 110, 40, 22], [-50, 120, 40, 20]];

  function valleyH(x, z) {
    let y = -0.8 + 0.6 * S(x * 0.06) * C(z * 0.05) + 0.4 * S(x * 0.13 + z * 0.09);
    VALLEY_HILLS.forEach(([cx, cz, r, hh]) => { y = Math.max(y, y * 0.3 + hump(x, z, cx, cz, r, hh)); });
    return y;
  }

  function landCol(x, z, y) {
    const n = S(x * 0.21 + z * 0.13) * 0.5 + S(x * 0.07 - z * 0.17) * 0.5;
    if (y > 12) return n > 0.2 ? 0xf6c6dc : 0xfff2f6;
    if (n > 0.55) return 0xd8f0a0;
    if (n < -0.6) return 0x9ed880;
    return 0xffffff;
  }

  function ribbonRoad(b, pts, w, col, y0) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], c = pts[i + 1];
      const t = V3.norm(V3.sub(c, a));
      const s = V3.mul(V3.norm(V3.cross([0, 1, 0], t)), w);
      const lift = [0, y0 || 0.03, 0];
      b.quad(V3.add(V3.sub(a, s), lift), V3.add(V3.add(a, s), lift), V3.add(V3.add(c, s), lift), V3.add(V3.sub(c, s), lift), col, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
  }

  function curve(fn, n) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(fn(i / n));
    return out;
  }

  function buildCandyRing(b, R, n, seed) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + g() * 0.2;
      const r = R * (0.9 + g() * 0.25);
      const hgt = 14 + g() * 26;
      const w = 18 + g() * 22;
      b.push(M4.translate(S(a) * r, -2, C(a) * r), M4.rotY(a));
      b.ellipsoid(w, hgt, w * 0.6, 14, 8, rgb([0xf6c0d8, 0xc8b8f0, 0xb8e0f4, 0xf8e4b0, 0xd0f0c0][i % 5]), { colorAt: p => ((Math.floor((p[1] + 40) / 6) % 2) ? [0xf6c0d8, 0xc8b8f0, 0xb8e0f4, 0xf8e4b0, 0xd0f0c0][i % 5] : 0xfff8fc) });
      b.pop();
    }
    return b;
  }

  function buildCastle(b) {
    [[0, 0, 1.6, 9], [4, 1, 1.2, 7], [-3.5, 2, 1.1, 6], [1.5, -3, 1.0, 8]].forEach(([x, z, r, h]) => {
      b.at(x, 0, z, q => {
        q.prism(10, r, r, 0, r, r, h, 0xf4f4f8, {});
        q.at(0, h, 0, w => w.prism(10, r * 1.3, r * 1.3, 0, 0.05, 0.05, r * 2.2, 0xb8c8f0, {}));
      });
    });
    b.box(9, 4, 6, 0xf0f0f6, { base: true });
    return b;
  }

  function buildValley(b) {
    field(b, { x0: -120, z0: -60, w: 240, d: 220, nx: 70, nz: 64, h: valleyH, col: landCol, uv: 0.09 });
    return b;
  }

  function buildValleyDeco(b) {
    buildCandyRing(b, 150, 16, 3);
    b.at(48, valleyH(48, 72) + 0.5, 72, h => buildCastle(h));
    const g = rand(9);
    for (let i = 0; i < 46; i++) {
      const x = -80 + g() * 160, z = 10 + g() * 120;
      const y = valleyH(x, z);
      const col = [0xf4a8c0, 0x8ea8e8, 0xb898e0, 0xf4b070, 0xf0dc80, 0xffffff][i % 6];
      const hgt = 2 + g() * 3;
      b.at(x, y, z, h => { h.prism(6, 0.08, 0.08, 0, 0.06, 0.06, hgt * 0.5, 0xb08aa8, {}); h.at(0, hgt * 0.7, 0, q => q.ellipsoid(0.7 + g() * 0.5, hgt * 0.4, 0.7, 10, 6, col)); });
    }
    for (let i = 0; i < 20; i++) {
      const x = -60 + g() * 120, z = 20 + g() * 90;
      const y = valleyH(x, z);
      const s = 1.2 + g() * 2.4;
      b.at(x, y + s * 0.7, z, h => h.ellipsoid(s, s * 0.8, s, 12, 8, [0xf8d4e4, 0xfffaf4, 0xd8e8fc][i % 3], { colorAt: p => (Math.abs(p[1] - p[0] * 0.4) < s * 0.2 ? 0xf08ab0 : [0xf8d4e4, 0xfffaf4, 0xd8e8fc][i % 3]) }));
    }
    const road = curve(k => [lerp(-30, 60, k) + S(k * 7) * 12, 0, lerp(16, 110, k)], 40).map(p => [p[0], valleyH(p[0], p[2]), p[2]]);
    ribbonRoad(b, road, 0.9, 0xf4a4c0, 0.15);
    const road2 = curve(k => [lerp(40, -70, k) + C(k * 6) * 10, 0, lerp(20, 90, k)], 40).map(p => [p[0], valleyH(p[0], p[2]), p[2]]);
    ribbonRoad(b, road2, 0.7, 0x9ad0f4, 0.15);
    return b;
  }

  function pathH(x, z) {
    return 0.15 * S(x * 0.4) * C(z * 0.3) + hump(x, z, -7, 14, 9, 1.6) + hump(x, z, 9, 20, 10, 2.2) + Math.max(0, (z - 26) * 0.18);
  }

  function pathCurve(k) {
    return [S(k * 3.2) * 1.2 + k * 2.5, 0, lerp(-6, 30, k)];
  }

  function buildPathSet(b) {
    field(b, { x0: -30, z0: -12, w: 60, d: 60, nx: 40, nz: 40, h: pathH, col: (x, z) => (Math.abs(x - pathCurve((z + 6) / 36)[0]) < 1.6 && z > -6 && z < 30 ? 0xf6e2a0 : landCol(x, z, 0)), uv: 0.25 });
    return b;
  }

  function buildPathStones(b) {
    const g = rand(21);
    for (let i = 0; i < 130; i++) {
      const k = g();
      const c = pathCurve(k);
      const x = c[0] + (g() - 0.5) * 2.6, z = c[2] + (g() - 0.5) * 0.8;
      const y = pathH(x, z);
      b.push(M4.translate(x, y + 0.02, z), M4.rotY(g() * PI));
      b.ellipsoid(0.22 + g() * 0.14, 0.05, 0.16 + g() * 0.1, 10, 4, [0xcf9a5e, 0xd8a868, 0xc08a52, 0xe0b476][i % 4]);
      b.pop();
    }
    for (let i = 0; i < 14; i++) {
      const k = 0.35 + i * 0.045;
      const c = pathCurve(k);
      [-1, 1].forEach(s => {
        const x = c[0] + s * 2.1, z = c[2];
        b.at(x, pathH(x, z), z, h => { h.box(0.14, 0.9 + (i % 3) * 0.12, 0.14, 0x9a6a44, { base: true }); });
      });
    }
    return b;
  }

  function buildMeadow(b) {
    field(b, { x0: -60, z0: -20, w: 120, d: 110, nx: 40, nz: 40, h: (x, z) => 0.3 * S(x * 0.12) * C(z * 0.1) + hump(x, z, 30, 70, 30, 6) + hump(x, z, -40, 80, 26, 5), col: landCol, uv: 0.2 });
    const g = rand(31);
    for (let r = 0; r < 4; r++) {
      const off = r * 7;
      const road = curve(k => [lerp(-60, 60, k), 0, 6 + off + S(k * 9 + r) * 2.5], 50);
      ribbonRoad(b, road, 0.28, r % 2 ? 0xf6a8c0 : 0xf08ab0, 0.05);
    }
    for (let i = 0; i < 80; i++) {
      const x = -50 + g() * 100, z = -10 + g() * 60;
      b.at(x, 0.05, z, h => h.ellipsoid(0.06, 0.06, 0.06, 6, 4, [0xffe46a, 0xffffff, 0xf6a8d0, 0xa8c8ff][i % 4]));
    }
    return b;
  }

  function buildTown(b) {
    field(b, { x0: -20, z0: -20, w: 40, d: 60, nx: 8, nz: 12, h: () => 0, col: () => 0xffffff, uv: 0.3 });
    return b;
  }

  function buildHouses(b) {
    const g = rand(41);
    const row = (side) => {
      for (let i = 0; i < 6; i++) {
        const z = -6 + i * 6.5;
        const w = 5.5, h = 5 + g() * 4, d = 6;
        const x = side * (5.5 + d / 2);
        b.at(x, 0, z, q => {
          q.box(d, h, w, [0xf8d0dc, 0xfbe8a8, 0xc8ecd0, 0xcfe0f8, 0xf4d8b8, 0xe4d0f4][(i + (side > 0 ? 3 : 0)) % 6], { base: true, uvScale: 0.25 });
          q.at(-side * d / 2, h, 0, r => { r.push(M4.rotZ(side * 0.0)); r.box(1.2, 1.8, w + 0.4, [0x5c8ed8, 0xe87ea0, 0x9ad070][i % 3]); r.pop(); });
          q.at(-side * (d / 2 + 0.6), 2.8, 0, r => { r.push(M4.rotZ(side * 0.35)); r.box(1.4, 0.08, w * 0.8, 0xf08aa8); r.pop(); });
          [1.2, 3.6].forEach(y => [-1.5, 1.5].forEach(zz => q.at(-side * (d / 2 + 0.01), y + 0.6, zz, r => r.box(0.04, 1.0, 0.8, 0x7aa0c8))));
        });
      }
    };
    row(-1);
    row(1);
    for (let i = 0; i < 6; i++) {
      [-1, 1].forEach(s => b.at(s * 4.2, 0, -4 + i * 7, q => {
        q.prism(8, 0.08, 0.08, 0, 0.08, 0.08, 3.4, 0xffffff, {});
        for (let k = 0; k < 6; k++) q.at(0, 0.3 + k * 0.55, 0, r => r.prism(8, 0.085, 0.085, 0, 0.085, 0.085, 0.24, 0xf05a6a, {}));
        q.at(0, 3.5, 0, r => r.ellipsoid(0.2, 0.24, 0.2, 10, 6, 0xfff4c8));
      }));
    }
    for (let i = 0; i < 8; i++) {
      b.at(-3 + (i % 4) * 2, 0.25, 14 + Math.floor(i / 4) * 2, q => q.ellipsoid(0.7, 0.3, 0.7, 10, 5, [0x7ccc5a, 0xf2b030, 0xf06aa8, 0x58a8ec][i % 4]));
    }
    for (let i = 0; i < 24; i++) {
      const k = i / 23;
      const x = lerp(-9, 9, k);
      b.at(x, 0, 28, q => { q.prism(6, 0.05, 0.05, 0, 0.05, 0.05, 1.0, 0xfafaf4, {}); });
    }
    b.at(0, 1.0, 28, q => q.box(18, 0.06, 0.06, 0xfafaf4));
    b.at(0, 0.5, 28, q => q.box(18, 0.04, 0.04, 0xfafaf4));
    return b;
  }

  function buildVista(b) {
    field(b, { x0: -150, z0: -20, w: 300, d: 260, nx: 60, nz: 52, h: (x, z) => valleyH(x * 0.8 + 30, z * 0.8 + 50) * 0.75 * clamp((Math.hypot(x, z) - 10) / 40, 0, 1), col: (x, z, y) => (S(x * 0.08 + z * 0.06) > 0.6 ? 0xf6a0c8 : S(x * 0.05 - z * 0.09) > 0.7 ? 0xb8a0f0 : landCol(x, z, y)), uv: 0.08 });
    return b;
  }

  function buildDesert(b) {
    field(b, { x0: -40, z0: -20, w: 80, d: 140, nx: 30, nz: 44, h: (x, z) => 0.08 * S(x * 0.5) * C(z * 0.4) + Math.max(0, z - 60) * 0.03, col: () => 0xffffff, uv: 0.55 });
    return b;
  }

  function buildDesertDeco(b) {
    const g = rand(51);
    const derrick = (x, z, h) => {
      b.push(M4.translate(x, 0, z));
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
        b.push(M4.translate(sx * 1.4, 0, sz * 1.4), M4.rotZ(-sx * 0.18), M4.rotX(sz * 0.18));
        b.box(0.16, h, 0.16, 0x2a1c16, { base: true });
        b.pop();
      });
      for (let k = 1; k < 6; k++) {
        const y = (k / 6) * h;
        const w = 2.8 * (1 - (k / 6) * 0.65);
        b.at(0, y, w / 2, q => q.box(w, 0.1, 0.1, 0x2a1c16));
        b.at(0, y, -w / 2, q => q.box(w, 0.1, 0.1, 0x2a1c16));
        b.at(w / 2, y, 0, q => q.box(0.1, 0.1, w, 0x2a1c16));
        b.at(-w / 2, y, 0, q => q.box(0.1, 0.1, w, 0x2a1c16));
      }
      b.pop();
    };
    derrick(-14, 70, 16);
    derrick(10, 84, 18);
    derrick(26, 64, 14);
    for (let i = 0; i < 26; i++) {
      const x = -12 + g() * 24, z = 2 + g() * 40;
      b.push(M4.translate(x, 0.05, z), M4.rotY(g() * PI), M4.rotZ((g() - 0.5) * 0.3));
      b.box(0.1 + g() * 0.9, 0.05 + g() * 0.1, 0.12 + g() * 0.3, g() < 0.5 ? 0x3a2a1e : 0x2a2420);
      b.pop();
    }
    for (let i = 0; i < 10; i++) {
      const z = 6 + i * 3.2;
      b.at(-5 - (i % 2) * 0.3, 0, z, q => { q.box(0.12, 1.1, 0.12, 0x3a2a1e, { base: true }); });
    }
    K.tube(b, curve(k => [-5.1, 0.85 - S(k * PI * 9) * 0.05, 6 + k * 29], 40), curve(() => 0.012, 40), 3, 0x4a3e34);
    K.tube(b, curve(k => [-5.1, 0.5 - S(k * PI * 9) * 0.04, 6 + k * 29], 40), curve(() => 0.012, 40), 3, 0x4a3e34);
    [[-3, 9], [4, 14], [-6, 22], [6, 28], [2, 38]].forEach(([x, z], i) => b.at(x, 0.35, z, q => { q.push(M4.rotY(i)); q.prism(10, 0.3, 0.3, -0.35, 0.3, 0.3, 0.35, 0x2a2622, {}); q.pop(); }));
    return b;
  }

  function buildRoom(b) {
    b.at(0, -0.01, 0, h => h.box(12, 0.02, 12, 0x2a2624));
    b.at(0, 1.6, -2.2, h => h.box(8, 3.4, 0.05, rgb(0xffffff, 1), { uvScale: 0.5 }));
    return b;
  }

  function buildPlant(b) {
    b.prism(14, 0.18, 0.18, 0, 0.22, 0.22, 0.42, 0x3a3634, {});
    b.at(0, 0.4, 0, h => h.disc(0.2, 14, 0x24201c, 0));
    const g = rand(61);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2 + g() * 0.3;
      const len = 0.6 + g() * 0.5;
      const pts = curve(k => [S(a) * k * len * 0.5, 0.4 + k * len - k * k * len * 0.45, C(a) * k * len * 0.5], 6);
      K.tube(b, pts, pts.map(() => 0.008), 4, 0x2a3a24);
      const tip = pts[pts.length - 1];
      b.push(M4.translate(tip[0], tip[1], tip[2]), M4.rotY(a), M4.rotX(0.6 + g() * 0.4));
      b.ellipsoid(0.12, 0.02, 0.22, 10, 4, 0x34482c);
      b.pop();
    }
    return b;
  }

  function buildChair(b) {
    b.at(0, 0.45, 0, h => h.box(0.5, 0.06, 0.5, 0x3a2a22));
    [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].forEach(([x, z]) => b.at(x, 0.22, z, h => h.box(0.04, 0.45, 0.04, 0x2a1e18)));
    b.at(0, 0.8, -0.23, h => h.box(0.5, 0.6, 0.05, 0x3a2a22));
    return b;
  }

  function facade(b, w, h, d, col, porch) {
    b.box(d, h, w, col, { base: true, uvScale: 0.35 });
    if (porch) {
      b.at(-d / 2 - 1.2, 3.0, 0, q => q.box(2.4, 0.12, w, 0x4a3022));
      for (let i = 0; i < 4; i++) b.at(-d / 2 - 2.3, 1.5, -w / 2 + 0.3 + i * ((w - 0.6) / 3), q => q.box(0.16, 3.0, 0.16, 0x3a2416));
    }
    b.at(0, h + 0.6, 0, q => q.box(d * 0.4, 1.2, w, col));
  }

  function buildStreet(b, burnt) {
    field(b, { x0: -14, z0: -20, w: 28, d: 120, nx: 8, nz: 30, h: () => 0, col: () => 0xffffff, uv: 0.2 });
    const g = rand(71);
    [-1, 1].forEach(side => {
      for (let i = 0; i < 7; i++) {
        const z = -6 + i * 10;
        b.push(M4.translate(side * 9, 0, z), M4.rotY(side > 0 ? PI : 0));
        facade(b, 8.5, 5 + g() * 4, 6, burnt ? 0x3a2418 : 0x6a4630, true);
        b.pop();
      }
    });
    b.at(4, 0, 90, h => {
      h.box(5, 16, 5, burnt ? 0x2a1a12 : 0x4a3224, { base: true });
      h.at(0, 16, 0, q => q.prism(4, 3.8, 3.8, 0, 0.1, 0.1, 6, burnt ? 0x221410 : 0x3a2418, {}));
    });
    b.at(-6, 0, 95, h => h.box(3, 10, 3, 0x3a2418, { base: true }));
    return b;
  }

  function buildBarnDoor(b) {
    b.at(0, 1.6, 0, h => h.box(3.2, 3.2, 0.1, 0xfff2d0));
    return b;
  }

  function buildDoorway(b) {
    b.at(0, 1.5, -1.5, h => h.box(6, 3, 0.1, 0xffffff, { uvScale: 0.5 }));
    b.at(0.8, 1.1, -1.2, h => h.box(0.9, 2.2, 0.06, 0x6a4026));
    b.at(0.8, 1.1, -1.24, h => h.box(1.06, 2.32, 0.04, 0x3a2416));
    return b;
  }

  function buildFrames(b, seed) {
    const g = rand(seed);
    const beam = (x, y, z, sx, sy, sz, rz) => b.at(x, y, z, q => { q.push(M4.rotZ(rz || 0)); q.box(sx, sy, sz, 0x1c120c); q.pop(); });
    for (let k = 0; k < 4; k++) {
      const z0 = k * 7;
      for (let i = 0; i < 6; i++) beam(-6 + i * 2.4, 3.5, z0, 0.22, 7 + g() * 3, 0.22, (g() - 0.5) * 0.15);
      beam(0, 7, z0, 13, 0.24, 0.24, (g() - 0.5) * 0.1);
      beam(0, 3.6, z0, 13, 0.2, 0.2, (g() - 0.5) * 0.2);
      for (let i = 0; i < 4; i++) beam(-4 + i * 3, 5.2, z0, 0.16, 3.5, 0.16, 0.6 * (i % 2 ? 1 : -1));
    }
    for (let i = 0; i < 6; i++) beam(-6 + i * 2.4, 7.2, 10, 0.2, 0.2, 22, 0);
    return b;
  }

  function buildInterior(b) {
    b.at(0, -0.01, 0, h => h.box(14, 0.02, 14, 0xffffff, { uvScale: 0.5 }));
    b.at(0, 2, -4, h => h.box(14, 4, 0.1, 0xffffff, { uvScale: 0.5 }));
    b.at(-5, 2, 0, h => h.box(0.1, 4, 14, 0xffffff, { uvScale: 0.5 }));
    const g = rand(81);
    for (let i = 0; i < 4; i++) {
      b.at(-3.5 + i * 2.2, 0, -3.4, h => {
        h.box(1.6, 2.4, 0.4, 0x3a2416, { base: true });
        [0.6, 1.2, 1.8].forEach(y => h.at(0, y, 0.22, q => q.box(1.5, 0.05, 0.1, 0x24160e)));
      });
    }
    [[-2, 1], [1.5, -1], [3, 2]].forEach(([x, z]) => b.at(x, 0, z, h => {
      h.at(0, 0.75, 0, q => q.box(1.2, 0.06, 0.8, 0x4a3022));
      [[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]].forEach(([lx, lz]) => h.at(lx, 0.37, lz, q => q.box(0.06, 0.74, 0.06, 0x2a1a10)));
    }));
    [[-4, 3], [-4.2, 1.8], [4, -2.5]].forEach(([x, z]) => b.at(x, 0.45, z, h => h.prism(12, 0.32, 0.32, -0.45, 0.32, 0.32, 0.45, 0x5a3a24, {})));
    for (let i = 0; i < 10; i++) b.push(M4.translate(-4 + g() * 8, 0.05, -2 + g() * 5), M4.rotY(g() * PI)).box(0.4 + g() * 0.6, 0.05, 0.1, 0x1c120c).pop();
    return b;
  }

  function buildShed(b) {
    b.box(2.4, 2.6, 2.0, 0xffffff, { base: true, uvScale: 0.6 });
    b.at(0, 2.6, 0, h => h.box(2.7, 0.15, 2.3, 0x3a2416));
    b.at(0.3, 1.1, 1.02, h => h.box(0.9, 2.1, 0.04, 0x8a5430));
    b.at(0.3, 1.1, 1.05, h => [0.6, 1.4].forEach(y => h.at(0, y - 1.1, 0, q => q.box(0.95, 0.08, 0.03, 0x5a3420))));
    return b;
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      sky: mk(b => skyDome(b, 260, -0.2)),
      skyNear: mk(b => skyDome(b, 60, -0.3)),
      valley: mk(buildValley),
      valleyDeco: mk(buildValleyDeco),
      path: mk(buildPathSet),
      pathStones: mk(buildPathStones),
      meadow: mk(buildMeadow),
      town: mk(buildTown),
      houses: mk(buildHouses),
      vista: mk(buildVista),
      desert: mk(buildDesert),
      desertDeco: mk(buildDesertDeco),
      room: mk(buildRoom),
      plant: mk(buildPlant),
      chair: mk(buildChair),
      street: mk(b => buildStreet(b, false)),
      streetBurnt: mk(b => buildStreet(b, true)),
      barnDoor: mk(buildBarnDoor),
      doorway: mk(buildDoorway),
      frames: mk(b => buildFrames(b, 91)),
      interior: mk(buildInterior),
      shed: mk(buildShed),
      r
    };
  }

  const LAND = { spec: [0.05, 4], rim: 0.25 };
  const MATTE = { spec: [0.06, 5], rim: 0.35 };

  function draw(fx, W, set, T, o) {
    const opt = o || {};
    const sky = (key, near) => fx.draw(near ? W.skyNear : W.sky, M4.translate(opt.eye ? opt.eye[0] : 0, -8, opt.eye ? opt.eye[2] : 0), { texture: T(key), noFog: true, rim: 0, spec: [0, 1] });
    switch (set) {
      case 'valley':
        sky('landSky');
        fx.draw(W.valley, null, Object.assign({ texture: T('landGrass') }, LAND));
        fx.draw(W.valleyDeco, null, LAND);
        break;
      case 'path':
        sky('landSky');
        fx.draw(W.path, null, Object.assign({ texture: T('landGrass') }, LAND));
        fx.draw(W.pathStones, null, LAND);
        break;
      case 'meadow':
        sky('landSky');
        fx.draw(W.meadow, null, Object.assign({ texture: T('landGrass') }, LAND));
        break;
      case 'hill':
        sky('landSky');
        break;
      case 'town':
        sky('landSky');
        fx.draw(W.town, null, Object.assign({ texture: T('petals') }, LAND));
        fx.draw(W.houses, null, Object.assign({ texture: T('landWall') }, LAND));
        break;
      case 'vista':
        sky('vistaSky');
        fx.draw(W.vista, null, Object.assign({ texture: T('landGrass') }, LAND));
        break;
      case 'gifts':
        sky('landSky');
        fx.draw(W.meadow, null, Object.assign({ texture: T('landGrass') }, LAND));
        break;
      case 'desert':
        sky('duskSky');
        fx.draw(W.desert, null, Object.assign({ texture: T('cracked') }, MATTE));
        fx.draw(W.desertDeco, null, MATTE);
        break;
      case 'room':
        fx.draw(W.room, null, Object.assign({ texture: T('blinds') }, MATTE));
        break;
      case 'spyroom':
        fx.draw(W.room, null, Object.assign({ texture: T('spyBlinds') }, MATTE));
        break;
      case 'street':
        sky('duskSky');
        fx.draw(W.street, null, Object.assign({ texture: T('dirt') }, MATTE));
        break;
      case 'streetBurnt':
        sky('smokeSky');
        fx.draw(W.streetBurnt, null, Object.assign({ texture: T('dirt') }, MATTE));
        break;
      case 'doorway':
        fx.draw(W.doorway, null, Object.assign({ texture: T('woodDark') }, MATTE));
        break;
      case 'inferno':
        sky('smokeSky');
        fx.draw(W.desert, null, Object.assign({ texture: T('dirt') }, MATTE));
        fx.draw(W.frames, M4.translate(0, 0, 8), MATTE);
        break;
      case 'interior':
        fx.draw(W.interior, null, Object.assign({ texture: T('woodBurnt') }, MATTE));
        break;
      case 'shed':
        sky('smokeSky');
        fx.draw(W.desert, null, Object.assign({ texture: T('dirt') }, MATTE));
        fx.draw(W.shed, null, Object.assign({ texture: T('shedWood') }, MATTE));
        break;
      default:
        break;
    }
  }

  window.MpySets = { build, draw, valleyH, pathH, pathCurve, hump, LAND, MATTE };
})();
