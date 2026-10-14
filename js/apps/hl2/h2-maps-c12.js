(function (H) {
  'use strict';
  const { X, E, grid, zc, lamp } = H.MU;

  const g = grid(64, 46, 'W');
  g.rect('o', 1, 1, 62, 44);
  g.rect('V', 8, 8, 14, 14);
  g.rect('V', 26, 6, 32, 11);
  g.rect('V', 44, 9, 51, 15);
  g.rect('V', 10, 24, 15, 30);
  g.rect('V', 30, 22, 36, 28);
  g.rect('V', 48, 26, 55, 32);
  g.rect('x', 18, 16, 24, 21);
  g.rect('x', 38, 32, 44, 37);
  g.rect('x', 55, 17, 60, 21);
  g.rect('N', 26, 38, 38, 44);
  g.rect('n', 27, 39, 37, 43);
  g.rect('n', 31, 38, 33, 38);
  g.rect('W', 1, 1, 62, 2);
  g.rect('o', 30, 1, 34, 2);

  H.maps.c12 = {
    id: 'c12', chapter: 11, music: 'finale',
    env: { sky: 'dusk', fog: [0.55, 0.46, 0.4], fogNear: 40, fogFar: 190, ambient: [0.56, 0.5, 0.46], indoorAmbient: [0.22, 0.22, 0.24], sun: { dir: [0.5, -0.7, -0.3], col: [0.85, 0.62, 0.45] } },
    legend: {
      'W': { f: 20, w: 'facade', rt: 'roof' },
      'V': { f: 12, w: 'facade3', rt: 'roof' },
      'N': { f: 9, w: 'combine_wall', rt: 'combine_floor' },
      'n': { f: 0, c: 5, top: 9, t: 'combine_floor', w: 'combine', ct: 'metal' },
      'o': { f: 0, t: 'asphalt', w: 'concrete' },
      'x': { f: 0, t: 'rubble', w: 'concrete' }
    },
    grid: g.rows(),
    start: { x: X(32), z: X(35), yaw: Math.PI },
    menuCam: { x: X(22), z: X(34), y: 2, yaw: Math.PI * 0.8 },
    build(b) {
      b.npc('barney', X(33), X(36), { id: 'barney', tag: 'squad', squad: true, follow: true });
      b.npc('rebel', X(30), X(36), { tag: 'squad', squad: true, follow: true });
      b.npc('rebel_rpg', X(31), X(37), { tag: 'squad', squad: true, follow: true });
      b.npc('medic', X(34), X(37), { tag: 'squad', squad: true, follow: true });
      b.charger('rockets', X(28), 0.5, X(36), Math.PI / 2);
      b.charger('rockets', X(40), 0.5, X(12), -Math.PI / 2);
      b.charger('rockets', X(18), 0.5, X(20), 0);
      b.item('healthkit', X(29), X(34), {});
      b.item('battery', X(30), X(34), {});
      for (const [c, r] of [[5, 18], [22, 38], [60, 30], [40, 20], [16, 5], [56, 6]]) lamp(b, X(c), X(r), c % 2 ? 0 : Math.PI);
      for (const [c, r, a] of [[20, 18, 0.3], [41, 34, 2], [57, 19, 1.1], [24, 30, 2.4], [46, 22, 0.5]]) {
        b.model('wreck', X(c), 0, X(r), a, { solid: [1.2, 1.4, 1.8] });
        b.hazard('fire' + c + r, X(c) - 0.6, 0.6, X(r) - 0.6, X(c) + 0.6, 1.8, X(r) + 0.6, 'fire');
        b.light(X(c), 2, X(r), 1, 0.5, 0.2, 9);
      }
      for (const [c, r] of [[25, 33], [38, 30], [20, 12], [42, 18], [8, 20], [55, 36]]) b.model('sandbags', X(c), 0, X(r), (c + r) * 0.3, { solid: [1.2, 0.75, 1.2] });
      zc(b, 'nexus', 26, 38, 38, 44);
      b.path('st1', [[X(20), X(6)], [X(6), X(20)], [X(20), X(20)], [X(24), X(4)]]);
      b.path('st2', [[X(56), X(22)], [X(42), X(4)], [X(58), X(10)], [X(40), X(20)]]);
      b.npc('strider', X(18), X(4), { id: 'strider1', tag: 'striders', group: 'striders', patrol: 'st1' });
      b.npc('strider', X(58), X(8), { id: 'strider2', tag: 'striders', group: 'striders', patrol: 'st2' });
      b.path('gs', [[X(10), X(36), 20], [X(32), X(20), 22], [X(54), X(38), 20], [X(32), X(8), 22]]);
      b.npc('gunship', X(60), X(40), { id: 'gunship', group: 'gunship', y: 22, airPath: 'gs', hate: true });
      for (const [t, c, r] of [['soldier', 20, 22], ['soldier', 24, 17], ['elite', 42, 20], ['soldier_shotgun', 47, 18], ['soldier', 16, 32], ['soldier', 52, 22]]) b.npc(t, X(c), X(r), { group: 'plazasol', tag: 'plazasol', hate: true });
      b.sign('λ', X(10) + 0.2, 2.2, E(24) - 0.05, Math.PI, 0.8, 0.8, { bg: '#303030', fg: '#e07818' });
      b.cache(E(9), E(22), E(12), E(24));
      b.item('ammo_ar2ball', X(10), X(23), {});
      b.item('healthkit', X(11), X(23), {});
      b.sign('ЦИТАДЕЛЬ →', X(27), 4, E(3) + 0.02, 0, 3, 0.6, { bg: '#20303c', fg: '#e0e8f0' });
      b.door('citadelgate', E(30), 0, E(2) + 0.9, E(35), 6, E(2) + 1.1, { tex: 'combine_wall', locked: true, move: [0, 5.9, 0], speed: 0.3 });
      zc(b, 'exit', 30, 1, 34, 1);
    },
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 11], ['group', 'striders'], ['group', 'plazasol'], ['music', 'finale'],
          ['say', 'barney', 'Нексус за нами! Гордон, два страйдера на площади. Ракетные ящики расставлены по укрытиям.', 4.4],
          ['say', 'barney', 'Каждому страйдеру нужно штук семь ракет. Мы тебя прикроем. За Фримена!', 3.6],
          ['hint', 'Ракету ведёт лазерная точка: держите прицел на цели до попадания', 7],
          ['until', { dead: 'striders' }], ['say', 'barney', 'Оба готовы! Ура-а-а!', 2],
          ['wait', 3], ['group', 'gunship'], ['sayq', 'rebel', 'Канонерка! Справа!', 2],
          ['until', { dead: 'gunship' }], ['wait', 1.5],
          ['say', 'barney', 'Путь к Цитадели открыт. Дальше, Гордон, ты один. Мы удержим площадь.', 4],
          ['say', 'barney', 'И это... береги себя. Пиво за мной.', 2.4],
          ['door', 'citadelgate', 'open'], ['autosave'], ['hint', 'Ворота к Цитадели открыты (север)', 5]
        ]
      },
      { id: 'exit', when: { all: [{ zone: 'exit' }, g => g.doors.find(d => d.id === 'citadelgate').open] }, steps: [['changelevel', 'c13']] }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
