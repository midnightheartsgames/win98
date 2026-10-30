(function (H) {
  'use strict';
  const MD = H.MapData;

  const blob = (cx, cy, rx, ry, wob) => (c, r) => ((c - cx) / rx) ** 2 + ((r - cy) / ry) ** 2 <= 1 + (wob || 0.18) * Math.sin(c * 1.7 + r * 0.9) * Math.cos(r * 1.3 - c * 0.4);
  const near = (pts, w) => (c, r) => {
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i], dx = x2 - x1, dy = y2 - y1, len = dx * dx + dy * dy;
      const t = H.clamp(((c - x1) * dx + (r - y1) * dy) / len, 0, 1), px = x1 + dx * t, py = y1 + dy * t;
      if ((c - px) ** 2 + (r - py) ** 2 <= w * w) return true;
    }
    return false;
  };

  const trial = () => {
    const M = MD.create(48, 48, ['meadow', 'rock']);
    MD.paint(M, 0, 'steppe', (c, r) => c + Math.sin(r * 0.3) * 2 >= 30);
    MD.paint(M, 0, 'saltflat', blob(40, 9, 6, 4));
    MD.paint(M, 0, 'forest', blob(9, 13, 6, 5));
    MD.paint(M, 0, 'forest', blob(19, 27, 4, 3));
    MD.paint(M, 0, 'forest', blob(14, 44, 3, 2));
    MD.paint(M, 0, 'swamp', blob(35, 34, 4, 3));
    MD.paint(M, 0, 'sand', near([[23, 0], [21, 10], [24, 20], [22, 30], [25, 38], [24, 47]], 2.4));
    MD.paint(M, 0, 'water', near([[23, 0], [21, 10], [24, 20], [22, 30], [25, 38], [24, 47]], 1.3));
    MD.paint(M, 0, 'rock', (c, r) => r === 22 && c <= 15 && c !== 7);
    MD.paint(M, 0, 'rock', (c, r) => r === 21 && c >= 12 && c <= 15);
    MD.road(M, 0, 1, [[5, 41], [8, 41], [12, 38], [21, 38], [27, 38], [30, 36], [38, 30], [42, 20], [40, 13]]);
    MD.road(M, 0, 1, [[42, 22], [45, 22]]);
    MD.road(M, 0, 2, [[8, 41], [8, 31], [7, 30], [7, 23], [7, 15], [14, 8], [26, 8], [32, 8]]);
    MD.paint(M, 1, 'cave', blob(24, 24, 18, 17, 0.25));
    MD.paint(M, 1, 'fungal', blob(30, 18, 6, 5));
    MD.paint(M, 1, 'fungal', blob(16, 30, 5, 4));

    const put = (t, c, r, extra) => MD.add(M, Object.assign({ t, c, r, owner: -1 }, extra || {}));
    const guard = (unit, count, mood, c, r, l) => put('monster', c, r, { unit, count, max: count * 3, mood, l: l || 0 });
    M.forbid = ['special1'];
    put('town', 3, 38, { owner: 0, faction: 'league', name: 'Мельничный Брод', built: ['hall1', 'fort1', 'tavern', 'dwell1', 'dwell2'] });
    put('town', 43, 19, { faction: 'barrows', name: 'Кара-Оба', built: ['hall1', 'fort1', 'tavern', 'market', 'dwell1', 'dwell2', 'dwell3'], garrison: [{ unit: 'shade', count: 24 }, { unit: 'horsebow', count: 8 }, { unit: 'stonewoman', count: 4 }] });
    put('sawmill', 2, 35);
    put('oremine', 10, 44);
    put('goldmine', 15, 32);
    guard('shade', 12, 'cautious', 16, 34);
    put('campfire', 9, 38);
    put('res-wood', 4, 43);
    put('res-gold', 13, 36);
    put('res-ore', 17, 40);
    guard('militia', 18, 'friendly', 20, 39);
    put('sulfurspring', 32, 40);
    guard('horsebow', 14, 'hostile', 33, 42);
    put('res-sulfur', 41, 30);
    put('res-salt', 36, 24);
    put('saltworks', 38, 11);
    guard('stonewoman', 9, 'fierce', 39, 13);
    guard('stonewoman', 6, 'hostile', 8, 21);
    put('chest', 5, 8, { offer: 1 });
    guard('eaglespirit', 4, 'hostile', 6, 9);
    put('res-moonsilver', 12, 4);
    put('ambermine', 26, 13);
    put('res-amber', 28, 20);
    put('res-gold', 44, 16);
    put('chest', 44, 44, { offer: 2 });
    guard('eaglespirit', 3, 'hostile', 43, 43);
    for (const [c, r] of [[2, 3], [15, 1], [44, 38], [28, 44], [27, 25]]) put('mountain', c, r);
    for (const [c, r] of [[3, 12], [5, 16], [12, 9], [15, 14], [16, 26], [19, 24], [8, 46], [17, 45], [33, 31], [37, 37]]) put('pine', c, r);
    for (const [c, r] of [[10, 30], [18, 18], [34, 16], [45, 26], [30, 46], [2, 46], [26, 33]]) put('tree', c, r);
    for (const [c, r] of [[36, 6], [43, 4], [31, 22], [40, 34], [19, 34]]) put('rock', c, r);
    for (const [art, c, r] of [['couriers', 12, 42], ['militiahelm', 3, 31], ['roadcloak', 10, 33], ['eldersword', 17, 30], ['luckbone', 20, 15], ['wormwood', 28, 30], ['scoutcloak', 36, 18], ['saltcharm', 31, 40], ['quiverbelt', 7, 10], ['khanaxe', 44, 42], ['ancestorhorn', 40, 14], ['bellcuirass', 34, 43]]) put('artifact', c, r, { art });
    put('artifact', 24, 26, { art: 'riverbanner', l: 1 });
    put('shrine1', 10, 26, { spell: 'spark' });
    put('shrine2', 30, 26, { spell: 'stoneskin' });
    put('shrine3', 42, 33, { spell: 'dawn' });
    for (const [spell, c, r] of [['splash', 14, 41], ['scare', 20, 33], ['fireball', 34, 20]]) put('scroll', c, r, { spell });
    put('moonrift', 22, 23, { l: 1 });
    guard('eaglespirit', 5, 'hostile', 23, 25, 1);
    put('res-moonsilver', 30, 30, { l: 1 });

    return {
      name: 'Пробная карта',
      map: M,
      setup: {
        seed: 98,
        players: [{ name: 'Лига', color: 0, faction: 'league', human: true }],
        heroes: [{ owner: 0, hid: 'renier', name: 'Ренье Даль', cls: 'captain', faction: 'league', c: 5, r: 40, army: [{ unit: 'militia', count: 40 }, { unit: 'crossbow', count: 12 }, { unit: 'ringer', count: 4 }] }]
      }
    };
  };

  const TOWN_NAMES = { league: ['Мельничный Брод', 'Новый Причал', 'Заречье', 'Плотинный Двор'], barrows: ['Кара-Оба', 'Ак-Сай', 'Тас-Мола', 'Жел-Кудук'] };
  const START_BUILT = ['hall1', 'fort1', 'tavern', 'dwell1', 'dwell2'];
  const GARRISON = {
    league: [{ unit: 'militia', count: 30 }, { unit: 'crossbow', count: 12 }, { unit: 'ringer', count: 6 }],
    barrows: [{ unit: 'shade', count: 30 }, { unit: 'horsebow', count: 12 }, { unit: 'stonewoman', count: 6 }]
  };

  const painter = (M, flip) => {
    const place = (t, c, r, extra) => {
      const foot = H.OBJ[t].foot, [nc, nr] = flip(c, r, foot);
      return MD.add(M, Object.assign({ t, c: nc, r: nr, owner: -1 }, extra || {}));
    };
    const guarded = (t, c, r, unit, count, mood, extra) => {
      const o = place(t, c, r, extra), e = MD.entry(o);
      MD.add(M, { t: 'monster', c: e[0] + 1, r: e[1] + 1, owner: -1, unit, count, max: count * 3, mood });
      return o;
    };
    const mob = (unit, count, mood, c, r) => place('monster', c, r, { unit, count, max: count * 3, mood });
    return { place, guarded, mob };
  };

  const fordMap = () => {
    const W = 48, M = MD.create(W, W, ['meadow']), rot = c => W - 1 - c;
    const fold = (c, r) => (c <= r ? [c, r] : [rot(c), rot(r)]);
    const line = [[0, 2], [10, 9], [18, 14], [23.5, 23.5], [29, 33], [37, 38], [47, 45]];
    MD.paint(M, 0, 'steppe', (c, r) => c - r + Math.sin((c + r) * 0.25) * 1.5 > 0);
    MD.paint(M, 0, 'forest', (c, r) => { const [x, y] = fold(c, r); return blob(14, 28, 4, 3)(x, y) || blob(26, 42, 3, 3)(x, y); });
    MD.paint(M, 0, 'swamp', (c, r) => { const [x, y] = fold(c, r); return blob(4, 20, 3, 2)(x, y); });
    MD.paint(M, 0, 'sand', near(line, 2.6));
    MD.paint(M, 0, 'water', near(line, 1.3));
    MD.paint(M, 0, 'rock', (c, r) => { const [x, y] = fold(c, r); return (y === 31 && x <= 9 && x !== 5) || (x === 21 && y >= 35 && y !== 41); });
    const both = pts => {
      MD.road(M, 0, 1, pts);
      MD.road(M, 0, 1, pts.map(([c, r]) => [rot(c), rot(r)]));
    };
    both([[7, 41], [14, 41], [21, 41], [24, 36], [20, 30], [20, 27], [24, 24]]);
    both([[5, 37], [5, 31], [5, 22], [8, 12], [10, 6]]);
    const flips = [c => c, (c, r, f) => [rot(c) - f[0] + 1, rot(r) - f[1] + 1]];
    const starts = [];
    flips.forEach((flip, side) => {
      const { place, guarded, mob } = painter(M, side ? flip : (c, r) => [c, r]);
      const town = place('town', 5, 38);
      starts.push({ town, gate: MD.entry(town) });
      place('sawmill', 1, 33);
      place('oremine', 12, 44);
      guarded('goldmine', 15, 36, 'militia', 16, 'cautious');
      place('res-wood', 3, 44);
      place('res-ore', 9, 44);
      place('res-gold', 15, 43);
      place('campfire', 11, 35);
      place('artifact', 2, 42, { art: side ? 'saltcharm' : 'couriers' });
      place('shrine1', 8, 33, { spell: side ? 'chill' : 'balm' });
      guarded('saltworks', 2, 24, 'shade', 22, 'hostile');
      guarded('sulfurspring', 13, 24, 'horsebow', 10, 'hostile');
      place('res-salt', 7, 26);
      place('res-sulfur', 17, 31);
      place('res-gold', 9, 20);
      place('scroll', 11, 29);
      mob('stonewoman', 7, 'hostile', 5, 31);
      mob('crossbow', 18, 'hostile', 21, 41);
      place('artifact', 18, 45, { art: side ? 'khanaxe' : 'bellcuirass' });
      mob('plated', 5, 'hostile', 18, 43);
      place('chest', 2, 15, { offer: 1 });
      mob('eaglespirit', 3, 'hostile', 3, 16);
      place('shrine2', 15, 18, { spell: side ? 'hex' : 'stoneskin' });
      mob('wolves', 18, 'hostile', 15, 21);
      place('res-moonsilver', 9, 14);
      mob('saltnoyon', 3, 'fierce', 10, 15);
      place('artifact', 17, 24, { art: side ? 'quiverbelt' : 'saltstaff' });
      mob('stonewoman', 12, 'fierce', 18, 25);
      guarded('ambermine', 17, 28, 'wolves', 40, 'fierce');
      mob('horsebow', 16, 'hostile', 10, 11);
      place('artifact', 21, 24, { art: side ? 'ancestorhorn' : 'riverbanner' });
      mob('bonebull', 2, 'fierce', 22, 25);
      for (const [c, r] of [[0, 28], [6, 15], [12, 47], [24, 45]]) place('pine', c, r);
      for (const [c, r] of [[10, 47], [17, 34], [3, 36], [12, 31]]) place('tree', c, r);
      for (const [c, r] of [[19, 22], [6, 29], [20, 33]]) place('rock', c, r);
      place('mountain', 28, 43);
    });
    return { M, starts };
  };

  const meshaMap = () => {
    const W = 80, M = MD.create(W, W, ['meadow']), mir = v => W - 1 - v;
    const test = f => (c, r) => f(Math.min(c, mir(c)), Math.min(r, mir(r)));
    MD.paint(M, 0, 'steppe', (c, r) => c + Math.sin(r * 0.21) * 2 >= 40);
    MD.paint(M, 0, 'forest', test((x, y) => blob(21, 7, 5, 3)(x, y) || blob(6, 19, 3, 4)(x, y) || blob(30, 24, 3, 3)(x, y)));
    MD.paint(M, 0, 'swamp', test(blob(13, 31, 4, 3)));
    MD.paint(M, 0, 'saltflat', blob(40, 40, 13, 13, 0.08));
    MD.paint(M, 0, 'water', test(blob(28, 3, 4, 2)));
    MD.paint(M, 0, 'rock', test((x, y) => (x === 39 && y <= 30) || (y === 39 && x <= 30)));
    MD.paint(M, 0, 'rock', test((x, y) => x + y === 41 && x >= 2 && x <= 39 && !(x >= 14 && x <= 15) && !(x >= 20 && x <= 21) && !(x >= 27 && x <= 28)));
    MD.paint(M, 0, 'rock', test((x, y) => x + y === 57 && x >= 18 && x <= 39 && !(x >= 35 && x <= 36) && !(x >= 21 && x <= 22)));
    const all = pts => {
      for (const flip of [p => p, ([c, r]) => [mir(c), r], ([c, r]) => [c, mir(r)], ([c, r]) => [mir(c), mir(r)]]) MD.road(M, 0, 1, pts.map(flip));
    };
    all([[8, 9], [14, 14], [20, 20], [22, 22], [35, 22], [37, 25], [37, 33], [39, 36]]);
    all([[14, 14], [14, 27], [14, 33], [21, 36], [25, 37], [33, 37], [36, 38]]);
    all([[14, 14], [27, 14], [33, 14], [34, 17]]);
    const flips = [
      (c, r) => [c, r],
      (c, r, f) => [mir(c) - f[0] + 1, r],
      (c, r, f) => [c, mir(r) - f[1] + 1],
      (c, r, f) => [mir(c) - f[0] + 1, mir(r) - f[1] + 1]
    ];
    const starts = [];
    flips.forEach((flip, side) => {
      const { place, guarded, mob } = painter(M, flip), east = side % 2 === 1;
      const town = place('town', 6, 6);
      starts.push({ town, gate: MD.entry(town) });
      place('sawmill', 16, 3);
      place('oremine', 2, 15);
      guarded('goldmine', 22, 10, east ? 'shade' : 'militia', 18, 'cautious');
      place('res-wood', 3, 12);
      place('res-ore', 13, 4);
      place('res-gold', 12, 12);
      place('campfire', 18, 18);
      place('artifact', 3, 3, { art: east ? 'steppebeads' : 'militiahelm' });
      place('shrine1', 12, 18, { spell: east ? 'chill' : 'balm' });
      place('scroll', 24, 14);
      guarded('saltworks', 28, 6, 'stonewoman', 7, 'hostile');
      guarded('sulfurspring', 6, 28, east ? 'horsebow' : 'crossbow', 14, 'hostile');
      place('res-salt', 26, 5);
      place('res-sulfur', 4, 24);
      place('artifact', 26, 9, { art: east ? 'roadcloak' : 'scoutcloak' });
      place('artifact', 9, 24, { art: east ? 'guildshield' : 'quilted' });
      mob('wolves', 16, 'hostile', 9, 26);
      mob('saltnoyon', 3, 'fierce', 21, 21);
      mob('wolves', 26, 'hostile', 15, 27);
      mob('stonewoman', 9, 'hostile', 28, 14);
      guarded('sawmill', 33, 16, 'wolves', 22, 'hostile');
      guarded('ambermine', 14, 34, 'eaglespirit', 5, 'hostile');
      place('res-gold', 34, 12);
      place('res-gold', 12, 35);
      place('chest', 24, 28, { offer: 1 });
      mob('eaglespirit', 4, 'hostile', 23, 27);
      place('shrine2', 30, 18, { spell: east ? 'hex' : 'stoneskin' });
      mob('plated', 4, 'hostile', 29, 21);
      mob('horseguard', 3, 'fierce', 36, 22);
      mob('aeronaut', 5, 'fierce', 22, 36);
      place('artifact', 36, 29, { art: east ? 'khanaxe' : 'bellcuirass' });
      mob('saltnoyon', 5, 'fierce', 35, 31);
      place('res-amber', 29, 33);
      place('res-moonsilver', 33, 34);
      for (const [c, r] of [[2, 9], [12, 1], [1, 24], [16, 31], [32, 3]]) place('pine', c, r);
      for (const [c, r] of [[10, 20], [28, 12], [20, 33], [4, 33]]) place('tree', c, r);
      for (const [c, r] of [[18, 6], [8, 16], [37, 8], [25, 22]]) place('rock', c, r);
      place('mountain', 1, 1);
    });
    MD.add(M, { t: 'town', c: 37, r: 37, owner: -1, faction: 'league', name: 'Соляной Торг', built: ['hall1', 'fort1', 'tavern', 'market', 'dwell1', 'dwell2', 'dwell3', 'dwell4'], garrison: [{ unit: 'plated', count: 10 }, { unit: 'ringer', count: 16 }, { unit: 'crossbow', count: 30 }, { unit: 'militia', count: 60 }] });
    MD.add(M, { t: 'moonrift', c: 33, r: 42, owner: -1 });
    MD.add(M, { t: 'monster', c: 35, r: 44, owner: -1, unit: 'bonebull', count: 4, max: 12, mood: 'fierce' });
    MD.add(M, { t: 'goldmine', c: 44, r: 42, owner: -1 });
    MD.add(M, { t: 'monster', c: 46, r: 44, owner: -1, unit: 'horseguard', count: 7, max: 21, mood: 'fierce' });
    MD.add(M, { t: 'artifact', c: 40, r: 33, owner: -1, art: 'riverbanner' });
    MD.add(M, { t: 'monster', c: 40, r: 34, owner: -1, unit: 'stonekhan', count: 2, max: 6, mood: 'fierce' });
    return { M, starts };
  };

  const LIST = [
    { id: 'ford', name: 'Брод у мельницы', size: 'малая', w: 48, players: 2, about: 'Река режет край наискось: мельники на юго-западе, степняки на северо-востоке. Три брода, и каждый кто-то держит. Первая карта для новичка.', make: fordMap },
    { id: 'mesha', name: 'Соляная межа', size: 'средняя', w: 80, players: 4, about: 'Четыре края у соляного озера. Горные гряды с заставами делят соседей, а в середине стоит Соляной Торг и лежит самое ценное.', make: meshaMap }
  ];

  const pickHero = (faction, roll) => {
    const pool = H.HEROES.filter(x => H.CLASSES[x.cls].faction === faction);
    return pool[Math.floor(roll() * pool.length)];
  };

  const build = (id, o) => {
    const rec = LIST.find(m => m.id === id), { M, starts } = rec.make(), roll = H.rng(o.seed), players = [], heroes = [], taken = new Set();
    starts.forEach((st, i) => {
      const slot = o.slots[i], town = st.town;
      town.built = START_BUILT.slice();
      if (!slot) {
        const faction = i % 2 ? 'barrows' : 'league';
        town.faction = faction;
        town.name = TOWN_NAMES[faction][i % 4];
        town.garrison = GARRISON[faction];
        return;
      }
      const pid = players.length, faction = slot.faction;
      town.owner = pid;
      town.faction = faction;
      town.name = TOWN_NAMES[faction][i % 4];
      players.push({ name: 'Игрок ' + (i + 1), color: i, faction, human: !!slot.human });
      let hero = slot.hid ? H.HEROES.find(x => x.id === slot.hid) : pickHero(faction, roll);
      while (taken.has(hero.id)) hero = pickHero(faction, roll);
      taken.add(hero.id);
      const army = hero.army.map(([unit, lo, hi]) => ({ unit, count: lo + Math.floor(roll() * (hi - lo + 1)) }));
      heroes.push({ owner: pid, hid: hero.id, name: hero.name, cls: hero.cls, faction, c: st.gate[0], r: st.gate[1], army });
    });
    return { name: rec.name, map: M, setup: { seed: o.seed, name: rec.name, difficulty: o.difficulty || 'normal', players, heroes } };
  };

  H.Maps = { trial, blob, near, LIST, build };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
