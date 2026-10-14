(function (S) {
  'use strict';
  const { COLORS } = S;
  const E = S.EP104;
  const { ROOMS, TALK } = E;

  const DESK = [194, 140, 328, 140, 328, 166, 194, 166];
  const GOVS = ['specs', 'peepers', 'whizzer'];
  const govsHere = g => g.f.elected && !g.f.war;
  const puppetUp = g => !g.f.puppetDown;

  function* meet(g) {
    const pr = g.actors.pres;
    g.hideUI = true;
    g.f.presMet = true;
    yield g.walkTo('sam', 150, 176);
    g.face('sam', 'e');
    pr.act = 'wave'; pr.actT = 2.4;
    yield g.say('pres', 'Сограждане! Добро пожаловать в самый овальный кабинет страны!');
    yield g.say('sam', 'Господин президент. Вольная полиция. Мы насчёт ваших законов.');
    yield g.say('pres', 'Законы! Обожаю. Утром подписал ещё четыре. Один, кажется, про вас.');
    yield g.say('max', 'Сэм, у него глаза как у Попперов. И улыбка как у капкана.');
    yield g.say('pres', 'Пёс и кролик. Вы, должно быть, переводчики! Именно таких я и заказывал.');
    yield g.say('sam', 'Так и есть, господин президент.');
    yield g.say('chuckles', 'Губернатор ещё в пути. Ждите. Руки держите при себе.');
    g.hideUI = false;
  }

  function* thrownOut(g) {
    const ch = g.actors.chuckles;
    yield g.say('sam', 'Посмотрим, что за стальной дверью.');
    yield g.walkTo('chuckles', 418, 150, { speed: 1.9 });
    g.face('chuckles', 'e');
    ch.act = 'grab'; ch.actT = 2;
    yield g.say('chuckles', 'Господа. Это Военная комната. В мирное время туда не ходят.');
    yield g.say('max', 'Мы только на кнопку посмотрим! Одним глазом!');
    yield g.say('chuckles', 'Провожу вас до газона. Лично.');
    g.sfx('whoosh');
    const first = !g.seen.thrown;
    g.seen.thrown = 1;
    g.f.knowEscort = true;
    yield* g.goRoom('lawn', { x: 330, y: 152, dir: 's' }, { from: 'oval' });
    if (first) {
      yield g.say('max', 'Он вынес нас за шкирку! Обоих! Одной рукой!');
      yield g.say('sam', 'Лично, как и обещал. Приятно иметь дело с человеком слова.');
    }
  }

  TALK.pres = {
    options: [
      { id: 'laws', icon: 'law', text: 'Зачем стране столько законов?', run: function* (g) {
        yield g.say('pres', 'Страна без законов как пудинг без миски. Растекается.');
        yield g.say('pres', 'Поэтому пудинг я тоже запретил.');
      } },
      { id: 'hyp', icon: 'eye', text: 'У вас крутятся глаза, господин президент.', run: function* (g) {
        yield g.say('pres', 'Это от усердия! Я смотрю на страну сразу в две стороны.');
        if (!g.f.chucklesOut) yield g.say('chuckles', 'Президент здоров. Следующий вопрос.');
        g.f.knowHypno = true;
      } },
      { id: 'guest', icon: 'f:whizzer', text: 'Кого вы ждёте?', run: function* (g) {
        if (g.f.chucklesOut) { yield g.say('pres', 'Губернатора! Он был тут. Потом его не стало. Так бывает с губернаторами.'); return; }
        if (g.f.whizzerIn) { yield g.say('pres', 'Губернатор уже здесь! Он говорит без остановки. Я всё это время киваю.'); return; }
        yield g.say('pres', 'Губернатора Западной Дакоты! Говорит он быстро. Я успеваю понять одни запятые.');
        yield g.say('pres', 'Поэтому вы. Он говорит, вы переводите, я подписываю.');
      } },
      { id: 'gun', icon: 'gun', text: 'Ты правда перепишешь мой пистолет?', speaker: 'max', run: function* (g) {
        yield g.say('pres', 'Каждый! С фамилией хозяина и его любимым цветом.');
        yield g.say('max', 'Сэм. Держи меня.');
        yield g.say('sam', 'Держу, Макс. Сзади стоит человек, который держит крепче.');
      } },
      { id: 'ready', icon: 'mic', text: 'Мы готовы переводить.', when: g => g.f.whizzerIn && !g.f.chucklesOut, end: true, run: function* (g) { g.endDialog(); yield* interpret(g); } },
      { id: 'alone', icon: 'q', text: 'Как вы себя чувствуете без Чаклза?', when: g => g.f.chucklesOut, run: function* (g) {
        yield g.say('pres', 'Превосходно! Сограждане! Сограж... дане. Превосх...');
        yield g.say('sam', 'Он заедает. Без Чаклза пластинку перевернуть некому.');
      } },
      { id: 'bye', icon: 'bye', text: 'Не будем отвлекать вас от страны.', end: true, run: function* (g) {
        yield g.say('pres', 'Отвлекайте! Страна справляется сама. Я проверял.');
      } }
    ]
  };

  TALK.chuckles4 = {
    start: function* (g) {
      if (g.seen.chuckles104) return;
      g.seen.chuckles104 = 1;
      yield g.say('chuckles', 'Вольная полиция. Говорите тише. Президент не любит громких псов.');
    },
    options: [
      { id: 'mob', icon: 'f:chuckles', text: 'Мы с вами встречались. В казино.', run: function* (g) {
        yield g.say('chuckles', 'Вы меня с кем-то путаете. Я на службе с понедельника.');
        yield g.say('sam', 'Голос тот же. Голова тогда была розовая и плюшевая.');
        yield g.say('chuckles', 'Головы меняются, господин переводчик. Костюм остаётся.');
      } },
      { id: 'job', icon: 'f:agentc', text: 'Чем занят начальник Секретной службы?', run: function* (g) {
        yield g.say('chuckles', 'Стою рядом. Подаю ручку. Смотрю, чтобы президент подписал то, что ему дали.');
        yield g.say('sam', 'А кто даёт?');
        yield g.say('chuckles', 'Служба. Мой позывной «Папа-Медведь». Агенты зовут меня так. Вам не советую.');
        g.f.knowPapa = true;
      } },
      { id: 'leave', icon: 'keyhole', text: 'Вы когда-нибудь отходите от президента?', run: function* (g) {
        yield g.say('chuckles', 'Нет. Обедает он при мне. Спит при мне. Умывается тоже при мне.');
        yield g.say('chuckles', 'Исключение одно. Если посторонний лезет в Военную комнату, я вывожу его сам.');
        g.f.knowEscort = true;
      } },
      { id: 'war', icon: 'missile', text: 'Что за стальной дверью?', run: function* (g) {
        yield g.say('chuckles', 'Военная комната. Карта, кнопка, ракеты. В мирное время заперта.');
        yield g.say('max', 'А война скоро?');
        yield g.say('chuckles', 'Войны нет. За этим я тоже слежу.');
      } },
      { id: 'critter', icon: 'paw', text: 'Почему вы так на меня смотрите?', speaker: 'max', run: function* (g) {
        yield g.say('chuckles', 'В этом кабинете раньше не было зверей. Кроме орла. Орёл бронзовый и молчит.');
        yield g.say('max', 'Я тоже умею молчать! Секунды три!');
      } },
      { id: 'bye', icon: 'bye', text: 'Не будем мешать службе.', end: true, run: function* (g) {
        yield g.say('chuckles', 'Правильно.');
      } }
    ]
  };

  TALK.whizzer4 = {
    start: function* (g) {
      if (g.seen.whizzer104) return;
      g.seen.whizzer104 = 1;
      yield g.say('whizzer', 'О, это вы! Пёс и кролик! Вы меня тогда вылечили! Или побили! Я не разобрал!');
    },
    options: [
      { id: 'gov', icon: 'star', text: 'Ты теперь губернатор?', run: function* (g) {
        yield g.say('whizzer', 'Западной Дакоты! Её открыли специально для меня! Там пока только я и одна корова!');
      } },
      { id: 'bros', icon: 'f:poppers', text: 'Где твои братья?', run: function* (g) {
        yield g.say('whizzer', 'Спекс правит Южной, Пиперс Северной! Мы поделили Дакоты, чтобы не ссориться!');
        yield g.say('whizzer', 'Теперь ссоримся по почте!');
      } },
      { id: 'soda', icon: 'soda', text: 'А где твоя корзинка с газировкой?', run: function* (g) {
        yield g.say('whizzer', 'Я бросил! Пять недель! Врач сказал: или газировка, или почки!');
        yield g.say('whizzer', 'Я выбрал почки. Они у меня с рождения!');
        g.f.knowSoda = true;
      } },
      { id: 'why', icon: 'f:pres', text: 'Зачем ты приехал к президенту?', run: function* (g) {
        yield g.say('whizzer', 'Просить денег на туалеты! В Западной Дакоте их ноль! Я проверял! Лично!');
      } },
      { id: 'bye', icon: 'bye', text: 'Удачи на переговорах.', end: true, run: function* (g) {
        yield g.say('whizzer', 'Спасибо! А вы тут кто? Переводчики? Отлично! Меня никто не понимает!');
      } }
    ]
  };

  function* interpret(g) {
    const wz = g.actors.whizzer;
    yield g.walkTo('sam', 196, 176);
    g.face('sam', 'e');
    if (g.f.whizzerSoda) {
      yield g.say('whizzer', 'Господин переводчик, скорее! Я же лопну!');
      yield g.say('pres', 'Губернатор опять что-то сказал. Переводчик?');
      yield g.talkTo('interp2');
      return;
    }
    yield g.say('pres', 'Губернатор! Говорите. Страна слушает. Страна сейчас я.');
    wz.act = 'dance'; wz.actT = 2.2;
    yield g.say('whizzer', 'Господин президент, большая честь, я ехал три часа без единой остановки, вы понимаете, чего мне это стоило!');
    yield g.say('pres', 'Ни слова не понял. Переводчик?');
    yield g.talkTo('interp1');
  }

  function* pourSoda(g) {
    const ch = g.actors.chuckles, wz = g.actors.whizzer;
    yield g.say('pres', 'Гость хочет пить! Чаклз, глобус!');
    yield g.walkTo('chuckles', 178, 146, { speed: 1.5 });
    g.face('chuckles', 'w');
    ch.act = 'point'; ch.actT = 0.8;
    g.sfx('click');
    g.f.globeOpen = true;
    yield g.say('chuckles', 'Апельсиновая. Со льдом. Угощайтесь, губернатор.');
    yield g.walkTo('chuckles', 346, 152, { speed: 1.5 });
    g.face('chuckles', 'w');
    yield g.say('whizzer', 'Газировка! Нет. Я бросил. Пять недель. Я сильный.');
    yield 0.6;
    yield g.say('whizzer', 'Одну.');
    yield g.walkTo('whizzer', 176, 170, { speed: 1.4 });
    g.sfx('fizz');
    yield 0.9;
    g.sfx('burp');
    g.f.whizzerSoda = true;
    yield g.walkTo('whizzer', 150, 172, { speed: 1.4 });
    g.face('whizzer', 'e');
    wz.act = 'dance'; wz.keepAct = true;
    yield g.say('whizzer', 'Ой. Ой-ой. Господин президент, где у вас тут комната? Маленькая такая? Срочно!');
    yield g.say('pres', 'Опять не понял. Переводчик?');
  }

  TALK.interp1 = {
    options: [
      { id: 'honest', icon: 'yes', text: 'Он говорит, что для него это большая честь.', run: function* (g) {
        yield g.say('pres', 'И для меня! Для меня любая честь большая.');
        yield g.say('whizzer', 'Что он сказал? Он согласен? На что он согласен?');
      } },
      { id: 'revolt', icon: 'fist', text: 'Он говорит, что Западная Дакота готовит восстание.', run: function* (g) {
        yield g.say('pres', 'Восстание! Прекрасно. Люблю, когда народ чем-то занят.');
        yield g.say('chuckles', 'Губернатор шутит. Переводчик тоже. Переводчик шутит в последний раз.');
      } },
      { id: 'love', icon: 'heart', text: 'Он говорит, что давно и безответно вас любит.', run: function* (g) {
        yield g.say('pres', 'Сегодня не четверг. По закону я отвечу ему взаимностью только в четверг.');
        yield g.say('whizzer', 'Почему он мне подмигивает? Сразу двумя глазами?');
      } },
      { id: 'ball', icon: 'ball', text: 'Он говорит, что болеет за бейсбол.', run: function* (g) {
        yield g.say('pres', 'Бейсбол! Я как раз подписал закон: теперь побеждают обе команды.');
        yield g.say('max', 'А проигрывает кто?');
        yield g.say('pres', 'Судья.');
      } },
      { id: 'drink', icon: 'soda', text: 'Он говорит, что умирает от жажды.', end: true, run: function* (g) {
        g.endDialog();
        yield* pourSoda(g);
        yield g.talkTo('interp2');
      } },
      { id: 'bye', icon: 'bye', text: 'Минуту. Я подбираю слова.', end: true, run: function* (g) {
        yield g.say('pres', 'Подбирайте. Слова у нас казённые.');
      } }
    ]
  };

  function* wcTrip(g) {
    const wz = g.actors.whizzer;
    yield g.say('pres', 'Дверь с буквами, губернатор. Вон та.');
    wz.act = ''; wz.keepAct = false;
    g.camLock = 160;
    yield g.walkTo('whizzer', 416, 136, { speed: 1.7 });
    g.sfx('door');
    wz.visible = false;
    yield 0.9;
    g.sfx('flush');
    yield 1.3;
    wz.visible = true;
    g.sfx('door');
    g.camLock = null;
    yield g.walkTo('whizzer', 176, 170, { speed: 1.4 });
    yield g.say('whizzer', 'Уф. Спасибо! О, в глобусе ещё осталось!');
    g.sfx('fizz');
    yield 0.8;
    yield g.walkTo('whizzer', 150, 172, { speed: 1.4 });
    g.face('whizzer', 'e');
    wz.act = 'dance'; wz.keepAct = true;
    yield g.say('whizzer', 'Ой. Опять. Господин президент, мне снова туда же!');
    yield g.say('sam', g.count('wcloop') === 1 ? 'Он вернулся к глобусу. Этот круг можно повторять до конца президентского срока.' : 'Ещё круг. Глобус у президента бездонный, а губернатор нет.');
  }

  function* escort(g) {
    const wz = g.actors.whizzer, ch = g.actors.chuckles;
    yield g.say('pres', 'Стальная дверь, губернатор! Прямо за Чаклзом.');
    wz.act = ''; wz.keepAct = false;
    g.camLock = 160;
    yield g.walkTo('whizzer', 426, 142, { speed: 1.8 });
    yield g.say('whizzer', 'Наконец-то! Какая тяжёлая дверь у вашего туалета!');
    yield g.walkTo('chuckles', 404, 146, { speed: 1.8 });
    g.face('chuckles', 'e');
    ch.act = 'grab'; ch.keepAct = true;
    yield g.say('chuckles', 'Губернатор. В Военную комнату посторонним нельзя. Пройдёмте. Побеседуем в комнате без окон.');
    yield g.say('whizzer', 'А там есть туалет?');
    yield g.say('chuckles', 'Там есть ведро.');
    ch.act = ''; ch.keepAct = false;
    g.camLock = null;
    yield [g.walkTo('whizzer', 28, 150, { speed: 1.5 }), g.walkTo('chuckles', 52, 150, { speed: 1.4 })];
    g.sfx('door');
    g.place('whizzer', 'nowhere', 0, 0);
    g.place('chuckles', 'nowhere', 0, 0);
    g.f.chucklesOut = true;
    yield g.say('max', 'Он ушёл! Сэм, президент остался без няньки!');
    yield g.say('sam', g.has('glove') ? 'И улыбается. Макс, ты сегодня разминался?' : 'И улыбается. Кулаком такого не возьмёшь, Макс. У него челюсть на петлях.');
  }

  TALK.interp2 = {
    options: [
      { id: 'wc', icon: 'wc', text: 'Он спрашивает, где туалет.', run: function* (g) { yield* wcTrip(g); } },
      { id: 'bed', icon: 'bed', text: 'Он спрашивает, как пройти в спальню Линкольна.', run: function* (g) {
        yield g.say('pres', 'Наверх и налево. Там никто не спит. Там скрипит.');
        yield g.say('whizzer', 'Мне не наверх! Мне срочно!');
      } },
      { id: 'war', icon: 'missile', text: 'Он спрашивает, как пройти в Военную комнату.', end: true, run: function* (g) { g.endDialog(); yield* escort(g); } },
      { id: 'bye', icon: 'bye', text: 'Минуту. Уточню у губернатора.', end: true, run: function* (g) {
        yield g.say('whizzer', 'Уточняйте быстрее! Я держусь на честном слове!');
      } }
    ]
  };

  function* knockout(g) {
    const max = g.actors.max, pr = g.actors.pres, ch = g.actors.chuckles, sam = g.actors.sam;
    if (g.f.puppetDown) { yield g.say('sam', 'Бить больше некого. Голова лежит отдельно.'); return; }
    if (!g.f.chucklesOut) {
      yield g.say('chuckles', 'Перчатку уберите. Медленно.');
      yield g.say('max', 'Сэм, он смотрит на мою перчатку так, будто она ему родня!');
      return;
    }
    g.hideUI = true;
    max.scripted = true;
    yield g.say('sam', 'Макс, твой выход. Один удар, как тогда с Пиперсом.');
    yield g.say('max', 'За пистолеты! И за пудинг!');
    yield g.walkTo('max', 240, 142, { free: true, speed: 1.7 });
    g.face('max', 'e');
    max.act = 'punch'; max.actT = 0.7;
    g.sfx('punch');
    g.fx.flash = 0.35;
    g.fx.shake = 0.5;
    pr.v = 'headless';
    g.f.puppetDown = true;
    yield 0.9;
    g.sfx('spring');
    yield g.say('max', 'Сэм! У него отлетела голова! Я не рассчитал! Или рассчитал!');
    yield g.say('sam', 'Из шеи торчит пружина. Внутри опилки и динамик.');
    yield g.say('sam', 'Президент Соединённых Штатов сделан из того же, что Мистер Мишка.');
    yield g.say('max', 'Кукла! Значит, я никого не убил. Я сломал очень большой телевизор!');
    yield g.walkTo('max', 214, 172, { free: true, speed: 1.4 });
    max.scripted = false;
    g.place('chuckles', 'oval', 30, 150, 'e');
    ch.visible = true; ch.act = ''; ch.keepAct = false;
    g.sfx('door');
    g.camLock = 0;
    yield g.walkTo('chuckles', 150, 162);
    g.face('sam', 'w');
    yield g.say('chuckles', 'Господа. Вы сломали президента.');
    yield g.say('chuckles', 'Жаль. Хорошая была кукла. Страна к ней привыкла.');
    yield g.say('sam', 'Сначала плюшевые мишки, теперь президент. Кто вас нанял, Чаклз?');
    yield g.say('chuckles', 'План Б.');
    ch.act = 'remote'; ch.keepAct = true;
    g.sfx('beep');
    yield 0.8;
    yield g.fadeOut(3);
    g.closeup = { kind: 'memorial', t0: g.time };
    g.music('abechase');
    yield g.fadeIn(3);
    yield E.tv(g, 'Срочное сообщение. Статуя в мемориале Линкольна встала с кресла.');
    g.sfx('stomp');
    g.fx.shake = 0.5;
    yield E.tv(g, 'Сейчас она идёт к Белому дому. Очевидцы говорят, что очень уверенно.');
    yield g.fadeOut(3);
    g.closeup = null;
    g.camLock = null;
    g.music('oval');
    yield g.fadeIn(3);
    ch.act = ''; ch.keepAct = false;
    yield g.say('chuckles', 'Президент скончался на посту. По закону объявляю экстренные выборы. Сегодня.');
    yield g.say('chuckles', 'Кандидат уже в пути. Соперников у него нет.');
    yield g.walkTo('chuckles', 28, 150, { speed: 1.4 });
    g.sfx('door');
    g.place('chuckles', 'nowhere', 0, 0);
    g.sfx('ring');
    yield 1;
    sam.act = 'phone'; sam.keepAct = true;
    yield g.say('sam', 'Телефон президента. Вольная полиция слушает.');
    yield E.phone(g, 'Сэм! По всем каналам выборы. Через час. В бюллетене одна статуя!');
    yield g.say('sam', 'Мы в курсе, Комиссар. Её только что включили при нас.');
    yield E.phone(g, 'Без соперника он победит сам собой. Найдите соперника. Любого. С пульсом.');
    yield g.say('max', 'У меня есть пульс! Иногда два!');
    yield g.say('sam', 'Соперник найден, Комиссар. Он уже примеряет кресло.');
    g.sfx('hangup');
    sam.act = ''; sam.keepAct = false;
    g.f.election = true;
    const sb = g.actors.superball;
    g.place('superball', 'oval', 30, 150, 'e');
    sb.visible = true; sb.act = ''; sb.keepAct = false;
    g.sfx('door');
    g.camLock = 160;
    yield g.walkTo('superball', 448, 138, { speed: 1.7 });
    ROOMS.oval.setup(g);
    yield g.say('superball', 'Агент Суперболл. Приказ Папы-Медведя: охранять Военную комнату. Приступил.');
    g.camLock = null;
    yield g.say('sam', 'За окном уже стучат молотки. Сцену твоему сопернику сколачивают быстрее, чем законы.');
    g.hideUI = false;
  }

  function* takeHead(g) {
    yield g.anim('sam', 'reach', 0.5);
    g.f.headTaken = true;
    g.give('head');
    yield g.say('sam', 'Улика четвёртого дела. Лёгкая. Власть, оказывается, почти ничего не весит.');
    yield g.say('max', 'Поставим её рядом с мишкой! Пусть обсуждают политику!');
  }

  const DAY_OFF = {
    1: 'Первое апреля. В этот день любой приказ считается шуткой. Остаюсь на посту.',
    2: 'Религиозный праздник. Служба их не отмечает. Церковь отделена от государства. Я на стороне государства.',
    8: 'Религиозный праздник. Служба их не отмечает. Яйца красить запрещено уставом.',
    15: 'День налогов. Служба работает сверхурочно.',
    22: 'День Земли. Земля отдыхает. Я на ней стою.',
    27: 'День посадки деревьев. Я не дерево.'
  };

  function* dayOff(g) {
    const d = g.f.today;
    const sb = g.actors.superball;
    if (!E.HOLIDAYS[d]) { yield g.say('superball', 'Сегодня ' + d + ' апреля. Праздника нет. Я сверился с календарём.'); return; }
    if (d !== 26) { yield g.say('superball', DAY_OFF[d]); return; }
    if (!g.f.superSec) {
      yield g.say('superball', 'День секретаря. Я агент. Ко мне не относится.');
      yield g.say('sam', 'Жаль. Вам бы пошло.');
      return;
    }
    g.endDialog();
    g.hideUI = true;
    yield g.say('superball', 'День секретаря. Я секретарь ' + g.f.secTitle + '. Праздник мой.');
    yield g.say('superball', 'Устав, пункт девять. Снимаюсь с поста до полуночи.');
    sb.act = 'salute';
    yield g.say('superball', 'Господин президент. Разрешите отдыхать.');
    yield g.say('max', 'Разрешаю! Отдыхай изо всех сил!');
    sb.act = ''; sb.keepAct = false;
    yield g.walkTo('superball', 30, 150, { speed: 1.3 });
    yield g.say('superball', 'Отдыхать не обучен. Инструкцию изучу по дороге.');
    g.sfx('door');
    g.place('superball', 'nowhere', 0, 0);
    g.f.superGone = true;
    yield g.say('sam', g.f.war ? 'Дверь свободна и открыта. Война постаралась.' : 'Дверь свободна. Заперта, но свободна. В этом городе такое называют прогрессом.');
    g.hideUI = false;
  }

  TALK.superball2 = {
    start: function* (g) {
      if (g.seen.superball2) return;
      g.seen.superball2 = 1;
      yield g.say('superball', 'Агент Суперболл. Пост номер два. Военная комната.');
    },
    options: [
      { id: 'move', icon: 'keyhole', text: 'Отойдите от двери.', run: function* (g) {
        if (!g.f.elected) { yield g.say('superball', 'Ответ отрицательный. Приказ Папы-Медведя.'); return; }
        yield g.say('max', 'Это приказ президента! Я приказываю громко!');
        yield g.say('superball', 'Приказ принят. Приказ начальника службы старше. Начальник велел стоять.');
        yield g.say('sam', 'Начальник уехал на плече у статуи.');
        yield g.say('superball', 'Приказ остался.');
      } },
      { id: 'hold', icon: 'hold', text: 'Долго вы ждали на линии?', once: true, run: function* (g) {
        yield g.say('superball', 'Сорок одну минуту. Потом линию отключил Папа-Медведь. Ваш голос я записал.');
        yield g.say('sam', 'Зачем?');
        yield g.say('superball', 'На случай, если мой звонок снова станет для кого-то важен.');
      } },
      { id: 'rest', icon: 'calendar', text: 'Когда у вас выходной?', run: function* (g) {
        yield g.say('superball', 'По уставу агент отдыхает в свой профессиональный праздник.');
        yield g.say('superball', 'Дня агента в календаре нет. Я проверяю каждый год.');
        g.f.knowRest = true;
      } },
      { id: 'vac', icon: 'star', text: 'Сегодня праздник. Возьмите выходной.', when: g => g.f.elected, run: function* (g) { yield* dayOff(g); } },
      { id: 'war', icon: 'missile', text: 'Что нужно, чтобы дверь открылась?', run: function* (g) {
        yield g.say('superball', 'ДЕФКОН один. Война. Любая. Замки снимаются сами.');
        yield g.say('superball', 'После этого остаюсь я.');
        g.f.knowWar = true;
      } },
      { id: 'bye', icon: 'bye', text: 'Так держать.', end: true, run: function* (g) {
        yield g.say('superball', 'Держу.');
      } }
    ]
  };

  function* giveRibbon(g) {
    const sb = g.actors.superball;
    if (g.f.superSec) { yield g.say('superball', 'Лента уже на мне. Вторая не положена по форме.'); return; }
    yield g.say('sam', 'Агент Суперболл. Президент жалует вам ленту почётного секретаря.');
    yield g.say('superball', 'Принимаю. Отказ от награды приравнен к неуважению.');
    yield g.anim('sam', 'reach', 0.5);
    g.drop('ribbon');
    sb.v = 'sec';
    g.sfx('pickup');
    yield g.say('superball', 'Секретаря чего?');
    yield g.talkTo('sectitle');
  }

  const TITLES = [
    ['meat', 'weenie', 'Секретарь по мясу и сырам!', 'по мясу и сырам'],
    ['pud', 'cup', 'Секретарь по возвращению пудинга!', 'по возвращению пудинга'],
    ['door', 'keyhole', 'Секретарь запретных дверей!', 'запретных дверей']
  ];

  TALK.sectitle = {
    options: TITLES.map(([id, icon, text, title]) => ({
      id, icon, text, speaker: 'max', end: true,
      run: function* (g) {
        g.f.superSec = true;
        g.f.secTitle = title;
        yield g.say('superball', 'Секретарь ' + title + '. Записал. Обязанности?');
        yield g.say('max', 'Никаких!');
        yield g.say('superball', 'Справлюсь. Новую должность внесу в личное дело и в календарь.');
      }
    }))
  };

  TALK.govs = {
    start: function* (g) {
      if (g.seen.govs) return;
      g.seen.govs = 1;
      yield g.say('specs', 'Господин переводчик. Вы теперь состоите при кролике?');
      yield g.say('sam', 'Я при нём состоял и раньше. Теперь это должность.');
    },
    options: [
      { id: 'rush', icon: 'mountain', text: 'Из-за чего спор?', run: function* (g) {
        yield g.say('specs', 'Гора Рашмор. Четыре лица, миллион туристов. Я предлагаю высечь пятое. Моё. Оно самое опрятное.');
        yield g.say('peepers', 'Касса. У подножия. На северной стороне.');
        yield g.say('whizzer', 'А я хочу водопад! Из правого глаза Вашингтона!');
      } },
      { id: 'believe', icon: 'f:max', text: 'Вы не верите, что Макс президент?', run: function* (g) {
        yield g.say('peepers', 'Кролик. Без штанов. С зубами.');
        yield g.say('specs', 'Зубы у президентов бывают, Пиперс. Но штаны у них были всегда.');
        yield g.say('max', 'Я издам указ, и штаны отменят!');
      } },
      { id: 'war', icon: 'fist', text: 'Объявите друг другу войну, и дело с концом.', run: function* (g) {
        yield g.say('specs', 'Войну? Братьям? Я никогда не скажу Пиперсу, что думаю о его кассе.');
        yield g.say('peepers', 'Я тоже. Про пятое лицо. Молчу.');
        yield g.say('whizzer', 'А мне нельзя волноваться! Мне от волнения сразу надо выйти!');
        yield g.say('sam', 'Трое братьев, и каждый молчит о двух других. Вежливость у них семейная, как нос.');
        g.f.knowPolite = true;
      } },
      { id: 'how', icon: 'star', text: 'Как вы все стали губернаторами?', run: function* (g) {
        yield g.say('specs', 'За детских звёзд голосуют охотно. Нас помнят бабушки.');
        yield g.say('peepers', 'Бабушек много. Дакот не хватило. Открыли Западную.');
      } },
      { id: 'bye', icon: 'bye', text: 'Президент подумает над вашим вопросом.', end: true, run: function* (g) {
        yield g.say('max', 'Уже подумал! Гору распилить, куски раздать!');
        yield g.say('specs', 'Мы подождём другого решения. Вежливо.');
      } }
    ]
  };

  function* startWar(g) {
    const wz = g.actors.whizzer;
    if (!govsHere(g)) { yield g.say('sam', 'Поить сывороткой сейчас некого. Губернаторы разъехались.'); return; }
    g.hideUI = true;
    yield g.say('sam', 'Губернатор, вы с дороги. Выпейте. Прозрачное и без газа.');
    yield g.say('whizzer', 'Без газа можно! От него мне ничего не бывает!');
    yield g.anim('sam', 'reach', 0.5);
    g.drop('serum');
    g.sfx('slurp');
    yield 0.9;
    g.sfx('burp');
    wz.act = 'dance'; wz.actT = 3;
    yield g.say('whizzer', 'Ой. Как тепло. Спекс! Знаешь, что Пиперс говорит про твоё пятое лицо? Что туристы решат, будто гору засидели голуби!');
    yield g.say('specs', 'Пиперс?');
    yield g.say('whizzer', 'А Спекс говорит, что твоя касса, Пиперс, это ларёк с магнитами! И что считать ты умеешь только до своей доли!');
    yield g.say('peepers', 'Спекс. Ты так сказал.');
    yield g.say('whizzer', 'А я думаю, что вы оба зануды, и гора моя! Я первый увидел её из автобуса!');
    g.actors.specs.act = 'attack'; g.actors.peepers.act = 'attack';
    yield g.say('specs', 'Южная Дакота объявляет войну Северной.');
    yield g.say('peepers', 'Северная принимает. И объявляет Западной.');
    yield g.say('whizzer', 'Западная объявляет всем! Только сначала мне надо выйти!');
    g.sfx('klaxon');
    g.fx.flash = 0.3;
    for (const id of GOVS) { const a = g.actors[id]; a.act = ''; a.keepAct = false; a.scripted = true; }
    yield GOVS.map((id, i) => g.walkTo(id, 26, 148 + i * 6, { speed: 1.7 }));
    g.sfx('door');
    for (const id of GOVS) { g.place(id, 'nowhere', 0, 0); g.actors[id].scripted = false; }
    yield g.say(null, 'ДЕФКОН один. Война. Замки Военной комнаты сняты.', { key: 'computer', color: COLORS.computer });
    yield g.fadeOut(3);
    g.fadeIn(6);
    yield* E.warSong(g);
    yield g.fadeOut(3);
    g.closeup = null;
    g.f.war = true;
    g.music('oval');
    yield g.fadeIn(3);
    yield g.say('sam', 'Макс. Больше так не делай.');
    yield g.say('max', 'Я ничего не делал! Оно запелось само!');
    yield g.say('sam', 'Поэтому и прошу.');
    if (!g.f.superGone) yield g.say('superball', 'Замки сняты. Мой приказ прежний: никого не впускать. Оба утверждения верны.');
    g.hideUI = false;
  }

  function* inauguration(g) {
    g.hideUI = true;
    yield g.walkTo('sam', 196, 176);
    g.face('sam', 'e');
    yield g.say('max', 'Мой кабинет! Моё кресло! Мой глобус с газировкой!');
    yield g.say('sam', 'Прежнего президента унесли в кладовую. У вас посетители, господин президент.');
    yield g.say('specs', 'Губернатор Южной Дакоты Спекс. Мы к президенту. По вопросу горы.');
    yield g.say('max', 'Президент я!');
    yield g.say('peepers', 'Кролик. Не верю.');
    yield g.say('whizzer', 'Я тоже не верю! Но мне всё равно, я проездом из туалета!');
    yield g.say('specs', 'Гора Рашмор стоит на границе трёх Дакот. Доход с туристов надо делить. Мы не сошлись в долях.');
    yield g.say('max', 'Пусть воюют! У войны есть комната с кнопкой!');
    yield g.say('specs', 'Воевать с братьями? Мы подаём друг на друга в суд. Вежливо.');
    yield g.say('superball', 'Напоминаю. Военная комната открывается при ДЕФКОН один. Сейчас ДЕФКОН пять. Мир.');
    g.f.knowWar = true;
    g.hideUI = false;
  }

  const HOLIDAY_LINES = {
    1: ['max', 'День дурака! Сэм, это мой профессиональный праздник!'],
    2: ['sam', 'Песах. Макс, мацу в Белом доме держат для гостей. Положи.'],
    8: ['max', 'Пасха! Я спрячу яйца в Военной комнате! Пусть ищут!'],
    15: ['sam', 'День налогов. Единственный праздник, который отмечает только казна.'],
    22: ['max', 'День Земли! Подарим ей что-нибудь круглое!'],
    26: ['sam', 'День секретаря. Поздравлять в этом кабинете пока некого.'],
    27: ['max', 'День посадки деревьев! Посадим Линкольна! По пояс!']
  };

  E.onCalendar = function* (g, prev) {
    const d = g.f.today;
    if (d === prev) return;
    const h = E.HOLIDAYS[d];
    yield g.say('sam', 'Страна переходит на ' + d + ' апреля.' + (h ? ' ' + h.name + '.' : ''));
    if (d === 26 && g.f.superSec) { yield g.say('max', 'День секретаря! Сэм, у нас как раз завёлся один!'); return; }
    if (h) { const [who, line] = HOLIDAY_LINES[d]; yield g.say(who, line); }
    else if ((d - 4) % 7 === 0 && g.actors.superball.room === 'oval') {
      yield g.say('superball', 'Четверг. По закону обязан обнять ближайшего соседа.');
      yield g.say('sam', 'Ближайший сосед я. Обнял. Рёбра целы, достоинство под вопросом.');
    } else yield g.say('max', 'Обычный день. Я объявлю его Днём Макса, когда научусь писать указы без клякс!');
  };

  const BUDGET_LINES = {
    hall: ['Сто миллионов Залу Независимости. Там наконец починят колокол.', 'Скучно! Дай денег чему-нибудь, что взрывается!'],
    alamo: ['Сто миллионов крепости Аламо. Теперь её точно запомнят.', 'Пусть купят пушку! И наведут на Линкольна!'],
    liberty: ['Сто миллионов статуе Свободы.', 'Только не статуе, Сэм! Одна уже сходила в политику!']
  };

  E.onBudget = function* (g, id) {
    const f = g.f;
    if (f.budget === id) { yield g.say('sam', 'Деньги уже там. Дважды одни сто миллионов не потратишь. Хотя конгресс пробовал.'); return; }
    f.budget = id;
    g.sfx('stamp');
    if (BUDGET_LINES[id]) {
      yield g.say('sam', BUDGET_LINES[id][0]);
      yield g.say('max', BUDGET_LINES[id][1]);
      return;
    }
    if (id === 'sybil') {
      yield g.say('sam', 'Сто миллионов конторе Сибил Пандемик. Историческое место, идолу две тысячи лет.');
      if (f.sybilFunded) { yield g.say('max', 'Она уже получала! Сибил теперь богаче нас! Хотя богаче нас даже Джимми.'); return; }
      f.sybilFunded = true;
      f.sybilGone = true;
      g.sfx('ring');
      yield 0.8;
      yield E.phone(g, 'Сэм? Мне пришло сто миллионов! Я закрываю контору и еду в отпуск! Прибор на столе, не уроните!', COLORS.sybil);
      yield g.say('max', 'Отпуск! Сэм, я тоже хочу сто миллионов и уехать! Я уеду недалеко!');
      return;
    }
    yield g.say('sam', 'Сто миллионов лавке Боско. За сосиски мелового периода. Чек подписал кролик.');
    f.boscoFunded = true;
    yield g.say('max', 'Лучшая трата в истории страны!');
  };

  function* openCalendar(g) {
    if (!g.f.elected) {
      if (puppetUp(g) && !g.f.chucklesOut) yield g.say('chuckles', 'Календарь не трогать. Какое сегодня число, решает президент.');
      else if (g.f.puppetDown) yield g.say('superball', 'Календарь президента. Руками не трогать. Приказ.');
      else yield g.say('sam', 'Какое сегодня число, решает президент. Этот пока ничего не решает сам.');
      return;
    }
    yield g.anim('sam', 'reach', 0.3);
    E.panels.calendar(g);
  }

  function* openBudget(g) {
    if (!g.f.elected) { yield g.say('sam', 'Бюджетом распоряжается президент. Я пока даже не его напарник.'); return; }
    yield g.anim('sam', 'reach', 0.3);
    E.panels.budget(g);
  }

  function* takeRibbon(g) {
    if (!g.f.elected) {
      if (puppetUp(g) && !g.f.chucklesOut) yield g.say('chuckles', 'Ленту вручает президент. Положите.');
      else yield g.say('sam', 'Лента почётного секретаря. Вручать её может только президент. Брать, видимо, тоже.');
      return;
    }
    yield g.anim('sam', 'reach', 0.5);
    g.f.ribbonTaken = true;
    g.give('ribbon');
    yield g.say('sam', 'Президент не против. Президент грызёт пресс-папье.');
  }

  function* warDoor(g) {
    const f = g.f;
    if (puppetUp(g)) {
      if (!f.chucklesOut) { yield* thrownOut(g); return; }
      yield g.say('sam', 'Заперто. В мирное время, как и обещали.');
      return;
    }
    if (!f.superGone) { yield g.say('superball', 'Стоять. Военная комната. Вход закрыт.'); yield g.talkTo('superball2'); return; }
    if (!f.war) { yield g.say('sam', 'Заперто. Над дверью горит «ДЕФКОН 5». Мир во всём мире, как назло.'); return; }
    g.sfx('gate');
    yield* g.goRoom('warroom', { x: 52, y: 150, dir: 'e' });
  }

  function govHot(id, name, look, ribbon) {
    return {
      name, when: g => g.actors[id].room === 'oval',
      look,
      talk: function* (g) { yield g.talkTo(govsHere(g) ? 'govs' : 'whizzer4'); },
      items: {
        ribbon: function* (g) { yield g.say(id, ribbon); },
        serum: function* (g) { yield g.say(id, id === 'specs' ? 'Благодарю, я не пью из чужих бутылок. У меня репутация и очки.' : 'Нет. Не пью. На службе.'); },
        roach: function* (g) { yield* E.bugPlant(g, id); },
        gun: 'Целиться в губернатора? У него неприкосновенность. У меня только значок.',
        glove: 'Гипноза на нём нет. Он сам по себе такой.',
        dater: function* (g) { g.sfx('scan'); yield g.say('sam', 'Прибор пишет: «Бывшая детская звезда». Возраст стёрт по просьбе агента.'); },
        max: function* (g) { yield g.say('max', 'Губернатор! Целуй перстень! Перстня нет, целуй лапу!'); yield g.say(id, id === 'specs' ? 'Я воздержусь. Она немытая.' : 'Нет.'); }
      }
    };
  }

  ROOMS.oval = {
    id: 'oval', name: 'Овальный кабинет', w: 480, music: 'oval',
    scale: [134, 0.86, 198, 1.02],
    paint: b => S.BG.oval(b),
    walk: [[6, 134, 474, 134, 474, 198, 6, 198]],
    block: [DESK],
    layers: [
      { id: 'globe', x: 138, y: 82, base: 132, key: g => g.f.globeOpen ? 'o' : '' },
      { id: 'easel', x: 354, y: 54, base: 132, key: g => g.f.today },
      { id: 'chair', x: 230, y: 66, base: 142 },
      { id: 'desk', x: 192, y: 116, base: 164, key: g => g.f.ribbonTaken ? 't' : '' },
      { id: 'head', x: 156, y: 150, base: 181, when: g => g.f.puppetDown && !g.f.headTaken }
    ],
    hot: [
      { id: 'exit', name: 'Выход на лужайку', rect: [2, 28, 40, 102], walk: [30, 146], face: 'w',
        look: 'Дверь на лужайку. Изнутри она обита белой кожей. Хлопнуть ею невозможно, я бы проверил.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('lawn', { x: 338, y: 146, dir: 's' }, { from: 'oval' }); } },
      { id: 'portrait', name: 'Портрет Вашингтона', rect: [56, 22, 40, 50], walk: [76, 138], face: 'n',
        look: 'Портрет Вашингтона. Первый президент смотрит на нынешнего и ничего не подписывает.',
        use: 'Висит крепко. За портретом обычно прячут сейф, но искать его при охране я не стану.' },
      { id: 'eagle', name: 'Бронзовый орёл', rect: [100, 60, 38, 70], walk: [118, 138], face: 'n',
        look: 'Бронзовый орёл на постаменте. В когтях у него пресс-папье и зелёная губка. Хищник на канцелярской работе.',
        use: 'Орёл привинчен. Его клюв видел столько указов, что я ему сочувствую.',
        items: { dater: function* (g) { g.sfx('scan'); yield g.say('sam', 'Орлу сто шесть лет. Для места в списках мало. Да и в бюджет он не просился.'); } } },
      { id: 'globe', name: 'Глобус', rect: [140, 84, 32, 36], walk: [158, 140], face: 'n',
        look: g => g.f.globeOpen ? 'Глобус открыт по экватору. Внутри лёд и апельсиновая газировка.' : 'Глобус на подставке. Западная Дакота дорисована фломастером. По экватору идёт петля.',
        use: function* (g) {
          if (!g.f.globeOpen) { yield g.say('sam', puppetUp(g) ? 'Глобус с петлёй и замочком. Лезть в президентскую мебель без приглашения не стану.' : 'Заперт. Ключ, наверное, ушёл вместе с Чаклзом.'); return; }
          yield g.say('sam', 'Газировка казённая. От неё Уиззер только бегает, а мне нужна ясная голова.');
        } },
      { id: 'windows', name: 'Окна', rect: [196, 24, 142, 40], walk: [180, 140], face: 'e',
        look: g => puppetUp(g) ? 'За окнами лужайка. В стекле отражается затылок президента. На затылке шов.' : g.f.election && !g.f.rampage ? 'За окнами лужайка и сцена. Над сценой торчит мраморный цилиндр.' : 'За окнами лужайка. Газон помят в двух местах, размером с автомобиль каждое.' },
      { id: 'flagl', name: 'Синий флаг', rect: [174, 28, 14, 100], walk: [180, 140], face: 'n',
        look: 'Флаг президента. Синий, с орлом. Орлов в этом кабинете больше, чем людей.' },
      { id: 'flagr', name: 'Флаг', rect: [342, 28, 14, 100], walk: [340, 140], face: 'n',
        look: 'Звёздно-полосатый флаг. Звёзд пятьдесят одна. Западную Дакоту уже пришили.' },
      { id: 'chair', name: 'Кресло президента', rect: [232, 68, 56, 24], walk: [258, 174], face: 'n',
        look: g => g.f.elected ? 'Кресло президента. Макс стоит на нём ногами. Сидя его не видно из-за стола.' : puppetUp(g) ? 'Кресло президента. Красная кожа, высокая спинка. Президент сидит в нём очень ровно.' : 'Кресло президента. В нём сидит то, что осталось от президента.' },
      { id: 'desk', name: 'Стол президента', rect: [192, 130, 136, 36], walk: [258, 174], face: 'n',
        look: 'Стол президента. Дуб, резной орёл и три ящика. На столе телефон, книга бюджета и красная лента.',
        use: 'Ящики заперты. В одном что-то тикает. Надеюсь, часы.' },
      { id: 'ribbon', name: 'Красная лента', rect: [206, 118, 14, 12], walk: [226, 174], face: 'n', over: true, when: g => !g.f.ribbonTaken,
        look: 'Красная лента на столе. «Почётный секретарь». Президент прикалывает её, и человек попадает в кабинет министров.',
        use: function* (g) { yield* takeRibbon(g); } },
      { id: 'budget', name: 'Книга бюджета', rect: [246, 118, 28, 12], walk: [258, 174], face: 'n', over: true,
        look: g => g.f.elected ? 'Книга бюджета. «Фонд президента: исторические места». В фонде ровно сто миллионов долларов.' : 'Книга бюджета с золотым тиснением. Открывать её положено президенту.',
        use: function* (g) { yield* openBudget(g); } },
      { id: 'dphone', name: 'Телефон президента', rect: [296, 114, 18, 14], walk: [300, 174], face: 'n', over: true,
        look: 'Телефон президента. Кнопка одна, подписана: «Служба».',
        use: function* (g) {
          if (puppetUp(g) && !g.f.chucklesOut) { yield g.say('chuckles', 'Линия служебная. Положите трубку.'); return; }
          yield g.say('sam', 'В трубке тишина. На том конце раньше сидел Суперболл. Теперь он стоит.');
        } },
      { id: 'calendar', name: 'Календарь', rect: [356, 62, 40, 44], walk: [376, 140], face: 'n',
        look: function* (g) {
          const h = E.HOLIDAYS[g.f.today];
          yield g.say('sam', 'Календарь на апрель. Листок «Сегодня» приклеен на ' + g.f.today + '-е число.' + (h ? ' ' + h.name + '.' : ' Праздника в этот день нет.'));
        },
        use: function* (g) { yield* openCalendar(g); } },
      { id: 'wc', name: 'Туалет', rect: [400, 36, 32, 94], walk: [416, 138], face: 'n',
        look: 'Туалет президента. Ковёр к этой двери протоптан сильнее, чем к столу.',
        use: 'Мне не нужно. Пёс терпит до дома.' },
      { id: 'wardoor', name: 'Военная комната', rect: [436, 28, 42, 102], walk: [430, 146], face: 'e',
        look: g => g.f.war ? 'Стальная дверь. Над ней горит красная лампа. Замки сняты.' : 'Стальная дверь с жёлтой полосой. На табличке мелко: «В мирное время заперто. Открывается при ДЕФКОН 1».',
        use: function* (g) { yield* warDoor(g); },
        exit: function* (g) { yield* warDoor(g); } },
      { id: 'warsign', name: 'Вывеска', rect: [432, 4, 48, 22],
        look: '«Военная комната». Красным по золоту. Кто-то очень гордился этой комнатой.' },
      { id: 'seal', name: 'Ковёр', rect: [176, 170, 128, 14], walk: [240, 190], face: 'n',
        look: 'Печать президента на ковре. Орёл держит стрелы и оливковую ветвь. Макс уже спрашивал, можно ли заменить ветвь на пончик.' },
      { id: 'headfloor', name: 'Голова президента', rect: [158, 152, 26, 26], walk: [188, 172], face: 'w', over: true, when: g => g.f.puppetDown && !g.f.headTaken,
        look: 'Голова президента. Лежит на ковре и улыбается. Вместо глаз крестики.',
        use: function* (g) { yield* takeHead(g); } }
    ],
    actors: {
      pres: {
        name: g => g.f.puppetDown ? 'Бывший президент' : 'Президент', walk: [258, 174], face: 'n', when: g => g.actors.pres.room === 'oval',
        look: g => g.f.puppetDown ? 'Президент без головы. Сидит так же ровно. Из воротника торчат пружина и два проводка.' : 'Президент Соединённых Штатов. Улыбка шире лица, румянец ровный, как на витрине. Глаза крутятся.',
        talk: function* (g) {
          if (g.f.puppetDown) { yield g.say('sam', 'Молчит. Говорить ему больше нечем.'); return; }
          yield g.talkTo('pres');
        },
        items: {
          glove: function* (g) { yield* knockout(g); },
          gun: function* (g) {
            if (g.f.puppetDown) { yield g.say('sam', 'Он уже без головы. Дальше только мебель портить.'); return; }
            yield g.say('sam', 'Стрелять в президента? Я не настолько люблю Джоди Фостер.');
          },
          roach: function* (g) {
            if (g.f.puppetDown) { yield E.bug(g, 'Объект молчит, сэр! У объекта нечем говорить, сэр!'); return; }
            yield* E.bugPlant(g, 'pres');
          },
          head: 'Приставить голову обратно? Страна только начала приходить в себя.',
          max: function* (g) {
            if (g.f.puppetDown) { yield g.say('max', 'Можно мне его пружину? На память о первом ударе!'); return; }
            yield g.say('max', 'Господин президент, можно посидеть в вашем кресле?');
            yield g.say('pres', 'Конечно! После следующих выборов. Следующие выборы я отменил.');
          }
        }
      },
      chuckles: {
        name: 'Чаклз', when: g => g.actors.chuckles.room === 'oval',
        look: 'Чаклз. Коричневый костюм, тёмные очки, уши торчком. Начальник Секретной службы. В казино он носил розовую плюшевую голову.',
        talk: function* (g) { yield g.talkTo('chuckles4'); },
        items: {
          roach: function* (g) { yield* E.bugPlant(g, 'chuckles'); },
          glove: 'Бить начальника Секретной службы? Он успеет первым.',
          gun: function* (g) { yield g.say('chuckles', 'Уберите. Иначе я зарегистрирую его сам.'); },
          max: function* (g) { yield g.say('max', 'Можно я его укушу?'); yield g.say('chuckles', 'Можно. Один раз.'); yield g.say('max', 'Сэм, я передумал.'); }
        }
      },
      whizzer: govHot('whizzer', 'Губернатор Уиззер', g => g.f.elected ? 'Уиззер, губернатор Западной Дакоты. Переминается и смотрит на дверь с буквами.' : g.f.whizzerSoda ? 'Уиззер пляшет на месте. Газировка просится обратно.' : 'Уиззер из Сода-Попперов. Теперь с лентой через плечо и золотой звездой. Корзинку с газировкой он оставил дома.', 'На ленте булавка! Мне нельзя острое, я от испуга бегу сами знаете куда!'),
      specs: govHot('specs', 'Губернатор Спекс', 'Спекс, губернатор Южной Дакоты. Очки протёрты, лента отглажена. Ссорится он только в письменном виде.', 'Красное мне не к лицу. И должность мелковата для губернатора.'),
      peepers: govHot('peepers', 'Губернатор Пиперс', 'Пиперс, губернатор Северной Дакоты. Глаза на пол-лица, слов мало. Каждое стоит денег.', 'Лента? Нет. Губернатор выше секретаря.'),
      superball: {
        name: 'Агент Суперболл', walk: [424, 148], face: 'e', when: g => g.actors.superball.room === 'oval',
        look: g => g.f.superSec ? 'Агент Суперболл. На лацкане красная лента почётного секретаря. Стоит он так же.' : 'Агент Суперболл. Теперь заслоняет Военную комнату. Дверь другая, поза прежняя.',
        talk: function* (g) { yield g.talkTo('superball2'); },
        items: {
          ribbon: function* (g) { yield* giveRibbon(g); },
          roach: function* (g) { yield* E.bugPlant(g, 'superball', 'superball2'); },
          serum: function* (g) { yield g.say('superball', 'На посту не пью. После поста тоже. Пост круглосуточный.'); },
          dater: function* (g) { g.sfx('scan'); yield g.say('sam', 'На экране одно слово: «Засекречено».'); },
          gun: function* (g) { yield g.say('superball', 'Оружие вижу. Угрозы не вижу. Вы держите его как бутерброд.'); },
          glove: function* (g) { yield g.say('superball', 'Перчатка. В списке разрешённых предметов её нет. В списке запрещённых тоже. Уточняю.'); },
          head: function* (g) { yield g.say('superball', 'Голова президента. Пост при ней не предусмотрен. Остаюсь у двери.'); },
          max: function* (g) { yield g.say('max', 'Агент, я твой президент! Станцуй!'); yield g.say('superball', 'Танцы только по уставу. При объявлении войны.'); }
        }
      }
    },
    enter: function* (g) {
      if (!g.f.presMet) { yield* meet(g); return; }
      if (g.f.elected && !g.seen.inaug) { g.seen.inaug = 1; yield* inauguration(g); }
    },
    setup(g) {
      const f = g.f;
      const { pres, chuckles, whizzer, superball, max } = g.actors;
      if (f.elected) g.place('pres', 'nowhere', 0, 0);
      else { g.place('pres', 'oval', 260, 143, 's'); pres.visible = true; pres.v = f.puppetDown ? 'headless' : ''; pres.act = ''; }
      if (puppetUp(g) && !f.chucklesOut) {
        g.place('chuckles', 'oval', 346, 152, 'w');
        chuckles.visible = true; chuckles.act = ''; chuckles.keepAct = false; chuckles.scale = null; chuckles.z = 0;
      } else if (chuckles.room === 'oval') g.place('chuckles', 'nowhere', 0, 0);
      if (govsHere(g)) {
        [[96, 170], [128, 180], [160, 168]].forEach(([x, y], i) => {
          const a = g.actors[GOVS[i]];
          g.place(GOVS[i], 'oval', x, y, 'e');
          a.visible = true; a.v = 'gov'; a.act = ''; a.keepAct = false; a.scripted = false;
        });
      } else {
        for (const id of GOVS) if (g.actors[id].room === 'oval') g.place(id, 'nowhere', 0, 0);
        if (puppetUp(g) && f.whizzerIn && !f.chucklesOut) {
          g.place('whizzer', 'oval', 150, 172, 'e');
          whizzer.visible = true; whizzer.v = 'gov'; whizzer.scripted = false;
          whizzer.act = f.whizzerSoda ? 'dance' : ''; whizzer.keepAct = !!f.whizzerSoda;
        }
      }
      if (f.puppetDown && !f.superGone) {
        g.place('superball', 'oval', 448, 138, 's');
        superball.visible = true; superball.act = 'block'; superball.keepAct = true; superball.v = f.superSec ? 'sec' : '';
      } else if (superball.room === 'oval') g.place('superball', 'nowhere', 0, 0);
      if (f.elected) {
        max.follow = null;
        g.place('max', 'oval', 262, 128, 's');
        max.z = 16; max.act = ''; max.keepAct = false;
      }
    },
    leave(g) {
      const max = g.actors.max;
      max.follow = 'sam';
      max.z = 0;
    },
    onLoad(g) { ROOMS.oval.setup(g); }
  };

  Object.assign(ROOMS.oval.actors.whizzer.items, {
    serum: function* (g) { yield* startWar(g); },
    roach: function* (g) { yield* E.bugPlant(g, 'whizzer', g.f.elected ? 'whizzer2' : 'whizzer'); }
  });

  E.oval = { meet, thrownOut, interpret, knockout, startWar, giveRibbon, dayOff, inauguration };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
