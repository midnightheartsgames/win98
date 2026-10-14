(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP201 = {
    id: '201', ROOMS: {}, ITEMS: {}, TALK: {}, LAYERS: {}, ACTOR_HOT: {},
    SAVE_KEY: 'sammax201_saves', SET_KEY: 'sammax201_settings',
    TITLE_MUSIC: 'title21', CREDITS_MUSIC: 'credits21'
  };
  const { ITEMS, TALK } = E;

  Object.assign(COLORS, {
    lincoln: C.sand[4], roach: C.oak[4], curt: C.gold[4], bob: C.lilac[4], bluster: C.red[4], chippy: C.mint[4], leonard: C.rose[4], narr: C.grey[5],
    robot21: C.neonA, flint21: C.sand[3], stinky21: C.teal[4], santa21: C.red[4], elfr21: C.orange[4], elfg21: C.green[4], demon21: C.sky[4],
    gpast21: C.pink[4], gpres21: C.gold[4], gfut21: C.grey[4], mary21: C.rose[3], yjimmy21: C.cream[4], timmy21: C.pink[3], fsam21: C.orange[2], fmax21: C.grey[5], pedro21: C.yellow[4], record21: C.lilac[3]
  });

  Object.assign(S.THEMES, {
    title21: { bpm: 132, style: 'fanfare', prog: ['C', 'Am', 'F', 'G7', 'C', 'Am', 'Dm7', 'G7'], mel: 'E5 . G5 . C6 . G5 . A5 . G5 . E5 . C5 . F5 . A5 . C6 . A5 . G5 . . . B5 . D6 . E5 . G5 . C6 . E6 . D6 . C6 . A5 . E5 . F5 . A5 . D6 . C6 . B5 . G5 . . . . .' },
    robot21: { bpm: 96, style: 'industrial', prog: ['Em', 'Em', 'C', 'B7', 'Em', 'Am', 'B7', 'B7'], mel: 'E4 . . . E4 . G4 . B4 . . . A4 . G4 . C5 . . . B4 . A4 . F#4 . . . D#4 . B3 . E4 . . . G4 . B4 . A4 . . . C5 . E5 . D#5 . . . B4 . F#4 . B4 . . . . . . .' },
    pole21: { bpm: 126, style: 'waltz', prog: ['F', 'Dm', 'Bb', 'C7', 'F', 'Gm', 'C7', 'F'], mel: 'A4 . . C5 . . D5 . . F5 . . D5 . C5 . Bb4 . G4 . . . . . A4 . . C5 . F5 G5 . . F5 . D5 E5 . . G5 . . F5 . . . . .' },
    workshop21: { bpm: 120, style: 'march', prog: ['C', 'G7', 'C', 'F', 'C', 'G7', 'C', 'C'], mel: 'C5 . E5 . G5 . E5 . D5 . F5 . B4 . G4 . C5 . E5 . G5 . C6 . A5 . . . F5 . . . E5 . G5 . C6 . G5 . F5 . D5 . B4 . G4 . C5 . G4 . E4 . G4 . C5 . . . . . . .' },
    santa21: { bpm: 76, style: 'creepy', prog: ['Dm', 'A7', 'Dm', 'Gm', 'Dm', 'Bb', 'A7', 'A7'], mel: 'D5 . . . F5 . . . E5 . . . C#5 . . . D5 . . . A4 . . . Bb4 . . . G4 . . . A4 . . . D5 . . . F5 . . . D5 . Bb4 . A4 . . . E5 . . . C#5 . . . . . . .' },
    diner21: { bpm: 140, style: 'country', prog: ['G', 'C', 'G', 'D7', 'G', 'C', 'D7', 'G'], mel: 'B4 . D5 . G5 . D5 . E5 . G5 . E5 . C5 . D5 . B4 . G4 . B4 . A4 . C5 . F#5 . D5 . G5 . . . B4 . D5 . C5 . E5 . G5 . E5 . D5 . F#5 . A5 . F#5 . G5 . . . . . . .' },
    garage21: { bpm: 168, style: 'surf', prog: ['Am', 'Am', 'F', 'G', 'Am', 'Am', 'F', 'E7'], mel: 'A4 A4 C5 A4 E5 . C5 A4 G4 G4 B4 G4 D5 . B4 G4 F4 F4 A4 C5 F5 . E5 C5 D5 . B4 . G4 . B4 . A4 A4 C5 E5 A5 . G5 E5 C5 C5 E5 G5 A5 . . . F5 . E5 . D5 . C5 . B4 . G#4 . E4 . . .' },
    ring21: { bpm: 124, style: 'tango', prog: ['Am', 'Dm', 'E7', 'Am', 'F', 'Dm', 'E7', 'E7'], mel: 'E5 . . E5 A5 . G#5 . F5 . . D5 A4 . . . B4 . . B4 E5 . D5 . C5 . A4 . . . . . C5 . . C5 F5 . E5 . D5 . . F5 A5 . . . G#5 . F5 . E5 . D5 . B4 . G#4 . E4 . . .' },
    quiz21: { bpm: 104, style: 'quiz', prog: ['C', 'Am', 'F', 'G7', 'C', 'Am', 'F', 'G7'], mel: 'C5 . . . E5 . . . A5 . . . G5 . E5 . F5 . . . A5 . . . G5 . F5 . D5 . B4 . C5 . . . G5 . . . E5 . . . C5 . A4 . F5 . A5 . C6 . A5 . G5 . . . . . . .' },
    demon21: { bpm: 132, style: 'waltz', prog: ['Bb', 'Gm', 'Cm', 'F7', 'Bb', 'Gm', 'Cm', 'F7'], mel: 'F4 . . Bb4 . D5 G5 . . F5 . D5 Eb5 . . C5 . A4 F4 . . . . . F4 . . Bb4 . D5 G5 . . Bb5 . G5 F5 . Eb5 . C5 . Bb4 . . . . .' },
    past21: { bpm: 108, style: 'swing', prog: ['Fmaj7', 'Dm7', 'Gm7', 'C7', 'Fmaj7', 'Dm7', 'Gm7', 'C7'], mel: 'A4 . C5 . F5 . E5 . D5 . . . A4 . . . Bb4 . D5 . G5 . F5 . E5 . . . C5 . . . A4 . C5 . F5 . A5 . G5 . F5 . D5 . . . Bb4 . A4 . G4 . Bb4 . A4 . . . . . . .' },
    future21: { bpm: 70, style: 'creepy', prog: ['Cm', 'Ab', 'Fm', 'G7', 'Cm', 'Ab', 'G7', 'G7'], mel: 'C5 . . . Eb5 . . . Ab4 . . . C5 . . . F4 . . . Ab4 . . . G4 . . . B4 . . . C5 . . . G5 . . . Ab5 . . . Eb5 . . . D5 . . . B4 . . . G4 . . . . . . .' },
    spirit21: { bpm: 92, style: 'hypno', prog: ['Am', 'F', 'C', 'G', 'Am', 'F', 'E7', 'E7'], mel: 'E5 . A5 . C6 . A5 . F5 . A5 . C6 . . . E5 . G5 . C6 . G5 . D5 . G5 . B5 . . . E5 . A5 . C6 . E6 . D6 . C6 . A5 . F5 . E5 . G#5 . B5 . . . E5 . . . . . . .' },
    finale21: { bpm: 168, style: 'tarantella', prog: ['Am', 'E7', 'E7', 'Am', 'Dm', 'Am', 'E7', 'Am'], mel: 'E5 . E5 E5 F5 E5 D5 . B4 . . . B4 . B4 B4 C5 B4 A4 . E5 . . . D5 F5 A5 F5 D5 . C5 E5 A5 E5 C5 . B4 D5 G#5 D5 B4 . A4 . . . . .' },
    credits21: { bpm: 126, style: 'swing', prog: ['C6', 'A7', 'Dm7', 'G7', 'C6', 'C7', 'F6', 'G7'], mel: 'E5 . G5 C6 . E6 . D6 C#6 . A5 . E5 . C#5 . D5 . F5 A5 . C6 . A5 B5 . . . G5 . . . E5 . G5 C6 . E6 . G6 E6 . Bb5 . G5 . E5 . F5 . A5 . C6 . A5 F5 G5 . . . . . . .' }
  });

  E.voice = function (g, key, text, x, y) {
    return g.say(null, text, { key, color: COLORS[key] || C.grey[5], x, y });
  };

  E.narr = function (g, text, color) {
    return g.say(null, text, { key: 'narr', color: color || COLORS.narr, x: 160, y: 190 });
  };

  E.HORSES = ['pest', 'death', 'war', 'famine'];
  E.placed = g => E.HORSES.filter(id => g.f[id + 'Set']).length;
  E.spiritsIn = g => (g.f.futureDone ? 1 : 0) + (g.f.presentDone ? 1 : 0) + (g.f.pastDone ? 1 : 0);
  E.finale = g => g.roomId === 'workshop' && !!g.f.santaEvil && !g.f.santaDown;

  E.dress = function (g) {
    const max = g.actors.max;
    const sam = g.actors.sam;
    g.fx.tint = g.roomId === 'past' ? [236, 196, 132, 0.2] : g.roomId === 'stinkyx' ? [255, 230, 200, 0.06] : null;
    if (sam) { sam.scale = null; sam.z = 0; }
    if (max) { max.scale = null; max.follow = 'sam'; }
    g.f.frozen = false;
  };

  TALK.trip = {
    options: () => [
      { id: 'pole', icon: 'pole21', text: 'На Северный полюс.', when: gg => gg.roomId !== 'pole', say: false, end: true, run: function* (gg) { gg.endDialog(); yield* E.fly(gg, 'pole'); } },
      { id: 'street', icon: 'home21', text: 'Домой, на нашу улицу.', when: gg => gg.roomId === 'pole', say: false, end: true, run: function* (gg) { gg.endDialog(); yield* E.fly(gg, 'street'); } },
      { id: 'bye', icon: 'bye', text: 'Никуда не едем.', say: false, end: true }
    ]
  };

  E.fly = function* (g, to) {
    const north = to === 'pole';
    g.hideUI = true;
    g.sfx('engine');
    yield g.fadeOut(4);
    g.closeup = { kind: 'fly21', t0: g.time, north };
    g.music('drive');
    yield g.fadeIn(4);
    const at = { x: 160, y: 196 };
    if (north && !g.seen.fly21) {
      g.seen.fly21 = 1;
      yield g.say('max', 'Сэм, а у Де Сото есть печка?', at);
      yield g.say('sam', 'Есть. Она греет только ноги водителя. Пассажирам предлагается энтузиазм.', at);
    } else if (!north && g.f.santaEvil && !g.seen.flyEvil) {
      g.seen.flyEvil = 1;
      yield g.say('max', 'Санта остался там злой и с холодцом внутри!', at);
      yield g.say('sam', 'Он подождёт. Злые всегда ждут дольше добрых.', at);
    } else yield 1.6;
    yield g.fadeOut(4);
    g.closeup = null;
    g.hideUI = false;
    if (north) yield* g.goRoom('pole', { x: 560, y: 170, dir: 'w' }, { from: 'fly' });
    else yield* g.goRoom('street', { x: 230, y: 160, dir: 's' }, { from: 'fly' });
  };

  E.drive = function* (g) {
    if (!g.f.labelRead) { yield g.say('sam', 'Куда ехать? Мы даже не знаем, откуда этот подарок взялся.'); return; }
    if (E.finale(g)) { yield g.say('sam', 'Санта стоит у двери. До машины мне не дойти.'); return; }
    yield g.say('sam', g.roomId === 'pole' ? 'Де Сото покрылся инеем. Куда теперь?' : 'В машину, Макс. Куда едем?');
    yield g.talkTo('trip');
  };

  function maxLook(g) {
    return function* () {
      yield g.say('sam', 'Макс. Президент Соединённых Штатов и мой напарник. На Северный полюс он надел шарф. Шарф от этого стал злее.');
      yield g.say('max', 'Я в шарфе выгляжу как полярный исследователь! Который всех съел!');
    };
  }

  const globeName = g => {
    const n = E.spiritsIn(g);
    return n ? 'Снежный шар (духов внутри: ' + n + ')' : 'Пустой снежный шар';
  };

  Object.assign(ITEMS, {
    max: { name: 'Макс', icon: 'max', look: function* (g) { yield* maxLook(g)(); } },
    gun: { name: 'Пистолет Сэма', icon: 'gun', look: ['Мой револьвер. На морозе смазка густеет, но характер у него прежний.', 'Шесть патронов. Санта стреляет очередями. Счёт пока не в мою пользу.'] },
    key: { name: 'Ключ завода', icon: 'key21', look: 'Ключ завода из спины Маймтрона 9000. Длиной с мою руку. На головке выбито: «Мастерская Санты. Подходит ко всем игрушкам».' },
    betty: { name: g => (g.f.bettyWound ? 'Боксёрская Бетти (заведена)' : 'Боксёрская Бетти'), icon: 'betty21', look: g => g.f.bettyWound ? 'Боксёрская Бетти. Заведена до упора. Внутри что-то тикает, и это что-то хочет драться.' : 'Боксёрская Бетти. Кукла в красных перчатках с пультом на спине. В спине дырка для ключа. Ключ от неё, видимо, у Санты.' },
    maze: { name: 'Простейший в мире лабиринт', icon: 'maze21', look: '«Простейший в мире лабиринт». Коробка с одним входом, одним поворотом и надписью «Для грызунов от года до двадцати». Выхода у него нет. Это и есть упрощение.' },
    tags: { name: 'Подарочные бирки', icon: 'tags21', look: 'Пачка подарочных бирок мастерской. На каждой строка «Кому» и печать «Проверено. Не вскрывать до Рождества».' },
    can: { name: 'Лейка со слезами эльфа', icon: 'can21', look: 'Лейка эльфа-практиканта. Внутри его слёзы. Немного, зато чистые. По инструкции на боку, от них растут ёлки.' },
    record: { name: 'Пластинка', icon: 'record21', look: '«Сатанинские рождественские песни». Сторона А: «Песенка про доброго демона». На конверте приписано рукой Санты: «Для изгнания. Не на вечеринку».' },
    pest: { name: 'Всадник Мора', icon: 'pest21', look: 'Всадник Мора. Пластмассовый, зелёный, на костлявом коне. Тараканы его не любят. Я теперь понимаю почему.' },
    death: { name: 'Всадник Смерти', icon: 'death21', look: 'Всадник Смерти. Чёрный, с косой, коса гнётся. Снят с капота виртуального автомобиля, что бы это ни значило.' },
    war: { name: 'Всадник Войны', icon: 'war21', look: 'Всадник Войны. Красный, с мечом. На подставке процарапано: «Кубок ринга Джимми Два Зуба». Кубок сменил владельца.' },
    famine: { name: 'Всадник Голода', icon: 'famine21', look: 'Всадник Голода. Тощий всадник с весами. К седлу скотчем прикручен будильник. Будильник и тикал.' },
    sock: { name: g => (g.f.coalGot ? 'Носок с углём' : 'Носок Стинки'), icon: g => (g.f.coalGot ? 'coal21' : 'sock21'), look: g => g.f.coalGot ? 'Носок Стинки, набитый углём доверху. Автомат Санты знает про неё всё. Я тоже кое-что знаю, но я вежливый.' : 'Носок Стинки. Розовый, в ракушках, после ванночки. Держу его двумя пальцами.' },
    snow: { name: 'Жёлтый снежок', icon: 'snow21', look: 'Снежок с пункта переработки. Жёлтый. Происхождение цвета я выяснять не буду.' },
    globe: { name: g => globeName(g), icon: g => (E.spiritsIn(g) ? 'globef21' : 'globe21'), look: g => {
      const n = E.spiritsIn(g);
      if (!n) return 'Снежный шар Духа Будущего Рождества. Пустой. Внутри стеклянный домик и сугроб без снега.';
      if (n < 3) return 'Снежный шар. Внутри кружатся духи, ' + n + ' из трёх. Снег идёт сам, без встряхивания.';
      return 'Снежный шар. Все три духа на месте. Внутри метель, и метель смотрит на меня.';
    } },
    mary: { name: 'Мэри в лабиринте', icon: 'mary21', look: 'Мэри Два Зуба в простейшем лабиринте. Сидит у тупика и ругает его. Лабиринт молчит, он простой.' },
    glove: { name: 'Перчатка Джимми', icon: 'jglove21', look: 'Боксёрская перчатка Джимми Два Зуба. Крысиного размера, потёртая, с надписью «Чемпион». Двадцать лет назад её подарил ему какой-то пёс в шляпе.' }
  });

  const maxSays = (line, sam) => function* (g) { yield g.say('max', line); if (sam) yield g.say('sam', sam); };

  ITEMS.gun.on = {
    max: maxSays('Стреляй в меня, Сэм! Хочу проверить, в шарфе я пуленепробиваемый или нет!', 'Проверим в другой раз. Шарф жалко.'),
    '*': 'Стрелять по собственным вещам? У нас и так половина улик с дырками.'
  };
  ITEMS.key.on = {
    betty: function* (g) {
      if (g.f.bettyWound) { yield g.say('sam', 'Бетти заведена. Ещё оборот, и у неё отлетит пружина.'); return; }
      g.sfx('servo');
      yield 0.6;
      g.f.bettyWound = true;
      yield g.say('sam', 'Ключ от великана вошёл в куклу как родной. На фабрике у Санты все игрушки на одном ключе.');
      yield g.say('max', 'Бетти дышит! Она хочет крови! Пластмассовой!');
    },
    '*': 'Заводить это ключом? У этой вещи нет пружины. У меня, впрочем, тоже.'
  };
  ITEMS.maze.on = { mary: 'Мэри уже в лабиринте. Второй лабиринт ей не нужен, ей нужен муж.' };
  ITEMS.can.on = { '*': 'Слёзы эльфа берегу. Их мало, и на лейке написано: «Только для растений».' };
  ITEMS.snow.on = { '*': 'Жёлтым снежком по собственным вещам я не кидаюсь. Это вопрос гигиены.' };
  ITEMS.globe.on = { '*': 'Стучать шаром по вещам? Духи внутри проснутся и начнут спрашивать, какое сейчас Рождество.' };
  for (const id of E.HORSES) ITEMS[id].on = { '*': 'Всадникам Апокалипсиса нечего делать с моими вещами. У них своё расписание.' };
  ITEMS.pest.on.death = ITEMS.pest.on.war = ITEMS.pest.on.famine = 'Всадники в одной лапе стучат друг о друга копытами. Конец света из них соберётся только у столба.';
  ITEMS.record.on = { '*': 'Пластинку я берегу. Одна царапина, и изгнание превратится в танцы.' };
  ITEMS.sock.on = { '*': 'Носок Стинки к моим вещам я не прикладываю. Даже к пистолету.' };
  ITEMS.tags.on = {
    betty: 'Привязать бирку к Бетти и отправить её кому-нибудь? Она мне ещё понадобится, а бирки я трачу на подарки.',
    '*': 'Бирка без подарка никому не нужна. Как и подарок без бирки, если верить эльфам.'
  };
  ITEMS.mary.on = { '*': 'Мэри в лабиринте занята. Она ругает тупик.' };
  ITEMS.glove.on = { '*': 'Перчатка Джимми крысиного размера. Мне она мала, да и бить ею вещи глупо.' };
  ITEMS.betty.on = { '*': 'Бетти бережёт удары для ринга. Вещи ей не соперники.' };

  ITEMS.max.on = {
    '*': maxSays('Дай сюда! Именем президента это конфисковано! Ладно, неси сам.'),
    key: maxSays('Заведи меня, Сэм! Хотя нет. Я и так заведённый.'),
    betty: maxSays('Бетти! Она моего роста! Я на ней женюсь! Если проиграет, разведусь!'),
    maze: maxSays('Лабиринт! Я войду и не выйду, и это будет моя самая большая тайна!', 'Выхода в нём нет, Макс.'),
    tags: maxSays('Напиши на бирке «Максу»! И привяжи ко мне! Я подарок!'),
    can: maxSays('Эльфийские слёзы! Дай попить! Я хочу узнать, какая на вкус грусть!', 'Солёная. Не пей.'),
    record: maxSays('Сатанинские песни! Сэм, давай поставим их на свадьбе! Чьей-нибудь!'),
    pest: maxSays('Мор! Он зелёный, как моё настроение по понедельникам!'),
    death: maxSays('Смерть! Пусть сидит у меня на столе в Овальном кабинете! Для переговоров!'),
    war: maxSays('Война! Это мой любимый всадник! Он единственный с мечом!'),
    famine: maxSays('Голод! Сэм, он похож на меня до завтрака!'),
    sock: function* (g) { yield g.say('max', g.f.coalGot ? 'Уголь в носке! Сэм, Стинки была непослушной! Я так и знал!' : 'Фу! Носок пахнет пираньями и враньём!'); },
    snow: maxSays('Не дам! Я знаю, откуда этот цвет! Я видел Уиззера!'),
    globe: maxSays('Встряхни! Хочу, чтобы духам было плохо!', 'Им и так тесно, Макс.'),
    mary: maxSays('Крыса в коробке! Сэм, давай оставим её себе! Назовём Мэри! А, её и так зовут Мэри.'),
    glove: maxSays('Маленькая перчатка! У меня есть большая! В шкафу! Тоже пахнет победой!')
  };

  E.GENERIC = {
    look: ['Ничего интересного. Даже для улики.', 'Обычная вещь. Под Рождество обычные вещи особенно подозрительны.', 'В рапорт это не пойдёт.', 'Ничего, что помогло бы с Сантой.'],
    use: ['Не знаю, что с этим делать. Макс знает, но я не спрошу.', 'Ничего не случилось. Под Рождество это почти чудо.', 'Нет. Случай неподходящий.', 'Оставлю как есть.'],
    talk: ['Молчит. Предметы у нас заговаривают только после гипноза.', 'Ответа нет. Поищу собеседника с лицом.', 'Не отвечает. Имеет право.'],
    useItem: ['Одно с другим не вяжется.', 'Попробовать можно. Толку не будет.', 'Нет. Даже Макс бы удивился.', 'Это кончится рапортом.'],
    items: {
      gun: ['Стрелять в это? Патроны казённые, а казна у Макса.', 'Пуля тут ничего не решит.', 'Не буду. Патронов шесть, и у каждого уже есть планы на праздники.'],
      max: [maxSays('Оно не взрывается и не голосует. Неинтересно.'), maxSays('Поручи это вице-президенту. Мистер Мишка давно сидит без дела.'), maxSays('Не трону. У меня сегодня рейтинг.')],
      key: ['Ключ завода тут не к чему приставить. Скважины нет.', 'Заводить можно игрушки. Это не игрушка. Наверное.'],
      betty: ['Бетти дерётся только на ринге. Тут ринга нет.', 'Ставить Бетти сюда незачем. Она не украшение, она боец.'],
      maze: ['Лабиринт ставят на выход из норы. Тут нет норы.', 'Никто отсюда в лабиринт не полезет.'],
      tags: ['Привязывать бирку сюда? Эльфы потом отправят это по почте. Не надо.', 'Бирки нужны для подарков. Это не подарок.'],
      can: ['Поливать это слезами эльфа незачем. Оно не растёт.', 'Слёзы берегу для растений. Тут растений нет.'],
      record: ['Пластинку ставят на проигрыватель. Это не проигрыватель.', 'Царапать пластинку о такое я не буду. Изгнание и так дело тонкое.'],
      pest: ['Всаднику Мора тут делать нечего.', 'Всадникам место у столба.'],
      death: ['Всадник Смерти тут ни к чему.', 'Ставить Смерть сюда? Плохая примета.'],
      war: ['Всадник Войны тут никому не нужен.', 'Войну я держу в коробке. Там ей спокойнее.'],
      famine: ['Всадник Голода тикает и молчит.', 'Голоду тут кормиться нечем.'],
      sock: ['Носок Стинки сюда класть незачем.', 'Совать носок куда попало я не стану. Он и так прожил трудную жизнь.'],
      snow: ['Кидать жёлтый снежок в это? Нет.', 'Снежок жалко. Он такой один. По крайней мере, я надеюсь.'],
      globe: ['Духи в шаре отворачиваются. Не то.', 'Шар тут ничего не изменит.'],
      mary: ['Мэри сюда не хочет. Мэри хочет к мужу.', 'Выпускать Мэри здесь? Она убежит, а лабиринт простой только внутрь.'],
      glove: ['Перчатка Джимми тут не нужна.', 'Перчатка чемпионская. Бить ею вещи жалко.']
    }
  };

  E.ACTOR_HOT.max = {
    name: 'Макс', walk: null,
    look: function* (g) { yield* maxLook(g)(); },
    talk: function* (g) { yield g.talkTo('max'); },
    use: function* (g) { yield g.say('max', 'Щекотно! Президентов не щекочут! Их свергают!'); },
    items: {
      gun: function* (g) { yield* ITEMS.gun.on.max(g); },
      '*': function* (g) { yield* ITEMS.max.on['*'](g); }
    }
  };
  for (const id of Object.keys(ITEMS)) if (id !== 'max' && id !== 'gun') E.ACTOR_HOT.max.items[id] = function* (g) { yield* (ITEMS.max.on[id] || ITEMS.max.on['*'])(g); };

  E.ACTOR_HOT.sam = {
    name: 'Сэм', walk: null,
    look: ['Это я. Шляпа на месте, под шляпой дуршлаг. С прошлого сезона ни одного гипноза.', 'Я. Пёс в костюме. На Северном полюсе костюм мёрзнет первым.'],
    talk: 'Говорить с собой я буду дома. Тут эльфы подслушивают.',
    use: 'Галстук на месте. Рождество встречают при полном параде.',
    items: {
      gun: 'Нет. Я себе ещё пригожусь.',
      key: 'Заводить себя ключом? Я и так на взводе с самого утра.',
      betty: 'Боксировать с Бетти сам я не стану. Весовые категории.',
      maze: 'В простейший лабиринт я не помещусь. Это его единственное сложное место.',
      tags: 'Бирку на себя? «Кому: Сэму». Хорошо бы, но некому отправлять.',
      can: 'Поливать себя слезами эльфа? Я и так расту в глазах начальства.',
      record: 'Пластинку на себя не ставят.',
      pest: 'Мор я к себе прикладывать не буду. Даже пластмассовый.',
      death: 'Смерть на себя примерять рано.',
      war: 'Войну я ношу в коробке.',
      famine: 'Голод я и так чувствую. С утра ничего не ел, кроме пончика.',
      sock: 'Чужой носок на себя? Это за пределами служебного долга.',
      snow: 'Жёлтый снег себе за шиворот? Нет.',
      globe: 'Шар отражает мою шляпу. Шляпа в нём выглядит лучше.',
      mary: 'Мэри шипит на меня из лабиринта. Отношения у нас не сложились.',
      glove: 'Перчатка мне мала. На мизинец налезет, но такой бокс никто не оценит.',
      max: function* (g) { yield g.say('max', 'Обнимашки!'); yield g.say('sam', 'Президентские объятия опасны для рёбер.'); },
      '*': 'Мне это ни к чему.'
    }
  };

  function hintAct1(g) {
    const f = g.f;
    if (!f.robotDown) {
      if (g.vt.robotThinks) return 'Робот задумался и глаз у него погас! Беги в офис, в окно! Ключ завода у него торчит из спины прямо за нашим окном!';
      return g.roomId === 'office' ? 'Робот стоит у окна и смотрит на него красным глазом! Выйди на улицу и поговори с ним! Задай ему вопрос, на который в песнях нет ответа!' : 'Поговори с роботом! Он отвечает строчками из песен! Спроси его, почему глупцы влюбляются! На это ни одна песня не отвечает!';
    }
    if (!f.labelRead) return 'Робот лежит! У него на ноге бирка! Почитай, кто его прислал!';
    return 'Подарок из мастерской Санты! Садись в Де Сото и выбирай Северный полюс!';
  }

  function hintWorkshop(g) {
    const f = g.f;
    if (!f.bettyGot || !f.mazeGot) return 'Под ёлкой в мастерской лежат игрушки! Бери все! Санта не заметит, он стреляет!';
    if (!f.tagsGot) return 'На столике у раздатчика подарков лежат бирки! Без бирки подарок никуда не уйдёт!';
    if (!f.canGot) return 'Зелёный эльф должен плакать на ёлки, но не умеет! Скажи ему что-нибудь ужасное! Например, что Санты не существует!';
    if (!f.topiary) return 'У тебя слёзы эльфа! Под окном Санты снаружи растёт крошечный кустик! Полей его!';
    if (!f.ritualRead) return 'Кустик вырос до окна Санты! Лезь по нему наверх! В комнате Санты на подставке лежит какой-то свиток!';
    if (!f.recordGot) return 'В комнате Санты на полке стоит пластинка с сатанинскими песнями! Бери! Для изгнания нужна песня!';
    if (!f.logRead) return 'Зелёный компьютер у раздатчика помнит все подарки! Посмотри журнал отправок! Там написано, куда уехали всадники!';
    return null;
  }

  function hintHorse(g) {
    const f = g.f;
    if (!f.warGot) {
      if (!f.bettyWound) return 'Бетти не заведена! Вставь в неё ключ завода от робота! У Санты все игрушки на одном ключе!';
      return 'Джимми устроил ринг в груди робота на улице! Выпусти на ринг Бетти! Приз у него Всадник Войны!';
    }
    if (!f.pestGot) return 'В закусочной «У Стинки» викторина, а приз Всадник Мора! Сыграй! Стинки называет правильным ответ, который никто не выбрал! Закрой все четыре буквы!';
    if (!f.deathGot) return 'Всадник Смерти стоит на верстаке у К.О.П.С. в гараже! Поговори с ними и сыграй в их гонку!';
    if (!f.famineGot) {
      if (!f.xray) return 'У Боско тикает посылка! Посмотри на неё через рентген над прилавком!';
      if (!f.wishRead) return 'В посылке у Боско всадник Голода! Посмотри в мастерской список желаний на зелёном компьютере! Что хочет Боско?';
      if (!f.giftBosco) return 'Боско хочет узнать точное время взрыва! Отправь ему из мастерской секундомер! С биркой!';
      return 'Боско получил вторую тикающую посылку! Иди к нему!';
    }
    return null;
  }

  function hintRitual(g) {
    const f = g.f;
    for (const id of E.HORSES) if (!f[id + 'Set'] && g.has(id)) return 'Ставь всадников вокруг полосатого столба в мастерской! Всех четырёх!';
    return 'Все всадники на месте! Поставь пластинку на проигрыватель и пой! Подсказки к песне есть в мастерской: слизь на ящике, штемпель, таблица рекордов и накладная!';
  }

  function hintSpirits(g) {
    const f = g.f;
    if (!f.futureDone) {
      if (f.coalGot) return 'Носок с углём! Брось уголь в котёл саней! Сани полетят в будущее!';
      if (f.sockGot) return 'Носок Стинки! В комнате Санты стоит автомат, который набивает чулки! Непослушным он кладёт уголь!';
    }
    if (!f.presentDone) {
      if (!f.presentSeen) return 'Три портала у мастерской! В средний, в настоящее Рождество! Посмотри, что там испорчено!';
      if (!g.has('snow')) return 'Жучок говорил, что командует только зимой, когда снег жёлтый! Возьми снежок на пункте переработки жёлтого снега!';
      return 'Брось жёлтый снежок в Жучка в настоящем Рождестве! Он вспомнит учебку и построит родню!';
    }
    if (!f.pastDone) {
      if (!f.pastSeen) return 'Левый портал ведёт в прошлое! Иди и посмотри, что вы там испортили! Мы испортили! Ну, ты понял!';
      if (!f.maryGot) return f.mazeSet ? 'Лабиринт стоит у норы! Включи старушкин телевизор! Мэри выйдет смотреть свою передачу!' : 'Поставь простейший лабиринт у выхода из крысиной норы!';
      if (!f.jimmyHappy) return 'Отнеси Мэри Джимми! Он стоит у нас на карнизе, за окном офиса!';
      return 'Отдай перчатку молодому Джимми в прошлом! Пусть выиграет свой бой!';
    }
    if (!f.futureDone) {
      if (!f.giftStinky) return f.knowFeet ? 'Стинки жаловалась на ноги! Отправь ей из мастерской ванночку для ног! Она снимет носки!' : 'Для саней нужен уголь! Уголь кладут непослушным в носки! Поговори со Стинки, у неё наверняка есть носки и плохая репутация!';
      return 'Стинки сняла носок! Он лежит у неё на прилавке! Забирай!';
    }
    return 'Все три духа в шаре! Брось шар в демона у порталов!';
  }

  function hintFinale(g) {
    const ft = g.vt.finale || {};
    const st = ft.phase !== undefined ? E.planeStation(ft) : -1;
    if (ft.ball === 'plane') return ft.moving ? 'Мяч в самолёте! Стреляй в выключатель, когда самолёт будет над Камбалобоем за Сантой!' : 'Мяч в самолёте! Стреляй в выключатель, пусть самолёт летит, а над Камбалобоем останови его!';
    if (ft.moving) return 'Самолёт кружит под потолком! Стреляй в выключатель у двери, когда он будет над батутом!';
    if (st === E.FINALE.TRAMP) return 'Самолёт над батутом! Стреляй в пушку! Мяч отскочит от батута прямо в самолёт!';
    return 'Самолёт стоит не там! Стреляй в выключатель, пусть летит дальше!';
  }

  function maxHint(g) {
    const f = g.f;
    if (!f.introDone) return 'Робот, Сэм! Надо что-то делать с роботом!';
    if (!f.poleSeen) return hintAct1(g);
    if (E.finale(g)) return hintFinale(g);
    if (f.santaEvil && !f.santaDown) return 'Санта стал злым и ушёл в мастерскую! Иди за ним! Там полно игрушек, которыми можно стукнуть!';
    if (f.santaDown) return 'Санта в ящике! Прочитай, что написано на ящике!';
    if (f.demonOut) return hintSpirits(g);
    const w = hintWorkshop(g);
    if (w) return w;
    const h = hintHorse(g);
    if (h) return h;
    return hintRitual(g);
  }

  const MAX_GAGS = [
    'Сэм, я придумал подарок для Санты! Мы подарим ему Санту!',
    'На Северном полюсе все стрелки компаса показывают на меня. Я проверял.',
    'Знаешь, почему эльфы маленькие? Их делают из обрезков.',
    'Мне скучно, Сэм. Давай объявим Рождеству импичмент.',
    'Если Санта всё про всех знает, пусть скажет, где мой носок с тысяча девятьсот восемьдесят второго.'
  ];
  const DECREES = [
    'Указ! Рождество переносится на мой день рождения! Подарки удваиваются!',
    'Указ! Северный полюс объявляется пятьдесят первым штатом! Столица там, где теплее!',
    'Указ! Всем оленям выдать номерные знаки! Санте права!',
    'Указ! Псу в шляпе выдать премию! Носком с углём!'
  ];

  TALK.max = {
    options: () => [
      { id: 'hint', icon: 'q', text: 'Макс, есть идеи, что делать дальше?', run: function* (gg) { yield gg.say('max', E.maxHint(gg)); } },
      { id: 'how', icon: 'duck', text: 'Как настроение, Макс?', run: function* (gg) { yield gg.say('max', MAX_GAGS[(gg.count('maxgag') - 1) % MAX_GAGS.length]); } },
      { id: 'decree', icon: 'decree21', text: 'Издай какой-нибудь указ.', run: function* (gg) {
        const n = (gg.count('decree') - 1) % DECREES.length;
        gg.sfx('stamp');
        yield gg.say('max', DECREES[n]);
        if (n === 3) yield gg.say('sam', 'Служу президенту. Носок можно оставить себе?');
      } },
      { id: 'case', icon: 'badge', text: 'Что ты думаешь о нашем деле?', when: gg => gg.f.introDone, run: function* (gg) {
        const f = gg.f;
        if (f.santaDown) yield gg.say('max', 'Мы победили Санту! Сэм, это лучшее Рождество в моей жизни! Хотя подарков пока нет!');
        else if (f.santaEvil) yield gg.say('max', 'Санта съел демона и сам стал демоном! Сэм, по-моему, в этом есть урок! Я его не понял!');
        else if (f.demonOut) yield gg.say('max', 'Демон сидел в эльфе, а мы на Санту думали! Сэм, давай никому не скажем!');
        else if (f.poleSeen) yield gg.say('max', 'Санта стреляет, эльфы плачут, а мы собираем игрушки! Сэм, по-моему, мы и есть Рождество!');
        else yield gg.say('max', 'Кто-то прислал нам робота-убийцу! Сэм, нас наконец-то кто-то ценит!');
      } },
      { id: 'bye', icon: 'bye', text: 'Работаем, господин президент.', end: true }
    ]
  };

  E.maxHint = g => (g.room && g.room.maxHint && g.room.maxHint(g)) || maxHint(g);

  E.newGame = function (g) {
    g.vt = {};
    g.addActor('sam', { name: 'Сэм', color: COLORS.sam, speed: 62, stride: 34 });
    g.addActor('max', { name: 'Макс', color: COLORS.max, speed: 70, stride: 26, follow: 'sam' });
    g.addActor('jimmy', { name: 'Джимми Два Зуба', costume: 'jimmy', color: COLORS.jimmy, speed: 60, stride: 12, scale: 1.25 });
    g.addActor('stinky', { name: 'Стинки', costume: 'stinky21', color: COLORS.stinky21 });
    g.addActor('sybil', { name: 'Сибил', costume: 'sybil', color: COLORS.sybil });
    g.addActor('lincoln', { name: 'Голова Линкольна', costume: 'abehead6', color: COLORS.lincoln, scale: 0.8 });
    g.addActor('bug', { name: 'Сержант Жучок', costume: 'roach', color: COLORS.roach, speed: 70, stride: 8, scale: 1.3 });
    g.addActor('bosco', { name: 'Боско', costume: 'bosco', color: COLORS.bosco });
    g.addActor('curt', { name: 'Курт 286', costume: 'copcurt', color: COLORS.curt, scale: 0.9 });
    g.addActor('bob', { name: 'Боб Белл', costume: 'copbob', color: COLORS.bob, scale: 0.9 });
    g.addActor('bluster', { name: 'Бластер-Бахвал', costume: 'copbluster', color: COLORS.bluster, scale: 0.9 });
    g.addActor('chippy', { name: 'Чиппи', costume: 'copchippy', color: COLORS.chippy, scale: 0.9 });
    g.addActor('santa', { name: 'Санта', costume: 'santa21', color: COLORS.santa21, speed: 56, stride: 26 });
    g.addActor('elfr', { name: 'Красный эльф', costume: 'elf21', color: COLORS.elfr21, speed: 60, stride: 14 });
    g.addActor('elfg', { name: 'Зелёный эльф', costume: 'elf21', color: COLORS.elfg21, speed: 70, stride: 14 });
    g.addActor('specs', { name: 'Спекс', costume: 'specs', color: COLORS.specs, scale: 0.9 });
    g.addActor('whizzer', { name: 'Уиззер', costume: 'whizzer', color: COLORS.whizzer, scale: 0.9 });
    g.addActor('peepers', { name: 'Пиперс', costume: 'peepers', color: COLORS.peepers, scale: 0.9 });
    g.addActor('demon', { name: 'Шаркающее Корпоративное Присутствие', costume: 'demon21', color: COLORS.demon21, speed: 40, stride: 20 });
    g.addActor('gpast', { name: 'Дух Прошлого Рождества', costume: 'ghost21', color: COLORS.gpast21 });
    g.addActor('gpres', { name: 'Дух Настоящего Рождества', costume: 'ghost21', color: COLORS.gpres21 });
    g.addActor('gfut', { name: 'Дух Будущего Рождества', costume: 'ghost21', color: COLORS.gfut21 });
    g.addActor('mary', { name: 'Мэри Два Зуба', costume: 'mary21', color: COLORS.mary21, speed: 50, stride: 10, scale: 1.25 });
    g.addActor('yjimmy', { name: 'Молодой Джимми', costume: 'yjimmy21', color: COLORS.yjimmy21, speed: 60, stride: 12, scale: 1.25 });
    g.addActor('timmy', { name: 'Тимми', costume: 'timmy21', color: COLORS.timmy21, scale: 1.25 });
    g.addActor('pedro', { name: 'Педро', costume: 'pedro21', color: COLORS.pedro21, speed: 90, stride: 24 });
    g.addActor('fsam', { name: 'Сэм из будущего', costume: 'fsam21', color: COLORS.fsam21 });
    g.addActor('fmax', { name: 'Макс из будущего', costume: 'fmax21', color: COLORS.fmax21 });
    g.inv = ['max', 'gun'];
    g.place('sam', 'office', 150, 166, 's');
    g.place('max', 'office', 84, 150, 'e');
    for (const id of Object.keys(g.actors)) if (id !== 'sam' && id !== 'max') g.place(id, 'nowhere', 0, 0, 's');
    g.actors.elfr.v = 'red';
    g.actors.elfg.v = 'green';
    g.actors.gpast.v = 'past';
    g.actors.gpres.v = 'present';
    g.actors.gfut.v = 'future';
    E.dress(g);
  };

  E.afterLoad = function (g) {
    const room = g.room;
    if (room && room.onLoad) room.onLoad(g);
    E.dress(g);
  };

  E.install = function () {
    for (const room of Object.values(E.ROOMS)) {
      if (room.dress201) continue;
      room.dress201 = true;
      const setup = room.setup;
      room.setup = function (g) {
        if (setup) setup.call(room, g);
        E.dress(g);
      };
      if (!room.onLoad) room.onLoad = function (g) { room.setup(g); };
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
