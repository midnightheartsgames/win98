(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, clamp } = K;
  const Art = window.EngArt;

  function plane(b, x0, z0, x1, z1, y, col, rep) {
    const u = rep || 1;
    b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col, [[0, 0], [u, 0], [u, u], [0, u]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
  }

  function buildSky(b) {
    const n = 36, rows = 10, R = 250;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < n; i++) {
        const pt = (ii, jj) => {
          const az = (ii / n - 0.5) * PI * 2, e = -0.25 + (jj / rows) * (PI / 2 + 0.25);
          return { p: [S(az) * C(e) * R, S(e) * R, -C(az) * C(e) * R], uv: [ii / n, clamp(0.5 + e / PI, 0, 1)] };
        };
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, rgb(0xffffff, 1), q.map(v => v.uv));
      }
    }
    return b;
  }

  function buildMesas(b) {
    const n = 48, R = 200;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const p = (a, y) => [S(a) * R, y, -C(a) * R];
      b.quad(p(a0, -6), p(a1, -6), p(a1, 34), p(a0, 34), rgb(0xffffff, 0.55), [[(i / n) * 4, 0], [((i + 1) / n) * 4, 0], [((i + 1) / n) * 4, 1], [(i / n) * 4, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
    return b;
  }

  function cliffEdge(z) {
    return 2.75 + 0.22 * S(z * 1.3) + 0.12 * S(z * 3.1) + Math.max(0, z + 0.5) * 0.55;
  }

  function cliffH(x, z) {
    const e = cliffEdge(z);
    const top = (3.0 + 0.6 * S(z * 0.6) + 0.3 * S(x * 0.9 + z)) * (1 - smoothK(-0.5, 3.5, z));
    const rise = smoothK(e - 0.15, e + 1.1, x);
    const bumps = 0.18 * S(x * 2.3 + z * 1.7) * S(z * 2.9 - x) * rise;
    return Math.max(0, top * rise + bumps);
  }

  function smoothK(e0, e1, x) {
    const k = clamp((x - e0) / (e1 - e0), 0, 1);
    return k * k * (3 - 2 * k);
  }

  function buildCliff(b) {
    const x0 = 2.2, x1 = 18, z0 = -12, z1 = 4;
    const nx = 46, nz = 40;
    const P = (i, j) => {
      const x = lerp(x0, x1, i / nx), z = lerp(z0, z1, j / nz);
      return [x, cliffH(x, z), z];
    };
    const g = rand(201);
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const a = P(i, j), c = P(i + 1, j), d = P(i + 1, j + 1), e = P(i, j + 1);
        if (a[1] + c[1] + d[1] + e[1] < 0.02) continue;
        const n = V3.norm(V3.cross(V3.sub(e, a), V3.sub(c, a)));
        const up = n[1] < 0 ? V3.mul(n, -1) : n;
        const uv = (p) => [(p[0] + p[2]) * 0.35, p[1] * 0.35 + p[0] * 0.08];
        const shade = 0.86 + g() * 0.14;
        const col = up[1] > 0.75 ? [0.46 * shade, 0.33 * shade, 0.29 * shade, 0] : [0.52 * shade, 0.33 * shade, 0.28 * shade, 0];
        b.quad(a, e, d, c, col, [uv(a), uv(e), uv(d), uv(c)], [up, up, up, up]);
      }
    }
    return b;
  }

  function buildRail(b, pts) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], c = pts[i + 1];
      const d = V3.sub(c, a);
      const len = V3.len(d);
      const yaw = Math.atan2(d[0], d[2]);
      const n = Math.max(1, Math.round(len / 2));
      for (let k = 0; k < n; k++) {
        const p = V3.lerp(a, c, k / n);
        b.push(M4.translate(p[0], 0, p[2]), M4.rotY(yaw));
        b.at(0, 0.38, 0, q => q.box(0.1, 0.76, 0.1, 0x5a4a3c));
        b.pop();
      }
      b.push(M4.translate((a[0] + c[0]) / 2, 0.62, (a[2] + c[2]) / 2), M4.rotY(yaw));
      b.box(0.04, 0.26, len, 0x9a9ea2);
      b.at(-0.025, 0, 0, q => q.box(0.02, 0.1, len, 0xb8bcc0));
      b.pop();
    }
    return b;
  }

  function pole(b, x, z, h, yaw) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    b.prism(7, 0.12, 0.12, 0, 0.1, 0.1, h, 0x3a2c24);
    b.at(0, h - 0.6, 0, q => q.box(1.8, 0.12, 0.12, 0x3a2c24));
    b.at(0, h - 1.1, 0, q => q.box(1.2, 0.1, 0.1, 0x3a2c24));
    [-0.8, -0.3, 0.3, 0.8].forEach(dx => b.at(dx, h - 0.5, 0, q => q.prism(6, 0.04, 0.04, 0, 0.03, 0.03, 0.12, 0x6a6c70)));
    b.pop();
  }

  function wires(b, poles) {
    for (let i = 0; i < poles.length - 1; i++) {
      const [x0, z0, h0, y0] = poles[i], [x1, z1, h1, y1] = poles[i + 1];
      [-0.8, -0.3, 0.3, 0.8].forEach(dx => {
        const c0 = C(y0 || 0), s0 = S(y0 || 0), c1 = C(y1 || 0), s1 = S(y1 || 0);
        const a = [x0 + dx * c0, h0 - 0.4, z0 - dx * s0], c = [x1 + dx * c1, h1 - 0.4, z1 - dx * s1];
        const pts = [];
        for (let k = 0; k <= 10; k++) {
          const f = k / 10;
          const p = V3.lerp(a, c, f);
          p[1] -= S(f * PI) * V3.len(V3.sub(c, a)) * 0.035;
          pts.push(p);
        }
        K.tube(b, pts, pts.map(() => 0.018), 4, 0x16141a);
      });
    }
  }

  const POLES = [[-11, 18, 7.5, 0.25], [-8.4, 7, 7.2, 0.3], [-6.2, -3.5, 7.4, 0.5], [-1.8, -12, 7, 0.9], [6.5, -18, 7.2, 1.1], [16, -22, 7, 1.2]];

  function buildPoles(b) {
    POLES.forEach(([x, z, h, yaw]) => pole(b, x, z, h, yaw));
    wires(b, POLES);
    return b;
  }

  function deadTree(b, x, z, h, g, col) {
    const branch = (p, dir, len, rad, depth) => {
      const q = V3.add(p, V3.mul(dir, len));
      K.tube(b, [p, q], [rad, rad * 0.7], 5, col);
      if (depth <= 0) return;
      const n = depth > 1 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const a = g() * PI * 2;
        const nd = V3.norm(V3.add(dir, [C(a) * 0.8, 0.4 + g() * 0.4, S(a) * 0.8]));
        branch(q, nd, len * (0.5 + g() * 0.25), rad * 0.6, depth - 1);
      }
    };
    branch([x, 0, z], [0, 1, 0], h * 0.5, 0.11, 3);
  }

  function spikes(b, x, y, z, n, len, g, col) {
    for (let i = 0; i < n; i++) {
      const a = g() * PI * 2, e = 0.15 + g() * 1.2;
      const dir = [C(a) * C(e), S(e), S(a) * C(e)];
      const tip = V3.add([x, y, z], V3.mul(dir, len * (0.6 + g() * 0.5)));
      K.tube(b, [[x, y, z], tip], [len * 0.05, 0.002], 3, col);
    }
  }

  function yucca(b, x, z, h, g, col) {
    const trunk = [[x, 0, z], [x + (g() - 0.5) * 0.3, h * 0.55, z + (g() - 0.5) * 0.3]];
    K.tube(b, trunk, [0.14, 0.1], 6, col);
    const top = trunk[1];
    const arms = 2 + Math.floor(g() * 3);
    for (let i = 0; i < arms; i++) {
      const a = g() * PI * 2;
      const mid = V3.add(top, [C(a) * h * 0.18, h * 0.12, S(a) * h * 0.18]);
      const end = V3.add(mid, [C(a) * h * 0.08, h * 0.2 + g() * h * 0.15, S(a) * h * 0.08]);
      K.tube(b, [top, mid, end], [0.09, 0.07, 0.05], 5, col);
      spikes(b, end[0], end[1], end[2], 16, h * 0.16, g, col);
    }
  }

  function agave(b, x, y, z, s, g, col) {
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * PI * 2 + g() * 0.3, e = 0.3 + g() * 0.9;
      const dir = [C(a) * C(e), S(e), S(a) * C(e)];
      const tip = V3.add([x, y, z], V3.mul(dir, s * (0.7 + g() * 0.4)));
      K.tube(b, [[x, y, z], V3.lerp([x, y, z], tip, 0.4), tip], [s * 0.08, s * 0.06, 0.004], 4, col);
    }
  }

  const TREES = [[5.6, -3.4, 5.2, 'dead'], [6.2, 0.6, 4.4, 'dead'], [4.6, -6.5, 4.6, 'yucca'], [8.5, -1.5, 4.8, 'yucca'], [-14, -8, 5.2, 'dead'],
    [-9, -16, 4.6, 'yucca'], [-3.5, 13, 3.8, 'yucca'], [-17, 24, 5.0, 'yucca'], [-6, 30, 4.4, 'dead'], [10, 24, 4.2, 'yucca'], [15, 12, 5.0, 'dead'],
    [-24, 2, 4.8, 'yucca'], [12, -9, 4.6, 'yucca'], [1.5, -11.5, 3.6, 'dead'], [-2.9, 30.5, 4.6, 'yucca'], [4.6, 31.5, 3.8, 'dead'], [-7.5, 26, 4.2, 'yucca']];

  function buildTrees(b) {
    const g = rand(211);
    TREES.forEach(([x, z, h, kind]) => {
      b.push(M4.translate(0, cliffH(x, z) - 0.05, 0));
      if (kind === 'dead') deadTree(b, x, z, h, g, 0x2a1c1a);
      else yucca(b, x, z, h, g, 0x241a1c);
      b.pop();
    });
    for (let i = 0; i < 16; i++) {
      const x = 4.2 + g() * 8, z = -8 + g() * 9;
      agave(b, x, cliffH(x, z), z, 0.6 + g() * 0.5, g, 0x2c3226);
    }
    for (let i = 0; i < 18; i++) {
      const x = -14 + g() * 28, z = 4 + g() * 30;
      if (Math.abs(x) < 4 && z < 10) continue;
      agave(b, x, 0, z, 0.35 + g() * 0.3, g, 0x34382a);
    }
    for (let i = 0; i < 14; i++) {
      const x = -8 + g() * 7, z = -6 + g() * 3;
      spikes(b, x, 0, z, 10, 0.5 + g() * 0.6, g, 0x3a2c22);
    }
    return b;
  }

  function buildTower(b) {
    b.push(M4.translate(-16, 0, 9));
    [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(([x, z]) => K.tube(b, [[x * 1.15, 0, z * 1.15], [x * 0.85, 7.5, z * 0.85]], [0.14, 0.12], 5, 0x2e221e));
    for (let i = 0; i < 3; i++) {
      const y = 1.8 + i * 2.1;
      [[[-1.6, -1.6], [1.6, -1.6]], [[1.6, -1.6], [1.6, 1.6]], [[1.6, 1.6], [-1.6, 1.6]], [[-1.6, 1.6], [-1.6, -1.6]]].forEach(([p, q]) => {
        K.tube(b, [[p[0], y, p[1]], [q[0], y + 1.6, q[1]]], [0.06, 0.06], 4, 0x2e221e);
        K.tube(b, [[q[0], y, q[1]], [p[0], y + 1.6, p[1]]], [0.06, 0.06], 4, 0x2e221e);
      });
    }
    b.at(0, 7.5, 0, q => q.prism(14, 2.3, 2.3, 0, 2.3, 2.3, 3.2, 0x3a2a24, { capBottom: true }));
    b.at(0, 10.7, 0, q => q.prism(14, 2.5, 2.5, 0, 0.3, 0.3, 1.1, 0x2a201c));
    b.pop();
    return b;
  }

  function buildRocks(b) {
    const g = rand(221);
    for (let i = 0; i < 70; i++) {
      const a = g() * PI * 2, r = 2.5 + g() * 14;
      const x = S(a) * r, z = C(a) * r * 0.8 + 3;
      if (cliffH(x, z) > 0.05) continue;
      const s = 0.06 + g() * g() * 0.4;
      b.push(M4.translate(x, s * 0.25, z), M4.rotY(g() * PI));
      b.ellipsoid(s * (1 + g()), s * 0.6, s, 7, 4, g() < 0.5 ? 0x6a4030 : 0x84523c, { flat: true });
      b.pop();
    }
    return b;
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      sky: mk(buildSky),
      mesas: mk(buildMesas),
      ground: mk(b => plane(b, -120, -120, 120, 120, 0, 0xffffff, 80)),
      cliff: mk(buildCliff),
      railL: mk(b => buildRail(b, [[-10.5, 0, 22], [-8.2, 0, 10], [-6.4, 0, 0], [-4.2, 0, -6], [0, 0, -10]])),
      railR: mk(b => buildRail(b, [[2.6, 0, -0.8], [6, 0, -2.4], [12, 0, -4.2], [20, 0, -5]])),
      poles: mk(buildPoles),
      trees: mk(buildTrees),
      tower: mk(buildTower),
      rocks: mk(buildRocks),
      tex: {}
    };
  }

  const WALL_MAT = { spec: [0.03, 4], rim: 0.2 };

  function draw(fx, W, groups) {
    const T = (k) => Art.tex(fx.r, W.tex, k);
    const has = (k) => groups.includes(k);
    if (has('sky')) {
      fx.draw(W.sky, M4.translate(fx.cam.eye[0], 0, fx.cam.eye[2]), { texture: T('sky'), noFog: true, rim: 0, spec: [0, 1] });
      fx.draw(W.mesas, M4.translate(fx.cam.eye[0], 0, fx.cam.eye[2]), { texture: T('mesas'), rim: 0, spec: [0, 1], tint: [0.5, 0.42, 0.55] });
    }
    if (has('ground')) fx.draw(W.ground, null, Object.assign({ texture: T('dirt') }, WALL_MAT));
    if (has('cliff')) fx.draw(W.cliff, null, Object.assign({ texture: T('cliff') }, WALL_MAT));
    if (has('railL')) fx.draw(W.railL, null, { spec: [0.4, 20], rim: 0.4 });
    if (has('railR')) fx.draw(W.railR, null, { spec: [0.4, 20], rim: 0.4 });
    if (has('poles')) fx.draw(W.poles, null, WALL_MAT);
    if (has('trees')) fx.draw(W.trees, null, WALL_MAT);
    if (has('tower')) fx.draw(W.tower, null, WALL_MAT);
    if (has('rocks')) fx.draw(W.rocks, null, WALL_MAT);
  }

  window.EngSets = { build, draw, cliffH, POLES, TREES };
})();
