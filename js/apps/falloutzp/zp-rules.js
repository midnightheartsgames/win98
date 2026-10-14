(function (Z) {
  'use strict';

  Z.STATS = [
    { id: 'str', name: 'Сила', short: 'СИЛ', desc: 'Физическая сила. Влияет на грузоподъёмность, урон холодным оружием и навык «Холодное оружие». Тяжёлое оружие слабому не по руке.' },
    { id: 'per', name: 'Восприятие', short: 'ВОС', desc: 'Зоркость и слух. Влияет на навыки «Энергооружие», «Подрывное дело», «Взлом» и на то, как рано враги отмечаются на компасе.' },
    { id: 'end', name: 'Выносливость', short: 'ВЫН', desc: 'Здоровье и стойкость. Влияет на запас здоровья, сопротивление радиации, навыки «Выживание» и «Рукопашный бой».' },
    { id: 'cha', name: 'Обаяние', short: 'ОБА', desc: 'Умение нравиться людям. Влияет на навыки «Торговля» и «Красноречие» и на боевой дух ваших спутников.' },
    { id: 'int', name: 'Интеллект', short: 'ИНТ', desc: 'Ум и образованность. Влияет на навыки «Медицина», «Ремонт», «Наука» и на число очков навыков за уровень.' },
    { id: 'agi', name: 'Ловкость', short: 'ЛОВ', desc: 'Координация и проворство. Влияет на очки действия С.Т.Р.Е.Л.А., скорость перезарядки, навыки «Стрелковое оружие» и «Скрытность».' },
    { id: 'lck', name: 'Удача', short: 'УДА', desc: 'Везение. Повышает шанс критического попадания, понемногу все навыки и выигрыш в «Очко».' }
  ];
  Z.STAT_IDS = Z.STATS.map(s => s.id);

  Z.SKILLS = [
    { id: 'barter', name: 'Торговля', stat: 'cha', desc: 'Умение торговаться. Чем выше навык, тем дешевле покупка и дороже продажа.' },
    { id: 'energy', name: 'Энергооружие', stat: 'per', desc: 'Владение разрядниками, лучевыми и СВЧ-излучателями советской оборонной науки.' },
    { id: 'explosives', name: 'Подрывное дело', stat: 'per', desc: 'Гранаты, мины, тротиловые шашки. Влияет на урон, дальность броска и разминирование.' },
    { id: 'guns', name: 'Стрелковое оружие', stat: 'agi', desc: 'Пистолеты, винтовки, автоматы, дробовики. Влияет на точность и урон.' },
    { id: 'lockpick', name: 'Взлом', stat: 'per', desc: 'Вскрытие замков отмычкой и отвёрткой. Сложные замки требуют высокого навыка.' },
    { id: 'medicine', name: 'Медицина', stat: 'int', desc: 'Сколько здоровья дают шприц-тюбики и аптечки, лечение увечий, некоторые реплики.' },
    { id: 'melee', name: 'Холодное оружие', stat: 'str', desc: 'Ножи, лопатки, монтировки, шашки и кувалды.' },
    { id: 'repair', name: 'Ремонт', stat: 'int', desc: 'Починка оружия и одежды, работа на верстаке, починка механизмов в мире.' },
    { id: 'science', name: 'Наука', stat: 'int', desc: 'Взлом ЭВМ, работа с приборами, научные реплики в разговоре.' },
    { id: 'sneak', name: 'Скрытность', stat: 'agi', desc: 'Двигаться незаметно, красть, наносить скрытые удары.' },
    { id: 'speech', name: 'Красноречие', stat: 'cha', desc: 'Убедить, обмануть, напугать. Многие задания можно решить словом.' },
    { id: 'survival', name: 'Выживание', stat: 'end', desc: 'Готовка на костре, польза еды, урон зверям и мутантам.' },
    { id: 'unarmed', name: 'Рукопашный бой', stat: 'end', desc: 'Кулаки, кастеты и силовые перчатки. Самбо выручает, когда кончились патроны.' }
  ];
  Z.SKILL_IDS = Z.SKILLS.map(s => s.id);
  Z.skillName = id => (Z.SKILLS.find(s => s.id === id) || { name: id }).name;
  Z.statName = id => (Z.STATS.find(s => s.id === id) || { name: id }).name;

  Z.TRAITS = [
    { id: 'heavyhand', name: 'Тяжёлая рука', desc: 'Удары холодным оружием и кулаками на 20% сильнее, но критический урон ими вдвое меньше.' },
    { id: 'fastshot', name: 'Торопыга', desc: 'Стреляете на 20% быстрее, но на 20% хуже целитесь.' },
    { id: 'pedant', name: 'Педант', desc: 'Стреляете на 20% медленнее, зато на 20% точнее.' },
    { id: 'foureyes', name: 'Очкарик', desc: 'В очках Восприятие +1, без очков −1.' },
    { id: 'peaceatom', name: 'Мирный атом', desc: '+10 к Торговле, Медицине, Ремонту, Науке и Красноречию, −10 к боевым навыкам.' },
    { id: 'reckless', name: 'Шальной', desc: '+10 очков действия, но порог урона −2.' },
    { id: 'frail', name: 'Хилый', desc: 'Ловкость +1, но руки и ноги ломаются легче.' },
    { id: 'breaker', name: 'Ломать — не строить', desc: 'Шанс крита +3%, но вещи изнашиваются на 15% быстрее.' },
    { id: 'thrower', name: 'Метатель', desc: 'Гранаты летят на 30% быстрее, но на 25% ближе.' },
    { id: 'wildfield', name: 'Дикое Поле', desc: 'Пустошь становится страннее: необычные встречи, находки и реплики.' }
  ];

  const P = (id, name, lvl, req, ranks, desc) => ({ id, name, lvl, req: req || {}, ranks: ranks || 1, desc });
  Z.PERKS = [
    P('gto', 'Сдал нормы ГТО', 2, {}, 10, '+1 к любой характеристике ГТО.'),
    P('quickdraw', 'Быстрая рука', 2, { agi: 5 }, 1, 'Оружие достаётся и убирается на 50% быстрее.'),
    P('voroshilov', 'Ворошиловский стрелок', 2, { agi: 5, guns: 25 }, 1, 'Пистолеты и револьверы в С.Т.Р.Е.Л.А.: шанс попадания +25%.'),
    P('learner', 'Способный ученик', 2, { int: 4 }, 3, 'Опыт +10% за ранг.'),
    P('hunter', 'Охотник', 2, { survival: 30 }, 1, 'Крит по зверям и мутантам +75% урона.'),
    P('reload', 'Перезарядка по нормативу', 2, { agi: 5 }, 1, 'Перезарядка на 25% быстрее.'),
    P('educated', 'Отличник', 4, { int: 4 }, 1, '+2 очка навыков на каждом уровне.'),
    P('comprehension', 'Вдумчивый читатель', 4, { int: 4 }, 1, 'Книги дают +1 к навыку больше, журналы действуют вдвое дольше.'),
    P('runngun', 'Огонь на ходу', 4, { guns: 45 }, 1, 'Разброс одноручного оружия на ходу вдвое меньше.'),
    P('leadbelly', 'Лужёный желудок', 4, { end: 5 }, 1, 'Радиация от еды и речной воды вдвое меньше.'),
    P('retention', 'Конспект', 4, { int: 5 }, 1, 'Журналы действуют втрое дольше.'),
    P('toughness', 'Толстокожий', 6, { end: 5 }, 2, 'Порог урона +3 за ранг.'),
    P('bloodymess', 'Мясорубка', 6, {}, 1, 'Весь урон +5%. Враги разлетаются эффектнее.'),
    P('fortune', 'Кладоискатель', 6, { lck: 5 }, 1, 'В тайниках и ящиках больше талонов.'),
    P('sapper', 'Сапёр', 6, { explosives: 50 }, 3, 'Урон взрывчатки +20% за ранг.'),
    P('buckshot', 'Картечь', 6, { guns: 45 }, 1, 'Дробовики игнорируют 10 единиц порога урона.'),
    P('comrades', 'Верные товарищи', 6, { cha: 6 }, 1, 'Когда у вас меньше половины здоровья, спутники получают вдвое меньше урона.'),
    P('menace', 'Грозный взгляд', 6, { speech: 70 }, 1, 'В разговоре можно припугнуть собеседника.'),
    P('stormtrooper', 'Штурмовик', 8, { agi: 6, guns: 45 }, 1, 'Двуручное оружие в С.Т.Р.Е.Л.А.: шанс попадания +25%.'),
    P('soldier', 'Солдат', 8, { guns: 45, explosives: 20 }, 1, 'Урон из ПМ, АКМ, СКС и гранатами Ф-1/РГД +25%.'),
    P('cossack', 'Казак', 8, { guns: 45, melee: 45 }, 1, 'Урон шашкой, наганом, винтовкой Мосина и тротилом +25%.'),
    P('anatomy', 'Анатом', 8, { medicine: 70 }, 1, 'Видно здоровье и порог урона цели. Урон по людям и хоботам +5%.'),
    P('mover', 'Грузчик', 8, { str: 5, end: 5 }, 1, 'Грузоподъёмность +50.'),
    P('scrounger', 'Запасливый', 8, { lck: 5 }, 1, 'В контейнерах больше патронов.'),
    P('hammer', 'Молот', 8, { str: 6, melee: 45 }, 1, 'Удары холодным оружием и кулаками могут сбить с ног.'),
    P('liquidator', 'Ликвидатор', 8, { end: 5, survival: 40 }, 1, 'Сопротивление радиации +25%.'),
    P('finesse', 'Ювелир', 10, {}, 1, 'Шанс крита +5%.'),
    P('stillwater', 'Тихий омут', 10, { int: 5, science: 50 }, 1, 'При здоровье ниже 20%: Сила +3, порог урона +15.'),
    P('lullaby', 'Колыбельная', 10, { sneak: 60 }, 1, 'Спящего можно убить тихо, без шума.'),
    P('trainer', 'Дрессировщик', 10, { cha: 6, survival: 45 }, 1, 'Звери не нападают первыми.'),
    P('elektronik', 'Электроник', 12, { science: 50 }, 1, 'Урон по роботам +25%. Подкравшись, робота можно отключить.'),
    P('silentrun', 'Бесшумный бег', 12, { agi: 6, sneak: 50 }, 1, 'Бег не мешает скрытности.'),
    P('piercing', 'Пробивной', 12, { unarmed: 70 }, 1, 'Кулаки и холодное оружие игнорируют 15 порога урона.'),
    P('sniper', 'Снайпер', 12, { per: 6, agi: 6 }, 1, 'Шанс попасть в голову в С.Т.Р.Е.Л.А. +25%.'),
    P('arsonist', 'Поджигатель', 12, { explosives: 60 }, 1, 'Огненный урон +50%.'),
    P('chumak', 'Чумак', 12, { end: 6, barter: 70 }, 1, 'С перегрузом можно пользоваться быстрым перемещением.'),
    P('hitdeck', 'Ложись!', 12, { explosives: 70 }, 1, 'Порог урона от взрывов +25.'),
    P('kulibin', 'Кулибин', 14, { repair: 90 }, 1, 'Вещи можно чинить похожими вещами, не только такими же.'),
    P('pharmacist', 'Фармацевт', 14, { medicine: 60 }, 1, 'Препараты действуют вдвое дольше.'),
    P('lightstep', 'Лёгкая поступь', 14, { per: 6, agi: 6 }, 1, 'Мины и растяжки не срабатывают под вами.'),
    P('stakhanov', 'Стахановец', 16, { agi: 6 }, 2, 'Очки действия +15 за ранг.'),
    P('calc', 'Точный расчёт', 16, { per: 6, lck: 6 }, 1, 'Критический урон +50%.'),
    P('vocation', 'Призвание', 16, {}, 1, 'Ещё один отмеченный навык: +15.'),
    P('teetotal', 'Трезвенник', 16, { medicine: 60 }, 1, 'Привыкание к препаратам вдвое реже.'),
    P('safecracker', 'Медвежатник', 18, { per: 7, lockpick: 70 }, 1, 'Сломанный замок можно попробовать ещё раз.'),
    P('programmer', 'Программист', 18, { int: 7, science: 70 }, 1, 'Заблокированную ЭВМ можно взломать заново.'),
    P('sambo', 'Болевой приём', 18, { unarmed: 70 }, 1, 'Особый удар в С.Т.Р.Е.Л.А. парализует противника.')
  ];
  Z.perkDef = id => Z.PERKS.find(p => p.id === id);

  Z.KARMA = [
    [-750, 'Враг народа'], [-250, 'Хулиган'], [250, 'Гражданин'], [750, 'Сознательный гражданин'], [Infinity, 'Герой Труда']
  ];
  Z.karmaTitle = k => { for (const [lim, name] of Z.KARMA) if (k < lim) return name; return Z.KARMA[Z.KARMA.length - 1][1]; };

  Z.FACTIONS = [
    { id: 'komendatura', name: 'Комендатура', short: 'Комендатура' },
    { id: 'sich', name: 'Новая Сечь', short: 'Сечь' },
    { id: 'planner', name: 'Плановик', short: 'Плановик' },
    { id: 'coop', name: 'Кооператоры', short: 'Кооператоры' },
    { id: 'vozn', name: 'Вознесенка', short: 'Вознесенка' },
    { id: 'hobots', name: 'Хоботы «Красной воды»', short: 'Хоботы' },
    { id: 'brigade', name: 'Бригада Кузьмича', short: 'Бригада' },
    { id: 'shpana', name: 'Шпана', short: 'Шпана' }
  ];
  Z.repLevel = (fame, inf) => {
    if (fame >= 25 && inf >= 25) return { id: 'mixed', name: 'Неоднозначный', v: 0 };
    const net = fame - inf;
    if (net >= 50) return { id: 'idol', name: 'Почётный', v: 3 };
    if (net >= 25) return { id: 'liked', name: 'Уважаемый', v: 2 };
    if (net >= 10) return { id: 'accepted', name: 'Свой', v: 1 };
    if (net <= -50) return { id: 'enemy', name: 'Враг', v: -3 };
    if (net <= -25) return { id: 'hated', name: 'Ненавистный', v: -2 };
    if (net <= -10) return { id: 'shunned', name: 'Подозрительный', v: -1 };
    return { id: 'neutral', name: 'Нейтралитет', v: 0 };
  };

  Z.xpFor = L => 25 * (3 * L + 2) * (L - 1);
  Z.LEVEL_CAP = 30;

  Z.Sheet = class {
    constructor(o = {}) {
      this.stats = Object.assign({ str: 5, per: 5, end: 5, cha: 5, int: 5, agi: 5, lck: 5 }, o.stats || {});
      this.points = Object.assign({}, o.points || {});
      this.books = Object.assign({}, o.books || {});
      this.tags = (o.tags || []).slice();
      this.traits = (o.traits || []).slice();
      this.perks = Object.assign({}, o.perks || {});
      this.level = o.level || 1;
      this.xp = o.xp || 0;
      this.mods = [];
      this.implants = Object.assign({}, o.implants || {});
    }
    has(p) { return (this.perks[p] || 0) > 0 || this.traits.includes(p); }
    rank(p) { return this.perks[p] || 0; }
    modSum(key) { let s = 0; for (const m of this.mods) if (m[key]) s += m[key]; return s; }
    stat(id) {
      let v = this.stats[id] + (this.implants[id] || 0) + this.modSum(id);
      if (id === 'per' && this.traits.includes('foureyes')) v += this.glasses ? 1 : -1;
      if (id === 'agi' && this.traits.includes('frail')) v += 1;
      if (id === 'str' && this.has('stillwater') && this.lowHP) v += 3;
      return Z.clamp(v, 1, 10);
    }
    baseSkill(id) {
      const sk = Z.SKILLS.find(s => s.id === id);
      return 2 + 2 * this.stat(sk.stat) + Math.ceil(this.stat('lck') / 2);
    }
    skill(id) {
      let v = this.baseSkill(id) + (this.tags.includes(id) ? 15 : 0) + (this.points[id] || 0) + (this.books[id] || 0) + this.modSum('sk_' + id);
      if (this.traits.includes('peaceatom')) v += ['barter', 'medicine', 'repair', 'science', 'speech'].includes(id) ? 10 : ['energy', 'explosives', 'guns', 'melee', 'unarmed'].includes(id) ? -10 : 0;
      return Z.clamp(Math.round(v), 0, 100);
    }
    skillRaw(id) {
      return Z.clamp(this.baseSkill(id) + (this.tags.includes(id) ? 15 : 0) + (this.points[id] || 0) + (this.books[id] || 0), 0, 100);
    }
    maxHP() { return 100 + 20 * this.stat('end') + 5 * (this.level - 1); }
    maxAP() { return 65 + 3 * this.stat('agi') + (this.traits.includes('reckless') ? 10 : 0) + 15 * this.rank('stakhanov') + this.modSum('ap'); }
    apRegen() { return 6 + 0.75 * this.stat('agi'); }
    carry() { return 150 + 10 * this.stat('str') + (this.has('mover') ? 50 : 0) + this.modSum('carry'); }
    crit() { return this.stat('lck') + (this.traits.includes('breaker') ? 3 : 0) + (this.has('finesse') ? 5 : 0) + this.modSum('crit'); }
    dtBonus() { return 3 * this.rank('toughness') + (this.traits.includes('reckless') ? -2 : 0) + (this.has('stillwater') && this.lowHP ? 15 : 0) + this.modSum('dt'); }
    radRes() { return Z.clamp(2 * this.stat('end') + (this.has('liquidator') ? 25 : 0) + this.modSum('rr'), 0, 85); }
    skillPointsPerLevel() { return 10 + Math.floor(this.stat('int') / 2) + (this.has('educated') ? 2 : 0); }
    xpNext() { return Z.xpFor(this.level + 1); }
    xpMult() { return 1 + 0.1 * this.rank('learner'); }
    perkAvailable(p) {
      if (this.level < p.lvl) return false;
      if ((this.perks[p.id] || 0) >= p.ranks) return false;
      for (const k in p.req) {
        if (Z.STAT_IDS.includes(k)) { if (this.stats[k] < p.req[k]) return false; }
        else if (this.skillRaw(k) < p.req[k]) return false;
      }
      return true;
    }
    serialize() {
      return { stats: this.stats, points: this.points, books: this.books, tags: this.tags, traits: this.traits, perks: this.perks, level: this.level, xp: this.xp, implants: this.implants };
    }
  };

  Z.npcSheet = (lvl, stats, skills) => {
    const s = new Z.Sheet({ stats, level: lvl || 1 });
    s.fixed = skills || null;
    if (skills) { const base = s.skill.bind(s); s.skill = id => skills[id] !== undefined ? skills[id] : base(id); }
    return s;
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
