(function (S) {
  'use strict';
  const E = S.EP105;
  const { ROOMS, TALK } = E;

  const who = g => (g.f.vr ? 'elf' : 'bosco');

  function* pitch(g, elfish) {
    const b = who(g);
    yield g.say(b, elfish ? 'Для взрослых дел у меня припасён товар в скучном мире. Простуда «Боско-Тех».' : 'Простуда «Боско-Тех». Моя собственная. Три года не лечил, берёг.');
    yield g.say(b, 'Чихнул на кассу, и касса до сих пор думает, что на дворе семьдесят четвёртый год. От неё сляжет любая машина.');
    yield g.say('sam', 'Любая? И та, на которой держится Реальность 2.0?');
    yield g.say(b, 'Я сказал «любая». Один миллиард долларов.');
    yield g.say('sam', 'Сыворотка правды стоила сто миллионов.');
    yield g.say(b, elfish ? 'Инфляция, путник. И насморк редкий.' : 'Инфляция, Сэм. И насморк редкий.');
    g.f.knowCold = true;
  }

  function* payInfo(g, elfish) {
    const b = who(g);
    yield g.say(b, 'Только переводом. Наличные у меня отнимут. А в Интернете деньги никто не найдёт. Я сам их там нахожу с трудом.');
    yield g.say(b, 'Банк называется bancolavadero.com. Счёт на моё имя.');
    g.f.knowBank = true;
    yield g.say('max', 'Миллиард у меня есть! В казне! Кажется!');
    yield g.say('sam', elfish ? 'Казна лежит в банке, Макс. Банк лежит в очках.' : 'Казна лежит в банке, Макс. А банк теперь где-то в очках.');
  }

  function* passInfo(g, elfish) {
    const b = who(g);
    yield g.say(b, elfish ? 'Хитро, путник! Пароль я не скажу. Я его и сам не помню.' : 'Ещё чего! Пароль я не скажу. Я его и сам не помню.');
    yield g.say(b, 'Он наколот там, где его никто не прочтёт. Даже я. Для этого нужно два зеркала, а второе у меня украли.');
    g.f.knowTattoo = true;
  }

  function* buySword(g) {
    const n = E.coinCount(g);
    const b = who(g);
    if (n < 5) {
      yield g.say(b, 'Пять золотых. У тебя ' + (n === 0 ? 'ни одного' : n === 1 ? 'один' : n === 3 ? 'три' : n === 4 ? 'четыре' : 'два') + '.');
      yield g.say(b, 'Золото в этом мире валяется где попало. Висит в воздухе, лежит по чужим кладовкам и норам. Нагнись и возьми.');
      return;
    }
    const a = g.actors.elf;
    a.act = 'give'; a.actT = 1.2;
    g.sfx('cash');
    g.drop('coins');
    g.f.swordBought = true;
    g.give('sword');
    yield g.say(b, 'Пять золотых! Держи. Деревянный длинный меч неимоверной длины. Осторожнее в дверях.');
    yield g.say('sam', 'Он деревянный.');
    yield g.say(b, 'Зато длинный. За железный берут настоящими.');
  }

  TALK.elf = {
    start: function* (g) {
      if (g.f.vr) {
        g.f.elfMet = true;
        if (!g.seen.elfVr) {
          g.seen.elfVr = 1;
          yield g.say('elf', 'Приветствую, путники! Вы в таверне Эльбоскодрила Неуловимого, полуэльфа сорокового уровня!');
          yield g.say('max', 'Сэм, у него уши длиннее моих. Я требую пересчёта!');
        } else yield g.say('elf', 'Снова вы, путники. Говорите.');
        return;
      }
      if (!g.seen.elfReal) {
        g.seen.elfReal = 1;
        yield g.say('bosco', 'Приветствую, путники! Я Эльбоскодрил Неуловимый, полуэльф сорокового уровня!');
        yield g.say('sam', 'Боско, ты стоишь за прилавком в очках и с накладными ушами.');
        yield g.say('bosco', 'Тсс! Не выдавай. Эльфов не грабят. Третий день стою, и ни одного налёта.');
      } else yield g.say('bosco', 'Говори, путник. Только тихо. Я в засаде.');
    },
    options: g => [
      { id: 'who', icon: 'elfear5', text: 'Зачем тебе всё это?', run: function* (gg) {
        yield gg.say(who(gg), 'В том мире меня грабили каждый вторник. Здесь у меня сорок уровней и лук.');
        yield gg.say(who(gg), 'Сюда ещё ни один грабитель не дошёл. Они все вязнут в слизи на первом уровне.');
      } },
      { id: 'sell', icon: 'potion5', text: 'Чем торгуешь?', run: function* (gg) {
        if (gg.f.vr && !gg.f.swordBought) yield gg.say('elf', 'Мечи, путник! Деревянный длинный меч неимоверной длины. Пять золотых.');
        if (gg.f.coldGot) { yield gg.say(who(gg), 'Простуду ты уже унёс. Новая будет к зиме.'); return; }
        if (gg.f.knowCold) { yield gg.say(who(gg), 'Простуда «Боско-Тех» всё ещё ждёт. Миллиард, и она твоя.'); return; }
        yield* pitch(gg, true);
      } },
      { id: 'pay', icon: 'bank5', text: 'Как тебе заплатить миллиард?', when: gg => gg.f.knowCold && !gg.f.paid, run: function* (gg) { yield* payInfo(gg, true); } },
      { id: 'pass', icon: 'lock5', text: 'Какой пароль у твоего счёта?', when: gg => gg.f.knowBank && !gg.f.passKnown, run: function* (gg) { yield* passInfo(gg, true); } },
      { id: 'buy', icon: 'woodsword5', text: 'Мы берём меч.', when: gg => gg.f.vr && !gg.f.swordBought, run: function* (gg) { yield* buySword(gg); } },
      { id: 'behind', icon: 'behind5', text: 'Боско, сзади!', when: gg => !gg.f.vr && gg.f.knowTattoo, run: function* (gg) {
        yield gg.say('bosco', 'Старый трюк, путник. В этом мире у меня глаза на затылке. Умение сорокового уровня.');
        yield gg.say('sam', 'Глаза на затылке. У настоящего Боско на затылке была только шапочка.');
      } },
      { id: 'bye', icon: 'bye', text: 'Бывай, Эльбоскодрил.', end: true, run: function* (gg) {
        yield gg.say(who(gg), 'Лёгкой дороги, путники. И смотрите под ноги, там слизь.');
      } }
    ]
  };

  TALK.elfbot = {
    start: function* (g) { yield g.say('elf', 'БОТ. Хозяин вышел из игры. Торговля идёт по расписанию.'); },
    options: [
      { id: 'where', icon: 'f:elfbot', text: 'Где Эльбоскодрил?', run: function* (g) {
        yield g.say('elf', 'Пользователь получил удар по голове и покинул Реальность 2.0. Ищите его в скучном мире.');
      } },
      { id: 'sell', icon: 'potion5', text: 'Что продаёшь?', run: function* (g) {
        yield g.say('elf', 'Мечи проданы. Слизь бесплатно, у автомата. Прочее спрашивайте у хозяина.');
      } },
      { id: 'bye', icon: 'bye', text: 'Пока, бот.', end: true, run: function* (g) { yield g.say('elf', 'Спасибо за покупку, которой не было.'); } }
    ]
  };

  function* lookBehind(g) {
    const b = g.actors.bosco;
    yield g.say('sam', 'Боско, сзади!');
    g.sfx('sting');
    b.act = 'turn'; b.keepAct = true;
    g.vt.turnT = g.time + 9;
    yield g.say('bosco', g.count('behind') > 1 ? 'ОПЯТЬ?! Где?!' : 'ГДЕ?!');
  }

  function* handOver(g) {
    const b = g.actors.bosco;
    yield g.say('bosco', 'Сэм! Мне пришло уведомление! Миллиард! На мой счёт! Кто знал пароль?!');
    yield g.say('sam', 'Ты носишь его на затылке, Боско.');
    yield g.say('bosco', 'Сменю. И пароль, и затылок. Но сделка есть сделка.');
    b.act = 'sneeze'; b.keepAct = true;
    g.sfx('spray');
    yield g.say('bosco', 'А-А-АПЧХИ!');
    b.act = 'give'; b.keepAct = false; b.actT = 1.2;
    g.f.coldGot = true;
    g.give('hanky');
    yield g.say('bosco', 'Свежая. Неси в платке и не дыши на телевизор.');
    yield g.say('max', 'Сэм, мы купили чих за миллиард! Я горжусь этой страной!');
  }

  TALK.bosco5 = {
    start: function* (g) {
      if (g.f.paid && !g.f.coldGot) { yield* handOver(g); return; }
      if (!g.seen.bosco5) {
        g.seen.bosco5 = 1;
        yield g.say('bosco', 'Сорок второй уровень, Сэм! Мне оставалось чуть-чуть до плаща! Кто-то стукнул меня палкой, и я вылетел!');
        yield g.say('sam', 'Жестокий мир.');
        yield g.say('bosco', 'Который из двух?');
      } else yield g.say('bosco', 'Чего тебе, Сэм? Я в трауре по плащу.');
    },
    options: [
      { id: 'back', icon: 'vrgoggles5', text: 'Почему ты не наденешь очки снова?', run: function* (g) {
        yield g.say('bosco', 'Надевал. Пишут: «Персонаж занят». Там стоит моя копия и торгует без меня!');
        yield g.say('bosco', 'Меня ограбили на самого себя, Сэм. Такого со мной ещё не делали.');
      } },
      { id: 'sell', icon: 'snotrag5', text: 'Что у тебя на продажу?', run: function* (g) {
        if (g.f.coldGot) { yield g.say('bosco', 'Простуду ты забрал. Новая будет к зиме, если повезёт с погодой.'); return; }
        if (g.f.knowCold) { yield g.say('bosco', 'Простуда «Боско-Тех». Миллиард. Цена та же, насморк только крепчает.'); return; }
        yield* pitch(g, false);
      } },
      { id: 'pay', icon: 'bank5', text: 'Как тебе заплатить миллиард?', when: g => g.f.knowCold && !g.f.paid, run: function* (g) { yield* payInfo(g, false); } },
      { id: 'pass', icon: 'lock5', text: 'Какой пароль у твоего счёта?', when: g => g.f.knowBank && !g.f.passKnown, run: function* (g) { yield* passInfo(g, false); } },
      { id: 'behind', icon: 'behind5', text: 'Боско, сзади!', say: false, end: true, run: function* (g) { g.endDialog(); yield* lookBehind(g); } },
      { id: 'bye', icon: 'bye', text: 'Держись, Боско.', end: true, run: function* (g) {
        yield g.say('bosco', g.f.coldGot ? 'Иди, Сэм. И платок мне не возвращай. Ни при каких обстоятельствах.' : 'Держусь. За прилавок. Он хотя бы настоящий.');
      } }
    ]
  };

  TALK.jimmy5 = {
    start: function* (g) {
      g.f.jimmyMet = true;
      if (!g.seen.jimmy5) {
        g.seen.jimmy5 = 1;
        yield g.say('jimmy', 'Подходи, начальник! Оружейный стол Джимми Два Зуба. Товар один, зато какой.');
      } else yield g.say('jimmy', 'Надумал, начальник?');
    },
    options: [
      { id: 'what', icon: 'cannon5', text: 'Что продаёшь?', run: function* (g) {
        yield g.say('jimmy', 'Пушку. Настоящую. Калибр редкий: ядро или одна крыса.');
        yield g.say('sam', 'Одна крыса?');
        yield g.say('jimmy', 'Мерил по себе. Так честнее.');
      } },
      { id: 'price', icon: 'money', text: 'Сколько хочешь?', run: function* (g) {
        yield g.say('jimmy', 'Тебе, как псу президента, миллион. Наличными.');
        yield g.say('max', 'Беру! Запиши на счёт государства!');
        yield g.say('jimmy', 'Государству в долг не даю. Я читаю газеты, я знаю, кто там главный.');
      } },
      { id: 'why', icon: 'q', text: 'Почему ты торгуешь у Боско?', run: function* (g) {
        yield g.say('jimmy', 'В норе житья нет. Из вашего телевизора весь день зовут в очки, под дверь суют коробки.');
        yield g.say('jimmy', 'А Боско сам в очках. Аренду не спрашивает, стол не считает.');
      } },
      { id: 'hat', icon: 'f:jimmy5', text: 'Зачем тебе каска?', run: function* (g) {
        yield g.say('jimmy', 'Ты видел, чем я торгую? Техника безопасности. Каску выдали на пруду, вместе с отпускными.');
      } },
      { id: 'vr', icon: 'vrgoggles5', text: 'А сам в очки не хочешь?', run: function* (g) {
        yield g.say('jimmy', 'Размера моего нет. Я узнавал.');
        yield g.say('jimmy', 'Был бы размер, только бы ты меня и видел.');
      } },
      { id: 'bye', icon: 'bye', text: 'Я подумаю.', end: true, run: function* (g) {
        yield g.say('jimmy', 'Думай. Только руками не трогай. Она заряжена.');
      } }
    ]
  };

  function* touchCannon(g) {
    const j = g.actors.jimmy, sam = g.actors.sam;
    if (g.vt.reload && g.time < g.vt.reload) { yield g.say('sam', 'Пушка пустая. Джимми катит к ней ядро и ругается на каждом обороте.'); return; }
    yield g.anim('sam', 'reach', 0.4);
    yield g.say('jimmy', 'Руки, начальник! Товар не лапать!');
    j.act = 'fire'; j.keepAct = true;
    yield 0.4;
    g.sfx('gun');
    g.vt.smoke = g.time;
    g.fx.shake = 0.6;
    g.fx.flash = 0.3;
    sam.act = 'ko'; sam.keepAct = true;
    g.sfx('clang');
    yield 1.1;
    sam.act = ''; sam.keepAct = false;
    yield g.say('sam', 'Ядро нашло мою шляпу. Дуршлаг под ней снова оправдал себя.');
    yield g.say('jimmy', 'Предупредительный! Следующий платный!');
    j.act = 'load';
    if (!g.seen.reloadHint) { g.seen.reloadHint = 1; yield g.say('max', 'Сэм, у тебя на шляпе вмятина в форме ядра! А он уже катит следующее!'); }
    g.vt.reload = g.time + 9;
  }

  function* grabJimmy(g) {
    if (!g.vt.reload) {
      yield g.say('sam', 'Хватать Джимми, пока он смотрит? Он кусается и помнит наизусть статью о задержании.');
      return;
    }
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('squeak');
    g.vt.reload = 0;
    g.place('jimmy', 'nowhere', 0, 0);
    g.actors.jimmy.act = ''; g.actors.jimmy.keepAct = false;
    g.f.cannonTaken = true;
    g.give('ratcannon');
    yield g.say('sam', 'Калибр подошёл. Джимми сам говорил, что мерил по себе.');
    yield g.say('jimmy', 'Эй! Это похищение! И порча товара! Товар теперь я!');
    yield g.say('bosco', g.f.boscoOut ? 'Я ничего не видел. У меня траур.' : 'Тише, смертные! Эльф слушает лес.');
  }

  function* takeBinoc(g) {
    const turned = !!g.vt.turnT;
    if (g.f.boscoOut && !turned) {
      yield g.say('bosco', 'Положи! Бинокль не продаётся. В него я слежу за теми, кто трогает бинокль.');
      return;
    }
    yield g.anim('sam', 'reach', 0.4);
    g.f.binocTaken = true;
    g.give('binoc');
    yield g.say('sam', turned ? 'Пока Боско смотрит назад, бинокль переезжает ко мне.' : 'Боско в очках и видит один эльфийский лес. Бинокль побудет у меня, пока хозяин не вернётся.');
  }

  function* readTattoo(g) {
    if (!g.vt.turnT) {
      yield g.say('sam', g.f.boscoOut ? 'В бинокль Боско такой же, только крупнее. Пароля на лбу он не носит.' : 'Уши накладные, в бинокль это видно. Клей тоже. Спиной эльф не поворачивается никогда.');
      return;
    }
    g.sfx('scan');
    yield g.say('sam', 'На затылке, под шапочкой, мелкая наколка: «ПАРОЛЬ: БОСКО».');
    g.f.passKnown = true;
    yield g.say('max', 'Он наколол пароль и подписал, что это пароль! Сэм, я хочу такого министра финансов!');
  }

  const POTIONS = [
    'Зелья на прилавке. Зелёное подписано «Здоровье». Розовое подписано «Тоже здоровье, но дороже».',
    'Голубое зелье называется «Мана». Оранжевое называется «Кетчуп». Оно тут самое честное.',
    'На фиолетовом ценник без названия. Мелко дописано: «Узнаешь, когда выпьешь».',
    'Я пересмотрел все зелья. Лучше они не стали.'
  ];

  ROOMS.bosco = {
    id: 'bosco', name: 'Таверна Эльбоскодрила', w: 320, music: 'tavern',
    paint: b => S.BG.bosco(b),
    walk: [[8, 136, 212, 136, 232, 176, 312, 176, 312, 198, 8, 198]],
    block: [[44, 138, 96, 138, 96, 152, 44, 152]],
    layers: [
      { id: 'glovearm', x: 46, y: 18 },
      { id: 'codes', x: 250, y: 28 },
      { id: 'dish', x: 166, y: 52, base: 125 },
      { id: 'sludgie', x: 100, y: 78, base: 137, key: g => Math.floor(g.time * 2) % 2 },
      { id: 'table', x: 44, y: 118, base: 150 },
      { id: 'cannon', x: 48, y: 104, base: 151, when: g => !g.f.cannonTaken, key: g => (g.vt.smoke && g.time - g.vt.smoke < 0.6 ? 's' : '') },
      { id: 'balls', x: 74, y: 116, base: 152 },
      { id: 'counter', x: 216, y: 110, base: 172 },
      { id: 'weenies', x: 218, y: 98, base: 173, key: g => Math.floor(g.time * 2) % 2 },
      { id: 'binoc', x: 250, y: 116, base: 174, when: g => !g.f.binocTaken }
    ],
    hot: [
      { id: 'exit', name: 'Выход на улицу', rect: [4, 30, 40, 110], walk: [30, 170], face: 'w',
        look: 'Дверь на улицу. У косяка прислонён деревянный щит с надписью «Реквизит. Не выносить».',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street', { x: 604, y: 146, dir: 's' }); } },
      { id: 'antivor', name: 'Антивор-О-Мат', rect: [40, 4, 56, 14],
        look: 'Антивор-О-Мат. Перчатку на пружине Боско перекрасил в зелёный. Бьёт она по-прежнему.',
        use: function* (g) { yield g.say('bosco', g.f.boscoOut ? 'Не трогать! Он на взводе, я тоже.' : 'Не тронь ловушку, путник! Она четвёртого уровня.'); } },
      { id: 'shelves', name: 'Полки', rect: [56, 28, 78, 76], walk: [96, 140], face: 'n',
        look: ['«Уши эльфийские, пара. Клей в комплекте».', '«Свиток „Как не быть ограбленным“. Пустой. Так и задумано».', '«Лембас. Он же галета, срок годности вышел при Никсоне».', '«Кольчуга из скрепок. Размер один».'],
        use: 'На полках всё учтено. Боско ведёт опись даже в очках, вслепую.' },
      { id: 'sludgie', name: 'Автомат со льдом', rect: [100, 78, 28, 58], walk: [116, 140], face: 'n',
        look: 'Автомат «Лёд». Два бака: зелёный и оранжевый. Вкусы подписаны так же: «зелёный» и «оранжевый».',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.4);
          g.sfx('slurp');
          yield g.say('max', 'Мне! Мне! А-а-а! Мозг замёрз! Сэм, я вижу цвета, которых нет!');
          yield g.say('sam', 'Один стакан льда, и президент недееспособен. Запишу для конгресса.');
        },
        items: { sword: 'В настоящем мире у меня нет меча. Есть только лёд со вкусом «зелёный».' } },
      { id: 'wc', name: 'Туалет', rect: [136, 30, 36, 82], walk: [154, 136], face: 'n',
        look: 'Туалет. На двери мелом: «Портал. Только для эльфов».',
        use: 'Я не эльф. И портал занят, оттуда слышно журчание.' },
      { id: 'dish', name: 'Тарелка на бочке', rect: [168, 58, 34, 38], walk: [186, 140], face: 'n',
        look: 'Спутниковая тарелка на бочке. Раньше она сбивала ракеты. Теперь ловит Реальность 2.0, и лампочка у неё зелёная.',
        use: function* (g) { yield g.say('bosco', g.f.boscoOut ? 'Не верти! Собьёшь настройку, и я останусь без сорока уровней. А, я и так без них.' : 'Не верти, путник! Через неё мне приходит мана.'); } },
      { id: 'barrel', name: 'Бочка', rect: [172, 98, 22, 26], walk: [182, 140], face: 'n',
        look: 'Бочка. В ней квасилась капуста. Теперь на боку написано «Эль».',
        use: 'Крышку не трону. Капуста, которая считает себя элем, опасна вдвойне.' },
      { id: 'table', name: 'Столик Джимми', rect: [44, 124, 52, 26], walk: [110, 152], face: 'w',
        look: g => g.f.cannonTaken ? 'Столик Джимми. Пушки нет, ядра остались. Продавца тоже нет.' : 'Столик у двери. На нём пушка, горка ядер и крыса в каске.',
        use: 'Столик шатается. Торговать оружием на таком может только тот, кто весит сто грамм.' },
      { id: 'cannon', name: 'Пушка', rect: [48, 104, 40, 22], walk: [110, 152], face: 'w', over: true, when: g => !g.f.cannonTaken,
        look: 'Пушка. Чугун, латунные кольца, фитиль. Длиной с мою ладонь. Дуло смотрит на прилавок.',
        use: function* (g) { yield* touchCannon(g); },
        items: {
          gun: 'Стрелять в пушку? Она ответит, и у неё калибр больше.',
          glove: function* (g) { yield g.say('jimmy', 'Убери перчатку от товара! Поцарапаешь, купишь!'); }
        } },
      { id: 'balls', name: 'Ядра', rect: [74, 114, 16, 12], walk: [110, 152], face: 'w', over: true,
        look: 'Три чугунных ядра размером с горошину. На каждом выбито: «Дж. 2 З.»',
        use: g => g.has('ratcannon') ? 'Ядра мне ни к чему. Пушка у меня, и она заряжена живым.' : g.f.cannonTaken ? 'Ядра остались без пушки и без продавца. Торговля закрыта.' : 'Ядра считаны. Джимми знает каждое в лицо.' },
      { id: 'weenies', name: 'Горячие сосиски', rect: [218, 98, 30, 26], walk: [224, 184], face: 'n', over: true,
        look: 'Сосиски на роликах. Вращаются с мелового периода. В очках Боско, наверное, видит на их месте жаркое.',
        use: 'Есть это я не стану. Они старше моего значка.',
        items: { max: function* (g) { yield g.say('max', 'Нет. Я ем всё, но эти сосиски помнят динозавров, и динозавры их не тронули.'); } } },
      { id: 'binoc', name: 'Бинокль', rect: [250, 116, 14, 10], walk: [240, 184], face: 'n', over: true, when: g => !g.f.binocTaken,
        look: 'Бинокль на прилавке. В него Боско высматривает грабителей, налоговую и меня.',
        use: function* (g) { yield* takeBinoc(g); } },
      { id: 'register', name: 'Касса', rect: [272, 110, 34, 16], walk: [250, 182], face: 'e',
        look: 'Касса. В окошке светится «1974». Боско говорит, что чихнул на неё три года назад.',
        use: function* (g) { yield g.say('bosco', g.f.boscoOut ? 'Кассу не трогать. Она болеет.' : 'Сундук с сокровищами не трогать, путник!'); } },
      { id: 'codes', name: 'Табличка «Читы»', rect: [250, 28, 34, 16], walk: [244, 184], face: 'n',
        look: '«Читы 2.0». Мелко: «Спрашивать у эльфа. Эльф не знает».' },
      { id: 'safe', name: 'Сейф', rect: [286, 36, 26, 24],
        look: 'Сейф «SAFE». Поверх прошлой меловой надписи «SEIF» теперь выведено «СУНДУК».' },
      { id: 'signs', name: 'Табличка', rect: [96, 1, 92, 11], look: '«Торг неуместен». Ниже приписано: «Торг с эльфом неуместен вдвойне».' }
    ],
    actors: {
      bosco: {
        name: g => (g.f.boscoOut ? 'Боско' : 'Эльбоскодрил'), walk: [238, 182], face: 'e', pad: 10,
        look: g => g.vt.turnT ? 'Боско стоит ко мне спиной и ищет грабителя. На затылке у него что-то наколото. Буквы мелкие, отсюда не разобрать.' : g.f.boscoOut ? 'Боско без очков. Уши он так и не снял. Злой, как эльф, у которого отняли плащ.' : 'Боско в очках и с накладными ушами. За спиной лук. Кланяется пустому месту у двери.',
        talk: function* (g) {
          if (g.vt.turnT) { yield g.say('sam', 'Он занят. Ищет у себя за спиной того, кого я выдумал.'); return; }
          yield g.talkTo(g.f.boscoOut ? 'bosco5' : 'elf');
        },
        use: function* (g) { yield g.say('bosco', g.f.boscoOut ? 'Не трогай меня, Сэм. С меня хватит палки.' : 'Руки, путник! У меня лук.'); },
        items: {
          binoc: function* (g) { yield* readTattoo(g); },
          glove: function* (g) {
            if (g.f.boscoOut) { yield g.say('bosco', 'Убери перчатку. Я в своём уме. Спроси кого хочешь, кроме меня.'); return; }
            yield g.say('bosco', 'Гипноз? На мне? Я сам их надел, путник! Там меня ещё ни разу не ограбили!');
            yield g.say('sam', 'Перчатка лечит гипноз. От доброй воли она не помогает.');
          },
          ratcannon: function* (g) { yield g.say('jimmy', 'В Боско не полечу! Он мне стол сдаёт!'); },
          gun: function* (g) { yield g.say('bosco', g.f.boscoOut ? 'Убери пушку, Сэм. Без очков я вижу всё, и пушку тоже.' : 'Лук у меня длиннее, путник.'); },
          roach: function* (g) { yield* E.bugPlant(g, 'bosco', g.f.boscoOut ? 'boscoout' : 'bosco'); },
          hanky: function* (g) { yield g.say('bosco', 'Убери! Товар возврату не подлежит. Этот тем более.'); },
          chip: function* (g) { yield g.say('bosco', g.f.boscoOut ? 'Микросхема? От очков? Дай сюда! Нет. Не дам себе. Хватит.' : 'Артефакт! Оставь себе, путник, он проклят.'); },
          max: function* (g) { yield g.say('max', 'Боско, продай мне уши!'); yield g.say('bosco', g.f.boscoOut ? 'Уши не продаются. Это всё, что у меня осталось от эльфа.' : 'Уши растут сами, путник. На сороковом уровне.'); }
        }
      },
      jimmy: {
        name: 'Джимми Два Зуба', walk: [110, 152], face: 'w', pad: 6,
        look: g => g.vt.reload ? 'Джимми тащит ядро к дулу и пыхтит. По сторонам не смотрит.' : 'Джимми Два Зуба в армейской каске. Каска ему велика и держится на ушах.',
        talk: function* (g) {
          if (g.vt.reload) { yield g.say('jimmy', 'Не под руку, начальник! Я заряжаю!'); return; }
          yield g.talkTo('jimmy5');
        },
        use: function* (g) { yield* grabJimmy(g); },
        items: {
          glove: function* (g) { yield g.say('jimmy', 'Бить крысу в каске? Каска казённая. Сядешь за порчу имущества.'); },
          gun: function* (g) { yield g.say('jimmy', 'Убери ствол, начальник. У меня калибр больше.'); },
          roach: function* (g) { yield* E.bugPlant(g, 'jimmy'); },
          max: function* (g) { yield g.say('max', 'Джимми! Продай пушку президенту в кредит!'); yield g.say('jimmy', 'Президенту только за наличные. Я видел твои указы.'); }
        }
      }
    },
    enter: function* (g) {
      if (!g.seen.bosco105) {
        g.seen.bosco105 = 1;
        yield g.say('max', 'Сэм, у Боско уши! И музыка как на ярмарке!');
        yield g.say('sam', 'В прошлый раз были усы и ушанка. Уши хотя бы свои напоминают.');
        return;
      }
      if (g.f.paid && !g.f.coldGot) yield* handOver(g);
    },
    update(g) {
      if (g.busy || g.dialog) return;
      const j = g.actors.jimmy, b = g.actors.bosco;
      if (g.vt.reload && g.time > g.vt.reload) {
        g.vt.reload = 0;
        j.act = ''; j.keepAct = false;
        g.say('jimmy', 'Заряжено. Кто ещё хочет потрогать?');
      }
      if (g.vt.turnT && g.time > g.vt.turnT) {
        g.vt.turnT = 0;
        b.act = ''; b.keepAct = false;
        g.say('bosco', 'Никого. Не шути так, Сэм. У меня сердце и сигнализация.');
      }
    },
    setup(g) {
      const b = g.actors.bosco, j = g.actors.jimmy;
      g.vt.reload = 0; g.vt.turnT = 0;
      g.place('bosco', 'bosco', 250, 150, 's');
      b.act = ''; b.keepAct = false; b.visible = true;
      b.v = g.f.boscoOut ? '' : 'vr';
      if (g.f.cannonTaken) { if (j.room === 'bosco') g.place('jimmy', 'nowhere', 0, 0); return; }
      g.place('jimmy', 'bosco', 60, 123, 'e');
      j.act = ''; j.keepAct = false; j.visible = true; j.v = ''; j.z = 27.5;
    },
    onLoad(g) { ROOMS.bosco.setup(g); }
  };

  function* spawnSlime(g) {
    const s = g.actors.slime;
    if (g.vt.slime) { yield g.say('sam', 'Одна слизь уже сидит на круге. Автомат выдаёт по одной в руки.'); return; }
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('slurp');
    yield 0.4;
    g.sfx('splat');
    g.place('slime', 'bosco2', 70, 153, 'e');
    s.visible = true; s.act = ''; s.v = '';
    g.vt.slime = true;
    if (!g.seen.slime) {
      g.seen.slime = 1;
      yield g.say('sam', 'Из крана лезет синее, шлёпается на круг и открывает глаза.');
      yield g.say('max', 'Оно живое и злое! Сэм, можно я его оставлю?');
    } else yield g.say('sam', 'Ещё одна слизь. Свежая, с конвейера.');
  }

  function* hitElf(g, item) {
    const a = g.actors.elf;
    if (g.f.boscoOut) { yield g.say('sam', 'Бить бота незачем. Хозяина в нём уже нет.'); return; }
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('whack');
    a.act = 'hit'; a.keepAct = true;
    yield g.say('elf', 'Ай! Урон девять! По своим?! Я вылета-а-а...');
    g.sfx('zap');
    g.fx.flash = 0.5;
    a.act = ''; a.keepAct = false;
    a.v = 'bot';
    g.f.boscoOut = true;
    g.actors.bosco.v = '';
    yield E.net(g, 'Пользователь Эльбоскодрил покинул Реальность 2.0. Причина: удар по голове. За прилавком его заменит бот.');
    yield g.say('sam', item === 'sword2' ? 'Прости, Боско. Меч +2 не спрашивает, какой у тебя уровень.' : 'Прости, Боско. Сорок уровней, и все слетели от одной деревяшки.');
  }

  const battle = function* (g) { yield* E.startBattle(g, 'slime'); };

  ROOMS.bosco2 = {
    id: 'bosco2', name: 'Таверна Эльбоскодрила 2.0', w: 320, music: 'tavern',
    paint: b => S.BG.virt((S.BG.bosco(b), b)),
    walk: [[8, 136, 212, 136, 232, 176, 312, 176, 312, 198, 8, 198]],
    layers: [
      { id: 'glovearm', x: 46, y: 18 },
      { id: 'rack', x: 252, y: 26 },
      { id: 'spawn', x: 46, y: 46, key: g => Math.floor(g.time * 2) % 2 },
      { id: 'pad', x: 48, y: 140, key: g => Math.floor(g.time * 4) % 3 },
      { id: 'sludgie', x: 100, y: 78, base: 137, key: g => Math.floor(g.time * 2) % 2 },
      { id: 'counter', x: 216, y: 110, base: 172 },
      { id: 'potions', x: 222, y: 106, base: 173 }
    ],
    hot: [
      { id: 'exit', name: 'Выход на улицу', rect: [4, 30, 40, 110], walk: [30, 170], face: 'w',
        look: 'Дверь на улицу 2.0. Стекло розовое. Сквозь него всё выглядит лучше, чем есть.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street2', { x: 604, y: 146, dir: 's' }); } },
      { id: 'antivor', name: 'Антивор-О-Мат 2.0', rect: [40, 4, 56, 14],
        look: 'Антивор-О-Мат в версии 2.0. Перчатка золотая. Здесь она, наверное, +3.',
        use: 'Не трону. Перчатка +3 против шляпы +0.' },
      { id: 'spawn', name: 'Табличка', rect: [46, 46, 74, 12], walk: [84, 150], face: 'n',
        look: '«Возрождение». Стрелка показывает на круг в полу. Здесь появляется то, что победили. Снова и снова.' },
      { id: 'pad', name: 'Круг возрождения', rect: [48, 140, 44, 14], walk: [104, 156], face: 'w',
        look: g => g.vt.slime ? 'Круг возрождения. На нём сидит слизь и смотрит на меня.' : 'Светящийся круг в полу. Пусто. Слизь привозят по требованию.',
        use: 'На круге ничего не происходит. Я, видимо, ещё ни разу не был побеждён.' },
      { id: 'shelves', name: 'Полки', rect: [56, 28, 78, 48], walk: [96, 140], face: 'n',
        look: ['Полки 2.0. Те же банки, только на каждой висит цифра. «Консервы +1». «Консервы +1». «Консервы, проклятые».', 'На нижней полке «Лембас +0». Честная цифра.'],
        use: 'Брать с полки бесполезно. Товар нарисован вместе с полкой.' },
      { id: 'sludgie', name: 'Автомат со слизью', rect: [100, 78, 28, 58], walk: [116, 140], face: 'n',
        look: 'Автомат со льдом в версии 2.0. На нём написано «Слизь». Баки голубой и розовый. Под краном кнопка.',
        use: function* (g) { yield* spawnSlime(g); },
        items: { sword: function* (g) { yield g.say('sam', 'Рубить автомат незачем. Он тут единственный, кто честно работает.'); } } },
      { id: 'wc', name: 'Дверь', rect: [136, 30, 36, 82], walk: [154, 136], face: 'n',
        look: 'Розовая дверь с табличкой «Выход из игры». Ручка нарисована.',
        use: 'Ручка не берётся в лапу. Этим выходом ещё не пользовались.' },
      { id: 'barrel', name: 'Бочка эля', rect: [172, 92, 22, 30], walk: [182, 140], face: 'n',
        look: 'Бочка эля. Сиреневая. У нас в ней капуста, но тут, похоже, и правда эль.',
        use: 'Нарисованный эль не пьют. От него нарисованное похмелье.' },
      { id: 'potions', name: 'Зелья', rect: [222, 106, 40, 18], walk: [224, 184], face: 'n', over: true,
        look: function* (g) { yield g.say('sam', POTIONS[Math.min(g.count('potions') - 1, POTIONS.length - 1)]); },
        use: function* (g) { yield g.say('elf', g.f.boscoOut ? 'БОТ. Зелья отпускаются только хозяином.' : 'Зелья не трогать, путник! Сначала уровень, потом зелья.'); } },
      { id: 'rack', name: 'Стойка с мечами', rect: [252, 26, 30, 40], walk: [244, 184], face: 'n',
        look: g => g.f.swordBought ? 'Стойка с мечами. Средний я купил. Два других оказались нарисованы на стойке.' : 'Стойка с мечами. Три меча и цифра «+0». Средний деревянный и длиннее остальных раза в два.',
        use: function* (g) {
          if (g.f.swordBought) { yield g.say('sam', 'Остальные мечи нарисованы. Я проверил лапой.'); return; }
          yield g.say('elf', 'Сперва золото, путник! Пять монет.');
        } },
      { id: 'register', name: 'Сундук', rect: [272, 110, 34, 16], walk: [250, 182], face: 'e',
        look: 'Касса в версии 2.0 стала сундуком. В окошке по-прежнему «1974».',
        use: function* (g) { yield g.say('elf', g.f.boscoOut ? 'БОТ. Сундук закрыт.' : 'Сундук не трогать! В нём мои сорок уровней.'); } },
      { id: 'safe', name: 'Сейф 2.0', rect: [286, 36, 26, 24], look: 'Сейф. Оранжевый, с надписью «SAFE». Единственная вещь, которая в обоих мирах называется одинаково.' },
      { id: 'signs', name: 'Табличка', rect: [96, 1, 92, 11], look: '«Торг неуместен». В версии 2.0 табличка светится, чтобы было неуместнее.' }
    ],
    actors: {
      elf: {
        name: g => (g.f.boscoOut ? 'Бот Эльбоскодрила' : 'Эльбоскодрил'), walk: [238, 182], face: 'e', pad: 10,
        look: g => g.f.boscoOut ? 'Серая кукла с табличкой «БОТ». Стоит там, где стоял эльф, и мигает лампочкой.' : 'Боско в Реальности 2.0. Высокий, стройный, уши до потолка. Таким он себя и заказал.',
        talk: function* (g) { yield g.talkTo(g.f.boscoOut ? 'elfbot' : 'elf'); },
        use: function* (g) { yield g.say('elf', g.f.boscoOut ? 'БОТ. Руками не трогать.' : 'Руки, путник! Я неуловимый, меня нельзя трогать.'); },
        items: {
          sword: function* (g) { yield* hitElf(g, 'sword'); },
          sword2: function* (g) { yield* hitElf(g, 'sword2'); },
          coins: function* (g) { if (g.f.boscoOut) { yield g.say('elf', 'БОТ. Приём золота закрыт.'); return; } yield* buySword(g); },
          glove: function* (g) { yield g.say('sam', 'Перчатка +0. Эльф сорокового уровня её даже не заметил.'); },
          gun: function* (g) { g.sfx('laser'); yield g.say('elf', g.f.boscoOut ? 'БОТ. Луч отклонён.' : 'Мимо, путник! Уклонение у нас врождённое.'); },
          slime: function* (g) { yield g.say('elf', g.f.boscoOut ? 'БОТ. Слизь не принимается.' : 'Слизь не беру. У меня её полный автомат.'); },
          hanky: function* (g) { yield g.say('elf', g.f.boscoOut ? 'БОТ. Обнаружен насморк. Отойдите от прилавка.' : 'Спрячь! Это моё. Я его узнаю даже нарисованным.'); },
          roach: function* (g) { yield E.bug(g, 'Объект слишком ловкий, сэр! Не могу прицепиться, сэр!'); },
          max: function* (g) { yield g.say('max', 'Эльф, сколько уровней у президента?'); yield g.say('elf', g.f.boscoOut ? 'БОТ. Пользователь «Макс»: уровень 1.' : 'Первый, путник. Как у всех новичков.'); yield g.say('max', 'Я объявляю этому миру импичмент!'); }
        }
      },
      slime: {
        name: 'Грозная синяя слизь', walk: [108, 158], face: 'w', pad: 8, when: g => !!g.vt.slime,
        look: 'Синяя слизь. Смотрит исподлобья, хотя лба у неё нет. Над ней висит надпись «Уровень 1».',
        talk: function* (g) {
          g.sfx('splat');
          yield g.say('slime', 'Буль. Буль-буль.');
          yield g.say('sam', 'Это вызов на бой или приветствие. У них это одно слово.');
        },
        use: battle,
        items: { sword: battle, sword2: battle, glove: battle, gun: battle, max: battle, jack: battle, roach: battle,
          coins: 'Подкупить слизь? У неё нет карманов. У неё вообще ничего нет, кроме характера.',
          hanky: 'Простужать слизь незачем. Она и так выглядит как насморк.' }
      }
    },
    enter: function* (g) {
      if (!g.seen.bosco2) {
        g.seen.bosco2 = 1;
        yield g.say('sam', 'Лавка Боско в версии 2.0. Те же полки, только цвета как у леденца.');
        yield g.say('max', 'И за прилавком кто-то высокий и красивый. Сэм, это точно не Боско.');
      }
    },
    setup(g) {
      const a = g.actors.elf, s = g.actors.slime;
      g.place('elf', 'bosco2', 250, 150, 's');
      a.act = ''; a.keepAct = false; a.visible = true;
      a.v = g.f.boscoOut ? 'bot' : '';
      if (g.vt.slime) { g.place('slime', 'bosco2', 70, 153, 'e'); s.visible = true; }
      else g.place('slime', 'nowhere', 0, 0);
    },
    onLoad(g) { ROOMS.bosco2.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
