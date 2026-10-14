(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP105 = {
    id: '105', ROOMS: {}, ITEMS: {}, TALK: {}, LAYERS: {}, ACTOR_HOT: {},
    SAVE_KEY: 'sammax105_saves', SET_KEY: 'sammax105_settings',
    TITLE_MUSIC: 'title5', CREDITS_MUSIC: 'credits5'
  };
  const { ITEMS, TALK } = E;

  Object.assign(COLORS, { internet: C.sky[4], auntie: C.orchid[4], wizard: C.yellow[4], elf: C.slime[4], curt: C.gold[4], bob: C.lilac[4], bluster: C.red[4], chippy: C.mint[4], blog: C.pink[4], agent: C.stone[4], slime: C.sky[3], roach: C.oak[4], sybav: C.pink[4], pop: C.orange[4] });

  Object.assign(S.THEMES, {
    title5: { bpm: 138, style: 'surf', prog: ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E7'], mel: 'A4 . C5 E5 A5 . G5 E5 F5 . A5 . C6 . A5 . G5 . E5 . C5 . E5 . D5 . B4 . G4 . . . A4 . C5 E5 A5 . B5 C6 A5 . F5 . C5 . F5 . D5 . F5 . A5 . F5 . E5 . G#5 . B5 . E5 .' },
    reality: { bpm: 126, style: 'country', prog: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'], mel: 'E5 G5 C6 . B5 . G5 . D5 G5 B5 . A5 . G5 . C5 E5 A5 . G5 . E5 . F5 A5 C6 . A5 . F5 . E5 G5 C6 . E6 . D6 . B5 . G5 . D5 . G5 . A5 . F5 . C5 . F5 . D5 . G5 . B5 . D6 .' },
    muzak: { bpm: 92, style: 'lounge', prog: ['Cmaj7', 'Am7', 'Dm7', 'G7', 'Em7', 'A7', 'Dm7', 'G7'], mel: 'E5 . . . G5 . E5 . C5 . . . A4 . . . F5 . . . A5 . F5 . D5 . . . B4 . . . G5 . . . B5 . G5 . E5 . . . C#5 . . . F5 . . . E5 . D5 . B4 . . . . . . .' },
    control: { bpm: 108, style: 'industrial', prog: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'F', 'Gm', 'A7'], mel: 'D5 . . A4 D5 . . . F5 . . D5 F5 . . . Bb4 . . F5 D5 . . . E5 . . C5 G4 . . . D5 . . A4 D5 . F5 . A5 . . F5 C5 . . . D5 . . Bb4 G4 . . . E5 . C#5 . A4 . . .' },
    tavern: { bpm: 150, style: 'waltz', prog: ['Dm', 'Dm', 'C', 'C', 'Bb', 'C', 'Dm', 'A7'], mel: 'D5 . F5 . A5 . A5 . G5 . F5 . E5 . G5 . C5 . E5 . D5 . C5 . D5 . F5 . Bb5 . A5 . G5 . E5 . F5 . . . D5 . E5 . C#5 . A4 .' },
    cops: { bpm: 112, style: 'march', prog: ['F', 'Bb', 'F', 'C7', 'F', 'Bb', 'C7', 'F'], mel: 'C5 . F5 . A5 . F5 . D5 . F5 . Bb5 . . . C5 . F5 . A5 . C6 . G5 . E5 . C5 . . . C5 . F5 . A5 . F5 . D5 . G5 . Bb5 . D6 . C6 . Bb5 . G5 . E5 . F5 . . . . . . .' },
    battle5: { bpm: 172, style: 'surf', prog: ['Em', 'Em', 'D', 'C', 'Em', 'G', 'A', 'B7'], mel: 'E5 E5 G5 E5 B5 . A5 G5 E5 E5 G5 E5 A5 . G5 F#5 D5 D5 F#5 D5 A5 . G5 F#5 E5 . G5 . C5 . E5 . E5 E5 G5 B5 E6 . D6 B5 D5 D5 G5 B5 D6 . B5 G5 A5 . C#6 . E6 . A5 . B5 . D#5 . F#5 . B4 .' },
    bank5: { bpm: 96, style: 'lounge', prog: ['Fmaj7', 'Dm7', 'Gm7', 'C7', 'Am7', 'D7', 'Gm7', 'C7'], mel: 'A5 . . . F5 . C5 . D5 . . . F5 . . . G5 . . . Bb5 . G5 . E5 . . . C5 . . . A5 . . . C6 . A5 . F#5 . . . D5 . . . Bb5 . . . A5 . G5 . E5 . . . . . . .' },
    firewall: { bpm: 132, style: 'industrial', prog: ['Em', 'Em', 'C', 'D', 'Em', 'Am', 'B7', 'B7'], mel: 'E4 . . . B4 . . . G4 . . . E4 . . . C5 . . . B4 . A4 . F#4 . . . D4 . . . E5 . . . D5 . . . C5 . . . A4 . . . F#4 . . . A4 . B4 . D#5 . . . . . . .' },
    text15: { bpm: 66, style: 'creepy', prog: ['Em', 'C', 'Am', 'B7', 'Em', 'C', 'F#7', 'B7'], mel: 'B4 . . . G4 . . . E4 . . . . . . . C5 . . . B4 . A4 . F#4 . . . . . . . E5 . . . D5 . . . C5 . . . A4 . . . B4 . . . A#4 . . . B4 . . . . . . .' },
    credits5: { bpm: 122, style: 'swing', prog: ['F6', 'D7', 'Gm7', 'C7', 'F6', 'F7', 'Bb6', 'C7'], mel: 'C5 . F5 A5 . C6 . A5 F5 . D5 . A4 . . . G5 . Bb5 D6 . F6 . D6 C6 . . . G5 . . . F5 . A5 C6 . F6 . A6 G6 . Eb6 . C6 . A5 . Bb5 . D6 . F6 . D6 Bb5 A5 . G5 . F5 . . .' }
  });

  E.PASSWORD = 'БОСКО';
  E.PLATE = 'скф';
  E.SITE = 'bancolavadero.com';
  E.PAINTS = [
    { id: 'к', name: 'Красный', ramp: 'red' },
    { id: 'о', name: 'Оранжевый', ramp: 'orange' },
    { id: 'ж', name: 'Жёлтый', ramp: 'yellow' },
    { id: 'з', name: 'Зелёный', ramp: 'green' },
    { id: 'г', name: 'Голубой', ramp: 'sky' },
    { id: 'с', name: 'Синий', ramp: 'blue' },
    { id: 'ф', name: 'Фиолетовый', ramp: 'purple' }
  ];
  E.PAIR = { office: 'office2', street: 'street2', bosco: 'bosco2', sybil: 'sybil2', leftys: 'control' };
  E.REAL = {};
  for (const [a, b] of Object.entries(E.PAIR)) E.REAL[b] = a;
  E.VITEMS = ['coins', 'sword', 'slime', 'sword2', 'jack', 'paint'];
  E.RITEMS = ['goggles'];

  E.phone = function (g, text, color) {
    return g.say(null, text, { key: 'phone', color: color || COLORS.phone, x: 70, y: 110 });
  };

  E.tv = function (g, text, color) {
    return g.say(null, text, { key: 'tv', color: color || COLORS.tv, x: 160, y: 199 });
  };

  E.bug = function (g, text) {
    return g.say(null, text, { key: 'roachvoice', color: COLORS.roach });
  };

  E.net = function (g, text, mood) {
    const scr = g.room && g.room.netScreen;
    if (scr) return g.say(null, text, { key: 'internet', color: COLORS.internet, x: scr[0], y: scr[1] });
    const a = g.actors.internet;
    g.place('internet', g.roomId, Math.round(g.camX) + 160, 84, 's');
    a.v = mood || (g.f.infected ? 'sick' : '');
    a.visible = true;
    return g.say('internet', text);
  };

  E.body = function (g) {
    if (!g.f.vr) return '';
    const on = g.f.bugOn;
    return on === 'bob' ? 'small' : on === 'curt' ? 'flat' : on === 'bluster' ? 'light' : '';
  };

  E.applyBody = function (g) {
    const b = E.body(g);
    for (const id of ['sam', 'max']) {
      const a = g.actors[id];
      if (!a) continue;
      a.costume = b === 'flat' ? id + 'flat' : b === 'light' ? id + 'light' : id;
      a.scale = b === 'small' ? g.scaleAt(a.y) * 0.42 : null;
    }
  };

  E.setWorld = function (g, vr) {
    const f = g.f;
    const hide = vr ? E.RITEMS : E.VITEMS;
    const show = (vr ? f.vstash : f.rstash) || [];
    const out = g.inv.filter(id => hide.includes(id));
    g.inv = g.inv.filter(id => !hide.includes(id)).concat(show.filter(id => !g.inv.includes(id)));
    if (vr) { f.rstash = out; f.vstash = []; } else { f.vstash = out; f.rstash = []; }
    f.vr = !!vr;
    g.held = null;
  };

  E.coinCount = g => (g.f.coinAir ? 3 : 0) + (g.f.coinCloset ? 1 : 0) + (g.f.coinHole ? 1 : 0);

  E.addCoins = function (g) {
    if (!g.f.swordBought && !g.has('coins')) g.give('coins');
    g.sfx('chime');
  };

  E.toggle = function* (g) {
    const f = g.f;
    const to = f.vr ? E.REAL[g.roomId] : E.PAIR[g.roomId];
    if (!to) { yield g.say('sam', 'Сниму очки здесь и окажусь на крыше настоящей Сибил. Без лестницы и без объяснений.'); return; }
    const sam = g.actors.sam;
    const pos = { x: sam.x, y: sam.y, dir: sam.dir };
    g.sfx('flip');
    g.fx.flash = 0.8;
    yield g.fadeOut(5);
    E.setWorld(g, !f.vr);
    yield* g.goRoom(to, pos, { fade: 5, from: 'goggles' });
  };

  const BUG_TAPES = {
    sybilvr: [['sybil', 'Получай! И ты получай! Сорок первый уровень, мама! Ты говорила, что из меня ничего не выйдет!']],
    sybil: [['sybil', 'Никаких мужчин. Ни живых, ни мраморных. Только тесты. Тесты не говорят при всей стране, что видят тебя впервые.']],
    bosco: [['bosco', 'Я эльф. Я могучий эльф. Эльфов не грабят. У эльфов не висит маяк за табличкой «Скидка».']],
    boscoout: [['bosco', 'Сорок второй уровень. Ещё чуть-чуть, и дали бы плащ. Ничего. Миллиард тоже плащ, только без завязок.']],
    jimmy: [['jimmy', 'Пушка есть. Ядра есть. Покупателей нет. В пруду у Белого дома меня хотя бы кормили туристы.']],
    curt: [['curt', 'Запись дефис один. Мы полезны. Запись дефис два. Мы полезны. Контрольная сумма сошлась.']],
    bob: [['bob', 'Если вам одиноко, нажмите один. Если очень одиноко, оставайтесь на линии. Я тоже останусь.']],
    bluster: [['bluster', 'ИГРА ОКОНЧЕНА! ВСТАВЬ МОНЕТУ! Кто-нибудь. Пожалуйста.']],
    chippy: [['chippy', 'Пип. Пип-пип. Поп.']]
  };
  E.BUG_TAPES = BUG_TAPES;

  E.bugReplay = function* (g, rec) {
    for (const [who, text] of BUG_TAPES[rec] || []) {
      const a = g.actors[who];
      yield g.say(null, text, { key: 'bugplay', color: a ? a.color : COLORS.roach });
    }
    yield E.bug(g, 'Конец записи, сэр!');
  };

  E.bugPlant = function* (g, who, tape) {
    const roach = g.actors.roach;
    const a = g.actors[who];
    if (!a) return;
    const sam = g.actors.sam;
    yield g.say('sam', 'Сержант, задание прежнее: подползти и запомнить каждое слово.');
    yield E.bug(g, 'Есть, сэр!');
    g.drop('roach');
    g.place('roach', g.roomId, sam.x + 8, sam.y, 'e');
    roach.visible = true; roach.scripted = true;
    const ty = Math.max(a.y, sam.y - 30);
    yield g.walkTo('roach', a.x + 10, ty, { free: true, speed: 1.6 });
    roach.visible = false;
    yield 1.2;
    g.place('roach', g.roomId, a.x + 10, ty, 'w');
    roach.visible = true;
    yield g.walkTo('roach', sam.x + 6, sam.y, { free: true, speed: 1.6 });
    g.place('roach', 'nowhere', 0, 0);
    roach.scripted = false;
    g.give('roach');
    g.f.bugRec = tape || who;
    yield E.bug(g, 'Разведка завершена, сэр! Докладываю!');
    yield* E.bugReplay(g, g.f.bugRec);
  };

  function* bugLook(g) {
    if (g.f.vr) {
      yield g.say('sam', 'Сержант Жучок в цифровом виде. Квадратный и мигает зелёным. Здесь он программная ошибка.');
      yield E.bug(g, 'Готов ломать, сэр! Сажайте на любую программу, сэр! Она сама напросилась!');
      return;
    }
    const rec = g.f.bugRec;
    if (rec && BUG_TAPES[rec]) {
      yield g.say('sam', 'Сержант, что слышно?');
      yield* E.bugReplay(g, rec);
      return;
    }
    yield g.say('sam', 'Сержант Жучок. Подслушивающее устройство от Боско. Служит у нас третье дело подряд и до сих пор не просил отпуска.');
    yield E.bug(g, 'В отпуске скучно, сэр! Там некого подслушивать, сэр!');
  }

  const vr = (real, virt) => g => (g.f.vr ? virt : real);

  Object.assign(ITEMS, {
    max: { name: 'Макс', icon: 'max', look: function* (g) {
      yield g.say('sam', 'Макс. Президент Соединённых Штатов и мой напарник. Вторая должность ему даётся лучше.');
      yield g.say('max', 'Зато к первой прилагается печать! Я ставлю её на всё, что не убегает!');
    } },
    gun: { name: vr('Пистолет Сэма', 'Лучемёт'), icon: vr('gun', 'raygun5'), look: function* (g) {
      if (g.f.vr) yield g.say('sam', 'В этом мире мой револьвер стал лучемётом. Пластмассовый и говорит «пиу». Отдача пропала, а с ней и удовольствие.');
      else yield g.say('sam', 'Мой револьвер. Компьютерный кризис он не решит. Зато с любым отдельным компьютером справится.');
    } },
    roach: { name: vr('Жучок', 'Программный жучок'), icon: vr('roach', 'pixbug5'), look: function* (g) { yield* bugLook(g); } },
    glove: { name: 'Боксёрская перчатка', icon: 'glove', look: g => g.f.vr ? 'Перчатка Макса. Здесь на манжете появилась бирка «+0». Я догадывался, но читать это обидно.' : 'Боксёрская перчатка Макса. Пиперса она вылечила от гипноза одним ударом. С президента сняла голову целиком. Дозировку мы так и не подобрали.' },
    ratcannon: { name: 'Пушка с Джимми', icon: 'ratcannon5', look: function* (g) {
      yield g.say('sam', 'Пушка калибра «одна крыса». Заряжена Джимми. Он там ворочается и что-то бормочет про адвоката.');
      yield g.say('jimmy', 'Я всё слышу, начальник! За моральный ущерб возьму ядрами!');
    } },
    chip: { name: 'Микросхема', icon: 'vrchip5', look: 'Микросхема для очков. Чиппи спаял её за минуту и всю минуту ругался. Курт перевёл только предлоги.' },
    goggles: { name: 'Очки Реальности 2.0', icon: 'vrgoggles5', look: function* (g) {
      yield g.say('sam', 'Очки Реальности 2.0. Наденешь и попадёшь туда, снимешь и вернёшься. Остальным почему-то не хочется снимать.');
      yield g.say('max', 'У меня такие же, только с ремешком и уточкой! Детская модель! Я в ней неотразим!');
    } },
    binoc: { name: vr('Бинокль', 'Лупа'), icon: vr('binoc5', 'magnifier5'), look: g => g.f.vr ? 'Здесь бинокль Боско стал лупой. Оптику в этом мире округляют вниз.' : 'Бинокль Боско. Тяжёлый, армейский. Стёкла захватаны с обеих сторон.' },
    hanky: { name: vr('Простуда Боско', 'Компьютерная простуда'), icon: vr('snotrag5', 'netcold5'), look: function* (g) {
      if (g.f.vr) { yield g.say('sam', 'Насморк Боско в цифровом виде. Зелёная рожица с бантиком и красным носом. Шмыгает.'); return; }
      yield g.say('sam', 'Простуда «Боско-Тех». Носовой платок, в который чихнул Боско. Один миллиард долларов.');
      yield g.say('max', 'Сэм, он ещё тёплый! Это входит в цену?');
    } },
    coins: { name: g => 'Золотые монеты: ' + E.coinCount(g) + ' из 5', icon: 'goldcoins5', look: g => E.coinCount(g) >= 5 ? 'Пять золотых монет. Эльф Боско просит за меч ровно столько. Совпадение? Это игра, тут не бывает совпадений.' : 'Золотые монеты Реальности 2.0. У меня ' + E.coinCount(g) + ' из пяти. Звенят как настоящие и не весят ничего.' },
    sword: { name: 'Деревянный меч', icon: 'woodsword5', look: 'Деревянный длинный меч неимоверной длины. Длина и правда неимоверная. В остальном обычная палка с гардой и биркой «+0».' },
    slime: { name: 'Слизь слизи', icon: 'slimeslime5', look: function* (g) {
      yield g.say('sam', 'Слизь, которая осталась от синей слизи. Скользкая и холодная. Кажется, до сих пор обижена.');
      yield g.say('max', 'Смазка высшего сорта! Я бы намазал на тост!');
    } },
    sword2: { name: 'Меч +2', icon: 'plus2sword5', look: 'Меч +2. На клинке так и выбито: «+2». Чем он лучше меча +1, не знаю. Но на целую единицу.' },
    jack: { name: 'Попрыгунчик', icon: 'jackbox5', look: g => g.f.popOff ? 'Чёртик из коробки. Это он выпускает всплывающие окна. Сейчас окна запрещены, и он сидит тихо. Обдумывает.' : 'Чёртик из коробки. Окна разрешены, и из-под крышки лезет реклама казино Теда И. Бэра. Казино взлетело на воздух, а реклама осталась.' },
    paint: { name: 'Радужный набор', icon: 'paintkit5', look: ['Набор красок от Интернет-волшебника. Семь банок: красная, оранжевая, жёлтая, зелёная, голубая, синяя и фиолетовая. На коробке написано: «Для автомобилей и душ».', 'На крышках банок по букве. R, O, Y, G, B, I, V. Волшебник сказал, что цвета лежат по порядку.'] }
  });

  ITEMS.gun.on = {
    max: function* (g) { yield g.say('max', g.f.vr ? 'Пиу в меня! Хочу знать, какой я на просвет!' : 'Стреляй в воздух, Сэм! Это будет салют в честь меня!'); yield g.say('sam', 'Патроны казённые, Макс. Казна теперь твоя, так что береги сам.'); },
    '*': g => g.f.vr ? 'Луч тут ничего не изменит. Разве что подсветит.' : 'Стрелять по собственным вещам? У нас и так половина улик с дырками.'
  };
  ITEMS.max.on = {
    '*': function* (g) { yield g.say('max', 'Именем президента это конфисковано! Ладно, оставь себе. Мне лень нести.'); },
    glove: function* (g) { yield g.say('max', 'Моя перчатка! Она пахнет победой и Пиперсом!'); },
    roach: function* (g) { yield g.say('max', 'Сержант, назначаю тебя министром обороны!'); yield E.bug(g, 'Должность занята оловянным солдатиком, сэр! Он стойкий, сэр!'); },
    goggles: function* (g) { yield g.say('max', 'У меня свои! С ремешком! Если я упаду с велосипеда, они останутся на мне, а я нет!'); },
    hanky: function* (g) { yield g.say('max', 'Дай понюхать! Пахнет Боско и миллиардом!'); yield g.say('sam', 'Не нюхай платок, Макс. Президенту нельзя болеть, у тебя импичмент на этой неделе.'); },
    ratcannon: function* (g) { yield g.say('max', 'Можно я выстрелю? Я президент, у меня есть право на первый залп!'); yield g.say('jimmy', 'У меня есть право на адвоката!'); },
    coins: function* (g) { yield g.say('max', 'Золото! Сэм, давай заберём его домой и обвалим экономику!'); yield g.say('sam', 'Оно нарисованное, Макс.'); yield g.say('max', 'Доллары тоже!'); },
    slime: function* (g) { yield g.say('max', 'Она шевелится! Сэм, можно я буду звать её Государственным секретарём?'); },
    sword: function* (g) { yield g.say('max', 'Дай подержать! Я рыцарь! Я король! Я уже президент, мне мало!'); },
    sword2: function* (g) { yield g.say('max', 'Плюс два! Сэм, а где мой плюс? Я хочу быть Макс плюс восемь!'); },
    jack: function* (g) { yield g.say('max', 'Он выскакивает и пугает людей рекламой. Сэм, это же я, только в коробке.'); },
    paint: function* (g) { yield g.say('max', 'Покрась меня в радугу! Хью говорил, что внутри я тёмный. Пусть хоть снаружи будет весело!'); yield g.say('sam', 'Краска для автомобилей, Макс. Ты пока не автомобиль.'); },
    binoc: function* (g) { yield g.say('max', 'Посмотри на меня через другой конец! Я стану ещё меньше и ещё опаснее!'); }
  };
  ITEMS.glove.on = {
    roach: function* (g) { yield E.bug(g, 'Своих не бьют, сэр! Это в уставе, сэр! Сразу после подъёма!'); },
    gun: 'Перчатка и револьвер. Два способа закончить разговор. Сегодня мне мало обоих.'
  };
  ITEMS.chip.on = {
    goggles: 'Очки уже починены. Микросхема была одна.',
    roach: function* (g) { yield E.bug(g, 'Электроника, сэр! Не моя специальность! Я органический!'); }
  };
  ITEMS.hanky.on = {
    roach: function* (g) { yield E.bug(g, 'Уберите, сэр! У меня иммунитет, но мне противно!'); },
    gun: g => g.f.vr ? 'Зарядить лучемёт простудой? Луч чихнёт, и насморк достанется мне.' : 'Револьвер в платок я не сморкаю. У него тонкая механика.',
    glove: 'Перчатку платком вытирать не стану. Платок стоит миллиард, перчатка бесплатная.'
  };
  ITEMS.slime.on = {
    sword: 'Смазывать деревянный меч? Он и так скользит мимо цели.',
    gun: 'Лучемёту смазка ни к чему. В нём нет ни одной настоящей детали.',
    jack: 'Намазать пружину слизью? Чёртик вылетит и не вернётся. Рекламе нужен поводок.'
  };
  ITEMS.coins.on = {
    sword: 'Меч куплен. Сдачи эльфы не дают.',
    jack: 'В коробке нет щели для монет. Рекламу показывают бесплатно, в этом весь ужас.'
  };
  ITEMS.paint.on = {
    sword: 'Красить меч? Он деревянный, ему пойдёт. Но на коробке написано: «Для автомобилей и душ».',
    sword2: 'Меч +2 красить нельзя. Закрасишь плюс, и останется двойка.',
    jack: 'Раскрасить чёртика? Он и так пёстрый. Блёклой рекламы не бывает.'
  };

  const both = (real, virt) => g => (g.f.vr ? virt : real);

  E.GENERIC = {
    look: [both('Ничего, что тянуло бы на компьютерный кризис.', 'Нарисовано. Причём лучше, чем настоящее.'), both('Оно, к счастью, не мигает.', 'Вещь версии 2.0. Что исправили, не сказано.'), both('Обычная вещь. Без проводов, без экрана. Таким я доверяю.', 'Пиксели на месте. Все до одного.'), both('Улик нет. Электричества тоже.', 'Здесь всё чуть ярче, чем надо. Это тоже.')],
    use: [both('Не знаю, что с этим делать. Макс знает, но я не спрошу.', 'Ничего. Наверное, эту функцию обещали в следующей версии.'), both('Трогать не буду. Сегодня всё, что трогаешь, норовит подключиться.', 'Не работает. В бете так и положено.'), both('Нет. Случай неподходящий.', 'Нет отклика. Либо оно для красоты, либо я для красоты.'), both('Ничего не вышло. Значит, оно исправно.', 'Программа делает вид, что меня нет.')],
    talk: [both('Молчит. Хоть кто-то сегодня молчит.', 'Не отвечает. У него нет учётной записи.'), both('Ответа нет. Предметы у нас разговаривают только по телевизору.', 'Тишина. Даже рекламы нет. Подозрительно.'), both('Не отвечает. Поговорю с тем, у кого есть рот или динамик.', 'Молчит. Для этого мира редкое качество.')],
    useItem: [both('Одно с другим не вяжется.', 'Несовместимые версии.'), both('Попробовать можно. Толку не будет.', 'Так нельзя. Наверное, запрещено соглашением, которое я не читал.'), both('Нет. Даже Макс бы удивился.', 'Не выходит. Бета.'), both('Это кончится рапортом.', 'Игра на такое не рассчитана.')],
    items: {
      gun: [both('Стрелять в это? Компьютеры и так напуганы.', 'Пиу. Луч прошёл насквозь и ничего не задел. Даже самолюбие.'), both('Пуля тут ничего не решит. Разве что вопрос, где я ночую.', 'Лучемёт мигает и пишет: «Цель не найдена».'), both('Не буду. Патроны казённые, а казна у Макса.', 'Лучом тут не поможешь. Он декоративный.')],
      max: [function* (g) { yield g.say('max', g.f.vr ? 'Оно нарисованное! Нарисованное я не кусаю. От него изжога.' : 'Оно не взрывается и не голосует. Неинтересно.'); }, function* (g) { yield g.say('max', 'Поручи это вице-президенту, Сэм. Я занят тем, что смотрю.'); }, function* (g) { yield g.say('max', 'Не трону. У меня сегодня рейтинг.'); }],
      roach: [function* (g) { yield E.bug(g, g.f.vr ? 'Это не программа, сэр! Ломать нечего, сэр!' : 'Объект молчит, сэр! Слушать нечего, сэр!'); }, function* (g) { yield E.bug(g, 'Отказываюсь, сэр! Тактически бессмысленно!'); }],
      glove: [both('Бить это перчаткой? У перчатки есть кодекс.', 'Перчатка +0. Здесь такое никого не впечатляет.'), both('Гипноза тут нет. Бить незачем.', 'Оно даже не покачнулось. Нарисовано на совесть.')],
      goggles: [function* (g) { yield* E.toggle(g); }],
      ratcannon: ['Джимми у меня один. Тратить его на это жалко.', 'Заряд у пушки один, и он грозит мне судом.'],
      chip: ['Сюда её не вставить. Разъёма нет, а паять я умею только показания.'],
      binoc: [both('Вблизи оно такое же, только больше.', 'Под лупой одни пиксели. Каждый в отдельности довольно милый.'), both('В бинокль разглядывают то, что далеко. Это близко.', 'Лупа показывает то же самое, только крупнее и честнее.')],
      hanky: [both('Вытирать это платком за миллиард? Слишком дорогая уборка.', 'Чихать на это бесполезно. Оно ни с кем не переписывается.'), both('Насморк Боско на это не подействует. Оно не дышит.', 'Сюда чих не дойдёт. У этого нет адреса.')],
      coins: ['Монетами тут не расплатишься. Золото нарисованное, и оно об этом знает.', 'Бросить монету? Я не в фонтане.'],
      sword: ['Рубить это деревянным мечом? Останутся занозы, причём у меня.', 'Меч +0. Он вежливо стучит, и всё.'],
      sword2: ['Меч +2 на это жалко. Каждый взмах снимает с него позолоту.', 'Воздух получил урон 2. Сопротивления не оказал.'],
      slime: ['Тут и без слизи всё идёт как по маслу. То есть никак.', 'Намазать это слизью? Оно и без того скользкое.'],
      jack: ['Чёртик тут никого не напугает.', 'Чёртик выскочит, а окна потом закрывать мне.'],
      paint: ['Краска автомобильная. Это не автомобиль.', 'Красить это? Оно и так режет глаза.']
    }
  };

  E.ACTOR_HOT.max = {
    name: 'Макс', walk: null,
    look: [both('Макс. Кролик-нечто и президент. Импичмент ему объявляют трижды в неделю, а он думает, что это приглашения.', 'Макс в Реальности 2.0. Точно такой же. Улучшать было нечего, или программа побоялась.'), both('Макс. Репетирует обращение к нации. Пока готово одно слово, и оно «ха».', 'Макс. Пробует укусить пиксель. Пиксель держится.')],
    talk: function* (g) { yield g.talkTo('max'); },
    use: function* (g) { yield g.say('max', 'Щекотно! Президентов не щекочут! Их свергают!'); },
    items: {
      gun: function* (g) { yield* ITEMS.gun.on.max(g); },
      glove: function* (g) { yield* ITEMS.max.on.glove(g); },
      roach: function* (g) { yield* ITEMS.max.on.roach(g); },
      goggles: function* (g) { yield* E.toggle(g); },
      hanky: function* (g) { yield* ITEMS.max.on.hanky(g); },
      ratcannon: function* (g) { yield* ITEMS.max.on.ratcannon(g); },
      coins: function* (g) { yield* ITEMS.max.on.coins(g); },
      slime: function* (g) { yield* ITEMS.max.on.slime(g); },
      sword: function* (g) { yield* ITEMS.max.on.sword(g); },
      sword2: function* (g) { yield* ITEMS.max.on.sword2(g); },
      jack: function* (g) { yield* ITEMS.max.on.jack(g); },
      paint: function* (g) { yield* ITEMS.max.on.paint(g); },
      binoc: function* (g) { yield* ITEMS.max.on.binoc(g); },
      '*': function* (g) { yield g.say('max', 'Подарок главе государства? Клади в общую кучу. Куча у меня в шляпе Сэма.'); }
    }
  };

  E.ACTOR_HOT.sam = {
    name: 'Сэм', walk: null,
    look: [both('Это я. Шляпа на месте, под шляпой дуршлаг. Гипнозу сегодня опять не повезёт.', 'Это я, только нарисованный. Шляпа на месте. Дуршлаг под ней, видимо, тоже нарисовали.'), both('Я. Пёс в костюме. При президенте состою кем-то вроде совести, на полставки.', 'Мой аватар. Костюм сидит лучше, чем в жизни. Вот за это люди и не снимают очки.')],
    talk: both('Говорить с собой буду дома. Там хотя бы не записывают.', 'Говорить с собой в сети опасно. Кто-нибудь ответит.'),
    use: both('Галстук на месте. Кризис кризисом, а узел должен быть ровным.', 'Нарисованный галстук поправляется с задержкой. Связь.'),
    items: {
      gun: both('Нет. Я себе ещё пригожусь.', 'Пиу в себя? Узнаю свой уровень. Не хочу его знать.'),
      glove: 'Бить себя по голове рано. Гипноза на мне нет, дуршлаг держит.',
      goggles: function* (g) { yield* E.toggle(g); },
      roach: function* (g) { yield E.bug(g, g.f.vr ? 'На вас не сяду, сэр! Сломаетесь, а мне отвечать!' : 'Своих не слушаю, сэр! Устав, сэр!'); },
      hanky: both('Сморкаться в платок за миллиард я не стану. У меня есть рукав.', 'Чихать на самого себя? У меня нет почтового ящика. И не надо.'),
      binoc: both('В бинокль видно мои ботинки. Ботинок у меня нет, так что это лапы, только крупно.', 'Под лупой я состою из квадратиков. Подозревал.'),
      coins: 'Монета зависает в воздухе, думает и падает той стороной, какой захотела.',
      sword: 'Рыцарь из меня выйдет, но шляпу на шлем я не сменю.',
      sword2: 'С мечом +2 я чувствую себя на две единицы увереннее.',
      slime: 'Мазать себя слизью не буду. Макс потом не отлипнет.',
      paint: 'Красить себя в радугу? Хью Блисс был бы доволен. Это и останавливает.',
      jack: 'Чёртик выскочил, я моргнул. Ничья.',
      max: function* (g) { yield g.say('max', 'Обнимашки!'); yield g.say('sam', 'Ты отменил обязательные объятия, Макс. Своим первым указом.'); yield g.say('max', 'Обязательные отменил! А это от души!'); },
      '*': 'Мне это ни к чему.'
    }
  };

  function coinHint(g) {
    const f = g.f, body = E.body(g);
    if (!f.controlSeen) return 'Правила этого мира держат К.О.П.С. Их зал управления стоит там, где у нас прокат Лефти. Сходи посмотри, что у них можно сломать!';
    if (body === 'light' && !f.coinAir) return 'Гравитация ослабла! Прыгай за тремя монетами! Они висят над тротуаром возле Де Сото!';
    if (body === 'flat' && !f.coinCloset) return 'Мы плоские! Лезь под дверь кладовки у Сибил 2.0, оттуда светит золотом!';
    if (body === 'small' && !f.coinHole) {
      if (g.roomId === 'office2') return 'Мы маленькие! Лезь в нору Джимми!';
      if (g.roomId === 'office') return 'Надевай очки прямо тут! Внутри мы всё ещё маленькие!';
      if (f.vr) return 'Ступенька нашего офиса выше нас! Сними очки, зайди в офис по-настоящему, а очки надень уже внутри!';
      return 'Иди в наш настоящий офис и надень очки там! Внутри мы всё ещё маленькие!';
    }
    const put = f.bugOn ? 'Пересади жучка' : 'Посади жучка';
    if (!f.coinAir) return 'Три монеты висят над тротуаром у Де Сото. ' + put + ' на Бластера в жёлтой трубе, он держит гравитацию, и прыгай!';
    if (!f.coinCloset) return 'Из кладовки у Сибил 2.0 светит золотом, а дверь заперта. ' + put + ' на Курта в синей трубе! Станем плоскими и пролезем под дверь!';
    if (!f.holeSeen) return 'Загляни в наш офис в Реальности 2.0! Джимми там что-то прячет!';
    return 'Монета лежит в норе Джимми в офисе 2.0. ' + put + ' на Боба в фиолетовой трубе! Станем маленькими и влезем в нору!';
  }

  function payHint(g) {
    const f = g.f;
    if (!f.knowBank) return f.boscoOut ? 'Спроси настоящего Боско, как ему заплатить!' : 'Спроси эльфа Боско, как ему платят в этом мире!';
    if (!f.passKnown) {
      if (!f.boscoOut) return f.vr ? 'Пароль наколот на настоящем Боско, а он не снимает очки. Выбей его из Реальности 2.0! Стукни эльфа мечом!' : 'Пароль наколот на Боско, а он в очках и не оборачивается. Надень очки и стукни его эльфа мечом, он вылетит оттуда!';
      if (!g.has('binoc')) return f.vr ? 'Сними очки! Настоящий Боско теперь без очков, а на прилавке у него лежит бинокль!' : 'Крикни Боско «Сзади!» и хватай бинокль с прилавка, пока он смотрит назад!';
      return f.vr ? 'Сними очки и крикни настоящему Боско «Сзади!». Пока он стоит спиной, наводи бинокль!' : 'Крикни Боско «Сзади!» и, пока он стоит спиной, наведи на него бинокль!';
    }
    if (!f.paintGot) return 'Попроси Интернет-волшебника показать фокус! Он висит в конце улицы 2.0, за лавкой Боско.';
    if (f.car !== E.PLATE) return f.fwSeen ? 'Буквы на номере значат цвета! У нас «СКФ»: синий нос, красная середина, фиолетовый хвост. Крась Де Сото радужным набором!' : 'Садись в Де Сото 2.0 и езжай на bancolavadero.com!';
    return 'Езжай на bancolavadero.com и перегони миллиард на счёт Боско! Пароль: «БОСКО»!';
  }

  function auntieHint(g) {
    const f = g.f;
    if (!f.sword2Got) {
      if (!f.roofSeen) return E.body(g) === 'light' ? 'Гравитация слабая! Прыгай на рекламный щит над конторой Сибил, там торчит меч +2!' : 'Броню тётушки пробьёт только меч +2. Он торчит в щите над конторой Сибил. Убавь гравитацию жучком на Бластере и прыгай!';
      if (!f.slimeGot) return 'Меч застрял в щите. Нужна смазка! Наруби слизи в таверне Боско 2.0: нажми кнопку на автомате и бей слизь деревянным мечом!';
      return E.body(g) === 'light' ? 'Прыгай на щит над конторой Сибил и мажь меч слизью!' : 'Слизь у нас! Убавь гравитацию, прыгай на щит и мажь меч!';
    }
    if (!f.jackTaken) return f.popOff ? 'Окна выключены! Хватай попрыгунчика у двери зала управления!' : 'Тётушка бьёт первой. Нужен щит! У двери зала управления стоит попрыгунчик, но к нему не подойти из-за окон. Выключи всплывающие окна кнопкой Чиппи в зелёной трубе!';
    if (f.popOff) return 'Попрыгунчик без окон не защитит! Включи всплывающие окна обратно кнопкой Чиппи!';
    return 'Нападай на тётушку Биотик! Сначала защищайся попрыгунчиком, потом бей мечом +2!';
  }

  function vrHint(g) {
    const f = g.f;
    if (!f.knowCold) return f.vr ? 'Этот мир пора выключать, только нечем. Спроси Боско, чем он торгует! Хоть эльфа, хоть настоящего!' : 'Спроси Боско, чем он торгует! У него на каждый кризис свой товар!';
    if (!f.swordBought) {
      if (!f.elfMet) return 'Зайди в лавку Боско в Реальности 2.0! Там он эльф, и у эльфа свой товар!';
      if (E.coinCount(g) < 5) return coinHint(g);
      return 'Пять монет в кармане! Купи у эльфа Боско деревянный меч!';
    }
    if (!f.paid) return payHint(g);
    if (!g.has('hanky') && !f.coldGot) return f.vr ? 'Миллиард на счету Боско! Сними очки и забери его простуду!' : 'Миллиард на счету Боско! Поговори с ним и забери простуду!';
    if (!f.auntieGone) return auntieHint(g);
    return f.vr ? 'Тётушки нет! Бросай простуду Боско в почтовый ящик у дерева!' : 'Надевай очки и бросай простуду Боско в почтовый ящик у дерева!';
  }

  function maxHint(g) {
    const f = g.f;
    if (!f.caseOpen) return 'Телефон, Сэм! Вдруг мне объявляют войну! Я давно жду!';
    if (!f.sybilFree) {
      if (g.has('ratcannon')) return 'Пушка у нас! Пали из неё по Сибил! Целься в очки!';
      if (!f.sybilSeen) return 'Комиссар сказал: самая сильная волна идёт с нашей улицы. Обойдём соседей! Начни с Сибил!';
      if (!f.gloveTried) return g.has('glove') ? 'Сибил под гипнозом! Стукни её моей перчаткой!' : 'Сибил под гипнозом, а гипноз лечат перчаткой! Перчатка висит у нас в шкафу, на гвозде под пистолетом!';
      return f.jimmyMet ? 'Тронь пушку Джимми! Он выстрелит и полезет заряжать. Пока он возится с ядром, хватай его самого!' : 'К Сибил не подойти, она машет руками. Нужно что-то дальнобойное! У Боско на столике сидит Джимми с пушкой!';
    }
    if (!f.knowCops && !g.seen.cops) return 'Спроси Сибил, на кого она работает!';
    if (!f.gogglesFixed) {
      if (g.has('chip')) return 'Вставь микросхему в очки Сибил! Они лежат у неё на диване!';
      return g.seen.cops ? 'Спроси железки, чья работа этот кризис, и скажи, что мы хотим попробовать их реальность! Пусть чинят очки!' : 'Сибил работает на каких-то К.О.П.С. Они сидят в прокате Лефти, в тупике слева от её конторы. Зайдём и спросим строго!';
    }
    return vrHint(g);
  }

  const MAX_GAGS = [
    'Сэм, если Интернет живой, у него есть шея? Я бы хотел знать заранее.',
    'Я придумал пароль, который никто не взломает. Я его уже забыл. Вот насколько он хорош!',
    'В Реальности 2.0 у меня столько же зубов, сколько здесь. Я пересчитал. Обидно.',
    'Знаешь, чем плох импичмент? На нём не кормят.',
    'Мне скучно, Сэм. Давай объявим войну чему-нибудь маленькому. Например, четвергу.'
  ];
  const DECREES = [
    'Указ! С этой минуты Интернет обязан стучаться, прежде чем войти!',
    'Указ! Все пароли в стране заменить на слово «Макс»! Так мне легче запомнить!',
    'Указ! Компьютерам запрещается быть умнее президента! Срок на исправление: вчера!',
    'Указ! Псу в шляпе выдать орден! Орден я съел, так что выдаю устно!'
  ];

  TALK.max = {
    options: g => [
      { id: 'hint', icon: 'q', text: 'Макс, есть идеи, что делать дальше?', run: function* (gg) { yield gg.say('max', gg.room && gg.room.maxHint ? gg.room.maxHint(gg) : maxHint(gg)); } },
      { id: 'how', icon: 'duck', text: 'Как настроение, Макс?', run: function* (gg) { yield gg.say('max', MAX_GAGS[(gg.count('maxgag') - 1) % MAX_GAGS.length]); } },
      { id: 'decree', icon: 'decree5', text: 'Издай какой-нибудь указ.', run: function* (gg) {
        const n = (gg.count('decree') - 1) % DECREES.length;
        gg.sfx('stamp');
        yield gg.say('max', DECREES[n]);
        if (n === 3) yield gg.say('sam', 'Служу президенту. Устные ордена хотя бы не надо чистить.');
      } },
      { id: 'case', icon: 'badge', text: 'Что ты думаешь о нашем деле?', when: gg => gg.f.caseOpen, run: function* (gg) {
        const f = gg.f;
        if (!f.sybilFree) yield gg.say('max', 'Компьютеры сошли с ума, и все вокруг в очках. Сэм, это первый кризис, в котором виноват не я!');
        else if (!f.gogglesFixed) yield gg.say('max', 'Старые железки гипнотизируют город. Я их понимаю. Меня тоже никто не хотел обновлять.');
        else if (!f.paid) yield gg.say('max', 'Там всё красивое и ненастоящее. Как мои предвыборные обещания. Ломать будет приятно!');
        else yield gg.say('max', 'Мы пошлём Интернету насморк Боско. По почте! Мой первый настоящий акт внешней политики!');
      } },
      { id: 'bye', icon: 'bye', text: 'Работаем, господин президент.', end: true }
    ]
  };

  E.maxHint = maxHint;

  E.newGame = function (g) {
    g.vt = {};
    g.addActor('sam', { name: 'Сэм', color: COLORS.sam, speed: 62, stride: 34 });
    g.addActor('max', { name: 'Макс', color: COLORS.max, speed: 70, stride: 26, follow: 'sam' });
    g.addActor('jimmy', { name: 'Джимми Два Зуба', costume: 'jimmy5', color: COLORS.jimmy, speed: 60, stride: 12, scale: 1.25 });
    g.addActor('bosco', { name: 'Эльбоскодрил', costume: 'bosco5', color: COLORS.bosco });
    g.addActor('sybil', { name: 'Сибил', costume: 'sybil5', color: COLORS.sybil, speed: 84, stride: 26 });
    g.addActor('curt', { name: 'Курт 286', costume: 'copcurt', color: COLORS.curt, scale: 1 });
    g.addActor('bob', { name: 'Боб Белл', costume: 'copbob', color: COLORS.bob, scale: 1 });
    g.addActor('bluster', { name: 'Бластер-Бахвал', costume: 'copbluster', color: COLORS.bluster, scale: 1 });
    g.addActor('chippy', { name: 'Чиппи', costume: 'copchippy', color: COLORS.chippy, scale: 1 });
    g.addActor('internet', { name: 'Интернет', costume: 'internet', color: COLORS.internet, scale: 1, z: 900 });
    g.addActor('elf', { name: 'Эльбоскодрил', costume: 'elfav', color: COLORS.elf, scale: 1 });
    g.addActor('sybav', { name: 'Сибил 2.0', costume: 'sybav', color: COLORS.sybav, scale: 1 });
    g.addActor('auntie', { name: 'Тётушка Биотик', costume: 'auntie', color: COLORS.auntie });
    g.addActor('wizard', { name: 'Интернет-волшебник', costume: 'netwiz', color: COLORS.wizard, scale: 1 });
    g.addActor('slime', { name: 'Грозная синяя слизь', costume: 'slime5', color: COLORS.slime, scale: 1 });
    g.addActor('roach', { name: 'Жучок', costume: 'roach', color: COLORS.roach, speed: 70, stride: 8, scale: 1 });
    g.inv = ['max', 'gun', 'roach'];
    g.f.car = '---';
    g.f.bugOn = '';
    g.place('sam', 'office', 150, 166, 's');
    g.place('max', 'office', 84, 150, 'e');
    g.place('jimmy', 'bosco', 60, 123, 'e');
    g.place('bosco', 'bosco', 250, 150, 's');
    g.place('sybil', 'sybil', 248, 170, 'w');
    g.place('curt', 'leftys', 88, 150, 's');
    g.place('bob', 'leftys', 136, 148, 's');
    g.place('bluster', 'leftys', 184, 150, 's');
    g.place('chippy', 'leftys', 226, 152, 's');
    g.place('internet', 'nowhere', 0, 0, 's');
    g.place('elf', 'bosco2', 250, 150, 's');
    g.place('sybav', 'sybil2', 262, 150, 'w');
    g.place('auntie', 'street2', 486, 153, 'w');
    g.place('wizard', 'street2', 712, 136, 'w');
    g.place('slime', 'nowhere', 0, 0, 'e');
    g.place('roach', 'nowhere', 0, 0, 'e');
    g.actors.internet.visible = false;
    g.actors.sybil.v = 'vr';
    g.actors.bosco.v = 'vr';
  };

  E.afterLoad = function (g) {
    E.applyBody(g);
    const room = g.room;
    if (room && room.onLoad) room.onLoad(g);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
