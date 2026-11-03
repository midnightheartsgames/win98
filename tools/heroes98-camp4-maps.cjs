module.exports = H => {
  const MD = H.MapData, { blob, near } = H.Maps;

  const kit = (M, l) => {
    const put = (t, c, r, extra) => MD.add(M, Object.assign({ t, c, r, l: l || 0, owner: -1 }, extra || {}));
    const mob = (unit, count, mood, c, r, tag) => put('monster', c, r, Object.assign({ unit, count, max: count * 3, mood }, tag ? { tag } : {}));
    const sign = (c, r, text) => put('signstone', c, r, { text });
    const taken = (c, r) => M.objs.some(o => o.l === (l || 0) && MD.cells(o).some(([x, y]) => x === c && y === r));
    const fits = (wet, c, r) => MD.inside(M, c, r) && !taken(c, r) && (wet ? MD.isWater(M, l || 0, c, r) : MD.groundCost(M, l || 0, c, r) > 0);
    const drift = (wet, c, r) => {
      for (let d = 0; d < 9; d++) {
        for (let y = r - d; y <= r + d; y++) for (let x = c - d; x <= c + d; x++) if (Math.max(Math.abs(x - c), Math.abs(y - r)) === d && fits(wet, x, y)) return [x, y];
      }
      return [c, r];
    };
    const many = (t, list) => list.forEach(([c, r]) => {
      const [x, y] = drift(t === 'barrel', c, r);
      put(t, x, y);
    });
    const guard = (o, unit, count, mood, tag) => {
      const [ec, er] = MD.entry(o), at = [[ec + 1, er + 1], [ec - 1, er + 1], [ec + 1, er], [ec - 1, er]].find(([x, y]) => MD.inside(M, x, y) && !taken(x, y)) || [ec + 1, er + 1];
      mob(unit, count, mood, at[0], at[1], tag);
      return o;
    };
    return { put, mob, sign, many, guard };
  };
  const doc = (name, about, M, players, heroes, goals) => ({ name, about, map: M, players, goals, heroes, events: [], scenes: '' });
  const human = (town, team) => ({ who: 'human', factions: ['tide'], team: team == null ? 0 : team, town: town ? town.id : null });
  const lose = [{ kind: 'all' }, { kind: 'hero', hid: 'naera' }];
  const win = [{ kind: 'flag', flag: 'n_never', text: 'Выполнить задания миссии' }];
  const NO_GROWTH = ['tavern', 'dwell1', 'dwell1u', 'dwell2', 'dwell2u', 'dwell3', 'dwell3u', 'dwell4', 'dwell4u', 'dwell5', 'dwell5u', 'dwell6', 'dwell6u', 'dwell7', 'dwell7u', 'altar', 'shipyard', 'hall3', 'hall4'];
  const isle = (M, c, r, rx, ry, inner, l) => {
    MD.paint(M, l || 0, 'sand', blob(c, r, rx, ry));
    if (inner) MD.paint(M, l || 0, inner, blob(c, r, Math.max(1, rx - 2), Math.max(1, ry - 2)));
  };

  const lullaby1 = () => {
    const M = MD.create(48, 48, ['water']), { put, mob, sign, many, guard } = kit(M);
    isle(M, 10, 24, 9, 11, 'meadow');
    isle(M, 24, 7, 6, 4, 'palegrass');
    isle(M, 40, 22, 6, 6, 'meadow');
    isle(M, 26, 41, 7, 4);
    isle(M, 38, 35, 4, 3);
    isle(M, 43, 41, 3, 3);
    isle(M, 22, 25, 3, 3);
    isle(M, 32, 13, 3, 2);
    MD.paint(M, 0, 'sand', near([[18, 24], [20, 25]], 1));

    const town = put('town', 6, 21, { owner: 0, faction: 'tide', name: 'Раковинная Лагуна', tag: 'home', built: ['hall1', 'fort1', 'tavern', 'dwell1', 'dwell2'], forbid: ['hall4', 'dwell5', 'dwell5u', 'dwell6', 'dwell6u', 'dwell7', 'dwell7u', 'altar', 'special3'] });
    put('sawmill', 12, 28);
    put('goldmine', 5, 28);
    guard(put('crystalgrotto', 23, 5, { tag: 'grot1' }), 'pirates', 8, 'hostile');
    guard(put('crystalgrotto', 39, 19, { tag: 'grot2' }), 'pirates', 12, 'hostile');
    guard(put('crystalgrotto', 25, 39, { tag: 'grot3' }), 'azurespirit', 4, 'hostile');
    mob('pirates', 18, 'hostile', 38, 36, 'raid');
    put('chest', 39, 34, { offer: 2 });
    put('piratecove', 42, 40);
    put('saltworks', 21, 24);
    guard(put('ambermine', 31, 12), 'pirates', 6, 'hostile');
    many('res-gold', [[14, 20], [21, 8], [41, 25], [28, 42]]);
    many('res-wood', [[4, 20], [14, 31]]);
    many('res-salt', [[23, 26], [37, 34]]);
    many('res-amber', [[27, 6], [43, 22]]);
    many('barrel', [[19, 26], [46, 24]]);
    put('wreck', 22, 42);
    put('campfire', 8, 30);
    sign(13, 20, 'Раковинная Лагуна. Говори тише, здесь поют.');
    sign(22, 8, 'Северный грот. Эхо отсюда слышно на дне.');
    sign(36, 34, 'Кривой риф. Ныряльщиц не продаём. Покупаем. Подпись неразборчива.');
    many('rock', [[18, 12], [30, 30], [12, 42], [44, 8], [6, 6]]);
    const gate = MD.entry(town);
    return doc('Колыбельная', 'Первая миссия кампании «Чаша».', M, [human(town)], [{ owner: 0, hid: 'naera', c: gate[0], r: gate[1], l: 0, tag: 'naera', army: [{ unit: 'shellman', count: 24 }, { unit: 'harpooner', count: 6 }, { unit: 'jelly', count: 2 }] }], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  const pearl2 = () => {
    const M = MD.create(80, 80, ['water']), { put, mob, sign, many, guard } = kit(M);
    isle(M, 12, 40, 11, 13, 'meadow');
    isle(M, 20, 62, 5, 4);
    isle(M, 26, 30, 3, 3);
    isle(M, 28, 50, 3, 3);
    isle(M, 38, 14, 9, 7, 'meadow');
    isle(M, 40, 66, 9, 7, 'meadow');
    isle(M, 56, 40, 8, 8, 'palegrass');
    isle(M, 72, 40, 7, 9, 'palegrass');
    isle(M, 62, 66, 4, 3);
    isle(M, 60, 12, 4, 3);
    MD.paint(M, 0, 'sand', near([[63, 40], [66, 40]], 1.5));

    const town = put('town', 6, 37, { owner: 0, faction: 'tide', name: 'Раковинная Лагуна', tag: 'home', built: ['hall1', 'hall2', 'fort1', 'tavern', 'market', 'dwell1', 'dwell2', 'dwell3', 'guild1'], forbid: ['hall4', 'dwell7', 'dwell7u', 'altar'] });
    const isl1 = put('town', 35, 12, { faction: 'tide', name: 'Жемчужная Банка', tag: 'isl1', built: ['hall1', 'fort1', 'dwell1', 'dwell2'], garrison: [{ unit: 'shellman', count: 40 }, { unit: 'harpooner', count: 14 }, { unit: 'jelly', count: 6 }] });
    const isl2 = put('town', 37, 64, { faction: 'tide', name: 'Солёный Риф', tag: 'isl2', built: ['hall1', 'fort1', 'dwell1', 'dwell3'], garrison: [{ unit: 'shellman', count: 30 }, { unit: 'harpooner', count: 10 }, { unit: 'seawitch', count: 4 }] });
    const isl3 = put('town', 53, 38, { faction: 'tide', name: 'Белая Отмель', tag: 'isl3', built: ['hall1', 'fort1', 'dwell2', 'dwell4'], garrison: [{ unit: 'shellman', count: 30 }, { unit: 'jelly', count: 10 }, { unit: 'seawitch', count: 6 }, { unit: 'rayrider', count: 2 }] });
    const white = put('town', 70, 34, { owner: 1, faction: 'league', name: 'Белый причал', tag: 'pier', built: ['hall1', 'fort1'], forbid: NO_GROWTH.concat(['guild1', 'market', 'caravan']) });
    put('sawmill', 13, 46);
    put('oremine', 4, 46);
    guard(put('dwell-turtlefort', 19, 61, { tag: 'turtles', pool: 3 }), 'pirates', 16, 'hostile');
    guard(put('saltworks', 25, 29), 'pirates', 10, 'hostile');
    guard(put('ambermine', 27, 49), 'jelly', 8, 'hostile');
    put('goldmine', 41, 17);
    put('dwell-harpooner', 44, 68);
    put('piratecove', 61, 65);
    guard(put('luckspring', 60, 12), 'seaserpent', 2, 'hostile');
    put('artifact', 59, 11, { art: 'tidecoat' });
    many('res-gold', [[16, 34], [33, 18], [45, 62], [58, 44], [22, 60]]);
    many('res-wood', [[6, 46], [18, 44]]);
    many('res-salt', [[27, 31], [42, 70], [52, 44]]);
    many('res-amber', [[29, 51], [36, 10]]);
    many('barrel', [[20, 36], [44, 12], [38, 70]]);
    put('wreck', 64, 68);
    put('campfire', 10, 48);
    sign(17, 38, 'Перламутровые острова. Дань принимается жемчугом, солью и молчанием.');
    sign(60, 43, 'Белая Отмель. На отливе отсюда пешком до Белого причала.');
    many('rock', [[30, 6], [48, 28], [24, 74], [70, 70], [8, 8], [74, 6]]);
    const gate = MD.entry(town), wg = MD.entry(white);
    return doc('Перламутровые острова', 'Вторая миссия кампании «Чаша».', M, [human(town, 0), { who: 'ai', factions: ['league'], team: 1, town: white.id }], [
      { owner: 0, hid: 'naera', c: gate[0], r: gate[1], l: 0, tag: 'naera', army: [{ unit: 'shellman', count: 30 }, { unit: 'harpooner', count: 10 }, { unit: 'jelly', count: 4 }] },
      { owner: 1, hid: 'ortwin', c: wg[0], r: wg[1], l: 0, tag: 'pierguard', patrol: 1, army: [{ unit: 'crossbow', count: 20 }, { unit: 'mercenaries', count: 20 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  const fleet3 = () => {
    const M = MD.create(112, 112, ['water']), { put, mob, sign, many, guard } = kit(M);
    isle(M, 14, 56, 10, 12, 'meadow');
    isle(M, 54, 54, 6, 5, 'palegrass');
    isle(M, 56, 30, 4, 3);
    isle(M, 80, 56, 4, 3);
    isle(M, 56, 80, 4, 3);
    isle(M, 34, 56, 3, 3);
    isle(M, 30, 28, 5, 4, 'meadow');
    isle(M, 30, 86, 5, 4, 'meadow');
    isle(M, 86, 26, 6, 5, 'meadow');
    isle(M, 86, 88, 6, 5, 'meadow');
    isle(M, 100, 56, 6, 8, 'palegrass');

    const town = put('town', 9, 53, { owner: 0, faction: 'tide', name: 'Китовый Мыс', tag: 'home', built: ['hall1', 'hall2', 'fort1', 'fort2', 'tavern', 'market', 'smith', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'guild1', 'special1'], forbid: ['hall4', 'dwell7', 'dwell7u', 'altar'] });
    const white = put('town', 52, 52, { owner: 1, faction: 'league', name: 'Белая стоянка', tag: 'camp', built: ['hall1', 'fort1', 'fort2'], forbid: NO_GROWTH.concat(['guild1', 'market', 'caravan']) });
    mob('plated', 14, 'fierce', 56, 34, 'dr1');
    put('wreck', 55, 29);
    mob('crossbow', 44, 'fierce', 76, 56, 'dr2');
    put('wreck', 80, 55);
    mob('bountyhunters', 18, 'fierce', 56, 76, 'dr3');
    put('wreck', 55, 81);
    put('sawmill', 14, 64);
    put('goldmine', 6, 62);
    guard(put('saltworks', 29, 26), 'pirates', 20, 'hostile');
    guard(put('ambermine', 29, 86), 'pirates', 20, 'hostile');
    guard(put('dwell-rayrider', 85, 24), 'seaserpent', 3, 'hostile');
    put('sunkentemple', 85, 86);
    guard(put('dwell-turtlefort', 99, 54, { pool: 2 }), 'seaserpent', 4, 'hostile');
    put('artifact', 101, 60, { art: 'quiverbelt' });
    many('res-gold', [[18, 50], [32, 55], [58, 32], [82, 58], [58, 82], [28, 30], [88, 90]]);
    many('res-salt', [[31, 24], [86, 30], [102, 52]]);
    many('res-amber', [[28, 88], [84, 22]]);
    many('res-wood', [[10, 62], [20, 60]]);
    many('barrel', [[36, 56], [58, 28], [78, 58], [58, 78]]);
    put('watchtower', 34, 54);
    put('campfire', 18, 46);
    sign(20, 54, 'Китовый Мыс. Отсюда до Нижнего Престола два дня по воде, если не встретишь белых.');
    sign(57, 58, 'Белая стоянка. Посторонним не нырять.');
    many('rock', [[44, 40], [68, 40], [44, 70], [68, 70], [20, 100], [100, 10]]);
    const gate = MD.entry(town), wg = MD.entry(white);
    return doc('Белый флот', 'Третья миссия кампании «Чаша».', M, [human(town, 0), { who: 'ai', factions: ['league'], team: 1, town: white.id }], [
      { owner: 0, hid: 'naera', c: gate[0], r: gate[1], l: 0, tag: 'naera', army: [{ unit: 'shellman', count: 40 }, { unit: 'harpooner', count: 14 }, { unit: 'jelly', count: 10 }, { unit: 'seawitch', count: 4 }] },
      { owner: 1, hid: 'merra', c: 38, r: 56, l: 0, tag: 'merra', xp: 9000, patrol: 2, army: [{ unit: 'seawitch', count: 14 }, { unit: 'jelly', count: 20 }, { unit: 'stinger', count: 10 }, { unit: 'rayrider', count: 4 }] },
      { owner: 1, hid: 'yosta', c: wg[0], r: wg[1], l: 0, tag: 'campguard', patrol: 1, army: [{ unit: 'crossbow', count: 20 }, { unit: 'mercenaries', count: 30 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  const throne4 = () => {
    const M = MD.create(80, 80, ['water', 'rock']), { put, mob, sign, many, guard } = kit(M), deep = kit(M, 1);
    isle(M, 12, 40, 8, 10, 'meadow');
    isle(M, 40, 18, 4, 3);
    isle(M, 40, 62, 4, 3);
    isle(M, 66, 40, 6, 6, 'palegrass');
    MD.paint(M, 1, 'sand', blob(40, 40, 30, 30));
    MD.paint(M, 1, 'water', blob(18, 18, 4, 4));
    MD.paint(M, 1, 'water', blob(62, 62, 4, 4));
    MD.paint(M, 1, 'water', near([[18, 18], [40, 40], [62, 62]], 1.2));
    MD.paint(M, 1, 'water', near([[62, 18], [40, 40], [18, 62]], 1.2));
    MD.paint(M, 1, 'sand', blob(40, 40, 6, 6));
    MD.paint(M, 1, 'rock', (c, r) => Math.hypot(c - 40, r - 40) >= 6.5 && Math.hypot(c - 40, r - 40) <= 7.6 && Math.abs(c - 40) > 1 && Math.abs(r - 40) > 1);

    const d1 = put('whirlpool', 30, 22, { tag: 'down1' }), d2 = put('whirlpool', 50, 58, { tag: 'down2' });
    const u1 = deep.put('whirlpool', 17, 17, { tag: 'up1' }), u2 = deep.put('whirlpool', 61, 61, { tag: 'up2' });
    d1.link = u1.id;
    u1.link = d1.id;
    d2.link = u2.id;
    u2.link = d2.id;
    put('saltworks', 39, 16);
    guard(put('ambermine', 39, 61), 'seaserpent', 3, 'hostile');
    mob('seaserpent', 3, 'hostile', 43, 63);
    guard(put('dwell-seawitch', 65, 38), 'pirates', 30, 'hostile');
    many('res-gold', [[14, 34], [10, 46], [64, 44], [41, 20], [41, 64]]);
    many('res-salt', [[16, 44], [68, 36]]);
    put('campfire', 8, 36);
    sign(16, 36, 'Здесь Чаша глубже всего. Под нами крыши.');

    deep.guard(deep.put('sunkentemple', 39, 37, { tag: 'shell' }), 'moondream', 3, 'fierce');
    deep.guard(deep.put('sunkentemple', 20, 44), 'azurespirit', 12, 'fierce');
    deep.put('thronetreasury', 44, 18);
    deep.put('moonrift', 56, 30);
    deep.guard(deep.put('moonmine', 16, 30), 'whitespirit', 14, 'fierce');
    deep.many('res-moonsilver', [[30, 46], [46, 30], [24, 38], [56, 40]]);
    deep.many('res-gold', [[40, 26], [40, 54], [26, 40], [54, 40]]);
    deep.guard(deep.put('artifact', 50, 44, { art: 'thoughtband' }), 'moondream', 2, 'fierce');
    deep.sign(24, 18, 'Улица Лунных царей. Вода стоит здесь тысячу лет и никуда не спешит.');
    deep.sign(40, 47, 'Храм первой колыбельной. Вход для певчих.');

    return doc('Нижний Престол', 'Четвёртая миссия кампании «Чаша».', M, [human(null), { who: 'ai', factions: ['league'], team: 1, town: null }], [
      { owner: 0, hid: 'naera', c: 14, r: 40, l: 0, tag: 'naera', army: [{ unit: 'shellman', count: 60 }, { unit: 'harpooner', count: 24 }, { unit: 'jelly', count: 16 }, { unit: 'seawitch', count: 8 }, { unit: 'rayrider', count: 4 }] },
      { owner: 1, hid: 'ortwin', c: 58, r: 34, l: 1, tag: 'dig', xp: 6000, patrol: 2, army: [{ unit: 'crossbow', count: 24 }, { unit: 'plated', count: 6 }, { unit: 'mercenaries', count: 30 }, { unit: 'whitespirit', count: 4 }] }
    ], { win, lose: lose.slice() });
  };

  const wave5 = () => {
    const M = MD.create(112, 112, ['water']), { put, mob, sign, many, guard } = kit(M);
    isle(M, 20, 56, 14, 16, 'meadow');
    isle(M, 60, 56, 10, 8, 'palegrass');
    isle(M, 96, 56, 12, 16, 'palegrass');
    isle(M, 34, 24, 6, 5, 'meadow');
    isle(M, 34, 88, 6, 5, 'meadow');
    isle(M, 84, 20, 5, 4);
    isle(M, 84, 92, 5, 4);
    isle(M, 58, 12, 4, 3);
    isle(M, 58, 100, 4, 3);

    const town = put('town', 9, 53, { owner: 0, faction: 'tide', name: 'Раковинная Лагуна', tag: 'home', built: ['hall1', 'hall2', 'hall3', 'fort1', 'fort2', 'tavern', 'market', 'smith', 'store', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'dwell6', 'guild1', 'guild2', 'special1', 'special2'], forbid: ['altar'] });
    const harbor = put('town', 98, 50, { owner: 1, faction: 'league', name: 'Белая гавань', tag: 'harbor', built: ['hall1', 'hall2', 'fort1', 'fort2'], forbid: NO_GROWTH.concat(['guild1', 'market', 'caravan']), garrison: [{ unit: 'crossbow', count: 20 }, { unit: 'plated', count: 4 }, { unit: 'mercenaries', count: 20 }] });
    put('sawmill', 18, 66);
    put('goldmine', 12, 62);
    guard(put('saltworks', 33, 22), 'pirates', 30, 'hostile');
    guard(put('ambermine', 33, 86), 'pirates', 30, 'hostile');
    guard(put('goldmine', 59, 60), 'seaserpent', 4, 'hostile');
    guard(put('dwell-turtlefort', 83, 19, { pool: 2 }), 'seaserpent', 5, 'hostile');
    guard(put('dwell-rayrider', 83, 91), 'seaserpent', 5, 'hostile');
    put('sunkentemple', 57, 11);
    guard(put('luckspring', 57, 100), 'azurespirit', 14, 'hostile');
    many('res-gold', [[24, 46], [30, 60], [56, 54], [64, 58], [36, 22], [36, 90], [82, 22], [82, 94]]);
    many('res-salt', [[26, 64], [62, 54], [100, 66]]);
    many('res-amber', [[12, 48], [58, 64]]);
    many('res-wood', [[14, 68], [26, 50]]);
    many('barrel', [[30, 48], [66, 60], [86, 52]]);
    put('watchtower', 62, 49);
    put('campfire', 22, 44);
    sign(28, 56, 'Чаша дышит. Кто ждёт отлива, тот ходит посуху. Кто не ждёт, тот плавает.');
    sign(88, 60, 'Белая гавань. Флагман регента. Не подходить ближе выстрела.');
    many('rock', [[46, 30], [46, 82], [76, 40], [76, 72], [6, 6], [104, 104]]);
    const gate = MD.entry(town), hg = MD.entry(harbor);
    return doc('Девятый вал', 'Пятая миссия кампании «Чаша».', M, [human(town, 0), { who: 'ai', factions: ['league'], team: 1, town: harbor.id }], [
      { owner: 0, hid: 'naera', c: gate[0], r: gate[1], l: 0, tag: 'naera', army: [{ unit: 'shellman', count: 80 }, { unit: 'claw', count: 30 }, { unit: 'harpooner', count: 30 }, { unit: 'jelly', count: 20 }, { unit: 'seawitch', count: 12 }, { unit: 'rayrider', count: 6 }, { unit: 'turtlefort', count: 2 }] },
      { owner: 1, hid: 'merra', c: 87, r: 21, l: 0, tag: 'merra', xp: 20000, patrol: 1, army: [{ unit: 'seawitch', count: 10 }, { unit: 'stinger', count: 8 }, { unit: 'stormray', count: 2 }, { unit: 'turtlefort', count: 1 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  return { cha1: lullaby1, cha2: pearl2, cha3: fleet3, cha4: throne4, cha5: wave5 };
};
