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
  const human = (town, team) => ({ who: 'human', factions: ['thicket'], team: team == null ? 0 : team, town: town ? town.id : null });
  const lose = [{ kind: 'all' }, { kind: 'hero', hid: 'vedana' }];
  const win = [{ kind: 'flag', flag: 'n_never', text: 'Выполнить задания миссии' }];

  const axes1 = () => {
    const M = MD.create(48, 48, ['forest']), { put, mob, road, sign, many } = kit(M);
    MD.paint(M, 0, 'meadow', blob(24, 36, 11, 7));
    MD.paint(M, 0, 'meadow', blob(10, 12, 7, 5));
    MD.paint(M, 0, 'meadow', blob(38, 10, 7, 5));
    MD.paint(M, 0, 'meadow', blob(40, 40, 5, 4));
    MD.paint(M, 0, 'swamp', blob(8, 36, 6, 5));
    road(1, [[24, 39], [24, 28], [14, 16], [10, 14]]);
    road(1, [[24, 28], [34, 18], [38, 12]]);
    road(1, [[24, 39], [40, 42]]);

    const town = put('town', 22, 36, { owner: 0, faction: 'thicket', name: 'Заповедный Двор', tag: 'home', built: ['hall1', 'fort1', 'tavern', 'dwell1', 'dwell2'], forbid: ['hall4', 'dwell6', 'dwell6u', 'dwell7', 'dwell7u', 'altar', 'shipyard', 'guild3', 'guild4', 'guild5'], garrison: [{ unit: 'auka', count: 15 }] });
    mob('mercenaries', 8, 'hostile', 10, 12, 'cut1');
    put('sawmill', 6, 8);
    mob('mercenaries', 14, 'hostile', 38, 10, 'cut2');
    mob('bandits', 16, 'hostile', 33, 14);
    put('oremine', 42, 6);
    mob('mercenaries', 20, 'hostile', 40, 40, 'cut3');
    put('ambermine', 44, 44);
    put('witchring', 4, 36, { tag: 'circle1' });
    mob('wolves', 8, 'hostile', 8, 34);
    put('goldmine', 28, 10);
    mob('werewolf', 8, 'cautious', 28, 13);
    many('res-gold', [[18, 34], [30, 30], [14, 22], [36, 34]]);
    many('res-wood', [[26, 42], [10, 20]]);
    many('res-ore', [[32, 42], [20, 16]]);
    many('res-amber', [[12, 30], [34, 22]]);
    many('campfire', [[18, 42], [30, 20]]);
    put('chest', 4, 4, { offer: 2 });
    mob('bandits', 18, 'hostile', 7, 6);
    sign(26, 32, 'Заповедная межа. В рощах не рубят. Это написано по-хорошему, ниже будет по-плохому.');
    sign(16, 24, 'Ольховый лог. Лесник вышел и не вернулся, но обед его тёплый.');
    many('rock', [[36, 30], [6, 24], [44, 26], [20, 6]]);
    put('mountain', 44, 16);
    put('mountain', 14, 42);
    const gate = MD.entry(town);
    return doc('Аукнется', 'Первая миссия кампании «Заповедь».', M, [human(town)], [{ owner: 0, hid: 'vedana', c: gate[0], r: gate[1], l: 0, tag: 'vedana', army: [{ unit: 'auka', count: 24 }, { unit: 'bereginya', count: 3 }] }], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  const leshy2 = () => {
    const M = MD.create(80, 80, ['forest']), { put, mob, road, sign, many } = kit(M);
    MD.paint(M, 0, 'meadow', blob(14, 40, 12, 12));
    MD.paint(M, 0, 'meadow', blob(40, 40, 14, 10));
    MD.paint(M, 0, 'palegrass', blob(66, 40, 11, 12));
    MD.paint(M, 0, 'swamp', blob(40, 14, 10, 6));
    MD.paint(M, 0, 'swamp', blob(40, 66, 10, 6));
    MD.paint(M, 0, 'rock', (c, r) => c === 50 && !(r >= 43 && r <= 45));
    road(1, [[14, 44], [40, 44]]);
    road(1, [[40, 44], [40, 18]]);
    road(1, [[40, 44], [40, 62]]);

    const town = put('town', 12, 40, { owner: 0, faction: 'thicket', name: 'Заповедный Двор', tag: 'home', built: ['hall1', 'hall2', 'fort1', 'tavern', 'market', 'dwell1', 'dwell2', 'dwell3', 'guild1', 'special1'], forbid: ['hall4', 'altar', 'shipyard', 'guild4', 'guild5', 'dwell7', 'dwell7u'], garrison: [{ unit: 'auka', count: 30 }, { unit: 'werewolf', count: 8 }] });
    const old = put('town', 62, 40, { owner: 1, faction: 'thicket', name: 'Старый бор', tag: 'bor', built: ['hall1', 'fort1'], forbid: ['hall3', 'hall4', 'altar', 'shipyard', 'tavern', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'dwell6', 'dwell7', 'dwell1u', 'dwell2u', 'guild1', 'market'] });
    mob('bears', 14, 'fierce', 50, 44);
    put('witchring', 44, 12, { owner: 0 });
    put('witchring', 44, 70, { owner: 0 });
    put('dwell-sirin', 38, 10, { tag: 'nest', pool: 8 });
    mob('werewolf', 24, 'hostile', 40, 16);
    put('dwell-bereginya', 38, 68, { tag: 'spring', pool: 24 });
    mob('wolves', 30, 'hostile', 40, 64);
    put('hamlet', 22, 26, { tag: 'v1', gold: 1200, ward: 0 });
    put('hamlet', 22, 58, { tag: 'v2', gold: 1200, ward: 0 });
    put('sawmill', 8, 54);
    put('oremine', 8, 26);
    put('ambermine', 24, 62);
    mob('bears', 8, 'hostile', 24, 60);
    put('goldmine', 24, 18);
    mob('mercenaries', 20, 'hostile', 24, 20);
    many('res-gold', [[20, 36], [32, 46], [54, 36], [34, 56], [46, 24], [16, 62]]);
    many('res-amber', [[30, 22], [47, 58], [20, 48]]);
    many('res-wood', [[10, 48], [30, 30]]);
    many('res-ore', [[12, 30], [48, 48]]);
    many('campfire', [[22, 42], [40, 26], [40, 58]]);
    put('chest', 72, 72, { offer: 2 });
    mob('leshy', 2, 'hostile', 70, 70);
    put('artifact', 70, 8, { art: 'saltstaff' });
    mob('kikimora', 8, 'fierce', 68, 10);
    sign(30, 41, 'Заречье. Здесь считают, что леший живёт дальше. Просьба не разубеждать.');
    many('rock', [[56, 22], [20, 8], [56, 60], [8, 70]]);
    put('mountain', 72, 22);
    put('mountain', 2, 2);
    const gate = MD.entry(town), og = MD.entry(old);
    return doc('Леший не спит', 'Вторая миссия кампании «Заповедь».', M, [human(town, 0), { who: 'ai', factions: ['thicket'], team: 0, town: old.id }], [
      { owner: 0, hid: 'vedana', c: gate[0], r: gate[1], l: 0, tag: 'vedana', army: [{ unit: 'auka', count: 50 }, { unit: 'werewolf', count: 16 }, { unit: 'bereginya', count: 4 }] },
      { owner: 1, hid: 'borovoy', c: og[0], r: og[1], l: 0, tag: 'borovoy', xp: 5000, patrol: 1, army: [{ unit: 'werewolf', count: 30 }, { unit: 'kikimora', count: 6 }, { unit: 'leshy', count: 1 }] }
    ], { win, lose: lose.slice() });
  };

  const charter3 = () => {
    const M = MD.create(80, 80, ['meadow']), { put, mob, road, sign, many } = kit(M);
    MD.paint(M, 0, 'forest', (c, r) => c < 32 + Math.sin(r * 0.2) * 3);
    MD.paint(M, 0, 'forest', blob(58, 16, 12, 9));
    MD.paint(M, 0, 'swamp', blob(38, 62, 9, 6));
    road(1, [[14, 44], [38, 44], [66, 44]]);
    road(1, [[38, 44], [38, 18]]);

    const town = put('town', 12, 40, { owner: 0, faction: 'thicket', name: 'Заповедный Двор', tag: 'home', built: ['hall1', 'hall2', 'fort1', 'fort2', 'tavern', 'market', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'guild1', 'special1'], forbid: ['hall4', 'altar', 'shipyard', 'guild5'], garrison: [{ unit: 'auka', count: 30 }, { unit: 'werewolf', count: 12 }] });
    const ally = put('town', 64, 62, { owner: 1, faction: 'league', name: 'Речной Двор', tag: 'dvor', built: ['hall1', 'hall2', 'fort1', 'tavern', 'market', 'dwell1', 'dwell2', 'dwell3', 'dwell4'], forbid: ['hall4', 'altar', 'shipyard'] });
    const stan = put('town', 64, 10, { owner: 2, faction: 'league', name: 'Лесной Стан', tag: 'stan', built: ['hall1', 'fort1', 'tavern', 'dwell1', 'dwell2', 'dwell3'], forbid: ['hall3', 'hall4', 'altar', 'shipyard', 'dwell5', 'dwell6', 'dwell7'], garrison: [{ unit: 'militia', count: 40 }, { unit: 'crossbow', count: 16 }] });
    put('boundstone', 24, 20, { tag: 'stone1', quest: { kind: 'res', res: { amber: 5 } }, reward: { gold: 1500, xp: 1000 } });
    const camp2 = mob('mercenaries', 30, 'fierce', 38, 64, 'camp2');
    put('boundstone', 34, 66, { tag: 'stone2', quest: { kind: 'kill', obj: camp2.id }, reward: { gold: 2000, xp: 1500 } });
    put('boundstone', 44, 28, { tag: 'stone3', quest: { kind: 'army', unit: 'werewolf', count: 10 }, reward: { gold: 2500, xp: 2000 } });
    mob('mercenaries', 30, 'hostile', 40, 32);
    mob('bandits', 60, 'hostile', 52, 44, 'camp1');
    put('ambermine', 18, 24);
    mob('wolves', 16, 'hostile', 20, 22);
    put('sawmill', 8, 60);
    put('oremine', 8, 22);
    put('goldmine', 28, 60);
    mob('bears', 10, 'hostile', 28, 58);
    many('res-gold', [[20, 44], [30, 36], [36, 52], [46, 40], [14, 54], [52, 30]]);
    many('res-amber', [[10, 16], [22, 56], [42, 56]]);
    many('res-wood', [[14, 30], [30, 48]]);
    many('res-ore', [[8, 34], [40, 22]]);
    many('campfire', [[24, 40], [38, 30], [48, 56]]);
    put('chest', 4, 74, { offer: 2 });
    mob('kikimora', 8, 'hostile', 6, 70);
    sign(30, 42, 'Межа. Этот камень поставили обе стороны, и обе считают, что он стоит не там.');
    many('rock', [[52, 66], [70, 30], [16, 68], [54, 24]]);
    put('mountain', 72, 72);
    put('mountain', 2, 2);
    const gate = MD.entry(town), ag = MD.entry(ally), sg = MD.entry(stan);
    return doc('Грамота', 'Третья миссия кампании «Заповедь».', M, [human(town, 0), { who: 'ai', factions: ['league'], team: 0, town: ally.id }, { who: 'ai', factions: ['league'], team: 1, town: stan.id }], [
      { owner: 0, hid: 'vedana', c: gate[0], r: gate[1], l: 0, tag: 'vedana', army: [{ unit: 'auka', count: 70 }, { unit: 'werewolf', count: 30 }, { unit: 'bereginya', count: 10 }, { unit: 'kikimora', count: 4 }] },
      { owner: 1, hid: 'adelina', c: ag[0], r: ag[1], l: 0, tag: 'adelina', xp: 7000, army: [{ unit: 'pikeman', count: 60 }, { unit: 'heavycrossbow', count: 24 }, { unit: 'alarmist', count: 10 }, { unit: 'plated', count: 6 }] },
      { owner: 2, hid: 'tobias', c: sg[0], r: sg[1], l: 0, tag: 'tobias', xp: 3000, patrol: 2, army: [{ unit: 'militia', count: 50 }, { unit: 'crossbow', count: 20 }, { unit: 'plated', count: 4 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  const lake4 = () => {
    const M = MD.create(80, 80, ['forest']), { put, mob, road, sign, many } = kit(M);
    MD.paint(M, 0, 'water', blob(40, 40, 22, 18));
    MD.paint(M, 0, 'palegrass', blob(40, 40, 5, 4));
    MD.paint(M, 0, 'swamp', blob(12, 40, 7, 8));
    MD.paint(M, 0, 'swamp', blob(68, 40, 7, 8));
    MD.paint(M, 0, 'meadow', blob(40, 70, 12, 6));
    MD.paint(M, 0, 'meadow', blob(40, 10, 12, 6));
    road(1, [[40, 72], [20, 66], [10, 50], [10, 28], [24, 12], [40, 10]]);
    road(1, [[40, 72], [60, 66], [70, 50], [70, 28], [56, 12], [40, 10]]);

    put('dwell-kikimora', 30, 72);
    put('dwell-werewolf', 50, 72);
    mob('whitespirit', 22, 'fierce', 40, 8, 'post1');
    put('menhir', 42, 6);
    mob('whitespirit', 24, 'fierce', 72, 40, 'post2');
    put('menhir', 74, 42);
    mob('silverspirit', 10, 'fierce', 40, 39, 'post3');
    put('menhir', 42, 40);
    const shore = put('ferry', 40, 60, { tag: 'shore' }), isle = put('ferry', 38, 42, { tag: 'isle' });
    shore.link = isle.id;
    isle.link = shore.id;
    mob('mercenaries', 36, 'hostile', 10, 54);
    mob('kikimora', 10, 'hostile', 70, 54);
    mob('sirin', 4, 'hostile', 12, 26);
    put('well', 22, 68);
    put('well', 60, 68);
    put('ambermine', 8, 12);
    mob('bears', 14, 'hostile', 10, 14);
    put('goldmine', 72, 12);
    mob('werewolf', 30, 'hostile', 70, 14);
    many('res-gold', [[30, 68], [52, 68], [14, 60], [66, 60], [8, 34], [72, 32], [28, 12], [52, 12]]);
    many('res-amber', [[6, 44], [74, 50], [40, 4]]);
    many('campfire', [[36, 74], [62, 62], [18, 18]]);
    put('chest', 4, 76, { offer: 2 });
    mob('leshy', 3, 'hostile', 6, 72);
    sign(44, 66, 'Змеево озеро. Не будить. Подпись стёрта, просьба осталась.');
    many('rock', [[20, 30], [60, 30], [16, 62], [64, 62]]);
    put('mountain', 2, 2);
    put('mountain', 74, 2);

    return doc('Змеево озеро', 'Четвёртая миссия кампании «Заповедь».', M, [human(null)], [{ owner: 0, hid: 'vedana', c: 40, r: 72, l: 0, tag: 'vedana', army: [{ unit: 'mocker', count: 70 }, { unit: 'werewolf', count: 40 }, { unit: 'keeper', count: 16 }, { unit: 'kikimora', count: 10 }, { unit: 'sirin', count: 4 }] }], { win, lose: lose.slice() });
  };

  const branch5 = () => {
    const M = MD.create(112, 112, ['forest']), { put, mob, road, sign, many } = kit(M);
    MD.paint(M, 0, 'meadow', blob(24, 56, 18, 18));
    MD.paint(M, 0, 'palegrass', blob(92, 56, 16, 18));
    MD.paint(M, 0, 'swamp', blob(56, 30, 12, 9));
    MD.paint(M, 0, 'swamp', blob(56, 84, 12, 9));
    MD.paint(M, 0, 'rock', (c, r) => c === 60 && !(r >= 44 && r <= 46) && !(r >= 66 && r <= 68));

    const town = put('town', 20, 54, { owner: 0, faction: 'thicket', name: 'Берёзовая Роща', tag: 'grove', built: ['hall1', 'hall2', 'hall3', 'fort1', 'fort2', 'tavern', 'market', 'smith', 'store', 'guild1', 'guild2', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'dwell6', 'dwell1u', 'dwell2u', 'special1', 'special2'], branch: { 1: 'a', 2: 'a' }, forbid: ['hall4', 'altar', 'shipyard'], garrison: [{ unit: 'mocker', count: 60 }, { unit: 'elderwolf', count: 24 }, { unit: 'bereginya', count: 12 }] });
    const old = put('town', 92, 54, { owner: 1, faction: 'thicket', name: 'Старый бор', tag: 'bor', built: ['hall1', 'hall2', 'fort1', 'fort2', 'tavern', 'market', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'dwell6'], forbid: ['hall4', 'altar', 'shipyard', 'dwell7'], garrison: [{ unit: 'auka', count: 60 }, { unit: 'werewolf', count: 20 }] });
    const gate = MD.entry(town), og = MD.entry(old);
    road(2, [gate, [40, 58], [60, 45], [76, 56], og]);
    road(1, [gate, [40, 62], [60, 67], [76, 60], og]);
    mob('cityguard', 20, 'fierce', 60, 45);
    mob('cityguard', 20, 'fierce', 60, 67);
    put('witchring', 44, 30, { owner: 0 });
    put('witchring', 44, 84, { owner: 0 });
    put('sawmill', 8, 40);
    put('oremine', 8, 72);
    put('ambermine', 30, 30);
    mob('bears', 12, 'hostile', 32, 32);
    put('ambermine', 30, 84);
    mob('wolves', 30, 'hostile', 32, 82);
    put('goldmine', 44, 54);
    mob('mercenaries', 40, 'hostile', 44, 52);
    put('goldmine', 12, 16);
    mob('kikimora', 14, 'hostile', 14, 18);
    many('res-gold', [[30, 48], [36, 66], [14, 66], [46, 70], [28, 20], [52, 46], [8, 92], [46, 92]]);
    many('res-amber', [[26, 70], [40, 40], [14, 30]]);
    many('res-wood', [[12, 48], [34, 74]]);
    many('res-ore', [[16, 78], [44, 40]]);
    many('campfire', [[34, 56], [48, 60], [24, 36]]);
    put('dwell-sirin', 20, 90);
    mob('sirin', 6, 'fierce', 22, 88);
    put('dwell-leshy', 8, 100);
    mob('leshy', 3, 'fierce', 12, 98);
    put('artifact', 100, 100, { art: 'khanaxe' });
    mob('zmey', 1, 'fierce', 98, 98);
    sign(34, 52, 'Священная берёза. Руками не трогать. Топором тем более.');
    many('rock', [[20, 100], [70, 20], [80, 90], [40, 8]]);
    put('mountain', 104, 4);
    put('mountain', 4, 4);
    put('mountain', 80, 40);
    return doc('Живая ветвь', 'Пятая миссия кампании «Заповедь».', M, [human(town, 0), { who: 'ai', factions: ['thicket'], team: 1, town: old.id }], [
      { owner: 0, hid: 'vedana', c: gate[0], r: gate[1], l: 0, tag: 'vedana', army: [{ unit: 'mocker', count: 90 }, { unit: 'elderwolf', count: 50 }, { unit: 'keeper', count: 24 }, { unit: 'kikimora', count: 16 }, { unit: 'sirin', count: 8 }, { unit: 'leshy', count: 2 }] },
      { owner: 1, hid: 'borovoy', c: og[0], r: og[1], l: 0, tag: 'borovoy', xp: 15000, patrol: 1, army: [{ unit: 'leshy', count: 8 }, { unit: 'werewolf', count: 60 }, { unit: 'kikimora', count: 20 }, { unit: 'sirin', count: 8 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  return { zap1: axes1, zap2: leshy2, zap3: charter3, zap4: lake4, zap5: branch5 };
};
