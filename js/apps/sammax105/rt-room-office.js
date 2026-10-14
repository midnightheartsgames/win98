(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP105;
  const { ROOMS, TALK } = E;
  const A = S.art105;

  const leo = (g, t) => g.say(null, t, { key: 'leo', color: C.rose[4], x: 240, y: 66 });
  const agent = (g, t) => E.phone(g, t, COLORS.agent);

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
    g.closeup = { kind: 'titlecard5', t0: g.time, lines: ['SAM & MAX', 'ЭПИЗОД 105', 'РЕАЛЬНОСТЬ 2.0'] };
    g.music('title5');
    yield g.fadeIn(1.2);
    yield 4.6;
    yield g.fadeOut(2);
    g.closeup = null;
    g.music('office');
    g.place('max', 'office', 122, 164, 'w');
    g.place('sam', 'office', 170, 166, 'w');
    yield g.fadeIn(1.5);
    g.sfx('stamp');
    yield g.say('max', 'Помиловать! Помиловать! Казнить! Шучу. Помиловать!');
    g.sfx('stamp');
    yield g.say('sam', 'Макс, ты ставишь печать на счета за электричество.');
    yield g.say('max', 'Я помиловал электричество! Теперь оно нам должно!');
    g.sfx('zap');
    g.fx.flash = 0.5;
    yield 0.5;
    g.sfx('tvon');
    g.f.tvOff = false;
    yield E.tv(g, 'Добро пожаловать в Реальность 2.0. Наденьте очки.', COLORS.internet);
    yield g.say('sam', 'Телевизор включился сам и просит надеть очки. Электричество приняло твоё помилование близко к сердцу.');
    yield* ring(g, 2);
    yield* pickUp(g, 'Вольная полиция. Приёмная президента.');
    yield E.phone(g, 'Сэм, это Комиссар. У вас телевизор сам включается?');
    yield g.say('sam', 'Начал минуту назад.');
    yield E.phone(g, 'Значит, и до вас дошло. Компьютеры взбесились по всей стране.');
    max.scripted = false;
    g.hideUI = false;
    yield g.talkTo('commish');
  }

  TALK.commish = {
    options: [
      { id: 'what', icon: 'surge5', text: 'Что именно взбесилось?', run: function* (g) {
        yield E.phone(g, 'Банкоматы выдают золотые монеты. Нарисованные. Светофоры играют друг с другом в теннис.');
        yield E.phone(g, 'У моей жены тостер потребовал пароль. Она ввела дату свадьбы. Тостер сказал, что это слишком просто.');
      } },
      { id: 'where', icon: 'net5', text: 'Откуда всё идёт?', run: function* (g) {
        yield E.phone(g, 'Техники нашли источник. По сети гуляет скачок напряжения, и самая сильная волна идёт с вашей улицы.');
        yield g.say('sam', 'С нашей? У нас на улице четыре двери и гидрант.');
        yield E.phone(g, 'Гидрант я бы исключил.');
      } },
      { id: 'people', icon: 'vrgoggles5', text: 'А что люди?', run: function* (g) {
        yield E.phone(g, 'Люди сидят в каких-то очках и не выходят на работу. Говорят, им и там хорошо.');
        yield E.phone(g, 'Половина моего участка тоже в очках. Вторая половина ищет, где их выдают.');
      } },
      { id: 'war', icon: 'f:max', text: 'Я объявляю компьютерам войну!', speaker: 'max', run: function* (g) {
        yield E.phone(g, 'Конгресс не утвердит, господин президент. Конгресс сейчас в очках.');
        yield g.say('max', 'Тогда я объявляю войну конгрессу!');
        yield E.phone(g, 'Вы объявляли её во вторник, сэр. Она ещё идёт.');
      } },
      { id: 'bye', icon: 'bye', text: 'Разберёмся, Комиссар.', end: true, run: function* (g) {
        yield E.phone(g, 'И, Сэм. Ничего не включайте в розетку. И ничего не надевайте на голову.');
        hangUp(g);
        g.f.caseOpen = true;
        yield g.say('sam', 'Четыре двери и гидрант, Макс. Гидрант Комиссар исключил.');
        yield g.say('max', 'С обыском! Я подпишу ордер! Я теперь умею подписывать, у меня выходит почти буква!');
      } }
    ]
  };

  const TV_PROGS = ['crisis', 'ad20', 'bank', 'auntie'];

  function* watchTv(g) {
    const i = g.f.tvSeg || 0;
    const prog = i < TV_PROGS.length ? TV_PROGS[i] : 'rerun';
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('click');
    g.closeup = { kind: 'tv5', prog, t0: g.time };
    const tv = (t, c) => E.tv(g, t, c);
    if (prog === 'crisis') {
      g.music('firewall');
      yield tv('Новости. Компьютеры страны отказываются работать и предлагают людям надеть очки.');
      yield tv('Ведущий этого выпуска тоже в очках. Он читает вам новости другой реальности. Там всё хорошо.');
    } else if (prog === 'ad20') {
      g.music('reality');
      yield tv('Реальность 2.0. Всё как в жизни, только исправлено.', COLORS.internet);
      yield tv('Очки вам доставят на дом. Бесплатно. Адрес мы уже знаем.', COLORS.internet);
    } else if (prog === 'bank') {
      g.music('bank5');
      yield tv('Банко Лавадеро. Ваши деньги придут к нам грязными и выйдут неузнаваемыми.');
      yield tv('Ищите нас в Реальности 2.0. Bancolavadero точка ком.');
    } else if (prog === 'auntie') {
      g.music('reality');
      yield tv('Тётушка Биотик. Антивирус с человеческим лицом и чугунной сковородой.');
      yield tv('Через мою почту ни один чих не пролезет, голубчики!', COLORS.auntie);
    } else {
      g.music('reality');
      yield tv('Реальность 2.0. Всё как в жизни, только исправлено.', COLORS.internet);
    }
    g.closeup = null;
    g.music('office');
    g.f.tvSeg = i + 1;
    if (prog === 'crisis') yield g.say('sam', 'Диктор в очках. Если ему верить, у нас сегодня солнечно и кризиса нет.');
    if (prog === 'ad20') {
      yield g.say('sam', '«Адрес мы уже знаем». Я это слышал на прошлой неделе. От человека в белом костюме, у стойки с книгами.');
      yield g.say('max', 'Хью! Он обещал меня вывернуть и до сих пор не вывернул!');
    }
    if (prog === 'bank') { g.f.knowSite = true; yield g.say('sam', 'Банк стирает деньги и даёт об этом рекламу. Адрес я запомню.'); }
    if (prog === 'auntie') {
      g.f.tvDone = true;
      yield g.say('sam', 'Лицо знакомое. Это Майра Стамп. После своего шоу она, похоже, сдаёт его внаём.');
      yield g.say('max', 'И сковороду!');
    }
    if (prog === 'rerun') yield g.say('sam', 'Повтор. Хозяйка зовёт в очки в пятый раз. Настойчивость у неё торговая.');
  }

  const MACHINE = [
    function* (g) {
      yield agent(g, 'Господин президент. Агент Суперболл, секретарь. На этой неделе три импичмента. Четвёртый перенесён: зал занят под ваш трибунал.');
      yield g.say('max', 'Трибунал! Сэм, меня наконец позвали в приличное общество!');
    },
    function* (g) {
      yield agent(g, 'Господин президент. Школьники прислали рисунки. На всех вы с зубами. Рекомендую не отвечать лично.');
      yield g.say('sam', 'Детям виднее, Макс. Они рисуют главное.');
    },
    function* (g) {
      yield agent(g, 'Господин президент. Казна запросила, куда ушли сто миллионов на сосиски. Я ответил: оборона. Конец доклада.');
      yield g.say('max', 'Это и есть оборона! Сосиски Боско видели динозавров и выжили!');
    }
  ];

  function* playMachine(g) {
    const n = g.count('machine') - 1;
    yield g.anim('sam', 'reach', 0.3);
    g.sfx('beep');
    yield 0.4;
    if (n >= MACHINE.length) { g.f.machineDone = true; yield g.say('sam', 'Новых сообщений нет. Агент Суперболл на посту. Он всегда на посту.'); return; }
    yield* MACHINE[n](g);
    if (n === MACHINE.length - 1) g.f.machineDone = true;
  }

  const CLOSET = {
    name: 'Шкаф', walk: [240, 136], face: 'n',
    look: g => g.f.closetOpen ? 'Шкаф с уликами. Леонард в парике Брэди, Мистер Мишка на полке, рядом голова президента. На гвозде пистонный пистолет.' : 'Шкаф. Четыре дела, четыре улики. Одна мычит, другая крутит глазами.',
    use: function* (g) {
      yield g.anim('sam', 'reach', 0.4);
      g.sfx('door');
      g.f.closetOpen = !g.f.closetOpen;
      if (g.f.closetOpen && !g.seen.closet105) {
        g.seen.closet105 = 1;
        yield g.say('max', 'Привет, музей! Привет, Леонард! Голова, привет! Мишка, не моргай, я слежу!');
        g.sfx('mumble');
        yield leo(g, 'Мм!');
        yield g.say('sam', 'Экспонатов прибавилось. Скоро будем брать за вход.');
      }
    }
  };

  function* takeGlove(g) {
    yield g.anim('sam', 'reach', 0.5);
    g.f.gloveTaken = true;
    g.give('glove');
    yield g.say('sam', 'Если сегодня кто-то под гипнозом, лекарство при мне.');
    yield g.say('max', 'Бить буду я! У меня поставлен удар и снят предохранитель!');
  }

  function* jimmyPeek(g, room, lines) {
    const j = g.actors.jimmy;
    g.place('jimmy', room, 211, 128, 'w');
    j.visible = true; j.act = 'peek'; j.keepAct = true; j.v = 'vr'; j.z = 0;
    g.sfx('squeak');
    for (const t of lines) yield g.say('jimmy', t);
    j.act = ''; j.keepAct = false; j.v = '';
    g.place('jimmy', 'nowhere', 0, 0);
  }

  ROOMS.office = {
    id: 'office', name: 'Офис Сэма и Макса', w: 320, music: 'office',
    paint: b => S.BG.office(b, {}),
    walk: [[40, 132, 258, 132, 316, 162, 316, 198, 4, 198, 4, 156, 36, 134]],
    block: [[0, 152, 96, 147, 112, 158, 112, 200, 0, 200]],
    layers: [
      { id: 'closetOpen', x: 222, y: 38, when: g => g.f.closetOpen },
      { id: 'mrbear', x: 222, y: 42, when: g => g.f.closetOpen, key: g => Math.floor(g.time * 3) % 8 },
      { id: 'head5', x: 242, y: 46, when: g => g.f.closetOpen },
      { id: 'leoCloset', x: 222, y: 38, when: g => g.f.closetOpen },
      { id: 'capgun', x: 250, y: 74, when: g => g.f.closetOpen },
      { id: 'glove', x: 247, y: 88, when: g => g.f.closetOpen && !g.f.gloveTaken },
      { id: 'exhibit', x: 226, y: 44, when: g => g.f.closetOpen && g.f.exhibit },
      { id: 'sign', x: 180, y: 110 },
      { id: 'desk', x: 0, y: 138, base: 176 },
      { id: 'decrees', x: 14, y: 146, base: 177 },
      { id: 'phone', x: 46, y: 142, base: 177 },
      { id: 'machine', x: 74, y: 145, base: 178, key: g => (g.f.machineDone ? 'h' : Math.floor(g.time * 2) % 2) }
    ],
    drawBack(f, g, cx) {
      if (g.f.tvOff) return;
      const snow = g.f.epilogue;
      for (let y = 63; y < 84; y++) for (let x = 176; x < 205; x++) f.set(x - cx, y, snow ? (S.hash(x, y, Math.floor(g.time * 12)) > 0.5 ? C.grey[4] : C.grey[1]) : y < 76 ? C.night[1] : C.purple[1]);
      if (snow) return;
      A.netHead(new S.Pen(f).at(190 - cx, 75, 0.62), 0, 0, { anim: Math.floor(g.time * 4) % 4, talk: Math.floor(g.time * 6) % 3 === 0 });
      for (let i = 0; i < 5; i++) f.set(178 + i * 6 - cx, 64, C.cycle[(i + Math.floor(g.time * 5)) % 8]);
    },
    hot: [
      { id: 'edoor', name: 'Дверь на улицу', poly: [276, 32, 306, 23, 306, 170, 276, 142], walk: [284, 162], face: 'e',
        look: 'Наша дверь. Надпись на стекле изнутри читается задом наперёд. Сегодня это самое понятное, что есть в офисе.',
        exit: function* (g) {
          if (!g.f.caseOpen) { yield g.say('sam', 'Комиссар ещё говорит. Перебивать начальство опаснее, чем тостер с паролем.'); return; }
          g.sfx('door');
          yield* g.goRoom('street', { x: 423, y: 146, dir: 's' });
        } },
      { id: 'tv', name: 'Телевизор', poly: [172, 60, 212, 58, 213, 87, 172, 88], walk: [192, 136], face: 'n',
        look: 'По телевизору женщина в наушниках. Смотрит прямо на меня и ждёт, когда я надену очки. Кнопка выключения её не берёт.',
        use: function* (g) { yield* watchTv(g); },
        items: {
          gun: 'Стрелять в телевизор? Она появится в тостере. Комиссар предупреждал.',
          glove: 'Перчаткой по экрану? Гипноз сидит глубже. Где-то в проводах.',
          hanky: 'Чихать на один телевизор мало. До хозяйки так не достать.',
          roach: function* (g) { yield E.bug(g, 'Объект вещает на всю страну, сэр! Подслушивать нечего, сэр!'); }
        } },
      { id: 'vcr', name: 'Видеомагнитофон', rect: [177, 88, 31, 10], walk: [192, 136], face: 'n',
        look: 'Видеомагнитофон. На часах «88:88». Сегодня это, может быть, и правда.',
        use: 'Кассет нет. Доверия к технике тоже.' },
      { id: 'phone', name: 'Телефон', rect: [44, 140, 26, 16], walk: [104, 150], face: 'w', over: true,
        look: 'Наш телефон. Дисковый, без единой микросхемы. Сегодня ему можно верить больше, чем людям.',
        use: 'Звонить некому. Комиссар воюет с тостером, остальные в очках.',
        items: {
          roach: function* (g) { yield g.say('sam', 'Сержант, пиццу моим голосом мы больше не заказываем.'); yield E.bug(g, 'Так точно, сэр! Перехожу на суши, сэр!'); },
          gun: 'Стрелять в телефон? Он единственный тут работает честно.'
        } },
      { id: 'machine', name: 'Автоответчик', rect: [74, 145, 16, 10], walk: [108, 154], face: 'w', over: true,
        look: g => g.f.machineDone ? 'Автоответчик. Лампочка погасла. Лента хранит три доклада агента Суперболла. Он ничему не удивился.' : 'Автоответчик. Лампочка мигает. С тех пор как Макс стал президентом, нам звонит один агент Суперболл.',
        use: function* (g) { yield* playMachine(g); } },
      { id: 'decrees', name: 'Указы', rect: [14, 146, 28, 10], walk: [112, 162], face: 'w', over: true,
        look: ['Стопка указов. Верхний: «О запрете понедельников». Подпись, печать, след зубов.', 'Следующий: «О награждении президента орденом за скромность». Тоже подписан. Дважды.', '«Об отмене предыдущего указа». Макс подписывает его после каждого.'],
        use: function* (g) { g.sfx('stamp'); yield g.say('max', 'Не трогай! Это высочайшая воля! Я её ещё не дочитал!'); } },
      { id: 'desk', name: 'Стол', poly: [0, 156, 92, 150, 108, 158, 108, 200, 0, 200], walk: [118, 164], face: 'w',
        look: 'Мой стол. Теперь он ещё и президентский. Указы Макс пишет на обороте моих рапортов.',
        use: 'В ящиках пусто. Государственные тайны Макс держит за щекой.' },
      Object.assign({ id: 'closet', poly: [224, 42, 260, 40, 260, 128, 224, 128], when: g => !g.f.closetOpen }, CLOSET),
      Object.assign({ id: 'closetin', rect: [222, 38, 47, 92], when: g => g.f.closetOpen }, CLOSET),
      { id: 'mrbear', name: 'Мистер Мишка', rect: [226, 44, 16, 22], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: ['Мистер Мишка из студии Майры. Обугленный, в скотче. Глаза крутятся до сих пор. Сегодня, кажется, в такт телевизору.', 'Клеймо фабрики Теда И. Бэра. Фабрики нет, мафии нет, а мишка сидит. Самый стойкий из наших злодеев.'],
        use: function* (g) { g.sfx('zap'); yield g.say('sam', 'Бьёт током. Единственный прибор в офисе, который сегодня работает как всегда.'); },
        items: {
          gun: 'Мишка пережил воду, ток и Комиссара. Пуля его только развлечёт.',
          glove: 'Бить мишку перчаткой? Он сам гипноз. Перчатка растеряется.',
          goggles: 'Надеть очки на мишку? Он и без них видит то, чего нет.',
          roach: function* (g) { yield E.bug(g, 'Объект шипит, сэр! По-моему, это угроза, сэр!'); }
        } },
      { id: 'preshead', name: 'Голова президента', rect: [243, 46, 15, 20], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Голова прошлого президента. Деревянная, на шарнирах, и до сих пор улыбается. Кресло досталось Максу, а голову мы оставили себе.',
        use: function* (g) { g.sfx('click'); yield g.say('sam', 'Челюсть щёлкает: «Со-граж...» и заедает. Масла ему так и не дали.'); },
        items: {
          gun: 'Стрелять в голову президента? Даже в деревянную за это сажают.',
          goggles: 'Очки на деревянную голову? Она проголосовала бы за Реальность 2.0. Она голосовала за всё подряд.',
          max: function* (g) { yield g.say('max', 'Предшественник! Хороший был президент. Молчал, пока не дёрнут.'); }
        } },
      { id: 'capgun', name: 'Пистолет с пистонами', rect: [250, 74, 9, 10], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Пистонный пистолет Леонарда. Висит там, где Леонард его видит. Это входит в наказание.',
        use: 'Пусть висит. Улика и наглядное пособие.' },
      { id: 'glove', name: 'Перчатка Макса', rect: [247, 88, 12, 14], when: g => g.f.closetOpen && !g.f.gloveTaken, walk: [240, 136], face: 'n', over: true,
        look: 'Перчатка Макса, улика первого дела. В прошлом деле она сняла с президента голову. Теперь висит на гвозде под пистолетом и ждёт вызова.',
        use: function* (g) { yield* takeGlove(g); } },
      { id: 'leocloset', name: 'Леонард', rect: [226, 72, 21, 54], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Леонард Стейкчармер. Сидит у нас третью неделю. Парик Брэди ему велик, скотч ему мал.',
        talk: function* (g) {
          g.sfx('mumble');
          yield leo(g, 'Мм-мм-мм! Мм!');
          yield g.say('sam', 'Он спрашивает, какой сегодня день. Или просит пиццу. Через скотч слышно одинаково.');
        },
        use: 'Выпускать рано. На улице такое, что в шкафу спокойнее.',
        items: {
          goggles: 'Дать Леонарду очки? Он и в выдуманном мире сядет за карты и будет смотреть в чужой нос.',
          glove: 'Бить связанного? Перчатка на такое не пойдёт. Я тоже.',
          gun: 'Он связан и в парике. Добавить тут нечего.',
          roach: function* (g) { yield E.bug(g, 'Объект мычит, сэр! Шифр не поддаётся!'); },
          max: function* (g) { yield g.say('max', 'Леонард, хочешь в вице-президенты? Нынешний плюшевый, с ним не поговоришь!'); g.sfx('mumble'); yield leo(g, 'Мм?'); }
        } },
      { id: 'hole', name: 'Нора Джимми', rect: [203, 114, 16, 15], walk: [204, 138], face: 'n',
        look: g => g.f.sybilFree ? 'Нора Джимми. Изнутри светит голубым. Джимми где-то раздобыл очки своего размера.' : 'Нора Джимми Два Зуба. Пусто. Судя по табличке, он теперь ведёт дела у Боско.',
        use: 'Совать лапу в крысиную нору я не стал в первом деле. Не стану и в пятом.',
        talk: function* (g) {
          if (!g.f.sybilFree) { yield g.say('sam', 'Джимми!'); yield 0.6; yield g.say('sam', 'Никого. Он и правда у Боско.'); return; }
          yield* jimmyPeek(g, 'office', ['Не мешай, начальник! Я там крыса сорокового уровня! У меня золото!', 'Нарисованное, зато моё! В нору ко мне там никто не влезет, я проверял!']);
        },
        items: {
          gun: 'Стрелять в нору? Пуля вернётся с жалобой.',
          roach: function* (g) { yield E.bug(g, g.f.sybilFree ? 'В норе играют, сэр! Слышу, как считают монеты, сэр!' : 'В норе пусто, сэр!'); }
        } },
      { id: 'sign', name: 'Табличка', rect: [180, 110, 44, 10], walk: [196, 138], face: 'n',
        look: '«У Боско». Ниже мелко: «Оптом и в розницу. Калибр любой, если он один. Джимми Два Зуба».' },
      { id: 'window', name: 'Окно', poly: [100, 30, 164, 28, 164, 96, 100, 98], walk: [134, 134], face: 'n',
        look: 'Дом напротив. В каждом окне голубой отсвет. Соседи сидят в очках и улыбаются стенам.',
        use: 'Открывать не буду. С улицы тянет счастьем, и мне от него не по себе.' },
      { id: 'cabinet', name: 'Картотека', poly: [40, 62, 90, 58, 90, 124, 41, 129], walk: [66, 136], face: 'n',
        look: 'Картотека. Четыре закрытых дела: кассеты, телестудия, казино и Белый дом. Пятая папка подписана «Компьютеры». Внутри пока одно моё недоумение.',
        use: 'Подшивать нечего. Преступник сегодня не оставляет бумаг.' },
      { id: 'picture', name: 'Картина', rect: [43, 17, 39, 33], walk: [62, 136], face: 'n',
        look: 'Собаки играют в покер. Сегодня мне кажется, что они в очках. Нет, показалось. У них просто такие глаза.',
        use: 'Висит криво. Или ровно, а криво стою я.' },
      { id: 'rack', name: 'Вешалка', rect: [10, 50, 22, 78], walk: [42, 146], face: 'w', look: 'Вешалка. Пустая. Шляпу я не снимаю: под ней дуршлаг, а под дуршлагом всё, что мне дорого.', use: 'Вешать нечего.' },
      { id: 'switch', name: 'Выключатель', rect: [266, 73, 9, 14], walk: [262, 142], face: 'e', look: 'Выключатель. Механический. Щёлкает без всякого интернета.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.3);
          g.sfx('click');
          g.fx.dark = !g.fx.dark;
          yield g.say(g.fx.dark ? 'max' : 'sam', g.fx.dark ? 'Сэм! В темноте светятся мишка и телевизор! Они переглядываются!' : 'Со светом спокойнее. Хотя бы видно, кто на тебя смотрит.');
        } },
      { id: 'crate', name: 'Ящик', rect: [176, 99, 27, 11], walk: [192, 138], face: 'n', look: 'Ящик «FRAGILE» под телевизором. В нём то, что не влезло в шкаф.', use: 'Не открою. Телевизор упадёт, и та женщина окажется на полу. Будет неловко.' },
      { id: 'bulb', name: 'Лампочка', rect: [144, 0, 12, 19], look: 'Лампочка. Сорок ватт. С утра подмигивает в такт чему-то, чего я не слышу.', use: 'Не дотянусь. Макс дотянется, но просить президента вкрутить лампочку неудобно.' }
    ],
    enter: function* (g, from) {
      if (from === 'goggles') return;
      if (g.f.sybilFree && !g.seen.jimmyBack) {
        g.seen.jimmyBack = 1;
        yield g.say('max', 'Сэм, из норы Джимми светит голубым! Он вернулся домой, и ему нашли очки по размеру!');
      }
    },
    setup(g) { g.fx.dark = false; },
    onLoad(g) { ROOMS.office.setup(g); }
  };

  const FILES = [
    ['МИШКА.EXE', 'МИШКА.EXE. Мистер Мишка в виде программы. Значок чёрный, и глаза у значка крутятся.', 'Запускать не буду. Он и настоящий бьёт током.'],
    ['ГОЛОВА.DOC', 'ГОЛОВА.DOC. Речь прошлого президента. Один абзац, повторён сорок раз.', '«Сограждане». Дальше файл заедает, как оригинал.'],
    ['ПАРИК.BMP', 'ПАРИК.BMP. Парик Брэди Калчера. Шестнадцать цветов, из них пятнадцать жёлтые.', 'Картинку не примеришь. Сам парик сейчас на Леонарде.'],
    ['ЛЕОНАРД.ZIP', 'ЛЕОНАРД.ZIP. Сжат и заклеен. Даже тут.', 'Распаковывать рано. Из архива и так доносится сжатое «м».'],
    ['ПЕРЧАТКА.DLL', 'ПЕРЧАТКА.DLL. Библиотека. Вызывается ударом.', 'Вызову, когда будет кого бить. Пистонному пистолету файла не досталось, он мелкий.']
  ];

  const CLOSET2 = {
    name: 'Шкаф 2.0', walk: [240, 136], face: 'n',
    look: g => g.f.closetOpen ? 'Шкаф в версии 2.0. Улики четырёх дел стали файлами. Мишка теперь программа, и меня это тревожит.' : 'Шкаф в версии 2.0. Дверца сиреневая. За ней, надеюсь, всё наше.',
    use: function* (g) {
      yield g.anim('sam', 'reach', 0.4);
      g.sfx('door');
      g.f.closetOpen = !g.f.closetOpen;
      if (g.f.closetOpen && !g.seen.closet2) {
        g.seen.closet2 = 1;
        yield g.say('max', 'Сэм! Наш музей превратили в папку с файлами! Леонарда заархивировали!');
        yield g.say('sam', 'Ему не привыкать. Он и у нас сидит в сжатом виде.');
      }
    }
  };

  function* intoHole(g) {
    const sam = g.actors.sam, max = g.actors.max;
    if (g.f.coinHole) { yield g.say('sam', 'Второй монеты там нет. Там есть Джимми, и он мне не рад.'); return; }
    if (E.body(g) !== 'small') {
      yield g.say('sam', 'Лапа застревает по локоть. Нора рассчитана на жильца помельче и на гостей, которых нет.');
      if (g.f.controlSeen) yield g.say('max', 'Джимми влез, а ты нет! Кто тут вообще решает, какого мы роста?');
      return;
    }
    max.scripted = true;
    yield g.walkTo('sam', 211, 130, { free: true });
    sam.visible = false;
    g.sfx('squeak');
    yield 0.8;
    yield* jimmyPeek(g, 'office2', ['Грабят! Сорок уровней копил!']);
    g.sfx('chime');
    sam.visible = true;
    yield g.walkTo('sam', 204, 138, { free: true });
    max.scripted = false;
    g.f.coinHole = true;
    E.addCoins(g);
    yield g.say('sam', 'Нора внутри обставлена лучше нашего офиса. Монета лежала на подушке. Лежала.');
    yield g.say('max', 'Сэм, ты ограбил крысу! Я доложу президенту. Президент одобряет!');
  }

  ROOMS.office2 = {
    id: 'office2', name: 'Офис 2.0', w: 320, music: 'reality',
    netScreen: [190, 56],
    paint: b => S.BG.virt((S.BG.office(b, {}), b)),
    walk: [[40, 132, 258, 132, 316, 162, 316, 198, 4, 198, 4, 156, 36, 134]],
    block: [[0, 152, 96, 147, 112, 158, 112, 200, 0, 200]],
    layers: [
      { id: 'closetOpen', x: 222, y: 38, when: g => g.f.closetOpen },
      { id: 'logo', x: 175, y: 62, key: g => Math.floor(g.time * 5) % 12 },
      { id: 'coin', x: 203, y: 112, when: g => !g.f.coinHole, key: g => Math.floor(g.time * 6) % 4 },
      { id: 'desk', x: 0, y: 138, base: 176 },
      { id: 'phone', x: 46, y: 142, base: 177 }
    ],
    hot: [
      { id: 'edoor', name: 'Дверь на улицу', poly: [276, 32, 306, 23, 306, 170, 276, 142], walk: [284, 162], face: 'e',
        look: 'Наша дверь в версии 2.0. Надпись на стекле тут читается правильно с обеих сторон. Так не бывает.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street2', { x: 423, y: 146, dir: 's' }); } },
      { id: 'tv', name: 'Телевизор 2.0', poly: [172, 60, 212, 58, 213, 87, 172, 88], walk: [192, 136], face: 'n',
        look: 'Телевизор 2.0. На экране хозяйка. Смотрит прямо и не моргает. Экран наконец-то чистый.',
        talk: function* (g) { yield g.talkTo('internet'); },
        use: function* (g) { yield g.talkTo('internet'); },
        items: { gun: function* (g) { g.sfx('laser'); yield g.say('sam', 'Пиу. Хозяйка на экране поправила наушники. Больше ничего.'); } } },
      { id: 'vcr', name: 'Видеомагнитофон 2.0', rect: [177, 88, 31, 10], walk: [192, 136], face: 'n',
        look: 'Видеомагнитофон 2.0. На часах верное время. Значит, мир точно ненастоящий.' },
      { id: 'phone', name: 'Телефон 2.0', rect: [44, 140, 26, 16], walk: [104, 150], face: 'w', over: true,
        look: 'Телефон 2.0. Трубка снята. Вместо гудка модем поёт песню без слов.',
        use: 'Звонить отсюда некому. Все, кому я мог бы позвонить, уже тут.' },
      { id: 'desk', name: 'Стол 2.0', poly: [0, 156, 92, 150, 108, 158, 108, 200, 0, 200], walk: [118, 164], face: 'w',
        look: 'Мой стол в версии 2.0. Ни кружки, ни указов. За таким столом не написано ни одного рапорта.',
        use: 'Ящики пустые. Сюда не положили даже пыль.' },
      Object.assign({ id: 'closet', poly: [224, 42, 260, 40, 260, 128, 224, 128], when: g => !g.f.closetOpen }, CLOSET2),
      Object.assign({ id: 'closetin', rect: [222, 38, 47, 92], when: g => g.f.closetOpen }, CLOSET2)
    ].concat(FILES.map(([name, look, use], i) => ({
      id: 'file' + i, name, rect: [228, 44 + i * 16, 32, 12], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true, look, use
    }))).concat([
      { id: 'hole', name: 'Нора Джимми 2.0', rect: [203, 114, 16, 15], walk: [204, 138], face: 'n',
        look: g => g.f.coinHole ? 'Нора Джимми 2.0. Монеты нет. Джимми, судя по писку, её оплакивает.' : 'Нора Джимми в версии 2.0. В ней блестит золотая монета. Вход размером с мой кулак.',
        use: function* (g) { yield* intoHole(g); },
        talk: function* (g) { yield* jimmyPeek(g, 'office2', [g.f.coinHole ? 'Уйди, начальник! Ты мне должен монету и сорок уровней морального ущерба!' : 'Проваливай, начальник! Это моя нора и моя монета!']); },
        items: {
          coins: function* (g) { yield* jimmyPeek(g, 'office2', [g.f.coinHole ? 'Это МОЯ монета! Ты мне её же и показываешь!' : 'Своя есть, начальник. Покрупнее твоих.']); },
          sword: function* (g) { yield g.say('sam', 'Меч длинный, нора длиннее.'); yield* jimmyPeek(g, 'office2', ['Я подам в суд на меч!']); },
          hanky: 'Простужать Джимми незачем. Он и так чихает на закон.',
          gun: function* (g) { g.sfx('laser'); yield g.say('sam', 'Пиу. Луч ушёл в нору. Из норы запахло жареным сыром.'); }
        } },
      { id: 'window', name: 'Окно', poly: [100, 30, 164, 28, 164, 96, 100, 98], walk: [134, 134], face: 'n',
        look: 'Город 2.0. Дома голубые, небо в клетку. Соседи все здесь, и каждый сидит в своём собственном мире.' },
      { id: 'cabinet', name: 'Картотека 2.0', poly: [40, 62, 90, 58, 90, 124, 41, 129], walk: [66, 136], face: 'n',
        look: 'Картотека 2.0. Ярко-зелёная. Дела в ней разложены по алфавиту. Я так не умею.',
        use: 'Ящики не заедают. Мне не по себе.' },
      { id: 'picture', name: 'Картина', rect: [43, 17, 39, 33], walk: [62, 136], face: 'n',
        look: 'Собаки играют в покер по сети. У каждой свой экран, и друг на друга никто не смотрит.' },
      { id: 'rack', name: 'Вешалка 2.0', rect: [10, 50, 22, 78], walk: [42, 146], face: 'w', look: 'Вешалка 2.0. Фиолетовая. На ней висит надпись «Здесь могла быть ваша шляпа».' },
      { id: 'switch', name: 'Выключатель 2.0', rect: [266, 73, 9, 14], walk: [262, 142], face: 'e', look: 'Выключатель 2.0.', use: 'Щёлк. Свет не гаснет. Темноту в этой версии не завезли.' },
      { id: 'crate', name: 'Тумба', rect: [176, 99, 27, 14], walk: [192, 138], face: 'n', look: 'Наш ящик «FRAGILE» тут превратился в тумбу с крестиком. В играх в таких лежит здоровье.', use: 'Заперто. Здоровье выдают с десятого уровня.' },
      { id: 'bulb', name: 'Лампочка 2.0', rect: [144, 0, 12, 19], look: 'Лампочка 2.0. Горит ровно и ни на что не намекает.' }
    ]),
    enter: function* (g) {
      g.f.holeSeen = true;
      if (!g.seen.office2) {
        g.seen.office2 = 1;
        yield g.say('max', 'Наш офис! Чистый! Сэм, мне страшно.');
        yield g.say('sam', 'Стол без кружки, пол без следов. Тут никто никогда не жил.');
        if (!g.f.coinHole) yield g.say('sam', 'И только из норы Джимми по-прежнему тянет сыром. Хоть что-то настоящее.');
      }
    },
    setup(g) { g.fx.dark = false; },
    onLoad(g) { ROOMS.office2.setup(g); }
  };

  E.startNewGame = function (g) {
    E.newGame(g);
    g.setRoom('office');
    g.fade = 1; g.fadeTo = 1;
    g.run(intro, { name: 'intro' });
  };

  E.office = { intro, ring, pickUp, hangUp, watchTv, playMachine, jimmyPeek, leo };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
