(function (S) {
  'use strict';
  const E = S.EP104;
  const { ROOMS, TALK } = E;

  const NOTED = ['Записала.', 'Так. Это пойдёт в графу «увлечения».', 'Угу. Совместимость растёт.', 'Это я впишу карандашом.'];

  function* matchResult(g) {
    const sy = g.actors.sybil;
    g.f.matched = true;
    yield g.say('sybil', 'Кладу анкеты в компьютер.');
    g.sfx('drop');
    yield g.say('max', 'Сэм, она сунула их в ящик стола.');
    yield g.say('sybil', 'Компьютер стеснительный. Он думает.');
    g.sfx('scan');
    yield 0.8;
    sy.act = 'point'; sy.actT = 1.4;
    yield g.say('sybil', 'Готово. Идеальная пара для Сэма: Макс. Идеальная пара для Макса: Сэм. Пятнадцать совпадений из пятнадцати.');
    yield g.say('max', 'Я так и знал! Сэм, когда свадьба?');
    yield g.say('sam', 'Мы уже делим стол, машину и шкаф. Дальше идёт общий счёт в банке, а счёта у нас нет.');
  }

  const LIKES = [
    ['guns', 'gun', 'Огнестрельное оружие.', 'sam'],
    ['donuts', 'donut', 'Пончики.', 'sam'],
    ['fists', 'fist', 'Бить людей!', 'max'],
    ['road', 'car', 'Долгие поездки без цели.', 'sam'],
    ['tv', 'tv', 'Телевизор! Особенно когда он взрывается!', 'max']
  ];

  TALK.match = {
    options: (g, d) => LIKES.map(([id, icon, text, who]) => ({
      id, icon, text, speaker: who, when: () => !(d.data.picked || []).includes(id),
      run: function* (gg) {
        d.data.picked = (d.data.picked || []).concat([id]);
        yield gg.say('sybil', NOTED[(d.data.picked.length - 1) % NOTED.length]);
        if (d.data.picked.length >= 3) { gg.endDialog(); yield* matchResult(gg); }
      }
    })).concat([{ id: 'bye', icon: 'bye', text: 'Хватит, пиши как есть.', end: true, run: function* (gg) { gg.endDialog(); yield* matchResult(gg); } }])
  };

  function* giveFlyer(g) {
    const sy = g.actors.sybil;
    if (g.f.scandal) { yield g.say('sybil', 'Уберите. Этим лицом я растопила бы камин, будь у меня камин.'); return; }
    if (g.f.sybilSmitten) { yield g.say('sybil', 'У меня уже есть одна. Лежит под подушкой. То есть в папке. В деловой папке.'); return; }
    yield g.anim('sam', 'reach', 0.4);
    g.drop('flyer');
    yield g.say('sam', 'Вот ещё одна анкета. От клиента.');
    yield g.say('sybil', '«Ты нужен мне». Высокий. Надёжный. С богатой историей. Занимал высший пост.');
    sy.act = 'swoon'; sy.keepAct = true;
    yield g.say('sybil', 'Сэм. Кто это?');
    yield g.say('sam', 'Авраам Линкольн.');
    yield g.say('sybil', 'Он ведь... свободен?');
    yield g.say('sam', 'Вдовец. С тысяча восемьсот восемьдесят второго года.');
    yield g.say('sybil', 'Шесть метров мрамора и ни одной вредной привычки. Мама говорила: ищи мужчину твёрдого.');
    sy.act = ''; sy.keepAct = false;
    g.f.sybilSmitten = true;
    g.f.sybilNumber = true;
    yield g.say('sybil', 'Передайте ему мой номер. Пусть позвонит. Я подожду у телефона. Ждать я умею, я была свидетелем.');
    yield g.say('max', 'Она будет ждать звонка от статуи, Сэм! У статуи даже карманов нет!');
    yield g.say('sam', 'Тише, Макс. Надежда у неё есть, а службе знакомств большего и не надо.');
  }

  TALK.sybil4 = {
    start: function* (g) {
      if (!g.seen.sybil104) {
        g.seen.sybil104 = 1;
        yield g.say('sybil', 'Сэм! Макс! Заходите, садитесь. Вы пришли вдвоём? Это уже кое-что говорит о совместимости.');
      }
    },
    options: [
      { id: 'job', icon: 'q', text: 'Кем ты работаешь на этой неделе?', run: function* (g) {
        yield g.say('sybil', 'Служба знакомств. Подбираю пары и назначаю даты свиданий.');
        yield g.say('sybil', 'Суд над мафией отменили. Подсудимых разнесло по трём округам, и свидетель остался без работы.');
      } },
      { id: 'how', icon: 'form', text: 'Как ты подбираешь пары?', run: function* (g) {
        yield g.say('sybil', 'Клиент заполняет анкету. Я кладу её в компьютер, и он ищет совпадение по пятнадцати пунктам.');
        yield g.say('max', 'А где компьютер?');
        yield g.say('sybil', 'В ящике стола. Он не любит, когда на него смотрят.');
      } },
      { id: 'you', icon: 'heart', text: 'А себе ты пару нашла?', run: function* (g) {
        yield g.say('sybil', 'Себе сложнее. Мне нужен мужчина постарше. Высокий, солидный, с историей. С хорошей должностью.');
        yield g.say('sybil', 'Таких разбирают ещё при жизни.');
        g.f.knowType = true;
      } },
      { id: 'apply', icon: 'f:max', text: 'Мы хотим подать заявку.', when: g => !g.f.matched, end: true, run: function* (g) {
        yield g.say('sybil', 'Оба? Бывало и не такое. Где-то. Наверное. Назовите, что вы любите, я запишу.');
        g.endDialog();
        yield g.talkTo('match');
      } },
      { id: 'abe', icon: 'f:lincoln', text: 'Линкольн тебе ещё не звонил?', when: g => g.f.sybilSmitten, run: function* (g) {
        yield g.say('sybil', 'Нет. Я проверяла трубку четыре раза. Гудок есть. Авраама нет.');
      } },
      { id: 'studio', icon: 'keyhole', text: 'Что у тебя за той дверью?', run: function* (g) {
        yield g.say('sybil', 'Студия. Там я записываю видеоанкеты. Дверь заперта, ключ потерялся в четверг.');
        yield g.say('sybil', 'Один клиент до сих пор внутри. У него длинная анкета.');
      } },
      { id: 'bye', icon: 'bye', text: 'Удачи с парами.', end: true, run: function* (g) {
        yield g.say('sybil', g.f.sybilSmitten ? 'Если увидите Авраама, скажите, что я свободна по вечерам. И днём. И утром.' : 'Любовь найдёт каждого, Сэм. Я ей помогаю с адресами.');
      } }
    ]
  };

  function* demo(g) {
    const sy = g.actors.sybil;
    yield g.say('sybil', 'Наводишь на вещь, жмёшь курок. Он считает углерод и называет возраст. Смотрите.');
    g.face('sybil', 'e');
    sy.act = 'scan'; sy.keepAct = true;
    g.sfx('scan');
    yield 0.9;
    yield g.say('sybil', 'Две тысячи лет! Сэм, моему идолу две тысячи лет!');
    sy.act = ''; sy.keepAct = false;
    g.face('sybil', 's');
    yield g.say('max', 'У него на дне ценник. Четыре девяносто девять.');
    yield g.say('sybil', 'Древний ценник. Моя контора теперь историческое место! Историческим местам дают деньги из бюджета!');
    g.f.tikiDated = true;
    yield g.say('sam', 'Поздравляю, Сибил. Идол, правда, выглядит моложе своего ценника.');
  }

  TALK.sybilc = {
    start: function* (g) {
      if (!g.seen.sybilc) {
        g.seen.sybilc = 1;
        yield g.say('sybil', 'Если вы насчёт свиданий, я закрыта. Навсегда. До следующей профессии.');
      }
    },
    options: [
      { id: 'job', icon: 'q', text: 'Ты опять сменила работу?', run: function* (g) {
        yield g.say('sybil', 'Вывеска та же: «Даты на заказ». На новую нет денег. Теперь я назначаю даты вещам.');
        yield g.say('sybil', 'Углеродный анализ. Вещи хотя бы не врут про возраст.');
      } },
      { id: 'abe', icon: 'f:lincoln', text: 'Прости за Линкольна.', run: function* (g) {
        yield g.say('sybil', 'Он сказал, что видит меня впервые. При всей стране.');
        yield g.say('sybil', 'Ничего. Мужчины приходят и уходят, а период полураспада постоянен.');
      } },
      { id: 'how', icon: 'dater', text: 'Как работает твой прибор?', run: function* (g) {
        if (g.f.tikiDated) { yield g.say('sybil', 'Я уже показывала. Идолу две тысячи лет. Жду письма из реестра исторических мест.'); return; }
        yield* demo(g);
      } },
      { id: 'lend', icon: 'car', text: 'Одолжи нам прибор на часок.', run: function* (g) {
        yield g.say('sybil', 'Он мне самой нужен, Сэм. Он в кредит. Я вся в кредит.');
        yield g.say('sybil', 'Вот получу субсидию, уеду в отпуск, тогда берите. Если получу.');
        g.f.knowLend = true;
      } },
      { id: 'money', icon: 'money', text: 'Как у тебя с деньгами?', once: true, run: function* (g) {
        yield g.say('sybil', 'Вывеска в долг, прибор в долг, платье до сих пор в кетчупе. Мне нужен отпуск. Отпуску нужны деньги.');
      } },
      { id: 'bye', icon: 'bye', text: 'Держись, Сибил.', end: true, run: function* (g) {
        yield g.say('sybil', 'Держусь. За прибор. Он дорогой.');
      } }
    ]
  };

  function* dateTiki(g) {
    g.sfx('scan');
    yield g.anim('sam', 'reach', 0.5);
    yield g.say('sam', 'Десять лет. Сибил держала прибор вверх ногами.');
    yield g.say('max', 'Я же говорил про ценник!');
  }

  ROOMS.sybil = {
    id: 'sybil', name: 'Контора Сибил', w: 320, music: 'sybil',
    paint: b => S.BG.sybil(b, {}),
    walk: [[6, 126, 316, 126, 316, 198, 6, 198]],
    block: [[64, 150, 158, 150, 158, 162, 64, 162], [166, 150, 228, 150, 228, 162, 166, 162]],
    layers: [
      { id: 'board', x: 60, y: 50, key: g => g.f.scandal ? 'c' : '' },
      { id: 'fox', x: 124, y: 94 },
      { id: 'couch', x: 60, y: 118, base: 160 },
      { id: 'desk', x: 164, y: 108, base: 160, key: g => g.f.sybilGone ? 'g' : '' },
      { id: 'dater', x: 169, y: 105, base: 161, when: g => g.f.sybilGone && !g.f.daterTaken },
      { id: 'lamp', x: 232, y: 72, base: 131 }
    ],
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [4, 36, 38, 112], walk: [40, 168], face: 'w', look: 'Дверь на улицу. Изнутри на ней висит табличка: «Вошёл один? Выйдешь не один. Шансы пятьдесят на пятьдесят».',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street', { x: 82, y: 146, dir: 's' }); } },
      { id: 'couch', name: 'Диван', rect: [62, 118, 96, 40], walk: [110, 170], face: 'n',
        look: 'Диван для клиентов. Здесь сидят и ждут любви. Обивка протёрта в двух местах, по краям.',
        use: 'Садиться не буду. Сибил тут же подберёт мне пару. Я догадываюсь, какую.' },
      { id: 'board', name: 'Доска', rect: [60, 50, 100, 38], walk: [110, 132], face: 'n',
        look: g => g.f.scandal ? 'Таблица элементов и плакат «Вещи не врут». Углерод обведён красным. Рядом обведены и зачёркнуты буквы «А. Л.».' : g.count('board104') % 2 ? 'Доска «Наши счастливые пары». Три сердечка и одна пустая рамка с вопросительным знаком.' : 'Под рамками счёт: «Пар создано: 0». Сердечки, выходит, для красоты.' },
      { id: 'fox', name: 'Чучело лисы', rect: [124, 94, 34, 24], walk: [140, 134], face: 'n',
        look: 'Чучело лисы на полке. Сибил говорит, что у лисы была пара. Пара стоит в другой конторе.',
        use: 'Гладить чучело? Оно линяет. Я тоже, и нам обоим неловко.',
        items: { dater: function* (g) { g.sfx('scan'); yield g.say('sam', 'Лисе восемь лет. Семь из них она простояла на этой полке.'); yield g.say('max', 'Хорошая работа! Стоишь, и все тебя гладят!'); } } },
      { id: 'desk', name: 'Стол Сибил', rect: [164, 116, 64, 32], walk: [160, 172], face: 'e',
        look: g => g.f.sybilGone ? 'Стол Сибил. На нём записка: «Уехала в отпуск. Первый раз за все мои профессии. Прибор не ронять. С.»' : g.f.scandal ? 'Стол Сибил. Коробка с анкетами заклеена скотчем крест-накрест. Идол стоит на самом видном месте.' : 'Стол Сибил. Розовый телефон, коробка для анкет и деревянный идол с зубами.',
        use: 'В чужие ящики я не лезу. Там живёт компьютер.',
        items: { flyer: function* (g) { if (g.f.sybilGone) { yield g.say('sam', 'Анкеты больше не принимают. Сибил в отпуске.'); return; } yield* giveFlyer(g); } } },
      { id: 'appbox', name: 'Коробка для анкет', rect: [168, 116, 18, 9], walk: [160, 172], face: 'e', over: true,
        look: g => g.f.scandal ? 'Коробка для анкет. Заклеена скотчем. Сверху написано: «Хватит».' : 'Коробка «Анкеты». Внутри две бумажки. Обе, похоже, заполнены одной рукой.',
        use: 'Чужие анкеты читать нельзя. Там пишут про себя правду, и от этого неловко всем.',
        items: { flyer: function* (g) { if (g.f.sybilGone) { yield g.say('sam', 'Коробка заклеена, хозяйка в отпуске.'); return; } yield* giveFlyer(g); } } },
      { id: 'tiki', name: 'Идол', rect: [209, 108, 15, 18], walk: [160, 172], face: 'e', over: true,
        look: g => g.f.tikiDated ? 'Идол, которому «две тысячи лет». На дне ценник: четыре девяносто девять.' : 'Деревянный идол с зубами. Сибил привезла его из отпуска, в который так и не съездила.',
        use: 'Идола не трону. Он смотрит так, будто уже подобрал мне пару.',
        items: { dater: function* (g) { yield* dateTiki(g); } } },
      { id: 'sphone', name: 'Розовый телефон', rect: [187, 116, 15, 9], walk: [160, 172], face: 'e', over: true,
        look: g => g.f.sybilSmitten && !g.f.scandal ? 'Розовый телефон. Сибил смотрит на него чаще, чем на нас.' : 'Розовый телефон. Трубка тёплая. По нему много ждали.',
        use: 'Это телефон Сибил. По нему не звонят, по нему ждут.' },
      { id: 'dater', name: 'Углеродный датировщик', rect: [169, 105, 18, 11], walk: [160, 172], face: 'e', over: true, when: g => g.f.sybilGone && !g.f.daterTaken,
        look: 'Прибор Сибил лежит на коробке с анкетами. Хозяйка в отпуске, прибор скучает.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.5);
          g.f.daterTaken = true;
          g.give('dater');
          yield g.say('sam', 'Сибил разрешила. Письменно, в записке, с пометкой «не ронять».');
        } },
      { id: 'books', name: 'Книжный шкаф', rect: [170, 22, 50, 76], walk: [196, 132], face: 'n',
        look: g => g.f.scandal ? 'На полке появился справочник по изотопам. Закладка лежит на слове «распад».' : g.count('books104') % 2 ? '«Как найти мужчину за десять дней». Рядом «Как потерять его за два».' : '«Фрейд для начинающих» всё так же стоит корешком внутрь.' },
      { id: 'window', name: 'Окно', rect: [230, 26, 44, 58], walk: [252, 132], face: 'n', look: 'Жалюзи приоткрыты. Сибил выглядывает, не идёт ли кто с анкетой.' },
      { id: 'plant', name: 'Фикус', rect: [240, 84, 32, 38], walk: [252, 134], face: 'n', look: 'Фикус пережил психотерапию, газету и мафию. К нему привязана ленточка: «Свободен».', items: { dater: function* (g) { g.sfx('scan'); yield g.say('sam', 'Фикусу шестнадцать лет. Самый взрослый в этой конторе, не считая ценника.'); } } },
      { id: 'closet', name: 'Дверь в студию', rect: [282, 30, 34, 90], walk: [290, 136], face: 'n',
        look: 'Дверь в студию. Там Сибил записывает видеоанкеты. Заперта.',
        use: function* (g) {
          if (g.f.sybilGone) { yield g.say('sam', 'Заперто. Изнутри кто-то вполголоса перечисляет свои достоинства. Дошёл до сорок второго.'); return; }
          yield g.say('sybil', 'Не дёргай, Сэм. Ключ потерялся, а клиент внутри ещё не закончил.');
        } },
      { id: 'diplomas', name: 'Дипломы', rect: [54, 20, 114, 28], walk: [110, 132], face: 'n', look: 'Дипломы: психолог, мастер тату, водитель погрузчика, сомелье по газировке. Издатель, свидетель и сваха пока без рамок.' }
    ],
    actors: {
      sybil: {
        name: 'Сибил', walk: [160, 172], face: 'e',
        look: g => g.f.scandal ? 'Сибил Пандемик. Глаза красные, в руках прибор. Сердечко с платья она сняла.' : g.f.sybilSmitten ? 'Сибил Пандемик. Сидит у телефона и поправляет причёску каждые десять секунд.' : 'Сибил Пандемик, служба знакомств. На платье брошка-сердечко, под ней еле видно старое пятно от кетчупа.',
        talk: function* (g) { yield g.talkTo(g.f.scandal ? 'sybilc' : 'sybil4'); },
        items: {
          flyer: function* (g) { yield* giveFlyer(g); },
          roach: function* (g) { yield* E.bugPlant(g, 'sybil', g.f.scandal ? 'sybilc' : 'sybil'); },
          gun: function* (g) { yield g.say('sybil', 'Сэм, это пистолет. По новому закону мне положено спросить, зарегистрирован ли он. Считай, что спросила.'); },
          glove: function* (g) { yield g.say('sybil', 'Перчатка? Я помню тот тест на ассоциации. Убери.'); },
          serum: function* (g) { yield g.say('sybil', g.f.scandal ? 'Не сейчас, Сэм. Если я выпью, я позвоню Аврааму. Я себя знаю.' : 'На работе не пью. Клиенты потом не верят совпадениям.'); },
          head: function* (g) { yield g.say('sybil', 'Улыбается, молчит и без туловища. Сэм, у меня в картотеке таких половина.'); },
          ribbon: function* (g) { yield g.say('sybil', 'Лента секретаря? Секретарём я уже была. Два дня, в девяносто шестом.'); },
          poster: function* (g) { yield g.say('sybil', '«Отдай всё, что есть». С таким объявлением пару не найдёшь. Хотя некоторые находят.'); },
          max: function* (g) { yield g.say('max', 'Сибил, подбери мне кого-нибудь опасного!'); yield g.say('sybil', 'Опаснее тебя, Макс, в моей картотеке только налоговая.'); }
        }
      }
    },
    enter: function* (g) {
      if (g.f.sybilGone && !g.seen.sybilGone) {
        g.seen.sybilGone = 1;
        yield g.say('sam', 'Сибил нет. Впервые за четыре профессии в конторе тихо.');
        yield g.say('max', 'Она получила сто миллионов и сбежала! Я бы тоже сбежал! Я и без миллионов сбегаю!');
      }
    },
    setup(g) {
      const sy = g.actors.sybil;
      if (g.f.sybilGone) { g.place('sybil', 'nowhere', 0, 0); return; }
      g.place('sybil', 'sybil', 206, 152, 's');
      sy.visible = true; sy.act = ''; sy.keepAct = false; sy.scripted = false;
      sy.v = g.f.scandal ? '' : 'heart';
    },
    onLoad(g) { ROOMS.sybil.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
