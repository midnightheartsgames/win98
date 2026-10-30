(function (H) {
  'use strict';
  H.TIERS = {
    1: { hp: [4, 8], dmg: [1, 3], speed: [4, 6], init: [9, 12], growth: [14, 20], cost: [25, 45], rare: [0, 0] },
    2: { hp: [10, 18], dmg: [2, 5], speed: [4, 6], init: [8, 11], growth: [8, 12], cost: [60, 110], rare: [0, 0] },
    3: { hp: [20, 35], dmg: [4, 9], speed: [4, 7], init: [9, 12], growth: [6, 9], cost: [120, 220], rare: [0, 0] },
    4: { hp: [40, 60], dmg: [8, 15], speed: [5, 7], init: [9, 12], growth: [4, 6], cost: [300, 500], rare: [0, 0] },
    5: { hp: [70, 110], dmg: [14, 25], speed: [5, 8], init: [9, 13], growth: [3, 4], cost: [600, 900], rare: [1, 1] },
    6: { hp: [120, 180], dmg: [22, 40], speed: [6, 9], init: [9, 13], growth: [2, 3], cost: [1100, 1600], rare: [1, 2] },
    7: { hp: [220, 350], dmg: [40, 70], speed: [6, 10], init: [10, 12], growth: [1, 1], cost: [2600, 4000], rare: [2, 4] }
  };

  H.BATTLE = {
    cols: 14,
    rows: 10,
    deploy: 2,
    full: 100,
    roundTicks: 10,
    startReady: 25,
    waitAt: 50,
    defendAt: 30,
    defendBonus: 0.4,
    panicAt: 40,
    surge: 50,
    moraleStep: 0.05,
    luckStep: 0.05,
    luckHigh: 1.5,
    luckLow: 0.5,
    far: 7,
    farMul: 0.5,
    meleeShooter: 0.5,
    statBase: 1.04,
    multMin: 0.3,
    multMax: 3,
    rollCount: 10,
    spread: 0.1,
    obstacles: [2, 6],
    statCap: 3,
    warcry: 40,
    nabatReady: 40,
    nabatMorale: 2,
    nabatRounds: 2,
    raiseShare: 0.5
  };

  H.TERRAIN = [
    { id: 'meadow', name: 'Луг', cost: 1 },
    { id: 'steppe', name: 'Степь', cost: 1 },
    { id: 'palegrass', name: 'Бледный луг', cost: 1 },
    { id: 'forest', name: 'Лес', cost: 1.5 },
    { id: 'swamp', name: 'Болото', cost: 1.75 },
    { id: 'sand', name: 'Песок', cost: 1.25 },
    { id: 'saltflat', name: 'Солончак', cost: 1.25 },
    { id: 'highland', name: 'Нагорье', cost: 1.5 },
    { id: 'ash', name: 'Пепел', cost: 1.25 },
    { id: 'lava', name: 'Лава', cost: 0 },
    { id: 'water', name: 'Вода', cost: 0 },
    { id: 'cave', name: 'Пещерный пол', cost: 1 },
    { id: 'fungal', name: 'Грибной мох', cost: 1.25 },
    { id: 'rock', name: 'Скалы', cost: 0 }
  ];
  H.TERRAIN_INDEX = Object.fromEntries(H.TERRAIN.map((t, i) => [t.id, i]));
  H.ROADS = [null, { id: 'dirt', name: 'Грунтовая дорога', cost: 0.75 }, { id: 'paved', name: 'Мощёная дорога', cost: 0.65 }, { id: 'moon', name: 'Лунная дорога', cost: 0.6 }];
  H.RESOURCES = [['gold', 'Золото'], ['wood', 'Древесина'], ['ore', 'Руда'], ['salt', 'Соль'], ['amber', 'Янтарь'], ['sulfur', 'Сера'], ['moonsilver', 'Лунное серебро']];

  H.MAP = {
    tile: 32,
    daySteps: 18,
    fastArmy: 6,
    slowArmy: 3,
    armyStep: 2,
    diagonal: 1.41,
    heroSight: 5,
    mineSight: 2,
    townSight: 5,
    townless: 7,
    growth: 0.1,
    power: 3,
    strength: [[1, 'Несколько'], [5, 'Отряд'], [10, 'Дружина'], [20, 'Полк'], [50, 'Рать'], [100, 'Орда'], [250, 'Тьма']],
    mood: { friendly: 'дружелюбный', cautious: 'осторожный', hostile: 'враждебный', fierce: 'свирепый' },
    join: { friendly: [[3, 0.7], [1.5, 0.4]], cautious: [[3, 0.35]] },
    split: [3, 7],
    mineIncome: { gold: 1000, wood: 2, ore: 2, salt: 1, amber: 1, sulfur: 1, moonsilver: 1 },
    start: { gold: 10000, wood: 15, ore: 15, salt: 3, amber: 3, sulfur: 3, moonsilver: 3 }
  };

  H.DIFFICULTY = {
    easy: { name: 'Лёгкая', income: 0.8, growth: 0.9, days: 2, start: 1.5, sees: false },
    normal: { name: 'Обычная', income: 1, growth: 1, days: 3, start: 1, sees: false },
    hard: { name: 'Трудная', income: 1.15, growth: 1.1, days: 4, start: 0.75, sees: false },
    impossible: { name: 'Невозможная', income: 1.3, growth: 1.2, days: 4, start: 0.375, sees: true }
  };

  H.TOWN = {
    heroPrice: 2500,
    shelves: [4, 3, 3, 2, 1],
    maxHeroes: 8,
    poolWeeks: 2,
    maxMarket: 9,
    value: { wood: 300, ore: 300, salt: 600, amber: 600, sulfur: 600, moonsilver: 800 },
    sell: [0.2, 0.05],
    buy: [2.2, 0.1]
  };

  H.HERO = {
    maxLevel: 30,
    xpFirst: 250,
    xpGrow: 1.25,
    stats: { warrior: { atk: 2, def: 2, power: 1, wis: 1 }, mage: { atk: 1, def: 1, power: 2, wis: 2 } },
    manaPerWis: 10,
    manaDay: 1,
    maxSkills: 6,
    talentLevels: [6, 12, 18],
    highLevel: 24,
    ownSkillWeight: 2,
    skillGrowth: 0.05,
    starAfter: 3,
    maxStars: 3,
    maxBag: 30,
    trailShare: 0.5,
    earlySteps: 4,
    windSteps: 3,
    windTerrain: ['steppe', 'saltflat'],
    parleyChance: 1.25,
    parleyPrice: 0.75,
    treasureGold: 1.25,
    memoryMana: 2,
    tollShare: 0.05,
    militiaGrowth: 25,
    militiaTiers: 2,
    wallShare: 0.15,
    lamentReady: 10,
    lastStrike: 0.5,
    closedRanks: 0.45,
    gun: { units: ['bombard', 'mortar', 'culverin'], shots: 1, dmg: 0.2 },
    ambushReady: 20,
    chargeReady: 20,
    standBonus: 0.2,
    answerBonus: 0.25,
    finishBonus: 0.25,
    quiverShots: 2
  };
  H.XP_TABLE = (() => {
    const out = [0, 0];
    for (let L = 2; L <= H.HERO.maxLevel; L++) out[L] = out[L - 1] + Math.round(H.HERO.xpFirst * Math.pow(H.HERO.xpGrow, L - 2));
    return out;
  })();

  H.TRIALS = [
    { name: 'Строй против теней', about: 'Лига держит строй, Тени летят через поле', player: 0, sides: [{ stacks: [{ unit: 'militia', count: 60 }, { unit: 'crossbow', count: 18 }, { unit: 'ringer', count: 8 }, { unit: 'plated', count: 3 }] }, { stacks: [{ unit: 'shade', count: 55 }, { unit: 'horsebow', count: 15 }, { unit: 'stonewoman', count: 6 }, { unit: 'eaglespirit', count: 3 }] }] },
    { name: 'Курганы идут на Лигу', about: 'Вы ведёте Курганы, Лига стоит справа', player: 0, sides: [{ stacks: [{ unit: 'shade', count: 50 }, { unit: 'horsebow', count: 20 }, { unit: 'stonewoman', count: 8 }, { unit: 'eaglespirit', count: 4 }] }, { stacks: [{ unit: 'militia', count: 60 }, { unit: 'crossbow', count: 20 }, { unit: 'ringer', count: 10 }, { unit: 'plated', count: 4 }] }] },
    { name: 'Стрелки и летуны', about: 'Арбалеты против беркутов и теней', player: 0, sides: [{ stacks: [{ unit: 'crossbow', count: 30 }, { unit: 'militia', count: 40 }, { unit: 'plated', count: 4 }] }, { stacks: [{ unit: 'eaglespirit', count: 6 }, { unit: 'shade', count: 48 }] }] },
    { name: 'Стена латников', about: 'Латники и звонари против баб и конных лучников', player: 0, sides: [{ stacks: [{ unit: 'plated', count: 6 }, { unit: 'ringer', count: 12 }, { unit: 'militia', count: 30 }] }, { stacks: [{ unit: 'stonewoman', count: 11 }, { unit: 'horsebow', count: 25 }, { unit: 'shade', count: 28 }] }] },
    { name: 'Набег на дельту', about: 'Небольшие отряды, быстрый бой', player: 1, sides: [{ stacks: [{ unit: 'shade', count: 28 }, { unit: 'eaglespirit', count: 2 }, { unit: 'horsebow', count: 9 }] }, { stacks: [{ unit: 'militia', count: 35 }, { unit: 'crossbow', count: 12 }, { unit: 'ringer', count: 5 }] }] }
  ];

  H.damageMult = (atk, def) => H.clamp(Math.pow(H.BATTLE.statBase, atk - def), H.BATTLE.multMin, H.BATTLE.multMax);
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
