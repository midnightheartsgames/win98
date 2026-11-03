(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;

  const GUN = 0x3a3e44, GUN_DK = 0x26292d, GUN_HI = 0x5a6068, BRASS = 0x8c7650, GOLD = 0xe6be52, GOLD_DK = 0xb48a30, PINK = 0xf08ab2;
  const WEAPON_MAT = { spec: [0.45, 22], rim: 0.55 };
  const GOLD_MAT = { spec: [1.1, 30], rim: 0.9 };
  const CANDY_MAT = { spec: [0.4, 18], rim: 0.9 };
  const SOFT_MAT = { spec: [0.12, 8], rim: 1.0 };

  function cyl(b, r0, r1, z0, z1, col, sides, caps) {
    b.push(M4.rotX(PI / 2));
    b.prism(sides || 16, r0, r0, z0, r1, r1, z1, col, { capTop: !!(caps && caps.front), capBottom: !!(caps && caps.back) });
    b.pop();
    return b;
  }

  function torus(b, R, r, nu, nv, col) {
    const pt = (u, v) => {
      const a = u * PI * 2, w = v * PI * 2;
      const n = [C(a) * C(w), S(a) * C(w), S(w)];
      return { p: [C(a) * R + n[0] * r, S(a) * R + n[1] * r, n[2] * r], n };
    };
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const A = pt(i / nu, j / nv), B = pt((i + 1) / nu, j / nv), Cc = pt((i + 1) / nu, (j + 1) / nv), Dd = pt(i / nu, (j + 1) / nv);
        b.quad(A.p, B.p, Cc.p, Dd.p, col, null, [A.n, B.n, Cc.n, Dd.n]);
      }
    }
    return b;
  }

  const FLAMER = { grip: [0, 0, 0], front: [0, 0.035, 0.42], muzzle: [0, 0.1, 1.02], pilot: [0, 0.015, 1.02], hose: [0, -0.06, -0.12], back: [0, 0.1, -0.16] };

  function buildFlamer(b) {
    b.at(0, 0.1, 0, h => {
      cyl(h, 0.075, 0.075, -0.18, 0.1, GUN, 20, { back: true });
      [-0.12, -0.05, 0.02].forEach(z => cyl(h, 0.081, 0.081, z - 0.012, z + 0.012, GUN_DK, 20));
      cyl(h, 0.062, 0.05, 0.1, 0.16, GUN_HI, 20);
      cyl(h, 0.034, 0.034, 0.16, 0.8, GUN, 14);
      cyl(h, 0.04, 0.04, 0.55, 0.6, GUN_DK, 14);
      cyl(h, 0.058, 0.062, 0.8, 0.98, GUN, 20);
      cyl(h, 0.066, 0.07, 0.94, 1.02, GUN_DK, 20);
      cyl(h, 0.05, 0.05, 1.0, 1.021, 0x121314, 20, { front: true });
      [0.84, 0.88].forEach(z => cyl(h, 0.064, 0.064, z - 0.006, z + 0.006, GUN_HI, 20));
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * PI * 2 + 0.3;
        h.at(C(a) * 0.077, S(a) * 0.077, -0.04, q => q.box(0.012, 0.012, 0.1, GUN_DK));
      }
    });
    K.tube(b, [[0, 0.06, 0.3], [0, -0.03, 0.5], [0, -0.03, 0.78], [0, 0.0, 0.96], [0, 0.018, 1.0]], [0.009, 0.009, 0.009, 0.009, 0.008], 6, GUN_HI);
    b.at(0, 0.015, 1.0, h => cyl(h, 0.012, 0.01, 0, 0.03, BRASS, 8, { front: true }));
    b.push(M4.rotX(0.25));
    b.at(0, -0.06, 0.0, h => h.box(0.04, 0.13, 0.05, GUN_DK));
    b.pop();
    b.at(0, -0.035, 0.42, h => { h.push(M4.rotX(-0.1)); h.box(0.036, 0.11, 0.04, GUN_DK); h.pop(); });
    b.at(0, -0.02, -0.04, h => h.box(0.012, 0.03, 0.06, GUN_HI));
    b.at(0, -0.06, -0.14, h => cyl(h, 0.02, 0.02, -0.03, 0.04, GUN_DK, 10));
    return b;
  }

  function buildRainblower(b) {
    const path = [];
    for (let i = 0; i <= 18; i++) {
      const k = i / 18;
      path.push([0, 0.1 + S(k * PI) * 0.02, -0.1 + k * 0.8]);
    }
    K.tube(b, path, path.map(() => 0.034), 14, GOLD);
    b.at(0, 0.1, 0.7, h => {
      cyl(h, 0.04, 0.06, 0, 0.12, GOLD, 22);
      cyl(h, 0.06, 0.13, 0.12, 0.3, GOLD, 26);
      cyl(h, 0.13, 0.142, 0.3, 0.32, GOLD_DK, 26);
      cyl(h, 0.1, 0.1, 0.31, 0.312, 0x5a3a10, 26, { front: true });
    });
    b.at(0, 0.1, 0.32, h => { h.push(M4.rotY(PI / 2)); torus(h, 0.085, 0.016, 26, 8, GOLD); h.pop(); });
    b.at(0, 0.03, 0.44, h => { h.push(M4.rotY(PI / 2), M4.rotZ(0.3)); torus(h, 0.06, 0.013, 22, 6, GOLD_DK); h.pop(); });
    [0.18, 0.26, 0.34].forEach(z => b.at(0, 0.15, z, h => {
      h.prism(10, 0.014, 0.014, 0, 0.014, 0.014, 0.06, GOLD_DK, {});
      h.at(0, 0.065, 0, q => q.prism(10, 0.02, 0.02, 0, 0.02, 0.02, 0.012, 0xf4e8c8, {}));
    }));
    b.at(0, -0.04, 0.5, h => h.ellipsoid(0.075, 0.075, 0.08, 18, 12, PINK));
    b.at(0, 0.0, 0.5, h => h.prism(10, 0.02, 0.02, 0, 0.02, 0.02, 0.06, GOLD_DK, {}));
    b.at(0.065, -0.03, 0.5, h => h.ellipsoid(0.02, 0.02, 0.02, 8, 6, 0xffffff));
    b.at(0, 0.1, -0.12, h => cyl(h, 0.014, 0.024, -0.06, 0, GOLD_DK, 10, { back: true }));
    b.push(M4.rotX(0.3));
    b.at(0, -0.04, 0.0, h => h.box(0.035, 0.11, 0.045, 0xc89a40));
    b.pop();
    b.at(0, -0.02, 0.3, h => h.box(0.03, 0.09, 0.035, 0xc89a40));
    K.tube(b, [[0, -0.08, -0.08], [0.05, -0.2, -0.1], [0.08, -0.3, -0.16]], [0.012, 0.012, 0.012], 6, 0xf6a8c8);
    return b;
  }

  function buildLolliStick(b) {
    b.prism(10, 0.014, 0.014, -0.62, 0.014, 0.014, 0.0, 0xfffaf2, { capBottom: true });
    [-0.5, -0.36, -0.22, -0.08].forEach(y => b.at(0, y, 0, h => h.prism(10, 0.0145, 0.0145, -0.02, 0.0145, 0.0145, 0.02, 0xf4b8d0, {})));
    return b;
  }

  function buildDisc(b, R, T, edge) {
    b.push(M4.rotX(PI / 2));
    b.prism(32, R, R, -T / 2, R, R, T / 2, edge, { capTop: false });
    b.pop();
    const face = (z, nz) => {
      for (let i = 0; i < 32; i++) {
        const a0 = (i / 32) * PI * 2, a1 = ((i + 1) / 32) * PI * 2;
        const p0 = [C(a0) * R, S(a0) * R, z], p1 = [C(a1) * R, S(a1) * R, z];
        const uv = (a) => [0.5 + C(a) * 0.5, 0.5 + S(a) * 0.5];
        if (nz > 0) b.tri([0, 0, z], p0, p1, 0xffffff, [[0.5, 0.5], uv(a0), uv(a1)], [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        else b.tri([0, 0, z], p1, p0, 0xffffff, [[0.5, 0.5], uv(a1), uv(a0)], [[0, 0, -1], [0, 0, -1], [0, 0, -1]]);
      }
    };
    face(T / 2, 1);
    face(-T / 2, -1);
    return b;
  }

  function buildAxe(b) {
    b.prism(8, 0.016, 0.016, -0.42, 0.018, 0.018, 0.36, 0x6a4a30, { capBottom: true });
    b.at(0, 0.3, 0, h => {
      h.box(0.022, 0.09, 0.07, 0x9a2a22);
      h.at(0, 0, 0.09, q => { q.push(M4.rotX(0)); q.box(0.012, 0.13, 0.12, 0xb8bcc0); q.pop(); });
      h.at(0, 0, -0.07, q => q.box(0.024, 0.04, 0.07, 0x9a2a22));
    });
    return b;
  }

  function buildFlareGun(b) {
    b.at(0, 0.05, 0.08, h => cyl(h, 0.032, 0.032, -0.06, 0.16, 0xe8742c, 14, { front: true, back: true }));
    b.at(0, 0.05, 0.24, h => cyl(h, 0.022, 0.022, 0, 0.004, 0x221a14, 14, { front: true }));
    b.push(M4.rotX(0.3));
    b.at(0, -0.035, 0, h => h.box(0.032, 0.11, 0.045, 0x6a3a1e));
    b.pop();
    b.at(0, 0.01, 0.04, h => h.box(0.006, 0.03, 0.03, 0x2a2420));
    return b;
  }

  function buildGift(b, w, h, d) {
    b.box(w, h, d, 0xffffff, { base: true, uvScale: 1 / Math.max(w, h, d) });
    return b;
  }

  function buildBow(b, col) {
    [-1, 1].forEach(s => b.at(s * 0.11, 0.07, 0, h => { h.push(M4.rotZ(s * 0.5)); torus(h, 0.08, 0.026, 18, 6, col); h.pop(); }));
    b.ellipsoid(0.05, 0.04, 0.05, 10, 6, col);
    return b;
  }

  function buildBalloonicorn(b) {
    const pink = 0xf4a4c2, pinkDk = 0xe07ea4, muzzle = 0xfbe4ea, mane = 0x8ab4f0;
    b.ellipsoid(0.62, 0.46, 0.44, 22, 14, pink);
    b.at(0.5, 0.42, 0, h => { h.push(M4.rotZ(-0.35)); h.ellipsoid(0.22, 0.3, 0.24, 16, 10, pink); h.pop(); });
    b.at(0.72, 0.78, 0, h => h.ellipsoid(0.34, 0.3, 0.3, 18, 12, pink));
    b.at(0.98, 0.7, 0, h => h.ellipsoid(0.17, 0.15, 0.2, 14, 8, muzzle));
    [-1, 1].forEach(s => {
      b.at(1.1, 0.72, s * 0.08, h => h.ellipsoid(0.025, 0.018, 0.025, 8, 5, pinkDk));
      b.at(0.86, 0.9, s * 0.2, h => h.ellipsoid(0.06, 0.07, 0.04, 10, 6, 0x1a1418));
      b.at(0.89, 0.93, s * 0.215, h => h.ellipsoid(0.02, 0.02, 0.015, 6, 4, 0xffffff));
      b.at(0.62, 1.04, s * 0.17, h => { h.push(M4.rotX(s * 0.4)); h.ellipsoid(0.06, 0.12, 0.035, 10, 6, pink); h.pop(); });
      [[0.35, 0], [-0.32, 0]].forEach(([x]) => b.at(x, -0.42, s * 0.24, h => h.prism(12, 0.09, 0.09, -0.24, 0.1, 0.1, 0.05, pink, { capBottom: true })));
      b.at(-0.62 + 0.06 * s, 0.2, s * 0.05, h => h.ellipsoid(0.12, 0.16, 0.1, 10, 6, mane));
    });
    for (let i = 0; i < 6; i++) b.at(0.5 - i * 0.07, 1.0 - i * 0.07, 0, h => h.ellipsoid(0.09, 0.09, 0.08, 10, 6, i % 2 ? mane : 0xc8a0f0));
    b.push(M4.translate(0.8, 1.04, 0), M4.rotZ(-0.5));
    for (let i = 0; i < 5; i++) b.at(0, i * 0.065, 0, h => h.prism(12, 0.05 - i * 0.009, 0.05 - i * 0.009, 0, 0.042 - i * 0.009, 0.042 - i * 0.009, 0.065, i % 2 ? 0xfff2c0 : 0xf8d070, {}));
    b.pop();
    b.at(-0.64, -0.05, 0, h => h.ellipsoid(0.06, 0.06, 0.06, 8, 5, pinkDk));
    return b;
  }

  function buildHamster(b) {
    b.ellipsoid(0.42, 0.36, 0.38, 20, 14, 0xfbf6ee, { colorAt: p => (p[1] > 0.12 && p[0] < -0.05 ? 0xc89660 : p[2] < -0.25 ? 0xd8a670 : 0xfbf6ee) });
    [-1, 1].forEach(s => {
      b.at(s * 0.2, 0.3, 0.12, h => h.ellipsoid(0.08, 0.06, 0.04, 10, 6, 0xf0b8b0));
      b.at(s * 0.14, 0.12, 0.33, h => h.ellipsoid(0.035, 0.04, 0.02, 8, 5, 0x1a1414));
      b.at(s * 0.2, -0.28, 0.18, h => h.ellipsoid(0.06, 0.04, 0.06, 8, 5, 0xf4b4b4));
      b.at(s * 0.26, -0.05, 0.28, h => h.ellipsoid(0.05, 0.04, 0.05, 8, 5, 0xf4b4b4));
    });
    b.at(0, 0.04, 0.38, h => h.ellipsoid(0.03, 0.022, 0.02, 8, 5, 0xf08a9a));
    b.at(0, -0.02, 0.37, h => h.box(0.06, 0.006, 0.006, 0x806060));
    return b;
  }

  function buildSandwich(b) {
    const slab = (y, col, w, d, h) => b.at(0, y, 0, q => { q.box(w, h, d, col, { uvScale: 0.4 }); q.at(0, h / 2, 0, r => r.ellipsoid(w / 2, h * 0.7, d / 2, 18, 6, col)); });
    slab(0.4, 0xffffff, 6, 4, 0.8);
    b.at(0, 1.0, 0, h => { for (let i = 0; i < 14; i++) h.at(-2.8 + i * 0.43, 0, ((i % 3) - 1) * 0.6, q => q.ellipsoid(0.6, 0.18, 2.3, 10, 4, 0x7cc84c)); });
    b.at(0, 1.12, 0, h => { [-2, -0.6, 0.8, 2.1].forEach(x => h.at(x, 0, 0.3, q => q.ellipsoid(0.7, 0.12, 0.7, 14, 4, 0xe24a3a))); });
    b.at(0, 1.22, 0, h => h.box(5.6, 0.1, 3.6, 0xf4c840));
    slab(1.65, 0xffffff, 6.1, 4.1, 0.75);
    return b;
  }

  function buildShellHouse(b) {
    b.push(M4.rotY(PI / 2));
    buildDisc(b, 1.0, 0.7, 0x6aa8de);
    b.pop();
    b.at(0.0, -0.75, 0.6, h => h.ellipsoid(0.5, 0.25, 1.3, 14, 8, 0x8ec4ec));
    return b;
  }

  function buildTree(b, col, h, r, lean) {
    b.push(M4.rotZ(lean || 0));
    b.prism(8, 0.06, 0.06, 0, 0.04, 0.04, h * 0.55, 0x8a6a8a, {});
    b.at(0, h * 0.7, 0, q => q.ellipsoid(r, h * 0.38, r, 16, 10, col));
    b.pop();
    return b;
  }

  function buildLolliTree(b, col, h) {
    b.prism(8, 0.05, 0.05, 0, 0.05, 0.05, h, 0xfffaf2, {});
    b.at(0, h, 0, q => q.ellipsoid(0.55, 0.55, 0.55, 16, 10, col));
    return b;
  }

  function buildCottage(b) {
    b.box(3.2, 2.4, 2.6, 0xffffff, { base: true, uvScale: 0.4 });
    b.push(M4.translate(0, 2.4, 0));
    b.quad([-1.8, 0, 1.5], [1.8, 0, 1.5], [1.8, 1.4, 0], [-1.8, 1.4, 0], 0x5c8ed8, null, [[0, 0.7, 0.7], [0, 0.7, 0.7], [0, 0.7, 0.7], [0, 0.7, 0.7]]);
    b.quad([1.8, 0, -1.5], [-1.8, 0, -1.5], [-1.8, 1.4, 0], [1.8, 1.4, 0], 0x5c8ed8, null, [[0, 0.7, -0.7], [0, 0.7, -0.7], [0, 0.7, -0.7], [0, 0.7, -0.7]]);
    b.tri([-1.6, 0, 1.3], [-1.6, 1.3, 0], [-1.6, 0, -1.3], 0xf6e4c4);
    b.tri([1.6, 0, -1.3], [1.6, 1.3, 0], [1.6, 0, 1.3], 0xf6e4c4);
    b.pop();
    b.at(0.4, 0.8, 1.31, h => h.box(0.7, 1.6, 0.05, 0x4a3a52));
    b.at(-0.9, 1.4, 1.31, h => h.box(0.6, 0.6, 0.04, 0x8ab8e8));
    b.at(1.3, 3.0, -0.4, h => h.box(0.36, 1.0, 0.36, 0xd88a6a));
    return b;
  }

  function buildGumball(b, col, stripe) {
    b.ellipsoid(1, 1, 1, 22, 14, col, { colorAt: p => (Math.abs(p[1] - p[0] * 0.3) < 0.18 ? stripe : col) });
    return b;
  }

  function buildBalloon(b, col) {
    b.ellipsoid(0.16, 0.2, 0.16, 14, 10, col);
    b.at(0, -0.21, 0, h => h.prism(6, 0.02, 0.02, -0.03, 0.01, 0.01, 0.0, col, {}));
    K.tube(b, [[0, -0.23, 0], [0.02, -0.5, 0.01], [-0.01, -0.8, 0]], [0.002, 0.002, 0.002], 3, 0xffffff);
    return b;
  }

  function buildPost(b) {
    b.box(0.12, 0.9, 0.12, 0x9a6a44, { base: true });
    b.at(0, 0.9, 0, h => h.ellipsoid(0.07, 0.05, 0.07, 8, 4, 0x9a6a44));
    return b;
  }

  function buildDebris(b) {
    const g = rand(17);
    for (let i = 0; i < 14; i++) {
      b.push(M4.translate((g() - 0.5) * 3, 0.03, (g() - 0.5) * 3), M4.rotY(g() * PI), M4.rotZ((g() - 0.5) * 0.3));
      b.box(0.08 + g() * 0.6, 0.04 + g() * 0.06, 0.1 + g() * 0.2, g() < 0.5 ? 0x3a2a1e : 0x2a2420);
      b.pop();
    }
    return b;
  }

  function buildGlasses(b) {
    [-1, 1].forEach(s => b.at(s * 0.034, 0, 0, h => { torus(h, 0.024, 0.0028, 18, 4, 0x2a2622); h.ellipsoid(0.022, 0.022, 0.002, 12, 4, 0x7a8a90); }));
    b.at(0, 0.004, 0, h => h.box(0.02, 0.003, 0.003, 0x2a2622));
    [-1, 1].forEach(s => b.at(s * 0.06, 0, -0.05, h => { h.push(M4.rotY(s * 0.25)); h.box(0.003, 0.003, 0.1, 0x2a2622); h.pop(); }));
    return b;
  }

  function buildGarland(b) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const k = i / 24;
      pts.push([lerp(-6, 6, k), -S(k * PI * 3) * 0.25 - Math.pow(S(k * PI), 2) * 0.6, 0]);
    }
    K.tube(b, pts, pts.map(() => 0.012), 4, 0xffffff);
    pts.forEach((p, i) => { if (i % 2) b.at(p[0], p[1] - 0.07, p[2], h => h.ellipsoid(0.06, 0.07, 0.06, 8, 6, 0xfffcf4)); });
    return b;
  }

  function hoseMesh(fx) {
    const N = 16, SIDES = 8;
    const m = fx.dyn();
    const idx = [];
    for (let j = 0; j < N - 1; j++) {
      for (let i = 0; i < SIDES; i++) {
        const a = j * (SIDES + 1) + i, b = a + 1, c = a + SIDES + 2, d = a + SIDES + 1;
        idx.push(a, b, c, a, c, d);
      }
    }
    const data = new Float32Array(N * (SIDES + 1) * 12);
    m.update(data, new Uint16Array(idx));
    return { m, data, N, SIDES };
  }

  function updateHose(H, a, b, sag, col, radius) {
    const { N, SIDES, data } = H;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1);
      const p = V3.lerp(a, b, k);
      p[1] -= S(k * PI) * sag;
      pts.push(p);
    }
    const c = rgb(col);
    let w = 0;
    for (let i = 0; i < N; i++) {
      const p = pts[i];
      const t = V3.norm(V3.sub(pts[Math.min(N - 1, i + 1)], pts[Math.max(0, i - 1)]));
      let side = V3.cross(t, [0, 1, 0]);
      if (V3.len(side) < 1e-3) side = [1, 0, 0];
      side = V3.norm(side);
      const up = V3.cross(side, t);
      for (let s = 0; s <= SIDES; s++) {
        const ang = (s / SIDES) * PI * 2;
        const n = V3.add(V3.mul(side, C(ang)), V3.mul(up, S(ang)));
        const q = V3.add(p, V3.mul(n, radius));
        const ring = (i % 3 === 0) ? 0.8 : 1;
        data.set([q[0], q[1], q[2], n[0], n[1], n[2], c[0] * ring, c[1] * ring, c[2] * ring, 0, 0, 0], w);
        w += 12;
      }
    }
    H.m.update(data);
  }

  function build(r, fx) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      flamer: mk(buildFlamer),
      rainblower: mk(buildRainblower),
      lolliStick: mk(buildLolliStick),
      disc: mk(b => buildDisc(b, 1, 0.22, 0xffffff)),
      axe: mk(buildAxe),
      flareGun: mk(buildFlareGun),
      giftBox: mk(b => buildGift(b, 1, 1, 1)),
      bowYellow: mk(b => buildBow(b, 0xf2c84a)),
      bowBlue: mk(b => buildBow(b, 0x5ea0dc)),
      balloonicorn: mk(buildBalloonicorn),
      hamster: mk(buildHamster),
      sandwich: mk(buildSandwich),
      shellHouse: mk(buildShellHouse),
      treePink: mk(b => buildTree(b, 0xf4a8c0, 3.2, 0.55, 0.05)),
      treeBlue: mk(b => buildTree(b, 0x8ea8e8, 3.6, 0.6, -0.06)),
      treePurple: mk(b => buildTree(b, 0xb898e0, 3.0, 0.5, 0.1)),
      treeOrange: mk(b => buildTree(b, 0xf4b070, 2.8, 0.52, -0.04)),
      treeYellow: mk(b => buildTree(b, 0xf0dc80, 3.4, 0.62, 0.02)),
      lolliTree: mk(b => buildLolliTree(b, 0xffffff, 1.6)),
      cottage: mk(buildCottage),
      gumball: mk(b => buildGumball(b, 0xf2eef4, 0xf4a8c8)),
      gumballB: mk(b => buildGumball(b, 0xe8f0fc, 0x9ab8f0)),
      balloon: mk(b => buildBalloon(b, 0xffffff)),
      post: mk(buildPost),
      debris: mk(buildDebris),
      glasses: mk(buildGlasses),
      garland: mk(buildGarland),
      hose: hoseMesh(fx),
      r
    };
  }

  function drawFlamer(fx, P, M, tint) {
    fx.draw(P.flamer, M, Object.assign({}, WEAPON_MAT, tint ? { tint } : {}));
  }

  function drawRainblower(fx, P, M) {
    fx.draw(P.rainblower, M, GOLD_MAT);
  }

  function drawLollipop(fx, P, M, T, key, radius, stick) {
    const R = radius || 0.17;
    if (stick !== false) fx.draw(P.lolliStick, M4.mul(M, M4.scale(R / 0.17, R / 0.17, R / 0.17)), CANDY_MAT);
    fx.draw(P.disc, M4.chain(M, M4.scale(R, R, R)), Object.assign({ texture: T(key || 'swirl') }, CANDY_MAT));
  }

  function drawGift(fx, P, M, T, key, w, h, d, bow) {
    fx.draw(P.giftBox, M4.mul(M, M4.scale(w, h, d)), Object.assign({ texture: T(key || 'giftBlue') }, SOFT_MAT));
    if (bow) fx.draw(bow === 'blue' ? P.bowBlue : P.bowYellow, M4.chain(M, M4.translate(0, h, 0), M4.scale(w * 1.4, w * 1.4, w * 1.4)), SOFT_MAT);
  }

  function drawHose(fx, P, a, b, sag, col) {
    updateHose(P.hose, a, b, sag === undefined ? 0.12 : sag, col || 0x2a2624, 0.016);
    fx.draw(P.hose.m, null, { spec: [0.3, 14], rim: 0.6 });
  }

  function point(M, p) {
    return M4.point(M, p);
  }

  window.MpyProps = { FLAMER, WEAPON_MAT, GOLD_MAT, CANDY_MAT, SOFT_MAT, build, drawFlamer, drawRainblower, drawLollipop, drawGift, drawHose, point, torus, cyl };
})();
