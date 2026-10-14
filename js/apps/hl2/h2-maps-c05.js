(function (H) {
  'use strict';
  const { X, E, grid, zc, lamp, ceilingLight, wallX, wallZ, crates } = H.MU;

  const g = grid(44, 34, 'R');
  g.rect('D', 0, 0, 43, 0);
  g.rect('w', 1, 1, 14, 3);
  g.rect('L', 1, 4, 14, 12);
  g.rect('s', 6, 5, 7, 6);
  g.rect('c', 15, 8, 20, 9);
  g.rect('y', 21, 4, 34, 15);
  g.rect('c', 35, 9, 36, 11);
  g.rect('t', 3, 13, 4, 30);
  g.rect('t', 5, 29, 30, 30);

  H.maps.c05 = {
    id: 'c05', chapter: 4, music: 'lab',
    env: { sky: 'coast', fog: [0.62, 0.68, 0.72], fogNear: 40, fogFar: 180, ambient: [0.58, 0.6, 0.62], indoorAmbient: [0.24, 0.25, 0.26], sun: { dir: [0.3, -1, 0.5], col: [0.75, 0.72, 0.62] } },
    legend: {
      'R': { f: 14, w: 'cliff', rt: 'rock' },
      'D': { f: 22, w: 'concrete', rt: 'concrete' },
      'w': { f: -2.5, t: 'mud', w: 'concrete_dark', wl: 0, wt: 'water' },
      'L': { f: -8, c: -4.5, top: 0.5, t: 'tile_lab', w: 'lab_wall', ct: 'plaster_white', rt: 'concrete' },
      's': { f: -8, t: 'metal', w: 'metal' },
      'c': { f: -8, c: -5, top: 14, t: 'metal', w: 'concrete_dark', ct: 'metal' },
      'y': { f: -8, t: 'dirt', w: 'cliff' },
      't': { f: -8, c: -4.5, top: 14, t: 'rail', w: 'rock', ct: 'rock' }
    },
    grid: g.rows(),
    start: { x: X(3), z: X(5), yaw: Math.PI / 2 },
    menuCam: { x: X(24), z: X(13), y: -6.3, yaw: Math.PI * 0.75 },
    build(b) {
      b.vehicle('airboat', X(4), X(2), Math.PI / 2, { id: 'boat', locked: true, gun: true });
      b.door('lift1', E(6), 0.2, E(5), E(8), 0.5, E(7), { tex: 'grate', move: [0, -8.5, 0], speed: 0.13, lift: true, locked: true });
      b.box(E(6) - 0.1, 0.5, E(5) - 0.1, E(8) + 0.1, 0.6, E(5), 'hazard', { solid: false });
      zc(b, 'liftzone', 6, 5, 7, 6, 0, 3);
      lamp(b, X(9), X(4) + 0.4, Math.PI);
      lamp(b, X(2), X(11), 0);
      b.sign('ВОСТОЧНАЯ ЧЁРНАЯ МЕЗА', X(8), 6, E(1) - 0.05 + 0.02, 0, 5, 0.8, { bg: '#34403a', fg: '#e8e0c0' });
      b.box(E(1), 0.5, E(12), E(15), 1.4, E(12) + 0.2, 'metal_rust');
      b.prop('crate', X(12), X(10), { y: 0.5 });
      b.prop('barrel', X(13), X(7), { y: 0.5 });
      b.item('battery', X(11), X(11), { y: 0.5 });
      b.npc('mossman', X(8), X(8), { id: 'mossman', y: -8, yaw: Math.PI, passive: true, lines: ['Илай в главной лаборатории. Не заставляй его ждать.'] });
      b.npc('eli', X(3), X(9), { id: 'eli', y: -8, yaw: Math.PI / 2, passive: true, lines: ['Двадцать лет, Гордон. Двадцать лет.', 'Будь осторожен с Псом. Он любит играть.'] });
      b.npc('alyx', X(4), X(11), { id: 'alyx', y: -8, yaw: Math.PI, passive: true });
      zc(b, 'arrive', 5, 4, 10, 8, -9, -6);
      zc(b, 'elilab', 1, 8, 6, 12, -9, -6);
      for (const [c, r] of [[3, 6], [10, 6], [3, 10], [10, 10], [13, 8]]) ceilingLight(b, X(c), -4.55, X(r), [0.95, 1, 1], 9);
      wallX(b, E(1), E(15), E(8), -8, -4.5, 'lab_wall', [[E(3), E(5), -5.8], [E(9), E(11), -5.8]]);
      wallZ(b, E(8), E(13), E(7), -8, -4.5, 'lab_wall', [[E(9), E(10), -5.8]]);
      for (const [c, r] of [[2, 10], [5, 12]]) { b.model('desk', X(c), -8, X(r), 0, { solid: [0.8, 0.8, 0.4] }); b.model('computer', X(c), -7.22, X(r) - 0.1, 0); }
      b.model('teleporter', X(11), -8, X(11), 0, { active: false });
      b.box(X(11) - 1.7, -8, X(11) - 1.7, X(11) + 1.7, -7.7, X(11) + 1.7, 'metal', { visible: false });
      b.model('console', X(13), -8, X(9), -Math.PI / 2, { solid: [0.3, 1, 0.6] });
      b.model('shelf', X(1), -8, X(5), Math.PI / 2, { solid: [0.25, 2, 1] });
      b.sign('E = mc²  ·  Ψ(x,t)', X(4), -6.2, E(12) + 1.95, Math.PI, 3, 0.8, { bg: '#1c2a20', fg: '#e8f0e0' });
      b.charger('health', X(14) + 0.85, -6.8, X(5), -Math.PI / 2);
      b.charger('suit', X(14) + 0.85, -6.8, X(6), -Math.PI / 2);
      b.door('yarddoor', E(15) + 0.9, -8, E(8), E(15) + 1.1, -5, E(10), { tex: 'door_metal', locked: true });
      ceilingLight(b, X(18), -5.05, X(8), [0.9, 1, 1], 7);
      zc(b, 'corridor', 15, 8, 20, 9);
      zc(b, 'yard', 21, 4, 34, 15);
      b.model('wreck', X(24), -8, X(5), 1.1, { solid: [2.1, 1.4, 2.1] });
      b.model('wreck', X(32), -8, X(13), 0.4, { solid: [1.2, 1.4, 2.1] });
      b.model('tank', X(32), -8, X(5), 0);
      b.box(X(32) - 3, -8, X(5) - 3, X(32) + 3, -2, X(5) + 3, 'metal', { visible: false });
      b.prop('paint', X(24), X(9), { tag: 'paint' });
      b.prop('paint', X(25), X(9), {});
      b.prop('crate', X(27), X(12), {});
      b.prop('crate', X(28), X(12), {});
      b.prop('barrel', X(22), X(14), {});
      b.prop('tire', X(29), X(8), {});
      b.prop('radiator', X(26), X(14), {});
      b.prop('ball', X(26), X(10), { tag: 'ball' });
      b.prop('car', X(30), X(10), { yaw: 0.3 });
      b.door('doggarage', E(35) - 0.2, -8, E(9), E(35), -4, E(12), { tex: 'corrugated', locked: true, move: [0, 3.9, 0] });
      b.npc('dog', X(35) + 1, X(10), { id: 'dog', group: 'dog', yaw: -Math.PI / 2 });
      b.spot('boom1', X(28), X(6), -7.5);
      b.spot('boom2', X(23), X(13), -7.5);
      zc(b, 'attack', 13, 8, 17, 9, -9, -6);
      b.door('tunneldoor', E(3), -8, E(13) + 0.9, E(5), -4.6, E(13) + 1.1, { tex: 'door_metal', locked: true });
      zc(b, 'tunnel', 3, 14, 4, 30);
      for (let r = 16; r <= 28; r += 4) b.light(X(3) + 1, -4.8, X(r), 0.9, 0.75, 0.5, 8);
      for (let c = 8; c <= 28; c += 5) b.light(X(c), -4.8, X(29) + 1, 0.9, 0.75, 0.5, 8);
      b.npc('soldier', X(4), X(22), { group: 'tsol', tag: 'tsol', y: -8, hate: true });
      b.npc('soldier_shotgun', X(3), X(26), { group: 'tsol', tag: 'tsol', y: -8, hate: true });
      b.npc('soldier', X(12), X(29), { group: 'tsol', tag: 'tsol', y: -8, hate: true });
      b.npc('soldier', X(18), X(30), { group: 'tsol', tag: 'tsol', y: -8, hate: true });
      b.npc('manhack', X(22), X(29), { group: 'tsol', tag: 'tsol', y: -6.5, hate: true });
      b.prop('barrel_red', X(3), X(20), { y: -8 });
      b.prop('barrel_red', X(10), X(30), { y: -8 });
      b.prop('barrel_red', X(19), X(29), { y: -8 });
      b.prop('sawblade', X(4), X(17), { y: -8 });
      crates(b, X(14), X(30), 3, { type: 'crate', loot: ['ammo_smg', 'healthvial', 'battery'] });
      b.prop('cabinet', X(24), X(30), { y: -8 });
      b.item('healthkit', X(27), X(29), { y: -8 });
      b.sign('λ', X(26), -6, E(29) + 0.02, 0, 0.8, 0.8, { bg: '#303030', fg: '#e07818' });
      b.cache(E(25), E(29), E(28), E(31));
      b.item('ammo_smggren', X(26), X(30), { y: -8 });
      zc(b, 'rh', 29, 29, 30, 30, -9, -5);
    },
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 4], ['wait', 1],
          ['say', 'mossman', 'Доктор Фримен? Это Джудит Моссман. Лифт у стены плотины, спускайтесь к нам.', 4],
          ['hint', 'Встаньте на платформу лифта', 5]
        ]
      },
      {
        id: 'lift', when: { zone: 'liftzone' }, steps: [
          ['sound', 'button'], ['wait', 0.6], ['sound', 'door'], ['door', 'lift1', 'open'],
          ['until', g => g.doors.find(d => d.id === 'lift1').t > 0.98], ['sound', 'button'],
          ['npc', 'mossman', 'face', 'player'],
          ['say', 'mossman', 'Добро пожаловать в Восточную Чёрную Мезу, доктор Фримен. Илай ждёт вас в лаборатории.', 4.4],
          ['npc', 'mossman', 'goto', X(5), X(9), false, -8], ['autosave']
        ]
      },
      {
        id: 'eli', when: { zone: 'elilab' }, steps: [
          ['npc', 'eli', 'face', 'player'],
          ['say', 'eli', 'Гордон Фримен! Аликс говорила, что ты придёшь. Двадцать лет прошло, а ты ни капли не изменился.', 5],
          ['say', 'alyx', 'Пап, телепорт Кляйнера его чуть не угробил. Ламарр прыгнула прямо на площадку.', 3.8],
          ['say', 'eli', 'Ох уж эта Ламарр. Главное, что ты здесь.', 2.6],
          ['say', 'mossman', 'Илай, нам нельзя долго держать связь. Альянс может нас засечь.', 3.4],
          ['say', 'eli', 'Знаю, Джудит. Аликс, покажи Гордону двор и дай ему гравипушку. Пусть привыкает.', 4],
          ['say', 'alyx', 'Пойдём, Гордон. Тебе понравится.', 2.2],
          ['door', 'yarddoor', 'open'], ['npc', 'alyx', 'goto', X(23), X(9), true, -8], ['hint', 'Следуйте за Аликс', 4]
        ]
      },
      {
        id: 'yard', when: { zone: 'yard' }, steps: [
          ['until', { npcZone: ['alyx', 'yard'] }], ['npc', 'alyx', 'face', 'player'],
          ['say', 'alyx', 'Это гравитационный манипулятор нулевой энергии. Мы зовём его просто гравипушкой.', 4],
          ['give', 'gravgun'], ['sound', 'gg_pickup'],
          ['hint', 'ПКМ — притянуть и взять предмет. ЛКМ — оттолкнуть или бросить', 8],
          ['say', 'alyx', 'Попробуй. Возьми вон ту банку с краской.', 2.6],
          ['until', { flag: 'held:gravgun' }],
          ['say', 'alyx', 'Отлично. А теперь брось её!', 2],
          ['until', g => g.flags['thrown:gravgun'] || g.props.some(p => p.thrownBy === 'player')],
          ['say', 'alyx', 'Ну вот, ты прирождённый физик. Эй, Пёс! Иди поздоровайся!', 3.4],
          ['door', 'doggarage', 'open'], ['group', 'dog'], ['wait', 1.5],
          ['npc', 'dog', 'set', { fetch: { state: 'wait' } }], ['sound', 'dog_happy'],
          ['say', 'alyx', 'Он хочет поиграть. Брось ему мяч гравипушкой!', 3],
          ['until', g => (g.flags.dogFetches || 0) >= 2],
          ['say', 'alyx', 'Хватит, Пёс! Молодец. Гордон, он тебя принял.', 3],
          ['wait', 1.5], ['sound', 'siren'], ['shake', 0.8, 2], ['explode', 'boom1', 20, 3],
          ['say', 'overwatch', 'Внимание: обнаружен очаг сопротивления. Начать зачистку сектора.', 3.6],
          ['explode', 'boom2', 20, 3],
          ['npc', 'dog', 'set', { fetch: null }],
          ['say', 'alyx', 'Это Альянс! Они нашли нас! Скорее, к папе!', 2.6],
          ['npc', 'alyx', 'goto', X(14), X(9), true, -8], ['npc', 'dog', 'goto', X(28), X(12), true], ['music', 'action']
        ]
      },
      {
        id: 'attack', when: { all: [{ zone: 'attack' }, { flag: 'got:gravgun' }] }, steps: [
          ['remove', 'eli'], ['remove', 'mossman'], ['sound', 'explode'], ['shake', 1, 1.5],
          ['npc', 'alyx', 'face', 'player'],
          ['say', 'alyx', 'Они забрали отца! Джудит тоже... Гордон, уходи старым тоннелем. Через Рейвенхолм.', 4.4],
          ['say', 'alyx', 'Я найду папу. Мы встретимся позже. Иди!', 2.6],
          ['door', 'tunneldoor', 'open'], ['npc', 'alyx', 'goto', X(8), X(6), true, -8], ['wait', 3], ['remove', 'alyx'],
          ['group', 'tsol'], ['autosave'], ['hint', 'Гравипушка отлично бросает бочки и пилы', 5]
        ]
      },
      { id: 'rh', when: { zone: 'rh' }, steps: [['changelevel', 'c06']] }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
