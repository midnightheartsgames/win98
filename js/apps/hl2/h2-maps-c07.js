(function (H) {
  'use strict';
  const { X, E, zc, lamp } = H.MU;

  const W = 80, HH = 40;
  const GR = 'ABCDEFGHIJKLM', RD = 'abcdefghijklm', SD = '0123456789!@$';
  const ch = (set, h) => set[H.clamp(Math.round(h) + 3, 0, 12)];

  function terrain(c, r) {
    if (r === 0 || c === 0 || c === W - 1) return 'R';
    if (r >= 30) return '~';
    const ravine = c >= 26 && c <= 28;
    const roadH = c <= 37 ? 5 : c <= 45 ? 5 - (c - 37) * 0.5 : c <= 60 ? 1 : c <= 64 ? 1 + (c - 60) * 0.75 : 4;
    if (ravine) return r >= 24 ? '~' : ch(GR, -1);
    if (r <= 8) {
      const h = 7 + Math.round(1.5 * Math.sin(c * 0.37) + Math.cos(r * 0.9 + c * 0.2));
      const low = c >= 40 && c <= 60 ? 3 : 0;
      return ch(GR, Math.max(roadH + 2, h - low));
    }
    if (r <= 10) return ch(GR, roadH + 1 + (r === 9 ? 1 : 0));
    const beachSeg = c >= 42 && c <= 60;
    if (r <= 14) return beachSeg ? ch(SD, roadH) : ch(RD, roadH);
    if (c >= 64) return r <= 26 ? ch(GR, 4) : ch(SD, 1);
    if (beachSeg) return ch(SD, r >= 22 ? 0 : 1);
    if (r <= 17) return ch(GR, roadH - (r - 14) * 0.5);
    if (r <= 21) return ch(r >= 20 ? SD : GR, Math.max(0, (roadH - 2) * (21 - r) / 4));
    return ch(SD, r >= 27 ? -1 : 0);
  }

  const legend = {
    'R': { f: 20, w: 'cliff', rt: 'rock' },
    '~': { f: -3, smooth: true, t: 'sand', wl: -0.4, wt: 'water' },
    'N': { f: 10, w: 'plaster_white', rt: 'roof_tin' },
    'n': { f: 6, c: 9, top: 9.4, t: 'concrete', w: 'plaster', ct: 'planks', rt: 'roof_tin' },
    'O': { f: 10, w: 'brick', rt: 'roof_tin' },
    'o': { f: 6, c: 9, top: 9.4, t: 'concrete', w: 'planks', ct: 'planks', rt: 'roof_tin' },
    'P': { f: 9, w: 'brick', rt: 'roof_tin' },
    'p': { f: 5, c: 8, top: 8.4, t: 'wood_floor', w: 'planks', ct: 'planks', rt: 'roof_tin' }
  };
  for (let i = 0; i < 13; i++) {
    legend[GR[i]] = { f: i - 3, smooth: true, t: i < 5 ? 'dirt' : 'grass', w: 'cliff' };
    legend[RD[i]] = { f: i - 3, smooth: true, t: 'road', w: 'cliff' };
    legend[SD[i]] = { f: i - 3, smooth: true, t: 'sand', w: 'cliff', sand: true };
  }

  const rows = [];
  for (let r = 0; r < HH; r++) {
    let s = '';
    for (let c = 0; c < W; c++) s += terrain(c, r);
    rows.push(s);
  }
  const put = (chr, c1, r1, c2, r2) => { for (let r = r1; r <= r2; r++) rows[r] = rows[r].slice(0, c1) + chr.repeat(c2 - c1 + 1) + rows[r].slice(c2 + 1); };
  put('N', 13, 5, 17, 9);
  put('n', 14, 6, 16, 8);
  put('n', 15, 9, 15, 9);
  put('O', 2, 4, 7, 9);
  put('o', 3, 5, 6, 8);
  put('o', 4, 9, 5, 9);
  put('P', 68, 4, 74, 9);
  put('p', 69, 5, 73, 8);
  put('p', 71, 9, 71, 9);

  H.maps.c07 = {
    id: 'c07', chapter: 6, music: 'coast', wind: true,
    env: { sky: 'coast', fog: [0.7, 0.76, 0.8], fogNear: 60, fogFar: 230, ambient: [0.62, 0.64, 0.66], indoorAmbient: [0.26, 0.26, 0.26], sun: { dir: [-0.4, -1, 0.5], col: [0.85, 0.8, 0.66] } },
    legend, grid: rows,
    start: { x: X(6), z: X(11), yaw: Math.PI / 2 },
    menuCam: { x: X(50), z: X(20), y: 4, yaw: Math.PI * 1.1 },
    build(b) {
      b.vehicle('buggy', X(9), X(12) + 1, Math.PI / 2, { id: 'buggy', gun: true });
      b.npc('rebel', X(7), X(10), { id: 'garagerebel', passive: true, yaw: Math.PI / 2, lines: ['Одесса Кабб держит базу у маяка. Жми по шоссе на восток.'] });
      const ty = (x, z) => b.world.terrainH(x, z);
      b.light(X(4), 8.8, X(7), 1, 0.85, 0.6, 7);
      b.charger('health', X(3), 7.3, E(5) + 0.12, 0);
      b.item('ammo_smg', X(5), X(6), {});
      b.item('battery', X(6), X(6), {});
      b.model('tank', X(10), ty(X(10), X(4)) - 0.5, X(4), 0);
      zc(b, 'checkpoint', 10, 9, 18, 16);
      b.forcefield('field1', E(18) + 0.9, 4.5, E(11), E(18) + 1.1, 8.5, E(15), { locked: true });
      b.model('barricade', X(18), 5, E(10) + 0.3, 0);
      b.model('barricade', X(18), 5, E(16) - 0.3, 0);
      b.box(E(18) - 0.3, -1, E(1), E(19) + 0.3, 13, E(11), 'combine_wall');
      b.box(E(18) - 0.3, -4, E(15), E(19) + 0.3, 9, E(31), 'combine_wall');
      b.button('fieldbtn', X(16) + 0.8, 7.3, X(7), -Math.PI / 2);
      b.light(X(15), 8.8, X(7), 0.6, 0.8, 1, 7);
      b.item('weapon_ar2', X(14), X(7), {});
      b.item('ammo_ar2', X(14), X(8), {});
      b.item('healthkit', X(16), X(8), {});
      b.npc('soldier', X(15), X(10), { tag: 'cp', yaw: -Math.PI / 2 });
      b.npc('soldier', X(17), X(12), { tag: 'cp', yaw: -Math.PI / 2 });
      b.npc('soldier_shotgun', X(19), X(13), { tag: 'cp', yaw: -Math.PI / 2 });
      b.npc('elite', X(15), X(7), { tag: 'cp', yaw: Math.PI });
      b.prop('barrel_red', X(12), X(15), {});
      b.prop('crate', X(11), X(16), { contains: 'ammo_smg' });
      b.ramp(E(22), E(11), E(26), E(15), 5, 7, 'x+', 'metal_rust', { base: 4.5 });
      b.sign('МОСТ РАЗРУШЕН', X(20), 7.5, E(10) + 0.5, Math.PI / 2, 2.4, 0.5, { bg: '#5a4010', fg: '#fff0c0' });
      for (const c of [30, 36]) lamp(b, X(c), X(10), 0);
      zc(b, 'ravine', 20, 9, 30, 17);
      zc(b, 'beach', 40, 9, 60, 27);
      b.model('wreck', X(44), 1, X(18), 0.6, { solid: [1, 1.4, 2.1] });
      b.model('boat', X(52), -0.3, X(28), 1.2);
      b.model('thumper', X(56), 1, X(17), 0, { on: true });
      b.box(X(56) - 0.8, 1, X(17) - 0.8, X(56) + 0.8, 4.2, X(17) + 0.8, 'metal', { visible: false });
      b.prop('barrel_red', X(50), X(9), {});
      b.prop('crate', X(47), X(16), { contains: 'healthvial' });
      b.item('ammo_ar2', X(56), X(15), {});
      b.sign('λ', X(58) + 0.2, 2.8, X(21), -Math.PI / 2, 0.8, 0.8, { bg: '#303030', fg: '#e07818' });
      b.box(X(58) + 0.2, 0.8, X(21) - 1, X(58) + 0.6, 3.2, X(21) + 1, 'planks');
      b.cache(E(56), E(20), E(59), E(23));
      b.item('battery', X(57), X(21), {});
      b.item('ammo_grenade', X(57), X(22), {});
      zc(b, 'base', 62, 9, 78, 27);
      b.model('lighthouse', X(76), 4, X(20), 0);
      b.box(X(76) - 2.2, 4, X(20) - 2.2, X(76) + 2.2, 22, X(20) + 2.2, 'plaster_white', { visible: false });
      b.light(X(70), 7.8, X(6), 1, 0.85, 0.6, 8);
      b.npc('rebel', X(70), X(12), { tag: 'baserebels', yaw: 0 });
      b.npc('rebel_rpg', X(72), X(14), { tag: 'baserebels', yaw: 0 });
      b.npc('medic', X(66), X(13), { tag: 'baserebels', yaw: 0, medic: true });
      b.npc('rebel', X(74), X(11), { id: 'odessa', speaker: 'odessa', passive: true, yaw: Math.PI, lines: ['Ракетница у ящика с боеприпасами. Бери сколько нужно.'] });
      b.charger('rockets', X(66), 4.5, X(16), Math.PI / 2);
      b.item('weapon_rpg', X(67), X(15), {});
      b.charger('health', X(69) + 0.1, 6.3, E(5) + 0.12, 0);
      b.charger('suit', X(71), 6.3, E(5) + 0.12, 0);
      b.model('sandbags', X(68), 4, X(18), 0.3, { solid: [1.2, 0.75, 0.3] });
      b.model('sandbags', X(73), 4, X(17), -0.2, { solid: [1.2, 0.75, 0.3] });
      b.path('gun1', [[X(60), X(26), 16], [X(72), X(28), 18], [X(78), X(16), 17], [X(68), X(6), 18], [X(58), X(14), 16]]);
      b.npc('gunship', X(40), X(30), { group: 'gunship', id: 'gunship', y: 18, airPath: 'gun1', hate: true });
      zc(b, 'exit', 76, 24, 78, 27);
    },
    tick(g, dt) {
      if (g.flags.noAntlions) return;
      const p = g.player;
      const pos = p.vehicle ? p.vehicle.pos : p.pos;
      const cell = g.world.cellAt(pos.x, pos.z);
      if (!cell.sand || pos.x > E(61)) return;
      if (H.distXZ(pos, { x: X(56), z: X(17) }) < 9) return;
      g.flags.antT = (g.flags.antT || 1) - dt;
      if (g.flags.antT > 0) return;
      g.flags.antT = 2.2 + g.rng() * 1.5;
      if (g.npcs.filter(n => n.alive && n.type === 'antlion').length >= 6) return;
      const a = g.rng() * Math.PI * 2, d = 9 + g.rng() * 8;
      const x = pos.x + Math.sin(a) * d, z = pos.z + Math.cos(a) * d;
      const c2 = g.world.cellAt(x, z);
      if (!c2.sand || g.world.waterAt(x, z) > g.world.terrainH(x, z)) return;
      g.spawnNpc('antlion', x, z, { burrow: true, hate: true });
      g.emit({ type: 'sound', name: 'antlion_alert', pos: { x, y: pos.y, z } });
    },
    scripts: [
      {
        id: 'intro', steps: [
          ['title', 6], ['npc', 'garagerebel', 'face', 'player'],
          ['say', 'rebel', 'Держи багги. На нём тау-пушка, пригодится. Езжай по шоссе на восток, к маяку.', 4.4],
          ['say', 'rebel', 'Под мостом у нас КПП Альянса, а за ним дорога обвалилась. Разгонись как следует.', 4],
          ['hint', 'E — сесть в багги. Пробел — ручной тормоз, ЛКМ — тау-пушка', 7]
        ]
      },
      { id: 'checkpoint', when: { zone: 'checkpoint' }, steps: [['npc', 'cp', 'hate'], ['sayq', 'soldier', 'Нарушитель на КПП! Блокировать дорогу!', 2.5], ['hint', 'Поле отключается пультом в будке у дороги', 6]] },
      { id: 'field', when: { btn: 'fieldbtn' }, steps: [['door', 'field1', 'open'], ['sound', 'field'], ['autosave']] },
      { id: 'ravine', when: { zone: 'ravine' }, steps: [['hint', 'Трамплин! Разгонитесь и прыгайте через провал', 4]] },
      {
        id: 'beach', when: { zone: 'beach' }, steps: [
          ['say', 'radio', 'Фримен, это Одесса Кабб. Осторожнее на песке: муравьиные львы чуют вибрацию.', 4.2],
          ['hint', 'Не задерживайтесь на песке. Возле тампера муравьиные львы не появляются', 6]
        ]
      },
      {
        id: 'base', when: { zone: 'base' }, steps: [
          ['flag', 'noAntlions'], ['npc', 'odessa', 'face', 'player'],
          ['say', 'odessa', 'Мистер Фримен! Полковник Одесса Кабб, к вашим услугам. Вы как раз вовремя.', 4],
          ['group', 'gunship'], ['sound', 'siren'],
          ['say', 'odessa', 'Канонерка! Все к оружию! Гордон, ракетница у ящика. Рыжий ящик, видите?', 4],
          ['hint', 'Возьмите ракетницу. ЛКМ — выстрел, ракета летит за лазерной точкой', 7],
          ['until', { dead: 'gunship' }], ['wait', 1.5], ['music', 'coast'], ['flag', 'gunshipDown'],
          ['say', 'odessa', 'Великолепно! Дальше по берегу пешком, к Нова Проспект. Держитесь камней, песок кишит тварями.', 5],
          ['autosave'], ['hint', 'Выход с базы — у южного края мыса', 5]
        ]
      },
      { id: 'exit', when: { all: [{ zone: 'exit' }, { flag: 'gunshipDown' }] }, steps: [['changelevel', 'c08']] }
    ]
  };
})(globalThis.Hl2 = globalThis.Hl2 || {});
