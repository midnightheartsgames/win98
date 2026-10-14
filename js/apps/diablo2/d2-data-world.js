(function (D) {
  'use strict';

  const AREAS = {
    town: { name: 'Лагерь разбойниц', lvl: [0, 0, 0], gen: 'town', w: 64, h: 64, theme: 'camp', wp: true, town: true, music: 'town', links: [{ to: 'bloodmoor', side: 'e' }] },
    bloodmoor: { name: 'Кровавая пустошь', lvl: [1, 36, 67], gen: 'outdoor', w: 80, h: 96, theme: 'moor', music: 'wild', links: [{ to: 'town', side: 'w' }, { to: 'coldplains', side: 'n' }], features: [{ type: 'cave', to: 'den', label: 'Логово зла' }], mon: ['zombie', 'fallen', 'shaman', 'quill_rat'], dens: 0.9 },
    den: { name: 'Логово зла', lvl: [1, 36, 67], gen: 'cave', w: 58, h: 58, theme: 'cave', music: 'cave', up: 'bloodmoor', mon: ['fallen', 'shaman', 'zombie', 'quill_rat'], su: 'corpsefire', dens: 1.25, quest: 'den' },
    coldplains: { name: 'Холодные равнины', lvl: [2, 36, 68], gen: 'outdoor', w: 88, h: 96, theme: 'plains', music: 'wild', wp: true, links: [{ to: 'bloodmoor', side: 's' }, { to: 'stonyfield', side: 'n' }, { to: 'burial', side: 'e' }], mon: ['fallen', 'shaman', 'quill_rat', 'zombie', 'dark_hunter'], su: 'bishibosh', dens: 0.9 },
    burial: { name: 'Кладбище', lvl: [3, 36, 69], gen: 'outdoor', w: 56, h: 60, theme: 'burial', music: 'wild', links: [{ to: 'coldplains', side: 'w' }], features: [{ type: 'graves' }], mon: ['zombie', 'skeleton', 'ghost'], su: 'blood_raven', dens: 1.0 },
    stonyfield: { name: 'Каменистое поле', lvl: [4, 37, 70], gen: 'outdoor', w: 92, h: 92, theme: 'stony', music: 'wild', wp: true, links: [{ to: 'coldplains', side: 's' }, { to: 'darkwood', side: 'n' }], features: [{ type: 'cairn', label: 'Камни Каирна' }, { type: 'tome' }], mon: ['fallen', 'shaman', 'beast', 'quill_rat', 'zombie'], su: 'rakanishu', dens: 0.9 },
    darkwood: { name: 'Тёмный лес', lvl: [5, 38, 70], gen: 'outdoor', w: 92, h: 92, theme: 'wood', music: 'wild', wp: true, links: [{ to: 'stonyfield', side: 's' }, { to: 'blackmarsh', side: 'e' }], features: [{ type: 'inifuss', label: 'Древо Инифус' }], mon: ['beast', 'fallen', 'shaman', 'dark_hunter', 'dark_archer', 'bat'], su: 'treehead', dens: 0.95 },
    tristram: { name: 'Тристрам', lvl: [6, 39, 76], gen: 'tristram', w: 64, h: 64, theme: 'tristram', music: 'tristram', mon: ['zombie', 'fallen', 'shaman', 'dark_hunter'], su: 'griswold', dens: 1.0 },
    blackmarsh: { name: 'Чёрное болото', lvl: [6, 38, 71], gen: 'outdoor', w: 92, h: 92, theme: 'marsh', music: 'wild', wp: true, links: [{ to: 'darkwood', side: 'w' }, { to: 'tamoe', side: 'n' }], features: [{ type: 'tower', to: 'tower1', label: 'Забытая башня' }], mon: ['goatman', 'dark_hunter', 'dark_archer', 'skeleton', 'bat', 'zombie'], dens: 0.95 },
    tower1: { name: 'Забытая башня: подвал 1', lvl: [7, 42, 79], gen: 'rooms', w: 60, h: 60, theme: 'tower', music: 'dungeon', up: 'blackmarsh', down: 'tower2', mon: ['ghost', 'skeleton', 'skel_archer', 'bat', 'goatman'], dens: 1.1 },
    tower2: { name: 'Забытая башня: подвал 2', lvl: [8, 43, 79], gen: 'rooms', w: 56, h: 56, theme: 'tower', music: 'dungeon', up: 'tower1', mon: ['ghost', 'skeleton', 'skel_archer'], su: 'countess', dens: 1.1 },
    tamoe: { name: 'Высокогорье Тамо', lvl: [8, 39, 72], gen: 'outdoor', w: 92, h: 92, theme: 'highland', music: 'wild', links: [{ to: 'blackmarsh', side: 's' }, { to: 'barracks', side: 'n', gate: true }], mon: ['goatman', 'yeti', 'dark_hunter', 'dark_archer', 'spearwoman', 'bat'], dens: 0.95 },
    barracks: { name: 'Казармы', lvl: [9, 40, 73], gen: 'rooms', w: 72, h: 72, theme: 'monastery', music: 'dungeon', wp: true, up: 'tamoe', upGate: true, down: 'jail', mon: ['spearwoman', 'dark_hunter', 'dark_archer', 'goatman', 'yeti', 'tainted'], su: 'smith', malus: true, dens: 1.05 },
    jail: { name: 'Тюрьма', lvl: [10, 41, 74], gen: 'rooms', w: 68, h: 68, theme: 'jail', music: 'dungeon', wp: true, up: 'barracks', down: 'cathedral', mon: ['tainted', 'ghost', 'spearwoman', 'dark_archer', 'skeleton'], su: 'pitspawn', dens: 1.05 },
    cathedral: { name: 'Собор', lvl: [11, 42, 75], gen: 'cathedral', w: 60, h: 60, theme: 'cathedral', music: 'dungeon', wp: true, up: 'jail', down: 'catacombs1', mon: ['skeleton', 'skel_mage', 'ghost', 'dark_hunter', 'tainted'], su: 'bone_ash', dens: 1.0 },
    catacombs1: { name: 'Катакомбы: уровень 1', lvl: [11, 43, 76], gen: 'rooms', w: 68, h: 68, theme: 'catacombs', music: 'dungeon', up: 'cathedral', down: 'catacombs2', mon: ['ghost', 'tainted', 'skeleton', 'skel_archer', 'bat', 'dark_hunter'], dens: 1.1 },
    catacombs2: { name: 'Катакомбы: уровень 2', lvl: [12, 44, 78], gen: 'rooms', w: 68, h: 68, theme: 'catacombs', music: 'dungeon', wp: true, up: 'catacombs1', down: 'lair', mon: ['ghost', 'tainted', 'skel_mage', 'spearwoman', 'goatman', 'bat'], dens: 1.1 },
    lair: { name: 'Логово Андариэль', lvl: [13, 45, 79], gen: 'lair', w: 52, h: 60, theme: 'lair', music: 'boss', up: 'catacombs2', mon: ['dark_hunter', 'spearwoman', 'tainted'], su: 'andariel', dens: 0.6 }
  };
  for (const k in AREAS) AREAS[k].id = k;

  const WAYPOINTS = ['town', 'coldplains', 'stonyfield', 'darkwood', 'blackmarsh', 'barracks', 'jail', 'cathedral', 'catacombs2'];

  const THEMES = {
    camp: { base: 'grass', alt: 'dirt', altAmt: 0.42, road: 'dirt', edge: 'trees', ambient: 0.32, tint: '#1a1410' },
    moor: { base: 'grass', alt: 'dirt', altAmt: 0.36, road: 'road', edge: 'cliff', obst: ['tree', 'deadtree', 'rock', 'bush', 'fence'], odens: 0.024, ambient: 0.42, tint: '#140e10' },
    plains: { base: 'grassl', alt: 'dirt', altAmt: 0.4, road: 'road', edge: 'cliff', obst: ['tree', 'rock', 'bush', 'fence', 'fence'], odens: 0.022, ambient: 0.38, tint: '#12100c' },
    burial: { base: 'deadgrass', alt: 'dirt', altAmt: 0.55, road: 'dirt', edge: 'wall', obst: ['grave', 'grave', 'deadtree', 'rock'], odens: 0.035, ambient: 0.55, tint: '#0c0c14' },
    stony: { base: 'grass', alt: 'stone', altAmt: 0.34, road: 'road', edge: 'cliff', obst: ['rock', 'rock', 'bigrock', 'bush', 'tree'], odens: 0.03, ambient: 0.4, tint: '#12100e' },
    wood: { base: 'darkgrass', alt: 'moss', altAmt: 0.4, road: 'dirt', edge: 'trees', obst: ['tree', 'tree', 'tree', 'deadtree', 'bush'], odens: 0.06, ambient: 0.55, tint: '#08100a' },
    marsh: { base: 'mud', alt: 'darkgrass', altAmt: 0.45, road: 'dirt', edge: 'trees', obst: ['deadtree', 'deadtree', 'reed', 'rock'], odens: 0.028, water: 0.3, ambient: 0.52, tint: '#0a100c' },
    highland: { base: 'grassl', alt: 'stone', altAmt: 0.38, road: 'road', edge: 'cliff', obst: ['rock', 'bigrock', 'tree', 'bush', 'fence'], odens: 0.026, ambient: 0.42, tint: '#101014' },
    tristram: { base: 'ash', alt: 'cobble', altAmt: 0.45, road: 'cobble', edge: 'trees', obst: ['deadtree', 'rubble'], odens: 0.01, ambient: 0.5, tint: '#140a08' },
    cave: { floor: 'cavefloor', wall: 'cave', ambient: 0.88, tint: '#000000', light: 7 },
    tower: { floor: 'flag', wall: 'brick', ambient: 0.86, tint: '#000000', light: 7 },
    monastery: { floor: 'tiles', wall: 'monastery', ambient: 0.8, tint: '#000000', light: 7.5 },
    jail: { floor: 'flag', wall: 'jail', ambient: 0.84, tint: '#000000', light: 7 },
    cathedral: { floor: 'tiles', wall: 'monastery', ambient: 0.74, tint: '#000000', light: 8 },
    catacombs: { floor: 'catafloor', wall: 'catacomb', ambient: 0.9, tint: '#000000', light: 6.5 },
    lair: { floor: 'catafloor', wall: 'catacomb', ambient: 0.82, tint: '#100004', light: 7 }
  };

  const NPCS = {
    akara: { name: 'Акара', model: 'akara', title: 'Верховная жрица', shop: 'akara', heals: true, wander: 1.5 },
    charsi: { name: 'Чарси', model: 'charsi', title: 'Кузнец', shop: 'charsi', repair: true, wander: 1.2 },
    gheed: { name: 'Гид', model: 'gheed', title: 'Торговец', shop: 'gheed', gamble: true, wander: 1.5 },
    kashya: { name: 'Кашья', model: 'kashya', title: 'Командир разбойниц', hire: true, wander: 2 },
    warriv: { name: 'Варрив', model: 'warriv', title: 'Караванщик', wander: 1.5 },
    cain: { name: 'Декард Каин', model: 'cain', title: 'Последний из хорадримов', identify: true, wander: 1.2 },
    flavie: { name: 'Флави', model: 'rogue', title: 'Дозорная', wander: 0.5 }
  };

  const QUESTS = [
    {
      id: 'den', name: 'Логово зла', giver: 'akara',
      log: ['Поговорите с Акарой в лагере разбойниц.', 'Акара просит очистить Логово зла — пещеру в Кровавой пустоши. Убейте всех чудовищ внутри.', 'Логово зла очищено. Вернитесь к Акаре за наградой.', 'Задание выполнено. Акара даровала вам очко навыка.']
    },
    {
      id: 'burial', name: 'Кладбище сестёр', giver: 'kashya',
      log: ['Поговорите с Кашьей в лагере разбойниц.', 'Кашья просит убить Кровавого Ворона — падшую лучницу, что поднимает мёртвых на Кладбище за Холодными равнинами.', 'Кровавый Ворон мертва. Вернитесь к Кашье.', 'Задание выполнено. Кашья даст вам разбойницу-наёмницу бесплатно.']
    },
    {
      id: 'cain', name: 'В поисках Каина', giver: 'akara',
      log: ['Поговорите с Акарой.', 'Акара просит найти Свиток Инифуса. Древо Инифус растёт в Тёмном лесу.', 'Свиток у вас. Отнесите его Акаре.', 'Коснитесь Камней Каирна на Каменистом поле в порядке, указанном в свитке.', 'Портал в Тристрам открыт. Найдите и освободите Декарда Каина.', 'Каин спасён. Поговорите с ним в лагере.', 'Задание выполнено. Каин бесплатно опознаёт ваши предметы.']
    },
    {
      id: 'tower', name: 'Забытая башня', giver: null,
      log: ['Найдите заплесневелый фолиант на Каменистом поле.', 'Фолиант говорит о Графине, замурованной в подвалах Забытой башни на Чёрном болоте. Найдите её.', 'Задание выполнено. Сокровища Графини — ваши.']
    },
    {
      id: 'tools', name: 'Орудия труда', giver: 'charsi',
      log: ['Поговорите с Чарси.', 'Чарси просит вернуть Молот Хорадрима. Он лежит в Казармах монастыря, его стережёт Кузнец.', 'Молот у вас. Верните его Чарси.', 'Чарси готова наложить чары на обычную вещь по вашему выбору.', 'Задание выполнено.']
    },
    {
      id: 'andariel', name: 'Сёстры на заклание', giver: 'kashya',
      log: ['Андариэль скрывается в Катакомбах под собором монастыря.', 'Спуститесь в Катакомбы и убейте Андариэль, Деву Мук.', 'Андариэль мертва. Поговорите с Варривом, чтобы отправиться на восток.', 'Задание выполнено. Путь на восток открыт.']
    }
  ];
  const QUEST_MAP = {};
  for (const q of QUESTS) QUEST_MAP[q.id] = q;

  const TALK = {
    akara: {
      intro: 'Я — Акара, верховная жрица Сестёр Незрячего Ока. Добро пожаловать в наш лагерь, странник, хотя гостеприимства у нас осталось немного. Андариэль, Дева Мук, осквернила наш монастырь и обратила сестёр против нас. Те, кто уцелел, укрылись здесь, за частоколом. Если ты пришёл с миром — помоги нам, и Око не забудет твоей доброты.',
      den1: 'Я чувствую, как тьма сгущается к востоку от лагеря. В Кровавой пустоши есть пещера — Логово зла. Там гнездятся твари, пришедшие вслед за Андариэль. Очисти пещеру до последнего чудовища, и я открою тебе одно из наших таинств.',
      den2: 'Ты справился! Тьма отступила, пусть и ненадолго. Прими наш дар — знание, что сделает тебя сильнее.',
      cain1: 'Незрячее Око послало мне видение. Декард Каин, последний из хорадримов, жив — он в плену в руинах Тристрама. Путь туда откроет лишь круг Камней Каирна на Каменистом поле. Порядок, в котором их надо коснуться, записан на Свитке Инифуса. Древо Инифус растёт в Тёмном лесу. Принеси мне этот свиток.',
      cain2: 'Этот язык давно забыт... но Око видит сквозь века. Вот, я записала для тебя порядок рун. Иди на Каменистое поле и коснись камней в указанном порядке — и портал в Тристрам откроется.',
      cain3: 'Каин в безопасности, в нашем лагере. Ты сделал больше, чем мы смели просить.',
      tower: 'Графиня... Я слышала эту историю. Говорят, она купалась в крови девушек, чтобы сохранить молодость. Её замуровали в башне, но зло не умирает так просто.',
      gossip: ['Мы, Сёстры, веками хранили врата в Преисподнюю. Теперь врата открыты, а мы прячемся в лесу.', 'Береги себя, странник. Здесь, в лагере, ты в безопасности — а за частоколом каждое мгновение может стать последним.'],
      heal: 'Око исцелило тебя.'
    },
    charsi: {
      intro: 'Привет, я Чарси, кузнец лагеря. Если надо починить снаряжение или подобрать что-то покрепче — заходи. Только не проси меня выйти за частокол, я там уже была.',
      tools1: 'Когда нас изгнали из монастыря, я бросила там самое дорогое — Молот Хорадрима. Он остался в Казармах, за вратами монастыря, а стережёт его чудовищный Кузнец. Вернёшь мне молот — и я вложу в одну из твоих вещей особые чары.',
      tools2: 'Мой молот! Ты вернул его! Выбери любую обычную вещь — я вложу в неё силу, и она станет редкой.',
      tools3: 'Отлично получилось! Носи с гордостью.',
      gossip: ['Кашья вечно ворчит, но на неё можно положиться. А вот Гиду я бы не доверила и гвоздя.', 'Разбойницы учились у меня ковать наконечники. Жаль, что многие из них теперь по ту сторону.']
    },
    gheed: {
      intro: 'Добро пожаловать, друг мой! Гид всегда рад покупателю. Видишь эти сундуки? В каждом — удача. Или неудача. Попробуешь — узнаешь.',
      gossip: ['Караван Варрива стоит тут уже неделю. Для меня это отличная новость — конкуренции никакой.', 'Говорят, в Тристраме остались несметные сокровища. Я бы и сам сходил, но... спина, понимаешь.']
    },
    kashya: {
      intro: 'Я Кашья, командир разбойниц. Не жди тёплого приёма. Пока ты не докажешь, что тебе можно доверять, я буду приглядывать за тобой.',
      burial1: 'Слушай внимательно. Одна из наших лучших лучниц, Кровавый Ворон, стала жертвой Андариэль. Теперь она бродит по Кладбищу к востоку от Холодных равнин и поднимает мёртвых сестёр. Убей её. Сделаешь это — и мои разбойницы будут служить тебе.',
      burial2: 'Значит, Кровавый Ворон мертва. Мне горько это слышать, но так было нужно. Ты доказал, что достоин доверия. Одна из моих разбойниц пойдёт с тобой, бесплатно.',
      andariel: 'Андариэль засела в Катакомбах под собором монастыря. Пока она жива, наши сёстры — её рабыни. Убей её, и орден будет свободен.',
      gossip: ['Мои разбойницы стреляют лучше любого мужчины. Можешь проверить — за плату.']
    },
    warriv: {
      intro: 'Приветствую, путник. Я Варрив, караванщик. Мой караван застрял здесь: Андариэль перекрыла единственный перевал на восток, в Лут Голейн.',
      andariel2: 'Ты убил Андариэль! Перевал открыт. Мой караван готов отправиться на восток, как только пожелаешь.',
      gossip: ['В Лут Голейне меня ждут шёлк и специи. А здесь — только грязь да демоны.']
    },
    cain: {
      intro: 'Благодарю тебя, друг. Я, Декард Каин, в долгу перед тобой. Я знаю многое о древних вещах. Принеси мне предмет с неведомыми свойствами — я опознаю его бесплатно.',
      rescue: 'Слава Свету! Ты спас меня! Не теряй времени — уходи из этого проклятого места. Я найду дорогу в лагерь разбойниц.',
      andariel: 'Андариэль — одна из четырёх Меньших Зол. Её присутствие отравляет всё вокруг. Будь осторожен — её яд смертелен.',
      gossip: ['Тёмный странник, что прошёл через Тристрам, — это Диабло, Владыка Ужаса. Он идёт на восток, к брату своему Баалу.', 'Хорадрим много веков назад заточил Первичных Зол в камни души. Похоже, наши труды пошли прахом.']
    },
    flavie: {
      intro: 'Стой! А, ты с нами... Проходи. Дальше — Кровавая пустошь. Не отходи далеко от лагеря, пока не освоишься.',
      gossip: ['Я видела, как падшие собираются стаями к востоку. Шаманы поднимают их снова и снова — бей шамана первым.']
    }
  };

  const MERC_NAMES = ['Лиана', 'Кесса', 'Мира', 'Тэя', 'Ильва', 'Сарина', 'Вега', 'Одри', 'Рина', 'Алетта', 'Нара', 'Эйла'];

  const CAIRN_RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ'];

  Object.assign(D, { AREAS, WAYPOINTS, THEMES, NPCS, QUESTS, QUEST_MAP, TALK, MERC_NAMES, CAIRN_RUNES });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
