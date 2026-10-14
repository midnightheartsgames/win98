(function (O) {
  'use strict';
  const HW = { st: [0xf2d8c0, 0xe8c4d0, 0xd4e0c4, 0xf0dca0, 0xc4d8e4, 0xeec4a4, 0xe0d0f0], trim: 0x7a4a30, pave: 0xdcccb4, road: 0x6c6c74, wood: 0x9a6a4a };

  function hwHouse(B, x0, z0, x1, z1, h, i, o = {}) {
    B.house(x0, z0, x1, z1, h, 'plaster', {
      tint: HW.st[i % HW.st.length], band: { h: 0.45, mat: 'wood', tint: HW.trim }, top: 'concrete', topTint: 0xc8bca8,
      roof: o.roof, roofMat: 'roofTerra', roofTint: 0xd08a60, roofH: o.roofH || 1.8, over: 0.5,
      win: o.win === false ? null : { tex: 'window', sp: 3.2, w: 1.3, h: 1.7, fl: 3.6, sill: 1.1, sides: o.sides || 'nsew', lit: 0 }
    });
  }

  function hwFacade(B, x0, x1, h, tint, name) {
    B.box(x0, 0, 72, x1, h, 82, 'wood', { tint, band: { h: 0.35, mat: 'woodDark', tint: 0x5a3a24 } });
    B.sign((x0 + x1) / 2, h - 1.2, 71.95, 's', Math.min(8, x1 - x0 - 1), 1.1, name, { bg: '#3a2414', fg: '#f4d890', font: 'bold 44px Georgia, serif' });
    B.decal((x0 + x1) / 2, 1.5, 71.97, 's', 2, 2.8, 'door');
    for (const x of [x0 + 2, x1 - 2]) B.decal(x, 1.9, 71.97, 's', 1.4, 1.6, 'window');
  }

  O.MAPS.hollywood = {
    id: 'hollywood', name: 'HOLLYWOOD', mode: 'hybrid', payloadStyle: 'hollywood',
    theme: {
      skyTop: 0x5a98e0, skyHorizon: 0xf6dcc0, skyLow: 0xc8b098, fog: 0xf0dcc8, fogNear: 70, fogFar: 240,
      sun: [0.5, 0.64, 0.42], sunCol: 0xfff0d4, amb: 0x9c98b0, ground: 0xa89078,
      skyline: 'hills', skylineTint: 0xa89478, time: 'day'
    },
    build(B) {
      B.bounds(-46, -100, 46, 100);
      B.floor(-10, -100, 10, -45, 0, 'asphalt', { tint: HW.road });
      B.floor(-34, -100, -10, -45, 0, 'paving', { tint: HW.pave });
      B.floor(10, -100, 44, -45, 0, 'paving', { tint: HW.pave });
      B.floor(-34, -45, 44, 4, 0, 'paving', { tint: 0xe4d4bc });
      B.floor(-34, 4, 44, 62, 0, 'paving', { tint: 0xd8c8b0 });
      B.floor(-34, 62, 44, 100, 0, 'dirt', { tint: 0xd0b088 });

      B.spawnRoom({ role: 'att', stage: [0, 0], x: 0, z: -92, w: 16, d: 10, yaw: 0, exits: [{ side: 'n', a: 4, b: 12 }], mat: 'plaster', tint: 0xf0d4dc });
      hwHouse(B, -34, -100, -8, -84, 11, 1, { sides: 'n' });
      hwHouse(B, 8, -100, 44, -84, 11, 1, { sides: 'n' });
      B.box(-8, 0, -100, 8, 11, -97, 'plaster', { tint: HW.st[1] });
      B.box(-8, 5.6, -97, 8, 11, -87, 'plaster', { tint: HW.st[1] });
      B.sign(0, 8.2, -86.95, 'n', 12, 2, 'HOTEL ROSA', { bg: '#f8e8f0', fg: '#c83a6a', font: 'bold 44px Georgia, serif' });
      for (const [x, z] of [[-14, -80], [14, -80], [-14, -58], [14, -58]]) B.prop('tree_palm', x, z);
      for (const [x, z] of [[-11, -70], [11, -50]]) B.prop('lamp2', x, z, { glow: 0xffe0a0 });
      hwHouse(B, -34, -84, -22, -64, 7, 2, { win: false });
      B.sign(-21.95, 5.4, -74, 'e', 9, 1.2, 'MOVIE MAGIC · SOUVENIRS', { bg: '#2a1a4a', fg: '#f4c860' });
      for (const z of [-80, -76, -68]) B.decal(-21.95, 2.2, z, 'e', 2.4, 3.2, 'poster');
      hwHouse(B, -34, -64, -28, -45, 4, 3, { sides: 'e' });
      B.prop('car', -5, -68, { c: 0xd84a4a, yaw: 0.1 });
      B.prop('car', 5.5, -56, { c: 0x4a8ad8, yaw: Math.PI + 0.12 });
      B.prop('bench', -13, -72, { yaw: Math.PI / 2 });
      B.prop('hydrant', 11, -76);
      hwHouse(B, 22, -84, 44, -66, 6, 3, { sides: 'w' });
      B.sign(21.95, 4.6, -75, 'w', 10, 1.4, "ROSIE'S DINER", { bg: '#e8f4f8', fg: '#d83a4a', font: 'bold 44px "Arial Black", sans-serif' });
      B.healthPack(16, -70, false);

      B.wall(22, -62, 44, -62, 6, 0.5, 'brick', { tint: 0xc08a6a, holes: [[2, 8, 0, 3.8]] });
      B.wall(22, -40, 44, -40, 6, 0.5, 'brick', { tint: 0xc08a6a, holes: [[2, 8, 0, 3.8]] });
      B.wall(22, -62, 22, -40, 6, 0.5, 'brick', { tint: 0xc08a6a, holes: [[8, 14, 1.2, 2.8]] });
      B.wall(44, -62, 44, -40, 6, 0.5, 'brick', { tint: 0xc08a6a });
      B.box(21.7, 6, -62.3, 44.3, 6.5, -39.7, 'metal', { tint: 0x8a8a90 });
      B.sign(34, 4.9, -62.3, 's', 12, 1.2, 'GARAGE · LIMOUSINES', { bg: '#1a1a1a', fg: '#e8e8e8' });
      B.prop('car', 36, -51, { c: 0x1a1a1e, y: 0 });
      B.prop('crates', 39, -58, { y: 0 });
      B.prop('barrels', 25, -44, { y: 0 });
      B.light(33, 5, -51, 0xffe0b0, 14);

      B.wall(-34, -45, -12, -45, 5, 0.8, 'plaster', { tint: 0xf0e4d0, holes: [[12, 16, 0, 3.6]] });
      B.wall(12, -45, 22, -45, 5, 0.8, 'plaster', { tint: 0xf0e4d0 });
      B.box(-12, 0, -46.2, -8, 9.5, -43.8, 'plaster', { tint: 0xf4e8d0 });
      B.box(8, 0, -46.2, 12, 9.5, -43.8, 'plaster', { tint: 0xf4e8d0 });
      B.box(-12, 7.4, -45.6, 12, 9.2, -44.4, 'plaster', { tint: 0xf4e8d0 });
      B.sign(0, 8.3, -45.65, 's', 16, 1.5, 'GOLDSHIRE STUDIOS', { bg: '#1a1a2a', fg: '#f4d060' });
      B.sign(0, 8.3, -44.35, 'n', 16, 1.5, 'GOLDSHIRE STUDIOS', { bg: '#1a1a2a', fg: '#f4d060' });

      B.point('A', 0, -22, 6);
      hwHouse(B, -34, -38, -20, -24, 4.5, 4, { sides: 'es' });
      B.stairs(-26, -44, -20, -38, 0, 4.5, 'z+', 'wood', { tint: HW.wood });
      B.stairs(-34, -24, -28, -15, 0, 4.5, 'z-', 'wood', { tint: HW.wood });
      B.prop('table', -30, -32, { umbrella: true, uc: 0xe84a5a, y: 4.5 });
      B.prop('table', -24, -28, { umbrella: true, uc: 0x2a9ad8, y: 4.5 });
      B.sign(-19.95, 3.2, -31, 'e', 8, 1, 'CAFÉ LUMIÈRE', { bg: '#f8f0e0', fg: '#7a3a2a', font: 'bold 40px Georgia, serif' });
      hwHouse(B, 22, -32, 44, -8, 9, 5, { sides: 'wn' });
      B.slab(16, -30, 22, -12, 4.4, 0.4, 'wood', { tint: HW.wood });
      B.stairs(16, -38, 22, -30, 0, 4.4, 'z+', 'wood', { tint: HW.wood });
      B.rail(16, -12.1, 22, -12.1, 4.4, 'wood', { tint: HW.trim });
      for (const z of [-29.6, -21, -12.4]) B.cyl(16.4, z, 0, 4, 0.18, 'wood', { tint: HW.trim });
      B.sign(21.95, 7.2, -20, 'w', 11, 1.4, 'GOLDSHIRE PICTURES', { bg: '#1a1a2a', fg: '#f4d060' });
      B.prop('truck', 10, -31, { c: 0xf0f0f0 });
      B.prop('planter', -7, -13); B.prop('planter', 7, -13);
      B.prop('crates', -9, -33);
      B.prop('spotlight', -4, -35, { yaw: 0.5 });
      B.prop('spotlight', 5, -9, { yaw: Math.PI + 0.4 });
      B.prop('crane', 13, -15, { yaw: -2.3 });
      B.healthPack(-14, -42, false);
      B.healthPack(26, -37, false);
      B.healthPack(-30, -12, true);
      B.healthPack(15, -2, false);

      B.spawnRoom({ owners: [{ role: 'def', stage: [0, 0] }, { role: 'att', stage: [1, 1] }], x: -27, z: 0, w: 14, d: 14, yaw: Math.PI / 2, exits: [{ side: 'e', a: 4, b: 10 }], mat: 'plaster', tint: 0xf0e0c8 });
      B.spawnRoom({ role: 'def', stage: [1, 1], x: 37, z: -1, w: 14, d: 14, yaw: -Math.PI / 2, exits: [{ side: 'w', a: 3, b: 9 }], mat: 'plaster', tint: 0xf0e0c8 });

      hwHouse(B, -34, 7, -20, 30, 8, 0, { sides: 'e', roof: 'hip' });
      hwHouse(B, -20, 8, -8, 24, 7, 5, { sides: 'n' });
      B.sign(-7.95, 3.4, 13, 'e', 5, 0.9, 'GOLDSHIRE WAY', { bg: '#1a5a2a', fg: '#ffffff' });
      B.decal(-7.95, 2.2, 19, 'e', 2.4, 3.2, 'poster');
      hwHouse(B, 8, 4, 22, 22, 8, 6, { sides: 'n', roof: 'hip' });
      for (const z of [9, 15]) B.decal(7.95, 2.2, z, 'w', 2.4, 3.2, 'poster');
      B.prop('trailer', 26, 10, { c: 0xece4d4, c2: 0x3a6ab0 });
      B.prop('trailer', 37, 14, { c: 0xf4e8d8, c2: 0xc84a4a });
      B.prop('trailer', 28, 27, { c: 0xe8e8e8, c2: 0x3a9a5a });
      B.healthPack(33, 22, true);
      B.slab(-8, 30, -2, 46, 4.4, 0.4, 'wood', { tint: HW.wood });
      B.stairs(-8, 24, -2, 30, 0, 4.4, 'z+', 'wood', { tint: HW.wood });
      for (const [x, z] of [[-2.4, 30.5], [-2.4, 38], [-2.4, 45.5]]) B.cyl(x, z, 0, 4, 0.16, 'wood', { tint: HW.trim });
      B.box(-8.5, 4.4, 30, -8, 11, 46, 'wood', { tint: 0x8a6a4a });
      B.decal(-8.55, 7.6, 38, 'w', 14, 5.4, 'poster');
      hwHouse(B, -30, 34, -14, 50, 7, 6, { sides: 'es', roof: 'gable-z', roofH: 3 });
      B.box(-25, 7, 44, -21, 12, 48, 'plaster', { tint: 0xf4ece0 });
      B.roof(-25.3, 43.7, -20.7, 48.3, 12, 2.4, 'hip', 'roofTerra', { tint: 0xd08a60 });
      B.prop('fountain', 6, 44, { c: 0xf0e0c8 });
      B.prop('film_reel', 14, 30, { yaw: 0.6 });
      for (const [x, z] of [[-11, 28], [12, 50], [-12, 56], [28, 46]]) B.prop('tree_palm', x, z);
      B.healthPack(-12, 40, false);
      B.healthPack(16, 58, false);

      B.spawnRoom({ role: 'att', stage: [2, 2], x: 37, z: 45, w: 14, d: 14, yaw: -Math.PI / 2, exits: [{ side: 'w', a: 3, b: 9 }], mat: 'plaster', tint: 0xf0e0c8 });
      B.box(30, 5.6, 38, 44, 12, 52, 'metal', { tint: 0xd8d0c0 });
      B.box(30, 0, 52, 44, 12, 62, 'metal', { tint: 0xd8d0c0 });
      B.sign(29.95, 9, 50, 'w', 12, 2, 'SOUND STAGE 3', { bg: '#2a2a3a', fg: '#f0f0f0' });

      hwFacade(B, -12, -2, 6.5, 0xb88a5a, 'BANK');
      hwFacade(B, -2, 8, 7.5, 0xa8683a, 'SALOON');
      hwFacade(B, 8, 18, 6, 0xc8a070, 'SHERIFF');
      B.slab(-12, 69.5, 22, 72, 3.6, 0.4, 'wood', { tint: HW.wood });
      for (const x of [-11.6, -4, 3, 10, 17]) B.cyl(x, 69.8, 0, 3.2, 0.15, 'wood', { tint: HW.trim });
      B.stairs(18, 72, 22, 80, 0, 3.6, 'z-', 'wood', { tint: HW.wood });
      for (const [x, z] of [[26, 68], [-6, 90], [12, 88], [-28, 60]]) B.prop('cactus', x, z);
      B.prop('barrels', -10, 86);
      B.prop('crates', 4, 86);
      B.prop('saucer', 33, 80);
      B.box(36, 0, 62, 44, 9, 72, 'tech', { tint: 0x9aa4b8 });
      B.box(40, 0, 72, 44, 9, 96, 'tech', { tint: 0x8a94a8 });
      B.prop('bigrock', 26, 92, { c: 0xb8b0a8 });
      B.prop('spotlight', 24, 72, { yaw: 0.8, tilt: -0.1 });
      B.prop('spotlight', 38, 90, { yaw: -2.4, tilt: -0.1 });
      B.light(33, 3, 80, 0x6ae8ff, 12);
      B.healthPack(-6, 60, true);
      B.healthPack(26, 84, false);
      B.healthPack(0, 70.8, false, 3.6);

      B.spawnRoom({ role: 'def', stage: [2, 2], x: -28, z: 77, w: 12, d: 14, yaw: Math.PI / 2, exits: [{ side: 'e', a: 3, b: 9 }, { side: 'n', a: 3, b: 9 }], mat: 'plaster', tint: 0xf0e0c8 });
      B.box(-34, 0, 96, 6, 14, 100, 'metal', { tint: 0xd8d4c8, band: { h: 1.2, mat: 'concrete', tint: 0x9a968c } });
      B.decal(-18, 4, 95.95, 's', 10, 8, 'shutter');
      B.sign(-18, 10.5, 95.95, 's', 12, 2.2, 'STAGE 7', { bg: '#1a1a2a', fg: '#f4d060' });
      B.box(6, 0, 96, 44, 9, 100, 'plaster', { tint: 0xe8dcc8 });

      B.box(-46, 0, -100, -34, 12, -45, 'plaster', { tint: 0xe4d0bc });
      B.box(-46, 0, -45, -34, 10, 4, 'plaster', { tint: 0xd8c8b8 });
      B.box(-46, 0, 4, -34, 12, 62, 'plaster', { tint: 0xe0d4c4 });
      B.box(-46, 0, 62, -34, 9, 100, 'wood', { tint: 0xa88a6a });
      B.box(44, 0, -100, 46, 13, 100, 'plaster', { tint: 0xe4d4c0 });
      B.prop('water_tower', -40, 58, { col: false, y: 0 });
      B.sign(-40, 14.6, 54.7, 's', 5.4, 1.3, 'GOLDSHIRE', { bg: '#8a7a64', fg: '#fff4d0' });

      B.path([[0, -12], [0, 26], [22, 36], [22, 54], [4, 66], [-18, 66], [-18, 92]], [3, 6]);

      B.hint('hold', 0, 0, -28); B.hint('hold', 0, -10, -18); B.hint('hold', 0, 10, -20); B.hint('perch', 0, -27, -31, { y: 4.5 }); B.hint('perch', 0, 19, -22, { y: 4.4 });
      B.hint('stage', 0, 0, -54); B.hint('stage', 0, -16, -52); B.hint('stage', 0, 30, -66);
      B.hint('hold', 1, 0, 20); B.hint('hold', 1, -4, 34); B.hint('hold', 1, 14, 36); B.hint('perch', 1, -5, 40, { y: 4.4 }); B.hint('hold', 1, 10, 0);
      B.hint('hold', 2, 0, 62); B.hint('hold', 2, -10, 64); B.hint('hold', 2, 12, 62); B.hint('perch', 2, 2, 70.8, { y: 3.6 }); B.hint('hold', 2, -12, 80);

      B.cam('shot', 18, 7, -40, 0, 2, -20);
      B.cam('menu', -14, 3, -34, 4, 4, -14);
    }
  };

  const KR = { brick: [0x8a4a3a, 0x7a5a4a, 0x9a6a50, 0x6a4a44, 0xa07a60], trim: 0xd8d0c0, lamp: 0xffc070 };

  function krHouse(B, x0, z0, x1, z1, h, i, o = {}) {
    B.house(x0, z0, x1, z1, h, o.mat || 'brick', {
      y: o.y, tint: o.tint || KR.brick[i % KR.brick.length], band: { h: 0.5, mat: 'stone', tint: KR.trim }, top: 'roof', topTint: 0x4a4e58,
      roof: o.roof, roofMat: 'roof', roofTint: 0x4a4e5a, roofH: o.roofH || 3, over: 0.4,
      win: o.win === false ? null : { tex: 'window', sp: 3, w: 1.2, h: 1.9, fl: 3.6, sill: 1.1, sides: o.sides || 'nsew', lit: 45 }
    });
  }

  function krLamp(B, x, z) {
    B.prop('lamp2', x, z, { glow: KR.lamp });
    B.light(x, 4.4, z, KR.lamp, 11);
  }

  O.MAPS.kingsrow = {
    id: 'kingsrow', name: "KING'S ROW", mode: 'hybrid', payloadStyle: 'kingsrow',
    theme: {
      skyTop: 0x141a2a, skyHorizon: 0x3a4058, skyLow: 0x1a1e2a, fog: 0x2a3040, fogNear: 30, fogFar: 150,
      sun: [0.3, 0.75, 0.45], sunCol: 0x7080a8, amb: 0x505870, ground: 0x3a3a40,
      skyline: 'towers', skylineTint: 0x1a1e2c, time: 'rain', rain: true
    },
    build(B) {
      B.bounds(-30, -100, 30, 100);
      B.killY(-20);
      B.floor(-30, -100, 30, 0, 0, 'cobble', { tint: 0x7a7a82 });
      B.floor(-30, 0, 30, 56, 0, 'cobble', { tint: 0x74747c });

      B.spawnRoom({ role: 'att', stage: [0, 0], x: 0, z: -92, w: 16, d: 10, yaw: 0, exits: [{ side: 'n', a: 4, b: 12 }], mat: 'stone', tint: 0xc8c0b0 });
      krHouse(B, -30, -100, -8, -84, 14, 0, { sides: 'n' });
      krHouse(B, 8, -100, 30, -84, 14, 1, { sides: 'n' });
      B.box(-8, 0, -100, 8, 14, -97, 'brick', { tint: KR.brick[0] });
      B.box(-8, 5.6, -97, 8, 14, -87, 'brick', { tint: KR.brick[0] });
      B.sign(0, 8.4, -86.95, 'n', 12, 1.8, 'THE ROYAL HOTEL', { bg: '#1a1a24', fg: '#f0d890', font: 'bold 40px Georgia, serif' });
      B.box(-3.5, 5.6, -86.9, 3.5, 5.9, -84.6, 'fabric', { tint: 0x8a1a2a, col: false });
      B.box(-32, 0, -84, -30, 12, -44, 'brick', { tint: KR.brick[3] });
      krHouse(B, -24, -84, -18, -66, 10, 2, { sides: 'e', roof: 'gable-z' });
      krHouse(B, -24, -62, -18, -44, 10, 3, { sides: 'e', roof: 'gable-z' });
      B.prop('crates', -27, -76);
      B.prop('barrels', -28, -54, { c: 0x3a4a3a });
      B.light(-27, 3.5, -64, KR.lamp, 8);
      krHouse(B, 18, -84, 30, -76, 10, 4, { sides: 'w', roof: 'gable-x' });
      B.stairs(18, -76, 24, -66, 0, 4.5, 'z+', 'stone', { tint: 0x9a9284 });
      B.box(24, 0, -76, 30, 4.5, -66, 'brick', { tint: KR.brick[2], top: 'wood', topTint: 0x6a5040 });
      krHouse(B, 18, -66, 30, -44, 4.5, 4, { sides: 'w' });
      B.sign(17.95, 3.2, -55, 'w', 9, 1.1, 'THE CROWN & ANCHOR', { bg: '#1a2a1a', fg: '#e8d080', font: 'bold 36px Georgia, serif' });
      B.prop('planter', 22, -60, { y: 4.5 }); B.prop('crates', 27, -48, { y: 4.5 });
      B.prop('phonebox', -10, -78);
      B.prop('car', 5, -70, { c: 0x2a2a30, yaw: 0.05 });
      B.prop('bench', 12.5, -60, { yaw: -Math.PI / 2 });
      for (const [x, z] of [[-9, -64], [9, -80], [9, -50]]) krLamp(B, x, z);
      B.healthPack(-27, -64, false);
      B.healthPack(13, -72, false);

      B.point('A', 0, -24, 6);
      B.prop('statue', 0, -24, { c: 0x7a8a82 });
      krHouse(B, -30, -40, -20, -10, 9, 1, { sides: 'e', roof: 'gable-z' });
      B.slab(-20, -36, -16, -12, 4.4, 0.4, 'stone', { tint: 0xa8a090 });
      B.stairs(-20, -12, -16, -4, 0, 4.4, 'z-', 'stone', { tint: 0x9a9284 });
      for (const z of [-35.6, -24, -12.4]) B.cyl(-16.4, z, 0, 4, 0.2, 'stone', { tint: KR.trim });
      krHouse(B, 20, -40, 30, 8, 10, 3, { sides: 'w', roof: 'gable-z' });
      B.box(-18, 0, 0, -6, 12, 8, 'stone', { tint: 0xb0a898 });
      B.box(6, 0, 0, 20, 12, 8, 'stone', { tint: 0xb0a898 });
      B.box(-6, 7, 0, 6, 12, 8, 'stone', { tint: 0xb8b0a0 });
      B.sign(0, 9.6, -0.05, 's', 10, 1.6, "KING'S ROW", { bg: '#2a2a34', fg: '#f0e0b0', font: 'bold 44px Georgia, serif' });
      B.sign(0, 9.6, 8.05, 'n', 10, 1.6, "KING'S ROW", { bg: '#2a2a34', fg: '#f0e0b0', font: 'bold 44px Georgia, serif' });
      for (const x of [-6.6, 6.6]) B.light(x, 5.5, -1, KR.lamp, 9);
      B.prop('bus', -11, -18, { c: 0xb81e1e });
      B.prop('phonebox', 13, -40);
      B.prop('phonebox', -14, -2);
      B.prop('bench', 12, -12, { yaw: -Math.PI / 2 });
      B.prop('planter', 8, -34); B.prop('planter', -7, -38);
      for (const [x, z] of [[-15, -30], [15, -20], [-6, -42], [8, -4]]) krLamp(B, x, z);
      B.healthPack(-26, -42, true);
      B.healthPack(16, -36, false);
      B.healthPack(-18, -8, false);

      B.spawnRoom({ owners: [{ role: 'def', stage: [0, 0] }, { role: 'att', stage: [1, 1] }], x: -24, z: 5, w: 12, d: 14, yaw: Math.PI, exits: [{ side: 's', a: 3, b: 9 }], mat: 'stone', tint: 0xc8c0b0 });

      krHouse(B, -30, 12, -20, 56, 11, 1, { sides: 'e', roof: 'gable-z' });
      krHouse(B, 20, 8, 30, 40, 10, 2, { sides: 'w', roof: 'gable-z' });
      B.spawnRoom({ owners: [{ role: 'def', stage: [1, 1] }, { role: 'att', stage: [2, 2] }], x: 24, z: 46, w: 12, d: 12, yaw: -Math.PI / 2, exits: [{ side: 'w', a: 3, b: 9 }], mat: 'stone', tint: 0xc8c0b0 });
      B.box(18, 5.6, 40, 30, 10, 52, 'brick', { tint: KR.brick[2] });
      B.slab(-20, 26, 20, 30, 5, 0.5, 'stone', { tint: 0xa8a090 });
      B.stairs(-20, 14, -16, 26, 0, 5, 'z+', 'stone', { tint: 0x9a9284 });
      B.stairs(14, 14, 18, 26, 0, 5, 'z+', 'stone', { tint: 0x9a9284 });
      B.rail(-16, 26, 14, 26, 5, 'metal', { tint: 0x2a2a2a });
      B.rail(-20, 30, 20, 30, 5, 'metal', { tint: 0x2a2a2a });
      B.sign(0, 3.9, 25.7, 's', 10, 0.9, "KING'S ROW · WESTMINSTER LINE", { bg: '#1a1a24', fg: '#d8d8e0' });
      B.prop('bus', 6, 44, { c: 0xb81e1e });
      B.prop('phonebox', -18.4, 44);
      B.prop('planter', 10, 16);
      for (const [x, z] of [[-4, 50], [10, 34], [-10, 12]]) krLamp(B, x, z);
      B.healthPack(0, 52, false);
      B.healthPack(12, 20, false);
      B.healthPack(-17, 8, true);

      B.box(-30, -7, 56, -20, 11, 72, 'brick', { tint: KR.brick[4] });
      B.box(-8, -7, 56, 16, 8, 72, 'stone', { tint: 0xb4ac9c, band: { h: 0.5, mat: 'stone', tint: KR.trim } });
      B.sign(4, 5.6, 55.95, 's', 14, 1.6, "KING'S ROW STATION", { bg: '#1a2a5a', fg: '#ffffff' });
      krHouse(B, 24, 52, 30, 56, 10, 3, { sides: 'w' });
      B.box(24, -7, 56, 30, 10, 72, 'brick', { tint: KR.brick[3] });
      B.box(-20, 4, 56, -8, 4.8, 72, 'stone', { tint: 0x9a9284 });
      B.box(16, 4, 56, 24, 4.8, 72, 'stone', { tint: 0x9a9284 });
      B.ramp(-20, 56, -8, 72, -6, 0, 'z-', 'cobble', { tint: 0x6a6a72 });
      B.stairs(16, 56, 24, 72, -6, 0, 'z-', 'stone', { tint: 0x8a8478 });
      B.light(-14, 2.5, 62, 0x70a8ff, 9);
      B.light(20, 2.5, 62, 0x70a8ff, 9);

      B.floor(-30, 72, 30, 100, -6, 'concrete', { tint: 0x5a5e66 });
      B.box(-32, -7, 72, -30, 6, 100, 'metalDark', { tint: 0x5a5e68 });
      B.box(30, -7, 72, 32, 6, 100, 'metalDark', { tint: 0x5a5e68 });
      B.box(-32, -7, 100, 32, 6, 102, 'metalDark', { tint: 0x5a5e68 });
      krHouse(B, -30, 72, 30, 100, 14, 0, { y: 4, sides: 's', roof: 'gable-x', roofH: 4 });
      B.prop('core', 4, 99.5, { y: -6 });
      B.light(4, 0, 94, 0x40a8ff, 18);
      B.slab(24, 74, 30, 98, -1.6, 0.4, 'grate', { tint: 0x9aa0a8 });
      B.stairs(16, 90, 24, 96, -6, -1.6, 'x+', 'metal', { tint: 0x7a7e88 });
      B.rail(24, 74, 24, 90, -1.6, 'metal', { tint: 0x3a3e46 });
      B.prop('generator', -6, 87, { y: -6 });
      B.prop('generator', 14, 82, { y: -6, yaw: Math.PI / 2 });
      B.prop('crates', -10, 78, { y: -6 });
      B.prop('barrels', 12, 92, { y: -6, c: 0x3a4a6a });
      B.prop('omnic', -27, 76, { y: -6, yaw: Math.PI / 2 });
      B.prop('omnic', 20, 98.5, { y: -6, yaw: Math.PI });
      B.prop('omnic', -3, 98.5, { y: -6, yaw: Math.PI, lit: true, eye: 0xff3030 });
      B.prop('pipes', -29.4, 78, { y: -5.8, len: 11, col: false });
      B.prop('pipes', 29.4, 84, { y: -1.2, len: 24, col: false });
      for (const [x, z] of [[-10, 80], [16, 86], [-20, 98]]) B.light(x, 0, z, 0x3a80ff, 13);
      B.healthPack(-4, 76, true, -6);
      B.healthPack(0, 90, false, -6);
      B.healthPack(27, 80, false, -1.6);
      B.spawnRoom({ role: 'def', stage: [2, 2], x: -22, z: 90, w: 14, d: 12, y: -6, yaw: Math.PI / 2, exits: [{ side: 'e', a: 3, b: 9 }], mat: 'metalDark', tint: 0x8a8e98, floorMat: 'grate' });

      B.path([[0, -14], [0, 20], [-14, 32], [-14, 44], [-14, 56, 0], [-14, 72, -6], [4, 82, -6], [4, 94, -6]], [3, 7]);

      B.prop('clocktower', -60, 150, { col: false, y: 0, s: 1.8 });
      B.prop('skyline', 0, 0, { col: false, n: 16, r: 150, h: 34, c: 0x1e2230, lit: 0.3, lc: 0xffd08a, y: 0 });

      B.hint('hold', 0, 0, -30); B.hint('hold', 0, -10, -24); B.hint('hold', 0, 10, -26); B.hint('perch', 0, -18, -24, { y: 4.4 }); B.hint('hold', 0, 4, -10);
      B.hint('stage', 0, 0, -58); B.hint('stage', 0, -27, -58); B.hint('stage', 0, 13, -70);
      B.hint('hold', 1, 0, 16); B.hint('hold', 1, -8, 36); B.hint('hold', 1, 8, 30); B.hint('perch', 1, 0, 28, { y: 5 }); B.hint('hold', 1, -12, 42);
      B.hint('hold', 2, -2, 84, { y: -6 }); B.hint('hold', 2, 10, 88, { y: -6 }); B.hint('hold', 2, 0, 76, { y: -6 }); B.hint('perch', 2, 27, 86, { y: -1.6 }); B.hint('hold', 2, -10, 92, { y: -6 });

      B.cam('shot', 12, 6, -46, 0, 2, -22);
      B.cam('menu', -12, 2.6, -36, 4, 4, -18);
    }
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
