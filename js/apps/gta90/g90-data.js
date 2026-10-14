(function (G) {
  'use strict';

  const C = {
    white: '#e6e2d6', red: '#b02424', cherry: '#6a1422', eggplant: '#3c1f3e', green: '#3a6a4c', beige: '#d6c68e',
    teal: '#1e4c5c', blue: '#2a4a8c', sea: '#2a7c8a', ochre: '#c89030', black: '#18181a', grey: '#8a8c90',
    olive: '#5a6a38', orange: '#d06a20', sky: '#7aa8d0', cream: '#e8dcb0', brown: '#6a4424', yellow: '#e8c440'
  };

  const VEHICLES = {
    vaz2101: { name: 'ВАЗ-2101 «Копейка»', shape: 'sedan', L: 38, W: 17, max: 300, acc: 175, turn: 2.7, grip: 9, mass: 1, hp: 100, value: 4000, colors: [C.white, C.red, C.beige, C.eggplant, C.sky, C.green] },
    vaz2106: { name: 'ВАЗ-2106 «Шестёрка»', shape: 'sedan', L: 39, W: 17, max: 320, acc: 185, turn: 2.7, grip: 9, mass: 1, hp: 100, value: 6000, colors: [C.white, C.cherry, C.teal, C.ochre, C.blue, C.beige] },
    vaz2108: { name: 'ВАЗ-2108 «Восьмёрка»', shape: 'hatch', L: 37, W: 17, max: 345, acc: 210, turn: 2.95, grip: 9.5, mass: 0.95, hp: 95, value: 9000, colors: [C.white, C.red, C.sea, C.black, C.cherry] },
    vaz2109: { name: 'ВАЗ-2109 «Девятка»', shape: 'hatch', L: 38, W: 17, max: 350, acc: 215, turn: 2.95, grip: 9.5, mass: 0.95, hp: 95, value: 10000, colors: [C.white, C.eggplant, C.sea, C.black] },
    moskvich412: { name: 'Москвич-412', shape: 'sedan', L: 39, W: 17, max: 295, acc: 165, turn: 2.6, grip: 8.5, mass: 1, hp: 105, value: 3500, colors: [C.orange, C.sky, C.white, C.green, C.beige] },
    moskvich2141: { name: 'Москвич-2141', shape: 'hatch', L: 40, W: 18, max: 320, acc: 180, turn: 2.7, grip: 9, mass: 1.05, hp: 105, value: 8000, colors: [C.white, C.red, C.blue, C.olive] },
    zaz968: { name: 'ЗАЗ-968 «Запорожец»', shape: 'zaz', L: 34, W: 16, max: 250, acc: 140, turn: 2.8, grip: 8.5, mass: 0.8, hp: 80, value: 1500, colors: [C.orange, C.sky, C.beige, C.green, C.white] },
    gaz24: { name: 'ГАЗ-24 «Волга»', shape: 'volga', L: 44, W: 19, max: 330, acc: 170, turn: 2.45, grip: 9, mass: 1.3, hp: 130, value: 15000, colors: [C.white, C.black, C.beige, C.grey, C.teal] },
    taxi: { name: 'ГАЗ-24 Такси', shape: 'volga', L: 44, W: 19, max: 330, acc: 170, turn: 2.45, grip: 9, mass: 1.3, hp: 130, value: 12000, colors: [C.yellow], taxi: true },
    gaz3102: { name: 'ГАЗ-3102 «Чёрная Волга»', shape: 'volga', L: 45, W: 19, max: 355, acc: 190, turn: 2.5, grip: 9.5, mass: 1.35, hp: 150, value: 25000, colors: [C.black] },
    uaz469: { name: 'УАЗ-469', shape: 'jeep', L: 37, W: 19, max: 280, acc: 175, turn: 2.6, grip: 10, mass: 1.25, hp: 140, value: 7000, colors: [C.olive, C.green, C.beige], offroad: true },
    police: { name: 'УАЗ-469 Милиция', shape: 'jeep', L: 37, W: 19, max: 330, acc: 200, turn: 2.7, grip: 10, mass: 1.3, hp: 150, value: 9000, colors: ['#e0e4ea'], police: true, offroad: true },
    gai: { name: 'ВАЗ-2106 ГАИ', shape: 'sedan', L: 39, W: 17, max: 350, acc: 205, turn: 2.8, grip: 9.5, mass: 1.05, hp: 120, value: 8000, colors: ['#e8eaf0'], police: true },
    kgb: { name: 'ГАЗ-3102 КГБ', shape: 'volga', L: 45, W: 19, max: 370, acc: 215, turn: 2.6, grip: 10, mass: 1.4, hp: 170, value: 26000, colors: [C.black], police: true, kgb: true },
    raf: { name: 'РАФ-2203 «Латвия»', shape: 'van', L: 46, W: 20, max: 280, acc: 150, turn: 2.3, grip: 8.5, mass: 1.6, hp: 140, value: 9000, colors: [C.white, C.orange, C.sky] },
    uaz452: { name: 'УАЗ-452 «Буханка»', shape: 'van', L: 42, W: 20, max: 260, acc: 150, turn: 2.4, grip: 9.5, mass: 1.5, hp: 150, value: 6000, colors: [C.olive, C.grey, C.white], offroad: true },
    cash: { name: 'УАЗ-452 Инкассация', shape: 'van', L: 42, W: 20, max: 290, acc: 160, turn: 2.4, grip: 9.5, mass: 2.2, hp: 260, value: 12000, colors: ['#4a5a4a'], armored: true },
    gaz53: { name: 'ГАЗ-53', shape: 'truck', L: 58, W: 22, max: 240, acc: 115, turn: 2.0, grip: 8.5, mass: 2.6, hp: 200, value: 8000, colors: [C.teal, C.blue, C.olive, C.orange] },
    zil130: { name: 'ЗИЛ-130', shape: 'truck', L: 62, W: 23, max: 250, acc: 110, turn: 1.9, grip: 8.5, mass: 3, hp: 220, value: 9000, colors: [C.sky, C.orange, C.teal, C.red] },
    kamaz: { name: 'КамАЗ-5320', shape: 'truck', L: 68, W: 24, max: 255, acc: 105, turn: 1.8, grip: 8.5, mass: 3.6, hp: 260, value: 14000, colors: [C.orange, C.blue, C.white] },
    liaz: { name: 'ЛиАЗ-677', shape: 'bus', L: 86, W: 25, max: 220, acc: 90, turn: 1.55, grip: 8, mass: 4.2, hp: 260, value: 10000, colors: [C.yellow, C.cream] },
    ikarus: { name: 'Икарус-260', shape: 'bus', L: 98, W: 25, max: 230, acc: 88, turn: 1.45, grip: 8, mass: 4.6, hp: 280, value: 12000, colors: ['#d8a020', '#c86a20', '#e0d8c0'] },
    ziu: { name: 'Троллейбус ЗиУ-682', shape: 'bus', L: 100, W: 25, max: 210, acc: 92, turn: 1.4, grip: 8, mass: 4.8, hp: 300, value: 11000, colors: ['#3a7aa0', '#c8b040', '#d8d4c4'], trolley: true },
    mercedes: { name: 'Мерседес-Бенц W124', shape: 'merc', L: 44, W: 19, max: 425, acc: 255, turn: 2.9, grip: 10.5, mass: 1.3, hp: 140, value: 45000, colors: [C.black, '#7a7e86', C.white, C.cherry] },
    java: { name: 'Ява-350', shape: 'bike', L: 22, W: 9, max: 385, acc: 300, turn: 3.6, grip: 8, mass: 0.35, hp: 60, value: 5000, colors: [C.red, C.cherry, C.blue], bike: true },
    t34: { name: 'Танк Т-34-85', shape: 'tank', L: 58, W: 30, max: 170, acc: 90, turn: 1.5, grip: 14, mass: 9, hp: 1500, value: 100000, colors: ['#4a5a36'], tank: true, offroad: true },
    kazanka: { name: 'Лодка «Казанка»', shape: 'boat', L: 42, W: 16, max: 300, acc: 150, turn: 2.2, grip: 2.2, mass: 0.8, hp: 90, value: 7000, colors: [C.white, C.sky, C.orange], boat: true },
    progulka: { name: 'Прогулочный катер', shape: 'raketa', L: 78, W: 22, max: 300, acc: 110, turn: 1.4, grip: 2.6, mass: 4, hp: 300, value: 30000, colors: [C.white], boat: true }
  };
  for (const [id, v] of Object.entries(VEHICLES)) {
    v.id = id;
    v.kind = v.boat ? 'boat' : v.tank ? 'tank' : v.bike ? 'bike' : (v.shape === 'truck' || v.shape === 'bus') ? 'heavy' : 'car';
    v.brake = v.brake || v.acc * 2.2;
    v.rev = v.rev || v.max * 0.35;
    v.short = v.short || v.name.replace(/\s*«.*»/, '');
  }

  const WEAPONS = {
    fist: { name: 'Кулаки', kind: 'melee', dmg: 12, rate: 0.42, range: 16, key: '1' },
    pm: { name: 'Пистолет Макарова', short: 'ПМ', kind: 'bullet', dmg: 26, rate: 0.36, speed: 950, spread: 0.035, range: 420, pickup: 36, key: '2' },
    obrez: { name: 'Обрез', short: 'Обрез', kind: 'bullet', dmg: 15, pellets: 6, rate: 0.95, speed: 800, spread: 0.24, range: 230, pickup: 14, key: '3' },
    akm: { name: 'Автомат Калашникова', short: 'АКМ', kind: 'bullet', dmg: 21, rate: 0.1, speed: 1100, spread: 0.065, range: 520, pickup: 90, key: '4' },
    rpg: { name: 'РПГ-7', short: 'РПГ', kind: 'rocket', dmg: 160, radius: 86, rate: 1.4, speed: 470, range: 600, pickup: 5, key: '5' },
    molotov: { name: 'Коктейль Молотова', short: 'Молотов', kind: 'throw', dmg: 30, radius: 42, rate: 0.9, speed: 330, range: 260, pickup: 6, key: '6' }
  };
  const WEAPON_ORDER = ['fist', 'pm', 'obrez', 'akm', 'rpg', 'molotov'];

  const SKIN = ['#e8c09a', '#d8a880', '#c89068', '#f0d0b0'];
  const HAIR = ['#2a1a10', '#5a3a20', '#8a6a3a', '#1a1a1a', '#b0a080', '#a04020', '#d8d0c0'];
  const SHIRTS = ['#6a7a8a', '#8a5a3a', '#3a4a6a', '#6a3a3a', '#4a6a4a', '#a09070', '#505058', '#7a6a90', '#c8b890', '#3a3a40', '#904040', '#406080'];
  const PANTS = ['#2a2a30', '#3a3a50', '#4a4030', '#2a3a5a', '#505050', '#6a5a40'];

  const PEDS = {
    civ: { name: 'Прохожий', hp: 40, speed: 42, random: true },
    babushka: { name: 'Бабушка', hp: 30, speed: 28, shirt: '#5a4a5a', pants: '#3a3030', scarf: ['#c03030', '#3060a0', '#e0d0a0', '#306030'], bag: true },
    worker: { name: 'Рабочий', hp: 55, speed: 42, shirt: '#2a4a7a', pants: '#2a4a7a', hat: '#2a3a5a' },
    student: { name: 'Студент', hp: 40, speed: 50, random: true, bag: true },
    cop: { name: 'Милиционер', hp: 60, speed: 58, run: 96, shirt: '#56687a', pants: '#3a4656', hat: '#3a4656', band: '#c02020', cop: true, weapon: 'pm' },
    omon: { name: 'ОМОН', hp: 110, speed: 60, run: 100, shirt: '#3a4048', pants: '#2a3038', helmet: '#4a5058', cop: true, weapon: 'akm', armor: true },
    kgb: { name: 'Сотрудник КГБ', hp: 80, speed: 58, run: 102, shirt: '#1e1e22', pants: '#1e1e22', hat: '#2a2a2e', cop: true, weapon: 'pm' },
    center: { name: 'Центровой', hp: 55, speed: 46, run: 92, shirt: '#5a3a24', pants: '#2a3048', hat: '#1e1e1e', gang: 'center', weapon: 'pm' },
    uralmash: { name: 'Уралмашевский', hp: 60, speed: 48, run: 96, shirt: '#1f3fa6', pants: '#1f3fa6', stripes: true, gang: 'uralmash', weapon: 'pm' },
    sinie: { name: 'Синий', hp: 60, speed: 44, run: 90, shirt: '#3a4048', pants: '#2a2a2e', hat: '#2a2a2e', gang: 'sinie', weapon: 'obrez' },
    director: { name: 'Человек Директора', hp: 70, speed: 46, run: 94, shirt: '#2c2c34', pants: '#2a2a30', gang: 'director', weapon: 'pm' },
    guard: { name: 'Охранник', hp: 90, speed: 46, run: 94, shirt: '#141418', pants: '#141418', gang: 'director', weapon: 'akm' },
    knyaz: { name: 'Князь', hp: 120, speed: 46, run: 90, shirt: '#3a2418', pants: '#1a1a20', hat: '#1a1a1a', boss: true, gang: 'center' },
    bugor: { name: 'Бугор', hp: 180, speed: 48, run: 94, shirt: '#1f3fa6', pants: '#1f3fa6', stripes: true, boss: true, gang: 'uralmash', weapon: 'obrez' },
    ded: { name: 'Дед Сивый', hp: 220, speed: 44, run: 86, shirt: '#3a3a40', pants: '#2a2a2e', hat: '#4a4a50', boss: true, gang: 'sinie', weapon: 'akm' },
    director_boss: { name: 'Директор', hp: 200, speed: 44, run: 88, shirt: '#2a2a34', pants: '#2a2a34', hat: '#1a1a20', boss: true, gang: 'director', weapon: 'pm' },
    gosha: { name: 'Гоша Цирк', hp: 120, speed: 50, run: 98, shirt: '#8a2a2a', pants: '#2a2a30', boss: true, gang: 'center' },
    fartsa: { name: 'Фарцовщик', hp: 45, speed: 50, run: 100, shirt: '#80a0d0', pants: '#3a5a90', hat: null },
    courier: { name: 'Курьер', hp: 60, speed: 48, run: 96, shirt: '#8a3a2a', pants: '#303030' },
    journalist: { name: 'Журналист', hp: 50, speed: 48, run: 100, shirt: '#b09060', pants: '#4a4030', glasses: true },
    thimble: { name: 'Напёрсточник', hp: 45, speed: 48, run: 104, shirt: '#a04a2a', pants: '#303030', hat: '#303030' },
    racer: { name: 'Гонщик', hp: 55, speed: 48, run: 96, shirt: '#1f3fa6', pants: '#1f3fa6', stripes: true, gang: 'uralmash' },
    fare: { name: 'Пассажир', hp: 40, speed: 42, random: true }
  };
  for (const [id, p] of Object.entries(PEDS)) { p.id = id; p.run = p.run || Math.round(p.speed * 2); }

  const GANGS = {
    center: { name: 'Центровые', boss: 'Князь', color: '#5a3a24', car: 'vaz2109' },
    uralmash: { name: 'Уралмашевские', boss: 'Бугор', color: '#2a4ab0', car: 'vaz2108' },
    sinie: { name: 'Синие', boss: 'Дед Сивый', color: '#3a4048', car: 'gaz24' },
    director: { name: 'Люди Директора', boss: 'Директор', color: '#2c2c34', car: 'gaz3102' }
  };

  const PICKUPS = {
    w_pm: { name: 'ПМ', weapon: 'pm', color: '#c8a040', label: 'ПМ' },
    w_obrez: { name: 'Обрез', weapon: 'obrez', color: '#a06030', label: 'ОБ' },
    w_akm: { name: 'АКМ', weapon: 'akm', color: '#708040', label: 'АК' },
    w_rpg: { name: 'РПГ-7', weapon: 'rpg', color: '#506030', label: 'РПГ' },
    w_molotov: { name: 'Коктейль Молотова', weapon: 'molotov', color: '#c05020', label: 'КМ' },
    armor: { name: 'Бронежилет', color: '#3a5a8a', label: 'БР' },
    health: { name: 'Аптечка', color: '#e8e8e8', label: '+' },
    bribe: { name: 'Взятка', color: '#3a8a3a', label: '₽' },
    life: { name: 'Лишняя жизнь', color: '#c02020', label: '♥' },
    mult: { name: 'Множитель', color: '#e0c020', label: '×' },
    frenzy: { name: 'Беспредел', color: '#a01010', label: '!' },
    badge: { name: 'Значок', color: '#e8d8a0', label: '★' },
    package: { name: 'Свёрток', color: '#b08850', label: '▣' },
    bag: { name: 'Сумка', color: '#6a4a2a', label: '$' }
  };

  const CHARACTERS = [
    { id: 'lyokha', name: 'Лёха Скороход', fem: false, shirt: '#c03030', pants: '#2a3a5a', hair: '#5a3a20', skin: '#e8c09a', bio: 'Бывший таксист из Нижнего Тагила. Знает каждую подворотню, кроме тех, что в Свердловске.' },
    { id: 'marina', name: 'Марина Бензин', fem: true, shirt: '#e0a020', pants: '#1a1a24', hair: '#a04020', skin: '#f0d0b0', bio: 'Слесарь третьего разряда с Уралмаша. Разбирает «Жигули» быстрее, чем их собирают на заводе.' },
    { id: 'tolik', name: 'Толик Кардан', fem: false, shirt: '#56683a', pants: '#3a4030', hair: '#2a1a10', skin: '#d8a880', bio: 'Только что демобилизовался. Водил БТР, теперь водит всё, что заводится.' },
    { id: 'vadik', name: 'Вадик Варёнка', fem: false, shirt: '#70a8d8', pants: '#6a8ab8', hair: '#b0a080', skin: '#e8c09a', bio: 'Фарцовщик с «Пассажа». Варёные джинсы, кассетный плеер и долги по всему центру.' }
  ];

  const RADIO = [
    { id: 'off', name: 'Радио выключено' },
    { id: 'disco', name: '«Урал-Диско» — дискотека', bpm: 124, scale: [0, 2, 3, 5, 7, 8, 10], root: 45, wave: 'square', seed: 11 },
    { id: 'rock', name: '«Рок-клуб» — свердловский рок', bpm: 138, scale: [0, 3, 5, 7, 10], root: 40, wave: 'sawtooth', seed: 23 },
    { id: 'mayak', name: '«Маяк» — новости', bpm: 96, scale: [0, 2, 4, 5, 7, 9, 11], root: 48, wave: 'triangle', seed: 37, news: true }
  ];

  const NEWS = [
    ['Горсовет обсуждает, не вернуть ли Свердловску историческое имя Екатеринбург.', 'Талоны на сахар, мыло и водку на сентябрь выдаются в ЖЭКах до пятнадцатого числа.', 'На Центральном рынке снова видели напёрсточников. Милиция просит граждан не играть.', 'Метростроевцы обещают: станция «Площадь 1905 года» откроется через несколько лет.', 'В рок-клубе на Пушкина — концерт. Билеты кончились за час.'],
    ['Курс доллара на чёрном рынке перевалил за тридцать рублей. Официальный — шестьдесят копеек.', 'Стройку телебашни у цирка заморозили: денег нет. Башня так и стоит без антенны.', 'Кооператив «Урал-Авто» продаёт запчасти без очереди. Прокуратура интересуется, откуда.', 'На набережной Рабочей Молодёжи снова ночные гонки. ГАИ обещает усилить патрули.', 'Парни в спортивных костюмах всё чаще появляются в центре. Говорят, они с Уралмаша.'],
    ['Сессия горсовета: Свердловск может снова стать Екатеринбургом уже в сентябре.', 'После августовских событий на площади 1905 года прошёл многотысячный митинг.', 'Жители Вознесенской горки жалуются на чёрные «Волги» без номеров по ночам.', 'Матч на стадионе «Динамо» перенесён: на поле не просыхает грязь.', 'Правление «Урал-Интер» отрицает связь с рэкетом. Правление вообще всё отрицает.']
  ];

  const SCORE = { ped: 40, cop: 150, gang: 120, car: 250, copcar: 700, boss: 2000 };

  Object.assign(G, { COLORS: C, VEHICLES, WEAPONS, WEAPON_ORDER, SKIN, HAIR, SHIRTS, PANTS, PEDS, GANGS, PICKUPS, CHARACTERS, RADIO, NEWS, SCORE });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
