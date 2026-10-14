(function (Z) {
  'use strict';

  const SKINS = [[226, 190, 160], [214, 174, 140], [196, 150, 116], [236, 204, 178], [170, 122, 92], [204, 166, 130]];
  const HAIRS = [[40, 30, 22], [70, 50, 32], [110, 80, 50], [150, 120, 80], [26, 24, 24], [130, 124, 118], [200, 196, 190], [170, 90, 40]];
  Z.LOOK_POOL = { SKINS, HAIRS };

  Z.randomLook = (R, o = {}) => {
    const sex = o.sex || (R() < 0.6 ? 'm' : 'f');
    const age = o.age !== undefined ? o.age : R();
    return Object.assign({
      sex, age, build: R(), height: 0.96 + R() * 0.08,
      skin: SKINS[Math.floor(R() * SKINS.length)],
      hairCol: age > 0.75 ? HAIRS[5 + Math.floor(R() * 2)] : HAIRS[Math.floor(R() * 5)],
      hair: sex === 'm' ? (R() < 0.15 ? 'bald' : R() < 0.85 ? 'short' : 'long') : (R() < 0.5 ? 'bun' : R() < 0.8 ? 'long' : 'short'),
      beard: sex === 'm' ? (R() < 0.35 ? 'stubble' : R() < 0.55 ? 'mustache' : R() < 0.7 ? 'full' : 'none') : 'none',
      eyes: [[60, 90, 140], [80, 110, 70], [90, 60, 40], [100, 110, 120]][Math.floor(R() * 4)],
      brows: 0.5 + R() * 0.5, scar: R() < 0.12, faceSeed: Math.floor(R() * 1e6),
      top: 'shirt', topCol: [110, 100, 80], legs: 'trousers', legsCol: [60, 58, 54], boots: [40, 34, 30], hat: 'none'
    }, o);
  };


  const P = (id, name, y0, y1, mult, vats, extra) => Object.assign({ id, name, y0, y1, mult, vats }, extra || {});
  Z.PARTS = {
    beetle: [P('head', 'Голова', 0.2, 0.9, 1.6, 0.5, { front: true }), P('torso', 'Панцирь', 0.3, 1.0, 0.7, 1), P('lleg', 'Лапы', 0, 0.35, 1, 0.6)],
    cricket: [P('head', 'Голова', 0.3, 1, 1.8, 0.5, { front: true }), P('torso', 'Брюшко', 0.2, 1, 1, 1), P('larm', 'Копательные лапы', 0, 0.5, 0.9, 0.55)],
    gull: [P('head', 'Голова', 0.6, 1, 2, 0.45), P('torso', 'Тело', 0.25, 0.75, 1, 1), P('larm', 'Крылья', 0.2, 0.8, 0.8, 0.8, { wing: true })],
    fish: [P('head', 'Голова', 0.0, 1, 1.7, 0.6, { front: true }), P('torso', 'Тело', 0.0, 1, 1, 1), P('lleg', 'Хвост', 0, 1, 0.8, 0.6)],
    bird: [P('head', 'Голова', 0.78, 1, 2, 0.45), P('torso', 'Тело', 0.35, 0.8, 1, 1), P('lleg', 'Ноги', 0, 0.38, 0.8, 0.65)],
    quad: [P('head', 'Голова', 0.55, 1, 2, 0.5, { front: true }), P('torso', 'Тело', 0.3, 0.8, 1, 1), P('lleg', 'Лапы', 0, 0.35, 0.8, 0.6)],
    plant: [P('head', 'Соцветие', 0.75, 1, 1.8, 0.6), P('torso', 'Стебель', 0, 0.75, 0.8, 0.8)],
    hobot: [P('head', 'Голова', 0.86, 1, 1.6, 0.5), P('filter', 'Фильтр', 0.6, 0.78, 2.5, 0.35, { special: 'filter' }), P('torso', 'Торс', 0.52, 0.86, 1, 1), P('rarm', 'Правая рука', 0.45, 0.85, 0.8, 0.7, { side: 1 }), P('larm', 'Левая рука', 0.45, 0.85, 0.8, 0.7, { side: -1 }), P('rleg', 'Правая нога', 0, 0.52, 0.8, 0.75, { side: 1 }), P('lleg', 'Левая нога', 0, 0.52, 0.8, 0.75, { side: -1 })],
    robot: [P('head', 'Сенсоры', 0.82, 1, 1.5, 0.5), P('torso', 'Корпус', 0.35, 0.82, 1, 1), P('rarm', 'Излучатель', 0.4, 0.8, 0.8, 0.6, { side: 1, special: 'weapon' }), P('lleg', 'Ходовая', 0, 0.35, 0.8, 0.7)],
    rover: [P('head', 'Антенна', 0.8, 1, 1.4, 0.45, { special: 'antenna' }), P('torso', 'Корпус', 0.3, 0.8, 1, 1), P('rarm', 'Ракетная установка', 0.6, 1, 0.9, 0.55, { special: 'weapon' }), P('lleg', 'Колёса', 0, 0.35, 0.8, 0.7, { special: 'wheels' })]
  };

  Z.CREATURES = {
    kolorad: { name: 'Колорад', hp: 34, dt: 3, speed: 3.6, dmg: 7, range: 1.3, rof: 1.3, xp: 12, radius: 0.55, height: 0.75, behavior: 'swarm', rig: 'beetle', parts: 'beetle', beast: true, frontArmor: 5, sight: 18, hear: 22, loot: [['larva', 0.6, 1, 2], ['chitin', 0.35, 1, 1]], look: { scale: 1 } },
    koloradQueen: { name: 'Колорад-матка', hp: 360, dt: 7, speed: 1.6, dmg: 20, range: 2.4, rof: 0.8, xp: 150, radius: 1.5, height: 1.6, behavior: 'queen', rig: 'beetle', parts: 'beetle', beast: true, big: true, sight: 25, hear: 30, loot: [['chitin', 1, 3, 5], ['larva', 1, 3, 6]], look: { scale: 2.6, queen: true } },
    medvedka: { name: 'Медведка', hp: 95, dt: 4, speed: 4.4, dmg: 15, range: 1.7, rof: 1.1, xp: 30, radius: 0.6, height: 0.8, behavior: 'burrow', rig: 'cricket', parts: 'cricket', beast: true, sight: 8, hear: 30, loot: [['chitin', 0.3, 1, 1]], look: { scale: 1 } },
    martyn: { name: 'Мартын', hp: 28, dt: 0, speed: 9, dmg: 9, range: 1.6, rof: 0.9, xp: 15, radius: 0.5, height: 0.6, behavior: 'dive', rig: 'gull', parts: 'gull', beast: true, flying: true, sight: 45, hear: 30, loot: [['feather', 0.7, 1, 3]], look: { scale: 1 } },
    som: { name: 'Сом', hp: 150, dt: 5, speed: 2.4, swimSpeed: 4.8, dmg: 24, range: 2.4, rof: 0.8, xp: 45, radius: 0.8, height: 0.7, behavior: 'lurk', rig: 'fish', parts: 'fish', beast: true, aquatic: true, sight: 14, hear: 22, loot: [['somRaw', 1, 1, 2]], look: { scale: 1 } },
    somKing: { name: 'Царь-сом', hp: 800, dt: 11, speed: 2.4, swimSpeed: 5.5, dmg: 45, range: 3.6, rof: 0.6, xp: 300, radius: 2.2, height: 1.5, behavior: 'lurk', rig: 'fish', parts: 'fish', beast: true, aquatic: true, big: true, sight: 20, hear: 30, loot: [['whisker', 1, 1, 1], ['somRaw', 1, 4, 6]], look: { scale: 2.8, king: true } },
    broiler: { name: 'Бройлер', hp: 48, dt: 1, speed: 5.6, dmg: 8, range: 1.4, rof: 1.4, xp: 14, radius: 0.45, height: 1.4, behavior: 'pack', rig: 'bird', parts: 'bird', beast: true, sight: 22, hear: 20, loot: [['broilerRaw', 0.8, 1, 2], ['egg', 0.3, 1, 1]], look: { scale: 1 } },
    rooster: { name: 'Петух-горлопан', hp: 110, dt: 3, speed: 5.8, dmg: 14, range: 1.6, rof: 1.2, xp: 40, radius: 0.55, height: 1.8, behavior: 'pack', rig: 'bird', parts: 'bird', beast: true, sight: 26, hear: 26, loot: [['broilerRaw', 1, 2, 3]], look: { scale: 1.3, rooster: true } },
    baibak: { name: 'Байбак', hp: 18, dt: 0, speed: 5.2, dmg: 4, range: 1.1, rof: 1.5, xp: 5, radius: 0.35, height: 0.5, behavior: 'flee', rig: 'quad', parts: 'quad', beast: true, sight: 30, hear: 25, loot: [['baibakRaw', 1, 1, 1]], look: { kind: 'baibak' } },
    dog: { name: 'Одичалый пёс', hp: 40, dt: 0, speed: 6.8, dmg: 8, range: 1.4, rof: 1.5, xp: 12, radius: 0.45, height: 0.8, behavior: 'pack', rig: 'quad', parts: 'quad', beast: true, sight: 30, hear: 30, loot: [], look: { kind: 'dog' } },
    ox: { name: 'Вол-трёхрог', hp: 160, dt: 4, speed: 2, dmg: 18, range: 2, rof: 0.7, xp: 20, radius: 1.0, height: 1.6, behavior: 'grazer', rig: 'quad', parts: 'quad', beast: true, big: true, neutral: true, sight: 15, hear: 15, loot: [], look: { kind: 'ox' } },
    sunflower: { name: 'Подсолнух', hp: 60, dt: 2, speed: 0, dmg: 4, range: 35, rof: 4, xp: 20, radius: 0.6, height: 3.2, behavior: 'turret', rig: 'plant', parts: 'plant', plant: true, static: true, sight: 35, hear: 0, burst: 6, loot: [['seeds', 0.9, 1, 3]], look: {} },
    hobot: { name: 'Хобот', hp: 72, dt: 2, speed: 4.3, dmg: 12, range: 1.5, rof: 1.1, xp: 22, radius: 0.35, height: 1.8, behavior: 'melee', rig: 'human', parts: 'hobot', human: true, sight: 14, hear: 35, loot: [['filter', 0.15, 1, 1], ['b190', 0.2, 1, 1], ['tushenka', 0.2, 1, 1]], look: { top: 'rags', gasmask: 'hose', grime: true } },
    hobotOzk: { name: 'Хобот в ОЗК', hp: 90, dt: 8, speed: 4.0, dmg: 14, range: 1.5, rof: 1.0, xp: 32, radius: 0.36, height: 1.8, behavior: 'melee', rig: 'human', parts: 'hobot', human: true, sight: 14, hear: 35, loot: [['filter', 0.3, 1, 1], ['b190', 0.3, 1, 1]], look: { top: 'ozk', gasmask: 'hose' } },
    udarnik: { name: 'Ударник', hp: 230, dt: 9, speed: 3.8, dmg: 30, range: 2.2, rof: 0.75, xp: 65, radius: 0.55, height: 2.4, behavior: 'brute', rig: 'human', human: true, big: true, sight: 26, hear: 26, loot: [['rebar', 0.4, 1, 1], ['stakhanovit', 0.3, 1, 1]], look: { top: 'workwear', bulk: 0.55, scale: 1.32, slag: true, hat: 'kaska' }, knock: 0.35, weapon: 'sledge' },
    udarnikRivet: { name: 'Ударник-клепальщик', hp: 200, dt: 8, speed: 3.4, dmg: 18, range: 25, rof: 2, xp: 70, radius: 0.55, height: 2.4, behavior: 'ranged', rig: 'human', human: true, big: true, sight: 30, hear: 26, loot: [['rivets', 0.8, 6, 14]], look: { top: 'workwear', bulk: 0.5, scale: 1.3, slag: true, hat: 'kaska' }, weapon: 'rivet' },
    druzhinnik: { name: 'Дружинник', hp: 110, dt: 10, speed: 3.0, dmg: 14, range: 30, rof: 2.5, xp: 50, radius: 0.5, height: 2.0, behavior: 'robot', rig: 'robot', parts: 'robot', robot: true, sight: 35, hear: 25, loot: [['krona', 0.8, 4, 12], ['tube', 0.5, 1, 2], ['capacitor', 0.4, 1, 1]], look: {}, weapon: 'luch' },
    lunokhod: { name: 'Луноход', hp: 420, dt: 16, speed: 2.2, dmg: 12, range: 60, rof: 6, xp: 160, radius: 1.4, height: 1.9, behavior: 'tank', rig: 'rover', parts: 'rover', robot: true, big: true, sight: 50, hear: 30, loot: [['tube', 1, 2, 4], ['relay', 1, 1, 3], ['a762k', 1, 20, 40]], look: {}, rockets: true },
    agregat: { name: 'Агрегат', hp: 120, dt: 8, speed: 2.6, dmg: 16, range: 1.9, rof: 1, xp: 30, radius: 0.6, height: 1.6, behavior: 'melee', rig: 'agregat', parts: 'robot', robot: true, sight: 20, hear: 20, loot: [['spring', 0.6, 1, 2], ['wire', 0.6, 1, 2], ['tube', 0.3, 1, 1]], look: {} }
  };

  Z.HUMANS = {
    shpana: { name: 'Шпана', faction: 'shpana', hp: 70, lvl: [1, 4], skill: 40, hostile: true, weapons: [['pm', 0.3], ['obrez', 0.2], ['knife', 0.2], ['crowbar', 0.15], ['molotov', 0.15]], looks: [{ top: 'tracksuit', topCol: [40, 50, 140] }, { top: 'tracksuit', topCol: [30, 30, 30] }, { top: 'kozhanka', topCol: [40, 34, 30], hat: 'kepka' }, { top: 'rags', topCol: [90, 80, 70] }], loot: [['belomor', 0.4, 1, 1], ['samogon', 0.25, 1, 1], ['talon', 0.8, 3, 18], ['seeds', 0.4, 1, 1]], xp: 15 },
    marauder: { name: 'Мародёр', faction: 'raiders', hp: 85, lvl: [2, 6], skill: 45, hostile: true, weapons: [['toz', 0.25], ['tt', 0.25], ['sks', 0.15], ['axe', 0.2], ['rebar', 0.15]], looks: [{ top: 'vatnik', topCol: [50, 52, 56], hat: 'ushanka' }, { top: 'rags', topCol: [80, 70, 60] }, { top: 'workwear', topCol: [90, 80, 64], hat: 'kaska' }], loot: [['talon', 0.9, 5, 25], ['tushenka', 0.3, 1, 1], ['stim', 0.15, 1, 1]], xp: 22 },
    komendach: { name: 'Боец Комендатуры', faction: 'komendatura', hp: 110, lvl: [4, 8], skill: 55, weapons: [['akm', 0.45], ['sks', 0.35], ['pm', 0.2]], grenades: 0.3, looks: [{ top: 'shinel', topCol: [92, 96, 76], hat: 'kaska', hatCol: [86, 100, 70] }, { top: 'gimn', topCol: [110, 112, 80], hat: 'furazhka' }], apparel: ['shinel', 'kaska'], loot: [['talon', 0.6, 5, 20], ['stim', 0.3, 1, 1], ['tushenka', 0.4, 1, 1]], xp: 30 },
    sechevik: { name: 'Сечевик', faction: 'sich', hp: 105, lvl: [4, 8], skill: 55, weapons: [['mosin', 0.4], ['sabre', 0.35], ['toz', 0.15], ['nagan', 0.1]], grenades: 0.15, looks: [{ top: 'zhupan', topCol: [40, 60, 140], hat: 'papakha', hair: 'chub', beard: 'cossack', sex: 'm' }, { top: 'zhupan', topCol: [140, 40, 40], hat: 'none', hair: 'chub', beard: 'cossack', sex: 'm' }, { top: 'zhupan', topCol: [60, 90, 60], hat: 'papakha', hair: 'chub', beard: 'cossack', sex: 'm' }], apparel: ['zhupan', 'papakha'], loot: [['talon', 0.5, 3, 15], ['salo', 0.5, 1, 1], ['samogon', 0.4, 1, 1]], xp: 30 },
    coop: { name: 'Кооператор', faction: 'coop', hp: 90, lvl: [3, 7], skill: 50, weapons: [['tt', 0.5], ['ppsh', 0.3], ['knife', 0.2]], looks: [{ top: 'kozhanka', topCol: [26, 24, 24], hair: 'short' }, { top: 'jeans', topCol: [60, 90, 150] }], apparel: ['kozhanka'], loot: [['talon', 1, 15, 45], ['vodka', 0.3, 1, 1], ['belomor', 0.4, 1, 1]], xp: 25 },
    villager: { name: 'Житель Вознесенки', faction: 'vozn', hp: 80, lvl: [1, 3], skill: 30, weapons: [['toz', 0.2], ['axe', 0.2], ['lopatka', 0.2], ['fists', 0.4]], looks: [{ top: 'vatnik', topCol: [60, 60, 64] }, { top: 'workwear', topCol: [100, 90, 70], hat: 'kepka' }, { top: 'dress', topCol: [150, 80, 70], hat: 'kerchief', sex: 'f' }, { top: 'shirt', topCol: [120, 110, 90] }], loot: [['talon', 0.5, 1, 8], ['bread', 0.3, 1, 1], ['potato', 0.4, 1, 3]], xp: 10 },
    rechnik: { name: 'Речник', faction: 'vozn', hp: 85, lvl: [2, 4], skill: 40, weapons: [['obrez', 0.4], ['knife', 0.6]], looks: [{ top: 'telnyashka', topCol: [60, 60, 90], hat: 'kepka' }], loot: [['somRaw', 0.4, 1, 1], ['talon', 0.6, 2, 10]], xp: 12 },
    chumak: { name: 'Чумак', faction: 'vozn', hp: 95, lvl: [3, 5], skill: 45, weapons: [['toz', 0.5], ['axe', 0.5]], looks: [{ top: 'vatnik', topCol: [110, 96, 70], hat: 'papakha', beard: 'full', sex: 'm' }], loot: [['talon', 0.8, 5, 20]], xp: 15 }
  };

  Z.rollLoot = (R, table) => {
    const out = [];
    for (const [id, p, lo, hi] of table || []) if (R() < p) out.push([id, lo + Math.floor(R() * (hi - lo + 1))]);
    return out;
  };

  const G = Z.Game.prototype;

  G.spawnCreature = function (kind, x, z, o = {}) {
    const d = Z.CREATURES[kind];
    if (!d) throw new Error('creature ' + kind);
    const R = this.rng;
    const a = new Z.Actor({ name: o.name || d.name, kind: 'creature', faction: o.faction || (d.robot ? 'robots' : 'beasts'), hpMax: Math.round(d.hp * (o.hpMult || 1)), radius: d.radius, height: d.height, dt: d.dt, sheet: Z.npcSheet(o.level || 3, { per: 6, agi: 6 }, { guns: 55, melee: 55, unarmed: 60, energy: 55, sneak: 30 }) });
    a.def = kind;
    a.cdef = d;
    a.rig = d.rig === 'human' ? null : d.rig;
    a.parts = Z.PARTS[d.parts] || null;
    a.look = Object.assign({}, d.look || {}, o.look || {});
    if (d.rig === 'human') { const L = Z.randomLook(R, Object.assign({ sex: 'm' }, d.look)); a.look = Object.assign(L, d.look, o.look || {}); if (d.look.gasmask) a.look.gasmask = d.look.gasmask; }
    a.beast = !!d.beast; a.robot = !!d.robot; a.human = !!d.human; a.big = !!d.big; a.plant = !!d.plant;
    a.x = x; a.z = z; a.y = this.cell.cw.groundAt(x, z, 200);
    if (d.flying) a.y += 6 + R() * 6;
    a.yaw = R() * Math.PI * 2;
    a.seed = Math.floor(R() * 1000);
    a.hostile = !d.neutral && !o.friendly;
    a.xpReward = d.xp;
    a.ai = { state: 'idle', home: [x, z], wander: o.wander === undefined ? 12 : o.wander, t: R() * 2, aware: 0 };
    a.ammoLimited = false;
    if (d.weapon) { const e = a.give(d.weapon); a.equipEntry(e); const wd = Z.item(d.weapon); if (wd.mag) e.loaded = wd.mag; }
    for (const [id, n] of Z.rollLoot(R, d.loot)) a.give(id, n);
    a.cell = this.cell.id;
    this.cell.actors.push(a);
    return a;
  };

  G.spawnHuman = function (tpl, x, z, o = {}) {
    const d = Z.HUMANS[tpl];
    if (!d) throw new Error('human ' + tpl);
    const R = this.rng;
    const lvl = o.level || d.lvl[0] + Math.floor(R() * (d.lvl[1] - d.lvl[0] + 1));
    const sk = o.skill || d.skill;
    const sheet = Z.npcSheet(lvl, { str: 5, per: 5, end: 5, agi: 5 }, { guns: sk, melee: sk, unarmed: sk, energy: sk - 10, explosives: sk - 10, sneak: 30 });
    const a = new Z.Actor({ name: o.name || d.name, kind: 'npc', faction: o.faction || d.faction, hpMax: Math.round((o.hp || d.hp) + lvl * 6), sheet });
    a.def = tpl;
    a.human = true;
    const lookT = o.look || d.looks[Math.floor(R() * d.looks.length)];
    a.look = Object.assign(Z.randomLook(R, { sex: lookT.sex }), lookT);
    a.x = x; a.z = z; a.y = this.cell.cw.groundAt(x, z, 200);
    a.yaw = o.yaw !== undefined ? o.yaw : R() * Math.PI * 2;
    a.seed = Math.floor(R() * 1000);
    a.hostile = o.hostile !== undefined ? o.hostile : !!d.hostile;
    a.xpReward = d.xp;
    a.ai = { state: 'idle', home: [x, z], wander: o.wander === undefined ? 6 : o.wander, t: R() * 3, aware: 0 };
    const wid = o.weapon || Z.rng(a.seed + 3).weighted(d.weapons);
    if (wid && wid !== 'fists') {
      const e = a.give(wid);
      a.equipEntry(e);
      const wd = Z.item(wid);
      if (wd.mag) { e.loaded = wd.mag; a.give(wd.ammo, wd.mag * (1 + Math.floor(R() * 2))); }
      if (wd.thrown) a.give(wid, 1 + Math.floor(R() * 2));
      e.cond = 0.45 + R() * 0.45;
    }
    if (d.grenades && R() < d.grenades) a.give(R() < 0.6 ? 'rgd' : 'f1', 1);
    for (const ap of o.apparel || d.apparel || []) { const e = a.give(ap, 1, 0.5 + R() * 0.4); a.equipEntry(e); }
    for (const [id, n] of Z.rollLoot(R, d.loot)) a.give(id, n);
    a.cell = this.cell.id;
    this.cell.actors.push(a);
    return a;
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
