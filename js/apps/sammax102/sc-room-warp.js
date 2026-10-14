(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP102;
  const { ROOMS, TALK } = E;
  const PROOFS = [['vtape', 'proofTape', 'роль в сериале'], ['contract', 'proofContract', 'контракт на запись'], ['paper', 'proofPaper', 'скандал']];

  function myraSay(g, text) {
    return g.say(null, text, { key: 'myradoor', color: COLORS.myra, x: Math.round(528 - g.camX), y: 66 });
  }

  function* hired(g) {
    const sam = g.actors.sam, dir = g.actors.director;
    yield g.say('director', 'Беру обоих. Съёмки «Ковбоев из центра» прямо сейчас, первая дверь по коридору. Я вас догоню.');
    sam.v = '';
    yield g.say('sam', 'Вытираю пену. Приберегу её для крупных планов.');
    g.f.hired = true;
    g.sfx('click');
    dir.scripted = true;
    yield g.walkTo('director', 190, 150);
    g.place('director', 'sitcom', 282, 176, 'w');
    dir.scripted = false;
    yield g.say('max', 'Мы актёры, Сэм! Я сейчас опять расплачусь!');
  }

  E.auditionRabid = function* (g) {
    const sam = g.actors.sam;
    yield g.anim('sam', 'reach', 0.6);
    g.sfx('spray');
    sam.v = 'foam';
    yield 0.4;
    g.fx.shake = 0.3;
    yield g.say('sam', 'Р-р-р! Гр-р-р-рау! Р-р-р-р-р!');
    yield g.say('director', 'Пена! Взгляд! Верю! Типаж просто ваш.');
    yield g.say('sam', 'Мой типаж. Годы самообразования, и вот я бешеный пёс в титрах.');
    g.f.audRabid = true;
    if (g.f.audCry) yield* hired(g);
    else yield g.say('director', 'Упражнение второе. Кролик плачет. Жду слёз.');
  };

  E.auditionCry = function* (g) {
    const max = g.actors.max;
    yield g.say('sam', 'Макс, это ради твоей карьеры.');
    yield g.say('max', 'Моей карьеры? Тогда стреляй! Прямо в лицо! В лицо для камеры!');
    g.faceTo('sam', max.x);
    yield g.anim('sam', 'shoot', 0.4);
    g.sfx('teargas');
    g.fx.flash = 0.2;
    max.act = 'cry'; max.keepAct = true;
    yield 0.6;
    yield g.say('max', 'Я плачу! Я правда плачу! Это прекрасно! Хотя нет, глаза щиплет!');
    yield g.say('director', 'Слёзы как у настоящего кролика. Кхе. И у настоящего режиссёра.');
    max.act = ''; max.keepAct = false;
    g.f.audCry = true;
    if (g.f.audRabid) yield* hired(g);
    else yield g.say('director', 'Теперь пёс. Бешенство, пена, рычание. Жду.');
  };

  E.inAudition = g => g.roomId === 'warp' && g.f.auditionOn && !g.f.hired && g.actors.director.room === 'warp';

  TALK.dirlobby = {
    start: function* (g) {
      if (g.f.metDirector) return;
      g.f.metDirector = true;
      yield g.say('director', 'Следующий! А, вы. Имя, агент, опыт работы в кадре?');
      yield g.say('sam', 'Сэм и Макс, Вольная полиция. Мы ищем Майру Стамп.');
      yield g.say('director', 'Все ищут Майру. Мои звёзды из «Ковбоев из центра» ушли к ней в гости три дня назад и не вернулись.');
      yield g.say('director', 'У меня пустая площадка и эфир в пятницу. Вы на пробы?');
    },
    options: [
      { id: 'who', icon: 'f:director', text: 'Кто вы?', run: function* (g) {
        yield g.say('director', 'Режиссёр. И продюсер. И оператор, гримёр, осветитель и буфет.');
        yield g.say('sam', 'А кроме вас здесь кто-нибудь работает?');
        yield g.say('director', 'Майра. Остальные сидят у Майры в зале.');
      } },
      { id: 'myra', icon: 'f:myra', text: 'Как попасть на шоу к Майре?', run: function* (g) {
        yield g.say('director', 'Стать звездой. Её студия в конце коридора. Только в коридор пускаю я, а я пускаю актёров.');
      } },
      { id: 'audition', icon: 'star', text: 'Мы хотим на пробы.', when: g => !g.f.auditionOn, run: function* (g) {
        yield g.say('director', 'Прекрасно. Роль: бешеный пёс на ранчо и его друг, кролик, который плачет.');
        yield g.say('sam', 'Бешеный пёс. Меня опять видят только в роли собаки.');
        yield g.say('director', 'Вы и есть собака.');
        yield g.say('sam', 'Это не повод.');
        yield g.say('director', 'Упражнение первое: бешенство. Пена у рта, рычание, глаза навыкате. Упражнение второе: кролик плачет. Настоящими слезами. Реквизит свой.');
        g.f.auditionOn = true;
      } },
      { id: 'again', icon: 'q', text: 'Напомните упражнения.', when: g => g.f.auditionOn && !g.f.hired, run: function* (g) {
        if (!g.f.audRabid) yield g.say('director', 'Бешеный пёс. Пена у рта, настоящая. Пену приносите свою, бюджета у нас нет.');
        if (!g.f.audCry) yield g.say('director', 'Кролик в слезах. Лук не предлагать, лук ушёл к Майре вместе с буфетом.');
      } },
      { id: 'rope', icon: 'ex', text: 'Можно пройти в коридор?', when: g => !g.f.hired, run: function* (g) {
        yield g.say('director', 'После проб. Канат у меня не для красоты. Хотя и для красоты тоже.');
      } },
      { id: 'bye', icon: 'bye', text: 'Мы ещё вернёмся.', end: true, run: function* (g) {
        yield g.say('director', 'Все возвращаются. Кроме тех, кто ушёл к Майре.');
      } }
    ]
  };

  function missing(g) { return PROOFS.filter(p => !g.f[p[1]]).map(p => p[2]); }

  function* showProof(g, item) {
    const p = PROOFS.find(q => q[0] === item);
    g.f.hatchOpen = true;
    if (item === 'vtape') yield myraSay(g, 'Кассета? «Ковбои из центра»! Корова в абажуре! Обожаю. Засчитано.');
    if (item === 'contract') yield myraSay(g, 'Контракт с «Позорного идола»! Высокие ноты, я слышала. Засчитано, мой соловей.');
    if (item === 'paper') yield myraSay(g, 'Межпланетный любовный треугольник! Сладенький, это же прайм-тайм! Засчитано!');
    g.drop(item);
    g.f[p[1]] = true;
    const left = missing(g);
    if (left.length) { yield myraSay(g, 'Осталось: ' + left.join(' и ') + '. Жду, мой сладкий.'); g.f.hatchOpen = false; return; }
    yield myraSay(g, 'Роль, песня и скандал! Настоящие звёзды! Добро пожаловать на «Майру!»');
    g.f.hatchOpen = false;
    g.sfx('bell');
    g.f.myraOpen = true;
    yield* E.enterShow(g);
  }

  TALK.myradoor = {
    start: function* (g) {
      g.f.hatchOpen = true;
      g.sfx('click');
      yield myraSay(g, 'Кто там? Звёзды? Если не звёзды, у меня прямой эфир!');
    },
    end: function* (g) { g.f.hatchOpen = false; g.sfx('click'); },
    options: [
      { id: 'in', icon: 'badge', text: 'Майра, откройте! Вольная полиция.', run: function* (g) {
        yield myraSay(g, 'Полиция? Какая скука! Сюда входят только звёзды, сладенький. У меня триста счастливых зрителей.');
      } },
      { id: 'guest', icon: 'star', text: 'Мы хотим к вам в гости.', run: function* (g) {
        yield myraSay(g, 'Все хотят! Докажите, что вы звёзды. Роль в сериале, контракт на запись и скандал. Принесите, и мой диван ваш.');
        g.f.knowProofs = true;
      } },
      { id: 'left', icon: 'q', text: 'Что вам ещё показать?', when: g => g.f.knowProofs && missing(g).length < 3, run: function* (g) {
        yield myraSay(g, 'Не хватает: ' + missing(g).join(' и ') + '.');
      } },
      { id: 'free', icon: 'ex', text: 'Отпустите зрителей.', run: function* (g) {
        yield myraSay(g, 'Отпустить? Они ещё не получили главный приз! Никто не уйдёт без подарка.');
      } },
      { id: 'bear', icon: 'f:bear', text: 'Что за мишка у вас на столе?', run: function* (g) {
        yield myraSay(g, 'Мистер Мишка? Мой лучший друг. Он говорит мне, что делать. Шучу! Он молчит и улыбается. Как идеальный зритель.');
      } },
      { id: 'bye', icon: 'bye', text: 'Мы вернёмся звёздами.', end: true, run: function* (g) {
        yield myraSay(g, 'Возвращайтесь! Звёзды у меня всегда в цене. Ненадолго.');
      } }
    ]
  };

  const doorItems = {
    vtape: function* (g) { yield* showProof(g, 'vtape'); },
    contract: function* (g) { yield* showProof(g, 'contract'); },
    paper: function* (g) { yield* showProof(g, 'paper'); },
    photo: function* (g) { g.f.hatchOpen = true; yield myraSay(g, 'Фотография? Мне нужна газета, сладенький. Снимок без газеты это просто воспоминание.'); g.f.hatchOpen = false; },
    gun: function* (g) { g.f.hatchOpen = true; yield myraSay(g, 'Пистолет? Какая прелесть. В зале у меня три таких же, всех сдали на входе.'); g.f.hatchOpen = false; },
    cake: function* (g) { g.f.hatchOpen = true; yield myraSay(g, 'Торт? Подарки здесь дарю я!'); g.f.hatchOpen = false; },
    kcake: function* (g) { g.f.hatchOpen = true; yield myraSay(g, 'Торт? Подарки здесь дарю я!'); g.f.hatchOpen = false; },
    '*': function* (g) { g.f.hatchOpen = true; yield myraSay(g, 'Это не доказательство славы, милый.'); g.f.hatchOpen = false; }
  };

  function gate(msg) {
    return function* (g) {
      if (!g.f.hired) { yield g.say('sam', 'Коридор перекрыт канатом. Сначала пробы.'); return false; }
      if (msg && !g.f.staff) { yield g.say('sam', msg); return false; }
      return true;
    };
  }

  function door(id, name, room, pos, look, staffMsg) {
    const check = gate(staffMsg);
    return {
      id, name, rect: null, face: 'n', look,
      exit: function* (g) {
        const ok = yield* check(g);
        if (!ok) return;
        g.sfx('door');
        yield* g.goRoom(room, pos);
      }
    };
  }

  const STAFF = 'Режиссёрша сказала: сначала «Ковбои из центра». Остальные площадки только для штатных.';
  const doors = [
    Object.assign(door('door1', '«Ковбои из центра»', 'sitcom', { x: 30, y: 172, dir: 'e' }, 'Дверь на площадку «Ковбоев из центра». На ручке висит лассо.', null), { rect: [250, 62, 34, 70], walk: [267, 146] }),
    Object.assign(door('door2', '«Готовим не глядя»', 'cooking', { x: 30, y: 172, dir: 'e' }, 'Кулинарное шоу. Из-под двери пахнет чем-то, что никогда не было едой.', STAFF), { rect: [316, 62, 34, 70], walk: [333, 146] }),
    Object.assign(door('door3', '«Позорный идол»', 'idol', { x: 30, y: 178, dir: 'e' }, '«Позорный идол». Из-за двери доносится пение. Точнее, звуки, которые хотят быть пением.', STAFF), { rect: [382, 62, 34, 70], walk: [399, 146] }),
    Object.assign(door('door4', '«Кто никогда не станет миллионером»', 'quiz', { x: 30, y: 172, dir: 'e' }, 'Викторина. На двери табличка: «Никто. Никогда. Ни за что».', STAFF), { rect: [448, 62, 34, 70], walk: [465, 146] })
  ];

  ROOMS.warp = {
    id: 'warp', name: 'Телестудия WARP', w: 560, music: 'warp',
    paint: b => S.BG.warp(b),
    walk: g => g.f.hired ? [[4, 140, 556, 140, 556, 198, 4, 198]] : [[4, 140, 204, 140, 204, 198, 4, 198]],
    layers: [
      { id: 'chair', x: 48, y: 128, base: 166 },
      { id: 'desk', x: 104, y: 110, base: 154 },
      { id: 'rope', x: 206, y: 120, base: 160, when: g => !g.f.hired }
    ],
    drawFront(f, g, cx) {
      if (!g.f.hatchOpen) return;
      const P = new S.Pen(f);
      P.part(P.rect(515 - cx, 76, 26, 4), C.dskin, { b: 3, sh: 0, hi: 0, ol: 0 });
      for (const ex of [522, 534]) { f.set(ex - cx, 77, C.eye); f.set(ex + 1 - cx, 77, C.pupil); f.set(ex - cx, 78, C.eye); f.set(ex + 1 - cx, 78, C.eye); }
    },
    hot: [
      { id: 'exit', name: 'Выход к машине', rect: [4, 46, 46, 90], walk: [28, 170], face: 'w',
        look: 'Стеклянные двери на парковку. Наш Де Сото стоит у входа и смущает охранников, которых нет.',
        exit: function* (g) { g.sfx('door'); yield* S.openMap(g); } },
      { id: 'logo', name: 'Логотип WARP', rect: [70, 12, 116, 40], look: 'Огромные буквы WARP. Буква «A» слегка кривая. Её, похоже, тоже монтировала режиссёрша.' },
      { id: 'poster1', name: 'Афиша «Майры!»', rect: [56, 70, 40, 40], look: 'Афиша «Майры!». Майра улыбается так, что хочется проверить кошелёк.' },
      { id: 'poster2', name: 'Афиша «Ковбоев»', rect: [146, 70, 40, 40], look: '«Ковбои из центра». Двенадцатый сезон. На афише корова в ковбойской шляпе. Корова, кстати, самая известная из всех.' },
      { id: 'desk', name: 'Стойка приёмной', rect: [104, 110, 80, 44], walk: [144, 164], face: 'n',
        look: 'Стойка приёмной. Табличка «Администратор». Администратора нет, есть режиссёрша.',
        use: 'На стойке журнал посещений. Последняя запись: «Все ушли к Майре. Не ждите».' },
      { id: 'chair', name: 'Стул режиссёра', rect: [48, 128, 30, 38], walk: [64, 170], face: 'w',
        look: 'Складной стул с надписью «РЕЖ.». Сидеть на нём можно только режиссёрам и тем, кто хочет перестать работать на телевидении.',
        use: 'Сесть на стул режиссёра? Я слишком молод для такой карьеры.' },
      { id: 'rope', name: 'Бархатный канат', rect: [206, 120, 36, 40], walk: [196, 162], face: 'e', when: g => !g.f.hired,
        look: 'Бархатный канат перекрывает коридор. Символ шоу-бизнеса: всех видно, никого не пускают.',
        use: function* (g) { yield g.say('director', 'Руки от каната! Сначала пробы.'); } }
    ].concat(doors, [
      { id: 'myradoor', name: 'Студия «Майра!»', rect: [500, 44, 56, 90], walk: [528, 146], face: 'n',
        look: 'Двойная дверь студии «Майра!». Над ней горит «ИДЁТ ЭФИР». Горит уже третьи сутки.',
        use: function* (g) { yield g.talkTo('myradoor'); },
        talk: function* (g) { yield g.talkTo('myradoor'); },
        items: doorItems },
      { id: 'hatch', name: 'Окошко в двери', rect: [512, 72, 32, 10], walk: [528, 146], face: 'n',
        look: 'Окошко в двери. Изнутри кто-то смотрит. Глаза не моргают.',
        use: function* (g) { yield g.talkTo('myradoor'); },
        talk: function* (g) { yield g.talkTo('myradoor'); },
        items: doorItems },
      { id: 'onair', name: 'Табло «Идёт эфир»', rect: [494, 16, 68, 24], look: '«МАЙРА! ИДЁТ ЭФИР». Лампочки мигают в такт аплодисментам.' }
    ]),
    actors: {
      director: {
        name: 'Режиссёрша', walk: [116, 168], face: 'w', when: g => g.actors.director.room === 'warp',
        look: 'Режиссёрша. Гарнитура, планшет и взгляд человека, который снимает девять передач одновременно.',
        talk: function* (g) { yield g.talkTo('dirlobby'); },
        items: {
          cream: function* (g) { yield g.say('director', 'Не мне. Я не играю, я смотрю. Покажите бешенство на себе.'); },
          launcher: function* (g) { yield g.say('director', 'Направьте это на кролика. Режиссёры плачут только над сметой.'); },
          gun: function* (g) { yield g.say('director', 'Уберите. У нас вестерн, но стреляем только из хлопушки.'); },
          max: function* (g) { yield g.say('max', 'Я могу заплакать! Если меня стукнуть!'); yield g.say('director', 'Бить кроликов в кадре запрещает профсоюз. Найдите способ поизящнее.'); }
        }
      }
    },
    setup(g) {
      g.f.hatchOpen = false;
      const d = g.actors.director;
      if (!g.f.hired) { g.place('director', 'warp', 84, 164, 'e'); d.visible = true; }
    },
    enter: function* (g) {
      if (!g.seen.warpFirst) {
        g.seen.warpFirst = 1;
        yield g.say('max', 'Сэм, мы на телевидении! Тут всё блестит! Можно я что-нибудь сломаю?');
        yield g.say('sam', 'Позже, Макс. Сначала поговорим с той дамой в наушниках.');
      }
    },
    onLoad(g) { ROOMS.warp.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
