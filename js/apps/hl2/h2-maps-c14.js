(function (H) {
  'use strict';
  const { X, E, grid, zc, ceilingLight } = H.MU;

  const g = grid(40, 40, 'W');
  g.rect('p', 18, 34, 21, 37);
  g.rect('c', 19, 28, 20, 33);
  g.rect('R', 8, 6, 31, 27);
  g.rect('W', 8, 6, 10, 8);
  g.rect('W', 29, 6, 31, 8);
  g.rect('W', 8, 25, 10, 27);
  g.rect('W', 29, 25, 31, 27);
  g.rect('d', 5, 15, 7, 17);
  g.rect('d', 32, 15, 34, 17);
  g.rect('v', 2, 1, 6, 5);

  const CORE = { x: X(19) + 1, z: X(16) };
  const DISP = [[E(8) + 0.5, X(12)], [E(8) + 0.5, X(21)], [E(32) - 0.5, X(12)], [E(32) - 0.5, X(21)]];
  const reactor = gm => gm.world.models.find(m => m.kind === 'reactor');

  H.maps.c14 = {
    id: 'c14', chapter: 13, music: 'finale',
    env: { sky: 'citadel', fog: [0.08, 0.12, 0.16], fogNear: 30, fogFar: 120, ambient: [0.3, 0.36, 0.46], indoorAmbient: [0.2, 0.25, 0.32], sun: null },
    legend: {
      'W': { f: 36, w: 'citadel', rt: 'combine_floor' },
      'p': { f: 0, c: 6, top: 36, t: 'combine_floor', w: 'combine_wall', ct: 'metal' },
      'c': { f: 0, c: 5, top: 36, t: 'combine_floor', w: 'combine', ct: 'metal' },
      'R': { f: 0, c: 26, top: 36, t: 'combine_floor', w: 'combine_wall', ct: 'citadel' },
      'd': { f: 0, c: 4, top: 36, t: 'combine_floor', w: 'combine', ct: 'metal' },
      'v': { f: 0, c: 8, top: 36, t: 'black', w: 'black', ct: 'black' }
    },
    grid: g.rows(),
    start: { x: X(19) + 1, z: X(35), yaw: Math.PI },
    menuCam: { x: X(19), z: X(25), y: 1.8, yaw: Math.PI },
    build(b) {
      ceilingLight(b, X(19) + 1, 5.95, X(35), [0.6, 0.8, 1], 8, 'light_blue');
      ceilingLight(b, X(19) + 1, 4.95, X(30), [0.6, 0.8, 1], 7, 'light_blue');
      b.model('reactor', CORE.x, 0, CORE.z, 0, { hits: 0 });
      b.box(CORE.x - 3, 0, CORE.z - 3, CORE.x + 3, 1, CORE.z + 3, 'combine', { visible: false });
      b.box(CORE.x - 1.2, 1, CORE.z - 1.2, CORE.x + 1.2, 15, CORE.z + 1.2, 'combine', { visible: false });
      b.light(CORE.x, 8, CORE.z, 0.6, 0.9, 1.6, 24);
      b.light(CORE.x, 1.5, CORE.z + 4, 0.4, 0.6, 1.2, 10);
      for (const [x, z] of [[X(12), X(10)], [X(27), X(10)], [X(12), X(23)], [X(27), X(23)]]) b.light(x, 12, z, 0.5, 0.7, 1, 16);
      b.box(E(16), 7.6, E(6), E(24), 8, E(9), 'combine_floor', { bottom: 'metal' });
      b.box(E(16), 8, E(9) - 0.1, E(24), 9, E(9), 'grate', { solid: false });
      b.npc('breen', X(19) + 1, X(7), { id: 'breen', y: 8, passive: true, yaw: 0 });
      b.model('screen', X(19) + 1, 11, E(6) + 0.12, 0, { scale: 2 });
      for (const [x, z] of DISP) { b.model('console', x, 0, z, x < E(20) ? Math.PI / 2 : -Math.PI / 2); b.light(x, 2.4, z, 0.5, 0.8, 1.4, 6); }
      b.door('wdoor', E(8) - 0.2, 0, E(15), E(8), 3.8, E(18), { tex: 'combine_wall', locked: true });
      b.door('edoor', E(32), 0, E(15), E(32) + 0.2, 3.8, E(18), { tex: 'combine_wall', locked: true });
      for (const [t, c, r] of [['elite', 6, 16], ['soldier', 5, 15], ['soldier', 6, 17]]) b.npc(t, X(c), X(r), { group: 'g1', tag: 'guards', hate: true });
      for (const [t, c, r] of [['elite', 33, 16], ['elite', 34, 15], ['soldier_shotgun', 33, 17]]) b.npc(t, X(c), X(r), { group: 'g2', tag: 'guards', hate: true });
      for (const [t, c, r] of [['elite', 6, 16], ['elite', 33, 16], ['soldier', 5, 17], ['soldier', 34, 15]]) b.npc(t, X(c), X(r), { group: 'g3', tag: 'guards', hate: true });
      zc(b, 'chamber', 8, 6, 31, 27);
      b.spot('void', X(4), X(4), 0, Math.PI);
      b.npc('gman', X(4), X(2), { id: 'gman', group: 'gman', passive: true, yaw: 0 });
      b.light(X(4), 5, X(3), 0.5, 0.5, 0.55, 6);
    },
    tick(g, dt) {
      if (g.flags.finale) return;
      if (g.player.superGG) H.MU.dispensers(g, dt, DISP);
      for (const p of g.props) {
        if (p.dead || p.type !== 'combine_ball' || p.held || p.thrownBy !== 'player') continue;
        if (H.distXZ(p.pos, CORE) > 2.4 || p.pos.y < 0.8 || p.pos.y > 16) continue;
        p.dead = true;
        const r = reactor(g);
        r.hits = (r.hits || 0) + 1;
        g.flags.hits = r.hits;
        g.fx.spark({ x: CORE.x, y: p.pos.y, z: CORE.z }, 30, [0.6, 0.9, 1.3]);
        g.addDynLight({ x: CORE.x, y: p.pos.y, z: CORE.z }, [0.8, 1, 1.6], 20, 0.6);
        g.emit({ type: 'sound', name: 'ball_explode', pos: p.pos });
        g.emit({ type: 'shake', amount: 0.6, dur: 1 });
        g.emit({ type: 'flash', col: [0.6, 0.8, 1], dur: 0.4 });
      }
    },
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 13], ['wait', 2], ['until', { zone: 'chamber' }], ['npc', 'breen', 'face', 'player'],
          ['say', 'breen', 'Доктор Фримен. Признаюсь, я вас недооценил. Как и все остальные.', 3.8],
          ['say', 'breen', 'Вы хоть понимаете, что разрушаете? Благодетели предлагают человечеству будущее. Бессмертие вида.', 5],
          ['say', 'breen', 'Остановитесь. Мы ещё можем договориться.', 2.6],
          ['hint', 'Бросайте энергошары из ниш в столб реактора', 7]
        ]
      },
      {
        id: 'hit1', when: g => (g.flags.hits || 0) >= 1, steps: [
          ['say', 'breen', 'Что вы делаете?! Прекратите немедленно! Охрана!', 2.6], ['door', 'wdoor', 'open'], ['group', 'g1']
        ]
      },
      {
        id: 'hit2', when: g => (g.flags.hits || 0) >= 2, steps: [
          ['say', 'breen', 'Реактор нестабилен! Вы погубите нас всех!', 2.6], ['door', 'edoor', 'open'], ['group', 'g2'], ['sound', 'alarm']
        ]
      },
      {
        id: 'hit3', when: g => (g.flags.hits || 0) >= 3, steps: [
          ['flag', 'finale'], ['say', 'breen', 'Нет... Нет! Я не останусь тут!', 2], ['flash', [0.8, 0.9, 1], 0.8], ['remove', 'breen'],
          ['group', 'g3'], ['sound', 'siren'], ['shake', 1, 5], ['wait', 1.2],
          ['say', 'overwatch', 'Внимание: критическая нестабильность ядра. Всем покинуть уровень.', 3.2],
          ['sound', 'explode'], ['wait', 1.2], ['sound', 'explode'], ['shake', 1.5, 3],
          ['freeze'], ['fade', [1, 1, 1], 1.2, 1.5], ['wait', 1.5],
          ['kill', 'guards'], ['teleport', 'void'], ['group', 'gman'], ['sound', 'gman'], ['music', null],
          ['npc', 'gman', 'face', 'player'],
          ['say', 'gman', 'Время, доктор Фримен? Неужели снова пора?', 3.4],
          ['say', 'gman', 'Кажется, вы только что приступили к работе. Но вы проявили себя блестяще.', 4.4],
          ['say', 'gman', 'Не могу сказать, что нас это удивляет. Мои наниматели весьма довольны.', 3.8],
          ['say', 'gman', 'Детали обсудим позже. А пока... позвольте откланяться.', 3.4],
          ['fade', [0, 0, 0], 2, 3], ['wait', 2.5], ['credits']
        ]
      }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
