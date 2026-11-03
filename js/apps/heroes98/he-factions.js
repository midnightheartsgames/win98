(function (H) {
  'use strict';
  const RES = Object.fromEntries(H.RESOURCES);
  const b = (id, name, cost, needs, about, extra) => Object.assign({ id, name, cost, needs, about }, extra || {});
  const share = (rare, n) => Object.fromEntries(rare.map((r, i) => [r, Math.floor(n / rare.length) + (i < n % rare.length ? 1 : 0)]));

  H.FACTIONS = {
    league: {
      name: 'Лига', full: 'Лига Семи Рек', formation: 0.3, rare: ['salt', 'sulfur'], store: 'salt', schools: ['yasna', 'mera'], caravanMul: 0.5,
      ai: ['dwell3', 'hall2', 'dwell4', 'market', 'special1', 'guild1', 'dwell5', 'fort2', 'hall3', 'dwell1u', 'dwell2u', 'store', 'special3', 'dwell6', 'guild2', 'dwell3u', 'dwell4u', 'special2', 'dwell7', 'dwell5u', 'guild3', 'fort3', 'dwell6u', 'special4', 'guild4', 'dwell7u', 'hall4', 'guild5'],
      units: [['militia', 'pikeman', 'shieldbearer'], ['crossbow', 'heavycrossbow', 'skirmisher'], ['ringer', 'alarmist', 'herald'], ['plated', 'halberdier', 'cityguard'], ['aeronaut', 'bomber', 'spotter'], ['horseguard', 'palaceknight', 'cuirassier'], ['bombard', 'mortar', 'culverin']]
    },
    barrows: {
      name: 'Курганы', full: 'Курганы степи Ак-Туз', lament: { atk: 1, max: 3 }, rare: ['salt'], store: 'salt', schools: ['tlen', 'glub'],
      ai: ['dwell3', 'hall2', 'dwell4', 'special1', 'market', 'guild1', 'dwell5', 'fort2', 'hall3', 'dwell1u', 'smith', 'dwell2u', 'store', 'special3', 'barrow2', 'dwell6', 'guild2', 'dwell3u', 'dwell4u', 'dwell7', 'dwell5u', 'barrow3', 'guild3', 'fort3', 'dwell6u', 'special2', 'special4', 'guild4', 'dwell7u', 'hall4', 'guild5'],
      units: [['shade', 'mourner', 'dustguard'], ['horsebow', 'steppearcher', 'lasso'], ['stonewoman', 'kinidol', 'speakingstone'], ['eaglespirit', 'stormeagle', 'soulcatcher'], ['saltnoyon', 'shamannoyon', 'thousander'], ['bonebull', 'thunderbull', 'greybull'], ['stonekhan', 'kurgankhan', 'stormkhan']]
    },
    thicket: {
      name: 'Чаща', full: 'Заповедная Чаща', brush: true, rare: ['amber'], store: 'amber', schools: ['rostan', 'morok'],
      ai: ['dwell3', 'hall2', 'dwell4', 'special1', 'market', 'guild1', 'dwell5', 'fort2', 'hall3', 'dwell1u', 'smith', 'dwell2u', 'store', 'special3', 'dwell6', 'guild2', 'dwell3u', 'dwell4u', 'special2', 'dwell7', 'dwell5u', 'guild3', 'fort3', 'dwell6u', 'special4', 'guild4', 'dwell7u', 'hall4', 'guild5'],
      units: [['auka', 'mocker', 'wisp'], ['werewolf', 'elderwolf', 'greyturn'], ['bereginya', 'keeper', 'rusalka'], ['kikimora', 'bogwitch', 'spinner'], ['sirin', 'alkonost', 'gamayun'], ['leshy', 'borovik', 'warden'], ['zmey', 'threeheaded', 'firezmey']]
    },
    tide: {
      name: 'Прилив', full: 'Народ Прилива', tide: { up: 0.25, def: 0.25 }, rare: ['amber', 'salt'], store: 'amber', schools: ['glub', 'morok'],
      ai: ['dwell3', 'hall2', 'dwell4', 'special2', 'market', 'guild1', 'dwell5', 'fort2', 'hall3', 'dwell1u', 'smith', 'dwell2u', 'store', 'special4', 'dwell6', 'guild2', 'dwell3u', 'dwell4u', 'special3', 'dwell7', 'dwell5u', 'guild3', 'fort3', 'dwell6u', 'special1', 'guild4', 'dwell7u', 'hall4', 'guild5'],
      units: [['shellman', 'claw', 'shellback'], ['harpooner', 'whaler', 'netter'], ['jelly', 'deeplight', 'stinger'], ['seawitch', 'abyssinger', 'saltwitch'], ['rayrider', 'stormray', 'nightray'], ['turtlefort', 'turtleram', 'turtlebeacon'], ['kraken', 'ancientkraken', 'devourer']]
    },
    forge: {
      name: 'Горнила', full: 'Пепельные Горнила', heat: true, rare: ['sulfur', 'ore'], store: 'sulfur', schools: ['zhar', 'rostan'],
      ai: ['dwell3', 'special3', 'hall2', 'dwell4', 'market', 'dwell5', 'guild1', 'fort2', 'hall3', 'dwell1u', 'smith', 'dwell2u', 'store', 'special4', 'dwell6', 'guild2', 'dwell3u', 'dwell4u', 'special2', 'dwell7', 'dwell5u', 'guild3', 'fort3', 'dwell6u', 'special1', 'guild4', 'dwell7u', 'hall4', 'guild5'],
      units: [['apprentice', 'hammerer', 'stoker'], ['salamander', 'firelizard', 'bladelizard'], ['obsidianspider', 'glassblower', 'blackspider'], ['caster', 'mastercaster', 'temperer'], ['steamling', 'geyser', 'overheated'], ['slaggiant', 'obsidiangiant', 'slagthrower'], ['volcano', 'firemountain', 'sleepingvolcano']]
    },
    throne: {
      name: 'Престол', full: 'Лунный Престол', mirror: true, rare: ['moonsilver'], store: 'moonsilver', schools: ['yasna', 'morok'],
      ai: ['dwell3', 'hall2', 'dwell4', 'market', 'store', 'guild1', 'dwell5', 'fort2', 'hall3', 'special1', 'dwell1u', 'smith', 'dwell2u', 'special2', 'dwell6', 'guild2', 'dwell3u', 'dwell4u', 'special3', 'dwell7', 'dwell5u', 'guild3', 'fort3', 'dwell6u', 'special4', 'guild4', 'dwell7u', 'hall4', 'guild5'],
      units: [['legionary', 'standardbearer', 'mirrorlegion'], ['moonarcher', 'silverarcher', 'moonhunter'], ['mirrorguard', 'prismguard', 'mirrorswap'], ['moonmaiden', 'whitemaiden', 'silvermaiden'], ['deerrider', 'silverrider', 'deerhunter'], ['throneknight', 'oathkeeper', 'punisher'], ['shard', 'radiantshard', 'darkshard']]
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
        ['Ратуша контрактов', { gold: 2500, wood: 5 }, ['hall2'], 'Каждую неделю три контракта: наём отряда, награда за врага, поставка ресурса', { contracts: true }],
        ['Колокольня', { gold: 1500, ore: 5 }, ['dwell3'], '+2 звонаря в неделю, защитникам города +1 мораль', { growth: { 3: 2 }, siegeMorale: 1 }],
        ['Пороховой двор', { gold: 2000, wood: 5, ore: 5 }, ['smith'], '+1 сера в день. Без него не построить Литейную яму', { income: { sulfur: 1 } }],
        ['Торговая палата', { gold: 2000, wood: 5, salt: 2 }, ['market', 'hall2'], 'Курс рынка на шаг лучше. Каждую неделю три артефакта на продажу', { market: 1, shop: true }]
      ],
      altar: 'Золотой колокол: +3000 золота в день, всем героям +1 мораль. Строится, когда в город привезли Сердце Восьмой луны',
      altarFx: { income: { gold: 3000 }, altarMorale: 1 }
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
        ['Курган', { gold: 2000, ore: 5 }, [], 'Тени павших уходят в курган, там их поднимают за половину цены. В неделю можно поднять существ на 4000 золота ценности', { barrow: 1 }],
        ['Камень-предок', { gold: 1500, ore: 10 }, ['fort1'], 'Гарнизону +3 Стойкости в бою за город', { siegeDef: 3 }],
        ['Конный выгон', { gold: 1000, wood: 10 }, ['dwell2'], '+3 конных лучника в неделю', { growth: { 2: 3 } }],
        ['Юрта шаманов', { gold: 1500, wood: 5, salt: 2 }, ['guild1'], 'Ещё одно заклинание Тлени и Глуби на каждом круге гильдии', { guildPlus: ['tlen', 'glub'] }]
      ],
      altar: 'Великий курган: в курган уходят три четверти павших, павший герой через 3 дня встаёт в этом городе. Строится, когда в город привезли Сердце Восьмой луны',
      altarFx: { heroRise: 3, barrowShare: 0.75 },
      extras: [
        ['barrow2', 'Большой курган', { gold: 3000, ore: 10, salt: 2 }, ['special1', 'hall2'], 'Вторая ступень кургана: в неделю поднимают на 8000 золота ценности', { barrow: 2, step: true }],
        ['barrow3', 'Ханский курган', { gold: 5000, ore: 10, salt: 5 }, ['barrow2', 'hall3'], 'Третья ступень кургана: в неделю поднимают на 14000 золота ценности', { barrow: 3, step: true }]
      ]
    },
    thicket: {
      dwellings: [
        ['Моховая кочка', 'Говорливая кочка', { gold: 500, wood: 5 }, { gold: 1000, wood: 5 }, []],
        ['Волчья яма', 'Логово оборотней', { gold: 1000, wood: 5, ore: 5 }, { gold: 1500, wood: 5 }, ['dwell1']],
        ['Родник берегинь', 'Святой родник', { gold: 1500, ore: 5 }, { gold: 2000, ore: 5, amber: 2 }, ['dwell1']],
        ['Кикиморина топь', 'Большая топь', { gold: 2500, ore: 10 }, { gold: 3000, wood: 5, ore: 5, amber: 3 }, ['dwell2', 'fort1']],
        ['Гнездовье сиринов', 'Вещее гнездовье', { gold: 4000, wood: 10, amber: 4 }, { gold: 5000, ore: 5, amber: 5 }, ['dwell3', 'guild1']],
        ['Старый бор', 'Заповедный бор', { gold: 6000, wood: 10, ore: 10, amber: 6 }, { gold: 7000, ore: 10, amber: 8 }, ['dwell4', 'market']],
        ['Змеево озеро', 'Змеиная глубь', { gold: 10000, wood: 10, ore: 10, amber: 15 }, { gold: 15000, ore: 10, amber: 10 }, ['dwell5', 'dwell6']]
      ],
      specials: [
        ['Ведьмино кольцо', { gold: 2000, wood: 5 }, [], 'Герой Чащи в этом городе раз в день переходит к любому своему кольцу за половину очков хода', { ring: true }],
        ['Священная берёза', { gold: 1500, wood: 10 }, ['fort1'], 'Защитникам города +1 удача, гарнизону +10 % здоровья', { siegeLuck: 1, siegeHp: 0.1 }],
        ['Медовый двор', { gold: 1500, wood: 5 }, ['dwell1'], '+250 золота в день и +4 аука в неделю', { income: { gold: 250 }, growth: { 1: 4 } }],
        ['Капище', { gold: 1500, wood: 5, amber: 2 }, ['guild1'], 'Ещё одно заклинание Ростани и Морока на каждом круге гильдии', { guildPlus: ['rostan', 'morok'] }]
      ],
      altar: 'Мировое древо: героям игрока +2 шага в день, лес на карте для них стоит как дорога. Строится, когда в город привезли Сердце Восьмой луны',
      altarFx: { worldTree: true }
    },
    tide: {
      dwellings: [
        ['Панцирный причал', 'Большой причал', { gold: 500, wood: 5 }, { gold: 1000, wood: 5 }, []],
        ['Гарпунная вышка', 'Китобойный двор', { gold: 1000, wood: 5, ore: 5 }, { gold: 1500, wood: 5 }, ['dwell1']],
        ['Садок медуз', 'Светлый садок', { gold: 1500, ore: 5 }, { gold: 2000, ore: 5, amber: 2 }, ['dwell1']],
        ['Грот ведьм', 'Глубокий грот', { gold: 2500, ore: 10 }, { gold: 3000, wood: 5, ore: 5, amber: 3 }, ['dwell2', 'fort1']],
        ['Загон скатов', 'Грозовой загон', { gold: 4000, wood: 10, amber: 4 }, { gold: 5000, ore: 5, amber: 5 }, ['dwell3', 'guild1']],
        ['Черепашья отмель', 'Черепашья верфь', { gold: 6000, wood: 10, ore: 10, salt: 6 }, { gold: 7000, ore: 10, salt: 8 }, ['dwell4', 'market']],
        ['Кракенова впадина', 'Чёрная впадина', { gold: 10000, wood: 10, ore: 10, salt: 8, amber: 8 }, { gold: 15000, ore: 10, amber: 10 }, ['dwell5', 'dwell6']]
      ],
      specials: [
        ['Гавань', { gold: 1500, wood: 10 }, [], 'Корабли игрока +4 шага в день', { harbor: true }],
        ['Коралловый сад', { gold: 2000, ore: 5 }, ['dwell1'], '+3 прироста существ 1–3 уровней', { growth: { 1: 3, 2: 3, 3: 3 } }],
        ['Маяк', { gold: 1500, wood: 5, ore: 5 }, ['fort1'], 'Обзор 12 клеток вокруг города, на карте видны все корабли', { beacon: 12 }],
        ['Солеварня', { gold: 2000, wood: 5, ore: 5 }, ['market'], '+1 соль в день', { income: { salt: 1 } }]
      ],
      altar: 'Колыбель: вода для героев Прилива стоит как дорога, +2 соли и +2 янтаря в день. Строится, когда в город привезли Сердце Восьмой луны',
      altarFx: { cradle: true, income: { salt: 2, amber: 2 } }
    },
    forge: {
      dwellings: [
        ['Подмастерская', 'Молотовая', { gold: 500, ore: 5 }, { gold: 1000, ore: 5 }, []],
        ['Саламандровый ров', 'Огневая яма', { gold: 1000, ore: 5 }, { gold: 1500, ore: 5 }, ['dwell1']],
        ['Стеклянная пещера', 'Обсидиановое гнездо', { gold: 1500, ore: 5 }, { gold: 2000, ore: 5, sulfur: 2 }, ['dwell1']],
        ['Литейный цех', 'Большой цех', { gold: 2500, ore: 15 }, { gold: 3000, wood: 5, ore: 10, sulfur: 3 }, ['dwell2', 'fort1']],
        ['Паровая скважина', 'Кипящий ключ', { gold: 4000, ore: 10, sulfur: 4 }, { gold: 5000, ore: 10, sulfur: 5 }, ['dwell3', 'guild1']],
        ['Шлаковая гора', 'Обсидиановый склон', { gold: 6000, wood: 10, ore: 15, sulfur: 6 }, { gold: 7000, ore: 15, sulfur: 8 }, ['dwell4', 'market']],
        ['Жерло', 'Кратер Старого Горна', { gold: 10000, wood: 10, ore: 15, sulfur: 10 }, { gold: 15000, ore: 15, sulfur: 10 }, ['dwell5', 'dwell6']]
      ],
      specials: [
        ['Великий горн', { gold: 2000, ore: 10 }, ['smith'], 'Перековка: два артефакта одного места в один более редкий того же места', { reforge: true }],
        ['Обсидиановые стены', { gold: 2000, ore: 10, sulfur: 2 }, ['fort1'], 'Стены вдвое крепче, башни +50 % урона', { obsidian: true }],
        ['Литейная', { gold: 1500, ore: 10 }, ['dwell1'], 'Машины вдвое дешевле, +1 руда в день', { foundry: true, income: { ore: 1 } }],
        ['Пепельный алтарь', { gold: 1500, ore: 10, sulfur: 2 }, ['guild1'], 'Ещё одно заклинание Жари и Ростани на каждом круге гильдии', { guildPlus: ['zhar', 'rostan'] }]
      ],
      altar: 'Сердце вулкана: всем героям игрока +3 Натиска, отряды начинают бой с 1 Жаром. Строится, когда в город привезли Сердце Восьмой луны',
      altarFx: { volcano: true }
    },
    throne: {
      dwellings: [
        ['Казарма легиона', 'Знамённая казарма', { gold: 500, ore: 5 }, { gold: 1000, ore: 5 }, []],
        ['Лунный тир', 'Серебряный тир', { gold: 1000, wood: 5 }, { gold: 1500, wood: 5 }, ['dwell1']],
        ['Зеркальная мастерская', 'Призматическая мастерская', { gold: 1500, ore: 5 }, { gold: 2000, ore: 5, moonsilver: 2 }, ['dwell1']],
        ['Обитель дев', 'Лунная обитель', { gold: 2500, ore: 10 }, { gold: 3000, wood: 5, ore: 5, moonsilver: 3 }, ['dwell2', 'fort1']],
        ['Олений парк', 'Серебряный парк', { gold: 4000, wood: 10, moonsilver: 4 }, { gold: 5000, ore: 5, moonsilver: 5 }, ['dwell3', 'guild1']],
        ['Рыцарский зал', 'Зал клятвы', { gold: 6000, wood: 10, ore: 10, moonsilver: 6 }, { gold: 7000, ore: 10, moonsilver: 8 }, ['dwell4', 'market']],
        ['Купол осколка', 'Лунный купол', { gold: 10000, wood: 10, ore: 10, moonsilver: 15 }, { gold: 15000, ore: 10, moonsilver: 10 }, ['dwell5', 'dwell6']]
      ],
      specials: [
        ['Белый престол', { gold: 3000, ore: 5, moonsilver: 5 }, ['hall2'], 'Только в одном вашем городе. +500 золота в день, защитникам города +1 мораль', { income: { gold: 500 }, siegeMorale: 1, seat: true }],
        ['Зеркальная зала', { gold: 2000, ore: 5, moonsilver: 2 }, ['guild1'], 'Отражения героев игрока +10 % существ', { mirrorHall: true }],
        ['Конюшня оленей', { gold: 1500, wood: 10 }, ['dwell5'], '+2 всадника на лунных оленях в неделю', { growth: { 5: 2 } }],
        ['Белый храм', { gold: 1500, ore: 5, moonsilver: 2 }, ['guild1'], 'Ещё одно заклинание Ясны и Морока на каждом круге гильдии', { guildPlus: ['yasna', 'morok'] }]
      ],
      altar: 'Престол царей: все существа Престола +1 Натиск и +1 Стойкость, лунные дороги для героев игрока стоят 0,3 шага. Строится, когда в город привезли Сердце Восьмой луны',
      altarFx: { kings: true }
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
    },
    thicket: {
      name: 'Заповедь',
      talents: {
        6: [['thicket-1', 'Шёпот листвы', '+1 заросль, заросли можно ставить и на половине врага'], ['thicket-2', 'Тропа зверя', '+2 шага в день по лесу и болоту']],
        12: [['thicket-3', 'Колючие заросли', 'В начале раунда заросли ранят соседних врагов на 5 % здоровья'], ['thicket-4', 'Корни держат', 'Враг, который начинает ход рядом с зарослью, теряет 15 готовности']],
        18: [['thicket-5', 'Короткий путь', 'Переход по кольцам стоит четверть очков хода'], ['thicket-6', 'Лесная кровь', 'Свои рядом с зарослью восстанавливают 10 % за раунд']]
      },
      high: { id: 'thicket-7', name: 'Пробуждение леса', order: 'forest', needs: ['rostan', 'tactics'], about: 'Раз за бой все заросли становятся союзными древами на 3 раунда' }
    },
    tide: {
      name: 'Песнь глубин',
      talents: {
        6: [['tide-1', 'Течение', 'Вода стоит как дорога'], ['tide-2', 'Солёная кровь', 'Удары отрядов Прилива снимают 1 Стойкость, до −4']],
        12: [['tide-3', 'Высокая вода', 'Прилив даёт +35 %'], ['tide-4', 'Тихая вода', 'В отлив свои восстанавливают 10 %']],
        18: [['tide-5', 'Затопить', 'Раз за бой герой делает 5 клеток мелководьем, чужие на них −30 % инициативы'], ['tide-6', 'Морская торговля', '+1 соль и +1 янтарь в неделю за каждый свой приморский город']]
      },
      high: { id: 'tide-7', name: 'Девятый вал', order: 'wave', needs: ['glub', 'march'], about: 'Раз за бой волна отталкивает всех врагов на 2 клетки к их краю и снимает 30 готовности' }
    },
    forge: {
      name: 'Пламя горна',
      talents: {
        6: [['forge-1', 'Раскалённые клинки', 'Очко Жара даёт +15 % урона'], ['forge-2', 'Огнеупорность', 'Свои получают на 30 % меньше урона от огня']],
        12: [['forge-3', 'Выдержка', 'Перегрев только с 4 очков Жара'], ['forge-4', 'Шлак', 'Перегретый отряд в начале хода жжёт соседних врагов на 5 % их здоровья']],
        18: [['forge-5', 'Рука мастера', 'Перековка с шансом 25 % даёт реликвию'], ['forge-6', 'Серный дым', 'В начале боя вражеские стрелки −20 % урона на 2 раунда']]
      },
      high: { id: 'forge-7', name: 'Извержение', order: 'erupt', needs: ['zhar', 'offense'], about: 'Раз за бой огонь по всем врагам (20 × уровень героя), свои получают 3 Жара без перегрева на 2 раунда' }
    },
    throne: {
      name: 'Корона',
      talents: {
        6: [['throne-1', 'Двойное отражение', 'В начале боя два отражения'], ['throne-2', 'Наследник руин', 'Каждая ваша белая руина даёт +1 Лунное серебро в день']],
        12: [['throne-3', 'Холодный свет', 'Заклинания Ясны героя держатся на раунд дольше'], ['throne-4', 'Зеркальный щит', '20 % урона заклинаний по своим отрядам уходит в случайный вражеский отряд']],
        18: [['throne-5', 'Лунная гвардия', 'Отражения держатся 4 раунда, можно отражать 6 уровень'], ['throne-6', 'Белая гвардия', 'Прирост 5–7 уровней +15 %']]
      },
      high: { id: 'throne-7', name: 'Возвращение царей', order: 'kings', needs: ['yasna', 'morok'], about: 'Раз за бой на поле встают Лунные цари, один за каждые 6 уровней героя, и бьются 3 раунда' }
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
      ...(T.extras || []).map(([bid, name, cost, needs, about, extra]) => b(bid, name, cost, needs, about, extra)),
      b('altar', 'Лунный алтарь', { gold: 5000, moonsilver: 10 }, ['hall3'], T.altar, Object.assign({ heart: true }, T.altarFx))
    ];
    f.building = Object.fromEntries(f.buildings.map(x => [x.id, x]));
    f.gift = GIFTS[id];
  }

  H.CLASSES = {
    captain: { name: 'Капитан', faction: 'league', mage: false, spells: [], stats: { atk: 40, def: 35, power: 10, wis: 15 }, cards: { tactics: 8, offense: 10, defense: 10, archery: 7, leadership: 9, luck: 4, march: 6, scouting: 3, treasury: 4, learning: 3, sorcery: 1, machines: 7, yasna: 3, mera: 2, zhar: 1, glub: 1, rostan: 1, morok: 1, tlen: 1 } },
    magister: { name: 'Магистр', faction: 'league', mage: true, spells: ['balm', 'haste'], stats: { atk: 10, def: 15, power: 40, wis: 35 }, cards: { tactics: 3, offense: 2, defense: 3, archery: 3, leadership: 6, luck: 5, march: 5, scouting: 4, treasury: 8, learning: 10, sorcery: 11, machines: 3, yasna: 12, mera: 12, zhar: 3, glub: 3, rostan: 2, morok: 2, tlen: 1 } },
    noyon: { name: 'Нойон', faction: 'barrows', mage: false, spells: [], stats: { atk: 42, def: 33, power: 10, wis: 15 }, cards: { tactics: 7, offense: 11, defense: 9, archery: 8, leadership: 7, luck: 3, march: 9, scouting: 5, treasury: 2, learning: 3, sorcery: 1, machines: 3, tlen: 3, glub: 2, zhar: 1, rostan: 1, morok: 1, yasna: 1, mera: 1 } },
    shaman: { name: 'Шаман', faction: 'barrows', mage: true, spells: ['chill', 'hex'], stats: { atk: 10, def: 13, power: 42, wis: 35 }, cards: { tactics: 3, offense: 3, defense: 2, archery: 2, leadership: 8, luck: 7, march: 5, scouting: 5, treasury: 4, learning: 11, sorcery: 11, machines: 1, tlen: 12, glub: 12, rostan: 3, morok: 3, mera: 2, zhar: 1, yasna: 1 } },
    huntsman: { name: 'Ловчий', faction: 'thicket', mage: false, spells: [], stats: { atk: 38, def: 37, power: 10, wis: 15 }, cards: { tactics: 11, offense: 9, defense: 9, archery: 8, leadership: 5, luck: 6, march: 8, scouting: 8, treasury: 2, learning: 3, sorcery: 1, machines: 2, rostan: 4, morok: 2, tlen: 1, zhar: 1, glub: 1, yasna: 1, mera: 1 } },
    sage: { name: 'Ведун', faction: 'thicket', mage: true, spells: ['thorns', 'shadow'], stats: { atk: 10, def: 15, power: 38, wis: 37 }, cards: { tactics: 6, offense: 2, defense: 3, archery: 2, leadership: 5, luck: 8, march: 6, scouting: 6, treasury: 3, learning: 10, sorcery: 10, machines: 1, rostan: 12, morok: 12, glub: 3, mera: 2, tlen: 2, yasna: 1, zhar: 1 } },
    chief: { name: 'Вожак', faction: 'tide', mage: false, spells: [], stats: { atk: 40, def: 36, power: 10, wis: 14 }, cards: { tactics: 7, offense: 10, defense: 9, archery: 8, leadership: 7, luck: 5, march: 10, scouting: 6, treasury: 3, learning: 3, sorcery: 1, machines: 3, glub: 3, morok: 2, mera: 1, rostan: 1, tlen: 1, zhar: 1, yasna: 1 } },
    forgemaster: { name: 'Горновой', faction: 'forge', mage: false, spells: [], stats: { atk: 42, def: 38, power: 10, wis: 10 }, cards: { tactics: 6, offense: 12, defense: 9, archery: 5, leadership: 6, luck: 4, march: 6, scouting: 4, treasury: 5, learning: 3, sorcery: 1, machines: 8, zhar: 4, rostan: 2, glub: 1, morok: 1, mera: 1, tlen: 1, yasna: 1 } },
    flamekeeper: { name: 'Пламенник', faction: 'forge', mage: true, spells: ['spark', 'thorns'], stats: { atk: 12, def: 12, power: 40, wis: 36 }, cards: { tactics: 3, offense: 3, defense: 2, archery: 2, leadership: 4, luck: 5, march: 5, scouting: 4, treasury: 5, learning: 9, sorcery: 12, machines: 4, zhar: 12, rostan: 10, glub: 1, morok: 2, mera: 2, tlen: 2, yasna: 2 } },
    royalknight: { name: 'Рыцарь Престола', faction: 'throne', mage: false, spells: [], stats: { atk: 38, def: 42, power: 10, wis: 10 }, cards: { tactics: 8, offense: 9, defense: 12, archery: 6, leadership: 10, luck: 4, march: 7, scouting: 4, treasury: 4, learning: 3, sorcery: 1, machines: 3, yasna: 4, morok: 2, mera: 1, glub: 1, rostan: 1, tlen: 1, zhar: 1 } },
    mirrormage: { name: 'Зерцальщик', faction: 'throne', mage: true, spells: ['balm', 'shadow'], stats: { atk: 10, def: 14, power: 38, wis: 38 }, cards: { tactics: 3, offense: 2, defense: 3, archery: 2, leadership: 6, luck: 5, march: 5, scouting: 4, treasury: 5, learning: 10, sorcery: 11, machines: 1, yasna: 12, morok: 12, mera: 3, glub: 2, rostan: 1, tlen: 1, zhar: 1 } },
    deeppriest: { name: 'Жрец глубин', faction: 'tide', mage: true, spells: ['splash', 'shadow'], stats: { atk: 10, def: 14, power: 38, wis: 38 }, cards: { tactics: 3, offense: 2, defense: 3, archery: 2, leadership: 6, luck: 6, march: 8, scouting: 5, treasury: 4, learning: 11, sorcery: 11, machines: 1, glub: 12, morok: 12, rostan: 2, mera: 3, tlen: 1, zhar: 1, yasna: 2 } }
  };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
