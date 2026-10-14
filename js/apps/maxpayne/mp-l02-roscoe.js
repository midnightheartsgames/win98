(function (M) {
  'use strict';
  const FL = [0.8, 0.95, 0.9];
  const mob = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'mobster', group, pos: [x, y, z], yaw, weapon, hidden: true }, o || {});
  const thug = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'thug', group, pos: [x, y, z], yaw, weapon, hidden: true }, o || {});
  const carParts = [
    [-7.5, -1, -1.4, 7.5, 0, 1.4],
    [-7.5, 2.4, -1.4, 7.5, 2.6, 1.4],
    [-7.5, 0, 1.3, 7.5, 2.4, 1.4],
    [-7.5, 0, -1.4, -4.5, 2.4, -1.3],
    [-3.0, 0, -1.4, 1.5, 2.4, -1.3],
    [3.0, 0, -1.4, 7.5, 2.4, -1.3],
    [-4.5, 2.0, -1.4, -3.0, 2.4, -1.3],
    [1.5, 2.0, -1.4, 3.0, 2.4, -1.3],
    [-7.5, 0, -1.4, -7.4, 2.4, 1.4],
    [7.4, 0, -1.4, 7.5, 2.4, 1.4]
  ];

  function platform(B, x0, x1, zEdge, zBack, yBed, dir) {
    const s = dir > 0 ? 1 : -1;
    B.box(x0, yBed, zEdge, x1, yBed + 1.2, zEdge + 0.4 * s, { top: 'platform_edge', side: 'concrete_dark' });
    B.box(x0, yBed, zEdge + 0.4 * s, x1, yBed + 1.2, zBack, { top: 'tile_floor', side: 'concrete_dark' });
  }

  function columns(B, x0, x1, z, y0, y1, step) {
    for (let x = x0; x <= x1 + 0.01; x += step) B.box(x - 0.2, y0, z - 0.2, x + 0.2, y1, z + 0.2, 'column_green');
  }

  M.defineLevel({
    id: 'roscoe',
    title: 'Станция Роско-стрит',
    titleEn: 'Roscoe Street Station',
    part: 1,
    chapter: 1,
    world: { ambient: [0.07, 0.075, 0.07], fog: { color: [0.02, 0.025, 0.025], near: 16, far: 60 }, weather: 'none', sky: 'none' },
    start: { pos: [14, 0, 0.6], yaw: 0 },
    loadout: { reset: true, weapons: ['beretta'], ammo: { '9mm': 54 }, painkillers: 1 },
    music: 'station',
    intro: 'roscoe_in',
    outro: 'roscoe_out',
    killY: -30,
    thought: 'Алекс ждёт на Роско-стрит. Встреча по делу Лупино.',
    build(B) {
      B.plan({
        y: 0, h: 3, outer: 'concrete',
        rooms: [
          { id: 'platA', x0: 0, z0: -7, x1: 40, z1: 6, y: -1.2, h: 6.2, floor: 'rail', wall: 'tile_station', ceil: 'ceiling_dark' },
          { id: 'tunAW', x0: -30, z0: -7, x1: 0, z1: -2, y: -1.2, h: 4.5, floor: 'rail', wall: 'tunnel', ceil: 'tunnel' },
          { id: 'tunAE', x0: 40, z0: -7, x1: 70, z1: -2, y: -1.2, h: 4.5, floor: 'rail', wall: 'tunnel', ceil: 'tunnel' },
          { id: 'wc', x0: 4, z0: 6, x1: 12, z1: 12, y: 0, h: 3, floor: 'bath_tile', wall: 'tile_white', ceil: 'ceiling_panel' },
          { id: 'stA', x0: 30, z0: 6, x1: 34, z1: 12, y: 0, h: 8, floor: 'concrete', wall: 'tile_station', ceil: 'ceiling_dark' },
          { id: 'm1', x0: 18, z0: 12, x1: 44, z1: 16, y: 4, h: 3.2, floor: 'tile_floor', wall: 'tile_station', ceil: 'ceiling_panel' },
          { id: 'booth', x0: 36, z0: 16, x1: 42, z1: 20, y: 4, h: 3.2, floor: 'linoleum', wall: 'plaster_green', ceil: 'ceiling_panel' },
          { id: 'exitA', x0: 44, z0: 12, x1: 48, z1: 16, y: 4, h: 3.2, floor: 'concrete', wall: 'tile_station', ceil: 'ceiling_dark' },
          { id: 'm2', x0: 18, z0: 16, x1: 22, z1: 30, y: 4, h: 3.2, floor: 'tile_floor', wall: 'tile_station', ceil: 'ceiling_panel' },
          { id: 'bars', x0: 12, z0: 20, x1: 18, z1: 26, y: 4, h: 3.2, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'stB', x0: 18, z0: 30, x1: 22, z1: 36, y: 0, h: 7.2, floor: 'concrete', wall: 'tile_station', ceil: 'ceiling_dark' },
          { id: 'platB', x0: 0, z0: 36, x1: 24, z1: 48, y: -1.2, h: 6.2, floor: 'rail', wall: 'tile_station', ceil: 'ceiling_dark' },
          { id: 'tunBW', x0: -30, z0: 43, x1: 0, z1: 48, y: -1.2, h: 4.5, floor: 'rail', wall: 'tunnel', ceil: 'tunnel' },
          { id: 'c1', x0: 24, z0: 36.5, x1: 40, z1: 39.5, y: 0, h: 3, floor: 'linoleum', wall: 'tile_station', ceil: 'ceiling_panel' },
          { id: 'svc', x0: 30, z0: 33, x1: 33, z1: 36.5, y: 0, h: 3, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'ctrl', x0: 40, z0: 34, x1: 48, z1: 42, y: 0, h: 3.2, floor: 'linoleum', wall: 'plaster_green', ceil: 'ceiling_panel' },
          { id: 'stC', x0: 34, z0: 39.5, x1: 37, z1: 44, y: -4, h: 7, floor: 'concrete', wall: 'tile_station', ceil: 'ceiling_dark' },
          { id: 'staff', x0: 24, z0: 38, x1: 30, z1: 44, y: -4, h: 3, floor: 'linoleum', wall: 'plaster_green', ceil: 'ceiling_panel' },
          { id: 'side', x0: 40, z0: 38, x1: 46, z1: 44, y: -4, h: 3, floor: 'concrete_dark', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'platC', x0: 20, z0: 44, x1: 56, z1: 56, y: -5.2, h: 6, floor: 'rail', wall: 'tile_station', ceil: 'ceiling_dark' },
          { id: 'gatecor', x0: 56, z0: 45, x1: 64, z1: 48, y: -4, h: 3, floor: 'concrete_dark', wall: 'tunnel', ceil: 'ceiling_dark' },
          { id: 'tunCW', x0: 0, z0: 51, x1: 20, z1: 56, y: -5.2, h: 4.5, floor: 'rail', wall: 'tunnel', ceil: 'tunnel' },
          { id: 'tunCE', x0: 56, z0: 51, x1: 84, z1: 56, y: -5.2, h: 4.5, floor: 'rail', wall: 'tunnel', ceil: 'tunnel' },
          { id: 'maint', x0: 84, z0: 44, x1: 104, z1: 62, y: -5.2, h: 5.5, floor: 'rail', wall: 'tunnel', ceil: 'tunnel' },
          { id: 'tunL', x0: 88, z0: 36, x1: 92, z1: 44, y: -5.2, h: 3.4, floor: 'concrete_dark', wall: 'tunnel', ceil: 'tunnel' },
          { id: 'aband', x0: 85, z0: 29, x1: 95, z1: 36, y: -5.2, h: 3.4, floor: 'concrete_dark', wall: 'tile_old', ceil: 'ceiling_dark' }
        ],
        gaps: [
          { x: 0, z: -4.5, w: 5 }, { x: 40, z: -4.5, w: 5 }, { x: 32, z: 12, w: 4 }, { x: 20, z: 16, w: 4 }, { x: 20, z: 30, w: 4 },
          { x: 0, z: 45.5, w: 5 }, { x: 35.5, z: 39.5, w: 3 }, { x: 20, z: 53.5, w: 5 }, { x: 56, z: 53.5, w: 5 }, { x: 84, z: 53.5, w: 5 }, { x: 90, z: 44, w: 4 }
        ],
        doors: [
          { x: 32, z: 6, w: 4, y: 0, h: 3.2 },
          { x: 8, z: 6, w: 1.1, door: { id: 'wc_door', mat: 'door_metal' } },
          { x: 20, z: 36, w: 4, y: 0, h: 3 },
          { x: 24, z: 38, w: 3, y: 0, h: 2.6 },
          { x: 31.5, z: 36.5, w: 1.0, door: { id: 'svc_door', mat: 'door_metal', swing: -1 } },
          { x: 40, z: 38, w: 1.2, door: { id: 'door_code', mat: 'door_metal', locked: true, noPush: false, lockMsg: 'Кодовый замок. Кода я не знаю.' } },
          { x: 35.5, z: 44, w: 3, y: -4, h: 2.6 },
          { x: 27, z: 44, w: 1.1, y: -4, door: { id: 'door_staff', mat: 'door_metal', swing: -1 } },
          { x: 43, z: 44, w: 1.1, y: -4, door: { id: 'door_side', mat: 'door_old', swing: -1 } },
          { x: 44, z: 14, w: 3, y: 4, h: 2.6, door: { id: 'gate_exit', mat: 'door_metal', locked: true, lockMsg: 'Выход на улицу перекрыт решёткой. Алекса наверху нет.', slide: true } },
          { x: 39, z: 16, w: 1, y: 4, door: { id: 'booth_door', mat: 'door_metal', swing: 1 } },
          { x: 90, z: 36, w: 1.4, y: -5.2, door: { id: 'door_aband', mat: 'door_old', swing: -1 } }
        ],
        windows: [
          { x: 18, z: 23, w: 3, y0: 0.8, y1: 2.4, bars: true },
          { x: 56, z: 46.5, w: 3, y: -4, y0: 0, y1: 2.6, bars: true },
          { x: 37.5, z: 16, w: 1.6, y0: 0.9, y1: 2.0 }
        ]
      });
      platform(B, 0, 40, -2, 6, -1.2, 1);
      platform(B, 0, 24, 43, 36, -1.2, -1);
      platform(B, 20, 56, 51, 44, -5.2, -1);
      B.box(84, -5.2, 44, 104, -4, 50.6, { top: 'concrete', side: 'concrete_dark' });
      B.box(84, -5.2, 50.6, 104, -4, 51, { top: 'platform_edge', side: 'concrete_dark' });
      B.stairs(30, 6.4, 34, 11.8, 0, 4, 's', 'concrete');
      B.stairs(18, 30.2, 22, 35.8, 0, 4, 'n', 'concrete');
      B.stairs(34, 39.6, 37, 43.9, -4, 0, 'n', 'concrete');
      columns(B, 4, 36, 2.2, 0, 5, 8);
      columns(B, 4, 20, 40, 0, 5, 8);
      columns(B, 24, 52, 47.4, -4, 0.8, 7);
      for (let x = 6; x < 40; x += 8) B.light(x, 4.6, 1.5, FL, 10, { i: 1.1 });
      for (let x = 4; x < 24; x += 8) B.light(x, 4.6, 40, FL, 9, { i: 1.0 });
      for (let x = 24; x < 56; x += 8) B.light(x, 0.6, 47.5, FL, 9, { i: 1.0 });
      B.light(8, 2.7, 9, [0.9, 1, 0.9], 6, { i: 0.7 });
      B.light(32, 7.5, 9, FL, 7);
      for (let x = 22; x < 44; x += 7) B.light(x, 7, 14, FL, 7, { i: 0.9 });
      B.light(20, 7, 22, FL, 6); B.light(20, 7, 28, FL, 6);
      B.light(15, 6.8, 23, [1, 0.6, 0.4], 5, { i: 0.7 });
      B.light(20, 6.5, 33, FL, 7);
      B.light(28, 2.7, 38, FL, 6); B.light(36, 2.7, 38, FL, 6);
      B.light(31.5, 2.6, 34.5, [1, 0.8, 0.5], 4, { i: 0.7 });
      B.light(44, 2.9, 36, [0.9, 1, 1], 7); B.light(44, 2.9, 40.5, [0.9, 1, 1], 6);
      B.light(35.5, 2.5, 42, FL, 6);
      B.light(27, -1.3, 41, [1, 0.9, 0.7], 6);
      B.light(43, -1.3, 41, [0.6, 0.5, 0.4], 3.5, { i: 0.6 });
      B.light(39, 7, 18, [1, 0.9, 0.7], 5);
      for (let x = 60; x < 84; x += 9) B.light(x, -1.2, 51.6, [1, 0.8, 0.5], 6, { i: 0.8 });
      for (let x = 6; x < 20; x += 9) B.light(x, -1.2, 51.6, [1, 0.8, 0.5], 6, { i: 0.7 });
      B.light(88, -0.2, 50, [1, 0.8, 0.55], 10); B.light(100, -0.2, 50, [1, 0.8, 0.55], 10); B.light(94, -0.2, 58, [1, 0.6, 0.4], 9);
      B.light(90, -2.2, 40, [1, 0.7, 0.45], 5, { i: 0.8 });
      B.light(90, -2.2, 32, [0.7, 0.8, 1], 6, { i: 0.7 });
      for (let x = -24; x < 0; x += 10) B.light(x, 2.8, -4.5, [1, 0.8, 0.5], 5, { i: 0.6 });
      for (let x = 46; x < 70; x += 10) B.light(x, 2.8, -4.5, [1, 0.8, 0.5], 5, { i: 0.6 });
      for (let x = 6; x < 38; x += 10) B.decal(x, 2.4, 5.88, 'nz', 3.6, 0.8, 'roscoe');
      for (let x = 4; x < 24; x += 10) B.decal(x, 2.4, 36.12, 'pz', 3.2, 0.7, 'roscoe');
      for (let x = 26; x < 56; x += 10) B.decal(x, -1.6, 44.12, 'pz', 3.2, 0.7, 'roscoe');
      B.decal(14, 1.6, 5.88, 'nz', 1.1, 1.55, 'poster_bat');
      B.decal(22, 1.6, 5.88, 'nz', 1.1, 1.55, 'poster_address');
      B.decal(38, 1.6, 5.88, 'nz', 1.1, 1.55, 'poster_subway');
      B.decal(26, 5.6, 15.88, 'nz', 1.1, 1.55, 'poster_lords');
      B.decal(11, 1.8, 36.12, 'pz', 1.1, 1.55, 'poster_bat');
      B.decal(8, 3.1, 5.88, 'nz', 1.4, 0.35, 'sign:ТУАЛЕТ');
      B.decal(32, 3.4, 5.88, 'nz', 2.6, 0.5, 'sign:ВЫХОД В ГОРОД ↑');
      B.decal(27, -1.4, 44.12, 'pz', 2, 0.45, 'signr:ТОЛЬКО ДЛЯ ПЕРСОНАЛА');
      B.decal(39.88, 2.5, 38, 'nx', 1.8, 0.4, 'signr:ДИСПЕТЧЕРСКАЯ');
      B.decal(16, 2.2, 35.3, 'pz', 2.4, 0.9, 'graffiti1');
      B.decal(52, -2.8, 44.12, 'pz', 2.4, 0.9, 'graffiti3');
      B.decal(9, 0.01, 7.4, 'py', 2.4, 0.5, 'blood_trail', { rot: 0.3 });
      B.decal(8.2, 0.01, 4.2, 'py', 1.8, 0.4, 'blood_trail', { rot: -1.3 });
      B.decal(10.5, 1.2, 11.88, 'nz', 1, 0.9, 'blood_wall');
      B.decal(46.5, 5.2, 12.12, 'pz', 3, 0.5, 'stripes_warn');
      B.decal(90, -3.6, 36.12, 'pz', 1.4, 0.35, 'sign:1941');
      B.decor('bench', 10, 0, 4.6, 0);
      B.decor('bench', 26, 0, 4.6, 0);
      B.decor('trash', 18, 0, 5.3, 0);
      B.decor('trash', 34.5, 0, 4.8, 0);
      B.decor('bench', 8, 0, 37.2, Math.PI);
      B.decor('trash', 15, 0, 36.6, 0);
      B.decor('bench', 30, -4, 44.9, Math.PI);
      B.decor('bench', 45, -4, 44.9, Math.PI);
      B.decor('turnstile', 26, 4, 14, 0); B.decor('turnstile', 27.5, 4, 14, 0); B.decor('turnstile', 29, 4, 14, 0);
      B.decor('console', 44, 0, 41.3, Math.PI);
      B.decor('desk', 46.8, 0, 35, -Math.PI / 2);
      B.decor('chair', 46, 0, 35, -Math.PI / 2);
      B.decor('lockers', 47.6, 0, 38.5, -Math.PI / 2);
      B.decor('desk', 26, -4, 43.3, Math.PI);
      B.decor('chair', 26, -4, 42.5, 0);
      B.decor('shelf', 29.6, -4, 40, -Math.PI / 2);
      B.decor('lockers', 45.6, -4, 41, -Math.PI / 2);
      B.decor('pallet', 41.2, -4, 39, 0.3);
      B.decor('shelf', 32.7, 0, 34.5, -Math.PI / 2, { scale: 0.9, seed: 4 });
      B.decor('desk', 40, 4, 19.2, Math.PI);
      B.decor('pallet', 88, -4, 46, 0.2);
      B.decor('pallet', 97, -4, 47.2, -0.3);
      B.decor('barrel', 101.5, -4, 45.5, 0, { color: '#8a3a1a' });
      B.decor('barrel', 102.4, -4, 46.3, 0, { color: '#3a5a2a' });
      B.decor('pipes', 86, -1.6, 58, Math.PI / 2, { scale: 1.2 });
      B.box(92, -5.2, 57, 96, -3.8, 60, 'crate');
      B.box(99, -5.2, 58, 102, -2.9, 61, 'crate');
      B.decor('rubble', 90.5, -5.2, 39, 0.4);
      B.group('barr', () => {
        B.box(78, -5.2, 51.2, 79.2, -3.6, 55.8, 'crate');
        B.box(79.2, -5.2, 52, 80.4, -2.8, 55, 'crate');
        B.box(77.6, -3.6, 52.4, 78.6, -2.6, 54.4, 'rust');
        B.decor('barrel', 80.8, -5.2, 52.2, 0);
        B.decor('pallet', 80.8, -5.2, 54.6, 0.4);
      });
      B.zone(-30, -6, -8, 110, 10, 64, { outdoor: false });
    },
    props: [
      { kind: 'mover', id: 'trainA', model: 'train', parts: [[-15.2, -1, -1.4, -0.2, 2.8, 1.4], [0.2, -1, -1.4, 15.2, 2.8, 1.4]], origin: [20, 0, -4.6], path: [[20, 0, -4.6], [150, 0, -4.6]], maxSpeed: 14, accel: 2.2, crush: false, noBrake: true },
      { kind: 'mover', id: 'trainB', model: 'train', parts: [[-15.2, -1, -1.4, -0.2, 2.8, 1.4], [0.2, -1, -1.4, 15.2, 2.8, 1.4]], origin: [14, 0, 45.6], path: [[14, 0, 45.6], [-120, 0, 45.6]], maxSpeed: 12, accel: 1.8, crush: false, noBrake: true },
      { kind: 'mover', id: 'trainC', model: 'subwaycar', parts: carParts, origin: [38, -4, 53.5], path: [[38, -4, 53.5], [88, -4, 53.5]], maxSpeed: 11, accel: 2.4, sound: 'moverstart' },
      { kind: 'button', id: 'lever', pos: [45.1, -2.9, 53.5], yaw: -Math.PI / 2, label: 'Рычаг хода', once: true, locked: true, lockMsg: 'Рычаг не двигается. На путях нет тока.', color: 'green' },
      { kind: 'button', id: 'power', pos: [44, 1.25, 41.7], yaw: Math.PI, label: 'Включить питание путей', once: true },
      { kind: 'keypad', id: 'keypad', pos: [39.86, 1.35, 37.05], yaw: Math.PI / 2, label: 'Кодовый замок', needFlag: 'has:code', lockMsg: 'Нужен код. Его знает кто-то из персонала.' },
      { kind: 'locker', id: 'wc_lock1', pos: [11.6, 0, 7.4], yaw: -Math.PI / 2, label: 'Открыть шкафчик' },
      { kind: 'locker', id: 'wc_lock2', pos: [11.6, 0, 8.4], yaw: -Math.PI / 2, label: 'Открыть шкафчик' },
      { kind: 'locker', id: 'side_lock', pos: [40.4, -4, 42.7], yaw: Math.PI / 2, label: 'Открыть шкафчик' },
      { kind: 'tv', id: 'tv_staff', pos: [25.2, -4 + 0.78, 43.3], yaw: Math.PI, show: 'batboy', on: true },
      { kind: 'tv', id: 'tv_booth', pos: [41.2, 4 + 0.78, 19.3], yaw: Math.PI, show: 'news_blizzard', on: false },
      { kind: 'crate', id: 'crate_m1', pos: [100, -4, 48], size: [0.9, 0.9, 0.9] },
      { kind: 'crate', id: 'cr_platB', pos: [15.8, 0, 41.2], size: [1.2, 1.0, 0.9], hp: 90 },
      { kind: 'cyl', id: 'cyl_maint', pos: [98.5, -4, 46.2] },
      { kind: 'note', id: 'note_ctrl', pos: [46.8, 0.79, 35.2], title: 'Журнал дежурного', text: '23:10. Отключили питание на нижних путях, ремонт до утра.\n23:40. На платформе посторонние. Позвонил в транспортную полицию, никто не приехал.\n00:05. Они стучат в дверь.', noModel: false }
    ],
    items: [
      { kind: 'painkillers', amount: 1, pos: [11.6, 0.8, 7.4], in: 'wc_lock1' },
      { kind: 'ammo', ammo: '9mm', amount: 18, pos: [11.6, 0.8, 8.4], in: 'wc_lock2' },
      { kind: 'weapon', weapon: 'deagle', amount: 14, pos: [32.3, 1.0, 34.2] },
      { kind: 'painkillers', amount: 1, pos: [30.6, 0.02, 33.6] },
      { kind: 'ammo', ammo: '12g', amount: 8, pos: [40.4, -3.2, 42.7], in: 'side_lock' },
      { kind: 'ammo', ammo: '9mm', amount: 36, pos: [41.4, -2.9, 39.2] },
      { kind: 'painkillers', amount: 2, pos: [47.2, 0.8, 34.6] },
      { kind: 'painkillers', amount: 1, pos: [100, -3.9, 48], in: 'crate_m1' },
      { kind: 'ammo', ammo: '9mm', amount: 36, pos: [93, -3.75, 58] },
      { kind: 'ammo', ammo: '50ae', amount: 7, pos: [26, -3.2, 43.2] }
    ],
    chars: [
      { id: 'cop_dead', type: 'cop', pos: [9.4, 0, 10.8], yaw: 0.6, dead: true, deadPose: 'back', weapon: null, noDrop: true },
      mob('a1', 'platA', 30, 0, 3.5, Math.PI * 0.6, 'beretta', { hidden: false, mode: 'ambush' }),
      thug('a2', 'platA', 36, 0, 1.5, Math.PI * 0.55, 'beretta', { hidden: false, mode: 'ambush' }),
      mob('m1a', 'm1', 22.5, 4, 14.8, -Math.PI / 2, 'beretta', { hidden: false, mode: 'ambush', idleChat: false }),
      thug('m1b', 'm1', 20.5, 4, 13.2, -Math.PI * 0.7, 'beretta', { hidden: false, mode: 'ambush' }),
      mob('m1c', 'm1', 19.6, 4, 18.4, Math.PI, 'ingram', { hidden: false, mode: 'ambush' }),
      thug('bars1', 'bars', 14.5, 4, 23, -Math.PI / 2, 'ingram', { hidden: false, mode: 'ambush', stay: true, leash: 2 }),
      mob('b1', 'platB', 6, 0, 39.5, -Math.PI / 2, 'beretta', { hidden: false, mode: 'ambush' }),
      thug('b2', 'platB', 11, 0, 41.5, -Math.PI / 2, 'beretta', { hidden: false, mode: 'ambush' }),
      thug('sg1', 'c1', 36, 0, 38.2, Math.PI / 2, 'pump', { hidden: false, mode: 'ambush', leash: 8 }),
      mob('c1a', 'platC', 44, -4, 46.5, Math.PI / 2, 'beretta', { hidden: false, mode: 'ambush' }),
      thug('c1b', 'platC', 49, -4, 45.5, Math.PI / 2, 'pump', { hidden: false, mode: 'ambush' }),
      mob('c1c', 'platC', 26, -4, 47.5, -Math.PI / 2, 'beretta', { hidden: false, mode: 'ambush' }),
      thug('s1', 'side', 44.5, -4, 39.2, 0, 'beretta', { hidden: false, mode: 'ambush', leash: 5 }),
      thug('s2', 'side', 42.2, -4, 42.5, 0.4, 'sawed', { hidden: false, mode: 'ambush', leash: 5 }),
      mob('h1', 'hostage', 28.2, -4, 39.6, Math.PI * 0.95, 'beretta', { hidden: false, mode: 'hostage', hostage: 'worker', hostageTime: 2.6, threatLine: 'Стой, где стоишь! Ещё шаг, и старик получит пулю!', leash: 3 }),
      { id: 'worker', type: 'worker', pos: [28.2, -4, 40.3], yaw: Math.PI, weapon: null, mode: 'cower', civilian: true, speaker: 'worker', noDrop: true },
      mob('r1', 'ctrl', 42.5, 0, 36, -Math.PI / 2 + 0.3, 'beretta', { hidden: false, mode: 'ambush', leash: 6, deaf: true }),
      thug('r2', 'ctrl', 45.5, 0, 39.3, -Math.PI / 2, 'pump', { hidden: false, mode: 'ambush', leash: 6, deaf: true }),
      mob('r3', 'ctrl', 46.5, 0, 36.8, -Math.PI / 2 - 0.3, 'ingram', { hidden: false, mode: 'ambush', leash: 6, deaf: true }),
      mob('t1', 'maint', 90, -4, 47, Math.PI / 2, 'beretta', { gren: 1 }),
      thug('t2', 'maint', 96, -4, 45.3, Math.PI / 2, 'beretta'),
      thug('t3', 'maint', 93, -5.2, 59, Math.PI, 'pump'),
      mob('t4', 'maint', 101, -5.2, 56, Math.PI * 0.7, 'ingram', { drop: { kind: 'painkillers', amount: 1 } })
    ],
    triggers: [
      { id: 'wc', min: [4.5, 0, 6.5], max: [11.5, 3, 11.5] },
      { id: 'stairA', min: [30, 1, 7], max: [34, 5, 11.8] },
      { id: 'm1west', min: [18, 4, 12], max: [28, 7, 16] },
      { id: 'm2', min: [18, 4, 18], max: [22, 7, 26] },
      { id: 'platB', min: [0, 0, 36], max: [24, 4, 43] },
      { id: 'c1', min: [24, 0, 36.5], max: [30, 3, 39.5] },
      { id: 'keypadArea', min: [37, 0, 36.5], max: [40, 3, 39.5] },
      { id: 'platC', min: [20, -4, 44], max: [56, -1, 50] },
      { id: 'staffDoor', min: [25.5, -4, 44], max: [28.5, -1, 46] },
      { id: 'train', min: [31, -4.1, 52.2], max: [45, -1, 54.8] },
      { id: 'tunL', min: [88, -5.3, 38], max: [92, -2, 42] },
      { id: 'exit', min: [86, -5.3, 30], max: [94, -2, 35] }
    ],
    on: {
      start(g) {
        g.moverGo('trainA');
        g.later(9, 'hideA');
        g.dialog([
          ['max:thought', 'Поезд захлопнул двери у меня за спиной и ушёл в тоннель.'],
          ['max:thought', 'Алекс должен ждать где-то наверху. На платформе никого, только кровь на плитке.']
        ]);
        g.setThought('Найти Алекса. Он где-то на станции.');
      },
      hideA(g) { const t = g.prop('trainA'); t.hidden = true; t.moving = false; g.syncProp(t); },
      'enter:wc'(g) { g.think('Транспортный полицейский. Кто-то убил его быстро и даже не забрал пистолет.'); },
      'enter:stairA'(g) {
        if (g.flags.chat) return;
        g.flags.chat = true;
        g.dialog([
          ['Мафиози', 'Долго нам ещё тут торчать?'],
          ['Бандит', 'Пока Винни не позвонит. Не ной.'],
          ['Мафиози', 'У меня пальцы к стволу примёрзли. Кто вообще грабит банк в метель?'],
          ['Бандит', 'Тот, кто хочет, чтобы копы не приехали. Тихо. Слышал?']
        ], 'm1alert');
      },
      m1alert(g) { g.alert('m1'); },
      'enter:m2'(g) { g.think('За решёткой кто-то есть. Решётка держит меня, пули её не замечают.'); },
      'enter:platB'(g) {
        if (g.flags.trainB) return;
        g.flags.trainB = true;
        g.moverGo('trainB');
        g.later(12, 'hideB');
      },
      hideB(g) { const t = g.prop('trainB'); t.hidden = true; t.moving = false; g.syncProp(t); },
      'enter:keypadArea'(g) {
        if (g.flags.keypadSeen) return;
        g.flags.keypadSeen = true;
        g.think('Кодовый замок на двери диспетчерской. Кода я не знаю. Кто-нибудь из персонала должен знать.');
        g.setThought('Найти работника станции, который знает код от диспетчерской.');
      },
      'enter:platC'(g) { if (!g.flags.cAlert) { g.flags.cAlert = true; g.alert('platC'); } },
      'hostage:h1'(g) { g.think('Он держит старика на прицеле. Времени на раздумья нет.'); },
      'dead:h1'(g) {
        const w = g.char('worker');
        if (!w || w.state !== 'alive') return;
        w.ai.mode = 'idle';
        g.dialog([
          ['worker', 'Господи. Господи боже. Спасибо вам.'],
          ['worker', 'Я знаю код от диспетчерской. Они затем меня и держали. Пойдёмте, я открою.']
        ], 'workerGo');
      },
      workerGo(g) {
        g.charTo('worker', [39.2, 0, 37.6], { run: true, then: 'idle', face: -Math.PI / 2 });
        g.setThought('Идти за работником к диспетчерской.');
      },
      'arrive:worker'(g) {
        g.emit({ t: 'sfx', id: 'keypad', pos: [39.8, 1.3, 37.1] });
        g.say('worker', 'Четыре, семь, семь, один... Готово.');
        g.later(1.2, 'codeOpen');
      },
      codeOpen(g) {
        g.unlock('door_code');
        g.openDoor('door_code', 1);
        g.prop('keypad').used = true;
        g.later(0.5, 'workerShot');
      },
      workerShot(g) {
        const w = g.char('worker');
        if (w && w.state === 'alive') {
          g.emit({ t: 'shot', weapon: 'ingram', pos: [42, 1.4, 38], dir: [-1, 0, 0], owner: 'r3', npc: true });
          g.killChar(w, [-1, 0.1, 0], 'body', 'ingram', 'r3');
        }
        for (const id of ['r1', 'r2', 'r3']) { const c = g.char(id); if (c) c.ai.deaf = false; }
        g.alert('ctrl');
        g.think('Они ждали по ту сторону двери. Старик даже не успел отойти.');
      },
      'dead:worker'(g) {
        if (g.flags['has:code'] || g.prop('keypad').used) return;
        const w = g.char('worker');
        g.addItem({ id: 'codepaper', kind: 'flag', flag: 'code', name: 'Бумажка с кодом 4771', pos: [w.pos[0], w.pos[1] + 0.05, w.pos[2] + 0.4] });
        g.think('У него в нагрудном кармане бумажка. Четыре цифры, нацарапанные ручкой.');
      },
      'pick:codepaper'(g) { g.setThought('Код от диспетчерской у меня. Замок на двери у лестницы.'); },
      'use:keypad'(g) {
        g.unlock('door_code');
        g.openDoor('door_code', 1);
        for (const id of ['r1', 'r2', 'r3']) { const c = g.char(id); if (c) c.ai.deaf = false; }
        g.alert('ctrl');
      },
      'use:power'(g) {
        g.think('Я включил питание нижних путей. Внизу загудели рельсы.');
        g.prop('lever').locked = false;
        g.setThought('Поезд на нижней платформе. Рычаг хода в кабине.');
        g.checkpoint();
      },
      'enter:train'(g) {
        if (g.flags.trainSeen) return;
        g.flags.trainSeen = true;
        if (!g.prop('power').used) g.think('Поезд без машиниста и без питания. Может, в диспетчерской можно подать ток.');
        else g.think('Кабина в дальнем конце вагона.');
      },
      'use:lever'(g) {
        g.prop('lever').hidden = true;
        g.moverGo('trainC');
        g.later(0.1, 'trainWatch');
        g.think('Держитесь за поручни. Следующая станция: завал.');
      },
      trainWatch(g) {
        const t = g.prop('trainC');
        if (!g.flags.smashed && t.origin[0] + 7.5 > 77.4) {
          g.flags.smashed = true;
          g.show('barr', false);
          g.explode([79, -3.6, 53.5], 3, 0, 'world');
          g.emit({ t: 'debris', pos: [79, -3.6, 53.5], size: [2, 2, 2], mat: 'wood' });
          t.speed *= 0.45;
        }
        if (t.moving) g.later(0.1, 'trainWatch');
      },
      'mover:trainC'(g) {
        g.wake('maint', 'alert');
        g.alert('maint');
        g.think('Приехали. И меня уже встречают.');
        g.setThought('Выбраться из тоннеля. Левое ответвление.');
      },
      'kill:maint'(g) { g.think('Слева тоннель. Дальше старая часть станции, закрытая ещё до войны.'); g.checkpoint(); },
      'enter:tunL'(g) { g.setThought('Старая часть станции за дверью.'); },
      'enter:exit'(g) { g.finish(); }
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
