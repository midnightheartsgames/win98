(function (Z) {
  'use strict';

  const P = Math.PI, H = Math.PI / 2;
  const S = Z.defineSite;

  Z.BRIDGE_SPECS['мост Преображенского'] = { camber: 3, pierStep: 1000, arch: [0.22, 0.86], archBase: -1, archRise: 12.5, archTop: 11.4, tier2: { from: 0.07, to: 0.945, drop: 5.5, w: 9, mat: 'railbed' } };
  Z.BRIDGE_SPECS['Арочный мост'] = { camber: 2, pierStep: 1000, arch: [0.1, 0.9], archBase: -1, archRise: 9 };
  Z.BRIDGE_SPECS['второй мост Преображенского'] = { camber: 2, pierStep: 30 };
  Z.BRIDGE_SPECS['Вантовый мост'] = { skip: true };
  Z.BRIDGE_SPECS['Балочный мост'] = { skip: true };
  Z.BRIDGE_SPECS['Аванкамерный мост'] = { skip: true };
  Z.BRIDGE_SPECS['плотина ДнепроГЭС'] = { skip: true };

  S({
    id: 'vozn', name: 'Вознесенка', at: [480.9, 175.5], rot: 0.3803,
    clear: [[0, -6, 42], [-14, 24, 22]],
    loc: { r: 70, xp: 0, arrive: [4, -4, H] },
    marks: { vozn_start: [-8, 11, P], vozn_pear: [0, -12, 0], vozn_square: [6, -10, P], vozn_pier: [-10, 30, P], vozn_west: [-70, 0, H], vozn_east: [72, 0, -H] },
    parts: [
      ['pear', 0, -19, 0],
      ['bench', -5, -12.5, P], ['bench', 6, -12.5, P],
      ['shack', 19, -21, P, { size: [10, 3.2, 7], mat: 'wood', tint: [150, 118, 88], roof: 'roofTin', roofTint: [130, 96, 70], sign: '~Бар «Груша»', door: { to: 'bar_grusha', name: 'Бар «Груша»' }, porch: true, chimney: true, light: { dy: 2.6, r: 10, c: [1.7, 1.1, 0.5] } }],
      ['shack', -21, -17, P, { size: [8, 3, 5.5], mat: 'brickWhite', roof: 'roofSlate', sign: 'Сельмаг', door: { to: 'selmag', name: 'Сельмаг' } }],
      ['shack', -8, 17, 0, { size: [9, 3, 6], mat: 'plasterWhite', roof: 'roofTin', roofTint: [100, 130, 120], sign: '!МЕДПУНКТ', door: { to: 'medpunkt', name: 'Медпункт' }, shutters: [190, 190, 180], light: { dy: 2.8, r: 8 } }],
      ['shack', 22, 19, 0, { size: [11, 3.4, 7], mat: 'brickRed', roof: 'roofSlate', sign: 'Сельсовет', door: { to: 'selsovet', name: 'Сельсовет' }, porch: true }],
      ['pole', 30, 12.5, 0, { h: 9 }],
      ['hut', -38, -23, P, { size: [8, 2.8, 5] }],
      ['hut', -52, -27, P + 0.15, { size: [6.5, 2.6, 4.5], shutters: [140, 60, 50] }],
      ['hut', 42, -25, P, { size: [7, 2.7, 5], shutters: [150, 60, 50] }],
      ['hut', -33, 19, 0, { size: [8, 2.8, 5] }],
      ['hut', 47, 21, 0, { size: [7.5, 2.8, 5], shutters: [60, 120, 80] }],
      ['picket', -38, 23, -28, 23], ['picket', -38, 23, -38, 29], ['picket', -28, 23, -28, 31],
      ['picket', 42, 25, 53, 25], ['picket', 53, 25, 53, 33], ['picket', 42, 25, 42, 33],
      ['picket', 37, -30, 47, -30], ['picket', 37, -30, 37, -36], ['picket', 47, -30, 47, -36],
      ['well', 5, 25, 0],
      ['haystack', 58, 30, 0], ['haystack', -48, 30, 0],
      ['pier', -10, 27, -10, 47, { w: 2.4 }],
      ['boat', -14.5, 41, 0.25], ['boat', -5.5, 44, -0.3], ['boat', -18, 33, 1.3, { tint: [80, 100, 120] }],
      ['lamp', -26, -9.5, H, { light: { dy: 6.6, r: 14, c: [1.3, 1.1, 0.8] } }], ['lamp', 28, -9.5, H, { light: { dy: 6.6, r: 14, c: [1.3, 1.1, 0.8] } }],
      ['sign', 9, -11.5, P, { text: '^ДОСКА ОБЪЯВЛЕНИЙ', w: 2.2, hh: 0.5, y0: 1.5 }],
      ['wreck', -61, -7, 0, { model: 'bus', tint: [150, 140, 60] }],
      ['wreck', -60, 7.5, 0.15, { model: 'zhiguli', tint: [120, 60, 50] }],
      ['sandbags', -64, -14, -64, -11], ['sandbags', -64, 11, -64, 14],
      ['sign', -67, -13, -H, { text: '^ВОЗНЕСЕНКА', w: 3.2 }],
      ['wreck', 63, -6.5, 0, { model: 'truck', tint: [90, 110, 90] }],
      ['block', 63, 4, H], ['block', 63, 7, H],
      ['sandbags', 66, 10, 66, 14],
      ['sign', 67, -12, H, { text: '^ВОЗНЕСЕНКА', w: 3.2 }],
      ['wreck', 58, -28, 0.7, { model: 'truck', tint: [140, 70, 40] }],
      ['prop', -24, -23.5, 0, { prop: 'boxes' }], ['prop', 25, -26, 0, { prop: 'sacks' }],
      ['prop', -2, 22, 0, { prop: 'sacks' }]
    ],
    objects: [
      { type: 'pump', u: 3, v: 11.5, yaw: 0 },
      { type: 'campfire', u: -17, v: 28, yaw: 0 },
      { type: 'crate', u: -26, v: -21, yaw: 0.3, loot: 'food', owner: 'vozn' },
      { type: 'trash', u: 11, v: -12, yaw: P, loot: 'trash' },
      { type: 'barrel', u: -13, v: 26, yaw: 0 },
      { type: 'bench', u: 33, v: -24, yaw: P, name: 'Верстак Миколы' }
    ]
  });

  S({
    id: 'market', name: 'Вознесенский рынок', at: [447, 99], rot: 0.3803,
    clear: [[0, 0, 21]],
    edits: [{ t: 'rect', u: 0, v: 0, sx: 50, sz: 30, soft: 5, cover: 'urban' }],
    loc: { r: 40, xp: 15 },
    marks: { market_center: [0, 0, 0] },
    parts: [
      ['stall', -12, -6, P, { tint: [170, 60, 50] }], ['stall', -6, -6, P, { tint: [60, 90, 150] }], ['stall', 0, -6, P, { tint: [170, 150, 60] }], ['stall', 6, -6, P, { tint: [70, 130, 80] }], ['stall', 12, -6, P, { tint: [160, 90, 140] }],
      ['stall', -12, 6, 0, { tint: [60, 120, 140] }], ['stall', -6, 6, 0, { tint: [170, 120, 60] }], ['stall', 0, 6, 0, { tint: [150, 60, 60] }], ['stall', 6, 6, 0, { tint: [90, 90, 160] }], ['stall', 12, 6, 0, { tint: [120, 140, 60] }],
      ['kiosk', -20, 0, H, { sign: 'Союзпечать' }], ['kiosk', 20, 0, -H, { sign: 'ПИВО — ВОДЫ', tint: [140, 90, 60] }],
      ['booth', 0, -14, P, { sign: '!НАЛОГОВЫЙ ПОСТ', tint: [100, 110, 80] }],
      ['sandbags', -4, -16.5, 4, -16.5],
      ['container', -24, -12, 0.2, { tint: [70, 100, 130] }],
      ['banner', 0, 13, 0, { text: '^ВОЗНЕСЕНСКИЙ РЫНОК', w: 8, hh: 1, y0: 3 }],
      ['prop', 16, -12, 0.4, { prop: 'boxes' }], ['prop', -16, 12, 0.2, { prop: 'sacks' }]
    ],
    objects: [
      { type: 'trash', u: 18, v: 10, yaw: 0, loot: 'trash' },
      { type: 'sodamachine', u: -17, v: -4, yaw: H, name: 'Автомат газированной воды' }
    ]
  });

  S({
    id: 'kpp', name: 'КПП «Мост»', at: [-292, -334], rot: -0.254,
    clear: [[0, 0, 16]],
    loc: { r: 45, xp: 20, arrive: [18, 0, -H] },
    marks: { kpp_gate: [-8, 0, -H], kpp_east: [14, 0, -H] },
    parts: [
      ['crossbar', -8, -7.4, H, { w: 7 }],
      ['booth', -5, -11.5, P, { sign: '!КПП', tint: [90, 110, 80] }],
      ['sandbags', -12, -9.5, -2, -9.5], ['sandbags', -12, 8.8, -3, 8.8],
      ['block', -2, -3, H], ['block', 3, 3, H], ['block', 8, -3, H],
      ['wire', -14, -16, -14, -10], ['wire', -14, 9, -14, 12],
      ['container', 5, -15, 0.1, { tint: [80, 100, 70] }],
      ['pole', -1, -12.5, 0, { h: 9 }],
      ['lamp', -12, -11.5, H, { lit: true, light: { dy: 6.6, r: 16, c: [1.4, 1.3, 1.1] } }],
      ['sign', 9, -10.5, H, { text: '!СТОЙ! ПРЕДЪЯВИ ПРОПУСК', w: 3.6 }],
      ['hedgehog', 12, 7, 0], ['hedgehog', 12, -7.5, 0.4],
      ['box', -6, -15.7, 0, { size: [1.6, 2.1, 0.7], mat: 'paintGreen', tint: [80, 100, 80] }]
    ],
    objects: [
      { type: 'ammobox', u: -7, v: -14, yaw: 0, loot: 'military', owner: 'komendatura', lock: 25, id: 'kpp_ammo' }
    ]
  });

  S({
    id: 'sich', name: 'Запорожская Сечь', at: [-592, -612], rot: 0,
    clear: [[0, 0, 48]],
    edits: [{ t: 'rect', u: 0, v: 0, sx: 66, sz: 58, y: 21, soft: 9, cover: 'none' }],
    loc: { r: 55, xp: 40, arrive: [40, 0, -H] },
    marks: { sich_gate: [36, 0, -H], sich_maidan: [6, 6, 0] },
    parts: [
      ['palisade', -30, -26, 30, -26], ['palisade', 30, 26, -30, 26], ['palisade', -30, 26, -30, -26],
      ['palisade', 30, -26, 30, -4], ['palisade', 30, 4, 30, 26],
      ['tower', -30, -26, 0, { h: 8 }], ['tower', 30, -26, 0, { h: 8 }], ['tower', -30, 26, 0, { h: 8 }], ['tower', 30, 26, 0, { h: 8 }],
      ['box', 30, 0, 0, { size: [1.2, 1, 9.5], mat: 'logs', dy: 4.4, solid: false, pad: false }],
      ['cyl', 30, -4.6, 0, { r: 0.3, h: 5.4, mat: 'logs' }], ['cyl', 30, 4.6, 0, { r: 0.3, h: 5.4, mat: 'logs' }],
      ['church', 0, -9, H],
      ['hut', -20, -11, H, { size: [12, 3, 6], mat: 'logs', tint: [128, 128, 128], roof: 'thatch', door: { to: 'kuren', name: 'Курень Кущевский' } }],
      ['hut', -20, 8, H, { size: [12, 3, 6], mat: 'logs', tint: [120, 116, 110], roof: 'thatch' }],
      ['hut', -2, 19, 0, { size: [11, 3, 6], mat: 'logs', tint: [124, 120, 112], roof: 'thatch' }],
      ['shack', 15, 18.5, 0, { size: [12, 3.4, 7], mat: 'logs', roof: 'roofTin', roofTint: [90, 110, 90], sign: '~ВОЙСКОВАЯ КАНЦЕЛЯРИЯ', door: { to: 'sich_kosh', name: 'Войсковая канцелярия' }, porch: true }],
      ['shack', 17, -17, P, { size: [9, 3, 6], mat: 'logs', roof: 'thatch', sign: '~Корчма', door: { to: 'korchma', name: 'Корчма' }, chimney: true, light: { dy: 2.5, r: 9, c: [1.7, 1.0, 0.45] } }],
      ['shack', -14, 21, 0, { size: [6, 3, 5], mat: 'logs', roof: 'roofTin', sign: '~Кузня', windows: false, chimney: true }],
      ['pole', 6, 3, 0, { h: 10, flagTint: [150, 30, 50] }],
      ['well', -6, 3, 0],
      ['cyl', 24, -8, 0, { r: 0.35, r1: 0.25, h: 0.6, mat: 'rust', solid: false }],
      ['sign', 37, -7.5, H, { text: '~ЗАПОРОЖСКАЯ СЕЧЬ', w: 3.8 }],
      ['haystack', -24, 20, 0],
      ['prop', 22, 14, 0, { prop: 'boxes' }], ['prop', -9, -20, 0.5, { prop: 'sacks' }]
    ],
    objects: [
      { type: 'campfire', u: 8, v: 10, yaw: 0 },
      { type: 'crate', u: 26, v: 22, yaw: 0.2, loot: 'military', owner: 'sich' },
      { type: 'barrel', u: -25, v: -3, yaw: 0 }
    ]
  });

  S({
    id: 'museum', name: 'Музей истории казачества', at: [-552, -262], rot: 0,
    loc: { r: 40, xp: 25, arrive: [16, 0, -H] },
    parts: [
      ['shack', 0, 0, H, { size: [18, 5, 11], mat: 'concretePanel', tint: [150, 146, 136], roof: 'roofFelt', windows: false, sign: '^МУЗЕЙ ИСТОРИИ ЗАПОРОЖСКОГО КАЗАЧЕСТВА', door: { to: 'museum', name: 'Музей' } }],
      ['statue', 14, -8, H, { size: [3, 5, 3], mat: 'bronze', tint: [110, 140, 110], coat: true }],
      ['wreck', 12, 9, 0.9, { model: 'volga', tint: [40, 40, 44] }],
      ['sandbags', 10, -3, 10, 3]
    ]
  });

  S({
    id: 'zmeeva', name: 'Змиева пещера', at: [-655, -755], rot: 0,
    edits: [{ t: 'rect', u: 0, v: -3, sx: 10, sz: 7, y: 8, soft: 4 }],
    loc: { r: 30, xp: 30, arrive: [0, 5, 0] },
    parts: [
      ['box', 0, -1.2, 0, { size: [6, 4.2, 2.4], mat: 'granite', tint: [70, 66, 62], dy: -0.5 }],
      ['ruinwall', -4, -3, -2, -4, { mat: 'granite', h: 5, thick: 1.6 }], ['ruinwall', 2, -4, 4, -3, { mat: 'granite', h: 5, thick: 1.6 }],
      ['stone', -5, 1, 0.3, { w: 1.6, h: 1.2 }], ['stone', 5.5, 0.5, -0.4, { w: 1.4, h: 1.0 }],
      ['sign', 4, 3, 0, { text: '!ОПАСНО! ВХОД ВОСПРЕЩЁН · НИИ «ХОРТИЦА»', w: 3.4 }]
    ],
    objects: [{ type: 'door', u: 0, v: -0.1, yaw: 0, to: 'nii_cave', mark: 'A', name: 'Змиева пещера', dest: 'Змиева пещера', mat: 'rust', tint: [90, 90, 84], id: 'door_nii_cave', ext: true }]
  });

  S({
    id: 'lager', name: 'Пионерлагерь «Чайка»', at: [-832, -598], rot: 0,
    loc: { r: 55, xp: 25, arrive: [10, 6, -H] },
    entrances: [{ at: [-870, -595], to: 'lager', name: 'Корпус лагеря', sign: '^ПИОНЕРЛАГЕРЬ «ЧАЙКА»', signW: 4.6 }],
    parts: [
      ['banner', 8, -10, H, { text: '^ПИОНЕРЛАГЕРЬ «ЧАЙКА»', w: 7, hh: 1, y0: 3.2 }],
      ['pole', 0, 2, 0, { h: 11, flagTint: [200, 40, 30] }],
      ['statue', -2, 14, 0, { size: [2.4, 3.6, 2.4], mat: 'plasterWhite', tint: [190, 190, 186] }],
      ['box', 4, 22, 0, { size: [8, 0.9, 5], mat: 'wood', tint: [140, 110, 80] }],
      ['crossbar', 12, 12, 0, { w: 5 }], ['crossbar', 12, 30, P, { w: 5 }],
      ['tent', 18, -4, 0.3, { size: [3, 2.2, 4], tint: [150, 160, 120] }], ['tent', 22, 2, -0.2, { size: [3, 2.2, 4], tint: [150, 160, 120] }],
      ['bench', -6, 6, H], ['bench', -6, 10, H],
      ['sign', -6, -6, -H, { text: '^БУДЬ ГОТОВ! — ВСЕГДА ГОТОВ!', w: 3.6 }]
    ],
    objects: [{ type: 'campfire', u: 16, v: 8, yaw: 0 }, { type: 'crate', u: 20, v: -8, yaw: 0, loot: 'food' }]
  });

  S({
    id: 'kolkhoz', name: 'Колхоз «Заветы Ильича»', at: [100, 400], rot: 0,
    loc: { r: 60, xp: 25, arrive: [-30, 20, H] },
    entrances: [{ at: [103, 403], to: 'kolkhoz', name: 'Правление колхоза', sign: '~ПРАВЛЕНИЕ КОЛХОЗА «ЗАВЕТЫ ИЛЬИЧА»', signW: 4.6 }],
    parts: [
      ['tower', -26, 0, 0, { h: 7 }], ['cistern', -26, 0, 0, { r: 2.2, h: 3, dy: 9.2, solid: false }],
      ['cyl', -36, -14, 0, { r: 3, r1: 2.6, h: 10, mat: 'concrete' }], ['cyl', -36, -6, 0, { r: 3, r1: 2.6, h: 10, mat: 'concrete' }],
      ['wreck', -14, 22, 0.6, { model: 'truck', tint: [70, 110, 140] }], ['wreck', -24, 26, -0.3, { model: 'truck', tint: [150, 60, 40] }],
      ['haystack', -40, 22, 0], ['haystack', -46, 28, 0], ['haystack', -38, 32, 0],
      ['fence', -52, 12, -52, 40, { mat: 'wood', h: 1.4 }], ['fence', -52, 40, -8, 40, { mat: 'wood', h: 1.4 }],
      ['sign', -50, 4, -H, { text: '~КОЛХОЗ «ЗАВЕТЫ ИЛЬИЧА»', w: 3.8 }],
      ['banner', -18, 6, 0, { text: '!ПЯТИЛЕТКУ — В ТРИ ГОДА!', w: 6, hh: 0.9, y0: 2.8 }]
    ],
    objects: [{ type: 'toolbox', u: -16, v: 10, yaw: 0, loot: 'tools' }, { type: 'pump', u: -20, v: 4, yaw: 0 }]
  });

  S({
    id: 'ptica', name: 'Птицефабрика', at: [180, 452], rot: 0.15,
    clear: [[0, 0, 26]],
    loc: { r: 45, xp: 25 },
    parts: [
      ['shack', 0, -9, 0, { size: [32, 3, 9], mat: 'brickWhite', roof: 'roofFelt', windows: false, sign: '^ПТИЧНИК №2', door: { to: 'ptichnik', name: 'Птичник №2' } }],
      ['shack', 0, 9, P, { size: [32, 3, 9], mat: 'brickWhite', roof: 'roofFelt', windows: false, sign: '^ПТИЧНИК №1' }],
      ['cistern', 20, 0, 0, { r: 1.6, h: 6 }],
      ['fence', -20, -18, 22, -18, { h: 2.2 }], ['fence', -20, 18, 22, 18, { h: 2.2 }],
      ['rubble', -18, 0, 0.3, { size: [3, 1.2, 3] }]
    ],
    objects: [{ type: 'crate', u: 16, v: 4, yaw: 0, loot: 'food' }]
  });

  S({ id: 'potato', name: 'Картофельное поле', at: [-40, 470], loc: { r: 50, xp: 20 } });
  S({ id: 'sunflowers', name: 'Поле подсолнухов', at: [235, 540], loc: { r: 50, xp: 20 } });

  S({
    id: 'scythia', name: 'Скифский стан', at: [150, 615], rot: 0,
    edits: [{ t: 'mound', u: -14, v: 26, r: 9, h: 3.2 }, { t: 'mound', u: 18, v: 30, r: 7, h: 2.4 }, { t: 'mound', u: 30, v: -14, r: 8, h: 2.8 }],
    loc: { r: 45, xp: 30 },
    parts: [
      ['stone', -4, -6, 0.2, { w: 0.9, h: 2.4, baba: true }], ['stone', 4, -6, -0.2, { w: 0.9, h: 2.2, baba: true }], ['stone', 0, -10, 0, { w: 1.1, h: 3.2 }],
      ['stone', -10, 4, 0.8, { w: 0.8, h: 1.8, baba: true }], ['stone', 10, 6, -0.6, { w: 0.8, h: 2.0, baba: true }],
      ['tent', -12, -14, 0.4, { size: [4, 3, 4], tint: [120, 100, 80] }], ['tent', 12, -16, -0.3, { size: [4, 3, 4], tint: [110, 96, 76] }],
      ['palisade', -20, -24, 20, -24, { h: 2.4 }],
      ['pole', 0, -18, 0, { h: 6, flagTint: [140, 110, 40] }],
      ['rubble', -14, 22, 0, { size: [2.4, 0.9, 2.4], tint: [130, 110, 90] }]
    ],
    objects: [{ type: 'campfire', u: 0, v: -2, yaw: 0 }, { type: 'crate', u: 14, v: -12, yaw: 0, loot: 'junk', lock: 40 }]
  });

  S({
    id: 'oak', name: 'Запорожский дуб', at: [-193, 186], rot: 0,
    clear: [[0, 0, 14]],
    loc: { r: 30, xp: 20 },
    parts: [
      ['bigoak', 0, 0, 0],
      ['picket', -9, -9, 9, -9, { h: 0.9 }], ['picket', 9, -9, 9, 9, { h: 0.9 }], ['picket', 9, 9, -9, 9, { h: 0.9 }], ['picket', -9, 9, -9, 4, { h: 0.9 }],
      ['sign', -10, 6, -H, { text: '~ЗАПОРОЖСКИЙ ДУБ · 700 ЛЕТ', w: 3.4 }]
    ]
  });

  S({
    id: 'plavni', name: 'Рыбацкий стан в плавнях', at: [700, 1188], rot: 0,
    clear: [[0, 0, 18]],
    loc: { r: 45, xp: 25, arrive: [-12, -10, H] },
    parts: [
      ['shack', -6, -6, H, { size: [7, 2.8, 5], mat: 'wood', tint: [120, 104, 86], roof: 'thatch', sign: '~РЫБАРТЕЛЬ', door: { to: 'rybartel', name: 'Хата рыбаков' } }],
      ['shack', 8, -10, 0, { size: [5, 2.6, 4], mat: 'wood', tint: [110, 96, 80], roof: 'thatch', windows: false }],
      ['pier', 18, 4, 34, 6, { w: 2.2 }], ['pier', 14, 12, 22, 22, { w: 2 }],
      ['boat', 26, 9, 1.5], ['boat', 30, 2, 1.2, { tint: [90, 110, 120] }], ['boat', 18, 20, 0.6],
      ['pole', 4, 4, 0, { h: 4, flag: 'cloth', flagTint: [160, 160, 150] }],
      ['prop', 0, 6, 0, { prop: 'sacks' }]
    ],
    objects: [{ type: 'campfire', u: 4, v: 0, yaw: 0 }, { type: 'barrel', u: -1, v: 3, yaw: 0 }, { type: 'crate', u: 10, v: -4, yaw: 0, loot: 'food', owner: 'vozn' }]
  });

  S({
    id: 'bayda', name: 'Остров Байда', at: [-985, -640], rot: 0,
    edits: [{ t: 'mound', u: 0, v: 0, r: 26, h: 12, cover: 'scrub' }, { t: 'mound', u: 10, v: 14, r: 12, h: 6, cover: 'rock' }],
    loc: { r: 30, xp: 50, secret: true },
    parts: [
      ['ruinwall', -10, -8, 6, -10, { mat: 'granite', h: 4, thick: 1.4 }], ['ruinwall', 6, -10, 10, 4, { mat: 'granite', h: 3.4, thick: 1.4 }],
      ['ruinwall', -10, -8, -12, 6, { mat: 'granite', h: 2.6, thick: 1.4 }],
      ['cyl', -11, -9, 0, { r: 2.2, r1: 1.9, h: 6, mat: 'granite', tint: [110, 104, 96] }],
      ['rubble', 0, 4, 0, { size: [4, 1.4, 4], tint: [120, 116, 110] }]
    ],
    objects: [{ type: 'safe', u: -6, v: -5, yaw: 0, name: 'Сундук Байды', lock: 75, loot: [['talon', 1, 120, 200], ['sabreBayda', 1, 1, 1], ['bkMelee', 1, 1, 1]], id: 'bayda_chest' }]
  });

  S({
    id: 'pobeda', name: 'Парк Победы', at: [790, 196], rot: 0,
    clear: [[0, 0, 16]],
    loc: { r: 55, xp: 20 },
    parts: [
      ['shack', -8, -14, 0, { size: [9, 3, 6], mat: 'corrugated', tint: [150, 120, 100], roof: 'roofTin', sign: '!ТИР', door: { to: 'shpana_base', name: 'Тир' } }],
      ['wreck', 6, -4, 0.9, { model: 'zhiguli', tint: [40, 60, 120] }], ['wreck', -14, 2, 2.0, { model: 'zaz', tint: [180, 170, 60] }], ['wreck', 2, 10, 2.8, { model: 'volga', tint: [30, 30, 30] }],
      ['tent', 12, 6, 0.5, { size: [3, 2, 4], tint: [90, 70, 60] }], ['tent', -4, 8, -0.4, { size: [3, 2, 4], tint: [70, 80, 60] }],
      ['sign', 14, -12, H, { text: '!ШПАНА. ВХОД — ДВАДЦАТЬ ТАЛОНОВ', w: 3.8 }],
      ['statue', 22, 16, -H, { size: [3, 4, 3], mat: 'bronze', tint: [100, 120, 100] }]
    ],
    objects: [{ type: 'campfire', u: 0, v: 2, yaw: 0 }, { type: 'crate', u: -12, v: -6, yaw: 0, loot: 'junk', owner: 'shpana' }]
  });

  S({
    id: 'vault12', name: 'Убежище ГО №12', at: [615, -70], rot: 0,
    clear: [[0, 0, 10]],
    loc: { r: 35, xp: 30 },
    parts: [
      ['shack', 0, 0, 0, { size: [6, 3, 5], mat: 'concretePanel', roof: 'roofFelt', windows: false, sign: '!УБЕЖИЩЕ ГО №12', door: { to: 'vault12', name: 'Убежище ГО №12' } }],
      ['sign', -6, -4, 0, { text: '^ОЧЕРЕДЬ ЗАНИМАТЬ ЗДЕСЬ', w: 3 }],
      ['bench', 4, -6, 0], ['bench', 8, -4, -0.6]
    ]
  });

  S({
    id: 'redmud', name: 'Шламохранилище ЗАлК', at: [258, -624], rot: 0,
    clear: [[0, 0, 30]],
    edits: [{ t: 'pad', u: 0, v: 0, r: 26, soft: 6, cover: 'landfill' }, { t: 'mound', u: 0, v: 0, r: 20, h: -1.5 }],
    loc: { r: 45, xp: 25 },
    parts: [
      ['shack', 22, -18, 0, { size: [6, 3, 5], mat: 'concretePanel', roof: 'roofFelt', windows: false, sign: '!УБЕЖИЩЕ ГО №3', door: { to: 'vault3', name: 'Убежище ГО №3' } }],
      ['sign', -20, 16, 0, { text: '!ШЛАМ! ЯДОВИТО! НЕ ВХОДИТЬ', w: 3.4 }],
      ['pylon', -24, -20, 0], ['wreck', 14, 14, 0.4, { model: 'truck', tint: [120, 80, 50] }]
    ]
  });

  S({
    id: 'square', name: 'Площадь Маяковского', at: [199, -515], rot: -0.892,
    loc: { r: 40, xp: 10, at: [0, 10] },
    parts: [
      ['sandbags', -7, 5, -2.5, 5], ['sandbags', 2.5, 5, 7, 5],
      ['pole', -5, 1.6, 0, { h: 10 }], ['pole', 5, 1.6, 0, { h: 10 }],
      ['banner', 0, 13, P, { text: '!ПОРЯДОК — ОСНОВА ВОССТАНОВЛЕНИЯ', w: 7, hh: 0.9, y0: 3 }],
      ['booth', 10, 6, P, { sign: '!ПРОПУСКА', tint: [90, 110, 80] }],
      ['wreck', -14, 14, 1.2, { model: 'trolley', tint: [180, 170, 120] }]
    ]
  });

  S({
    id: 'sichpost', name: 'Застава сечевиков', at: [-478, -231], rot: 2.386,
    loc: { r: 30, xp: 10 },
    parts: [
      ['sandbags', -3, -8.5, 3, -8.5], ['sandbags', -3, 8.5, 3, 8.5],
      ['pole', 0, -11.5, 0, { h: 8, flagTint: [150, 30, 50] }],
      ['tent', 7, -13, 0.2, { size: [3, 2.2, 4], tint: [120, 110, 80] }]
    ]
  });

  S({
    id: 'dam', name: 'ДнепроГЭС', at: [-330, -900], rot: 0,
    loc: { r: 90, xp: 30, nofast: true },
    parts: [['dam', 0, 0, 0, { pts: [[-262, -850], [-275, -890], [-305, -927], [-345, -952], [-406, -965]], crest: 30, y: 0, sign: '!ДНЕПРОГЭС ИМЕНИ В. И. ЛЕНИНА', pad: false }]]
  });

  const city = (id, name, at, en, loc) => S({ id, name, at, entrances: en ? [Object.assign({ at, to: id, name }, en)] : [], loc: Object.assign({ r: 45, xp: 20 }, loc || {}) });
  city('komendatura', 'Горисполком (Комендатура)', [196, -502], { sign: '!КОМЕНДАТУРА', signW: 4, face: [0.63, 0.78] });
  city('intourist', 'Гостиница «Интурист»', [274, -431], { sign: '*ИНТУРИСТ', signW: 4 });
  city('orbita', 'ДК «Орбита»', [210, -399], { sign: 'ДК «ОРБИТА»', signW: 4 });
  city('pochtamt', 'Почтамт', [443, -331], { sign: '^ПОЧТАМТ', signW: 3.6 });
  city('oblispolkom', 'Облисполком', [627, -171], { sign: '!ОБЛИСПОЛКОМ', signW: 4.4 });
  city('tyuz', 'ТЮЗ', [634, -311], { sign: 'ТЕАТР ЮНОГО ЗРИТЕЛЯ', signW: 4.4 });
  city('circus', 'Цирк', [380, 68], { sign: '!ЦИРК', signW: 3.2 }, { r: 50 });
  city('hospital', 'Инфекционная больница', [712, 155], { sign: '^ИНФЕКЦИОННАЯ БОЛЬНИЦА', signW: 4.6 });
  city('zalk3', 'ЗАлК, электролизный цех №3', [459, -795], { sign: 'ЭЛЕКТРОЛИЗНЫЙ ЦЕХ №3', signW: 4.6 }, { r: 70, xp: 30 });
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
