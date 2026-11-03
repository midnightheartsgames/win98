(function () {
  const { M4, Builder, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp } = K;
  const A = window.KafkaArt;

  const COL = {
    wall: 0x5a5462,
    wallDark: 0x3a3442,
    pilaster: 0x8c8494,
    trim: 0xb8a480,
    door: 0x7a1c26,
    doorDark: 0x4a0e16,
    stone: 0xc8c0b6,
    stoneDark: 0x8a8278,
    step: 0xd4ccc2,
    riser: 0x6a625a,
    ceiling: 0x2c2832,
    velvet: 0x1e2a4a,
    bulb: [1.0, 0.86, 0.6, 1],
    brass: 0xa88a54,
    frame: 0x4a3a2a,
    corridor: 0x48425a,
    corridorDark: 0x262230,
    lamp: [0.96, 0.9, 1.0, 1],
    liftWall: 0x3a3450,
    liftPanel: 0x4c4466,
    bronze: 0x8a6a4e,
    rock: 0x6a6c78,
    rockDark: 0x464854,
    dust: 0x585a66,
    steel: 0x4a4c58,
    seat: 0x8a1022,
    seatDark: 0x4a0812,
    curtain: 0x9a1424,
    carpet: 0x3a0a12,
    casing: 0xc8a050
  };

  function box(b, pos, size, col, rot) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rot) b.push(rot);
    b.box(size[0], size[1], size[2], col);
    if (rot) b.pop();
    b.pop();
  }

  function quadUV(b, a, bb, c, d, col, us, vs) {
    b.quad(a, bb, c, d, col, [[0, 0], [us, 0], [us, vs], [0, vs]]);
  }

  function baluster(b, x, y, z, h, col) {
    b.push(M4.translate(x, y, z));
    b.prism(6, 0.05, 0.05, 0, 0.09, 0.09, h * 0.35, col, { capTop: false });
    b.prism(6, 0.09, 0.09, h * 0.35, 0.04, 0.04, h * 0.85, col, { capTop: false });
    b.prism(6, 0.04, 0.04, h * 0.85, 0.06, 0.06, h, col);
    b.pop();
  }

  function balustrade(b, x0, z0, x1, z1, y, h, col) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(2, Math.round(len / 0.3));
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      baluster(b, lerp(x0, x1, k), y, lerp(z0, z1, k), h, col);
    }
    const ang = Math.atan2(x1 - x0, z1 - z0);
    box(b, [(x0 + x1) / 2, y + h + 0.05, (z0 + z1) / 2], [0.2, 0.1, len + 0.2], col, M4.rotY(ang));
    box(b, [(x0 + x1) / 2, y + 0.04, (z0 + z1) / 2], [0.18, 0.08, len + 0.1], col, M4.rotY(ang));
  }

  function chandelier(b, x, y, z, s) {
    b.push(M4.translate(x, y, z), M4.scale(s, s, s));
    K.tube(b, [[0, 0, 0], [0, 3, 0]], [0.03, 0.03], 5, COL.brass);
    b.prism(12, 0.25, 0.25, -0.3, 0.12, 0.12, 0.2, COL.brass);
    K.tube(b, Array.from({ length: 17 }, (_, i) => [C(i / 16 * PI * 2) * 1.0, -0.15, S(i / 16 * PI * 2) * 1.0]), new Array(17).fill(0.04), 5, COL.brass);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2;
      K.tube(b, [[0, -0.05, 0], [C(a) * 0.5, -0.3, S(a) * 0.5], [C(a), -0.15, S(a)]], [0.025, 0.025, 0.025], 4, COL.brass);
      b.push(M4.translate(C(a), 0.0, S(a)));
      b.ellipsoid(0.14, 0.16, 0.14, 8, 5, COL.bulb);
      b.pop();
    }
    b.pop();
  }

  function stairs(b, x0, x1, zBottom, zTop, yTop, steps) {
    const dz = (zTop - zBottom) / steps;
    const dy = yTop / steps;
    for (let i = 0; i < steps; i++) {
      const z = zBottom + dz * i;
      const y = dy * i;
      b.quad([x0, y, z], [x1, y, z], [x1, y + dy, z], [x0, y + dy, z], COL.riser);
      b.quad([x0, y + dy, z], [x1, y + dy, z], [x1, y + dy, z + dz], [x0, y + dy, z + dz], COL.step);
    }
    [x0, x1].forEach(x => b.tri([x, 0, zBottom], [x, 0, zTop], [x, yTop, zTop], COL.stoneDark));
  }

  function hallSet(r) {
    const main = new Builder();
    const glow = new Builder();
    const floor = new Builder();
    const glass = new Builder();
    const roses = new Builder();
    const paint = [new Builder(), new Builder(), new Builder()];
    quadUV(floor, [-9, 0, 6], [9, 0, 6], [9, 0, -14], [-9, 0, -14], [1, 1, 1, 0], 9, 10);
    main.quad([-9, 0, -14], [9, 0, -14], [9, 9, -14], [-9, 9, -14], COL.wall);
    main.quad([-9, 9, 6], [9, 9, 6], [9, 9, -14], [-9, 9, -14], COL.ceiling);
    [-1, 1].forEach(s => {
      const x = s * 9;
      main.quad([x, 0, 6], [x, 0, -14], [x, 9, -14], [x, 9, 6], COL.wall);
      for (let z = -12; z <= 4; z += 3) {
        box(main, [x - s * 0.15, 4.5, z], [0.3, 9, 0.6], COL.pilaster);
        box(main, [x - s * 0.2, 0.3, z], [0.4, 0.6, 0.75], COL.wallDark);
        box(main, [x - s * 0.35, 2.3, z], [0.12, 0.3, 0.12], COL.brass);
        glow.push(M4.translate(x - s * 0.42, 2.55, z));
        glow.ellipsoid(0.1, 0.14, 0.1, 8, 5, COL.bulb);
        glow.pop();
      }
      [-7.5, -1.5, 3.5].forEach(z => {
        box(main, [x - s * 0.05, 1.75, z], [0.1, 3.5, 1.9], COL.trim);
        box(main, [x - s * 0.1, 1.7, z], [0.12, 3.3, 1.6], COL.door);
        box(main, [x - s * 0.17, 1.7, z - 0.4], [0.04, 2.9, 0.6], COL.doorDark);
        box(main, [x - s * 0.17, 1.7, z + 0.4], [0.04, 2.9, 0.6], COL.doorDark);
      });
      [-10.5, -4.5, 1].forEach((z, i) => {
        const pb = paint[i % 3];
        pb.quad([x - s * 0.06, 4.0, z + s * 0.9], [x - s * 0.06, 4.0, z - s * 0.9], [x - s * 0.06, 5.4, z - s * 0.9], [x - s * 0.06, 5.4, z + s * 0.9], [1, 1, 1, 0.05], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      });
      box(main, [x - s * 0.2, 7.6, -4], [0.4, 0.3, 20], COL.trim);
    });
    box(main, [0, 2.45, -12.5], [18, 0.3, 3], COL.stone);
    box(main, [0, 2.3, -11.0], [18, 0.6, 0.1], COL.trim);
    stairs(main, -2.5, 2.5, -5.4, -11.0, 2.6, 13);
    [-1, 1].forEach(s => {
      [[-10.4, -8.6], [-6.4, -2.6], [-0.4, 2.4]].forEach(([z0, z1]) => balustrade(main, s * 6.4, z0, s * 6.4, z1, 0, 0.95, COL.stone));
      balustrade(main, s * 2.5, -11.0, s * 9, -11.0, 2.6, 1.0, COL.stone);
      const n = 12;
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        baluster(main, s * 2.65, 2.6 * k, lerp(-5.4, -11.0, k), 1.0, COL.stone);
      }
      const len = Math.hypot(5.6, 2.6);
      main.push(M4.translate(s * 2.65, 1.3 + 1.05, -8.2), M4.rotX(Math.atan2(2.6, 5.6)));
      main.box(0.2, 0.1, len + 0.3, COL.stone);
      main.pop();
      box(main, [s * 2.65, 0.6, -5.3], [0.36, 1.2, 0.36], COL.stone);
      main.push(M4.translate(s * 2.65, 1.35, -5.3));
      main.ellipsoid(0.2, 0.18, 0.2, 8, 5, COL.stone);
      main.pop();
    });
    [-5.5, 0, 5.5].forEach((x, i) => {
      glass.quad([x - 1.2, 3.3, -13.97], [x + 1.2, 3.3, -13.97], [x + 1.2, 7.4, -13.97], [x - 1.2, 7.4, -13.97], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      roses.push(M4.translate(x, 8.25, -13.96));
      K.discXY(roses, 0, 0, 0, 0.7, 20, [1, 1, 1, 1]);
      roses.pop();
      box(main, [x, 7.55, -13.9], [2.6, 0.18, 0.15], COL.trim);
      box(main, [x - 1.3, 5.4, -13.9], [0.16, 4.4, 0.16], COL.trim);
      box(main, [x + 1.3, 5.4, -13.9], [0.16, 4.4, 0.16], COL.trim);
      if (i < 2) box(main, [x + 2.75, 5.0, -13.85], [0.5, 10, 0.3], COL.pilaster);
    });
    chandelier(main, 0, 6.6, -2, 1);
    chandelier(main, 0, 6.6, -8.5, 1);
    [-1, 1].forEach(s => {
      [[s * 3.2, 0], [s * 5.5, -3.5]].forEach(([x, z]) => {
        main.push(M4.translate(x, 0, z));
        main.prism(12, 0.75, 0.75, 0, 0.75, 0.75, 0.42, COL.velvet, { topColor: 0x2c3a62 });
        main.prism(12, 0.25, 0.25, 0.42, 0.18, 0.18, 0.95, COL.velvet);
        main.pop();
      });
    });
    const glowChand = new Builder();
    [[0, 6.6, -2], [0, 6.6, -8.5]].forEach(([x, y, z]) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2;
        glowChand.push(M4.translate(x + C(a), y, z + S(a)));
        glowChand.ellipsoid(0.15, 0.17, 0.15, 8, 5, COL.bulb);
        glowChand.pop();
      }
    });
    const extra = new Builder();
    chandelier(extra, 0, 0, 0, 0.7);
    const extraGlow = new Builder();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2;
      extraGlow.push(M4.translate(C(a) * 0.7, 0, S(a) * 0.7));
      extraGlow.ellipsoid(0.11, 0.12, 0.11, 8, 5, COL.bulb);
      extraGlow.pop();
    }
    return {
      main: r.mesh(main),
      extra: r.mesh(extra),
      extraGlow: r.mesh(extraGlow),
      glow: r.mesh(glow),
      glowChand: r.mesh(glowChand),
      floor: r.mesh(floor),
      glass: r.mesh(glass),
      roses: r.mesh(roses),
      paint: paint.map(p => r.mesh(p)),
      floorTex: r.texture(256, A.marble),
      glassTex: r.texture(128, A.windowGlass, { height: 256, clamp: true }),
      roseTex: r.texture(256, A.rose, { clamp: true }),
      paintTex: [11, 23, 37].map(sd => r.texture(128, A.painting(sd), { height: 96, clamp: true }))
    };
  }

  function corridorSet(r) {
    const main = new Builder();
    const floor = new Builder();
    const panels = new Builder();
    const lamps = new Builder();
    const W = 1.8, H = 4.2, Z0 = -40, Z1 = 4;
    quadUV(floor, [-W, 0, Z1], [W, 0, Z1], [W, 0, Z0], [-W, 0, Z0], [0.55, 0.52, 0.6, 0], 2, 22);
    main.quad([-W, H, Z1], [W, H, Z1], [W, H, Z0], [-W, H, Z0], COL.corridorDark);
    main.quad([-W, 0, Z0], [W, 0, Z0], [W, H, Z0], [-W, H, Z0], COL.corridorDark);
    [-1, 1].forEach(s => {
      const x = s * W;
      main.quad([x, 1.2, Z1], [x, 1.2, Z0], [x, H, Z0], [x, H, Z1], COL.corridor);
      quadUV(panels, [x, 0, Z1], [x, 0, Z0], [x, 1.2, Z0], [x, 1.2, Z1], [0.8, 0.78, 0.86, 0], 44, 1);
      box(main, [x - s * 0.03, 1.22, (Z0 + Z1) / 2], [0.08, 0.06, Z1 - Z0], COL.trim);
      box(main, [x - s * 0.04, H - 0.15, (Z0 + Z1) / 2], [0.1, 0.3, Z1 - Z0], COL.corridorDark);
      for (let z = Z1 - 2; z > Z0; z -= 4) {
        box(main, [x - s * 0.1, H / 2, z], [0.2, H, 0.35], COL.pilaster);
        box(lamps, [x - s * 0.04, 2.1, z - 2], [0.05, 0.9, 0.06], COL.lamp);
      }
      for (let z = Z1 - 6; z > Z0; z -= 12) {
        box(main, [x - s * 0.04, 1.4, z], [0.08, 2.8, 1.3], COL.frame);
        box(main, [x - s * 0.07, 1.35, z], [0.06, 2.6, 1.1], COL.door);
      }
    });
    for (let z = Z1 - 2; z > Z0; z -= 4) box(lamps, [0, H - 0.02, z], [0.9, 0.04, 0.3], COL.lamp);
    return {
      main: r.mesh(main),
      floor: r.mesh(floor),
      panels: r.mesh(panels),
      lamps: r.mesh(lamps),
      floorTex: r.texture(256, A.marble),
      panelTex: r.texture(256, A.panel)
    };
  }

  function liftSet(r) {
    const main = new Builder();
    const ceil = new Builder();
    const dial = new Builder();
    const light = new Builder();
    main.quad([-3, 0, 0], [-0.75, 0, 0], [-0.75, 4.2, 0], [-3, 4.2, 0], COL.liftWall);
    main.quad([0.75, 0, 0], [3, 0, 0], [3, 4.2, 0], [0.75, 4.2, 0], COL.liftWall);
    main.quad([-0.75, 2.6, 0], [0.75, 2.6, 0], [0.75, 4.2, 0], [-0.75, 4.2, 0], COL.liftWall);
    box(main, [0, 2.75, 0.06], [1.9, 0.1, 0.1], COL.bronze);
    [-1, 1].forEach(s => box(main, [s * 0.9, 1.35, 0.06], [0.1, 2.8, 0.1], COL.bronze));
    const leaf = (s) => K.mesh(r, b => {
      box(b, [s * 0.36, 1.3, 0.12], [0.7, 2.55, 0.04], COL.liftPanel);
      box(b, [s * 0.36, 2.0, 0.15], [0.02, 1.4, 0.02], COL.bronze);
      box(b, [s * 0.36, 1.3, 0.145], [0.5, 2.2, 0.01], COL.liftWall);
    });
    [-1, 1].forEach(s => {
      box(main, [s * 1.2, 2.1, 0.08], [0.25, 4.2, 0.12], COL.liftPanel);
      box(main, [s * 2.2, 2.1, 0.05], [0.9, 3.6, 0.06], COL.liftPanel);
    });
    box(main, [0, 2.9, 0.1], [2.0, 0.12, 0.12], COL.bronze);
    box(main, [0, 4.0, 0.08], [6, 0.3, 0.14], COL.bronze);
    dial.quad([-0.62, 2.96, 0.13], [0.62, 2.96, 0.13], [0.62, 3.58, 0.13], [-0.62, 3.58, 0.13], [1, 1, 1, 0.3], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    main.quad([-1, 0, -2.2], [1, 0, -2.2], [1, 2.8, -2.2], [-1, 2.8, -2.2], COL.liftPanel);
    [-1, 1].forEach(s => main.quad([s, 0, 0], [s, 0, -2.2], [s, 2.8, -2.2], [s, 2.8, 0], COL.liftWall));
    main.quad([-1, 0.005, 0], [1, 0.005, 0], [1, 0.005, -2.2], [-1, 0.005, -2.2], 0x2a2436);
    for (let i = 0; i < 24; i++) box(main, [-0.8 + (i % 6) * 0.32, 0.012, -0.25 - Math.floor(i / 6) * 0.5], [0.04, 0.01, 0.04], 0x9a8ab4);
    ceil.quad([-1, 2.8, 0], [1, 2.8, 0], [1, 2.8, -2.2], [-1, 2.8, -2.2], COL.liftWall);
    box(light, [0, 2.78, -1.1], [1.4, 0.03, 1.6], [0.86, 0.7, 1.0, 1]);
    return { main: r.mesh(main), leafL: leaf(-1), leafR: leaf(1), ceil: r.mesh(ceil), dial: r.mesh(dial), light: r.mesh(light), dialTex: r.texture(512, A.liftDial, { height: 256, clamp: true }), needle: K.mesh(r, b => box(b, [0, 0.24, 0.0], [0.03, 0.48, 0.02], [0.2, 0.12, 0.1, 0])) };
  }

  function ruinsSet(r) {
    const main = new Builder();
    const g = rand(17);
    main.quad([-40, 0, 30], [40, 0, 30], [40, 0, -40], [-40, 0, -40], COL.dust);
    const arches = (z, sc, count, x0) => {
      for (let i = 0; i <= count; i++) {
        const x = x0 + i * 3.6 * sc;
        box(main, [x, 3.2 * sc, z], [0.9 * sc, 6.4 * sc, 1.3 * sc], i % 2 ? COL.rock : COL.rockDark);
        if (i < count) {
          const cx = x + 1.8 * sc;
          for (let k = 0; k < 8; k++) {
            const a0 = PI - (k / 8) * PI, a1 = PI - ((k + 1) / 8) * PI;
            const rr = 1.35 * sc, ro = 1.85 * sc, y0 = 6.4 * sc;
            const P = (a, rad, zz) => [cx + C(a) * rad, y0 + S(a) * rad, zz];
            [z - 0.65 * sc, z + 0.65 * sc].forEach(zz => main.quad(P(a0, rr, zz), P(a1, rr, zz), P(a1, ro, zz), P(a0, ro, zz), COL.rock));
            main.quad(P(a0, rr, z - 0.65 * sc), P(a1, rr, z - 0.65 * sc), P(a1, rr, z + 0.65 * sc), P(a0, rr, z + 0.65 * sc), COL.rockDark);
          }
          box(main, [cx, 8.6 * sc, z], [3.6 * sc, 0.9 * sc, 1.3 * sc], COL.rockDark);
        }
      }
    };
    arches(-6, 1, 5, -9);
    arches(-22, 1.6, 6, -24);
    for (let i = 0; i < 40; i++) {
      const s = 0.2 + g() * 0.9;
      box(main, [(g() - 0.5) * 30, s * 0.3, -2 - g() * 16], [s, s * 0.6, s * (0.6 + g())], g() < 0.5 ? COL.rock : COL.rockDark, M4.rotY(g() * PI));
    }
    [[-3.5, -3], [4.5, -2.4], [7, -9]].forEach(([x, z]) => {
      box(main, [x, 1.2, z], [0.8, 2.4, 0.8], COL.rockDark, M4.rotZ(0.05));
      box(main, [x + 0.5, 0.25, z + 0.6], [1.6, 0.5, 0.7], COL.rock, M4.rotY(0.6));
    });
    const shells = new Builder();
    for (let i = 0; i < 26; i++) {
      shells.push(M4.translate((g() - 0.5) * 1.4, 0.012, (g() - 0.5) * 1.2), M4.rotY(g() * PI), M4.rotZ(PI / 2));
      shells.prism(6, 0.009, 0.009, -0.025, 0.009, 0.009, 0.025, COL.casing);
      shells.pop();
    }
    return { main: r.mesh(main), shells: r.mesh(shells), casing: K.mesh(r, b => b.prism(6, 0.009, 0.009, -0.025, 0.009, 0.009, 0.025, COL.casing)) };
  }

  function warehouseSet(r) {
    const main = new Builder();
    const lights = new Builder();
    const screen = new Builder();
    main.quad([-14, 0, 10], [14, 0, 10], [14, 0, -16], [-14, 0, -16], 0x26242c);
    for (let x = -14; x <= 14; x += 2) box(main, [x, 0.005, -3], [0.04, 0.01, 26], 0x4a4856);
    for (let z = -16; z <= 10; z += 2) box(main, [0, 0.005, z], [28, 0.01, 0.04], 0x4a4856);
    main.quad([-14, 0, -16], [14, 0, -16], [14, 10, -16], [-14, 10, -16], 0x2a2832);
    for (let x = -12; x <= 12; x += 4) {
      box(main, [x, 4.5, -15], [0.4, 9, 0.4], COL.steel);
      box(main, [x, 4.5, 6], [0.4, 9, 0.4], COL.steel);
      for (let y = 1.5; y < 9; y += 2.5) box(main, [x, y, -4.5], [0.12, 0.12, 21], COL.steel);
      box(lights, [x, 8.2, -4.5], [0.3, 0.1, 18], [0.85, 0.82, 1.0, 1]);
    }
    for (let i = 0; i < 6; i++) box(main, [-9 + i * 3.6, 0.5, -11 + (i % 2) * 2], [1, 1, 1], 0x3c3830, M4.rotY(i * 0.4));
    box(main, [0, 2.4, -8.1], [4.4, 2.7, 0.15], 0x18161e);
    screen.quad([-2, 1.25, -8.0], [2, 1.25, -8.0], [2, 3.55, -8.0], [-2, 3.55, -8.0], [1, 1, 1, 1], [[0.18, 0.22], [0.82, 0.22], [0.82, 0.78], [0.18, 0.78]]);
    return { main: r.mesh(main), lights: r.mesh(lights), screen: r.mesh(screen), screenTex: r.texture(512, A.card('Конец', { bg: '#cfc8dc', paper: '#ece8f4', ink: '#5a4a6a', italic: true, size: 0.13, glow: 'rgba(255,255,255,0.9)', edge: 'rgba(160,140,190,0.6)' }), { height: 288, clamp: true }) };
  }

  function theaterSet(r) {
    const main = new Builder();
    main.quad([-10, 0, 8], [10, 0, 8], [10, 0, -12], [-10, 0, -12], COL.carpet);
    for (let i = 0; i < 26; i++) {
      const x = -10 + i * 0.8;
      main.quad([x, 0, -8 - (i % 2) * 0.25], [x + 0.8, 0, -8 - ((i + 1) % 2) * 0.25], [x + 0.8, 9, -8 - ((i + 1) % 2) * 0.25], [x, 9, -8 - (i % 2) * 0.25], i % 2 ? COL.curtain : 0x6a0c18);
    }
    for (let row = 0; row < 5; row++) {
      for (let i = 0; i < 12; i++) {
        const x = -5.5 + i * 0.95, z = -1 - row * 1.1, y = row * 0.2;
        box(main, [x, y + 0.42, z], [0.8, 0.14, 0.7], COL.seat);
        box(main, [x, y + 0.8, z - 0.32], [0.8, 0.8, 0.14], COL.seat, M4.rotX(-0.12));
        box(main, [x - 0.42, y + 0.55, z], [0.08, 0.5, 0.72], COL.seatDark);
        box(main, [x, y + 0.18, z], [0.7, 0.36, 0.5], COL.seatDark);
      }
    }
    box(main, [0, 0.42, 0.6], [0.95, 0.16, 0.8], COL.seat);
    box(main, [0, 0.95, 0.24], [0.95, 1.1, 0.16], COL.seat, M4.rotX(-0.14));
    [-1, 1].forEach(s => box(main, [s * 0.52, 0.66, 0.6], [0.14, 0.12, 0.8], COL.seatDark));
    return { main: r.mesh(main) };
  }

  function stageSet(r) {
    const main = new Builder();
    const scr = new Builder();
    for (let i = -6; i < 6; i++) {
      for (let j = -8; j < 4; j++) {
        const c = (i + j) % 2 ? 0xd8d6dc : 0x9a98a2;
        main.quad([i, 0, j + 1], [i + 1, 0, j + 1], [i + 1, 0, j], [i, 0, j], c);
      }
    }
    [-1, 1].forEach(s => {
      for (let k = 0; k < 4; k++) box(main, [s * (3.6 + k * 0.6), 3, -6 + k * 1.5], [0.3, 6, 0.3], 0x18161c);
    });
    scr.quad([-3.2, 0.6, -6.5], [3.2, 0.6, -6.5], [3.2, 4.2, -6.5], [-3.2, 4.2, -6.5], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    return { main: r.mesh(main), screen: r.mesh(scr), screenTex: r.texture(512, A.smileScreen, { height: 256, clamp: true }) };
  }

  function clockSet(r) {
    const main = new Builder();
    const dial = new Builder();
    K.discXY(dial, 0, 0, 0, 2.0, 48, [1, 1, 1, 0.15]);
    for (let i = 0; i < 48; i++) {
      const a0 = (i / 48) * PI * 2, a1 = ((i + 1) / 48) * PI * 2;
      const P = (a, rad, z) => [C(a) * rad, S(a) * rad, z];
      main.quad(P(a0, 2.0, 0), P(a1, 2.0, 0), P(a1, 2.25, 0.12), P(a0, 2.25, 0.12), 0x8a6a58);
      main.quad(P(a0, 2.25, 0.12), P(a1, 2.25, 0.12), P(a1, 2.4, 0.04), P(a0, 2.4, 0.04), 0xc8a088);
      main.quad(P(a0, 2.4, 0.04), P(a1, 2.4, 0.04), P(a1, 2.45, -0.3), P(a0, 2.45, -0.3), 0x6a4a40);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2;
      main.push(M4.rotZ(a));
      box(main, [0, 0.95, 0.04], [0.06, 0.95, 0.06], 0x5a3a34);
      main.pop();
    }
    main.push(M4.translate(0, 0, 0.08));
    main.prism(16, 0.22, 0.22, 0, 0.18, 0.18, 0.06, 0xc8a090);
    main.pop();
    const hand = K.mesh(r, b => {
      b.quad([-0.018, -0.2, 0], [0.018, -0.2, 0], [0.01, 1.65, 0], [-0.01, 1.65, 0], [1, 0.62, 0.86, 1]);
      b.tri([-0.045, 1.5, 0], [0.045, 1.5, 0], [0, 1.82, 0], [1, 0.55, 0.82, 1]);
      [-1, 1].forEach(s => {
        b.quad([0, 1.0, 0], [s * 0.1, 1.18, 0], [s * 0.085, 1.26, 0], [0, 1.12, 0], [1, 0.66, 0.88, 1]);
        b.quad([0, 0.55, 0], [s * 0.07, 0.68, 0], [s * 0.06, 0.74, 0], [0, 0.64, 0], [1, 0.66, 0.88, 1]);
      });
    });
    const minute = K.mesh(r, b => b.quad([-0.025, -0.15, 0], [0.025, -0.15, 0], [0.015, 1.15, 0], [-0.015, 1.15, 0], 0x4a2a2a));
    return { main: r.mesh(main), dial: r.mesh(dial), dialTex: r.texture(512, A.clockDial, { clamp: true }), hand, minute };
  }

  function build(r) {
    return {
      hall: hallSet(r),
      corridor: corridorSet(r),
      lift: liftSet(r),
      ruins: ruinsSet(r),
      warehouse: warehouseSet(r),
      theater: theaterSet(r),
      stage: stageSet(r),
      clock: clockSet(r)
    };
  }

  function drawHall(r, H, st) {
    r.draw(H.floor, M4.ident(), { texture: H.floorTex, tint: st.floorTint || [1, 1, 1] });
    r.draw(H.main, M4.ident());
    const wg = st.windowGlow || [0.5, 0.55, 0.8];
    r.draw(H.glass, M4.ident(), { texture: H.glassTex, tint: wg, noFog: true });
    r.draw(H.roses, M4.ident(), { texture: H.roseTex, tint: wg, noFog: true });
    H.paint.forEach((p, i) => r.draw(p, M4.ident(), { texture: H.paintTex[i] }));
    const lampK = st.lamps === undefined ? 1 : st.lamps;
    if (st.chandelier) {
      const cm = M4.translate(st.chandelier[0], st.chandelier[1], st.chandelier[2]);
      r.draw(H.extra, cm);
      r.draw(H.extraGlow, cm, { noFog: true });
    }
    if (lampK > 0) {
      r.draw(H.glow, M4.ident(), { tint: [lampK, lampK * 0.92, lampK * 0.8], noFog: true });
      r.draw(H.glowChand, M4.ident(), { tint: [lampK, lampK * 0.92, lampK * 0.8], noFog: true });
    }
  }

  function drawCorridor(r, Cc, st) {
    r.draw(Cc.floor, M4.ident(), { texture: Cc.floorTex });
    r.draw(Cc.panels, M4.ident(), { texture: Cc.panelTex });
    r.draw(Cc.main, M4.ident());
    const l = st.lampTint || [0.95, 0.85, 1.0];
    r.draw(Cc.lamps, M4.ident(), { tint: l, noFog: true });
  }

  function drawLift(r, L, st) {
    r.draw(L.main, M4.ident());
    const open = (st.doorOpen || 0) * 0.68;
    r.draw(L.leafL, M4.translate(-open, 0, 0));
    r.draw(L.leafR, M4.translate(open, 0, 0));
    if (!st.noCeiling) r.draw(L.ceil, M4.ident());
    if (!st.noCeiling) r.draw(L.light, M4.ident(), { noFog: true, tint: st.liftLight || [1, 1, 1] });
    r.draw(L.dial, M4.ident(), { texture: L.dialTex });
    r.draw(L.needle, M4.chain(M4.translate(0, 3.0, 0.15), M4.rotZ(st.needle || 0)));
  }

  function drawRuins(r, R2) {
    r.draw(R2.main, M4.ident());
    r.draw(R2.shells, M4.ident());
  }

  function drawWarehouse(r, Wh, st) {
    r.draw(Wh.main, M4.ident());
    r.draw(Wh.lights, M4.ident(), { noFog: true });
    if (!st.noScreen) r.draw(Wh.screen, M4.ident(), { texture: Wh.screenTex, noFog: true, tint: st.screenTint || [1, 1, 1] });
  }

  function drawStage(r, Sg, st) {
    r.draw(Sg.main, M4.ident());
    r.draw(Sg.screen, M4.ident(), { texture: Sg.screenTex, noFog: true, tint: st.screenTint || [1, 1, 1] });
  }

  function drawClock(r, Ck, st) {
    const base = M4.rotZ(st.clockRot || 0);
    r.draw(Ck.dial, base, { texture: Ck.dialTex });
    r.draw(Ck.main, base);
    r.draw(Ck.minute, M4.chain(M4.translate(0, 0, 0.1), M4.rotZ(st.minuteAngle || 0)));
    r.draw(Ck.hand, M4.chain(M4.translate(0, 0, 0.16), M4.rotZ(st.handAngle || 0)), { noFog: true });
  }

  function draw(r, W, st) {
    if (st.set === 'hall') drawHall(r, W.hall, st);
    else if (st.set === 'corridor') drawCorridor(r, W.corridor, st);
    else if (st.set === 'lift') drawLift(r, W.lift, st);
    else if (st.set === 'ruins') drawRuins(r, W.ruins, st);
    else if (st.set === 'warehouse') drawWarehouse(r, W.warehouse, st);
    else if (st.set === 'theater') r.draw(W.theater.main, M4.ident());
    else if (st.set === 'stage') drawStage(r, W.stage, st);
    else if (st.set === 'clock') drawClock(r, W.clock, st);
  }

  window.KafkaWorld = { COL, build, draw };
})();
