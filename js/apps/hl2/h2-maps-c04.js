(function (H) {
  'use strict';
  const { X, E, grid, zc, lamp, wallX, wallZ } = H.MU;

  const g = grid(64, 48, 'V');
  g.rect('b', 1, 1, 44, 6);
  g.rect('w', 7, 2, 40, 5);
  g.rect('b', 36, 6, 44, 20);
  g.rect('w', 37, 6, 40, 20);
  g.rect('h', 41, 12, 44, 16);
  g.rect('b', 25, 20, 45, 20);
  g.rect('w', 37, 20, 40, 20);
  g.rect('w', 26, 21, 44, 29);
  g.rect('b', 25, 21, 25, 30);
  g.rect('b', 45, 21, 45, 30);
  g.rect('X', 26, 30, 44, 30);
  g.rect('w', 14, 31, 44, 34);
  g.rect('b', 8, 31, 13, 38);
  g.rect('i', 9, 35, 12, 37);
  g.rect('w', 14, 35, 24, 35);
  g.rect('w', 14, 36, 60, 46);
  g.rect('b', 45, 31, 60, 35);
  g.rect('w', 61, 40, 63, 43);

  const cages = [[E(29) + 1, E(25), E(32) + 1, E(29)], [E(39) - 1, E(25), E(42) - 1, E(29)]];

  H.maps.c04 = {
    id: 'c04', chapter: 3, music: 'action',
    env: { sky: 'city', fog: [0.55, 0.6, 0.6], fogNear: 40, fogFar: 190, ambient: [0.54, 0.56, 0.56], indoorAmbient: [0.22, 0.22, 0.22], sun: { dir: [-0.5, -1, 0.2], col: [0.6, 0.58, 0.5] } },
    legend: {
      'V': { f: 11, w: 'facade3', rt: 'roof' },
      'b': { f: 0.5, t: 'concrete', w: 'concrete_dark' },
      'w': { f: -3, t: 'mud', w: 'concrete_dark', wl: -0.6, wt: 'water' },
      'h': { f: 0.5, c: 3.5, top: 4, t: 'concrete', w: 'combine', ct: 'metal', rt: 'roof_tin' },
      'X': { f: 1.2, w: 'combine_wall', rt: 'combine_floor' },
      'i': { f: 0.5, c: 3.3, top: 4, t: 'planks', w: 'planks', ct: 'planks', rt: 'roof_tin' }
    },
    grid: g.rows(),
    start: { x: X(5), z: X(3), yaw: Math.PI / 2 },
    menuCam: { x: X(30), z: X(40), y: 2, yaw: Math.PI / 2 },
    build(b) {
      b.vehicle('airboat', X(8) + 1, X(3) + 1, Math.PI / 2, { id: 'boat' });
      b.npc('rebel', X(3), X(2), { id: 'dockrebel', passive: true, yaw: Math.PI / 2, lines: ['Жми на газ и не останавливайся под мостами.'] });
      b.item('battery', X(2), X(5), {});
      b.item('ammo_smg', X(3), X(5), {});
      lamp(b, X(4), X(1) + 0.5, 0);
      b.box(E(18), 2.5, E(1), E(20), 3.0, E(7), 'metal_rust', { top: 'grate' });
      b.box(E(18), 3.0, E(1), E(18) + 0.1, 4.0, E(7), 'grate', { solid: false });
      b.box(E(20) - 0.1, 3.0, E(1), E(20), 4.0, E(7), 'grate', { solid: false });
      for (const r of [1, 6]) b.box(E(18) + 1.5, 0.5, E(r) + 0.5, E(18) + 2.5, 2.5, E(r) + 1.5, 'concrete');
      b.npc('metrocop_pistol', X(18) + 0.5, X(2), { group: 'bridgecops', tag: 'bridgecops', y: 3, hate: true, stay: true });
      b.npc('metrocop_pistol', X(19) - 0.5, X(5), { group: 'bridgecops', tag: 'bridgecops', y: 3, hate: true, stay: true });
      b.npc('manhack', X(28), X(3), { group: 'canalhacks', tag: 'canalhacks', y: 1.5, hate: true });
      b.npc('manhack', X(29), X(4), { group: 'canalhacks', tag: 'canalhacks', y: 1.8, hate: true });
      zc(b, 'canalA', 12, 2, 16, 5);
      zc(b, 'canalA2', 24, 2, 28, 5);
      b.prop('barrel_red', X(33), X(1), { y: 0.5 });
      b.prop('barrel_red', X(30), X(6), { y: 0.5 });
      b.prop('crate', X(35), X(1), { y: 0.5, contains: 'healthvial' });
      b.ramp(E(31), E(3), E(34), E(5), -1.2, 0.4, 'x+', 'metal_rust', { base: -3 });
      b.model('boat', E(36) + 1, -1.6, X(4), Math.PI / 2 + 0.3);
      for (const c of [10, 24, 34]) lamp(b, X(c), X(6), Math.PI);
      b.door('cgate', E(37), -3, E(14) + 0.8, E(41), 1.6, E(14) + 1.2, { tex: 'gate', move: [0, 4.6, 0], speed: 0.4, locked: true });
      b.box(E(36), 1.6, E(14) + 0.6, E(41) + 0.5, 2.3, E(14) + 1.4, 'combine');
      zc(b, 'gatearea', 37, 8, 40, 13);
      b.ladder(E(41) - 0.25, X(11) - 0.4, E(41) - 0.05, X(11) + 0.4, -3, 0.9);
      b.sign('↑', E(41) - 0.02, 1.4, X(11), -Math.PI / 2, 0.5, 0.5, { bg: '#303a30', fg: '#e0e0c0' });
      zc(b, 'hut', 41, 12, 44, 16);
      b.light(X(43), 3.2, X(14), 0.6, 0.8, 1, 7);
      b.button('gatebtn', X(44) + 0.8, 1.6, X(14), -Math.PI / 2);
      b.model('console', X(44) + 0.4, 0.5, X(13), -Math.PI / 2, { solid: [0.3, 1, 0.6] });
      b.npc('soldier', X(43), X(15), { tag: 'hutguard', yaw: -Math.PI / 2 });
      b.npc('soldier', X(42), X(9), { tag: 'hutguard', yaw: Math.PI });
      b.item('ammo_smg', X(43), X(16), {});
      b.item('healthkit', X(44), X(16), {});
      b.item('weapon_magnum', X(44), X(12), {});
      zc(b, 'basinN', 37, 18, 40, 22);
      b.box(E(33) + 0.4, -3, E(24), E(34), 0.7, E(30), 'concrete_dark');
      b.box(E(37), -3, E(24), E(37) + 1.6, 0.7, E(30), 'concrete_dark');
      b.floatramp('ramp1', E(34), E(24), E(37), E(30), -2.2, 2.2, { axis: 'z', yTop: -0.75, highEnd: -1, need: 3, cages, tex: 'metal_rust' });
      for (const c of cages) {
        b.box(c[0], -3, c[1], c[0] + 0.25, 0.1, c[1] + 0.25, 'hazard');
        b.box(c[2] - 0.25, -3, c[1], c[2], 0.1, c[1] + 0.25, 'hazard');
        b.box(c[0], -3, c[3] - 0.25, c[0] + 0.25, 0.1, c[3], 'hazard');
        b.box(c[2] - 0.25, -3, c[3] - 0.25, c[2], 0.1, c[3], 'hazard');
      }
      b.prop('barrel_float', X(30), X(23), { y: -1 });
      b.prop('barrel_float', X(41), X(22), { y: -1 });
      b.prop('barrel_float', X(29), X(26), { y: -1 });
      b.prop('barrel_float', X(42), X(26), { y: -1 });
      b.sign('ПОПЛАВКИ → В ЗАГОНЫ', X(35), 2.4, E(30) - 0.02, Math.PI, 3.6, 0.5, { bg: '#303a30', fg: '#f0d060' });
      zc(b, 'basin', 26, 21, 44, 29);
      b.path('chop1', [[X(38), X(10), 13], [X(35), X(24), 12], [X(28), X(28), 12], [X(40), X(26), 12]]);
      b.path('chop2', [[X(20), X(33), 13], [X(30), X(40), 14], [X(48), X(43), 13], [X(56), X(38), 14], [X(40), X(37), 12], [X(24), X(44), 13]]);
      b.npc('hunterchopper', X(40), X(4), { group: 'chopper', id: 'chopper', y: 14, airPath: 'chop1', hate: true });
      zc(b, 'canalC', 26, 31, 44, 34);
      zc(b, 'outpost', 14, 31, 18, 35);
      b.light(X(10), 3, X(36), 1, 0.8, 0.5, 7);
      wallX(b, E(9), E(13), E(35), 0.5, 3.8, 'planks', [[E(11), E(12), 2.8]]);
      wallX(b, E(9), E(13), E(38), 0.5, 3.8, 'planks');
      wallZ(b, E(35), E(38), E(9), 0.5, 3.8, 'planks');
      wallZ(b, E(35), E(38), E(13), 0.5, 3.8, 'planks');
      b.npc('vort', X(12), X(33), { id: 'vort', yaw: Math.PI / 2, passive: true, lines: ['Мы усилили лодку. Энергия течёт верно.'] });
      b.npc('rebel', X(11), X(31), { id: 'oprebel', passive: true, yaw: Math.PI / 2, lines: ['Вертолёт видишь? Стреляй, пока не перегреется ствол.'] });
      b.charger('health', X(9), 1.7, E(35) + 0.12, 0);
      b.charger('suit', X(11), 1.7, E(35) + 0.12, 0);
      b.item('ammo_smg', X(9), X(32), {});
      b.item('battery', X(10), X(32), {});
      b.sign('λ', X(10), 2.6, E(38) - 0.02, Math.PI, 0.8, 0.8, { bg: '#303030', fg: '#e07818' });
      b.cache(E(9), E(35), E(13), E(38));
      zc(b, 'reservoir', 14, 36, 60, 46);
      b.model('tank', X(52), 0.5, X(33), 0);
      b.box(X(52) - 3, 0.5, X(33) - 3, X(52) + 3, 6.5, X(33) + 3, 'metal', { visible: false });
      b.model('crane', X(47), 0.5, X(33), 0);
      b.box(X(47) - 0.5, 0.5, X(33) - 0.5, X(47) + 0.5, 18, X(33) + 0.5, 'metal', { visible: false });
      for (const [c, r] of [[20, 40], [30, 44], [42, 39], [52, 44]]) b.box(E(c), -3, E(r), E(c) + 2, 0.2, E(r) + 2, 'concrete');
      b.prop('barrel_red', X(46), X(32), { y: 0.5 });
      b.door('damgate', E(61), -3, E(40), E(61) + 0.4, 3, E(44), { tex: 'gate', move: [0, 6, 0], speed: 0.4, locked: true });
      zc(b, 'exit', 62, 40, 63, 43);
    },
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 3], ['npc', 'dockrebel', 'face', 'player'],
          ['say', 'rebel', 'Вот твоя лодка. Каналы выведут тебя к Восточной Чёрной Мезе. Не останавливайся под мостами.', 4.4],
          ['hint', 'E — сесть в лодку. W/S — газ и тормоз, A/D — поворот, мышь — обзор', 7]
        ]
      },
      { id: 'bridge', when: { zone: 'canalA' }, steps: [['group', 'bridgecops'], ['sayq', 'metrocop', 'Цель на воде! Огонь!', 2]] },
      { id: 'hacks', when: { zone: 'canalA2' }, steps: [['group', 'canalhacks']] },
      {
        id: 'gate', when: { zone: 'gatearea' }, steps: [
          ['npc', 'hutguard', 'hate'], ['hint', 'Ворота закрыты. Выйдите из лодки (E), поднимитесь по лестнице и найдите пульт', 7]
        ]
      },
      {
        id: 'gateopen', when: { btn: 'gatebtn' }, steps: [
          ['door', 'cgate', 'open'], ['sound', 'alarm'], ['say', 'overwatch', 'Внимание: несанкционированное открытие шлюза. Высылается воздушная поддержка.', 4], ['autosave']
        ]
      },
      {
        id: 'chopper', when: { all: [{ btn: 'gatebtn' }, { zone: 'basinN' }] }, steps: [
          ['group', 'chopper'], ['music', 'action'], ['say', 'radio', 'Фримен, это Одесса! На тебя вышел вертолёт-охотник. Не останавливайся!', 4],
          ['hint', 'Пандус поднимут поплавки: загоните синие бочки в загоны у стены', 7]
        ]
      },
      {
        id: 'ramp', when: g => g.surfaces.some(s => s.id === 'ramp1' && s.yEnd > 1.5), steps: [
          ['hint', 'Пандус поднят! Разгонитесь и прыгайте через стену', 5]
        ]
      },
      {
        id: 'outpost', when: { zone: 'outpost' }, steps: [
          ['npc', 'vort', 'face', 'player'], ['say', 'vort', 'Свободный человек. Мы дадим твоей лодке жало против летающего врага.', 3.6],
          ['sound', 'vort_zap'], ['wait', 1.5],
          ['do', gm => { const v = gm.vehicles.find(x => x.type === 'airboat'); if (v) v.gun = true; gm.fx.spark(v ? v.pos : gm.player.pos, 20, [0.5, 1, 0.6]); }],
          ['sound', 'pickup_battery'], ['hint', 'На лодке установлена импульсная пушка: ЛКМ — огонь, следите за перегревом', 7],
          ['autosave']
        ]
      },
      {
        id: 'boss', when: { all: [{ zone: 'reservoir' }, { flag: 'btn:gatebtn' }] }, steps: [
          ['do', gm => { if (!gm.npcById('chopper')) gm.spawnGroup('chopper'); }],
          ['npc', 'chopper', 'path', 'chop2', false, true],
          ['until', { dead: 'chopper' }], ['wait', 2],
          ['say', 'radio', 'Отличная работа! Открываем для тебя шлюз плотины.', 3], ['door', 'damgate', 'open'], ['music', 'coast'], ['autosave']
        ]
      },
      { id: 'exit', when: { zone: 'exit' }, steps: [['changelevel', 'c05']] }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
