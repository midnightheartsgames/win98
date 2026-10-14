(function (K) {
  'use strict';

  K.ATTRS = [['str', 'Сила'], ['dex', 'Ловкость'], ['con', 'Телосложение'], ['int', 'Интеллект'], ['wis', 'Мудрость'], ['cha', 'Обаяние']];
  K.ATTR_NAMES = Object.fromEntries(K.ATTRS);
  K.SKILLS = [
    ['com', 'Компьютеры', 'int'], ['dem', 'Взрывчатка', 'int'], ['ste', 'Скрытность', 'dex'], ['awa', 'Внимательность', 'wis'],
    ['per', 'Убеждение', 'cha'], ['rep', 'Ремонт', 'int'], ['sec', 'Безопасность', 'dex'], ['tre', 'Лечение', 'wis']
  ];
  K.SKILL_NAMES = Object.fromEntries(K.SKILLS.map(s => [s[0], s[1]]));
  K.SKILL_ATTR = Object.fromEntries(K.SKILLS.map(s => [s[0], s[2]]));

  K.CLASSES = {
    soldier: { n: 'Солдат', hd: 10, bab: 1, sk: 1, good: ['fort'], cskills: ['dem', 'tre'], feats: ['armor_light', 'armor_medium', 'armor_heavy'], bonusFeat: 2, desc: 'Мастер оружия и брони. Больше всех здоровья, лучшая точность, частые боевые навыки.' },
    scout: { n: 'Разведчик', hd: 8, bab: 0.75, sk: 3, good: ['fort', 'ref', 'will'], cskills: ['com', 'dem', 'awa', 'rep', 'sec', 'tre'], feats: ['armor_light', 'armor_medium'], bonusFeat: 3, desc: 'Следопыт и техник. Много умений, хорошие спасброски, взлом и ремонт.' },
    scoundrel: { n: 'Негодяй', hd: 6, bab: 0.75, sk: 4, good: ['ref'], cskills: ['com', 'dem', 'ste', 'awa', 'per', 'sec', 'tre'], feats: ['armor_light', 'sneak', 'scoundrel_luck'], bonusFeat: 0, desc: 'Ловкач и пройдоха. Скрытая атака, удача негодяя, лучшее Убеждение и Безопасность.' },
    sentinel: { n: 'Джедай-страж', hd: 8, bab: 0.75, sk: 3, good: ['fort', 'ref', 'will'], cskills: ['awa', 'per', 'sec', 'tre', 'com'], feats: ['jedi_defense', 'armor_light'], bonusFeat: 0, force: true, desc: 'Рыцарь-джедай, владеющий Силой.' },
    droid: { n: 'Дроид-эксперт', hd: 6, bab: 0.75, sk: 4, good: ['fort'], cskills: ['com', 'dem', 'awa', 'rep', 'sec'], feats: [], bonusFeat: 0, droid: true, desc: 'Астромех с инструментами взлома.' },
    beast: { n: 'Зверь', hd: 10, bab: 1, sk: 0, good: ['fort'], cskills: [], feats: [], bonusFeat: 0, desc: '' }
  };
  K.PLAYER_CLASSES = ['soldier', 'scout', 'scoundrel'];

  K.FEATS = {
    power_attack: { n: 'Мощная атака', type: 'melee', ab: -3, db: 5, icon: 'PA', desc: 'Удар ближнего боя: -3 к атаке, +5 к урону.' },
    flurry: { n: 'Шквал', type: 'melee', ab: -4, extra: 1, def: -4, icon: 'FL', desc: 'Дополнительная атака в раунде; -4 к атаке и защите.' },
    critical_strike: { n: 'Критический удар', type: 'melee', ab: -1, threat: 3, def: -3, icon: 'CS', desc: 'Диапазон крита +3; -1 к атаке, -3 к защите.' },
    power_blast: { n: 'Мощный выстрел', type: 'ranged', ab: -3, db: 5, icon: 'PB', desc: 'Выстрел: -3 к атаке, +5 к урону.' },
    rapid_shot: { n: 'Скорострельность', type: 'ranged', ab: -4, extra: 1, icon: 'RS', desc: 'Дополнительный выстрел в раунде; -4 к атаке.' },
    sniper_shot: { n: 'Снайперский выстрел', type: 'ranged', ab: -1, threat: 3, def: -3, icon: 'SS', desc: 'Диапазон крита +3; -1 к атаке, -3 к защите.' },
    two_weapon: { n: 'Бой двумя оружиями', type: 'passive', desc: 'Штраф за два оружия снижается до -2/-4.' },
    toughness: { n: 'Живучесть', type: 'passive', desc: '+1 к здоровью за уровень.' },
    dueling: { n: 'Дуэлянт', type: 'passive', desc: '+1 к атаке и защите с одним одноручным оружием.' },
    conditioning: { n: 'Закалка', type: 'passive', desc: '+2 ко всем спасброскам.' },
    armor_light: { n: 'Лёгкая броня', type: 'passive', desc: 'Позволяет носить лёгкую броню.' },
    armor_medium: { n: 'Средняя броня', type: 'passive', req: 'armor_light', desc: 'Позволяет носить среднюю броню.' },
    armor_heavy: { n: 'Тяжёлая броня', type: 'passive', req: 'armor_medium', desc: 'Позволяет носить тяжёлую броню.' },
    sneak: { n: 'Скрытая атака', type: 'passive', cls: true, desc: '+1d6 урона за каждые 2 уровня по оглушённым и отвлечённым целям.' },
    scoundrel_luck: { n: 'Удача негодяя', type: 'passive', cls: true, desc: '+1 к защите, растёт с уровнем.' },
    jedi_defense: { n: 'Защита джедая', type: 'passive', cls: true, desc: 'Отражение бластерных выстрелов световым мечом.' }
  };
  K.FEAT_POOL = ['power_attack', 'flurry', 'critical_strike', 'power_blast', 'rapid_shot', 'sniper_shot', 'two_weapon', 'toughness', 'dueling', 'conditioning', 'armor_medium', 'armor_heavy'];

  K.POWERS = {
    cure: { n: 'Исцеление', fp: 5, target: 'party', range: 12, icon: 'CU', desc: 'Лечит всех членов отряда рядом: 5 + 2 за уровень.' },
    stun: { n: 'Оглушение Силой', fp: 3, target: 'enemy', range: 14, icon: 'ST', save: 'will', desc: 'Цель оглушена на 9 с (спасбросок Воли).' },
    push: { n: 'Толчок Силой', fp: 4, target: 'enemy', range: 12, icon: 'PU', save: 'fort', desc: 'Отбрасывает и сбивает с ног врага, урон 1d6 за 2 уровня.' },
    battle_med: { n: 'Боевая медитация', fp: 8, target: 'self', icon: 'BM', desc: 'Уникальный дар Бастилы: отряд получает +2 к атаке и защите на 45 с.' }
  };

  const W = (n, wt, dmg, o) => Object.assign({ n, k: 'w', wt, dmg }, o);
  const A = (n, def, maxDex, prof, cost, col, o) => Object.assign({ n, k: 'a', def, maxDex, prof, cost, col }, o);
  const U = (n, cost, use, o) => Object.assign({ n, k: 'u', cost, use }, o);
  const Q = (n, desc) => ({ n, k: 'q', cost: 0, desc });

  K.ITEMS = {
    blaster_pistol: W('Бластерный пистолет', 'ranged', [1, 6], { dt: 'energy', light: true, cost: 100, col: '#505860', bolt: '#ff4030', desc: 'Надёжный армейский пистолет.' }),
    heavy_pistol: W('Тяжёлый бластерный пистолет', 'ranged', [1, 8], { dt: 'energy', light: true, cost: 280, col: '#3a3a44', bolt: '#ff4030', desc: 'Мощнее и тяжелее обычного пистолета.' }),
    carth_pistol: W('Бластер Карта', 'ranged', [1, 8], { dt: 'energy', light: true, ab: 1, cost: 400, col: '#6a5a40', bolt: '#ff6030', unique: true, desc: 'Именной пистолет офицера Республики.' }),
    calo_pistol: W('Бластер Кало Норда', 'ranged', [1, 8], { dt: 'energy', light: true, ab: 2, db: 2, cost: 1200, col: '#202020', bolt: '#ff2020', desc: 'Оружие легендарного охотника за головами.' }),
    ion_blaster: W('Ионный бластер', 'ranged', [1, 6], { dt: 'ion', light: true, cost: 320, col: '#406080', bolt: '#60a0ff', desc: 'Двойной урон по дроидам, слабый против живых.' }),
    blaster_carbine: W('Бластерный карабин', 'ranged', [1, 8], { dt: 'energy', two: true, ab: 1, cost: 420, col: '#404850', bolt: '#ff4030', desc: 'Лёгкая винтовка для ближних дистанций.' }),
    blaster_rifle: W('Бластерная винтовка', 'ranged', [1, 8], { dt: 'energy', two: true, cr: [19, 2], cost: 380, col: '#303840', bolt: '#ff3020', desc: 'Стандартное оружие пехоты.' }),
    sith_rifle: W('Винтовка ситхов', 'ranged', [1, 10], { dt: 'energy', two: true, ab: 1, cost: 700, col: '#202428', bolt: '#ff2020', desc: 'Штурмовая винтовка элитных частей.' }),
    repeating_blaster: W('Тяжёлый повторитель', 'ranged', [1, 10], { dt: 'energy', two: true, db: 2, cost: 950, col: '#484038', bolt: '#ff8020', heavy: true, desc: 'Мандалорская классика: плотный огонь.' }),
    bowcaster: W('Арбалет вуки', 'ranged', [1, 12], { dt: 'energy', two: true, cost: 800, col: '#6a4a2a', bolt: '#40ff60', only: 'wookiee', desc: 'Может использовать только вуки.' }),
    droid_blaster: W('Встроенный бластер', 'ranged', [1, 6], { dt: 'energy', droid: true, cost: 0, col: '#808080', bolt: '#ff4030', nodrop: true }),
    droid_carbine: W('Бластер дроида', 'ranged', [1, 8], { dt: 'energy', droid: true, cost: 0, col: '#707070', bolt: '#ff4030', nodrop: true }),
    short_sword: W('Короткий меч', 'melee', [1, 6], { dt: 'kinetic', light: true, cr: [19, 2], cost: 90, col: '#b0b8c0', len: 0.6 }),
    long_sword: W('Длинный меч', 'melee', [1, 8], { dt: 'kinetic', cr: [19, 2], cost: 160, col: '#c0c8d0', len: 0.9 }),
    vibroblade: W('Виброклинок', 'melee', [2, 4], { dt: 'kinetic', cr: [19, 2], cost: 380, col: '#a0d0e0', len: 0.85, desc: 'Вибрирующее лезвие режет броню.' }),
    vibro_sword: W('Вибромеч', 'melee', [2, 6], { dt: 'kinetic', cr: [19, 2], ab: 1, cost: 900, col: '#90e0ff', len: 1.0 }),
    double_vibro: W('Двойной виброклинок', 'melee', [2, 6], { dt: 'kinetic', two: true, dbl: true, cr: [19, 2], cost: 1100, col: '#80c0ff', len: 1.3 }),
    stun_baton: W('Шоковая дубинка', 'melee', [1, 6], { dt: 'kinetic', light: true, stun: 0.15, cost: 250, col: '#606030', len: 0.6, desc: 'Иногда оглушает цель.' }),
    gamorrean_axe: W('Гаморреанский топор', 'melee', [1, 8], { dt: 'kinetic', two: true, cr: [20, 3], cost: 240, col: '#8a7a60', len: 1.1 }),
    bastila_saber: W('Двухклинковый световой меч', 'melee', [2, 8], { dt: 'energy', two: true, dbl: true, cr: [19, 2], ab: 1, cost: 0, col: '#ffe040', saber: true, len: 1.0, nodrop: true, desc: 'Жёлтый клинок Бастилы Шан.' }),
    claws: W('Когти', 'melee', [1, 6], { dt: 'kinetic', natural: true, cost: 0, nodrop: true }),
    rakghoul_claws: W('Когти ракгула', 'melee', [1, 6], { dt: 'kinetic', natural: true, plague: 0.12, cost: 0, nodrop: true }),
    rancor_claws: W('Лапы ранкора', 'melee', [3, 6], { dt: 'kinetic', natural: true, cost: 0, nodrop: true }),

    clothes: A('Одежда', 0, 9, 'none', 10, null),
    combat_suit: A('Боевой костюм', 3, 5, 'light', 160, '#6a6450'),
    military_suit: A('Военный костюм', 4, 4, 'light', 420, '#4a5a48'),
    echani_light: A('Эчанийская лёгкая броня', 5, 5, 'light', 1500, '#b0a890', { desc: 'Лёгкая броня ручной работы, не стесняет движений.' }),
    zabrak_suit: A('Боевой костюм забраков', 5, 3, 'medium', 680, '#7a5030'),
    reinforced: A('Армированный жилет', 5, 3, 'medium', 560, '#505a60'),
    sith_trooper_armor: A('Броня солдата ситхов', 6, 1, 'heavy', 950, '#c8ccd0'),
    mando_armor: A('Мандалорский доспех', 7, 1, 'heavy', 1400, '#7a7a70', { unique: true }),
    jedi_robe: A('Одеяние джедая', 1, 9, 'none', 300, '#a08a60', { jedi: true }),
    droid_plating: A('Обшивка дроида', 3, 9, 'none', 200, null, { droid: true }),

    power_gloves: { n: 'Перчатки силы', k: 'x', cost: 650, bonus: { str: 2 }, desc: '+2 к Силе.' },
    reflex_band: { n: 'Повязка рефлексов', k: 'x', cost: 650, bonus: { dex: 2 }, desc: '+2 к Ловкости.' },
    aim_visor: { n: 'Визор наведения', k: 'x', cost: 900, bonus: { rab: 2 }, desc: '+2 к атаке дальнего боя.' },
    verpine_band: { n: 'Верпинская повязка', k: 'x', cost: 800, bonus: { def: 2 }, desc: '+2 к защите.' },
    interface_band: { n: 'Интерфейсная повязка', k: 'x', cost: 700, bonus: { com: 3, sec: 3 }, desc: '+3 к Компьютерам и Безопасности.' },

    medpac: U('Аптечка', 40, { heal: 15, skill: 'tre' }, { desc: 'Восстанавливает 15 + Лечение здоровья.' }),
    adv_medpac: U('Улучшенная аптечка', 120, { heal: 35, skill: 'tre' }, { desc: 'Восстанавливает 35 + Лечение здоровья.' }),
    repair_kit: U('Ремкомплект', 50, { repair: 20, skill: 'rep' }, { desc: 'Чинит дроида: 20 + Ремонт.' }),
    stim: U('Боевой стимулятор', 150, { buff: 'stim', t: 60 }, { desc: '+2 к Силе и Ловкости на 60 секунд.' }),
    frag: U('Осколочная граната', 90, { grenade: 'frag', dmg: [3, 6], r: 2.6, dc: 15 }, { desc: '3d6 урона в радиусе, спасбросок Рефлекса — половина.' }),
    stun_gren: U('Оглушающая граната', 110, { grenade: 'stun', r: 2.6, dc: 14, t: 9 }, { desc: 'Оглушает живых существ на 9 секунд.' }),
    ion_gren: U('Ионная граната', 100, { grenade: 'ion', dmg: [4, 6], r: 2.6, dc: 15 }, { desc: '4d6 урона дроидам и снятие энергощитов.' }),
    shield: U('Энергощит', 180, { buff: 'shield', t: 30, absorb: 40 }, { desc: 'Поглощает 40 энергетического урона за 30 секунд.' }),
    sec_spike: U('Отмычка', 40, { spike: 'sec' }, { desc: '+5 к Безопасности при взломе. Расходуется.' }),
    comp_spike: U('Компьютерный шип', 40, { spike: 'com' }, { desc: 'Нужен для взлома терминалов. Расходуется.' }),

    accelerator: Q('Прототип ускорителя', 'Экспериментальный ускоритель для свупа, украденный вулкарами у беков.'),
    serum: Q('Сыворотка от ракгульской чумы', 'Экспериментальное лекарство от чумы ракгулов.'),
    launch_codes: Q('Коды запуска', 'Коды, позволяющие кораблю пройти блокаду ситхов.'),
    garage_pass: Q('Пропуск в гараж', 'Карта доступа в гараж «Чёрных вулкаров».'),
    rukil_1: Q('Дневник ученика Рукила I', 'Первая часть записей о Земле обетованной.'),
    rukil_2: Q('Дневник ученика Рукила II', 'Вторая часть записей о Земле обетованной.'),
    rukil_3: Q('Дневник ученика Рукила III', 'Последняя часть записей о Земле обетованной.'),
    remains: Q('Гниющие останки', 'Отвратительная приманка. Ранкор бы оценил.'),
    hangar_code: Q('Код ангара Давика', 'Код от двери ангара с «Эбеновым ястребом».'),
    sith_papers: Q('Документы ситхов', 'Разрешение на проход в Нижний город.'),
    bek_pass: Q('Эмблема беков', 'Знак доверия «Скрытых беков».')
  };
  const cardVals = [1, 2, 3, 4, 5, 6];
  for (const v of cardVals) {
    K.ITEMS['card_p' + v] = { n: 'Карта пазаака +' + v, k: 'c', cost: 30 + v * 10, card: { v, kind: '+' } };
    K.ITEMS['card_m' + v] = { n: 'Карта пазаака -' + v, k: 'c', cost: 30 + v * 10, card: { v: -v, kind: '-' } };
    K.ITEMS['card_f' + v] = { n: 'Карта пазаака ±' + v, k: 'c', cost: 120 + v * 20, card: { v, kind: '±' } };
  }
  for (const [id, it] of Object.entries(K.ITEMS)) it.id = id;

  K.MODELS = {
    player_m: { b: 'human', skin: '#d0a078', hair: '#3a2818', top: '#7a6a50', bot: '#4a4038' },
    player_f: { b: 'human', fem: true, skin: '#e0b090', hair: '#5a3018', top: '#7a6a50', bot: '#4a4038' },
    carth: { b: 'human', skin: '#d8a880', hair: '#6a4a2a', top: '#d08a30', bot: '#4a4a52', vest: '#8a4a20' },
    mission: { b: 'twilek', fem: true, skin: '#5aa0e0', top: '#5a4a38', bot: '#3a3028', h: 0.88 },
    zaalbar: { b: 'wookiee', skin: '#6a4a2a', hair: '#6a4a2a', top: '#6a4a2a', bot: '#5a3a20', h: 1.22, w: 1.25 },
    bastila: { b: 'human', fem: true, skin: '#e8c0a0', hair: '#5a3a20', top: '#c8b890', bot: '#8a6a40', robe: true },
    t3: { b: 'astromech', top: '#8a8a90', bot: '#606068', trim: '#3060a0' },
    canderous: { b: 'human', skin: '#c89878', hair: '#a0a0a0', top: '#7a7a70', bot: '#4a4a44', w: 1.12, h: 1.05 },
    sith: { b: 'human', helm: true, top: '#d0d4d8', bot: '#1a1a1e', skin: '#1a1a1e' },
    sith_officer: { b: 'human', skin: '#d0a888', hair: '#2a2a2a', top: '#3a3a40', bot: '#2a2a30', cap: '#3a3a40' },
    sith_heavy: { b: 'human', helm: true, top: '#8a8e96', bot: '#1a1a1e', skin: '#1a1a1e', w: 1.12 },
    sith_governor: { b: 'human', skin: '#c8a080', hair: '#1a1a1a', top: '#5a1818', bot: '#2a2a2a', cape: '#401010', w: 1.05 },
    sith_droid: { b: 'droid', top: '#606870', bot: '#404850', trim: '#c02020' },
    war_droid: { b: 'droid', top: '#6a5a40', bot: '#4a4030', trim: '#e0a030', w: 1.1 },
    vulkar: { b: 'human', skin: '#c89070', hair: '#1a1a1a', top: '#20203a', bot: '#181828', vest: '#4060c0' },
    vulkar_w: { b: 'human', fem: true, skin: '#b88060', hair: '#6a1a1a', top: '#20203a', bot: '#181828', vest: '#4060c0' },
    vulkar_rodian: { b: 'rodian', skin: '#4a8a3a', top: '#20203a', bot: '#181828', vest: '#4060c0' },
    bek: { b: 'human', skin: '#c89070', hair: '#3a2a1a', top: '#5a6a30', bot: '#3a3a28', vest: '#a0a040' },
    bek_w: { b: 'human', fem: true, skin: '#8a5a3a', hair: '#1a1a1a', top: '#5a6a30', bot: '#3a3a28', vest: '#a0a040' },
    gadon: { b: 'human', skin: '#b08060', hair: '#bababa', top: '#4a5a3a', bot: '#2a2a22', glasses: true },
    brejik: { b: 'human', skin: '#c89878', hair: '#caa060', top: '#2a2a50', bot: '#1a1a30', vest: '#2050d0' },
    kandon: { b: 'human', skin: '#a07050', hair: '#1a1a1a', top: '#303040', bot: '#1a1a28', vest: '#3050b0' },
    thug: { b: 'human', skin: '#c89878', hair: '#4a3020', top: '#5a3a30', bot: '#3a3a3a' },
    thug_rodian: { b: 'rodian', skin: '#5a9a4a', top: '#5a4a30', bot: '#3a3a3a' },
    gamorrean: { b: 'gamorrean', skin: '#6a8a40', top: '#6a4a2a', bot: '#4a3a20', w: 1.3 },
    gamorrean_chief: { b: 'gamorrean', skin: '#5a7a38', top: '#7a2a1a', bot: '#4a3a20', w: 1.45, h: 1.12 },
    rakghoul: { b: 'rakghoul', skin: '#a8b490', top: '#8a9474', bot: '#6a7054' },
    rakghoul_fiend: { b: 'rakghoul', skin: '#b89a90', top: '#9a7a70', bot: '#7a5a50', h: 1.12 },
    rancor: { b: 'rancor', skin: '#7a6450', h: 3.2 },
    calo: { b: 'human', helm: true, top: '#5a5040', bot: '#3a3228', skin: '#2a2a2a', mask: '#8a8070' },
    davik: { b: 'human', skin: '#d0a080', hair: '#1a1a1a', top: '#8a2a2a', bot: '#1a1a1a', vest: '#c0a040', w: 1.08 },
    davik_guard: { b: 'human', skin: '#c89070', hair: '#2a2a2a', top: '#8a3030', bot: '#2a2a2a', vest: '#c0a040' },
    citizen_m: { b: 'human', skin: '#d0a078', hair: '#4a3020', top: '#4a6a8a', bot: '#3a3a3a' },
    citizen_f: { b: 'human', fem: true, skin: '#e0b898', hair: '#8a5a20', top: '#8a4a6a', bot: '#3a3a4a' },
    noble: { b: 'human', skin: '#e0c0a0', hair: '#c0c0c0', top: '#6a3a8a', bot: '#2a2a3a', robe: true },
    duros: { b: 'duros', skin: '#5a7a9a', top: '#6a5a4a', bot: '#3a3a3a' },
    twilek_m: { b: 'twilek', skin: '#c05a4a', top: '#4a3a5a', bot: '#2a2a3a' },
    twilek_dancer: { b: 'twilek', fem: true, skin: '#e0a0c0', top: '#a02060', bot: '#a02060', h: 0.95 },
    rodian: { b: 'rodian', skin: '#5a9a4a', top: '#6a5a3a', bot: '#3a3a3a' },
    hutt: { b: 'hutt', skin: '#8a8050', w: 1.8 },
    bith: { b: 'duros', skin: '#c0b8a8', top: '#5a4a6a', bot: '#3a3a3a' },
    outcast: { b: 'human', skin: '#b89070', hair: '#5a5040', top: '#5a5040', bot: '#4a4030', ragged: true },
    outcast_f: { b: 'human', fem: true, skin: '#c09878', hair: '#3a3020', top: '#5a4a38', bot: '#4a4030', ragged: true },
    rukil: { b: 'human', skin: '#b89070', hair: '#e0e0e0', top: '#6a5a40', bot: '#4a4030', ragged: true, beard: '#e0e0e0', h: 0.94 },
    zelka: { b: 'human', skin: '#d0a888', hair: '#6a6a6a', top: '#e0e0e8', bot: '#8a8a98' },
    republic: { b: 'human', skin: '#d0a078', hair: '#4a3020', top: '#d08a30', bot: '#4a4a52' },
    bendak: { b: 'human', skin: '#a07860', hair: '#1a1a1a', top: '#3a3a3a', bot: '#2a2a2a', vest: '#8a2020', w: 1.1 },
    arena: { b: 'human', skin: '#c89070', hair: '#5a3a1a', top: '#6a4a3a', bot: '#3a3a3a', vest: '#a06030' },
    arena_w: { b: 'human', fem: true, skin: '#f0d0c0', hair: '#e8e8f0', top: '#a0c0e0', bot: '#406080' },
    droid_merchant: { b: 'human', skin: '#c89070', hair: '#aa8850', top: '#707a80', bot: '#3a3a3a' },
    protocol: { b: 'droid', top: '#c0a040', bot: '#a08030', trim: '#e0c060' }
  };

  const T = (n, cls, lvl, at, equip, o) => Object.assign({ n, cls, lvl, attrs: { str: at[0], dex: at[1], con: at[2], int: at[3], wis: at[4], cha: at[5] }, equip }, o);
  const L = (...pairs) => pairs;

  K.TEMPLATES = {
    carth: T('Карт Онаси', 'soldier', 1, [12, 16, 14, 12, 12, 12], { r: 'carth_pistol', l: 'blaster_pistol', body: 'combat_suit' }, { m: 'carth', feats: ['two_weapon', 'rapid_shot', 'toughness'], skills: { tre: 3, dem: 2, awa: 2 }, ai: 'ranged', party: true, grow: ['rapid_shot', 'power_blast', 'sniper_shot', 'conditioning', 'dueling'] }),
    mission: T('Миссия Вао', 'scoundrel', 1, [10, 16, 12, 14, 10, 14], { r: 'vibroblade', body: 'combat_suit' }, { m: 'mission', feats: ['flurry'], skills: { sec: 6, ste: 4, awa: 4, dem: 4, com: 2 }, ai: 'melee', party: true, grow: ['power_attack', 'critical_strike', 'toughness', 'dueling'] }),
    zaalbar: T('Заалбар', 'soldier', 1, [18, 12, 16, 10, 10, 8], { r: 'bowcaster' }, { m: 'zaalbar', race: 'wookiee', feats: ['power_blast', 'toughness'], skills: { tre: 2 }, ai: 'ranged', party: true, hpBonus: 6, grow: ['rapid_shot', 'power_attack', 'conditioning', 'sniper_shot'] }),
    bastila: T('Бастила Шан', 'sentinel', 1, [12, 14, 12, 10, 16, 14], { r: 'bastila_saber', body: 'jedi_robe' }, { m: 'bastila', feats: ['flurry', 'jedi_defense'], powers: ['cure', 'stun', 'battle_med', 'push'], skills: { awa: 4, per: 4, tre: 4 }, ai: 'melee', party: true, grow: ['power_attack', 'critical_strike', 'conditioning'] }),
    t3: T('Т3-М4', 'droid', 1, [10, 14, 12, 16, 10, 8], { r: 'droid_blaster', body: 'droid_plating' }, { m: 't3', droid: true, feats: [], skills: { com: 6, sec: 6, rep: 6, awa: 4, dem: 2 }, ai: 'ranged', party: true, grow: ['rapid_shot', 'toughness', 'sniper_shot'] }),
    canderous: T('Кандерус Ордо', 'soldier', 1, [16, 12, 16, 10, 10, 10], { r: 'repeating_blaster', body: 'mando_armor' }, { m: 'canderous', feats: ['power_blast', 'rapid_shot', 'toughness'], skills: { dem: 4, tre: 2 }, ai: 'ranged', party: true, hpBonus: 8, grow: ['sniper_shot', 'conditioning', 'power_attack'] }),

    sith_trooper: T('Солдат ситхов', 'soldier', 2, [12, 13, 12, 10, 10, 8], { r: 'blaster_rifle', body: 'combat_suit' }, { m: 'sith', ai: 'ranged', loot: L(['medpac', 0.35], ['frag', 0.08], ['blaster_rifle', 0.08]), cr: 60, credits: [5, 25] }),
    sith_officer: T('Офицер ситхов', 'soldier', 3, [12, 14, 12, 12, 12, 12], { r: 'heavy_pistol', body: 'military_suit' }, { m: 'sith_officer', ai: 'ranged', loot: L(['medpac', 0.5], ['stun_gren', 0.3]), cr: 90, credits: [20, 60] }),
    sith_heavy: T('Тяжёлый пехотинец ситхов', 'soldier', 5, [14, 12, 14, 10, 10, 8], { r: 'repeating_blaster', body: 'sith_trooper_armor' }, { m: 'sith_heavy', ai: 'ranged', feats: ['power_blast'], loot: L(['adv_medpac', 0.3], ['frag', 0.3]), cr: 160, credits: [15, 40] }),
    sith_elite: T('Элитный солдат ситхов', 'soldier', 6, [14, 15, 14, 10, 10, 8], { r: 'sith_rifle', body: 'sith_trooper_armor' }, { m: 'sith_heavy', ai: 'ranged', feats: ['rapid_shot'], items: ['frag'], loot: L(['adv_medpac', 0.4], ['sith_rifle', 0.15], ['shield', 0.2]), cr: 220, credits: [20, 60] }),
    sith_droid: T('Штурмовой дроид ситхов', 'droid', 4, [14, 12, 14, 8, 8, 4], { r: 'droid_carbine', body: 'droid_plating' }, { m: 'sith_droid', droid: true, ai: 'ranged', loot: L(['repair_kit', 0.4], ['ion_gren', 0.2]), cr: 130 }),
    sith_governor: T('Губернатор ситхов', 'soldier', 8, [16, 14, 16, 12, 12, 14], { r: 'double_vibro', body: 'sith_trooper_armor' }, { m: 'sith_governor', ai: 'melee', feats: ['flurry', 'power_attack', 'toughness'], hpBonus: 30, boss: true, loot: L(['launch_codes', 1], ['double_vibro', 1], ['adv_medpac', 1]), cr: 700, credits: [200, 200] }),
    vulkar_thug: T('Вулкар-бандит', 'soldier', 2, [13, 12, 12, 8, 8, 8], { r: 'vibroblade', body: 'combat_suit' }, { m: 'vulkar', ai: 'melee', loot: L(['medpac', 0.3], ['vibroblade', 0.06]), cr: 50, credits: [5, 30] }),
    vulkar_gunner: T('Вулкар-стрелок', 'soldier', 2, [10, 14, 12, 8, 8, 8], { r: 'blaster_pistol', body: 'combat_suit' }, { m: 'vulkar_w', ai: 'ranged', loot: L(['medpac', 0.3], ['frag', 0.1]), cr: 50, credits: [5, 30] }),
    vulkar_rodian: T('Вулкар-родианец', 'soldier', 3, [10, 15, 12, 8, 8, 8], { r: 'blaster_carbine', body: 'combat_suit' }, { m: 'vulkar_rodian', ai: 'ranged', loot: L(['medpac', 0.3], ['stim', 0.08]), cr: 70, credits: [10, 40] }),
    vulkar_elite: T('Вулкар-ветеран', 'soldier', 4, [14, 14, 14, 10, 10, 8], { r: 'vibro_sword', body: 'military_suit' }, { m: 'vulkar', ai: 'melee', feats: ['power_attack'], loot: L(['adv_medpac', 0.2], ['stim', 0.2]), cr: 120, credits: [20, 50] }),
    vulkar_lt: T('Лейтенант вулкаров', 'soldier', 4, [14, 14, 14, 10, 10, 10], { r: 'heavy_pistol', body: 'reinforced' }, { m: 'kandon', ai: 'ranged', feats: ['rapid_shot'], hpBonus: 10, loot: L(['garage_pass', 1], ['adv_medpac', 1]), cr: 180, credits: [40, 80] }),
    kandon: T('Кандон Арк', 'soldier', 6, [14, 16, 14, 12, 10, 12], { r: 'heavy_pistol', l: 'heavy_pistol', body: 'reinforced' }, { m: 'kandon', ai: 'ranged', feats: ['two_weapon', 'rapid_shot'], hpBonus: 25, boss: true, loot: L(['accelerator', 1], ['aim_visor', 1], ['adv_medpac', 1]), cr: 400, credits: [150, 150] }),
    brejik: T('Брежик', 'soldier', 6, [16, 14, 14, 12, 10, 14], { r: 'vibro_sword', body: 'reinforced' }, { m: 'brejik', ai: 'melee', feats: ['power_attack', 'flurry'], hpBonus: 20, boss: true, loot: L(['power_gloves', 1], ['adv_medpac', 1]), cr: 450, credits: [200, 200] }),
    war_droid: T('Боевой дроид', 'droid', 4, [14, 12, 14, 8, 8, 4], { r: 'droid_carbine', body: 'droid_plating' }, { m: 'war_droid', droid: true, ai: 'ranged', loot: L(['repair_kit', 0.3]), cr: 120 }),
    gamorrean: T('Гаморреанец', 'soldier', 3, [14, 10, 14, 6, 8, 6], { r: 'gamorrean_axe', body: 'combat_suit' }, { m: 'gamorrean', ai: 'melee', loot: L(['medpac', 0.3], ['gamorrean_axe', 0.1]), cr: 75, credits: [5, 20] }),
    gamorrean_chief: T('Вождь гаморреанцев', 'soldier', 4, [18, 10, 16, 6, 8, 8], { r: 'gamorrean_axe', body: 'combat_suit' }, { m: 'gamorrean_chief', ai: 'melee', feats: ['power_attack'], hpBonus: 10, boss: true, loot: L(['adv_medpac', 1], ['stim', 1]), cr: 260, credits: [60, 60] }),
    rakghoul: T('Ракгул', 'beast', 2, [14, 12, 14, 2, 8, 2], { r: 'rakghoul_claws' }, { m: 'rakghoul', ai: 'melee', beast: true, loot: [], cr: 55, def: 2 }),
    rakghoul_fiend: T('Свирепый ракгул', 'beast', 4, [16, 12, 16, 2, 8, 2], { r: 'rakghoul_claws' }, { m: 'rakghoul_fiend', ai: 'melee', beast: true, hpBonus: 10, loot: [], cr: 110, def: 3 }),
    rancor: T('Ранкор', 'beast', 10, [26, 8, 22, 2, 8, 2], { r: 'rancor_claws' }, { m: 'rancor', ai: 'melee', beast: true, hpBonus: 90, big: true, loot: [], cr: 350, def: 4 }),
    thug: T('Громила', 'soldier', 2, [13, 12, 12, 8, 8, 8], { r: 'blaster_pistol', body: 'clothes' }, { m: 'thug', ai: 'ranged', loot: L(['medpac', 0.3]), cr: 40, credits: [5, 20] }),
    thug_melee: T('Громила', 'soldier', 2, [14, 11, 12, 8, 8, 8], { r: 'short_sword', body: 'clothes' }, { m: 'thug_rodian', ai: 'melee', loot: L(['medpac', 0.3]), cr: 40, credits: [5, 20] }),
    calo: T('Кало Норд', 'soldier', 9, [14, 18, 16, 12, 12, 10], { r: 'calo_pistol', body: 'reinforced' }, { m: 'calo', ai: 'ranged', feats: ['rapid_shot', 'sniper_shot'], hpBonus: 60, boss: true, items: ['frag', 'frag'], loot: [], cr: 500 }),
    davik: T('Давик Канг', 'soldier', 8, [16, 14, 16, 12, 12, 14], { r: 'vibro_sword', body: 'echani_light' }, { m: 'davik', ai: 'melee', feats: ['flurry', 'critical_strike', 'toughness'], hpBonus: 15, boss: true, loot: L(['echani_light', 1], ['vibro_sword', 1], ['adv_medpac', 1]), cr: 700, credits: [500, 500] }),
    davik_guard: T('Охранник Давика', 'soldier', 5, [13, 14, 14, 10, 10, 8], { r: 'blaster_carbine', body: 'military_suit' }, { m: 'davik_guard', ai: 'ranged', loot: L(['medpac', 0.5], ['frag', 0.15]), cr: 140, credits: [20, 50] }),
    marl: T('Марл', 'soldier', 2, [12, 12, 12, 10, 10, 10], { r: 'long_sword', body: 'combat_suit' }, { m: 'arena', ai: 'melee', loot: [], cr: 60 }),
    duncan: T('Меткий Дункан', 'soldier', 2, [10, 10, 10, 10, 8, 10], { r: 'blaster_pistol', body: 'clothes' }, { m: 'thug', ai: 'ranged', loot: [], cr: 40 }),
    ice: T('Айс', 'scoundrel', 3, [12, 16, 12, 12, 10, 14], { r: 'vibroblade', body: 'combat_suit' }, { m: 'arena_w', ai: 'melee', feats: ['flurry'], loot: [], cr: 90 }),
    gerlon: T('Герлон Два Пальца', 'soldier', 4, [14, 13, 14, 10, 10, 8], { r: 'heavy_pistol', body: 'military_suit' }, { m: 'arena', ai: 'ranged', feats: ['power_blast'], hpBonus: 6, loot: [], cr: 110 }),
    twitch: T('Твич', 'soldier', 5, [12, 16, 12, 10, 10, 10], { r: 'blaster_carbine', body: 'military_suit' }, { m: 'rodian', ai: 'ranged', feats: ['rapid_shot'], hpBonus: 8, loot: [], cr: 150 }),
    bendak: T('Бендак Старкиллер', 'soldier', 7, [16, 14, 16, 10, 10, 10], { r: 'heavy_pistol', body: 'reinforced' }, { m: 'bendak', ai: 'ranged', feats: ['power_blast', 'rapid_shot', 'toughness'], hpBonus: 25, items: ['frag'], loot: [], cr: 350 }),

    npc_human: T('Житель', 'scout', 1, [10, 10, 10, 10, 10, 10], { body: 'clothes' }, { m: 'citizen_m' }),
    npc_guard: T('Страж', 'soldier', 4, [12, 12, 12, 10, 10, 10], { r: 'blaster_rifle', body: 'military_suit' }, { m: 'bek' })
  };
  for (const [id, t] of Object.entries(K.TEMPLATES)) t.id = id;

  K.SHOPS = {
    kebla: { n: 'Кебла Юрт — Товары Верхнего города', markup: 1.1, buy: 0.35, stock: { blaster_pistol: 3, heavy_pistol: 1, blaster_rifle: 2, long_sword: 2, short_sword: 2, vibroblade: 1, combat_suit: 2, military_suit: 1, medpac: -1, adv_medpac: 4, frag: 6, stun_gren: 3, shield: 2, stim: 3, sec_spike: -1, comp_spike: -1, card_p1: 2, card_p2: 2, card_p3: 2, card_m1: 2, card_m2: 2, card_m3: 2, card_f1: 1, card_f2: 1 } },
    droids: { n: 'Лавка дроидов', markup: 1.1, buy: 0.35, stock: { repair_kit: -1, ion_blaster: 2, ion_gren: 4, interface_band: 1, comp_spike: -1 } },
    lower: { n: 'Лавка Нижнего города', markup: 1.05, buy: 0.4, stock: { blaster_carbine: 1, heavy_pistol: 2, vibro_sword: 1, stun_baton: 1, zabrak_suit: 1, reinforced: 1, medpac: -1, adv_medpac: 6, frag: 8, stun_gren: 4, stim: 4, shield: 3, reflex_band: 1, verpine_band: 1, sec_spike: -1, card_p4: 2, card_p5: 1, card_m4: 2, card_m5: 1, card_f3: 1, card_f4: 1 } },
    bek: { n: 'Интендант беков', markup: 1.0, buy: 0.4, stock: { medpac: -1, adv_medpac: 4, frag: 4, ion_gren: 2, shield: 2, sith_rifle: 1, card_p6: 1, card_m6: 1, card_f5: 1, card_f6: 1 } }
  };

  K.QUESTS = {
    main: { n: 'Побег с Тариса', main: true, s: {
      10: 'Эскадру «Шпиль Эндара» сбили над Тарисом. Я очнулся в квартире в Верхнем городе рядом с лейтенантом Картом Онаси. Бастила Шан, джедай, которую мы охраняли, где-то на планете. Карт считает, что её спасательная капсула упала в Нижнем городе. Нужно спуститься туда на лифте.',
      20: 'В Нижнем городе говорят, что банда свуперов «Чёрные вулкары» захватила «республиканскую девчонку». Их соперники, «Скрытые беки», могут знать больше. Их база — в восточной части Нижнего города.',
      30: 'Гадон Тек, вожак беков, рассказал: Бастила — главный приз в гонке свупов, её держит Брежик, главарь вулкаров. Чтобы выиграть гонку за беков, нужен прототип ускорителя, который вулкары украли. Он спрятан на их базе. Главный вход охраняется; девочка-твилек Миссия Вао знает другой путь. Её видели в кантине Джавьяра.',
      40: 'Миссия присоединилась. Её друг, вуки Заалбар, похищен гаморреанцами в канализации. Через канализацию можно пробраться на базу вулкаров. Вход в канализацию — в Подгороде, куда ведёт лифт из Нижнего города.',
      50: 'Мы спустились в Подгород. Где-то за деревней изгоев — решётка входа в канализацию.',
      55: 'Мы в канализации. Нужно найти Заалбара и путь на базу вулкаров.',
      60: 'Заалбар свободен и поклялся мне долгом жизни. Лифт на базу «Чёрных вулкаров» — в дальнем конце нижней канализации.',
      70: 'Мы проникли на базу вулкаров. Прототип ускорителя должен быть в гараже у Кандона Арка.',
      80: 'Ускоритель у меня. Нужно вернуть его Гадону Теку на базу беков.',
      90: 'Гадон записал меня гонщиком беков. Гонка на площадке для свупов в Нижнем городе. Побить лучшее время — и Бастила наша.',
      100: 'Я выиграл гонку, Бастила свободна и присоединилась к отряду. Теперь нужно выбраться с планеты, окружённой блокадой ситхов. Бастила предлагает вернуться в квартиру и подумать. Мандалорец в кантине Джавьяра искал «человека, который выиграл гонку».',
      110: 'Кандерус Ордо, наёмник Давика Канга, предлагает сделку: он поможет угнать корабль Давика, «Эбеновый ястреб», если мы добудем коды запуска с военной базы ситхов в Верхнем городе. Дверь базы откроет только дроид с программами взлома — такой продаётся в лавке дроидов Верхнего города.',
      120: 'Т3-М4 с нами. Нужно проникнуть на базу ситхов через главный вход в северной части Верхнего города.',
      130: 'Коды запуска у меня. Кандерус ждёт в кантине Джавьяра.',
      140: 'Кандерус присоединился. Спидер доставит нас в поместье Давика Канга. Выдаём себя за новых наёмников. «Эбеновый ястреб» стоит в ангаре.',
      150: 'Давик ненадолго оставил нас одних. Нужен код от ангара — его можно найти в кабинете Давика.',
      160: 'Путь в ангар открыт. «Эбеновый ястреб» ждёт.',
      200: 'Мы взлетели на «Эбеновом ястребе», прорвав блокаду. Позади флот Малака выжигает Тарис. Впереди — анклав джедаев на Дантуине.'
    }, end: 200 },
    duros: { n: 'Облава в жилом комплексе', s: {
      10: 'Ситхи ворвались в квартиру к инопланетянам по соседству. Нужно разобраться.',
      20: 'Я защитил соседей от патруля ситхов.',
      30: 'Я не стал вмешиваться в облаву ситхов.'
    }, end: [20, 30] },
    duel: { n: 'Дуэльный ринг Верхнего города', s: {
      10: 'Хатт Аджуур держит дуэльный ринг в кантине Верхнего города. За каждую победу — кредиты. Чемпион ринга — Бендак Старкиллер.',
      20: 'Я победил всех бойцов Аджуура. Остался только Бендак Старкиллер.',
      30: 'Я одолел Бендака Старкиллера и стал чемпионом ринга.'
    }, end: [30] },
    serum: { n: 'Ракгульская чума', s: {
      10: 'Доктор Зелка Форн лечит жертв ракгульской чумы. Ему нужна экспериментальная сыворотка, пропавшая с республиканским разведчиком в Подгороде.',
      20: 'Я нашёл сыворотку. Её можно отдать Зелке Форну… или продать ситхам.',
      30: 'Я передал сыворотку Зелке Форну. Теперь он сможет вылечить изгоев.',
      40: 'Я продал сыворотку ситхам. Лекарство достанется только им.'
    }, end: [30, 40] },
    promised: { n: 'Земля обетованная', s: {
      10: 'Старик Рукил из Подгорода верит в Землю обетованную — безопасное место для изгоев. Его ученик пропал, собирая записи о пути туда. Нужно найти три части дневника: в Подгороде, в канализации и на базе вулкаров.',
      20: 'Я вернул Рукилу все части дневника. Изгои могут отправиться в Землю обетованную.'
    }, end: [20] },
    pazaak: { n: 'Пазаак Тариса', s: {
      10: 'В кантинах Тариса играют в пазаак. Лучшие игроки — Лена в кантине Верхнего города и старый Гамблер в кантине Джавьяра.',
      20: 'Я обыграл лучших игроков в пазаак на Тарисе.'
    }, end: [20] },
    prisoner: { n: 'Пленник Давика', s: {
      10: 'В пыточной Давика держат пленника.',
      20: 'Я освободил пленника Давика.',
      30: 'Я оставил пленника на милость Давика.'
    }, end: [20, 30] }
  };

  K.PARTY_IDS = ['carth', 'mission', 'zaalbar', 'bastila', 't3', 'canderous'];

  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
