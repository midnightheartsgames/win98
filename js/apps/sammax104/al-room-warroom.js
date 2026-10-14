(function (S) {
  'use strict';
  const { C, COLORS, font } = S;
  const E = S.EP104;
  const { ROOMS } = E;

  const TABLE = [64, 138, 218, 138, 218, 162, 64, 162];
  const CONSOLE = [246, 160, 314, 160, 314, 198, 246, 198];
  const computer = (g, t) => g.say(null, t, { key: 'computer', color: COLORS.computer, x: 160, y: 196 });

  function* liftOff(g, line) {
    const n = g.count('launch');
    g.sfx('thump');
    g.sfx('klaxon');
    yield g.fadeOut(3);
    g.closeup = { kind: 'launch', t0: g.time, n };
    yield g.fadeIn(3);
    g.sfx('missile');
    g.fx.shake = 0.6;
    yield computer(g, line);
    if (n === 1) yield g.say('sam', 'Монумент Вашингтона взлетел. Все эти годы посреди аллеи стояла ракета в побелке.');
    else if (n === 2) yield g.say('sam', 'На месте монумента уже стоит новый. У них там, видимо, грядка.');
    g.f.knowSilo = true;
    return n;
  }

  function* cutTo(g, target) {
    yield g.fadeOut(4);
    g.closeup = { kind: 'impact', target, phase: 'fly', t0: g.time };
    yield g.fadeIn(4);
    return g.closeup;
  }

  function* backToRoom(g) {
    yield g.fadeOut(3);
    g.closeup = null;
    yield g.fadeIn(3);
    g.actors.max.scripted = false;
    g.hideUI = false;
  }

  function* shot(g, id) {
    g.hideUI = true;
    g.actors.max.scripted = true;
    yield g.say('max', g.seen.launch ? 'Ещё раз! Кнопка не надоедает!' : 'Моя первая кнопка! Я ждал её всю жизнь!');
    yield* liftOff(g, 'Шахта один. Пуск.');
    const cu = yield* cutTo(g, id);
    yield 1.3;
    cu.phase = 'hit'; cu.t1 = g.time;
    if (id === 'antarctica') {
      g.sfx('thud');
      yield computer(g, 'Цель поражена. Потери: ноль. Пингвины выражают озабоченность.');
      yield g.say('max', 'Я воюю с пингвинами! Впишите это в мой послужной список!');
    } else if (id === 'krypton') {
      yield computer(g, 'Расчётное время подлёта: двадцать шесть миллионов лет.');
      yield g.say('sam', 'Этой планеты давно нет. Ракета летит на место происшествия.');
      yield g.say('max', 'Я подожду! Срок у меня четыре года, а там посмотрим!');
    } else {
      g.sfx('laser');
      g.fx.flash = 0.5;
      yield 0.5;
      g.sfx('explosion');
      yield computer(g, 'Ракета сбита на подлёте. Противоракетная система неизвестного образца.');
      yield g.say('sam', 'Образец мне известен. Он стоит на бочке с капустой.');
      yield g.say('max', 'Боско был прав! Сэм, у меня рушится картина мира!');
      g.f.boscoShot = true;
    }
    yield* backToRoom(g);
  }

  function* finale(g) {
    g.hideUI = true;
    g.actors.max.scripted = true;
    yield g.say('sam', 'Цель: мемориал Линкольна. Маяк на нём. Господин президент, кнопка ваша.');
    yield g.say('max', 'Именем меня! Огонь!');
    g.music('abechase');
    yield* liftOff(g, 'Шахта один. Пуск. Цель: маяк один.');
    const cu = yield* cutTo(g, 'lincoln');
    yield g.say('lincoln', 'НАЦИЯ. СМОТРИ МНЕ В ГЛАЗА.');
    yield g.say('chuckles', 'Эйб. Сзади.');
    yield g.say('lincoln', 'История не оглядывается.');
    cu.phase = 'hit'; cu.t1 = g.time;
    g.sfx('explosion');
    g.fx.flash = 1;
    g.fx.shake = 1.2;
    yield 2.4;
    cu.phase = 'rubble'; cu.t1 = g.time;
    g.f.lincolnDown = true;
    yield 1;
    yield g.say('chuckles', 'План Б закрыт.');
    yield g.say(null, 'Агент Чаклз. Контакт потерян. Ошибка связи. Ошибка.', { key: 'earpiece', color: COLORS.earpiece, x: 160, y: 196 });
    yield g.fadeOut(3);
    g.closeup = null;
    g.music('warroom');
    yield g.fadeIn(3);
    yield g.say('sam', 'Цель поражена. Страна проснулась и не помнит, за кого голосовала.');
    yield g.say('max', 'За меня! Я остаюсь!');
    yield g.say('sam', 'Тогда домой, господин президент. У нас в шкафу ждёт некормленый шулер.');
    g.actors.max.scripted = false;
    yield* E.ending(g);
  }

  E.onFire = function* (g, id) {
    if (id === 'kremlin') {
      yield computer(g, 'Маяк «Кремль» не отвечает. Цель недоступна.');
      yield g.say('max', 'Сломался! Или его там давно нашли и повесили на ёлку!');
      return;
    }
    if (id === 'pocket') {
      yield g.say('sam', 'Маяк лежит у меня в кармане. Прицел показывает мой пиджак изнутри. Стрелять по нему я не буду.');
      return;
    }
    if (id === 'lincoln') { yield* finale(g); return; }
    yield* shot(g, id);
  };

  function* lookOut(g) {
    g.hideUI = true;
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('servo');
    yield g.fadeOut(4);
    g.closeup = { kind: 'periscope', t0: g.time };
    yield g.fadeIn(4);
    yield g.say('sam', 'Перископ смотрит из пруда на лужайке. Лодка в пруду, выходит, наша. Казённая.');
    yield g.say(null, 'Опять эта труба на меня пялится! Я в отпуске!', { key: 'jimmyfar', color: COLORS.jimmy, x: 200, y: 150 });
    yield g.say('max', 'Дай посмотреть! Джимми! С коктейлем! Сэм, почему у крысы есть коктейль, а у президента нет?');
    yield g.fadeOut(4);
    g.closeup = null;
    yield g.fadeIn(4);
    g.hideUI = false;
  }

  const MANUAL = [
    '«Наставление по ракетному делу. Пункт первый: выбрать цель. Пункт второй: нажать „Огонь“».',
    '«Пункт третий: заявить, что так и было задумано».',
    'На полях приписано от руки: «Ракета летит на маяк. Нет маяка, нет цели. Маяки расставляет служба».'
  ];

  function screenText(f, x, lines, col) {
    lines.forEach((t, i) => font.draw(f, t, x + 6, 22 + i * 9, col, 0));
  }

  ROOMS.warroom = {
    id: 'warroom', name: 'Военная комната', w: 320, music: 'warroom',
    paint: b => S.BG.warroom(b),
    walk: [[6, 134, 314, 134, 314, 198, 6, 198]],
    block: [TABLE, CONSOLE],
    layers: [
      { id: 'table', x: 56, y: 126, base: 164 },
      { id: 'console', x: 250, y: 134, base: 200, key: g => Math.floor(g.time * 3) % 2 }
    ],
    drawBack(f, g, cx) {
      const blink = Math.floor(g.time * 2) % 2;
      const P = new S.Pen(f).at(-cx, 0, 1);
      P.part(P.path('M 50 30 L 62 24 L 84 25 L 98 30 L 106 40 L 100 52 L 84 58 L 66 56 L 54 48 Z'), C.teal, { b: 2, sh: 0, hi: 0, ol: C.teal[4] });
      for (const [x, y] of [[70, 34], [70, 42], [62, 38]]) if (blink || g.f.lincolnDown) f.set(x - cx, y, g.f.lincolnDown ? C.neonB : C.neonA);
      screenText(f, 124 - cx, ['ШОССЕ 95', g.f.beaconOn ? 'МАЯК: ЕСТЬ' : 'МАЯК: НЕТ'], C.neonB);
      const k = (g.time * 6) % 50;
      for (let i = 0; i < 50; i += 4) f.set(132 + i - cx, 50, C.teal[3]);
      if (!g.f.lincolnDown) { f.set(Math.round(132 + k) - cx, 49, C.lamp); f.set(Math.round(132 + k) - cx, 48, C.lamp); }
      screenText(f, 206 - cx, ['ПУДИНГ:', 'ЭМБАРГО', blink ? 'ДЕЙСТВУЕТ' : ''], C.yellow[3]);
    },
    hot: [
      { id: 'door', name: 'Дверь в кабинет', rect: [2, 28, 38, 102], walk: [46, 146], face: 'w',
        look: 'Дверь в Овальный кабинет. С этой стороны на ней нет ни ручки, ни скважины. Только кнопка «Мир».',
        exit: function* (g) { g.sfx('gate'); yield* g.goRoom('oval', { x: 424, y: 150, dir: 'w' }); } },
      { id: 'screens', name: 'Экраны', rect: [42, 16, 236, 50], walk: [160, 134], face: 'n',
        look: ['Левый экран: карта страны. Три Дакоты мигают красным, и у каждой свой флажок.', 'Средний экран: зелёная точка ползёт на север по девяносто пятому шоссе. Подпись: «Мемориал, самоходный».', 'Правый экран: «Пудинг. Эмбарго действует». Кто-то вывел это на главный экран обороны.'],
        use: 'Экраны под потолком. Псу без стремянки остаётся на них только смотреть.' },
      { id: 'defcon', name: 'Табло', rect: [124, 70, 72, 13], walk: [160, 134], face: 'n',
        look: '«ДЕФКОН 1». Три Дакоты воюют из-за горы, и стране положена высшая готовность.' },
      { id: 'periscope', name: 'Перископ', rect: [52, 8, 32, 86], walk: [68, 134], face: 'n',
        look: 'Перископ свисает с потолка. Труба уходит наверх, сквозь фундамент. Куда она смотрит, изнутри не понять.',
        use: function* (g) { yield* lookOut(g); } },
      { id: 'table', name: 'Стол с картой', rect: [60, 128, 166, 32], walk: [140, 170], face: 'n',
        look: 'Стол с картой. Дакоты утыканы флажками: красные у Спекса, синие у Пиперса. Золотой флажок Уиззера воткнут в туалет на заправке.',
        use: 'Двигать флажки не буду. Война и так идёт не по плану. Плана у неё нет.' },
      { id: 'manual', name: 'Наставление', rect: [72, 139, 22, 12], walk: [84, 170], face: 'n', over: true,
        look: MANUAL,
        use: 'Брать не стану. Я уже прочёл его целиком. Там три пункта.' },
      { id: 'hotline', name: 'Красный телефон', rect: [194, 132, 16, 14], walk: [204, 170], face: 'n', over: true,
        look: 'Красный телефон без диска. Горячая линия с Кремлём.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.4);
          g.sfx('beep');
          yield E.phone(g, 'Все операторы заняты. Ваша угроза очень важна для нас. Оставайтесь на линии.', C.red[4]);
          yield g.say('sam', 'Эту фразу я сегодня уже говорил сам. Теперь знаю, каково её слушать.');
        } },
      { id: 'console', name: 'Прицельный компьютер', rect: [252, 138, 58, 60], walk: [238, 186], face: 'e',
        look: 'Прицельный компьютер. Экран, список целей и красная кнопка размером с блюдце. Макс не сводит с неё глаз.',
        use: function* (g) { yield g.anim('sam', 'reach', 0.3); g.sfx('beep'); E.panels.target(g); },
        items: {
          beacon: 'Компьютеру маяк в руки давать не надо. Он его и так видит: на экране мой пиджак изнутри.',
          gun: 'Стрелять в прицельный компьютер? Он ответит. У него калибр больше.',
          max: function* (g) { yield g.say('max', 'Кнопка! Дай нажать! Хотя бы понюхать!'); yield g.say('sam', 'Сначала цель, Макс. Потом кнопка.'); }
        } },
      { id: 'silo', name: 'Монитор шахты', rect: [258, 74, 52, 52], walk: [232, 140], face: 'e',
        look: function* (g) {
          g.f.knowSilo = true;
          yield g.say('sam', 'Монитор «Шахта 1». На нём монумент Вашингтона. Из-под основания идёт пар.');
          if (!g.seen.siloHint) { g.seen.siloHint = 1; yield g.say('max', 'Он не каменный! Он заправленный!'); }
        } }
    ],
    enter: function* (g) {
      if (g.seen.warroom) return;
      g.seen.warroom = 1;
      yield g.say('max', 'Экраны! Карта! КНОПКА! Сэм, я дома!');
      yield g.say('sam', 'Ничего не трогай, Макс. Отсюда начинаются войны и кончаются карьеры.');
    },
    maxHint(g) {
      const f = g.f;
      if (!f.knowBeacon) return 'Прицельный компьютер справа! Посмотри, какие у него цели!';
      if (!f.beaconTaken) return 'Ракета летит на маяк, а маяк висит у Боско! За табличкой «Скидка», под камерой! Едем забирать!';
      if (!f.beaconOn) return 'Маяк у нас! Садись в Де Сото и гонись за Линкольном. Бросать буду я!';
      return 'Маяк на Линкольне! Открывай прицельный компьютер, выбирай маяк и жми «Огонь»!';
    }
  };

  E.warroom = { shot, finale, lookOut };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
