(function (Z) {
  'use strict';

  const M = k => Z.MAT[k];
  const box = (mb, mat, tint, x, y, z, sx, sy, sz, yaw = 0, uvs = 1, sides = 63) => { mb.setMat(M(mat), 0, 0); mb.setTint(tint[0], tint[1], tint[2], 255); mb.box(x, y, z, sx, sy, sz, yaw, uvs, sides); };
  const cyl = (mb, mat, tint, x, y, z, r0, r1, h, n = 8) => { mb.setMat(M(mat), 0, 0); mb.setTint(tint[0], tint[1], tint[2], 255); mb.cyl(x, y, z, r0, r1, h, n, 1, true); };
  const W = [128, 128, 128];
  const wood = [130, 110, 90], dwood = [100, 80, 62], metal = [120, 124, 126], white = [200, 200, 196], green = [90, 120, 96];

  const P = {
    table(mb) { box(mb, 'wood', wood, 0, 0.72, 0, 1.2, 0.05, 0.8); for (const [x, z] of [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]]) box(mb, 'wood', dwood, x, 0, z, 0.05, 0.72, 0.05); },
    bigtable(mb) { box(mb, 'wood', wood, 0, 0.74, 0, 3.0, 0.05, 1.2); for (const [x, z] of [[-1.4, -0.5], [1.4, -0.5], [-1.4, 0.5], [1.4, 0.5]]) box(mb, 'wood', dwood, x, 0, z, 0.06, 0.74, 0.06); box(mb, 'fabric', [60, 90, 60], 0, 0.79, 0, 2.6, 0.005, 0.9); },
    cardtable(mb) { box(mb, 'wood', dwood, 0, 0.72, 0, 1.6, 0.06, 1.0); box(mb, 'fabric', [40, 110, 60], 0, 0.78, 0, 1.5, 0.005, 0.9); box(mb, 'wood', dwood, 0, 0, 0, 0.2, 0.72, 0.2); },
    chair(mb) { box(mb, 'wood', wood, 0, 0.42, 0, 0.42, 0.04, 0.42); box(mb, 'wood', wood, 0, 0.46, 0.19, 0.42, 0.45, 0.04); for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) box(mb, 'wood', dwood, x, 0, z, 0.035, 0.42, 0.035); },
    stool(mb) { cyl(mb, 'wood', wood, 0, 0.6, 0, 0.18, 0.18, 0.05); for (const [x, z] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) box(mb, 'wood', dwood, x, 0, z, 0.03, 0.6, 0.03); },
    shelf(mb) { box(mb, 'wood', dwood, 0, 0, 0, 1.0, 1.9, 0.05, 0, 1, 63); for (let i = 0; i < 5; i++) box(mb, 'wood', wood, 0, i * 0.45, -0.15, 1.0, 0.03, 0.32); for (const x of [-0.49, 0.49]) box(mb, 'wood', dwood, x, 0, -0.15, 0.03, 1.9, 0.32); for (let i = 0; i < 6; i++) box(mb, 'paintRed', [140 + i * 15, 100, 80 + i * 10], -0.35 + i * 0.14, 0.93, -0.12, 0.1, 0.32, 0.22); },
    wardrobe(mb) { box(mb, 'wood', [110, 76, 50], 0, 0, 0, 1.1, 2.0, 0.6); box(mb, 'wood', [90, 60, 40], 0, 0.1, -0.31, 0.02, 1.8, 0.02); },
    tv(mb) { box(mb, 'wood', [90, 60, 40], 0, 0, 0, 0.6, 0.5, 0.45); box(mb, 'glass', [60, 70, 60], 0, 0.1, -0.226, 0.4, 0.32, 0.01); },
    stove(mb) { box(mb, 'plasterWhite', white, 0, 0, 0, 0.6, 0.85, 0.6); for (const [x, z] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) cyl(mb, 'metalGrey', [40, 40, 40], x, 0.85, z, 0.09, 0.09, 0.01); },
    sink(mb) { box(mb, 'plasterWhite', white, 0, 0, 0, 0.55, 0.85, 0.45); cyl(mb, 'metalGrey', metal, 0, 0.85, 0.15, 0.015, 0.015, 0.25); },
    bathtub(mb) { box(mb, 'plasterWhite', white, 0, 0, 0, 0.75, 0.6, 1.6); box(mb, 'glass', [80, 90, 90], 0, 0.45, 0, 0.6, 0.16, 1.45); },
    toilet(mb) { box(mb, 'plasterWhite', white, 0, 0, 0.05, 0.36, 0.42, 0.5); box(mb, 'plasterWhite', white, 0, 0.42, 0.25, 0.4, 0.35, 0.16); },
    counter(mb) { box(mb, 'wood', [120, 80, 50], 0, 0, 0, 2.0, 1.0, 0.6); box(mb, 'wood', [150, 110, 70], 0, 1.0, 0, 2.1, 0.05, 0.66); },
    bar(mb) { box(mb, 'wood', [110, 70, 40], 0, 0, 0, 3.0, 1.05, 0.7); box(mb, 'wood', [150, 104, 66], 0, 1.05, 0, 3.1, 0.06, 0.8); for (let i = 0; i < 6; i++) cyl(mb, 'glass', [80 + i * 20, 120, 80], -1.2 + i * 0.45, 1.11, 0.1, 0.04, 0.04, 0.3, 6); },
    rack(mb) { for (const x of [-0.78, 0.78]) for (const z of [-0.22, 0.22]) box(mb, 'metalGrey', metal, x, 0, z, 0.04, 2.0, 0.04); for (let i = 0; i < 4; i++) box(mb, 'metalGrey', metal, 0, 0.1 + i * 0.6, 0, 1.6, 0.03, 0.48); for (let i = 0; i < 5; i++) box(mb, 'wood', [140, 120, 90], -0.6 + i * 0.3, 0.13 + (i % 3) * 0.6, 0, 0.22, 0.25, 0.3); },
    machine(mb) { box(mb, 'paintGreen', green, 0, 0, 0, 2.0, 1.2, 1.2); box(mb, 'metalGrey', metal, 0.5, 1.2, 0, 0.6, 0.4, 0.6); cyl(mb, 'metalGrey', [80, 80, 80], -0.5, 1.2, 0, 0.25, 0.25, 0.2, 10); },
    computer(mb) { box(mb, 'robotPaint', [180, 184, 176], 0, 0, 0, 0.8, 1.9, 0.6); for (const x of [-0.18, 0.18]) cyl(mb, 'metalGrey', [60, 60, 60], x, 1.35, -0.31, 0.14, 0.14, 0.02, 12); box(mb, 'glow', [255, 60, 40], -0.3, 0.9, -0.305, 0.04, 0.04, 0.01); box(mb, 'glow', [60, 255, 80], -0.2, 0.9, -0.305, 0.04, 0.04, 0.01); box(mb, 'glow', [255, 200, 60], -0.1, 0.9, -0.305, 0.04, 0.04, 0.01); },
    reel(mb) { box(mb, 'robotPaint', [170, 176, 168], 0, 0, 0, 0.9, 1.9, 0.7); for (const y of [1.25, 0.75]) for (const x of [-0.2, 0.2]) { box(mb, 'metalGrey', [40, 40, 44], x, y, -0.36, 0.3, 0.3, 0.01); } },
    panel(mb) { box(mb, 'paintGreen', [96, 120, 100], 0, 0, 0, 2.0, 0.9, 0.5); box(mb, 'paintGreen', [96, 120, 100], 0, 0.9, 0.15, 2.0, 0.4, 0.2); for (let i = 0; i < 8; i++) box(mb, 'glow', i % 3 ? [255, 180, 60] : [80, 255, 120], -0.8 + i * 0.22, 0.95, 0.04, 0.06, 0.06, 0.01); for (let i = 0; i < 3; i++) cyl(mb, 'glass', [200, 200, 180], -0.6 + i * 0.6, 1.0, 0.05, 0.1, 0.1, 0.02, 12); },
    bunk(mb) { for (const y of [0.35, 1.25]) { box(mb, 'metalGrey', metal, 0, y, 0, 0.9, 0.08, 2.0); box(mb, 'cloth', [110, 110, 90], 0, y + 0.08, 0, 0.8, 0.1, 1.9); } for (const x of [-0.43, 0.43]) for (const z of [-0.97, 0.97]) box(mb, 'metalGrey', metal, x, 0, z, 0.04, 1.7, 0.04); },
    cot(mb) { box(mb, 'metalGrey', metal, 0, 0.3, 0, 0.8, 0.06, 1.9); box(mb, 'cloth', [120, 116, 96], 0, 0.36, 0, 0.75, 0.08, 1.8); },
    piano(mb) { box(mb, 'wood', [40, 30, 26], 0, 0, 0, 1.5, 1.2, 0.6); box(mb, 'plasterWhite', [220, 220, 210], 0, 0.75, -0.32, 1.3, 0.05, 0.12); },
    column(mb) { box(mb, 'plasterWhite', [190, 186, 176], 0, 0, 0, 0.6, 3, 0.6); },
    rubble(mb) { mb.setMat(M('debris'), 0, 0); mb.setTint(128, 128, 128, 255); for (let i = 0; i < 6; i++) mb.box((i % 3 - 1) * 0.4, -0.1, (Math.floor(i / 3) - 0.5) * 0.5, 0.5 + (i % 2) * 0.3, 0.3 + (i % 3) * 0.15, 0.6, i * 0.7, 1); },
    radiator(mb) { for (let i = 0; i < 8; i++) box(mb, 'metalGrey', [180, 176, 166], -0.4 + i * 0.11, 0.1, 0, 0.07, 0.55, 0.1); },
    lamp(mb) { box(mb, 'glow', [255, 230, 180], 0, -0.12, 0, 0.3, 0.06, 0.3); box(mb, 'metalGrey', metal, 0, -0.06, 0, 0.36, 0.04, 0.36); },
    poster(mb, o) { mb.setMat(M(o && o.mat || 'paintRed'), 0, 0); mb.setTint(...(o && o.tint || [200, 60, 50]), 255); mb.quad([[-0.3, 0.9, 0], [-0.3, 1.75, 0], [0.3, 1.75, 0], [0.3, 0.9, 0]], [0, 0, -1], [[0, 1], [0, 0], [1, 0], [1, 1]]); },
    banner(mb) { mb.setMat(M('paintRed'), 0, 0); mb.setTint(190, 40, 34, 255); mb.quad([[-0.5, 0.6, 0], [-0.5, 2.4, 0], [0.5, 2.4, 0], [0.5, 0.6, 0]], [0, 0, -1], [[0, 1], [0, 0], [1, 0], [1, 1]]); },
    pipe(mb) { mb.setMat(M('rust'), 0, 0); mb.setTint(128, 128, 128, 255); const s0 = mb.n; mb.cyl(0, -1, 0, 0.1, 0.1, 2, 8, 1, false); mb.transformFrom(s0, Z.M4.trs(0, 0, 0, 0, Math.PI / 2, 0)); },
    sacks(mb) { for (let i = 0; i < 4; i++) box(mb, 'cloth', [170, 150, 110], (i % 2 - 0.5) * 0.45, Math.floor(i / 2) * 0.28, 0, 0.42, 0.28, 0.7); },
    boxes(mb) { box(mb, 'wood', [150, 120, 80], -0.25, 0, 0, 0.6, 0.6, 0.8); box(mb, 'wood', [140, 110, 76], 0.35, 0, 0.1, 0.5, 0.5, 0.6); box(mb, 'wood', [160, 130, 90], -0.2, 0.6, 0.05, 0.45, 0.4, 0.5); },
    tank(mb) { cyl(mb, 'rust', W, 0, 0, 0, 0.6, 0.6, 1.6, 12); },
    generator(mb) { box(mb, 'paintGreen', [80, 110, 80], 0, 0, 0, 1.4, 0.9, 0.9); cyl(mb, 'metalGrey', metal, 0.3, 0.9, 0, 0.08, 0.08, 0.4); },
    slot(mb) { box(mb, 'paintRed', [170, 50, 40], 0, 0, 0, 0.7, 1.7, 0.6); box(mb, 'glass', [200, 200, 160], 0, 1.0, -0.31, 0.5, 0.35, 0.01); box(mb, 'glow', [255, 210, 80], 0, 1.45, -0.31, 0.55, 0.12, 0.01); },
    stage(mb) { box(mb, 'wood', [120, 86, 60], 0, 0, 0, 4, 0.8, 3); },
    seats(mb) { for (let i = 0; i < 5; i++) { box(mb, 'fabric', [140, 40, 40], -1.2 + i * 0.6, 0.4, 0, 0.5, 0.1, 0.5); box(mb, 'fabric', [140, 40, 40], -1.2 + i * 0.6, 0.45, 0.22, 0.5, 0.5, 0.08); } box(mb, 'metalGrey', metal, 0, 0, 0, 3, 0.4, 0.4); },
    turbine(mb) { cyl(mb, 'paintRed', [200, 80, 60], 0, 0, 0, 2, 1.8, 2.2, 20); cyl(mb, 'metalGrey', metal, 0, 2.2, 0, 1.2, 0.6, 0.8, 16); }
  };

  const OBJ = {
    crate(mb) { box(mb, 'wood', [150, 124, 86], 0, 0, 0, 0.8, 0.6, 0.6); box(mb, 'wood', [110, 90, 64], 0, 0.6, 0, 0.84, 0.04, 0.64); },
    locker(mb) { box(mb, 'paintGreen', [100, 120, 110], 0, 0, 0, 0.6, 1.9, 0.5); box(mb, 'metalGrey', [60, 60, 60], 0, 1.4, -0.26, 0.4, 0.08, 0.01); },
    cabinet(mb) { box(mb, 'wood', [120, 86, 56], 0, 0, 0, 1.0, 1.9, 0.5); },
    fridge(mb) { box(mb, 'plasterWhite', [220, 220, 214], 0, 0, 0, 0.65, 1.6, 0.6); box(mb, 'metalGrey', [180, 180, 180], 0.25, 1.0, -0.31, 0.04, 0.3, 0.03); box(mb, 'paintRed', [180, 40, 30], -0.15, 1.45, -0.305, 0.18, 0.05, 0.01); },
    safe(mb) { box(mb, 'metalGrey', [70, 76, 72], 0, 0, 0, 0.6, 0.9, 0.6); cyl(mb, 'metalGrey', [180, 180, 170], 0, 0.5, -0.31, 0.06, 0.06, 0.02, 10); },
    desk(mb) { box(mb, 'wood', [120, 86, 56], 0, 0, 0, 1.4, 0.76, 0.7); box(mb, 'wood', [140, 104, 70], 0, 0.76, 0, 1.45, 0.04, 0.75); },
    nightstand(mb) { box(mb, 'wood', [120, 86, 56], 0, 0, 0, 0.45, 0.6, 0.4); },
    trash(mb) { box(mb, 'paintGreen', [70, 90, 70], 0, 0, 0, 0.9, 1.1, 0.7); box(mb, 'rust', W, 0, 1.1, 0.0, 0.92, 0.04, 0.72); },
    mailbox(mb) { box(mb, 'paintGreen', [60, 80, 120], 0, 1.2, 0, 0.4, 0.5, 0.2); },
    toolbox(mb) { box(mb, 'paintRed', [180, 50, 40], 0, 0, 0, 0.55, 0.3, 0.3); },
    ammobox(mb) { box(mb, 'paintGreen', [90, 100, 70], 0, 0, 0, 0.6, 0.35, 0.35); },
    medbox(mb) { box(mb, 'plasterWhite', [230, 230, 226], 0, 1.3, 0, 0.4, 0.3, 0.15); box(mb, 'paintRed', [200, 30, 30], 0, 1.4, -0.08, 0.16, 0.05, 0.01); box(mb, 'paintRed', [200, 30, 30], 0, 1.37, -0.08, 0.05, 0.16, 0.01); },
    bag(mb) { box(mb, 'cloth', [110, 110, 80], 0, 0, 0, 0.4, 0.4, 0.3); },
    barrel(mb) { cyl(mb, 'rust', W, 0, 0, 0, 0.3, 0.3, 0.9, 10); },
    door(mb, ob) { box(mb, ob && ob.mat || 'wood', ob && ob.tint || [120, 90, 66], 0, 0, 0, 1.1, 2.15, 0.08); box(mb, 'metalGrey', [180, 170, 120], 0.42, 1.0, -0.06, 0.04, 0.12, 0.04); },
    hatch(mb) { cyl(mb, 'metalGrey', [80, 86, 80], 0, 0, 0, 0.55, 0.55, 0.12, 12); cyl(mb, 'metalGrey', [60, 60, 60], 0, 0.12, 0, 0.2, 0.2, 0.06, 8); },
    gate(mb) { box(mb, 'rust', W, 0, 0, 0, 3.5, 2.6, 0.1); },
    terminal(mb) { box(mb, 'robotPaint', [180, 176, 160], 0, 0, 0, 0.6, 0.8, 0.5); box(mb, 'robotPaint', [180, 176, 160], 0, 0.8, 0.05, 0.55, 0.45, 0.45); box(mb, 'glow', [255, 170, 60], 0, 0.88, -0.18, 0.4, 0.3, 0.01); box(mb, 'metalGrey', [60, 60, 60], 0, 0.78, -0.22, 0.5, 0.04, 0.2); },
    bench(mb) { box(mb, 'wood', [140, 110, 76], 0, 0.85, 0, 1.8, 0.06, 0.8); for (const [x, z] of [[-0.8, -0.32], [0.8, -0.32], [-0.8, 0.32], [0.8, 0.32]]) box(mb, 'metalGrey', metal, x, 0, z, 0.06, 0.85, 0.06); box(mb, 'paintRed', [170, 50, 40], 0.5, 0.91, 0.1, 0.4, 0.15, 0.25); box(mb, 'metalGrey', [80, 80, 80], -0.6, 0.91, -0.2, 0.25, 0.25, 0.2); },
    campfire(mb) { mb.setMat(M('bark'), 0, 0); mb.setTint(90, 80, 70, 255); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; mb.box(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25, 0.6, 0.1, 0.1, a, 1); } mb.setMat(M('granite'), 0, 0); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; mb.box(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5, 0.2, 0.15, 0.18, a, 1); } },
    bed(mb) { box(mb, 'wood', [110, 80, 56], 0, 0, 0, 0.95, 0.4, 2.0); box(mb, 'cloth', [190, 180, 160], 0, 0.4, 0.05, 0.9, 0.15, 1.85); box(mb, 'cloth', [220, 220, 210], 0, 0.55, 0.75, 0.6, 0.1, 0.35); box(mb, 'wood', [100, 72, 50], 0, 0, 0.98, 0.95, 0.9, 0.06); },
    sofa(mb) { box(mb, 'fabric', [120, 60, 50], 0, 0, 0, 1.9, 0.45, 0.8); box(mb, 'fabric', [120, 60, 50], 0, 0.45, 0.3, 1.9, 0.45, 0.2); },
    note(mb) { box(mb, 'plasterWhite', [230, 226, 210], 0, 0, 0, 0.22, 0.01, 0.3); },
    sodamachine(mb) { box(mb, 'paintRed', [200, 60, 50], 0, 0, 0, 0.8, 1.7, 0.6); box(mb, 'plasterWhite', [230, 220, 200], 0, 1.3, -0.31, 0.6, 0.25, 0.01); box(mb, 'metalGrey', [80, 80, 80], 0, 0.6, -0.32, 0.3, 0.4, 0.05); },
    radio(mb) { box(mb, 'wood', [100, 64, 40], 0, 0, 0, 0.5, 0.3, 0.3); box(mb, 'fabric', [200, 180, 140], -0.08, 0.05, -0.155, 0.25, 0.2, 0.01); },
    switch(mb) { box(mb, 'metalGrey', [90, 90, 90], 0, 1.2, 0, 0.3, 0.5, 0.15); box(mb, 'paintRed', [200, 40, 30], 0, 1.4, -0.12, 0.05, 0.2, 0.05); },
    lever(mb) { box(mb, 'metalGrey', [90, 90, 90], 0, 0, 0, 0.3, 0.3, 0.3); box(mb, 'paintRed', [200, 40, 30], 0, 0.3, 0, 0.05, 0.5, 0.05); },
    corpse(mb) { box(mb, 'cloth', [70, 60, 50], 0, 0, 0, 0.5, 0.25, 1.6); },
    pump(mb) { cyl(mb, 'paintGreen', [60, 90, 70], 0, 0, 0, 0.12, 0.1, 1.2, 8); box(mb, 'paintGreen', [60, 90, 70], 0, 1.0, -0.15, 0.06, 0.06, 0.3); box(mb, 'metalGrey', metal, 0, 1.15, 0.2, 0.05, 0.05, 0.5); },
    car(mb, ob) { Z.Props.car(mb, ob && ob.model || 'zaz', ob && ob.tint); },
    item() {}
  };

  Z.Props = {
    P, OBJ,
    build(mb, kind, x, y, z, yaw, o) {
      const f = P[kind] || OBJ[kind];
      if (!f) return;
      const s0 = mb.n;
      f(mb, o);
      mb.transformFrom(s0, Z.M4.trs(x, y, z, -(yaw || 0), 0, 0));
    },
    car(mb, model, tint) {
      const c = tint || [[160, 60, 50], [70, 100, 140], [200, 190, 150], [90, 120, 90], [180, 170, 160]][(model || 'zaz').length % 5];
      const body = (len, wid, h, roofL, roofH, cab) => {
        mb.setMat(M('rust'), 0, 0); mb.setTint(c[0] * 0.6, c[1] * 0.6, c[2] * 0.6, 255);
        mb.box(0, 0.3, 0, wid, h - 0.3, len, 0, 0.5);
        mb.setMat(M('paintGreen'), 0, 0); mb.setTint(c[0], c[1], c[2], 255);
        mb.box(0, h - 0.05, cab || 0, wid * 0.98, 0.06, roofL + 0.4, 0, 0.5);
        mb.setMat(M('glass'), 0, 0); mb.setTint(60, 70, 80, 255);
        mb.box(0, h, cab || 0, wid * 0.92, roofH * 0.9, roofL, 0, 0.5);
        mb.setMat(M('paintGreen'), 0, 0); mb.setTint(c[0] * 0.9, c[1] * 0.9, c[2] * 0.9, 255);
        mb.box(0, h + roofH * 0.9, cab || 0, wid * 0.94, 0.06, roofL * 0.98, 0, 0.5);
        mb.setMat(M('rubber'), 0, 0); mb.setTint(40, 40, 40, 255);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const s0 = mb.n; mb.cyl(0, -0.1, 0, 0.3, 0.3, 0.2, 10, 1, true); mb.transformFrom(s0, Z.M4.trs(sx * wid / 2, 0.3, sz * len * 0.33, 0, 0, Math.PI / 2)); }
      };
      if (model === 'volga') body(4.8, 1.8, 0.95, 2.3, 0.5, 0.1);
      else if (model === 'zhiguli') body(4.1, 1.62, 0.9, 2.0, 0.5, 0.15);
      else if (model === 'bus') { body(9, 2.5, 1.0, 8.4, 1.6, 0); }
      else if (model === 'trolley') { body(11, 2.5, 1.0, 10.4, 1.7, 0); mb.setMat(M('metalGrey'), 0, 0); mb.setTint(80, 80, 80, 255); for (const sx of [-0.4, 0.4]) { const s0 = mb.n; mb.cyl(0, 0, 0, 0.03, 0.03, 4.5, 4, 1, false); mb.transformFrom(s0, Z.M4.trs(sx, 3.6, 2, 0, -1.25, 0)); } }
      else if (model === 'truck') { body(6.5, 2.4, 1.2, 1.6, 0.8, -2.2); mb.setMat(M('wood'), 0, 0); mb.setTint(120, 100, 80, 255); mb.box(0, 1.2, 1.0, 2.3, 0.7, 4.2, 0, 0.5); }
      else body(3.7, 1.5, 0.85, 1.8, 0.48, 0.2);
    }
  };

  Z.Scene.prototype.objVAO = function (ob) {
    this.objCache = this.objCache || new Map();
    const key = ob.type + (ob.mat || '') + (ob.tint ? ob.tint.join(',') : '') + (ob.model || '');
    let m = this.objCache.get(key);
    if (m !== undefined) return m;
    const mb = new Z.MeshBuilder();
    const f = OBJ[ob.type];
    if (f) f(mb, ob);
    m = mb.n ? this.r.meshVAO(mb.pack()) : null;
    this.objCache.set(key, m);
    return m;
  };

  Z.Scene.prototype.itemVAO = function (id) {
    this.itemCache = this.itemCache || new Map();
    if (this.itemCache.has(id)) return this.itemCache.get(id);
    const d = Z.item(id) || {};
    let mb;
    if (d.cat === 'weapon' && d.model && Z.GUN_MODELS[d.model]) mb = Z.gunMesh(d.model, d);
    else {
      mb = new Z.MeshBuilder();
      const col = d.cat === 'aid' ? (d.food ? [200, 160, 90] : [230, 230, 230]) : d.cat === 'ammo' ? [140, 130, 80] : d.cat === 'book' ? [150, 60, 50] : d.cat === 'apparel' ? [110, 100, 80] : d.currency ? [210, 190, 150] : [150, 150, 150];
      const mat = d.cat === 'apparel' ? 'cloth' : d.cat === 'book' ? 'paintRed' : d.currency ? 'plasterWhite' : 'metalGrey';
      mb.setMat(Z.MAT[mat], 0, 0); mb.setTint(col[0], col[1], col[2], 255);
      if (d.cat === 'aid' && d.drink) mb.cyl(0, 0, 0, 0.04, 0.035, 0.26, 8, 2, true);
      else if (d.cat === 'aid' && d.food) mb.cyl(0, 0, 0, 0.05, 0.05, 0.09, 10, 2, true);
      else if (d.cat === 'apparel') mb.box(0, 0, 0, 0.5, 0.1, 0.45, 0, 2);
      else if (d.cat === 'book') mb.box(0, 0, 0, 0.18, 0.04, 0.25, 0, 2);
      else if (d.currency) mb.box(0, 0, 0, 0.15, 0.02, 0.08, 0, 2);
      else mb.box(0, 0, 0, 0.2, 0.12, 0.15, 0, 2);
    }
    const m = mb.n ? this.r.meshVAO(mb.pack()) : null;
    this.itemCache.set(id, m);
    return m;
  };

  Z.Scene.prototype.drawObjects = function (r, cell) {
    const gl = r.gl, p = r.prog.world.use();
    r.setEnvUniforms(p);
    r.bindWorldTextures(p);
    gl.uniformMatrix4fv(p.u.uVP, false, r.vp);
    const ex = r.eye[0], ez = r.eye[2];
    const M4 = Z.M4;
    for (const ob of cell.objects) {
      if (ob.hidden || ob.taken || ob.baked) continue;
      if (Math.hypot(ob.x - ex, ob.z - ez) > 120) continue;
      let m, Mx;
      if (ob.item || ob.type === 'item') {
        m = this.itemVAO(ob.item);
        Mx = M4.trs(ob.x, ob.y + 0.05, ob.z, -(ob.yaw || 0) - (ob.spin || 0), Z.item(ob.item) && Z.item(ob.item).cat === 'weapon' ? 0 : 0, Z.item(ob.item) && Z.item(ob.item).cat === 'weapon' ? Math.PI / 2 : 0);
      } else {
        m = this.objVAO(ob);
        if (ob.T.door && ob.open) Mx = M4.mul(M4.trs(ob.x, ob.y, ob.z, -(ob.yaw || 0), 0, 0), M4.mul(M4.trs(-0.55, 0, 0, -1.4, 0, 0), M4.trs(0.55, 0, 0, 0, 0, 0)));
        else Mx = M4.trs(ob.x, ob.y, ob.z, -(ob.yaw || 0), 0, 0);
      }
      if (!m) continue;
      gl.uniformMatrix4fv(p.u.uModel, false, Mx);
      gl.bindVertexArray(m.vao);
      gl.drawElements(gl.TRIANGLES, m.count, m.type, 0);
    }
    gl.uniformMatrix4fv(p.u.uModel, false, r.ident);
    gl.bindVertexArray(null);
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
