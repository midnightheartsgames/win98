(function (S) {
  'use strict';
  const { COLORS } = S;
  const E = S.EP105;
  const { ROOMS, TALK } = E;

  function* gloveFail(g) {
    const sam = g.actors.sam;
    g.f.gloveTried = true;
    yield g.walkTo('sam', 222, 172);
    g.face('sam', 'e');
    g.sfx('slap');
    sam.act = 'ko'; sam.keepAct = true;
    yield 0.9;
    sam.act = ''; sam.keepAct = false;
    yield g.walkTo('sam', 196, 176);
    g.face('sam', 'e');
    yield g.say('sam', 'Локтем в шляпу, раньше чем я замахнулся. У неё там сороковой уровень, а у меня перчатка.');
    yield g.say('max', 'У неё руки длиннее твоих, Сэм! И их, по-моему, шесть!');
  }

  function* fire(g) {
    const sam = g.actors.sam, sy = g.actors.sybil, j = g.actors.jimmy, max = g.actors.max;
    max.scripted = true;
    yield g.walkTo('sam', 150, 176);
    g.face('sam', 'e');
    yield g.say('jimmy', 'Начальник, я буду жаловаться! У меня есть знакомый адво...');
    sam.act = 'shoot'; sam.actT = 0.6;
    g.sfx('gun');
    g.fx.flash = 0.4;
    g.fx.shake = 0.5;
    g.drop('ratcannon');
    g.place('jimmy', 'sybil', sam.x + 18, sam.y - 34, 'e');
    j.visible = true; j.scripted = true; j.act = 'salute'; j.keepAct = true; j.z = 60; j.v = '';
    yield g.walkTo('jimmy', sy.x - 4, sy.y - 62, { free: true, speed: 5 });
    g.sfx('bonk');
    g.fx.shake = 0.4;
    sy.act = 'shock'; sy.keepAct = true; sy.v = '';
    g.f.sybilFree = true;
    g.sfx('zap');
    yield g.walkTo('jimmy', 116, 120, { free: true, speed: 3.4 });
    j.z = 0;
    yield g.walkTo('jimmy', 60, 176, { free: true, speed: 2.4 });
    j.act = ''; j.keepAct = false;
    yield g.say('jimmy', 'Я подам в суд! На тебя и на твою пушку!');
    yield g.walkTo('jimmy', 20, 172, { free: true, speed: 2 });
    g.sfx('door');
    g.place('jimmy', 'nowhere', 0, 0);
    j.scripted = false;
    sy.act = 'rub';
    yield g.say('sybil', 'Ой. Где мой меч? Где мои сорок уровней?');
    sy.act = ''; sy.keepAct = false;
    g.face('sybil', 'w');
    yield g.say('sybil', 'Сэм? Макс? В меня попала крыса?');
    yield g.say('sam', 'Калибр был такой. Ствол разорвало, а твои очки слетели на диван.');
    yield g.say('max', 'Мы тебя спасли! Или ограбили на сорок уровней. Я пока не решил!');
    yield g.walkTo('sybil', 206, 152, { free: true });
    g.face('sybil', 's');
    max.scripted = false;
    yield g.talkTo('sybil5');
  }

  function* fixGoggles(g) {
    yield g.anim('sam', 'reach', 0.5);
    g.sfx('click');
    g.drop('chip');
    g.f.gogglesFixed = true;
    g.give('goggles');
    yield g.say('sam', 'Искры гаснут, стёкла загораются голубым. Чиппи паяет лучше, чем ругается.');
    yield g.say('max', 'А у меня свои! Мне выдали детские!');
    yield g.say('sybil', 'Вы собрались туда? Сэм, оттуда не хочется уходить. В этом вся беда.');
    yield g.say('sam', 'Мне и из очереди в банке уходить не хочется, когда там тепло. Справимся.');
    yield* E.toggle(g);
  }

  TALK.sybil5 = {
    start: function* (g) {
      if (!g.seen.sybil105) {
        g.seen.sybil105 = 1;
        yield g.say('sybil', 'Спасибо. Наверное. Там я была паладином сорокового уровня, а здесь у меня аренда.');
      }
    },
    options: [
      { id: 'what', icon: 'vrgoggles5', text: 'Что это было?', run: function* (g) {
        yield g.say('sybil', 'Реальность 2.0. Я бета-тестер. Мне платят за поиск ошибок.');
        yield g.say('sam', 'Много нашла?');
        yield g.say('sybil', 'Ни одной. Там всё хорошо, Сэм. Я три дня искала причину снять очки.');
      } },
      { id: 'who', icon: 'f:cops', text: 'Кто тебя нанял?', run: function* (g) {
        yield g.say('sybil', 'К.О.П.С. Клуб Охраны Пожилых Систем. Четыре старых компьютера.');
        yield g.say('sybil', 'Они сидят в прокате Лефти. Это в тупике, слева от моей двери.');
        g.f.knowCops = true;
        yield g.say('max', 'Нас три дня гипнотизировали через стенку, а мы узнаём от соседки!');
      } },
      { id: 'pay', icon: 'goldcoins5', text: 'Чем они платят?', when: g => g.f.knowCops, run: function* (g) {
        yield g.say('sybil', 'Золотом. Нарисованным. Зато вовремя.');
        yield g.say('sybil', 'За аренду им не заплатишь. Я пробовала приложить очки к квитанции.');
      } },
      { id: 'broken', icon: 'vrchip5', text: 'Твои очки ещё работают?', when: g => !g.f.gogglesFixed, run: function* (g) {
        yield g.say('sybil', 'Нет. Когда прилетела крыса, внутри что-то хлопнуло. Микросхема теперь уголь.');
        yield g.say('sybil', 'Забирай, если нужны. Я к ним не подойду.');
        g.f.knowChip = true;
      } },
      { id: 'level', icon: 'level5', text: 'Сорок уровней за три дня?', run: function* (g) {
        yield g.say('sybil', 'Я старалась. Мама говорила, что я ничего не довожу до конца.');
        yield g.say('sybil', 'Я довела до сорокового. Жалко, что ей туда не позвонить.');
      } },
      { id: 'go', icon: 'net5', text: 'Мы идём туда сами.', when: g => g.f.gogglesFixed, run: function* (g) {
        yield g.say('sybil', 'Следите друг за другом. Если один начнёт улыбаться без причины, второй пусть бьёт.');
        yield g.say('max', 'Сэм, наконец-то нам это прописали!');
      } },
      { id: 'bye', icon: 'bye', text: 'Отдыхай, Сибил.', end: true, run: function* (g) {
        yield g.say('sybil', 'Отдохну. Потом сменю вывеску. Бета-тесты мне разонравились.');
      } }
    ]
  };

  ROOMS.sybil = {
    id: 'sybil', name: 'Контора Сибил', w: 320, music: 'sybil',
    paint: b => S.BG.sybil(b, {}),
    walk: [[6, 126, 316, 126, 316, 198, 6, 198]],
    block: [[64, 150, 158, 150, 158, 162, 64, 162], [166, 150, 228, 150, 228, 162, 166, 162]],
    layers: [
      { id: 'board', x: 60, y: 50 },
      { id: 'fox', x: 124, y: 94 },
      { id: 'couch', x: 60, y: 118, base: 160 },
      { id: 'goggles', x: 100, y: 128, base: 161, when: g => g.f.sybilFree && !g.f.gogglesFixed },
      { id: 'sparks', x: 100, y: 120, base: 162, when: g => g.f.sybilFree && !g.f.gogglesFixed, key: g => Math.floor(g.time * 8) % 4 },
      { id: 'desk', x: 164, y: 104, base: 160, key: g => Math.floor(g.time * 5) % 3 },
      { id: 'lamp', x: 232, y: 72, base: 131 }
    ],
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [4, 36, 38, 112], walk: [40, 168], face: 'w',
        look: 'Дверь на улицу. Изнутри приклеен график: «Дней в тесте: 3. Дней на воздухе: 0».',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street', { x: 202, y: 146, dir: 's' }); } },
      { id: 'couch', name: 'Диван', rect: [62, 118, 96, 40], walk: [110, 170], face: 'n',
        look: 'Диван. Раньше на нём ждали любви. На подушке вмятина по форме Сибил, значит, спала она тут же, в очках.',
        use: 'Садиться не буду. С этого дивана трудно встать, это видно по хозяйке.' },
      { id: 'goggles', name: 'Очки Сибил', rect: [98, 124, 26, 16], walk: [112, 170], face: 'n', over: true, when: g => g.f.sybilFree && !g.f.gogglesFixed,
        look: 'Очки Сибил лежат на диване и искрят. Внутри что-то сгорело. Рядом лежит отпечаток крысы.',
        use: function* (g) {
          g.sfx('zap');
          yield g.say('sam', 'Бьёт током. Сейчас это неудобная шапка с проводом и запахом горелого.');
        },
        items: {
          chip: function* (g) { yield* fixGoggles(g); },
          gun: 'Добивать очки незачем. Их уже победил Джимми.',
          roach: function* (g) { yield E.bug(g, 'Внутри всё сгорело, сэр! Слушать нечего, сэр!'); }
        } },
      { id: 'board', name: 'Доска', rect: [60, 50, 100, 38], walk: [110, 132], face: 'n',
        look: ['Доска «Найдено ошибок». Столбики растут день ото дня, а сверху приколота бумажка: «Ноль».', 'Столбики, оказывается, считают уровни. Ошибок Сибил так и не нашла.'] },
      { id: 'fox', name: 'Чучело лисы', rect: [124, 94, 34, 24], walk: [140, 134], face: 'n',
        look: 'Чучело лисы в маленьких очках. Сибил проверяла на нём ремешок. Лиса, судя по морде, тоже где-то на сороковом уровне.',
        use: 'Снимать с лисы очки не стану. Вдруг ей там лучше.' },
      { id: 'desk', name: 'Стол Сибил', rect: [164, 116, 64, 32], walk: [160, 172], face: 'e',
        look: 'Стол Сибил. Компьютер, модем и деревянный идол. Розовый телефон убран в ящик. Линкольн так и не позвонил.',
        use: 'В ящики не лезу. В одном из них живёт её прошлая профессия.' },
      { id: 'pc', name: 'Компьютер', rect: [168, 104, 22, 20], walk: [160, 172], face: 'e', over: true,
        look: 'Компьютер Сибил. На экране крутится спираль. Если смотреть дольше трёх секунд, хочется надеть что-нибудь на голову.',
        use: 'Выключатель не работает. Он нажимается, пишет «ваше мнение учтено» и включается обратно.',
        items: {
          gun: 'Комиссар говорил про тостер с паролем. Раненый компьютер будет хуже.',
          roach: function* (g) { yield E.bug(g, 'Объект гудит и зовёт в очки, сэр! Я держусь, сэр!'); },
          hanky: 'Чихать на один компьютер мало. Остальные даже не узнают, что он болел.'
        } },
      { id: 'modem', name: 'Модем', rect: [192, 114, 15, 7], walk: [160, 172], face: 'e', over: true,
        look: 'Модем. Четыре лампочки мигают по очереди. По проводу от него что-то уходит в стену, в сторону проката Лефти.',
        use: 'Выдёргивать провод не стану. Комиссар просил ничего не трогать в розетках.' },
      { id: 'tiki', name: 'Идол', rect: [209, 108, 15, 18], walk: [160, 172], face: 'e', over: true,
        look: 'Деревянный идол с зубами. Ценник на дне: четыре девяносто девять. Он пережил свидания и переживёт бета-тесты.',
        use: 'Идола не трону. Он единственный тут смотрит на мир без очков.' },
      { id: 'books', name: 'Книжный шкаф', rect: [170, 22, 50, 76], walk: [196, 132], face: 'n',
        look: ['На полке новая книга: «Сто ошибок, которые вы не найдёте». Закладка на первой странице.', 'Справочник по изотопам переехал на нижнюю полку, к Фрейду.'] },
      { id: 'window', name: 'Окно', rect: [230, 26, 44, 58], walk: [252, 132], face: 'n', look: 'Жалюзи закрыты. Сибил три дня не знала, день на улице или ночь.' },
      { id: 'plant', name: 'Фикус', rect: [240, 84, 32, 38], walk: [252, 134], face: 'n',
        look: 'Фикус. Три дня без воды. Он пережил психотерапию, газету и мафию, и это его не сломает.',
        use: 'Поливать нечем. Скажу Сибил, когда она придёт в себя.' },
      { id: 'closet', name: 'Кладовка', rect: [282, 30, 34, 90], walk: [290, 136], face: 'n',
        look: 'Дверь в кладовку. При службе знакомств она называлась студией.',
        use: 'Заперто. За дверью тихо. Клиент с длинной анкетой, видимо, договорил.' },
      { id: 'diplomas', name: 'Дипломы', rect: [54, 20, 114, 28], walk: [110, 132], face: 'n',
        look: 'Дипломы. К прежним добавился новый: «Бета-тестер третьей степени. Выдан К.О.П.С.» Печать распечатана на матричном принтере.',
        items: { binoc: 'В бинокль видно мелкий шрифт. На всех дипломах одно: «Курс прослушан заочно».' } }
    ],
    actors: {
      sybil: {
        name: 'Сибил', walk: g => (g.f.sybilFree ? [160, 172] : [196, 176]), face: 'e',
        look: g => g.f.sybilFree ? 'Сибил Пандемик, бывший бета-тестер. Под глазами красные круги по форме очков.' : 'Сибил в очках. Рубит воздух и кричит «получай». Вокруг неё метр, в который лучше не входить.',
        talk: function* (g) {
          if (g.f.sybilFree) { yield g.talkTo('sybil5'); return; }
          yield g.say('sam', 'Сибил!');
          yield g.say('sybil', 'Не сейчас, мама! У меня босс!');
          yield g.say('sam', 'Она меня не слышит. И, кажется, только что назвала мамой.');
        },
        use: function* (g) {
          if (g.f.sybilFree) { yield g.say('sybil', 'Руки, Сэм. Я три дня не снимала это платье.'); return; }
          yield g.say('sam', 'Снять очки руками? К ней не подойти. Она машет, как мельница в ураган.');
        },
        items: {
          glove: function* (g) {
            if (g.f.sybilFree) { yield g.say('sybil', 'Убери. В меня сегодня уже попали крысой.'); return; }
            yield* gloveFail(g);
          },
          ratcannon: function* (g) { yield* fire(g); },
          gun: 'Стрелять в Сибил? Она ни разу не выставила мне счёт. Таких соседей берегут.',
          roach: function* (g) { yield* E.bugPlant(g, 'sybil', g.f.sybilFree ? 'sybil' : 'sybilvr'); },
          chip: function* (g) { yield g.say('sybil', 'Это от них? Вставляй сам. Очки на диване, и я к ним не подойду.'); },
          goggles: function* (g) { yield g.say('sybil', 'Убери их! Нет, дай посмотреть. Нет! Убери.'); },
          hanky: function* (g) { yield g.say('sybil', 'Чей-то насморк в платке? За миллиард? Сэм, я всю жизнь выбираю не те профессии.'); },
          binoc: function* (g) { yield g.say('sybil', 'Не смотри на меня в бинокль, Сэм. Я три дня не умывалась.'); },
          max: function* (g) {
            if (g.f.sybilFree) { yield g.say('max', 'Сибил, назначь меня кем-нибудь! Ты же всё время кем-то становишься!'); yield g.say('sybil', 'Ты и так президент, Макс. Выше у меня должностей нет.'); return; }
            yield g.say('max', 'Сибил! Она не слышит. Сэм, можно я её укушу?');
            yield g.say('sam', 'Она машет руками, Макс. Укусит она.');
          }
        }
      }
    },
    enter: function* (g) {
      if (g.f.sybilFree || g.seen.sybilFirst) return;
      g.seen.sybilFirst = 1;
      g.f.sybilSeen = true;
      yield g.say('sybil', 'Получай, слизь! И ты получай!');
      yield g.say('max', 'Она дерётся с воздухом! Воздух проигрывает!');
      yield g.say('sam', 'На ней очки, как в рекламе. Нас она не видит.');
    },
    setup(g) {
      const sy = g.actors.sybil;
      sy.visible = true; sy.scripted = false;
      if (g.f.sybilFree) {
        g.place('sybil', 'sybil', 206, 152, 's');
        sy.act = ''; sy.keepAct = false; sy.v = '';
        return;
      }
      g.place('sybil', 'sybil', 248, 170, 'w');
      sy.act = 'flail'; sy.keepAct = true; sy.v = 'vr';
    },
    onLoad(g) { ROOMS.sybil.setup(g); }
  };

  const BLOG = [
    'Запись первая. Меня взяли бета-тестером. Платят золотом. Мама, если слышишь: оно нарисованное, зато вовремя.',
    'Запись двенадцатая. Нашла ошибку: в этом мире нет ошибок. Сообщила. Ответили, что так задумано.',
    'Запись тридцатая. Я паладин сорокового уровня. Авраам так и не позвонил. Здесь мне всё равно.',
    'Запись последняя. Очки можно снять в любую минуту. Сниму завтра. Или после сорок первого уровня.'
  ];

  function* playBlog(g) {
    const text = BLOG[(g.count('blog') - 1) % BLOG.length];
    g.vt.blogT = g.time + g.textDur(text);
    g.sfx('beep');
    yield g.say(null, text, { key: 'blog', color: COLORS.blog, x: 197, y: 80 });
    g.vt.blogT = 0;
    if (g.seen.blog === BLOG.length) yield g.say('sam', 'Последняя запись сделана сегодня утром. За час до нашей крысы.');
  }

  function* underDoor(g) {
    const sam = g.actors.sam, max = g.actors.max;
    if (g.f.coinCloset) { yield g.say('sam', 'В кладовке остались швабра и ведро. Монету я забрал.'); return; }
    if (E.body(g) !== 'flat') {
      yield g.say('sam', 'Заперто. Из-под двери бьёт золотой свет. Щель такая, что пройдёт разве что письмо.');
      if (g.f.controlSeen) yield g.say('max', 'Сэм, я бы пролез, но у меня уши! И достоинство!');
      return;
    }
    max.scripted = true;
    g.sfx('whoosh');
    yield g.walkTo('sam', 298, 126, { free: true });
    sam.visible = false;
    yield 0.9;
    g.sfx('chime');
    sam.visible = true;
    yield g.walkTo('sam', 290, 136, { free: true });
    max.scripted = false;
    g.f.coinCloset = true;
    E.addCoins(g);
    yield g.say('sam', 'В кладовке швабра и золотая монета. Швабра нарисована лучше меня.');
    yield g.say('max', 'Я тоже хочу под дверь! А, я уже плоский. Отлично! Я давно мечтал стать открыткой!');
  }

  function* intro(g) {
    g.seen.vrIntro = 1;
    g.f.vrSeen = true;
    yield E.net(g, 'Добро пожаловать в Реальность 2.0. Я Интернет, хозяйка этого мира.');
    yield E.net(g, 'Здесь всё как у вас, только исправлено. Располагайтесь. Уходить не обязательно.');
    yield g.say('max', 'Сэм, я вижу то же самое, только розовое!');
    yield g.say('sam', 'Контора Сибил. Диван без пятен, фикус без пыли. Улучшили всё, кроме нас с тобой.');
    yield E.net(g, 'Вас улучшить не удалось. Приношу извинения. Мы над этим работаем.');
    yield g.say('sam', 'Очки я сниму, когда захочу. Они так и висят в правом нижнем углу глаза.');
  }

  ROOMS.sybil2 = {
    id: 'sybil2', name: 'Контора Сибил 2.0', w: 320, music: 'reality',
    paint: b => S.BG.virt((S.BG.sybil(b, {}), b)),
    walk: [[6, 126, 316, 126, 316, 198, 6, 198]],
    block: [[64, 150, 158, 150, 158, 162, 64, 162], [166, 150, 228, 150, 228, 162, 166, 162]],
    layers: [
      { id: 'clock', x: 132, y: 60, key: g => Math.floor(g.time * 6) % 19 },
      { id: 'glow', x: 279, y: 27, when: g => !g.f.coinCloset, key: g => Math.floor(g.time * 5) % 3 },
      { id: 'couch', x: 60, y: 118, base: 160 },
      { id: 'desk', x: 164, y: 104, base: 160 },
      { id: 'mouth', x: 182, y: 84, base: 161, key: g => Math.round(Math.sin(g.time * 2) * 1.5) + ':' + (g.vt.blogT && g.time < g.vt.blogT ? Math.floor(g.time * 9) % 3 : 'c') },
      { id: 'lamp', x: 232, y: 72, base: 131 }
    ],
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [4, 36, 38, 112], walk: [40, 168], face: 'w',
        look: 'Дверь на улицу 2.0. Фиолетовая. Графика «дней на воздухе» на ней нет. Здесь воздух не считают.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street2', { x: 202, y: 146, dir: 's' }); } },
      { id: 'couch', name: 'Диван 2.0', rect: [62, 118, 96, 40], walk: [110, 170], face: 'n',
        look: 'Диван 2.0. Розовый, без единой вмятины. На нём ещё никто ничего не ждал.',
        use: 'Диван не проминается, хоть прыгай. Мне больше нравится наш, с пружиной.' },
      { id: 'clock', name: 'Часы', rect: [132, 60, 20, 20], walk: [142, 132], face: 'n',
        look: ['Часы показывают без пяти. Без пяти чего, не сказано.', 'Теперь на часах половина. Стрелки крутятся как хотят.', 'Здешние часы идут быстрее, когда на них смотришь. Больше я за ними не слежу.'],
        use: 'Подводить нечего. У часов нет колёсика, у времени тут нет хозяина.' },
      { id: 'desk', name: 'Стол', rect: [164, 116, 64, 32], walk: [160, 172], face: 'e',
        look: 'Стол 2.0. Компьютера на нём нет. Компьютер тут снаружи, и мы у него внутри.',
        use: 'Ящики нарисованы. Даже не выдвигаются для вида.' },
      { id: 'mouth', name: 'Сетевой дневник Сибил', rect: [182, 84, 30, 20], walk: [160, 172], face: 'e', over: true,
        look: 'Над столом висит рот без лица и шевелит губами. Подпись: «Сетевой дневник д-ра Сибил. Читателей: 3».',
        use: function* (g) { yield* playBlog(g); },
        talk: function* (g) { yield* playBlog(g); },
        items: {
          hanky: 'Чихать в чужой дневник я не буду. Записи потом не отмыть. Да и услышат их трое.',
          gun: function* (g) { g.sfx('laser'); yield g.say('sam', 'Пиу. Рот закрылся, подумал и открылся снова. Дневник не заткнуть.'); },
          max: function* (g) { yield g.say('max', 'Я хочу оставить отзыв! Зубами!'); }
        } },
      { id: 'books', name: 'Книжный шкаф', rect: [170, 22, 50, 76], walk: [196, 132], face: 'n',
        look: 'Книги 2.0. Корешки одного роста. Названия заменили на «Книга», «Книга» и «Ещё книга».' },
      { id: 'window', name: 'Окно', rect: [230, 26, 44, 58], walk: [252, 132], face: 'n', look: 'Жалюзи в розовую полоску. За ними светло в любое время суток.' },
      { id: 'plant', name: 'Фикус 2.0', rect: [240, 84, 32, 38], walk: [252, 134], face: 'n',
        look: 'Фикус 2.0. Листья одинаковые, как под копирку. Наш фикус мне нравится больше. Он через многое прошёл.',
        use: 'Лист шуршит с опозданием на полсекунды.' },
      { id: 'closet', name: 'Кладовка', rect: [282, 30, 34, 90], walk: [290, 136], face: 'n',
        look: g => g.f.coinCloset ? 'Кладовка 2.0. Свет из-под двери погас. Монета у меня.' : 'Дверь кладовки. Заперта. Из-под неё бьёт золотой свет.',
        use: function* (g) { yield* underDoor(g); },
        items: {
          sword: 'Дверь нарисована прочнее меча. Проверять не буду, меч жалко.',
          sword2: 'Рубить дверь мечом +2? У двери, подозреваю, +3.',
          gun: function* (g) { g.sfx('laser'); yield g.say('sam', 'Пиу. Луч ушёл в замочную скважину и не вернулся.'); }
        } },
      { id: 'diplomas', name: 'Дипломы', rect: [54, 20, 114, 28], walk: [110, 132], face: 'n',
        look: 'Дипломы 2.0. Все выданы д-ру Сибил, и все за одно и то же: «За участие».' }
    ],
    actors: {
      sybav: {
        name: 'Аватар Сибил', walk: [236, 170], face: 'e',
        look: 'Аватар Сибил. Корона и крылья, в руке волшебная палочка. Хозяйка вышла, а он стоит и улыбается в стену.',
        talk: function* (g) {
          g.sfx('chime');
          yield g.say('sybav', 'Пользователь не в сети. Оставьте сообщение после феи.');
          yield g.say('sam', 'Сибил, это Сэм. Правильно сделала, что не вернулась.');
        },
        use: 'Лапа проходит сквозь крыло. Красота тут бесплотная.',
        items: {
          gun: function* (g) { g.sfx('laser'); yield g.say('sam', 'Пиу. Аватар не моргнул. Хозяйки нет, моргать некому.'); },
          glove: 'Перчатка +0 против пустого аватара. Оба остались при своём.',
          sword: 'Рубить пустой аватар? Сибил мне не простит. Он даже не заметит.',
          sword2: 'Меч +2 на пустую фею? Я пёс, у меня есть принципы.',
          max: function* (g) { yield g.say('max', 'Я надену её крылья! Нет. Они не снимаются. Сэм, этот мир жадный.'); }
        }
      }
    },
    enter: function* (g) {
      if (!g.seen.vrIntro) yield* intro(g);
    },
    setup(g) {
      const a = g.actors.sybav;
      g.place('sybav', 'sybil2', 262, 150, 'w');
      a.visible = true;
      g.vt.blogT = 0;
    },
    onLoad(g) { ROOMS.sybil2.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
