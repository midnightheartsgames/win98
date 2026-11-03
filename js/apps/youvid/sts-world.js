(function () {
  const { M4, V3, shade, rand, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, tube } = K;
  const A = window.StsArt;

  const N_Z = [0, 0, 1];
  const N_Y = [0, 1, 0];

  function wall(b, x0, y0, x1, y1, z, col, rep) {
    const ru = rep ? (x1 - x0) / rep : 1, rv = rep ? (y1 - y0) / rep : 1;
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, [[0, 0], [ru, 0], [ru, rv], [0, rv]], [N_Z, N_Z, N_Z, N_Z]);
  }

  function sideWall(b, z0, y0, z1, y1, x, col, rep, flip) {
    const ru = rep ? Math.abs(z1 - z0) / rep : 1, rv = rep ? (y1 - y0) / rep : 1;
    const n = flip ? [-1, 0, 0] : [1, 0, 0];
    b.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col, [[0, 0], [ru, 0], [ru, rv], [0, rv]], [n, n, n, n]);
  }

  function floor(b, x0, z0, x1, z1, y, col, rep) {
    const ru = rep ? (x1 - x0) / rep : 1, rv = rep ? (z1 - z0) / rep : 1;
    b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col, [[0, 0], [ru, 0], [ru, rv], [0, rv]], [N_Y, N_Y, N_Y, N_Y]);
  }

  function boxAt(b, x, y, z, sx, sy, sz, col, opts) {
    b.push(M4.translate(x, y, z));
    b.box(sx, sy, sz, col, Object.assign({ base: true }, opts || {}));
    b.pop();
  }

  function tex(r, cache, key, size, draw, opts) {
    if (!cache[key]) cache[key] = r.texture(size, draw, opts || {});
    return cache[key];
  }

  function emissive(hex) {
    return rgb(hex, 1);
  }

  function buildStream(r, T) {
    return {
      wall: mesh(r, b => { wall(b, -2.4, 0, 2.4, 2.6, -0.85, 0xffffff); }),
      wallTex: tex(r, T, 'streamWall', 256, A.streamWall),
      room: mesh(r, b => {
        floor(b, -2.4, -0.85, 2.4, 2, 0, 0x3a3028);
        boxAt(b, -1.15, 0, -0.55, 0.9, 2.1, 0.6, 0x141210);
        boxAt(b, -1.15, 0.9, -0.24, 0.84, 0.04, 0.02, 0x2a241e);
        boxAt(b, -0.62, 0, -0.1, 0.7, 0.72, 0.5, 0x2a2018);
        b.at(-0.66, 0.72, -0.1, h => h.ellipsoid(0.16, 0.12, 0.13, 8, 5, 0x2a7a4a));
        b.at(-0.5, 0.74, 0.02, h => h.ellipsoid(0.12, 0.05, 0.1, 6, 4, 0xb8bcc4));
        boxAt(b, -0.42, 0.72, 0.08, 0.12, 0.02, 0.06, 0xe8e8ea);
        boxAt(b, -0.84, 0.72, -0.2, 0.16, 0.18, 0.12, 0x5a6a7a);
        b.at(-0.36, 0.0, -0.4, h => h.prism(10, 0.08, 0.08, 0, 0.08, 0.08, 0.95, 0xe8e6e0));
      }),
      bed: mesh(r, b => {
        boxAt(b, 1.15, 0, -0.35, 1.5, 0.48, 1.3, 0xffffff);
        b.at(1.0, 0.5, -0.55, h => h.ellipsoid(0.7, 0.24, 0.32, 12, 6, 0xffffff));
        b.at(0.62, 0.5, -0.12, h => h.ellipsoid(0.4, 0.16, 0.34, 10, 5, 0xffffff));
      }),
      satin: tex(r, T, 'satin', 256, A.satin),
      wire: mesh(r, b => {
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const k = i / 24;
          const x = -0.2 + k * 2.4;
          pts.push([x, 2.0 - S(k * PI * 2.2) * 0.22 - k * 0.35, -0.82]);
        }
        tube(b, pts, pts.map(() => 0.004), 4, 0x2a2a1e);
        pts.forEach((p, i) => { if (i % 2 === 0) b.at(p[0], p[1] - 0.01, p[2] + 0.01, h => h.ellipsoid(0.011, 0.011, 0.011, 5, 3, emissive(0xfff2b0))); });
        const drop = [];
        for (let i = 0; i <= 12; i++) {
          const k = i / 12;
          drop.push([1.0 + k * 0.9, 1.62 - S(k * PI) * 0.2 + k * 0.1, -0.8]);
        }
        tube(b, drop, drop.map(() => 0.004), 4, 0x2a2a1e);
      })
    };
  }

  function drawStream(r, M) {
    r.draw(M.wall, null, { texture: M.wallTex });
    r.draw(M.room);
    r.draw(M.bed, null, { texture: M.satin });
    r.draw(M.wire);
  }

  function buildStreet(r, T) {
    const carBody = (b, len, wid, h, col, roof) => {
      b.box(wid, h * 0.55, len, col, { base: true });
      b.push(M4.translate(0, h * 0.55, -len * 0.05));
      b.prism(4, wid * 0.62, len * 0.32, 0, wid * 0.5, len * 0.22, h * 0.42, roof, { phase: PI / 4 });
      b.pop();
    };
    return {
      ground: mesh(r, b => floor(b, -12, -20, 12, 6, 0, 0xffffff, 2.5)),
      asphalt: tex(r, T, 'asphalt', 256, A.asphalt),
      blackCar: mesh(r, b => {
        b.push(M4.translate(1.75, 0.18, -0.2));
        carBody(b, 4.7, 1.8, 1.45, 0x101114, 0x1c1e24);
        b.pop();
        [[-1.5, 0.86], [1.5, 0.86]].forEach(([z, x]) => b.at(1.75 - x * 1.04, 0.33, -0.2 + z, h => { h.push(M4.rotZ(PI / 2)); h.prism(10, 0.33, 0.33, -0.12, 0.33, 0.33, 0.12, 0x101012); h.pop(); }));
      }),
      carSide: mesh(r, b => {
        const x = 1.75 - 0.905;
        b.quad([x, 0.22, 2.15], [x, 0.22, -2.55], [x, 0.98, -2.55], [x, 0.98, 2.15], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]]);
      }),
      carTex: tex(r, T, 'carSide', 512, A.carSide, { height: 128, clamp: true }),
      silverCar: mesh(r, b => {
        b.push(M4.translate(-3.1, 0.18, -2.8), M4.rotY(0.25));
        carBody(b, 4.4, 1.75, 1.45, 0xa8acb2, 0x6a7078);
        b.pop();
      }),
      far: mesh(r, b => {
        wall(b, -14, 0, 14, 7, -19, 0x8a8c90);
        boxAt(b, -6, 0, -17, 8, 9, 3, 0xb4aca0);
        boxAt(b, 5, 0, -18, 9, 12, 3, 0x9aa0a6);
      })
    };
  }

  function drawStreet(r, M) {
    r.draw(M.ground, null, { texture: M.asphalt });
    r.draw(M.far);
    r.draw(M.blackCar);
    r.draw(M.carSide, null, { texture: M.carTex });
    r.draw(M.silverCar);
  }

  function crocMesh(b) {
    const col = 0x1e2638;
    b.ellipsoid(0.06, 0.028, 0.15, 12, 6, shade(col, 0.75));
    b.at(0, 0.035, 0.03, h => h.ellipsoid(0.058, 0.052, 0.11, 12, 7, col));
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1;
      const z = -0.02 + Math.floor(i / 2) * 0.03;
      b.at(side * 0.05, 0.05 + (i % 4 < 2 ? 0.0 : 0.018), z, h => h.ellipsoid(0.01, 0.012, 0.012, 6, 3, 0x06070a));
    }
    b.at(0, 0.08, 0.06, h => h.ellipsoid(0.012, 0.008, 0.012, 6, 3, 0x06070a));
    const strap = [];
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * PI;
      strap.push([C(a) * 0.058, 0.04 + S(a) * 0.012, -0.06 - S(a) * 0.065]);
    }
    tube(b, strap, strap.map(() => 0.01), 5, shade(col, 1.1));
  }

  function buildClips(r, T) {
    return {
      wall: mesh(r, b => { wall(b, -2.4, 0, 2.6, 2.7, -2.0, 0xe8d88c); sideWall(b, -2.0, 0, 1.0, 2.7, 2.2, 0xd8c87c, 0, true); }),
      wallTex: tex(r, T, 'clipsWall', 128, A.flat('#d8c47a', 7, 0.06, ['150,130,60', 20, 0.2])),
      room: mesh(r, b => {
        floor(b, -2.4, -2.0, 2.4, 1.2, 0, 0x8a7458);
        boxAt(b, -1.55, 0, -1.6, 0.9, 2.2, 0.6, 0x14100c);
        b.at(-0.95, 0, -0.85, h => h.prism(12, 0.42, 0.42, 0.68, 0.42, 0.42, 0.72, 0x3a2418));
        b.at(-0.95, 0, -0.85, h => h.prism(6, 0.05, 0.05, 0, 0.05, 0.05, 0.68, 0x2a1810));
        boxAt(b, -1.05, 0.72, -0.8, 0.16, 0.08, 0.1, 0xe8b830);
        boxAt(b, -0.95, 0.72, -0.72, 0.1, 0.06, 0.1, 0x3a8ae0);
        boxAt(b, -0.78, 0.72, -0.7, 0.14, 0.02, 0.05, 0xe8e8ea);
        b.at(-0.2, 0.55, -0.55, h => h.ellipsoid(0.3, 0.42, 0.14, 10, 6, 0x1a1414));
        [[0.42, -1.9], [0.42, -0.1]].forEach(([x, z]) => b.at(x, 0, z, h => h.prism(6, 0.018, 0.018, 0, 0.018, 0.018, 1.15, 0x6a5430)));
        tube(b, [[0.42, 1.12, -1.9], [0.42, 1.12, -0.1]], [0.016, 0.016], 6, 0x6a5430);
        tube(b, [[0.42, 0.92, -1.9], [0.42, 0.92, -0.1]], [0.012, 0.012], 6, 0x6a5430);
      }),
      stickers: mesh(r, b => wall(b, -2.0, 0.6, -1.1, 2.1, -1.29, 0xffffff)),
      stickerTex: tex(r, T, 'stickers', 256, A.stickers),
      bed: mesh(r, b => {
        boxAt(b, 1.35, 0, -1.0, 1.7, 0.55, 2.0, 0xffffff);
        b.at(1.1, 0.55, -1.55, h => h.ellipsoid(0.6, 0.3, 0.4, 12, 6, 0xffffff));
        b.at(0.95, 0.55, -0.4, h => h.ellipsoid(0.55, 0.12, 0.5, 12, 5, 0xffffff));
      }),
      floral: tex(r, T, 'floral', 256, A.floral('#d8a050', 'rgba(160, 40, 30, 0.75)', 3))
    };
  }

  function drawClips(r, M) {
    r.draw(M.wall, null, { texture: M.wallTex });
    r.draw(M.room);
    r.draw(M.stickers, null, { texture: M.stickerTex });
    r.draw(M.bed, null, { texture: M.floral });
  }

  function buildPc(r, T) {
    return {
      wall: mesh(r, b => { wall(b, -2, 0, 2, 2.6, -0.9, 0xd8b898); sideWall(b, -0.9, 0, 1.2, 2.6, -1.3, 0xc8a888); }),
      wallTex: tex(r, T, 'pcWall', 128, A.flat('#e0c0a0', 9, 0.05, ['160,120,90', 16, 0.2])),
      desk: mesh(r, b => {
        boxAt(b, 0, 0, -0.55, 2.2, 0.74, 0.8, 0x3a2a20);
        boxAt(b, -0.55, 0.74, -0.55, 0.22, 0.48, 0.46, 0x0c0c0e);
        boxAt(b, 0.45, 0.74, -0.62, 0.22, 0.03, 0.16, 0xa8acb2);
        boxAt(b, 0.45, 0.77, -0.64, 0.05, 0.1, 0.04, 0xa8acb2);
        boxAt(b, 0.45, 0.84, -0.66, 0.66, 0.42, 0.04, 0xb4b8be);
        boxAt(b, -0.1, 0.74, -0.6, 0.1, 0.24, 0.1, 0x6a6e76);
        b.at(-0.1, 0.86, -0.545, h => h.ellipsoid(0.03, 0.04, 0.01, 8, 4, emissive(0x2a5aff)));
        const g = rand(5);
        for (let i = 0; i < 14; i++) boxAt(b, -0.9 + g() * 1.8, 0.74, -0.25 - g() * 0.2, 0.05 + g() * 0.12, 0.02 + g() * 0.05, 0.04 + g() * 0.1, [0xe8e8ea, 0xd04040, 0xe8c840, 0x40a060, 0x8a8a90][i % 5]);
        tube(b, [[-0.5, 1.0, -0.3], [-0.3, 0.85, -0.35], [-0.05, 0.78, -0.3], [0.2, 0.76, -0.32]], [0.01, 0.01, 0.01, 0.01], 5, 0x1a1a1e);
        tube(b, [[-0.6, 0.76, -0.31], [0.0, 0.745, -0.31], [0.6, 0.76, -0.31]], [0.008, 0.008, 0.008], 5, emissive(0x2a4aff));
      }),
      side: mesh(r, b => sideWall(b, -0.78, 0.75, -0.32, 1.21, -0.439, [1, 1, 1, 0], 0, false)),
      ventTex: tex(r, T, 'vent', 64, A.vent),
      screen: mesh(r, b => wall(b, 0.14, 0.87, 0.76, 1.24, -0.638, [1, 1, 1, 1])),
      callTex: tex(r, T, 'call', 256, A.callScreen, { clamp: true })
    };
  }

  function drawPc(r, M) {
    r.draw(M.wall, null, { texture: M.wallTex });
    r.draw(M.desk);
    r.draw(M.side, null, { texture: M.ventTex });
    r.draw(M.screen, null, { texture: M.callTex });
  }

  function buildLimo(r, T) {
    return {
      shell: mesh(r, b => {
        floor(b, -3, -1.3, 3, 1.3, 0, 0x101014);
        wall(b, -3, 0, 3, 1.4, -1.25, 0x18181e);
        sideWall(b, -1.3, 0, 1.3, 1.4, -2.6, 0x16161c);
        boxAt(b, 0, 0, -1.1, 5, 0.42, 0.4, 0xc8c8d0);
        boxAt(b, 0, 0.42, -1.2, 5, 0.42, 0.12, 0xd4d4dc);
        boxAt(b, -2.4, 0, -0.6, 0.4, 0.42, 1.4, 0xc8c8d0);
        boxAt(b, 1.6, 0, 0.95, 0.25, 1.6, 0.25, 0x8a1418);
        boxAt(b, 2.4, 0.42, -0.2, 0.25, 0.5, 1.3, 0x141418);
        sideWall(b, -1.3, 0, 1.3, 1.6, 2.6, 0x16161c, 0, true);
      }),
      ceiling: mesh(r, b => b.quad([-3, 1.62, 1.3], [3, 1.62, 1.3], [3, 1.62, -1.3], [-3, 1.62, -1.3], [1, 1, 1, 1], [[0, 0], [2.2, 0], [2.2, 1], [0, 1]], [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]])),
      ceilTex: tex(r, T, 'limoCeil', 256, A.limoCeiling),
      window: mesh(r, b => wall(b, -2.4, 0.9, 1.8, 1.3, -1.24, [0.04, 0.05, 0.08, 1])),
      neon: mesh(r, b => {
        const wave = [];
        for (let i = 0; i <= 30; i++) wave.push([-2.4 + i * 0.105, 0.88 + 0.03 * S(i * 1.2), -1.16]);
        tube(b, wave, wave.map(() => 0.012), 4, emissive(0x3a5aff));
        [[0.95, 0x40ff90], [1.08, 0xff3a3a], [1.2, 0xe8e8ff]].forEach(([y, col]) => tube(b, [[0.3, y, -1.1], [1.5, y - 0.05, -1.1]], [0.01, 0.01], 4, emissive(col)));
        for (let i = 0; i < 5; i++) b.at(0.6 + i * 0.18, 1.0, -1.05, h => h.prism(6, 0.025, 0.025, 0, 0.03, 0.03, 0.09, emissive([0xff3a2a, 0xff8a2a, 0xffd02a, 0xff3a8a, 0x3aff8a][i])));
        [[1.7, 0.95], [2.2, 1.0], [2.45, 0.92]].forEach(([x, y]) => {
          const ring = [];
          for (let i = 0; i <= 16; i++) ring.push([x + 0.18 * C(i / 16 * PI), y + 0.2 * S(i / 16 * PI), -1.15]);
          tube(b, ring, ring.map(() => 0.01), 4, emissive(0x40ffc0));
        });
        tube(b, [[1.82, 0.2, 0.62], [1.82, 1.35, 0.62]], [0.012, 0.012], 4, emissive(0xff2a4a));
      })
    };
  }

  function drawLimo(r, M) {
    r.draw(M.shell);
    r.draw(M.ceiling, null, { texture: M.ceilTex });
    r.draw(M.window);
    r.draw(M.neon);
  }

  function buildAirport(r, T) {
    const plane = (b) => {
      const W = 0xffffff;
      b.push(M4.rotX(PI / 2));
      b.prism(14, 1.9, 1.9, -17, 1.9, 1.9, 17, W, { capTop: false });
      b.pop();
      b.at(0, 0, 17, h => h.ellipsoid(1.9, 1.9, 3.6, 12, 6, W));
      b.at(0, 0, -17, h => h.ellipsoid(1.9, 1.9, 5, 12, 6, W));
      b.push(M4.translate(0, -0.6, 2));
      b.quad([-17, 0, -3], [0, 0, 2.5], [0, 0, -4], [-17, 0, -5.2], 0xd8dce4);
      b.quad([17, 0, -3], [17, 0, -5.2], [0, 0, -4], [0, 0, 2.5], 0xd8dce4);
      b.pop();
      b.push(M4.translate(0, 1.2, -19));
      b.quad([0, 0, 3], [0, 0, -2.5], [0, 7, -5.5], [0, 7, -2.5], 0x2a3a8a);
      b.quad([0, 0, -2.5], [0, 0, 3], [0, 7, -2.5], [0, 7, -5.5], 0x2a3a8a);
      b.pop();
      [-5.5, 5.5].forEach(x => b.at(x, -1.6, 4, h => { h.push(M4.rotX(PI / 2)); h.prism(10, 0.9, 0.9, -1.8, 0.9, 0.9, 1.8, 0xc8ccd4); h.pop(); }));
    };
    return {
      frame: mesh(r, b => {
        const F = 0x4a4e56;
        boxAt(b, -0.9, -1.0, -0.02, 0.09, 4, 0.12, F);
        boxAt(b, 1.15, -1.0, -0.02, 0.12, 4, 0.12, F);
        boxAt(b, 0, -0.02, 0, 4, 0.08, 0.2, F);
        floor(b, -3, 0, 3, 1.5, -0.02, 0x5a5a60);
      }),
      glass: mesh(r, b => wall(b, -3, -1, 3, 3, 0.0, [0.82, 0.86, 0.9, 0])),
      ground: mesh(r, b => floor(b, -400, -600, 400, 0, -9, 0xffffff, 60)),
      snowTex: tex(r, T, 'snow', 256, A.snow),
      terminal: mesh(r, b => {
        b.push(M4.translate(70, -9, -170), M4.rotY(-0.15));
        b.box(160, 20, 30, 0xffffff, { base: true, uvScale: 0.02 });
        b.pop();
      }),
      termTex: tex(r, T, 'terminal', 256, A.terminal),
      props: mesh(r, b => {
        b.at(18, -9, -150, h => h.prism(6, 0.6, 0.6, 0, 0.4, 0.4, 32, 0x8a8e94));
        boxAt(b, 18, 23, -150, 4, 1.5, 1, 0x8a8e94);
        b.at(-14, -9, -200, h => h.prism(6, 0.5, 0.5, 0, 0.35, 0.35, 26, 0x8a8e94));
        b.push(M4.translate(52, -3.5, -95), M4.rotY(-0.6));
        b.box(26, 3.2, 3.2, 0xa8acb4, { base: true });
        b.pop();
        boxAt(b, 40, -9, -78, 4, 5.4, 4, 0x9aa0a8);
        [[8, -58, 0.2], [13, -57, 0.1], [36, -66, 0.4], [-2, -70, 0.3], [-30, -61, 0.1], [55, -96, 0.6]].forEach(([x, z, a]) => {
          b.push(M4.translate(x, -9, z), M4.rotY(a));
          b.box(2.5, 2.4, 6, 0xd8d8dc, { base: true });
          b.at(0, 0, 3.6, h => h.box(2.5, 3.0, 2, 0xe8e8ec, { base: true }));
          b.pop();
        });
      }),
      plane: mesh(r, b => {
        b.push(M4.translate(28, -5.2, -78), M4.rotY(1.12));
        plane(b);
        b.pop();
      }),
      livery: mesh(r, b => {
        b.push(M4.translate(28, -5.2, -78), M4.rotY(1.12), M4.translate(1.93, 0, 0));
        b.quad([0, -1.5, 15], [0, -1.5, -16], [0, 1.6, -16], [0, 1.6, 15], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
        b.pop();
      }),
      liveryTex: tex(r, T, 'livery', 512, A.livery, { height: 128, clamp: true }),
      flakes: mesh(r, b => {
        const g = rand(77);
        for (let i = 0; i < 260; i++) b.at((g() - 0.5) * 30, -6 + g() * 14, -2 - g() * 26, h => h.box(0.05, 0.05, 0.05, [0.95, 0.96, 1.0, 1]));
      })
    };
  }

  function drawAirport(r, M, st) {
    r.draw(M.ground, null, { texture: M.snowTex });
    r.draw(M.terminal, null, { texture: M.termTex });
    r.draw(M.props);
    r.draw(M.plane);
    r.draw(M.livery, null, { texture: M.liveryTex });
    const drift = (st.t * 3.2) % 8;
    r.draw(M.flakes, M4.translate(-drift * 0.6, -drift, 0));
    r.draw(M.flakes, M4.translate(-drift * 0.6, 8 - drift, 0));
    r.draw(M.frame);
    r.draw(M.glass, null, { blend: true, alpha: 0.12 });
  }

  function buildBeach(r, T) {
    return {
      sky: mesh(r, b => {
        b.push(M4.scale(-1, 1, 1));
        K.spherePatch(b, 600, 300, 600, -PI, PI, -0.05, PI / 2, 24, 8, [1, 1, 1, 1], [1, 1]);
        b.pop();
      }),
      skyTex: tex(r, T, 'beachSky', 256, A.skyClouds('#5a8ed8', '#d8e8f4')),
      sand: mesh(r, b => {
        const nx = 16, nz = 16;
        const hgt = (x, zz) => {
          const z = zz - 0.32 * x;
          return z > -6 ? 0.05 * S(x * 0.7) * S(z * 0.9) + (z < -3 ? (z + 3) * 0.06 : 0) : -0.18 + (z + 6) * 0.04;
        };
        for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
          const x0 = -20 + i * 2.5, x1 = x0 + 2.5, z0 = 8 - j * 1.0, z1 = z0 - 1.0;
          b.quad([x0, hgt(x0, z0), z0], [x1, hgt(x1, z0), z0], [x1, hgt(x1, z1), z1], [x0, hgt(x0, z1), z1], 0xffffff, [[x0 / 3, z0 / 3], [x1 / 3, z0 / 3], [x1 / 3, z1 / 3], [x0 / 3, z1 / 3]], [N_Y, N_Y, N_Y, N_Y]);
        }
      }),
      sandTex: tex(r, T, 'sand', 256, A.sand),
      sea: mesh(r, b => floor(b, -500, -900, 500, -6.5, 0, 0xffffff, 6)),
      seaTex: tex(r, T, 'sea', 256, A.sea),
      head: mesh(r, b => b.quad([-420, 0, -800], [-60, 0, -800], [-60, 34, -800], [-420, 34, -800], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [N_Z, N_Z, N_Z, N_Z])),
      headTex: tex(r, T, 'headland', 256, A.headland, { height: 64, clamp: true }),
      splash: mesh(r, b => {
        const g = rand(9);
        for (let i = 0; i < 40; i++) b.at((g() - 0.5) * 0.9, g() * 0.6, (g() - 0.5) * 0.6, h => h.ellipsoid(0.05 + g() * 0.06, 0.05 + g() * 0.08, 0.05, 5, 3, [0.95, 0.97, 1.0, 0.6]));
      })
    };
  }

  function drawBeach(r, M, st) {
    r.draw(M.sky, null, { texture: M.skyTex, noFog: true });
    r.draw(M.head, null, { texture: M.headTex });
    r.draw(M.sea, null, { texture: M.seaTex, uvScroll: [st.t * 0.01, st.t * 0.004] });
    r.draw(M.sand, null, { texture: M.sandTex });
    if (st.splash) r.draw(M.splash, M4.chain(M4.translate(st.splash.p[0], 0, st.splash.p[2]), M4.scale(st.splash.k, st.splash.k, st.splash.k)));
  }

  function buildRen(r, T) {
    return {
      wall: mesh(r, b => { wall(b, -2, 0, 2, 2.6, -1.1, 0xffffff); sideWall(b, -1.1, 0, 1.2, 2.6, 1.5, 0xe0e0e0, 0, true); }),
      wallTex: tex(r, T, 'renWall', 256, A.renWall),
      sofa: mesh(r, b => {
        boxAt(b, 0, 0, -0.7, 2.6, 0.45, 0.8, 0xc8461e);
        boxAt(b, 0, 0.45, -1.0, 2.6, 0.42, 0.2, 0xd04a20);
        b.at(-0.7, 0.75, -0.85, h => h.ellipsoid(0.55, 0.2, 0.15, 10, 5, 0xd85024));
        b.at(0.75, 0.75, -0.85, h => h.ellipsoid(0.55, 0.2, 0.15, 10, 5, 0xd04a22));
        b.at(1.15, 0.5, -0.4, h => h.ellipsoid(0.35, 0.25, 0.4, 10, 5, 0x1a1e1c));
        floor(b, -2, -1.1, 2, 1.5, 0, 0x4a3a30);
      })
    };
  }

  function drawRen(r, M) {
    r.draw(M.wall, null, { texture: M.wallTex });
    r.draw(M.sofa);
  }

  function buildPark(r, T) {
    const trunk = (b, x, z, h, lean) => {
      tube(b, [[x, 0, z], [x + lean * 0.4, h * 0.5, z], [x + lean, h, z - 0.2]], [0.16, 0.12, 0.08], 6, 0x4a3e30);
    };
    return {
      ground: mesh(r, b => { floor(b, -30, -40, 30, 8, 0, 0xffffff, 3); }),
      asphalt: tex(r, T, 'asphalt', 256, A.asphalt),
      static: mesh(r, b => {
        boxAt(b, -12, 0, -2.6, 24, 0.14, 0.25, 0xc8c8c4);
        floor(b, -14, -5, 14, -2.75, 0.02, 0x4a6a2e);
        for (let i = 0; i < 40; i++) b.at(-10 + i * 0.5, 0, -3.1, h => h.prism(4, 0.015, 0.015, 0, 0.015, 0.015, 0.75, 0x2a4a2a));
        tube(b, [[-10, 0.72, -3.1], [10, 0.72, -3.1]], [0.02, 0.02], 4, 0x2a4a2a);
        tube(b, [[-10, 0.3, -3.1], [10, 0.3, -3.1]], [0.015, 0.015], 4, 0x2a4a2a);
        trunk(b, -3.4, -4.2, 7.5, 0.3);
        trunk(b, -0.6, -5.5, 8.5, -0.2);
        trunk(b, 1.3, -4.6, 7.0, 0.5);
        trunk(b, 3.6, -5.2, 8.0, -0.3);
        trunk(b, -5.5, -6, 8, 0.2);
        trunk(b, 5.8, -6.5, 7.5, 0.1);
        boxAt(b, -10, 0, -16, 12, 8, 4, 0xe8e0d0);
        boxAt(b, 9, 0, -14, 6, 5, 4, 0xd8c8b0);
        boxAt(b, 3, 0, -22, 14, 12, 4, 0xe4dccc);
        b.push(M4.translate(2.4, 0, -2.0), M4.rotY(0.2));
        b.box(1.75, 0.8, 4.0, 0xeeeeee, { base: true });
        b.at(0, 0.8, -0.3, h => h.prism(4, 1.2, 1.5, 0, 1.0, 1.1, 0.6, 0xe8e8ea, { phase: PI / 4 }));
        b.pop();
        [-1, 1].forEach(s => b.at(2.4 + s * 0.88, 0.32, -0.8, h => { h.push(M4.rotZ(PI / 2)); h.prism(10, 0.32, 0.32, -0.1, 0.32, 0.32, 0.1, 0x18181a); h.pop(); }));
      }),
      foliage: mesh(r, b => {
        const g = rand(13);
        for (let i = 0; i < 30; i++) {
          const x = -9 + g() * 18, y = 3.8 + g() * 5.0, z = -4 - g() * 4;
          const s = 1.0 + g() * 1.3;
          b.quad([x - s, y - s, z], [x + s, y - s, z], [x + s, y + s, z], [x - s, y + s, z], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [N_Z, N_Z, N_Z, N_Z]);
        }
      }),
      leafTex: tex(r, T, 'foliage', 128, A.foliage, { clamp: true })
    };
  }

  function drawPark(r, M, st) {
    r.draw(M.ground, null, { texture: M.asphalt });
    r.draw(M.static);
    r.draw(M.foliage, M4.translate(0.03 * S(st.t * 1.3), 0, 0), { texture: M.leafTex });
  }

  function buildJuice(r, T) {
    return {
      wall: mesh(r, b => wall(b, -2, 0, 2, 2.6, -0.65, 0xffffff, 1.2)),
      wallTex: tex(r, T, 'juiceWall', 256, A.juiceWall),
      table: mesh(r, b => boxAt(b, 0.2, 0, 0.05, 1.4, 0.74, 0.6, 0x3a2a1e))
    };
  }

  function drawJuice(r, M) {
    r.draw(M.wall, null, { texture: M.wallTex });
    r.draw(M.table);
  }

  function buildProps(r, T) {
    return {
      croc: mesh(r, crocMesh),
      thing: mesh(r, b => {
        b.prism(10, 0.013, 0.013, -0.06, 0.016, 0.016, 0.06, 0x08080a);
        b.at(0, 0.06, 0, h => h.prism(10, 0.016, 0.016, 0, 0.021, 0.019, 0.12, 0x0c0c0e));
        b.at(0, 0.19, 0, h => h.ellipsoid(0.021, 0.026, 0.019, 8, 5, 0x0c0c0e));
        b.at(0.0, 0.12, 0.018, h => h.box(0.005, 0.1, 0.004, rgb(0x4a4e56)));
      }),
      pack: mesh(r, b => {
        b.box(0.095, 0.2, 0.06, [1, 1, 1, 0], { base: true });
      }),
      packTop: mesh(r, b => {
        b.push(M4.translate(0, 0.2, 0));
        b.prism(4, 0.067, 0.042, 0, 0.067, 0.004, 0.035, 0xf0eef0, { phase: PI / 4 });
        b.pop();
        b.at(0.02, 0.215, 0.012, h => h.prism(8, 0.01, 0.01, 0, 0.01, 0.01, 0.018, 0xe8e8ea));
      }),
      packTex: tex(r, T, 'juicePack', 128, A.juicePack, { clamp: true }),
      carton: mesh(r, b => {
        b.box(0.07, 0.11, 0.045, 0x5aa83a, { base: true });
        b.at(0, 0.11, 0, h => h.prism(4, 0.05, 0.032, 0, 0.05, 0.004, 0.025, 0xe8f0e0, { phase: PI / 4 }));
      }),
      garment: mesh(r, b => {
        const g = rand(4);
        for (let i = 0; i < 9; i++) b.at((g() - 0.5) * 0.12, -i * 0.05, (g() - 0.5) * 0.08, h => h.ellipsoid(0.12 - i * 0.006, 0.06, 0.06, 7, 4, i % 2 ? 0x141416 : 0x1c1c20));
      }),
      sun: mesh(r, b => K.discXY(b, 0, 0, 0, 1, 20, [1, 1, 0.94, 1])),
      glow: mesh(r, b => {
        for (let i = 0; i < 20; i++) {
          const a0 = (i / 20) * PI * 2, a1 = ((i + 1) / 20) * PI * 2;
          b.tri([0, 0, 0], [C(a0), S(a0), 0], [C(a1), S(a1), 0], [[1, 1, 0.92, 1], [0, 0, 0, 1], [0, 0, 0, 1]]);
        }
      })
    };
  }

  function buildGreece(r, T) {
    const house = (b, x, z, w, h, d, roof) => {
      boxAt(b, x, 0, z, w, h, d, 0xffffff, { uvScale: 0.25 });
      if (roof) {
        b.push(M4.translate(x, h, z));
        b.quad([-w / 2 - 0.2, 0, d / 2 + 0.3], [w / 2 + 0.2, 0, d / 2 + 0.3], [w / 2 + 0.2, 0.9, 0], [-w / 2 - 0.2, 0.9, 0], roof);
        b.quad([w / 2 + 0.2, 0, -d / 2 - 0.3], [-w / 2 - 0.2, 0, -d / 2 - 0.3], [-w / 2 - 0.2, 0.9, 0], [w / 2 + 0.2, 0.9, 0], shade(roof, 0.8));
        b.pop();
      }
    };
    return {
      ground: mesh(r, b => floor(b, -40, -60, 40, 12, 0, 0xffffff, 4)),
      gravel: tex(r, T, 'gravel', 256, A.gravel),
      houses: mesh(r, b => {
        house(b, -10.4, -17, 5.5, 3.2, 5, null);
        house(b, -4.6, -18.5, 4.2, 2.6, 4, null);
        house(b, -8.8, -21.5, 7, 5.8, 5, null);
        house(b, -0.4, -22, 6, 4.6, 5, null);
        house(b, 9.5, -19, 10, 3.0, 5, null);
        house(b, 12, -26, 6, 6.5, 5, null);
        boxAt(b, 5.5, 0, -17.2, 11, 2.2, 0.3, 0xffffff, { uvScale: 0.25 });
      }),
      stucco: tex(r, T, 'stucco', 128, A.stucco),
      roofs: mesh(r, b => {
        b.push(M4.translate(-10.4, 3.2, -17));
        b.quad([-3.0, 0, 2.8], [3.0, 0, 2.8], [3.0, 1.0, 0], [-3.0, 1.0, 0], 0xffffff, [[0, 0], [3, 0], [3, 1], [0, 1]]);
        b.pop();
        b.push(M4.translate(-8.8, 5.8, -21.5));
        b.quad([-3.8, 0, 2.8], [3.8, 0, 2.8], [3.8, 0.6, 0], [-3.8, 0.6, 0], 0xffffff, [[0, 0], [3, 0], [3, 1], [0, 1]]);
        b.pop();
        b.push(M4.translate(-0.4, 4.6, -22));
        b.quad([-3.3, 0, 2.8], [3.3, 0, 2.8], [3.3, 0.7, 0], [-3.3, 0.7, 0], 0xffffff, [[0, 0], [3, 0], [3, 1], [0, 1]]);
        b.pop();
      }),
      roofTex: tex(r, T, 'roof', 128, A.roofTiles),
      details: mesh(r, b => {
        boxAt(b, -11.6, 0, -14.45, 1.5, 2.2, 0.06, 0x5a3a28);
        boxAt(b, -9.2, 1.0, -14.45, 1.6, 0.9, 0.06, 0x3a2a24);
        boxAt(b, -4.2, 0, -16.45, 0.9, 2.0, 0.06, 0x4a3226);
        boxAt(b, 7.0, 0, -17.0, 0.9, 1.9, 0.06, 0x2a7ac8);
        boxAt(b, -6.6, 0, -14.6, 0.8, 0.9, 0.6, 0x6a8a3a);
        b.at(-6.6, 0.9, -14.6, h => h.ellipsoid(0.6, 0.5, 0.5, 8, 5, 0x5a7a32));
        [-7, 0.0, 7.5].forEach(x => b.at(x, 0, -15.8, h => h.prism(6, 0.09, 0.09, 0, 0.07, 0.07, 7.5, 0x6a6a64)));
        tube(b, [[-16, 7.1, -15.8], [-7, 6.6, -15.8], [0, 6.9, -15.8], [7.5, 6.5, -15.8], [18, 7.0, -15.8]], [0.02, 0.02, 0.02, 0.02, 0.02], 3, 0x2a2a2a);
        tube(b, [[-16, 9.5, -11], [0, 8.6, -12], [18, 9.2, -13]], [0.02, 0.02, 0.02], 3, 0x2a2a2a);
        b.at(-2.0, 1.2, -16.9, h => h.box(3.5, 0.06, 1.2, 0x5a9a6a));
      }),
      rail: mesh(r, b => wall(b, 0.0, 2.2, 11.0, 2.95, -17.0, 0xffffff)),
      railTex: tex(r, T, 'balustrade', 256, A.balustrade, { height: 64 }),
      hill: mesh(r, b => {
        const nx = 12, ny = 6;
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const x0 = -60 + i * 10, x1 = x0 + 10;
          const y0 = j * 6, y1 = y0 + 6;
          const z = (y) => -24 - y * 0.7;
          const bump = (x, y) => 1.5 * S(x * 0.21 + y * 0.3);
          b.quad([x0, y0, z(y0) + bump(x0, y0)], [x1, y0, z(y0) + bump(x1, y0)], [x1, y1, z(y1) + bump(x1, y1)], [x0, y1, z(y1) + bump(x0, y1)], 0xffffff, [[i / nx, j / ny], [(i + 1) / nx, j / ny], [(i + 1) / nx, (j + 1) / ny], [i / nx, (j + 1) / ny]], [N_Z, N_Z, N_Z, N_Z]);
        }
      }),
      hillTex: tex(r, T, 'hill', 512, A.hill, { height: 256 }),
      shrubs: mesh(r, b => {
        const g = rand(31);
        for (let i = 0; i < 40; i++) b.at(-30 + g() * 60, 0, -21 - g() * 4, h => h.ellipsoid(1.2 + g() * 1.5, 1.5 + g() * 2, 1.0, 7, 4, g() < 0.5 ? 0x3a5a2a : 0x4a6a32));
      })
    };
  }

  function drawGreece(r, M) {
    r.draw(M.hill, null, { texture: M.hillTex });
    r.draw(M.shrubs);
    r.draw(M.ground, null, { texture: M.gravel });
    r.draw(M.houses, null, { texture: M.stucco });
    r.draw(M.roofs, null, { texture: M.roofTex });
    r.draw(M.details);
    r.draw(M.rail, null, { texture: M.railTex });
  }

  function buildSea(r, T) {
    return {
      surface: mesh(r, b => b.quad([-40, 0, 40], [40, 0, 40], [40, 0, -40], [-40, 0, -40], [1, 1, 1, 1], [[0, 0], [10, 0], [10, 10], [0, 10]], [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]])),
      rippleTex: tex(r, T, 'ripple', 256, A.ripple),
      bottom: mesh(r, b => floor(b, -40, -40, 40, 40, -4.5, 0x6a8a6a)),
      top: mesh(r, b => floor(b, -800, -800, 800, 800, 0, 0xffffff, 8)),
      seaTex: tex(r, T, 'sea2', 256, A.sea),
      sky: mesh(r, b => {
        b.push(M4.scale(-1, 1, 1));
        K.spherePatch(b, 600, 300, 600, -PI, PI, -0.05, PI / 2, 24, 8, [1, 1, 1, 1], [1, 1]);
        b.pop();
      }),
      skyTex: tex(r, T, 'deepSky', 256, A.skyClouds('#1a4ab8', '#8ab4e8')),
      coast: mesh(r, b => {
        b.quad([-600, 0, -700], [-150, 0, -700], [-150, 18, -700], [-600, 26, -700], [0.32, 0.36, 0.3, 0]);
        b.quad([200, 0, -650], [600, 0, -650], [600, 10, -650], [200, 22, -650], [0.3, 0.34, 0.3, 0]);
      }),
      sun: mesh(r, b => K.discXY(b, 0, 0, 0, 1, 18, [1, 1, 0.94, 1])),
      bubbles: mesh(r, b => {
        const g = rand(17);
        for (let i = 0; i < 70; i++) b.at((g() - 0.5) * 1.6, -g() * 1.6, (g() - 0.5) * 1.2, h => h.ellipsoid(0.008 + g() * 0.02, 0.008 + g() * 0.02, 0.008 + g() * 0.02, 5, 3, [0.9, 1, 1, 0.8]));
      })
    };
  }

  function drawSea(r, M, st) {
    if (st.under) {
      r.draw(M.bottom);
      r.draw(M.surface, null, { texture: M.rippleTex, noFog: true, uvScroll: [st.t * 0.05, st.t * 0.03] });
    } else {
      r.draw(M.sky, null, { texture: M.skyTex, noFog: true });
      r.draw(M.coast, null, { noFog: true });
      r.draw(M.top, null, { texture: M.seaTex, uvScroll: [st.t * 0.02, 0] });
    }
  }

  function buildTowel(r, T) {
    return {
      wall: mesh(r, b => { wall(b, -2.2, 0, 2.2, 2.6, -2.1, 0xffffff, 1.0); sideWall(b, -2.1, 0, 1.6, 2.6, -1.9, 0xffffff, 1.0, false); }),
      wallTex: tex(r, T, 'towelWall', 256, A.towelWall),
      door: mesh(r, b => {
        boxAt(b, -0.35, 0, -2.08, 1.02, 2.06, 0.05, 0xc8b89a);
        wall(b, -0.8, 0, 0.1, 2.0, -2.04, 0xffffff);
      }),
      doorTex: tex(r, T, 'doorBrown', 128, A.door('#6a4430', '#5a3826'), { clamp: true }),
      gear: mesh(r, b => {
        b.at(-1.25, 0, -1.2, h => h.prism(5, 0.012, 0.012, 0, 0.012, 0.012, 1.7, 0x141416));
        b.at(-1.22, 1.7, -1.15, h => h.ellipsoid(0.2, 0.2, 0.16, 10, 6, 0x101012));
        b.push(M4.translate(-1.0, 1.75, -1.25), M4.rotZ(-0.5), M4.rotX(-0.3));
        b.prism(14, 0.55, 0.55, -0.25, 0.04, 0.04, 0.15, 0xe8e8ec);
        b.pop();
        b.at(-1.45, 0, -1.6, h => h.box(0.5, 2.2, 0.4, 0x1a1612, { base: true }));
        b.at(1.0, 0, -1.0, h => h.prism(5, 0.012, 0.012, 0, 0.012, 0.012, 1.5, 0x141416));
        b.at(1.0, 1.52, -1.0, h => h.ellipsoid(0.17, 0.17, 0.14, 10, 6, 0x101012));
        [[1.0, -0.3], [1.0, 0.3]].forEach(([x, dz]) => tube(b, [[x, 0.9, -1.0], [x + dz, 0.0, -1.0 + dz * 0.5]], [0.01, 0.01], 4, 0x141416));
        b.at(1.32, 1.05, -1.2, h => h.ellipsoid(0.24, 0.4, 0.16, 8, 5, 0x141416));
        b.at(0.62, 1.25, -1.5, h => h.ellipsoid(0.2, 0.45, 0.14, 8, 5, 0x18181a));
        b.at(1.15, 0.3, -1.0, h => h.ellipsoid(0.35, 0.3, 0.25, 8, 5, 0xd8d8dc));
        floor(b, -2.2, -2.1, 2.2, 2.0, 0, 0x6a5a48);
      }),
      chair: mesh(r, b => {
        b.push(M4.translate(-0.48, 0.0, 0.5), M4.rotY(0.25));
        b.at(0, 0.55, 0, h => h.ellipsoid(0.2, 0.55, 0.08, 10, 6, 0xd8c8a8));
        b.at(0.03, 0.75, 0.06, h => h.ellipsoid(0.2, 0.42, 0.06, 10, 6, 0xe8642a));
        b.pop();
        tube(b, [[-0.36, 0.42, 0.62], [-0.06, 0.45, 0.58], [0.18, 0.42, 0.62]], [0.06, 0.06, 0.06], 8, 0xe8e0d8);
      })
    };
  }

  function drawTowel(r, M) {
    r.draw(M.wall, null, { texture: M.wallTex });
    r.draw(M.door, null, { texture: M.doorTex });
    r.draw(M.gear);
    r.draw(M.chair);
  }

  function buildStudio(r, T) {
    return {
      wall: mesh(r, b => wall(b, -2, 0, 2, 2.6, -0.95, 0xffffff)),
      wallTex: tex(r, T, 'studioWall', 128, A.studioWall),
      bits: mesh(r, b => {
        boxAt(b, -0.95, 0, -0.93, 0.08, 2.1, 0.05, 0x1e3a40);
        boxAt(b, -1.45, 0, -0.93, 0.08, 2.1, 0.05, 0x1e3a40);
        boxAt(b, -1.2, 2.06, -0.93, 0.58, 0.07, 0.05, 0x1e3a40);
        boxAt(b, -1.2, 0, -0.96, 0.44, 2.05, 0.02, 0x16282c);
        boxAt(b, 0.62, 1.22, -0.92, 0.09, 0.09, 0.04, 0xf0f0ec);
        boxAt(b, 0.66, 1.31, -0.935, 0.02, 1.3, 0.02, 0xe8e8e4);
        b.push(M4.translate(0, 0.45, -0.52), M4.rotX(-0.08));
        b.box(0.6, 0.82, 0.14, 0x2a1418, { base: true });
        b.pop();
      }),
      sign: mesh(r, b => wall(b, -0.62, 1.42, -0.42, 1.68, -0.94, 0xffffff)),
      signTex: tex(r, T, 'sign', 128, A.sign, { clamp: true })
    };
  }

  function drawStudio(r, M) {
    r.draw(M.wall, null, { texture: M.wallTex });
    r.draw(M.bits);
    r.draw(M.sign, null, { texture: M.signTex });
  }

  function buildBra(r, T) {
    return {
      wall: mesh(r, b => { wall(b, -2, 0, 2, 2.6, -0.95, 0xe8dcc0); sideWall(b, -0.95, 0, 1.0, 2.6, 1.1, 0xe0d4b8, 0, true); }),
      poster: mesh(r, b => wall(b, -0.5, 1.6, 0.95, 2.3, -0.94, 0xffffff)),
      posterTex: tex(r, T, 'poster', 256, A.poster, { height: 128 }),
      chair: mesh(r, b => {
        b.push(M4.translate(0.05, 0.5, -0.45));
        b.box(0.66, 1.1, 0.16, 0x141418, { base: true });
        [-1, 1].forEach(s => b.at(s * 0.36, 0.55, 0.05, h => h.box(0.12, 0.65, 0.18, 0x18181c, { base: true })));
        b.at(0, 1.08, 0, h => h.box(0.36, 0.18, 0.14, 0x101014, { base: true }));
        b.pop();
        boxAt(b, -0.85, 0, -0.6, 0.4, 2.2, 0.5, 0x1a1614);
      }),
      cushion: mesh(r, b => b.at(0.62, 0.72, -0.25, h => h.ellipsoid(0.24, 0.24, 0.12, 10, 6, 0xffffff))),
      paisley: tex(r, T, 'paisley', 128, A.paisley)
    };
  }

  function drawBra(r, M) {
    r.draw(M.wall);
    r.draw(M.poster, null, { texture: M.posterTex });
    r.draw(M.chair);
    r.draw(M.cushion, null, { texture: M.paisley });
  }

  function arcPts(cx, cy, r0, r1, a0, a1, n) {
    const outer = [], inner = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      outer.push([cx + C(a) * r1, cy + S(a) * r1]);
      inner.push([cx + C(a) * r0, cy + S(a) * r0]);
    }
    return { outer, inner };
  }

  function extrudeStrip(b, outer, inner, depth, front, sideCol) {
    const n = outer.length;
    for (let i = 0; i < n - 1; i++) {
      const o0 = outer[i], o1 = outer[i + 1], i0 = inner[i], i1 = inner[i + 1];
      b.quad([i0[0], i0[1], depth], [o0[0], o0[1], depth], [o1[0], o1[1], depth], [i1[0], i1[1], depth], front, null, [N_Z, N_Z, N_Z, N_Z]);
      b.quad([o0[0], o0[1], 0], [o1[0], o1[1], 0], [o1[0], o1[1], depth], [o0[0], o0[1], depth], sideCol);
      b.quad([i1[0], i1[1], 0], [i0[0], i0[1], 0], [i0[0], i0[1], depth], [i1[0], i1[1], depth], shade(sideCol, 0.8));
    }
    [[outer[0], inner[0]], [inner[n - 1], outer[n - 1]]].forEach(([a, c]) => b.quad([a[0], a[1], 0], [c[0], c[1], 0], [c[0], c[1], depth], [a[0], a[1], depth], shade(sideCol, 0.9)));
  }

  function letterC(b, x, y, s, front, side) {
    const { outer, inner } = arcPts(x, y, s * 0.36, s * 0.86, 0.72, PI * 2 - 0.72, 16);
    extrudeStrip(b, outer, inner, s * 0.7, front, side);
  }

  function letterT(b, x, y, s, front, side) {
    extrudeStrip(b, [[x - s * 0.8, y + s * 0.86], [x + s * 0.8, y + s * 0.86]], [[x - s * 0.8, y + s * 0.4], [x + s * 0.8, y + s * 0.4]], s * 0.7, front, side);
    extrudeStrip(b, [[x - s * 0.26, y + s * 0.42], [x - s * 0.26, y - s * 0.86]], [[x + s * 0.26, y + s * 0.42], [x + s * 0.26, y - s * 0.86]], s * 0.7, front, side);
  }

  function buildLogo(r) {
    const front = [1.0, 0.94, 0.7, 0], side = [0.88, 0.58, 0.18, 0], top = [1.0, 0.97, 0.84, 0];
    return mesh(r, b => {
      b.push(M4.scale(1.25, 1.25, 1.25), M4.rotY(-0.78), M4.rotX(0.42));
      letterC(b, -1.12, -0.42, 0.8, front, side);
      b.at(0, 0, -0.35, h => letterT(h, -0.05, 0.42, 0.78, top, side));
      letterC(b, 1.02, -0.2, 0.8, front, side);
      b.pop();
    });
  }

  const SETS = {
    stream: [buildStream, drawStream],
    street: [buildStreet, drawStreet],
    clips: [buildClips, drawClips],
    pc: [buildPc, drawPc],
    limo: [buildLimo, drawLimo],
    airport: [buildAirport, drawAirport],
    beach: [buildBeach, drawBeach],
    ren: [buildRen, drawRen],
    park: [buildPark, drawPark],
    juice: [buildJuice, drawJuice],
    greece: [buildGreece, drawGreece],
    sea: [buildSea, drawSea],
    towel: [buildTowel, drawTowel],
    studio: [buildStudio, drawStudio],
    bra: [buildBra, drawBra]
  };

  function build(r) {
    const T = {};
    const built = {};
    return {
      T,
      logo: buildLogo(r),
      props: buildProps(r, T),
      get(name) {
        if (!built[name]) built[name] = SETS[name][0](r, T);
        return built[name];
      }
    };
  }

  function draw(r, W, name, st) {
    if (!SETS[name]) return;
    SETS[name][1](r, W.get(name), st);
  }

  window.StsWorld = { SETS, build, draw };
})();
