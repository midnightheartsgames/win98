(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP104;
  const { ROOMS, TALK } = E;

  const POND = [152, 178, 170, 170, 250, 170, 268, 178, 262, 190, 236, 194, 184, 194, 158, 190];
  const MAILBOX = [136, 146, 160, 146, 160, 172, 136, 172];
  const STAGE = [500, 146, 640, 146, 640, 176, 500, 176];
  const STAND = [474, 160, 500, 160, 500, 166, 474, 166];
  const FLAG = { school: 'hitSchool', waste: 'hitWaste', tax: 'hitTax', poor: 'hitPoor' };
  const LIFE = ['Зал хлопает. Ответ мимо вопроса, зато благородный.', 'Ту же фразу опять встречают овацией. Её, похоже, можно повторять до самых выборов.'];
  const REACT = {
    school: {
      wrongs: [true, 'Зал молчит. Потом встают два священника и учительница и уходят вместе.'],
      delivery: [false, 'Школа с доставкой на дом. Родители довольны, рейтинг цел.'],
      poster: [false, 'Учителя решили, что это про их зарплату, и привычно кивнули.'],
      nofeed: [false, 'Школьные столовые насторожились. Рейтинг не шелохнулся.']
    },
    waste: {
      delivery: [true, 'По бочке отходов на каждое крыльцо. Пригороды свистят.'],
      wrongs: [false, 'Экологи долго ищут в ответе смысл и находят. Рейтинг цел.'],
      poster: [false, 'Избиратели поняли так, что отходы он заберёт себе. Сочли благородным.'],
      nofeed: [false, '«Не кормить отходами». Звучит разумно. Рейтинг цел.']
    },
    tax: {
      poster: [true, 'Честность оценили все. Голосовать за неё не захотел никто.'],
      wrongs: [false, 'Бухгалтеры кивают. Два зла у них называется двойным налогообложением.'],
      delivery: [false, 'Налоговая с доставкой на дом. Избиратели поёжились и стерпели.'],
      nofeed: [false, 'Налоговая истолковала по-своему. Рейтинг цел.']
    },
    poor: {
      nofeed: [true, 'Зал ахнул. В статую кинули бутербродом. Бутерброд тут же подобрали.'],
      wrongs: [false, 'Сытые согласились, голодные не поняли. Рейтинг цел.'],
      delivery: [false, 'Обед с доставкой на дом! Зал аплодирует и уже диктует адреса.'],
      poster: [false, 'Отдать голодным всё. Зал утирает слёзы. Мрамор, оказывается, щедрый.']
    }
  };
  const TO_STAND = 'Он читает только то, что поставили ему перед носом. А нос у него на высоте третьего этажа.';
  const MAX_SPEECH = [
    'Голосуйте за Макса! Я маленький, меня легко прокормить!',
    'Мой план простой. Сначала кнопка. Потом разберёмся, от чего она.',
    'Каждому избирателю я обещаю личного врага! Бесплатно!',
    'При мне пудинг вернётся! И приведёт друзей!'
  ];

  function numbers(g) {
    const p = E.poll(g);
    return 'Линкольн: ' + p.lin + '. Макс: ' + p.max + '. Никто: ' + p.none + '.';
  }

  function* victory(g) {
    const li = g.actors.lincoln, ch = g.actors.chuckles, max = g.actors.max;
    if (g.dialog) g.endDialog();
    g.hideUI = true;
    g.sfx('fanfare');
    yield E.announce(g, 'Подсчёт окончен. Линкольн: тридцать. Никто: тридцать один. Макс: тридцать девять.');
    yield E.announce(g, 'Президентом Соединённых Штатов избран кролик.');
    g.sfx('cheer');
    max.act = 'grin'; max.actT = 2;
    yield g.say('max', 'Я президент! Сэм! Я ПРЕЗИДЕНТ! Никто, ты проиграл!');
    yield g.say('lincoln', 'Народ сделал выбор. Народ ошибся.');
    yield g.say('chuckles', 'Эйб. Глаза.');
    li.act = 'rage'; li.keepAct = true;
    g.sfx('laser');
    g.fx.hypno = 1;
    g.fx.flash = 0.4;
    g.music('abechase');
    yield g.say('lincoln', 'ЛИНКОЛЬН ОСВОБОДИТ ВАС. ОТ ВЫБОРА.');
    yield g.say('sam', 'Под шляпой звенит дуршлаг. Лучи у него гипнотические.');
    g.place('chuckles', 'nowhere', 0, 0);
    ch.scale = null; ch.z = 0; ch.act = ''; ch.keepAct = false;
    li.scripted = true;
    for (let i = 0; i < 3; i++) { g.sfx('stomp'); g.fx.shake = 0.5; yield 0.45; }
    yield g.walkTo('lincoln', 720, 160, { free: true, speed: 1.5 });
    g.place('lincoln', 'nowhere', 0, 0);
    li.act = ''; li.keepAct = false; li.scripted = false;
    g.fx.hypno = 0;
    g.f.elected = true;
    g.f.rampage = true;
    g.music('lawn');
    yield g.say('sam', 'Он уходит на север и гипнотизирует всё, мимо чего идёт. Чаклз висит у него на цилиндре.');
    yield g.say('sam', 'Макс. Эйб Линкольн должен умереть.');
    yield g.say('max', 'Это будет мой первый указ! Где тут мой кабинет?');
    g.hideUI = false;
  }

  E.checkVote = function* (g) {
    const p = E.poll(g);
    if (g.f.elected || p.lin >= p.max) return;
    yield* victory(g);
  };

  E.scandal = function* (g) {
    const sy = g.actors.sybil, li = g.actors.lincoln;
    g.hideUI = true;
    yield g.fadeOut(2);
    g.setRoom('lawn', { x: 452, y: 184, dir: 'e' });
    g.camLock = 320;
    g.centerCam(true);
    g.place('sybil', 'lawn', 336, 182, 'e');
    sy.visible = true; sy.scripted = true; sy.act = ''; sy.keepAct = false; sy.v = 'heart';
    g.music('campaign');
    yield g.fadeIn(2);
    li.act = 'point';
    yield g.say('lincoln', 'И потому семья есть основа нации. Я храню верность супруге больше полутора веков...');
    yield g.walkTo('sybil', 506, 186, { speed: 1.5 });
    g.face('sybil', 'e');
    sy.act = 'swoon'; sy.keepAct = true;
    yield g.say('sybil', 'Авраам! Я пришла! Я на ступенях!');
    li.act = 'lapel';
    yield g.say('lincoln', 'Сударыня, я вижу вас впервые.');
    yield g.say('sybil', 'Но вы звонили! «Этот день запомнят на века»!');
    yield g.say('lincoln', 'Я не звонил. У меня нет телефона. У меня нет даже карманов.');
    sy.act = 'cry';
    g.sfx('boo');
    yield g.say('sybil', 'Вы все одинаковые! Особенно мраморные!');
    yield g.walkTo('sybil', 300, 184, { speed: 1.8 });
    g.place('sybil', 'nowhere', 0, 0);
    sy.act = ''; sy.keepAct = false; sy.scripted = false; sy.v = '';
    g.f.scandal = true;
    yield g.say('chuckles', 'Эйб. Кто эта женщина?');
    yield g.say('lincoln', 'Понятия не имею. Но плакала она убедительно.');
    yield E.announce(g, 'Скандал в прямом эфире. Кандидат назначил свидание и отрёкся. ' + numbers(g));
    g.camLock = null;
    g.hideUI = false;
    yield* E.checkVote(g);
    if (!g.f.elected) yield g.say('sam', 'Минус десять, а он всё ещё впереди. Мрамор с первого раза не роняют.');
  };

  function* register(g) {
    g.f.maxRuns = true;
    yield g.say('sam', 'Вольная полиция выдвигает своего кандидата. Вот он.');
    yield g.say('max', 'Один кролик, один закон!');
    yield g.say('lincoln', 'Кролик против Линкольна. В духе демократии отвечаю: ну давай.');
    yield g.say('chuckles', 'Дебаты так дебаты. Вопросы задаёт ведущий. Ведущим будет пёс, раз уж он в костюме.');
    yield E.announce(g, 'Кандидаты зарегистрированы. ' + numbers(g));
  }

  function* askIssue(g, id) {
    const li = g.actors.lincoln;
    const card = g.f.cards[0];
    li.act = 'read';
    yield g.say('lincoln', E.CARDS[card]);
    li.act = 'lapel';
    const [hit, text] = card === 'life' ? [false, LIFE[(g.count('lifecard') - 1) % LIFE.length]] : REACT[id][card];
    if (!hit) { g.sfx('applause'); yield g.say('sam', text); return; }
    if (g.f[FLAG[id]]) { yield g.say('sam', 'Этот ответ избиратели уже слышали. Второй раз он их не удивит.'); return; }
    g.f[FLAG[id]] = true;
    g.sfx('boo');
    yield g.say('sam', text);
    if (!g.seen.abeReads) {
      g.seen.abeReads = 1;
      yield g.say('chuckles', 'Эйб. Читай что написано.');
      yield g.say('lincoln', 'Я и читаю.');
    }
    yield E.announce(g, 'Линкольн теряет десять процентов. ' + numbers(g));
    yield* E.checkVote(g);
  }

  const ISSUES = [
    ['school', 'church', 'Как вы относитесь к церкви и школе?'],
    ['waste', 'barrel', 'Что вы сделаете с ядовитыми отходами?'],
    ['tax', 'money', 'Опишите ваш налоговый план.'],
    ['poor', 'bread', 'Как вы поможете голодным?']
  ];

  TALK.issues = {
    options: ISSUES.map(([id, icon, text]) => ({ id, icon, text, run: function* (g) { yield* askIssue(g, id); } })).concat([
      { id: 'family', icon: 'heart', text: 'Стране нужны семейные ценности. У вас они есть?', run: function* (g) {
        yield g.say('lincoln', 'На этот вопрос я отвечу без бумажки.');
        yield g.say('lincoln', 'Я верен Мэри Тодд Линкольн больше полутора веков. Другой женщины в моей жизни нет.');
        g.sfx('applause');
        g.f.knowFamily = true;
        yield E.announce(g, 'Рейтинг Линкольна держится. Избирательницы вздыхают.');
        yield g.say('sam', 'Полтора века верности.');
        yield g.say('max', 'Он каменный, Сэм! Каменным легко!');
      } },
      { id: 'bye', icon: 'bye', text: 'С вопросами пока всё.', end: true, run: function* (g) { g.endDialog(); yield g.talkTo('debate'); } }
    ])
  };

  TALK.debate = {
    options: [
      { id: 'issues', icon: 'issues', text: 'Поговорим о проблемах страны.', end: true, run: function* (g) { g.endDialog(); yield g.talkTo('issues'); } },
      { id: 'max', icon: 'f:max', text: 'Слово кандидату Максу.', run: function* (g) {
        const max = g.actors.max;
        max.act = 'grin'; max.actT = 1.6;
        yield g.say('max', MAX_SPEECH[(g.count('maxspeech') - 1) % MAX_SPEECH.length]);
        yield E.announce(g, 'Рейтинг Макса не изменился. Избиратели на всякий случай записали его приметы.');
      } },
      { id: 'cards', icon: 'card', text: 'Вы читаете ответы с карточек?', once: true, run: function* (g) {
        yield g.say('lincoln', 'Меня высекли из мрамора, когда налоговых планов ещё не придумали. Мне помогают.');
        yield g.say('chuckles', 'Карточки писала служба. Кандидат читает то, что стоит на стойке. Следующий вопрос.');
      } },
      { id: 'bye', icon: 'bye', text: 'Перерыв.', end: true, run: function* (g) {
        yield g.say('lincoln', 'Я подожду. Ждать я умею. Я полжизни просидел в кресле.');
      } }
    ]
  };

  function* recordSpeech(g) {
    const roach = g.actors.roach, li = g.actors.lincoln, sam = g.actors.sam;
    if (g.f.bugRec === 'lincoln') { yield g.say('sam', 'Речь Линкольна у жучка уже записана. От первого слова до последней цепи.'); return; }
    yield g.say('sam', 'Господин Линкольн, скажите нации несколько слов. Для истории.');
    yield E.bug(g, 'Иду на трибуну, сэр! Запоминаю дословно!');
    g.drop('roach');
    g.place('roach', 'lawn', sam.x + 8, sam.y, 'e');
    roach.visible = true; roach.scripted = true;
    yield g.walkTo('roach', 548, 158, { free: true, speed: 1.6 });
    roach.visible = false;
    li.act = 'point';
    for (const [, text] of E.SPEECH) yield g.say('lincoln', text);
    li.act = 'lapel';
    roach.visible = true;
    yield g.walkTo('roach', sam.x + 6, sam.y, { free: true, speed: 1.6 });
    g.place('roach', 'nowhere', 0, 0);
    roach.scripted = false;
    g.give('roach');
    g.f.bugRec = 'lincoln';
    yield E.bug(g, 'Записано, сэр! Семь фраз, сэр! Воспроизвожу любую!');
    yield g.say('max', 'Красивая речь, Эйб! Жаль, рот у тебя открывается, как почтовый ящик!');
    yield g.say('lincoln', 'Кролик. После выборов я на тебя наступлю. В духе демократии.');
  }

  function* placeCard(g, id) {
    if (g.f.rampage) { yield g.say('sam', 'Читать карточки больше некому.'); return; }
    yield g.anim('sam', 'reach', 0.5);
    g.drop(id);
    g.f.cards.unshift(id);
    g.sfx('click');
    yield g.say('sam', 'Сверху теперь «' + E.CARDS[id] + '» Почерк не Чаклза, но мрамор в почерках не разбирается.');
  }

  TALK.superball = {
    start: function* (g) {
      if (g.seen.superHi) return;
      g.seen.superHi = 1;
      const sb = g.actors.superball;
      sb.act = 'report';
      yield g.say('superball', 'База, я Суперболл. У парадной двери двое: пёс в шляпе и кролик без штанов. Уровень угрозы уточняю.');
      sb.act = 'block';
    },
    options: [
      { id: 'in', icon: 'keyhole', text: 'Нам нужно к президенту.', run: function* (g) {
        yield g.say('superball', 'Ответ отрицательный. Президент не принимает.');
        yield g.say('sam', 'Совсем?');
        yield g.say('superball', 'Он принимает законы. Посетителей не принимает.');
      } },
      { id: 'who', icon: 'f:superball', text: 'Кто вы?', run: function* (g) {
        yield g.say('superball', 'Агент Суперболл, Секретная служба.');
        yield g.say('sam', 'Суперболл?');
        yield g.say('superball', 'Позывной. В шестидесятых я работал вышибалой. Мяч тоже отскакивает. Начальству понравилось.');
      } },
      { id: 'duty', icon: 'phone', text: 'Вы когда-нибудь отходите от двери?', run: function* (g) {
        yield g.say('superball', 'Ответ отрицательный. Исключение одно: служебный телефон в будке. Отвечать на него входит в мои обязанности.');
        yield g.say('superball', 'Указания, полученные по служебной линии, я выполняю.');
        g.f.knowDuty = true;
      } },
      { id: 'boss', icon: 'f:agentc', text: 'Кто ваш начальник?', run: function* (g) {
        yield g.say('superball', 'Начальник службы. Позывной «Папа-Медведь». Остальное секретно.');
        yield g.say('superball', 'Позывной тоже был секретным. Прошу его забыть.');
        g.f.knowPapa = true;
      } },
      { id: 'bite', icon: 'f:max', text: 'А если я вас укушу?', speaker: 'max', run: function* (g) {
        yield g.say('superball', 'Укус федерального агента. От пяти до десяти. Рекомендую воздержаться.');
        yield g.say('max', 'От пяти до десяти укусов?');
        yield g.say('superball', 'Лет.');
      } },
      { id: 'trick', icon: 'q', text: 'Макс, этого не проведёшь.', once: true, run: function* (g) {
        yield g.say('superball', 'Я вас слышу. У меня наушник.');
      } },
      { id: 'bye', icon: 'bye', text: 'Служите дальше.', end: true, run: function* (g) {
        yield g.say('superball', 'Служу.');
      } }
    ]
  };

  TALK.jimmy4 = {
    start: function* (g) {
      if (!g.seen.jimmy104) { g.seen.jimmy104 = 1; yield g.say('jimmy', 'Начальник! И здесь нашёл. Я в отпуске, у меня круг и коктейль.'); }
    },
    options: [
      { id: 'what', icon: 'q', text: 'Что ты делаешь в пруду Белого дома?', run: function* (g) {
        yield g.say('jimmy', 'Отдыхаю. После казино мне нужен покой. Вода тут казённая, хлорка бесплатная.');
      } },
      { id: 'lobby', icon: 'swiss', text: 'Только отдыхаешь?', run: function* (g) {
        yield g.say('jimmy', 'Ну, заодно хлопочу. Субсидии на сыр. У нас в стенах тоже избиратели, начальник.');
        yield g.say('max', 'Джимми лоббист! Сэм, он растёт!');
      } },
      { id: 'sub', icon: 'eye', text: 'Что за перископ у тебя за спиной?', run: function* (g) {
        yield g.say('jimmy', 'Сосед. Молчит, не мусорит, музыку не включает. Лучший сосед в моей жизни.');
      } },
      { id: 'pres', icon: 'f:pres', text: 'Ты видел президента?', when: g => !g.f.puppetDown, run: function* (g) {
        yield g.say('jimmy', 'В окне видел. Сидит ровно, моргает редко. Я таких встречал. В витрине у чучельника.');
      } },
      { id: 'abe', icon: 'f:lincoln', text: 'За кого голосуют крысы?', when: g => g.f.election, run: function* (g) {
        yield g.say('jimmy', g.f.elected ? 'Я за твоего ушастого голосовал. Четыре раза. Свои люди в комиссии.' : 'Статуя не ест. Кто не ест, тот крысе не друг. Я за ушастого.');
      } },
      { id: 'bye', icon: 'bye', text: 'Отдыхай, Джимми.', end: true, run: function* (g) {
        yield g.say('jimmy', 'И ты не напрягайся, начальник. Хотя тебе идёт.');
      } }
    ]
  };

  function* whizzerArrives(g) {
    const wz = g.actors.whizzer;
    g.hideUI = true;
    g.place('whizzer', 'lawn', 176, 146, 'e');
    wz.visible = true; wz.scripted = true; wz.act = ''; wz.keepAct = false;
    yield g.walkTo('whizzer', 296, 146);
    yield g.say('whizzer', 'С дороги! Губернатор идёт! У меня встреча с президентом, и я почти не хочу в туалет!');
    yield g.walkTo('whizzer', 336, 141);
    g.sfx('door');
    g.place('whizzer', 'oval', 150, 172, 'e');
    wz.scripted = false;
    g.f.whizzerIn = true;
    yield g.say('sam', 'Это был Уиззер. С лентой через плечо и золотой звездой.');
    yield g.say('max', 'Губернатор! Сэм, его же выбирали только в «Попперах»!');
    yield g.say('max', 'А в объявлении просили двух переводчиков! Нас двое, Сэм, и я знаю слово «ням»!');
    g.hideUI = false;
  }

  function* enterHouse(g) {
    if (!g.f.superHold && !g.f.puppetDown) {
      yield g.say('superball', 'Стоять. Дальше нельзя.');
      yield g.talkTo('superball');
      return;
    }
    g.sfx('door');
    yield* g.goRoom('oval', { x: 40, y: 172, dir: 'e' });
  }

  ROOMS.lawn = {
    id: 'lawn', name: 'Лужайка Белого дома', w: 640,
    music: g => g.f.election && !g.f.rampage ? 'campaign' : 'lawn',
    scale: [138, 0.82, 196, 1],
    paint: b => S.BG.lawn(b),
    walk: [[6, 138, 634, 138, 634, 196, 150, 196, 150, 152, 6, 152]],
    block: g => g.f.election ? [POND, MAILBOX, STAGE, STAND] : [POND, MAILBOX],
    layers: [
      { id: 'desoto', x: 4, y: 152, base: 200 },
      { id: 'mailbox', x: 138, y: 144, base: 174 },
      { id: 'nofeed', x: 176, y: 146, base: 169, when: g => !g.f.nofeedTaken },
      { id: 'golf', x: 272, y: 146, base: 176 },
      { id: 'periscope', x: 242, y: 166, base: 183, key: g => Math.floor(g.time * 0.7) % 2 },
      { id: 'stage', x: 502, y: 122, base: 176, when: g => g.f.election, key: g => g.f.rampage ? 'w' : '' },
      { id: 'cuestand', x: 472, y: 118, base: 166, when: g => g.f.election, key: g => g.f.cards[0] },
      { id: 'flyers', x: 516, y: 150, base: 177, when: g => g.f.election && !g.f.rampage },
      { id: 'poll', x: 588, y: 92, base: 140, when: g => g.f.election, key: g => { const p = E.poll(g); return p.lin + '.' + p.max; } },
      { id: 'steps', x: 566, y: 176, base: 177, when: g => g.f.rampage }
    ],
    sprites(g) {
      const j = g.actors.jimmy;
      const bob = Math.round(Math.sin(g.time * 2) * 1);
      return [{ y: 182, draw: (f, cx) => {
        const P = new S.Pen(f);
        P.part(P.ell(j.x - cx, 184 + bob, 11, 4), C.red, { b: 3 });
        P.part(P.ell(j.x - cx, 183 + bob, 6, 1.8), C.teal, { b: 2, sh: 0, hi: 0, ol: 0 });
      } }];
    },
    hot: [
      { id: 'desoto', name: 'Де Сото', rect: [6, 156, 130, 40], walk: [80, 148], face: 's', walkUse: true,
        look: 'Наш Де Сото на лужайке Белого дома. Припаркован в почтовый ящик. Ящик выдержал.',
        use: function* (g) { yield* S.openMap(g); } },
      { id: 'mailbox', name: 'Почтовый ящик', rect: [138, 144, 24, 30], walk: [168, 146], face: 'w',
        look: 'Почтовый ящик. Погнут нашим бампером. В столице ящики большие, будто нас тут ждали.',
        use: 'Выправлять не буду. Пусть останется след нашего визита.' },
      { id: 'monument', name: 'Монумент Вашингтона', rect: [34, 4, 22, 74],
        look: g => g.f.knowSilo ? 'Монумент Вашингтона. Ракета в побелке. Теперь я вижу швы.' : 'Монумент Вашингтона. Белый, острый и подозрительно свежий. Как будто его меняют.' },
      { id: 'house', name: 'Белый дом', rect: [150, 14, 360, 116],
        look: 'Белый дом. Покрашен так ровно, что хочется проверить пальцем. В кладовой, я видел, ещё три банки краски.' },
      { id: 'storage', name: 'Кладовая президента', rect: [196, 84, 28, 46], walk: [210, 140], face: 'n',
        look: g => g.f.elected ? 'Кладовая президента. В щель видно: краска, гирлянды, мангал и президент без головы. Прежний.' : 'Кладовая президента. В щель видно банки белой краски, ёлочные гирлянды и мангал.',
        use: 'Заперто. Ключ, наверное, у завхоза нации.' },
      { id: 'nobills', name: 'Табличка', rect: [230, 90, 32, 22], walk: [246, 140], face: 'n',
        look: '«Не клей». Табличка приклеена к стене. Чем её клеили, стена умалчивает.',
        use: 'Не отдерёшь. Клеили на совесть, вопреки собственному запрету.' },
      { id: 'door', name: 'Дверь Белого дома', rect: [308, 76, 44, 52], walk: [354, 146], face: 'n',
        look: g => g.f.superHold || g.f.puppetDown ? 'Дверь Белого дома. Никем не охраняется. Впервые за двести лет.' : 'Дверь Белого дома. Перед ней агент, и он не моргает.',
        use: function* (g) { yield* enterHouse(g); },
        exit: function* (g) { yield* enterHouse(g); } },
      { id: 'payphone', name: 'Таксофон', rect: [416, 66, 34, 66], walk: [432, 142], face: 'n',
        look: function* (g) {
          if (g.f.superHold && !g.f.puppetDown) { yield g.say('sam', 'Будка занята. Суперболл держит трубку и ждёт. По-моему, он может ждать до следующих выборов.'); return; }
          g.f.knowNumber = true;
          yield g.say('sam', 'Таксофон Белого дома, служебная линия. На диске номер: ' + E.NUMBER + '.');
          if (!g.seen.numberHint) { g.seen.numberHint = 1; yield g.say('max', 'Запомни его, Сэм! Будем звонить и дышать в трубку!'); }
        },
        use: function* (g) {
          if (g.f.superHold && !g.f.puppetDown) { yield g.say('superball', 'Тихо. Я на линии.'); return; }
          g.f.knowNumber = true;
          yield g.say('sam', 'Автомат берёт только двухдолларовые купюры. У меня таких нет. Их ни у кого нет.');
          yield g.say('sam', 'Номер на диске: ' + E.NUMBER + '. Будка работает в одну сторону: сюда.');
        } },
      { id: 'valet', name: 'Жёлтая табличка', rect: [457, 103, 28, 34], walk: [470, 142], face: 'n',
        look: '«Парковка только для слуг народа». Ниже мелко: «Народ паркуется в Мэриленде».',
        use: 'Вкопана намертво. Слуги народа своего не отдают.' },
      { id: 'pond', name: 'Пруд', rect: [152, 170, 116, 24], walk: [212, 164], face: 's',
        look: 'Пруд перед Белым домом. В нём плавают крыса на надувном круге и чей-то перископ.',
        use: 'Купаться я не стану. Костюм один, и тот при исполнении.',
        items: { dater: function* (g) { g.sfx('scan'); yield g.say('sam', 'Воде в пруду двести лет. Меняли её, судя по запаху, однажды.'); } } },
      { id: 'periscope', name: 'Перископ', rect: [241, 165, 11, 17], walk: [246, 164], face: 's', over: true,
        look: 'Из пруда торчит перископ. Он смотрит на Джимми. Джимми делает вид, что не замечает.',
        use: 'Стучать по перископу невежливо. Там люди на службе.',
        talk: function* (g) { yield g.say('sam', 'Эй, на лодке!'); yield 0.8; yield g.say('sam', 'Перископ отвернулся. Обиделся или засекречен.'); } },
      { id: 'nofeed', name: 'Табличка «Не кормить!»', rect: [176, 146, 24, 24], walk: [188, 164], face: 's', when: g => !g.f.nofeedTaken,
        look: '«Не кормить!» Под надписью нарисована подводная лодка. Кого-то уже пытались угостить.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.5);
          g.f.nofeedTaken = true;
          g.give('nofeed');
          yield g.say('sam', 'Лодка посидит на диете без напоминаний.');
        } },
      { id: 'golf', name: 'Флажок', rect: [272, 146, 14, 30], walk: [286, 170], face: 'w',
        look: 'Флажок для гольфа. «Лунка девять». Остальные восемь, видимо, в других ведомствах.',
        use: 'Пусть торчит. Гольф у президентов вместо раздумий.' },
      { id: 'stage', name: g => g.f.rampage ? 'Сломанная сцена' : 'Сцена', rect: [502, 142, 136, 34], walk: [520, 184], face: 'n', when: g => g.f.election,
        look: g => g.f.rampage ? 'Сцена проломлена в двух местах. Размер ноги у него, выходит, около ста сорокового.' : 'Сцена для дебатов. Трибуна, два микрофона и гирлянды в три цвета. Сколочено за час из того, что было в кладовой.' },
      { id: 'cuestand', name: 'Стойка с карточками', rect: [472, 118, 30, 46], walk: [462, 170], face: 'e', when: g => g.f.election,
        look: function* (g) { yield g.say('sam', 'Стойка с карточками для Линкольна. Сверху стоит: «' + E.CARDS[g.f.cards[0]] + '» Карточек в стопке: ' + g.f.cards.length + '.'); },
        use: function* (g) {
          if (g.f.rampage) { yield g.say('sam', 'Листать незачем. Читать их больше некому.'); return; }
          yield g.anim('sam', 'reach', 0.4);
          g.f.cards.push(g.f.cards.shift());
          g.sfx('click');
          yield g.say('sam', 'Теперь сверху: «' + E.CARDS[g.f.cards[0]] + '»');
          if (!g.seen.cardPeek) { g.seen.cardPeek = 1; yield g.say('max', 'Чаклз даже не глянул! Он следит за избирателями, а карточки для него мебель!'); }
        },
        items: {
          poster: function* (g) { yield* placeCard(g, 'poster'); },
          delivery: function* (g) { yield* placeCard(g, 'delivery'); },
          nofeed: function* (g) { yield* placeCard(g, 'nofeed'); },
          flyer: 'Листовка мелкая. С шести метров он её не прочтёт.',
          ribbon: 'Лента без слов. Читать на ней нечего.'
        } },
      { id: 'flyers', name: 'Листовки', rect: [516, 150, 18, 10], walk: [524, 184], face: 'n', over: true, when: g => g.f.election && !g.f.rampage,
        look: 'Стопка листовок на краю сцены. На каждой Линкольн и слова: «Ты нужен мне!»',
        use: function* (g) {
          if (g.has('flyer')) { yield g.say('sam', 'Одна листовка у меня уже есть. Второго Линкольна я не унесу.'); return; }
          yield g.anim('sam', 'reach', 0.4);
          g.f.flyerTaken = true;
          g.give('flyer');
          yield g.say('sam', '«Ты нужен мне!» и список достоинств. Написано так, будто он ищет жену.');
        } },
      { id: 'poll', name: 'Табло рейтинга', rect: [588, 92, 52, 46], walk: [600, 184], face: 'n', when: g => g.f.election,
        look: function* (g) { yield g.say('sam', g.f.elected ? 'Табло замерло на итогах. Никто уступил кролику восемь процентов.' : 'Табло рейтинга. ' + numbers(g) + ' Никто идёт третьим и пока не сказал ни слова.'); } },
      { id: 'steps', name: 'Следы', rect: [566, 177, 64, 19], walk: [556, 190], face: 'e', when: g => g.f.rampage,
        look: 'Следы Линкольна в газоне. Глубиной по колено. Ведут на север, через клумбу и дальше через забор.' }
    ],
    actors: {
      superball: {
        name: 'Агент Суперболл', when: g => g.actors.superball.room === 'lawn',
        look: g => g.f.superHold ? 'Суперболл стоит в будке с трубкой у уха и ждёт. Лицо у него такое же, как при любом другом занятии.' : 'Агент Секретной службы. Чёрный костюм, тёмные очки, наушник. Причёска стоит по стойке «смирно».',
        talk: function* (g) {
          if (g.f.superHold) { yield g.say('superball', g.count('holdtalk') % 2 ? 'Тихо. Я на линии.' : 'Мой звонок очень важен для них. Так сказали.'); return; }
          yield g.talkTo('superball');
        },
        items: {
          roach: function* (g) { yield* E.bugPlant(g, 'superball'); },
          gun: function* (g) { yield g.say('superball', 'Оружие. Незарегистрированное. База, записываю номер. Номера нет. Записываю «нет».'); },
          glove: function* (g) { yield g.say('superball', 'Нападение с перчаткой. От трёх до пяти. Рекомендую передумать.'); },
          max: function* (g) { yield g.say('max', 'Можно потрогать вашу причёску?'); yield g.say('superball', 'Ответ отрицательный. Она на службе.'); }
        }
      },
      jimmy: {
        name: 'Джимми Два Зуба', walk: [212, 164], face: 's', pad: 8, when: g => g.actors.jimmy.room === 'lawn',
        look: 'Джимми Два Зуба на надувном круге. В лапе коктейль с зонтиком. Зонтик, судя по размеру, от настоящего коктейля.',
        talk: function* (g) { yield g.talkTo('jimmy4'); },
        items: {
          roach: function* (g) { yield* E.bugPlant(g, 'jimmy'); },
          gun: 'Стрелять в отдыхающего? Отпуск у него первый в жизни. Пусть доплавает.',
          serum: function* (g) { yield g.say('jimmy', 'Наливаешь? Давай. Правда такая: скрепки из твоего стола брал я. Остальное неправда.'); },
          dater: function* (g) { g.sfx('scan'); yield g.say('jimmy', 'Убери машинку, начальник. Крысы не стареют. Крысы матереют.'); },
          nofeed: function* (g) { yield g.say('jimmy', 'Табличку унёс? Правильно. Меня кормить можно.'); },
          head: function* (g) { yield g.say('jimmy', 'Голова президента? Дам за неё два сыра. Нет? Тогда не маши ею над водой.'); },
          max: function* (g) { yield g.say('max', 'Джимми, давай я тебя покатаю! По дну!'); yield g.say('jimmy', 'Отойди, ушастый. У меня путёвка.'); }
        }
      },
      lincoln: {
        name: 'Авраам Линкольн', walk: [530, 184], face: 'n', when: g => g.actors.lincoln.room === 'lawn',
        look: 'Мемориал Линкольна в полный рост. Шесть метров мрамора, цилиндр и лента через грудь. На плече у него сидит Чаклз и шепчет в каменное ухо.',
        talk: function* (g) {
          if (!g.f.maxRuns) yield* register(g);
          yield g.talkTo('debate');
        },
        items: {
          roach: function* (g) { yield* recordSpeech(g); },
          gun: 'Стрелять в мрамор? Пуля отскочит и вернётся с претензией.',
          glove: 'До его головы шесть метров. Перчатка не дотянется, Макс не допрыгнет.',
          flyer: 'Свою листовку он уже читал. Точнее, ему её читали.',
          poster: TO_STAND,
          delivery: TO_STAND,
          nofeed: TO_STAND,
          serum: 'Поить статую? Рот у неё открывается, как почтовый ящик, а внутри гидравлика.',
          head: function* (g) { yield g.say('lincoln', 'Мой предшественник. Он потерял голову. Со мной этого не случится.'); yield g.say('max', 'Это мы ещё проверим!'); },
          max: function* (g) { yield g.say('max', 'Эй, Эйб! У тебя на плече что-то сидит! Похоже на начальника охраны!'); yield g.say('lincoln', 'Это мой советник. Он лёгкий.'); }
        }
      },
      chuckles: {
        name: 'Чаклз', walk: [530, 184], face: 'n', when: g => g.actors.chuckles.room === 'lawn',
        look: 'Чаклз сидит на плече у Линкольна, как попугай у пирата. Только в этой паре командует попугай.',
        talk: function* (g) { yield g.say('chuckles', 'Ведущий, вопросы задают кандидату. Я просто сижу.'); },
        items: {
          roach: 'Жучку туда не забраться. Шесть метров мрамора, и ни одной щели.',
          gun: 'Стрелять в главу Секретной службы на глазах у избирателей? Рейтингу Макса это не поможет. Хотя кто знает.',
          glove: 'Не достану. Он забрался высоко и знает это.'
        }
      }
    },
    enter: function* (g, from) {
      if (!g.f.lawnSeen) {
        g.f.lawnSeen = true;
        yield g.say('max', 'Отличная парковка, Сэм! Почтовый ящик почти цел!');
        yield g.say('sam', 'Вашингтон, Макс. Газон стрижен, дом побелен, у двери человек в чёрном. Всё как на открытке.');
      }
      if (from === 'oval' && g.f.presMet && !g.f.whizzerIn) yield* whizzerArrives(g);
    },
    setup(g) {
      const sb = g.actors.superball, li = g.actors.lincoln, ch = g.actors.chuckles, j = g.actors.jimmy;
      g.place('jimmy', 'lawn', 214, 184, 'e');
      j.visible = true; j.act = 'peek'; j.keepAct = true;
      if (!g.f.puppetDown) {
        if (g.f.superHold) { g.place('superball', 'lawn', 433, 140, 's'); sb.act = 'phone'; }
        else { g.place('superball', 'lawn', 330, 141, 's'); sb.act = 'block'; }
        sb.keepAct = true; sb.visible = true;
      } else if (sb.room === 'lawn') g.place('superball', 'oval', 446, 150, 's');
      if (g.f.election && !g.f.rampage) {
        g.place('lincoln', 'lawn', 552, 160, 's');
        li.visible = true; li.act = 'lapel'; li.keepAct = true; li.scripted = false;
        g.place('chuckles', 'lawn', 575, 69, 's');
        ch.visible = true; ch.act = 'sit'; ch.keepAct = true; ch.scale = 0.5; ch.z = 96;
      }
    },
    drawFront(f, g, cx) {
      const sb = g.actors.superball;
      if (sb.room !== 'lawn' || sb.act !== 'phone') return;
      for (let y = 74; y < 128; y++) for (let x = 420; x < 446; x++) if ((x + y * 2) % 5 === 0) f.set(x - cx, y, C.sky[4]);
      for (let y = 72; y < 132; y++) for (const x of [416, 417, 418, 419, 446, 447, 448, 449]) f.set(x - cx, y, x % 4 === 0 ? C.blue[1] : C.blue[2]);
    },
    update(g) {
      const j = g.actors.jimmy;
      if (j.room === 'lawn') j.y = 184 + Math.round(Math.sin(g.time * 2));
    },
    onLoad(g) { ROOMS.lawn.setup(g); }
  };

  E.lawn = { whizzerArrives, victory, register, askIssue, recordSpeech };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
