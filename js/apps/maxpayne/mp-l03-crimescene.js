(function (M) {
  'use strict';
  const FL = [0.85, 0.95, 0.9];
  const rob = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'robber', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});

  M.defineLevel({
    id: 'crimescene',
    title: 'Прямой репортаж с места преступления',
    titleEn: 'Live from the Crime Scene',
    part: 1,
    chapter: 2,
    world: { ambient: [0.06, 0.06, 0.055], fog: { color: [0.02, 0.022, 0.02], near: 14, far: 55 }, weather: 'none', sky: 'none' },
    start: { pos: [3, 0, 5], yaw: -Math.PI / 2 },
    loadout: { weapons: ['beretta', 'beretta2', 'deagle'], ammo: { '9mm': 90, '50ae': 14 }, painkillers: 2 },
    music: 'station',
    intro: 'crimescene_in',
    outro: 'crimescene_out',
    killY: -30,
    thought: 'Закрытая часть станции. Грабители где-то здесь.',
    build(B) {
      B.plan({
        y: 0, h: 3, outer: 'tunnel',
        rooms: [
          { id: 'old', x0: 0, z0: 0, x1: 30, z1: 10, y: 0, h: 4.5, floor: 'tile_old', wall: 'tile_old', ceil: 'ceiling_dark' },
          { id: 'oc', x0: 30, z0: 3, x1: 40, z1: 7, y: 0, h: 3, floor: 'concrete_dark', wall: 'plaster_dirty', ceil: 'ceiling_dark', noFloor: true },
          { id: 'chan', x0: 30, z0: 0, x1: 44, z1: 10, y: -4, h: 3.75, floor: 'concrete_dark', wall: 'tunnel', ceil: 'tunnel', ceilHoles: [[30, 3, 40, 7]] },
          { id: 'low', x0: 44, z0: 2, x1: 62, z1: 10, y: -4, h: 3.5, floor: 'concrete_dark', wall: 'tunnel', ceil: 'tunnel' },
          { id: 'store', x0: 62, z0: -4, x1: 80, z1: 16, y: -4, h: 4.2, floor: 'concrete', wall: 'brick_dark', ceil: 'ceiling_dark' },
          { id: 'breach', x0: 80, z0: 4.5, x1: 84, z1: 7.5, y: -4, h: 2.6, floor: 'dirt', wall: 'dirt', ceil: 'dirt' },
          { id: 'v1', x0: 84, z0: -2, x1: 100, z1: 14, y: -4, h: 3.6, floor: 'marble', wall: 'marble_dark', ceil: 'ceiling_panel' },
          { id: 'v2', x0: 100, z0: 0, x1: 112, z1: 12, y: -4, h: 3.4, floor: 'marble', wall: 'deposit', ceil: 'ceiling_panel' },
          { id: 'det', x0: 102, z0: 12, x1: 110, z1: 16, y: -4, h: 3, floor: 'concrete', wall: 'plaster_green', ceil: 'ceiling_panel' },
          { id: 'st', x0: 66, z0: -12, x1: 70, z1: -4, y: -4, h: 7.5, floor: 'concrete', wall: 'tile_old', ceil: 'ceiling_dark' },
          { id: 'lobby', x0: 50, z0: -40, x1: 90, z1: -12, y: 0, h: 5, floor: 'tile_floor', wall: 'tile_station', ceil: 'ceiling_panel' },
          { id: 'tb', x0: 76, z0: -30, x1: 82, z1: -24, y: 0, h: 3, floor: 'linoleum', wall: 'plaster_green', ceil: 'ceiling_panel' },
          { id: 'exitst', x0: 66, z0: -48, x1: 74, z1: -40, y: 0, h: 6, floor: 'concrete', wall: 'tile_station', ceil: 'ceiling_dark' }
        ],
        gaps: [{ x: 68, z: -4, w: 4, y: -4, h: 4.2 }, { x: 44, z: 6, w: 4 }, { x: 62, z: 6, w: 4 }, { x: 80, z: 6, w: 3 }, { x: 84, z: 6, w: 3 }, { x: 68, z: -12, w: 4 }],
        doors: [
          { x: 30, z: 5, w: 1.4, y: 0, door: { id: 'rusty', mat: 'door_old', swing: 1 } },
          { x: 100, z: 6, w: 2.4, y: -4, h: 2.6, door: { id: 'vdoor', mat: 'vault', slide: true, locked: true, noPush: true, lockMsg: 'Дверь хранилища. Открывается с пульта.', speed: 0.5 } },
          { x: 106, z: 12, w: 1.1, y: -4, door: { id: 'det_door', mat: 'door_metal', swing: 1 } },
          { x: 79, z: -24, w: 1.0, y: 0, door: { id: 'tb_door', mat: 'door_metal', swing: 1, locked: true, lockMsg: 'Будка заперта изнутри.' } },
          { x: 70, z: -40, w: 3, y: 0, h: 2.8, door: { id: 'gate_out', mat: 'door_metal', slide: true, locked: true, noPush: true, lockMsg: 'Решётка на выход опущена. Кнопка должна быть в кассе.' } }
        ],
        windows: [{ x: 76, z: -27, w: 2.6, y0: 1.0, y1: 2.3 }]
      });
      B.box(30, -0.25, 3, 32, 0, 7, { top: 'concrete_dark', bottom: 'tunnel', side: 'trim' });
      B.box(36, -0.25, 3, 40, 0, 7, { top: 'concrete_dark', bottom: 'tunnel', side: 'trim' });
      B.group('cfloor', () => B.box(32, -0.25, 3, 36, 0, 7, { top: 'plank', bottom: 'tunnel', side: 'trim' }));
      B.box(0, -1.2, 7.5, 30, -0.001, 10, { top: 'rail', side: 'tile_old' });
      B.box(0, -1.2, 7.3, 30, 0, 7.5, { top: 'platform_edge', side: 'tile_old' });
      B.box(0, -1.2, 7.5, 30, -1.19, 10, 'clip', { vis: false });
      B.water(30, 0, 44, 10, -3.85);
      B.water(44, 2, 62, 10, -3.85);
      B.stairs(66, -11.8, 70, -4.2, -4, 0, 'n', 'concrete');
      B.group('rubble1', () => {
        B.box(38, -4, 0, 41, -2.2, 10, 'concrete_block');
        B.box(40, -2.2, 2, 42, -0.6, 8, 'rubble_c');
        B.decor('rubble', 39, -4, 3, 0.3, { solid: false });
        B.decor('rubble', 39.5, -4, 7, 1.3, { solid: false });
      }, true);
      B.group('blastwall', () => {
        B.box(66, -4, -4.15, 70, 0.2, -3.85, 'brick_dark');
      });
      B.decal(68, -2.6, -3.84, 'pz', 1.4, 0.35, 'signr:ВЗРЫВЧАТКА');
      B.decal(68, -3.4, -3.84, 'pz', 1.8, 0.9, 'stripes_warn');
      for (const [x, z, w, h] of [[66.5, 1.5, 1.8, 1.4], [73.5, 1, 1.4, 1.2], [70.5, 9, 2.2, 1.6], [76.5, 12, 1.6, 1.1], [64.8, 12.5, 1.2, 1.2], [77.8, 3, 1.2, 1.0]]) B.box(x - w / 2, -4, z - w / 2, x + w / 2, -4 + h, z + w / 2, 'crate');
      B.box(64, -4, -3.8, 65.4, -2.6, -2.6, 'crate');
      B.box(86, -4, 10.5, 88.5, -2.9, 11.5, 'marble_dark');
      B.box(92, -4, 1.2, 94, -2.8, 2.2, 'marble_dark');
      B.pillar(90, 4, 0.7, -4, -0.4, 'marble');
      B.pillar(90, 9, 0.7, -4, -0.4, 'marble');
      B.pillar(95, 4, 0.7, -4, -0.4, 'marble');
      B.pillar(95, 9, 0.7, -4, -0.4, 'marble');
      B.box(99.6, -4, 3.6, 100.4, -0.4, 4.8, 'vault');
      B.box(99.6, -4, 7.2, 100.4, -0.4, 8.4, 'vault');
      B.decor('console', 97.5, -4, 11.8, Math.PI / 2);
      B.decor('safe', 111.3, -4, 2, -Math.PI / 2);
      B.decor('safe', 111.3, -4, 10, -Math.PI / 2);
      B.decor('moneypile', 104, -4, 3.5, 0.3, { seed: 3 });
      B.decor('moneypile', 108, -4, 8, 1.1, { seed: 5 });
      B.decor('suitcase', 106, -4, 6.2, 0.4, { solid: false });
      B.decor('table', 106, -4, 14.5, 0);
      B.decor('shelf', 109.6, -4, 14, -Math.PI / 2, { scale: 0.8 });
      B.decor('bench', 6, 0, 1, 0);
      B.decor('bench', 18, 0, 1, 0, { scale: 0.9 });
      B.decor('trash', 12, 0, 0.6, 0);
      B.decor('rubble', 25, 0, 2.5, 0.8);
      B.decor('pallet', 58, -4, 8.6, 0.4);
      B.decor('pallet', 50, -4, 3.4, -0.3);
      B.decor('barrel', 55, -4, 9.2, 0, { color: '#6a3a1a' });
      B.decor('turnstile', 60, 0, -20, Math.PI / 2); B.decor('turnstile', 60, 0, -21.5, Math.PI / 2); B.decor('turnstile', 60, 0, -23, Math.PI / 2);
      B.decor('bench', 56, 0, -36, 0);
      B.decor('counter', 64, 0, -26.5, 0); B.decor('counter', 72.5, 0, -33, 0);
      B.pillar(59.5, -29.5, 0.8, 0, 5, 'marble'); B.pillar(80.5, -18.5, 0.8, 0, 5, 'marble');
      B.decor('bench', 86, 0, -34, -Math.PI / 2);
      B.decor('trash', 64, 0, -38.8, 0);
      B.decor('desk', 78.5, 0, -29.2, Math.PI);
      B.stairs(66, -47.8, 74, -40.2, 0, 4.5, 'n', 'concrete');
      for (let x = 4; x < 30; x += 8) B.light(x, 4.1, 5, [0.8, 0.85, 0.7], 8, { i: 0.7 });
      B.light(35, 2.6, 5, [0.8, 0.7, 0.5], 5, { i: 0.6 });
      B.light(36, -1.2, 5, [0.6, 0.8, 0.9], 8, { i: 0.7 });
      B.light(48, -1.4, 6, [1, 0.8, 0.5], 7); B.light(57, -1.4, 6, [1, 0.8, 0.5], 7);
      B.light(66, -0.4, 2, [1, 0.9, 0.7], 9, { i: 1.1 }); B.light(75, -0.4, 6, [1, 0.9, 0.7], 10, { i: 1.2 }); B.light(70, -0.4, 13, [1, 0.9, 0.7], 8);
      B.light(82, -1.8, 6, [1, 0.7, 0.4], 4, { i: 0.8 });
      B.light(88, -0.8, 2, [1, 0.95, 0.85], 9); B.light(96, -0.8, 7, [1, 0.95, 0.85], 9); B.light(88, -0.8, 12, [1, 0.95, 0.85], 8);
      B.light(106, -1, 6, [1, 0.9, 0.6], 9, { i: 1.1 });
      B.light(106, -1.4, 14, [0.9, 1, 0.9], 5);
      B.light(68, 2.8, -8, FL, 7);
      for (let x = 56; x < 90; x += 10) { B.light(x, 4.6, -18, FL, 11); B.light(x, 4.6, -32, FL, 11); }
      B.light(79, 2.7, -27, [1, 0.9, 0.7], 5);
      B.light(70, 5.4, -44, [0.7, 0.75, 0.9], 8);
      B.decal(10, 2.8, 0.12, 'pz', 3.2, 0.7, 'signw:ПЛОЩАДЬ РОСКО 1941');
      B.decal(22, 1.6, 0.12, 'pz', 1.1, 1.55, 'poster_lords');
      B.decal(29.88, 2.9, 5, 'nx', 1.8, 0.4, 'signr:ПРОХОДА НЕТ');
      B.decal(83.9, -2.2, 3, 'nx', 1.2, 1.2, 'graffiti3');
      B.decal(86, -1.6, -1.88, 'pz', 3, 0.6, 'sign:БАНК АЭСИР · ХРАНИЛИЩЕ');
      B.decal(70, 3.6, -39.88, 'pz', 3, 0.6, 'exit');
      B.decal(56, 2.6, -12.12, 'nz', 3.2, 0.7, 'roscoe');
      B.decal(84, 2.6, -12.12, 'nz', 3.2, 0.7, 'roscoe');
      B.decal(50.12, 1.6, -26, 'px', 1.1, 1.55, 'poster_address');
      B.decal(89.88, 1.6, -20, 'nx', 1.1, 1.55, 'poster_bat');
      B.decal(34, -3.99, 5, 'py', 3, 3, 'blood1');
      B.zone(0, -6, -50, 115, 8, 20, { outdoor: false });
    },
    props: [
      { kind: 'button', id: 'vaultBtn', pos: [97.5, -2.75, 11.4], yaw: Math.PI / 2, label: 'Открыть хранилище', once: true },
      { kind: 'button', id: 'detonate', pos: [76.2, -2.8, 12.6], yaw: Math.PI, label: 'Подорвать заряд', once: true, locked: true, lockMsg: 'Провода от взрывчатки тянутся сюда. Нужен детонатор.', color: 'green' },
      { kind: 'phone', id: 'vphone', pos: [85.4, -2.6, 13.8], yaw: Math.PI },
      { kind: 'button', id: 'gateBtn', pos: [81.4, 1.3, -28.5], yaw: -Math.PI / 2, label: 'Поднять решётку', once: true },
      { kind: 'tv', id: 'tv_lobby', pos: [77.8, 0.78, -29.2], yaw: Math.PI, show: 'news_roscoe', on: true },
      { kind: 'crate', id: 'cr1', pos: [8, 0, 8.6], size: [0.8, 0.8, 0.8] },
      { kind: 'crate', id: 'cr2', pos: [76, -4, -2.5], size: [0.8, 0.8, 0.8] },
      { kind: 'cyl', id: 'cylv', pos: [98.6, -4, -1.2] },
      { kind: 'cyl', id: 'cyls', pos: [79.2, -4, 15.2] },
      { kind: 'note', id: 'plan_note', pos: [106.2, -3.2, 14.4], title: 'Схема, нацарапанная на обороте накладной', text: 'Стенку у склада не трогать до сигнала.\nЗаряд на лестницу к вестибюлю.\nДетонатор здесь, у Сэла.\nКогда бумаги Аэсира будут в сумках, рвём и уходим через вестибюль. Лупино ждёт звонка.' }
    ],
    items: [
      { kind: 'painkillers', amount: 1, pos: [8, 0.02, 8.6], in: 'cr1' },
      { kind: 'ammo', ammo: '9mm', amount: 36, pos: [16, 0, 8.8] },
      { kind: 'painkillers', amount: 1, pos: [60.5, -4, 9.2] },
      { kind: 'ammo', ammo: '12g', amount: 8, pos: [76, -3.98, -2.5], in: 'cr2' },
      { kind: 'painkillers', amount: 2, pos: [88, -2.8, 11] },
      { id: 'detonator', kind: 'detonator', name: 'Детонатор', pos: [106, -3.2, 14.6] },
      { kind: 'ammo', ammo: '50ae', amount: 7, pos: [103, -4, 14.4] },
      { kind: 'painkillers', amount: 1, pos: [78, 0.8, -29.4] },
      { kind: 'ammo', ammo: '9mm', amount: 36, pos: [81, 0, -25] }
    ],
    chars: [
      rob('o1', 'old', 12, 0, 3, Math.PI / 2, 'beretta'),
      rob('o2', 'old', 16, 0, 6.5, Math.PI / 2, 'beretta'),
      rob('runner', 'runner', 23, 0, 5, Math.PI / 2, 'beretta', { mode: 'flee', route: [{ p: [38.5, 0, 5], ev: 'runnerGone' }], fleeNear: 22, invuln: true, noDrop: true }),
      rob('l1', 'low', 52, -4, 4, Math.PI / 2, 'beretta'),
      rob('l2', 'low', 57, -4, 8.5, Math.PI / 2, 'ingram'),
      rob('l3', 'low', 60, -4, 5, Math.PI / 2, 'beretta', { gren: 1 }),
      rob('a1', 'store', 72, -4, 4.2, Math.PI * 0.75, 'pump', { mode: 'hold', holdFire: true, deaf: true, blind: true }),
      rob('a2', 'argue', 73.5, -4, 5.7, -Math.PI * 0.25, 'beretta', { mode: 'hold', holdFire: true, deaf: true, blind: true, noDrop: false }),
      rob('a3', 'store', 77, -4, 10, Math.PI / 2, 'beretta', { mode: 'ambush' }),
      rob('a4', 'store', 66, -4, 13.5, Math.PI, 'ingram', { mode: 'ambush' }),
      rob('v1a', 'v1', 88, -4, 3, Math.PI / 2, 'beretta'),
      rob('v1b', 'v1', 92, -4, 8, Math.PI / 2, 'pump'),
      rob('v1c', 'v1', 96, -4, 1, Math.PI / 2, 'beretta', { gren: 1 }),
      rob('v1d', 'v1', 97, -4, 12.5, Math.PI / 2, 'ingram'),
      rob('v2a', 'v2', 105, -4, 2.5, Math.PI / 2, 'ingram', { hidden: true }),
      rob('v2b', 'v2', 109, -4, 8.5, Math.PI / 2, 'pump', { hidden: true }),
      { id: 'alex', type: 'alex', pos: [74, 0, -27], yaw: 0, weapon: null, mode: 'prop', civilian: true, invuln: true, noHit: true, hidden: true, speaker: 'alex', noDrop: true },
      rob('lb1', 'lobby', 84, 0, -36, Math.PI * 0.75, 'beretta', { hidden: true, hunter: true }),
      rob('lb2', 'lobby', 55, 0, -34, -Math.PI * 0.75, 'ingram', { hidden: true, hunter: true }),
      rob('lb3', 'lobby', 70, 0, -38, 0, 'pump', { hidden: true, hunter: true })
    ],
    triggers: [
      { id: 'old', min: [1, 0, 0], max: [8, 3, 10] },
      { id: 'collapse', min: [32.2, 0, 3], max: [35.8, 2.5, 7] },
      { id: 'chan', min: [30, -4.2, 0], max: [44, -1, 10] },
      { id: 'low', min: [46, -4.2, 2], max: [52, -1, 10] },
      { id: 'store', min: [62.5, -4.2, 3], max: [66, -1, 9] },
      { id: 'breach', min: [80, -4.2, 4.5], max: [84, -1, 7.5] },
      { id: 'v2', min: [100.5, -4.2, 4.5], max: [103, -1, 7.5] },
      { id: 'stairsUp', min: [66, -3, -11], max: [70, 1, -6] },
      { id: 'lobbyIn', min: [62, 0, -16], max: [74, 3, -12] },
      { id: 'exit', min: [66, 3, -48], max: [74, 6, -44] }
    ],
    on: {
      start(g) {
        g.dialog([
          ['max:thought', 'Закрытая часть станции. Сюда не спускались лет пятьдесят.'],
          ['max:thought', 'Кто-то грабит банк через метро. И где-то здесь должен быть Алекс.']
        ]);
        g.setThought('Пройти через заброшенную часть станции.');
      },
      'enter:old'(g) { g.alert('old'); g.alert('runner'); },
      runnerGone(g) { const c = g.char('runner'); c.state = 'hidden'; c.pos = [38.5, -30, 5]; },
      'enter:collapse'(g) {
        g.show('cfloor', false);
        g.emit({ t: 'debris', pos: [34, -0.2, 5], size: [4, 0.3, 4], mat: 'wood' });
        g.emit({ t: 'sfx', id: 'thud', pos: [34, 0, 5] });
        g.think('Пол ушёл из-под ног.');
      },
      'enter:chan'(g) {
        if (g.flags.chan) return;
        g.flags.chan = true;
        g.dialog([['max:thought', 'Вода по щиколотку, ледяная. Сверху не выбраться, значит, вперёд.']]);
        g.setThought('Идти по затопленному тоннелю.');
      },
      'enter:low'(g) {
        g.alert('low');
        g.later(1.6, 'dynamite');
      },
      dynamite(g) {
        g.explode([37, -3, 5], 5, 60, 'world');
        g.show('rubble1', true);
        g.think('Где-то за спиной рвануло. Свод осел, и дороги назад больше не было.');
      },
      'enter:store'(g) {
        if (g.flags.argue) return;
        g.flags.argue = true;
        g.dialog([
          ['Грабитель', 'Ты сказал, бумаги в третьем ряду. Их там нет, Сэл.'],
          ['Грабитель', 'Значит, в четвёртом. Лупино сказал брать всё, на чём написано «Аэсир».'],
          ['Грабитель', 'Лупино много чего говорит. Я половину доли хочу сейчас.'],
          ['Грабитель', 'Сейчас так сейчас.']
        ], 'argueShot');
      },
      argueShot(g) {
        const a1 = g.char('a1'), a2 = g.char('a2');
        if (a1.state === 'alive' && a2.state === 'alive') {
          g.emit({ t: 'shot', weapon: 'pump', pos: [a1.pos[0], -2.6, a1.pos[2]], dir: M.norm(M.sub(a2.pos, a1.pos)), owner: 'a1', npc: true });
          g.killChar(a2, M.norm(M.sub(a2.pos, a1.pos)), 'body', 'pump', 'a1');
        }
        for (const id of ['a1', 'a3', 'a4']) { const c = g.char(id); if (c) { c.holdFire = false; c.deaf = false; c.blind = false; c.ai.deaf = false; } }
        const a = g.char('a1'); if (a) { a.ai.mode = 'combat'; a.blind = false; }
        g.alert('store');
        g.think('Сэл получил свою долю. Всю сразу.');
      },
      'enter:breach'(g) { g.alert('v1'); g.setThought('Банковское хранилище за проломом.'); },
      'kill:v1'(g) { g.later(2, 'ringPhone'); g.checkpoint(); },
      ringPhone(g) { g.ring('vphone'); g.think('Телефон на столе охранника. Звонит, будто кто-то знает, что я здесь.'); },
      'phone:vphone'(g) {
        g.dialog([
          ['bravura', 'С вами говорит заместитель начальника полиции Джим Бравура. Станция оцеплена.'],
          ['bravura', 'Кто бы вы ни были, бросайте оружие и выходите через вестибюль с поднятыми руками.'],
          ['max', 'Вестибюль, говорите. Я как раз туда собирался. Не закрывайте дверь.'],
          ['bravura', 'Послушай меня, умник...'],
          ['max:thought', 'Я повесил трубку. Разговаривать с Бравурой было всё равно что спорить со светофором.']
        ], 'afterCall');
        g.flags.called = true;
      },
      afterCall(g) { g.setThought('Открыть хранилище с пульта у стены.'); },
      'use:vaultBtn'(g) {
        g.unlock('vdoor');
        g.openDoor('vdoor', 1);
        g.later(1.5, 'v2wake');
      },
      v2wake(g) { g.wake('v2', 'alert'); },
      'pick:detonator'(g) {
        g.prop('detonate').locked = false;
        g.dialog([['max:thought', 'Детонатор. Провода от взрывчатки тянутся к стене у склада. Надо отойти подальше.']]);
        g.setThought('Вернуться на склад и подорвать стену из-за ящиков.');
      },
      'use:detonate'(g) {
        g.explode([68, -2.4, -3.2], 6.5, 150, 'world');
        g.show('blastwall', false);
        g.emit({ t: 'debris', pos: [68, -2, -4], size: [4, 4, 1], mat: 'stone' });
        g.think('Стена сложилась, как карточный домик. Лестница вела наверх, в вестибюль.');
        g.setThought('Подняться в вестибюль станции.');
        g.checkpoint();
      },
      'enter:lobbyIn'(g) {
        if (g.flags.alexScene) return;
        g.flags.alexScene = true;
        const a = g.char('alex');
        a.state = 'alive';
        a.pos = [72, 0, -24];
        a.yaw = 0;
        g.charTo('alex', [68.5, 0, -17.5], { run: false, then: 'prop' });
        g.say('alex', 'Макс! Макс, сюда!', 2.4);
      },
      'arrive:alex'(g) {
        g.dialog([
          ['alex', 'Слава богу. Я думал, тебя уже вынесли отсюда в мешке.'],
          ['max', 'Что тут творится, Алекс?'],
          ['alex', 'Люди Лупино взяли хранилище «Аэсира». Это всё Валькирия, Макс. Би-Би знает, я ему звонил...'],
          ['alex', 'Слушай, это больше, чем Лупино. Намного больше...']
        ], 'alexShot');
      },
      alexShot(g) {
        const a = g.char('alex');
        g.emit({ t: 'shot', weapon: 'deagle', pos: [58, 3.2, -38], dir: M.norm(M.sub([a.pos[0], 1.4, a.pos[2]], [58, 3.2, -38])), owner: 'sniper', npc: true });
        a.invuln = false;
        g.killChar(a, M.norm(M.sub(a.pos, [58, 0, -38])), 'body', 'deagle', 'sniper');
        g.later(1.3, 'alexNovel');
      },
      alexNovel(g) { g.novel('alex_dies'); g.later(0.2, 'lobbyFight'); },
      lobbyFight(g) {
        g.wake('lobby', 'alert');
        g.emit({ t: 'siren', pos: [70, 4, -50] });
        g.music('tension');
        g.setThought('Уходить. Копы решат, что Алекса убил я. Кнопка решётки в кассе.');
        g.unlock('tb_door');
      },
      'use:gateBtn'(g) {
        g.unlock('gate_out');
        g.openDoor('gate_out', 1);
        g.think('Решётка поползла вверх. На улице выли сирены.');
      },
      'enter:exit'(g) { g.finish(); }
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
