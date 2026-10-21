(function (H) {
  'use strict';

  const FACTION_ORDER = ['knight', 'barbarian', 'sorceress', 'warlock'];

  const FACTIONS = {
    knight: {
      id: 'knight',
      name: 'Рыцарь',
      townType: 'Ферма',
      rulerName: 'Лорд Морглин Айронфист',
      rulerShort: 'Айронфист',
      nativeTerrain: 'grass',
      startStats: { atk: 1, def: 2, power: 1, knowledge: 1 },
      levelWeights: { atk: 35, def: 45, power: 10, knowledge: 10 },
      startsWithSpellbook: false,
      startingSpell: null,
      roughPenalty: true,
      seaBonus: 1.0,
      scoutBonus: 0,
      specialBuilding: 'statue',
      units: ['peasant', 'archer', 'pikeman', 'swordsman', 'cavalry', 'paladin'],
      dwellings: {
        dwell_1: { id: 'dwell_1', tier: 1, unit: 'peasant', name: 'Соломенная хижина', cost: { gold: 200 }, req: ['castle'], rect: [36, 232, 92, 68] },
        dwell_2: { id: 'dwell_2', tier: 2, unit: 'archer', name: 'Стрельбище', cost: { gold: 1000 }, req: ['castle', 'dwell_1'], rect: [152, 224, 104, 72] },
        dwell_3: { id: 'dwell_3', tier: 3, unit: 'pikeman', name: 'Кузница', cost: { gold: 1000, ore: 5 }, req: ['castle', 'dwell_1'], rect: [284, 218, 96, 76] },
        dwell_4: { id: 'dwell_4', tier: 4, unit: 'swordsman', name: 'Оружейная', cost: { gold: 2000, wood: 10, ore: 10 }, req: ['castle', 'dwell_2', 'dwell_3'], rect: [404, 206, 108, 84] },
        dwell_5: { id: 'dwell_5', tier: 5, unit: 'cavalry', name: 'Ристалище', cost: { gold: 3000, wood: 20 }, req: ['castle', 'dwell_4'], rect: [64, 134, 136, 78] },
        dwell_6: { id: 'dwell_6', tier: 6, unit: 'paladin', name: 'Собор', cost: { gold: 5000, wood: 20, crystal: 20 }, req: ['castle', 'dwell_5', 'tavern'], rect: [446, 82, 148, 114] }
      },
      desc: 'Замки людей на плодородных холмах. Быстрая застройка без редких ресурсов до пятого уровня и крепкая броня.'
    },
    barbarian: {
      id: 'barbarian',
      name: 'Варвар',
      townType: 'Равнина',
      rulerName: 'Лорд Слейер',
      rulerShort: 'Слейер',
      nativeTerrain: 'dirt',
      startStats: { atk: 2, def: 1, power: 1, knowledge: 1 },
      levelWeights: { atk: 55, def: 35, power: 5, knowledge: 5 },
      startsWithSpellbook: false,
      startingSpell: null,
      roughPenalty: false,
      seaBonus: 1.0,
      scoutBonus: 0,
      specialBuilding: 'statue',
      units: ['goblin', 'orc', 'wolf', 'ogre', 'troll', 'cyclops'],
      dwellings: {
        dwell_1: { id: 'dwell_1', tier: 1, unit: 'goblin', name: 'Шалаш', cost: { gold: 300 }, req: ['castle'], rect: [38, 236, 88, 64] },
        dwell_2: { id: 'dwell_2', tier: 2, unit: 'orc', name: 'Башня лучников', cost: { gold: 800, wood: 5 }, req: ['castle', 'dwell_1'], rect: [148, 212, 92, 84] },
        dwell_3: { id: 'dwell_3', tier: 3, unit: 'wolf', name: 'Волчье логово', cost: { gold: 1000 }, req: ['castle', 'dwell_1'], rect: [268, 228, 108, 68] },
        dwell_4: { id: 'dwell_4', tier: 4, unit: 'ogre', name: 'Глинобитный дом', cost: { gold: 2000, wood: 10, ore: 10 }, req: ['castle', 'dwell_2', 'dwell_3'], rect: [398, 210, 112, 80] },
        dwell_5: { id: 'dwell_5', tier: 5, unit: 'troll', name: 'Мост троллей', cost: { gold: 4000, ore: 20 }, req: ['castle', 'dwell_4'], rect: [56, 138, 144, 72] },
        dwell_6: { id: 'dwell_6', tier: 6, unit: 'cyclops', name: 'Пирамида', cost: { gold: 6000, ore: 20, crystal: 20 }, req: ['castle', 'dwell_5'], rect: [452, 96, 142, 104] }
      },
      desc: 'Твердыни кочевых племён. Герои Варвара проходят болота, снега и пески без потери скорости.'
    },
    sorceress: {
      id: 'sorceress',
      name: 'Волшебница',
      townType: 'Лес',
      rulerName: 'Королева Ламанда',
      rulerShort: 'Ламанда',
      nativeTerrain: 'grass',
      startStats: { atk: 0, def: 0, power: 2, knowledge: 3 },
      levelWeights: { atk: 10, def: 10, power: 30, knowledge: 50 },
      startsWithSpellbook: true,
      startingSpell: 'bless',
      roughPenalty: true,
      seaBonus: 2.0,
      scoutBonus: 0,
      specialBuilding: 'statue',
      units: ['sprite', 'dwarf', 'elf', 'druid', 'unicorn', 'phoenix'],
      dwellings: {
        dwell_1: { id: 'dwell_1', tier: 1, unit: 'sprite', name: 'Домик на дереве', cost: { gold: 500, wood: 5 }, req: ['castle'], rect: [34, 198, 96, 98] },
        dwell_2: { id: 'dwell_2', tier: 2, unit: 'dwarf', name: 'Коттедж', cost: { gold: 1000, wood: 5 }, req: ['castle', 'dwell_1'], rect: [150, 226, 96, 70] },
        dwell_3: { id: 'dwell_3', tier: 3, unit: 'elf', name: 'Мишень', cost: { gold: 1500 }, req: ['castle', 'dwell_1'], rect: [270, 222, 104, 74] },
        dwell_4: { id: 'dwell_4', tier: 4, unit: 'druid', name: 'Каменный круг', cost: { gold: 1500, ore: 10 }, req: ['castle', 'dwell_3', 'mage_guild_1'], rect: [396, 204, 114, 86] },
        dwell_5: { id: 'dwell_5', tier: 5, unit: 'unicorn', name: 'Огороженный луг', cost: { gold: 3000, wood: 10, gems: 10 }, req: ['castle', 'dwell_2', 'dwell_4'], rect: [68, 132, 132, 76] },
        dwell_6: { id: 'dwell_6', tier: 6, unit: 'phoenix', name: 'Красная башня', cost: { gold: 4000, ore: 10, mercury: 20 }, req: ['castle', 'dwell_5'], rect: [458, 76, 134, 120] }
      },
      desc: 'Лесные заповедники у горных озёр. Быстрые стрелки, летуны и корабли с двойным ходом по морю.'
    },
    warlock: {
      id: 'warlock',
      name: 'Чернокнижник',
      townType: 'Подземелье',
      rulerName: 'Лорд Аламар',
      rulerShort: 'Аламар',
      nativeTerrain: 'lava',
      startStats: { atk: 0, def: 0, power: 3, knowledge: 2 },
      levelWeights: { atk: 10, def: 10, power: 50, knowledge: 30 },
      startsWithSpellbook: true,
      startingSpell: 'curse',
      roughPenalty: true,
      seaBonus: 1.0,
      scoutBonus: 1,
      specialBuilding: 'dungeon',
      units: ['centaur', 'gargoyle', 'griffin', 'minotaur', 'hydra', 'dragon'],
      dwellings: {
        dwell_1: { id: 'dwell_1', tier: 1, unit: 'centaur', name: 'Пещера', cost: { gold: 500 }, req: ['castle'], rect: [36, 230, 94, 68] },
        dwell_2: { id: 'dwell_2', tier: 2, unit: 'gargoyle', name: 'Склеп', cost: { gold: 1000, ore: 10 }, req: ['castle', 'dwell_1'], rect: [152, 218, 98, 78] },
        dwell_3: { id: 'dwell_3', tier: 3, unit: 'griffin', name: 'Гнездо', cost: { gold: 2000 }, req: ['castle', 'dwell_2'], rect: [274, 206, 102, 88] },
        dwell_4: { id: 'dwell_4', tier: 4, unit: 'minotaur', name: 'Лабиринт', cost: { gold: 3000, gems: 10 }, req: ['castle', 'dwell_3'], rect: [398, 208, 114, 84] },
        dwell_5: { id: 'dwell_5', tier: 5, unit: 'hydra', name: 'Болото', cost: { gold: 4000, sulfur: 10 }, req: ['castle', 'dwell_4'], rect: [60, 140, 140, 72] },
        dwell_6: { id: 'dwell_6', tier: 6, unit: 'dragon', name: 'Чёрная башня', cost: { gold: 15000, ore: 30, sulfur: 20 }, req: ['castle', 'dwell_5', 'mage_guild_1'], rect: [452, 68, 144, 128] }
      },
      desc: 'Базальтовые залы с лавовыми реками. Разрушительная магия, три вида летунов и неуязвимые Драконы.'
    }
  };

  const COMMON_BUILDINGS = {
    castle: {
      id: 'castle',
      name: 'Замок',
      cost: { gold: 5000, wood: 20, ore: 20 },
      req: [],
      rect: [228, 52, 184, 132],
      desc: 'Увеличивает суточный доход с 250 до 1000 золотых, открывает постройку всех зданий и возводит стены со стрелковой башней.'
    },
    tavern: {
      id: 'tavern',
      name: 'Таверна',
      cost: { gold: 500, wood: 5 },
      req: ['castle'],
      rect: [528, 224, 92, 72],
      desc: 'Позволяет нанимать героев за 2500 золотых, слушать слухи и повышает боевой дух защитников замка на +1.'
    },
    well: {
      id: 'well',
      name: 'Колодец',
      cost: { gold: 500 },
      req: ['castle'],
      rect: [296, 304, 56, 48],
      desc: 'Увеличивает еженедельный прирост всех шести жилищ существ в этом замке на +2.'
    },
    thieves_guild: {
      id: 'thieves_guild',
      name: 'Гильдия воров',
      cost: { gold: 750, wood: 5 },
      req: ['castle'],
      rect: [18, 304, 88, 52],
      desc: 'Собирает разведданные о казне, замках, лучших полководцах и сильнейших чудовищах соперников.'
    },
    shipyard: {
      id: 'shipyard',
      name: 'Верфь',
      cost: { gold: 2000, wood: 20 },
      req: ['castle'],
      coastalOnly: true,
      rect: [522, 302, 102, 54],
      desc: 'Строит парусные корабли на прибрежной воде по цене 1000 золотых и 10 дерева.'
    },
    statue: {
      id: 'statue',
      name: 'Статуя',
      cost: { gold: 1250, ore: 5 },
      req: ['castle'],
      factions: ['knight', 'barbarian', 'sorceress'],
      rect: [192, 300, 64, 56],
      desc: 'Величественный монумент правителя. Приносит в казну дополнительно 250 золотых каждый день.'
    },
    dungeon: {
      id: 'dungeon',
      name: 'Подземелье',
      cost: { gold: 3000, wood: 5, ore: 10 },
      req: ['castle'],
      factions: ['warlock'],
      rect: [184, 298, 84, 58],
      desc: 'Тёмные казематы Чернокнижника. Приносят в казну дополнительно 500 золотых каждый день.'
    },
    mage_guild_1: {
      id: 'mage_guild_1',
      name: 'Гильдия магов 1 эт.',
      guildLevel: 1,
      cost: { gold: 2000, wood: 5, ore: 5 },
      req: ['castle'],
      rect: [392, 92, 54, 102],
      desc: 'Открывает три заклинания первого круга и позволяет героям купить Книгу заклинаний за 500 золотых.'
    },
    mage_guild_2: {
      id: 'mage_guild_2',
      name: 'Гильдия магов 2 эт.',
      guildLevel: 2,
      cost: { gold: 1000, wood: 5, ore: 5, mercury: 4, sulfur: 4, crystal: 4, gems: 4 },
      req: ['mage_guild_1'],
      rect: [392, 78, 54, 116],
      desc: 'Добавляет три заклинания второго круга и пополняет заряды известных чар у гостящих героев.'
    },
    mage_guild_3: {
      id: 'mage_guild_3',
      name: 'Гильдия магов 3 эт.',
      guildLevel: 3,
      cost: { gold: 1000, wood: 5, ore: 5, mercury: 6, sulfur: 6, crystal: 6, gems: 6 },
      req: ['mage_guild_2'],
      rect: [392, 64, 54, 130],
      desc: 'Добавляет два могущественных заклинания третьего круга.'
    },
    mage_guild_4: {
      id: 'mage_guild_4',
      name: 'Гильдия магов 4 эт.',
      guildLevel: 4,
      cost: { gold: 1000, wood: 5, ore: 5, mercury: 8, sulfur: 8, crystal: 8, gems: 8 },
      req: ['mage_guild_3'],
      rect: [392, 48, 54, 146],
      desc: 'Вершина магической башни. Открывает два высших заклинания четвёртого круга.'
    }
  };

  function getTownBuildingDef(factionId, buildingId) {
    const f = FACTIONS[factionId];
    if (f && f.dwellings[buildingId]) return f.dwellings[buildingId];
    return COMMON_BUILDINGS[buildingId] || null;
  }

  function listTownBuildings(factionId, coastal) {
    const f = FACTIONS[factionId];
    if (!f) return [];
    const list = [
      COMMON_BUILDINGS.castle,
      COMMON_BUILDINGS.tavern,
      COMMON_BUILDINGS.well,
      COMMON_BUILDINGS.thieves_guild,
      COMMON_BUILDINGS[f.specialBuilding],
      COMMON_BUILDINGS.mage_guild_1,
      COMMON_BUILDINGS.mage_guild_2,
      COMMON_BUILDINGS.mage_guild_3,
      COMMON_BUILDINGS.mage_guild_4
    ];
    if (coastal) list.push(COMMON_BUILDINGS.shipyard);
    for (let t = 1; t <= 6; t++) {
      list.push(f.dwellings['dwell_' + t]);
    }
    return list;
  }

  function townMageGuildLevel(town) {
    const b = town && town.buildings ? town.buildings : {};
    if (b.mage_guild_4) return 4;
    if (b.mage_guild_3) return 3;
    if (b.mage_guild_2) return 2;
    if (b.mage_guild_1) return 1;
    return 0;
  }

  function canBuildInTown(town, buildingId, resources) {
    if (!town) return { ok: false, reason: 'no_town' };
    if (town.builtToday) return { ok: false, reason: 'built_today' };
    const b = town.buildings || {};
    if (b[buildingId]) return { ok: false, reason: 'already_built' };
    const def = getTownBuildingDef(town.faction, buildingId);
    if (!def) return { ok: false, reason: 'unknown_building' };
    if (def.coastalOnly && !town.coastal) return { ok: false, reason: 'not_coastal' };
    if (def.factions && !def.factions.includes(town.faction)) return { ok: false, reason: 'wrong_faction' };
    for (const reqId of def.req || []) {
      if (!b[reqId]) return { ok: false, reason: 'missing_req', req: reqId };
    }
    if (resources && !H.canAfford(resources, def.cost)) {
      return { ok: false, reason: 'cannot_afford' };
    }
    return { ok: true, def };
  }

  function townDailyIncome(town) {
    if (!town) return 0;
    const b = town.buildings || {};
    let gold = b.castle ? 1000 : 250;
    if (b.statue) gold += 250;
    if (b.dungeon) gold += 500;
    return gold;
  }

  function townWeeklyGrowth(town, tier) {
    const f = FACTIONS[town.faction];
    if (!f) return 0;
    const dw = f.dwellings['dwell_' + tier];
    if (!dw || !town.buildings || !town.buildings[dw.id]) return 0;
    const unit = H.UNITS[dw.unit];
    if (!unit) return 0;
    const wellBonus = town.buildings.well ? 2 : 0;
    return unit.growth + wellBonus;
  }

  function rollLevelUpStat(factionId, rng) {
    const f = FACTIONS[factionId] || FACTIONS.knight;
    const w = f.levelWeights;
    const r = (rng ? rng.next() : Math.random()) * 100;
    if (r < w.atk) return 'atk';
    if (r < w.atk + w.def) return 'def';
    if (r < w.atk + w.def + w.power) return 'power';
    return 'knowledge';
  }

  Object.assign(H, {
    FACTION_ORDER,
    FACTIONS,
    COMMON_BUILDINGS,
    getTownBuildingDef,
    listTownBuildings,
    townMageGuildLevel,
    canBuildInTown,
    townDailyIncome,
    townWeeklyGrowth,
    rollLevelUpStat
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
