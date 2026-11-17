(function (HO) {
  'use strict';
  const H = globalThis.Hsr98 || {};
  const pathOf = id => (H.PATHS && H.PATHS[id]) || { name: id, aggro: 100 };
  const elemOf = id => (H.ELEMENTS && H.ELEMENTS[id]) || { name: id, col: '#c0c0c0', dark: '#606060' };

  HO.RACES = {
    human: { id: 'human', name: 'Люди', one: 'Человек', start: 'base' },
    foxian: { id: 'foxian', name: 'Лисий народ', one: 'Из лисьего народа', start: 'supply' }
  };
  HO.RACE_IDS = Object.keys(HO.RACES);

  const path = (id, o) => Object.assign({ id, name: pathOf(id).name, threat: pathOf(id).aggro / 100 }, o);
  HO.PATHS = {
    destruction: path('destruction', { role: 'Защитник', resource: 'rage', elems: ['phys'] }),
    abundance: path('abundance', { role: 'Целитель', resource: 'path', elems: ['imag'] }),
    erudition: path('erudition', { role: 'Боец', resource: 'path', elems: ['fire', 'ice'] })
  };
  HO.PATH_IDS = Object.keys(HO.PATHS);
  HO.pathColor = id => elemOf(HO.PATHS[id].elems[0]).col;
  HO.pathDark = id => elemOf(HO.PATHS[id].elems[0]).dark;

  HO.RESOURCES = { rage: 'Ярость', path: 'Сила Пути', energy: 'Энергия' };

  HO.PATH_STATS = {
    destruction: { hp: [60, 18], atk: [12, 3], def: [120, 12], pool: null },
    abundance: { hp: [45, 12], atk: [10, 2.5], def: [70, 8], pool: [100, 20] },
    erudition: { hp: [40, 11], atk: [13, 3.5], def: [60, 6], pool: [110, 22] }
  };

  const F = (o) => Object.assign({ hp: 1, atk: 1, tough: 20, elite: false }, o);
  HO.FOES = {
    baryon: F({ name: 'Барион', fam: 'spawn', shape: 'orb', col: ['#5a5a6a', '#e0e0ff'], hp: 0.7, weak: ['phys', 'ice', 'quant', 'imag'], skills: [{ n: 'Толчок', m: 0.9, e: 'quant' }] }),
    antibaryon: F({ name: 'Антибарион', fam: 'voidranger', shape: 'orb2', col: ['#3a3450', '#ffb040'], hp: 0.7, tough: 10, weak: ['phys', 'quant'], skills: [{ n: 'Истребление', m: 1.0, e: 'imag' }] }),
    reaver: F({ name: 'Рейнджер пустоты: Захватчик', fam: 'voidranger', shape: 'ranger', col: ['#3a2450', '#c060ff'], weak: ['phys', 'ice', 'imag'], skills: [{ n: 'Рассекающий удар', m: 1.1, e: 'phys' }, { n: 'Поглощение пустоты', m: 1.5, e: 'quant' }] }),
    eliminator: F({ name: 'Рейнджер пустоты: Уничтожитель', fam: 'voidranger', shape: 'ranger2', col: ['#2a2a4a', '#ff4a8a'], hp: 0.85, weak: ['phys', 'wind', 'quant'], skills: [{ n: 'Выстрел аннигиляции', m: 1.2, e: 'quant' }, { n: 'Залп', m: 0.8, e: 'quant' }] }),
    distorter: F({ name: 'Рейнджер пустоты: Исказитель', fam: 'voidranger', shape: 'ranger3', col: ['#24223a', '#ff4ad8'], hp: 0.9, weak: ['wind', 'imag'], skills: [{ n: 'Удар бесследной пустоты', m: 1.7, e: 'quant' }] }),
    weaver: F({ name: 'Мнимый ткач', fam: 'spawn', shape: 'weaver', col: ['#2a2418', '#ffd23a'], hp: 0.95, weak: ['phys', 'elec', 'quant'], skills: [{ n: 'Луч гимна', m: 1.0, e: 'imag' }, { n: 'Эхо гимна', m: 0.8, e: 'imag' }] }),
    trampler: F({ name: 'Рейнджер пустоты: Подавитель', fam: 'voidranger', shape: 'beast', col: ['#2a1a3a', '#a040ff'], elite: true, hp: 4, atk: 1.3, tough: 60, weak: ['ice', 'fire', 'imag'], skills: [{ n: 'Сокрушительный топот', m: 0.7, e: 'phys' }, { n: 'Разящий рог', m: 1.5, e: 'quant' }] }),
    trotter: F({ name: 'Свинка-копилка пространства', fam: 'trotter', shape: 'trotter', col: ['#e8c040', '#fff0a0'], hp: 1.6, atk: 0.2, tough: 30, weak: ['phys', 'fire', 'ice', 'elec', 'wind', 'quant', 'imag'], skills: [{ n: 'Хрюк' }] }),
    flamespawn: F({ name: 'Отродье пламени', fam: 'spawn', shape: 'spawn', col: ['#8a2a10', '#ff8a30'], hp: 0.8, weak: ['ice', 'wind'], skills: [{ n: 'Язык пламени', m: 1.1, e: 'fire' }] }),
    juvsting: F({ name: 'Незрелый жаложук', fam: 'swarm', shape: 'sting', col: ['#1e4a6a', '#ffc830'], hp: 0.85, weak: ['fire', 'ice', 'imag'], skills: [{ n: 'Укол жала', m: 1.1, e: 'phys' }, { n: 'Мнимый рой', m: 0.8, e: 'imag' }] }),
    gnawsting: F({ name: 'Коррозийный жаложук', fam: 'swarm', shape: 'sting2', col: ['#2a4a24', '#a8ff50'], hp: 1.25, atk: 1.1, tough: 30, weak: ['fire', 'wind', 'quant'], skills: [{ n: 'Разъедающий укус', m: 0.95, e: 'imag' }, { n: 'Кислотный выброс', m: 0.6, e: 'imag' }] }),
    gnawsting_e: F({ name: 'Коррозийный жаложук', base: 'gnawsting', fam: 'swarm', shape: 'sting2', col: ['#2a4a24', '#a8ff50'], elite: true, hp: 4, atk: 1.1, tough: 60, weak: ['fire', 'wind', 'quant'], skills: [{ n: 'Разъедающий укус', m: 0.95, e: 'imag' }, { n: 'Кислотный выброс', m: 0.6, e: 'imag' }] }),
    warden: F({ name: 'Смотритель питомника', fresh: true, fam: 'mech', shape: 'warden', col: ['#3a4a5a', '#7ad8ff'], elite: true, boss: true, hp: 10, atk: 1.4, tough: 120, weak: ['phys', 'fire', 'imag'], skills: [{ n: 'Удар манипулятором', m: 1.0, e: 'phys' }, { n: 'Чистка', m: 1, e: 'fire' }, { n: 'Стерилизация', m: 1, e: 'fire' }] }),
    culture: F({ name: 'Разросшаяся культура', fresh: true, fam: 'culture', shape: 'culture', col: ['#2a4a2a', '#c8ff70'], elite: true, boss: true, hp: 11, atk: 1.2, tough: 100, weak: ['fire', 'ice', 'quant'], skills: [{ n: 'Хлёст побегом', m: 1.1, e: 'phys' }, { n: 'Споры', m: 0.3, e: 'imag' }] }),
    doomsday: F({ name: 'Зверь Судного дня', fam: 'boss', shape: 'doomsday', col: ['#2a1a3a', '#b050ff'], elite: true, boss: true, hp: 11, atk: 1.4, tough: 160, weak: ['phys', 'ice', 'fire'], skills: [{ n: 'Удар хвостом', m: 1.5, e: 'phys' }, { n: 'Зов Легиона' }, { n: 'Сбор антиматерии' }, { n: 'Неизбежная гибель', m: 1, e: 'quant' }, { n: 'Пожирание', m: 1, e: 'quant' }] }),
    skaracabaz: F({ name: 'Скаракабаз (синтетический)', fam: 'boss', shape: 'swarmking', col: ['#141c3a', '#40e0d0'], elite: true, boss: true, hp: 15, atk: 2.1, tough: 180, weak: ['fire', 'ice', 'imag'], skills: [{ n: 'Жало звёздного роя', m: 0.85, e: 'imag' }, { n: 'Нашествие' }, { n: 'Крылья пожирателя звёзд', m: 0.85, e: 'imag' }] })
  };
  HO.FOE_IDS = Object.keys(HO.FOES);

  HO.FOE_RT = {
    baryon: { range: 2.2, swing: 2, speed: 0.85, r: 0.55, h: 1.4 },
    antibaryon: { range: 2.2, swing: 2, speed: 0.8, r: 0.55, h: 1.4 },
    reaver: { range: 2.4, swing: 2.4, speed: 1, r: 0.5, h: 2.1, alt: { every: 4, m: 1.5 } },
    eliminator: { range: 18, swing: 2.6, speed: 1, r: 0.5, h: 2.1, bolt: true },
    distorter: { range: 16, swing: 3, speed: 1.05, r: 0.5, h: 2.2, bolt: true },
    weaver: { range: 18, swing: 2.4, speed: 1.05, r: 0.6, h: 1.8, bolt: true },
    trampler: {
      range: 3, swing: 2.4, speed: 0.95, r: 1.4, h: 2.6, hpMul: 2.5,
      preps: [
        { skill: 1, kind: 'single', prep: 3.5, m: 4, line: '{name} готовит «{skill}»! Пробейте его стойкость!' },
        { skill: 0, kind: 'around', prep: 3, m: 2, radius: 8, line: '{name} готовит «{skill}»! Отойдите или пробейте его стойкость!' }
      ],
      prepEvery: 10
    },
    flamespawn: { range: 2.2, swing: 2, speed: 0.9, r: 0.55, h: 1.5, burn: { chance: 0.4, dur: 6, m: 0.3 } },
    trotter: { range: 1, swing: 99, speed: 0.85, r: 0.5, h: 0.9, flee: true, leash: 70 },
    juvsting: { range: 2.2, swing: 1.6, speed: 1.15, r: 0.45, h: 1.6, alt: { every: 4, m: 0.8 } },
    gnawsting: { range: 2.4, swing: 3.2, speed: 0.95, r: 0.55, h: 1.8, poison: { chance: 0.35, dur: 6, m: 0.2 } },
    gnawsting_e: {
      range: 2.8, swing: 3.2, speed: 0.9, r: 0.9, h: 2.4, hpMul: 2.5, poison: { chance: 0.35, dur: 6, m: 0.2 },
      preps: [{ skill: 1, kind: 'around', prep: 3, m: 1.6, radius: 9, dot: { key: 'poison', dur: 8, m: 0.25 }, line: '{name} раздувается! «{skill}» по всем рядом. Отойдите или пробейте его стойкость!' }],
      prepEvery: 12, summon: { every: 20, n: 2, max: 3, ids: ['juvsting'], lvl: 8, text: 'Коррозийный жаложук зовёт Рой!' }
    },
    warden: {
      range: 3.2, swing: 2.6, speed: 0.8, r: 1.3, h: 3, leash: 30, hpMul: 2.5,
      preps: [
        { skill: 1, kind: 'cone', prep: 2, m: 3, radius: 10, arc: 0.6, line: '{name} разворачивает «{skill}». Уйдите из конуса перед ним!' },
        { skill: 2, kind: 'circles', prep: 2.2, m: 2.4, radius: 3, below: 0.5, line: '{name}: «{skill}». Круги на полу, отойдите!' }
      ],
      prepEvery: 8, prepFirst: 6
    },
    culture: {
      range: 5, swing: 2.4, speed: 0, r: 2, h: 2.5, leash: 40, hpMul: 2,
      summon: { every: 25, first: 12, n: 2, max: 4, ids: ['juvsting'], lvl: 9, text: 'Культура выпускает Незрелых жаложуков!' },
      pulse: { every: 8, r: 30, m: 0.2, dur: 6, key: 'spores', text: 'Споры оседают на всех. Снимите недуг!' }
    },
    doomsday: {
      range: 3.8, swing: 2.6, speed: 0.9, r: 2.2, h: 4, leash: 45, hpMul: 7,
      preps: [
        { skill: 3, kind: 'all', prep: 5, m: 2.4, above: 0.5, line: 'Зверь копит антиматерию! Пробейте его уязвимость!' },
        { skill: 3, kind: 'all', prep: 4, m: 2.4, below: 0.5, line: 'Зверь копит антиматерию! Пробейте его уязвимость!' },
        { skill: 4, kind: 'circles', prep: 2, m: 2.2, radius: 3.5, below: 0.5, line: '{name}: «{skill}». Круги на полу, отойдите!' }
      ],
      prepEvery: 14, prepFirst: 12,
      summon: { every: 35, first: 20, n: 2, nLow: 3, max: 4, ids: ['antibaryon'], lvl: 8, text: 'Зов Легиона! Из разлома выходят Антибарионы.' },
      phase: { below: 0.5, swingP: -0.2, text: 'Пробуждение! Зверь Судного дня встаёт во весь рост.' }
    },
    skaracabaz: {
      range: 3.4, swing: 2.4, speed: 0.85, r: 1.8, h: 3.4, leash: 34, hpMul: 1.7,
      preps: [{ skill: 2, kind: 'all', prep: 4, m: 1.4, dot: { key: 'burn', dur: 6, m: 0.3, elem: 'fire' }, line: '{name} расправляет «{skill}»! Пробейте его стойкость, пока не поздно!' }],
      prepEvery: 16, prepFirst: 12,
      summon: { every: 40, first: 25, n: 2, max: 2, ids: ['juvsting'], lvl: 8, text: 'Скаракабаз: «Нашествие»!' },
      life: { s: 240, text: 'Срок жизни клона истёк. Скаракабаз рассыпается в пыль.' }
    }
  };

  HO.TRACES = {
    destruction: [{ id: 'd_guard', name: 'Стойкость защитника', text: 'Угроза +30%, получаемый урон −10%.' }, { id: 'd_rush', name: 'Неудержимый натиск', text: 'Урон +10%, Ярость от ударов +20%.' }],
    abundance: [{ id: 'a_bloom', name: 'Обильные всходы', text: 'Росток длится на 6 с дольше.' }, { id: 'a_quick', name: 'Скорая помощь', text: 'Исцеление готовится на 0,5 с быстрее.' }],
    erudition: [{ id: 'e_chain', name: 'Цепная реакция', text: 'Каскад бьёт до 4 врагов.' }, { id: 'e_precise', name: 'Точный расчёт', text: 'Шанс крита Огненной и Ледяной стрелы +10%.' }]
  };
  HO.traceOf = sheet => (sheet && sheet.trace) || '';

  const A = (o) => Object.assign({ lvl: 1, cost: 0, cast: 0, cd: 0, gcd: true, range: 0, target: 'enemy', ooc: false, fx: [] }, o);
  HO.ABILITIES = {
    d_attack: A({ path: 'destruction', name: 'Обычная атака', auto: true, target: 'enemy', icon: 'АТ', text: 'Удар оружием каждые 2,8 с. Даёт Ярость.' }),
    d_mighty: A({ path: 'destruction', name: 'Мощный замах', cost: 15, gcd: false, cd: 0, range: 0, target: 'self', icon: 'МЗ', fx: [{ k: 'nextSwing', m: 0.4, tough: 10 }], text: 'Следующая обычная атака сильнее на 40% и снимает 10 Стойкости.' }),
    d_charge: A({ path: 'destruction', lvl: 2, name: 'Рывок', ooc: true, cd: 15, range: 25, minRange: 8, gcd: false, icon: 'РЫ', fx: [{ k: 'dash' }, { k: 'stun', dur: 1 }, { k: 'gain', v: 15 }], text: 'Техника. Вне боя: бросок к цели, оглушение 1 с, +15 Ярости.' }),
    d_rend: A({ path: 'destruction', lvl: 4, name: 'Рассечение', cost: 10, range: 'melee', icon: 'РС', fx: [{ k: 'dot', m: 1.2, dur: 12, every: 3, key: 'rend' }], text: 'Кровотечение: физический урон за 12 с.' }),
    d_shout: A({ path: 'destruction', lvl: 4, name: 'Боевой клич', cost: 10, target: 'self', icon: 'БК', fx: [{ k: 'buff', stat: 'atkP', v: 0.1, dur: 120, key: 'shout', group: true }], text: 'Атака группы +10% на 2 мин.' }),
    d_taunt: A({ path: 'destruction', lvl: 6, name: 'Вызов', cd: 10, gcd: false, range: 10, icon: 'ВЗ', fx: [{ k: 'taunt', dur: 3 }], text: 'Угроза становится наибольшей, враг бьёт вас 3 с.' }),
    d_clap: A({ path: 'destruction', lvl: 6, name: 'Сотрясение', cost: 20, cd: 6, target: 'none', icon: 'СТ', fx: [{ k: 'aoe', r: 8, m: 0.8, tough: 10, around: 'self', then: [{ k: 'debuff', stat: 'swingP', v: 0.1, dur: 10, key: 'clap' }] }], text: 'Урон всем врагам в 8 м, Стойкость 10, их атаки медленнее на 10%.' }),
    d_sunder: A({ path: 'destruction', lvl: 8, name: 'Раскол брони', cost: 15, range: 'melee', icon: 'РБ', fx: [{ k: 'debuff', stat: 'defP', v: -0.06, dur: 20, key: 'sunder', stack: 5 }, { k: 'threat', v: 20, perLvl: 5 }], text: 'Защита цели −6%, до 5 раз. Много угрозы.' }),
    d_ult: A({ path: 'destruction', lvl: 10, name: 'Сокрушение', ult: true, range: 'melee', hpCost: 0.15, icon: 'СК', fx: [{ k: 'dmg', m: 3, tough: 30 }, { k: 'aoe', r: 6, m: 1.5, tough: 30, around: 'target', skipTarget: true }], text: 'Абсолютная техника. Удар по цели и всем рядом, Стойкость 30. Стоит 15% вашего НР.' }),

    a_attack: A({ path: 'abundance', name: 'Обычная атака', auto: true, range: 25, icon: 'АТ', text: 'Луч мнимого света каждые 2 с.' }),
    a_heal: A({ path: 'abundance', name: 'Исцеление', cost: 0.15, cast: 2.5, range: 30, target: 'ally', icon: 'ИС', fx: [{ k: 'heal', m: 3 }], text: 'Лечит одну цель.' }),
    a_bless: A({ path: 'abundance', lvl: 2, name: 'Благословение', cost: 0.1, ooc: true, target: 'self', icon: 'БЛ', fx: [{ k: 'buff', stat: 'hpP', v: 0.1, dur: 1800, key: 'bless', group: true }], text: 'Техника. Вне боя: НР группы +10% на 30 мин.' }),
    a_smite: A({ path: 'abundance', name: 'Удар Изобилия', cost: 0.1, cast: 2, range: 30, icon: 'УИ', fx: [{ k: 'dmg', m: 1.8, tough: 15 }], text: 'Мнимый урон, Стойкость 15.' }),
    a_sprout: A({ path: 'abundance', lvl: 4, name: 'Росток', cost: 0.12, range: 30, target: 'ally', icon: 'РО', fx: [{ k: 'hot', m: 3, dur: 12, every: 3, key: 'sprout' }], text: 'Лечение по времени 12 с.' }),
    a_cleanse: A({ path: 'abundance', lvl: 4, name: 'Снять недуг', cost: 0.08, range: 30, target: 'ally', icon: 'СН', fx: [{ k: 'cleanse' }], text: 'Снимает один вредный эффект.' }),
    a_wither: A({ path: 'abundance', lvl: 6, name: 'Отцветание', cost: 0.1, range: 30, icon: 'ОТ', fx: [{ k: 'dot', m: 2.4, dur: 18, every: 3, key: 'wither' }], text: 'Мнимый урон по времени 18 с.' }),
    a_revive: A({ path: 'abundance', lvl: 8, name: 'Возвращение', cost: 0.3, cast: 10, ooc: true, range: 30, target: 'dead', icon: 'ВО', fx: [{ k: 'revive', pct: 0.3 }], text: 'Вне боя: поднимает павшего союзника с 30% НР.' }),
    a_ult: A({ path: 'abundance', lvl: 10, name: 'Милость Яоши', ult: true, target: 'self', icon: 'МЯ', fx: [{ k: 'heal', m: 4, group: true }, { k: 'hot', m: 3, dur: 10, every: 2, key: 'mercy', group: true }], text: 'Абсолютная техника. Лечит всю группу и даёт лечение по времени.' }),

    e_attack: A({ path: 'erudition', name: 'Обычная атака', auto: true, range: 25, icon: 'АТ', text: 'Огненный разряд каждые 2 с.' }),
    e_fire: A({ path: 'erudition', name: 'Огненная стрела', cost: 0.12, cast: 2, range: 30, elem: 'fire', icon: 'ОС', fx: [{ k: 'dmg', m: 2, tough: 15 }, { k: 'dot', m: 0.4, dur: 6, every: 2, key: 'burn' }], text: 'Огненный урон, Стойкость 15, Горение 6 с.' }),
    e_prep: A({ path: 'erudition', lvl: 2, name: 'Расчёт наперёд', ooc: true, gcd: false, target: 'self', icon: 'РН', fx: [{ k: 'buff', stat: 'prep', v: 1, dur: 30, key: 'prep' }], text: 'Техника. Вне боя: первое заклинание мгновенное и снимает вдвое больше Стойкости.' }),
    e_ice: A({ path: 'erudition', lvl: 4, name: 'Ледяная стрела', cost: 0.12, cast: 2, range: 30, elem: 'ice', icon: 'ЛС', fx: [{ k: 'dmg', m: 1.8, tough: 15 }, { k: 'debuff', stat: 'moveP', v: -0.4, dur: 5, key: 'chill' }], text: 'Ледяной урон, Стойкость 15, замедление на 40% на 5 с.' }),
    e_coffee: A({ path: 'erudition', lvl: 4, name: 'Сварить кофе', cost: 0.2, cast: 3, ooc: true, target: 'self', icon: 'КФ', fx: [{ k: 'conjure', item: 'coffee', n: 2 }], text: 'Вне боя: две чашки кофе. Кофе сидя восстанавливает Силу Пути.' }),
    e_cascade: A({ path: 'erudition', lvl: 6, name: 'Каскад', cost: 0.18, cast: 2.5, range: 30, elem: 'fire', icon: 'КС', fx: [{ k: 'dmg', m: 1.8, tough: 15 }, { k: 'aoe', r: 6, m: 0.9, tough: 8, around: 'target', skipTarget: true, max: 2 }], text: 'Огонь по цели и по 2 врагам рядом, им половина урона.' }),
    e_ring: A({ path: 'erudition', lvl: 6, name: 'Ледяное кольцо', cost: 0.1, cd: 25, target: 'none', elem: 'ice', icon: 'ЛК', fx: [{ k: 'aoe', r: 8, m: 0.3, tough: 5, around: 'self', then: [{ k: 'root', dur: 5 }] }], text: 'Враги в 8 м не двигаются 5 с.' }),
    e_stop: A({ path: 'erudition', lvl: 8, name: 'Стоп-кадр', cost: 0.1, cast: 1.5, range: 30, icon: 'СК', fx: [{ k: 'poly', dur: 20 }], text: 'Враг (не элита) выключен на 20 с. Первый урон снимает.' }),
    e_ult: A({ path: 'erudition', lvl: 10, name: 'Полный расчёт', ult: true, target: 'none', elems: ['fire', 'ice'], icon: 'ПР', fx: [{ k: 'aoe', r: 10, m: 2.5, tough: 20, around: 'self' }], text: 'Абсолютная техника. Огонь и лёд всем врагам в 10 м, Стойкость 20.' })
  };
  HO.ABILITY_IDS = Object.keys(HO.ABILITIES);
  HO.BAR = {
    destruction: ['d_attack', 'd_mighty', 'd_charge', 'd_rend', 'd_shout', 'd_taunt', 'd_clap', 'd_sunder', 'd_ult'],
    abundance: ['a_attack', 'a_heal', 'a_smite', 'a_sprout', 'a_cleanse', 'a_wither', 'a_bless', 'a_revive', 'a_ult'],
    erudition: ['e_attack', 'e_fire', 'e_ice', 'e_cascade', 'e_ring', 'e_stop', 'e_prep', 'e_coffee', 'e_ult']
  };
  HO.RACIALS = {
    human: { id: 'r_focus', name: 'Собранность', cd: 120, text: 'Снимает оглушение, замедление и обездвиживание.' },
    foxian: { id: 'r_dash', name: 'Лисий рывок', cd: 90, text: 'Рывок вперёд на 8 м.' }
  };
  HO.RACIAL_IDS = Object.values(HO.RACIALS).map(r => r.id);

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
