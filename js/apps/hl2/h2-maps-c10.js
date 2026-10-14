(function (H) {
  'use strict';
  const { X, E, grid, zc, ceilingLight, crates } = H.MU;

  const g = grid(44, 31, 'W');
  g.rect('k', 2, 12, 8, 17);
  g.rect('c', 9, 14, 20, 15);
  g.rect('D', 21, 6, 34, 24);
  g.rect('r', 26, 1, 29, 4);
  g.rect('r', 27, 5, 28, 5);
  g.rect('r', 26, 26, 29, 29);
  g.rect('r', 27, 25, 28, 25);
  g.rect('T', 35, 14, 35, 15);
  g.rect('T', 36, 9, 42, 20);

  const tele = gm => gm.world.models.find(m => m.kind === 'teleporter');

  H.maps.c10 = {
    id: 'c10', chapter: 9, music: 'tension',
    env: { sky: 'storm', fog: [0.3, 0.32, 0.34], fogNear: 25, fogFar: 110, ambient: [0.4, 0.42, 0.44], indoorAmbient: [0.22, 0.23, 0.25], sun: null },
    legend: {
      'W': { f: 12, w: 'concrete_dark', rt: 'combine_floor' },
      'k': { f: 0, c: 4, top: 12, t: 'combine_floor', w: 'combine', ct: 'metal' },
      'c': { f: 0, c: 3.6, top: 12, t: 'tile', w: 'plaster_blue', ct: 'metal' },
      'D': { f: 0, c: 6.5, top: 12, t: 'concrete', w: 'plaster_blue', ct: 'metal' },
      'r': { f: 0, c: 3.6, top: 12, t: 'combine_floor', w: 'combine', ct: 'metal' },
      'T': { f: 0, c: 7, top: 12, t: 'metal', w: 'combine_wall', ct: 'metal' }
    },
    grid: g.rows(),
    start: { x: X(4), z: X(14), yaw: Math.PI / 2 },
    menuCam: { x: X(23), z: X(15), y: 1.7, yaw: Math.PI / 2 },
    build(b) {
      ceilingLight(b, X(5), 3.95, X(14), [0.7, 0.85, 1], 9);
      b.npc('alyx', X(6), X(15), { id: 'alyx', yaw: Math.PI / 2 });
      b.item('healthkit', X(3), X(16), {});
      b.item('ammo_ar2', X(3), X(13), {});
      for (const c of [11, 15, 19]) ceilingLight(b, X(c), 3.55, X(14) + 1, [0.85, 0.95, 1], 7);
      zc(b, 'hall', 21, 6, 34, 24);
      for (const [c, r] of [[24, 9], [31, 9], [24, 21], [31, 21], [27, 15]]) ceilingLight(b, X(c), 6.45, X(r), [0.85, 0.95, 1], 12);
      for (const [c, r, yaw] of [[24, 10, Math.PI], [31, 10, Math.PI], [24, 20, 0], [31, 20, 0]]) b.npc('turret', X(c), X(r), { team: 'rebel', tag: 'myturret', yaw });
      b.sign('ТУРЕЛИ МОЖНО ПЕРЕНОСИТЬ', X(21) + 0.05, 3, X(15), Math.PI / 2, 3.4, 0.5, { bg: '#303a30', fg: '#e0e0c0' });
      crates(b, X(26), X(12), 2, { type: 'crate_big' });
      crates(b, X(29), X(18), 2, { type: 'crate_big' });
      b.prop('barrel_red', X(22), X(7), {});
      b.prop('barrel_red', X(33), X(23), {});
      b.prop('table', X(30), X(14), {});
      b.prop('cabinet', X(23), X(17), {});
      b.charger('health', E(21) + 0.12, 1.3, X(8), Math.PI / 2);
      b.charger('suit', E(21) + 0.12, 1.3, X(22), Math.PI / 2);
      b.item('ammo_ar2', X(22), X(15), {});
      b.item('ammo_smg', X(22), X(16), {});
      b.item('ammo_buckshot', X(33), X(9), {});
      b.model('console', X(34) - 0.2, 0, X(13), -Math.PI / 2, { solid: [0.3, 1, 0.6] });
      b.door('ndoor', E(27), 0, E(5) + 0.9, E(29), 3.5, E(5) + 1.1, { tex: 'combine_wall', locked: true });
      b.door('sdoor', E(27), 0, E(25) + 0.9, E(29), 3.5, E(25) + 1.1, { tex: 'combine_wall', locked: true });
      b.light(X(27) + 1, 3.4, X(2), 0.6, 0.8, 1, 6);
      b.light(X(27) + 1, 3.4, X(28), 0.6, 0.8, 1, 6);
      for (const [t, c, r] of [['soldier', 27, 2], ['soldier', 28, 3], ['prisonguard', 26, 1]]) b.npc(t, X(c), X(r), { group: 'w1', tag: 'waves', hate: true });
      for (const [t, c, r] of [['soldier', 27, 27], ['soldier_shotgun', 28, 28], ['elite', 29, 27]]) b.npc(t, X(c), X(r), { group: 'w2', tag: 'waves', hate: true });
      for (const [t, c, r] of [['soldier', 27, 2], ['elite', 28, 1], ['soldier', 27, 28], ['prisonguard', 28, 27], ['manhack', 27, 3], ['manhack', 28, 26]]) b.npc(t, X(c), X(r), { group: 'w3', tag: 'waves', hate: true, y: t === 'manhack' ? 2 : undefined });
      b.door('labdoor', E(35) + 0.9, 0, E(14), E(35) + 1.1, 4, E(16), { tex: 'combine_wall', locked: true });
      zc(b, 'lab', 36, 9, 42, 20);
      for (const [c, r] of [[38, 11], [38, 18], [41, 14]]) ceilingLight(b, X(c), 6.95, X(r), [0.8, 0.9, 1], 10);
      b.model('teleporter', X(40), 0, X(15), 0, { active: false });
      b.zone('pad', X(40) - 1.5, X(15) - 1.5, X(40) + 1.5, X(15) + 1.5, -1, 3);
      b.model('console', X(37), 0, X(10), 0, { solid: [0.6, 1, 0.3] });
      b.model('console', X(37), 0, X(19), Math.PI, { solid: [0.6, 1, 0.3] });
      b.npc('eli', X(40), X(16), { id: 'eli', passive: true, yaw: -Math.PI / 2 });
      b.npc('mossman', X(39), X(14), { id: 'mossman', passive: true, yaw: -Math.PI / 2 });
    },
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 9], ['npc', 'alyx', 'follow'],
          ['say', 'alyx', 'Судя по записям, папу держат в лаборатории телепорта. Это за следующим залом.', 4],
          ['hint', 'Аликс будет сражаться рядом с вами', 5]
        ]
      },
      {
        id: 'hall', when: { zone: 'hall' }, steps: [
          ['npc', 'alyx', 'goto', X(34) - 1, X(14), true], ['until', { npcZone: ['alyx', 'hall'] }], ['wait', 2],
          ['npc', 'alyx', 'stay'], ['npc', 'alyx', 'set', { hold: { x: X(34) - 1, y: 0, z: X(14) }, opts: { stay: true } }],
          ['say', 'alyx', 'Дверь в лабораторию заперта. Мне нужно время, чтобы взломать замок. Прикрой меня!', 4],
          ['hint', 'ПКМ — поднять турель гравипушкой. Поставьте их лицом к дверям', 7],
          ['wait', 6], ['sound', 'alarm'], ['say', 'overwatch', 'Внимание: протокол изоляции. Отряды к лаборатории телепорта.', 3.6],
          ['door', 'ndoor', 'open'], ['group', 'w1'], ['music', 'action'],
          ['until', { dead: 'waves' }], ['say', 'alyx', 'Первые готовы. Взлом на трети!', 2.4], ['wait', 5],
          ['door', 'sdoor', 'open'], ['group', 'w2'],
          ['until', { dead: 'waves' }], ['say', 'alyx', 'Почти! Ещё немного!', 2], ['wait', 4],
          ['group', 'w3'],
          ['until', { dead: 'waves' }], ['wait', 1.5],
          ['say', 'alyx', 'Готово! Дверь открыта. Скорее!', 2.2], ['sound', 'door'], ['door', 'labdoor', 'open'],
          ['npc', 'alyx', 'set', { opts: { stay: false } }], ['npc', 'alyx', 'goto', X(38), X(15), true], ['music', 'tension'], ['autosave']
        ]
      },
      {
        id: 'betrayal', when: g => g.world.zoneHas('lab', g.player.pos) && g.doors.find(d => d.id === 'labdoor').open, steps: [
          ['npc', 'eli', 'face', 'player'],
          ['say', 'eli', 'Аликс! Гордон! Слава богу, вы живы...', 2.6],
          ['say', 'mossman', 'Простите, Илай. Я правда пыталась иначе. Но у меня нет выбора.', 3.6],
          ['do', gm => { tele(gm).active = true; }], ['sound', 'teleport'], ['shake', 0.6, 2], ['wait', 1.4],
          ['flash', [0.8, 0.9, 1], 1], ['remove', 'eli'], ['remove', 'mossman'], ['do', gm => { tele(gm).active = false; }],
          ['say', 'alyx', 'Нет! Джудит! Она увела его в Цитадель...', 2.8],
          ['say', 'alyx', 'Телепорт ещё заряжен. Я переключу его на лабораторию Кляйнера. Встань со мной на площадку, живо!', 5],
          ['npc', 'alyx', 'goto', X(40), X(15) + 0.8, true], ['hint', 'Встаньте на площадку телепорта', 5]
        ]
      },
      {
        id: 'escape', when: { all: [{ zone: 'pad' }, g => !g.npcById('eli')] }, steps: [
          ['freeze'], ['do', gm => { tele(gm).active = true; }], ['sound', 'teleport'], ['shake', 0.8, 2],
          ['say', 'alyx', 'Держись, Гордон!', 1.6], ['flash', [1, 1, 1], 1.4], ['fade', [1, 1, 1], 0.4, 1], ['wait', 1.2], ['changelevel', 'c11']
        ]
      }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
