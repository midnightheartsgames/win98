(function (H) {
  'use strict';
  const { X, E, zc } = H.MU;

  const W = 70, HH = 40;
  const RK = 'ABCDEFGHIJKLM', SD = '0123456789!@$';
  const ch = (set, h) => set[H.clamp(Math.round(h) + 3, 0, 12)];
  const rocks = [[3, 9, 3], [8, 13, 2.5], [13, 11, 2], [18, 15, 2], [22, 10, 2.5], [27, 14, 2], [31, 18, 2.2], [45, 12, 4], [46, 20, 3], [52, 13, 5], [60, 12, 6], [58, 22, 4]];

  function terrain(c, r) {
    if (r <= 1 || c === 0 || c === W - 1) return 'R';
    if (r >= 30) return '~';
    if (r <= 4) return ch(RK, 5 + ((c * 7 + r * 3) % 3));
    if (c >= 33 && c <= 42 && (r <= 6 || r >= 24)) return 'R';
    for (const [rc, rr, rad] of rocks) if (Math.hypot(c - rc, (r - rr) * 1.2) <= rad) return ch(RK, 2);
    if (r >= 27) return ch(SD, 0);
    if (c >= 49) return ch(RK, 2);
    return ch(SD, 1);
  }

  const legend = {
    'R': { f: 16, w: 'cliff', rt: 'rock' },
    '~': { f: -3, smooth: true, t: 'sand', wl: -0.4, wt: 'water' },
    'V': { f: 5.5, w: 'planks', rt: 'roof_tin' },
    'v': { f: 2, c: 4.8, top: 5.4, t: 'planks', w: 'planks', ct: 'planks', rt: 'roof_tin' },
    'W': { f: 7, w: 'combine_wall', rt: 'combine_floor' },
    'w': { f: 2, c: 5, top: 7, t: 'combine_floor', w: 'combine', ct: 'metal' }
  };
  for (let i = 0; i < 13; i++) {
    legend[RK[i]] = { f: i - 3, smooth: true, t: 'rock', w: 'cliff' };
    legend[SD[i]] = { f: i - 3, smooth: true, t: 'sand', w: 'cliff', sand: true };
  }
  const rows = [];
  for (let r = 0; r < HH; r++) { let s = ''; for (let c = 0; c < W; c++) s += terrain(c, r); rows.push(s); }
  const put = (chr, c1, r1, c2, r2) => { for (let r = r1; r <= r2; r++) rows[r] = rows[r].slice(0, c1) + chr.repeat(c2 - c1 + 1) + rows[r].slice(c2 + 1); };
  put('V', 44, 9, 48, 13);
  put('v', 45, 10, 47, 12);
  put('v', 46, 13, 46, 13);
  put('W', 62, 5, 68, 24);
  put('w', 62, 13, 68, 16);

  const THUMPERS = [[X(10), X(13)], [X(27), X(14)]];

  H.maps.c08 = {
    id: 'c08', chapter: 7, music: 'coast', wind: true,
    env: { sky: 'coast', fog: [0.72, 0.74, 0.74], fogNear: 50, fogFar: 200, ambient: [0.64, 0.64, 0.62], indoorAmbient: [0.25, 0.25, 0.25], sun: { dir: [0.5, -1, 0.3], col: [0.85, 0.8, 0.64] } },
    legend, grid: rows,
    start: { x: X(3), z: X(9), yaw: Math.PI / 2 },
    menuCam: { x: X(20), z: X(20), y: 3.2, yaw: Math.PI / 2 },
    build(b) {
      const ty = (x, z) => b.world.terrainH(x, z);
      for (const [x, z] of THUMPERS) {
        b.model('thumper', x, ty(x, z), z, 0, { on: true });
        b.box(x - 0.8, ty(x, z), z - 0.8, x + 0.8, ty(x, z) + 3.2, z + 0.8, 'metal', { visible: false });
      }
      b.npc('rebel', X(4), X(8), { id: 'beachrebel', passive: true, yaw: Math.PI / 2, lines: ['На песок не ступай. Иди по камням или клади доски.'] });
      for (const [t, c, r] of [['pallet', 5, 12], ['pallet', 6, 16], ['plank', 11, 16], ['container', 15, 13], ['pallet', 16, 12], ['crate_big', 20, 13], ['plank', 24, 12], ['pallet', 24, 16], ['container', 29, 16], ['pallet', 30, 12]]) b.prop(t, X(c), X(r), { yaw: (c % 2) * Math.PI / 2 });
      b.prop('crate', X(13), X(10), { contains: 'healthvial' });
      b.prop('crate', X(22), X(9), { contains: 'ammo_ar2' });
      b.model('wreck', X(19), ty(X(19), X(22)), X(22), 1.2, { solid: [1, 1.4, 2.1] });
      b.model('boat', X(12), -0.3, X(28), 0.4);
      b.sign('НЕ СТУПАЙ НА ПЕСОК', X(18) + 0.1, 3.4, X(15) - 1.9, 0, 2.2, 0.4, { bg: '#5a4838', fg: '#101010' });
      b.item('battery', X(18), X(15), {});
      b.sign('λ', X(31), 3.2, X(18) - 2.3, 0, 0.8, 0.8, { bg: '#303030', fg: '#e07818' });
      b.box(X(31) - 1, ty(X(31), X(18)), X(18) - 2.5, X(31) + 1, ty(X(31), X(18)) + 2.2, X(18) - 2.3, 'planks');
      b.cache(E(30), E(17), E(33), E(20));
      b.item('ammo_rocket', X(31), X(18), {});
      b.item('healthkit', X(30), X(18), {});
      zc(b, 'sand1', 6, 5, 16, 28);
      zc(b, 'arena', 34, 7, 42, 23);
      for (const [c, r] of [[36, 10], [40, 20], [38, 15], [35, 19], [41, 11]]) b.prop('barrel_red', X(c), X(r), {});
      for (const [c, r] of [[37, 12], [39, 18], [36, 16]]) b.prop('crate_big', X(c), X(r), {});
      b.prop('car', X(41), X(9), { yaw: 0.8 });
      b.npc('antlionguard', X(39), X(15), { group: 'guard', id: 'guard', burrow: true, hate: true });
      b.npc('antlion', X(37), X(9), { group: 'guard', tag: 'guardpack', burrow: true, hate: true });
      b.npc('antlion', X(41), X(21), { group: 'guard', tag: 'guardpack', burrow: true, hate: true });
      zc(b, 'shack', 43, 8, 48, 16);
      b.light(X(46), 4.6, X(11), 1, 0.8, 0.5, 7);
      b.npc('vort', X(46), X(11), { id: 'vort', passive: true, yaw: Math.PI / 2, lines: ['Феропод пахнет их маткой. Они пойдут за тобой.'] });
      b.npc('vort', X(45), X(15), { id: 'vort2', passive: true, yaw: 0 });
      b.charger('health', X(45), 3.2, E(10) + 0.12, 0);
      b.item('ammo_ar2', X(47), X(10), {});
      b.item('ammo_grenade', X(47), X(12), {});
      zc(b, 'outpostfield', 49, 5, 61, 26);
      b.npc('soldier', X(58), X(10), { tag: 'outpost', yaw: -Math.PI / 2, stay: true, passive: true });
      b.npc('soldier', X(59), X(18), { tag: 'outpost', yaw: -Math.PI / 2, stay: true, passive: true });
      b.npc('elite', X(60), X(15), { tag: 'outpost', yaw: -Math.PI / 2, stay: true, passive: true });
      b.npc('soldier_shotgun', X(57), X(22), { tag: 'outpost', yaw: -Math.PI / 2, passive: true });
      b.npc('turret', X(56), X(13), { tag: 'outpost', yaw: -Math.PI / 2, passive: true });
      b.npc('turret', X(56), X(17), { tag: 'outpost', yaw: -Math.PI / 2, passive: true });
      b.model('sandbags', X(55), ty(X(55), X(11)), X(11), Math.PI / 2, { solid: [0.3, 0.75, 1.2] });
      b.model('sandbags', X(55), ty(X(55), X(19)), X(19), Math.PI / 2, { solid: [0.3, 0.75, 1.2] });
      b.model('barricade', X(61), ty(X(61), X(8)), X(8), Math.PI / 2);
      b.prop('barrel_red', X(57), X(15), {});
      b.prop('crate', X(58), X(20), { contains: 'ammo_ar2' });
      b.door('npgate', E(62) - 0.3, 2, E(13), E(62), 5, E(17), { tex: 'combine_wall', locked: true, move: [0, 2.9, 0] });
      b.light(X(65), 4.8, X(15), 0.6, 0.8, 1, 9);
      b.sign('НОВА ПРОСПЕКТ →', X(61) + 0.2, 6, X(12), -Math.PI / 2, 3, 0.6, { bg: '#20303c', fg: '#e0e8f0' });
      zc(b, 'np', 66, 13, 68, 16);
    },
    tick: H.MU.sandSpawner({ safe: THUMPERS }),
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 7], ['npc', 'beachrebel', 'face', 'player'],
          ['say', 'rebel', 'Дальше только пешком. Песок чувствует шаги, и муравьиные львы лезут наружу.', 4],
          ['say', 'rebel', 'Держись камней. Тамперы отпугивают их, пока бьют. Доски и ящики тоже сгодятся.', 4],
          ['hint', 'Ходите по камням и предметам. Гравипушкой можно выложить мост', 7]
        ]
      },
      { id: 'sand1', when: { zone: 'sand1' }, steps: [['wait', 4], ['hint', 'Рядом с тампером вы в безопасности', 4]] },
      {
        id: 'arena', when: { zone: 'arena' }, steps: [
          ['flag', 'noSpawn'], ['group', 'guard'], ['sound', 'guard_roar'], ['shake', 0.6, 1.5], ['music', 'action'],
          ['say', 'radio', 'Фримен, это страж муравьиных львов! Пули его почти не берут. Бочки, машины, всё тяжёлое!', 5],
          ['until', { dead: 'guard' }], ['wait', 1.5], ['flag', 'noSpawn', false], ['music', 'coast'], ['autosave'],
          ['say', 'vort', 'Страж пал! Иди к нам, Свободный человек. Мы извлечём его дар.', 3.4]
        ]
      },
      {
        id: 'bugbait', when: { all: [{ zone: 'shack' }, { dead: 'guard' }] }, steps: [
          ['npc', 'vort', 'face', 'player'],
          ['say', 'vort', 'Эти железы стражи зовут фероподами. С ними рой признает тебя своим.', 4],
          ['give', 'bugbait'], ['sound', 'bugbait_squeeze'],
          ['do', gm => { for (const n of gm.npcs) if (n.alive && n.type === 'antlion') { n.team = 'pet'; n.enemy = null; n.follow = true; } }],
          ['hint', 'ЛКМ — бросить феропод, рой атакует цель. ПКМ — сжать, рой вернётся к вам', 8],
          ['say', 'vort', 'Ступай по песку смело. Они придут на твой зов. Аванпост Альянса к востоку.', 3.8]
        ]
      },
      {
        id: 'outpost', when: { zone: 'outpostfield' }, steps: [
          ['npc', 'outpost', 'passive', false], ['npc', 'outpost', 'hate'], ['sayq', 'soldier', 'Биологическая угроза! Муравьиные львы на подходе!', 3],
          ['until', g => !g.npcs.some(n => n.alive && n.tag === 'outpost' && n.type !== 'turret')], ['wait', 1],
          ['sound', 'door'], ['door', 'npgate', 'open'], ['say', 'radio', 'Путь к Нова Проспект свободен. Удачи, Фримен.', 3], ['autosave']
        ]
      },
      { id: 'np', when: { zone: 'np' }, steps: [['changelevel', 'c09']] }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
