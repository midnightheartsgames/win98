module.exports = H => {
  const MD = H.MapData, { blob, near } = H.Maps;

  const kit = M => {
    const put = (t, c, r, extra) => MD.add(M, Object.assign({ t, c, r, owner: -1 }, extra || {}));
    const mob = (unit, count, mood, c, r, tag) => put('monster', c, r, Object.assign({ unit, count, max: count * 3, mood }, tag ? { tag } : {}));
    const road = (kind, pts) => MD.road(M, 0, kind, pts);
    const sign = (c, r, msg) => put('signstone', c, r, { msg });
    const many = (t, list) => list.forEach(([c, r]) => put(t, c, r));
    return { put, mob, road, sign, many };
  };
  const doc = (name, about, M, players, heroes, goals) => ({ name, about, map: M, players, goals, heroes, events: [], scenes: '' });
  const human = town => ({ who: 'human', factions: ['league'], team: 0, town: town ? town.id : null });
  const loseAll = { kind: 'all' }, loseHero = { kind: 'hero', hid: 'adelina' };
  const winFlag = text => [{ kind: 'flag', flag: 'n_never', text }];

  const bell1 = () => {
    const M = MD.create(48, 48, ['meadow']), { put, mob, road, sign, many } = kit(M);
    const river = [[34, 0], [30, 10], [26, 22], [26, 33], [31, 47]];
    MD.paint(M, 0, 'sand', near(river, 2.4));
    MD.paint(M, 0, 'water', near(river, 1.3));
    MD.paint(M, 0, 'forest', blob(9, 22, 7, 9));
    MD.paint(M, 0, 'forest', blob(42, 22, 4, 7));
    MD.paint(M, 0, 'swamp', blob(41, 41, 4, 3));
    MD.paint(M, 0, 'rock', (c, r) => r === 18 && c >= 13 && c <= 21 && c !== 17);
    road(1, [[6, 43], [12, 40], [18, 37], [22, 33], [30, 33], [33, 30], [36, 22], [36, 15], [33, 8], [32, 6]]);
    road(1, [[18, 37], [12, 31], [6, 27]]);
    road(1, [[6, 27], [8, 18], [17, 13], [24, 10], [34, 10], [33, 8]]);
    road(1, [[33, 30], [40, 36], [42, 41]]);

    put('watchtower', 4, 41);
    put('dwell-militia', 9, 36);
    put('windmill', 31, 4, { tag: 'mill' });
    put('sawmill', 4, 25, { tag: 'sawmill' });
    put('oremine', 41, 40, { tag: 'oremine' });

    mob('shade', 8, 'fierce', 18, 36, 'raid1');
    mob('shade', 16, 'fierce', 33, 29, 'raid2');
    mob('shade', 26, 'fierce', 36, 14, 'raid3');
    mob('militia', 14, 'friendly', 21, 42);
    mob('wolves', 5, 'hostile', 5, 28);
    mob('bandits', 12, 'cautious', 40, 37);
    mob('wolves', 14, 'hostile', 8, 7);
    mob('crossbow', 8, 'hostile', 18, 12);

    many('res-gold', [[9, 41], [22, 39], [38, 33]]);
    many('res-wood', [[2, 30], [15, 28]]);
    many('res-ore', [[44, 36]]);
    many('campfire', [[13, 44], [29, 26]]);
    put('apiary', 13, 33);
    put('well', 22, 35);
    put('chapel', 30, 27);
    put('well', 36, 31);
    put('apiary', 40, 12);
    put('well', 34, 17);
    put('chest', 7, 6, { offer: 2 });
    put('artifact', 9, 5, { art: 'luckbone' });
    sign(20, 41, 'Мост на ремонте с 961 года. Брод там же, где был.');
    sign(11, 30, 'На лесопилку налево. Направо тоже лесопилка, но её ещё надо построить.');
    sign(26, 8, 'Здесь закопан клад. Подпись: тот, кто его уже выкопал.');
    many('tree', [[3, 37], [16, 42], [27, 41], [38, 26], [44, 16], [24, 2], [17, 30]]);
    many('pine', [[2, 18], [14, 22], [10, 14], [43, 22], [41, 26]]);
    many('rock', [[28, 18], [39, 6], [12, 46], [46, 45]]);
    put('mountain', 43, 4);
    put('mountain', 1, 2);

    return doc('Колокол на рассвете', 'Первая миссия кампании «Набат».', M, [human(null)], [{ owner: 0, hid: 'adelina', c: 6, r: 43, l: 0, tag: 'adelina', army: [{ unit: 'militia', count: 30 }, { unit: 'crossbow', count: 8 }] }], { win: winFlag('Выполнить задания миссии'), lose: [loseAll, loseHero] });
  };

  const ford2 = () => {
    const M = MD.create(48, 48, ['meadow']), { put, mob, road, sign, many } = kit(M);
    const river = [[0, 15], [12, 15], [24, 14], [36, 15], [47, 15]];
    MD.paint(M, 0, 'sand', near(river, 2.2));
    MD.paint(M, 0, 'water', near(river, 1.2));
    MD.paint(M, 0, 'forest', blob(16, 28, 5, 4));
    MD.paint(M, 0, 'forest', blob(40, 34, 6, 5));
    MD.paint(M, 0, 'swamp', blob(30, 44, 4, 3));
    MD.paint(M, 0, 'steppe', blob(40, 8, 8, 6));
    road(1, [[8, 38], [14, 34], [22, 26], [25, 20], [25, 11]]);
    road(1, [[14, 34], [24, 36], [33, 26], [36, 24]]);
    road(1, [[24, 36], [20, 42], [22, 44]]);
    road(1, [[25, 11], [26, 8], [36, 6]]);

    const town = put('town', 6, 36, { owner: 0, faction: 'league', name: 'Мельничный Брод', tag: 'brod', built: ['hall1', 'fort1', 'tavern', 'dwell1'], forbid: ['hall4', 'guild3', 'guild4', 'guild5', 'dwell7', 'dwell7u', 'altar', 'shipyard'] });
    put('outpost', 24, 17, { tag: 'fort', garrison: [{ unit: 'bandits', count: 110 }, { unit: 'mercenaries', count: 34 }, { unit: 'bears', count: 12 }] });
    put('sawmill', 2, 31);
    put('oremine', 12, 43);
    put('goldmine', 21, 44);
    mob('militia', 16, 'cautious', 24, 42);
    put('saltworks', 38, 41);
    mob('wolves', 16, 'hostile', 38, 39);
    put('sulfurspring', 44, 26);
    mob('bandits', 24, 'hostile', 44, 29);
    mob('mercenaries', 14, 'hostile', 36, 23, 'mercs');
    put('watermill', 17, 8);
    put('stable', 34, 44);
    put('camp', 30, 31);
    mob('boars', 10, 'hostile', 31, 34);
    many('res-gold', [[10, 41], [28, 38], [42, 44]]);
    many('res-wood', [[4, 44], [18, 24]]);
    many('res-ore', [[16, 38], [44, 36]]);
    many('res-salt', [[36, 36]]);
    many('res-sulfur', [[41, 21]]);
    many('campfire', [[20, 34], [33, 42]]);
    put('chest', 40, 9, { offer: 2 });
    put('artifact', 34, 5, { art: 'roadcloak' });
    mob('bandits', 30, 'hostile', 36, 8);
    sign(22, 22, 'Застава закрыта на учёт. Учёт ведут разбойники.');
    sign(7, 30, 'Мельничный Брод. Просьба не кормить ополчение после заката.');
    many('tree', [[2, 40], [13, 30], [28, 34], [38, 30], [45, 40], [18, 45]]);
    many('pine', [[15, 26], [18, 30], [40, 32], [42, 38]]);
    many('rock', [[10, 20], [32, 20], [3, 24], [46, 20]]);
    put('mountain', 1, 2);
    put('mountain', 12, 3);

    const gate = MD.entry(town);
    return doc('Мельничный брод', 'Вторая миссия кампании «Набат».', M, [human(town)], [{ owner: 0, hid: 'adelina', c: gate[0], r: gate[1], l: 0, tag: 'adelina', army: [{ unit: 'militia', count: 20 }, { unit: 'crossbow', count: 5 }] }], { win: winFlag('Выполнить задания миссии'), lose: [loseAll, loseHero] });
  };

  const salt3 = () => {
    const M = MD.create(80, 80, ['meadow']), { put, mob, road, sign, many } = kit(M);
    const river = [[32, 0], [36, 16], [38, 30], [34, 46], [38, 62], [36, 79]];
    MD.paint(M, 0, 'steppe', (c, r) => c + Math.sin(r * 0.2) * 3 > 46);
    MD.paint(M, 0, 'saltflat', blob(64, 34, 9, 7));
    MD.paint(M, 0, 'saltflat', blob(70, 12, 6, 5));
    MD.paint(M, 0, 'sand', near(river, 2.4));
    MD.paint(M, 0, 'water', near(river, 1.3));
    MD.paint(M, 0, 'forest', blob(18, 40, 7, 6));
    MD.paint(M, 0, 'forest', blob(12, 14, 7, 7));
    MD.paint(M, 0, 'forest', blob(52, 66, 6, 5));
    MD.paint(M, 0, 'swamp', blob(22, 70, 5, 3));
    MD.paint(M, 0, 'rock', (c, r) => c >= 46 && c <= 70 && Math.abs(r - (52 - (c - 46) * 0.2)) < 1 && !(c >= 53 && c <= 55));
    road(1, [[9, 62], [18, 58], [28, 50], [30, 46], [40, 46], [42, 42], [48, 34], [56, 24], [62, 18], [66, 16]]);
    road(1, [[28, 50], [24, 34], [28, 22], [30, 16], [44, 16], [56, 24]]);
    road(1, [[42, 42], [54, 52], [60, 62], [66, 70]]);
    road(1, [[66, 16], [72, 10]]);
    road(2, [[9, 62], [14, 72], [24, 74]]);

    const brod = put('town', 7, 60, { owner: 0, faction: 'league', name: 'Мельничный Брод', tag: 'brod', built: ['hall1', 'hall2', 'fort1', 'tavern', 'market', 'dwell1', 'dwell2', 'dwell3', 'smith', 'guild1'], forbid: ['hall4', 'dwell7', 'dwell7u', 'altar', 'shipyard', 'guild5'] });
    put('town', 64, 13, { owner: 0, faction: 'league', name: 'Солеварск', tag: 'solevarsk', built: ['hall1', 'fort1', 'market', 'store', 'caravan', 'dwell1'], forbid: ['hall4', 'dwell7', 'dwell7u', 'altar', 'shipyard', 'guild5'] });
    mob('bandits', 28, 'fierce', 35, 46, 'ford1');
    mob('shade', 30, 'fierce', 36, 16, 'ford2');
    mob('bandits', 34, 'fierce', 49, 33);
    mob('horsebow', 12, 'hostile', 59, 21);
    put('sawmill', 3, 54);
    put('oremine', 14, 73);
    put('goldmine', 24, 72);
    mob('militia', 22, 'cautious', 28, 75);
    put('saltworks', 72, 18);
    mob('stonewoman', 7, 'hostile', 72, 22);
    put('sulfurspring', 66, 70);
    mob('shade', 26, 'hostile', 64, 68);
    put('goldmine', 56, 8);
    mob('horsebow', 16, 'hostile', 56, 12);
    sign(58, 30, 'В пепле полынь. Кто-то жёг её не для тепла, а чтобы дым шёл прямо вверх.');
    put('signstone', 58, 27, { tag: 'camp' });
    put('kurganstone', 72, 4, { tag: 'kurgan' });
    mob('stonewoman', 10, 'fierce', 71, 8);
    put('wolfden', 14, 18);
    put('watchtower', 30, 40);
    put('camp', 20, 50);
    put('apiary', 44, 22);
    put('stable', 58, 60);
    put('chapel', 46, 44);
    put('inn', 40, 8);
    put('shrine1', 26, 56, { spell: 'balm' });
    put('shrine2', 50, 26, { spell: 'stoneskin' });
    many('res-gold', [[20, 62], [30, 30], [52, 18], [62, 44], [70, 30]]);
    many('res-wood', [[5, 70], [28, 12], [46, 60]]);
    many('res-ore', [[16, 50], [52, 40], [74, 44]]);
    many('res-salt', [[66, 36], [60, 30], [72, 70]]);
    many('res-sulfur', [[34, 66], [66, 64]]);
    many('campfire', [[22, 44], [44, 36], [60, 12]]);
    put('chest', 8, 8, { offer: 2 });
    mob('wolves', 20, 'hostile', 12, 9);
    put('artifact', 74, 74, { art: 'saltcharm' });
    mob('saltnoyon', 3, 'fierce', 73, 72);
    sign(25, 46, 'Соляной путь. За порчу подводы штраф. За порчу возчика штраф поменьше.');
    many('tree', [[10, 50], [24, 64], [40, 54], [44, 70], [6, 30], [28, 6]]);
    many('pine', [[14, 38], [20, 42], [10, 12], [16, 8], [50, 68]]);
    many('rock', [[62, 42], [74, 26], [60, 8], [48, 6], [70, 60]]);
    put('mountain', 76, 76);
    put('mountain', 2, 2);

    const gate = MD.entry(brod);
    return doc('Соляной путь', 'Третья миссия кампании «Набат».', M, [human(brod)], [{ owner: 0, hid: 'adelina', c: gate[0], r: gate[1], l: 0, tag: 'adelina', army: [{ unit: 'militia', count: 40 }, { unit: 'crossbow', count: 16 }, { unit: 'ringer', count: 6 }] }], { win: winFlag('Выполнить задания миссии'), lose: [loseAll, loseHero] });
  };

  const hall4 = () => {
    const M = MD.create(80, 80, ['meadow']), { put, mob, road, sign, many } = kit(M);
    const canal = [[0, 54], [20, 56], [52, 62], [79, 58]];
    MD.paint(M, 0, 'sand', near(canal, 1.8));
    MD.paint(M, 0, 'water', near(canal, 1));
    MD.paint(M, 0, 'forest', blob(20, 26, 8, 7));
    MD.paint(M, 0, 'forest', blob(62, 26, 8, 7));
    MD.paint(M, 0, 'swamp', blob(8, 70, 5, 4));
    road(2, [[40, 66], [40, 54], [26, 54], [16, 50]]);
    road(2, [[40, 54], [40, 40], [40, 24]]);
    road(2, [[40, 40], [56, 44], [66, 50]]);
    road(1, [[66, 50], [66, 66], [63, 66]]);
    road(1, [[40, 66], [63, 66]]);
    road(1, [[16, 50], [24, 34], [40, 24]]);
    road(1, [[40, 24], [56, 32], [66, 50]]);

    const city = put('town', 38, 63, { owner: 0, faction: 'league', name: 'Звонград', tag: 'zvongrad', built: ['hall1', 'hall2', 'hall3', 'fort1', 'fort2', 'tavern', 'market', 'store', 'smith', 'guild1', 'guild2', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'special1', 'special2', 'special4'], forbid: ['hall4', 'altar', 'shipyard'] });
    put('outpost', 14, 49, { tag: 'yard1', garrison: [{ unit: 'crossbow', count: 36 }, { unit: 'mercenaries', count: 36 }] });
    put('outpost', 40, 22, { tag: 'yard2', garrison: [{ unit: 'plated', count: 10 }, { unit: 'crossbow', count: 30 }, { unit: 'mercenaries', count: 28 }] });
    put('outpost', 66, 49, { tag: 'yard3', garrison: [{ unit: 'plated', count: 12 }, { unit: 'bountyhunters', count: 12 }, { unit: 'mercenaries', count: 36 }] });
    put('windmill', 62, 63, { tag: 'letters' });
    mob('mercenaries', 28, 'fierce', 40, 45, 'watch');
    mob('bandits', 28, 'hostile', 26, 40);
    mob('bandits', 30, 'hostile', 52, 36);
    put('oremine', 30, 70);
    put('sawmill', 48, 72);
    put('goldmine', 58, 70);
    mob('militia', 24, 'cautious', 57, 68);
    many('res-gold', [[30, 46], [50, 50], [34, 30], [60, 40], [8, 44]]);
    many('res-ore', [[44, 52], [24, 60], [52, 56], [10, 58]]);
    many('res-wood', [[32, 52], [46, 30]]);
    many('res-salt', [[20, 42], [68, 42]]);
    many('campfire', [[36, 52], [44, 34]]);
    put('chapel', 34, 40);
    put('camp', 48, 46);
    sign(42, 57, 'Подворье цеха свечников. Свечей нет. Цеха, как выяснилось, тоже.');
    sign(20, 52, 'Склады Мальса. Вход только с печатью, которую Мальс выдаёт себе сам.');
    many('tree', [[30, 54], [46, 58], [12, 40], [70, 40], [36, 18], [46, 16]]);
    many('pine', [[18, 24], [22, 30], [60, 24], [64, 30]]);
    many('rock', [[6, 30], [74, 30], [30, 8], [50, 8]]);
    put('mountain', 4, 4);
    put('mountain', 72, 4);
    put('mountain', 72, 72);

    const gate = MD.entry(city);
    const heroes = [{ owner: 0, hid: 'adelina', c: gate[0], r: gate[1], l: 0, tag: 'adelina', army: [{ unit: 'militia', count: 60 }, { unit: 'crossbow', count: 26 }, { unit: 'ringer', count: 12 }, { unit: 'plated', count: 5 }] }];
    return doc('Ночь в Ратуше', 'Четвёртая миссия кампании «Набат».', M, [human(city)], heroes, { win: winFlag('Выполнить задания миссии'), lose: [loseAll, loseHero] });
  };

  const siege5 = () => {
    const M = MD.create(80, 80, ['meadow']), { put, mob, road, sign, many } = kit(M);
    MD.paint(M, 0, 'steppe', (c, r) => c + r * 0.3 > 62 + Math.sin(r * 0.2) * 3);
    const canal = [[0, 58], [24, 58], [38, 52], [56, 56], [79, 54]];
    MD.paint(M, 0, 'sand', near(canal, 1.8));
    MD.paint(M, 0, 'water', near(canal, 1));
    MD.paint(M, 0, 'forest', blob(14, 30, 8, 7));
    MD.paint(M, 0, 'forest', blob(30, 14, 7, 5));
    MD.paint(M, 0, 'swamp', blob(54, 68, 6, 3));
    road(2, [[40, 47], [40, 34], [52, 24], [64, 14], [74, 7]]);
    road(2, [[40, 48], [24, 48], [24, 62], [12, 66]]);
    road(2, [[40, 48], [56, 48], [56, 60], [68, 64]]);
    road(1, [[40, 34], [26, 26], [10, 20]]);
    road(1, [[52, 24], [68, 30], [75, 40]]);
    road(1, [[40, 34], [40, 10], [40, 4]]);

    const FORBID = ['hall4', 'altar', 'shipyard'];
    const city = put('town', 38, 44, { owner: 0, faction: 'league', name: 'Звонград', tag: 'zvongrad', built: ['hall1', 'hall2', 'hall3', 'fort1', 'fort2', 'fort3', 'tavern', 'market', 'store', 'smith', 'caravan', 'guild1', 'guild2', 'guild3', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'dwell6', 'dwell1u', 'dwell2u', 'dwell3u', 'special1', 'special2', 'special3', 'special4'], branch: { 1: 'a', 2: 'a', 3: 'a' }, forbid: FORBID, garrison: [{ unit: 'pikeman', count: 60 }, { unit: 'heavycrossbow', count: 30 }, { unit: 'alarmist', count: 14 }, { unit: 'plated', count: 10 }] });
    put('town', 8, 64, { owner: 0, faction: 'league', name: 'Мельничный Брод', tag: 'brod', built: ['hall1', 'hall2', 'fort1', 'fort2', 'tavern', 'market', 'dwell1', 'dwell2', 'dwell3', 'caravan', 'smith'], forbid: FORBID, garrison: [{ unit: 'militia', count: 40 }, { unit: 'crossbow', count: 16 }] });
    put('town', 68, 62, { owner: 0, faction: 'league', name: 'Солеварск', tag: 'solevarsk', built: ['hall1', 'hall2', 'fort1', 'market', 'store', 'caravan', 'dwell1', 'dwell2', 'dwell3', 'dwell4'], forbid: FORBID, garrison: [{ unit: 'militia', count: 36 }, { unit: 'ringer', count: 10 }] });
    put('oremine', 26, 66);
    put('sawmill', 18, 50);
    put('goldmine', 56, 62);
    put('saltworks', 62, 44);
    put('sulfurspring', 26, 42);
    mob('militia', 30, 'friendly', 30, 54);
    mob('wolves', 18, 'hostile', 12, 44);
    put('dwell-horseguard', 50, 40);
    put('camp', 28, 36);
    put('chapel', 46, 58);
    many('res-gold', [[30, 40], [48, 34], [34, 62], [58, 50], [16, 56]]);
    many('res-ore', [[44, 60], [20, 44]]);
    many('res-wood', [[24, 52], [52, 44]]);
    many('res-sulfur', [[36, 26], [60, 50]]);
    many('res-salt', [[66, 50], [12, 60]]);
    many('campfire', [[32, 50], [46, 50]]);
    put('artifact', 6, 8, { art: 'bellcuirass' });
    mob('saltnoyon', 4, 'fierce', 8, 10);
    sign(44, 36, 'Торг закрыт по случаю конца света. Долги всё равно считаются.');
    sign(16, 62, 'До Звонграда два дня. До конца света, говорят, быстрее.');
    many('tree', [[20, 62], [34, 34], [50, 66], [6, 40], [70, 70]]);
    many('pine', [[10, 28], [18, 34], [28, 12], [34, 16]]);
    many('rock', [[60, 34], [72, 20], [4, 76], [24, 8]]);
    put('mountain', 72, 4);
    put('mountain', 2, 2);

    const gate = MD.entry(city);
    const heroes = [
      { owner: 0, hid: 'adelina', c: gate[0], r: gate[1], l: 0, tag: 'adelina', army: [{ unit: 'pikeman', count: 40 }, { unit: 'heavycrossbow', count: 24 }, { unit: 'alarmist', count: 10 }, { unit: 'plated', count: 8 }, { unit: 'aeronaut', count: 3 }] },
      { owner: 1, hid: 'timar', c: 74, r: 6, l: 0, tag: 'noyon', xp: 9000, army: [{ unit: 'shade', count: 80 }, { unit: 'horsebow', count: 34 }, { unit: 'stonewoman', count: 18 }, { unit: 'eaglespirit', count: 10 }, { unit: 'saltnoyon', count: 5 }, { unit: 'bonebull', count: 3 }] }
    ];
    return doc('Набат', 'Пятая миссия кампании «Набат».', M, [human(city), { who: 'ai', factions: ['barrows'], team: 1, town: null }], heroes, { win: winFlag('Выполнить задания миссии'), lose: [loseAll, loseHero] });
  };

  return { nabat1: bell1, nabat2: ford2, nabat3: salt3, nabat4: hall4, nabat5: siege5 };
};
