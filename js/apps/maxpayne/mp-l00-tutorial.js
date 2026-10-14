(function (M) {
  'use strict';
  const FL = [0.85, 0.92, 1.0];
  const dummy = (id, group, x, z, o) => Object.assign({ id, type: 'dummy', group, pos: [x, 0, z], yaw: Math.PI / 2, weapon: null, hidden: false, noDrop: true }, o || {});

  M.defineLevel({
    id: 'tutorial',
    title: 'Обучение',
    part: 0,
    chapter: 0,
    world: { ambient: [0.1, 0.1, 0.11], fog: { color: [0.03, 0.03, 0.035], near: 20, far: 80 }, weather: 'none', sky: 'none' },
    start: { pos: [2, 0, 3], yaw: -Math.PI / 2 },
    loadout: { reset: true, weapons: [], ammo: {}, painkillers: 0 },
    music: 'tutorial',
    thought: 'Подвал нью-йоркского отделения УБН. Би-Би гоняет меня по полосе препятствий.',
    build(B) {
      B.plan({
        y: 0, h: 3, outer: 'concrete',
        rooms: [
          { id: 'lock', x0: 0, z0: 0, x1: 8, z1: 6, floor: 'tile_floor', wall: 'tile_white', ceil: 'ceiling_panel' },
          { id: 'cor1', x0: 8, z0: 2, x1: 20, z1: 4, floor: 'linoleum', wall: 'plaster', ceil: 'ceiling_panel' },
          { id: 'arm', x0: 20, z0: -1, x1: 28, z1: 7, floor: 'concrete', wall: 'brick_painted', ceil: 'ceiling_panel' },
          { id: 'range', x0: 28, z0: -2, x1: 46, z1: 8, h: 4, floor: 'concrete', wall: 'concrete', ceil: 'ceiling_dark' },
          { id: 'cor2', x0: 46, z0: 2, x1: 52, z1: 4, floor: 'linoleum', wall: 'plaster', ceil: 'ceiling_panel' },
          { id: 'dodge', x0: 52, z0: -4, x1: 64, z1: 10, h: 3.5, floor: 'concrete', wall: 'brick_painted', ceil: 'ceiling_dark' },
          { id: 'cor3', x0: 64, z0: 2, x1: 70, z1: 4, floor: 'linoleum', wall: 'plaster', ceil: 'ceiling_panel' },
          { id: 'gren', x0: 70, z0: -4, x1: 86, z1: 10, h: 4, floor: 'concrete', wall: 'concrete', ceil: 'ceiling_dark' },
          { id: 'khe', x0: 86, z0: 2, x1: 90, z1: 4, floor: 'linoleum', wall: 'plaster', ceil: 'ceiling_panel' },
          { id: 'kh1', x0: 90, z0: -4, x1: 98, z1: 4, floor: 'wood_floor', wall: 'wallpaper_home', ceil: 'plaster' },
          { id: 'kh2', x0: 90, z0: 4, x1: 98, z1: 12, floor: 'wood_floor', wall: 'wallpaper_home', ceil: 'plaster' },
          { id: 'kh3', x0: 98, z0: -4, x1: 106, z1: 4, floor: 'carpet_red', wall: 'wallpaper_hotel', ceil: 'plaster' },
          { id: 'kh4', x0: 98, z0: 4, x1: 106, z1: 12, floor: 'linoleum', wall: 'plaster', ceil: 'plaster' }
        ],
        doors: [
          { x: 8, z: 3, w: 1.2 },
          { x: 20, z: 3, w: 1.2 },
          { x: 28, z: 3, w: 1.2, door: { id: 'door_range', locked: true, lockMsg: 'Сначала возьмите оружие со стола.' } },
          { x: 46, z: 3, w: 1.2, door: { id: 'door_dodge', locked: true, lockMsg: 'Би-Би ещё не закончил на стрельбище.' } },
          { x: 52, z: 3, w: 1.6 },
          { x: 64, z: 3, w: 1.2, door: { id: 'door_pk', locked: true, lockMsg: 'Сначала упражнение с прыжком.' } },
          { x: 70, z: 3, w: 1.2, door: { id: 'door_gren', locked: true, lockMsg: 'Примите обезболивающее: H или Backspace.' } },
          { x: 86, z: 3, w: 1.2, door: { id: 'door_kh', locked: true, lockMsg: 'Сначала гранаты и бутылки.' } },
          { x: 90, z: 3, w: 1.2 },
          { x: 94, z: 4, w: 1.1, door: { id: 'kh_d1' } },
          { x: 98, z: 0, w: 1.1, door: { id: 'kh_d2' } },
          { x: 102, z: 4, w: 1.1, door: { id: 'kh_d3' } }
        ]
      });
      B.decor('lockers', 0.3, 0, 1.5, Math.PI / 2);
      B.decor('lockers', 0.3, 0, 4.4, Math.PI / 2);
      B.decor('bench', 4, 0, 0.8, 0);
      B.decal(4, 1.8, 0.11, 'pz', 2.4, 0.6, 'sign:ОТДЕЛ ПОДГОТОВКИ УБН');
      B.light(4, 2.8, 3, FL, 9);
      B.box(12, 1.45, 2, 12.6, 3, 4, 'metal');
      B.box(11.8, 1.3, 2, 12.8, 1.45, 4, 'rust');
      B.box(16, 0, 2, 16.8, 0.72, 4, 'crate');
      B.light(10, 2.8, 3, FL, 7);
      B.light(17, 2.8, 3, FL, 7);
      B.decor('table', 24, 0, 1, 0);
      B.decor('shelf', 27.6, 0, 5.5, -Math.PI / 2);
      B.decor('lockers', 20.3, 0, 5.6, Math.PI / 2);
      B.decal(24, 2.1, -0.89, 'pz', 2, 0.5, 'sign:ОРУЖЕЙНАЯ');
      B.light(24, 2.8, 3, [1, 0.92, 0.8], 10);
      B.box(31, 0, -2, 31.25, 1.1, 6, 'wood_panel');
      B.box(31, 1.1, -2, 31.35, 1.16, 6, 'metal');
      for (let z = 1.5; z <= 4.5; z += 3) B.box(31, 1.16, z - 0.05, 31.25, 2.1, z + 0.05, 'metal');
      B.box(46 - 0.6, 0, -2, 46, 4, 8, 'rubber');
      B.decal(28.12, 2.6, 3, 'px', 3, 0.6, 'sign:ТИР  НЕ ЗАХОДИТЬ ЗА БАРЬЕР');
      B.light(30, 3.7, 3, FL, 9);
      B.light(38, 3.7, 0, FL, 10);
      B.light(38, 3.7, 6, FL, 10);
      B.light(44, 3.6, 3, [1, 0.85, 0.6], 8);
      B.light(49, 2.8, 3, FL, 6);
      B.box(59, 0, -1, 59.3, 1.0, 2.5, 'concrete_block');
      B.box(59, 0, 4, 59.3, 1.0, 7, 'concrete_block');
      B.pillar(56, -1, 0.6, 0, 3.5, 'concrete');
      B.pillar(56, 7, 0.6, 0, 3.5, 'concrete');
      B.box(61.5, 0, 1, 62.5, 1.3, 5, 'concrete_block');
      B.light(55, 3.3, 3, FL, 10);
      B.light(61, 3.3, 3, FL, 10);
      B.light(67, 2.8, 3, [1, 0.6, 0.4], 7);
      B.decor('shelf', 69.6, 0, 2.3, -Math.PI / 2, { scale: 0.6 });
      B.box(79, 0, 0, 79.4, 1.7, 6, 'concrete_block');
      B.box(74, 0, 7, 74.3, 1.0, 10, 'concrete_block');
      B.prop({ kind: 'glass', id: 'tut_glass', pos: [77.5, 0, 8.5], axis: 'z', w: 3, h: 3 });
      B.box(77.35, 0, 7, 77.65, 4, 7.05, 'metal');
      B.decal(70.12, 2.4, 0, 'px', 3, 0.6, 'sign:ГРАНАТЫ  ТОЛЬКО ЗА БАРЬЕРОМ');
      B.light(73, 3.7, 3, FL, 10);
      B.light(82, 3.7, 3, FL, 10);
      B.light(82, 3.6, 8.5, [1, 0.8, 0.6], 7);
      B.light(88, 2.8, 3, FL, 5);
      B.decor('sofa', 94, 0, 11.3, Math.PI);
      B.decor('table', 94, 0, -2, 0);
      B.decor('fridge', 105.5, 0, 11.4, Math.PI);
      B.decor('counter', 102, 0, 11.6, Math.PI);
      B.decor('bed', 104.5, 0, -2.5, 0);
      B.light(94, 2.8, 0, [1, 0.9, 0.7], 8);
      B.light(94, 2.8, 8, [1, 0.9, 0.7], 8);
      B.light(102, 2.8, 0, [1, 0.8, 0.6], 8);
      B.light(102, 2.8, 8, FL, 8);
    },
    props: [
      { kind: 'crate', id: 'tut_crate', pos: [66.6, 0, 3.4], size: [0.7, 0.7, 0.7], hp: 20 },
      { kind: 'cyl', id: 'tut_cyl', pos: [83.2, 0, 8.8] }
    ],
    items: [
      { id: 'it_beretta', kind: 'weapon', weapon: 'beretta', amount: 18, pos: [24, 0.8, 1] },
      { id: 'it_ammo1', kind: 'ammo', ammo: '9mm', amount: 36, pos: [24.5, 0.8, 1.2] },
      { kind: 'ammo', ammo: '9mm', amount: 36, pos: [47, 0, 2.6] },
      { kind: 'ammo', ammo: '9mm', amount: 36, pos: [53, 0, 1.5] },
      { id: 'it_pk', kind: 'painkillers', amount: 2, pos: [69.4, 0.8, 2.3] },
      { kind: 'painkillers', amount: 1, pos: [66.6, 0.02, 3.4], in: 'tut_crate' },
      { id: 'it_gren', kind: 'weapon', weapon: 'grenade', amount: 3, pos: [71, 0, 1] },
      { id: 'it_molo', kind: 'weapon', weapon: 'molotov', amount: 2, pos: [71, 0, 5] },
      { kind: 'ammo', ammo: '9mm', amount: 54, pos: [72, 0, 3] },
      { kind: 'weapon', weapon: 'beretta', amount: 18, pos: [87.5, 0, 3] },
      { kind: 'painkillers', amount: 1, pos: [88.5, 0, 2.4] }
    ],
    chars: [
      dummy('t1', 'r1', 41, 0), dummy('t2', 'r1', 42.5, 3), dummy('t3', 'r1', 40, 6.2),
      dummy('m1', 'r2', 43, 1, { popup: true, rail: [43, -0.5, 43, 6.5], railSpeed: 0.9 }),
      dummy('m2', 'r2', 39, 5, { popup: true, rail: [39, 6.5, 39, -0.5], railSpeed: 0.7 }),
      dummy('s1', 'r3', 44, 0.5, { popup: true, shoots: true }),
      dummy('s2', 'r3', 44.5, 3, { popup: true, shoots: true }),
      dummy('s3', 'r3', 44, 5.5, { popup: true, shoots: true }),
      dummy('d1', 'dg', 63, -2.5, { popup: true, shoots: true }),
      dummy('d2', 'dg', 63.2, 1.5, { popup: true, shoots: true }),
      dummy('d3', 'dg', 63.2, 4.5, { popup: true, shoots: true }),
      dummy('d4', 'dg', 63, 8.5, { popup: true, shoots: true }),
      dummy('g1', 'gw', 81, 1.5, { popup: true }),
      dummy('g2', 'gw', 81.5, 3, { popup: true }),
      dummy('g3', 'gw', 81, 4.5, { popup: true }),
      dummy('c1', 'gc', 84, 7.8, { popup: true }),
      dummy('c2', 'gc', 84.5, 9.3, { popup: true }),
      dummy('k1', 'kh', 96.5, -2.5, { popup: true, shoots: true, yaw: Math.PI / 2 }),
      dummy('k2', 'kh', 92, 10.5, { popup: true, shoots: true, yaw: 0 }),
      dummy('k3', 'kh', 96.5, 7, { popup: true, shoots: true, yaw: Math.PI / 2 }),
      dummy('k4', 'kh', 104.5, 1, { popup: true, shoots: true, yaw: Math.PI / 2 }),
      dummy('k5', 'kh', 101, -3, { popup: true, shoots: true, rail: [100, -3, 105, -3], railSpeed: 0.6, yaw: 0 }),
      dummy('k6', 'kh', 104, 9, { popup: true, shoots: true, yaw: 0 }),
      dummy('k7', 'kh', 100, 10.8, { popup: true, shoots: true, yaw: 0 })
    ],
    triggers: [
      { id: 'cor1', min: [9, 0, 2], max: [11, 3, 4] },
      { id: 'jump', min: [14, 0, 2], max: [15.5, 3, 4] },
      { id: 'arm', min: [21, 0, -1], max: [23, 3, 7] },
      { id: 'range', min: [28.5, 0, -2], max: [30.5, 4, 8] },
      { id: 'cor2', min: [47, 0, 2], max: [50, 3, 4] },
      { id: 'dodgeIn', min: [53, 0, -4], max: [55, 3, 10] },
      { id: 'flash', min: [65.5, 0, 2], max: [66.5, 3, 4] },
      { id: 'gren', min: [71, 0, -4], max: [73, 4, 10] },
      { id: 'kh', min: [87, 0, 2], max: [89, 3, 4] }
    ],
    on: {
      start(g) {
        g.dialog([
          ['bb', 'Макс, слышишь меня? Это Би-Би. Я в будке наверху, говорю через динамик.'],
          ['bb', 'Начальство хочет, чтобы ты прошёл курс заново, прежде чем тебя выпустят на улицу. Бумажки, сам понимаешь.'],
          ['max:thought', 'Бумажки. После Нью-Джерси все вокруг вдруг полюбили бумажки.']
        ]);
        g.hint('W A S D: движение. Мышь: обзор. Идите в коридор.', 8);
      },
      'enter:cor1'(g) {
        g.hint('C или Ctrl: пригнуться. Под трубой можно пройти только пригнувшись.', 7);
      },
      'enter:jump'(g) {
        g.hint('Пробел: прыжок. Ящики перепрыгиваются с разбега.', 6);
      },
      'enter:arm'(g) {
        g.say('bb', 'Беретта на столе. Бери, не стесняйся, она казённая.');
        g.hint('Подойдите к столу, оружие поднимается само.', 6);
      },
      'pick:it_beretta'(g) {
        g.unlock('door_range');
        g.say('bb', 'Тир за дверью. Барьер не переходи, там у меня мишени по сто долларов штука.');
      },
      'enter:range'(g) {
        g.hint('Левая кнопка мыши: огонь. R: перезарядка. Сбейте три мишени.', 8);
        g.setThought('Три фанерные мишени в конце тира.');
      },
      'kill:r1'(g) {
        g.say('bb', 'Руки помнят. Теперь мишени на рельсах.');
        g.raise('r2');
      },
      'kill:r2'(g) {
        g.flags.coverLesson = true;
        g.flags.coverHints = true;
        g.dialog([
          ['bb', 'Хорошо. А теперь то, ради чего тебя сюда и пригнали.'],
          ['bb', 'Следующие мишени стреляют в ответ. Сначала сядь за барьер, он выдержит.']
        ], 'coverAsk');
      },
      coverAsk(g) {
        if (!g.flags.coverLesson) return;
        g.hint('X у барьера или стены: укрыться. A и D: двигаться вдоль укрытия. Огонь или W: высунуться и выстрелить, Макс сам спрячется обратно. X или S: выйти из укрытия.', 12);
        g.setThought('Сесть за барьер. Мишени будут стрелять в ответ.');
        g.later(12, 'coverLate');
      },
      cover(g) {
        if (!g.flags.coverLesson) return;
        g.flags.coverLesson = false;
        g.dialog([
          ['bb', 'Вот так. Пока сидишь, пластик бьёт в барьер. Высунулся, выстрелил, спрятался.'],
          ['bb', 'Эти три стреляют пластиковыми пулями. Больно, но не смертельно. В замедлении ты увидишь каждую.']
        ], 'r3go');
      },
      coverLate(g) {
        if (!g.flags.coverLesson) return;
        g.flags.coverLesson = false;
        g.dialog([
          ['bb', 'Не хочешь за барьер? Твоё дело, Макс. Пластик всё равно больно бьёт.']
        ], 'r3go');
      },
      r3go(g) {
        g.raise('r3');
        g.setThought('Три мишени, которые стреляют в ответ.');
        g.hint('Shift или правая кнопка мыши (стоя на месте): замедление времени. Песочные часы внизу слева показывают запас, каждое убийство его пополняет.', 11);
      },
      'kill:r3'(g) {
        g.unlock('door_dodge');
        g.openDoor('door_dodge', 1);
        g.say('bb', 'Неплохо, Макс. Дальше по коридору комната для прыжков.');
        g.setThought('Комната для прыжков за тиром.');
      },
      'enter:cor2'(g) {
        g.hint('Правая кнопка мыши во время бега или Q: прыжок в сторону в замедлении. В полёте можно стрелять.', 9);
      },
      'enter:dodgeIn'(g) {
        g.dialog([
          ['bb', 'Четыре мишени за укрытиями. Прыгай и стреляй, пока летишь.'],
          ['bb', 'Колонны выше головы, из-за них стреляют только из-за угла. А из укрытия можно сразу уйти в прыжок.']
        ]);
        g.hint('За колонной Макс выглядывает из-за угла, когда вы стреляете. Q или правая кнопка с направлением в укрытии: прыжок в сторону.', 10);
        g.later(1.2, 'dgUp');
      },
      dgUp(g) { g.raise('dg'); },
      'kill:dg'(g) {
        g.flags.coverHints = false;
        g.unlock('door_pk');
        g.openDoor('door_pk', 1);
        g.say('bb', 'Вот это я понимаю. Следующая дверь.');
      },
      'enter:flash'(g) {
        g.explode([67.4, 0.4, 3], 3.2, 0, 'world');
        g.hurtPlayer(45, [0, 0, 1], 'world');
        g.dialog([
          ['bb', 'Ой. Это светошумовая, её там быть не должно было.'],
          ['bb', 'Ладно, будем считать, что так и задумано. На полке обезболивающее.']
        ]);
        g.hint('H или Backspace: принять обезболивающее. Силуэт внизу слева краснеет от ран. Ящики ломаются от выстрелов и ударов.', 10);
        g.later(0.5, 'pkCheck');
      },
      pkCheck(g) {
        if (g.stats.painkillers > 0) {
          g.unlock('door_gren');
          g.openDoor('door_gren', 1);
          g.say('bb', 'Живой? Отлично. Дальше гранаты.');
        } else g.later(0.5, 'pkCheck');
      },
      'enter:gren'(g) {
        g.raise('gw');
        g.raise('gc');
        g.hint('5: гранаты и коктейли Молотова, G: быстрый бросок. Мишени за стенкой пулей не достать. У двух других стоит газовый баллон, он взрывается от выстрела.', 11);
        g.setThought('Мишени за бетонной стенкой и у баллона.');
      },
      'kill:gw'(g) { g.flags.gw = true; if (g.flags.gc) g.fireEvent('grenDone'); },
      'kill:gc'(g) { g.flags.gc = true; if (g.flags.gw) g.fireEvent('grenDone'); },
      grenDone(g) {
        g.unlock('door_kh');
        g.openDoor('door_kh', 1);
        g.say('bb', 'Последнее. Учебный дом. Там все мишени стреляют.');
        g.setThought('Учебный дом. Все мишени стреляют.');
      },
      'enter:kh'(g) {
        g.flags.coverHints = true;
        g.raise('kh');
        g.hint('Используйте всё сразу: замедление, прыжки, укрытия.', 7);
      },
      'kill:kh'(g) {
        g.flags.coverHints = false;
        g.dialog([
          ['bb', 'Всё, Макс. Бумажку я подпишу.'],
          ['bb', 'Иди домой и поспи хоть раз нормально.'],
          ['max:thought', 'Домой. Там теперь тихо, и я слышу, как тикают часы на кухне.']
        ], 'tutDone');
      },
      tutDone(g) { g.finish(); }
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
