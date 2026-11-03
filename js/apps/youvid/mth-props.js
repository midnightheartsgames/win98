(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp } = K;

  const G = { dark: 0x353634, mid: 0x4a4b48, light: 0x6b6d69, drum: 0xd6d2c8, rivet: 0x6c675e, grip: 0x2b2a29 };

  function cylX(b, x0, x1, r, col, sides, y, z, opts) {
    b.push(M4.translate(x0, y || 0, z || 0), M4.rotZ(-PI / 2));
    b.prism(sides || 16, r, r, 0, r, r, x1 - x0, col, Object.assign({ capBottom: true }, opts || {}));
    b.pop();
  }

  function tubePath(b, pts, r, col, sides) {
    K.tube(b, pts, pts.map(() => r), sides || 8, col);
    pts.forEach(p => b.at(p[0], p[1], p[2], h => h.ellipsoid(r, r, r, 8, 5, col)));
  }

  const AX = 0.06;

  function buildBody(b) {
    cylX(b, -0.47, -0.12, 0.088, G.dark, 18, AX, 0);
    cylX(b, -0.12, 0.08, 0.1, G.mid, 18, AX, 0);
    cylX(b, 0.08, 0.12, 0.086, G.dark, 16, AX, 0);
    cylX(b, -0.4, -0.06, 0.1, G.drum, 22, -0.1, 0);
    cylX(b, -0.42, -0.38, 0.106, G.mid, 22, -0.1, 0);
    cylX(b, -0.08, -0.04, 0.106, G.mid, 22, -0.1, 0);
    for (let i = 0; i < 7; i++) {
      const x = lerp(-0.36, -0.1, i / 6);
      [0.6, -0.5, 1.6].forEach(a => b.at(x, -0.1 + S(a) * 0.101, C(a) * 0.101, h => h.ellipsoid(0.005, 0.005, 0.005, 5, 3, G.rivet)));
    }
    b.at(-0.24, -0.02, 0.115, h => h.box(0.24, 0.15, 0.05, G.mid));
    for (let i = 0; i < 4; i++) b.at(-0.31 + i * 0.045, -0.02, 0.142, h => h.box(0.012, 0.085, 0.006, G.dark));
    b.at(-0.12, 0.0, 0, h => h.box(0.08, 0.12, 0.1, G.dark));
    tubePath(b, [[-0.5, 0.12, 0], [-0.5, 0.24, 0], [-0.45, 0.27, 0], [-0.28, 0.27, 0], [-0.23, 0.23, 0], [-0.21, 0.15, 0]], 0.019, G.mid, 8);
    tubePath(b, [[0.0, 0.15, 0], [0.02, 0.2, 0], [0.12, 0.2, 0], [0.14, 0.15, 0]], 0.014, G.mid, 8);
    [-0.07, 0.07].forEach(z => tubePath(b, [[-0.46, 0.0, z], [-0.56, 0.0, z], [-0.56, 0.16, z], [-0.46, 0.16, z]], 0.017, G.grip, 8));
    b.at(-0.5, AX, 0, h => h.box(0.03, 0.06, 0.15, G.dark));
    b.at(0.0, AX + 0.105, 0, h => h.box(0.12, 0.03, 0.05, G.dark));
    b.at(0.02, -0.05, 0, h => h.box(0.12, 0.05, 0.08, G.dark));
    return b;
  }

  function buildBarrels(b) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2;
      cylX(b, 0.12, 0.84, 0.018, G.dark, 7, AX + S(a) * 0.048, C(a) * 0.048, { capBottom: false });
    }
    cylX(b, 0.12, 0.8, 0.014, G.mid, 6, AX, 0);
    [[0.38, 0.42, 0.076], [0.62, 0.655, 0.074], [0.78, 0.845, 0.072]].forEach(([x0, x1, r]) => cylX(b, x0, x1, r, G.mid, 16, AX, 0));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2;
      b.at(0.846, AX + S(a) * 0.048, C(a) * 0.048, h => {
        h.push(M4.rotZ(-PI / 2));
        h.disc(0.012, 8, 0x0c0c0c, 0.001);
        h.pop();
      });
    }
    return b;
  }

  function buildRound(b) {
    b.prism(14, 0.0165, 0.0165, -0.075, 0.0165, 0.0165, 0.02, 0x8a7a40, { capBottom: true, capTop: false });
    b.prism(14, 0.018, 0.018, -0.082, 0.018, 0.018, -0.075, 0x6e6232, { capBottom: true, capTop: false });
    b.prism(14, 0.0165, 0.0165, 0.02, 0.0125, 0.0125, 0.032, 0x8a7a40, { capTop: false });
    b.prism(14, 0.0125, 0.0125, 0.032, 0.004, 0.004, 0.08, 0x8a5a3a);
    return b;
  }

  function buildBox(b, front) {
    const w = 1.02, h = 0.44, d = 0.5;
    b.at(0, h / 2, 0, q => q.box(w, h, d, 0xffffff, { faces: { front: front ? null : 0xffffff, top: null } }));
    const flap = (x, z, rx, rz, sw, sd) => b.push(M4.translate(x, h, z), M4.rotX(rx), M4.rotZ(rz)).at(0, 0, 0, q => q.box(sw, 0.004, sd, 0xffffff)).pop();
    flap(0, d / 2 + 0.1, 0.25, 0, w, 0.2);
    flap(0, -d / 2 - 0.12, -0.5, 0, w, 0.24);
    return b;
  }

  function buildBoxFront(b) {
    const w = 1.02, h = 0.44, d = 0.5;
    b.quad([-w / 2, 0, d / 2 + 0.001], [w / 2, 0, d / 2 + 0.001], [w / 2, h, d / 2 + 0.001], [-w / 2, h, d / 2 + 0.001], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    return b;
  }

  function buildTable(b) {
    b.at(0, 0.76, 0, q => q.box(2.0, 0.06, 0.78, 0x5a4334));
    [[-0.92, -0.33], [0.92, -0.33], [-0.92, 0.33], [0.92, 0.33]].forEach(([x, z]) => b.at(x, 0.37, z, q => q.box(0.07, 0.74, 0.07, 0x45332a)));
    b.at(0, 0.2, 0, q => q.box(1.84, 0.05, 0.6, 0x45332a));
    return b;
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      gunBody: mk(buildBody),
      gunBarrels: mk(buildBarrels),
      round: mk(buildRound),
      box: mk(b => buildBox(b, true)),
      boxFront: mk(buildBoxFront),
      table: mk(buildTable)
    };
  }

  const GUN_MAT = { spec: [0.45, 22], rim: 0.7 };

  function gunGrips(M0) {
    const M = gunM(M0);
    return {
      top: M4.point(M, [-0.36, 0.27, 0]),
      topFront: M4.point(M, [0.07, 0.2, 0]),
      rear: M4.point(M, [-0.56, 0.08, 0.07]),
      rearR: M4.point(M, [-0.56, 0.08, -0.07]),
      barrel: M4.point(M, [0.35, AX, 0]),
      drum: M4.point(M, [-0.22, 0.0, 0]),
      muzzle: M4.point(M, [0.86, AX, 0]),
      axis: V3.norm(M4.dir(M, [1, 0, 0])),
      up: V3.norm(M4.dir(M, [0, 1, 0])),
      side: V3.norm(M4.dir(M, [0, 0, 1]))
    };
  }

  const SCALE = 1.3;

  function gunM(M) {
    return M4.mul(M, M4.scale(SCALE, SCALE, SCALE));
  }

  function drawGun(fx, P, M, spin, opts) {
    const o = Object.assign({}, GUN_MAT, opts || {});
    const G = gunM(M);
    fx.draw(P.gunBody, G, o);
    fx.draw(P.gunBarrels, M4.chain(G, M4.translate(0, AX, 0), M4.rotX(spin || 0), M4.translate(0, -AX, 0)), o);
  }

  window.MeetProps = { build, drawGun, gunGrips, gunM, GUN_MAT, AX, SCALE, BOTTOM: 0.206 * SCALE };
})();
