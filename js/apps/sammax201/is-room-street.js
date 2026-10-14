(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP201;
  const { ROOMS, TALK } = E;

  E.robotHead = g => (!g || !g.vt ? 'back' : g.vt.robotThinks ? 'think' : g.vt.robotFace ? 'face' : 'back');

  TALK.robot = {
    start: function* (g) {
      g.vt.robotFace = true;
      g.sfx('servo');
      if (!g.seen.robotTurn) { g.seen.robotTurn = 1; yield g.say('sam', 'Голова робота провернулась на сто восемьдесят градусов. Тело осталось смотреть на наш офис.'); }
      yield E.robotSay(g, 'ДЕТКА, ТЫ ПРИШЁЛ. Я ЖДАЛ ТЕБЯ ВСЮ ЖИЗНЬ. ОНА НАЧАЛАСЬ УТРОМ.');
    },
    end: function* (g) { g.vt.robotFace = false; },
    options: [
      { id: 'who', icon: 'robot21', text: 'Кто ты такой?', run: function* (g) {
        yield E.robotSay(g, 'Я МАЙМТРОН 9000. ПОДАРОК. МОЁ СЕРДЦЕ ИЗ СТАЛИ, И ОНО БЬЁТСЯ ТОЛЬКО ДЛЯ ТЕБЯ. ЧТОБЫ УНИЧТОЖИТЬ.');
      } },
      { id: 'from', icon: 'gift21', text: 'Кто тебя прислал?', run: function* (g) {
        yield E.robotSay(g, 'ДАРИТЕЛЬ ПОЖЕЛАЛ ОСТАТЬСЯ НЕИЗВЕСТНЫМ. ДАРИТЕЛЬ БОРОДАТ. ОН ЗНАЕТ, КОГДА ТЫ СПИШЬ.');
        yield g.say('max', 'Бородатый, знает, когда я сплю! Сэм, это мой парикмахер!');
      } },
      { id: 'why', icon: 'office21', text: 'Чем тебе не угодил наш офис?', run: function* (g) {
        yield E.robotSay(g, 'ИНСТРУКЦИЯ: СЭМ. МАКС. ОФИС. УНИЧТОЖИТЬ В ПОРЯДКЕ ПОСТУПЛЕНИЯ. ОФИС ПОСТУПИЛ ПЕРВЫМ.');
      } },
      { id: 'songs', icon: 'note21', text: 'Почему ты всё время поёшь?', run: function* (g) {
        yield E.robotSay(g, 'В МОЮ ПАМЯТЬ ЗАПИСАНЫ ДВЕНАДЦАТЬ ТЫСЯЧ ПЕСЕН О ЛЮБВИ. НА ЛЮБОЙ ВОПРОС ЕСТЬ ПЕСНЯ. ПЕСНИ ЗНАЮТ ВСЁ.');
        yield E.robotSay(g, 'ПОЧТИ ВСЁ.');
      } },
      { id: 'ask', icon: 'q', text: 'У меня к тебе вопрос.', say: true, run: function* (g) {
        yield E.robotSay(g, 'СПРАШИВАЙ, ЛЮБОВЬ МОЯ. Я ОТВЕЧУ ПЕСНЕЙ.');
        g.dialog.id = 'robotq';
      } },
      { id: 'bye', icon: 'bye', text: 'Счастливого Рождества, железяка.', end: true, run: function* (g) {
        yield E.robotSay(g, 'И ТЕБЕ, ДЕТКА. ДО СКОРОЙ ВСТРЕЧИ. ОНА БУДЕТ КОРОТКОЙ.');
      } }
    ]
  };

  TALK.robotq = {
    end: function* (g) { g.vt.robotFace = false; },
    options: [
      { id: 'math', icon: 'math21', text: 'Сколько будет дважды два?', run: function* (g) {
        yield E.robotSay(g, 'ДВАЖДЫ ДВА ЧЕТЫРЕ, ДЕТКА. ЭТО ТАК ЖЕ ВЕРНО, КАК ТО, ЧТО Я ТЕБЯ НАЙДУ.');
      } },
      { id: 'love', icon: 'heart21', text: 'Что такое любовь?', run: function* (g) {
        yield E.robotSay(g, 'ЛЮБОВЬ ЭТО ВСЁ, ЧТО ТЕБЕ НУЖНО. ОТВЕТ НАЙДЕН В ПЕСНЕ НОМЕР 4117.');
      } },
      { id: 'where', icon: 'clock21', text: 'Где ты был всю мою жизнь?', run: function* (g) {
        yield E.robotSay(g, 'НА ЗАВОДЕ. В КОРОБКЕ. С БАНТОМ. ПЕСНЯ НОМЕР 902.');
      } },
      { id: 'fools', icon: 'fool21', text: 'Почему глупцы влюбляются?', say: true, end: true, run: function* (g) {
        g.endDialog();
        yield E.robotSay(g, 'ПОЧЕМУ... ГЛУПЦЫ... ВЛЮБЛЯЮТСЯ...');
        yield E.robotSay(g, 'ПЕСНЯ НОМЕР 7. ПЕСНЯ НОМЕР 88. ПЕСНЯ НОМЕР 3150. ВСЕ СПРАШИВАЮТ. НИ ОДНА НЕ ОТВЕЧАЕТ.');
        g.vt.robotFace = false;
        g.vt.robotThinks = true;
        g.sfx('servo');
        yield E.robotSay(g, 'ОБРАБОТКА...');
        yield g.say('sam', 'Голова робота задралась к небу. Глаз погас. Внутри что-то скрипит, как старый граммофон.');
      } },
      { id: 'back', icon: 'bye', text: 'Неважно.', run: function* (g) { g.dialog.id = 'robot'; } }
    ]
  };

  function* boxWon(g) {
    g.f.warGot = true;
    g.give('war');
    const j = g.actors.jimmy;
    yield g.say('jimmy', 'Кукла... Меня побила кукла. Три раунда, начальник. Забирай свой кубок.');
    g.sfx('pickup');
    yield g.say('jimmy', 'Пойду посмотрю на город. Сверху. Давно хотел.');
    j.scripted = true;
    yield g.walkTo('jimmy', 260, 150);
    g.place('jimmy', 'nowhere', 0, 0);
    j.scripted = false;
    yield g.say('max', 'Сэм! Бетти чемпион! Я на ней точно женюсь!');
  }

  E.boxWon = boxWon;

  TALK.jimmy = {
    start: function* (g) {
      if (g.seen.ringHello) return;
      g.seen.ringHello = 1;
      yield g.say('jimmy', 'Начальник! Добро пожаловать в «Ринг у Маймтрона». Бои без правил в груди поверженного гиганта!');
    },
    options: [
      { id: 'what', icon: 'f:jimmy', text: 'Быстро ты освоился, Джимми.', run: function* (g) {
        yield g.say('jimmy', 'Робот упал в полдень. В час я уже повесил канаты. Вход бесплатный, выход пять долларов.');
      } },
      { id: 'prize', icon: 'war21', text: 'Что за приз?', run: function* (g) {
        yield g.say('jimmy', 'Кубок чемпиона. Всадник Войны, настоящая пластмасса. Пришёл утром в коробке с надписью «Джимми Два Зуба, от Санты».');
        yield g.say('jimmy', 'Мне никогда ничего не дарили, начальник. Даже Санта. А тут сразу кубок.');
        g.f.knowWar = true;
      } },
      { id: 'fight', icon: 'punch21', text: 'Я хочу драться.', run: function* (g) {
        yield g.say('jimmy', 'Ты? Начальник, у нас весовые категории. Крысы до трёхсот граммов. Приводи бойца моего размера.');
      } },
      { id: 'doll', icon: 'betty21', text: 'Боец может быть куклой?', when: g => g.has('betty'), run: function* (g) {
        yield g.say('jimmy', 'Кукла? Да хоть кукла. Если сама ходит, пусть выходит. Если не ходит, пусть лежит, у нас и так тесно.');
      } },
      { id: 'bye', icon: 'bye', text: 'Удачных боёв.', end: true }
    ]
  };

  function* bettyRing(g) {
    if (g.f.warGot) { yield g.say('sam', 'Ринг пуст. Чемпион ушёл смотреть на город.'); return; }
    if (!g.f.bettyWound) {
      yield g.anim('sam', 'reach', 0.5);
      g.sfx('thud');
      yield g.say('jimmy', 'Начальник, твоя кукла лежит и смотрит в потолок. У меня тут бои. Похороны в другом зале.');
      yield g.say('sam', 'Бетти не шевелится. В спине у неё дырка для ключа, и дырка пустая.');
      return;
    }
    yield g.say('jimmy', 'Заводная? Годится! Первый бой: Кривой Хвост против куклы! Делайте ставки, делать их всё равно некому!');
    yield* E.startBox(g);
  }

  const DOOR = (id, name, rect, walk, look, room, pos) => ({
    id, name, rect, walk, face: 'n', look,
    exit: function* (g) { g.sfx('door'); yield* g.goRoom(room, pos); }
  });

  ROOMS.street = {
    id: 'street', name: 'Улица', w: 880, music: g => (E.robotHere(g) ? 'robot21' : 'street'),
    scale: [138, 0.84, 166, 0.92],
    paint: b => S.BG.street21(b),
    walk: [[8, 139, 872, 139, 872, 166, 8, 166]],
    layers: [
      { id: 'note', x: 610, y: 112 },
      { id: 'jimmyledge', x: 194, y: 26, when: g => E.ledgeHere(g), key: g => Math.floor(g.time * 2) % 7 === 0 ? 'b' : '' },
      { id: 'mailbox', x: 410, y: 134, base: 166 },
      { id: 'lamp', x: 356, y: 56, base: 167 },
      { id: 'hydrant', x: 528, y: 148, base: 168 },
      { id: 'desoto', x: 560, y: 156, base: 200 },
      { id: 'robot', x: 124, y: 0, base: 199, when: g => E.robotHere(g), key: g => E.robotHead(g) + Math.floor(g.time * 3) % 8 + (g.speech.some(s => s.who === 'robot') && Math.floor(g.time * 9) % 3 > 0 ? 't' : '') },
      { id: 'wreck', x: 140, y: 120, base: 199, when: g => !E.robotHere(g) }
    ],
    drawFront(f, g) {
      for (let i = 0; i < 46; i++) {
        const sp = 18 + (i % 4) * 7;
        const x = Math.floor((S.hash(i, 9, 1) * 320 + Math.sin(g.time * 0.8 + i) * 8 + 320) % 320);
        const y = Math.floor((S.hash(i, 9, 2) * 200 + g.time * sp) % 200);
        f.set(x, y, i % 3 ? C.grey[5] : C.grey[4]);
      }
    },
    hot: [
      DOOR('garagedoor', 'Гараж К.О.П.С.', [18, 70, 104, 68], [70, 143], 'Бывший прокат «Лефти». Теперь гараж клуба старых компьютеров. Ворота подняты наполовину, внутри мигает зелёный свет.', 'garage', { x: 40, y: 172, dir: 'e' }),
      { id: 'garagesign', name: 'Вывеска гаража', rect: [6, 26, 128, 30], look: '«Гараж. К.О.П.С. Тюнинг». На Луне им, видимо, не хватило розеток.' },
      DOOR('officedoor', 'Наш подъезд', [272, 56, 38, 84], [290, 143], 'Дверь нашего дома. Номер двенадцать. Робот её почему-то пощадил. Наверное, оставил на десерт.', 'office', { x: 270, y: 160, dir: 'w' }),
      DOOR('boscodoor', 'Лавка Боско', [452, 60, 40, 80], [472, 143], 'Лавка Боско. На двери новая табличка: «Посылки не принимаю. Особенно тикающие».', 'bosco', { x: 36, y: 172, dir: 'e' }),
      DOOR('stinkydoor', 'Закусочная «У Стинки»', [772, 70, 36, 68], [790, 143], 'Закусочная «У Стинки». Раньше её на нашей улице не было. Робот переставил квартал, и она оказалась тут.', 'stinky', { x: 40, y: 172, dir: 'e' }),
      { id: 'dinersign', name: 'Вывеска закусочной', rect: [730, 38, 126, 18], look: '«У Стинки». Неон мигает через букву. Рядом стеклянная русалка с подносом.' },
      { id: 'mermaid', name: 'Русалка', rect: [852, 90, 18, 48], walk: [850, 150], face: 'e', look: 'Стеклянная русалка у входа. Улыбается, как будто знает три страшные тайны и одну смешную.', use: 'Русалка холодная. Это я выяснил случайно.' },
      { id: 'sybildoor', name: 'Дверь канцелярии', rect: [616, 76, 36, 64], walk: [634, 143], face: 'n',
        look: 'Дверь канцелярии Сибил. На стекле записка: «Закрыто. Королева на свидании. „У Стинки“, третий столик».',
        use: 'Заперто. Королевы на свиданиях не принимают.' },
      { id: 'sybilsign', name: 'Вывеска', rect: [556, 44, 144, 11], look: '«Канада. Канцелярия». Робот перенёс её контору через дорогу и поставил между Боско и закусочной. Табличка «Е. В. Сибил» уцелела.' },
      { id: 'mailbox', name: 'Почтовый ящик', rect: [410, 134, 24, 32], walk: [440, 150], face: 'w', look: 'Почтовый ящик. На нём бант. Под Рождество даже ящики ждут подарков.', use: 'Писем нет. Есть робот, но он не влез бы в ящик.' },
      { id: 'hydrant', name: 'Гидрант', rect: [528, 148, 14, 20], walk: [548, 156], face: 'w', look: 'Гидрант в шапке из снега. Единственный на улице, кто сегодня спокоен.', use: 'Не трогаю.' },
      { id: 'desoto', name: 'Де Сото', rect: [562, 158, 128, 40], walk: [626, 164], face: 's',
        look: 'Наш Де Сото. Возил нас в приют, по Интернету и на Луну. Северный полюс ему после этого как соседняя улица.',
        use: function* (g) { yield* E.drive(g); },
        items: { gun: 'Стрелять в собственную машину? На чём я полечу к Санте?', max: function* (g) { yield g.say('max', 'Я за руль! У президента есть права! Я их сам себе выдал!'); } } },
      { id: 'robot', name: 'Маймтрон 9000', poly: [158, 4, 270, 4, 284, 198, 144, 198], when: g => E.robotHere(g), walk: [306, 150], face: 'w',
        look: g => g.vt.robotThinks ? 'Маймтрон 9000 думает. Голова задрана к небу, глаз погас, ладони сложены на животе. Ключ завода у него за спиной, на высоте нашего окна.' : 'Маймтрон 9000. Стоит к нам лицом, к офису спиной, а голова у него повёрнута задом наперёд и смотрит красным глазом в наше окно. Из спины торчит ключ завода.',
        talk: function* (g) {
          if (g.vt.robotThinks) { yield E.robotSay(g, 'ОБРАБОТКА... ГЛУПЦЫ... ПОЧЕМУ...'); return; }
          yield g.talkTo('robot');
        },
        use: 'Ключ у него на спине, на высоте второго этажа. Отсюда я до него не допрыгну. Макс допрыгнет, но не туда.',
        items: {
          gun: function* (g) { yield g.anim('sam', 'shoot', 0.4); g.sfx('gun'); g.sfx('clang'); yield g.say('sam', 'Пуля отскочила от робота и улетела в сторону Канады. Надеюсь, Сибил не видела.'); },
          max: function* (g) { yield g.say('max', 'Робот! Я твой президент! Приказываю сдаться!'); yield E.robotSay(g, 'ТЫ МОЙ ЕДИНСТВЕННЫЙ. ЕДИНСТВЕННЫЙ В СПИСКЕ.'); },
          '*': 'Роботу это не нужно. Ему нужен наш офис, и желательно с нами.'
        } },
      { id: 'wreck', name: 'Маймтрон 9000', rect: [150, 140, 96, 56], when: g => !E.robotHere(g), walk: [200, 150], face: 's',
        look: 'Маймтрон 9000 лежит на тротуаре. Глаза погасли, динамик ещё тихонько мурлычет припев.',
        use: 'Внутри провода, шестерёнки и двенадцать тысяч песен о любви. Ничего полезного.',
        items: { key: 'Заводить его обратно? Он снова захочет наш офис.', gun: 'Он уже лежит. Лежачих не добивают даже железных.' } },
      { id: 'ring', name: 'Ринг Джимми', rect: [246, 150, 104, 36], when: g => !E.robotHere(g), walk: [300, 152], face: 's',
        look: g => g.f.warGot ? 'Ринг в груди робота. Пустой. Чемпион ушёл.' : 'Ринг в груди робота. Канаты из проводов, гонг из колпака. На табличке: «Приз: Всадник Войны».',
        use: 'Лезть на ринг самому? Там весовые категории.',
        items: {
          betty: function* (g) { yield* bettyRing(g); },
          gun: 'Стрелять по рингу? Джимми обидится и выставит счёт.'
        } },
      { id: 'label', name: 'Бирка на ноге', rect: [444, 170, 22, 24], when: g => !E.robotHere(g), walk: [450, 160], face: 's',
        look: function* (g) {
          yield g.say('sam', 'Бирка на ноге робота: «Сэму и Максу от Санты. Мастерская Санты, Северный полюс. Не вскрывать до Рождества». Вскрылся он сам.');
          if (g.f.labelRead) return;
          g.f.labelRead = true;
          yield g.say('max', 'Санта прислал нам робота-убийцу! Сэм, значит, мы весь год были хорошими!');
          yield g.say('sam', 'Или Санта был плохим. Слетаем на полюс и спросим.');
        },
        use: 'Отрывать бирку не буду. Это улика.' },
      { id: 'ledge', name: 'Джимми на карнизе', rect: [196, 26, 24, 30], when: g => E.ledgeHere(g),
        look: 'На карнизе нашего окна стоит Джимми Два Зуба. Стоит и боится высоты.',
        talk: function* (g) { yield g.say('sam', 'Джимми! Он не слышит. Ветер, второй этаж, и Джимми слушает только себя.'); } }
    ],
    actors: {
      jimmy: {
        name: 'Джимми Два Зуба', walk: [300, 152], face: 's',
        look: 'Джимми Два Зуба в майке промоутера. Стоит на ринге, как хозяин.',
        talk: function* (g) { yield g.talkTo('jimmy'); },
        use: 'Снимать его с ринга не стану. Он кусается.',
        items: {
          betty: function* (g) { yield* bettyRing(g); },
          gun: function* (g) { yield g.say('jimmy', 'Убери ствол, начальник! Тут спорт!'); },
          max: function* (g) { yield g.say('max', 'Джимми! Я выйду на ринг! Я в весовой категории «бешеный»!'); yield g.say('jimmy', 'У нас таких нет, господин президент. У нас нормальные звери.'); }
        }
      }
    },
    enter: function* (g, from) {
      if (E.robotHere(g) && !g.seen.street201) {
        g.seen.street201 = 1;
        yield g.say('sam', 'Робот уже переставил квартал. Закусочная, которой тут не было, канцелярия Сибил не на своём месте, а гараж там, где был «Лефти».');
        return;
      }
      if (!E.robotHere(g) && !g.seen.wreck201) {
        g.seen.wreck201 = 1;
        yield g.say('sam', 'Маймтрон 9000 лежит поперёк тротуара. Джимми Два Зуба уже натянул у него в груди канаты.');
        return;
      }
      if (from === 'fly' && !g.seen.backHome) {
        g.seen.backHome = 1;
        yield g.say('sam', 'Де Сото сел у тротуара. С полюса мы привезли немного снега. Он тает в пепельнице.');
      }
    },
    setup(g) {
      const j = g.actors.jimmy;
      j.z = 0;
      if (!E.robotHere(g) && !g.f.warGot) { g.place('jimmy', 'street', 300, 178, 'w'); j.z = 30; }
      else if (j.room === 'street') g.place('jimmy', 'nowhere', 0, 0);
      j.act = ''; j.keepAct = false; j.scripted = false;
      g.vt.robotFace = false;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
