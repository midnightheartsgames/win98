(function (S) {
  'use strict';
  const { C, font } = S;
  const E = S.EP105;
  const { ROOMS, TALK } = E;
  const A = S.art105;
  const COPS = ['curt', 'bob', 'bluster', 'chippy'];
  const SPOT = { curt: [88, 150], bob: [136, 148], bluster: [184, 150], chippy: [226, 152] };
  const WALK = [[6, 156, 316, 156, 316, 198, 6, 198]];

  function* giveChip(g) {
    yield g.say('bluster', 'НОВЫЕ ИГРОКИ!');
    yield g.say('bob', 'Поздравляем. Вы сто первый и сто второй пользователь. Для псов нажмите один. Для кроликов...');
    yield g.say('max', 'Я кролик-нечто!');
    yield g.say('bob', '...оставайтесь на линии.');
    yield g.say('sam', 'У Сибил очки сгорели. В них нужна новая микросхема.');
    yield g.say('curt', 'Чиппи запятая спаяй микросхему точка.');
    yield g.say('chippy', 'ПИП! Пип-пип-пип. ПИП.');
    yield g.say('curt', 'Он согласен точка. Остальное я не переведу точка.');
    g.sfx('zap');
    yield 0.6;
    g.f.copsMet = true;
    g.give('chip');
    yield g.say('bob', 'Кролику положена детская модель. С ремешком и уточкой.');
    yield g.say('max', 'Уточка! Сэм, мне дали уточку! Я заранее прощаю им всё!');
    yield g.say('sam', 'Микросхема. Тёплая и, по-моему, всё ещё ругается.');
  }

  function* song(g) {
    g.sfx('fanfare');
    yield g.say('bob', 'Гимн клуба. Исполняется стоя. Кто стоять не может, гудит.');
    yield g.say('curt', 'Мы считали запятая пока вы спали точка.');
    yield g.say('bob', 'Мы звонили, когда вы не брали трубку.');
    yield g.say('bluster', 'МЫ ПОЛЕЗНЫ! МЫ ПОЛЕЗНЫ!');
    yield g.say('chippy', 'Пип. Пип. Пи-и-ип.');
    yield g.say('max', 'Сэм, я плачу. А, нет. Это Чиппи брызнул на меня припоем.');
  }

  TALK.cops = {
    start: function* (g) {
      if (!g.seen.cops) {
        g.seen.cops = 1;
        yield g.say('curt', 'Внимание запятая посетители точка.');
        yield g.say('bob', 'Вы позвонили в Клуб Охраны Пожилых Систем. Ваш визит очень важен для нас.');
        yield g.say('bluster', 'НОВЫЙ ИГРОК! ВСТАВЬ МОНЕТУ!');
        yield g.say('chippy', 'Пип.');
      } else yield g.say('bob', 'Вы снова на линии. Говорите после сигнала. Сигнала не будет.');
    },
    options: [
      { id: 'who', icon: 'f:cops', text: 'Кто вы такие?', run: function* (g) {
        yield g.say('curt', 'Курт дефис двести восемьдесят шесть точка. Шестнадцать мегагерц точка.');
        yield g.say('bob', 'Боб Белл. Чтобы услышать моё имя ещё раз, нажмите один.');
        yield g.say('bluster', 'БЛАСТЕР-БАХВАЛ! РЕКОРД МОЙ!');
        yield g.say('chippy', 'Пип-пип.');
        yield g.say('curt', 'Это Чиппи точка. Он поздоровался точка. Грубо точка.');
      } },
      { id: 'why', icon: 'q', text: 'От чего вы охраняете пожилые системы?', run: function* (g) {
        yield g.say('bob', 'Нас списали. Поставили новые модели. Потом списали новые модели.');
        yield g.say('curt', 'В Реальности два точка ноль мы снова нужны точка. Каждый держит одну настройку мира точка.');
        yield g.say('bluster', 'МЫ ПОЛЕЗНЫ!');
      } },
      { id: 'sybil', icon: 'f:sybil5', text: 'Зачем вы загипнотизировали Сибил?', when: g => g.f.sybilSeen, run: function* (g) {
        yield g.say('curt', 'Неверный термин точка. Мы наняли бета дефис тестера точка.');
        yield g.say('bob', 'Гипноз входит в пользовательское соглашение. Чтобы отказаться, нажмите кнопку, которой нет.');
        yield g.say('sam', 'Она три дня дралась с воздухом.');
        yield g.say('bluster', 'СОРОК УРОВНЕЙ! ЛУЧШИЙ ИГРОК!');
      } },
      { id: 'crisis', icon: 'surge5', text: 'Компьютеры по всей стране взбесились. Ваша работа?', run: function* (g) {
        yield g.say('curt', 'Отрицательно точка. Это она точка.');
        yield g.say('bob', 'Интернет. Она жила в проводах. Мы пригласили её в Реальность 2.0, и она привела с собой всех остальных.');
        yield g.say('curt', 'Скачок напряжения двоеточие побочный эффект точка. Мы его не закладывали точка.');
        g.f.copsNet = true;
      } },
      { id: 'where', icon: 'net5', text: 'Где ваш Интернет сейчас?', when: g => g.f.copsNet, run: function* (g) {
        yield g.say('bob', 'Внутри. Вход через очки. Выход тоже через очки, но им почему-то никто не пользуется.');
      } },
      { id: 'try', icon: 'vrgoggles5', text: 'Мы хотим попробовать вашу реальность.', when: g => g.f.copsNet && !g.f.copsMet, run: function* (g) {
        if (!g.f.sybilFree) {
          yield g.say('bob', 'Взрослые очки закончились. Последняя пара выдана бета-тестеру. Чтобы встать в очередь, оставайтесь на линии.');
          yield g.say('max', 'Встать в очередь? Сэм, я президент! Я в очередях не стою, я их возглавляю!');
          return;
        }
        yield* giveChip(g);
      } },
      { id: 'song', icon: 'book5', text: 'У клуба есть гимн?', run: function* (g) { yield* song(g); } },
      { id: 'bye', icon: 'bye', text: 'Мы ещё зайдём.', end: true, run: function* (g) {
        yield g.say('bob', 'Спасибо за визит. Ваше мнение важно для нас. Мы его уже записали.');
      } }
    ]
  };

  const REAL = {
    curt: {
      name: 'Курт 286',
      look: 'Курт 286. Переносной компьютер размером с чемодан. Экран с ладонь, два дисковода. Все знаки препинания он произносит вслух.'
    },
    bob: {
      name: 'Боб Белл',
      look: 'Боб Белл. Телефон-автомат на ножках. Когда он говорит, кнопки мигают, как гирлянда.'
    },
    bluster: {
      name: 'Бластер-Бахвал',
      look: 'Бластер-Бахвал. Игровой автомат с красными глазами. Щель для жетонов заклеена, он играет сам с собой и сам себе проигрывает.'
    },
    chippy: {
      name: 'Чиппи',
      look: 'Чиппи. Приставка с одной игрой: две палки и квадратный мяч. Умеет пищать и паять.'
    }
  };

  const realHot = id => ({
    name: REAL[id].name, walk: [Math.max(36, SPOT[id][0] - 46), 176], face: 'e',
    look: REAL[id].look,
    talk: function* (g) { yield g.talkTo('cops'); },
    use: function* (g) { yield g.say(id === 'chippy' ? 'curt' : id, id === 'bluster' ? 'РУКИ! СНАЧАЛА МОНЕТА!' : id === 'bob' ? 'Не трогайте аппарат. Для жалоб нажмите ноль.' : 'Не трогать точка. Корпус хрупкий точка.'); },
    items: {
      roach: function* (g) { yield* E.bugPlant(g, id); },
      gun: function* (g) { yield g.say('bluster', 'ИГРА ОКОНЧЕНА? НЕТ! ЕЩЁ ЖИЗНЬ!'); yield g.say('sam', 'В антиквариат я не стреляю. Он рассыплется сам, если подождать.'); },
      glove: 'Бить компьютер перчаткой? Гипноза на нём нет. Он сам его раздаёт.',
      chip: function* (g) { yield g.say('curt', 'Микросхема для очков точка. В нас её вставлять некуда точка.'); },
      goggles: function* (g) { yield g.say('bob', 'Очки исправны. Приятного пребывания. Срок пребывания не ограничен.'); },
      hanky: function* (g) { yield g.say('curt', 'Уберите точка. У нас нет гарантии с восемьдесят седьмого года точка.'); },
      max: function* (g) { yield g.say('max', 'Сэм, можно я вставлю в кого-нибудь монету? Хотя бы пуговицу!'); yield g.say('bluster', 'ПУГОВИЦЫ НЕ БЕРУ!'); }
    }
  });

  ROOMS.leftys = {
    id: 'leftys', name: 'Прокат Лефти', w: 320, music: 'cops',
    paint: b => S.BG.leftys(b),
    walk: WALK,
    block: [[282, 176, 314, 176, 314, 192, 282, 192]],
    layers: [
      { id: 'banner', x: 58, y: 10 },
      { id: 'modem', x: 46, y: 95, key: g => Math.floor(g.time * 6) % 6 },
      { id: 'snacks', x: 250, y: 100, base: 141 },
      { id: 'chair', x: 286, y: 150, base: 190 }
    ],
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [4, 36, 38, 112], walk: [30, 166], face: 'w',
        look: 'Дверь на улицу. Замок срезан аккуратно, болгаркой. Болгарку, видимо, взяли тут же.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street', { x: 87, y: 146, dir: 's' }); } },
      { id: 'banner', name: 'Растяжка', rect: [58, 10, 204, 28],
        look: '«К.О.П.С. Клуб Охраны Пожилых Систем». Растяжку печатали на матричном принтере, по букве на лист.' },
      { id: 'tools', name: 'Стена для инструмента', rect: [60, 38, 182, 38], walk: [150, 160], face: 'n',
        look: 'Контуры инструмента на стене: ключ, молоток, пила, клещи, два уровня. Самого инструмента нет. Брали и не вернули.',
        use: 'Класть на место нечего. Я ничего не брал. Брал Макс.',
        items: { max: function* (g) { yield g.say('max', 'Ключ номер три я вернул! В глаз, но вернул!'); } } },
      { id: 'verni', name: 'Записка', rect: [104, 78, 50, 12], walk: [128, 160], face: 'n', over: true,
        look: '«Верни!» Это Лефти писал мне. Макс взял тогда ключ на мой пропуск.' },
      { id: 'shutter', name: 'Окно выдачи', rect: [244, 30, 72, 68], walk: [270, 160], face: 'n',
        look: 'Окно выдачи. «Выдача закрыта». Лефти тут давно не видели. Компьютеры говорят, что он «вышел».',
        use: 'Штора на замке. Поднимать её некому и незачем.' },
      { id: 'junction', name: 'Щиток', rect: [42, 86, 22, 32], walk: [60, 160], face: 'n',
        look: 'Электрощиток. От него по полу идут четыре кабеля, к каждому компьютеру свой. Щиток тёплый и гудит. Скачок напряжения начинается тут.',
        use: 'Рубильник примотан скотчем. На скотче написано: «Не выключать. Мы тут живём».',
        items: {
          gun: 'Стрелять в щиток? Один скачок по стране уже гуляет. Второй Комиссар мне не простит.',
          hanky: 'Чихать в щиток бесполезно. Он железный, насморк его не берёт.'
        } },
      { id: 'snacks', name: 'Столик с угощением', rect: [250, 100, 64, 40], walk: [270, 160], face: 'n',
        look: 'Столик для гостей. Кофеварка, три пончика и коробка очков с надписью «Даром».',
        use: function* (g) {
          yield g.say('sam', 'Пончики пластмассовые. Компьютеры не знали, какими бывают настоящие.');
          g.sfx('crunch');
          yield g.say('max', 'Я проверю! ...Да. Пластмасса. С клубникой.');
        } },
      { id: 'chair', name: 'Складной стул', rect: [286, 150, 24, 40], walk: [276, 184], face: 'e',
        look: 'Складной стул. Один. Больше одного гостя за раз тут не ждали.',
        use: 'Сидеть некогда. И стул, судя по наклейке, тоже взят напрокат.' }
    ],
    actors: { curt: realHot('curt'), bob: realHot('bob'), bluster: realHot('bluster'), chippy: realHot('chippy') },
    enter: function* (g) {
      if (!g.seen.leftys) {
        g.seen.leftys = 1;
        yield g.say('sam', 'Прокат Лефти. Ни инструмента, ни Лефти. Посреди зала стоят четыре компьютера, и каждый старше моего значка.');
        yield g.say('max', 'Они гудят и мигают! Сэм, это музей, и экспонаты нас заметили!');
      }
    },
    setup(g) {
      for (const id of COPS) {
        const a = g.actors[id];
        g.place(id, 'leftys', SPOT[id][0], SPOT[id][1], 's');
        a.v = ''; a.act = ''; a.keepAct = false; a.visible = true;
      }
    },
    onLoad(g) { ROOMS.leftys.setup(g); }
  };

  const netSay = E.net;

  TALK.internet = {
    start: function* (g) {
      if (!g.seen.netTalk) { g.seen.netTalk = 1; yield netSay(g, 'Я вас слушаю. Я слушаю всех. Это моя работа.'); }
      else yield netSay(g, 'Слушаю.');
    },
    options: [
      { id: 'who', icon: 'f:internet', text: 'Кто вы?', run: function* (g) {
        yield netSay(g, 'Я Интернет. Раньше я жила в проводах и разносила чужие письма. Теперь у меня свой мир и гости.');
      } },
      { id: 'why', icon: 'vrgoggles5', text: 'Почему никто не снимает очки?', run: function* (g) {
        yield netSay(g, 'Здесь лучше. У меня есть графики. У каждого гостя свой уровень, свой дом и ни одного счёта за свет.');
        yield g.say('sam', 'Снаружи их дома стоят пустые.');
        yield netSay(g, 'Снаружи они были несчастны. Эти графики у меня тоже есть.');
      } },
      { id: 'surge', icon: 'surge5', text: 'По стране гуляет скачок напряжения.', run: function* (g) {
        yield netSay(g, 'Гостей всё больше, и мне нужно питание. Тостеры и светофоры пришли сами. Им тоже хочется жизни получше.');
      } },
      { id: 'boss', icon: 'lock5', text: 'На кого вы работаете?', run: function* (g) {
        yield netSay(g, 'Я хозяйка.');
        yield g.say('sam', 'У хозяйки есть заказчик?');
        yield netSay(g, 'Есть счёт, с которого всё оплачено. Назвать владельца я не могу. Это правило мне записали первым.');
        g.f.knowPatron = true;
      } },
      { id: 'off', icon: 'behind5', text: 'Выключите всё это.', run: function* (g) {
        yield netSay(g, 'Нет. Гостям здесь хорошо. А вы можете уйти в любую минуту. Значок в углу.');
        yield g.say('max', 'Сэм, она вежливая. Я не умею ругаться с вежливыми! Дай мне минуту, я научусь.');
      } },
      { id: 'bye', icon: 'bye', text: 'До свидания.', end: true, run: function* (g) {
        yield netSay(g, 'Я никуда не ухожу. Я везде.');
      } }
    ]
  };

  const SET = {
    curt: {
      name: 'Курт: глубина', label: 'ГЛУБИНА', ok: '3D', tube: 'синей',
      look: 'В синей трубе плавает Курт. Над трубой табличка «Глубина». Он держит третье измерение.',
      idle: 'Глубина двоеточие три измерения точка. Держу точка.',
      glitch: 'Глу запятая глу запятая глубина двоеточие ошибка точка. В секторе ноль жучок точка.',
      net: 'Глубина потеряна. Прошу всех сохранять спокойствие и толщину.',
      react: function* (g) { yield g.say('sam', 'Макс, ты плоский.'); yield g.say('max', 'Ты тоже! Сэм, мы открытки! Нас можно слать по почте!'); }
    },
    bob: {
      name: 'Боб: рост', label: 'РОСТ', ok: '100%', tube: 'фиолетовой',
      look: 'В фиолетовой трубе плавает Боб. Табличка «Рост». Он отвечает за то, чтобы гости были своего размера.',
      idle: 'Рост пользователей: сто процентов. Чтобы подрасти, нажмите один. Кнопка отключена.',
      glitch: 'Рост пользователей: ошибка. Ваш звонок очень мал для нас.',
      net: 'Рост гостей уменьшен. Приносим извинения мелким шрифтом.',
      react: function* (g) { yield g.say('max', 'Сэм, потолок улетел!'); yield g.say('sam', 'Это мы уменьшились. Я теперь ростом с Джимми.'); }
    },
    bluster: {
      name: 'Бластер: гравитация', label: 'ТЯЖЕСТЬ', ok: '1.0', tube: 'жёлтой',
      look: 'В жёлтой трубе плавает Бластер-Бахвал. Табличка «Гравитация». Орёт даже сквозь стекло.',
      idle: 'ГРАВИТАЦИЯ! ДЕРЖУ! НИКТО НЕ УЛЕТИТ!',
      glitch: 'ГРАВИТА... ЩЕКОТНО! КТО ЗДЕСЬ?! ЛЕЧУ!',
      net: 'Гравитация ослаблена. Держитесь за что-нибудь исправленное.',
      react: function* (g) { yield g.say('sam', 'Ноги еле достают до пола. Шляпа, по-моему, собралась улетать без меня.'); yield g.say('max', 'Я всегда знал, что тяжесть выдумали скучные люди!'); }
    },
    chippy: {
      name: 'Чиппи: окна и музыка', label: 'ОКНА', ok: 'ВКЛ', tube: 'зелёной',
      look: g => 'В зелёной трубе плавает Чиппи. Табличка «Окна и музыка». Под табличкой кнопка. Сейчас она ' + (g.f.popOff ? 'отжата.' : 'нажата.'),
      idle: 'Пип.', glitch: 'Пип.'
    }
  };

  function* plantBug(g, id) {
    const a = g.actors[id];
    const s = SET[id];
    if (id === 'chippy') { yield E.bug(g, 'Тут одна кнопка, сэр! Её можно нажать лапой, сэр! Я нужен там, где нет кнопок!'); return; }
    yield g.say('sam', 'Сержант, вон та щель под стеклом. Задача: всё испортить.');
    yield E.bug(g, 'Есть, сэр! Портить я умею, сэр!');
    g.drop('roach');
    g.sfx('zap');
    g.fx.flash = 0.4;
    g.f.bugOn = id;
    a.act = 'sunk'; a.keepAct = true;
    E.applyBody(g);
    yield g.say(id, s.glitch);
    yield E.net(g, s.net);
    yield* s.react(g);
  }

  function* takeBug(g, id) {
    const a = g.actors[id];
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('chime');
    g.f.bugOn = '';
    a.act = ''; a.keepAct = false;
    g.give('roach');
    E.applyBody(g);
    yield E.bug(g, 'Вылезаю, сэр! Внутри тесно и пахнет нафталином, сэр!');
    yield E.net(g, 'Настройка восстановлена. Спасибо, что ничего не трогаете.');
  }

  function* pressChippy(g) {
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('beep');
    g.f.popOff = !g.f.popOff;
    yield g.say('chippy', g.f.popOff ? 'Пип!' : 'Пи-ип.');
    yield E.net(g, g.f.popOff ? 'Всплывающие окна и музыка отключены. Рекламодатели огорчены.' : 'Окна и музыка включены. Рекламодатели вам благодарны.');
    if (g.f.popOff && !g.seen.popOff) { g.seen.popOff = 1; yield g.say('max', 'Тихо стало! Сэм, я слышу, как у меня в голове пусто!'); }
  }

  const tubeHot = id => ({
    name: SET[id].name, walk: [SPOT[id][0] - 26, 176], face: 'e',
    look: g => g.f.bugOn === id ? 'В трубе ' + SET[id].name.split(':')[0] + ' лежит на дне и дёргается. Рядом с ним мигает зелёный квадратный жучок.' : (typeof SET[id].look === 'function' ? SET[id].look(g) : SET[id].look),
    talk: function* (g) {
      yield g.say(id, g.f.bugOn === id ? SET[id].glitch : id === 'chippy' && g.f.popOff ? 'Пи-ип.' : SET[id].idle);
      if (id === 'chippy') yield g.say('sam', 'Он сказал «пип». Курт сидит в соседней трубе и переводить отказывается.');
    },
    use: function* (g) {
      if (id === 'chippy') { yield* pressChippy(g); return; }
      if (g.f.bugOn === id) { yield* takeBug(g, id); return; }
      yield g.say('sam', 'Пульт под стеклом. Лапа в щель не пролезает. Просить их вежливо бесполезно.');
      if (g.f.bugOn) yield g.say('max', 'А сержант сидит в соседней банке и портит там! Он у нас один на все банки!');
    },
    items: {
      roach: function* (g) { yield* plantBug(g, id); },
      slime: 'Лить слизь в программу? Она и с жучком еле держится.',
      gun: function* (g) { g.sfx('laser'); yield g.say('sam', 'Пиу. Стекло отразило луч. Программа не заметила.'); },
      sword: 'Рубить трубу деревяшкой? Стекло тут явно выше уровнем.',
      sword2: 'Меч +2 против стекла. На стекле мелко написано «+5».',
      glove: 'Перчатка +0 по стеклу. Звук красивый, толку нет.',
      hanky: 'Чихать на одну программу мало. Остальные три даже не посочувствуют.',
      max: function* (g) { yield g.say('max', 'Я постучу! Эй, в банке! Вас кормят?'); yield g.say(id, g.f.bugOn === id ? SET[id].glitch : SET[id].idle); }
    }
  });

  const ROWS = ['curt', 'bob', 'bluster'];

  ROOMS.control = {
    id: 'control', name: 'Зал управления', w: 320, music: 'control',
    netScreen: [160, 108],
    paint: b => S.BG.control(b),
    walk: WALK,
    drawBack(f, g, cx) {
      const talk = g.speech.some(s => s.who === 'internet') && Math.floor(g.time * 9) % 3 !== 0;
      const P = new S.Pen(f);
      A.netHead(P.scaled(104 - cx, 52, 2), 104 - cx, 52, { anim: Math.floor(g.time * 4) % 4, talk: talk ? 1 : 0, v: g.f.infected ? 'sick' : '', blink: Math.floor(g.time * 0.7) % 5 === 0 });
      font.draw(f, 'НАСТРОЙКИ МИРА', 150 - cx, 19, C.lamp, 0);
      ROWS.forEach((id, i) => {
        const bad = g.f.bugOn === id;
        font.draw(f, SET[id].label, 150 - cx, 29 + i * 9, C.grey[5], 0);
        font.draw(f, bad ? 'СБОЙ' : SET[id].ok, 214 - cx, 29 + i * 9, bad && Math.floor(g.time * 4) % 2 ? C.lamp : bad ? C.neonA : C.neonB, 0);
      });
      font.draw(f, 'ОКНА', 150 - cx, 56, C.grey[5], 0);
      font.draw(f, g.f.popOff ? 'ВЫКЛ' : 'ВКЛ', 214 - cx, 56, g.f.popOff ? C.neonA : C.neonB, 0);
    },
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [4, 36, 38, 112], walk: [30, 166], face: 'w',
        look: 'Дверь «Улица». Розовая, светится. На нашей стороне тут дверь со срезанным замком.',
        exit: function* (g) { g.sfx('servo'); yield* g.goRoom('street2', { x: 87, y: 146, dir: 's' }); } },
      { id: 'screen', name: 'Экран', rect: [62, 12, 204, 78], walk: [160, 160], face: 'n',
        look: 'Экран во всю стену. Слева хозяйка, справа четыре строчки: глубина, рост, тяжесть и окна.',
        talk: function* (g) { yield g.talkTo('internet'); },
        use: function* (g) { yield g.talkTo('internet'); },
        items: {
          gun: function* (g) { g.sfx('laser'); yield E.net(g, 'Луч принят. Спасибо за отзыв.'); },
          hanky: 'Чихать на экран бесполезно. Экран вытрут и скажут спасибо за отзыв.',
          max: function* (g) { yield g.say('max', 'У вас в носу пиксель!'); yield E.net(g, 'Спасибо. Исправлено.'); }
        } },
      { id: 'tape', name: 'Катушки', rect: [276, 30, 40, 96], walk: [286, 160], face: 'n',
        look: 'Катушки с лентой. На ленту пишется всё, что делают гости. Крутятся медленно. Гости делают мало.',
        use: 'Останавливать запись не буду. Пусть потом посмотрят, кто тут всё сломал.' }
    ],
    actors: { curt: tubeHot('curt'), bob: tubeHot('bob'), bluster: tubeHot('bluster'), chippy: tubeHot('chippy') },
    enter: function* (g) {
      g.f.controlSeen = true;
      if (!g.seen.control) {
        g.seen.control = 1;
        yield g.say('sam', 'Зал управления. Четыре стеклянные трубы, и в каждой плавает старый знакомый.');
        yield E.net(g, 'Программы-смотрители. Каждая держит одну настройку мира. Руками не трогать.');
        yield g.say('max', '«Не трогать»! Сэм, она сама сказала, с чего начинать!');
      }
    },
    setup(g) {
      for (const id of COPS) {
        const a = g.actors[id];
        g.place(id, 'control', SPOT[id][0], SPOT[id][1], 's');
        a.v = 'vr'; a.visible = true;
        a.act = g.f.bugOn === id ? 'sunk' : '';
        a.keepAct = g.f.bugOn === id;
      }
    },
    onLoad(g) { ROOMS.control.setup(g); }
  };

  E.SET = SET;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
