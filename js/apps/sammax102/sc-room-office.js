(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP102;
  const { ROOMS, TALK, LAYERS } = E;

  LAYERS.office = {
    closetOpen: g => S.LAYERS.office.closetOpen(g),
    wig: () => S.BG.sprite(34, 34, P => {
      P.part(P.ell(17, 31.6, 8.5, 1.9), C.grey, { b: 1 });
      P.part(P.rect(16, 27, 2, 4), C.grey, { b: 3, sh: 0 });
      const Q = new S.Pen(P.b).at(17, 20, 1);
      Q.part(Q.rect(-3, 6, 6, 5), C.stone, { b: 3, sh: 0 });
      Q.part(Q.ell(0, 0.5, 7.4, 8.4), C.stone, { b: 4 });
      S.art.bradyHair(Q, 0, 0);
      Q.line(10.5, -7, 12.5, -1, C.grey[4]);
      P.part(P.rect(28, 18, 5, 4), C.grey, { b: 5, sh: 0 });
    }),
    desk: () => S.LAYERS.office.desk(),
    phone: () => S.LAYERS.office.phone()
  };

  function* ring(g, times) {
    for (let i = 0; i < times; i++) { g.sfx('ring'); yield 1.1; }
  }

  function* pickUp(g) {
    yield g.walkTo('sam', 104, 150);
    g.face('sam', 'w');
    const sam = g.actors.sam;
    sam.act = 'phone'; sam.keepAct = true;
    yield g.say('sam', 'Вольная полиция. Сэм у аппарата.');
  }

  function hangUp(g) {
    g.sfx('hangup');
    const sam = g.actors.sam;
    sam.act = ''; sam.keepAct = false;
  }

  const my = (g, t) => E.tv(g, t, COLORS.myra);

  function* intro(g) {
    g.hideUI = true;
    const max = g.actors.max;
    max.scripted = true;
    g.closeup = { kind: 'titlecard2', t0: g.time, lines: ['SAM & MAX', 'ЭПИЗОД 102', 'СИТУАЦИЯ: КОМЕДИЯ'] };
    g.music('title2');
    yield g.fadeIn(1.2);
    yield 4.4;
    yield g.fadeOut(2);
    g.closeup = { kind: 'tv2', prog: 'myra', t0: g.time };
    g.music('myra');
    yield g.fadeIn(1.5);
    yield my(g, 'Мои дорогие! Мы в прямом эфире третий день, и знаете, что у меня для вас есть?');
    g.sfx('applause');
    yield my(g, 'Подарки! Вам тостер! И вам тостер! Мистер в третьем ряду, вам ещё тостер!');
    yield E.tv(g, 'Спасибо, Майра... У меня уже пять. Можно мне домой?', COLORS.fan);
    yield my(g, 'Домой? А дома у вас есть Майра? Вот видите. Никто не уйдёт без подарка.');
    yield g.fadeOut(2);
    g.closeup = null;
    g.music('office');
    yield g.fadeIn(1.5);
    yield g.say('max', 'Сэм, эта тётя третий день раздаёт тостеры. Я тоже хочу в заложники!');
    yield g.say('sam', 'Их не выпускают, Макс. Судя по лицам, тостеры их больше не радуют.');
    yield g.say('max', 'Меня бы порадовали. Я бы их взрывал по одному.');
    yield* ring(g, 2);
    yield* pickUp(g);
    yield E.phone(g, 'Сэм, это Комиссар. Вы смотрите «Майру»?');
    yield g.say('sam', 'Стараемся не смотреть. Макс не даёт выключить.');
    yield E.phone(g, 'Майра Стамп третьи сутки не отпускает зрителей из студии. Раздаёт подарки и никого не выпускает.');
    max.scripted = false;
    g.hideUI = false;
    yield g.talkTo('commish');
  }

  TALK.commish = {
    options: [
      { id: 'why', icon: 'q', text: 'Почему полиция не может просто войти?', run: function* (g) {
        yield E.phone(g, 'К Майре пускают только знаменитостей. Охрана телестудии стоит насмерть.');
        yield E.phone(g, 'Вчера мы отправили туда сержанта в накладных усах. Он до сих пор сидит в третьем ряду. С тостером.');
      } },
      { id: 'famous', icon: 'star', text: 'Но мы не знаменитости, Комиссар.', run: function* (g) {
        yield E.phone(g, 'Так станьте ими. Желательно до вечера.');
        yield g.say('sam', 'Слава за один день. Звучит как брошюра, которую раздают у метро.');
      } },
      { id: 'force', icon: 'f:max', text: 'А можно взорвать студию?', speaker: 'max', run: function* (g) {
        yield E.phone(g, 'Там триста заложников, Макс.');
        yield g.say('max', 'Значит, можно, но аккуратно?');
        yield E.phone(g, 'Значит, нельзя. Совсем.');
        yield g.say('max', 'Вы сегодня не в духе, Комиссар.');
      } },
      { id: 'where', icon: 'tv', text: 'Где снимают шоу?', run: function* (g) {
        yield E.phone(g, 'Телестудия WARP. Минут десять на вашей колымаге, если не останавливаться на красный.');
        yield g.say('sam', 'Мы на красный не останавливаемся. Мы не уверены, что он для нас.');
      } },
      { id: 'bye', icon: 'bye', text: 'Мы займёмся этим, Комиссар.', end: true, run: function* (g) {
        yield E.phone(g, 'И, Сэм... постарайтесь не попасть в рекламу.');
        hangUp(g);
        g.f.caseOpen = true;
        yield g.say('sam', 'Собирайся, Макс. Едем на телевидение.');
        yield g.say('max', 'Наконец-то! Я рождён для прайм-тайма!');
      } }
    ]
  };

  const TV_PROGS = ['rules', 'bear', 'glass', 'faint'];

  function* watchTv(g) {
    const i = g.f.tvSeg || 0;
    const prog = i < TV_PROGS.length ? TV_PROGS[i] : 'rerun';
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('tvon');
    g.closeup = { kind: 'tv2', prog, t0: g.time };
    g.music('myra');
    const tv = t => E.tv(g, t);
    if (prog === 'rules') {
      yield tv('«Майра!» в прямом эфире. Вопрос из зала: как попасть к вам в гости?');
      yield my(g, 'Проще простого, сладенький! На мой диван садятся только звёзды. Роль в сериале, контракт на запись и скандал. Хороший, сочный скандал.');
      yield my(g, 'Нет трёх вещей, нет дивана. Нет дивана, нет Майры!');
    } else if (prog === 'bear') {
      yield my(g, 'А это мой новый друг, Мистер Мишка! Он пришёл ко мне три дня назад.');
      yield my(g, 'С тех пор мне совсем не хочется заканчивать эфир. Правда, Мистер Мишка?');
      yield tv('Мишка молча смотрит в камеру. Глаза у него медленно крутятся.');
    } else if (prog === 'glass') {
      yield tv('Из архива «Майры!»: оперная певица Ла Скальпелла берёт верхнее «до».');
      yield tv('А-а-а-а-а-а-а!', C.pink[4]);
      g.sfx('glass');
      yield my(g, 'Мой стакан! Милочка, вы разбили мой стакан! Продюсеры, новый стакан на стол, немедленно!');
      yield tv('С тех пор у Майры на столе в каждом выпуске стоит полный стакан воды. Для искренности.');
    } else if (prog === 'faint') {
      yield tv('Из архива: выпуск «Мужчины, которые любят слишком сильно».');
      yield tv('Мистер Стэнли Пек из Огайо признаётся Майре в тайном романе с коровой.');
      yield my(g, 'С... КОРОВОЙ?!');
      yield 1.6;
      yield tv('Майра пришла в себя через двадцать минут. Рейтинг выпуска вырос вдвое.');
    } else {
      yield tv('Повтор! «Майра!», выпуск «Люди, которые смотрят слишком много телевизора».');
    }
    g.closeup = null;
    g.music('office');
    g.f.tvSeg = i + 1;
    if (prog === 'rules') { yield g.say('sam', 'Роль, песня и скандал. В моей биографии нет ни одного из трёх пунктов.'); yield g.say('max', 'Скандал беру на себя!'); }
    if (prog === 'bear') { yield g.say('sam', 'У мишки крутятся глаза. Где-то я такое уже видел.'); yield g.say('max', 'У Брэди Калчера! Только Брэди был страшнее. И меньше плюшевый.'); }
    if (prog === 'glass') yield g.say('sam', 'Высокая нота бьёт стекло. Запомню на случай, если придётся петь.');
    if (prog === 'faint') { yield g.say('sam', 'Майра падает в обморок от слова «корова». Запомню и это, хотя надеюсь, что не пригодится.'); yield g.say('max', 'Пригодится! Коровы всегда пригождаются!'); g.f.tvDone = true; }
    if (prog === 'rerun') yield g.say('sam', 'Повтор. Выключаю, пока он не посмотрел на меня в ответ.');
  }

  function* playTape(g) {
    yield g.anim('sam', 'reach', 0.5);
    g.sfx('vcr');
    g.closeup = { kind: 'tv2', prog: 'sitcom', t0: g.time };
    g.music('sitcom');
    yield E.tv(g, 'Мистер Фезерли, позвольте представить: наш повар.', COLORS.sam);
    g.sfx('laughtrack');
    yield E.tv(g, 'Хм. Землистое. С дымком. Шеф, это восхитительно!', COLORS.philo);
    g.sfx('laughtrack');
    yield 1.2;
    g.closeup = null;
    g.music('office');
    g.sfx('vcr');
    yield g.say('max', 'Сэм, это мы! Смотри, как я выразительно молчу на заднем плане!');
    yield g.say('sam', 'Лучшая роль второго плана. Кассету забираю обратно. Майре она нужнее, чем нам.');
  }

  function* jimmyTalk(g) {
    const j = g.actors.jimmy;
    if (!g.f.chaseWon) {
      yield g.say('sam', 'Джимми! Выходи.');
      yield 0.8;
      yield g.say('sam', 'Тишина. Джимми нет дома. Впервые за всё время, что мы его терпим.');
      return;
    }
    g.place('jimmy', 'office', 211, 128, 'w');
    j.visible = true; j.act = 'peek'; j.keepAct = true;
    g.sfx('squeak');
    yield g.say('jimmy', 'Чего надо, начальник? Я на больничном. Меня крышкой люка приложило.');
    yield g.talkTo('jimmy');
  }

  TALK.jimmy = {
    options: [
      { id: 'cream', icon: 'cream', text: 'Зачем вашей банде пена для бритья?', run: function* (g) {
        yield g.say('jimmy', 'Мы «Бритые хвосты», начальник. Ты пробовал побрить хвост насухо? Шкура горит неделю.');
        yield g.say('max', 'А можно мне к вам в банду?');
        yield g.say('jimmy', 'Сначала побрейся, ушастый. Целиком.');
      } },
      { id: 'car', icon: 'car', text: 'Откуда у вас машина?', once: true, run: function* (g) {
        yield g.say('jimmy', 'Выиграли в лотерею. У детей из парка. Лотерея называлась «Отдай, пока не укусили».');
      } },
      { id: 'myra', icon: 'tv', text: 'Ты смотришь «Майру», Джимми?', run: function* (g) {
        yield g.say('jimmy', 'Смотрел, пока у неё медведь не появился. Этот медведь на меня пялится. Я крыса, начальник. Пялиться у нас положено мне.');
      } },
      { id: 'bye', icon: 'bye', text: 'Выздоравливай, Джимми.', end: true, run: function* (g) {
        yield g.say('jimmy', 'Выздоровею и вернусь за пеной. Шучу. Наверное.');
        g.actors.jimmy.visible = false;
        g.sfx('squeak');
      } }
    ]
  };

  ROOMS.office = {
    id: 'office', name: 'Офис Сэма и Макса', w: 320, music: 'office',
    paint: b => S.BG.office(b, {}),
    walk: [[40, 132, 258, 132, 316, 162, 316, 198, 4, 198, 4, 156, 36, 134]],
    block: [[0, 152, 96, 147, 112, 158, 112, 200, 0, 200]],
    layers: [
      { id: 'closetOpen', x: 222, y: 38, when: g => g.f.closetOpen },
      { id: 'wig', x: 225, y: 92, when: g => g.f.closetOpen },
      { id: 'desk', x: 0, y: 138, base: 176 },
      { id: 'phone', x: 46, y: 142, base: 177 }
    ],
    drawBack(f, g, cx) {
      if (g.f.tvOff) return;
      for (let y = 63; y < 84; y++) for (let x = 176; x < 205; x++) f.set(x - cx, y, y < 72 ? C.plum[3] : C.plum[2]);
      const P = new S.Pen(f).at(191 - cx, 73, 0.34);
      S.art102.myraBust(P, 28);
      S.art102.myraHead(P, 0, 0, { talk: Math.floor(g.time * 6) % 3 !== 0, hypno: true, t: g.time });
      for (let y = 80; y < 84; y++) for (let x = 176; x < 205; x++) f.set(x - cx, y, y === 80 ? C.gold[3] : C.pink[2]);
      for (let i = 0; i < 5; i++) f.set(178 + i * 6 - cx, 83, C.cycle[(i + Math.floor(g.time * 5)) % 8]);
    },
    hot: [
      { id: 'edoor', name: 'Дверь на улицу', poly: [276, 32, 306, 23, 306, 170, 276, 142], walk: [284, 162], face: 'e',
        look: 'Наша дверь. Стекло до сих пор помнит, как Макс проверял его на прочность.',
        exit: function* (g) {
          if (!g.f.caseOpen) { yield g.say('sam', 'Сначала закончим разговор с Комиссаром.'); return; }
          g.sfx('door');
          yield* g.goRoom('street', { x: 300, y: 146, dir: 's' });
        } },
      { id: 'tv', name: 'Телевизор', poly: [172, 60, 212, 58, 213, 87, 172, 88], walk: [192, 136], face: 'n',
        look: g => g.f.tvOff ? 'Телевизор выключен. Майра где-то там всё равно улыбается.' : 'По телевизору «Майра!». Третий день подряд. Майра не моргает.',
        use: function* (g) { yield* watchTv(g); },
        items: {
          gun: 'Стрелять в телевизор бесполезно. Майру показывают на всех каналах, я проверял.',
          vtape: 'Кассета идёт в видеомагнитофон. Он стоит под телевизором.'
        } },
      { id: 'vcr', name: 'Видеомагнитофон', rect: [177, 88, 31, 10], walk: [192, 136], face: 'n',
        look: 'Видеомагнитофон. На часах «00:00». Время для него остановилось, и он этим доволен.',
        use: 'Смотреть нечего. Все кассеты Макс переписал своими концертами.',
        items: { vtape: function* (g) { yield* playTape(g); } } },
      { id: 'phone', name: 'Телефон', rect: [44, 140, 26, 16], walk: [118, 160], face: 'w', over: true,
        look: 'Наш телефон. Звонит редко, но всегда не вовремя.',
        use: 'Звонить Комиссару без повода опасно. Он найдёт повод сам.' },
      { id: 'desk', name: 'Стол', poly: [0, 156, 92, 150, 108, 158, 108, 200, 0, 200], walk: [118, 164], face: 'w',
        look: 'Мой стол. На нём квитанция за свет, кружка и отпечаток лапы Макса в засохшем кетчупе.',
        use: 'В ящиках старые рапорты. Героизм, как выяснилось, скучно описывать.' },
      { id: 'closet', name: 'Шкаф', poly: [224, 42, 260, 40, 260, 128, 224, 128], walk: [240, 136], face: 'n',
        look: g => g.f.closetOpen ? 'Шкаф с уликами. Главная улика прошлого дела стоит внизу и блестит.' : 'Шкаф. После прошлого дела в нём пахнет лаком для волос и порохом.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.4);
          g.sfx('door');
          g.f.closetOpen = !g.f.closetOpen;
          if (g.f.closetOpen && !g.seen.closet102) { g.seen.closet102 = 1; yield g.say('max', 'Причёска Брэди! Сэм, она всё ещё блестит! Сейчас начнёт вести ток-шоу!'); yield g.say('sam', 'Без Брэди она ведёт себя тихо. Пусть так и остаётся.'); }
        } },
      { id: 'wig', name: 'Парик Брэди Калчера', rect: [225, 92, 34, 34], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Парик Брэди Калчера на болванке. Кок из лака и самомнения. Брэди без него смотрит телевизор и больше никого не гипнотизирует.',
        use: function* (g) { yield g.say('max', 'Примерь, Сэм! Будешь самым честным лицом на телевидении!'); yield g.say('sam', 'Улики не примеряют, Макс. Особенно улики такого объёма.'); },
        items: { gun: 'Парик уже сдался. Стрелять в сдавшуюся причёску я не стану.' } },
      { id: 'hole', name: 'Крысиная нора', rect: [203, 114, 16, 15], walk: [204, 138], face: 'n',
        look: g => g.f.chaseWon ? 'Нора Джимми. Изнутри доносятся стоны и запах мяты.' : 'Нора Джимми Два Зуба. Пусто. На пороге клочок чёрной кожи и сильный запах мяты.',
        use: 'Совать лапу в крысиную нору я не буду. Это не расследование, это прививка.',
        talk: function* (g) { yield* jimmyTalk(g); },
        items: {
          cream: 'Вернуть Джимми пену? Бороться с преступностью подарками пусть будет методом Майры.',
          gun: 'Стрелять в нору? Там живёт свидетель. Неприятный, но свидетель.'
        } },
      { id: 'window', name: 'Окно', poly: [100, 30, 164, 28, 164, 96, 100, 98], walk: [134, 134], face: 'n',
        look: 'Во всех окнах напротив мерцают телевизоры. Весь квартал смотрит «Майру».',
        use: 'Жвачка Макса держит окно лучше любой щеколды.' },
      { id: 'cabinet', name: 'Картотека', poly: [40, 62, 90, 58, 90, 124, 41, 129], walk: [66, 136], face: 'n',
        look: 'Картотека. Дело о кассетах «Ай-Бо» лежит сверху. Закрыто, подшито, немного погрызено.',
        use: 'Новое дело в картотеку пока не ляжет. Сначала его надо раскрыть.' },
      { id: 'picture', name: 'Картина', rect: [43, 17, 39, 33], walk: [62, 136], face: 'n', look: 'Собаки играют в покер. Одна из них похожа на меня. Та, что проигрывает.', use: 'Поправлю. Готово. Криво, но с достоинством.' },
      { id: 'rack', name: 'Вешалка', rect: [10, 50, 22, 78], walk: [42, 146], face: 'w', look: 'Пустая вешалка. Плечики ушли на антенну для шлема и не вернулись.', use: 'Вешать нечего. Шляпу я не снимаю даже во сне.' },
      { id: 'switch', name: 'Выключатель', rect: [266, 73, 9, 14], walk: [262, 142], face: 'e', look: 'Выключатель.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.3);
          g.sfx('click');
          g.fx.dark = !g.fx.dark;
          yield g.say(g.fx.dark ? 'max' : 'sam', g.fx.dark ? 'Сэм! В темноте Майра светится ещё ярче!' : 'Свет лучше. Майра в нём хотя бы не светится.');
        } },
      { id: 'crate', name: 'Ящик', rect: [176, 99, 33, 30], walk: [192, 138], face: 'n', look: 'Ящик «FRAGILE». Внутри осколки прошлых расследований.', use: 'Пусть лежат. Осколки тоже улики, если долго ждать.' },
      { id: 'bulb', name: 'Лампочка', rect: [144, 0, 12, 19], look: 'Лампочка. Сорок ватт, как и наш бюджет.', use: 'Не достану. Макс достанет, но я не хочу знать как.' }
    ],
    actors: {
      jimmy: {
        name: 'Джимми Два Зуба', walk: [196, 138], face: 'e', when: g => g.actors.jimmy.visible,
        look: 'Джимми Два Зуба. Один зуб теперь шатается. Люк победил.',
        talk: function* (g) { yield g.talkTo('jimmy'); },
        items: { gun: 'Он и так пострадал за искусство бритья.', cream: 'Пену он не получит. Он её уже один раз получил.' }
      }
    },
    setup(g) {
      const j = g.actors.jimmy;
      if (j.room === 'office') { j.visible = false; }
      g.fx.dark = false;
    },
    onLoad(g) { ROOMS.office.setup(g); }
  };

  E.ending = function* (g) {
    yield g.fadeOut(1);
    g.fx.dark = false;
    g.setRoom('office', { x: 150, y: 166, dir: 's' });
    g.place('max', 'office', 186, 150, 'n');
    const max = g.actors.max;
    max.follow = 'sam'; max.scripted = true; max.hypno = false; max.act = ''; max.keepAct = false; max.visible = true;
    g.f.tvOff = false;
    g.music('office');
    yield g.fadeIn(1);
    yield* ring(g, 2);
    yield* pickUp(g);
    yield E.phone(g, 'Хорошая работа, Сэм. Зрители разошлись по домам. С тостерами.');
    yield E.phone(g, 'Майра Стамп ушла в отпуск. Говорят, в первый за двадцать лет.');
    yield g.say('sam', 'Ей полезно. Нам, кстати, тоже.');
    yield E.phone(g, 'Не сегодня. Что с медведем?');
    yield g.say('sam', 'Лежит в коробке, Комиссар. Обмотан скотчем. Иногда дёргается.');
    yield E.phone(g, 'Пришлите его мне. И вот ещё что. Моя жена смотрела «Ковбоев из центра».');
    yield g.say('sam', 'И как ей?');
    yield E.phone(g, 'Просила передать, что корова играла лучше всех.');
    hangUp(g);
    yield g.say('max', 'Сэм! Нас показывают! Повтор!');
    g.closeup = { kind: 'tv2', prog: 'sitcom', t0: g.time };
    g.music('sitcom');
    g.sfx('laughtrack');
    yield 2.4;
    g.closeup = null;
    g.music('credits2');
    yield g.say('sam', 'Пятнадцать минут славы, Макс. По-моему, наши уже прошли.');
    yield g.say('max', 'Тогда давай натворим ещё на пятнадцать!');
    const j = g.actors.jimmy;
    g.place('jimmy', 'office', 211, 128, 'w');
    j.visible = true; j.act = 'peek'; j.keepAct = true;
    g.sfx('squeak');
    yield g.say('jimmy', 'Начальник, пены не осталось? У ребят хвосты обрастают.');
    yield g.say('max', 'Сэм, можно я его побрею?');
    yield g.say('sam', 'Нет, Макс. Лучше выключи телевизор.');
    yield g.say('max', 'Не могу! Там мы!');
    j.visible = false;
    yield g.fadeOut(0.5);
    g.ended = true;
  };

  E.startNewGame = function (g) {
    E.newGame(g);
    g.setRoom('office');
    g.fade = 1; g.fadeTo = 1;
    g.run(intro, { name: 'intro' });
  };

  E.office = { intro, ring };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
