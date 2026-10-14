(function (T) {
  'use strict';
  const { mv, chain, nx, addFighter, tenHit, THROWS } = T;

  THROWS.iri1 = Object.assign({}, THROWS.reverse, { dur: 56 });
  THROWS.iri2 = {
    dur: 60, dmg: [[26, 0.4], [44, 0.6]], end: { face: 'down', off: [0.85, 0, 0.2] }, aRec: 10,
    a: [[10, 'kneelHold'], [26, 'kneelHold'], [36, 'grab'], [44, 'slamDown'], [60, 'stance']],
    v: [[0, [0.85, 0.05, 0.2], 1.57, 0, 'limp'], [60, [0.85, 0.05, 0.2], 1.57, 0, 'limp']],
    shake: [[26, 5], [44, 8]]
  };
  THROWS.clinch = {
    dur: 76, dmg: [[22, 0.25], [38, 0.25], [54, 0.5]], end: { face: 'down', off: [0.8, 0, 0] }, aRec: 6,
    a: [[8, 'grab'], [18, 'grab'], [22, 'kneeUp'], [30, 'grab'], [38, 'kneeUp'], [46, 'grab'], [54, 'kneeUp'], [64, 'shove'], [76, 'stance']],
    v: [[0, [0.55, 0, 0], 0.2, 0, 'held'], [22, [0.52, 0.05, 0], 0.55, 0, 'double'], [38, [0.52, 0.08, 0], 0.65, 0, 'double'], [54, [0.55, 0.12, 0], 0.75, 0, 'double'], [64, [0.7, 0.05, 0], 1.0, 0, 'double'], [76, [0.8, 0, 0], 1.57, 0, 'limp']],
    shake: [[22, 3], [38, 3], [54, 6]]
  };
  T.throwChain([['iri1', [{ c: '2', w: [22, 44], next: 'iri2', brk: 2, win: 12, dmg: 28 }]]]);

  addFighter(tenHit({
    id: 'minjun', slot: 5, name: 'Кан Мин-Джун', short: 'МИН-ДЖУН', en: 'KANG MIN-JUN',
    country: 'Южная Корея', age: 19, style: 'Тхэквондо', blood: 'AB',
    bio: 'Самый быстрый ногами студент сеульского университета спорта. Родители держат закусочную у рынка Намдэмун, а аренда растёт быстрее выручки.',
    quote: 'Руки — для еды. Ноги — для победы.',
    stance: 'tkd', voice: { pitch: 1.15, kind: 'm' }, intro: 'flex', wins: ['fist', 'flex'],
    stage: 'seoul', music: 'minjun', hp: 165, walk: 1.05, dash: 1.1,
    body: { size: 0.99 },
    look: { skin: '#f0c8a0', hair: '#141010', hairStyle: 'pony', fringe: true, top: '#f2f2f2', sleeves: 'long', pants: '#f2f2f2', shoes: null, belt: '#141414', trim: '#141414', legG: 1.0 },
    costumes: [{}, { top: '#1a1a1a', pants: '#1a1a1a', belt: '#b01818' }, { top: '#b01818', sleeves: 'long', pants: '#1a1a1a', shoes: '#f0f0f0' }, { top: '#2040a0', pants: '#f2f2f2' }],
    stances: {
      crane: { pose: { lf: [0.12, 0.5, -0.06], lk: [1, 0.6, 0], '+p': [-0.02, 0.04, 0], cp: 0.02, lh: [0.25, 0.3, -0.15], rh: [0.15, 0.25, 0.15] }, exit: 'b', max: 60 }
    },
    ai: { fav: ['3', '4', 'b+3+4', 'f,f+4', 'db+4', '3+4', '4,4'] },
    moves: [
      mv('3', 'Ап-чаги', 'm', 12, 12, 3, 16, -4, 4, { a: 'front:l', r: 1.05, nx: [nx('3', '3,3', [3, 16], 12), nx('4', '3,4', [3, 16], 12)] }),
      chain('3,3', 'Двойной ап-чаги', 'h', 14, 10, 3, 18, -6, 'K', { a: 'round:l', r: 1.08, stance: 'crane' }),
      chain('3,4', 'Ап-чаги и долио', 'h', 16, 11, 3, 20, -9, 'K', { a: 'round:r', r: 1.1, w: 0.5 }),
      mv('4', 'Долио-чаги', 'h', 18, 13, 3, 20, -9, 5, { a: 'round:r', r: 1.1, w: 0.55, trk: 0.4, nx: [nx('4', '4,4', [3, 16], 12)] }),
      chain('4,4', 'Двойной долио', 'm', 16, 12, 3, 22, -10, 'K', { a: 'round:r', r: 1.08, y: 1.1 }),
      mv('3+4', 'Стойка «Журавль»', 'x', 0, 8, 1, 3, 0, 0, { a: { k: 'pose', mods: { lf: [0.12, 0.5, -0.06] } }, stance: 'crane' }),
      mv('st:crane 3', 'Журавль: удар', 'm', 12, 9, 3, 16, -3, 4, { a: 'front:l', r: 1.05, stance: 'crane' }),
      mv('st:crane 4', 'Журавль: высокий', 'h', 18, 11, 3, 20, -8, 'K', { a: 'round:r', r: 1.1, w: 0.55 }),
      mv('st:crane 2', 'Журавль: прямой', 'h', 12, 10, 2, 16, -2, 6, { a: 'cross', r: 0.95 }),
      mv('f+4', 'Твио ап-чаги', 'm', 18, 18, 3, 22, -8, 'K', { a: 'hop:r', r: 1.1, jumpy: true, lc: [4, 24] }),
      mv('b+4', 'Двит-чаги', 'm', 22, 16, 3, 26, -12, 'B', { a: 'spin:r', r: 1.12 }),
      mv('b+3+4', 'Сальто', 'm', 18, 13, 3, 28, -16, 'L', { a: 'flip:l', r: 1.02, lc: [2, 30] }),
      mv('d+3', 'Низкий удар', 'l', 11, 14, 3, 20, -12, -1, { a: 'lowk:l', r: 1.05, crouch: true, fc: true }),
      mv('db+4', 'Подсечка с разворота', 'l', 16, 18, 3, 24, -16, 'T', { a: 'sweep:r', r: 1.15, crouch: true, fc: true, w: 0.7 }),
      mv('ss 3+4', 'Торнадо', 'h', 22, 18, 3, 26, -12, 'K', { a: 'spin:l', r: 1.15, w: 0.8 }),
      mv('f,f+4', 'Летящий удар', 'h', 22, 17, 3, 24, -8, 'B', { a: 'hop:r', r: 1.2, mv: 0.7, jumpy: true, lc: [4, 22] }),
      mv('df+3', 'Удар в корпус', 'm', 13, 13, 3, 18, -5, 3, { a: 'side:l', r: 1.1 }),
      mv('1+3', 'Бросок с подножкой', 't', 34, 12, 2, 28, 0, 0, { throw: 'hip', brk: 1, r: 0.9 })
    ]
  }, { seq: '1,2,3,3,4,4,3,4,3,4', lv: 'hhmhmhlmmh', dmg: [5, 7, 8, 8, 8, 10, 8, 8, 10, 22], anims: [null, null, 'front:l', 'round:l', 'front:r', 'round:r', 'lowk:l', 'side:r', 'front:l', 'spin:r'] }));

  addFighter(tenHit({
    id: 'irina', slot: 6, name: 'Ирина Соколова', short: 'ИРИНА', en: 'IRINA SOKOLOVA',
    country: 'Россия', age: 26, style: 'Айкидо и крав-мага', blood: 'B',
    bio: 'Телохранитель из Петербурга. Её клиент исчез на прошлом турнире, а организаторы молчат. Ирина пришла за ответами — и за человеком, который их знает.',
    quote: 'Твоя сила — теперь моя.',
    stance: 'aiki', voice: { pitch: 1.45, kind: 'f' }, intro: 'default', wins: ['fist', 'bow'],
    stage: 'roof', music: 'irina', hp: 165, walk: 1.05,
    body: { size: 0.96, shW: 0.17, chestW: 0.33, chestD: 0.21, waistW: 0.25, pelW: 0.33, arm: [0.052, 0.042, 0.042, 0.034], leg: [0.09, 0.066, 0.06, 0.042], headR: 0.112, neckR: 0.043 },
    look: { skin: '#f0d0b8', hair: '#1a1616', hairStyle: 'bob', fringe: true, top: '#3a4a2a', sleeves: 'long', pants: '#1a1a1a', shoes: '#141414', gloves: '#1a1a1a', belt: '#141414', lip: '#b04040', armG: 0.9 },
    costumes: [{}, { top: '#1a1a1a', pants: '#1a1a1a', gloves: null, belt: '#f0f0f0' }, { top: '#a02020', pants: '#2a2a2a' }, { top: '#e8e8e8', pants: '#8a8a8a', shoes: '#f0f0f0' }],
    ai: { fav: ['1,1', 'df+1', 'f+4', 'b+1+3', 'd+4', 'f,f+1+2', 'db+3'] },
    moves: [
      mv('b+1+3', 'Перехват руки', 'x', 0, 16, 1, 12, 0, 0, { a: { k: 'pose', mods: { lh: [0.45, 0.4, 0], rh: [0.35, 0.35, 0.1], lo: 1, ro: 1, '+p': [-0.05, 0, 0] } }, parry: [2, 14], pOnly: 'p', rev: 'reverse', revDmg: 26 }),
      mv('b+2+4', 'Перехват ноги', 'x', 0, 16, 1, 12, 0, 0, { a: { k: 'pose', mods: { lh: [0.4, 0.05, 0], rh: [0.35, 0.02, 0.1], lo: 1, ro: 1, '+p': [-0.05, -0.1, 0], '+cp': 0.2 } }, parry: [2, 14], pOnly: 'k', rev: 'armbar', revDmg: 30 }),
      mv('f,f+1+2', 'Бросок-ловушка', 't', 32, 12, 2, 28, 0, 0, { throw: 'iri1', brk: 12, r: 1.0, mv: 0.3 }),
      mv('1', 'Джеб', 'h', 5, 9, 2, 13, 1, 8, { a: 'jab', r: 0.88, nx: [nx('2', '1,2', [2, 20], 13), nx('1', '1,1', [2, 16], 10)] }),
      chain('1,1', 'Двойной джеб', 'h', 6, 7, 2, 14, 1, 8, { a: 'jab', r: 0.9 }),
      mv('df+1', 'Удар в солнечное', 'm', 11, 12, 2, 15, 0, 5, { a: 'body:l', r: 0.88 }),
      mv('d+4', 'Тычок по голени', 'l', 7, 11, 2, 18, -11, -3, { a: 'lowk:r', r: 1.0, crouch: true, fc: true }),
      mv('db+3', 'Удар по колену', 'l', 12, 14, 3, 20, -12, 2, { a: 'lowk:l', r: 1.0 }),
      mv('b+4', 'Удар каблуком назад', 'm', 20, 17, 3, 24, -12, 'K', { a: 'spin:r', r: 1.1 }),
      mv('f+4', 'Колено', 'm', 16, 13, 3, 24, -12, 'L', { a: 'knee:r', r: 0.62 }),
      mv('d+1+2', 'Удар по шее', 'h', 14, 14, 2, 18, -4, 'S', { a: { k: 'hook:r', lo: 1 }, r: 0.88 }),
      mv('u+4', 'Прыжок-удар', 'm', 16, 16, 3, 22, -8, 'K', { a: 'hop:r', r: 1.05, jumpy: true, lc: [4, 22] }),
      mv('1+3', 'Рычаг', 't', 36, 12, 2, 28, 0, 0, { throw: 'armbar', brk: 1, r: 0.9 }),
      mv('2+4', 'Разворот', 't', 34, 12, 2, 28, 0, 0, { throw: 'reverse', brk: 2, r: 0.9 })
    ]
  }, { seq: '1,2,1,2,4,3,1,2,3,4', lv: 'hhhmmlhmmm', dmg: [5, 7, 6, 8, 10, 8, 6, 8, 10, 22] }));

  addFighter({
    id: 'kagemaru', slot: 7, name: 'Кагэмару', short: 'КАГЭМАРУ', en: 'KAGEMARU',
    country: 'Япония', age: '?', style: 'Ниндзюцу школы Туманной горы', blood: '?',
    bio: 'Последний страж свитка Туманной горы. Свиток украли и выставили призом на турнире. Кагэмару не говорит, откуда он и как выглядит его лицо.',
    quote: 'Тень не отбрасывает тени.',
    stance: 'ninja', voice: { pitch: 0.92, kind: 'm' }, intro: 'bow', wins: ['bow', 'fist'],
    stage: 'forest', music: 'kagemaru', hp: 150, walk: 1.0, ss: 1.15,
    body: { size: 1.0 },
    look: {
      skin: '#d8a880', mask: '#262636', top: '#1a2040', sleeves: 'long', pants: '#1a2040', shoes: '#101014', belt: '#a02020', wrist: '#7a7a82', gi: true,
      parts: [
        { at: 'handR', shape: 'rod', a: [0.0, -0.06, 0], b: [0.02, 0.13, 0], r0: 0.016, col: '#2a1a14' },
        { at: 'handR', shape: 'box', off: [0.01, 0.14, 0], size: [0.035, 0.01, 0.035], col: '#c8a040' },
        { at: 'handR', shape: 'rod', a: [0.03, 0.14, 0], b: [0.42, 0.78, 0], r0: 0.013, r1: 0.005, n: 4, col: '#dcdce6' }
      ]
    },
    costumes: [{}, { mask: '#6a1010', top: '#6a1010', pants: '#6a1010', belt: '#141414' }, { mask: '#e8e8f0', top: '#d8d8e0', pants: '#d8d8e0', belt: '#2a4aa0' }, { mask: '#1a1a1a', top: '#1a1a1a', pants: '#1a1a1a', belt: '#e8c040' }],
    stances: {
      med: { low: true, hp: 2, pose: { p: [0, 0.32, 0], py: 0, cy: 0, cp: 0.05, hp: 0.3, lh: [0.25, 0.2, -0.05], rh: [0.25, 0.2, 0.05], lf: [0.25, 0.08, -0.3], rf: [0.25, 0.08, 0.3], lk: [0.3, 1, -1], rk: [0.3, 1, 1], lo: 1, ro: 1 }, exit: 'b', max: 240 }
    },
    ai: { fav: ['2', 'f+2', 'd+2', '1+2', 'u+1+2', 'b+2', 'df+2'] },
    moves: [
      mv('1', 'Удар рукоятью', 'h', 6, 10, 2, 13, 1, 7, { a: 'jab', r: 0.9, nx: [nx('2', '1,2', [2, 20], 13)] }),
      chain('1,2', 'Рукоять и клинок', 'h', 13, 10, 2, 18, -5, 5, { a: 'slash', r: 1.12, w: 0.5 }),
      mv('2', 'Удар клинком', 'h', 14, 15, 2, 22, -10, 4, { a: 'slash', r: 1.1, w: 0.45 }),
      mv('f+2', 'Выпад', 'm', 17, 19, 3, 28, -15, 'K', { a: 'thrust', r: 1.25, mv: 0.2, w: 0.16 }),
      mv('d+2', 'Подрез', 'l', 13, 17, 3, 26, -16, 'T', { a: 'lowslash', r: 1.14, crouch: true, fc: true, w: 0.5 }),
      mv('b+2', 'Рассекающий удар', 'm', 24, 22, 3, 26, -10, 'K', { a: 'over', r: 1.2 }),
      mv('df+2', 'Восходящий разрез', 'm', 16, 15, 3, 24, -13, 'L', { a: 'slash', r: 1.15, y: 1.2 }),
      mv('1+2', 'Вихрь клинков', 'm', 7, 16, 18, 22, -14, 5, { a: { k: 'pose', mods: { by: -Math.PI * 4, '+p': [0, -0.05, 0], rh: [0.5, 0.35, 0.2] } }, r: 1.25, spin360: true, rehit: [18, 24] }),
      mv('u+1+2', 'Искусство тени', 'x', 0, 30, 1, 18, 0, 0, { a: { k: 'pose', mods: { '+p': [0, -0.3, 0], cp: 0.6 } }, tele: 16, inv: [4, 24] }),
      mv('d+1+2', 'Медитация', 'x', 0, 14, 1, 4, 0, 0, { a: { k: 'pose', mods: { p: [0, 0.4, 0] } }, stance: 'med' }),
      mv('b+1+2', 'Отражение клинком', 'x', 0, 16, 1, 12, 0, 0, { a: { k: 'pose', mods: { rh: [0.35, 0.5, 0.05], '+cy': -0.3 } }, parry: [2, 12], rev: 'reverse', revDmg: 26 }),
      mv('ss 2', 'Боковой разрез', 'h', 16, 14, 2, 22, -8, 'K', { a: 'slash', r: 1.2, w: 0.9 }),
      mv('f,f+2', 'Стремительный разрез', 'm', 20, 18, 3, 26, -14, 'B', { a: 'thrust', r: 1.2, mv: 0.5 }),
      mv('d+4', 'Низкий удар', 'l', 8, 12, 2, 19, -12, -3, { a: 'lowk:r', r: 1.0, crouch: true, fc: true }),
      mv('1+3', 'Бросок тени', 't', 34, 12, 2, 28, 0, 0, { throw: 'tomoe', brk: 1, r: 0.9 })
    ]
  });

  addFighter(tenHit({
    id: 'tony', slot: 8, name: 'Тони Вон', short: 'ТОНИ', en: 'TONY WONG',
    country: 'Гонконг', age: 25, style: 'Вин-чун', blood: 'A',
    bio: 'Преподаёт вин-чун в подвале на Коулуне и чинит часы днём. Его ученика избили на подпольном отборе турнира. Тони хочет встретиться с тем, кто это устроил.',
    quote: 'Самая короткая линия — прямая.',
    stance: 'wingchun', voice: { pitch: 1.08, kind: 'm' }, intro: 'bow', wins: ['bow', 'fist'],
    stage: 'harbor', music: 'tony', hp: 165, walk: 1.05,
    body: { size: 0.98 },
    look: { skin: '#e8c098', hair: '#141010', hairStyle: 'short', fringe: true, glasses: true, top: '#141414', sleeves: 'long', pants: '#6a6a6a', shoes: '#141414', belt: '#141414', trim: '#f0f0f0' },
    costumes: [{}, { top: '#f0f0f0', pants: '#1a1a1a', belt: '#f0f0f0' }, { top: '#2a4a8a', pants: '#e8e0d0' }, { top: '#6a1010', pants: '#141414' }],
    ai: { fav: ['1', 'f+1+2', 'df+1', 'd+4', 'b+2', 'db+3'] },
    moves: [
      mv('1', 'Удар по центру', 'h', 5, 9, 2, 12, 1, 8, { a: 'jab', r: 0.88, nx: [nx('2', '1,2', [2, 20], 12), nx('1', 'wc11', [2, 14], 9)] }),
      chain('wc11', 'Цепные удары 2', 'h', 5, 6, 2, 12, 1, 8, { a: 'cross', r: 0.9, nx: [nx('1', 'wc111', [2, 14], 9)] }),
      chain('wc111', 'Цепные удары 3', 'm', 5, 6, 2, 12, 0, 8, { a: 'jab', r: 0.9, y: 1.25, nx: [nx('1', 'wc1111', [2, 14], 9)] }),
      chain('wc1111', 'Цепные удары 4', 'm', 12, 8, 2, 22, -9, 'K', { a: 'cross', r: 0.95, y: 1.2, mv: 0.15 }),
      mv('f+1+2', 'Прямой взрыв', 'm', 5, 10, 20, 14, -6, 6, { a: { k: 'pose', mods: { '+p': [0.15, -0.02, 0], lh: [0.62, 0.35, -0.02], rh: [0.55, 0.3, 0.02] } }, r: 0.95, mv: 0.55, rehit: [15, 20, 25] }),
      mv('b+1', 'Бонг-сао', 'x', 0, 14, 1, 10, 0, 0, { a: { k: 'pose', mods: { lh: [0.35, 0.35, 0.1], le: [0, 1, -1] } }, parry: [2, 13], pOnly: 'p', counter: 'wccnt' }),
      chain('wccnt', 'Ответ после бонг-сао', 'm', 18, 8, 2, 20, -6, 'K', { a: 'palm', r: 0.95 }),
      mv('df+1', 'Пак-сао', 'm', 12, 11, 2, 14, 2, 6, { a: 'straight:l', r: 0.9 }),
      mv('d+4', 'Удар по голени', 'l', 8, 12, 2, 18, -10, -2, { a: 'lowk:r', r: 1.0, crouch: true, fc: true }),
      mv('db+3', 'Стоппер', 'l', 12, 13, 3, 20, -12, 0, { a: 'push:l', r: 1.0, y: 0.45 }),
      mv('3', 'Прямой пинок', 'm', 12, 13, 3, 16, -5, 3, { a: 'front:l', r: 1.02, y: 1.0 }),
      mv('f,f+2', 'Шаг-взрыв', 'h', 18, 15, 2, 22, -10, 'B', { a: 'straight:r', r: 1.05, mv: 0.5 }),
      mv('b+2', 'Ладонь под челюсть', 'm', 15, 14, 2, 24, -13, 'L', { a: 'upper:r', r: 0.85 }),
      mv('ss 1', 'Боковая ладонь', 'm', 11, 12, 2, 16, -2, 5, { a: 'palm', r: 0.9, w: 0.5 }),
      mv('2+4', 'Подсад и толчок', 't', 34, 12, 2, 28, 0, 0, { throw: 'reverse', brk: 2, r: 0.9 })
    ]
  }, { seq: '1,2,1,1,2,2,3,1,2,1', lv: 'hhhmmhlhmm', dmg: [5, 7, 5, 5, 8, 8, 8, 6, 8, 20] }));

  addFighter(tenHit({
    id: 'somsak', slot: 9, name: 'Сомсак Чайчана', short: 'СОМСАК', en: 'SOMSAK CHAICHANA',
    country: 'Таиланд', age: 30, style: 'Муай-тай', blood: 'O',
    bio: 'Чемпион стадиона у реки Чао Прайя. Промоутер задолжал ему три боя и спалил деревенский лагерь. Сомсак выходит на турнир, чтобы отстроить лагерь для мальчишек.',
    quote: 'Колено всегда найдёт дорогу.',
    stance: 'thai', voice: { pitch: 1.0, kind: 'm' }, intro: 'bow', wins: ['bow', 'flex'],
    stage: 'bangkok', music: 'somsak', hp: 170,
    body: { size: 1.0 },
    look: {
      skin: '#c08850', hair: '#141010', hairStyle: 'short', headband: '#f0f0f0', top: null, pants: '#c01818', shorts: true, trim: '#e8c040', shoes: null, wrist: '#f0f0f0', belt: '#e8c040',
      parts: [
        { at: 'upperL', shape: 'ball', off: [0.12, 0, 0], size: [0.03, 0.068, 0.068], col: '#c01818' },
        { at: 'upperR', shape: 'ball', off: [0.12, 0, 0], size: [0.03, 0.068, 0.068], col: '#c01818' }
      ]
    },
    costumes: [{}, { pants: '#2040a0', belt: '#f0f0f0' }, { pants: '#141414', belt: '#e8c040' }, { pants: '#e8c040', belt: '#c01818' }],
    ai: { fav: ['4', 'df+4', 'b+2', 'f+3', 'd+3', '2+4', 'f,f+4'] },
    moves: [
      mv('f+3', 'Теп', 'm', 12, 13, 3, 16, -2, 3, { a: 'push:l', r: 1.12, push: 0.4 }),
      mv('4', 'Тэ по корпусу', 'm', 20, 16, 3, 24, -10, 'K', { a: 'round:r', r: 1.1, y: 1.1, w: 0.6 }),
      mv('df+4', 'Кхао', 'm', 16, 12, 3, 24, -10, 'L', { a: 'knee:r', r: 0.65 }),
      mv('f,f+4', 'Летящее колено', 'm', 24, 16, 3, 26, -12, 'L', { a: 'knee:r', r: 0.8, jumpy: true, jh: 0.35, mv: 0.6, lc: [4, 20] }),
      mv('b+2', 'Сок', 'h', 16, 11, 2, 16, -3, 6, { a: 'elbow:r', r: 0.65, nx: [nx('1', 'b+2,1', [3, 16], 11)] }),
      chain('b+2,1', 'Сок и сок', 'h', 14, 10, 2, 22, -8, 'K', { a: 'elbow:l', r: 0.65 }),
      mv('df+2', 'Восходящий сок', 'm', 16, 13, 2, 24, -12, 'L', { a: 'upper:r', r: 0.7 }),
      mv('d+3', 'Лоу-кик голенью', 'l', 14, 15, 3, 22, -13, 0, { a: 'lowk:l', r: 1.05, w: 0.5 }),
      mv('b+4', 'Удар с разворота', 'h', 22, 17, 3, 26, -12, 'B', { a: 'spin:r', r: 1.12 }),
      mv('d+1+2', 'Вай кру', 'x', 0, 50, 1, 8, 0, 0, { a: { k: 'pose', mods: { lh: [0.3, 0.55, 0.05], rh: [0.3, 0.55, 0.08], lo: 1, ro: 1, cp: 0.3, hp: 0.3 } }, buff: 1.35 }),
      mv('2+4', 'Клинч', 't', 36, 12, 2, 28, 0, 0, { throw: 'clinch', brk: 2, r: 0.9 }),
      mv('1+2', 'Двойной локоть', 'm', 18, 15, 2, 22, -9, 'K', { a: 'elbow:r', r: 0.7, y: 1.3 })
    ]
  }, { seq: '1,2,2,1,4,3,4,2,1,4', lv: 'hhmhmlmhhm', dmg: [5, 8, 8, 8, 10, 8, 10, 8, 8, 24], anims: [null, null, 'elbow:r', 'elbow:l', 'knee:r', 'lowk:l', 'round:r', 'upper:r', 'elbow:l', 'knee:r'] }));

  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
