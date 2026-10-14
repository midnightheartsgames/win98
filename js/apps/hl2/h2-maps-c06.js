(function (H) {
  'use strict';
  const { X, E, grid, zc, ceilingLight } = H.MU;

  const g = grid(58, 36, 'R');
  g.rect('t', 1, 16, 3, 18);
  g.rect('o', 4, 11, 14, 23);
  g.rect('o', 15, 15, 44, 19);
  g.rect('H', 16, 9, 22, 14);
  g.rect('h', 17, 10, 21, 13);
  g.set('h', 19, 14);
  g.rect('H', 24, 9, 30, 14);
  g.rect('h', 25, 10, 29, 13);
  g.set('h', 27, 14);
  g.rect('H', 32, 9, 38, 14);
  g.rect('h', 33, 10, 37, 13);
  g.set('h', 35, 14);
  g.rect('H', 16, 20, 22, 26);
  g.rect('h', 17, 21, 21, 25);
  g.set('h', 19, 20);
  g.rect('H', 25, 20, 33, 26);
  g.rect('h', 26, 21, 32, 25);
  g.set('h', 29, 20);
  g.rect('o', 34, 20, 44, 28);
  g.rect('o', 23, 10, 23, 14);
  g.rect('o', 31, 10, 31, 14);
  g.rect('o', 23, 20, 24, 26);
  g.rect('o', 45, 10, 55, 30);
  g.rect('C', 46, 3, 53, 9);
  g.rect('c', 47, 4, 52, 8);
  g.set('c', 49, 9);
  g.rect('m', 56, 26, 57, 28);

  const trapCar = gm => gm.props.find(p => p.tag === 'trapcar');

  H.maps.c06 = {
    id: 'c06', chapter: 5, music: 'ravenholm',
    env: { sky: 'night', fog: [0.07, 0.08, 0.1], fogNear: 12, fogFar: 72, ambient: [0.16, 0.17, 0.22], indoorAmbient: [0.08, 0.08, 0.1], sun: { dir: [0.4, -1, 0.3], col: [0.12, 0.14, 0.2] } },
    legend: {
      'R': { f: 16, w: 'cliff', rt: 'rock' },
      't': { f: 0, c: 3.6, top: 16, t: 'rail', w: 'rock', ct: 'rock' },
      'o': { f: 0, t: 'cobble', w: 'brick_dark' },
      'H': { f: 6.5, w: 'brick_dark', rt: 'roof_tin' },
      'h': { f: 0, c: 3.4, top: 6.5, t: 'wood_floor', w: 'wallpaper', ct: 'planks', rt: 'roof_tin' },
      'C': { f: 14, w: 'plaster', rt: 'roof' },
      'c': { f: 0, c: 9, top: 14, t: 'planks', w: 'plaster', ct: 'planks' },
      'm': { f: 0, c: 3.5, top: 16, t: 'rail', w: 'rock', ct: 'rock' }
    },
    grid: g.rows(),
    start: { x: X(2), z: X(17), yaw: Math.PI / 2 },
    menuCam: { x: X(30), z: X(18), y: 1.7, yaw: -Math.PI / 2 },
    build(b) {
      b.sign('МЫ НЕ ХОДИМ В РЕЙВЕНХОЛМ', X(4) + 0.4, 2.2, X(15), Math.PI, 3.4, 0.6, { bg: '#2a1a14', fg: '#c83020' });
      b.light(X(3), 3.2, X(17), 0.8, 0.5, 0.25, 6);
      b.hazard('fire1', X(6) - 0.3, 0, X(13) - 0.3, X(6) + 0.3, 0.9, X(13) + 0.3, 'fire');
      b.light(X(6), 1.5, X(13), 1, 0.55, 0.2, 9, { flicker: 1 });
      b.prop('barrel', X(6), X(13) + 0.9, {});
      b.hazard('fire2', X(40) - 0.3, 0, X(17) - 0.3, X(40) + 0.3, 0.9, X(17) + 0.3, 'fire');
      b.light(X(40), 1.5, X(17), 1, 0.55, 0.2, 9, { flicker: 1 });
      b.hazard('fire3', X(50) - 0.3, 0, X(20) - 0.3, X(50) + 0.3, 0.9, X(20) + 0.3, 'fire');
      b.light(X(50), 1.5, X(20), 1, 0.55, 0.2, 10, { flicker: 1 });
      zc(b, 'courtyard', 4, 11, 14, 23);
      b.model('crane', X(12), 0, X(12), Math.PI);
      b.box(X(12) - 0.5, 0, X(12) - 0.5, X(12) + 0.5, 18, X(12) + 0.5, 'metal', { visible: false });
      b.prop('car', X(10), X(18), { y: 7.5, frozen: true, tag: 'trapcar' });
      b.box(X(10) - 0.05, 9, X(18) - 0.05, X(10) + 0.05, 17, X(18) + 0.05, 'gun', { solid: false });
      b.button('cardrop', E(4) + 0.08, 1.4, X(20), Math.PI / 2, {});
      b.sign('ТЯНИ', E(4) + 0.05, 2.1, X(20), Math.PI / 2, 0.8, 0.3, { bg: '#401010', fg: '#f0d0a0' });
      for (const [t, x, z] of [['zombie', X(10), X(17)], ['zombie', X(11), X(19)], ['zombie', X(9), X(21)], ['headcrab', X(12), X(15)], ['headcrab', X(8), X(12)]]) b.npc(t, x, z, { group: 'yardz', tag: 'yardz', hate: true });
      b.npc('zombie', X(13), X(22), { sleep: true, wakeDist: 5, yaw: 2, tag: 'yardz2' });
      b.prop('sawblade', X(5), X(22), {});
      b.prop('sawblade', X(6), X(22), {});
      b.prop('barrel_red', X(13), X(14), {});
      b.prop('propane', X(14), X(22), {});
      b.prop('radiator', X(8), X(11), {});
      zc(b, 'street', 15, 15, 30, 19);
      for (const [c, r] of [[17, 16], [23, 18], [31, 16], [37, 18], [43, 16]]) { b.model('pole', X(c), 0, X(r) - (r === 16 ? 1.3 : -1.3)); }
      b.light(X(23), 5, X(18), 0.9, 0.6, 0.3, 11);
      b.light(X(37), 5, X(18), 0.9, 0.6, 0.3, 11);
      b.prop('sawblade', X(18), X(18), {});
      b.prop('sawblade', X(24), X(16), {});
      b.prop('barrel_red', X(26), X(18), {});
      b.prop('barrel_red', X(33), X(15), {});
      b.prop('gascan', X(30), X(19), {});
      b.prop('tire', X(36), X(19), {});
      b.model('wreck', X(28), 0, X(17), 1.4, { solid: [1.4, 1.4, 1.8] });
      for (const [t, x, z] of [['zombie', X(25), X(17)], ['zombie', X(29), X(16)], ['zombie', X(33), X(18)], ['headcrab', X(31), X(19)], ['fastzombie', X(38), X(16)]]) b.npc(t, x, z, { group: 'streetz', tag: 'streetz', hate: true });
      for (const [c, r] of [[19, 11], [27, 11], [35, 11], [19, 23], [29, 23]]) b.light(X(c), 3.2, X(r), 0.8, 0.55, 0.3, 6);
      b.npc('zombie', X(18), X(12), { sleep: true, wakeDist: 4, tag: 'house' });
      b.npc('headcrab', X(20), X(11), { sleep: true, wakeDist: 5, tag: 'house' });
      b.item('healthkit', X(17), X(10), {});
      b.item('battery', X(21), X(10), {});
      b.prop('table', X(19), X(11), {});
      b.prop('chair', X(18), X(11), {});
      b.npc('grigori', X(27), X(12), { id: 'grigori', y: 6.5, group: 'grigori', yaw: 0, hold: true, stay: true });
      zc(b, 'grighouse', 23, 15, 31, 19);
      b.ladder(E(31), X(12) - 0.4, E(31) + 0.2, X(12) + 0.4, 0, 6.8);
      b.box(E(30) + 1.6, 6.5, X(12) - 0.4, E(31) + 0.1, 6.55, X(12) + 0.4, 'planks', { solid: false });
      b.item('ammo_buckshot', X(26), X(11), {});
      b.item('healthvial', X(28), X(13), {});
      b.hazard('blades', E(35), 0.6, E(14) + 0.4, E(36), 1.6, E(15) - 0.4, 'blades', { on: false });
      b.button('bladesbtn', X(33), 1.3, E(15) + 0.08, 0);
      b.sign('ЛОВУШКА', X(33), 2.1, E(15) + 0.05, 0, 1.2, 0.3, { bg: '#401010', fg: '#f0d0a0' });
      b.npc('poisonzombie', X(35), X(11), { tag: 'trapz', sleep: true, wakeDist: 8 });
      b.npc('zombie', X(34), X(12), { tag: 'trapz', sleep: true, wakeDist: 8 });
      b.npc('zombie', X(36), X(10), { tag: 'trapz', sleep: true, wakeDist: 8 });
      b.item('ammo_buckshot', X(33), X(13), {});
      b.item('healthkit', X(37), X(13), {});
      b.ladder(E(23), X(22) - 0.4, E(23) + 0.2, X(22) + 0.4, 0, 6.8);
      b.box(E(22) - 0.2, 6.5, X(23) - 0.3, E(25) + 0.2, 6.6, X(23) + 0.3, 'planks');
      b.box(E(33) - 0.2, 6.5, X(21) - 0.3, E(34) + 0.4, 6.6, X(21) + 0.3, 'planks');
      zc(b, 'roofs', 16, 20, 33, 26, 6, 9);
      b.npc('fastzombie', X(30), X(24), { group: 'roofz', tag: 'roofz', y: 6.5, hate: true });
      b.npc('fastzombie', X(27), X(21), { group: 'roofz', tag: 'roofz', y: 6.5, hate: true });
      b.item('ammo_buckshot', X(31), X(22), { y: 6.5 });
      b.item('battery', X(18), X(24), { y: 6.5 });
      b.sign('λ', X(32) + 0.9, 7.2, X(25), -Math.PI / 2, 0.8, 0.8, { bg: '#303030', fg: '#e07818' });
      b.cache(E(31), E(24), E(33), E(26));
      b.item('ammo_smg', X(32), X(25), { y: 6.5 });
      b.item('healthkit', X(31), X(25), { y: 6.5 });
      zc(b, 'south', 34, 20, 44, 28);
      b.prop('barrel_red', X(38), X(24), {});
      b.prop('sawblade', X(36), X(26), {});
      b.npc('zombie', X(40), X(26), { sleep: true, wakeDist: 7, tag: 'southz' });
      b.npc('poisonzombie', X(42), X(22), { sleep: true, wakeDist: 7, tag: 'southz' });
      zc(b, 'cemetery', 45, 10, 55, 30);
      for (const [c, r] of [[47, 13], [49, 13], [51, 13], [47, 16], [49, 16], [51, 16], [47, 23], [49, 23], [51, 23], [53, 23], [47, 26], [49, 26], [51, 26]]) b.model(((c + r) % 3) ? 'grave' : 'cross', X(c), 0, X(r), 0, { solid: [0.35, 0.8, 0.1] });
      b.model('deadtree', X(54), 0, X(12));
      b.model('deadtree', X(46), 0, X(29));
      b.model('deadtree', X(53), 0, X(29));
      ceilingLight(b, X(49), 8.9, X(6), [0.9, 0.6, 0.35], 10);
      b.sign('✝', X(49), 12, E(10) - 0.05 + 0.1, 0, 1.2, 1.6, { bg: '#2a2420', fg: '#c8b890' });
      b.spot('grigcem', X(49), X(8), 0, 0);
      for (const [t, c, r] of [['zombie', 53, 18], ['zombie', 54, 21], ['zombie', 52, 28], ['fastzombie', 55, 12], ['zombie', 46, 20], ['poisonzombie', 54, 26], ['headcrab', 48, 28], ['headcrab', 50, 11]]) b.npc(t, X(c), X(r), { group: 'graveyard', tag: 'graveyard', hate: true });
      b.prop('barrel_red', X(50), X(18), {});
      b.prop('barrel_red', X(46), X(24), {});
      b.prop('sawblade', X(48), X(19), {});
      b.prop('sawblade', X(52), X(19), {});
      b.item('ammo_buckshot', X(49), X(9), {});
      b.door('minegate', E(56) - 0.2, 0, E(26), E(56), 3.4, E(29), { tex: 'gate', locked: true, move: [0, 3.2, 0] });
      zc(b, 'mine', 56, 26, 57, 28);
      b.light(X(55), 3, X(27), 1, 0.7, 0.4, 7);
    },
    tick(g) {
      const c = trapCar(g);
      if (c && !c.frozen && !g.flags.carCrashed && c.onGround) { g.flags.carCrashed = true; g.emit({ type: 'sound', name: 'crash', pos: c.pos }); g.emit({ type: 'shake', amount: 0.6, dur: 0.5 }); }
    },
    scripts: [
      { id: 'intro', steps: [['title', 5], ['wait', 2], ['hint', 'F — фонарик. Он расходует энергию костюма', 6]] },
      {
        id: 'courtyard', when: { zone: 'courtyard' }, steps: [
          ['group', 'yardz'], ['sound', 'zombie_alert'], ['hint', 'ПКМ — взять пилу гравипушкой, ЛКМ — метнуть', 6],
          ['wait', 6], ['hint', 'Рычаг у стены сбросит машину на мертвецов', 5]
        ]
      },
      {
        id: 'cardrop', when: { btn: 'cardrop' }, steps: [
          ['do', gm => { const c = trapCar(gm); if (c) { c.frozen = false; c.sleeping = false; c.vel = { x: 0, y: -2, z: 0 }; c.thrownBy = 'player'; c.thrownT = gm.time; } }],
          ['sound', 'door']
        ]
      },
      {
        id: 'street', when: { zone: 'street' }, steps: [
          ['group', 'streetz'], ['group', 'grigori'], ['wait', 1.5], ['npc', 'grigori', 'face', 'player'],
          ['say', 'grigori', 'Ха! Живая душа в моём приходе! Иди сюда, дитя, веди их ко мне, я упокою их!', 4.6],
          ['wait', 6], ['say', 'grigori', 'Не бойся их, они лишь плоть, которую покинул разум.', 3.4]
        ]
      },
      {
        id: 'shotgun', when: { zone: 'grighouse' }, steps: [
          ['until', g => !!g.npcById('grigori')], ['npc', 'grigori', 'face', 'player'],
          ['say', 'grigori', 'Держи, дитя. Моё старое ружьё. Тебе оно послужит лучше, чем мне.', 3.8],
          ['do', gm => { const it = gm.spawnItem('weapon_shotgun', X(27), X(14) + 0.4, { y: 6.8 }); it.vel = { x: 0, y: 2, z: 2.5 }; it.settled = false; gm.spawnItem('ammo_buckshot', X(28), X(15), {}); }],
          ['wait', 3], ['say', 'grigori', 'Иди через дома и крыши к кладбищу. Я встречу тебя там.', 3.4]
        ]
      },
      {
        id: 'blades', when: g => H.dist(g.player.pos, { x: E(34), y: 0, z: X(16) }) < 6, steps: [
          ['hint', 'Включите ловушку рубильником и заманите мертвецов в дверной проём', 6], ['npc', 'trapz', 'hate']
        ]
      },
      { id: 'bladeson', when: { btn: 'bladesbtn' }, steps: [['hazard', 'blades', true], ['sound', 'manhack']] },
      { id: 'roofs', when: { zone: 'roofs' }, steps: [['group', 'roofz'], ['sound', 'fastzombie_alert'], ['autosave']] },
      { id: 'south', when: { zone: 'south' }, steps: [['npc', 'southz', 'hate']] },
      {
        id: 'cemetery', when: { zone: 'cemetery' }, steps: [
          ['do', gm => { if (!gm.npcById('grigori')) gm.spawnGroup('grigori'); }],
          ['npc', 'grigori', 'teleport', X(49), X(10), 0], ['npc', 'grigori', 'set', { hold: { x: X(49), y: 0, z: X(10) } }],
          ['group', 'graveyard'], ['music', 'action'],
          ['say', 'grigori', 'Сюда, дитя! Встанем вместе против этой нечестивой толпы!', 3.4],
          ['do', gm => { gm.flags.graveT = gm.time + 45; }],
          ['until', g => g.tagCount('graveyard') <= 1 || g.time > g.flags.graveT],
          ['say', 'grigori', 'Иди! Проход к шахте за оградой. Там дорога к побережью. Я прикрою тебя!', 4],
          ['door', 'minegate', 'open'], ['autosave']
        ]
      },
      { id: 'mine', when: { zone: 'mine' }, steps: [['changelevel', 'c07']] }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
