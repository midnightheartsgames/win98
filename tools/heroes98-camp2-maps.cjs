module.exports = H => {
  const MD = H.MapData, { blob } = H.Maps;

  const kit = M => {
    const put = (t, c, r, extra) => MD.add(M, Object.assign({ t, c, r, owner: -1 }, extra || {}));
    const mob = (unit, count, mood, c, r, tag) => put('monster', c, r, Object.assign({ unit, count, max: count * 3, mood }, tag ? { tag } : {}));
    const road = (kind, pts) => MD.road(M, 0, kind, pts);
    const sign = (c, r, text) => put('signstone', c, r, { text });
    const many = (t, list) => list.forEach(([c, r]) => put(t, c, r));
    return { put, mob, road, sign, many };
  };
  const doc = (name, about, M, players, heroes, goals) => ({ name, about, map: M, players, goals, heroes, events: [], scenes: '' });
  const human = (town, team) => ({ who: 'human', factions: ['barrows'], team: team == null ? 0 : team, town: town ? town.id : null });
  const lose = [{ kind: 'all' }, { kind: 'hero', hid: 'aisulu' }];
  const win = [{ kind: 'flag', flag: 'n_never', text: 'Выполнить задания миссии' }];
  const gateOf = o => MD.entry(o);

  const wind1 = () => {
    const M = MD.create(48, 48, ['steppe']), { put, mob, road, sign, many } = kit(M);
    MD.paint(M, 0, 'saltflat', blob(36, 34, 7, 5));
    MD.paint(M, 0, 'saltflat', blob(10, 10, 6, 4));
    MD.paint(M, 0, 'meadow', blob(8, 40, 6, 5));
    MD.paint(M, 0, 'rock', (c, r) => r === 24 && c >= 16 && c <= 30 && c !== 23);
    road(1, [[24, 38], [24, 30], [23, 24], [23, 18], [14, 12], [10, 11]]);
    road(1, [[24, 30], [34, 30], [40, 22], [42, 12]]);
    road(1, [[24, 30], [12, 30], [8, 36]]);

    const town = put('town', 22, 36, { owner: 0, faction: 'barrows', name: 'Кара-Оба', tag: 'karaoba', built: ['hall1', 'fort1', 'tavern', 'dwell1', 'dwell2', 'special1'], forbid: ['hall4', 'dwell6', 'dwell6u', 'dwell7', 'dwell7u', 'altar', 'shipyard', 'guild3', 'guild4', 'guild5', 'barrow3'], barrow: [{ unit: 'shade', count: 14 }], garrison: [{ unit: 'shade', count: 15 }] });
    put('kurganstone', 8, 8, { tag: 'kurgan1' });
    mob('bandits', 14, 'hostile', 12, 9);
    put('kurganstone', 42, 8, { tag: 'kurgan2' });
    mob('wolves', 12, 'hostile', 42, 11);
    put('kurganstone', 6, 36, { tag: 'kurgan3' });
    mob('bandits', 22, 'hostile', 9, 35);
    put('sawmill', 30, 42);
    mob('bandits', 10, 'hostile', 33, 42);
    put('oremine', 14, 42);
    mob('bandits', 10, 'hostile', 14, 40);
    put('saltworks', 36, 34);
    mob('scorpions', 6, 'hostile', 36, 32);
    put('goldmine', 28, 12);
    mob('horsebow', 8, 'cautious', 30, 15);
    many('res-gold', [[18, 32], [30, 28], [40, 42], [20, 8]]);
    many('res-wood', [[32, 38], [6, 44]]);
    many('res-ore', [[12, 38], [44, 26]]);
    many('res-salt', [[26, 20], [38, 28]]);
    many('campfire', [[18, 42], [34, 22]]);
    put('chest', 44, 44, { offer: 2 });
    mob('stonewoman', 5, 'hostile', 42, 42);
    put('artifact', 4, 4, { art: 'saltcharm' });
    sign(26, 32, 'Здесь лежит Бек-Мурза. Не спрашивайте его о долгах, он спросит в ответ.');
    sign(14, 28, 'Кара-Оба. Живым налево, остальным как обычно.');
    many('rock', [[34, 12], [6, 22], [44, 36], [20, 44]]);
    put('mountain', 2, 16);
    put('mountain', 38, 40);
    const gate = gateOf(town);
    return doc('Ветер над курганом', 'Первая миссия кампании «Соль».', M, [human(town), { who: 'ai', factions: ['league'], team: 1, town: null }], [
      { owner: 0, hid: 'aisulu', c: gate[0], r: gate[1], l: 0, tag: 'aisulu', army: [{ unit: 'shade', count: 20 }, { unit: 'horsebow', count: 5 }] },
      { owner: 1, hid: 'yosta', c: 44, r: 2, l: 0, tag: 'riders', patrol: 3, army: [{ unit: 'militia', count: 28 }, { unit: 'crossbow', count: 12 }, { unit: 'ringer', count: 3 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  const crust2 = () => {
    const M = MD.create(80, 80, ['saltflat']), { put, mob, road, sign, many } = kit(M);
    MD.paint(M, 0, 'steppe', (c, r) => c + r < 26);
    MD.paint(M, 0, 'steppe', (c, r) => c + r > 134);
    MD.paint(M, 0, 'sand', blob(40, 18, 6, 4));
    MD.paint(M, 0, 'rock', (c, r) => r === 26 && c !== 50 && c !== 51 && c !== 10 && c !== 11);
    MD.paint(M, 0, 'rock', (c, r) => r === 52 && c !== 24 && c !== 25 && c !== 66 && c !== 67);
    road(1, [[70, 10], [60, 18], [51, 24], [51, 30], [40, 40], [25, 50], [25, 56], [18, 66]]);
    road(3, [[18, 66], [8, 70], [2, 74]]);

    put('kurganstone', 58, 14, { tag: 'stone1' });
    put('kurganstone', 36, 36);
    put('kurganstone', 30, 60);
    mob('scorpions', 14, 'fierce', 51, 25, 'salt1');
    mob('horsebow', 20, 'hostile', 40, 41);
    mob('scorpions', 24, 'fierce', 25, 53);
    mob('bandits', 44, 'hostile', 66, 53);
    mob('wolves', 24, 'hostile', 10, 27);
    mob('crossbow', 30, 'hostile', 12, 67);
    put('signstone', 18, 62, { tag: 'tracks', text: 'Колея свежая. Узкие колёса с железом, белая пыль.' });
    put('signstone', 6, 72, { tag: 'exit', text: 'Край Белой корки.' });
    put('dwell-shade', 66, 22);
    put('dwell-horsebow', 44, 34);
    put('dwell-stonewoman', 34, 64);
    put('well', 60, 10);
    put('well', 42, 46);
    put('well', 22, 66);
    put('saltworks', 70, 40);
    mob('stonewoman', 7, 'hostile', 70, 38);
    many('res-gold', [[72, 18], [60, 32], [46, 42], [30, 44], [38, 58], [14, 62], [54, 12], [74, 30]]);
    many('res-salt', [[50, 18], [66, 30], [28, 40], [44, 56]]);
    many('campfire', [[62, 12], [48, 38], [28, 56]]);
    put('chest', 72, 66, { offer: 2 });
    mob('saltnoyon', 3, 'hostile', 70, 64);
    put('artifact', 6, 40, { art: 'saltstaff' });
    mob('stonewoman', 9, 'fierce', 8, 42);
    sign(66, 10, 'Белая корка. Воды нет. Если вы мертвы, это не ваша забота.');
    sign(52, 28, 'Соль здесь не покупают. Соль здесь покупает вас.');
    many('rock', [[64, 34], [44, 12], [20, 44], [12, 56], [68, 58], [50, 70]]);
    put('mountain', 4, 4);
    put('mountain', 72, 72);

    return doc('Белая корка', 'Вторая миссия кампании «Соль».', M, [human(null)], [{ owner: 0, hid: 'aisulu', c: 70, r: 10, l: 0, tag: 'aisulu', army: [{ unit: 'shade', count: 50 }, { unit: 'horsebow', count: 18 }, { unit: 'stonewoman', count: 6 }] }], { win, lose: lose.slice() });
  };

  const stones3 = () => {
    const M = MD.create(80, 80, ['steppe']), { put, mob, road, sign, many } = kit(M);
    MD.paint(M, 0, 'rock', (c, r) => r === 50 && c !== 14 && c !== 40);
    MD.paint(M, 0, 'rock', (c, r) => c === 28 && r < 50);
    MD.paint(M, 0, 'rock', (c, r) => c === 52 && r < 50 && r !== 30);
    MD.paint(M, 0, 'saltflat', blob(66, 20, 9, 8));
    MD.paint(M, 0, 'saltflat', blob(40, 66, 6, 4));
    road(1, [[40, 66], [40, 56], [40, 44], [40, 30], [52, 30], [62, 24]]);
    road(1, [[40, 56], [14, 56], [14, 44], [14, 28]]);

    const town = put('town', 38, 62, { owner: 0, faction: 'barrows', name: 'Каменная Стоянка', tag: 'camp', built: ['hall1', 'hall2', 'fort1', 'fort2', 'tavern', 'market', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'guild1', 'special1'], forbid: ['hall4', 'altar', 'shipyard', 'guild5'] });
    const bait1 = mob('bandits', 60, 'fierce', 12, 16, 'bait1');
    put('petitioner', 18, 20, { tag: 'rod1', quest: { kind: 'kill', obj: bait1.id }, reward: { gold: 2000, xp: 1500 } });
    put('sealer', 8, 30, { color: 0 });
    mob('wolves', 22, 'hostile', 11, 32);
    put('sealgate', 40, 50, { color: 0 });
    put('petitioner', 36, 16, { tag: 'rod2', quest: { kind: 'res', res: { salt: 6 } }, reward: { gold: 3000, xp: 2000 } });
    put('sealer', 44, 10, { color: 1 });
    mob('stonewoman', 12, 'hostile', 45, 14);
    put('sealgate', 52, 30, { color: 1 });
    const bait3 = mob('saltnoyon', 6, 'fierce', 66, 12, 'bait3');
    put('petitioner', 70, 20, { tag: 'rod3', quest: { kind: 'kill', obj: bait3.id }, reward: { gold: 4000, xp: 3000 } });
    put('saltworks', 22, 34);
    mob('wolves', 14, 'hostile', 24, 36);
    put('saltworks', 60, 34);
    mob('horsebow', 18, 'hostile', 60, 36);
    put('sawmill', 60, 66);
    put('oremine', 20, 66);
    put('goldmine', 64, 56);
    mob('shade', 40, 'hostile', 62, 55);
    many('res-salt', [[10, 22], [20, 40], [34, 36], [42, 24], [68, 34], [72, 12]]);
    many('res-gold', [[50, 60], [24, 58], [44, 44], [8, 44], [58, 16]]);
    many('res-wood', [[56, 70], [12, 70]]);
    many('res-ore', [[28, 70], [70, 62]]);
    many('campfire', [[30, 56], [36, 30], [62, 28]]);
    put('chest', 74, 74, { offer: 2 });
    mob('bonebull', 3, 'hostile', 72, 72);
    put('artifact', 4, 4, { art: 'khanaxe' });
    mob('eaglespirit', 8, 'fierce', 6, 6);
    sign(36, 52, 'Застава. Без печати рода не пройдёт ни живой, ни мёртвый, ни уважаемый человек из Звонграда.');
    sign(46, 56, 'Каменные бабы смотрят на восток. Просьба не загораживать.');
    many('rock', [[6, 60], [70, 44], [34, 8], [46, 40], [22, 10]]);
    put('mountain', 72, 2);
    put('mountain', 2, 72);
    const gate = gateOf(town);
    return doc('Каменные бабы', 'Третья миссия кампании «Соль».', M, [human(town)], [{ owner: 0, hid: 'aisulu', c: gate[0], r: gate[1], l: 0, tag: 'aisulu', army: [{ unit: 'shade', count: 60 }, { unit: 'horsebow', count: 24 }, { unit: 'stonewoman', count: 10 }, { unit: 'eaglespirit', count: 4 }] }], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  const moon4 = () => {
    const M = MD.create(80, 80, ['palegrass']), { put, mob, road, sign, many } = kit(M);
    const road4 = [[4, 70], [74, 70], [74, 48], [6, 48], [6, 24], [72, 24], [72, 7]], route = road4.slice(2);
    MD.paint(M, 0, 'water', (c, r) => r < 4);
    MD.paint(M, 0, 'sand', (c, r) => r >= 4 && r < 7);
    MD.paint(M, 0, 'rock', (c, r) => r === 60 && Math.abs(c - 74) > 1 && c !== 36);
    MD.paint(M, 0, 'rock', (c, r) => r === 36 && Math.abs(c - 6) > 1 && c !== 44);
    MD.paint(M, 0, 'forest', blob(58, 66, 8, 3));
    MD.paint(M, 0, 'forest', blob(24, 54, 10, 3));
    MD.paint(M, 0, 'swamp', blob(44, 42, 8, 3));
    MD.paint(M, 0, 'forest', blob(30, 30, 10, 3));
    road(3, road4);

    put('monster', 74, 60, { unit: 'bountyhunters', count: 26, max: 26, mood: 'fierce', tag: 'order', route, pace: 22 });
    mob('moondream', 3, 'fierce', 36, 60, 'gap1');
    mob('stonegiant', 3, 'fierce', 44, 36, 'gap2');
    mob('wolves', 30, 'hostile', 66, 74);
    mob('bandits', 50, 'hostile', 20, 42);
    mob('mercenaries', 30, 'hostile', 60, 28);
    put('dwell-eaglespirit', 14, 74);
    put('dwell-horsebow', 30, 74);
    put('whiteruin', 58, 18);
    put('well', 10, 66);
    put('well', 66, 44);
    put('well', 12, 28);
    many('res-gold', [[16, 66], [34, 66], [70, 66], [62, 52], [40, 44], [12, 44], [30, 20], [50, 28], [66, 12]]);
    many('res-moonsilver', [[24, 66], [52, 44], [40, 20]]);
    many('campfire', [[50, 66], [26, 44], [20, 20]]);
    put('shrine3', 20, 74, { spell: 'blackmark' });
    put('chest', 4, 12, { offer: 2 });
    mob('saltnoyon', 5, 'hostile', 8, 14);
    sign(8, 66, 'Лунная дорога. Построена Лунными царями, никем с тех пор не чинена и не стёрта.');
    sign(70, 44, 'До моря больше, чем кажется, и меньше, чем хотелось бы.');
    many('rock', [[30, 12], [60, 10], [60, 76], [72, 76]]);
    put('mountain', 2, 56);
    put('mountain', 70, 54);

    return doc('Ночь на лунной дороге', 'Четвёртая миссия кампании «Соль».', M, [human(null)], [{ owner: 0, hid: 'aisulu', c: 4, r: 70, l: 0, tag: 'aisulu', army: [{ unit: 'shade', count: 70 }, { unit: 'horsebow', count: 34 }, { unit: 'stonewoman', count: 14 }, { unit: 'eaglespirit', count: 10 }, { unit: 'saltnoyon', count: 4 }] }], { win, lose: lose.slice() });
  };

  const feast5 = () => {
    const M = MD.create(112, 112, ['steppe']), { put, mob, road, sign, many } = kit(M);
    MD.paint(M, 0, 'meadow', (c, r) => c + Math.sin(r * 0.2) * 3 < 54);
    MD.paint(M, 0, 'saltflat', blob(82, 54, 12, 9));
    MD.paint(M, 0, 'forest', blob(20, 76, 10, 8));
    MD.paint(M, 0, 'rock', (c, r) => c === 58 && !(r >= 21 && r <= 23) && !(r >= 87 && r <= 89));

    const FORBID = ['hall4', 'altar', 'shipyard'];
    const town = put('town', 92, 86, { owner: 0, faction: 'barrows', name: 'Ак-Оба', tag: 'akoba', built: ['hall1', 'hall2', 'hall3', 'fort1', 'fort2', 'tavern', 'market', 'smith', 'store', 'guild1', 'guild2', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'dwell1u', 'dwell2u', 'special1', 'barrow2', 'special3'], branch: { 1: 'a', 2: 'a' }, forbid: FORBID, garrison: [{ unit: 'mourner', count: 30 }, { unit: 'steppearcher', count: 16 }] });
    const khanTown = put('town', 92, 18, { owner: 1, faction: 'barrows', name: 'Ханский Холм', tag: 'kholm', built: ['hall1', 'hall2', 'fort1', 'tavern', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'special1'], forbid: FORBID });
    const foeTown = put('town', 14, 22, { owner: 2, faction: 'league', name: 'Речной Стан', tag: 'rechnoy', built: ['hall1', 'hall2', 'fort1', 'fort2', 'tavern', 'market', 'dwell1', 'dwell2', 'dwell3', 'dwell4'], forbid: FORBID.concat(['hall3', 'dwell5', 'dwell6', 'dwell7', 'fort3']), garrison: [{ unit: 'militia', count: 40 }, { unit: 'crossbow', count: 16 }] });
    const fort = put('town', 36, 56, { owner: 2, faction: 'league', name: 'Межевой форт', tag: 'fort', built: ['hall1', 'fort1', 'fort2', 'fort3', 'tavern'], forbid: FORBID.concat(['dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'dwell6', 'dwell7', 'hall2']), garrison: [{ unit: 'pikeman', count: 80 }, { unit: 'heavycrossbow', count: 30 }, { unit: 'plated', count: 12 }, { unit: 'aeronaut', count: 4 }] });
    const gate = gateOf(town), kg = gateOf(khanTown), lg = gateOf(foeTown), fg = gateOf(fort);
    road(2, [gate, [76, 88], [58, 88], [46, 80], fg]);
    road(1, [kg, [76, 22], [58, 22], [30, 24], lg]);
    road(1, [lg, [26, 40], fg]);
    put('hamlet', 50, 84, { tag: 'v1', gold: 1500 });
    put('hamlet', 38, 76, { tag: 'v2', gold: 1500 });
    put('hamlet', 50, 70, { tag: 'v3', gold: 1500 });
    put('hamlet', 28, 66, { tag: 'v4', gold: 1500 });
    mob('halberdier', 28, 'fierce', 58, 88);
    mob('crossbow', 60, 'hostile', 46, 80);
    mob('cityguard', 20, 'hostile', 44, 66);
    mob('halberdier', 20, 'fierce', 58, 22);
    put('kurganstone', 74, 76);
    put('kurganstone', 70, 92);
    put('sawmill', 102, 96);
    put('oremine', 80, 100);
    put('saltworks', 76, 54);
    mob('scorpions', 30, 'hostile', 76, 56);
    put('goldmine', 102, 66);
    mob('wolves', 40, 'hostile', 102, 68);
    put('goldmine', 70, 104);
    mob('stonewoman', 16, 'hostile', 68, 102);
    put('sulfurspring', 22, 86);
    mob('mercenaries', 40, 'hostile', 24, 88);
    put('saltworks', 44, 96);
    mob('bandits', 80, 'hostile', 46, 94);
    many('res-gold', [[84, 80], [64, 92], [76, 70], [66, 80], [96, 74], [52, 92], [42, 88], [30, 72]]);
    many('res-salt', [[86, 66], [72, 84], [36, 92]]);
    many('res-ore', [[86, 94], [72, 62]]);
    many('res-wood', [[98, 92], [62, 72]]);
    many('campfire', [[82, 92], [64, 84], [42, 72]]);
    mob('horsebow', 30, 'hostile', 72, 42);
    put('dwell-eaglespirit', 76, 34);
    put('dwell-bonebull', 66, 70);
    mob('bonebull', 6, 'fierce', 66, 68);
    put('artifact', 6, 104, { art: 'khanaxe' });
    mob('stonekhan', 2, 'fierce', 8, 102);
    sign(62, 86, 'Южный перевал. Проход по грамоте, пошлина соляная, спор решает комендант.');
    sign(52, 80, 'Здесь живут люди. Они ничего не вскрывали.');
    many('rock', [[66, 26], [100, 40], [80, 96], [46, 104], [14, 50]]);
    put('mountain', 104, 4);
    put('mountain', 4, 92);
    put('mountain', 66, 50);
    return doc('Тризна', 'Пятая миссия кампании «Соль».', M, [human(town, 0), { who: 'ai', factions: ['barrows'], team: 0, town: khanTown.id }, { who: 'ai', factions: ['league'], team: 1, town: foeTown.id }], [
      { owner: 0, hid: 'aisulu', c: gate[0], r: gate[1], l: 0, tag: 'aisulu', army: [{ unit: 'mourner', count: 60 }, { unit: 'steppearcher', count: 30 }, { unit: 'stonewoman', count: 16 }, { unit: 'eaglespirit', count: 12 }, { unit: 'saltnoyon', count: 6 }] },
      { owner: 1, hid: 'kaidar', c: kg[0], r: kg[1], l: 0, tag: 'kaidar', xp: 20000, army: [{ unit: 'shade', count: 90 }, { unit: 'horsebow', count: 40 }, { unit: 'stonewoman', count: 20 }, { unit: 'bonebull', count: 6 }, { unit: 'stonekhan', count: 2 }] },
      { owner: 2, hid: 'renier', c: fg[0], r: fg[1], l: 0, tag: 'renier', xp: 15000, patrol: 1, army: [{ unit: 'cityguard', count: 20 }, { unit: 'heavycrossbow', count: 20 }, { unit: 'plated', count: 10 }, { unit: 'cuirassier', count: 2 }] },
      { owner: 2, hid: 'ortwin', c: lg[0], r: lg[1], l: 0, tag: 'ortwin', xp: 15000, patrol: 3, army: [{ unit: 'pikeman', count: 20 }, { unit: 'heavycrossbow', count: 12 }, { unit: 'alarmist', count: 6 }, { unit: 'plated', count: 3 }, { unit: 'aeronaut', count: 1 }] }
    ], { win, lose: lose.slice() });
  };

  return { sol1: wind1, sol2: crust2, sol3: stones3, sol4: moon4, sol5: feast5 };
};
