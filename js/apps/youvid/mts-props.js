(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C } = K;

  const COL = {
    olive: 0x5f5b3d, oliveDk: 0x46432d, dark: 0x2c2a26, steel: 0x55575b, bore: 0x0d0c0b, wood: 0x7a4a26, woodDk: 0x5a3519,
    blade: 0x2f3032, handle: 0x4a3222, rocket: 0x6a6650, fin: 0x4c4a3a, warhead: 0x8c3a2a
  };

  function tubeZ(b, sides, r0, z0, r1, z1, col, opts) {
    b.push(M4.rotX(PI / 2));
    b.prism(sides, r0, r0, z0, r1, r1, z1, col, opts || {});
    b.pop();
    return b;
  }

  function buildLauncher(b) {
    tubeZ(b, 18, 0.062, -0.5, 0.062, 0.4, COL.olive, { capTop: false });
    tubeZ(b, 18, 0.062, 0.4, 0.098, 0.52, COL.olive, { capTop: false });
    tubeZ(b, 18, 0.098, 0.52, 0.1, 0.535, COL.oliveDk, { capTop: false });
    tubeZ(b, 18, 0.08, 0.36, 0.08, 0.53, COL.bore, { capTop: false });
    b.at(0, 0, 0.47, h => K.discXY(h, 0, 0, 0, 0.078, 18, rgb(COL.bore)));
    tubeZ(b, 18, 0.07, -0.62, 0.062, -0.5, COL.oliveDk, { capTop: false });
    tubeZ(b, 18, 0.06, -0.62, 0.06, -0.52, COL.bore, { capTop: false });
    b.at(0, 0, -0.56, h => { h.push(M4.rotY(PI)); K.discXY(h, 0, 0, 0, 0.06, 18, rgb(COL.bore)); h.pop(); });
    [-0.36, -0.05, 0.22].forEach(z => tubeZ(b, 18, 0.066, z - 0.022, 0.066, z + 0.022, COL.oliveDk));
    b.push(M4.translate(0, -0.075, 0.02), M4.rotX(0.28));
    b.box(0.034, 0.11, 0.05, COL.dark);
    b.pop();
    b.at(0, -0.075, 0.08, h => h.box(0.012, 0.05, 0.06, COL.dark));
    b.push(M4.translate(0, -0.08, 0.27), M4.rotX(0.12));
    b.box(0.032, 0.1, 0.042, COL.dark);
    b.pop();
    b.at(0.0, 0.07, 0.12, h => h.box(0.022, 0.03, 0.05, COL.dark));
    b.at(0.0, 0.092, 0.12, h => h.box(0.03, 0.02, 0.012, COL.dark));
    b.at(-0.045, 0.05, -0.2, h => h.box(0.03, 0.05, 0.2, COL.oliveDk));
    b.at(0.0, -0.07, -0.3, h => h.box(0.02, 0.04, 0.16, COL.dark));
    return b;
  }

  function buildShotgun(b) {
    tubeZ(b, 10, 0.017, -0.05, 0.017, 0.5, COL.steel);
    tubeZ(b, 10, 0.014, 0.0, 0.014, 0.44, COL.dark);
    b.at(0, -0.022, 0.24, h => tubeZ(h, 10, 0.026, -0.07, 0.026, 0.07, COL.wood));
    b.at(0, -0.01, -0.08, h => h.box(0.04, 0.06, 0.16, COL.dark));
    b.push(M4.translate(0, -0.045, -0.27), M4.rotX(-0.18));
    b.box(0.038, 0.075, 0.26, COL.wood);
    b.pop();
    b.push(M4.translate(0, -0.055, -0.15), M4.rotX(0.5));
    b.box(0.032, 0.07, 0.04, COL.woodDk);
    b.pop();
    b.at(0, -0.05, -0.06, h => h.box(0.01, 0.03, 0.05, COL.dark));
    return b;
  }

  function buildShovel(b) {
    tubeZ(b, 8, 0.016, -0.36, 0.018, 0.3, COL.handle);
    b.at(0, 0, -0.38, h => h.box(0.06, 0.02, 0.03, COL.handle));
    b.at(0, 0, 0.31, h => h.box(0.03, 0.03, 0.05, COL.blade));
    b.push(M4.translate(0, 0, 0.33));
    const w = 0.075, len = 0.22;
    const pts = [[-w, 0], [w, 0], [w * 0.95, len * 0.7], [0, len], [-w * 0.95, len * 0.7]];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[0], c1 = pts[i], c2 = pts[i + 1];
      b.tri([a[0], 0.004, a[1]], [c1[0], 0.004, c1[1]], [c2[0], 0.004, c2[1]], COL.blade, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      b.tri([a[0], -0.004, a[1]], [c2[0], -0.004, c2[1]], [c1[0], -0.004, c1[1]], COL.blade, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    }
    b.pop();
    return b;
  }

  function buildRocket(b) {
    tubeZ(b, 10, 0.028, -0.14, 0.03, 0.08, COL.rocket);
    tubeZ(b, 10, 0.03, 0.08, 0.002, 0.18, COL.warhead);
    for (let i = 0; i < 4; i++) {
      b.push(M4.rotZ(i * PI / 2 + PI / 4));
      b.at(0, 0.04, -0.12, h => h.box(0.004, 0.05, 0.06, COL.fin));
      b.pop();
    }
    return b;
  }

  const GRIPS = {
    launcher: {
      R: { at: [0, -0.115, 0.04], fingers: [0, -0.35, 1], palm: [-1, 0, 0], pose: 'grip' },
      L: { at: [0, -0.12, 0.29], fingers: [0, -0.3, 1], palm: [1, 0, 0], pose: 'grip' }
    },
    shotgun: {
      R: { at: [0, -0.07, -0.13], fingers: [0, -0.5, 1], palm: [-1, 0, 0], pose: 'grip' },
      L: { at: [0, -0.045, 0.24], fingers: [0, -0.2, 1], palm: [1, 0.2, 0], pose: 'grip' }
    },
    shovel: {
      R: { at: [0, 0, -0.3], fingers: [1, 0, 0.1], palm: [0, 0, -1], pose: 'fist' },
      L: { at: [0, 0, -0.05], fingers: [1, 0, 0.1], palm: [0, 0, -1], pose: 'fist' }
    }
  };

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      launcher: mk(buildLauncher),
      shotgun: mk(buildShotgun),
      shovel: mk(buildShovel),
      rocket: mk(buildRocket)
    };
  }

  function muzzle(kind, M) {
    if (kind === 'launcher') return { p: M4.point(M, [0, 0, 0.55]), d: V3.norm(M4.dir(M, [0, 0, 1])) };
    if (kind === 'shotgun') return { p: M4.point(M, [0, 0, 0.52]), d: V3.norm(M4.dir(M, [0, 0, 1])) };
    return { p: M4.point(M, [0, 0, 0]), d: [0, 0, 1] };
  }

  function grip(kind, side, M) {
    const g = GRIPS[kind][side];
    return { pos: M4.point(M, g.at), fingers: V3.norm(M4.dir(M, g.fingers)), palm: V3.norm(M4.dir(M, g.palm)), pose: g.pose };
  }

  window.MtsProps = { COL, GRIPS, build, muzzle, grip };
})();
