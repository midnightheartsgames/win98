(function (X) {
  'use strict';
  const F = X.F;
  const G = 1.0, M = 4.4, R = 7.6, BS = -3.0, ER = 12;

  function block(B, x0, z0, x1, z1, h, mat, o) {
    o = o || {};
    B.box(x0, 0, z0, x1, h, z1, mat, { top: 'roof_tar', flags: F.WALL });
    const faces = o.faces || 'nsew';
    const win = (x, y, z, yaw) => B.at(x, y, z, yaw, () => { B.vbox(-0.8, 0, -0.04, 0.8, 1.6, 0, o.lit && X.hash('w' + x + ',' + y + ',' + z) % 10 < 3 ? 'window_lit' : 'window_dark'); B.vbox(-0.9, -0.12, -0.12, 0.9, 0, 0, 'stone_white'); });
    for (let y = 3; y < h - 1.5; y += 3.5) {
      if (faces.includes('s')) for (let x = x0 + 2; x < x1 - 1.5; x += 3.2) win(x, y, z1, Math.PI);
      if (faces.includes('n')) for (let x = x0 + 2; x < x1 - 1.5; x += 3.2) win(x, y, z0, 0);
      if (faces.includes('e')) for (let z = z0 + 2; z < z1 - 1.5; z += 3.2) win(x1, y, z, -Math.PI / 2);
      if (faces.includes('w')) for (let z = z0 + 2; z < z1 - 1.5; z += 3.2) win(x0, y, z, Math.PI / 2);
    }
    const cm = o.cornice || 'stone_white';
    B.vbox(x0 - 0.15, h, z0 - 0.15, x1 + 0.15, h + 0.3, z0 + 0.25, cm);
    B.vbox(x0 - 0.15, h, z1 - 0.25, x1 + 0.15, h + 0.3, z1 + 0.15, cm);
    B.vbox(x0 - 0.15, h, z0 + 0.25, x0 + 0.25, h + 0.3, z1 - 0.25, cm);
    B.vbox(x1 - 0.25, h, z0 + 0.25, x1 + 0.15, h + 0.3, z1 - 0.25, cm);
  }

  X.addLevel({
    id: 'bank', n: 2, name: 'Winslow Bank', sub: 'Банк Уинслоу, Манхэттен',
    env: {
      sky: { top: [0.3, 0.52, 0.86], mid: [0.55, 0.72, 0.92], hor: [0.86, 0.9, 0.94], sun: [0.4, 0.75, 0.52], sunColor: [1, 0.98, 0.9], sunSize: 0.04, clouds: 0.6, cloudColor: [1, 1, 1], city: 1.1, cityColor: [0.55, 0.6, 0.7] },
      light: { dir: [0.4, 0.75, 0.52], color: [1.05, 1.0, 0.92], ambient: [0.44, 0.46, 0.52], shadow: [0.5, 0.52, 0.6] },
      fog: { color: [0.8, 0.86, 0.92], near: 70, far: 360 },
      grade: { tint: [1.0, 1.0, 1.0], sat: 1.05 }
    },
    light: 1,
    music: 'calm',
    ambience: 'city',
    loadout: { weapons: ['beretta', 'shotgun', 'knife'], clip: { beretta: 15, shotgun: 8 }, res: { beretta: 45, shotgun: 16, knife: 4 }, medkits: 1, skills: ['sense'], weapon: 'beretta' },
    build(B) {
      B.bounds(-58, -40, 58, 30);
      B.box(-80, -1, 3.5, 80, 0, 40, 'asphalt');
      B.box(-80, -1, -60, -18, 0, 3.5, 'asphalt');
      B.box(18, -1, -60, 80, 0, 3.5, 'asphalt');
      B.box(-18, -1, -60, 18, 0, -34.5, 'asphalt');
      B.box(-80, 0, 3.5, 80, 0.15, 8, 'sidewalk', { flags: F.WALL });
      B.box(-80, 0, 24, 80, 0.15, 28.5, 'sidewalk', { flags: F.WALL });
      for (let x = -76; x < 80; x += 8) B.vbox(x, 0.005, 15.8, x + 4, 0.015, 16.2, 'road_line');
      block(B, -80, 28.5, 80, 44, 16, 'facade_dark', { faces: 'n', lit: true });
      for (const [x, name, bg] of [[-40, "MARIO'S PIZZA", '#b8281c'], [-20, 'DRUGS', '#1f5a8a'], [24, 'DELI', '#2a6a2a'], [46, 'HOTEL ALBANY', '#6a2a6a']]) {
        B.sign(name, x, 4.2, 28.45, 6, 1.1, Math.PI, { bg, fg: '#fff4d0', font: 'sans' });
        B.vbox(x - 3, 0.15, 28.4, x + 3, 3.2, 28.5, 'window_lit', { emit: true });
      }
      B.clip(-58.5, 0, 3.5, -58, 6, 28.5); B.clip(58, 0, 3.5, 58.5, 6, 28.5);
      for (const x of [-56, 56]) { B.prop('jersey', x, 0, 12, Math.PI / 2, {}); B.prop('jersey', x, 0, 18.5, Math.PI / 2, {}); B.prop('police_car', x + Math.sign(x) * -3, 0, 15, 0.2, {}); }
      block(B, -40, -40, -18.2, 3.4, 14, 'facade', { faces: 'se' });
      block(B, 18.2, -40, 40, 3.4, ER, 'facade_dark', { faces: 'sw' });
      block(B, 44, -40, 80, 3.4, 15, 'brick', { faces: 'sw' });
      B.box(40, 0, -40, 44, 4, -39.6, 'brick', { flags: F.WALL });
      B.prop('crates', 42, 0, -30, 0.3, { n: 4 });
      B.prop('trash', 41, 0, -20, 0, {});
      B.box(40.2, 0, -12, 41.8, 1.4, -9.5, 'metal_green', { flags: F.WALL });
      B.prop('barrel', 43, 0, -6, 0, {});

      B.box(-18, 0.8, -26, 14, G, 0, 'marble_floor', { flags: F.WALL });
      B.box(14, 0.8, -16, 17, G, 0, 'marble_floor', { flags: F.WALL });
      B.box(17, 0.8, -26, 18, G, 0, 'marble_floor', { flags: F.WALL });
      B.box(14, 0.8, -26, 17, G, -24, 'marble_floor', { flags: F.WALL });
      B.box(-18, 0, -26, 14, 0.8, -22, 'concrete', { flags: F.WALL });
      B.box(17, 0, -26, 18, 0.8, -22, 'concrete', { flags: F.WALL });
      B.box(-18, 0, -22, 14, 0.8, 0, 'concrete', { flags: F.WALL });
      B.box(17, 0, -22, 18, 0.8, 0, 'concrete', { flags: F.WALL });
      B.box(14, 0, -16, 17, 0.8, 0, 'concrete', { flags: F.WALL });
      B.stairs(-5, 0, 5, 3.4, 0.15, G, 'n', 'stone_white', { solid: true });
      B.box(-12, 0.15, 0, -5, G, 3.4, 'stone_white', { flags: F.WALL });
      B.box(5, 0.15, 0, 12, G, 3.4, 'stone_white', { flags: F.WALL });
      for (const x of [-10.5, -6.5, 6.5, 10.5]) B.prop('column', x, G, 1.6, 0, { h: R - G, r: 0.42 });
      B.box(-12.5, R, -0.2, 12.5, R + 1.2, 2.6, 'stone_white', { flags: F.WALL });
      B.sign('WINSLOW BANK', 0, R + 0.6, 2.62, 11, 1.0, Math.PI, { bg: '#e8e0cc', fg: '#2a2014', font: 'serif', border: '#2a2014' });
      B.wall(-18, 0, 18, 0, G, R, 'facade', { t: 0.4, holes: [[16.3, 3.4, 0, 3.6], [3, 4, 2.6, 5.6, true], [29, 4, 2.6, 5.6, true]] });
      B.wall(-18, -26, 18, -26, 0, R, 'facade', { t: 0.4 });
      B.wall(-18, -26, -18, 0, BS, R + 1, 'facade', { t: 0.4 });
      B.wall(18, -26, 18, 0, BS, R + 1, 'facade', { t: 0.4 });
      B.box(-18, R - 0.6, -26, 14, R, 0, 'ceiling', { top: 'roof_tar', flags: F.WALL });
      B.box(17, R - 0.6, -26, 18, R, 0, 'ceiling', { top: 'roof_tar', flags: F.WALL });
      B.box(14, R - 0.6, -18.6, 17, R, 0, 'ceiling', { top: 'roof_tar', flags: F.WALL });
      for (const [a, b, c, d] of [[-18.2, -0.2, 18.2, 0.2], [-18.2, -26.2, 18.2, -25.8], [-18.2, -26.2, -17.8, 0.2], [17.8, -26.2, 18.2, -14], [17.8, -10, 18.2, 0.2]]) B.box(a, R, b, c, R + 1.0, d, 'stone_white', { flags: F.SOLID | F.SHOT | F.SIGHT });

      B.at(0, G, -14, 0, () => X.PROPS.teller(B, { len: 24 }));
      B.wall(-18, -14, -12, -14, G, G + 3.2, 'wood_panel', { t: 0.3 });
      B.wall(12, -14, 18, -14, G, G + 3.2, 'wood_panel', { t: 0.3, holes: [[1.0, 1.3]] });
      B.door(13.65, -14, G, 1.2, 2.2, 'x', { id: 'gate', locked: 'script', label: 'Служебный проход. Спросите у кассира.', mat: 'door' });
      for (const x of [-9, -3, 3, 9]) B.light(x, R - 1.4, -7, [1, 0.92, 0.72], 12, { bulbR: 0.22 });
      B.prop('clock', 0, R - 1.8, -25.7, 0, { r: 0.7 });
      for (const [x, z] of [[-10, -6], [10, -6], [-10, -2.5], [10, -2.5]]) B.prop('bench', x, G, z, 0, { len: 3, mat: 'wood_dark' });
      for (const x of [-15.5, 15.5]) B.prop('plant', x, G, -1.5, 0, {});
      B.at(-4, G, -11, 0, () => X.PROPS.rope_post(B, { len: 4 }));
      B.at(0, G, -11, 0, () => X.PROPS.rope_post(B, { len: 4 }));
      B.at(4, G, -11, 0, () => X.PROPS.rope_post(B, {}));
      B.prop('table', -15, G, -9, Math.PI / 2, { w: 2, d: 0.7, mat: 'wood_dark' });
      B.prop('table', 15, G, -9, Math.PI / 2, { w: 2, d: 0.7, mat: 'wood_dark' });
      B.sign('ВКЛАДЫ · КРЕДИТЫ · СЕЙФОВЫЕ ЯЧЕЙКИ', 0, G + 2.9, -13.6, 9, 0.5, Math.PI, { bg: '#2a2014', fg: '#e8c870', font: 'serif' });

      for (const [x, z] of [[-8, -18], [-3, -18], [2, -18], [7, -18], [-8, -22], [-3, -22], [2, -22], [7, -22]]) B.prop('desk', x, G, z, Math.PI, { pc: true });
      for (let x = -12; x <= 10; x += 2.4) B.prop('cabinet', x, G, -25.4, 0, {});
      B.prop('safe', 11.5, G, -25.2, 0, {});
      B.object('chair', -6.5, G, -16.5, 0.3);
      B.object('lamp', 2.5, G + 0.77, -18.3, 0);
      B.box(-18, M - 0.2, -26, -17, M, -14.4, 'carpet_red', { flags: F.WALL, bot: 'ceiling' });
      B.box(-14, M - 0.2, -26, 18, M, -14.4, 'carpet_red', { flags: F.WALL, bot: 'ceiling' });
      B.box(-17, M - 0.2, -26, -14, M, -25, 'carpet_red', { flags: F.WALL, bot: 'ceiling' });
      B.box(-17, M - 0.2, -15, -14, M, -14.4, 'carpet_red', { flags: F.WALL, bot: 'ceiling' });
      B.stairs(-17, -25, -14.2, -15.2, G, M, 'n', 'wood_dark');
      B.wall(-14.1, -25, -14.1, -15.2, G, G + 1.2, 'wood_panel', { t: 0.15 });
      B.box(-14.15, M, -18, -14.05, M + 1.1, -15.2, 'brass', { flags: F.SOLID | F.SHOT });
      B.box(-17, M, -15.25, -14.05, M + 1.1, -15.15, 'brass', { flags: F.SOLID | F.SHOT });
      B.stairs(14, -24, 17, -16, BS, G, 's', 'stone');
      B.box(13.8, G, -24, 14, G + 1.1, -16.2, 'brass', { flags: F.SOLID | F.SHOT });
      B.wall(13.9, -24, 13.9, -16, BS, 0.8, 'stone', { t: 0.2 });
      B.wall(17.1, -24, 17.1, -16, BS, 0.8, 'stone', { t: 0.2 });
      B.wall(14, -16, 17, -16, BS, 0.8, 'stone', { t: 0.2 });
      B.floor(14, -24, 17, -16, BS, 'concrete', 0.3);
      B.light(15.5, G - 1.0, -20, [1, 0.9, 0.7], 7, { bulbR: 0.1 });
      for (let x = -17; x < 18; x += 1.5) B.vbox(x, M, -14.5, x + 0.06, M + 1.0, -14.4, 'brass');
      B.box(-18, M + 0.95, -14.55, 18, M + 1.05, -14.35, 'brass', { flags: F.SOLID | F.SHOT });
      B.clip(-18, M, -14.55, 18, M + 1.0, -14.35, F.SOLID);
      B.wall(-14, -18, 13, -18, M, R - 0.6, 'office_wall', { t: 0.2, holes: [[2, 1.2], [11.4, 1.2], [21, 1.2]] });
      B.wall(-8, -26, -8, -18, M, R - 0.6, 'office_wall', { t: 0.2 });
      B.wall(4, -26, 4, -18, M, R - 0.6, 'office_wall', { t: 0.2 });
      B.wall(13, -26, 13, -18, M, R - 0.6, 'office_wall', { t: 0.2 });
      B.wall(-14, -26, -14, -18, M, R - 0.6, 'office_wall', { t: 0.2, holes: [[0.1, 1.2]] });
      B.prop('desk', -2, M, -23.5, Math.PI, { w: 2.2, lamp: true });
      B.prop('bookshelf', -6.5, M, -25.4, 0, { w: 2 });
      B.prop('bookshelf', 2.5, M, -25.4, 0, { w: 2 });
      B.prop('armchair', -5.5, M, -19.8, Math.PI / 2, {});
      B.object('ashtray', -1.4, M + 0.77, -23.3, 0);
      B.item('key', -2.6, M + 0.8, -23.4, { key: 'roofkey', label: 'Ключ от выхода на крышу', id: 'roofkey' });
      B.item('doc', -1.8, M + 0.8, -23.7, { title: 'Письмо управляющему', text: 'Мистер Уинслоу! Ячейку 1313 не вскрывать ни при каких обстоятельствах. Если за ней придёт человек с татуировкой, немедленно звоните по номеру, который вам известен. Подпись: «XX».' });
      for (let x = 5.5; x < 12.5; x += 1.8) B.prop('cabinet', x, M, -25.4, 0, {});
      B.prop('table', 8.5, M, -21.5, 0, { w: 2, d: 1 });
      B.item('ammo', 8.5, M + 0.8, -21.5, { w: 'beretta', n: 15 });
      B.prop('table', -11, M, -21.5, 0, { w: 1.4, d: 0.8 });
      B.prop('cooler', -9, M, -25.3, 0, {});
      B.item('food', -11, M + 0.8, -21.5, { name: 'Пончик', n: 15 });
      B.item('medkit', -12.4, M + 0.1, -21, {});
      B.light(-2, R - 1.0, -22, [1, 0.9, 0.7], 8, { bulbR: 0.1 });
      B.light(-11, R - 1.0, -22, [1, 0.9, 0.7], 7, { bulbR: 0.1 });
      B.light(8.5, R - 1.0, -22, [1, 0.9, 0.7], 7, { bulbR: 0.1 });
      B.light(0, R - 1.0, -16, [1, 0.9, 0.7], 9, { bulbR: 0.1 });
      B.wall(13, -18, 18, -18, M, R - 0.6, 'office_wall', { t: 0.2, holes: [[3.7, 1.05]] });
      B.stairs(14, -25.6, 16.6, -18.6, M, R, 's', 'concrete');
      B.box(14, M - 0.2, -26, 17, M, -25.6, 'concrete', { flags: F.WALL });
      B.wall(13.95, -26, 13.95, -18.2, M, R + 2.6, 'concrete', { t: 0.1 });
      B.box(13.9, R, -26.2, 17.9, R + 2.8, -25.8, 'concrete', { flags: F.WALL });
      B.box(17.5, R, -26, 17.9, R + 2.8, -17.7, 'concrete', { flags: F.WALL });
      B.box(13.9, R, -26, 14.1, R + 2.8, -17.7, 'concrete', { flags: F.WALL });
      B.wall(13.9, -17.7, 17.9, -17.7, R, R + 2.8, 'concrete', { t: 0.2, holes: [[0.8, 1.2]] });
      B.door(15.3, -17.7, R, 1.2, 2.2, 'x', { id: 'roofdoor', locked: 'roofkey', keyName: 'от крыши', mat: 'door_metal' });
      B.box(13.8, R + 2.8, -26.2, 18, R + 3.0, -17.6, 'roof_tar', { flags: F.WALL });
      B.light(15.5, R + 2.2, -22, [1, 0.9, 0.7], 6, { bulbR: 0.08 });

      B.floor(-8, -34, 18, -22, BS, 'concrete', 0.3);
      B.box(-8, 0.8, -34, 18, G, -26, 'concrete', { flags: F.WALL });
      B.wall(-8, -34, 18, -34, BS, 0.8, 'bunker', { t: 0.3 });
      B.wall(-8, -22, 14, -22, BS, 0.8, 'bunker', { t: 0.3 });
      B.wall(-8, -34, -8, -22, BS, 0.8, 'bunker', { t: 0.3 });
      B.wall(18, -34, 18, -22, BS, 0.8, 'bunker', { t: 0.3, holes: [[5, 1.2]] });
      B.wall(8, -34, 8, -22, BS, 0.8, 'bunker', { t: 0.4, holes: [[4.8, 2.4, 0, 2.6]] });
      B.at(8.8, BS, -31.6, -Math.PI / 2 + 0.9, () => X.PROPS.vault_door(B, {}));
      B.prop('desk', 13, BS, -31, 0, { lamp: true });
      B.prop('locker', 16.8, BS, -33.5, 0, { n: 3 });
      B.item('ammo', 12.6, BS + 0.8, -31, { w: 'shotgun', n: 8 });
      B.light(13, BS + 3.3, -28, [1, 0.9, 0.7], 8, { bulbR: 0.1 });
      B.light(0, BS + 3.3, -28, [1, 0.9, 0.7], 10, { bulbR: 0.12 });
      B.at(0, BS, -33.6, 0, () => X.PROPS.deposit_wall(B, { w: 15, h: 3.5 }));
      B.at(0, BS, -22.4, Math.PI, () => X.PROPS.deposit_wall(B, { w: 15, h: 3.5 }));
      B.at(-7.6, BS, -28, Math.PI / 2, () => X.PROPS.deposit_wall(B, { w: 11, h: 3.5 }));
      B.prop('table', 0, BS, -28, 0, { w: 2.4, d: 1.1, mat: 'metal_grey' });
      B.usable('box1313', -2, BS + 1.4, -32.9, { label: 'Открыть ячейку 1313', r: 1.6 });
      B.sign('1313', -2, BS + 1.4, -33.28, 0.28, 0.12, Math.PI, { bg: '#e8d8a0', fg: '#1a1a1a', font: 'serif' });
      B.floor(18, -30, 20.5, -27, BS, 'concrete', 0.3);
      B.box(18, 0.8, -30.3, 20.8, G, -26.7, 'concrete', { flags: F.WALL });
      B.wall(20.5, -30.3, 20.5, -26.7, BS, 0.8, 'bunker', { t: 0.3 });
      B.wall(18, -30.2, 20.6, -30.2, BS, 0.8, 'bunker', { t: 0.2 });
      B.wall(18, -26.8, 20.6, -26.8, BS, 0.8, 'bunker', { t: 0.2 });
      B.door(18, -28.4, BS, 1.2, 2.2, 'z', { id: 'closet', locked: 'pick', mat: 'door_metal' });
      B.item('doc', 19.6, BS + 0.1, -28.5, { title: 'Реестр ячеек', text: 'Ячейка 1313 арендована 12 лет назад на имя «С. Роуланд». Оплата вперёд, наличными. Доверенное лицо: майор Джонс. Вторая подпись неразборчива — похоже на «К.».' });
      B.item('vest', 19.6, BS + 0.1, -29.4, { n: 50 });

      B.prop('hvac', -10, R, -20, 0, {});
      B.prop('hvac', 5, R, -12, Math.PI / 2, {});
      B.prop('hvac', -4, R, -5, 0, {});
      B.prop('water_tower', -12.5, R, -10, 0, {});
      B.prop('skylight', 0, R, -20, 0, { w: 4, d: 2.5 });
      B.box(-15.5, R, -3.5, -13.5, R + 0.8, -2.2, 'wood', { flags: F.WALL });
      B.item('hook', -14.5, R + 0.85, -2.85, { id: 'hookitem' });
      B.sign('WINDOW CLEANING CO.', -14.5, R + 0.4, -2.18, 1.9, 0.3, Math.PI, { bg: '#f0e8c0', fg: '#1a3a6a', font: 'sans' });
      B.grapple(18.3, ER, -12, R, -Math.PI / 2);
      B.item('grenades', 8, R + 0.1, -24, { n: 2 });
      B.prop('hvac', 26, ER, -20, 0, {});
      B.prop('antenna', 32, ER, -8, 0, { h: 9 });
      B.prop('water_tower', 34, ER, -30, 0, {});
      B.prop('hvac', 30, ER, -2, Math.PI / 2, {});
      B.box(24, ER, -14, 27, ER + 2.4, -10, 'brick', { flags: F.WALL });
      B.item('medkit', 25.5, ER + 2.5, -12, {});
      B.at(40, 0, -18, Math.PI / 2, () => X.PROPS.fire_escape(B, { h: ER, w: 3.4 }));

      B.prop('newsstand', -6, 0.15, 26.2, Math.PI, {});
      B.item('doc', -6, 1.3, 25.7, { title: 'Газета «Нью-Йорк Дейли»', text: '«ПРЕЗИДЕНТ ШЕРИДАН УБИТ СНАЙПЕРОМ». Прошло три месяца, а убийца, бывший капитан спецназа Стив Роуланд, так и не пойман. ФБР обещает награду за любые сведения.' });
      for (const x of [-30, -12, 12, 30]) { B.prop('lamp_post', x, 0.15, 7.2, Math.PI, { h: 5, light: false }); B.prop('lamp_post', x + 8, 0.15, 25, 0, { h: 5, light: false }); }
      B.prop('hydrant', -16, 0.15, 7.5, 0, {});
      B.prop('mailbox', 14, 0.15, 7.5, 0, {});
      B.prop('phonebooth', 22, 0.15, 26.5, Math.PI, {});
      B.prop('car', -24, 0, 10.5, Math.PI / 2, { mat: 'car_blue' });
      B.prop('car', 26, 0, 10.5, -Math.PI / 2, { mat: 'car_black' });
      B.prop('car', 38, 0, 21.5, Math.PI / 2, { mat: 'car_red' });
      B.prop('van', 8, 0, 11.5, -Math.PI / 2 + 0.1, { mat: 'car_black' });
      B.prop('police_car', -38, 0, 21, -Math.PI / 2, {});
      B.prop('trash', 16, 0.15, 6.5, 0, {});
      B.prop('bench', -24, 0.15, 26.8, Math.PI, { len: 2.4 });

      B.spawnPlayer(0, 0.15, 25.5, 0);
      B.char('clerk', 0, -14.9, { y: G, id: 'clerk', ai: 'static', look: 0, static: true });
      B.char('bankguard', -2.8, -1.2, { y: G, id: 'guard1', look: Math.PI, ai: 'guard' });
      B.char('bankguard', 15.8, -12.8, { y: G, id: 'guard2', look: Math.PI / 2 + 0.3, ai: 'guard' });
      B.char('civilian', -8, -9, { y: G, id: 'civ1', look: -0.3 });
      B.char('civilian2', 6, -12.3, { y: G, id: 'civ2', look: 0 });
      B.char('civilian', 10, -6.25, { y: G, id: 'civ3', look: 0, pose: 'sit', static: true });
      B.char('civilian2', -12, 22, { y: 0.15, id: 'civ4', path: [[-12, 0.15, 26], [-40, 0.15, 26], [-12, 0.15, 26]] });
      B.char('civilian', 19, 5.2, { y: 0.15, id: 'civ5', path: [[19, 0.15, 5.2], [-30, 0.15, 5.2]] });
      B.char('killer', -2, 5, { y: 0.15, id: 'k1', group: 'lobby', hidden: true, weapon: 'm16' });
      B.char('killer', 2.5, 4.5, { y: 0.15, id: 'k2', group: 'lobby', hidden: true, weapon: 'beretta' });
      B.char('killer', -6, 2.2, { y: G, id: 'k3', group: 'lobby', hidden: true, weapon: 'shotgun' });
      B.char('killer', 6, 2.2, { y: G, id: 'k4', group: 'lobby', hidden: true, weapon: 'm16' });
      B.char('killer', 12.5, 14, { y: 0, id: 'k5', group: 'lobby', hidden: true, weapon: 'm16' });
      B.char('killer', 11, -17, { y: G, id: 'k6', group: 'vaultk', hidden: true, weapon: 'beretta' });
      B.char('killer', 9, -20, { y: G, id: 'k7', group: 'vaultk', hidden: true, weapon: 'shotgun' });
      B.char('killer', -6, -16.5, { y: M, id: 'k8', group: 'mezz', hidden: true, weapon: 'm16' });
      B.char('killer', 9, -16, { y: M, id: 'k9', group: 'mezz', hidden: true, weapon: 'beretta' });
      B.char('killer', 0, -23, { y: M, id: 'k10', group: 'mezz', hidden: true, weapon: 'shotgun' });
      B.char('killer', -8, -8, { y: R, id: 'k11', group: 'roof', hidden: true, weapon: 'm16' });
      B.char('killer', 8, -4, { y: R, id: 'k12', group: 'roof', hidden: true, weapon: 'beretta' });
      B.char('killer', 30, -26, { y: ER, id: 'k13', group: 'east', hidden: true, weapon: 'sniper', ai: 'sniper', sight: 60, static: true, look: Math.PI / 2 + 0.5 });
      B.char('killer', 28, -6, { y: ER, id: 'k14', group: 'east', hidden: true, weapon: 'm16' });
      B.char('killer', 42, -24, { y: 0, id: 'k15', group: 'alley', hidden: true, weapon: 'shotgun' });

      B.usable('clerkTalk', 0, G + 1.4, -13.6, { label: 'Поговорить с кассиром', r: 1.8 });
      B.trigger('lobby', -18, G - 0.5, -14, 18, G + 3, 0);
      B.trigger('vault', -8, BS - 0.5, -34, 8, BS + 3, -22);
      B.trigger('mezz', -18, M - 0.5, -26, 18, M + 3, -14.4);
      B.trigger('roof', -18, R - 0.5, -26, 18, R + 3, 0);
      B.trigger('eastroof', 18.5, ER - 0.5, -40, 40, ER + 3, 3, { noReach: true });
      B.trigger('alley', 40, -0.5, -40, 44, 3, -2, { noReach: true });
      B.trigger('alleyEnd', 40, -0.5, -2, 44, 3, 3.5, { noReach: true });
      B.cam('lobbyCam', [0, G + 4.2, -12], [0, G + 1, 3], 55);
      B.cam('sniperCam', [24, ER + 3, -20], [30, ER + 1.5, -26], 40);
      B.alarm(-17.8, G + 1.5, -8, -Math.PI / 2);
      B.zone('lit', -18, -34, 18, 0, { k: 1 });
      B.interior(-17.8, -3.3, -34, 17.8, R - 0.61, -0.21);
      B.interior(13.9, R - 0.61, -26, 17.9, R + 2.8, -17.7);
      B.interior(18, -3.3, -30.3, 20.6, 0.8, -26.7);
      B.clad(-17.8, -0.2, 17.8, -0.2, G, G + 1.2, 'marble', -1);
      B.clad(-17.8, -0.2, -1.7, -0.2, G + 1.2, R - 0.6, 'plaster', -1);
      B.clad(1.7, -0.2, 17.8, -0.2, G + 1.2, R - 0.6, 'plaster', -1);
      B.clad(-17.8, -26, -17.8, 0, G, R - 0.6, 'plaster', 1);
      B.clad(17.8, -26, 17.8, 0, G, R - 0.6, 'plaster', -1);
      B.clad(-17.8, -25.8, 17.8, -25.8, G, R - 0.6, 'plaster', 1);
    },
    script(S) {
      S.on('start', g => {
        g.objective('bank', 'Найти в банке Уинслоу ячейку 1313');
        g.caption('Манхэттен. Ключ из кармана привёл меня к банку Уинслоу. Ячейка 1313.', 5);
      });
      S.zone('lobby', g => g.msg('Поговорите с кассиром за стойкой — [E]', 4));
      S.use('clerkTalk', g => {
        g.say('clerk', 'Ячейка тринадцать-тринадцать? Да, мистер... Хранилище внизу. Охрана вас пропустит.');
        g.unlock('gate');
        g.openDoor('gate', g.player.pos);
        g.objective('down', 'Спуститься в хранилище');
        g.checkpoint('lobby');
      });
      S.zone('vault', g => { g.complete('down'); g.msg('Ячейка 1313 — у северной стены', 3); });
      S.use('box1313', g => {
        g.complete('bank');
        g.give({ gadget: 'lockpick' });
        g.comic('vault');
        g.memory('marksman', 'Тир... Прицел, выдох, спуск. Я уже делал это. Много раз.');
        g.after(1.5, () => {
          g.ev({ t: 'explode', p: [0, G + 1, 2], r: 4, kind: 'door' });
          g.caption('Наверху грохнул взрыв. Кто-то штурмует банк!', 4);
          g.spawn('lobby', [0, G, -8]);
          g.spawn('vaultk', [15.5, BS, -26]);
          g.spawn('mezz');
          g.objective('escape', 'Выбраться из банка');
          g.objective('innocents', 'Не причинить вреда посетителям и охране', { optional: true });
          g.music('combat');
          g.checkpoint('vault');
          for (const c of g.chars) if (c.team === 'neutral' && c.ai) X.AI.panic(g, c, [0, G, 2]);
        });
      });
      S.on('restore', g => {
        if (g.flags['!use:box1313']) for (const c of g.chars) if (c.team === 'neutral' && c.ai && c.state === 'alive') { c.ai.panic = true; c.pose = 'cower'; }
      });
      S.zone('mezz', g => {
        if (!g.flags['!use:box1313'] || g.player.keys.includes('roofkey')) return;
        g.objective('key', 'Найти ключ от выхода на крышу — кабинет управляющего');
      });
      S.pick('roofkey', g => { g.objective('key', 'Найти ключ от выхода на крышу — кабинет управляющего'); g.complete('key'); g.msg('Выход на крышу — лестница в восточном крыле', 4); g.checkpoint('key'); });
      S.zone('roof', g => {
        if (!g.flags['!use:box1313']) return;
        g.spawn('roof', [0, R, -18]);
        g.spawn('east');
        g.panel({ kind: 'cam', cam: 'sniperCam', dur: 2.8, text: 'СНАЙПЕР!', tint: 'red' });
        g.objective('neighbor', 'Перебраться на крышу соседнего дома');
        g.msg('На крыше должен быть инвентарь мойщиков окон. С кошкой можно забраться выше.', 5);
        g.checkpoint('roof');
      });
      S.pick('hookitem', g => g.msg('Кошка с тросом: подойдите к краю крыши под крюком и нажмите [E]', 5));
      S.zone('eastroof', g => {
        g.complete('neighbor');
        g.complete('escape');
        g.objective('alley', 'Спуститься по пожарной лестнице в переулок');
        g.spawn('alley');
        g.checkpoint('east');
      });
      S.zone('alleyEnd', g => {
        g.complete('alley');
        if (!g.objectives.find(o => o.id === 'innocents').failed) g.complete('innocents');
        g.finish();
      });
      S.on('kill', g => {
        for (const c of g.chars) if (c.team === 'neutral' && c.state === 'dead') g.failObjective('innocents');
      });
    },
    comics: {
      intro: [
        {
          rows: [{ h: 0.52, w: [1] }, { h: 0.48, w: [0.4, 0.6] }],
          panels: [
            { cam: { pos: [-14, 2.2, 27], look: [2, 6, -4], fov: 58 }, actors: [{ type: 'xiii', pos: [-2, 0.15, 21], yaw: -0.3, pose: 'walk' }, { type: 'civilian2', pos: [-9, 0.15, 25.5], yaw: 1.6, pose: 'walk' }], text: [{ k: 'cap', t: 'Банк Уинслоу. Манхэттен. 10:13 утра.', x: 0.03, y: 0.06, w: 0.36 }] },
            { art: 'key', text: [{ k: 'think', t: 'Тринадцать-тринадцать. Что бы там ни лежало — оно ждёт меня.', x: 0.05, y: 0.62, w: 0.9 }] },
            { cam: { pos: [15, 1.7, 17], look: [11, 1.5, 12], fov: 44 }, actors: [{ type: 'killer', pos: [11.5, 0, 12.2], yaw: 2.2, pose: 'phone' }, { type: 'killer', pos: [9.8, 0, 13], yaw: 1.4, pose: 'stand' }], text: [{ k: 'say', t: 'Он вошёл в банк. Как спустится в хранилище — работаем.', x: 0.04, y: 0.05, w: 0.66, who: 0 }] }
          ]
        }
      ],
      vault: [
        {
          rows: [{ h: 1, w: [0.34, 0.33, 0.33] }],
          panels: [
            { art: 'photo', text: [{ k: 'cap', t: 'Фотография. Я — и светловолосая женщина. На обороте: «Стив и Ким».', x: 0.04, y: 0.05, w: 0.9 }] },
            { art: 'newspaper', artOpt: { head: 'КТО УБИЛ ШЕРИДАНА?' }, text: [{ k: 'think', t: 'Роуланд?.. Это я?', x: 0.2, y: 0.72, w: 0.7 }] },
            { art: 'boom', text: [{ k: 'sfx', t: 'KA-BOOM!', x: 0.1, y: 0.4, size: 1.2, style: 'explode' }, { k: 'cap', t: 'И тут наверху грохнуло.', x: 0.05, y: 0.05, w: 0.8 }] }
          ]
        }
      ],
      outro: [
        {
          rows: [{ h: 0.5, w: [0.55, 0.45] }, { h: 0.5, w: [0.5, 0.5] }],
          panels: [
            { cam: { pos: [42, 1.6, 9], look: [42, 1.4, -1], fov: 50 }, actors: [{ type: 'xiii', pos: [42, 0, 1.8], yaw: Math.PI, pose: 'hands_up' }, { type: 'agent', pos: [40.5, 0, 6.5], yaw: 0.2, pose: 'aim' }, { type: 'agent2', pos: [43.8, 0, 6.8], yaw: -0.2, pose: 'aim' }], text: [{ k: 'shout', t: 'ФБР! Руки за голову!', x: 0.05, y: 0.05, w: 0.5, who: 1 }] },
            { shot: { on: 0, dist: 1.4, height: 0.1, angle: 15, fov: 36, target: 'head' }, actors: [{ type: 'agent', pos: [0, 0, 0], yaw: 0, pose: 'aim', float: true }], hideWorld: true, bg: [0.3, 0.42, 0.6], text: [{ k: 'say', t: 'Стив Роуланд, вы арестованы за убийство президента Шеридана.', x: 0.05, y: 0.05, w: 0.8, who: 0 }] },
            { art: 'eye', text: [{ k: 'think', t: 'Роуланд. Шеридан. Президент... Кем же я был?', x: 0.05, y: 0.05, w: 0.8 }] },
            { art: 'silhouette', artOpt: { glint: true, a: '#3a4a7a', b: '#0a0c1a' }, text: [{ k: 'radio', t: 'Пусть ФБР подержит его в клетке. Там до него будет проще добраться.', x: 0.05, y: 0.6, w: 0.9 }] }
          ]
        }
      ]
    }
  });
})(globalThis.XIII = globalThis.XIII || {});
