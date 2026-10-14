(function (M) {
  'use strict';
  const LAMP = [1, 0.78, 0.5];
  const thug = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'thug', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});
  const mob = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'mobster', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});
  const L1 = -3.4, F2 = 3.4, F3 = 6.8;

  M.defineLevel({
    id: 'bogart',
    title: 'Играя в Богарта',
    titleEn: 'Playing It Bogart',
    part: 1,
    chapter: 3,
    world: { ambient: [0.06, 0.055, 0.05], fog: { color: [0.05, 0.055, 0.065], near: 16, far: 70 }, weather: 'blizzard', sky: 'night', moon: { dir: M.norm([0.2, -0.9, 0.3]), color: [0.08, 0.09, 0.12] } },
    start: { pos: [12, 0, -9], yaw: Math.PI },
    loadout: { weapons: ['beretta', 'beretta2', 'deagle'], ammo: { '9mm': 90, '50ae': 14 }, painkillers: 2 },
    music: 'hotel',
    intro: 'bogart_in',
    outro: 'bogart_out',
    killY: -30,
    thought: 'Отель Лупино. Алекс сказал: это люди Лупино.',
    build(B) {
      B.ground(-30, -30, 60, 40, 0, 'asphalt_snow');
      B.box(-30, 0, -3, 60, 0.15, 0, 'sidewalk');
      B.zone(-30, -2, -30, 60, 30, 0, { outdoor: true, amb: [0.09, 0.1, 0.13] });
      B.zone(-2, -6, 0, 40, 12, 34, { outdoor: false });
      B.box(-30, 0, -30, -2, 14, 0, { side: 'facade_brown', top: 'roof_tar' });
      B.box(38, 0, -30, 60, 16, 0, { side: 'facade_grey', top: 'roof_tar' });
      B.box(-30, 0, -34, 60, 18, -30, { side: 'facade_brick', top: 'roof_tar' });
      B.plan({
        y: 0, h: 3.15, outer: 'brick_dark',
        rooms: [
          { id: 'lobby', x0: 6, z0: 0, x1: 24, z1: 14, y: 0, floor: 'carpet_hotel', wall: 'wallpaper_hotel', ceil: 'ceiling_panel', ceilHoles: [[12, 6, 20, 14]] },
          { id: 'back', x0: 24, z0: 0, x1: 32, z1: 14, y: 0, floor: 'linoleum', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'sw', x0: 24, z0: 14, x1: 32, z1: 22, y: L1, h: 6.55, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'lc', x0: 6, z0: 22, x1: 32, z1: 26, y: L1, floor: 'carpet_hotel', wall: 'wallpaper_green', ceil: 'ceiling_panel' },
          { id: 'tvr', x0: 24, z0: 26, x1: 32, z1: 32, y: L1, floor: 'carpet_red', wall: 'wallpaper_hotel', ceil: 'ceiling_panel' },
          { id: 'bath', x0: 18, z0: 26, x1: 24, z1: 32, y: L1, floor: 'bath_tile', wall: 'bath_tile', ceil: 'plaster' },
          { id: 'r13', x0: 10, z0: 26, x1: 18, z1: 32, y: L1, floor: 'carpet_hotel', wall: 'wallpaper_red', ceil: 'plaster' },
          { id: 'store2', x0: 14, z0: 16, x1: 24, z1: 22, y: L1, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'shaft1', x0: 6, z0: 18, x1: 10, z1: 22, y: L1, h: 9.95, floor: 'metal_plate', wall: 'metal_plate', ceil: 'ceiling_dark' },
          { id: 'c2', x0: 6, z0: 14, x1: 32, z1: 18, y: F2, floor: 'carpet_hotel', wall: 'wallpaper_hotel', ceil: 'ceiling_panel' },
          { id: 'camR', x0: 6, z0: 6, x1: 12, z1: 14, y: F2, floor: 'carpet_red', wall: 'wallpaper_red', ceil: 'plaster' },
          { id: 'stoveR', x0: 12, z0: 6, x1: 20, z1: 14, y: F2, floor: 'kitchen_tile', wall: 'plaster', ceil: 'plaster', noFloor: true },
          { id: 'r21', x0: 20, z0: 6, x1: 32, z1: 14, y: F2, floor: 'carpet_hotel', wall: 'wallpaper_green', ceil: 'plaster' },
          { id: 'sw3', x0: 32, z0: 2, x1: 36, z1: 18, y: F2, h: 6.55, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'suite', x0: 6, z0: 0, x1: 32, z1: 12, y: F3, h: 3.2, floor: 'parquet', wall: 'wallpaper_red', ceil: 'ceiling_panel' },
          { id: 'shaft2', x0: 2, z0: 2, x1: 6, z1: 6, y: L1, h: 13.4, floor: 'metal_plate', wall: 'metal_plate', ceil: 'ceiling_dark' },
          { id: 'f2front', x0: 6, z0: 0, x1: 32, z1: 6, y: F2, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark' }
        ],
        doors: [
          { x: 15, z: 0, w: 2.4, y: 0, door: { id: 'hotel_door', mat: 'door_wood', double: true, open: 1, target: 1, swing: 1 } },
          { x: 15, z: 14, w: 1.2, y: 0, door: { id: 'lobby_n', mat: 'door_wood', locked: true, lockMsg: 'Заперто изнутри. Лупино не любит гостей.' } },
          { x: 28, z: 14, w: 6, y: 0, h: 3.1 },
          { x: 28, z: 22, w: 6, y: L1, h: 3 },
          { x: 28, z: 26, w: 1.1, y: L1, door: { id: 'tvr_door', mat: 'door_wood', swing: 1 } },
          { x: 21, z: 26, w: 1.0, y: L1, door: { id: 'bath_door', mat: 'door_wood', swing: 1 } },
          { x: 14, z: 26, w: 1.1, y: L1, door: { id: 'r13_door', mat: 'door_old', locked: true, noPush: false, lockMsg: 'Висячий замок. Ключа нет, но есть дробь.' } },
          { x: 19, z: 22, w: 1.2, y: L1, door: { id: 'store2_door', mat: 'door_metal', swing: -1 } },
          { x: 8, z: 22, w: 2.2, y: L1, h: 2.4, door: { id: 'lift1_low', mat: 'metal_plate', slide: true, noPush: true, open: 1, target: 1 } },
          { x: 8, z: 18, w: 2.2, y: F2, h: 2.4, door: { id: 'lift1_up', mat: 'metal_plate', slide: true, noPush: true } },
          { x: 9, z: 14, w: 1.0, y: F2, door: { id: 'cam_door', mat: 'door_wood', swing: -1 } },
          { x: 16, z: 14, w: 1.0, y: F2, door: { id: 'stove_door', mat: 'door_wood', swing: -1 } },
          { x: 26, z: 14, w: 1.1, y: F2, door: { id: 'r21_door', mat: 'door_wood', swing: -1 } },
          { x: 32, z: 16.9, w: 1.6, y: F2, h: 2.4 },
          { x: 32, z: 4, w: 3, y: F3, h: 2.6 },
          { x: 6, z: 4, w: 2.2, y: F3, h: 2.4, door: { id: 'lift2_door', mat: 'metal_plate', slide: true, noPush: true, open: 1, target: 1 } }
        ],
        windows: [
          { x: 24, z: 7, w: 4, y: 0, y0: 0.6, y1: 2.6, id: 'backglass' },
          { x: 10, z: 0, w: 2, y: 0, y0: 1, y1: 2.4 },
          { x: 20, z: 0, w: 2, y: 0, y0: 1, y1: 2.4 },
          { x: 12, z: 0, w: 2.4, y: F3, y0: 0.9, y1: 2.4 },
          { x: 24, z: 0, w: 2.4, y: F3, y0: 0.9, y1: 2.4 },
          { x: 30, z: 0, w: 2, y: F3, y0: 0.9, y1: 2.4 }
        ]
      });
      B.box(12, F2 - 0.25, 6, 20, F2, 9, { top: 'kitchen_tile', bottom: 'ceiling_panel', side: 'trim' });
      B.box(12, F2 - 0.25, 11, 20, F2, 14, { top: 'kitchen_tile', bottom: 'ceiling_panel', side: 'trim' });
      B.box(12, F2 - 0.25, 9, 15, F2, 11, { top: 'kitchen_tile', bottom: 'ceiling_panel', side: 'trim' });
      B.box(17, F2 - 0.25, 9, 20, F2, 11, { top: 'kitchen_tile', bottom: 'ceiling_panel', side: 'trim' });
      B.group('weakfloor', () => B.box(15, F2 - 0.25, 9, 17, F2, 11, { top: 'plank', bottom: 'plank', side: 'trim' }));
      B.group('stoveUp', () => B.decor('stove', 16, F2, 10, 0));
      B.group('stoveDown', () => { B.decor('stove', 16.2, 0, 10.3, 0.5); B.decor('rubble', 15.4, 0, 9.4, 0.3, { solid: false }); }, true);
      B.stairs(25, 14.2, 31, 20.2, L1, 0, 'n', 'concrete');
      B.stairs(32.2, 6.4, 35.8, 17.8, F2, F3, 'n', 'concrete');
      B.box(32, F2, 2, 36, F3, 6.4, { top: 'concrete', side: 'plaster_dirty' });
      B.decal(15, 4.1, -0.12, 'nz', 4.5, 1.1, 'neon_hotel', { emissive: true });
      B.light(15, 4.6, -1.2, [1, 0.35, 0.3], 8, { i: 1.2 });
      B.decor('streetlight', 2, 0, -2.6, 0);
      B.decor('streetlight', 28, 0, -2.6, 0);
      B.light(2, 4.5, -3.5, [1, 0.72, 0.45], 14, { i: 1.1 });
      B.light(28, 4.5, -3.5, [1, 0.72, 0.45], 14, { i: 1.1 });
      B.decor('car', 5, 0, -6.5, Math.PI / 2, { color: '#2a3a2a' });
      B.decor('car', 24, 0, -6.2, -Math.PI / 2, { color: '#5a1a1a' });
      B.decor('dumpster', 34, 0, -1.2, 0);
      B.decor('hydrant', -1, 0, -1.6, 0);
      B.decor('counter', 18, 0, 11.8, 0);
      B.decor('counter', 20.6, 0, 11.8, 0, { solid: true });
      B.decor('sofa', 9, 0, 5, Math.PI / 2, { mat: 'fabric_red' });
      B.decor('armchair', 9.3, 0, 9, Math.PI / 2 + 0.3);
      B.decor('table', 13, 0, 6.5, 0.2, { noShot: true });
      B.decor('coatrack', 22.8, 0, 1.2, 0);
      B.decor('piano', 22.9, 0, 5, -Math.PI / 2);
      B.light(10, 2.9, 5, LAMP, 8); B.light(18, 2.9, 8, LAMP, 9); B.light(15, 2.9, 2, LAMP, 6, { i: 0.7 });
      B.decor('shelf', 31.5, 0, 3, -Math.PI / 2);
      B.decor('table', 28, 0, 9, 0);
      B.decor('pallet', 30.8, 0, 12.6, 0.3);
      B.light(28, 2.9, 6, [0.9, 1, 0.9], 8);
      B.light(28, 0, 18, [0.9, 0.9, 0.8], 7, { i: 0.8 });
      for (let x = 10; x < 32; x += 7) B.light(x, L1 + 2.8, 24, LAMP, 6, { i: 0.8 });
      B.decor('armchair', 27.3, L1, 29, -Math.PI / 2, { solid: false });
      B.decor('tvstand', 30.9, L1, 28.8, Math.PI / 2, { solid: true });
      B.decor('bed', 25.5, L1, 29.5, Math.PI / 2);
      B.light(28, L1 + 2.8, 29, [0.8, 0.9, 1], 6, { i: 0.7 });
      B.decor('bathtub', 19, L1, 30, 0); B.decor('toilet', 23.4, L1, 31.5, Math.PI); B.decor('sink', 21, L1, 31.6, Math.PI);
      B.light(21, L1 + 2.8, 29, [0.9, 1, 1], 5);
      B.decor('bed', 12, L1, 30.2, Math.PI / 2, { sheet: '#8a6a6a' });
      B.decor('chair', 15, L1, 29, 0.5);
      B.decor('tvstand', 17.4, L1, 31.4, Math.PI);
      B.light(14, L1 + 2.8, 29, [1, 0.6, 0.4], 6, { i: 0.8 });
      B.decor('shelf', 19, L1, 16.4, 0); B.decor('shelf', 23.6, L1, 19, -Math.PI / 2);
      B.light(19, L1 + 2.8, 19, [0.9, 0.9, 0.8], 6, { i: 0.7 });
      B.light(8, L1 + 2.6, 20, [1, 1, 0.9], 4, { i: 0.6 }); B.light(8, F2 + 2.6, 20, [1, 1, 0.9], 4, { i: 0.6 });
      for (let x = 13; x < 32; x += 7) B.light(x, F2 + 2.8, 16, LAMP, 6, { i: 0.8 });
      B.decor('bed', 9, F2, 11.8, 0, { sheet: '#6a2a3a' });
      B.decor('desk', 7, F2, 7.4, Math.PI / 2);
      B.decor('coatrack', 11.3, F2, 6.7, 0);
      B.light(9, F2 + 2.8, 9, [1, 0.5, 0.5], 6, { i: 0.8 });
      B.decor('counter', 13.4, F2, 7.4, Math.PI / 2);
      B.decor('fridge', 19.4, F2, 6.6, -Math.PI / 2);
      B.decor('table', 18, F2, 12, 0);
      B.light(16, F2 + 2.8, 8, [0.9, 1, 0.9], 7);
      B.decor('bed', 23, F2, 8, Math.PI / 2); B.decor('bed', 29, F2, 8, Math.PI / 2); B.decor('table', 26, F2, 12, 0.2);
      B.light(26, F2 + 2.8, 10, LAMP, 8);
      B.light(34, F2 + 2.6, 16, [0.9, 0.9, 0.8], 6); B.light(34, F3 + 2.6, 4, [0.9, 0.9, 0.8], 5); B.light(34, F3 + 1.5, 11, [0.9, 0.9, 0.8], 5);
      B.decor('sofa', 20, F3, 9.4, Math.PI, { mat: 'fabric_red' });
      B.decor('sofa', 26, F3, 9.4, Math.PI, { mat: 'fabric_red' });
      B.decor('table', 23, F3, 6.6, 0);
      B.decor('bar', 29, F3, 3.5, Math.PI / 2);
      B.decor('piano', 10, F3, 10.6, Math.PI);
      B.decor('armchair', 14, F3, 3, 0.4);
      B.decor('armchair', 17, F3, 2.6, -0.4);
      B.light(12, F3 + 2.9, 6, LAMP, 9); B.light(22, F3 + 2.9, 6, LAMP, 10); B.light(31, F3 + 2.9, 6, [1, 0.6, 0.8], 8);
      B.light(4, F3 + 2.6, 4, [1, 1, 0.9], 4, { i: 0.6 });
      B.decal(6.12, 1.6, 7, 'px', 1.0, 0.8, 'painting');
      B.decal(23.88, 1.6, 11.5, 'nx', 1.0, 0.8, 'painting');
      B.decal(18, 2.4, 13.88, 'nz', 2.4, 0.45, 'sign:РЕГИСТРАЦИЯ');
      B.decal(31.88, 1.5, 24, 'nx', 1.2, 1.2, 'graffiti2');
      B.decal(21, L1 + 1.6, 22.12, 'pz', 1.4, 1, 'blood_wall');
      B.decal(12.12, F2 + 1.6, 10, 'px', 0.25, 0.25, 'vent');
      B.decal(36 - 0.12, F3 + 1.6, 6, 'nx', 1.4, 1.1, 'painting');
      B.decal(10, F3 + 1.6, 0.12, 'pz', 0.9, 0.9, 'clock');
      B.decal(15, 0.01, 7, 'py', 1.4, 1.4, 'blood1');
    },
    props: [
      { kind: 'note', id: 'vinnie_letter', pos: [13.8, 0.02, 4.2], title: 'Письмо, брошенное на ковёр', text: 'Джек,\nгруз придёт в отель в пятницу. Валькирию разгрузим в подвале, как всегда. Рико присмотрит, он там всё равно живёт со своими девочками. Дон Анджело хочет, чтобы всё прошло тихо.\nНикаких фокусов с книжками, Джек. Пожалуйста.\nВинни' },
      { kind: 'cyl', id: 'cyl1', pos: [29.5, 0, 2] },
      { kind: 'cyl', id: 'cyl2', pos: [30.6, 0, 7.8] },
      { kind: 'tv', id: 'tv_soap', pos: [30.8, L1 + 0.5, 28.8], yaw: Math.PI / 2, show: 'lords', on: true },
      { kind: 'shootable', id: 'stove', pos: [16, F2 + 0.55, 10], r: 0.6, hp: 30, event: 'stoveFall', mat: 'metal' },
      { kind: 'tv', id: 'tv_news', pos: [17.4, L1 + 0.5, 31.4], yaw: Math.PI, show: 'news_wanted', on: false },
      { kind: 'padlock', id: 'r13_lock', pos: [14.42, L1 + 1.05, 25.88], door: 'r13_door', swing: 1 },
      { kind: 'mover', id: 'lift1', model: 'elevator', parts: [[-1.9, -0.25, -1.9, 1.9, 0, 1.9]], origin: [8, L1, 20], path: [[8, L1, 20], [8, F2, 20]], maxSpeed: 1.6, accel: 1.2, crush: false },
      { kind: 'button', id: 'lift1call', pos: [10.3, L1 + 1.3, 22.4], yaw: 0, label: 'Вызвать лифт' },
      { kind: 'mover', id: 'lift2', model: 'elevator', parts: [[-1.9, -0.25, -1.9, 1.9, 0, 1.9]], origin: [4, F3, 4], path: [[4, F3, 4], [4, L1, 4]], maxSpeed: 1.4, accel: 0.8, crush: false },
      { kind: 'note', id: 'cam_notes', pos: [7.2, F2 + 0.8, 7.2], title: 'Записи в блокноте', text: 'Номер 21, пятница: советник Р. с блондинкой. Плёнка у Джоуи.\nНомер 14, суббота: судья, двое. Плёнка у Вирджилио.\nКамера за решёткой вентиляции. Не трогать, линзу пачкаете.\nДеньги за молчание забирать по понедельникам. Лупино в курсе.' },
      { kind: 'crate', id: 'cr_b1', pos: [26, 0, 1.2], size: [0.8, 0.8, 0.8] },
      { kind: 'crate', id: 'cr_s1', pos: [16, L1, 17], size: [0.9, 0.9, 0.9] }
    ],
    items: [
      { kind: 'ammo', ammo: '9mm', amount: 18, pos: [26, 0.02, 1.2], in: 'cr_b1' },
      { kind: 'painkillers', amount: 2, pos: [21, L1 + 0.9, 31.6] },
      { kind: 'ammo', ammo: '12g', amount: 8, pos: [16, L1 + 0.02, 17], in: 'cr_s1' },
      { kind: 'weapon', weapon: 'pump', amount: 7, pos: [22, L1, 18] },
      { kind: 'painkillers', amount: 1, pos: [7.2, F2 + 0.8, 8] },
      { kind: 'ammo', ammo: '9mm', amount: 36, pos: [18, F2 + 0.8, 12] },
      { kind: 'painkillers', amount: 2, pos: [29, F3 + 1.12, 3.5] },
      { kind: 'ammo', ammo: '50ae', amount: 7, pos: [23, F3 + 0.8, 6.6] }
    ],
    chars: [
      thug('l1', 'lobby', 13.6, 0, 7.4, Math.PI, 'beretta', { pose: null, stay: true, mode: 'hold' }),
      thug('l2', 'lobby', 19, 0, 10, Math.PI * 0.9, 'beretta'),
      mob('l3', 'lobby', 22, 0, 3, Math.PI * 0.6, 'ingram'),
      thug('rf1', 'reinf', 12, 0, -6, Math.PI, 'beretta', { hidden: true, hunter: true }),
      thug('rf2', 'reinf', 15, 0, -8, Math.PI, 'pump', { hidden: true, hunter: true }),
      mob('rf3', 'reinf', 18, 0, -6.5, Math.PI, 'beretta', { hidden: true, hunter: true }),
      thug('b1', 'back', 28.8, 0, 3.2, Math.PI / 2, 'pump', { leash: 5 }),
      thug('b2', 'back', 29.6, 0, 6.6, Math.PI / 2, 'beretta', { leash: 5 }),
      mob('b3', 'back', 27, 0, 11, Math.PI / 2, 'beretta', { leash: 5 }),
      thug('tvw', 'tvw', 27.3, L1, 29, -Math.PI / 2, 'beretta', { pose: 'tv', mode: 'hold', blind: true, holdFire: true, deaf: true, stay: true }),
      thug('lc1', 'lc', 19, L1, 18.5, 0, 'beretta', { hidden: true, hunter: true }),
      mob('lc2', 'lc', 22, L1, 20, 0, 'ingram', { hidden: true, hunter: true }),
      { id: 'tenant', type: 'civ', pos: [12.2, L1 + 0.6, 30.2], yaw: Math.PI / 2, weapon: null, mode: 'prop', static: true, civilian: true, invuln: true, noHit: true, pose: 'slump', usable: 'Поговорить', speaker: 'tenant', noDrop: true },
      thug('w1', 'wave', 26, F2, 11, 0, 'beretta', { hidden: true, hunter: true }),
      mob('w2', 'wave', 29, F2, 8, 0, 'ingram', { hidden: true, hunter: true }),
      thug('w3', 'wave', 34, F2, 18.5, Math.PI / 2, 'pump', { hidden: true, hunter: true }),
      mob('w4', 'wave', 23, F2, 7.5, 0, 'beretta', { hidden: true, hunter: true, gren: 1 }),
      thug('w5', 'wave', 34, F2, 14, Math.PI / 2, 'beretta', { hidden: true, hunter: true }),
      { id: 'joey', type: 'joey', group: 'finito', pos: [20, F3, 4], yaw: Math.PI * 0.8, weapon: 'pump', mode: 'ambush', leash: 16, hunter: true, drop: { kind: 'painkillers', amount: 1 } },
      { id: 'virgilio', type: 'virgilio', group: 'finito', pos: [28, F3, 7], yaw: Math.PI * 0.8, weapon: 'beretta2', mode: 'ambush', leash: 16, hunter: true, gren: 2 },
      mob('fg1', 'finito', 12, F3, 8, Math.PI, 'beretta'),
      mob('fg2', 'finito', 30, F3, 9, Math.PI / 2, 'ingram')
    ],
    triggers: [
      { id: 'door', min: [12, 0, -2], max: [18, 3, 1] },
      { id: 'back', min: [24.5, 0, 1], max: [32, 3, 13] },
      { id: 'down', min: [24, L1, 20.4], max: [32, -1, 22] },
      { id: 'lcw', min: [10, L1, 22], max: [16, -1, 26] },
      { id: 'r13', min: [10.5, L1, 26.5], max: [17.5, -1, 31.5] },
      { id: 'lift1in', min: [6.5, L1 - 0.1, 18.5], max: [9.5, L1 + 2, 21.2] },
      { id: 'c2', min: [10, F2, 14], max: [16, F2 + 2.5, 18] },
      { id: 'suite', min: [32, F3 - 0.2, 2], max: [36, F3 + 2.5, 6.2] },
      { id: 'lift2in', min: [2.5, F3 - 0.1, 2.5], max: [5.5, F3 + 2, 5.5], off: true }
    ],
    on: {
      start(g) {
        g.dialog([
          ['max:thought', 'Отель на задворках, где номера сдают на час, а постояльцы не помнят своих имён.'],
          ['max:thought', 'Люди Лупино держали его как склад. Если где-то и знают, кто убил Алекса, то здесь.']
        ]);
        g.setThought('Войти в отель Лупино.');
      },
      'enter:door'(g) { g.alert('lobby'); },
      'read:vinnie_letter'(g) {
        g.think('Винни Гоньитти, правая рука Лупино. И Рико Муэрте, сутенёр, который присматривает за товаром.');
        g.setThought('Двери заперты. Через стекло в подсобку.');
        if (!g.flags.reinf && g.groupAlive('lobby') === 0) g.fireEvent('reinfCome');
      },
      'kill:lobby'(g) { if (g.flags['read:vinnie_letter']) g.fireEvent('reinfCome'); else g.later(6, 'reinfCome'); },
      reinfCome(g) {
        if (g.flags.reinf) return;
        g.flags.reinf = true;
        g.wake('reinf', 'alert');
        g.say('Бандит', 'Эй, что за пальба? Джимми, ты там живой?', 3);
      },
      'kill:reinf'(g) { g.think('Все двери заперты. Остаётся стекло, а за ним кто-то ходит.'); g.checkpoint(); },
      'break:backglass'(g) { g.alert('back'); },
      'enter:back'(g) { g.alert('back'); },
      'kill:back'(g) { g.setThought('Лестница вниз, в жилые номера.'); },
      'enter:down'(g) {
        if (g.flags.down) return;
        g.flags.down = true;
        g.think('Внизу кто-то смотрит телевизор. Сериал про лордов и леди, звук на полную.');
      },
      'hurt:tvw'(g) { const c = g.char('tvw'); c.pose = null; c.stay = false; c.ai.mode = 'combat'; },
      'dead:tvw'(g) { g.later(1, 'lcWake'); },
      lcWake(g) { g.wake('lc', 'alert'); },
      'enter:lcw'(g) { if (!g.flags.lcw) { g.flags.lcw = true; g.wake('lc', 'alert'); g.think('Дверь в номер тринадцать на висячем замке. Изнутри кто-то стонет.'); } },
      'break:r13_lock'(g) { g.think('Одна дробь, и замок повис на петле.'); },
      'enter:r13'(g) {
        if (g.flags.r13) return;
        g.flags.r13 = true;
        const tv = g.prop('tv_news');
        tv.on = true; tv.line = 0; tv.lineT = 2.5;
      },
      'talk:tenant'(g) {
        if (g.flags.tenantTalk) return;
        g.flags.tenantTalk = true;
        g.dialog([
          ['tenant', 'Не надо... не бейте больше...'],
          ['max', 'Я не из них. Кто это сделал?'],
          ['tenant', 'Братья... Финито. Спрашивали, кому я продал. Я им сказал, что никому. Не поверили.'],
          ['tenant', 'Они наверху, в люксе. Там всегда кто-то гуляет. Лифт... служебный лифт в конце.'],
          ['max:thought', 'Он закрыл глаза. Дышал, и на том спасибо.']
        ]);
        g.setThought('Служебный лифт в конце коридора. Братья Финито наверху.');
      },
      'enter:lift1in'(g) {
        if (g.flags.lift1At === 'up' || g.flags.lift1Moving) return;
        g.flags.lift1Moving = true;
        g.closeDoor('lift1_low');
        g.later(1.2, 'lift1Up');
      },
      lift1Up(g) { g.moverGo('lift1', [[8, L1, 20], [8, F2, 20]]); },
      'mover:lift1'(g) {
        g.flags.lift1Moving = false;
        if (g.prop('lift1').origin[1] > 0) { g.flags.lift1At = 'up'; g.openDoor('lift1_up', 1); }
        else { g.flags.lift1At = 'low'; g.openDoor('lift1_low', 1); g.enableTrigger('lift1in', true); }
      },
      'use:lift1call'(g) {
        g.prop('lift1call').used = false;
        if (g.flags.lift1At !== 'up' || g.flags.lift1Moving) return;
        g.flags.lift1Moving = true;
        g.closeDoor('lift1_up');
        g.later(1, 'lift1Down');
      },
      lift1Down(g) { g.moverGo('lift1', [[8, F2, 20], [8, L1, 20]]); },
      'enter:c2'(g) {
        if (g.flags.c2) return;
        g.flags.c2 = true;
        g.think('Второй этаж. Из кухни пахнет газом, плита стоит на гнилых досках.');
      },
      stoveFall(g) {
        if (g.flags.stoveFell) return;
        g.flags.stoveFell = true;
        g.show('weakfloor', false);
        g.show('stoveUp', false);
        g.show('stoveDown', true);
        g.emit({ t: 'debris', pos: [16, F2, 10], size: [2, 1, 2], mat: 'wood' });
        g.emit({ t: 'sfx', id: 'explode', pos: [16, 1, 10] });
        g.noise([16, F2, 10], 40, 'explode');
        g.later(1.5, 'waveCome');
      },
      waveCome(g) {
        g.wake('wave', 'alert');
        g.say('Бандит', 'Что это было?! Наверх, живо!', 3);
        g.think('Грохот услышали все. Сейчас начнётся.');
      },
      'kill:wave'(g) { g.setThought('Лестница в конце коридора ведёт в люкс.'); g.checkpoint(); },
      'enter:suite'(g) {
        if (g.flags.suite) return;
        g.flags.suite = true;
        g.alert('finito');
        g.dialog([
          ['joey', 'Вирджилио, это он! Это Пейн!'],
          ['virgilio', 'Сам вижу. Мама говорила, не открывай дверь незнакомцам.'],
          ['joey', 'Мама не говорила про копов, которых все ищут. Стреляй!']
        ]);
        g.music('tension');
      },
      'dead:joey'(g) { const v = g.char('virgilio'); if (v && v.state === 'alive') { v.accMul = 1.3; g.say('virgilio', 'Джоуи! Ты убил моего брата, сволочь!', 3); } },
      'dead:virgilio'(g) { const j = g.char('joey'); if (j && j.state === 'alive') { j.accMul = 1.3; g.say('joey', 'Вирджилио! Нет!', 3); } },
      'kill:finito'(g) {
        g.dialog([['max:thought', 'Братья Финито. Кто-то закажет им один гроб на двоих.'], ['max:thought', 'Лифт в углу люкса. Ниже подвала он не поедет.']]);
        g.enableTrigger('lift2in', true);
        g.setThought('Лифт в люксе. Вниз, в подвал.');
      },
      'enter:lift2in'(g) {
        g.closeDoor('lift2_door');
        g.later(1.2, 'lift2Go');
      },
      lift2Go(g) { g.moverGo('lift2'); g.later(3, 'bogartEnd'); },
      bogartEnd(g) { g.finish(); }
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
