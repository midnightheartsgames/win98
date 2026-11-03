(function () {
  const { M4, V3, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, mesh, tube } = K;
  const A = window.OzonArt;

  const LIT = [1, 1, 1, 0];
  const GLOW = [1, 1, 1, 1];
  const TILE = 0.62;

  function plane(b, o, u, v, col, rep) {
    const r = rep || [1, 1];
    const p1 = V3.add(o, u), p3 = V3.add(o, v), p2 = V3.add(p1, v);
    b.quad(o, p1, p2, p3, col, [[0, 0], [r[0], 0], [r[0], r[1]], [0, r[1]]]);
  }

  function cube(b, x, y, z, sx, sy, sz, col, ry, faces) {
    b.push(M4.translate(x, y, z), M4.rotY(ry || 0));
    b.box(sx, sy, sz, col, { base: true, faces });
    b.pop();
  }

  function cyl(b, x, y, z, r0, r1, h, sides, col, opts) {
    b.push(M4.translate(x, y, z));
    b.prism(sides, r0, r0, 0, r1, r1, h, col, Object.assign({ capBottom: true }, opts || {}));
    b.pop();
  }

  function ball(b, x, y, z, rx, ry, rz, col, seg) {
    b.at(x, y, z, h => h.ellipsoid(rx, ry, rz, seg || 8, Math.max(4, (seg || 8) >> 1), col));
  }

  function part(r, fn, texture, opts) {
    return { mesh: mesh(r, fn), texture, opts: opts || {} };
  }

  function drawParts(r, list, model) {
    list.forEach(p => r.draw(p.mesh, model || null, p.texture ? Object.assign({ texture: p.texture }, p.opts) : p.opts));
  }

  function room(b, x0, x1, z0, z1, h, holes) {
    plane(b, [x0, 0, z1], [x1 - x0, 0, 0], [0, 0, z0 - z1], LIT, [(x1 - x0) / 1.2, (z1 - z0) / 1.2]);
    const wall = (o, u, len, cutX) => {
      const segs = cutX ? cutX : [[0, len, 0, h]];
      const dir = V3.norm(u);
      segs.forEach(([a, bb, y0, y1]) => {
        const o2 = V3.add(V3.add(o, V3.mul(dir, a)), [0, y0, 0]);
        const p1 = V3.add(o2, V3.mul(dir, bb - a)), p3 = V3.add(o2, [0, y1 - y0, 0]), p2 = V3.add(p1, [0, y1 - y0, 0]);
        b.quad(o2, p1, p2, p3, LIT, [[a / TILE, y0 / TILE], [bb / TILE, y0 / TILE], [bb / TILE, y1 / TILE], [a / TILE, y1 / TILE]]);
      });
    };
    const back = holes && holes.back ? holes.back : null;
    wall([x0, 0, z0], [1, 0, 0], x1 - x0, back);
    wall([x0, 0, z1], [0, 0, -1], z1 - z0, holes && holes.left);
    wall([x1, 0, z0], [0, 0, 1], z1 - z0, holes && holes.right);
    wall([x1, 0, z1], [-1, 0, 0], x1 - x0, holes && holes.front);
  }

  function windowCut(x0, x1, wx0, wx1, sill, top, h) {
    return [[0, wx0 - x0, 0, h], [wx1 - x0, x1 - x0, 0, h], [wx0 - x0, wx1 - x0, 0, sill], [wx0 - x0, wx1 - x0, top, h]];
  }

  function frameBox(b, x, y, z, w, h, d, col, depthAxis) {
    const t = 0.05;
    if (depthAxis === 'x') {
      cube(b, x, y - t, z, d, t, w + t * 2, col);
      cube(b, x, y + h, z, d, t, w + t * 2, col);
      cube(b, x, y, z - w / 2 - t / 2, d, h, t, col);
      cube(b, x, y, z + w / 2 + t / 2, d, h, t, col);
    } else {
      cube(b, x, y - t, z, w + t * 2, t, d, col);
      cube(b, x, y + h, z, w + t * 2, t, d, col);
      cube(b, x - w / 2 - t / 2, y, z, t, h, d, col);
      cube(b, x + w / 2 + t / 2, y, z, t, h, d, col);
    }
  }

  function radiator(b, x, y, z, w, ry) {
    b.push(M4.translate(x, y, z), M4.rotY(ry || 0));
    for (let i = 0; i < Math.round(w / 0.07); i++) b.at(-w / 2 + 0.035 + i * 0.07, 0, 0, h => h.box(0.05, 0.5, 0.08, 0xe8e6e0, { base: true }));
    b.pop();
  }

  function plant(b, x, y, z, s, potCol, leafCol, seed, big) {
    const g = rand(seed);
    cyl(b, x, y, z, 0.11 * s, 0.14 * s, 0.17 * s, 10, potCol);
    const n = big ? 7 : 11;
    for (let i = 0; i < n; i++) {
      const a = g() * PI * 2, lift = 0.25 + g() * 0.45, len = (big ? 0.3 : 0.24) * s * (0.8 + g() * 0.4);
      const base = [x, y + 0.17 * s, z];
      const tip = [x + C(a) * len, y + 0.17 * s + lift * s * 0.8, z + S(a) * len];
      tube(b, [base, V3.lerp(base, tip, 0.6), tip], [0.008 * s, 0.006 * s, 0.004 * s], 4, 0x4a6a2a);
      b.push(M4.translate(tip[0], tip[1], tip[2]), M4.rotY(-a + PI / 2), M4.rotX(-0.5 - g() * 0.6));
      b.ellipsoid((big ? 0.11 : 0.05) * s, 0.012 * s, (big ? 0.15 : 0.09) * s, 8, 3, shade(leafCol, 0.85 + g() * 0.3));
      b.pop();
    }
  }

  function tvPanel(b, w, h, bezel, depth) {
    b.box(w, h, depth, bezel);
    b.at(0, 0, depth / 2 + 0.001, hh => hh.box(w - 0.025, h - 0.025, 0.002, 0x0c0c10));
  }

  function tvScreen(b, w, h, depth, bezel) {
    const e = bezel === undefined ? 0.014 : bezel;
    plane(b, [-w / 2 + e, -h / 2 + e, depth / 2 + 0.003], [w - e * 2, 0, 0], [0, h - e * 2, 0], GLOW);
  }

  function chairOffice(b, col) {
    const fab = col, dark = 0x1c1c20;
    cube(b, 0, 0.42, 0, 0.5, 0.09, 0.48, fab);
    b.push(M4.translate(0, 0.5, -0.24), M4.rotX(-0.12));
    b.box(0.48, 0.62, 0.09, fab, { base: true });
    b.at(0, 0.62, 0, h => h.ellipsoid(0.24, 0.06, 0.055, 10, 4, fab));
    b.pop();
    [-1, 1].forEach(s => {
      cube(b, s * 0.28, 0.5, 0.02, 0.05, 0.18, 0.05, dark);
      cube(b, s * 0.28, 0.68, 0.02, 0.07, 0.03, 0.3, dark);
    });
    cyl(b, 0, 0.12, 0, 0.025, 0.025, 0.3, 6, 0x6a6e74);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      tube(b, [[0, 0.12, 0], [S(a) * 0.3, 0.06, C(a) * 0.3]], [0.025, 0.02], 4, dark);
      ball(b, S(a) * 0.3, 0.03, C(a) * 0.3, 0.03, 0.03, 0.03, dark, 6);
    }
  }

  function chairRacing(b, main, trim) {
    cube(b, 0, 0.4, 0, 0.52, 0.1, 0.5, main);
    [-1, 1].forEach(s => cube(b, s * 0.24, 0.48, 0, 0.06, 0.08, 0.48, trim));
    b.push(M4.translate(0, 0.48, -0.22), M4.rotX(-0.15));
    b.box(0.5, 0.82, 0.1, main, { base: true });
    [-1, 1].forEach(s => b.at(s * 0.22, 0, 0.03, h => h.box(0.08, 0.8, 0.08, trim, { base: true })));
    b.at(0, 0.62, 0.06, h => h.box(0.22, 0.12, 0.04, trim, { base: true }));
    b.pop();
    [-1, 1].forEach(s => cube(b, s * 0.3, 0.6, 0.02, 0.06, 0.03, 0.3, 0x1a1a1c));
    cyl(b, 0, 0.12, 0, 0.03, 0.03, 0.28, 6, 0x2a2a2e);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      tube(b, [[0, 0.12, 0], [S(a) * 0.32, 0.05, C(a) * 0.32]], [0.03, 0.022], 4, 0x18181a);
    }
  }

  function massageChair(b) {
    const g = 0x6e7470, d = 0x4e5452;
    cube(b, 0, 0, 0, 0.82, 0.42, 0.9, d);
    cube(b, 0, 0.42, 0.05, 0.72, 0.14, 0.78, g);
    [-1, 1].forEach(s => {
      cube(b, s * 0.38, 0.2, 0.05, 0.18, 0.5, 0.86, g);
      ball(b, s * 0.38, 0.72, 0.05, 0.11, 0.06, 0.42, shade(g, 1.05), 10);
    });
    b.push(M4.translate(0, 0.5, -0.36), M4.rotX(-0.2));
    [-1, 1].forEach(s => b.at(s * 0.21, 0.34, -0.04, h => h.ellipsoid(0.17, 0.4, 0.15, 12, 8, shade(g, 0.96))));
    b.at(0, 0.3, -0.07, h => h.ellipsoid(0.26, 0.36, 0.1, 12, 8, d));
    for (let i = 0; i < 4; i++) b.at(0, 0.1 + i * 0.15, 0.05, h => h.ellipsoid(0.3, 0.085, 0.11, 12, 6, i % 2 ? g : shade(g, 1.08)));
    b.at(0, 0.74, -0.02, h => h.ellipsoid(0.3, 0.11, 0.16, 12, 6, shade(g, 1.12)));
    b.pop();
  }

  function bed(b, x0, x1, z0, z1, top, head, sheet) {
    cube(b, (x0 + x1) / 2, 0.08, (z0 + z1) / 2, x1 - x0, top - 0.1, z1 - z0, 0xe6dccb);
    cube(b, (x0 + x1) / 2, 0.08, z0 + 0.03, x1 - x0 + 0.04, 0.72, 0.06, head);
    cube(b, (x0 + x1) / 2, 0.08, z1 - 0.02, x1 - x0 + 0.04, 0.42, 0.05, head);
    cube(b, (x0 + x1) / 2, 0.08, (z0 + z1) / 2, x1 - x0 + 0.02, 0.06, z1 - z0, 0x3a2a1e);
  }

  function sheetTop(b, x0, x1, z0, z1, top, seed) {
    const g = rand(seed);
    const nx = 8, nz = 14;
    const hgt = [];
    for (let j = 0; j <= nz; j++) {
      hgt.push([]);
      for (let i = 0; i <= nx; i++) {
        const edge = i === 0 || i === nx || j === nz;
        hgt[j].push(edge ? -0.04 : 0.02 + g() * 0.07 + 0.04 * S(i * 1.3 + j * 0.7));
      }
    }
    const P = (i, j) => [x0 + (x1 - x0) * (i / nx), top + hgt[j][i], z0 + (z1 - z0) * (j / nz)];
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        b.quad(P(i, j + 1), P(i + 1, j + 1), P(i + 1, j), P(i, j), LIT, [[i / nx * 2, (j + 1) / nz * 3], [(i + 1) / nx * 2, (j + 1) / nz * 3], [(i + 1) / nx * 2, j / nz * 3], [i / nx * 2, j / nz * 3]]);
      }
    }
  }

  function textures(r) {
    const t = (size, fn, opts) => r.texture(size, fn, opts || {});
    return {
      lilac: t(256, A.lilacPaper),
      beige: t(256, A.beigePaper),
      camPaper: t(256, A.camPaper),
      parquet: t(256, A.parquet),
      laminate: t(256, A.laminate),
      lace: t(256, A.lace, { height: 512 }),
      laceSoft: t(256, A.laceSoft, { height: 512 }),
      tulle: t(256, A.tulle),
      poppy: t(256, A.poppySheet),
      leaf: t(256, A.leafSheet),
      carpetBlue: t(256, A.carpetBlue),
      carpetBlack: t(256, A.carpetBlack),
      carpetRed: t(256, A.carpetRed),
      canyon: t(256, A.canyon, { height: 384, clamp: true }),
      banner: t(128, A.banner, { height: 512, clamp: true }),
      fan: t(256, A.fanArt, { height: 128, clamp: true }),
      lj: t(512, A.ljFront, { height: 320, clamp: true }),
      cardboard: t(128, A.cardboard),
      samsong: t(1024, A.samsongFace, { height: 512, clamp: true }),
      samsongEnd: t(128, A.samsongEnd, { height: 512, clamp: true }),
      off: t(256, A.screenOff, { height: 144, clamp: true }),
      game: t(256, A.screenGame, { height: 144, clamp: true }),
      blue: t(256, A.screenBlue, { height: 144, clamp: true }),
      stream: t(256, A.screenStream, { height: 144, clamp: true }),
      board: t(128, A.board, { height: 96, clamp: true }),
      smiley: t(128, A.smiley, { clamp: true }),
      needles: t(128, A.treeNeedles),
      game2: t(64, A.gameCase, { height: 80, clamp: true }),
      chrome: t(128, A.chrome, { height: 64, clamp: true }),
      toys: t(256, A.shelfToys, { height: 96, clamp: true })
    };
  }

  function buildOld(r, T) {
    const X0 = -2.6, X1 = 1.75, Z0 = -2.2, Z1 = 2.0, H = 2.6;
    const walls = part(r, b => room(b, X0, X1, Z0, Z1, H, { back: windowCut(X0, X1, -2.3, -0.25, 0.85, 2.35, H) }), T.beige);
    const floor = part(r, b => plane(b, [X0, 0.001, Z1], [X1 - X0, 0, 0], [0, 0, Z0 - Z1], LIT, [4, 4]), T.laminate);
    const glass = part(r, b => plane(b, [-2.3, 0.85, Z0 - 0.04], [2.05, 0, 0], [0, 1.5, 0], [0.86, 0.88, 0.9, 1]));
    const tulle = part(r, b => plane(b, [-2.45, 0.7, Z0 + 0.1], [2.3, 0, 0], [0, 1.8, 0], [1, 1, 1, 0.62], [3, 1]), T.tulle);
    const stuff = part(r, b => {
      frameBox(b, -1.275, 0.85, Z0 + 0.02, 2.05, 1.5, 0.08, 0xf0eee8);
      cube(b, -1.275, 0.82, Z0 + 0.12, 2.25, 0.04, 0.22, 0xece8e0);
      radiator(b, -1.3, 0.18, Z0 + 0.08, 1.2);
      cube(b, -1.2, 2.48, Z0 + 0.12, 2.8, 0.05, 0.05, 0x8a7a64);
      [-2.5, -0.15].forEach(x => cube(b, x, 0.1, Z0 + 0.14, 0.26, 2.38, 0.06, 0xb8a888));
      cube(b, 0.45, 0.64, -1.85, 2.3, 0.04, 0.7, 0x3a302a);
      [[-0.65, -2.15], [-0.65, -1.55], [1.55, -2.15], [1.55, -1.55]].forEach(([x, z]) => cube(b, x, 0, z, 0.05, 0.64, 0.05, 0x2a2420));
      cyl(b, -0.32, 0, -1.98, 0.12, 0.05, 0.03, 8, 0x1a1a1c);
      cyl(b, -0.32, 0.03, -1.98, 0.015, 0.015, 1.02, 6, 0x1a1a1c);
      cube(b, -0.32, 1.05, -1.98, 0.28, 0.02, 0.28, 0x1e1e20);
      plant(b, -0.32, 1.07, -1.98, 1.0, 0xc85a2a, 0x8aa83a, 5, false);
      b.push(M4.translate(0.42, 0.68, -1.72), M4.rotY(-1.0));
      cube(b, 0, 0, 0, 0.22, 0.02, 0.16, 0x1a1a1c);
      cube(b, 0, 0.02, 0, 0.04, 0.12, 0.03, 0x1a1a1c);
      b.at(0, 0.3, 0, h => h.box(0.56, 0.34, 0.04, 0x141416));
      b.pop();
      b.push(M4.translate(-0.42, 0.68, -1.55), M4.rotY(-0.4));
      cube(b, 0, 0, 0, 0.34, 0.02, 0.24, 0xd8d8dc);
      b.push(M4.translate(0, 0.01, -0.12), M4.rotX(-0.3));
      b.box(0.34, 0.24, 0.015, 0xd0d0d4, { base: true });
      b.pop();
      b.pop();
      cube(b, 1.0, 0.68, -1.75, 0.12, 0.02, 0.12, 0x1a1a1c);
      tube(b, [[1.0, 0.7, -1.75], [1.0, 1.15, -1.7], [0.82, 1.2, -0.8]], [0.01, 0.01, 0.01], 5, 0x1a1a1c);
      b.push(M4.translate(0.78, 1.12, -0.58), M4.rotY(-1.3));
      b.at(0, 0, 0.04, h => h.ellipsoid(0.11, 0.11, 0.01, 12, 4, 0x24282e));
      b.at(0, 0, -0.06, h => h.ellipsoid(0.035, 0.07, 0.035, 8, 4, 0x2a2a2e));
      b.pop();
      cube(b, 1.5, 0, -0.6, 0.45, 2.0, 1.2, 0x3a2418);
      [0.55, 1.1, 1.6].forEach(y => cube(b, 1.28, y, -0.6, 0.02, 0.03, 1.16, 0x5a3a28));
      cube(b, 1.42, 1.13, -0.35, 0.22, 0.4, 0.3, 0x141416);
      cube(b, 1.42, 0.58, -0.85, 0.2, 0.3, 0.25, 0x8a1a1a);
      cube(b, 1.42, 1.63, -0.95, 0.18, 0.25, 0.16, 0xc8b070);
      cube(b, 0.45, 1.45, Z0 + 0.03, 0.42, 0.62, 0.03, 0x2a2e36);
      cube(b, 0.45, 1.5, Z0 + 0.05, 0.3, 0.42, 0.02, 0xc8b070);
      b.push(M4.translate(-0.86, 0, -0.32), M4.rotY(1.62));
      chairRacing(b, 0xa8241c, 0x1c1c1e);
      b.pop();
    });
    const monitor = part(r, b => {
      b.push(M4.translate(0.42, 0.98, -1.72), M4.rotY(-1.0));
      tvScreen(b, 0.56, 0.34, 0.045);
      b.pop();
    }, T.stream);
    return { parts: [walls, floor, glass, tulle, stuff, monitor] };
  }

  function buildBox(r, T) {
    const floor = part(r, b => plane(b, [-2.5, 0, 2.0], [5, 0, 0], [0, 0, -4.5], LIT, [5, 8]), T.parquet);
    const walls = part(r, b => {
      plane(b, [-1.25, 0, 2.0], [0, 0, -4.5], [0, 2.6, 0], LIT, [7, 4]);
      plane(b, [-1.25, 0, -2.5], [3.7, 0, 0], [0, 2.6, 0], LIT, [6, 4]);
    }, T.lilac);
    const stuff = part(r, b => {
      radiator(b, 1.25, 0.12, -2.4, 1.1);
      cube(b, 1.25, 0.65, -2.38, 1.3, 0.03, 0.2, 0xeceae4);
      cube(b, -1.23, 0, 0.2, 0.03, 0.07, 4, 0xe8e4dc);
      cube(b, 0.6, 0, -2.48, 3.7, 0.07, 0.03, 0xe8e4dc);
      cube(b, 1.85, 0, -1.4, 0.3, 0.22, 0.2, 0x2a3a8a);
    });
    const box = part(r, b => {
      b.push(M4.translate(0, 0, -0.6), M4.rotY(0.04));
      cube(b, 0, 0, 0, 1.18, 0.78, 0.16, LIT, 0, { front: null });
      b.push(M4.translate(0, 0.78, 0));
      b.at(0, 0, 0, h => h.box(1.14, 0.004, 0.13, 0x2a2018));
      b.push(M4.translate(0, 0, 0.08), M4.rotX(-0.9));
      b.box(1.18, 0.002, 0.16, LIT, { base: true });
      b.pop();
      b.push(M4.translate(0, 0, -0.08), M4.rotX(0.75));
      b.box(1.18, 0.002, 0.16, LIT, { base: true });
      b.pop();
      b.at(0.4, 0.0, 0, h => h.box(0.3, 0.12, 0.12, 0xf4f4f6, { base: true }));
      b.at(0.3, 0.06, 0.02, h => h.ellipsoid(0.12, 0.08, 0.06, 8, 4, 0xfafafa));
      b.pop();
      b.pop();
    }, T.cardboard);
    const front = part(r, b => {
      b.push(M4.translate(0, 0, -0.6), M4.rotY(0.04));
      plane(b, [-0.59, 0, 0.081], [1.18, 0, 0], [0, 0.78, 0], LIT);
      b.pop();
    }, T.lj);
    return { parts: [floor, walls, stuff, box, front] };
  }

  function buildTree(r, T) {
    const floor = part(r, b => plane(b, [-3, 0, 2], [5, 0, 0], [0, 0, -3.3], LIT, [6, 4]), T.parquet);
    const wall = part(r, b => {
      plane(b, [-3, 0, -1.3], [5, 0, 0], [0, 2.7, 0], LIT, [8, 4.4]);
      plane(b, [1.6, 0, -1.3], [0, 0, 3.3], [0, 2.7, 0], LIT, [5, 4.4]);
    }, T.lilac);
    const carpet = part(r, b => plane(b, [-0.8, 0.005, 0.4], [2.2, 0, 0], [0, 0, -1.7], LIT, [1, 1]), T.carpetBlue);
    const g = rand(9);
    const stuff = part(r, b => {
      const wood = 0x5a2618, woodD = 0x3a160e;
      cube(b, 0.2, 0.5, -0.92, 1.05, 0.05, 0.46, wood);
      cube(b, 0.2, 0.42, -0.92, 1.0, 0.08, 0.42, woodD);
      [[-0.27, -1.1], [-0.27, -0.74], [0.67, -1.1], [0.67, -0.74]].forEach(([x, z]) => {
        cyl(b, x, 0, z, 0.03, 0.04, 0.42, 6, wood);
        ball(b, x, 0.2, z, 0.045, 0.06, 0.045, woodD, 6);
      });
      cube(b, 0.2, 0.06, -0.95, 0.95, 0.02, 0.4, woodD);
      cube(b, 0.25, 0.08, -0.98, 0.36, 0.06, 0.28, 0x111114);
      b.push(M4.translate(-0.45, 0, -0.55), M4.rotY(0.3));
      cube(b, 0, 0, 0, 0.42, 0.2, 0.16, 0xb8bcc2);
      b.pop();
      cube(b, -0.7, 0, -1.0, 0.22, 0.03, 0.22, 0x2a2220);
      cyl(b, -0.7, 0.03, -1.0, 0.035, 0.03, 0.72, 8, 0x3a2a24);
      cube(b, -0.7, 0.75, -1.0, 0.3, 0.03, 0.3, 0x2a2220);
      plant(b, -0.7, 0.78, -1.0, 1.2, 0xd84a7a, 0x3e8a3a, 13, true);
      [[0.0, -0.8, 0.3], [0.12, -0.78, -0.2], [0.42, -0.82, 0.5], [0.55, -0.76, -0.1]].forEach(([x, z, a]) => cube(b, x, 0.55, z, 0.135, 0.016, 0.17, 0x1a4ec0, a));
      [[0.3, -0.84, 0.4], [-0.1, -0.86, -0.6]].forEach(([x, z, a]) => b.push(M4.translate(x, 0.57, z), M4.rotY(a)).at(0, 0.02, 0, h => h.ellipsoid(0.08, 0.025, 0.05, 8, 4, 0x18181c)).pop());
      b.push(M4.translate(1.15, 0, -0.55), M4.rotY(-0.6));
      chairRacing(b, 0xe8e8ea, 0x9a9aa0);
      b.pop();
      const trunk = [-1.55, 0, -0.85];
      cyl(b, trunk[0], 0, trunk[2], 0.18, 0.16, 0.12, 8, 0xe8e6e2);
      for (let i = 0; i < 90; i++) {
        const h = 0.15 + g() * 1.75, rr = (0.62 - (h - 0.1) * 0.32) * (0.85 + g() * 0.15), a = g() * PI * 2;
        const col = [[0.75, 0.3, 1, 1], [0.35, 0.55, 1, 1], [1, 1, 0.9, 1], [1, 0.3, 0.5, 1]][i % 4];
        ball(b, trunk[0] + C(a) * rr, h, trunk[2] + S(a) * rr, 0.018, 0.018, 0.018, col, 4);
      }
      for (let k = 0; k < 3; k++) {
        const pts = [], rad = [];
        for (let i = 0; i <= 40; i++) {
          const u = i / 40, h = 0.2 + u * 1.6, a = u * PI * 7 + k * 2.1, rr = 0.66 - (h - 0.1) * 0.33;
          pts.push([trunk[0] + C(a) * rr, h, trunk[2] + S(a) * rr]);
          rad.push(0.02);
        }
        tube(b, pts, rad, 4, k === 1 ? 0xd8b440 : 0xc8202a);
      }
      for (let i = 0; i < 16; i++) {
        const h = 0.3 + g() * 1.4, rr = 0.6 - (h - 0.1) * 0.32, a = g() * PI * 2;
        ball(b, trunk[0] + C(a) * rr, h, trunk[2] + S(a) * rr, 0.04, 0.04, 0.04, [0xd8d8e0, 0xc8302a, 0x2a4ac8, 0xd8b440][i % 4], 6);
      }
      ball(b, trunk[0], 2.02, trunk[2], 0.05, 0.08, 0.05, [1, 0.9, 0.5, 1], 6);
      const garland = (x0, x1, y, sag, col) => {
        const pts = [], rad = [];
        for (let i = 0; i <= 14; i++) {
          const u = i / 14;
          pts.push([x0 + (x1 - x0) * u, y - S(u * PI) * sag, -1.26]);
          rad.push(0.035);
        }
        tube(b, pts, rad, 5, col);
      };
      garland(-1.0, 0.9, 2.3, 0.18, 0xe0c040);
      garland(-0.6, 0.4, 2.15, 0.12, 0xc8202a);
      garland(-1.2, -0.2, 2.42, 0.1, 0xe0c040);
    });
    const tree = part(r, b => {
      const trunk = [-1.55, 0, -0.85];
      for (let i = 0; i < 9; i++) {
        const y = 0.12 + i * 0.2, rr = 0.64 - i * 0.065;
        b.push(M4.translate(trunk[0], y, trunk[2]));
        b.prism(12, rr, rr, 0, rr * 0.3, rr * 0.3, 0.32, LIT, { phase: i * 0.4 });
        b.pop();
      }
    }, T.needles);
    const fans = part(r, b => {
      plane(b, [-0.7, 1.95, -1.27], [0.75, 0, 0], [0, 0.38, 0], LIT);
      plane(b, [0.15, 2.05, -1.27], [0.6, 0, 0], [0, 0.3, 0], LIT);
    }, T.fan);
    const tv = part(r, b => {
      b.push(M4.translate(0.2, 0.92, -0.95));
      tvPanel(b, 1.1, 0.64, 0xf2f2f4, 0.05);
      b.pop();
      const arc = [];
      for (let i = 0; i <= 10; i++) arc.push([0.2 - 0.48 + i * 0.096, 0.565 + 0.02 * S((i / 10) * PI), -0.86 + 0.05 * S((i / 10) * PI)]);
      tube(b, arc, arc.map(() => 0.012), 5, 0xe8e8ec);
    });
    const screen = part(r, b => {
      b.push(M4.translate(0.2, 0.92, -0.95));
      tvScreen(b, 1.1, 0.64, 0.05, 0.035);
      b.pop();
    }, T.off);
    return { parts: [floor, wall, carpet, stuff, tree, fans, tv, screen] };
  }

  const Y = { X0: -1.7, X1: 1.7, Z0: -2.0, Z1: 3.6, H: 2.6, WX0: -0.1, WX1: 1.6, TVZ: -1.3, TVY: 1.5, TVW: 1.45, TVH: 0.84 };

  function buildYellow(r, T) {
    const { X0, X1, Z0, Z1, H, WX0, WX1 } = Y;
    const wc = (WX0 + WX1) / 2, ww = WX1 - WX0;
    const walls = part(r, b => room(b, X0, X1, Z0, Z1, H, { back: windowCut(X0, X1, WX0, WX1, 0.85, 2.3, H) }), T.lilac);
    const floor = part(r, b => plane(b, [X0, 0.001, Z1], [X1 - X0, 0, 0], [0, 0, Z0 - Z1], LIT, [3.5, 5]), T.laminate);
    const ceil = part(r, b => plane(b, [X0, H, Z0], [X1 - X0, 0, 0], [0, 0, Z1 - Z0], 0xf0eee8));
    const glass = part(r, b => plane(b, [WX0, 0.85, Z0 - 0.05], [ww, 0, 0], [0, 1.45, 0], [0.5, 0.54, 0.6, 1]));
    const lace = part(r, b => {
      for (let i = 0; i < 10; i++) {
        const x0 = WX0 - 0.22 + i * 0.205, z = Z0 + 0.12 + (i % 2 ? 0.04 : 0);
        plane(b, [x0, 0.58, z], [0.21, 0, i % 2 ? -0.04 : 0.04], [0, 1.87, 0], [1, 1, 1, 0.35], [0.6, 1.9]);
      }
    }, T.laceSoft, { blend: true, alpha: 0.9 });
    const sheet = part(r, b => sheetTop(b, X0 + 0.02, -0.78, Z0 + 0.06, 0.05, 0.5, 7), T.poppy);
    const base = part(r, b => {
      frameBox(b, wc, 0.85, Z0 + 0.03, ww, 1.45, 0.08, 0xf2f0ea);
      cube(b, wc, 0.82, Z0 + 0.14, ww + 0.2, 0.04, 0.26, 0xf0eee8);
      radiator(b, wc, 0.2, Z0 + 0.1, 1.2);
      cube(b, wc, 2.48, Z0 + 0.15, ww + 0.6, 0.04, 0.05, 0xd8d4c8);
      bed(b, X0 + 0.02, -0.78, Z0 + 0.05, 0.05, 0.5, 0x2a9a3a);
      ball(b, -1.25, 0.6, Z0 + 0.35, 0.3, 0.07, 0.15, 0xe8e2d4, 8);
    });
    return { parts: [walls, floor, ceil, glass, base, sheet, lace] };
  }

  function buildYellowDress(r, T) {
    const { X1, Z0, TVZ } = Y;
    const A_ = part(r, b => {
      cube(b, 1.25, 0.46, -1.62, 0.62, 0.04, 0.46, 0x3a2a20);
      [[0.96, -1.82], [0.96, -1.42], [1.54, -1.82], [1.54, -1.42]].forEach(([x, z]) => cube(b, x, 0, z, 0.04, 0.46, 0.04, 0x2a1e18));
      cube(b, 1.3, 0.5, -1.55, 0.32, 0.05, 0.22, 0x101012);
      cube(b, -0.45, 0, -1.7, 0.26, 0.42, 0.26, 0x3a2a20);
      cyl(b, -0.45, 0.42, -1.7, 0.08, 0.08, 0.3, 10, [0.98, 0.96, 0.92, 0.6]);
      b.push(M4.translate(0.02, 0, 1.18), M4.rotY(2.66));
      massageChair(b);
      b.pop();
      cube(b, 1.45, 0, 1.6, 0.3, 0.75, 0.3, 0x4a3022);
      ball(b, 1.45, 1.0, 1.6, 0.13, 0.22, 0.13, 0x101012, 8);
      ball(b, 1.45, 1.28, 1.58, 0.1, 0.08, 0.13, 0x101012, 8);
      [-1, 1].forEach(s => tube(b, [[1.45, 1.32, 1.58 + s * 0.06], [1.41, 1.42, 1.58 + s * 0.12]], [0.015, 0.008], 4, 0xd8d0c0));
      cube(b, X1 - 0.02, 1.15, -1.92, 0.02, 0.75, 0.14, 0xc85a24);
    });
    const Aposter = part(r, b => plane(b, [X1 - 0.02, 1.13, -0.86], [0, 0, 1.12], [0, 1.24, 0], LIT), T.canyon);
    const Afan = part(r, b => plane(b, [X1 - 0.03, 1.3, -2.0], [0, 0, 1.1], [0, 1.05, 0], LIT), T.fan);
    const Atv = part(r, b => {
      b.push(M4.translate(1.28, 0.79, -1.62), M4.rotY(-0.55));
      tvPanel(b, 0.68, 0.42, 0xf2f2f4, 0.04);
      cube(b, 0, -0.29, 0, 0.3, 0.08, 0.12, 0xe8e8ec);
      b.pop();
    });
    const AtvScreen = part(r, b => {
      b.push(M4.translate(1.28, 0.79, -1.62), M4.rotY(-0.55));
      tvScreen(b, 0.68, 0.42, 0.04);
      b.pop();
    }, T.off);
    const B_ = part(r, b => {
      cube(b, 0.75, 0.73, Z0 + 0.32, 1.4, 0.04, 0.58, 0xe8e4dc);
      [[0.1, -1.84], [0.1, -1.48], [1.4, -1.84], [1.4, -1.48]].forEach(([x, z]) => cube(b, x, 0, z, 0.04, 0.73, 0.04, 0x8a8a8e));
      b.push(M4.translate(0.85, 0.77, Z0 + 0.2));
      b.box(0.5, 0.32, 0.03, 0x111114, { base: true });
      b.pop();
      [[0.5, 0.77, -1.6, 0x9a1a1a], [0.75, 0.77, -1.55, 0xc8202a], [1.1, 0.77, -1.62, 0xe8e8ea], [0.3, 0.77, -1.52, 0xc8202a]].forEach(([x, y, z, c]) => cyl(b, x, y, z, 0.035, 0.04, 0.1, 8, c));
      cyl(b, 1.2, 0.77, -1.7, 0.03, 0.03, 0.26, 8, [0.85, 0.85, 0.82, 0.3]);
      cube(b, 0.4, 0.77, -1.65, 0.3, 0.06, 0.22, 0xf2e23a);
      cube(b, -0.38, 0, -1.2, 0.36, 0.44, 0.36, 0x4a3a2c);
      b.push(M4.translate(-0.34, 0.95, 0.22), M4.rotY(0.35), M4.rotX(-0.55));
      b.box(0.7, 0.42, 0.05, 0x0c0c0e);
      b.pop();
      cube(b, -0.25, 0, 0.25, 0.8, 0.9, 0.45, 0x2a2a2e);
      cube(b, 0.55, 0, -1.55, 0.16, 0.08, 0.3, 0xf4f4f2);
    });
    const Bbanner = part(r, b => plane(b, [X1 - 0.02, 0.45, -0.42], [0, 0, 0.62], [0, 1.95, 0], LIT), T.banner);
    const Bboard = part(r, b => plane(b, [X1 - 0.03, 1.32, TVZ - 0.55], [0, 0, 1.1], [0, 0.95, 0], LIT), T.board);
    const balloons = part(r, b => {
      [[0.62, 1.12, -1.72, 0.1], [0.9, 0.98, -1.78, 0.095], [0.42, 1.22, -1.68, 0.09], [1.15, 1.2, -1.85, 0.1], [1.4, 0.9, -1.5, 0.09]].forEach(([x, y, z, rr]) => {
        b.push(M4.translate(x, y, z), M4.rotY(-0.3));
        K.spherePatch(b, rr, rr * 1.12, rr, -PI, PI, -PI / 2, PI / 2, 12, 8, LIT, [1, 1]);
        b.pop();
      });
    }, T.smiley);
    return { A: [A_, Aposter, Afan, Atv, AtvScreen], B: [B_, Bbanner, balloons], board: Bboard };
  }

  function buildWallTv(r) {
    return {
      body: mesh(r, b => tvPanel(b, Y.TVW, Y.TVH, 0x101012, 0.06)),
      screen: mesh(r, b => tvScreen(b, Y.TVW, Y.TVH, 0.06)),
      bracket: mesh(r, b => cube(b, 0, -0.15, -0.06, 0.3, 0.3, 0.06, 0x2a2a2e))
    };
  }

  function buildUnbox(r, T) {
    const corridor = part(r, b => {
      plane(b, [-2, 0, 1.5], [4, 0, 0], [0, 0, -2.3], 0xb07a40);
      cube(b, -1.05, 0, -0.6, 0.12, 2.1, 0.08, 0xc89a68);
      cube(b, -1.45, 0, -0.1, 0.8, 0.012, 1.4, 0xe8e4dc);
      plane(b, [-2, 0, -0.8], [4, 0, 0], [0, 2.5, 0], 0xe8dcc8);
    });
    const boxBody = part(r, b => cube(b, 0, 0, -0.58, 1.62, 1.0, 0.2, 0xeceae4, 0, { front: null, right: null }), null);
    const boxFace = part(r, b => plane(b, [-0.81, 0, -0.479], [1.62, 0, 0], [0, 1.0, 0], LIT), T.samsong);
    const boxEnd = part(r, b => plane(b, [0.81, 0, -0.48], [0, 0, -0.2], [0, 1.0, 0], LIT), T.samsongEnd);
    const floorSet = part(r, b => {
      plane(b, [4, 0, 2], [3, 0, 0], [0, 0, -3], LIT, [4, 4]);
    }, T.parquet);
    const floorCarpet = part(r, b => plane(b, [4.2, 0.004, -0.2], [2.4, 0, 0], [0, 0, -1.6], LIT, [2, 1.4]), T.carpetBlue);
    const floorStuff = part(r, b => {
      const loop = [];
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * PI * 2;
        loop.push([5.4 + C(a) * 0.45, 0.01, 0.9 + S(a) * 0.3]);
      }
      tube(b, loop, loop.map(() => 0.006), 3, 0xf2f2f2);
      cube(b, 4.15, 0, 0.6, 0.1, 2.0, 0.1, 0x9a6234);
      cube(b, 6.6, 0, -1.2, 0.8, 0.45, 0.9, 0x7a7e84);
      cube(b, 6.6, 0.45, -1.2, 0.8, 0.5, 0.2, 0x8a8e94);
      cube(b, 5.2, 0, -1.55, 0.25, 0.42, 1.9, 0x2aa03a, PI / 2);
      cube(b, 5.0, 0.42, -2.05, 1.9, 0.1, 0.9, 0xe8ece2);
      cube(b, 5.95, 0, -0.9, 0.18, 0.1, 0.12, 0xf4f4f4);
      cube(b, 6.35, 0, -0.9, 0.18, 0.1, 0.12, 0xf4f4f4);
      b.push(M4.translate(6.15, 0.1, -0.9));
      b.box(1.0, 0.6, 0.06, 0x101012, { base: true });
      b.pop();
      const wire = [];
      for (let i = 0; i <= 16; i++) wire.push([5.6 + i * 0.04, 0.008, 0.3 + S(i * 0.9) * 0.08]);
      tube(b, wire, wire.map(() => 0.004), 3, 0x141414);
    });
    const bag = part(r, b => {
      const P = (u, v, side) => {
        const x = 6.15 + (u - 0.5) * 1.12, y = 0.28 + v * 0.5;
        const puff = 0.03 + 0.025 * S(u * 9 + v * 5) + 0.015 * C(u * 17 - v * 11 + side);
        return [x, y, -0.9 + side * (0.05 + puff)];
      };
      [-1, 1].forEach(side => {
        for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) b.quad(P(i / 6, j / 4, side), P((i + 1) / 6, j / 4, side), P((i + 1) / 6, (j + 1) / 4, side), P(i / 6, (j + 1) / 4, side), [0.95, 0.95, 0.96, 0.25]);
      });
      cube(b, 6.15, 0.78, -0.9, 1.14, 0.03, 0.16, [0.95, 0.95, 0.96, 0.25]);
    }, null, { blend: true, alpha: 0.82 });
    const film = part(r, b => {
      const P = (u, v) => [10.0 + (u - 0.5) * 1.5, 0.535 + 0.035 * S(u * 7 + v * 4) * S(v * 3.1) + 0.012 * C(u * 19 + v * 13), 0.52 - v * 0.55];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) b.quad(P(i / 8, (j + 1) / 4), P((i + 1) / 8, (j + 1) / 4), P((i + 1) / 8, j / 4), P(i / 8, j / 4), [0.95, 0.95, 0.96, 0.25]);
    }, null, { blend: true, alpha: 0.85 });
    const bedSheet = part(r, b => plane(b, [9, 0.452, 1.2], [2.2, 0, 0], [0, 0, -2.4], LIT, [2, 2]), T.poppy);
    const bedSet = part(r, b => {
      plane(b, [8.5, 0, 2.0], [3.5, 0, 0], [0, 0, -4], 0x9a6234);
      cube(b, 10.1, 0, 0, 2.2, 0.45, 2.4, 0x2aa03a);
      plane(b, [8.6, 0.006, 1.9], [1.2, 0, 0], [0, 0, -1.0], LIT, [1, 1]);
    }, T.carpetBlack);
    const lyingTv = part(r, b => {
      b.push(M4.translate(10.0, 0.485, 0.1), M4.rotX(-PI / 2));
      tvPanel(b, 1.45, 0.84, 0x141416, 0.06);
      b.pop();
      [-1, 1].forEach(s => {
        b.push(M4.translate(10.0 + s * 0.6, 0.47, -0.3), M4.rotX(-0.08));
        b.box(0.06, 0.45, 0.02, 0xf2f2f4, { base: true });
        b.at(0, 0.0, 0, h => h.box(0.12, 0.05, 0.12, 0xf4f4f6, { base: true }));
        b.pop();
      });
    });
    const lyingScreen = part(r, b => {
      b.push(M4.translate(10.0, 0.485, 0.1), M4.rotX(-PI / 2));
      tvScreen(b, 1.45, 0.84, 0.06);
      b.pop();
    }, T.off);
    return { box: [corridor, boxBody, boxFace, boxEnd], floor: [floorSet, floorCarpet, floorStuff, bag], bed: [bedSet, bedSheet, lyingTv, lyingScreen, film] };
  }

  function buildCam(r, T) {
    const walls = part(r, b => {
      plane(b, [-2.6, 0, -2.4], [3.8, 0, 0], [0, 2.7, 0], LIT, [6, 4.3]);
      plane(b, [1.2, 0, -2.4], [0, 0, 3.0], [0, 2.7, 0], LIT, [5, 4.3]);
      plane(b, [-2.6, 0, 0.6], [0, 0, -3.0], [0, 2.7, 0], LIT, [5, 4.3]);
    }, T.camPaper);
    const floor = part(r, b => plane(b, [-2.6, 0, 1], [3.8, 0, 0], [0, 0, -3.4], LIT, [3, 3]), T.laminate);
    const window_ = part(r, b => plane(b, [-1.9, 0.75, -2.37], [2.2, 0, 0], [0, 1.65, 0], [1.6, 1.6, 1.62, 1]));
    const stuff = part(r, b => {
      radiator(b, -0.8, 0.15, -2.3, 1.2);
      cube(b, -0.8, 0.72, -2.25, 2.4, 0.04, 0.26, 0xf0eee8);
      cube(b, -1.9, 0, -1.3, 1.2, 0.42, 1.9, 0x6a2a20);
      cube(b, -1.9, 0.42, -1.3, 1.2, 0.08, 1.9, 0xe8e4dc);
      cube(b, 0.95, 0, -1.1, 0.5, 0.9, 0.5, 0x5a3a24);
      cube(b, 0.95, 0.9, -1.1, 0.52, 0.03, 0.52, 0x6a4a30);
      cyl(b, 1.0, 0.93, -1.0, 0.04, 0.035, 0.3, 8, [0.62, 0.36, 0.12, 0.2]);
      cyl(b, 0.85, 0.93, -1.25, 0.03, 0.03, 0.18, 8, 0x2a4ac8);
      tube(b, [[0.7, 0.93, -1.3], [0.68, 1.45, -1.28], [0.55, 1.55, -1.1]], [0.012, 0.012, 0.01], 5, 0x1a1a1c);
      b.push(M4.translate(0.5, 1.5, -1.0), M4.rotY(-0.4));
      b.ellipsoid(0.1, 0.1, 0.01, 12, 4, 0x24282e);
      b.pop();
      cube(b, 0.0, 0.0, 0.25, 1.9, 0.72, 0.6, 0x1a1412);
      cube(b, 0.0, 0.72, 0.25, 1.95, 0.04, 0.62, 0x241c18);
    });
    const blanket = part(r, b => plane(b, [-2.5, 0.505, -0.35], [1.2, 0, 0], [0, 0, -1.9], LIT, [1, 2]), T.carpetRed);
    const rug = part(r, b => plane(b, [-1.3, 0.004, -0.5], [0.8, 0, 0], [0, 0, -1.2], LIT), T.carpetRed);
    const poster = part(r, b => plane(b, [1.18, 0.95, -1.25], [0, 0, 0.9], [0, 1.4, 0], LIT), T.canyon);
    const toys = part(r, b => plane(b, [0.71, 0.93, -0.84], [0.48, 0, 0], [0, 0.22, 0], LIT), T.toys);
    return { parts: [walls, floor, window_, stuff, blanket, rug, poster, toys] };
  }

  function buildProps(r) {
    return {
      officeChair: mesh(r, b => chairOffice(b, 0x3a6aaa)),
      camChair: mesh(r, b => {
        cube(b, 0, 0.42, 0, 0.58, 0.1, 0.55, 0x2a201c);
        b.push(M4.translate(0, 0.5, -0.3), M4.rotX(-0.12));
        b.box(0.6, 0.66, 0.12, 0x3a2a22, { base: true });
        b.at(0, 0.66, 0, h => h.ellipsoid(0.3, 0.09, 0.07, 10, 4, 0x3a2a22));
        b.pop();
        [-1, 1].forEach(s => cube(b, s * 0.33, 0.52, 0.02, 0.08, 0.22, 0.45, 0x1c1614));
      }),
      cig: mesh(r, b => {
        cyl(b, 0, 0, 0, 0.0045, 0.0045, 0.06, 6, 0xf4f2ee);
        cyl(b, 0, 0, 0, 0.0047, 0.0047, 0.018, 6, 0xd89a50);
        ball(b, 0, 0.061, 0, 0.005, 0.004, 0.005, [1, 0.4, 0.1, 1], 4);
      }),
      phone: mesh(r, b => b.box(0.075, 0.15, 0.01, 0x121214)),
      wallTv: buildWallTv(r)
    };
  }

  function build(r) {
    const T = textures(r);
    return {
      T,
      old: buildOld(r, T),
      box: buildBox(r, T),
      tree: buildTree(r, T),
      yellow: buildYellow(r, T),
      dress: buildYellowDress(r, T),
      unbox: buildUnbox(r, T),
      cam: buildCam(r, T),
      props: buildProps(r)
    };
  }

  function wallTvMatrix(tv) {
    const tilt = tv.tilt || 0;
    return M4.chain(
      M4.translate(Y.X1 - 0.06 - (tv.out || 0), Y.TVY - (tv.drop || 0), Y.TVZ + (tv.slide || 0)),
      M4.rotY(-PI / 2),
      M4.rotZ(tv.roll || 0),
      M4.rotX(tilt),
      M4.translate(0, Y.TVH / 2, 0)
    );
  }

  function drawYellow(r, W, st) {
    drawParts(r, W.yellow.parts);
    const dress = st.dress || 'A';
    if (dress === 'A') drawParts(r, W.dress.A);
    else drawParts(r, W.dress.B);
    if (dress === 'C') drawParts(r, [W.dress.board]);
    if (st.wallTv) {
      const tv = st.wallTv;
      const m = wallTvMatrix(tv);
      r.draw(W.props.wallTv.bracket, M4.chain(M4.translate(Y.X1 - 0.03, Y.TVY + Y.TVH / 2, Y.TVZ), M4.rotY(-PI / 2)));
      r.draw(W.props.wallTv.body, m);
      const scr = tv.screen === 'game' ? W.T.game : tv.screen === 'blue' ? W.T.blue : W.T.off;
      r.draw(W.props.wallTv.screen, m, { texture: scr });
    }
    if (st.chairM) {
      r.draw(W.props.officeChair, st.chairM);
    } else if (st.chair) {
      const c = st.chair;
      r.draw(W.props.officeChair, M4.chain(M4.translate(c.pos[0], c.pos[1] || 0, c.pos[2]), M4.rotY(c.yaw || 0), M4.rotX(c.pitch || 0), M4.rotZ(c.roll || 0)));
    }
  }

  function draw(r, W, st) {
    const set = st.set;
    if (set === 'old') {
      drawParts(r, W.old.parts);
    } else if (set === 'box') {
      drawParts(r, W.box.parts);
    } else if (set === 'tree') {
      drawParts(r, W.tree.parts);
    } else if (set === 'yellow') {
      drawYellow(r, W, st);
    } else if (set === 'unbox') {
      const u = W.unbox;
      drawParts(r, st.zone === 'floor' ? u.floor : st.zone === 'bed' ? u.bed : u.box);
    } else if (set === 'cam') {
      drawParts(r, W.cam.parts);
      r.draw(W.props.camChair, M4.chain(M4.translate(-0.12, 0, -0.68), M4.rotY(st.chairYaw === undefined ? 0.3 : st.chairYaw)));
    }
  }

  window.OzonWorld = { Y, build, draw, wallTvMatrix };
})();
