(function (S) {
  'use strict';
  const E = S.EP106;
  const { ROOMS, TALK } = E;
  const A = S.art106;

  function* fire(g) {
    g.vt.fireT = g.time + 1.8;
    g.sfx('missile');
    g.fx.shake = 0.6;
    yield 1.8;
    g.vt.fireT = 0;
    if (g.f.caseUnder && !g.f.caseBroken) {
      g.f.caseBroken = true;
      g.sfx('glass');
      yield g.say('sam', 'Три тысячи градусов. Несокрушимая витрина пошла трещинами и осыпалась. Талисман лежит в осколках.');
      return true;
    }
    return false;
  }

  function* openLander(g) {
    const max = g.actors.max;
    if (g.f.landerOpen) { yield g.say('sam', 'Модуль уже открыт. Плечики свою службу закончили.'); return; }
    yield g.say('sam', 'Замок из тех, что уважают проволоку. Так мы вскрыли не одну дверь.');
    yield g.anim('sam', 'reach', 0.6);
    g.sfx('click');
    g.f.landerOpen = true;
    g.drop('hanger');
    yield g.say('sam', 'Открыто. Плечики погнулись окончательно. Свою службу они закончили на Луне.');
    max.scripted = true;
    yield g.walkTo('max', 232, 150, { free: true });
    max.visible = false;
    yield g.say('max', 'Кресло! Кнопка «ПУСК»! И ключ торчит! Сэм, я поведу!', { x: 230, y: 96 });
    yield g.say('sam', 'Макс, ничего не...');
    const broke = yield* fire(g);
    max.visible = true;
    yield g.walkTo('max', 262, 158, { free: true });
    max.scripted = false;
    yield g.say('max', 'Я слетал на полметра вверх и обратно! Я астронавт! Требую парад!');
    g.f.keyGot = true;
    g.give('key');
    yield g.say('sam', broke ? 'Ключ зажигания побудет у меня. Двигатель своё дело сделал.' : 'Ключ зажигания побудет у меня. Иначе следующий парад пройдёт на Марсе.');
  }

  function* useKey(g) {
    if (g.f.caseBroken) { yield g.say('sam', 'Жечь больше нечего. Витрина уже в осколках, а топливо казённое.'); return; }
    yield g.say('sam', 'Ключ, кнопка «ПУСК», и да простит нас музей.');
    const broke = yield* fire(g);
    if (!broke) yield g.say('sam', 'Двигатель отработал вхолостую. Выжженный круг под соплом стал чуть круглее.');
  }

  function* placeCase(g) {
    yield g.anim('sam', 'reach', 0.5);
    g.drop('case');
    g.f.caseUnder = true;
    g.sfx('drop');
    yield g.say('sam', 'На ободе сопла обещают три тысячи градусов. На витрине обещают выдержать всё. Кто-то из них врёт.');
    if (g.f.keyGot) yield g.say('max', 'Жги, Сэм! Я хочу посмотреть, как плачет несокрушимое!');
    else yield g.say('max', 'А теперь поехали! Сэм, эта штука вообще заводится? Я постучал в дверь, там не открывают!');
  }

  function* takeSpoon(g) {
    yield g.anim('sam', 'reach', 0.5);
    g.f.spoonGot = true;
    g.give('spoon');
    yield g.say('sam', 'Талисман гнутия ложек. Целый и тёплый. Гарантию на витрину Гарри мне теперь не вернёт.');
    yield g.say('max', 'Он гнёт ложки, Сэм! Суп в этом доме больше не в безопасности!');
  }

  function* spectrum(g) {
    g.anim('superball', 'point', 1.6);
    yield g.say('superball', 'Вдохните. Выдохните. Подумайте о хорошем.');
    yield g.say('sam', 'Думаю о пончике.');
    g.sfx('scan');
    yield 0.8;
    yield g.say('superball', 'Анализ завершён. Выдаю индикатор.');
    g.f.uniGot = true;
    g.give('uni');
    yield g.say('superball', 'Единорог Рогатик. Рог показывает уровень владельца. Ваш жёлтый. Турист.');
    yield g.say('max', 'А мой?! Мне красный! Я президент!');
    yield g.say('superball', 'Ваш спектр прибор не разобрал, сэр. Написал «ошибка» и задымился.');
  }

  function* showUni(g) {
    if (!g.f.uniRed) {
      g.anim('superball', 'block', 1.2);
      yield g.say('superball', 'Жёлтый. Ответ отрицательный. Вход с красного.');
    } else if (!g.f.blisterOpen) {
      yield g.say('superball', 'Красный. Высший уровень.');
      yield g.say('superball', 'Рог тёплый и пахнет палёным плюшем.');
      yield g.say('sam', 'Просветление бывает бурным.');
      g.anim('superball', 'salute', 1.6);
      yield g.say('superball', 'Принято. Проходите. Оружие, талисманы и кроликов при входе не сдавать. Сдавать некому.');
      g.f.blisterOpen = true;
      yield g.walkTo('superball', 540, 152);
      g.face('superball', 'e');
    } else yield g.say('superball', 'Уровень подтверждён. Проходите, сэр.');
    yield* E.uniShown(g, 'superball');
  }

  TALK.superball = {
    start: function* (g) {
      if (g.seen.sbHello) return;
      g.seen.sbHello = 1;
      yield g.say('superball', 'Стоять. «Пузырь Покоя», контроль уровня. Назовите цвет.');
    },
    options: [
      { id: 'in', icon: 'door6', text: 'Нам надо внутрь, агент.', when: g => !g.f.blisterOpen, run: function* (g) {
        g.anim('superball', 'block', 1.2);
        yield g.say('superball', 'Ответ отрицательный. Вход с красного уровня. Ваш уровень не установлен.');
      } },
      { id: 'level', icon: 'level6', text: 'Как узнают уровень?', when: g => !g.f.uniGot, run: function* (g) {
        yield g.say('superball', 'Спектральный анализ. Процедура бесплатная, безболезненная, обязательная.');
      } },
      { id: 'test', icon: 'uniyel6', text: 'Проводите свой анализ.', when: g => !g.f.uniGot, run: function* (g) { yield* spectrum(g); } },
      { id: 'red', icon: 'unired6', text: 'Как поднять уровень до красного?', when: g => g.f.uniGot && !g.f.uniRed, run: function* (g) {
        yield g.say('superball', 'Семь лет дыхательной практики. Либо тепло. Рог отзывается на тепло просветлённого сердца.');
        yield g.say('sam', 'На тепло.');
        yield g.say('superball', 'Я этого не говорил, сэр.');
      } },
      { id: 'you', icon: 'f:superball6', text: 'Суперболл, что ты тут делаешь?', run: function* (g) {
        yield g.say('superball', 'Отпуск за свой счёт, сэр. Первый за службу.');
        yield g.say('superball', 'Господин Блисс предложил мне дверь. Лучшую в Солнечной системе. Я не смог отказать.');
        yield g.say('max', E.husk(g) ? 'Ты хорошо стоишь, агент. Стой.' : 'Ты мой секретарь! Я тебя не отпускал!');
        if (!E.husk(g)) yield g.say('superball', 'Заявление лежит у вас на столе, сэр. Под указом о запрете понедельников.');
      } },
      { id: 'beam', icon: 'beam6', text: 'Ты знал, что он сделает с Землёй?', when: g => !!g.f.beam, run: function* (g) {
        yield g.say('superball', 'Мне сообщили: плановое улучшение настроения. Подробности выше моего уровня, сэр.');
        yield g.say('sam', 'Он превратил в себя шесть миллиардов человек.');
        yield g.say('superball', 'Принято. Вношу в журнал.');
      } },
      { id: 'bye', icon: 'bye', text: 'Вольно, агент.', end: true, run: function* (g) { g.anim('superball', 'salute', 1.2); yield g.say('superball', 'Служу.'); } }
    ]
  };

  function* dropSat(g) {
    const blue = g.actors.maxblue;
    const max = g.actors.max;
    if (g.f.satDown) { yield g.say('sam', 'Спутник у Боско был один. Он уже лежит.'); return; }
    max.scripted = true;
    yield g.say('sam', 'Боско велел отойти на шаг. Хью Блисс советовал на два.');
    g.sfx('beep');
    yield 0.7;
    g.sfx('missile');
    yield 0.9;
    g.sfx('explosion');
    g.fx.flash = 0.8;
    g.fx.shake = 1;
    g.f.satDown = true;
    blue.act = 'flipped'; blue.keepAct = true;
    yield 0.8;
    max.scripted = false;
    yield g.say('sam', 'Спутник «Боско-Тех» упал в трёх шагах. Луна дрогнула. Синего Макса подбросило и перевернуло.');
    yield g.say('maxblue', 'Ой. Теперь небо. Тоже скучное.');
    yield g.say('max', 'Мой хвост, Сэм. Вон он, торчит. Я по нему скучал, только не знал об этом.');
  }

  function* takeTail(g) {
    yield g.anim('sam', 'reach', 0.5);
    g.place('maxblue', 'nowhere', 0, 0);
    g.actors.maxblue.act = ''; g.actors.maxblue.keepAct = false;
    yield g.say('sam', 'Синий Макс вздыхает, выцветает и втягивается в хвост целиком.');
    yield* E.partBack(g, 'blue');
  }

  const CASE_SPOT = { walk: [252, 154], face: 'w' };

  ROOMS.moon = {
    id: 'moon', name: 'Луна', w: 640, music: 'moon6',
    scale: [148, 0.86, 178, 0.98],
    paint: b => S.BG.moon6(b),
    walk: [[8, 148, 632, 148, 632, 178, 8, 178]],
    layers: [
      { id: 'earth', x: 74, y: 6, key: g => (E.blissed(g) ? 'b' + Math.floor(g.time * 4) % 8 : g.f.boiled ? 'm' : '') },
      { id: 'flag', x: 282, y: 110, base: 151 },
      { id: 'lander', x: 190, y: 56, base: 149, key: g => (g.f.landerOpen ? 'o' : 'c') + (g.vt.fireT && g.time < g.vt.fireT ? 'f' + Math.floor(g.time * 10) % 4 : '') },
      { id: 'caseUnder', x: 218, y: 130, base: 150, when: g => g.f.caseUnder, key: g => (g.f.caseBroken ? 'b' : '') },
      { id: 'spoontal', x: 223, y: 137, base: 151, when: g => g.f.caseBroken && !g.f.spoonGot, key: g => Math.floor(g.time * 3) % 2 },
      { id: 'wreck', x: 470, y: 132, base: 165, when: g => g.f.satDown },
      { id: 'desoto', x: 14, y: 154, base: 200 }
    ],
    drawBack(f, g, cx) {
      if (E.blissed(g)) A.beam(f, 444 - cx, 9, 116 - cx, 42, g.time, 3);
    },
    hot: [
      { id: 'desoto', name: 'Де Сото', rect: [18, 158, 128, 38], walk: [110, 160], face: 's',
        look: 'Наш Де Сото на Луне. Шины целы, радио ловит только Хью. На счётчике триста восемьдесят тысяч лишних километров.',
        use: function* (g) { yield* E.drive(g); },
        items: { key: 'Ключ от лунного модуля к Де Сото не подходит. Пробовать я не стану: вдруг подойдёт.' } },
      { id: 'earth', name: 'Земля', rect: [88, 20, 46, 46],
        look: g => E.blissed(g) ? 'Земля в радужном кольце. Луч с вышки бьёт ей прямо в бок. Там сейчас шесть миллиардов Хью Блиссов.' : 'Земля. Отсюда не видно ни офиса, ни долгов Джимми. Видно, что она круглая и что над ней висит радуга.',
        items: { gun: 'Стрелять в Землю? Я там живу.', remote: 'Ронять спутник на Землю? Он и так над ней висит.' } },
      { id: 'footprint', name: 'След', rect: [164, 168, 18, 12], walk: [190, 172], face: 'w',
        look: 'След ботинка. Маленький шаг для человека. Рядом свежие следы Макса. Он тут прыгал.' },
      { id: 'lander', name: 'Лунный модуль', rect: [202, 60, 56, 72], walk: [252, 154], face: 'w',
        look: g => g.f.landerOpen ? 'Лунный модуль. Дверь открыта. Внутри кресло и приборная доска с одной кнопкой «ПУСК».' : 'Лунный модуль. Стоит тут с шестьдесят девятого года. Дверь заперта, на двери табличка: «Собственность НАСА. Руками не трогать».',
        use: g => g.f.landerOpen ? (g.f.keyGot ? 'Модуль открыт. Кнопка «ПУСК» без ключа только щёлкает.' : 'Модуль открыт.') : 'Заперто. Замку тридцать лет, и за всё это время его ни разу не пробовали вскрыть.',
        items: {
          hanger: function* (g) { yield* openLander(g); },
          key: function* (g) { yield* useKey(g); },
          case: 'Класть витрину в кабину незачем. Места там на одного астронавта и его гордость.',
          gun: 'Стрелять в лунный модуль? Он музейный.',
          saw: 'Пилить лунный модуль я не стану. Пока не стану.',
          max: function* (g) { yield g.say('max', E.husk(g) ? 'Он стоит и никуда не летит. Мудро.' : 'Дай порулить! Я рулил страной, справлюсь и с табуреткой на ножках!'); }
        } },
      Object.assign({ id: 'nozzle', name: 'Сопло двигателя', rect: [220, 132, 20, 14], when: g => !g.f.caseUnder,
        look: 'Сопло ракетного двигателя. Под ним выжженный круг. На ободе выбито: «Три тысячи градусов. Не стоять».',
        use: 'Совать лапу под сопло я не стану. Даже под холодное.',
        items: {
          case: function* (g) { yield* placeCase(g); },
          uni: 'Рогатик уже грелся. Три тысячи градусов превратят его в воспоминание.',
          key: function* (g) { yield g.say('sam', 'Замок зажигания в кабине. Сопло ключей не берёт.'); }
        } }, CASE_SPOT),
      Object.assign({ id: 'caseunder', name: 'Витрина под соплом', rect: [222, 132, 16, 18], when: g => g.f.caseUnder && !g.f.caseBroken,
        look: 'Несокрушимая витрина лежит под соплом и делает вид, что ей не страшно.',
        use: 'Пусть лежит. Когда двигатель работает, это самое горячее место на Луне.',
        items: { key: function* (g) { yield* useKey(g); }, hanger: function* (g) { yield* openLander(g); } } }, CASE_SPOT),
      Object.assign({ id: 'spoontal', name: 'Талисман гнутия ложек', rect: [222, 132, 16, 18], when: g => g.f.caseBroken && !g.f.spoonGot,
        look: 'Осколки несокрушимой витрины. Среди них лежит талисман гнутия ложек. Целый.',
        use: function* (g) { yield* takeSpoon(g); } }, CASE_SPOT),
      Object.assign({ id: 'shards', name: 'Осколки витрины', rect: [222, 136, 16, 14], when: g => g.f.spoonGot,
        look: 'Осколки несокрушимой витрины. Надпись «Выдерживает всё» ещё читается. По частям.' }, CASE_SPOT),
      { id: 'flag', name: 'Флаг', rect: [282, 110, 26, 42], walk: [304, 154], face: 'w',
        look: 'Флаг. Стоит с шестьдесят девятого. Ветра нет, а он развевается. Луна старается для гостей.',
        use: 'Оставлю. Это чужая высадка.',
        items: { max: function* (g) { yield g.say('max', E.husk(g) ? 'Флаг. На нём звёзды. Мы сейчас среди них, Сэм.' : 'Я президент того, что на нём нарисовано! Значит, Луна тоже моя!'); } } },
      { id: 'shopsign', name: 'Вывеска', rect: [310, 68, 126, 12],
        look: '«Центр для посетителей». Ниже мелко: «Сувениры. Книги. Спектральный анализ у входа в Пузырь».' },
      { id: 'shopwin', name: 'Витрина центра', rect: [400, 92, 30, 24], walk: [414, 152], face: 'n',
        look: 'В витрине три шара со снегом. Снег в них лунный, серый.' },
      { id: 'shopdoor', name: 'Центр для посетителей', rect: [352, 86, 34, 62], walk: [369, 152], face: 'n',
        look: 'Дверь сувенирной лавки. На стекле радуга и приписка: «Рамка на выходе видит всё».',
        exit: function* (g) {
          if (g.has('case')) { yield g.say('sam', 'С витриной в лавку я не вернусь. Гарри узнает её в лицо.'); return; }
          g.sfx('door');
          yield* g.goRoom('shop', { x: 60, y: 172, dir: 'e' });
        } },
      { id: 'tower', name: 'Вышка', rect: [448, 8, 22, 140], walk: [486, 156], face: 'w',
        look: g => E.blissed(g) ? 'Излучатель работает. Луч уходит к Земле и не рассеивается. По дороге он красит вакуум.' : 'Вышка с тарелкой. Тарелка смотрит на Землю. На табличке: «Излучатель блаженства. Мощность: вся».',
        use: 'Лезть на вышку? Мы и так дышим тут из вежливости.',
        items: {
          gun: 'Пуля до тарелки долетит. Тарелке будет всё равно: вышка из того же кристалла, что и логово Хью.',
          saw: 'Пилить вышку пилой для фокусов? Я постарею раньше.',
          remote: 'Уронить спутник на вышку? Он отскочит. Кристалл Хью не берёт даже «Боско-Тех».'
        } },
      { id: 'blistersign', name: 'Указатель', rect: [482, 108, 80, 13],
        look: '«Пузырь Покоя». Ниже мелко: «Вход по уровню. Уровень показывает единорог».' },
      { id: 'dome', name: 'Купол', poly: [470, 138, 480, 96, 510, 62, 550, 46, 600, 42, 640, 50, 640, 138],
        look: 'Купол. За стеклом радуга, рельсы и позолоченный Хью в натуральную величину. Снаружи вакуум. Нам он почему-то не мешает.' },
      { id: 'blisterdoor', name: '«Пузырь Покоя»', rect: [572, 86, 34, 62], walk: [590, 152], face: 'n',
        look: 'Шлюз «Пузыря Покоя». Над дверью радуга из неона. Рядом стоит агент секретной службы и не моргает.',
        exit: function* (g) {
          if (!g.f.blisterOpen) {
            g.anim('superball', 'block', 1.4);
            yield g.say('superball', g.f.uniGot ? 'Ответ отрицательный. Вход с красного уровня. У вас жёлтый.' : 'Ответ отрицательный. Вход по уровню. Ваш не установлен.');
            return;
          }
          g.sfx('gate');
          yield* g.goRoom('blister', { x: 56, y: 172, dir: 'e' });
        } },
      { id: 'wreck', name: 'Спутник «Боско-Тех»', rect: [476, 136, 48, 28], when: g => g.f.satDown, walk: [500, 172], face: 'n',
        look: 'Спутник Боско. Упал ровно туда, где стоял пульт. Дымит и до сих пор что-то сбивает в эфире.',
        use: 'Горячий. И на нём гарантийная пломба.' }
    ],
    actors: {
      superball: {
        name: 'Агент Суперболл',
        look: 'Агент Суперболл. Костюм, очки, радужная лента через плечо. Охранял прошлого президента, потом был секретарём у Макса. Теперь сторожит дверь Хью Блисса.',
        talk: function* (g) { yield g.talkTo('superball'); },
        use: 'Сдвинуть Суперболла нельзя. Он стоит, как пункт устава.',
        items: {
          uni: function* (g) { yield* showUni(g); },
          gun: function* (g) { yield g.say('superball', 'Оружие замечено. Угрозы не вижу. На Луне всё падает медленно, сэр. Пули тоже.'); },
          glove: 'Гипноза на нём нет. Он стоит у двери по собственному желанию. Это хуже.',
          hanger: function* (g) { yield g.say('superball', 'Проволочные плечики. К проносу разрешены. Вскрывать ими дверь Пузыря не рекомендую.'); },
          max: function* (g) {
            if (E.husk(g)) { yield g.say('max', 'Вольно, агент. Всем вольно.'); yield g.say('superball', 'Сэр? Вы здоровы, сэр?'); return; }
            yield g.say('max', 'Приказываю пропустить! Я твой президент!');
            yield g.say('superball', 'На Луне вы турист, сэр. Юрисдикция кончилась в стратосфере.');
          }
        }
      },
      maxblue: {
        name: 'Синий Макс', walk: [426, 172], face: 'e', pad: 14,
        look: g => g.f.satDown ? 'Синего Макса перевернуло. Он лежит на спине, и сверху торчит хвост. Белый, пушистый, настоящий.' : 'Хвост Макса с ушами. Синий, тяжёлый и грустный. Лежит лицом в пыль и ничего не хочет.',
        talk: function* (g) {
          yield g.say('maxblue', g.f.satDown ? 'Бери что хочешь. Мне лень возражать.' : 'Уйди. Или останься. Всё равно.');
          if (!g.f.satDown) yield g.say('sam', 'Лень Макса лежит отдельно от Макса. Ей даже отвечать лень.');
        },
        use: function* (g) {
          if (g.f.satDown) { yield* takeTail(g); return; }
          yield g.say('sam', 'Он весит как вся лень мира. Лапами такое не ворочают.');
        },
        items: {
          remote: function* (g) { yield* dropSat(g); },
          glove: 'От перчатки он только вздыхает.',
          gun: 'Стрелять в лень? Она не заметит.',
          spoon: 'Он и так согнут. В дугу.',
          gastro: 'Желудка у хвоста нет. Талисман молчит.',
          hat: 'Совать его в шляпу? Он туда не полезет. Лезть ему лень.',
          uni: 'Синий Макс открывает на единорога один глаз и закрывает.',
          max: function* (g) { yield g.say('max', 'Он лежит за меня, Сэм. Я за него не устал.'); }
        }
      }
    },
    enter: function* (g, from) {
      if (!g.f.moonSeen) {
        g.f.moonSeen = true;
        yield g.say('sam', 'Луна. Воздуха нет, тяготение в шесть раз меньше. Дышим мы, судя по всему, из упрямства.');
        yield g.say('max', 'Объявляю Луну штатом! Столица тут! Нет, вон там, где кратер!');
        yield g.say('sam', 'Лунный модуль, сувенирная лавка и купол с радугой. Хью обустроился основательно.');
        return;
      }
      if (g.f.maxSplit && !g.f.blueDone && !g.seen.blueSeen) {
        g.seen.blueSeen = 1;
        yield g.say('sam', 'У вышки лежит что-то синее. С ушами.');
        yield g.say('max', 'Это я, Сэм. Та часть, которой всегда хотелось прилечь.');
      }
    },
    setup(g) {
      const blue = g.actors.maxblue;
      g.place('superball', 'moon', g.f.blisterOpen ? 540 : 556, 152, g.f.blisterOpen ? 'e' : 'w');
      if (g.f.maxSplit && !g.f.blueDone) {
        g.place('maxblue', 'moon', 452, 166, 'e');
        blue.v = 'blue';
        blue.act = g.f.satDown ? 'flipped' : '';
        blue.keepAct = !!g.f.satDown;
      } else if (blue.room === 'moon') { g.place('maxblue', 'nowhere', 0, 0); blue.act = ''; blue.keepAct = false; }
      g.vt.fireT = 0;
      g.actors.max.visible = true;
    }
  };

  function* alarm(g) {
    g.vt.alarmT = g.time + 3;
    g.sfx('alarm');
    g.anim('harry', 'panic', 1.6);
    yield g.say('harry', 'Мальчики! Рамка! Экспонат на место!');
    yield g.walkTo('sam', 171, 156);
    g.face('sam', 'n');
    g.drop('case');
    g.f.caseTaken = false;
    g.vt.alarmT = 0;
    yield g.say('sam', 'Рамка пищит на весь кратер. Витрина возвращается на подставку, я возвращаюсь ни с чем.');
    if (!g.seen.alarmHint) {
      g.seen.alarmHint = 1;
      yield g.say('max', 'Она на тебя пищит, Сэм! А меня рамки любят. Для них я слишком важная персона!');
    }
  }

  E.caseMax = function* (g) {
    if (g.roomId !== 'shop') {
      yield g.say('max', 'Я её уже глотал! Второй раз невкусно. У неё углы!');
      return;
    }
    yield g.say('sam', 'Макс, подержи экспонат. Внутри.');
    yield g.say('max', 'Именем президента экспонат конфискован!');
    g.sfx('eat');
    g.drop('case');
    g.f.caseInMax = true;
    yield g.say('max', 'Проглотил! Она квадратная, Сэм. Я чувствую все четыре угла.');
    g.anim('harry', 'sigh', 1.4);
    yield g.say('harry', 'Мальчики, а где... Нет, показалось. Я сегодня мало дышал.');
  };

  E.gastroMax = function* (g) {
    if (E.husk(g)) { yield g.say('max', 'Желудка во мне нет, Сэм. Он ушёл вместе с зелёным мной.'); return; }
    if (!g.f.caseInMax) { yield g.say('max', 'Убери эту штуку! Завтрак мой, я его честно отнял!'); return; }
    if (g.roomId === 'shop') { yield g.say('max', 'Только не тут, Сэм! Кротман смотрит, и рамка рядом!'); return; }
    yield g.say('sam', 'Макс, открой рот и думай о хорошем.');
    g.sfx('burp');
    g.fx.shake = 0.4;
    yield g.say('max', 'Уй! Углами вперёд!');
    g.f.caseInMax = false;
    g.f.caseBack = true;
    g.give('case');
    yield g.say('sam', 'Витрина вернулась. Ни царапины. На дне мелко написано: «Выдерживает три тысячи градусов».');
    yield g.say('max', 'Потом верни! Я к ней привык!');
  };

  TALK.harry = {
    start: function* (g) {
      if (g.seen.harryHello) return;
      g.seen.harryHello = 1;
      yield g.say('harry', 'Мальчики! Какая встреча. Сувениры, книги, просветление. Руками ничего не трогать.');
    },
    options: [
      { id: 'you', icon: 'f:harry6', text: 'Гарри, как ты сюда попал?', run: function* (g) {
        yield g.say('harry', 'После истории с казино я искал себя, мальчики. Нашёл на Луне. Хью сказал, что у меня талант.');
        g.anim('harry', 'sigh', 1.6);
        yield g.say('harry', 'К торговле. Я надеялся, он скажет «к просветлению».');
      } },
      { id: 'level', icon: 'level6', text: 'Какой у тебя уровень?', run: function* (g) {
        yield g.say('harry', 'Оранжевый. С красными проблесками. Хью обещал красный, как только я продам все шары со снегом.');
        yield g.say('harry', 'Их привозят быстрее, чем я продаю.');
      } },
      { id: 'case', icon: 'case6', text: 'Что за талисман у тебя под стеклом?', run: function* (g) {
        g.anim('harry', 'point', 1.4);
        yield g.say('harry', 'Гнутие ложек, мальчики. Один из талисманов «Эметики». Хью раздал их ближайшим ученикам.');
        yield g.say('harry', 'Гастрокинез у каменной головы, свинцовое зрение у компьютерщиков, гнутие ложек у меня. Четвёртый он носит сам.');
        yield g.say('sam', 'И свой ты держишь под стеклом.');
        yield g.say('harry', 'Это единственное, что мне тут доверили. Витрина несокрушимая. Её берёт только жар от трёх тысяч градусов.');
        g.f.knowCase = true;
      } },
      { id: 'sell', icon: 'cash', text: 'Продай талисман.', when: g => g.f.knowCase && !g.f.caseInMax && !g.f.caseBack && !g.f.spoonGot, run: function* (g) {
        yield g.say('harry', 'Экспонат не продаётся и за рамку не выносится. Рамка пищит на всех, кроме дипломатов и президентов.');
        yield g.say('max', 'Сэм, он назвал меня дважды!');
      } },
      { id: 'hugh', icon: 'f:hugh6', text: 'Где сам Хью?', run: function* (g) {
        yield g.say('harry', 'Наверху, в святилище. Радужный лифт из Пузыря, потом дверь. За дверь меня ни разу не пустили.');
        yield g.say('harry', 'Говорят, её открывают талисманы. У меня всего один, и тот под стеклом.');
      } },
      { id: 'plan', icon: 'poster6', text: 'Что за план на плакате?', when: g => !!g.seen['shop.poster.look'], run: function* (g) {
        yield g.say('harry', 'Сувенирный, мальчики. Хью говорит, хороший план надо продавать заранее. Тогда потом никто не удивится.');
      } },
      { id: 'beam', icon: 'beam6', text: 'Гарри, твой Хью загипнотизировал Землю.', when: g => !!g.f.beam, run: function* (g) {
        g.anim('harry', 'sigh', 1.6);
        yield g.say('harry', 'Я видел в окно. Красиво. Он обещал начать с меня, мальчики. Даже тут я в очереди последний.');
      } },
      { id: 'bye', icon: 'bye', text: 'Торгуй, Гарри.', end: true }
    ]
  };

  ROOMS.shop = {
    id: 'shop', name: 'Центр для посетителей', w: 320, music: 'shop6',
    paint: b => S.BG.shop6(b),
    walk: [[8, 152, 210, 152, 210, 198, 8, 198]],
    layers: [
      { id: 'lamp', x: 20, y: 24, key: g => (g.vt.alarmT && g.time < g.vt.alarmT ? Math.floor(g.time * 8) % 2 : 0) },
      { id: 'case', x: 159, y: 100, when: g => !g.f.caseTaken },
      { id: 'counter', x: 216, y: 120, base: 186 }
    ],
    hot: [
      { id: 'exit', name: 'Выход на Луну', rect: [4, 40, 40, 108], walk: [36, 170], face: 'w',
        look: 'Дверь наружу. За стеклом звёзды и пыль.',
        exit: function* (g) {
          if (g.has('case')) { yield* alarm(g); return; }
          if (g.f.caseInMax && !g.seen.frameOk) {
            g.seen.frameOk = 1;
            yield g.say('sam', 'Рамка молчит. Президентов не досматривают.');
          }
          g.sfx('door');
          yield* g.goRoom('moon', { x: 369, y: 154, dir: 's' });
        } },
      { id: 'frame', name: 'Рамка', rect: [44, 26, 10, 124], walk: [62, 160], face: 'w',
        look: 'Рамка на выходе. Пищит на всё, что не оплачено. На табличке: «Дипломатов, президентов и кроликов не досматриваем».',
        use: 'Молчит. При мне сейчас ничего чужого.' },
      { id: 'window', name: 'Окно', rect: [62, 22, 86, 62],
        look: g => E.blissed(g) ? 'В окне Земля в радужном кольце. Гарри смотрит на неё и вздыхает.' : 'В окне лунная равнина и Земля над ней. Лучший вид в Солнечной системе, и весь достался сувенирной лавке.' },
      { id: 'unis', name: 'Единороги', rect: [58, 90, 50, 30], walk: [84, 156], face: 'n',
        look: 'Плюшевые единороги Рогатики. Ценник: «Не продаются. Выдаёт агент Суперболл после анализа».',
        use: g => g.f.uniGot ? 'У меня есть свой. Эти смотрят на него с завистью.' : 'Этих не отдают. На ценнике так и написано, крупнее цены.' },
      { id: 'globes', name: 'Шары со снегом', rect: [112, 88, 38, 14], walk: [130, 156], face: 'n',
        look: 'Шары со снегом. Внутри маленький купол. Встряхнёшь, и на купол оседает серая пыль.',
        use: 'Гарри и так не может их распродать. Не буду портить ему статистику покупкой.' },
      { id: 'poster', name: 'Плакат', rect: [160, 20, 52, 62], walk: [186, 156], face: 'n',
        look: ['Плакат «План». Луна, луч, Земля. Цена пять долларов.', 'Мелким шрифтом внизу: «Этап первый: книга. Этап второй: Пузырь. Этап третий: все». Продаётся в открытую. Мелкий шрифт никто не читает.'],
        use: 'Покупать план злодея за пять долларов? Я его уже запомнил.' },
      { id: 'casestand', name: g => (g.f.caseTaken ? 'Пустая подставка' : 'Витрина с талисманом'), rect: [160, 100, 22, 50], walk: [171, 156], face: 'n',
        look: g => g.f.caseTaken ? 'Подставка без витрины. Гарри делает вид, что так и было.' : 'Талисман гнутия ложек в несокрушимой витрине. Табличка: «Экспонат. Гнёт ложки силой мысли. Витрина выдерживает всё».',
        use: function* (g) {
          if (g.f.caseTaken) { yield g.say('sam', 'Подставка пустая.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.f.caseTaken = true;
          g.give('case');
          yield g.say('sam', 'Открыть витрину нечем. Значит, она идёт со мной целиком.');
          g.anim('harry', 'point', 1.4);
          yield g.say('harry', 'Мальчики! Экспонат руками не трогать! Впрочем, трогайте. Дальше рамки он всё равно не уйдёт.');
        },
        items: {
          gun: 'Стрелять в несокрушимую витрину? Пуля отскочит в Гарри, а он нам ещё нужен.',
          hanger: 'Замка на витрине нет. Она литая.',
          case: function* (g) {
            yield g.anim('sam', 'reach', 0.4);
            g.drop('case');
            g.f.caseTaken = false;
            yield g.say('sam', 'Витрина на месте. Гарри выдыхает.');
          }
        } },
      { id: 'goggles', name: 'Пустой колпак', rect: [188, 100, 22, 50], walk: [199, 156], face: 'n',
        look: 'Табличка: «Гипноочки, опытный образец. Экспонат утрачен». Я знаю, кто его носил. Брэди Калчер, первое дело.',
        use: 'Под колпаком пусто. Пыль лежит кольцом, по форме очков.' },
      { id: 'books', name: '«Эметика»', rect: [224, 26, 92, 72], walk: [204, 178], face: 'e',
        look: ['«Эметика». Сорок одинаковых корешков. Книга учит выворачиваться наизнанку в семь приёмов.', 'На случайной странице: «Серое есть грязь души. Грязь смывают». Дальше три страницы про дыхание.'],
        use: 'Гарри не даёт листать. Говорит, страницы чувствуют жёлтый уровень.' },
      { id: 'counter', name: 'Прилавок', rect: [216, 132, 104, 60], walk: [204, 178], face: 'e',
        look: 'Прилавок. Касса, стопка «Эметики» и радужная полоса по борту.',
        use: 'За прилавок Гарри не пускает. Там его единственная территория.' }
    ],
    actors: {
      harry: {
        name: 'Гарри Кротман', walk: [204, 178], face: 'e',
        look: 'Гарри Кротман. В третьем деле он был кротом Комиссара, потом доном игрушечной мафии. Теперь на нём жилет, бабочка и бейджик «Почти красный».',
        talk: function* (g) { yield g.talkTo('harry'); },
        use: 'Хватать Гарри незачем. Он и сам никуда не денется.',
        items: {
          uni: function* (g) {
            if (g.f.uniRed) { g.anim('harry', 'panic', 1.4); yield g.say('harry', 'Красный?! Мальчики, я тут дышу с самого открытия! Как?!'); yield g.say('sam', 'Тепло просветлённого сердца.'); }
            else yield g.say('harry', 'Жёлтый. Не расстраивайтесь, мальчики. Я на жёлтом сидел дольше всех.');
            yield* E.uniShown(g, 'harry');
          },
          case: function* (g) { yield g.say('harry', 'Поставьте на место, когда наиграетесь. До рамки он ваш.'); },
          gun: function* (g) { g.anim('harry', 'panic', 1.2); yield g.say('harry', 'Мальчики! Оружие в лавке бывает только сувенирное! Уберите, у меня жёлтеет уровень!'); },
          glove: 'Перчатка лечит гипноз. У Гарри надежда, её перчаткой не выбить.',
          cad: function* (g) { yield g.say('harry', 'Канадские не берём. Хью говорит, у них неопределённый цвет.'); },
          spoon: function* (g) { g.anim('harry', 'panic', 1.4); yield g.say('harry', 'Это же мой экспонат! Мальчики, как вы... Нет. Не говорите. Мне меньше отвечать.'); },
          gastro: function* (g) { yield g.say('harry', 'Уберите! Я завтракал сырниками, они мне дороги как память!'); },
          max: function* (g) {
            if (E.husk(g)) { yield g.say('max', 'Здравствуй, Гарри. Тебе идёт жилет.'); yield g.say('harry', 'Мальчики, что с кроликом? Он вежливый. Мне страшно.'); return; }
            yield g.say('max', 'Гарри! Помнишь, как мы сорвали тебе казино? Хорошее было время!');
            yield g.say('harry', 'Я стараюсь не помнить, кролик. Я на оранжевом уровне, мне нельзя волноваться.');
          }
        }
      }
    },
    maxHint: g => (g.has('case') ? 'Рамка на выходе запищит. Отдай витрину мне! Президентов она не досматривает!' : null),
    setup(g) {
      g.vt.alarmT = 0;
      g.actors.max.visible = true;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
