(function (O) {
  'use strict';
  O.MAPS = O.MAPS || {};

  const COLS = [0xf2c94a, 0xf28a6a, 0x5ec4c8, 0xe87aa8, 0xa8d86a, 0xf4a040, 0xb89ae0, 0xf4e8c8];

  function casa(B, x0, z0, x1, z1, h, i, o = {}) {
    const tint = o.tint || COLS[i % COLS.length];
    B.house(x0, z0, x1, z1, h, 'plaster', {
      y: o.y, tint, band: { h: 0.9, mat: 'stone', tint: 0x9a8a78 }, top: 'concrete', topTint: 0x8a7a6a,
      roof: o.roof, roofMat: 'roofTerra', roofTint: 0xffffff, roofH: o.roofH || 1.8, over: 0.5,
      win: o.win === false ? null : { tex: 'window', sp: 3, w: 1.2, h: 1.7, fl: 3.6, sill: 1.2, sides: o.sides || 'nsew', lit: o.lit === undefined ? 55 : o.lit, tint: 0xffffff }
    });
    if (!o.roof && o.parapet !== false) {
      const y = (o.y || 0) + h;
      B.box(x0, y, z0, x1, y + 0.7, z0 + 0.3, 'plaster', { tint, col: false });
      B.box(x0, y, z1 - 0.3, x1, y + 0.7, z1, 'plaster', { tint, col: false });
      B.box(x0, y, z0, x0 + 0.3, y + 0.7, z1, 'plaster', { tint, col: false });
      B.box(x1 - 0.3, y, z0, x1, y + 0.7, z1, 'plaster', { tint, col: false });
    }
  }

  function strLights(B, x0, z0, x1, z1, h, kind) {
    B.prop(kind === 'papel' ? 'papel' : 'string', x0, z0, { to: [x1 - x0, z1 - z0], h, col: false, y: 0, n: Math.max(6, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.2)) });
    if (kind !== 'papel') B.light((x0 + x1) / 2, h - 0.5, (z0 + z1) / 2, 0xffc878, 9, { k: 0.8 });
  }

  O.MAPS.dorado = {
    id: 'dorado', name: 'DORADO', mode: 'escort', payloadStyle: 'dorado',
    theme: {
      skyTop: 0x0e1638, skyHorizon: 0x3a3a6a, skyLow: 0x1a1a30, fog: 0x2a2a4a, fogNear: 40, fogFar: 170,
      sun: [0.35, 0.7, 0.55], sunCol: 0x6878b0, amb: 0x5a5a88, ground: 0x4a3a3a,
      skyline: 'city', skylineTint: 0x1e1e3a, time: 'night', confetti: true, sea: -3, seaCol: 0x1a2a4a
    },
    build(B) {
      B.bounds(-48, -110, 48, 104);
      B.floor(-48, -110, 48, 104, 0, 'cobble', { tint: 0xc8b8a8, uv: 0.8 });

      B.spawnRoom({ role: 'att', stage: [0, 0], x: 0, z: -105, w: 18, d: 10, yaw: 0, exits: [{ side: 'n', a: 5, b: 13 }], mat: 'plaster', tint: 0xe8d8b8 });
      casa(B, -48, -110, -9, -100, 8, 1, { sides: 'n' });
      casa(B, 9, -110, 48, -100, 8, 2, { sides: 'n' });

      casa(B, -48, -100, -24, -72, 9, 3, { sides: 'e' });
      casa(B, -24, -100, -7, -72, 7, 4, { sides: 'e' });
      B.box(-48, 0, -72, -24, 9, -15, 'plaster', { tint: COLS[5] });
      B.windows(-48, -72, -24, -15, 0, 9, { tex: 'window', sp: 3, w: 1.2, h: 1.7, fl: 3.6, sill: 1.2, sides: 'e', lit: 60 });
      casa(B, 11, -100, 48, -65, 9, 6, { sides: 'nw' });
      B.box(7, 0, -100, 11, 4, -92, 'plaster', { tint: COLS[6] });
      B.box(7, 0, -92, 11, 4, -70, 'plaster', { tint: COLS[6], top: 'wood', topTint: 0xb08a60 });
      B.rail(7.1, -92, 7.1, -72, 4, 'metal', { tint: 0x2a2a2a });
      B.stairs(7, -70, 11, -65, 0, 4, 'z-', 'stone', { tint: 0xb8a898 });
      B.prop('awning', 9, -88, { w: 4, d: 1.5, h: 7, c: 0xd83a4a, yaw: -Math.PI / 2, col: false, y: 0 });
      B.healthPack(-5, -82, false);
      B.healthPack(9, -80, false, 4);
      B.prop('car', -4, -76, { c: 0x2a8aa8 });
      B.prop('car', 4, -88, { c: 0xc85a2a, yaw: Math.PI });
      B.prop('crates', -4, -62);
      for (const z of [-94, -80, -66]) strLights(B, -7, z, 7, z, 6);
      strLights(B, -7, -86, 7, -86, 6.5, 'papel');
      for (const [x, z] of [[-6, -96], [6, -70]]) { B.prop('lamp', x, z, { glow: 0xffd890 }); B.light(x, 4.2, z, 0xffb060, 12); }

      casa(B, -17, -51, 13, -34, 8, 7, { sides: 'nsew' });
      casa(B, -17, -34, 6, -15, 8, 0, { sides: 'nse' });
      B.prop('crates', -20, -48);
      B.healthPack(-20, -40, true);
      B.prop('tree_palm', -20, -28, { h: -1 });
      B.prop('car', 20, -44, { c: 0xe8e0d0, yaw: 0.1 });
      B.prop('barrels', 25, -60);
      strLights(B, -7, -58, 27, -58, 6);
      strLights(B, 13, -46, 27, -46, 6, 'papel');

      B.box(30, 0, -65, 48, 9, -59, 'plaster', { tint: COLS[2] });
      B.box(30, 0, -47, 48, 9, -34, 'plaster', { tint: COLS[2] });
      B.box(43, 0, -59, 48, 9, -47, 'plaster', { tint: COLS[2] });
      B.windows(30, -47, 48, -34, 0, 9, { tex: 'window', sp: 3, w: 1.2, h: 1.7, fl: 3.6, sill: 1.2, sides: 'w', lit: 50 });
      B.windows(30, -65, 48, -59, 0, 9, { tex: 'window', sp: 3, w: 1.2, h: 1.7, fl: 3.6, sill: 1.2, sides: 'w', lit: 50 });
      B.box(30, 0, -59, 43, 9, -47, 'plaster', { tint: COLS[2] });
      B.windows(30, -59, 43, -47, 0, 9, { tex: 'window', sp: 3, w: 1.2, h: 1.7, fl: 3.6, sill: 1.2, sides: 'w', lit: 50 });

      B.box(34, 0, -34, 48, 10, -10, 'stone', { tint: 0xd8c8a8 });
      B.box(31, 0, -28, 34, 1.2, -16, 'stone', { tint: 0xc8b898 });
      B.stairs(29, -26, 31, -18, 0, 1.2, 'x+', 'stone', { tint: 0xc8b898 });
      for (const z of [-27, -22, -17]) B.cyl(33, z, 1.2, 8, 0.4, 'marble', { tint: 0xf0e8d8 });
      B.box(31, 8, -29, 34.5, 8.8, -15, 'stone', { tint: 0xe0d0b0, col: false });
      B.sign(34, 6, -22, 'w', 12, 1.6, 'BANCO DE DORADO', { bg: '#3a2a1a', fg: '#f4d890', font: 'bold 44px Georgia, serif' });
      B.decal(34, 2.6, -22, 'w', 3.4, 3.2, 'door', { off: 0.05 });
      B.prop('stall', 14, -30, { c: 0x2a8ad8, yaw: Math.PI / 2, lamp: true });
      B.prop('stall', 28, -40, { c: 0xe84a6a, yaw: -Math.PI / 2, lamp: true });
      B.prop('table', 10, -20, { umbrella: true, uc: 0xe83a4a });
      B.prop('table', 24, -14, { umbrella: true, uc: 0x2aa8c8 });
      B.healthPack(28, -32, false);
      for (const [x, z] of [[8, -32], [30, -12]]) { B.prop('lamp2', x, z, { glow: 0xffd890 }); B.light(x, 4.4, z, 0xffb060, 14); }
      strLights(B, 6, -24, 34, -24, 7);
      strLights(B, 6, -16, 34, -30, 7.5, 'papel');

      B.spawnRoom({ owners: [{ role: 'def', stage: [0, 0] }, { role: 'att', stage: [1, 1] }], x: 41, z: 1, w: 14, d: 14, yaw: -Math.PI / 2, exits: [{ side: 'w', a: 4, b: 10 }], mat: 'plaster', tint: 0xe8d8b8 });
      B.box(34, 0, -10, 48, 8, -6, 'plaster', { tint: COLS[3] });
      B.prop('fountain', 8, 2, { c: 0xe8d8c0 });
      B.healthPack(12, 4, false);
      B.prop('car', -18, -4, { c: 0x6a4ab8, yaw: Math.PI / 2 });
      B.prop('bench', 26, 6, { yaw: Math.PI });
      strLights(B, -24, -10, 34, -10, 7);
      strLights(B, -24, 4, 34, 4, 7.2, 'papel');

      casa(B, 16, 8, 48, 43, 10, 4, { sides: 'nsw', lit: 60 });
      B.box(10, 0, 12, 16, 4, 30, 'plaster', { tint: COLS[1], top: 'wood', topTint: 0xb08a60 });
      B.rail(10.1, 12, 10.1, 30, 4, 'metal', { tint: 0x2a2a2a });
      B.stairs(10, 30, 16, 34, 0, 4, 'z-', 'stone', { tint: 0xb8a898 });
      B.prop('table', 13, 20, { umbrella: true, uc: 0xf0c040, y: 4 });
      B.healthPack(13, 26, false, 4);
      casa(B, 1, 34, 16, 43, 7, 5, { sides: 'nw' });

      B.box(-48, 0, -15, -24, 9, 8, 'plaster', { tint: COLS[4] });
      B.box(-48, 0, 8, -36, 10, 104, 'plaster', { tint: COLS[6] });
      B.box(-36, 0, 8, -22, 10, 16, 'plaster', { tint: COLS[6] });
      B.box(-36, 0, 30, -22, 10, 104, 'plaster', { tint: COLS[6] });
      B.windows(-36, 30, -22, 104, 0, 10, { tex: 'window', sp: 3, w: 1.2, h: 1.7, fl: 3.6, sill: 1.2, sides: 'e', lit: 50 });
      B.box(-22, 0, 34, -13, 8, 57, 'plaster', { tint: COLS[7] });
      B.box(-22, 0, 8, -13, 8, 12, 'plaster', { tint: COLS[7] });
      B.spawnRoom({ owners: [{ role: 'def', stage: [1, 1] }, { role: 'att', stage: [2, 2] }], x: -29, z: 23, w: 14, d: 14, yaw: Math.PI / 2, exits: [{ side: 'e', a: 3, b: 9 }], mat: 'plaster', tint: 0xe8d8b8 });
      B.prop('fountain', 4, 17, { c: 0xe0d0b8 });
      B.prop('tree_palm', -18, 30);
      B.prop('tree_palm', 6, 30);
      B.healthPack(-18, 14, true);
      B.healthPack(-10, 42, false);
      strLights(B, -22, 20, 10, 20, 7);
      strLights(B, -22, 28, 10, 28, 7.4, 'papel');
      for (const [x, z] of [[-12, 14], [0, 32]]) { B.prop('lamp2', x, z, { glow: 0xffd890 }); B.light(x, 4.4, z, 0xffb060, 14); }

      B.box(-48, 0, 57, 0, 11, 104, 'plaster', { tint: COLS[0] });
      B.windows(-48, 57, 0, 104, 0, 11, { tex: 'window', sp: 3, w: 1.2, h: 1.7, fl: 3.6, sill: 1.2, sides: 'se', lit: 60 });
      B.box(0, 0, 57, 9, 9, 76, 'plaster', { tint: COLS[2] });
      B.windows(0, 57, 9, 76, 0, 9, { tex: 'window', sp: 3, w: 1.2, h: 1.7, fl: 3.6, sill: 1.2, sides: 'e', lit: 60 });
      B.box(23, 0, 43, 48, 10, 76, 'plaster', { tint: COLS[3] });
      B.windows(23, 43, 48, 76, 0, 10, { tex: 'window', sp: 3, w: 1.2, h: 1.7, fl: 3.6, sill: 1.2, sides: 'w', lit: 60 });
      B.healthPack(18, 46, false);
      B.healthPack(20, 66, true);
      B.prop('car', -2, 52, { c: 0xd8b030, yaw: Math.PI / 2 });
      B.prop('crates', 12, 60);
      strLights(B, -13, 50, 23, 50, 7);
      strLights(B, 9, 64, 23, 64, 7, 'papel');

      B.box(-2, 0, 100, 48, 18, 104, 'metal', { tint: 0xd8dce8, band: { h: 2, mat: 'concrete', tint: 0x8a8a94 } });
      B.sign(20, 14, 99.9, 's', 22, 3, 'LUMÉRICO', { bg: '#0a1830', fg: '#6ae8ff', font: 'bold 48px "Arial Black", sans-serif', glow: true, emit: 1 });
      B.box(40, 0, 76, 48, 12, 100, 'metal', { tint: 0xc8ccd8 });
      B.box(-2, 0, 76, 0, 12, 100, 'metal', { tint: 0xc8ccd8 });
      B.spawnRoom({ role: 'def', stage: [2, 2], x: 34, z: 93, w: 12, d: 14, yaw: Math.PI, exits: [{ side: 'w', a: 3, b: 8 }, { side: 's', a: 3, b: 9 }], mat: 'metal', tint: 0xd8dce8 });
      for (const x of [6, 14, 22]) { B.cyl(x, 98, 0, 7, 1.2, 'metal', { tint: 0xe0e4f0, col: true }); B.box(x - 0.5, 7, 97.5, x + 0.5, 9, 98.5, 'metal', { tint: 0x6ae8ff, emit: 1, col: false }); B.light(x, 8, 96, 0x6ae8ff, 12); }
      B.healthPack(4, 80, false);
      B.prop('crates', 30, 80);
      B.box(8, 0, 88, 12, 1.2, 92, 'metal', { tint: 0x8a8ea0 });

      B.path([[0, -92], [0, -58], [20, -58], [20, -22], [20, -8], [-6, -8], [-6, 22], [-6, 50], [16, 50], [16, 84]], [3, 6, 9]);

      B.prop('boat', -30, -126, { col: false, y: -3 });
      B.prop('boat', 26, -130, { col: false, y: -3, c: 0xe8c040 });
      B.prop('skyline', 0, 0, { col: false, n: 14, r: 170, h: 24, c: 0x2a2440, lit: 0.35, lc: 0xffc070, a0: -1.2, span: 2.4, y: 0 });

      B.hint('hold', 0, 20, -40); B.hint('hold', 0, 18, -52); B.hint('hold', 0, 26, -30); B.hint('perch', 0, 32, -22, { y: 1.2 }); B.hint('stage', 0, 0, -80);
      B.hint('hold', 1, -6, 4); B.hint('hold', 1, 6, -4); B.hint('hold', 1, -10, 16); B.hint('perch', 1, 13, 20, { y: 4 }); B.hint('stage', 1, 20, -16);
      B.hint('hold', 2, -4, 55); B.hint('hold', 2, 16, 62); B.hint('hold', 2, 10, 50); B.hint('stage', 2, -6, 30);

      B.cam('shot', 16, 8, -52, 20, 2, -20);
      B.cam('menu', 24, 3, -40, 30, 5, -18);
    }
  };

  const GIB = { pan: 0xe8ecf2, pan2: 0xc8d0dc, rock: 0xa89a86, asp: 0x8a8a90, org: 0xf08a30, trim: 0x9aa0ac };

  function gibBlock(B, x0, z0, x1, z1, h, sides) {
    B.house(x0, z0, x1, z1, h, 'panel', { tint: GIB.pan, band: { h: 0.8, mat: 'concrete', tint: 0x9a9aa4 }, top: 'metal', topTint: 0xb0b4c0, win: { tex: 'glass', sp: 3.6, w: 2, h: 1.4, fl: 4, sill: 1.6, sides: sides || 'nsew', lit: 0 } });
  }
  function gibRock(B, x0, z0, x1, z1, h, y0) {
    B.box(x0, y0 === undefined ? 0 : y0, z0, x1, h, z1, 'rock', { tint: GIB.rock, uv: 0.8 });
  }
  function gibCliff(B, x0, z0, x1, z1) {
    B.box(x0, -26, z0, x1, -0.3, z1, 'rock', { tint: 0x98897a, uv: 0.6, col: false });
  }

  O.MAPS.gibraltar = {
    id: 'gibraltar', name: 'WATCHPOINT: GIBRALTAR', mode: 'escort', payloadStyle: 'gibraltar',
    theme: {
      skyTop: 0x4a8ad8, skyHorizon: 0xcfe4f4, skyLow: 0x5a7a9a, fog: 0xc4d8e8, fogNear: 70, fogFar: 260,
      sun: [0.42, 0.8, -0.3], sunCol: 0xfff2dc, amb: 0x94a4c0, ground: 0x8a8070,
      skyline: 'rocks', skylineTint: 0x8a98a8, time: 'day', sea: -18, seaCol: 0x2a6aa8
    },
    build(B) {
      B.bounds(-50, -110, 50, 106);
      B.killY(-12);
      B.floor(-18, -108, 18, -78, 0, 'concrete', { tint: 0xb8bcc4 });
      B.floor(-34, -78, 50, 16, 0, 'asphalt', { tint: GIB.asp });
      B.floor(-34, 16, 50, 50, 0, 'concrete', { tint: 0xb0b4bc });
      B.floor(-10, 50, 50, 106, 0, 'concrete', { tint: 0xb4b8c0 });
      gibCliff(B, -34, -78, -31, 50);
      gibCliff(B, -34, 47, -10, 50);
      gibCliff(B, -10, 50, -7, 104);
      B.rail(-34, -68, -34, -44, 0, 'metal', { tint: GIB.org, t: 0.2 });
      B.rail(-34, -38, -34, 20, 0, 'metal', { tint: GIB.org, t: 0.2 });
      B.rail(-34, 26, -34, 50, 0, 'metal', { tint: GIB.org, t: 0.2 });
      B.rail(-34, 50, -10, 50, 0, 'metal', { tint: GIB.org, t: 0.2 });
      B.rail(-10, 50, -10, 104, 0, 'metal', { tint: GIB.org, t: 0.2 });

      B.wall(-18, -108, 18, -108, 12, 0.6, 'panel', { tint: GIB.pan2 });
      B.wall(-18, -108, -18, -78, 12, 0.6, 'panel', { tint: GIB.pan2 });
      B.wall(18, -108, 18, -78, 12, 0.6, 'panel', { tint: GIB.pan2 });
      B.wall(-18, -78, 18, -78, 12, 0.6, 'panel', { tint: GIB.pan2, holes: [[8, 28, 0, 9]] });
      B.box(-18.5, 12, -108.5, 18.5, 12.6, -77.5, 'metal', { tint: GIB.trim });
      B.sign(0, 10.4, -77.6, 'n', 16, 2, 'АНГАР 03 · OVERWATCH', { bg: '#e8ecf2', fg: '#f08a30' });
      B.spawnRoom({ role: 'att', stage: [0, 0], x: -11, z: -100, w: 12, d: 12, yaw: Math.PI / 2, exits: [{ side: 'e', a: 3, b: 9 }], mat: 'panel', tint: GIB.pan });
      B.prop('crates', 12, -102, { y: 0 });
      B.prop('forklift', 8, -90, { yaw: -0.5, y: 0 });
      B.prop('container', 14, -88, { c: GIB.org, y: 0 });
      B.healthPack(8, -104, false);
      for (const z of [-102, -90]) B.light(0, 10, z, 0xe8f0ff, 18);

      gibRock(B, -34, -78, -12, -68, 3);
      B.rail(-34, -78, -34, -68, 3, 'metal', { tint: GIB.org, t: 0.2 });
      B.stairs(-12, -74, -6, -68, 0, 3, 'x-', 'metal', { tint: GIB.trim });
      B.prop('antenna', -28, -74, { h: 18, col: false, y: 3 });
      gibRock(B, 14, -78, 50, -62, 7);
      gibRock(B, 30, -62, 50, -52, 9);
      gibRock(B, 44, -52, 50, -38, 9);
      gibRock(B, 30, -38, 50, -10, 9);
      gibRock(B, 30, -52, 44, -38, 9);
      B.prop('bigrock', -24, -54, { c: 0x9a8a78 });
      B.prop('container', -4, -48, { c: 0x2a6aa8, yaw: Math.PI / 2 });
      B.prop('crates', 8, -60);
      B.healthPack(-28, -58, true);
      B.healthPack(24, -44, false);

      gibBlock(B, -8, -40, 12, -18, 4.5, 'nsw');
      B.rail(-8, -40, -8, -18, 4.5, 'metal', { tint: GIB.org });
      B.rail(-2, -18.2, 12, -18.2, 4.5, 'metal', { tint: GIB.org });
      B.stairs(-8, -18, -2, -10, 0, 4.5, 'z-', 'metal', { tint: GIB.trim });
      B.ramp(6, -50, 12, -40, 0, 4.5, 'z+', 'metal', { tint: GIB.trim });
      B.box(-32, 0, -25, -30, 6.5, -23, 'panel', { tint: GIB.pan2 });
      B.box(-10, 0, -25, -8, 6.5, -23, 'panel', { tint: GIB.pan2 });
      B.box(-32, 6, -25.5, -8, 7, -22.5, 'panel', { tint: GIB.pan });
      B.sign(-20, 6.5, -25.55, 's', 12, 0.9, 'КПП · ПОСТ НАБЛЮДЕНИЯ', { bg: '#f08a30', fg: '#ffffff' });
      B.prop('container', 22, -30, { c: 0x6a7a8a });
      B.prop('crates', 20, -16);
      B.prop('barrels', -26, -36);
      B.healthPack(-28, -30, false);
      B.healthPack(6, -24, false, 4.5);

      B.spawnRoom({ owners: [{ role: 'def', stage: [0, 0] }, { role: 'att', stage: [1, 1] }], x: 11, z: -3, w: 14, d: 14, yaw: -Math.PI / 2, exits: [{ side: 'w', a: 4, b: 10 }], mat: 'panel', tint: GIB.pan });
      gibBlock(B, 21, -10, 40, 36, 8, 'w');
      B.prop('dish', -26, -4, { col: false });
      B.box(-27, 0, -5, -25, 1.5, -3, 'metal', { vis: false });
      B.prop('crates', -14, 6);
      B.prop('bench', -6, 12, { yaw: Math.PI });
      B.prop('bush', -30, 12);
      B.healthPack(-28, 8, true);

      B.wall(-8, 16, 16, 16, 12, 0.6, 'panel', { tint: GIB.pan2, holes: [[6, 18, 0, 6]] });
      B.wall(-8, 16, -8, 50, 12, 0.6, 'panel', { tint: GIB.pan2, holes: [[10, 16, 0, 3.4]] });
      B.wall(16, 16, 16, 50, 12, 0.6, 'panel', { tint: GIB.pan2 });
      B.wall(-8, 50, 16, 50, 12, 0.6, 'panel', { tint: GIB.pan2, holes: [[6, 18, 0, 6]] });
      B.box(-8.5, 12, 15.5, 16.5, 12.6, 50.5, 'metal', { tint: GIB.trim });
      B.sign(4, 9, 15.6, 's', 14, 1.8, 'ПОСТ НАБЛЮДЕНИЯ: ГИБРАЛТАР', { bg: '#1a2a44', fg: '#f0f4ff' });
      B.box(10, 0, 20, 16, 2, 32, 'metal', { tint: 0x8a90a0, top: 'grate', topTint: 0xc0c4d0 });
      B.ramp(6, 24, 10, 30, 0, 2, 'x+', 'metal', { tint: GIB.trim });
      B.ramp(10, 32, 16, 37, 0, 2, 'z-', 'metal', { tint: GIB.trim });
      B.slab(-8, 26, -4, 48, 4, 0.4, 'grate');
      B.stairs(-8, 18, -4, 26, 0, 4.4, 'z+', 'metal', { tint: GIB.trim });
      B.cyl(-2, 38, 0, 1, 1.4, 'metal', { tint: 0x5a6070 });
      B.box(-3, 1, 37, -1, 1.1, 39, 'metal', { tint: 0x60c8ff, emit: 1, col: false });
      B.light(-2, 3, 38, 0x60c8ff, 10);
      B.prop('crates', 0, 24, { y: 0 });
      B.healthPack(13, 26, false, 2);
      for (const z of [24, 40]) B.light(4, 10, z, 0xe8f0ff, 16);
      gibRock(B, -30, 24, -24, 28, 1.8);
      gibRock(B, -20, 38, -14, 42, 2.2);
      B.healthPack(-28, 40, false);
      B.spawnRoom({ owners: [{ role: 'def', stage: [1, 1] }, { role: 'att', stage: [2, 2] }], x: 27, z: 43, w: 14, d: 14, yaw: -Math.PI / 2, exits: [{ side: 'w', a: 2, b: 8 }], mat: 'panel', tint: GIB.pan });
      gibRock(B, 34, 36, 40, 50, 8);
      gibRock(B, 40, -10, 50, 50, 10);
      B.healthPack(18, 24, false);

      B.box(28, 0, 56, 40, 4, 70, 'concrete', { tint: 0xa0a4ac, top: 'grate', topTint: 0xc0c4d0 });
      B.stairs(20, 56, 28, 62, 0, 4, 'x+', 'metal', { tint: GIB.trim });
      B.rail(28, 70.1, 40, 70.1, 4, 'metal', { tint: GIB.org });
      B.prop('antenna', 36, 60, { h: 22, col: false, y: 4 });
      B.prop('dish', 32, 66, { col: false, y: 4 });
      gibBlock(B, -10, 62, 0, 78, 5, 'es');
      B.stairs(-10, 78, -4, 88, 0, 5, 'z-', 'metal', { tint: GIB.trim });
      gibRock(B, 40, 50, 50, 106, 12);
      gibRock(B, -10, 104, 40, 106, 14);
      B.prop('bigrock', 10, 68, { c: 0x9a8a78 });
      B.prop('container', 16, 90, { c: GIB.org });
      B.healthPack(-6, 56, true);
      B.healthPack(34, 66, false, 4);
      B.healthPack(14, 82, false);
      B.healthPack(16, 58, false);

      B.decal(34, 0.03, 99, 'up', 12, 12, 'hazard');
      B.prop('rocket', 34, 99, { col: false, y: 0 });
      for (const [x, z] of [[29, 94], [39, 94], [29, 104], [39, 104]]) B.box(x - 0.3, 0, z - 0.3, x + 0.3, 24, z + 0.3, 'metal', { vis: false });
      B.box(31.8, 0, 96.8, 36.2, 30, 101.2, 'metal', { vis: false });
      B.spawnRoom({ role: 'def', stage: [2, 2], x: 1, z: 97, w: 14, d: 14, yaw: Math.PI / 2, exits: [{ side: 'e', a: 2, b: 8 }, { side: 's', a: 3, b: 9 }], mat: 'panel', tint: GIB.pan });

      B.path([[0, -96], [0, -70], [-20, -50], [-20, -24], [-20, -4], [4, 10], [4, 46], [4, 58], [26, 74], [26, 98]], [3, 6, 9]);

      B.prop('lighthouse', -86, 24, { col: false, y: -18 });
      B.prop('boat', -70, -60, { col: false, y: -18, c: 0xf0f0f0 });
      B.prop('boat', -64, 80, { col: false, y: -18, c: 0xe86a20, yaw: 1.2 });
      B.prop('bigrock', -52, -20, { col: false, y: -18, s: 3, c: 0x9a8a78 });
      B.prop('bigrock', -40, 70, { col: false, y: -18, s: 4, c: 0x9a8a78 });

      B.hint('hold', 0, -20, -34); B.hint('hold', 0, -10, -46); B.hint('hold', 0, 2, -52); B.hint('perch', 0, 2, -30, { y: 4.5 }); B.hint('stage', 0, 0, -72);
      B.hint('hold', 1, -12, 6); B.hint('hold', 1, 4, 12); B.hint('hold', 1, -24, 10); B.hint('perch', 1, 13, 28, { y: 2 }); B.hint('perch', 1, -6, 40, { y: 4.4 }); B.hint('stage', 1, -16, -18);
      B.hint('hold', 2, 4, 62); B.hint('hold', 2, 16, 72); B.hint('hold', 2, -4, 56); B.hint('perch', 2, 34, 62, { y: 4 }); B.hint('perch', 2, -5, 70, { y: 5 }); B.hint('stage', 2, 18, 46);

      B.cam('shot', -30, 10, -60, -10, 2, -24);
      B.cam('menu', -6, 3, 58, 30, 10, 96);
    }
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
