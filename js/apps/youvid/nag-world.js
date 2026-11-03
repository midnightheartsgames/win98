(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C } = K;

  const WOOD = 0xc89a64;
  const WOOD_DARK = 0x9a6e44;
  const METAL = 0x8a9098;
  const WALL = 0xece4d4;
  const FLOOR = 0xb08a60;
  const CEIL = 0xf2f0ea;
  const PLASTER = 0xf0eee8;

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function ellAt(b, pos, rx, ry, rz, seg, rings, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.ellipsoid(rx, ry, rz, seg, rings, col);
    if (rotM) b.pop();
    b.pop();
  }

  function deskInto(b, x, z, yaw) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    boxAt(b, [0, 0.72, 0], [0.62, 0.03, 0.44], WOOD);
    boxAt(b, [0, 0.64, -0.02], [0.56, 0.1, 0.36], METAL);
    [[-0.28, -0.19], [0.28, -0.19], [-0.28, 0.19], [0.28, 0.19]].forEach(([dx, dz]) => boxAt(b, [dx, 0.35, dz], [0.025, 0.7, 0.025], METAL));
    boxAt(b, [0, 0.12, 0.19], [0.56, 0.02, 0.02], METAL);
    b.pop();
  }

  function chairInto(b, x, z, yaw) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    boxAt(b, [0, 0.43, 0], [0.4, 0.025, 0.38], WOOD);
    boxAt(b, [0, 0.72, -0.18], [0.38, 0.2, 0.02], WOOD);
    [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]].forEach(([dx, dz]) => boxAt(b, [dx, 0.215, dz], [0.022, 0.43, 0.022], METAL));
    [-0.18, 0.18].forEach(dx => boxAt(b, [dx, 0.62, -0.18], [0.02, 0.4, 0.02], METAL));
    b.pop();
  }

  function easelInto(b, x, z, yaw, h) {
    const H = h || 1.7;
    b.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    [-1, 1].forEach(s => boxAt(b, [s * 0.2, H / 2, 0.05], [0.035, H, 0.035], WOOD_DARK, M4.rotZ(-s * 0.1)));
    boxAt(b, [0, H * 0.48, -0.32], [0.035, H * 0.98, 0.035], WOOD_DARK, M4.rotX(-0.36));
    boxAt(b, [0, H * 0.45, 0.08], [0.6, 0.04, 0.08], WOOD_DARK);
    boxAt(b, [0, H * 0.66, 0.1], [0.56, 0.44, 0.02], 0xf4f2ec);
    boxAt(b, [0, H * 0.9, 0.08], [0.22, 0.04, 0.05], WOOD_DARK);
    b.pop();
  }

  function bustInto(b, kind) {
    const col = PLASTER;
    boxAt(b, [0, 0.03, 0], [0.3, 0.06, 0.26], 0xe2ded6);
    b.push(M4.translate(0, 0.06, 0));
    K.tube(b, [[0, 0, 0], [0, 0.12, 0]], [0.1, 0.13], 12, col);
    ellAt(b, [0, 0.15, 0], 0.18, 0.08, 0.11, 14, 8, col);
    K.tube(b, [[0, 0.17, 0.0], [0, 0.29, 0.01]], [0.05, 0.045], 10, col);
    ellAt(b, [0, 0.37, 0.015], 0.085, 0.105, 0.095, 14, 10, col);
    ellAt(b, [0, 0.36, 0.095], 0.012, 0.03, 0.02, 6, 5, col);
    if (kind === 'beard') {
      ellAt(b, [0, 0.3, 0.06], 0.07, 0.07, 0.05, 10, 8, col);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * PI * 2;
        ellAt(b, [S(a) * 0.075, 0.44 + C(a) * 0.01, -0.01 + C(a) * 0.07], 0.03, 0.026, 0.03, 6, 5, col);
      }
      K.tube(b, [[-0.16, 0.13, 0.05], [0, 0.2, 0.1], [0.16, 0.13, 0.05]], [0.025, 0.03, 0.025], 6, 0xe6e2da);
    } else {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        ellAt(b, [S(a) * 0.08, 0.43 + (i % 2) * 0.015, C(a) * 0.075], 0.032, 0.03, 0.03, 6, 5, col);
      }
      ellAt(b, [0, 0.47, 0.0], 0.06, 0.03, 0.06, 8, 5, col);
    }
    b.pop();
  }

  function pedestalInto(b, h) {
    boxAt(b, [0, h / 2, 0], [0.34, h, 0.34], 0xe8e4dc);
    boxAt(b, [0, h - 0.015, 0], [0.4, 0.03, 0.4], 0xe0dcd2);
    boxAt(b, [0, 0.03, 0], [0.4, 0.06, 0.4], 0xe0dcd2);
  }

  function roomShell(b, opts) {
    const o = opts || {};
    const x0 = -4.2, x1 = 4.2, z0 = -6.5, z1 = 2.5, h = 3.0;
    const nU = [0, 1, 0], nD = [0, -1, 0];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        const xa = x0 + ((x1 - x0) * i) / 6, xb = x0 + ((x1 - x0) * (i + 1)) / 6;
        const za = z0 + ((z1 - z0) * j) / 6, zb = z0 + ((z1 - z0) * (j + 1)) / 6;
        const c = (i + j) % 2 ? FLOOR : 0xa8825a;
        b.quad([xa, 0, zb], [xb, 0, zb], [xb, 0, za], [xa, 0, za], c, null, [nU, nU, nU, nU]);
      }
    }
    b.quad([x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1], CEIL, null, [nD, nD, nD, nD]);
    const nB = [0, 0, 1];
    b.quad([x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0], WALL, null, [nB, nB, nB, nB]);
    const nL = [1, 0, 0], nR = [-1, 0, 0];
    b.quad([x0, 0, z1], [x0, 0, z0], [x0, 0.9, z0], [x0, 0.9, z1], WALL, null, [nL, nL, nL, nL]);
    b.quad([x0, 2.6, z1], [x0, 2.6, z0], [x0, h, z0], [x0, h, z1], WALL, null, [nL, nL, nL, nL]);
    for (let k = 0; k < 5; k++) {
      const za = z0 + 0.2 + k * 1.75, zb = za + 1.6;
      b.quad([x0 - 0.05, 0.9, zb], [x0 - 0.05, 0.9, za], [x0 - 0.05, 2.6, za], [x0 - 0.05, 2.6, zb], 0xdaf0fa, null, [nL, nL, nL, nL]);
      boxAt(b, [x0 + 0.02, 1.75, za], [0.06, 1.7, 0.06], 0xd8dce2);
      boxAt(b, [x0 + 0.02, 1.75, (za + zb) / 2], [0.05, 1.7, 0.04], 0xd8dce2);
    }
    boxAt(b, [x0 + 0.02, 0.9, (z0 + z1) / 2], [0.12, 0.05, z1 - z0], 0xd8dce2);
    b.quad([x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0], WALL, null, [nR, nR, nR, nR]);
    [-4.5, 0.8].forEach(z => {
      boxAt(b, [x1 - 0.02, 1.0, z], [0.04, 2.0, 1.0], 0xc4a070);
      boxAt(b, [x1 - 0.04, 1.45, z], [0.02, 0.5, 0.5], 0xdaf0fa);
    });
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < 3; j++) boxAt(b, [-2 + k * 2, h - 0.04, -4.8 + j * 2.4], [1.2, 0.05, 0.16], 0xfcfcfa);
    }
    if (o.board) {
      boxAt(b, [0, 1.5, z0 + 0.03], [4.2, 1.2, 0.04], 0x2a5a44);
      boxAt(b, [0, 0.88, z0 + 0.08], [4.2, 0.04, 0.12], 0xb8b4ac);
    }
  }

  function build(r) {
    const W = {};
    W.classroom = K.mesh(r, b => {
      roomShell(b, { board: true });
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const x = -2.6 + i * 1.3, z = -4.6 + j * 1.15;
          deskInto(b, x, z, 0);
          chairInto(b, x, z + 0.42, PI);
        }
      }
      boxAt(b, [0, 0.5, -5.6], [1.2, 1.0, 0.5], WOOD_DARK);
    });
    W.artroom = K.mesh(r, b => {
      roomShell(b, { board: false });
      [[-2.4, -4.2, 0.3], [-0.6, -4.6, -0.1], [1.4, -4.3, -0.3], [2.8, -2.6, -0.8], [-2.9, -1.8, 0.7]].forEach(([x, z, y]) => easelInto(b, x, z, y));
      [[-1.2, -2.6], [1.0, -2.0], [-0.4, -0.8]].forEach(([x, z]) => {
        boxAt(b, [x, 0.74, z], [1.6, 0.05, 0.8], WOOD);
        [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]].forEach(([dx, dz]) => boxAt(b, [x + dx, 0.37, z + dz], [0.05, 0.74, 0.05], WOOD_DARK));
      });
      [[-3.4, -5.6, 'curl'], [3.3, -5.4, 'beard']].forEach(([x, z, kind]) => {
        b.push(M4.translate(x, 0, z));
        pedestalInto(b, 1.0);
        b.push(M4.translate(0, 1.0, 0), M4.rotY(x < 0 ? 0.4 : -0.4), M4.scale(1.4));
        bustInto(b, kind);
        b.pop();
        b.pop();
      });
      for (let k = 0; k < 6; k++) boxAt(b, [-3.0 + k * 1.2, 2.2, -6.45], [0.8, 0.6, 0.02], [0xf0d0b0, 0xc0d8f0, 0xf0f0c0, 0xd0f0d0, 0xf0c8d8, 0xe0e0e0][k]);
    });
    W.desk = K.mesh(r, b => deskInto(b, 0, 0, 0));
    W.chair = K.mesh(r, b => chairInto(b, 0, 0, 0));
    W.easel = K.mesh(r, b => easelInto(b, 0, 0, 0));
    W.bustCurl = K.mesh(r, b => bustInto(b, 'curl'));
    W.bustBeard = K.mesh(r, b => bustInto(b, 'beard'));
    W.pedestal = K.mesh(r, b => pedestalInto(b, 1.0));
    W.bag = K.mesh(r, b => {
      boxAt(b, [0, 0, 0], [0.34, 0.26, 0.09], 0xc89a3c);
      boxAt(b, [0, 0.08, 0.05], [0.34, 0.1, 0.012], 0xb4862e);
      boxAt(b, [0, 0.08, 0.058], [0.04, 0.03, 0.006], 0xe8d090);
    });
    W.strap = K.mesh(r, b => boxAt(b, [0, -0.3, 0], [0.04, 0.6, 0.008], 0xb4862e));
    W.book = K.mesh(r, b => {
      boxAt(b, [-0.085, 0, 0], [0.17, 0.006, 0.24], 0x3a6ad0, M4.rotZ(0.12));
      boxAt(b, [0.085, 0, 0], [0.17, 0.006, 0.24], 0x3a6ad0, M4.rotZ(-0.12));
      boxAt(b, [-0.082, 0.008, 0], [0.16, 0.008, 0.23], 0xf8f8f4, M4.rotZ(0.12));
      boxAt(b, [0.082, 0.008, 0], [0.16, 0.008, 0.23], 0xf8f8f4, M4.rotZ(-0.12));
    });
    W.cover = K.mesh(r, b => {
      const n = [0, 0, 1];
      b.quad([-0.105, -0.15, 0], [0.105, -0.15, 0], [0.105, 0.15, 0], [-0.105, 0.15, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
      b.quad([0.105, -0.15, -0.004], [-0.105, -0.15, -0.004], [-0.105, 0.15, -0.004], [0.105, 0.15, -0.004], [1, 1, 1, 1], [[0.98, 0.02], [0.99, 0.02], [0.99, 0.03], [0.98, 0.03]], [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
    });
    W.sketch = K.mesh(r, b => {
      const n = [0, 0, 1];
      boxAt(b, [0, 0, -0.006], [0.42, 0.3, 0.01], 0x2a2a34);
      b.quad([-0.2, -0.14, 0], [0.2, -0.14, 0], [0.2, 0.14, 0], [-0.2, 0.14, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    });
    W.marker = K.mesh(r, b => {
      K.tube(b, [[0, 0.07, 0], [0, -0.05, 0]], [0.009, 0.009], 8, 0xf2f2f2);
      K.tube(b, [[0, -0.05, 0], [0, -0.075, 0]], [0.007, 0.003], 8, 0x1a1a1a);
      K.tube(b, [[0, 0.07, 0], [0, 0.09, 0]], [0.0095, 0.0095], 8, 0x1a1a1a);
    });
    W.popsicle = K.mesh(r, b => {
      boxAt(b, [0, -0.05, 0], [0.012, 0.09, 0.004], 0xe8d0a0);
      b.push(M4.translate(0, 0.04, 0));
      b.box(0.045, 0.09, 0.02, 0x8ad0f0);
      b.pop();
    });
    W.door = K.mesh(r, b => {
      boxAt(b, [-0.53, 1.0, 0], [1.0, 2.0, 0.05], 0x5a3a5a);
      boxAt(b, [0.58, 1.0, -0.06], [1.0, 2.0, 0.05], 0x4a2e4a);
      boxAt(b, [-0.08, 1.0, 0.04], [0.04, 0.3, 0.03], 0x2a1a2a);
      boxAt(b, [0, 2.05, -0.03], [2.4, 0.1, 0.2], 0x3a2438);
    });
    W.paper = K.mesh(r, b => {
      const n = [0, 0, 1];
      b.quad([-0.1, -0.14, 0], [0.1, -0.14, 0], [0.1, 0.14, 0], [-0.1, 0.14, 0], 0xf8f8f8, null, [n, n, n, n]);
      b.quad([0.1, -0.14, 0], [-0.1, -0.14, 0], [-0.1, 0.14, 0], [0.1, 0.14, 0], 0xf0f0f0, null, [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
    });
    W.ground = K.mesh(r, b => {
      const n = [0, 1, 0];
      b.quad([-20, 0, 20], [20, 0, 20], [20, 0, -20], [-20, 0, -20], 0xf0f0f0, null, [n, n, n, n]);
    });
    W.tex = {};
    W.r = r;
    return W;
  }

  function texOf(W, key, w, h, draw) {
    if (!W.tex[key]) W.tex[key] = W.r.texture(w, draw, { height: h, clamp: true });
    return W.tex[key];
  }

  function place(p) {
    const m = M4.chain(M4.translate(p.pos[0], p.pos[1], p.pos[2]), M4.rotY(p.yaw || 0), M4.rotX(p.pitch || 0), M4.rotZ(p.roll || 0));
    return p.scale ? M4.chain(m, M4.scale(p.scale, p.scale, p.scale)) : m;
  }

  function drawSet(r, W, set) {
    if (set && W[set]) r.draw(W[set], M4.ident());
  }

  function drawProp(r, W, p, opts) {
    const o = opts && opts.flat ? { flat: opts.flat } : {};
    const m = p.matrix || place(p);
    if (p.kind === 'cover' || p.kind === 'sketch') {
      const tex = p.tex ? texOf(W, p.tex.key, p.tex.w, p.tex.h, p.tex.draw) : null;
      if (p.kind === 'sketch') r.draw(W.sketch, m, o.flat ? o : (tex ? { texture: tex } : {}));
      else r.draw(W.cover, m, o.flat ? o : (tex ? { texture: tex } : {}));
      return;
    }
    if (W[p.kind]) r.draw(W[p.kind], m, o);
  }

  window.NagWorld = { build, drawSet, drawProp };
})();
