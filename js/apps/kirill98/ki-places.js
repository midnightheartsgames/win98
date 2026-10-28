(function (K) {
  'use strict';

  const ZONES = Object.freeze({ 1: 'Земли людей', 2: 'Земли императора', 3: 'Эльфийский лес', 4: 'Горы Злого' });

  const KINDS = Object.freeze({
    tract: Object.freeze({ width: 6, grade: 10, cart: true }),
    road: Object.freeze({ width: 5, grade: 9, cart: true }),
    street: Object.freeze({ width: 6, grade: 8, cart: true }),
    path: Object.freeze({ width: 3, grade: 14, cart: false }),
    trail: Object.freeze({ width: 2, grade: 18, cart: false }),
    goat: Object.freeze({ width: 1.5, grade: 24, cart: false }),
    bridge: Object.freeze({ width: 5.4, grade: 0, cart: true, deck: true }),
    ford: Object.freeze({ width: 4, grade: 0, cart: false, wet: true })
  });

  const ROADS = [
    { id: 'goat', name: 'Козья тропа', kind: 'goat', pts: [[1240, 392], [1240, 372], [1200, 345], [1290, 320], [1180, 290], [1290, 262], [1170, 236], [1080, 232], [1150, 206], [1060, 190], [1130, 165], [1050, 140], [1110, 118], [1040, 105], [999, 105]] },
    { id: 'korni-ford', name: 'Тропа от Корней к броду', kind: 'trail', pts: [[350, 712], [420, 692], [520, 710], [642, 715], [700, 740], [750, 760]] },
    { id: 'korni-log', name: 'Тропа к Сухому логу', kind: 'trail', pts: [[350, 712], [380, 600], [450, 500], [520, 425]] },
    { id: 'log-road', name: 'Тропа от Сухого лога', kind: 'trail', pts: [[520, 425], [632, 450]] },
    { id: 'korni-bear', name: 'Тропа к Медвежьему углу', kind: 'trail', pts: [[350, 712], [285, 820], [230, 940], [175, 1055]] },
    { id: 'cutters', name: 'Тропа к лагерю рубщиков', kind: 'trail', pts: [[622, 330], [565, 305]] },
    { id: 'fort-postern', name: 'Проход к калитке форта', kind: 'trail', pts: [[960, 105], [999, 105]] },
    { id: 'ford-east', name: 'Бродская дорожка', kind: 'path', pts: [[778, 760], [900, 778], [1010, 805], [1105, 840]] },
    { id: 'lesoseka', name: 'Дорога к Лесосеке', kind: 'path', pts: [[642, 980], [680, 905]] },
    { id: 'hamlet-w', name: 'Дорога на Ракитный', kind: 'path', pts: [[700, 1250], [610, 1330], [525, 1375]] },
    { id: 'hamlet-sw', name: 'Дорога на Ключи', kind: 'path', pts: [[610, 1330], [630, 1405]] },
    { id: 'hamlet-se', name: 'Дорога на Межу', kind: 'path', pts: [[842, 1420], [1000, 1410], [1155, 1392]] },
    { id: 'mill', name: 'Дорога к мельнице', kind: 'path', pts: [[1000, 1410], [1052, 1372]] },
    { id: 'hamlet-e', name: 'Дорога на Выселки', kind: 'path', pts: [[905, 1255], [1100, 1268], [1325, 1280]] },
    { id: 'tsarevo', name: 'Дорога в Царёво', kind: 'road', pts: [[1060, 950], [1180, 978], [1295, 1000]] },
    { id: 'outpost', name: 'Дорога на заставу', kind: 'road', pts: [[1146, 700], [1132, 660], [1130, 580], [1160, 500], [1205, 440], [1240, 418], [1240, 392]] },
    { id: 'forest', name: 'Лесная дорога', kind: 'road', pts: [[755, 1325], [700, 1250], [660, 1120], [642, 980], [640, 840], [642, 715], [640, 560], [632, 450], [628, 390], [622, 330], [700, 300], [600, 262], [700, 232], [615, 215], [650, 200], [770, 168], [650, 136], [921, 105]] },
    { id: 'south', name: 'Южный тракт', kind: 'tract', pts: [[840, 1325], [842, 1420], [846, 1480], [850, 1536]] },
    { id: 'tract', name: 'Царский тракт', kind: 'tract', pts: [[840, 1325], [865, 1310], [905, 1255], [960, 1160], [1010, 1060], [1060, 950], [1105, 840], [1122, 760], [1132, 712], [1146, 700]] },
    { id: 'yard', name: 'Улица к двору корованов', kind: 'street', pts: [[840, 1325], [900, 1318], [935, 1310]] },
    { id: 'bridge-street', name: 'Мостовая улица', kind: 'street', pts: [[840, 1325], [787, 1325]] },
    { id: 'palace-yard', name: 'Двор дворца', kind: 'street', pts: [[1146, 700], [1200, 700]] },
    { id: 'fort-yard', name: 'Двор форта', kind: 'street', pts: [[921, 105], [960, 105]] },
    { id: 'bridge', name: 'Мост через Студёную', kind: 'bridge', pts: [[787, 1325], [755, 1325]] },
    { id: 'ford', name: 'Брод', kind: 'ford', pts: [[750, 760], [778, 760]] }
  ];

  const RIVER = Object.freeze({
    pts: [[800, 226], [790, 250], [772, 271], [745, 294], [714, 326], [716, 380], [722, 470], [738, 600], [752, 690], [760, 760], [757, 880], [760, 1000], [764, 1150], [770, 1325], [778, 1430], [788, 1536]],
    half: 7,
    depth: 2.4,
    mountainHalf: 3.5,
    mountainDepth: 1.0,
    mountainUntil: 470,
    floor: -0.6,
    ford: Object.freeze({ at: [760, 760], len: 26, depth: 0.7 }),
    lake: Object.freeze({ at: [804, 205], r: 22, depth: 3.4, name: 'Горное озеро' }),
    cascade: Object.freeze({ until: [714, 326], step: 7 })
  });

  const SWAMP = Object.freeze({ at: [170, 1060], r: 80, fall: 70, ground: -2, level: -1.6, reach: 150 });

  const PALACE = Object.freeze({ x0: 1150, z0: 560, x1: 1390, z1: 760, h: 28 });
  const FORT = Object.freeze({ at: [960, 105], r: 48, h: 140 });

  const SPOTS = [
    { id: 'mostovica', name: 'Мостовица', zones: [1], at: [850, 1330], node: [840, 1325], h: 0.3, r: 120 },
    { id: 'gate', name: 'Ворота дворца', zones: [2], at: [1146, 700], node: [1146, 700], h: 28, r: 22 },
    { id: 'palace', name: 'Дворец на Белом холме', zones: [2], at: [1270, 660], node: [1200, 700], h: 28, r: 125 },
    { id: 'tsarevo', name: 'Царёво', zones: [2], at: [1310, 1010], node: [1295, 1000], h: 2, r: 70 },
    { id: 'outpost', name: 'Застава', zones: [2], at: [1240, 392], node: [1240, 392], h: 35, r: 30 },
    { id: 'ford', name: 'Брод', zones: [3, 2], at: [764, 760], node: [750, 760], h: 0, r: 26 },
    { id: 'ford-tower', name: 'Вышка у брода', zones: [2], at: [786, 752], node: [778, 760], h: 0, r: 16 },
    { id: 'lesoseka', name: 'Лесосека', zones: [3], at: [688, 910], node: [680, 905], h: 0, r: 40 },
    { id: 'korni', name: 'Корни', zones: [3], at: [335, 705], node: [350, 712], h: 12, r: 75 },
    { id: 'log', name: 'Сухой лог', zones: [3], at: [520, 425], node: [520, 425], h: 17, r: 40 },
    { id: 'bear', name: 'Медвежий угол', zones: [3], at: [170, 1060], node: [175, 1055], h: -2, r: 90 },
    { id: 'cutters', name: 'Лагерь рубщиков', zones: [4, 3], at: [560, 300], node: [565, 305], h: 38, r: 35 },
    { id: 'pass', name: 'Перевал', zones: [4], at: [650, 200], node: [650, 200], h: 80, r: 30 },
    { id: 'fort', name: 'Старый форт', zones: [4], at: [960, 105], node: [921, 105], h: 140, r: 62 },
    { id: 'mines', name: 'Рудники', zones: [4], at: [1085, 225], node: [1080, 232], h: 68, r: 40 },
    { id: 'mill', name: 'Мельница', zones: [1], at: [1062, 1362], node: [1052, 1372], h: 0, r: 25 },
    { id: 'rakitny', name: 'Хутор Ракитный', zones: [1], at: [522, 1385], node: [525, 1375], h: 0, r: 30 },
    { id: 'klyuchi', name: 'Хутор Ключи', zones: [1], at: [630, 1415], node: [630, 1405], h: 0, r: 30 },
    { id: 'mezha', name: 'Хутор Межа', zones: [1], at: [1160, 1400], node: [1155, 1392], h: 0, r: 30 },
    { id: 'vyselki', name: 'Хутор Выселки', zones: [1], at: [1328, 1288], node: [1325, 1280], h: 0, r: 30 }
  ];

  const ROUTES = [
    { from: 'mostovica', to: 'gate', time: 160 },
    { from: 'mostovica', to: 'korni', time: 210 },
    { from: 'mostovica', to: 'fort', time: 510 },
    { from: [1240, 392], to: [999, 105], time: 270, name: 'Застава → форт по козьей тропе' },
    { from: 'korni', to: 'ford', time: 108 }
  ];

  const LANDMARKS = [
    { id: 'tower', name: 'Белая башня', zone: 2, at: [1230, 640], top: 40, lights: [{ dy: 41.5, color: [1, 0.9, 0.7], size: 11 }] },
    { id: 'oak', name: 'Старший дуб', zone: 3, at: [330, 700], top: 46, lights: [{ dx: 13, dz: 0, dy: 3, color: [0.72, 0.95, 0.42], size: 3 }, { dx: -13, dz: 2, dy: 3, color: [0.72, 0.95, 0.42], size: 3 }, { dx: 2, dz: 13, dy: 3, color: [0.72, 0.95, 0.42], size: 3 }, { dx: -4, dz: -13, dy: 3, color: [0.72, 0.95, 0.42], size: 3 }, { dx: 9, dz: 9, dy: 30, color: [0.8, 0.95, 0.5], size: 5 }, { dx: -9, dz: -8, dy: 34, color: [0.8, 0.95, 0.5], size: 5 }] },
    { id: 'fort', name: 'Старый форт', zone: 4, at: [992, 78], top: 18, lights: [{ ax: 945, az: 123, dy: 11, color: [1, 0.32, 0.12], size: 10 }, { dy: 21, color: [1, 0.42, 0.18], size: 6 }] },
    { id: 'belfry', name: 'Колокольня', zone: 1, at: [800, 1312], top: 28, lights: [{ dy: 26, color: [1, 0.82, 0.38], size: 4.5 }] }
  ];

  const platform = (x, z, y, hut) => {
    const list = [{ x, z, w: 0.8, d: 0.8, h: y, kind: 'bark' }, { x, z, w: 7, d: 7, h: 0.4, y, kind: 'wood' }];
    if (hut) list.push({ x, z, w: 4.5, d: 4.5, h: 3, y: y + 0.4, kind: 'wood' });
    return list;
  };

  const BOXES = [
    { x: 771, z: 1325, w: 32, d: 6, kind: 'stone', deck: true, id: 'bridge' },
    { x: 771, z: 1322.15, w: 32, d: 0.3, h: 1, kind: 'stone', onDeck: true },
    { x: 771, z: 1327.85, w: 32, d: 0.3, h: 1, kind: 'stone', onDeck: true },

    { x: 1230, z: 640, w: 12, d: 12, h: 40, kind: 'plaster', landmark: 'tower', dressed: 'white' },
    { x: 1330, z: 1065, w: 14, d: 10, h: 8, kind: 'wood', id: 'granary', dressed: 'granary' },
    { x: 1370, z: 990, w: 6, d: 6, h: 14, kind: 'wood', id: 'windmill', dressed: 'mill' },
    { x: 1233, z: 385, w: 5, d: 5, h: 12, kind: 'wood', id: 'outpost-tower', dressed: 'watch' },
    { x: 786, z: 752, w: 4, d: 4, h: 10, kind: 'wood', id: 'ford-tower', dressed: 'watch' },

    { x: 657, z: 928, w: 6, d: 3, h: 1.5, kind: 'bark' }, { x: 706, z: 894, w: 6, d: 3, h: 1.5, kind: 'bark' },
    ...platform(290, 740, 10, false), ...platform(370, 670, 10, false), ...platform(275, 680, 11, false),
    { x: 345, z: 688, w: 6, d: 5, h: 2, kind: 'bark', id: 'store' },
    ...platform(395, 655, 8, false), ...platform(270, 760, 8, false),
    { x: 505, z: 410, w: 4, d: 3, h: 2, kind: 'bark' }, { x: 535, z: 412, w: 4, d: 3, h: 2, kind: 'bark' }, { x: 528, z: 440, w: 4, d: 3, h: 2, kind: 'bark' },
    { x: 160, z: 1045, w: 4, d: 3, h: 2, kind: 'bark' }, { x: 190, z: 1070, w: 4, d: 3, h: 2, kind: 'bark' },
    { x: 575, z: 290, w: 8, d: 3, h: 1.5, kind: 'bark' },
    { x: 656, z: 194, w: 1.2, d: 1.2, h: 3, kind: 'stone', id: 'cairn', dressed: 'cairn' },

    { x: 992, z: 78, w: 7, d: 7, h: 18, kind: 'dark', landmark: 'fort', dressed: 'keep' },
    { x: 1080, z: 215, w: 10, d: 8, h: 6, kind: 'dark', id: 'mine-mouth', dressed: 'mine' },
    { x: 1100, z: 242, w: 12, d: 8, h: 3, kind: 'stone', id: 'ore-heap', dressed: 'heap' }
  ];

  const bld = (id, kind, x, z, w, d, h, o) => Object.freeze(Object.assign({ id, kind, x, z, w, d, h, rot: 0, wall: 'plaster', roof: 'shingle', door: 's', open: false }, o || {}));
  const BUILDINGS = Object.freeze([
    bld('inn', 'inn', 840, 1290, 24, 16, 6.2, { wall: 'plank', roof: 'shingle', door: 's', open: true, width: 1.4, name: 'Постоялый двор «Колесо»', layout: 'inn', storeys: 2 }),
    bld('doctor', 'doctor', 815, 1368, 12, 10, 3.4, { door: 'n', open: true, width: 1.4, ramp: true, name: 'Дом лекаря Акима', layout: 'doctor' }),
    bld('sharnir', 'workshop', 870, 1368, 14, 10, 3.6, { wall: 'plank', door: 'n', open: true, width: 1.4, name: 'Мастерская Шарнира', layout: 'workshop' }),
    bld('watch', 'watch', 820, 1395, 10, 8, 3.2, { wall: 'stone', roof: 'slate', door: 'n', open: true, width: 1.2, name: 'Сторожка стражи', layout: 'watch' }),
    bld('belfry', 'belfry', 800, 1312, 6, 6, 21, { wall: 'stone', roof: 'slate', name: 'Колокольня', landmark: 'belfry', top: 28 }),
    bld('house-a', 'house', 805, 1280, 10, 8, 3.2, { door: 's' }),
    bld('house-b', 'house', 880, 1272, 10, 8, 3.2, { rot: 12, door: 's' }),
    bld('house-bridge', 'house', 798, 1358, 10, 8, 3.2, { wall: 'log', roof: 'thatch', door: 'n', open: true, width: 1.2, layout: 'home', price: 600, name: 'Дом у моста' }),
    bld('house-c', 'house', 800, 1398, 10, 8, 3.2, { door: 'n' }),
    bld('house-d', 'house', 865, 1395, 10, 8, 3.2, { rot: -8, door: 'n' }),
    bld('house-e', 'house', 890, 1365, 10, 8, 3.2, { door: 'n' }),
    bld('house-f', 'house', 915, 1385, 10, 8, 3.2, { rot: 6, door: 'n' }),
    bld('house-g', 'house', 955, 1365, 10, 8, 3.2, { wall: 'log', roof: 'thatch', door: 'n' }),
    bld('house-garden', 'house', 990, 1360, 10, 8, 3.2, { door: 'n', open: true, width: 1.2, layout: 'home', price: 1100, name: 'Дом с садом', garden: true }),
    bld('house-h', 'house', 960, 1232, 10, 8, 3.2, { rot: 20, door: 's' }),
    bld('stall-arms', 'stall', 820, 1309, 3, 2, 2.3, { door: 'n', shop: 'arms', name: 'Оружейник' }),
    bld('stall-armor', 'stall', 850, 1309, 3, 2, 2.3, { door: 'n', shop: 'armor', name: 'Бронник' }),
    bld('stall-goods', 'stall', 822, 1342, 3, 2, 2.3, { door: 's', shop: 'goods', name: 'Лавка разного' }),
    bld('stall-herbs', 'stall', 858, 1342, 3, 2, 2.3, { door: 's', shop: 'herbs', name: 'Травник' }),
    bld('stall-hides', 'stall', 876, 1314, 3, 2, 2.3, { door: 'w', shop: 'hides', name: 'Скупщик шкур' }),
    bld('mill', 'mill', 1064, 1360, 10, 10, 6, { wall: 'plank', roof: 'shingle', door: 'w', name: 'Мельница', wheel: 'e' }),
    bld('izba-vyaz', 'house', 305, 690, 8, 6, 3, { rot: 8, wall: 'log', roof: 'thatch', door: 'e', open: true, width: 1.0, layout: 'izbaLong', name: 'Сруб старейшины Вяза', korni: true }),
    bld('izba-olha', 'house', 310, 725, 8, 6, 3, { rot: -6, wall: 'log', roof: 'thatch', door: 'e', open: true, width: 1.0, layout: 'izbaLong', name: 'Сруб Ольхи', korni: true }),
    bld('izba-3', 'house', 315, 672, 8, 6, 3, { rot: 14, wall: 'log', roof: 'thatch', door: 's', open: true, width: 1.0, layout: 'izbaWide', name: 'Сруб у дуба', korni: true }),
    bld('izba-hero', 'house', 365, 735, 8, 6, 3, { rot: 4, wall: 'log', roof: 'thatch', door: 'w', open: true, width: 1.0, layout: 'izbaHero', name: 'Ваш сруб', korni: true }),
    bld('izba-moh', 'house', 290, 705, 8, 6, 3, { rot: -10, wall: 'log', roof: 'thatch', door: 'e', open: true, width: 1.0, layout: 'izbaLong', name: 'Сруб Мха', korni: true }),
    bld('izba-6', 'house', 340, 748, 8, 6, 3, { wall: 'log', roof: 'thatch', door: 'n', open: true, width: 1.0, layout: 'izbaWide', name: 'Сруб у ручья', korni: true }),
    bld('izba-7', 'house', 308, 762, 8, 6, 3, { wall: 'log', roof: 'thatch', door: 'n', open: true, width: 1.0, layout: 'izbaWide', name: 'Сруб на краю', korni: true }),
    bld('nest-1', 'house', 290, 740, 4.5, 4.5, 2.4, { lift: 10.4, wall: 'log', roof: 'thatch', door: 's', open: true, width: 1.0, layout: 'nest', name: 'Дом на помосте', korni: true }),
    bld('nest-2', 'house', 370, 670, 4.5, 4.5, 2.4, { lift: 10.4, wall: 'log', roof: 'thatch', door: 's', open: true, width: 1.0, layout: 'nest', name: 'Дом на помосте у вышки', korni: true }),
    bld('nest-3', 'house', 275, 680, 4.5, 4.5, 2.4, { lift: 11.4, wall: 'log', roof: 'thatch', door: 's', open: true, width: 1.0, layout: 'nest', name: 'Верхний дом на помосте', korni: true }),
    bld('ryabina', 'house', 378, 724, 6, 5, 2.8, { wall: 'log', roof: 'thatch', door: 'n', open: true, width: 1.0, layout: 'herbsHut', name: 'Избушка травницы Рябины', korni: true }),
    bld('yasen', 'workshop', 300, 745, 8, 6, 3.2, { wall: 'log', roof: 'shingle', door: 'e', open: true, width: 1.2, layout: 'carver', name: 'Мастерская резчика Ясеня', korni: true }),
    bld('barracks', 'house', 1210, 735, 40, 12, 4.2, { wall: 'stone', roof: 'slate', door: 'n', open: true, width: 1.4, layout: 'barracks', name: 'Казарма', palace: true }),
    bld('infirmary', 'house', 1270, 735, 20, 12, 4, { wall: 'plaster', roof: 'slate', door: 'n', open: true, width: 1.4, layout: 'infirmary', name: 'Лазарет лекаря Саввы', palace: true }),
    bld('guardhouse', 'house', 1175, 600, 12, 10, 3.6, { wall: 'stone', roof: 'slate', door: 's', open: true, width: 1.2, layout: 'guardhouse', name: 'Гауптвахта', palace: true }),
    bld('armory', 'house', 1345, 725, 16, 10, 4, { wall: 'stone', roof: 'slate', door: 'n', open: true, width: 1.4, layout: 'armory', name: 'Оружейная', palace: true }),
    bld('treasury', 'house', 1345, 595, 14, 12, 4, { wall: 'stone', roof: 'slate', door: 'w', name: 'Казна', palace: true }),
    bld('throne', 'house', 1310, 640, 40, 24, 8, { wall: 'plaster', roof: 'slate', door: 'w', open: true, width: 1.4, layout: 'throne', name: 'Тронный зал', palace: true }),
    bld('stables', 'barn', 1215, 585, 30, 10, 4.5, { wall: 'plank', roof: 'shingle', door: 's', open: true, width: 3, layout: 'stables', name: 'Конюшня', palace: true }),
    bld('kennel', 'house', 1252, 585, 8, 6, 2.8, { wall: 'plank', roof: 'shingle', door: 's', open: true, width: 1.2, layout: 'kennel', name: 'Псарня', palace: true }),
    bld('gate-booth', 'stall', 1160, 712, 4, 3, 2.6, { door: 'w', shop: 'gate', name: 'Будка у ворот', palace: true }),
    ...[[1330, 990, 10], [1340, 1015, -6], [1325, 1040, 4], [1300, 1048, 0], [1275, 1035, 8], [1268, 1012, -12], [1350, 965, 0], [1320, 965, 0], [1290, 975, 6], [1360, 1040, -4], [1290, 1070, 0], [1250, 1060, 14]].map(([x, z, rot], i) => bld('tsarevo-' + i, 'house', x, z, 10, 8, 3.2, { rot, wall: i === 6 ? 'log' : 'plaster', roof: 'thatch', door: 'n', name: 'Дом в Царёве' })),
    bld('fort-hall', 'house', 962, 88, 28, 12, 5, { wall: 'basalt', roof: 'slate', door: 's', open: true, width: 1.6, layout: 'fortHall', name: 'Зал форта', fort: true }),
    bld('forge', 'house', 945, 123, 12, 10, 4, { wall: 'basalt', roof: 'slate', door: 'n', open: true, width: 2, layout: 'forge', name: 'Кузня Молота', fort: true }),
    bld('fort-barracks', 'house', 978, 123, 20, 10, 3.6, { wall: 'basalt', roof: 'slate', door: 'n', open: true, width: 1.4, layout: 'fortBarracks', name: 'Казарма форта', fort: true }),
    bld('surgeon', 'house', 940, 87, 8, 6, 3.2, { wall: 'basalt', roof: 'slate', door: 's', open: true, width: 1.2, layout: 'surgeon', name: 'Каморка костоправа Фрола', fort: true }),
    bld('fort-store', 'barn', 933, 122, 9, 10, 4, { wall: 'plank', roof: 'shingle', door: 'e', open: true, width: 3, layout: 'fortStore', name: 'Склад форта', fort: true }),
    bld('mine-hut', 'house', 1062, 222, 8, 6, 3, { wall: 'log', roof: 'shingle', door: 'e', open: true, width: 1.2, layout: 'camp', name: 'Изба рудокопов', wild: true }),
    bld('pass-hut', 'house', 664, 210, 6, 5, 2.6, { wall: 'stone', roof: 'slate', door: 'w', open: true, width: 1.2, layout: 'camp', name: 'Приют на перевале', wild: true }),
    bld('outpost-hut', 'house', 1247.5, 393, 6, 8, 3, { wall: 'log', roof: 'shingle', door: 'w', open: true, width: 1.2, layout: 'camp', name: 'Изба заставы' }),
    bld('lesoseka-camp', 'house', 690, 915, 12, 6, 2.6, { wall: 'plank', roof: 'shingle', door: 'w', open: true, width: 1.4, layout: 'camp', name: 'Барак лесорубов империи' }),
    bld('cutters-camp', 'house', 550, 295, 8, 5, 2.4, { wall: 'log', roof: 'hide', door: 's', open: true, width: 1.4, layout: 'cuttersTent', name: 'Барак рубщиков Злого' }),
    ...[['rakitny', 512, 1387, 535, 1393], ['klyuchi', 618, 1418, 643, 1420], ['mezha', 1168, 1403, 1148, 1411], ['vyselki', 1338, 1291, 1316, 1296]].flatMap(([id, hx, hz, bx, bz]) => [
      bld('farm-' + id, 'house', hx, hz, 9, 7, 2.8, { wall: 'log', roof: 'thatch', door: 'n' }),
      bld('barn-' + id, 'barn', bx, bz, 12, 8, 3.6, { wall: 'plank', roof: 'thatch', door: 'n', width: 3 })
    ])
  ]);

  const LAYOUTS = Object.freeze({
    inn: { items: [['counter', 9, -6, 4, 0.8, 1.1], ['table', 4, 3, 1.6, 0.9, 0.78], ['table', 7, 6, 1.6, 0.9, 0.78], ['table', 4, 8, 1.6, 0.9, 0.78], ['bench', 4, 1.9, 1.6, 0.35, 0.45], ['bench', 7, 4.9, 1.6, 0.35, 0.45], ['bench', 4, 6.9, 1.6, 0.35, 0.45], ['hearth', 11.4, 0, 2.2, 0.9, 1.6], ['barrel', 10.6, -9.5, 0.7, 0.7, 0.9], ['barrel', 10.6, -10.5, 0.7, 0.7, 0.9], ['bed', 14.6, -9, 2, 0.95, 0.5, 'room-1'], ['chest', 15.3, -5, 1, 0.6, 0.6], ['bed', 14.6, 9, 2, 0.95, 0.5, 'room-2'], ['chest', 15.3, 5, 1, 0.6, 0.6]],
      walls: [[12.2, -12, -7.4], [12.2, -5.8, 5.8], [12.2, 7.4, 12], [12.2, 0, 0, 3.5]], keeper: [9.9, -6], light: [11.2, 0] },
    doctor: { items: [['table', 3, 2.5, 1.4, 0.8, 0.8], ['cot', 7, -3.5, 2, 0.9, 0.55, 'doctor-1'], ['cot', 7, 3.5, 2, 0.9, 0.55, 'doctor-2'], ['shelf', 9.55, 0, 3, 0.4, 1.8]], keeper: [3, -1] },
    workshop: { items: [['bench', 6.5, -3.5, 2.6, 0.9, 0.9], ['stand', 4.5, 3.5, 1.2, 1.2, 0.22], ['rack', 9.55, -1, 4, 0.35, 2], ['anvil', 7.5, 2, 0.6, 0.4, 0.7]], keeper: [7.5, -3.5], fit: [4.5, 3.5] },
    watch: { items: [['table', 3, 1, 1.6, 0.9, 0.78], ['bench', 3, -0.2, 1.6, 0.35, 0.45], ['rack', 7.6, 0, 2.4, 0.35, 1.8]], keeper: [3, 2.5] },
    home: { items: [['bed', 6.4, -3.3, 2, 0.95, 0.5, 'home'], ['chest', 7.2, 2.2, 1, 0.6, 0.6, 'home'], ['table', 3, 2.4, 1.4, 0.8, 0.78], ['stove', 6.9, 3.8, 1.1, 1.1, 1.7]] },
    izbaLong: { items: [['bed', 6.4, -1.9, 1.9, 0.9, 0.45], ['bed', 6.4, 1.9, 1.9, 0.9, 0.45], ['stove', 1.2, -2.2, 1, 1, 1.4], ['table', 3.6, 1.6, 1.2, 0.7, 0.75], ['chest', 7.3, 0, 0.9, 0.5, 0.5]], light: [1.8, -2.2] },
    izbaWide: { items: [['bed', 4.7, -3, 1.9, 0.9, 0.45], ['bed', 4.7, 3, 1.9, 0.9, 0.45], ['stove', 1.2, -3.1, 1, 1, 1.4], ['table', 3.2, 0.6, 1.2, 0.7, 0.75], ['chest', 5.3, 0, 0.9, 0.5, 0.5]], light: [1.8, -3.1] },
    izbaHero: { items: [['bed', 6.4, -1.9, 1.9, 0.9, 0.45, 'korni-hero'], ['chest', 7.3, 0.4, 0.9, 0.5, 0.5, 'korni-hero'], ['stove', 1.2, -2.2, 1, 1, 1.4], ['table', 3.6, 1.6, 1.2, 0.7, 0.75]], light: [1.8, -2.2] },
    nest: { items: [['bed', 3, -1.1, 1.8, 0.8, 0.4], ['bed', 3, 1.1, 1.8, 0.8, 0.4]] },
    herbsHut: { items: [['shelf', 4.55, 0, 2.4, 0.4, 1.6], ['table', 2.2, 1.6, 1.2, 0.7, 0.75], ['cot', 3.2, -1.6, 1.9, 0.85, 0.5]], keeper: [2.4, -0.2], light: [3.6, 1.6] },
    carver: { items: [['bench', 5.5, -1.8, 2.4, 0.8, 0.9], ['stand', 3, 1.4, 1.2, 1.2, 0.22], ['rack', 7.55, 0, 3.4, 0.35, 2], ['rack', 4, 2.75, 2.6, 0.3, 1.8]], keeper: [5.5, -0.6], fit: [3, 1.4], light: [6.6, 1.8] },
    camp: { items: [['cot', 4, -4.2, 1.9, 0.8, 0.45], ['cot', 4, -1.4, 1.9, 0.8, 0.45], ['cot', 4, 1.4, 1.9, 0.8, 0.45], ['cot', 4, 4.2, 1.9, 0.8, 0.45], ['table', 9, 0, 1.6, 0.9, 0.78], ['barrel', 10.8, 4.4, 0.7, 0.7, 0.9]] },
    barracks: { items: [...Array.from({ length: 12 }, (v, i) => ['bed', 10.4, -18 + i * 3.25, 1.9, 0.9, 0.45, i === 4 ? 'palace-hero' : null]), ...Array.from({ length: 6 }, (v, i) => ['chest', 9.1, -18 + i * 6.5, 0.9, 0.5, 0.5, i === 2 ? 'palace-hero' : null]), ['table', 4, -6, 3, 1, 0.78], ['table', 4, 6, 3, 1, 0.78], ['bench', 4, -7.2, 3, 0.35, 0.45], ['bench', 4, 7.2, 3, 0.35, 0.45], ['rack', 1, 16, 3, 0.35, 2]], light: [4, 0] },
    infirmary: { items: [...Array.from({ length: 6 }, (v, i) => ['cot', 9.5, -7.5 + i * 3, 1.9, 0.9, 0.5]), ['table', 3, 4, 1.6, 0.8, 0.8], ['shelf', 11.55, 8.5, 3, 0.4, 1.8]], keeper: [3, 2], light: [3, 6] },
    guardhouse: { items: [['cot', 8.4, -3.5, 1.9, 0.85, 0.5, 'cell'], ['table', 2.5, 2.5, 1.2, 0.7, 0.78], ['bench', 2.5, 1.4, 1.2, 0.35, 0.45]], walls: [[6.2, -5.8, -1.6], [6.2, -0.4, 5.8]], keeper: [2.5, 3.6] },
    armory: { items: [['rack', 9.55, -4, 5, 0.35, 2], ['rack', 9.55, 4, 5, 0.35, 2], ['rack', 5, 7.75, 5, 0.3, 2], ['table', 3, -3, 2, 0.9, 0.85], ['chest', 6, -6.5, 1, 0.6, 0.6, 'trophies']], keeper: [3, -1.4] },
    throne: { items: [['stand', 37, 0, 3, 3, 0.6], ['chest', 37.5, 0, 1.2, 1.2, 1.6], ...Array.from({ length: 6 }, (v, i) => ['bench', 10 + i * 4, -8, 2.6, 0.4, 0.45]), ...Array.from({ length: 6 }, (v, i) => ['bench', 10 + i * 4, 8, 2.6, 0.4, 0.45]), ['hearth', 20, -11.4, 2.4, 0.9, 1.8], ['hearth', 20, 11.4, 2.4, 0.9, 1.8]], keeper: [36, 0], light: [20, 0] },
    stables: { items: [...Array.from({ length: 6 }, (v, i) => ['rack', 7, -12.5 + i * 5, 0.2, 4, 1.4])] },
    kennel: { items: [['barrel', 4.5, -2.4, 0.7, 0.7, 0.9]] },
    fortHall: { items: [['table', 6, 0, 4.4, 2.4, 0.95, 'wartable'], ['stand', 10.2, 0, 1.6, 1.2, 0.5], ['chest', 10.6, 9, 1.2, 0.7, 0.7, 'villain-treasury'], ['bed', 10.4, -11.8, 1.9, 0.9, 0.45, 'villain-hero'], ['chest', 10.8, -9.6, 1, 0.6, 0.6, 'villain-hero'], ['bench', 4, -6.5, 3, 0.4, 0.45], ['bench', 4, 6.5, 3, 0.4, 0.45], ['bench', 8, -6.5, 3, 0.4, 0.45], ['bench', 8, 6.5, 3, 0.4, 0.45], ['hearth', 11.4, 5, 2.4, 0.9, 1.8], ['rack', 1, -12.5, 3, 0.35, 2]], keeper: [5, -3.6], light: [6, 0] },
    forge: { items: [['anvil', 5, -2, 1, 0.5, 0.8], ['stove', 8.4, -3, 2.2, 1.6, 1.4], ['rack', 9.5, 3.5, 3, 0.35, 2], ['barrel', 4, 4.6, 0.7, 0.7, 0.9], ['table', 6.4, 3.4, 1.6, 0.8, 0.85]], keeper: [5, -0.6], light: [7, -2] },
    fortBarracks: { items: [...Array.from({ length: 8 }, (v, i) => ['bed', 8.6, -8.4 + i * 2.4, 1.9, 0.9, 0.45]), ...[-8.2, -5.2, -2.2, 2.2, 5.2, 8.2].map(v => ['cot', 3.4, v, 1.9, 0.85, 0.5])], light: [5, 0] },
    surgeon: { items: [['cot', 3.8, -2.2, 1.9, 0.9, 0.5], ['cot', 3.8, 1.8, 1.9, 0.9, 0.5], ['table', 1.6, 2.8, 1.2, 0.7, 0.8], ['shelf', 5.5, 0, 3, 0.4, 1.8]], keeper: [2, -1.2], light: [3, 0] },
    fortStore: { items: [['barrel', 6, -3.6, 0.8, 0.8, 1], ['barrel', 7, -3.6, 0.8, 0.8, 1], ['barrel', 6.5, -2.6, 0.8, 0.8, 1], ['rack', 8, 2.4, 3, 0.4, 1.8]] },
    cuttersTent: { items: [['cot', 2.6, -2.6, 1.9, 0.8, 0.45], ['cot', 2.6, 2.6, 1.9, 0.8, 0.45], ['table', 3.8, 0, 1.4, 0.8, 0.78], ['chest', 4.4, -0.9, 0.9, 0.5, 0.5, 'cutters-plans']] }
  });

  const PALACE_PTS = Object.freeze({
    line: Object.freeze(Array.from({ length: 10 }, (v, i) => [1212 + i * 1.7, 697])), hero: 4, commander: Object.freeze([1219.5, 689]),
    gate: Object.freeze([1153, 704]), queue: Object.freeze([1138, 700]), booth: 'gate-booth',
    wall: Object.freeze([[1151.5, 676], [1151.5, 724], [1270, 561.5], [1388.5, 660]]), tower: Object.freeze([1230, 646]), treasury: Object.freeze([1336, 595]),
    sluice: Object.freeze([1151.5, 650]), postern: Object.freeze([1270, 561.5]), lever: Object.freeze([1156, 693]),
    drill: Object.freeze({ dummy: [1236, 708], sergeant: [1232, 712] }), throne: Object.freeze([1346, 640]),
    patrols: Object.freeze({ ford: [[1146, 700], [1122, 760], [1010, 805], [786, 760], [1010, 805], [1122, 760], [1146, 700]], fields: [[1146, 700], [1132, 712], [1105, 840], [1060, 950], [1180, 978], [1295, 1000], [1060, 950], [1105, 840], [1146, 700]], outpost: [[1146, 700], [1130, 580], [1205, 440], [1240, 392], [1205, 440], [1130, 580], [1146, 700]] }),
    adit: Object.freeze({ mouth: [1083, 222], exit: [955, 112] })
  });

  const FORT_PTS = Object.freeze({
    line: Object.freeze(Array.from({ length: 36 }, (v, i) => [951 + (i % 9) * 2.4, 101 + Math.floor(i / 9) * 2.3])), hero: Object.freeze([962, 97.4]),
    table: Object.freeze([962, 88]), gate: Object.freeze([921, 105]), yard: Object.freeze([960, 106]),
    dummies: Object.freeze([[978, 110], [981.5, 110], [985, 110]]), rope: Object.freeze([968, 78.6]), cliff: Object.freeze([968, 70]),
    forge: Object.freeze([945, 123]), pit: Object.freeze([960, 123]), store: Object.freeze([933, 122]), banner: Object.freeze([1230, 646]),
    posts: Object.freeze([[929.5, 101], [929.5, 109], [960, 80], [990, 105], [960, 130]]),
    tract: Object.freeze([1060, 950]), goat: Object.freeze([999, 105]),
    sortie: Object.freeze([[999, 105], [1040, 105], [1110, 118], [1050, 140], [1130, 165], [1060, 190], [1150, 206], [1080, 232], [1170, 236], [1290, 262], [1180, 290], [1150, 360], [1135, 440], [1130, 500], [1060, 580], [1010, 700], [1015, 830], [1060, 950]])
  });

  const KORNI = Object.freeze({
    at: [340, 712], r: 80, hero: 'izba-hero',
    wells: Object.freeze([[340, 722], [298, 722]]),
    council: Object.freeze([328, 688]),
    training: Object.freeze({ line: [384, 718], targets: [[402, 711], [404, 718], [402, 725]], dummy: [394, 704] }),
    store: Object.freeze({ at: [345, 691.2], face: Math.PI }),
    oak: Object.freeze([330, 700]),
    shelter: Object.freeze([339, 694]),
    graves: Object.freeze([[312, 700, 0.4], [314, 704, 0.2], [311, 708, -0.1]]),
    benches: Object.freeze([[323.5, 686.5, 0.9], [332.5, 685.5, -0.7], [328, 692.6, 0]]),
    windfall: Object.freeze({ at: [452, 697.5], rot: 1.75, len: 5 }),
    fern: Object.freeze([492, 703]),
    clearing: Object.freeze({ x: 395, z: 717, w: 30, d: 30 }),
    walkways: Object.freeze([[[370, 670, 10.4], [395, 655, 8.4]], [[290, 740, 10.4], [270, 760, 8.4]]])
  });
  const HERB_SPOTS = Object.freeze([[372, 640], [398, 600], [436, 520], [470, 470], [300, 790], [262, 860], [226, 948], [470, 700], [560, 712], [612, 730], [214, 1000], [404, 760]]);
  const CACHES = Object.freeze([
    { id: 'waterfall', name: 'Схрон старого резчика', at: [446, 512], items: [['willowLeg', 1], ['resinEye', 1]], mark: 'ochre', hint: 'Охряная зарубка на камне у воды' },
    { id: 'pine', name: 'Кошелёк пропавшего гонца', at: [214, 1004], items: [['silver', 60]], mark: 'bell', hint: 'На ветке сухой сосны висит бубенец' }
  ]);
  const CUTTERS = Object.freeze({ stack: [575, 296], chest: 'cutters-plans' });
  const PLAN_DROP = Object.freeze({ at: [1156, 712], name: 'будка у ворот дворца' });

  const GRAVES = Object.freeze(Array.from({ length: 18 }, (v, i) => [884 + (i % 6) * 6, 1446 + Math.floor(i / 6) * 8, (i * 37 % 7 - 3) * 0.03]));
  const THICK = 0.25;
  const FURNITURE = { counter: 'plank', table: 'plank', bench: 'plank', hearth: 'stone', barrel: 'beam', bed: 'bed', cot: 'bed', chest: 'beam', shelf: 'beam', rack: 'beam', stand: 'plank', anvil: 'iron', stove: 'stone' };

  function town(T) {
    const out = { boxes: [], parts: [], lights: [], beds: [], chests: [], keepers: {}, doors: {}, fits: {}, rooms: {}, houses: {}, wells: [] };
    for (const B of BUILDINGS) raise(B, T, out);
    korni(T, out);
    for (const g of GRAVES) {
      const y = T.heightAt(g[0], g[1]);
      out.parts.push({ x: g[0], z: g[1], w: 0.08, d: 0.08, y0: y - 0.1, y1: y + 0.95, rot: g[2], mat: 'beam' });
      out.parts.push({ x: g[0], z: g[1], w: 0.55, d: 0.07, y0: y + 0.62, y1: y + 0.7, rot: g[2], mat: 'beam' });
      out.parts.push({ x: g[0] + Math.sin(g[2]) * 0.95, z: g[1] + Math.cos(g[2]) * 0.95, w: 0.8, d: 1.7, y0: y - 0.1, y1: y + 0.16, rot: g[2], mat: 'dirt' });
    }
    for (const [x, z, rot] of CARTS) cart(x, z, rot, T, out);
    dress(T, out);
    return out;
  }

  const span = (T, b) => {
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]].map(([u, v]) => T.heightAt(b.x + u * b.w / 2, b.z + v * b.d / 2));
    return [Math.min(...pts) - 0.6, Math.max(...pts) + b.h];
  };

  let SIGNS = null;
  function signs() {
    if (SIGNS) return SIGNS;
    const skip = new Set(['bridge', 'ford']), near = (a, b, r) => Math.hypot(a[0] - b[0], a[1] - b[1]) < r, clusters = [];
    for (const r of ROADS) for (const e of [r.pts[0], r.pts[r.pts.length - 1]]) {
      if (near(e, FORT.at, 46) || near(e, [1146, 700], 10)) continue;
      const meet = ROADS.filter(o => !skip.has(o.kind) && o.pts.some(p => near(p, e, 3)));
      if (meet.length < 2) continue;
      if (!clusters.some(c => near(c.at, e, 6))) clusters.push({ at: e.slice(), roads: meet });
    }
    const spotNear = (p, r) => { let best = null, bd = r || 70; for (const s of SPOTS) { const d = Math.hypot(s.at[0] - p[0], s.at[1] - p[1]); if (d < bd) { bd = d; best = s; } } return best; };
    SIGNS = clusters.map(c => {
      const here = spotNear(c.at, 30), arms = [];
      for (const r of c.roads) {
        const idx = r.pts.findIndex(p => near(p, c.at, 3));
        for (const dir of [-1, 1]) {
          const nx = r.pts[idx + dir];
          if (!nx) continue;
          const end = dir > 0 ? r.pts[r.pts.length - 1] : r.pts[0], dest = spotNear(end, 130), l = Math.hypot(nx[0] - c.at[0], nx[1] - c.at[1]) || 1;
          const joins = ROADS.find(o => o !== r && !skip.has(o.kind) && o.pts.some(p => near(p, end, 3)));
          arms.push({ dir: [(nx[0] - c.at[0]) / l, (nx[1] - c.at[1]) / l], to: dest && dest !== here ? dest.name : joins ? joins.name : r.name, road: r.name });
        }
      }
      const wide = Math.max(...c.roads.map(r => KINDS[r.kind].width / 2)), lines = ROADS.filter(r => !skip.has(r.kind)).map(r => [K.Terrain.polyline(r.pts), KINDS[r.kind].width / 2]);
      const clear = (x, z) => Math.min(...lines.map(([l, h]) => K.Terrain.nearest(l, x, z).d - h));
      let post = null, best = -Infinity;
      for (let q = 0; q < 16; q++) { const a = q / 16 * Math.PI * 2, x = c.at[0] + Math.cos(a) * (wide + 2.6), z = c.at[1] + Math.sin(a) * (wide + 2.6), d = clear(x, z); if (d > best) { best = d; post = [x, z]; } }
      return { at: c.at, post, arms };
    });
    return SIGNS;
  }

  const milestones = () => {
    const out = [];
    for (const id of ['tract', 'forest', 'south']) {
      const r = ROADS.find(x => x.id === id), line = K.Terrain.polyline(r.pts), half = KINDS[r.kind].width / 2;
      for (let s = 500; s < line.length - 40; s += 500) { const p = K.Terrain.pointAt(line, s), x = p.x + p.tz * (half + 3.4), z = p.z - p.tx * (half + 3.4); out.push({ at: [x, z], s, road: id, verst: Math.round(s / 500) }); }
    }
    return out;
  };

  function dress(T, out) {
    const put = (x, z, w, d, y0, y1, mat, rot) => out.parts.push({ x, z, w, d, y0, y1, rot: rot || 0, mat });
    const roof = (x, z, w, d, y0, y1, mat, o) => out.parts.push(Object.assign({ kind: 'roof', x, z, w, d, y0, y1, rot: 0, mat, ridge: w >= d ? 'u' : 'v', gable: 'plank' }, o || {}));
    const teeth = (b, y, mat, every) => {
      const along = b.w >= b.d, len = along ? b.w : b.d, n = Math.floor(len / every), o = b.out || null;
      for (let i = 0; i < n; i++) {
        const s = -len / 2 + (i + 0.5) * every;
        if (o) { const off = (along ? b.d : b.w) / 2 - 0.25; put(b.x + (along ? s : o[0] * off), b.z + (along ? o[1] * off : s), along ? every * 0.5 : 0.5, along ? 0.5 : every * 0.5, y, y + 1.1, mat); }
      }
    };
    const crown = (b, y, mat) => {
      for (const [sx, sz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const len = sx ? b.d : b.w, n = Math.floor(len / 2);
        for (let i = 0; i < n; i++) { const s = -len / 2 + (i + 0.5) * (len / n); put(b.x + (sx ? sx * (b.w / 2 - 0.25) : s), b.z + (sz ? sz * (b.d / 2 - 0.25) : s), sx ? 0.5 : len / n * 0.5, sx ? len / n * 0.5 : 0.5, y, y + 1.1, mat); }
      }
    };
    const watch = b => {
      const [g, top] = span(T, b), hw = b.w / 2 - 0.25, hd = b.d / 2 - 0.25;
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { put(b.x + u * hw, b.z + v * hd, 0.4, 0.4, g, top + 2.5, 'log'); }
      for (const y of [g + 0.6 + (top - g) * 0.3, g + 0.6 + (top - g) * 0.65]) { put(b.x, b.z - hd, b.w - 0.3, 0.16, y, y + 0.24, 'beam'); put(b.x, b.z + hd, b.w - 0.3, 0.16, y, y + 0.24, 'beam'); put(b.x - hw, b.z, 0.16, b.d - 0.3, y, y + 0.24, 'beam'); put(b.x + hw, b.z, 0.16, b.d - 0.3, y, y + 0.24, 'beam'); }
      put(b.x, b.z, b.w - 0.6, b.d - 0.6, g, top - 0.3, 'plank');
      put(b.x, b.z, b.w + 0.3, b.d + 0.3, top - 0.3, top, 'plank');
      for (const [sx, sz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) put(b.x + sx * (b.w / 2 + 0.1), b.z + sz * (b.d / 2 + 0.1), sx ? 0.1 : b.w + 0.3, sx ? b.d + 0.3 : 0.1, top + 0.85, top + 1.0, 'beam');
      roof(b.x, b.z, b.w + 1.2, b.d + 1.2, top + 2.5, top + 3.8, 'shingle', { hip: true });
    };
    const stakes = b => {
      const [g, top] = span(T, b), along = b.w >= b.d, len = along ? b.w : b.d, n = Math.round(len / 0.32);
      for (let i = 0; i < n; i++) {
        const s = -len / 2 + (i + 0.5) * len / n, x = b.x + (along ? s : 0), z = b.z + (along ? 0 : s), h = top - 0.3 + ((i * 37) % 5) * 0.12, y = T.heightAt(x, z);
        put(x, z, along ? len / n * 0.92 : 0.3, along ? 0.3 : len / n * 0.92, y - 0.4, h, 'log');
        put(x, z, along ? len / n * 0.5 : 0.18, along ? 0.18 : len / n * 0.5, h, h + 0.3, 'beam', Math.PI / 4);
      }
      for (const y of [g + 1.6, top - 0.9]) put(b.x + (b.out ? -b.out[0] * 0.25 : 0), b.z + (b.out ? -b.out[1] * 0.25 : 0), along ? len : 0.12, along ? 0.12 : len, y, y + 0.18, 'beam');
    };
    for (const b of WALLS.filter(w => w.dressed).flatMap(wallBoxes)) {
      const [g, top] = span(T, b);
      if (b.dressed === 'stakes') { stakes(b); continue; }
      const m = b.dressed;
      put(b.x, b.z, b.w, b.d, g, top, m);
      if (b.tower) { put(b.x, b.z, b.w + 0.5, b.d + 0.5, top - 0.6, top - 0.3, m); crown(b, top, m); roof(b.x, b.z, b.w - 1.6, b.d - 1.6, top + 2.4, top + 6, 'slate', { hip: true }); for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) put(b.x + u * (b.w / 2 - 1.2), b.z + v * (b.d / 2 - 1.2), 0.5, 0.5, top, top + 2.4, 'beam'); continue; }
      teeth(b, top, m, 2);
      put(b.x, b.z, b.w + (b.w > b.d ? 0 : 0.3), b.d + (b.w > b.d ? 0.3 : 0), g + 0.6, g + 1.6, m);
    }
    for (const [id, at, wide] of [['palace', 700, 6], ['fort', 105, 5]]) {
      const w = WALLS.find(x => x.id === id), gx = w.rect[0] + w.thick / 2, gy = T.heightAt(gx, at), m = w.dressed, half = wide / 2;
      put(gx, at, w.thick + 0.6, wide + 1, gy + w.h - 3, gy + w.h + 0.6, m);
      put(gx - w.thick / 2 - 0.2, at, 0.3, wide + 0.4, gy + w.h - 3.4, gy + w.h - 2.9, 'beam');
      for (const s of [-1, 1]) put(gx, at + s * (half + 0.4), w.thick + 1, 1.2, gy - 0.5, gy + w.h + 0.4, m);
    }
    const pit = FORT_PTS.pit, py = T.heightAt(pit[0], pit[1]);
    for (const [u, v, w, d] of [[0, -1.6, 3.6, 0.4], [0, 1.6, 3.6, 0.4], [-1.6, 0, 0.4, 2.8], [1.6, 0, 0.4, 2.8]]) put(pit[0] + u, pit[1] + v, w, d, py - 0.2, py + 0.45, 'basalt');
    put(pit[0], pit[1], 2.8, 2.8, py - 0.05, py + 0.02, 'char');
    for (let i = -1; i <= 1; i++) { put(pit[0] + i * 0.8, pit[1], 0.06, 3, py + 0.42, py + 0.48, 'iron'); put(pit[0], pit[1] + i * 0.8, 3, 0.06, py + 0.42, py + 0.48, 'iron'); }
    const rope = FORT_PTS.rope, ry = T.heightAt(rope[0], rope[1]);
    put(rope[0], rope[1] - 1.4, 0.3, 0.3, ry + 6.8, ry + 7.6, 'beam');
    put(rope[0], rope[1] - 2.6, 0.06, 0.06, ry - 18, ry + 7.4, 'cloth2');
    for (const S of signs()) {
      const y = T.heightAt(S.post[0], S.post[1]);
      put(S.post[0], S.post[1], 0.16, 0.16, y - 0.3, y + 2.4, 'beam');
      S.arms.forEach((a, k) => { const h = y + 2.05 - k * 0.3, r = Math.atan2(a.dir[1], a.dir[0]); put(S.post[0] + a.dir[0] * 0.42, S.post[1] + a.dir[1] * 0.42, 0.95, 0.05, h - 0.11, h + 0.11, 'plank', r); });
      put(S.post[0], S.post[1], 0.26, 0.26, y + 2.4, y + 2.5, 'beam');
    }
    for (const M of milestones()) {
      const y = T.heightAt(M.at[0], M.at[1]);
      for (let k = 0; k < 7; k++) put(M.at[0], M.at[1], 0.2, 0.2, y - 0.2 + k * 0.24, y + 0.04 + k * 0.24, k % 2 ? 'char' : 'plaster');
      put(M.at[0], M.at[1], 0.3, 0.3, y + 1.48, y + 1.58, 'slate');
    }
    const ford = ROADS.find(r => r.id === 'ford').pts, fl = K.Terrain.polyline(ford);
    for (let s = 1.5; s < fl.length; s += 2.2) { const p = K.Terrain.pointAt(fl, s), y = T.heightAt(p.x, p.z); for (const o of [-0.9, 0.8]) put(p.x - p.tz * o + (s % 1.3 - 0.6) * 0.3, p.z + p.tx * o, 0.6, 0.45, y - 0.2, y + 0.08, 'stone', s); }
    const goat = ROADS.find(r => r.id === 'goat').pts;
    goat.forEach((q, i) => { if (i % 3 !== 1 || i === goat.length - 1) return; const n = goat[i + 1], dx = n[0] - q[0], dz = n[1] - q[1], l = Math.hypot(dx, dz) || 1, x = q[0] - dz / l * 1.8, z = q[1] + dx / l * 1.8, y = T.heightAt(x, z); put(x, z, 0.7, 0.6, y - 0.2, y + 0.35, 'stone'); put(x + 0.05, z, 0.45, 0.4, y + 0.35, y + 0.65, 'stone'); put(x, z, 0.3, 0.28, y + 0.65, y + 0.85, 'stone'); });
    for (const b of BOXES.filter(x => x.dressed)) {
      const [g, top] = span(T, b);
      if (b.dressed === 'watch') watch(b);
      else if (b.dressed === 'keep') {
        put(b.x, b.z, b.w + 0.6, b.d + 0.6, g, g + 3, 'basalt');
        put(b.x, b.z, b.w, b.d, g + 3, top, 'basalt');
        for (const y of [g + 7, g + 12]) for (const [sx, sz] of [[0, 1], [-1, 0]]) put(b.x + sx * (b.w / 2 + 0.02), b.z + sz * (b.d / 2 + 0.02), sx ? 0.06 : 0.5, sx ? 0.5 : 0.06, y, y + 1.4, 'window');
        put(b.x, b.z, b.w + 0.6, b.d + 0.6, top - 0.5, top, 'basalt');
        crown(Object.assign({}, b, { w: b.w + 0.6, d: b.d + 0.6 }), top, 'basalt');
        put(b.x, b.z, 0.14, 0.14, top, top + 5, 'beam');
        put(b.x + 1.1, b.z, 2, 0.04, top + 3.4, top + 4.8, 'cloth');
      } else if (b.dressed === 'mine') {
        put(b.x, b.z, b.w, b.d, g, top, 'basalt');
        const fz = b.z + b.d / 2 + 0.2, fy = T.heightAt(b.x, fz);
        put(b.x, fz, 2.8, 0.1, fy - 0.2, fy + 2.6, 'char');
        for (const s of [-1, 1]) put(b.x + s * 1.6, fz + 0.1, 0.35, 0.35, fy - 0.3, fy + 2.9, 'log');
        put(b.x, fz + 0.1, 3.9, 0.4, fy + 2.7, fy + 3.1, 'log');
        for (const s of [-0.5, 0.5]) put(b.x + s, fz + 4, 0.08, 8, fy - 0.1, fy + 0.04, 'iron');
        for (let i = 0; i < 8; i++) put(b.x, fz + 0.6 + i, 1.5, 0.14, fy - 0.12, fy, 'beam');
      } else if (b.dressed === 'heap') {
        put(b.x, b.z, b.w, b.d, g, g + 1.6, 'dirt');
        put(b.x - 1, b.z, b.w * 0.7, b.d * 0.6, g + 1.6, top, 'dirt');
        for (let i = 0; i < 6; i++) put(b.x - b.w / 2 + 1 + i * 2, b.z - b.d / 2 + 0.6 + (i % 2) * 1.1, 0.7, 0.6, top - 0.6 - (i % 3) * 0.4, top - (i % 3) * 0.4, 'basalt');
      } else if (b.dressed === 'cairn') {
        for (let i = 0; i < 5; i++) put(b.x, b.z, 1.4 - i * 0.22, 1.3 - i * 0.2, g + 0.4 + i * 0.5, g + 0.95 + i * 0.5, 'stone', i * 0.4);
        put(b.x, b.z, 0.1, 0.1, g + 3, g + 5.2, 'beam');
        put(b.x + 0.6, b.z, 1.1, 0.03, g + 4.4, g + 5.1, 'cloth');
      }
      else if (b.dressed === 'white') {
        put(b.x, b.z, b.w + 0.8, b.d + 0.8, g, g + 3.6, 'stone');
        put(b.x, b.z, b.w, b.d, g + 3.6, top, 'plaster');
        for (const y of [g + 9, g + 17, g + 25, g + 33]) for (const [sx, sz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) put(b.x + sx * (b.w / 2 + 0.02), b.z + sz * (b.d / 2 + 0.02), sx ? 0.06 : 1.1, sx ? 1.1 : 0.06, y, y + 1.6, 'window');
        put(b.x, b.z, b.w + 0.6, b.d + 0.6, top - 0.5, top, 'stone');
        crown(Object.assign({}, b, { w: b.w + 0.6, d: b.d + 0.6 }), top, 'stone');
      } else if (b.dressed === 'granary') {
        put(b.x, b.z, b.w, b.d, g, g + 5.2, 'plank');
        for (const u of [-1, 1]) put(b.x + u * (b.w / 2 - 0.2), b.z, 0.3, b.d + 0.1, g, g + 5.2, 'beam');
        put(b.x, b.z - b.d / 2 - 0.03, 2.4, 0.06, g + 0.6, g + 3.4, 'door');
        roof(b.x, b.z, b.w + 0.8, b.d + 0.8, g + 5.2, top, 'thatch');
      } else if (b.dressed === 'mill') {
        put(b.x, b.z, b.w, b.d, g, top - 3.5, 'plank');
        put(b.x, b.z, b.w + 0.4, b.d + 0.4, g, g + 1.2, 'stone');
        put(b.x, b.z - b.d / 2 - 0.03, 1.2, 0.06, g + 0.6, g + 2.6, 'door');
        roof(b.x, b.z, b.w + 0.6, b.d + 0.6, top - 3.5, top, 'shingle', { hip: true });
        const hub = top - 4.6;
        put(b.x, b.z - b.d / 2 - 0.5, 0.6, 0.6, hub - 0.3, hub + 0.3, 'beam');
        put(b.x, b.z - b.d / 2 - 0.7, 0.5, 0.14, hub - 5, hub + 5, 'plank');
        put(b.x, b.z - b.d / 2 - 0.7, 10, 0.14, hub - 0.25, hub + 0.25, 'plank');
        for (const s of [-1, 1]) { put(b.x + 0.55, b.z - b.d / 2 - 0.72, 0.7, 0.04, s > 0 ? hub + 0.6 : hub - 4.6, s > 0 ? hub + 4.6 : hub - 0.6, 'cloth'); put(s > 0 ? b.x + 0.6 : b.x - 4.6, b.z - b.d / 2 - 0.72, 4, 0.04, hub - 0.95, hub - 0.3, 'cloth'); }
      }
    }
  }

  function korni(T, out) {
    const K0 = KORNI, add = (p, solid) => { out.parts.push(p); if (solid) out.boxes.push({ x: p.x, z: p.z, w: p.w, d: p.d, rot: (p.rot || 0) * 180 / Math.PI, y0: p.y0, y1: p.y1, kind: p.mat, hidden: true }); return p; };
    for (const [x, z] of K0.wells) {
      const y = T.heightAt(x, z);
      for (const [u, v, w, d] of [[0, -0.62, 1.4, 0.26], [0, 0.62, 1.4, 0.26], [-0.62, 0, 0.26, 1.0], [0.62, 0, 0.26, 1.0]]) add({ x: x + u, z: z + v, w, d, y0: y - 0.3, y1: y + 0.8, rot: 0, mat: 'stone' }, true);
      add({ x, z, w: 1.0, d: 1.0, y0: y - 0.3, y1: y + 0.35, rot: 0, mat: 'iron' }, false);
      for (const u of [-0.75, 0.75]) add({ x: x + u, z, w: 0.12, d: 0.12, y0: y + 0.8, y1: y + 2.1, rot: 0, mat: 'beam' }, false);
      add({ x, z, w: 1.7, d: 0.14, y0: y + 2.02, y1: y + 2.14, rot: 0, mat: 'beam' }, false);
      add({ x, z: z + 0.2, w: 0.32, d: 0.32, y0: y + 0.8, y1: y + 1.15, rot: 0, mat: 'plank' }, false);
      out.wells.push({ at: [x, z], y: y + 0.8 });
    }
    for (const [x, z, rot] of K0.benches) { const y = T.heightAt(x, z); add({ x, z, w: 2.6, d: 0.42, y0: y - 0.1, y1: y + 0.42, rot, mat: 'log' }, true); }
    { const Wf = K0.windfall, [x, z] = Wf.at, y = T.heightAt(x, z); add({ x, z, w: Wf.len, d: 0.6, y0: y - 0.1, y1: y + 0.7, rot: Wf.rot, mat: 'log' }, true); add({ x: x + Math.cos(Wf.rot) * 2.8, z: z + Math.sin(Wf.rot) * 2.8, w: 1.2, d: 1.4, y0: y - 0.1, y1: y + 1.1, rot: Wf.rot + 0.4, mat: 'dirt' }, false); }
    const [cx, cz] = K0.council, cy = T.heightAt(cx, cz);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; add({ x: cx + Math.cos(a) * 0.7, z: cz + Math.sin(a) * 0.7, w: 0.3, d: 0.3, y0: cy - 0.1, y1: cy + 0.18, rot: a, mat: 'stone' }, false); }
    out.lights.push({ at: [cx, cy + 0.5, cz], color: [1, 0.6, 0.25], size: 1.6 });
    for (const [x, z, rot] of K0.graves) {
      const y = T.heightAt(x, z);
      add({ x, z, w: 1.0, d: 1.9, y0: y - 0.2, y1: y + 0.3, rot, mat: 'dirt' }, false);
      add({ x: x - Math.sin(rot) * 0.9, z: z - Math.cos(rot) * 0.9, w: 0.22, d: 0.22, y0: y, y1: y + 0.9, rot, mat: 'beam' }, false);
    }
    for (const [a, b] of K0.walkways) {
      const ya = T.heightAt(a[0], a[1]) + a[2], yb = T.heightAt(b[0], b[1]) + b[2], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(Math.abs(yb - ya) / 0.22)), rot = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (let i = 0; i < n; i++) {
        const t0 = 3.4 / len + (i / n) * (1 - 6.8 / len), t1 = 3.4 / len + ((i + 1) / n) * (1 - 6.8 / len), tm = (t0 + t1) / 2, y = ya + (yb - ya) * tm;
        add({ x: a[0] + (b[0] - a[0]) * tm, z: a[1] + (b[1] - a[1]) * tm, w: (t1 - t0) * len + 0.05, d: 1.3, y0: y - 0.12, y1: y, rot, mat: 'plank' }, true);
      }
    }
    const [sx, sz] = CUTTERS.stack, sy = T.heightAt(sx, sz);
    add({ x: sx, z: sz, w: 0.3, d: 6, y0: sy - 0.2, y1: sy + 0.05, rot: 0, mat: 'dirt' }, false);
  }

  function cart(x, z, rot, T, out) {
    const c = Math.cos(rot), s = Math.sin(rot), at = (u, v) => [x + u * c - v * s, z + u * s + v * c], y = T.heightAt(x, z), deg = rot * 180 / Math.PI;
    const part = (u, v, w, d, y0, y1, mat) => { const p = at(u, v); return { x: p[0], z: p[1], w, d, y0, y1, rot, mat }; };
    const bed = part(0, 0, 1.5, 2.8, y + 0.62, y + 0.74, 'plank');
    out.parts.push(bed);
    out.boxes.push({ x: bed.x, z: bed.z, w: 1.5, d: 2.8, rot: deg, y0: y, y1: y + 1.1, kind: 'plank', hidden: true });
    for (const u of [-0.72, 0.72]) out.parts.push(part(u, 0, 0.06, 2.8, y + 0.74, y + 1.1, 'plank'));
    for (const v of [-1.37, 1.37]) out.parts.push(part(0, v, 1.5, 0.06, y + 0.74, y + 1.05, 'plank'));
    for (const u of [-0.35, 0.35]) out.parts.push(part(u, -2.4, 0.08, 2.2, y + 0.5, y + 0.6, 'beam'));
    for (const u of [-0.86, 0.86]) for (const v of [-0.8, 0.8]) { const p = at(u, v); out.parts.push({ kind: 'wheel', x: p[0], z: p[1], y: y + 0.55, r: 0.55, width: 0.08, rot, mat: 'beam', spokes: 6, paddles: false }); }
  }

  function frame(B, T) {
    const r = B.rot * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), hw = B.w / 2, hd = B.d / 2;
    const at = (u, v) => [B.x + u * c - v * s, B.z + u * s + v * c];
    const ground = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [0, 0]].map(([u, v]) => T.heightAt(...at(u, v)));
    const F = B.lift ? T.heightAt(B.x, B.z) + B.lift : Math.max(...ground) + (B.kind === 'stall' ? 0 : 0.15);
    const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] }[B.door], side = [-inward[1], inward[0]];
    const alongU = B.door === 'n' || B.door === 's';
    const wall = { n: [0, -hd], s: [0, hd], w: [-hw, 0], e: [hw, 0] }[B.door];
    const local = (f, sd) => [wall[0] + inward[0] * f + side[0] * sd, wall[1] + inward[1] * f + side[1] * sd];
    const D = (f, sd) => at(...local(f, sd));
    const world = [inward[0] * c - inward[1] * s, inward[0] * s + inward[1] * c];
    return { r, c, s, hw, hd, at, F, low: B.lift ? F - 0.3 : Math.min(...ground) - 0.6, inward, alongU, local, D, faceIn: Math.atan2(world[0], -world[1]) };
  }

  function raise(B, T, out) {
    const Fr = frame(B, T), { r, hw, hd, at, F, low, alongU, local, D } = Fr, top = F + B.h;
    const part = (u, v, w, d, y0, y1, mat, o) => { const p = at(u, v); return Object.assign({ x: p[0], z: p[1], w, d, y0, y1, rot: r, mat, building: B.id }, o || {}); };
    const add = (p, extra) => { out.parts.push(p); if (extra !== false) out.boxes.push(Object.assign({ x: p.x, z: p.z, w: p.w, d: p.d, rot: B.rot, y0: p.y0, y1: p.y1, kind: p.mat, building: B.id, hidden: true }, extra || {})); return p; };
    const dims = (along, across) => alongU ? [along, across] : [across, along];
    out.doors[B.id] = { at: D(-1.2, 0), inside: D(1.5, 0), face: Fr.faceIn, floor: F };
    if (B.kind === 'stall') {
      add(part(...local(1, 0), ...dims(B.w, 0.7), F - 0.3, F + 1.0, 'plank'));
      for (const u of [-hw + 0.1, hw - 0.1]) for (const v of [-hd + 0.1, hd - 0.1]) add(part(u, v, 0.12, 0.12, F - 0.3, F + B.h, 'beam'), false);
      add(part(0, 0, B.w + 0.4, B.d + 0.4, F + B.h, F + B.h + 0.06, B.shop === 'hides' ? 'hide' : B.shop === 'herbs' ? 'cloth2' : 'cloth'), false);
      out.keepers[B.id] = { at: D(1.75, 0), face: Fr.faceIn + Math.PI };
      out.doors[B.id] = { at: D(-0.9, 0), inside: D(1.75, 0), face: Fr.faceIn, floor: F };
      return;
    }
    if (B.kind === 'belfry') {
      add(part(0, 0, B.w, B.d, low, F + B.h, 'stone'), { landmark: B.landmark });
      for (const u of [-hw + 0.45, hw - 0.45]) for (const v of [-hd + 0.45, hd - 0.45]) add(part(u, v, 0.9, 0.9, F + B.h, F + B.top - 2.2, 'stone'));
      add(part(0, 0, B.w + 0.4, B.d + 0.4, F + B.top - 2.2, F + B.top - 1.8, 'stone'));
      out.parts.push({ kind: 'roof', x: B.x, z: B.z, w: B.w + 0.6, d: B.d + 0.6, y0: F + B.top - 1.8, y1: F + B.top + 1.6, rot: r, mat: 'slate', hip: true });
      out.parts.push({ kind: 'bell', x: B.x, z: B.z, y0: F + B.h + 0.8, y1: F + B.h + 2.5, r: 0.95, mat: 'bronze', building: B.id });
      out.bell = { at: [B.x, F + B.h + 1.6, B.z] };
      return;
    }
    const width = B.width || 1.2, hDoor = Math.min(2.1, B.h - 0.4);
    if (!B.open) {
      add(part(0, 0, B.w, B.d, low, top, B.wall));
      add(part(...local(-0.03, 0), ...dims(width, 0.08), F, F + hDoor, B.kind === 'barn' ? 'plank' : 'door'), false);
    } else {
      const edges = { n: [-hw, hw, -hd, -hd + THICK], s: [-hw, hw, hd - THICK, hd], w: [-hw, -hw + THICK, -hd, hd], e: [hw - THICK, hw, -hd, hd] };
      const slab = (u0, u1, v0, v1, y0, y1) => add(part((u0 + u1) / 2, (v0 + v1) / 2, u1 - u0, v1 - v0, y0, y1, B.wall));
      for (const k of ['n', 's', 'w', 'e']) {
        const [u0, u1, v0, v1] = edges[k];
        if (k !== B.door) slab(u0, u1, v0, v1, low, top);
        else if (alongU) { slab(u0, -width / 2, v0, v1, low, top); slab(width / 2, u1, v0, v1, low, top); slab(-width / 2, width / 2, v0, v1, F + hDoor, top); }
        else { slab(u0, u1, v0, -width / 2, low, top); slab(u0, u1, width / 2, v1, low, top); slab(u0, u1, -width / 2, width / 2, F + hDoor, top); }
      }
      add(part(0, 0, B.w, B.d, F - 0.25, F, 'floor'), { floor: true });
      add(part(...local(THICK + width * 0.47, width / 2 + 0.04), ...dims(0.07, width * 0.94), F, F + hDoor, 'door'), false);
      if (B.storeys === 2) add(part(0, 0, B.w - THICK * 2, B.d - THICK * 2, F + 3.1, F + 3.25, 'floor', { indoor: true }), false);
      const L = LAYOUTS[B.layout];
      if (L) furnish(B, L, out, Fr, part, add, dims);
      steps(B, T, Fr, part, add, dims, width);
      out.rooms[B.id] = { id: B.id, name: B.name, price: B.price || 0, at: [B.x, B.z], hw: hw - THICK, hd: hd - THICK, rot: r, floor: F, door: out.doors[B.id] };
    }
    windows(B, Fr, part, add);
    if (B.wall === 'plaster' || B.wall === 'stone') {
      for (const u of [-hw, hw]) for (const v of [-hd, hd]) add(part(u, v, 0.3, 0.3, low, top + 0.05, B.wall === 'stone' ? 'stone' : 'beam'), false);
      if (!B.open) add(part(0, 0, B.w + 0.12, B.d + 0.12, low, F + 0.35, 'stone'), false);
      if (B.wall === 'plaster') add(part(0, 0, B.w + 0.08, B.d + 0.08, top - 0.25, top, 'beam'), false);
    }
    out.parts.push({ kind: 'roof', x: B.x, z: B.z, w: B.w + 0.8, d: B.d + 0.8, y0: top, y1: top + Math.min(B.w, B.d) * (B.roof === 'thatch' ? 0.55 : 0.42), rot: r, mat: B.roof, gable: B.wall, ridge: B.w >= B.d ? 'u' : 'v', building: B.id });
    out.houses[B.id] = { id: B.id, at: [B.x, B.z], w: B.w, d: B.d, rot: r, floor: F, top: top, roof: top + Math.min(B.w, B.d) * (B.roof === 'thatch' ? 0.55 : 0.42) };
    if (B.wheel) {
      const p = at(B.wheel === 'e' ? hw + 0.55 : -hw - 0.55, 0);
      out.parts.push({ kind: 'wheel', x: p[0], z: p[1], y: F + 1.4, r: 2.3, width: 0.6, rot: r, mat: 'beam', building: B.id });
      out.wheel = { at: [p[0], F + 1.4, p[1]] };
    }
    if (B.garden) {
      const g = at(0, hd + 4), y = T.heightAt(g[0], g[1]);
      for (let k = -1; k <= 1; k++) add(part(k * 2.6, hd + 4, 1.6, 4.4, y - 0.15, y + 0.14, 'dirt'), false);
      add(part(0, hd + 7, B.w, 0.08, y - 0.3, y + 0.9, 'beam'));
      add(part(-hw, hd + 4.1, 0.08, 5.8, y - 0.3, y + 0.9, 'beam'));
      add(part(hw, hd + 4.1, 0.08, 5.8, y - 0.3, y + 0.9, 'beam'));
    }
    if (B.layout && B.layout !== 'home') { const p = D(-0.3, width / 2 + 0.45); out.lights.push({ at: [p[0], F + 2.3, p[1]], color: [1, 0.78, 0.4], size: 1.5 }); }
  }

  function windows(B, Fr, part, add) {
    const { hw, hd, F } = Fr, width = B.width || 1.2;
    if (B.kind === 'barn') return;
    for (const k of ['n', 's', 'w', 'e']) {
      const alongU = k === 'n' || k === 's', len = alongU ? B.w : B.d, n = Math.max(1, Math.floor(len / 3.2));
      for (let i = 0; i < n; i++) {
        const o = -len / 2 + (i + 0.5) * len / n;
        if (k === B.door && Math.abs(o) < width / 2 + 0.6) continue;
        if (B.kind === 'mill' && i % 2) continue;
        for (const inner of B.open ? [false, true] : [false]) {
          const off = inner ? -THICK - 0.02 : 0.02, sign = k === 'n' || k === 'w' ? -1 : 1;
          const u = alongU ? o : sign * (hw + off), v = alongU ? sign * (hd + off) : o;
          for (let fl = 0; fl < (B.storeys || 1); fl++) add(part(u, v, alongU ? 0.8 : 0.05, alongU ? 0.05 : 0.8, F + 1.0 + fl * 3, F + 1.9 + fl * 3, 'window', { indoor: inner }), false);
        }
      }
    }
  }

  function steps(B, T, Fr, part, add, dims, width) {
    const { F, local } = Fr, g0 = T.heightAt(...Fr.D(-0.4, 0)), rise = F - g0;
    if (rise <= 0.05 || B.lift) return;
    const riser = B.ramp ? 0.04 : 0.3, n = Math.ceil(rise / riser), len = B.ramp ? Math.max(0.12, Math.min(0.3, 3.2 / n)) : 0.34;
    for (let i = 0; i < n; i++) add(part(...local(-(n - i - 0.5) * len, 0), ...dims(width + 0.6, len + 0.01), g0 - 0.6, g0 + rise * (i + 1) / n, B.ramp ? 'plank' : 'stone'));
  }

  function furnish(B, L, out, Fr, part, add, dims) {
    const { F, local, D } = Fr;
    for (const [kind, f, sd, w, d, h, tag] of L.items) {
      const p = add(part(...local(f, sd), ...dims(w, d), F, F + h, FURNITURE[kind] || 'plank', { item: kind, indoor: true }), kind === 'stand' ? false : undefined);
      if (kind === 'bed' || kind === 'cot') out.beds.push({ id: tag || B.id + '-bed-' + out.beds.length, building: B.id, at: [p.x, p.z], y: F + h, kind, yaw: Fr.faceIn });
      if (kind === 'chest') out.chests.push({ id: tag || B.id + '-chest-' + out.chests.length, building: B.id, at: [p.x, p.z], y: F + h });
    }
    for (const [f, s0, s1, depth] of L.walls || []) {
      if (depth) add(part(...local(f + depth / 2, s0), ...dims(0.15, depth), F, F + 3.0, 'plank', { indoor: true }));
      else add(part(...local(f, (s0 + s1) / 2), ...dims(s1 - s0, 0.15), F, F + 3.0, 'plank', { indoor: true }));
    }
    if (L.keeper) out.keepers[B.id] = { at: D(L.keeper[0], L.keeper[1]), face: Fr.faceIn + Math.PI };
    if (L.fit) out.fits[B.id] = { at: D(L.fit[0], L.fit[1]), y: F + 0.22 };
    if (L.light) { const l = D(L.light[0], L.light[1]); out.lights.push({ at: [l[0], F + 0.9, l[1]], color: [1, 0.55, 0.22], size: 1.3, indoor: true }); }
  }

  const townCache = new WeakMap();
  const townOf = T => { let o = townCache.get(T); if (!o) { o = town(T); townCache.set(T, o); } return o; };
  const footprints = () => [
    ...BUILDINGS.map(B => ({ x: B.x, z: B.z, w: B.w + (B.wild ? 14 : B.korni ? 1.5 : 0), d: B.d + (B.wild ? 14 : B.korni ? 1.5 : 0), rot: B.rot })),
    ...KORNI.wells.map(([x, z]) => ({ x, z, w: 2, d: 2, rot: 0 })),
    { x: KORNI.clearing.x, z: KORNI.clearing.z, w: KORNI.clearing.w, d: KORNI.clearing.d, rot: 0 },
    { x: KORNI.windfall.at[0], z: KORNI.windfall.at[1], w: KORNI.windfall.len, d: 1.2, rot: KORNI.windfall.rot * 180 / Math.PI },
    ...KORNI.walkways.map(([a, b]) => ({ x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, w: Math.hypot(b[0] - a[0], b[1] - a[1]), d: 1.4, rot: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI }))
  ];

  const WALLS = [
    { id: 'palace', kind: 'stone', h: 10, thick: 3, dressed: 'stone', rect: [PALACE.x0, PALACE.z0, PALACE.x1, PALACE.z1], tower: { size: 10, h: 16 }, gates: [{ id: 'palace-gate', side: 'w', at: 700, width: 6 }, { id: 'palace-postern', side: 'n', at: 1270, width: 1.4 }] },
    { id: 'fort', kind: 'dark', h: 7, thick: 2.5, dressed: 'basalt', rect: [925, 75, 995, 135], tower: { size: 6, h: 11 }, gates: [{ id: 'fort-gate', side: 'w', at: 105, width: 5 }, { id: 'fort-postern', side: 'e', at: 105, width: 1.4 }] },
    { id: 'outpost', kind: 'wood', h: 4, thick: 0.6, dressed: 'stakes', rect: [1228, 380, 1252, 404], gates: [{ id: 'outpost-south', side: 's', at: 1240, width: 3 }, { id: 'outpost-north', side: 'n', at: 1240, width: 3 }] },
    { id: 'yard', kind: 'wood', h: 2, thick: 0.4, rect: [930, 1290, 980, 1330], gates: [{ id: 'yard-gate', side: 'w', at: 1310, width: 8 }] },
    { id: 'cemetery', kind: 'wood', h: 1.2, thick: 0.3, rect: [880, 1440, 920, 1470], gates: [{ id: 'cemetery-gate', side: 'n', at: 900, width: 3 }] }
  ];

  const LADDERS = [
    { x: 1153, z: 688, yaw: -Math.PI / 2, wall: 'palace' },
    { x: 1153, z: 712, yaw: -Math.PI / 2, wall: 'palace' },
    { x: 927.5, z: 95, yaw: -Math.PI / 2, wall: 'fort' },
    { x: 1233, z: 387.5, yaw: 0, box: 'outpost-tower' },
    { x: 784, z: 752, yaw: Math.PI / 2, box: 'ford-tower' },
    { x: 290, z: 743.5, yaw: 0, top: 10.4, platform: true },
    { x: 370, z: 673.5, yaw: 0, top: 10.4, platform: true },
    { x: 275, z: 683.5, yaw: 0, top: 11.4, platform: true },
    { x: 395, z: 658.5, yaw: 0, top: 8.4, platform: true },
    { x: 270, z: 763.5, yaw: 0, top: 8.4, platform: true }
  ];

  const wallBoxes = w => {
    const [x0, z0, x1, z1] = w.rect, t = w.thick, out = [];
    const sides = {
      n: { a: [x0, z0], b: [x1, z0], along: 'x' },
      s: { a: [x0, z1], b: [x1, z1], along: 'x' },
      w: { a: [x0, z0], b: [x0, z1], along: 'z' },
      e: { a: [x1, z0], b: [x1, z1], along: 'z' }
    };
    for (const [side, s] of Object.entries(sides)) {
      const from = s.along === 'x' ? s.a[0] : s.a[1], to = s.along === 'x' ? s.b[0] : s.b[1];
      const cuts = w.gates.filter(g => g.side === side).map(g => [g.at - g.width / 2, g.at + g.width / 2]).sort((p, q) => p[0] - q[0]);
      let cur = from;
      const pieces = [];
      for (const [g0, g1] of cuts) {
        if (g0 > cur) pieces.push([cur, g0]);
        cur = g1;
      }
      if (cur < to) pieces.push([cur, to]);
      const inward = side === 'n' || side === 'w' ? 1 : -1;
      for (const [p0, p1] of pieces) {
        const mid = (p0 + p1) / 2, len = p1 - p0;
        if (s.along === 'x') out.push({ x: mid, z: s.a[1] + inward * t / 2, w: len, d: t, h: w.h, kind: w.kind, wall: w.id, dressed: w.dressed, out: [0, -inward] });
        else out.push({ x: s.a[0] + inward * t / 2, z: mid, w: t, d: len, h: w.h, kind: w.kind, wall: w.id, dressed: w.dressed, out: [-inward, 0] });
      }
    }
    if (w.tower) {
      const q = w.tower.size / 2;
      for (const [cx, cz] of [[x0 + q, z0 + q], [x1 - q, z0 + q], [x0 + q, z1 - q], [x1 - q, z1 - q]]) {
        out.push({ x: cx, z: cz, w: w.tower.size, d: w.tower.size, h: w.tower.h, kind: w.kind, wall: w.id, tower: true, dressed: w.dressed });
      }
    }
    return out;
  };

  const DRILL = Object.freeze({
    at: [857, 1327], face: -2.27,
    rows: ['town', 'guard', 'elf', 'villain'],
    loop: [[-7, -3.5], [7, -3.5], [7, 9.5], [-7, 9.5]],
    walkers: [['town', 'm', 'walk'], ['guard', 'm', 'run'], ['elf', 'f', 'crouch'], ['villain', 'm', 'leap']],
    hoppers: [['guard', 'f', -5, 2]],
    straw: [[847, 1351, 0], [851, 1352, 0], [855, 1351, 0]],
    ring: Object.freeze({ at: [852, 1361], yaw: 0 }),
    chair: Object.freeze({ at: [847.5, 1365], yaw: 0 }),
    crutch: Object.freeze({ at: [846.2, 1364.2] }),
    slope: [[728, 1436], [735, 1440], [742, 1446], [731, 1446], [739, 1452], [725, 1442], [746, 1438], [734, 1432]]
  });

  const HEALERS = Object.freeze({
    town: { name: 'лекарь Аким', place: 'Мостовица', at: [816, 1366], face: 0 },
    guard: { name: 'лекарь Савва', place: 'лазарет дворца', at: [1270, 727.6], face: 0 },
    elf: { name: 'травница Рябина', place: 'Корни', at: [378, 720.2], face: 0 },
    villain: { name: 'костоправ Фрол', place: 'Старый форт', at: [940, 91.4], face: Math.PI }
  });

  const PRISONS = Object.freeze({
    guard: { name: 'гауптвахта дворца', at: [1175, 606.6], face: 0 },
    villain: { name: 'яма для пленных в форте', at: [960, 123], face: 0 }
  });

  const W90 = -Math.PI / 2, E90 = Math.PI / 2;
  const POSTS = [
    { side: 'guard', at: [1141, 697], face: W90 }, { side: 'guard', at: [1141, 703], face: W90 },
    { side: 'guard', at: [782, 756], face: W90 }, { side: 'guard', at: [782, 764], face: W90 },
    { side: 'guard', at: [1240, 401], face: Math.PI }, { side: 'guard', at: [1240, 383], face: 0 },
    { side: 'villain', at: [920, 102], face: W90 }, { side: 'villain', at: [920, 108], face: W90 },
    { side: 'villain', at: [958, 110], face: W90 },
    { side: 'elf', at: [412, 712], face: E90 }, { side: 'elf', at: [350, 640], face: 0 }
  ];

  const PATROLS = [
    { side: 'guard', n: 4, route: [[1140, 700], [1132, 712], [1122, 760], [1105, 840], [1060, 950], [1105, 840], [1122, 760], [1132, 712]] },
    { side: 'elf', n: 3, route: [[350, 712], [420, 692], [520, 710], [420, 692]] }
  ];

  const TOWN = Object.freeze({ x0: 770, z0: 1225, x1: 1005, z1: 1478, name: 'Мостовица' });
  const inTown = (x, z) => x >= TOWN.x0 && x <= TOWN.x1 && z >= TOWN.z0 && z <= TOWN.z1;

  const WATCH = Object.freeze({
    posts: [[793, 1321.5, W90], [793, 1328.5, W90], [837.5, 1426, Math.PI], [846.5, 1426, Math.PI], [903, 1263, 0.55], [910, 1259.5, 0.55], [840, 1317, 0]],
    house: 'watch',
    patrol: [[842, 1334], [880, 1322], [902, 1345], [868, 1382], [842, 1378], [806, 1342]],
    walkers: 4
  });

  const TOWNSFOLK = Object.freeze([
    { role: 'shop', shop: 'arms', at: 'stall-arms', name: 'Демьян', fig: 'm', look: { head: 'cap', main: [0.46, 0.34, 0.26], beard: true } },
    { role: 'shop', shop: 'armor', at: 'stall-armor', name: 'Евстигней', fig: 'm', look: { head: null, main: [0.3, 0.3, 0.32], beard: true } },
    { role: 'shop', shop: 'goods', at: 'stall-goods', name: 'Лукерья', fig: 'f', look: { head: 'kerchief', main: [0.62, 0.3, 0.25] } },
    { role: 'shop', shop: 'herbs', at: 'stall-herbs', name: 'Аграфена', fig: 'f', look: { head: 'kerchief', main: [0.4, 0.5, 0.32] } },
    { role: 'shop', shop: 'hides', at: 'stall-hides', name: 'Мокей', fig: 'm', look: { head: 'cap', main: [0.5, 0.4, 0.28], beard: true } },
    { role: 'inn', at: 'inn', name: 'Пров', fig: 'm', look: { head: null, main: [0.82, 0.78, 0.66], beard: true } },
    { role: 'doctor', at: 'doctor', name: 'Аким', fig: 'm', look: { head: null, main: [0.86, 0.84, 0.78], hairColor: [0.62, 0.6, 0.56], beard: true } },
    { role: 'master', shop: 'sharnir', at: 'sharnir', name: 'Шарнир', fig: 'm', look: { head: 'cap', main: [0.35, 0.3, 0.26], pros: { lFore: 'hinge' }, cut: { lFore: 'healed' } } },
    { role: 'digger', at: [902, 1450], name: 'Филат', fig: 'm', look: { head: 'cap', main: [0.38, 0.36, 0.32], beard: true }, route: [[886, 1446], [916, 1446], [916, 1462], [886, 1462]] }
  ]);

  const CARTS = Object.freeze([[944, 1300, 0.2], [958, 1322, 1.4], [970, 1302, -0.4]]);

  const GROUNDS = Object.freeze({
    forest: { name: 'Северная чаща', a: [431, 348.4], b: [431, 376], face: Math.PI },
    field: { name: 'Поле у Мостовицы', a: [850, 1221], b: [878, 1221], face: E90 },
    yard: { name: 'Двор дворца', a: [1220, 690], b: [1272, 690], face: E90 },
    fort: { name: 'Двор форта', a: [934, 108], b: [984, 108], face: E90 }
  });

  K.Places = { signs, milestones, PALACE_PTS, FORT_PTS, ZONES, KINDS, ROADS, RIVER, SWAMP, PALACE, FORT, SPOTS, ROUTES, LANDMARKS, BOXES, WALLS, LADDERS, DRILL, HEALERS, PRISONS, POSTS, PATROLS, GROUNDS, BUILDINGS, LAYOUTS, GRAVES, TOWN, inTown, WATCH, TOWNSFOLK, CARTS, KORNI, HERB_SPOTS, CACHES, CUTTERS, PLAN_DROP, town: townOf, footprints, wallBoxes };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
