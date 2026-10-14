(function (N) {
  'use strict';

  N.PAINTS = {
    'Белый': '#e9e7df', 'Белая ночь': '#dfe4e6', 'Серо-белый': '#dcdcd4', 'Кардинал': '#b0201c', 'Рубин': '#9c1c1e', 'Кармен': '#a8221e', 'Торнадо': '#b81e1a',
    'Вишня': '#64141c', 'Яшма': '#561820', 'Красный перец': '#7e2a1e', 'Баклажан': '#36203a', 'Вишнёвый сад': '#5e1a24', 'Сафари': '#d6c69c', 'Капучино': '#c4b8a4',
    'Примула': '#e4d88c', 'Нарцисс': '#dcb42e', 'Чайная роза': '#e8dcb0', 'Наутилус': '#1e3a2e', 'Зелёный сад': '#2a4a2c', 'Мурена': '#1e4a50', 'Петергоф': '#4c6a5a',
    'Пицунда': '#2c6a76', 'Балтика': '#1c4256', 'Медео': '#7aa2c2', 'Адриатика': '#8ab4d0', 'Индиго': '#1c2446', 'Синяя полночь': '#1e2e5e', 'Океан': '#1a2a48',
    'Валентина': '#6a6478', 'Гравилат': '#6a6a40', 'Несси': '#22412c', 'Солярис': '#3a2a1c', 'Бриз': '#5a9aa0', 'Чёрный': '#151515',
    'Аметист': '#4e3456', 'Искра': '#8a1a1a', 'Сочи': '#2a463c', 'Престиж': '#1e2a48', 'Франкония': '#5a1424', 'Коралл': '#7a2024', 'Майя': '#4e1622', 'Мальборо': '#9a1e22',
    'Паприка': '#b0402a', 'Антилопа': '#b0a080', 'Мираж': '#8a9060', 'Опатия': '#c0702a', 'Серебристая ива': '#8a948a', 'Валюта': '#6e7c6a', 'Игуана': '#3a8a4a',
    'Амулет': '#2a4a3a', 'Ниагара': '#7a8a98', 'Изумруд': '#2e6a4a', 'Папирус': '#8a9488', 'Чароит': '#3e2a4e', 'Рапсодия': '#2a5aa0', 'Золотая нива': '#b49450',
    'Снежная королева': '#b8bcc0', 'Триумф': '#8e2226', 'Магия': '#6a3a7a', 'Миндаль': '#c4a898', 'Приз': '#b4a88a', 'Кристалл': '#b0b4b4', 'Золото инков': '#4a5a30',
    'Цунами': '#1e3a34', 'Фея': '#9a8aa8', 'Опал': '#8aa0b0', 'Афалина': '#7a9aa4', 'Аквамарин': '#2a6a74', 'Млечный путь': '#4a4e52', 'Нептун': '#3a4a5a', 'Кварц': '#7c8084',
    'Красный': '#a8261c', 'Голубой': '#7aa4c8', 'Жёлтый': '#d8b040', 'Оранжевый': '#c8641e', 'Серо-зелёный': '#5e7462', 'Синий': '#24386e', 'Бежевый': '#cfc09a',
    'Серый': '#6c6e70', 'Светло-серый': '#c8d0c8', 'Тёмно-зелёный': '#24402c', 'Тёмно-синий': '#1c2a4c', 'Вишнёвый': '#5e141c', 'Серо-голубой': '#8a9aa8', 'Светло-зелёный': '#9ab8a0',
    'Кофе с молоком': '#a08868', 'Защитный': '#4a5a36', 'Хаки': '#5a6040', 'Песочный': '#b8a878', 'Оранжево-красный': '#c03a1c',
    'Серебристый': '#a8acb0', 'Мокрый асфальт': '#4e5256', 'Чёрный металлик': '#121214', 'Графитовый металлик': '#4a4c50', 'Тёмно-синий металлик': '#1c2a48',
    'Тёмно-зелёный металлик': '#24402e', 'Вишнёвый металлик': '#5a1622', 'Бежевый металлик': '#ad9f84', 'Синий металлик': '#2a4a6a'
  };
  N.METALLIC = new Set(['Аметист', 'Искра', 'Сочи', 'Престиж', 'Франкония', 'Коралл', 'Майя', 'Мальборо', 'Паприка', 'Антилопа', 'Мираж', 'Опатия', 'Серебристая ива', 'Валюта',
    'Игуана', 'Амулет', 'Ниагара', 'Изумруд', 'Папирус', 'Чароит', 'Рапсодия', 'Золотая нива', 'Снежная королева', 'Триумф', 'Магия', 'Миндаль', 'Приз', 'Кристалл',
    'Золото инков', 'Цунами', 'Фея', 'Опал', 'Афалина', 'Аквамарин', 'Млечный путь', 'Нептун', 'Кварц', 'Серебристый', 'Мокрый асфальт', 'Чёрный металлик',
    'Графитовый металлик', 'Тёмно-синий металлик', 'Тёмно-зелёный металлик', 'Вишнёвый металлик', 'Бежевый металлик', 'Синий металлик'].map(n => N.PAINTS[n]));
  N.PAINT_NAME = {};
  for (const [name, hex] of Object.entries(N.PAINTS)) N.PAINT_NAME[hex] = name;
  const pal = (...names) => names.flatMap(n => {
    const m = /^(.*?)(?: x(\d))?$/.exec(n);
    return Array(+(m[2] || 1)).fill(N.PAINTS[m[1]]);
  });
  const VAZ_OLD = ['Белый x3', 'Кардинал x2', 'Сафари x2', 'Адриатика', 'Зелёный сад', 'Примула', 'Синяя полночь', 'Баклажан', 'Валентина', 'Вишня', 'Чёрный'];
  const SAMARA = ['Белый x3', 'Рубин', 'Кармен', 'Торнадо', 'Вишнёвый сад', 'Франкония', 'Коралл', 'Майя', 'Мальборо', 'Балтика x2', 'Мурена', 'Антилопа', 'Мираж',
    'Серебристая ива', 'Валюта', 'Амулет x2', 'Ниагара', 'Изумруд', 'Папирус', 'Чароит', 'Рапсодия', 'Снежная королева x2', 'Чёрный x2'];
  const PPS = { c1: '#dfe2de', stripe: '#1d4e9e', text: 'МИЛИЦИЯ', beacon: 'bar', gloss: 0.6, dirt: 0.3 };
  const DPS = { c1: '#e6e8e4', stripe: '#1d4e9e', text: 'ДПС', beacon: 'dps', gloss: 0.62, dirt: 0.25 };
  const OLD = { c1: '#dcbc2a', stripe: '#1f4ea0', text: 'МИЛИЦИЯ', beacon: 'dome', gloss: 0.45, dirt: 0.4 };
  const FOREIGN = ['Чёрный металлик x2', 'Белый', 'Серебристый', 'Графитовый металлик', 'Тёмно-синий металлик', 'Тёмно-зелёный металлик', 'Вишнёвый металлик'];

  N.VEHICLES = {
    vaz2101: {
      name: 'ВАЗ-2101', nick: '«Копейка»', year: 1979, type: 'car', drive: 'rwd', mass: 955, hp: 800, acc: 5.2, vmax: 38, brake: 8, grip: 0.95, steer: 0.62,
      shape: { body: 'sedan', doors: 4, L: 4.07, W: 1.61, H: 1.44, clr: 0.3, belt: 0.87, hood: 1.04, trunk: 0.74, ws: 0.37, rw: 0.34, round: 0.12, wr: 0.292, wb: 2.42, lights: 'round2', grille: 'chrome', chrome: true, ax: 0.61, door: [0.547, 1.469], wheelR: 0.19, wheelTilt: 0.45 },
      colors: pal(...VAZ_OLD), spawn: 9,
      liveries: { old: OLD }
    },
    vaz2106: {
      name: 'ВАЗ-2106', nick: '«Шестёрка»', year: 1987, type: 'car', drive: 'rwd', mass: 1035, hp: 820, acc: 5.8, vmax: 42, brake: 8, grip: 0.96, steer: 0.62,
      shape: { body: 'sedan', doors: 4, L: 4.17, W: 1.61, H: 1.44, clr: 0.3, belt: 0.87, hood: 1.09, trunk: 0.79, ws: 0.37, rw: 0.34, round: 0.1, wr: 0.292, wb: 2.42, lights: 'round4', grille: 'chrome', chrome: true, ax: 0.66, door: [0.547, 1.469], wheelR: 0.19, wheelTilt: 0.45 },
      colors: pal('Белый x2', 'Баклажан x2', 'Сафари x2', 'Пицунда', 'Медео', 'Примула', 'Капучино', 'Аметист', 'Вишня', 'Зелёный сад', 'Кардинал'), spawn: 12,
      liveries: { militia: PPS, old: OLD }
    },
    vaz2107: {
      name: 'ВАЗ-2107', nick: '«Семёрка»', year: 1993, type: 'car', drive: 'rwd', mass: 1030, hp: 820, acc: 5.9, vmax: 42, brake: 8.2, grip: 0.97, steer: 0.62,
      shape: { body: 'sedan', doors: 4, L: 4.15, W: 1.62, H: 1.44, clr: 0.3, belt: 0.87, hood: 1.085, trunk: 0.775, ws: 0.37, rw: 0.34, round: 0.05, wr: 0.292, wb: 2.42, lights: 'rect', grille: 'chrome', chrome: true, ax: 0.655, door: [0.547, 1.469], wheelR: 0.19, wheelTilt: 0.45 },
      colors: pal('Белый x3', 'Баклажан', 'Вишня', 'Яшма', 'Красный перец', 'Нарцисс', 'Чайная роза', 'Наутилус', 'Мурена x2', 'Петергоф', 'Балтика x2', 'Индиго', 'Сочи', 'Престиж', 'Солярис', 'Искра', 'Чёрный'), spawn: 12,
      liveries: { militia: PPS, dps: DPS }
    },
    vaz2109: {
      name: 'ВАЗ-2109', nick: '«Девятка»', year: 1993, tintChance: 0.3, type: 'car', drive: 'fwd', mass: 945, hp: 800, acc: 6.4, vmax: 44, brake: 8.4, grip: 1.0, steer: 0.64,
      shape: { body: 'hatch', doors: 4, L: 4.0, W: 1.65, H: 1.4, clr: 0.22, belt: 0.9, hood: 1.16, trunk: 0, ws: 0.52, rw: 0.63, round: 0.3, wr: 0.28, wb: 2.46, lights: 'rectwide', grille: 'black', ax: 0.8, door: [0.43, 1.4], seat: 1.12, wheelY: 0.924, wheelR: 0.185, wheelTilt: 0.42, wheelZ: 0.45 },
      colors: pal(...SAMARA), spawn: 11,
      liveries: { dps: DPS }
    },
    vaz21099: {
      name: 'ВАЗ-21099', nick: '«Девяносто девятая»', year: 1995, tintChance: 0.3, type: 'car', drive: 'fwd', mass: 960, hp: 800, acc: 6.4, vmax: 44, brake: 8.4, grip: 1.0, steer: 0.64,
      shape: { body: 'sedan', doors: 4, L: 4.2, W: 1.65, H: 1.4, clr: 0.22, belt: 0.9, hood: 1.16, trunk: 0.54, ws: 0.52, rw: 0.52, round: 0.3, wr: 0.28, wb: 2.46, lights: 'rectwide', grille: 'black', ax: 0.8, door: [0.43, 1.4], seat: 1.12, wheelY: 0.924, wheelR: 0.185, wheelTilt: 0.42, wheelZ: 0.45 },
      colors: pal(...SAMARA, 'Паприка', 'Золотая нива'), spawn: 10
    },
    vaz2110: {
      name: 'ВАЗ-2110', nick: '«Десятка»', year: 1998, tintChance: 0.15, type: 'car', drive: 'fwd', mass: 1040, hp: 850, acc: 6.8, vmax: 46, brake: 8.8, grip: 1.03, steer: 0.63,
      shape: { body: 'sedan', doors: 4, L: 4.265, W: 1.68, H: 1.42, clr: 0.22, belt: 0.95, hood: 1.08, trunk: 0.67, ws: 0.7, rw: 0.54, round: 0.62, wr: 0.29, wb: 2.49, lights: 'rectwide', grille: 'black', ax: 0.84, door: [0.36, 1.5], seat: 1.18, wheelY: 0.984, wheelR: 0.185, wheelTilt: 0.42 },
      colors: pal('Белый x2', 'Триумф', 'Магия', 'Миндаль', 'Приз', 'Кристалл', 'Золото инков', 'Сочи', 'Цунами', 'Амулет', 'Ниагара', 'Изумруд', 'Фея', 'Опал', 'Афалина', 'Рапсодия', 'Аквамарин', 'Млечный путь x2', 'Нептун', 'Кварц x2', 'Снежная королева x2', 'Чёрный'), spawn: 8,
      liveries: { dps: DPS }
    },
    niva: {
      name: 'ВАЗ-2121', nick: '«Нива»', year: 1989, dirty: 0.15, type: 'car', drive: 'awd', mass: 1150, hp: 950, acc: 5.4, vmax: 37, brake: 7.8, grip: 0.98, steer: 0.6,
      shape: { body: 'suv', doors: 2, L: 3.74, W: 1.68, H: 1.64, clr: 0.42, belt: 1.1, hood: 1.3, trunk: 0, ws: 0.35, rw: 0.05, round: 0.12, wr: 0.343, wb: 2.2, lights: 'round2', grille: 'black', ax: 0.72, door: [0.62, 1.63], seat: 1.25, wheelY: 1.122, wheelR: 0.19, wheelTilt: 0.5, wheelZ: 0.43 },
      colors: pal('Белый x3', 'Балтика x2', 'Мурена x2', 'Яшма', 'Гравилат', 'Несси', 'Океан', 'Сафари x2', 'Баклажан', 'Капучино'), spawn: 6
    },
    oka: {
      name: 'ВАЗ-1111', nick: '«Ока»', year: 1995, type: 'car', drive: 'fwd', mass: 645, hp: 600, acc: 4.8, vmax: 33, brake: 7.6, grip: 0.92, steer: 0.66,
      shape: { body: 'micro', doors: 2, L: 3.2, W: 1.42, H: 1.4, clr: 0.2, belt: 0.86, hood: 0.74, trunk: 0, ws: 0.68, rw: 0.12, round: 0.18, wr: 0.26, wb: 2.18, lights: 'rect', grille: 'black', ax: 0.56, door: [0.25, 1.42], seat: 1.02, wheelY: 0.894, wheelR: 0.18, wheelTilt: 0.45, wheelZ: 0.45 },
      colors: pal('Белый x2', 'Рубин', 'Медео', 'Нарцисс', 'Фея', 'Балтика', 'Мурена', 'Сафари', 'Снежная королева'), spawn: 5
    },
    zaz968: {
      name: 'ЗАЗ-968М', nick: '«Запорожец»', year: 1983, type: 'car', drive: 'rwd', mass: 840, hp: 700, acc: 4.4, vmax: 33, brake: 7.2, grip: 0.9, steer: 0.62,
      shape: { body: 'zaz', doors: 2, L: 3.765, W: 1.57, H: 1.4, clr: 0.25, belt: 0.9, hood: 0.94, trunk: 0.8, ws: 0.4, rw: 0.23, round: 0.45, wr: 0.3, wb: 2.16, lights: 'round2', grille: 'chrome', chrome: true, ax: 0.66, door: [0.3, 1.35], seat: 1.0, wheelY: 0.937, wheelR: 0.2, wheelTilt: 0.5, wheelZ: 0.43 },
      colors: pal('Белый x2', 'Красный', 'Голубой', 'Жёлтый', 'Оранжевый', 'Серо-зелёный', 'Синий', 'Бежевый', 'Тёмно-зелёный'), spawn: 5
    },
    m2141: {
      name: 'Москвич-2141', nick: '«Алеко»', year: 1992, type: 'car', drive: 'fwd', mass: 1080, hp: 820, acc: 5.6, vmax: 42, brake: 8, grip: 0.97, steer: 0.62,
      shape: { body: 'hatch', doors: 4, L: 4.35, W: 1.69, H: 1.4, clr: 0.24, belt: 0.935, hood: 1.28, trunk: 0, ws: 0.55, rw: 0.82, round: 0.3, wr: 0.31, wb: 2.58, lights: 'rectwide', grille: 'black', ax: 0.84, door: [0.48, 1.55], seat: 1.3, wheelY: 0.97, wheelR: 0.185, wheelTilt: 0.42 },
      colors: pal('Белый x2', 'Красный', 'Вишнёвый металлик', 'Тёмно-синий', 'Мокрый асфальт x2', 'Серебристый', 'Тёмно-зелёный металлик', 'Бежевый', 'Чёрный'), spawn: 6
    },
    m412: {
      name: 'Москвич-412', nick: '«Москвич»', year: 1981, type: 'car', drive: 'rwd', mass: 1045, hp: 780, acc: 5.0, vmax: 38, brake: 7.6, grip: 0.93, steer: 0.62,
      shape: { body: 'sedan', doors: 4, L: 4.25, W: 1.55, H: 1.48, clr: 0.27, belt: 0.97, hood: 1.13, trunk: 0.89, ws: 0.37, rw: 0.27, round: 0.1, wr: 0.305, wb: 2.4, lights: 'round2', grille: 'chrome', chrome: true, ax: 0.78, door: [0.55, 1.48], seat: 1.22, wheelR: 0.2, wheelTilt: 0.45 },
      colors: pal('Белый x2', 'Красный', 'Голубой x2', 'Синий', 'Бежевый', 'Тёмно-зелёный', 'Жёлтый', 'Серый', 'Вишнёвый', 'Мокрый асфальт'), spawn: 6
    },
    volga24: {
      name: 'ГАЗ-24', nick: '«Волга»', year: 1984, type: 'car', drive: 'rwd', mass: 1420, hp: 1000, acc: 5.4, vmax: 40, brake: 7.8, grip: 0.95, steer: 0.58,
      shape: { body: 'sedan', doors: 4, L: 4.735, W: 1.8, H: 1.49, clr: 0.2, belt: 0.955, hood: 1.3, trunk: 1.03, ws: 0.46, rw: 0.45, round: 0.2, wr: 0.321, wb: 2.8, lights: 'round2', grille: 'volga', chrome: true, ax: 0.72, door: [0.68, 1.64], seat: 1.3, wheelY: 0.92, wheelR: 0.215, wheelTilt: 0.45, wheelZ: 0.43 },
      colors: pal('Чёрный x2', 'Белая ночь x2', 'Бежевый', 'Голубой', 'Серо-голубой', 'Светло-зелёный', 'Вишнёвый', 'Тёмно-синий', 'Кофе с молоком'), spawn: 7,
      liveries: { taxi: { c1: '#e8c822', checker: true, text: 'ТАКСИ', beacon: 'taxi', gloss: 0.6 } }
    },
    volga3110: {
      name: 'ГАЗ-3110', nick: '«Волга»', year: 1998, type: 'car', drive: 'rwd', mass: 1400, hp: 1000, acc: 6.0, vmax: 43, brake: 8.4, grip: 0.98, steer: 0.58,
      shape: { body: 'sedan', doors: 4, L: 4.88, W: 1.8, H: 1.49, clr: 0.2, belt: 0.955, hood: 1.45, trunk: 1.05, ws: 0.46, rw: 0.45, round: 0.42, wr: 0.321, wb: 2.8, lights: 'rectwide', grille: 'volga', chrome: true, ax: 0.875, door: [0.68, 1.64], seat: 1.3, wheelY: 0.943, wheelR: 0.2, wheelTilt: 0.42, wheelZ: 0.43 },
      colors: pal('Белый x2', 'Чёрный x2', 'Серебристый x2', 'Мокрый асфальт', 'Тёмно-синий металлик', 'Тёмно-зелёный металлик', 'Вишнёвый металлик', 'Бежевый металлик', 'Серо-голубой'), spawn: 8,
      liveries: { taxi: { c1: '#e8c822', checker: true, text: 'ТАКСИ', beacon: 'taxi', gloss: 0.6 }, militia: PPS, dps: DPS }
    },
    volga3102: {
      name: 'ГАЗ-3102', nick: '«Чёрная Волга»', year: 1994, type: 'car', drive: 'rwd', mass: 1470, hp: 1100, acc: 6.2, vmax: 44, brake: 8.4, grip: 0.98, steer: 0.58,
      shape: { body: 'sedan', doors: 4, L: 4.96, W: 1.82, H: 1.49, clr: 0.2, belt: 0.955, hood: 1.5, trunk: 1.08, ws: 0.46, rw: 0.45, round: 0.12, wr: 0.324, wb: 2.8, lights: 'rectwide', grille: 'volga', chrome: true, ax: 0.92, door: [0.68, 1.64], seat: 1.3, wheelY: 0.943, wheelR: 0.2, wheelTilt: 0.42, wheelZ: 0.43 },
      colors: pal('Чёрный x4', 'Тёмно-синий металлик', 'Вишнёвый металлик', 'Тёмно-зелёный металлик', 'Белый', 'Серебристый'), spawn: 3,
      liveries: { fsb: { c1: '#0e0e10', beacon: 'magnet', gloss: 0.92, dirt: 0.05, tint: 0.75 } }
    },
    uaz469: {
      name: 'УАЗ-469', nick: '«Козлик»', year: 1986, dirty: 0.25, type: 'car', drive: 'awd', mass: 1600, hp: 1200, acc: 4.8, vmax: 32, brake: 7, grip: 0.94, steer: 0.56,
      shape: { body: 'jeep', doors: 4, L: 4.025, W: 1.785, H: 2.05, clr: 0.3, belt: 1.3, hood: 1.0, trunk: 0, ws: 0.15, rw: 0, round: 0.05, wr: 0.384, wb: 2.38, lights: 'round2', grille: 'slats', ax: 0.62, door: [0.45, 1.25], seat: 1.15, seatY: 0.62, wheelR: 0.21, wheelTilt: 0.6, wheelZ: 0.45 },
      colors: pal('Защитный x3', 'Хаки', 'Белая ночь', 'Синий', 'Песочный'), spawn: 3,
      liveries: { militia: PPS, old: OLD, army: { c1: '#3e4a2c', text: '', beacon: '', gloss: 0.12, dirt: 0.7 } }
    },
    uaz452: {
      name: 'УАЗ-452', nick: '«Буханка»', year: 1990, dirty: 0.2, type: 'car', drive: 'awd', mass: 1770, hp: 1200, acc: 4.4, vmax: 30, brake: 6.8, grip: 0.9, steer: 0.54,
      shape: { body: 'bread', doors: 2, L: 4.36, W: 1.94, H: 2.03, clr: 0.22, belt: 1.4, hood: 0.15, trunk: 0, ws: 0.06, rw: 0, round: 0.35, wr: 0.372, wb: 2.3, lights: 'round2', grille: 'slats', ax: 0.95, door: [-0.65, 0.29], seat: -0.1, seatY: 0.88, wheelY: 1.46, wheelR: 0.21, wheelTilt: 0.75, wheelZ: 0.43 },
      colors: pal('Защитный x2', 'Белая ночь x2', 'Серый', 'Синий', 'Жёлтый', 'Бежевый'), spawn: 3,
      liveries: { ambulance: { c1: '#ece8de', stripe: '#c81e1e', text: 'СКОРАЯ', beacon: 'dome', cross: true, gloss: 0.55 } }
    },
    gazel: {
      name: 'ГАЗель', nick: '«Маршрутка»', year: 1997, dirty: 0.1, type: 'car', drive: 'rwd', mass: 2100, hp: 1300, acc: 4.6, vmax: 34, brake: 7, grip: 0.9, steer: 0.54,
      shape: { body: 'van', doors: 2, L: 5.47, W: 2.075, H: 2.2, clr: 0.2, belt: 1.13, hood: 0.72, trunk: 0, ws: 0.75, rw: 0, round: 0.2, wr: 0.342, wb: 2.9, lights: 'rectwide', grille: 'black', ax: 1.04, door: [0.42, 1.32], seat: 0.9, seatY: 0.78, wheelR: 0.2, wheelTilt: 0.62 },
      colors: pal('Белый x5', 'Синий', 'Красный', 'Жёлтый', 'Серебристый', 'Тёмно-синий'), spawn: 6
    },
    gaz53: {
      name: 'ГАЗ-53', nick: '«Грузовик»', year: 1985, dirty: 0.3, type: 'truck', drive: 'rwd', mass: 3400, hp: 1600, acc: 3.4, vmax: 26, brake: 6, grip: 0.85, steer: 0.52,
      shape: { body: 'truck', doors: 2, L: 6.395, W: 2.38, H: 2.22, clr: 0.26, belt: 1.62, hood: 1.55, trunk: 0, ws: 0.14, rw: 0, round: 0.25, wr: 0.465, wb: 3.7, lights: 'round2', grille: 'slats', ax: 1.105, door: [0.5, 1.35], seat: 1.08, seatY: 1.12, wheelY: 1.55, wheelR: 0.235, wheelTilt: 0.55, wheelZ: 0.4 },
      colors: pal('Синий x2', 'Тёмно-зелёный x2', 'Защитный', 'Голубой', 'Серый', 'Оранжевый'), spawn: 3,
      liveries: { carrier: { c1: '#d0cfc6', text: '', beacon: '', cargo: 'volga3110', gloss: 0.4 }, army: { c1: '#3e4a2c', text: '', beacon: '', tent: true, gloss: 0.12, dirt: 0.7 } }
    },
    ural4320: {
      name: 'Урал-4320', nick: '«Урал»', year: 1990, dirty: 0.45, type: 'truck', drive: 'awd', mass: 8600, hp: 2400, acc: 3.0, vmax: 23.5, brake: 5.6, grip: 0.92, steer: 0.46,
      shape: { body: 'truck', doors: 2, L: 7.37, W: 2.5, H: 2.87, clr: 0.4, belt: 1.95, hood: 1.66, trunk: 0, ws: 0.19, rw: 0, round: 0.3, wr: 0.57, wb: 4.225, tandem: 1.4, lights: 'round2', grille: 'slats', ax: 1.35, door: [0.34, 1.5], seat: 1.15, seatY: 1.42, wheelY: 1.86, wheelR: 0.23, wheelTilt: 0.6, wheelZ: 0.42 },
      colors: pal('Защитный x3', 'Хаки'), spawn: 0,
      liveries: { army: { c1: '#3e4a2c', text: '', beacon: '', tent: true, gloss: 0.12, dirt: 0.75 } }
    },
    btr80: {
      name: 'БТР-80', nick: '«Бэтэр»', year: 1990, dirty: 0.5, type: 'apc', drive: 'awd', mass: 13600, hp: 3200, acc: 3.2, vmax: 22, brake: 6.5, grip: 1.0, steer: 0.4, armor: 0.12, blast: 0.8,
      shape: { body: 'apc', L: 7.65, W: 2.9, H: 2.41, clr: 0.47, belt: 1.6, hood: 0, trunk: 0, ws: 0, rw: 0, round: 0.1, wr: 0.56, wb: 4.35, axles: [0, 1.35, 3.0, 4.35], lights: 'round2', grille: 'black', ax: 1.65, hatch: [-0.45, 2.04, -1.8] },
      turret: { pivot: [0, 2.0, -0.75], gun: [0.04, 0.26, -0.42], len: 2.1, coax: [0.22, -0.04, -0.7], traverse: 1.4, elev: 0.6, depress: -0.08, main: 'kpvt', coaxGun: 'pkt' },
      colors: pal('Защитный x2', 'Хаки'), spawn: 0,
      liveries: { army: { c1: '#4a5634', text: '', beacon: '', gloss: 0.1, dirt: 0.75 } }
    },
    t72: {
      name: 'Т-72Б', nick: '«Семьдесят второй»', year: 1987, dirty: 0.55, type: 'tank', drive: 'track', mass: 44500, hp: 6000, acc: 2.6, vmax: 16.5, brake: 7, grip: 1.3, steer: 0.7, armor: 0, blast: 0.6,
      shape: { body: 'tank', L: 6.95, W: 3.59, H: 2.23, clr: 0.47, belt: 1.5, hood: 0, trunk: 0, ws: 0, rw: 0, round: 0.1, wr: 0.375, wb: 4.28, lights: 'round2', grille: 'black', ax: 1.335, hatch: [0.42, 2.2, 0.25] },
      turret: { pivot: [0, 1.6, -0.35], gun: [0, 0.3, -0.6], len: 5.15, coax: [0.32, -0.03, -1.08], traverse: 0.65, elev: 0.24, depress: -0.1, main: 'cannon125', coaxGun: 'pkt', reload: 6 },
      colors: pal('Защитный x2', 'Хаки'), spawn: 0,
      liveries: { army: { c1: '#4a5434', text: '', beacon: '', gloss: 0.1, dirt: 0.8 } }
    },
    avtozak: {
      name: 'Автозак ГАЗ-3307', nick: '«Воронок»', year: 1996, dirty: 0.25, type: 'truck', drive: 'rwd', mass: 5800, hp: 1700, acc: 3.0, vmax: 24, brake: 5.6, grip: 0.84, steer: 0.5,
      shape: { body: 'truck', doors: 2, L: 6.66, W: 2.45, H: 3.0, clr: 0.28, belt: 1.66, hood: 1.68, trunk: 0, ws: 0.1, rw: 0, round: 0.2, wr: 0.47, wb: 3.77, lights: 'round2', grille: 'slats', ax: 1.2, door: [0.5, 1.35], seat: 1.12, seatY: 1.15, wheelY: 1.6, wheelR: 0.235, wheelTilt: 0.55, wheelZ: 0.4 },
      colors: pal('Серо-голубой'), spawn: 0,
      liveries: { omon: { c1: '#56677a', stripe: '#1d4e9e', text: 'ОМОН', beacon: 'bar', gloss: 0.45, dirt: 0.35 }, militia: { c1: '#56677a', stripe: '#1d4e9e', text: 'МИЛИЦИЯ', beacon: 'bar', gloss: 0.45, dirt: 0.35 } }
    },
    paz: {
      name: 'ПАЗ-3205', nick: '«Пазик»', year: 1991, dirty: 0.15, type: 'bus', drive: 'rwd', mass: 5800, hp: 2000, acc: 2.8, vmax: 24, brake: 5.4, grip: 0.8, steer: 0.5,
      shape: { body: 'bus', doors: 2, L: 6.925, W: 2.5, H: 2.94, clr: 0.3, belt: 1.55, hood: 0.05, trunk: 0, ws: 0.24, rw: 0, round: 0.2, wr: 0.465, wb: 3.6, lights: 'round2', grille: 'black', ax: 1.27, door: [-0.83, 0.05], seat: -0.45, seatY: 1.05, wheelY: 1.5, wheelR: 0.24, wheelTilt: 1.0 },
      colors: pal('Жёлтый x2', 'Белый', 'Светло-серый', 'Оранжевый'), spawn: 3,
      liveries: { omon: { c1: '#26324a', stripe: '#e0e0e0', text: 'ОМОН', beacon: 'bar', grille: true, gloss: 0.5, dirt: 0.35 } }
    },
    bmw525: {
      name: 'BMW 525', nick: '«Бумер»', year: 1991, foreign: true, tint: 0.35, type: 'car', drive: 'rwd', mass: 1480, hp: 1050, acc: 7.8, vmax: 55, brake: 9.4, grip: 1.07, steer: 0.62,
      shape: { body: 'sedan', doors: 4, L: 4.72, W: 1.751, H: 1.412, clr: 0.2, belt: 0.92, hood: 1.48, trunk: 0.68, ws: 0.58, rw: 0.56, round: 0.3, wr: 0.324, wb: 2.761, lights: 'bmw', grille: 'bmw', ax: 0.86, door: [0.62, 1.67], seat: 1.4, wheelY: 0.939, wheelR: 0.19, wheelTilt: 0.4, wheelZ: 0.45 },
      colors: pal(...FOREIGN, 'Красный', 'Бежевый металлик'), spawn: 3
    },
    merc600: {
      name: 'Mercedes S600', nick: '«Кабан»', year: 1995, foreign: true, tint: 0.55, type: 'car', drive: 'rwd', mass: 2150, hp: 1300, acc: 7.6, vmax: 58, brake: 9.4, grip: 1.08, steer: 0.58,
      shape: { body: 'sedan', doors: 4, L: 5.113, W: 1.886, H: 1.484, clr: 0.22, belt: 0.99, hood: 1.37, trunk: 0.66, ws: 0.73, rw: 0.55, round: 0.35, wr: 0.344, wb: 3.04, lights: 'rectwide', grille: 'merc', chrome: true, ax: 0.95, door: [0.5, 1.72], seat: 1.45, wheelR: 0.2, wheelTilt: 0.4 },
      colors: pal('Чёрный металлик x4', 'Тёмно-синий металлик x2', 'Серебристый', 'Графитовый металлик', 'Тёмно-зелёный металлик', 'Вишнёвый металлик', 'Белый'), spawn: 2
    },
    audi80: {
      name: 'Audi 80', nick: '«Бочка»', year: 1989, foreign: true, type: 'car', drive: 'fwd', mass: 1150, hp: 900, acc: 6.6, vmax: 48, brake: 8.8, grip: 1.03, steer: 0.63,
      shape: { body: 'sedan', doors: 4, L: 4.393, W: 1.695, H: 1.397, clr: 0.2, belt: 0.86, hood: 1.13, trunk: 0.58, ws: 0.72, rw: 0.62, round: 0.72, wr: 0.3, wb: 2.546, lights: 'rectwide', grille: 'black', ax: 0.83, door: [0.3, 1.3], seat: 1.12, wheelY: 0.871, wheelR: 0.185, wheelTilt: 0.42, wheelZ: 0.45 },
      colors: pal('Красный x2', 'Белый', 'Серебристый', 'Тёмно-синий', 'Тёмно-зелёный металлик', 'Чёрный', 'Синий металлик'), spawn: 4
    },
    lc80: {
      name: 'Land Cruiser 80', nick: '«Крузак»', year: 1993, foreign: true, tint: 0.3, type: 'car', drive: 'awd', mass: 2250, hp: 1500, acc: 6.2, vmax: 47, brake: 8.4, grip: 1.0, steer: 0.56,
      shape: { body: 'suv', doors: 4, L: 4.82, W: 1.93, H: 1.86, clr: 0.4, belt: 1.15, hood: 1.41, trunk: 0, ws: 0.43, rw: 0.05, round: 0.3, wr: 0.395, wb: 2.85, lights: 'rectwide', grille: 'chrome', ax: 0.86, door: [0.55, 1.58], seat: 1.3, seatY: 0.62, wheelY: 1.173, wheelR: 0.2, wheelTilt: 0.5 },
      colors: pal('Белый x2', 'Тёмно-зелёный металлик x2', 'Серебристый', 'Чёрный', 'Вишнёвый металлик', 'Бежевый металлик', 'Тёмно-синий металлик'), spawn: 2
    },
    ural: {
      name: 'Урал М-67-36', nick: '«Урал»', year: 1984, dirty: 0.2, type: 'bike', drive: 'rwd', mass: 335, hp: 520, acc: 4.6, vmax: 29, brake: 6.4, grip: 0.9, steer: 0.46,
      shape: { body: 'bike', L: 2.53, W: 1.7, H: 1.1, clr: 0.13, belt: 0.82, hood: 0, trunk: 0, ws: 0, rw: 0, round: 0.5, wr: 0.34, tw: 0.1, wb: 1.5, lights: 'round2', grille: 'black', sidecar: 1.12, seat: 1.03, seatY: 0.8, barsX: 0.38, barsY: 1.05, barsA: 0.46 },
      colors: pal('Защитный x2', 'Тёмно-зелёный', 'Чёрный', 'Вишнёвый', 'Синий'), spawn: 0,
      liveries: { gai: { c1: '#dcbc2a', stripe: '#1f4ea0', text: 'ГАИ', beacon: 'pole', gloss: 0.4, dirt: 0.35 } }
    },
    izh: {
      name: 'ИЖ Планета-5', nick: '«Ижак»', year: 1990, type: 'bike', drive: 'rwd', mass: 250, hp: 500, acc: 6.4, vmax: 36, brake: 7.4, grip: 0.95, steer: 0.5,
      shape: { body: 'bike', L: 2.115, W: 0.815, H: 1.2, clr: 0.135, belt: 0.8, hood: 0, trunk: 0, ws: 0, rw: 0, round: 0.5, wr: 0.318, tw: 0.09, wb: 1.44, lights: 'round2', grille: 'black' },
      colors: pal('Оранжево-красный x2', 'Вишнёвый', 'Синий', 'Чёрный', 'Красный'), spawn: 3
    }
  };
  N.HANDLING = {
    vaz2101: { gears: 4, soft: 1.15 },
    vaz2106: { gears: 4, soft: 1.1 },
    vaz2107: { gears: 5, soft: 1.1 },
    vaz2109: { gears: 5, tb: 0.48 },
    vaz21099: { gears: 5, tb: 0.48 },
    vaz2110: { gears: 5, tb: 0.48, stiff: 0.15 },
    niva: { gears: 5, soft: 1.05, dmg: 0.9 },
    oka: { gears: 4, tb: 0.48, dmg: 1.2 },
    zaz968: { gears: 4, tb: 0.52, soft: 1.1, dmg: 1.1, engine: 'rear' },
    m2141: { gears: 5, tb: 0.48 },
    m412: { gears: 4, soft: 1.1 },
    volga24: { gears: 4, soft: 1.3, damp: 0.85, dmg: 0.85 },
    volga3110: { gears: 5, soft: 1.25, damp: 0.9, dmg: 0.85 },
    volga3102: { gears: 5, soft: 1.2, damp: 0.9, dmg: 0.85 },
    uaz469: { gears: 4, soft: 1.15, dmg: 0.8 },
    uaz452: { gears: 4, soft: 1.15, dmg: 0.8 },
    gazel: { gears: 5, soft: 1.1, dmg: 0.8 },
    gaz53: { gears: 4, dmg: 0.6 },
    ural4320: { gears: 5, dmg: 0.5 },
    btr80: { gears: 5 },
    t72: { gears: 4 },
    avtozak: { gears: 4, dmg: 0.55 },
    paz: { gears: 4, soft: 1.5, dmg: 0.6 },
    bmw525: { gears: 5, soft: 0.85, damp: 1.25, stiff: 0.35, tb: 0.5, dmg: 0.9 },
    merc600: { gears: 5, soft: 0.95, damp: 1.3, stiff: 0.25, dmg: 0.7 },
    audi80: { gears: 5, tb: 0.48, stiff: 0.15 },
    lc80: { gears: 5, soft: 1.1, dmg: 0.7 },
    ural: { gears: 4, dmg: 1.2 },
    izh: { gears: 4, dmg: 1.2 }
  };
  N.VEHICLE_IDS = Object.keys(N.VEHICLES);
  for (const id of N.VEHICLE_IDS) {
    const v = N.VEHICLES[id];
    v.id = id;
    v.hl = v.shape.L / 2;
    v.hw = v.shape.W / 2;
    v.lf = v.shape.wb * 0.5;
    v.lr = v.shape.wb * 0.5;
    v.inertia = v.mass * (v.shape.L * v.shape.L + v.shape.W * v.shape.W) / 12;
  }

  N.SIT_HIP = 0.17;
  N.PELVIS_Y = 0.98;
  N.seatRoot = (cab, tall) => (cab.bike ? cab.seat.y + 0.08 : Math.min(cab.seat.y + N.SIT_HIP, cab.H - 0.89 * tall)) - N.PELVIS_Y * tall;

  N.cabin = spec => {
    if (spec.cab) return spec.cab;
    const s = spec.shape;
    const hw = s.W / 2;
    if (spec.type === 'bike') {
      const ox = s.sidecar ? -s.sidecar / 2 : 0, sa = s.seat || 1.12;
      spec.cab = { bike: true, hw, belt: s.belt, H: s.H, clr: s.clr, door: null, seat: { x: ox, y: s.seatY || 0.78, z: -s.wb / 2 + sa }, bars: { x: s.barsX || 0.34, y: s.barsY || 0.995, z: -s.wb / 2 + (s.barsA || 0.61) }, side: s.sidecar ? { x: s.sidecar / 2 - 0.1, y: 0.36, z: -s.wb / 2 + sa + 0.18 } : null };
      return spec.cab;
    }
    if (s.hatch) {
      const [hx, hy, hz] = s.hatch, seat = { x: hx, y: hy - 1.05, z: hz };
      spec.cab = { bike: false, armor: true, hw, gb: hw - 0.3, belt: s.belt, H: s.H, clr: s.clr, z1: hz - 1, z2: hz - 0.6, z4: hz + 1, hatch: { x: hx, y: hy, z: hz }, door: { z0: hz - 0.6, z1: hz + 0.6, len: 1.2, y0: s.clr + 0.04 }, seat, wheel: { x: hx, y: hy - 0.55, z: hz - 0.45, r: 0.18, tilt: 0.6 } };
      return spec.cab;
    }
    const zF = -s.L / 2, zR = s.L / 2;
    const box = s.body === 'van' || s.body === 'bus' || s.body === 'bread';
    const truck = s.body === 'truck';
    const z1 = zF + s.hood, z2 = z1 + s.ws;
    const z4 = box ? zR - 0.05 : truck ? z1 + 1.7 : zR - s.trunk;
    const bev = 0.035 + s.round * 0.09;
    const gb = hw - bev - 0.04 - (box ? -0.02 : 0);
    const wf = -s.wb / 2 + (s.body === 'bus' ? -0.3 : truck ? -0.4 : 0);
    const ra = s.wr + 0.06;
    const d0 = s.door ? s.door[0] + s.ax + zF : box || truck ? z1 + 0.04 : Math.max(z1 + 0.04, wf + ra * 0.75);
    const d1 = s.door ? s.door[1] + s.ax + zF : box ? d0 + 0.82 : truck ? d0 + 1.0 : N.lerp(z1, z4, s.doors === 2 ? 0.58 : 0.46) + 0.06;
    const seat = { x: -gb * 0.45, y: s.seatY !== undefined ? s.seatY : s.clr + 0.12, z: s.seat !== undefined ? zF + s.ax + s.seat : box || truck ? z1 + 0.55 : N.lerp(z1, z4, 0.36) };
    spec.cab = { bike: false, box, truck, hw, gb, belt: s.belt, H: s.H, clr: s.clr, z1, z2, z4, door: { z0: d0, z1: d1, len: d1 - d0, y0: s.clr + 0.04 }, seat, wheel: { x: seat.x, y: s.wheelY !== undefined ? s.wheelY : s.belt + 0.06, z: seat.z - (s.wheelZ || 0.5), r: s.wheelR || (box || truck ? 0.2 : 0.17), tilt: s.wheelTilt || 0.45 } };
    return spec.cab;
  };

  N.WEAPONS = {
    fists: { name: 'Кулаки', slot: 0, melee: true, dmg: 7, rate: 0.42, range: 1.35, clip: 0, price: 0, icon: 'fist' },
    knuckles: { name: 'Кастет', slot: 1, melee: true, dmg: 15, rate: 0.4, range: 1.35, clip: 0, price: 150, icon: 'knuckles' },
    knife: { name: 'Нож', slot: 1, melee: true, dmg: 34, rate: 0.5, range: 1.5, clip: 0, price: 400, icon: 'knife', blade: true },
    pm: { name: 'ПМ', slot: 2, dmg: 24, rate: 0.28, range: 70, clip: 8, spread: 0.014, price: 2500, ammoPrice: 300, ammoPack: 24, reload: 1.2, icon: 'pm', sound: 'pistol', driveBy: true, brass: true, mz: [0.62, 0.04, 1.4], kick: [0.05, 0.16], rk: [[0.12, 'magout'], [0.55, 'magin'], [0.8, 'slide']] },
    shotgun: { name: 'Дробовик', slot: 3, dmg: 14, pellets: 8, rate: 0.95, range: 32, clip: 6, spread: 0.085, price: 6000, ammoPrice: 500, ammoPack: 12, reload: 2.0, icon: 'shotgun', sound: 'shotgun', two: true, pump: true, aiRange: 8, reloadAnim: 'pump', mz: [1.22, 0.1, 1.4], kick: [0.08, 0.22], rk: [[0.16, 'shell'], [0.32, 'shell'], [0.48, 'shell'], [0.64, 'shell'], [0.85, 'pump']] },
    ak: { name: 'АК-74', slot: 5, dmg: 27, rate: 0.1, auto: true, range: 110, clip: 30, spread: 0.022, price: 15000, ammoPrice: 900, ammoPack: 60, reload: 1.8, icon: 'ak', sound: 'rifle', driveBy: true, two: true, brass: true, mz: [1.0, 0.1, 1.41], kick: [0.025, 0.05], rk: [[0.15, 'magout'], [0.62, 'magin'], [0.82, 'rack']] },
    svd: { name: 'СВД', slot: 6, dmg: 160, rate: 1.15, range: 420, clip: 10, spread: 0.035, scopeSpread: 0.0006, price: 25000, ammoPrice: 1500, ammoPack: 10, reload: 2.2, icon: 'svd', sound: 'sniper', scope: true, two: true, brass: true, aiRange: 40, mz: [1.42, 0.1, 1.41], kick: [0.06, 0.18], rk: [[0.15, 'magout'], [0.62, 'magin'], [0.82, 'rack']] },
    grenade: { name: 'Граната Ф-1', slot: 8, throw: true, dmg: 240, radius: 7.5, fuse: 3, rate: 0.9, clip: 0, price: 1000, ammoPack: 1, icon: 'grenade', max: 12 },
    rsh12: { name: 'РШ-12', slot: 2, dmg: 95, rate: 0.55, range: 90, clip: 5, spread: 0.016, price: 9000, ammoPrice: 900, ammoPack: 15, reload: 2.8, icon: 'rsh12', sound: 'magnum', driveBy: true, pierce: true, unlockWith: 'pm', reloadAnim: 'revolver', mz: [0.64, 0.03, 1.45], kick: [0.09, 0.42], fx: { size: 0.85, speed: 430, len: 6, w: 0.05 }, rk: [[0.08, 'open'], [0.2, 'eject'], [0.34, 'shell'], [0.44, 'shell'], [0.54, 'shell'], [0.64, 'shell'], [0.74, 'shell'], [0.88, 'close']] },
    toz34: { name: 'ТОЗ-34', slot: 3, dmg: 17, pellets: 9, rate: 0.22, range: 30, clip: 2, spread: 0.06, price: 3500, ammoPrice: 300, ammoPack: 12, reload: 1.7, icon: 'toz34', sound: 'toz', two: true, aiRange: 7, reloadAnim: 'break', mz: [1.11, 0.12, 1.4], kick: [0.09, 0.28], fx: { size: 0.66, speed: 320, len: 3, w: 0.022 }, rk: [[0.1, 'open'], [0.26, 'eject'], [0.5, 'shell'], [0.64, 'shell'], [0.86, 'close']] },
    kiparis: { name: 'ОЦ-02 «Кипарис»', slot: 4, dmg: 15, rate: 0.07, auto: true, range: 55, clip: 30, spread: 0.04, price: 7000, ammoPrice: 500, ammoPack: 60, reload: 1.5, icon: 'kiparis', sound: 'smg', driveBy: true, two: true, compact: true, brass: true, unlockWith: 'shotgun', mz: [0.53, 0.05, 1.38], kick: [0.02, 0.07], fx: { size: 0.3, speed: 360, len: 4, w: 0.03 }, rk: [[0.15, 'magout'], [0.58, 'magin'], [0.8, 'slide']] },
    bizon: { name: 'ПП-19 «Бизон»', slot: 4, dmg: 17, rate: 0.09, auto: true, range: 70, clip: 64, spread: 0.034, price: 12000, ammoPrice: 800, ammoPack: 64, reload: 2.3, icon: 'bizon', sound: 'smg', driveBy: true, two: true, brass: true, unlockWith: 'ak', mz: [0.61, 0.12, 1.4], kick: [0.02, 0.05], fx: { size: 0.34, speed: 380, len: 5, w: 0.032 }, rk: [[0.16, 'magout'], [0.6, 'magin'], [0.82, 'rack']] },
    sks: { name: 'СКС', slot: 5, dmg: 38, rate: 0.24, range: 140, clip: 10, spread: 0.012, price: 8000, ammoPrice: 600, ammoPack: 30, reload: 2.3, icon: 'sks', sound: 'sks', two: true, brass: true, aiRange: 20, unlockWith: 'shotgun', reloadAnim: 'clip', mz: [0.82, 0.12, 1.39], kick: [0.035, 0.1], fx: { size: 0.5, speed: 600, len: 10, w: 0.04 }, rk: [[0.1, 'rack'], [0.42, 'clip'], [0.6, 'clip2'], [0.84, 'slide']] },
    vss: { name: 'ВСС «Винторез»', slot: 6, dmg: 70, rate: 0.16, range: 300, clip: 10, spread: 0.02, scopeSpread: 0.0015, price: 28000, ammoPrice: 1600, ammoPack: 20, reload: 1.9, icon: 'vss', sound: 'vss', scope: true, zoom: [0.5, 0.2], quiet: true, two: true, brass: true, aiRange: 26, unlockWith: 'svd', mz: [0.75, 0.12, 1.4], kick: [0.02, 0.05], fx: { size: 0.1, speed: 290, len: 2.5, w: 0.014, faint: true }, rk: [[0.15, 'magout'], [0.62, 'magin'], [0.82, 'rack']] },
    pkm: { name: 'ПКМ', slot: 7, dmg: 30, rate: 0.085, auto: true, range: 150, clip: 100, spread: 0.028, price: 30000, ammoPrice: 2000, ammoPack: 100, reload: 3.6, icon: 'pkm', sound: 'mg', two: true, brass: true, heavy: 0.78, climb: 0.08, aiRange: 18, unlockWith: 'ak', reloadAnim: 'belt', mz: [1.2, 0.12, 1.4], kick: [0.035, 0.06], fx: { size: 0.5, speed: 560, len: 12, w: 0.05 }, rk: [[0.1, 'cover'], [0.24, 'magout'], [0.52, 'magin'], [0.66, 'belt'], [0.76, 'cover'], [0.9, 'rack']] },
    rpg7: { name: 'РПГ-7', slot: 7, dmg: 320, radius: 8.5, rate: 1, range: 600, clip: 1, spread: 0.004, rocket: true, price: 40000, ammoPrice: 3000, ammoPack: 2, reload: 2.8, icon: 'rpg7', sound: 'rpg', two: true, heavy: 0.85, unlockWith: 'grenade', reloadAnim: 'rocket', mz: [0.53, 0.15, 1.5], kick: [0.07, 0.1], rk: [[0.28, 'grab'], [0.62, 'rpgload'], [0.86, 'rack']] },
    molotov: { name: 'Коктейль Молотова', slot: 8, throw: true, fire: true, dmg: 14, radius: 3.2, burn: 9, rate: 0.9, clip: 0, price: 300, ammoPack: 1, icon: 'molotov', max: 12 },
    izh38: { name: 'ИЖ-38', slot: 5, dmg: 8, rate: 0.3, range: 45, clip: 1, spread: 0.0035, price: 1200, ammoPrice: 60, ammoPack: 100, reload: 1.25, icon: 'izh38', sound: 'airgun', two: true, quiet: true, air: true, aiRange: 10, reloadAnim: 'airgun', mz: [0.95, 0.1, 1.4], kick: [0.012, 0.035], fx: { size: 0.05, speed: 150, len: 0.5, w: 0.004, faint: true, air: true }, rk: [[0.08, 'airbreak'], [0.34, 'airclick'], [0.6, 'pellet'], [0.86, 'airclose']] }
  };
  N.VEH_GUNS = {
    cannon125: { name: '2А46М', dmg: 520, radius: 8, speed: 150, spread: 0.003, sound: 'cannon', fx: { size: 2.6, speed: 900, len: 14, w: 0.18 } },
    pkt: { name: 'ПКТ', dmg: 30, rate: 0.085, range: 160, spread: 0.02, auto: true, sound: 'mg', fx: { size: 0.5, speed: 560, len: 12, w: 0.05 } },
    kpvt: { name: 'КПВТ', dmg: 70, rate: 0.14, range: 220, spread: 0.012, auto: true, pierce: true, sound: 'kpvt', fx: { size: 1.1, speed: 700, len: 16, w: 0.08 } },
    yakb: { name: 'ЯкБ-12,7', dmg: 45, rate: 0.07, range: 320, spread: 0.03, auto: true, pierce: true, sound: 'kpvt', fx: { size: 1.0, speed: 720, len: 16, w: 0.07 } }
  };
  N.HELIS = {
    mi2: { name: 'Ми-2', hp: 500, armor: 1, hit: [-1.0, 2.8, 0.85, -1.1, 1.3] },
    mi8: { name: 'Ми-8', hp: 1000, armor: 0.7, hit: [-3.0, 6.2, 1.3, -1.45, 2.0] },
    mi24: { name: 'Ми-24', hp: 1800, armor: 0.3, hit: [-3.2, 6.0, 1.1, -1.3, 1.6], gun: 'yakb', muzzle: [0, -1.21, -9.3], pods: [[-1.75, -0.68, -2.3], [1.75, -0.68, -2.3], [-2.7, -0.82, -2.3], [2.7, -0.82, -2.3]] }
  };
  N.WEAPON_IDS = Object.keys(N.WEAPONS);
  for (const id of N.WEAPON_IDS) N.WEAPONS[id].id = id;
  N.SLOTS = [['fists'], ['knuckles', 'knife'], ['pm', 'rsh12'], ['shotgun', 'toz34'], ['kiparis', 'bizon'], ['ak', 'sks', 'izh38'], ['svd', 'vss'], ['pkm', 'rpg7'], ['grenade', 'molotov']];
  N.START_WEAPONS = ['knuckles', 'knife', 'toz34', 'molotov'];

  N.OUTFITS = {
    zek: { name: 'Роба', top: '#3a3e44', pants: '#2c3036', shoes: '#1a1a1a', topKind: 'jacket', price: 0 },
    leather: { name: 'Кожаная куртка', top: '#2a1e16', pants: '#1e2c48', shoes: '#141414', topKind: 'jacket', leather: true, price: 1800 },
    tracksuit: { name: 'Спортивный костюм «Абибас»', top: '#16307a', pants: '#16307a', shoes: '#e8e8e8', topKind: 'track', stripes: true, price: 1200 },
    raspberry: { name: 'Малиновый пиджак', top: '#b0164e', pants: '#141414', shoes: '#0c0c0c', topKind: 'suit', chain: true, price: 4500 },
    hawaii: { name: 'Турецкая гавайка', top: '#2aa3a0', pants: '#3a5e90', shoes: '#d8d4c8', topKind: 'shirt', pattern: 'palms', price: 900 }
  };

  N.PED_KINDS = {
    worker: { male: true, tops: ['#2c4a78', '#34507a', '#4a4e56'], pants: ['#26344e', '#2c3a50'], topKind: 'jacket', hats: ['cap', 'none', 'none'], hp: 100 },
    babushka: { male: false, old: true, tops: ['#5a3a3a', '#3a4a5a', '#6a5a3a', '#4a2a3a'], pants: ['#3a3a3a', '#4a3a2a'], topKind: 'coat', hats: ['scarf'], bag: true, hp: 70 },
    student: { male: true, tops: ['#8a2a2a', '#2a5a3a', '#6a6a70', '#2a3a6a'], pants: ['#2a3a5a', '#3a4a6a'], topKind: 'sweater', hats: ['none'], hp: 100 },
    girl: { male: false, tops: ['#d8386a', '#e0e0e0', '#2a2a2a', '#e8a020', '#5a2a8a'], pants: ['#1a1a1a', '#2a3a6a', '#d8d0c0'], topKind: 'top', skirt: true, hats: ['none'], hp: 90 },
    gopnik: { male: true, tops: ['#16307a', '#1a1a1a', '#2a5a2a', '#6a1a1a'], pants: ['#16307a', '#1a1a1a'], topKind: 'track', stripes: true, hats: ['cap', 'cap', 'none'], hp: 110, tough: 0.6 },
    business: { male: true, tops: ['#b0164e', '#1a1a1a', '#2a2e3a'], pants: ['#141414', '#1a1a1a'], topKind: 'suit', hats: ['none'], chain: true, hp: 100 },
    pensioner: { male: true, old: true, tops: ['#4a4a3a', '#3a3a3a', '#5a4a3a'], pants: ['#3a3a3a', '#4a4a44'], topKind: 'jacket', hats: ['cap', 'none'], hp: 70 },
    muzhik: { male: true, tops: ['#e8e8f0'], pants: ['#2a2a2a', '#3a3a4a'], topKind: 'vest', stripesH: true, hats: ['none', 'cap'], hp: 110, tough: 0.4 },
    woman: { male: false, tops: ['#7a2a4a', '#2a6a7a', '#8a7a4a', '#4a4a7a', '#c86a4a'], pants: ['#3a3a3a'], topKind: 'dress', skirt: true, hats: ['none', 'none', 'scarf'], bag: true, hp: 90 },
    chelnok: { male: false, tops: ['#6a2a2a', '#3a3a5a'], pants: ['#2a2a2a'], topKind: 'coat', hats: ['none'], bag: true, bigBag: true, hp: 90 },
    militia: { male: true, cop: true, tops: ['#5a6068'], pants: ['#4a5058'], topKind: 'uniform', hats: ['furazhka'], hp: 120, weapon: 'pm' },
    gai: { male: true, cop: true, tops: ['#5a6068'], pants: ['#4a5058'], topKind: 'uniform', belt: true, hats: ['furazhka'], hp: 120, weapon: 'pm' },
    omon: { male: true, cop: true, tops: ['#2a2e34'], pants: ['#2a2e34'], topKind: 'uniform', hats: ['helmet'], hp: 170, weapon: 'ak', armor: 60 },
    fsb: { male: true, cop: true, tops: ['#16181c'], pants: ['#16181c'], topKind: 'suit', hats: ['none'], glasses: true, hp: 150, weapon: 'ak', arms: ['ak', 'vss', 'bizon'] },
    soldier: { male: true, cop: true, tops: ['#4a5234'], pants: ['#4a5234'], topKind: 'uniform', camo: true, hats: ['helmet'], hp: 180, weapon: 'ak', armor: 50, arms: ['ak', 'ak', 'pkm'] },
    bandit: { male: true, gang: true, tops: ['#1a1410', '#221a14'], pants: ['#16307a', '#1a1a1a'], topKind: 'jacket', leather: true, hats: ['none', 'none', 'cap'], hp: 120, weapon: 'pm', arms: ['pm', 'pm', 'toz34', 'kiparis', 'pm', 'rsh12'] },
    zarechny: { male: true, gang: true, tops: ['#1a1a1a', '#16307a', '#2a2a5a'], pants: ['#1a1a1a'], topKind: 'track', stripes: true, hats: ['cap'], hp: 110, weapon: 'knife' },
    dancer: { male: false, tops: ['#e8e8e8', '#e03a8a', '#20c0d0', '#f0d020'], pants: ['#1a1a1a'], topKind: 'top', skirt: true, hats: ['none'], hp: 90 },
    guard: { male: true, tops: ['#2a3a2a'], pants: ['#2a3a2a'], topKind: 'uniform', hats: ['cap'], hp: 110, weapon: 'pm' }
  };

  N.CIVIL_MIX = {
    leninsky: [['worker', 5], ['babushka', 4], ['student', 4], ['girl', 4], ['gopnik', 3], ['business', 1], ['pensioner', 3], ['muzhik', 2], ['woman', 5], ['chelnok', 1]],
    avtozavod: [['worker', 8], ['babushka', 3], ['student', 2], ['girl', 3], ['gopnik', 4], ['business', 1], ['pensioner', 3], ['muzhik', 3], ['woman', 4], ['chelnok', 2]],
    market: [['chelnok', 6], ['babushka', 4], ['woman', 5], ['gopnik', 2], ['worker', 2], ['muzhik', 2]],
    park: [['girl', 4], ['student', 3], ['pensioner', 3], ['woman', 3], ['babushka', 2], ['gopnik', 2]]
  };

  N.TRAFFIC_MIX = {
    leninsky: [['vaz2101', 8], ['vaz2106', 12], ['vaz2107', 11], ['vaz2109', 11], ['vaz21099', 10], ['vaz2110', 7], ['niva', 4], ['oka', 4], ['zaz968', 3], ['m2141', 5], ['m412', 5], ['volga24', 6], ['volga3110', 7], ['volga3102', 2], ['uaz469', 2], ['uaz452', 2], ['gazel', 6], ['gaz53', 2], ['paz', 2], ['bmw525', 3], ['merc600', 2], ['audi80', 4], ['lc80', 2], ['izh', 2], ['ural', 2]],
    avtozavod: [['vaz2101', 9], ['vaz2106', 12], ['vaz2107', 12], ['vaz2109', 9], ['vaz21099', 9], ['vaz2110', 6], ['niva', 5], ['oka', 5], ['zaz968', 5], ['m2141', 5], ['m412', 6], ['volga24', 7], ['volga3110', 9], ['volga3102', 2], ['uaz469', 3], ['uaz452', 3], ['gazel', 7], ['gaz53', 4], ['paz', 3], ['bmw525', 2], ['merc600', 1], ['audi80', 3], ['lc80', 1], ['izh', 3], ['ural', 3]]
  };

  N.RADIO = [
    { id: 'disco', name: 'Дискотека 2000', freq: '101.4 FM', bpm: 136, key: 57, minor: true, style: 'disco', dj: ['Вы слушаете «Дискотеку 2000»! Руки вверх, Нижний!', 'Привет Автозаводу и всем, кто сейчас в пробке на Ленина!', 'Сегодня вечером в клубе «Мираж» — пенная вечеринка! Вход до десяти — бесплатно для девушек.', 'Звонок в студию: «Передайте привет Серёге с Мончегорской, он знает за что!»', 'Лето, солнце, дискотека — не выключайте приёмник!'] },
    { id: 'chanson', name: 'Шансон-НН', freq: '104.8 FM', bpm: 96, key: 52, minor: true, style: 'chanson', dj: ['«Шансон-НН» — песни для души и для дороги.', 'А эту песню заказал Николай Петрович с ГАЗа для своей бригады. Мужики, держитесь!', 'Кто там в Молитовке шашлык жарит? Нам тоже оставьте.', 'Дорогие водители маршруток, эта песня для вас. Не гоняйте!', 'Помните, ребята: главное — чтобы человеком оставался.'] },
    { id: 'rock', name: 'Рок-Причал', freq: '99.2 FM', bpm: 124, key: 45, minor: true, style: 'rock', dj: ['«Рок-Причал»! Только гитары, только громко!', 'Концерт в ДК ГАЗ переносится — у басиста опять пейджер украли.', 'Кто сказал, что рок умер? Мы тут, на волне 99.2!', 'Следующий трек — для тех, кто сейчас летит по Южному шоссе. Осторожно, там ГАИ!'] },
    { id: 'news', name: 'Волжская волна', freq: '88.6 FM', bpm: 110, key: 60, minor: false, style: 'lounge', dj: ['Новости: курс доллара на Нижегородской валютной бирже — двадцать восемь рублей сорок копеек.', 'На Мызинском мосту продолжается ремонт. ГАИ просит водителей объезжать.', 'Погода: в Нижнем Новгороде до двадцати семи градусов тепла, к вечеру возможна гроза.', 'ГАЗ сообщает о выпуске новой «Волги». Очередь на покупку — до осени.', 'Происшествия: в Молитовке ночью слышали стрельбу. Милиция выясняет обстоятельства.', 'Реклама: пейджинговая связь «Волга-Пейдж» — всегда на связи! Абонентская плата — всего пятнадцать долларов.'] }
  ];

  N.PICKUPS = {
    health: { name: 'Аптечка', color: '#e02828' },
    armor: { name: 'Бронежилет', color: '#3a6ad0' },
    bribe: { name: 'Взятка', color: '#e8d040' },
    stash: { name: 'Заначка', color: '#40d060' },
    money: { name: 'Деньги', color: '#40c040' },
    weapon: { name: 'Оружие', color: '#e0a020' },
    item: { name: 'Предмет', color: '#f0f0f0' }
  };

  N.PLATE_LETTERS = 'АВЕКМНОРСТУХ';
  N.plate = r => {
    const L = N.PLATE_LETTERS;
    return L[Math.floor(r() * 12)] + String(Math.floor(r() * 900) + 100) + L[Math.floor(r() * 12)] + L[Math.floor(r() * 12)] + ' 52';
  };
  const plateList = (n, seed, make) => { const r = N.rng(seed); return Array.from({ length: n }, () => make(r)); };
  const letter = r => N.PLATE_LETTERS[Math.floor(r() * 12)];
  N.PLATES = {
    civil: plateList(32, 5201, N.plate),
    militia: plateList(8, 5202, r => letter(r) + String(Math.floor(r() * 9000) + 1000) + ' 52'),
    army: plateList(8, 5203, r => String(Math.floor(r() * 9000) + 1000) + letter(r) + letter(r) + ' ' + ['21', '23', '25', '27', '43'][Math.floor(r() * 5)])
  };
  N.plateClass = livery => (['militia', 'omon', 'dps', 'old', 'gai'].includes(livery) ? 'militia' : livery === 'army' ? 'army' : 'civil');
  N.SIRENS = new Set(['bar', 'dps', 'dome', 'magnet', 'pole']);
  const unit = (w, model, livery, crew, n, cap) => ({ w, model, livery, crew, n, cap: cap || 0 });
  const PATROL = [unit(34, 'vaz2107', 'militia', 'militia', 2), unit(26, 'vaz2106', 'militia', 'militia', 2), unit(24, 'uaz469', 'militia', 'militia', 2),
    unit(6, 'vaz2101', 'old', 'militia', 2), unit(5, 'vaz2106', 'old', 'militia', 2), unit(5, 'uaz469', 'old', 'militia', 2)];
  const ROAD = PATROL.map(u => unit(u.w * 0.62, u.model, u.livery, u.crew, u.n)).concat([unit(13, 'vaz2109', 'dps', 'militia', 2), unit(13, 'vaz2110', 'dps', 'militia', 2), unit(12, 'volga3110', 'dps', 'militia', 2), unit(6, 'ural', 'gai', 'militia', 2)]);
  const OMON = [unit(45, 'avtozak', 'omon', 'omon', 8), unit(15, 'paz', 'omon', 'omon', 6)];
  N.DISPATCH = [
    null,
    { max: 1, units: PATROL },
    { max: 2, units: ROAD },
    { max: 3, units: ROAD, roadblock: 'militia', heli: 'mi2' },
    { max: 3, units: OMON.concat(ROAD.map(u => unit(u.w * 0.4, u.model, u.livery, u.crew, u.n))), roadblock: 'omon', heli: 'mi2', drop: true },
    { max: 4, units: [unit(40, 'volga3102', 'fsb', 'fsb', 3), unit(30, 'avtozak', 'omon', 'omon', 8), unit(10, 'paz', 'omon', 'omon', 6)].concat(ROAD.map(u => unit(u.w * 0.2, u.model, u.livery, u.crew, u.n))), roadblock: 'omon', heli: 'mi2', drop: true },
    { max: 5, units: [unit(22, 'ural4320', 'army', 'soldier', 8), unit(18, 'uaz469', 'army', 'soldier', 3), unit(14, 'btr80', 'army', 'soldier', 3, 2), unit(10, 't72', 'army', 'soldier', 3, 1), unit(24, 'avtozak', 'omon', 'omon', 8), unit(12, 'paz', 'omon', 'omon', 6)], roadblock: 'omon', heli: 'mi24', drop: true }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
