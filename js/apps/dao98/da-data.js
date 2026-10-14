(function (D) {
  'use strict';

  D.ATTRS = [
    ['str', 'Сила', 'Урон в ближнем бою, требования к оружию и броне, запугивание.'],
    ['dex', 'Ловкость', 'Точность, защита, урон кинжалов и луков.'],
    ['wil', 'Сила воли', 'Запас маны или выносливости.'],
    ['mag', 'Магия', 'Сила заклинаний, мана магов, эффективность зелий.'],
    ['cun', 'Хитрость', 'Навыки, убеждение, пробивание брони разбойника.'],
    ['con', 'Телосложение', 'Здоровье и стойкость к физическим эффектам.']
  ];
  D.ATTR_NAME = Object.fromEntries(D.ATTRS.map(a => [a[0], a[1]]));

  D.RACES = {
    human: { name: 'Человек', attr: { str: 1, dex: 1, mag: 1, cun: 1 }, desc: 'Люди Ферелдена — самый многочисленный народ Тедаса. Упрямые и гордые, они помнят, как изгнали орлесианских захватчиков всего поколение назад.' },
    elf: { name: 'Эльф', attr: { wil: 2, mag: 2 }, desc: 'Эльфы когда-то правили Арлатаном, но потеряли всё. Городские эльфы живут в эльфинажах, долийцы кочуют по лесам и хранят обрывки древних знаний.' },
    dwarf: { name: 'Гном', attr: { str: 1, dex: 1, con: 2 }, resist: 10, desc: 'Гномы живут в подземном городе Орзаммар и сдерживают порождений тьмы на Глубинных тропах. Они не видят снов и не могут стать магами.' }
  };

  D.CLASSES = {
    warrior: { name: 'Воин', attr: { str: 4, dex: 3, con: 3 }, hp: 95, hpLv: 7, mp: 45, mpLv: 5, res: 'stamina', skills: 1, desc: 'Мастер оружия и брони. Держит врагов на себе, носит самые тяжёлые доспехи и выдерживает больше всех.' },
    rogue: { name: 'Разбойник', attr: { dex: 4, cun: 4, str: 1, con: 1 }, hp: 80, hpLv: 6, mp: 40, mpLv: 5, res: 'stamina', skills: 2, desc: 'Бьёт в спину, вскрывает замки и выживает за счёт хитрости. Удар из-за спины врага всегда критический.' },
    mage: { name: 'Маг', attr: { mag: 5, wil: 4, cun: 1 }, hp: 62, hpLv: 4, mp: 50, mpLv: 6, res: 'mana', skills: 1, desc: 'Повелевает стихиями, исцеляет и проклинает. Хрупок, но способен решить исход боя одним заклинанием.' }
  };

  D.ORIGINS = {
    hn: { name: 'Человек-дворянин', races: ['human'], classes: ['warrior', 'rogue'], family: 'Кусланд', start: ['highever', 'pc_room'], desc: 'Младший ребёнок тейрна Брайса Кусланда из Хайевера. Отец уводит войска на юг, в Остагар, а замок остаётся на вас и мать. Ночью союзник семьи, эрл Рендон Хоу, решает, что время пришло.' },
    mage: { name: 'Маг', races: ['human', 'elf'], classes: ['mage'], family: '', start: ['harrowing', 'start'], desc: 'Вас забрали в Круг магов ребёнком. Сегодня ночью Истязание: храмовники отправят ваш разум в Тень, где ждёт демон. Вернётесь магом Круга или не вернётесь вовсе.' },
    ce: { name: 'Городской эльф', races: ['elf'], classes: ['warrior', 'rogue'], family: 'Табрис', start: ['alienage', 'home'], desc: 'День вашей свадьбы в денеримском эльфинаже. Жених или невеста приехали из Хайевера, кузены суетятся, старейшина Валендриан готов провести обряд. Но в эльфинаж заходит сын эрла Денерима со своими дружками.' },
    de: { name: 'Долийский эльф', races: ['elf'], classes: ['warrior', 'rogue'], family: 'Махариэль', start: ['dalish_road', 'start'], desc: 'Охотник клана Хранительницы Маретари. Вместе с другом Тамленом вы находите в лесу троих людей, а те рассказывают о пещере с древними руинами. Тамлен хочет посмотреть. Долийцы не должны бояться своего прошлого.' },
    dn: { name: 'Гном-аристократ', races: ['dwarf'], classes: ['warrior', 'rogue'], family: 'Эдукан', start: ['orz_palace', 'room'], desc: 'Второй ребёнок короля Эндрина Эдукана. Сегодня вас назначают командующим армией, в вашу честь проводят Испытание и пир. Старший брат Триан ревнует, младший Бхелен слишком ласков.' },
    dc: { name: 'Гном-простолюдин', races: ['dwarf'], classes: ['warrior', 'rogue'], family: 'Броска', start: ['dust_town', 'home'], desc: 'В Пыльном городе живут безкастовые, у которых нет даже права на имя в Памяти. Ваша мать пьёт, сестра Рика ищет покровителя из знати, а вы с другом Леске ломаете кости для Беракта из Хартии.' }
  };

  D.SKILLS = {
    coercion: { name: 'Убеждение', desc: 'Проверки убеждения опираются на Хитрость, запугивания — на Силу.', ranks: ['Начальное', 'Продвинутое', 'Мастерское', 'Совершенное'] },
    combat_training: { name: 'Боевая подготовка', desc: 'Точность +3 за ранг. Маги реже сбиваются при чтении заклинаний.', ranks: ['Начальная', 'Продвинутая', 'Мастерская', 'Совершенная'] },
    combat_tactics: { name: 'Боевая тактика', desc: 'Каждый ранг даёт две ячейки тактики.', ranks: ['Начальная', 'Продвинутая', 'Мастерская', 'Совершенная'] },
    herbalism: { name: 'Травничество', desc: 'Изготовление припарок, лириумных зелий и наборов от ран.', ranks: ['Начальное', 'Продвинутое', 'Мастерское', 'Совершенное'] },
    poison: { name: 'Изготовление ядов', desc: 'Яды для клинков, флаконы с кислотой и бомбы.', ranks: ['Начальное', 'Продвинутое', 'Мастерское', 'Совершенное'] },
    stealing: { name: 'Воровство', desc: 'Позволяет обчищать карманы. Шанс растёт с рангом, Ловкостью и Хитростью.', ranks: ['Начальное', 'Продвинутое', 'Мастерское', 'Совершенное'] },
    survival: { name: 'Выживание', desc: 'Враги видны на мини-карте издалека, выше сопротивление природе.', ranks: ['Начальное', 'Продвинутое', 'Мастерское', 'Совершенное'] },
    traps: { name: 'Изготовление ловушек', desc: 'Капканы и ловушки, которые ставят на пути врага.', ranks: ['Начальное', 'Продвинутое', 'Мастерское', 'Совершенное'] }
  };
  D.SKILL_IDS = Object.keys(D.SKILLS);

  D.LINES = {
    w_power: { name: 'Воинская мощь', cls: ['warrior'], list: ['powerful', 'threaten', 'bravery', 'death_blow'] },
    w_prec: { name: 'Точность', cls: ['warrior'], list: ['precise_striking', 'taunt', 'disengage', 'perfect_striking'] },
    w_shield: { name: 'Оружие и щит', cls: ['warrior'], list: ['shield_bash', 'shield_defense', 'shield_pummel', 'assault'] },
    w_2h: { name: 'Двуручное оружие', cls: ['warrior'], list: ['pommel_strike', 'indomitable', 'sunder_arms', 'critical_strike'] },
    dual: { name: 'Бой с двумя клинками', cls: ['warrior', 'rogue'], list: ['dual_training', 'dual_striking', 'riposte', 'flurry'] },
    bow: { name: 'Стрельба из лука', cls: ['warrior', 'rogue'], list: ['pinning_shot', 'aim', 'rapid_shot', 'crippling_shot'] },
    r_dirty: { name: 'Грязный бой', cls: ['rogue'], list: ['dirty_fighting', 'below_belt', 'deadly_strike', 'lethality'] },
    r_stealth: { name: 'Скрытность', cls: ['rogue'], list: ['stealth', 'combat_movement', 'deft_hands', 'combat_stealth'] },
    r_evasion: { name: 'Уловки', cls: ['rogue'], list: ['evasion', 'feign_death', 'coup_de_grace', 'lacerate'] },
    m_heal: { name: 'Созидание: исцеление', cls: ['mage'], list: ['heal', 'rejuvenate', 'regeneration', 'mass_rejuvenation'] },
    m_hero: { name: 'Созидание: благословения', cls: ['mage'], list: ['heroic_offense', 'heroic_aura', 'haste', 'glyph_paralysis'] },
    m_sleep: { name: 'Энтропия: разум', cls: ['mage'], list: ['disorient', 'horror', 'sleep', 'waking_nightmare'] },
    m_drain: { name: 'Энтропия: жизнь', cls: ['mage'], list: ['drain_life', 'weakness', 'curse_mortality', 'death_syphon'] },
    m_fire: { name: 'Стихии: огонь', cls: ['mage'], list: ['flame_blast', 'flaming_weapons', 'fireball', 'inferno'] },
    m_ice: { name: 'Стихии: холод', cls: ['mage'], list: ['winters_grasp', 'frost_weapons', 'cone_of_cold', 'blizzard'] },
    m_earth: { name: 'Стихии: земля', cls: ['mage'], list: ['rock_armor', 'stonefist', 'earthquake', 'petrify'] },
    m_spirit: { name: 'Дух', cls: ['mage'], list: ['mind_blast', 'spell_wisp', 'force_field', 'crushing_prison'] },
    dog: { name: 'Боевой мабари', cls: ['dog'], list: ['overwhelm', 'howl', 'shred', 'fortitude'] }
  };
  D.TIER_LEVEL = [1, 3, 5, 7];

  const A = (id, o) => { o.id = id; return o; };
  const ab = {};
  const add = (id, o) => { ab[id] = A(id, o); };

  add('powerful', { name: 'Мощь', kind: 'pas', fx: { pas: { hpMax: 25, fat: -3 } }, ic: ['fist', '#c84'], desc: 'Здоровье +25, утомление −3%.' });
  add('threaten', { name: 'Угроза', kind: 'sus', cost: 25, fx: { sus: { threat: 3 } }, ic: ['horn', '#d63'], desc: 'Враги считают воина главной угрозой. Выносливость восстанавливается медленнее.' });
  add('bravery', { name: 'Отвага', kind: 'pas', fx: { pas: { dmg: 2, crit: 3, res: 5 } }, ic: ['lion', '#da4'], desc: 'Урон +2, шанс крита +3%, сопротивление +5.' });
  add('death_blow', { name: 'Смертельный удар', kind: 'pas', fx: { pas: { onKillMp: 12 } }, ic: ['skull', '#b33'], desc: 'Каждое убийство возвращает 12 выносливости.' });
  add('precise_striking', { name: 'Точные удары', kind: 'sus', cost: 30, fx: { sus: { atk: 10, crit: 5, spd: 1.2 } }, ic: ['eye', '#9cf'], desc: 'Точность +10, крит +5%, но удары медленнее.' });
  add('taunt', { name: 'Насмешка', kind: 'act', cost: 30, cd: 25, tgt: 'self', fx: { taunt: { r: 7 } }, ic: ['horn', '#f64'], desc: 'Все враги рядом переключаются на воина.' });
  add('disengage', { name: 'Отступление', kind: 'act', cost: 15, cd: 15, tgt: 'enemy', range: 8, fx: { disengage: true }, ic: ['shield', '#8ac'], desc: 'Цель теряет интерес к воину.' });
  add('perfect_striking', { name: 'Безупречные удары', kind: 'act', cost: 45, cd: 60, tgt: 'self', fx: { buff: { mods: { atk: 40 }, dur: 12 } }, ic: ['eye', '#ffd'], desc: 'На 12 секунд точность +40.' });
  add('shield_bash', { name: 'Удар щитом', kind: 'act', cost: 20, cd: 10, tgt: 'enemy', range: 'melee', need: 'shield', fx: { hit: { mult: 1.0, st: 'knock', dur: 2.5, res: 'phys' } }, ic: ['shield', '#da6'], desc: 'Удар щитом с шансом сбить с ног.' });
  add('shield_defense', { name: 'Оборона щитом', kind: 'sus', cost: 25, need: 'shield', fx: { sus: { def: 15, mdef: 20, atk: -5 } }, ic: ['shield', '#6ad'], desc: 'Защита +15, защита от стрел +20, точность −5.' });
  add('shield_pummel', { name: 'Натиск щитом', kind: 'act', cost: 25, cd: 15, tgt: 'enemy', range: 'melee', need: 'shield', fx: { hit: { mult: 0.8, n: 2, st: 'stun', dur: 3, res: 'phys' } }, ic: ['shield', '#fa4'], desc: 'Два удара щитом, второй оглушает.' });
  add('assault', { name: 'Штурм', kind: 'act', cost: 40, cd: 30, tgt: 'enemy', range: 'melee', need: 'shield', fx: { hit: { mult: 0.75, n: 4 } }, ic: ['sword', '#f84'], desc: 'Четыре быстрых удара подряд.' });
  add('pommel_strike', { name: 'Удар навершием', kind: 'act', cost: 20, cd: 10, tgt: 'enemy', range: 'melee', need: '2h', fx: { hit: { mult: 0.6, st: 'knock', dur: 2.5, res: 'phys' } }, ic: ['hammer', '#da6'], desc: 'Удар рукоятью, сбивающий с ног.' });
  add('indomitable', { name: 'Непоколебимость', kind: 'sus', cost: 30, need: '2h', fx: { sus: { immune: 1 } }, ic: ['tower', '#aa8'], desc: 'Воина нельзя сбить с ног или оглушить.' });
  add('sunder_arms', { name: 'Сокрушение доспехов', kind: 'act', cost: 25, cd: 15, tgt: 'enemy', range: 'melee', need: '2h', fx: { hit: { mult: 1.0 }, debuff: { mods: { arm: -5 }, dur: 20, res: 'none' } }, ic: ['hammer', '#c96'], desc: 'Удар ослабляет броню цели на 20 секунд.' });
  add('critical_strike', { name: 'Критический удар', kind: 'act', cost: 40, cd: 30, tgt: 'enemy', range: 'melee', need: '2h', fx: { hit: { mult: 1.5, crit: true } }, ic: ['sword', '#f33'], desc: 'Мощный удар, который всегда наносит критический урон.' });
  add('dual_training', { name: 'Бой с двумя клинками', kind: 'pas', fx: { pas: { offhand: 1 } }, ic: ['dual', '#9cf'], desc: 'Оружие в левой руке наносит полный урон.' });
  add('dual_striking', { name: 'Двойной удар', kind: 'sus', cost: 25, need: 'dual', fx: { sus: { dmgPct: 20, spd: 1.1 } }, ic: ['dual', '#fc6'], desc: 'Урон +20%, атаки чуть медленнее.' });
  add('riposte', { name: 'Рипост', kind: 'act', cost: 20, cd: 15, tgt: 'enemy', range: 'melee', need: 'dual', fx: { hit: { mult: 1.0, st: 'stun', dur: 3, res: 'phys' } }, ic: ['dual', '#fa4'], desc: 'Удар с оглушением.' });
  add('flurry', { name: 'Шквал', kind: 'act', cost: 30, cd: 20, tgt: 'enemy', range: 'melee', need: 'dual', fx: { hit: { mult: 0.8, n: 3 } }, ic: ['dual', '#f66'], desc: 'Три быстрых удара.' });
  add('pinning_shot', { name: 'Пригвождающий выстрел', kind: 'act', cost: 20, cd: 15, tgt: 'enemy', range: 'bow', need: 'bow', fx: { hit: { mult: 1.0, st: 'pin', dur: 6, res: 'phys' } }, ic: ['arrow', '#da6'], desc: 'Стрела пригвождает цель к месту.' });
  add('aim', { name: 'Прицеливание', kind: 'sus', cost: 20, need: 'bow', fx: { sus: { atk: 10, crit: 10, spd: 1.2 } }, ic: ['eye', '#fd6'], desc: 'Точнее и чаще в цель, но медленнее.' });
  add('rapid_shot', { name: 'Быстрая стрельба', kind: 'sus', cost: 30, need: 'bow', fx: { sus: { spd: 0.6, crit: -5 } }, ic: ['arrow', '#fc4'], desc: 'Стрелы летят почти вдвое чаще.' });
  add('crippling_shot', { name: 'Калечащий выстрел', kind: 'act', cost: 30, cd: 20, tgt: 'enemy', range: 'bow', need: 'bow', fx: { hit: { mult: 1.2 }, debuff: { mods: { atk: -10, def: -10 }, dur: 15, res: 'phys' } }, ic: ['arrow', '#c44'], desc: 'Выстрел, снижающий точность и защиту цели.' });
  add('dirty_fighting', { name: 'Грязный приём', kind: 'act', cost: 15, cd: 15, tgt: 'enemy', range: 'melee', fx: { hit: { mult: 0.3, st: 'stun', dur: 4, res: 'phys' } }, ic: ['fist', '#a86'], desc: 'Подлый удар, который оглушает.' });
  add('below_belt', { name: 'Удар ниже пояса', kind: 'act', cost: 20, cd: 10, tgt: 'enemy', range: 'melee', fx: { hit: { mult: 1.0 }, debuff: { mods: { def: -10, move: -0.3 }, dur: 10, res: 'phys' } }, ic: ['fist', '#c66'], desc: 'Цель медленнее и хуже защищается.' });
  add('deadly_strike', { name: 'Смертельный выпад', kind: 'act', cost: 25, cd: 20, tgt: 'enemy', range: 'melee', fx: { hit: { mult: 1.5, pierce: 0.6 } }, ic: ['dagger', '#f44'], desc: 'Удар, почти игнорирующий броню.' });
  add('lethality', { name: 'Смертоносность', kind: 'pas', fx: { pas: { crit: 5, dmg: 2 } }, ic: ['skull', '#c4c'], desc: 'Крит +5%, урон +2.' });
  add('stealth', { name: 'Скрытность', kind: 'sus', cost: 30, fx: { sus: { stealth: 1, move: -0.3 } }, ic: ['cloak', '#88a'], desc: 'Враги вас не видят. Первая атака из скрытности критическая.' });
  add('combat_movement', { name: 'Боевое перемещение', kind: 'pas', fx: { pas: { def: 5, flank: 1 } }, ic: ['boot', '#9c9'], desc: 'Защита +5, удары в спину проще.' });
  add('deft_hands', { name: 'Ловкие руки', kind: 'pas', fx: { pas: { lock: 1 } }, ic: ['key', '#dc8'], desc: 'Вскрытие замков +1 уровень.' });
  add('combat_stealth', { name: 'Скрытность в бою', kind: 'pas', fx: { pas: { combatStealth: 1 } }, ic: ['cloak', '#a8f'], desc: 'Уходить в тень можно даже в разгар боя.' });
  add('evasion', { name: 'Уклонение', kind: 'pas', fx: { pas: { dodge: 10 } }, ic: ['boot', '#adf'], desc: '10% шанс полностью избежать удара.' });
  add('feign_death', { name: 'Притвориться мёртвым', kind: 'act', cost: 20, cd: 40, tgt: 'self', fx: { feign: 6 }, ic: ['skull', '#888'], desc: 'Враги теряют к вам интерес.' });
  add('coup_de_grace', { name: 'Добивание', kind: 'pas', fx: { pas: { coup: 1 } }, ic: ['dagger', '#f66'], desc: 'Удары по оглушённым и сбитым врагам всегда критические.' });
  add('lacerate', { name: 'Рваные раны', kind: 'pas', fx: { pas: { bleedOnCrit: 1 } }, ic: ['dagger', '#c22'], desc: 'Критические удары вызывают кровотечение.' });
  add('heal', { name: 'Исцеление', kind: 'act', cost: 15, cd: 10, tgt: 'ally', range: 12, fx: { heal: { base: 30, sp: 2.2 } }, ic: ['hand', '#6f6'], desc: 'Мгновенно лечит союзника.' });
  add('rejuvenate', { name: 'Восстановление', kind: 'act', cost: 15, cd: 30, tgt: 'ally', range: 12, fx: { mana: { base: 35, sp: 1.2 } }, ic: ['hand', '#6cf'], desc: 'Возвращает союзнику ману или выносливость.' });
  add('regeneration', { name: 'Регенерация', kind: 'act', cost: 30, cd: 20, tgt: 'ally', range: 12, fx: { buff: { mods: { hpRegen: 6 }, dur: 12 } }, ic: ['hand', '#9f6'], desc: 'Союзник быстро восстанавливает здоровье.' });
  add('mass_rejuvenation', { name: 'Массовое восстановление', kind: 'act', cost: 40, cd: 60, tgt: 'self', fx: { party: { mana: 40 } }, ic: ['hand', '#4cf'], desc: 'Весь отряд восстанавливает ману и выносливость.' });
  add('heroic_offense', { name: 'Героический натиск', kind: 'act', cost: 20, cd: 10, tgt: 'ally', range: 12, fx: { buff: { mods: { atk: 15 }, dur: 30 } }, ic: ['sword', '#ff8'], desc: 'Точность союзника +15.' });
  add('heroic_aura', { name: 'Героическая аура', kind: 'act', cost: 25, cd: 20, tgt: 'ally', range: 12, fx: { buff: { mods: { mdef: 40 }, dur: 30 } }, ic: ['shield', '#ff8'], desc: 'Стрелы почти не попадают в союзника.' });
  add('haste', { name: 'Ускорение', kind: 'sus', cost: 50, fx: { sus: { partySpd: 0.75, partyMove: 0.25 } }, ic: ['boot', '#ff6'], desc: 'Весь отряд двигается и бьёт быстрее.' });
  add('glyph_paralysis', { name: 'Глиф паралича', kind: 'act', cost: 30, cd: 30, tgt: 'ground', range: 12, fx: { aoe: { r: 2.5, st: 'para', dur: 7, res: 'ment', foes: true, glyph: 1 } }, ic: ['rune', '#fc4'], desc: 'Враги в круге парализованы.' });
  add('disorient', { name: 'Дезориентация', kind: 'act', cost: 15, cd: 10, tgt: 'enemy', range: 12, fx: { debuff: { mods: { atk: -15, def: -15 }, dur: 12, res: 'ment' } }, ic: ['spiral', '#a6f'], desc: 'Цель хуже бьёт и защищается.' });
  add('horror', { name: 'Ужас', kind: 'act', cost: 25, cd: 20, tgt: 'enemy', range: 12, fx: { debuff: { st: 'horror', dur: 8, res: 'ment' } }, ic: ['skull', '#a6f'], desc: 'Цель съёживается от ужаса.' });
  add('sleep', { name: 'Сон', kind: 'act', cost: 40, cd: 40, tgt: 'ground', range: 14, fx: { aoe: { r: 4, st: 'sleep', dur: 12, res: 'ment', foes: true } }, ic: ['moon', '#86f'], desc: 'Враги в области засыпают. Урон их будит.' });
  add('waking_nightmare', { name: 'Кошмар наяву', kind: 'act', cost: 50, cd: 60, tgt: 'ground', range: 14, fx: { aoe: { r: 4, st: 'horror', dur: 12, res: 'ment', foes: true } }, ic: ['moon', '#c4f'], desc: 'Враги в области видят кошмары.' });
  add('drain_life', { name: 'Высасывание жизни', kind: 'act', cost: 20, cd: 15, tgt: 'enemy', range: 12, fx: { drain: { base: 14, sp: 1.4 } }, ic: ['drop', '#c3c'], desc: 'Забирает здоровье у цели.' });
  add('weakness', { name: 'Слабость', kind: 'act', cost: 20, cd: 15, tgt: 'enemy', range: 12, fx: { debuff: { mods: { atk: -10, def: -10, dmg: -3, move: -0.3 }, dur: 15, res: 'ment' } }, ic: ['drop', '#96c'], desc: 'Цель слабеет и замедляется.' });
  add('curse_mortality', { name: 'Проклятие смертности', kind: 'act', cost: 30, cd: 30, tgt: 'enemy', range: 12, fx: { dot: { el: 'spirit', dps: 4, dur: 20 }, debuff: { mods: { noRegen: 1 }, dur: 20, res: 'none' } }, ic: ['skull', '#c3c'], desc: 'Цель медленно теряет здоровье и не может лечиться.' });
  add('death_syphon', { name: 'Смертный сифон', kind: 'sus', cost: 30, fx: { sus: { mpRegen: 1.5 } }, ic: ['drop', '#a4a'], desc: 'Мана восстанавливается быстрее.' });
  add('flame_blast', { name: 'Огненная вспышка', kind: 'act', cost: 20, cd: 10, tgt: 'enemy', range: 6, fx: { cone: { el: 'fire', base: 14, sp: 1.5, deg: 50, len: 6.5, dot: { dps: 3, dur: 4 } } }, ic: ['flame', '#f84'], desc: 'Конус огня перед магом. Задевает союзников.' });
  add('flaming_weapons', { name: 'Пылающее оружие', kind: 'sus', cost: 40, fx: { sus: { partyFire: 5 } }, ic: ['flame', '#fa4'], desc: 'Оружие отряда наносит +5 урона огнём.' });
  add('fireball', { name: 'Огненный шар', kind: 'act', cost: 40, cd: 20, tgt: 'ground', range: 16, fx: { bolt: { el: 'fire', base: 26, sp: 2.0, aoe: 3, st: 'knock', dur: 2, res: 'phys', ff: 1, speed: 14 } }, ic: ['flame', '#f62'], desc: 'Взрывается огнём и сбивает с ног. Задевает союзников.' });
  add('inferno', { name: 'Преисподняя', kind: 'act', cost: 60, cd: 60, tgt: 'ground', range: 16, fx: { field: { el: 'fire', dps: 9, r: 4.5, dur: 8 } }, ic: ['flame', '#f30'], desc: 'Огненная буря на долгие секунды.' });
  add('winters_grasp', { name: 'Хватка зимы', kind: 'act', cost: 20, cd: 10, tgt: 'enemy', range: 12, fx: { bolt: { el: 'cold', base: 12, sp: 1.5, st: 'freeze', dur: 3, res: 'phys', speed: 16 } }, ic: ['snow', '#8cf'], desc: 'Ледяной снаряд, может заморозить.' });
  add('frost_weapons', { name: 'Ледяное оружие', kind: 'sus', cost: 40, fx: { sus: { partyCold: 5 } }, ic: ['snow', '#adf'], desc: 'Оружие отряда наносит +5 урона холодом.' });
  add('cone_of_cold', { name: 'Конус холода', kind: 'act', cost: 35, cd: 20, tgt: 'enemy', range: 6, fx: { cone: { el: 'cold', base: 10, sp: 1.0, deg: 55, len: 7, st: 'freeze', dur: 5, res: 'phys' } }, ic: ['snow', '#6af'], desc: 'Замораживает всех перед магом.' });
  add('blizzard', { name: 'Буран', kind: 'act', cost: 60, cd: 60, tgt: 'ground', range: 16, fx: { field: { el: 'cold', dps: 6, r: 5, dur: 8, slow: 1 } }, ic: ['snow', '#fff'], desc: 'Снежная буря режет и замедляет.' });
  add('rock_armor', { name: 'Каменный доспех', kind: 'sus', cost: 30, fx: { sus: { arm: 5 } }, ic: ['rock', '#a97'], desc: 'Кожа мага становится камнем: броня +5.' });
  add('stonefist', { name: 'Каменный кулак', kind: 'act', cost: 25, cd: 15, tgt: 'enemy', range: 14, fx: { bolt: { el: 'phys', base: 18, sp: 1.6, st: 'knock', dur: 2.5, res: 'phys', speed: 15, stone: 1 } }, ic: ['rock', '#c96'], desc: 'Глыба сбивает цель с ног.' });
  add('earthquake', { name: 'Землетрясение', kind: 'act', cost: 50, cd: 40, tgt: 'ground', range: 16, fx: { aoe: { r: 5, st: 'knock', dur: 3, res: 'phys', foes: true, shake: 1 } }, ic: ['rock', '#963'], desc: 'Земля уходит у врагов из-под ног.' });
  add('petrify', { name: 'Окаменение', kind: 'act', cost: 40, cd: 40, tgt: 'enemy', range: 12, fx: { debuff: { st: 'para', dur: 10, res: 'phys' } }, ic: ['rock', '#bbb'], desc: 'Цель превращается в камень.' });
  add('mind_blast', { name: 'Удар разума', kind: 'act', cost: 25, cd: 20, tgt: 'self', fx: { aoe: { r: 3.5, at: 'self', st: 'stun', dur: 3, res: 'ment', foes: true, threatWipe: 1 } }, ic: ['spiral', '#6ff'], desc: 'Оглушает всех врагов рядом с магом.' });
  add('spell_wisp', { name: 'Огонёк чар', kind: 'sus', cost: 30, fx: { sus: { sp: 6 } }, ic: ['wisp', '#aff'], desc: 'Сила заклинаний +6.' });
  add('force_field', { name: 'Силовое поле', kind: 'act', cost: 30, cd: 30, tgt: 'any', range: 12, fx: { debuff: { st: 'field', dur: 8, res: 'none' } }, ic: ['orb', '#6cf'], desc: 'Цель неуязвима, но и сама ничего не может.' });
  add('crushing_prison', { name: 'Сокрушающая темница', kind: 'act', cost: 50, cd: 45, tgt: 'enemy', range: 12, fx: { debuff: { st: 'para', dur: 6, res: 'none' }, dot: { el: 'spirit', dps: 9, dur: 6 } }, ic: ['orb', '#c8f'], desc: 'Стены из силы сдавливают цель.' });
  add('overwhelm', { name: 'Натиск', kind: 'act', cost: 20, cd: 15, tgt: 'enemy', range: 'melee', fx: { hit: { mult: 1.3, st: 'knock', dur: 3, res: 'phys' } }, ic: ['paw', '#c84'], desc: 'Пёс валит врага на землю.' });
  add('howl', { name: 'Вой', kind: 'act', cost: 25, cd: 20, tgt: 'self', fx: { aoe: { r: 5, at: 'self', foes: true, mods: { atk: -10, def: -10 }, dur: 10, res: 'ment' } }, ic: ['horn', '#c84'], desc: 'Враги рядом теряют уверенность.' });
  add('shred', { name: 'Разорвать', kind: 'act', cost: 30, cd: 20, tgt: 'enemy', range: 'melee', fx: { hit: { mult: 1.6 }, dot: { el: 'phys', dps: 3, dur: 6 } }, ic: ['paw', '#c33'], desc: 'Рваная рана кровоточит.' });
  add('fortitude', { name: 'Стойкость', kind: 'pas', fx: { pas: { arm: 4, hpMax: 30 } }, ic: ['paw', '#aa8'], desc: 'Броня +4, здоровье +30.' });

  add('grab', { name: 'Хватка огра', kind: 'act', cost: 0, cd: 16, tgt: 'enemy', range: 'melee', fx: { grab: { dur: 4, dps: 9 } }, ic: ['fist', '#a44'], desc: '' });
  add('ogre_slam', { name: 'Удар оземь', kind: 'act', cost: 0, cd: 12, tgt: 'self', fx: { aoe: { r: 3.5, at: 'self', foes: true, el: 'phys', base: 18, sp: 0, st: 'knock', dur: 2.5, res: 'phys', shake: 1 } }, ic: ['fist', '#a44'], desc: '' });
  add('web', { name: 'Паутина', kind: 'act', cost: 0, cd: 14, tgt: 'enemy', range: 10, fx: { bolt: { el: 'nature', base: 4, sp: 0, st: 'pin', dur: 5, res: 'phys', speed: 12, web: 1 } }, ic: ['rune', '#ddd'], desc: '' });
  add('fire_bolt', { name: 'Огненная стрела', kind: 'act', cost: 0, cd: 5, tgt: 'enemy', range: 14, fx: { bolt: { el: 'fire', base: 12, sp: 1.0, speed: 14 } }, ic: ['flame', '#f84'], desc: '' });
  add('fire_aura', { name: 'Пламенная аура', kind: 'act', cost: 0, cd: 9, tgt: 'self', fx: { aoe: { r: 3, at: 'self', foes: true, el: 'fire', base: 10, sp: 1.0 } }, ic: ['flame', '#f40'], desc: '' });
  add('war_cry', { name: 'Боевой клич', kind: 'act', cost: 0, cd: 20, tgt: 'self', fx: { aoe: { r: 6, at: 'self', foes: true, mods: { atk: -10 }, dur: 12, res: 'ment' } }, ic: ['horn', '#c44'], desc: '' });
  add('bear_maul', { name: 'Медвежий удар', kind: 'act', cost: 0, cd: 10, tgt: 'enemy', range: 'melee', fx: { hit: { mult: 1.5, st: 'knock', dur: 2, res: 'phys' } }, ic: ['paw', '#963'], desc: '' });
  D.AB = ab;

  D.ELEMENTS = { phys: 'физический', fire: 'огонь', cold: 'холод', spirit: 'дух', nature: 'природа', elec: 'электричество' };

  const MATS = [
    { id: 'iron', name: 'железа', tier: 1, mult: 1.0, price: 1 },
    { id: 'grey', name: 'серого железа', tier: 2, mult: 1.18, price: 2.2 },
    { id: 'steel', name: 'стали', tier: 3, mult: 1.36, price: 4 },
    { id: 'veridium', name: 'веридия', tier: 4, mult: 1.55, price: 7 }
  ];
  const WEAPONS = {
    dagger: { name: 'Кинжал', slot: 'main', hands: 1, dmg: 5, spd: 1.25, attr: 'dex', crit: 6, pierce: 2, price: 120, look: 'dagger', ic: 'dagger' },
    longsword: { name: 'Длинный меч', slot: 'main', hands: 1, dmg: 7.5, spd: 1.7, attr: 'str', crit: 3, price: 200, look: 'sword', ic: 'sword' },
    waraxe: { name: 'Боевой топор', slot: 'main', hands: 1, dmg: 8.5, spd: 1.9, attr: 'str', crit: 3, price: 210, look: 'axe', ic: 'axe' },
    mace: { name: 'Булава', slot: 'main', hands: 1, dmg: 8, spd: 1.9, attr: 'str', crit: 2, pierce: 3, price: 210, look: 'mace', ic: 'mace' },
    greatsword: { name: 'Двуручный меч', slot: 'main', hands: 2, dmg: 14, spd: 2.5, attr: 'str', crit: 4, price: 380, look: 'greatsword', ic: 'greatsword' },
    greataxe: { name: 'Секира', slot: 'main', hands: 2, dmg: 15, spd: 2.7, attr: 'str', crit: 4, price: 390, look: 'greataxe', ic: 'greataxe' },
    maul: { name: 'Боевой молот', slot: 'main', hands: 2, dmg: 15, spd: 2.8, attr: 'str', crit: 2, pierce: 5, price: 390, look: 'maul', ic: 'maul' },
    shortbow: { name: 'Короткий лук', slot: 'main', hands: 2, dmg: 6.5, spd: 1.6, attr: 'dex', crit: 4, range: 14, bow: 1, price: 220, look: 'bow', ic: 'bow' },
    longbow: { name: 'Длинный лук', slot: 'main', hands: 2, dmg: 8.5, spd: 2.1, attr: 'dex', crit: 5, range: 18, bow: 1, price: 320, look: 'longbow', ic: 'bow' },
    staff: { name: 'Посох', slot: 'main', hands: 2, dmg: 6, spd: 2.0, attr: 'mag', crit: 2, range: 13, staff: 'spirit', price: 250, look: 'staff', ic: 'staff' }
  };
  const SHIELDS = {
    buckler: { name: 'Баклер', def: 5, mdef: 5, fat: 2, str: 0, price: 150, look: 'buckler' },
    kite: { name: 'Каплевидный щит', def: 8, mdef: 12, fat: 4, str: 14, price: 280, look: 'kite' },
    tower: { name: 'Башенный щит', def: 11, mdef: 20, fat: 7, str: 18, price: 420, look: 'tower' }
  };
  const ARMOR = {
    leather: { name: 'Кожаная', weight: 'light', arm: [2.5, 0.6, 0.5, 0.6], fat: [3, 1, 1, 1], str: 0, look: 'leather', price: 160 },
    studded: { name: 'Проклёпанная кожаная', weight: 'light', arm: [3.5, 0.8, 0.7, 0.8], fat: [5, 1, 1, 1], str: 12, look: 'studded', price: 260 },
    chain: { name: 'Кольчужная', weight: 'medium', arm: [5, 1.2, 1, 1.2], fat: [8, 2, 2, 2], str: 16, look: 'chain', price: 420 },
    splint: { name: 'Пластинчатая', weight: 'heavy', arm: [6.5, 1.5, 1.3, 1.5], fat: [11, 3, 2, 2], str: 20, look: 'splint', price: 620 },
    plate: { name: 'Латная', weight: 'massive', arm: [8.5, 2, 1.8, 2], fat: [15, 4, 3, 3], str: 24, look: 'plate', price: 900 }
  };
  const PIECES = [['chest', 'броня', 'кираса'], ['head', 'шлем', 'шлем'], ['gloves', 'перчатки', 'перчатки'], ['boots', 'сапоги', 'сапоги']];
  const PIECE_NAMES = {
    leather: ['Кожаная броня', 'Кожаный шлем', 'Кожаные перчатки', 'Кожаные сапоги'],
    studded: ['Проклёпанная броня', 'Проклёпанный шлем', 'Проклёпанные перчатки', 'Проклёпанные сапоги'],
    chain: ['Кольчуга', 'Кольчужный капюшон', 'Кольчужные перчатки', 'Кольчужные сапоги'],
    splint: ['Пластинчатый доспех', 'Шлем с забралом', 'Пластинчатые рукавицы', 'Пластинчатые поножи'],
    plate: ['Латы', 'Большой шлем', 'Латные рукавицы', 'Латные сапоги']
  };

  const items = {};
  const it = (id, o) => { o.id = id; items[id] = o; return o; };

  for (const [wid, w] of Object.entries(WEAPONS)) {
    for (const m of MATS) {
      const mat = w.staff ? null : m;
      if (w.staff && m.tier > 3) continue;
      const id = w.staff ? wid + m.tier : wid + '_' + m.id;
      const name = w.staff ? ['Посох ученика', 'Посох мага', 'Посох чародея'][m.tier - 1] : w.bow ? w.name + (m.tier === 1 ? ' из тиса' : m.tier === 2 ? ' из ясеня' : m.tier === 3 ? ' из железного дерева' : ' из драконьей кости') : w.name + ' из ' + mat.name;
      it(id, {
        name, type: 'weapon', cat: 'weapon', slot: 'main', wclass: wid, hands: w.hands, dmg: +(w.dmg * m.mult * 1.5).toFixed(1), spd: w.spd, attr: w.attr, crit: w.crit + m.tier - 1,
        pierce: (w.pierce || 0) + m.tier - 1, range: w.range || 0, bow: w.bow || 0, staff: w.staff || '', tier: m.tier, look: w.look, ic: w.ic,
        price: Math.round(w.price * m.price), req: w.attr === 'str' ? { str: 10 + (w.hands === 2 ? 6 : 2) + m.tier * 2 } : w.attr === 'dex' ? { dex: 10 + m.tier * 2 } : { mag: 10 + m.tier * 3 },
        mods: w.staff ? { sp: m.tier * 2 } : null
      });
    }
  }
  for (const [sid, s] of Object.entries(SHIELDS)) {
    for (const m of MATS.slice(0, 3)) {
      it(sid + '_' + m.id, { name: s.name + ' из ' + m.name, type: 'shield', cat: 'weapon', slot: 'off', def: Math.round(s.def * m.mult), mdef: Math.round(s.mdef * m.mult), fat: s.fat, req: { str: s.str ? s.str + m.tier - 1 : 0 }, tier: m.tier, look: s.look, ic: 'shield', price: Math.round(s.price * m.price) });
    }
  }
  const ARMOR_TIERS = [['', 1, 1.0], ['_q', 2, 1.2], ['_m', 3, 1.4]];
  const TIER_ADJ = ['', ' (добротн.)', ' (мастерск.)'];
  for (const [aid, a] of Object.entries(ARMOR)) {
    PIECES.forEach(([slot], pi) => {
      for (const [suf, tier, mult] of ARMOR_TIERS) {
        it(aid + '_' + slot + suf, {
          name: PIECE_NAMES[aid][pi] + TIER_ADJ[tier - 1], type: 'armor', cat: 'armor', slot, arm: +(a.arm[pi] * mult).toFixed(1), fat: a.fat[pi], weight: a.weight, look: a.look,
          req: { str: a.str ? a.str + (tier - 1) : 0 }, tier, ic: slot === 'chest' ? 'armor' : slot === 'head' ? 'helm' : slot, price: Math.round(a.price * [1, 0.35, 0.25, 0.3][pi] * mult * mult)
        });
      }
    });
  }
  const robe = (id, name, arm, mods, look, price, tint) => it(id, { name, type: 'armor', cat: 'armor', slot: 'chest', arm, fat: 0, weight: 'robe', look: 'robe', tint, mods, ic: 'robe', tier: 1, price, req: {} });
  robe('apprentice_robe', 'Мантия ученика', 0.5, { mag: 1 }, 'robe', 60, '#8a7a5a');
  robe('mage_robe', 'Мантия мага Круга', 1, { mag: 2, mpMax: 10 }, 'robe', 240, '#5a6a9a');
  robe('enchanter_robe', 'Мантия чародея', 1.5, { mag: 3, wil: 2, sp: 2 }, 'robe', 600, '#6a3a6a');
  robe('witch_robe', 'Одеяние дикой ведьмы', 1.5, { mag: 2, cun: 2, mpRegen: 0.5 }, 'robe', 500, '#4a4a2a');
  robe('chasind_robe', 'Одежда чазиндов', 1, { con: 1, mag: 1 }, 'robe', 180, '#6a5a3a');
  it('mage_hat', { name: 'Шляпа мага', type: 'armor', cat: 'armor', slot: 'head', arm: 0, fat: 0, look: 'hat', ic: 'helm', mods: { mpMax: 10 }, tier: 1, price: 120, req: {} });
  it('clothes', { name: 'Простая одежда', type: 'armor', cat: 'armor', slot: 'chest', arm: 0, fat: 0, look: 'cloth', ic: 'robe', tier: 1, price: 20, req: {} });
  it('noble_clothes', { name: 'Одежда аристократа', type: 'armor', cat: 'armor', slot: 'chest', arm: 0, fat: 0, look: 'noble', ic: 'robe', tier: 1, price: 150, req: {} });
  it('wedding_clothes', { name: 'Свадебный наряд', type: 'armor', cat: 'armor', slot: 'chest', arm: 0, fat: 0, look: 'wedding', ic: 'robe', tier: 1, price: 40, req: {} });
  it('dalish_armor', { name: 'Долийская броня', type: 'armor', cat: 'armor', slot: 'chest', arm: 3.2, fat: 2, weight: 'light', look: 'dalish', ic: 'armor', tier: 2, price: 380, mods: { dex: 1 }, req: {} });
  it('dalish_boots', { name: 'Долийские сапоги', type: 'armor', cat: 'armor', slot: 'boots', arm: 0.8, fat: 0, weight: 'light', look: 'dalish', ic: 'boots', tier: 2, price: 120, mods: { move: 0.05 }, req: {} });
  it('dalish_gloves', { name: 'Долийские перчатки', type: 'armor', cat: 'armor', slot: 'gloves', arm: 0.7, fat: 0, weight: 'light', look: 'dalish', ic: 'gloves', tier: 2, price: 110, mods: { atk: 2 }, req: {} });
  it('dwarf_heavy_chest', { name: 'Тяжёлая гномья броня', type: 'armor', cat: 'armor', slot: 'chest', arm: 7, fat: 11, weight: 'heavy', look: 'dwarfplate', ic: 'armor', tier: 3, price: 900, req: { str: 18 } });
  it('dwarf_helm', { name: 'Шлем гномьего стража', type: 'armor', cat: 'armor', slot: 'head', arm: 1.6, fat: 2, weight: 'heavy', look: 'dwarfplate', ic: 'helm', tier: 3, price: 260, req: { str: 14 } });
  it('aeducan_leather', { name: 'Кожаный доспех дома Эдукан', type: 'armor', cat: 'armor', slot: 'chest', arm: 4, fat: 4, weight: 'light', look: 'studded', tint: '#6a3a2a', ic: 'armor', tier: 3, price: 700, mods: { dex: 1 }, req: {} });
  it('warden_chest', { name: 'Кольчуга Серого Стража', type: 'armor', cat: 'armor', slot: 'chest', arm: 5.5, fat: 7, weight: 'medium', look: 'warden', ic: 'armor', tier: 3, price: 800, mods: { con: 1 }, req: { str: 14 } });
  it('templar_chest', { name: 'Латы храмовника', type: 'armor', cat: 'armor', slot: 'chest', arm: 8, fat: 14, weight: 'massive', look: 'templar', ic: 'armor', tier: 3, price: 1000, req: { str: 22 } });
  it('highever_chest', { name: 'Кольчуга стражи Хайевера', type: 'armor', cat: 'armor', slot: 'chest', arm: 5, fat: 7, weight: 'medium', look: 'highever', ic: 'armor', tier: 2, price: 450, req: { str: 14 } });
  it('highever_leather', { name: 'Кожаный доспех Хайевера', type: 'armor', cat: 'armor', slot: 'chest', arm: 3, fat: 3, weight: 'light', look: 'studded', tint: '#3a4a6a', ic: 'armor', tier: 2, price: 320, req: {} });
  it('carta_leather', { name: 'Кожанка Хартии', type: 'armor', cat: 'armor', slot: 'chest', arm: 3, fat: 3, weight: 'light', look: 'studded', tint: '#4a3a2a', ic: 'armor', tier: 2, price: 280, req: {} });

  it('cousland_sword', { name: 'Меч Кусландов', type: 'weapon', cat: 'weapon', slot: 'main', wclass: 'longsword', hands: 1, dmg: 15.5, spd: 1.7, attr: 'str', crit: 6, pierce: 3, tier: 3, look: 'sword', ic: 'sword', price: 1400, req: { str: 14 }, mods: { atk: 3 }, unique: 1, desc: 'Родовой клинок Кусландов. Отец держал его в сокровищнице и доставал только по праздникам.' });
  it('cousland_shield', { name: 'Щит Кусландов', type: 'shield', cat: 'weapon', slot: 'off', def: 10, mdef: 16, fat: 4, tier: 3, look: 'kite', tint: '#3a5a9a', ic: 'shield', price: 1200, req: { str: 14 }, mods: { res: 5 }, unique: 1, desc: 'На щите лавровый венок и гербовые кусландовские ястребы.' });
  it('dalish_longbow', { name: 'Долийский длинный лук', type: 'weapon', cat: 'weapon', slot: 'main', wclass: 'longbow', hands: 2, dmg: 15.5, spd: 1.95, attr: 'dex', crit: 7, pierce: 2, range: 19, bow: 1, tier: 3, look: 'longbow', ic: 'bow', price: 1100, req: { dex: 14 }, unique: 1, desc: 'Работа мастера Илена из клана Маретари.' });
  it('aeducan_blade', { name: 'Клинок дома Эдукан', type: 'weapon', cat: 'weapon', slot: 'main', wclass: 'longsword', hands: 1, dmg: 15, spd: 1.7, attr: 'str', crit: 5, pierce: 3, tier: 3, look: 'sword', ic: 'sword', price: 1300, req: { str: 14 }, mods: { atk: 2 }, unique: 1 });
  it('aeducan_dagger', { name: 'Кинжал дома Эдукан', type: 'weapon', cat: 'weapon', slot: 'main', wclass: 'dagger', hands: 1, dmg: 10.5, spd: 1.25, attr: 'dex', crit: 9, pierce: 4, tier: 3, look: 'dagger', ic: 'dagger', price: 1100, req: { dex: 13 }, unique: 1 });
  it('valor_staff', { name: 'Посох Доблести', type: 'weapon', cat: 'weapon', slot: 'main', wclass: 'staff', hands: 2, dmg: 13, spd: 2.0, attr: 'mag', crit: 3, range: 14, staff: 'spirit', tier: 3, look: 'staff', ic: 'staff', price: 0, req: {}, mods: { sp: 6 }, fade: 1, unique: 1, desc: 'Дух Доблести отдал его вам в Тени. Здесь он существует, пока вы в него верите.' });
  it('beraht_blade', { name: 'Нож Беракта', type: 'weapon', cat: 'weapon', slot: 'main', wclass: 'dagger', hands: 1, dmg: 11, spd: 1.2, attr: 'dex', crit: 8, pierce: 4, tier: 3, look: 'dagger', ic: 'dagger', price: 900, req: { dex: 13 }, unique: 1 });
  it('vaughan_sword', { name: 'Меч Вона Кенделлса', type: 'weapon', cat: 'weapon', slot: 'main', wclass: 'longsword', hands: 1, dmg: 13.5, spd: 1.65, attr: 'str', crit: 5, pierce: 2, tier: 3, look: 'sword', ic: 'sword', price: 900, req: { str: 13 }, unique: 1 });
  it('ogre_maul', { name: 'Молот из кости огра', type: 'weapon', cat: 'weapon', slot: 'main', wclass: 'maul', hands: 2, dmg: 27, spd: 2.9, attr: 'str', crit: 3, pierce: 6, tier: 4, look: 'maul', ic: 'maul', price: 1600, req: { str: 22 }, unique: 1 });
  it('ishal_bow', { name: 'Лук стража Ишала', type: 'weapon', cat: 'weapon', slot: 'main', wclass: 'longbow', hands: 2, dmg: 15, spd: 2.0, attr: 'dex', crit: 6, range: 19, bow: 1, tier: 3, look: 'longbow', ic: 'bow', price: 1000, req: { dex: 15 }, unique: 1 });

  const acc = (id, name, slot, mods, price, desc) => it(id, { name, type: 'accessory', cat: 'acc', slot, mods, price, ic: slot === 'ring' ? 'ring' : slot, tier: 1, desc, req: {} });
  acc('ring_iron', 'Железное кольцо', 'ring', { con: 1 }, 150);
  acc('ring_silver', 'Серебряное кольцо', 'ring', { cun: 1, dex: 1 }, 380);
  acc('ring_lyrium', 'Лириумное кольцо', 'ring', { mag: 2 }, 600);
  acc('ring_duster', 'Кольцо из Пыльного города', 'ring', { dex: 1 }, 90, 'Мамино. Она ещё помнит, что оно у неё было.');
  acc('ring_harrowing', 'Кольцо Истязания', 'ring', { wil: 1, mag: 1, mpMax: 5 }, 400, 'Каждый маг Круга, прошедший Истязание, получает такое кольцо.');
  acc('ring_highever', 'Кольцо Хайевера', 'ring', { str: 1, con: 1 }, 700, 'Мать носила его много лет и отдала вам перед бегством.');
  acc('amulet_andraste', 'Амулет Андрасте', 'amulet', { res: 5, wil: 1 }, 300, 'Серебряный знак священного пламени на кожаном шнурке.');
  acc('amulet_warden', 'Амулет Серого Стража', 'amulet', { res: 5, con: 1 }, 0, 'На нём несколько капель крови порождений тьмы. Такие дают тем, кто пережил Посвящение.');
  acc('amulet_dalish', 'Амулет из рога галлы', 'amulet', { nature: 10, dex: 1 }, 250);
  acc('amulet_dwarf', 'Медальон Памяти', 'amulet', { res: 10 }, 450);
  acc('belt_leather', 'Кожаный пояс', 'belt', { hpMax: 10 }, 100);
  acc('belt_warrior', 'Пояс воина', 'belt', { str: 1, hpMax: 10 }, 300);
  acc('belt_mage', 'Пояс заклинателя', 'belt', { mpMax: 15 }, 320);

  const use = (id, o) => it(id, Object.assign({ type: 'use', cat: 'use', stack: 1, tier: 1 }, o));
  use('poultice_lesser', { name: 'Слабая припарка здоровья', use: { heal: 45 }, price: 45, ic: 'potion', col: '#c33', desc: 'Восстанавливает 45 здоровья.' });
  use('poultice', { name: 'Припарка здоровья', use: { heal: 90 }, price: 110, ic: 'potion', col: '#e22', desc: 'Восстанавливает 90 здоровья.' });
  use('poultice_greater', { name: 'Большая припарка здоровья', use: { heal: 160 }, price: 260, ic: 'potion', col: '#f44', desc: 'Восстанавливает 160 здоровья.' });
  use('lyrium_lesser', { name: 'Слабое лириумное зелье', use: { mana: 40 }, price: 60, ic: 'potion', col: '#48f', desc: 'Восстанавливает 40 маны.', mageOnly: 1 });
  use('lyrium', { name: 'Лириумное зелье', use: { mana: 80 }, price: 150, ic: 'potion', col: '#26f', desc: 'Восстанавливает 80 маны.', mageOnly: 1 });
  use('stamina_draught', { name: 'Настой бодрости', use: { stamina: 45 }, price: 60, ic: 'potion', col: '#4c4', desc: 'Восстанавливает 45 выносливости.' });
  use('injury_kit', { name: 'Набор от травм', use: { cure: 1, heal: 20 }, price: 80, ic: 'kit', col: '#c96', desc: 'Лечит все травмы персонажа.' });
  use('mabari_crunch', { name: 'Мабари-хрустяшка', use: { heal: 50, dogOnly: 1, buff: { atk: 5 } }, price: 30, ic: 'bone', col: '#eee', desc: 'Печенье для боевого пса. Лечит и подбадривает.' });
  use('acid_flask', { name: 'Флакон с кислотой', use: { bomb: { el: 'nature', base: 22, r: 2.5, mods: { arm: -4 }, dur: 10 } }, price: 90, ic: 'flask', col: '#9c3', desc: 'Кислота разъедает плоть и броню.' });
  use('fire_bomb', { name: 'Зажигательная бомба', use: { bomb: { el: 'fire', base: 26, r: 3, dot: { dps: 4, dur: 5 } } }, price: 120, ic: 'flask', col: '#f84', desc: 'Взрыв огня с долгим горением.' });
  use('freeze_bomb', { name: 'Ледяная бомба', use: { bomb: { el: 'cold', base: 14, r: 3, st: 'freeze', dur: 4 } }, price: 120, ic: 'flask', col: '#8cf', desc: 'Замораживает всех в области.' });
  use('venom', { name: 'Яд смертокорня', use: { coat: { el: 'nature', add: 5, dur: 90 } }, price: 70, ic: 'vial', col: '#6a3', desc: 'Смазать оружие: +5 урона природой на 90 секунд.' });
  use('trap_spike', { name: 'Шипастый капкан', use: { trap: { base: 25, st: 'pin', dur: 6 } }, price: 80, ic: 'trap', col: '#aaa', desc: 'Ставится на землю. Ранит и удерживает первого врага.' });
  const mat = (id, name, price, col, desc, ic) => it(id, { name, type: 'mat', cat: 'craft', stack: 1, price, ic: ic || 'herb', col, desc, tier: 1 });
  mat('elfroot', 'Эльфийский корень', 12, '#7c4', 'Широкие листья с горьким запахом. Основа любой припарки.');
  mat('flask', 'Склянка', 6, '#cde', 'Пустая стеклянная склянка с пробкой.', 'vial');
  mat('deathroot', 'Смертокорень', 18, '#654', 'Ядовитый корень. Растёт у болот.');
  mat('deep_mushroom', 'Глубинный гриб', 20, '#a8c', 'Гриб с Глубинных троп. Бодрит.', 'orb');
  mat('lyrium_dust', 'Лириумная пыль', 40, '#6af', 'Серебристо-голубая пыль. Поёт, если поднести к уху.', 'shard');
  mat('distillation', 'Дистиллирующий реагент', 15, '#dd8', 'Концентрирует действие отваров.', 'drop');
  mat('trap_trigger', 'Спусковой механизм', 20, '#bbb', 'Пружина и рычаг для капканов.', 'gear');
  mat('metal_shards', 'Металлические обломки', 10, '#999', 'Годятся для шипов и ловушек.', 'rock');

  const gift = (id, name, likes, price, desc) => it(id, { name, type: 'gift', cat: 'gift', likes, price, ic: 'gift', desc, tier: 1 });
  gift('gift_statuette', 'Резная фигурка воина', { alistair: 10 }, 150, 'Маленький деревянный храмовник с отбитым мечом.');
  gift('gift_black_mirror', 'Чёрное зеркальце', { morrigan: 10 }, 200, 'Старинное зеркальце в оправе из тёмного металла.');
  gift('gift_chantry_amulet', 'Святой символ Церкви', { leliana: 10, alistair: 4 }, 180, 'Солнечный круг Церкви на серебряной цепочке.');
  gift('gift_bone', 'Кость с мясом', { dog: 10 }, 20, 'Хорошая кость. Пёс будет доволен.');
  gift('gift_qunari_blade', 'Сломанный клинок с Сегерона', { sten: 10 }, 250, 'Обломок клинка чужой работы. Кто-то принёс его с севера.');
  gift('gift_flowers', 'Букет полевых цветов', { leliana: 6, alistair: 3 }, 30, 'Лотерингские цветы. Пахнут пылью и летом.');
  gift('gift_ring', 'Серебряное кольцо с камнем', { morrigan: 6, leliana: 4 }, 350, 'Изящная работа.');

  const quest = (id, name, ic, desc) => it(id, { name, type: 'quest', cat: 'quest', price: 0, ic: ic || 'scroll', desc, tier: 1, quest: 1 });
  quest('treaties', 'Договоры Серых Стражей', 'scroll', 'Древние договоры, по которым гномы, эльфы и маги обязаны прийти на помощь Серым Стражам во время Мора.');
  quest('darkspawn_blood', 'Склянка с кровью порождений тьмы', 'vial', 'Густая чёрная кровь. Для Посвящения нужно три склянки.');
  quest('mabari_flower', 'Цветок из дебрей Коркари', 'herb', 'Псарь говорит, что этот цветок может вылечить мабари от скверны.');
  quest('aeducan_shield', 'Щит Эдукана', 'shield', 'Щит Совершенного Эдукана, основателя вашего дома. Пролежал в тейге столетия.');
  quest('mirror_shard', 'Осколок зеркала', 'shard', 'Осколок из руин. Смотреть в него неприятно.');
  quest('rod_of_fire', 'Огненный жезл', 'staff', 'Жезл для того, чтобы открывать запечатанные двери хранилища.');
  quest('phylactery', 'Филактерия Йована', 'vial', 'Стеклянный флакон с кровью. По ней храмовники найдут беглого мага где угодно.');
  quest('beraht_key', 'Ключ от сундука Беракта', 'key', 'Тяжёлый ключ. Беракт носил его на шее.');
  quest('vaughan_key', 'Ключ от покоев Вона', 'key', 'Ключ висел на поясе у стражника.');
  quest('larder_key', 'Ключ от кладовой', 'key', 'Ключ кухарки Нэн.');
  quest('vault_key', 'Ключ от сокровищницы', 'key', 'Отец отдал его матери много лет назад.');
  quest('cell_key', 'Ключ от клетки кунари', 'key', 'Ключ от клетки на площади Лотеринга.');
  quest('joining_chalice', 'Кубок Посвящения', 'cup', 'Серебряный кубок. Из него пили все Серые Стражи.');
  quest('ishal_key', 'Ключ от башни Ишала', 'key', 'Ключ от двери на верхние этажи.');
  quest('mouse_form', 'Облик мыши', 'mouse', 'Мышь научила вас становиться мышью. Это не предмет, но тут ему самое место.');
  quest('dog_whistle', 'Свисток псаря', 'horn', 'Свисток для мабари.');
  D.ITEMS = items;

  D.CATS = [
    ['all', 'Все'], ['use', 'Расходуемое'], ['weapon', 'Оружие'], ['armor', 'Доспехи'], ['acc', 'Украшения'], ['craft', 'Ремесло'], ['gift', 'Подарки'], ['quest', 'Задания']
  ];
  D.SLOTS = [
    ['main', 'Правая рука'], ['off', 'Левая рука'], ['head', 'Голова'], ['chest', 'Тело'], ['gloves', 'Руки'], ['boots', 'Ноги'],
    ['amulet', 'Шея'], ['belt', 'Пояс'], ['ring1', 'Кольцо'], ['ring2', 'Кольцо']
  ];

  D.RECIPES = [
    { id: 'r_poultice_lesser', out: 'poultice_lesser', n: 1, skill: 'herbalism', rank: 1, need: [['elfroot', 1], ['flask', 1]] },
    { id: 'r_poultice', out: 'poultice', n: 1, skill: 'herbalism', rank: 2, need: [['elfroot', 2], ['flask', 1]] },
    { id: 'r_poultice_greater', out: 'poultice_greater', n: 1, skill: 'herbalism', rank: 3, need: [['elfroot', 2], ['distillation', 1], ['flask', 1]] },
    { id: 'r_lyrium_lesser', out: 'lyrium_lesser', n: 1, skill: 'herbalism', rank: 1, need: [['lyrium_dust', 1], ['flask', 1]] },
    { id: 'r_lyrium', out: 'lyrium', n: 1, skill: 'herbalism', rank: 2, need: [['lyrium_dust', 2], ['distillation', 1], ['flask', 1]] },
    { id: 'r_stamina', out: 'stamina_draught', n: 1, skill: 'herbalism', rank: 1, need: [['deep_mushroom', 1], ['flask', 1]] },
    { id: 'r_injury', out: 'injury_kit', n: 1, skill: 'herbalism', rank: 2, need: [['elfroot', 1], ['distillation', 1]] },
    { id: 'r_venom', out: 'venom', n: 1, skill: 'poison', rank: 1, need: [['deathroot', 1], ['flask', 1]] },
    { id: 'r_acid', out: 'acid_flask', n: 1, skill: 'poison', rank: 1, need: [['deathroot', 1], ['distillation', 1], ['flask', 1]] },
    { id: 'r_firebomb', out: 'fire_bomb', n: 1, skill: 'poison', rank: 2, need: [['distillation', 2], ['flask', 1]] },
    { id: 'r_freezebomb', out: 'freeze_bomb', n: 1, skill: 'poison', rank: 3, need: [['deep_mushroom', 1], ['distillation', 1], ['flask', 1]] },
    { id: 'r_spike', out: 'trap_spike', n: 1, skill: 'traps', rank: 1, need: [['trap_trigger', 1], ['metal_shards', 1]] }
  ];

  D.INJURIES = [
    { id: 'bleeding', name: 'Кровотечение', mods: { hpRegen: -0.6 }, desc: 'Здоровье не восстанавливается.' },
    { id: 'broken_ribs', name: 'Сломанные рёбра', mods: { def: -10 }, desc: 'Защита −10.' },
    { id: 'crushed_hand', name: 'Раздробленная кисть', mods: { atk: -10 }, desc: 'Точность −10.' },
    { id: 'concussion', name: 'Сотрясение', mods: { mpMax: -15 }, desc: 'Мана и выносливость −15.' },
    { id: 'lacerated_leg', name: 'Рана ноги', mods: { move: -0.2 }, desc: 'Скорость −20%.' },
    { id: 'torn_muscle', name: 'Порванная мышца', mods: { dmg: -3 }, desc: 'Урон −3.' }
  ];

  D.RANKS = { critter: ['Существо', 0.4], normal: ['Обычный', 1], lt: ['Лейтенант', 1.8], elite: ['Элита', 3], boss: ['Босс', 5] };

  const T = {};
  const tpl = (id, o) => { o.id = id; T[id] = o; };
  tpl('genlock', { name: 'Генлок', race: 'darkspawn', model: { kind: 'genlock' }, cls: 'warrior', lvl: 1, attr: { str: 14, dex: 12, con: 12 }, equip: { main: 'waraxe_iron', chest: 'leather_chest' }, ab: ['dirty_fighting'], xp: 40, loot: 'darkspawn', rank: 'normal' });
  tpl('genlock_archer', { name: 'Генлок-лучник', race: 'darkspawn', model: { kind: 'genlock' }, cls: 'rogue', lvl: 1, attr: { dex: 15, con: 11 }, equip: { main: 'shortbow_iron', chest: 'leather_chest' }, ab: ['pinning_shot'], xp: 45, loot: 'darkspawn', rank: 'normal' });
  tpl('genlock_rogue', { name: 'Генлок-разбойник', race: 'darkspawn', model: { kind: 'genlock' }, cls: 'rogue', lvl: 2, attr: { dex: 15, cun: 13 }, equip: { main: 'dagger_grey', off: 'dagger_iron', chest: 'leather_chest' }, ab: ['dirty_fighting', 'below_belt'], xp: 55, loot: 'darkspawn', rank: 'normal' });
  tpl('genlock_emissary', { name: 'Генлок-эмиссар', race: 'darkspawn', model: { kind: 'genlock', robe: '#3a2a2a' }, cls: 'mage', lvl: 3, attr: { mag: 17, wil: 14 }, equip: { main: 'staff1' }, ab: ['winters_grasp', 'drain_life', 'mind_blast'], xp: 140, loot: 'darkspawn_rich', rank: 'lt' });
  tpl('hurlock', { name: 'Гарлок', race: 'darkspawn', model: { kind: 'hurlock' }, cls: 'warrior', lvl: 2, attr: { str: 16, dex: 12, con: 14 }, equip: { main: 'longsword_iron', off: 'buckler_iron', chest: 'chain_chest' }, ab: ['shield_bash'], xp: 60, loot: 'darkspawn', rank: 'normal' });
  tpl('hurlock_2h', { name: 'Гарлок-громила', race: 'darkspawn', model: { kind: 'hurlock' }, cls: 'warrior', lvl: 3, attr: { str: 18, dex: 11, con: 14 }, equip: { main: 'greataxe_iron', chest: 'chain_chest' }, ab: ['pommel_strike'], xp: 75, loot: 'darkspawn', rank: 'normal' });
  tpl('hurlock_alpha', { name: 'Гарлок-вожак', race: 'darkspawn', model: { kind: 'hurlock', big: 1.1 }, cls: 'warrior', lvl: 4, attr: { str: 20, dex: 13, con: 18 }, equip: { main: 'greatsword_grey', chest: 'splint_chest', head: 'splint_head' }, ab: ['war_cry', 'pommel_strike'], xp: 220, loot: 'darkspawn_rich', rank: 'lt' });
  tpl('hurlock_emissary', { name: 'Гарлок-эмиссар', race: 'darkspawn', model: { kind: 'hurlock', robe: '#2a2a3a' }, cls: 'mage', lvl: 4, attr: { mag: 19, wil: 15 }, equip: { main: 'staff2' }, ab: ['winters_grasp', 'drain_life', 'mind_blast', 'weakness'], xp: 200, loot: 'darkspawn_rich', rank: 'lt' });
  tpl('ogre', { name: 'Огр', race: 'darkspawn', model: { kind: 'ogre' }, cls: 'warrior', lvl: 6, attr: { str: 28, dex: 10, con: 26 }, hp: 640, arm: 7, dmgBase: 22, spd: 2.7, reach: 2.4, ab: ['grab', 'ogre_slam'], xp: 900, loot: 'ogre', rank: 'boss', radius: 1.0, immune: 1 });
  tpl('wolf', { name: 'Волк', race: 'beast', model: { kind: 'wolf', col: '#6a6258' }, cls: 'warrior', lvl: 1, attr: { str: 12, dex: 15, con: 11 }, dmgBase: 9, spd: 1.5, arm: 1, ab: ['overwhelm'], xp: 30, loot: 'beast', rank: 'normal', move: 1.25 });
  tpl('blight_wolf', { name: 'Порченый волк', race: 'beast', model: { kind: 'wolf', col: '#4a3a3a', blight: 1 }, cls: 'warrior', lvl: 3, attr: { str: 14, dex: 16, con: 13 }, dmgBase: 12, spd: 1.5, arm: 2, ab: ['overwhelm'], xp: 55, loot: 'beast', rank: 'normal', move: 1.25 });
  tpl('bear', { name: 'Чёрный медведь', race: 'beast', model: { kind: 'bear', col: '#2a2420' }, cls: 'warrior', lvl: 3, attr: { str: 20, dex: 10, con: 20 }, hp: 240, dmgBase: 18, spd: 2.2, arm: 3, ab: ['bear_maul'], xp: 160, loot: 'beast', rank: 'lt', radius: 0.8 });
  tpl('giant_spider', { name: 'Гигантский паук', race: 'beast', model: { kind: 'spider', col: '#3a3028' }, cls: 'warrior', lvl: 2, attr: { str: 13, dex: 15, con: 12 }, dmgBase: 10.5, spd: 1.6, arm: 2, ab: ['web'], xp: 50, loot: 'spider', rank: 'normal', radius: 0.7 });
  tpl('poison_spider', { name: 'Ядовитый паук', race: 'beast', model: { kind: 'spider', col: '#2a3a20', big: 0.8 }, cls: 'warrior', lvl: 3, attr: { str: 12, dex: 16, con: 12 }, dmgBase: 9, spd: 1.4, arm: 1, ab: ['web'], poison: 3, xp: 60, loot: 'spider', rank: 'normal', radius: 0.6 });
  tpl('deepstalker', { name: 'Глубинный охотник', race: 'beast', model: { kind: 'deepstalker', col: '#7a6a50' }, cls: 'warrior', lvl: 2, attr: { str: 12, dex: 16, con: 11 }, dmgBase: 9, spd: 1.3, arm: 1, ab: ['overwhelm'], xp: 40, loot: 'beast', rank: 'normal', move: 1.2 });
  tpl('deepstalker_leader', { name: 'Вожак глубинных охотников', race: 'beast', model: { kind: 'deepstalker', col: '#8a5a40', big: 1.25 }, cls: 'warrior', lvl: 4, attr: { str: 15, dex: 17, con: 14 }, hp: 160, dmgBase: 13.5, spd: 1.3, arm: 2, ab: ['overwhelm'], xp: 150, loot: 'beast', rank: 'lt', move: 1.2 });
  tpl('giant_rat', { name: 'Гигантская крыса', race: 'beast', model: { kind: 'rat', col: '#5a4a40' }, cls: 'warrior', lvl: 1, attr: { str: 8, dex: 14, con: 8 }, hp: 22, dmgBase: 4.5, spd: 1.3, arm: 0, ab: [], xp: 12, loot: 'none', rank: 'critter', radius: 0.4 });
  tpl('skeleton', { name: 'Скелет', race: 'undead', model: { kind: 'skeleton' }, cls: 'warrior', lvl: 2, attr: { str: 14, dex: 12, con: 12 }, equip: { main: 'longsword_iron', off: 'buckler_iron' }, ab: ['shield_bash'], xp: 50, loot: 'ruin', rank: 'normal', coldRes: 50 });
  tpl('skeleton_archer', { name: 'Скелет-лучник', race: 'undead', model: { kind: 'skeleton' }, cls: 'rogue', lvl: 2, attr: { dex: 15, con: 11 }, equip: { main: 'shortbow_iron' }, ab: [], xp: 50, loot: 'ruin', rank: 'normal' });
  tpl('wisp', { name: 'Огонёк', race: 'spirit', model: { kind: 'wisp', col: '#8cf' }, cls: 'mage', lvl: 1, attr: { mag: 13, wil: 10, con: 8 }, hp: 30, dmgBase: 6, spd: 1.8, range: 10, bolt: 'spirit', ab: [], xp: 25, loot: 'none', rank: 'critter', radius: 0.4, fly: 1 });
  tpl('fade_wolf', { name: 'Волк из Тени', race: 'spirit', model: { kind: 'wolf', col: '#6a7a9a', ghost: 1 }, cls: 'warrior', lvl: 2, attr: { str: 13, dex: 15, con: 11 }, dmgBase: 9, spd: 1.5, arm: 1, ab: ['overwhelm'], xp: 40, loot: 'none', rank: 'normal', move: 1.2 });
  tpl('lesser_rage', { name: 'Малый демон гнева', race: 'demon', model: { kind: 'rage', big: 0.75 }, cls: 'mage', lvl: 2, attr: { mag: 14, con: 12 }, hp: 70, dmgBase: 10.5, spd: 1.8, arm: 2, ab: ['fire_bolt'], fireRes: 90, coldRes: -50, xp: 60, loot: 'none', rank: 'normal' });
  tpl('rage_demon', { name: 'Демон гнева', race: 'demon', model: { kind: 'rage', big: 1.3 }, cls: 'mage', lvl: 3, attr: { mag: 16, con: 16 }, hp: 190, dmgBase: 10, spd: 2.3, arm: 3, ab: ['fire_bolt', 'fire_aura'], fireRes: 100, coldRes: -50, xp: 300, loot: 'none', rank: 'boss', radius: 0.8 });
  tpl('valor', { name: 'Дух Доблести', race: 'spirit', model: { kind: 'humanoid', race: 'human', sex: 'm', skin: '#b8c8e8', ghost: 1, armor: 'plate', tint: '#9ab' }, cls: 'warrior', lvl: 3, attr: { str: 16, dex: 13, con: 14 }, hp: 160, equip: { main: 'longsword_steel', off: 'kite_steel' }, ab: ['shield_bash'], xp: 150, loot: 'none', rank: 'lt' });
  tpl('bandit', { name: 'Бандит', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'leather', tint: '#5a4a3a' }, cls: 'rogue', lvl: 2, attr: { dex: 14, cun: 12, str: 12 }, equip: { main: 'dagger_iron', off: 'dagger_iron', chest: 'leather_chest' }, ab: ['dirty_fighting'], xp: 45, loot: 'bandit', rank: 'normal' });
  tpl('bandit_archer', { name: 'Бандит-лучник', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'leather', tint: '#4a5a3a' }, cls: 'rogue', lvl: 2, attr: { dex: 15 }, equip: { main: 'shortbow_iron', chest: 'leather_chest' }, ab: [], xp: 45, loot: 'bandit', rank: 'normal' });
  tpl('bandit_thug', { name: 'Бандит-громила', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'studded', tint: '#5a3a2a' }, cls: 'warrior', lvl: 3, attr: { str: 16, con: 14 }, equip: { main: 'maul_iron', chest: 'studded_chest' }, ab: ['pommel_strike'], xp: 55, loot: 'bandit', rank: 'normal' });
  tpl('bandit_leader', { name: 'Главарь бандитов', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'chain', tint: '#6a4a2a', beard: 1 }, cls: 'warrior', lvl: 4, attr: { str: 17, dex: 13, con: 15 }, hp: 190, equip: { main: 'longsword_grey', off: 'kite_iron', chest: 'chain_chest' }, ab: ['shield_bash', 'war_cry'], xp: 220, loot: 'bandit_rich', rank: 'lt' });
  tpl('howe_soldier', { name: 'Солдат Хоу', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'chain', tint: '#7a2a2a' }, cls: 'warrior', lvl: 1, attr: { str: 14, dex: 12, con: 12 }, equip: { main: 'longsword_iron', off: 'buckler_iron', chest: 'chain_chest' }, ab: [], xp: 40, loot: 'soldier', rank: 'normal' });
  tpl('howe_archer', { name: 'Лучник Хоу', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'leather', tint: '#7a2a2a' }, cls: 'rogue', lvl: 1, attr: { dex: 14 }, equip: { main: 'shortbow_iron', chest: 'leather_chest' }, ab: [], xp: 40, loot: 'soldier', rank: 'normal' });
  tpl('howe_knight', { name: 'Рыцарь Хоу', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'plate', tint: '#7a2a2a' }, cls: 'warrior', lvl: 3, attr: { str: 17, dex: 12, con: 15 }, hp: 170, equip: { main: 'longsword_grey', off: 'kite_iron', chest: 'splint_chest', head: 'splint_head' }, ab: ['shield_bash'], xp: 160, loot: 'soldier_rich', rank: 'lt' });
  tpl('guard_denerim', { name: 'Стражник эрла', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'chain', tint: '#6a5a2a' }, cls: 'warrior', lvl: 2, attr: { str: 14, dex: 12, con: 13 }, equip: { main: 'longsword_iron', off: 'buckler_iron', chest: 'chain_chest', head: 'chain_head' }, ab: ['shield_bash'], xp: 45, loot: 'soldier', rank: 'normal' });
  tpl('guard_captain', { name: 'Капитан стражи эрла', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'splint', tint: '#6a5a2a', beard: 1 }, cls: 'warrior', lvl: 3, attr: { str: 16, dex: 12, con: 15 }, hp: 170, equip: { main: 'longsword_grey', off: 'kite_iron', chest: 'splint_chest', head: 'splint_head' }, ab: ['shield_bash', 'war_cry'], xp: 180, loot: 'soldier_rich', rank: 'lt' });
  tpl('noble_thug', { name: 'Приятель Вона', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'noble', tint: '#5a2a4a' }, cls: 'warrior', lvl: 2, attr: { str: 13, dex: 13, con: 12 }, equip: { main: 'longsword_iron', chest: 'noble_clothes' }, ab: [], xp: 45, loot: 'noble', rank: 'normal' });
  tpl('carta_thug', { name: 'Громила Хартии', race: 'dwarf', model: { kind: 'humanoid', race: 'dwarf', armor: 'studded', tint: '#4a3a2a', beard: 1 }, cls: 'warrior', lvl: 1, attr: { str: 14, con: 13 }, equip: { main: 'mace_iron', chest: 'carta_leather' }, ab: [], xp: 40, loot: 'carta', rank: 'normal' });
  tpl('carta_cutter', { name: 'Головорез Хартии', race: 'dwarf', model: { kind: 'humanoid', race: 'dwarf', armor: 'leather', tint: '#3a3a2a', beard: 1 }, cls: 'rogue', lvl: 2, attr: { dex: 15, cun: 12 }, equip: { main: 'dagger_iron', off: 'dagger_iron', chest: 'carta_leather' }, ab: ['dirty_fighting'], xp: 45, loot: 'carta', rank: 'normal' });
  tpl('beraht', { name: 'Беракт', race: 'dwarf', model: { kind: 'humanoid', race: 'dwarf', armor: 'noble', tint: '#5a4a1a', beard: 1, hair: '#2a1a10' }, cls: 'rogue', lvl: 3, attr: { dex: 16, cun: 14, con: 13 }, hp: 200, equip: { main: 'beraht_blade', off: 'dagger_grey', chest: 'carta_leather' }, ab: ['dirty_fighting', 'deadly_strike'], xp: 300, loot: 'carta_rich', rank: 'boss' });
  tpl('proving_fighter', { name: 'Боец Испытания', race: 'dwarf', model: { kind: 'humanoid', race: 'dwarf', armor: 'chain', tint: '#6a4a2a', beard: 1 }, cls: 'warrior', lvl: 2, attr: { str: 15, dex: 12, con: 13 }, equip: { main: 'longsword_iron', off: 'buckler_iron', chest: 'chain_chest' }, ab: ['shield_bash'], xp: 60, loot: 'none', rank: 'normal', nonlethal: 1 });
  tpl('darkspawn_deep', { name: 'Генлок Глубинных троп', race: 'darkspawn', model: { kind: 'genlock' }, cls: 'warrior', lvl: 2, attr: { str: 14, dex: 12, con: 13 }, equip: { main: 'mace_iron', chest: 'leather_chest' }, ab: ['dirty_fighting'], xp: 45, loot: 'darkspawn', rank: 'normal' });
  tpl('loghain_soldier', { name: 'Солдат Логейна', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'chain', tint: '#3a4a5a' }, cls: 'warrior', lvl: 4, attr: { str: 15, dex: 13, con: 14 }, equip: { main: 'longsword_grey', off: 'kite_iron', chest: 'chain_chest', head: 'chain_head' }, ab: ['shield_bash'], xp: 70, loot: 'soldier', rank: 'normal' });
  tpl('loghain_archer', { name: 'Лучник Логейна', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'leather', tint: '#3a4a5a' }, cls: 'rogue', lvl: 4, attr: { dex: 16 }, equip: { main: 'longbow_iron', chest: 'studded_chest' }, ab: ['pinning_shot'], xp: 70, loot: 'soldier', rank: 'normal' });
  tpl('loghain_sergeant', { name: 'Сержант Логейна', race: 'human', model: { kind: 'humanoid', race: 'human', armor: 'splint', tint: '#3a4a5a', beard: 1 }, cls: 'warrior', lvl: 5, attr: { str: 18, dex: 13, con: 16 }, hp: 230, equip: { main: 'greatsword_grey', chest: 'splint_chest', head: 'splint_head' }, ab: ['pommel_strike', 'war_cry'], xp: 260, loot: 'soldier_rich', rank: 'lt' });
  tpl('mabari_hostile', { name: 'Мабари', race: 'beast', model: { kind: 'dog', col: '#8a6a40' }, cls: 'warrior', lvl: 2, attr: { str: 14, dex: 14, con: 13 }, dmgBase: 10.5, spd: 1.5, arm: 2, ab: ['overwhelm'], xp: 40, loot: 'none', rank: 'normal' });
  D.TEMPLATES = T;

  D.LOOT = {
    none: [],
    darkspawn: [[0.55, 'money', 30, 140], [0.18, 'poultice_lesser'], [0.12, 'darkspawn_gear'], [0.1, 'deathroot'], [0.06, 'lyrium_dust']],
    darkspawn_rich: [[1, 'money', 150, 600], [0.5, 'poultice'], [0.4, 'darkspawn_gear'], [0.3, 'lyrium_lesser'], [0.2, 'accessory']],
    ogre: [[1, 'money', 2000, 4000], [1, 'poultice_greater'], [1, 'ogre_maul'], [0.6, 'accessory']],
    beast: [[0.25, 'elfroot'], [0.1, 'deathroot']],
    spider: [[0.25, 'deathroot'], [0.15, 'distillation']],
    ruin: [[0.6, 'money', 60, 240], [0.2, 'gear1'], [0.15, 'accessory']],
    bandit: [[0.8, 'money', 80, 300], [0.25, 'poultice_lesser'], [0.2, 'gear1'], [0.15, 'venom']],
    bandit_rich: [[1, 'money', 500, 1500], [0.6, 'gear2'], [0.4, 'accessory'], [0.5, 'poultice']],
    soldier: [[0.7, 'money', 60, 250], [0.25, 'poultice_lesser'], [0.2, 'gear1']],
    soldier_rich: [[1, 'money', 300, 900], [0.5, 'gear2'], [0.4, 'poultice']],
    noble: [[1, 'money', 200, 700], [0.3, 'accessory']],
    carta: [[0.8, 'money', 50, 200], [0.25, 'poultice_lesser'], [0.2, 'deep_mushroom']],
    carta_rich: [[1, 'money', 800, 2000], [0.6, 'gear2']]
  };
  D.LOOT_POOLS = {
    darkspawn_gear: ['waraxe_iron', 'longsword_iron', 'dagger_iron', 'mace_iron', 'shortbow_iron', 'leather_chest', 'chain_head', 'buckler_iron', 'greatsword_iron'],
    gear1: ['dagger_grey', 'longsword_grey', 'waraxe_grey', 'shortbow_grey', 'leather_head_q', 'leather_boots_q', 'studded_chest', 'chain_gloves', 'kite_iron', 'staff1'],
    gear2: ['longsword_steel', 'dagger_steel', 'greatsword_grey', 'longbow_grey', 'chain_chest_q', 'studded_chest_q', 'splint_head', 'kite_grey', 'staff2', 'mage_robe'],
    accessory: ['ring_iron', 'ring_silver', 'belt_leather', 'belt_warrior', 'belt_mage', 'amulet_andraste', 'ring_lyrium']
  };

  D.TAC_COND = {
    enemy_near: { name: 'Враг: ближайший', who: 'enemy' },
    enemy_on_me: { name: 'Враг: атакует меня', who: 'enemy' },
    enemy_on_ally: { name: 'Враг: атакует союзника', who: 'enemy' },
    enemy_ranged: { name: 'Враг: стрелок или маг', who: 'enemy' },
    enemy_strong: { name: 'Враг: лейтенант или сильнее', who: 'enemy' },
    enemy_weak: { name: 'Враг: здоровье < 25%', who: 'enemy' },
    enemy_cluster: { name: 'Враги: трое вместе', who: 'enemy' },
    leader_target: { name: 'Враг: цель лидера', who: 'enemy' },
    self_hp50: { name: 'Я: здоровье < 50%', who: 'self' },
    self_hp25: { name: 'Я: здоровье < 25%', who: 'self' },
    self_mp25: { name: 'Я: мана/выносливость < 25%', who: 'self' },
    self_surround: { name: 'Я: окружён (2+ врагов)', who: 'self' },
    self_any: { name: 'Я: в бою', who: 'self' },
    ally_hp50: { name: 'Союзник: здоровье < 50%', who: 'ally' },
    ally_hp25: { name: 'Союзник: здоровье < 25%', who: 'ally' },
    ally_mp25: { name: 'Союзник: мана/выносливость < 25%', who: 'ally' }
  };
  D.TAC_ACT_BASE = {
    attack: 'Атаковать',
    poultice: 'Припарка здоровья (лучшая)',
    lyrium: 'Лириумное зелье (лучшее)',
    stamina: 'Настой бодрости',
    to_leader: 'Отойти к лидеру',
    switch_melee: 'Взять оружие ближнего боя',
    switch_ranged: 'Взять оружие дальнего боя'
  };
  D.BEHAVIORS = { default: 'По умолчанию', aggressive: 'Агрессивно', defensive: 'Оборона', ranged: 'Держать дистанцию', passive: 'Не вступать в бой' };

  D.DIFFICULTY = {
    easy: { name: 'Лёгкий', foeDmg: 0.6, foeHp: 0.8, pcDmg: 1.15 },
    normal: { name: 'Нормальный', foeDmg: 0.85, foeHp: 1.0, pcDmg: 1.0 },
    hard: { name: 'Сложный', foeDmg: 1.1, foeHp: 1.15, pcDmg: 1.0 },
    nightmare: { name: 'Кошмар', foeDmg: 1.35, foeHp: 1.3, pcDmg: 1.0, ff: 1 }
  };

  D.SKIN = ['#f0d0b4', '#e0b896', '#c89a74', '#a87858', '#7a5236', '#5a3a24'];
  D.HAIR = ['#1a1410', '#3a2414', '#6a4020', '#9a6a30', '#c8a060', '#8a3a1a', '#b0b0b0', '#e8d8a8'];
  D.EYES = ['#3a5a8a', '#4a6a3a', '#5a3a1a', '#6a6a6a', '#8a6a2a'];
  D.HAIR_STYLES = [['short', 'Короткие'], ['long', 'Длинные'], ['tail', 'Хвост'], ['bald', 'Бритая голова'], ['braids', 'Косы'], ['crop', 'Ёжик']];
  D.BEARDS = [['none', 'Нет'], ['stubble', 'Щетина'], ['full', 'Борода'], ['braided', 'Косы в бороде'], ['goatee', 'Эспаньолка']];
  D.TATTOO = [['none', 'Нет'], ['vallaslin', 'Валласлин (долийский)'], ['brand', 'Клеймо (гномье)'], ['scar', 'Шрам']];

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
