module.exports = H => {
  const MD = H.MapData, { blob, near } = H.Maps;

  const kit = (M, l) => {
    const put = (t, c, r, extra) => MD.add(M, Object.assign({ t, c, r, l: l || 0, owner: -1 }, extra || {}));
    const mob = (unit, count, mood, c, r, tag) => put('monster', c, r, Object.assign({ unit, count, max: count * 3, mood }, tag ? { tag } : {}));
    const sign = (c, r, text) => put('signstone', c, r, { text });
    const taken = (c, r) => M.objs.some(o => o.l === (l || 0) && MD.cells(o).some(([x, y]) => x === c && y === r));
    const fits = (c, r) => MD.inside(M, c, r) && !taken(c, r) && MD.groundCost(M, l || 0, c, r) > 0;
    const drift = (c, r) => {
      for (let d = 0; d < 9; d++) {
        for (let y = r - d; y <= r + d; y++) for (let x = c - d; x <= c + d; x++) if (Math.max(Math.abs(x - c), Math.abs(y - r)) === d && fits(x, y)) return [x, y];
      }
      return [c, r];
    };
    const many = (t, list, extra) => list.forEach(([c, r]) => {
      const [x, y] = drift(c, r);
      put(t, x, y, extra);
    });
    const guard = (o, unit, count, mood, tag) => {
      const [ec, er] = MD.entry(o), at = [[ec + 1, er + 1], [ec - 1, er + 1], [ec + 1, er], [ec - 1, er]].find(([x, y]) => MD.inside(M, x, y) && !taken(x, y) && MD.groundCost(M, l || 0, x, y) > 0) || [ec + 1, er + 1];
      mob(unit, count, mood, at[0], at[1], tag);
      return o;
    };
    return { put, mob, sign, many, guard };
  };
  const doc = (name, about, M, players, heroes, goals) => ({ name, about, map: M, players, goals, heroes, events: [], scenes: '' });
  const human = (town, team) => ({ who: 'human', factions: ['throne'], team: team == null ? 0 : team, town: town ? town.id : null });
  const order = town => ({ who: 'ai', factions: ['throne'], team: 1, town: town ? town.id : null });
  const lose = [{ kind: 'all' }, { kind: 'hero', hid: 'valeria' }];
  const win = [{ kind: 'flag', flag: 'n_never', text: 'Выполнить задания миссии' }];
  const NO_GROWTH = ['tavern', 'dwell1', 'dwell1u', 'dwell2', 'dwell2u', 'dwell3', 'dwell3u', 'dwell4', 'dwell4u', 'dwell5', 'dwell5u', 'dwell6', 'dwell6u', 'dwell7', 'dwell7u', 'altar', 'shipyard', 'hall3', 'hall4', 'guild1', 'market', 'caravan'];
  const HOME = ['hall4', 'dwell6', 'dwell6u', 'dwell7', 'dwell7u', 'altar', 'shipyard'];

  const court1 = () => {
    const M = MD.create(80, 80, ['highland']), { put, mob, sign, many, guard } = kit(M);
    MD.paint(M, 0, 'palegrass', blob(14, 40, 14, 12));
    MD.paint(M, 0, 'palegrass', blob(62, 30, 12, 9));
    MD.paint(M, 0, 'palegrass', blob(40, 64, 12, 8));
    MD.paint(M, 0, 'rock', blob(32, 26, 3, 6));
    MD.paint(M, 0, 'rock', blob(56, 50, 4, 3));
    MD.paint(M, 0, 'rock', blob(24, 74, 3, 2));
    MD.road(M, 0, 3, [[12, 41], [30, 41], [44, 36], [60, 36], [69, 27]]);
    MD.road(M, 0, 3, [[30, 41], [24, 14]]);
    MD.road(M, 0, 3, [[30, 41], [24, 66]]);

    const home = put('town', 4, 38, { owner: 0, faction: 'throne', name: 'Белый Двор', tag: 'home', built: ['hall1', 'hall2', 'fort1', 'tavern', 'market', 'smith', 'dwell1', 'dwell2', 'dwell3', 'guild1'], forbid: HOME });
    const loot = mob('mercenaries', 26, 'fierce', 42, 14, 'loot');
    put('petitioner', 22, 12, { tag: 'q1', quest: { kind: 'kill', obj: loot.id }, reward: { gold: 1000 } });
    put('petitioner', 22, 64, { tag: 'q2', quest: { kind: 'res', res: { moonsilver: 4 } }, reward: { gold: 1000 } });
    put('petitioner', 52, 58, { tag: 'q3', quest: { kind: 'army', unit: 'legionary', count: 20 }, reward: { gold: 1500 } });
    guard(put('library', 68, 25, { tag: 'archive' }), 'mirrorguard', 14, 'fierce');
    guard(put('whiteruin', 36, 49), 'silverspirit', 2, 'hostile');
    guard(put('whiteruin', 48, 20), 'legionary', 30, 'hostile');
    put('sawmill', 6, 54);
    guard(put('oremine', 14, 24), 'legionary', 20, 'hostile');
    guard(put('goldmine', 46, 44), 'whitespirit', 6, 'hostile');
    guard(put('moonrift', 40, 68), 'silverspirit', 2, 'hostile');
    guard(put('dwell-moonarcher', 60, 70), 'mercenaries', 20, 'hostile');
    guard(put('artifact', 72, 60, { art: 'thronehelm' }), 'whitespirit', 8, 'hostile');
    many('res-moonsilver', [[30, 58], [16, 52], [56, 12]]);
    many('res-gold', [[20, 30], [36, 36], [50, 30], [28, 50], [62, 44], [12, 70]]);
    many('res-ore', [[18, 20], [44, 56]]);
    many('res-wood', [[8, 60], [26, 20]]);
    many('campfire', [[34, 44], [58, 40]]);
    sign(18, 44, 'Белый Двор. Наследнице кланяться, регенту докладывать.');
    sign(64, 36, 'Зеркальный архив. Без печати регента не входить, с печатью тоже не советуем.');
    sign(40, 18, 'Старая колоннада. Колонн девять, царей ни одного.');
    many('rock', [[4, 4], [76, 76], [4, 76], [76, 4]]);
    const gate = MD.entry(home);
    return doc('Белый двор', 'Первая миссия кампании «Тысячелетие».', M, [human(home, 0)], [{ owner: 0, hid: 'valeria', c: gate[0], r: gate[1], l: 0, tag: 'valeria', army: [{ unit: 'legionary', count: 30 }, { unit: 'moonarcher', count: 8 }, { unit: 'mirrorguard', count: 4 }] }], { win, lose: lose.concat([{ kind: 'town', town: home.id }]) });
  };

  const flight2 = () => {
    const M = MD.create(80, 80, ['highland']), { put, mob, sign, many, guard } = kit(M);
    MD.paint(M, 0, 'palegrass', blob(70, 40, 9, 14));
    MD.paint(M, 0, 'palegrass', blob(8, 40, 8, 16));
    MD.paint(M, 0, 'rock', (c, r) => Math.abs(c - 52) <= 1 && !(Math.abs(r - 24) <= 2 || Math.abs(r - 56) <= 2));
    MD.paint(M, 0, 'rock', (c, r) => Math.abs(c - 26) <= 1 && !(Math.abs(r - 12) <= 2 || Math.abs(r - 40) <= 1 || Math.abs(r - 68) <= 2));
    MD.paint(M, 0, 'rock', blob(40, 40, 3, 6));
    MD.paint(M, 0, 'rock', blob(12, 64, 3, 3));
    MD.road(M, 0, 3, [[74, 40], [60, 34], [52, 24], [44, 22]]);
    MD.road(M, 0, 3, [[74, 40], [60, 48], [52, 56], [44, 58]]);
    MD.road(M, 0, 1, [[12, 30], [5, 39]]);

    put('watchtower', 2, 38, { tag: 'edge' });
    mob('throneknight', 16, 'fierce', 26, 40, 'post');
    guard(put('dwell-legionary', 62, 62), 'mercenaries', 14, 'hostile');
    guard(put('artifact', 40, 8, { art: 'striders' }), 'whitespirit', 10, 'hostile');
    guard(put('crystalgrotto', 38, 70), 'silverspirit', 2, 'hostile');
    mob('legionary', 40, 'hostile', 48, 30);
    mob('moonarcher', 16, 'hostile', 46, 52);
    mob('whitespirit', 8, 'hostile', 20, 26);
    mob('mercenaries', 24, 'hostile', 18, 60);
    many('campfire', [[66, 30], [64, 52], [44, 16], [34, 64], [16, 32]]);
    many('res-gold', [[58, 40], [46, 22], [32, 58], [14, 46], [24, 4]]);
    many('res-moonsilver', [[44, 46], [20, 50]]);
    put('stable', 60, 14, { tag: 'knights' });
    sign(70, 52, 'Белые руины. Дальше лунных дорог не ходить, там кончается царство.');
    sign(12, 30, 'Край руин. Отсюда уходят и не возвращаются, если умные.');
    many('rock', [[76, 4], [76, 76], [4, 4], [4, 76]]);
    return doc('Бегство', 'Вторая миссия кампании «Тысячелетие».', M, [human(null), order(null)], [
      { owner: 0, hid: 'valeria', c: 74, r: 40, l: 0, tag: 'valeria', army: [{ unit: 'legionary', count: 40 }, { unit: 'moonarcher', count: 12 }, { unit: 'mirrorguard', count: 6 }, { unit: 'moonmaiden', count: 3 }] },
      { owner: 1, hid: 'sabina', c: 12, r: 28, l: 0, tag: 'hunter3', patrol: 3, army: [{ unit: 'legionary', count: 20 }, { unit: 'moonarcher', count: 8 }] }
    ], { win, lose: lose.slice() });
  };

  const union3 = () => {
    const M = MD.create(112, 112, ['palegrass']), { put, mob, sign, many, guard } = kit(M);
    MD.paint(M, 0, 'meadow', blob(56, 96, 22, 12));
    MD.paint(M, 0, 'steppe', blob(96, 58, 12, 22));
    MD.paint(M, 0, 'forest', blob(14, 56, 12, 20));
    MD.paint(M, 0, 'sand', blob(18, 14, 16, 12));
    MD.paint(M, 0, 'water', blob(6, 4, 10, 6));
    MD.paint(M, 0, 'ash', blob(94, 14, 14, 10));
    MD.paint(M, 0, 'lava', blob(104, 6, 3, 2));
    MD.paint(M, 0, 'highland', blob(56, 14, 12, 8));
    MD.paint(M, 0, 'rock', blob(34, 34, 4, 3));
    MD.paint(M, 0, 'rock', blob(78, 34, 4, 3));
    MD.paint(M, 0, 'rock', blob(34, 78, 4, 3));
    MD.paint(M, 0, 'rock', blob(78, 78, 4, 3));
    MD.road(M, 0, 3, [[54, 55], [56, 96]]);
    MD.road(M, 0, 3, [[54, 55], [96, 58]]);
    MD.road(M, 0, 3, [[54, 55], [14, 58]]);
    MD.road(M, 0, 3, [[54, 55], [22, 18]]);
    MD.road(M, 0, 3, [[54, 55], [90, 20]]);

    const home = put('town', 50, 52, { owner: 0, faction: 'throne', name: 'Серебряный Порог', tag: 'home', built: ['hall1', 'hall2', 'fort1', 'fort2', 'tavern', 'market', 'smith', 'store', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'guild1', 'guild2'], forbid: HOME });
    const post = put('town', 52, 6, { owner: 1, faction: 'throne', name: 'Зеркальная застава', tag: 'post', built: ['hall1', 'fort1', 'fort2'], forbid: NO_GROWTH, garrison: [{ unit: 'legionary', count: 40 }, { unit: 'moonarcher', count: 14 }, { unit: 'mirrorguard', count: 8 }] });
    const cloaks = mob('crossbow', 40, 'fierce', 38, 100, 'cloaks');
    const pillar = mob('mirrorguard', 26, 'fierce', 20, 40, 'pillar');
    const dredge = mob('pirates', 36, 'fierce', 32, 8, 'dredge');
    put('petitioner', 56, 98, { tag: 'adel', quest: { kind: 'kill', obj: cloaks.id }, reward: { gold: 1000 } });
    put('petitioner', 98, 56, { tag: 'ais', quest: { kind: 'res', res: { salt: 6 } }, reward: { gold: 1000 } });
    put('petitioner', 10, 56, { tag: 'ved', quest: { kind: 'kill', obj: pillar.id }, reward: { gold: 1000 } });
    put('petitioner', 18, 16, { tag: 'nae', quest: { kind: 'kill', obj: dredge.id }, reward: { gold: 1000 } });
    put('petitioner', 92, 18, { tag: 'irg', quest: { kind: 'res', res: { ore: 10, sulfur: 4 } }, reward: { gold: 1000 } });
    guard(put('saltworks', 88, 72), 'shade', 40, 'hostile');
    guard(put('sulfurspring', 84, 26), 'salamander', 16, 'hostile');
    guard(put('oremine', 100, 30), 'apprentice', 40, 'hostile');
    guard(put('oremine', 40, 64), 'legionary', 30, 'hostile');
    put('sawmill', 62, 64);
    guard(put('goldmine', 70, 42), 'whitespirit', 10, 'hostile');
    guard(put('moonrift', 40, 42), 'silverspirit', 3, 'hostile');
    guard(put('dwell-deerrider', 66, 82), 'silverspirit', 3, 'hostile');
    guard(put('artifact', 6, 92, { art: 'moonamulet' }), 'werewolf', 30, 'hostile');
    guard(put('artifact', 104, 98, { art: 'khanaxe' }), 'horsebow', 30, 'hostile');
    many('res-salt', [[90, 50], [104, 66], [86, 60]]);
    many('res-sulfur', [[98, 10], [80, 16]]);
    many('res-ore', [[86, 22], [100, 22], [60, 70]]);
    many('res-gold', [[44, 60], [62, 46], [30, 56], [76, 56], [56, 30], [56, 80], [20, 90], [92, 90]]);
    many('res-moonsilver', [[46, 40], [66, 66]]);
    many('campfire', [[40, 52], [70, 60], [56, 36]]);
    sign(56, 88, 'Дельта Семи Рек. Мельничный Брод в трёх днях пути, если не останавливаться у трактиров.');
    sign(88, 56, 'Степь Ак-Туз. Курганы просят тишины, кони не слушают.');
    sign(22, 56, 'Заповедная Чаща. Рубить нельзя, ругаться можно тихо.');
    sign(26, 22, 'Берег Чаши. Колыбельную здесь поют даже рыбаки, но фальшиво.');
    sign(88, 26, 'Пепельные Горнила. Не трогай горячее, всё горячее.');
    many('rock', [[4, 108], [108, 108], [108, 40], [4, 40]]);
    const gate = MD.entry(home), pg = MD.entry(post);
    return doc('Союз пяти', 'Третья миссия кампании «Тысячелетие».', M, [human(home, 0), order(post)], [
      { owner: 0, hid: 'valeria', c: gate[0], r: gate[1], l: 0, tag: 'valeria', army: [{ unit: 'legionary', count: 50 }, { unit: 'moonarcher', count: 16 }, { unit: 'mirrorguard', count: 8 }, { unit: 'moonmaiden', count: 5 }, { unit: 'deerrider', count: 2 }] },
      { owner: 1, hid: 'cassian', c: pg[0], r: pg[1] + 1, l: 0, tag: 'cassian', patrol: 4, army: [{ unit: 'legionary', count: 30 }, { unit: 'moonarcher', count: 10 }, { unit: 'moonmaiden', count: 4 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: home.id }]) });
  };

  const ruins4 = () => {
    const M = MD.create(112, 112, ['highland']), { put, mob, sign, many, guard } = kit(M);
    MD.paint(M, 0, 'palegrass', blob(12, 56, 12, 18));
    MD.paint(M, 0, 'palegrass', blob(100, 56, 10, 16));
    MD.paint(M, 0, 'palegrass', blob(56, 22, 14, 8));
    MD.paint(M, 0, 'palegrass', blob(56, 88, 14, 8));
    MD.paint(M, 0, 'rock', blob(40, 38, 6, 4));
    MD.paint(M, 0, 'rock', blob(72, 38, 6, 4));
    MD.paint(M, 0, 'rock', blob(40, 74, 6, 4));
    MD.paint(M, 0, 'rock', blob(72, 74, 6, 4));
    MD.road(M, 0, 3, [[100, 56], [84, 30], [70, 22], [42, 22], [26, 30], [12, 52]]);
    MD.road(M, 0, 3, [[100, 56], [12, 56]]);
    MD.road(M, 0, 3, [[100, 56], [84, 82], [70, 90], [42, 90], [26, 82], [12, 60]]);

    const home = put('town', 4, 52, { owner: 0, faction: 'throne', name: 'Стан Союза', tag: 'home', built: ['hall1', 'hall2', 'hall3', 'fort1', 'fort2', 'tavern', 'market', 'smith', 'store', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'guild1', 'guild2', 'special2'], forbid: HOME, garrison: [{ unit: 'legionary', count: 40 }, { unit: 'moonarcher', count: 10 }] });
    const capital = put('town', 102, 52, { owner: 1, faction: 'throne', name: 'Верхний Престол', tag: 'capital', built: ['hall1', 'hall2', 'hall3', 'fort1', 'fort2', 'fort3', 'special1'], forbid: NO_GROWTH, garrison: [{ unit: 'legionary', count: 80 }, { unit: 'moonarcher', count: 30 }, { unit: 'throneknight', count: 6 }, { unit: 'shard', count: 1 }] });
    const r1 = put('whiteruin', 55, 20, { tag: 'r1', owner: 1 }), r2 = put('whiteruin', 55, 54, { tag: 'r2', owner: 1 }), r3 = put('whiteruin', 55, 88, { tag: 'r3', owner: 1 });
    guard(r1, 'legionary', 50, 'fierce');
    guard(r2, 'mirrorguard', 24, 'fierce');
    guard(r3, 'moonarcher', 30, 'fierce');
    guard(put('goldmine', 24, 40), 'whitespirit', 10, 'hostile');
    guard(put('moonrift', 24, 72), 'silverspirit', 3, 'hostile');
    put('sawmill', 8, 72);
    guard(put('oremine', 8, 36), 'legionary', 30, 'hostile');
    guard(put('dwell-throneknight', 40, 56), 'silverspirit', 4, 'hostile');
    guard(put('thronetreasury', 70, 56), 'moondream', 3, 'fierce');
    guard(put('artifact', 84, 12, { art: 'thronecoat' }), 'whitespirit', 14, 'hostile');
    guard(put('artifact', 84, 100, { art: 'throneshield' }), 'whitespirit', 14, 'hostile');
    many('res-moonsilver', [[30, 48], [30, 64], [70, 30], [70, 82]]);
    many('res-gold', [[20, 46], [20, 66], [44, 28], [44, 84], [64, 44], [64, 68], [86, 56]]);
    many('res-ore', [[16, 30], [16, 80]]);
    many('campfire', [[32, 56], [76, 56]]);
    sign(48, 26, 'Северная лунная дорога. По ней цари ездили на север, а мы ходим.');
    sign(48, 92, 'Южная лунная дорога. Если белые повозки, сойдите на обочину.');
    sign(92, 66, 'Верхний Престол. Без приглашения не пускают, с приглашением тоже не всех.');
    many('rock', [[4, 4], [108, 108], [4, 108], [108, 4]]);
    const gate = MD.entry(home), cg = MD.entry(capital);
    return doc('Белые руины', 'Четвёртая миссия кампании «Тысячелетие».', M, [human(home, 0), order(capital)], [
      { owner: 0, hid: 'valeria', c: gate[0], r: gate[1], l: 0, tag: 'valeria', army: [{ unit: 'legionary', count: 70 }, { unit: 'moonarcher', count: 24 }, { unit: 'mirrorguard', count: 12 }, { unit: 'moonmaiden', count: 8 }, { unit: 'deerrider', count: 4 }, { unit: 'throneknight', count: 1 }] },
      { owner: 1, hid: 'lucretia', c: cg[0], r: cg[1], l: 0, tag: 'keeper', patrol: 1, army: [{ unit: 'legionary', count: 40 }, { unit: 'moonmaiden', count: 6 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: home.id }]) });
  };

  const night5 = () => {
    const M = MD.create(144, 144, ['water', 'rock']), { put, mob, sign, many, guard } = kit(M), deep = kit(M, 1);
    const ring = (c, r) => Math.hypot(c - 72, r - 72) > 52;
    MD.paint(M, 0, 'palegrass', ring);
    MD.paint(M, 0, 'meadow', (c, r) => ring(c, r) && c < 30);
    MD.paint(M, 0, 'sand', (c, r) => !ring(c, r) && Math.hypot(c - 72, r - 72) > 49);
    MD.paint(M, 0, 'palegrass', blob(72, 14, 8, 10));
    MD.paint(M, 0, 'palegrass', blob(72, 130, 8, 10));
    MD.paint(M, 0, 'sand', near([[20, 72], [62, 72]], 1.6));
    MD.paint(M, 0, 'sand', blob(47, 69, 4, 3));
    MD.paint(M, 0, 'sand', blob(72, 72, 10, 10));
    MD.paint(M, 0, 'palegrass', blob(72, 72, 7, 7));
    MD.road(M, 0, 3, [[14, 72], [66, 72]]);
    MD.road(M, 0, 3, [[14, 72], [30, 40], [72, 18]]);
    MD.road(M, 0, 3, [[14, 72], [30, 104], [72, 126]]);
    MD.paint(M, 1, 'cave', blob(48, 69, 4, 4));
    MD.paint(M, 1, 'cave', near([[48, 69], [60, 72], [72, 72]], 2.2));
    MD.paint(M, 1, 'sand', blob(72, 72, 8, 7));

    const home = put('town', 4, 68, { owner: 0, faction: 'throne', name: 'Стан Союза', tag: 'home', built: ['hall1', 'hall2', 'hall3', 'fort1', 'fort2', 'fort3', 'tavern', 'market', 'smith', 'store', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'dwell6', 'guild1', 'guild2', 'guild3', 'special2', 'special4'], forbid: ['altar', 'shipyard', 'hall4'], garrison: [{ unit: 'legionary', count: 60 }, { unit: 'moonarcher', count: 20 }] });
    const alt1 = put('whiteruin', 71, 12, { tag: 'alt1', owner: 1 }), alt2 = put('whiteruin', 71, 128, { tag: 'alt2', owner: 1 });
    guard(alt1, 'mirrorguard', 30, 'fierce');
    guard(alt2, 'moonarcher', 40, 'fierce');
    mob('moondream', 40, 'fierce', 58, 72, 'ward');
    const down = put('stairsdown', 46, 66, { tag: 'down' }), up = deep.put('stairsup', 46, 66);
    down.link = up.id;
    up.link = down.id;
    deep.put('chapel', 72, 70, { tag: 'song' });
    deep.mob('silverspirit', 8, 'fierce', 62, 72);
    deep.many('res-moonsilver', [[52, 70], [66, 74]]);
    deep.sign(70, 75, 'Храм первой колыбельной. Здесь пели луне, когда она ещё была на небе.');
    guard(put('goldmine', 26, 92), 'whitespirit', 12, 'hostile');
    guard(put('moonrift', 26, 50), 'silverspirit', 3, 'hostile');
    guard(put('dwell-shard', 40, 120), 'moondream', 4, 'fierce');
    guard(put('artifact', 110, 20, { art: 'moonblade' }), 'moondream', 6, 'fierce');
    many('res-gold', [[20, 52], [20, 90], [40, 30], [40, 112], [100, 30], [100, 112], [60, 16], [60, 128]]);
    many('res-moonsilver', [[24, 60], [24, 84], [84, 16], [84, 128]]);
    many('campfire', [[30, 72], [44, 26], [44, 118]]);
    sign(22, 76, 'Стан Союза. Ночь Схождения через четыре недели. Сапоги чистить с вечера.');
    sign(76, 22, 'Северный алтарь Ордена. Огни не гасить до самого Схождения.');
    sign(76, 122, 'Южный алтарь Ордена. Огни не гасить, даже если очень хочется спать.');
    many('rock', [[4, 4], [140, 140], [4, 140], [140, 4]]);
    const gate = MD.entry(home);
    return doc('Ночь Схождения', 'Пятая миссия кампании «Тысячелетие».', M, [human(home, 0), order(null)], [
      { owner: 0, hid: 'valeria', c: gate[0], r: gate[1], l: 0, tag: 'valeria', army: [{ unit: 'legionary', count: 90 }, { unit: 'moonarcher', count: 30 }, { unit: 'mirrorguard', count: 16 }, { unit: 'moonmaiden', count: 12 }, { unit: 'deerrider', count: 6 }, { unit: 'throneknight', count: 3 }] },
      { owner: 1, hid: 'severin', c: 72, r: 76, l: 0, tag: 'regent', xp: 30000, patrol: 1, army: [{ unit: 'throneknight', count: 4 }, { unit: 'moonmaiden', count: 10 }, { unit: 'shard', count: 1 }, { unit: 'mirrorguard', count: 20 }, { unit: 'legionary', count: 60 }] },
      { owner: 1, hid: 'cassian', c: 71, r: 18, l: 0, tag: 'cassian', xp: 12000, patrol: 2, army: [{ unit: 'legionary', count: 40 }, { unit: 'moonarcher', count: 14 }, { unit: 'moonmaiden', count: 6 }] },
      { owner: 1, hid: 'lucretia', c: 71, r: 124, l: 0, tag: 'lucretia', xp: 12000, patrol: 2, army: [{ unit: 'legionary', count: 40 }, { unit: 'mirrorguard', count: 12 }, { unit: 'deerrider', count: 3 }] },
      { owner: 1, hid: 'cornelius', c: 130, r: 72, l: 0, tag: 'harborguard', patrol: 3, army: [{ unit: 'legionary', count: 30 }, { unit: 'moonmaiden', count: 6 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: home.id }]) });
  };

  return { tys1: court1, tys2: flight2, tys3: union3, tys4: ruins4, tys5: night5 };
};
