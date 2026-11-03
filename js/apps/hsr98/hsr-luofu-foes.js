(function (H) {
  'use strict';
  const E = o => Object.assign({ hp: 1, atk: 1, spd: 95, tough: 20, weak: [], resist: [], exp: 1, credits: 1, drops: [] }, o);
  const alive = u => u && !u.dead && !u.gone && u.hp > 0;
  const WEAK = ['elec', 'wind', 'imag'], RESIST = ['phys', 'fire', 'ice', 'quant'];
  const ROOTS = e => ({ n: 'Спутанные корни', t: 'single', m: 1.4, e, fx: [{ k: 'delay', v: 0.3 }] });
  const KALPA = { n: 'Приближение кальпы', t: 'lock', next: 2, text: 'Фантилия выбрала цель! Лотосы Разрушения цветут. Пробейте или уничтожьте их!' };

  const FOES = {
    dracolion: E({ name: 'Зачарованное изобретение: покорный лев-дракон', fam: 'ingenium', shape: 'dracolion', col: ['#7c2a1c', '#ffb060'], hp: 0.6, spd: 90, tough: 10, weak: ['wind', 'imag'], exp: 0.9, credits: 1,
      skills: [{ n: 'Львиный рык', w: 2, t: 'single', m: 1.0, e: 'fire', fx: [{ k: 'debuff', s: 'dmgDealtDown', v: 0.15, turns: 2, name: 'Бессилие', chance: 0.7 }] }, { n: 'Бессилие', w: 1, t: 'single', m: 0.8, e: 'fire' }], gift: 'jadeSmall' }),
    dragonfish: E({ name: 'Зачарованное изобретение: светящаяся рыба-дракон', fam: 'ingenium', shape: 'dragonfish', col: ['#1e4a6a', '#ffd060'], hp: 0.85, spd: 100, tough: 20, weak: ['phys', 'elec', 'imag'], exp: 1, credits: 1.1,
      deathBlast: { pct: 0.4, name: 'Пламя свечи', e: 'fire' },
      skills: [{ n: 'Ночное сияние', w: 1, t: 'all', m: 0.65, e: 'fire' }], gift: 'jadeSmall' }),
    cloudtoad: E({ name: 'Зачарованное изобретение: облачная золотая жаба', fam: 'ingenium', shape: 'cloudtoad', col: ['#8a6a24', '#f4d48a'], hp: 0.6, spd: 90, tough: 10, weak: ['elec', 'quant'], exp: 0.9, credits: 1.2,
      skills: [{ n: 'Туман', w: 1, t: 'single', m: 1.0, e: 'imag', fx: [{ k: 'debuff', s: 'spdP', v: -0.12, turns: 2, name: 'Плотный туман', chance: 0.7 }] }], gift: 'jadeSmall' }),
    patroller: E({ name: 'Дозорный Облачных Рыцарей', fam: 'patrol', shape: 'patroller', col: ['#2a3e6a', '#c8d8f0'], hp: 0.95, atk: 1.05, spd: 118, tough: 20, weak: ['fire', 'wind', 'imag'], exp: 1.1, credits: 1.2,
      skills: [{ n: 'Облачное лезвие', w: 1, t: 'single', m: 1.15, e: 'wind' }], gift: 'medkit' }),
    kafka_b: E({ name: 'Охотники за Стелларонами: Кафка', fam: 'boss', shape: 'kafka_b', col: ['#3a1640', '#c070e0'], boss: true, hp: 9, atk: 1.6, spd: 119, tough: 150, weak: ['phys', 'wind', 'imag'], resist: ['elec'], exp: 10, credits: 8, noContact: true,
      skills: [{ n: 'Полуночный шум', t: 'single', m: 1.3, e: 'elec', fx: [{ k: 'dot', type: 'shock', m: 0.35, turns: 3, chance: 0.8 }] }, { n: 'Ласковый лунный свет', t: 'blast', m: 1.25, e: 'elec' }, { n: 'Безмолвная острая насмешка', t: 'all', m: 0.85, e: 'elec' }, { n: 'Пауза', t: 'charge', next: 4, text: 'Кафка наклоняется и что-то шепчет. Пробейте её, пока Шёпот духа не прозвучал!' }, { n: 'Шёпот духа', t: 'self', fx: [{ k: 'lfDominate', self: true, turns: 2 }] }],
      pat: [0, 1, 3, 0, 2, 3, 1, 0, 2] }),
    ebon: E({ name: 'Чёрный олень Изобилия', fam: 'boss', shape: 'ebon', col: ['#16121e', '#ffd060'], boss: true, hp: 8.5, atk: 1.75, spd: 108, tough: 140, weak: ['fire', 'ice', 'quant'], resist: ['elec', 'wind'], exp: 12, credits: 9, noContact: true,
      skills: [{ n: 'Удар рогами', t: 'single', m: 1.35, e: 'elec' }, { n: 'Топот копыт', t: 'all', m: 0.72, e: 'wind' }, { n: 'Рост ветвей', t: 'summon', summon: ['twig_wind', 'twig_fruit'], max: 3 }, { n: 'Сбор плодов', t: 'charge', next: 4, text: 'Чёрный олень пригибает рога. Плоды на ветвях наливаются силой!' }, { n: 'Наскок оленя', t: 'all', m: 1.1, e: 'elec', lfFruit: true }],
      pat: [2, 0, 3, 1, 2, 0, 3, 1] }),
    ebon_r: E({ name: 'Чёрный олень Изобилия', fam: 'boss', shape: 'ebon', col: ['#16121e', '#ffd060'], boss: true, hp: 3, atk: 1.75, spd: 108, tough: 140, weak: ['fire', 'ice', 'quant'], resist: ['elec', 'wind'], exp: 12, credits: 9, noContact: true,
      skills: [{ n: 'Удар рогами', t: 'single', m: 1.35, e: 'elec' }, { n: 'Топот копыт', t: 'all', m: 0.72, e: 'wind' }, { n: 'Рост ветвей', t: 'summon', summon: ['twig_wind', 'twig_fruit'], max: 3 }, { n: 'Сбор плодов', t: 'charge', next: 4, text: 'Чёрный олень пригибает рога. Плоды на ветвях наливаются силой!' }, { n: 'Наскок оленя', t: 'all', m: 1.1, e: 'elec', lfFruit: true }],
      pat: [2, 0, 3, 1, 2, 0, 3, 1] }),
    twig_wind: E({ name: 'Ветвь зимнего ветра', fam: 'twig', shape: 'twig_wind', col: ["#1a1420","#9ad8f0"], hp: 0.55, spd: 88, tough: 30, weak: ['fire', 'ice', 'quant'], exp: 0.2, credits: 0.2, noContact: true,
      skills: [{ n: 'Зимний ветер', t: 'self', fx: [{ k: 'lfDominate', self: true, turns: 1, name: 'Ярость' }] }, { n: 'Шелест', t: 'single', m: 0.7, e: 'wind' }], pat: [1, 0] }),
    twig_leaf: E({ name: 'Ветвь жёлтой листвы', fam: 'twig', shape: 'twig_leaf', col: ["#1a1420","#e0b458"], hp: 0.55, spd: 88, tough: 30, weak: ['fire', 'ice', 'quant'], exp: 0.2, credits: 0.2, noContact: true,
      lfCounter: { m: 0.45 }, skills: [{ n: 'Жёлтая листва', w: 1, t: 'single', m: 0.75, e: 'wind' }] }),
    twig_bloom: E({ name: 'Ветвь пышного цветения', fam: 'twig', shape: 'twig_bloom', col: ["#1a1420","#ff9ac8"], hp: 0.55, spd: 88, tough: 30, weak: ['fire', 'ice', 'quant'], exp: 0.2, credits: 0.2, noContact: true,
      skills: [{ n: 'Пышное цветение', w: 1, t: 'self', fx: [{ k: 'lfHealLord', self: true, m: 0.05 }] }] }),
    twig_fruit: E({ name: 'Ветвь обильных плодов', fam: 'twig', shape: 'twig_fruit', col: ["#1a1420","#ffa860"], hp: 0.55, spd: 88, tough: 30, weak: ['fire', 'ice', 'quant'], exp: 0.2, credits: 0.2, noContact: true,
      lfFruitTwig: true, skills: [{ n: 'Обильные плоды', w: 1, t: 'single', m: 0.6, e: 'elec' }] }),
    alchemist: E({ name: 'Ученик Санктус Медикус: Внутренний алхимик', fam: 'abomination', shape: 'alchemist', col: ['#3a2a4a', '#d8ff60'], hp: 0.8, spd: 96, tough: 20, weak: ['phys', 'imag'], exp: 1.1, credits: 1.1,
      skills: [{ n: 'Посев ядра', t: 'charge', next: 1, text: 'Внутренний алхимик сеет ядро. Следующим ходом оно взорвётся!' }, { n: 'Взрыв ядра', t: 'blast', m: 1.35, e: 'elec' }, { n: 'Разряд', t: 'single', m: 0.9, e: 'elec' }],
      pat: [2, 0, 2, 0], gift: 'jadeSmall' }),
    ballista: E({ name: 'Ученик Санктус Медикус: Баллистарий', fam: 'abomination', shape: 'ballista', col: ['#2a3a3a', '#d8ff60'], hp: 0.7, atk: 1.15, spd: 104, tough: 30, weak: ['phys', 'ice', 'wind'], exp: 1.1, credits: 1.2,
      skills: [{ n: 'Выстрел станкового арбалета', w: 1, t: 'single', m: 1.25, e: 'elec' }], gift: 'jadeSmall' }),
    lupus: E({ name: 'Зверь Изобилия: Древесный волк', fam: 'abomination', shape: 'lupus', col: ['#2e3a24', '#b8e070'], hp: 0.9, spd: 100, tough: 30, weak: ['fire', 'wind', 'imag'], exp: 1.1, credits: 1.1,
      skills: [{ n: 'Волчий аппетит', w: 4, t: 'single', m: 1.2, e: 'elec', fx: [{ k: 'dot', type: 'shock', m: 0.3, turns: 3, chance: 0.7 }] }, { n: 'Вой призыва', w: 1, t: 'summon', summon: ['lupus'], max: 3 }], gift: 'jadeSmall' }),
    ghound: E({ name: 'Зверь Изобилия: Золотая гончая', fam: 'abomination', shape: 'ghound', col: ['#6a4a1c', '#ffd878'], hp: 0.75, atk: 1.1, spd: 118, tough: 30, weak: ['ice', 'elec', 'quant'], exp: 1.1, credits: 1.2, lfRebound: 0.3,
      skills: [{ n: 'Мощь рога', w: 1, t: 'single', m: 1.35, e: 'wind' }], gift: 'jadeSmall' }),
    danshu: E({ name: 'Вознёсшаяся (Мастер Дань Шу)', spoiler: true, fam: 'boss', shape: 'danshu', col: ['#1e2e24', '#c8ffb0'], boss: true, hp: 6.5, atk: 1.7, spd: 120, tough: 140, weak: ['phys', 'ice', 'elec'], resist: ['wind'], exp: 10, credits: 8, noContact: true,
      skills: [{ n: 'Шипы древа', t: 'single', m: 1.3, e: 'wind', fx: [{ k: 'dot', type: 'shear', m: 0.35, turns: 3, chance: 0.9 }] }, { n: 'Ведущее дыхание', t: 'blast', m: 1.15, e: 'wind', fx: [{ k: 'dot', type: 'shear', m: 0.3, turns: 3, chance: 0.9 }] }, { n: 'Обряд древесного превращения', t: 'all', m: 0.7, e: 'wind' }, { n: 'Ритуал покорения праны', t: 'charge', next: 4, text: 'Дань Шу входит в Джапу. Следующим действием она вытянет прану из всего отряда!' }, { n: 'Поглощение чёрной праны', t: 'all', m: 0.85, e: 'wind', fx: [{ k: 'debuff', s: 'healIn', v: -0.5, turns: 2, name: 'Высасывание праны', chance: 1 }] }],
      pat: [0, 1, 3, 2, 0, 3, 1, 2] }),
    yanqing_b: E({ name: 'Лейтенант Облачных Рыцарей: Яньцин', fam: 'boss', shape: 'yanqing_b', col: ['#1e3a6a', '#a8e0ff'], boss: true, hp: 10, atk: 1.5, spd: 120, tough: 160, weak: ['elec', 'wind', 'imag'], resist: ['ice'], exp: 10, credits: 8, noContact: true,
      skills: [{ n: 'Ветер восхищения', t: 'single', m: 1.25, e: 'ice' }, { n: 'Возвращение ласточек', t: 'summon', summon: ['flysword', 'flysword', 'flysword'], max: 3, fx: [{ k: 'lfSwords', self: true }] }, { n: 'Водяной отблеск меча', t: 'single', m: 1.35, e: 'ice', fx: [{ k: 'freeze', chance: 0.6 }] }, { n: 'Баллада о пробитии строя', t: 'blast', m: 1.2, e: 'ice' }, { n: 'Заострённая кромка', t: 'charge', next: 5, text: 'Яньцин замирает, лезвие покрывается инеем. Пробейте его, пока удар не упал!' }, { n: 'Каскад небесной реки', t: 'all', m: 1.55, e: 'ice' }],
      pat: [1, 0, 2, 4, 5, 3, 0, 2, 4, 5] }),
    flysword: E({ name: 'Порхающий меч', fam: 'sword', shape: 'flysword', col: ['#1e3a6a', '#c8f0ff'], hp: 0.5, spd: 100, tough: 10, weak: ['elec', 'wind', 'imag'], exp: 0.2, credits: 0.2, noContact: true, lfSword: true,
      skills: [{ n: 'Огранка нефрита', w: 1, t: 'single', m: 0.9, e: 'ice' }] }),
    ape: E({ name: 'Зверь Изобилия: Могучий примат', fam: 'abomination', shape: 'ape', col: ['#1e2e24', '#ffd060'], elite: true, hp: 6, atk: 1.7, spd: 112, tough: 120, weak: ['fire', 'ice', 'wind'], resist: ['quant'], exp: 4, credits: 5,
      skills: [{ n: 'Гневный рёв', t: 'lock', next: 2, text: 'Могучий примат ревёт и выбирает цель!' }, { n: 'Свирепое величие', t: 'self', fx: [{ k: 'lfSelfBuff', self: true, s: 'atkP', v: 0.2, turns: 2, name: 'Свирепое величие' }] }, { n: 'Удар обезьяны', t: 'single', m: 1.7, e: 'quant' }, { n: 'Прилив сил', t: 'blast', m: 1.05, e: 'quant' }, { n: 'Истощение', t: 'self', fx: [{ k: 'lfSelfBuff', self: true, s: 'defP', v: -0.3, turns: 1, name: 'Истощение' }] }],
      pat: [3, 1, 0, 4, 3, 1, 0, 4], gift: 'relic' }),
    ascended: E({ name: 'Вознёсшаяся', fam: 'abomination', shape: 'danshu', col: ['#1e2e24', '#c8ffb0'], elite: true, hp: 4.6, atk: 1.35, spd: 110, tough: 100, weak: ['phys', 'ice', 'elec'], resist: ['wind'], exp: 3.5, credits: 3, gift: 'relic',
      skills: [{ n: 'Ритуал покорения праны', w: 2, t: 'single', m: 1.45, e: 'wind' }, { n: 'Поглощение чёрной праны', w: 1, t: 'all', m: 0.85, e: 'wind', fx: [{ k: 'debuff', s: 'healIn', v: -0.3, turns: 2, name: 'Поглощение', chance: 0.7 }] }] }),
    spectral: E({ name: 'Спектральная посланница-ауруматон', fam: 'ingenium', shape: 'spectral', col: ['#2a1a58', '#b8a0ff'], elite: true, hp: 4.8, atk: 1.3, spd: 100, tough: 100, weak: ['phys', 'fire', 'quant'], resist: ['imag'], exp: 3.5, credits: 3, gift: 'relic',
      skills: [{ n: 'Удар створкой', w: 2, t: 'single', m: 1.5, e: 'imag' }, { n: 'Цепи', w: 1, t: 'blast', m: 1.0, e: 'imag', fx: [{ k: 'debuff', s: 'spdP', v: -0.15, turns: 2, name: 'Цепи', chance: 0.8 }] }] }),
    aurumaton: E({ name: 'Ауруматон-привратник', fam: 'ingenium', shape: 'aurumaton', col: ['#1a2a58', '#58f0e0'], elite: true, hp: 5.5, atk: 2.5, spd: 92, tough: 100, weak: ['elec', 'wind', 'quant'], resist: ['imag'], exp: 6, credits: 5,
      skills: [{ n: 'Удар створкой', t: 'single', m: 1.3, e: 'imag' }, { n: 'Цепи', t: 'blast', m: 1.0, e: 'imag', fx: [{ k: 'debuff', s: 'spdP', v: -0.15, turns: 2, name: 'Цепи', chance: 0.8 }] }, { n: 'Снижение', t: 'single', m: 0.9, e: 'imag', fx: [{ k: 'debuff', s: 'dmgDealtDown', v: 0.2, turns: 2, name: 'Снижение', chance: 0.8 }] }, { n: 'Режим кары', t: 'charge', next: 4, text: 'Ауруматон закрывает створки. Пробейте его, пока кара не обрушилась!' }, { n: 'Кара', t: 'all', m: 1.5, e: 'imag' }],
      pat: [0, 1, 3, 0, 2, 3], gift: 'relic' }),
    mara: E({ name: 'Поражённый Марой солдат', fam: 'abomination', shape: 'mara', col: ['#2a3a36', '#9affc8'], hp: 0.72, spd: 92, tough: 20, weak: ['fire', 'ice', 'quant'], exp: 1.1, credits: 1.1,
      rebirth: { hp: 0.5, text: 'Омоложение' },
      skills: [{ n: 'Подавление', w: 3, t: 'single', m: 1.1, e: 'wind', fx: [{ k: 'dot', type: 'shear', m: 0.3, turns: 3, chance: 0.6 }] }, { n: 'Перерождение', w: 1, t: 'single', m: 1.25, e: 'wind' }], gift: 'jadeSmall' }),
    shifter: E({ name: 'Ученик Санктус Медикус: Оборотень', fam: 'abomination', shape: 'shifter', col: ['#1e2438', '#c8a0ff'], elite: true, lord: true, hp: 6.5, atk: 1.9, spd: 104, tough: 120, weak: ['ice', 'wind', 'imag'], resist: ['elec'], exp: 3.2, credits: 4,
      drain: { pct: 0.05, text: 'Иссушение энергии' },
      skills: [{ n: 'Удар грома', t: 'single', m: 1.35, e: 'elec' }, { n: 'Карательный разряд', t: 'blast', m: 1.05, e: 'elec' }, { n: 'Мара-призыв', t: 'summon', summon: ['mara', 'mara'], max: 3, fx: [{ k: 'hpCost', v: 0.1, self: true }] }, { n: 'Накопление грома', t: 'charge', next: 4, text: 'Оборотень копит молнии! Пробейте его, пока удар не упал.' }, { n: 'Глухое бедствие', t: 'single', m: 2.1, e: 'elec' }],
      pat: [2, 0, 1, 3, 0, 1], gift: 'relic' }),
    lf_undying1: E({ name: 'Фантилия Неумирающая', fam: 'boss', shape: 'phantylia', col: ['#2a3a2a', '#9af0b0'], boss: true, hp: 7, atk: 1.7, spd: 120, tough: 160, weak: WEAK, resist: RESIST, exp: 10, credits: 8, noContact: true,
      skills: [{ n: 'Ачхата: Формирование ветра', t: 'single', m: 1.5, e: 'wind' }, { n: 'Смахивание мирской пыли', t: 'all', m: 0.9, e: 'wind' }, ROOTS('wind'), { n: 'Бурное цветение', t: 'summon', summon: ['lotus_ab', 'lotus_ab'], max: 2 }],
      pat: [3, 0, 1, 2, 0, 3, 1, 2] }),
    lf_undying2: E({ name: 'Фантилия Неумирающая', fam: 'boss', shape: 'phantylia', col: ['#1e1630', '#c08aff'], boss: true, hp: 8, atk: 1.9, spd: 120, tough: 160, weak: WEAK, resist: RESIST, exp: 12, credits: 10, noContact: true,
      skills: [{ n: 'Ачхата: Раскатный гром', t: 'single', m: 1.7, e: 'elec' }, KALPA, { n: 'Парение звёзд и осколки луны', t: 'all', m: 1.3, e: 'elec', lockBonus: 1.3 }, ROOTS('elec'), { n: 'Парение звёзд и осколки луны', t: 'all', m: 1.1, e: 'elec' }],
      pat: [4, 0, 1, 3, 0, 1] }),
    lf_undying3: E({ name: 'Фантилия Неумирающая', fam: 'boss', shape: 'phantylia', col: ['#141024', '#ffd08a'], boss: true, hp: 9, atk: 1.9, spd: 165, tough: 180, weak: WEAK, resist: RESIST, exp: 14, credits: 12, noContact: true,
      skills: [{ n: 'Гнев', t: 'blast', m: 1.3, e: 'imag' }, KALPA, { n: 'Метаморфоза корней истины', t: 'all', m: 1.4, e: 'imag', lockBonus: 1.2 }, ROOTS('imag'), { n: 'Бурное цветение', t: 'summon', summon: ['lotus_ab', 'lotus_de'], max: 3 }],
      pat: [0, 1, 3, 0, 4, 1] })
  };
  for (const [id, e] of Object.entries(FOES)) e.id = id;
  Object.assign(H.ENEMIES, FOES);

  H.CONTACT.abomination = { name: 'Поражённые Марой', react: { threat: 'angry', cute: 'angry', science: 'scared', sing: 'happy', kind: 'happy', joke: 'angry', weird: 'scared', bribe: 'none', silent: 'none' },
    lines: { eager: 'Существо замирает, будто вспомнило что-то, и роняет к ногам обломок доспеха.', happy: 'Существо опускает руки и глядит куда-то сквозь тебя.', angry: 'Существо бросается вперёд! С ним больше не договориться.', scared: 'Существо пятится и прижимается к стене.', none: 'Существо не слышит тебя. Мара не оставила ему ничего, что могло бы услышать.' } };
  H.TRACE_FOE_OF_FAMILY.abomination = 'scion';
  H.TRACE_FOE_OF_FAMILY.ingenium = 'artifex';
  H.CONTACT.sword = { name: 'Порхающие мечи', react: { threat: 'none', cute: 'none', science: 'none', sing: 'none', kind: 'none', joke: 'none', weird: 'none', bribe: 'none', silent: 'none' }, lines: { eager: 'Меч вздрагивает в воздухе.', happy: 'Меч вздрагивает в воздухе.', angry: 'Меч срывается с места.', scared: 'Меч вздрагивает в воздухе.', none: 'Меч слушает только волю Яньцина.' } };
  H.CONTACT.twig = { name: 'Ветви Древа', react: { threat: 'none', cute: 'none', science: 'scared', sing: 'none', kind: 'none', joke: 'none', weird: 'scared', bribe: 'none', silent: 'none' }, lines: { eager: 'Ветвь качается и роняет плод.', happy: 'Листья шелестят в ответ.', angry: 'Ветвь хлещет наугад.', scared: 'Ветвь вздрагивает и съёживается.', none: 'Ветви всё равно. Она просто растёт.' } };
  H.CONTACT.ingenium = { name: 'Зачарованные изобретения', react: { science: 'eager', cute: 'happy', kind: 'happy', sing: 'happy', threat: 'angry', joke: 'none', weird: 'scared', bribe: 'none', silent: 'none' },
    lines: { eager: 'Механизм щёлкает, раскрывает панель и выдаёт вам деталь.', happy: 'Изобретение моргает огоньками и отступает.', angry: 'Изобретение скрежещет и бросается на вас!', scared: 'Изобретение пятится и путается в собственных проводах.', none: 'Изобретение крутит головой и не видит ничего, кроме своей программы.' } };
  H.CONTACT.patrol = { name: 'Дозорные', react: { threat: 'angry', cute: 'none', science: 'none', sing: 'scared', kind: 'none', joke: 'angry', weird: 'scared', bribe: 'angry', silent: 'none' },
    lines: { eager: 'Дозорный на миг приходит в себя и роняет бирку.', happy: 'Дозорный опускает клинок и смотрит сквозь вас.', angry: 'Дозорный шагает вперёд! Шёпот ещё держит его.', scared: 'Дозорный вздрагивает, как от дурного сна.', none: 'Дозорный слушает только чужой голос.' } };

  Object.assign(H.ENCOUNTERS, {
    lf_mara1: { enemies: ['mara:33', 'mara:33', 'mara:33'], noFlee: true, bg: 'lf_port' },
    lf_shifter: { enemies: ['shifter:36'], noFlee: true, bg: 'lf_port' },
    lf_ingenium: { enemies: ['dracolion:40', 'dragonfish:40', 'dragonfish:40', 'cloudtoad:40'], noFlee: true, bg: 'lf_art' },
    lf_deer1: { enemies: ['ebon_r:43'], boss: true, noFlee: true, bg: 'lf_art', music: 'deer', lf: { deerRebirth: { n: 2, text: 'Возрождение' }, beats: [
      { on: 'start', say: ['Мастер Гуншу: ...Что это за монстр?', 'Тинъюнь: ...Поразительно, оно создаёт жизнь. Какая невероятная мощь...', 'Вельт: Эта штука охраняет Печь и корни Древа амброзии...'] },
      { on: 'rebirth', n: 1, say: ['Март 7: Посмотрите оленю на копыта - из-под них пробиваются новые корни!'] }
    ] } },
    lf_deer2: { enemies: ['ebon:43'], boss: true, noFlee: true, bg: 'lf_art', music: 'deer', lf: { deerPhase: { at: 0.5, cover: 1, low: 0.1, adds: ['twig_bloom', 'twig_leaf'] }, beats: [
      { on: 'phase', say: ['Март 7: Что? Персики? Что-то есть захотелось...', 'Вельт: Март!', 'Март 7: Да я шучу! Но будет жалко, если они передавятся.'] },
      { on: 'low', say: ['Март 7: Он слабеет! Скорее, разделаемся с ним!'] }
    ] } },
    lf_dh_delve: { enemies: ['mara:38', 'mara:38', 'mara:38'], noFlee: true, bg: 'lf_art', lfTrials: { heroes: ['danheng', 'sushang', 'luocha'], min: 38 }, lf: {} },
    lf_disciple: { waves: [['mara:43'], ['lupus:43', 'lupus:43', 'ghound:43'], ['ghound:43', 'ballista:43', 'lupus:43']], noFlee: true, bg: 'lf_alch', lf: { beats: [
      { on: 'start', say: ['Тяжелораненый рыцарь: Уходите... Скорее...', 'Тяжелораненый рыцарь: Я больше не могу сдерживаться...'] },
      { on: 'wave', n: 2, say: ['Адепт Учеников Санктус Медикус: Жизни маложивущих видов так коротки. К чему искать смерти?'] },
      { on: 'wave', n: 3, say: ['Адепт Учеников Санктус Медикус: Зачем вы прибыли на Сяньчжоу? Чтобы найти бессмертие?', 'Адепт Учеников Санктус Медикус: Вам не нужно потакать прихотям Цзин Юаня! Ученики Санктус Медикус могут исполнить все ваши желания!'] }
    ] } },
    lf_danshu: { waves: [['alchemist:44', 'ballista:44', 'ballista:44', 'ghound:44'], ['ballista:44', 'danshu:45', 'alchemist:44']], boss: true, noFlee: true, bg: 'lf_mist', lf: { beats: [
      { on: 'wave', n: 2, say: ['Дань Шу: Верховная провидица, позвольте показать вам, что в своё время натворили небесные жители.', 'Дань Шу: Милостивая Медикус, услышь мой зов!'] }
    ] } },
    lf_legion: { waves: [['reaver:45', 'reaver:45', 'eliminator:45', 'eliminator:45'], ['baryon:45', 'baryon:45', 'reaver:45', 'antibaryon:45'], ['reaver:45', 'trampler:45', 'eliminator:45']], noFlee: true, bg: 'lf_mist', lf: { beats: [
      { on: 'start', say: ['???: Благодетели, позвольте представиться ещё раз...', '???: Я - Лорд Опустошитель Фантилия.', 'Фантилия: У меня единственная цель: увидеть, как Сяньчжоу уничтожит сам себя!', 'Март 7: Госпожа Тинъюнь на самом деле - Лорд Опустошитель Легиона Антиматерии? К-как это возможно?!', 'Фу Сюань: Сохраняйте спокойствие! Мы не можем терять самообладание в такой ответственный момент!'] },
      { on: 'wave', n: 3, say: ['Фантилия: Вам повезло, что Зефиро и Оростелла не обратили свой взор на Сяньчжоу.', 'Фантилия: Они и не против посеять Разрушение собственными руками.', 'Фантилия: Поскольку этот ваш упрямый генерал вынудил меня выйти на сцену, я позабочусь о том, чтобы устроить шоу.', 'Фантилия: Помнится, у меня назначена встреча с Древом амброзии. Приношу извинения за то, что так скоро ухожу, но я уверена, что мои друзья будут рады... развлечь вас.'] }
    ] } },
    lf_yanqing: { enemies: ['yanqing_b:45'], boss: true, noFlee: true, bg: 'lf_sea', music: 'gleaming', endAt: 0.5, lfTrials: { heroes: ['imbibitor', 'blade'], min: 45 }, lf: { must: 'imbibitor', autoAlly: 'blade', beats: [
      { on: 'start', say: ['Яньцин: Я о тебе слышал, Пожиратель Луны...', 'Яньцин: Сначала на Сяньчжоу проникли Охотники за Стелларонами, теперь - изгнанный преступник...', 'Дань Хэн: Мне не нужны конфликты. Я пришёл убедиться в том, что мои друзья в безопасности.', 'Яньцин: Прибереги свои оправдания для Дома кандалов.', 'Дань Хэн: С дороги!'] },
      { on: 'bossTurn', n: 2, say: ['Блэйд: Ха-ха, уже лучше. Но боюсь, друзей своих ты не увидишь.', 'Блэйд: Они заняты собственной ожесточённой борьбой.', 'Яньцин: Молчать! Ты тоже никуда не уйдёшь!', 'Блэйд: Неужели? Ну, тогда добавим жару. Кафка!', 'Кафка: Блэйдик, послушай. Высвободи Мару.', 'Блэйд: Значит, начнём.'] },
      { on: 'bossTurn', n: 4, say: ['Яньцин: Сдавайтесь!', 'Блэйд: В чём дело? Боишься ранить мальчика?', 'Дань Хэн: (Интересно, в порядке ли остальные?..)', 'Дань Хэн: (Нужно поторопиться...)'] },
      { on: 'swords', say: ['Яньцин: С вами двумя слишком много проблем...', 'Яньцин: У меня не осталось другого выбора...', 'Блэйд: Знакомый почерк...', 'Блэйд: Это она тебя научила?', 'Блэйд: Тогда не жди пощады!'] },
      { on: 'formBreak', say: ['Дань Хэн: (Нельзя больше ждать...)', 'Дань Хэн: Я не хочу никого ранить, но выбора нет. Простите меня.'] }
    ] } },
    lf_rainhall: { waves: [['antibaryon:45', 'antibaryon:45', 'antibaryon:45', 'distorter:45'], ['reaver:45', 'reaver:45', 'distorter:45', 'distorter:45'], ['reaver:45', 'reaver:45', 'trampler:45', 'baryon:45']], noFlee: true, bg: 'lf_sea', lfTrials: { heroes: ['trail', 'march', 'jingyuan', 'imbibitor'], min: 45 }, lf: {} },
    lf_ape: { enemies: ['ape:46', 'lupus:45'], noFlee: true, bg: 'lf_sea' },
    lf_gate: { enemies: ['mara:39', 'alchemist:38', 'alchemist:38'], noFlee: true, bg: 'lf_div' },
    lf_aurumaton: { enemies: ['aurumaton:41'], noFlee: true, bg: 'lf_div' },
    lf_bailu: { enemies: ['mara:38', 'mara:38'], noFlee: true, bg: 'lf_night' },
    lf_patrol: { enemies: ['patroller:36', 'patroller:36', 'patroller:36'], noFlee: true, bg: 'lf_ship' },
    lf_kafka: { enemies: ['kafka_b:38', 'patroller:36', 'patroller:36'], boss: true, noFlee: true, bg: 'lf_ship', music: 'kafka', endAt: 0.25 },
    lf_dh_mara: { enemies: ['mara:40'], noFlee: true, bg: 'lf_port', lfTrials: { heroes: ['danheng', 'sushang'], min: 34 }, lf: { allyFloor: true } },
    lf_dh_shifter: { enemies: ['shifter:34'], noFlee: true, bg: 'lf_port', lfTrials: { heroes: ['danheng', 'sushang', 'luocha'], min: 34 }, lf: {} }
  });

  H.ENCOUNTERS.lf_phantylia = {
    waves: [['lf_undying1:48'], ['lf_undying2:48', 'lotus_de:46', 'lotus_de:46'], ['lf_undying3:48', 'lotus_ab:46', 'lotus_de:46', 'lotus_ab:46', 'lotus_de:46']],
    boss: true, noFlee: true, bg: 'lf_roots', music: 'pedu1', trials: ['jingyuan'], endAt: 0.01,
    lf: {
      must: 'jingyuan',
      waveMusic: { 1: 'pedu2', 2: 'pedu3' },
      assist: { name: 'Рёв небесного гимна', max: 120, act: 10, kill: 10, pct: 0.268, tough: 40, e: 'imag' },
      beats: [
        { on: 'start', say: ['Фантилия: Благодетели, узрите это прекрасное тело... Чудеса Изобилия полностью оправдывают своё имя.', 'Фантилия: Посмотрим, на что оно способно.', 'Фантилия: Я использую ту самую силу, что даровала Сяньчжоу долголетие, дабы принести Разрушение!', 'Цзин Юань: Фантилия завладела силой Древа...', 'Цзин Юань: Вы займитесь фантомными цветами, а я разберусь с «телом».'] },
        { on: 'skill', say: ['Фантилия: Вы из кожи вон лезете, но все ваши старания тщетны.', 'Фантилия: Это тело - порождение Древа. А вы всего лишь жалкие насекомые.'] },
        { on: 'skill', n: 'Смахивание мирской пыли', say: ['Март 7: Какой сильный ветер!', 'Вельт: Март, берегись!'] },
        { on: 'skill', n: 'Спутанные корни', say: ['Фантилия: Удачи в попытках выбраться.', 'Цзин Юань: Меня печалят сорные травы в моём саду.', 'Фантилия: Твоё высокомерие тебя погубит.'] },
        { on: 'roar', say: ['Фантилия: Что? Наследник Постоянства?', 'Фантилия: Ты наконец вспомнил о своём долге охранять Древо?'] },
        { on: 'mustUlt', say: ['Цзин Юань: Фантилия, идеи иссякли?'] },
        { on: 'bossTurn', n: 1, fx: ['snare', 'assistFull'], say: ['Фантилия: Генерал Сяньчжоу, переживёт ли твоя немощность сие великое бедствие?', 'Цзин Юань: Дань Хэн... твой черёд.', 'Дань Хэн: Думаешь, это конец, Фантилия?', 'Используйте Рёв небесного гимна, чтобы нанести удар Фантилии: клавиша G.'] },
        { on: 'bossTurn', n: 2, fx: ['energyFull'], say: ['Призовите Повелителя молний и уничтожьте цветы, созданные Фантилией.'] },
        { on: 'wave', n: 2, say: ['Фантилия: Раздавить муравья огромной звездой - милосердно.', 'Фантилия: Вселенная закончится Разрушением, а вместе с ней исчезнут Изобилие и Охота...'] },
        { on: 'wave', n: 3, say: ['Цзин Юань: Всё ещё считаешь нас насекомыми, Фантилия?', 'Цзин Юань: Ты так старалась нас уничтожить и не преуспела... Что же подумают остальные Опустошители?', 'Фантилия: Кажется, тебе не терпится с ними познакомиться... Но не выйдет.'] }
      ]
    }
  };

  const DOMINATE_HIT = 0.8;
  const B = H.Battle.prototype;
  const base = { step: B.step, ult: B.ult, ultReady: B.ultReady, start: B.start, spawnWave: B.spawnWave, enemyTurn: B.enemyTurn, startTurn: B.startTurn, onZero: B.onZero, afterAction: B.afterAction, cleanup: B.cleanup, hit: B.hit, riseWarn: B.riseWarn, autoStep: B.autoStep, echoSelfFx: B.echoSelfFx };

  Object.assign(B, {
    step() {
      base.step.call(this);
      this.lfAutoAct();
    },

    ult(u, target) {
      const r = base.ult.call(this, u, target);
      if (r && this.lf && this.lf.must === u.charId) this.lfBeat('mustUlt');
      return r;
    },

    ultReady(u) {
      if (this.lf && u && this.lf.autoAlly === u.charId && !this.lfAutoNow) return false;
      return base.ultReady.call(this, u);
    },

    lfAutoAct() {
      const a = this.lf && this.lf.autoAlly, u = a && this.current;
      if (!u || u.charId !== a || !this.canAct() || u.side !== 'ally') return;
      this.lfAutoNow = true;
      if (this.ultReady(u)) this.ult(u, this.autoTarget(u));
      this.lfAutoNow = false;
      if (this.canAct() && this.current === u) this.act('basic', this.autoTarget(u));
    },

    start() {
      if (this.lf) this.lfBeat('start');
      return base.start.call(this);
    },

    spawnWave(first) {
      base.spawnWave.call(this, first);
      if (this.lf && !first) {
        const track = this.lf.waveMusic && this.lf.waveMusic[this.wave];
        if (track) this.push({ t: 'lfmusic', id: track });
        this.lfBeat('wave', this.wave + 1);
      }
    },

    enemyTurn(u) {
      base.enemyTurn.call(this, u);
      const dr = u.data.drain;
      if (dr && alive(u) && !this.over && this.living.some(e => e !== u && e.data.rebirth && !e.flags.reborn)) {
        const v = Math.round(u.maxHp * dr.pct);
        u.hp = Math.min(u.maxHp, u.hp + v);
        this.push({ t: 'heal', u, v, hp: u.hp });
        this.push({ t: 'text', text: dr.text + ': пока рядом стоят солдаты, он тянет из них силы.', warn: true });
      }
      if (!this.lf || this.over || !u.data.boss) return;
      this.lfTurns = (this.lfTurns || 0) + 1;
      this.lfBeat('bossTurn', this.lfTurns);
    },

    startTurn(u) {
      const r = base.startTurn.call(this, u);
      if (u.side === 'enemy' && u.flags.lfCover > 0) u.flags.lfCover--;
      if (u.side !== 'ally' || r === 'dead' || r === 'skip' || !alive(u) || !u.buffs.some(b => b.s === 'lfDominate')) return r;
      const pool = this.livingAllies.filter(a => a !== u && !a.flags.away), t = pool.length ? this.rng.pick(pool) : null, by = this.living[0];
      this.push({ t: 'act', u, name: u.buffs.find(b => b.s === 'lfDominate').name, kind: 'enemy' });
      if (t && by) { this.acting = by; this.hitThisAction = new Set(); this.hit(by, t, 0, { raw: Math.round(u.base.atk * DOMINATE_HIT), e: 'elec', label: 'Подчинение' }); this.acting = null; }
      return 'skip';
    },

    lfBeat(on, n) {
      const done = this.lfDone || (this.lfDone = new Set());
      for (const b of this.lf.beats || []) {
        if (b.on !== on || (b.n != null && b.n !== n) || done.has(b)) continue;
        done.add(b);
        for (const fx of b.fx || []) this.lfFx(fx);
        for (const text of b.say || []) this.push({ t: 'text', text, hold: 1.5 });
      }
    },

    lfFx(fx) {
      const must = this.allies.find(a => a.charId === this.lf.must);
      if (fx === 'assistFull') this.lfGauge = this.lf.assist.max;
      else if (fx === 'snare' && alive(must)) { must.stun = 1; this.push({ t: 'status', u: must, text: 'Поглощение чёрной праны', debuff: true }); }
      else if (fx === 'energyFull' && alive(must)) this.gainEnergy(must, must.maxEnergy);
    },

    assistGain(v) {
      const a = this.lf && this.lf.assist;
      if (a) this.lfGauge = Math.min(a.max, (this.lfGauge || 0) + v);
    },

    assistReady() {
      const a = this.lf && this.lf.assist;
      return !!a && this.canAct() && (this.lfGauge || 0) >= a.max;
    },

    assistUse() {
      if (!this.assistReady()) return false;
      const a = this.lf.assist, src = this.current, boss = this.living.find(e => e.data.boss);
      this.lfGauge = 0;
      this.acting = src;
      this.hitThisAction = new Set();
      this.push({ t: 'act', u: src, name: a.name, kind: 'assist' });
      this.lfBeat('roar');
      const raw = (boss || this.living[0]).maxHp * a.pct;
      for (const e of this.living.slice()) this.hit(src, e, 0, { raw, e: a.e, tough: a.tough, anyTough: true, label: a.name });
      this.acting = null;
      this.cleanup();
      this.inputBack();
      return true;
    },

    hit(src, tgt, m, o) {
      const cover = tgt.flags && (tgt.flags.lfCover > 0 || tgt.flags.lfForm);
      const t0 = tgt.tough;
      if (cover) tgt.tough = t0 + 100000;
      const r = base.hit.call(this, src, tgt, m, o);
      if (cover) tgt.tough = t0;
      const c = tgt.data && tgt.data.lfCounter;
      if (c && src && src.side === 'ally' && !tgt.dead && !this.lfCountering && !(o && (o.isDot || o.dot)) && alive(src)) {
        this.lfCountering = true;
        this.push({ t: 'status', u: tgt, text: 'Контрудар', col: '#e0b458' });
        base.hit.call(this, tgt, src, 0, { raw: Math.round(tgt.data.lfCounter.m * tgt.base.atk), e: 'wind', label: 'Контрудар' });
        this.lfCountering = false;
      }
      return r;
    },

    riseWarn(u, sk, charged) {
      if (this.lf && u.data.boss) this.lfBeat('skill', sk.n);
      if (sk.lfFruit) {
        const n = this.living.filter(e => e.data.lfFruitTwig).length;
        if (n) { this.addBuff(u, { s: 'atkP', v: 0.25 * n, turns: 1, name: 'Плоды' }); this.push({ t: 'text', text: 'Ветвей с плодами: ' + n + '. Наскок оленя сильнее на ' + n * 25 + '%.', warn: true }); }
      }
      return base.riseWarn.call(this, u, sk, charged);
    },

    lfDeerStep() {
      const ph = this.lf && this.lf.deerPhase, boss = ph && this.living.find(e => e.data.boss);
      if (!boss) return;
      if (boss.flags.lfCover > 0 && boss !== this.lfCoverAt) this.lfCoverAt = boss;
      if (!boss.flags.lfPhase && boss.hp <= boss.maxHp * ph.at) {
        boss.flags.lfPhase = true;
        boss.flags.lfCover = ph.cover;
        this.addBuff(boss, { s: 'defP', v: 0.4, turns: 2, name: 'Растительный покров' });
        this.push({ t: 'status', u: boss, text: 'Растительный покров', col: '#58c87a' });
        this.push({ t: 'text', text: 'Покров держит прочность оленя один ход. Из-под копыт поднимаются новые ветви.', warn: true });
        for (const id of ph.adds) if (this.living.length < 4) this.spawnFoe(id, Math.max(1, boss.lvl - 2), boss);
        this.lfBeat('phase');
      }
      if (boss.hp <= boss.maxHp * ph.low) this.lfBeat('low');
    },

    onZero(tgt, src) {
      const dr = this.lf && this.lf.deerRebirth;
      if (dr && tgt.side === 'enemy' && tgt.data.boss) {
        tgt.flags.rebirths = (tgt.flags.rebirths || 0) + 1;
        tgt.hp = tgt.maxHp;
        tgt.dots = [];
        tgt.buffs = tgt.buffs.filter(b => !b.debuff);
        tgt.broken = false;
        tgt.tough = tgt.maxTough;
        this.push({ t: 'revive', u: tgt, hp: tgt.hp, text: dr.text });
        this.lfBeat('rebirth', tgt.flags.rebirths);
        if (tgt.flags.rebirths >= dr.n) this.lfRetreat = true;
        return;
      }
      const rb = tgt.side === 'enemy' && tgt.data.rebirth;
      if (rb && !tgt.flags.reborn) {
        tgt.flags.reborn = true;
        tgt.hp = Math.round(tgt.maxHp * rb.hp);
        tgt.dots = [];
        tgt.buffs = tgt.buffs.filter(b => !b.debuff);
        this.push({ t: 'revive', u: tgt, hp: tgt.hp, text: rb.text });
        return;
      }
      base.onZero.call(this, tgt, src);
      if (tgt.side === 'enemy' && tgt.dead && tgt.data.lfSword && !this.living.some(e => e.data.lfSword)) {
        const lord = this.living.find(e => e.flags.lfForm);
        if (lord) {
          lord.flags.lfForm = false;
          lord.buffs = lord.buffs.filter(b => b.name !== 'Строй мечей');
          lord.hp = Math.max(1, lord.hp - Math.round(lord.maxHp * 0.1));
          this.push({ t: 'status', u: lord, text: 'Строй мечей разрушен', col: '#a8e0ff' });
          this.push({ t: 'text', text: 'Мечи пали: Яньцин теряет здоровье и скорость, его прочность снова уязвима.', warn: true });
          if (this.lf) this.lfBeat('formBreak');
        }
      }
      const rebound = tgt.side === 'enemy' && tgt.dead && tgt.data.lfRebound;
      if (rebound) { for (const e of this.living) this.advance(e, rebound); if (this.living.length) this.push({ t: 'text', text: 'Отражённый вой: звери рядом ходят раньше.' }); }
      const blast = tgt.side === 'enemy' && tgt.dead && tgt.data.deathBlast;
      if (blast && this.livingAllies.length) { const t = this.rng.pick(this.livingAllies); this.hit(tgt, t, 0, { raw: Math.round(tgt.maxHp * blast.pct), e: blast.e, label: blast.name }); }
      if (tgt.side === 'enemy' && tgt.dead && tgt.data.lord) for (const e of this.living) if (e.data.rebirth) { e.dead = true; e.rewarded = true; this.push({ t: 'kill', u: e }); }
      if (this.lf && tgt.side === 'enemy' && tgt.dead && tgt.data.fam === 'lotus') this.assistGain(this.lf.assist.kill);
    },

    afterAction(u, kind, hitSet) {
      base.afterAction.call(this, u, kind, hitSet);
      if (this.lf && this.lf.assist && u.side === 'ally' && (kind === 'basic' || kind === 'skill')) this.assistGain(this.lf.assist.act);
    },

    cleanup() {
      if (this.lf && !this.over) {
        if (this.lfRetreat) { this.finish(true); return; }
        this.lfDeerStep();
        if (this.lf.allyFloor && this.allies.some(a => a.dead)) { this.finish(true); return; }
        const must = this.allies.find(a => a.charId === this.lf.must);
        if (must && must.dead) { this.finish(false); return; }
      }
      base.cleanup.call(this);
    },

    echoSelfFx(u, f) {
      if (f.k === 'lfSelfBuff') {
        this.addBuff(u, { s: f.s, v: f.v, turns: f.turns, name: f.name });
        this.push({ t: 'status', u, text: f.name, col: '#ffd060' });
        return true;
      }
      if (f.k === 'lfSwords') {
        u.flags.lfForm = true;
        this.addBuff(u, { s: 'spd', v: 50, turns: 99, name: 'Строй мечей' });
        this.push({ t: 'status', u, text: 'Строй мечей', col: '#a8e0ff' });
        this.push({ t: 'text', text: 'Пока мечи живы, Яньцин быстрее и его прочность не падает. Сначала мечи.', warn: true });
        if (this.lf) this.lfBeat('swords');
        return true;
      }
      if (f.k === 'lfHealLord') {
        const lord = this.living.find(e => e.data.boss) || u, v = Math.round(lord.maxHp * f.m);
        lord.hp = Math.min(lord.maxHp, lord.hp + v);
        this.push({ t: 'heal', u: lord, v });
        return true;
      }
      if (f.k === 'lfDominate') {
        const pool = this.livingAllies.filter(a => !a.flags.away), t = pool.length ? pool.reduce((a, b) => (b.base.atk > a.base.atk ? b : a)) : null;
        if (t) {
          const nm = f.name || 'Подчинение';
          this.addBuff(t, { s: 'lfDominate', v: 0, turns: f.turns, name: nm, debuff: true });
          this.push({ t: 'status', u: t, text: nm, debuff: true });
          this.push({ t: 'text', text: f.name ? t.name + ' теряет голову от ярости. Снимите ослабление или уничтожьте ветвь.' : t.name + ' слышит только голос Кафки. Снимите ослабление или дождитесь, пока оно пройдёт.', warn: true });
        }
        return true;
      }
      if (f.k === 'hpCost') { u.hp = Math.max(1, u.hp - Math.round(u.maxHp * f.v)); this.push({ t: 'text', text: u.name + ' платит за призыв своим здоровьем.' }); return true; }
      return base.echoSelfFx.call(this, u, f);
    },

    autoStep() {
      if (this.assistReady()) return this.assistUse();
      return base.autoStep.call(this);
    }
  });

  const baseStart = H.Game.prototype.startBattle;
  H.Game.prototype.lfTrialParty = function (t) {
    const s = this.state, keys = (s.guest ? s.guest.party : s.party).filter(k => s.roster[k]);
    const avg = keys.length ? Math.round(keys.reduce((a, k) => a + s.roster[k].lvl, 0) / keys.length) : t.min;
    const lvl = Math.max(t.min, avg);
    return t.heroes.map(h => {
      const id = h === 'trail' ? this.kitOf('trail') : h, st = this.baseStats(id, lvl, 0);
      return { key: 'trial:' + id, charId: id, name: h === 'trail' ? s.name : undefined, lvl, stats: st, hp: st.hp, energy: Math.round(H.CHARS[id].energy * 0.5), trial: true, tr: this.traceTrialSpec ? this.traceTrialSpec(id, lvl) : null, eid: 0 };
    });
  };

  H.Game.prototype.startBattle = function (o) {
    const e0 = o.encId && H.ENCOUNTERS[o.encId];
    if (e0 && e0.lfTrials) o = Object.assign({}, o, { party: this.lfTrialParty(e0.lfTrials) });
    const b = baseStart.call(this, o), enc = o.encId && H.ENCOUNTERS[o.encId];
    if (enc && enc.lf) b.lf = enc.lf;
    return b;
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
