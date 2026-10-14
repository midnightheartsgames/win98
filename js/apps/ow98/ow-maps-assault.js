(function (O) {
  'use strict';
  O.MAPS = O.MAPS || {};

  const PL = 0xf3e7cf, WD = 0x5e3d28, RF = 0x5f6a80, RED = 0xb3301e, ST = 0xb8b0a0, PV = 0xd4cab6;

  function jp(B, x0, z0, x1, z1, h, o = {}) {
    const y = o.y || 0;
    B.house(x0, z0, x1, z1, h, 'plaster', {
      y, tint: o.tint || PL, band: { h: 1.0, mat: 'stone', tint: ST },
      roof: o.roof === undefined ? 'hip' : o.roof, roofMat: 'roofJp', roofTint: RF, roofH: o.roofH || Math.min(3.2, Math.min(x1 - x0, z1 - z0) * 0.3), over: 1.1, curl: 0.45,
      win: o.win === false ? null : { tex: 'shoji', sp: 2.8, w: 1.5, h: 1.3, fl: 3.6, sill: 1.2, sides: o.sides || 'nsew', lit: o.lit || 0 }
    });
    if (o.posts !== false) {
      for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) B.box(px - 0.2, y, pz - 0.2, px + 0.2, y + h, pz + 0.2, 'woodDark', { tint: WD, col: false });
      B.box(x0 - 0.12, y + h - 0.5, z0 - 0.12, x1 + 0.12, y + h - 0.2, z1 + 0.12, 'woodDark', { tint: WD, col: false, skip: { top: true, bottom: true } });
      if (h > 5) B.box(x0 - 0.1, y + 3.6, z0 - 0.1, x1 + 0.1, y + 3.85, z1 + 0.1, 'woodDark', { tint: WD, col: false, skip: { top: true, bottom: true } });
    }
  }

  function railing(B, x0, z0, x1, z1, y, tint) {
    B.box(x0, y, z0, x1, y + 1.05, z1, 'wood', { tint: tint || RED, nobul: true });
  }

  O.MAPS.hanamura = {
    id: 'hanamura', name: 'HANAMURA', mode: 'assault',
    theme: {
      skyTop: 0x7fb2e8, skyHorizon: 0xf5dcc6, fog: 0xecd9cc, fogNear: 70, fogFar: 230,
      sun: [-0.45, 0.72, -0.52], sunCol: 0xffecd2, amb: 0x8a8ea8, ground: 0x9a8a70,
      skyline: 'mountains', skylineTint: 0x8fa0b8, time: 'day', petals: true
    },
    build(B) {
      B.bounds(-46, -92, 46, 96);
      B.floor(-46, -92, 46, 96, 0, 'paving', { tint: PV, uv: 0.5 });

      B.spawnRoom({ role: 'att', stage: [0, 1], x: 0, z: -82, w: 16, d: 10, yaw: 0, exits: [{ side: 'n', a: 4, b: 12 }], tint: 0xe4dccc, mat: 'plaster' });
      B.spawnRoom({ owners: [{ role: 'def', stage: [0, 0] }, { role: 'att', stage: [1, 1] }], x: -36, z: 27, w: 16, d: 14, yaw: Math.PI * 0.8, exits: [{ side: 's', a: 6, b: 12 }, { side: 'e', a: 5, b: 10 }], tint: 0xe4dccc, mat: 'plaster' });
      B.spawnRoom({ role: 'def', stage: [1, 1], x: 28, z: 89, w: 16, d: 14, y: 2.4, yaw: Math.PI, exits: [{ side: 's', a: 1, b: 6 }, { side: 's', a: 9, b: 14 }], tint: 0xe4dccc, mat: 'plaster' });

      jp(B, -46, -92, -10, -58, 8, { sides: 'ne' });
      jp(B, 10, -92, 46, -62, 8, { sides: 'nw' });
      B.box(-10, 0, -92, 10, 7, -87.5, 'plaster', { tint: PL });
      jp(B, -27, -54, -10, -44, 6.5, { sides: 'nse' });
      B.stairs(-32, -54, -27, -44, 0, 4, 'z+', 'stone', { tint: ST });
      B.box(-32, 0, -44, -18, 4, -38, 'stone', { tint: ST });
      railing(B, -18.4, -44, -18, -38, 4);
      jp(B, -46, -58, -32, -30, 8, { sides: 'e' });
      jp(B, 10, -60, 28, -38, 7, { sides: 'nsw' });
      jp(B, 36, -62, 46, -30, 8, { sides: 'w' });

      B.box(-32, 0, -38, -31.5, 7.6, -20, 'plaster', { tint: PL });
      B.wall(-32, -38, -18, -38, 7.6, 0.5, 'plaster', { tint: PL, holes: [[2, 6, 4, 7]] });
      B.wall(-18, -38, -18, -20, 7.6, 0.5, 'plaster', { tint: PL, holes: [[2, 6, 0, 3.2], [12, 15, 4, 7]] });
      B.wall(-32, -20, -18, -20, 7.6, 0.5, 'plaster', { tint: PL, holes: [[4, 8, 0, 3.2], [2, 12, 5.1, 7.2]] });
      B.box(-32, 3.6, -38, -18, 4, -20, 'wood', { tint: 0xa87850 });
      railing(B, -30, -20.25, -20, -19.8, 4, RED);
      B.roof(-32, -38, -18, -20, 7.6, 2.6, 'hip', 'roofJp', { tint: RF, over: 1.1, curl: 0.45 });
      B.box(-32.2, 7.1, -38.2, -17.8, 7.6, -19.8, 'woodDark', { tint: WD, col: false, skip: { bottom: true } });

      B.box(-46, 0, -30, -32, 5.2, -26, 'plaster', { tint: PL, band: { h: 1.2, mat: 'stone', tint: ST } });
      B.box(-18, 0, -30, -7, 5.2, -26, 'plaster', { tint: PL, band: { h: 1.2, mat: 'stone', tint: ST } });
      B.box(7, 0, -30, 30, 5.2, -26, 'plaster', { tint: PL, band: { h: 1.2, mat: 'stone', tint: ST } });
      B.box(34, 0, -30, 46, 5.2, -26, 'plaster', { tint: PL, band: { h: 1.2, mat: 'stone', tint: ST } });
      B.roof(-46, -30.4, -32, -25.6, 5.2, 0.9, 'gable-x', 'roofJp', { tint: RF, over: 0.4 });
      B.roof(34, -30.4, 46, -25.6, 5.2, 0.9, 'gable-x', 'roofJp', { tint: RF, over: 0.4 });
      B.box(-7, 0, -31, -5, 8.2, -25, 'wood', { tint: RED });
      B.box(5, 0, -31, 7, 8.2, -25, 'wood', { tint: RED });
      B.box(-7.5, 7, -31.5, 7.5, 8.4, -24.5, 'woodDark', { tint: WD });
      B.roof(-9, -32.5, 9, -23.5, 8.4, 3.2, 'hip', 'roofJp', { tint: RF, over: 1.4, curl: 0.6 });
      B.sign(0, 6.1, -31.05, 's', 5, 1.4, '花村', { bg: '#2a1a12', fg: '#f0c860', font: 'bold 80px "MS Gothic", serif' });
      B.box(30, 0, -31, 30.6, 4.4, -25, 'wood', { tint: RED });
      B.box(33.4, 0, -31, 34, 4.4, -25, 'wood', { tint: RED });
      B.box(29.6, 4.4, -31.4, 34.4, 5, -24.6, 'woodDark', { tint: WD });

      B.box(-18, 0, -26, -7, 4, -23, 'stone', { tint: ST });
      railing(B, -18, -23.4, -7, -23, 4, WD);
      B.box(7, 0, -26, 30, 4, -23, 'stone', { tint: ST });
      railing(B, 7, -23.4, 24, -23, 4, WD);
      B.stairs(24, -23, 30, -13, 0, 4, 'z-', 'stone', { tint: ST });

      B.box(2, 0, -4, 14, 0.4, 8, 'stone', { tint: 0xc8c0b0, top: 'paving', topTint: 0xe0d6c2 });
      B.point('A', 8, 2, 5.2);
      jp(B, -26, 0, -14, 10, 4.5, { roof: 'hip', roofH: 2.6 });
      B.box(-12, 0, -15, -4, 1.1, -14.4, 'stone', { tint: ST });
      B.box(14, 0, -12, 22, 1.1, -11.4, 'stone', { tint: ST });
      B.box(-2, 0, -8, 0.6, 1.1, -7.4, 'stone', { tint: ST });
      B.prop('tree_sakura', -2, 10, { s: 1.5 });
      B.prop('tree_sakura', 22, 8, { s: 1.1 });
      B.prop('tree_sakura', -12, -6, { s: 1.0 });
      B.prop('tree_sakura', 34, -8, { s: 1.1 });
      for (const [lx, lz] of [[-6, -2], [18, -2], [2, 14], [16, 14], [-8, 18], [28, 16]]) B.prop('lantern_stone', lx, lz);
      B.prop('crates', 26, -4, { yaw: 0 });
      B.prop('crate', 30, 2);
      B.prop('bench', -10, 14, { yaw: 0 });
      B.prop('planter', 38, 10);
      B.prop('planter', 38, -16);

      jp(B, -46, -20, -38, 20, 7, { sides: 'e', roof: 'gable-z' });
      jp(B, 38, -26, 46, 20, 7, { sides: 'w', roof: 'gable-z' });

      B.box(-28, 0, 20, -20, 6, 24, 'plaster', { tint: PL, band: { h: 1.2, mat: 'stone', tint: ST } });
      B.box(-6, 0, 20, 6, 6, 24, 'plaster', { tint: PL, band: { h: 1.2, mat: 'stone', tint: ST } });
      B.box(14, 0, 20, 26, 6, 24, 'plaster', { tint: PL, band: { h: 1.2, mat: 'stone', tint: ST } });
      B.box(34, 0, 20, 46, 6, 24, 'plaster', { tint: PL, band: { h: 1.2, mat: 'stone', tint: ST } });
      for (const [a, b] of [[-28, -20], [-6, 6], [14, 26], [34, 46]]) B.roof(a, 19.6, b, 24.4, 6, 1, 'gable-x', 'roofJp', { tint: RF, over: 0.4 });
      B.box(5.4, 0, 19.5, 6.8, 7.2, 20.9, 'wood', { tint: RED });
      B.box(13.2, 0, 19.5, 14.6, 7.2, 20.9, 'wood', { tint: RED });
      B.box(4.2, 6.4, 19.3, 15.8, 7.0, 21.1, 'wood', { tint: RED, col: false });
      B.box(3.4, 7.3, 19.1, 16.6, 7.8, 21.3, 'woodDark', { tint: 0x2a2a2a, col: false });
      B.box(26, 0, 20, 26.6, 3.8, 24, 'wood', { tint: RED });
      B.box(33.4, 0, 20, 34, 3.8, 24, 'wood', { tint: RED });

      B.wall(-20, 20, -6, 20, 7.2, 0.5, 'plaster', { tint: PL, holes: [[5, 9, 0, 3.2]] });
      B.wall(-20, 46, -6, 46, 7.2, 0.5, 'plaster', { tint: PL, holes: [[5, 9, 0, 3.2]] });
      B.wall(-20, 20, -20, 46, 7.2, 0.5, 'plaster', { tint: PL, holes: [[10, 14, 0, 3.2]] });
      B.wall(-6, 20, -6, 46, 7.2, 0.5, 'plaster', { tint: PL, holes: [[16, 19, 0, 3.2]] });
      B.floor(-20, 20, -6, 46, 0.05, 'wood', { tint: 0xb08858, t: 0.05 });
      B.box(-20.2, 7.2, 19.8, -5.8, 7.6, 46.2, 'woodDark', { tint: WD });
      B.roof(-20, 20, -6, 46, 7.6, 3, 'gable-z', 'roofJp', { tint: RF, over: 1.2, curl: 0.3 });
      B.box(-16, 0, 27, -10, 1.0, 29, 'wood', { tint: 0x8a5a3a });
      B.box(-16, 0, 37, -10, 1.0, 39, 'wood', { tint: 0x8a5a3a });
      B.windows(-20, 20, -6, 46, 0, 7.2, { tex: 'shoji', sp: 3, w: 1.6, h: 1.3, fl: 3.6, sill: 3.8, sides: 'ew', lit: 0 });

      B.box(-6, 0, 46, 4, 7, 48, 'plaster', { tint: PL, band: { h: 1.2, mat: 'stone', tint: ST } });
      B.box(16, 0, 46, 26, 7, 48, 'plaster', { tint: PL, band: { h: 1.2, mat: 'stone', tint: ST } });
      B.box(3.4, 0, 45.5, 5, 9.5, 48.5, 'wood', { tint: RED });
      B.box(15, 0, 45.5, 16.6, 9.5, 48.5, 'wood', { tint: RED });
      B.box(2.4, 8.4, 45.2, 17.6, 9.6, 48.8, 'woodDark', { tint: WD });
      B.roof(1, 44.5, 19, 49.5, 9.6, 2.6, 'hip', 'roofJp', { tint: RF, over: 1.2, curl: 0.55 });
      B.sign(10, 7.4, 45.45, 's', 4, 1.2, '天守', { bg: '#2a1a12', fg: '#f0c860', font: 'bold 80px "MS Gothic", serif' });
      B.box(26, 0, 46, 26.6, 4, 50, 'wood', { tint: RED });
      B.box(33.4, 0, 46, 34, 4, 50, 'wood', { tint: RED });
      B.box(34, 0, 24, 46, 7, 50, 'plaster', { tint: PL, band: { h: 1.2, mat: 'stone', tint: ST } });
      B.roof(34, 24, 46, 50, 7, 2, 'gable-z', 'roofJp', { tint: RF, over: 0.6 });

      B.box(-2, 0, 30, 1, 0.9, 38, 'stone', { tint: ST });
      B.box(18, 0, 34, 24, 0.9, 36, 'stone', { tint: ST });
      B.water(27, 30, 33, 42, 0.02, 0x4a90a8);
      B.prop('tree_sakura', 10, 38, { s: 1.2 });
      B.prop('tree_sakura', 30, 44, { s: 0.9 });
      B.prop('lantern_stone', 4, 28);
      B.prop('lantern_stone', 16, 28);
      B.prop('lantern_stone', -2, 42);
      B.prop('lantern_stone', 22, 42);

      jp(B, -46, 34, -32, 96, 9, { sides: 'e', roof: 'gable-z' });
      B.box(-32, 0, 34, -28, 4, 46, 'stone', { tint: ST });
      B.stairs(-26, 47, -20, 56, 0, 3.5, 'z+', 'stone', { tint: ST });
      B.box(-32, 0, 56, -20, 3.5, 82, 'stone', { tint: 0xa8a090, top: 'wood', topTint: 0xa87850 });
      B.box(-32, 0, 47, -26, 3.5, 56, 'stone', { tint: 0xa8a090 });
      railing(B, -20.4, 56, -20, 74, 3.5);
      B.stairs(-20, 74, -16, 82, 0, 3.5, 'x-', 'stone', { tint: ST });
      for (const pz of [58, 66, 74, 81]) B.box(-31.6, 3.5, pz - 0.3, -31, 8, pz + 0.3, 'wood', { tint: RED });
      B.roof(-33, 56, -26, 83, 8, 1.6, 'shed-e', 'roofJp', { tint: RF, over: 0.4 });

      B.box(20, 0, 58, 34, 2.4, 82, 'stone', { tint: 0xa8a090, top: 'wood', topTint: 0xa87850 });
      B.stairs(20, 50, 25, 58, 0, 2.4, 'z+', 'stone', { tint: ST });
      B.stairs(15, 70, 20, 78, 0, 2.4, 'x+', 'stone', { tint: ST });
      railing(B, 19.6, 58, 20, 70, 2.4);
      B.box(34, 0, 50, 46, 7, 82, 'plaster', { tint: PL });
      B.roof(34, 50, 46, 82, 7, 2, 'gable-z', 'roofJp', { tint: RF, over: 0.6 });
      B.box(34, 0, 82, 46, 9, 96, 'plaster', { tint: PL });

      B.box(-5, 0, 63, 5, 0.3, 73, 'stone', { tint: 0xc8c0b0, top: 'wood', topTint: 0xc09060 });
      B.point('B', 0, 68, 6);
      for (const [px, pz] of [[-8, 60], [8, 60], [-8, 76], [8, 76]]) B.cyl(px, pz, 0, 6.2, 0.45, 'wood', { tint: RED, seg: 8 });
      B.box(-9, 6.2, 59, 9, 6.7, 77, 'woodDark', { tint: WD, col: false });
      B.roof(-10, 58, 10, 78, 6.7, 3, 'pagoda', 'roofJp', { tint: RF, over: 1.2, curl: 0.6 });
      B.prop('lantern_stone', -12, 56);
      B.prop('lantern_stone', 12, 56);
      B.prop('crates', 12, 82, { yaw: Math.PI / 2 });
      B.prop('crate', -14, 64);

      jp(B, -28, 84, 18, 96, 12, { sides: 's', roof: 'pagoda', roofH: 5, lit: 10 });
      B.box(18, 0, 82, 20, 9, 96, 'plaster', { tint: PL });
      B.box(-32, 0, 82, -28, 7, 96, 'plaster', { tint: PL });

      B.prop('pagoda_tower', 0, 150, { col: false, s: 2.2 });
      B.prop('pagoda_tower', -70, 110, { col: false, s: 1.4 });
      B.prop('tree_sakura', -60, 60, { col: false, s: 2.2 });
      B.prop('tree_sakura', 62, 20, { col: false, s: 2.0 });

      B.healthPack(-14, -40, false);
      B.healthPack(-28, -28, true);
      B.healthPack(32, -44, false);
      B.healthPack(22, -6, false);
      B.healthPack(-20, 14, true);
      B.healthPack(30, 12, false);
      B.healthPack(-24, 40, false);
      B.healthPack(-13, 33, true);
      B.healthPack(30, 36, false);
      B.healthPack(-26, 70, true, 3.5);
      B.healthPack(28, 70, false, 2.4);
      B.healthPack(0, 52, false);

      B.hint('hold', 0, 6, -9);
      B.hint('hold', 0, -8, -12);
      B.hint('hold', 0, 18, -2);
      B.hint('perch', 0, 14, -24.5, { y: 4 });
      B.hint('perch', 0, -24, -21, { y: 4 });
      B.hint('stage', 0, 0, -44);
      B.hint('stage', 0, -14, -40);
      B.hint('hold', 1, 0, 58);
      B.hint('hold', 1, -10, 66);
      B.hint('hold', 1, 12, 64);
      B.hint('perch', 1, -26, 66, { y: 3.5 });
      B.hint('perch', 1, 27, 66, { y: 2.4 });
      B.hint('stage', 1, 10, 30);
      B.hint('stage', 1, -24, 36);

      B.cam('shot', -6, 9, -52, 10, 2, 6);
      B.cam('menu', 22, 4, -8, -2, 5, 10);
    }
  };

  const BR = 0x9a4a3a, BRD = 0x6a3a34, CON = 0xa8a8b4, MET = 0x8a90a0, SNOW = 0xe4e6f2;

  function brickHouse(B, x0, z0, x1, z1, h, o = {}) {
    B.house(x0, z0, x1, z1, h, 'brick', {
      y: o.y, tint: o.tint || BR, band: { h: 0.8, mat: 'concrete', tint: 0x8a8a94 }, topTint: 0xe8eaf4, top: 'snow',
      roof: o.roof, roofMat: 'metal', roofTint: 0x6a6e80, roofH: o.roofH || 2, over: 0.3,
      win: o.win === false ? null : { tex: 'window', sp: 3.4, w: 1.4, h: 2, fl: 4, sill: 1.4, sides: o.sides || 'nsew', lit: o.lit === undefined ? 45 : o.lit }
    });
  }

  O.MAPS.volskaya = {
    id: 'volskaya', name: 'VOLSKAYA INDUSTRIES', mode: 'assault',
    theme: {
      skyTop: 0x4a3c7c, skyHorizon: 0xd8a8c8, skyLow: 0xb8a8d0, fog: 0xb4a4d0, fogNear: 50, fogFar: 200,
      sun: [0.62, 0.32, 0.55], sunCol: 0xffc0a0, amb: 0x9894c8, ground: 0xd0d0e0,
      skyline: 'domes', skylineTint: 0x5c4c88, time: 'dusk', snow: true
    },
    build(B) {
      B.bounds(-50, -96, 50, 96);
      B.floor(-50, -96, 50, 40, 0, 'snow', { tint: SNOW, uv: 0.6 });
      B.floor(-20, 40, 40, 92, 0.02, 'concrete', { tint: 0xb0b0b8, t: 0.02 });

      B.spawnRoom({ role: 'att', stage: [0, 0], x: 0, z: -86, w: 18, d: 10, yaw: 0, exits: [{ side: 'n', a: 5, b: 13 }], mat: 'metal', tint: 0xc8ccd8 });
      B.box(-10, 0, -96, 10, 8, -91.3, 'brick', { tint: BRD });
      brickHouse(B, -50, -96, -38, -40, 12, { sides: 'e' });
      brickHouse(B, 38, -96, 50, -40, 12, { sides: 'w' });
      brickHouse(B, -38, -96, -10, -88, 9, { sides: 'n' });
      brickHouse(B, 10, -96, 38, -88, 9, { sides: 'n' });
      B.prop('container', -24, -66, { c: 0xa83a2a });
      B.prop('container', -18, -52, { c: 0x2a6aa8, yaw: Math.PI / 2 });
      B.prop('container', 20, -70, { c: 0x3a7a4a });
      B.prop('truck', 22, -54, { yaw: 0.2, c: 0x5a6a7a });
      B.prop('truck', -6, -64, { yaw: Math.PI / 2, c: 0x8a3a2a });
      B.prop('crates', 8, -48);
      B.prop('crate', 12, -46);
      B.prop('barrels', -30, -46);
      B.prop('barrels', 30, -78);
      B.box(-11, 0, -48, -7, 3, -44, 'metal', { tint: 0xc8b070 });
      B.roof(-11.5, -48.5, -6.5, -43.5, 3, 0.8, 'gable-x', 'metal', { tint: 0x6a6e80, over: 0.2 });
      for (const [lx, lz] of [[-34, -76], [34, -76], [-34, -50], [34, -50]]) { B.prop('lamp', lx, lz, { glow: 0xffd890 }); B.light(lx, 4.2, lz, 0xffc070, 14); }
      for (const [tx, tz] of [[-35, -86], [35, -86], [-35, -62], [35, -62]]) B.prop('tree_pine', tx, tz, { snow: true, s: 1.1 });

      B.wall(-38, -38, 38, -38, 8, 4, 'brick', { tint: BR, holes: [[31, 45, 0, 6], [6, 10, 0, 3.4], [66, 72, 0, 3.8]], band: { h: 1, mat: 'concrete', tint: 0x8a8a94 }, topTint: SNOW, top: 'snow' });
      B.box(-8, 6, -40.4, 8, 8, -35.6, 'metal', { tint: 0x5a5e6a, col: false });
      B.sign(0, 7, -40.45, 's', 13, 1.6, 'ВОЛЬСКАЯ ИНДАСТРИЗ', { bg: '#2a1a1a', fg: '#ffcf60', font: 'bold 44px Impact, sans-serif' });
      B.box(-9, 0, -41, -7, 9, -35, 'concrete', { tint: 0x8a8a94 });
      B.box(7, 0, -41, 9, 9, -35, 'concrete', { tint: 0x8a8a94 });

      B.wall(-36, -36, -36, -8, 10, 0.5, 'brick', { tint: BR });
      B.wall(-36, -36, -20, -36, 10, 0.5, 'brick', { tint: BR, holes: [[4, 8, 0, 3.4]] });
      B.wall(-20, -36, -20, -8, 10, 0.5, 'brick', { tint: BR, holes: [[20, 24, 0, 3.2], [4, 24, 5.4, 8]] });
      B.wall(-36, -8, -20, -8, 10, 0.5, 'brick', { tint: BR, holes: [[6, 10, 0, 3.2]] });
      B.slab(-36, -36, -26, -8, 5, 0.4, 'wood', { tint: 0x9a7a5a });
      B.slab(-26, -36, -20, -30, 5, 0.4, 'wood', { tint: 0x9a7a5a });
      B.slab(-26, -20, -20, -8, 5, 0.4, 'wood', { tint: 0x9a7a5a });
      B.stairs(-24, -30, -21, -20, 0, 5, 'z+', 'metal', { tint: MET });
      B.rail(-20.3, -32, -20.3, -12, 5, 'metal', { tint: 0x5a5e6a });
      B.box(-36.3, 10, -36.3, -19.7, 10.6, -7.7, 'metal', { tint: 0x5a5e6a, top: 'snow', topTint: SNOW });
      B.windows(-36, -36, -20, -8, 0, 10, { tex: 'window', sp: 3.4, w: 1.4, h: 2, fl: 5, sill: 1.6, sides: 'nw', lit: 60 });
      B.healthPack(-28, -24, true);
      B.prop('crates', -32, -14);
      B.light(-28, 4, -22, 0xffc070, 12);
      B.light(-28, 9, -22, 0xffc070, 12);

      B.box(-6, 0, -6, 6, 0.4, 6, 'concrete', { tint: CON, top: 'grate', topTint: 0xb8bcc8 });
      B.point('A', 0, 0, 5.5);
      B.box(-11, 0, -15, -9, 2.2, -13, 'metal', { tint: 0x6a7a6a });
      B.box(6, 0, -16.4, 10, 1.1, -15.6, 'concrete', { tint: CON });
      B.box(-6, 0, -24.4, -2, 1.1, -23.6, 'concrete', { tint: CON });
      B.box(12, 0, 3, 13, 1.1, 8, 'concrete', { tint: CON });
      B.prop('crate', 8, 7);
      B.prop('crate', -9, 5);
      B.prop('crates', -14, -2, { yaw: Math.PI / 2 });
      B.prop('generator', 14, -8);
      B.healthPack(-12, 6, false);

      B.box(24, 0, -30, 34, 1.4, 4, 'concrete', { tint: CON, top: 'metal', topTint: 0xa8acb8 });
      B.ramp(24, -34, 34, -30, 0, 1.4, 'z+', 'metal', { tint: MET });
      B.stairs(21, -12, 24, -4, 0, 1.4, 'x+', 'metal', { tint: MET });
      B.prop('container', 29, -18, { c: 0xc89020, y: 1.4 });
      B.prop('container', 30, -1, { c: 0x6a3a8a, yaw: Math.PI / 2, y: 1.4 });
      B.healthPack(26, -8, false, 1.4);
      brickHouse(B, 34, -36, 50, 10, 11, { sides: 'w', lit: 20 });
      B.prop('chimney', 44, -20, { h: 26, col: false });

      B.box(-24, 0, 12, -4, 4, 21, 'concrete', { tint: CON, top: 'metal', topTint: 0xa8acb8 });
      B.box(4, 0, 12, 24, 4, 21, 'concrete', { tint: CON, top: 'metal', topTint: 0xa8acb8 });
      B.box(-4, 3.4, 12, 4, 4, 21, 'metal', { tint: MET });
      B.rail(-24, 12.1, -4, 12.1, 4, 'metal', { tint: 0x5a5e6a });
      B.rail(4, 12.1, 24, 12.1, 4, 'metal', { tint: 0x5a5e6a });
      B.stairs(-30, 12, -24, 21, 0, 4, 'x+', 'metal', { tint: MET });
      B.stairs(24, 12, 30, 21, 0, 4, 'x-', 'metal', { tint: MET });
      B.sign(-14, 7.6, 20.9, 's', 8, 1.4, 'ЗАВОД № 7', { bg: '#7a1a1a', fg: '#fff0c0' });
      B.healthPack(-16, 16, false, 4);

      B.box(-22, 0, 21, -6, 3, 35, 'concrete', { tint: CON });
      B.spawnRoom({ owners: [{ role: 'def', stage: [0, 0] }, { role: 'att', stage: [1, 1] }], x: -14, z: 28, w: 16, d: 14, y: 4, yaw: Math.PI, exits: [{ side: 's', a: 3, b: 9 }, { side: 'e', a: 3, b: 8 }], mat: 'metal', tint: 0xc8ccd8 });
      B.box(-6, 0, 35, -4, 6, 40, 'brick', { tint: BR });
      B.box(4, 0, 21, 6, 6, 40, 'brick', { tint: BR });
      B.healthPack(0, 30, false);
      brickHouse(B, 6, 22, 26, 38, 8, { sides: 'se', lit: 50 });

      B.stairs(-32, 24, -26, 36, 0, 5, 'z+', 'metal', { tint: MET });
      B.box(-32, 0, 36, -20, 5, 46, 'concrete', { tint: CON, top: 'metal', topTint: 0xa8acb8 });
      B.rail(-32, 46.1, -20, 46.1, 5, 'metal', { tint: 0x5a5e6a });
      B.healthPack(-26, 42, false, 5);
      brickHouse(B, -50, -40, -40, 96, 12, { sides: 'e', lit: 30 });
      B.box(-40, 0, -8, -36, 10, 12, 'brick', { tint: BR });
      B.prop('tree_pine', -36, 18, { snow: true });
      B.prop('tree_pine', -38, 30, { snow: true, s: 1.2 });
      B.prop('barrels', -36, 60);
      B.prop('crates', -30, 80);
      brickHouse(B, 46, -36, 50, 96, 12, { sides: 'w', win: false });
      B.prop('container', 38, 22, { c: 0x2a6aa8 });
      B.prop('truck', 32, 30, { yaw: 0.1, c: 0x6a7a8a });
      B.healthPack(40, 34, true);
      for (const [lx, lz] of [[28, 14], [44, 36], [-38, 22], [-24, 8]]) { B.prop('lamp', lx, lz, { glow: 0xffd890 }); B.light(lx, 4.2, lz, 0xffc070, 12); }

      B.wall(-20, 40, 40, 40, 14, 0.6, 'metal', { tint: 0x7a7e8e, holes: [[16, 24, 0, 4.5], [50, 58, 0, 5]] });
      B.wall(-20, 40, -20, 92, 14, 0.6, 'metal', { tint: 0x7a7e8e, holes: [[1, 5, 5, 8.3], [16, 20, 0, 3.4]] });
      B.wall(40, 40, 40, 92, 14, 0.6, 'metal', { tint: 0x7a7e8e });
      B.wall(-20, 92, 40, 92, 14, 0.6, 'metal', { tint: 0x7a7e8e });
      B.box(-20.5, 14, 39.5, 40.5, 14.6, 92.5, 'metal', { tint: 0x5a5e6a });
      B.sign(10, 11, 39.6, 's', 20, 2.4, 'СБОРОЧНЫЙ ЦЕХ «СВЯТОГОР»', { bg: '#1a2238', fg: '#e8e0ff' });
      for (const z of [52, 68, 84]) B.decal(40, 9, z, 'w', 8, 3, 'window', { emit: 1, off: 0.35 });
      B.slab(-20, 40, -14, 80, 5, 0.4, 'grate', { tint: 0xa0a4b0 });
      B.rail(-14, 46, -14, 72, 5, 'metal', { tint: 0xd8a020 });
      B.stairs(-14, 72, -9, 80, 0, 5, 'x-', 'metal', { tint: MET });
      B.slab(34, 40, 40, 88, 5, 0.4, 'grate', { tint: 0xa0a4b0 });
      B.rail(34, 44, 34, 72, 5, 'metal', { tint: 0xd8a020 });
      B.stairs(29, 72, 34, 80, 0, 5, 'x+', 'metal', { tint: MET });
      B.healthPack(-17, 60, true, 5);
      B.healthPack(37, 56, false, 5);

      B.box(2, 0, 58, 18, 1.6, 74, 'metal', { tint: 0x8a8ea0, top: 'grate', topTint: 0xc8ccd8, band: { h: 0.4, mat: 'hazard', tint: 0xffffff } });
      B.stairs(6, 54, 14, 58, 0, 1.6, 'z+', 'metal', { tint: MET });
      B.stairs(-2, 62, 2, 70, 0, 1.6, 'x+', 'metal', { tint: MET });
      B.stairs(18, 62, 22, 70, 0, 1.6, 'x-', 'metal', { tint: MET });
      B.point('B', 10, 66, 6, { y: 1.6 });
      B.prop('mech', 10, 84, { yaw: Math.PI, col: false, c: 0x6e7282, a: 0xc03a2a });
      B.box(6.6, 0, 82.5, 9, 6, 85.5, 'metal', { vis: false });
      B.box(11, 0, 82.5, 13.4, 6, 85.5, 'metal', { vis: false });
      B.box(4.6, 0, 80, 15.4, 0.3, 88, 'hazard', { tint: 0xffffff });
      B.prop('crates', -6, 52);
      B.prop('crates', 24, 50, { yaw: Math.PI / 2 });
      B.prop('crate', -8, 74);
      B.prop('generator', 26, 62);
      B.prop('forklift', 22, 84, { yaw: 1.2 });
      B.prop('barrels', 30, 48);
      B.healthPack(26, 48, false);
      B.healthPack(22, 72, false);
      for (const [lx, lz] of [[0, 50], [20, 50], [0, 72], [20, 72], [10, 88], [-16, 64], [36, 64]]) B.light(lx, 11, lz, 0xffd8a0, 20, { k: 1.1 });

      B.spawnRoom({ role: 'def', stage: [1, 1], x: -13, z: 86, w: 14, d: 12, yaw: Math.PI / 2, exits: [{ side: 'e', a: 2, b: 7 }, { side: 's', a: 2, b: 6 }], mat: 'metal', tint: 0xc8ccd8 });

      B.prop('mech', -120, 60, { yaw: 1.2, col: false, big: 1.6, c: 0x5a5e72, y: 0 });
      B.prop('mech', 110, -30, { yaw: -1.6, col: false, big: 1.4, c: 0x5a5e72, y: 0 });
      B.prop('airship', 40, 150, { y: 70, col: false, c: 0xb8bcd0 });
      for (const [tx, tz, c] of [[-40, 170, 0xb8483a], [0, 190, 0xc8b060], [45, 175, 0xb8483a], [-90, 150, 0x8a8ab0]]) B.prop('onion_tower', tx, tz, { col: false, c, dome: tx === 0 ? 0xe8c040 : 0x3a8a5a, y: 0 });
      B.prop('chimney', -70, -40, { h: 34, col: false, y: 0 });

      B.hint('hold', 0, 0, -10);
      B.hint('hold', 0, -10, -18);
      B.hint('hold', 0, 12, -6);
      B.hint('perch', 0, -28, -22, { y: 5 });
      B.hint('perch', 0, 0, 16, { y: 4 });
      B.hint('perch', 0, 14, 16, { y: 4 });
      B.hint('stage', 0, 0, -50);
      B.hint('stage', 0, -18, -58);
      B.hint('hold', 1, 10, 52);
      B.hint('hold', 1, -4, 64);
      B.hint('hold', 1, 24, 64);
      B.hint('perch', 1, -17, 58, { y: 5 });
      B.hint('perch', 1, 37, 60, { y: 5 });
      B.hint('stage', 1, 0, 28);
      B.hint('stage', 1, 36, 26);

      B.cam('shot', 0, 10, -60, 0, 4, 10);
      B.cam('menu', 18, 3, 50, 10, 7, 84);
    }
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
