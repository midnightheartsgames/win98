const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { rasterize } = require('./fallout-ru-fonts.cjs');

const ROOT = path.join(__dirname, '..');
const GAME = path.join(ROOT, 'content', 'Fallout');
const RU = path.join(ROOT, 'content', 'fallout-ru');
for (const m of ['fo-core', 'fo-dat', 'fo-formats', 'fo-files', 'fo-text']) require(path.join(ROOT, 'js', 'apps', 'fallout', m + '.js'));
const FO = globalThis.FO;

const FIRST_CYCLING = 229;
const SHADOW = 0.55;
const BASE_Y = 300;

const STYLES = {
  plate: { family: 'Verdana', weight: '700', cap: 7, hWidth: 7, spacing: 1, color: [176, 180, 192], shadow: false, blend: 'alpha' },
  stat: { family: 'Verdana', weight: '700', cap: 8, hWidth: 9, spacing: 1, color: [140, 126, 30] },
  small: { family: 'Verdana', weight: '700', cap: 8, hWidth: 6, spacing: 1, color: [150, 138, 36] },
  label: { family: 'Verdana', weight: '700', cap: 10, hWidth: 8, spacing: 1, color: [176, 152, 40] },
  engraved: { family: 'Bahnschrift', weight: '600', cap: 11, hWidth: 8, spacing: 1, color: [160, 138, 36] },
  big: { family: 'Bahnschrift', weight: '700', cap: 18, hWidth: 9, spacing: 1, color: [176, 150, 38] },
  mode: { family: 'Verdana', weight: '700', cap: 9, hWidth: 8, spacing: 1, color: [164, 140, 40] },
  month: { family: 'Verdana', weight: '700', cap: 8, hWidth: 7, spacing: 0, color: [216, 216, 216], shadow: false, blend: 'alpha', gamma: 0.7 },
  place: { family: 'Verdana', weight: '700', cap: 7, hWidth: 6, spacing: 1, color: [200, 212, 236], shadow: false, blend: 'alpha', gamma: 0.7 },
  thin: { family: 'Bahnschrift', weight: '400', cap: 9, hWidth: 8, spacing: 2, color: [170, 150, 40] },
  stencil: { family: 'Bahnschrift', weight: '700', cap: 18, hWidth: 12, spacing: 2, color: [150, 130, 30], wear: 0.3 },
  title: { family: 'Bahnschrift', weight: '700', cap: 32, hWidth: 24, spacing: 4, color: [160, 140, 30], wear: 0.3 },
  heading: { family: 'Bahnschrift', weight: '700', cap: 17, hWidth: 12, spacing: 2, color: [160, 140, 30], wear: 0.3 },
  help: { family: 'Bahnschrift', weight: '700', stretch: 'condensed', cap: 8, spacing: 0, color: [164, 132, 88], solid: true, shadowDark: 0.95 },
  helpBig: { family: 'Bahnschrift', weight: '700', stretch: 'condensed', cap: 11, spacing: 0, color: [164, 132, 88], solid: true, shadowDark: 0.95 },
  helpTitle: { family: 'Bahnschrift', weight: '700', stretch: 'condensed', cap: 22, spacing: 1, color: [164, 132, 88], solid: true, shadowDark: 0.95, shadowOffset: 2 }
};

const HELP_TEXT = [
  [129, 7, 146, 31, 'Краткая справка', 'helpTitle', { fit: 215, clear: [126, 4, 152, 38], grow: 3 }],
  [48, 67, 82, 14, 'Курсор движения', 'helpBig', { fit: 86 }],
  [139, 69, 123, 11, '(Shift + левый щелчок: бег)', 'help', { fit: 200 }],
  [47, 97, 112, 15, 'Курсор прицела', 'helpBig'],
  [48, 130, 114, 14, 'Курсор команд', 'helpBig'],
  [48, 161, 71, 14, 'Курсор применения', 'helpBig', { fit: 130 }],
  [183, 115, 50, 11, 'Правый щелчок', 'help'],
  [183, 133, 46, 11, 'меняет режим', 'help'],
  [183, 151, 61, 11, 'курсора.', 'help'],
  [49, 200, 53, 17, 'Взять/применить', 'helpBig', { fit: 130 }],
  [185, 201, 28, 14, 'Говорить', 'helpBig'],
  [49, 242, 45, 14, 'Повернуть', 'helpBig'],
  [186, 242, 67, 15, 'Бросить предмет', 'helpBig', { fit: 150 }],
  [49, 284, 58, 14, 'Осмотреть', 'helpBig'],
  [186, 278, 95, 15, 'Применить предмет', 'helpBig', { fit: 150 }],
  [186, 296, 54, 14, 'из инвентаря', 'helpBig', { fit: 150 }],
  [49, 325, 47, 14, 'Разрядить', 'helpBig'],
  [186, 325, 42, 14, 'Отмена', 'helpBig'],
  [48, 367, 37, 14, 'Навыки', 'helpBig'],
  [370, 17, 40, 10, 'Атака!!!', 'help'],
  [371, 36, 78, 10, 'Экран персонажа', 'help'],
  [371, 54, 46, 11, 'Инвентарь', 'help'],
  [371, 72, 62, 11, 'Пип-Бой 2000', 'help'],
  [371, 90, 61, 11, 'Часы Пип-Боя', 'help'],
  [371, 108, 36, 11, 'Меню', 'help'],
  [370, 126, 92, 11, 'Сменить руку', 'help'],
  [370, 144, 93, 11, 'Режим мыши', 'help'],
  [370, 162, 85, 11, 'Режим предмета', 'help'],
  [371, 180, 39, 10, 'Навыки', 'help'],
  [371, 198, 50, 10, 'Скрытность', 'help'],
  [371, 216, 59, 11, 'Взлом', 'help'],
  [371, 234, 44, 10, 'Кража', 'help'],
  [371, 252, 45, 11, 'Ловушки', 'help'],
  [371, 270, 59, 10, 'Первая помощь', 'help'],
  [371, 288, 50, 10, 'Врач', 'help'],
  [371, 306, 55, 10, 'Наука', 'help'],
  [371, 324, 51, 11, 'Ремонт', 'help'],
  [371, 342, 88, 10, 'Дата и время', 'help'],
  [530, 36, 54, 10, 'Поворот влево', 'help', { fit: 108 }],
  [530, 54, 49, 10, 'Поворот вправо', 'help', { fit: 108 }],
  [530, 72, 80, 10, 'Конец хода', 'help', { fit: 108 }],
  [530, 90, 86, 11, 'Конец боя/ГОТОВО', 'help', { fit: 108 }],
  [529, 108, 43, 11, 'Автокарта', 'help', { fit: 108 }],
  [530, 126, 79, 10, 'Центр на герое', 'help', { fit: 108 }],
  [530, 144, 96, 11, 'Яркость меньше', 'help', { fit: 108 }],
  [530, 162, 93, 11, 'Яркость больше', 'help', { fit: 108 }],
  [530, 180, 21, 11, 'Справка', 'help', { fit: 108 }],
  [530, 198, 101, 10, 'Громкость тише', 'help', { fit: 108 }],
  [530, 216, 87, 11, 'Громкость громче', 'help', { fit: 108 }],
  [530, 234, 53, 10, 'Сохранить игру', 'help', { fit: 108 }],
  [530, 252, 52, 10, 'Загрузить игру', 'help', { fit: 108 }],
  [530, 270, 52, 10, 'Быстрое сохранение', 'help', { fit: 108 }],
  [530, 288, 51, 10, 'Быстрая загрузка', 'help', { fit: 108 }],
  [530, 305, 74, 12, 'Выход/главное меню', 'help', { fit: 108 }],
  [530, 324, 78, 10, 'Снимок экрана', 'help', { fit: 108 }],
  [530, 342, 28, 10, 'Пауза', 'help', { fit: 108 }],
  [148, 377, 89, 11, 'Сменить руку', 'help', { align: 'center', fit: 100 }],
  [298, 377, 63, 11, 'Очки действия', 'help', { align: 'center', fit: 90 }],
  [458, 377, 26, 11, 'Навыки', 'help', { align: 'center' }],
  [68, 425, 38, 12, 'Монитор', 'help', { align: 'right' }],
  [518, 420, 73, 12, 'Кнопка боя', 'help', { align: 'center' }],
  [531, 435, 40, 12, '(закрыта)', 'help', { align: 'center' }],
  [181, 459, 48, 12, 'Инвентарь', 'help', { align: 'center' }],
  [237, 465, 37, 13, 'Меню', 'help', { align: 'center' }],
  [310, 459, 55, 12, 'Предмет в руке', 'help', { align: 'center', fit: 62 }],
  [371, 466, 52, 12, 'Боезапас', 'help', { align: 'center' }],
  [430, 459, 44, 11, 'Персонаж', 'help', { align: 'center' }]
];

const helpEdits = HELP_TEXT.flatMap(([x, y, w, h, text, style, o = {}]) => [
  { clear: o.clear || [x - 3, y - 3, w + 6, h + 6], ink: 'help', grow: o.grow || 2, noise: 0.3 },
  { text, style, box: o.align ? [x, y, w, h] : [x, y, o.fit || 100, h], align: o.align || 'left', fit: o.fit }
]);

const button = (file, rect, text, style) => ({ file, edits: [{ clear: rect }, { text, box: rect, style }] });
const sprite = (file, text) => ({ file, sprite: { text, style: 'mode' } });
const MONTHS = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
const PLACES = ['УБЕЖИЩЕ 13', 'УБЕЖИЩЕ 15', 'ШЕЙДИ-СЭНДС', 'ДЖАНКТАУН', 'НАЛЁТЧИКИ', 'НЕКРОПОЛЬ', 'ХАБ', 'БРАТСТВО', 'ВОЕННАЯ БАЗА', 'СИЯНИЕ', 'БОУНЯРД', 'СОБОР'];
const STATS = ['СИ', 'ВО', 'ВЫ', 'ОБ', 'ИН', 'ЛО', 'УД'];
const STAT_Y = [39, 73, 106, 139, 173, 205, 238];
const statEdits = STAT_Y.flatMap((y, i) => [{ clear: [17, y - 2, 30, 25] }, { text: STATS[i], box: [17, y - 1, 30, 23], style: 'stencil' }]);

const IFACE_EDITS = [
  { clear: [559, 13, 66, 8], fill: 'plate' },
  { text: 'НАВЫКИ', box: [557, 11, 70, 12], style: 'plate' },
  { clear: [475, 25, 33, 12] },
  { text: 'ОЗ', box: [475, 25, 33, 12], style: 'stat' },
  { clear: [475, 62, 33, 12] },
  { text: 'КБ', box: [475, 62, 33, 12], style: 'stat' },
  { clear: [216, 44, 22, 12] },
  { text: 'ИНВ', box: [216, 44, 22, 12], style: 'small' },
  { clear: [531, 42, 31, 12] },
  { text: 'КАРТА', box: [531, 42, 31, 12], style: 'small' },
  { clear: [531, 61, 31, 12] },
  { text: 'ПЕРС', box: [531, 61, 31, 12], style: 'small' },
  { clear: [531, 80, 31, 12] },
  { text: 'ПИП', box: [531, 80, 31, 12], style: 'small' }
];

const moved = (r, dx) => r && [r[0] + dx].concat(r.slice(1));
const shift = (edits, dx) => edits.map(e => Object.assign({}, e, e.clear ? { clear: moved(e.clear, dx) } : {}, e.box ? { box: moved(e.box, dx) } : {}));

const ART = [
  { file: 'IFACE.FRM', edits: IFACE_EDITS },
  { file: 'HR_IFACE_800.FRM', edits: shift(IFACE_EDITS, 160) },
  { file: 'HR_IFACE_SELECT.FRM', edits: [{ clear: [16, 17, 21, 12], fill: 'plate' }] },
  button('MAPDN.FRM', [5, 3, 31, 12], 'КАРТА', 'small'),
  button('MAPUP.FRM', [5, 3, 31, 12], 'КАРТА', 'small'),
  button('INVBUTDN.FRM', [5, 4, 22, 12], 'ИНВ', 'small'),
  button('INVBUTUP.FRM', [5, 4, 22, 12], 'ИНВ', 'small'),
  button('CHADN.FRM', [5, 3, 31, 12], 'ПЕРС', 'small'),
  button('CHAUP.FRM', [5, 3, 31, 12], 'ПЕРС', 'small'),
  button('PIPDN.FRM', [5, 3, 31, 12], 'ПИП', 'small'),
  button('PIPUP.FRM', [5, 3, 31, 12], 'ПИП', 'small'),
  button('ENDTURNU.FRM', [5, 4, 29, 14], 'ХОД', 'small'),
  button('ENDTURND.FRM', [5, 4, 29, 14], 'ХОД', 'small'),
  button('ENDCMBTU.FRM', [5, 4, 29, 14], 'БОЙ', 'small'),
  button('ENDCMBTD.FRM', [5, 4, 29, 14], 'БОЙ', 'small'),
  button('DI_DONE1.FRM', [12, 9, 64, 24], 'ГОТОВО', 'big'),
  button('DI_DONE2.FRM', [11, 8, 64, 24], 'ГОТОВО', 'big'),
  sprite('BURST.FRM', 'ОЧЕРЕДЬ'),
  sprite('KICK.FRM', 'ПИНОК'),
  sprite('PUNCH.FRM', 'УДАР'),
  sprite('SINGLE.FRM', 'ВЫСТРЕЛ'),
  sprite('SWING.FRM', 'ВЗМАХ'),
  sprite('THRUST.FRM', 'ВЫПАД'),
  sprite('THROW.FRM', 'БРОСОК'),
  sprite('UNARMED.FRM', 'БЕЗ ОРУЖИЯ'),
  sprite('MVEPNT.FRM', 'ОД'),
  sprite('RELOAD.FRM', 'ЗАРЯДИТЬ'),
  sprite('USET.FRM', 'ПРИМЕНИТЬ'),
  sprite('USEON.FRM', 'ПРИМЕНИТЬ К'),
  {
    file: 'INVBOX.FRM',
    edits: [
      { clear: [166, 157, 58, 16] },
      { text: 'БРОНЯ', box: [166, 157, 58, 16], style: 'label' },
      { clear: [149, 259, 47, 17] },
      { text: 'ПРЕДМЕТ 1', box: [151, 259, 100, 17], style: 'label', align: 'left' },
      { clear: [293, 259, 51, 17] },
      { text: 'ПРЕДМЕТ 2', box: [242, 259, 100, 17], style: 'label', align: 'right' },
      { clear: [368, 327, 60, 19] },
      { text: 'ГОТОВО', box: [366, 327, 64, 19], style: 'engraved', cap: 12 }
    ]
  },
  button('USE.FRM', [153, 327, 76, 18], 'ОТМЕНА', 'engraved'),
  button('LOOT.FRM', [218, 327, 62, 19], 'ГОТОВО', 'engraved'),
  {
    file: 'BARTER.FRM',
    edits: [
      { clear: [23, 138, 50, 16] },
      { text: 'СДЕЛКА', box: [20, 138, 56, 16], style: 'label' },
      { clear: [568, 137, 41, 18] },
      { text: 'РАЗГОВОР', box: [566, 137, 64, 18], style: 'label', fit: 62 }
    ]
  },
  {
    file: 'ABOUT.FRM',
    edits: [
      { clear: [570, 14, 58, 18] },
      { text: 'ТОРГ', box: [568, 14, 62, 18], style: 'label' },
      { clear: [578, 71, 41, 17] },
      { text: 'РАЗГОВОР', box: [566, 71, 64, 17], style: 'label', fit: 62 }
    ]
  },
  {
    file: 'DI_TALK.FRM',
    edits: [
      { clear: [569, 14, 61, 18] },
      { text: 'ТОРГ', box: [568, 14, 62, 18], style: 'label' },
      { clear: [568, 69, 62, 34] },
      { text: 'СПРОСИТЬ', box: [566, 69, 66, 16], style: 'label', fit: 62 },
      { text: 'О...', box: [566, 86, 66, 16], style: 'label' },
      { clear: [12, 128, 56, 16] },
      { text: 'ИСТОРИЯ', box: [10, 128, 60, 16], style: 'label', fit: 58 }
    ]
  },
  button('CALLED.FRM', [188, 267, 62, 16], 'ОТМЕНА', 'engraved'),
  { file: 'REVIEW.FRM', edits: [{ clear: [508, 402, 68, 32], ink: 'yellow' }, { text: 'ГОТОВО', box: [508, 404, 68, 28], style: 'big', cap: 16, fit: 60 }] },
  {
    file: 'PIP.FRM',
    edits: [
      { clear: [70, 339, 66, 17] },
      { text: 'СОСТОЯНИЕ', box: [72, 339, 95, 17], style: 'label', align: 'left', fit: 92 },
      { clear: [70, 393, 90, 17] },
      { text: 'АВТОКАРТЫ', box: [72, 393, 95, 17], style: 'label', align: 'left', fit: 92 },
      { clear: [71, 420, 82, 16] },
      { text: 'АРХИВЫ', box: [72, 420, 95, 16], style: 'label', align: 'left' },
      { clear: [70, 446, 55, 17] },
      { text: 'ЗАКРЫТЬ', box: [72, 446, 95, 17], style: 'label', align: 'left' }
    ]
  },
  {
    file: 'MONTHS.FRM',
    edits: MONTHS.flatMap((m, i) => [{ clear: [2, 15 * i + 1, 25, 9], fill: 'plate' }, { text: m, box: [0, 15 * i + 1, 29, 9], style: 'month' }])
  },
  {
    file: 'WMAPLABS.FRM',
    edits: PLACES.flatMap((p, i) => [{ clear: [1, 18 * i + 3, 80, 12], fill: 'plate' }, { text: p, box: [1, 18 * i + 3, 80, 11], style: 'place', fit: 78 }])
  },
  {
    file: 'WMAPBOX.FRM',
    edits: [
      { clear: [540, 429, 56, 14] },
      { text: 'ГОРОД', box: [538, 429, 62, 14], style: 'thin' },
      { clear: [539, 448, 60, 14] },
      { text: 'МИР', box: [538, 448, 62, 14], style: 'thin' }
    ]
  },
  { file: 'EDTRCRTE.FRM', edits: statEdits },
  { file: 'EDTREDT.FRM', edits: statEdits },
  {
    file: 'PICKCHAR.FRM',
    edits: [
      { clear: [121, 316, 62, 23] },
      { text: 'ВЗЯТЬ', box: [117, 316, 70, 23], style: 'heading' },
      { clear: [473, 313, 97, 23] },
      { text: 'ИЗМЕНИТЬ', box: [471, 313, 101, 23], style: 'heading', fit: 100 },
      { clear: [60, 348, 510, 38] },
      { text: 'ВЫБОР ПЕРСОНАЖА', box: [58, 348, 514, 38], style: 'title', fit: 510 },
      { clear: [115, 421, 247, 24] },
      { text: 'СОЗДАТЬ ПЕРСОНАЖА', box: [113, 421, 251, 24], style: 'heading', fit: 250 },
      { clear: [495, 419, 67, 23] },
      { text: 'НАЗАД', box: [491, 419, 75, 23], style: 'heading', fit: 74 }
    ]
  },
  {
    file: 'AUTOMAP.FRM',
    edits: [
      { clear: [128, 453, 75, 15] },
      { text: 'СКАНЕР', box: [126, 453, 79, 15], style: 'engraved' },
      { clear: [298, 453, 58, 15] },
      { text: 'ОТМЕНА', box: [296, 453, 62, 15], style: 'engraved' },
      { clear: [478, 326, 18, 15] },
      { text: 'ВЫС', box: [471, 326, 30, 15], style: 'small' }
    ]
  },
  {
    file: 'AUTOUP.FRM',
    edits: [{ clear: [20, 38, 20, 14], ink: 'yellow' }, { text: 'НИЗ', box: [14, 38, 27, 14], style: 'small', align: 'right', under: 24 }]
  },
  {
    file: 'AUTODWN.FRM',
    edits: [{ clear: [20, 38, 20, 14], ink: 'yellow' }, { text: 'НИЗ', box: [14, 38, 27, 14], style: 'small', align: 'right', under: 24 }]
  },
  {
    file: 'MOVEMULT.FRM',
    edits: [
      { clear: [46, 128, 50, 16] },
      { text: 'ГОТОВО', box: [44, 128, 54, 16], style: 'engraved' },
      { clear: [167, 128, 63, 16] },
      { text: 'ОТМЕНА', box: [165, 128, 67, 16], style: 'engraved' }
    ]
  },
  { file: 'HELPSCRN.FRM', pal: 'ART\\INTRFACE\\HELPSCRN.PAL', edits: helpEdits }
];

const LABEL_PAGE = `async spec => {
  await document.fonts.load((spec.weight || '') + ' 100px "' + spec.family + '"');
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 400;
  const x = c.getContext('2d', { willReadFrequently: true });
  const ink = (text, size, sx, spacing) => {
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, c.width, c.height);
    x.font = (spec.weight || '') + ' ' + size + 'px "' + spec.family + '"';
    x.fontStretch = spec.stretch || 'normal';
    x.letterSpacing = spacing + 'px';
    x.fillStyle = '#000';
    x.textBaseline = 'alphabetic';
    x.setTransform(sx, 0, 0, 1, 20, ${BASE_Y});
    x.fillText(text, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) if (d[(y * c.width + xx) * 4 + 3] > 8) {
      x0 = Math.min(x0, xx);
      x1 = Math.max(x1, xx);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    return { d, x0, x1, y0, y1 };
  };
  const ref = ink('H', 100, 1, 0);
  const size = spec.cap * 100 / (ref.y1 - ref.y0 + 1);
  const h = ink('H', size, 1, 0);
  let sx = spec.hWidth ? spec.hWidth / (h.x1 - h.x0 + 1) : 1;
  let g = ink(spec.text, size, sx, (spec.spacing || 0) / sx);
  for (let i = 0; i < 8 && spec.fit && g.x1 - g.x0 + 1 > spec.fit; i++) {
    sx *= spec.fit / (g.x1 - g.x0 + 1);
    g = ink(spec.text, size, sx, (spec.spacing || 0) / sx);
  }
  const top = Math.min(g.y0, ${BASE_Y} - spec.cap);
  const rows = [];
  for (let y = top; y <= g.y1; y++) {
    const row = [];
    for (let xx = g.x0; xx <= g.x1; xx++) row.push(g.d[(y * c.width + xx) * 4 + 3]);
    rows.push(row);
  }
  return { rows, capTop: ${BASE_Y} - spec.cap - top };
}`;

function readFrmBytes(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const offset = 62 + dv.getUint32(34);
  return { w: dv.getUint16(offset), h: dv.getUint16(offset + 2), pixels: offset + 12 };
}

function writeSpriteFrm(orig, img) {
  const out = new Uint8Array(74 + img.w * img.h);
  const dv = new DataView(out.buffer);
  out.set(orig.subarray(0, 34));
  dv.setUint16(8, 1);
  dv.setUint32(58, 12 + img.w * img.h);
  dv.setUint16(62, img.w);
  dv.setUint16(64, img.h);
  dv.setUint32(66, img.w * img.h);
  out.set(img.px, 74);
  return out;
}

function spriteImage(label, style, pal) {
  const rows = label.rows;
  const w = rows[0].length;
  const h = rows.length;
  const px = new Uint8Array(w * h);
  rows.forEach((row, y) => row.forEach((alpha, x) => {
    const a = alpha / 255;
    if (a < 0.3) return;
    const f = 0.45 + 0.55 * a;
    px[y * w + x] = pal.nearest(...style.color.map(c => Math.round(c * f)));
  }));
  return { w, h, px };
}

function makePalette(u8) {
  const pal = FO.readPal(u8);
  const usable = [];
  for (let i = 1; i < FIRST_CYCLING; i++) if (!pal.free.includes(i)) usable.push(i);
  const cache = new Map();
  pal.nearest = (r, g, b) => {
    const key = (r >> 2) << 12 | (g >> 2) << 6 | (b >> 2);
    let best = cache.get(key);
    if (best !== undefined) return best;
    let bestD = Infinity;
    for (const i of usable) {
      const dr = pal.rgb[i * 3] - r;
      const dg = pal.rgb[i * 3 + 1] - g;
      const db = pal.rgb[i * 3 + 2] - b;
      const d = dr * dr * 3 + dg * dg * 4 + db * db * 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    cache.set(key, best);
    return best;
  };
  return pal;
}

function toRgb(img, pal) {
  const rgb = new Float32Array(img.w * img.h * 3);
  for (let i = 0; i < img.w * img.h; i++) {
    const c = img.px[i];
    for (let k = 0; k < 3; k++) rgb[i * 3 + k] = pal.rgb[c * 3 + k];
  }
  return rgb;
}

function random(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

const INK = {
  yellow: (r, g, b) => r > 100 && g > 90 && b < 110 && r - b > 45 && g - b > 35,
  light: (r, g, b) => r + g + b > 420,
  help: (r, g, b) => Math.abs(r - 164) < 28 && Math.abs(g - 132) < 28 && Math.abs(b - 88) < 28
};

function inkMask(img, rgb, rect, kind, grow) {
  const [x0, y0, w, h] = rect;
  const W = img.w;
  const test = INK[kind];
  const hit = new Uint8Array(W * img.h);
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const p = y * W + x;
      if (img.px[p] && test(rgb[p * 3], rgb[p * 3 + 1], rgb[p * 3 + 2])) hit[p] = 1;
    }
  }
  const mask = new Uint8Array(W * img.h);
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      let on = 0;
      for (let dy = -grow; dy <= grow && !on; dy++) {
        for (let dx = -grow; dx <= grow && !on; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < W && yy < img.h && hit[yy * W + xx]) on = 1;
        }
      }
      mask[y * W + x] = on;
    }
  }
  return mask;
}

function clear(img, rgb, dirty, e, seed) {
  const x0 = Math.max(0, e.clear[0]);
  const y0 = Math.max(0, e.clear[1]);
  const w = Math.min(img.w, e.clear[0] + e.clear[2]) - x0;
  const h = Math.min(img.h, e.clear[1] + e.clear[3]) - y0;
  const W = img.w;
  const mask = e.ink ? inkMask(img, rgb, [x0, y0, w, h], e.ink, e.grow === undefined ? 1 : e.grow) : null;
  const masked = (x, y) => x >= x0 && y >= y0 && x < x0 + w && y < y0 + h && (!mask || mask[y * W + x]);
  const inked = q => e.ink && INK[e.ink](rgb[q * 3], rgb[q * 3 + 1], rgb[q * 3 + 2]);
  const all = [];
  const ring = [];
  for (let y = y0 - 2; y < y0 + h + 2; y++) {
    for (let x = x0 - 2; x < x0 + w + 2; x++) {
      if (masked(x, y) || x < 0 || y < 0 || x >= W || y >= img.h) continue;
      const q = y * W + x;
      if (!img.px[q]) continue;
      all.push(q);
      if (!inked(q)) ring.push(q);
    }
  }
  if (ring.length < 8) ring.push(...all);
  if (!ring.length) return;
  const mean = [0, 1, 2].map(k => ring.reduce((s, p) => s + rgb[p * 3 + k], 0) / ring.length);
  const state = new Uint8Array(W * img.h);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (masked(x, y)) state[y * W + x] = 1;
  const usable = q => state[q] === 2 || (!state[q] && img.px[q] && !inked(q));
  for (;;) {
    const next = [];
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const p = y * W + x;
        if (state[p] !== 1) continue;
        let n = 0;
        const sum = [0, 0, 0];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            const yy = y + dy;
            if ((!dx && !dy) || xx < 0 || yy < 0 || xx >= W || yy >= img.h) continue;
            const q = yy * W + xx;
            if (!usable(q)) continue;
            const wt = dx && dy ? 0.7 : 1;
            for (let k = 0; k < 3; k++) sum[k] += rgb[q * 3 + k] * wt;
            n += wt;
          }
        }
        if (n) next.push([p, sum.map(v => v / n)]);
      }
    }
    if (!next.length) break;
    for (const [p, c] of next) {
      for (let k = 0; k < 3; k++) rgb[p * 3 + k] = c[k];
      state[p] = 2;
    }
  }
  const rnd = random(seed);
  const flat = e.fill === 'plate';
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (!masked(x, y)) continue;
      const p = y * W + x;
      if (state[p] === 1) for (let k = 0; k < 3; k++) rgb[p * 3 + k] = mean[k];
      const s = ring[(rnd() * ring.length) | 0];
      for (let k = 0; k < 3; k++) {
        const base = flat ? (mean[k] + rgb[p * 3 + k]) / 2 : rgb[p * 3 + k];
        rgb[p * 3 + k] = base + (rgb[s * 3 + k] - mean[k]) * (e.noise === undefined ? 0.8 : e.noise);
      }
      dirty[p] = 1;
    }
  }
}

function worn(x, y, amount) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296 < amount;
}

function drawLabel(img, rgb, dirty, label, e, under) {
  const st = { ...STYLES[e.style], ...e };
  const rows = label.rows;
  const lw = rows[0].length;
  const [bx, by, bw, bh] = e.box;
  const align = st.align || 'center';
  const ox = align === 'left' ? bx : align === 'right' ? bx + bw - lw : bx + Math.round((bw - lw) / 2);
  const oy = by + Math.round((bh - st.cap) / 2) - label.capTop + (st.dy || 0);
  const W = img.w;
  const put = (dx, dy, fn) => {
    rows.forEach((row, y) => row.forEach((alpha, x) => {
      if (!alpha) return;
      const tx = ox + x + dx;
      const ty = oy + y + dy;
      if (tx < 0 || ty < 0 || tx >= W || ty >= img.h || !img.px[ty * W + tx]) return;
      const p = ty * W + tx;
      if (st.under && under[p] < st.under) return;
      const a = st.solid ? (alpha >= 110 ? 1 : 0) : Math.pow(alpha / 255, st.gamma || 1);
      if (a) fn(p, a, tx, ty);
      dirty[p] = 1;
    }));
  };
  const off = st.shadowOffset || 1;
  const dark = st.shadowDark || SHADOW;
  if (st.shadow !== false) for (let d = 1; d <= off; d++) put(d, d, (p, a) => { for (let k = 0; k < 3; k++) rgb[p * 3 + k] *= 1 - dark * a; });
  const c = st.color;
  put(0, 0, (p, a, x, y) => {
    const fade = st.wear && worn(x, y, st.wear) ? 0.55 : 1;
    for (let k = 0; k < 3; k++) {
      const ink = c[k] * fade;
      rgb[p * 3 + k] = st.blend === 'alpha' ? rgb[p * 3 + k] * (1 - a) + ink * a : ink * a;
    }
  });
}

function labelSpec(e) {
  const st = { ...STYLES[e.style], ...e };
  return { text: e.text, family: st.family, weight: st.weight, stretch: st.stretch || '', cap: st.cap, hWidth: st.hWidth || 0, spacing: st.spacing, fit: st.fit || 0 };
}

function labelKey(e) {
  return JSON.stringify(labelSpec(e));
}

function apply(img, pal, labels, edits, seed) {
  const rgb = toRgb(img, pal);
  const under = new Uint8Array(img.w * img.h);
  for (let p = 0; p < under.length; p++) under[p] = Math.round((rgb[p * 3] + rgb[p * 3 + 1] + rgb[p * 3 + 2]) / 3);
  const dirty = new Uint8Array(img.w * img.h);
  edits.forEach((e, i) => {
    if (e.clear) clear(img, rgb, dirty, e, seed + i * 7919);
    if (e.text) drawLabel(img, rgb, dirty, labels[labelKey(e)], e, under);
  });
  const out = new Uint8Array(img.px);
  for (let p = 0; p < out.length; p++) {
    if (!dirty[p] || !img.px[p]) continue;
    const v = k => Math.max(0, Math.min(255, Math.round(rgb[p * 3 + k])));
    out[p] = pal.nearest(v(0), v(1), v(2));
  }
  return out;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ -1) >>> 0;
}

function png(w, h, rgb) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function preview(file, img, before, after, pal, scale) {
  const W = img.w * scale;
  const H = img.h * scale * 2 + 4;
  const rgb = Buffer.alloc(W * H * 3, 0);
  [before, after].forEach((px, n) => {
    for (let y = 0; y < img.h * scale; y++) {
      for (let x = 0; x < W; x++) {
        const c = px[((y / scale) | 0) * img.w + ((x / scale) | 0)];
        const o = ((y + n * (img.h * scale + 4)) * W + x) * 3;
        if (!c) {
          rgb[o] = 255;
          rgb[o + 2] = 255;
          continue;
        }
        for (let k = 0; k < 3; k++) rgb[o + k] = pal.rgb[c * 3 + k];
      }
    }
  });
  fs.writeFileSync(file, png(W, H, rgb));
}

async function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf('--preview');
  const previewDir = at >= 0 ? args.splice(at, 2)[1] : null;
  const only = new Set(args.map(a => a.toUpperCase()));
  const items = ART.filter(item => !only.size || only.has(item.file));
  const specs = {};
  for (const item of items) for (const e of item.sprite ? [item.sprite] : item.edits) if (e.text) specs[labelKey(e)] = labelSpec(e);
  const labels = await rasterize(specs, LABEL_PAGE);
  const data = await FO.Data.open(FO.nodeSource(GAME), FO.LOOSE);
  const palettes = new Map();
  for (const item of items) {
    const key = 'ART\\INTRFACE\\' + item.file;
    const palName = item.pal || 'COLOR.PAL';
    if (!palettes.has(palName)) palettes.set(palName, makePalette(await data.get(palName)));
    const pal = palettes.get(palName);
    const bytes = new Uint8Array(await data.get(key));
    const frm = readFrmBytes(bytes);
    const img = { w: frm.w, h: frm.h, px: bytes.slice(frm.pixels, frm.pixels + frm.w * frm.h) };
    let out;
    let shown;
    if (item.sprite) {
      shown = spriteImage(labels[labelKey(item.sprite)], { ...STYLES[item.sprite.style], ...item.sprite }, pal);
      out = writeSpriteFrm(bytes, shown);
    } else {
      const px = apply(img, pal, labels, item.edits, 1 + ART.indexOf(item) * 104729);
      out = new Uint8Array(bytes);
      out.set(px, frm.pixels);
      shown = { ...img, px };
    }
    const dest = path.join(RU, 'ART', 'INTRFACE', item.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, out);
    if (previewDir) {
      fs.mkdirSync(previewDir, { recursive: true });
      const file = path.join(previewDir, item.file.replace(/\.FRM$/i, '.png'));
      if (item.sprite) preview(file, shown, shown.px, shown.px, pal, 4);
      else preview(file, img, img.px, shown.px, pal, item.scale || 2);
    }
    console.log('wrote', path.relative(ROOT, dest));
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
