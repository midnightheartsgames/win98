(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, mesh } = K;
  const Art = window.KalamArt;
  const T = Art.TEX;

  const N = [0, 0, 1];
  const FLAT = 1;

  function plane(b, x0, y0, x1, y1, z, col, uv) {
    const u = uv || [1, 1];
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, [[0, 0], [u[0], 0], [u[0], u[1]], [0, u[1]]], [N, N, N, N]);
  }

  function floorQuad(b, x0, z0, x1, z1, y, col, uv) {
    const u = uv || [1, 1];
    const n = [0, 1, 0];
    b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col, [[0, 0], [u[0], 0], [u[0], u[1]], [0, u[1]]], [n, n, n, n]);
  }

  function frameBox(b, cx, cy, z, w, h, t, col) {
    b.at(cx, cy + h / 2 + t / 2, z, q => q.box(w + 2 * t, t, 0.04, col));
    b.at(cx, cy - h / 2 - t / 2, z, q => q.box(w + 2 * t, t, 0.04, col));
    b.at(cx - w / 2 - t / 2, cy, z, q => q.box(t, h, 0.04, col));
    b.at(cx + w / 2 + t / 2, cy, z, q => q.box(t, h, 0.04, col));
  }

  const OFFICE = {
    wallZ: -1.6,
    deskY: 0.76,
    deskZ: [-0.95, 0.28],
    blinds: [-0.83, 0.82, 0.81, 2.7],
    picture: [-1.23, 1.73, 0.67, 0.5],
    wallTv: [1.06, 1.85, 0.48, 0.37],
    monitor: [0.66, -0.42],
    plate: [0.1, -0.2]
  };

  function buildOffice(r) {
    const O = OFFICE;
    const z = O.wallZ;
    const [bx0, by0, bx1, by1] = O.blinds;
    const W = {};
    W.wallTex = r.texture(256, T.wall);
    W.wall = mesh(r, b => {
      plane(b, -4, 0, bx0, 3.2, z, 0xffffff, [2, 2]);
      plane(b, bx1, 0, 4, 3.2, z, 0xffffff, [2, 2]);
      plane(b, bx0, 0, bx1, by0, z, 0xffffff, [1, 0.5]);
      plane(b, bx0, by1, bx1, 3.2, z, 0xffffff, [1, 0.3]);
      b.push(M4.translate(-3.2, 0, 0), M4.rotY(PI / 2));
      plane(b, -3, 0, 2, 3.2, 0, 0xffffff, [2, 2]);
      b.pop();
    });
    W.blindsTex = r.texture(128, T.blinds);
    W.blinds = mesh(r, b => plane(b, bx0, by0, bx1, by1, z + 0.03, 0xffffff, [3, 2.6]));
    W.trim = mesh(r, b => {
      frameBox(b, (bx0 + bx1) / 2, (by0 + by1) / 2, z + 0.02, bx1 - bx0, by1 - by0, 0.05, 0xece2da);
      b.at((bx0 + bx1) / 2, by1 + 0.02, z + 0.07, q => q.box(bx1 - bx0 + 0.1, 0.06, 0.08, 0xf4ece6));
      [bx0 + 0.25, bx1 - 0.2].forEach(x => K.tube(b, [[x, by1, z + 0.08], [x, by1 - 0.9, z + 0.08]], [0.004, 0.004], 4, 0xf0e8e0));
      b.at(bx1 - 0.2, by1 - 0.95, z + 0.08, q => q.ellipsoid(0.012, 0.03, 0.012, 6, 4, 0xf0e8e0));
      b.at(0, 0.05, z + 0.01, q => q.box(8, 0.1, 0.03, 0x4a3a32));
    });
    const [px, py, pw, ph] = O.picture;
    W.paintTex = r.texture(256, T.painting, { height: 192, clamp: true });
    W.paint = mesh(r, b => plane(b, px - pw / 2, py - ph / 2, px + pw / 2, py + ph / 2, z + 0.04, [1, 1, 1, 0.7]));
    W.paintFrame = mesh(r, b => frameBox(b, px, py, z + 0.03, pw, ph, 0.035, 0x1a1a1c));
    const [tx, ty, tw, th] = O.wallTv;
    W.tvTex = r.texture(128, T.tvGreen, { height: 96, clamp: true });
    W.tv = mesh(r, b => plane(b, tx - tw / 2, ty - th / 2, tx + tw / 2, ty + th / 2, z + 0.06, [1, 1, 1, 0.6]));
    W.tvFrame = mesh(r, b => {
      frameBox(b, tx, ty, z + 0.05, tw, th, 0.04, 0xd8d4d0);
      b.at(tx, ty - th / 2 - 0.08, z + 0.05, q => q.box(tw + 0.08, 0.08, 0.06, 0xc8c4c0));
    });
    W.floor = mesh(r, b => floorQuad(b, -4, -1.6, 4, 3, 0, 0x4a3e3a));
    const [d0, d1] = O.deskZ;
    const dy = O.deskY;
    W.desk = mesh(r, b => {
      b.at(0, dy - 0.02, (d0 + d1) / 2, q => q.box(3.3, 0.04, d1 - d0, 0x2a2420));
      b.at(0, dy / 2 - 0.02, d1 - 0.03, q => q.box(3.3, dy - 0.04, 0.03, 0x3a302a));
      b.at(0, dy - 0.06, d1 - 0.01, q => q.box(3.3, 0.05, 0.03, 0x1e1a16));
    });
    W.chair = mesh(r, b => {
      b.at(0, 0.48, 0, q => q.box(0.5, 0.06, 0.48, 0x1e1e22));
      b.at(0, 0.95, -0.24, q => q.box(0.5, 0.75, 0.06, 0x1e1e22));
      b.at(0, 0.24, 0, q => q.prism(8, 0.03, 0.03, -0.24, 0.03, 0.03, 0.24, 0x3a3a3a));
    });
    W.crtTex = r.texture(128, T.crt, { height: 96, clamp: true });
    const [mx, mz] = O.monitor;
    W.pc = mesh(r, b => {
      b.at(mx, dy + 0.11, mz, q => q.box(0.5, 0.22, 0.44, 0xd8d0be));
      b.at(mx - 0.12, dy + 0.13, mz + 0.222, q => q.box(0.16, 0.025, 0.004, 0x2a2a2a));
      b.at(mx + 0.15, dy + 0.15, mz + 0.222, q => q.box(0.03, 0.03, 0.004, 0x3a8a3a));
      b.at(mx, dy + 0.44, mz - 0.02, q => q.box(0.44, 0.42, 0.4, 0xd6cebc));
      b.at(mx, dy + 0.44, mz - 0.27, q => q.box(0.32, 0.3, 0.14, 0xc8c0ae));
      b.at(mx, dy + 0.45, mz + 0.182, q => q.box(0.38, 0.32, 0.01, 0x2a2a2c));
      b.at(mx - 0.25, dy + 0.012, mz + 0.5, q => q.box(0.46, 0.025, 0.17, 0xcfc7b4));
    });
    W.screen = mesh(r, b => plane(b, mx - 0.17, dy + 0.31, mx + 0.17, dy + 0.585, mz + 0.19, [1, 1, 1, 1]));
    W.typewriter = mesh(r, b => {
      b.at(-0.78, dy + 0.08, -0.3, q => q.box(0.46, 0.14, 0.36, 0x9a9890));
      b.at(-0.78, dy + 0.19, -0.41, q => q.prism(10, 0.04, 0.04, -0.27, 0.04, 0.04, 0.27, 0x2a2a2a, { capBottom: true }));
      b.push(M4.translate(-0.78, dy + 0.19, -0.41), M4.rotZ(PI / 2));
      b.prism(10, 0.045, 0.045, -0.26, 0.045, 0.045, 0.26, 0x3a3a3a, { capBottom: true });
      b.pop();
      for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) b.at(-0.96 + i * 0.045 + row * 0.01, dy + 0.16 + row * 0.015, -0.18 - row * 0.04, q => q.prism(6, 0.012, 0.012, 0, 0.012, 0.012, 0.01, 0xe8e4dc));
      b.at(-0.78, dy + 0.27, -0.45, q => q.box(0.3, 0.16, 0.004, 0xf4f2ee));
    });
    W.paperTex = r.texture(128, T.newspaper);
    W.papers = mesh(r, b => {
      b.push(M4.translate(-0.35, dy + 0.003, -0.4), M4.rotY(0.12));
      floorQuad(b, -0.3, -0.22, 0.3, 0.22, 0, [1, 1, 1, 0.5]);
      b.pop();
      b.push(M4.translate(-0.75, dy + 0.006, -0.25), M4.rotY(-0.3));
      floorQuad(b, -0.22, -0.16, 0.22, 0.16, 0, [1, 1, 1, 0.5]);
      b.pop();
    });
    W.pizzaTex = r.texture(64, T.pizza);
    const [plx, plz] = O.plate;
    W.plate = mesh(r, b => {
      b.at(plx, dy + 0.005, plz, q => q.prism(18, 0.12, 0.12, 0, 0.105, 0.105, 0.016, 0xf4f2ee));
    });
    W.pizza = mesh(r, b => {
      for (let i = 0; i < 3; i++) {
        b.push(M4.translate(plx + (i - 1) * 0.06, dy + 0.026, plz + (i % 2) * 0.03), M4.rotY(0.5 + i * 0.9));
        b.tri([0, 0, 0], [0.11, 0, -0.04], [0.11, 0, 0.04], [1, 1, 1, 0.3], [[0.5, 0.5], [1, 0], [1, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
        b.at(0.11, 0.004, 0, q => q.box(0.02, 0.012, 0.085, 0xd8a050));
        b.pop();
      }
    });
    W.props = mesh(r, b => {
      b.at(0.62, dy + 0.06, -0.28, q => q.prism(8, 0.035, 0.035, -0.06, 0.035, 0.035, 0.06, 0xe8e4dc));
      for (let i = 0; i < 6; i++) b.at(0.6 + (i % 3) * 0.015, dy + 0.15, -0.28 + (i % 2) * 0.012, q => q.box(0.004, 0.08, 0.004, 0xd8b880));
      b.at(0.05, dy + 0.004, -0.2, q => q.box(0.16, 0.006, 0.12, 0xe8c840));
      b.at(-0.15, dy + 0.02, -0.62, q => q.prism(8, 0.05, 0.05, -0.02, 0.05, 0.05, 0.02, 0x1a1a1a));
      K.tube(b, [[-0.15, dy + 0.04, -0.62], [-0.13, dy + 0.18, -0.6], [-0.07, dy + 0.24, -0.52]], [0.008, 0.008, 0.008], 4, 0x1a1a1a);
      b.at(-0.07, dy + 0.25, -0.5, q => q.ellipsoid(0.025, 0.03, 0.025, 6, 4, 0x2a2a2a));
      b.at(0.85, dy + 0.05, -0.15, q => q.box(0.14, 0.1, 0.08, 0xe8e6e8));
      b.at(0.85, dy + 0.06, -0.11, q => q.box(0.08, 0.05, 0.004, 0x6a5ac0));
      b.at(-1.25, dy + 0.09, 0.05, q => q.box(0.3, 0.18, 0.22, 0x5a4a3a));
      for (let i = 0; i < 6; i++) b.at(-1.36 + i * 0.045, dy + 0.2, 0.05, q => q.box(0.035, 0.1, 0.19, i % 2 ? 0x1c1c1e : 0x2a2a30));
    });
    W.plant = mesh(r, b => {
      b.at(-2.05, 0.2, -1.25, q => q.prism(10, 0.16, 0.16, -0.2, 0.2, 0.2, 0.2, 0x8a5a3a, { capBottom: true }));
      for (let i = 0; i < 26; i++) {
        const a = i * 2.4, rr = 0.1 + (i % 5) * 0.06, y = 0.5 + (i % 7) * 0.13;
        b.push(M4.translate(-2.05 + S(a) * rr, y, -1.25 + C(a) * rr), M4.rotY(a), M4.rotX(0.6));
        b.ellipsoid(0.07, 0.012, 0.13, 6, 3, i % 3 ? 0x3a6a2a : 0x2a5a24);
        b.pop();
      }
      K.tube(b, [[-2.05, 0.4, -1.25], [-2.03, 1.1, -1.22], [-2.0, 1.4, -1.2]], [0.012, 0.01, 0.006], 4, 0x5a4a2a);
    });
    W.vhsTex = r.texture(64, T.vhs, { height: 32 });
    W.vhs = mesh(r, b => {
      b.box(0.026, 0.19, 0.105, 0x1c1c1e, { base: true });
      const n = [-1, 0, 0];
      b.quad([-0.0135, 0.01, 0.045], [-0.0135, 0.01, -0.045], [-0.0135, 0.18, -0.045], [-0.0135, 0.18, 0.045], [1, 1, 1, 0.4], [[1, 0], [1, 1], [0, 1], [0, 0]], [n, n, n, n]);
      b.at(0, 0.095, 0.0535, q => q.box(0.022, 0.17, 0.002, 0xe8e6de));
    });
    W.vhsRow = [];
    for (let i = 0; i < 22; i++) W.vhsRow.push([-1.5 + i * 0.118, 0.12, (i % 3) * 0.04 - 0.04]);
    W.can = mesh(r, b => {
      b.prism(18, 0.033, 0.033, 0, 0.033, 0.033, 0.12, [1, 1, 1, 0.45], { capBottom: true });
    });
    W.canTop = mesh(r, b => {
      b.at(0, 0.12, 0, q => q.prism(18, 0.033, 0.033, 0, 0.028, 0.028, 0.008, 0xc8c8cc));
    });
    W.labelTex = r.texture(256, T.label, { height: 128 });
    W.canLabel = mesh(r, b => {
      const n = 18;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * 2 * PI - PI / 2, a1 = ((i + 1) / n) * 2 * PI - PI / 2;
        const p = (a, y) => [S(a) * 0.0335, y, C(a) * 0.0335];
        const nn = (a) => [S(a), 0, C(a)];
        b.quad(p(a0, 0.01), p(a1, 0.01), p(a1, 0.112), p(a0, 0.112), [1, 1, 1, 0.45], [[i / n, 0], [(i + 1) / n, 0], [(i + 1) / n, 1], [i / n, 1]], [nn(a0), nn(a1), nn(a1), nn(a0)]);
      }
    });
    return W;
  }

  function vhsTilt(i, fall) {
    if (fall <= 0) return 0;
    const k = clamp(fall * 26 - i, 0, 1);
    return (i === 21 ? 1.5 : 0.68) * k * k;
  }

  function drawOffice(r, W, st) {
    const plain = {};
    r.draw(W.floor, null, plain);
    r.draw(W.wall, null, { texture: W.wallTex, tint: st.wallTint || [1, 1, 1] });
    r.draw(W.blinds, null, { texture: W.blindsTex, tint: st.blindTint || [1, 1, 1] });
    r.draw(W.trim, null, plain);
    r.draw(W.paint, null, { texture: W.paintTex });
    r.draw(W.paintFrame, null, plain);
    if (st.wallTv !== false) {
      r.draw(W.tv, null, { texture: W.tvTex });
      r.draw(W.tvFrame, null, plain);
    }
    r.draw(W.plant, null, plain);
    if (st.noDesk) return;
    r.draw(W.desk, null, plain);
    if (st.chair) r.draw(W.chair, M4.translate(st.chair[0], 0, st.chair[1]), plain);
    r.draw(W.pc, null, plain);
    r.draw(W.screen, null, { texture: W.crtTex });
    r.draw(W.typewriter, null, plain);
    r.draw(W.papers, null, { texture: W.paperTex });
    if (st.lunch) {
      r.draw(W.plate, null, plain);
      r.draw(W.pizza, null, { texture: W.pizzaTex });
    }
    r.draw(W.props, null, plain);
    if (st.vhs !== undefined) {
      W.vhsRow.forEach(([x, z, yaw], i) => {
        const tilt = vhsTilt(i, st.vhs);
        const m = M4.chain(M4.translate(x + 0.013, OFFICE.deskY, z), M4.rotY(yaw * 0.3), M4.rotZ(-tilt), M4.translate(-0.013, 0, 0));
        r.draw(W.vhs, m, { texture: W.vhsTex });
      });
    }
  }

  function buildDiner(r) {
    const W = {};
    W.tileTex = r.texture(128, T.tiles);
    W.floor = mesh(r, b => floorQuad(b, -4, -6, 12, 4, 0, 0xffffff, [8, 5]));
    W.room = mesh(r, b => {
      plane(b, -4, 0, 12, 3.2, -1.2, 0xc8b8a0);
      b.at(4, 3.0, -1, q => q.box(16, 0.05, 10, 0x3a3430));
      for (let i = 0; i < 6; i++) b.at(-1 + i * 2.2, 2.9, 0.5 + (i % 2) * 1.2, q => q.box(0.5, 0.04, 0.5, [1, 0.96, 0.85, 1]));
      for (let i = 0; i < 8; i++) b.at(-1.5 + i * 1.6, 1.9, -1.15, q => q.box(1.2, 0.6, 0.05, [0.92, 0.94, 0.98, 1]));
      for (let i = 0; i < 6; i++) b.at(1.0 + i * 1.6, 1.55, -1.12, q => q.box(1.3, 0.12, 0.25, 0x6a4a2a));
      for (let i = 0; i < 18; i++) b.at(1.0 + (i % 6) * 1.6 + (i % 3) * 0.3 - 0.4, 1.68, -1.08, q => q.box(0.18, 0.14, 0.12, [0xc89a5a, 0xd8b070, 0xa86a3a][i % 3]));
    });
    W.booth = mesh(r, b => {
      b.at(0, 0.23, 0, q => q.box(1.6, 0.46, 0.5, 0x161618));
      b.at(0, 0.5, 0, q => q.box(1.6, 0.08, 0.52, 0x1e1e22));
      b.at(0, 0.85, -0.3, q => q.box(1.6, 0.72, 0.1, 0x1a1a1e));
      b.at(0, 0.66, -0.38, q => q.box(1.62, 1.32, 0.06, 0xb8864a));
      b.at(0, 1.33, -0.38, q => q.box(1.66, 0.05, 0.12, 0x9a6a36));
      for (let i = 0; i < 9; i++) b.at(-0.7 + i * 0.175, 0.95, -0.345, q => q.box(0.012, 0.7, 0.01, 0x7a5a3a));
    });
    W.table = mesh(r, b => {
      b.at(0, 0.74, 0, q => q.box(1.2, 0.04, 0.7, 0x2a2420));
      b.at(0, 0.37, 0, q => q.prism(8, 0.05, 0.05, -0.37, 0.05, 0.05, 0.37, 0x3a3a3a));
      [[-0.3, 0.1], [0.25, -0.1], [0.05, 0.15]].forEach(([x, z], i) => b.at(x, 0.84, z, q => q.prism(10, 0.04, 0.04, -0.08, 0.045, 0.045, 0.08, i === 1 ? [0.9, 0.7, 0.3, 1] : [0.6, 0.35, 0.15, 1], { capBottom: true })));
      b.at(-0.1, 0.77, -0.15, q => q.box(0.26, 0.01, 0.18, 0xf2f0ea));
    });
    return W;
  }

  const DINER_TABLES = [[0, 0], [2.4, 0], [4.8, 0], [7.2, 0]];

  function drawDiner(r, W, st, cast) {
    r.draw(W.floor, null, { texture: W.tileTex });
    r.draw(W.room, null, {});
    DINER_TABLES.forEach(([x, z]) => {
      r.draw(W.booth, M4.chain(M4.translate(x - 0.78, 0, z), M4.rotY(PI / 2)), {});
      r.draw(W.booth, M4.chain(M4.translate(x + 0.78, 0, z), M4.rotY(-PI / 2)), {});
      r.draw(W.table, M4.chain(M4.translate(x, 0, z), M4.rotY(PI / 2)), {});
    });
    cast();
  }

  function buildStudio(r) {
    const W = {};
    W.grid = mesh(r, b => {
      for (let i = -6; i <= 6; i++) {
        K.tube(b, [[i * 0.9, 5.2, -7], [i * 0.9, 5.2, 7]], [0.045, 0.045], 5, 0xc8b890);
        K.tube(b, [[-7, 5.0, i * 0.9], [7, 5.0, i * 0.9]], [0.045, 0.045], 5, 0xb8a880);
        K.tube(b, [[i * 0.9 + 0.3, 4.7, -7], [i * 0.9 + 0.3, 4.7, 7]], [0.02, 0.02], 4, 0x8a7a60);
      }
      for (let i = -3; i <= 3; i++) {
        b.at(i * 1.8, 5.6, 0, q => q.box(0.25, 0.25, 14, 0x5a5650));
        for (let k = -6; k <= 6; k += 0.6) b.at(i * 1.8, 5.45, k, q => q.box(0.2, 0.02, 0.02, 0x9a9488));
      }
      plane(b, -8, 6.2, 8, 6.2, 0, 0x3a3630);
      b.push(M4.translate(0, 6.3, 0), M4.rotX(PI / 2));
      plane(b, -8, -8, 8, 8, 0, 0x2a2622);
      b.pop();
    });
    W.lamp = mesh(r, b => {
      b.prism(10, 0.14, 0.14, -0.35, 0.16, 0.16, 0.1, 0x2a2a2c, { capBottom: false });
      K.tube(b, [[0, 0.1, 0], [0, 0.6, 0]], [0.02, 0.02], 4, 0x3a3a3a);
      b.at(0, 0.05, -0.18, q => q.box(0.06, 0.2, 0.06, 0x2a2a2c));
    });
    W.lens = mesh(r, b => b.at(0, -0.35, 0, q => q.prism(10, 0.13, 0.13, -0.005, 0.13, 0.13, 0.005, [1, 0.98, 0.9, 1])));
    W.glow = mesh(r, b => K.discXY(b, 0, 0, 0, 1, 18, [1, 0.95, 0.8, 1]));
    W.lamps = [];
    for (let i = 0; i < 40; i++) W.lamps.push([((i * 37) % 13 - 6) * 0.9, 4.3 + (i % 3) * 0.2, ((i * 23) % 11 - 5) * 0.9, (i * 1.7) % (2 * PI), i % 3 === 0]);
    return W;
  }

  function drawStudio(r, W, st, camera) {
    r.draw(W.grid, null, {});
    W.lamps.forEach(([x, y, z, yaw]) => {
      const m = M4.chain(M4.translate(x, y, z), M4.rotY(yaw), M4.rotX(0.35));
      r.draw(W.lamp, m, {});
      r.draw(W.lens, m, {});
    });
    const fwd = V3.norm(V3.sub(camera.at, camera.eye));
    W.lamps.forEach(([x, y, z, , hot]) => {
      if (!hot) return;
      const p = [x, y - 0.4, z];
      const d = V3.norm(V3.sub(p, camera.eye));
      const face = Math.max(0, V3.dot(d, fwd));
      const s = 0.12 + 0.55 * face * face * face;
      const yaw = Math.atan2(camera.eye[0] - p[0], camera.eye[2] - p[2]);
      const pitch = Math.atan2(camera.eye[1] - p[1], Math.hypot(camera.eye[0] - p[0], camera.eye[2] - p[2]));
      r.draw(W.glow, M4.chain(M4.translate(...p), M4.rotY(yaw), M4.rotX(-pitch), M4.scale(s, s, s)), { additive: true, alpha: 0.55 * (st.flare || 1), noFog: true, tint: [1, 0.85, 0.55] });
    });
  }

  function buildHut(r) {
    const W = {};
    W.plankTex = r.texture(256, T.planks);
    W.wall = mesh(r, b => {
      plane(b, -1.0, 0, 3.0, 3, -1.0, 0xffffff, [2.4, 1.8]);
      b.push(M4.translate(-1.5, 0, -1.0));
      b.push(M4.rotZ(PI / 2));
      plane(b, 0, -0.5, 3, 0.5, 0.0, 0xffffff, [1.8, 0.6]);
      b.pop();
      b.pop();
      plane(b, -3, 0, -1.6, 3, -1.0, 0xffffff, [0.9, 1.8]);
    });
    W.door = mesh(r, b => {
      b.at(-1.55, 1.25, -0.97, q => q.box(0.08, 2.5, 0.06, 0x8a6036));
      b.at(-0.95, 1.25, -0.97, q => q.box(0.08, 2.5, 0.06, 0x8a6036));
      b.at(-1.25, 2.5, -0.97, q => q.box(0.68, 0.08, 0.06, 0x8a6036));
    });
    W.shelf = mesh(r, b => {
      b.at(0.25, 2.06, -0.9, q => q.box(0.46, 0.05, 0.2, 0x6a4424));
      b.at(0.25, 2.12, -0.88, q => q.ellipsoid(0.13, 0.08, 0.1, 8, 5, 0xf2efe8));
      b.at(0.25, 2.2, -0.88, q => q.ellipsoid(0.05, 0.05, 0.05, 6, 4, 0xf2efe8));
      b.at(0.25, 1.82, -0.97, q => q.box(0.26, 0.42, 0.02, 0x8a8478));
    });
    W.cal4Tex = r.texture(128, T.calendar4, { height: 160, clamp: true });
    W.cal84Tex = r.texture(128, T.calendar84, { height: 160, clamp: true });
    W.sheet = mesh(r, b => plane(b, -0.11, -0.17, 0.11, 0.17, 0, [1, 1, 1, 0.6]));
    W.rushTex = r.texture(128, T.rushnik, { height: 256 });
    W.rushnik = mesh(r, b => {
      [-1, 1].forEach(s => {
        const pts = [];
        for (let i = 0; i <= 10; i++) {
          const v = i / 10;
          pts.push([0.25 + s * (0.14 + 0.32 * S(v * PI * 0.55)), 2.04 - v * 1.2, -0.93 + 0.05 * S(v * PI)]);
        }
        for (let i = 0; i < 10; i++) {
          const a = pts[i], c = pts[i + 1];
          const w0 = 0.07 + 0.06 * (i / 10), w1 = 0.07 + 0.06 * ((i + 1) / 10);
          b.quad([a[0] - w0, a[1], a[2]], [a[0] + w0, a[1], a[2]], [c[0] + w1, c[1], c[2]], [c[0] - w1, c[1], c[2]], [1, 1, 1, 0.35], [[0, 1 - i / 10], [1, 1 - i / 10], [1, 1 - (i + 1) / 10], [0, 1 - (i + 1) / 10]], [N, N, N, N]);
        }
      });
    });
    W.bed = mesh(r, b => {
      for (let i = 0; i < 8; i++) K.tube(b, [[0.75 + i * 0.07, 0.0, -0.3], [0.75 + i * 0.07, 0.95, -0.3]], [0.012, 0.012], 4, 0x2a2622);
      K.tube(b, [[0.7, 0.95, -0.3], [1.4, 0.95, -0.3]], [0.02, 0.02], 5, 0x2a2622);
      K.tube(b, [[0.7, 0.55, -0.3], [1.4, 0.55, -0.3]], [0.018, 0.018], 5, 0x2a2622);
      [0.72, 1.38].forEach(x => K.tube(b, [[x, 0, -0.3], [x, 1.05, -0.3]], [0.025, 0.025], 5, 0x2a2622));
      b.at(1.4, 0.45, 0.4, q => q.box(1.4, 0.18, 1.6, 0xe8e8e4));
    });
    W.pillowTex = r.texture(64, T.pillow);
    W.pillow = mesh(r, b => {
      b.at(1.15, 0.68, -0.05, q => q.ellipsoid(0.36, 0.13, 0.24, 10, 5, [1, 1, 1, 0.3]));
      b.at(1.25, 0.84, -0.12, q => q.ellipsoid(0.28, 0.12, 0.2, 10, 5, [1, 1, 1, 0.3]));
    });
    W.window = mesh(r, b => {
      b.at(2.25, 2.3, -0.96, q => q.box(0.12, 1.2, 0.05, 0x8a5a2a));
      for (let i = 0; i < 6; i++) b.at(2.33, 1.8 + i * 0.16, -0.94, q => q.box(0.07, 0.07, 0.03, i % 2 ? 0xc8a050 : 0x5a3a1a));
    });
    return W;
  }

  function drawHut(r, W, st) {
    r.draw(W.wall, null, { texture: W.plankTex });
    r.draw(W.door, null, {});
    r.draw(W.shelf, null, {});
    r.draw(W.rushnik, null, { texture: W.rushTex });
    r.draw(W.sheet, M4.translate(0.25, 1.82, -0.955), { texture: W.cal84Tex });
    const tear = st.tear || 0;
    if (tear < 1) {
      const m = M4.chain(M4.translate(0.25 + st.sheetPos[0], 1.82 + st.sheetPos[1], -0.95 + st.sheetPos[2]), M4.rotZ(st.sheetRot || 0), M4.rotX(st.sheetTilt || 0));
      r.draw(W.sheet, m, { texture: W.cal4Tex });
    }
    r.draw(W.bed, null, {});
    r.draw(W.pillow, null, { texture: W.pillowTex });
    r.draw(W.window, null, {});
  }

  function buildTruck(r) {
    const W = {};
    W.dashTex = r.texture(256, T.dash, { height: 64 });
    W.cab = mesh(r, b => {
      b.at(0.45, 0.95, 0.85, q => q.box(1.9, 0.32, 0.36, 0x4a4e4a));
      b.push(M4.translate(0.75, 1.13, 0.68), M4.rotX(-0.3), M4.rotY(-0.25));
      plane(b, -0.45, -0.1, 0.45, 0.1, 0, [1, 1, 1, 0.5]);
      b.pop();
      b.at(-0.58, 1.5, 0.3, q => q.box(0.06, 1.0, 1.4, 0x3a3e3a));
      b.at(1.45, 1.0, 0.3, q => q.box(0.06, 1.1, 1.4, 0x3a3e3a));
      b.at(0.45, 2.05, 0.2, q => q.box(2.1, 0.06, 1.7, 0x3a3e3a));
      b.at(0.45, 0.45, 0.2, q => q.box(2.1, 0.06, 1.7, 0x262826));
      b.at(0.2, 0.6, -0.15, q => q.box(0.7, 0.12, 0.55, 0x1e1e20));
      b.at(0.2, 1.05, -0.45, q => q.box(0.7, 0.85, 0.12, 0x1e1e20));
      b.at(0.85, 0.75, 0.3, q => q.box(0.12, 0.5, 0.12, 0x2a2a2a));
      K.tube(b, [[0.85, 0.72, 0.3], [0.8, 0.98, 0.22]], [0.012, 0.01], 5, 0x1a1a1a);
      b.at(0.8, 1.0, 0.22, q => q.ellipsoid(0.035, 0.035, 0.035, 8, 5, 0x1a1a1a));
      b.at(-0.5, 2.0, 0.95, q => q.box(0.12, 0.1, 0.1, 0x2a2a2a));
    });
    W.glass = mesh(r, b => {
      b.push(M4.translate(0.45, 1.58, 1.02), M4.rotX(0.12));
      plane(b, -0.95, -0.45, 0.95, 0.45, 0, [0.95, 0.97, 1.0, 1]);
      b.pop();
      b.push(M4.translate(1.42, 1.55, 0.35), M4.rotY(-PI / 2));
      plane(b, -0.5, -0.42, 0.5, 0.42, 0, [0.95, 0.97, 1.0, 1]);
      b.pop();
    });
    W.wheel = mesh(r, b => {
      const n = 28;
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push([C((i / n) * 2 * PI) * 0.27, S((i / n) * 2 * PI) * 0.27, 0]);
      K.tube(b, pts, pts.map(() => 0.018), 6, 0x101012);
      [0, 2 * PI / 3, 4 * PI / 3].forEach(a => K.tube(b, [[0, 0, 0], [C(a + PI / 2) * 0.26, S(a + PI / 2) * 0.26, 0]], [0.012, 0.012], 4, 0x1a1a1c));
      b.at(0, 0, 0.0, q => q.ellipsoid(0.05, 0.05, 0.03, 8, 5, 0x1a1a1c));
      K.tube(b, [[0, 0, 0], [0, 0, 0.5]], [0.025, 0.03], 6, 0x2a2a2a);
    });
    return W;
  }

  const WHEEL = [0.3, 1.18, 0.4];

  function drawTruck(r, W, st) {
    r.draw(W.cab, null, {});
    r.draw(W.glass, null, {});
    r.draw(W.wheel, M4.chain(M4.translate(...WHEEL), M4.rotX(-0.75), M4.rotZ(st.wheel || 0)), {});
  }

  function cartoonBuilder(grow) {
    const g = grow || 0;
    const ell = (b, x, y, z, rx, ry, rz, col, seg) => b.at(x, y, z, q => q.ellipsoid(rx + g, ry + g, rz + g, seg || 12, 8, col));
    return { ell, g };
  }

  const TOON = (hex) => { const c = window.P3D.rgb(hex); return [c[0], c[1], c[2], FLAT]; };

  function buildPlane(b, grow) {
    const { ell, g } = cartoonBuilder(grow);
    const body = TOON(0x6a7a2a), dark = TOON(0x4a5a1c), wing = TOON(0x7a8a34);
    ell(b, 0, 0, 0, 0.42, 0.42, 1.25, body, 16);
    b.at(0, 0, -1.4, q => q.ellipsoid(0.16 + g, 0.2 + g, 0.4 + g, 10, 6, body));
    b.at(0, 0.12, -1.65, q => q.box(0.04 + g * 2, 0.5 + g * 2, 0.32 + g * 2, wing));
    b.at(0, 0.0, -1.62, q => q.box(0.9 + g * 2, 0.04 + g * 2, 0.3 + g * 2, wing));
    [0.55, -0.35].forEach((y, i) => b.at(0, y, 0.25, q => q.box(3.2 + g * 2, 0.06 + g * 2, 0.55 + g * 2, i ? dark : wing)));
    [-1.1, 1.1].forEach(x => K.tube(b, [[x, -0.33, 0.3], [x, 0.53, 0.3]], [0.025 + g, 0.025 + g], 5, TOON(0x2a2a1a)));
    [-0.35, 0.35].forEach(x => {
      K.tube(b, [[x * 0.6, -0.4, 0.35], [x, -0.75, 0.4]], [0.03 + g, 0.03 + g], 5, dark);
      b.at(x, -0.78, 0.4, q => q.ellipsoid(0.06 + g, 0.17 + g, 0.17 + g, 8, 6, TOON(0x1a1a1a)));
    });
    ell(b, 0, 0, 1.22, 0.16, 0.16, 0.12, TOON(0x2a2a2a), 10);
    b.at(0, 0.36, 0.05, q => q.prism(14, 0.3 + g, 0.3 + g, -0.05, 0.3 + g, 0.3 + g, 0.06, TOON(0x3a3a20)));
  }

  function buildPilot(b, grow, look) {
    const { ell, g } = cartoonBuilder(grow);
    const o = look || {};
    ell(b, 0, 0.0, 0, 0.3, 0.26, 0.3, TOON(0xc8a070));
    ell(b, 0, 0.42, 0, 0.27, 0.31, 0.27, TOON(0xf0c8a0));
    if (o.wild) {
      for (let i = 0; i < 9; i++) {
        const a = (i / 8) * PI - PI / 2;
        ell(b, S(a) * 0.32, 0.55 + C(a) * 0.12, -0.08, 0.12, 0.09, 0.12, TOON(0xf4f4f4), 8);
      }
      ell(b, 0, 0.58, 0, 0.26, 0.24, 0.26, TOON(0xf0c8a0));
    } else {
      ell(b, 0, 0.56, -0.01, 0.3, 0.27, 0.3, TOON(0x7a5230));
      [-1, 1].forEach(s => ell(b, s * 0.27, 0.42, 0.0, 0.07, 0.14, 0.1, TOON(0x6a4426), 8));
    }
    [-1, 1].forEach(s => {
      ell(b, s * 0.11, 0.56, 0.24, 0.1, 0.09, 0.05, TOON(0x3a2a1a), 10);
      ell(b, s * 0.11, 0.56, 0.27, 0.075, 0.068, 0.03, TOON(0x9ad8f0), 10);
    });
    if (g === 0) [-1, 1].forEach(s => b.at(s * 0.12, 0.58, 0.3, q => q.ellipsoid(0.022, 0.03, 0.01, 6, 4, TOON(0xffffff))));
    ell(b, 0, 0.42, 0.29, 0.075, 0.07, 0.07, TOON(0xe02818));
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.22, 0.36, 0.22), M4.rotZ(s * 0.18));
      b.ellipsoid(0.22 + g, 0.045 + g, 0.06 + g, 10, 5, TOON(0xf08a2a));
      b.pop();
    });
    ell(b, 0, 0.27, 0.2, 0.1, 0.03, 0.04, TOON(0x8a2a1a), 8);
    b.at(0, 0.12, 0.0, q => q.prism(14, 0.24 + g, 0.24 + g, -0.05, 0.26 + g, 0.26 + g, 0.06, TOON(0xf0d020)));
    K.tube(b, [[0.15, 0.12, -0.2], [0.4, 0.2, -0.5], [0.6, 0.24, -0.8]], [0.06 + g, 0.07 + g, 0.04 + g], 5, TOON(0xf0d020));
  }

  function buildHandToon(b, grow, ok) {
    const { ell, g } = cartoonBuilder(grow);
    const col = TOON(0x3a2a1c);
    ell(b, 0, 0, 0, 0.13, 0.15, 0.06, col, 10);
    if (ok) {
      const pts = [];
      for (let i = 0; i <= 10; i++) pts.push([0.02 + C((i / 10) * 2 * PI) * 0.06, 0.2 + S((i / 10) * 2 * PI) * 0.06, 0.02]);
      K.tube(b, pts, pts.map(() => 0.03 + g), 5, col);
      [-0.05, 0.03, 0.1].forEach((x, i) => K.tube(b, [[x, 0.1, 0], [x - 0.02, 0.3 + i * 0.02, 0]], [0.03 + g, 0.028 + g], 5, col));
    } else {
      [-0.08, -0.02, 0.04, 0.1].forEach(x => K.tube(b, [[x, 0.1, 0], [x * 1.4, 0.34, 0]], [0.03 + g, 0.026 + g], 5, col));
    }
  }

  function buildSky(r) {
    const W = {};
    W.skyTex = r.texture(256, T.sky, { height: 192, clamp: true });
    W.cloudTex = r.texture(128, T.cloud, { height: 96, clamp: true });
    W.cloud = mesh(r, b => b.quad([-1, -0.75, 0], [1, -0.75, 0], [1, 0.75, 0], [-1, 0.75, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [N, N, N, N]));
    W.plane = mesh(r, b => buildPlane(b, 0));
    W.planeLine = mesh(r, b => buildPlane(b, 0.035));
    W.prop = mesh(r, b => {
      b.box(1.3, 0.08, 0.02, TOON(0x2a2418));
      b.box(0.08, 1.3, 0.02, TOON(0x2a2418));
    });
    W.blur = mesh(r, b => K.discXY(b, 0, 0, 0, 0.7, 20, [0.9, 0.9, 0.9, 1]));
    W.pilot = mesh(r, b => buildPilot(b, 0));
    W.pilotLine = mesh(r, b => buildPilot(b, 0.02));
    W.wild = mesh(r, b => buildPilot(b, 0, { wild: true }));
    W.wildLine = mesh(r, b => buildPilot(b, 0.02, { wild: true }));
    W.hand = mesh(r, b => buildHandToon(b, 0, false));
    W.handLine = mesh(r, b => buildHandToon(b, 0.02, false));
    W.okHand = mesh(r, b => buildHandToon(b, 0, true));
    W.okHandLine = mesh(r, b => buildHandToon(b, 0.02, true));
    W.trailDot = mesh(r, b => b.ellipsoid(1, 1, 1, 8, 6, TOON(0xffffff)));
    return W;
  }

  const LINE = { blend: true, alpha: 1, flat: [0.05, 0.04, 0.04, 1] };

  function toon(r, W, key, m) {
    r.draw(W[key + 'Line'], m, LINE);
    r.draw(W[key], m, {});
  }

  function drawPlane(r, W, m, t, withPilot, wild) {
    toon(r, W, 'plane', m);
    const pm = M4.chain(m, M4.translate(0, 0.6, 0.05), M4.scale(0.75, 0.75, 0.75));
    if (withPilot) toon(r, W, wild ? 'wild' : 'pilot', pm);
    const prop = M4.chain(m, M4.translate(0, 0, 1.36), M4.rotZ(t * 40));
    r.draw(W.prop, prop, {});
    r.draw(W.blur, M4.chain(m, M4.translate(0, 0, 1.37)), { blend: true, alpha: 0.25 });
  }

  function drawTrail(r, W, pts, rad) {
    pts.forEach(p => r.draw(W.trailDot, M4.chain(M4.translate(...p), M4.scale(rad * 1.25, rad * 1.25, rad * 1.25)), LINE));
    pts.forEach(p => r.draw(W.trailDot, M4.chain(M4.translate(...p), M4.scale(rad, rad, rad)), {}));
  }

  function buildRadar(r) {
    const W = {};
    W.radarTex = r.texture(256, T.radar, { clamp: true });
    W.sweepTex = r.texture(256, T.sweep, { clamp: true });
    W.mapTex = r.texture(256, T.map);
    W.perfTex = r.texture(128, T.perf);
    W.panelTex = r.texture(128, T.panel);
    W.instTex = r.texture(128, T.instruments, { height: 64 });
    W.room = mesh(r, b => {
      plane(b, -3, 0, 4, 3.2, -1.2, 0xd8d6cc);
      b.push(M4.translate(-1.4, 0, 0), M4.rotY(PI / 2));
      plane(b, -2, 0, 2, 3.2, 0, 0xc8c6bc);
      b.pop();
      floorQuad(b, -3, -1.2, 4, 3, 0, 0x5a5650);
    });
    W.map = mesh(r, b => plane(b, 0.75, 1.3, 2.4, 2.5, -1.18, [1, 1, 1, 0.5]));
    W.perf = mesh(r, b => plane(b, 0.95, 0.0, 2.6, 0.95, -0.55, [1, 1, 1, 0.3], [3, 2]));
    W.console = mesh(r, b => {
      b.at(-0.35, 1.25, -1.0, q => q.box(1.7, 1.5, 0.35, 0x8a9294));
      b.at(-0.35, 2.15, -1.05, q => q.box(1.7, 0.3, 0.3, 0x7a8284));
      b.at(0.35, 0.36, -0.55, q => q.box(3.0, 0.72, 0.9, 0xd8d4c8));
      b.at(0.35, 0.74, -0.55, q => q.box(3.0, 0.04, 0.92, 0xc8b89a));
      b.at(0.35, 0.73, -0.08, q => q.box(3.0, 0.06, 0.04, 0xa88a5a));
    });
    W.inst = mesh(r, b => plane(b, -1.2, 1.95, 0.5, 2.28, -0.89, [1, 1, 1, 0.4]));
    W.panel = mesh(r, b => {
      b.push(M4.translate(-0.15, 0.77, -0.55), M4.rotX(-PI / 2 + 0.25));
      plane(b, -0.6, -0.3, 0.6, 0.3, 0, [1, 1, 1, 0.3]);
      b.pop();
      b.push(M4.translate(-0.7, 1.0, -0.83), M4.rotX(-0.3));
      plane(b, -0.3, -0.25, 0.3, 0.25, 0, [1, 1, 1, 0.3]);
      b.pop();
    });
    W.bezel = mesh(r, b => {
      const n = 36;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * 2 * PI, a1 = ((i + 1) / n) * 2 * PI;
        const p = (a, rr, zz) => [C(a) * rr, S(a) * rr, zz];
        b.quad(p(a0, 0.4, 0), p(a1, 0.4, 0), p(a1, 0.56, 0.04), p(a0, 0.56, 0.04), 0x2a2e30);
        b.quad(p(a0, 0.56, 0.04), p(a1, 0.56, 0.04), p(a1, 0.6, -0.02), p(a0, 0.6, -0.02), 0x4a5052);
      }
      for (let i = 0; i < 8; i++) b.at(C((i / 8) * 2 * PI) * 0.53, S((i / 8) * 2 * PI) * 0.53, 0.04, q => q.ellipsoid(0.018, 0.018, 0.012, 5, 3, 0x9a9a9a));
    });
    W.screen = mesh(r, b => K.discXY(b, 0, 0, -0.03, 0.41, 32, [1, 1, 1, 1]));
    W.mic = mesh(r, b => {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const v = i / 12;
        pts.push([0.15 - v * 0.35, 0.78 + S(v * PI * 0.9) * 0.35, -0.2 + v * 0.05]);
      }
      K.tube(b, pts, pts.map(() => 0.012), 6, 0x9a9ea0);
      b.at(-0.2, 0.98, -0.12, q => q.ellipsoid(0.05, 0.06, 0.09, 8, 6, 0x1a1a1a));
      b.at(0.15, 0.77, -0.2, q => q.prism(10, 0.05, 0.05, 0, 0.05, 0.05, 0.03, 0x2a2a2a));
      K.tube(b, [[-0.55, 0.76, -0.75], [-0.6, 1.05, -0.7], [-0.45, 1.15, -0.62]], [0.01, 0.01, 0.01], 5, 0x8a8e90);
      b.at(-0.42, 1.13, -0.6, q => q.prism(10, 0.04, 0.07, -0.06, 0.02, 0.03, 0.0, 0xd8d6d0));
      b.at(-0.35, 0.8, -0.5, q => q.box(0.25, 0.12, 0.2, 0xf0eee8));
    });
    return W;
  }

  const RADAR_SCREEN = M4.chain(M4.translate(-0.5, 1.3, -0.8), M4.rotY(0.32), M4.rotX(-0.08));

  function drawRadar(r, W, st) {
    r.draw(W.room, null, {});
    r.draw(W.map, null, { texture: W.mapTex });
    r.draw(W.perf, null, { texture: W.perfTex });
    r.draw(W.console, null, {});
    r.draw(W.inst, null, { texture: W.instTex });
    r.draw(W.panel, null, { texture: W.panelTex });
    r.draw(W.bezel, RADAR_SCREEN, {});
    r.draw(W.screen, RADAR_SCREEN, { texture: st.screenTex || W.radarTex, noFog: true });
    if (!st.screenTex) r.draw(W.screen, M4.chain(RADAR_SCREEN, M4.translate(0, 0, 0.004), M4.rotZ(-(st.t || 0) * 2.2)), { texture: W.sweepTex, additive: true, alpha: 0.9, noFog: true });
    r.draw(W.mic, null, {});
  }

  function build(r) {
    return {
      office: buildOffice(r),
      diner: buildDiner(r),
      studio: buildStudio(r),
      hut: buildHut(r),
      truck: buildTruck(r),
      sky: buildSky(r),
      radar: buildRadar(r)
    };
  }

  window.KalamSets = { OFFICE, WHEEL, RADAR_SCREEN, DINER_TABLES, build, drawOffice, drawDiner, drawStudio, drawHut, drawTruck, drawPlane, drawTrail, drawRadar, toon, LINE, vhsTilt };
})();
