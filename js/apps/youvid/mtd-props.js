(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C } = K;

  const G = {
    gun: 0x2c2c2e, gunMid: 0x45464a, gunHi: 0x5c5e62, wood: 0x5a3a24, sticky: 0x7c7f68, stickyDk: 0x5a5c4a, stickyHi: 0x9a9c84,
    pipe: 0x3a2c28, pipeCap: 0xd23a2e, bomb: 0xc8382c, bombDk: 0x8a2420, band: 0x1c1a18, glass: 0x6c5a2c, glassDk: 0x3c3018,
    bench: 0x5a4434, benchDk: 0x3c2c22, paper: 0xd8d4c0, red: 0xb8352a, wire: 0x8a2a22, wire2: 0x2a4a6a, metal: 0x6a6c6a, tnt: 0xb83a2e
  };

  function cyl(b, from, to, r, col, sides, opts) {
    const d = V3.sub(to, from);
    const len = V3.len(d);
    const dir = V3.mul(d, 1 / len);
    let x = V3.cross([0, 1, 0], dir);
    if (V3.len(x) < 1e-3) x = [1, 0, 0];
    x = V3.norm(x);
    const z = V3.cross(x, dir);
    const M = new Float32Array([x[0], x[1], x[2], 0, dir[0], dir[1], dir[2], 0, z[0], z[1], z[2], 0, from[0], from[1], from[2], 1]);
    b.push(M);
    const r1 = Array.isArray(r) ? r[1] : r, r0 = Array.isArray(r) ? r[0] : r;
    b.prism(sides || 12, r0, r0, 0, r1, r1, len, col, Object.assign({ capTop: true, capBottom: true }, opts || {}));
    b.pop();
  }

  function buildLauncher(b) {
    const ax = (z0, z1, y, r, col, sides) => cyl(b, [0, y, z0], [0, y, z1], r, col, sides);
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * PI * 2, a1 = ((i + 1) / 12) * PI * 2;
      const R = i % 2 ? 0.074 : 0.068;
      const p = (a, z) => [S(a) * R, 0.035 + C(a) * R, z];
      const n = [S((a0 + a1) / 2), C((a0 + a1) / 2), 0];
      b.quad(p(a0, -0.01), p(a1, -0.01), p(a1, 0.13), p(a0, 0.13), rgb(i % 2 ? G.gunMid : G.gun), null, [n, n, n, n]);
    }
    b.at(0, 0.035, -0.012, h => K.discXY(h, 0, 0, 0, 0.074, 14, rgb(G.gunMid)));
    b.at(0, 0.035, 0.132, h => K.discXY(h, 0, 0, 0, 0.074, 14, rgb(G.gunHi)));
    ax(0.12, 0.5, 0.05, 0.036, G.gun, 14);
    ax(0.47, 0.52, 0.05, 0.043, G.gunMid, 14);
    b.at(0, 0.05, 0.521, h => K.discXY(h, 0, 0, 0, 0.026, 12, rgb(0x080808, 0.6)));
    b.at(0, 0.1, 0.46, h => h.box(0.012, 0.03, 0.03, G.gunMid));
    b.at(0, 0.112, 0.04, h => h.box(0.042, 0.018, 0.34, G.gunMid));
    b.at(0, 0.04, -0.13, h => h.box(0.05, 0.085, 0.22, G.gun));
    b.push(M4.translate(0, -0.03, -0.07), M4.rotX(0.28));
    b.at(0, -0.06, 0, h => h.box(0.038, 0.13, 0.05, G.wood));
    b.pop();
    b.push(M4.translate(0, -0.01, 0.27), M4.rotX(-0.1));
    b.at(0, -0.06, 0, h => h.box(0.034, 0.11, 0.045, G.wood));
    b.pop();
    b.at(0, -0.02, -0.01, h => h.box(0.012, 0.05, 0.06, G.gunMid));
    b.push(M4.translate(0, 0.02, -0.24), M4.rotX(0.18));
    b.box(0.04, 0.05, 0.14, G.gun);
    b.at(0, -0.02, -0.08, h => h.box(0.045, 0.12, 0.03, G.gunMid));
    b.pop();
    return b;
  }

  function buildSticky(b) {
    cyl(b, [0, 0.05, -0.18], [0, 0.05, 0.36], 0.05, G.sticky, 16);
    cyl(b, [0, 0.05, 0.33], [0, 0.05, 0.42], [0.055, 0.064], G.stickyDk, 16, { capTop: false });
    b.at(0, 0.05, 0.36, h => K.discXY(h, 0, 0, 0, 0.044, 14, rgb(0x0c0c0a, 0.6)));
    cyl(b, [0, 0.05, -0.2], [0, 0.05, -0.17], 0.056, G.stickyHi, 16);
    cyl(b, [0, 0.05, 0.08], [0, 0.05, 0.11], 0.054, G.stickyHi, 16);
    b.at(0, 0.11, 0.1, h => h.box(0.02, 0.03, 0.16, G.stickyDk));
    b.at(0, 0.125, 0.0, h => h.box(0.012, 0.025, 0.012, G.stickyDk));
    b.push(M4.translate(0, 0.0, -0.02), M4.rotX(0.25));
    b.at(0, -0.07, 0, h => h.box(0.036, 0.12, 0.048, G.stickyDk));
    b.pop();
    b.push(M4.translate(0, 0.0, 0.22), M4.rotX(-0.15));
    b.at(0, -0.055, 0, h => h.box(0.03, 0.09, 0.04, G.stickyDk));
    b.pop();
    b.at(0, 0.0, -0.05, h => h.box(0.012, 0.04, 0.05, G.metal));
    return b;
  }

  function buildPipe(b) {
    cyl(b, [0, -0.05, 0], [0, 0.05, 0], 0.03, G.pipe, 12);
    cyl(b, [0, 0.05, 0], [0, 0.068, 0], [0.032, 0.024], G.pipeCap, 12);
    cyl(b, [0, -0.068, 0], [0, -0.05, 0], [0.024, 0.032], G.pipeCap, 12);
    cyl(b, [0, -0.01, 0], [0, 0.01, 0], 0.032, G.band, 12);
    return b;
  }

  function buildBomb(b) {
    b.ellipsoid(0.048, 0.048, 0.048, 14, 10, G.bomb);
    cyl(b, [0, -0.006, -0.0], [0, 0.006, 0], 0.05, G.band, 16);
    const g = rand(701);
    for (let i = 0; i < 14; i++) {
      const u = g() * 2 - 1, th = g() * PI * 2;
      const r = Math.sqrt(1 - u * u);
      const n = [r * C(th), u, r * S(th)];
      cyl(b, V3.mul(n, 0.04), V3.mul(n, 0.068), [0.011, 0.002], G.bombDk, 6, { capTop: false });
    }
    return b;
  }

  function buildBottle(b) {
    const rings = [[0, 0.046], [0.008, 0.05], [0.15, 0.05], [0.175, 0.042], [0.195, 0.024], [0.21, 0.017], [0.29, 0.016], [0.295, 0.019], [0.31, 0.018]];
    const sides = 16;
    for (let j = 0; j < rings.length - 1; j++) {
      const [y0, r0] = rings[j], [y1, r1] = rings[j + 1];
      for (let i = 0; i < sides; i++) {
        const a0 = (i / sides) * PI * 2, a1 = ((i + 1) / sides) * PI * 2;
        const p = (a, y, r) => [S(a) * r, y, C(a) * r];
        const sl = (r0 - r1) / Math.max(1e-4, y1 - y0);
        const n = (a) => V3.norm([S(a), sl, C(a)]);
        b.quad(p(a0, y0, r0), p(a1, y0, r1 === r0 ? r0 : r0), p(a1, y1, r1), p(a0, y1, r1), rgb(j >= 6 ? G.glassDk : G.glass), null, [n(a0), n(a1), n(a1), n(a0)]);
      }
    }
    b.at(0, 0, 0, h => K.discXY(h, 0, 0, 0, 0.046, 14, rgb(G.glassDk)));
    b.at(0, 0.312, 0, h => h.prism(10, 0.013, 0.013, 0, 0.013, 0.013, 0.012, 0x4a3a24));
    return b;
  }

  function buildBottleLabel(b) {
    const sides = 16;
    for (let i = 0; i < sides; i++) {
      const a0 = -1.3 + (i / sides) * 2.6, a1 = -1.3 + ((i + 1) / sides) * 2.6;
      const p = (a, y) => [S(a) * 0.0515, y, C(a) * 0.0515];
      const n0 = [S(a0), 0, C(a0)], n1 = [S(a1), 0, C(a1)];
      b.quad(p(a0, 0.05), p(a1, 0.05), p(a1, 0.13), p(a0, 0.13), 0xffffff, [[1 - i / sides, 0], [1 - (i + 1) / sides, 0], [1 - (i + 1) / sides, 1], [1 - i / sides, 1]], [n0, n1, n1, n0]);
    }
    return b;
  }

  function texBox(b, w, h, d, col, uvs) {
    const x = w / 2, y = h / 2, z = d / 2;
    const U = uvs || [1, 1];
    const uv = [[0, 0], [U[0], 0], [U[0], U[1]], [0, U[1]]];
    b.quad([-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z], col, uv, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    b.quad([x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z], col, uv, [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
    b.quad([x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z], col, uv, [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
    b.quad([-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z], col, uv, [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]]);
    b.quad([-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z], col, uv, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    b.quad([-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z], col, uv, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
  }

  const CRATE = { w: 0.62, h: 0.38, d: 0.42 };

  function buildCrateBody(b) {
    b.at(0, CRATE.h / 2, 0, h => texBox(h, CRATE.w, CRATE.h, CRATE.d, 0xffffff));
    return b;
  }

  function buildCrateFront(b) {
    const z = CRATE.d / 2 + 0.002, n = [0, 0, 1];
    b.quad([-CRATE.w / 2, 0, z], [CRATE.w / 2, 0, z], [CRATE.w / 2, CRATE.h, z], [-CRATE.w / 2, CRATE.h, z], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    return b;
  }

  function buildCrateLid(b) {
    b.at(0.02, CRATE.h + 0.012, 0.01, h => { h.push(M4.rotY(0.05)); h.box(CRATE.w + 0.03, 0.024, CRATE.d + 0.03, G.bench); h.pop(); });
    [-1, 1].forEach(s => b.at(s * (CRATE.w / 2 - 0.02), CRATE.h / 2, CRATE.d / 2 + 0.008, h => h.box(0.03, CRATE.h, 0.012, G.benchDk)));
    return b;
  }

  const BENCH = { w: 2.2, d: 0.8, top: 0.84 };

  function buildBench(b) {
    b.at(0, BENCH.top - 0.03, 0, h => h.box(BENCH.w, 0.06, BENCH.d, G.bench, { faces: { top: 0x6a5240 } }));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => b.at(sx * (BENCH.w / 2 - 0.08), (BENCH.top - 0.06) / 2, sz * (BENCH.d / 2 - 0.08), h => h.box(0.08, BENCH.top - 0.06, 0.08, G.benchDk)));
    b.at(0, 0.18, 0, h => h.box(BENCH.w - 0.2, 0.04, BENCH.d - 0.2, G.benchDk));
    return b;
  }

  function buildBenchPaper(b) {
    const y = BENCH.top + 0.002, n = [0, 1, 0];
    [[-0.1, 0.05, 0.9, 0.55, 0.05], [0.45, -0.05, 0.5, 0.4, -0.2], [-0.62, 0.1, 0.45, 0.35, 0.3]].forEach(([x, z, w, d, rot], i) => {
      b.push(M4.translate(x, y + i * 0.001, z), M4.rotY(rot));
      b.quad([-w / 2, 0, d / 2], [w / 2, 0, d / 2], [w / 2, 0, -d / 2], [-w / 2, 0, -d / 2], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
      b.pop();
    });
    return b;
  }

  function buildBenchClutter(b) {
    const y = BENCH.top;
    const g = rand(703);
    [[-0.95, 0.25], [0.95, 0.3], [-0.7, 0.32], [0.62, 0.3]].forEach(([x, z], i) => {
      cyl(b, [x, y, z], [x, y + 0.14, z], 0.032, G.pipe, 12);
      cyl(b, [x, y + 0.14, z], [x, y + 0.17, z], [0.034, 0.026], G.pipeCap, 12);
      if (i % 2) b.at(x, y + 0.175, z, h => h.ellipsoid(0.026, 0.02, 0.026, 10, 6, G.pipeCap));
    });
    for (let i = 0; i < 3; i++) {
      const x = -0.3 + i * 0.38, z = 0.28 + g() * 0.08;
      b.push(M4.translate(x, y + 0.022, z), M4.rotY(g() * PI), M4.rotZ(PI / 2));
      b.prism(12, 0.022, 0.022, -0.05, 0.022, 0.022, 0.05, i === 1 ? G.tnt : G.pipe, { capTop: true, capBottom: true });
      b.pop();
    }
    const coil = [];
    for (let i = 0; i <= 40; i++) {
      const f = i / 40;
      coil.push([0.25 + S(f * PI * 8) * 0.05 + f * 0.3, y + 0.012 + Math.abs(C(f * PI * 8)) * 0.012, 0.15 + C(f * PI * 8) * 0.05]);
    }
    K.tube(b, coil, coil.map(() => 0.005), 5, G.wire);
    const coil2 = [];
    for (let i = 0; i <= 30; i++) {
      const f = i / 30;
      coil2.push([-0.55 + f * 0.5, y + 0.008 + S(f * PI * 3) * 0.006, 0.0 + S(f * PI * 2) * 0.12]);
    }
    K.tube(b, coil2, coil2.map(() => 0.004), 5, G.wire2);
    b.push(M4.translate(0.1, y + 0.01, 0.3), M4.rotY(0.6));
    b.prism(8, 0.006, 0.006, -0.09, 0.006, 0.006, 0.09, 0xc8a040, { capTop: true, capBottom: true });
    b.pop();
    b.at(-0.35, y + 0.03, -0.25, h => { h.push(M4.rotY(0.3)); h.box(0.14, 0.06, 0.1, G.metal); h.at(0, 0.04, 0.0, q => q.box(0.1, 0.02, 0.06, G.gun)); h.pop(); });
    b.at(0.85, y + 0.04, -0.2, h => { h.box(0.16, 0.08, 0.12, G.red); h.at(0, 0.05, 0, q => q.box(0.12, 0.02, 0.08, G.benchDk)); });
    return b;
  }

  function buildPlunger(b) {
    b.at(0, 0.11, 0, h => h.box(0.28, 0.22, 0.2, G.bench, { faces: { front: G.tnt } }));
    cyl(b, [0, 0.22, 0], [0, 0.42, 0], 0.012, G.metal, 8);
    cyl(b, [-0.12, 0.42, 0], [0.12, 0.42, 0], 0.018, G.wood, 10);
    return b;
  }

  function buildTimer(b) {
    b.box(0.09, 0.09, 0.04, G.metal);
    b.at(0, 0, 0.021, h => K.discXY(h, 0, 0, 0, 0.034, 16, rgb(0xe8e0cc)));
    b.at(0, 0.008, 0.023, h => h.box(0.004, 0.026, 0.002, 0x1a1a1a));
    b.at(0.008, 0, 0.023, h => h.box(0.02, 0.004, 0.002, 0x1a1a1a));
    return b;
  }

  function buildGib(b, kind) {
    if (kind === 'cloth') {
      b.box(0.16, 0.12, 0.08, 0x557d9f);
      b.at(0, -0.07, 0, h => h.ellipsoid(0.07, 0.04, 0.05, 8, 5, 0x9a2a22));
    } else if (kind === 'boot') {
      b.box(0.1, 0.12, 0.22, 0x2a2420);
      b.at(0, 0.09, -0.04, h => h.ellipsoid(0.06, 0.05, 0.06, 8, 5, 0x3c5c7b));
    } else if (kind === 'meat') {
      b.ellipsoid(0.07, 0.05, 0.06, 8, 6, 0xa82a22);
      b.at(0.03, 0.02, 0.0, h => h.ellipsoid(0.04, 0.03, 0.04, 6, 4, 0x6a1a16));
    } else {
      b.box(0.3, 0.04, 0.08, 0x5a4434);
    }
    return b;
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      launcher: mk(buildLauncher),
      sticky: mk(buildSticky),
      pipe: mk(buildPipe),
      bomb: mk(buildBomb),
      bottle: mk(buildBottle),
      label: mk(buildBottleLabel),
      crate: mk(buildCrateBody),
      crateFront: mk(buildCrateFront),
      crateLid: mk(buildCrateLid),
      bench: mk(buildBench),
      paper: mk(buildBenchPaper),
      clutter: mk(buildBenchClutter),
      plunger: mk(buildPlunger),
      timer: mk(buildTimer),
      gibs: ['cloth', 'boot', 'meat', 'plank'].map(k => mk(b => buildGib(b, k)))
    };
  }

  const METAL = { spec: [0.4, 20], rim: 0.6 };
  const GLASS = { spec: [0.85, 50], rim: 0.9 };
  const WOOD = { spec: [0.05, 5], rim: 0.35 };

  function drawLauncher(fx, P, M) {
    fx.draw(P.launcher, M, METAL);
  }

  function drawSticky(fx, P, M) {
    fx.draw(P.sticky, M, { spec: [0.3, 14], rim: 0.55 });
  }

  const BOTTLE_SCALE = 1.22;

  function drawBottle(fx, P, M, T, empty) {
    const B = M4.mul(M, M4.scale(BOTTLE_SCALE, BOTTLE_SCALE, BOTTLE_SCALE));
    fx.draw(P.bottle, B, Object.assign({}, GLASS, empty ? { tint: [0.85, 0.85, 0.85] } : {}));
    fx.draw(P.label, B, { texture: T('label'), spec: [0.1, 8], rim: 0.4 });
  }

  function drawCrate(fx, P, M, T, lid) {
    fx.draw(P.crate, M, Object.assign({ texture: T('crateWood') }, WOOD));
    fx.draw(P.crateFront, M, Object.assign({ texture: T('crateLabel') }, WOOD));
    if (lid) fx.draw(P.crateLid, M, WOOD);
  }

  function drawBench(fx, P, M, T) {
    fx.draw(P.bench, M, Object.assign({ texture: T('darkWood') }, WOOD));
    fx.draw(P.paper, M, { texture: T('blueprint'), spec: [0.03, 4], rim: 0.2 });
    fx.draw(P.clutter, M, { spec: [0.3, 14], rim: 0.5 });
  }

  function launcherMuzzle(M) {
    return { p: M4.point(M, [0, 0.05, 0.53]), dir: V3.norm(M4.dir(M, [0, 0, 1])) };
  }

  function stickyMuzzle(M) {
    return { p: M4.point(M, [0, 0.05, 0.43]), dir: V3.norm(M4.dir(M, [0, 0, 1])) };
  }

  window.DemoProps = { build, drawLauncher, drawSticky, drawBottle, drawCrate, drawBench, launcherMuzzle, stickyMuzzle, BENCH, CRATE, METAL, GLASS, WOOD, G, BOTTLE_SCALE };
})();
