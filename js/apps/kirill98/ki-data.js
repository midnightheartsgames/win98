(function (K) {
  'use strict';

  const SKIN = [[0.95, 0.82, 0.7], [0.9, 0.75, 0.62], [0.84, 0.68, 0.54], [0.74, 0.56, 0.42], [0.92, 0.8, 0.72]];
  const HAIR = [[0.3, 0.22, 0.15], [0.5, 0.36, 0.22], [0.17, 0.14, 0.11], [0.62, 0.5, 0.32], [0.55, 0.53, 0.5]];

  const SIDES = Object.freeze({
    elf: {
      name: { m: 'Эльф', f: 'Эльфийка' }, race: 'elf', figures: ['m', 'f'],
      skin: [[0.93, 0.8, 0.68], [0.88, 0.72, 0.6], [0.8, 0.64, 0.5]],
      hair: [[0.85, 0.75, 0.5], [0.55, 0.38, 0.22], [0.2, 0.16, 0.12], [0.7, 0.7, 0.66]],
      main: [[0.36, 0.27, 0.17], [0.3, 0.32, 0.18], [0.4, 0.31, 0.2]],
      accent: [[0.26, 0.36, 0.22], [0.33, 0.38, 0.27], [0.24, 0.3, 0.25]],
      metal: [[0.5, 0.5, 0.48]],
      styles: { m: ['long', 'tail', 'crop'], f: ['long', 'braid', 'bun'] },
      heads: [['hood', 0.7], [null, 0.3]],
      beard: 0, armor: [], pros: []
    },
    guard: {
      name: { m: 'Стражник', f: 'Стражница' }, race: 'human', figures: ['m', 'f'],
      skin: SKIN, hair: HAIR,
      main: [[0.92, 0.91, 0.86], [0.88, 0.87, 0.82], [0.9, 0.88, 0.84]],
      accent: [[0.68, 0.12, 0.1], [0.62, 0.1, 0.09]],
      metal: [[0.72, 0.73, 0.74], [0.68, 0.69, 0.7]],
      styles: { m: ['crop', 'short'], f: ['bun', 'braid'] },
      heads: [['crest', 1]],
      beard: 0.35, armor: [['collar', 0.3]], pros: []
    },
    villain: {
      name: { m: 'Солдат Злого' }, race: 'human', figures: ['m'],
      skin: [[0.9, 0.8, 0.72], [0.84, 0.7, 0.58], [0.76, 0.6, 0.47], [0.68, 0.52, 0.4]],
      hair: [[0.16, 0.13, 0.1], [0.32, 0.26, 0.2], [0.5, 0.48, 0.45], [0.25, 0.18, 0.12]],
      main: [[0.2, 0.19, 0.18], [0.25, 0.22, 0.2], [0.17, 0.17, 0.19], [0.28, 0.2, 0.16]],
      accent: [[0.32, 0.24, 0.18], [0.22, 0.22, 0.24], [0.35, 0.3, 0.25]],
      metal: [[0.33, 0.33, 0.34], [0.38, 0.36, 0.33], [0.28, 0.28, 0.3]],
      styles: { m: ['crop', 'short', 'long', 'bald'] },
      heads: [['nasal', 0.35], ['closed', 0.3], [null, 0.35]],
      beard: 0.55, armor: [['mail', 0.4], ['plate', 0.3], ['bracers', 0.4], ['greaves', 0.3], ['collar', 0.25]],
      pros: [['fore', 'iron', 0.3], ['shin', 'iron', 0.2], ['shin', 'peg', 0.08]]
    },
    straw: {
      name: { m: 'Чучело' }, race: 'human', figures: ['m'],
      skin: [[0.78, 0.74, 0.6]], hair: [[0.7, 0.66, 0.5]], main: [[0.55, 0.5, 0.42]], accent: [[0.4, 0.32, 0.22]], metal: [[0.5, 0.5, 0.48]],
      styles: { m: ['bald'] }, heads: [[null, 1]], beard: 0, armor: [], pros: []
    },
    watch: {
      name: { m: 'Городской стражник', f: 'Городская стражница' }, race: 'human', figures: ['m', 'f'], look: 'town',
      skin: SKIN, hair: HAIR,
      main: [[0.24, 0.3, 0.46]], accent: [[0.72, 0.6, 0.3]], metal: [[0.6, 0.6, 0.62]],
      styles: { m: ['short', 'crop'], f: ['braid', 'bun'] },
      heads: [['crest', 1]], beard: 0.4, armor: [['mail', 0.8]], pros: [['fore', 'hook', 0.06], ['shin', 'peg', 0.06]]
    },
    town: {
      name: { m: 'Горожанин', f: 'Горожанка' }, race: 'human', figures: ['m', 'f'],
      skin: SKIN, hair: HAIR,
      main: [[0.86, 0.82, 0.72], [0.55, 0.62, 0.72], [0.62, 0.3, 0.25], [0.55, 0.6, 0.5]],
      accent: [[0.35, 0.3, 0.26], [0.3, 0.32, 0.4], [0.5, 0.25, 0.22], [0.42, 0.4, 0.3]],
      metal: [[0.5, 0.5, 0.48]],
      styles: { m: ['short', 'crop', 'long'], f: ['braid', 'bun', 'long'] },
      heads: { m: [['cap', 0.5], [null, 0.5]], f: [['kerchief', 0.7], [null, 0.3]] },
      beard: 0.45, armor: [], pros: []
    }
  });

  const ITEMS = Object.freeze({
    helmCrest: { name: 'Шлем с гребнем', kind: 'armor', helm: 'open' },
    helmNasal: { name: 'Шлем с наносником', kind: 'armor', helm: 'nasal' },
    helmClosed: { name: 'Закрытый шлем', kind: 'armor', helm: 'closed' },
    mail: { name: 'Кольчуга', kind: 'armor' },
    plate: { name: 'Латы', kind: 'armor' },
    bracers: { name: 'Наручи', kind: 'armor' },
    greaves: { name: 'Поножи', kind: 'armor' },
    collar: { name: 'Кольчужный ворот', kind: 'armor' },
    ironArm: { name: 'Железная рука', kind: 'prosthesis', part: 'fore' },
    ironLeg: { name: 'Железная нога', kind: 'prosthesis', part: 'shin' },
    peg: { name: 'Деревяшка', kind: 'prosthesis', part: 'shin' },
    hook: { name: 'Крюк', kind: 'prosthesis', part: 'fore' },
    carvedArm: { name: 'Резная рука', kind: 'prosthesis', part: 'fore' },
    hingeArm: { name: 'Шарнирная рука', kind: 'prosthesis', part: 'fore' },
    willowLeg: { name: 'Ивовая нога', kind: 'prosthesis', part: 'shin' },
    hingeLeg: { name: 'Шарнирная нога', kind: 'prosthesis', part: 'shin' },
    patch: { name: 'Повязка на глаз', kind: 'prosthesis', part: 'eye' },
    glassEye: { name: 'Стеклянный глаз', kind: 'prosthesis', part: 'eye' },
    resinEye: { name: 'Смоляной глаз', kind: 'prosthesis', part: 'eye' },
    rubyEye: { name: 'Рубиновый глаз', kind: 'prosthesis', part: 'eye' },
    crutch: { name: 'Костыль', kind: 'aid' },
    wheelchair: { name: 'Коляска', kind: 'aid' },
    stakes: { name: 'Колья для ямы', kind: 'goods' },
    snare: { name: 'Петля', kind: 'goods' },
    plans: { name: 'Планы штурма Злого', kind: 'quest' },
    gramota: { name: 'Казённая грамота', kind: 'quest' },
    rope: { name: 'Верёвка с крюком', kind: 'goods' },
    wallMap: { name: 'Чертёж стен дворца', kind: 'quest' },
    silver: { name: 'Серебро', kind: 'money' },
    bandage: { name: 'Бинт', kind: 'goods' },
    bread: { name: 'Хлеб', kind: 'goods' },
    flint: { name: 'Огниво', kind: 'goods' },
    herbs: { name: 'Травы', kind: 'goods' },
    tincture: { name: 'Настойка', kind: 'goods' },
    whetstone: { name: 'Точило', kind: 'goods' },
    knife: { name: 'Нож', kind: 'weapon' },
    sickle: { name: 'Серп', kind: 'weapon' },
    sword: { name: 'Меч', kind: 'weapon' },
    axe: { name: 'Топор', kind: 'weapon' },
    mace: { name: 'Булава', kind: 'weapon' },
    spear: { name: 'Копьё', kind: 'weapon' },
    bardiche: { name: 'Бердыш', kind: 'weapon' },
    shield: { name: 'Щит', kind: 'armor' },
    bow: { name: 'Лук', kind: 'ranged' },
    crossbow: { name: 'Арбалет', kind: 'ranged' },
    throwingAxe: { name: 'Метательный топорик', kind: 'ranged' },
    javelin: { name: 'Сулица', kind: 'ranged' },
    arrow: { name: 'Стрела', kind: 'ammo' },
    bolt: { name: 'Болт', kind: 'ammo' },
    torch: { name: 'Факел', kind: 'aid' },
    wolfHide: { name: 'Волчья шкура', kind: 'hide', cost: 15 },
    bearHide: { name: 'Медвежья шкура', kind: 'hide', cost: 60 },
    boarHide: { name: 'Кабанья шкура', kind: 'hide', cost: 20 },
    deerHide: { name: 'Оленья шкура', kind: 'hide', cost: 25 },
    hareFur: { name: 'Заячья шкурка', kind: 'hide', cost: 5 },
    foxFur: { name: 'Лисья шкурка', kind: 'hide', cost: 8 },
    goatHide: { name: 'Козья шкура', kind: 'hide', cost: 12 },
    meat: { name: 'Мясо', kind: 'food', cost: 3 },
    bearFat: { name: 'Медвежий жир', kind: 'goods', cost: 10 },
    baleBread: { name: 'Мешок хлеба', kind: 'cargo', kg: 20 },
    baleGrain: { name: 'Мешок крупы', kind: 'cargo', kg: 30 },
    baleCloth: { name: 'Тюк сукна', kind: 'cargo', kg: 25 },
    baleWine: { name: 'Бочонок вина', kind: 'cargo', kg: 35 },
    baleMedicine: { name: 'Ящик лекарств', kind: 'cargo', kg: 15 },
    baleOre: { name: 'Короб руды', kind: 'cargo', kg: 40 },
    baleIron: { name: 'Связка железа', kind: 'cargo', kg: 30 },
    bells: { name: 'Бубенцы', kind: 'trophy' }
  });

  const WEAPONS = Object.freeze({
    knife: { hands: 1, chop: 12, stab: 20, crush: 0, cut: 22, cuts: [], eye: true, reach: 0.8, grip: 0.5, head: 0.2, wind: [0.16, 0.38], swing: 0.15, thrust: 0.13, recover: 0.2, cost: 5, speed: 'очень быстрый' },
    sickle: { hands: 1, chop: 21, stab: 0, crush: 0, cut: 40, cuts: ['fore'], eye: false, reach: 1.0, grip: 0.5, head: 0.3, wind: [0.21, 0.51], swing: 0.19, thrust: 0.16, recover: 0.26, cost: 9, speed: 'быстрый' },
    sword: { hands: 1, chop: 21, stab: 18, crush: 0, cut: 42, cuts: ['fore', 'arm'], eye: true, reach: 1.2, grip: 0.5, head: 0.62, wind: [0.21, 0.51], swing: 0.23, thrust: 0.18, recover: 0.3, cost: 11, speed: 'быстрый' },
    axe: { hands: 1, chop: 33, stab: 0, crush: 0, cut: 60, cuts: ['fore', 'arm', 'shin', 'thigh'], eye: false, reach: 1.1, grip: 0.5, head: 0.16, wind: [0.25, 0.6], swing: 0.24, thrust: 0.2, recover: 0.36, cost: 13, speed: 'средний' },
    mace: { hands: 1, chop: 0, stab: 0, crush: 40, cut: 0, cuts: [], eye: false, reach: 1.0, grip: 0.5, head: 0.14, wind: [0.24, 0.58], swing: 0.24, thrust: 0.2, recover: 0.36, cost: 13, speed: 'средний' },
    spear: { hands: 2, chop: 0, stab: 30, crush: 10, cut: 0, cuts: [], eye: true, reach: 2.2, grip: 0.45, head: 0.28, wind: [0.25, 0.6], swing: 0.26, thrust: 0.22, recover: 0.36, cost: 12, speed: 'средний' },
    bardiche: { hands: 2, chop: 43, stab: 0, crush: 0, cut: 88, cuts: ['fore', 'arm', 'shin', 'thigh', 'neck'], eye: false, reach: 1.8, grip: 0.45, head: 0.55, wind: [0.34, 0.81], swing: 0.32, thrust: 0.24, recover: 0.48, cost: 20, speed: 'медленный' }
  });

  const SHOTS = Object.freeze({
    arrow: { hands: 2, chop: 0, stab: 30, crush: 4, cut: 0, cuts: [], eye: true, plate: 0.35, cost: 0 },
    bolt: { hands: 1, chop: 0, stab: 46, crush: 6, cut: 0, cuts: [], eye: true, plate: 1.6, cost: 0 },
    taxe: { hands: 1, chop: 26, stab: 0, crush: 12, cut: 42, cuts: ['fore', 'shin'], eye: false, plate: 1, cost: 0 },
    javelin: { hands: 1, chop: 0, stab: 34, crush: 6, cut: 0, cuts: [], eye: true, plate: 0.6, cost: 0 }
  });

  const BITES = Object.freeze({
    wolfBite: { hands: 1, chop: 0, stab: 0, crush: 3, bite: 10, cut: 0, cuts: [], eye: false, plate: 0.3, cost: 0 },
    dogBite: { hands: 1, chop: 0, stab: 0, crush: 2, bite: 10, cut: 0, cuts: [], eye: false, plate: 0.3, cost: 0 },
    foxBite: { hands: 1, chop: 0, stab: 0, crush: 1, bite: 4, cut: 0, cuts: [], eye: false, plate: 0.2, cost: 0 },
    bearPaw: { hands: 1, chop: 30, stab: 0, crush: 40, bite: 0, cut: 42, cuts: ['fore'], eye: false, plate: 0.8, cost: 0 },
    bearBite: { hands: 1, chop: 0, stab: 0, crush: 8, bite: 24, cut: 0, cuts: [], eye: false, plate: 0.5, cost: 0 },
    boarTusk: { hands: 1, chop: 0, stab: 26, crush: 6, bite: 0, cut: 0, cuts: [], eye: false, plate: 0.6, cost: 0 },
    antler: { hands: 1, chop: 0, stab: 16, crush: 8, bite: 0, cut: 0, cuts: [], eye: false, plate: 0.5, cost: 0 },
    hoof: { hands: 1, chop: 0, stab: 0, crush: 30, bite: 0, cut: 0, cuts: [], eye: false, plate: 0.9, cost: 0 },
    horn: { hands: 1, chop: 0, stab: 22, crush: 10, bite: 0, cut: 0, cuts: [], eye: false, plate: 0.6, cost: 0 },
    butt: { hands: 1, chop: 0, stab: 0, crush: 10, bite: 0, cut: 0, cuts: [], eye: false, plate: 0.9, cost: 0 }
  });

  const MISSILES = Object.freeze({
    arrow: { ammo: 'arrow', speed: [24, 56], ref: 50, len: 0.75, drag: 0.0028, spread: 0.0045, stick: true },
    bolt: { ammo: 'bolt', speed: [72, 72], ref: 70, len: 0.38, drag: 0.0022, spread: 0.0028, stick: true },
    taxe: { ammo: 'throwingAxe', speed: [11, 19], ref: 17, len: 0.45, drag: 0.004, spread: 0.012, spin: 13.8, stick: false },
    javelin: { ammo: 'javelin', speed: [15, 26], ref: 23, len: 1.4, drag: 0.003, spread: 0.008, stick: false }
  });

  const LAUNCHERS = Object.freeze({
    bow: { item: 'bow', missile: 'arrow', draw: 1.0, elf: 0.7, hands: 2, cost: 8, range: 40 },
    crossbow: { item: 'crossbow', missile: 'bolt', draw: 0, reload: 3, hands: 1, cost: 2, range: 60 },
    taxe: { item: 'throwingAxe', missile: 'taxe', draw: 0.5, hands: 1, cost: 13, range: 12 },
    javelin: { item: 'javelin', missile: 'javelin', draw: 0.6, hands: 1, cost: 12, range: 25 }
  });

  const RANGED = Object.freeze({
    elf: [['bow', 0.85, 'arrow', 12, 24], ['javelin', 0.3, 'javelin', 2, 2]],
    guard: [['crossbow', 0.45, 'bolt', 8, 14], ['javelin', 0.35, 'javelin', 2, 2]],
    villain: [['bow', 0.3, 'arrow', 10, 20], ['crossbow', 0.3, 'bolt', 6, 12], ['taxe', 0.5, 'throwingAxe', 3, 3]],
    town: []
  });

  const HERO_RANGED = Object.freeze({
    elf: [['bow', 1], ['arrow', 24], ['javelin', 2]],
    guard: [['crossbow', 1], ['bolt', 14], ['javelin', 2]],
    villain: [['bow', 1], ['arrow', 20], ['throwingAxe', 3]]
  });

  const LOADOUTS = Object.freeze({
    elf: [['sickle', 0, 0.55], ['knife', 0, 0.45]],
    guard: [['sword', 0.7, 0.4], ['spear', 0.4, 0.3], ['bardiche', 0, 0.3]],
    villain: [['axe', 0.3, 0.4], ['mace', 0.3, 0.35], ['spear', 0.2, 0.25]],
    town: [['knife', 0, 0.45], [null, 0, 0.55]],
    watch: [['spear', 0.5, 0.55], ['sword', 0.8, 0.45]]
  });

  const EXP = Object.freeze({
    recruit: { name: 'новобранец', react: 0.42, acc: 0.6, parry: 0.05, strength: 0.9, aggr: 0.45 },
    soldier: { name: 'солдат', react: 0.28, acc: 0.78, parry: 0.25, strength: 1, aggr: 0.55 },
    veteran: { name: 'ветеран', react: 0.18, acc: 0.9, parry: 0.5, strength: 1.1, aggr: 0.65 }
  });

  const ARMOR = Object.freeze({
    helm: Object.freeze({ crest: 0.7, nasal: 0.6, closed: 0.5 }),
    body: Object.freeze({ mail: 0.7, plate: 0.5 }),
    stamina: Object.freeze({ mail: 0.9, plate: 0.75 }),
    guard: Object.freeze({ bracers: 15, greaves: 15, collar: 20 })
  });

  const CUT = Object.freeze({ fore: 30, arm: 45, shin: 35, thigh: 50, neck: 60 });
  const PART_DAMAGE = Object.freeze([1.5, 1, 1, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6]);

  const HELMS = Object.freeze({ crest: 'helmCrest', nasal: 'helmNasal', closed: 'helmClosed' });
  const PROS = Object.freeze({ 'fore.iron': 'ironArm', 'fore.hook': 'hook', 'fore.carved': 'carvedArm', 'fore.hinge': 'hingeArm', 'shin.iron': 'ironLeg', 'shin.peg': 'peg', 'shin.willow': 'willowLeg', 'shin.hinge': 'hingeLeg', 'eye.patch': 'patch', 'eye.glass': 'glassEye', 'eye.resin': 'resinEye', 'eye.ruby': 'rubyEye' });

  const SACKS = Object.freeze({
    elf: [['silver', 0, 6], ['bandage', 0, 2], ['herbs', 0, 2], ['bread', 0, 1], ['flint', 0, 1]],
    guard: [['silver', 5, 20], ['bandage', 1, 1], ['bread', 0, 1], ['whetstone', 0, 1], ['knife', 0, 1]],
    villain: [['silver', 2, 12], ['bandage', 0, 1], ['whetstone', 0, 1], ['flint', 0, 1], ['knife', 0, 1]],
    town: [['silver', 1, 15], ['bread', 0, 1], ['flint', 0, 1]],
    watch: [['silver', 3, 10], ['bandage', 1, 1], ['bread', 0, 1]],
    straw: []
  });

  const NAMES = Object.freeze({
    guard: { m: ['Тихон', 'Афоня', 'Кузьма', 'Лука', 'Никифор', 'Савелий', 'Игнат', 'Демид', 'Ермолай', 'Пантелей', 'Осип', 'Вавила', 'Евсей', 'Захар', 'Мартын', 'Нестор'], f: ['Агафья', 'Марфа', 'Устинья', 'Пелагея', 'Василиса', 'Ульяна', 'Фёкла', 'Акулина'] },
    elf: { m: ['Вереск', 'Терн', 'Тис', 'Клён', 'Хмель', 'Камыш', 'Явор', 'Граб', 'Дрок', 'Бук', 'Остролист'], f: ['Ива', 'Калина', 'Липа', 'Осока', 'Черёмуха', 'Верба', 'Мята', 'Брусника', 'Купава'] },
    villain: { m: ['Шрам', 'Косой', 'Бугай', 'Клык', 'Гвоздь', 'Чекан', 'Ржавый', 'Кирпич', 'Обух', 'Лом', 'Жбан', 'Хрящ', 'Кремень'] },
    town: { m: ['Ефим', 'Мирон', 'Остап', 'Харитон', 'Степан', 'Влас'], f: ['Дарья', 'Матрёна', 'Аксинья', 'Прасковья'] },
    watch: { m: ['Трофим', 'Елисей', 'Анисим', 'Ферапонт', 'Кондрат', 'Мокий', 'Зосима', 'Гурий', 'Лаврентий'], f: ['Евдокия', 'Феврония', 'Агния'] }
  });

  const ENEMIES = Object.freeze({ elf: ['guard', 'villain'], guard: ['elf', 'villain'], villain: ['elf', 'guard'], town: [], watch: [] });

  const STANDING = Object.freeze({
    elf: { stat: 'respect', name: 'уважение деревни', command: 30, most: 4, rescue: 60 },
    guard: { stat: 'service', name: 'служба', command: 14, most: 10, rescue: 10 },
    villain: { stat: 'loyalty', name: 'верность войска', command: 0, most: 30, rescue: 60 }
  });

  const COMMANDS = Object.freeze([
    { id: 'follow', name: 'За мной' }, { id: 'hold', name: 'Стоять здесь' }, { id: 'line', name: 'Строй' },
    { id: 'attack', name: 'Атаковать мою цель' }, { id: 'retreat', name: 'Отход' }, { id: 'fire', name: 'Стрелять по готовности' }
  ]);

  const DIFFICULTY = Object.freeze({
    easy: Object.freeze({ name: 'Лёгкая', heavy: 60, harm: 0.75, ko: 30 }),
    normal: Object.freeze({ name: 'Обычная', heavy: 45, harm: 1, ko: 20 }),
    hard: Object.freeze({ name: 'Тяжёлая', heavy: 30, harm: 1.25, ko: 10 })
  });

  K.Data = { DIFFICULTY, SIDES, ITEMS, HELMS, PROS, SACKS, WEAPONS, SHOTS, MISSILES, LAUNCHERS, RANGED, HERO_RANGED, LOADOUTS, EXP, ARMOR, CUT, PART_DAMAGE, NAMES, ENEMIES, STANDING, COMMANDS, BITES };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
