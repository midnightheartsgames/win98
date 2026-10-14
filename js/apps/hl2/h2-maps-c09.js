(function (H) {
  'use strict';
  const { X, E, grid, zc, lamp, ceilingLight, wallX, wallZ, crates } = H.MU;

  const g = grid(60, 36, 'W');
  g.rect('y', 1, 8, 19, 30);
  g.rect('s', 3, 11, 8, 18);
  g.rect('s', 10, 23, 16, 28);
  g.rect('T', 12, 9, 13, 10);
  g.rect('T', 12, 27, 13, 28);
  g.rect('G', 15, 2, 20, 7);
  g.rect('g', 16, 3, 19, 6);
  g.set('g', 17, 7);
  g.rect('y', 20, 18, 20, 20);
  g.rect('c', 21, 18, 30, 20);
  g.rect('B', 31, 6, 48, 32);
  g.rect('k', 50, 15, 57, 22);
  g.rect('k', 49, 18, 49, 19);

  H.maps.c09 = {
    id: 'c09', chapter: 8, music: 'tension',
    env: { sky: 'storm', fog: [0.46, 0.5, 0.52], fogNear: 30, fogFar: 150, ambient: [0.46, 0.48, 0.5], indoorAmbient: [0.2, 0.21, 0.22], sun: { dir: [0.2, -1, 0.4], col: [0.45, 0.46, 0.46] } },
    legend: {
      'W': { f: 12, w: 'concrete_dark', rt: 'combine_floor' },
      'y': { f: 0, t: 'dirt', w: 'concrete_dark' },
      's': { f: 0, t: 'sand', w: 'concrete_dark', sand: true },
      'T': { f: 6, w: 'combine_wall', rt: 'combine_floor' },
      'G': { f: 5, w: 'concrete', rt: 'roof' },
      'g': { f: 0, c: 3.5, top: 5, t: 'concrete', w: 'plaster_blue', ct: 'metal' },
      'c': { f: 0, c: 4, top: 12, t: 'tile', w: 'plaster_blue', ct: 'metal' },
      'B': { f: 0, c: 9, top: 12, t: 'concrete', w: 'plaster_blue', ct: 'metal' },
      'k': { f: 0, c: 4, top: 12, t: 'combine_floor', w: 'combine', ct: 'metal' }
    },
    grid: g.rows(),
    start: { x: X(2), z: X(20), yaw: Math.PI / 2 },
    menuCam: { x: X(40), z: X(30), y: 5.8, yaw: Math.PI },
    build(b) {
      b.npc('soldier', X(12) + 1, X(9) + 1, { group: 'towers', tag: 'yard', y: 6, hate: true, stay: true });
      b.npc('soldier', X(12) + 1, X(27) + 1, { group: 'towers', tag: 'yard', y: 6, hate: true, stay: true });
      b.npc('soldier', X(15), X(15), { group: 'towers', tag: 'yard', hate: true });
      b.npc('soldier_shotgun', X(17), X(24), { group: 'towers', tag: 'yard', hate: true });
      b.npc('turret', X(18), X(19), { group: 'towers', tag: 'yardturret', yaw: -Math.PI / 2 });
      for (const [c, r] of [[5, 9], [18, 12], [5, 29], [18, 29]]) lamp(b, X(c), X(r), r > 20 ? Math.PI : 0, [0.8, 0.9, 1]);
      b.prop('barrel_red', X(10), X(12), {});
      b.prop('crate', X(3), X(26), { contains: 'healthvial' });
      b.prop('crate', X(4), X(27), { contains: 'ammo_ar2' });
      b.model('sandbags', X(16), 0, X(17), Math.PI / 2, { solid: [0.3, 0.75, 1.2] });
      zc(b, 'yard', 1, 8, 19, 30);
      zc(b, 'gatehouse', 16, 3, 19, 6);
      b.light(X(17), 3.4, X(4), 0.7, 0.85, 1, 7);
      b.button('gatebtn', X(19) + 0.85, 1.4, X(4), -Math.PI / 2);
      b.model('console', X(16) + 0.2, 0, X(5), Math.PI / 2, { solid: [0.3, 1, 0.6] });
      b.item('ammo_ar2', X(18), X(5), {});
      b.item('battery', X(18), X(6), {});
      b.door('maingate', E(20) + 0.8, 0, E(18), E(20) + 1.2, 6, E(21), { tex: 'combine_wall', locked: true, move: [0, 5.8, 0], speed: 0.35 });
      b.sign('НОВА ПРОСПЕКТ', X(20) - 1.05, 8, X(19), -Math.PI / 2, 6, 1, { bg: '#1c2830', fg: '#e8f0f0' });
      ceilingLight(b, X(24), 3.95, X(19), [0.85, 0.95, 1], 8);
      ceilingLight(b, X(28), 3.95, X(19), [0.85, 0.95, 1], 8);
      zc(b, 'block', 31, 6, 48, 32);
      for (let r = 8; r <= 30; r += 5) { ceilingLight(b, X(39), 8.95, X(r), [0.85, 0.95, 1], 13); }
      for (let r = 6; r <= 30; r += 3) {
        wallX(b, E(31), E(35), E(r), 0, 3.8, 'plaster_blue');
        wallX(b, E(45), E(49), E(r), 0, 3.8, 'plaster_blue');
      }
      wallZ(b, E(6), E(33), E(35), 0, 3.8, 'grate', [[E(7) + 0.5, E(8) + 0.5, 2.4], [E(13) + 0.5, E(14) + 0.5, 2.4], [E(19) + 0.5, E(20) + 0.5, 2.4], [E(25) + 0.5, E(26) + 0.5, 2.4], [E(27) + 0.5, E(28) + 0.5, 2.4]]);
      wallZ(b, E(6), E(33), E(45), 0, 3.8, 'grate', [[E(10) + 0.5, E(11) + 0.5, 2.4], [E(16) + 0.5, E(17) + 0.5, 2.4], [E(22) + 0.5, E(23) + 0.5, 2.4], [E(28) + 0.5, E(29) + 0.5, 2.4]]);
      b.box(E(35), 3.8, E(6), E(37), 4.2, E(33), 'grate', { top: 'grate', bottom: 'metal' });
      b.box(E(43), 3.8, E(6), E(45), 4.2, E(33), 'grate', { top: 'grate', bottom: 'metal' });
      b.box(E(37) - 0.05, 4.2, E(6), E(37) + 0.05, 5.2, E(28), 'metal');
      b.box(E(43) - 0.05, 4.2, E(6), E(43) + 0.05, 5.2, E(28), 'metal');
      b.stairs(E(37), E(28), E(38), E(33), 0, 4.2, 'z-', 'metal');
      b.stairs(E(42), E(28), E(43), E(33), 0, 4.2, 'z-', 'metal');
      for (const [c, r] of [[33, 8], [47, 11], [33, 20], [47, 23]]) b.model('bed', X(c), 0, X(r), Math.PI / 2, { solid: [1, 0.6, 0.5] });
      b.model('desk', X(40), 0, X(18), 0, { solid: [0.8, 0.8, 0.4] });
      b.model('console', X(39), 0, X(20), Math.PI, { solid: [0.6, 1, 0.3] });
      crates(b, X(38), X(10), 3, { loot: ['ammo_ar2', 'healthvial', null] });
      crates(b, X(41), X(27), 3, { loot: ['ammo_buckshot', 'battery', null] });
      b.prop('table', X(39), X(24), {});
      b.prop('cabinet', X(41), X(13), {});
      for (const [t, c, r, y] of [['prisonguard', 38, 14, 0], ['prisonguard', 41, 20, 0], ['prisonguard', 36, 22, 4.2], ['prisonguard', 44, 12, 4.2], ['soldier_shotgun', 40, 29, 0], ['elite', 44, 26, 4.2]]) b.npc(t, X(c), X(r), { tag: 'block', y, passive: true, stay: y > 0 });
      b.npc('turret', X(38), X(8), { tag: 'blockturret', yaw: Math.PI, passive: true });
      b.npc('turret', X(42), X(31), { tag: 'blockturret', yaw: 0, passive: true });
      b.npc('turret', X(36), X(10), { tag: 'blockturret', y: 4.2, yaw: Math.PI / 2, passive: true });
      b.sign('λ', E(31) + 0.05, 2.3, X(29), Math.PI / 2, 0.8, 0.8, { bg: '#303030', fg: '#e07818' });
      b.cache(E(31), E(27), E(35), E(30));
      b.item('healthkit', X(32), X(28), {});
      b.item('ammo_ar2ball', X(33), X(28), {});
      b.item('weapon_crossbow', X(32), X(29), {});
      b.charger('health', E(49) - 0.12, 1.3, X(8), -Math.PI / 2);
      b.charger('suit', E(49) - 0.12, 1.3, X(10), -Math.PI / 2);
      b.door('ctrldoor', E(49) + 0.9, 0, E(18), E(49) + 1.1, 3.9, E(20), { tex: 'combine_wall', locked: true });
      zc(b, 'ctrl', 50, 15, 57, 22);
      ceilingLight(b, X(53), 3.95, X(18), [0.7, 0.85, 1], 9);
      for (const [c, r] of [[56, 16], [56, 21], [51, 16]]) b.model('console', X(c), 0, X(r), -Math.PI / 2, { solid: [0.3, 1, 0.6] });
      b.model('screen', X(54), 1.5, E(15) + 0.12, 0);
      b.npc('alyx', X(55), X(18), { id: 'alyx', passive: true, yaw: -Math.PI / 2 });
    },
    tick: H.MU.sandSpawner({ baitOnly: true, maxPets: 6 }),
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 8], ['hint', 'Бросьте феропод (ЛКМ) в солдат. Рой прибывает из песка во дворе', 7],
          ['say', 'radio', 'Фримен, это Одесса. Нова Проспект перед тобой. Аликс и Илай где-то внутри. Удачи.', 4.6]
        ]
      },
      { id: 'yard', when: { zone: 'yard' }, steps: [['group', 'towers'], ['sayq', 'soldier', 'Биоугроза у периметра! Всем постам огонь!', 2.5]] },
      { id: 'gate', when: { btn: 'gatebtn' }, steps: [['sound', 'alarm'], ['door', 'maingate', 'open'], ['say', 'overwatch', 'Нарушение периметра. Всем подразделениям: изолировать блок C.', 3.6], ['autosave']] },
      {
        id: 'block', when: { zone: 'block' }, steps: [
          ['npc', 'block', 'passive', false], ['npc', 'block', 'hate'], ['npc', 'blockturret', 'passive', false], ['music', 'action'],
          ['hint', 'Турели почти не берут пули. Опрокиньте их гравипушкой (ЛКМ)', 6],
          ['until', g => !g.npcs.some(n => n.alive && n.tag === 'block')], ['wait', 1.5],
          ['sound', 'door'], ['door', 'ctrldoor', 'open'], ['music', 'tension'], ['autosave']
        ]
      },
      {
        id: 'ctrl', when: { zone: 'ctrl' }, steps: [
          ['npc', 'alyx', 'face', 'player'],
          ['say', 'alyx', 'Гордон! Ты всё-таки пробрался! Я знала, что ты придёшь.', 3.2],
          ['say', 'alyx', 'Папу держат где-то в этом комплексе. Я взломаю их систему, а ты прикрывай меня. Пошли.', 4.6],
          ['changelevel', 'c10']
        ]
      }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
