(function (T) {
  'use strict';
  const { mv, chain, nx, addFighter, tenHit, THROWS } = T;

  THROWS.volk1 = {
    dur: 60, dmg: [[34, 1]], end: { face: 'down', off: [0.8, 0, 0] }, aRec: 10,
    a: [[8, 'grab'], [16, 'lift'], [26, 'liftHigh'], [34, 'slamDown'], [60, 'stance']],
    v: [[0, [0.55, 0, 0], 0, 0, 'held'], [16, [0.35, 0.5, 0], 0.9, 0, 'fly'], [26, [0.05, 1.5, 0], 1.57, 0, 'fly'], [34, [0.8, 0.12, 0], 1.57, 0, 'limp'], [60, [0.8, 0.12, 0], 1.57, 0, 'limp']],
    shake: [[34, 10]]
  };
  THROWS.volk2 = {
    dur: 70, dmg: [[20, 0.45], [40, 0.55]], end: { face: 'down', off: [0.8, 0, 0] }, aRec: 14,
    a: [[10, 'twist'], [18, 'kneelHold'], [58, 'kneelHold'], [70, 'stance']],
    v: [[0, [0.8, 0.12, 0], 1.57, 0, 'limp'], [70, [0.8, 0.12, 0], 1.57, 0, 'limp']],
    shake: [[20, 5], [40, 7]]
  };
  THROWS.volk3 = {
    dur: 80, dmg: [[60, 1]], end: { face: 'up', off: [0.9, 0, 0] }, aRec: 12,
    a: [[12, 'lift'], [30, 'liftHigh'], [46, 'liftHigh'], [60, 'slamDown'], [80, 'stance']],
    v: [[0, [0.8, 0.12, 0], 1.57, 0, 'limp'], [18, [0.35, 0.8, 0], 0.4, 0, 'fly'], [30, [0.05, 1.6, 0], -1.57, 0, 'fly'], [46, [0.05, 1.7, 0], -1.57, 0, 'fly'], [60, [0.85, 0.1, 0], -1.57, 0, 'limp'], [80, [0.9, 0, 0], -1.57, 0, 'limp']],
    shake: [[60, 14]]
  };
  T.throwChain([
    ['volk1', [{ c: '1+2', w: [36, 52], next: 'volk2', brk: 1, win: 14, dmg: 34 }]],
    ['volk2', [{ c: '2+4', w: [42, 60], next: 'volk3', brk: 2, win: 14, dmg: 40 }]]
  ]);

  addFighter(tenHit({
    id: 'kenta', slot: 0, name: 'Кэнта Арамаки', short: 'КЭНТА', en: 'KENTA ARAMAKI',
    country: 'Япония', age: 21, style: 'Кёкусин-карате', blood: 'A',
    bio: 'Ученик старого додзё из Осаки. Корпорация выкупила здание, и учитель остался без школы. Кэнта едет на турнир, чтобы выкупить додзё обратно.',
    quote: 'Каждый удар — поклон моему учителю.',
    stance: 'karate', voice: { pitch: 1.0, kind: 'm' }, intro: 'bow', wins: ['bow', 'fist'],
    stage: 'dojo', music: 'kenta',
    look: { skin: '#d6a07a', hair: '#141010', hairStyle: 'short', fringe: true, top: '#2a3a6a', sleeves: 'short', pants: '#2a3a6a', gi: true, belt: '#6a3a1a', shoes: null, wrist: '#e8e0d0' },
    costumes: [{}, { top: '#ecece4', pants: '#ecece4', belt: '#141414' }, { top: null, sleeves: null, pants: '#1a1a1a', belt: '#b01818', wrist: '#b01818' }, { top: '#8a1a1a', pants: '#1a1a1a', belt: '#e8c040', gi: false, shoes: '#202020' }],
    ai: { fav: ['f,n,d,df+2', 'df+1', 'd+4', 'ws 4', 'db+3', '1,2,4'] },
    moves: [
      mv('f,n,d,df', 'Бросок в присед', 'x', 0, 14, 1, 6, 0, 0, { a: { k: 'pose', mods: { '+p': [0.1, -0.32, 0], '+cp': 0.35 } }, mv: 0.85, crouch: true, fc: true, nx: [nx('2', 'cd2', [3, 16], 6), nx('1', 'cd1', [3, 16], 6), nx('4', 'cd4', [3, 16], 6)] }),
      mv('~f,n,d,df+2', 'Громовой апперкот', 'm', 22, 14, 2, 20, 4, 'L', { a: 'upper:r', r: 0.98, y: 1.4, fx: 'spark', lift: 1.08 }),
      mv('f,n,d,df+2', 'Апперкот-молния', 'm', 18, 16, 2, 26, -12, 'L', { a: 'upper:r', r: 0.95, y: 1.4, mv: 0.3 }),
      chain('cd2', 'Апперкот-молния', 'm', 18, 13, 2, 26, -12, 'L', { a: 'upper:r', r: 0.95, y: 1.4 }),
      mv('f,n,d,df+1', 'Кулак-вспышка', 'm', 16, 15, 2, 20, -8, 4, { a: 'body:l', r: 0.95, ch: 'K', mv: 0.3 }),
      chain('cd1', 'Кулак-вспышка', 'm', 16, 12, 2, 20, -8, 4, { a: 'body:l', r: 0.95, ch: 'K' }),
      mv('f,n,d,df+4', 'Подсечка-вспышка', 'l', 16, 18, 3, 26, -18, 'T', { a: 'sweep:r', r: 1.15, mv: 0.3, crouch: true }),
      chain('cd4', 'Подсечка-вспышка', 'l', 16, 15, 3, 26, -18, 'T', { a: 'sweep:r', r: 1.15, crouch: true }),
      mv('f+4', 'Удар пяткой сверху', 'm', 20, 20, 3, 22, -6, 'K', { a: 'axe:r', r: 1.05 }),
      mv('b+4', 'Удар с разворота', 'h', 22, 16, 3, 26, -12, 'B', { a: 'spin:r', r: 1.12, w: 0.3 }),
      mv('db+3', 'Низкий раундхаус', 'l', 12, 16, 3, 22, -14, -2, { a: 'lowk:l', r: 1.05, crouch: true, fc: true, w: 0.45 }),
      mv('f,f+2', 'Удар с прорывом', 'm', 18, 16, 2, 24, -8, 'B', { a: 'straight:r', r: 1.05, mv: 0.45 }),
      mv('b+1+2', 'Уке — отражение', 'x', 0, 18, 1, 10, 0, 0, { a: { k: 'pose', mods: { lh: [0.42, 0.52, 0.05], rh: [0.2, 0.25, 0.14], '+cy': -0.2 } }, parry: [2, 16], pOnly: 'p', rev: 'reverse', revDmg: 24 }),
      mv('d+1+2', 'Кулак-гром', 'u', 38, 44, 3, 20, 0, 'B', { a: 'hammer:r', r: 1.0, fx: 'charge' }),
      mv('ss 2', 'Удар с ухода', 'm', 16, 14, 2, 20, -6, 'K', { a: 'hook:r', r: 0.9, w: 0.7 }),
      mv('df+4', 'Мае-гери', 'm', 14, 14, 3, 18, -6, 2, { a: 'front:r', r: 1.08 }),
      mv('1', 'Джеб', 'h', 5, 10, 2, 13, 1, 8, { a: 'jab', r: 0.9, w: 0.22, nx: [nx('2', '1,2', [2, 20], 14)] }),
      chain('1,2', 'Раз-два', 'h', 11, 9, 2, 17, -3, 7, { a: 'cross', r: 0.92, nx: [nx('4', '1,2,4', [3, 18], 12)] }),
      chain('1,2,4', 'Раз-два и хай-кик', 'h', 18, 12, 3, 24, -11, 'K', { a: 'round:r', r: 1.05, w: 0.5 })
    ]
  }, { seq: '1,2,2,4,3,1,2,1,4,2', lv: 'hhmmlmhhmm', dmg: [5, 8, 8, 10, 8, 6, 8, 8, 12, 22] }));

  addFighter(tenHit({
    id: 'ray', slot: 1, name: 'Рэй Мэддокс', short: 'РЭЙ', en: 'RAY MADDOX',
    country: 'США', age: 34, style: 'Уличный бой и дзюдо', blood: 'O',
    bio: 'Бывший докер из Бостона, чемпион подпольных боёв. Задолжал людям, которым не отказывают. Призовые турнира — его единственный шанс.',
    quote: 'Ещё раунд? Я только размялся!',
    stance: 'boxer', voice: { pitch: 0.85, kind: 'm' }, intro: 'flex', wins: ['flex', 'fist'],
    stage: 'docks', music: 'ray', hp: 180,
    body: { size: 1.04 },
    look: { skin: '#e6b48c', hair: '#5a3a20', hairStyle: 'short', beard: '#5a3a20', top: '#f0f0e6', sleeves: null, pants: '#3a5aa0', shoes: '#2a1a10', gloves: '#1e1e1e', belt: '#2a1a10', girth: 1.12, armG: 1.15, legG: 1.05, neck: 1.2 },
    costumes: [{}, { top: '#1a1a1a', pants: '#4a5a3a' }, { top: '#2a1a10', sleeves: 'long', open: true, pants: '#1a1a1a', gloves: '#2a1a10' }, { top: '#b01818', pants: '#e8e0d0', shoes: '#f0f0f0' }],
    ai: { fav: ['d,df,f+2', 'df+1', 'b+1', '1,2', 'db+2', 'd,df,f+1'] },
    moves: [
      mv('d,df,f+2', 'Молот Мэддокса', 'm', 30, 19, 3, 26, -9, 'B', { a: 'straight:r', r: 1.02, y: 1.2, mv: 0.35, blow: 1.4 }),
      mv('d,df,f+1', 'Пушечный удар', 'm', 20, 15, 2, 22, -7, 'K', { a: 'body:l', r: 0.95, mv: 0.2 }),
      mv('f+1+2', 'Двойной молот', 'm', 25, 22, 3, 24, -5, 'K', { a: 'hammer:r', r: 1.0 }),
      mv('df+2', 'Апперкот докера', 'm', 17, 15, 2, 22, -12, 'L', { a: 'upper:r', r: 0.88, y: 1.4 }),
      mv('b+1', 'Левый хук', 'h', 14, 13, 2, 17, -3, 5, { a: 'hook:l', r: 0.88, w: 0.6, trk: 0.6 }),
      mv('f,f+2', 'Таран корпусом', 'm', 22, 16, 3, 24, -9, 'B', { a: 'shoulder', r: 0.95, mv: 0.6 }),
      mv('db+2', 'Удар по печени', 'm', 14, 14, 2, 20, -4, 'D', { a: 'body:r', r: 0.85, y: 1.0 }),
      mv('f+2', 'Прямой с шага', 'h', 16, 14, 2, 18, -4, 6, { a: 'straight:r', r: 1.0, mv: 0.25 }),
      mv('b+4', 'Колено в корпус', 'm', 16, 12, 3, 24, -12, 'L', { a: 'knee:r', r: 0.62 }),
      mv('u+1+2', 'Прыжок-молот', 'm', 28, 26, 4, 24, -10, 'K', { a: 'hammer:r', r: 1.0, jumpy: true, jh: 0.5, lc: [5, 28], gr: true }),
      mv('d,df,f+1+2', 'Сэои-нагэ', 't', 45, 12, 2, 30, 0, 0, { throw: 'hip', brk: 12, r: 0.95 }),
      mv('2+4', 'Бросок через голову', 't', 38, 12, 2, 28, 0, 0, { throw: 'tomoe', brk: 2, r: 0.9 }),
      chain('1,2', 'Раз-два', 'h', 11, 9, 2, 17, -3, 7, { a: 'cross', r: 0.92, nx: [nx('2', '1,2,2', [3, 18], 12)] }),
      chain('1,2,2', 'Раз-два в корпус', 'm', 16, 12, 2, 22, -9, 'K', { a: 'body:r', r: 0.9 })
    ]
  }, { seq: '1,2,1,2,2,4,3,4,1,2', lv: 'hhhmmmlhmm', dmg: [5, 8, 8, 10, 10, 10, 8, 12, 10, 24], end: 'B' }));

  addFighter(tenHit({
    id: 'yalan', slot: 2, name: 'Сун Ялань', short: 'ЯЛАНЬ', en: 'SUN YALAN',
    country: 'Китай', age: 17, style: 'Багуачжан', blood: 'B',
    bio: 'Внучка хозяйки старой чайной в Цзинани. Бабушка научила её ходить по кругу и не стоять на линии удара. Чайную грозят снести ради торгового центра.',
    quote: 'Ты бил туда, где меня уже не было!',
    stance: 'kung', voice: { pitch: 1.65, kind: 'f' }, intro: 'bow', wins: ['bow', 'fist'],
    stage: 'garden', music: 'yalan', hp: 165, walk: 1.1, dash: 1.1, ss: 1.25,
    body: { size: 0.93, shW: 0.165, chestW: 0.32, chestD: 0.2, waistW: 0.24, pelW: 0.33, arm: [0.05, 0.04, 0.04, 0.032], leg: [0.09, 0.064, 0.058, 0.04], headR: 0.112, neckR: 0.042 },
    look: { skin: '#f0c8a0', hair: '#141010', hairStyle: 'braid', fringe: true, top: '#2a8a6a', sleeves: null, pants: '#f0f0e8', shoes: '#141414', belt: '#e8c040', lip: '#c05050', armG: 0.9 },
    costumes: [{}, { top: '#b01818', belt: '#e8c040', pants: '#1a1a1a' }, { top: '#f0f0e8', pants: '#2a3a6a', belt: '#b01818' }, { top: '#6a2a8a', pants: '#f0e0f0' }],
    stances: {
      lotus: { low: true, pose: { '+p': [0.02, -0.12, 0], cp: 0.3, lh: [0.4, 0.2, -0.05], rh: [0.3, 0.15, 0.12], lo: 1, ro: 1 }, exit: 'b', max: 80, move: 1.2 },
      back: { pose: { by: Math.PI, '+p': [0, -0.04, 0], hy: 0 }, exit: 'b', max: 70 }
    },
    ai: { fav: ['u+4', 'df+1', 'db+3', 'b+1', 'f+1+2', 'd+1+2'] },
    moves: [
      mv('d+1+2', 'Стойка «Лотос»', 'x', 0, 8, 1, 4, 0, 0, { a: { k: 'pose', mods: { '+p': [0, -0.4, 0], cp: 0.35 } }, stance: 'lotus', crouch: true }),
      mv('st:lotus 1', 'Лотос: ладонь', 'm', 12, 12, 2, 16, -2, 5, { a: 'palm', r: 0.85, crouch: true }),
      mv('st:lotus 2', 'Лотос: вихрь', 'm', 15, 15, 3, 20, -8, 'K', { a: 'back:r', r: 0.9, w: 0.7 }),
      mv('st:lotus 3', 'Лотос: подсечка', 'l', 13, 14, 3, 22, -14, 'T', { a: 'sweep:l', r: 1.08, crouch: true }),
      mv('st:lotus 4', 'Лотос: взлёт', 'm', 17, 15, 3, 24, -14, 'L', { a: 'front:r', r: 1.0, y: 1.3 }),
      mv('b+3+4', 'Спина дракона', 'x', 0, 10, 1, 4, 0, 0, { a: { k: 'pose', mods: { by: Math.PI * 0.9 } }, stance: 'back' }),
      mv('st:back 1', 'Спиной: кулак', 'h', 12, 10, 2, 16, 0, 6, { a: 'back:r', r: 0.9 }),
      mv('st:back 4', 'Спиной: удар мула', 'm', 18, 15, 3, 22, -10, 'B', { a: 'spin:r', r: 1.05 }),
      mv('st:back 3', 'Спиной: низкий', 'l', 13, 14, 3, 22, -14, 1, { a: 'lowk:l', r: 1.0 }),
      mv('f+1+2', 'Ладони феникса', 'm', 18, 16, 3, 22, -6, 'B', { a: 'palm', r: 1.0, mv: 0.2 }),
      mv('df+1', 'Удар ладонью', 'm', 11, 12, 2, 15, 0, 5, { a: { k: 'straight:l', lo: 1 }, r: 0.88 }),
      mv('b+1', 'Вихрь', 'h', 14, 13, 2, 18, -4, 6, { a: 'back:r', r: 0.9, w: 0.5, bt: true }),
      mv('ss 1', 'Уход с ладонью', 'm', 12, 12, 2, 16, -2, 5, { a: 'palm', r: 0.9, w: 0.5 }),
      mv('db+3', 'Ножницы', 'l', 14, 18, 3, 24, -15, 'T', { a: 'sweep:l', r: 1.12, crouch: true, fc: true }),
      mv('u+4', 'Кувырок с ударом', 'm', 16, 14, 3, 26, -14, 'L', { a: 'flip:r', r: 1.0, lc: [3, 30] }),
      mv('f,f+3', 'Скользящий удар', 'm', 16, 15, 3, 22, -8, 'K', { a: 'side:l', r: 1.1, mv: 0.5 }),
      mv('1', 'Тычок ладонью', 'h', 5, 9, 2, 13, 1, 8, { a: 'jab', r: 0.88, nx: [nx('2', '1,2', [2, 20], 13), nx('1', '1,1', [2, 16], 11)] }),
      chain('1,1', 'Двойная ладонь', 'h', 6, 8, 2, 14, 0, 7, { a: 'cross', r: 0.9, nx: [nx('1', '1,1,1', [2, 16], 11)] }),
      chain('1,1,1', 'Тройная ладонь', 'm', 12, 10, 2, 22, -9, 'K', { a: 'palm', r: 0.95 }),
      mv('2+4', 'Бросок кувырком', 't', 36, 12, 2, 28, 0, 0, { throw: 'tomoe', brk: 2, r: 0.9 })
    ]
  }, { seq: '1,2,1,4,3,3,4,1,2,1', lv: 'hhmhmlmhmm', dmg: [5, 7, 7, 8, 8, 6, 10, 6, 8, 18] }));

  addFighter(tenHit({
    id: 'rafael', slot: 3, name: 'Рафаэл Соуза', short: 'РАФАЭЛ', en: 'RAFAEL SOUZA',
    country: 'Бразилия', age: 28, style: 'Капоэйра Ангола', blood: 'O',
    bio: 'Местре из Салвадора. Его роду на старой площади хотят закрыть, а детей разогнать. Рафаэл привёз на турнир беримбау и лёгкие ноги.',
    quote: 'Вставай в роду ещё раз, друг.',
    stance: 'capoeira', voice: { pitch: 0.95, kind: 'm' }, intro: 'flex', wins: ['flex', 'fist'],
    stage: 'beach', music: 'rafael', walk: 1.05, ss: 1.1,
    body: { size: 1.02 },
    look: { skin: '#7a4a2a', hair: '#1a1210', hairStyle: 'bald', beard: '#1a1210', top: null, pants: '#f2f0e8', belt: '#c8c820', shoes: null, legG: 1.03 },
    costumes: [{}, { pants: '#2a4aa0', belt: '#c01818' }, { top: '#c01818', sleeves: null, pants: '#1a1a1a', belt: '#f0f0f0' }, { pants: '#e8c040', belt: '#20a040' }],
    stances: {
      neg: { low: true, pose: { p: [-0.15, 0.42, 0], cp: -0.2, py: 0.3, lh: [-0.1, -0.35, -0.3], rh: [0.3, 0.3, 0.2], lf: [0.45, 0.075, -0.18], rf: [0.05, 0.075, 0.2], lk: [1, 0.3, -0.3], rk: [1, 0.8, 0.3], lo: 1, ro: 1 }, exit: 'b', max: 70 },
      hand: { pose: { p: [0, 0.95, 0], bp: Math.PI, py: 0, cy: 0, cp: 0, hp: 0.6, lh: [0.02, 0.86, -0.2], rh: [0.02, 0.86, 0.2], le: [0, 0, -1], re: [0, 0, 1], lf: [0.25, 0.1, -0.2], rf: [-0.2, 0.1, 0.2], lk: [-1, 0, -0.2], rk: [1, 0, 0.2], lo: 1, ro: 1 }, exit: 'b', max: 60 }
    },
    ai: { fav: ['d+3', 'u+3+4', 'df+4', '4', 'd+3+4', 'b+4'] },
    moves: [
      mv('1', 'Шлепок', 'h', 6, 11, 2, 14, 0, 6, { a: { k: 'jab', lo: 1 }, r: 0.88, nx: [nx('2', '1,2', [2, 20], 14)] }),
      mv('2', 'Кабесада', 'm', 16, 16, 3, 20, -8, 'K', { a: 'headbutt', r: 0.75 }),
      mv('3', 'Мейя-луа', 'h', 16, 15, 3, 22, -10, 5, { a: 'round:l', r: 1.1, w: 0.7, trk: 0.6 }),
      mv('4', 'Армада', 'h', 20, 17, 3, 24, -12, 'K', { a: 'spin:r', r: 1.12, w: 0.6 }),
      mv('df+3', 'Бенсау', 'm', 14, 14, 3, 18, -6, 'B', { a: 'push:l', r: 1.1 }),
      mv('df+4', 'Мартелу', 'm', 16, 15, 3, 22, -9, 4, { a: 'round:r', r: 1.08, y: 1.1 }),
      mv('b+4', 'Керишада', 'm', 18, 18, 3, 22, -8, 'K', { a: 'axe:r', r: 1.05 }),
      mv('d+3', 'Рашштейра', 'l', 13, 16, 3, 24, -14, 'T', { a: 'sweep:l', r: 1.15, crouch: true, fc: true, w: 0.6 }),
      mv('f,f+3', 'Ау-батиду', 'm', 20, 20, 3, 24, -10, 'K', { a: 'hop:l', r: 1.15, jumpy: true, jh: 0.55, lc: [4, 26], mv: 0.3 }),
      mv('u+3+4', 'Мортал', 'm', 16, 14, 3, 28, -15, 'L', { a: 'flip:r', r: 1.02, lc: [3, 32] }),
      mv('ss 4', 'Кашифа', 'm', 16, 15, 3, 22, -9, 'K', { a: 'round:r', r: 1.05, w: 0.8, y: 1.1 }),
      mv('d+3+4', 'Негатива', 'x', 0, 10, 1, 4, 0, 0, { a: { k: 'pose', mods: { p: [-0.1, 0.45, 0], cp: -0.1 } }, stance: 'neg', crouch: true }),
      mv('st:neg 3', 'Негатива: подсечка', 'l', 14, 13, 3, 22, -14, 'T', { a: 'sweep:l', r: 1.15, crouch: true }),
      mv('st:neg 4', 'Негатива: подъём', 'm', 18, 16, 3, 26, -15, 'L', { a: 'front:r', r: 1.05, y: 1.3 }),
      mv('st:neg 1+2', 'Негатива: колесо', 'm', 16, 18, 3, 22, -10, 'K', { a: 'hop:r', r: 1.1, jumpy: true, mv: 0.3 }),
      mv('b+3+4', 'Бананейра', 'x', 0, 14, 1, 4, 0, 0, { a: { k: 'pose', mods: { bp: 2.4, '+p': [0, 0.05, 0] } }, stance: 'hand' }),
      mv('st:hand 3', 'На руках: удар', 'm', 14, 12, 3, 20, -8, 3, { a: { k: 'pose', mods: { p: [0, 0.95, 0], bp: Math.PI, lf: [-0.6, 0.3, -0.1], rf: [-0.2, 0.2, 0.2] } }, r: 1.05 }),
      mv('st:hand 4', 'На руках: молот', 'm', 18, 15, 3, 22, -10, 'K', { a: { k: 'pose', mods: { p: [0, 0.95, 0], bp: Math.PI + 0.6, rf: [-0.7, 0.4, 0.1] } }, r: 1.1 }),
      mv('st:hand 3+4', 'На руках: двойной', 'm', 22, 17, 3, 26, -12, 'B', { a: { k: 'pose', mods: { p: [0.1, 1.0, 0], bp: Math.PI + 0.9, lf: [-0.7, 0.3, -0.1], rf: [-0.7, 0.35, 0.1] } }, r: 1.15 }),
      mv('2+4', 'Бросок с разворота', 't', 36, 12, 2, 28, 0, 0, { throw: 'hip', brk: 2, r: 0.9 }),
      mv('1+3', 'Удар головой', 't', 34, 12, 2, 28, 0, 0, { throw: 'headbutt', brk: 1, r: 0.9 })
    ]
  }, { seq: '1,2,3,4,3,4,3,3,4,4', lv: 'hmhmlmhlmm', dmg: [6, 8, 8, 10, 8, 10, 8, 8, 10, 20], anims: [null, null, 'round:l', 'round:r', 'lowk:l', 'front:r', 'round:l', 'sweep:l', 'axe:r', 'spin:r'] }));

  addFighter({
    id: 'volkov', slot: 4, name: 'Григорий Волков', short: 'ВОЛКОВ', en: 'GRIGORY VOLKOV',
    country: 'Россия', age: 41, style: 'Боевое самбо', blood: 'A',
    bio: 'Мастер спорта из Екатеринбурга, двадцать лет у проходной родного завода. Завод закрывают, людей увольняют. Волков хочет выкупить цех и вернуть бригаду на работу.',
    quote: 'Земля держит крепче любых рук.',
    stance: 'wrestler', voice: { pitch: 0.78, kind: 'm' }, intro: 'flex', wins: ['flex', 'fist'],
    stage: 'factory', music: 'volkov', hp: 185, walk: 0.9, dash: 0.9, bulk: 1.12,
    body: { size: 1.1 },
    look: { skin: '#e0b090', hair: '#6a5a4a', hairStyle: 'short', stache: '#5a4a3a', top: '#b01818', sleeves: 'short', pants: '#2040a0', shorts: true, shoes: '#b01818', belt: '#101010', girth: 1.25, armG: 1.2, legG: 1.15, neck: 1.3 },
    costumes: [{}, { top: '#2040a0', pants: '#b01818', shoes: '#2040a0' }, { top: '#4a5a3a', pants: '#3a4a2a', shorts: false, shoes: '#1a1a1a' }, { top: '#7a7a7a', sleeves: null, pants: '#1a1a1a', shorts: false, shoes: '#1a1a1a' }],
    ai: { fav: ['f,f+1+2', 'd,db,b+1', 'f+1+2', '2+4', 'df+2', 'b+1+2', 'df+1+2'] },
    moves: [
      mv('f,f+1+2', 'Мельница', 't', 35, 13, 2, 32, 0, 0, { throw: 'volk1', brk: 12, r: 1.0, mv: 0.35 }),
      mv('d,db,b+1', 'Рычаг локтя', 't', 40, 13, 2, 30, 0, 0, { throw: 'armbar', brk: 1, r: 0.95 }),
      mv('df+1+2', 'Проход в ноги', 't', 42, 14, 3, 32, 0, 0, { throw: 'slam', brk: 12, r: 1.0, low: true }),
      mv('f+1+2', 'Бросок через грудь', 't', 42, 12, 2, 30, 0, 0, { throw: 'suplex', brk: 12, r: 0.9 }),
      mv('2+4', 'Подъём и бросок', 't', 40, 12, 2, 28, 0, 0, { throw: 'slam', brk: 2, r: 0.9 }),
      mv('df+2', 'Удар ладонью снизу', 'm', 16, 16, 2, 24, -13, 'L', { a: 'upper:r', r: 0.88, y: 1.35 }),
      mv('b+1+2', 'Удар по ушам', 'h', 20, 18, 2, 22, -6, 'S', { a: 'palm', r: 0.9, y: 1.5 }),
      mv('f,f+2', 'Таран', 'm', 22, 17, 3, 24, -8, 'B', { a: 'shoulder', r: 0.95, mv: 0.6 }),
      mv('3+4', 'Прыжок с падением', 'm', 26, 24, 4, 30, -15, 'K', { a: 'splash', r: 1.0, jumpy: true, jh: 0.5, gr: true, lc: [6, 28] }),
      mv('b+2', 'Хлёсткий удар', 'h', 14, 14, 2, 18, -4, 6, { a: 'hook:r', r: 0.9, w: 0.6 }),
      mv('df+1', 'Удар в солнечное', 'm', 12, 13, 2, 16, -2, 4, { a: 'body:l', r: 0.9 }),
      mv('d+4', 'Подсечка стопой', 'l', 10, 14, 2, 20, -12, -2, { a: 'lowk:r', r: 1.0, crouch: true, fc: true })
    ]
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
