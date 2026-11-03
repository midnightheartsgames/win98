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
        name: 'Пробная карта',
        players: [{ name: 'Лига', color: 0, faction: 'league', human: true }],
        heroes: [{ owner: 0, hid: 'renier', name: 'Ренье Даль', cls: 'captain', faction: 'league', c: 5, r: 40, army: [{ unit: 'militia', count: 40 }, { unit: 'crossbow', count: 12 }, { unit: 'ringer', count: 4 }] }]
      }
    };
  };

  const TOWN_NAMES = { league: ['Мельничный Брод', 'Новый Причал', 'Заречье', 'Плотинный Двор'], barrows: ['Кара-Оба', 'Ак-Сай', 'Тас-Мола', 'Жел-Кудук'], thicket: ['Заповедный Двор', 'Берёзовый Кут', 'Омутня', 'Моховая Заимка'], tide: ['Раковинная Лагуна', 'Жемчужная Отмель', 'Дом на Сваях', 'Коралловый Причал'], forge: ['Цеховой Двор', 'Чёрная Литейная', 'Пепельный Склон', 'Серная Падь'], throne: ['Белый Двор', 'Лунная Арка', 'Мраморный Утёс', 'Серебряный Порог'] };
  const START_BUILT = ['hall1', 'fort1', 'tavern', 'dwell1', 'dwell2'];
  const GARRISON = {
    league: [{ unit: 'militia', count: 30 }, { unit: 'crossbow', count: 12 }, { unit: 'ringer', count: 6 }],
    barrows: [{ unit: 'shade', count: 30 }, { unit: 'horsebow', count: 12 }, { unit: 'stonewoman', count: 6 }],
    thicket: [{ unit: 'auka', count: 30 }, { unit: 'werewolf', count: 12 }, { unit: 'bereginya', count: 6 }],
    tide: [{ unit: 'shellman', count: 30 }, { unit: 'harpooner', count: 12 }, { unit: 'jelly', count: 6 }],
    forge: [{ unit: 'apprentice', count: 30 }, { unit: 'salamander', count: 12 }, { unit: 'obsidianspider', count: 6 }],
    throne: [{ unit: 'legionary', count: 24 }, { unit: 'moonarcher', count: 8 }, { unit: 'mirrorguard', count: 4 }]
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
    const flips = [(c, r) => [c, r], (c, r, f) => [rot(c) - f[0] + 1, rot(r) - f[1] + 1]];
    const starts = [];
    flips.forEach((flip, side) => {
      const { place, guarded, mob } = painter(M, flip);
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

  const HARBOR_NAMES = ['Белый Мыс', 'Соляная Гавань', 'Чёрный Причал', 'Тихая Бухта'];
  const FIELD_SPOTS = [['moonglade', 22, 6], ['moonless', 6, 34], ['holyground', 32, 8], ['foglow', 8, 22], ['saltcrust', 26, 22]];

  const chashaMap = () => {
    const W = 112, M = MD.create(W, W, ['meadow', 'rock']), mir = v => W - 1 - v, mid = 55.5;
    const all = f => (c, r) => f(Math.min(c, mir(c)), Math.min(r, mir(r)));
    const reach = (c, r) => Math.hypot(c - mid, r - mid);
    MD.paint(M, 0, 'steppe', (c, r) => c + Math.sin(r * 0.21) * 2 >= 56);
    MD.paint(M, 0, 'forest', all((x, y) => blob(24, 4, 5, 3)(x, y) || blob(4, 22, 3, 5)(x, y) || blob(40, 8, 4, 3)(x, y)));
    MD.paint(M, 0, 'swamp', all(blob(10, 30, 4, 3)));
    MD.paint(M, 0, 'sand', (c, r) => { const d = reach(c, r); return d > 24 && d <= 27; });
    MD.paint(M, 0, 'water', (c, r) => { const d = reach(c, r); return d <= 24 && d > 7; });
    MD.paint(M, 0, 'sand', all((x, y) => Math.hypot(x - 41, y - 41) <= 4));
    MD.paint(M, 0, 'water', all((x, y) => Math.hypot(x - 41, y - 41) > 4.6 && Math.hypot(x - 41, y - 41) <= 6.5 && reach(x, y) <= 26));
    MD.paint(M, 0, 'water', all(blob(14, 44, 7, 5, 0.05)));
    MD.paint(M, 0, 'rock', all((x, y) => (x === 55 && y <= 31 && y !== 18 && y !== 19) || (y === 55 && x <= 31 && x !== 18 && x !== 19)));
    MD.paint(M, 0, 'ash', (c, r) => c <= 8 && r >= W - 9);
    MD.paint(M, 0, 'lava', (c, r) => c <= 3 && r >= W - 4);
    const ring = (x0, y0, x1, y1, gx, gy) => (x, y) => (x === x0 || x === x1 || y === y0 || y === y1) && x >= x0 && x <= x1 && y >= y0 && y <= y1 && !(x === gx && y === gy);
    const inner = (x0, y0, x1, y1) => (x, y) => x > x0 && x < x1 && y > y0 && y < y1;
    const rooms = [[3, 42 - 18, 11, 31, 7, 31], [24, 3, 32, 11, 28, 11], [38, 2, 46, 10, -1, -1]];
    rooms.forEach(([a, b, c, d, gx, gy]) => {
      MD.paint(M, 0, 'rock', all(ring(a, b, c, d, gx, gy)));
      MD.paint(M, 0, 'meadow', all(inner(a, b, c, d)));
    });
    for (const f of FIELD_SPOTS) MD.paintField(M, 0, f[0], all(blob(f[1], f[2], 2, 2, 0.05)));
    MD.paint(M, 1, 'cave', all((x, y) => Math.hypot(x - 28, y - 28) <= 15 || Math.abs(x - y) <= 1 && x >= 28));
    MD.paint(M, 1, 'cave', (c, r) => reach(c, r) <= 14);
    MD.paint(M, 1, 'fungal', all(blob(22, 34, 5, 4)));
    MD.paint(M, 1, 'water', (c, r) => reach(c, r) <= 5);
    const lanes = pts => {
      for (const flip of [p => p, ([c, r]) => [mir(c), r], ([c, r]) => [c, mir(r)], ([c, r]) => [mir(c), mir(r)]]) MD.road(M, 0, 1, pts.map(flip));
    };
    lanes([[8, 9], [14, 14], [18, 18], [34, 18], [54, 18]]);
    lanes([[14, 14], [18, 30], [18, 54]]);
    lanes([[18, 18], [30, 30]]);

    const flips = [
      (c, r) => [c, r],
      (c, r, f) => [mir(c) - f[0] + 1, r],
      (c, r, f) => [c, mir(r) - f[1] + 1],
      (c, r, f) => [mir(c) - f[0] + 1, mir(r) - f[1] + 1]
    ];
    const used = [new Set(), new Set()], key = (c, r) => r * W + c;
    const mark = (l, c, r, f) => {
      for (let y = 0; y < f[1]; y++) for (let x = 0; x < f[0]; x++) used[l].add(key(c + x, r + y));
    };
    const kept = (c, r) => {
      const x = Math.min(c, mir(c)), y = Math.min(r, mir(r));
      return rooms.some(([a, b, cc, d]) => x >= a && x <= cc && y >= b && y <= d) || Math.hypot(x - 41, y - 41) <= 6 || reach(c, r) <= 8;
    };
    const fits = (t, c, r, l, wet) => {
      const [fw, fh] = H.OBJ[t].foot;
      for (let y = -1; y <= fh; y++) {
        for (let x = -1; x <= fw; x++) {
          const nc = c + x, nr = r + y, core = x >= 0 && y >= 0 && x < fw && y < fh;
          if (!MD.inside(M, nc, nr)) return false;
          if (used[l].has(key(nc, nr)) || (!wet && l === 0 && kept(nc, nr))) return false;
          if (core && (wet ? !MD.isWater(M, l, nc, nr) : !MD.groundCost(M, l, nc, nr) || MD.roadAt(M, l, nc, nr))) return false;
          if (!core && y === fh && !wet && x >= 0 && x < fw && !MD.groundCost(M, l, nc, nr)) return false;
        }
      }
      return true;
    };
    const putAt = (flip, t, x0, y0, extra, opt) => {
      const o = opt || {}, l = o.l || 0, foot = H.OBJ[t].foot, wet = !!o.wet;
      for (let rad = 0; rad < 30; rad++) {
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
            const [c, r] = flip(x0 + dx, y0 + dy, foot);
            if (!fits(t, c, r, l, wet)) continue;
            mark(l, c, r, foot);
            return MD.add(M, Object.assign({ t, c, r, l, owner: -1 }, extra || {}));
          }
        }
      }
      throw new Error('no room for ' + t + ' near ' + x0 + ',' + y0);
    };
    const exact = (t, c, r, l, extra) => {
      mark(l, c, r, H.OBJ[t].foot);
      return MD.add(M, Object.assign({ t, c, r, l, owner: -1 }, extra || {}));
    };
    const starts = [];
    const pools = [[], [], [], []];
    const neutralList = Object.keys(H.UNITS).filter(id => H.UNITS[id].faction === 'neutral');
    neutralList.forEach((id, i) => pools[i % 4].push(id));
    const vaults = ['wagonruin', 'wolfden', 'eaglenest', 'wildhive', 'sunkentemple', 'khancrypt', 'piratecove', 'trollcave', 'giantforge', 'moonmine', 'ruinedobservatory', 'thronetreasury'];
    const moons = ['silver', 'gold', 'azure', 'green'];
    const peopleRows = [['militia', 'ringer', 'aeronaut', 'bombard'], ['shade', 'stonewoman', 'saltnoyon', 'stonekhan'], ['crossbow', 'plated', 'horseguard'], ['horsebow', 'eaglespirit', 'bonebull']];

    flips.forEach((flip, side) => {
      const put = (t, c, r, extra, opt) => putAt(flip, t, c, r, extra, opt);
      const mob = (unit, count, mood, c, r, opt) => put('monster', c, r, { unit, count, max: count * 3, mood }, opt);
      const guarded = (t, c, r, unit, count, mood, extra, opt) => {
        const o = put(t, c, r, extra, opt), e = MD.entry(o), l = o.l, sx = e[0] < W / 2 ? 1 : -1, sy = e[1] < W / 2 ? 1 : -1;
        const spots = [[sx, sy], [-sx, sy], [sx, 2 * sy], [-sx, 2 * sy], [2 * sx, sy], [-2 * sx, sy], [0, 2 * sy], [2 * sx, 2 * sy], [-2 * sx, 2 * sy]];
        const at = spots.map(([dc, dr]) => [e[0] + dc, e[1] + dr]).find(([x, y]) => MD.inside(M, x, y) && MD.groundCost(M, l, x, y) && !used[l].has(key(x, y)) && !MD.roadAt(M, l, x, y) && !(l === 0 && kept(x, y)));
        if (!at) throw new Error('no guard room at ' + t);
        mark(l, at[0], at[1], [1, 1]);
        MD.add(M, { t: 'monster', c: at[0], r: at[1], l, owner: -1, unit, count, max: count * 3, mood });
        return o;
      };
      const [g1c, g1r] = flip(7, 31, [1, 1]);
      exact('sealgate', g1c, g1r, 0, { color: side });
      const [v1c, v1r] = flip(6, 26, H.OBJ[vaults[side]].foot);
      exact(vaults[side], v1c, v1r, 0, { tier: side % 4 });
      const [g2c, g2r] = flip(28, 11, [1, 1]);
      exact('questgate', g2c, g2r, 0, { quest: [{ kind: 'res', res: { wood: 5, ore: 5 } }, { kind: 'army', unit: 'wolves', count: 5 }, { kind: 'art', art: 'luckbone' }, { kind: 'res', res: { ore: 10 } }][side] });
      const [v2c, v2r] = flip(26, 6, H.OBJ[vaults[side + 4]].foot);
      exact(vaults[side + 4], v2c, v2r, 0, { tier: (side + 1) % 4 });
      const [p1c, p1r] = flip(42, 6, H.OBJ.portal2.foot);
      const inside = exact('portal2', p1c, p1r, 0);
      const outside = put('portal2', 40, 14);
      inside.link = outside.id;
      outside.link = inside.id;
      const [v3c, v3r] = flip(39, side >= 2 ? 6 : 3, H.OBJ[vaults[side + 8]].foot);
      exact(vaults[side + 8], v3c, v3r, 0, { tier: (side + 2) % 4 });

      const [mc, mr] = flip(40, 39, H.OBJ.moongate.foot);
      exact('moongate', mc, mr, 0, { moon: moons[side] });
      const [ec, er] = flip(39, 43, H.OBJ.menhir.foot);
      exact('menhir', ec, er, 0);
      const [p2c, p2r] = flip(43, 42, H.OBJ.portal1.foot);
      const exit = exact('portal1', p2c, p2r, 0);
      const [ac, ar] = flip(44, 40, [1, 1]);
      exact('artifact', ac, ar, 0, { art: side % 2 ? 'saltstaff' : 'quiverbelt' });
      const [sc, sr] = flip(36, 41, [1, 1]);
      exact('boat', sc, sr, 0);
      const [pc1, pr1] = flip(11, 43, H.OBJ.whirlpool.foot);
      const pond = exact('whirlpool', pc1, pr1, 0);
      const [fc, fr] = flip(51, 52, H.OBJ.ferry.foot);
      const island = exact('ferry', fc, fr, 0);
      const town = put('town', 6, 6);
      starts.push({ town, gate: MD.entry(town) });
      put('sawmill', 2, 16);
      put('oremine', 16, 2);
      put('res-wood', 12, 3);
      put('res-ore', 3, 12);
      put('res-gold', 14, 8);
      put('campfire', 9, 14);
      put('artifact', 3, 3, { art: side % 2 ? 'steppebeads' : 'militiahelm' });
      put('shrine1', 16, 12, { spell: side % 2 ? 'chill' : 'balm' });
      put('windmill', 4, 20);
      put('well', 12, 12);
      put('chapel', 20, 4);
      put('wagon', 8, 18);
      put('traveler', 20, 10);
      put('moonshard', 10, 22);
      guarded('goldmine', 24, 8, side % 2 ? 'shade' : 'militia', 18, 'cautious');
      guarded('saltworks', 30, 14, 'stonewoman', 6, 'hostile');
      guarded('sulfurspring', 12, 26, side % 2 ? 'horsebow' : 'crossbow', 12, 'hostile');
      guarded('ambermine', 14, 34, 'wolves', 20, 'hostile');
      guarded('oldmine', 34, 14, 'bears', 8, 'hostile');
      put('watermill', 8, 37);
      put('apiary', 22, 20);
      put('stable', 26, 18);
      put('atkstone', 20, 26);
      put('ancestorshield', 26, 24);
      put('charmspring', 14, 20);
      put('sagescroll', 30, 20);
      put('camp', 22, 32);
      put('watchtower', 18, 24);
      put('market', 34, 20);
      put('inn', 26, 30);
      put('mercenarycamp', 12, 40 - 6);
      put('idol', 34, 26);
      put('luckspring', 30, 26);
      put('shrine2', 38, 18, { spell: side % 2 ? 'hex' : 'stoneskin' });
      put('signstone', 16, 16, { text: 'Луны считают недели. Сердце считает века.' });
      const bait = mob('boars', 10, 'hostile', 40, 22);
      put('petitioner', 44, 14, { quest: [{ kind: 'res', res: { wood: 8 } }, { kind: 'art', art: 'luckbone' }, { kind: 'kill', obj: bait.id }, { kind: 'foes', count: 1 }][side], reward: { gold: 2500, xp: 800 } });
      put('artifact', 42, 26, { art: 'luckbone' });
      guarded('knowledgetree', 48, 16, 'mercenaries', 18, 'hostile');
      guarded('witchhut', 46, 24, 'bountyhunters', 5, 'hostile');
      guarded('arena', 20, 40 - 2, 'bandits', 40, 'hostile');
      guarded('library', 36, 28, 'hermits', 5, 'hostile');
      put('weekaltar', 18, 34);
      guarded('graveyard', 30, 34, 'blackspirit', 2, 'hostile');
      guarded('observatory', 48, 28, 'mountaineagles', 8, 'hostile');
      put('cartographer', 42, 18);
      put('fair', 38, 24);
      guarded('blackmarket', 26, 38, 'scorpions', 8, 'hostile');
      put('changeforge', 36, 34 - 2);
      guarded('prison', 14, 48 - 2, 'redspirit', 3, 'fierce', { hid: null, level: 5 });
      put('sealer', 10, 10 + 8, { color: side });
      guarded('whiteruin', 46, 34 - 2, 'silverspirit', 2, 'fierce');
      put('menhir', 32, 30);
      put('wreck', 34, 37);
      put('kurganstone', 4, 34);
      put('witchring', 18, 44 + 3);
      const dwell = (id, c, r) => {
        const tier = H.UNITS[id].tier;
        if (tier >= 5) guarded('dwell-' + id, c, r, tier >= 6 ? 'silverspirit' : 'bears', tier >= 6 ? 3 : 6, 'hostile');
        else put('dwell-' + id, c, r);
      };
      pools[side].forEach((id, i) => dwell(id, 26 + (i % 3) * 9, 8 + (i >> 1) * 7));
      peopleRows[side].forEach((id, i) => dwell(id, 6 + (i % 2) * 14, 22 + (i >> 1) * 8));
      [['auka', 'bereginya'], ['werewolf', 'kikimora'], ['sirin', 'leshy'], ['zmey']][side].forEach((id, i) => dwell(id, 36 + i * 7, 42));
      [['shellman', 'jelly'], ['harpooner', 'seawitch'], ['rayrider', 'turtlefort'], ['kraken']][side].forEach((id, i) => dwell(id, 30 + i * 7, 16));
      [['apprentice', 'obsidianspider'], ['salamander', 'caster'], ['steamling', 'slaggiant'], ['volcano']][side].forEach((id, i) => dwell(id, 30 + i * 7, 30));
      [['legionary', 'mirrorguard'], ['moonarcher', 'moonmaiden'], ['deerrider', 'throneknight'], ['shard']][side].forEach((id, i) => dwell(id, 4 + i * 8, 52));
      put('chest', 42, 3, { offer: 1 });
      put('scroll', 20, 22);
      put(['res-salt', 'res-amber', 'res-sulfur', 'res-moonsilver'][side], 24, 16);
      put(['res-amber', 'res-sulfur', 'res-salt', 'res-amber'][side], 16, 40);
      if (side === 0 || side === 3) put('shrine3', 44, 42 - 20, { spell: 'dawn' });
      for (const [c, r] of [[2, 24], [14, 4], [46, 6], [52, 44]]) put('tree', c, r);
      for (const [c, r] of [[6, 40], [36, 4], [50, 20]]) put('pine', c, r);
      for (const [c, r] of [[24, 48], [46, 18], [30, 2]]) put('rock', c, r);
      put('mountain', 50, 2);
      mob('wolves', 22, 'hostile', 16, 30);
      mob('bridgetroll', 3, 'hostile', 52, 12);
      mob('stonegiant', 2, 'fierce', 52, 34 - 4);
      mob('whitespirit', 4, 'hostile', 8, 30 - 4);
      mob('greenspirit', 4, 'hostile', 28, 44 - 16);
      mob('azurespirit', 3, 'hostile', 44, 30);
      mob('goldspirit', 2, 'fierce', 36, 12);
      mob('bees', 40, 'hostile', 6, 42 - 12);

      const down = put('stairsdown', 24, 24), up = put('stairsup', 28, 28, null, { l: 1 });
      down.link = up.id;
      up.link = down.id;
      guarded('moonrift', 24, 34, 'moondream', 2, 'fierce', null, { l: 1 });
      put('crystalgrotto', 34, 24, null, { l: 1 });
      put('fungalring', 20, 30, null, { l: 1 });
      put('res-moonsilver', 18, 22, null, { l: 1 });
      put('artifact', 36, 30, { art: side % 2 ? 'khanaxe' : 'bellcuirass' }, { l: 1 });
      mob('moondream', 2, 'hostile', 30, 22, { l: 1 });
      mob('ancientlizard', 1, 'fierce', 42, 42, { l: 1 });

      const harbor = put('town', 28, 36 - 2, { faction: side % 2 ? 'barrows' : 'league', name: HARBOR_NAMES[side], water: true, built: ['hall1', 'fort1', 'tavern', 'market', 'dwell1', 'dwell2', 'shipyard'], garrison: side % 2 ? [{ unit: 'shade', count: 40 }, { unit: 'horsebow', count: 16 }] : [{ unit: 'militia', count: 40 }, { unit: 'crossbow', count: 16 }] });
      const ge = MD.entry(harbor);
      harbor.dock = nearestSea(M, ge[0], ge[1]);
      const yard = put('shipyard', 32, 28);
      const ye = MD.entry(yard);
      yard.dock = nearestSea(M, ye[0], ye[1]);
      const [bc, br] = harbor.dock;
      mark(0, bc, br, [1, 1]);
      MD.add(M, { t: 'boat', c: bc, r: br, l: 0, owner: -1 });
      put('moongate', 22, 28, { moon: moons[side] });
      put('portal1', 38, 30, { link: exit.id });
      const seaPool = put('whirlpool', 34, 44, null, { wet: true });
      pond.link = seaPool.id;
      seaPool.link = pond.id;
      put('barrel', 15, 42, null, { wet: true });
      put('barrel', 44, 38, null, { wet: true });
      mob('pirates', 10, 'hostile', 37, 42, { wet: true });
      mob('seaserpent', 2, 'fierce', 44, 46, { wet: true });
      const shore = put('ferry', 36, 36);
      island.link = shore.id;
      shore.link = island.id;
    });

    MD.add(M, { t: 'artifact', c: 55, r: 53, l: 0, owner: -1, art: 'riverbanner' });
    MD.add(M, { t: 'monster', c: 56, r: 55, l: 0, owner: -1, unit: 'moondream', count: 3, max: 9, mood: 'fierce' });
    M.heart = { l: 0, c: 57, r: 58 };
    MD.add(M, { t: 'outpost', c: 18, r: 55, l: 0, owner: -1, garrison: [{ unit: 'mercenaries', count: 30 }, { unit: 'bountyhunters', count: 4 }] });
    MD.add(M, { t: 'outpost', c: 92, r: 55, l: 0, owner: -1, garrison: [{ unit: 'mercenaries', count: 30 }, { unit: 'bountyhunters', count: 4 }] });
    for (const [c, r] of [[55, 18], [56, 19], [55, 92], [56, 93]]) MD.add(M, { t: 'monster', c, r, l: 0, owner: -1, unit: 'plated', count: 6, max: 18, mood: 'hostile' });
    MD.add(M, { t: 'monster', c: 55, r: 46, l: 1, owner: -1, unit: 'moondream', count: 1, max: 3, mood: 'fierce' });
    M.goals = { win: [{ kind: 'defeat' }, { kind: 'heart' }], lose: [{ kind: 'all' }] };
    return { M, starts };
  };

  const nearestSea = (M, c0, r0) => {
    const mid = (M.w - 1) / 2;
    for (let rad = 1; rad < 40; rad++) {
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const c = c0 + dx, r = r0 + dy;
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad || !MD.inside(M, c, r)) continue;
          if (MD.isWater(M, 0, c, r) && Math.hypot(c - mid, r - mid) <= 24) return [c, r];
        }
      }
    }
    return null;
  };

  const LIST = [
    { id: 'ford', name: 'Брод у мельницы', size: 'малая', w: 48, players: 2, about: 'Река режет край наискось: мельники на юго-западе, степняки на северо-востоке. Три брода, и каждый кто-то держит. Первая карта для новичка.', make: fordMap },
    { id: 'salt', name: 'Соляной путь', size: 'малая', w: 48, players: 2, about: 'Две крепости на концах соляного тракта, в середине Соляной Торг. Вдоль тракта солеварни и жилища: войско из них идёт в город обозом. Лига берёт в Ратуше контракты на дорогу.' },
    { id: 'seven', name: 'Семь рек', size: 'огромная', w: 144, players: 7, about: 'Семь городов в устьях семи рек, море Чаши в середине. Соседей разделяют гряды, а лунные врата открыты только в неделю своей луны и в Схождение.' },
    { id: 'crown', name: 'Кольцо Венца', size: 'большая', w: 112, players: 8, about: 'Весь Венец вокруг Чаши, восемь краёв по берегу. На островах лучшие сокровища, на одном из них лежит Сердце Восьмой луны. Менгиры на берегу указывают к нему путь.' },
    { id: 'chasha', name: 'Берега Чаши', size: 'большая', w: 112, players: 4, levels: 2, about: 'Четыре края вокруг моря, острова и Подлунье под ними. Здесь есть все объекты мира, а на среднем острове спрятано Сердце Восьмой луны.', make: chashaMap },
    { id: 'horn', name: 'Старый Горн', size: 'средняя', w: 80, players: 3, about: 'Три края у подножия вулкана, в кратере Кузня великанов. Раз в круг, в неделю Схождения, Старый Горн заливает долины вокруг кратера лавой на неделю. По лаве ходят только Горнила.' },
    { id: 'ruins', name: 'Белые руины', size: 'средняя', w: 80, players: 4, about: 'Четыре края на землях старого царства. Все дороги здесь лунные, по ним быстрее всех ходит Престол. Белые руины между краями дают золото, а Престолу Лунное серебро. В середине Сокровищница Престола.' },
    { id: 'border', name: 'Порубежье', size: 'средняя', w: 80, players: 4, about: 'Ничейные земли между четырьмя краями. В них наёмничьи лагеря, а по дорогам ходят шайки разбойников: они не стоят на месте и ловят одиноких героев.' },
    { id: 'conv', name: 'Схождение', size: 'большая', w: 112, players: 6, about: 'Шесть краёв вокруг общей середины, где спрятано Сердце Восьмой луны. Кто поднимет его до конца второго круга, тот и победил. Менгир в каждом краю подсказывает, где копать.' },
    { id: 'dark', name: 'Тьма', size: 'огромная', w: 144, players: 8, levels: 2, about: 'Восемь краёв парами наверху и Подлунье под всеми. Здесь стоят все сокровищницы мира, а нейтралы сильнее обычного. Долгая партия на много кругов.' },
    { id: 'isles', name: 'Остров на остров', size: 'средняя', w: 80, players: 2, hotseat: true, about: 'Два острова друг против друга и богатая середина между ними. Без корабля никуда. Карта для двоих за одним ПК.' },
    { id: 'seals', name: 'Печати', size: 'средняя', w: 80, players: 4, about: 'Четыре края вокруг богатой середины. Путь в середину держат заставы печати, а печать нужного цвета выдаёт печатник в земле соседа. В ничейных землях хижины просителей.' },
    { id: 'three', name: 'Три дня', size: 'малая', w: 48, players: 2, about: 'Два города в разных углах. На третьей неделе с края карты выходит Орда и за три дня доходит до ворот каждого города. К её приходу войско должно быть готово.' },
    { id: 'union', name: 'Союз', size: 'большая', w: 112, players: 4, about: 'Двое на двое. Союзники живут по соседству, видят карту друг друга, меняются войском при встрече и побеждают вместе.' },
    { id: 'mesha', name: 'Соляная межа', size: 'средняя', w: 80, players: 4, about: 'Четыре края у соляного озера. Горные гряды с заставами делят соседей, а в середине стоит Соляной Торг и лежит самое ценное.', make: meshaMap }
  ];

  const docOf = rec => {
    if (rec.doc) return rec.doc;
    if (!rec.make) throw new Error('map file is not loaded: ' + rec.id);
    rec.doc = H.MapFile.fromMade(rec, rec.make());
    return rec.doc;
  };
  const loadFiles = () => Promise.all(LIST.map(rec => fetch('content/heroes98/maps/' + rec.id + '.h98m').then(r => (r.ok ? r.text() : null)).then(text => {
    if (text) rec.doc = H.MapFile.read(text);
  }, () => {})));

  const pickHero = (faction, roll) => {
    const pool = H.HEROES.filter(x => !x.story && H.CLASSES[x.cls].faction === faction);
    return pool[Math.floor(roll() * pool.length)];
  };

  const play = (doc, o) => {
    const copy = H.MapFile.clone(doc), M = copy.map, roll = H.rng(o.seed), players = [], heroes = [], taken = new Set(), slotMap = [];
    let pids = 0;
    doc.players.forEach((pl, i) => { slotMap[i] = o.slots[i] ? pids++ : -1; });
    for (const x of M.objs) if (x.owner >= 0) x.owner = slotMap[x.owner] == null ? -1 : slotMap[x.owner];
    const pickAny = () => {
      const pool = H.HEROES.filter(x => !x.story && !taken.has(x.id));
      return pool[Math.floor(roll() * pool.length)];
    };
    doc.players.forEach((pl, i) => {
      const slot = o.slots[i], town = M.objs.find(x => x.id === pl.town) || M.objs.find(x => x.t === 'town' && x.owner === slotMap[i] && slotMap[i] >= 0) || null;
      if (pl.auto) town.built = START_BUILT.slice();
      if (!slot) {
        if (!pl.auto) return;
        const faction = i % 2 ? 'barrows' : 'league';
        town.faction = faction;
        town.name = TOWN_NAMES[faction][i % 4];
        town.garrison = GARRISON[faction];
        return;
      }
      const pid = players.length, faction = slot.faction;
      if (town) {
        town.owner = pid;
        if (pl.auto) town.name = TOWN_NAMES[faction][i % 4];
        if (town.faction !== faction) town.built = (town.built || []).filter(id => H.FACTIONS[faction].building[id]);
        town.faction = faction;
      }
      players.push({ name: 'Игрок ' + (i + 1), color: i, faction, human: !!slot.human, team: slot.team !== undefined ? slot.team : pl.team });
      const own = copy.heroes.filter(h => h.owner === i);
      if (own.length || !town) {
        for (const h of own) {
          let rec = h.hid ? H.HEROES.find(x => x.id === h.hid) : pickHero(faction, roll);
          while (!h.hid && taken.has(rec.id)) rec = pickHero(faction, roll);
          taken.add(rec.id);
          const army = h.army && h.army.length ? h.army : rec.army.map(([unit, lo, hi]) => ({ unit, count: lo + Math.floor(roll() * (hi - lo + 1)) }));
          heroes.push({ owner: pid, hid: rec.id, name: rec.name, cls: rec.cls, faction: H.CLASSES[rec.cls].faction, c: h.c, r: h.r, l: h.l || 0, army, skills: h.skills || undefined, arts: h.arts, xp: h.xp || 0, tag: h.tag || undefined, patrol: h.patrol || 0 });
        }
        return;
      }
      let hero = slot.hid ? H.HEROES.find(x => x.id === slot.hid) : pickHero(faction, roll);
      while (taken.has(hero.id)) hero = pickHero(faction, roll);
      taken.add(hero.id);
      const army = hero.army.map(([unit, lo, hi]) => ({ unit, count: lo + Math.floor(roll() * (hi - lo + 1)) }));
      const gate = MD.entry(town);
      heroes.push({ owner: pid, hid: hero.id, name: hero.name, cls: hero.cls, faction, c: gate[0], r: gate[1], l: town.l, army });
    });
    for (const p of M.objs) {
      if (p.t !== 'prison' || p.hid) continue;
      const hero = pickAny();
      taken.add(hero.id);
      p.hid = hero.id;
    }
    M.events = copy.events;
    M.scenes = copy.scenes;
    const goals = JSON.parse(JSON.stringify(copy.goals));
    for (const list of [goals.win, goals.lose]) for (const g of list) if (g.who != null) g.who = slotMap[g.who];
    M.goals = goals;
    return { name: doc.name, map: M, setup: { seed: o.seed, name: doc.name, difficulty: o.difficulty || 'normal', players, heroes, goals, slotMap } };
  };

  const build = (id, o) => play(docOf(LIST.find(m => m.id === id)), o);

  H.Maps = { trial, blob, near, LIST, build, play, docOf, loadFiles };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
