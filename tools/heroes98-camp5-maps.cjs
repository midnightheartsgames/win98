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
      const [ec, er] = MD.entry(o), at = [[ec + 1, er + 1], [ec - 1, er + 1], [ec + 1, er], [ec - 1, er]].find(([x, y]) => MD.inside(M, x, y) && !taken(x, y)) || [ec + 1, er + 1];
      mob(unit, count, mood, at[0], at[1], tag);
      return o;
    };
    return { put, mob, sign, many, guard };
  };
  const doc = (name, about, M, players, heroes, goals) => ({ name, about, map: M, players, goals, heroes, events: [], scenes: '' });
  const human = (town, team) => ({ who: 'human', factions: ['forge'], team: team == null ? 0 : team, town: town ? town.id : null });
  const lose = [{ kind: 'all' }, { kind: 'hero', hid: 'irga' }];
  const win = [{ kind: 'flag', flag: 'n_never', text: 'Выполнить задания миссии' }];
  const NO_GROWTH = ['tavern', 'dwell1', 'dwell1u', 'dwell2', 'dwell2u', 'dwell3', 'dwell3u', 'dwell4', 'dwell4u', 'dwell5', 'dwell5u', 'dwell6', 'dwell6u', 'dwell7', 'dwell7u', 'altar', 'shipyard', 'hall3', 'hall4', 'guild1', 'market', 'caravan'];
  const HOME = ['hall4', 'dwell6', 'dwell6u', 'dwell7', 'dwell7u', 'altar', 'shipyard'];

  const slag1 = () => {
    const M = MD.create(48, 48, ['ash']), { put, mob, sign, many, guard } = kit(M);
    MD.paint(M, 0, 'lava', near([[23, 0], [21, 16], [26, 30], [23, 47]], 1.3));
    MD.paint(M, 0, 'highland', blob(8, 8, 6, 5));
    MD.paint(M, 0, 'highland', blob(40, 12, 6, 6));
    MD.paint(M, 0, 'rock', blob(14, 30, 2, 3));
    MD.paint(M, 0, 'rock', blob(34, 20, 2, 2));

    guard(put('dwell-apprentice', 9, 9, { tag: 'g1' }), 'hammerer', 8, 'hostile');
    guard(put('dwell-salamander', 8, 38, { tag: 'g2' }), 'apprentice', 20, 'hostile');
    guard(put('dwell-obsidianspider', 32, 6, { tag: 'g3' }), 'hammerer', 12, 'hostile');
    const lit = put('town', 36, 30, { faction: 'forge', name: 'Чёрная Литейная', tag: 'lit', built: ['hall1', 'fort1', 'tavern', 'dwell1', 'smith'], garrison: [{ unit: 'apprentice', count: 30 }, { unit: 'salamander', count: 8 }, { unit: 'caster', count: 2 }] });
    guard(put('oremine', 14, 20), 'salamander', 6, 'hostile');
    guard(put('sulfurspring', 40, 42), 'caster', 4, 'hostile');
    put('sawmill', 4, 28);
    many('res-ore', [[12, 14], [30, 12], [44, 24]]);
    many('res-sulfur', [[6, 42], [28, 40]]);
    many('res-gold', [[16, 26], [30, 24], [42, 8], [12, 44]]);
    many('campfire', [[18, 8], [30, 44]]);
    guard(put('chest', 44, 4, { offer: 2 }), 'hammerer', 14, 'hostile');
    sign(12, 24, 'Молотовой цех. Не стучать после заката, совет спит.');
    sign(30, 28, 'Чёрная Литейная. Горн не гасить. Вход по клейму.');
    many('rock', [[4, 4], [44, 46], [28, 2], [6, 46]]);
    return doc('Окалина', 'Первая миссия кампании «Жар».', M, [human(null)], [{ owner: 0, hid: 'irga', c: 6, r: 24, l: 0, tag: 'irga', army: [{ unit: 'apprentice', count: 20 }, { unit: 'salamander', count: 4 }] }], { win, lose: lose.slice() });
  };

  const court2 = () => {
    const M = MD.create(80, 80, ['ash']), { put, mob, sign, many, guard } = kit(M);
    MD.paint(M, 0, 'lava', near([[40, 0], [36, 24], [44, 50], [40, 79]], 1.4));
    MD.paint(M, 0, 'highland', blob(20, 14, 10, 7));
    MD.paint(M, 0, 'highland', blob(60, 66, 10, 7));
    MD.paint(M, 0, 'rock', blob(56, 20, 4, 3));
    MD.paint(M, 0, 'rock', blob(22, 62, 4, 3));
    MD.road(M, 0, 1, [[14, 42], [36, 40], [66, 40]]);

    const town = put('town', 10, 38, { owner: 0, faction: 'forge', name: 'Чёрная Литейная', tag: 'home', built: ['hall1', 'hall2', 'fort1', 'tavern', 'market', 'smith', 'special1', 'dwell1', 'dwell2', 'dwell3', 'guild1'], forbid: HOME });
    const dvor = put('town', 64, 38, { owner: 1, faction: 'forge', name: 'Цеховой Двор', tag: 'dvor', built: ['hall1', 'hall2', 'fort1', 'fort2', 'special2'], forbid: NO_GROWTH, garrison: [{ unit: 'apprentice', count: 24 }, { unit: 'salamander', count: 6 }, { unit: 'obsidianspider', count: 4 }, { unit: 'caster', count: 2 }] });
    put('artifact', 24, 30, { art: 'militiahelm' });
    put('artifact', 26, 54, { art: 'crestcap' });
    guard(put('artifact', 50, 14, { art: 'watchhood' }), 'hammerer', 20, 'hostile');
    guard(put('oremine', 16, 24), 'salamander', 10, 'hostile');
    guard(put('sulfurspring', 18, 58), 'obsidianspider', 6, 'hostile');
    put('sawmill', 4, 50);
    guard(put('goldmine', 52, 60), 'caster', 6, 'hostile');
    guard(put('dwell-caster', 30, 66), 'hammerer', 16, 'hostile');
    many('res-ore', [[20, 40], [30, 20], [48, 28], [56, 52]]);
    many('res-sulfur', [[14, 60], [46, 66], [60, 14]]);
    many('res-gold', [[22, 46], [34, 34], [52, 46], [28, 10], [70, 70]]);
    many('campfire', [[30, 44], [56, 30]]);
    guard(put('chest', 74, 6, { offer: 2 }), 'caster', 8, 'hostile');
    sign(28, 42, 'Цеховой Двор. Суд совета. Решения окончательны, жалобы принимаются в письменном виде и сжигаются.');
    many('rock', [[4, 4], [76, 76], [4, 76], [76, 4]]);
    const gate = MD.entry(town), dg = MD.entry(dvor);
    return doc('Цеховой суд', 'Вторая миссия кампании «Жар».', M, [human(town, 0), { who: 'ai', factions: ['forge'], team: 1, town: dvor.id }], [
      { owner: 0, hid: 'irga', c: gate[0], r: gate[1], l: 0, tag: 'irga', army: [{ unit: 'apprentice', count: 40 }, { unit: 'salamander', count: 10 }, { unit: 'obsidianspider', count: 6 }] },
      { owner: 1, hid: 'kerm', c: dg[0], r: dg[1], l: 0, tag: 'kerm', patrol: 1, army: [{ unit: 'caster', count: 2 }, { unit: 'hammerer', count: 10 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  const ROUTE3 = [[40, 42], [50, 40], [58, 38], [70, 40], [78, 40]];
  const pass3 = () => {
    const M = MD.create(80, 80, ['highland']), { put, mob, sign, many, guard } = kit(M);
    MD.paint(M, 0, 'rock', (c, r) => (r < 30 || r > 50) && Math.abs(r - 40) > 10 + Math.sin(c * 0.3) * 3 && !(c < 14));
    MD.paint(M, 0, 'ash', blob(8, 66, 8, 10));
    MD.paint(M, 0, 'ash', blob(8, 14, 8, 10));
    MD.paint(M, 0, 'lava', near([[10, 52], [20, 48], [26, 44]], 1.2));
    MD.paint(M, 0, 'lava', near([[36, 60], [40, 50], [42, 46]], 1.2));
    MD.paint(M, 0, 'lava', blob(52, 28, 3, 2));
    MD.road(M, 0, 1, ROUTE3);
    mob('whitespirit', 16, 'fierce', 40, 42, 'convoy');
    const convoy = M.objs.find(o => o.tag === 'convoy');
    convoy.route = ROUTE3.map(p => p.slice());
    convoy.pace = 5;
    guard(put('dwell-steamling', 6, 8), 'salamander', 14, 'hostile');
    guard(put('sulfurspring', 4, 20), 'obsidianspider', 8, 'hostile');
    put('oremine', 12, 74);
    guard(put('artifact', 30, 32, { art: 'tinring' }), 'caster', 6, 'hostile');
    guard(put('dwell-caster', 46, 34), 'hammerer', 20, 'hostile');
    mob('mercenaries', 30, 'fierce', 40, 46);
    mob('whitespirit', 10, 'fierce', 60, 44);
    many('res-gold', [[10, 60], [20, 56], [34, 42], [50, 40], [66, 36], [6, 30]]);
    many('res-sulfur', [[14, 70], [26, 40], [54, 42]]);
    many('res-ore', [[4, 60], [48, 46]]);
    many('campfire', [[22, 42], [62, 42]]);
    sign(18, 44, 'Серный перевал. Обозам держаться дороги, дорога держится сама.');
    return doc('Серный перевал', 'Третья миссия кампании «Жар».', M, [human(null)], [{ owner: 0, hid: 'irga', c: 4, r: 74, l: 0, tag: 'irga', army: [{ unit: 'apprentice', count: 50 }, { unit: 'hammerer', count: 20 }, { unit: 'salamander', count: 16 }, { unit: 'obsidianspider', count: 10 }, { unit: 'caster', count: 6 }] }], { win, lose: lose.slice() });
  };

  const oath4 = () => {
    const M = MD.create(80, 80, ['ash']), { put, mob, sign, many, guard } = kit(M);
    MD.paint(M, 0, 'lava', near([[0, 20], [30, 26], [50, 18], [79, 24]], 1.2));
    MD.paint(M, 0, 'lava', near([[0, 60], [30, 54], [50, 62], [79, 56]], 1.2));
    MD.paint(M, 0, 'highland', blob(40, 40, 10, 8));
    MD.paint(M, 0, 'rock', blob(40, 40, 3, 2));

    const town = put('town', 10, 38, { owner: 0, faction: 'forge', name: 'Чёрная Литейная', tag: 'home', built: ['hall1', 'hall2', 'fort1', 'fort2', 'tavern', 'market', 'smith', 'special1', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'guild1'], forbid: HOME, garrison: [{ unit: 'apprentice', count: 40 }, { unit: 'salamander', count: 10 }, { unit: 'caster', count: 4 }] });
    const old = put('town', 70, 38, { owner: 1, faction: 'forge', name: 'Старый Двор', tag: 'old', built: ['hall1', 'fort1'], forbid: NO_GROWTH, garrison: [{ unit: 'apprentice', count: 40 }, { unit: 'caster', count: 6 }] });
    put('petitioner', 20, 8, { tag: 'q1', quest: { kind: 'army', unit: 'caster', count: 8 }, reward: { gold: 1000 } });
    put('petitioner', 20, 70, { tag: 'q2', quest: { kind: 'rank', rank: 'rare', slot: 'head' }, reward: { gold: 1500 } });
    put('petitioner', 56, 8, { tag: 'q3', quest: { kind: 'res', res: { sulfur: 4 } }, reward: { gold: 1000 } });
    const glass = mob('blackspider', 14, 'fierce', 58, 66, 'glass');
    put('petitioner', 56, 70, { tag: 'q4', quest: { kind: 'kill', obj: glass.id }, reward: { gold: 1500 } });
    put('artifact', 26, 36, { art: 'militiahelm' });
    put('artifact', 28, 46, { art: 'crestcap' });
    guard(put('artifact', 44, 44, { art: 'owlmask' }), 'obsidianspider', 16, 'fierce');
    guard(put('sulfurspring', 34, 10), 'salamander', 14, 'hostile');
    guard(put('sulfurspring', 46, 70), 'obsidianspider', 10, 'hostile');
    guard(put('oremine', 16, 50), 'hammerer', 14, 'hostile');
    put('sawmill', 4, 52);
    guard(put('goldmine', 52, 34), 'caster', 8, 'hostile');
    many('res-sulfur', [[24, 14], [30, 66], [62, 14], [62, 60]]);
    many('res-ore', [[14, 30], [26, 52], [50, 46]]);
    many('res-gold', [[22, 40], [34, 30], [46, 50], [12, 64], [66, 26]]);
    many('campfire', [[30, 40], [54, 40]]);
    guard(put('chest', 76, 4, { offer: 2 }), 'caster', 10, 'hostile');
    sign(18, 12, 'Цех литейщиков. Испытание: приведи тех, кто держит ковш.');
    sign(18, 66, 'Цех кузнецов. Испытание: принеси шлем лучше нашего.');
    sign(54, 12, 'Цех серников. Испытание: принеси то, что мы и так продаём.');
    sign(54, 64, 'Цех стеклодувов. Испытание: прогони чёрных пауков от нашей пещеры.');
    many('rock', [[4, 4], [76, 76], [4, 76], [36, 4], [36, 76]]);
    const gate = MD.entry(town), og = MD.entry(old);
    return doc('Литая клятва', 'Четвёртая миссия кампании «Жар».', M, [human(town, 0), { who: 'ai', factions: ['forge'], team: 1, town: old.id }], [
      { owner: 0, hid: 'irga', c: gate[0], r: gate[1], l: 0, tag: 'irga', army: [{ unit: 'apprentice', count: 60 }, { unit: 'hammerer', count: 20 }, { unit: 'salamander', count: 20 }, { unit: 'obsidianspider', count: 12 }, { unit: 'caster', count: 6 }] },
      { owner: 1, hid: 'tamma', c: og[0], r: og[1], l: 0, tag: 'tamma', patrol: 1, army: [{ unit: 'apprentice', count: 30 }, { unit: 'salamander', count: 10 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  const erupt5 = () => {
    const M = MD.create(112, 112, ['ash']), { put, mob, sign, many, guard } = kit(M);
    MD.paint(M, 0, 'highland', blob(56, 10, 20, 8));
    MD.paint(M, 0, 'lava', blob(56, 8, 4, 3));
    MD.paint(M, 0, 'highland', blob(20, 90, 10, 8));
    MD.paint(M, 0, 'rock', blob(76, 56, 3, 6));
    MD.paint(M, 0, 'lava', near([[100, 0], [96, 20]], 1.2));
    MD.road(M, 0, 1, [[16, 56], [50, 56], [90, 56]]);
    MD.road(M, 0, 1, [[50, 56], [90, 86]]);

    const town = put('town', 10, 52, { owner: 0, faction: 'forge', name: 'Чёрная Литейная', tag: 'home', built: ['hall1', 'hall2', 'hall3', 'fort1', 'fort2', 'tavern', 'market', 'smith', 'store', 'special1', 'special3', 'dwell1', 'dwell2', 'dwell3', 'dwell4', 'dwell5', 'dwell6', 'guild1', 'guild2'], forbid: ['altar'] });
    const dvor = put('town', 92, 50, { owner: 1, faction: 'forge', name: 'Цеховой Двор', tag: 'dvor', built: ['hall1', 'hall2', 'fort1', 'fort2', 'special2'], forbid: NO_GROWTH, garrison: [{ unit: 'apprentice', count: 24 }, { unit: 'caster', count: 6 }] });
    const camp = put('town', 92, 88, { owner: 2, faction: 'league', name: 'Белый лагерь', tag: 'camp', built: ['hall1', 'fort1'], forbid: NO_GROWTH, garrison: [{ unit: 'crossbow', count: 12 }, { unit: 'mercenaries', count: 12 }] });
    guard(put('sulfurspring', 30, 20), 'salamander', 20, 'hostile');
    guard(put('sulfurspring', 30, 92), 'obsidianspider', 14, 'hostile');
    guard(put('oremine', 20, 70), 'hammerer', 20, 'hostile');
    put('sawmill', 4, 66);
    guard(put('goldmine', 60, 70), 'caster', 10, 'hostile');
    guard(put('goldmine', 60, 34), 'caster', 10, 'hostile');
    guard(put('dwell-volcano', 54, 14), 'slaggiant', 3, 'hostile');
    guard(put('dwell-steamling', 40, 80), 'salamander', 24, 'hostile');
    guard(put('artifact', 74, 20, { art: 'hawkcloak' }), 'whitespirit', 14, 'fierce');
    many('res-ore', [[22, 50], [36, 60], [50, 40], [70, 62], [44, 96]]);
    many('res-sulfur', [[26, 30], [40, 70], [64, 24], [80, 70]]);
    many('res-gold', [[24, 60], [40, 50], [56, 62], [66, 46], [36, 30], [36, 84], [80, 30]]);
    many('campfire', [[30, 56], [70, 56], [56, 80]]);
    sign(28, 54, 'Старый Горн. Не будить. Уже поздно.');
    sign(84, 80, 'Лагерь Ордена. Вход только в белом.');
    many('rock', [[4, 4], [108, 108], [4, 108], [108, 4]]);
    const gate = MD.entry(town), dg = MD.entry(dvor), cg = MD.entry(camp);
    return doc('Извержение', 'Пятая миссия кампании «Жар».', M, [human(town, 0), { who: 'ai', factions: ['forge'], team: 1, town: dvor.id }, { who: 'ai', factions: ['league'], team: 1, town: camp.id }], [
      { owner: 0, hid: 'irga', c: gate[0], r: gate[1], l: 0, tag: 'irga', army: [{ unit: 'apprentice', count: 80 }, { unit: 'hammerer', count: 30 }, { unit: 'salamander', count: 30 }, { unit: 'obsidianspider', count: 18 }, { unit: 'caster', count: 12 }, { unit: 'steamling', count: 6 }, { unit: 'slaggiant', count: 2 }] },
      { owner: 1, hid: 'garm', c: dg[0], r: dg[1], l: 0, tag: 'garm', xp: 20000, patrol: 1, army: [{ unit: 'slaggiant', count: 1 }, { unit: 'caster', count: 8 }, { unit: 'apprentice', count: 30 }, { unit: 'salamander', count: 10 }] },
      { owner: 2, hid: 'ortwin', c: cg[0], r: cg[1], l: 0, tag: 'order', xp: 15000, patrol: 1, army: [{ unit: 'crossbow', count: 20 }, { unit: 'plated', count: 4 }, { unit: 'mercenaries', count: 20 }, { unit: 'whitespirit', count: 4 }] }
    ], { win, lose: lose.concat([{ kind: 'town', town: town.id }]) });
  };

  return { zhar1: slag1, zhar2: court2, zhar3: pass3, zhar4: oath4, zhar5: erupt5 };
};
