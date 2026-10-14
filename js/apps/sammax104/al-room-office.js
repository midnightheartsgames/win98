(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP104;
  const { ROOMS, TALK } = E;

  const pres = (g, t) => E.tv(g, t, COLORS.pres);
  const leo = (g, t) => g.say(null, t, { key: 'leo', color: C.rose[4], x: 240, y: 66 });
  const onLine = (g, who, t) => E.phone(g, t, COLORS[who]);

  function* ring(g, times) {
    for (let i = 0; i < times; i++) { g.sfx('ring'); yield 1.1; }
  }

  function* pickUp(g, line) {
    yield g.walkTo('sam', 104, 150);
    g.face('sam', 'w');
    const sam = g.actors.sam;
    sam.act = 'phone'; sam.keepAct = true;
    if (line) yield g.say('sam', line);
  }

  function hangUp(g) {
    g.sfx('hangup');
    const sam = g.actors.sam;
    sam.act = ''; sam.keepAct = false;
  }

  function* intro(g) {
    g.hideUI = true;
    const max = g.actors.max;
    max.scripted = true;
    g.f.tvOff = true;
    g.closeup = { kind: 'titlecard4', t0: g.time, lines: ['SAM & MAX', 'ЭПИЗОД 104', 'ЭЙБ ЛИНКОЛЬН', 'ДОЛЖЕН УМЕРЕТЬ!'] };
    g.music('title4');
    yield g.fadeIn(1.2);
    yield 4.6;
    yield g.fadeOut(2);
    g.closeup = null;
    g.music('office');
    g.place('max', 'office', 124, 164, 'w');
    g.place('sam', 'office', 176, 166, 'w');
    yield g.fadeIn(1.5);
    yield g.say('max', 'Алло, пиццерия? Сержант, твой выход!');
    yield g.say(null, 'Вольная полиция. Сэм у аппарата. Две большие с анчоусами, и побыстрее.', { key: 'bugplay', color: COLORS.sam, x: 112, y: 120 });
    yield g.say('sam', 'Макс, жучок опять заказывает пиццу моим голосом.');
    yield g.say('max', 'Твоему голосу дают в долг! У него честные интонации!');
    g.sfx('tvon');
    g.f.tvOff = false;
    yield g.say('sam', 'Телевизор включился сам. Раньше он так делал только перед плохими новостями.');
    yield g.fadeOut(3);
    g.closeup = { kind: 'tv4', prog: 'laws', t0: g.time };
    g.music('oval');
    yield g.fadeIn(3);
    yield pres(g, 'Дорогие сограждане! Сегодня я подписал три новых закона.');
    yield pres(g, 'Первый. Обязательные объятия. Каждый четверг, в полдень, с ближайшим соседом.');
    yield pres(g, 'Второй. Эмбарго на пудинг. Пудинг слишком долго дрожал у нас под носом.');
    yield pres(g, 'Третий. Каждый пистолет в стране будет зарегистрирован. Вместе с хозяином.');
    yield g.fadeOut(3);
    g.closeup = null;
    g.music('office');
    yield g.fadeIn(3);
    yield 0.8;
    yield g.say('sam', 'Макс? Ты молчишь четыре секунды. Мне не по себе.');
    yield g.say('max', 'Он хочет переписать пистолеты, Сэм.');
    yield g.say('max', 'Заводи Де Сото.');
    yield* ring(g, 2);
    yield* pickUp(g, 'Вольная полиция. Настоящий Сэм у аппарата.');
    yield E.phone(g, 'Сэм, это Комиссар. Телевизор включён?');
    yield g.say('sam', 'К сожалению.');
    yield E.phone(g, 'Президент за неделю подписал сорок законов. Теперь ещё и пудинг. У меня жена плачет.');
    max.scripted = false;
    g.hideUI = false;
    yield g.talkTo('commish');
  }

  function* feedLeonard(g) {
    const max = g.actors.max;
    max.scripted = true;
    yield g.say('max', 'Стой! Шулер не кормлен!');
    yield g.walkTo('max', 232, 138, { speed: 1.6 });
    g.face('max', 'n');
    g.sfx('door');
    g.f.closetOpen = true;
    g.seen.closet104 = 1;
    yield g.say('max', 'Леонард, обед! Пицца. Вчерашняя, с позавчерашней.');
    g.sfx('mumble');
    yield leo(g, 'Мм-мм!');
    max.scripted = false;
    yield g.say('sam', 'Дверцу потом прикрой, Макс. Из шкафа дует прошлыми делами.');
    yield g.say('max', 'Там все свои! Парик, мишка, шулер и моя перчатка!');
  }

  TALK.commish = {
    options: [
      { id: 'laws', icon: 'law', text: 'Какие ещё законы он принял?', run: function* (g) {
        yield E.phone(g, 'Экзамен на радость для каждого гражданина. Кто не наберёт четыре улыбки в час, идёт на пересдачу.');
        yield E.phone(g, 'И назначил министром обороны игрушечного солдатика.');
        yield g.say('sam', 'Пластмассового?');
        yield E.phone(g, 'Оловянного. Говорят, стойкий.');
      } },
      { id: 'guard', icon: 'f:superball', text: 'Что говорит Секретная служба?', run: function* (g) {
        yield E.phone(g, 'Я звонил. Трубку взял агент и сказал: «Ответ отрицательный». Я ещё ничего не спросил.');
      } },
      { id: 'why', icon: 'badge', text: 'Почему мы, Комиссар?', run: function* (g) {
        yield E.phone(g, 'Вы не числитесь ни в одном ведомстве. Если вас поймают, я вас не знаю.');
        yield E.phone(g, 'Я и так стараюсь вас не знать.');
      } },
      { id: 'chair', icon: 'f:max', text: 'А если он не сдастся, мне можно на его место?', speaker: 'max', run: function* (g) {
        yield E.phone(g, 'По закону нельзя, Макс.');
        yield g.say('max', 'Законы он теперь пишет сам! Значит, и я напишу!');
        yield E.phone(g, 'Сэм, заберите у него трубку.');
      } },
      { id: 'where', icon: 'car', text: 'Как попасть в Белый дом?', run: function* (g) {
        yield E.phone(g, 'Вашингтон, Пенсильвания-авеню. На вашей машине минут десять, если не читать знаки.');
        yield g.say('sam', 'Мы их не читаем. Макс их собирает.');
      } },
      { id: 'bye', icon: 'bye', text: 'Едем в Вашингтон.', end: true, run: function* (g) {
        yield E.phone(g, 'И, Сэм. Это президент. Постарайтесь обойтись без...');
        yield g.say('sam', 'Без чего?');
        yield E.phone(g, 'Без всего, что вы обычно делаете.');
        hangUp(g);
        g.f.caseOpen = true;
        yield* feedLeonard(g);
      } }
    ]
  };

  const TV_A = ['hugs', 'exam', 'interp', 'bears'];

  function tvProg(g) {
    const f = g.f;
    if (f.elected) return 'rampage';
    if (f.election) return g.count('tvAds') % 2 ? 'adabe' : 'admax';
    const i = f.tvSeg || 0;
    f.tvSeg = i + 1;
    return i < TV_A.length ? TV_A[i] : 'rerun';
  }

  function* watchTv(g) {
    const prog = tvProg(g);
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('tvon');
    g.closeup = { kind: 'tv4', prog, t0: g.time };
    g.music(prog === 'adabe' ? 'campaign' : prog === 'rampage' ? 'abechase' : 'oval');
    const tv = (t, c) => E.tv(g, t, c);
    if (prog === 'hugs') {
      yield pres(g, 'Напоминаю о четверговых объятиях. Уклонистам положен штраф.');
      yield pres(g, 'Или объятие от агента Секретной службы. На выбор агента.');
    } else if (prog === 'exam') {
      yield pres(g, 'С понедельника каждый гражданин сдаёт экзамен на радость. Проходной балл: четыре улыбки в час.');
      yield tv('Бегущая строка: «Улыбки через силу засчитываются».');
    } else if (prog === 'interp') {
      yield tv('Белый дом ищет переводчиков. Сегодня президента посетит губернатор Западной Дакоты.');
      yield pres(g, 'Я слушал его по телефону и не понял ни слова. Нужны переводчики. Любые. Желательно два.');
    } else if (prog === 'bears') {
      yield tv('Новости Капитолия. Каждый конгрессмен получил от неизвестного поклонника плюшевого мишку.');
      yield tv('С тех пор конгресс голосует единогласно. За всё подряд.');
    } else if (prog === 'adabe') {
      yield tv('Авраам Линкольн. Он уже был президентом. Он помнит, где что лежит.');
      yield tv(E.CARDS.life, COLORS.lincoln);
    } else if (prog === 'admax') {
      yield tv('Макс. Один кролик, один закон.');
      yield tv('Голосуйте за меня, или я приду к вам домой! Я приду в любом случае!', COLORS.max);
    } else if (prog === 'rampage') {
      if (g.count('tvNews') === 1) {
        yield tv('Срочно. Мемориал Линкольна идёт на север по девяносто пятому шоссе. За ним остаются очень послушные города.');
        yield tv('Избранный президент пока не сделал заявления.');
      } else yield tv('Мемориал Линкольна прошёл ещё один город. Город согласен со всем и просит добавки.');
    } else {
      yield pres(g, 'Повторяю для тех, кто не обнялся. Обнимитесь.');
    }
    g.closeup = null;
    g.music('office');
    g.f.tvOff = false;
    if (prog === 'hugs') {
      g.f.knowHypno = true;
      yield g.say('sam', 'У него глаза крутятся, Макс. Как у Попперов. Как у Майры.');
      yield g.say('max', 'Гипноз! Значит, его можно стукнуть! По закону медицины!');
    }
    if (prog === 'exam') yield g.say('max', 'Я сдам! Я улыбаюсь даже во сне! Ты сам говорил, что это страшно.');
    if (prog === 'interp') yield g.say('sam', 'Губернатор Западной Дакоты. Северную и Южную я знаю. Западную, видимо, открыли на этой неделе.');
    if (prog === 'bears') {
      g.f.tvDone = true;
      yield g.say('sam', 'Плюшевые мишки в конгрессе. Фабрика Теда И. Бэра взлетела на воздух, а товар, похоже, успел разойтись.');
      yield g.say('max', 'Мишки-сироты! Сэм, давай усыновим конгресс!');
    }
    if (prog === 'adabe') yield g.say('sam', 'То же самое он ответил про налоги, про школы и про погоду. Память у памятника крепкая, одна на всё.');
    if (prog === 'admax') { yield g.say('max', 'Это я! Сэм, у меня фотогеничные зубы!'); yield g.say('sam', 'Ролик снимали четыре минуты. Три из них ты ел микрофон.'); }
    if (prog === 'rampage') {
      if (g.seen.tvNews === 1) { yield g.say('max', 'Сделал! Я сказал «ой»!'); yield g.say('sam', 'Заявление принято. Страна выдохнула и побежала дальше.'); }
      else yield g.say('sam', 'Он идёт быстрее, чем о нём успевают снимать.');
    }
    if (prog === 'rerun') yield g.say('sam', 'Повтор. Он твердит одно и то же, пока оно не становится законом.');
  }

  const MACHINE = [
    ['pres', 'Здравствуйте! Говорит ваш президент. В четверг обнимаемся. Явка обязательна, руки помыть.'],
    ['pres', 'Это снова ваш президент. За первую неделю я спас страну от нашествия механических гиен. Вы их не видели? Вот как хорошо я вас спас.'],
    ['jimmy', 'Начальник, я в отпуске. Скупка закрыта. Будут звонить из налоговой, скажи, что меня съел кот.']
  ];

  function* playMachine(g) {
    const n = g.count('machine') - 1;
    yield g.anim('sam', 'reach', 0.3);
    g.sfx('beep');
    yield 0.4;
    g.f.machineHeard = true;
    if (n >= MACHINE.length) { yield g.say('sam', 'Новых сообщений нет. Старые я бы стёр, но президентов стирать нельзя.'); return; }
    const [who, text] = MACHINE[n];
    yield onLine(g, who, text);
    if (n === 1) yield g.say('max', 'Механические гиены! Сэм, почему нас не позвали?');
    if (n === 2) yield g.say('sam', 'Джимми в отпуске. Впервые за всё время, что живёт в нашей стене.');
  }

  const PIZZA = [
    function* (g) {
      yield E.phone(g, '«Миста Пицца». Две большие с анчоусами уже едут. Голос у вас сегодня бодрее обычного.', C.orange[4]);
      yield g.say('sam', 'Это был не мой голос.');
      yield E.phone(g, 'Платить будет ваш.', C.orange[4]);
    },
    function* (g) {
      yield E.phone(g, 'Опять вы? Курьер стоит у вас под дверью. Вам стоит открыть.', C.orange[4]);
      yield g.say('max', 'Не открывай, Сэм! Пусть пицца настоится!');
    }
  ];

  function* callWhiteHouse(g) {
    g.sfx('dial');
    yield 1.0;
    if (g.f.superHold) {
      g.sfx('busy');
      yield g.say('sam', 'Занято. Суперболл держит линию лично. Я сам его попросил.');
      hangUp(g);
      return;
    }
    yield onLine(g, 'superball', 'Белый дом. Агент Суперболл. Линия служебная.');
    yield g.talkTo('whcall');
  }

  function* callSybil(g) {
    g.sfx('dial');
    yield 1.0;
    yield onLine(g, 'sybil', 'Служба знакомств... Сэм? Не занимай линию! Мне должен позвонить Авраам!');
    hangUp(g);
    yield g.say('sam', 'Бросила трубку. Моим голосом её сегодня не пронять.');
  }

  TALK.dial = {
    start: function* (g) { yield* pickUp(g); },
    end: function* (g) { hangUp(g); },
    options: g => [
      { id: 'wh', icon: 'whitehouse', text: 'Белый дом, ' + E.NUMBER + '.', when: gg => gg.f.knowNumber && !gg.f.puppetDown, end: true, run: function* (gg) { gg.endDialog(); yield* callWhiteHouse(gg); } },
      { id: 'sybil', icon: 'f:sybil', text: 'Сибил, служба знакомств.', when: gg => gg.f.sybilNumber && !gg.f.scandal, end: true, run: function* (gg) { gg.endDialog(); yield* callSybil(gg); } },
      { id: 'pizza', icon: 'pizza', text: 'Пиццерия «Миста Пицца».', run: function* (gg) { gg.sfx('dial'); yield 1.0; yield* PIZZA[(gg.count('pizza') - 1) % PIZZA.length](gg); } },
      { id: 'commish', icon: 'badge', text: 'Комиссар.', run: function* (gg) { yield gg.say('sam', 'Звонить Комиссару без новостей я не рискну. С новостями тоже страшно.'); } },
      { id: 'bye', icon: 'bye', text: 'Положить трубку.', end: true, say: false }
    ]
  };

  TALK.whcall = {
    end: function* (g) { hangUp(g); },
    options: [
      { id: 'baby', icon: 'baby', text: 'Вы проверили, как там ребёнок?', once: true, run: function* (g) {
        yield onLine(g, 'superball', 'Проверил. Спит. Вес в норме. Откуда у вас сведения о ребёнке?');
      } },
      { id: 'zoo', icon: 'paw', text: 'Это зоопарк?', once: true, run: function* (g) {
        yield onLine(g, 'superball', 'Ответ отрицательный. Хотя я понимаю, почему вы спросили.');
      } },
      { id: 'forty', icon: 'pizza', text: 'Вы заказывали сорок пицц с анчоусами?', once: true, run: function* (g) {
        yield onLine(g, 'superball', 'Заказ не подтверждаю. Президент на диете. Это государственная тайна. Прошу её забыть.');
      } },
      { id: 'papa', icon: 'f:agentc', text: 'Говорит Папа-Медведь. Покиньте пост.', when: g => g.f.knowPapa, once: true, run: function* (g) {
        yield onLine(g, 'superball', 'Папа-Медведь сидит за стеной, в пяти шагах от меня. И голос у него ниже.');
        yield g.say('max', 'Я могу ниже! Дай трубку!');
      } },
      { id: 'hold', icon: 'hold', text: 'Оставайтесь на линии. Ваш звонок очень важен для нас.', end: true, run: function* (g) {
        yield onLine(g, 'superball', 'Принято. Жду.');
        g.f.superHold = true;
        yield g.say('sam', 'Пусть слушает, как у нас тикают часы. Музыки для ожидания у Вольной полиции нет.');
        yield g.say('max', 'Он будет ждать вечно! Сэм, мы изобрели тюрьму из вежливости!');
      } },
      { id: 'bye', icon: 'bye', text: 'Ошиблись номером.', end: true, run: function* (g) {
        yield onLine(g, 'superball', 'Принято. Конец связи.');
      } }
    ]
  };

  const ASK = [
    'Служба знакомств, Сибил Пандемик. Кто говорит?',
    'Авраам! Вы прочли мою записку? Вы зовёте меня... на свидание?',
    'Да! То есть я сверюсь с расписанием. Да! Где мы встретимся?',
    'У Белого дома! Как в кино. А когда?'
  ];
  const WANT = ['iam', 'day', 'steps', 'now'];
  const VOICE_ICON = { citizens: 'voice', honest: 'yes', iam: 'f:lincoln', steps: 'whitehouse', day: 'calendar', now: 'hold', chains: 'fist' };
  const MISS = [
    'Простите, Авраам, я не расслышала. В трубке шуршит, будто кто-то перебирает усиками.',
    'Вы говорите загадками. Это мило, но сначала ответьте.',
    'Повторите, пожалуйста. Связь у вас как из девятнадцатого века.'
  ];

  TALK.bugcall = {
    end: function* (g) { hangUp(g); },
    options: (g, d) => E.SPEECH.map(([id, text]) => ({
      id, icon: VOICE_ICON[id], text: 'Жучок: «' + text + '»', say: false,
      run: function* (gg) {
        const step = d.data.step || 0;
        yield gg.say(null, text, { key: 'bugplay', color: COLORS.lincoln, x: 70, y: 126 });
        if (id !== WANT[step]) {
          yield onLine(gg, 'sybil', MISS[(gg.count('bugmiss') - 1) % MISS.length]);
          yield onLine(gg, 'sybil', ASK[step]);
          return;
        }
        d.data.step = step + 1;
        if (step < 3) { yield onLine(gg, 'sybil', ASK[step + 1]); return; }
        yield onLine(gg, 'sybil', 'Сейчас?! Бегу! Не сходите со ступеней!');
        gg.endDialog();
        hangUp(gg);
        gg.f.sybilCalled = true;
        yield gg.say('sam', 'Она уже бежит. В машину, Макс. Такое надо видеть своими глазами.');
        yield* E.scandal(gg);
      }
    })).concat([{ id: 'bye', icon: 'bye', text: 'Повесить трубку.', end: true, say: false, run: function* (gg) { yield onLine(gg, 'sybil', 'Алло? Авраам? Пропал. Мужчины.'); } }])
  };

  function* bugCall(g) {
    const f = g.f;
    if (f.scandal) { yield g.say('sam', 'Голосом Линкольна я уже наговорил достаточно. Сибил до сих пор не простила.'); return; }
    if (!f.sybilNumber) {
      yield g.say('sam', 'Сержант умеет говорить чужими голосами. Счёт из пиццерии это подтверждает.');
      yield g.say('max', 'В пиццерию! Голосом президента!');
      return;
    }
    if (f.bugRec !== 'lincoln') { yield g.say('sam', 'Сержант, голосом Линкольна можешь?'); yield E.bug(g, 'Никак нет, сэр! Объект не записан, сэр!'); return; }
    yield* pickUp(g);
    yield g.say('sam', 'Сержант, к трубке. Говорить будете тем, что записали.');
    yield E.bug(g, 'Есть, сэр! Лента заряжена, сэр!');
    g.sfx('dial');
    yield 1.0;
    yield onLine(g, 'sybil', ASK[0]);
    yield g.talkTo('bugcall');
  }

  function* putHead(g) {
    if (!g.f.closetOpen) { yield g.say('sam', 'Шкаф закрыт. Сквозь дверцу улики не подшивают.'); return; }
    yield g.anim('sam', 'reach', 0.5);
    g.drop('head');
    g.f.headInCloset = true;
    g.sfx('drop');
    yield g.say('sam', 'Улика четвёртого дела. На полке она смотрится честнее, чем на плечах.');
    yield g.say('max', 'Мишка, это президент! Президент, это мишка! У вас много общего, вы оба набиты опилками!');
    g.sfx('mumble');
    yield leo(g, 'Мм?');
  }

  const CLOSET = {
    name: 'Шкаф', walk: [240, 136], face: 'n',
    items: { head: function* (g) { yield* putHead(g); } },
    look: g => !g.f.closetOpen ? 'Шкаф. Три дела, три улики. Одна из улик мычит.' : g.f.headInCloset ? 'Шкаф с уликами. Шулер, мишка и голова президента. Четыре дела, и полки уже не хватает.' : 'Шкаф с уликами трёх дел. Леонард в парике Брэди, Мистер Мишка на полке, пистолет с пистонами на гвозде.',
    use: function* (g) {
      yield g.anim('sam', 'reach', 0.4);
      g.sfx('door');
      g.f.closetOpen = !g.f.closetOpen;
      if (g.f.closetOpen && !g.seen.closet104) {
        g.seen.closet104 = 1;
        yield g.say('max', 'Привет, Мистер Мишка! Привет, Леонард! Парик тебе к лицу!');
        g.sfx('mumble');
        yield leo(g, 'Мм!');
      }
    }
  };

  function* takeGlove(g) {
    yield g.anim('sam', 'reach', 0.5);
    g.f.gloveTaken = true;
    g.give('glove');
    yield g.say('sam', 'Перчатка Макса. В прошлый раз она сняла гипноз с одного удара. Лекарства надёжнее у нас нет.');
    yield g.say('max', 'Только бить буду я! У меня поставлен удар!');
  }

  ROOMS.office = {
    id: 'office', name: 'Офис Сэма и Макса', w: 320, music: 'office',
    paint: b => S.BG.office(b, {}),
    walk: [[40, 132, 258, 132, 316, 162, 316, 198, 4, 198, 4, 156, 36, 134]],
    block: [[0, 152, 96, 147, 112, 158, 112, 200, 0, 200]],
    layers: [
      { id: 'closetOpen', x: 222, y: 38, when: g => g.f.closetOpen },
      { id: 'mrbear', x: 224, y: 42, when: g => g.f.closetOpen, key: g => Math.floor(g.time * 3) % 8 },
      { id: 'leoCloset', x: 222, y: 38, when: g => g.f.closetOpen },
      { id: 'glove', x: 246, y: 53, when: g => g.f.closetOpen && !g.f.gloveTaken },
      { id: 'head', x: 245, y: 47, when: g => g.f.closetOpen && g.f.headInCloset },
      { id: 'capgun', x: 250, y: 74, when: g => g.f.closetOpen },
      { id: 'sign', x: 182, y: 110 },
      { id: 'desk', x: 0, y: 138, base: 176 },
      { id: 'phone', x: 46, y: 142, base: 177 },
      { id: 'machine', x: 74, y: 145, base: 178, key: g => g.f.machineHeard ? 'h' : Math.floor(g.time * 2) % 2 }
    ],
    drawBack(f, g, cx) {
      if (g.f.tvOff) return;
      for (let y = 63; y < 84; y++) for (let x = 176; x < 205; x++) f.set(x - cx, y, y < 76 ? C.blue[2] : C.blue[1]);
      const P = new S.Pen(f).at(190 - cx, 75, 0.34);
      if (g.f.elected) { const m = S.sprite('max', { act: 'head' }, 0.5); S.blit(f, m.buf, 190 - cx - m.ox, 84 - m.oy); }
      else if (g.f.election) S.art104.lincolnHead(new S.Pen(f).at(190 - cx, 80, 0.3), 0, 0, { talk: Math.floor(g.time * 5) % 2 === 0 });
      else S.art104.presHead(P, 0, 0, { talk: Math.floor(g.time * 6) % 3 !== 0 });
      for (let i = 0; i < 5; i++) f.set(178 + i * 6 - cx, 64, i % 2 ? C.red[3] : C.grey[5]);
    },
    hot: [
      { id: 'edoor', name: 'Дверь на улицу', poly: [276, 32, 306, 23, 306, 170, 276, 142], walk: [284, 162], face: 'e',
        look: 'Наша дверь. Надпись на стекле изнутри читается задом наперёд. Макс уверен, что это шифр.',
        exit: function* (g) {
          if (!g.f.caseOpen) { yield g.say('sam', 'Комиссар ещё говорит. Если уйти, он будет говорить с пустым офисом, и ему понравится.'); return; }
          g.sfx('door');
          yield* g.goRoom('street', { x: 300, y: 146, dir: 's' });
        } },
      { id: 'tv', name: 'Телевизор', poly: [172, 60, 212, 58, 213, 87, 172, 88], walk: [192, 136], face: 'n',
        look: g => g.f.tvOff ? 'Телевизор выключен. Президент от этого никуда не делся.' : g.f.elected ? 'По телевизору Макс. Экран маловат для его улыбки.' : g.f.election ? 'По телевизору агитация. Статуя против кролика, и обоих показывают бесплатно.' : 'По телевизору президент. Говорит и улыбается одновременно. Глаза у него крутятся.',
        use: function* (g) { yield* watchTv(g); },
        items: {
          gun: 'Стрелять в президента по телевизору? За это пока не сажают. Он, наверное, уже пишет закон.',
          glove: 'Бить телевизор перчаткой бесполезно. Гипноз сидит в студии, а она в Вашингтоне.',
          roach: function* (g) { yield E.bug(g, 'Объект говорит на всю страну, сэр! Подслушивать нечего, сэр!'); }
        } },
      { id: 'vcr', name: 'Видеомагнитофон', rect: [177, 88, 31, 10], walk: [192, 136], face: 'n',
        look: 'Видеомагнитофон. На часах «00:00». Его единственного в стране не заставили ничего регистрировать.',
        use: 'Кассет нет. Все лежат в скупке у Джимми, а скупка в отпуске.' },
      { id: 'phone', name: 'Телефон', rect: [44, 140, 26, 16], walk: [104, 150], face: 'w', over: true,
        look: 'Наш телефон. Через него к нам приходят все беды и одна пицца в неделю.',
        use: function* (g) { yield g.talkTo('dial'); },
        items: {
          roach: function* (g) { yield* bugCall(g); },
          gun: 'Стрелять в телефон? Комиссар перезвонит на другой.',
          flyer: 'Листовку в трубку не засунешь. Бумага молчит, даже если на ней написано «Ты нужен мне».'
        } },
      { id: 'machine', name: 'Автоответчик', rect: [74, 145, 16, 10], walk: [108, 154], face: 'w', over: true,
        look: g => g.f.machineHeard ? 'Автоответчик. Лампочка погасла. Лента хранит президента и одну крысу.' : 'Автоответчик. Лампочка мигает. Кто-то наговорил нам на ленту.',
        use: function* (g) { yield* playMachine(g); } },
      { id: 'desk', name: 'Стол', poly: [0, 156, 92, 150, 108, 158, 108, 200, 0, 200], walk: [118, 164], face: 'w',
        look: 'Мой стол. Квитанция за свет, кружка и свежая газета. На первой полосе президент обнимает оператора.',
        use: 'В ящиках пусто. Рапорты я пишу в уме, там больше места.' },
      Object.assign({ id: 'closet', poly: [224, 42, 260, 40, 260, 128, 224, 128], when: g => !g.f.closetOpen }, CLOSET),
      Object.assign({ id: 'closetin', rect: [222, 38, 47, 92], when: g => g.f.closetOpen }, CLOSET),
      { id: 'mrbear', name: 'Мистер Мишка', rect: [226, 44, 19, 22], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: ['Мистер Мишка из студии Майры. Обугленный, в скотче. Глаза до сих пор крутятся, теперь против часовой.', 'Клеймо на ярлыке: «Фабрика игрушек Теда И. Бэра». Фабрики больше нет. Мишка пережил всех своих начальников.'],
        use: function* (g) {
          g.sfx('zap');
          yield g.say('sam', 'Щёлкает током и шипит. Характер у него не улучшился.');
        },
        items: {
          head: function* (g) { yield* putHead(g); },
          dater: function* (g) { g.sfx('scan'); yield g.say('sam', 'Мишке два года. Один из них он провёл в прямом эфире.'); },
          glove: 'Бить обугленного мишку? Его уже наказал стакан воды.',
          gun: 'Мишка пережил короткое замыкание. Пулю он примет за знак внимания.',
          serum: 'У мишки зашит рот. Правду он говорит глазами, и лучше её не слушать.'
        } },
      { id: 'glove', name: 'Перчатка Макса', rect: [246, 53, 13, 14], when: g => g.f.closetOpen && !g.f.gloveTaken, walk: [240, 136], face: 'n', over: true,
        look: 'Боксёрская перчатка Макса, улика первого дела. Лежит на полке рядом с мишкой. Мишка её побаивается.',
        use: function* (g) { yield* takeGlove(g); } },
      { id: 'preshead', name: 'Голова президента', rect: [245, 47, 14, 19], when: g => g.f.closetOpen && g.f.headInCloset, walk: [240, 136], face: 'n', over: true,
        look: 'Голова президента. Дерево, шарниры и улыбка на петлях. Улика четвёртого дела.',
        use: 'Пусть стоит. Она и без туловища выглядит избранной.' },
      { id: 'capgun', name: 'Пистолет с пистонами', rect: [250, 74, 9, 10], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Пистонный пистолет Леонарда. Висит на гвозде так, чтобы Леонард его видел и не мог достать.',
        use: 'Пусть висит. Это улика и единственное развлечение Леонарда.' },
      { id: 'leocloset', name: 'Леонард', rect: [226, 72, 22, 54], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Леонард Стейкчармер, шулер из прошлого дела. Сидит у нас вторую неделю. Парик Брэди ему великоват, но идёт.',
        talk: function* (g) {
          g.sfx('mumble');
          yield leo(g, 'Мм-мм-мм! Мм!');
          yield g.say('sam', g.f.election && !g.f.elected ? 'Он говорит, что голосовал бы за Линкольна. Или просит пить. Через скотч не разобрать.' : 'Он говорит, что мама его ищет. Или что пицца остыла. Через скотч не разобрать.');
        },
        use: 'Выпускать рано. Мафии больше нет, но вдруг она про него вспомнит.',
        items: {
          dater: function* (g) { g.sfx('scan'); yield g.say('sam', 'Девятнадцать лет. Леонард, ты же говорил, что тебе тридцать.'); g.sfx('mumble'); yield leo(g, 'Мм!'); yield g.say('max', 'Он говорит: «Мама не велела называть возраст»!'); },
          glove: 'Бить связанного? У перчатки есть кодекс. Пункт первый как раз об этом.',
          serum: 'Рот у него заклеен, сыворотка не пройдёт. Правду про маму я и так уже слышал.',
          flyer: function* (g) { g.sfx('mumble'); yield leo(g, 'Мм-м.'); yield g.say('sam', 'Леонард мычит и мотает головой. За статую он не голосует.'); },
          roach: function* (g) { yield E.bug(g, 'Объект мычит, сэр! Расшифровке не поддаётся!'); },
          gun: 'Он связан и в парике. Хуже ему уже не сделать.',
          max: function* (g) { yield g.say('max', 'Леонард, хочешь в мой кабинет министров? Министром шкафов!'); g.sfx('mumble'); yield leo(g, 'Мм?'); }
        } },
      { id: 'hole', name: 'Нора Джимми', rect: [203, 114, 16, 15], walk: [204, 138], face: 'n',
        look: 'Нора Джимми Два Зуба. На табличке «Уехал». Изнутри не пахнет даже сыром.',
        use: 'Совать лапу в пустую нору? Пустые кусаются реже, но проверять я не буду.',
        talk: function* (g) { yield g.say('sam', 'Джимми!'); yield 0.8; yield g.say('sam', 'Тишина. Он и правда уехал. Даже эхо не торгуется.'); },
        items: { gun: 'Стрелять в пустую нору? Патроны мне ещё понадобятся в столице.', roach: function* (g) { yield E.bug(g, 'В норе пусто, сэр! Противник в отпуске, сэр!'); } } },
      { id: 'sign', name: 'Табличка', rect: [182, 110, 32, 10], walk: [196, 138], face: 'n',
        look: '«Уехал». Ниже мелко: «Скупка закрыта. Краденое оставлять у двери. Джимми Два Зуба».' },
      { id: 'window', name: 'Окно', poly: [100, 30, 164, 28, 164, 96, 100, 98], walk: [134, 134], face: 'n',
        look: 'Дом напротив завешан плакатами «Обнимись с соседом». По одному на этаж. Соседи держат дистанцию.',
        use: 'Открывать не буду. С улицы тянет единодушием.' },
      { id: 'cabinet', name: 'Картотека', poly: [40, 62, 90, 58, 90, 124, 41, 129], walk: [66, 136], face: 'n',
        look: 'Картотека. Три закрытых дела: кассеты, телестудия и казино. Четвёртая папка пока пустая и уже тяжёлая.',
        use: 'Подшивать пока нечего. Президентов в картотеку заносят после срока.' },
      { id: 'picture', name: 'Картина', rect: [43, 17, 39, 33], walk: [62, 136], face: 'n',
        look: 'Собаки играют в покер. После Леонарда я смотрю на неё с сочувствием к проигравшим.',
        use: 'Висит криво. В этом кабинете ровно висит только Леонард.' },
      { id: 'rack', name: 'Вешалка', rect: [10, 50, 22, 78], walk: [42, 146], face: 'w', look: 'Вешалка. Пустая. Шляпу я в помещении не снимаю, под ней казённое имущество.', use: 'Вешать нечего. Дуршлаг на вешалке вызовет вопросы.' },
      { id: 'switch', name: 'Выключатель', rect: [266, 73, 9, 14], walk: [262, 142], face: 'e', look: 'Выключатель.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.3);
          g.sfx('click');
          g.fx.dark = !g.fx.dark;
          yield g.say(g.fx.dark ? 'max' : 'sam', g.fx.dark ? 'Сэм! Мишка светится из шкафа! А Леонард мычит, что боится темноты!' : 'Со светом спокойнее. Хотя бы видно, кто на тебя смотрит.');
        } },
      { id: 'crate', name: 'Ящик', rect: [176, 99, 33, 30], walk: [192, 138], face: 'n', look: 'Ящик «FRAGILE». На нём стоит телевизор, в нём лежит то, что не влезло в шкаф.', use: 'Не открою. Телевизор упадёт, и президент разобьётся раньше времени.' },
      { id: 'bulb', name: 'Лампочка', rect: [144, 0, 12, 19], look: 'Лампочка. Сорок ватт. Новый закон о радости требует шестьдесят.', use: 'Не дотянусь. Макс дотянется, но просить его я не стану.' }
    ],
    enter: function* (g) {
      if (g.f.superHold && !g.seen.holdBack && !g.f.presMet) { g.seen.holdBack = 1; yield g.say('max', 'Трубка лежит, Суперболл ждёт. Сэм, я слышу, как он дышит. Ровно.'); }
    },
    setup(g) { g.fx.dark = false; },
    onLoad(g) { ROOMS.office.setup(g); }
  };

  E.ending = function* (g) {
    const max = g.actors.max, sam = g.actors.sam;
    const shelved = g.f.headInCloset;
    yield g.fadeOut(1);
    g.fx.dark = false;
    g.f.frozen = false;
    g.f.closetOpen = true;
    g.f.headTaken = true;
    g.f.headInCloset = true;
    g.f.tvOff = false;
    g.drop('head');
    g.setRoom('office', { x: 238, y: 140, dir: 'n' });
    max.follow = 'sam'; max.scripted = true; max.act = ''; max.keepAct = false; max.visible = true;
    sam.act = ''; sam.keepAct = false;
    g.place('max', 'office', 200, 152, 'e');
    g.music('office');
    g.hideUI = true;
    yield g.fadeIn(1);
    yield g.say('sam', shelved ? 'Голова президента уже стоит на полке рядом с мишкой. В нашем шкафу теперь больше власти, чем в конгрессе.' : 'Голову президента на полку, к мишке. В нашем шкафу теперь больше власти, чем в конгрессе.');
    yield g.say('max', 'Вице-президентом назначаю Мистера Мишку! Он обугленный, молчит и светится в темноте!');
    g.sfx('mumble');
    yield leo(g, 'Мм-мм-мм!');
    yield g.say('max', 'Леонард просится в министры!');
    yield g.say('sam', 'Сиди, Леонард. В правительстве уже есть один мишка, и тот вице-президент.');
    yield* ring(g, 2);
    yield* pickUp(g, 'Вольная полиция. Приёмная президента.');
    yield E.phone(g, 'Сэм, мне звонят из сорока штатов. Спрашивают, правда ли президент кролик.');
    yield g.say('sam', 'Правда, Комиссар. Он стоит рядом и жуёт первую поправку.');
    yield E.phone(g, 'Тогда передайте господину президенту мою отставку.');
    yield g.say('max', 'Отклоняю! Кто-то же должен за нас волноваться!');
    hangUp(g);
    yield g.say('max', 'Сэм, включай телевизор! Там моё обращение к нации!');
    g.sfx('tvon');
    g.closeup = { kind: 'tv4', prog: 'maxtv', t0: g.time };
    g.music('credits4');
    yield E.tv(g, 'Сограждане! Пудинг свободен! Обниматься можно с кем хочешь и когда хочешь!', COLORS.max);
    yield E.tv(g, 'Пистолеты никто не перепишет. Я свой сам не помню, где оставил.', COLORS.max);
    yield E.tv(g, 'Не раскисай, Америка!', COLORS.max);
    yield g.fadeOut(0.5);
    g.closeup = null;
    g.hideUI = false;
    g.ended = true;
  };

  E.startNewGame = function (g) {
    E.newGame(g);
    g.setRoom('office');
    g.fade = 1; g.fadeTo = 1;
    g.run(intro, { name: 'intro' });
  };

  E.office = { intro, ring, pickUp, hangUp, bugCall, watchTv };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
