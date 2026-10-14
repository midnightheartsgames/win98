(function (H) {
  'use strict';
  const { X, E, grid, zc, ceilingLight } = H.MU;

  const g = grid(30, 24, '#');
  g.rect('e', 1, 1, 6, 4);
  g.rect('e', 7, 2, 7, 3);
  g.rect('L', 8, 1, 21, 12);
  g.rect('L', 22, 3, 22, 4);
  g.rect('S', 23, 1, 28, 7);
  g.rect('L', 15, 13, 16, 13);
  g.rect('T', 11, 14, 21, 21);
  g.rect('b', 1, 15, 6, 21);
  g.rect('x', 24, 11, 28, 21);

  const teleporter = gm => gm.world.models.find(m => m.kind === 'teleporter');

  H.maps.c02 = {
    id: 'c02', chapter: 1, music: 'lab',
    env: { sky: 'storm', fog: [0.3, 0.32, 0.34], fogNear: 25, fogFar: 120, ambient: [0.45, 0.46, 0.5], indoorAmbient: [0.26, 0.27, 0.28], sun: null },
    legend: {
      '#': { f: 9, w: 'lab_wall', rt: 'roof' },
      'e': { f: 0, c: 3.2, top: 9, t: 'concrete', w: 'plaster_blue', ct: 'plaster_white' },
      'L': { f: 0, c: 5, top: 9, t: 'tile_lab', w: 'lab_wall', ct: 'plaster_white' },
      'S': { f: 0, c: 3.5, top: 9, t: 'tile', w: 'tile_green', ct: 'plaster_white' },
      'T': { f: 0, c: 7, top: 9, t: 'metal', w: 'metal', ct: 'metal' },
      'b': { f: 0, c: 4, top: 9, t: 'carpet', w: 'wallpaper', ct: 'plaster_white' },
      'x': { f: 0, t: 'dirt', w: 'brick' }
    },
    grid: g.rows(),
    start: { x: X(2), z: X(2) + 0.5, yaw: Math.PI / 2 },
    menuCam: { x: X(9), z: X(11), y: 1.7, yaw: Math.PI * 0.8 },
    build(b) {
      ceilingLight(b, X(3), 3.15, X(2), [0.9, 0.95, 1], 7);
      b.npc('alyx', X(4), X(3), { id: 'alyx', passive: true, yaw: Math.PI / 2 });
      b.door('labentry', E(7) + 0.9, 0, E(2), E(7) + 1.1, 3.1, E(4), { tex: 'door_metal', locked: true });
      b.sign('ВЕНДИНГ «РОДНИК»', X(6), 2.2, E(1) + 0.05, 0, 1.8, 0.4, { bg: '#3a4a60', fg: '#f0f0f0' });
      zc(b, 'lab', 8, 1, 21, 12);
      for (const [c, r] of [[10, 3], [14, 3], [18, 3], [10, 9], [14, 9], [18, 9]]) ceilingLight(b, X(c), 4.95, X(r), [0.95, 1, 1], 9);
      b.npc('kleiner', X(14), X(5), { id: 'kleiner', yaw: -Math.PI / 2 + 0.3, lines: ['Ламарр опять где-то прячется... Ламарр!', 'Не трогай, пожалуйста, это... а, ладно.'] });
      for (const [c, r] of [[10, 6], [13, 6], [17, 11]]) { b.model('desk', X(c), 0, X(r), 0, { solid: [0.8, 0.8, 0.4] }); b.model('computer', X(c), 0.78, X(r) - 0.1, 0); }
      b.model('console', X(20), 0, X(2), Math.PI, { solid: [0.6, 1, 0.3] });
      b.model('console', X(20), 0, X(6), -Math.PI / 2, { solid: [0.3, 1, 0.6] });
      b.model('shelf', X(9), 0, E(1) + 0.3, 0, { solid: [1, 2, 0.25] });
      b.model('shelf', X(12), 0, E(1) + 0.3, 0, { solid: [1, 2, 0.25] });
      b.model('screen', X(16), 2.2, E(1) + 0.12, 0);
      b.prop('lamarr', X(18), X(9), { id: 'lamarr', tag: 'lamarr' });
      b.prop('melon', X(10), X(6) + 0.2, { y: 0.8 });
      b.prop('bottle', X(13) + 0.3, X(6), { y: 0.8 });
      b.prop('paint', X(21), X(11), {});
      b.prop('crate', X(8), X(11), {});
      b.prop('cabinet', X(21), X(8), { yaw: Math.PI / 2 });
      zc(b, 'suitroom', 23, 1, 28, 7);
      ceilingLight(b, X(25), 3.45, X(3), [1, 1, 0.95], 8);
      ceilingLight(b, X(25), 3.45, X(6), [1, 1, 0.95], 8);
      b.item('suit', X(27), X(3), { tag: 'suit' });
      b.box(E(28), 0, E(2), E(29), 2.5, E(5), 'glass', { solid: false });
      b.charger('health', X(24), 1.2, E(1) + 0.12, 0);
      b.charger('suit', X(26), 1.2, E(1) + 0.12, 0);
      b.model('desk', X(25), 0, X(7) - 0.2, Math.PI, { solid: [0.8, 0.8, 0.4] });
      b.item('battery', X(25) - 0.4, X(7) - 0.2, { y: 0.78 });
      b.item('battery', X(25) + 0.4, X(7) - 0.2, { y: 0.78 });
      b.door('teledoor', E(15), 0, E(13) + 0.9, E(17), 4.8, E(13) + 1.1, { tex: 'combine_wall', locked: true });
      zc(b, 'teleroom', 11, 14, 21, 21);
      b.model('teleporter', X(16), 0, X(18), 0, { active: false });
      b.zone('pad', X(16) - 1.4, X(18) - 1.4, X(16) + 1.4, X(18) + 1.4, -1, 3);
      b.model('console', X(12), 0, X(15), Math.PI / 2, { solid: [0.3, 1, 0.6] });
      b.model('console', X(20), 0, X(15), -Math.PI / 2, { solid: [0.3, 1, 0.6] });
      b.model('pipe', E(11), 5.5, X(14), Math.PI / 2, { r: 0.35, len: 22 });
      for (const [c, r] of [[13, 16], [19, 16], [13, 20], [19, 20]]) b.light(X(c), 6, X(r), 0.7, 0.85, 1, 9);
      b.light(X(16), 1.5, X(18), 0.4, 0.6, 1, 6);
      b.npc('breen', X(3), X(16), { id: 'breen', yaw: 0, passive: true });
      b.model('desk', X(3), 0, X(17), 0, { solid: [0.8, 0.8, 0.4] });
      b.model('screen', X(5), 1.5, E(15) + 0.12, 0);
      b.light(X(3), 3.5, X(18), 1, 0.9, 0.75, 8);
      b.spot('vbreen', X(3), X(20), 0, Math.PI);
      b.spot('vyard', X(26), X(19), 0, Math.PI);
      b.npc('soldier', X(25), X(13), { passive: true, team: 'neutral', yaw: 0 });
      b.npc('soldier', X(27), X(14), { passive: true, team: 'neutral', yaw: -0.3 });
      b.light(X(26), 4, X(16), 0.6, 0.7, 0.9, 12);
      b.model('lamp', X(24), 0, X(17), Math.PI / 2);
    },
    tick(g, dt) {
      const l = g.props.find(p => p.tag === 'lamarr');
      if (!l || l.held || g.flags.lamarrJumped) return;
      g.flags.lamarrT = (g.flags.lamarrT || 3) - dt;
      if (g.flags.lamarrT <= 0 && l.onGround) {
        g.flags.lamarrT = 2.5 + g.rng() * 3;
        const a = g.rng() * Math.PI * 2;
        H.Phys.wake(l);
        l.vel = { x: Math.sin(a) * 2.5, y: 3.5, z: Math.cos(a) * 2.5 };
        l.yaw = a;
        g.emit({ type: 'sound', name: 'crab_alert', pos: l.pos, vol: 0.4 });
      }
    },
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 1], ['npc', 'alyx', 'face', 'player'],
          ['say', 'alyx', 'Лаборатория доктора Кляйнера за этой дверью. Он будет счастлив тебя видеть.', 3.8],
          ['sound', 'button'], ['door', 'labentry', 'open'], ['npc', 'alyx', 'goto', X(11), X(4)],
          ['say', 'alyx', 'Только не пугайся Ламарр. Она безобидная. Почти.', 3]
        ]
      },
      {
        id: 'lab', when: { zone: 'lab' }, steps: [
          ['npc', 'kleiner', 'face', 'player'],
          ['say', 'kleiner', 'Гордон! Гордон Фримен! Аликс, где ты его нашла?', 3],
          ['say', 'alyx', 'Барни подсказал. И ещё немного везения.', 2.6],
          ['say', 'kleiner', 'Сколько лет... Твой старый защитный костюм всё ещё у меня. Он в соседней комнате, я его немного подлатал.', 5],
          ['hint', 'Возьмите костюм H.E.V. в соседней комнате', 6]
        ]
      },
      {
        id: 'suit', when: { flag: 'suit' }, steps: [
          ['say', 'kleiner', 'Отлично! На стене зарядные станции. Подзарядись, это не помешает.', 3.6],
          ['hint', 'Удерживайте E у зарядной станции', 6], ['wait', 6],
          ['spawn', 'npc', 'barney', X(3), X(3), { id: 'barney', passive: true }], ['door', 'labentry', 'open'], ['npc', 'barney', 'goto', X(12), X(8)],
          ['say', 'barney', 'Доктор, мне пора. Меня уже чуть не раскусили на вокзале. Гордон! Ну вот, теперь ты похож на себя.', 5],
          ['say', 'kleiner', 'Телепорт готов. Аликс отправится первой, к отцу, в Восточную Чёрную Мезу.', 4],
          ['door', 'teledoor', 'open'], ['npc', 'alyx', 'goto', X(16), X(18)], ['npc', 'kleiner', 'goto', X(12) + 1, X(15)],
          ['hint', 'Пройдите в комнату телепорта', 4]
        ]
      },
      {
        id: 'teleroom', when: { all: [{ zone: 'teleroom' }, { flag: 'suit' }] }, steps: [
          ['until', { npcZone: ['alyx', 'pad'] }],
          ['npc', 'kleiner', 'face', 'player'],
          ['say', 'kleiner', 'Аликс, не шевелись. Запускаю!', 2.4],
          ['do', gm => { teleporter(gm).active = true; }], ['sound', 'teleport'], ['shake', 0.4, 2], ['wait', 1.6],
          ['flash', [0.8, 0.9, 1], 0.8], ['remove', 'alyx'], ['flag', 'alyxGone'],
          ['do', gm => { teleporter(gm).active = false; }],
          ['say', 'kleiner', 'Получилось! Она уже у Илая. Теперь ты, Гордон. Встань на площадку.', 3.8],
          ['hint', 'Встаньте на площадку телепорта', 5]
        ]
      },
      {
        id: 'pad', when: { all: [{ zone: 'pad' }, { flag: 'alyxGone' }] }, steps: [
          ['freeze'], ['say', 'kleiner', 'Не двигайся, Гордон. Три, два...', 2.4],
          ['do', gm => { teleporter(gm).active = true; }], ['sound', 'teleport'], ['shake', 0.5, 2],
          ['do', gm => { gm.flags.lamarrJumped = true; const l = gm.props.find(p => p.tag === 'lamarr'); if (l) { H.Phys.wake(l); l.pos = { x: X(15), y: 1.5, z: X(16) }; l.vel = { x: 1, y: 3, z: 3 }; } }],
          ['say', 'kleiner', 'Ламарр?! Ламарр, слезай оттуда немедленно! Нет-нет-нет!', 2.6],
          ['sound', 'crash'], ['shake', 1, 1.5], ['flash', [1, 1, 1], 1], ['wait', 0.5],
          ['teleport', 'vbreen'], ['sound', 'teleport'],
          ['say', 'breen', 'Доктор Фримен?! Как вы... Что всё это значит?', 2.6],
          ['say', 'breen', 'Охрана! Немедленно задержать!', 1.8],
          ['flash', [1, 1, 1], 1], ['teleport', 'vyard'], ['sound', 'radio'],
          ['say', 'soldier', 'Контакт! Неопознанный объект во дворе!', 2],
          ['flash', [1, 1, 1], 0.8], ['fade', [1, 1, 1], 0.6, 1], ['wait', 1], ['changelevel', 'c03']
        ]
      }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
