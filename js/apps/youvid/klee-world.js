(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C } = K;
  const T = window.KleeTextures;

  const COL = {
    trunk: 0x6a4428,
    leafGold: 0xf0c02c,
    leafGoldLow: 0xc98a1c,
    leafGreen: 0x62b838,
    leafGreenLow: 0x2f7a2c,
    rock: 0x74767e,
    rockLight: 0x9496a0,
    stone: 0x8696b0,
    stoneDark: 0x5e6a84,
    cap: 0xa4b2cc,
    plaster: 0xd6d4de,
    wood: 0x5a3626,
    woodLight: 0x7a4c34,
    woodDark: 0x3c2218,
    gold: 0xe6b450,
    leaf: 0x3c9448,
    pot: 0xe8e4dc,
    brass: 0xd8b060,
    castle: 0xc8c4bc,
    roof: 0x4a6ab0,
    banner: 0x2a4a9a
  };

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function ellAt(b, pos, rx, ry, rz, low, high, seg, rings) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    const lo = rgb(low), hi = rgb(high);
    b.ellipsoid(rx, ry, rz, seg || 8, rings || 6, lo, {
      colorAt: (p) => {
        const k = Math.max(0, Math.min(1, (p[1] / ry) * 0.5 + 0.5));
        return [lo[0] + (hi[0] - lo[0]) * k, lo[1] + (hi[1] - lo[1]) * k, lo[2] + (hi[2] - lo[2]) * k, 0];
      }
    });
    b.pop();
  }

  function texQuad(b, a, bq, c, d, uv, col, nrm) {
    const cc = col || [1, 1, 1, 0];
    const n = nrm || V3.norm(V3.cross(V3.sub(bq, a), V3.sub(d, a)));
    const uvs = uv || [[0, 0], [1, 0], [1, 1], [0, 1]];
    b.quad(a, bq, c, d, [cc, cc, cc, cc], uvs, [n, n, n, n]);
  }

  function skyDome(r) {
    return K.mesh(r, b => {
      const n = 32, rings = 10, R = 70, lat0 = -0.12, lat1 = PI / 2;
      const P = (a, lat) => [S(a) * C(lat) * R, S(lat) * R, -C(a) * C(lat) * R];
      for (let j = 0; j < rings; j++) {
        const la = lat0 + (lat1 - lat0) * (j / rings), lb = lat0 + (lat1 - lat0) * ((j + 1) / rings);
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
          const u0 = i / n, u1 = (i + 1) / n;
          texQuad(b, P(a0, la), P(a1, la), P(a1, lb), P(a0, lb), [[u0, j / rings], [u1, j / rings], [u1, (j + 1) / rings], [u0, (j + 1) / rings]], [1, 1, 1, 1], [0, 0, 1]);
        }
      }
    });
  }

  function scatterTufts(seed, n, area, height, base, tip) {
    return b => {
      const g = rand(seed);
      const bc = rgb(base), tc = rgb(tip);
      for (let i = 0; i < n; i++) {
        const x = area[0] + g() * (area[1] - area[0]);
        const z = area[2] + g() * (area[3] - area[2]);
        const blades = 3;
        for (let k = 0; k < blades; k++) {
          const a = g() * PI * 2;
          const h = height[0] + g() * (height[1] - height[0]);
          const lean = 0.12 + g() * 0.25;
          const w = 0.05 + g() * 0.03;
          const dx = S(a) * w, dz = C(a) * w;
          const tx = x + C(a) * lean * h, tz = z - S(a) * lean * h;
          const sh = 0.8 + g() * 0.4;
          const bcs = [bc[0] * sh, bc[1] * sh, bc[2] * sh, 0];
          b.tri([x - dx, 0, z - dz], [x + dx, 0, z + dz], [tx, h, tz], [bcs, bcs, [tc[0], tc[1], tc[2], 0]], null, [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
        }
      }
    };
  }

  function scatterTrees(seed, n, rMin, rMax, avoid) {
    const gold = [];
    const green = [];
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      const a = g() * PI * 2;
      const rad = rMin + g() * (rMax - rMin);
      const x = S(a) * rad, z = -C(a) * rad;
      if (avoid && avoid(x, z)) continue;
      const sc = 0.8 + g() * 0.9;
      (g() < 0.55 ? gold : green).push([x, z, sc, g() * PI * 2]);
    }
    const tree = (b, list, low, high) => {
      list.forEach(([x, z, sc]) => {
        b.push(M4.translate(x, 0, z), M4.scale(sc, sc, sc));
        K.tube(b, [[0, 0, 0], [0.05, 1.4, 0], [0, 2.6, 0.04]], [0.2, 0.15, 0.1], 6, COL.trunk);
        ellAt(b, [0, 3.0, 0], 1.5, 1.2, 1.5, low, high, 8, 6);
        ellAt(b, [0.6, 3.9, 0.2], 1.1, 0.95, 1.1, low, high, 8, 5);
        ellAt(b, [-0.6, 3.6, -0.3], 1.0, 0.9, 1.0, low, high, 8, 5);
        b.pop();
      });
    };
    return {
      gold: b => tree(b, gold, COL.leafGoldLow, COL.leafGold),
      green: b => tree(b, green, COL.leafGreenLow, COL.leafGreen)
    };
  }

  function rocks(seed, n, rMin, rMax) {
    return b => {
      const g = rand(seed);
      for (let i = 0; i < n; i++) {
        const a = g() * PI * 2;
        const rad = rMin + g() * (rMax - rMin);
        const sc = 0.5 + g() * 1.3;
        const col = g() < 0.5 ? COL.rock : COL.rockLight;
        b.push(M4.translate(S(a) * rad, 0, -C(a) * rad), M4.rotY(g() * PI));
        b.ellipsoid(sc * 1.4, sc * (0.7 + g() * 0.6), sc, 7, 5, col, { flat: true });
        b.pop();
      }
    };
  }

  function mountainsBand(r) {
    return K.mesh(r, b => {
      const n = 28, R = 48, H = 20;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        const P = (a, y) => [S(a) * R, y, -C(a) * R];
        texQuad(b, P(a0, H - 1), P(a1, H - 1), P(a1, -1), P(a0, -1), [[i / n * 3, 1], [(i + 1) / n * 3, 1], [(i + 1) / n * 3, 0], [i / n * 3, 0]], [1, 1, 1, 0.3], [0, 0, 1]);
      }
    });
  }

  function pathStrip(r) {
    return K.mesh(r, b => {
      const n = 24;
      const X = (z) => 1.2 * S(z * 0.11);
      for (let i = 0; i < n; i++) {
        const z0 = 14 - i * 2.2, z1 = 14 - (i + 1) * 2.2;
        const w0 = 1.4 + 0.3 * S(z0 * 0.3), w1 = 1.4 + 0.3 * S(z1 * 0.3);
        texQuad(b, [X(z0) - w0, 0.015, z0], [X(z0) + w0, 0.015, z0], [X(z1) + w1, 0.015, z1], [X(z1) - w1, 0.015, z1], [[0, i * 0.5], [1, i * 0.5], [1, i * 0.5 + 0.5], [0, i * 0.5 + 0.5]], [1, 1, 1, 0], [0, 1, 0]);
      }
    });
  }

  function flatGrid(b, x0, x1, z0, z1, y, nx, nz, repX, repZ, col) {
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const xa = lerpN(x0, x1, i / nx), xb = lerpN(x0, x1, (i + 1) / nx);
        const za = lerpN(z0, z1, j / nz), zb = lerpN(z0, z1, (j + 1) / nz);
        texQuad(b, [xa, y, za], [xb, y, za], [xb, y, zb], [xa, y, zb], [[i / nx * repX, j / nz * repZ], [(i + 1) / nx * repX, j / nz * repZ], [(i + 1) / nx * repX, (j + 1) / nz * repZ], [i / nx * repX, (j + 1) / nz * repZ]], col, [0, 1, 0]);
      }
    }
  }

  function lerpN(a, b, k) {
    return a + (b - a) * k;
  }

  function groundQuad(r, size, rep, y) {
    return K.mesh(r, b => flatGrid(b, -size, size, -size, size, y || 0, 24, 24, rep, rep, [1, 1, 1, 0]));
  }

  function waterQuad(r) {
    return K.mesh(r, b => flatGrid(b, -70, 70, -70, -9, 0.015, 14, 8, 30, 8, [1, 1, 1, 0.12]));
  }

  function riverStrip(r) {
    return K.mesh(r, b => flatGrid(b, -70, 70, -26, -17, -0.08, 14, 2, 30, 2, [1, 1, 1, 0.12]));
  }

  function castle(r) {
    return K.mesh(r, b => {
      b.push(M4.translate(12, 0, -52));
      boxAt(b, [0, 4, 0], [16, 8, 5], COL.castle);
      [-8, -3, 3, 8].forEach((x, i) => {
        boxAt(b, [x, 8 + (i % 2) * 2, 0], [3, 8 + (i % 2) * 4, 3], COL.castle);
        b.push(M4.translate(x, 12 + (i % 2) * 4, 0));
        b.prism(8, 2.1, 2.1, 0, 0.1, 0.1, 4, COL.roof);
        b.pop();
      });
      b.pop();
      b.push(M4.translate(-14, 0, -30));
      boxAt(b, [0, 1.6, 0], [30, 0.7, 2.4], COL.castle);
      [-10, -4, 2, 8].forEach(x => boxAt(b, [x, 0.7, 0], [3.6, 1.4, 2.5], 0x4a6a8a));
      b.pop();
    });
  }

  function plazaProps(r) {
    return K.mesh(r, b => {
      boxAt(b, [1.5, 1.4, -2.6], [0.7, 2.8, 0.7], COL.stone);
      boxAt(b, [1.5, 0.15, -2.6], [0.95, 0.3, 0.95], COL.stoneDark);
      boxAt(b, [1.5, 2.85, -2.6], [0.9, 0.16, 0.9], COL.cap);
      for (let i = 0; i < 3; i++) boxAt(b, [-2.2 + i * 0.6, 0.12 + i * 0.1, -3.4 - i * 0.7], [3, 0.25 + i * 0.2, 1.4], COL.stone);
      boxAt(b, [0, 0.45, -9], [60, 0.9, 0.8], COL.stone);
      boxAt(b, [0, 0.95, -9], [60, 0.14, 1.0], COL.cap);
      for (let i = -14; i <= 14; i += 3) boxAt(b, [i, 0.55, -8.9], [0.5, 1.1, 0.9], COL.stoneDark);
      K.tube(b, [[-3, 0, -8.4], [-3, 5.0, -8.4]], [0.08, 0.06], 6, 0x3a3a46);
      boxAt(b, [-3, 3.6, -8.4], [0.9, 1.6, 0.04], COL.banner);
      b.push(M4.translate(7, 0, -12));
      boxAt(b, [0, 1.8, 0], [5, 3.6, 4], COL.stoneDark);
      boxAt(b, [0, 4.0, 0], [5.4, 0.5, 4.4], COL.roof);
      b.pop();
    });
  }

  function archMesh(r) {
    return K.mesh(r, b => {
      b.push(M4.translate(-2.0, 0, -9));
      [-1.4, 1.4].forEach(x => {
        boxAt(b, [x, 1.9, 0], [0.8, 3.8, 0.8], COL.stone);
        boxAt(b, [x, 0.2, 0], [1.0, 0.4, 1.0], COL.stoneDark);
      });
      for (let i = 0; i < 9; i++) {
        const a = PI * (i / 8);
        boxAt(b, [-C(a) * 1.4, 3.8 + S(a) * 1.0, 0], [0.8, 0.7, 0.8], i % 2 ? COL.stone : COL.cap, M4.rotZ(a - PI / 2));
      }
      boxAt(b, [3.4, 0.7, 0.3], [2.2, 1.4, 0.8], COL.stoneDark);
      boxAt(b, [-3.2, 0.5, 0.2], [1.6, 1.0, 0.8], COL.stone);
      b.pop();
    });
  }

  function columnMesh(r) {
    return K.mesh(r, b => {
      [[3.2, -3.6, 3.4], [-4.6, -9, 2.4]].forEach(([x, z, h]) => {
        boxAt(b, [x, h / 2, z], [0.6, h, 0.6], COL.stone);
        boxAt(b, [x, 0.2, z], [0.9, 0.4, 0.9], COL.stoneDark);
        boxAt(b, [x, h + 0.1, z], [0.85, 0.2, 0.85], COL.cap);
      });
    });
  }

  function latticeWall(r) {
    return K.mesh(r, b => {
      texQuad(b, [-4, 0, -3.3], [4.4, 0, -3.3], [4.4, 3.4, -3.3], [-4, 3.4, -3.3], [[0, 0], [6.6, 0], [6.6, 3], [0, 3]], [1, 1, 1, 0.1], [0, 0, 1]);
      boxAt(b, [-4.1, 1.7, -3.3], [0.3, 3.4, 0.4], COL.stoneDark);
      boxAt(b, [4.5, 1.7, -3.3], [0.3, 3.4, 0.4], COL.stoneDark);
      boxAt(b, [0.2, 3.45, -3.3], [8.8, 0.18, 0.4], COL.stone);
    });
  }

  function hall(r) {
    const walls = K.mesh(r, b => {
      boxAt(b, [0, 1.6, -4.1], [14, 3.2, 0.2], COL.plaster);
      boxAt(b, [-7.1, 1.6, 0], [0.2, 3.2, 10], COL.plaster);
      boxAt(b, [7.1, 1.6, 0], [0.2, 3.2, 10], COL.plaster);
      boxAt(b, [0, 3.25, 0], [14.2, 0.1, 10], 0xbab6c4);
      boxAt(b, [0, 0.55, -3.98], [14, 1.1, 0.12], COL.wood);
      boxAt(b, [0, 1.12, -3.95], [14, 0.08, 0.16], COL.woodLight);
      boxAt(b, [0, 0.05, -3.97], [14, 0.1, 0.14], COL.woodDark);
      for (let i = -6; i <= 6; i++) boxAt(b, [i * 1.1, 0.55, -3.9], [0.7, 0.8, 0.02], COL.woodLight);
      boxAt(b, [-1.0, 1.6, -3.95], [0.2, 3.2, 0.18], 0xe8e4ee);
      boxAt(b, [1.0, 1.6, -3.95], [0.2, 3.2, 0.18], 0xe8e4ee);
    });
    const door = K.mesh(r, b => {
      boxAt(b, [0, 1.2, -3.9], [1.5, 2.4, 0.1], COL.woodDark);
      boxAt(b, [0, 1.2, -3.84], [1.2, 2.1, 0.06], COL.wood);
      [[0, 0.55], [0, 1.0], [0, 1.65]].forEach(([x, y], i) => {
        const h = i === 1 ? 0.18 : 0.62;
        boxAt(b, [-0.28, y + 0.1, -3.8], [0.38, h * 1.2, 0.04], COL.woodLight);
        boxAt(b, [0.28, y + 0.1, -3.8], [0.38, h * 1.2, 0.04], COL.woodLight);
      });
      boxAt(b, [0, 2.45, -3.88], [1.7, 0.16, 0.18], COL.woodLight);
      boxAt(b, [0.5, 1.15, -3.78], [0.05, 0.22, 0.05], COL.brass);
      K.tube(b, [[0.5, 1.15, -3.78], [0.5, 1.15, -3.62]], [0.02, 0.02], 6, COL.brass);
      K.tube(b, [[0.5, 1.15, -3.62], [0.4, 1.15, -3.6]], [0.02, 0.02], 6, COL.brass);
    });
    const decor = K.mesh(r, b => {
      [-1, 1].forEach(s => {
        boxAt(b, [s * 1.9, 0.45, -3.6], [0.55, 0.9, 0.55], 0x4a3226);
        boxAt(b, [s * 1.9, 0.95, -3.6], [0.7, 0.1, 0.7], COL.woodLight);
        K.tube(b, [[s * 1.9, 1.0, -3.6], [s * 1.9, 1.25, -3.6]], [0.17, 0.2], 10, COL.pot);
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * PI * 2;
          b.push(M4.translate(s * 1.9, 1.25, -3.6), M4.rotY(a), M4.rotZ(0.9));
          b.ellipsoid(0.04, 0.3, 0.1, 5, 4, i % 2 ? COL.leaf : 0x2a7a3a);
          b.pop();
        }

        boxAt(b, [s * 1.4, 1.9, -3.9], [0.1, 0.4, 0.1], COL.brass);
        b.push(M4.translate(s * 1.4, 2.15, -3.85));
        b.ellipsoid(0.1, 0.16, 0.08, 8, 6, [1, 0.88, 0.6, 1]);
        b.pop();
      });
      boxAt(b, [-3.4, 1.9, -3.93], [1.3, 0.9, 0.08], COL.gold);
      boxAt(b, [3.2, 2.0, -3.93], [0.8, 1.0, 0.06], COL.brass);
      boxAt(b, [3.2, 2.0, -3.89], [0.62, 0.8, 0.04], 0x8a6a30);
      boxAt(b, [3.2, 2.0, -3.84], [0.1, 1.5, 0.03], 0xd8dce8, M4.rotZ(0.7));
      boxAt(b, [3.2, 2.0, -3.84], [0.1, 1.5, 0.03], 0xd8dce8, M4.rotZ(-0.7));
    });
    const painting = K.mesh(r, b => {
      texQuad(b, [-3.95, 1.5, -3.88], [-2.85, 1.5, -3.88], [-2.85, 2.3, -3.88], [-3.95, 2.3, -3.88], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 1, 1, 0.3], [0, 0, 1]);
    });
    const floor = K.mesh(r, b => {
      texQuad(b, [-7, 0, -4], [7, 0, -4], [7, 0, 6], [-7, 0, 6], [[0, 0], [10, 0], [10, 7], [0, 7]], [1, 1, 1, 0.1], [0, 1, 0]);
    });
    return { walls, door, decor, painting, floor };
  }

  function build(r) {
    const trees = scatterTrees(3, 42, 10, 34, (x, z) => Math.abs(x) < 3.2 && z > -8 && z < 6);
    const treesFar = scatterTrees(9, 40, 30, 60);
    const shore = (x, z) => z < -8;
    const treesShore = scatterTrees(3, 42, 10, 34, (x, z) => (Math.abs(x) < 3.2 && z > -8 && z < 6) || shore(x, z));
    const treesShoreFar = scatterTrees(9, 40, 30, 60, shore);
    return {
      tex: {
        skyDay: r.texture(1024, T.skyTex('day', 301), { height: 512 }),
        skySunset: r.texture(1024, T.skyTex('sunset', 311), { height: 512 }),
        skyNight: r.texture(1024, T.skyTex('night', 321), { height: 512 }),
        skyPurple: r.texture(1024, T.skyTex('purple', 331), { height: 512 }),
        grass: r.texture(512, T.grassTex('green')),
        grassDry: r.texture(512, T.grassTex('dry')),
        dirt: r.texture(256, T.dirtTex),
        plaza: r.texture(512, T.plazaTex),
        hex: r.texture(512, T.hexTex),
        checker: r.texture(256, T.checkerTex),
        water: r.texture(256, T.waterTex),
        mountains: r.texture(1024, T.mountainsTex, { height: 256 }),
        lattice: r.texture(256, T.latticeTex),
        painting: r.texture(128, T.paintingTex, { clamp: true })
      },
      sky: skyDome(r),
      ground: groundQuad(r, 90, 70),
      plazaGround: groundQuad(r, 90, 40),
      path: pathStrip(r),
      tuftsGreen: K.mesh(r, scatterTufts(21, 700, [-16, 16, -18, 12], [0.16, 0.38], 0x2a6a1a, 0x8ccc44)),
      tuftsDry: K.mesh(r, scatterTufts(22, 620, [-16, 16, -18, 12], [0.4, 0.8], 0x5a5a24, 0xa8b04a)),
      treeGold: K.mesh(r, trees.gold),
      treeGreen: K.mesh(r, trees.green),
      treeGoldFar: K.mesh(r, treesFar.gold),
      treeGreenFar: K.mesh(r, treesFar.green),
      treeGoldShore: K.mesh(r, treesShore.gold),
      treeGreenShore: K.mesh(r, treesShore.green),
      treeGoldShoreFar: K.mesh(r, treesShoreFar.gold),
      treeGreenShoreFar: K.mesh(r, treesShoreFar.green),
      rocks: K.mesh(r, rocks(5, 14, 12, 40)),
      mountains: mountainsBand(r),
      water: waterQuad(r),
      river: riverStrip(r),
      castle: castle(r),
      plazaProps: plazaProps(r),
      lattice: latticeWall(r),
      arch: archMesh(r),
      column: columnMesh(r),
      hall: hall(r)
    };
  }

  const SKY_KEY = { day: 'skyDay', sunset: 'skySunset', night: 'skyNight', purple: 'skyPurple' };

  function sky(r, W, tod, spin) {
    r.draw(W.sky, M4.rotY(spin || 0), { texture: W.tex[SKY_KEY[tod]], noFog: true });
  }

  function drawField(r, W, st) {
    const dry = st.dry;
    sky(r, W, st.tod, st.skySpin);
    r.draw(W.mountains, M4.rotY(st.hillSpin || 0), { texture: W.tex.mountains });
    r.draw(W.ground, M4.ident(), { texture: dry ? W.tex.grassDry : W.tex.grass });
    if (st.path !== false) r.draw(W.path, M4.ident(), { texture: W.tex.dirt });
    r.draw(W.tuftsGreen, M4.ident());
    if (dry) r.draw(W.tuftsDry, M4.ident());
    const trees = st.lake ? ['treeGoldShore', 'treeGreenShore', 'treeGoldShoreFar', 'treeGreenShoreFar'] : ['treeGold', 'treeGreen', 'treeGoldFar', 'treeGreenFar'];
    trees.forEach(key => r.draw(W[key], M4.ident()));
    r.draw(W.rocks, M4.ident());
    if (st.arch) r.draw(W.arch, M4.ident());
    if (st.column) r.draw(W.column, M4.ident());
    if (st.river) r.draw(W.river, M4.ident(), { texture: W.tex.water, uvScroll: [st.t * 0.01, 0] });
    if (st.lake) {
      r.draw(W.water, M4.ident(), { texture: W.tex.water, uvScroll: [st.t * 0.015, 0] });
      r.draw(W.castle, M4.ident());
    }
  }

  function drawPlaza(r, W, st) {
    sky(r, W, st.tod, st.skySpin);
    r.draw(W.mountains, M4.ident(), { texture: W.tex.mountains });
    r.draw(W.plazaGround, M4.ident(), { texture: st.hex ? W.tex.hex : W.tex.plaza });
    r.draw(W.plazaProps, M4.ident());
    if (st.column) r.draw(W.column, M4.ident());
    if (st.lattice) r.draw(W.lattice, M4.ident(), { texture: W.tex.lattice });
    r.draw(W.treeGreenFar, M4.ident());
    r.draw(W.treeGoldFar, M4.ident());
  }

  function drawHall(r, W) {
    const h = W.hall;
    r.draw(h.floor, M4.ident(), { texture: W.tex.checker, noFog: true });
    r.draw(h.walls, M4.ident(), { noFog: true });
    r.draw(h.door, M4.ident(), { noFog: true });
    r.draw(h.decor, M4.ident(), { noFog: true });
    r.draw(h.painting, M4.ident(), { texture: W.tex.painting, noFog: true });
  }

  function draw(r, W, st) {
    if (st.set === 'hall') drawHall(r, W);
    else if (st.set === 'plaza') drawPlaza(r, W, st);
    else drawField(r, W, st);
  }

  window.KleeWorld = { build, draw, COL };
})();
