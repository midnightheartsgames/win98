(function (H) {
  'use strict';
  const T = H.TUNING;
  const { sv, atkOf, alive } = H.battleStat;

  const E = o => Object.assign({ hp: 1, atk: 1, spd: 95, tough: 20, weak: [], resist: [], exp: 1, credits: 1, drops: [] }, o);
  const FOES = {
    antibaryon: E({ name: 'Антибарион', fam: 'voidranger', shape: 'orb2', col: ['#3a3450', '#ffb040'], hp: 0.7, spd: 83, tough: 10, weak: ['phys', 'quant'], exp: 0.8,
      skills: [{ n: 'Истребление', w: 1, t: 'single', m: 1.0, e: 'imag' }], gift: 'medkit' }),
    distorter: E({ name: 'Рейнджер пустоты: Исказитель', fam: 'voidranger', shape: 'ranger3', col: ['#24223a', '#ff4ad8'], hp: 0.9, spd: 120, weak: ['wind', 'imag'],
      skills: [{ n: 'Приказ Небытия', w: 1, t: 'lock', next: 1, text: 'Исказитель отмечает цель.' }, { n: 'Удар бесследной пустоты', w: 2, t: 'single', m: 1.7, e: 'quant' }], gift: 'exp1' }),
    weaver: E({ name: 'Мнимый ткач', fam: 'spawn', shape: 'weaver', col: ['#2a2418', '#ffd23a'], hp: 0.95, spd: 120, weak: ['phys', 'elec', 'quant'],
      skills: [{ n: 'Луч гимна', w: 3, t: 'single', m: 1.0, e: 'imag' }, { n: 'Эхо гимна', w: 1, t: 'blast', m: 0.8, e: 'imag' }], gift: 'jadeSmall' }),
    guardian: E({ name: 'Тень хранительницы', fam: 'shade', shape: 'guardian', col: ['#2a1a4a', '#c890ff'], elite: true, hp: 4.4, atk: 1.3, spd: 110, tough: 90, weak: ['phys', 'wind', 'quant'], exp: 3.5, credits: 3,
      skills: [{ n: 'Воспоминание молнии', w: 3, t: 'single', m: 1.5, e: 'elec', fx: [{ k: 'dot', type: 'shock', m: 0.4, turns: 2, chance: 0.6 }] }, { n: 'Осуждение молнией', w: 2, t: 'blast', m: 1.0, e: 'elec' }], gift: 'relic' }),
    searing: E({ name: 'Пылающий странник', fam: 'shade', shape: 'prowler2', col: ['#3a0e08', '#ff8040'], elite: true, hp: 4.6, atk: 1.35, spd: 100, tough: 90, weak: ['ice', 'elec', 'imag'], resist: ['fire'], exp: 3.5, credits: 3,
      skills: [{ n: 'Багровый клинок', w: 3, t: 'single', m: 1.5, e: 'fire', fx: [{ k: 'dot', type: 'burn', m: 0.5, turns: 3, chance: 1 }] }, { n: 'Испепеляющий взмах', w: 1, t: 'blast', m: 1.2, e: 'fire' }], gift: 'relic' }),
    bronya_b: E({ name: 'Броня', fam: 'boss', shape: 'bronya', col: ['#2a4a8a', '#9ae8ff'], boss: true, hp: 10, atk: 1.3, spd: 120, tough: 140, weak: ['phys', 'fire', 'imag'], exp: 10, credits: 8,
      skills: [{ n: 'Пуля наездника ветра', t: 'single', m: 1.3, e: 'wind' }, { n: 'Боевое перестроение', t: 'rally' }, { n: 'Скоординированное подкрепление', t: 'summon', summon: ['soldier', 'gunner'], max: 3 },
        { n: 'Огонь на подавление', t: 'single', m: 1.9, e: 'wind', fx: [{ k: 'debuff', s: 'spdP', v: -0.2, turns: 2, chance: 1, name: 'Подавление' }] }],
      pat: [0, 2, 3, 1, 0, 3, 2, 1] })
  };
  for (const [id, e] of Object.entries(FOES)) e.id = id;
  Object.assign(H.ENEMIES, FOES);

  Object.assign(H.ITEMS, {
    lucent: { name: 'Сияющий отсвет', kind: 'key', rar: 4, price: 0, text: 'Отблеск минувших дней, бесценный для Сада воспоминаний. Посланник принимает его в «Пассаже Световых конусов».' },
    feather: { name: 'Нефритовое перо', kind: 'key', rar: 4, price: 0, text: 'Перо, которое Сад воспоминаний отдаёт за редкие воспоминания. Посланник принимает его в лавке «Шутки сбываются».' },
    resin: { name: 'Самомоделирующаяся смола', kind: 'key', rar: 5, price: 0, text: 'Смола принимает форму, которую ей задают. Из неё можно создать реликвию с нужной основной характеристикой (магазин Посланника).' }
  });

  Object.assign(H.CONES, {
    fermata: {
      name: 'Фермата', path: 'nihility', rarity: 4, ref: 21022, stats: { hp: 43.2, atk: 21.6, def: 15 }, skill: 'Целая пауза', shop: true,
      tpl: 'Эффект пробития владельца повышается на #1%. Урон владельца по врагам с Шоком или Порывом ветра повышается на #2%, в том числе периодический.', p: [[0.16, 0.16], [0.2, 0.2], [0.24, 0.24], [0.28, 0.28], [0.32, 0.32]], bonus: { breakE: 1 }, fx: 'fermata',
      desc: 'Пластинка фонографа проигрывается без остановки. Даже звуки хриплых криков не могут вырваться из волны жара и приглушаются её прохладой.\nОна казалась неподготовленной и совершенно очарованной завораживающими мелодиями:\nВсё началось с мольбы и предвкушения,\nЗа которыми последовал страстный катарсис,\nС одной кульминацией за другой...\nПока пластинка не остановилась окончательно и хриплые крики не затихли.\n«Миссия выполнена».'
    },
    quid: {
      name: 'Равноценный обмен', path: 'abundance', rarity: 4, ref: 21021, stats: { hp: 43.2, atk: 19.2, def: 18 }, skill: 'Безудержное веселье', shop: true,
      tpl: 'В начале своего хода владелец восстанавливает #2 энергии случайному союзнику (кроме себя), у которого энергии меньше #1%.', p: [[0.5, 8], [0.5, 10], [0.5, 12], [0.5, 14], [0.5, 16]], bonus: {}, fx: 'quid',
      desc: 'После бодрящего массажа в исполнении девушки-дракона\nдевушка-лисица протянула руку и весело потрепала девушку-дракона за пухлые щёчки.\nДевочка надула губы, явно от обиды, на что девушка-лисица лишь ласково улыбнулась.\n«Вот что такое равноценный обмен».'
    },
    wildfire: {
      name: 'Мы — Дикий Огонь', path: 'preservation', rarity: 4, ref: 21023, stats: { hp: 33.6, atk: 21.6, def: 21 }, skill: 'Слёзы на глазах', shop: true,
      tpl: 'В начале боя урон, получаемый всеми союзниками, понижается на #2% на #3 ходов, и каждый союзник восстанавливает #1% недостающего HP.', p: [[0.3, 0.08, 5], [0.35, 0.1, 5], [0.4, 0.12, 5], [0.45, 0.14, 5], [0.5, 0.16, 5]], bonus: {}, fx: 'wildfire',
      desc: 'Она привыкла к тому, что люди теряют свои дома.\nА также к тому, что люди гибнут.\nНо нет смысла плакать в одиночестве.\n«Надень этот красный шарф, и тогда мы разделим боль друг друга. Мы семья. Мы Дикий Огонь».\nКогда широкая ладонь погладила её по голове, стало невозможно сдерживать слёзы.'
    },
    river: {
      name: 'Весенние потоки рек', path: 'hunt', rarity: 4, ref: 21024, stats: { hp: 38.4, atk: 21.6, def: 18 }, skill: 'Избавление от холодов', shop: true,
      tpl: 'В начале боя скорость владельца повышается на #1%, а урон на #2%. Эффект пропадает, когда владелец получает урон, и возвращается в конце его следующего хода.', p: [[0.08, 0.12], [0.09, 0.15], [0.1, 0.18], [0.11, 0.21], [0.12, 0.24]], bonus: {}, fx: 'river',
      desc: 'Юноша сделал небольшой перерыв в тренировках с мечом.\nСолнечный свет обжигал его и без того разгорячённую шею.\nОн медленно заходил в воду, ощущая её прохладу на босых ногах.\nКогда звенят колокольчики и щебечут птицы, люди даже в далёких краях узнают, что пришла весна.'
    },
    pastfuture: {
      name: 'Прошлое и будущее', path: 'harmony', rarity: 4, ref: 21025, stats: { hp: 43.2, atk: 19.2, def: 18 }, skill: 'Бумажные змеи из прошлого', shop: true,
      tpl: 'После навыка владельца урон следующего ходящего союзника повышается на #1% на #2 ход.', p: [[0.16, 1], [0.2, 1], [0.24, 1], [0.28, 1], [0.32, 1]], bonus: {}, fx: 'pastfuture',
      desc: 'Крылья бумажного змея в её руках были сломаны, жестоко напоминая о трагической кончине близкого человека.\nОна опустилась на колени у пожара войны, её глаза были полны горя.\n«Если ты сам мог всех спасти, то наша жертва...»\nОгненные залпы окрашивали небо в красный цвет, не умаляя его величия.\nОна взглянула на небо, и глаза её переполняла ярость.'
    },
    woof: {
      name: 'Гав! Время прогулок!', path: 'destruction', rarity: 4, ref: 21026, stats: { hp: 43.2, atk: 21.6, def: 15 }, skill: 'Беги!', shop: true,
      tpl: 'Атака владельца повышается на #1%. Урон владельца по врагам с Горением или Кровотечением повышается на #2%, в том числе периодический.', p: [[0.1, 0.16], [0.125, 0.2], [0.15, 0.24], [0.175, 0.28], [0.2, 0.32]], bonus: { atkP: 1 }, fx: 'woof',
      desc: 'Жаль, что никто этого не видел...\nНе видел, как он сморщил нос, принюхался и нырнул на безлюдную тропинку.\nЖаль, что никто этого не заметил...\nНе заметил, как он втягивает когти, вводит пароль и ныряет в объятия свободы.\nНеужели до сих пор никто не обратил внимания?..\nВзрослая собака научилась гулять в космосе!'
    },
    breakfast: {
      name: 'Важность завтрака', path: 'erudition', rarity: 4, ref: 21027, stats: { hp: 38.4, atk: 21.6, def: 18 }, skill: 'Всем приготовиться', shop: true,
      tpl: 'Урон владельца повышается на #1%. За каждого побеждённого владельцем врага его атака повышается на #2%, до #3 раз.', p: [[0.12, 0.04, 3], [0.15, 0.05, 3], [0.18, 0.06, 3], [0.21, 0.07, 3], [0.24, 0.08, 3]], bonus: { dmgP: 1 }, fx: 'breakfast',
      desc: 'Стол уже накрыт...\nКто-то хочет сначала выпить чашку чая.\nКто-то хочет сначала сфотографироваться.\nКто-то хочет сначала почитать газету.\nКто-то хочет сначала сделать заметки в блокноте.\nКто-то хочет сначала поиграть на смартфоне.\n«Эй, ешьте, пока не остыло! Пом!»'
    }
  });
  H.coneInit(H.CONES);

  const TUN = { lvlFrom: [32, 65], lvlTo: [18, 49], hp: [1, 1.15, 1.3, 1.3, 1.4, 3.6, 4.4, 2.2, 2.8, 3.8, 3.6, 3.8, 3.4, 2.4, 2.2], atkRamp: 0.02, energyStart: 0.5, firstCycle: 150, cycle: 100, insignia: 3, shopDays: 42, echoWeek: 3, echoLucent: 10 };
  const lvlOf = L => Math.round(TUN.lvlTo[0] + (L - TUN.lvlFrom[0]) * (TUN.lvlTo[1] - TUN.lvlTo[0]) / (TUN.lvlFrom[1] - TUN.lvlFrom[0]));

  const TURB = [
    { text: 'Урон Ветром всех союзников +50%.', fx: [{ k: 'stat', s: 'windP', v: 0.5 }] },
    { text: 'Ледяной урон всех союзников +50%.', fx: [{ k: 'stat', s: 'iceP', v: 0.5 }] },
    { text: 'Огненный урон всех союзников +50%.', fx: [{ k: 'stat', s: 'fireP', v: 0.5 }] },
    { text: 'Физический урон всех союзников +50%.', fx: [{ k: 'stat', s: 'physP', v: 0.5 }] },
    { text: 'Электрический урон всех союзников +50%.', fx: [{ k: 'stat', s: 'elecP', v: 0.5 }] },
    { text: 'Урон навыков всех союзников +25%. В начале каждого цикла команда получает 2 очка навыка.', fx: [{ k: 'stat', s: 'skillP', v: 0.25 }, { k: 'sp', v: 2 }] },
    { text: 'Урон абсолютных техник всех союзников +25%. В начале каждого цикла все союзники получают 20 энергии.', fx: [{ k: 'stat', s: 'ultP', v: 0.25 }, { k: 'energy', v: 20 }] },
    { text: 'В начале каждого цикла союзник с самой высокой атакой наносит на 60% больше урона в течение 1 хода.', fx: [{ k: 'topAtk', v: 0.6 }] },
    { text: 'В начале каждого цикла следующая атака каждого союзника снимает на 50% больше прочности.', fx: [{ k: 'break', v: 0.5 }] },
    { text: 'В начале каждого цикла шанс крита всех союзников +8%, до 40%.', fx: [{ k: 'crit', v: 0.08, max: 0.4 }] },
    { text: 'В начале каждого цикла союзник с наименьшим HP восстанавливает 60% макс. HP.', fx: [{ k: 'healLow', v: 0.6 }] },
    { text: 'В начале каждого цикла следующая атака каждого союзника наносит на 50% больше урона.', fx: [{ k: 'dmg', v: 0.5 }] },
    { text: 'В начале каждого цикла все союзники получают щит в 25% макс. HP.', fx: [{ k: 'shield', v: 0.25 }] },
    { text: 'В начале каждого цикла шанс крита всех союзников +20% и крит. урон +40% до следующего цикла.', fx: [{ k: 'critBoth', r: 0.2, d: 0.4 }] },
    { text: 'В начале каждого цикла все враги получают на 35% больше урона до своего следующего хода.', fx: [{ k: 'vuln', v: 0.35 }] }
  ];

  const KINDS = {
    one: { budget: 20, goals: [10, 14] },
    pair: { budget: 20, goals: [8, 12] },
    nodes: { budget: 30, goals: [12, 18] }
  };

  const B = (waves, music) => ({ waves, music: music || null });
  const ST = (n, L, kind, nodes) => ({ n, L, get lvl() { return lvlOf(this.L); }, kind, nodes, turb: TURB[n - 1] });
  const STAGES = [
    ST(1, 32, 'one', [[B([['reaver', 'distorter', 'reaver', 'antibaryon'], ['reaver', 'trampler', 'reaver', 'baryon', 'baryon']])]]),
    ST(2, 36, 'one', [[B([['spider', 'hound', 'hound', 'gunner'], ['hound', 'direwolf', 'hound', 'gunner']])]]),
    ST(3, 39, 'one', [[B([['flamespawn', 'shadewalker', 'shadewalker', 'frostspawn'], ['frostspawn', 'iceout', 'frostspawn']])]]),
    ST(4, 42, 'one', [[B([['soldier', 'gunner', 'soldier', 'hound', 'gunner'], ['bronya_b']], 'gepard')]]),
    ST(5, 44, 'one', [[B([['spider', 'beetle', 'beetle', 'spider'], ['grizzly', 'beetle']], 'boss')]]),
    ST(6, 45, 'pair', [[B([['incinerator', 'searing', 'incinerator']]), B([['flamespawn', 'blazeout', 'flamespawn']])]]),
    ST(7, 47, 'pair', [[B([['soldier', 'lieutenant', 'gunner']]), B([['weaver', 'guardian', 'weaver']])]]),
    ST(8, 50, 'pair', [[B([['beetle', 'direwolf', 'hound']]), B([['beetle', 'grizzly', 'hound']], 'boss')]]),
    ST(9, 52, 'pair', [[B([['soldier', 'lieutenant', 'cannoneer']]), B([['reaver', 'trampler', 'eliminator', 'reaver']])]]),
    ST(10, 54, 'pair', [[B([['incinerator', 'guardian', 'shadewalker']]), B([['antibaryon', 'eliminator', 'trampler', 'reaver', 'eliminator']])]]),
    ST(11, 55, 'nodes', [[B([['flamespawn', 'flamespawn', 'flamespawn', 'flamespawn', 'flamespawn'], ['flamespawn', 'blazeout', 'flamespawn']])], [B([['shadewalker', 'spider', 'shadewalker', 'spider', 'shadewalker'], ['frostspawn', 'prowler']])]]),
    ST(12, 57, 'nodes', [[B([['spider', 'hound', 'incinerator', 'spider'], ['incinerator', 'searing', 'incinerator']])], [B([['soldier', 'cannoneer', 'soldier', 'gunner'], ['soldier', 'lieutenant', 'soldier']])]]),
    ST(13, 60, 'nodes', [[B([['vagrant', 'spider', 'spider', 'hound', 'vagrant'], ['vagrant', 'grizzly']], 'boss')], [B([['frostspawn', 'weaver', 'weaver', 'hound'], ['hound', 'iceout', 'spider']])]]),
    ST(14, 63, 'nodes', [[B([['soldier', 'gunner', 'gunner', 'cannoneer', 'soldier'], ['bronya_b']], 'gepard')], [B([['beetle', 'beetle', 'beetle'], ['svarog_b', 'hound']], 'svarog')]]),
    ST(15, 65, 'nodes', [[B([['gunner', 'cannoneer', 'cannoneer', 'soldier'], ['gunner', 'gepard_b', 'cannoneer']], 'gepard')], [B([['shadewalker', 'shadewalker', 'shadewalker'], ['cocolia1']], 'cocolia')]])
  ];
  const REC = [
    [['phys', 'wind', 'imag']], [['ice', 'elec', 'imag']], [['fire', 'wind', 'quant']], [['phys', 'fire', 'imag']], [['fire', 'ice', 'elec']],
    [['ice']], [['phys', 'quant']], [['ice', 'elec']], [['phys']], [['phys', 'wind']],
    [['phys', 'ice', 'quant'], ['fire', 'elec', 'quant']], [['ice', 'elec', 'imag'], ['phys', 'ice', 'quant']], [['fire', 'ice', 'elec'], ['fire', 'wind', 'quant']],
    [['phys', 'fire', 'imag'], ['fire', 'elec', 'wind']], [['phys', 'elec', 'imag'], ['fire', 'elec', 'quant']]
  ];
  for (const st of STAGES) Object.assign(st, { budget: KINDS[st.kind].budget, goals: KINDS[st.kind].goals, rec: REC[st.n - 1] });

  const SERIES = [{ id: 'vestiges', name: 'Наследие Возвышающейся цитадели', world: 'Ярило-VI', text: 'Воспоминания о Ярило-VI: Белобог, Подземье и Холм вечнозимья. Пятнадцать этапов, враги от уровня ' + STAGES[0].lvl + ' до ' + STAGES[14].lvl + '.', stages: STAGES }];

  const memoryReward = n => (n <= 5 ? { credits: 2500, items: { lucent: 20, exp2: 5 } } : { credits: 5000, items: { lucent: 40, exp3: 2, exp2: 3 } });
  const INSIGNIA = { jade: 200, credits: 5000, items: { feather: 80 } };

  const SHOP = {
    cones: { name: 'Пассаж Световых конусов', cur: 'lucent', rows: ['fermata', 'quid', 'wildfire', 'river', 'pastfuture', 'woof', 'breakfast'].map(id => ({ cone: id, price: 200 })) },
    jokes: { name: 'Шутки сбываются', cur: 'feather', rows: [
      { item: 'resin', price: 1200, lim: 1 },
      { item: 'exp3', price: 10, lim: 10 },
      { credits: 2500, price: 10, lim: 12 },
      { credits: 1250, price: 10, after: 2 }
    ] }
  };

  H.FH = { TUN, TURB, KINDS, STAGES, SERIES, SHOP, INSIGNIA, memoryReward, lvlOf };

  const cp = (u, fx, n) => (u && u.cone ? H.coneP(u, fx, n) : 0);
  const hasDot = (u, types) => u.dots.some(d => types.includes(d.type));
  const boundary = c => TUN.firstCycle + TUN.cycle * (c - 1);

  Object.assign(H.Battle.prototype, {
    memo(on, ctx) {
      if (on === 'start') this.memoStart();
      else if (on === 'tick') this.memoTick(ctx.d);
      else if (on === 'turn') this.memoTurn(ctx.u);
      else if (on === 'endTurn') this.memoEndTurn(ctx.u);
      else if (on === 'hurt') this.memoHurt(ctx.u);
      else if (on === 'down') { if (this.fh) this.fh.down++; }
      else if (on === 'kill') this.memoKill(ctx.src);
      else if (on === 'after') this.memoAfter(ctx.u, ctx.kind);
    },

    memoDmg(src, tgt, o) {
      if (src.side !== 'ally' || tgt.side !== 'enemy') return 0;
      let v = 0;
      if (hasDot(tgt, ['shock', 'shear', 'erode'])) v += cp(src, 'fermata', 2);
      if (hasDot(tgt, ['burn', 'bleed'])) v += cp(src, 'woof', 2);
      return v;
    },

    memoStart() {
      const o = this.opts.fh;
      if (o) {
        this.fh = { budget: o.budget, before: o.used || 0, t: 0, cyc: 1, down: 0, out: false, turb: o.turb || null, crit: 0 };
        for (const f of (this.fh.turb ? this.fh.turb.fx : [])) if (f.k === 'stat') for (const a of this.allies) a.buffs.push({ s: f.s, v: f.v, turns: 999, name: 'Турбулентность памяти', perm: true });
        this.fhCycle();
      }
      for (const a of this.livingAllies) {
        if (cp(a, 'wildfire', 2)) for (const b of this.livingAllies) { this.addBuff(b, { s: 'dr', v: cp(a, 'wildfire', 2), turns: cp(a, 'wildfire', 3), name: 'Слёзы на глазах' }, true); this.heal(a, b, (b.maxHp - b.hp) * cp(a, 'wildfire', 1)); }
        if (cp(a, 'river', 1)) this.riverOn(a);
      }
    },

    riverOn(a) {
      a.flags.river = 'on';
      a.buffs.push({ s: 'spdP', v: cp(a, 'river', 1), turns: 999, name: 'Избавление от холодов', perm: true }, { s: 'dmgP', v: cp(a, 'river', 2), turns: 999, name: 'Избавление от холодов', perm: true });
    },

    memoTick(d) {
      const F = this.fh;
      if (!F || this.over) return;
      F.t += d;
      while (F.t >= boundary(F.cyc) - 1e-9) {
        F.cyc++;
        if (F.before + F.cyc > F.budget) {
          F.out = true;
          this.push({ t: 'text', text: 'Циклы закончились. Воспоминание рассыпается.', warn: true });
          this.finish(false);
          return;
        }
        this.fhCycle();
      }
    },

    fhLeft() { const F = this.fh; return F ? Math.max(0, F.budget - F.before - F.cyc) : 0; },

    fhCycle() {
      const F = this.fh, used = F.before + F.cyc;
      this.push({ t: 'cycle', n: used, left: F.budget - used, budget: F.budget });
      for (const f of (F.turb ? F.turb.fx : [])) {
        const al = this.livingAllies;
        switch (f.k) {
          case 'sp': this.sp = Math.min(T.spMax, this.sp + f.v); this.push({ t: 'text', text: 'Турбулентность памяти: +' + f.v + ' очка навыка' }); break;
          case 'energy': for (const a of al) this.gainEnergy(a, f.v); break;
          case 'topAtk': { const a = al.slice().sort((x, y) => atkOf(y) - atkOf(x))[0]; if (a) this.addBuff(a, { s: 'dmgP', v: f.v, turns: 1, name: 'Турбулентность: урон' }); break; }
          case 'break': for (const a of al) this.addBuff(a, { s: 'breakEff', v: f.v, turns: 1, name: 'Турбулентность: пробитие' }, true); break;
          case 'crit': {
            F.crit = Math.min(f.max, F.crit + f.v);
            for (const a of al) { a.buffs = a.buffs.filter(b => b.name !== 'Турбулентность: крит'); a.buffs.push({ s: 'critR', v: F.crit, turns: 999, name: 'Турбулентность: крит', perm: true }); }
            break;
          }
          case 'healLow': { const a = al.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]; if (a) this.heal(null, a, a.maxHp * f.v); break; }
          case 'dmg': for (const a of al) this.addBuff(a, { s: 'dmgP', v: f.v, turns: 1, name: 'Турбулентность: урон' }, true); break;
          case 'shield': for (const a of al) this.giveShield(a, a.maxHp * f.v, 1); break;
          case 'critBoth': for (const a of al) { this.addBuff(a, { s: 'critR', v: f.r, turns: 1, name: 'Турбулентность: крит' }, true); this.addBuff(a, { s: 'critD', v: f.d, turns: 1, name: 'Турбулентность: крит. урон' }, true); } break;
          case 'vuln': for (const e of this.living) this.addBuff(e, { s: 'vuln', v: f.v, turns: 1, name: 'Турбулентность: уязвимость', debuff: true }, true); break;
        }
      }
    },

    memoTurn(u) {
      if (cp(u, 'quid', 2)) {
        const pool = this.livingAllies.filter(a => a !== u && a.energy < a.maxEnergy * cp(u, 'quid', 1));
        if (pool.length) this.gainEnergy(this.rng.pick(pool), cp(u, 'quid', 2));
      }
      const pf = this.pastFuture;
      if (pf && pf.from !== u) {
        this.pastFuture = null;
        this.addBuff(u, { s: 'dmgP', v: pf.v, turns: pf.turns, name: pf.name || 'Бумажные змеи из прошлого' });
      }
    },

    memoEndTurn(u) {
      if (u.flags && u.flags.river === 'off' && cp(u, 'river', 1) && alive(u)) this.riverOn(u);
    },

    memoHurt(u) {
      if (u.side === 'ally' && u.flags.river === 'on') {
        u.flags.river = 'off';
        u.buffs = u.buffs.filter(b => b.name !== 'Избавление от холодов');
      }
    },

    memoKill(src) {
      if (!cp(src, 'breakfast', 2)) return;
      src.flags.breakfast = Math.min(cp(src, 'breakfast', 3), (src.flags.breakfast || 0) + 1);
      src.buffs = src.buffs.filter(b => b.name !== 'Важность завтрака');
      src.buffs.push({ s: 'atkP', v: cp(src, 'breakfast', 2) * src.flags.breakfast, turns: 999, name: 'Важность завтрака', perm: true });
    },

    memoAfter(u, kind) {
      if (cp(u, 'pastfuture', 1) && kind === 'skill') this.pastFuture = { from: u, v: cp(u, 'pastfuture', 1), turns: cp(u, 'pastfuture', 2) };
    }
  });

  const dayNum = ms => { const d = new Date(ms - 4 * 3600000); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000); };

  Object.assign(H.Game.prototype, {
    fh() {
      const s = this.state;
      if (!s.fh) s.fh = { st: {}, got: [], team: {}, run: null, shop: { per: null, n: {} }, echo: { wk: null, n: 0 } };
      return s.fh;
    },

    fhOpen() { return !!this.state.flags.fh_met; },

    fhStage(n) { return STAGES[n - 1] || null; },

    fhRec(n) { return this.fh().st[n] || null; },

    fhStars(n) { const r = this.fhRec(n); return r ? r.stars.filter(Boolean).length : 0; },

    fhTotal() { return STAGES.reduce((a, st) => a + this.fhStars(st.n), 0); },

    fhUnlocked(n) { return n === 1 || !!(this.fhRec(n - 1) && this.fhRec(n - 1).clear); },

    fhWeak(st, node) { return st.rec[node].slice(); },

    fhTeam(n, node) {
      const F = this.fh(), st = this.fhStage(n), saved = F.team[n] && F.team[n][node];
      const keys = Object.keys(this.state.roster);
      if (saved) return saved.filter(k => keys.includes(k));
      const other = st.nodes.length > 1 ? (node === 0 ? [] : this.fhTeam(n, 0)) : [];
      const base = node === 0 ? this.state.party.slice(0, 4) : this.state.party.slice(4).concat(keys).filter(k => !other.includes(k));
      return [...new Set(base)].filter(k => keys.includes(k) && !other.includes(k)).slice(0, 4);
    },

    fhSetTeam(n, node, list) {
      const F = this.fh(), st = this.fhStage(n);
      if (!st) return false;
      const keys = Object.keys(this.state.roster);
      const clean = [...new Set(list)].filter(k => keys.includes(k)).slice(0, 4);
      const t = F.team[n] || (F.team[n] = st.nodes.map((_, i) => (i === node ? [] : this.fhTeam(n, i))));
      t[node] = clean;
      for (let i = 0; i < t.length; i++) if (i !== node) t[i] = (t[i] || []).filter(k => !clean.includes(k));
      return true;
    },

    fhReady(n) {
      const st = this.fhStage(n);
      return !!st && this.fhUnlocked(n) && st.nodes.every((_, i) => this.fhTeam(n, i).length > 0);
    },

    fhBegin(n) {
      if (!this.fhOpen() || !this.fhReady(n)) return false;
      const st = this.fhStage(n);
      this.fh().run = { n, node: 0, used: 0, down: 0, done: st.nodes.map(() => []) };
      return true;
    },

    fhRun() { return this.fh().run; },

    fhSpecs(keys) {
      return keys.map(k => {
        const r = this.state.roster[k], st = this.charStats(k), kit = H.CHARS[this.kitOf(k)];
        return { key: k, charId: this.kitOf(k), name: k === 'trail' ? this.state.name : undefined, lvl: r.lvl, stats: st, hp: st.hp, energy: Math.round(kit.energy * TUN.energyStart), cone: this.coneEffect(k), sets: this.planarSets(k), tr: this.traceSpec(k), eid: r.eid || 0 };
      });
    },

    fhLeft() {
      const run = this.fhRun(), st = run && this.fhStage(run.n);
      return st ? st.budget - run.used : 0;
    },

    fhFight(bi) {
      const run = this.fhRun();
      if (!run || this.battle) return null;
      const st = this.fhStage(run.n), node = st.nodes[run.node];
      if (bi == null) bi = node.findIndex((_, i) => !run.done[run.node].includes(i));
      if (bi < 0 || run.done[run.node].includes(bi) || !node[bi]) return null;
      const keys = this.fhTeam(run.n, run.node), b = node[bi];
      const techs = keys.map(k => ({ charId: this.kitOf(k), fx: H.CHARS[this.kitOf(k)].tech.fx }));
      return this.startBattle({
        waves: b.waves.map(w => w.map(id => id + ':' + st.lvl)), lvl: st.lvl, party: this.fhSpecs(keys), techs,
        noFlee: true, noContact: true, boss: false, bg: 'memory', music: b.music || 'order',
        foeHp: TUN.hp[st.n - 1], foeAtk: 1 + (st.n - 1) * TUN.atkRamp, fh: { budget: st.budget, used: run.used, turb: st.turb, n: run.n, node: run.node, bi }
      });
    },

    fhEndBattle(b, ctx, out) {
      const r = b.result, run = this.fhRun(), F = b.fh, info = ctx.o.fh;
      this.battle = null;
      out.fh = { n: info.n, node: info.node, bi: info.bi, cyc: F ? F.cyc : 0, down: F ? F.down : 0, out: !!(F && F.out) };
      if (!r.win) {
        this.battleCtx = Object.assign(ctx, { lost: true });
        out.lost = true;
        return out;
      }
      this.battleCtx = null;
      if (!run || run.n !== info.n) return out;
      run.used += F.cyc;
      run.down += F.down;
      run.done[info.node].push(info.bi);
      const st = this.fhStage(run.n);
      if (run.done[run.node].length < st.nodes[run.node].length) { out.fh.next = 'battle'; return out; }
      if (run.node < st.nodes.length - 1) { run.node++; out.fh.next = 'node'; return out; }
      out.fh.next = 'clear';
      out.fh.clear = this.fhClear(run);
      return out;
    },

    fhClear(run) {
      const F = this.fh(), st = this.fhStage(run.n), left = st.budget - run.used;
      const stars = [left >= st.goals[0], left >= st.goals[1], run.down <= 1];
      const rec = F.st[run.n] || (F.st[run.n] = { clear: false, stars: [false, false, false], best: 0 });
      const first = !rec.clear;
      const was = rec.stars.slice();
      rec.clear = true;
      rec.stars = rec.stars.map((v, i) => v || stars[i]);
      rec.best = Math.max(rec.best || 0, left);
      const got = first ? this.give(memoryReward(run.n)) : [];
      F.run = null;
      if (this.state.quests.fh_lights === 'hall') this.setQuest('fh_lights', 'back');
      return { n: run.n, left, used: run.used, down: run.down, stars, fresh: rec.stars.map((v, i) => v && !was[i]), first, got };
    },

    fhRetry() {
      const ctx = this.battleCtx;
      if (!ctx || !ctx.o || !ctx.o.fh) return false;
      this.battleCtx = null;
      this.startBattle(ctx.o);
      return true;
    },

    fhAbort() {
      this.fh().run = null;
      this.battleCtx = null;
      this.battle = null;
      return true;
    },

    fhTiers() {
      const F = this.fh(), total = this.fhTotal(), n = Math.floor(STAGES.length * 3 / TUN.insignia);
      return Array.from({ length: n }, (_, i) => ({ i: i + 1, need: (i + 1) * TUN.insignia, ready: total >= (i + 1) * TUN.insignia, got: F.got.includes(i + 1) }));
    },

    fhClaim(i) {
      const t = this.fhTiers().find(x => x.i === i);
      if (!t || !t.ready || t.got) return null;
      this.fh().got.push(i);
      return this.give(INSIGNIA);
    },

    fhClaimAll() {
      const out = [];
      for (const t of this.fhTiers()) if (t.ready && !t.got) out.push(...this.fhClaim(t.i));
      return out;
    },

    fhAlert() { return this.fhOpen() && this.fhTiers().some(t => t.ready && !t.got); },

    fhShopLeft() { const d = dayNum(this.now()); return (Math.floor(d / TUN.shopDays) + 1) * TUN.shopDays - d; },

    fhEchoUsed() { const ec = this.fh().echo, wk = Math.floor((dayNum(this.now()) + 3) / 7); return ec.wk === wk ? ec.n : 0; },

    fhShopSync() {
      const S = this.fh().shop, per = Math.floor(dayNum(this.now()) / TUN.shopDays);
      if (S.per !== per) { S.per = per; S.n = {}; }
      return S;
    },

    fhShop(tab) {
      const sh = SHOP[tab], S = this.fhShopSync(), have = this.state.inv.items[sh.cur] || 0;
      return sh.rows.map((row, i) => {
        const bought = S.n[tab + i] || 0, left = row.lim ? row.lim - bought : Infinity;
        const hidden = row.after != null && (S.n[tab + row.after] || 0) < (sh.rows[row.after].lim || 0);
        const name = row.cone ? H.CONES[row.cone].name : row.item ? H.ITEMS[row.item].name : 'Кредиты ×' + H.fmt(row.credits);
        return { i, row, name, price: row.price, cur: sh.cur, left, lim: row.lim || 0, hidden, afford: have >= row.price && left > 0, own: row.cone ? this.fhConeOwned(row.cone) : row.item ? this.state.inv.items[row.item] || 0 : 0 };
      }).filter(r => !r.hidden);
    },

    fhConeOwned(id) { const c = this.state.inv.cones.filter(x => x.id === id); return c.length ? Math.max(...c.map(x => x.sup || 1)) : 0; },

    fhBuy(tab, i, n = 1) {
      const sh = SHOP[tab], row = sh.rows[i], s = this.state, S = this.fhShopSync();
      if (!row) return null;
      const list = this.fhShop(tab).find(r => r.i === i);
      if (!list) return null;
      n = Math.max(1, Math.min(n, list.left));
      const cost = row.price * n;
      if ((s.inv.items[sh.cur] || 0) < cost) return null;
      this.take({ items: { [sh.cur]: cost } });
      S.n[tab + i] = (S.n[tab + i] || 0) + n;
      const out = [];
      for (let k = 0; k < n; k++) {
        if (row.cone) { this.addCone(row.cone); out.push('конус «' + H.CONES[row.cone].name + '»'); }
        else if (row.item) out.push(...this.give({ items: { [row.item]: 1 } }));
        else out.push(...this.give({ credits: row.credits }));
      }
      return out;
    },

    fhEchoLucent() {
      if (!this.fhOpen()) return [];
      const ec = this.fh().echo, wk = Math.floor((dayNum(this.now()) + 3) / 7);
      if (ec.wk !== wk) { ec.wk = wk; ec.n = 0; }
      if (ec.n >= TUN.echoWeek) return [];
      ec.n++;
      return this.give({ items: { lucent: TUN.echoLucent } });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
