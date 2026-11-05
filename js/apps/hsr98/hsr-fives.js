(function (H) {
  'use strict';
  const T = H.TUNING, AV = T.avBase;
  const { sv, atkOf, defOf, spdOf, alive } = H.battleStat;

  const LORD = 'Повелитель молний';
  const NUMBY = 'Счетовод';
  const FLOWER = 'Цветок Бездны';
  const ZONE = 'Зона Лочи';
  const SCALE = 'Чешуя дракона';
  const RIGHT = 'Праведное сердце';
  const ROAR = 'Громкий рёв';
  const MATRIX = 'Матрица предвидения';
  const KNOW = 'Знание';
  const LUCK = 'Уклонение от неудач';
  const SYZ = 'Сизигия';
  const TRANS = 'Спектральная трансмиграция';
  const DEBT = 'Справка о задолженности';
  const WIND = 'Поразительный рост!';
  const PROV = 'Жертвенность жизни';
  const APO = 'Апофеоз';
  const FOLLY = 'Недальновидность мудрецов';
  const COGITO = 'Я мыслю - я существую';
  const OWN = ['basic', 'skill', 'ult', 'enhanced'];

  const KITS = {
    jingyuan: {
      name: 'Цзин Юань', path: 'erudition', elem: 'elec', rarity: 5, energy: 130, faction: 'luofu',
      base: { hp: 158, atk: 95, def: 59, spd: 99 },
      look: { mood: 'smile', skin: '#f6dcd0', hair: '#d8d6dc', hairHi: '#f4f2f6', hairSh: '#a8a4b0', eye: '#d89a30', eye2: '#f4cc6a', bangs: 'hide', sides: 'long', back: 'hightail', crown: 'wind', gloss: true, ahoge: true, jaw: 'v', body: 'tall', sex: 'm', coat: 'cape', coatLen: 22, top: '#1e1c22', coatLow: '#1e1c22', lining: '#7a1a20', backLining: true, edge: '#d8b048', trim: '#d8b048', inner: '#ecebe6', neck: '#ecebe6', collar: 'high', lower: '#7a1e22', low: 'pants', shoes: '#1a1a20', gloves: '#ecebe6', sleeve: '#ecebe6', acc: ['jyarmor:#3a322c', 'lionpad:#d8b048', 'puff:#ecebe6', 'bracer:#1e1c22', 'boots:#1a1a20', 'halfsleeves'] },
      basic: { name: 'Сияющий свет', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Раскалывающийся зенит', target: 'all', text: 'урон всем 100%. Повелитель молний бьёт на 2 раза больше. Со следом крит. шанс +10% на 2 хода.', fx: [{ k: 'dmg', m: 1.0, tough: 10 }, { k: 'lordHits', v: 2 }, { k: 'buff', s: 'critR', v: 0.1, turns: 2, name: 'Военный маршал', who: 'self', quiet: true, fixed: true, trace: 'a6' }] },
      ult: { name: 'Несущий свет', target: 'all', text: 'урон всем 200%. Повелитель молний бьёт на 3 раза больше.', fx: [{ k: 'dmg', m: 2.0, tough: 20 }, { k: 'lordHits', v: 3 }] },
      talent: 'Повелитель молний ходит сам: 3 удара по 66% по случайным врагам. Каждый лишний удар ускоряет его.',
      tech: { name: 'Призыв духа', text: 'В первом ходе Повелитель молний бьёт на 3 раза больше.', fx: 'jyTech' },
      contact: [{ name: 'Предложить партию в сянци', tag: 'science' }, { name: 'Задремать на посту', tag: 'silent' }]
    },
    luocha: {
      name: 'Лоча', path: 'abundance', elem: 'imag', rarity: 5, energy: 100, faction: 'luofu',
      base: { hp: 174, atk: 103, def: 44, spd: 101 },
      look: { mood: 'gentle', skin: '#f8e4d8', hair: '#e6d29c', hairHi: '#f6ead0', eye: '#a4a83a', eye2: '#d8d070', bangs: 'eye', sides: 'long', back: 'long', crown: 'smooth', ahoge: true, gloss: true, jaw: 'v', body: 'tall', sex: 'm', coat: 'split', coatLen: 30, backLining: true, top: '#f2f0ea', trim: '#26262c', lining: '#1e7c7a', inner: '#1e1e24', collar: 'high', neck: '#1e1e24', lower: '#eeece6', low: 'pants', tuck: true, shoes: '#1e1e24', gloves: '#1e1e24', acc: ['lcdrape:#1e7c7a', 'lctassels:#d8b048', 'boots:#1e1e24'] },
      basic: { name: 'Шипы бездны', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Молитва цветка бездны', target: 'ally', text: 'лечит союзника на 60% атаки Лочи, со следом снимает ослабление. +1 Цветок Бездны.', fx: [{ k: 'abyssPrayer' }] },
      ult: { name: 'Желание смерти', target: 'all', text: 'снимает по одному усилению со всех врагов, урон всем 200%. +1 Цветок Бездны.', fx: [{ k: 'dispelAll' }, { k: 'dmg', m: 2.0, tough: 20 }, { k: 'flower' }] },
      talent: 'Союзник ниже 50% HP лечится сам. На 2 Цветках зона: атаки лечат отряд на 18% атаки.',
      tech: { name: 'Милосердие дурака', text: 'Бой начинается с зоной Лочи.', fx: 'lcTech' },
      contact: [{ name: 'Предложить лекарство', tag: 'kind' }, { name: 'Постучать по гробу', tag: 'weird' }]
    },
    imbibitor: {
      name: 'Дань Хэн: Пожиратель Луны', short: 'Пож. Луны', path: 'destruction', elem: 'imag', rarity: 5, energy: 140, faction: 'luofu',
      base: { hp: 169, atk: 95, def: 44, spd: 102 },
      look: { mood: 'stern', skin: '#f6ded0', hair: '#262022', hairHi: '#3e3436', streak: '#c8303a', streakSide: 'l', streakShape: 'lock', eye: '#4ac8e0', eye2: '#b8f4fa', bangs: 'messy', sides: 'long', back: 'long', crown: 'wild', gloss: true, jaw: 'v', body: 'm', sex: 'm', coat: 'jacket', top: '#f2f2ee', trim: '#1e5a66', inner: '#1e5a66', collar: 'high', lower: '#1a1e26', low: 'pants', tuck: true, shoes: '#1a1e28', gloves: '#1a1e24', acc: ['horns:#4ad8c8', 'elfears', 'eyeliner:#c8303a', 'earring:#d8b048', 'ilfront:#1e6a76', 'ilsash:#2e7a8e', 'goldcuff:#d8b048', 'boots:#1a1e28'] },
      basic: { name: 'Лотос покровительства', target: 'single', text: 'мнимый урон 100% в 2 удара.', fx: [{ k: 'ilStrike', hits: 2, m: 1.0, tough: 10 }] },
      dracore: [
        { name: 'Превосходство', tier: 1, target: 'single', energy: 30, text: 'стоит 1 очко навыка. 3 удара, всего 260%.', fx: [{ k: 'ilStrike', hits: 3, m: 2.6, tough: 20 }] },
        { name: 'Божественное копьё', tier: 2, target: 'blast', energy: 35, text: 'стоит 2 очка навыка. 5 ударов, всего 380%, с 4-го удара соседям 60%.', fx: [{ k: 'ilStrike', hits: 5, m: 3.8, adj: 0.6, adjFrom: 4, tough: 30, adjTough: 10, roar: true }] },
        { name: 'Стремительный прыжок', tier: 3, target: 'blast', energy: 40, text: 'стоит 3 очка навыка. 7 ударов, всего 500%, с 4-го удара соседям 180%.', fx: [{ k: 'ilStrike', hits: 7, m: 5.0, adj: 1.8, adjFrom: 4, tough: 40, adjTough: 20, roar: true }] }
      ],
      skill: { name: 'Освобождение драконьей силы', target: 'self', keepTurn: true, noSp: true, text: 'усиливает атаку до 3 раз без конца хода. С 4-го удара копья и прыжка крит. урон +12% (до 4).', fx: [{ k: 'dracore' }] },
      ult: { name: 'Уносящие лазурные воды', target: 'blast', text: '3 удара: цели 300%, соседям 140%. +2 Чешуи дракона, они заменяют очки навыка.', fx: [{ k: 'ilStrike', hits: 3, m: 3.0, adj: 1.4, adjFrom: 1, tough: 30, adjTough: 20 }, { k: 'scales', v: 2 }] },
      talent: 'Каждый удар даёт Праведное сердце: урон +10% до конца хода (до 6 раз).',
      tech: { name: 'Усмиряющий небеса призматический дракон', short: 'Призматический дракон', text: 'Мнимый урон всем 120% и 1 Чешуя дракона.', fx: 'ilTech' },
      contact: [{ name: 'Холодно промолчать', tag: 'silent' }, { name: 'Показать рога', tag: 'threat' }]
    },
    fuxuan: {
      name: 'Фу Сюань', path: 'preservation', elem: 'quant', rarity: 5, energy: 135, faction: 'luofu',
      base: { hp: 201, atk: 63, def: 74, spd: 100 },
      look: { mood: 'serious', skin: '#fbe6e0', hair: '#ecbcdc', hairHi: '#fadcef', hairSh: '#c08ac0', tips: '#a868d0', tipsFade: true, eye: '#c86a9a', eye2: '#f0c870', bangs: 'blunt', sides: 'straight', back: 'twin', crown: 'smooth', gloss: true, body: 'small', coat: 'bodice', neck: '#f2eef4', top: '#2a1a30', trim: '#d8b048', inner: '#2a1a30', collar: 'bare', lower: '#f4eef6', hem: '#d8c0e8', low: 'skirt', skirtLen: 6, legs: '#f2eef6', shoes: '#2a1a30', detAt: 0.3, band: '#e8b4d8', cuff: '#f0c8e0', tailsTo: 'ankle', tailsLining: '#e8c8f0', acc: ['fxhairpin:#9a4ad8', 'starorb:#2a1a30', 'detsleeves:#f4eef6', 'puff:#f4eef6', 'tails:#b06ad0', 'anklecuff:#8a3ad0'] },
      basic: { name: 'Взрыв сверхновой', target: 'single', text: 'квантовый урон 50% макс. HP Фу Сюань.', fx: [{ k: 'dmg', m: 0, hpM: 0.5 }] },
      skill: { name: 'Ведомо звёздам, указано сердцем', target: 'self', text: 'Матрица предвидения 3 хода: берёт 65% урона отряда, всем +6% макс. HP и +12% крит. шанса.', fx: [{ k: 'matrix', turns: 3 }] },
      ult: { name: 'Единение скорби нации', target: 'all', text: 'урон всем 100% макс. HP. +1 заряд самолечения, остальных лечит на 5% её HP.', fx: [{ k: 'dmg', m: 0, hpM: 1.0, tough: 20 }, { k: 'fxCharge' }] },
      talent: 'Пока она в бою, отряд получает на 18% меньше урона. На 50% HP лечит 90% потерянного.',
      tech: { name: 'Пророчеству сопутствует вера', short: 'Пророчество', text: 'Бой начинается с Матрицей предвидения на 2 хода.', fx: 'fxTech' },
      contact: [{ name: 'Предсказать судьбу', tag: 'science' }, { name: 'Строго отчитать', tag: 'threat' }]
    },
    jingliu: {
      name: 'Цзинлю', path: 'destruction', elem: 'ice', rarity: 5, energy: 140, faction: 'luofu',
      base: { hp: 195, atk: 92, def: 59, spd: 96 },
      look: { mood: 'flat', skin: '#f8e6e2', hair: '#e2e8f2', hairHi: '#ffffff', hairSh: '#a8b4cc', tips: '#8aa8e0', tipsFade: true, eye: '#c8303a', eye2: '#f07a7a', bangs: 'eye', bangsR: true, sides: 'long', back: 'long', crown: 'smooth', gloss: true, body: 'f', coat: 'bodice', neck: '#16161e', top: '#22306a', trim: '#c8ccd8', inner: '#22306a', collar: 'high', lower: '#e8eef8', hem: '#b8c8e8', low: 'skirt', skirtLen: 7, legs: '#f8e6e2', shoes: '#16161e', gloves: '#4a3a34', detAt: 0.22, band: '#c8ccd8', cuff: '#c8ccd8', tailsTo: 'ankle', tailsLining: '#2a2a6a', acc: ['blindfold:#16161e', 'lunarbodice:#22306a', 'detsleeves:#4a5ad8', 'tails:#3a3a8a', 'thighboots:#16161e', 'kneeplate:#c8ccd8', 'pauldronr:#c8ccd8', 'hairorn:#c8ccd8'] },
      basic: { name: 'Лунное сияние', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Непостижимая Зарница', target: 'single', text: 'урон 200%, +1 Сизигия. Со следом следующий ход на 10% раньше.', fx: [{ k: 'dmg', m: 2.0 }, { k: 'syzygy', v: 1 }, { k: 'advance', v: 0.1, who: 'self', trace: 'a4' }] },
      moon: { name: 'Луна на застывшей реке', target: 'blast', text: 'без очка навыка. Цели 250%, соседям 125%. −1 Сизигия.', fx: [{ k: 'jlDrain' }, { k: 'dmg', m: 2.5, adj: 1.25, tough: 20, adjTough: 10 }, { k: 'syzygy', v: -1 }] },
      ult: { name: 'Стремительные цветы, мимолётные звёздные сны', short: 'Стремительные цветы', target: 'blast', text: 'цели 300%, соседям 150%. +1 Сизигия.', fx: [{ k: 'jlDrain' }, { k: 'dmg', m: 3.0, adj: 1.5, tough: 30, adjTough: 20 }, { k: 'syzygy', v: 1 }] },
      talent: 'На 2 Сизигиях ходит сразу, крит. шанс +50%, навык усилен. Атаки забирают 4% HP у отряда.',
      tech: { name: 'Сокровенная природа', text: 'Заморозка всех врагов на 1 ход, +15 энергии и 1 Сизигия.', fx: 'jlTech' },
      contact: [{ name: 'Обнажить меч', tag: 'threat' }, { name: 'Смотреть на луну', tag: 'silent' }]
    },
    topaz: {
      name: 'Топаз и Счетовод', short: 'Топаз', path: 'hunt', elem: 'fire', rarity: 5, energy: 130, faction: 'ipc',
      base: { hp: 127, atk: 84, def: 50, spd: 110 },
      look: { mood: 'smile', skin: '#f8e2d6', hair: '#e6e6ee', hairHi: '#ffffff', streak: '#c8283a', streakSide: 'l', streakShape: 'sidel', eye: '#5a3aa8', eye2: '#7ad0e8', bangs: 'swept', bangsR: true, sides: 'jaw', back: 'short', crown: 'smooth', gloss: true, body: 'f', coat: 'bodice', neck: 'none', top: '#1c1a22', trim: '#d8b048', inner: '#f2f0f4', collar: 'high', lower: '#1c1a22', low: 'shorts', legs: '#f8e2d6', shoes: '#1c1a22', gloves: '#1c1a22', acc: ['gemclip:#f4f4f8', 'ipcfront:#c8283a', 'sidecape:#c8283a', 'buttons:#3a3844', 'bigbelt:#1c1a22', 'garter:#c8283a', 'bangle:#4ad0e8', 'boots:#1c1a22', 'bootcuff:#c8283a', 'longgloves', 'armband:#c8283a'] },
      basic: { name: 'Дефицит...', target: 'single', text: 'огненный урон 100%. Со следом считается бонус-атакой.', fx: [{ k: 'tzStrike', m: 1.0 }] },
      skill: { name: 'Трудности с оплатой?', target: 'single', text: 'Справка о задолженности: урон бонус-атак по цели +50%. Счетовод бьёт её на 150%.', fx: [{ k: 'debt' }, { k: 'numbyStrike' }] },
      ult: { name: 'Из убытка в прибыль!', target: 'self', text: 'Поразительный рост! на 2 атаки Счетовода: урон +150%, крит. урон +25%. Любые удары по должнику его торопят.', fx: [{ k: 'windfall' }] },
      talent: 'Счетовод ходит сам и бьёт должника (150%). Бонус-атаки союзников продвигают ход Счетовода на 50%.',
      tech: { name: 'Дотация', text: 'После первой атаки Счетовода Топаз получает 60 энергии.', fx: 'tzTech' },
      contact: [{ name: 'Выставить счёт', tag: 'bribe' }, { name: 'Пустить Счетовода', tag: 'cute' }]
    },
    huohuo: {
      name: 'Хохо', path: 'abundance', elem: 'wind', rarity: 5, energy: 140, faction: 'luofu',
      base: { hp: 185, atk: 82, def: 62, spd: 98 },
      look: { mood: 'worried', skin: '#fae8de', hair: '#7cc89c', hairHi: '#b8ecd0', hairSh: '#4a9474', tips: '#c8f4dc', tipsFade: true, eye: '#5a8ab0', eye2: '#c8e4f4', bangs: 'messy', sides: 'long', back: 'long', crown: 'messy', ahoge: true, gloss: true, body: 'small', coat: 'split', coatLen: 12, top: '#1e3a34', coatLow: '#1e3a34', lining: '#3a8a64', trim: '#c8b48a', inner: '#5aa878', sleeve: '#eef2ee', collar: 'high', lower: '#c8b496', low: 'shorts', legs: '#fae8de', shoes: '#16161e', acc: ['talismancap:#1e2a28', 'hhcharm:#5aa878', 'warmers:#f2f2f0', 'puff:#c8b48a', 'ghosttail:#3ad8b0'] },
      basic: { name: 'Флаг: Призыв бури', target: 'single', text: 'ветряной урон 50% макс. HP Хохо.', fx: [{ k: 'dmg', m: 0, hpM: 0.5 }] },
      skill: { name: 'Талисман: Защита', target: 'ally', text: 'снимает ослабление, лечит цель на 21% HP Хохо и соседей на 16,8%. Жертвенность жизни на 2 хода.', fx: [{ k: 'talisman' }] },
      ult: { name: 'Хвост: Духовное господство', target: 'allies', support: true, text: 'остальным союзникам 20% их макс. энергии и атака +40% на 2 хода.', fx: [{ k: 'tailRule' }] },
      talent: 'Под Жертвенностью жизни лечит союзника (4,5% HP) в начале его хода, при ульте и всех ниже 50% HP.',
      tech: { name: 'Демон: Разоблачение зла', short: 'Разоблачение зла', text: 'Атака всех врагов −25% на 2 хода.', fx: 'hhTech' },
      contact: [{ name: 'Спрятаться за хвост', tag: 'cute' }, { name: 'Наклеить талисман', tag: 'weird' }]
    },
    argenti: {
      name: 'Аргенти', path: 'erudition', elem: 'phys', rarity: 5, energy: 180, faction: 'beauty',
      base: { hp: 142, atk: 100, def: 44, spd: 103 },
      look: { mood: 'calm', skin: '#f8e2d6', hair: '#c42430', hairHi: '#f4a0a8', eye: '#3aa86a', eye2: '#9ae0b0', bangs: 'sweep', sides: 'long', back: 'long', crown: 'wavy', ahoge: true, gloss: true, jaw: 'v', body: 'tall', sex: 'm', coat: 'split', coatLen: 26, top: '#d4d6de', coatLow: '#a8202c', lining: '#d8b048', trim: '#d8b048', inner: '#d4d6de', collar: 'high', neck: '#d4d6de', lower: '#c8ccd6', low: 'pants', shoes: '#c8ccd6', gloves: '#d4d6de', acc: ['agarmor:#d4d6de', 'gauntlets:#d4d6de'] },
      basic: { name: 'Мимолётный аромат', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Здесь расцветает справедливость', target: 'all', text: 'физический урон всем 120%.', fx: [{ k: 'dmg', m: 1.2, tough: 10 }] },
      ult: { name: 'Сама Красота одарила этот сад', target: 'all', cost: 90, text: 'тратит 90 энергии, урон всем 160%. На 180 энергии ульта сильнее.', fx: [{ k: 'dmg', m: 1.6, tough: 20 }] },
      grand: { name: 'Возложенное в «моём» саду величие', target: 'all', cost: 180, text: 'тратит 180 энергии. Урон всем 280% и ещё 6 ударов по 95% по случайным врагам.', fx: [{ k: 'dmg', m: 2.8, tough: 20 }, { k: 'gardenBounce' }] },
      talent: 'Каждый задетый враг даёт 3 энергии и Апофеоз: крит. шанс +2,5%, до 10.',
      tech: { name: 'Манифест чистейшей добродетели', short: 'Манифест', text: 'Физический урон всем 80% и 15 энергии.', fx: 'agTech' },
      contact: [{ name: 'Подарить розу', tag: 'kind' }, { name: 'Прочесть оду Идриле', tag: 'sing' }]
    },
    ratio: {
      name: 'Доктор Рацио', short: 'Рацио', path: 'hunt', elem: 'imag', rarity: 5, energy: 140, faction: 'guild',
      base: { hp: 143, atk: 106, def: 56, spd: 103 },
      look: { mood: 'calm', skin: '#f4dccb', hair: '#3a2c6c', hairHi: '#5e4ea0', eye: '#c86a2a', eye2: '#f0b060', bangs: 'eye', sides: 'jaw', back: 'short', crown: 'wavy', gloss: true, jaw: 'v', body: 'tall', sex: 'm', coat: 'jacket', top: '#1e1c24', trim: '#1e1c24', inner: '#1e1c24', collar: 'v', lower: '#2a2668', low: 'pants', shoes: '#d8b048', gloves: '#1e1c24', acc: ['laurel:#d8b048', 'racape:#262a2c', 'ratoga:#3a48c0', 'rasandal:#d8b048', 'barefoot'] },
      basic: { name: 'Знание - сила', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Интеллектуальная помощь', target: 'single', text: 'урон 150%. Шанс бонус-атаки 40% и +20% за каждое ослабление цели.', fx: [{ k: 'summation' }, { k: 'dmg', m: 1.5 }, { k: 'inference' }, { k: 'cogito' }] },
      ult: { name: 'Силлогистический парадокс', target: 'single', text: 'урон 240% и Недальновидность мудрецов: 2 атаки союзников по цели вызовут бонус-атаку.', fx: [{ k: 'dmg', m: 2.4, tough: 30 }, { k: 'folly' }] },
      talent: 'Бонус-атака 270%. Со следами каждое ослабление цели добавляет крит и урон.',
      tech: { name: 'Изваяние идола', text: 'Скорость всех врагов −15% на 2 хода.', fx: 'raTech' },
      contact: [{ name: 'Прочесть лекцию', tag: 'science' }, { name: 'Назвать дураком', tag: 'threat' }]
    }
  };

  const CONES = {
    beforedawn: {
      name: 'До рассвета', path: 'erudition', rarity: 5, ref: 23010, stats: { hp: 48, atk: 26.4, def: 21 }, skill: 'Долгая ночь', sig: 'jingyuan',
      tpl: 'Крит. урон владельца повышается на #1%, урон навыка и абсолютной техники на #2%. После навыка или абсолютной техники владелец получает Спящее тело: следующая бонус-атака тратит его и наносит на #3% больше урона.', p: [[0.36, 0.18, 0.48], [0.42, 0.21, 0.56], [0.48, 0.24, 0.64], [0.54, 0.27, 0.72], [0.6, 0.3, 0.8]], bonus: { critD: 1, skillP: 2, ultP: 2 }, fx: 'dawn',
      desc: '«Не принимайте легкомысленных решений, генерал... Подумайте о том, каким вы попадёте в историю...»\nГенерал Облачных Рыцарей, прикрыв глаза, слушал эти слова.\n«У истории своё собственное суждение о моём наследии, и оно меня не волнует. Если я добьюсь успеха, все скажут, что всё прошло по моему плану. Но если я потерплю неудачу, они будут осуждать меня».\nС его плеча спрыгнула птица и приземлилась на ладонь.\n«Я отказываюсь действовать вопреки здравому смыслу».'
    },
    coffin: {
      name: 'Эхо из гроба', path: 'abundance', rarity: 5, ref: 23008, stats: { hp: 52.8, atk: 26.4, def: 18 }, skill: 'Шипы', sig: 'luocha',
      tpl: 'Атака владельца повышается на #1%. Каждый задетый атакой владельца враг восстанавливает ему #3 энергии, до #4 раз за атаку. После абсолютной техники владельца скорость всех союзников повышается на #2 на 1 ход.', p: [[0.24, 12, 3, 3], [0.28, 14, 3.5, 3], [0.32, 16, 4, 3], [0.36, 18, 4.5, 3], [0.4, 20, 5, 3]], bonus: { atkP: 1 }, fx: 'coffin',
      desc: 'Окружённый белыми ирисами, он постучал по крышке гроба.\n«Иногда мне кажется, что я недооценил тебя, предложив эту сделку».\nОн не получил ответа: лишь острый шип тотчас пронзил его ладонь.\nУлыбнувшись, он сильнее сжал колючие ветви.\n«Так вот как получается: мы недооценивали друг друга, но при этом хотели использовать».'
    },
    brighter: {
      name: 'Ярче солнца', path: 'destruction', rarity: 5, ref: 23015, stats: { hp: 48, atk: 28.8, def: 18 }, skill: 'До смерти', sig: 'imbibitor',
      tpl: 'Шанс крита владельца повышается на #1%. Базовая атака даёт владельцу уровень Зова дракона на #2 хода, до #3 уровней: каждый повышает атаку на #4% и восстановление энергии на #5%.', p: [[0.18, 2, 2, 0.18, 0.06], [0.21, 2, 2, 0.21, 0.07], [0.24, 2, 2, 0.24, 0.08], [0.27, 2, 2, 0.27, 0.09], [0.3, 2, 2, 0.3, 0.1]], bonus: { critR: 1 }, fx: 'brighter',
      desc: 'С самого рождения всё, что он видел, было тёмным подземельем.\nЧужие грехи привязали его к этому месту, чужие воспоминания захлёстывали его.\nОн напрягал все силы, пытаясь вздохнуть...\nУхватить лучик света в безбрежном океане...\nИ однажды, когда генерал вошёл в темницу...\nТо увидел, как взгляд юноши озаряет кромешную тьму ярче солнца.'
    },
    shuteyes: {
      name: 'Она закрыла глаза', path: 'preservation', rarity: 5, ref: 23011, stats: { hp: 57.6, atk: 19.2, def: 24 }, skill: 'Видение', sig: 'fuxuan',
      tpl: 'Макс. HP владельца повышается на #1%, восстановление энергии на #4%. Когда HP владельца уменьшается, урон всех союзников повышается на #2% на #5 хода. В начале каждой волны союзники восстанавливают #3% потерянного HP.', p: [[0.24, 0.09, 0.8, 0.12, 2], [0.28, 0.105, 0.85, 0.14, 2], [0.32, 0.12, 0.9, 0.16, 2], [0.36, 0.135, 0.95, 0.18, 2], [0.4, 0.15, 1, 0.2, 2]], bonus: { hpP: 1, err: 4 }, fx: 'shuteyes',
      desc: 'Боль в районе лба будет сопровождать её всю оставшуюся жизнь, но это лишь малая часть боли, принесённой её прошлым.\nОна считала себя частью гениального замысла, пока её не покинули все те, кто был ей дорог.\nТеперь она «видит» постоянно меняющийся мир, беспрестанно меняющиеся времена...\nНо её глаза закрыты, потому что будущее уже предопределено...\nТретьим глазом.'
    },
    ownsword: {
      name: 'Отныне я сама буду мечом', path: 'destruction', rarity: 5, ref: 23014, stats: { hp: 52.8, atk: 26.4, def: 18 }, skill: 'С закатной яшмой в руках', sig: 'jingliu',
      tpl: 'Крит. урон владельца повышается на #1%. Когда союзника атакуют или он теряет HP, владелец получает уровень Лунного затмения, до #2: каждый повышает урон его следующей атаки на #3%, а на #2 уровнях эта атака игнорирует #4% защиты. После атаки эффект снимается.', p: [[0.2, 3, 0.14, 0.12], [0.23, 3, 0.165, 0.14], [0.26, 3, 0.19, 0.16], [0.29, 3, 0.215, 0.18], [0.32, 3, 0.24, 0.2]], bonus: { critD: 1 }, fx: 'ownsword',
      desc: 'Разбитое лезвие погружается в пробирающий до костей холод.\nОт металлического оружия нет никакой пользы, ведь с первого взгляда видно, на что оно способно.\n«Какая мне польза от меча?»\nВ её сердце нет места любви, а взгляд её пуст.\n«Отныне я сама буду мечом».\nЕдинственный путь выйти за так называемые пределы и свершить неслыханные прорывы: стать топливом для своего же пламени.'
    },
    blissful: {
      name: 'Тревога и блаженство', path: 'hunt', rarity: 5, ref: 23016, stats: { hp: 48, atk: 26.4, def: 21 }, skill: 'Подходите по одному', sig: 'topaz',
      tpl: 'Шанс крита владельца повышается на #1%, урон бонус-атак на #2%. Бонус-атака накладывает на цель Приручение, до #4 уровней: каждый повышает крит. урон союзников по этой цели на #3%.', p: [[0.18, 0.3, 0.12, 2], [0.21, 0.35, 0.14, 2], [0.24, 0.4, 0.16, 2], [0.27, 0.45, 0.18, 2], [0.3, 0.5, 0.2, 2]], bonus: { critR: 1, followP: 2 }, fx: 'blissful',
      desc: 'Для специалиста Корпорации испытывать стресс недопустимо.\nДаже усталый и подавленный, он должен идти навстречу трудностям с высоко поднятой головой.\nНу только если... его не придавило «ими».\n«Спокойно, спокойно! У меня всего две руки!»\nДевушка только что вернулась домой после долгого рабочего дня и оказалась буквально завалена мохнатыми пушистиками.\nВозможно, они не совсем понимают её слова, прижимаясь своими круглыми головками к её ладоням.\nОна гладит мягкую шерсть, и на смену усталости приходит чувство тепла и уюта.'
    },
    fright: {
      name: 'Ночь страха', path: 'abundance', rarity: 5, ref: 23017, stats: { hp: 52.8, atk: 21.6, def: 24 }, skill: 'Глубокий вдох', sig: 'huohuo',
      tpl: 'Восстановление энергии владельца повышается на #1%. Когда союзник использует абсолютную технику, владелец лечит самого раненого союзника на #2% его макс. HP. Лечение владельца повышает атаку цели на #3%, до #4 раз, на #5 хода.', p: [[0.12, 0.1, 0.024, 5, 2], [0.14, 0.11, 0.028, 5, 2], [0.16, 0.12, 0.032, 5, 2], [0.18, 0.13, 0.036, 5, 2], [0.2, 0.14, 0.04, 5, 2]], bonus: { err: 1 }, fx: 'fright',
      desc: 'Девчушка прячется за дверью и не решается даже высунуть носа.\nСегодняшняя цель так близка: возможно, поэтому её сердце стало биться чаще.\n«Я не боюсь... не боюсь, не боюсь...»\nВ полночной гробовой тишине раздаётся пронзительный крик.\nДрожа всем телом, девочка крепко сжимает в ручонках своё «оружие», но всё ещё не решается приблизиться к цели.\n«Т-тут нечего б-бояться!»\nХвосту за её спиной больше невыносимо наблюдать всё это безобразие, и он внезапно вспыхивает:\n«Ну же! Просто забери эту чёртову доставку!»'
    },
    gaze: {
      name: 'Остановись, мгновенье', path: 'erudition', rarity: 5, ref: 23018, stats: { hp: 48, atk: 26.4, def: 21 }, skill: 'Паломничество рыцаря', sig: 'argenti',
      tpl: 'Крит. урон владельца повышается на #1%. Урон абсолютной техники владельца повышается на #2% за каждую единицу его макс. энергии, учитывается до #3 энергии.', p: [[0.36, 0.0036, 180], [0.42, 0.0042, 180], [0.48, 0.0048, 180], [0.54, 0.0054, 180], [0.6, 0.006, 180]], bonus: { critD: 1 }, fx: 'gaze',
      desc: 'Он уже слышал народные песни, восхваляющие этот свет:\n«Бутоны пышных роз сгибаются в поклоне, лишь для того, чтоб вызвать тень улыбки на Её устах.\nИ солнце восходящее на небосводе сияет для того, чтоб озарить Её прекрасный лик в лучах.\nЧудесные мелодии чарующе играют, лишь для того, чтоб дрогнули ресницы на Её очах».\nНо этот свет угас без обещания вернуться... а он продолжает всматриваться куда-то вдаль.\nВсё, что ему остаётся: ждать, верить и сеять вечное о Красоте на космических просторах.\nИ пусть это останется кратким мгновением, которое навсегда запечатлелось в его сознании, он уже получил все ответы, которые так искал.'
    },
    baptism: {
      name: 'Крещение чистой мысли', path: 'hunt', rarity: 5, ref: 23020, stats: { hp: 43.2, atk: 26.4, def: 24 }, skill: 'Тренировка мысли', sig: 'ratio',
      tpl: 'Крит. урон владельца повышается на #1%, и ещё на #2% по цели за каждое её ослабление, до #3 раз. Абсолютная техника по цели даёт владельцу Дискуссию на #6 хода: урон +#4%, бонус-атаки игнорируют #5% защиты.', p: [[0.2, 0.08, 3, 0.36, 0.24, 2], [0.23, 0.09, 3, 0.42, 0.28, 2], [0.26, 0.1, 3, 0.48, 0.32, 2], [0.29, 0.11, 3, 0.54, 0.36, 2], [0.32, 0.12, 3, 0.6, 0.4, 2]], bonus: { critD: 1 }, fx: 'baptism',
      desc: 'Светит послеполуденное солнце, аромат цветов наполняет воздух.\nХотя он всегда старается держать мысли в чистоте, они неизменно запыляются частичками смятения.\n«Исцеление ума так же важно, как и сохранение здорового тела».\nКрики дураков постепенно стихают вместе с усталостью, он погружается в воду, позволяя мыслям плыть по течению, и разум его постепенно проясняется.\n«Истина ускользает от грязи, только тот, кто чист, может приблизиться к ней».'
    }
  };

  const FUSIONS = {
    f_quintet: { name: 'Заоблачный квинтет', members: ['jingyuan', 'jingliu'], target: 'blast', text: 'Лёд Цзинлю и молния Цзин Юаня по площади. Цзинлю сразу в трансмиграции, Повелителю молний +3 удара.', fx: [{ k: 'dmg', m: 2.2, adj: 1.1, e: 'ice', tough: 30, adjTough: 15, statOf: 'jingliu' }, { k: 'dmg', m: 1.4, adj: 0.7, e: 'elec', tough: 15, adjTough: 10, statOf: 'jingyuan' }, { k: 'transNow' }, { k: 'lordHits', v: 3 }] },
    f_guard: { name: 'Генерал и его меч', members: ['jingyuan', 'yanqing'], target: 'blast', text: 'Молния по площади и ледяной клинок по цели. Яньцину Единение, Повелителю молний +2 удара.', fx: [{ k: 'dmg', m: 1.6, adj: 0.8, e: 'elec', tough: 20, adjTough: 10, statOf: 'jingyuan' }, { k: 'dmg', m: 2.2, e: 'ice', tough: 20, statOf: 'yanqing' }, { k: 'syncTo', v: 'yanqing' }, { k: 'lordHits', v: 2 }] },
    f_divination: { name: 'Комиссия по предсказаниям', members: ['fuxuan', 'qingque'], target: 'all', text: 'Квант по всем. Матрица предвидения на 2 хода, Цинцюэ сразу в Закрытом конге.', fx: [{ k: 'dmg', m: 0, hpM: 0.6, e: 'quant', tough: 15, statOf: 'fuxuan' }, { k: 'dmg', m: 1.2, e: 'quant', tough: 15, statOf: 'qingque' }, { k: 'matrix', turns: 2, statOf: 'fuxuan' }, { k: 'kong' }] },
    f_vidyadhara: { name: 'Видьядхара', members: ['imbibitor', 'bailu'], target: 'blast', text: 'Мнимый удар по площади, 2 Чешуи дракона. Байлу лечит отряд.', fx: [{ k: 'ilStrike', hits: 3, m: 3.0, adj: 1.2, adjFrom: 1, tough: 30, adjTough: 15, statOf: 'imbibitor' }, { k: 'scales', v: 2 }, { k: 'heal', m: 0.12, flat: 30, who: 'allies', statOf: 'bailu' }] },
    f_tenlords: { name: 'Комиссия десяти владык', members: ['huohuo', 'hanya'], target: 'single', text: 'Ханья кладёт Ношу, ветер и физика по цели. Хохо получает Жертвенность жизни, отряду +15 энергии.', fx: [{ k: 'burden', statOf: 'hanya' }, { k: 'dmg', m: 1.6, e: 'phys', tough: 20, statOf: 'hanya' }, { k: 'dmg', m: 0, hpM: 0.6, e: 'wind', tough: 15, statOf: 'huohuo' }, { k: 'provision', statOf: 'huohuo' }, { k: 'energy', v: 15 }] }
  };

  const EV = {
    jingyuan: { name: 'Вихрь небесных копий', title: ['Вихрь', 'небесных копий'], four: ['sushang', 'march', 'tingyun'] },
    luocha: { name: 'Поиски мирского', title: ['Поиски', 'мирского'], four: ['pela', 'qingque', 'yukong'] },
    imbibitor: { name: 'Вспыхнувший радугой морок', title: ['Вспыхнувший', 'радугой морок'], four: ['yukong', 'asta', 'march'] },
    fuxuan: { name: 'Предвиденное и предсказанное', title: ['Предвиденное', 'и предсказанное'], four: ['lynx', 'hook', 'pela'] },
    jingliu: { name: 'Нежность лунного затмения', title: ['Нежность', 'лунного затмения'], four: ['tingyun', 'qingque', 'sampo'] },
    topaz: { name: 'Срок истекает на закате', title: ['Срок истекает', 'на закате'], four: ['guinaifen', 'luka', 'sushang'] },
    huohuo: { name: 'Цветочек во мраке', title: ['Цветочек', 'во мраке'], four: ['danheng', 'arlan', 'serval'] },
    argenti: { name: 'Колючий венец отваги', title: ['Колючий венец', 'отваги'], four: ['hanya', 'lynx', 'asta'] },
    ratio: { name: 'Всё течёт, всё меняется', title: ['Всё течёт,', 'всё меняется'], four: ['sushang', 'natasha', 'hook'] }
  };

  const CONE_EV = {
    jingyuan: { cone: 'beforedawn', title: ['До рассвета', ''], four: ['cone:geniuses', 'cone:memories', 'cone:swordplay'] },
    luocha: { cone: 'coffin', title: ['Эхо из гроба', ''], four: ['cone:postop', 'cone:memories', 'cone:geniuses'] },
    imbibitor: { cone: 'brighter', title: ['Ярче солнца', ''], four: ['cone:underthesky', 'cone:sword_rumor', 'cone:memories'] },
    fuxuan: { cone: 'shuteyes', title: ['Она закрыла', 'глаза'], four: ['cone:trend', 'cone:postop', 'cone:goodnight'] },
    jingliu: { cone: 'ownsword', title: ['Отныне я сама', 'буду мечом'], four: ['cone:underthesky', 'cone:sword_rumor', 'cone:goodnight'] },
    topaz: { cone: 'blissful', title: ['Тревога', 'и блаженство'], four: ['cone:swordplay', 'cone:goodnight', 'cone:geniuses'] },
    huohuo: { cone: 'fright', title: ['Ночь страха', ''], four: ['cone:postop', 'cone:memories', 'cone:trend'] },
    argenti: { cone: 'gaze', title: ['Остановись,', 'мгновенье'], four: ['cone:geniuses', 'cone:swordplay', 'cone:memories'] },
    ratio: { cone: 'baptism', title: ['Крещение', 'чистой мысли'], four: ['cone:swordplay', 'cone:goodnight', 'cone:underthesky'] }
  };

  const MAIL = { id: 'v16_fives', from: H.BRAND.team, title: 'Версия 1.6: девять героев 5★', give: { jade: 300, items: { spass: 10 } }, text: [
    'Уважаемый Первопроходец!',
    'В Прыжок события пришли девять героев 5★: генерал Цзин Юань, Лоча, Дань Хэн: Пожиратель Луны, Фу Сюань, Цзинлю, Хохо, Топаз и Счетовод, Аргенти и Доктор Рацио. У каждого свой баннер со своими тремя героями 4★, а в Прыжке конусов события ждут их сигнатурные конусы.',
    'Героя баннера выбирают в столбике справа: его теперь можно листать стрелками, колесом и клавишами ↑/↓.',
    'Во вложении 10 особых звёздных пропусков и 300 звёздного нефрита.'
  ] };

  const FX = ['lordHits', 'abyssPrayer', 'dispelAll', 'flower', 'ilStrike', 'dracore', 'scales', 'matrix', 'fxCharge', 'syzygy', 'jlDrain', 'transNow', 'tzStrike', 'debt', 'numbyStrike', 'windfall', 'talisman', 'tailRule', 'provision', 'gardenBounce', 'summation', 'inference', 'cogito', 'folly', 'syncTo'];

  const cf = (u, fx, n) => (u && u.cone ? H.coneP(u, fx, n) : 0);
  const mate = (b, id) => b.allies.find(a => a.charId === id && alive(a)) || null;
  const lowest = list => list.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
  const hasBuff = (u, name) => u.buffs.some(b => b.name === name);
  const dropBuff = (u, name) => { u.buffs = u.buffs.filter(b => b.name !== name); };

  Object.assign(H.Battle.prototype, {
    fivesStart() {
      for (const a of this.allies) {
        if (!alive(a)) continue;
        switch (a.charId) {
          case 'jingyuan': if (!this.hasBonus || this.hasBonus(a, 'a4')) this.gainEnergy(a, T.jyEnergy); this.summonLord(a); break;
          case 'imbibitor': if (!this.hasBonus || this.hasBonus(a, 'a2')) this.gainEnergy(a, T.ilEnergy); a.flags.scales = 0; a.flags.tier = 0; a.flags.right = 0; a.flags.roar = 0; break;
          case 'fuxuan': a.flags.fxCharges = T.fxCharges; break;
          case 'jingliu': a.flags.syz = 0; break;
          case 'topaz': this.summonNumby(a); break;
          case 'huohuo': a.flags.prov = !this.hasBonus || this.hasBonus(a, 'a2') ? T.hhStart : 0; a.flags.provN = T.hhTriggers; if (this.kitFx) this.kitFx(a, 'provChanged'); break;
          case 'argenti': a.flags.apo = 0; if (!this.hasBonus || this.hasBonus(a, 'a4')) this.gainEnergy(a, T.agEnemyEnergy * this.living.length); if (this.kitFx) this.kitFx(a, 'apoStart'); break;
          case 'ratio': a.flags.folly = null; if (this.kitFx) this.kitFx(a, 'raStart'); break;
        }
      }
      const fxm = mate(this, 'fuxuan'), luck = fxm && this.kitFx ? this.kitFx(fxm, 'luck') || T.fxDr : T.fxDr;
      if (fxm) for (const a of this.allies) a.buffs.push({ s: 'dr', v: luck, turns: 999, name: LUCK, perm: true });
      this.shutEyesHeal();
    },

    fivesWave() {
      const ag = mate(this, 'argenti');
      if (ag && (!this.hasBonus || this.hasBonus(ag, 'a4'))) this.gainEnergy(ag, T.agEnemyEnergy * this.living.length);
      this.shutEyesHeal();
    },

    shutEyesHeal() {
      for (const w of this.livingAllies) {
        const k = cf(w, 'shuteyes', 3);
        if (!k) continue;
        for (const a of this.livingAllies) if (a.hp < a.maxHp) this.heal(w, a, (a.maxHp - a.hp) * k);
      }
    },

    fivesTech(fx, src) {
      switch (fx) {
        case 'jyTech': this.lordHits(src, T.jyTechHits); return true;
        case 'lcTech': this.openZone(src); return true;
        case 'ilTech':
          for (const e of this.living.slice()) this.hit(src, e, 1.2, { e: 'imag', tough: 10 });
          this.addScales(src, 1);
          return true;
        case 'fxTech': this.matrix(src, 2); return true;
        case 'jlTech':
          for (const e of this.living) this.tryFreeze(src, e, 1);
          this.gainEnergy(src, 15);
          this.syzygy(src, 1);
          return true;
        case 'tzTech': src.flags.tzTech = true; return true;
        case 'hhTech': for (const e of this.living) this.addBuff(e, { s: 'atkP', v: -0.25, turns: 2, name: 'Душа в пятки', debuff: true }); return true;
        case 'agTech':
          for (const e of this.living.slice()) this.hit(src, e, 0.8, { e: 'phys', tough: 10 });
          this.gainEnergy(src, 15);
          return true;
        case 'raTech': for (const e of this.living) this.addBuff(e, { s: 'spdP', v: -0.15, turns: 2, name: 'Изваяние идола', debuff: true }); return true;
      }
      return false;
    },

    fivesFx(f, actor, src, R, hitSet, kind) {
      switch (f.k) {
        case 'lordHits': { const jy = mate(this, 'jingyuan'); if (jy) this.lordHits(jy, f.v); return true; }
        case 'abyssPrayer': this.abyssPrayer(src, R.ally || actor); return true;
        case 'dispelAll':
          for (const t of this.living) {
            const i = t.buffs.findIndex(b => !b.debuff && !b.perm);
            if (i >= 0) { t.buffs.splice(i, 1); this.push({ t: 'status', u: t, text: 'Усиление снято' }); }
            if (t.shield > 0) { t.shield = 0; this.push({ t: 'status', u: t, text: 'Щит снят' }); }
          }
          return true;
        case 'flower': this.addFlower(src); return true;
        case 'ilStrike': this.ilStrike(src, R, f, hitSet, kind); return true;
        case 'dracore': this.dracore(actor); return true;
        case 'scales': { const il = actor.charId === 'imbibitor' ? actor : mate(this, 'imbibitor'); if (il) this.addScales(il, f.v); return true; }
        case 'matrix': this.matrix(src, f.turns); return true;
        case 'fxCharge': {
          src.flags.fxCharges = Math.min(T.fxChargeMax, (src.flags.fxCharges || 0) + 1);
          this.push({ t: 'stack', u: src, key: 'FxHeal', v: src.flags.fxCharges, text: 'Самолечение: ' + src.flags.fxCharges, col: '#c8a8ff' });
          if (!this.hasBonus || this.hasBonus(src, 'a4')) for (const a of this.livingAllies) if (a !== src) this.heal(src, a, src.maxHp * T.fxUltHeal + T.fxUltFlat * H.grow(src.lvl));
          return true;
        }
        case 'syzygy': this.syzygy(actor, f.v); return true;
        case 'jlDrain': this.jlDrain(actor); return true;
        case 'transNow': {
          const jl = mate(this, 'jingliu');
          if (jl) { jl.flags.syz = Math.max(jl.flags.syz || 0, 2); this.enterTrans(jl); this.push({ t: 'stack', u: jl, key: 'Syz', v: jl.flags.syz, col: '#a8d8ff' }); }
          return true;
        }
        case 'tzStrike':
          if (R.main && alive(R.main)) { this.hit(src, R.main, f.m, { e: 'fire', kind: !this.hasBonus || this.hasBonus(src, 'a2') ? 'follow' : 'basic', tough: T.toughBasic, label: 'Дефицит...' }); hitSet.add(R.main); this.blissTame(src, R.main); }
          return true;
        case 'debt': if (R.main && alive(R.main)) this.setDebt(src, R.main); return true;
        case 'numbyStrike': {
          const h = this.numbyOf(src), t = R.main;
          if (h && t && alive(t)) { this.numbyHit(src, h, t, 'skill'); hitSet.add(t); }
          return true;
        }
        case 'windfall': {
          const h = this.numbyOf(src);
          if (h) { h.flags.wind = T.tzWindHits + ((this.kitFx && this.kitFx(src, 'windHits')) || 0); this.push({ t: 'numby', u: h, owner: src, wind: h.flags.wind }); this.push({ t: 'status', u: src, text: WIND, col: '#ffd060' }); }
          return true;
        }
        case 'talisman': this.talisman(src, R.ally || actor); return true;
        case 'tailRule':
          for (const a of this.livingAllies) {
            if (a === src || !a.maxEnergy) continue;
            const hk = this.hhK(src);
            a.energy = Math.min(a.maxEnergy, a.energy + a.maxEnergy * hk.energy);
            this.addBuff(a, { s: 'atkP', v: hk.atk, turns: 2, name: 'Хвост: Духовное господство' }, true);
            this.push({ t: 'status', u: a, text: 'Энергия +' + Math.round(a.maxEnergy * hk.energy), col: '#ffe080' });
          }
          return true;
        case 'provision': { const hh = mate(this, 'huohuo'); if (hh) this.giveProvision(hh); return true; }
        case 'gardenBounce':
          for (let i = 0; i < T.agBounces; i++) {
            const t = this.rng.pick(this.living);
            if (!t) break;
            this.hit(src, t, T.agBounce * ((this.kitFx && this.kitFx(src, 'bounceK')) || 1), { kind, e: 'phys', tough: 5, label: 'Величие', defIgnore: (this.kitFx && this.kitFx(src, 'ultDefIgnore')) || 0 });
            hitSet.add(t);
          }
          return true;
        case 'summation': {
          const t = R.main;
          if (!t || (this.hasBonus && !this.hasBonus(src, 'a2'))) return true;
          const n = Math.min(T.raSumMax + ((this.kitFx && this.kitFx(src, 'sumMax')) || 0), this.debuffCount(t));
          dropBuff(src, 'Обобщение');
          dropBuff(src, 'Обобщение: крит. урон');
          if (n > 0) {
            src.buffs.push({ s: 'critR', v: T.raSumCritR * n, turns: 1, name: 'Обобщение' });
            src.buffs.push({ s: 'critD', v: T.raSumCritD * n, turns: 1, name: 'Обобщение: крит. урон' });
            this.push({ t: 'status', u: src, text: 'Обобщение: ' + n, col: '#d8c8ff' });
          }
          return true;
        }
        case 'inference':
          if (R.main && alive(R.main) && (!this.hasBonus || this.hasBonus(src, 'a4'))) {
            if (this.rng.chance(this.effectChance(src, R.main, 1))) this.addBuff(R.main, { s: 'res', v: -T.raResDown, turns: 2, name: 'Вывод', debuff: true });
            else this.resisted(src);
          }
          return true;
        case 'cogito': {
          const t = R.main;
          if (t && this.rng() < T.raChance + T.raPerDebuff * this.debuffCount(t)) this.followQueue().push({ by: src, t, name: COGITO });
          return true;
        }
        case 'folly': {
          const t = R.main;
          if (!t || !alive(t)) return true;
          for (const e of this.enemies) dropBuff(e, FOLLY);
          src.flags.folly = { t, n: T.raFolly + ((this.kitFx && this.kitFx(src, 'follyN')) || 0) };
          this.addBuff(t, { s: 'folly', v: 0, turns: 999, name: FOLLY, debuff: true });
          if (cf(src, 'baptism', 4)) {
            this.addBuff(src, { s: 'dmgP', v: cf(src, 'baptism', 4), turns: cf(src, 'baptism', 6), name: 'Дискуссия' }, true);
            this.addBuff(src, { s: 'followDefIgnore', v: cf(src, 'baptism', 5), turns: cf(src, 'baptism', 6), name: 'Дискуссия: защита' }, true);
          }
          return true;
        }
        case 'syncTo': { const a = mate(this, f.v); if (a) this.gainSync(a); return true; }
      }
      return false;
    },

    fivesPreview(f, src, actor, R, addHit, k) {
      if (f.k === 'ilStrike' && R.main) {
        const per = f.m / f.hits;
        let st = src.flags.right || 0, roar = src.flags.roar || 0;
        const il = this.ilK(src);
        for (let i = 1; i <= f.hits; i++) {
          if (f.roar && i >= 4) roar = Math.min(T.ilRoarMax, roar + 1);
          addHit(src, R.main, per, { kind: k, e: 'imag', tough: (f.tough || 10) / f.hits, extraBonus: il.right * st - il.right * (src.flags.right || 0), roarAt: roar });
          st = Math.min(il.rightMax, st + il.rightStep);
        }
        if (f.adj) for (const a of R.adj) addHit(src, a, f.adj, { kind: k, e: 'imag', tough: f.adjTough || 0 });
      }
      if (f.k === 'tzStrike' && R.main) addHit(src, R.main, f.m, { kind: !this.hasBonus || this.hasBonus(src, 'a2') ? 'follow' : 'basic', e: 'fire', tough: T.toughBasic });
      if (f.k === 'numbyStrike' && R.main) {
        const h = this.numbyOf(src);
        const nk = this.numbyK(src);
        if (h) addHit(src, R.main, nk.skill + (h.flags.wind > 0 ? nk.wind : 0), { kind: 'follow', e: 'fire', tough: 20, debtNow: true, windCrit: h.flags.wind > 0 ? nk.windCrit : 0 });
      }
      if (f.k === 'gardenBounce') for (const t of this.living) addHit(src, t, T.agBounce * T.agBounces / this.living.length, { kind: k, e: 'phys', tough: 5 });
    },

    fivesAbility(u, kind) {
      if (kind === 'basic' && u.charId === 'imbibitor' && u.flags.tier > 0) return { ab: u.kit.dracore[u.flags.tier - 1], kind: 'enhanced' };
      if (kind === 'skill' && u.charId === 'jingliu' && u.flags.trans) return { ab: u.kit.moon, kind: 'skill' };
      if (kind === 'ult' && u.charId === 'argenti' && u.energy >= u.kit.grand.cost) return { ab: u.kit.grand, kind: 'ult' };
      return null;
    },

    basicLocked(u) { return !!u && u.charId === 'jingliu' && !!u.flags.trans; },

    fivesPay(u, kind, k, ab) {
      if (u.charId === 'jingliu' && u.flags.trans) {
        if (kind === 'basic') return false;
        if (kind === 'skill') return true;
      }
      if (u.charId === 'imbibitor' && kind === 'basic' && k === 'enhanced') {
        const cost = ab.tier || 0, scales = u.flags.scales || 0;
        if (scales + this.sp < cost) return false;
        const fromScale = Math.min(scales, cost);
        u.flags.scales = scales - fromScale;
        this.sp -= cost - fromScale;
        u.flags.leap = cost === 3;
        u.flags.tier = 0;
        if (fromScale) this.push({ t: 'stack', u, key: 'Scale', v: u.flags.scales, text: SCALE + ' −' + fromScale, col: '#7ae8e0' });
        this.push({ t: 'stack', u, key: 'Tier', v: 0 });
        return true;
      }
      return null;
    },

    fivesUltReady(u) {
      if (!u || u.charId !== 'argenti') return null;
      return alive(u) && u.energy >= u.kit.ult.cost && !u.frozen && !(u.flags.collapse > 0) && !u.flags.away && !this.over;
    },

    fivesSpend(u, ab) {
      if (u.charId === 'argenti' && ab && ab.cost) return Math.max(0, u.energy - ab.cost);
      return 0;
    },

    fivesUlt(u) {
      if (this.over) return;
      if (u.charId === 'imbibitor' && this.current !== u) { u.flags.right = 0; u.flags.roar = 0; }
      const hh = mate(this, 'huohuo');
      if (hh && hh.flags.prov > 0 && alive(u)) this.provHeal(hh, u);
      for (const w of this.livingAllies) {
        const k = cf(w, 'fright', 2);
        if (k) { const a = lowest(this.livingAllies); this.heal(w, a, a.maxHp * k); this.frightAtk(w, a); }
      }
      const cof = cf(u, 'coffin', 2);
      if (cof) for (const a of this.livingAllies) this.addBuff(a, { s: 'spd', v: cof, turns: 1, name: 'Эхо из гроба' }, a !== u);
    },

    fivesTurn(u) {
      const lc = mate(this, 'luocha');
      if (u === lc && lc.flags.lcCd > 0) lc.flags.lcCd--;
      const hh = mate(this, 'huohuo');
      if (u === hh && hh.flags.prov > 0) { hh.flags.prov--; this.push({ t: 'stack', u: hh, key: 'Prov', v: hh.flags.prov }); if (this.kitFx) this.kitFx(hh, 'provChanged'); }
      if (hh && hh.flags.prov > 0) this.provHeal(hh, u);
      const tz = mate(this, 'topaz');
      if (tz && !this.debtor()) { const t = this.rng.pick(this.living); if (t) this.setDebt(tz, t); }
      if (u.charId === 'argenti' && (!this.hasBonus || this.hasBonus(u, 'a2'))) this.addApo(u, 1);
    },

    fivesEnd(u) {
      if (u.side !== 'ally') return;
      if (u.charId === 'imbibitor') {
        u.flags.right = 0;
        if (this.kitFx && this.kitFx(u, 'keepRoar')) u.flags.roarKept = true;
        else { u.flags.roar = 0; u.flags.roarKept = false; }
      }
      if (u.charId === 'jingliu' && u.flags.trans && (u.flags.syz || 0) <= 0) this.leaveTrans(u);
      if (u.charId === 'fuxuan' && !this.matrixOn(u)) this.clearKnowledge();
    },

    fivesShare(src, tgt, dmg, e) {
      const fx = mate(this, 'fuxuan');
      if (!fx || tgt === fx || !this.matrixOn(fx) || !hasBuff(tgt, KNOW)) return dmg;
      const part = Math.round(dmg * T.fxShare);
      if (part <= 0) return dmg;
      const K = 200 + 10 * (src.lvl || 1), guard = u => K / (defOf(u) + K) * (1 - Math.min(0.9, sv(u, 'dr')));
      this.hit(src, fx, 0, { raw: Math.max(1, part * guard(fx) / guard(tgt)), isDot: true, e, label: MATRIX });
      return dmg - part;
    },

    fivesHit(src, tgt, o, dmg, before) {
      if (!src || !tgt) return;
      if (tgt.side === 'ally') {
        if (tgt.charId === 'fuxuan' && !alive(tgt)) this.fuxuanDown(tgt);
        if (!alive(tgt)) return;
        if (tgt.hp < before) this.hpDown(tgt, src.side === 'enemy' && !o.isDot);
        return;
      }
      if (src.side !== 'ally' || o.isDot) return;
      const lc = mate(this, 'luocha');
      if (lc && this.zoneOn(lc) && lc.flags.zoneAct !== this.actN) {
        lc.flags.zoneAct = this.actN;
        const g = H.grow(lc.lvl), atk = atkOf(lc), zk = (this.kitFx && this.kitFx(lc, 'zoneK')) || 1;
        if (alive(src)) this.heal(lc, src, atk * T.lcZoneHeal * zk + T.lcZoneFlat * g);
        if (!this.hasBonus || this.hasBonus(lc, 'a4')) for (const a of this.livingAllies) if (a !== src) this.heal(lc, a, atk * T.lcZoneOther + T.lcZoneOtherFlat * g);
      }
      const tz = mate(this, 'topaz');
      if (tz && alive(tgt) && tgt.buffs.some(b => b.s === 'debt') && !o.numby) {
        const h = this.numbyOf(tz);
        const wind = h && h.flags.wind > 0 && OWN.includes(o.kind);
        if (h && this.acting !== h && (o.kind === 'follow' || wind) && h.flags.advAct !== this.actN) {
          h.flags.advAct = this.actN;
          h.av = Math.max(0, h.av - T.tzAdvance * AV / spdOf(h));
          this.push({ t: 'status', u: tz, text: NUMBY + ': вперёд!', col: '#ffd060' });
          this.push(this.orderSnap(this.current));
        }
      }
    },

    hpDown(a, byFoe) {
      for (const w of this.livingAllies) {
        if (w === a || !cf(w, 'ownsword', 2)) continue;
        w.flags.eclipse = Math.min(cf(w, 'ownsword', 2), (w.flags.eclipse || 0) + 1);
        if (w.flags.eclipse >= cf(w, 'ownsword', 2)) this.addBuff(w, { s: 'defIgnore', v: cf(w, 'ownsword', 4), turns: 999, name: 'Лунное затмение: защита' }, true);
      }
      if (cf(a, 'shuteyes', 2)) for (const b of this.livingAllies) this.addBuff(b, { s: 'dmgP', v: cf(a, 'shuteyes', 2), turns: cf(a, 'shuteyes', 5), name: 'Видение' }, true);
      if (a.charId === 'fuxuan' && a.hp <= a.maxHp * 0.5 && (a.flags.fxCharges || 0) > 0) {
        a.flags.fxCharges--;
        this.push({ t: 'status', u: a, text: 'Невзгоды порождают благодать', col: '#c8a8ff' });
        this.heal(a, a, (a.maxHp - a.hp) * ((this.kitFx && this.kitFx(a, 'fxHealK')) || T.fxHeal));
        this.push({ t: 'stack', u: a, key: 'FxHeal', v: a.flags.fxCharges });
      }
      const lc = mate(this, 'luocha');
      if (lc && alive(a) && a.hp <= a.maxHp * T.lcAuto && !(lc.flags.lcCd > 0)) {
        lc.flags.lcCd = T.lcCd;
        this.push({ t: 'act', u: lc, name: 'Молитва цветка бездны', kind: 'auto' });
        this.abyssPrayer(lc, a);
        this.gainEnergy(lc, T.energySkill);
      }
    },

    fivesDmg(src, tgt, o) {
      let v = 0;
      if (src.charId === 'imbibitor') v += this.ilK(src).right * (src.flags.right || 0);
      if (src.charId === 'jingliu' && o.kind === 'ult' && src.flags.trans && (!this.hasBonus || this.hasBonus(src, 'a6'))) v += T.jlUltBonus;
      if (src.charId === 'topaz' && tgt.side === 'enemy' && tgt.weak.includes('fire') && (!this.hasBonus || this.hasBonus(src, 'a4'))) v += T.tzFireWeak;
      if (src.charId === 'argenti' && tgt.hp <= tgt.maxHp * 0.5 && (!this.hasBonus || this.hasBonus(src, 'a6'))) v += T.agLow;
      if (src.charId === 'ratio' && (!this.hasBonus || this.hasBonus(src, 'a6'))) { const n = this.debuffCount(tgt); if (n >= 3) v += Math.min(T.raDeduceMax, T.raDeduce * n); }
      if (src.flags && src.flags.eclipse && cf(src, 'ownsword', 3) && OWN.includes(o.kind)) v += cf(src, 'ownsword', 3) * src.flags.eclipse;
      const gz = cf(src, 'gaze', 2);
      if (gz && o.kind === 'ult') v += gz * Math.min(cf(src, 'gaze', 3), src.maxEnergy || 0);
      if (o.lordSleep) v += o.lordSleep;
      return v;
    },

    fivesCritD(src, tgt, o) {
      let v = 0;
      if (src.charId === 'imbibitor') {
        v += this.ilK(src).roar * (o.roarAt != null ? o.roarAt : src.flags.roar || 0);
        if (tgt.side === 'enemy' && tgt.weak.includes('imag') && (!this.hasBonus || this.hasBonus(src, 'a6'))) v += T.ilImagCritD;
      }
      if (o.lordCrit) v += o.lordCrit;
      if (o.windCrit) v += o.windCrit;
      const bp = cf(src, 'baptism', 2);
      if (bp && tgt.side === 'enemy') v += bp * Math.min(cf(src, 'baptism', 3), this.debuffCount(tgt));
      if (tgt.side === 'enemy') for (const b of tgt.buffs) if (b.s === 'tame') v += b.v;
      if (tgt.side === 'enemy' && o.kind === 'follow') for (const b of tgt.buffs) if (b.s === 'execCrit') v += b.v;
      return v;
    },

    fivesVuln(src, tgt, o) {
      if (tgt.side !== 'enemy' || (o.kind !== 'follow' && !o.debtNow)) return 0;
      let v = 0;
      for (const b of tgt.buffs) if (b.s === 'debt') v += b.v;
      return v;
    },

    fivesAfter(u, kind, hits) {
      const own = OWN.includes(kind);
      if (u.charId === 'argenti' && ['basic', 'skill', 'ult'].includes(kind) && hits.length) {
        this.gainEnergy(u, T.agEnergy * hits.length);
        this.addApo(u, hits.length);
      }
      if (u.charId === 'jingyuan' && (kind === 'skill' || kind === 'ult') && cf(u, 'dawn', 3)) u.flags.somnus = true;
      const cof = cf(u, 'coffin', 3);
      if (cof && own && hits.length) this.gainEnergy(u, cof * Math.min(cf(u, 'coffin', 4), hits.length));
      const br = cf(u, 'brighter', 4);
      if (br && (kind === 'basic' || kind === 'enhanced')) {
        u.flags.dragon = hasBuff(u, 'Зов дракона') ? Math.min(cf(u, 'brighter', 3), (u.flags.dragon || 0) + 1) : 1;
        this.addBuff(u, { s: 'atkP', v: br * u.flags.dragon, turns: cf(u, 'brighter', 2), name: 'Зов дракона' }, true);
        this.addBuff(u, { s: 'err', v: cf(u, 'brighter', 5) * u.flags.dragon, turns: cf(u, 'brighter', 2), name: 'Зов дракона: энергия' }, true);
      }
      if (own && u.flags.eclipse && cf(u, 'ownsword', 2)) { u.flags.eclipse = 0; dropBuff(u, 'Лунное затмение: защита'); }
      if (u.charId === 'jingliu') dropBuff(u, 'Трансмиграция: атака');
      const ra = mate(this, 'ratio'), fol = ra && ra.flags.folly;
      if (fol && u !== ra && own && hits.includes(fol.t) && fol.n > 0) {
        fol.n--;
        this.followQueue().push({ by: ra, t: fol.t, name: COGITO });
        if (fol.n <= 0) { dropBuff(fol.t, FOLLY); ra.flags.folly = null; }
      }
    },

    followQueue() { return this.fivesQueue || (this.fivesQueue = []); },

    fivesFollow() {
      const q = this.followQueue();
      if (!q.length || this.over) return false;
      const job = q.shift();
      const by = job.by;
      if (!alive(by) || !this.living.length) return true;
      const t = alive(job.t) ? job.t : this.rng.pick(this.living);
      const prev = this.acting;
      this.acting = by;
      this.push({ t: 'act', u: by, name: job.name, kind: 'follow' });
      this.hit(by, t, T.raFollow * (by.charId === 'ratio' && this.traceTalent ? this.traceTalent(by) : 1), { e: 'imag', tough: 10, kind: 'follow', label: COGITO });
      this.gainEnergy(by, 5);
      if (this.kitFx && alive(t)) this.kitFx(by, 'cogitoHit', t);
      if (this.su) this.bless('follow', { u: by, hits: [t] });
      this.acting = prev;
      this.cleanup();
      return true;
    },

    fivesSummon(h) {
      if (h.id === 'lord') { this.lordTurn(h); return true; }
      if (h.id === 'numby') { this.numbyTurn(h); return true; }
      return false;
    },

    fivesLeave(h) {
      if (h.id !== 'lord' && h.id !== 'numby') return false;
      if (h.gone) return true;
      h.gone = true;
      this.summons = this.summons.filter(s => s !== h);
      this.push({ t: h.id, u: h, owner: h.owner, on: false });
      this.push(this.orderSnap(this.current));
      return true;
    },

    fivesHoldUlt(u) {
      if (u.charId === 'argenti') return u.energy < u.kit.grand.cost && this.living.length > 2;
      if (u.charId === 'huohuo') return this.livingAllies.length < 2;
      if (u.charId === 'topaz') { const h = this.numbyOf(u); return !h || h.flags.wind > 0; }
      return false;
    },

    fivesAuto(u) {
      const tgt = this.autoTarget(u);
      switch (u.charId) {
        case 'imbibitor': {
          const have = this.sp + (u.flags.scales || 0);
          const want = have >= 3 ? 3 : have >= 2 && (u.flags.scales || 0) > 0 ? 2 : have >= 2 ? 1 : 0;
          if ((u.flags.tier || 0) < want) return this.act('skill', u);
          const t = want >= 2 ? this.living.reduce((a, b) => (this.adjacent(this.living, b).length > this.adjacent(this.living, a).length ? b : a)) : tgt;
          return this.act('basic', t);
        }
        case 'fuxuan': {
          const left = (u.buffs.find(b => b.name === MATRIX) || {}).turns || 0;
          if (this.sp >= 1 && left <= 1) return this.act('skill', u);
          return this.act('basic', tgt);
        }
        case 'jingliu':
          if (u.flags.trans) return this.act('skill', this.living.reduce((a, b) => (this.adjacent(this.living, b).length > this.adjacent(this.living, a).length ? b : a)));
          if (this.sp >= 1) return this.act('skill', tgt);
          return this.act('basic', tgt);
        case 'topaz': {
          const d = this.debtor();
          if (this.sp >= 2 || (this.sp >= 1 && !d)) return this.act('skill', tgt);
          return this.act('basic', d || tgt);
        }
        case 'huohuo': {
          const low = lowest(this.livingAllies), sick = this.livingAllies.find(a => a.buffs.some(b => b.debuff) || a.dots.length);
          if (this.sp >= 1 && (low.hp < low.maxHp * 0.6 || !(u.flags.prov > 0) || sick)) return this.act('skill', sick && low.hp >= low.maxHp * 0.6 ? sick : low);
          return this.act('basic', tgt);
        }
        case 'argenti':
          if (this.sp >= 1 && this.living.length >= 2) return this.act('skill', tgt);
          return this.act('basic', tgt);
        case 'ratio': {
          const t = this.living.reduce((a, b) => (this.debuffCount(b) > this.debuffCount(a) ? b : a));
          if (this.sp >= 1) return this.act('skill', this.debuffCount(t) > 0 ? t : tgt);
          return this.act('basic', this.debuffCount(t) > 0 ? t : tgt);
        }
      }
      return null;
    },

    fivesUltTarget(u) {
      if (u.charId === 'ratio' && this.living.length) return this.living.reduce((a, b) => (b.maxHp > a.maxHp ? b : a));
      return null;
    },

    summonLord(jy) {
      const h = {
        side: 'ally', summon: true, idx: jy.idx, id: 'lord', charId: 'lord', key: 'lord', owner: jy, name: LORD, lvl: jy.lvl, elem: 'elec', path: jy.path,
        base: { spd: T.jySpd }, maxHp: 1, hp: 1, buffs: [], dots: [], shield: 0, shieldT: 0, frozen: 0, stun: 0, taunt: 0, dead: false, gone: false, av: 0, flags: { hits: T.jyBase }, appear: true
      };
      h.av = AV / spdOf(h);
      this.summons.push(h);
      this.push({ t: 'lord', u: h, owner: jy, on: true, hits: h.flags.hits });
    },

    lordOf(jy) { return this.summons.find(s => s.id === 'lord' && s.owner === jy && alive(s)) || null; },

    lordHits(jy, n) {
      const h = this.lordOf(jy);
      if (!h) return;
      const old = spdOf(h);
      h.flags.hits = Math.min(T.jyMax, h.flags.hits + n);
      h.base.spd = T.jySpd + T.jySpdStep * (h.flags.hits - T.jyBase);
      h.av = h.av * old / spdOf(h);
      this.push({ t: 'lord', u: h, owner: jy, hits: h.flags.hits });
      this.push({ t: 'status', u: jy, text: LORD + ': ' + h.flags.hits + ' ударов', col: '#c8a8ff' });
      this.push(this.orderSnap(this.current));
    },

    lordReset(h) {
      h.flags.hits = T.jyBase;
      h.base.spd = T.jySpd;
      h.av = AV / spdOf(h);
      this.push({ t: 'lord', u: h, owner: h.owner, hits: h.flags.hits });
    },

    lordTurn(h) {
      const u = h.owner;
      if (!alive(u)) { this.fivesLeave(h); return; }
      if (u.frozen || u.stun || u.flags.collapse > 0 || u.swallowed) { this.push({ t: 'status', u, text: LORD + ' ждёт генерала' }); h.av = AV / spdOf(h); return; }
      this.acting = h;
      this.hitThisAction = new Set();
      this.actSerial = (this.actSerial || 0) + 1;
      const n = h.flags.hits;
      this.push({ t: 'act', u: h, name: LORD + ' × ' + n, kind: 'summon', hits: n });
      const o = { e: 'elec', kind: 'follow', tough: 5, label: LORD, lordCrit: n >= 6 && (!this.hasBonus || this.hasBonus(u, 'a2')) ? T.jyCritD : 0, lordSleep: 0 };
      const m = T.jyHit * (this.traceTalent ? this.traceTalent(u) : 1), adjK = T.jyAdj + ((this.kitFx && this.kitFx(u, 'lordAdj')) || 0);
      if (u.flags.somnus) { o.lordSleep = cf(u, 'dawn', 3); u.flags.somnus = false; }
      const hits = [];
      for (let i = 0; i < n; i++) {
        const t = this.rng.pick(this.living);
        if (!t || this.over) break;
        const adj = this.adjacent(this.living, t);
        this.hit(u, t, m, o);
        hits.push(t);
        for (const a of adj) if (alive(a)) this.hit(u, a, m * adjK, Object.assign({}, o, { tough: 0 }));
        if (this.kitFx && alive(t)) this.kitFx(u, 'lordHit', t);
      }
      if (this.su && hits.length) this.bless('follow', { u, hits });
      if (this.kitFx) this.kitFx(u, 'lordDone', hits);
      this.acting = null;
      this.cleanup();
      if (this.over) return;
      this.lordReset(h);
      this.followUps();
    },

    summonNumby(tz) {
      const h = {
        side: 'ally', summon: true, idx: tz.idx, id: 'numby', charId: 'numby', key: 'numby', owner: tz, name: NUMBY, lvl: tz.lvl, elem: 'fire', path: tz.path,
        base: { spd: T.tzSpd }, maxHp: 1, hp: 1, buffs: [], dots: [], shield: 0, shieldT: 0, frozen: 0, stun: 0, taunt: 0, dead: false, gone: false, av: 0, flags: { wind: 0 }, appear: true
      };
      h.av = AV / spdOf(h);
      this.summons.push(h);
      this.push({ t: 'numby', u: h, owner: tz, on: true, wind: 0 });
    },

    numbyOf(tz) { return tz ? this.summons.find(s => s.id === 'numby' && s.owner === tz && alive(s)) || null : null; },

    debtor() { return this.living.find(e => e.buffs.some(b => b.s === 'debt')) || null; },

    setDebt(tz, t) {
      if (!alive(t)) return;
      for (const e of this.enemies) if (e !== t) { dropBuff(e, DEBT); e.buffs = e.buffs.filter(b => b.s !== 'execCrit'); }
      this.addBuff(t, { s: 'debt', v: this.numbyK(tz).debt, turns: 999, name: DEBT, debuff: true });
    },

    numbyK(tz) {
      return Object.assign({ skill: T.tzNumby, talent: T.tzNumby, wind: T.tzWind, windCrit: T.tzWindCritD, debt: T.tzDebt, pen: 0 }, (this.kitFx && this.kitFx(tz, 'numbyK')) || {});
    },

    numbyHit(tz, h, t, from) {
      const wind = h.flags.wind > 0, nk = this.numbyK(tz);
      const prev = this.acting;
      this.acting = h;
      this.hit(tz, t, (from === 'skill' ? nk.skill : nk.talent) + (wind ? nk.wind : 0), { e: 'fire', kind: 'follow', tough: 20, label: NUMBY, numby: true, windCrit: wind ? nk.windCrit : 0, resPen: nk.pen });
      this.acting = prev;
      this.blissTame(tz, t);
      if (wind) {
        h.flags.wind--;
        if (!this.hasBonus || this.hasBonus(tz, 'a6')) this.gainEnergy(tz, T.tzStonks);
        this.push({ t: 'numby', u: h, owner: tz, wind: h.flags.wind });
      }
      if (tz.flags.tzTech) {
        tz.flags.tzTech = false;
        tz.energy = Math.min(tz.maxEnergy, tz.energy + T.tzTech);
        this.push({ t: 'status', u: tz, text: 'Дотация: энергия +' + T.tzTech, col: '#ffe080' });
      }
    },

    numbyTurn(h) {
      const tz = h.owner;
      if (!alive(tz)) { this.fivesLeave(h); return; }
      let t = this.debtor();
      if (!t) { t = this.rng.pick(this.living); if (t) this.setDebt(tz, t); }
      if (!t) { h.av = AV / spdOf(h); return; }
      this.hitThisAction = new Set();
      this.actSerial = (this.actSerial || 0) + 1;
      this.push({ t: 'act', u: h, name: h.flags.wind > 0 ? NUMBY + ': ' + WIND : NUMBY, kind: 'summon' });
      if (this.kitFx) this.kitFx(tz, 'numbyTurn');
      this.numbyHit(tz, h, t, 'talent');
      if (this.su) this.bless('follow', { u: tz, hits: [t] });
      if (this.kitFx) this.kitFx(tz, 'numbyDone');
      this.cleanup();
      if (this.over) return;
      h.av = AV / spdOf(h);
      this.followUps();
    },

    blissTame(src, t) {
      const k = cf(src, 'blissful', 3);
      if (!k || !alive(t)) return;
      const cur = t.buffs.find(b => b.s === 'tame');
      const n = Math.min(cf(src, 'blissful', 4), (cur ? Math.round(cur.v / k) : 0) + 1);
      this.addBuff(t, { s: 'tame', v: k * n, turns: 999, name: 'Приручение', debuff: true }, !!cur);
    },

    zoneOn(lc) { return alive(lc) && hasBuff(lc, ZONE); },

    openZone(lc) {
      lc.flags.flowers = 0;
      this.addBuff(lc, { s: 'zone', v: 0, turns: T.lcZoneTurns, name: ZONE });
      this.push({ t: 'stack', u: lc, key: 'Flower', v: 0, col: '#f0d070' });
      if (this.kitFx) this.kitFx(lc, 'zoneOpen');
    },

    addFlower(lc) {
      if (!alive(lc) || lc.charId !== 'luocha') return;
      lc.flags.flowers = Math.min(2, (lc.flags.flowers || 0) + 1);
      this.push({ t: 'stack', u: lc, key: 'Flower', v: lc.flags.flowers, text: FLOWER + ' ' + lc.flags.flowers, col: '#f0d070' });
      if (lc.flags.flowers >= 2) this.openZone(lc);
    },

    abyssPrayer(lc, a) {
      if (!alive(a)) return;
      const pk = (this.kitFx && this.kitFx(lc, 'prayer', a)) || {};
      this.heal(lc, a, (atkOf(lc) * T.lcHeal * (pk.k || 1) + T.lcHealFlat * H.grow(lc.lvl)) * (1 + (pk.heal || 0)));
      if (!this.hasBonus || this.hasBonus(lc, 'a2')) {
        const i = a.buffs.findIndex(b => b.debuff);
        if (i >= 0) { a.buffs.splice(i, 1); this.push({ t: 'status', u: a, text: 'Очищение' }); }
        else if (a.dots.length) { a.dots.shift(); this.push({ t: 'status', u: a, text: 'Очищение' }); }
      }
      if (pk.shield) this.giveShield(a, pk.shield, 2);
      this.addFlower(lc);
    },

    ilStrike(src, R, f, hitSet, kind) {
      const t = R.main;
      if (!t || !alive(t)) return;
      const per = f.m / f.hits, adjHits = f.adj ? f.hits - (f.adjFrom || 1) + 1 : 0, adjPer = adjHits ? f.adj / adjHits : 0;
      const adj = R.adj ? R.adj.slice() : [], il = src.charId === 'imbibitor' ? this.ilK(src) : null;
      const pen = il && src.flags.leap ? il.leapPen : 0;
      if (il) src.flags.leap = false;
      if (pen) src.flags.e6 = 0;
      for (let i = 1; i <= f.hits; i++) {
        if (this.over) break;
        if (f.roar && i >= 4) src.flags.roar = Math.min(T.ilRoarMax, (src.flags.roar || 0) + 1);
        if (alive(t)) { this.hit(src, t, per, { kind, e: 'imag', tough: (f.tough || 10) / f.hits, resPen: pen, label: i > 1 ? 'Удар ' + i : undefined }); hitSet.add(t); }
        if (adjPer && i >= (f.adjFrom || 1)) for (const a of adj) if (alive(a)) { this.hit(src, a, adjPer, { kind, e: 'imag', tough: (f.adjTough || 0) / adjHits, resPen: pen }); hitSet.add(a); }
        if (il) src.flags.right = Math.min(il.rightMax, (src.flags.right || 0) + il.rightStep);
        if (!alive(t) && !adj.some(alive)) break;
      }
      if (src.charId === 'imbibitor') this.push({ t: 'stack', u: src, key: 'Right', v: src.flags.right, text: RIGHT + ' ' + src.flags.right, col: '#7ae8e0' });
    },

    ilK(u) {
      return Object.assign({ right: T.ilRight, roar: T.ilRoar, rightMax: T.ilRightMax, rightStep: 1, leapPen: 0 }, (this.kitFx && this.kitFx(u, 'ilK')) || {});
    },

    dracore(u) {
      const have = this.sp + (u.flags.scales || 0), next = (u.flags.tier || 0) + 1;
      u.flags.tier = next <= 3 && have >= next ? next : 0;
      const ab = u.flags.tier ? u.kit.dracore[u.flags.tier - 1] : u.kit.basic;
      this.push({ t: 'stack', u, key: 'Tier', v: u.flags.tier, text: ab.name, col: '#7ae8e0' });
    },

    addScales(u, n) {
      if (!alive(u) || u.charId !== 'imbibitor') return;
      u.flags.scales = Math.min(T.ilScaleMax, (u.flags.scales || 0) + n);
      this.push({ t: 'stack', u, key: 'Scale', v: u.flags.scales, text: SCALE + ' ' + u.flags.scales, col: '#7ae8e0' });
    },

    matrixOn(fx) { return alive(fx) && hasBuff(fx, MATRIX); },

    matrix(fx, turns) {
      if (!alive(fx) || fx.charId !== 'fuxuan') return;
      if (this.matrixOn(fx) && this.current === fx && (!this.hasBonus || this.hasBonus(fx, 'a2'))) this.gainEnergy(fx, T.fxEnergy);
      this.addBuff(fx, { s: 'matrix', v: 0, turns, name: MATRIX });
      if (this.kitFx) this.kitFx(fx, 'matrixUp');
      const kk = (this.kitFx && this.kitFx(fx, 'knowK')) || 1;
      const own = fx.buffs.find(b => b.name === KNOW), baseMax = fx.maxHp - ((own && own.hpAdd) || 0);
      const add = Math.round(baseMax * T.fxHp * kk);
      for (const a of this.livingAllies) {
        const old = a.buffs.find(b => b.name === KNOW);
        if (old) { this.dropHp(a, old); a.buffs = a.buffs.filter(b => b !== old); }
        a.maxHp += add;
        a.hp += add;
        a.buffs.push({ s: 'critR', v: Math.round(T.fxCrit * kk * 1000) / 1000, turns: 999, name: KNOW, hpAdd: add });
        this.push({ t: 'heal', u: a, v: add, hp: a.hp });
      }
    },

    clearKnowledge() {
      for (const a of this.allies) {
        const k = a.buffs.find(b => b.name === KNOW);
        if (!k) continue;
        this.dropHp(a, k);
        a.buffs = a.buffs.filter(b => b !== k);
      }
    },

    fuxuanDown(fx) {
      dropBuff(fx, MATRIX);
      this.clearKnowledge();
      for (const a of this.allies) dropBuff(a, LUCK);
    },

    syzygy(u, d) {
      if (!u || u.charId !== 'jingliu' || !alive(u)) return;
      const max = u.flags.syzMax || T.jlSyzMax;
      u.flags.syz = Math.max(0, Math.min(max, (u.flags.syz || 0) + d));
      this.push({ t: 'stack', u, key: 'Syz', v: u.flags.syz, text: d > 0 ? SYZ + ' ' + u.flags.syz : null, col: '#a8d8ff' });
      if (!u.flags.trans && u.flags.syz >= 2) this.enterTrans(u);
    },

    enterTrans(u) {
      if (u.flags.trans) return;
      u.flags.trans = true;
      const tk = (this.kitFx && this.kitFx(u, 'transK')) || {};
      u.buffs.push({ s: 'critR', v: tk.crit || T.jlCrit, turns: 999, name: TRANS, perm: true });
      if (this.kitFx) this.kitFx(u, 'transIn');
      this.push({ t: 'trans', u, on: true });
      this.push({ t: 'status', u, text: TRANS, col: '#a8d8ff' });
      if (this.current === u) u.flags.pendingAdvance = (u.flags.pendingAdvance || 0) + 1;
      else { u.av = 0; this.push(this.orderSnap(this.current)); }
    },

    leaveTrans(u) {
      u.flags.trans = false;
      dropBuff(u, TRANS);
      if (this.kitFx) this.kitFx(u, 'transOut');
      this.push({ t: 'trans', u, on: false });
    },

    jlDrain(u) {
      if (!u || u.charId !== 'jingliu' || !u.flags.trans) return;
      let got = 0;
      for (const a of this.livingAllies) {
        if (a === u) continue;
        const c = Math.min(Math.round(a.maxHp * T.jlDrain), a.hp - 1);
        if (c <= 0) continue;
        a.hp -= c;
        got += c;
        this.push({ t: 'dmg', u: a, src: u, v: c, e: 'ice', hp: a.hp, shield: a.shield, label: 'Трансмиграция' });
        if (a.charId === 'blade') this.hpLost(a, c);
        this.hpDown(a, false);
      }
      const tk = (this.kitFx && this.kitFx(u, 'transK')) || {};
      const v = Math.min(tk.cap || T.jlAtkCap, T.jlAtk * got / Math.max(1, u.base.atk)) + ((this.kitFx && this.kitFx(u, 'drainExtra', got)) || 0);
      dropBuff(u, 'Трансмиграция: атака');
      if (v > 0) u.buffs.push({ s: 'atkP', v, turns: 999, name: 'Трансмиграция: атака' });
    },

    hhK(hh) {
      return Object.assign({ skill: 1, talent: 1, energy: T.hhEnergy, atk: T.hhAtk, turns: 0 }, (this.kitFx && this.kitFx(hh, 'hhK')) || {});
    },

    giveProvision(hh) {
      hh.flags.prov = Math.max(hh.flags.prov || 0, T.hhTurns + this.hhK(hh).turns);
      hh.flags.provN = T.hhTriggers;
      this.push({ t: 'stack', u: hh, key: 'Prov', v: hh.flags.prov, text: PROV, col: '#9af0c8' });
      if (this.kitFx) this.kitFx(hh, 'provChanged');
    },

    talisman(hh, a) {
      if (!alive(a)) return;
      const g = H.grow(hh.lvl), sk = this.hhK(hh).skill;
      const i = a.buffs.findIndex(b => b.debuff);
      if (i >= 0) { a.buffs.splice(i, 1); this.push({ t: 'status', u: a, text: 'Очищение' }); }
      else if (a.dots.length) { a.dots.shift(); this.push({ t: 'status', u: a, text: 'Очищение' }); }
      this.hhHeal(hh, a, hh.maxHp * T.hhHeal * sk + T.hhHealFlat * g);
      const list = this.livingAllies, k = list.indexOf(a);
      for (const n of [list[k - 1], list[k + 1]]) if (n) this.hhHeal(hh, n, hh.maxHp * T.hhAdj * sk + T.hhAdjFlat * g);
      this.giveProvision(hh);
    },

    hhHeal(hh, a, v) {
      const got = this.heal(hh, a, v);
      this.frightAtk(hh, a);
      return got;
    },

    frightAtk(w, a) {
      const k = cf(w, 'fright', 3);
      if (!k || !alive(a)) return;
      a.flags.fright = hasBuff(a, 'Ночь страха') ? Math.min(cf(w, 'fright', 4), (a.flags.fright || 0) + 1) : 1;
      this.addBuff(a, { s: 'atkP', v: k * a.flags.fright, turns: cf(w, 'fright', 5), name: 'Ночь страха' }, true);
    },

    provHeal(hh, u) {
      if (!(hh.flags.provN > 0) || !alive(u) || u.side !== 'ally' || u.summon) return;
      hh.flags.provN--;
      const g = H.grow(hh.lvl), v = hh.maxHp * T.hhTalent * this.hhK(hh).talent + T.hhTalentFlat * g;
      const list = new Set([u, ...this.livingAllies.filter(a => a.hp <= a.maxHp * 0.5)]);
      for (const a of list) {
        this.hhHeal(hh, a, v);
        const i = a.buffs.findIndex(b => b.debuff);
        if (i >= 0) { a.buffs.splice(i, 1); this.push({ t: 'status', u: a, text: 'Очищение' }); }
      }
      if (!this.hasBonus || this.hasBonus(hh, 'a6')) this.gainEnergy(hh, 1);
      this.push({ t: 'stack', u: hh, key: 'ProvN', v: hh.flags.provN });
    },

    addApo(u, n) {
      if (!alive(u)) return;
      const before = u.flags.apo || 0;
      const ak = Object.assign({ per: T.agApo, max: T.agApoMax }, (this.kitFx && this.kitFx(u, 'apoK')) || {});
      u.flags.apo = Math.min(ak.max, before + n);
      dropBuff(u, APO);
      if (u.flags.apo > 0) u.buffs.push({ s: 'critR', v: Math.round(ak.per * u.flags.apo * 10000) / 10000, turns: 999, name: APO, perm: true });
      if (this.kitFx) this.kitFx(u, 'apoChanged');
      if (u.flags.apo !== before) this.push({ t: 'stack', u, key: 'Apo', v: u.flags.apo, col: '#ff8a8a' });
    }
  });

  Object.assign(H.CHARS, KITS);
  Object.assign(H.CONES, CONES);
  H.coneInit(CONES);
  Object.assign(H.FUSIONS, FUSIONS);
  if (H.BANNERS) { Object.assign(H.BANNERS.ev.stars, EV); Object.assign(H.BANNERS.cone.stars, CONE_EV); }
  if (H.SPEAKERS) H.SPEAKERS.topaz = { name: 'Топаз', char: 'topaz' };
  if (H.MAIL && !H.MAIL.some(m => m.id === MAIL.id)) H.MAIL.push(MAIL);
  H.FIVES = { KITS, CONES, FUSIONS, FX, EV, CONE_EV, MAIL, IDS: Object.keys(KITS) };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
