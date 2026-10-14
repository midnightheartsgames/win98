(function (S) {
  'use strict';
  const { COLORS } = S;
  const E = S.EP201;
  const { ROOMS, TALK } = E;

  const pedro = function* (g) {
    if (g.seen.pedroHere) return;
    g.seen.pedroHere = 1;
    const p = g.actors.pedro;
    p.scripted = true;
    g.place('pedro', g.roomId, 330, 176, 'w');
    g.sfx('banjo');
    yield g.walkTo('pedro', 200, 176);
    p.act = 'sing'; p.keepAct = true;
    yield g.say('pedro', 'Кто-то сказал «день рождения»?!');
    g.music('past21');
    yield g.say('pedro', 'С днём рожденья, сержант! Пусть родня не найдёт! Пусть таракан-именинник проживёт ещё год!');
    p.act = ''; p.keepAct = false;
    g.sfx('applause');
    yield g.walkTo('pedro', 340, 176);
    g.place('pedro', 'nowhere', 0, 0);
    p.scripted = false;
    g.music('diner21');
    yield g.say('sam', 'Мариачи пришёл, спел и ушёл. Никто его не звал. Кажется, его вообще не зовут.');
  };

  E.quizWon = function* (g) {
    g.f.pestGot = true;
    g.give('pest');
    g.anim('stinky', 'shrug', 1.6);
    yield g.say('stinky', 'Сэм-Макс победил. Ну и ладно. Этого всадника мне подарили. То есть прислали. Без записки.');
    yield g.say('stinky', 'Пусть забирает. У меня от него всё равно ни одного таракана в зале. Скучно.');
    yield g.say('max', 'Сэм! Ты умнее Сибил! Хотя нет, ты просто хитрее!');
  };

  TALK.stinky = {
    start: function* (g) {
      if (g.seen.stinkyHello) return;
      g.seen.stinkyHello = 1;
      g.anim('stinky', 'phone', 2);
      yield g.say('stinky', 'Нет, я не убила дедушку. Он уехал. Всё, у меня клиенты. Добро пожаловать к Стинки! Вы Стэн и Макс?');
      yield g.say('sam', 'Сэм и Макс.');
      yield g.say('stinky', 'Я так и сказала.');
    },
    options: [
      { id: 'who', icon: 'f:stinky21', text: 'Ты кто такая?', run: function* (g) {
        yield g.say('stinky', 'Стинки. Внучка старого Стинки. Он уехал в экспедицию, а меня оставил за главную. Я переделала всё, кроме вывески.');
        yield g.say('sam', 'Старик Стинки кормил нас годами. Ни разу не говорил, что у него есть внучка.');
        yield g.say('stinky', 'Он и про экспедицию не говорил. Просто однажды утром его не стало. В смысле, он уехал.');
        g.f.knowGramps = true;
      } },
      { id: 'gramps', icon: 'q', text: 'Где сейчас старый Стинки?', when: g => g.f.knowGramps, run: function* (g) {
        yield g.say('stinky', 'В экспедиции. Далеко. Где-то, где нет телефона. И почты. И вообще ничего нет.');
        yield g.say('max', 'Сэм, она его съела! Или закопала! Или съела, а потом закопала!');
        yield g.say('stinky', 'Я не понимаю, о чём говорит ваш кролик.');
      } },
      { id: 'famous', icon: 'star21', text: 'Тут бывают знаменитости?', run: function* (g) {
        yield g.say('stinky', 'Постоянно. Президенты, короли. Один раз заходил шеф-повар из Парижа и сказал, что мой суп лучше его жизни.');
        yield g.say('max', 'Я президент! Я тут впервые!');
        yield g.say('stinky', 'Президенты всегда так говорят.');
      } },
      { id: 'feet', icon: 'foot21', text: 'Как идут дела?', run: function* (g) {
        yield g.say('stinky', 'Ноги гудят. Целый день на каблуках, а ванночку для ног мне обещал подарить один хоккеист. Знаменитый. Не подарил.');
        yield g.say('stinky', 'Я написала Санте. Санта молчит. Наверное, тоже знаменитый.');
        g.f.knowFeet = true;
      } },
      { id: 'quiz', icon: 'quiz21', text: 'Сыграем в викторину.', when: g => !g.f.pestGot, say: true, end: true, run: function* (g) {
        g.endDialog();
        if (!g.seen.quizRules) {
          g.seen.quizRules = 1;
          g.anim('stinky', 'host', 1.6);
          yield g.say('stinky', 'Правила! Три вопроса. Приз получит тот, кто ответит верно на все три. Пока не получил никто. Никогда.');
          yield g.say('sybil', 'Потому что правильный ответ у неё всегда тот, который никто не назвал.');
          yield g.say('stinky', 'Это называется интрига.');
        }
        yield* E.startQuiz(g);
      } },
      { id: 'prize', icon: 'pest21', text: 'Откуда у тебя этот всадник?', when: g => !g.f.pestGot, run: function* (g) {
        yield g.say('stinky', 'Пришёл в коробке. «Закусочной у Стинки, от Санты». Я поставила его на стойку, и тараканы ушли. Все. Даже те, что жили в тостере.');
      } },
      { id: 'sock', icon: 'sock21', text: 'Как тебе ванночка?', when: g => g.f.giftStinky, run: function* (g) {
        yield g.say('stinky', 'Санта всё-таки знаменитый. Пираньи щекочут пятки. Носки я сняла, и вам того же желаю.');
      } },
      { id: 'bye', icon: 'bye', text: 'Счастливо, Стинки.', end: true, run: function* (g) { yield g.say('stinky', 'Заходите, Сэд и Мокс!'); } }
    ]
  };

  TALK.sybil = {
    options: [
      { id: 'date', icon: 'f:sybil', text: 'Сибил, у вас свидание?', run: function* (g) {
        yield g.say('sybil', 'Второе. После хоккея. Эйб стоял в воротах, я болела. Против нас. Так интереснее.');
        yield g.say('lincoln', 'Сударыня была беспощадна к моей обороне. Я покорён.');
      } },
      { id: 'job', icon: 'badge', text: 'Как работа?', run: function* (g) {
        yield g.say('sybil', 'Робот перенёс мою канцелярию через дорогу. Теперь я королева без адреса. Сижу тут и думаю, кем быть дальше.');
        yield g.say('sybil', 'Между профессиями тоже профессия, Сэм. Платят только хуже.');
      } },
      { id: 'quiz', icon: 'quiz21', text: 'Ты всегда отвечаешь правильно?', run: function* (g) {
        yield g.say('sybil', 'Всегда. Это бесит Стинки, а меня успокаивает.');
        yield g.say('sybil', 'Я пробовала ошибиться нарочно. Не получается. Правильный ответ сам выпрыгивает изо рта.');
      } },
      { id: 'bye', icon: 'bye', text: 'Не буду мешать.', end: true }
    ]
  };

  TALK.lincoln = {
    options: [
      { id: 'hi', icon: 'f:lincoln21', text: 'Как вы, мистер президент?', run: function* (g) {
        yield g.say('lincoln', 'Счастлив, сэр. Сударыня позволила мне сопровождать её в это заведение. Я выбрал столик у окна, дабы видеть снег.');
      } },
      { id: 'quiz', icon: 'quiz21', text: 'Вы играете в викторину?', run: function* (g) {
        yield g.say('lincoln', 'Играю, сэр, но знаний моих не хватает. Всё, что я знаю, кончается тысяча восемьсот шестьдесят пятым годом.');
        yield g.say('lincoln', 'Подскажите мне ответ, сэр, и я его повторю. Вы уже однажды говорили за меня. Вышло недурно.');
      } },
      { id: 'gift', icon: 'moai21', text: 'Что бы вы хотели на Рождество?', run: function* (g) {
        yield g.say('lincoln', 'Друга, сэр. Такого же каменного. Сударыня прекрасна, но она мягкая. Иногда хочется помолчать с кем-нибудь твёрдым.');
      } },
      { id: 'bye', icon: 'bye', text: 'Приятного вечера.', end: true }
    ]
  };

  TALK.bug = {
    options: [
      { id: 'hi', icon: 'f:bug21', text: 'Сержант, что вы тут делаете?', run: function* (g) {
        yield g.say('bug', 'Сэр! Скрываюсь, сэр! От семьи, сэр! Рождество, сэр! Они меня ищут!');
      } },
      { id: 'family', icon: 'q', text: 'Чем плоха семья?', run: function* (g) {
        yield g.say('bug', 'Мама, сестра, брат и сорок два племянника, сэр! Каждый год меня целуют все сорок пять, сэр!');
        yield g.say('bug', 'Здесь безопасно, сэр. На стойке стоит всадник. Тараканы обходят его, как карантин.');
      } },
      { id: 'quiz', icon: 'quiz21', text: 'Почему вы всегда отвечаете «Г»?', run: function* (g) {
        yield g.say('bug', 'Устав, сэр! «Г» значит главный калибр! Отступать от «Г» не положено, сэр!');
      } },
      { id: 'bye', icon: 'bye', text: 'Вольно, сержант.', end: true, run: function* (g) { yield g.say('bug', 'Есть вольно, сэр!'); } }
    ]
  };

  function* takeSock(g) {
    yield g.anim('sam', 'reach', 0.5);
    g.f.sockGot = true;
    g.give('sock');
    yield g.say('stinky', 'Эй, Сэмми-Мэкс! Это мой носок!');
    yield g.say('sam', 'Изымается как улика. Чья, пока не скажу.');
  }

  const DOOR = {
    id: 'door', name: 'Выход на улицу', rect: [4, 40, 28, 92], walk: [36, 170], face: 'w',
    look: 'Дверь на улицу. Колокольчик над ней звенит рождественским звоном и немного фальшивит.',
    exit: function* (g) { g.sfx('door'); yield* g.goRoom('street', { x: 790, y: 146, dir: 's' }); }
  };

  ROOMS.stinky = {
    id: 'stinky', name: 'Закусочная «У Стинки»', w: 320, music: 'diner21',
    paint: b => S.BG.diner21(b, {}),
    walk: [[8, 152, 176, 152, 176, 158, 316, 158, 316, 198, 8, 198]],
    layers: [
      { id: 'booth', x: 34, y: 72, base: 130 },
      { id: 'quizboard', x: 178, y: 62, base: 151 },
      { id: 'stinkycounter', x: 176, y: 100, base: 152 },
      { id: 'prize', x: 290, y: 70, base: 153, when: g => !g.f.pestGot },
      { id: 'sugar', x: 240, y: 84, base: 153 },
      { id: 'bath', x: 268, y: 140, base: 155, when: g => g.f.giftStinky, key: g => Math.floor(g.time * 3) % 6 },
      { id: 'sock', x: 298, y: 108, base: 154, when: g => g.f.giftStinky && !g.f.sockGot }
    ],
    hot: [
      DOOR,
      { id: 'counter', name: 'Стойка', rect: [176, 100, 144, 52], walk: [220, 162], face: 'n',
        look: 'Стойка. Розовая, в блёстках. Раньше тут было всё в канатах и якорях, старый Стинки любил море.',
        use: 'Стойка липкая. Протирать её не моя работа.' },
      { id: 'prize', name: 'Всадник на стойке', rect: [290, 70, 28, 32], when: g => !g.f.pestGot, walk: [290, 162], face: 'n', over: true,
        look: 'Всадник Мора на золотой подставке. Приз викторины. Тараканов в закусочной нет ни одного, что для закусочной подозрительно.',
        use: function* (g) { yield g.say('stinky', 'Руки! Это приз! Его можно только выиграть. А выиграть нельзя.'); } },
      { id: 'sock', name: 'Носок Стинки', rect: [298, 108, 16, 22], when: g => g.f.giftStinky && !g.f.sockGot, walk: [288, 162], face: 'n', over: true,
        look: 'Носок Стинки. Висит на краю стойки и сохнет. Розовый, в ракушках.',
        use: function* (g) { yield* takeSock(g); } },
      { id: 'bath', name: 'Ванночка для ног', rect: [268, 140, 34, 16], when: g => g.f.giftStinky, walk: [266, 172], face: 'e',
        look: 'Ванночка с пираньями. Подарок Санты. Стинки опустила в неё ноги, и пираньи ведут себя прилично. Им тоже страшно.',
        use: 'Совать туда лапу? Пираньи только притворяются вежливыми.' },
      { id: 'menu', name: 'Меню', rect: [212, 12, 104, 50], walk: [262, 162], face: 'n',
        look: ['Меню. «Суп дня». Какого дня, не указано.', '«Сэндвич Нептун». В скобках: «рыба по сезону». Какой сезон, тоже не указано.', '«Пирог „Сюрприз“». Сюрприз, судя по цене, в счёте.'] },
      { id: 'quizboard', name: 'Доска викторины', rect: [178, 62, 62, 30], walk: [206, 162], face: 'n',
        look: '«Викторина. Приз: Мор». Под надписью мелом счёт побед за месяц: «Стинки: все. Остальные: ноль».' },
      { id: 'windows', name: 'Окна', rect: [44, 18, 158, 42], walk: [120, 158], face: 'n', look: 'За окнами улица и снег. Робот снаружи лежит красиво, как рождественская инсталляция.' },
      { id: 'booth', name: 'Столик', rect: [34, 92, 126, 36], walk: [100, 160], face: 'n', look: 'Третий столик. Сибил и голова Линкольна держатся за руку. Точнее, Сибил держит руку у лица Линкольна.' }
    ],
    actors: {
      stinky: {
        name: 'Стинки', walk: [270, 164], face: 'n',
        look: 'Стинки. Высокая, с бирюзовыми волосами, в короне и фартуке с русалкой. Говорит, что она внучка старого Стинки. Говорит она много.',
        talk: function* (g) { yield g.talkTo('stinky'); },
        use: 'Хозяйку за стойкой я не трогаю. У неё телефон с длинным шнуром.',
        items: {
          gun: function* (g) { yield g.say('stinky', 'В закусочной не стреляют! Это было в правилах! Наверное.'); },
          pest: function* (g) { yield g.say('stinky', 'Мой всадник! Без него у меня в тостере опять поселятся.'); yield g.say('sam', 'Тостер переживёт.'); },
          sock: function* (g) { yield g.say('stinky', 'Отдай! Хотя нет, оставь. Он уже ношеный тобой.'); },
          max: function* (g) { yield g.say('max', 'Стинки! Признавайся, где дедушка!'); yield g.say('stinky', 'Я не понимаю, о чём говорит ваш кролик.'); },
          '*': function* (g) { yield g.say('stinky', 'Мне такое не надо. Мне дарили и лучше. Один принц, например.'); }
        }
      },
      sybil: {
        name: 'Сибил', walk: [96, 162], face: 'n',
        look: 'Сибил. Без короны, в пальто. Сидит напротив головы Линкольна и выглядит довольной, что с ней бывает редко.',
        talk: function* (g) { yield g.talkTo('sybil'); },
        use: 'Не буду мешать свиданию.',
        items: { gun: function* (g) { yield g.say('sybil', 'Сэм, только не при Эйбе. Стрелять будешь после десерта.'); }, '*': function* (g) { yield g.say('sybil', 'Сэм, у меня свидание. Это ты мне что, подарок принёс?'); } }
      },
      lincoln: {
        name: 'Голова Линкольна', walk: [96, 162], face: 'n',
        look: 'Голова Линкольна на тележке. Мраморная, торжественная. Под Рождество ему повязали шарф.',
        talk: function* (g) { yield g.talkTo('lincoln'); },
        use: 'Катать президента по закусочной без его согласия? Нет.',
        items: { gun: function* (g) { yield g.say('lincoln', 'Сэр, в меня уже стреляли. Это было в театре, и мне не понравилось.'); }, '*': function* (g) { yield g.say('lincoln', 'Благодарю, сэр, но мне нечем это держать.'); } }
      },
      bug: {
        name: 'Сержант Жучок', walk: [250, 162], face: 'n',
        look: 'Сержант Жучок. Сидит на стойке у сахарницы, в маскировочной салфетке. Под Рождество он всегда в бегах.',
        talk: function* (g) { yield g.talkTo('bug'); },
        use: 'Брать сержанта в лапы не положено. Он кусается по уставу.',
        items: { gun: function* (g) { yield g.say('bug', 'Сэр! Никак нет, сэр! Я свой!'); }, snow: function* (g) { yield g.say('bug', 'Сэр! Здесь не учебка, сэр! Снег не по сезону!'); }, '*': function* (g) { yield g.say('bug', 'Сэр! Не могу принять, сэр! Руки заняты маскировкой!'); } }
      }
    },
    setup(g) {
      g.place('stinky', 'stinky', 276, 146, 's');
      g.place('sybil', 'stinky', 70, 128, 's');
      g.place('lincoln', 'stinky', 124, 129, 'w');
      g.place('bug', 'stinky', 256, 102, 'w');
      g.actors.lincoln.scale = 0.62;
      g.actors.bug.z = 60;
    }
  };

  TALK.stinkyx = {
    options: [
      { id: 'what', icon: 'f:stinky21', text: 'Что тут творится, Стинки?', run: function* (g) {
        yield g.say('stinky', 'Рождество, вот что! Пришла семья сержанта. Вся. Они в супе, в тостере, в кассе и, кажется, в моих волосах!');
        yield g.say('stinky', 'Неделю назад какие-то Сэм и Макс выиграли моего всадника. С тех пор тараканы вернулись. С родственниками.');
        g.f.presentKnown = true;
      } },
      { id: 'bday', icon: 'cake21', text: 'Почему они все здесь?', run: function* (g) {
        yield g.say('stinky', 'У сержанта день рождения. В Рождество. Они пришли поздравлять.');
        yield* pedro(g);
      } },
      { id: 'bye', icon: 'bye', text: 'Держись, Стинки.', end: true }
    ]
  };

  TALK.bugx = {
    options: [
      { id: 'hi', icon: 'f:bug21', text: 'Сержант, прикажите им уйти.', run: function* (g) {
        yield g.say('bug', 'Не могу, сэр! Это мама, сэр! На маму голос не поднимается, сэр!');
      } },
      { id: 'army', icon: 'badge', text: 'А в армии как вы командовали?', run: function* (g) {
        yield g.say('bug', 'Зимой, сэр! В учебке, сэр! Снег жёлтый, салаги мёрзнут, а я ору! Лучшие годы, сэр!');
        yield g.say('bug', 'Без снега голос не идёт, сэр. Без жёлтого особенно.');
      } },
      { id: 'bye', icon: 'bye', text: 'Держитесь, сержант.', end: true, run: function* (g) { yield g.say('bug', 'Держусь, сэр! За сахарницу!'); } }
    ]
  };

  function* snowBug(g) {
    if (g.f.presentDone) { yield g.say('sam', 'Сержант уже построил всех. Второй снежок он примет за наступление.'); return; }
    yield g.anim('sam', 'throw', 0.5);
    g.sfx('splat');
    g.drop('snow');
    g.fx.shake = 0.3;
    yield g.say('bug', 'Снег... Жёлтый... Учебка...');
    g.sfx('megaphone');
    yield g.say('bug', 'ОТДЕЛЕНИЕ! СТАНОВИСЬ! МАМА, ТЫ ТОЖЕ! ПЛЕМЯННИКИ, ПО РОСТУ! ШАГОМ АРШ!');
    g.vt.roachMarch = g.time;
    g.sfx('stomp');
    yield 1.6;
    g.f.presentDone = true;
    g.f.roachesGone = true;
    yield g.say('bug', 'Сэр! Родня выведена в полном составе, сэр! Поздравления приняты на улице, сэр!');
    yield g.say('stinky', 'Ни одного! Даже в тостере! Сэм, это лучший подарок! После ванночки!');
    yield g.say('gpres', 'Ладно. Это Рождество спасено. Я сажусь в шар. Не трясите.');
    g.sfx('chime');
    yield g.say('sam', 'Дух Настоящего Рождества ушёл в снежный шар. Внутри стало теснее.');
  }

  ROOMS.stinkyx = {
    id: 'stinkyx', name: 'Рождество у Стинки', w: 320, music: 'diner21',
    paint: b => S.BG.diner21(b, { xmas: true }),
    walk: [[8, 152, 176, 152, 176, 158, 316, 158, 316, 198, 8, 198]],
    layers: [
      { id: 'booth', src: 'stinky', x: 34, y: 72, base: 130 },
      { id: 'stinkycounter', src: 'stinky', x: 176, y: 100, base: 152 },
      { id: 'sugar', src: 'stinky', x: 240, y: 84, base: 153 },
      { id: 'roaches', src: 'stinky', x: 0, y: 0, base: 190, when: g => !g.f.roachesGone, key: g => Math.floor(g.time * 6) % 24 }
    ],
    drawBack(f, g, cx) { E.portalBack(f, g, cx, 30, 120, 'present'); },
    hot: [
      { id: 'portal', name: 'Портал на полюс', rect: [8, 86, 44, 70], walk: [40, 172], face: 'w',
        look: 'Портал обратно на Северный полюс. Края светятся зелёным и красным.',
        exit: function* (g) { g.sfx('whoosh'); yield* g.goRoom('pole', { x: 540, y: 168, dir: 's' }, { from: 'present' }); } },
      { id: 'counter', name: 'Стойка', rect: [176, 100, 144, 52], walk: [220, 162], face: 'n',
        look: g => g.f.roachesGone ? 'Стойка блестит. Ни одного таракана. Стинки будет рассказывать об этом знаменитостям.' : 'Стойку не видно под тараканами. Тараканы в бумажных колпаках.' },
      { id: 'roaches', name: 'Родня сержанта', rect: [60, 130, 110, 60], when: g => !g.f.roachesGone, walk: [110, 164], face: 's',
        look: 'Родня сержанта Жучка. Мама, сестра, брат и сорок два племянника. Племянники в колпаках, мама с пирогом.',
        talk: 'Тараканы поют хором что-то праздничное. Слов я не разбираю. Может, и к лучшему.',
        items: { gun: 'Стрелять по родне сержанта? Их сорок пять, а патронов шесть.', snow: 'Снежок для сержанта. Родня его не испугается, их много.' } }
    ],
    actors: {
      stinky: {
        name: 'Стинки', walk: [270, 164], face: 'n',
        look: 'Стинки за стойкой отбивается от тараканов меню. Меню проигрывает.',
        talk: function* (g) { yield g.talkTo('stinkyx'); },
        items: { '*': function* (g) { yield g.say('stinky', 'Мне сейчас не до подарков! У меня в тостере праздник!'); } }
      },
      bug: {
        name: 'Сержант Жучок', walk: [250, 162], face: 'n',
        look: g => g.f.presentDone ? 'Сержант Жучок, довольный. Командир снова командует.' : 'Сержант Жучок прячется за сахарницей в праздничном колпаке. Колпак ему надела мама.',
        talk: function* (g) { yield g.talkTo('bugx'); },
        items: {
          snow: function* (g) { yield* snowBug(g); },
          gun: function* (g) { yield g.say('bug', 'Сэр! Не в меня, сэр!'); },
          '*': function* (g) { yield g.say('bug', 'Сэр! Подарки потом, сэр! Сейчас окружение!'); }
        }
      },
      gpres: {
        name: 'Дух Настоящего Рождества', walk: [70, 172], face: 'n',
        look: 'Дух Настоящего Рождества. Похож на Санту, только нетерпеливый и с часами.',
        talk: function* (g) {
          if (g.f.presentDone) { yield g.say('gpres', 'Я уже в шаре. Это проекция. Не тратьте моё время.'); return; }
          yield g.say('gpres', 'Вот ваше Рождество. Тараканы в супе и хозяйка в слезах. Чинить будете, или мне подождать ещё?');
        },
        items: { '*': function* (g) { yield g.say('gpres', 'Мне ничего не надо. Мне надо, чтобы вы работали.'); } }
      }
    },
    enter: function* (g) {
      if (g.f.presentSeen) return;
      g.f.presentSeen = true;
      yield g.say('gpres', 'Настоящее Рождество. Через неделю. Узнаёте?');
      yield g.say('sam', 'Закусочная «У Стинки». Только в тараканах. Тараканов тут пара сотен, и все в колпаках.');
      yield g.say('gpres', 'Всадник Мора держал их снаружи. Всадника забрали вы.');
      yield g.say('max', 'Мы испортили Рождество! Сэм, я горжусь! То есть мне стыдно! То есть и то, и то!');
    },
    setup(g) {
      g.place('stinky', 'stinkyx', 262, 146, 's');
      g.place('bug', 'stinkyx', 256, 102, 'w');
      g.actors.bug.z = 60;
      g.place('gpres', 'stinkyx', 60, 168, 'e');
      for (const id of ['sybil', 'lincoln']) if (g.actors[id].room === 'stinkyx') g.place(id, 'nowhere', 0, 0);
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
