(function (H) {
  'use strict';
  const { X, E, grid, zc, lamp, ceilingLight, crates } = H.MU;

  const g = grid(60, 34, 'V');
  g.rect('y', 1, 1, 22, 16);
  g.rect('R', 1, 5, 22, 6);
  g.rect('R', 1, 11, 22, 12);
  g.rect('h', 24, 3, 35, 12);
  g.rect('h', 23, 7, 23, 8);
  g.rect('h', 36, 9, 36, 10);
  g.rect('K', 37, 9, 51, 10);
  g.rect('K', 37, 2, 58, 2);
  g.rect('k', 37, 3, 58, 8);
  g.rect('k', 52, 9, 58, 28);
  g.rect('z', 52, 14, 58, 16);
  g.rect('u', 52, 29, 58, 31);
  g.rect('P', 40, 30, 51, 31);
  g.rect('m', 30, 26, 39, 32);
  g.rect('r', 20, 24, 28, 32);
  g.rect('m', 29, 29, 29, 30);

  const PIV = { x: X(55), z: E(29) - 3.5 };

  H.maps.c03 = {
    id: 'c03', chapter: 2, music: 'tension',
    env: { sky: 'city', fog: [0.5, 0.54, 0.55], fogNear: 25, fogFar: 150, ambient: [0.5, 0.52, 0.52], indoorAmbient: [0.2, 0.2, 0.2], sun: { dir: [0.4, -1, 0.3], col: [0.55, 0.52, 0.45] } },
    legend: {
      'V': { f: 13, w: 'facade3', rt: 'roof' },
      'y': { f: 0, t: 'dirt', w: 'concrete' },
      'R': { f: 0, t: 'rail', w: 'concrete' },
      'h': { f: 0, c: 6, top: 13, t: 'concrete', w: 'brick_dark', ct: 'metal' },
      'K': { f: 0, t: 'concrete', w: 'concrete_dark' },
      'k': { f: -3.2, t: 'mud', w: 'concrete_dark', wl: -2.9, wt: 'water' },
      'z': { f: -3.2, t: 'mud', w: 'concrete_dark', wl: -2.55, wt: 'sludge' },
      'u': { f: 0, t: 'concrete', w: 'concrete_dark' },
      'P': { f: 0, c: 2.8, top: 13, t: 'metal_rust', w: 'concrete_dark', ct: 'metal_rust' },
      'm': { f: 0, c: 5, top: 13, t: 'concrete', w: 'brick', ct: 'metal' },
      'r': { f: 0, c: 3.4, top: 13, t: 'wood_floor', w: 'brick', ct: 'planks' }
    },
    grid: g.rows(),
    start: { x: X(5), z: X(5), yaw: Math.PI },
    menuCam: { x: X(46), z: X(9), y: 1.8, yaw: Math.PI * 0.95 },
    build(b) {
      b.box(E(3), 4.5, E(1), E(8), 4.7, E(1) + 1.6, 'metal_rust');
      b.box(E(3), 4.7, E(1) + 1.5, E(8), 5.6, E(1) + 1.6, 'grate', { solid: false });
      b.light(X(5), 5.5, E(1) + 0.5, 1, 0.85, 0.6, 7);
      b.npc('barney', X(5), E(1) + 0.8, { id: 'barney', y: 4.7, passive: true, weapon: null, yaw: 0 });
      b.model('wagon', E(13), 0, X(5) + 1, Math.PI / 2, { solid: [6, 3.6, 1.5] });
      b.model('wagon', E(9), 0, X(11) + 1, Math.PI / 2, { solid: [6, 3.6, 1.5] });
      b.model('crate_stack', X(18), 0, X(14));
      b.box(X(18) - 1, 0, X(14) - 1, X(18) + 1, 2, X(14) + 1, 'crate', { visible: false });
      b.model('pole', X(2), 0, X(9));
      b.model('pole', X(20), 0, X(9));
      crates(b, X(3), X(14), 3, { loot: ['healthvial', 'battery', null] });
      crates(b, X(16), X(2), 2, { loot: ['ammo_pistol', null] });
      b.prop('barrel', X(21), X(3), {});
      b.prop('barrel_red', X(21), X(15), {});
      b.prop('tire', X(8), X(15), {});
      lamp(b, X(12), X(16), Math.PI);
      b.npc('metrocop', X(21), X(8), { group: 'yardcops', tag: 'yardcops', hate: true });
      b.npc('metrocop', X(21), X(10), { group: 'yardcops', tag: 'yardcops', hate: true });
      zc(b, 'warehouse', 24, 3, 35, 12);
      for (const [c, r] of [[27, 5], [32, 5], [27, 10], [32, 10]]) ceilingLight(b, X(c), 5.95, X(r), [1, 0.85, 0.6], 9);
      b.model('shelf', X(26), 0, E(3) + 0.3, 0, { solid: [1, 2, 0.25] });
      b.model('shelf', X(29), 0, E(3) + 0.3, 0, { solid: [1, 2, 0.25] });
      b.box(E(31), 0, E(3), E(36), 2.6, E(5), 'metal', { top: 'grate' });
      b.stairs(E(31), E(5), E(32), E(8), 0, 2.6, 'z-', 'metal');
      b.item('weapon_pistol', E(34), E(4), { y: 2.6 });
      b.item('ammo_pistol', E(35), E(4), { y: 2.6 });
      crates(b, X(26), X(11), 3, { loot: ['battery', 'healthvial', null] });
      b.prop('cabinet', X(35), X(12) - 0.4, {});
      b.npc('metrocop_pistol', X(33), X(9), { tag: 'wcops', patrol: 'wpat', noDrop: true });
      b.path('wpat', [[X(33), X(9)], [X(26), X(9)]]);
      b.npc('metrocop', X(28), X(7), { tag: 'wcops', yaw: -Math.PI / 2 });
      zc(b, 'canal', 37, 2, 58, 10);
      b.stairs(E(42), E(8), E(45), E(9), -3.2, 0, 'x+', 'concrete');
      b.box(E(42), -3.2, E(8) - 0.15, E(45), 0.9, E(8), 'concrete', { top: 'concrete' });
      for (const c of [40, 46, 52, 57]) lamp(b, X(c), X(2), 0);
      b.model('fence', X(48), 0, E(3) - 0.05, 0);
      b.npc('metrocop_pistol', X(46), X(2), { group: 'canalcops', tag: 'canalcops', hate: true, stay: true });
      b.npc('metrocop_pistol', X(51), X(2), { group: 'canalcops', tag: 'canalcops', hate: true, stay: true });
      b.npc('metrocop', X(56), X(10), { group: 'canalcops', tag: 'canalcops', hate: true, y: -3.2 });
      b.prop('barrel', X(49), X(5), { y: -3.2 });
      b.prop('crate', X(56), X(6), { y: -3.2, contains: 'ammo_pistol' });
      b.item('healthkit', X(57), X(12), { y: -3.2 });
      for (const [c, r] of [[53, 14], [55, 15], [57, 16], [54, 16]]) b.box(E(c) + 0.3, -3.2, E(r) + 0.3, E(c) + 1.7, -2.25, E(r) + 1.7, 'crate');
      b.model('pipe', E(58), -1.2, X(18), -Math.PI / 2, { r: 0.4, len: 6 });
      b.prop('barrel', X(53), X(19), { y: -3.2 });
      b.model('boat', X(57), -3.2, X(21), 0.2);
      zc(b, 'seesawzone', 52, 18, 58, 28);
      b.seesaw('saw1', PIV.x, PIV.z, 7, -1.6, 'z', { angle0: 0.45, maxAngle: 0.45, bias: 60, width: 1.6, tex: 'planks' });
      for (const [dx, dz] of [[-2.5, -9], [-1.5, -9.5], [2, -8], [2.5, -6.5], [-2.8, -5], [1.2, -10]]) b.prop('cinder', PIV.x + dx, PIV.z + dz, { y: -3.2 });
      b.prop('crate', PIV.x + 3, PIV.z - 11, { y: -3.2 });
      b.sign('λ', X(52) + 0.02, -1.2, X(24), Math.PI / 2, 0.8, 0.8, { bg: '#404040', fg: '#e07818' });
      zc(b, 'ledge', 52, 29, 58, 31, -0.5, 4);
      b.light(X(55), 3, X(30), 1, 0.85, 0.6, 8);
      b.item('battery', X(57), X(31), {});
      zc(b, 'tunnel', 40, 30, 51, 31);
      for (const c of [42, 46, 50]) b.light(X(c), 2.6, X(30) + 1, 0.9, 0.7, 0.4, 5);
      b.npc('barnacle', X(49), X(30) + 0.4, { y: 2.8 });
      b.npc('barnacle', X(46), X(31) - 0.4, { y: 2.8 });
      b.npc('barnacle', X(43), X(30) + 0.6, { y: 2.8 });
      b.prop('bottle', X(47), X(30), {});
      zc(b, 'hackroom', 30, 26, 39, 32);
      for (const [c, r] of [[32, 28], [37, 28], [32, 31], [37, 31]]) ceilingLight(b, X(c), 4.95, X(r), [1, 0.8, 0.55], 8);
      b.model('vent', X(34), 4.4, E(26) + 0.1, 0);
      b.box(E(33), 3.6, E(26), E(35), 4.9, E(26) + 0.1, 'vent', { solid: false });
      b.npc('manhack', X(34), X(27), { group: 'hacks', tag: 'hacks', hate: true, y: 3 });
      b.npc('manhack', X(33), X(27), { group: 'hacks', tag: 'hacks', hate: true, y: 3.2 });
      b.npc('manhack', X(35), X(27), { group: 'hacks', tag: 'hacks', hate: true, y: 3.4 });
      b.npc('metrocop_pistol', X(31), X(27), { tag: 'hacks', id: 'hackcop', yaw: Math.PI / 2 });
      b.prop('crate_big', X(36), X(31), {});
      b.item('weapon_smg', X(38), X(27), {});
      b.item('ammo_smg', X(38), X(28), {});
      crates(b, X(31), X(32), 2, { loot: ['healthvial', 'ammo_smggren'] });
      b.prop('barrel_red', X(33), X(32), {});
      b.door('hidedoor', E(29) + 0.9, 0, E(29), E(29) + 1.1, 2.6, E(31), { tex: 'door_metal', locked: true });
      zc(b, 'hideout', 20, 24, 28, 32);
      for (const [c, r] of [[22, 26], [26, 26], [22, 30], [26, 30]]) ceilingLight(b, X(c), 3.35, X(r), [1, 0.8, 0.5], 7);
      b.npc('vort', X(22), X(27), { id: 'vort', yaw: Math.PI / 2, passive: true, lines: ['Мы видим тебя, Свободный человек. Наши глаза давно ждали.', 'Вортигонты помнят Нихиланта. И помнят тебя.'] });
      b.npc('rebel', X(25), X(29), { id: 'rebel1', yaw: -Math.PI / 2, passive: true, lines: ['Лодка у причала. Бери и держись каналов.'] });
      b.npc('medic', X(23), X(31), { yaw: 0, passive: true, lines: ['Если ранен, в углу станция. Пользуйся.'] });
      b.charger('health', X(20) + 0.12 - 1, 1.2, X(25), Math.PI / 2);
      b.item('ammo_smg', X(27), X(25), {});
      b.item('ammo_pistol', X(27), X(26), {});
      b.item('battery', X(27) - 0.5, X(25), {});
      b.model('bed', X(21), 0, X(29), 0, { solid: [0.5, 0.6, 1] });
      b.model('desk', X(25), 0, X(25), 0, { solid: [0.8, 0.8, 0.4] });
      b.sign('λ', X(24), 2.2, E(24) + 0.05, 0, 0.8, 0.8, { bg: '#303030', fg: '#e07818' });
      b.cache(E(26), E(24), E(29), E(26));
      zc(b, 'dock', 20, 32, 22, 32);
      b.sign('К ПРИЧАЛУ ↓', X(21), 2.2, E(32) + 1.9, Math.PI, 1.8, 0.4, { bg: '#303a30', fg: '#e0e0c0' });
    },
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 2], ['wait', 1.2],
          ['say', 'barney', 'Гордон! Эй, Гордон! Лови!', 2],
          ['do', gm => { const it = gm.spawnItem('weapon_crowbar', X(5), E(1) + 1.6, { y: 4.9 }); it.vel = { x: 0, y: 3, z: 4.5 }; }],
          ['sound', 'throw'], ['wait', 1],
          ['say', 'barney', 'Кажется, это твоё. Мне пора, пока меня не хватились. Иди к каналам, там наши!', 4],
          ['remove', 'barney'], ['sound', 'door'], ['wait', 2],
          ['group', 'yardcops'], ['sayq', 'metrocop', 'Вот он! Взять его!', 2], ['hint', 'ЛКМ — удар монтировкой. Ящики тоже можно разбивать', 6]
        ]
      },
      { id: 'warehouse', when: { zone: 'warehouse' }, steps: [['npc', 'wcops', 'hate'], ['sayq', 'metrocop', 'Подозреваемый на складе!', 2]] },
      {
        id: 'canal', when: { zone: 'canal' }, steps: [
          ['group', 'canalcops'], ['music', 'action'], ['sayq', 'metrocop', 'Нарушитель в канале! Огонь на поражение!', 2.5], ['autosave']
        ]
      },
      {
        id: 'sludge', when: g => g.player.pos.z > E(12) && g.player.pos.x > E(52) && g.player.pos.y < -1, steps: [
          ['hint', 'Кислотная жижа! Прыгайте по ящикам', 4]
        ]
      },
      {
        id: 'seesaw', when: { zone: 'seesawzone' }, steps: [
          ['hint', 'Нагрузите короткий конец доски бетонными блоками (E — поднять)', 7]
        ]
      },
      { id: 'ledge', when: { zone: 'ledge' }, steps: [['music', 'tension'], ['autosave']] },
      {
        id: 'hacks', when: { zone: 'hackroom' }, steps: [
          ['say', 'metrocop', 'Выпускаю мэнхэки!', 1.6], ['sound', 'manhack'], ['group', 'hacks'], ['npc', 'hackcop', 'hate'],
          ['hint', 'Мэнхэка можно сбить монтировкой', 4],
          ['until', { dead: 'hacks' }], ['wait', 1],
          ['sound', 'door'], ['door', 'hidedoor', 'open'], ['say', 'rebel', 'Эй! Сюда, быстрее, пока не прислали ещё!', 2.6]
        ]
      },
      {
        id: 'hideout', when: { zone: 'hideout' }, steps: [
          ['npc', 'vort', 'face', 'player'],
          ['say', 'vort', 'Свободный человек пришёл. Вортигонты приветствуют тебя.', 3.2],
          ['npc', 'rebel1', 'face', 'player'],
          ['say', 'rebel', 'Так ты и есть Фримен? Лодка у причала. Держись каналов, они выведут тебя к Восточной Чёрной Мезе.', 5],
          ['autosave'], ['hint', 'Выход к причалу в юго-западном углу', 5]
        ]
      },
      { id: 'dock', when: { zone: 'dock' }, steps: [['changelevel', 'c04']] }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
