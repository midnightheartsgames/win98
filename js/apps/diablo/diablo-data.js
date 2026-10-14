/**
 * Diablo 98 — static game data: classes, items, affixes, uniques, monsters, spells, town.
 * All names are in Russian; numbers follow Diablo (1996) normal difficulty closely.
 */
(function (D) {
  'use strict';

  // Russian adjective agreement: masculine form -> {m, f, n, p}
  function adj(word) {
    const stem = word.slice(0, -2), end = word.slice(-2), last = stem.slice(-1);
    const velar = 'гкхжшчщ'.includes(last), hush = 'жшчщ'.includes(last);
    if (end === 'ой') return { m: word, f: stem + 'ая', n: stem + 'ое', p: stem + (velar ? 'ие' : 'ые') };
    if (end === 'ый') return { m: word, f: stem + 'ая', n: stem + 'ое', p: stem + 'ые' };
    if (velar) return { m: word, f: stem + 'ая', n: stem + (hush ? 'ее' : 'ое'), p: stem + 'ие' };
    return { m: word, f: stem + 'яя', n: stem + 'ее', p: stem + 'ие' };
  }

  const CLASSES = {
    warrior: {
      id: 'warrior', name: 'Воин', desc: 'Мастер ближнего боя. Много здоровья, лучший блок щитом, умение «Ремонт».',
      base: { str: 30, mag: 10, dex: 20, vit: 25 }, max: { str: 250, mag: 50, dex: 60, vit: 100 },
      life: (s, l) => 2 * s.vit + 2 * l + 18, mana: (s, l) => s.mag + l - 1,
      block: 30, skill: 'repair', meleeSpeed: 0.45, bowSpeed: 0.55, castSpeed: 0.7, color: '#8a6a3a'
    },
    rogue: {
      id: 'rogue', name: 'Разбойница', desc: 'Лучница из Сестринства Незрячего Ока. Меткая стрельба, умение «Обезвредить ловушку».',
      base: { str: 20, mag: 15, dex: 30, vit: 20 }, max: { str: 55, mag: 70, dex: 250, vit: 80 },
      life: (s, l) => s.vit + 2 * l + 23, mana: (s, l) => s.mag + 2 * l + 5,
      block: 20, skill: 'disarm', meleeSpeed: 0.5, bowSpeed: 0.4, castSpeed: 0.6, color: '#3a6a4a'
    },
    sorcerer: {
      id: 'sorcerer', name: 'Чародей', desc: 'Маг из Визжерей. Огромный запас маны, знает «Огненную стрелу», умение «Перезарядка посоха».',
      base: { str: 15, mag: 35, dex: 15, vit: 20 }, max: { str: 45, mag: 250, dex: 85, vit: 80 },
      life: (s, l) => s.vit + l + 9, mana: (s, l) => 2 * s.mag + 2 * l - 2,
      block: 10, skill: 'recharge', meleeSpeed: 0.6, bowSpeed: 0.6, castSpeed: 0.45, color: '#4a3a7a'
    }
  };

  // Experience needed to reach level (index = current level).
  const XP = [0, 2000, 4620, 8040, 12489, 18258, 25712, 35309, 47622, 63364, 83419, 108879, 141086, 181683, 231075,
    313656, 424476, 571453, 766076, 1022110, 1356833, 1797469, 2375659, 3131487, 4119342, 5415021, 7107512, 9306221,
    12159221, 15846081, 20598052, 26710418, 34560208, 44630288, 57527236, 74015468, 95044006, 121897040, 156147760,
    199745000, 255319000, 325872000, 415137000, 527904000, 670090000, 849111000, 1073620000, 1355000000, 1709000000, 2150000000];

  // --- Item bases --------------------------------------------------------------------------
  // cls drives icon + slot. g = grammatical gender of name.
  const B = (id, name, g, cls, w, h, o) => Object.assign({ id, name, g, cls, w, h, dur: 0, req: {}, value: 10, qlvl: 1 }, o);
  const BASES = [
    B('dagger', 'Кинжал', 'm', 'sword', 1, 2, { dmg: [1, 4], dur: 16, value: 60, qlvl: 1 }),
    B('shortsword', 'Короткий меч', 'm', 'sword', 1, 3, { dmg: [2, 6], dur: 24, req: { str: 18 }, value: 120, qlvl: 1 }),
    B('sabre', 'Сабля', 'f', 'sword', 1, 3, { dmg: [1, 8], dur: 45, req: { str: 17 }, value: 170, qlvl: 1 }),
    B('scimitar', 'Ятаган', 'm', 'sword', 1, 3, { dmg: [3, 7], dur: 28, req: { str: 23, dex: 23 }, value: 200, qlvl: 4 }),
    B('longsword', 'Длинный меч', 'm', 'sword', 1, 3, { dmg: [2, 10], dur: 40, req: { str: 30, dex: 30 }, value: 350, qlvl: 6 }),
    B('broadsword', 'Широкий меч', 'm', 'sword', 1, 3, { dmg: [4, 12], dur: 50, req: { str: 40 }, value: 750, qlvl: 8 }),
    B('bastardsword', 'Полуторный меч', 'm', 'sword', 1, 3, { dmg: [6, 15], dur: 60, req: { str: 50 }, value: 1000, qlvl: 10 }),
    B('twohandsword', 'Двуручный меч', 'm', 'sword', 2, 3, { dmg: [8, 16], dur: 75, req: { str: 65 }, value: 1800, qlvl: 14, two: true }),
    B('greatsword', 'Большой меч', 'm', 'sword', 2, 3, { dmg: [10, 20], dur: 100, req: { str: 75 }, value: 3000, qlvl: 17, two: true }),
    B('smallaxe', 'Малый топор', 'm', 'axe', 2, 3, { dmg: [2, 10], dur: 24, value: 150, qlvl: 2, two: true }),
    B('axe', 'Топор', 'm', 'axe', 2, 3, { dmg: [4, 12], dur: 32, req: { str: 22 }, value: 450, qlvl: 4, two: true }),
    B('largeaxe', 'Большой топор', 'm', 'axe', 2, 3, { dmg: [6, 16], dur: 40, req: { str: 30 }, value: 750, qlvl: 6, two: true }),
    B('broadaxe', 'Широкий топор', 'm', 'axe', 2, 3, { dmg: [8, 20], dur: 50, req: { str: 50 }, value: 1000, qlvl: 8, two: true }),
    B('battleaxe', 'Боевой топор', 'm', 'axe', 2, 3, { dmg: [10, 25], dur: 60, req: { str: 65 }, value: 1500, qlvl: 10, two: true }),
    B('greataxe', 'Огромный топор', 'm', 'axe', 2, 3, { dmg: [12, 30], dur: 75, req: { str: 80 }, value: 2500, qlvl: 12, two: true }),
    B('club', 'Дубина', 'f', 'mace', 1, 3, { dmg: [1, 6], dur: 20, value: 20, qlvl: 1 }),
    B('spikedclub', 'Шипастая дубина', 'f', 'mace', 1, 3, { dmg: [3, 6], dur: 20, req: { str: 18 }, value: 225, qlvl: 4 }),
    B('mace', 'Булава', 'f', 'mace', 2, 3, { dmg: [1, 8], dur: 32, req: { str: 16 }, value: 200, qlvl: 2 }),
    B('morningstar', 'Моргенштерн', 'm', 'mace', 2, 3, { dmg: [1, 10], dur: 40, req: { str: 26 }, value: 300, qlvl: 3 }),
    B('flail', 'Цеп', 'm', 'mace', 2, 3, { dmg: [2, 12], dur: 36, req: { str: 30 }, value: 500, qlvl: 7 }),
    B('warhammer', 'Боевой молот', 'm', 'mace', 2, 3, { dmg: [5, 9], dur: 50, req: { str: 40 }, value: 600, qlvl: 5 }),
    B('maul', 'Кувалда', 'f', 'mace', 2, 3, { dmg: [6, 20], dur: 50, req: { str: 55 }, value: 900, qlvl: 10, two: true }),
    B('shortbow', 'Короткий лук', 'm', 'bow', 2, 3, { dmg: [1, 4], dur: 30, value: 100, qlvl: 1, two: true, ranged: true }),
    B('huntersbow', 'Охотничий лук', 'm', 'bow', 2, 3, { dmg: [2, 5], dur: 40, req: { str: 20, dex: 35 }, value: 350, qlvl: 3, two: true, ranged: true }),
    B('longbow', 'Длинный лук', 'm', 'bow', 2, 3, { dmg: [1, 6], dur: 35, req: { str: 25, dex: 30 }, value: 250, qlvl: 5, two: true, ranged: true }),
    B('compositebow', 'Составной лук', 'm', 'bow', 2, 3, { dmg: [3, 6], dur: 45, req: { str: 25, dex: 40 }, value: 600, qlvl: 7, two: true, ranged: true }),
    B('shortbattlebow', 'Короткий боевой лук', 'm', 'bow', 2, 3, { dmg: [3, 7], dur: 45, req: { str: 30, dex: 50 }, value: 750, qlvl: 9, two: true, ranged: true }),
    B('longbattlebow', 'Длинный боевой лук', 'm', 'bow', 2, 3, { dmg: [1, 10], dur: 50, req: { str: 30, dex: 60 }, value: 1000, qlvl: 11, two: true, ranged: true }),
    B('shortwarbow', 'Короткий военный лук', 'm', 'bow', 2, 3, { dmg: [4, 8], dur: 55, req: { str: 35, dex: 70 }, value: 1500, qlvl: 15, two: true, ranged: true }),
    B('longwarbow', 'Длинный военный лук', 'm', 'bow', 2, 3, { dmg: [1, 14], dur: 60, req: { str: 45, dex: 80 }, value: 2000, qlvl: 19, two: true, ranged: true }),
    B('shortstaff', 'Короткий посох', 'm', 'staff', 1, 3, { dmg: [2, 4], dur: 25, value: 30, qlvl: 1, two: true }),
    B('longstaff', 'Длинный посох', 'm', 'staff', 1, 3, { dmg: [4, 8], dur: 35, value: 100, qlvl: 4, two: true }),
    B('compositestaff', 'Составной посох', 'm', 'staff', 1, 3, { dmg: [5, 10], dur: 45, value: 500, qlvl: 6, two: true }),
    B('quarterstaff', 'Боевой шест', 'm', 'staff', 1, 3, { dmg: [6, 12], dur: 55, req: { str: 20 }, value: 1000, qlvl: 9, two: true }),
    B('warstaff', 'Боевой посох', 'm', 'staff', 1, 3, { dmg: [8, 16], dur: 75, req: { str: 30 }, value: 1500, qlvl: 12, two: true }),
    B('buckler', 'Баклер', 'm', 'shield', 2, 2, { ac: [1, 5], dur: 16, value: 30, qlvl: 1 }),
    B('smallshield', 'Малый щит', 'm', 'shield', 2, 2, { ac: [3, 8], dur: 24, req: { str: 25 }, value: 90, qlvl: 5 }),
    B('largeshield', 'Большой щит', 'm', 'shield', 2, 3, { ac: [5, 10], dur: 32, req: { str: 40 }, value: 200, qlvl: 9 }),
    B('kiteshield', 'Треугольный щит', 'm', 'shield', 2, 3, { ac: [8, 15], dur: 40, req: { str: 50 }, value: 400, qlvl: 14 }),
    B('towershield', 'Башенный щит', 'm', 'shield', 2, 3, { ac: [12, 20], dur: 50, req: { str: 60 }, value: 850, qlvl: 18 }),
    B('gothicshield', 'Готический щит', 'm', 'shield', 2, 3, { ac: [14, 18], dur: 60, req: { str: 80 }, value: 2300, qlvl: 20 }),
    B('cap', 'Шапка', 'f', 'helm', 2, 2, { ac: [1, 3], dur: 15, value: 15, qlvl: 1 }),
    B('skullcap', 'Шлем-череп', 'm', 'helm', 2, 2, { ac: [2, 4], dur: 20, value: 25, qlvl: 4 }),
    B('helm', 'Шлем', 'm', 'helm', 2, 2, { ac: [4, 6], dur: 30, req: { str: 25 }, value: 40, qlvl: 8 }),
    B('fullhelm', 'Полный шлем', 'm', 'helm', 2, 2, { ac: [6, 8], dur: 35, req: { str: 35 }, value: 90, qlvl: 12 }),
    B('crown', 'Корона', 'f', 'helm', 2, 2, { ac: [8, 12], dur: 40, value: 200, qlvl: 16 }),
    B('greathelm', 'Большой шлем', 'm', 'helm', 2, 2, { ac: [10, 15], dur: 60, req: { str: 50 }, value: 400, qlvl: 20 }),
    B('rags', 'Лохмотья', 'p', 'armor', 2, 3, { ac: [2, 6], dur: 6, value: 5, qlvl: 1 }),
    B('cape', 'Накидка', 'f', 'armor', 2, 3, { ac: [1, 5], dur: 12, value: 10, qlvl: 1 }),
    B('cloak', 'Плащ', 'm', 'armor', 2, 3, { ac: [3, 7], dur: 18, value: 40, qlvl: 2 }),
    B('robe', 'Роба', 'f', 'armor', 2, 3, { ac: [4, 7], dur: 24, value: 75, qlvl: 3 }),
    B('quilted', 'Стёганый доспех', 'm', 'armor', 2, 3, { ac: [7, 10], dur: 30, value: 200, qlvl: 4 }),
    B('leather', 'Кожаный доспех', 'm', 'armor', 2, 3, { ac: [10, 13], dur: 35, value: 300, qlvl: 6 }),
    B('hardleather', 'Жёсткая кожа', 'f', 'armor', 2, 3, { ac: [11, 14], dur: 40, value: 450, qlvl: 7 }),
    B('studded', 'Клёпаная кожа', 'f', 'armor', 2, 3, { ac: [15, 17], dur: 45, req: { str: 20 }, value: 700, qlvl: 9 }),
    B('ringmail', 'Кольчужная рубаха', 'f', 'armor', 2, 3, { ac: [17, 20], dur: 50, req: { str: 25 }, value: 900, qlvl: 11 }),
    B('chainmail', 'Кольчуга', 'f', 'armor', 2, 3, { ac: [18, 22], dur: 55, req: { str: 30 }, value: 1250, qlvl: 13 }),
    B('scalemail', 'Чешуйчатый доспех', 'm', 'armor', 2, 3, { ac: [23, 28], dur: 60, req: { str: 35 }, value: 2300, qlvl: 15 }),
    B('breastplate', 'Кираса', 'f', 'armor', 2, 3, { ac: [20, 24], dur: 80, req: { str: 40 }, value: 2800, qlvl: 16 }),
    B('splintmail', 'Пластинчатый доспех', 'm', 'armor', 2, 3, { ac: [30, 35], dur: 65, req: { str: 40 }, value: 3250, qlvl: 17 }),
    B('platemail', 'Латы', 'p', 'armor', 2, 3, { ac: [42, 50], dur: 75, req: { str: 60 }, value: 4600, qlvl: 19 }),
    B('fieldplate', 'Полевые латы', 'p', 'armor', 2, 3, { ac: [40, 45], dur: 80, req: { str: 65 }, value: 5800, qlvl: 21 }),
    B('gothicplate', 'Готические латы', 'p', 'armor', 2, 3, { ac: [50, 60], dur: 100, req: { str: 80 }, value: 8000, qlvl: 23 }),
    B('fullplate', 'Полные латы', 'p', 'armor', 2, 3, { ac: [60, 75], dur: 90, req: { str: 90 }, value: 6500, qlvl: 25 }),
    B('ring', 'Кольцо', 'n', 'ring', 1, 1, { value: 1000, qlvl: 5, jewel: true }),
    B('amulet', 'Амулет', 'm', 'amulet', 1, 1, { value: 1200, qlvl: 8, jewel: true }),
    B('potion_heal', 'Зелье лечения', 'n', 'potion', 1, 1, { value: 50, qlvl: 1, belt: true, color: '#c01818', use: 'heal' }),
    B('potion_fullheal', 'Зелье полного лечения', 'n', 'potion', 1, 1, { value: 150, qlvl: 6, belt: true, color: '#ff3030', use: 'fullheal' }),
    B('potion_mana', 'Зелье маны', 'n', 'potion', 1, 1, { value: 50, qlvl: 1, belt: true, color: '#1830c0', use: 'mana' }),
    B('potion_fullmana', 'Зелье полной маны', 'n', 'potion', 1, 1, { value: 150, qlvl: 6, belt: true, color: '#3050ff', use: 'fullmana' }),
    B('potion_rejuv', 'Зелье восстановления', 'n', 'potion', 1, 1, { value: 120, qlvl: 3, belt: true, color: '#b040c0', use: 'rejuv' }),
    B('potion_fullrejuv', 'Зелье полного восстановления', 'n', 'potion', 1, 1, { value: 600, qlvl: 12, belt: true, color: '#e070f0', use: 'fullrejuv' }),
    B('elixir_str', 'Эликсир силы', 'm', 'potion', 1, 1, { value: 5000, qlvl: 15, color: '#e0a020', use: 'str' }),
    B('elixir_mag', 'Эликсир магии', 'm', 'potion', 1, 1, { value: 5000, qlvl: 15, color: '#20a0e0', use: 'mag' }),
    B('elixir_dex', 'Эликсир ловкости', 'm', 'potion', 1, 1, { value: 5000, qlvl: 15, color: '#e0e020', use: 'dex' }),
    B('elixir_vit', 'Эликсир живучести', 'm', 'potion', 1, 1, { value: 5000, qlvl: 20, color: '#e04090', use: 'vit' }),
    B('scroll_identify', 'Свиток опознания', 'm', 'scroll', 1, 1, { value: 100, qlvl: 1, belt: true, spell: 'identify' }),
    B('scroll_portal', 'Свиток портала', 'm', 'scroll', 1, 1, { value: 200, qlvl: 1, belt: true, spell: 'townportal' }),
    B('scroll_heal', 'Свиток лечения', 'm', 'scroll', 1, 1, { value: 50, qlvl: 1, belt: true, spell: 'heal' }),
    B('scroll_lightning', 'Свиток молнии', 'm', 'scroll', 1, 1, { value: 150, qlvl: 4, belt: true, spell: 'lightning' }),
    B('scroll_fireball', 'Свиток огненного шара', 'm', 'scroll', 1, 1, { value: 300, qlvl: 8, belt: true, spell: 'fireball' }),
    B('scroll_flash', 'Свиток вспышки', 'm', 'scroll', 1, 1, { value: 400, qlvl: 6, belt: true, spell: 'flash' }),
    B('scroll_teleport', 'Свиток телепорта', 'm', 'scroll', 1, 1, { value: 800, qlvl: 14, belt: true, spell: 'teleport' }),
    B('scroll_manashield', 'Свиток щита маны', 'm', 'scroll', 1, 1, { value: 600, qlvl: 8, belt: true, spell: 'manashield' }),
    B('book', 'Книга', 'f', 'book', 2, 2, { value: 0, qlvl: 1 }),
    B('magicrock', 'Магический камень', 'm', 'quest', 1, 1, { value: 0, qlvl: 99, quest: 'magicrock' }),
    B('anvil', 'Наковальня Ярости', 'f', 'quest', 2, 2, { value: 0, qlvl: 99, quest: 'anvil' })
  ];
  const BASE = Object.fromEntries(BASES.map(b => [b.id, b]));

  // --- Affixes ------------------------------------------------------------------------------
  // on: w = melee/ranged weapon, s = staff, a = armor/helm/shield, j = ring/amulet
  const P = (word, prop, min, max, qlvl, on, cost) => ({ word: adj(word), prop, min, max, qlvl, on, cost });
  const S = (word, prop, min, max, qlvl, on, cost) => ({ word, prop, min, max, qlvl, on, cost });
  const PREFIXES = [
    P('Жестяной', 'tohit', 1, 5, 3, 'wsj', 1), P('Латунный', 'tohit', 6, 10, 6, 'wsj', 1), P('Бронзовый', 'tohit', 11, 15, 10, 'wsj', 1),
    P('Железный', 'tohit', 16, 20, 13, 'wsj', 1), P('Стальной', 'tohit', 21, 30, 17, 'wsj', 1), P('Серебряный', 'tohit', 31, 40, 20, 'wsj', 1),
    P('Золотой', 'tohit', 41, 50, 23, 'wsj', 1), P('Платиновый', 'tohit', 51, 75, 28, 'wsj', 1),
    P('Зазубренный', 'dmgPct', 20, 35, 4, 'ws', 1.5), P('Смертоносный', 'dmgPct', 36, 50, 6, 'ws', 1.5), P('Тяжёлый', 'dmgPct', 51, 65, 9, 'ws', 1.5),
    P('Злобный', 'dmgPct', 66, 80, 12, 'ws', 1.5), P('Жестокий', 'dmgPct', 81, 95, 16, 'ws', 1.5), P('Массивный', 'dmgPct', 96, 110, 20, 'ws', 1.5),
    P('Дикий', 'dmgPct', 111, 125, 23, 'ws', 1.5), P('Безжалостный', 'dmgPct', 126, 150, 30, 'ws', 1.5),
    P('Крепкий', 'acPct', 20, 30, 3, 'a', 1.5), P('Добротный', 'acPct', 31, 40, 6, 'a', 1.5), P('Прочный', 'acPct', 41, 55, 10, 'a', 1.5),
    P('Великолепный', 'acPct', 56, 70, 14, 'a', 1.5), P('Доблестный', 'acPct', 71, 90, 18, 'a', 1.5), P('Славный', 'acPct', 91, 110, 22, 'a', 1.5),
    P('Благословенный', 'acPct', 111, 130, 25, 'a', 1.5), P('Святой', 'acPct', 131, 150, 28, 'a', 1.5),
    P('Красный', 'resF', 10, 20, 4, 'aj', 3), P('Багровый', 'resF', 21, 30, 10, 'aj', 3), P('Гранатовый', 'resF', 31, 40, 16, 'aj', 3), P('Рубиновый', 'resF', 41, 50, 20, 'aj', 3),
    P('Синий', 'resL', 10, 20, 4, 'aj', 3), P('Лазурный', 'resL', 21, 30, 10, 'aj', 3), P('Кобальтовый', 'resL', 31, 40, 16, 'aj', 3), P('Сапфировый', 'resL', 41, 50, 20, 'aj', 3),
    P('Белый', 'resM', 10, 20, 4, 'aj', 3), P('Жемчужный', 'resM', 21, 30, 10, 'aj', 3), P('Хрустальный', 'resM', 31, 40, 16, 'aj', 3), P('Алмазный', 'resM', 41, 50, 20, 'aj', 3),
    P('Топазовый', 'resAll', 10, 15, 8, 'aj', 6), P('Янтарный', 'resAll', 16, 20, 12, 'aj', 6), P('Нефритовый', 'resAll', 21, 30, 18, 'aj', 6), P('Обсидиановый', 'resAll', 31, 40, 24, 'aj', 6),
    P('Волшебный', 'mana', 10, 15, 10, 'asj', 3), P('Колдовской', 'mana', 16, 20, 13, 'asj', 3), P('Мистический', 'mana', 21, 30, 17, 'asj', 3),
    P('Астральный', 'mana', 31, 40, 20, 'asj', 3), P('Змеиный', 'mana', 41, 50, 24, 'asj', 3), P('Драконовый', 'mana', 51, 60, 27, 'asj', 3),
    P('Ангельский', 'spells', 1, 1, 15, 's', 400), P('Архангельский', 'spells', 2, 2, 25, 's', 400),
    P('Пылающий', 'fireDmg', 1, 10, 7, 'w', 8), P('Грозовой', 'lightDmg', 1, 20, 18, 'w', 8),
    P('Обильный', 'charges', 2, 2, 4, 's', 100), P('Щедрый', 'charges', 3, 3, 9, 's', 100)
  ];
  const SUFFIXES = [
    S('шакала', 'life', 1, 10, 1, 'aj', 3), S('лисицы', 'life', 11, 20, 4, 'aj', 3), S('ягуара', 'life', 21, 30, 8, 'aj', 3), S('орла', 'life', 31, 40, 12, 'aj', 3),
    S('волка', 'life', 41, 50, 16, 'aj', 3), S('тигра', 'life', 51, 60, 20, 'aj', 3), S('льва', 'life', 61, 70, 23, 'aj', 3), S('мамонта', 'life', 71, 80, 27, 'aj', 3),
    S('силы', 'str', 1, 5, 1, 'wsaj', 30), S('мощи', 'str', 6, 10, 5, 'wsaj', 30), S('могущества', 'str', 11, 15, 11, 'wsaj', 30), S('гигантов', 'str', 16, 20, 17, 'wsaj', 30), S('титанов', 'str', 21, 30, 23, 'wsaj', 30),
    S('магии', 'mag', 1, 5, 1, 'wsaj', 30), S('разума', 'mag', 6, 10, 5, 'wsaj', 30), S('гения', 'mag', 11, 15, 11, 'wsaj', 30), S('колдовства', 'mag', 16, 20, 17, 'wsaj', 30), S('волшебства', 'mag', 21, 30, 23, 'wsaj', 30),
    S('ловкости', 'dex', 1, 5, 1, 'wsaj', 30), S('мастерства', 'dex', 6, 10, 5, 'wsaj', 30), S('точности', 'dex', 11, 15, 11, 'wsaj', 30), S('меткости', 'dex', 16, 20, 17, 'wsaj', 30), S('совершенства', 'dex', 21, 30, 23, 'wsaj', 30),
    S('живучести', 'vit', 1, 5, 1, 'wsaj', 30), S('задора', 'vit', 6, 10, 5, 'wsaj', 30), S('энергии', 'vit', 11, 15, 11, 'wsaj', 30), S('бодрости', 'vit', 16, 20, 17, 'wsaj', 30), S('жизни', 'vit', 21, 30, 23, 'wsaj', 30),
    S('неба', 'all', 1, 3, 3, 'wsaj', 100), S('луны', 'all', 4, 7, 7, 'wsaj', 100), S('звёзд', 'all', 8, 11, 11, 'wsaj', 100), S('небес', 'all', 12, 15, 17, 'wsaj', 100), S('зодиака', 'all', 16, 20, 23, 'wsaj', 100),
    S('света', 'light', 1, 1, 4, 'wsaj', 200), S('сияния', 'light', 2, 2, 8, 'wsaj', 200),
    S('готовности', 'speed', 1, 1, 1, 'w', 300), S('проворства', 'speed', 2, 2, 10, 'w', 300), S('скорости', 'speed', 3, 3, 19, 'w', 300), S('спешки', 'speed', 4, 4, 27, 'w', 300),
    S('пиявки', 'leech', 3, 3, 8, 'wj', 300), S('крови', 'leech', 5, 5, 19, 'wj', 300),
    S('шипов', 'thorns', 1, 3, 1, 'a', 50),
    S('прочности', 'durPct', 30, 50, 1, 'wsa', 5), S('ремесла', 'durPct', 51, 80, 6, 'wsa', 5), S('надёжности', 'durPct', 81, 100, 12, 'wsa', 5), S('веков', 'indestructible', 1, 1, 25, 'wsa', 3000),
    S('защиты', 'dmgTaken', 1, 1, 2, 'aj', 400), S('поглощения', 'dmgTaken', 2, 2, 6, 'aj', 400), S('отражения', 'dmgTaken', 3, 3, 12, 'aj', 400), S('стойкости', 'dmgTaken', 4, 4, 20, 'aj', 400),
    S('качества', 'dmgFlat', 1, 2, 2, 'w', 40), S('увечья', 'dmgFlat', 3, 5, 7, 'w', 40), S('убийства', 'dmgFlat', 6, 8, 15, 'w', 40), S('бойни', 'dmgFlat', 9, 12, 25, 'w', 40), S('резни', 'dmgFlat', 13, 16, 35, 'w', 40),
    S('медведя', 'knockback', 1, 1, 5, 'w', 500)
  ];

  // --- Uniques ------------------------------------------------------------------------------
  const UNIQUES = [
    { id: 'cleaver', name: 'Тесак Мясника', base: 'largeaxe', qlvl: 99, dmg: [4, 24], props: { str: 10, durPct: 0 }, flavor: 'Грубый тесак, всё ещё липкий от крови.' },
    { id: 'undeadcrown', name: 'Корона Нежити', base: 'crown', qlvl: 99, props: { acFlat: 8, leech: 5, mag: 5 }, flavor: 'Корона безумного короля Леорика.' },
    { id: 'empyrean', name: 'Небесная Лента', base: 'ring', qlvl: 99, props: { all: 2, light: 2, resAll: 5 }, flavor: 'Награда Грисвольда за Магический камень.' },
    { id: 'griswoldedge', name: 'Клинок Грисвольда', base: 'broadsword', qlvl: 99, props: { tohit: 25, fireDmg: 10, mana: 20, speed: 2, life: -20 }, flavor: 'Выкован на Наковальне Ярости.' },
    { id: 'riftbow', name: 'Лук Разлома', base: 'shortbow', qlvl: 1, props: { dmgFlat: 2, speed: 1, dex: -3 } },
    { id: 'gnatsting', name: 'Жало Гнуса', base: 'huntersbow', qlvl: 15, props: { speed: 2, dmgFlat: 3, tohit: 20 } },
    { id: 'gonnagal', name: 'Кинжал Гонагала', base: 'dagger', qlvl: 12, props: { dmgPct: 100, speed: 3, resF: 25 } },
    { id: 'bonesaw', name: 'Костяная Пила', base: 'club', qlvl: 13, props: { str: 10, mag: -5, life: 15, dmgFlat: 10 } },
    { id: 'thunderclap', name: 'Громовой Удар', base: 'warhammer', qlvl: 5, props: { str: 20, resL: 30, lightDmg: 8, light: 2 } },
    { id: 'lightforge', name: 'Светоковка', base: 'platemail', qlvl: 25, props: { all: 8, light: 4, acPct: 150, resF: 25 } },
    { id: 'fool', name: 'Шутовской Колпак', base: 'cap', qlvl: 10, props: { dex: 10, life: 20, mag: -5, resAll: 10 } },
    { id: 'thinkingcap', name: 'Думающая Шапка', base: 'skullcap', qlvl: 6, props: { spells: 2, resAll: 20, mana: 30 } },
    { id: 'naj', name: 'Посох Наджа', base: 'warstaff', qlvl: 20, props: { spells: 1, mag: 20, life: 30, resAll: 15 } },
    { id: 'grandfather', name: 'Дедушка', base: 'greatsword', qlvl: 27, props: { all: 5, tohit: 20, dmgPct: 70, life: 20 } },
    { id: 'bramble', name: 'Колючка', base: 'ring', qlvl: 11, props: { str: 5, mag: -5, dex: 5, thorns: 3, life: 10 } },
    { id: 'constricting', name: 'Кольцо Сжатия', base: 'ring', qlvl: 21, props: { resAll: 50, life: -20 } },
    { id: 'gladiator', name: 'Кольцо Гладиатора', base: 'ring', qlvl: 18, props: { tohit: 30, str: 10, dmgFlat: 5, mag: -10 } },
    { id: 'optic', name: 'Оптический Амулет', base: 'amulet', qlvl: 20, props: { light: 2, resL: 30, mag: 5, dmgTaken: 1 } }
  ];

  // --- Spells -------------------------------------------------------------------------------
  const SPELLS = {
    firebolt: { id: 'firebolt', name: 'Огненная стрела', mana: 6, magReq: 15, qlvl: 1, bookValue: 1000, color: '#ff6a10', town: false },
    heal: { id: 'heal', name: 'Лечение', mana: 5, magReq: 17, qlvl: 1, bookValue: 1000, color: '#e04040', town: true },
    lightning: { id: 'lightning', name: 'Молния', mana: 10, magReq: 20, qlvl: 4, bookValue: 3000, color: '#a0c0ff', town: false },
    flash: { id: 'flash', name: 'Вспышка', mana: 30, magReq: 33, qlvl: 5, bookValue: 7500, color: '#ffffff', town: false },
    townportal: { id: 'townportal', name: 'Городской портал', mana: 35, magReq: 20, qlvl: 3, bookValue: 3000, color: '#4080ff', town: false },
    identify: { id: 'identify', name: 'Опознание', mana: 0, magReq: 999, qlvl: 99, color: '#c0c060', town: true, scrollOnly: true },
    manashield: { id: 'manashield', name: 'Щит маны', mana: 33, magReq: 25, qlvl: 6, bookValue: 16000, color: '#6070ff', town: false },
    fireball: { id: 'fireball', name: 'Огненный шар', mana: 16, magReq: 48, qlvl: 8, bookValue: 8000, color: '#ff4000', town: false },
    stonecurse: { id: 'stonecurse', name: 'Каменное проклятие', mana: 60, magReq: 51, qlvl: 8, bookValue: 12000, color: '#909090', town: false },
    chainlightning: { id: 'chainlightning', name: 'Цепная молния', mana: 30, magReq: 54, qlvl: 10, bookValue: 11000, color: '#80a0ff', town: false },
    nova: { id: 'nova', name: 'Нова', mana: 60, magReq: 87, qlvl: 14, bookValue: 21000, color: '#c0e0ff', town: false },
    teleport: { id: 'teleport', name: 'Телепорт', mana: 35, magReq: 105, qlvl: 14, bookValue: 20000, color: '#d0a0ff', town: false }
  };
  const SKILLS = {
    repair: { id: 'repair', name: 'Ремонт предмета', desc: 'Чинит предмет, но уменьшает максимальную прочность.' },
    disarm: { id: 'disarm', name: 'Обезвредить ловушку', desc: 'Снимает ловушку с сундука.' },
    recharge: { id: 'recharge', name: 'Перезарядка посоха', desc: 'Восстанавливает заряды посоха, уменьшая их предел.' }
  };

  // --- Monsters -----------------------------------------------------------------------------
  // look: sprite family; ai: melee | ranged | caster | charge | bat | hidden | fallen
  const M = (id, name, look, o) => Object.assign({ id, name, look, ai: 'melee', pack: [1, 1], speed: 2.4, atk: 0.8, ac: 10, toHit: 20, resist: {}, tags: [] }, o);
  const MONSTERS = [
    M('zombie', 'Зомби', 'zombie', { lvl: [1, 2], mlvl: 1, hp: [4, 7], dmg: [2, 5], ac: 5, toHit: 10, xp: 54, speed: 1.3, atk: 1.1, tags: ['undead'], color: '#5d7a4a' }),
    M('fallen', 'Падший', 'fallen', { lvl: [1, 2], mlvl: 1, hp: [1, 4], dmg: [1, 3], ac: 10, toHit: 15, xp: 46, ai: 'fallen', pack: [3, 6], speed: 2.8, atk: 0.6, tags: ['demon'], color: '#b04040' }),
    M('skeleton', 'Скелет', 'skeleton', { lvl: [1, 3], mlvl: 1, hp: [2, 4], dmg: [1, 4], ac: 10, toHit: 20, xp: 64, pack: [2, 5], tags: ['undead'], color: '#d8d0b8' }),
    M('scavenger', 'Падальщик', 'beast', { lvl: [2, 4], mlvl: 2, hp: [3, 6], dmg: [1, 5], ac: 10, toHit: 20, xp: 80, pack: [2, 4], speed: 3, tags: ['animal'], color: '#7a6040' }),
    M('ghoul', 'Упырь', 'zombie', { lvl: [2, 4], mlvl: 2, hp: [7, 11], dmg: [3, 10], ac: 10, toHit: 10, xp: 58, speed: 1.4, atk: 1.1, tags: ['undead'], color: '#6a6a3a' }),
    M('skelarcher', 'Скелет-лучник', 'skeleton', { lvl: [2, 4], mlvl: 3, hp: [3, 6], dmg: [1, 3], ac: 5, toHit: 15, xp: 110, ai: 'ranged', proj: 'arrow', range: 7, pack: [2, 4], tags: ['undead', 'bow'], color: '#e0d8c0' }),
    M('carver', 'Резчик', 'fallen', { lvl: [3, 4], mlvl: 3, hp: [6, 12], dmg: [2, 5], ac: 15, toHit: 20, xp: 80, ai: 'fallen', pack: [3, 6], speed: 2.8, atk: 0.6, tags: ['demon'], color: '#d06020' }),
    M('corpseaxe', 'Трупный топорщик', 'skeleton', { lvl: [3, 5], mlvl: 3, hp: [8, 12], dmg: [3, 8], ac: 17, toHit: 25, xp: 90, pack: [2, 4], tags: ['undead', 'axe'], color: '#b8a888' }),
    M('fiend', 'Крылатый бес', 'bat', { lvl: [3, 6], mlvl: 3, hp: [3, 6], dmg: [1, 6], ac: 10, toHit: 30, xp: 102, ai: 'bat', pack: [3, 6], speed: 4.2, atk: 0.5, tags: ['animal'], color: '#503a50' }),
    M('hidden', 'Незримый', 'hidden', { lvl: [4, 7], mlvl: 5, hp: [8, 24], dmg: [3, 6], ac: 25, toHit: 35, xp: 278, ai: 'hidden', pack: [1, 3], tags: ['demon'], color: '#607080' }),
    M('rotting', 'Гниющий труп', 'zombie', { lvl: [4, 6], mlvl: 4, hp: [15, 25], dmg: [5, 15], ac: 15, toHit: 25, xp: 136, speed: 1.4, atk: 1.1, tags: ['undead'], color: '#4a6a5a' }),
    M('burningdead', 'Пылающий мертвец', 'skeleton', { lvl: [5, 7], mlvl: 5, hp: [10, 16], dmg: [4, 10], ac: 25, toHit: 35, xp: 154, pack: [2, 4], resist: { fire: 75 }, tags: ['undead'], color: '#e09040' }),
    M('darkone', 'Тёмный', 'fallen', { lvl: [5, 8], mlvl: 6, hp: [12, 20], dmg: [4, 8], ac: 20, toHit: 30, xp: 178, ai: 'fallen', pack: [3, 6], speed: 2.8, atk: 0.6, tags: ['demon'], color: '#402a60' }),
    M('goatman', 'Козлоногий', 'goat', { lvl: [5, 8], mlvl: 6, hp: [20, 30], dmg: [1, 12], ac: 40, toHit: 50, xp: 460, pack: [2, 4], tags: ['demon'], color: '#8a5a30' }),
    M('goatarcher', 'Козлоногий лучник', 'goat', { lvl: [6, 9], mlvl: 7, hp: [15, 24], dmg: [1, 7], ac: 35, toHit: 45, xp: 448, ai: 'ranged', proj: 'arrow', range: 8, pack: [2, 4], tags: ['demon', 'bow'], color: '#7a4a30' }),
    M('blackdeath', 'Чёрная смерть', 'zombie', { lvl: [7, 10], mlvl: 8, hp: [30, 42], dmg: [6, 18], ac: 30, toHit: 35, xp: 400, speed: 1.6, atk: 1, tags: ['undead'], color: '#2a3a2a' }),
    M('horror', 'Ужас', 'skeleton', { lvl: [7, 10], mlvl: 8, hp: [28, 40], dmg: [6, 16], ac: 35, toHit: 45, xp: 420, pack: [2, 5], tags: ['undead'], color: '#c0b0e0' }),
    M('overlord', 'Властелин', 'brute', { lvl: [8, 11], mlvl: 10, hp: [60, 80], dmg: [6, 12], ac: 55, toHit: 60, xp: 635, speed: 1.8, atk: 1.1, tags: ['demon'], color: '#6a4a3a' }),
    M('acidbeast', 'Кислотная тварь', 'beast', { lvl: [9, 12], mlvl: 11, hp: [40, 66], dmg: [4, 12], ac: 40, toHit: 50, xp: 846, ai: 'ranged', proj: 'acid', range: 6, pack: [2, 3], tags: ['animal'], color: '#6ab040' }),
    M('magma', 'Магмовый демон', 'demon', { lvl: [9, 12], mlvl: 13, hp: [50, 70], dmg: [2, 10], ac: 45, toHit: 50, xp: 1076, ai: 'ranged', proj: 'magma', range: 7, pack: [2, 3], resist: { fire: 100 }, tags: ['demon'], color: '#c04010' }),
    M('horned', 'Рогатый демон', 'horned', { lvl: [10, 13], mlvl: 13, hp: [40, 80], dmg: [2, 16], ac: 40, toHit: 60, xp: 1172, ai: 'charge', pack: [1, 3], tags: ['animal'], color: '#7a3a2a' }),
    M('stormrider', 'Грозовой всадник', 'demon', { lvl: [11, 14], mlvl: 16, hp: [60, 100], dmg: [8, 18], ac: 50, toHit: 65, xp: 1520, ai: 'ranged', proj: 'bolt', range: 7, pack: [1, 3], resist: { light: 100 }, tags: ['demon'], color: '#4060c0' }),
    M('succubus', 'Суккуб', 'succubus', { lvl: [13, 16], mlvl: 16, hp: [60, 75], dmg: [1, 20], ac: 60, toHit: 70, xp: 2150, ai: 'ranged', proj: 'bloodstar', range: 8, pack: [2, 4], resist: { magic: 50 }, tags: ['demon'], color: '#c04070' }),
    M('blackknight', 'Чёрный рыцарь', 'knight', { lvl: [12, 16], mlvl: 20, hp: [150, 165], dmg: [15, 20], ac: 75, toHit: 110, xp: 3360, speed: 2, atk: 0.9, pack: [1, 2], resist: { magic: 50 }, tags: ['demon'], color: '#202028' }),
    M('advocate', 'Защитник', 'mage', { lvl: [14, 16], mlvl: 24, hp: [140, 170], dmg: [8, 24], ac: 60, toHit: 90, xp: 5000, ai: 'caster', proj: 'fireball', range: 8, pack: [1, 2], resist: { magic: 75, fire: 50 }, tags: ['demon'], color: '#4a2a6a' }),
    M('balrog', 'Балрог', 'balrog', { lvl: [14, 16], mlvl: 26, hp: [180, 200], dmg: [20, 40], ac: 70, toHit: 110, xp: 6000, speed: 2, atk: 1, resist: { fire: 75 }, tags: ['demon'], color: '#8a1a10' })
  ];
  // Quest bosses (never spawned randomly).
  const BOSSES = {
    butcher: M('butcher', 'Мясник', 'butcher', { mlvl: 10, hp: [220, 220], dmg: [6, 12], ac: 50, toHit: 60, xp: 710, speed: 2.8, atk: 0.55, tags: ['demon'], color: '#b02020', drop: 'cleaver', bark: 'А-а, свежее мясо!' }),
    leoric: M('leoric', 'Король-скелет', 'king', { mlvl: 9, hp: [240, 240], dmg: [6, 16], ac: 70, toHit: 60, xp: 1000, speed: 2, atk: 0.9, tags: ['undead'], color: '#e8e0c0', drop: 'undeadcrown', summon: 'skeleton', bark: 'Кто посмел вторгнуться в мои владения?!' }),
    lazarus: M('lazarus', 'Архиепископ Лазарь', 'mage', { mlvl: 30, hp: [600, 600], dmg: [30, 50], ac: 90, toHit: 110, xp: 12000, ai: 'caster', proj: 'fireball', range: 8, resist: { fire: 50, magic: 50 }, tags: ['demon'], color: '#c0a040', bark: 'Ты опоздал, глупец! Тёмный Владыка скоро пробудится!' }),
    diablo: M('diablo', 'Диабло', 'diablo', { mlvl: 45, hp: [1666, 1666], dmg: [30, 60], ac: 90, toHit: 140, xp: 31666, ai: 'caster', proj: 'apocalypse', range: 9, speed: 2.4, atk: 0.9, resist: { fire: 50, light: 50, magic: 50 }, tags: ['demon'], color: '#a01010', bark: 'Не спеши умирать, смертный. Я голоден.' })
  };

  const ELITE_NAMES = {
    first: ['Кострохват', 'Черепокол', 'Гнилозуб', 'Мракоглаз', 'Кровопуск', 'Костолом', 'Огнекрыл', 'Пеплорук', 'Злобошип', 'Рваноух', 'Смертокрик', 'Трупоед'],
    title: ['Проклятый', 'Нечестивый', 'Свирепый', 'Бешеный', 'Древний', 'Бледный', 'Кровавый', 'Ненасытный']
  };

  const THEMES = [
    { id: 'town', name: 'Тристрам' },
    { id: 'cathedral', name: 'Собор', floor: ['#4a4038', '#443a33', '#51463d'], wall: '#6b5d4e', wallTop: '#857462', gen: 'rooms' },
    { id: 'catacombs', name: 'Катакомбы', floor: ['#3a3434', '#352f30', '#403838'], wall: '#5a4e4a', wallTop: '#766660', gen: 'rooms', doors: true },
    { id: 'caves', name: 'Пещеры', floor: ['#3d3526', '#393121', '#43392a'], wall: '#5b4a30', wallTop: '#735f3e', gen: 'caves' },
    { id: 'hell', name: 'Ад', floor: ['#3d1c16', '#361813', '#45221a'], wall: '#5a2a20', wallTop: '#7a3a2a', gen: 'rooms', lava: true }
  ];

  const NPCS = [
    { id: 'griswold', name: 'Грисвольд', title: 'Кузнец', look: 'smith', x: 27, y: 17 },
    { id: 'pepin', name: 'Пепин', title: 'Лекарь', look: 'healer', x: 16, y: 27 },
    { id: 'adria', name: 'Адрия', title: 'Ведьма', look: 'witch', x: 33, y: 31 },
    { id: 'cain', name: 'Декард Каин', title: 'Старейшина', look: 'elder', x: 21, y: 22 },
    { id: 'ogden', name: 'Огден', title: 'Трактирщик', look: 'barkeep', x: 16, y: 16 },
    { id: 'gillian', name: 'Джиллиан', title: 'Служанка', look: 'maid', x: 14, y: 18 },
    { id: 'farnham', name: 'Фарнхем', title: 'Пьяница', look: 'drunk', x: 25, y: 26 },
    { id: 'wirt', name: 'Вирт', title: 'Мальчишка', look: 'boy', x: 30, y: 24 },
    { id: 'townsman', name: 'Раненый горожанин', title: '', look: 'wounded', x: 12, y: 9 }
  ];

  const SHRINES = ['mysterious', 'divine', 'eerie', 'glimmering', 'religious', 'enchanted', 'cryptic', 'spooky', 'abandoned', 'creepy', 'quiet', 'magical'];

  D.DATA = { adj, CLASSES, XP, BASES, BASE, PREFIXES, SUFFIXES, UNIQUES, SPELLS, SKILLS, MONSTERS, BOSSES, ELITE_NAMES, THEMES, NPCS, SHRINES };
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Diablo98 = globalThis.Diablo98 || {});
