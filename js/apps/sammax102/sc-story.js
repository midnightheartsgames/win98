(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP102 = {
    id: '102', ROOMS: {}, ITEMS: {}, TALK: {}, LAYERS: {}, ACTOR_HOT: {},
    SAVE_KEY: 'sammax102_saves', SET_KEY: 'sammax102_settings',
    TITLE_MUSIC: 'title2', CREDITS_MUSIC: 'credits2'
  };
  const { ITEMS, TALK } = E;

  Object.assign(COLORS, { myra: C.red[4], director: C.mint[3], philo: C.sand[3], hugh: C.sky[4], bessy: C.rose[3], rat: C.olive[4], fan: C.grey[3] });

  const COLOR_NAME = { '': 'обычного цвета', red: 'красный', green: 'зелёный', blue: 'синий' };

  Object.assign(ITEMS, {
    max: { name: 'Макс', icon: 'max', look: function* (g) { yield g.say('sam', 'Макс. Сегодня он решил, что рождён для телевидения.'); yield g.say('max', 'Посмотри на мой профиль, Сэм! Левый! Нет, правый! Оба прекрасны!'); } },
    gun: { name: 'Пистолет Сэма', icon: 'gun', look: ['Мой револьвер. На телевидении его, боюсь, не оценят.', 'Заряжен. Как и моё терпение, только револьвер надёжнее.'] },
    launcher: { name: 'Гранатомёт со слезоточивым газом', icon: 'launcher', look: 'Гранатомёт, купленный у Боско за чужие десять тысяч. Газа осталось на пару безобразий.' },
    cream: { name: 'Пена для бритья', icon: 'cream', look: '«Пена для бритья "Джентльмен". Мятная». Отвоёвана у крыс в честном бою на шоссе.' },
    lampshade: { name: 'Абажур', icon: 'lampshade', look: 'Абажур с бахромой. Если прищуриться, похож на поварской колпак. Если прищуриться очень сильно.' },
    plate: { name: 'Тарелка', icon: 'plate', look: 'Тарелка из реквизита. Фаянс, голубая каёмочка. Ела с неё, судя по всему, только пыль.' },
    vtape: { name: 'Кассета «Ковбои из центра»', icon: 'vtape', look: 'Копия нашей серии «Ковбоев из центра». На наклейке режиссёрша вывела: «Дубль удачный. Корова лучше всех».' },
    cake: { name: 'Торт', icon: 'pinkcake', look: 'Торт из «Готовим не глядя». Розовый, пружинит под пальцем и чуть заметно светится.' },
    kcake: { name: 'Торт с кетчупом', icon: 'kcake', look: 'Торт под толстым слоем кетчупа. Издали похоже на красную глазурь. Вблизи похоже на место преступления.' },
    lyrics: { name: 'Слова песни Пиперса', icon: 'lyrics', look: function* (g) { yield g.say('sam', '«Я синий? Кто ты такой? Умею ли я летать? Где мой второй носок?» Сплошные вопросы. Ни одного ответа.'); } },
    cards: { name: 'Карточки с вопросами', icon: 'cards', look: ['Карточки Хью. «Сколько весит тень от облака над Небраской в четверг?» Ответа на обороте нет.', '«Как звали собаку второго помощника изобретателя скрепки?» Бедная собака. Её никто не помнит.'] },
    coin: { name: 'Пятьдесят центов', icon: 'coin', look: 'Утешительный приз викторины. Пятьдесят центов и ощущение глубокого покоя. Покой уже прошёл.' },
    stamps: { name: 'Продовольственные талоны', icon: 'stamps', look: 'Продовольственные талоны на миллион долларов. Приз, который заработал я. Своей головой. И чужой песней.' },
    modulator: { name: 'Модулятор голоса', icon: 'modulator', look: 'Химический модулятор голоса лорда Рамплботтома. Воздушный шарик, ингалятор и трубочка-загогулина. Шарик пахнет праздником.' },
    photo: {
      name: 'Фотография с Хью', icon: g => 'photo_' + (g.f.photoColor || ''),
      look: g => 'Мы с Максом и Хью Блиссом. Хью на снимке ' + COLOR_NAME[g.f.photoColor || ''] + '. ' + (g.f.photoColor === 'green' ? 'Вылитый пришелец.' : 'Я на снимке моргнул.')
    },
    paper: { name: '«Вестник инопланетных треугольников»', icon: 'paper', look: function* (g) { g.closeup = { kind: 'paper', t0: g.time }; yield g.say('sam', '«Пёс, кролик и зелёный незнакомец: любовь без границ». Под снимком подпись: «Кто третий лишний?» Ответ, видимо, в следующем номере.', { x: 160, y: 196 }); g.closeup = null; } },
    contract: { name: 'Контракт на запись', icon: 'contract', look: 'Контракт на запись пластинки. Подписан за «Позорного идола». Мелким шрифтом: «Голос исполнителя принадлежит студии». Я перечитаю это позже.' }
  });

  ITEMS.gun.on = {
    max: function* (g) { yield g.say('max', 'Целься в правую половину, Сэм! Она у меня фотогеничнее!'); yield g.say('sam', 'Я не целюсь в тебя, Макс.'); yield g.say('max', 'Жаль. Было бы эффектно.'); },
    '*': 'Стрелять в своё добро я не стану. Даже в прямом эфире.'
  };
  ITEMS.max.on = {
    '*': function* (g) { yield g.say('max', 'Хочешь, я это понюхаю? Я профессионал. Нюхаю с детства.'); },
    cake: function* (g) { yield g.say('max', 'Торт светится, Сэм. Я ем только то, что не смотрит на меня в ответ.'); },
    kcake: function* (g) { yield g.say('max', 'Кетчуп на торте? Ты гений! Это не моё, но ты гений.'); }
  };
  ITEMS.cake.on = { cream: 'Украсить торт пеной для бритья? Тот, кто его съест, будет пахнуть мятой и обидой.' };
  ITEMS.cream.on = { cake: 'Украсить торт пеной для бритья? Тот, кто его съест, будет пахнуть мятой и обидой.' };
  ITEMS.launcher.on = { max: function* (g) {
    if (E.inAudition(g) && !g.f.audCry) { yield* E.auditionCry(g); return; }
    yield g.say('sam', 'Стрелять газом в Макса без повода я не буду.'); yield g.say('max', 'А если я сам попрошу?'); yield g.say('sam', 'Тем более.');
  } };
  ITEMS.lyrics.on = { cards: 'Вопросы к вопросам. Скоро меня можно будет показывать в передаче про философию.' };
  ITEMS.cards.on = { lyrics: 'Вопросы к вопросам. Скоро меня можно будет показывать в передаче про философию.' };
  ITEMS.modulator.on = { max: function* (g) { yield g.say('max', 'Дай вдохнуть, Сэм!'); yield g.say('sam', 'Нет. Гелий тебе ни к чему, ты и так говоришь на ультразвуке.'); } };

  E.GENERIC = {
    look: ['Смотрю. Ничего подозрительного, что само по себе подозрительно.', 'Обычная вещь. На телевидении её бы показали крупным планом.', 'Разглядываю. Оно не возражает.', 'Не вижу ничего, что стоило бы запомнить.'],
    use: ['Не знаю, как с этим обращаться, и не уверен, что хочу знать.', 'Трогать это мне не хочется. Интуиция подсказывает, а интуиция у меня служебная.', 'Ничего не происходит. Как в большинстве наших расследований до обеда.', 'Нет.'],
    talk: ['Молчит. Я бы на его месте тоже молчал.', 'Беседа не клеится. Бывает.', 'Никакой реакции. Пора менять собеседников.'],
    useItem: ['Не сработает. Проверять я не буду.', 'Даже для нас это слишком.', 'Интересная мысль. Плохая, но интересная.', 'Нет. Не вижу связи.'],
    items: {
      gun: ['Пуля тут ничего не решит. Решит только мне бумажной работы.', 'Стрелять? Сегодня я пробую другой подход. Вежливость.', 'Не буду. Патроны берегу для заслуживающих.'],
      max: [function* (g) { yield g.say('max', 'Не хочу. Я звезда, у меня райдер.'); }, function* (g) { yield g.say('max', 'Это я кусать не буду. Там нет ни одной калории.'); }, function* (g) { yield g.say('max', 'Сэм, ну ты посмотри на это. И на меня. Разные весовые категории.'); }]
    }
  };

  E.ACTOR_HOT.max = {
    name: 'Макс', walk: null,
    look: ['Макс. Кролик-нечто. Сегодня он причесал уши. Это знак.', 'Макс. Мой напарник. Шепчет себе под нос: «Спасибо академии».'],
    talk: function* (g) { yield g.talkTo('max'); },
    use: function* (g) { yield g.say('max', 'Автограф? Только на лбу! На твоём!'); },
    items: {
      gun: function* (g) { yield* ITEMS.gun.on.max(g); },
      launcher: function* (g) { yield* ITEMS.launcher.on.max(g); },
      '*': function* (g) { yield g.say('max', 'Подарок? Мне? Ставь рядом с остальными моими наградами. В воображаемый шкаф.'); }
    }
  };

  E.ACTOR_HOT.sam = {
    name: 'Сэм', walk: null,
    look: ['Это я. Сэм. Шляпа на месте, совесть в целом тоже.', 'Я. Режиссёрша сказала бы: «Типаж». Я сказал бы: «Собака в костюме».'],
    talk: 'Поговорить с собой я могу и дома. Там хотя бы не перебивают.',
    use: 'Поправляю галстук. Ради Майры можно и постараться.',
    items: {
      cream: function* (g) {
        if (E.inAudition(g) && !g.f.audRabid) { yield* E.auditionRabid(g); return; }
        yield g.say('sam', 'Бриться незачем. Шерсть отрастает быстрее, чем я успеваю найти бритву.');
      },
      modulator: function* (g) {
        if (g.f.high) { yield E.squeak(g, 'Гелия во мне и так хватает. Я уже слышу, как пищат мои мысли.'); return; }
        yield g.anim('sam', 'reach', 0.5);
        g.sfx('helium');
        g.f.high = true;
        yield E.squeak(g, 'Кхм. Раз, раз. Проверка. Ой. Я звучу как чайник.');
        yield g.say('max', 'Сэм! Ты как мультяшная белка! Скажи ещё что-нибудь!');
      },
      gun: 'Нет. У меня на себя другие планы.',
      launcher: 'Стрелять газом в себя? Такое бывает только у каскадёров. Им за это платят.',
      max: function* (g) { yield g.say('max', 'Обнимашки!'); yield g.say('sam', 'Хватит, Макс. На нас смотрят.'); yield g.say('max', 'В этом весь смысл!'); },
      '*': 'Мне это ни к чему.'
    }
  };

  function hasAny(g, list) { return list.some(id => g.has(id)); }

  function maxHint(g) {
    const f = g.f;
    if (!f.caseOpen) return 'Телефон, Сэм! Бери трубку, пока Комиссар не передумал!';
    if (!f.hired) {
      if (!f.metDirector) return 'Майра сидит на телестудии WARP. Садись в Де Сото и выбирай студию на карте!';
      if (!f.auditionOn) return 'Скажи режиссёрше, что мы пришли на пробы! Я готов! Я всегда готов!';
      if (!f.audRabid) {
        if (!f.creamStolen && !g.has('cream')) return 'Режиссёрше нужен бешеный пёс. Бешеные псы пускают пену. У Боско на столе лежит бесплатная пена для бритья!';
        if (!g.has('cream')) return 'Крысы украли пену! Садись в Де Сото и выбери погоню. Стреляй машине в бок, её занесёт! Загони крыс в открытый люк!';
        return 'Намажь морду пеной, Сэм! Возьми пену и используй её на себе. Прямо при режиссёрше!';
      }
      return 'Ей нужны мои слёзы. Стреляй в меня из гранатомёта со слезоточивым газом, пока она смотрит! Ради искусства я готов!';
    }
    if (!f.tapeDone) {
      const t = f.take;
      if (!t) return 'Иди на площадку «Ковбоев из центра» и скажи режиссёрше: «Мотор!»';
      if (!t.dis) return 'Фезерли вот-вот заметит корову! Надень на неё абажур с лампы! Или тарелку! Или намажь пеной!';
      if (t.id && t.id !== 'chef') return 'Эту серию уже не спасти. Скажи режиссёрше, что начнём заново. А потом переодень корову абажуром и скажи, что она наш повар!';
      if (t.id === 'chef' && !t.served) return g.has('plate') ? 'Повар должен подать ужин! Ужин лежит за коровой. Используй тарелку на лепёшке!' : 'Повар должен подать ужин! Возьми тарелку со стола и положи на неё лепёшку, что лежит за коровой!';
      if (t.answered) return 'Моя реплика про пасту! Используй меня на Фезерли!';
      return 'Скажи ему, что корова сказала «Му-гу-гай-пань»! Это блюдо такое!';
    }
    if (!f.idolSeen) return 'Пойдём на «Позорного идола»! Хочу посмотреть, как люди позорятся по телевизору!';
    if (!f.lyricsTaken) return 'Пиперс оставил слова песни на пюпитре у сцены. Забери их, пригодятся!';
    if (!f.quizLost) return 'Сыграй в «Кто никогда не станет миллионером»! Проиграешь, зато дадут утешительный приз!';
    if (!f.cardsSwapped && !f.quizWon) return 'Хью прячет карточки с вопросами в прорези своей стойки. Подсунь туда слова песни Пиперса!';
    if (!f.quizWon) return 'Сыграй ещё раз! Вопрос будет «Я синий?». Если Хью синий, отвечай «да». Если нет, отвечай «нет»!';
    if (!f.modBought) return 'У нас миллион талонами! Неси их лорду Боско, купим модулятор голоса!';
    if (!f.whizzerGone) {
      if (!hasAny(g, ['cake', 'kcake'])) return 'Уиззер хочет торт на день рождения. Приготовь торт на «Готовим не глядя»!';
      if (!g.has('kcake')) return 'Уиззер любит красную глазурь, а помидоры ему нельзя! У Боско у туалета стоит кетчуп. Полей торт кетчупом!';
      return 'Подари Уиззеру торт! У него сегодня день рождения, а Спекс забыл!';
    }
    if (!f.contractWon) return 'Вдохни из модулятора и спой в микрофон на «Позорном идоле»! Спекс любит высокие ноты!';
    if (!f.paperOut) {
      if (f.photoColor !== 'green' || !g.has('photo')) return 'Попроси Хью стать зелёным и сфотографируйся с ним! Сибил нужен пришелец, а пришельцы зелёные!';
      return 'Отнеси фотографию с зелёным Хью Сибил! Пусть печатает скандал!';
    }
    if (!g.has('paper') && !f.proofPaper) return g.has('coin') ? 'Газета продаётся в ящике у лавки Боско. Пятьдесят центов! У нас как раз есть утешительный приз!' : 'Газета стоит пятьдесят центов. Проиграй ещё раз в викторине, там за это платят!';
    return 'Покажи Майре кассету, контракт и газету! Её дверь в самом конце коридора!';
  }

  const MAX_GAGS = [
    ['max', 'Как думаешь, Сэм, мне пойдёт псевдоним? Макс Великолепный? Макс Ужасный? Макс Второй Сезон?'],
    ['max', 'Я уже придумал речь для награды. Там только «спасибо» и угрозы.'],
    ['max', 'Если нас покажут по телевизору, мама увидит. У меня есть мама, Сэм?'],
    ['max', 'Знаешь, что самое лучшее в славе? Можно бить людей, и они просят автограф.'],
    ['max', 'Я голоден. Где-то тут должен быть фуршет для звёзд. Я его чую.']
  ];

  TALK.max = {
    options: g => [
      { id: 'sponsor', icon: 'toothpaste', text: 'Макс, твой выход! Реплика спонсора!', when: gg => gg.f.take && gg.f.take.answered, end: true, run: function* (gg) { gg.endDialog(); yield* E.sitcomWrap(gg); } },
      { id: 'hint', icon: 'q', text: 'Макс, есть идеи, что делать дальше?', run: function* (gg) { yield gg.say('max', gg.room && gg.room.maxHint ? gg.room.maxHint(gg) : maxHint(gg)); } },
      { id: 'how', icon: 'duck', text: 'Как настроение, Макс?', run: function* (gg) { const [w, t] = MAX_GAGS[(gg.count('maxgag') - 1) % MAX_GAGS.length]; yield gg.say(w, t); } },
      { id: 'case', icon: 'badge', text: 'Что ты думаешь о нашем деле?', when: gg => gg.f.caseOpen, run: function* (gg) {
        if (!gg.f.hired) yield gg.say('max', 'Майра держит людей в студии три дня. Даже я столько не держу.');
        else if (!gg.f.tapeDone) yield gg.say('max', 'Мы актёры, Сэм! Если нас не поймают, мы ещё и звёзды!');
        else yield gg.say('max', 'Кассета есть. Остались песня и скандал. Скандал беру на себя!');
      } },
      { id: 'bye', icon: 'bye', text: 'Пошли, Макс.', end: true }
    ]
  };

  E.maxHint = maxHint;
  E.COLOR_NAME = COLOR_NAME;

  E.phone = function (g, text) {
    return g.say(null, text, { key: 'phone', color: COLORS.phone, x: 70, y: 110 });
  };

  E.squeak = function (g, text) {
    g.sfx('helium');
    return g.say('sam', text, { color: C.pink[3] });
  };

  E.tv = function (g, text, color) {
    return g.say(null, text, { key: 'tv', color: color || COLORS.tv, x: 160, y: 199 });
  };

  E.newGame = function (g) {
    g.addActor('sam', { name: 'Сэм', color: COLORS.sam, speed: 62, stride: 34 });
    g.addActor('max', { name: 'Макс', color: COLORS.max, speed: 70, stride: 26, follow: 'sam' });
    g.addActor('jimmy', { name: 'Джимми Два Зуба', color: COLORS.jimmy, speed: 80, stride: 12, scale: 1.1 });
    g.addActor('rat1', { name: 'Бритый хвост', costume: 'skinrat', color: COLORS.rat, speed: 90, stride: 10, scale: 1.1 });
    g.addActor('rat2', { name: 'Бритый хвост', costume: 'skinrat', color: COLORS.rat, speed: 90, stride: 10, scale: 1.1 });
    g.addActor('ratcar', { name: 'Крысиный хот-род', costume: 'ratcar', color: C.grey[5], speed: 120, stride: 30 });
    g.addActor('bosco', { name: 'Лорд Рамплботтом', costume: 'lord', color: COLORS.bosco });
    g.addActor('sybil', { name: 'Сибил', color: COLORS.sybil, speed: 56, stride: 26 });
    g.addActor('director', { name: 'Режиссёрша', color: COLORS.director, speed: 70, stride: 26 });
    g.addActor('philo', { name: 'Фило Пенниуорт', color: COLORS.philo, speed: 46, stride: 16 });
    g.addActor('bessy', { name: 'Корова Бесси', color: COLORS.bessy, speed: 30, stride: 30 });
    g.addActor('specs', { name: 'Спекс', color: COLORS.specs, speed: 50, stride: 20 });
    g.addActor('whizzer', { name: 'Уиззер', color: COLORS.whizzer, speed: 95, stride: 20 });
    g.addActor('peepers', { name: 'Пиперс', color: COLORS.peepers, speed: 90, stride: 20 });
    g.addActor('hugh', { name: 'Хью Блисс', color: COLORS.hugh, speed: 50, stride: 26 });
    g.addActor('myra', { name: 'Майра Стамп', color: COLORS.myra, speed: 50, stride: 26 });
    g.addActor('bear', { name: 'Мистер Мишка', color: C.sky[4] });
    g.inv = ['max', 'gun', 'launcher'];
    g.place('sam', 'office', 150, 166, 's');
    g.place('max', 'office', 186, 150, 'n');
    g.place('jimmy', 'nowhere', 0, 0, 'e');
    g.place('rat1', 'nowhere', 0, 0, 'e');
    g.place('rat2', 'nowhere', 0, 0, 'e');
    g.place('ratcar', 'street', 606, 178, 'w');
    g.place('bosco', 'bosco', 250, 150, 's');
    g.place('sybil', 'sybil', 208, 150, 's');
    g.place('director', 'warp', 92, 164, 'e');
    g.place('philo', 'sitcom', 232, 162, 'w');
    g.place('bessy', 'sitcom', 150, 166, 'w');
    g.place('specs', 'idol', 252, 150, 's');
    g.place('whizzer', 'idol', 292, 150, 's');
    g.place('peepers', 'idol', 136, 148, 's');
    g.place('hugh', 'quiz', 242, 150, 'w');
    g.place('myra', 'myra', 228, 150, 's');
    g.place('bear', 'myra', 250, 118, 's');
    g.actors.whizzer.v = 'nobasket';
    g.f.hughColor = '';
  };

  E.afterLoad = function (g) {
    const room = g.room;
    if (room && room.onLoad) room.onLoad(g);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
