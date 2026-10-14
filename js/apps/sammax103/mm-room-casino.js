(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP103;
  const { ROOMS, TALK } = E;

  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'В', 'Д', 'К', 'Т'];
  const RANK_NAMES = ['двойка', 'тройка', 'четвёрка', 'пятёрка', 'шестёрка', 'семёрка', 'восьмёрка', 'девятка', 'десятка', 'валет', 'дама', 'король', 'туз'];
  const SUIT_NAMES = { s: 'пик', h: 'червей', c: 'треф', d: 'бубен' };
  const SUITS = ['s', 'h', 'c', 'd'];
  const cardName = c => RANK_NAMES[c.r] + ' ' + SUIT_NAMES[c.s];
  const SEAT = [172, 174];
  const BUFFET = [364, 156];

  function deal(g) {
    if (g.f.aceOnNose) return { leo: { r: 2, s: 'h' }, sam: { r: 9, s: 'c' } };
    const leo = { r: g.rng.int(13), s: SUITS[g.rng.int(4)] };
    let sam;
    do sam = { r: g.rng.int(13), s: SUITS[g.rng.int(4)] }; while (sam.r === leo.r);
    if (!g.f.pokerLost && sam.r > leo.r) return { leo: sam, sam: leo };
    return { leo, sam };
  }

  function* startPoker(g) {
    const leo = g.actors.leonard;
    if (g.f.pokerWon) { yield g.say('leonard', 'Больше не играю. Мама говорит, после десяти миллионов пора домой. Я жду маму.'); return; }
    const how = E.payToken(g);
    if (!how) { yield g.say('leonard', 'Ставка один жетон, приятель. Жетоны раздаёт Лапочка у входа. Раздаёт, как будто они ничего не стоят. Они и не стоят.'); return; }
    g.f.pokerPaid = how;
    yield g.walkTo('sam', SEAT[0], SEAT[1]);
    g.face('sam', 'e');
    const cards = deal(g);
    g.closeup = { kind: 'poker', t0: g.time, leo: cards.leo, sam: cards.sam, glance: 0 };
    g.sfx('deal');
    yield g.say('cuddly', 'Сдаю?', { x: 70, y: 60 });
    yield g.say('sam', 'У Леонарда на лбу ' + cardName(cards.leo) + '.', { x: 160, y: 196 });
    g.closeup.glance = g.time;
    yield 1.1;
    if (!g.f.knowTell) {
      g.f.knowTell = true;
      yield g.say('sam', 'Перед ставкой он глянул куда-то мне за плечо. За плечом у меня обычно Макс, но Макс сегодня сбоку.', { x: 160, y: 196 });
    }
    const sees = g.f.aceOnNose ? { r: 12, s: 's' } : cards.leo;
    const bets = sees.r > cards.sam.r;
    g.f.pokerRound = { leo: cards.leo, sam: cards.sam, bets };
    leo.act = 'glance';
    if (bets) {
      if (g.f.aceOnNose) yield g.say('leonard', 'Ставлю всё! Десять миллионов против твоего жетона! У меня... то есть я просто в себе уверен!', { x: 160, y: 60 });
      else yield g.say('leonard', 'Ставлю всё! Десять миллионов против твоего жетона!', { x: 160, y: 60 });
    } else yield g.say('leonard', 'Пас. Мне не нравится твоё лицо. И карта на нём тоже.', { x: 160, y: 60 });
    leo.act = 'sit';
    yield g.talkTo('poker');
  }

  function endRound(g, returnToken) {
    if (returnToken && g.f.pokerPaid === 'token') g.give('token');
    g.f.pokerRound = null;
    g.f.pokerPaid = null;
    g.closeup = null;
  }

  function* win(g) {
    const leo = g.actors.leonard;
    g.closeup.reveal = true;
    yield g.say('leonard', 'Туз пик! У меня туз, я видел... Что? Четвёрка?!', { x: 160, y: 60 });
    yield g.say('sam', 'Четвёрка червей против моего валета. Десять миллионов, Леонард.', { x: 160, y: 196 });
    g.sfx('jackpot');
    endRound(g, false);
    g.give('tokens');
    g.f.pokerWon = true;
    leo.act = 'sit';
    yield g.say('leonard', 'На носу у Теда туз! Кто повесил туза на нос Теду?! Это жульничество!');
    yield g.say('sam', 'Жульничество, Леонард, это когда подглядываешь в нос статуе. А когда на нос статуе вешают туза, это правосудие.');
    yield g.say('max', 'Десять миллионов! Сэм, мы богачи! Купим сэндвич!');
    yield g.say('sam', 'Оригинал не продаётся, Макс. А жетоны за этой дверью годятся только на пуговицы.');
    yield g.say('leonard', 'Мама будет в ярости. Мама будет... Я ещё отыграюсь. Не в карты. Чем-нибудь.');
  }

  TALK.poker = {
    options: g => {
      const r = g.f.pokerRound;
      if (!r) return [{ id: 'leave', icon: 'bye', text: 'Хватит карт.', end: true, run: function* (gg) { endRound(gg, false); } }];
      if (!r.bets) return [{ id: 'draw', icon: 'fold', text: 'Ничья так ничья.', end: true, run: function* (gg) { yield gg.say('cuddly', 'Сдаю?', { x: 70, y: 60 }); endRound(gg, true); } }];
      return [
        { id: 'bet', icon: 'chips', text: 'Принимаю. Мой жетон против твоих миллионов.', end: true, run: function* (gg) {
          if (r.sam.r > r.leo.r) { yield* win(gg); return; }
          gg.closeup.reveal = true;
          gg.sfx('chips');
          yield gg.say('leonard', 'У тебя ' + cardName(r.sam) + '! Твой жетон теперь мой!', { x: 160, y: 60 });
          g.f.pokerLost = true;
          endRound(gg, false);
          yield gg.say('sam', 'Он ставит только тогда, когда выигрывает. Удобная привычка. Я бы тоже такую завёл.');
        } },
        { id: 'fold', icon: 'fold', text: 'Пас.', end: true, run: function* (gg) {
          yield gg.say('leonard', 'Трус! Мама бы поставила!', { x: 160, y: 60 });
          g.f.pokerLost = true;
          endRound(gg, true);
        } },
        { id: 'askmax', icon: 'f:max', text: 'Макс, что у меня на лбу?', once: false, run: function* (gg) {
          yield gg.say('max', 'У тебя на лбу ' + cardName(r.sam) + '!', { x: 250, y: 150 });
          yield gg.say('leonard', 'Подсказки запрещены!', { x: 160, y: 60 });
          yield gg.say('max', 'Какая подсказка? Мы ведём светскую беседу!', { x: 250, y: 150 });
        } }
      ];
    }
  };

  TALK.leonard = {
    start: function* (g) {
      if (!g.f.metLeonard) {
        g.f.metLeonard = true;
        yield g.say('leonard', 'Индейский покер, приятель? Самая честная игра на свете. Карта на лбу, и никакого обмана.');
      }
    },
    options: [
      { id: 'who', icon: 'f:leonard', text: 'Кто вы?', run: function* (g) {
        yield g.say('leonard', 'Леонард Стейкчармер. Чемпион этого казино. Десять миллионов жетонов, выиграны по одному. Мама говорит, у меня талант.');
      } },
      { id: 'rules', icon: 'ace', text: 'Как играть в индейский покер?', run: function* (g) {
        yield g.say('leonard', 'Каждому сдают по карте. Не глядя лепишь её на лоб. Ты видишь мою, я твою, свою никто не видит.');
        yield g.say('leonard', 'Потом ставим. Можно спасовать. Если ставят оба, у кого карта старше, тот и забирает всё.');
        g.f.pokerRules = true;
      } },
      { id: 'play', icon: 'chips', text: 'Сыграем!', end: true, when: g => !g.f.pokerWon, run: function* (g) { g.endDialog(); yield* startPoker(g); } },
      { id: 'win', icon: 'q', text: 'Как вы всегда выигрываете?', when: g => g.f.pokerLost && !g.f.pokerWon, run: function* (g) {
        yield g.say('leonard', 'Талант, приятель. И хорошая память. И хорошее зрение. И ничего больше.');
        yield g.say('leonard', 'И не смотри так на Теда. Тед тут ни при чём.');
      } },
      { id: 'code', icon: 'rug', text: E.CODE, run: function* (g) {
        yield g.say('leonard', 'Ковёр? Шторы? Приятель, я смотрю только на карты. И иногда на... Ни на что я не смотрю!');
        yield g.say('sam', 'Пощёчины нет. Зато он покраснел до самой лысины.');
      } },
      { id: 'mama', icon: 'mama', text: 'Как поживает ваша мама?', once: true, run: function* (g) {
        yield g.say('leonard', 'Мама велела выиграть до ужина и не есть мафиозную еду. Я выигрываю. Про еду обещать не буду.');
      } },
      { id: 'bye', icon: 'bye', text: 'Ещё увидимся.', end: true, run: function* (g) {
        yield g.say('leonard', g.f.pokerWon ? 'Уж я надеюсь. Мама надеется ещё сильнее.' : 'Приходи с жетоном, приятель. Я всегда здесь. Как Тед.');
      } }
    ]
  };

  TALK.cuddly = {
    options: [
      { id: 'hi', icon: 'f:cuddly', text: 'Вы тут крупье?', run: function* (g) { yield g.say('cuddly', 'Сдаю?'); } },
      { id: 'play', icon: 'chips', text: 'Сдайте мне карту.', run: function* (g) { yield g.say('cuddly', 'Сдаю?'); yield g.say('sam', 'С крупье тут не играют. С ним даже не разговаривают, с ним соглашаются.'); } },
      { id: 'code', icon: 'rug', text: E.CODE, run: function* (g) {
        yield g.say('cuddly', 'Сдаю?');
        yield g.say('max', 'Он не крот, Сэм. У кротов словарный запас больше.');
      } },
      { id: 'bye', icon: 'bye', text: 'Спасибо.', end: true, run: function* (g) { yield g.say('cuddly', 'Сдаю?'); } }
    ]
  };

  function* chucklesOut(g) {
    const ch = g.actors.chuckles;
    ch.scripted = true;
    g.place('chuckles', 'casino', 424, 142, 's');
    ch.visible = true; ch.act = ''; ch.keepAct = false;
    g.sfx('door');
    yield g.walkTo('chuckles', 432, 160);
    g.faceTo('chuckles', g.actors.sam.x);
    if (!g.f.chucklesWhisper) yield g.say('chuckles', 'Кто тут выигрывает? А. Поздравляю. Приз заведения: улыбка Теда И. Бэра.');
    else yield g.say('chuckles', 'Опять вы. Выигрывайте пореже. Это полезно для здоровья.');
    yield g.walkTo('chuckles', 424, 144);
    yield g.say('guard', 'Стоять. Пароль.');
    ch.act = 'whisper';
    yield g.say('chuckles', 'Пш-ш. Пш-пш-ш. Пш-ш-ш.');
    yield g.say('guard', 'Проходите.');
    ch.act = '';
    g.sfx('door');
    g.place('chuckles', 'backroom', 172, 142, 's');
    ch.scripted = false;
    const first = !g.f.chucklesWhisper;
    g.f.chucklesWhisper = true;
    if (g.f.bugPlaced && !g.f.passwordKnown) {
      const roach = g.actors.roach;
      g.place('roach', 'casino', BUFFET[0], BUFFET[1], 'w');
      roach.visible = true; roach.scripted = true;
      yield g.walkTo('roach', g.actors.sam.x + 8, g.actors.sam.y, { free: true, speed: 1.5 });
      g.place('roach', 'nowhere', 0, 0);
      roach.scripted = false;
      g.f.bugPlaced = false;
      g.give('roach');
      g.f.bugRec = 'password';
      yield g.say(null, 'Сэр! Объект прошептал пароль! Воспроизвожу!', { key: 'roachvoice', color: COLORS.roach });
      yield* E.bugReplay(g, 'password');
      g.f.passwordKnown = true;
      yield g.say('sam', '«Оставь пистолет, возьми канноли». Пароль, достойный семьи. И буфета.');
      return;
    }
    if (first) {
      yield g.say('sam', 'Шепчет. В этой семье берегут даже гласные.');
      yield g.say('max', 'Давай подкрадёмся! Я умею красться! Я крадусь, даже когда сплю!');
      yield g.say('sam', 'Когда ты крадёшься, Макс, ты напеваешь.');
    }
  }

  function* meatWin(g) {
    const ch = g.actors.chuckles, max = g.actors.max;
    g.f.meatDone = true;
    yield g.say('sam', 'Оригинальный сэндвич с фрикадельками. Помятый, но всё ещё оригинальный. Двенадцать лет выдержки и один Леонард.');
    yield g.say('max', 'Можно я его понюхаю? Только понюхаю! Одной ноздрёй!');
    ch.scripted = true;
    g.place('chuckles', 'casino', 424, 142, 's');
    ch.visible = true; ch.act = ''; ch.keepAct = false;
    g.sfx('door');
    yield g.walkTo('chuckles', 432, 162);
    yield g.say('chuckles', 'Сэндвич. Вернулся.');
    ch.act = 'give'; ch.actT = 0.8;
    yield g.say('chuckles', 'Семья ценит тех, кто возвращает семейное. Остальных семья тоже ценит. Недолго.');
    yield g.say('max', 'А понюхать?');
    yield g.say('chuckles', 'На церемонии. Может быть.');
    yield g.walkTo('chuckles', 424, 144);
    g.sfx('door');
    g.place('chuckles', 'backroom', 172, 142, 's');
    ch.scripted = false;
    max.act = 'grin'; max.actT = 1;
    yield* E.trialDone(g);
  }

  function* playSlot(g) {
    if (g.f.meatStolen && !g.f.armBack) { yield g.say('sam', 'Однорукий бандит стал безруким. Дёргать не за что.'); return; }
    const how = E.payToken(g);
    if (!how) { yield g.say('sam', 'Без жетона он даже не моргнёт. Хотя он и с жетоном не моргает.'); return; }
    if (how === 'sack') yield g.say('sam', 'Минус один жетон из десяти миллионов. Мешок и не заметил.');
    yield g.walkTo('sam', 440, 174);
    g.face('sam', 'e');
    const meat = g.f.armBack && !g.f.meatDone;
    g.closeup = { kind: 'slot', t0: g.time, meat };
    g.sfx('slot');
    yield g.anim('sam', 'reach', 0.4);
    yield 2.4;
    g.sfx('jackpot');
    yield g.say(null, E.FIRE, { key: 'slotvoice', color: COLORS.slotvoice, x: 160, y: 30 });
    yield 0.6;
    g.closeup = null;
    if (meat) { yield* meatWin(g); return; }
    if (!g.seen.slotFirst) {
      g.seen.slotFirst = 1;
      yield g.say('sam', 'Три мишки и крик «Ты в огне!». В лотке пусто. Поздравили и обокрали.');
      yield g.say('max', 'Он кричит нам «Ты в огне!» Сэм, я проверил, я не горю!');
    }
    if (!g.f.joined) yield* chucklesOut(g);
    else yield g.say('sam', 'Опять «Ты в огне!» и ничего. Этот автомат хвалит всех, но никому не платит. Как мафия.');
  }

  function* plantBug(g) {
    if (g.f.passwordKnown || g.f.backroom) { yield* E.bugPlant(g, 'guard'); return; }
    const roach = g.actors.roach;
    yield g.say('sam', 'Жучок, приказ: засесть за спиной охранника и слушать, что ему шепчут.');
    yield g.say(null, 'Есть засада, сэр! Как во Вьетнаме, только с канноли!', { key: 'roachvoice', color: COLORS.roach });
    g.drop('roach');
    g.place('roach', 'casino', g.actors.sam.x + 8, g.actors.sam.y, 'e');
    roach.visible = true; roach.scripted = true;
    yield g.walkTo('roach', BUFFET[0], BUFFET[1], { free: true, speed: 1.5 });
    g.place('roach', 'nowhere', 0, 0);
    roach.scripted = false;
    g.f.bugPlaced = true;
    yield g.say('sam', 'Из-под скатерти торчат два уса. Если охранник спросит, это петрушка.');
  }

  function* guessLine(g, text, answer) {
    yield g.say('guard', answer);
  }

  const GUESSES = [
    ['sesame', 'keyhole', 'Сезам, откройся.', 'Неправильно. И это не пещера.'],
    ['sword', 'q', 'Рыба-меч.', 'Неправильно. Рыбу мы заказываем по пятницам.'],
    ['rose', 'heart', 'Розовый бутон.', 'Неправильно. Цветы носят Дону. Мне носят пароли.'],
    ['ted', 'f:ted', 'Мы от Теда И. Бэра.', 'От Теда И. Бэра тут все. Пароль.'],
    ['word', 'ex', 'Пароль.', 'Правильно, это слово «пароль». А сам пароль?'],
    ['mom', 'mama', 'Мама.', 'Неправильно. Но трогательно.']
  ];

  TALK.guard = {
    start: function* (g) {
      if (!g.f.guardMet) { g.f.guardMet = true; yield g.say('guard', 'Стоять. Пароль.'); }
      else yield g.say('guard', 'Пароль.');
    },
    options: g => GUESSES.map(([id, icon, text, answer]) => ({ id, icon, text, once: true, run: function* (gg) { yield* guessLine(gg, text, answer); } })).concat([
      { id: 'code', icon: 'rug', text: E.CODE, run: function* (gg) {
        yield gg.say('guard', 'Шторы? Старые шторы сгорели. Я стоял рядом. Мне нравится смотреть, как что-нибудь горит.');
        yield gg.say('max', 'Вычёркиваем, Сэм. Этот поджигатель. Мне он нравится!');
      } },
      { id: 'who', icon: 'f:guard', text: 'Кто вы?', run: function* (gg) {
        yield gg.say('guard', 'Охранник. Охраняю дверь. От всех. Даже от своих. Свои тут в одинаковых головах, их не различишь. Поэтому пароль.');
      } },
      { id: 'pass', icon: 'cannoli', text: E.PASSWORD, end: true, when: gg => gg.f.passwordKnown, run: function* (gg) {
        yield gg.say('guard', 'Правильно. Проходите. Канноли на буфете для семьи.');
        gg.endDialog();
        gg.sfx('door');
        yield* gg.goRoom('backroom', { x: 34, y: 170, dir: 'e' });
      } },
      { id: 'bye', icon: 'bye', text: 'Мы ещё подумаем.', end: true, run: function* (gg) { yield gg.say('guard', 'Думайте. Там, за линией.'); } }
    ])
  };

  function* backDoor(g) {
    if (g.f.inducted) {
      g.sfx('door');
      yield* g.goRoom('backroom', { x: 34, y: 170, dir: 'e' });
      return;
    }
    if (g.f.joined || g.f.backroom) {
      yield g.say('guard', 'Семья. Проходите.');
      g.sfx('door');
      yield* g.goRoom('backroom', { x: 34, y: 170, dir: 'e' });
      return;
    }
    yield g.talkTo('guard');
  }

  ROOMS.casino = {
    id: 'casino', name: 'Казино Теда И. Бэра', w: 480, music: 'casino',
    paint: b => S.BG.casino(b),
    walk: [[6, 152, 474, 152, 474, 198, 6, 198]],
    block: [[176, 148, 322, 148, 326, 168, 172, 168]],
    layers: [
      { id: 'table', x: 166, y: 128, base: 170 },
      { id: 'buffet', x: 332, y: 110, base: 152, key: g => g.f.bugPlaced && !g.f.passwordKnown ? 'b' : '' },
      { id: 'slot', x: 446, y: 66, base: 152, key: g => g.f.meatStolen && !g.f.armBack ? 'a' : '' }
    ],
    drawFront(f, g, cx) {
      if (!g.f.aceOnNose) return;
      const P = new S.Pen(f);
      P.part(P.rect(80 - cx, 57, 8, 11), C.grey, { b: 5, sh: 0, hi: 0 });
      S.art103.suitShape(P, 84 - cx, 63, 's', 0.8, C.night[1]);
    },
    hot: [
      { id: 'exit', name: 'Игровой рай', rect: [4, 38, 40, 90], walk: [30, 170], face: 'w',
        look: 'Проход обратно в Игровой рай. Оттуда пахнет сахарной ватой и безысходностью.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('playland', { x: 446, y: 168, dir: 'w' }); } },
      { id: 'bust', name: 'Бюст Теда И. Бэра', rect: [56, 22, 56, 112], walk: [96, 164], face: 'n',
        look: 'Латунный бюст Теда И. Бэра на постаменте. Ресницы, зубы и нос, начищенный до зеркального блеска.',
        use: 'Протереть бюст? Его и так протирают чаще, чем меня.' },
      { id: 'nose', name: g => g.f.aceOnNose ? 'Туз на носу' : 'Нос Теда И. Бэра', rect: [77, 55, 15, 13], walk: [96, 164], face: 'n', over: true,
        look: function* (g) {
          if (g.f.aceOnNose) { yield g.say('sam', 'Туз пик на носу у Теда. В отражении теперь всегда туз. Удача любит тех, кто ей помогает.'); return; }
          g.f.noseSeen = true;
          yield g.say('sam', 'Нос отполирован, как зеркало. В нём отражается весь зал. Покерный стол. И лоб Леонарда вместе с картой.');
          if (g.f.pokerLost) yield g.say('sam', 'Вот и весь талант. Латунный, с ресницами.');
        },
        use: 'Нос тёплый и скользкий. Его начищают каждое утро. С любовью или от страха.',
        items: {
          ace: function* (g) {
            yield g.anim('sam', 'reach', 0.6);
            g.drop('ace');
            g.f.aceOnNose = true;
            g.f.noseSeen = true;
            yield g.say('sam', 'Макс, жвачку.');
            yield g.say('max', 'Держи! Мятная! Почти не жёванная!');
            yield g.say('sam', 'Тузу идёт латунь. Посмотрим, что скажет талант Леонарда.');
          },
          gun: 'Стрелять в нос бюсту? Мафия отнесётся к этому как к оскорблению семьи. И будет права.',
          magnet: 'Магнит на латунь не липнет. Латунь, как и мафия, ни к чему не привязывается.'
        } },
      { id: 'sign', name: 'Вывеска', rect: [150, 8, 160, 28], look: '«КАЗИНО». Буквы горят розовым. Одна мигает, будто подмигивает налоговой.' },
      { id: 'picture', name: 'Картина', rect: [192, 42, 64, 44], walk: [224, 176], face: 'n',
        look: 'Мишки играют в покер. Один мишка подглядывает в зеркало за спиной другого. В этом казино даже картины жульничают.' },
      { id: 'table', name: 'Покерный стол', rect: [168, 128, 156, 40], walk: [SEAT[0], SEAT[1]], face: 'e',
        look: 'Покерный стол. Вся горка жетонов лежит у Леонарда. Напротив свободный стул для гостя.',
        use: function* (g) {
          if (g.actors.leonard.room !== 'casino') { yield g.say('sam', 'Играть не с кем. Леонард исчез, крупье тоже.'); return; }
          yield* startPoker(g);
        },
        items: {
          token: function* (g) { if (g.actors.leonard.room !== 'casino') { yield g.say('sam', 'Играть не с кем.'); return; } yield* startPoker(g); },
          ace: 'Подсунуть своего туза? Обнимашка сдаёт из своей колоды. А на нашем тузе следы зубов Джимми.'
        } },
      { id: 'buffet', name: 'Буфет', rect: [332, 110, 64, 42], walk: [BUFFET[0], BUFFET[1] + 12], face: 'n',
        look: g => g.f.bugPlaced && !g.f.passwordKnown ? 'Буфет. Из-под скатерти торчат усы жучка. Он в засаде.' : 'Буфет для семьи: канноли, фрикадельки и спагетти. Всё под табличкой «Только для своих».',
        use: function* (g) {
          if (g.f.bugPlaced && !g.f.passwordKnown) {
            g.f.bugPlaced = false;
            g.give('roach');
            yield g.say('sam', 'Отбой, сержант.');
            yield g.say(null, 'Засада отменена, сэр! Так точно, сэр!', { key: 'roachvoice', color: COLORS.roach });
            return;
          }
          if (g.f.joined) { yield g.say('max', 'Мы семья! Нам можно!'); g.sfx('eat'); yield g.say('max', 'Канноли! Сэм, они с кремом! Я вступаю в мафию второй раз!'); return; }
          yield g.say('guard', 'Буфет только для семьи.');
          yield g.say('max', 'Я почти семья! Я могу быть дальним родственником!');
          yield g.say('guard', 'Дальние родственники едят в Игровом раю. Сахарную вату.');
        },
        items: {
          roach: function* (g) { yield* plantBug(g); },
          max: function* (g) { yield g.say('max', 'Отойди, Сэм, я знаю, что делать с буфетом!'); yield g.say('guard', 'Кролик. Стоять.'); yield g.say('max', 'Я стою! Просто рядом с едой!'); }
        } },
      { id: 'backdoor', name: 'Дверь «Только для семьи»', rect: [404, 44, 44, 96], walk: [424, 172], face: 'n',
        look: 'Дверь в заднюю комнату. Табличка «Только для семьи». За дверью, судя по голосам, очень большая семья.',
        use: function* (g) { yield* backDoor(g); },
        exit: function* (g) { yield* backDoor(g); } },
      { id: 'slot', name: 'Мишка-бандит', rect: [446, 66, 34, 84], walk: [440, 174], face: 'e',
        look: g => g.f.meatStolen && !g.f.armBack ? 'Мишка-бандит без ручки. На её месте дырка от болта. В лотке для выигрышей что-то пахнет фрикадельками.' : 'Однорукий бандит «Мишка». Наверху голова Теда И. Бэра. Внизу лоток для выигрышей. Пыль в нём лежит с открытия.',
        use: function* (g) { yield* playSlot(g); },
        items: {
          token: function* (g) { yield* playSlot(g); },
          tokens: function* (g) { yield* playSlot(g); },
          arm: function* (g) {
            if (g.f.armBack) return;
            yield g.anim('sam', 'reach', 0.6);
            g.drop('arm');
            g.f.armBack = true;
            g.sfx('click');
            yield g.say('sam', 'Бандит снова однорукий. Для бандита это почти комплимент.');
          },
          gun: 'Грабить автомат с пистолетом? Это было бы слишком тематично.'
        } }
    ],
    actors: {
      leonard: {
        name: 'Леонард Стейкчармер', walk: [SEAT[0], SEAT[1]], face: 'e', when: g => g.actors.leonard.room === 'casino',
        look: g => g.f.pokerWon ? 'Леонард сидит над пустым местом, где были его жетоны. Смотрит на туза на носу у Теда. Туз смотрит в ответ.' : 'Леонард Стейкчармер. Лысый, усатый, в бордовой водолазке. Перед ставкой всегда смотрит куда-то мне за спину.',
        talk: function* (g) { yield g.talkTo('leonard'); },
        items: {
          token: function* (g) { yield* startPoker(g); },
          roach: function* (g) { yield* E.bugPlant(g, 'leonard'); },
          ace: function* (g) { yield g.say('leonard', 'Свой туз? Приятель, это казино. Со своими картами сюда ходят только дети и шулера. Карты сдаёт крупье.'); },
          gun: function* (g) { yield g.say('leonard', 'Угрожать чемпиону? Мама узнает! У мамы связи!'); },
          max: function* (g) { yield g.say('max', 'Можно я поиграю с вашими жетонами?'); yield g.say('leonard', 'Только посмотреть. Руками не трогать. Зубами тем более.'); }
        }
      },
      cuddly: {
        name: 'Обнимашка', walk: [230, 176], face: 'n', dist: 20, when: g => g.actors.cuddly.room === 'casino',
        look: 'Обнимашка, крупье. Зелёная мишкина голова, сиреневый костюм в полоску. Словарный запас в одно слово.',
        talk: function* (g) { yield g.talkTo('cuddly'); },
        items: {
          roach: function* (g) { yield* E.bugPlant(g, 'cuddly'); },
          token: function* (g) { yield g.say('cuddly', 'Сдаю?'); yield g.say('max', 'Он бы взял, Сэм, но у него лапы заняты колодой!'); },
          '*': function* (g) { yield g.say('cuddly', 'Сдаю?'); }
        }
      },
      guard: {
        name: 'Мишка-охранник', walk: [410, 174], face: 'e', dist: 22, when: g => g.actors.guard.room === 'casino',
        look: 'Мишка-охранник. Голубая голова, серый костюм, руки скрещены на груди. Руки у него скрещены, похоже, с рождения.',
        talk: function* (g) { if (g.f.joined) { yield g.say('guard', 'Семья. Проходите.'); return; } yield g.talkTo('guard'); },
        items: {
          roach: function* (g) { yield* plantBug(g); },
          gun: function* (g) { yield g.say('guard', 'Уберите. У меня под пиджаком три таких. И ни одного пароля.'); },
          token: function* (g) { yield g.say('guard', 'Взятки берёт Чаклз. Я беру пароли.'); },
          tokens: function* (g) { yield g.say('guard', 'Десять миллионов? Не надо. Дон узнает, что меня можно купить, и купит дешевле.'); },
          max: function* (g) { yield g.say('max', 'А если я пройду очень быстро?'); yield g.say('guard', 'Тогда я очень быстро стою.'); }
        }
      }
    },
    enter: function* (g) {
      if (!g.seen.casino103) {
        g.seen.casino103 = 1;
        yield g.say('max', 'Сэм! Казино! Тут пахнет деньгами и потом! Мне нравится!');
      }
      if (g.f.meatStolen && !g.seen.theftSeen) {
        g.seen.theftSeen = 1;
        yield g.say('sam', 'Леонарда за столом нет. За десять миллионов партий он ни разу не встал со стула.');
      }
    },
    setup(g) {
      const leo = g.actors.leonard, cu = g.actors.cuddly, gd = g.actors.guard;
      if (!g.f.meatStolen) { g.place('leonard', 'casino', 318, 162, 'w'); leo.act = 'sit'; leo.keepAct = true; leo.visible = true; }
      else if (leo.room === 'casino') g.place('leonard', 'nowhere', 0, 0);
      if (g.f.inducted) { g.place('cuddly', 'nowhere', 0, 0); g.place('guard', 'nowhere', 0, 0); }
      else {
        if (!g.f.joined || g.f.boscoDone) { g.place('cuddly', 'casino', 246, 146, 's'); cu.act = 'deal'; cu.keepAct = true; cu.visible = true; }
        g.place('guard', 'casino', 424, 152, 's'); gd.act = 'block'; gd.keepAct = true; gd.visible = true;
      }
      g.closeup = null;
    },
    onLoad(g) { ROOMS.casino.setup(g); }
  };

  E.cards = { RANKS, RANK_NAMES, cardName, deal };
  E.casino = { startPoker, playSlot, chucklesOut, plantBug };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
