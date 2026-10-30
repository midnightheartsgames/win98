(function (H) {
  'use strict';
  const RES = Object.fromEntries(H.RESOURCES);
  const b = (id, name, cost, needs, about, extra) => Object.assign({ id, name, cost, needs, about }, extra || {});
  const share = (rare, n) => Object.fromEntries(rare.map((r, i) => [r, Math.floor(n / rare.length) + (i < n % rare.length ? 1 : 0)]));

  H.FACTIONS = {
    league: {
      name: 'Лига', full: 'Лига Семи Рек', formation: 0.3, rare: ['salt', 'sulfur'], store: 'salt', schools: ['yasna', 'mera'],
      ai: ['dwell3', 'hall2', 'dwell4', 'market', 'guild1', 'dwell5', 'fort2', 'hall3', 'dwell1u', 'dwell2u', 'store', 'special3', 'dwell6', 'guild2', 'dwell3u', 'dwell4u', 'special2', 'dwell7', 'dwell5u', 'guild3', 'fort3', 'dwell6u', 'special4', 'guild4', 'dwell7u', 'hall4', 'guild5'],
      units: [['militia', 'pikeman', 'shieldbearer'], ['crossbow', 'heavycrossbow', 'skirmisher'], ['ringer', 'alarmist', 'herald'], ['plated', 'halberdier', 'cityguard'], ['aeronaut', 'bomber', 'spotter'], ['horseguard', 'palaceknight', 'cuirassier'], ['bombard', 'mortar', 'culverin']]
    },
    barrows: {
      name: 'Курганы', full: 'Курганы степи Ак-Туз', lament: { atk: 1, max: 3 }, rare: ['salt'], store: 'salt', schools: ['tlen', 'glub'],
      ai: ['dwell3', 'hall2', 'dwell4', 'market', 'guild1', 'dwell5', 'fort2', 'hall3', 'dwell1u', 'dwell2u', 'store', 'special3', 'dwell6', 'guild2', 'dwell3u', 'dwell4u', 'dwell7', 'dwell5u', 'guild3', 'fort3', 'dwell6u', 'special2', 'special4', 'guild4', 'dwell7u', 'hall4', 'guild5'],
      units: [['shade', 'mourner', 'dustguard'], ['horsebow', 'steppearcher', 'lasso'], ['stonewoman', 'kinidol', 'speakingstone'], ['eaglespirit', 'stormeagle', 'soulcatcher'], ['saltnoyon', 'shamannoyon', 'thousander'], ['bonebull', 'thunderbull', 'greybull'], ['stonekhan', 'kurgankhan', 'stormkhan']]
    }
  };

  const TREES = {
    league: {
      dwellings: [
        ['Ополченский двор', 'Оружейный двор', { gold: 500, wood: 5 }, { gold: 1000, wood: 5 }, []],
        ['Стрелковый тир', 'Большой тир', { gold: 1000, wood: 5, ore: 5 }, { gold: 1500, wood: 5 }, ['dwell1']],
        ['Звонница', 'Соборная звонница', { gold: 1500, ore: 5 }, { gold: 2000, ore: 5, salt: 2 }, ['dwell1']],
        ['Латный двор', 'Рыцарский двор', { gold: 2500, ore: 10 }, { gold: 3000, wood: 5, ore: 5, salt: 3 }, ['dwell2', 'smith']],
        ['Причальная мачта', 'Воздушная пристань', { gold: 4000, wood: 10, sulfur: 4 }, { gold: 5000, ore: 5, sulfur: 5 }, ['dwell3', 'guild1']],
        ['Манеж', 'Большой манеж', { gold: 6000, wood: 10, ore: 10, salt: 6 }, { gold: 7000, ore: 10, salt: 8 }, ['dwell4', 'market']],
        ['Литейная яма', 'Пушечный двор', { gold: 10000, wood: 10, ore: 10, salt: 5, sulfur: 10 }, { gold: 15000, ore: 10, sulfur: 10 }, ['dwell6', 'special3']]
      ],
      specials: [
        ['Ратуша контрактов', { gold: 2500, wood: 5 }, ['hall2'], 'Каждую неделю три контракта: наём отряда, награда за врага, поставка ресурса'],
        ['Колокольня', { gold: 1500, ore: 5 }, ['dwell3'], '+2 звонаря в неделю, защитникам города +1 мораль', { growth: { 3: 2 } }],
        ['Пороховой двор', { gold: 2000, wood: 5, ore: 5 }, ['smith'], '+1 сера в день. Без него не построить Литейную яму', { income: { sulfur: 1 } }],
        ['Торговая палата', { gold: 2000, wood: 5, salt: 2 }, ['market', 'hall2'], 'Курс рынка на шаг лучше', { market: 1 }]
      ],
      altar: 'Золотой колокол: +3000 золота в день, всем героям +1 мораль. Строится, когда в город привезли Сердце Восьмой луны'
    },
    barrows: {
      dwellings: [
        ['Погост теней', 'Погост предков', { gold: 500, wood: 5 }, { gold: 1000, wood: 5 }, []],
        ['Конная стоянка', 'Ханская стоянка', { gold: 1000, wood: 5, ore: 5 }, { gold: 1500, wood: 5 }, ['dwell1']],
        ['Каменная гряда', 'Святая гряда', { gold: 1500, ore: 5 }, { gold: 2000, ore: 5, salt: 2 }, ['dwell1']],
        ['Гнездо беркутов', 'Скала беркутов', { gold: 2500, ore: 10 }, { gold: 3000, wood: 5, ore: 5, salt: 3 }, ['dwell2', 'fort1']],
        ['Соляные усыпальницы', 'Ханские усыпальницы', { gold: 4000, wood: 10, salt: 4 }, { gold: 5000, ore: 5, salt: 5 }, ['dwell3', 'guild1']],
        ['Костяной загон', 'Громовой загон', { gold: 6000, wood: 10, ore: 10, salt: 6 }, { gold: 7000, ore: 10, salt: 8 }, ['dwell4', 'special3']],
        ['Ханский холм', 'Холм семи ханов', { gold: 10000, wood: 10, ore: 10, salt: 15 }, { gold: 15000, ore: 10, salt: 10 }, ['dwell5', 'dwell6']]
      ],
      specials: [
        ['Курган', { gold: 2000, ore: 5 }, [], 'Тени павших уходят в курган, там их поднимают за половину цены'],
        ['Камень-предок', { gold: 1500, ore: 10 }, ['fort1'], 'Гарнизону +3 Стойкости в бою за город'],
        ['Конный выгон', { gold: 1000, wood: 10 }, ['dwell2'], '+3 конных лучника в неделю', { growth: { 2: 3 } }],
        ['Юрта шаманов', { gold: 1500, wood: 5, salt: 2 }, ['guild1'], 'Ещё одно заклинание Тлени и Глуби на каждом круге гильдии', { guildPlus: ['tlen', 'glub'] }]
      ],
      altar: 'Великий курган: в курган уходят три четверти павших, павший герой через 3 дня встаёт в этом городе. Строится, когда в город привезли Сердце Восьмой луны'
    }
  };

  const GIFTS = {
    league: {
      name: 'Гильдейское право',
      talents: {
        6: [['league-1', 'Вербовщик', 'Наём по контрактам дешевле на 25 %'], ['league-2', 'Пошлина', '+5 % золота с каждого города с рынком']],
        12: [['league-3', 'Сомкнуть ряды', 'Удар Строя 45 %'], ['league-4', 'Стена щитов', 'Отряд, рядом с которым стоит свой, получает на 15 % меньше урона от стрел']],
        18: [['league-5', 'Порох', 'Бомбарды и машины +1 выстрел и +20 % урона'], ['league-6', 'Ополчение', 'Прирост 1–2 уровней +25 % во всех городах']]
      },
      high: { id: 'league-7', name: 'Великий набат', order: 'nabat', needs: ['leadership', 'machines'], about: 'Раз за бой все свои отряды +40 готовности и +2 морали на 2 раунда' }
    },
    barrows: {
      name: 'Голос предков',
      talents: {
        6: [['barrows-1', 'Тризна', 'В курган уходит 55 % павших'], ['barrows-2', 'Ветер степи', '+3 шага в день по степи и солончаку']],
        12: [['barrows-3', 'Неутешные', 'Плач даёт ещё +10 готовности'], ['barrows-4', 'Соль на ранах', 'Свои получают на 25 % меньше урона от Жари и Ясны']],
        18: [['barrows-5', 'Курганная рать', 'Подъём дешевле на 25 %, недельный предел +50 %'], ['barrows-6', 'Последний удар', 'Гибнущий отряд бьёт убийцу на 50 % своего урона']]
      },
      high: { id: 'barrows-7', name: 'Великий курган', order: 'kurgan', needs: ['tlen', 'leadership'], about: 'Раз за бой встаёт погибший свой отряд с половиной существ' }
    }
  };

  const common = f => [
    b('hall1', 'Староста', {}, [], 'Доход 500 золота в день', { income: { gold: 500 } }),
    b('hall2', 'Управа', { gold: 2500 }, ['hall1', 'tavern'], 'Доход 1000 золота в день', { income: { gold: 500 } }),
    b('hall3', 'Ратуша', { gold: 5000 }, ['hall2', 'market', 'guild1'], 'Доход 2000 золота в день', { income: { gold: 1000 } }),
    b('hall4', 'Столица', { gold: 10000, wood: 10, ore: 10 }, ['hall3', 'fort2'], 'Доход 3500 золота в день. Столица у игрока одна', { income: { gold: 1500 }, capital: true }),
    b('fort1', 'Частокол', { gold: 1500, wood: 5 }, [], 'Частокол и ворота: город можно оборонять', { fort: 1 }),
    b('fort2', 'Стена', { gold: 3000, ore: 10 }, ['fort1'], 'Каменная стена. Прирост существ +25 %', { fort: 2, growthPct: 25 }),
    b('fort3', 'Крепость', { gold: 5000, wood: 5, ore: 10 }, ['fort2', 'hall2'], 'Башни и ров. Прирост существ +50 %', { fort: 3, growthPct: 25 }),
    b('tavern', 'Таверна', { gold: 500, wood: 5 }, [], 'Наём героев за ' + H.TOWN.heroPrice + ' золота, слух недели', { tavern: true }),
    b('market', 'Рынок', { gold: 500, wood: 5 }, [], 'Обмен ресурсов. Чем больше у вас рынков, тем лучше курс', { market: 1 }),
    b('store', 'Склад', { gold: 2000, ore: 5 }, ['market'], '+1 ' + RES[f.store].toLowerCase() + ' в день', { income: { [f.store]: 1 } }),
    b('smith', 'Кузня', { gold: 1000, ore: 5 }, [], 'Машины для боя: стреломёт, шатёр лекаря, телега'),
    b('guild1', 'Гильдия чар', { gold: 2000, wood: 5, ore: 5 }, [], 'Первый круг заклинаний: 4 полки', { guild: 1 }),
    b('guild2', 'Гильдия: второй круг', Object.assign({ gold: 1000, wood: 5, ore: 5 }, share(f.rare, 4)), ['guild1'], 'Второй круг заклинаний: 3 полки', { guild: 2 }),
    b('guild3', 'Гильдия: третий круг', Object.assign({ gold: 1000, wood: 5, ore: 5 }, share(f.rare, 6)), ['guild2'], 'Третий круг заклинаний: 3 полки', { guild: 3 }),
    b('guild4', 'Гильдия: четвёртый круг', Object.assign({ gold: 1000, wood: 5, ore: 5 }, share(f.rare, 8)), ['guild3'], 'Четвёртый круг: 2 полки, только школы народа', { guild: 4 }),
    b('guild5', 'Гильдия: пятый круг', { gold: 1000, wood: 5, ore: 5, moonsilver: 5 }, ['guild4'], 'Пятый круг: 1 полка, только школы народа', { guild: 5 }),
    b('caravan', 'Обозная станция', { gold: 2000, wood: 5, ore: 5 }, ['market'], 'Обозы везут существ из жилищ в города'),
    b('shipyard', 'Верфь', { gold: 2000, wood: 20 }, [], 'Корабли. Только в городе у воды', { water: true })
  ];

  for (const [id, f] of Object.entries(H.FACTIONS)) {
    const T = TREES[id];
    f.buildings = [
      ...common(f),
      ...T.dwellings.flatMap(([name, upName, cost, upCost, needs], i) => {
        const t = i + 1, [base, a, c] = f.units[i];
        return [
          b('dwell' + t, name, cost, needs, 'Наём: ' + H.UNITS[base].name, { dwelling: t }),
          b('dwell' + t + 'u', upName, upCost, ['dwell' + t], 'Ветвь на выбор: ' + H.UNITS[a].name + ' или ' + H.UNITS[c].name + '. Выбор навсегда для этого города', { upgrade: t })
        ];
      }),
      ...T.specials.map(([name, cost, needs, about, extra], i) => b('special' + (i + 1), name, cost, needs, about, extra)),
      b('altar', 'Лунный алтарь', { gold: 5000, moonsilver: 10 }, ['hall3'], T.altar, { heart: true })
    ];
    f.building = Object.fromEntries(f.buildings.map(x => [x.id, x]));
    f.gift = GIFTS[id];
  }

  H.CLASSES = {
    captain: { name: 'Капитан', faction: 'league', mage: false, spells: [], stats: { atk: 40, def: 35, power: 10, wis: 15 }, cards: { tactics: 8, offense: 10, defense: 10, archery: 7, leadership: 9, luck: 4, march: 6, scouting: 3, treasury: 4, learning: 3, sorcery: 1, machines: 7, yasna: 3, mera: 2, zhar: 1, glub: 1, rostan: 1, morok: 1, tlen: 1 } },
    magister: { name: 'Магистр', faction: 'league', mage: true, spells: ['balm', 'haste'], stats: { atk: 10, def: 15, power: 40, wis: 35 }, cards: { tactics: 3, offense: 2, defense: 3, archery: 3, leadership: 6, luck: 5, march: 5, scouting: 4, treasury: 8, learning: 10, sorcery: 11, machines: 3, yasna: 12, mera: 12, zhar: 3, glub: 3, rostan: 2, morok: 2, tlen: 1 } },
    noyon: { name: 'Нойон', faction: 'barrows', mage: false, spells: [], stats: { atk: 42, def: 33, power: 10, wis: 15 }, cards: { tactics: 7, offense: 11, defense: 9, archery: 8, leadership: 7, luck: 3, march: 9, scouting: 5, treasury: 2, learning: 3, sorcery: 1, machines: 3, tlen: 3, glub: 2, zhar: 1, rostan: 1, morok: 1, yasna: 1, mera: 1 } },
    shaman: { name: 'Шаман', faction: 'barrows', mage: true, spells: ['chill', 'hex'], stats: { atk: 10, def: 13, power: 42, wis: 35 }, cards: { tactics: 3, offense: 3, defense: 2, archery: 2, leadership: 8, luck: 7, march: 5, scouting: 5, treasury: 4, learning: 11, sorcery: 11, machines: 1, tlen: 12, glub: 12, rostan: 3, morok: 3, mera: 2, zhar: 1, yasna: 1 } }
  };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
