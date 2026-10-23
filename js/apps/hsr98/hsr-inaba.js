(function (H) {
  'use strict';
  const T = H.TUNING;
  const { atkOf, alive } = H.battleStat;

  const PERSONAS = [
    { id: 'izanagi', name: 'Изанаги', elem: 'elec' },
    { id: 'frost', name: 'Джек Фрост', elem: 'ice' },
    { id: 'yoshitsune', name: 'Ёсицунэ', elem: 'phys' }
  ];

  const TAG_NAMES = { joke: 'шутки', cute: 'милоту', threat: 'угрозы', science: 'науку', kind: 'доброту', sing: 'песни', bribe: 'подкуп', silent: 'молчание', weird: 'странности' };
  const ANALYZED = 'Проанализирован';
  const ONE_MORE_KINDS = ['basic', 'skill', 'enhanced'];

  const KITS = {
    yu: {
      name: 'Ю', fullName: 'Ю Наруками', path: 'hunt', elem: 'elec', rarity: 5, energy: 120, faction: 'inaba', arcana: 'Шут', personas: true,
      base: { hp: 140, atk: 92, def: 58, spd: 104 },
      look: { skin: '#f6dcc8', hair: '#a8acb8', hairHi: '#d4d8e0', eye: '#7a7e8c', bangs: 'blunt', sides: 'jaw', back: 'short', crown: 'neat', jaw: 'v', body: 'lean', sex: 'm', coat: 'split', coatLen: 8, top: '#1e1e26', coatLow: '#1e1e26', lining: '#2a2a32', trim: '#4a4a54', inner: '#f4f4f2', collar: 'high', lower: '#1e1e26', low: 'pants', shoes: '#4a2e20', acc: ['buttons:#d8b050'] },
      basic: { name: 'Удар катаной', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skills: [
        { name: 'Изанаги: Зиодайн', persona: 0, target: 'single', text: 'электрический урон 220%, защита цели −15% на 2 хода.', fx: [{ k: 'dmg', m: 2.2 }, { k: 'debuff', s: 'defDown', v: 0.15, turns: 2, chance: 1, name: 'Ракунда' }] },
        { name: 'Джек Фрост: Буфула', persona: 1, target: 'blast', text: 'ледяной урон 130% (соседним 60%), Заморозка с шансом 35%.', fx: [{ k: 'dmg', m: 1.3, adj: 0.6 }, { k: 'freeze', chance: 0.35 }] },
        { name: 'Ёсицунэ: Хассо Тоби', persona: 2, target: 'bounce', text: 'физический урон 45% шесть раз по случайным врагам.', fx: [{ k: 'dmg', m: 0.45, hits: 6, tough: 5 }] }
      ],
      ult: { name: 'Мириады истин', target: 'all', text: 'урон 160% всем, стойкость без учёта уязвимостей. Следующий навык бесплатно.', fx: [{ k: 'dmg', m: 1.6, tough: 25, anyTough: true }, { k: 'freeSkill' }] },
      talent: 'Первое пробитие каждой Персоной даёт очко навыка. С Ю «Ещё раз!» есть у всех.',
      tech: { name: 'Персона!', text: 'Первый навык в бою бесплатно, атака Ю +15% на 2 хода.', fx: 'yuTech' },
      contact: [{ name: 'Выслушать', tag: 'kind' }, { name: 'Молча кивнуть', tag: 'silent' }]
    },
    yosuke: {
      name: 'Ёсуке', fullName: 'Ёсуке Ханамура', path: 'nihility', elem: 'wind', rarity: 4, energy: 110, faction: 'inaba', arcana: 'Маг',
      base: { hp: 130, atk: 78, def: 54, spd: 108 },
      look: { skin: '#f6dcc6', hair: '#b08a5a', hairHi: '#d4ae78', eye: '#8a6a42', bangs: 'sweep', sides: 'shag', back: 'short', crown: 'messy', jaw: 'v', body: 'slim', sex: 'm', coat: 'closed', top: '#1e1e26', trim: '#1e1e26', inner: '#1e1e26', neck: '#c8382a', collar: 'high', lower: '#1e1e26', low: 'pants', shoes: '#e8e8e2', acc: ['buttons:#d8b050', 'headset:#e85a2a'] },
      basic: { name: 'Удар кунаем', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Гарула', target: 'blast', text: 'урон 100% (соседним 40%), скорость задетых −12% на 2 хода, Порыв ветра с шансом 60%.', fx: [{ k: 'dmg', m: 1.0, adj: 0.4 }, { k: 'debuff', s: 'spdP', v: -0.12, turns: 2, chance: 1, name: 'Сукунда' }, { k: 'dot', type: 'shear', m: 0.5, turns: 2, chance: 0.6 }] },
      ult: { name: 'Гарудайн', target: 'all', text: 'урон 140% всем, Порыв ветра на 2 хода, враги ходят на 15% позже.', fx: [{ k: 'dmg', m: 1.4 }, { k: 'dot', type: 'shear', m: 0.6, turns: 2, chance: 1 }, { k: 'delay', v: 0.15 }] },
      talent: 'Когда союзник пробивает врага, бьёт вслед на 90% с гарантированным критом. Раз до своего хода.',
      tech: { name: 'Сукунда', text: 'Враги ходят позже, скорость −10% на 2 хода.', fx: 'slowAll' },
      contact: [{ name: 'Пошутить', tag: 'joke' }, { name: 'Купон «Джунс»', tag: 'bribe' }]
    },
    chie: {
      name: 'Чие', fullName: 'Чие Сатонака', path: 'destruction', elem: 'ice', rarity: 4, energy: 120, faction: 'inaba', arcana: 'Колесница',
      base: { hp: 160, atk: 84, def: 52, spd: 100 },
      look: { skin: '#f6dcc8', hair: '#7a4a2a', hairHi: '#9a6238', eye: '#6a4426', bangs: 'blunt', sides: 'jaw', back: 'short', crown: 'neat', body: 'f', coat: 'jacket', top: '#2f8a3a', trim: '#c8d850', inner: '#2f8a3a', collar: 'high', lower: '#5a5a64', hem: '#4a4a54', low: 'skirt', skirtLen: 8, shoes: '#1a1a1e', acc: ['zip:#c8d850', 'socks:#f2f2ee'] },
      basic: { name: 'Пинок', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Драконий пинок', target: 'blast', text: 'урон 160% (соседним 60%).', fx: [{ k: 'dmg', m: 1.6, adj: 0.6 }] },
      ult: { name: 'Галактический пинок', target: 'single', text: 'урон 320%. Обычный враг с HP ниже 30% вылетает с поля.', fx: [{ k: 'dmg', m: 3.2, tough: 30 }, { k: 'execute', v: T.chieExecute }] },
      talent: 'Шанс крита +12%. Крит снимает половину стойкости даже без уязвимости.',
      tech: { name: 'Говядина из «Айи»', text: 'Атака отряда +12% на 2 хода.', fx: 'chieTech' },
      contact: [{ name: 'Показать кунг-фу', tag: 'threat' }, { name: 'Угостить мясом', tag: 'kind' }]
    },
    yukiko: {
      name: 'Юкико', fullName: 'Юкико Амаги', path: 'abundance', elem: 'fire', rarity: 4, energy: 100, faction: 'inaba', arcana: 'Жрица',
      base: { hp: 150, atk: 70, def: 62, spd: 100 },
      look: { skin: '#f8e2d6', hair: '#141418', hairHi: '#2c2c38', eye: '#5a4a4a', bangs: 'blunt', sides: 'long', back: 'hime', crown: 'smooth', gloss: true, body: 'f', coat: 'jacket', top: '#c8243a', trim: '#1a1a22', inner: '#1a1a22', collar: 'sailor', lower: '#5a5a64', hem: '#4a4a54', low: 'skirt', skirtLen: 9, legs: '#1a1a20', shoes: '#4a2e20', acc: ['headband:#c8242e', 'kerchief:#e8c040', 'buttons:#e8d8b0'] },
      basic: { name: 'Веер', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Диарама', target: 'ally', text: 'лечит союзника на 15% HP Юкико и снимает одно ослабление.', fx: [{ k: 'heal', m: 0.15, flat: 45, who: 'target' }, { k: 'cleanse' }] },
      ult: { name: 'Пламя Коноханы', target: 'all', text: 'лечит отряд на 12% HP, огненный урон 100% всем и Горение на 2 хода.', fx: [{ k: 'heal', m: 0.12, flat: 30, who: 'allies' }, { k: 'dmg', m: 1.0 }, { k: 'dot', type: 'burn', m: 0.5, turns: 2, chance: 1 }] },
      talent: 'Каждый тик Горения на враге лечит самого раненого союзника на 4% HP Юкико.',
      tech: { name: 'Огненный веер', text: 'Все враги начинают бой с Горением.', fx: 'burnAll' },
      contact: [{ name: 'Расхохотаться', tag: 'joke' }, { name: 'Пригласить в гостиницу', tag: 'kind' }]
    },
    kanji: {
      name: 'Канджи', fullName: 'Канджи Тацуми', path: 'destruction', elem: 'phys', rarity: 5, energy: 120, faction: 'inaba', arcana: 'Император',
      base: { hp: 178, atk: 90, def: 64, spd: 96 },
      look: { skin: '#f2d6c0', hair: '#e8e2c8', hairHi: '#ffffff', eye: '#6a6070', bangs: 'sidepart', sides: 'temple', back: 'short', crown: 'swept', jaw: 'v', body: 'tall', sex: 'm', coat: 'split', coatLen: 12, top: '#24242a', coatLow: '#24242a', lining: '#30303a', trim: '#c8ccd4', inner: '#1e1e22', collar: 'high', lower: '#24242a', low: 'pants', shoes: '#5a3a24', acc: ['skullprint:#ecebe4', 'earring:#c8ccd4', 'chainband:#c8ccd4'] },
      basic: { name: 'Складной стул', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Стежок', target: 'single', text: 'сшивает цель с соседом на 3 хода, урон 190%. По нити идёт 40% урона и 50% стойкости.', fx: [{ k: 'stitch' }, { k: 'dmg', m: 1.9 }] },
      ult: { name: 'Первобытная сила', target: 'single', text: 'урон 330%, много стойкости. Сшитый сосед получает весь урон.', fx: [{ k: 'dmg', m: 3.3, tough: 40 }] },
      talent: 'Урон по сшитым врагам +25%. Пробитие сшитого врага даёт 15 энергии.',
      tech: { name: 'Вязаный зайчик', text: 'Самый раненый союзник получает щит: 20% HP Канджи на 2 хода.', fx: 'kanjiTech' },
      contact: [{ name: 'Наорать', tag: 'threat' }, { name: 'Подарить вязаного зверька', tag: 'cute' }]
    },
    rise: {
      name: 'Рисе', fullName: 'Рисе Куджикава', path: 'harmony', elem: 'imag', rarity: 5, energy: 110, faction: 'inaba', arcana: 'Влюблённые',
      base: { hp: 140, atk: 80, def: 62, spd: 106 },
      look: { skin: '#f9e2d4', hair: '#a8463a', hairHi: '#c8664a', eye: '#7a4a3a', bangs: 'wisp', sides: 'flick', back: 'short', crown: 'smooth', gloss: true, body: 'f', coat: 'jacket', top: '#1e1e26', trim: '#1e1e26', inner: '#1e1e26', collar: 'sailor', lower: '#5a5a64', hem: '#4a4a54', low: 'skirt', skirtLen: 7, shoes: '#1a1a1e', acc: ['twintails', 'kerchief:#e8c040', 'stockings:#3a2420'] },
      basic: { name: 'Луч Химико', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Полный анализ', target: 'single', text: 'враг Проанализирован на 3 хода: стойкость −30% быстрее, крит по нему +10%, виден его ход.', fx: [{ k: 'analyze' }] },
      ult: { name: 'Третий глаз', target: 'all', text: 'все враги Проанализированы на 2 хода. Отряду урон +24%, скорость +10%, лечение 6% HP за ход.', fx: [{ k: 'analyze', all: true, turns: 2 }, { k: 'buff', s: 'dmgP', v: 0.24, turns: 2, who: 'allies', name: 'Третий глаз' }, { k: 'buff', s: 'spdP', v: 0.1, turns: 2, who: 'allies', name: 'Третий глаз: скорость', quiet: true }, { k: 'wave', m: 0.06, turns: 2 }] },
      talent: 'Перед мощной атакой или ударом по всем от Проанализированного врага даёт целям щит 10% HP.',
      tech: { name: 'Сканирование', text: 'Отряду +10 энергии. Видно, на что враги отзываются в Контакте.', fx: 'riseTech' },
      contact: [{ name: 'Спеть', tag: 'sing' }, { name: 'Подмигнуть', tag: 'cute' }]
    }
  };

  const FUSIONS = {
    f_partners: { name: 'Напарники', members: ['yu', 'yosuke'], target: 'all', text: 'Молния и ветер по любой стойкости. Если все враги пробиты, сразу Атака всем отрядом.', fx: [{ k: 'dmg', m: 1.4, e: 'elec', tough: 20, anyTough: true, statOf: 'yu' }, { k: 'dmg', m: 1.4, e: 'wind', tough: 20, anyTough: true, statOf: 'yosuke' }, { k: 'allOut' }] },
    f_friends: { name: 'Подруги детства', members: ['chie', 'yukiko'], target: 'all', text: 'Пинок Чие всегда критует и бьёт стойкость, пламя Юкико лечит отряд.', fx: [{ k: 'dmg', m: 1.5, e: 'ice', tough: 15, alwaysCrit: true, statOf: 'chie' }, { k: 'dmg', m: 1.5, e: 'fire', tough: 15, statOf: 'yukiko' }, { k: 'heal', m: 0.15, flat: 40, who: 'allies', statOf: 'yukiko' }] },
    f_emperor: { name: 'Император на связи', members: ['kanji', 'rise'], target: 'single', text: 'Рисе анализирует всех врагов, Канджи сшивает цель с соседом и бьёт изо всех сил.', fx: [{ k: 'analyze', all: true, turns: 2, statOf: 'rise' }, { k: 'stitch' }, { k: 'dmg', m: 3.0, e: 'phys', tough: 30, statOf: 'kanji' }, { k: 'dmg', m: 1.0, e: 'imag', tough: 15, statOf: 'rise' }] },
    f_fools: { name: 'Я есть ты', members: ['trail', 'yu'], target: 'all', text: 'Два Шута бьют по всем: физика и молния Изанаги по любой стойкости. Отряд получает 10 энергии.', fx: [{ k: 'dmg', m: 1.6, e: 'phys', tough: 20, statOf: 'trail' }, { k: 'dmg', m: 1.6, e: 'elec', tough: 20, anyTough: true, statOf: 'yu' }, { k: 'energy', v: 10 }] },
    f_fools_p: { name: 'Я есть ты', members: ['trail_p', 'yu'], target: 'all', text: 'Два Шута бьют по всем: огонь и молния Изанаги по любой стойкости. Отряд получает 10 энергии.', fx: [{ k: 'dmg', m: 1.6, e: 'fire', tough: 20, statOf: 'trail_p' }, { k: 'dmg', m: 1.6, e: 'elec', tough: 20, anyTough: true, statOf: 'yu' }, { k: 'energy', v: 10 }] }
  };

  const CONES = {
    truth: {
      name: 'Самый вкусный омлет', path: 'hunt', rarity: 5, own: true, stats: { hp: 48, atk: 26.4, def: 21 }, skill: 'Узы', sig: 'yu',
      tpl: 'Крит. урон владельца повышается на #1%. Во время «Ещё раз!» урон владельца повышается на #2%. Урон владельца в Атаке всем отрядом повышается на #3%.', p: [[0.36, 0.24, 0.3], [0.42, 0.28, 0.35], [0.48, 0.32, 0.4], [0.54, 0.36, 0.45], [0.6, 0.4, 0.5]], bonus: { critD: 1 }, fx: 'truth',
      desc: 'Девочки готовили весь вечер. На краю стола стоят три тарелки с чем-то чёрным и дымящимся, и Нанако вежливо говорит, что всё очень вкусно.\nПотом Ю молча ставит перед ней свой омлет.\nНанако съедает его до последней крошки.\n«Братик, а завтра ты тоже будешь готовить?»'
    },
    thread: {
      name: 'Стежок за стежком', path: 'destruction', rarity: 5, own: true, stats: { hp: 52.8, atk: 26.4, def: 18 }, skill: 'Ткань живая', sig: 'kanji',
      tpl: 'Атака владельца повышается на #1%. Урон владельца по сшитым врагам повышается на #2%. Когда владелец пробивает сшитого врага, он восстанавливает #3% макс. HP.', p: [[0.24, 0.18, 0.09], [0.28, 0.21, 0.105], [0.32, 0.24, 0.12], [0.36, 0.27, 0.135], [0.4, 0.3, 0.15]], bonus: { atkP: 1 }, fx: 'thread',
      desc: 'В семье Тацуми говорят, что ткань живая.\nНочью в лавке горит одна лампа. Канджи, которого боится вся школа, сидит над крошечным вязаным зайцем и продевает последнюю петлю.\nУтром заяц встанет на полку рядом с остальными.\nКто их вяжет, в городе не знает никто.'
    },
    junesday: {
      name: 'Каждый день в «Джунс»', path: 'nihility', rarity: 4, own: true, stats: { hp: 43.2, atk: 21.6, def: 15 }, skill: 'Без обмана', sig: 'yosuke',
      tpl: 'Шанс эффекта владельца повышается на #1%. Урон бонус-атак владельца повышается на #2%.', p: [[0.16, 0.24], [0.2, 0.3], [0.24, 0.36], [0.28, 0.42], [0.32, 0.48]], bonus: { ehr: 1 }, fx: 'junesday',
      desc: 'Песенка «Джунс» играет на крыше в сотый раз за день.\nЁсуке снимает фартук и садится за дальний столик фуд-корта. Здесь штаб их следственной группы.\nОн смотрит на город и повторяет про себя одно: жить, не обманывая себя.\n«Ладно. Кто сегодня угощает?»'
    },
    dragontrial: {
      name: 'Испытание дракона', path: 'destruction', rarity: 4, own: true, stats: { hp: 43.2, atk: 21.6, def: 15 }, skill: 'Удар мастера', sig: 'chie',
      tpl: 'Атака владельца повышается на #1%. Урон владельца по пробитым врагам повышается на #2%.', p: [[0.16, 0.24], [0.2, 0.3], [0.24, 0.36], [0.28, 0.42], [0.32, 0.48]], bonus: { atkP: 1 }, fx: 'dragontrial',
      desc: 'Кассета «Испытания дракона» затёрта почти до дыр.\nЧие ставит фильм на паузу на любимом месте и повторяет удар перед телевизором. С плаката за ней следит мастер кунг-фу.\nВ детстве у неё было тайное убежище, где мастер будто бы учил её особым приёмам.\nМастер так и не пришёл. Удар остался.'
    },
    amagiinn: {
      name: 'Гостиница «Амаги»', path: 'abundance', rarity: 4, own: true, stats: { hp: 48, atk: 19.2, def: 15 }, skill: 'Добрые люди', sig: 'yukiko',
      tpl: 'Исходящее лечение владельца повышается на #1%. Периодический урон от эффектов владельца повышается на #2%.', p: [[0.12, 0.24], [0.15, 0.3], [0.18, 0.36], [0.21, 0.42], [0.24, 0.48]], bonus: { healP: 1 }, fx: 'amagiinn',
      desc: 'Юкико хотела уйти из дома и стать совсем самостоятельной.\nПотом поняла: у неё есть гостиница, семья, официантки и повара, и такой её вырастили эти добрые люди.\nОна поправляет розовое кимоно и выходит встречать гостей.\nЗа её спиной кланяются те, кто её вырастил.'
    },
    affection: {
      name: 'Просто Рисе', path: 'harmony', rarity: 5, own: true, stats: { hp: 52.8, atk: 24, def: 21 }, skill: 'Своё лицо', sig: 'rise',
      tpl: 'Восстановление энергии владельца повышается на #1%. Когда владелец анализирует врага, урон отряда повышается на #2% на 2 хода.', p: [[0.12, 0.18], [0.14, 0.21], [0.16, 0.24], [0.18, 0.27], [0.2, 0.3]], bonus: { err: 1 }, fx: 'affection',
      desc: 'Рисетт ушла со сцены. Рисе надела белую косынку и встала за прилавок бабушкиной лавки тофу.\nПод окнами полгорода: фотоаппараты, блокноты для автографов, шёпот «это правда она?»\nРисе заворачивает брусок тофу в бумагу и впервые за год не знает, улыбается она по работе или просто так.\n«С вас сто иен».'
    }
  };

  const cf = (u, fx, n) => (u && u.cone ? H.coneP(u, fx, n) : 0);

  KITS.yu.skill = KITS.yu.skills[0];

  const isInaba = u => !!u && !!u.kit && u.kit.faction === 'inaba';

  Object.assign(H.Battle.prototype, {
    inabaStart() {
      for (const a of this.allies) {
        if (a.charId === 'chie') a.buffs.push({ s: 'critR', v: Math.round(T.chieCrit * (this.traceTalent ? this.traceTalent(a) : 1) * 1000) / 1000, turns: 999, name: 'Колесница' });
        if (a.charId === 'yu') { a.flags.bond = true; a.flags.wild = {}; this.setPersona(a, a.flags.skillSel | 0, true); }
        if (a.charId === 'yosuke') a.flags.strike = true;
      }
    },

    inabaTurn(u) {
      if (u.charId === 'yu') { u.flags.bond = true; u.flags.personaLock = false; }
      if (u.charId === 'yosuke') u.flags.strike = true;
      if (u.charId === 'kanji' && u.flags.stitch && --u.flags.stitch.turns <= 0) this.unstitch(u);
    },

    inabaTech(fx, src) {
      switch (fx) {
        case 'yuTech':
          src.flags.freeSkill = true;
          this.addBuff(src, { s: 'atkP', v: 0.15, turns: 2, name: 'Персона!' });
          break;
        case 'chieTech': for (const a of this.livingAllies) this.addBuff(a, { s: 'atkP', v: 0.12, turns: 2, name: 'Говядина из «Айи»' }); break;
        case 'kanjiTech': {
          const list = this.livingAllies;
          if (!list.length) break;
          const low = list.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
          this.giveShield(low, src.maxHp * 0.2, 2);
          this.push({ t: 'status', u: low, text: 'Вязаный зайчик', col: '#ffc8e0' });
          break;
        }
        case 'riseTech': {
          for (const a of this.livingAllies) this.gainEnergy(a, 10);
          const fams = [...new Set(this.living.map(e => e.data.fam))].filter(f => H.CONTACT[f]);
          const scan = fams.map(f => ({ fam: f, name: H.CONTACT[f].name, tags: Object.entries(H.CONTACT[f].react).filter(([, m]) => m === 'eager' || m === 'happy').map(([t]) => t) }));
          this.scan = scan;
          this.push({ t: 'scan', list: scan });
          for (const s of scan) if (s.tags.length) this.push({ t: 'text', text: 'Рисе: ' + s.name + ' любят ' + s.tags.map(t => TAG_NAMES[t] || t).join(' и ') + '.' });
          break;
        }
      }
    },

    inabaFx(f, actor, src, R, hitSet) {
      switch (f.k) {
        case 'freeSkill':
          actor.flags.freeSkill = true;
          this.push({ t: 'status', u: actor, text: 'Следующий навык бесплатно', col: '#ffe080' });
          break;
        case 'stitch': if (R.main) this.stitch(actor, R.main); break;
        case 'stitchAll': {
          const kj = this.allies.find(a => a.charId === 'kanji' && alive(a));
          const list = this.living;
          if (kj && list.length >= 2) this.stitch(kj, list[0], list[1]);
          break;
        }
        case 'analyze': {
          const list = f.all ? this.living : R.main ? [R.main] : [];
          const longer = actor.charId === 'rise' ? (this.kitFx && this.kitFx(actor, 'analyzeLong')) || 0 : 0;
          for (const t of list) this.analyze(src, t, (f.turns || T.analyzeTurns) + longer);
          break;
        }
        case 'wave':
          for (const a of this.livingAllies) this.addBuff(a, { s: 'hotMark', v: 0, turns: f.turns, name: 'Целебная волна', hot: Math.round(a.maxHp * f.m), src }, true);
          break;
        case 'execute': {
          const t = R.main;
          if (!t || !alive(t) || t.side !== 'enemy' || t.data.boss || t.data.elite || t.hp > t.maxHp * (f.v + ((this.kitFx && this.kitFx(actor, 'executeUp')) || 0))) break;
          this.push({ t: 'status', u: t, text: 'Нокаут!', col: '#bfe8ff', debuff: true });
          this.hit(src, t, 0, { raw: t.hp + t.shield, e: src.elem, label: 'Галактический пинок' });
          hitSet.add(t);
          break;
        }
        case 'allOut': this.pendingAoa = actor; break;
      }
    },

    setPersona(u, i, quiet) {
      const p = PERSONAS[i] || PERSONAS[0];
      u.elem = p.elem;
      if (!quiet) this.push({ t: 'persona', u, i, id: p.id, name: p.name, e: p.elem });
      return p;
    },

    persona(u) { return u && u.kit.personas ? PERSONAS[u.flags.skillSel | 0] : null; },

    inabaDmg(src, tgt, o) {
      let v = 0;
      const stitched = tgt.side === 'enemy' && !!this.stitchPartner(tgt);
      if (stitched && src.charId === 'kanji') v += T.kanjiVsStitch * (this.traceTalent ? this.traceTalent(src) : 1);
      if (stitched) v += cf(src, 'thread', 2);
      v += o.kind === 'aoa' ? cf(src, 'truth', 3) : src.flags.oneMore ? cf(src, 'truth', 2) : 0;
      if (o.kind === 'follow') v += cf(src, 'junesday', 2);
      if (tgt.broken) v += cf(src, 'dragontrial', 2);
      if (o.dot) v += cf(src, 'amagiinn', 2);
      return v;
    },

    inabaBreak(src, tgt) {
      if (!src || src.side !== 'ally' || tgt.side !== 'enemy') return;
      if (src === this.acting && src === this.current && ONE_MORE_KINDS.includes(this.actKind) && !src.flags.oneMore && !this.oneMore) {
        if (isInaba(src)) this.oneMore = src;
        else {
          const yu = this.allies.find(a => a.charId === 'yu' && alive(a) && a.flags.bond);
          if (yu) { yu.flags.bond = false; this.oneMore = src; }
        }
      }
      if (src.charId === 'yu' && src === this.acting && this.actKind !== 'ult') {
        const p = this.persona(src);
        if (p && !src.flags.wild[p.id]) {
          src.flags.wild[p.id] = true;
          const before = this.sp;
          this.sp = Math.min(T.spMax, this.sp + T.wildSp);
          if (this.sp > before) this.push({ t: 'status', u: src, text: 'Дикая карта: очко навыка', col: '#ffe080' });
          if (this.kitFx) this.kitFx(src, 'wildBreak');
        }
      }
      const y = this.allies.find(a => a.charId === 'yosuke' && alive(a) && a !== src && a.flags.strike);
      if (y && !this.strike) { y.flags.strike = false; this.strike = { u: y, near: tgt }; }
      const kj = this.allies.find(a => a.charId === 'kanji' && alive(a));
      if (kj && this.stitchPartner(tgt)) this.gainEnergy(kj, T.kanjiStitchEnergy);
      const th = cf(src, 'thread', 3);
      if (th && alive(src) && this.stitchPartner(tgt)) this.heal(src, src, src.maxHp * th);
    },

    yosukeStrike() {
      const s = this.strike;
      if (!s || this.over) return false;
      this.strike = null;
      const y = s.u;
      if (!alive(y) || !this.living.length) return false;
      const pool = this.living.filter(e => e !== s.near && !e.broken);
      const t = pool.length ? pool.reduce((a, b) => (b.hp < a.hp ? b : a)) : alive(s.near) ? s.near : this.living[0];
      const prev = this.acting;
      this.acting = y;
      this.push({ t: 'act', u: y, name: 'Атака Ёсуке', kind: 'follow' });
      this.hit(y, t, T.yosukeStrike * (this.traceTalent ? this.traceTalent(y) : 1), { e: 'wind', tough: 10, kind: 'follow', alwaysCrit: true, label: 'Атака Ёсуке' });
      this.gainEnergy(y, 10);
      if (this.kitFx && alive(y)) this.kitFx(y, 'strikeHit', t);
      if (this.su) this.bless('follow', { u: y, hits: [t] });
      this.acting = prev;
      this.cleanup();
      return true;
    },

    stitch(kj, t, other) {
      if (!alive(t) || t.side !== 'enemy') return false;
      let p = other;
      if (!p) {
        const adj = this.adjacent(this.living, t);
        p = adj.length ? adj.reduce((a, b) => (b.hp > a.hp ? b : a)) : null;
      }
      if (!p || !alive(p)) { this.push({ t: 'status', u: t, text: 'Не с кем сшить', debuff: true }); return false; }
      if (kj.flags.stitch) this.unstitch(kj, true);
      kj.flags.stitch = { a: t, b: p, turns: T.stitchTurns + ((this.kitFx && this.kitFx(kj, 'stitchLong')) || 0) + (this.current === kj ? 1 : 0) };
      this.push({ t: 'stitch', u: kj, a: t, b: p, text: 'Стежок' });
      if (this.kitFx) this.kitFx(kj, 'stitched', t, p);
      return true;
    },

    unstitch(kj, quiet) {
      if (!kj.flags.stitch) return;
      kj.flags.stitch = null;
      this.push({ t: 'stitch', u: kj, a: null, b: null, quiet: !!quiet });
    },

    stitchPartner(t) {
      if (!t || t.side !== 'enemy') return null;
      const kj = this.allies.find(a => a.charId === 'kanji' && alive(a) && a.flags.stitch);
      if (!kj) return null;
      const s = kj.flags.stitch;
      const p = s.a === t ? s.b : s.b === t ? s.a : null;
      return p && alive(p) ? p : null;
    },

    stitchEcho(src, tgt, dealt, o) {
      const p = this.stitchPartner(tgt);
      if (!p || dealt <= 0) return;
      const full = o.kind === 'ult' && src.charId === 'kanji';
      const kj = this.allies.find(a => a.charId === 'kanji' && a.flags.stitch);
      this.hit(src, p, 0, { raw: dealt * (full ? T.stitchUlt : T.stitchDmg + ((kj && (this.kitFx && this.kitFx(kj, 'stitchUp'))) || 0)), e: o.e || src.elem, echo: true, tough: o.tough ? o.tough * T.stitchTough : 0, anyTough: true, label: 'Стежок' });
    },

    analyzed(t) { return !!t && t.buffs.some(b => b.name === ANALYZED); },

    analyze(src, t, turns) {
      if (!alive(t) || t.side !== 'enemy') return;
      this.addBuff(t, { s: 'toughIn', v: T.analyzeTough, turns, name: ANALYZED, debuff: true });
      this.addBuff(t, { s: 'critTaken', v: T.analyzeCrit, turns, name: 'Анализ: уязвимые места', debuff: true }, true);
      this.addBuff(t, { s: 'vuln', v: T.analyzeVuln, turns, name: 'Анализ: слабая защита', debuff: true }, true);
      this.planNext(t);
      const af = cf(src, 'affection', 2);
      if (af) for (const a of this.livingAllies) this.addBuff(a, { s: 'dmgP', v: af, turns: 2, name: 'Своё лицо' }, a !== src);
      if (this.kitFx && src.charId === 'rise') this.kitFx(src, 'analyzedFoe', t, turns);
    },

    planNext(u) {
      if (!alive(u) || u.side !== 'enemy') return;
      if (u.charging == null && !u.planned) u.planned = this.pickSkill(u);
      this.push({ t: 'intent', u, sk: this.intentOf(u) });
    },

    intentOf(u) {
      if (!this.analyzed(u)) return null;
      return u.charging != null ? u.data.skills[u.charging] : u.planned || null;
    },

    riseWarn(u, sk, charged) {
      const rise = this.allies.find(a => a.charId === 'rise' && alive(a));
      if (!rise || !this.analyzed(u)) return;
      let list = [];
      if (sk.t === 'all') list = this.livingAllies;
      else if (charged || u.lockTarget) list = u.lockTarget && alive(u.lockTarget) ? [u.lockTarget] : this.livingAllies;
      if (!list.length) return;
      this.push({ t: 'warn', u: rise, foe: u, text: 'Рисе: Осторожно!' });
      for (const a of list) this.giveShield(a, a.maxHp * T.riseWarn * (this.traceTalent ? this.traceTalent(rise) : 1), 1);
      if (this.kitFx) this.kitFx(rise, 'warned', list);
    },

    burnHeal() {
      const yk = this.allies.find(a => a.charId === 'yukiko' && alive(a));
      const list = this.livingAllies;
      if (!yk || !list.length) return;
      const amt = yk.maxHp * T.yukikoBurnHeal * (this.traceTalent ? this.traceTalent(yk) : 1);
      const all = this.kitFx && this.kitFx(yk, 'burnHealAll');
      const low = list.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
      for (const a of all ? list : [low]) if (a.hp < a.maxHp) this.heal(yk, a, amt);
      if (this.kitFx) this.kitFx(yk, 'burnTick');
    },

    aoaReady() {
      const u = this.current;
      return !!u && this.canAct() && !!u.flags.oneMore && this.living.length > 0 && this.living.every(e => e.broken);
    },

    allOut(lead) {
      const u = lead || this.current;
      if (!lead && !this.aoaReady()) return false;
      if (!lead) this.phase = 'run';
      const prevActing = this.acting, prevKind = this.actKind;
      this.acting = u;
      this.actKind = 'aoa';
      this.hitThisAction = new Set();
      const team = this.livingAllies;
      const yu = team.find(a => a.charId === 'yu');
      const bonus = yu ? T.aoaYu * (this.traceTalent ? this.traceTalent(yu) : 1) + ((this.kitFx && this.kitFx(yu, 'aoaUp')) || 0) : 0;
      this.push({ t: 'aoa', u, team: team.slice(), foes: this.living.slice() });
      for (const e of this.living.slice()) for (const a of team) if (alive(e) && alive(a)) this.hit(a, e, T.aoaAtk, { e: a.elem, kind: 'aoa', label: 'Атака всем отрядом', extraBonus: bonus });
      this.aoaN = (this.aoaN || 0) + 1;
      this.push({ t: 'aoaEnd', u, win: !this.living.length });
      this.actKind = prevKind;
      this.acting = prevActing;
      if (lead) return true;
      this.cleanup();
      this.acting = null;
      this.followUps();
      this.gainEnergy(u, T.energyBasic);
      this.actions++;
      this.finishAllyTurn(u);
      return true;
    },

    autoPersona(u) {
      const foes = this.living;
      let best = u.flags.skillSel | 0, score = -1;
      PERSONAS.forEach((p, i) => {
        const weak = foes.filter(e => !e.broken && e.weak.includes(p.elem));
        const s = weak.length * 10 + weak.reduce((a, e) => a + (e.data.boss || e.data.elite ? 5 : 0), 0) + (i === 2 && foes.length >= 3 ? 1 : 0);
        if (s > score) { score = s; best = i; }
      });
      this.setSkill(u, best);
    }
  });

  Object.assign(H.CHARS, KITS);
  Object.assign(H.FUSIONS, FUSIONS);
  Object.assign(H.CONES, CONES);
  H.coneInit(CONES);
  H.INABA = { KITS, PERSONAS, FUSIONS, CONES, TAG_NAMES, isInaba };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
