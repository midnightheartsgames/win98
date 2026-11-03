(function (H) {
  'use strict';
  const T = H.TUNING;
  const PERM = 99;
  const NB = '\u00a0';
  const TIER = { boss: 'БОСС', elite: 'ЭЛИТА', normal: 'ОБЫЧНЫЙ' };
  const alive = u => !!u && !u.dead && !u.gone;
  const tierOf = u => (u.data.boss ? 'boss' : u.data.elite ? 'elite' : 'normal');
  const isPerm = b => !!b.perm || b.turns >= PERM;
  const int = v => H.fmt(Math.abs(v)).replace(/ /g, NB);
  const pct = v => String(Math.round(Math.abs(v) * 1000) / 10).replace('.', ',') + '%';
  const num = v => String(Math.round(Math.abs(v) * 10) / 10).replace('.', ',');
  const sign = v => (v < 0 ? '−' : '+');
  const stem = e => H.ELEMENTS[e].name.slice(0, -2).toLowerCase();
  const adj = e => H.ELEMENTS[e].name.toLowerCase();
  const gen = e => stem(e) + 'ого';
  const dat = e => stem(e) + 'ому';
  const nameOf = u => (u ? u.name : '');

  const STAT = {
    atkP: 'Сила атаки', defP: 'Защита', hpP: 'Макс. HP', spdP: 'Скорость', spd: ['Скорость', 1, true],
    critR: 'Шанс крит. попадания', critD: 'Крит. урон', followCritR: 'Шанс крит. попадания бонус-атак',
    dmgP: 'Наносимый урон', ultP: 'Урон абсолютной техники', skillP: 'Урон навыка', followP: 'Урон бонус-атак', dotP: 'Урон от эффектов',
    shimoP: 'Урон заряженной атаки Симоцуки', chaosP: 'Урон Хаоса и сбитой полярности',
    vuln: 'Получаемый урон', dotVuln: 'Получаемый урон от эффектов', critTaken: 'Шанс получить крит. удар',
    dr: ['Получаемый урон', -1], dmgDealtDown: ['Наносимый урон', -1], defDown: ['Защита', -1], resDown: ['Сопротивление урону', -1],
    res: 'Сопротивление эффектам', ehr: 'Шанс попадания эффектов', resPen: 'Пробивание сопротивления',
    breakE: 'Эффект пробития', breakEff: 'Эффективность пробития', toughIn: 'Урон по стойкости этой цели',
    err: 'Восстановление энергии', healP: 'Исходящее лечение', healIn: 'Входящее лечение', shieldP: 'Прочность получаемых щитов',
    elation: 'Радость', cwPow: 'Сила', cwLucky: 'Шанс счастливого удара',
    vsHigh: 'Урон по целям с HP от 50%', vsFrozen: 'Урон навыка и абсолютной техники по замороженным',
    tame: 'Крит. урон по этой цели', execCrit: 'Крит. урон бонус-атак по этой цели',
    atkShieldCap: 'Прибавка атаки от щита не больше чем'
  };
  for (const e of Object.keys(H.ELEMENTS)) {
    STAT[e + 'P'] = H.ELEMENTS[e].name + ' урон';
    STAT[e + 'Vuln'] = 'Получаемый ' + adj(e) + ' урон';
    STAT[e + 'ResDown'] = ['Сопротивление ' + dat(e) + ' урону', -1];
  }

  const ICON = { atkP: 'atk', defP: 'def', defDown: 'def', hpP: 'hp', spdP: 'spd', spd: 'spd', critR: 'critR', followCritR: 'critR', critD: 'critD', tame: 'critD', execCrit: 'critD', breakE: 'breakE', breakEff: 'breakE', toughIn: 'breakE', err: 'err', ehr: 'ehr', res: 'res', healP: 'healP', healIn: 'healP', dmgP: 'dmgP', ultP: 'dmgP', skillP: 'dmgP', followP: 'dmgP', dotP: 'dmgP', elation: 'elation' };
  for (const e of Object.keys(H.ELEMENTS)) ICON[e + 'P'] = 'dmgP';

  const TAKEN = new Set(['vuln', 'dotVuln', 'critTaken', 'toughIn', 'tame', 'execCrit', 'dr']);
  for (const e of Object.keys(H.ELEMENTS)) TAKEN.add(e + 'Vuln');
  function hurts(x) {
    const d = STAT[x.s];
    if (!d || !x.v) return false;
    const v = Array.isArray(d) && d[1] < 0 ? -x.v : x.v;
    return TAKEN.has(x.s) ? v > 0 : v < 0;
  }

  const MARK = {
    invig: x => 'Когда враг бьёт этого героя, Байлу лечит его.' + (x.left != null ? ' Осталось срабатываний: ' + x.left + '.' : ''),
    svMark: () => 'Отмечен Сварогом: удары Клары по отмеченным врагам бьют ещё раз.',
    bloom: () => 'Пробитый враг не встанет: в начале хода получит ледяной урон пробития и останется пробитым.',
    wet: () => 'Ледяной удар заморозит эту цель.',
    shackle: () => 'Перед каждым действием цель получает квантовый урон от Оков.',
    folly: () => 'Атаки союзников по цели вызывают бонус-атаку Рацио.',
    debt: x => 'Урон бонус-атак по цели ' + sign(x.v) + pct(x.v) + '. Счетовод преследует эту цель.',
    zone: () => 'Пока зона открыта, атаки союзников по врагам лечат отряд.',
    matrix: () => 'Часть урона союзников уходит на Фу Сюань. Отряд получает Знание.',
    survival: (x, u) => (u.flags && u.flags.debuffBlock > 0 ? 'Отразит ослаблений: ' + u.flags.debuffBlock + '.' : ''),
    mend: () => '',
    burden: () => 'Каждые 2 атаки отряда по цели дают очко навыка.',
    mind: () => 'Действует пассивка светового конуса.',
    lfDominate: () => 'Герой под властью врага: вместо своего хода бьёт союзника. Снимите ослабление или победите источник.',
    mark: x => 'Попадания союзников по цели вызывают дополнительный удар' + (x.src ? ': ' + x.src.name : '') + '.',
    phalanx: () => 'Урон атаки, навыка и абсолютной техники +20%.',
    moonlit: x => 'Удары ' + (x.src ? x.src.name + ' ' : '') + 'по этой цели сильнее.',
    hotMark: () => '',
    aggro: x => (x.v < 0 ? 'Враги реже выбирают целью (' + sign(x.v) + pct(x.v) + ').' : 'Враги чаще выбирают целью (' + sign(x.v) + pct(x.v) + ').'),
    defIgnore: x => 'Игнорирует ' + pct(x.v) + ' защиты цели.',
    followDefIgnore: x => 'Бонус-атаки игнорируют ' + pct(x.v) + ' защиты цели.',
    atkShield: x => 'Пока есть щит, сила атаки растёт на ' + pct(x.v) + ' от его прочности.'
  };

  const NAMED = {
    'Сигнатура': x => 'Гиноиды бьют эту цель. Получаемый урон ' + sign(x.v) + pct(x.v) + '.'
  };

  const EXTRA = {
    'Адский пейзаж': 'Базовая атака заменена Частоколом мечей, навык недоступен.',
    'Благословение': 'Атаки героя добивают цель молнией Тинъюнь.',
    'Знание': 'Знание от Матрицы предвидения Фу Сюань.'
  };

  const COND = {
    shielded: 'Действует, пока есть щит.', know: 'Действует со Знанием.', hp80: 'Действует при HP от 80%.', hp50: 'Действует при HP до 50%.',
    invig: 'Действует с Оживлением.', frozen: 'Действует, пока цель заморожена.', dissoc: 'Действует при распаде.', nightmare: 'Действует в облике Кошмара.',
    collapse: 'Действует, пока герой без сил.', stitch: 'Действует, пока цель сшита.', pink: 'Действует в розовом режиме.', chantFull: 'Действует при полном Напеве.'
  };

  function statText(s, v) {
    const d = STAT[s];
    if (!d || !v) return '';
    const [label, k, flat] = Array.isArray(d) ? d : [d, 1, false];
    const val = (k || 1) * v;
    return label + ' ' + sign(val) + (flat ? num(val) : pct(val)) + '.';
  }

  function buffText(x, u, b) {
    if (NAMED[x.name]) return NAMED[x.name](x, u, b);
    const parts = [];
    if (x.hpAdd) parts.push('Макс. HP +' + int(x.hpAdd) + '.');
    const mk = MARK[x.s];
    const main = mk ? mk(x, u, b) : statText(x.s, x.v);
    if (main) parts.push(main);
    if (x.hot) parts.push('В начале хода восстанавливает ' + int(x.hot) + NB + 'HP.');
    if (EXTRA[x.name]) parts.push(EXTRA[x.name]);
    if (x.cond && COND[x.cond]) parts.push(COND[x.cond]);
    return parts.join(' ');
  }

  const TAGS = { joke: 'шутка', cute: 'милота', threat: 'угроза', science: 'наука', kind: 'доброта', sing: 'музыка', bribe: 'выгода', silent: 'молчание', weird: 'странное' };
  const MOOD = { eager: 'интерес', happy: 'довольство', angry: 'злость', scared: 'страх' };
  const SET_LIVE = ['station', 'salsotto'];
  const FLAT = ['hp', 'atk', 'def', 'spd'];
  const MAIN = ['atk', 'def', 'critR', 'critD', 'spd'];
  const LABEL = { hp: 'HP', atk: 'Атака', def: 'Защита', spd: 'Скорость', critR: 'Шанс крита', critD: 'Крит. урон', breakE: 'Эффект пробития', elation: 'Радость', ehr: 'Шанс эффекта', res: 'Сопр. эффектам', err: 'Восст. энергии', healP: 'Лечение', dmgP: 'Урон', ultP: 'Урон абс. техники', skillP: 'Урон навыка', followP: 'Урон бонус-атак', breakEff: 'Эффективность пробития' };
  const flatText = (k, v) => (k === 'spd' && Math.round(v * 10) % 10 ? num(v) : H.fmt(Math.round(v)).replace(/ /g, NB));

  function statRow(k, base, total) {
    const flat = FLAT.includes(k), d = flat ? (k === 'spd' ? Math.round(total * 10) / 10 - Math.round(base * 10) / 10 : Math.round(total) - Math.round(base)) : Math.round((total - base) * 1000) / 1000;
    return { key: k, label: LABEL[k] || STAT[k] || k, base, total, delta: d, text: flat ? flatText(k, base) : pct(base), plus: d ? sign(d) + (flat ? (k === 'spd' ? num(d) : H.fmt(Math.abs(d))) : pct(d)) : '' };
  }

  function allyStats(u) {
    const S = H.battleStat, b = u.base, sv = k => S.sv(u, k), e = u.elem + 'P';
    const all = [
      statRow('hp', b.hp || u.maxHp, u.maxHp), statRow('atk', b.atk, S.atkOf(u)), statRow('def', b.def, S.defOf(u)), statRow('spd', b.spd, S.spdOf(u)),
      statRow('critR', b.critR || 0, sv('critR')), statRow('critD', b.critD || 0, sv('critD')),
      u.path === 'elation' ? statRow('elation', b.elation || 0, sv('elation')) : statRow('breakE', b.breakE || 0, sv('breakE')),
      statRow('ehr', b.ehr || 0, sv('ehr')), statRow('res', b.res || 0, sv('res')), statRow('err', 1 + (b.err || 0), 1 + sv('err')),
      statRow('healP', b.healP || 0, sv('healP')), statRow('dmgP', b.dmgP || 0, sv('dmgP')), Object.assign(statRow(e, b[e] || 0, sv(e)), { label: STAT[e] }),
      statRow('ultP', b.ultP || 0, sv('ultP')), statRow('skillP', b.skillP || 0, sv('skillP')), statRow('followP', b.followP || 0, sv('followP')), statRow('breakEff', b.breakEff || 0, sv('breakEff'))
    ];
    return { main: MAIN.map(k => all.find(r => r.key === k)), all };
  }

  function contactOf(b, u, g) {
    const d = u.data, fam = H.CONTACT && H.CONTACT[d.fam];
    const bank = g && g.state && g.state.bank && g.state.bank.enemies ? g.state.bank.enemies[u.id] : null;
    const known = bank ? Object.entries(bank.contacts || {}).filter(([, n]) => n > 0) : [];
    return {
      off: !!(b.opts && b.opts.noContact), can: !(d.noContact || d.boss || (b.opts && b.opts.noContact)), family: fam ? fam.name : null,
      mood: Object.entries(u.mood || {}).filter(([, v]) => v > 0).map(([k, v]) => MOOD[k] + ' ' + v + ' из ' + T.contactThreshold),
      known: known.map(([k, n]) => (MOOD[k] || k) + ' ×' + n),
      hint: known.length && fam ? Object.entries(fam.react).filter(([, v]) => v === 'eager' || v === 'happy').map(([t]) => TAGS[t]) : []
    };
  }

  const TAG = { single: 'Одиночная атака', blast: 'Взрывная атака', all: 'Групповая атака', bounce: 'Отскок', havoc: 'Одиночная атака', summon: 'Призыв', rally: 'Поддержка', lock: 'Ослабление', charge: 'Усиление' };
  const WHO = { single: 'одной цели', blast: 'одной цели и соседним целям', all: 'всем целям' };
  const POWER = [[1, 'небольшой '], [2, ''], [Infinity, 'огромный ']];
  const turnsWord = n => (n % 10 === 1 && n % 100 !== 11 ? 'ход' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'хода' : 'ходов');
  const forTurns = n => (n ? ' на ' + n + ' ' + turnsWord(n) : '');
  const chance = (c, verb) => (c != null && c < 1 ? 'С шансом ' + pct(c) + ' ' + verb : verb[0].toUpperCase() + verb.slice(1));
  const power = m => POWER.find(([lim]) => m < lim)[1];
  const lower = t => (t ? t[0].toLowerCase() + t.slice(1) : t);

  const FOE_FX = {
    dot: f => chance(f.chance, 'накладывает ') + H.DOT_NAME[f.type] + forTurns(f.turns) + '.',
    freeze: f => chance(f.chance, 'замораживает цель') + '.',
    delay: f => 'Отодвигает ход цели на ' + pct(f.v) + '.',
    debuff: f => chance(f.chance, 'накладывает ') + '«' + f.name + '»' + forTurns(f.turns) + ': ' + lower(statText(f.s, f.v) || 'особый эффект.'),
    shieldSelf: f => 'Создаёт себе щит: ' + pct(f.m) + ' макс. HP.',
    swallow: () => 'Проглатывает цель: та пропускает ходы и получает урон, пока её не отпустят.',
    multiply: () => 'Начинает размножаться: удары героев по нему призывают новых жуков.',
    lfDominate: f => 'Подчиняет героя с самой высокой атакой: тот бьёт союзников вместо своего хода' + forTurns(f.turns) + '.',
    spDrain: () => 'Отнимает очко навыка.',
    healSelf: f => 'Лечит себя на ' + pct(f.m) + ' макс. HP.',
    lfHealLord: () => 'Лечит главного врага.',
    lfSwords: () => 'Выстраивает летающие мечи.',
    lfSelfBuff: f => 'Накладывает на себя «' + f.name + '»' + forTurns(f.turns) + ': ' + lower(statText(f.s, f.v) || 'особый эффект.'),
    hpCost: f => 'Тратит ' + pct(f.v) + ' своего HP.'
  };

  function foeTag(sk) {
    if (sk.t !== 'self') return TAG[sk.t] || TAG.single;
    const fx = sk.fx || [];
    return fx.some(f => f.k === 'shieldSelf') ? 'Защита' : fx.some(f => f.k === 'healSelf' || f.k === 'lfHealLord') ? 'Восстановление' : 'Усиление';
  }

  function foeSkill(sk, d) {
    const parts = [];
    if (sk.t === 'havoc') parts.push('Бьёт цель, которую выбрал другой враг: ' + adj(sk.e) + ' урон, ' + pct(sk.m) + ' её макс. HP.');
    else if (sk.m && sk.e && WHO[sk.t]) parts.push('Наносит ' + power(sk.m) + adj(sk.e) + ' урон ' + WHO[sk.t] + '.');
    if (sk.t === 'lock') parts.push('Выбирает цель для следующего удара.');
    if (sk.t === 'charge') parts.push('Заряжает удар.');
    if (sk.t === 'rally') parts.push('Все враги получают «Приказ»: сила атаки +20% на 2 хода, остальные ходят на 20% раньше.');
    if (sk.t === 'summon' && sk.summon) parts.push('Призывает: ' + [...new Set(sk.summon)].map(id => (H.ENEMIES[id] ? H.ENEMIES[id].name : id)).join(', ') + '.' + (sk.max ? ' Не больше ' + sk.max + ' на поле.' : ''));
    if (sk.splash) parts.push('Соседние цели тоже получают урон.');
    if (sk.lockBonus) parts.push('По выбранной цели урон выше.');
    for (const f of sk.fx || []) if (FOE_FX[f.k]) parts.push(FOE_FX[f.k](f));
    if (sk.next != null && d.skills[sk.next]) parts.push((sk.t === 'lock' || sk.t === 'charge' ? 'Следующим ходом: ' : 'Затем: ') + d.skills[sk.next].n + '.');
    if (sk.self === 'die') parts.push('После удара погибает сам.');
    if (!parts.length) parts.push(sk.t === 'self' ? 'Действует на себя.' : 'Особое действие.');
    return { name: sk.n, tag: foeTag(sk), text: parts.join(' '), warn: sk.text || '' };
  }

  function coneOf(g, b, u) {
    if (!g || !g.state || (b && b.cw) || u.side !== 'ally' || u.summon) return null;
    const r = g.state.roster[u.key], cn = r && r.cone ? g.state.inv.cones.find(x => x.uid === r.cone) : null, d = cn && H.CONES[cn.id];
    if (!d) return null;
    return { cn, id: cn.id, d, sup: cn.sup || 1, stats: g.coneStatsOf ? g.coneStatsOf(cn) : H.coneStats(cn.id, r.lvl), lvl: g.coneLvlOf ? g.coneLvlOf(cn, r) : null, match: d.path === u.path };
  }

  function allyTag(ab) {
    const fx = ab.fx || [];
    if (fx.some(f => f.k === 'dmg')) return TAG[ab.target] || TAG.single;
    if (fx.some(f => f.k === 'heal')) return 'Восстановление';
    if (fx.some(f => f.k === 'shield')) return 'Защита';
    if (fx.some(f => f.k === 'debuff' || f.k === 'freeze' || f.k === 'dot')) return 'Ослабление';
    return ab.target === 'ally' || ab.target === 'allies' ? 'Поддержка' : 'Усиление';
  }

  const pips = (n, max) => ({ count: n + ' из ' + max });
  const has = (u, name) => u.buffs.some(x => x.name === name);
  const KIT = [
    ['march', u => u.flags.counters > 0 && { name: 'Контратака', stacks: u.flags.counters, text: 'Оставшиеся попытки контратаки.' }],
    ['trail_p', u => u.flags.magma > 0 && Object.assign({ name: 'Магма', text: 'На 4 зарядах атака становится Ледоколом: Магма.' }, pips(u.flags.magma, 4))],
    ['himeko', u => u.flags.charges > 0 && Object.assign({ name: 'Заряды', text: 'Пробития копят заряды. На 3 зарядах Химико бьёт огнём по всем врагам.' }, pips(u.flags.charges, 3))],
    ['asta', u => u.flags.charge > 0 && Object.assign({ name: 'Заряды', text: 'Каждый заряд повышает атаку союзников. В начале своего хода Аста теряет часть зарядов.' }, pips(u.flags.charge, 5))],
    ['yanagi', u => u.flags.shinra > 0 && { name: 'Синрабансё', turns: u.flags.shinra, text: 'Базовая атака усилена.' }],
    ['scar', u => u.flags.nightmare > 0 && { name: 'Аберрантный кошмар', turns: u.flags.nightmare, text: 'Облик Кошмара: атака и навык заменены.' }],
    ['megumin', u => (u.flags.chant || 0) > 0 && Object.assign({ name: 'Напев', text: 'Каждый Напев усиливает Взрыв на ' + pct(T.chantDmg) + '.' }, pips(u.flags.chant, u.flags.chantMax || T.chantMax))],
    ['megumin', u => u.flags.collapse > 0 && { name: 'Без сил', turns: u.flags.collapse, text: 'После Взрыва Мегумин пропускает ходы.' }],
    ['darkness', u => (u.flags.ecstasy || 0) > 0 && Object.assign({ name: 'Восторг', text: 'Удары по Даркнесс копят Восторг. На полном запасе её атака случайно попадёт.' }, pips(u.flags.ecstasy, T.ecstasyMax))],
    ['darkness', u => u.flags.cover > 0 && { name: 'Прикрытие', turns: u.flags.cover, text: 'Принимает на себя ' + pct(T.coverShare) + ' урона союзников.' }],
    ['kazuma', u => (u.flags.luck || 0) > 0 && Object.assign({ name: 'Удача', text: 'Запас удачи Казумы.' }, pips(u.flags.luck, u.flags.luckMax || T.luckMax))],
    ['aqua', u => (u.flags.tears || 0) > 0 && Object.assign({ name: 'Слёзы', text: 'Слёзы усилят следующий ход Аквы.' }, pips(u.flags.tears, u.flags.tearsMax || T.tearsMax))],
    ['blade', u => (u.flags.shuhu || 0) > 0 && Object.assign({ name: 'Дар Шуху', text: 'Урон и трата HP копят заряды. На полном запасе Блэйд бьёт всех врагов и лечится.' }, pips(u.flags.shuhu, u.flags.shuhuMax || T.shuhuMax))],
    ['miyabi', u => u.kit.charged && (u.flags.frost || 0) > 0 && Object.assign({ name: 'Изморозь', text: 'Тратится на заряженную атаку Симоцуки.' }, pips(u.flags.frost, T.frostMax))],
    ['luka', u => (u.flags.will || 0) > 0 && Object.assign({ name: 'Воля к битве', text: 'При 2 Волях базовая атака усиливается.' }, pips(u.flags.will, u.flags.willMax || T.willMax))],
    ['xueyi', u => (u.flags.karma || 0) > 0 && Object.assign({ name: 'Карма', text: 'Снятая стойкость копит Карму. На полном запасе Сюэи бьёт 3 раза.' }, pips(u.flags.karma, u.flags.karmaMax || T.karmaMax))],
    ['yukong', u => (u.flags.bow || 0) > 0 && Object.assign({ name: 'Ревущая тетива', text: 'Атака отряда повышена. Конец хода союзника снимает уровень.' }, pips(u.flags.bow, 2))],
    ['yukong', u => u.flags.arrowCd > 0 && { name: 'Стрела перезаряжается', turns: u.flags.arrowCd, text: 'Раз в два хода базовая атака бьёт ещё раз.' }],
    ['qingque', u => (u.flags.tiles || []).length > 0 && Object.assign({ name: 'Кости', text: '4 кости одной масти дают Закрытый конг.' }, pips(u.flags.tiles.length, T.tilesMax))],
    ['qingque', u => u.flags.kong && { name: 'Закрытый конг', text: 'Атака повышена, следующая атака усилена.' }],
    ['qingque', u => u.flags.tileStack > 0 && { name: 'Последняя кость', stacks: u.flags.tileStack, text: 'Урон +' + pct(T.tileDmg * u.flags.tileStack) + ' до конца хода.' }],
    ['makoto', u => (u.flags.shiny || 0) > 0 && Object.assign({ name: 'Блестяшки', text: 'Каждая повышает крит. урон Макото.' }, pips(u.flags.shiny, u.flags.shinyMax || T.mkShinyMax))],
    ['makoto', u => u.flags.away && { name: 'В портале', text: 'В начале хода Макото вернётся и ударит врага с наибольшим HP.' }],
    ['talleah', u => !u.flags.capsuleUsed && !u.dead && { name: 'Капсула', text: 'Раз за бой спасёт Таллею от смерти.' }],
    ['billy', u => (u.flags.steady || 0) > 0 && Object.assign({ name: '«С колена»', text: 'Базовые атаки подряд повышают урон. Навык и пропуск хода сбрасывают.' }, pips(u.flags.steady, T.steadyMax))],
    ['billy', u => (u.flags.star || 0) > 0 && Object.assign({ name: 'Звёздные рыцари', text: 'Заряды усиливают абсолютную технику.' }, pips(u.flags.star, T.starMax))],
    ['nicole', u => (u.flags.caseShots || 0) > 0 && Object.assign({ name: 'Начинка', text: 'Базовые атаки бьют по площади и продлевают поле.' }, pips(u.flags.caseShots, T.caseShots))],
    ['anby', u => (u.flags.series || 0) > 0 && Object.assign({ name: 'Серия', text: 'На полной Серии следующая атака становится Громом.' }, pips(u.flags.series, T.seriesMax))],
    ['luocha', u => (u.flags.flowers || 0) > 0 && Object.assign({ name: 'Цветки Бездны', text: 'На 2 Цветках открывается зона.' }, pips(u.flags.flowers, 2))],
    ['luocha', u => !has(u, 'Зона Лочи') && u.flags.lcCd > 0 && { name: 'Молитва перезаряжается', turns: u.flags.lcCd, text: 'Самолечение союзника снова сработает позже.' }],
    ['imbibitor', u => (u.flags.scales || 0) > 0 && Object.assign({ name: 'Чешуя дракона', text: 'Заменяет очки навыка для усиленной атаки.' }, pips(u.flags.scales, 3))],
    ['imbibitor', u => u.flags.tier > 0 && Object.assign({ name: 'Усиление атаки', text: 'Уровень усиления базовой атаки.' }, pips(u.flags.tier, 3))],
    ['imbibitor', u => u.flags.right > 0 && { name: 'Праведное сердце', stacks: u.flags.right, text: 'Каждый удар повышает урон до конца хода.' }],
    ['fuxuan', u => (u.flags.fxCharges || 0) > 0 && Object.assign({ name: 'Самолечение', text: 'На 50% HP Фу Сюань лечит большую часть потерянного.' }, pips(u.flags.fxCharges, 2))],
    ['jingliu', u => (u.flags.syz || 0) > 0 && Object.assign({ name: 'Сизигия', text: 'На 2 Сизигиях Цзинлю ходит сразу и входит в Трансмиграцию.' }, pips(u.flags.syz, 3))],
    ['jingliu', u => u.flags.trans && { name: 'Спектральная трансмиграция', text: 'Крит. шанс повышен, навык усилен.' }],
    ['argenti', u => (u.flags.apo || 0) > 0 && Object.assign({ name: 'Апофеоз', text: 'Каждый стак повышает крит. шанс.' }, pips(u.flags.apo, 10))],
    ['jingyuan', (u, b) => { const h = b && b.lordOf && b.lordOf(u); return !!h && { name: 'Повелитель молний', stacks: h.flags.hits, text: 'Столько ударов нанесёт Повелитель в свой ход.' }; }],
    ['topaz', (u, b) => { const h = b && b.numbyOf && b.numbyOf(u); return !!(h && h.flags.wind > 0) && { name: 'Поразительный рост', stacks: h.flags.wind, text: 'Атаки Счетовода усилены.' }; }],
    ['huohuo', u => u.flags.prov > 0 && { name: 'Жертвенность жизни', turns: u.flags.prov, text: 'Хохо лечит союзников в начале их хода. Осталось лечений: ' + (u.flags.provN || 0) + '.' }],
    ['phrolova', u => (u.flags.notes || []).length > 0 && Object.assign({ name: 'Ноты', text: 'На полном запасе нот Геката выходит на шкалу.' }, pips(u.flags.notes.length, T.notesMax))],
    [null, u => u.kit && u.kit.personas && H.INABA && { name: 'Персона: ' + H.INABA.PERSONAS[u.flags.skillSel | 0].name, text: 'Навык меняется вместе с Персоной.' }],
    [null, u => u.side === 'ally' && u.flags.oneMore && { name: 'Ещё раз!', text: 'Пробитие врага даёт дополнительный ход.' }],
    ['yosuke', u => u.flags.strike && { name: 'Подхват', text: 'Ёсуке ударит вслед за пробитием союзника.' }],
    ['kanji', u => u.flags.stitch && { name: 'Стежок', turns: u.flags.stitch.turns, text: 'Две цели сшиты: часть урона и стойкости идёт по нити.' }],
    [null, u => u.side === 'ally' && u.flags.freeSkill && { name: 'Бесплатный навык', text: 'Следующий навык не тратит очки навыка.' }],
    [null, (u, b) => u.side === 'ally' && !u.summon && u.path === 'elation' && b && b.bangerOf && b.bangerOf(u) > 0 && { name: 'Хит', stacks: b.bangerOf(u), text: 'Навык и абсолютная техника добавляют Урон Радости.' }],
    [null, (u, b) => u.side === 'enemy' && (u.flags.icefire || 0) > 0 && b && b.allies.some(a => a.charId === 'miyabi') && Object.assign({ name: 'Ледяное пламя', text: 'На полном запасе Мияби вызывает Обморожение.' }, pips(u.flags.icefire, T.icefireMax))]
  ];

  function rightOf(r) {
    if (r.count) return r.count;
    if (r.perm) return 'до конца боя';
    if (r.next) return 'до своего хода';
    const n = r.turns > 0 ? 'Осталось ходов: ' + r.turns : '';
    return r.stacks > 1 || (r.stacks && !n) ? '×' + r.stacks + (n ? ' · ' + n : '') : n;
  }

  function statuses(u, b) {
    const out = { buff: [], debuff: [], other: [] };
    const add = (g, r) => { r.right = r.right != null ? r.right : rightOf(r); r.text = r.text || ''; out[g].push(r); };
    const condOk = H.battleStat && H.battleStat.condOk;
    if (u.shield > 0) add('buff', { kind: 'shield', icon: 'def', name: 'Щит', value: Math.round(u.shield), turns: u.shieldT || 0, text: 'Поглощает ' + int(u.shield) + NB + 'урона. Пока щит цел, HP не снижается.' });
    if (u.taunt > 0) add('buff', { kind: 'taunt', name: 'Провокация', turns: u.taunt, text: 'Враги атакуют этого героя.' });
    for (const x of u.buffs) {
      const perm = isPerm(x);
      const r = { kind: 'buff', name: x.name, s: x.s, v: x.v, icon: ICON[x.s] || null, cond: x.cond || null, on: !x.cond || !condOk || condOk(u, x.cond), perm, turns: perm ? 0 : x.turns, text: buffText(x, u, b) };
      if (x.s === 'shackle') r.right = 'Осталось действий: ' + x.v;
      add(x.debuff || hurts(x) ? 'debuff' : 'buff', r);
    }
    for (const d of u.dots) add('debuff', { kind: 'dot', name: H.DOT_NAME[d.type], elem: H.DOT_ELEM[d.type], turns: d.turns, stacks: d.stacks || 1, dmg: Math.round((d.dmg || 0) * (d.stacks || 1)), text: 'В начале хода получает ' + int((d.dmg || 0) * (d.stacks || 1)) + NB + gen(H.DOT_ELEM[d.type]) + ' урона.' });
    if (u.frozen) add('debuff', { kind: 'freeze', elem: 'ice', name: 'Заморозка', next: true, text: 'Пропустит ход.' + (u.frozenDmg ? ' В начале хода получит ' + int(u.frozenDmg) + NB + 'ледяного урона.' : '') });
    if (u.stun) add('debuff', { kind: 'stun', name: 'Оглушение', next: true, text: 'Пропустит следующий ход.' });
    if (u.flags && u.flags.bound > 0) add('debuff', { kind: 'bound', name: 'Связан', next: true, text: 'Пропустит следующий ход.' });
    if (u.side === 'enemy') {
      if (u.implant) add('debuff', { kind: 'implant', elem: u.implant.e, name: 'Внесённая уязвимость', turns: u.implant.turns, text: 'Цель уязвима к стихии: ' + adj(u.implant.e) + ' урон пробивает её стойкость.' });
      if (u.frostbite) add('debuff', { kind: 'frostbite', elem: 'ice', name: 'Обморожение', turns: u.frostbite.turns, text: 'Аномалия холода. Хаос взорвёт её ледяным уроном.' });
      if (alive(u.flags.provoke)) add('debuff', { kind: 'provoke', name: 'Вызов', next: true, text: 'Атакует только этого героя: ' + nameOf(u.flags.provoke) + '.' });
      if (b && b.fieldOn && b.fieldOn()) add('debuff', { kind: 'field', name: 'Энергетическое поле', turns: b.field.turns, text: 'Защита −' + pct(b.fieldK(b.field.src).def) + '. Все враги считаются соседями цели.' });
      if (u.broken) add('other', { kind: 'broken', name: 'Пробитие уязвимости', next: true, text: 'Стойкость пробита. В начале своего хода враг восстановит её.' });
      const sk = u.charging != null && u.data.skills ? u.data.skills[u.charging] : null;
      if (sk) add('other', { kind: 'charge', name: 'Готовит: ' + sk.n, next: true, text: 'Следующим ходом применит этот навык.' });
      if (alive(u.lockTarget)) add('other', { kind: 'lock', name: 'Цель: ' + u.lockTarget.name, text: 'Следующий удар врага направлен на этого героя.' });
      const el = u.elys && b && b.elysSnap ? b.elysSnap(u) : null;
      if (el) add('other', { kind: 'elys', name: 'Элизиум', turns: el.rounds, text: 'Печатей сломано ' + el.broke + ' из ' + el.need + ', углей ' + el.embers + '. Удары двух разных союзников ломают печать.' });
    } else {
      for (const set of SET_LIVE) {
        const sd = u.sets && u.sets[set] ? H.RELIC_SETS[set] : null;
        if (!sd || !sd.cond) continue;
        const cur = sd.cond.s === 'spd' ? H.battleStat.spdOf(u) : H.battleStat.sv(u, 'critR'), on = cur >= sd.cond.v - 1e-9;
        add('other', { kind: 'set', name: sd.name, on, right: on ? 'действует' : '', text: sd.text + ' Сейчас: ' + (sd.cond.s === 'spd' ? 'скорость ' + num(cur) : 'шанс крита ' + pct(cur)) + '.' });
      }
      if (u.swallowed) add('debuff', { kind: 'swallow', name: 'Внутри жабы', turns: u.swallowed.turns, text: 'Пропускает ходы и получает урон, пока жаба не отпустит.' });
      if (u.caged) add('other', { kind: 'caged', name: 'В клетке Аквы', text: 'Герой занят очищением воды.' });
    }
    for (const [id, fn] of KIT) {
      if (id && u.charId !== id) continue;
      const r = fn(u, b);
      if (!r) continue;
      const same = out.buff.concat(out.debuff).find(x => x.kind === 'buff' && x.name === r.name);
      if (!same) { add('other', Object.assign({ kind: 'kit' }, r)); continue; }
      const right = rightOf(r);
      if (right) same.right = right;
      same.text = (same.text ? same.text + ' ' : '') + r.text;
    }
    return out;
  }

  function model(b, u, g) {
    const foe = u.side === 'enemy', st = statuses(u, b), S = H.battleStat;
    const m = { u, foe, name: u.name, lvl: u.lvl, dead: !alive(u), current: b.current === u, hp: Math.max(0, Math.round(u.hp)), maxHp: u.maxHp, shield: Math.round(u.shield || 0), statuses: st, counts: { buff: st.buff.length, debuff: st.debuff.length } };
    if (foe) {
      const resist = (u.resist || []).filter(e => !u.weak.includes(e));
      Object.assign(m, { tier: tierOf(u), tough: u.tough, maxTough: u.maxTough, broken: !!u.broken, resist, resistPct: T.resistRes, otherPct: T.defaultRes, others: Object.keys(H.ELEMENTS).length - u.weak.length - resist.length,
        spd: statRow('spd', u.base.spd, S.spdOf(u)), effRes: statRow('res', u.base.res || 0, S.sv(u, 'res')), contact: contactOf(b, u, g) });
    } else if (u.summon) Object.assign(m, { summon: true, owner: u.owner ? u.owner.name : null, elem: u.elem, path: u.path, energy: 0, maxEnergy: 0 });
    else Object.assign(m, { elem: u.elem, path: u.path, eid: u.eid || 0, energy: Math.floor(u.energy || 0), maxEnergy: u.maxEnergy || 0, stats: allyStats(u) });
    return m;
  }

  H.BD = { TIER, PERM, STAT, MARK, NAMED, EXTRA, COND, KIT, TAGS, MOOD, TAG, POWER, FOE_FX, statuses, hurts, model, tierOf, statText, buffText, rightOf, allyStats, contactOf, pct, foeSkill, foeTag, allyTag, coneOf };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
