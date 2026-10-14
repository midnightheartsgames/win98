(function (H) {
  'use strict';

  const CHARS = {
    trail: {
      name: 'Первопроходец', path: 'destruction', elem: 'phys', rarity: 5, energy: 120,
      base: { hp: 163, atk: 84, def: 62, spd: 100 },
      look: { skin: '#f7dcc9', hair: '#8c898c', eye: '#f0b83a', bangs: 'sweep', sides: 'feather', back: 'wolf', crown: 'smooth', gloss: true, jaw: 'v', body: 'slim', coat: 'split', coatLen: 23, top: '#27252b', coatLow: '#27252b', lining: '#e8b838', backLining: true, trim: '#e2b64a', inner: '#f3f1ec', collar: 'hood', lower: '#2a2830', low: 'pants', shoes: '#2c2a2e', gloves: '#1e1c22', sashSide: 'r', sashTo: 'knee', acc: ['feather', 'rolled:#8a8890', 'piping:#e8c040', 'shbuckle:#d8b050', 'goldcuff:#d8b050', 'armribbon:#e8c040', 'knifebelt:#3a383e', 'watch:#d8b050', 'sashtail:#e8c040', 'pantstripe:#7a3a30', 'soles:#e8e8ec'] },
      basic: { name: 'Прощальный удар', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Хоум-ран в упокой', target: 'blast', fx: [{ k: 'dmg', m: 1.25, adj: 0.5 }] },
      ult: { name: 'Звёздный туз', target: 'blast', fx: [{ k: 'dmg', m: 2.7, adj: 1.62 }] },
      talent: 'Каждое пробитие уязвимости: +20% атаки (до 2 раз).',
      tech: { name: 'Бессмертный третий удар', text: 'Лечит всех союзников на 15% HP в начале боя.', fx: 'healAll' },
      contact: [{ name: 'Заглянуть в мусорку', tag: 'joke' }, { name: 'Замахнуться битой', tag: 'threat' }]
    },
    trail_p: {
      name: 'Первопроходец', path: 'preservation', elem: 'fire', rarity: 5, energy: 120,
      base: { hp: 170, atk: 81, def: 82, spd: 95 },
      look: { skin: '#f7dcc9', hair: '#8c898c', eye: '#f0b83a', bangs: 'sweep', sides: 'feather', back: 'wolf', crown: 'smooth', gloss: true, jaw: 'v', body: 'slim', coat: 'split', coatLen: 23, top: '#27252b', coatLow: '#27252b', lining: '#e8b838', backLining: true, trim: '#e2b64a', inner: '#f3f1ec', collar: 'hood', lower: '#2a2830', low: 'pants', shoes: '#2c2a2e', gloves: '#1e1c22', sashSide: 'r', sashTo: 'knee', acc: ['feather', 'rolled:#8a8890', 'piping:#e8c040', 'shbuckle:#d8b050', 'goldcuff:#d8b050', 'armribbon:#e8c040', 'knifebelt:#3a383e', 'watch:#d8b050', 'sashtail:#e8c040', 'pantstripe:#7a3a30', 'soles:#e8e8ec'] },
      basic: { name: 'Ледокол', target: 'single', fx: [{ k: 'dmg', m: 1.0 }, { k: 'magma', v: 1 }] },
      enhanced: { name: 'Ледокол: Магма', target: 'blast', fx: [{ k: 'dmg', m: 0.9, adj: 0.36, plusDef: 0.45, adjDef: 0.18 }] },
      skill: { name: 'Вечногорящий янтарь', target: 'self', fx: [{ k: 'buff', s: 'dr', v: 0.4, turns: 1, who: 'self', name: 'Янтарь' }, { k: 'taunt', turns: 1, who: 'self' }, { k: 'magma', v: 1 }] },
      ult: { name: 'Копьё пылающей войны', target: 'all', fx: [{ k: 'dmg', m: 1.0, plusDef: 1.5 }, { k: 'magma', v: 4 }] },
      talent: 'После любой способности даёт щит всем союзникам (6% защиты + 20). 4 заряда Магмы усиливают атаку.',
      tech: { name: 'Зов Хранителя', text: 'Щит всем союзникам в начале боя.', fx: 'shieldAll' },
      contact: [{ name: 'Встать стеной', tag: 'kind' }, { name: 'Пригрозить копьём', tag: 'threat' }]
    },
    march: {
      name: 'Март 7', path: 'preservation', elem: 'ice', rarity: 4, energy: 120,
      base: { hp: 144, atk: 69, def: 78, spd: 101 },
      look: { skin: '#f9e0d2', hair: '#f4e6ee', tips: '#eaa0c4', tipsFade: true, eye: '#ea6aa8', eye2: '#5cc0f2', eyeFade: true, bangs: 'wisp', sides: 'flick', back: 'flick', crown: 'smooth', body: 'f', coat: 'shrug', top: '#78b4ec', shoulder: '#b49ae6', trim: '#5a8ee0', inner: '#f6f6fa', sleeve: '#f4f4f8', collar: 'sailor', lower: '#3f5cb4', hem: '#f2f4fa', petti: '#eef0f8', low: 'skirt', shoes: '#26242c', belt: '#b6a6e6', sashTo: 'knee', acc: ['choker:#c8ccd8', 'halter', 'tassel:#6ab8ec', 'clover:#f4f6fa', 'glove1:#26222a', 'cufftails', 'camera', 'bowcase:#26242c', 'sashtail:#a4daf4', 'garter:#f4f2f6', 'garterbow:#6ab8ec', 'ankle:#26242c', 'anklecuff:#6aa8e8', 'backbow:#5a8ee0'] },
      basic: { name: 'Ледяной выстрел', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Защитная дуга', target: 'ally', fx: [{ k: 'shield', m: 0.57, flat: 30, turns: 3, who: 'target' }, { k: 'taunt', turns: 2, who: 'target', ifHp: 0.3 }] },
      ult: { name: 'Ледяной дождь', target: 'all', fx: [{ k: 'dmg', m: 1.5 }, { k: 'freeze', chance: 0.5 }] },
      talent: 'Контратакует врага, ударившего союзника под щитом (до 2 раз за ход).',
      tech: { name: 'Застывший миг', text: 'Все враги заморожены на 1 ход в начале боя.', fx: 'freezeAll' },
      contact: [{ name: 'Сфотографировать', tag: 'cute' }, { name: 'Болтать без умолку', tag: 'joke' }]
    },
    danheng: {
      name: 'Дань Хэн', path: 'hunt', elem: 'wind', rarity: 4, energy: 100,
      base: { hp: 120, atk: 74, def: 54, spd: 110 },
      look: { skin: '#f4dcc8', hair: '#1c1e26', hairHi: '#262a34', eye: '#6a9ab4', bangs: 'wisp', sides: 'shag', back: 'nape', crown: 'shag', ahoge: 'curl', jaw: 'v', body: 'slim', coat: 'split', top: '#f0f2f2', coatLow: '#2a7a76', lining: '#3a9c94', trim: '#d8b050', inner: '#202228', collar: 'high', lower: '#7c7e8a', low: 'pants', shoes: '#22252e', tuck: true, bootsTo: 'calf', acc: ['eyeliner:#c83a40', 'dangle:#c8ccd8', 'earcuff:#3fb8a0', 'zip:#c8ccd4', 'stars:#d8b050', 'dragonpad:#3a9c94', 'armbandr:#1e2026', 'bracer:#26282e', 'flap:#2a7a76', 'hipbelt:#7a4a30', 'thighstrap:#1e2026', 'boots:#22252e', 'bootstrap:#c8a050'] },
      basic: { name: 'Шорох облаков', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Пронзающая буря', target: 'single', fx: [{ k: 'dmg', m: 2.6 }, { k: 'debuff', s: 'spdP', v: -0.12, turns: 2, chance: 1, onCrit: true, name: 'Замедление' }] },
      ult: { name: 'Эфирный дракон', target: 'single', fx: [{ k: 'dmg', m: 4.0, vsSlow: 1.2 }] },
      talent: 'Когда союзник усиливает Дань Хэна, его следующая атака игнорирует 36% сопротивления.',
      tech: { name: 'Тихий ветер', text: 'Атака +40% на 3 хода в начале боя.', fx: 'selfAtk' },
      contact: [{ name: 'Молча смотреть', tag: 'silent' }, { name: 'Рассказать об архивах', tag: 'science' }]
    },
    himeko: {
      name: 'Химико', path: 'erudition', elem: 'fire', rarity: 5, energy: 120,
      base: { hp: 142, atk: 102, def: 59, spd: 96 },
      look: { skin: '#f8dccb', hair: '#c8242c', eye: '#f2a62e', eye2: '#ffd25a', bangs: 'sweep', sides: 'wave', back: 'wave', crown: 'smooth', gloss: true, body: 'tallf', coat: 'cape', top: '#26221e', lining: '#a88a5a', trim: '#d9a73a', inner: '#f6f2ea', collar: 'halter', lower: '#f6f2ea', low: 'gown', shoes: '#1e1c20', acc: ['choker', 'hairflower:#d8a840', 'rose:#d8b050', 'leafband:#d8a840', 'peplum', 'lace:#1e1a1c', 'glove1:#2a1e1c', 'ruffle:#f6f2ea', 'bangle:#d8b050', 'capetassel:#3a9a8a'] },
      basic: { name: 'Настройка пилы', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Расплавленный взрыв', target: 'blast', fx: [{ k: 'dmg', m: 2.0, adj: 0.8 }] },
      ult: { name: 'Небесная вспышка', target: 'all', fx: [{ k: 'dmg', m: 2.3 }, { k: 'killEnergy', v: 5 }] },
      talent: 'Пробития копят заряды. При 3 зарядах Химико проводит добивающую огненную атаку по всем врагам.',
      tech: { name: 'Неполное сгорание', text: 'Враги получают на 20% больше огненного урона 2 хода.', fx: 'fireVuln' },
      contact: [{ name: 'Предложить кофе', tag: 'kind' }, { name: 'Прочитать лекцию', tag: 'science' }]
    },
    welt: {
      name: 'Вельт', path: 'nihility', elem: 'imag', rarity: 5, energy: 120,
      base: { hp: 153, atk: 84, def: 69, spd: 102 },
      look: { skin: '#f3d9c4', hair: '#6e4e38', streak: '#9c8878', streakSide: 'r', eye: '#d9a53a', bangs: 'sidepart', sides: 'temple', back: 'short', crown: 'swept', jaw: 'v', body: 'lean', coat: 'split', coatLen: 20, top: '#a6a8ac', coatLow: '#a6a8ac', lining: '#8a5a3c', backLining: true, trim: '#6a6c74', inner: '#eeece8', neck: '#202024', collar: 'high', lower: '#342a28', low: 'pants', shoes: '#1e1e22', acc: ['glasses:slim', 'neckpiece:#c8ccd4', 'vestv:#24242a', 'buttons:#2a2a30', 'scarf:#3a383c', 'brooch2:#d8dce4', 'straps:#7a4a32', 'cuffbtn:#2a2a30', 'glove1:#1e1e22', 'harness:#7a4a32', 'cane'] },
      basic: { name: 'Гравитационный удар', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Гравитационное ядро', target: 'bounce', fx: [{ k: 'dmg', m: 0.72, hits: 3 }, { k: 'debuff', s: 'spdP', v: -0.1, turns: 2, chance: 0.75, name: 'Замедление' }] },
      ult: { name: 'Синтетическая чёрная дыра', target: 'all', fx: [{ k: 'dmg', m: 1.5 }, { k: 'imprison', chance: 1 }] },
      talent: 'По замедленным врагам наносит дополнительный мнимый урон.',
      tech: { name: 'Гравитационная тюрьма', text: 'Все враги замедлены и отброшены по шкале на 20%.', fx: 'slowAll' },
      contact: [{ name: 'Вспомнить былое', tag: 'kind' }, { name: 'Строгий взгляд', tag: 'threat' }]
    },
    natasha: {
      name: 'Наташа', path: 'abundance', elem: 'phys', rarity: 4, energy: 90,
      base: { hp: 158, atk: 64, def: 69, spd: 98 },
      look: { skin: '#f7dccb', hair: '#2e4a5e', eye: '#d84a7a', eye2: '#f290b4', bangs: 'sweep', sides: 'flick', back: 'tail', crown: 'smooth', gloss: true, body: 'tallf', coat: 'bolero', top: '#f2f2f4', trim: '#c8d0dc', inner: '#28221f', neck: '#1e1c1e', collar: 'high', lower: '#2e4a72', apron: '#243a5c', low: 'slit', slitTo: 'knee', legs: '#2c2624', shoes: '#1e1e24', tailsTo: 'calf', tailsLining: '#b0243a', acc: ['mole', 'hairwrap:#f2f2f4', 'vial:#b8e848', 'corset:#d8b050', 'shoulderbow:#c8283c', 'longglove1:#3a2c26', 'armbandr:#d8b050', 'hourglass:#d8b050', 'sigil:#c8ccd8', 'hipbelt:#6a4430', 'bear:#8a5a3a', 'tails:#f2f2f4', 'boots:#1e1e24', 'bootgem:#3a6aa8'] },
      basic: { name: 'Хирургический удар', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Любовь и исцеление', target: 'ally', fx: [{ k: 'heal', m: 0.105, flat: 20, who: 'target' }, { k: 'cleanse', who: 'target' }, { k: 'hot', m: 0.072, flat: 10, turns: 2, who: 'target' }] },
      ult: { name: 'Благодать', target: 'allies', fx: [{ k: 'heal', m: 0.138, flat: 30, who: 'allies' }] },
      talent: 'Лечение раненых (ниже 30% HP) сильнее на 50%.',
      tech: { name: 'Гипноз', text: 'Враги наносят на 30% меньше урона 1 ход.', fx: 'weaken' },
      contact: [{ name: 'Осмотреть рану', tag: 'kind' }, { name: 'Прописать лекарство', tag: 'science' }]
    },
    serval: {
      name: 'Сервал', path: 'erudition', elem: 'elec', rarity: 4, energy: 100,
      base: { hp: 124, atk: 88, def: 51, spd: 104 },
      look: { skin: '#f8dfd0', hair: '#d8c6a0', tips: '#8cc6ec', tipsFade: true, tipsAt: 58, streak: '#2a44c8', streakSide: 'l', streakShape: 'lock', eye: '#3d92e2', bangs: 'sweep', sides: 'wave', back: 'wave', crown: 'smooth', gloss: true, body: 'tallf', coat: 'half', top: '#f2f2f4', trim: '#3553c9', inner: '#25252d', collar: 'bare', lower: '#2f50c0', low: 'skirt', skirtLen: 8, legs: '#4a3832', shoes: '#1e1e26', tailsTo: 'ankle', tailsOne: 'l', acc: ['choker:#c8ccd4', 'hoop:#c8ccd4', 'feathers:#2a48d0', 'xstraps:#eceef2', 'tattoo:#e05a9a', 'blacksleeve:#22222a', 'pinkglove:#e0508a', 'shortsr:#24242c', 'beltstrap:#1e1e24', 'pegs:#d8b050', 'tails:#f2f2f4', 'stocking1:#26242e', 'gband:#8a2a2e', 'ankle:#1e1e26', 'anklecuff:#3a50c8'] },
      basic: { name: 'Громовой аккорд', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Молниевый вихрь', target: 'blast', fx: [{ k: 'dmg', m: 1.4, adj: 0.6 }, { k: 'dot', type: 'shock', m: 0.5, turns: 2, chance: 0.8 }] },
      ult: { name: 'Механическая лихорадка', target: 'all', fx: [{ k: 'dmg', m: 1.94 }, { k: 'extendDots', type: 'shock', turns: 2 }] },
      talent: 'Атаки по врагам под Шоком наносят доп. электрический урон.',
      tech: { name: 'Громкий аккорд', text: 'Оглушает одного врага на 1 ход.', fx: 'stunOne' },
      contact: [{ name: 'Сыграть рифф', tag: 'sing' }, { name: 'Подмигнуть', tag: 'cute' }]
    },
    asta: {
      name: 'Аста', path: 'harmony', elem: 'fire', rarity: 4, energy: 120,
      base: { hp: 139, atk: 69, def: 63, spd: 106 },
      look: { skin: '#f9e0d3', hair: '#c8727e', eye: '#5a9ae8', eye2: '#9cd2f6', bangs: 'sweep', sides: 'long', back: 'shoulder', crown: 'smooth', gloss: true, body: 'f', coat: 'offcoat', coatLen: 17, lining: '#c040b8', top: '#f2f0f6', trim: '#8a5ccc', inner: '#faf8fa', collar: 'high', lower: '#26222c', low: 'skirt', skirtLen: 12, shoes: '#1e1a2a', acc: ['clip:#e0a830', 'sidetail', 'sidebraid', 'bow:#262230', 'neckband:#8a5ccc', 'ruffles', 'lanyard:#8a5ccc', 'waistband:#5a86e0', 'pinkbelt:#e050b0', 'panell:#5a3aa0', 'goldarc:#c8a050', 'thighbow:#f4f4f8', 'garter:#1e1a22', 'sashtail:#e050b0', 'bracelets:#a070e0', 'anklestrap:#1e1a2a'] },
      basic: { name: 'Звёздная искра', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Метеоритный шторм', target: 'bounce', fx: [{ k: 'dmg', m: 0.5, hits: 5 }] },
      ult: { name: 'Астральное благословение', target: 'allies', fx: [{ k: 'buff', s: 'spd', v: 50, turns: 2, who: 'allies', name: 'Благословение' }] },
      talent: 'Заряды от попаданий: +14% атаки всем союзникам за заряд (до 5).',
      tech: { name: 'Звездопад', text: 'Огненный урон по всем врагам в начале боя.', fx: 'fireAoe' },
      contact: [{ name: 'Показать созвездия', tag: 'science' }, { name: 'Угостить конфетой', tag: 'kind' }]
    },
    arlan: {
      name: 'Арлан', path: 'destruction', elem: 'elec', rarity: 4, energy: 110,
      base: { hp: 163, atk: 81, def: 45, spd: 102 },
      look: { skin: '#8e5b3c', hair: '#e6e2da', hairHi: '#f8f6f0', streak: '#4a3e3a', streakSide: 'l', streakShape: 'templel', eye: '#d8388a', bangs: 'hide', sides: 'feather', back: 'nape', crown: 'smooth', gloss: true, jaw: 'v', body: 'slim', coat: 'cut', top: '#e6dfcc', trim: '#2e5bd2', inner: '#24242c', neck: '#24242c', collar: 'high', lower: '#2e4aa6', low: 'pants', shoes: '#222226', tuck: true, bootsTo: 'calf', acc: ['hoodline:#2e5bd2', 'gear:#c8ccd4', 'badge', 'pauldronr:#c8ccd8', 'armband:#2e4aa8', 'gloveR:#ecebe4', 'gauntlet', 'chevrons:#26262c', 'harnessb:#26365e', 'pouch:#26262c', 'cord:#3a5ad0', 'kneepad:#9aa0aa', 'boots:#222226', 'soles:#e8e8ec'] },
      basic: { name: 'Молниеносный удар', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Ярость охранника', target: 'single', noSp: true, fx: [{ k: 'selfCost', hpP: 0.15 }, { k: 'dmg', m: 2.4 }] },
      ult: { name: 'Раскат грома', target: 'blast', fx: [{ k: 'dmg', m: 3.2, adj: 1.6 }] },
      talent: 'Чем меньше HP, тем больше урон (до +72%). Навык тратит HP вместо очков навыка.',
      tech: { name: 'Лихорадка', text: 'Электрический удар по всем врагам в начале боя.', fx: 'elecAoe' },
      contact: [{ name: 'Сурово нахмуриться', tag: 'threat' }, { name: 'Показать шрамы', tag: 'silent' }]
    },
    herta: {
      name: 'Герта', path: 'erudition', elem: 'ice', rarity: 4, energy: 110,
      base: { hp: 129, atk: 79, def: 54, spd: 100 },
      look: { skin: '#f8e0d4', hair: '#a8968e', eye: '#9c62da', eye2: '#c8a8f4', bangs: 'blunt', sides: 'long', back: 'long', crown: 'smooth', gloss: true, body: 'petite', coat: 'doll', top: '#26222c', trim: '#8c5ccc', inner: '#f3f0f6', collar: 'bare', lower: '#f3f0f6', petti: '#e2deec', low: 'skirt', skirtLen: 9, shoes: '#22202a', cuff: '#f3f0f6', tailsTo: 'calf', tailsLining: '#5a3ab8', beretBand: '#c8a050', acc: ['beret:#26222c', 'flower:#8c5ae8', 'strays', 'keychoker:#5a4ad0', 'padlock:#d8b050', 'chains:#b8bcc8', 'tie:#5a48c8', 'diamonds:#dcd8ee', 'shoulderfrill:#f3f0f6', 'bellsleeves:#26222c', 'stockings:#f2f0f6', 'dolljoint', 'ankle:#22202a', 'anklecuff:#f2f0f6', 'heelbow:#5a48c8', 'tails:#26222c'] },
      basic: { name: 'Как ты это сделал?', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Ну держись!', target: 'all', fx: [{ k: 'dmg', m: 1.0, vsHalf: 0.2 }] },
      ult: { name: 'Немного волшебства', target: 'all', fx: [{ k: 'dmg', m: 2.0 }] },
      talent: 'Когда HP врага падает ниже 50%, наносит добивающий ледяной удар по всем.',
      tech: { name: 'Кукла на удачу', text: 'Атака +40% на 3 хода в начале боя.', fx: 'selfAtk' },
      contact: [{ name: 'Показать куклу', tag: 'cute' }, { name: 'Прочесть доклад', tag: 'science' }]
    },
    gepard: {
      name: 'Гепард', path: 'preservation', elem: 'ice', rarity: 5, energy: 100,
      base: { hp: 190, atk: 73, def: 89, spd: 92 },
      look: { skin: '#f6dcc6', hair: '#c4ad86', hairHi: '#e2d2b0', eye: '#3a8ee2', eye2: '#8ad0f6', bangs: 'swoop', sides: 'jaw', back: 'short', crown: 'wind', gloss: true, jaw: 'v', body: 'lean', coat: 'closed', top: '#eef0f6', trim: '#2d5bd3', inner: '#e4e6ee', collar: 'high', lower: '#eceef4', low: 'pants', shoes: '#1e1e26', gloves: '#e8eaf0', tuck: true, tailsTo: 'ankle', tailsOne: 'r', tailsLining: '#5ac8f0', acc: ['tails:#2d5bd3', 'furcollar:#f4f4f8', 'chestplate:#c8ccd8', 'pauldron:#e8eaf0', 'aiguillette:#d8b050', 'goldclasp:#d8b050', 'hemband:#2d5bd3', 'bracerR:#26262e', 'icegauntlet:#c8ccd8', 'pelt:#e4e4e8', 'goldstripes:#c8a050', 'kneeband:#2d5bd3', 'boots:#1e1e26', 'bootplate:#d8dce4'] },
      basic: { name: 'Кулак правосудия', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Кулак мерзлоты', target: 'single', fx: [{ k: 'dmg', m: 2.0 }, { k: 'freeze', chance: 0.65 }] },
      ult: { name: 'Несокрушимая стена', target: 'allies', fx: [{ k: 'shield', m: 0.45, flat: 60, turns: 3, who: 'allies' }] },
      talent: 'Один раз за бой поднимается с 50% HP после смертельного удара.',
      tech: { name: 'Щит Среброгривых', text: 'Щит всем союзникам в начале боя.', fx: 'shieldAll' },
      contact: [{ name: 'Отдать честь', tag: 'kind' }, { name: 'Приказ разойтись', tag: 'threat' }]
    },
    bronya: {
      name: 'Броня', path: 'harmony', elem: 'wind', rarity: 5, energy: 120,
      base: { hp: 168, atk: 79, def: 72, spd: 99 },
      look: { skin: '#f8dfd2', hair: '#bcb8c2', eye: '#8a7464', eye2: '#c0a890', bangs: 'sweep', sides: 'long', back: 'long', crown: 'smooth', gloss: true, body: 'tallf', coat: 'wrap', top: '#f2f2f6', trim: '#2a5ad8', inner: '#f2f2f6', neck: '#24242c', collar: 'high', lower: '#f2f2f6', low: 'skirt', skirtLen: 8, legs: '#3a2c28', shoes: '#22222c', gloves: '#4a3226', tailsTo: 'ankle', tailsLining: '#2a5ad8', acc: ['dropgem:#6a4ae0', 'icebow:#2a5ad8', 'medal', 'goldclasp:#d8b050', 'goldtassel:#d8b050', 'drills', 'tails:#f2f2f6', 'thighboots:#22222c', 'kneeplate:#d8b050', 'shinleaf:#d8b050'] },
      basic: { name: 'Пуля урагана', target: 'single', fx: [{ k: 'dmg', m: 1.0, alwaysCrit: true }, { k: 'advance', v: 0.3, who: 'self' }] },
      skill: { name: 'Боевой приказ', target: 'ally', noSelf: true, fx: [{ k: 'cleanse', who: 'target' }, { k: 'buff', s: 'dmgP', v: 0.66, turns: 1, who: 'target', name: 'Приказ' }, { k: 'advance', v: 1, who: 'target' }] },
      ult: { name: 'Марш Белобога', target: 'allies', fx: [{ k: 'buff', s: 'atkP', v: 0.55, turns: 2, who: 'allies', name: 'Марш' }, { k: 'buff', s: 'critD', v: 0.3, turns: 2, who: 'allies', name: 'Марш: крит' }] },
      talent: 'После обычной атаки её ход наступает на 30% раньше.',
      tech: { name: 'Знамя командира', text: 'Атака всех союзников +15% на 2 хода.', fx: 'teamAtk' },
      contact: [{ name: 'Приказ сдаться', tag: 'threat' }, { name: 'Выслушать', tag: 'kind' }]
    },
    seele: {
      name: 'Зеле', path: 'hunt', elem: 'quant', rarity: 5, energy: 120,
      base: { hp: 126, atk: 87, def: 49, spd: 115 },
      look: { skin: '#f9e1d3', hair: '#28286a', tips: '#8a5ae8', tipsFade: true, tipsAt: 54, eye: '#8c70ea', eye2: '#c4b0f8', bangs: 'sweep', sides: 'layer', back: 'layer', crown: 'smooth', gloss: true, ahoge: true, body: 'f', coat: 'leo', top: '#1e1c28', trim: '#3d3dbc', inner: '#eceaf6', collar: 'bare', lower: '#22202c', low: 'shorts', shoes: '#22203a', gloves: '#1e1c28', sashSide: 'r', tailsTo: 'ankle', tailsOne: 'l', tailsLining: '#2a2840', acc: ['neckscarf:#5c4ce0', 'leotard:#eceaf6', 'furcuff:#f4f4f8', 'onesleeve:#3a3ab0', 'armribbon2:#d8305a', 'petals:#8a5ae8', 'sashtail:#d8305a', 'tails:#d8dae6', 'legstraps:#7ad0f0', 'shinx:#1e1c28', 'ankle:#3a3ab0', 'anklerim:#1e1c28'] },
      basic: { name: 'Трепет бабочки', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Ливень лезвий', target: 'single', fx: [{ k: 'dmg', m: 2.2 }, { k: 'buff', s: 'spdP', v: 0.25, turns: 2, who: 'self', name: 'Ускорение' }] },
      ult: { name: 'Бабочка и лезвие', target: 'single', fx: [{ k: 'resurge' }, { k: 'dmg', m: 4.25 }] },
      talent: 'Убив врага, получает дополнительный ход и усиление.',
      tech: { name: 'Призрачный шаг', text: 'Начинает бой в Усилении (+80% урона).', fx: 'seeleBuff' },
      contact: [{ name: 'Процедить угрозу', tag: 'threat' }, { name: 'Отвернуться', tag: 'silent' }]
    },
    sampo: {
      name: 'Сампо', path: 'nihility', elem: 'wind', rarity: 4, energy: 120,
      base: { hp: 139, atk: 84, def: 54, spd: 102 },
      look: { skin: '#f5dcc6', hair: '#2a3274', tips: '#c4c6d4', eye: '#3ab07a', bangs: 'swoop', sides: 'jaw', back: 'short', crown: 'swept', gloss: true, jaw: 'v', body: 'lean', coat: 'jacket', top: '#b0283e', trim: '#6a5ad8', inner: '#c8c8ce', collar: 'v', lower: '#383454', low: 'pants', shoes: '#2a2224', gloves: '#22201e', tuck: true, bootsTo: 'calf', acc: ['earring:#c8ccd4', 'turtle:#24222a', 'crossbelt:#2e2a2a', 'claw:#d0d4dc', 'rolled:#eef0f4', 'glovecuff:#c0283e', 'chainband:#c8ccd4', 'vesthem', 'holster:#24222a', 'boots:#2a2224', 'kneeband:#24222a'] },
      basic: { name: 'Фокус', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Взрыв-сюрприз', target: 'bounce', fx: [{ k: 'dmg', m: 0.56, hits: 5 }] },
      ult: { name: 'Сейчас рванёт!', target: 'all', fx: [{ k: 'dmg', m: 1.6 }, { k: 'debuff', s: 'dotVuln', v: 0.3, turns: 2, chance: 1, name: 'Уязвимость' }] },
      talent: 'Каждый удар с шансом 65% накладывает Порыв ветра (до 5 стаков).',
      tech: { name: 'Шоу начинается', text: 'Враги отброшены по шкале на 25%.', fx: 'delayAll' },
      contact: [{ name: 'Продать слух', tag: 'bribe' }, { name: 'Пошутить', tag: 'joke' }]
    },
    hook: {
      name: 'Хук', path: 'destruction', elem: 'fire', rarity: 4, energy: 120,
      base: { hp: 182, atk: 84, def: 48, spd: 94 },
      look: { skin: '#f9e2d4', hair: '#d8cc58', eye: '#d89a20', eye2: '#f4d060', bangs: 'blunt', sides: 'short', back: 'twin', crown: 'smooth', gloss: true, body: 'small', coat: 'mid', coatLen: 9, coatFlare: 3, lining: '#3a2c26', top: '#4a3a32', trim: '#f1ede4', inner: '#e8b830', collar: 'fur', lower: '#2e2826', hem: '#e2b232', low: 'skirt', skirtLen: 7, shoes: '#22222a', gloves: '#22222a', acc: ['molehat', 'bow:#e8b020', 'molebadge:#d8b050', 'yoke:#e8b020', 'tiestripe:#e8b020', 'pouches:#e8b020', 'furcuffs:#f2ead8', 'kneepadr:#9aa0aa', 'socktop:#e8b020', 'boots:#22222a', 'bootband:#d85030'] },
      basic: { name: 'Ударь сильнее!', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Запомни Хук!', target: 'single', fx: [{ k: 'dmg', m: 2.4 }, { k: 'dot', type: 'burn', m: 0.35, turns: 2, chance: 1 }] },
      enhanced: { name: 'Хук в ярости!', target: 'blast', fx: [{ k: 'dmg', m: 2.8, adj: 0.8 }, { k: 'dot', type: 'burn', m: 0.35, turns: 2, chance: 1 }] },
      ult: { name: 'Смотри, туда!', target: 'single', fx: [{ k: 'dmg', m: 4.0 }, { k: 'hookEnhance' }] },
      talent: 'Атакуя горящего врага, наносит доп. огненный урон и лечит себя на 5% HP.',
      tech: { name: 'Хи-хи, ловушка!', text: 'Поджигает всех врагов в начале боя.', fx: 'burnAll' },
      contact: [{ name: 'Крикнуть «Ура Хук!»', tag: 'joke' }, { name: 'Скорчить рожицу', tag: 'cute' }]
    },
    pela: {
      name: 'Пела', path: 'nihility', elem: 'ice', rarity: 4, energy: 110,
      base: { hp: 134, atk: 74, def: 63, spd: 105 },
      look: { skin: '#f8dfd2', hair: '#30307e', eye: '#2ab0c8', eye2: '#8ae0ec', bangs: 'blunt', sides: 'straight', back: 'long', crown: 'smooth', gloss: true, body: 'f', coat: 'closed', top: '#f0f0f2', trim: '#d2aa52', inner: '#f4f4f6', collar: 'high', lower: '#22222a', low: 'skirt', skirtLen: 7, legs: '#3a2e2c', shoes: '#24242c', gloves: '#1e1e24', tailsLining: '#2a6ad8', acc: ['roundglasses', 'beret:#1c1c24', 'beretgold:#d8b050', 'hairpins:#c8ccd4', 'blackyoke:#1e1e26', 'cravat:#2a8ad8', 'whitebow:#f4f4f8', 'sidepanel:#2a6ad8', 'puff:#f2f2f4', 'longgloves', 'tails:#eef0f4', 'ankle:#e6e8f0', 'heelbow:#3a8ae0'] },
      basic: { name: 'Холодный расчёт', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Анализ цели', target: 'single', fx: [{ k: 'dispel' }, { k: 'dmg', m: 2.1 }] },
      ult: { name: 'Зона подавления', target: 'all', fx: [{ k: 'dmg', m: 1.0 }, { k: 'debuff', s: 'defDown', v: 0.4, turns: 2, chance: 1, name: 'Защита −40%' }] },
      talent: 'Атакуя ослабленного врага, получает 11 энергии.',
      tech: { name: 'Первая помощь разведки', text: 'Защита всех врагов −20% на 2 хода.', fx: 'defDownAll' },
      contact: [{ name: 'Проанализировать', tag: 'science' }, { name: 'Проверить документы', tag: 'threat' }]
    },
    ruanmei: {
      name: 'Жуань Мэй', path: 'harmony', elem: 'ice', rarity: 5, energy: 130,
      base: { hp: 147, atk: 89, def: 66, spd: 104 },
      look: { skin: '#f8e3d8', hair: '#2a2428', streak: '#2e848c', streakSide: 'r', streakShape: 'under', eye: '#2fb2aa', eye2: '#8fe6dc', bangs: 'sweep', sides: 'flick', back: 'shoulder', crown: 'smooth', gloss: true, body: 'tallf', coat: 'dress', top: '#2e7a8a', trim: '#dcb75c', inner: '#2e7a8a', collar: 'bare', lower: '#3a8a98', low: 'shorts', shoes: '#24305a', gloves: '#22384a', tailsTo: 'ankle', tailsLining: '#3aa0b0', acc: ['bun:#dcb75c', 'hairblossom:#f7f2ea', 'earring:#f4efe4', 'mandarin:#1e2c34', 'pearls', 'sheer:#1e1a24', 'puff:#f2ede3', 'shawl:#efe8da', 'longgloves', 'bangle:#e4e8ee', 'frontpanel:#1e3450', 'blossom:#f7f2ea', 'tails:#a8d4e0', 'garter:#3a9aa0'] },
      basic: { name: 'Игла с орхидеей', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Повторяющаяся мелодия пения струн', target: 'allies', fx: [{ k: 'buff', s: 'dmgP', v: 0.32, turns: 3, who: 'allies', name: 'Обертон' }, { k: 'buff', s: 'breakEff', v: 0.5, turns: 3, who: 'allies', name: 'Обертон: пробитие', quiet: true }] },
      ult: { name: 'Лепестки на воде, отдых во сне', target: 'allies', fx: [{ k: 'buff', s: 'resPen', v: 0.25, turns: 2, who: 'allies', name: 'Магический круг' }, { k: 'bloom' }] },
      talent: 'Скорость союзников +10%. Пробитие уязвимости союзником добавляет её ледяной урон пробития.',
      tech: { name: 'Шёлковая серенада', text: 'В начале боя срабатывает Обертон без очков навыка.', fx: 'ruanSkill' },
      contact: [{ name: 'Угостить пирожным', tag: 'kind' }, { name: 'Взять образец', tag: 'science' }]
    },
    kafka: {
      name: 'Кафка', path: 'nihility', elem: 'elec', rarity: 5, energy: 120, faction: 'hunters',
      base: { hp: 147, atk: 92, def: 58, spd: 100 },
      look: { skin: '#f8dfd2', hair: '#76285e', eye: '#c84aa8', eye2: '#f0a0d8', bangs: 'sweep', sides: 'flick', back: 'tail', crown: 'smooth', gloss: true, body: 'tallf', coat: 'cape', capeLen: 18, top: '#24222a', lining: '#6a1e48', trim: '#d8b050', inner: '#f2f0f2', sleeve: '#f2f0f2', collar: 'shirt', lower: '#24222a', low: 'shorts', legs: '#6a2c4c', shoes: '#1e1e22', gloves: '#b02a62', acc: ['shades', 'choker:#c8ccd4', 'chestharness:#1e1e24', 'corsetHi:#24222a', 'jabot:#b02a62', 'ruffcuff:#f2f0f2', 'thighcross:#b02a62', 'boot1:#22222a', 'thighstrap:#1e1e24', 'ankle:#22222a'] },
      basic: { name: 'Полуночный шум', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Ласковый лунный свет', target: 'blast', text: 'урон 160% (соседним 60%). Все DoT на цели сразу наносят 75% урона.', fx: [{ k: 'dmg', m: 1.6, adj: 0.6 }, { k: 'detonate', v: 'skill', main: true }] },
      ult: { name: 'Сумеречная трель', target: 'all', text: 'урон 80% всем, Шок на 2 хода, все DoT на врагах сразу срабатывают.', fx: [{ k: 'dmg', m: 0.8 }, { k: 'dot', type: 'shock', m: 0.9, turns: 2, chance: 1 }, { k: 'detonate', v: 'ult' }] },
      talent: 'После базовой атаки союзника бьёт ту же цель бонус-атакой и накладывает Шок. Раз за свой ход.',
      tech: { name: 'Прощение не связано с милосердием', text: 'Урон всем врагам и Шок на 2 хода в начале боя.', fx: 'kafkaTech' },
      contact: [{ name: 'Шепнуть «Послушай…»', tag: 'threat' }, { name: 'Напеть арию', tag: 'sing' }]
    },
    silverwolf: {
      name: 'Серебряный Волк', short: 'Сер. Волк', path: 'nihility', elem: 'quant', rarity: 5, energy: 110, faction: 'hunters',
      base: { hp: 142, atk: 84, def: 62, spd: 107 },
      look: { skin: '#f8e0d4', hair: '#aaaab6', eye: '#7a7a8a', eye2: '#b0b0c0', bangs: 'wisp', sides: 'jaw', back: 'nape', crown: 'smooth', gloss: true, body: 'f', coat: 'crop', top: '#24222e', lining: '#4a5ae0', trim: '#eeeef2', inner: '#f2f2f4', collar: 'fur', lower: '#22222a', low: 'shorts', shoes: '#2a2a40', gloves: '#22222a', bootsTo: 'calf', acc: ['tailbow:#2a2a44', 'visor:#7a6af0', 'choker:#c8ccd4', 'whitebelt:#e8e8ee', 'sash2:#8a7ae0', 'whitesleeve:#e8e8ee', 'thighgadget:#e8e8ee', 'kneebandage:#a8d8f0', 'fishnet1:#2a2a34', 'boots:#22222e', 'bootflap:#4a5ae0', 'gunholster:#1e1e26'] },
      basic: { name: 'Системное предупреждение', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Разрешить изменения?', target: 'single', text: 'урон 196%. Вносит цели уязвимость к стихии союзника (↑↓) на 3 хода, сопротивление −13%.', fx: [{ k: 'dmg', m: 1.96 }, { k: 'implant' }, { k: 'debuff', s: 'resDown', v: 0.13, turns: 2, chance: 1, name: 'Сопротивление −13%' }] },
      ult: { name: 'Пользователь забанен', target: 'single', fx: [{ k: 'dmg', m: 3.8 }, { k: 'debuff', s: 'defDown', v: 0.45, turns: 3, chance: 1, name: 'Защита −45%' }] },
      talent: 'Атака с шансом 65% вносит цели Баг на 3 хода: атака −10%, защита −8% или скорость −6%.',
      tech: { name: 'Программа принудительного выхода', text: 'Урон всем врагам и стойкость без учёта уязвимостей.', fx: 'wolfTech' },
      contact: [{ name: 'Взломать прошивку', tag: 'science' }, { name: 'Позвать в рейд', tag: 'joke' }]
    },
    blade: {
      name: 'Блэйд', path: 'destruction', elem: 'wind', rarity: 5, energy: 130, faction: 'hunters',
      base: { hp: 184, atk: 80, def: 62, spd: 97 },
      look: { skin: '#f6ded2', hair: '#1c3450', hairHi: '#2a4a6c', tips: '#3e2638', tipsFade: true, tipsAt: 60, eye: '#e0502a', eye2: '#f4a850', bangs: 'hide', sides: 'feather', back: 'tail', crown: 'wind', gloss: true, ahoge: true, jaw: 'v', body: 'tall', sex: 'm', coat: 'split', coatLen: 24, top: '#24242c', coatLow: '#24242c', lining: '#b02a22', backLining: true, edge: '#3a3a86', trim: '#3a3a86', inner: '#b8a078', neck: '#24242c', collar: 'high', lower: '#a6aab8', low: 'pants', shoes: '#1c1c22', gloves: '#1c1c22', acc: ['dangleR:#d8402a', 'mandarin:#1e1e26', 'frogknot:#1a1418', 'leafclasp:#d8b050', 'swirl:#3a3a86', 'redbtn:#d0402a', 'armwrap:#f0eee8', 'handwrap:#ece8e0', 'tancuff:#b8a078', 'hipbelt:#2a2a30', 'jade:#3ad0a0', 'kneebandage:#f0eee8', 'thighorn:#a8b0c0', 'greaves:#7c86a2', 'boots:#1c1c22'] },
      basic: { name: 'Осколочный меч', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      enhanced: { name: 'Частокол мечей', target: 'blast', energy: 30, text: 'тратит 10% HP. Урон 40% атаки + 100% макс. HP (соседним 16% + 40%).', fx: [{ k: 'hpCost', v: 0.1 }, { k: 'dmg', m: 0.4, hpM: 1.0, adj: 0.16, adjHp: 0.4, tough: 20 }] },
      skill: { name: 'Адский пейзаж', target: 'self', keepTurn: true, text: 'тратит 30% HP. 3 хода: урон +40%, атака Частоколом. Ход не кончается.', fx: [{ k: 'hpCost', v: 0.3 }, { k: 'hellscape' }] },
      ult: { name: 'Смертный приговор', target: 'blast', text: 'HP становится 50%. Урон от атаки, макс. HP и всего HP, потерянного в бою.', fx: [{ k: 'sentence' }, { k: 'dmg', m: 0.4, hpM: 1.0, tallyM: 1.0, adj: 0.16, adjHp: 0.4, adjTally: 0.4 }, { k: 'tallyReset' }] },
      talent: 'Урон и трата HP дают заряд. На 5 зарядах бьёт всех врагов и лечится на 25% HP.',
      tech: { name: 'Ветер кармы', text: 'Тратит 20% HP и бьёт всех врагов на 40% своего макс. HP.', fx: 'bladeTech' },
      contact: [{ name: 'Молча обнажить меч', tag: 'threat' }, { name: 'Смотреть в пустоту', tag: 'silent' }]
    },
    bailu: {
      name: 'Байлу', path: 'abundance', elem: 'elec', rarity: 5, energy: 100,
      base: { hp: 178, atk: 68, def: 70, spd: 98 },
      look: { skin: '#f9e3d8', hair: '#a6a2ea', eye: '#36b8cc', eye2: '#a4f0ee', bangs: 'messy', sides: 'long', back: 'twin', crown: 'messy', ahoge: true, body: 'small', coat: 'tabard', top: '#2f56a6', trim: '#9ad8ec', inner: '#25232d', collar: 'high', lower: '#2a2834', low: 'skirt', skirtLen: 7, shoes: '#24222a', acc: ['horns:#e6bcec', 'elfears', 'bellsleeves:#f2f2f8', 'clasps:#d8b048', 'furtuft:#f6f6fa', 'gourd', 'tails:#2c58b4', 'warmers:#2c4ea8', 'dragontail:#7aa2dc', 'braidrings:#d8b048'] },
      basic: { name: 'Диагностический пинок', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Песнь среди облаков', target: 'ally', fx: [{ k: 'heal', m: 0.117, flat: 30, who: 'target', bounce: 2, decay: 0.15 }] },
      ult: { name: 'Благодатный громовой прыжок', target: 'allies', fx: [{ k: 'heal', m: 0.135, flat: 36, who: 'allies' }, { k: 'invig', turns: 2 }] },
      talent: 'Союзник с Оживлением лечится, когда его бьют. Раз за бой не даёт союзнику пасть и лечит его.',
      tech: { name: 'Прогулка под дождём', text: 'Вся команда начинает бой с Оживлением на 2 хода.', fx: 'invigAll' },
      contact: [{ name: 'Пощупать пульс', tag: 'science' }, { name: 'Показать хвост', tag: 'cute' }]
    },
    yanqing: {
      name: 'Яньцин', path: 'hunt', elem: 'ice', rarity: 5, energy: 140,
      base: { hp: 128, atk: 92, def: 56, spd: 109 },
      look: { skin: '#f8e2d2', hair: '#d6c098', eye: '#e2a83c', bangs: 'center', sides: 'long', back: 'tail', crown: 'smooth', ahoge: true, body: 'f', sex: 'm', youth: true, coat: 'robe', top: '#36506e', trim: '#18181e', inner: '#f4f4f6', collar: 'high', lower: '#f0f1f4', low: 'pants', shoes: '#c8ccd8', gloves: '#1e1e26', tuck: true, acc: ['halfsleeves', 'sidecape:#3c8cb4', 'brooch', 'flute:#3ab0a4', 'boots:#cdd2de'] },
      basic: { name: 'Морозный шип', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Стремительный железный шип', target: 'single', fx: [{ k: 'dmg', m: 2.2 }, { k: 'sync' }] },
      ult: { name: 'Среди блаженного дождя', target: 'single', fx: [{ k: 'yanqingUlt' }, { k: 'dmg', m: 3.5 }] },
      talent: 'Навык даёт Единение: крит +20%, крит. урон +30%, реже под ударом, 50% добить льдом. Урон снимает.',
      tech: { name: 'Истинный меч', text: 'Урон +30% по врагам, у которых HP не ниже 50%, 2 хода.', fx: 'yanqingTech' },
      contact: [{ name: 'Вызвать на поединок', tag: 'threat' }, { name: 'Рассказать о мечах', tag: 'science' }]
    },
    clara: {
      name: 'Клара', path: 'destruction', elem: 'phys', rarity: 5, energy: 110,
      base: { hp: 168, atk: 90, def: 66, spd: 90 },
      look: { skin: '#f9e3d8', hair: '#f0eef0', eye: '#e03452', bangs: 'messy', sides: 'long', back: 'long', crown: 'smooth', body: 'small', coat: 'parka', top: '#c42d31', trim: '#f0e8dc', inner: '#a89886', collar: 'v', lower: '#f4f2f6', low: 'skirt', shoes: '#5a3a30', acc: ['kerchief:#f4f2f6', 'barefoot', 'garter:#2a2226'] },
      basic: { name: 'Я тоже хочу помочь', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Осторожно, Сварог', target: 'all', fx: [{ k: 'dmg', m: 1.2 }, { k: 'svarogMarked', m: 1.2 }] },
      ult: { name: 'Обещание, а не приказ', target: 'self', fx: [{ k: 'buff', s: 'dr', v: 0.25, turns: 2, who: 'self', name: 'Обещание' }, { k: 'buff', s: 'aggro', v: 4, turns: 2, who: 'self', name: 'Обещание: внимание', quiet: true }, { k: 'promise', v: 2 }] },
      talent: 'Получает на 10% меньше урона. Врага, ударившего Клару, Сварог ставит Метку и бьёт в ответ.',
      tech: { name: 'Небольшая цена победы', text: 'Удар по всем врагам. 2 хода враги чаще бьют Клару.', fx: 'claraBait' },
      contact: [{ name: 'Позвать Сварога', tag: 'threat' }, { name: 'Спрятаться за Сварога', tag: 'silent' }]
    },
    miyabi: {
      name: 'Мияби', fullName: 'Хосими Мияби', path: 'hunt', elem: 'ice', rarity: 5, energy: 120, faction: 's6',
      base: { hp: 128, atk: 94, def: 52, spd: 104 },
      look: { skin: '#f8e2d6', hair: '#16161c', hairHi: '#20202a', eye: '#d0303e', bangs: 'blunt', sides: 'straight', back: 'hime', crown: 'smooth', body: 'f', coat: 'split', coatLen: 12, top: '#2a8a86', coatLow: '#2a8a86', lining: '#d8b850', trim: '#e8c040', inner: '#f4f4f6', collar: 'high', lower: '#1e2028', low: 'skirt', skirtLen: 29, legs: '#3e3a44', shoes: '#16161a', gloves: '#26262c', cuff: '#f2f2f6', acc: ['foxears:#16161c', 'tie:#16161c', 'obi:#1c1c24', 'goldtassel:#d8b050', 'bellsleeves:#2a8a86', 'haoritri:#f2f2f6', 'redcuff:#c8303a', 'skirtslit', 'sheath:#1e1e26', 'ankle:#16161a'] },
      basic: { name: 'Кадзахана', target: 'single', fx: [{ k: 'dmg', m: 1.0 }, { k: 'frost', v: 1 }] },
      charged: [
        { name: 'Симоцуки', lv: 1, target: 'single', fx: [{ k: 'dmg', m: 2.4, tough: 20, charged: true }] },
        { name: 'Симоцуки', lv: 2, target: 'blast', fx: [{ k: 'dmg', m: 3.2, adj: 1.2, tough: 25, charged: true }] },
        { name: 'Симоцуки', lv: 3, target: 'blast', fx: [{ k: 'dmg', m: 4.4, adj: 1.8, tough: 30, charged: true }] }
      ],
      skill: { name: 'Хисэцу', target: 'blast', fx: [{ k: 'dmg', m: 1.8, adj: 0.6 }, { k: 'frost', v: 2 }] },
      ult: { name: 'Последний снег', target: 'all', fx: [{ k: 'dmg', m: 2.2 }, { k: 'frost', v: 3 }, { k: 'buff', s: 'iceP', v: 0.3, turns: 2, who: 'self', name: 'Последний снег' }] },
      talent: 'Её лёд копит Ледяное пламя. На 3 стаках: Обморожение, взрыв холода и Ледяной ожог.',
      tech: { name: 'Цветочный ветер', text: 'В начале боя +3 Изморози и стак Ледяного пламени на всех врагах.', fx: 'miyabiTech' },
      contact: [{ name: 'Вызвать на тренировку', tag: 'threat' }, { name: 'Прочесть хайку', tag: 'sing' }]
    },
    yanagi: {
      name: 'Янаги', fullName: 'Цукисиро Янаги', path: 'nihility', elem: 'elec', rarity: 5, energy: 120, faction: 's6',
      base: { hp: 140, atk: 82, def: 60, spd: 106 },
      look: { skin: '#f8e0d4', hair: '#ea9a98', hairHi: '#f6c0bc', eye: '#b06a90', eye2: '#d8a0c0', bangs: 'sweep', sides: 'flick', back: 'long', crown: 'smooth', gloss: true, body: 'f', coat: 'closed', top: '#f4f4f6', trim: '#d8dce4', inner: '#f4f4f6', collar: 'high', lower: '#22222a', low: 'skirt', skirtLen: 9, shoes: '#1c1c22', gloves: '#1e1e24', acc: ['glasses:slim', 'headset:#2a2a32', 'bow:#1c1c22', 'waistcorset:#1c1c22', 'idbadge:#f2f2f6', 'hipruffle:#eceef4', 'skirtbuttons:#c8a050', 'spikepad:#1e1e24', 'shcape:#2a7a72', 'ankle:#1c1c22', 'naginata:#c8ccd8'] },
      basic: { name: 'Цукуёми кагура', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      enhanced: { name: 'Цукуёми кагура: Синрабансё', target: 'blast', fx: [{ k: 'dmg', m: 0.9, adj: 0.45 }] },
      skill: { name: 'Гекка рутэн', target: 'blast', fx: [{ k: 'dmg', m: 1.3, adj: 0.6 }, { k: 'polarity', m: 1 }, { k: 'dot', type: 'shock', m: 0.6, turns: 2, chance: 1 }, { k: 'stance' }, { k: 'shinra', v: 2 }, { k: 'eclipse' }] },
      ult: { name: 'Райэй тэнгэ', target: 'all', fx: [{ k: 'dmg', m: 1.4 }, { k: 'polarity', m: 1.6 }, { k: 'stance' }] },
      talent: 'С Янаги в отряде новая аномалия другого типа вызывает Хаос: старые аномалии взрываются.',
      tech: { name: 'План на крайний случай', text: 'В начале боя накладывает Шок на всех врагов.', fx: 'yanagiTech' },
      contact: [{ name: 'Оформить протокол', tag: 'science' }, { name: 'Угостить булочкой с бобами', tag: 'kind' }]
    },
    phrolova: {
      name: 'Фролова', path: 'remembrance', elem: 'quant', rarity: 5, energy: 0, notes: true, faction: 'wuwa',
      base: { hp: 124, atk: 93, def: 50, spd: 101 },
      look: { skin: '#f6e4dc', hair: '#c4d2cc', hairHi: '#eaf2ee', eye: '#c8586e', eye2: '#e8a0b0', mood: 'flat', bangs: 'sweep', sides: 'straight', back: 'braids', crown: 'smooth', gloss: true, body: 'f', coat: 'bodice', top: '#c42a38', trim: '#f4ecee', inner: '#f2eef0', neck: '#a82030', collar: 'high', lower: '#24202a', low: 'skirt', skirtLen: 7, legs: '#2e2426', shoes: '#c0202e', tailsTo: 'ankle', tailsLining: '#e8d4d8', acc: ['hairclip:#f2f2f6', 'eyepatch:#f4f2f2', 'hairorn:#c42a38', 'redlily:#d0202e', 'redsleeve:#c42a38', 'ribbonwrap:#d0303e', 'redpanels:#c42a38', 'tails:#d83a48', 'tightlines:#9a2030', 'thighharness:#c42a38', 'heelbow:#c0202e'] },
      basic: { name: 'Движение жизни и смерти', target: 'single', fx: [{ k: 'dmg', m: 1.0 }, { k: 'note', v: 'str' }] },
      enhanced: { name: 'Движение судьбы и конца', target: 'single', fx: [{ k: 'dmg', m: 1.8, tough: 15 }, { k: 'delay', v: 0.2 }, { k: 'note', v: 'str' }] },
      skill: { name: 'Шёпот мимолётного сна', target: 'blast', fx: [{ k: 'dmg', m: 1.4, adj: 0.5 }, { k: 'note', v: 'wind' }, { k: 'reinc' }] },
      cue: { name: 'Знак Гекате', target: 'single', fx: [{ k: 'dmg', m: 0.6 }, { k: 'cue' }] },
      ult: { name: 'Вальс покинутых глубин', target: 'all', fx: [{ k: 'dmg', m: 1.0 }, { k: 'maestro' }] },
      talent: 'Атаки пишут ноты. При 6 нотах Геката выходит на шкалу и играет их по две за ход.',
      tech: { name: 'Пригласительный билет', text: 'Бой начинается с двумя нотами каденции.', fx: 'phrolovaTech' },
      contact: [{ name: 'Сыграть элегию', tag: 'sing' }, { name: 'Смотреть сквозь врага', tag: 'silent' }]
    },
    scar: {
      name: 'Скар', path: 'destruction', elem: 'fire', rarity: 5, energy: 120, faction: 'wuwa',
      base: { hp: 152, atk: 90, def: 56, spd: 104 },
      look: { skin: '#f4dccc', hair: '#eeeae8', hairHi: '#ffffff', streak: '#d8283a', streakSide: 'c', streakShape: 'cthin', eye: '#d8303a', eyeL: '#9a98a4', bangs: 'messy', sides: 'feather', back: 'short', crown: 'messy', jaw: 'v', body: 'lean', sex: 'm', coat: 'jacket', top: '#c8242e', trim: '#1a181c', inner: '#bfc0c6', collar: 'high', lower: '#e6e4ea', low: 'pants', shoes: '#b01e26', gloves: '#18171b', tailsTo: 'ankle', tailsLining: '#1e1c22', acc: ['earring:#d8b050', 'facescar:#c87a7a', 'neckstraps:#c8242e', 'sleeve1:#1e1c22', 'chestpouch:#1e1c22', 'tails:#a81e28', 'legstraps2:#1e1c22', 'flarehem:#c8242e', 'boots:#b01e26'] },
      basic: { name: 'Чёрные ножи', target: 'single', fx: [{ k: 'dmg', m: 1.0 }, { k: 'ember', v: 1 }] },
      skill: { name: 'Элизиум', target: 'single', fx: [{ k: 'dmg', m: 1.6 }, { k: 'elysium', seals: 2 }] },
      nbasic: { name: 'Коса жнеца', target: 'blast', fx: [{ k: 'dmg', m: 1.4, adj: 0.7 }, { k: 'ember', v: 1 }] },
      nskill: { name: 'Элизиум кошмара', target: 'all', fx: [{ k: 'dmg', m: 0.9 }, { k: 'elysium', seals: 1 }] },
      ult: { name: 'Аберрантный кошмар', target: 'all', fx: [{ k: 'dmg', m: 2.0, e: 'quant', tough: 20 }, { k: 'nightmare' }] },
      talent: 'Элизиум ломают удары двух разных союзников. Разрыв жжёт за каждый уголь, Скар ходит раньше.',
      tech: { name: 'Спектакль начинается', text: 'Первый враг начинает бой в Элизиуме с 2 углями.', fx: 'scarTech' },
      contact: [{ name: 'Рассказать сказку о ягнятах', tag: 'joke' }, { name: 'Улыбнуться до ушей', tag: 'threat' }]
    },
    kazuma: {
      name: 'Казума', fullName: 'Сато Казума', path: 'nihility', elem: 'wind', rarity: 4, energy: 110, faction: 'axel',
      base: { hp: 128, atk: 76, def: 56, spd: 106 },
      look: { skin: '#f8dec6', hair: '#82502e', hairHi: '#a8703e', eye: '#2e8a7e', bangs: 'sweep', sides: 'jaw', back: 'short', crown: 'spiky', jaw: 'v', body: 'slim', sex: 'm', coat: 'hoodcape', top: '#25726c', lining: '#3a3c62', trim: '#e4c060', inner: '#f2f2ee', sleeve: '#b4b8c4', collar: 'lace', lower: '#484c62', low: 'pants', shoes: '#6a4632', tuck: true, acc: ['tunicbelt:#6a3c2a', 'katana:#2a2226', 'boots:#6a4632', 'bootcuff:#94704f'] },
      basic: { name: 'Прицельная стрельба', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skills: [
        { name: 'Кража', target: 'single', fx: [{ k: 'dmg', m: 1.2 }, { k: 'steal' }] },
        { name: 'Связывание', target: 'single', fx: [{ k: 'dmg', m: 0.6 }, { k: 'bind' }] },
        { name: 'Иссушающее касание', target: 'ally', noSelf: true, fx: [{ k: 'drain', m: 0.8 }] }
      ],
      skillText: 'Кража снимает усиление и щит. Связывание: враг пропустит ход. Касание: энергия союзнику.',
      ult: { name: 'Великая кража', target: 'single', fx: [{ k: 'dmg', m: 3.0, luck: 0.35, tough: 30 }, { k: 'heist' }] },
      talent: 'Крит +10%. Промах или провал союзника даёт Удачу (до 5): крит и шанс эффекта выше.',
      tech: { name: 'Скрытность', text: 'Отряд ходит раньше, Казума начинает бой с 2 Удачи.', fx: 'kazumaTech' },
      contact: [{ name: 'Камень, ножницы, бумага', tag: 'joke' }, { name: 'Сторговаться', tag: 'bribe' }]
    },
    aqua: {
      name: 'Аква', path: 'abundance', elem: 'ice', rarity: 5, energy: 110, faction: 'axel',
      base: { hp: 172, atk: 82, def: 68, spd: 99 },
      look: { skin: '#fbe2d2', hair: '#86d0f2', hairHi: '#c8f0ff', tips: '#68a4ea', tipsFade: true, tipsAt: 56, eye: '#3a78d0', eye2: '#86c4f4', bangs: 'wisp', sides: 'long', back: 'flow', crown: 'smooth', gloss: true, body: 'tallf', coat: 'sleeveless', thighTop: 6, top: '#2c3c98', trim: '#f2f4f8', inner: '#c8bcd8', neck: '#5a2e3a', collar: 'high', lower: '#2e46aa', low: 'skirt', skirtLen: 7, hem: '#f0b440', petti: '#b8a4dc', shoes: '#2e3270', cuff: '#2c3c98', acc: ['hairloop:#2c5ad8', 'gembow:#6ad89a', 'detsleeves:#f2f4f8', 'thighboots:#2e3270', 'bootvflap:#f0b440'] },
      basic: { name: 'Удар богини', target: 'single', fx: [{ k: 'dmg', m: 1.0, holy: 1.5 }, { k: 'purge' }] },
      skill: { name: 'Исцеление', target: 'ally', revive: true, fx: [{ k: 'heal', m: 0.14, flat: 40, who: 'target' }, { k: 'cleanse', who: 'target' }] },
      ult: { name: 'Священное создание воды', target: 'all', fx: [{ k: 'heal', m: 0.1, flat: 30, who: 'allies' }, { k: 'dmg', m: 1.2, holy: 1.8 }, { k: 'wet' }] },
      talent: '20% провал: слёзы усилят следующий ход. Бьёт нечисть. Навык поднимает павших за 2 очка.',
      tech: { name: 'Трюк для вечеринок', text: 'Отряд лечится на 10%, враги получают Радость +1.', fx: 'aquaTech' },
      contact: [{ name: 'Показать трюк', tag: 'sing' }, { name: 'Позвать в орден Аксис', tag: 'kind' }]
    },
    megumin: {
      name: 'Мегумин', path: 'erudition', elem: 'fire', rarity: 5, energy: 140, faction: 'axel',
      base: { hp: 118, atk: 112, def: 46, spd: 92 },
      look: { skin: '#f8e2d6', hair: '#4a2c22', hairHi: '#6a4232', eye: '#d8303a', eye2: '#e85a5a', bangs: 'wisp', sides: 'long', back: 'shoulder', crown: 'smooth', body: 'petite', bustY: 5, coat: 'dress', top: '#c8302e', trim: '#f0b030', inner: '#c8302e', collar: 'scoop', lower: '#c8302e', low: 'skirt', skirtLen: 8, shoes: '#d06a2a', gloves: '#2a2a3a', bootsTo: 'calf', stockSide: 'r', capeTrim: '#f0b030', acc: ['witchhat:#4a2c2a', 'patchl:#1a1a1e', 'choker:#c8ccd4', 'witchcape:#4a2e30', 'bigbelt:#3a2a2c', 'zigzag:#f0b030', 'ruffcuff:#f0b030', 'stocking1:#2a2632', 'legwrap:#f0ece4', 'boots:#d06a2a', 'bootcuff:#e8904a', 'mstaff:#b06a32'] },
      basic: { name: 'Удар посохом', target: 'single', fx: [{ k: 'dmg', m: 0.8, e: 'phys' }] },
      skill: { name: 'Заклинание взрыва', target: 'self', fx: [{ k: 'chant' }] },
      ult: { name: 'Взрыв!', target: 'all', fx: [{ k: 'dmg', m: 4.5, tough: 30, chant: true, anyTough: true }, { k: 'collapse' }] },
      talent: 'Взрыв бьёт по любой стойкости. Каждый Напев +35%. После Взрыва 2 хода без сил.',
      tech: { name: 'Ежедневный взрыв', text: 'Бой начинается со Взрыва, Мегумин 1 ход без сил.', fx: 'meguminTech' },
      contact: [{ name: 'Представиться по всей форме', tag: 'threat' }, { name: 'Позвать Чомусуке', tag: 'cute' }]
    },
    darkness: {
      name: 'Даркнесс', fullName: 'Дастинесс Форд Лалатина', path: 'preservation', elem: 'phys', rarity: 5, energy: 120, faction: 'axel',
      base: { hp: 186, atk: 70, def: 98, spd: 90 },
      look: { skin: '#fbe8de', hair: '#f6d870', hairHi: '#fff2b0', tips: '#f0a040', tipsFade: true, tipsAt: 58, eye: '#4a80d0', eye2: '#8ab8f0', bangs: 'wisp', sides: 'long', back: 'hightail', crown: 'smooth', gloss: true, body: 'tallf', coat: 'crusader', top: '#f8b030', trim: '#f0983a', inner: '#38363c', neck: '#38363c', collar: 'high', sleeve: '#38363c', plate: '#f2eef8', lower: '#3a383e', low: 'none', legs: '#38363c', shoes: '#e4e0ec', gloves: '#2a2a30', acc: ['xclips:#d02a3a', 'ribbonbow:#c82838', 'wingpad:#f4f2fa', 'platepad:#ece6f4', 'studbelt:#4a4044', 'gauntlets:#d07a34', 'greaves:#e8e4f0'] },
      basic: { name: 'Боковой удар', target: 'single', fx: [{ k: 'swing', m: 1.8, def: 1.0 }] },
      enhanced: { name: 'Случайно попала!', target: 'blast', fx: [{ k: 'dmg', m: 1.8, plusDef: 1.0, adj: 0.9, adjDef: 0.5, ecst: true }, { k: 'ecstasySpend' }] },
      skill: { name: 'Приманка', target: 'self', fx: [{ k: 'taunt', turns: 2, who: 'self' }, { k: 'buff', s: 'dr', v: 0.3, turns: 2, who: 'self', name: 'Приманка' }, { k: 'shield', m: 0.2, flat: 30, turns: 2, who: 'self' }] },
      ult: { name: 'Крестоносец прикроет', target: 'self', fx: [{ k: 'cover', turns: 2 }, { k: 'heal', m: 0.2, flat: 0, who: 'self' }, { k: 'ecstasy', v: 3 }, { k: 'taunt', turns: 2, who: 'self' }] },
      talent: 'Попадает только по неподвижным. Удары по ней копят Восторг, на 6 случайно попадёт.',
      tech: { name: 'В бой первой!', text: 'Враги бьют Даркнесс, она начинает с 3 Восторга.', fx: 'darknessTech' },
      contact: [{ name: 'Попросить ударить сильнее', tag: 'weird' }, { name: 'Крестоносец не отступает', tag: 'threat' }]
    }
  };
  CHARS.kazuma.skill = CHARS.kazuma.skills[0];

  const FUSIONS = {
    f_express: { name: 'Поезд отправляется!', members: ['march', 'danheng'], target: 'all', text: 'Лёд и ветер по всем врагам, шанс заморозки.', fx: [{ k: 'dmg', m: 1.6, e: 'ice', tough: 15 }, { k: 'dmg', m: 1.6, e: 'wind', tough: 15 }, { k: 'freeze', chance: 0.5 }] },
    f_photo: { name: 'Фото на память', members: ['trail', 'march'], target: 'all', text: 'Физический и ледяной удар по всем, щиты всей команде.', fx: [{ k: 'dmg', m: 1.4, e: 'phys', tough: 15 }, { k: 'dmg', m: 1.4, e: 'ice', tough: 15 }, { k: 'shield', m: 0.3, flat: 40, turns: 2, who: 'allies', statOf: 'march' }] },
    f_singularity: { name: 'Сингулярность Экспресса', members: ['himeko', 'welt'], target: 'all', text: 'Огонь и мнимый урон по всем, отбрасывает врагов на 30%.', fx: [{ k: 'dmg', m: 2.0, e: 'fire', tough: 15 }, { k: 'dmg', m: 2.0, e: 'imag', tough: 15 }, { k: 'delay', v: 0.3 }] },
    f_landau: { name: 'Семья Ландау', members: ['gepard', 'serval'], target: 'all', text: 'Молния и лёд, Шок всем врагам, щиты команде.', fx: [{ k: 'dmg', m: 1.8, e: 'elec', tough: 15, statOf: 'serval' }, { k: 'dmg', m: 1.0, e: 'ice', tough: 15 }, { k: 'dot', type: 'shock', m: 0.5, turns: 2, chance: 1 }, { k: 'shield', m: 0.3, flat: 40, turns: 2, who: 'allies', statOf: 'gepard' }] },
    f_wings: { name: 'Сломанные крылья', members: ['bronya', 'seele'], target: 'single', text: 'Сокрушительный удар Зеле, после которого она сразу ходит ещё раз.', fx: [{ k: 'dmg', m: 5.0, e: 'quant', tough: 30, statOf: 'seele' }, { k: 'dmg', m: 1.5, e: 'wind', tough: 15, statOf: 'bronya' }, { k: 'advance', v: 1, who: 'member:seele' }] },
    f_underworld: { name: 'Подземное братство', members: ['natasha', 'hook'], target: 'all', text: 'Лечит команду и поджигает всех врагов.', fx: [{ k: 'heal', m: 0.2, flat: 40, who: 'allies', statOf: 'natasha' }, { k: 'dmg', m: 1.5, e: 'fire', tough: 15, statOf: 'hook' }, { k: 'dot', type: 'burn', m: 0.4, turns: 2, chance: 1, statOf: 'hook' }] },
    f_station: { name: 'Станция «Герта»', members: ['herta', 'asta'], target: 'all', text: 'Лёд и огонь по всем, команда ходит на 25% раньше.', fx: [{ k: 'dmg', m: 2.0, e: 'ice', tough: 15, statOf: 'herta' }, { k: 'dmg', m: 1.0, e: 'fire', tough: 15, statOf: 'asta' }, { k: 'advance', v: 0.25, who: 'allies' }] },
    f_guards: { name: 'Смена караула', members: ['arlan', 'asta'], target: 'single', text: 'Мощный удар молнии, атака команды +20%.', fx: [{ k: 'dmg', m: 4.0, e: 'elec', tough: 30, statOf: 'arlan' }, { k: 'buff', s: 'atkP', v: 0.2, turns: 2, who: 'allies', name: 'Караул' }] },
    f_rumor: { name: 'Горячие новости', members: ['sampo', 'pela'], target: 'all', text: 'Ветер по всем, защита врагов −30%.', fx: [{ k: 'dmg', m: 1.8, e: 'wind', tough: 20, statOf: 'sampo' }, { k: 'debuff', s: 'defDown', v: 0.3, turns: 2, chance: 1, name: 'Разоблачение' }] },
    f_qlipoth: { name: 'Клятва Клипота', members: ['trail_p', 'bronya'], target: 'all', text: 'Огненное копьё по всем врагам, щиты команде.', fx: [{ k: 'dmg', m: 1.5, plusDef: 2.0, e: 'fire', tough: 30, statOf: 'trail_p' }, { k: 'dmg', m: 1.0, e: 'wind', tough: 15, statOf: 'bronya' }, { k: 'shield', m: 0.4, flat: 60, turns: 2, who: 'allies', statOf: 'trail_p' }] },
    f_luofu: { name: 'Гости с Лофу', members: ['yanqing', 'bailu'], target: 'single', text: 'Ледяной удар Яньцина. Байлу лечит команду и дарит Оживление.', fx: [{ k: 'dmg', m: 4.0, e: 'ice', tough: 30, statOf: 'yanqing' }, { k: 'heal', m: 0.12, flat: 30, who: 'allies', statOf: 'bailu' }, { k: 'invig', turns: 2 }] },
    f_kids: { name: 'Дети Подземья', members: ['clara', 'hook'], target: 'all', text: 'Сварог бьёт всех врагов и ставит Метки, Хук их поджигает.', fx: [{ k: 'dmg', m: 1.8, e: 'phys', tough: 20, statOf: 'clara' }, { k: 'svMark' }, { k: 'dot', type: 'burn', m: 0.4, turns: 2, chance: 1, statOf: 'hook' }] },
    f_dissonance: { name: 'Диссонанс', members: ['phrolova', 'scar'], target: 'all', text: 'Квант и огонь по всем. Геката разом играет все ноты, каждый враг в Элизиуме взрывается.', fx: [{ k: 'dmg', m: 1.6, e: 'quant', tough: 15, statOf: 'phrolova' }, { k: 'dmg', m: 1.6, e: 'fire', tough: 15, statOf: 'scar' }, { k: 'notesAll' }, { k: 'elysiumAll' }] },
    f_section6: { name: 'Секция 6', members: ['miyabi', 'yanagi'], target: 'all', text: 'Лёд и молния по всем врагам, Хаос на каждом враге с аномалией, Мияби получает 6 Изморози.', fx: [{ k: 'dmg', m: 1.6, e: 'ice', tough: 15, statOf: 'miyabi' }, { k: 'dmg', m: 1.6, e: 'elec', tough: 15, statOf: 'yanagi' }, { k: 'chaosAll' }, { k: 'frost', v: 6, who: 'member:miyabi' }] },
    f_elio: { name: 'По сценарию Элио', members: ['kafka', 'silverwolf'], target: 'all', text: 'Волк вносит всем врагам уязвимость к молнии, Кафка бьёт всех, накладывает Шок, и все DoT срабатывают.', fx: [{ k: 'implantAll', e: 'elec' }, { k: 'dmg', m: 1.4, e: 'quant', tough: 15, statOf: 'silverwolf' }, { k: 'dmg', m: 1.4, e: 'elec', tough: 15, statOf: 'kafka' }, { k: 'dot', type: 'shock', m: 0.9, turns: 2, chance: 1, statOf: 'kafka' }, { k: 'detonate', v: 'ult', statOf: 'kafka' }] },
    f_mara: { name: 'Шёпот против мары', members: ['kafka', 'blade'], target: 'blast', text: 'Смертный приговор Блэйда по цели и соседям, их DoT срабатывают. Кафка унимает мару, и Блэйд сразу бьёт Даром Шуху и лечится.', fx: [{ k: 'sentence', statOf: 'blade' }, { k: 'dmg', m: 0.5, hpM: 1.2, tallyM: 1.0, adj: 0.2, adjHp: 0.5, adjTally: 0.4, e: 'wind', tough: 30, statOf: 'blade' }, { k: 'tallyReset', statOf: 'blade' }, { k: 'detonate', v: 'skill', statOf: 'kafka' }, { k: 'shuhuFull' }] },
    f_trap: { name: 'Ледяная ловушка', members: ['kazuma', 'aqua'], target: 'all', text: 'Вода Аквы и Заморозка Казумы: лёд и ветер по всем врагам, мокрые враги замерзают. Казуме +2 Удачи.', fx: [{ k: 'dmg', m: 1.2, e: 'ice', tough: 15, statOf: 'aqua' }, { k: 'dmg', m: 1.2, e: 'wind', tough: 15, statOf: 'kazuma' }, { k: 'wet' }, { k: 'freezeWet' }, { k: 'luck', v: 2 }] },
    f_onme: { name: 'Взрыв на мне!', members: ['megumin', 'darkness'], target: 'all', text: 'Взрыв с Даркнесс в эпицентре: огонь по любой стойкости, Даркнесс в восторге тянет врагов на себя, Мегумин не падает.', fx: [{ k: 'dmg', m: 2.6, e: 'fire', tough: 30, anyTough: true, statOf: 'megumin' }, { k: 'onMe' }] },
    f_blessing: { name: 'Да будет благословенен этот прекрасный мир!', members: ['kazuma', 'aqua', 'megumin', 'darkness'], target: 'all', text: 'Весь отряд Казумы: Аква лечит и очищает, Даркнесс держит врагов, Казума подпитывает Мегумин, и её полный Взрыв бьёт по любой стойкости.', fx: [{ k: 'heal', m: 0.2, flat: 40, who: 'allies', statOf: 'aqua' }, { k: 'cleanseAll' }, { k: 'dmg', m: 4.0, e: 'fire', tough: 40, anyTough: true, statOf: 'megumin' }, { k: 'tauntTo', v: 'darkness', turns: 2 }, { k: 'luck', v: 5 }] }
  };

  const UNHOLY = ['reaver', 'eliminator', 'trampler', 'shadewalker', 'incinerator', 'prowler', 'ethereal', 'etherhound', 'doomsday', 'mimic'];

  const CONTACT = {
    voidranger: { name: 'Легион Антиматерии', react: { threat: 'eager', silent: 'happy', joke: 'angry', kind: 'angry', science: 'scared', cute: 'angry', weird: 'scared' },
      lines: { eager: '«Сила… признаю силу». Скиталец бросает трофей и исчезает в разломе.', happy: '«…» Скиталец одобрительно кивает и уходит.', angry: '«Смешно тебе?!» Скиталец в ярости!', scared: 'Скиталец не понимает ни слова и в панике отступает.', none: 'Скиталец смотрит сквозь вас.' } },
    spawn: { name: 'Фрагментум', react: { sing: 'eager', cute: 'happy', joke: 'happy', threat: 'scared', science: 'angry', bribe: 'angry', weird: 'scared' },
      lines: { eager: 'Фрагментум мерцает в такт… и оставляет кристалл.', happy: 'Фрагментум радостно искрит и растворяется в воздухе.', angry: 'Фрагментум раскаляется от злости!', scared: 'Фрагментум съёживается и улетает прочь.', none: 'Фрагментум гудит. Кажется, не понял.' } },
    automaton: { name: 'Автоматоны', react: { science: 'eager', kind: 'happy', joke: 'angry', threat: 'angry', bribe: 'scared', silent: 'none', weird: 'none' },
      lines: { eager: '«ПРОТОКОЛ ОБМЕНА ДАННЫМИ ПРИНЯТ». Автоматон выдаёт деталь.', happy: '«СОСТОЯНИЕ: ДОВОЛЕН». Автоматон уходит на подзарядку.', angry: '«ОШИБКА. ВРАЖДЕБНОСТЬ +100%»', scared: '«ОБНАРУЖЕНА НЕИЗВЕСТНАЯ ВАЛЮТА». Автоматон убегает.', none: '«…ЗАПРОС НЕ РАСПОЗНАН»' } },
    silvermane: { name: 'Среброгривые стражи', react: { kind: 'happy', bribe: 'eager', threat: 'angry', joke: 'scared', science: 'angry', cute: 'happy', weird: 'scared' },
      lines: { eager: '«Ладно… я вас не видел». Страж суёт вам паёк и уходит.', happy: '«Эх, служба…» Страж смягчается и уходит в казарму.', angry: '«Оскорбление Среброгривых!» Страж звереет.', scared: '«Ч-что?! Я доложу капитану!» Страж убегает.', none: 'Страж молча держит строй.' } },
    shade: { name: 'Тени Подземья', react: { kind: 'eager', sing: 'happy', threat: 'angry', joke: 'angry', silent: 'scared', science: 'angry', weird: 'scared' },
      lines: { eager: 'Тень вспоминает тепло… и оставляет вам находку.', happy: 'Тень покачивается под песню и тает.', angry: 'Тень наливается льдом!', scared: 'Тень теряется в тишине и уходит.', none: 'Тень не отвечает.' } },
    ethereal: { name: 'Эфириалы', react: { silent: 'eager', sing: 'happy', threat: 'scared', kind: 'angry', joke: 'angry', science: 'angry', weird: 'angry' },
      lines: { eager: 'Эфириал замирает в тишине и оставляет осколок эфира.', happy: 'Эфириал покачивается под мелодию и тает в воздухе.', angry: 'Эфириал ревёт и бросается вперёд!', scared: 'Эфириал пятится обратно к разрыву.', none: 'Эфириал смотрит пустыми глазами.' } },
    trotter: { name: 'Скакуны', react: { cute: 'happy', bribe: 'eager', threat: 'scared', joke: 'happy', kind: 'eager', weird: 'happy' },
      lines: { eager: 'Скакун выплёвывает мешочек кредитов!', happy: 'Скакун довольно хрюкает и роняет монеты.', angry: 'Скакун фыркает!', scared: 'Скакун прыгает в варп и пропадает.', none: 'Скакун жуёт что-то невидимое.' } }
  };

  const E = (o) => Object.assign({ hp: 1, atk: 1, spd: 95, tough: 20, weak: [], resist: [], exp: 1, credits: 1, drops: [] }, o);
  const ENEMIES = {
    reaver: E({ name: 'Скиталец Пустоты: Жнец', fam: 'voidranger', shape: 'ranger', col: ['#3a2450', '#c060ff'], spd: 100, weak: ['phys', 'ice', 'imag'],
      skills: [{ n: 'Рассекающий удар', w: 3, t: 'single', m: 1.1, e: 'phys' }, { n: 'Поглощение пустоты', w: 1, t: 'single', m: 1.5, e: 'quant' }], gift: 'medkit' }),
    eliminator: E({ name: 'Скиталец Пустоты: Ликвидатор', fam: 'voidranger', shape: 'ranger2', col: ['#2a2a4a', '#ff4a8a'], hp: 0.85, spd: 105, weak: ['phys', 'wind', 'quant'],
      skills: [{ n: 'Выстрел аннигиляции', w: 3, t: 'single', m: 1.2, e: 'quant' }, { n: 'Залп', w: 1, t: 'blast', m: 0.8, e: 'quant' }], gift: 'exp1' }),
    trampler: E({ name: 'Скиталец Пустоты: Топтун', fam: 'voidranger', shape: 'beast', col: ['#2a1a3a', '#a040ff'], elite: true, hp: 4, atk: 1.3, spd: 90, tough: 60, weak: ['ice', 'fire', 'imag'], exp: 3, credits: 3,
      skills: [{ n: 'Сокрушительный топот', w: 2, t: 'all', m: 0.7, e: 'phys' }, { n: 'Разящий рог', w: 3, t: 'single', m: 1.5, e: 'quant' }], gift: 'relic' }),
    flamespawn: E({ name: 'Отродье пламени', fam: 'spawn', shape: 'spawn', col: ['#8a2a10', '#ff8a30'], hp: 0.8, spd: 90, weak: ['ice', 'wind'],
      skills: [{ n: 'Язык пламени', w: 1, t: 'single', m: 1.1, e: 'fire', fx: [{ k: 'dot', type: 'burn', m: 0.3, turns: 2, chance: 0.4 }] }], gift: 'jadeSmall' }),
    frostspawn: E({ name: 'Отродье мороза', fam: 'spawn', shape: 'spawn', col: ['#2a6a8a', '#aef0ff'], hp: 0.8, spd: 90, weak: ['phys', 'fire'],
      skills: [{ n: 'Ледяной шип', w: 1, t: 'single', m: 1.0, e: 'ice', fx: [{ k: 'freeze', chance: 0.15 }] }], gift: 'jadeSmall' }),
    thunderspawn: E({ name: 'Отродье грома', fam: 'spawn', shape: 'spawn', col: ['#4a2a8a', '#d090ff'], hp: 0.8, spd: 95, weak: ['phys', 'wind', 'imag'],
      skills: [{ n: 'Разряд', w: 1, t: 'single', m: 1.1, e: 'elec', fx: [{ k: 'dot', type: 'shock', m: 0.3, turns: 2, chance: 0.4 }] }], gift: 'jadeSmall' }),
    windspawn: E({ name: 'Отродье ветра', fam: 'spawn', shape: 'spawn', col: ['#1f6a4a', '#90ffc8'], hp: 0.8, spd: 100, weak: ['fire', 'elec', 'quant'],
      skills: [{ n: 'Режущий вихрь', w: 1, t: 'single', m: 1.1, e: 'wind' }], gift: 'jadeSmall' }),
    baryon: E({ name: 'Барион', fam: 'spawn', shape: 'orb', col: ['#5a5a6a', '#e0e0ff'], hp: 0.7, spd: 88, weak: ['phys', 'ice', 'quant', 'imag'], exp: 0.8,
      skills: [{ n: 'Толчок', w: 1, t: 'single', m: 0.9, e: 'quant' }], gift: 'medkit' }),
    beetle: E({ name: 'Автоматон «Жук»', fam: 'automaton', shape: 'beetle', col: ['#5a5040', '#e0a040'], hp: 1.1, spd: 85, weak: ['fire', 'elec', 'wind'],
      skills: [{ n: 'Таран', w: 3, t: 'single', m: 1.0, e: 'phys' }, { n: 'Броня', w: 1, t: 'self', fx: [{ k: 'shieldSelf', m: 0.2 }] }], gift: 'exp1' }),
    hound: E({ name: 'Автоматон «Гончая»', fam: 'automaton', shape: 'hound', col: ['#4a4a50', '#ff6040'], hp: 0.9, spd: 110, weak: ['phys', 'fire', 'imag'],
      skills: [{ n: 'Укус', w: 3, t: 'single', m: 1.1, e: 'phys' }, { n: 'Электрозубы', w: 1, t: 'single', m: 1.3, e: 'elec' }], gift: 'medkit' }),
    spider: E({ name: 'Автоматон «Паук»', fam: 'automaton', shape: 'spider', col: ['#3a3a40', '#ff3030'], hp: 0.6, spd: 100, weak: ['phys', 'ice', 'quant'],
      skills: [{ n: 'Самоуничтожение', w: 1, t: 'blast', m: 1.6, e: 'fire', self: 'die' }], gift: 'exp1' }),
    direwolf: E({ name: 'Автоматон «Лютоволк»', fam: 'automaton', shape: 'wolf', col: ['#5a6070', '#40e0ff'], elite: true, hp: 4.2, atk: 1.3, spd: 105, tough: 70, weak: ['phys', 'fire', 'imag'], exp: 3, credits: 3,
      skills: [{ n: 'Рывок', w: 2, t: 'single', m: 1.6, e: 'phys' }, { n: 'Рёв помех', w: 1, t: 'all', m: 0.6, e: 'elec', fx: [{ k: 'debuff', s: 'spdP', v: -0.1, turns: 2, chance: 0.6, name: 'Помехи' }] }, { n: 'Прицел', w: 1, t: 'lock', next: 3, text: 'Лютоволк берёт цель на прицел!' }, { n: 'Разрывающий укус', w: 0, t: 'single', m: 2.4, e: 'phys' }], gift: 'relic' }),
    soldier: E({ name: 'Среброгривый солдат', fam: 'silvermane', shape: 'guard', col: ['#3a5aa0', '#e8e8f0'], hp: 1.05, spd: 95, weak: ['fire', 'wind', 'imag'],
      skills: [{ n: 'Удар копьём', w: 3, t: 'single', m: 1.1, e: 'phys' }, { n: 'Строй', w: 1, t: 'self', fx: [{ k: 'shieldSelf', m: 0.15 }] }], gift: 'medkit' }),
    gunner: E({ name: 'Среброгривый стрелок', fam: 'silvermane', shape: 'guard2', col: ['#3a5aa0', '#c0c8d8'], hp: 0.9, spd: 100, weak: ['phys', 'fire', 'elec'],
      skills: [{ n: 'Выстрел', w: 3, t: 'single', m: 1.2, e: 'ice' }, { n: 'Очередь', w: 1, t: 'blast', m: 0.8, e: 'ice' }], gift: 'exp1' }),
    cannoneer: E({ name: 'Среброгривый канонир', fam: 'silvermane', shape: 'guard3', col: ['#2a4a8a', '#f0d890'], elite: true, hp: 3.8, atk: 1.25, spd: 92, tough: 60, weak: ['ice', 'elec', 'wind'], exp: 3, credits: 3,
      skills: [{ n: 'Наводка', w: 1, t: 'lock', next: 1 }, { n: 'Залп картечью', w: 0, t: 'all', m: 1.2, e: 'fire' }, { n: 'Прикладом', w: 2, t: 'single', m: 1.3, e: 'phys' }], gift: 'relic' }),
    lieutenant: E({ name: 'Среброгривый лейтенант', fam: 'silvermane', shape: 'guard3', col: ['#1f3a7a', '#e8e8f0'], elite: true, hp: 4, atk: 1.3, spd: 100, tough: 70, weak: ['fire', 'wind', 'quant'], exp: 3, credits: 3,
      skills: [{ n: 'Приказ к атаке', w: 1, t: 'rally' }, { n: 'Рубящий удар', w: 3, t: 'single', m: 1.5, e: 'phys' }, { n: 'Вьюга клинков', w: 1, t: 'all', m: 0.7, e: 'ice' }], gift: 'relic' }),
    vagrant: E({ name: 'Бродяга', fam: 'shade', shape: 'vagrant', col: ['#4a4040', '#a0e0ff'], hp: 1.1, spd: 92, weak: ['phys', 'fire', 'wind'],
      skills: [{ n: 'Удар киркой', w: 3, t: 'single', m: 1.2, e: 'phys' }, { n: 'Стон мерзлоты', w: 1, t: 'single', m: 0.9, e: 'ice', fx: [{ k: 'freeze', chance: 0.2 }] }], gift: 'medkit' }),
    shadewalker: E({ name: 'Теневой странник Вечной зимы', fam: 'shade', shape: 'shade', col: ['#1a2a3a', '#8ae0ff'], hp: 1.4, atk: 1.1, spd: 100, tough: 30, weak: ['phys', 'fire', 'imag'], exp: 1.3,
      skills: [{ n: 'Ледяной клинок', w: 3, t: 'single', m: 1.3, e: 'ice' }, { n: 'Метель', w: 1, t: 'all', m: 0.6, e: 'ice', fx: [{ k: 'freeze', chance: 0.15 }] }], gift: 'exp1' }),
    incinerator: E({ name: 'Испепеляющий теневой странник', fam: 'shade', shape: 'shade', col: ['#3a1a1a', '#ff8a40'], hp: 1.4, atk: 1.1, spd: 100, tough: 30, weak: ['phys', 'ice', 'quant'], exp: 1.3,
      skills: [{ n: 'Клинок пепла', w: 3, t: 'single', m: 1.3, e: 'fire', fx: [{ k: 'dot', type: 'burn', m: 0.3, turns: 2, chance: 0.5 }] }, { n: 'Огненный вал', w: 1, t: 'all', m: 0.6, e: 'fire' }], gift: 'exp1' }),
    prowler: E({ name: 'Ледяной рыскарь', fam: 'shade', shape: 'prowler', col: ['#2a4a6a', '#c0f4ff'], elite: true, hp: 5, atk: 1.35, spd: 102, tough: 80, weak: ['phys', 'fire', 'elec'], exp: 3.5, credits: 3,
      skills: [{ n: 'Ледяной укус', w: 3, t: 'single', m: 1.6, e: 'ice', fx: [{ k: 'freeze', chance: 0.3 }] }, { n: 'Белая мгла', w: 1, t: 'all', m: 0.8, e: 'ice' }], gift: 'relic' }),
    iceout: E({ name: 'Лёд из космоса', fam: 'spawn', shape: 'crystal', col: ['#6ab8e0', '#ffffff'], hp: 1.2, spd: 90, tough: 30, weak: ['fire', 'elec', 'quant'],
      skills: [{ n: 'Осколочный дождь', w: 1, t: 'blast', m: 0.9, e: 'ice' }], gift: 'jadeSmall' }),
    blazeout: E({ name: 'Огонь из космоса', fam: 'spawn', shape: 'crystal', col: ['#e0602a', '#fff0c0'], hp: 1.2, spd: 92, tough: 30, weak: ['ice', 'wind', 'quant'],
      skills: [{ n: 'Огненный дождь', w: 1, t: 'blast', m: 0.9, e: 'fire', fx: [{ k: 'dot', type: 'burn', m: 0.3, turns: 2, chance: 0.35 }] }], gift: 'jadeSmall' }),
    trotter: E({ name: 'Скакун-прыгун', fam: 'trotter', shape: 'trotter', col: ['#e8c040', '#fff0a0'], hp: 1.6, atk: 0.2, spd: 110, tough: 30, weak: ['phys', 'fire', 'ice', 'elec', 'wind', 'quant', 'imag'], exp: 2, credits: 12,
      skills: [{ n: 'Хрюк', w: 1, t: 'self' }], flee: 3, gift: 'credits' }),
    iceedge: E({ name: 'Ледяная грань', fam: 'spawn', shape: 'crystal', col: ['#4a90c0', '#e0f8ff'], hp: 1.2, spd: 90, tough: 20, weak: ['fire', 'phys', 'elec'], exp: 0.3, credits: 0,
      skills: [{ n: 'Осколок', w: 1, t: 'single', m: 1.0, e: 'ice' }], noContact: true }),
    doomsday: E({ name: 'Зверь Судного дня', fam: 'boss', shape: 'doomsday', col: ['#2a1a3a', '#b050ff'], boss: true, hp: 11, atk: 1.4, spd: 90, tough: 160, weak: ['phys', 'ice', 'fire'], resist: ['quant'], exp: 10, credits: 10, noContact: true,
      skills: [{ n: 'Удар хвостом', t: 'single', m: 1.5, e: 'phys' }, { n: 'Зов Легиона', t: 'summon', summon: ['reaver', 'eliminator'], max: 3 }, { n: 'Сбор антиматерии', t: 'charge', next: 3, text: 'Зверь копит антиматерию! Пробейте его уязвимость!' }, { n: 'Неизбежная гибель', t: 'all', m: 1.8, e: 'quant' }, { n: 'Пожирание', t: 'blast', m: 1.1, e: 'quant' }],
      pat: [0, 4, 1, 2, 0, 4, 2, 1] }),
    gepard_b: E({ name: 'Гепард, капитан Среброгривых', fam: 'boss', shape: 'gepard', col: ['#3a5aa0', '#f0d890'], boss: true, hp: 12, atk: 1.35, spd: 95, tough: 150, weak: ['fire', 'phys', 'wind'], resist: ['ice'], exp: 12, credits: 10, noContact: true,
      skills: [{ n: 'Кулак убеждения', t: 'single', m: 1.5, e: 'ice', fx: [{ k: 'freeze', chance: 0.25 }] }, { n: 'Ледяной вал', t: 'all', m: 0.8, e: 'ice' }, { n: 'Несокрушимый гарнизон', t: 'self', fx: [{ k: 'shieldSelf', m: 0.18 }], text: 'Гепард поднимает щит! Пробейте уязвимость, чтобы снять его.' }, { n: 'Клятва Среброгривых', t: 'charge', next: 4, text: 'Гепард готовит сокрушительный удар!' }, { n: 'Кара Среброгривых', t: 'single', m: 2.6, e: 'ice' }],
      pat: [0, 1, 2, 0, 3, 1, 0, 2] }),
    grizzly: E({ name: 'Автоматон «Гризли»', fam: 'boss', shape: 'grizzly', col: ['#5a5a4a', '#ff7030'], boss: true, hp: 13, atk: 2.0, spd: 92, tough: 170, weak: ['phys', 'ice', 'imag'], resist: ['elec'], exp: 13, credits: 12, noContact: true,
      skills: [{ n: 'Удар лапой', t: 'single', m: 1.5, e: 'phys' }, { n: 'Сборка роя', t: 'summon', summon: ['beetle', 'spider'], max: 3 }, { n: 'Захват цели', t: 'lock', next: 3, text: 'Гризли навёл прицел! Укройтесь щитом!' }, { n: 'Сокрушение', t: 'single', m: 3.0, e: 'phys', splash: 0.6 }, { n: 'Землетрясение', t: 'all', m: 0.9, e: 'phys' }],
      pat: [0, 1, 2, 4, 0, 2, 1, 4] }),
    svarog_b: E({ name: 'Сварог', fam: 'boss', shape: 'svarog', col: ['#4a4c8a', '#ff2e8e'], boss: true, hp: 14, atk: 2.0, spd: 94, tough: 180, weak: ['fire', 'ice', 'imag'], resist: ['elec'], exp: 14, credits: 12, noContact: true,
      skills: [{ n: 'Удар манипулятором', t: 'single', m: 1.5, e: 'phys' }, { n: 'Вызов охраны', t: 'summon', summon: ['hound', 'beetle'], max: 3 }, { n: 'Анализ угрозы', t: 'lock', next: 3, text: 'Сварог рассчитал цель! Укройтесь щитом!' }, { n: 'Прицельная бомбардировка', t: 'single', m: 2.8, e: 'elec', splash: 0.5 }, { n: 'Протокол подавления', t: 'all', m: 0.9, e: 'elec' }],
      pat: [0, 1, 2, 4, 0, 2, 1, 4] }),
    ethereal: E({ name: 'Эфириал', fam: 'ethereal', shape: 'ethereal', col: ['#141218', '#ff5a2a'], hp: 1.2, atk: 1.1, spd: 98, tough: 30, weak: ['ice', 'elec', 'phys'], exp: 1.2,
      skills: [{ n: 'Удар когтями', w: 3, t: 'single', m: 1.2, e: 'phys' }, { n: 'Эфирный выброс', w: 1, t: 'blast', m: 0.9, e: 'quant' }], gift: 'medkit' }),
    etherhound: E({ name: 'Эфириал-гончая', fam: 'ethereal', shape: 'etherhound', col: ['#141218', '#ff7a3a'], elite: true, hp: 3.2, atk: 1.25, spd: 108, tough: 60, weak: ['ice', 'elec', 'fire'], exp: 2.5, credits: 2,
      skills: [{ n: 'Прыжок из тени', w: 3, t: 'single', m: 1.3, e: 'phys' }, { n: 'Вой каверны', w: 1, t: 'all', m: 0.7, e: 'quant' }], gift: 'relic' }),
    mimic: E({ name: 'Подражатель', fam: 'boss', shape: 'mimic', col: ['#1a1028', '#ff7a3a'], boss: true, hp: 15, atk: 2.1, spd: 102, tough: 170, weak: ['ice', 'elec', 'imag'], resist: ['quant'], exp: 15, credits: 14, noContact: true,
      skills: [{ n: 'Чужой голос', t: 'single', m: 1.4, e: 'quant', fx: [{ k: 'debuff', s: 'dmgDealtDown', v: 0.2, turns: 2, chance: 0.7, name: 'Сомнение' }] }, { n: 'Эфирная буря', t: 'all', m: 0.85, e: 'quant' }, { n: 'Зов каверны', t: 'summon', summon: ['ethereal', 'ethereal'], max: 3 }, { n: 'Вдох', t: 'charge', next: 4, text: 'Подражатель набирает в грудь чужой голос!' }, { n: 'Крик потерянных', t: 'all', m: 1.6, e: 'quant' }],
      pat: [0, 1, 2, 0, 3, 1, 0, 2] }),
    cocolia1: E({ name: 'Коколия, Верховный хранитель', fam: 'boss', shape: 'cocolia', col: ['#3a4a8a', '#c0d8ff'], boss: true, hp: 14, atk: 2.0, spd: 104, tough: 160, weak: ['fire', 'elec', 'quant'], resist: ['ice', 'phys', 'wind'], exp: 12, credits: 12, noContact: true,
      skills: [{ n: 'Лезвие стужи', t: 'single', m: 1.5, e: 'ice', fx: [{ k: 'freeze', chance: 0.3 }] }, { n: 'Надвигающаяся вьюга', t: 'all', m: 0.8, e: 'ice' }, { n: 'Призыв Ледяной грани', t: 'summon', summon: ['iceedge', 'iceedge'], max: 3 }, { n: 'Холодный приговор', t: 'blast', m: 1.2, e: 'ice' }],
      pat: [0, 2, 1, 3, 0, 1, 2, 3] }),
    cocolia2: E({ name: 'Коколия, Мать обмана', fam: 'boss', shape: 'cocolia2', col: ['#1a2a5a', '#e0f0ff'], boss: true, hp: 20, atk: 2.2, spd: 108, tough: 200, weak: ['fire', 'elec', 'quant'], resist: ['ice', 'phys', 'wind'], exp: 20, credits: 20, noContact: true,
      skills: [{ n: 'Лезвие стужи', t: 'single', m: 1.6, e: 'ice', fx: [{ k: 'freeze', chance: 0.35 }] }, { n: 'Копьё Вечной мерзлоты', t: 'lock', next: 2, text: 'Копьё нацелено! Нужны щиты и лечение!' }, { n: 'Гнев Зимы', t: 'all', m: 1.6, e: 'ice', lockBonus: 1.2 }, { n: 'Призыв Ледяной грани', t: 'summon', summon: ['iceedge', 'iceedge'], max: 3 }, { n: 'Шёпот Стелларона', t: 'all', m: 0.7, e: 'quant', fx: [{ k: 'debuff', s: 'atkP', v: -0.2, turns: 2, chance: 0.6, name: 'Шёпот' }] }],
      pat: [0, 3, 1, 4, 0, 1, 3, 4] })
  };

  for (const [id, e] of Object.entries(ENEMIES)) e.id = id;

  const BOSS_JADE = { doomsday: 150, gepard_b: 150, grizzly: 150, svarog_b: 150, cocolia1: 100, cocolia2: 300, mimic: 100 };

  const ITEMS = {
    medkit: { name: 'Аптечка Среброгривых', kind: 'food', rar: 2, price: 150, text: 'Восстанавливает 35% HP одному персонажу.', use: { heal: 0.35 } },
    soup: { name: 'Суп из снежного краба', kind: 'food', rar: 3, price: 320, text: 'Восстанавливает 25% HP всей команде.', use: { healAll: 0.25 } },
    pie: { name: 'Пирог тётушки Олега', kind: 'food', rar: 3, price: 520, text: 'Восстанавливает 45% HP всей команде.', use: { healAll: 0.45 } },
    revive: { name: 'Капсула реанимации', kind: 'food', rar: 4, price: 600, text: 'Поднимает павшего союзника с 30% HP.', use: { revive: 0.3 } },
    coffee: { name: 'Кофе «Белобог»', kind: 'food', rar: 2, price: 220, text: 'Восстанавливает 2 очка техники.', use: { tp: 2 } },
    hotpot: { name: 'Жаркое Подземья', kind: 'food', rar: 3, price: 280, text: 'В следующем бою атака команды +15%.', use: { nextAtk: 0.15 } },
    lunch: { name: 'Бизнес-ланч космической станции', kind: 'food', rar: 2, price: 280, text: 'Обед из раздатчика станции: рис, котлета и компот. Восстанавливает 30% HP всей команде.', use: { healAll: 0.3 } },
    friedrice: { name: 'Космический жареный рис', kind: 'food', rar: 3, price: 520, text: 'Коронное блюдо робота № 123. В следующем бою шанс крита команды +12%.', use: { nextCrit: 0.12 } },
    thermos: { name: 'Термос Среброгривых', kind: 'food', rar: 2, price: 260, text: 'Крепкий чай с караульного поста. Одному персонажу +25% энергии.', use: { energy: 0.25 } },
    sbiten: { name: 'Сбитень на всю смену', kind: 'food', rar: 3, price: 480, text: 'Горячий сбитень из шахтёрского котла. Всей команде +15% энергии.', use: { energyAll: 0.15 } },
    spark: { name: 'Искра геоядра', kind: 'food', rar: 4, price: 900, text: 'Осколок геоядра в медной оправе. Одному персонажу +60% энергии.', use: { energy: 0.6 } },
    fuel: { name: 'Топливо Экспресса', kind: 'food', rar: 4, price: 0, text: 'Восстанавливает 60 энергии освоения.', use: { power: 60 } },
    exp1: { name: 'Путеводитель путешественника', kind: 'exp', rar: 2, price: 300, text: '+150 опыта одному персонажу.', use: { exp: 150 } },
    exp2: { name: 'Опыт первопроходца', kind: 'exp', rar: 3, price: 1100, text: '+700 опыта одному персонажу.', use: { exp: 700 } },
    exp3: { name: 'Мудрость странника', kind: 'exp', rar: 4, price: 3000, text: '+2500 опыта одному персонажу.', use: { exp: 2500 } },
    pass: { name: 'Звёздный пропуск', kind: 'key', rar: 5, price: 0, text: 'Билет для стандартного прыжка «Путь Первопроходцев».' },
    tape: { name: 'Шифрокопия', kind: 'key', rar: 5, price: 0, text: 'Видеокассета с зашифрованной записью. Билет для поиска сигнала на выделенном канале и канале амплификаторов.' },
    rtide: { name: 'Сияющий прилив', kind: 'key', rar: 5, price: 0, text: '«Над волнами я зову, и рябь сияет в ответ. Ты придёшь, как обещано, и в волнах сойдутся наши пути». Билет призыва резонатора.' },
    ftide: { name: 'Кующий прилив', kind: 'key', rar: 5, price: 0, text: '«Над волнами я зову, и рябь сияет в ответ. С тобой, мой клинок, я поднимусь, и в волнах наша связь не кончится». Билет призыва оружия.' },
    mana: { name: 'Манатит высшей пробы', kind: 'key', rar: 5, price: 0, text: 'Кристалл чистой маны из лавки Виз в Акселе. Один кристалл, один Взрыв. Билет набора в отряд Гильдии искателей приключений.' },
    spass: { name: 'Особый звёздный пропуск', kind: 'key', rar: 5, price: 0, text: 'Билет для прыжков события: выбранного героя и его светового конуса.' },
    fuse: { name: 'Предохранитель станции', kind: 'key', rar: 3, price: 0, text: 'Запасной предохранитель из Зоны хранения.' },
    hook_badge: { name: 'Значок «Кротов»', kind: 'key', rar: 3, price: 0, text: 'Потерянный значок банды Хук.' },
    geo_core: { name: 'Геоядро', kind: 'key', rar: 4, price: 0, text: 'Тёплое ядро из Великой шахты. Нужно Сварогу.' },
    serval_pick: { name: 'Медиатор Сервал', kind: 'key', rar: 4, price: 0, text: 'Медиатор для гитары. На нём выцарапано «Г.».' },
    findie: { name: 'Находюша', kind: 'key', rar: 4, price: 0, text: 'Домашний искатель предметов. Пищит над тайниками и любит поговорить. Подарок Сампо.' },
    detector: { name: 'Детектор жил', kind: 'key', rar: 4, price: 0, text: 'Древняя реликвия Ферсмана. Чует жилы геоядра, но зонд у неё сломан.' },
    marbles: { name: 'Банка стеклянных шариков', kind: 'key', rar: 3, price: 0, text: 'Сокровище Джулиана. Этими шариками он выиграл турнир у городских детей.' },
    rusty_key: { name: 'Ржавый ключ', kind: 'key', rar: 2, price: 0, text: 'Лежал рядом с шариками. От чего он, знает только Джулиан.' },
    capsule: { name: 'Капсула времени Джулиана', kind: 'key', rar: 3, price: 0, text: 'На крышке написано: «Джулиану через пятьдесят лет». Открывать рано.' },
    junjun: { name: 'Цзюнь-Цзюнь', kind: 'key', rar: 4, price: 0, text: 'Большой плюшевый медведь Хук. Наташа сшила его в награду за месяц примерного поведения.' },
    pamphlet: { name: 'Листовка аукциона', kind: 'key', rar: 2, price: 0, text: 'Реклама аукциона подержанных вещей «Дикого огня» в лагере бродяг.' },
    probe: { name: 'Зонд геоядра', kind: 'key', rar: 4, price: 0, text: 'Деталь древнего детектора жил. Редкая вещь: на торгах за неё дают сотни щитов.' }
  };

  const CONES = {
    arrows: { name: 'Стрелы', path: 'hunt', rarity: 3, stats: { hp: 38, atk: 21, def: 12 }, bonus: { critR: 0.12 }, text: 'Шанс крит. попадания +12%.' },
    collapsing: { name: 'Рушащееся небо', path: 'destruction', rarity: 3, stats: { hp: 38, atk: 21, def: 12 }, bonus: { dmgP: 0.2 }, text: 'Урон +20%.' },
    amber: { name: 'Янтарь', path: 'preservation', rarity: 3, stats: { hp: 38, atk: 16, def: 18 }, bonus: { defP: 0.16 }, text: 'Защита +16%.' },
    void: { name: 'Пустота', path: 'nihility', rarity: 3, stats: { hp: 38, atk: 21, def: 12 }, bonus: { ehr: 0.2 }, text: 'Шанс эффекта +20%.' },
    chorus: { name: 'Хор', path: 'harmony', rarity: 3, stats: { hp: 38, atk: 16, def: 15 }, bonus: { atkP: 0.1 }, text: 'Атака +10%.' },
    databank: { name: 'Банк данных', path: 'erudition', rarity: 3, stats: { hp: 38, atk: 21, def: 12 }, bonus: { ultP: 0.28 }, text: 'Урон абсолютной техники +28%.' },
    cornucopia: { name: 'Рог изобилия', path: 'abundance', rarity: 3, stats: { hp: 46, atk: 16, def: 12 }, bonus: { healP: 0.12 }, text: 'Исходящее лечение +12%.' },
    trend: { name: 'Тренд вселенского рынка', path: 'preservation', rarity: 4, stats: { hp: 48, atk: 16, def: 24 }, bonus: { defP: 0.24, ehr: 0.1 }, text: 'Защита +24%, шанс эффекта +10%.' },
    swordplay: { name: 'Фехтование', path: 'hunt', rarity: 4, stats: { hp: 43, atk: 24, def: 15 }, bonus: { dmgP: 0.24 }, text: 'Урон +24%.' },
    underthesky: { name: 'Под синим небом', path: 'destruction', rarity: 4, stats: { hp: 43, atk: 24, def: 15 }, bonus: { atkP: 0.16, critR: 0.12 }, text: 'Атака +16%, шанс крита +12%.' },
    geniuses: { name: 'Отдых гениев', path: 'erudition', rarity: 4, stats: { hp: 43, atk: 24, def: 15 }, bonus: { atkP: 0.16, critD: 0.24 }, text: 'Атака +16%, крит. урон +24%.' },
    memories: { name: 'Воспоминания', path: 'harmony', rarity: 4, stats: { hp: 43, atk: 21, def: 18 }, bonus: { err: 0.16, atkP: 0.08 }, text: 'Восстановление энергии +16%, атака +8%.' },
    goodnight: { name: 'Спокойной ночи', path: 'nihility', rarity: 4, stats: { hp: 43, atk: 24, def: 15 }, bonus: { dmgP: 0.18, ehr: 0.1 }, text: 'Урон +18%, шанс эффекта +10%.' },
    postop: { name: 'Послеоперационный разговор', path: 'abundance', rarity: 4, stats: { hp: 50, atk: 21, def: 15 }, bonus: { healP: 0.2, err: 0.08 }, text: 'Лечение +20%, восстановление энергии +8%.' },
    milkyway: { name: 'Ночь на Млечном пути', path: 'erudition', rarity: 5, stats: { hp: 53, atk: 29, def: 21 }, bonus: { atkP: 0.27, dmgP: 0.15 }, text: 'Атака +27%, урон +15%.' },
    butthebattle: { name: 'Но битва не окончена', path: 'harmony', rarity: 5, stats: { hp: 53, atk: 24, def: 24 }, bonus: { err: 0.1, dmgP: 0.3 }, text: 'Восстановление энергии +10%, урон +30%.' },
    moment: { name: 'Момент победы', path: 'preservation', rarity: 5, stats: { hp: 53, atk: 21, def: 30 }, bonus: { defP: 0.24, res: 0.2 }, text: 'Защита +24%, сопротивление эффектам +20%.' },
    mirror: { name: 'Прошлое „я“ в зеркале', path: 'harmony', rarity: 5, stats: { hp: 53, atk: 26, def: 24 }, bonus: { breakE: 0.6 }, sig: 'ruanmei', fx: 'mirror', text: 'Эффект пробития +60%. После абсолютной техники урон команды +24% на 3 хода. В начале боя команда получает 10 энергии.' },
    night: { name: 'В ночи', path: 'hunt', rarity: 5, stats: { hp: 48, atk: 31, def: 18 }, bonus: { critR: 0.18 }, sig: 'seele', fx: 'night', text: 'Шанс крита +18%. За каждые 10 скорости выше 100: урон атаки и навыка +6%, крит. урон абсолютной +12% (до 6 раз).' },
    shrine: { name: 'Храм вьюги', path: 'hunt', rarity: 5, stats: { hp: 48, atk: 31, def: 18 }, bonus: { critD: 0.36 }, sig: 'miyabi', fx: 'shrine', text: 'Крит. урон +36%. После навыка или абсолютной техники ледяной урон +18% на 2 хода (до 2 раз).' },
    weaver: { name: 'Ткач времени', path: 'nihility', rarity: 5, stats: { hp: 53, atk: 26, def: 24 }, bonus: { ehr: 0.24 }, sig: 'yanagi', fx: 'weaver', text: 'Шанс эффекта +24%. Урон Хаоса и Сбитой полярности, которые вызывает владелец, +30%.' },
    lethe: { name: 'Летейская элегия', path: 'remembrance', rarity: 5, stats: { hp: 48, atk: 31, def: 18 }, bonus: { atkP: 0.12, critR: 0.08 }, sig: 'phrolova', fx: 'lethe', text: 'Атака +12%, шанс крита +8%. После удара Гекаты урон +32% и игнор 8% защиты на 2 хода.' },
    lullaby: { name: 'Колыбельная для ягнят', path: 'destruction', rarity: 5, stats: { hp: 53, atk: 29, def: 18 }, bonus: { critD: 0.36 }, sig: 'scar', fx: 'lullaby', text: 'Крит. урон +36%. Разрыв Элизиума наносит на 30% больше, затем атака +24% на 2 хода.' },
    patience: { name: 'Просто надо подождать', path: 'nihility', rarity: 5, stats: { hp: 48, atk: 26, def: 21 }, bonus: { dmgP: 0.24 }, sig: 'kafka', fx: 'patience', text: 'Урон +24%. Каждая атака: скорость +4,8% (до 3 раз). Удар накладывает Паутинку: электрический урон 60% атаки в начале хода врага.' },
    rain: { name: 'Непрекращающийся дождь', path: 'nihility', rarity: 5, stats: { hp: 48, atk: 26, def: 21 }, bonus: { ehr: 0.24 }, sig: 'silverwolf', fx: 'rain', text: 'Шанс эффекта +24%. Крит +12% по врагу с 3 ослаблениями. Атака с шансом 65% вносит Эфирный код: получаемый урон +12%.' },
    unreachable: { name: 'Недоступная сторона', path: 'destruction', rarity: 5, stats: { hp: 57, atk: 26, def: 15 }, bonus: { critR: 0.18, hpP: 0.18 }, sig: 'blade', fx: 'unreachable', text: 'Шанс крита +18%, макс. HP +18%. После удара по владельцу или траты HP его урон +24% до следующей атаки.' },
    chunchunmaru: { name: 'Чунчунмару', path: 'nihility', rarity: 4, stats: { hp: 43, atk: 24, def: 15 }, bonus: { critR: 0.08, ehr: 0.12 }, sig: 'kazuma', fx: 'chunchun', text: 'Шанс крита +8%, шанс эффекта +12%. Урон +3% за каждую Удачу владельца. После удачной Кражи или Связывания следующая атака наносит на 20% больше.' },
    hagoromo: { name: 'Перьевая мантия', path: 'abundance', rarity: 5, stats: { hp: 57, atk: 21, def: 21 }, bonus: { hpP: 0.16, healP: 0.16 }, sig: 'aqua', fx: 'hagoromo', text: 'Макс. HP +16%, исходящее лечение +16%. Вылеченный союзник получает сопротивление эффектам +20% на 2 хода. Провал больше не урезает лечение владельца.' },
    manastaff: { name: 'Посох с манатитом', path: 'erudition', rarity: 5, stats: { hp: 48, atk: 31, def: 18 }, bonus: { atkP: 0.24 }, sig: 'megumin', fx: 'manastaff', text: 'Атака +24%. Каждый Напев усиливает Взрыв ещё на 10%. «Без сил» после абсолютной техники длится на 1 ход меньше.' },
    adamantite: { name: 'Адамантитовые доспехи', path: 'preservation', rarity: 5, stats: { hp: 53, atk: 21, def: 30 }, bonus: { defP: 0.28 }, sig: 'darkness', fx: 'adamant', text: 'Защита +28%. Урон отряда +2% за каждый Восторг владельца, до 12%. Когда кончается Прикрытие, весь отряд получает щит на 2 хода.' },
    masquerade: { name: 'Вальс в маскараде', path: 'remembrance', rarity: 4, stats: { hp: 43, atk: 24, def: 15 }, bonus: { atkP: 0.16, dmgP: 0.12 }, text: 'Атака +16%, урон +12%.' },
    sword_rumor: { name: 'Клинок из слухов', path: 'destruction', rarity: 4, stats: { hp: 43, atk: 26, def: 14 }, bonus: { atkP: 0.2, breakE: 0.2 }, text: 'Атака +20%, эффект пробития +20%.' }
  };

  const RELIC_SETS = {
    passerby: { name: 'Прохожий-скиталец', bonus: { healP: 0.1 } },
    musketeer: { name: 'Мушкетёр дикого пшеничного поля', bonus: { atkP: 0.12 } },
    knight: { name: 'Рыцарь обители', bonus: { defP: 0.15 } },
    thief: { name: 'Вор падающих метеоров', bonus: { breakE: 0.16 } },
    firesmith: { name: 'Огненный кузнец', bonus: { fireP: 0.1 } },
    glacial: { name: 'Охотник ледяного леса', bonus: { iceP: 0.1 } },
    thunder: { name: 'Оркестр грома', bonus: { elecP: 0.1 } },
    eagle: { name: 'Орёл сумеречной линии', bonus: { windP: 0.1 } },
    genius: { name: 'Гений блестящих звёзд', bonus: { quantP: 0.1 } },
    wastelander: { name: 'Житель пустошей', bonus: { imagP: 0.1 } },
    champion: { name: 'Чемпион уличных боёв', bonus: { physP: 0.1 } },
    station: { name: 'Запечатывающая космос станция', planar: true, bonus: { atkP: 0.12 }, cond: { s: 'spd', v: 120, bonus: { atkP: 0.12 } },
      pieces: { sphere: 'Космическая станция «Герта»', rope: 'Орбита скитаний «Герты»' },
      text: 'Атака +12%. При скорости 120 и выше атака повышается ещё на 12%.', short: 'Атака +12%, при скорости 120+ ещё +12%' },
    vonwacq: { name: 'Живой Вонвак', planar: true, bonus: { err: 0.05 }, cond: { s: 'spd', v: 120, fx: 'vonwacq' },
      pieces: { sphere: 'Остров рождения Вонвака', rope: 'Островное побережье Вонвака' },
      text: 'Восстановление энергии +5%. При скорости 120 и выше в начале боя действие продвигается вперёд на 40%.', short: 'Восст. энергии +5%, при скорости 120+ первый ход на 40% раньше' },
    salsotto: { name: 'Замершее Салсотто', planar: true, bonus: { critR: 0.08 }, cond: { s: 'critR', v: 0.5, fx: 'salsotto' },
      pieces: { sphere: 'Движущийся город Салсотто', rope: 'Линия терминатора Салсотто' },
      text: 'Шанс крита +8%. При шансе крита 50% и выше урон абсолютной техники и бонус-атак повышается на 15%.', short: 'Шанс крита +8%, при крите 50%+ урон абс. и бонус-атак +15%' }
  };
  const ELEM_MAINS = ['physP', 'fireP', 'iceP', 'elecP', 'windP', 'quantP', 'imagP'];
  const RELIC_SLOTS = [
    { key: 'head', name: 'Голова', kind: 'cavern', mains: ['hpF'] },
    { key: 'hands', name: 'Руки', kind: 'cavern', mains: ['atkF'] },
    { key: 'body', name: 'Тело', kind: 'cavern', mains: ['hpP', 'atkP', 'defP', 'critR', 'critD', 'healP', 'ehr'] },
    { key: 'feet', name: 'Ноги', kind: 'cavern', mains: ['hpP', 'atkP', 'defP', 'spd'] },
    { key: 'sphere', name: 'Сфера', full: 'Планарная сфера', kind: 'planar', mains: ['hpP', 'atkP', 'defP'].concat(ELEM_MAINS) },
    { key: 'rope', name: 'Вязь', full: 'Соединительная вязь', kind: 'planar', mains: ['hpP', 'atkP', 'defP', 'breakE', 'err'] }
  ];
  const CAVERN_SLOTS = RELIC_SLOTS.filter(s => s.kind === 'cavern');
  const PLANAR_SLOTS = RELIC_SLOTS.filter(s => s.kind === 'planar');
  const CAVERN_SETS = Object.keys(RELIC_SETS).filter(k => !RELIC_SETS[k].planar);
  const PLANAR_SETS = Object.keys(RELIC_SETS).filter(k => RELIC_SETS[k].planar);
  const STAT_NAMES = {
    hpF: 'HP', atkF: 'Атака', defF: 'Защита', hpP: 'HP%', atkP: 'Атака%', defP: 'Защита%', spd: 'Скорость', critR: 'Шанс крита', critD: 'Крит. урон',
    healP: 'Лечение', ehr: 'Шанс эффекта', res: 'Сопр. эффектам', breakE: 'Эффект пробития', err: 'Восст. энергии', dmgP: 'Урон', ultP: 'Урон абс.',
    physP: 'Физ. урон', fireP: 'Огн. урон', iceP: 'Лёд. урон', elecP: 'Элк. урон', windP: 'Втр. урон', quantP: 'Квн. урон', imagP: 'Мнм. урон'
  };
  const STAT_ROLL = { hpF: [30, 1], atkF: [15, 1], defF: [15, 1], hpP: [0.043, 0], atkP: [0.043, 0], defP: [0.054, 0], spd: [2.3, 0], critR: [0.032, 0], critD: [0.065, 0], ehr: [0.043, 0], res: [0.043, 0], breakE: [0.065, 0], healP: [0.05, 0] };
  const MAIN_VALUE = { hpF: [60, 18], atkF: [30, 9], hpP: [0.07, 0.02], atkP: [0.07, 0.02], defP: [0.087, 0.025], critR: [0.052, 0.015], critD: [0.104, 0.03], healP: [0.055, 0.016], ehr: [0.07, 0.02], spd: [4, 0.8], breakE: [0.1, 0.031], err: [0.03, 0.0093] };
  for (const k of ELEM_MAINS) MAIN_VALUE[k] = [0.062, 0.019];

  const SHOPS = {
    express: { name: 'Буфет Пом-Пом', items: ['medkit', 'soup', 'coffee', 'revive', 'exp1', 'fuel:1500'] },
    belobog: { name: 'Лавка «Надземье»', items: ['medkit', 'soup', 'coffee', 'hotpot', 'thermos', 'exp1', 'exp2', 'cone:arrows:2400', 'cone:amber:2400', 'cone:chorus:2400'] },
    boulder: { name: 'Барахолка Подземья', items: ['medkit', 'pie', 'revive', 'hotpot', 'sbiten', 'spark', 'exp2', 'cone:collapsing:2400', 'cone:void:2400', 'cone:cornucopia:2400', 'cone:databank:2400'] },
    procure: { name: 'Внутренние закупки станции', items: ['exp1', 'exp2', 'exp3', 'revive', 'relic:musketeer:head:1600', 'relic:musketeer:hands:1600', 'relic:musketeer:body:2600', 'relic:musketeer:feet:2600'] },
    robot: { name: 'Кулинарный гений № 123', items: ['lunch', 'friedrice', 'coffee', 'medkit'] }
  };

  const WARP_POOL = {
    five: ['himeko', 'welt', 'bronya', 'gepard', 'clara', 'yanqing', 'bailu', 'cone:milkyway', 'cone:butthebattle', 'cone:moment'],
    four: ['asta', 'arlan', 'herta', 'serval', 'natasha', 'sampo', 'hook', 'pela', 'lynx', 'luka', 'sushang', 'xueyi', 'tingyun', 'hanya', 'qingque', 'yukong', 'guinaifen', 'cone:trend', 'cone:swordplay', 'cone:underthesky', 'cone:geniuses', 'cone:memories', 'cone:goodnight', 'cone:postop'],
    three: ['cone:arrows', 'cone:collapsing', 'cone:amber', 'cone:void', 'cone:chorus', 'cone:databank', 'cone:cornucopia']
  };

  const BANNERS = {
    ev: { name: 'Прыжок события', kind: 'Прыжок события', pass: 'spass', stars: {
      ruanmei: { name: 'Трилогия сливового цвета', title: ['Трилогия', 'сливового цвета'], four: ['xueyi', 'sushang', 'asta'] },
      seele: { name: 'Бабочка на кончике меча', title: ['Бабочка', 'на кончике меча'], four: ['hanya', 'yukong', 'pela'] },
      kafka: { name: 'Пускай никто не спит', title: ['Пускай', 'никто не спит'], four: ['luka', 'guinaifen', 'sampo'] },
      silverwolf: { name: 'Контракт Зеро', title: ['Контракт', 'Зеро'], four: ['qingque', 'tingyun', 'march'] },
      blade: { name: 'Неприкаянная душа', title: ['Неприкаянная', 'душа'], four: ['lynx', 'arlan', 'herta'] }
    } },
    cone: { name: 'Прыжок конусов события', kind: 'Прыжок конусов события', pass: 'spass', stars: {
      ruanmei: { cone: 'mirror', title: ['Прошлое „я“', 'в зеркале'], four: ['cone:memories', 'cone:trend', 'cone:postop'] },
      seele: { cone: 'night', title: ['В ночи', ''], four: ['cone:swordplay', 'cone:geniuses', 'cone:goodnight'] },
      kafka: { cone: 'patience', title: ['Просто надо', 'подождать'], four: ['cone:goodnight', 'cone:memories', 'cone:trend'] },
      silverwolf: { cone: 'rain', title: ['Непрекращающийся', 'дождь'], four: ['cone:goodnight', 'cone:postop', 'cone:geniuses'] },
      blade: { cone: 'unreachable', title: ['Недоступная', 'сторона'], four: ['cone:underthesky', 'cone:sword_rumor', 'cone:postop'] }
    } },
    sig: { name: 'Выделенный канал', kind: 'Поиск сигнала', pass: 'tape', search: true, extra4: ['march'], stars: {
      miyabi: { name: 'Охотница каверн', title: ['Охотница', 'каверн'], four: ['danheng', 'arlan', 'sampo'] },
      yanagi: { name: 'Лунное спокойствие', title: ['Лунное', 'спокойствие'], four: ['danheng', 'arlan', 'sampo'] }
    } },
    amp: { name: 'Канал амплификаторов', kind: 'Поиск сигнала', pass: 'tape', search: true, stars: {
      miyabi: { cone: 'shrine', title: ['Храм', 'вьюги'], four: ['cone:swordplay', 'cone:underthesky', 'cone:geniuses'] },
      yanagi: { cone: 'weaver', title: ['Ткач', 'времени'], four: ['cone:goodnight', 'cone:trend', 'cone:memories'] }
    } },
    conv: { name: 'Призыв резонатора', kind: 'Призыв', pass: 'rtide', convene: true, stars: {
      phrolova: { name: 'Нескончаемый реквием', title: ['Нескончаемый', 'реквием'], four: ['serval', 'natasha', 'herta'] },
      scar: { name: 'Сказка о чёрном ягнёнке', title: ['Сказка о', 'чёрном ягнёнке'], four: ['sampo', 'hook', 'arlan'] }
    } },
    forge: { name: 'Призыв оружия', kind: 'Призыв', pass: 'ftide', convene: true, stars: {
      phrolova: { cone: 'lethe', title: ['Абсолютная пульсация:', 'Летейская элегия'], four: ['cone:masquerade', 'cone:memories', 'cone:goodnight'] },
      scar: { cone: 'lullaby', title: ['Абсолютная пульсация:', 'Колыбельная для ягнят'], four: ['cone:underthesky', 'cone:swordplay', 'cone:geniuses'] }
    } },
    guild: { name: 'Набор в отряд', kind: 'Гильдия искателей приключений', pass: 'mana', party: true, stars: {
      aqua: { name: 'Богиня воды и вечеринок', title: ['Богиня воды', 'и вечеринок'], poster: 'Ищу верующих в орден Аксис. Лечу, воскрешаю, показываю фокусы.', four: ['kazuma'] },
      megumin: { name: 'Путь взрыва', title: ['Путь', 'взрыва'], poster: 'Лучший архимаг Акселя. Взрываю раз в день. Обратно несите на спине.', four: ['kazuma'] },
      darkness: { name: 'Крестоносец не отступает', title: ['Крестоносец', 'не отступает'], poster: 'Крестоносец ищет отряд. Приму на себя любые удары. Чем больнее, тем лучше.', four: ['kazuma'] }
    } },
    wiz: { name: 'Лавка Виз', kind: 'Гильдия искателей приключений', pass: 'mana', party: true, stars: {
      aqua: { cone: 'hagoromo', title: ['Перьевая', 'мантия'], tag: 'Божественная реликвия. Хозяйка просит не путать её с занавеской.', four: ['cone:chunchunmaru'] },
      megumin: { cone: 'manastaff', title: ['Посох', 'с манатитом'], tag: 'Посох из дерева, полного маны, с красным кристаллом. Возврату не подлежит.', four: ['cone:chunchunmaru'] },
      darkness: { cone: 'adamantite', title: ['Адамантитовые', 'доспехи'], tag: 'Работа бронников Алых магов. Проверены на капусте.', four: ['cone:chunchunmaru'] }
    } },
    std: { name: 'Путь Первопроходцев', kind: 'Стандартный прыжок', pass: 'pass', featured: ['himeko', 'welt', 'bronya', 'gepard', 'clara', 'yanqing', 'bailu'], fresh: ['clara', 'yanqing', 'bailu'] }
  };

  const COMET_GIFT = [1, 1, 2, 1, 1, 1, 3];
  const TRAIL_WILL = [
    { lvl: 5, give: { items: { pass: 10 } } },
    { lvl: 15, give: { items: { pass: 10 } } },
    { lvl: 25, give: { items: { pass: 10 }, jade: 800 } },
    { lvl: 35, give: { items: { pass: 10 }, jade: 800 } }
  ];

  const MAIL_FROM = 'Команда Honkai: Star Rail 98';
  const MAIL = [
    { id: 'v11_upkeep', from: MAIL_FROM, title: 'Компенсация за обновление до версии 1.1', give: { jade: 300 }, text: [
      'Уважаемый Первопроходец!',
      'Обновление до версии 1.1 установлено. Пока шли технические работы, игра была недоступна, поэтому отправляем вам 300 звёздного нефрита.',
      'Что нового: раздел «События» в телефоне (открывается после станции «Герта»), почта и прыжок события «Трилогия сливового цвета» с Жуань Мэй.',
      'Спасибо, что едете с нами!'
    ] },
    { id: 'v11_fixes', from: MAIL_FROM, title: 'Компенсация за исправление ошибок', give: { jade: 300 }, text: [
      'Уважаемый Первопроходец!',
      'В версии 1.1 исправлены ошибки, которые мешали игре. Спасибо всем, кто писал о них на форум и присылал сохранения.',
      'Примите 300 звёздного нефрита. Если что-то снова пойдёт не так, напишите нам.'
    ] },
    { id: 'v12_heroes', from: MAIL_FROM, title: 'Версия 1.2: большое обновление', give: { jade: 300 }, text: [
      'Уважаемый Первопроходец!',
      'В стандартный прыжок пришли Байлу, Яньцин и Клара. В прыжке события можно выбрать Жуань Мэй или Зеле, а рядом открылся прыжок конусов.',
      'На станции «Герта» открылся офис Герты с Виртуальной вселенной. Она выдаёт планарные украшения для двух новых слотов реликвий.',
      'В телефоне появились «Сообщения»: попутчики пишут сами, а за ежедневную переписку дают 5 звёздного нефрита. Кнопка «В титры» теперь на правой панели.',
      'Примите 300 звёздного нефрита на первые прыжки.'
    ] },
    { id: 'v13_signal', from: MAIL_FROM, title: 'Версия 1.3: Поиск сигнала и Призыв', give: { jade: 300, items: { tape: 10, rtide: 10, ftide: 5, mana: 10, vkey: 10 } }, text: [
      'Уважаемый Первопроходец!',
      'В Звёздном прыжке две новые вкладки. В «Поиске сигнала» ждут Хосими Мияби и Цукисиро Янаги из Секции 6, в «Призыве» дирижёр Фролова и Скар со своей сказкой о чёрном ягнёнке. Рядом каналы их световых конусов.',
      'В «Гильдии» набирают отряд: Аква, Мегумин и Даркнесс, а Казума просится в каждый набор. Билет набора: манатит высшей пробы, им же платят в Лавке Виз за фирменные конусы героинь.',
      'На «Полуночном канале» ждут Ю, Канджи и Рисе из Инабы, их конусы в «Компендиуме». Билет: бархатный ключ.',
      'Во вложении по десять шифрокопий, сияющих приливов, манатитов и бархатных ключей и пять кующих приливов. Ещё десять шифрокопий дадут миссии «Секции 6».',
      'И 300 звёздного нефрита в придачу.'
    ] },
    { id: 'v14_fours', from: MAIL_FROM, title: 'Версия 1.4: девять новых героев', give: { jade: 300, items: { pass: 10 } }, text: [
      'Уважаемый Первопроходец!',
      'В Звёздный прыжок пришли девять героев 4★: Рысь и Лука из Белобога, а с Лофу Сушан, Сюэи, Тинъюнь, Ханья, Цинцюэ, Юйкун и Гуйнайфэнь. Их можно встретить в стандартном прыжке, в Поиске сигнала и в 4★ тройках прыжков события.',
      'Станцию «Герта» перестроили как в оригинале: пять зон, Офис Герты, 15 Якорей и Космический лифт. Пролог идёт в том же порядке, что в оригинале, Кафка сражается вместе с вами, а на складе диковин ждёт Оценивающий пистолет.',
      'Во вложении 10 звёздных пропусков и 300 звёздного нефрита.'
    ] }
  ];

  const SPEAKERS = {
    trail: { name: '@', char: 'trail' },
    march: { name: 'Март 7', char: 'march' },
    danheng: { name: 'Дань Хэн', char: 'danheng' },
    himeko: { name: 'Химико', char: 'himeko' },
    welt: { name: 'Вельт', char: 'welt' },
    pompom: { name: 'Пом-Пом', look: { style: 'pompom', hair: '#f2eee6', top: '#b3202c', trim: '#e0b048', eye: '#3a8ae0', ear: '#35323f', beard: '#eee0c0' } },
    kafka: { name: 'Кафка', char: 'kafka' },
    silverwolf: { name: 'Серебряный Волк', char: 'silverwolf' },
    blade: { name: 'Блэйд', char: 'blade' },
    asta: { name: 'Аста', char: 'asta' },
    arlan: { name: 'Арлан', char: 'arlan' },
    herta: { name: 'Герта', char: 'herta' },
    bronya: { name: 'Броня', char: 'bronya' },
    cocolia: { name: 'Коколия', look: { skin: '#f8e0d4', hair: '#d8bc78', eye: '#9a6ae0', eye2: '#c8a8f4', bangs: 'parted', sides: 'jaw', back: 'tail', crown: 'smooth', gloss: true, braidSide: 'r', body: 'tallf', coat: 'dress', top: '#dcdce8', trim: '#3a6ad8', inner: '#dcdce8', sleeve: '#3a2a26', neck: '#2a201e', collar: 'high', lower: '#3a2a26', low: 'shorts', legs: '#4a3430', shoes: '#18181e', tailsTo: 'calf', acc: ['braid', 'hairbowback:#1e1a20', 'dropgem:#7a5ae0', 'xcollar:#f2f2f6', 'iceemblem:#5ab0f0', 'icebrooch:#d8b050', 'mantle:#2e6a4e', 'medals', 'glove1:#f2f2f6', 'apronw:#e4e4ee', 'tails:#eeeef4', 'thighboots:#18181e', 'kneeplate:#d8b050', 'shinleaf:#d8b050'] } },
    gepard: { name: 'Гепард', char: 'gepard' },
    serval: { name: 'Сервал', char: 'serval' },
    sampo: { name: 'Сампо', char: 'sampo' },
    natasha: { name: 'Наташа', char: 'natasha' },
    hook: { name: 'Хук', char: 'hook' },
    seele: { name: 'Зеле', char: 'seele' },
    pela: { name: 'Пела', char: 'pela' },
    oleg: { name: 'Олег', look: { skin: '#b07a58', hair: '#dcdad6', hairHi: '#f4f2ee', eye: '#6a4428', bangs: 'neat', sides: 'temple', back: 'short', crown: 'swept', body: 'tall', coat: 'jacket', top: '#5a4252', trim: '#5a4252', inner: '#9a9894', neck: '#f2f2f4', collar: 'high', lower: '#b08a5a', low: 'pants', shoes: '#4a4a50', gloves: '#8a5a34', tuck: true, acc: ['goatee:#c8c6c2', 'facescar:#7a4a38', 'furcollar:#f2f2f4', 'chevron:#e8b830', 'vestclips:#d8b050', 'rolled:#f2f2f4', 'armbandL:#c8283a', 'prosthetic:#2a2a30', 'waistbelt:#7a4a2c', 'boots:#5a5a60', 'kneeband:#7a2a30', 'bootstrap:#c8a050'] } },
    clara: { name: 'Клара', char: 'clara' },
    miyabi: { name: 'Мияби', char: 'miyabi' },
    yanagi: { name: 'Янаги', char: 'yanagi' },
    phrolova: { name: 'Фролова', char: 'phrolova' },
    scar: { name: 'Скар', char: 'scar' },
    svarog: { name: 'Сварог', look: { style: 'svarog', hair: '#5a5ca0', top: '#3a3532', trim: '#e6e2e8', eye: '#ff2e8e' } },
    guard: { name: 'Страж', look: { skin: '#f4d8c4', hair: '#3a3020', eye: '#303040', bangs: 'blunt', sides: 'none', back: 'short', crown: 'smooth', body: 'm', coat: 'closed', top: '#3a5aa0', trim: '#e8e8f0', inner: '#e8e8f0', collar: 'high', lower: '#2a3a6a', low: 'pants', shoes: '#1e1e24', acc: ['helmet:#3a5aa0'] } },
    townsman: { name: 'Житель', look: { skin: '#f0d0b8', hair: '#6a4a3a', eye: '#402a1a', bangs: 'neat', sides: 'none', back: 'short', crown: 'neat', body: 'm', coat: 'long', top: '#6a5a4a', trim: '#b0a080', inner: '#d8d0c0', collar: 'v', lower: '#4a4238', low: 'pants', shoes: '#2a2420', acc: ['hat:#4a3a2e'] } },
    townswoman: { name: 'Жительница', look: { skin: '#f6dccb', hair: '#c09060', eye: '#402a1a', bangs: 'parted', sides: 'long', back: 'shoulder', crown: 'smooth', body: 'f', coat: 'long', top: '#7a4a5a', trim: '#e0d0c0', inner: '#e0d0c0', collar: 'fur', lower: '#5a3a44', low: 'long', shoes: '#2a2024', acc: [] } },
    miner: { name: 'Шахтёр', look: { skin: '#e8c8a8', hair: '#3a3028', eye: '#302010', bangs: 'neat', sides: 'none', back: 'short', crown: 'neat', body: 'm', coat: 'jacket', top: '#5a4a30', trim: '#e0a040', inner: '#8a7a60', collar: 'v', lower: '#3a3428', low: 'pants', shoes: '#2a2420', acc: ['minerhat:#e0a040'] } },
    kid: { name: 'Ребёнок', look: { skin: '#f6d8c4', hair: '#8a5a3a', eye: '#302010', bangs: 'messy', sides: 'short', back: 'short', crown: 'messy', body: 'small', coat: 'jacket', top: '#4a7a4a', trim: '#e0e0c0', inner: '#e0e0c0', collar: 'v', lower: '#3a4a6a', low: 'shorts', shoes: '#3a2a20', acc: [] } },
    wen: { name: 'Вэнь Шици', look: { skin: '#f2d8c2', hair: '#1c1c22', eye: '#3a3040', bangs: 'parted', sides: 'short', back: 'short', crown: 'neat', body: 'm', coat: 'long', top: '#f2f4f6', trim: '#3a8a8c', inner: '#2e4a5a', collar: 'v', lower: '#2a2e38', low: 'pants', shoes: '#1e2026', acc: ['glasses', 'lanyard:#3a8a8c'] } },
    cookbot: { name: 'Кулинарный гений № 123', look: { style: 'cookbot', hair: '#f6f6fa', top: '#d8dee8', trim: '#ff7a3a', eye: '#50e8ff' } },
    scientist2: { name: 'Исследовательница', look: { skin: '#f6dccb', hair: '#5a3424', eye: '#3a2a2a', bangs: 'swept', sides: 'long', back: 'tail', crown: 'smooth', body: 'f', coat: 'long', top: '#f2f2f4', trim: '#8a5ccc', inner: '#3a3450', collar: 'v', lower: '#3a3450', low: 'skirt', shoes: '#2a2430', acc: ['glasses', 'lanyard:#8a5ccc'] } },
    scientist: { name: 'Учёный', look: { skin: '#f2d6c2', hair: '#5a4a3a', eye: '#303040', bangs: 'parted', sides: 'short', back: 'short', crown: 'neat', body: 'm', coat: 'long', top: '#f0f0f0', trim: '#c8ccd4', inner: '#4a6aa0', collar: 'v', lower: '#3a3a44', low: 'pants', shoes: '#26262c', acc: ['glasses'] } },
    terminal: { name: 'Терминал', look: { style: 'terminal', hair: '#20c0ff', top: '#304050', trim: '#20c0ff', eye: '#20c0ff' } },
    qlipoth: { name: 'Клипот', look: { style: 'terminal', hair: '#ffb040', top: '#6a4a20', trim: '#ffe0a0', eye: '#ffb040' } },
    julian: { name: 'Джулиан', look: { skin: '#f6d8c4', hair: '#6a4630', eye: '#3a2a20', bangs: 'messy', sides: 'short', back: 'short', crown: 'messy', body: 'small', sex: 'm', coat: 'jacket', top: '#3a6a8a', trim: '#e8c060', inner: '#e0d8c0', collar: 'v', lower: '#4a3a2a', low: 'shorts', shoes: '#3a2a20', acc: ['goggles:#e8a040'] } },
    fersman: { name: 'Ферсман', look: { skin: '#eccdb6', hair: '#cfcac2', eye: '#4a3a2a', bangs: 'neat', sides: 'none', back: 'short', crown: 'neat', body: 'm', coat: 'jacket', top: '#6a5a3a', trim: '#c09040', inner: '#8a8070', collar: 'v', lower: '#3a3428', low: 'pants', shoes: '#2a2420', acc: ['beard', 'hat:#4a3a2a'] } },
    swetta: { name: 'Света', look: { skin: '#f2d2bc', hair: '#7a4a30', eye: '#3a2a20', bangs: 'parted', sides: 'long', back: 'tail', crown: 'smooth', body: 'f', coat: 'jacket', top: '#5a6a4a', trim: '#c0a070', inner: '#d8ccb0', collar: 'v', lower: '#3a3a30', low: 'pants', shoes: '#2a2420', acc: ['kerchief:#a04030'] } },
    balaway: { name: 'Балавэй Шахтёрская Лампа', look: { skin: '#e8c8a8', hair: '#8a8a88', eye: '#3a3030', bangs: 'neat', sides: 'none', back: 'short', crown: 'neat', body: 'm', coat: 'vest', top: '#4a3a5a', trim: '#d0b060', inner: '#e0d8c8', collar: 'v', lower: '#2e2a30', low: 'pants', shoes: '#1e1a1e', acc: ['minerhat:#e0c040', 'glasses', 'stubble'] } },
    findie: { name: 'Находюша', look: { style: 'terminal', hair: '#ffd040', top: '#5a5a6a', trim: '#ffd040', eye: '#ffd040' } },
    wildfire: { name: '«Дикий огонь»', look: { skin: '#e8c8a8', hair: '#2a2420', eye: '#302010', bangs: 'neat', sides: 'none', back: 'short', crown: 'neat', body: 'm', coat: 'jacket', top: '#4a3a30', trim: '#e05030', inner: '#8a7a60', collar: 'v', lower: '#3a3428', low: 'pants', shoes: '#2a2420', acc: ['armband:#e05030', 'minerhat:#e05030'] } },
    narrator: { name: '' }
  };

  Object.assign(H, { CHARS, FUSIONS, UNHOLY, CONTACT, ENEMIES, BOSS_JADE, ITEMS, CONES, RELIC_SETS, RELIC_SLOTS, CAVERN_SLOTS, PLANAR_SLOTS, CAVERN_SETS, PLANAR_SETS, STAT_NAMES, STAT_ROLL, MAIN_VALUE, SHOPS, WARP_POOL, BANNERS, COMET_GIFT, TRAIL_WILL, MAIL, SPEAKERS });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
