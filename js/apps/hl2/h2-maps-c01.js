(function (H) {
  'use strict';
  const { X, E, grid, zc, lamp, ceilingLight, slab, wallX, wallZ } = H.MU;

  const g = grid(56, 39, 'W');
  g.rect('#', 0, 0, 22, 14);
  g.rect('_', 1, 1, 21, 3);
  g.rect('.', 1, 4, 21, 13);
  g.rect('g', 22, 8, 22, 9);
  g.rect('#', 23, 2, 31, 10);
  g.rect(',', 23, 8, 30, 9);
  g.rect(',', 25, 3, 30, 6);
  g.set(',', 27, 7);
  g.set(',', 31, 4);
  g.rect('V', 23, 11, 31, 18);
  g.rect('o', 32, 1, 54, 18);
  g.rect('s', 32, 1, 54, 1);
  g.rect('s', 32, 18, 54, 18);
  g.rect('s', 54, 1, 54, 18);
  g.rect('s', 32, 11, 32, 18);
  g.rect('Y', 36, 19, 49, 30);
  g.rect('a', 37, 20, 48, 29);
  g.set('d', 42, 19);
  g.set('w', 49, 22);
  g.rect('r', 50, 19, 54, 24);
  g.rect('p', 50, 25, 54, 25);
  g.rect('q', 50, 26, 54, 29);
  g.rect('o', 50, 30, 54, 36);
  g.set(',', 52, 37);

  H.maps.c01 = {
    id: 'c01', chapter: 0, music: 'city',
    env: { sky: 'city', fog: [0.56, 0.6, 0.63], fogNear: 30, fogFar: 170, ambient: [0.5, 0.52, 0.56], indoorAmbient: [0.2, 0.2, 0.22], sun: { dir: [-0.3, -1, 0.45], col: [0.5, 0.5, 0.45] } },
    legend: {
      '#': { f: 11, w: 'plaster', rt: 'roof' },
      'W': { f: 18, w: 'facade', rt: 'roof' },
      'V': { f: 13, w: 'facade3', rt: 'roof' },
      'Y': { f: 9, w: 'brick_yellow', rt: 'roof' },
      '_': { f: -1.0, c: 7.5, top: 11, t: 'rail', w: 'concrete_dark', ct: 'concrete' },
      '.': { f: 0, c: 7.5, top: 11, t: 'tile', w: 'plaster', ct: 'concrete' },
      'g': { f: 0, c: 3.4, top: 11, t: 'tile', w: 'plaster' },
      ',': { f: 0, c: 3.4, top: 11, t: 'linoleum', w: 'plaster_blue', ct: 'plaster_white' },
      'o': { f: 0, t: 'asphalt' },
      's': { f: 0.15, t: 'sidewalk', w: 'concrete' },
      'a': { f: 0, c: 8, top: 9, t: 'wood_floor', w: 'wallpaper', ct: 'plaster_white' },
      'd': { f: 0, c: 2.6, top: 9, t: 'concrete', w: 'brick_yellow' },
      'w': { f: 4.35, c: 6.3, top: 9, t: 'concrete', w: 'brick_yellow' },
      'r': { f: 4.2, w: 'brick', rt: 'roof_tin' },
      'p': { f: 0, t: 'asphalt' },
      'q': { f: 4.6, w: 'facade2', rt: 'roof' }
    },
    grid: g.rows(),
    start: { x: X(4), z: X(5), yaw: Math.PI / 2 },
    menuCam: { x: X(40), z: X(15), y: 1.7, yaw: Math.PI },
    build(b) {
      b.clip(E(1), 0, E(4) - 0.15, E(22), 1.3, E(4));
      b.model('wagon', X(6), -1, X(2), Math.PI / 2, { solid: [6, 3.6, 1.5] });
      b.model('wagon', X(13) + 1, -1, X(2), Math.PI / 2, { solid: [6, 3.6, 1.5] });
      for (let c = 3; c <= 19; c += 4) {
        b.box(E(c) + 0.6, 0, E(8) + 0.6, E(c) + 1.4, 7.5, E(8) + 1.4, 'concrete');
        ceilingLight(b, X(c), 7.45, X(6), [1, 0.95, 0.82], 11);
        ceilingLight(b, X(c), 7.45, X(11), [1, 0.95, 0.82], 11);
      }
      for (let c = 2; c <= 18; c += 5) b.model('bench', X(c), 0, X(12), 0, { solid: [0.9, 0.9, 0.25] });
      b.model('screen', X(10), 3.8, E(14) - 0.1, Math.PI);
      b.model('screen', X(16), 3.8, E(14) - 0.1, Math.PI);
      b.sign('СИТИ 17 · ВОКЗАЛ', X(8), 6, E(14) - 0.05, Math.PI, 5, 0.8, { bg: '#2a3a44', fg: '#e8e0c8' });
      b.sign('ВЫХОД →', X(20), 4.2, E(14) - 0.05, Math.PI, 2.4, 0.5, { bg: '#264030', fg: '#e0f0d0' });
      b.box(E(1), 0, E(13) + 1.2, E(1) + 1.2, 1.4, E(14), 'crate');
      b.npc('citizen', X(5), X(9), { yaw: 1.2, lines: ['Не пей воду. Её чем-то разбавляют, чтобы мы всё забывали.', 'Меня тоже сюда перевели. Никто не говорит зачем.'] });
      b.npc('citizen', X(9), X(12), { yaw: -2.5, lines: ['Не смотри на них. Смотри в пол.', 'Говорят, в этом городе новенькие долго не задерживаются.'] });
      b.npc('citizen', X(14), X(7), { yaw: 3, lines: ['Я здесь уже третью неделю жду поезда отсюда. Ни одного.'] });
      b.npc('citizen', X(17), X(12), { yaw: 0.3, patrol: 'civ1' });
      b.path('civ1', [[X(17), X(12)], [X(12), X(12)], [X(12), X(5)], [X(17), X(5)]]);
      b.npc('metrocop', X(20), X(10), { id: 'cancop', yaw: -Math.PI / 2, passive: true, team: 'neutral', speaker: 'metrocop' });
      b.npc('metrocop', X(21), X(6), { id: 'gatecop', yaw: -Math.PI / 2, passive: true, team: 'neutral', speaker: 'metrocop' });
      b.model('trashcan', X(21) - 0.2, 0, X(11) + 0.2, 0);
      b.zone('bin', X(21) - 0.75, X(11) - 0.55, X(21) + 0.35, X(11) + 0.95, -0.5, 1.6);
      b.prop('can', X(19), X(11) + 0.3, { tag: 'can', id: 'can' });
      b.door('gate1', E(22) + 0.9, 0, E(8), E(22) + 1.1, 3.3, E(10), { tex: 'gate', move: [0, 3.1, 0], speed: 0.8 });
      zc(b, 'station', 1, 4, 21, 13);
      zc(b, 'cangate', 16, 7, 21, 13);
      ceilingLight(b, X(24), 3.35, X(8), [0.8, 0.9, 1], 7);
      ceilingLight(b, X(28), 3.35, X(9), [0.8, 0.9, 1], 7);
      ceilingLight(b, X(27), 3.35, X(4), [1, 0.85, 0.6], 8);
      zc(b, 'corridor', 24, 8, 30, 9);
      zc(b, 'room', 25, 3, 30, 6);
      b.door('barneydoor', E(27), 0, E(7) + 0.9, E(28), 2.6, E(7) + 1.1, { tex: 'door_metal', locked: true });
      b.door('backdoor', E(31) + 0.9, 0, E(4), E(31) + 1.1, 2.6, E(5), { tex: 'door_metal', locked: true });
      b.door('deaddoor', E(30) + 1.7, 0, E(8), E(30) + 1.9, 2.6, E(10), { tex: 'door_metal', locked: true });
      b.model('desk', X(28), 0, X(4), 0, { solid: [0.8, 0.8, 0.4] });
      b.model('computer', X(28), 0.78, X(4) - 0.1, 0);
      b.model('console', X(25) + 0.3, 0, X(6), Math.PI / 2, { solid: [0.3, 1, 0.6] });
      b.npc('barney', X(27), X(5), { id: 'barney', yaw: Math.PI, passive: true, weapon: null, stay: true });
      zc(b, 'plaza', 32, 1, 54, 18);
      b.model('statue', X(43), 0, X(9), 0, { solid: [1, 3.8, 1] });
      b.model('screen', X(43), 6, E(1) + 0.1, 0);
      b.model('screen', X(38), 3, E(1) + 0.1, 0);
      b.sign('ЕСТЬ ТОЛЬКО ПОРЯДОК', X(48), 5.6, E(1) + 0.05, 0, 5, 0.7, { bg: '#20303c', fg: '#d8e0e8' });
      for (const [c, r] of [[34, 3], [42, 3], [50, 3], [34, 16], [46, 16], [53, 10]]) lamp(b, X(c), X(r), r > 9 ? Math.PI : 0);
      b.model('wreck', X(36), 0, X(13), 0.4, { solid: [1, 1.4, 2.1] });
      b.model('bench', X(47), 0, X(6), Math.PI / 2, { solid: [0.25, 0.9, 0.9] });
      b.model('tree', X(38), 0, X(6));
      b.model('tree', X(49), 0, X(13));
      b.model('trashcan', X(52), 0, X(15));
      b.model('barricade', X(40), 0, E(1) + 0.4, 0, { solid: [1.5, 2.3, 0.15] });
      b.npc('citizen', X(39), X(9), { yaw: 2, lines: ['Опять эти сканеры. Каждый день фотографируют.', 'Ты откуда? Впрочем, не отвечай.'] });
      b.npc('citizen', X(46), X(12), { yaw: 0.4, patrol: 'civ2' });
      b.path('civ2', [[X(46), X(12)], [X(51), X(12)], [X(51), X(5)], [X(46), X(5)]]);
      b.npc('citizen', X(35), X(16), { yaw: -0.5, lines: ['Дом за мной. Там люди. Если что, беги туда.'] });
      b.npc('metrocop', X(50), X(8), { tag: 'patrol', passive: true, team: 'neutral', patrol: 'cop1', speaker: 'metrocop' });
      b.path('cop1', [[X(50), X(8)], [X(50), X(15)], [X(36), X(15)], [X(36), X(8)]]);
      b.npc('scanner', X(44), X(12), { tag: 'scanner', y: 6, passive: true, team: 'neutral' });
      zc(b, 'aptin', 37, 20, 48, 29, -1, 3);
      zc(b, 'floor2', 37, 20, 48, 29, 3.5, 8);
      b.door('aptdoor', E(42), 0, E(19) + 0.9, E(43), 2.5, E(19) + 1.1, { tex: 'door_wood', auto: true, type: 'swing' });
      b.stairs(E(37), E(24), E(38), E(27), 0, 4, 'z-', 'wood');
      slab(b, 37, 20, 48, 29, 4, 'wood_floor', [[37, 24, 37, 26]]);
      b.box(E(38) - 0.1, 0, E(24), E(38) + 0.1, 3.7, E(27), 'wallpaper');
      b.box(E(38) - 0.1, 4, E(24), E(38) + 0.1, 5, E(27), 'wood');
      wallX(b, E(38), E(49), E(24), 0, 3.7, 'wallpaper', [[E(41), E(42) + 1, 2.4], [E(46), E(47) + 1, 2.4]]);
      wallZ(b, E(24), E(30), E(44), 0, 3.7, 'wallpaper', [[E(26), E(27), 2.4]]);
      wallX(b, E(38), E(49), E(25), 4, 7.9, 'wallpaper', [[E(39), E(40), 6.4], [E(45), E(46), 6.4]]);
      wallZ(b, E(20), E(25), E(44), 4, 7.9, 'wallpaper', [[E(22), E(23), 6.4]]);
      for (const [c, r, y] of [[40, 21, 3.65], [46, 21, 3.65], [40, 27, 3.65], [46, 27, 3.65], [40, 22, 7.95], [46, 22, 7.95], [41, 28, 7.95]]) ceilingLight(b, X(c), y, X(r), [1, 0.85, 0.6], 7);
      b.prop('table', X(46), X(27), {});
      b.prop('chair', X(45), X(27), {});
      b.prop('tv', X(47), X(21), {});
      b.prop('mattress', X(41), X(27), { y: 4 });
      b.prop('chair', X(47), X(22), { y: 4 });
      b.prop('table', X(46), X(23), { y: 4 });
      b.prop('bottle', X(46), X(23) + 0.2, { y: 4.8 });
      b.prop('fridge', X(40), X(21), { yaw: 0 });
      b.npc('citizen', X(40), X(22), { id: 'aptciv', yaw: 0, stay: true, lines: ['Наверх! Быстрее!'] });
      b.npc('citizen', X(46), X(21), { id: 'aptciv2', y: 4, yaw: 2, stay: true, lines: ['Окно в конце коридора. Там крыши.'] });
      b.npc('citizen', X(41), X(21), { y: 4, yaw: 1.5, stay: true, lines: ['Нас всех заберут...'] });
      b.npc('metrocop', X(42), X(16), { group: 'raid', tag: 'raid', hate: true });
      b.npc('metrocop', X(44), X(16), { group: 'raid', tag: 'raid', hate: true });
      b.npc('metrocop', X(40), X(13), { group: 'raid', tag: 'raid', hate: true });
      zc(b, 'roofA', 50, 19, 54, 24, 3.8, 9);
      zc(b, 'roofB', 50, 26, 54, 29, 3.8, 9);
      b.ladder(X(52) - 0.4, E(25) + 0.05, X(52) + 0.4, E(25) + 0.25, 0, 4.3);
      b.npc('metrocop_pistol', X(47), X(17), { group: 'shooters', tag: 'shooters', hate: true, stay: true });
      b.npc('metrocop_pistol', X(53), X(16), { group: 'shooters', tag: 'shooters', hate: true, stay: true });
      b.npc('metrocop_pistol', X(51), X(35), { group: 'shooters2', tag: 'shooters', hate: true, stay: true });
      b.stairs(E(54), E(30), E(55), E(33), 0, 4.6, 'z-', 'metal_rust');
      b.box(E(53) + 1.8, 0, E(30), E(54), 4.6, E(33), 'metal_rust');
      zc(b, 'alley', 50, 32, 53, 36, -1, 2);
      b.model('trashcan', X(50), 0, X(34));
      b.prop('container', X(50) + 0.2, X(31), { yaw: Math.PI / 2 });
      b.prop('crate', X(53), X(35), {});
      b.prop('barrel', X(50), X(36), {});
      lamp(b, X(52), X(31), 0, [1, 0.8, 0.5]);
      b.npc('metrocop', X(54), X(32), { group: 'ambush', tag: 'ambush', hate: true });
      b.npc('metrocop', X(53), X(31), { group: 'ambush', tag: 'ambush', hate: true });
      b.npc('metrocop', X(51), X(31), { group: 'ambush', tag: 'ambush', hate: true });
      b.door('labdoor', E(52), 0, E(37) + 0.05, E(53), 2.6, E(37) + 0.25, { tex: 'door_metal', locked: true });
      zc(b, 'lab', 52, 37, 52, 37);
      b.sign('λ', X(51), 2.4, E(37) - 0.02, Math.PI, 0.8, 0.8, { bg: '#303030', fg: '#e07818' });
      b.light(X(52), 2.8, E(37) - 0.6, 1, 0.7, 0.4, 6);
      b.cache(E(53) + 0.2, E(36), E(55), E(37));
      b.item('healthvial', X(54), X(36), {});
      b.item('battery', X(54) - 0.4, X(36), {});
    },
    scripts: [
      {
        id: 'intro', steps: [
          ['freeze'], ['fade', [0, 0, 0], 0.01, 13.5], ['sound', 'gman'],
          ['say', 'gman', 'Проснитесь, мистер Фримен. Проснитесь и... оглядитесь по сторонам.', 3.6],
          ['say', 'gman', 'Я не хочу сказать, что вы спали на посту. Никто не заслужил отдых больше вас.', 4],
          ['say', 'gman', 'Но и самый нужный человек в ненужном месте может перевернуть мир.', 3.6],
          ['say', 'gman', 'Так что просыпайтесь, мистер Фримен. Пора... и вдохните этот пепел.', 3.6],
          ['sound', 'train'], ['wait', 1.2], ['freeze', false], ['title', 0], ['music', 'city'],
          ['hint', 'W A S D — идти, мышь — осмотреться, E — говорить и брать предметы', 7]
        ]
      },
      {
        id: 'breencast', when: { zone: 'station' }, steps: [
          ['wait', 5], ['sound', 'breencast'],
          ['say', 'breen', 'Добро пожаловать в Сити 17. Выбрали вы его сами или за вас выбрали другие, здесь вы в безопасности.', 5.5],
          ['say', 'breen', 'Я говорю с вами не как администратор. Я говорю как человек, который тоже помнит прежний мир.', 5],
          ['say', 'breen', 'Наши Благодетели дали нам порядок. Цените его.', 3.5]
        ]
      },
      {
        id: 'can', when: { zone: 'cangate' }, steps: [
          ['npc', 'cancop', 'face', 'player'], ['say', 'metrocop', 'Эй. Подними эту банку.', 2.4], ['hint', 'E — поднять банку. E ещё раз — выпустить из рук. ЛКМ — бросить', 7],
          ['wait', 9], ['do', g => { if (!g.flags.canDone) g.say('metrocop', 'Я сказал: подними банку.', 2); }]
        ]
      },
      {
        id: 'canbin', when: { all: [{ propZone: ['can', 'bin'] }, { noflag: 'canDone' }] }, steps: [
          ['flag', 'canDone'], ['disable', 'can'], ['say', 'metrocop', 'Вот и молодец. Проходи.', 2.2], ['door', 'gate1', 'open'], ['autosave']
        ]
      },
      {
        id: 'canthrow', when: g => !g.flags.canDone && g.props.some(p => p.tag === 'can' && p.thrownBy === 'player' && g.time - p.thrownT < 2 && H.dist(p.pos, g.npcById('cancop').pos) < 1.6), steps: [
          ['flag', 'canDone'], ['disable', 'can'], ['npc', 'cancop', 'anim', 'swing', 0.6], ['sound', 'stunstick'],
          ['do', g => { g.damagePlayer(8, { type: 'club', fixed: true, dir: H.vnorm(H.vsub(g.player.pos, g.npcById('cancop').pos)) }); g.player.vel.x += 3; }],
          ['say', 'metrocop', 'Ты что себе позволяешь?! Проваливай, пока я добрый.', 3], ['door', 'gate1', 'open'], ['autosave']
        ]
      },
      {
        id: 'barney', when: { zone: 'corridor' }, steps: [
          ['door', 'barneydoor', 'open'], ['npc', 'barney', 'face', 'player'],
          ['say', 'barney', 'Эй, ты! Да, ты. Заходи сюда. Живо.', 2.6],
          ['until', { zone: 'room' }],
          ['say', 'barney', 'Гордон Фримен? Я уж думал, у меня галлюцинации. Не бойся, это я, Барни.', 4],
          ['say', 'barney', 'Работаю тут под прикрытием. Долгая история, потом расскажу.', 3.4],
          ['say', 'barney', 'Кляйнер ждёт тебя в своей лаборатории. Выходи через заднюю дверь, держись подальше от патрулей.', 4.6],
          ['door', 'backdoor', 'open'], ['say', 'barney', 'Я их тут задержу. Удачи.', 2], ['autosave']
        ]
      },
      {
        id: 'plaza', when: { zone: 'plaza' }, steps: [
          ['say', 'overwatch', 'Внимание, жители. Проводится проверка. Оставайтесь на своих местах.', 4],
          ['wait', 6], ['sayq', 'citizen', 'Опять облава. Уходи отсюда, пока не поздно.', 3]
        ]
      },
      {
        id: 'raid', when: { zone: 'aptin' }, steps: [
          ['npc', 'aptciv', 'face', 'player'], ['say', 'citizen', 'Ты с ума сошёл? Облава! Беги наверх, прячься!', 3],
          ['hint', 'Лестница у западной стены', 4], ['wait', 5], ['sound', 'door'], ['group', 'raid'],
          ['npc', 'patrol', 'team', 'combine'], ['npc', 'patrol', 'hate'], ['sayq', 'metrocop', 'Всем оставаться на местах! Проверка!', 3]
        ]
      },
      {
        id: 'floor2', when: { zone: 'floor2' }, steps: [
          ['npc', 'aptciv2', 'face', 'player'], ['say', 'citizen', 'Сюда! Окно в конце, за ним крыши. Уходи, пока они не поднялись!', 4]
        ]
      },
      {
        id: 'roofs', when: { zone: 'roofA' }, steps: [
          ['group', 'shooters'], ['sayq', 'metrocop', 'Нарушитель на крыше! Открыть огонь!', 2.5], ['hint', 'Пробел — прыжок. Спуститесь по лестнице в переулок', 5]
        ]
      },
      {
        id: 'roofs2', when: { zone: 'roofB' }, steps: [['group', 'shooters2']]
      },
      {
        id: 'ambush', when: { zone: 'alley' }, steps: [
          ['remove', 'shooters'], ['group', 'ambush'], ['say', 'metrocop', 'Стоять! Лицом к стене!', 2],
          ['do', g => { g.flags.ambushT = g.time + 8; }],
          ['until', g => g.player.hp < 62 || g.time > g.flags.ambushT],
          ['freeze'], ['fade', [0, 0, 0], 0.5, 1.3], ['wait', 0.6], ['remove', 'ambush'], ['remove', 'raid'], ['remove', 'patrol'],
          ['spawn', 'npc', 'alyx', X(52), X(33), { id: 'alyx', passive: true }],
          ['do', g => { g.player.hp = Math.max(g.player.hp, 45); }],
          ['wait', 1.2], ['freeze', false], ['npc', 'alyx', 'face', 'player'],
          ['say', 'alyx', 'Ну что, мальчики, поиграли и хватит. Эй, ты цел? Они полежат тут какое-то время.', 4.4],
          ['say', 'alyx', 'Подожди... Доктор Фримен? Тот самый Гордон Фримен?', 3],
          ['say', 'alyx', 'Я Аликс Вэнс. Папа столько о тебе рассказывал. Идём, лаборатория доктора Кляйнера прямо тут.', 5],
          ['door', 'labdoor', 'open'], ['npc', 'alyx', 'goto', X(52), X(37)], ['hint', 'Следуйте за Аликс', 4]
        ]
      },
      { id: 'tolab', when: { zone: 'lab' }, steps: [['changelevel', 'c02']] }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
