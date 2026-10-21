(function (K) {
  'use strict';

  const FACTIONS = {
    emp: { id: 'emp', name: 'Империя', short: 'Дворец', color: '#c83030', member: 'охрана дворца' },
    elf: { id: 'elf', name: 'Лесные эльфы', short: 'Эльфы', color: '#3c9a3c', member: 'лесной эльф' },
    evil: { id: 'evil', name: 'Войско Злого', short: 'Злой', color: '#6a5a8a', member: 'войско Злого' },
    folk: { id: 'folk', name: 'Развилки', short: 'Люди', color: '#c8a050', member: 'горожанин' },
    wild: { id: 'wild', name: 'Звери', short: 'Звери', color: '#808080', member: 'зверь' }
  };

  const RELATIONS = {
    emp: { emp: 100, elf: -100, evil: -100, folk: 20, wild: -100 },
    elf: { emp: -100, elf: 100, evil: -100, folk: 10, wild: -100 },
    evil: { emp: -100, elf: -100, evil: 100, folk: 0, wild: -100 },
    folk: { emp: 20, elf: 10, evil: 0, folk: 100, wild: -100 },
    wild: { emp: -100, elf: -100, evil: -100, folk: -100, wild: 100 }
  };

  const W = (o) => Object.assign({ type: 'weapon', hand: 1, cut: 0, reach: 1.5, time: 0.7, len: 0.8 }, o);
  const A = (o) => Object.assign({ type: 'armor', ar: 1 }, o);
  const P = (o) => Object.assign({ type: 'pros' }, o);
  const ITEMS = {
    fists: W({ name: 'Кулаки', kind: 'swing', dmg: 4, time: 0.45, reach: 0.9, cut: 0, len: 0, price: 0, look: 'none', hidden: true }),
    hook_hit: W({ name: 'Крюк', kind: 'swing', dmg: 6, time: 0.55, reach: 1.0, cut: 0.4, len: 0, price: 0, look: 'none', hidden: true }),
    knife: W({ name: 'Нож', kind: 'thrust', dmg: 9, time: 0.45, reach: 1.2, cut: 0.4, len: 0.3, price: 20, look: 'knife', desc: 'Короткий и быстрый. Удобно колоть в глаз.' }),
    elfblade: W({ name: 'Эльфийский клинок', kind: 'swing', dmg: 13, time: 0.55, reach: 1.5, cut: 0.7, len: 0.75, price: 140, look: 'elfblade', desc: 'Лёгкий изогнутый клинок из Листвы.' }),
    sword: W({ name: 'Меч', kind: 'swing', dmg: 16, time: 0.7, reach: 1.7, cut: 0.8, len: 0.9, price: 120, look: 'sword', desc: 'Казённый меч дворцовой стражи.' }),
    axe: W({ name: 'Топор', kind: 'swing', dmg: 21, time: 0.9, reach: 1.6, cut: 1.2, len: 0.75, price: 90, look: 'axe', desc: 'Рубит дрова и руки одинаково хорошо.' }),
    greataxe: W({ name: 'Секира', kind: 'chop', hand: 2, dmg: 32, time: 1.25, reach: 2.0, cut: 1.6, len: 1.25, price: 260, look: 'greataxe', desc: 'Двуручная секира. Со щитом её не удержать.' }),
    spear: W({ name: 'Копьё', kind: 'thrust', hand: 2, dmg: 18, time: 0.8, reach: 2.6, cut: 0.25, len: 2.0, price: 70, look: 'spear', desc: 'Длинное. Держит врага на расстоянии.' }),
    mace: W({ name: 'Булава', kind: 'chop', dmg: 19, time: 0.85, reach: 1.5, cut: 0, len: 0.7, price: 100, look: 'mace', desc: 'Не рубит, зато ломает кости через любой шлем.' }),
    bow: W({ name: 'Лук', kind: 'bow', dmg: 18, time: 0.5, reach: 60, len: 1.3, price: 110, look: 'bow', desc: 'Тяните подольше: стрела полетит дальше и ударит сильнее.' }),
    elfbow: W({ name: 'Эльфийский лук', kind: 'bow', dmg: 22, time: 0.45, reach: 70, len: 1.4, price: 240, look: 'elfbow', desc: 'Тугой лук из тиса. Стрела почти не падает.' }),
    xbow: W({ name: 'Арбалет', kind: 'xbow', dmg: 30, time: 2.2, reach: 70, len: 0.8, price: 200, look: 'xbow', desc: 'Перезарядка долгая, удар страшный.' }),
    arrows: { type: 'ammo', name: 'Стрелы', price: 1, stack: true, desc: 'Подходят и к луку, и к арбалету.' },
    shield: { type: 'shield', name: 'Щит', block: 0.8, ar: 2, price: 60, look: 'shield', color: 0xa02828, desc: 'Круглый щит с гербом дворца.' },
    woodshield: { type: 'shield', name: 'Деревянный щит', block: 0.7, ar: 1, price: 30, look: 'shield', color: 0x8a6438, desc: 'Простой, из досок.' },
    blackshield: { type: 'shield', name: 'Чёрный щит', block: 0.8, ar: 2, price: 70, look: 'shield', color: 0x2a2630, desc: 'Щит войска Злого.' },
    torch: { type: 'torch', name: 'Факел', price: 3, stack: true, desc: 'Светит ночью. Подносите к деревянному дому, чтобы поджечь.' },
    hood: A({ slot: 'head', name: 'Капюшон', ar: 0, price: 25, look: 'hood', color: 0x4a5a3a, hood: true, desc: 'Прячет уши и лицо. В чужой зоне вас примут за прохожего, если не бегать с оружием.' }),
    cap: A({ slot: 'head', name: 'Шапка', ar: 0, price: 8, look: 'cap', color: 0x6a4a2a, desc: 'Тёплая.' }),
    helmet: A({ slot: 'head', name: 'Шлем', ar: 3, price: 80, look: 'helmet', color: 0xa8a8b0, desc: 'Стальной шлем с красным пером.' }),
    blackhelm: A({ slot: 'head', name: 'Чёрный шлем', ar: 3, price: 90, look: 'blackhelm', color: 0x34303c, desc: 'Закрытый шлем с узкой прорезью.' }),
    leafhelm: A({ slot: 'head', name: 'Венец из коры', ar: 1, price: 40, look: 'leafhelm', color: 0x6a5a30, desc: 'Эльфийский шлем из дублёной коры.' }),
    leather: A({ slot: 'torso', name: 'Кожаная куртка', ar: 2, price: 50, look: 'cloth', color: 0x6a4a2a, desc: 'Спасает от скользящих ударов.' }),
    elfleather: A({ slot: 'torso', name: 'Зелёный кафтан', ar: 2, price: 70, look: 'cloth', color: 0x3a6a34, desc: 'Кафтан лесного стража. В лесу вас видно хуже.' }),
    chain: A({ slot: 'torso', name: 'Кольчуга', ar: 5, price: 220, look: 'chain', color: 0x9a9aa2, desc: 'Тяжёлая, но меч её не прорубит с первого раза.' }),
    redtabard: A({ slot: 'torso', name: 'Кольчуга с налатником', ar: 5, price: 260, look: 'tabard', color: 0xb02424, desc: 'Казённая кольчуга охраны дворца.' }),
    blackplate: A({ slot: 'torso', name: 'Чёрные латы', ar: 7, price: 420, look: 'plate', color: 0x2c2832, desc: 'Старые латы, перекрашенные в чёрный.' }),
    bracers: A({ slot: 'arms', name: 'Наручи', ar: 2, price: 45, look: 'bracers', color: 0x5a4028, desc: 'Защищают руки. Отрубить руку в наручах сложнее.' }),
    ironbracers: A({ slot: 'arms', name: 'Стальные наручи', ar: 4, price: 140, look: 'bracers', color: 0x9a9aa4, desc: 'Тяжёлые наручи с пластинами.' }),
    boots: A({ slot: 'legs', name: 'Сапоги и поножи', ar: 2, price: 50, look: 'boots', color: 0x3a2a1a, desc: 'Ноги тоже надо беречь.' }),
    greaves: A({ slot: 'legs', name: 'Стальные поножи', ar: 4, price: 160, look: 'boots', color: 0x9a9aa4, desc: 'Ногу в таких отрубить почти нельзя.' }),
    bandage: { type: 'use', use: 'bandage', name: 'Бинт', price: 6, stack: true, desc: 'Перевязать культю и остановить кровь. Клавиша B.' },
    potion: { type: 'use', use: 'potion', name: 'Целебное зелье', price: 30, stack: true, heal: 45, desc: 'Лечит раны и останавливает кровь. Клавиша H.' },
    herbs: { type: 'use', use: 'potion', name: 'Лесные травы', price: 12, stack: true, heal: 20, desc: 'Эльфийский сбор. Лечит понемногу.' },
    bread: { type: 'use', use: 'food', name: 'Хлеб', price: 2, stack: true, heal: 6, desc: 'Свежий, из Развилок.' },
    cheese: { type: 'use', use: 'food', name: 'Сыр', price: 4, stack: true, heal: 10, desc: 'От тех самых коров.' },
    grain: { type: 'goods', name: 'Мешок зерна', price: 18, stack: true, desc: 'Груз корована. Купцы возьмут.' },
    wine: { type: 'goods', name: 'Бочонок вина', price: 34, stack: true, desc: 'Груз корована.' },
    cloth: { type: 'goods', name: 'Рулон сукна', price: 44, stack: true, desc: 'Груз корована.' },
    salt: { type: 'goods', name: 'Мешок соли', price: 28, stack: true, desc: 'Груз корована.' },
    nails: { type: 'goods', name: 'Ящик гвоздей', price: 22, stack: true, desc: 'Груз корована. В форт везли.' },
    ingot: { type: 'goods', name: 'Железная крица', price: 40, stack: true, desc: 'Сырьё для кузни.' },
    ring: { type: 'goods', name: 'Серебряное кольцо', price: 60, stack: true, desc: 'Чьё-то кольцо.' },
    rota: { type: 'quest', name: 'Расписание караулов', price: 0, desc: 'Свиток из казармы дворца: кто, где и когда стоит на посту.' },
    seal: { type: 'quest', name: 'Печать форта', price: 0, desc: 'Тяжёлая печать с вычеркнутым гербом.' },
    hook: P({ part: 'arm', tier: 1, name: 'Крюк', price: 60, self: true, desc: 'Вместо кисти. Держит ремень щита, оружие не удержит. Можно пристегнуть самому.' }),
    woodarm: P({ part: 'arm', tier: 2, name: 'Деревянная рука', price: 140, self: true, desc: 'Держит щит или нож. Удар медленнее на пятую часть. Можно пристегнуть самому.' }),
    ironarm: P({ part: 'arm', tier: 3, name: 'Железная рука', price: 480, desc: 'Как своя, только крепче. Ставит только мастер.' }),
    pegleg: P({ part: 'leg', tier: 1, name: 'Деревянная нога', price: 80, self: true, desc: 'Хромать, но ходить. Бегать и высоко прыгать не выйдет. Можно пристегнуть самому.' }),
    ironleg: P({ part: 'leg', tier: 3, name: 'Кованая нога', price: 520, desc: 'Почти как своя. Ставит только мастер.' }),
    glasseye: P({ part: 'eye', tier: 1, name: 'Стеклянный глаз', price: 40, self: true, desc: 'Смотрится как настоящий. Не видит.' }),
    crystaleye: P({ part: 'eye', tier: 3, name: 'Зрячий кристалл', price: 420, desc: 'Возвращает зрение. Мир немного голубеет. Ставит только мастер.' }),
    chair: P({ part: 'chair', tier: 1, name: 'Коляска', price: 160, self: true, desc: 'Без ног в ней можно ездить. По ровному быстро, в гору медленно, прыгать нельзя. Сесть: E в инвентаре.' })
  };
  for (const id in ITEMS) ITEMS[id].id = id;

  const SKIN = [0xe8c0a0, 0xd8a880, 0xc89070, 0xf0d0b8, 0xb07858];
  const HAIR = [0x3a2a1a, 0x6a4a2a, 0xc8a050, 0x1a1a1a, 0x8a6a4a, 0xa0a0a0];
  const ELF_HAIR = [0xe8d890, 0xc8b070, 0xd8d8c8, 0x8a6a3a, 0xb05a2a];
  const ELF_SKIN = [0xf0d8c0, 0xe8ccb0, 0xf4e0cc];

  const KINDS = {
    townsman: { fac: 'folk', role: 'civ', title: 'Горожанин', hp: 60, names: 'folkM', shirt: [0x9a7a4a, 0x6a7a8a, 0x8a5a3a, 0xb0a080], pants: [0x4a3a2a, 0x3a3a4a], gear: { head: ['cap', null, null] }, gold: [2, 18] },
    townswoman: { fac: 'folk', role: 'civ', title: 'Горожанка', hp: 55, names: 'folkF', female: true, shirt: [0xa04a4a, 0x6a8a5a, 0xc8b080, 0x5a6a9a], pants: [0x6a3a3a, 0x4a4a6a], gold: [2, 14] },
    merchant: { fac: 'folk', role: 'merchant', title: 'Торговец', hp: 60, names: 'folkM', shirt: [0x7a3a6a, 0x3a5a7a], pants: [0x2a2a2a], gold: [30, 70] },
    driver: { fac: 'folk', role: 'driver', title: 'Возница', hp: 60, names: 'folkM', shirt: [0x7a6a4a, 0x5a4a3a], pants: [0x3a2a1a], gear: { head: ['cap'] }, gold: [5, 20] },
    militia: { fac: 'folk', role: 'soldier', title: 'Ополченец', hp: 90, names: 'folkM', shirt: [0x8a7040], pants: [0x4a3a2a], gear: { main: ['spear', 'axe'], torso: ['leather'], head: ['cap'] }, skill: 30, gold: [5, 20] },
    caravan_guard: { fac: 'folk', role: 'soldier', title: 'Охранник корована', hp: 95, names: 'folkM', shirt: [0x7a5a30], pants: [0x3a2a1a], gear: { main: ['axe', 'sword', 'spear'], off: ['woodshield', null], torso: ['leather', 'chain'], head: ['cap', 'helmet'] }, skill: 40, gold: [10, 30] },
    veteran_beggar: { fac: 'folk', role: 'civ', title: 'Нищий ветеран', hp: 40, names: 'vet', shirt: [0x5a5a4a], pants: [0x3a3a3a], pros: { legR: 'pegleg' }, gold: [0, 3] },
    healer: { fac: 'folk', role: 'service', title: 'Знахарка', hp: 60, name: 'Матрёна', female: true, shirt: [0x6a8a5a], pants: [0x4a5a3a], hair: 0xa0a0a0, shop: 'healer' },
    prosthetist: { fac: 'folk', role: 'service', title: 'Протезных дел мастер', hp: 70, name: 'Тимофей Деревяшкин', shirt: [0x8a6a4a], pants: [0x3a2a1a], pros: { legL: 'ironleg' }, shop: 'pros' },
    smith: { fac: 'folk', role: 'service', title: 'Кузнец', hp: 90, name: 'Пётр Наковальня', shirt: [0x4a3a2a], pants: [0x2a2a2a], shop: 'smith' },
    trader: { fac: 'folk', role: 'service', title: 'Лавочник', hp: 60, name: 'Савва', shirt: [0x5a6a8a], pants: [0x3a3a4a], shop: 'store' },
    innkeeper: { fac: 'folk', role: 'service', title: 'Трактирщица', hp: 60, name: 'Глафира', female: true, shirt: [0xa04a3a], pants: [0x5a3a2a], shop: 'inn' },
    headman: { fac: 'folk', role: 'service', title: 'Староста Развилок', hp: 60, name: 'Фома Лукич', shirt: [0x6a2a2a], pants: [0x2a2a2a], gear: { head: ['cap'] }, shop: 'house' },

    guard: { fac: 'emp', role: 'soldier', title: 'Стражник', hp: 110, names: 'empM', shirt: [0xa82828], pants: [0x3a2a2a], gear: { main: ['sword'], off: ['shield'], torso: ['redtabard'], head: ['helmet'], legs: ['boots', null] }, skill: 45, gold: [8, 25] },
    spearman: { fac: 'emp', role: 'soldier', title: 'Копейщик', hp: 110, names: 'empM', shirt: [0xa82828], pants: [0x3a2a2a], gear: { main: ['spear'], torso: ['redtabard'], head: ['helmet'], arms: ['bracers', null] }, skill: 45, gold: [8, 25] },
    xbowman: { fac: 'emp', role: 'archer', title: 'Арбалетчик', hp: 95, names: 'empM', shirt: [0xa82828], pants: [0x3a2a2a], gear: { main: ['knife'], ranged: ['xbow'], torso: ['leather'], head: ['helmet'] }, ammo: 20, skill: 45, gold: [8, 25] },
    commander: { fac: 'emp', role: 'boss', title: 'Воевода', hp: 220, name: 'Гордей Груздь', shirt: [0xc02020], pants: [0x2a1a1a], hair: 0x8a8a8a, gear: { main: ['sword'], off: ['shield'], torso: ['redtabard'], head: ['helmet'], arms: ['ironbracers'], legs: ['greaves'] }, skill: 70, gold: [80, 120], beard: true },
    emperor: { fac: 'emp', role: 'boss', title: 'Император', hp: 260, name: 'Велимир III', shirt: [0xd8b030], pants: [0x6a1a1a], hair: 0xd8d8d8, gear: { main: ['sword'], torso: ['chain'], legs: ['greaves'] }, skill: 60, gold: [300, 400], crown: true, beard: true },
    palace_medic: { fac: 'emp', role: 'medic', title: 'Лекарь', hp: 70, names: 'empM', shirt: [0xe0e0d0], pants: [0x5a2a2a], gear: { main: ['knife'] }, skill: 20, gold: [10, 20] },
    quartermaster: { fac: 'emp', role: 'service', title: 'Интендант', hp: 80, name: 'Евсей Пуговкин', shirt: [0xa82828], pants: [0x3a2a2a], shop: 'quarter' },

    warden: { fac: 'elf', role: 'soldier', title: 'Лесной страж', hp: 95, names: 'elf', elf: true, shirt: [0x3a6a34], pants: [0x4a3a24], gear: { main: ['elfblade'], ranged: ['bow', null], torso: ['elfleather'], head: ['leafhelm', null], arms: ['bracers', null] }, ammo: 15, skill: 50, gold: [4, 18] },
    archer: { fac: 'elf', role: 'archer', title: 'Лучник', hp: 85, names: 'elf', elf: true, shirt: [0x4a7a3a], pants: [0x4a3a24], gear: { main: ['knife'], ranged: ['elfbow', 'bow'], torso: ['elfleather'] }, ammo: 30, skill: 55, gold: [4, 18] },
    partisan: { fac: 'elf', role: 'soldier', title: 'Партизан', hp: 90, names: 'elf', elf: true, shirt: [0x4a5a3a], pants: [0x3a3a2a], gear: { main: ['elfblade', 'knife'], ranged: ['bow'], head: ['hood'], torso: ['leather'] }, ammo: 15, skill: 50, gold: [4, 16] },
    spy: { fac: 'elf', role: 'spy', title: 'Прохожий', hp: 80, names: 'elf', elf: true, shirt: [0x7a6a4a, 0x6a7a8a], pants: [0x4a3a2a], gear: { main: ['knife'], head: ['hood'] }, skill: 45, gold: [10, 30], disguised: true },
    elder: { fac: 'elf', role: 'boss', title: 'Старейшина', hp: 160, name: 'Ясень', elf: true, shirt: [0x5a7a4a], pants: [0x4a3a24], hair: 0xe0e0d8, gear: { main: ['elfblade'], torso: ['elfleather'] }, skill: 65, gold: [40, 60], beard: true },
    herbalist: { fac: 'elf', role: 'medic', title: 'Травница', hp: 70, name: 'Ива', elf: true, female: true, shirt: [0x6a8a4a], pants: [0x4a5a3a], shop: 'herbs' },
    bowyer: { fac: 'elf', role: 'service', title: 'Лучник-мастер', hp: 90, name: 'Клён', elf: true, shirt: [0x4a6a34], pants: [0x4a3a24], shop: 'bowyer' },
    carver: { fac: 'elf', role: 'service', title: 'Резчик', hp: 80, name: 'Сук', elf: true, shirt: [0x6a5a34], pants: [0x4a3a24], pros: { armL: 'woodarm' }, shop: 'carver' },

    blackguard: { fac: 'evil', role: 'soldier', title: 'Чернолатник', hp: 120, names: 'evil', shirt: [0x2c2832], pants: [0x1c1a20], gear: { main: ['axe', 'greataxe', 'mace'], off: ['blackshield', null], torso: ['blackplate'], head: ['blackhelm'] }, skill: 50, gold: [6, 22] },
    veteran: { fac: 'evil', role: 'soldier', title: 'Ветеран', hp: 100, names: 'vet', shirt: [0x4a4038], pants: [0x2a2620], gear: { main: ['sword', 'axe'], off: ['blackshield', null], torso: ['leather', 'chain'], head: ['blackhelm', null] }, skill: 55, gold: [6, 22], prosChance: 0.75 },
    evilxbow: { fac: 'evil', role: 'archer', title: 'Стрелок', hp: 90, names: 'vet', shirt: [0x3a3440], pants: [0x1c1a20], gear: { main: ['knife'], ranged: ['xbow'], torso: ['leather'], head: ['blackhelm', null] }, ammo: 20, skill: 45, gold: [6, 22], prosChance: 0.3 },
    recruit: { fac: 'evil', role: 'soldier', title: 'Наёмник', hp: 100, names: 'evil', shirt: [0x5a4a3a, 0x3a3a3a], pants: [0x2a2620], gear: { main: ['axe', 'sword', 'spear'], off: ['woodshield', null], torso: ['leather'], head: ['cap', 'blackhelm'] }, skill: 45, gold: [2, 10] },
    villain: { fac: 'evil', role: 'boss', title: 'Злой', hp: 300, name: 'Злой', shirt: [0x1a1820], pants: [0x101014], hair: 0x2a2a2a, gear: { main: ['greataxe'], torso: ['blackplate'], legs: ['greaves'] }, pros: { armL: 'ironarm', eyeR: 'crystaleye' }, skill: 75, gold: [200, 260], beard: true, cloak: 0x3a1010 },
    evilsmith: { fac: 'evil', role: 'service', title: 'Кузнец форта', hp: 110, name: 'Кузьма Крюк', shirt: [0x3a3028], pants: [0x1c1a20], pros: { armR: 'hook' }, shop: 'forge' },
    recruiter: { fac: 'evil', role: 'service', title: 'Вербовщик', hp: 90, name: 'Култышка', shirt: [0x3a3440], pants: [0x1c1a20], pros: { legL: 'pegleg' }, shop: 'recruit' },
    evilmedic: { fac: 'evil', role: 'medic', title: 'Коновал', hp: 80, name: 'Прокоп', shirt: [0x6a6050], pants: [0x2a2620], shop: 'horsedoc' },

    cow: { fac: 'folk', role: 'animal', title: 'Корова', hp: 120, body: 'cow', name: 'Корова', animal: true },
    wolf: { fac: 'wild', role: 'beast', title: 'Волк', hp: 55, body: 'wolf', name: 'Волк', animal: true, skill: 40 }
  };

  const NAMES = {
    folkM: ['Фрол', 'Ерофей', 'Тихон', 'Лука', 'Данила', 'Мирон', 'Агап', 'Прохор', 'Сидор', 'Кондрат', 'Филат', 'Нестор', 'Демьян', 'Яков', 'Афоня'],
    folkF: ['Агафья', 'Марфа', 'Дуня', 'Пелагея', 'Феня', 'Аксинья', 'Варвара', 'Настасья', 'Ульяна', 'Степанида'],
    empM: ['Гаврила', 'Ерёма', 'Остап', 'Богдан', 'Святослав', 'Ратибор', 'Всеволод', 'Мстислав', 'Добрыня', 'Тимофей', 'Ждан', 'Любомир', 'Путята'],
    elf: ['Ольха', 'Рябин', 'Тис', 'Вереск', 'Осина', 'Лещина', 'Можжевел', 'Калина', 'Явор', 'Бук', 'Липа', 'Терн', 'Хмель', 'Ракита', 'Чабрец'],
    evil: ['Шрам', 'Ворон', 'Гнилозуб', 'Кривой', 'Сыч', 'Бугай', 'Лютый', 'Гвоздь', 'Чёрт', 'Копчёный'],
    vet: ['Хромой Ян', 'Безрукий Сеня', 'Одноглазый Митяй', 'Пень', 'Деревяга', 'Крюк Васька', 'Полторы Ноги', 'Култяпка', 'Кривой Семён', 'Стеклоглаз']
  };

  const SHOPS = {
    healer: { name: 'Изба знахарки', owner: 'healer', sells: ['potion', 'bandage', 'herbs'], services: ['heal'], buys: ['herbs'] },
    pros: { name: '«Деревяшкин и сын»', owner: 'prosthetist', sells: ['hook', 'woodarm', 'ironarm', 'pegleg', 'ironleg', 'glasseye', 'crystaleye', 'chair', 'bandage'], services: ['fit'], buys: ['hook', 'woodarm', 'ironarm', 'pegleg', 'ironleg', 'glasseye', 'crystaleye', 'chair'] },
    smith: { name: 'Кузня у моста', owner: 'smith', sells: ['knife', 'sword', 'axe', 'greataxe', 'spear', 'mace', 'bow', 'xbow', 'arrows', 'shield', 'woodshield', 'helmet', 'leather', 'chain', 'bracers', 'ironbracers', 'boots', 'greaves'], buys: 'gear', services: ['repair'] },
    store: { name: 'Лавка «Всё для дороги»', owner: 'trader', sells: ['bandage', 'torch', 'bread', 'cheese', 'arrows', 'hood', 'cap', 'knife'], buys: 'all' },
    inn: { name: 'Трактир «Корова и колесо»', owner: 'innkeeper', sells: ['bread', 'cheese', 'wine'], services: ['room', 'rumors'], buys: ['wine', 'grain', 'salt', 'cheese'] },
    house: { name: 'Изба старосты', owner: 'headman', sells: [], services: ['house'], buys: [] },
    quarter: { name: 'Склад интенданта', owner: 'quartermaster', sells: ['sword', 'spear', 'shield', 'xbow', 'arrows', 'helmet', 'redtabard', 'bracers', 'boots', 'bandage', 'potion', 'torch'], buys: 'gear', services: ['heal'], member: 'emp', memberDiscount: 0.6 },
    herbs: { name: 'Шалаш травницы', owner: 'herbalist', sells: ['herbs', 'potion', 'bandage'], services: ['heal'], buys: ['herbs', 'bread', 'cheese'], member: 'elf', freeHeal: true },
    bowyer: { name: 'Навес лучника', owner: 'bowyer', sells: ['bow', 'elfbow', 'arrows', 'elfblade', 'knife', 'hood', 'elfleather', 'leafhelm', 'bracers', 'woodshield', 'torch'], buys: 'gear', member: 'elf', memberDiscount: 0.75 },
    carver: { name: 'Мастерская резчика', owner: 'carver', sells: ['woodarm', 'pegleg', 'hook', 'chair'], services: ['fit'], buys: ['woodarm', 'pegleg', 'hook'], member: 'elf', memberDiscount: 0.6 },
    forge: { name: 'Кузня форта', owner: 'evilsmith', sells: ['axe', 'greataxe', 'mace', 'knife', 'xbow', 'arrows', 'blackshield', 'blackhelm', 'blackplate', 'ironbracers', 'greaves', 'hook', 'pegleg', 'ironarm', 'ironleg'], services: ['fit', 'repair'], buys: 'gear', member: 'evil', prosDiscount: 0.5 },
    recruit: { name: 'Доска вербовщика', owner: 'recruiter', sells: [], services: ['recruit'], buys: [], member: 'evil' },
    horsedoc: { name: 'Угол коновала', owner: 'evilmedic', sells: ['bandage', 'potion'], services: ['heal'], buys: [], member: 'evil' }
  };

  const STARTS = {
    elf: {
      title: 'Лесной эльф', zone: 'elf', place: 'village',
      desc: 'Листва стоит в самой чаще западного леса. С севера приходят солдаты дворца, с гор спускается войско Злого. Старейшина Ясень ждёт вас у большого дуба. Эльфы хорошо стреляют, тихо ходят и грабят корованы на трактах.',
      inv: [['elfblade', 1], ['bow', 1], ['arrows', 40], ['bandage', 3], ['herbs', 2], ['hood', 1]],
      equip: { main: 'elfblade', ranged: 'bow', torso: 'elfleather' }, gold: 60, skills: { melee: 25, archery: 40, block: 15, athletics: 30, trade: 15, stealth: 35 }
    },
    emp: {
      title: 'Охрана дворца', zone: 'emp', place: 'palace',
      desc: 'Вы новобранец дворцовой стражи. Слушайтесь воеводу Груздя: стойте на посту, ходите в набеги, ловите шпионов. За службу платят жалованье, за самовольство дают выговор. Три выговора, и вас посадят в холодную.',
      inv: [['sword', 1], ['shield', 1], ['bandage', 3], ['potion', 1], ['bread', 2]],
      equip: { main: 'sword', off: 'shield', torso: 'redtabard', head: 'helmet' }, gold: 40, skills: { melee: 35, archery: 15, block: 35, athletics: 25, trade: 15, stealth: 10 }
    },
    evil: {
      title: 'Злой', zone: 'evil', place: 'fort',
      desc: 'Вы тот, кого дворец зовёт Злым. Ваше имя когда-то стёрли с камня Летописи. Старый форт в горах ваш, и войско в нём ваше. Здесь никто не отдаёт вам приказов: собирайте солдат, грабьте корованы и сами ведите войско на дворец.',
      inv: [['greataxe', 1], ['bandage', 4], ['potion', 2], ['torch', 2]],
      equip: { main: 'greataxe', torso: 'blackplate' }, pros: { armL: 'ironarm', eyeR: 'crystaleye' }, gold: 120, skills: { melee: 45, archery: 20, block: 25, athletics: 25, trade: 20, stealth: 15 }
    }
  };

  const SKILLS = { melee: 'Ближний бой', archery: 'Стрельба', block: 'Блок', athletics: 'Атлетика', trade: 'Торговля', stealth: 'Скрытность' };

  const PARTS = { head: 'Голова', torso: 'Туловище', armL: 'Левая рука', armR: 'Правая рука', legL: 'Левая нога', legR: 'Правая нога' };
  const PART_GEN = { head: 'голову', torso: 'туловище', armL: 'левую руку', armR: 'правую руку', legL: 'левую ногу', legR: 'правую ногу' };

  const ZONES = [
    { id: 'folk', name: 'Зона людей', note: 'нейтральная' },
    { id: 'emp', name: 'Зона императора', note: 'дворец' },
    { id: 'elf', name: 'Зона эльфов', note: 'густой лес' },
    { id: 'evil', name: 'Зона Злого', note: 'горы и старый форт' }
  ];

  K.DATA = { FACTIONS, RELATIONS, ITEMS, KINDS, NAMES, SHOPS, STARTS, SKILLS, PARTS, PART_GEN, ZONES, SKIN, HAIR, ELF_HAIR, ELF_SKIN };
})(globalThis.Korovany = globalThis.Korovany || {});
