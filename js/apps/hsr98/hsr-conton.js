(function (H) {
  'use strict';
  const T = H.TUNING, AV = T.avBase;
  const { atkOf, defOf, alive } = H.battleStat;

  const SHINY = 'Блестяшки';
  const SIG = 'Сигнатура';
  const SHACKLE = 'Оковы';
  const POSE = 'Все смотрят';

  const KITS = {
    makoto: {
      name: 'Макото', fullName: 'Макото Майн', path: 'hunt', elem: 'imag', rarity: 5, energy: 120, faction: 'conton',
      base: { hp: 130, atk: 93, def: 54, spd: 110 },
      look: { skin: '#feddd0', hair: '#7a3c33', hairHi: '#a85e4e', eye: '#5a5ab8', eye2: '#9a9ae8', bangs: 'blunt', sides: 'long', back: 'hime', crown: 'smooth', gloss: true, body: 'f', coat: 'suit', top: '#6d173a', trim: '#fb2894', inner: '#51192e', neon: '#fb2894', neon2: '#5ae8f8', collar: 'high', neck: '#51192e', lower: '#5e1634', low: 'pants', shoes: '#3a1020', gloves: '#51192e', acc: ['catband:#6d173a', 'neon:#fb2894', 'glowcuff:#5ae8f8', 'hipblade:#ff8ac8', 'ankle:#3a1020', 'soles:#5ae8f8'] },
      studentLook: { skin: '#feddd0', hair: '#7a3c33', hairHi: '#a85e4e', eye: '#5a5ab8', eye2: '#9a9ae8', bangs: 'blunt', sides: 'long', back: 'hime', crown: 'smooth', gloss: true, body: 'f', coat: 'shirt', collar: 'shirt', top: '#f6f6fa', inner: '#f6f6fa', trim: '#e4e4ec', lower: '#ab2f3f', low: 'skirt', skirtLen: 9, plaidHi: '#ce626e', shoes: '#6a3a26', acc: ['glasses:#b73641', 'tie:#b73641', 'plaid:#882230', 'socks:#24202a'] },
      basic: { name: 'Выстрел с бедра', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Ловкость рук', target: 'single', text: 'мнимый урон ' + Math.round(T.mkSkill * 100) + '%. Крадёт 15% хода цели (у босса 8%), Макото ходит раньше на столько же. +1 Блестяшка.', fx: [{ k: 'dmg', m: T.mkSkill }, { k: 'mkSteal' }] },
      ult: { name: 'Прыжок между мирами', target: 'self', text: 'уходит в портал, ход на 50% раньше. В начале хода бьёт врага с наибольшим HP: 320% + 40% за Блестяшку, точно крит. Лишний урон уходит следующему.', fx: [{ k: 'portal' }] },
      talent: 'Урон +20% по врагу с наибольшим HP. Блестяшки (до 3): крит. урон +12% каждая.',
      tech: { name: 'Щит от сканеров', text: 'Бой начинается с 2 Блестяшками, первый ход Макото на 25% раньше.', fx: 'makotoTech' },
      contact: [{ name: 'Свернуться котёнком', tag: 'cute' }, { name: 'Спросить о неправильной жизни', tag: 'weird' }]
    },
    amanda: {
      name: 'Аманда', fullName: 'Аманда Миллер', path: 'preservation', elem: 'wind', rarity: 5, energy: 120, faction: 'conton',
      base: { hp: 178, atk: 76, def: 92, spd: 97 },
      look: { skin: '#feebd7', hair: '#e8c483', hairHi: '#f8e4b0', eye: '#2e9a4a', eye2: '#7ad88a', bangs: 'sweep', sides: 'jaw', back: 'short', crown: 'smooth', gloss: true, body: 'f', coat: 'raglan', top: '#f4f4f8', sleeve: '#304158', trim: '#304158', inner: '#f4f4f8', lower: '#82a1c3', low: 'pants', shoes: '#1e1e24', acc: ['magia:#f0509a', 'flare', 'soles:#f2f2f4', 'bangles:#3aa85a'] },
      pinkLook: { skin: '#feebd7', hair: '#f2d494', hairHi: '#fff0c8', eye: '#2e9a4a', eye2: '#7ad88a', bangs: 'sweep', sides: 'long', back: 'flow', crown: 'smooth', gloss: true, body: 'f', coat: 'heartcorset', top: '#fbf6f8', trim: '#c5883d', inner: '#fbf6f8', bow: '#e8508e', cuffCol: '#ff7ab8', lower: '#e26396', low: 'skirt', skirtLen: 9, petti: '#f5ced2', gloves: '#f2e0ec', shoes: '#d8a848', acc: ['heartbow:#ff7ab8', 'heartchoker:#e8508e', 'longgloves', 'heartcuff:#ff7ab8', 'stockings:#f8f2f6', 'stockbow:#ff7ab8', 'ruffle3:#f5ced2', 'wingheel:#fbf6f8', 'heartwand:#ff9ac8'] },
      lanternLook: { skin: '#feebd7', hair: '#e8c483', hairHi: '#f8e4b0', eye: '#2e9a4a', eye2: '#7ad88a', bangs: 'sweep', sides: 'jaw', back: 'short', crown: 'smooth', gloss: true, body: 'f', coat: 'suit', top: '#2a9a4a', trim: '#1e6a34', inner: '#16161c', neon: '#1e6a34', neon2: '#1e6a34', collar: 'high', neck: '#16161c', lower: '#2a9a4a', low: 'pants', shoes: '#16161c', gloves: '#f4f4f8', acc: ['domino:#2a9a4a', 'yoke:#16161c', 'lantern', 'ankle:#16161c'] },
      basic: { name: 'Подзатыльник', target: 'single', text: 'физический урон 90%.', fx: [{ k: 'dmg', m: 0.9, e: 'phys' }] },
      skill: { name: 'Превращение', target: 'self', keepTurn: true, text: 'Розовая Защитница до конца боя, Кокон-сердце себе. Ход продолжается.', fx: [{ k: 'amTransform' }, { k: 'shield', m: T.amCocoon, flat: T.amCocoonFlat, turns: T.amCocoonTurns, cocoon: true }] },
      pbasic: { name: 'Сердечный… луч!', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      pskill: { name: 'Кокон-сердце', target: 'ally', text: 'щит 45% защиты Аманды на 3 хода. Лопнув от удара, бьёт всех врагов ветром на 60% защиты.', fx: [{ k: 'shield', m: T.amCocoon, flat: T.amCocoonFlat, turns: T.amCocoonTurns, cocoon: true }] },
      ult: { name: 'Любовь восторжествует', target: 'allies', text: 'превращение, Кокон-сердце всем на 2 хода. Поза: Аманда притягивает удары, защита +30%.', fx: [{ k: 'amTransform' }, { k: 'shield', who: 'allies', m: T.amUltCocoon, flat: T.amUltFlat, turns: T.amUltTurns, cocoon: true }, { k: 'taunt', turns: T.amPoseTurns, who: 'self' }, { k: 'buff', s: 'defP', v: T.amPoseDef, turns: T.amPoseTurns, who: 'self', name: POSE }] },
      talent: 'Бой начинает в обычной форме. При HP союзника ниже 30% превращается и даёт ему Кокон.',
      tech: { name: 'Звонок с работы', text: 'Аманда приходит в бой уже Розовой Защитницей, с Коконом-сердцем на себе.', fx: 'amandaTech' },
      contact: [{ name: 'Блин блинский!', tag: 'joke' }, { name: 'Земля под моей юрисдикцией', tag: 'threat' }]
    },
    talleah: {
      name: 'Таллея', fullName: 'Таллея из Авии', path: 'remembrance', elem: 'quant', rarity: 5, energy: 120, faction: 'conton',
      base: { hp: 138, atk: 90, def: 60, spd: 102 },
      look: { skin: '#bdd6f3', hair: '#eaf2ff', hairHi: '#ffffff', eye: '#2a6ae0', eye2: '#7ab4ff', bigEyes: true, bangs: 'wisp', sides: 'long', back: 'wave', crown: 'smooth', gloss: true, body: 'tallf', coat: 'avia', top: '#16355b', trim: '#e2e8f8', inner: '#16355b', inset: '#6792c4', plate: '#e2e8f8', plateSh: '#c0d0ee', legs: null, shoes: '#e2e8f8', gloves: '#bdd6f3', bootsTo: 'calf', acc: ['gemcollar:#4a90e0', 'plates:#e2e8f8', 'boots:#e2e8f8', 'bootband:#22385e', 'circlet:#c0d0ee'] },
      rangerLook: { skin: '#bdd6f3', hair: '#eaf2ff', hairHi: '#ffffff', eye: '#2a6ae0', eye2: '#7ab4ff', bigEyes: true, bangs: 'wisp', sides: 'long', back: 'wave', crown: 'smooth', gloss: true, body: 'tallf', coat: 'ranger', top: '#eef2f8', trim: '#6792c4', inner: '#d8e0ee', lower: '#eef2f8', low: 'pants', shoes: '#c8d0e0', gloves: '#c8d0e0', acc: ['bubble:#c8ecff', 'backpack:#c8d0e0', 'boots:#c8d0e0'] },
      basic: { name: 'Ретро-бластер', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Арест!', target: 'single', text: 'квантовый урон 160%. Сигнатура и Оковы на 2 действия цели. Гиноиды ходят сразу.', fx: [{ k: 'dmg', m: 1.6 }, { k: 'arrest' }] },
      ult: { name: 'Excelsior!', target: 'all', text: 'урон 120% всем, Оковы каждому на 1 действие. Отряд из пяти: 2 хода гиноиды бьют всех.', fx: [{ k: 'dmg', m: 1.2 }, { k: 'shackleAll', n: 1 }, { k: 'squad' }] },
      talent: 'Гиноиды ходят на шкале и бьют цель с Сигнатурой. Раз за бой капсула спасает Таллею от смерти.',
      tech: { name: 'Маскировочный костюм', text: 'Враг с наибольшим HP начинает бой с Сигнатурой и Оковами, гиноиды ходят первыми.', fx: 'talleahTech' },
      contact: [{ name: 'Арестовать во имя правосудия', tag: 'threat' }, { name: 'Гостеприимство Авии', tag: 'kind' }]
    }
  };

  const FUSIONS = {
    f_ccc3: { name: 'Втроём веселее', members: ['makoto', 'amanda', 'talleah'], target: 'all', text: 'Три луча над сценой: урон трёх стихий всем, Оковы врагам, Кокон-сердце отряду.', fx: [{ k: 'dmg', m: 1.2, e: 'imag', tough: 15, statOf: 'makoto' }, { k: 'dmg', m: 1.2, e: 'wind', tough: 15, statOf: 'amanda' }, { k: 'dmg', m: 1.2, e: 'quant', tough: 15, statOf: 'talleah' }, { k: 'shackleAll', n: 1, statOf: 'talleah' }, { k: 'shield', who: 'allies', m: 0.25, flat: 30, turns: 2, cocoon: true, statOf: 'amanda' }, { k: 'applause' }] },
    f_duel: { name: 'Мексиканская дуэль', members: ['makoto', 'talleah'], target: 'blast', text: 'Дуэль на двоих: урон по цели и соседям, кража 25% хода и Оковы на цель.', fx: [{ k: 'dmg', m: 1.6, e: 'imag', adj: 0.6, statOf: 'makoto' }, { k: 'dmg', m: 1.6, e: 'quant', adj: 0.6, statOf: 'talleah' }, { k: 'mkSteal', v: 0.25, statOf: 'makoto' }, { k: 'shackle', n: 2, statOf: 'talleah' }] },
    f_started: { name: 'Она первая начала!', members: ['amanda', 'talleah'], target: 'all', text: 'Сначала друг в друга, потом по врагам: урон всем, Оковы и Кокон-сердце обеим.', fx: [{ k: 'dmg', m: 1.0, e: 'wind', statOf: 'amanda' }, { k: 'dmg', m: 1.0, e: 'quant', statOf: 'talleah' }, { k: 'shackleAll', n: 1, statOf: 'talleah' }, { k: 'shield', who: 'member:amanda', m: 0.3, flat: 40, turns: 2, cocoon: true, statOf: 'amanda' }, { k: 'shield', who: 'member:talleah', m: 0.3, flat: 40, turns: 2, cocoon: true, statOf: 'amanda' }] },
    f_shut: { name: 'Захлопни хлеборезку', members: ['amanda', 'makoto'], target: 'single', text: 'Аманда прикрывает, Макото крадёт: урон 260%, Кокон-сердце на Макото, +2 Блестяшки.', fx: [{ k: 'dmg', m: 2.6, e: 'imag', tough: 30, statOf: 'makoto' }, { k: 'shield', who: 'member:makoto', m: T.amCocoon, flat: T.amCocoonFlat, turns: T.amCocoonTurns, cocoon: true, statOf: 'amanda' }, { k: 'shiny', v: 2 }] }
  };

  const CONES = {
    cccletter: {
      name: 'С любовью, Макото', path: 'hunt', rarity: 5, own: true, stats: { hp: 48, atk: 26.4, def: 21 }, skill: 'Я найду тебя', sig: 'makoto',
      tpl: 'Крит. урон владельца повышается на #1%. После «Ловкости рук» урон владельца повышается на #2% на 2 хода. «Самая большая блестяшка» игнорирует #3% защиты.', p: [[0.36, 0.24, 0.15], [0.42, 0.28, 0.175], [0.48, 0.32, 0.2], [0.54, 0.36, 0.225], [0.6, 0.4, 0.25]], bonus: { critD: 1 }, fx: 'cccletter',
      desc: '«Мой дорогой Джейкоб. Мне очень жаль, что тебе пришлось увидеть всё, что случилось внизу. Я хотела рассказать сама».\n«Мне меньше всего хочется, чтобы ты перестал со мной разговаривать».\n«Если захочешь меня найти, иди на фуд-корт. Я найду тебя, когда ты придёшь».\n«С любовью, Макото».'
    },
    cccmagic: {
      name: 'Настоящая магия', path: 'preservation', rarity: 5, own: true, stats: { hp: 48, atk: 21.6, def: 27 }, skill: 'Маленький город', sig: 'amanda',
      tpl: 'Защита владельца повышается на #1%. Кокон-сердце владельца крепче на #2%. Когда кокон лопается, союзник под ним получает урон +#3% на 2 хода.', p: [[0.24, 0.18, 0.18], [0.28, 0.21, 0.21], [0.32, 0.24, 0.24], [0.36, 0.27, 0.27], [0.4, 0.3, 0.3]], bonus: { defP: 1 }, fx: 'cccmagic',
      desc: 'Это был её первый конвент. Отец взял их с собой на свою старую «Звёздную Дорогу».\nЕй было всё равно, кто там капитан и куда летит корабль. Она смотрела на людей в костюмах: они построили маленький городок только для себя.\nТам можно было быть собой. Или кем-то другим. Неважно кем.\nМного лет спустя ей сказали: «Да, это настоящая магия».'
    },
    cccpratia: {
      name: 'Фиолетовые небеса Пратии', path: 'remembrance', rarity: 5, own: true, stats: { hp: 48, atk: 26.4, def: 21 }, skill: 'Заступница', sig: 'talleah',
      tpl: 'Атака владельца повышается на #1%. Урон гиноидов повышается на #2%. Когда Сигнатура переходит, Таллея получает #3 энергии.', p: [[0.24, 0.3, 10], [0.28, 0.35, 11.25], [0.32, 0.4, 12.5], [0.36, 0.45, 13.75], [0.4, 0.5, 15]], bonus: { atkP: 1 }, fx: 'cccpratia',
      desc: 'Прапрабабка Самара гонялась за преступниками по всей галактике. Её истории на Авии читают детям, и Таллея знала их наизусть.\nМалахия Лысая. Ария Тёмная Песнь. Фаррангис Завоевательница Любви.\nВойна на Авии почти ничего не значила, природа значила больше. Поэтому героев в книгах было мало, и каждого берегли.\n«Однажды я покажу тебе фиолетовые небеса над Пратией. Даю слово».'
    },
    cccgorilla: {
      name: 'Портрет гориллы', path: 'nihility', rarity: 4, own: true, stats: { hp: 43.2, atk: 21.6, def: 15 }, skill: 'Гляделки',
      tpl: 'Шанс эффекта владельца повышается на #1%. В начале боя враг с наибольшим HP оказывается «Под присмотром»: урон по нему повышается на #2% на 3 хода.', p: [[0.16, 0.12], [0.2, 0.15], [0.24, 0.18], [0.28, 0.21], [0.32, 0.24]], bonus: { ehr: 1 }, fx: 'cccgorilla',
      desc: 'В номере 302 две кровати, шкаф и портрет гориллы.\nГлаза у гориллы следят за тобой, куда ни отойди.\nАманда в дверях только хмыкает: «Ну, я видела фигню и пострашнее. Меня теперь не так просто испугать».\nГорилла не моргает.'
    },
    cccbadge: {
      name: 'Бейдж? Есть.', path: 'harmony', rarity: 4, own: true, stats: { hp: 43.2, atk: 21.6, def: 15 }, skill: 'Готов?',
      tpl: 'Восстановление энергии владельца повышается на #1%. В начале боя союзник с наименьшей энергией получает #2 энергии.', p: [[0.08, 10], [0.1, 12.5], [0.12, 15], [0.14, 17.5], [0.16, 20]], bonus: { err: 1 }, fx: 'cccbadge',
      desc: 'Бейдж? Есть. Костюмы? Есть. Еда, чтобы не переплачивать на фуд-корте? Есть и есть.\n«Скажи мне, что в этот раз ты не забыл бейдж».\nАвтобус останавливается у отеля.\n«Готов?» Она встаёт и протягивает руку.'
    },
    cccstandee: {
      name: 'Картонный злодей', path: 'destruction', rarity: 4, own: true, stats: { hp: 43.2, atk: 21.6, def: 15 }, skill: 'Тогда живи',
      tpl: 'Атака владельца повышается на #1%. Урон владельца по врагам, у которых больше 80% HP, повышается на #2%.', p: [[0.16, 0.24], [0.2, 0.3], [0.24, 0.36], [0.28, 0.42], [0.32, 0.48]], bonus: { atkP: 1 }, fx: 'cccstandee',
      desc: '«Скоро увидимся, человек. Я была отличницей на уроках разведки и маскировки».\nЧерез три шага принцесса Авии врезается в картонного Паноса и роняет его на пол.\nБластер уже у неё в руке.\n«НЕ ДУМАЙ, ЧТО ТАК ПРОСТО ЗАСТАНЕШЬ ПРИНЦЕССУ АВИИ ВРАСПЛОХ…»\n«А, ты просто украшение. Тогда живи».'
    }
  };

  const FX = ['mkSteal', 'portal', 'shiny', 'amTransform', 'arrest', 'shackle', 'shackleAll', 'squad', 'applause'];
  const IDS = Object.keys(KITS);

  const coneK = (u, fx, n) => (u && u.cone ? H.coneP(u, fx, n) : 0);
  const ally = (b, id) => b.allies.find(a => a.charId === id && alive(a)) || null;
  const biggest = list => (list.length ? list.reduce((a, b) => (b.hp > a.hp ? b : a)) : null);

  Object.assign(H.Battle.prototype, {
    contonStart() {
      this.ccPops = [];
      this.ccSig = null;
      for (const a of this.allies) {
        if (a.charId === 'makoto') a.flags.shiny = 0;
        if (a.charId === 'amanda') a.flags.pink = false;
        if (a.charId === 'talleah' && alive(a)) this.gynoidsIn(a);
      }
      for (const a of this.livingAllies) {
        const g = coneK(a, 'cccgorilla', 2), t = biggest(this.living);
        if (g && t) this.addBuff(t, { s: 'vuln', v: g, turns: 3, name: 'Под присмотром', debuff: true });
        const bd = coneK(a, 'cccbadge', 2), low = this.livingAllies.reduce((x, y) => (y.energy / y.maxEnergy < x.energy / x.maxEnergy ? y : x));
        if (bd) this.gainEnergy(low, bd);
      }
    },

    gynoidsIn(owner) {
      const h = {
        side: 'ally', summon: true, idx: owner.idx, id: 'gynoids', charId: 'gynoids', key: 'gynoids', owner, name: 'Гиноиды', lvl: owner.lvl, elem: 'quant', path: owner.path,
        base: { spd: T.gynoidSpd }, maxHp: 1, hp: 1, buffs: [], dots: [], shield: 0, shieldT: 0, frozen: 0, stun: 0, taunt: 0, dead: false, gone: false, av: AV / T.gynoidSpd, flags: { squad: 0 }, appear: true
      };
      this.summons.push(h);
      this.push({ t: 'gynoids', u: h, owner, on: true });
    },

    gynoids() { return this.summons.filter(h => h.id === 'gynoids' && alive(h)); },

    contonLeave(h) {
      if (h.gone) return;
      h.gone = true;
      this.summons = this.summons.filter(s => s !== h);
      this.push({ t: 'gynoids', u: h, owner: h.owner, on: false });
      this.push(this.orderSnap(this.current));
    },

    contonSummon(h) {
      const u = h.owner;
      if (!u || u.dead) { this.contonLeave(h); return; }
      this.acting = h;
      this.hitThisAction = new Set();
      this.actSerial = (this.actSerial || 0) + 1;
      let t = this.ccSig && alive(this.ccSig) ? this.ccSig : null;
      if (!t) { t = biggest(this.living); if (t) this.setSig(t); }
      const squad = h.flags.squad > 0;
      this.push({ t: 'act', u: h, name: squad ? 'Отряд из пяти' : 'Тупая железяка: расчёт', kind: 'summon' });
      const list = squad ? this.living.slice() : t ? [t] : [];
      const o = { e: 'quant', kind: 'gynoid', side: 'gynoid', tough: squad ? 5 : 10, label: 'Гиноиды', extraBonus: coneK(u, 'cccpratia', 2) };
      for (const x of list) if (alive(x)) this.hit(u, x, T.tlGynoid * (this.traceTalent ? this.traceTalent(u) : 1) * (squad ? T.tlSquad : 1), o);
      if (this.kitFx && list.length) this.kitFx(u, 'gynoidHit');
      if (squad) h.flags.squad--;
      this.acting = null;
      this.cleanup();
      if (this.over) return;
      h.av = AV / Math.max(10, T.gynoidSpd * (1 + ((this.kitFx && this.kitFx(u, 'gynoidSpd')) || 0)));
    },

    setSig(t) {
      if (!alive(t) || t.side !== 'enemy') return;
      for (const e of this.enemies) if (e !== t) e.buffs = e.buffs.filter(b => b.name !== SIG);
      this.ccSig = t;
      const tl = ally(this, 'talleah');
      this.addBuff(t, { s: 'vuln', v: T.tlMark + ((tl && (this.kitFx && this.kitFx(tl, 'sigUp'))) || 0), turns: 999, name: SIG, debuff: true }, true);
      this.push({ t: 'mark', u: t, text: SIG });
    },

    shackle(src, t, n) {
      if (!alive(t) || t.side !== 'enemy' || !src) return;
      const cur = t.flags.shackle;
      const left = Math.max(cur ? cur.n : 0, n + ((src.charId === 'talleah' && (this.kitFx && this.kitFx(src, 'shackleMore'))) || 0));
      t.flags.shackle = { src, n: left };
      t.buffs = t.buffs.filter(b => b.name !== SHACKLE);
      t.buffs.push({ s: 'shackle', v: left, turns: 999, name: SHACKLE, debuff: true });
      this.push({ t: 'shackle', u: t, n: left });
    },

    contonEnemy(u) {
      u.flags.stolen = 0;
      const sh = u.flags.shackle;
      if (!sh || !alive(u)) return;
      this.hit(sh.src, u, T.tlShackle, { e: 'quant', tough: T.tlShackleTough, anyTough: true, kind: 'follow', label: SHACKLE });
      sh.n--;
      if (sh.n <= 0 || !alive(u)) { delete u.flags.shackle; u.buffs = u.buffs.filter(b => b.name !== SHACKLE); }
      else { const b = u.buffs.find(x => x.name === SHACKLE); if (b) b.v = sh.n; }
      this.push({ t: 'shackle', u, n: sh.n > 0 ? sh.n : 0, tick: true });
    },

    setShiny(u, v) {
      if (!u || u.charId !== 'makoto') return;
      const before = u.flags.shiny || 0;
      u.flags.shiny = Math.max(0, Math.min(u.flags.shinyMax || T.mkShinyMax, v));
      u.buffs = u.buffs.filter(b => b.name !== SHINY);
      if (u.flags.shiny > 0) u.buffs.push({ s: 'critD', v: Math.round(T.mkShiny * (this.traceTalent ? this.traceTalent(u) : 1) * u.flags.shiny * 1000) / 1000, turns: 999, name: SHINY });
      if (u.flags.shiny !== before) this.push({ t: 'shiny', u, v: u.flags.shiny, add: u.flags.shiny - before });
    },

    stealTime(u, t, v) {
      if (!alive(t) || t.side !== 'enemy' || !u) return 0;
      let amt = v || T.mkSteal;
      if (t.data && t.data.boss) amt *= T.mkStealBoss / T.mkSteal;
      amt = Math.min(amt, Math.max(0, T.mkStealCap - (t.flags.stolen || 0)));
      if (amt <= 1e-6) { this.push({ t: 'status', u: t, text: 'Больше не украсть', debuff: true }); return 0; }
      t.flags.stolen = (t.flags.stolen || 0) + amt;
      this.delay(t, amt);
      if (alive(u)) {
        if (this.current === u) u.flags.advanceAfter = (u.flags.advanceAfter || 0) + amt;
        else this.advance(u, amt);
      }
      this.push({ t: 'steal', u, from: t, v: amt, text: '−' + Math.round(amt * 100) + '% хода' });
      this.setShiny(u, (u.flags.shiny || 0) + 1);
      return amt;
    },

    applause(src) {
      for (const a of this.livingAllies) this.gainEnergy(a, T.cccApplause);
      this.push({ t: 'applause', u: src, v: T.cccApplause, text: 'Аплодисменты!' });
    },

    transform(a, quiet) {
      if (!alive(a) || a.charId !== 'amanda' || a.flags.pink) return false;
      a.flags.pink = true;
      this.push({ t: 'ccForm', u: a, on: true });
      this.push({ t: 'status', u: a, text: 'Розовая Защитница', col: '#ff8ac8' });
      if (!quiet) this.applause(a);
      if (this.kitFx) this.kitFx(a, 'transformed');
      return true;
    },

    cocoon(src, a, m, flat, turns) {
      if (!alive(a)) return;
      this.giveShield(a, (defOf(src) * m + flat * H.grow(src.lvl)) * (1 + coneK(src, 'cccmagic', 2)) * (1 + ((this.kitFx && this.kitFx(src, 'cocoonUp')) || 0)), turns);
      if (a.shield > 0) { a.flags.cocoon = src; if (this.kitFx) this.kitFx(src, 'cocooned', a); }
    },

    contonPop(tgt) {
      this.ccPops.push({ by: tgt.flags.cocoon, at: tgt });
      tgt.flags.cocoon = null;
    },

    contonCleanup() {
      if (this.ccBusy) return;
      this.ccBusy = true;
      while (this.ccPops.length && !this.over) {
        const { by, at } = this.ccPops.shift();
        const foes = this.living.slice();
        if (!foes.length || !by) continue;
        const prev = this.acting;
        this.acting = by;
        this.push({ t: 'act', u: by, name: 'Кокон лопнул!', kind: 'follow', burst: at });
        for (const e of foes) if (alive(e)) this.hit(by, e, T.amBurst * (this.traceTalent ? this.traceTalent(by) : 1), { stat: 'def', e: 'wind', tough: T.amBurstTough, kind: 'follow', label: 'Кокон-сердце' });
        if (this.kitFx) this.kitFx(by, 'popped', at);
        const mg = coneK(by, 'cccmagic', 3);
        if (mg && alive(at)) this.addBuff(at, { s: 'dmgP', v: mg, turns: 2, name: 'Маленький город' });
        this.acting = prev;
      }
      this.ccBusy = false;
    },

    contonHurt(tgt) {
      if (this.over || !alive(tgt) || tgt.hp >= tgt.maxHp * T.amCall) return;
      const am = this.allies.find(a => a.charId === 'amanda' && alive(a) && !a.flags.pink && !a.flags.away);
      if (!am) return;
      const prev = this.acting;
      this.acting = am;
      this.push({ t: 'act', u: am, name: 'Зов Защитницы', kind: 'follow', call: true });
      this.transform(am);
      this.cocoon(am, tgt, T.amCocoon * (this.traceTalent ? this.traceTalent(am) : 1), T.amCocoonFlat * (this.traceTalent ? this.traceTalent(am) : 1), T.amCocoonTurns);
      this.acting = prev;
    },

    contonSave(tgt) {
      if (tgt.side !== 'ally' || tgt.charId !== 'talleah' || tgt.flags.capsuleUsed) return false;
      tgt.flags.capsuleUsed = true;
      tgt.hp = 1;
      tgt.dots = [];
      tgt.buffs = tgt.buffs.filter(b => !b.debuff);
      tgt.shield = 0; tgt.shieldT = 0; tgt.taunt = 0; tgt.frozen = 0; tgt.stun = 0;
      tgt.flags.cocoon = null;
      tgt.flags.away = 'capsule';
      tgt.av = T.tlCapsuleAv;
      this.push({ t: 'capsule', u: tgt, on: true, text: 'На корабле' });
      this.push(this.orderSnap(this.current));
      return true;
    },

    contonKill(tgt) {
      if (this.ccSig !== tgt) return;
      this.ccSig = null;
      const next = biggest(this.living);
      if (!next) return;
      this.setSig(next);
      for (const h of this.gynoids()) this.advance(h, T.tlJump);
      const tl = ally(this, 'talleah'), k = coneK(tl, 'cccpratia', 3);
      if (tl && k) this.gainEnergy(tl, k);
    },

    contonBreak(src, tgt) {
      if (src && src.charId === 'makoto' && src.side === 'ally') this.setShiny(src, (src.flags.shiny || 0) + 1);
    },

    contonTurn(u) {
      if (u.flags.away === 'capsule') {
        u.flags.away = null;
        const hp = Math.round(u.maxHp * (T.tlCapsuleHp + ((this.kitFx && this.kitFx(u, 'capsuleUp')) || 0)));
        if (u.hp < hp) u.hp = hp;
        this.push({ t: 'capsule', u, on: false, text: 'Снова в строю', hp: u.hp });
        this.push({ t: 'heal', u, v: 0, hp: u.hp });
        return null;
      }
      if (u.flags.away === 'portal') {
        this.mkReturn(u);
        if (this.over) return 'dead';
      }
      return null;
    },

    mkReturn(u) {
      u.flags.away = null;
      this.push({ t: 'back', u });
      const t = biggest(this.living);
      if (!t) return;
      const n = u.flags.shiny || 0, letter = coneK(u, 'cccletter', 3);
      this.acting = u;
      this.hitThisAction = new Set();
      this.actSerial = (this.actSerial || 0) + 1;
      this.push({ t: 'act', u, name: 'Самая большая блестяшка', kind: 'follow', heist: true });
      if (letter) u.buffs.push({ s: 'defIgnore', v: letter, turns: 999, name: 'Я найду тебя: защита' });
      const hp0 = t.hp + t.shield;
      const dealt = this.hit(u, t, (T.mkHeist + T.mkHeistPer * n) * ((this.kitFx && this.kitFx(u, 'heistM')) || 1), { kind: 'ult', e: 'imag', tough: 30, alwaysCrit: true, defIgnore: (this.kitFx && this.kitFx(u, 'heistDef')) || 0, label: 'Самая большая блестяшка' });
      const next = !alive(t) && dealt > hp0 ? biggest(this.living) : null;
      if (next) this.hit(u, next, 0, { raw: (dealt - hp0) * T.mkSpill, e: 'imag', kind: 'ult', label: 'Сдача' });
      if (letter) u.buffs = u.buffs.filter(b => b.name !== 'Я найду тебя: защита');
      this.setShiny(u, (this.kitFx && this.kitFx(u, 'heistKeep')) || 0);
      this.acting = null;
      if (!this.over) this.applause(u);
      this.cleanup();
    },

    contonTech(fx, src) {
      switch (fx) {
        case 'makotoTech': this.setShiny(src, 2); this.advance(src, T.mkTech); return true;
        case 'amandaTech': this.transform(src, true); this.cocoon(src, src, T.amCocoon, T.amCocoonFlat, T.amCocoonTurns); return true;
        case 'talleahTech': {
          const t = biggest(this.living);
          if (t) { this.setSig(t); this.shackle(src, t, T.tlShackleN); }
          for (const h of this.gynoids()) h.av = 0;
          return true;
        }
      }
      return false;
    },

    contonFx(f, actor, src, R, hitSet) {
      switch (f.k) {
        case 'mkSteal': if (R.main && alive(R.main)) this.stealTime(src, R.main, f.v); return true;
        case 'portal':
          actor.flags.away = 'portal';
          actor.flags.pendingAdvance = (actor.flags.pendingAdvance || 0) + T.mkAway + ((this.kitFx && this.kitFx(actor, 'portalUp')) || 0);
          this.push({ t: 'away', u: actor, text: 'В другом измерении' });
          return true;
        case 'shiny': { const m = ally(this, 'makoto'); if (m) this.setShiny(m, (m.flags.shiny || 0) + f.v); return true; }
        case 'amTransform': this.transform(actor); return true;
        case 'arrest': {
          const t = R.main;
          if (t && alive(t)) { this.setSig(t); this.shackle(src, t, T.tlShackleN); hitSet.add(t); }
          for (const h of this.gynoids()) { h.av = 0; this.push({ t: 'status', u: actor, text: 'Гиноиды, вперёд!', col: '#7ab4ff' }); }
          return true;
        }
        case 'shackle': if (R.main && alive(R.main)) this.shackle(src, R.main, f.n || 1); return true;
        case 'shackleAll': for (const t of this.living) this.shackle(src, t, f.n || 1); return true;
        case 'squad':
          for (const h of this.gynoids()) h.flags.squad = T.tlSquadTurns;
          this.applause(actor);
          return true;
        case 'applause': this.applause(actor); return true;
      }
      return false;
    },

    contonDmg(src, tgt, o) {
      if (src.side !== 'ally' || tgt.side !== 'enemy') return 0;
      let v = 0;
      if (src.charId === 'makoto' && this.living.length && biggest(this.living) === tgt) v += T.mkBig * (this.traceTalent ? this.traceTalent(src) : 1);
      if (tgt.hp > tgt.maxHp * 0.8) v += coneK(src, 'cccstandee', 2);
      return v;
    },

    contonAfter(u, kind, hits) {
      const lt = coneK(u, 'cccletter', 2);
      if (lt && u.charId === 'makoto' && kind === 'skill' && hits.length) this.addBuff(u, { s: 'dmgP', v: lt, turns: 2, name: 'Я найду тебя' }, true);
    },

    contonAbility(u, kind) {
      if (u.charId !== 'amanda' || !u.flags.pink) return null;
      if (kind === 'basic') return { ab: u.kit.pbasic, kind: 'basic' };
      if (kind === 'skill') return { ab: u.kit.pskill, kind: 'skill' };
      return null;
    },

    contonHoldUlt(u) {
      if (u.charId === 'makoto') return (u.flags.shiny || 0) < 2 && !this.living.some(e => e.hp < e.maxHp * 0.25 && (e.data.boss || e.data.elite));
      return false;
    },

    contonAuto(u) {
      switch (u.charId) {
        case 'makoto': {
          const boss = this.living.some(e => e.data.boss || e.data.elite);
          const t = boss ? biggest(this.living) : this.autoTarget(u);
          if (this.sp >= 1 && t) return this.act('skill', t);
          return this.act('basic', t);
        }
        case 'amanda': {
          if (!u.flags.pink) {
            if (this.sp >= 1 && (this.sp >= 2 || this.livingAllies.some(a => a.hp < a.maxHp * 0.6))) return this.act('skill', u);
            return this.act('basic', this.autoTarget(u));
          }
          const bare = this.livingAllies.filter(a => !(a.shield > 0) && !a.flags.away);
          const pick = bare.length ? bare.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a)) : null;
          if (pick && this.sp >= 2) return this.act('skill', pick);
          if (pick && this.sp >= 1 && pick.hp < pick.maxHp * 0.6) return this.act('skill', pick);
          return this.act('basic', this.autoTarget(u));
        }
        case 'talleah': {
          const sig = this.ccSig && alive(this.ccSig) ? this.ccSig : null;
          const big = biggest(this.living);
          if (this.sp >= 1 && big && (!sig || sig !== big || !big.flags.shackle)) return this.act('skill', big);
          return this.act('basic', sig || this.autoTarget(u));
        }
      }
      return null;
    }
  });

  function register() {
    Object.assign(H.CHARS, KITS);
    Object.assign(H.FUSIONS, FUSIONS);
    Object.assign(H.CONES, CONES);
    H.coneInit(CONES);
  }

  register();
  H.CONTON = { KITS, FUSIONS, CONES, FX, IDS, register };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
