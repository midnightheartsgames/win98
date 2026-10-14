(function (T) {
  'use strict';
  const { mv, chain, nx, addFighter, tenHit } = T;

  addFighter({
    id: 'potapych', slot: 10, hidden: true, unlock: 1, name: 'Потапыч', short: 'ПОТАПЫЧ', en: 'POTAPYCH',
    country: 'Россия (Москва)', age: 9, style: 'Цирковая борьба', blood: '—',
    bio: 'Звезда Московского цирка на Цветном. Дрессировщик ушёл на пенсию, номер закрыли. Потапыч сбежал из фургона и учуял турнир по запаху мёда из буфета.',
    quote: 'Р-р-р! (Кланяется и просит сгущёнку.)',
    stance: 'bear', voice: { pitch: 0.55, kind: 'bear' }, intro: 'flex', wins: ['flex', 'bow'],
    stage: 'circus', music: 'potapych', hp: 200, walk: 0.95, dash: 0.95, jump: 0.8, bulk: 1.15, weight: 1.4,
    body: { size: 1.12, headR: 0.14 },
    look: {
      head: 'bear', skin: '#6a4a2a', headW: 1.1, headH: 1.0, headD: 1.15, top: null, pants: '#6a4a2a', shoes: '#4a3218', gloves: '#4a3218', claws: true, belt: false,
      girth: 1.55, armG: 1.45, legG: 1.4, neck: 1.8, hand: 1.3,
      parts: [
        { at: 'chest', shape: 'box', off: [0.14, -0.01, 0], size: [0.03, 0.045, 0.1], col: '#c01818' },
        { at: 'head', shape: 'rod', a: [-0.01, 0.11, 0], b: [-0.02, 0.19, 0], r0: 0.062, r1: 0.052, n: 8, col: '#c01818' },
        { at: 'head', shape: 'rod', a: [-0.02, 0.19, 0], b: [-0.08, 0.13, 0.05], r0: 0.006, col: '#141414' }
      ]
    },
    costumes: [{}, { skin: '#e8e4d8', pants: '#e8e4d8', shoes: '#b8b0a0', gloves: '#b8b0a0' }, { top: '#e8e8f0', sleeves: null, pants: '#6a4a2a' }, { skin: '#2a1a10', pants: '#2a1a10', shoes: '#1a1008', gloves: '#1a1008' }],
    stances: {
      sit: { low: true, pose: { p: [-0.12, 0.36, 0], py: 0, cy: 0, cp: -0.05, hp: -0.2, lh: [0.3, 0.1, -0.3], rh: [0.3, 0.1, 0.3], lf: [0.42, 0.075, -0.22], rf: [0.42, 0.075, 0.22], lk: [1, 1, -0.3], rk: [1, 1, 0.3], lo: 1, ro: 1 }, exit: 'b', max: 120 }
    },
    ai: { fav: ['2', 'df+2', 'f+1+2', '1+2', 'd+4', 'f,f+1+2', 'b+1+2'] },
    moves: [
      mv('1', 'Шлепок лапой', 'h', 8, 12, 2, 15, -1, 7, { a: { k: 'jab', lo: 1 }, r: 1.02, nx: [nx('2', '1,2', [2, 20], 14)] }),
      chain('1,2', 'Лапа и лапа', 'h', 13, 11, 2, 19, -5, 6, { a: 'hook:r', r: 1.02 }),
      mv('2', 'Удар лапой', 'h', 15, 13, 2, 18, -4, 6, { a: 'hook:r', r: 1.1, w: 0.6 }),
      mv('1+2', 'Медвежьи объятия', 't', 38, 13, 2, 30, 0, 0, { throw: 'bearhug', brk: 12, r: 1.0 }),
      mv('df+2', 'Подброс', 'm', 19, 15, 2, 24, -13, 'L', { a: 'upper:r', r: 0.98 }),
      mv('f+1+2', 'Удар двумя лапами', 'm', 26, 22, 3, 26, -8, 'K', { a: 'hammer:r', r: 1.08 }),
      mv('d+1+2', 'Отдых', 'x', 0, 14, 1, 4, 0, 0, { a: { k: 'pose', mods: { p: [-0.1, 0.4, 0] } }, stance: 'sit', crouch: true }),
      mv('st:sit 1', 'Кувырок из отдыха', 'm', 22, 18, 3, 24, -12, 'K', { a: { k: 'pose', mods: { bp: Math.PI * 2, '+p': [0.4, -0.3, 0] } }, r: 0.9, mv: 1.1 }),
      mv('st:sit 3', 'Взмах лапой снизу', 'l', 14, 14, 3, 22, -14, 'T', { a: 'lowp:r', r: 1.05, crouch: true }),
      mv('f,f+1+2', 'Медвежий кувырок', 'm', 24, 18, 4, 26, -12, 'K', { a: { k: 'pose', mods: { bp: Math.PI * 2, '+p': [0.35, -0.35, 0] } }, r: 0.95, mv: 1.3 }),
      mv('b+1+2', 'Рёв', 'x', 0, 46, 1, 8, 0, 0, { a: { k: 'pose', mods: { hp: -0.6, cp: -0.35, lh: [0.3, 0.55, -0.35], rh: [0.3, 0.55, 0.35] } }, buff: 1.4 }),
      mv('3+4', 'Прыжок пузом', 'm', 28, 26, 4, 30, -15, 'K', { a: 'splash', r: 1.05, jumpy: true, jh: 0.55, gr: true, lc: [6, 30] }),
      mv('d+4', 'Подсечка лапой', 'l', 12, 16, 3, 22, -14, 'T', { a: 'lowp:r', r: 1.12, crouch: true, fc: true }),
      mv('4', 'Пинок задней лапой', 'm', 16, 16, 3, 22, -9, 4, { a: 'front:r', r: 1.02, y: 1.0 }),
      mv('3', 'Толчок лапой', 'm', 12, 14, 3, 18, -6, 3, { a: 'push:l', r: 1.0 }),
      mv('2+4', 'Бросок об пол', 't', 40, 12, 2, 28, 0, 0, { throw: 'slam', brk: 2, r: 0.95 })
    ]
  });

  addFighter({
    id: 'liu', slot: 11, hidden: true, unlock: 2, name: 'Лю Шэн', short: 'ЛЮ ШЭН', en: 'LIU SHENG',
    country: 'Китай', age: 78, style: 'Пьяный кулак', blood: 'AB',
    bio: 'Отшельник с горы Удан. Считает, что турнир устроил его бывший ученик, и пришёл надрать ему уши. По дороге выпил всё рисовое вино в трёх деревнях.',
    quote: 'Ик! Кто из вас двоих меня ударил?',
    stance: 'drunk', voice: { pitch: 0.9, kind: 'old' }, intro: 'bow', wins: ['bow', 'fist'],
    stage: 'mountain', music: 'liu', hp: 160, walk: 0.95, ss: 1.2,
    body: { size: 0.95 },
    look: {
      skin: '#e0b890', hair: '#e8e8e8', hairStyle: 'topknot', beard: '#e8e8e8', beardLong: true, stache: '#e8e8e8', brow: '#e8e8e8',
      top: '#7a6a52', sleeves: 'long', pants: '#3a3028', shoes: '#1a1410', belt: '#3a2a1a', gi: true,
      parts: [{ at: 'pelvis', shape: 'ball', off: [0.02, -0.08, 0.2], size: [0.07, 0.1, 0.07], col: '#c8a040' }, { at: 'pelvis', shape: 'ball', off: [0.02, 0.02, 0.2], size: [0.045, 0.045, 0.045], col: '#c8a040' }]
    },
    costumes: [{}, { top: '#e8e4d8', pants: '#6a5a4a' }, { top: '#8a1a1a', pants: '#1a1a1a' }, { top: '#2a4a3a', pants: '#1a2a20' }],
    stances: {
      sleep: { low: true, pose: { p: [0, 0.2, 0], bp: -1.45, br: 0.9, hp: 0.2, lh: [0.1, 0.5, -0.1], rh: [0.3, 0.1, 0.3], lf: [0.05, -0.62, -0.1], rf: [0.3, -0.5, 0.12], lo: 1, ro: 1 }, exit: 'b', max: 150, noThrow: true }
    },
    ai: { fav: ['b+1', '1', 'db+3', 'd+1+2', 'f+1+2', 'u+4', 'b+3+4'] },
    moves: [
      mv('d+1+2', 'Глоток', 'x', 0, 34, 1, 10, 0, 0, { a: { k: 'pose', mods: { rh: [0.15, 0.62, 0.02], hp: -0.5, cp: -0.15, ro: 0 } }, heal: 6, buff: 1.15 }),
      mv('d+3+4', 'Сон', 'x', 0, 16, 1, 4, 0, 0, { a: { k: 'pose', mods: { p: [0, 0.35, 0], bp: -1.0 } }, stance: 'sleep', crouch: true }),
      mv('st:sleep 3', 'Сон: пинок', 'l', 12, 14, 3, 22, -14, 'T', { a: 'lowk:l', r: 1.05, crouch: true }),
      mv('st:sleep 4', 'Сон: пружина', 'm', 18, 16, 3, 26, -15, 'L', { a: 'hop:r', r: 1.0, jumpy: true }),
      mv('st:sleep 1+2', 'Сон: перекат', 'x', 0, 18, 1, 6, 0, 0, { a: { k: 'pose', mods: { p: [0, 0.2, 0], bp: -1.45, br: 0.9 + Math.PI * 2 } }, mv: -0.8, stance: 'sleep', inv: [2, 14] }),
      mv('1', 'Пьяный тычок', 'h', 6, 11, 2, 14, 0, 7, { a: { k: 'jab', lo: 1 }, r: 0.9, nx: [nx('2', '1,2', [2, 20], 14), nx('1', 'lu11', [3, 16], 12)] }),
      chain('lu11', 'Пьяный тычок 2', 'm', 10, 12, 2, 22, -9, 'K', { a: 'palm', r: 0.95 }),
      mv('2', 'Удар чаркой', 'h', 12, 12, 2, 17, -3, 6, { a: 'hook:r', r: 0.88 }),
      mv('b+1', 'Шатающийся удар', 'h', 16, 16, 2, 20, -2, 'SP', { a: 'back:l', r: 0.95, w: 0.5 }),
      mv('f+1+2', 'Падение на врага', 'm', 24, 20, 4, 30, -15, 'K', { a: 'splash', r: 1.05, jumpy: true, gr: true }),
      mv('df+2', 'Кувшин вверх', 'm', 15, 15, 2, 24, -13, 'L', { a: 'upper:r', r: 0.88 }),
      mv('db+3', 'Пьяная подсечка', 'l', 14, 17, 3, 24, -15, 'T', { a: 'sweep:l', r: 1.12, crouch: true, fc: true }),
      mv('b+3+4', 'Качание назад', 'x', 0, 20, 1, 6, 0, 0, { a: { k: 'pose', mods: { '+p': [-0.2, -0.1, 0], cp: -0.6, hp: -0.3 } }, back: 0.8, inv: [3, 16] }),
      mv('u+4', 'Пьяный полёт', 'm', 16, 15, 3, 26, -14, 'L', { a: 'flip:r', r: 1.0, lc: [3, 30] }),
      mv('2+4', 'Бросок кувырком', 't', 36, 12, 2, 28, 0, 0, { throw: 'tomoe', brk: 2, r: 0.9 }),
      mv('1+3', 'Удар лбом', 't', 34, 12, 2, 28, 0, 0, { throw: 'headbutt', brk: 1, r: 0.9 })
    ]
  });

  addFighter({
    id: 'strazh', slot: 12, hidden: true, unlock: 3, name: 'Страж-7', short: 'СТРАЖ-7', en: 'STRAZH-7',
    country: 'СССР (НИИ «Полюс»)', age: 12, style: 'Боевые алгоритмы', blood: 'масло',
    bio: 'Седьмой охранный робот арктического института. Институт закрыли, учёных вывезли, а его забыли в ангаре. Страж пришёл на турнир, потому что в его памяти осталась одна задача: защищать людей.',
    quote: 'ЦЕЛЬ НЕЙТРАЛИЗОВАНА. ЗАПУСК ПРОТОКОЛА «ЧАЙ».',
    stance: 'robot', voice: { pitch: 0.7, kind: 'robot' }, intro: 'default', wins: ['flex', 'fist'],
    stage: 'lab', music: 'strazh', hp: 180, walk: 0.8, dash: 0.8, jump: 0.75, bulk: 1.25, weight: 1.5,
    body: { size: 1.15, headR: 0.13 },
    look: {
      head: 'robot', skin: '#5a6a5a', top: '#6a7a6a', sleeves: 'long', pants: '#4a5a4a', shoes: '#2a2a2a', gloves: '#3a3a3a', belt: '#2a2a2a',
      accent: '#ff3020', trim: '#e0c040', pads: '#5a6a5a', kneepads: '#5a6a5a', girth: 1.35, armG: 1.35, legG: 1.3, neck: 1.5, hand: 1.35, eye: '#ff3020',
      parts: [
        { at: 'chest', shape: 'box', off: [0.13, -0.12, 0], size: [0.02, 0.05, 0.05], col: '#c01818' },
        { at: 'chest', shape: 'box', off: [0.12, -0.25, 0.08], size: [0.03, 0.06, 0.03], col: '#3a3a3a' },
        { at: 'chest', shape: 'box', off: [0.12, -0.25, -0.08], size: [0.03, 0.06, 0.03], col: '#3a3a3a' },
        { at: 'chest', shape: 'rod', a: [-0.14, -0.05, 0.1], b: [-0.2, 0.18, 0.12], r0: 0.02, col: '#2a2a2a' },
        { at: 'chest', shape: 'rod', a: [-0.14, -0.05, -0.1], b: [-0.2, 0.18, -0.12], r0: 0.02, col: '#2a2a2a' }
      ]
    },
    costumes: [{}, { top: '#8a8a90', pants: '#6a6a70', skin: '#7a7a80', accent: '#20a0ff' }, { top: '#c8a040', pants: '#8a6a30', skin: '#b08a3a', accent: '#20ff60' }, { top: '#2a2a2a', pants: '#1a1a1a', skin: '#3a3a3a' }],
    ai: { fav: ['f+2', '2', 'd+1+2', 'df+2', '2+4', 'b+1+2'] },
    moves: [
      mv('1', 'Поршневой удар', 'h', 8, 12, 2, 15, 0, 7, { a: 'jab', r: 0.95, nx: [nx('2', '1,2', [2, 20], 14)] }),
      mv('2', 'Молот', 'h', 16, 16, 2, 20, -5, 6, { a: 'cross', r: 1.0 }),
      mv('f+2', 'Ракетный кулак', 'm', 20, 26, 4, 28, -15, 'B', { a: 'straight:r', r: 1.7, w: 0.18, fx: 'rocket' }),
      mv('d+1+2', 'Паровой выброс', 'm', 20, 20, 4, 26, -4, 'B', { a: { k: 'pose', mods: { '+p': [0, -0.2, 0], lh: [0.2, 0.2, -0.45], rh: [0.2, 0.2, 0.45], cp: 0.2 } }, r: 1.15, spin360: true, fx: 'steam' }),
      mv('1+2', 'Двойной пресс', 'm', 24, 20, 3, 24, -8, 'K', { a: 'palm', r: 1.05 }),
      mv('df+2', 'Подъёмник', 'm', 18, 18, 2, 26, -14, 'L', { a: 'upper:r', r: 0.92 }),
      mv('b+1+2', 'Раскрутка', 'm', 7, 16, 18, 22, -10, 4, { a: { k: 'pose', mods: { by: Math.PI * 4, lh: [0.1, 0.35, -0.6], rh: [0.1, 0.35, 0.6] } }, r: 1.15, spin360: true, rehit: [22, 28] }),
      mv('d+4', 'Гидравлика', 'l', 12, 16, 3, 24, -14, 'T', { a: 'lowk:r', r: 1.08, crouch: true, fc: true }),
      mv('u+1+2', 'Падение корпусом', 'm', 30, 28, 4, 32, -16, 'K', { a: 'splash', r: 1.1, jumpy: true, gr: true, lc: [6, 32] }),
      mv('4', 'Удар ногой-опорой', 'm', 18, 17, 3, 22, -9, 4, { a: 'front:r', r: 1.08 }),
      mv('2+4', 'Захват за горло', 't', 40, 13, 2, 30, 0, 0, { throw: 'crush', brk: 2, r: 0.95 }),
      mv('1+3', 'Бросок об пол', 't', 38, 13, 2, 30, 0, 0, { throw: 'slam', brk: 1, r: 0.95 })
    ]
  });

  addFighter({
    id: 'churban', slot: 13, hidden: true, unlock: 4, name: 'Чурбан', short: 'ЧУРБАН', en: 'CHURBAN',
    country: 'Неизвестно', age: 300, style: 'Подражание', blood: 'смола',
    bio: 'Деревянный тренировочный манекен из храма на горе. Триста лет его били лучшие мастера — и он всё запомнил. В каждом раунде Чурбан сражается стилем другого бойца.',
    quote: '…скрип…',
    stance: 'karate', voice: { pitch: 0.6, kind: 'wood' }, intro: 'default', wins: ['bow', 'fist'],
    stage: 'dojo', music: 'churban', hp: 170, mimic: true, noMimic: true,
    body: { size: 1.0 },
    look: {
      head: 'dummy', skin: '#b08a5a', top: null, pants: '#a07a4a', shoes: null, gloves: null, belt: '#6a4a2a',
      parts: [
        { at: 'foreL', shape: 'ball', off: [-0.02, 0, 0], size: [0.03, 0.055, 0.055], col: '#5a5a5a' },
        { at: 'foreR', shape: 'ball', off: [-0.02, 0, 0], size: [0.03, 0.055, 0.055], col: '#5a5a5a' },
        { at: 'shinL', shape: 'ball', off: [0.05, 0, 0], size: [0.03, 0.07, 0.07], col: '#5a5a5a' },
        { at: 'shinR', shape: 'ball', off: [0.05, 0, 0], size: [0.03, 0.07, 0.07], col: '#5a5a5a' }
      ]
    },
    costumes: [{}, { skin: '#6a4a2a', pants: '#5a3a1a' }, { skin: '#d8c8a0', pants: '#c8b890' }, { skin: '#3a3a3a', pants: '#2a2a2a', belt: '#c01818' }],
    moves: []
  });

  addFighter({
    id: 'genzo', slot: 14, hidden: true, unlock: 5, subBoss: true, name: 'Гэндзо Курогане', short: 'ГЭНДЗО', en: 'GENZO KUROGANE',
    country: 'Япония', age: 68, style: 'Кэнпо Курогане', blood: 'B',
    bio: 'Глава концерна «Курогане» и основатель турнира. Скупает додзё, школы и заводы по всему миру. Говорят, он ищет в старом храме под ареной что-то, что сильнее людей.',
    quote: 'Слабость — это выбор. Я его не делал.',
    stance: 'karate', voice: { pitch: 0.75, kind: 'm' }, intro: 'bow', wins: ['bow', 'fist'],
    stage: 'castle', music: 'genzo', hp: 185, bulk: 1.05,
    body: { size: 1.04 },
    stancePose: { p: [-0.05, 0.8, 0.02], py: 0.7, cy: -0.3, cp: 0.14, lf: [0.32, 0.075, -0.16], rf: [-0.3, 0.075, 0.2], lh: [0.36, 0.3, -0.05], rh: [0.18, 0.2, 0.18] },
    look: { skin: '#d8a078', hair: '#e8e8e8', hairStyle: 'bald', beard: '#ececec', beardLong: true, stache: '#ececec', brow: '#ececec', top: '#6a1010', sleeves: 'short', pants: '#141414', gi: true, belt: '#101010', shoes: null, girth: 1.15, armG: 1.15, neck: 1.2 },
    costumes: [{}, { top: '#f0f0f0', pants: '#1a1a1a' }, { top: '#1a1a1a', pants: '#6a1010' }, { top: null, sleeves: null, pants: '#141414' }],
    ai: { fav: ['f,n,d,df+2', 'df+1', 'b+2', 'f,f+2', 'db+2', 'd+4', 'f,n,d,df+1'] },
    moves: [
      mv('f,n,d,df', 'Шаг демона', 'x', 0, 14, 1, 6, 0, 0, { a: { k: 'pose', mods: { '+p': [0.1, -0.3, 0], '+cp': 0.35 } }, mv: 0.9, crouch: true, fc: true, nx: [nx('2', 'gcd2', [3, 16], 6), nx('1', 'gcd1', [3, 16], 6)] }),
      mv('~f,n,d,df+2', 'Молот неба', 'm', 24, 14, 2, 20, 5, 'L', { a: 'upper:r', r: 1.0, y: 1.4, fx: 'spark', lift: 1.1 }),
      mv('f,n,d,df+2', 'Молот неба', 'm', 20, 15, 2, 24, -10, 'L', { a: 'upper:r', r: 0.98, y: 1.4, mv: 0.3 }),
      chain('gcd2', 'Молот неба', 'm', 20, 12, 2, 24, -10, 'L', { a: 'upper:r', r: 0.98, y: 1.4 }),
      mv('f,n,d,df+1', 'Кулак бури', 'm', 20, 15, 2, 20, -6, 'B', { a: 'straight:l', r: 1.0, mv: 0.3 }),
      chain('gcd1', 'Кулак бури', 'm', 20, 12, 2, 20, -6, 'B', { a: 'straight:l', r: 1.0 }),
      mv('d+1+2', 'Демонический удар', 'u', 45, 40, 3, 22, 0, 'B', { a: 'hammer:r', r: 1.05, fx: 'charge' }),
      mv('df+1', 'Средний кулак', 'm', 13, 13, 2, 15, 0, 4, { a: 'body:l', r: 0.9 }),
      mv('b+2', 'Кулак-вулкан', 'm', 20, 16, 2, 26, -12, 'L', { a: 'upper:r', r: 0.9, y: 1.4 }),
      mv('f,f+2', 'Прорыв горы', 'm', 24, 17, 3, 26, -10, 'B', { a: 'straight:r', r: 1.1, mv: 0.6 }),
      mv('b+4', 'Разворот мастера', 'h', 22, 16, 3, 26, -12, 'B', { a: 'spin:r', r: 1.12 }),
      mv('db+2', 'Низкий кулак', 'l', 14, 18, 2, 24, -14, 'T', { a: 'lowp:r', r: 0.98, crouch: true, fc: true }),
      mv('b+1+2', 'Отражение мастера', 'x', 0, 18, 1, 10, 0, 0, { a: { k: 'pose', mods: { lh: [0.42, 0.5, 0.05], '+cy': -0.25 } }, parry: [2, 16], rev: 'reverse', revDmg: 28 }),
      mv('2+4', 'Бросок через себя', 't', 40, 12, 2, 28, 0, 0, { throw: 'suplex', brk: 2, r: 0.9 }),
      mv('f+1+2', 'Бросок мастера', 't', 45, 12, 2, 30, 0, 0, { throw: 'tomoe', brk: 12, r: 0.9 })
    ]
  });

  const colossusMoves = [
    mv('1', 'Бронзовый кулак', 'h', 9, 12, 2, 15, 0, 7, { a: 'jab', r: 1.05, nx: [nx('2', '1,2', [2, 20], 14)] }),
    chain('1,2', 'Бронза и камень', 'h', 16, 12, 2, 20, -5, 6, { a: 'cross', r: 1.08 }),
    mv('2', 'Каменная рука', 'h', 18, 15, 2, 20, -6, 6, { a: 'cross', r: 1.1 }),
    mv('df+2', 'Подъём древних', 'm', 20, 17, 2, 26, -14, 'L', { a: 'upper:r', r: 0.95 }),
    mv('f+1+2', 'Молот земли', 'l', 26, 26, 4, 26, -10, 'T', { a: 'hammer:r', r: 1.6, spin360: true, fx: 'quake' }),
    mv('d+1+2', 'Древний гнев', 'u', 45, 38, 3, 24, 0, 'B', { a: 'hammer:r', r: 1.1, fx: 'charge' }),
    mv('b+4', 'Разворот колосса', 'h', 24, 17, 3, 26, -12, 'B', { a: 'spin:r', r: 1.18 }),
    mv('3+4', 'Прыжок колосса', 'm', 30, 26, 4, 30, -15, 'K', { a: 'splash', r: 1.1, jumpy: true, jh: 0.6, gr: true, lc: [6, 30] }),
    mv('f,f+2', 'Таран', 'm', 26, 17, 3, 26, -10, 'B', { a: 'shoulder', r: 1.0, mv: 0.8 }),
    mv('d+4', 'Подсечка колосса', 'l', 16, 17, 3, 24, -15, 'T', { a: 'sweep:r', r: 1.2, crouch: true, fc: true }),
    mv('4', 'Удар ногой', 'm', 18, 16, 3, 22, -9, 4, { a: 'front:r', r: 1.12 }),
    mv('2+4', 'Сокрушение', 't', 45, 13, 2, 30, 0, 0, { throw: 'crush', brk: 2, r: 1.0 }),
    mv('1+3', 'Бросок древних', 't', 42, 13, 2, 30, 0, 0, { throw: 'slam', brk: 1, r: 1.0 })
  ];

  addFighter({
    id: 'colossus', slot: 15, hidden: true, unlock: 6, boss: true, name: 'Колосс', short: 'КОЛОСС', en: 'COLOSSUS',
    country: 'Храм под ареной', age: 3000, style: 'Древняя сила', blood: 'бронза',
    bio: 'Бронзовый страж, отлитый три тысячи лет назад. Он спал в храме под ареной и проснулся от ударов турнирных бойцов. Колосс запоминает силу каждого, кого победил.',
    quote: '…ЕЩЁ ОДИН…',
    stance: 'colossus', voice: { pitch: 0.45, kind: 'boss' }, intro: 'flex', wins: ['flex', 'fist'],
    stage: 'temple', music: 'colossus', hp: 200, walk: 0.85, dash: 0.9, bulk: 1.35, weight: 1.6,
    body: { size: 1.26, headR: 0.12 },
    look: {
      head: 'boss', skin: '#b08040', headCol: '#b08040', top: null, pants: '#8a6030', shoes: '#6a4a20', gloves: '#8a6030', belt: '#d0a040', trim: '#e0c050', pads: '#c09040', eye: '#40e0ff', brow: '#8a6030',
      girth: 1.45, armG: 1.4, legG: 1.3, neck: 1.4, hand: 1.25, kneepads: '#c09040',
      parts: [
        { at: 'chest', shape: 'box', off: [0.13, -0.12, 0], size: [0.02, 0.08, 0.1], col: '#e0c050' },
        { at: 'chest', shape: 'box', off: [0.13, -0.28, 0], size: [0.02, 0.03, 0.14], col: '#e0c050' }
      ]
    },
    costumes: [{}, { skin: '#8a8a90', headCol: '#8a8a90', pants: '#6a6a70', gloves: '#6a6a70', eye: '#ff4040' }, { skin: '#40a080', headCol: '#40a080', pants: '#2a7a60', gloves: '#2a7a60' }, { skin: '#d8c070', headCol: '#d8c070', pants: '#b0903a', gloves: '#b0903a' }],
    ai: { fav: ['2', 'df+2', 'f+1+2', 'd+4', '2+4', 'f,f+2'], aggro: 1.1 },
    moves: colossusMoves
  });

  addFighter({
    id: 'colossus2', slot: 16, hidden: true, unlock: 7, boss: true, finalForm: true, name: 'Пылающий Колосс', short: 'П. КОЛОСС', en: 'BLAZING COLOSSUS',
    country: 'Храм под ареной', age: 3000, style: 'Пламя древних', blood: 'лава',
    bio: 'Когда бронза не выдерживает, из трещин вырывается огонь, который горел в Колоссе все три тысячи лет. В этой форме он больше и злее — и умеет дышать пламенем.',
    quote: 'ГОРИ.',
    stance: 'colossus', voice: { pitch: 0.38, kind: 'boss' }, intro: 'flex', wins: ['flex', 'fist'],
    stage: 'temple2', music: 'colossus2', hp: 220, walk: 0.9, dash: 0.95, bulk: 1.45, weight: 1.8, dmgMul: 1.08,
    body: { size: 1.36, headR: 0.12 },
    look: {
      head: 'boss', skin: '#3a2018', headCol: '#3a2018', top: null, pants: '#2a1810', shoes: '#1a100a', gloves: '#2a1810', belt: '#ff8020', trim: '#ffb040', pads: '#4a2818', eye: '#ffc020', brow: '#ff6010',
      girth: 1.5, armG: 1.45, legG: 1.35, neck: 1.45, hand: 1.3, claws: true, kneepads: '#ff7020',
      parts: [
        { at: 'chest', shape: 'box', off: [0.13, -0.1, 0], size: [0.02, 0.16, 0.025], col: '#ff8020' },
        { at: 'chest', shape: 'box', off: [0.13, -0.2, 0.08], size: [0.02, 0.1, 0.02], col: '#ff6010' },
        { at: 'chest', shape: 'box', off: [0.13, -0.2, -0.08], size: [0.02, 0.1, 0.02], col: '#ff6010' },
        { at: 'thighL', shape: 'box', off: [0.2, 0.09, 0], size: [0.12, 0.012, 0.02], col: '#ff8020' },
        { at: 'thighR', shape: 'box', off: [0.2, 0.09, 0], size: [0.12, 0.012, 0.02], col: '#ff8020' },
        { at: 'upperL', shape: 'box', off: [0.15, 0.06, 0], size: [0.1, 0.012, 0.02], col: '#ff8020' },
        { at: 'upperR', shape: 'box', off: [0.15, 0.06, 0], size: [0.1, 0.012, 0.02], col: '#ff8020' }
      ]
    },
    costumes: [{}, { skin: '#101018', headCol: '#101018', belt: '#40a0ff', trim: '#80d0ff', eye: '#80e0ff' }],
    ai: { fav: ['b+1+2', 'df+2', 'f+1+2', 'u+1+2', '2', '2+4'], aggro: 1.2 },
    moves: colossusMoves.concat([
      mv('b+1+2', 'Огненное дыхание', 'u', 20, 24, 16, 26, 0, 'K', { a: { k: 'pose', mods: { '+p': [0.05, -0.05, 0], cp: 0.25, hp: 0.1, lh: [0.2, 0.2, -0.3], rh: [0.2, 0.2, 0.3] } }, r: 2.4, w: 0.45, fx: 'fire', rehit: [32] }),
      mv('u+1+2', 'Крылья пламени', 'm', 34, 28, 4, 32, -16, 'K', { a: 'splash', r: 1.15, jumpy: true, jh: 0.9, gr: true, lc: [6, 32], fx: 'fire' })
    ])
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
