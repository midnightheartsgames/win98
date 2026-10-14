(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP103 = {
    id: '103', ROOMS: {}, ITEMS: {}, TALK: {}, LAYERS: {}, ACTOR_HOT: {},
    SAVE_KEY: 'sammax103_saves', SET_KEY: 'sammax103_settings',
    TITLE_MUSIC: 'title3', CREDITS_MUSIC: 'credits3'
  };
  const { ITEMS, TALK } = E;

  Object.assign(COLORS, { lovey: C.gold[4], cuddly: C.slime[4], guard: C.sky[4], chuckles: C.pink[4], leonard: C.rose[4], ted: C.orchid[4], roach: C.oak[4], slotvoice: C.orange[4] });

  E.CODE = 'Ковёр подходит к шторам?';
  E.PASSWORD = 'Оставь пистолет, возьми канноли.';
  E.FIRE = 'Ты в огне!';

  function* voiceBox(g) {
    yield g.say(null, E.FIRE, { key: 'vbox', color: COLORS.slotvoice });
  }

  function* bugLook(g) {
    const rec = g.f.bugRec;
    if (rec && E.BUG_TAPES[rec]) {
      yield g.say('sam', 'Сержант, доклад.');
      yield* E.bugReplay(g, rec);
      return;
    }
    yield g.say('sam', 'Жучок от Боско. Подслушивающее устройство и таракан в одном лице. Утверждает, что прошёл Вьетнам.');
    yield g.say(null, 'Сержант Жучок, сэр! Жду задания, сэр!', { key: 'roachvoice', color: COLORS.roach });
  }

  Object.assign(ITEMS, {
    max: { name: 'Макс', icon: 'max', look: function* (g) { yield g.say('sam', 'Макс. С утра он требует, чтобы его звали мафиозной кличкой.'); yield g.say('max', 'Макс Две Лапы! Нет, Макс Бутерброд! Нет! Дон Макс!'); } },
    gun: { name: 'Пистолет Сэма', icon: 'gun', look: ['Мой револьвер. В казино его пустили без вопросов, и это многое говорит о казино.', 'Заряжен. Макс проверял трижды. Все три раза в потолок.'] },
    token: { name: 'Жетон казино', icon: 'token', look: 'Жетон казино Теда И. Бэра. На обеих сторонах мишка. Орла и решки здесь не держат.' },
    tokens: { name: 'Десять миллионов жетонов', icon: 'tokens', look: 'Мешок с десятью миллионами жетонов. Выигран почти честно. Честнее, чем их выигрывал Леонард.' },
    ace: { name: 'Туз пик', icon: 'ace', look: 'Туз пик из нашей колоды. Джимми его немного погрыз. Крысиный знак качества.' },
    magnet: { name: 'Магнит с Тедом И. Бэром', icon: 'magnet', look: 'Магнит на холодильник, голова Теда И. Бэра. Приз за двадцать поющих крыс. Холодильника у нас нет, так что магнит скучает.' },
    roach: { name: 'Жучок', icon: 'roach', look: function* (g) { yield* bugLook(g); } },
    bearbox: { name: 'Коробка с мишкой', icon: 'bearbox', look: 'Подарочная коробка с бантом. «Не вскрывать до продажи». Внутри кто-то тихо жужжит и, кажется, смотрит на меня через картон.' },
    mug: { name: 'Кружка Сибил', icon: 'mug', look: 'Кружка Сибил с надписью «Свидетель года». Пустая. Сибил допивала её, даже когда кофе кончился.' },
    kmug: { name: 'Кружка с кетчупом', icon: 'kmug', look: 'Кружка Сибил, доверху полная кетчупа. Пахнет помидорами и нервами.' },
    capgun: { name: 'Пистонный пистолет', icon: 'capgun', look: 'Пистолет Леонарда. Пистонный. Громкий, блестящий и безвредный, как его хозяин.' },
    arm: { name: 'Ручка однорукого бандита', icon: 'arm', look: 'Ручка от Мишки-бандита. Хром и красный шарик. Без автомата это просто палка с амбициями.' },
    screwdriver: { name: 'Отвёртка', icon: 'screwdriver', look: 'Крестовая отвёртка с зелёной ручкой. Мафия держит инструмент в порядке. Инструментом у них называют и отвёртки, и людей.' },
    voicebox: { name: 'Голосовой блок', icon: 'voicebox', look: function* (g) { yield g.say('sam', 'Голосовой блок из Мишки-бандита. Одна кнопка и одно мнение.'); yield* voiceBox(g); yield g.say('sam', 'Так автомат хвалит каждого, кто выиграл. Проигравших он молча презирает.'); } },
    firebear: { name: 'Мишка с чужим голосом', icon: 'firebear', look: function* (g) { yield g.say('sam', 'Гипномишка с голосом игрового автомата. Глаза у него честные. Таким верят с первого слова, поэтому я смотрю ему на ухо.'); } }
  });

  ITEMS.gun.on = {
    max: function* (g) { yield g.say('max', 'Сэм, давай изобразим разборку! Ты стреляешь, я красиво падаю!'); yield g.say('sam', 'Позже, Макс. Такие номера надо беречь для публики.'); },
    '*': 'Стрелять в собственные вещи? Мафия бы оценила. Я нет.'
  };
  ITEMS.max.on = {
    '*': function* (g) { yield g.say('max', 'Хочешь, я это надкушу? Мафиози всегда пробуют товар!'); },
    mug: function* (g) { yield g.say('max', 'Пустая кружка! Самое печальное зрелище на свете после пустой тарелки!'); },
    kmug: function* (g) { yield g.say('max', 'Кетчуп без картошки? Сэм, это соус, который потерял смысл жизни.'); },
    roach: function* (g) { yield g.say('max', 'Можно я его съем? Совсем чуть-чуть?'); yield g.say(null, 'Отставить, кролик!', { key: 'roachvoice', color: COLORS.roach }); yield g.say('max', 'Он на меня накричал! Мне нравится этот таракан!'); },
    firebear: function* (g) { yield g.say('max', 'Не дам ему смотреть мне в глаза. У нас с мишками сложные отношения.'); }
  };
  ITEMS.token.on = { tokens: 'Бросить жетон в мешок с жетонами? Богаче я от этого не стану.' };
  ITEMS.tokens.on = { token: 'Бросить жетон в мешок с жетонами? Богаче я от этого не стану.' };
  ITEMS.ace.on = { token: 'Туз и жетон. Честная игра и плата за вход. В одном кармане они не уживутся.' };
  ITEMS.mug.on = { kmug: 'Две кружки? У меня одна. Просто она меняет настроение.' };
  ITEMS.screwdriver.on = {
    firebear: 'Разобрать его обратно? Нет, он получился как надо.',
    capgun: 'Пистонному пистолету отвёртка не поможет. Ему поможет только настоящий пистолет, а этого я не допущу.'
  };
  ITEMS.voicebox.on = { firebear: 'Голос уже внутри мишки. Второй голос ему ни к чему, он и так нестабилен.' };

  E.GENERIC = {
    look: ['Ничего, за что мафия стала бы платить.', 'Обычная вещь. Мафия такие обходит стороной.', 'Пользы никакой, зато вид приятный.', 'Ничего особенного. Даже отпечатков нет.'],
    use: ['Не вижу, как этим воспользоваться. Разве что как уликой.', 'Трогать не буду. Пусть трогает тот, у кого перчатки.', 'Ничего не происходит. Как и положено ничему.', 'Нет. У меня для этого слишком мало причин.'],
    talk: ['Молчит. Здесь все умеют молчать.', 'Предметы на допросе обычно раскалываются быстрее. Этот держится.', 'Не отвечает. Уважаю.'],
    useItem: ['Нет. Такие сочетания не работают даже у мафии.', 'Не сработает. И мне будет неловко.', 'Нет. Даже Макс бы до такого не додумался.', 'Не вижу связи. Все связи здесь у мафии.'],
    items: {
      gun: ['Стрелять в это? Мафия подумает, что я нервничаю.', 'Пуля тут создаст новый вопрос. Похуже старого.', 'Не буду. Мой револьвер для крупной дичи.'],
      max: [function* (g) { yield g.say('max', 'Это нельзя съесть и нельзя взорвать. Зачем оно вообще?'); }, function* (g) { yield g.say('max', 'Не хочу. Мафиози работают чужими руками. Твои подходят.'); }, function* (g) { yield g.say('max', 'Сэм, у меня лапки. Короткие. Для такого нужны длинные.'); }],
      capgun: ['Пистонами? Будет громко и совершенно бесполезно.', 'Пистонный пистолет годится, чтобы кого-нибудь напугать. Этого никто не боится.'],
      token: ['Жетоны здесь не принимают. Даже мафия.', 'Жетон идёт в автоматы. Это не автомат.'],
      roach: [function* (g) { yield g.say(null, 'Тут подслушивать некого, сэр! Тут даже муха не пролетала!', { key: 'roachvoice', color: COLORS.roach }); }, function* (g) { yield g.say(null, 'Отказываюсь, сэр! Тактически бессмысленно!', { key: 'roachvoice', color: COLORS.roach }); }]
    }
  };

  E.ACTOR_HOT.max = {
    name: 'Макс', walk: null,
    look: ['Макс. Кролик-нечто. Сегодня он ходит вразвалку, как настоящий гангстер. Или как очень сытый кролик.', 'Макс. Шепчет себе под нос: «Сделаю ему предложение, от которого он не сможет отказаться». Кому, не уточняет.'],
    talk: function* (g) { yield g.talkTo('max'); },
    use: function* (g) { yield g.say('max', 'Щекотно! Сэм, мафиози не щекочутся! Делай вид, что ты меня обыскиваешь!'); },
    items: {
      gun: function* (g) { yield* ITEMS.gun.on.max(g); },
      '*': function* (g) { yield g.say('max', 'Подарок? От тебя? Сэм, в мафии за такое целуют перстень. У тебя есть перстень?'); }
    }
  };

  E.ACTOR_HOT.sam = {
    name: 'Сэм', walk: null,
    look: ['Это я. Шляпа на месте. Шлем под шляпой тоже.', 'Я. Пёс в костюме. Для мафии костюм у меня вполне подходящий.'],
    talk: 'Поговорить с собой? Здесь меня могут подслушать. Здесь всех подслушивают.',
    use: 'Шляпа сидит ровно. Дуршлаг под ней звякает, но в казино звякает всё.',
    items: {
      gun: 'Нет. На себя у меня другие планы.',
      capgun: 'Застрелиться пистонами? Публика будет смеяться. Я бы тоже смеялся.',
      token: 'Мишка. С другой стороны тоже мишка. Здесь даже монетку бросают наверняка.',
      ace: 'Туз на лоб? Так играет Леонард. Мне так играть рано.',
      roach: function* (g) { yield g.say(null, 'Подслушивать своих не буду, сэр! Это против устава, сэр!', { key: 'roachvoice', color: COLORS.roach }); },
      kmug: 'Облиться кетчупом самому? Костюм у меня один.',
      max: function* (g) { yield g.say('max', 'Обнимашки!'); yield g.say('sam', 'Не здесь, Макс. Мафия не обнимается.'); yield g.say('max', 'Обнимается! Перед тем как стрелять!'); },
      '*': 'Мне это ни к чему.'
    }
  };

  function sybilHint(g) {
    const f = g.f;
    if (!f.sybilWitness) return 'Сибил теперь свидетель против мафии. Поговори с ней! Только не убивай по-настоящему, она нам ещё должна!';
    if (f.sybilFaked) return 'Мафия видела «убийство» через камеру на кактусе! Теперь надо, чтобы она не увидела, как Сибил встаёт! Используй меня на камере!';
    if (f.mugBack) return 'Стреляй в кружку, Сэм! Кетчуп брызнет на Сибил, будет как настоящее убийство!';
    if (g.has('kmug')) return 'Поставь кружку с кетчупом обратно на стол Сибил!';
    if (g.has('mug')) return 'Налей в кружку что-нибудь красное! У Боско у туалета стоят соусы!';
    return 'Надо инсценировать смерть Сибил. Кровь, крики, всё как в кино! Возьми её кружку, когда она поставит её на стол!';
  }

  function boscoHint(g) {
    const f = g.f;
    if (!f.knowADS) return 'Отнеси коробку с мишкой Боско. Поставь её на столик в лавке! Пусть попробует не продать!';
    if (!f.cameraOut) return g.has('magnet') ? 'Прилепи магнит с Тедом И. Бэром на камеру! Система решит, что доставили её саму!' : 'Камера Боско видит доставку и выстреливает её на улицу! В казино за «Прихлопни крысу» дают магниты с Тедом И. Бэром!';
    return 'Камеры больше нет! Скажи Боско, что снаружи мафия, и пока он смотрит в бинокль, ставь коробку на столик!';
  }

  function meatHint(g) {
    const f = g.f;
    if (!f.leonardHere) return 'Кто украл сэндвич, тот понесёт его скупщику. У нас в офисе живёт скупщик! Джимми!';
    if (!f.leonardCaught) return 'Леонард в нашем офисе! Он продаёт сэндвич Джимми! Иди и помешай сделке!';
    if (!f.leonardTalked) return 'Леонард молчит. Он маменькин сынок! Давай пошутим про его маму! Ты начинаешь, я заканчиваю!';
    if (!f.armBack) return 'Сэндвич внутри Мишки-бандита! Поставь ручку на место!';
    return 'Сыграй на Мишке-бандите! Сэндвич выпадет как выигрыш!';
  }

  function maxHint(g) {
    const f = g.f;
    if (!f.caseOpen) return 'Телефон, Сэм! Вдруг это мафия! Я всегда хотел поговорить с мафией!';
    if (!f.casinoSeen) return 'Комиссар сказал: казино Теда И. Бэра. Садись в Де Сото и выбирай его на карте!';
    if (!f.pokerWon) {
      if (!f.metLeonard) return 'В казино сидит тип с усами и всех обыгрывает. Поговори с ним! Может, он крот!';
      if (!f.pokerLost) return 'Сыграй с Леонардом в индейский покер! Жетон даст мишка у входа!';
      if (!f.noseSeen) return 'Перед каждой ставкой Леонард смотрит тебе за спину! Посмотри, что там блестит!';
      if (!g.has('ace') && !f.aceOnNose) return f.knowAce ? 'Туз пик у Джимми в норе! Джимми любит блестящее. Жетон тоже блестит!' : 'Леонард смотрит в нос статуи, как в зеркало! Приклей на нос карту! Наш туз пик уполз к Джимми в нору!';
      if (!f.aceOnNose) return 'Приклей туза на блестящий нос статуи! Пусть Леонард думает, что у него туз!';
      return 'Туз на носу! Садись играть с Леонардом! Когда он поставит всё, ставь и ты!';
    }
    if (!f.backroom) {
      if (!f.guardMet) return 'У двери в заднюю комнату стоит мишка-охранник. Поговори с ним! Мафия всегда сидит за дверью!';
      if (!f.chucklesWhisper) return 'Охранник пускает по паролю! Сыграй на Мишке-бандите. Может, кто-нибудь выйдет и шепнёт пароль!';
      if (!f.bugBought) return f.knowBug ? 'Купи у Боско жучка! У нас десять миллионов жетонов!' : 'Нам надо подслушать пароль. Боско торгует шпионскими штуками! Спроси, что у него есть!';
      if (!f.bugPlaced) return 'Посади жучка на охранника! Жучок сам найдёт, где спрятаться!';
      if (!f.passwordKnown) return 'Жучок на месте! Сыграй на Мишке-бандите ещё раз, чтобы Чаклз вышел!';
      return 'Пароль: «Оставь пистолет, возьми канноли». Скажи его охраннику!';
    }
    if (!f.joined) return 'Поговори с Чаклзом в задней комнате! Скажи, что мы хотим в мафию!';
    if (!f.inducted) {
      if (!f.sybilDone) return sybilHint(g);
      if (!f.boscoDone) return boscoHint(g);
      if (!f.meatDone) return meatHint(g);
      return 'Все поручения выполнены! Иди к Чаклзу в заднюю комнату, пусть нас посвящает!';
    }
    if (!f.chaseWon) return 'Мафия гонится за нами! Садись в Де Сото! Стреляй по рекламным щитам, когда их машина прямо за нами!';
    return 'Дверь «Не входить» в задней комнате открыта. Идём на фабрику! Надеюсь, там есть буфет!';
  }

  const MAX_GAGS = [
    ['max', 'Сэм, если я стану мафиози, мне дадут перстень? А если два перстня, я буду крёстным кроликом?'],
    ['max', 'Я придумал себе алиби на всю неделю. Там только одна дыра: я везде был с тобой.'],
    ['max', 'Знаешь, что самое страшное в мафии? Нельзя есть сэндвич, если он оригинальный. Это пытка!'],
    ['max', 'Мне скучно. Уже полчаса никто никого не пытался убить. Даже понарошку.'],
    ['max', 'Я голоден, Сэм. Хочу фрикаделек. И мести. Но сначала фрикаделек.']
  ];

  TALK.max = {
    options: g => [
      { id: 'hint', icon: 'q', text: 'Макс, есть идеи, что делать дальше?', run: function* (gg) { yield gg.say('max', gg.room && gg.room.maxHint ? gg.room.maxHint(gg) : maxHint(gg)); } },
      { id: 'how', icon: 'duck', text: 'Как настроение, Макс?', run: function* (gg) { const [w, t] = MAX_GAGS[(gg.count('maxgag') - 1) % MAX_GAGS.length]; yield gg.say(w, t); } },
      { id: 'case', icon: 'badge', text: 'Что ты думаешь о нашем деле?', when: gg => gg.f.caseOpen, run: function* (gg) {
        if (!gg.f.backroom) yield gg.say('max', 'Крот сидит в мафии и молчит. Я бы тоже молчал. С набитым ртом.');
        else if (!gg.f.inducted) yield gg.say('max', 'Мы почти мафиози, Сэм! Осталось убить друга, припугнуть друга и найти бутерброд. Проще простого!');
        else yield gg.say('max', 'Крот стал доном. Я всегда говорил, что кротам нельзя доверять. Они роют.');
      } },
      { id: 'bye', icon: 'bye', text: 'Пошли, Макс.', end: true }
    ]
  };

  E.maxHint = maxHint;

  E.phone = function (g, text) {
    return g.say(null, text, { key: 'phone', color: COLORS.phone, x: 70, y: 110 });
  };

  E.tv = function (g, text, color) {
    return g.say(null, text, { key: 'tv', color: color || COLORS.tv, x: 160, y: 199 });
  };

  E.voice = function (g, key, text, color, x, y) {
    return g.say(null, text, { key, color, x, y });
  };

  E.newGame = function (g) {
    g.vt = {};
    g.addActor('sam', { name: 'Сэм', color: COLORS.sam, speed: 62, stride: 34 });
    g.addActor('max', { name: 'Макс', color: COLORS.max, speed: 70, stride: 26, follow: 'sam' });
    g.addActor('jimmy', { name: 'Джимми Два Зуба', color: COLORS.jimmy, speed: 60, stride: 12, scale: 1.1 });
    g.addActor('leonard', { name: 'Леонард Стейкчармер', color: COLORS.leonard, speed: 60, stride: 30 });
    g.addActor('lovey', { name: 'Лапочка', costume: 'mobster', color: COLORS.lovey, speed: 58, stride: 28 });
    g.addActor('cuddly', { name: 'Обнимашка', costume: 'mobster', color: COLORS.cuddly, speed: 58, stride: 28 });
    g.addActor('guard', { name: 'Мишка-охранник', costume: 'mobster', color: COLORS.guard, speed: 58, stride: 28 });
    g.addActor('chuckles', { name: 'Чаклз', costume: 'mobster', color: COLORS.chuckles, speed: 64, stride: 28 });
    g.addActor('ted', { name: 'Дон Тед И. Бэр', costume: 'ted', color: COLORS.ted, speed: 56, stride: 30 });
    g.addActor('bosco', { name: 'Жан-Франсуа', costume: 'banda', color: COLORS.bosco });
    g.addActor('sybil', { name: 'Сибил', costume: 'witness', color: COLORS.sybil, speed: 56, stride: 26 });
    g.addActor('roach', { name: 'Жучок', costume: 'roach', color: COLORS.roach, speed: 70, stride: 8, scale: 1 });
    g.addActor('hbear', { name: 'Мишка', costume: 'hbear', color: C.purple[4], scale: 1 });
    g.inv = ['max', 'gun'];
    g.place('sam', 'office', 190, 142, 's');
    g.place('max', 'office', 190, 172, 'n');
    g.place('jimmy', 'office', 211, 128, 'w');
    g.actors.jimmy.visible = false;
    g.place('leonard', 'casino', 318, 162, 'w');
    g.place('lovey', 'playland', 104, 164, 'e');
    g.place('cuddly', 'casino', 246, 146, 's');
    g.place('guard', 'casino', 424, 152, 's');
    g.place('chuckles', 'backroom', 172, 142, 's');
    g.place('ted', 'nowhere', 0, 0, 'w');
    g.place('bosco', 'bosco', 250, 150, 's');
    g.place('sybil', 'sybil', 206, 152, 's');
    g.place('roach', 'nowhere', 0, 0, 'e');
    g.place('hbear', 'nowhere', 0, 0, 's');
    g.actors.lovey.v = 'lovey';
    g.actors.cuddly.v = 'cuddly';
    g.actors.guard.v = 'guard';
    g.actors.chuckles.v = 'chuckles';
    g.actors.ted.v = 'masked';
    g.actors.leonard.act = 'sit'; g.actors.leonard.keepAct = true;
    g.actors.cuddly.act = 'deal'; g.actors.cuddly.keepAct = true;
    g.actors.guard.act = 'block'; g.actors.guard.keepAct = true;
  };

  E.afterLoad = function (g) {
    const room = g.room;
    if (room && room.onLoad) room.onLoad(g);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
