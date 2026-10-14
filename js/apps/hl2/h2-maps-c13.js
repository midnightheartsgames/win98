(function (H) {
  'use strict';
  const { X, E, grid, zc, ceilingLight } = H.MU;

  const g = grid(40, 42, 'W');
  g.rect('p', 2, 18, 8, 24);
  g.rect('c', 9, 20, 20, 22);
  g.rect('H', 21, 6, 36, 38);
  g.rect('s', 27, 3, 30, 5);
  g.rect('u', 25, 1, 32, 2);

  const DISP = [[E(21) + 0.4, X(12)], [E(21) + 0.4, X(30)], [E(37) - 0.4, X(12)], [E(37) - 0.4, X(30)]];

  H.maps.c13 = {
    id: 'c13', chapter: 12, music: 'finale',
    env: { sky: 'citadel', fog: [0.12, 0.16, 0.2], fogNear: 25, fogFar: 120, ambient: [0.3, 0.36, 0.44], indoorAmbient: [0.18, 0.22, 0.28], sun: null },
    legend: {
      'W': { f: 24, w: 'citadel', rt: 'combine_floor' },
      'p': { f: 0, c: 6, top: 24, t: 'combine_floor', w: 'combine_wall', ct: 'metal' },
      'c': { f: 0, c: 4, top: 24, t: 'combine_floor', w: 'combine', ct: 'metal' },
      'H': { f: 0, c: 14, top: 24, t: 'combine_floor', w: 'combine_wall', ct: 'citadel' },
      's': { f: 0, t: 'combine_floor', w: 'citadel' },
      'u': { f: 16, w: 'citadel', rt: 'combine_floor' }
    },
    grid: g.rows(),
    start: { x: X(4), z: X(21), yaw: Math.PI / 2 },
    menuCam: { x: X(28), z: X(34), y: 1.8, yaw: Math.PI },
    build(b) {
      b.model('pod', X(3), 0, X(21), 0);
      b.box(X(3) - 1.1, 0, X(21) - 1.1, X(3) + 1.1, 2.4, X(21) + 1.1, 'metal', { visible: false });
      ceilingLight(b, X(6), 5.95, X(21), [0.6, 0.8, 1], 10, 'light_blue');
      for (const c of [11, 17]) ceilingLight(b, X(c), 3.95, X(21), [0.6, 0.8, 1], 7, 'light_blue');
      b.box(E(14) + 0.9, 0, E(20), E(14) + 1.1, 4, E(23), 'field', { solid: false });
      b.light(X(14), 2, X(21), 0.5, 0.8, 1.4, 7);
      zc(b, 'confiscate', 14, 20, 14, 22);
      zc(b, 'hall', 21, 6, 36, 38);
      for (let r = 9; r <= 35; r += 6) for (const c of [24, 33]) {
        b.box(E(c), 0, E(r), E(c) + 1.2, 14, E(r) + 1.2, 'citadel');
        b.light(E(c) + 0.6, 10, E(r) + 2, 0.5, 0.75, 1.1, 12);
      }
      for (const [x, z] of DISP) { b.model('console', x, 0, z, x < E(30) ? Math.PI / 2 : -Math.PI / 2); b.light(x, 2.4, z, 0.5, 0.8, 1.4, 6); }
      for (const [t, c, r] of [['soldier', 26, 30], ['soldier', 31, 27], ['elite', 29, 33], ['soldier', 27, 22]]) b.npc(t, X(c), X(r), { group: 'h1', tag: 'h1', hate: true });
      for (const [t, c, r] of [['elite', 26, 12], ['elite', 31, 10], ['soldier_shotgun', 29, 14], ['soldier', 34, 16], ['manhack', 28, 18], ['manhack', 30, 18]]) b.npc(t, X(c), X(r), { group: 'h2', tag: 'h2', hate: true, y: t === 'manhack' ? 2 : undefined });
      for (const [c, r] of [[26, 24], [31, 20], [27, 16]]) b.prop('crate_big', X(c), X(r), {});
      b.prop('barrel_red', X(30), X(25), {});
      b.door('lift', E(27), 0, E(3), E(31), 0.3, E(6), { tex: 'combine_floor', move: [0, 15.8, 0], speed: 0.07, lift: true, locked: true });
      zc(b, 'liftpad', 27, 3, 30, 5, -0.5, 2);
      zc(b, 'top', 25, 1, 32, 2, 15, 20);
      b.light(X(28), 18, X(2), 0.6, 0.8, 1.2, 10);
      b.sign('λ', E(8) - 0.05, 2.5, X(19), -Math.PI / 2, 0.8, 0.8, { bg: '#303030', fg: '#e07818' });
      b.cache(E(7), E(18), E(9), E(20));
      b.item('healthkit', X(7), X(19), {});
      b.item('battery', X(8), X(19), {});
    },
    tick(g, dt) { if (g.player.superGG) H.MU.dispensers(g, dt, DISP); },
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 12],
          ['say', 'overwatch', 'Внимание: посторонний в Цитадели. Протокол изъятия активирован.', 3.6],
          ['hint', 'Впереди поле изъятия', 4]
        ]
      },
      {
        id: 'confiscate', when: { zone: 'confiscate' }, steps: [
          ['sound', 'field'], ['flash', [0.5, 0.8, 1], 1.2], ['shake', 0.5, 1], ['strip', ['gravgun']], ['give', 'supergg'], ['give', 'armor', 100],
          ['say', 'hev', 'Внимание: обнаружена аномальная энергия. Гравитационный манипулятор перегружен.', 3.6],
          ['hint', 'Заряженная гравипушка: ПКМ хватает солдат, ЛКМ убивает на месте. Энергошары в нишах можно метать', 8],
          ['autosave']
        ]
      },
      {
        id: 'hall', when: { zone: 'hall' }, steps: [
          ['group', 'h1'], ['until', { dead: 'h1' }], ['wait', 2], ['group', 'h2'], ['until', { dead: 'h2' }], ['wait', 1],
          ['say', 'overwatch', 'Внимание: нарушитель движется к уровню администрации.', 3], ['flag', 'hallClear'], ['hint', 'Лифт на севере зала', 4], ['autosave']
        ]
      },
      {
        id: 'lift', when: { all: [{ zone: 'liftpad' }, { flag: 'hallClear' }] }, steps: [
          ['sound', 'button'], ['door', 'lift', 'open'], ['until', g => g.doors.find(d => d.id === 'lift').t > 0.98]
        ]
      },
      { id: 'top', when: { zone: 'top' }, steps: [['changelevel', 'c14']] }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
