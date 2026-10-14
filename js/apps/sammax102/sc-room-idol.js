(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP102;
  const { ROOMS, TALK } = E;

  const VERSES = [
    [
      { id: 'a', icon: 'f:myra', text: 'Майра, отпусти народ домой...' },
      { id: 'b', icon: 'f:sam', text: 'Я пёс в костюме, я пою для вас...' },
      { id: 'c', icon: 'f:max', text: 'Мой напарник кролик, он со мной...' }
    ],
    [
      { id: 'a', icon: 'toaster', text: '...и тостеры с собой возьми!' },
      { id: 'b', icon: 'star', text: '...а шляпу я не сниму!' },
      { id: 'c', icon: 'mic', text: '...и он жуёт микрофон!' }
    ]
  ];

  function* peepersSong(g) {
    const pp = g.actors.peepers;
    pp.scripted = true;
    g.place('peepers', 'idol', 136, 148, 's');
    pp.act = 'sing'; pp.keepAct = true;
    yield g.say('director', 'В эфире «Позорный идол»! Действующий чемпион сорок три недели подряд: Пиперс!');
    g.sfx('applause');
    yield g.say('peepers', 'Я си-и-иний? Я си-и-иний?');
    yield g.say('peepers', 'Кто ты тако-о-ой? Кто ты тако-ой?');
    yield g.say('peepers', 'Умею ли я лета-а-ать? Где мой второ-ой носо-ок?');
    pp.act = ''; pp.keepAct = false;
    yield g.say('director', 'Судьи?');
    yield g.say('specs', 'Ни одной высокой ноты. Нет.');
    yield g.say('whizzer', 'Да! Мой брат лучший! Семья!');
    yield g.say('director', 'Один голос за, один против. При ничьей чемпион сохраняет титул. Пиперс, до четверга.');
    yield g.say('peepers', 'Опять я. Сорок четвёртая неделя. Горло.');
    yield g.walkTo('peepers', 84, 146);
    g.face('peepers', 's');
    pp.scripted = false;
    g.f.idolSeen = true;
    yield g.say('max', 'Сэм, у них под сценой бассейн с кислотой! И с акулами! Я хочу выступить!');
    yield g.say('sam', 'Сначала узнаем правила. Желательно до того, как в него упадём.');
  }

  function* dropSam(g) {
    const sam = g.actors.sam;
    g.sfx('trapdoor');
    yield g.say('director', 'Люк!');
    sam.visible = false;
    g.sfx('splash');
    g.fx.shake = 0.5;
    yield 1.0;
    yield g.say(null, 'Бульк.', { key: 'pit', color: C.slime[4], x: 136, y: 160 });
    g.place('sam', 'idol', 44, 180, 'e');
    sam.visible = true;
    const n = g.count('pitfall');
    if (n === 1) {
      yield g.say('sam', 'Кислота с акулами. Акулы, к счастью, травоядные. А кислоту, похоже, разбавляли.');
      yield g.say('max', 'Сэм, ты светишься! Можно я тоже нырну?');
    } else yield g.say('sam', 'Снова здравствуйте, акулы. Одна из них уже машет мне плавником.');
  }

  function* win(g) {
    g.sfx('cheer');
    yield g.say('director', 'Единогласно! Один голос из одного! Победитель «Позорного идола»: Сэм из «Ковбоев из центра»!');
    yield g.say('peepers', 'Наконец. Отпуск.');
    g.give('contract');
    g.f.contractWon = true;
    yield g.say('director', 'Контракт на запись пластинки. Подпишите тут, тут и вот здесь. Кровью. Шучу. Ручкой.');
    yield g.say('sam', 'Контракт есть. Моя карьера певца началась и закончилась за один вечер. Как у многих.');
  }

  function* judge(g) {
    const high = g.f.highSang;
    const here = !g.f.whizzerGone;
    g.f.high = false;
    g.f.highSang = false;
    yield g.say('director', 'Судьи!');
    if (high) yield g.say('specs', 'Третья октава! У меня треснули очки! Да, да и ещё раз да!');
    else yield g.say('specs', 'Низковато. Искусство живёт выше. Нет.');
    if (here) yield g.say('whizzer', 'Нет! Только Пиперс! Семья!');
    if (high && !here) { yield* win(g); return; }
    if (high && here) yield g.say('director', 'Голоса разделились. Чемпион остаётся чемпионом, а претендент отправляется...');
    else yield g.say('director', 'Претендент не прошёл. Претендент отправляется...');
    yield* dropSam(g);
  }

  function* perform(g) {
    if (g.f.contractWon) { yield g.say('director', 'Вы уже победили. Побеждать дважды за вечер у нас неприлично.'); return; }
    if (!g.f.idolSeen) return;
    yield g.say('director', 'У нас претендент! Сэм из «Ковбоев из центра»! Маэстро, музыку!');
    g.f.songLine = 0;
    yield g.talkTo('song');
  }

  TALK.song = {
    options: g => VERSES[g.f.songLine || 0].map(o => ({
      id: o.id, icon: o.icon, text: o.text, say: false,
      run: function* (gg) {
        const i = gg.f.songLine || 0;
        if (i === 0 && gg.f.high) {
          gg.f.highSang = true;
          yield E.squeak(gg, o.text.replace('...', ''));
          gg.fx.shake = 0.2;
        } else yield gg.say('sam', o.text);
        gg.f.songLine = i + 1;
        if (gg.f.songLine >= VERSES.length) {
          gg.endDialog();
          yield* judge(gg);
        }
      }
    }))
  };

  function* giveCake(g) {
    const wz = g.actors.whizzer;
    yield g.say('sam', 'Уиззер, с днём рождения. Это от нас.');
    yield g.say('whizzer', 'Торт? Мне?! С красной глазурью! Как у мамы!');
    yield g.say('whizzer', 'Спекс, смотри! Про мой день рождения помнят! Чужие люди помнят!');
    yield g.say('specs', 'Я тоже помнил. Внутренне.');
    g.drop('kcake');
    g.sfx('eat');
    yield 1.0;
    yield g.say('whizzer', 'Вкусно... Кисленько... Погодите. Это не глазурь. Это КЕТЧУП!');
    yield g.say('whizzer', 'Помидоры! ТАЙМ-АУТ НОМЕР ДВА-А-А!');
    wz.scripted = true;
    yield g.walkTo('whizzer', 8, 176, { speed: 1.6 });
    g.place('whizzer', 'nowhere', 0, 0);
    wz.scripted = false;
    g.f.whizzerGone = true;
    g.sfx('door');
    yield g.say('specs', 'Он вернётся. Минут через сорок. Если повезёт, через час.');
    yield g.say('director', 'Судейская коллегия сокращена до одного судьи. Так даже быстрее.');
  }

  TALK.diridol = {
    options: [
      { id: 'rules', icon: 'q', text: 'Как тут побеждают?', run: function* (g) {
        yield g.say('director', 'Поёте, судьи голосуют. Два голоса за, вы победили. Иначе люк.');
        yield g.say('director', 'При ничьей титул остаётся у чемпиона. Чемпион у нас Пиперс. Сорок четыре недели.');
      } },
      { id: 'pit', icon: 'ex', text: 'Зачем под сценой кислота?', run: function* (g) {
        yield g.say('director', 'Чтобы шоу было интереснее.');
        yield g.say('max', 'И как, интереснее?');
        yield g.say('director', 'Только когда кто-нибудь падает.');
      } },
      { id: 'sing', icon: 'mic', text: 'Я хочу выступить.', end: true, when: g => g.f.idolSeen && !g.f.contractWon, run: function* (g) {
        g.endDialog();
        yield g.walkTo('sam', 136, 150);
        g.face('sam', 's');
        yield* perform(g);
      } },
      { id: 'bye', icon: 'bye', text: 'Мы подумаем.', end: true, run: function* (g) { yield g.say('director', 'Думайте быстрее. Акулы ждут.'); } }
    ]
  };

  TALK.specs = {
    options: [
      { id: 'judge', icon: 'note', text: 'За что вы голосуете?', run: function* (g) {
        yield g.say('specs', 'За высокие ноты. Настоящее искусство живёт в третьей октаве.');
        yield g.say('specs', 'Пиперс поёт так низко, что у меня дрожат очки. Когда-нибудь я проголосую за того, кто их расколет.');
        g.f.knowHigh = true;
      } },
      { id: 'brother', icon: 'f:peepers', text: 'Вы голосуете против брата?', run: function* (g) {
        yield g.say('specs', 'Искусство выше родства. Уиззер со мной не согласен. Уиззер вообще ни с кем не согласен, пока его не отпустят в туалет.');
      } },
      { id: 'bday', icon: 'pinkcake', text: 'Уиззер говорит, у него сегодня день рождения.', when: g => g.f.knowBday, run: function* (g) {
        yield g.say('specs', 'Мы тройняшки. У нас общий день рождения. Если я забыл его день рождения, я забыл и свой. Мне обиднее.');
      } },
      { id: 'how', icon: 'tv', text: 'Как вы стали судьями?', once: true, run: function* (g) {
        yield g.say('specs', 'После истории с Брэди нам предложили судейство. Сказали, бывшие звёзды хорошо судят. Мы судим. В основном друг друга.');
      } },
      { id: 'bye', icon: 'bye', text: 'Не буду мешать.', end: true, run: function* (g) { yield g.say('specs', 'Мешайте. Всё лучше, чем Пиперс.'); } }
    ]
  };

  TALK.whizzer = {
    options: [
      { id: 'vote', icon: 'f:peepers', text: 'Ты всегда голосуешь за Пиперса?', run: function* (g) {
        yield g.say('whizzer', 'Всегда! Он мой брат. Он поёт как Пиперс. Мне больше и не надо.');
      } },
      { id: 'sad', icon: 'q', text: 'Почему такой грустный?', run: function* (g) {
        yield g.say('whizzer', 'У меня сегодня день рождения. Спекс забыл. Никто не подарил мне торт.');
        yield g.say('whizzer', 'В детстве мама всегда пекла торт с красной глазурью. Я так любил красную глазурь.');
        g.f.knowBday = true;
      } },
      { id: 'food', icon: 'noodles', text: 'Что ты не ешь?', run: function* (g) {
        yield g.say('whizzer', 'Помидоры! Никогда! Ни в каком виде! Одна капля кетчупа, и мне срочно нужен тайм-аут номер два.');
        yield g.say('whizzer', 'Вы понимаете, о чём я. Все понимают. Мама понимала.');
        g.f.knowTomato = true;
      } },
      { id: 'toilet', icon: 'duck', text: 'Тебе всё ещё всё время надо?', once: true, run: function* (g) {
        yield g.say('whizzer', 'Только когда нервничаю. На телевидении я нервничаю всегда. Даже сейчас. Особенно сейчас.');
      } },
      { id: 'bye', icon: 'bye', text: 'С днём рождения, Уиззер.', end: true, when: g => g.f.knowBday, run: function* (g) { yield g.say('whizzer', 'Спасибо! Вы первый! Ну, кроме мамы. Мама звонила в шесть утра.'); } },
      { id: 'bye2', icon: 'bye', text: 'Пока, Уиззер.', end: true, when: g => !g.f.knowBday, run: function* (g) { yield g.say('whizzer', 'Пока. Я никуда не ухожу. Мне нельзя. Я судья.'); } }
    ]
  };

  TALK.peepers = {
    options: [
      { id: 'song', icon: 'note', text: 'О чём твоя песня?', run: function* (g) { yield g.say('peepers', 'Вопросы. Одни вопросы. Ответов нет. Как в жизни.'); } },
      { id: 'lyrics', icon: 'lyrics', text: 'Можно взять слова песни?', when: g => g.f.idolSeen && !g.f.lyricsTaken, end: true, run: function* (g) {
        yield g.say('peepers', 'Бери. Наизусть знаю. Сорок четыре недели.');
        g.endDialog();
        yield* takeLyrics(g);
      } },
      { id: 'myra', icon: 'f:myra', text: 'Ты был у Майры?', run: function* (g) {
        yield g.say('peepers', 'Звали. Не пошли. У неё на столе медведь. Глаза крутятся.');
        yield g.say('peepers', 'Мы такое видели. У Брэди. Хватит.');
      } },
      { id: 'champ', icon: 'star', text: 'Каково быть чемпионом?', run: function* (g) { yield g.say('peepers', 'Скучно. Каждую неделю. Одна песня. Хочу проиграть. Не дают.'); } },
      { id: 'bye', icon: 'bye', text: 'Береги горло.', end: true, run: function* (g) { yield g.say('peepers', 'Берегу. Молчу. Шесть дней в неделю.'); } }
    ]
  };

  function* takeLyrics(g) {
    if (g.f.lyricsTaken) return;
    yield g.walkTo('sam', 90, 148);
    g.face('sam', 'w');
    yield g.anim('sam', 'reach', 0.5);
    g.give('lyrics');
    g.f.lyricsTaken = true;
    yield g.say('sam', 'Слова песни Пиперса. Одни вопросы. Где-то в этом здании есть ведущий, который только и делает, что задаёт вопросы.');
  }

  function judgeHot(id, name) {
    return {
      name, walk: [id === 'specs' ? 232 : 270, 178], face: 'n', dist: 20,
      when: g => g.actors[id].room === 'idol',
      look: id === 'specs' ? 'Спекс, судья. Очки толщиной с аквариум. Говорит, что слышит третью октаву кожей.' : 'Уиззер, судья. Переминается с ноги на ногу под столом. На столе перед ним табличка и бумажный колпачок.',
      talk: function* (g) { yield g.talkTo(id); },
      items: id === 'specs' ? {
        cake: function* (g) { yield g.say('specs', 'Торт? Я на диете. Из искусства.'); },
        kcake: function* (g) { yield g.say('specs', 'Это для Уиззера? Отдайте ему. У него сегодня... ах да.'); },
        modulator: function* (g) { yield g.say('specs', 'Мне? Я судья, я не пою. Вдохните сами и удивите меня.'); },
        gun: function* (g) { yield g.say('specs', 'Угрозы на меня не действуют. Я судил «Позорного идола» сорок четыре недели.'); }
      } : {
        kcake: function* (g) { yield* giveCake(g); },
        cake: function* (g) { yield g.say('whizzer', 'Торт? Мне?.. Он розовый. А у мамы был красный. Спасибо, конечно. Я лучше погрущу дальше.'); g.f.knowBday = true; },
        gun: function* (g) { yield g.say('whizzer', 'Не пугайте меня! Мне сразу надо!'); },
        modulator: function* (g) { yield g.say('whizzer', 'Шарик? Мне? На день рождения? ...А, нет. Спасибо, я лучше без газа.'); }
      }
    };
  }

  ROOMS.idol = {
    id: 'idol', name: 'Площадка «Позорный идол»', w: 320, music: 'idol',
    paint: b => S.BG.idol(b),
    walk: [[34, 126, 286, 126, 296, 150, 24, 150], [22, 148, 60, 148, 62, 166, 20, 166], [0, 164, 320, 164, 320, 198, 0, 198]],
    layers: [
      { id: 'stand', x: 70, y: 120, base: 150, key: g => g.f.lyricsTaken ? 't' : '' },
      { id: 'mic', x: 130, y: 106, base: 151 },
      { id: 'judges', x: 222, y: 124, base: 164, key: g => g.f.whizzerGone ? 'g' : '' }
    ],
    hot: [
      { id: 'exit', name: 'Выход в коридор', rect: [0, 38, 22, 98], walk: [16, 176], face: 'w', look: 'Дверь за кулисы. Возле неё табличка: «Проигравшим выход через люк».',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('warp', { x: 399, y: 150, dir: 's' }); } },
      { id: 'sign', name: 'Вывеска', rect: [70, 8, 180, 34], look: '«ПОЗОРНЫЙ ИДОЛ». Буквы мигают по очереди. «О» перегорела, но это только добавляет позора.' },
      { id: 'mic', name: 'Микрофон', rect: [128, 104, 16, 44], walk: [136, 150], face: 's',
        look: 'Микрофон на стойке. Стоит ровно над люком. Совпадение, говорит режиссёрша.',
        use: function* (g) { yield* perform(g); },
        items: { modulator: 'Микрофону гелий ни к чему. Вдохнуть должен я.', gun: 'Стрелять в микрофон? Он и так от Пиперса пострадал.' } },
      { id: 'trapdoor', name: 'Люк', rect: [110, 140, 52, 10], walk: [136, 150], face: 's', look: 'Люк. Под ним кислота с акулами. На крышке нацарапано: «Здесь был Уиззер». Уиззер, видимо, судьёй был не всегда.', use: 'Открывать люк самому? Это даже для меня перебор.' },
      { id: 'porthole', name: 'Иллюминатор', rect: [126, 151, 20, 10], walk: [136, 172], face: 'n', look: 'Иллюминатор в стенке сцены. За стеклом булькает зелёная кислота. Мимо проплывает акула в плавательных очках.' },
      { id: 'stand', name: g => g.f.lyricsTaken ? 'Пюпитр' : g.f.idolSeen ? 'Слова песни' : 'Пюпитр', rect: [70, 118, 22, 30], walk: [90, 148], face: 'w',
        look: g => g.f.lyricsTaken || !g.f.idolSeen ? 'Пюпитр для нот. Пустой.' : 'На пюпитре листок со словами песни Пиперса.',
        use: function* (g) {
          if (!g.f.idolSeen || g.f.lyricsTaken) { yield g.say('sam', 'На пюпитре ничего нет.'); return; }
          yield* takeLyrics(g);
        } },
      { id: 'curtain', name: 'Занавес', rect: [280, 0, 40, 118], look: 'Бархатный занавес. Подшит скотчем. Звёзды здесь не задерживаются.' },
      { id: 'judges', name: 'Судейский стол', rect: [222, 136, 96, 28], look: g => g.f.whizzerGone ? 'Судейский стол. Табличка Уиззера перевёрнута надписью «ПУСТО».' : 'Судейский стол. Таблички «Спекс» и «Уиззер». Между ними граница, которую никто не пересекает.' }
    ],
    actors: {
      specs: judgeHot('specs', 'Спекс'),
      whizzer: judgeHot('whizzer', 'Уиззер'),
      peepers: {
        name: 'Пиперс', walk: [106, 148], face: 'w', dist: 20, when: g => g.f.idolSeen,
        look: 'Пиперс, бессменный чемпион. Глаза как два прожектора. Голос как у сирены в тумане.',
        talk: function* (g) { yield g.talkTo('peepers'); },
        items: { cake: function* (g) { yield g.say('peepers', 'Торт? Не мне. Уиззеру. У него праздник. У меня горло.'); }, kcake: function* (g) { yield g.say('peepers', 'Кетчуп? Уиззеру нельзя. Помидоры. Беда будет. Хотя... Интересно.'); } }
      },
      director: {
        name: 'Режиссёрша', walk: [176, 150], face: 'e', dist: 22, when: g => g.actors.director.room === 'idol',
        look: 'Режиссёрша в роли ведущей. Блёстки поверх водолазки. Гарнитура на месте.',
        talk: function* (g) { yield g.talkTo('diridol'); }
      }
    },
    setup(g) {
      const sp = g.actors.specs, wz = g.actors.whizzer, pp = g.actors.peepers;
      g.place('specs', 'idol', 252, 150, 's'); sp.visible = true; sp.act = ''; sp.keepAct = false; sp.hypno = false; sp.v = '';
      if (!g.f.whizzerGone) { g.place('whizzer', 'idol', 290, 150, 's'); wz.visible = true; wz.v = 'nobasket'; wz.act = ''; wz.keepAct = false; }
      if (g.f.idolSeen) { g.place('peepers', 'idol', 84, 146, 's'); pp.act = ''; pp.keepAct = false; }
      else g.place('peepers', 'idol', 136, 148, 's');
      pp.visible = true; pp.hypno = false; pp.v = '';
      g.place('director', 'idol', 196, 148, 'w');
    },
    enter: function* (g) {
      if (!g.f.idolSeen) yield* peepersSong(g);
    },
    onLoad(g) { ROOMS.idol.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
