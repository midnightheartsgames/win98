(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI } = K;

  const COL = {
    steel: 0xb8bcc0, steelDk: 0x5c6064, handle: 0x2c2c30, gun: 0x3a3a3e, gunHi: 0x5e5e64, grip: 0x5a3622, sapper: 0x4a5058, sapperHi: 0x8a929a, prong: 0xc8b070,
    caseBlu: 0x1e9cc8, caseDk: 0x16708f, caseHandle: 0x1c1c1e, manila: 0xc8b08a, paper: 0xefece4, silver: 0xa4a6a8, silverDk: 0x6e7072, brass: 0xc8a050,
    keypad: 0x8a8e92, bell: 0x2e6fa8, bellDk: 0x1e4a74, plate: 0x8a8c8e, wood: 0x8a6a40, woodDk: 0x5a4026, door: 0x6f7a82, doorDk: 0x4c545a,
    desk: 0x5a6066, deskTop: 0xd8d4c8, cabinet: 0xd8d4c8, saw: 0xc4c8cc, sawGrip: 0x3a2a20, kukri: 0x8a8e92, kukriGrip: 0x4a2c18, shell: 0xb02a22, shellCap: 0xc8a050,
    rope: 0x9a8a62, fridge: 0xe2ded2, lampShade: 0x3a3e42
  };

  const METAL = { spec: [0.6, 30], rim: 0.6 };
  const DULL = { spec: [0.2, 10], rim: 0.5 };
  const PAPER = { spec: [0.05, 4], rim: 0.3 };

  function cyl(b, from, to, r, col, sides, opts) {
    const d = V3.sub(to, from);
    const len = V3.len(d);
    const y = V3.mul(d, 1 / len);
    let x = V3.cross(y, Math.abs(y[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]);
    x = V3.norm(x);
    const z = V3.cross(x, y);
    const M = new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, from[0], from[1], from[2], 1]);
    b.push(M);
    const r0 = Array.isArray(r) ? r[0] : r, r1 = Array.isArray(r) ? r[1] : r;
    b.prism(sides || 12, r0, r0, 0, r1, r1, len, col, Object.assign({ capBottom: true }, opts || {}));
    b.pop();
    return b;
  }

  function flatQuad(b, w, h, col, uv) {
    const n = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
    b.quad([-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], col, uv || [[0, 0], [1, 0], [1, 1], [0, 1]], n);
    return b;
  }

  function buildKnifeHandle(b) {
    [-1, 1].forEach(s => {
      b.at(s * 0.0062, 0, 0, h => h.box(0.006, 0.11, 0.016, COL.handle));
      b.at(s * 0.0062, 0, 0.0082, h => h.box(0.0062, 0.1, 0.002, COL.steelDk));
    });
    cyl(b, [-0.01, 0.052, 0], [0.01, 0.052, 0], 0.005, COL.steel, 8);
    return b;
  }

  function buildKnifeBlade(b) {
    const pts = [[0, 0.0], [0.0075, 0.01], [0.0075, 0.075], [0.003, 0.098], [-0.004, 0.1], [-0.0075, 0.075], [-0.0075, 0.01]];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[0], c1 = pts[i], c2 = pts[i + 1];
      b.tri([0.0012, a[1], a[0]], [0.0012, c1[1], c1[0]], [0.0012, c2[1], c2[0]], COL.steel, null, [[1, 0, 0], [1, 0, 0], [1, 0, 0]]);
      b.tri([-0.0012, a[1], a[0]], [-0.0012, c2[1], c2[0]], [-0.0012, c1[1], c1[0]], COL.steel, null, [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0]]);
    }
    return b;
  }

  function buildRevolver(b) {
    cyl(b, [0, 0.05, 0.02], [0, 0.05, 0.24], 0.011, COL.gun, 10);
    b.at(0, 0.064, 0.13, h => h.box(0.012, 0.01, 0.22, COL.gun));
    b.at(0, 0.074, 0.23, h => h.box(0.004, 0.012, 0.01, COL.gun));
    cyl(b, [0, 0.042, -0.025], [0, 0.042, 0.035], 0.024, COL.gunHi, 12);
    b.at(0, 0.04, -0.04, h => h.box(0.024, 0.05, 0.04, COL.gun));
    b.push(M4.translate(0, -0.012, -0.065), M4.rotX(-0.35));
    b.box(0.03, 0.1, 0.035, COL.grip);
    b.pop();
    b.at(0, 0.012, -0.012, h => h.box(0.006, 0.03, 0.03, COL.gun));
    b.push(M4.translate(0, 0.07, -0.058), M4.rotX(0.6));
    b.box(0.008, 0.02, 0.012, COL.gun);
    b.pop();
    return b;
  }

  function buildSapper(b) {
    b.box(0.09, 0.05, 0.12, COL.sapper);
    b.at(0, 0.026, 0, h => h.box(0.07, 0.006, 0.09, COL.sapperHi));
    b.at(0, 0.032, -0.02, h => h.box(0.03, 0.01, 0.03, 0x3ab0e8));
    [-1, 1].forEach(s => cyl(b, [s * 0.03, 0, 0.06], [s * 0.03, 0, 0.1], 0.006, COL.prong, 8));
    cyl(b, [0.03, 0.025, -0.05], [0.03, 0.08, -0.05], 0.003, COL.sapperHi, 6);
    return b;
  }

  function buildCase(b) {
    b.at(0, 0.055, 0, h => h.box(0.46, 0.11, 0.34, COL.caseBlu, { faces: { top: null } }));
    b.at(0, 0.0005, 0, h => h.box(0.462, 0.004, 0.342, COL.caseDk));
    [-1, 1].forEach(s => b.at(s * 0.12, 0.11, -0.172, h => h.box(0.03, 0.03, 0.02, COL.caseHandle)));
    b.at(0, 0.13, -0.18, h => h.box(0.22, 0.018, 0.022, COL.caseHandle));
    b.at(0, 0.055, -0.171, h => h.box(0.44, 0.012, 0.004, COL.caseDk));
    return b;
  }

  function buildCaseTop(b) {
    b.push(M4.translate(0, 0.1101, 0), M4.rotX(-PI / 2));
    flatQuad(b, 0.46, 0.34, 0xffffff, [[1, 0], [1, 1], [0, 1], [0, 0]].map(([u, v]) => [u, v]));
    b.pop();
    return b;
  }

  function buildFolder(b) {
    b.push(M4.rotX(-PI / 2));
    flatQuad(b, 0.24, 0.3, 0xffffff);
    b.pop();
    b.at(0, -0.002, 0, h => h.box(0.236, 0.003, 0.296, COL.manila));
    return b;
  }

  function buildPhoto(b) {
    b.push(M4.rotX(-PI / 2));
    flatQuad(b, 0.13, 0.1, 0xffffff);
    b.pop();
    b.push(M4.translate(0, -0.0008, 0), M4.rotX(PI / 2));
    flatQuad(b, 0.13, 0.1, 0xe8e4da, [[0.02, 0.02], [0.02, 0.02], [0.02, 0.02], [0.02, 0.02]]);
    b.pop();
    return b;
  }

  function buildCigCase(b, open) {
    b.at(0, 0, 0, h => h.box(0.085, 0.012, 0.11, COL.silver));
    b.at(0, 0.0062, 0, h => h.box(0.078, 0.002, 0.1, COL.silverDk));
    if (open) {
      b.push(M4.translate(0, 0.006, -0.055), M4.rotX(-1.9), M4.translate(0, 0, 0.055));
      b.box(0.085, 0.006, 0.11, COL.silver);
      b.at(0, -0.006, 0.02, h => h.box(0.06, 0.004, 0.045, 0x121414));
      [[-0.033, '#e8b830'], [0.005, '#e8b830'], [0.03, '#c83a3a']].forEach(([x], i) => b.at(0.032, -0.006, x, h => h.box(0.014, 0.004, 0.016, [0xe8b830, 0xe8b830, 0xc83a3a][i])));
      b.pop();
      for (let i = 0; i < 6; i++) cyl(b, [-0.035 + i * 0.014, 0.012, -0.045], [-0.035 + i * 0.014, 0.012, 0.045], 0.0045, i % 2 ? COL.paper : 0xf4f0e6, 8);
    }
    return b;
  }

  function buildLighter(b) {
    b.box(0.032, 0.05, 0.016, COL.brass);
    b.at(0, 0.03, 0, h => h.box(0.032, 0.012, 0.016, 0x8a6a2a));
    cyl(b, [0, 0.036, 0], [0, 0.044, 0], 0.004, 0x5a5a5a, 8);
    return b;
  }

  function buildCig(b) {
    cyl(b, [0, 0, 0], [0, 0, 0.016], 0.0036, 0xc98a4c, 10);
    cyl(b, [0, 0, 0.016], [0, 0, 0.07], 0.0036, COL.paper, 10);
    cyl(b, [0, 0, 0.07], [0, 0, 0.075], 0.0034, rgb(0xff8a30, 1), 10);
    return b;
  }

  function buildKeypad(b) {
    b.box(0.09, 0.12, 0.02, COL.keypad);
    return b;
  }

  function buildKeypadFace(b) {
    b.push(M4.translate(0, 0, 0.0102));
    flatQuad(b, 0.075, 0.1, 0xffffff);
    b.pop();
    return b;
  }

  function buildHandle(b) {
    b.box(0.06, 0.1, 0.012, COL.plate);
    cyl(b, [0, -0.02, 0.006], [0, -0.02, 0.04], 0.008, COL.steel, 10);
    cyl(b, [0, -0.02, 0.04], [-0.11, -0.02, 0.04], 0.009, COL.steel, 10);
    return b;
  }

  function buildBell(b) {
    b.box(0.32, 0.32, 0.03, COL.plate);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, y]) => cyl(b, [x * 0.13, y * 0.13, 0.015], [x * 0.13, y * 0.13, 0.03], 0.012, 0x3a3a3a, 6));
    b.push(M4.translate(0, 0, 0.015), M4.rotX(PI / 2));
    b.prism(28, 0.14, 0.14, 0, 0.13, 0.13, 0.05, COL.bell, { capTop: false });
    b.at(0, 0.05, 0, h => h.prism(28, 0.13, 0.13, 0, 0.09, 0.09, 0.03, COL.bell));
    b.pop();
    cyl(b, [0, -0.17, 0.02], [0, -0.3, 0.02], 0.012, 0x2a2a2a, 8);
    return b;
  }

  function buildBellPlate(b) {
    b.push(M4.translate(0, 0, 0.096));
    flatQuad(b, 0.11, 0.11, 0xffffff);
    b.pop();
    return b;
  }

  function buildHammer(b) {
    cyl(b, [0, 0, 0], [0, 0.12, 0], 0.005, 0x3a3a3a, 6);
    b.at(0, 0.125, 0, h => h.ellipsoid(0.016, 0.016, 0.016, 8, 6, 0x6a6a6a));
    return b;
  }

  function buildDoor(b) {
    b.box(0.92, 2.1, 0.05, COL.door);
    b.at(0, 0.45, 0.026, h => h.box(0.6, 0.42, 0.006, COL.doorDk));
    b.at(0, -0.4, 0.026, h => h.box(0.8, 0.9, 0.004, COL.doorDk));
    b.at(0, -0.4, -0.026, h => h.box(0.8, 0.9, 0.004, COL.doorDk));
    return b;
  }

  function buildDoorSign(b) {
    b.push(M4.translate(0, 0.45, 0.0315));
    flatQuad(b, 0.54, 0.36, 0xffffff);
    b.pop();
    b.push(M4.translate(0, 0.45, -0.0315), M4.rotY(PI));
    flatQuad(b, 0.54, 0.36, 0xffffff, [[1, 0], [0, 0], [0, 1], [1, 1]]);
    b.pop();
    return b;
  }

  function buildShard(b, w, h) {
    b.box(w, h, 0.04, COL.door);
    return b;
  }

  function buildDesk(b) {
    b.at(0, 0.73, 0, h => h.box(2.0, 0.05, 1.0, COL.deskTop));
    b.at(0, 0.7, 0, h => h.box(1.96, 0.03, 0.96, COL.desk));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.at(x * 0.92, 0.35, z * 0.42, h => h.box(0.06, 0.7, 0.06, COL.desk)));
    b.at(0, 0.62, 0, h => h.box(1.9, 0.12, 0.02, COL.desk));
    return b;
  }

  function buildCabinet(b) {
    b.at(0, 0.66, 0, h => h.box(0.5, 1.32, 0.6, COL.cabinet, { faces: { front: null } }));
    b.push(M4.translate(0, 0.66, 0.301));
    flatQuad(b, 0.5, 1.32, 0xffffff);
    b.pop();
    return b;
  }

  function buildFridge(b) {
    b.at(0, 0.9, 0, h => h.box(0.8, 1.8, 0.7, COL.fridge));
    b.at(0, 1.25, 0.352, h => h.box(0.7, 0.9, 0.006, 0x1e2a30));
    for (let i = 0; i < 3; i++) b.at(0, 0.96 + i * 0.26, 0.356, h => h.box(0.62, 0.02, 0.01, 0xd8d0b8));
    b.at(0, 0.45, 0.356, h => h.box(0.6, 0.2, 0.01, 0xc84a3a));
    return b;
  }

  function buildLampShade(b) {
    b.prism(20, 0.26, 0.26, 0, 0.06, 0.06, 0.2, COL.lampShade, { capTop: true, capBottom: false });
    b.at(0, 0.002, 0, h => h.disc(0.24, 20, rgb(0xfff4dc, 1), 0));
    cyl(b, [0, 0.2, 0], [0, 1.6, 0], 0.008, 0x2a2a2a, 6);
    return b;
  }

  function buildCrate(b) {
    b.box(0.6, 0.6, 0.6, 0xffffff);
    return b;
  }

  function buildSaw(b) {
    cyl(b, [0, -0.12, 0], [0, 0, 0], 0.016, COL.sawGrip, 8);
    b.at(0, 0.004, 0, h => h.box(0.04, 0.012, 0.036, COL.steelDk));
    b.at(0.02, 0.1, 0, h => h.box(0.07, 0.19, 0.004, COL.saw));
    for (let i = 0; i < 9; i++) b.at(0.058, 0.015 + i * 0.02, 0, h => { h.push(M4.rotZ(0.6)); h.box(0.014, 0.014, 0.004, COL.saw); h.pop(); });
    return b;
  }

  function buildKukri(b) {
    cyl(b, [0, -0.11, 0], [0, 0, 0], 0.014, COL.kukriGrip, 8);
    b.at(0, 0.004, 0, h => h.box(0.03, 0.01, 0.03, COL.brass));
    b.push(M4.translate(0, 0.01, 0), M4.rotZ(0.25));
    b.at(0.012, 0.15, 0, h => h.box(0.045, 0.3, 0.004, COL.kukri));
    b.pop();
    return b;
  }

  function buildShell(b) {
    cyl(b, [0, 0, 0], [0, 0.05, 0], 0.009, COL.shell, 8);
    cyl(b, [0, -0.01, 0], [0, 0, 0], 0.0095, COL.shellCap, 8);
    return b;
  }

  function buildRope(b) {
    cyl(b, [0, 0, 0], [0, 3, 0], 0.012, COL.rope, 6);
    return b;
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      knifeHandle: mk(buildKnifeHandle),
      knifeBlade: mk(buildKnifeBlade),
      revolver: mk(buildRevolver),
      sapper: mk(buildSapper),
      briefcase: mk(buildCase),
      caseTop: mk(buildCaseTop),
      folder: mk(buildFolder),
      photo: mk(buildPhoto),
      cigCase: mk(b => buildCigCase(b, false)),
      cigCaseOpen: mk(b => buildCigCase(b, true)),
      lighter: mk(buildLighter),
      cig: mk(buildCig),
      keypad: mk(buildKeypad),
      keypadFace: mk(buildKeypadFace),
      handle: mk(buildHandle),
      bell: mk(buildBell),
      bellPlate: mk(buildBellPlate),
      hammer: mk(buildHammer),
      door: mk(buildDoor),
      doorSign: mk(buildDoorSign),
      shardA: mk(b => buildShard(b, 0.3, 0.5)),
      shardB: mk(b => buildShard(b, 0.18, 0.3)),
      desk: mk(buildDesk),
      cabinet: mk(buildCabinet),
      fridge: mk(buildFridge),
      lampShade: mk(buildLampShade),
      crate: mk(buildCrate),
      saw: mk(buildSaw),
      kukri: mk(buildKukri),
      shell: mk(buildShell),
      rope: mk(buildRope)
    };
  }

  function knifeMs(M, open) {
    const o = open === undefined ? 1 : open;
    const handleA = M4.chain(M, M4.translate(0.0065, 0, 0));
    const handleB = M4.chain(M, M4.translate(0, 0.052, 0), M4.rotZ(PI * (1 - o)), M4.translate(-0.0065, -0.052, 0));
    const blade = M4.chain(M, M4.translate(0, 0.052, 0), M4.rotX(PI * (1 - o)));
    return { handleA, handleB, blade };
  }

  function drawKnife(fx, P, M, open, tint) {
    const t = tint ? { tint } : {};
    const k = knifeMs(M, open);
    fx.draw(P.knifeHandle, k.handleA, Object.assign({}, DULL, t));
    fx.draw(P.knifeBlade, k.blade, Object.assign({}, METAL, t));
  }

  function knifeTip(M, open) {
    return M4.point(knifeMs(M, open).blade, [0, 0.1, 0]);
  }

  const GRIPS = {
    knife: { at: [0, 0.0, 0], fingers: [0, 0.2, 1], palm: [-1, 0, 0], pose: 'knife' },
    revolver: { at: [0, -0.01, -0.06], fingers: [0, -0.4, 1], palm: [-1, 0, 0], pose: 'grip' },
    saw: { at: [0, -0.06, 0], fingers: [0, 0, 1], palm: [-1, 0, 0], pose: 'grip' },
    kukri: { at: [0, -0.06, 0], fingers: [0, 0, 1], palm: [-1, 0, 0], pose: 'grip' }
  };

  function grip(kind, M) {
    const g = GRIPS[kind];
    return { pos: M4.point(M, g.at), fingers: V3.norm(M4.dir(M, g.fingers)), palm: V3.norm(M4.dir(M, g.palm)), pose: g.pose };
  }

  function revolverMuzzle(M) {
    return { p: M4.point(M, [0, 0.05, 0.25]), d: V3.norm(M4.dir(M, [0, 0, 1])) };
  }

  window.MspProps = { COL, METAL, DULL, PAPER, build, drawKnife, knifeTip, knifeMs, grip, GRIPS, revolverMuzzle };
})();
