(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP103;
  const { ROOMS, TALK } = E;

  const MONITORS = [
    'Контора Сибил. Вид снизу, откуда-то с уровня кактуса. Сибил пьёт кофе и оглядывается.',
    'Лавка Боско. Боско в берете поправляет усы. Мафия, похоже, смотрит это как сериал.',
    'Покерный стол. Леонард смотрит мне за спину даже на экране.',
    'Игровой рай. Лапочка раздаёт жетоны и оглядывается на камеру.',
    'Наша улица. Де Сото стоит на месте. На капоте сидит голубь и тоже смотрит в камеру.',
    'Наш офис. Джимми роется в моём столе. Мафия смотрит, как крыса обыскивает полицию, и, кажется, болеет за крысу.',
    'Чья-то гостиная. Роскошный ковёр. Шторы точно в тон. Если это знак, я его не понимаю.',
    '«НЕТ СИГНАЛА». На фабрику даже камере вход запрещён.',
    'Студия «Майры!». Пусто. Майра в отпуске. Мафия, похоже, скучает по ней больше, чем зрители.',
    'Мультфильм «Приключения Теда И. Бэра». Мишка дарит детям мишек. Дети перестают моргать.'
  ];

  function* monitors(g) {
    g.closeup = { kind: 'monitors', t0: g.time, hi: -1 };
    const seen = g.count('monitors');
    const list = seen === 1 ? MONITORS.map((t, i) => i) : [0, 5, 7];
    for (const i of list) {
      g.closeup.hi = i;
      yield g.say('sam', MONITORS[i], { x: 160, y: 196 });
    }
    g.f.sawCam = true;
    g.closeup = null;
    if (seen === 1) yield g.say('max', 'Сэм, нас показывают по телевизору! И Сибил! И Боско! У мафии лучшая программа в городе!');
  }

  function remaining(g) {
    const out = [];
    if (!g.f.boscoDone) out.push('поставить мишку в лавку на вашей улице');
    if (!g.f.sybilDone) out.push('убрать свидетельницу Сибил Пандемик');
    if (!g.f.meatDone) out.push('вернуть Оригинальный сэндвич');
    return out;
  }

  const allDone = g => g.f.sybilDone && g.f.boscoDone && g.f.meatDone;

  function* joinUp(g) {
    const ch = g.actors.chuckles, lv = g.actors.lovey;
    yield g.say('chuckles', 'Семья всегда ищет таланты. Но сначала поручения. Два.');
    yield g.say('chuckles', 'Первое. Надавить. На вашей улице есть лавка. Хозяин отказывается продавать наших мишек. Поставьте у него мишку. Мишка должен остаться в лавке.');
    ch.act = 'give'; ch.actT = 1;
    g.give('bearbox');
    yield g.say('chuckles', 'Второе. Убрать. Одна дамочка в пятницу собирается дать показания против семьи. Сибил Пандемик. Суд не должен её дождаться.');
    yield g.say('max', 'Сибил?! Но мы же...');
    yield g.say('sam', 'Мы же прекрасно справимся, Макс.');
    g.place('lovey', 'backroom', 20, 172, 'e');
    lv.visible = true; lv.scripted = true; lv.act = 'shock'; lv.keepAct = true;
    g.sfx('door');
    yield g.walkTo('lovey', 70, 170);
    yield g.say('lovey', 'Чаклз! Сэндвич! Оригинальный сэндвич пропал из витрины! И у Мишки-бандита кто-то открутил руку!');
    yield g.say('chuckles', 'Третье.');
    yield g.say('chuckles', 'Вернуть. Найдите сэндвич до того, как Дон узнает, что его нет. Дон любит этот сэндвич больше, чем семью.');
    lv.act = ''; lv.keepAct = false;
    yield g.walkTo('lovey', 20, 172);
    g.place('lovey', 'playland', 104, 170, 'e');
    lv.scripted = false;
    g.f.joined = true;
    g.f.meatStolen = true;
    g.place('leonard', 'nowhere', 0, 0);
    g.place('cuddly', 'street', 430, 150, 'w');
    g.actors.cuddly.act = 'read'; g.actors.cuddly.keepAct = true;
    yield g.say('sam', 'Три поручения. В сказках их тоже три. Я надеялся, что мафия окажется оригинальнее.');
    yield g.say('chuckles', 'Обнимашка присмотрит за лавкой. За свидетельницей присмотрит камера. А за сэндвичем присмотрите вы.');
  }

  TALK.chuckles = {
    start: function* (g) {
      if (!g.seen.chucklesHi) {
        g.seen.chucklesHi = 1;
        yield g.say('chuckles', 'Новые лица. Охранник говорит, вы знаете пароль. Значит, кто-то вас научил. Или вы подслушивали. И то и другое говорит в вашу пользу.');
      }
    },
    options: [
      { id: 'join', icon: 'f:chuckles', text: 'Мы хотим в Игрушечную мафию.', when: g => !g.f.joined, run: function* (g) { yield* joinUp(g); } },
      { id: 'tasks', icon: 'q', text: 'Напомните, что нам поручено.', when: g => g.f.joined && !allDone(g), run: function* (g) {
        yield g.say('chuckles', 'Осталось: ' + remaining(g).join('; ') + '.');
      } },
      { id: 'done', icon: 'star', text: 'Все поручения выполнены.', end: true, when: g => g.f.joined && allDone(g) && !g.f.inducted, run: function* (g) {
        g.endDialog();
        yield* induction(g);
      } },
      { id: 'don', icon: 'f:ted', text: 'Кто такой Дон Тед И. Бэр?', run: function* (g) {
        yield g.say('chuckles', 'Глава семьи. Появился месяц назад. Поднялся очень быстро. Говорят, он хорошо роет.');
      } },
      { id: 'bears', icon: 'f:hbear', text: 'Зачем вам столько мишек?', run: function* (g) {
        yield g.say('chuckles', 'Мишки приносят радость. Радость приносит покупателей. А мишки смотрят, чтобы покупатели не передумали.');
        yield g.say('sam', 'Это называется гипноз.');
        yield g.say('chuckles', 'Это называется маркетинг.');
      } },
      { id: 'myra', icon: 'tv', text: 'Мишка из студии Майры ваш?', run: function* (g) {
        yield g.say('chuckles', 'Первая партия. Для телевидения. Опытный образец. Жаль, что вы его сломали. Хотя эксперимент удался.');
      } },
      { id: 'door', icon: 'keyhole', text: 'Что за дверью «Входа нет»?', run: function* (g) {
        yield g.say('chuckles', 'Производство. Туда входит только Дон. И те, кого Дон больше не хочет видеть.');
      } },
      { id: 'code', icon: 'rug', text: E.CODE, run: function* (g) {
        yield g.say('chuckles', 'Ковры здесь выбирает Дон. Шторы тоже. Я выбираю, кто выходит отсюда целым.');
        yield g.say('sam', 'Пощёчины не будет. Этот бьёт по-другому.');
      } },
      { id: 'bye', icon: 'bye', text: 'Мы пойдём работать.', end: true, run: function* (g) {
        yield g.say('chuckles', 'Не заставляйте семью ждать. Семья этого не любит.');
      } }
    ]
  };

  function* induction(g) {
    const ted = g.actors.ted, ch = g.actors.chuckles, max = g.actors.max, sam = g.actors.sam;
    g.hideUI = true;
    max.scripted = true;
    g.music('mob');
    const crew = [['lovey', 70, 172, 'e'], ['cuddly', 108, 180, 'e'], ['guard', 246, 176, 'w']];
    for (const [id, x, y, dir] of crew) { const a = g.actors[id]; g.place(id, 'backroom', x, y, dir); a.visible = true; a.act = ''; a.keepAct = false; a.scripted = true; }
    g.place('sam', 'backroom', 150, 176, 'e');
    g.place('max', 'backroom', 130, 184, 'e');
    yield g.say('chuckles', 'Лавка, свидетельница и сэндвич. Семья впечатлена. Дон хочет посмотреть на вас лично.');
    g.sfx('door');
    g.place('ted', 'backroom', 300, 150, 'w');
    ted.visible = true; ted.v = 'masked'; ted.act = ''; ted.keepAct = false; ted.scripted = true;
    yield g.walkTo('ted', 222, 160);
    yield g.say('ted', 'Добро пожаловать в семью, мальчики. Я Дон Тед И. Бэр.');
    yield g.say('ted', 'Семья держится на доверии. Поэтому я покажу вам своё настоящее лицо.');
    ted.act = 'unmask'; ted.keepAct = true; ted.v = '';
    g.sfx('pop');
    yield 0.8;
    yield g.say('max', 'Сэм! Под мишкой крот! Настоящий крот! С носом!');
    yield g.say('sam', E.CODE);
    ted.act = 'slap'; ted.actT = 0.6; ted.keepAct = false;
    yield g.say('ted', 'Ну, знаете ли!');
    g.sfx('slap');
    g.fx.flash = 0.4;
    g.fx.shake = 0.5;
    yield 0.6;
    yield g.say('sam', 'Ответил. И ударил. Всё по инструкции. Агент, мы от Комиссара. Операция окончена, можете выходить из образа.');
    yield g.say('ted', 'Выходить? Из образа? Мальчики, я из него месяц не вылезаю. Мне в нём нравится.');
    yield g.say('ted', 'Полиция платила мне сорок долларов в неделю и давала талон на пончик. Мафия дала мне казино и фабрику. И костюм с розочкой.');
    yield g.say('ted', 'Кем я был в полиции? Кротом. Кем я стал здесь? Доном. Сравните сами.');
    yield g.say('sam', 'Он прав, Макс. Мы опоздали с этой новостью недели на три.');
    yield g.say('max', 'Ненавижу, когда злодей прав!');
    yield g.say('chuckles', 'Интересно.');
    yield g.say('ted', 'Семья! Взять их!');
    for (const [id] of crew) g.actors[id].act = 'up';
    g.sfx('alarm');
    yield g.walkTo('max', 176, 150, { free: true, speed: 2.5 });
    g.f.maxSandwich = true;
    yield g.say('max', 'Сэндвич спасён!');
    yield g.say('sam', 'Бежим, Макс! К машине!');
    g.f.inducted = true;
    for (const [id] of crew) { const a = g.actors[id]; a.scripted = false; a.act = ''; g.place(id, 'nowhere', 0, 0); }
    ted.scripted = false; ted.act = ''; ted.keepAct = false;
    g.place('ted', 'factory', 430, 162, 'w');
    g.place('chuckles', 'nowhere', 0, 0);
    max.scripted = false;
    g.hideUI = false;
    yield* E.startMobChase(g);
  }

  function* sinister(g) {
    if (!g.f.inducted) {
      if (g.actors.chuckles.room === 'backroom') yield g.say('chuckles', 'Туда нельзя. Туда входит только Дон.');
      else yield g.say('sam', 'Заперто. Изнутри гудят машины. Похоже, там что-то производят. Надеюсь, не нас.');
      return;
    }
    if (!g.f.chaseWon) { yield g.say('max', 'Сэм, там тупик, а за нами лимузин с мишками! Я за машину!'); return; }
    g.sfx('door');
    yield* g.goRoom('factory', { x: 440, y: 176, dir: 'w' });
  }

  ROOMS.backroom = {
    id: 'backroom', name: 'Задняя комната', w: 320, music: 'mob',
    paint: b => S.BG.backroom(b),
    walk: [[6, 150, 316, 150, 316, 198, 6, 198]],
    block: [[126, 146, 214, 146, 214, 156, 126, 156]],
    layers: [
      { id: 'desk', x: 126, y: 108, base: 154, key: g => g.f.meatDone && !g.f.inducted ? 's' : '' }
    ],
    hot: [
      { id: 'exit', name: 'Дверь в казино', rect: [4, 26, 34, 100], walk: [34, 170], face: 'w',
        look: 'Дверь обратно в казино. С этой стороны на ней висит табличка «Улыбайтесь, вас видят».',
        exit: function* (g) {
          g.sfx('door');
          yield* g.goRoom('casino', { x: 424, y: 174, dir: 's' });
        } },
      { id: 'board', name: 'Доска учёта', rect: [44, 12, 124, 62], walk: [106, 160], face: 'n',
        look: ['Доска учёта. «Рэкет», «Тотализатор», «Развлечения». Цифры ровные, как зубы у Лапочки.', 'Часть сумм перечёркнута красным. Видимо, те, кто не заплатил. Или те, кто заплатил слишком честно.'] },
      { id: 'portrait', name: 'Портрет Дона', rect: [174, 16, 34, 52], walk: [190, 160], face: 'n',
        look: 'Портрет Дона Теда И. Бэра. Художник явно боялся рисовать лицо и нарисовал маску.' },
      { id: 'monitors', name: 'Стена мониторов', rect: [216, 12, 70, 62], walk: [250, 160], face: 'n',
        look: function* (g) { yield* monitors(g); },
        use: function* (g) { yield* monitors(g); } },
      { id: 'boxes', name: 'Коробки с мишками', rect: [40, 84, 84, 44], walk: [82, 160], face: 'n',
        look: 'Подарочные коробки с мишками. На одной наклейка: «Студия WARP, "Майра!"». Зачёркнуто. Сверху: «Лавки района».',
        use: 'Мне хватит одной коробки. Её мне и так вручили.' },
      { id: 'heads', name: 'Запасные головы', rect: [226, 88, 58, 34], walk: [254, 160], face: 'n',
        look: 'Запасные мишкины головы на крючках. Жёлтая, голубая, зелёная. Размер «мафиози стандартный».',
        use: 'Примерить голову? Если она прирастёт, меня придётся звать Лапочкой.' },
      { id: 'desk', name: 'Стол Чаклза', rect: [126, 108, 96, 44], walk: [172, 176], face: 'n',
        look: g => g.f.meatDone && !g.f.inducted ? 'Стол Чаклза. На блюде лежит Оригинальный сэндвич. Ждёт церемонии.' : 'Стол Чаклза. Среди бумаг стоит пустая тарелка. Крошек на ней нет. В семье доедают всё.',
        use: 'Читать чужие бумаги при хозяине невежливо. Без хозяина тоже, но хотя бы безопасно.' },
      { id: 'sinister', name: 'Дверь «Входа нет»', rect: [286, 44, 34, 96], walk: [292, 168], face: 'e',
        look: g => g.f.chaseWon ? 'Дверь на фабрику приоткрыта. Изнутри гудят машины и что-то скрипит. Возможно, совесть Дона.' : 'Стальная дверь. Табличка «Входа нет». Из-за двери слышно гудение и тихое пение мишек.',
        use: function* (g) { yield* sinister(g); },
        exit: function* (g) { yield* sinister(g); } }
    ],
    actors: {
      chuckles: {
        name: 'Чаклз', walk: [168, 176], face: 'n', dist: 22, when: g => g.actors.chuckles.room === 'backroom',
        look: 'Чаклз. Розовая мишкина голова, маленькая шляпа, чёрный костюм в полоску. Голос тихий. Такие голоса обычно всем распоряжаются.',
        talk: function* (g) { yield g.talkTo('chuckles'); },
        items: {
          roach: function* (g) { yield* E.bugPlant(g, 'chuckles'); },
          bearbox: function* (g) { yield g.say('chuckles', 'Мишку надо поставить в лавку. Не мне. Мне хватает.'); },
          sandwich: function* (g) { yield g.say('chuckles', 'Сэндвич принадлежит семье.'); },
          gun: function* (g) { yield g.say('chuckles', 'Уберите. В этой комнате достают оружие только по моей просьбе.'); },
          capgun: function* (g) { yield g.say('chuckles', 'Пистоны. Мило. В семье с таким оружием долго не живут.'); },
          max: function* (g) { yield g.say('max', 'А у меня будет своя голова мишки?'); yield g.say('chuckles', 'У вас уже есть своя. Этого достаточно, чтобы пугать людей.'); }
        }
      }
    },
    enter: function* (g) {
      if (!g.f.backroom) {
        g.f.backroom = true;
        yield g.talkTo('chuckles');
        return;
      }
      if (g.f.joined && allDone(g) && !g.f.inducted && g.actors.chuckles.room === 'backroom') { yield* induction(g); return; }
      if (g.f.chaseWon && !g.seen.emptyBack) {
        g.seen.emptyBack = 1;
        yield g.say('max', 'Никого! Все уехали за нами и не вернулись!');
        yield g.say('sam', 'Семья уехала и дверь за собой не закрыла. Мама Леонарда такого бы не одобрила.');
      }
    },
    setup(g) {
      const ch = g.actors.chuckles;
      if (!g.f.inducted) { g.place('chuckles', 'backroom', 172, 142, 's'); ch.visible = true; ch.act = ''; ch.keepAct = false; }
    },
    onLoad(g) { ROOMS.backroom.setup(g); }
  };

  E.backroom = { induction, joinUp, monitors, MONITORS };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
