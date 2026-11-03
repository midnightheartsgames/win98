(function () {
  const K = window.YouVidKit;
  const { mesh } = K;
  const Art = window.BuffArt;

  const WIN_Z = -3.0;
  const FAR_Z = 9.6;
  const SIDE_X = 4.6;
  const TOP = 6.5;
  const WINDOWS = [[-0.41, -0.13], [-0.87, -0.6], [-1.32, -1.04], [-1.77, -1.49], [-2.22, -1.94]];
  const WIN_Y = [0.12, 6.2];
  const PILASTERS = [-3.2, -1.6, 0.0, 1.6, 3.2];

  function wallZ(b, z, x0, x1, y0, y1, col, us, vs, facing) {
    const n = [0, 0, facing];
    const uv = [[x0 * us, y0 * vs], [x1 * us, y0 * vs], [x1 * us, y1 * vs], [x0 * us, y1 * vs]];
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, uv, [n, n, n, n]);
  }

  function boxAt(b, x, y, z, sx, sy, sz, col) {
    b.at(x, y, z, h => h.box(sx, sy, sz, col));
  }

  function build(r) {
    const T = {
      glass: r.texture(64, Art.glass, { height: 256 }),
      panels: r.texture(128, Art.panels(0x1a050b, 3)),
      stone: r.texture(128, Art.stone),
      planks: r.texture(256, Art.planks)
    };
    const floor = mesh(r, b => {
      const n = [0, 1, 0];
      const x0 = -SIDE_X, x1 = SIDE_X, z0 = WIN_Z, z1 = FAR_Z;
      const uv = (x, z) => [x / 1.25, z / 2.6];
      const N = 10;
      for (let j = 0; j < N; j++) {
        const za = z0 + (z1 - z0) * (j / N), zb = z0 + (z1 - z0) * ((j + 1) / N);
        const lit = (z) => {
          const k = Math.max(0, 1 - Math.abs(z - 7.2) / 2.4);
          const d = Math.max(0, 1 - Math.abs(z - 0.4) / 3.2);
          return 0.3 + 0.42 * k + 0.05 * d;
        };
        const ca = [lit(za), lit(za) * 0.92, lit(za) * 0.9, 0], cb = [lit(zb), lit(zb) * 0.92, lit(zb) * 0.9, 0];
        b.quad([x0, 0, zb], [x1, 0, zb], [x1, 0, za], [x0, 0, za], [cb, cb, ca, ca], [uv(x0, zb), uv(x1, zb), uv(x1, za), uv(x0, za)], [n, n, n, n]);
      }
    });
    const winWall = mesh(r, b => {
      const xs = WINDOWS.slice().sort((a, c) => a[0] - c[0]);
      let x = -SIDE_X;
      xs.forEach(([a, c]) => {
        wallZ(b, WIN_Z, x, a, 0, TOP, 0x8a6a6e, 0.8, 0.3, 1);
        wallZ(b, WIN_Z, a, c, 0, WIN_Y[0], 0x8a6a6e, 0.8, 0.3, 1);
        wallZ(b, WIN_Z, a, c, WIN_Y[1], TOP, 0x8a6a6e, 0.8, 0.3, 1);
        x = c;
      });
      wallZ(b, WIN_Z, x, SIDE_X, 0, TOP, 0x9a7a7e, 0.8, 0.3, 1);
      xs.forEach(([a, c]) => {
        boxAt(b, a - 0.03, WIN_Y[0] + (WIN_Y[1] - WIN_Y[0]) / 2, WIN_Z + 0.06, 0.08, WIN_Y[1] - WIN_Y[0] + 0.1, 0.14, 0x1a0c0a);
        boxAt(b, c + 0.03, WIN_Y[0] + (WIN_Y[1] - WIN_Y[0]) / 2, WIN_Z + 0.06, 0.08, WIN_Y[1] - WIN_Y[0] + 0.1, 0.14, 0x1a0c0a);
      });
      boxAt(b, -1.2, WIN_Y[0] - 0.05, WIN_Z + 0.1, 2.5, 0.1, 0.22, 0x24100c);
      [0.7, 1.9, 3.1].forEach(xx => boxAt(b, xx, TOP / 2, WIN_Z + 0.1, 0.34, TOP, 0.2, 0x14050a));
    });
    const glassMesh = mesh(r, b => {
      WINDOWS.forEach(([a, c], i) => {
        const g = 0.94 + 0.06 * Math.sin(i * 1.7);
        const col = [g, g, g, 1];
        const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
        const n = [0, 0, 1];
        b.quad([a, WIN_Y[0], WIN_Z + 0.01], [c, WIN_Y[0], WIN_Z + 0.01], [c, WIN_Y[1], WIN_Z + 0.01], [a, WIN_Y[1], WIN_Z + 0.01], col, uv, [n, n, n, n]);
      });
    });
    const farWall = mesh(r, b => {
      wallZ(b, FAR_Z, -SIDE_X, SIDE_X, 0, TOP, 0xa08088, 0.6, 0.55, -1);
      PILASTERS.forEach(x => {
        boxAt(b, x, TOP / 2, FAR_Z - 0.12, 0.42, TOP, 0.24, 0x2e1218);
        boxAt(b, x, 0.12, FAR_Z - 0.16, 0.52, 0.24, 0.32, 0x3a1a1c);
      });
      boxAt(b, 0, 0.55, FAR_Z - 0.03, SIDE_X * 2, 1.1, 0.06, 0x2a1014);
      boxAt(b, 0, 1.12, FAR_Z - 0.06, SIDE_X * 2, 0.06, 0.12, 0x3a1a1a);
    });
    const sideWalls = mesh(r, b => {
      [-1, 1].forEach(s => {
        const n = [-s, 0, 0];
        const x = s * SIDE_X;
        b.quad([x, 0, WIN_Z], [x, 0, FAR_Z], [x, TOP, FAR_Z], [x, TOP, WIN_Z], 0x6a4a50, [[WIN_Z * 0.8, 0], [FAR_Z * 0.8, 0], [FAR_Z * 0.8, TOP * 0.3], [WIN_Z * 0.8, TOP * 0.3]], [n, n, n, n]);
      });
    });
    const props = mesh(r, b => {
      const sx = 1.55, sz = 7.6;
      b.at(sx, 0, sz, h => {
        h.box(0.36, 0.04, 0.36, 0x161010);
        h.at(0, 0.02, 0, q => q.prism(6, 0.03, 0.03, 0, 0.025, 0.025, 1.45, 0x1c1414));
        h.at(0, 1.45, 0, q => q.prism(8, 0.13, 0.13, 0, 0.16, 0.16, 0.05, 0x241a16));
        h.at(0, 1.5, 0, q => q.prism(6, 0.025, 0.025, 0, 0.025, 0.025, 0.12, 0xe8dcc0));
      });
      b.at(-1.9, 0.27, 7.9, h => {
        h.box(0.95, 0.54, 0.5, 0x2a1610);
        h.at(0, 0.3, 0, q => q.box(0.99, 0.08, 0.54, 0x3a2016));
        [-0.36, 0.36].forEach(x => h.at(x, 0, 0.26, q => q.box(0.05, 0.56, 0.02, 0x14100c)));
      });
    });
    const flame = mesh(r, b => {
      b.at(1.55, 1.69, 7.6, h => h.ellipsoid(0.03, 0.06, 0.03, 8, 5, [1, 0.8, 0.45, 1]));
    });
    return { T, floor, winWall, glassMesh, farWall, sideWalls, props, flame };
  }

  function draw(r, W, opts) {
    const o = opts || {};
    r.draw(W.floor, null, { texture: W.T.planks });
    r.draw(W.winWall, null, { texture: W.T.panels });
    r.draw(W.glassMesh, null, { texture: W.T.glass, tint: o.glass || [1, 1, 1] });
    r.draw(W.farWall, null, { texture: W.T.stone });
    r.draw(W.sideWalls, null, { texture: W.T.panels });
    r.draw(W.props, null, {});
    r.draw(W.flame, null, { tint: o.flame || [1, 1, 1] });
  }

  window.BuffHall = { WIN_Z, FAR_Z, WINDOWS, WIN_Y, build, draw };
})();
