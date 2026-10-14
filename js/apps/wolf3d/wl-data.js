(function (W) {
  'use strict';

  const TIC = 70;
  const DEG = Math.PI / 180;

  const PLAYER = {
    walk: 5.0, run: 9.4, turn: 122 * DEG, runTurn: 220 * DEG, radius: 0.34,
    maxHealth: 100, maxAmmo: 99, startAmmo: 8, lives: 3, maxLives: 9, extraLife: 40000,
    useReach: 1.0, knifeReach: 1.5, aimTan: 0.15
  };

  const shootSeq = (aim, fire, rest) => [['shoot1', aim], ['shoot2', fire, 'fire'], ['shoot3', rest]];

  const ENEMIES = {
    guard: {
      hp: [25, 25, 25, 25], points: 100, patrol: 0.55, chase: 1.65, react: 64, dodge: true, rot: true,
      shoot: shootSeq(20, 20, 20), fireSnd: 'e_pistol', alert: 'v_halt', die: ['v_guard_die1', 'v_guard_die2', 'v_guard_die3'], drop: 'clip2', radius: 0.4
    },
    officer: {
      hp: [50, 50, 50, 50], points: 400, patrol: 0.55, chase: 2.2, react: 2, dodge: true, rot: true,
      shoot: [['shoot1', 6], ['shoot2', 20, 'fire'], ['shoot3', 10]], fireSnd: 'e_pistol', alert: 'v_spion', die: ['v_officer_die'], drop: 'clip2', radius: 0.4
    },
    ss: {
      hp: [100, 100, 100, 100], points: 500, patrol: 0.55, chase: 1.65, react: 42, dodge: true, rot: true, sharp: true,
      shoot: [['shoot1', 20], ['shoot2', 20, 'fire'], ['shoot3', 10], ['shoot2', 10, 'fire'], ['shoot3', 10], ['shoot2', 10, 'fire'], ['shoot3', 10]],
      fireSnd: 'e_mg', alert: 'v_ss', die: ['v_ss_die'], drop: 'ssdrop', radius: 0.4
    },
    dog: {
      hp: [1, 1, 1, 1], points: 200, patrol: 1.6, chase: 3.2, react: 32, melee: true, rot: true,
      shoot: [['jump1', 10], ['jump2', 10, 'bite'], ['jump3', 10], ['jump1', 10]], fireSnd: 'e_bite', alert: 'e_bark', die: ['e_dog_die'], radius: 0.4
    },
    mutant: {
      hp: [45, 55, 55, 65], points: 700, patrol: 0.55, chase: 1.65, react: 42, dodge: true, rot: true,
      shoot: [['shoot1', 6], ['shoot2', 20, 'fire'], ['shoot3', 10, 'fire'], ['shoot4', 20]], fireSnd: 'e_pistol', alert: null, die: ['e_mutant_die'], drop: 'clip2', radius: 0.4
    },
    hans: {
      hp: [850, 950, 1050, 1200], points: 5000, chase: 1.5, react: 1, boss: true, sharp: true,
      shoot: [['shoot1', 30], ['shoot2', 10, 'fire'], ['shoot3', 10, 'fire'], ['shoot2', 10, 'fire'], ['shoot3', 10, 'fire'], ['shoot2', 10, 'fire'], ['shoot1', 10]],
      fireSnd: 'e_boss', alert: 'v_hans', die: ['v_hans_die'], drop: 'key1', radius: 0.45
    },
    gretel: {
      hp: [850, 950, 1050, 1200], points: 5000, chase: 1.5, react: 1, boss: true, sharp: true,
      shoot: [['shoot1', 30], ['shoot2', 10, 'fire'], ['shoot3', 10, 'fire'], ['shoot2', 10, 'fire'], ['shoot3', 10, 'fire'], ['shoot2', 10, 'fire'], ['shoot1', 10]],
      fireSnd: 'e_boss', alert: 'v_gretel', die: ['v_gretel_die'], drop: 'key1', radius: 0.45
    },
    schabbs: {
      hp: [850, 950, 1550, 2400], points: 5000, chase: 1.2, react: 1, boss: true, deathcam: true, keepAway: 3,
      shoot: [['shoot1', 30], ['shoot2', 10, 'needle'], ['shoot1', 10]], fireSnd: 'e_throw', alert: 'v_schabbs', die: ['v_schabbs_die'], radius: 0.45
    },
    mecha: {
      hp: [850, 950, 1050, 1200], points: 5000, chase: 1.1, react: 1, boss: true, sharp: true, clank: true,
      shoot: [['shoot1', 30], ['shoot2', 10, 'fire'], ['shoot3', 10, 'fire'], ['shoot2', 10, 'fire'], ['shoot3', 10, 'fire']],
      fireSnd: 'e_boss', alert: 'v_mecha', die: ['e_mecha_die'], spawn: 'hitler', radius: 0.5
    },
    hitler: {
      hp: [500, 700, 800, 900], points: 5000, chase: 2.6, react: 1, boss: true, sharp: true, deathcam: true,
      shoot: [['shoot1', 30], ['shoot2', 5, 'fire'], ['shoot3', 5, 'fire'], ['shoot2', 5, 'fire'], ['shoot3', 5, 'fire'], ['shoot2', 5, 'fire'], ['shoot3', 5, 'fire']],
      fireSnd: 'e_boss', alert: 'v_hitler', die: ['v_hitler_die'], radius: 0.45
    },
    fake: {
      hp: [200, 300, 400, 500], points: 2000, chase: 1.65, react: 1, float: true,
      shoot: [['shoot1', 8, 'fireball'], ['shoot1', 8, 'fireball'], ['shoot1', 8, 'fireball'], ['shoot1', 30]], fireSnd: 'e_flame', alert: 'v_fake', die: ['v_fake_die'], radius: 0.4
    },
    otto: {
      hp: [850, 950, 1050, 1200], points: 5000, chase: 1.5, react: 1, boss: true, deathcam: true, keepAway: 3,
      shoot: [['shoot1', 30], ['shoot2', 10, 'rocket'], ['shoot1', 10]], fireSnd: 'e_rocket', alert: 'v_otto', die: ['v_otto_die'], radius: 0.45
    },
    fett: {
      hp: [850, 950, 1050, 1200], points: 5000, chase: 1.5, react: 1, boss: true, sharp: true, deathcam: true,
      shoot: [['shoot1', 30], ['shoot2', 10, 'rocket'], ['shoot3', 10, 'fire'], ['shoot4', 10, 'fire'], ['shoot3', 10, 'fire'], ['shoot4', 10, 'fire']],
      fireSnd: 'e_boss', alert: 'v_fett', die: ['v_fett_die'], radius: 0.45
    },
    ghost: {
      hp: [1, 1, 1, 1], points: 0, chase: 1.1, react: 1, ghost: true, float: true, invulnerable: true, shoot: [], radius: 0.4
    }
  };

  const PROJECTILES = {
    needle: { speed: 7.0, dmg: [20, 31], spr: 'needle' },
    rocket: { speed: 7.5, dmg: [30, 31], spr: 'rocket', smoke: true, boom: true },
    fireball: { speed: 4.2, dmg: [0, 31], spr: 'fire', anim: true }
  };

  const WEAPONS = [
    { id: 'knife', snd: 'w_knife', frames: [[1, 6], [2, 6, 'knife'], [3, 6], [4, 6]] },
    { id: 'pistol', snd: 'w_pistol', frames: [[1, 6], [2, 6, 'fire'], [3, 6], [4, 6]] },
    { id: 'mg', snd: 'w_mg', frames: [[1, 6], [2, 6, 'fire'], [3, 6, null, 'loop'], [4, 6]] },
    { id: 'chain', snd: 'w_chain', frames: [[1, 6], [2, 6, 'fire'], [3, 6, 'fire', 'loop'], [4, 6]] }
  ];

  const PICKUPS = {
    clip: { ammo: 8, snd: 'p_ammo' },
    clip2: { ammo: 4, snd: 'p_ammo' },
    food: { heal: 10, snd: 'p_health' },
    dogfood: { heal: 4, snd: 'p_health' },
    firstaid: { heal: 25, snd: 'p_health' },
    gibs: { heal: 1, onlyBelow: 11, snd: 'p_gibs' },
    key1: { key: 1, snd: 'p_key' },
    key2: { key: 2, snd: 'p_key' },
    cross: { score: 100, treasure: true, snd: 'p_cross' },
    chalice: { score: 500, treasure: true, snd: 'p_chalice' },
    chest: { score: 1000, treasure: true, snd: 'p_chest' },
    crown: { score: 5000, treasure: true, snd: 'p_crown' },
    oneup: { life: true, treasure: true, snd: 'p_oneup' },
    mg: { weapon: 2, ammo: 6, snd: 'p_mg' },
    chain: { weapon: 3, ammo: 6, grin: true, snd: 'p_chain' }
  };

  const DECOR = {
    puddle: { block: false }, lamp: { block: false }, chandelier: { block: false },
    barrel: { block: true }, woodbarrel: { block: true }, tablechairs: { block: true }, table: { block: true },
    stove: { block: true }, pillar: { block: true }, plant: { block: true }, vase: { block: true },
    bones: { block: false }, skeleton: { block: false }, hangskel: { block: true }, bloodbones: { block: false },
    pans: { block: false }, flag: { block: true }, cage: { block: true }, cageskel: { block: true },
    well: { block: true }, spears: { block: true }, bed: { block: true }, armor: { block: true }
  };

  const WALLS = {
    A: 'grey', Q: 'grey2', F: 'flag', P: 'portrait', E: 'eagle', B: 'blue', C: 'cell', K: 'cellskel',
    W: 'wood', H: 'woodeagle', J: 'woodpaint', R: 'brick', T: 'brickbanner', M: 'metal', N: 'metalsign',
    L: 'labtile', V: 'purple', U: 'brown', O: 'cave', G: 'moss', I: 'marble', D: 'bluesign',
    S: 'stainglass', Z: 'elevator', X: 'switch', Y: 'switch'
  };
  const TEXTURES = ['grey', 'grey2', 'flag', 'portrait', 'eagle', 'blue', 'cell', 'cellskel', 'wood', 'woodeagle', 'woodpaint',
    'brick', 'brickbanner', 'metal', 'metalsign', 'labtile', 'purple', 'brown', 'cave', 'moss', 'marble', 'bluesign', 'stainglass',
    'elevator', 'switch', 'switchdown', 'door', 'doorlock1', 'doorlock2', 'doorelev', 'doorside'];

  const LEGEND = {
    '.': {}, ' ': { void: true },
    '+': { door: 0 }, '!': { door: 1 }, '?': { door: 2 }, '=': { door: 3 },
    '@': { push: true },
    '^': { start: 3 }, '>': { start: 0 }, 'v': { start: 1 }, '<': { start: 2 },
    g: { actor: 'guard' }, s: { actor: 'ss' }, d: { actor: 'dog' }, o: { actor: 'officer' }, m: { actor: 'mutant' },
    h: { actor: 'guard', patrol: true }, k: { actor: 'ss', patrol: true }, n: { actor: 'dog', patrol: true }, q: { actor: 'officer', patrol: true }, u: { actor: 'mutant', patrol: true },
    1: { actor: 'guard', skill: 2 }, 2: { actor: 'ss', skill: 2 }, 3: { actor: 'dog', skill: 2 }, 4: { actor: 'officer', skill: 2 }, 5: { actor: 'mutant', skill: 2 },
    6: { actor: 'guard', skill: 3 }, 7: { actor: 'ss', skill: 3 }, 8: { actor: 'dog', skill: 3 }, 9: { actor: 'officer', skill: 3 }, 0: { actor: 'mutant', skill: 3 },
    '&': { boss: true },
    a: { item: 'clip' }, f: { item: 'food' }, w: { item: 'dogfood' }, e: { item: 'firstaid' }, y: { item: 'key1' }, z: { item: 'key2' },
    c: { item: 'cross' }, t: { item: 'chalice' }, x: { item: 'chest' }, r: { item: 'crown' }, l: { item: 'oneup' }, i: { item: 'mg' }, p: { item: 'chain' },
    ',': { decor: 'puddle' }, ':': { decor: 'lamp' }, ';': { decor: 'chandelier' }, '*': { decor: 'barrel' }, '%': { decor: 'woodbarrel' },
    '#': { decor: 'tablechairs' }, '[': { decor: 'table' }, ']': { decor: 'stove' }, '|': { decor: 'pillar' }, '"': { decor: 'plant' },
    "'": { decor: 'vase' }, '~': { decor: 'bones' }, '_': { decor: 'skeleton' }, j: { decor: 'hangskel' }, '/': { item: 'gibs' },
    '-': { decor: 'pans' }, '(': { decor: 'flag' }, ')': { decor: 'cage' }, '{': { decor: 'cageskel' }, '}': { decor: 'well' },
    '\\': { decor: 'spears' }, b: { decor: 'bed' }, '$': { decor: 'armor' }
  };

  const EPISODES = [
    { name: { ru: 'Побег из Вольфенштайна', en: 'Escape from Wolfenstein' }, secretFrom: 1, boss: 'hans', pic: 'ep1' },
    { name: { ru: 'Операция «Айзенфауст»', en: 'Operation: Eisenfaust' }, secretFrom: 1, boss: 'schabbs', pic: 'ep2' },
    { name: { ru: 'Умри, фюрер, умри!', en: 'Die, Fuhrer, Die!' }, secretFrom: 7, boss: 'mecha', pic: 'ep3' },
    { name: { ru: 'Тёмная тайна', en: 'A Dark Secret' }, secretFrom: 3, boss: 'otto', pic: 'ep4' },
    { name: { ru: 'След безумца', en: 'Trail of the Madman' }, secretFrom: 5, boss: 'gretel', pic: 'ep5' },
    { name: { ru: 'Противостояние', en: 'Confrontation' }, secretFrom: 3, boss: 'fett', pic: 'ep6' }
  ];

  const SKILLS = [
    { ru: 'Папа, можно я поиграю?', en: 'Can I play, Daddy?' },
    { ru: 'Только не больно.', en: "Don't hurt me." },
    { ru: 'Давайте их сюда!', en: "Bring 'em on!" },
    { ru: 'Я — сама смерть!', en: 'I am Death incarnate!' }
  ];

  const ACTIONS = ['fwd', 'back', 'left', 'right', 'sleft', 'sright', 'strafe', 'run', 'fire', 'use', 'w1', 'w2', 'w3', 'w4'];
  const DEFAULT_KEYS = {
    fwd: ['ArrowUp', 'KeyW'], back: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', ''], right: ['ArrowRight', ''],
    sleft: ['KeyA', 'Comma'], sright: ['KeyD', 'Period'], strafe: ['AltLeft', 'AltRight'], run: ['ShiftLeft', 'ShiftRight'],
    fire: ['ControlLeft', 'ControlRight'], use: ['Space', 'KeyE'], w1: ['Digit1', ''], w2: ['Digit2', ''], w3: ['Digit3', ''], w4: ['Digit4', '']
  };

  const STR = {
    ru: {
      menu: 'Меню', newGame: 'Новая игра', sound: 'Звук', control: 'Управление', loadGame: 'Загрузить игру', saveGame: 'Сохранить игру',
      changeView: 'Размер экрана', readThis: 'Прочти это!', viewScores: 'Рекорды', backToDemo: 'Вернуться к демо', backToGame: 'Вернуться в игру',
      endGame: 'Закончить игру', quit: 'Выход',
      whichEpisode: 'Какой эпизод играть?', howTough: 'Насколько вы круты?',
      soundEffects: 'Звуковые эффекты', digiSound: 'Голоса и оцифровка', music: 'Музыка', none: 'Нет', pcSpeaker: 'PC Speaker', adlib: 'AdLib / Sound Blaster',
      soundBlaster: 'Sound Blaster', volSfx: 'Громкость звуков', volMusic: 'Громкость музыки',
      mouseEnabled: 'Мышь', mouseSens: 'Чувствительность мыши', mouseMove: 'Мышь двигает вперёд/назад', alwaysRun: 'Всегда бежать', customize: 'Настроить клавиши',
      on: 'Вкл', off: 'Выкл',
      act: { fwd: 'Вперёд', back: 'Назад', left: 'Поворот влево', right: 'Поворот вправо', sleft: 'Шаг влево', sright: 'Шаг вправо', strafe: 'Шаг вбок (зажать)', run: 'Бег', fire: 'Огонь', use: 'Открыть / Нажать', w1: 'Нож', w2: 'Пистолет', w3: 'Автомат', w4: 'Пулемёт' },
      pressKeyFor: 'Нажмите клавишу. Esc — отмена, Backspace — очистить',
      emptySlot: '- пусто -', typeName: 'Введите название и нажмите Enter', saved: 'Игра сохранена', loaded: 'Игра загружена', noSave: 'Нет сохранения',
      viewHint: 'Стрелки меняют размер, Enter — готово',
      navHint: 'Стрелки — выбор, Enter — ок, Esc — назад',
      confirmEnd: 'Вы уверены, что хотите\nзакончить текущую игру?\n\nY — да, N — нет',
      confirmNew: 'Начать новую игру?\nТекущая будет потеряна.\n\nY — да, N — нет',
      confirmQuit: 'Y — выйти, N — остаться',
      quitLines: [
        'Уже уходите? Охрана\nтолько начала просыпаться.',
        'Вы правда хотите выйти?\nЗа той дверью может быть\nзолотой кубок.',
        'Сбежать из замка можно\nи через лифт, между прочим.',
        'Нажмите N, Би Джей ещё\nне доел свою индейку.',
        'Выход? Овчарки будут\nскучать по вам.',
        'Мама ещё не пришла.\nОдин этаж, а?',
        'Вы уверены? Ганс Гросс\nзнает, где вы живёте.'
      ],
      floor: 'ЭТАЖ', score: 'СЧЁТ', lives: 'ЖИЗНИ', health: 'ЗДОРОВЬЕ', ammo: 'ПАТРОНЫ',
      floorDone: 'ЭТАЖ {n} ПРОЙДЕН', secretDone: 'ТАЙНЫЙ ЭТАЖ ПРОЙДЕН!', bonus: 'БОНУС', time: 'ВРЕМЯ', par: 'НОРМА',
      killRatio: 'УБИТО', secretRatio: 'ТАЙНИКИ', treasureRatio: 'СОКРОВИЩА', perfect: 'ИДЕАЛЬНО!', secretBonus: 'БОНУС 15000!',
      pressKey: 'Нажмите любую клавишу', getPsyched: 'Приготовьтесь!', paused: 'ПАУЗА',
      totalTime: 'ОБЩЕЕ ВРЕМЯ', averages: 'СРЕДНИЕ ПОКАЗАТЕЛИ', youWin: 'ПОБЕДА!',
      deathCam: 'Посмотрим ещё раз!',
      highScores: 'Рекорды', name: 'Имя', scoreCol: 'Очки', epCol: 'Эпизод', enterName: 'Вы попали в таблицу! Введите имя:',
      gameOver: 'ИГРА ОКОНЧЕНА',
      mli: 'Теперь у вас 100% здоровья,\n99 патронов и оба ключа!\n\nСчёт обнулён: о рекордах\nможно забыть.',
      debugOn: 'Режим отладки включён', debugOff: 'Режим отладки выключен',
      godOn: 'Режим бога ВКЛ', godOff: 'Режим бога ВЫКЛ', freeItems: 'Бесплатные предметы!', noclipOn: 'Сквозь стены ВКЛ', noclipOff: 'Сквозь стены ВЫКЛ',
      warpTo: 'Перейти на этаж (1-10):',
      titleHint: 'Нажмите любую клавишу',
      credits: ['Фан-клон для Win 98', 'Движок, графика, звук и уровни', 'сделаны кодом с нуля.', '', 'По мотивам игры id Software (1992):', 'Джон Кармак, Джон Ромеро,', 'Том Холл, Эдриан Кармак,', 'Бобби Принс (музыка)'],
      demoBanner: 'ДЕМО',
      readThisPages: [
        { title: 'Об игре', lines: ['Вы — Уильям «Би Джей» Бласковиц, лучший', 'агент союзников. Вас поймали и заперли', 'в подвале замка Вольфенштайн.', '', 'У вас нож, пистолет и восемь патронов.', 'Выберитесь из замка, а потом сорвите', 'планы врага в пяти других заданиях.', '', 'Каждый этаж заканчивается лифтом.', 'Нажмите рычаг на стене кабины.'] },
        { title: 'Управление', lines: ['Стрелки или W/S — идти, стрелки — поворот', 'A/D или Alt + стрелки — шаг в сторону', 'Shift — бег, Ctrl или ЛКМ — огонь', 'Пробел или E — открыть дверь, нажать', '1-4 — оружие: нож, пистолет, автомат,', 'пулемёт. Мышь поворачивает (щёлкните', 'по картинке, чтобы её захватить).', '', 'Esc — меню, Pause — пауза, F2/F3 — сохр./', 'загр., F5 — размер экрана, F9 — быстрая', 'загрузка, F8 — быстрое сохранение.'] },
        { title: 'Тайники', lines: ['Многие стены сдвигаются. Подойдите', 'вплотную и нажмите Пробел: стена', 'уедет на два квадрата, а за ней будет', 'тайник с сокровищами или оружием.', '', 'Ищите стены, которые выбиваются из', 'ряда: портреты, флаги, тупики.', '', 'Тайные лифты ведут на секретный', 'десятый этаж эпизода.'] },
        { title: 'Враги', lines: ['Охранник: медленный, пистолет.', 'Овчарка: быстрая, кусает вблизи.', 'Эсэсовец: крепкий, бьёт очередями.', 'Офицер: быстрый и меткий.', 'Мутант: стреляет без предупреждения.', '', 'Враги слышат выстрелы через открытые', 'двери. Нож бьёт бесшумно, а спящий', 'враг получает двойной урон.'] },
        { title: 'Предметы', lines: ['Еда +10, миска собачьей еды +4,', 'аптечка +25 здоровья.', 'Обойма: 8 патронов (у врагов — 4).', 'Крест 100, кубок 500, сундук 1000,', 'корона 5000 очков.', 'Сфера с лицом: полное здоровье,', '25 патронов и жизнь.', 'Каждые 40 000 очков дают жизнь.', 'Золотой и серебряный ключи', 'открывают двери своего цвета.'] }
      ],
      episodeEnd: [
        ['Вы выбрались из замка Вольфенштайн!', '', 'Ганс Гросс, громила с двумя пулемётами,', 'лежит у лифта. Охрана бежит по тревоге,', 'но вы уже в лесу. Вас подбирает', 'самолёт союзников.', '', 'Штаб не даёт отдохнуть: доктор Шаббс', 'в замке Холлехаммер оживляет мёртвых.', 'Это операция «Айзенфауст».'],
        ['Доктор Шаббс мёртв, его лаборатория', 'горит, мутанты больше не выйдут', 'из чанов.', '', 'В бумагах доктора есть адрес: бункер', 'под рейхсканцелярией. Там прячется', 'тот, кто отдавал приказы.', '', 'Пора закончить эту войну.'],
        ['Механический костюм разлетелся, его', 'хозяин выбрался и побежал. Далеко', 'он не ушёл.', '', 'Бункер затих. Это конец главного', 'похода, но в архивах остались ещё', 'три дела, о которых мир не знает.', '', 'Би Джей возвращается в прошлое.'],
        ['Отто Гифтмахер, автор химического', 'оружия, больше не нажмёт на спуск', 'ракетомёта.', '', 'Его склады газа взорваны вместе', 'с ним. Но чертежи успели вывезти', 'в замок Эрлангер.'],
        ['Гретель Гросс, сестра Ганса, пала', 'в замке Эрлангер. Карты вторжения', 'теперь у союзников.', '', 'Осталась одна цель: генерал', 'Фетгезихт, который поведёт армию', 'на запад.'],
        ['Генерал Фетгезихт повержен.', 'Армия без командира не выйдет', 'из замка Офенбах.', '', 'Все шесть заданий выполнены.', 'Би Джей Бласковиц возвращается домой', 'героем, а его кот, говорят, уже', 'ждёт у двери.', '', 'Спасибо, что играли!']
      ]
    },
    en: {
      menu: 'Menu', newGame: 'New Game', sound: 'Sound', control: 'Control', loadGame: 'Load Game', saveGame: 'Save Game',
      changeView: 'Change View', readThis: 'Read This!', viewScores: 'View Scores', backToDemo: 'Back to Demo', backToGame: 'Back to Game',
      endGame: 'End Game', quit: 'Quit',
      whichEpisode: 'Which episode to play?', howTough: 'How tough are you?',
      soundEffects: 'Sound Effects', digiSound: 'Digitized Sound', music: 'Music', none: 'None', pcSpeaker: 'PC Speaker', adlib: 'AdLib / Sound Blaster',
      soundBlaster: 'Sound Blaster', volSfx: 'Sound volume', volMusic: 'Music volume',
      mouseEnabled: 'Mouse', mouseSens: 'Mouse sensitivity', mouseMove: 'Mouse moves forward/back', alwaysRun: 'Always run', customize: 'Customize controls',
      on: 'On', off: 'Off',
      act: { fwd: 'Forward', back: 'Backward', left: 'Turn left', right: 'Turn right', sleft: 'Strafe left', sright: 'Strafe right', strafe: 'Strafe (hold)', run: 'Run', fire: 'Fire', use: 'Open / Use', w1: 'Knife', w2: 'Pistol', w3: 'Machine gun', w4: 'Chain gun' },
      pressKeyFor: 'Press a key. Esc cancels, Backspace clears',
      emptySlot: '- empty -', typeName: 'Type a name and press Enter', saved: 'Game saved', loaded: 'Game loaded', noSave: 'No saved game',
      viewHint: 'Arrows resize, Enter accepts',
      navHint: 'Arrows move, Enter selects, Esc backs out',
      confirmEnd: 'Are you sure you want\nto end the game you\nare playing?\n\nY - yes, N - no',
      confirmNew: 'Start a new game?\nThe current one will be lost.\n\nY - yes, N - no',
      confirmQuit: 'Y - quit, N - stay',
      quitLines: [
        'Leaving already? The\nguards just woke up.',
        'Really quit? There might\nbe a golden chalice behind\nthat next door.',
        'You can escape the castle\nby the elevator, you know.',
        'Press N. BJ has not\nfinished his turkey yet.',
        'Quit? The dogs will\nmiss you.',
        'Mom is not home yet.\nOne more floor?',
        'Are you sure? Hans Grosse\nknows where you live.'
      ],
      floor: 'FLOOR', score: 'SCORE', lives: 'LIVES', health: 'HEALTH', ammo: 'AMMO',
      floorDone: 'FLOOR {n} COMPLETED', secretDone: 'SECRET FLOOR COMPLETED!', bonus: 'BONUS', time: 'TIME', par: 'PAR',
      killRatio: 'KILL RATIO', secretRatio: 'SECRET RATIO', treasureRatio: 'TREASURE RATIO', perfect: 'PERFECT!', secretBonus: '15000 BONUS!',
      pressKey: 'Press any key', getPsyched: 'Get Psyched!', paused: 'PAUSED',
      totalTime: 'TOTAL TIME', averages: 'AVERAGES', youWin: 'YOU WIN!',
      deathCam: "Let's see that again!",
      highScores: 'High Scores', name: 'Name', scoreCol: 'Score', epCol: 'Episode', enterName: 'You made the high scores! Enter your name:',
      gameOver: 'GAME OVER',
      mli: 'You now have 100% Health,\n99 Ammo and both Keys!\n\nYour score is now zero:\nforget the high scores.',
      debugOn: 'Debug mode on', debugOff: 'Debug mode off',
      godOn: 'God mode ON', godOff: 'God mode OFF', freeItems: 'Free items!', noclipOn: 'No clipping ON', noclipOff: 'No clipping OFF',
      warpTo: 'Warp to which floor (1-10):',
      titleHint: 'Press any key',
      credits: ['A Win 98 fan clone', 'Engine, art, sound and levels', 'made in code from scratch.', '', 'Based on the id Software game (1992):', 'John Carmack, John Romero,', 'Tom Hall, Adrian Carmack,', 'Bobby Prince (music)'],
      demoBanner: 'DEMO',
      readThisPages: [
        { title: 'The Story', lines: ['You are William "B.J." Blazkowicz, the', "Allies' best agent. You were caught and", 'locked in the dungeon of Castle', 'Wolfenstein.', '', 'You have a knife, a pistol and eight', 'bullets. Escape, then wreck the enemy', 'plans in five more missions.', '', 'Each floor ends in an elevator:', 'throw the lever on its back wall.'] },
        { title: 'Controls', lines: ['Arrows or W/S move, arrows turn', 'A/D or Alt + arrows strafe', 'Shift runs, Ctrl or left click fires', 'Space or E opens doors and uses', '1-4 pick the knife, pistol, machine gun', 'or chain gun. The mouse turns (click', 'the picture to capture it).', '', 'Esc menu, Pause pauses, F2/F3 save/load,', 'F5 view size, F8 quick save,', 'F9 quick load.'] },
        { title: 'Secrets', lines: ['Many walls slide. Walk right up to', 'one and press Space: it moves back two', 'squares and opens a hidden room with', 'treasure or weapons.', '', 'Look for walls that stand out:', 'portraits, flags, dead ends.', '', 'Secret elevators lead to the hidden', 'tenth floor of the episode.'] },
        { title: 'Enemies', lines: ['Guard: slow, carries a pistol.', 'Dog: fast, bites up close.', 'SS: tough, fires bursts.', 'Officer: fast and accurate.', 'Mutant: shoots without warning.', '', 'Enemies hear gunfire through open doors.', 'The knife is silent, and an enemy that', 'has not noticed you takes double damage.'] },
        { title: 'Items', lines: ['Food +10, dog food +4,', 'first aid kit +25 health.', 'Clip: 8 bullets (4 from enemies).', 'Cross 100, chalice 500, chest 1000,', 'crown 5000 points.', 'The sphere with a face: full health,', '25 bullets and a life.', 'Every 40,000 points gives a life.', 'Gold and silver keys open the doors', 'of their color.'] }
      ],
      episodeEnd: [
        ['You escaped from Castle Wolfenstein!', '', 'Hans Grosse, the brute with two chain', 'guns, lies by the elevator. The alarm', 'rings, but you are already in the woods.', 'An Allied plane picks you up.', '', 'No rest: Dr. Schabbs is raising the', 'dead at Castle Hollehammer. This is', 'Operation Eisenfaust.'],
        ['Dr. Schabbs is dead and his lab is', 'burning. No more mutants will crawl', 'out of the tanks.', '', "The doctor's papers name a bunker", 'under the Reich Chancellery. The man', 'who gave the orders hides there.', '', 'Time to end this war.'],
        ['The mechanical suit blew apart and', 'its owner ran. He did not get far.', '', 'The bunker is silent. The main', 'campaign is over, but the archives', 'hold three more cases the world', 'never heard about.', '', 'B.J. goes back in time.'],
        ['Otto Giftmacher, the chemical weapons', 'maker, will never pull a rocket', 'trigger again.', '', 'His gas depots went up with him. But', 'the plans were sent to Castle', 'Erlangen.'],
        ['Gretel Grosse, sister of Hans, fell', 'at Castle Erlangen. The invasion maps', 'now belong to the Allies.', '', 'One target is left: General', 'Fettgesicht, who will lead the army', 'west.'],
        ['General Fettgesicht is down. The army', 'will not leave Castle Offenbach', 'without its commander.', '', 'All six missions are complete. B.J.', 'Blazkowicz goes home a hero, and his', 'cat is already waiting at the door.', '', 'Thanks for playing!']
      ]
    }
  };

  W.Data = { TIC, DEG, PLAYER, ENEMIES, PROJECTILES, WEAPONS, PICKUPS, DECOR, WALLS, TEXTURES, LEGEND, EPISODES, SKILLS, ACTIONS, DEFAULT_KEYS, STR };
})(globalThis.Wolf3D = globalThis.Wolf3D || {});
