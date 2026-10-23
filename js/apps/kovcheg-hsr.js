window.kovchegHsr = (() => {
  const ELEM_SET = { phys: 'champion', fire: 'firesmith', ice: 'glacial', elec: 'thunder', wind: 'eagle', quant: 'genius', imag: 'wastelander' };

  const PRESETS = {
    crit: { body: 'critR', feet: 'spd', sphere: 'elem', rope: 'atkP', set: 'elem', planar: 'station', subs: ['critR', 'critD', 'atkP', 'spd'] },
    burst: { body: 'critR', feet: 'spd', sphere: 'elem', rope: 'err', set: 'elem', planar: 'station', subs: ['critR', 'critD', 'atkP', 'spd'] },
    dot: { body: 'atkP', feet: 'spd', sphere: 'elem', rope: 'atkP', set: 'elem', planar: 'station', subs: ['atkP', 'ehr', 'spd', 'critR'] },
    brk: { body: 'atkP', feet: 'spd', sphere: 'elem', rope: 'breakE', set: 'thief', planar: 'station', subs: ['breakE', 'spd', 'atkP', 'critR'] },
    hp: { body: 'critR', feet: 'spd', sphere: 'elem', rope: 'hpP', set: 'elem', planar: 'station', subs: ['critR', 'critD', 'hpP', 'spd'] },
    amp: { body: 'hpP', feet: 'spd', sphere: 'hpP', rope: 'err', set: 'musketeer', planar: 'vonwacq', subs: ['spd', 'hpP', 'defP', 'res'] },
    ampbrk: { body: 'hpP', feet: 'spd', sphere: 'hpP', rope: 'breakE', set: 'thief', planar: 'vonwacq', subs: ['breakE', 'spd', 'hpP', 'res'] },
    debuff: { body: 'ehr', feet: 'spd', sphere: 'hpP', rope: 'err', set: 'musketeer', planar: 'vonwacq', subs: ['spd', 'ehr', 'hpP', 'atkP'] },
    heal: { body: 'healP', feet: 'spd', sphere: 'hpP', rope: 'err', set: 'passerby', planar: 'vonwacq', subs: ['spd', 'hpP', 'defP', 'res'] },
    shield: { body: 'defP', feet: 'spd', sphere: 'defP', rope: 'defP', set: 'knight', planar: 'vonwacq', subs: ['spd', 'defP', 'hpP', 'res'] },
    elation: { body: 'critR', feet: 'spd', sphere: 'elem', rope: 'atkP', set: 'elem', planar: 'vonwacq', subs: ['spd', 'critR', 'critD', 'atkP'] }
  };

  const CHARS = {
    trail: { cols: ['dps'], build: 'crit', su: 'destruction', tags: ['brk'] },
    trail_p: { cols: ['sus'], build: 'shield', tags: ['shield', 'taunt'] },
    march: { cols: ['sus'], build: 'shield', tags: ['shield', 'cc'] },
    danheng: { cols: ['dps'], build: 'crit', su: 'hunt', tags: ['debuff'] },
    himeko: { cols: ['dps'], build: 'crit', su: 'elation', tags: ['aoe', 'fua'] },
    welt: { cols: ['amp'], build: 'debuff', tags: ['debuff', 'cc'] },
    natasha: { cols: ['sus'], build: 'heal', tags: ['heal'] },
    serval: { cols: ['dps', 'sub'], build: 'dot', su: 'nihility', tags: ['dot', 'aoe'] },
    asta: { cols: ['amp'], build: 'amp', tags: ['buff'] },
    arlan: { cols: ['dps', 'sub'], build: 'crit', su: 'destruction', tags: ['hp'] },
    herta: { cols: ['dps', 'sub'], build: 'crit', su: 'elation', tags: ['aoe', 'fua'] },
    gepard: { cols: ['sus'], build: 'shield', tags: ['shield', 'cc'] },
    bronya: { cols: ['amp'], build: 'amp', tags: ['buff', 'adv'] },
    seele: { cols: ['dps'], build: 'crit', su: 'hunt', tags: ['extra'] },
    sampo: { cols: ['sub'], build: 'dot', su: 'nihility', tags: ['dot', 'debuff'] },
    hook: { cols: ['dps'], build: 'crit', su: 'destruction', tags: ['dot'] },
    pela: { cols: ['amp'], build: 'debuff', tags: ['debuff'] },
    ruanmei: { cols: ['amp'], build: 'ampbrk', tags: ['buff', 'brk'] },
    kafka: { cols: ['dps', 'sub'], build: 'dot', su: 'nihility', tags: ['dot', 'fua'] },
    silverwolf: { cols: ['amp'], build: 'debuff', tags: ['debuff'] },
    blade: { cols: ['dps'], build: 'hp', su: 'destruction', tags: ['hp', 'fua'] },
    bailu: { cols: ['sus'], build: 'heal', tags: ['heal', 'revive'] },
    yanqing: { cols: ['dps'], build: 'crit', su: 'hunt', tags: ['fua'] },
    clara: { cols: ['dps'], build: 'crit', su: 'preservation', tags: ['fua', 'taunt'] },
    miyabi: { cols: ['dps'], build: 'crit', su: 'remembrance', tags: ['aoe'] },
    yanagi: { cols: ['sub'], build: 'dot', su: 'nihility', tags: ['dot', 'debuff'] },
    phrolova: { cols: ['dps'], build: 'crit', su: 'elation', tags: ['summon'] },
    scar: { cols: ['dps'], build: 'crit', su: 'destruction', tags: ['aoe'] },
    kazuma: { cols: ['amp'], build: 'elation', tags: ['debuff', 'energy'] },
    aqua: { cols: ['sus'], build: 'heal', tags: ['heal', 'revive'] },
    megumin: { cols: ['dps'], build: 'burst', su: 'hunt', tags: ['aoe', 'brk'] },
    darkness: { cols: ['sus'], build: 'shield', tags: ['shield', 'taunt'] },
    yu: { cols: ['dps'], build: 'crit', su: 'hunt', tags: ['brk', 'extra'] },
    yosuke: { cols: ['amp'], build: 'debuff', tags: ['fua', 'debuff'] },
    chie: { cols: ['dps'], build: 'crit', su: 'destruction', tags: ['brk'] },
    yukiko: { cols: ['sus'], build: 'heal', tags: ['heal', 'dot'] },
    kanji: { cols: ['dps'], build: 'crit', su: 'destruction', tags: ['brk'] },
    rise: { cols: ['amp'], build: 'amp', tags: ['buff', 'debuff'] },
    lynx: { cols: ['sus'], build: 'heal', tags: ['heal'] },
    luka: { cols: ['sub'], build: 'dot', su: 'nihility', tags: ['dot', 'debuff'] },
    sushang: { cols: ['dps'], build: 'crit', su: 'hunt', tags: ['brk', 'extra'] },
    xueyi: { cols: ['dps'], build: 'brk', su: 'destruction', tags: ['brk', 'fua'] },
    tingyun: { cols: ['amp'], build: 'amp', tags: ['buff', 'energy'] },
    hanya: { cols: ['amp'], build: 'amp', tags: ['buff', 'debuff'] },
    qingque: { cols: ['dps'], build: 'crit', su: 'hunt', tags: ['aoe'] },
    yukong: { cols: ['amp'], build: 'amp', tags: ['buff'] },
    guinaifen: { cols: ['sub'], build: 'dot', su: 'nihility', tags: ['dot', 'debuff'] },
    makoto: { cols: ['dps'], build: 'crit', su: 'hunt', tags: ['delay'] },
    amanda: { cols: ['sus'], build: 'shield', tags: ['shield', 'taunt'] },
    talleah: { cols: ['dps'], build: 'crit', su: 'remembrance', tags: ['summon', 'cc'] },
    billy: { cols: ['dps'], build: 'crit', su: 'elation', tags: ['aoe'] },
    nicole: { cols: ['amp'], build: 'debuff', tags: ['debuff', 'energy'] },
    anby: { cols: ['dps'], build: 'crit', su: 'hunt', tags: ['brk', 'fua'] },
    jingyuan: { cols: ['dps'], build: 'crit', su: 'elation', tags: ['summon', 'fua'] },
    luocha: { cols: ['sus'], build: 'heal', tags: ['heal'] },
    imbibitor: { cols: ['dps'], build: 'crit', su: 'destruction', tags: ['aoe'] },
    fuxuan: { cols: ['sus'], build: 'amp', tags: ['heal', 'taunt'] },
    jingliu: { cols: ['dps'], build: 'crit', su: 'destruction', tags: ['aoe', 'hp'] },
    topaz: { cols: ['dps', 'sub'], build: 'crit', su: 'hunt', tags: ['fua', 'summon'] },
    huohuo: { cols: ['sus'], build: 'heal', tags: ['heal', 'energy'] },
    argenti: { cols: ['dps'], build: 'crit', su: 'elation', tags: ['aoe'] },
    ratio: { cols: ['dps'], build: 'crit', su: 'hunt', tags: ['fua', 'debuff'] }
  };

  const STD_CONE = { hunt: 'swordplay', erudition: 'geniuses', destruction: 'underthesky', harmony: 'memories', nihility: 'goodnight', preservation: 'trend', abundance: 'postop', remembrance: 'masquerade', elation: 'goodluck' };
  const EARLY_CONE = { hunt: 'arrows', erudition: 'databank', destruction: 'collapsing', harmony: 'chorus', nihility: 'void', preservation: 'amber', abundance: 'cornucopia', remembrance: 'masquerade', elation: 'sneering' };

  const FREE = ['trail', 'trail_p', 'march', 'danheng', 'arlan', 'herta', 'hook', 'natasha', 'serval', 'kazuma'];

  const SOURCE = {
    trail: 'Главный герой, с вами с первой минуты',
    trail_p: 'Путь Сохранения Первопроходец получает по сюжету на Ярило-VI',
    march: 'Присоединяется на станции «Герта» в самом начале',
    danheng: 'Присоединяется на станции «Герта» в самом начале',
    arlan: 'Присоединяется на станции «Герта», если его уговорить',
    herta: 'Награда за квест «Виртуальная вселенная: Первичный тест»',
    hook: 'Присоединяется по сюжету в Подземье',
    natasha: 'Присоединяется по сюжету в Подземье',
    serval: 'Присоединяется по сюжету на Ярило-VI',
    kazuma: 'Присоединяется после события «Коносуба»'
  };

  const COLUMNS = [
    { id: 'dps', name: 'Урон' },
    { id: 'sub', name: 'Второй урон' },
    { id: 'amp', name: 'Усиление' },
    { id: 'sus', name: 'Выживание' }
  ];

  const MODES = [
    { id: 'hall', name: 'Зал забвения' },
    { id: 'boss', name: 'Боссы' },
    { id: 'su', name: 'Виртуальная вселенная' },
    { id: 'start', name: 'Начало игры' }
  ];

  const TIERS = [
    { id: 'T0', name: 'Т0', min: 0.95 },
    { id: 'T05', name: 'Т0.5', min: 0.8 },
    { id: 'T1', name: 'Т1', min: 0.68 },
    { id: 'T15', name: 'Т1.5', min: 0.6 },
    { id: 'T2', name: 'Т2', min: 0.52 },
    { id: 'T3', name: 'Т3', min: 0.42 },
    { id: 'T4', name: 'Т4', min: 0 }
  ];

  const TAGS = {
    spp: { name: 'ОН+', kind: 'good', text: 'Чаще даёт очки навыка, чем тратит' },
    spm: { name: 'ОН−', kind: 'bad', text: 'Тратит почти по очку навыка за ход' },
    dot: { name: 'Пер. урон', kind: 'info', text: 'Урон со временем: Горение, Шок, Кровотечение, Порыв ветра' },
    fua: { name: 'Доп. атаки', kind: 'info', text: 'Бьёт вне своего хода' },
    brk: { name: 'Пробитие', kind: 'info', text: 'Быстро снимает стойкость или выигрывает от пробития' },
    aoe: { name: 'По всем', kind: 'info', text: 'Основной урон по нескольким врагам' },
    extra: { name: 'Доп. ход', kind: 'info', text: 'Получает лишний ход или ввод' },
    hp: { name: 'Тратит HP', kind: 'info', text: 'Платит здоровьем за урон' },
    summon: { name: 'Помощник', kind: 'info', text: 'На шкале ходит свой помощник' },
    buff: { name: 'Усиление', kind: 'good', text: 'Повышает урон или атаку союзников' },
    debuff: { name: 'Ослабление', kind: 'good', text: 'Снижает защиту, скорость или сопротивление врагов' },
    adv: { name: 'Ускорение', kind: 'good', text: 'Двигает ход союзника вперёд' },
    delay: { name: 'Задержка', kind: 'good', text: 'Отодвигает ход врага' },
    energy: { name: 'Энергия', kind: 'good', text: 'Даёт энергию союзникам' },
    shield: { name: 'Щит', kind: 'good', text: 'Ставит щиты' },
    heal: { name: 'Лечение', kind: 'good', text: 'Лечит отряд' },
    taunt: { name: 'Провокация', kind: 'good', text: 'Притягивает удары врагов на себя' },
    revive: { name: 'Воскрешение', kind: 'good', text: 'Поднимает павших или не даёт упасть' },
    cc: { name: 'Контроль', kind: 'good', text: 'Замораживает, сковывает или заточает врагов' }
  };

  const SP_TAG = { plus: 0.2, minus: -0.8 };

  const ADJUST = [
    { id: 'megumin', mode: 'boss', col: 'dps', shift: 1, reason: 'Бот всегда копит три Напева перед Взрывом. Человек взрывает раньше, когда босс пробит, и выигрывает несколько циклов.' },
    { id: 'yu', mode: 'boss', col: 'dps', shift: 1, reason: 'Бот не планирует «Ещё раз!» на два хода вперёд и выбирает Персону только по числу уязвимых врагов. У человека лишних вводов больше.' }
  ];

  const TIER_LOG = [
    { date: '06.01.2001', text: 'Версия 1.6: девять новых героев в тир-листе, и все стенды прогнаны заново после переделки световых конусов. Цзинлю одна в Т0 «Урона» в Зале и делит его на боссах с Рацио, Лоча возглавил «Выживание», а Топаз на боссах обогнала Кафку во «Втором уроне». Зеле в Зале опустилась в Т2.' },
    { date: '20.11.2000', text: 'Все стенды прогнаны заново после выхода игры в Steam. Тиры почти не сдвинулись, Зеле по-прежнему одна в Т0 «Урона» в Зале.' },
    { date: '12.10.2000', text: 'Ярило-VI переделали. Боссов для стендов «Боссы» и «Начало игры» прогнали по новым данным.' },
    { date: '06.11.1999', text: 'Добавлен переключатель «без сигнатурного конуса». Без «В ночи» Зеле почти догоняют Химико и Сюэи.' },
    { date: '01.11.1999', text: 'Первый тир-лист по замерам: четыре колонки, четыре режима, все 53 персонажа версии 1.4.' }
  ];

  const ARCHETYPES = [
    { id: 'hyper', name: 'Гиперкэрри', text: 'Весь отряд работает на одного бойца: усиливает его, ослабляет врагов и держит его живым.' },
    { id: 'dot', name: 'Периодический урон', text: 'Горение, Шок, Кровотечение и Порыв ветра тикают на врагах, а Кафка подрывает их разом.' },
    { id: 'anomaly', name: 'Аномалии Секции 6', text: 'Мияби копит лёд, Янаги накладывает новые аномалии, и каждая новая вызывает Хаос: старые взрываются.' },
    { id: 'onemore', name: '«Ещё раз!»', text: 'Пробитие даёт лишний ввод, а когда пробиты все враги, отряд бьёт вместе.' },
    { id: 'axel', name: 'Отряд Казумы', text: 'Готовая четвёрка из Акселя со Слиянием на всех. Без Аквы не пройти Прототип Разрушителя.' },
    { id: 'break', name: 'Пробитие', text: 'Отряд быстро снимает стойкость и живёт за счёт пробития: урона, задержки и бонусов за пробитого врага.' },
    { id: 'chain', name: 'Цепочка атак', text: 'После каждого пробития союзник бьёт Цепочкой атак, а поле Николь снижает защиту врагов.' },
    { id: 'pairs', name: 'Пары со Слиянием', text: 'Отряды вокруг Слияния: двое или трое участников копят энергию и бьют вместе.' },
    { id: 'free', name: 'Бесплатный отряд', text: 'Только те, кто приходит по сюжету. Прыжки не нужны.' }
  ];

  const TEAMS = [
    { id: 'seele_wings', arch: 'hyper', name: 'Сломанные крылья', members: ['seele', 'bronya', 'silverwolf', 'lynx'], alts: { 1: ['hanya', 'tingyun', 'yukong'], 2: ['pela', 'ruanmei'], 3: ['natasha', 'bailu', 'gepard'] }, fear: 'Одному боссу без свиты: дополнительный ход Зеле получает только за убийство, и против одиночной цели он не повторяется.' },
    { id: 'yanqing_luofu', arch: 'hyper', name: 'Гости с Лофу', members: ['yanqing', 'tingyun', 'silverwolf', 'bailu'], alts: { 1: ['bronya', 'asta'], 2: ['pela', 'yukong'], 3: ['gepard', 'march'] }, fear: 'Любому урону по здоровью Яньцина: Единение пропадает, если удар прошёл мимо щита. Байлу лечит, но не закрывает щитом.' },
    { id: 'kafka_dot', arch: 'dot', name: 'Ночная смена', members: ['kafka', 'luka', 'guinaifen', 'yukiko'], alts: { 1: ['sampo', 'silverwolf'], 2: ['sampo', 'yanagi'], 3: ['lynx', 'bailu'] }, fear: 'Врагам, которые живут недолго: урон со временем тикает в начале хода врага и не успевает набраться.' },
    { id: 'kafka_hunters', arch: 'dot', name: 'Охотники за Стелларонами', members: ['kafka', 'silverwolf', 'blade', 'lynx'], alts: { 2: ['sampo', 'luka'], 3: ['bailu', 'natasha'] }, fear: 'Нехватке лечения: Блэйд тратит своё здоровье на атаки, и рядом нужен лекарь.' },
    { id: 'section6', arch: 'anomaly', name: 'Секция 6', members: ['miyabi', 'yanagi', 'nicole', 'yukiko'], alts: { 2: ['bronya', 'ruanmei'], 3: ['lynx', 'gepard'] }, fear: 'Врагам без наложенных аномалий: Хаос взрывает только то, что уже висит на враге.' },
    { id: 'inaba', arch: 'onemore', name: 'Следственная группа', members: ['yu', 'yosuke', 'chie', 'yukiko'], alts: { 1: ['rise'], 2: ['kanji'] }, fear: 'Врагам без уязвимостей к стихиям отряда: лишние ходы даёт только пробитие.' },
    { id: 'axel_party', arch: 'axel', name: 'Да будет благословенен этот мир', members: ['megumin', 'kazuma', 'aqua', 'darkness'], alts: {}, fear: 'Затяжным боям: после Взрыва Мегумин два хода без сил и притягивает удары.' },
    { id: 'xueyi_break', arch: 'break', name: 'Сёстры-судьи', members: ['xueyi', 'hanya', 'ruanmei', 'gepard'], alts: { 2: ['bronya', 'nicole'], 3: ['lynx', 'trail_p'] }, fear: 'Врагам без квантовой уязвимости: стойкость в обход уязвимости снимает только абсолютная техника Сюэи.' },
    { id: 'sushang_break', arch: 'break', name: 'Под аплодисменты', members: ['sushang', 'guinaifen', 'ruanmei', 'lynx'], alts: { 2: ['bronya', 'hanya'], 3: ['natasha', 'gepard'] }, fear: 'Врагам с крепкой стойкостью: доп. удар Стойки меча наверняка срабатывает только по пробитому врагу.' },
    { id: 'hares', arch: 'chain', name: '«Хитрые зайцы» в деле', members: ['anby', 'billy', 'nicole', 'lynx'], alts: { 3: ['natasha', 'bailu', 'gepard'] }, fear: 'Врагам без уязвимости к молнии, физике и кванту: Цепочка атак открывается только пробитием.' },
    { id: 'ccc', arch: 'pairs', name: 'Втроём веселее', members: ['makoto', 'talleah', 'amanda', 'bronya'], alts: { 3: ['ruanmei', 'silverwolf'] }, fear: 'Толпе одинаковых врагов: Макото бьёт сильнее всего врага с наибольшим HP, а гиноиды Таллеи только цель с Сигнатурой.' },
    { id: 'station', arch: 'pairs', name: 'Станция «Герта»', members: ['himeko', 'herta', 'asta', 'gepard'], alts: { 2: ['bronya', 'tingyun'], 3: ['march', 'lynx'] }, fear: 'Долгим боям с сильными ударами: в отряде нет лекаря, только щиты Гепарда.' },
    { id: 'landau', arch: 'pairs', name: 'Ландау в сборе', members: ['serval', 'gepard', 'lynx', 'pela'], alts: { 3: ['silverwolf', 'asta'] }, fear: 'Нетерпению: Слияние на троих требует полной энергии у всех троих сразу.' },
    { id: 'underworld', arch: 'pairs', name: 'Дети Подземья', members: ['clara', 'hook', 'natasha', 'pela'], alts: { 2: ['lynx', 'bailu'], 3: ['silverwolf', 'asta'] }, fear: 'Врагам, которые бьют не Клару: Сварог отвечает только на удары по ней.' },
    { id: 'free_express', arch: 'free', name: 'Поезд отправляется', members: ['danheng', 'march', 'natasha', 'arlan'], alts: { 3: ['hook', 'serval', 'herta'] }, fear: 'Сильным боссам: без конусов 5 звёзд и Прыжков урона мало, сначала поднимите уровни и реликвии.' },
    { id: 'free_hook', arch: 'free', name: 'Подземное братство', members: ['hook', 'natasha', 'herta', 'march'], alts: { 2: ['serval', 'arlan'] }, fear: 'Врагам без Горения: талант Хук бьёт и лечит только по горящим врагам.' }
  ];

  const BOT_NOTES = {
    natasha: 'Бот лечит, только когда у союзника меньше 60% HP. Человек лечит раньше перед сильным ударом.',
    bailu: 'Бот лечит навыком и абсолютной техникой, только когда у союзника меньше 60% HP.',
    lynx: 'Бот лечит навыком, только когда у союзника меньше 50% HP, а Реакцию выживания даёт танку при 4 очках навыка.',
    yukiko: 'Бот лечит навыком, только когда у союзника меньше 60% HP.',
    aqua: 'Бот воскрешает павших сразу, даже если выгоднее добить врага.',
    march: 'Бот ставит щит, только когда ни у кого нет щита и провокации.',
    gepard: 'Бот бьёт навыком только при 2 очках навыка и больше, а щит отряду ставит сразу, как накопит энергию.',
    bronya: 'Бот всегда даёт «Боевой приказ» союзнику с самой высокой атакой, а не тому, кто сейчас нужнее.',
    tingyun: 'Бот отдаёт энергию союзнику с наименьшей долей энергии, а не главному бойцу.',
    hanya: 'Бот даёт «Указ» союзнику с самой высокой атакой.',
    megumin: 'Бот всегда копит три Напева перед Взрывом.',
    yu: 'Бот выбирает Персону по числу уязвимых врагов и не планирует «Ещё раз!» на два хода вперёд.',
    kazuma: 'Бот связывает только обычных врагов, а крадёт, только если у врага есть усиление или щит.'
  };

  const BOSS_NOTES = {
    doomsday: 'Сначала волна Легиона, потом сам Зверь. Когда он копит антиматерию, пробейте его, и подготовка сорвётся.',
    gepard: 'Щит Гепарда пропадает при пробитии. Бейте огнём, физикой или ветром.',
    bp_bronya: 'Сначала три солдата, потом Броня. Она ходит со скоростью 120 и Огнём на подавление снижает скорость цели на 20%.',
    mine: 'Гризли наводит прицел на одного персонажа и следующим ходом бьёт Сокрушением на 300% атаки с уроном по соседям. Пробитие сбивает прицел, щит на цели спасает.',
    svarog: 'Сварог рассчитывает цель и следующим ходом бьёт электричеством на 280% атаки. Пробитие сбивает расчёт.',
    svarog1: 'Тот же расчёт цели, но бой короче.',
    svarog2: 'Подкрепление Дикого Огня держится до конца боя: атака отряда +30%, получаемый урон \u221215%.',
    rz_grizzly: 'Повторный бой с Гризли на 27 уровне. Прицел и рой те же.',
    s6_mimic: 'Чужой голос накладывает Сомнение: урон цели \u221220% на два хода. Крик потерянных бьёт весь отряд, его подготовку сбивает пробитие.',
    cor_echo: 'Без подготовок и призывов. Это бой на выносливость против льда.',
    gepard2: 'Гепард с двумя солдатами и без досрочного конца. Держите пробитие к Каре Среброгривых.',
    cocolia1: 'Коколия сопротивляется льду, физике и ветру. Ледяные и физические бойцы здесь слабее.',
    cocolia2: 'Первопроходец в этом бою всегда на Пути Сохранения. Копьё Вечной мерзлоты нацеливается на персонажа, и Гнев Зимы бьёт его сильнее остальных. Пробитие сбивает Копьё.',
    sec_boss: 'Клон живёт восемь своих ходов, потом рассыпается вместе со свитой, и бой засчитан. Щиты и лечение здесь важнее урона.',
    cx_echo_ochema: 'Две фазы. Лотосы Изобилия отнимают очки навыка, но, сбитые, возвращают по два. Во второй фазе Фантилия захватывает персонажа, и Лотосы Разрушения бьют Опустошением: пробейте или сбейте их до удара. Когда Фантилия падает, лотосы падают вместе с ней.',
    cx_echo_borehole: 'Две фазы. Скаракабаз размножается под панцирем, а во второй фазе копит рой три хода: пробейте его, пока он не закончил. Без срока жизни клона, как в Изолированной зоне, бой надо выиграть уроном.',
    ks_proto: 'Барьер голема пропускает урон только от Аквы, и только после её удара он лопается. Потом ноги режут урон до 35%, пока Мегумин не сломает их абсолютной техникой или Слиянием. Тогда Казума Кражей или Великой кражей вырывает ядро, и бой выигран. Без Аквы бой не пройти.'
  };

  const BOSS_NEED = { ks_proto: ['aqua', 'megumin', 'kazuma'] };

  return { ELEM_SET, PRESETS, CHARS, STD_CONE, EARLY_CONE, FREE, COLUMNS, MODES, TIERS, BOT_NOTES, TAGS, SP_TAG, ADJUST, TIER_LOG, SOURCE, ARCHETYPES, TEAMS, BOSS_NOTES, BOSS_NEED };
})();
