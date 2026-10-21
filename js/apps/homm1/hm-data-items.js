(function (H) {
  'use strict';

  const ARTIFACT_LIST = [
    { id: 'thunder_mace', name: 'Булава Грома', tier: 1, stats: { atk: 1 }, desc: 'Тяжёлое стальное навершие повышает Атаку героя на +1.' },
    { id: 'giant_flail', name: 'Цеп Великана', tier: 1, stats: { atk: 1 }, desc: 'Шипастый боевой цеп повышает Атаку героя на +1.' },
    { id: 'Caster_gauntlets', name: 'Рукавицы Ратника', tier: 2, stats: { atk: 2 }, desc: 'Кованые перчатки мечника повышают Атаку героя на +2.' },
    { id: 'dragon_sword', name: 'Меч Дракона', tier: 3, stats: { atk: 3 }, desc: 'Древний клинок с гравировкой чешуи повышает Атаку героя на +3.' },
    { id: 'divine_sword', name: 'Божественный меч', tier: 3, stats: { atk: 4 }, desc: 'Сияющий двуручный клинок повышает Атаку героя на +4.' },
    { id: 'armored_gauntlets', name: 'Латные наручи', tier: 1, stats: { def: 1 }, desc: 'Стальные пластины на предплечьях повышают Защиту героя на +1.' },
    { id: 'defender_helm', name: 'Шлем Защитника', tier: 1, stats: { def: 1 }, desc: 'Закрытый рыцарский шелом повышает Защиту героя на +1.' },
    { id: 'ares_shield', name: 'Щит Бастиона', tier: 2, stats: { def: 2 }, desc: 'Окованный железом щит повышает Защиту героя на +2.' },
    { id: 'stealth_shield', name: 'Незримый щит', tier: 3, stats: { def: 3 }, desc: 'Зачарованный щит отводит удары и повышает Защиту героя на +3.' },
    { id: 'divine_breastplate', name: 'Божественная кираса', tier: 3, stats: { def: 4 }, desc: 'Непробиваемый нагрудник повышает Защиту героя на +4.' },
    { id: 'caster_bracelet', name: 'Браслет Чародея', tier: 1, stats: { power: 1 }, desc: 'Серебряный обруч усиливает чары и повышает Силу магии на +1.' },
    { id: 'mage_ring', name: 'Кольцо Мага', tier: 2, stats: { power: 2 }, desc: 'Перстень с рубином повышает Силу магии героя на +2.' },
    { id: 'witch_broach', name: 'Брошь Ведьмы', tier: 3, stats: { power: 3 }, desc: 'Болотный талисман усиливает заклятия и повышает Силу магии на +3.' },
    { id: 'arcane_necklace', name: 'Ожерелье Тайн', tier: 3, stats: { power: 4 }, desc: 'Золотая цепь с кристаллами повышает Силу магии героя на +4.' },
    { id: 'minor_scroll', name: 'Малый свиток знаний', tier: 1, stats: { knowledge: 1 }, desc: 'Собрание походных заметок повышает Знание героя на +1.' },
    { id: 'major_scroll', name: 'Большой свиток знаний', tier: 2, stats: { knowledge: 2 }, desc: 'Трактат старых книжников повышает Знание героя на +2.' },
    { id: 'superior_scroll', name: 'Высший свиток знаний', tier: 3, stats: { knowledge: 3 }, desc: 'Древний манускрипт круга чародеев повышает Знание героя на +3.' },
    { id: 'foremost_scroll', name: 'Первейший свиток знаний', tier: 3, stats: { knowledge: 4 }, desc: 'Полный свод высшей науки повышает Знание героя на +4.' },
    { id: 'skullcap', name: 'Шлем Провидца', tier: 2, stats: { power: 1, knowledge: 1 }, desc: 'Медный венец повышает Силу магии и Знание героя на +1.' },
    { id: 'royal_crown', name: 'Корона Завоевателя', tier: 3, stats: { atk: 1, def: 1, power: 1, knowledge: 1 }, desc: 'Золотой венец древних царей повышает все четыре параметра героя на +1.' },
    { id: 'medal_of_valor', name: 'Медаль Доблести', tier: 1, stats: { morale: 1 }, desc: 'Почётный знак воинской славы повышает боевой дух отрядов на +1.' },
    { id: 'medal_of_courage', name: 'Медаль Отваги', tier: 1, stats: { morale: 1 }, desc: 'Бронзовый орден за стойкость повышает боевой дух отрядов на +1.' },
    { id: 'medal_of_honor', name: 'Медаль Чести', tier: 2, stats: { morale: 1 }, desc: 'Рыцарский крест на синей ленте повышает боевой дух отрядов на +1.' },
    { id: 'medal_of_distinction', name: 'Медаль Отличия', tier: 2, stats: { morale: 1 }, desc: 'Золотая звезда гвардии повышает боевой дух отрядов на +1.' },
    { id: 'fizbin_of_misfortune', name: 'Физбин Неудачи', tier: 1, cursed: true, stats: { morale: -2 }, desc: 'Проклятая диковина вселяет уныние в солдат и снижает боевой дух на -2.' },
    { id: 'rabbit_foot', name: 'Кроличья лапка', tier: 1, stats: { luck: 1 }, desc: 'Старый талисман следопытов повышает Удачу всех отрядов на +1.' },
    { id: 'golden_horseshoe', name: 'Золотая подкова', tier: 1, stats: { luck: 1 }, desc: 'Кованая подкова на счастье повышает Удачу всех отрядов на +1.' },
    { id: 'gambler_coin', name: 'Монета Игрока', tier: 2, stats: { luck: 1 }, desc: 'Счастливый серебряный талер повышает Удачу всех отрядов на +1.' },
    { id: 'four_leaf_clover', name: 'Четырёхлистный клевер', tier: 2, stats: { luck: 1 }, desc: 'Засушенный лист с эльфийских лугов повышает Удачу всех отрядов на +1.' },
    { id: 'traveler_boots', name: 'Сапоги Странника', tier: 2, stats: { moveLand: 200 }, desc: 'Лёгкие дорожные сапоги увеличивают суточный ход героя по суше на 200 очков.' },
    { id: 'nomad_boots', name: 'Сапоги Кочевника', tier: 3, stats: { moveLand: 400 }, desc: 'Зачарованная обувь всадников увеличивает суточный ход героя по суше на 400 очков.' },
    { id: 'sailor_astrolabe', name: 'Астролябия Морехода', tier: 2, stats: { moveSea: 600 }, desc: 'Морской прибор удваивает манёвренность парусов и даёт +600 очков хода по воде.' },
    { id: 'true_compass', name: 'Истинный Компас', tier: 3, stats: { moveLand: 300, moveSea: 300 }, desc: 'Магнитная стрелка указывает верную тропу и даёт +300 очков хода по суше и морю.' },
    { id: 'endless_purse_gold', name: 'Бездонный кошель золота', tier: 2, stats: { dailyGold: 500 }, desc: 'Заговорённый кожаный кошель каждый рассвет приносит в казну 500 золотых.' },
    { id: 'endless_bag_gold', name: 'Бездонная сума золота', tier: 3, stats: { dailyGold: 750 }, desc: 'Тяжёлая бархатная сума каждый рассвет приносит в казну 750 золотых.' },
    { id: 'endless_sack_gold', name: 'Бездонный мешок золота', tier: 3, stats: { dailyGold: 1000 }, desc: 'Купеческий мешок с золотом каждый рассвет приносит в казну 1000 золотых.' },
    { id: 'ultimate_sword_dominion', name: 'Меч Господства', tier: 4, ultimate: true, stats: { atk: 12 }, desc: 'Конечный Артефакт Рыцарей. Увеличивает Атаку полководца на +12.' },
    { id: 'ultimate_cloak', name: 'Плащ Несокрушимости', tier: 4, ultimate: true, stats: { def: 12 }, desc: 'Конечный Артефакт Варваров. Увеличивает Защиту полководца на +12.' },
    { id: 'ultimate_book', name: 'Книга Высшей Мудрости', tier: 4, ultimate: true, stats: { knowledge: 12 }, desc: 'Конечный Артефакт Волшебниц. Увеличивает Знание полководца на +12.' },
    { id: 'ultimate_wand', name: 'Жезл Всемогущества', tier: 4, ultimate: true, stats: { power: 12 }, desc: 'Конечный Артефакт Чернокнижников. Увеличивает Силу магии полководца на +12.' }
  ];

  const ARTIFACTS = {};
  for (const a of ARTIFACT_LIST) ARTIFACTS[a.id] = a;

  const HERO_PROFILE_LIST = [
    { id: 'lord_kilburn', name: 'Лорд Килбурн', faction: 'knight', hair: '#b88848', armor: '#3868b8', startArmy: [['peasant', 30], ['archer', 4]] },
    { id: 'sir_gallant', name: 'Сэр Галлант', faction: 'knight', hair: '#684828', armor: '#4878c8', startArmy: [['peasant', 35], ['archer', 3]] },
    { id: 'ector', name: 'Эктор', faction: 'knight', hair: '#9898a0', armor: '#788898', startArmy: [['peasant', 40], ['pikeman', 2]] },
    { id: 'gwenneth', name: 'Гвеннет', faction: 'knight', hair: '#e8c058', armor: '#2858a8', startArmy: [['peasant', 28], ['archer', 5]] },
    { id: 'tyro', name: 'Тиро', faction: 'knight', hair: '#483020', armor: '#5878a8', startArmy: [['peasant', 32], ['archer', 4]] },
    { id: 'ambrose', name: 'Амброуз', faction: 'knight', hair: '#c85828', armor: '#8898b0', startArmy: [['peasant', 36], ['pikeman', 2]] },
    { id: 'ruby', name: 'Руби', faction: 'knight', hair: '#b82828', armor: '#a83838', startArmy: [['peasant', 25], ['archer', 6]] },
    { id: 'maximus', name: 'Максимус', faction: 'knight', hair: '#302820', armor: '#c8a840', startArmy: [['peasant', 30], ['pikeman', 3]] },
    { id: 'dimitry', name: 'Дмитрий', faction: 'knight', hair: '#785838', armor: '#385888', startArmy: [['peasant', 34], ['archer', 4]] },

    { id: 'thundax', name: 'Тундакс', faction: 'barbarian', hair: '#282018', armor: '#885830', startArmy: [['goblin', 20], ['orc', 3]] },
    { id: 'fineous', name: 'Финеус', faction: 'barbarian', hair: '#a84820', armor: '#784828', startArmy: [['goblin', 24], ['orc', 2]] },
    { id: 'jojosh', name: 'Джоджош', faction: 'barbarian', hair: '#383028', armor: '#687838', startArmy: [['goblin', 18], ['orc', 4]] },
    { id: 'crag_hack', name: 'Крэг Хэк', faction: 'barbarian', hair: '#583820', armor: '#983828', startArmy: [['goblin', 22], ['wolf', 2]] },
    { id: 'jezebel', name: 'Иезавель', faction: 'barbarian', hair: '#d84828', armor: '#883848', startArmy: [['goblin', 16], ['orc', 5]] },
    { id: 'jaclyn', name: 'Жаклин', faction: 'barbarian', hair: '#e0b048', armor: '#785838', startArmy: [['goblin', 20], ['orc', 3]] },
    { id: 'ergon', name: 'Эргон', faction: 'barbarian', hair: '#484848', armor: '#586848', startArmy: [['goblin', 25], ['wolf', 1]] },
    { id: 'tsabu', name: 'Тсабу', faction: 'barbarian', hair: '#181818', armor: '#a87830', startArmy: [['goblin', 19], ['orc', 4]] },
    { id: 'atlas', name: 'Атлас', faction: 'barbarian', hair: '#886840', armor: '#684830', startArmy: [['goblin', 22], ['orc', 3]] },

    { id: 'astra', name: 'Астра', faction: 'sorceress', hair: '#f0d868', armor: '#388858', startArmy: [['sprite', 12], ['dwarf', 3]] },
    { id: 'natasha', name: 'Наташа', faction: 'sorceress', hair: '#c84828', armor: '#287868', startArmy: [['sprite', 14], ['dwarf', 2]] },
    { id: 'troyan', name: 'Троян', faction: 'sorceress', hair: '#785838', armor: '#488838', startArmy: [['sprite', 10], ['dwarf', 4]] },
    { id: 'vatawna', name: 'Ватавна', faction: 'sorceress', hair: '#282030', armor: '#684898', startArmy: [['sprite', 15], ['elf', 2]] },
    { id: 'rebecca', name: 'Ребекка', faction: 'sorceress', hair: '#d89038', armor: '#286898', startArmy: [['sprite', 12], ['dwarf', 3]] },
    { id: 'gem', name: 'Джем', faction: 'sorceress', hair: '#4898d8', armor: '#389868', startArmy: [['sprite', 14], ['elf', 2]] },
    { id: 'ariel', name: 'Ариэль', faction: 'sorceress', hair: '#d83838', armor: '#4878b8', startArmy: [['sprite', 13], ['dwarf', 3]] },
    { id: 'carlawn', name: 'Карлоун', faction: 'sorceress', hair: '#b8b8c8', armor: '#287848', startArmy: [['sprite', 11], ['dwarf', 4]] },
    { id: 'luna', name: 'Луна', faction: 'sorceress', hair: '#f8e898', armor: '#8848a8', startArmy: [['sprite', 16], ['dwarf', 2]] },

    { id: 'agar', name: 'Агар', faction: 'warlock', hair: '#586878', armor: '#482858', startArmy: [['centaur', 12], ['gargoyle', 3]] },
    { id: 'barok', name: 'Барок', faction: 'warlock', hair: '#282020', armor: '#682828', startArmy: [['centaur', 14], ['gargoyle', 2]] },
    { id: 'kastore', name: 'Кастор', faction: 'warlock', hair: '#883828', armor: '#383858', startArmy: [['centaur', 10], ['gargoyle', 4]] },
    { id: 'wrathmont', name: 'Вратмонт', faction: 'warlock', hair: '#482818', armor: '#581838', startArmy: [['centaur', 13], ['gargoyle', 3]] },
    { id: 'zarek', name: 'Зарек', faction: 'warlock', hair: '#c8c8d0', armor: '#282848', startArmy: [['centaur', 12], ['gargoyle', 3]] },
    { id: 'krios', name: 'Криос', faction: 'warlock', hair: '#385878', armor: '#483868', startArmy: [['centaur', 15], ['gargoyle', 2]] },
    { id: 'falagar', name: 'Фалагар', faction: 'warlock', hair: '#684828', armor: '#782838', startArmy: [['centaur', 11], ['gargoyle', 4]] },
    { id: 'varkas', name: 'Варкас', faction: 'warlock', hair: '#202028', armor: '#583828', startArmy: [['centaur', 14], ['gargoyle', 2]] },
    { id: 'sandro', name: 'Сандро', faction: 'warlock', hair: '#d8d8c8', armor: '#301840', startArmy: [['centaur', 12], ['gargoyle', 3]] }
  ];

  const HERO_PROFILES = {};
  for (const p of HERO_PROFILE_LIST) HERO_PROFILES[p.id] = p;

  const MAP_OBJECTS = {
    chest: { id: 'chest', name: 'Сундук с сокровищами', desc: 'Позволяет забрать золото в казну королевства или раздать богатства войску ради опыта.' },
    campfire: { id: 'campfire', name: 'Костёр', desc: 'Брошенный лагерь путников: даёт золото и несколько единиц случайного ресурса.' },
    resource_pile: { id: 'resource_pile', name: 'Куча ресурсов', desc: 'Запас стройматериалов или драгоценных камней на дороге.' },
    windmill: { id: 'windmill', name: 'Ветряная мельница', desc: 'Раз в неделю мельник отсыпает 2 единицы случайного редкого ресурса.' },
    water_wheel: { id: 'water_wheel', name: 'Водяное колесо', desc: 'Раз в неделю приносит казне 500 или 1000 золотых.' },
    gazebo: { id: 'gazebo', name: 'Беседка знаний', desc: 'Старый наставник обучает каждого пришедшего героя (+1000 опыта один раз за игру).' },
    fort: { id: 'fort', name: 'Форт на холме', desc: 'Военный лагерь повышает Атаку или Защиту героя на +1.' },
    canyon: { id: 'canyon', name: 'Каньон чародеев', desc: 'Магический источник повышает Силу магии или Знание героя на +1.' },
    xanadu: { id: 'xanadu', name: 'Ксанаду', desc: 'Древний дворец мудрецов повышает все четыре параметра героя на +1.' },
    shrine: { id: 'shrine', name: 'Святилище магии', desc: 'Каменный алтарь открывает герою с Книгой заклинаний одно заклинание 1..3 круга.' },
    obelisk: { id: 'obelisk', name: 'Обелиск', desc: 'Открывает фрагмент карты-головоломки, указывающей место раскопок Конечного Артефакта.' },
    fountain: { id: 'fountain', name: 'Фонтан удачи', desc: 'Глоток родниковой воды повышает Удачу армии на +1 до следующего боя.' },
    oasis: { id: 'oasis', name: 'Оазис', desc: 'Поит коней в пустыне: даёт +1 к боевому духу и +800 очков хода на текущий день.' },
    watering_hole: { id: 'watering_hole', name: 'Водопой', desc: 'Освежает отряды: даёт +1 к боевому духу и +400 очков хода.' },
    temple: { id: 'temple', name: 'Храм', desc: 'Благословение священников повышает боевой дух отрядов на +2 до следующего боя.' },
    graveyard: { id: 'graveyard', name: 'Кладбище', desc: 'После победы над стражами даёт золото и артефакт, однако грабёж могил снижает дух войск.' },
    shipwreck: { id: 'shipwreck', name: 'Кораблекрушение', desc: 'Трюм полон золота и реликвий под охраной Призраков.' },
    daemon_cave: { id: 'daemon_cave', name: 'Пещера демона', desc: 'Таит опыт, золото или выкуп за жизнь героя.' },
    dragon_utopia: { id: 'dragon_utopia', name: 'Город Драконов', desc: 'Цитадель древних змеев: за победу даёт огромную казну и лучшие артефакты.' },
    sphinx: { id: 'sphinx', name: 'Сфинкс', desc: 'Загадывает загадку. Верный ответ приносит казну и реликвию.' },
    signpost: { id: 'signpost', name: 'Дорожный знак', desc: 'Указатель для путников на развилке дорог.' },
    watchtower: { id: 'watchtower', name: 'Смотровая башня', desc: 'Рассеивает туман войны в радиусе 10 клеток.' },
    observatory: { id: 'observatory', name: 'Обсерватория из секвойи', desc: 'Рассеивает туман войны в радиусе 20 клеток.' },
    lighthouse: { id: 'lighthouse', name: 'Маяк', desc: 'Увеличивает суточный ход всех кораблей владельца на +500 очков.' },
    teleporter: { id: 'teleporter', name: 'Каменный монолит', desc: 'Мгновенно переносит героя к парному монолиту того же цвета.' }
  };

  const SPHINX_RIDDLES = [
    {
      q: 'Утром ходит на четырёх ногах, днём на двух, а вечером на трёх. Кто это?',
      options: ['Человек', 'Сфинкс', 'Грифон'],
      answer: 0
    },
    {
      q: 'Чем больше из неё берёшь, тем больше она становится. Что это?',
      options: ['Казна', 'Яма', 'Река'],
      answer: 1
    },
    {
      q: 'Летит без крыльев, плачет без глаз. Что это?',
      options: ['Стрела', 'Туча', 'Призрак'],
      answer: 1
    },
    {
      q: 'Кормишь его, и он живёт; напоишь водой, и он умирает. Что это?',
      options: ['Огонь', 'Дракон', 'Песок'],
      answer: 0
    }
  ];

  const TAVERN_RUMORS = [
    'Старики говорят, что Конечный Артефакт зарыт там, где сходятся знаки всех обелисков.',
    'Драконы Чёрной башни презирают любую магию, включая заклинание Армагеддона.',
    'Тот, кто поведёт крестьян на курган с Призраками, только умножит войско мертвецов.',
    'Под флагом Королевы Ламанды парусные корабли идут по морю вдвое быстрее.',
    'Войска Лорда Слейера проходят топи и глубокие снега так же ходко, как степную траву.',
    'Колодец во дворе замка каждую неделю прибавляет по два воина в каждом жилище.'
  ];

  function recalcHeroStats(hero) {
    if (!hero) return hero;
    const base = hero.baseStats || { atk: 1, def: 1, power: 1, knowledge: 1 };
    let atk = base.atk, def = base.def, power = base.power, knowledge = base.knowledge;
    let morale = hero.tempMorale || 0;
    let luck = hero.tempLuck || 0;
    let moveLandBonus = 0, moveSeaBonus = 0, dailyGold = 0;

    for (const artId of hero.artifacts || []) {
      const a = ARTIFACTS[artId];
      if (!a || !a.stats) continue;
      if (a.stats.atk) atk += a.stats.atk;
      if (a.stats.def) def += a.stats.def;
      if (a.stats.power) power += a.stats.power;
      if (a.stats.knowledge) knowledge += a.stats.knowledge;
      if (a.stats.morale) morale += a.stats.morale;
      if (a.stats.luck) luck += a.stats.luck;
      if (a.stats.moveLand) moveLandBonus += a.stats.moveLand;
      if (a.stats.moveSea) moveSeaBonus += a.stats.moveSea;
      if (a.stats.dailyGold) dailyGold += a.stats.dailyGold;
    }

    const factionsInArmy = new Set();
    let hasUndead = false;
    let slowestSpeed = 'fast';
    let slowestIdx = H.SPEED_ORDER.indexOf('fast');

    for (const slot of hero.army || []) {
      if (!slot || slot.count <= 0) continue;
      const u = H.UNITS[slot.unit];
      if (!u) continue;
      factionsInArmy.add(u.faction);
      if (u.undead) hasUndead = true;
      const idx = H.SPEED_ORDER.indexOf(u.speed);
      if (idx >= 0 && idx < slowestIdx) {
        slowestIdx = idx;
        slowestSpeed = u.speed;
      }
    }

    if (factionsInArmy.size === 1) morale += 1;
    else if (factionsInArmy.size === 3) morale -= 1;
    else if (factionsInArmy.size >= 4) morale -= 2;
    if (hasUndead) morale -= 1;

    hero.atk = Math.max(0, atk);
    hero.def = Math.max(0, def);
    hero.power = Math.max(1, power);
    hero.knowledge = Math.max(1, knowledge);
    hero.morale = H.clamp(morale, -3, 3);
    hero.luck = H.clamp(luck, 0, 3);
    hero.moveLandBonus = moveLandBonus;
    hero.moveSeaBonus = moveSeaBonus;
    hero.dailyGold = dailyGold;
    hero.maxMove = (H.SPEED_MOVE_POINTS[slowestSpeed] || 1200) + moveLandBonus;
    return hero;
  }

  function createHero(profileId, owner, rng) {
    const prof = HERO_PROFILES[profileId] || HERO_PROFILE_LIST[0];
    const f = H.FACTIONS[prof.faction] || H.FACTIONS.knight;
    const r = rng || new H.RNG(77);
    const army = new Array(H.ARMY_SLOTS).fill(null);
    for (let i = 0; i < prof.startArmy.length && i < H.ARMY_SLOTS; i++) {
      const [uId, baseCnt] = prof.startArmy[i];
      const delta = Math.max(0, Math.floor(baseCnt * 0.15));
      const cnt = r.int(Math.max(1, baseCnt - delta), baseCnt + delta);
      army[i] = { unit: uId, count: cnt };
    }
    const hero = {
      id: prof.id,
      name: prof.name,
      faction: prof.faction,
      owner: owner || 'blue',
      x: 0,
      y: 0,
      inBoat: false,
      level: 1,
      xp: 0,
      baseStats: {
        atk: f.startStats.atk,
        def: f.startStats.def,
        power: f.startStats.power,
        knowledge: f.startStats.knowledge
      },
      hasSpellbook: !!f.startsWithSpellbook,
      spells: {},
      artifacts: [],
      army,
      tempMorale: 0,
      tempLuck: 0,
      visited: {}
    };
    recalcHeroStats(hero);
    hero.move = hero.maxMove;
    if (f.startingSpell) {
      H.learnAndReplenishSpell(hero, f.startingSpell);
    }
    return hero;
  }

  function grantHeroXp(hero, amount, rng) {
    if (!hero || amount <= 0) return [];
    hero.xp = (hero.xp || 0) + amount;
    const levelUps = [];
    while (H.levelForXp(hero.xp) > hero.level) {
      hero.level++;
      const stat = H.rollLevelUpStat(hero.faction, rng);
      hero.baseStats[stat] = (hero.baseStats[stat] || 0) + 1;
      levelUps.push({ level: hero.level, stat });
    }
    if (levelUps.length) recalcHeroStats(hero);
    return levelUps;
  }

  function giveHeroArtifact(hero, artifactId) {
    if (!hero || !ARTIFACTS[artifactId]) return false;
    if (!hero.artifacts) hero.artifacts = [];
    if (hero.artifacts.length >= H.ARTIFACT_SLOTS) return false;
    hero.artifacts.push(artifactId);
    recalcHeroStats(hero);
    return true;
  }

  Object.assign(H, {
    ARTIFACT_LIST,
    ARTIFACTS,
    HERO_PROFILE_LIST,
    HERO_PROFILES,
    MAP_OBJECTS,
    SPHINX_RIDDLES,
    TAVERN_RUMORS,
    recalcHeroStats,
    createHero,
    grantHeroXp,
    giveHeroArtifact
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
