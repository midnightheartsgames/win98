(function (H) {
  'use strict';
  const { X, E, grid, zc, lamp, ceilingLight, wallX, wallZ, crates } = H.MU;

  const g = grid(64, 40, 'W');
  g.rect('k', 1, 17, 4, 21);
  g.rect('o', 5, 15, 30, 23);
  g.rect('x', 9, 16, 12, 18);
  g.rect('x', 20, 19, 24, 22);
  g.rect('V', 14, 10, 20, 14);
  g.rect('V', 24, 24, 30, 30);
  g.rect('a', 31, 13, 40, 25);
  g.rect('o', 41, 8, 62, 31);
  g.rect('x', 46, 14, 50, 18);
  g.rect('x', 55, 20, 59, 23);
  g.rect('V', 48, 22, 52, 26);
  g.rect('W', 5, 15, 5, 23);
  g.rect('k', 5, 18, 5, 19);

  H.maps.c11 = {
    id: 'c11', chapter: 10, music: 'action',
    env: { sky: 'dusk', fog: [0.52, 0.44, 0.4], fogNear: 30, fogFar: 150, ambient: [0.55, 0.48, 0.45], indoorAmbient: [0.22, 0.2, 0.2], sun: { dir: [0.6, -0.8, 0.3], col: [0.8, 0.6, 0.45] } },
    legend: {
      'W': { f: 18, w: 'facade', rt: 'roof' },
      'V': { f: 14, w: 'facade2', rt: 'roof' },
      'k': { f: 0, c: 3.4, top: 18, t: 'tile_lab', w: 'lab_wall', ct: 'plaster_white' },
      'o': { f: 0, t: 'asphalt', w: 'concrete' },
      'x': { f: 0, t: 'rubble', w: 'concrete' },
      'a': { f: 0, c: 4, top: 18, t: 'wood_floor', w: 'wallpaper', ct: 'plaster_white' }
    },
    grid: g.rows(),
    start: { x: X(2), z: X(19), yaw: Math.PI / 2 },
    menuCam: { x: X(20), z: X(18), y: 1.7, yaw: Math.PI / 2 },
    build(b) {
      ceilingLight(b, X(2), 3.35, X(19), [0.95, 1, 1], 7);
      b.npc('alyx', X(3), X(18), { id: 'alyx', passive: true, yaw: Math.PI / 2 });
      b.door('labexit', E(5) + 0.9, 0, E(18), E(5) + 1.1, 2.8, E(20), { tex: 'door_metal', auto: true });
      for (const [c, r] of [[7, 16], [9, 22]]) b.npc('rebel', X(c), X(r), { tag: 'squadA', squad: true, follow: true });
      b.npc('medic', X(8), X(20), { tag: 'squadA', squad: true, follow: true });
      for (const [c, r, a] of [[10, 17, 0.4], [22, 20, 1.3], [44, 16, 2.2], [57, 21, 0.1]]) {
        b.model('wreck', X(c), 0, X(r), a, { solid: [1.2, 1.4, 1.8] });
        b.hazard('fire' + c, X(c) - 0.6, 0.6, X(r) - 0.6, X(c) + 0.6, 1.8, X(r) + 0.6, 'fire');
        b.light(X(c), 2, X(r), 1, 0.5, 0.2, 9);
      }
      for (const [c, r] of [[13, 15], [27, 23], [45, 9], [60, 30]]) b.model('barricade', X(c), 0, X(r), (c * 0.7) % 3);
      b.model('sandbags', X(16), 0, X(20), 0.2, { solid: [1.2, 0.75, 0.3] });
      b.model('sandbags', X(26), 0, X(17), -0.3, { solid: [1.2, 0.75, 0.3] });
      for (const [c, r] of [[8, 15], [18, 23], [28, 15]]) lamp(b, X(c), X(r), r > 18 ? Math.PI : 0);
      crates(b, X(12), X(22), 2, { loot: ['ammo_smg', 'healthvial'] });
      b.prop('barrel_red', X(19), X(16), {});
      b.prop('barrel_red', X(27), X(20), {});
      zc(b, 'streetA', 10, 15, 30, 23);
      for (const [t, c, r] of [['soldier', 24, 17], ['soldier', 27, 21], ['soldier_shotgun', 29, 16], ['manhack', 25, 19], ['manhack', 26, 18]]) b.npc(t, X(c), X(r), { group: 'sA', tag: 'sA', hate: true, y: t === 'manhack' ? 1.5 : undefined });
      zc(b, 'building', 31, 13, 40, 25);
      for (const [c, r] of [[33, 15], [38, 15], [33, 23], [38, 23], [35, 19]]) ceilingLight(b, X(c), 3.95, X(r), [1, 0.85, 0.6], 7);
      wallZ(b, E(13), E(26), E(35), 0, 4, 'wallpaper', [[E(15), E(16), 2.5], [E(22), E(23), 2.5]]);
      wallX(b, E(35), E(41), E(19), 0, 4, 'wallpaper', [[E(37), E(38), 2.5]]);
      b.prop('table', X(33), X(20), {});
      b.prop('fridge', X(31), X(14), {});
      b.prop('tv', X(39), X(24), {});
      b.prop('chair', X(34), X(21), {});
      b.item('healthkit', X(32), X(24), {});
      b.item('battery', X(39), X(14), {});
      b.npc('soldier', X(37), X(16), { tag: 'bldg', passive: true });
      b.npc('elite', X(38), X(22), { tag: 'bldg', passive: true });
      b.npc('citizen', X(32), X(16), { yaw: 1, lines: ['Они ушли на площадь. Там страйдер!'] });
      b.sign('λ', X(39) + 0.9, 2.2, X(25), -Math.PI / 2, 0.8, 0.8, { bg: '#303030', fg: '#e07818' });
      b.cache(E(38), E(24), E(41), E(26));
      b.item('ammo_ar2', X(39), X(25), {});
      b.item('ammo_grenade', X(40), X(25), {});
      zc(b, 'plaza', 41, 8, 62, 31);
      b.path('strider1', [[X(60), X(10)], [X(46), X(11)], [X(44), X(20)], [X(60), X(12)]]);
      b.npc('strider', X(62), X(10), { group: 'strider', id: 'strider', patrol: 'strider1' });
      b.npc('soldier', X(52), X(12), { group: 'plazasol', tag: 'plazasol', hate: true });
      b.npc('soldier', X(58), X(16), { group: 'plazasol', tag: 'plazasol', hate: true });
      b.npc('elite', X(54), X(18), { group: 'plazasol', tag: 'plazasol', hate: true });
      b.model('statue', X(52), 0, X(20), 0);
      zc(b, 'barney', 54, 26, 62, 31);
      b.npc('barney', X(58), X(29), { id: 'barney', passive: true, yaw: Math.PI });
      b.npc('rebel_rpg', X(56), X(30), { tag: 'squadB', passive: true });
      b.npc('rebel', X(61), X(28), { tag: 'squadB', passive: true });
      b.charger('rockets', X(60), 0.5, X(30), Math.PI);
      b.item('weapon_rpg', X(59), X(28), {});
      b.model('sandbags', X(57), 0, X(26), 0, { solid: [1.2, 0.75, 0.3] });
      b.model('sandbags', X(61), 0, X(26), 0, { solid: [1.2, 0.75, 0.3] });
      zc(b, 'exit', 61, 8, 62, 10);
    },
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 10], ['npc', 'alyx', 'face', 'player'],
          ['say', 'kleiner', 'Гордон! Аликс! Вы пропали на целую неделю! Телепорт... ох, неважно. Город восстал!', 4.6],
          ['say', 'alyx', 'Неделю?! Гордон, я к доктору Кляйнеру. Встретимся у Цитадели. Не дай себя убить.', 4.2],
          ['remove', 'alyx'], ['music', 'action'],
          ['hint', 'E — принять повстанца в отряд. G — отправить отряд в точку прицела или отозвать', 8]
        ]
      },
      { id: 'streetA', when: { zone: 'streetA' }, steps: [['group', 'sA'], ['sayq', 'rebel', 'Альянс впереди! В укрытие!', 2]] },
      { id: 'building', when: { zone: 'building' }, steps: [['npc', 'bldg', 'passive', false], ['npc', 'bldg', 'hate'], ['autosave']] },
      {
        id: 'plaza', when: { zone: 'plaza' }, steps: [
          ['group', 'strider'], ['group', 'plazasol'], ['sound', 'strider_charge'],
          ['sayq', 'rebel', 'Страйдер!!! Все в укрытие!', 2.4], ['hint', 'Страйдера не взять пулями. Пробирайтесь к баррикаде повстанцев на юго-востоке', 7]
        ]
      },
      {
        id: 'barney', when: { zone: 'barney' }, steps: [
          ['npc', 'barney', 'face', 'player'],
          ['say', 'barney', 'Гордон! Ну наконец-то! Помнишь, я обещал тебе пиво? Кажется, придётся подождать.', 4.4],
          ['say', 'barney', 'Держи ракетницу. Ящик с ракетами бездонный, бери сколько нужно. Страйдеры рухнут, если хорошенько вмазать.', 5],
          ['npc', 'squadB', 'passive', false], ['npc', 'squadB', 'squad'], ['npc', 'barney', 'passive', false],
          ['say', 'barney', 'Нексус Надзора дальше по проспекту. Давай, веди нас. Все за Фрименом!', 3.6],
          ['autosave'], ['hint', 'Выход к проспекту на северо-востоке площади', 5]
        ]
      },
      { id: 'exit', when: { all: [{ zone: 'exit' }, g => !!g.player.weapons.rpg] }, steps: [['changelevel', 'c12']] }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
