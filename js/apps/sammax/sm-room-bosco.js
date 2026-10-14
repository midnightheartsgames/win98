(function (S) {
  'use strict';
  const { ROOMS, TALK } = S;
  const EXIT = [30, 170];

  function* punch(g, id) {
    g.f.punchT = g.time;
    g.sfx('boing');
    yield 0.25;
    g.sfx('punch');
    g.fx.shake = 0.8;
    const a = g.actors[id];
    a.act = 'ko'; a.keepAct = true; a.path = null;
    yield 0.6;
    g.f.punchT = 0;
  }

  function* whizzerExit(g) {
    const wz = g.actors.whizzer;
    wz.scripted = true;
    const withCheese = g.f.cheeseInBasket;
    wz.v = withCheese ? 'cheese' : '';
    g.f.basketDown = false;
    if (!withCheese) {
      yield g.say('whizzer', 'Уф. Пойду ещё похожу. Скоро опять захочется.');
      yield g.walkTo('whizzer', 110, 164);
      wz.scripted = false;
      return;
    }
    yield g.say('whizzer', 'Уф. Всё, домой. Сегодня опять ничего не купил.');
    yield g.walkTo('whizzer', 34, 168);
    g.face('whizzer', 'w');
    yield* punch(g, 'whizzer');
    yield g.say('bosco', 'Попался! Антивор-О-Мат не промахивается!');
    yield 1.2;
    wz.act = ''; wz.keepAct = false; wz.hypno = false; wz.v = 'nobasket';
    yield g.say('whizzer', 'Ой. Где я? Откуда в корзинке сыр? Я же не люблю сыр.');
    yield g.say('whizzer', 'И мне... не хочется в туалет? Впервые за год!');
    g.f.cheeseInBasket = false;
    g.f.whizzerCured = true;
    yield g.say('bosco', 'Сыр на стол. Бесплатно у меня только кассеты, и то потому, что мне за них платят.');
    yield g.walkTo('whizzer', 120, 166);
    wz.scripted = false;
    yield g.say('sam', 'Видел, Макс? Один удар по голове, и гипноза как не бывало.');
    yield g.say('max', 'Я же говорил! Насилие решает всё!');
    yield* S.checkCures(g);
  }

  function* maxToToilet(g) {
    const max = g.actors.max;
    max.scripted = true;
    yield g.say('max', 'Мне как раз надо! Я быстро!');
    yield g.walkTo('max', 154, 131);
    g.face('max', 'n');
    g.f.wcOpen = true; g.sfx('door');
    yield 0.4;
    max.visible = false;
    g.f.wcOpen = false; g.sfx('door');
    g.f.maxInToilet = true;
    g.f.maxAway = true;
    if (g.f.whizzerCured) { max.scripted = false; return; }
    const wz = g.actors.whizzer;
    wz.scripted = true;
    yield g.say('whizzer', 'Туалет занят?! Нет-нет-нет! Мне надо! Очень надо!');
    yield g.walkTo('whizzer', 118, 164);
    g.f.basketDown = true;
    wz.v = 'nobasket';
    yield g.walkTo('whizzer', 150, 140);
    g.face('whizzer', 'n');
    yield g.say('whizzer', 'Открывай! Я тут уже скрестил всё, что можно скрестить!');
    wz.scripted = false;
    max.scripted = false;
  }

  function* maxFromToilet(g) {
    const max = g.actors.max;
    yield g.say('sam', 'Макс, выходи! Тут очередь.');
    yield g.say('max', 'Иду! Я стену не дочитал!');
    g.sfx('flush');
    yield 0.8;
    g.f.wcOpen = true; g.sfx('door');
    max.visible = true;
    g.place('max', 'bosco', 154, 132, 's');
    max.scripted = true;
    yield g.walkTo('max', 176, 160);
    g.f.wcOpen = false;
    g.f.maxInToilet = false;
    g.f.maxAway = false;
    max.scripted = false;
    if (g.f.whizzerCured || !g.f.basketDown) return;
    const wz = g.actors.whizzer;
    wz.scripted = true;
    yield g.say('whizzer', 'Наконец-то!');
    yield g.walkTo('whizzer', 154, 132);
    wz.visible = false;
    g.f.wcOpen = true; g.sfx('door');
    yield 0.3;
    g.f.wcOpen = false;
    yield 1.2;
    g.sfx('flush');
    yield 1.4;
    g.f.wcOpen = true; g.sfx('door');
    wz.visible = true;
    yield g.walkTo('whizzer', 120, 164);
    g.f.wcOpen = false;
    yield* whizzerExit(g);
  }

  function* samKnockout(g) {
    const sam = g.actors.sam;
    yield g.say('sam', 'Кассеты доставлены. Сыр... тоже доставка.');
    yield g.walkTo('sam', 34, 170);
    g.face('sam', 'w');
    yield* punch(g, 'sam');
    yield g.say('bosco', 'Сэм! Я не хотел! То есть хотел, но не тебя!');
    yield 1.0;
    g.drop('cheese');
    yield g.fadeOut(0.8);
    sam.act = ''; sam.keepAct = false;
    yield* S.startDream(g);
  }

  function* samLoop(g) {
    g.f.deliveries = (g.f.deliveries || 0) + 1;
    yield g.say('sam', 'Кассеты доставлены. Вернуться к Мастеру. Взять новые.');
    yield g.fadeOut(1.5);
    g.setRoom('bosco', { x: 40, y: 172, dir: 'e' });
    g.give('tapes');
    g.f.tapesDelivered = false;
    yield g.fadeIn(1.5);
    const n = g.f.deliveries;
    if (n === 1) yield g.say('bosco', 'Опять? Сэм, у меня ими весь склад забит.');
    else if (n === 2) {
      yield g.say('bosco', 'Сэм, ты как зомби. Был у меня тут один такой покупатель...');
      yield g.say('bosco', 'Антивор-О-Мат ему врезал, и он очнулся нормальным. Даже извинился.');
    } else yield g.say('bosco', 'Сэм. Опять. Кассеты. Мне уже страшно.');
  }

  TALK.bosco = {
    start: function* (g) {
      if (!g.seen.boscoHi) { g.seen.boscoHi = 1; yield g.say('bosco', 'Добро пожаловать в «Магазин неудобств». Ничего не трогать. Сломал, платишь вдвое.'); }
      else yield g.say('bosco', 'Опять вы. Что на этот раз?');
    },
    options: [
      { id: 'sell', icon: 'money', text: 'Что у тебя продаётся?', run: function* (g) {
        yield g.say('bosco', 'Всё на случай конца света. Консервы, батарейки, противогазы. И гранатомёт со слезоточивым газом.');
        if (!g.f.launcherBought) {
          yield g.say('sam', 'Почём гранатомёт?');
          yield g.say('bosco', 'Десять тысяч. Наличными. По кредиткам находят.');
          g.f.knowLauncher = true;
          if (!g.f.knowPatrol) {
            yield g.say('max', 'Сэм, у нас есть десять тысяч?');
            yield g.say('sam', 'У нас нет даже десяти долларов, Макс.');
            yield g.say('max', 'Давай кого-нибудь оштрафуем! На шоссе полно нарушителей! А нет, так сделаем!');
            g.f.knowPatrol = true;
          }
        }
      } },
      { id: 'guard', icon: 'fist', text: 'Что это за штука над дверью?', run: function* (g) {
        yield g.say('bosco', 'Антивор-О-Мат три тысячи. Датчик на выходе. Вынес неоплаченное, получил перчаткой в челюсть.');
        yield g.say('bosco', 'Вор потом спит как младенец. А некоторые просыпаются совсем другими людьми.');
        g.f.knowSecurity = true;
      } },
      { id: 'tapes', icon: 'tape', text: 'Откуда у тебя кассеты «Ай-Бо»?', run: function* (g) {
        yield g.say('bosco', 'Каждый полдень приезжает фургон и выгружает коробку. Водитель улыбается и не моргает.');
        yield g.say('bosco', 'Я ему не доверяю. Себе я тоже не доверяю, но ему меньше.');
        g.f.knowVan = true;
      } },
      { id: 'whiz', icon: 'f:whizzer', text: 'Что ты знаешь об Уиззере?', when: g => !g.f.whizzerCured, run: function* (g) {
        yield g.say('bosco', 'Торчит тут с утра до вечера. Берёт корзинку, ничего не покупает и ноет, что хочет в туалет.');
        yield g.say('bosco', 'А туалет у меня только для покупателей. Он за год даже жвачки не купил.');
      } },
      { id: 'calm', icon: 'duck', text: 'Боско, ты какой-то нервный.', once: true, run: function* (g) {
        yield g.say('bosco', 'Спокойные те, за кем не следят. За мной следят. Правительство, инопланетяне, налоговая. Налоговая хуже всех.');
      } },
      { id: 'hypno', icon: 'helmet', text: 'Боско, как защититься от гипноза?', when: g => g.f.samCured && !g.f.helmetDone, run: function* (g) {
        yield g.say('bosco', 'Гипноз? Я знал, что до этого дойдёт! Я пробовал собрать шлем-блокиратор.');
        yield g.say('bosco', 'Дуршлаг, фольга, изолента есть. Схемы нет. У меня на чертежах одни кружочки и стрелочки.');
        g.f.knowBlocker = true;
        if (!g.f.diagram) yield g.say('sam', 'Схема... У Сибил в кабинете полно учёных журналов.');
      } },
      { id: 'bye', icon: 'bye', text: 'Пока, Боско.', end: true, run: function* (g) { yield g.say('bosco', 'Приходите ещё. Или не приходите. Я всё равно за вами слежу.'); } }
    ]
  };

  TALK.whizzer = {
    options: [
      { id: 'who', icon: 'q', text: 'Ты Уиззер из «Сода-Попперов»?', run: function* (g) {
        yield g.say('whizzer', 'Был. Теперь я Уиззер из «Ай-Бо». Смотрю кассеты, хожу в магазин, хочу в туалет. Полная жизнь.');
      } },
      { id: 'basket', icon: 'q', text: 'Зачем тебе корзинка?', run: function* (g) {
        yield g.say('whizzer', 'Брэди сказал: «Будь как все, ходи с корзинкой». Я хожу.');
      } },
      { id: 'toilet', icon: 'duck', text: 'Может, тебе просто сходить в туалет?', run: function* (g) {
        yield g.say('whizzer', 'Туалет только для покупателей! А я страдалец. Если его ещё и займут, я всё брошу и умру. Прямо тут.');
      } },
      { id: 'brady', icon: 'f:brady', text: 'Что ты знаешь о Брэди Калчере?', run: function* (g) {
        yield g.say('whizzer', 'Брэди хороший. Брэди добрый. Брэди смотрит нам в глаза. Смотрите ему в глаза. Мне надо в туалет.');
      } },
      { id: 'bye', icon: 'bye', text: 'Держись, Уиззер.', end: true, run: function* (g) { yield g.say('whizzer', 'Держусь. Изо всех сил.'); } }
    ]
  };

  TALK.whizzerOk = {
    options: [
      { id: 'how', icon: 'q', text: 'Как ты, Уиззер?', run: function* (g) { yield g.say('whizzer', 'Хорошо! В туалет хочется, но как нормальному человеку.'); } },
      { id: 'mem', icon: 'eye', text: 'Что ты помнишь про Брэди?', run: function* (g) {
        yield g.say('whizzer', 'У него приют для бывших детских звёзд. Там телевизор в форме глаза. И все смотрят. Смотрят. Смотрят.');
      } },
      { id: 'bye', icon: 'bye', text: 'Береги себя.', end: true, run: function* (g) { yield g.say('whizzer', 'И вы! И ваш кролик!'); } }
    ]
  };

  ROOMS.bosco = {
    id: 'bosco', name: 'Лавка Боско', w: 320, music: g => g.f.samHypno ? 'hypno' : 'bosco',
    paint: (b) => S.BG.bosco(b),
    walk: [[8, 136, 212, 136, 232, 176, 312, 176, 312, 198, 8, 198]],
    layers: [
      { id: 'stand', x: 196, y: 70, base: 131 },
      { id: 'launcher', x: 252, y: 32, when: g => !g.f.launcherBought },
      { id: 'tag', x: 254, y: 48, when: g => !g.f.launcherBought },
      { id: 'glovearm', x: 46, y: 18, key: g => g.f.punchT ? 'p' + Math.round(Math.max(0, 1 - Math.abs(g.time - g.f.punchT - 0.25) * 4) * 6) : '' },
      { id: 'table', x: 44, y: 118, base: 147 },
      { id: 'cheese', x: 54, y: 112, base: 148, when: g => !g.has('cheese') && !g.f.cheeseInBasket },
      { id: 'wcOpen', x: 137, y: 39, when: g => g.f.wcOpen },
      { id: 'counter', x: 216, y: 110, base: 172 }
    ],
    sprites(g) {
      const out = [];
      if (g.f.basketDown) out.push({ y: 166, draw: (f, cx) => {
        const b = S.icon('basket');
        S.blit(f, b, 108 - cx, 152);
        if (g.f.cheeseInBasket) S.blit(f, S.icon('cheesebit'), 112 - cx, 150);
      } });
      return out;
    },
    hot: [
      { id: 'exit', name: 'Выход на улицу', rect: [4, 30, 40, 110], walk: EXIT, face: 'w',
        look: 'Дверь на улицу. Над ней Антивор-О-Мат. С неоплаченным товаром под ним лучше не проходить.',
        exit: function* (g) {
          if (g.f.maxInToilet) { yield g.say('sam', 'Я не уйду без Макса. Кто-то должен проследить, чтобы он не съел мыло.'); return; }
          if (g.f.samHypno) {
            if (g.has('cheese')) { yield* samKnockout(g); return; }
            if (!g.f.tapesDelivered) { yield g.say('sam', 'Кассеты не доставлены. Уходить нельзя.'); return; }
            yield* samLoop(g);
            return;
          }
          if (g.has('cheese')) {
            yield g.say('bosco', 'Стоп! Сыр не оплачен! Ещё шаг, и Антивор-О-Мат сделает из тебя отбивную!');
            yield g.say('sam', 'Ах да. Кладу обратно. Никаких резких движений.');
            g.drop('cheese');
            g.f.knowSecurity = true;
            return;
          }
          g.sfx('door');
          yield* g.goRoom('street', { x: 484, y: 146, dir: 's' });
        } },
      { id: 'antivor', name: 'Антивор-О-Мат', rect: [40, 4, 56, 34],
        look: 'Антивор-О-Мат три тысячи: пружинная боксёрская перчатка размером с холодильник. Смотрит на выход. И немного на меня.',
        use: 'Не трогаю. Он может неправильно понять.' },
      { id: 'table', name: 'Стол с сыром', rect: [44, 110, 44, 36], walk: [74, 152], face: 'n',
        look: g => g.has('cheese') || g.f.cheeseInBasket ? 'Пустой стол. Сыр ушёл по своим делам.' : 'Стол с головкой сыра. Табличка: «Сыр. Настоящий. Цену узнавайте у Боско (не узнавайте)».',
        use: function* (g) {
          if (g.has('cheese') || g.f.cheeseInBasket) { yield g.say('sam', g.f.samHypno ? 'Сыра нет.' : 'Сыр уже ушёл.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.give('cheese');
          if (g.f.samHypno) yield g.say('sam', 'Сыр. Не кассета. Тяжёлый.');
          else yield g.say('sam', 'Головка сыра. Боско, я посмотрю?');
          if (!g.f.samHypno) yield g.say('bosco', 'Смотреть можно. Выносить нельзя.');
        },
        items: { cheese: function* (g) { g.drop('cheese'); yield g.say('sam', 'Кладу на место. Пусть лежит, стареет.'); } } },
      { id: 'stand', name: 'Стойка «Ай-Бо»', rect: [196, 68, 28, 64], walk: [204, 140], face: 'n',
        look: '«Ай-Бо: аэробика для глаз! БЕСПЛАТНО! Возьми одну! Возьми ещё одну! Смотри! Смотри снова!»',
        use: function* (g) {
          if (g.f.samHypno) { yield g.say('sam', 'Кассеты на месте. Это радость.'); return; }
          if (g.has('tape') || g.f.tapeInVcr || g.f.tapeWatched) { yield g.say('sam', 'Одной кассеты мне хватит.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.give('tape');
          yield g.say('sam', 'Возьму одну. Для расследования. И попкорна потом куплю.');
        },
        items: { tapes: function* (g) { yield* deliverTapes(g); } } },
      { id: 'launcher', name: 'Гранатомёт', rect: [250, 28, 40, 30], when: g => !g.f.launcherBought, walk: [250, 180], face: 'e',
        look: 'Гранатомёт со слезоточивым газом. Ценник: 10 000 долларов. Надпись: «Для самообороны и семейных праздников».',
        use: function* (g) { yield g.say('bosco', 'Руки! Десять тысяч, и он твой. Хоть сейчас.'); g.f.knowLauncher = true; } },
      { id: 'wc', name: 'Туалет', rect: [136, 30, 36, 82], walk: [154, 136], face: 'n',
        look: g => g.f.maxInToilet ? 'Туалет. Там заперся Макс. Судя по звукам, он читает надписи на стенах. Вслух.' : 'Дверь туалета. Табличка: «Только для покупателей». Под ней мелко: «И для Уиззера. Ненавижу Уиззера».',
        use: function* (g) {
          if (g.f.maxInToilet) { yield* maxFromToilet(g); return; }
          if (g.f.samHypno) { yield g.say('sam', 'Туалет. Мастер не говорил про туалет.'); return; }
          yield g.say('sam', 'Мне не надо. И туалет только для покупателей.');
        },
        items: {
          max: function* (g) {
            if (g.f.maxInToilet) { yield g.say('sam', 'Макс уже там.'); return; }
            yield* maxToToilet(g);
          }
        } },
      { id: 'barrel', name: 'Бочка', rect: [172, 92, 22, 32], walk: [182, 140], face: 'n',
        look: 'Бочка с надписью «Солёные огурцы. Или не огурцы». Боско сам не помнит, что туда положил в восемьдесят пятом.',
        use: function* (g) { yield g.say('bosco', 'Не открывай! Она открывается только один раз.'); } },
      { id: 'shelves', name: 'Полки', rect: [56, 20, 78, 104], walk: [96, 140], face: 'n',
        look: ['«Сухая вода. Просто добавь воды».', '«Консервированный воздух из Нью-Джерси. Без консервантов».', '«Дезодорант "Мокрая собака"». Не смешно, Боско.', '«Кроличья лапка на удачу. Не от Макса». Надеюсь.', '«Сертификат на пожизненную гарантию. Срок годности истёк».'],
        use: 'Боско просил ничего не трогать. Спорить с ним дороже.' },
      { id: 'register', name: 'Касса', rect: [272, 110, 34, 16], walk: [250, 182], face: 'e', look: 'Касса. Боско говорит, в ней лежит сдача с тысяча девятьсот восемьдесят второго года.', use: function* (g) { yield g.say('bosco', 'Руки от кассы! Там всё посчитано. Даже пыль.'); } },
      { id: 'safe', name: 'Сейф', rect: [286, 30, 26, 30], look: 'Сейф с надписью «SAFE». Чтобы грабители не перепутали.' },
      { id: 'signs', name: 'Табличка', rect: [186, 14, 56, 12], look: '«Не слоняться!» Это про Уиззера. И немного про нас.' }
    ],
    actors: {
      bosco: {
        name: 'Боско', walk: [238, 182], face: 'e', pad: 10,
        look: 'Боско. Владелец «Магазина неудобств» и самый параноидальный человек к востоку от Миссисипи. И к западу тоже.',
        talk: function* (g) {
          if (g.f.samHypno) { yield g.say('sam', 'Кассеты для Боско. Смотрите Ай-Бо.'); yield g.say('bosco', 'Сэм? Ты в порядке? У тебя глаза как у моего телевизора.'); return; }
          yield g.talkTo('bosco');
        },
        items: {
          cash: function* (g) {
            if (g.f.launcherBought) { yield g.say('bosco', 'Второго нет. Он был один.'); return; }
            yield g.say('sam', 'Боско, вот десять тысяч. Гранатомёт, пожалуйста.');
            yield g.say('bosco', 'Десять тысяч... Раз, два... мелкими купюрами... пахнут банком. Ладно, не моё дело.');
            g.sfx('cash');
            g.drop('cash');
            g.f.launcherBought = true;
            g.give('launcher');
            yield g.say('bosco', 'Держи. Предохранителя нет. Как и у тебя.');
          },
          diagram: function* (g) {
            yield g.say('bosco', 'Схема шлема! «Вестник практической психиатрии»... Так, дуршлаг есть, фольга есть...');
            g.drop('diagram');
            g.f.diagramGiven = true;
            yield g.say('bosco', 'А вот антенны нет. Нужно что-то длинное, металлическое, гибкое. Ловить волну.');
            if (g.has('hanger')) yield g.say('sam', 'Плечики подойдут? Гибкие, как моя мораль.');
          },
          hanger: function* (g) {
            if (!g.f.diagramGiven) { yield g.say('bosco', 'Плечики? Зачем? Сначала скажи, что строим.'); return; }
            g.drop('hanger');
            g.f.hangerTaken = true;
            yield g.say('bosco', 'То что надо! Сейчас, минутку...');
            g.actors.bosco.act = 'build'; g.actors.bosco.keepAct = true;
            g.sfx('zap');
            yield 1.4;
            g.sfx('zap');
            yield 1.0;
            g.actors.bosco.act = ''; g.actors.bosco.keepAct = false;
            g.give('helmet');
            g.f.helmetDone = true;
            yield g.say('bosco', 'Готово! Антигипнотический шлем модели «Боско-1». Бесплатно. Ты же избавил меня от Уиззера.');
            yield g.say('bosco', 'Одно но. Антенна ещё и передаёт. Что скажешь в шлеме, услышат на той же волне. Так что без глупостей.');
            yield g.say('sam', 'Я никогда не говорю глупостей.');
            yield g.say('bosco', 'Ага.');
          },
          tapes: function* (g) { yield* deliverTapes(g); },
          gun: function* (g) { yield g.say('bosco', 'Опусти пушку, Сэм. У меня под прилавком три таких же.'); },
          launcher: 'Стрелять в продавца из его же гранатомёта? Слишком иронично даже для меня.',
          cheese: function* (g) { yield g.say('bosco', 'Хочешь купить? Два миллиона. Он выдержанный. Я выдерживаю его с семьдесят четвёртого года.'); },
          max: function* (g) { yield g.say('max', 'Боско, продай мне что-нибудь взрывоопасное!'); yield g.say('bosco', 'Кроликам только за наличные. И с запиской от родителей.'); }
        }
      },
      whizzer: {
        name: 'Уиззер', dist: 24,
        when: g => g.actors.whizzer.visible && g.actors.whizzer.act !== 'ko',
        look: g => g.f.whizzerCured ? 'Уиззер. Гипноз прошёл, а привычка переминаться с ноги на ногу осталась.' : 'Уиззер из «Сода-Попперов». Скрестил ноги так, что хочется вызвать ему сантехника.',
        talk: function* (g) {
          if (g.f.whizzerCured) { yield g.talkTo('whizzerOk'); return; }
          yield g.say('whizzer', 'Смотрите в глаза... Ой, мне надо в туалет... Смотрите в глаза...');
          yield g.talkTo('whizzer');
        },
        items: {
          cheese: 'Если сунуть сыр ему в корзинку, он заметит. Надо, чтобы он её поставил.',
          glove: g => (g.f.knowCure ? 'Он всё время подпрыгивает. Промахнусь и выбью зуб Боско. Пусть его лучше стукнет что-нибудь другое.' : 'За что? Он просто хочет в туалет.'),
          gun: 'Нет. Бедняга и так страдает.',
          max: function* (g) { yield g.say('max', 'Можно я его укушу? Чуть-чуть?'); yield g.say('sam', 'Нет, Макс.'); }
        }
      }
    },
    setup(g) {
      const wz = g.actors.whizzer;
      if (wz.room === 'bosco' && !g.f.maxInToilet) {
        wz.scripted = false; wz.visible = true;
        if (!g.f.whizzerCured) { wz.v = ''; wz.act = ''; wz.keepAct = false; }
      }
      g.f.punchT = 0;
    },
    ambient: function* (g) {
      const spots = [[96, 160], [150, 166], [120, 176], [180, 158], [80, 172]];
      let i = 0;
      for (;;) {
        yield 3 + g.rng.next() * 4;
        const wz = g.actors.whizzer;
        if (wz.room !== 'bosco' || wz.scripted || g.busy || g.f.basketDown || g.dialog) continue;
        i = (i + 1 + g.rng.int(3)) % spots.length;
        g.walkTo('whizzer', spots[i][0], spots[i][1]);
      }
    },
    onLoad(g) { ROOMS.bosco.setup(g); }
  };

  function* deliverTapes(g) {
    if (!g.has('tapes')) return;
    yield g.say('sam', 'Кассеты для Боско. Смотрите Ай-Бо. Хорошего дня.');
    g.drop('tapes');
    g.f.tapesDelivered = true;
    if (!g.seen.boscoHypno) {
      g.seen.boscoHypno = 1;
      yield g.say('bosco', 'Сэм? Ты какой-то... стеклянный. И где Макс?');
      yield g.say('sam', 'Макс у Мастера. Мастеру нужен кролик. Мне нужно доставлять кассеты.');
      yield g.say('bosco', 'Ладно... Я ничего не видел. У меня принцип: ничего не видеть. Кроме всего.');
    } else yield g.say('bosco', 'Спасибо... наверное.');
  }

  ROOMS.bosco.hot.push({ id: 'basket', name: 'Корзинка Уиззера', rect: [104, 148, 28, 20], when: g => g.f.basketDown, walk: [136, 170], face: 'w',
    look: g => g.f.cheeseInBasket ? 'Корзинка Уиззера. Теперь в ней сыр. Неоплаченный.' : 'Корзинка Уиззера. Пустая.',
    use: 'Брать чужую корзинку я не буду. А вот положить в неё что-нибудь можно.',
    items: {
      cheese: function* (g) {
        if (g.f.cheeseInBasket) return;
        yield g.anim('sam', 'reach', 0.5);
        g.drop('cheese');
        g.f.cheeseInBasket = true;
        yield g.say('sam', 'Подарок от заведения.');
        yield g.say('bosco', 'Эй... А впрочем, я ничего не видел.');
      }
    } });

  S.punch = punch;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
