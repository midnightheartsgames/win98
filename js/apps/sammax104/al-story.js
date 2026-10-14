(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP104 = {
    id: '104', ROOMS: {}, ITEMS: {}, TALK: {}, LAYERS: {}, ACTOR_HOT: {},
    SAVE_KEY: 'sammax104_saves', SET_KEY: 'sammax104_settings',
    TITLE_MUSIC: 'title4', CREDITS_MUSIC: 'credits4'
  };
  const { ITEMS, TALK } = E;

  Object.assign(COLORS, { superball: C.stone[4], chuckles: C.pink[4], pres: C.red[4], lincoln: C.sand[4], hugh: C.sky[4], roach: C.oak[4], poll: C.yellow[4], agents: C.gold[4], computer: C.mint[4], earpiece: C.slime[4] });

  E.NUMBER = '555-1984';
  E.CARDS = {
    life: 'Я рад, что мне дали ещё одну жизнь для моей страны.',
    wrongs: 'Два зла добра не сделают.',
    delivery: 'Бесплатная доставка на дом!',
    poster: 'Отдай всё, что есть!',
    nofeed: 'Не кормить!'
  };
  E.ISSUES = ['hitSchool', 'hitWaste', 'hitTax', 'hitPoor'];
  E.HOLIDAYS = {
    1: { name: 'День дурака' },
    2: { name: 'Песах' },
    8: { name: 'Пасха' },
    15: { name: 'День налогов' },
    22: { name: 'День Земли' },
    26: { name: 'День секретаря' },
    27: { name: 'День посадки деревьев' }
  };
  E.SPEECH = [
    ['citizens', 'Сограждане!'],
    ['honest', 'Стране нужен человек, который не лжёт.'],
    ['iam', 'Я, Авраам Линкольн, и есть этот человек.'],
    ['steps', 'Я стою здесь, на ступенях Белого дома.'],
    ['day', 'Этот день запомнят на века.'],
    ['now', 'Время действовать пришло.'],
    ['chains', 'Оковы падут!']
  ];

  E.poll = function (g) {
    const hits = E.ISSUES.filter(k => g.f[k]).length;
    const lin = 80 - hits * 10 - (g.f.scandal ? 10 : 0);
    const max = 5 + [0, 8, 17, 25, 34][hits];
    return { lin, max, none: 100 - lin - max, hits };
  };

  E.phone = function (g, text, color) {
    return g.say(null, text, { key: 'phone', color: color || COLORS.phone, x: 70, y: 110 });
  };

  E.tv = function (g, text, color) {
    return g.say(null, text, { key: 'tv', color: color || COLORS.tv, x: 160, y: 199 });
  };

  E.announce = function (g, text) {
    return g.say(null, text, { key: 'poll', color: COLORS.poll });
  };

  E.bug = function (g, text) {
    return g.say(null, text, { key: 'roachvoice', color: COLORS.roach });
  };

  const BUG_TAPES = {
    superball: [['superball', 'База, я Суперболл. Дверь на месте. Пёс на месте. Кролик, по-моему, меня нюхает.']],
    chuckles: [['chuckles', 'Ещё три эфира, и страна согласится на всё. Кукла держится хорошо. Лучше прежнего.']],
    pres: [['pres', 'Сограждане. Со-граж-да-не. Кхм. Челюсть заедает. Чаклз, масло.']],
    whizzer: [['whizzer', 'Пять недель без газировки. Я сильный. В глобусе что-то шипит. Нет. Я сильный.']],
    whizzer2: [['whizzer', 'Газировка была ошибкой. Теперь пью только то, что без газа. Любое. Лишь бы налили.']],
    superball2: [['superball', 'База, я Суперболл. База не отвечает. Продолжаю докладывать. Дверь на месте.']],
    specs: [['specs', 'Пятое лицо. В очках. Слева от Рузвельта. Нет, вместо Рузвельта.']],
    peepers: [['peepers', 'Касса. Турникет. Сувениры. Уиззера в долю не брать.']],
    bosco: [['bosco', 'Da. Nyet. Da. Надо выучить третье слово, пока не раскусили.']],
    sybil: [['sybil', 'Высокий. Солидный. С историей. Господи, я прошу так мало.']],
    sybilc: [['sybil', 'Уран распадается четыре миллиарда лет. Вот это я понимаю, постоянство.']],
    hugh: [['hugh', 'Радуга внутри. Радуга снаружи. Скоро она будет у всех. Их даже не придётся спрашивать.']],
    jimmy: [['jimmy', 'Субсидии на сыр. Так сенатору и скажу. Если сенатор не кот.']],
    lincoln: E.SPEECH.map(([, text]) => ['lincoln', text])
  };
  E.BUG_TAPES = BUG_TAPES;

  E.bugReplay = function* (g, rec) {
    for (const [who, text] of BUG_TAPES[rec] || []) {
      const a = g.actors[who];
      yield g.say(null, text, { key: 'bugplay', color: a ? a.color : COLORS.roach });
    }
    yield E.bug(g, 'Конец записи, сэр!');
  };

  E.bugPlant = function* (g, who, tape) {
    const roach = g.actors.roach;
    const a = g.actors[who];
    if (!a) return;
    const sam = g.actors.sam;
    yield g.say('sam', 'Сержант, задание: подобраться и запомнить каждое слово.');
    yield E.bug(g, 'Есть, сэр!');
    g.drop('roach');
    g.place('roach', g.roomId, sam.x + 8, sam.y, 'e');
    roach.visible = true; roach.scripted = true;
    const ty = Math.max(a.y, sam.y - 30);
    yield g.walkTo('roach', a.x + 10, ty, { free: true, speed: 1.6 });
    roach.visible = false;
    yield 1.2;
    g.place('roach', g.roomId, a.x + 10, ty, 'w');
    roach.visible = true;
    yield g.walkTo('roach', sam.x + 6, sam.y, { free: true, speed: 1.6 });
    g.place('roach', 'nowhere', 0, 0);
    roach.scripted = false;
    g.give('roach');
    g.f.bugRec = tape || who;
    yield E.bug(g, 'Разведка завершена, сэр! Докладываю!');
    yield* E.bugReplay(g, g.f.bugRec);
  };

  function* bugLook(g) {
    const rec = g.f.bugRec;
    if (rec && BUG_TAPES[rec]) {
      yield g.say('sam', 'Сержант, что на ленте?');
      yield* E.bugReplay(g, rec);
      return;
    }
    yield g.say('sam', 'Сержант Жучок. Подслушивающее устройство от Боско. Служит у нас с дела о казино и ест за троих.');
    yield E.bug(g, 'Готов к заданию, сэр! Сажайте на кого угодно, сэр!');
  }

  Object.assign(ITEMS, {
    max: { name: 'Макс', icon: 'max', look: function* (g) {
      if (g.f.elected) {
        yield g.say('sam', 'Макс. Президент Соединённых Штатов. Я это произнёс и сам себе не поверил.');
        yield g.say('max', 'Обращайся ко мне «ваше пушистое превосходительство»!');
        return;
      }
      yield g.say('sam', 'Макс. С утра он сердит на правительство. Вчера он о нём ещё не знал.');
      yield g.say('max', 'Они покусились на пистолеты, Сэм. И на пудинг. Это личное.');
    } },
    gun: { name: 'Пистолет Сэма', icon: 'gun', look: ['Мой револьвер. По новому закону его положено зарегистрировать. По старой привычке я его просто ношу.', 'Заряжен. В Вашингтоне это считается политическим заявлением.'] },
    roach: { name: 'Жучок', icon: 'roach', look: function* (g) { yield* bugLook(g); } },
    glove: { name: 'Боксёрская перчатка', icon: 'glove', look: 'Перчатка Макса из дела о кассетах. Ею мы выбили гипноз из Пиперса. Один удар, и человек снова думает сам. Или хотя бы снова думает.' },
    poster: { name: 'Армейский плакат', icon: 'poster4', look: 'Плакат с нашей улицы. Сержант тычет пальцем в прохожего: «Отдай всё, что есть!» Вербовщик был честным человеком.' },
    delivery: { name: 'Табличка Хью Блисса', icon: 'delivery', look: '«Бесплатная доставка на дом!» Табличка со стойки Хью Блисса. Радужная кайма и дырка от одного шурупа.' },
    nofeed: { name: 'Табличка с пруда', icon: 'nofeed', look: '«Не кормить!» Табличка с пруда у Белого дома. Под надписью нарисована подводная лодка. Краска на лодке свежая.' },
    flyer: { name: 'Листовка Линкольна', icon: 'flyer', look: '«ТЫ НУЖЕН МНЕ!» Ниже мелко: высокий, надёжный, с богатой историей. Занимал высший пост. Ищет поддержки. Читается как объявление о знакомстве.' },
    ribbon: { name: 'Красная лента', icon: 'ribbon', look: 'Лента почётного секретаря. Президент прикалывает её, и человек входит в кабинет министров. Прав она не даёт. Даёт профессиональный праздник.' },
    dater: { name: 'Углеродный датировщик', icon: 'dater', look: 'Прибор Сибил. Наводишь на вещь, жмёшь курок, и он называет её возраст. Похож на кассовый сканер, только честнее.' },
    serum: { name: 'Сыворотка правды', icon: 'serum', look: function* (g) {
      yield g.say('sam', 'Сыворотка правды от Босковорского. Бутылка без этикетки. Прозрачная, сорок градусов.');
      yield g.say('max', 'Сэм, это водка.');
      yield g.say('sam', 'Это сыворотка, Макс. Водку за сто миллионов не продают.');
    } },
    beacon: { name: 'Радиомаяк', icon: 'beacon', look: 'Маяк наведения с гербом Министерства обороны. Мигает красным. Куда его прицепишь, туда и прилетит.' },
    head: { name: 'Голова президента', icon: 'head', look: 'Голова президента. Дерево, шарниры и улыбка на петлях. Вместо глаз крестики. За неделю она подписала сорок законов.' }
  });

  ITEMS.gun.on = {
    max: function* (g) { yield g.say('max', 'Целься в меня! Я проверю, зарегистрирована ли пуля!'); yield g.say('sam', 'Оставь шутки про регистрацию, Макс. Мне от них не по себе.'); },
    '*': 'Стрелять по собственному имуществу? В этом городе так поступает только бюджет.'
  };
  ITEMS.max.on = {
    '*': function* (g) { yield g.say('max', 'Дай сюда, я это конфискую! Именем меня!'); },
    glove: function* (g) { yield g.say('max', 'Моя перчатка! Она соскучилась по чужим лицам!'); },
    serum: function* (g) { yield g.say('max', 'Дай глотнуть!'); yield g.say('sam', 'Тебе незачем, Макс. Ты и так говоришь всё, что думаешь. Иногда раньше, чем подумал.'); },
    roach: function* (g) { yield g.say('max', 'Сержант, скажи «пудинг»!'); yield E.bug(g, 'Запрещённое слово, сэр! Не могу, сэр!'); },
    flyer: function* (g) { yield g.say('max', '«Ты нужен мне». Сэм, ко мне пристаёт статуя!'); },
    beacon: function* (g) { yield g.say('max', 'Дай поносить! Я буду мигать!'); yield g.say('sam', 'На кого прицепишь, в того и прилетит. Искать нового напарника мне сейчас некогда.'); },
    head: function* (g) { yield g.say('max', g.f.elected ? 'У меня теперь две головы! Вторая запасная, для обращений к нации!' : 'Дай поносить! Я буду президентом, пока не видит Чаклз!'); },
    ribbon: function* (g) { yield g.say('max', 'Себя в секретари? Я президент, Сэм. Мне падать некуда.'); },
    dater: function* (g) { g.sfx('scan'); yield g.say('sam', 'Ноль. Либо прибор сломался, либо тебя ещё не изобрели.'); yield g.say('max', 'Я вне времени! Как вино! Только наоборот!'); }
  };
  ITEMS.dater.on = {
    gun: function* (g) { g.sfx('scan'); yield g.say('sam', 'Револьверу сорок лет. Прибор мелко добавил: «Пора на покой». Прибору виднее, но решать мне.'); },
    roach: function* (g) { g.sfx('scan'); yield E.bug(g, 'Возраст личного состава засекречен, сэр!'); },
    glove: function* (g) { g.sfx('scan'); yield g.say('sam', 'Перчатке три года. Два из них она пролежала в шкафу.'); },
    serum: function* (g) { g.sfx('scan'); yield g.say('sam', '«Возраст: вчера». Выдержка у сыворотки так себе.'); },
    beacon: function* (g) { g.sfx('scan'); yield g.say('sam', 'Маяк выпущен в прошлом году. Гарантия ещё действует. Интересно, на что.'); },
    head: function* (g) { g.sfx('scan'); yield g.say('sam', 'Голове две недели. Одну из них она правила страной.'); },
    '*': function* (g) { g.sfx('scan'); yield g.say('sam', 'Прибор пищит и пишет: «Недавно». Для истории мелковато.'); }
  };
  ITEMS.serum.on = {
    roach: function* (g) { yield E.bug(g, 'На посту не употребляю, сэр!'); },
    gun: 'Поить револьвер? Он у меня и так болтливый.'
  };
  ITEMS.poster.on = { delivery: 'Две вывески рядом. Вместе выходит реклама грабежа с доставкой.', nofeed: 'Армия просит отдать всё, пруд просит не кормить. Государство никак не решит, чего хочет.' };
  ITEMS.delivery.on = { nofeed: 'Доставка есть, кормить нельзя. Так работает половина ресторанов.' };

  E.GENERIC = {
    look: ['Ничего государственной важности.', 'Протокол составлять не о чем.', 'Обычная вещь. В этом городе таких миллионы, и все куплены на наши налоги.', 'Улик нет, одна пыль.'],
    use: ['Трогать не стану. На этом могут остаться мои отпечатки.', 'Ничего не вышло. С законами тоже так бывает.', 'Нет. Случай неподходящий.', 'Не знаю, что с этим делать. Макс знает, но я не спрошу.'],
    talk: ['Молчит. Имеет право.', 'Ответа нет. Пойду спрошу кого-нибудь живого.', 'Не отвечает. Наверное, ждёт адвоката.'],
    useItem: ['Одно с другим не вяжется.', 'Нет. Это кончится рапортом.', 'Попробовать можно. Толку не будет.', 'Даже Макс бы удивился.'],
    items: {
      gun: ['Стрелять в это? В столице за такое дают срок и экскурсию.', 'Пуля тут ничего не решит. Разве что вопрос с моей свободой.', 'Не буду. Сегодня я стреляю только глазами.'],
      max: [function* (g) { yield g.say('max', 'Оно не голосует и не взрывается. Мне неинтересно.'); }, function* (g) { yield g.say('max', 'Не трону. У меня теперь репутация. Свеженькая.'); }, function* (g) { yield g.say('max', 'Сэм, пусть этим займётся аппарат президента. Это ты.'); }],
      roach: [function* (g) { yield E.bug(g, 'Объект молчит, сэр! Слушать нечего, сэр!'); }, function* (g) { yield E.bug(g, 'Отказываюсь, сэр! Тактически бессмысленно!'); }],
      glove: ['Бить это перчаткой? У перчатки есть кодекс. У меня тоже, но мой короче.', 'Перчатка лечит гипноз. Здесь лечить нечего.'],
      dater: [function* (g) { g.sfx('scan'); yield g.say('sam', 'Прибор пищит: «Возраст обычный». Историческим местом это не станет.'); }, function* (g) { g.sfx('scan'); yield g.say('sam', 'Лет десять, если прибор не врёт. До музея не дотягивает.'); }],
      serum: ['Поить сывороткой то, что не разговаривает? Правды я так не узнаю. Узнаю только, что бутылка кончилась.', 'Сыворотку я берегу для того, кому есть что скрывать.'],
      beacon: ['Цеплять маяк сюда? Ракета разбираться не станет.', 'Маяк дождётся цели покрупнее.'],
      ribbon: ['Ленту прикалывают людям. Желательно тем, кто не дёрнется.'],
      head: ['Голове президента тут делать нечего. Таким, как она, место среди улик.', 'Показывать это голове? Она уже всё видела и всё подписала.']
    }
  };

  E.ACTOR_HOT.max = {
    name: 'Макс', walk: null,
    look: ['Макс. Кролик-нечто. С утра требует, чтобы ему вернули пудинг, которого у него не было.', 'Макс. Тренирует перед зеркальной лужей рукопожатие. Пока выходит захват.'],
    talk: function* (g) { yield g.talkTo('max'); },
    use: function* (g) { yield g.say('max', 'Щекотно! Политиков не щекочут! Их подкупают!'); },
    items: {
      gun: function* (g) { yield* ITEMS.gun.on.max(g); },
      glove: function* (g) { yield* ITEMS.max.on.glove(g); },
      serum: function* (g) { yield* ITEMS.max.on.serum(g); },
      roach: function* (g) { yield* ITEMS.max.on.roach(g); },
      flyer: function* (g) { yield* ITEMS.max.on.flyer(g); },
      beacon: function* (g) { yield* ITEMS.max.on.beacon(g); },
      head: function* (g) { yield* ITEMS.max.on.head(g); },
      ribbon: function* (g) { yield* ITEMS.max.on.ribbon(g); },
      dater: function* (g) { yield* ITEMS.max.on.dater(g); },
      '*': function* (g) { yield g.say('max', 'Подношение? Клади к остальным. Остальных пока нет, будь первым!'); }
    }
  };

  E.ACTOR_HOT.sam = {
    name: 'Сэм', walk: null,
    look: ['Это я. Шляпа на месте, под шляпой дуршлаг. Гипнозу сегодня опять не повезёт.', 'Я. Пёс в костюме. В этом городе костюм сходит за убеждения.'],
    talk: 'Говорить с собой в Вашингтоне опасно. Могут записать и процитировать.',
    use: 'Галстук на месте. В столице встречают по галстуку, а провожают по повестке.',
    items: {
      gun: 'Нет. Я себе ещё пригожусь.',
      glove: 'Бить себя по голове рано. Гипноза на мне нет, дуршлаг под шляпой держит.',
      dater: 'Наводить прибор на себя не стану. Собачий возраст умножают на семь, мне и так хватает.',
      serum: 'На службе я пью только кофе. Правду говорю и без сыворотки, когда деваться некуда.',
      beacon: 'Цеплять маяк на себя? Я ещё не дописал завещание. Макс там пока в двух пунктах из трёх.',
      ribbon: 'Приколоть ленту себе? Секретарём при Максе я работаю и так. Без ленты и без выходных.',
      roach: function* (g) { yield E.bug(g, 'Своих не слушаю, сэр! Устав, сэр!'); },
      max: function* (g) { yield g.say('max', 'Обнимашки!'); yield g.say('sam', 'Объятия по четвергам, Макс. Таков закон.'); yield g.say('max', 'Сегодня не четверг? Тогда я преступник!'); },
      '*': 'Мне это ни к чему.'
    }
  };

  function signHint(g, flag, item, topic, fetch) {
    if (g.f[flag]) return null;
    const card = '«' + E.CARDS[item] + '»';
    if (g.f.cards[0] === item) return 'На стойке сейчас ' + card + ' Спроси Линкольна про ' + topic + '!';
    if (g.f.cards.includes(item)) return 'Карточка ' + card + ' уже на стойке. Листай стойку, пока она не окажется сверху, и спроси про ' + topic + '!';
    if (g.has(item)) return 'Поставь ' + card + ' на стойку с карточками и спроси Линкольна про ' + topic + '!';
    return fetch;
  }

  function campaignHint(g) {
    const f = g.f;
    if (!f.maxRuns) return 'Поговори с Линкольном! Скажи, что у него есть соперник! Это я!';
    const school = signHint(g, 'hitSchool', 'wrongs', 'церковь и школу', '');
    if (school) return school;
    const waste = signHint(g, 'hitWaste', 'delivery', 'ядовитые отходы', 'У Хью Блисса на нашей улице висит табличка «Бесплатная доставка на дом». Попроси его показать фокус и хватай её, пока он исчез!');
    if (waste) return waste;
    const tax = signHint(g, 'hitTax', 'poster', 'налоги', 'На стене у нашего гаража висят армейские плакаты «Отдай всё, что есть!». Один еле держится!');
    if (tax) return tax;
    const poor = signHint(g, 'hitPoor', 'nofeed', 'голодных', 'У пруда перед Белым домом торчит табличка «Не кормить!». Голодным избирателям она понравится!');
    if (poor) return poor;
    if (!f.knowFamily) return 'Осталось спросить Линкольна про семейные ценности! Вдруг у него их нет!';
    if (!f.sybilSmitten) return g.has('flyer') ? 'Отнеси листовку Линкольна Сибил! Она ищет высокого мужчину с историей, а листовка читается как анкета!' : 'Линкольн хвалится верностью. Возьми его листовку со сцены и покажи Сибил! Она как раз ищет высокого и с историей!';
    if (f.bugRec !== 'lincoln') return 'Посади жучка на Линкольна и попроси сказать речь! Нам нужен его голос!';
    return 'Приложи жучка к телефону у нас в офисе и позвони Сибил голосом Линкольна! Назначь ей свидание на ступенях Белого дома!';
  }

  function serumHint(g) {
    const f = g.f;
    if (!f.knowSerum) return 'Попперы слишком вежливые для войны. У Боско наверняка есть что-нибудь, от чего люди говорят правду!';
    if (!f.tikiDated) return 'Сыворотка стоит сто миллионов. На моём столе лежит книга бюджета, но деньги дают только историческим местам. Спроси Сибил, как она узнаёт возраст вещей!';
    if (!f.sybilFunded) return 'Контора Сибил теперь в списке! Открой книгу бюджета на моём столе и отдай ей сто миллионов. Она уедет в отпуск и оставит прибор!';
    if (!f.weeniesDated) return g.has('dater') ? 'Наведи датировщик на сосиски Боско! Они старше всего, что я нюхал!' : 'Сибил уехала! Забери датировщик с её стола!';
    if (!f.boscoFunded) return 'Лавка Боско теперь историческая! Открой книгу бюджета и отдай сто миллионов ей!';
    return 'Боско получил свои миллионы! Иди к нему, он отдаст сыворотку!';
  }

  function superHint(g) {
    const f = g.f;
    if (!f.superSec) return g.has('ribbon') ? 'Приколи ленту Суперболлу! Сделаем из него секретаря!' : 'Суперболл уйдёт только в свой праздник. На моём столе лежит лента почётного секретаря!';
    if (f.today !== 26) return 'В календаре есть День секретаря, двадцать шестое апреля. Переклей туда листок «Сегодня»!';
    return 'Сегодня День секретаря! Вели Суперболлу взять выходной!';
  }

  function maxHint(g) {
    const f = g.f;
    if (!f.caseOpen) return 'Телефон, Сэм! Вдруг это президент! Я скажу ему всё, что думаю!';
    if (!f.presMet) {
      if (f.superHold) return 'Суперболл висит на телефоне! Едем в Белый дом, дверь свободна!';
      if (!f.lawnSeen) return 'Комиссар сказал: Белый дом. Садись в Де Сото и выбирай Вашингтон!';
      if (!f.knowNumber) return 'Агент у двери нас не пустит. Рядом с дверью стоит таксофон. Посмотри, какой у него номер!';
      return g.roomId === 'office' ? 'Звони в Белый дом, Сэм! И вели агенту ждать на линии!' : 'Суперболл отвечает на служебный телефон и делает, что ему скажут. Позвоним ему из нашего офиса!';
    }
    if (!f.puppetDown) {
      if (!f.whizzerIn) return 'Пока Чаклз рядом, президента не стукнуть. Президент ждёт какого-то губернатора. Выйдем и посмотрим, кто приехал!';
      if (!f.chucklesOut) {
        if (!f.whizzerSoda) return 'Скажи президенту, что мы готовы переводить! И переведи так, чтобы Уиззеру налили газировки!';
        return 'Уиззеру надо в туалет! Переведи, будто он спрашивает дорогу в Военную комнату! Чаклз уведёт его лично!';
      }
      if (!g.has('glove')) return 'Свежий гипноз лечится ударом по голове! Моя перчатка лежит у нас в шкафу, на полке рядом с мишкой!';
      return 'Чаклза нет! Примени перчатку к президенту, а бить буду я!';
    }
    if (!f.elected) return campaignHint(g);
    if (!g.seen.inaug) return 'Я президент! Идём в Овальный кабинет! У президента должна быть кнопка!';
    if (!f.war && !f.serumGot) return serumHint(g);
    if (!f.war) return 'Напои Уиззера сывороткой правды! Он расскажет братьям всё, что они думают друг о друге!';
    if (!f.superGone) return superHint(g);
    if (!f.knowBeacon) return 'Война идёт, дверь свободна! В Военную комнату! Посмотрим, куда целятся ракеты!';
    if (!f.beaconTaken) return 'Маяк наведения висит в лавке Боско, за табличкой «Скидка» под камерой! Забери его!';
    if (!f.beaconOn) return 'Садись в Де Сото и гонись за Линкольном! Подъедем ближе, выбери маяк справа и щёлкни по Линкольну. Бросать буду я!';
    return 'Маяк на Линкольне! В Военную комнату! Наводи прицел и жми «Огонь»!';
  }

  const MAX_GAGS = [
    'Сэм, если меня выберут, я перекрашу Белый дом. В цвет мяса.',
    'Знаешь, чем хороша политика? Врать можно стоя.',
    'Я придумал лозунг: «Макс. Хуже не будет. Будет громче».',
    'Мне нужна первая леди, Сэм. Или хотя бы первая пицца.',
    'Как думаешь, у президента есть кнопка «взорвать всё»? А кнопка «взорвать чуть-чуть»?'
  ];
  const DECREES = [
    'Указ! С этой минуты в неделе два вторника! Понедельник отменяется!',
    'Указ! Налоговой службе явиться ко мне с повинной!',
    'Указ! Пудинг помиловать! Всех, кто его запрещал, накормить пудингом!',
    'Указ! Псам в шляпах присвоить звание «напарник президента»!'
  ];

  TALK.max = {
    options: g => [
      { id: 'hint', icon: 'q', text: 'Макс, есть идеи, что делать дальше?', run: function* (gg) { yield gg.say('max', gg.room && gg.room.maxHint ? gg.room.maxHint(gg) : maxHint(gg)); } },
      { id: 'how', icon: 'duck', text: 'Как настроение, Макс?', run: function* (gg) { yield gg.say('max', MAX_GAGS[(gg.count('maxgag') - 1) % MAX_GAGS.length]); } },
      { id: 'decree', icon: 'ribbon', text: 'Издай какой-нибудь указ.', when: gg => gg.f.elected, run: function* (gg) {
        const n = (gg.count('decree') - 1) % DECREES.length;
        gg.sfx('stamp');
        yield gg.say('max', DECREES[n]);
        if (n === 3) yield gg.say('sam', 'Служу президенту. Других вариантов у меня, похоже, нет.');
      } },
      { id: 'case', icon: 'badge', text: 'Что ты думаешь о нашем деле?', when: gg => gg.f.caseOpen, run: function* (gg) {
        if (!gg.f.presMet) yield gg.say('max', 'Президент сошёл с ума за неделю. Я бы управился за день, но мне не давали страну.');
        else if (!gg.f.puppetDown) yield gg.say('max', 'У него глаза крутятся! Его надо стукнуть! Я готов стучать за родину!');
        else if (!gg.f.elected) yield gg.say('max', 'Статуя хочет в президенты. Я тоже хочу. Зато я живой и кусаюсь.');
        else yield gg.say('max', 'Я президент, а Линкольн топчет штаты. Надо его остановить. Желательно чем-нибудь большим и быстрым.');
      } },
      { id: 'bye', icon: 'bye', text: g.f.elected ? 'Не буду мешать, господин президент.' : 'Пошли, Макс.', end: true }
    ]
  };

  E.maxHint = maxHint;

  E.newGame = function (g) {
    g.vt = {};
    g.addActor('sam', { name: 'Сэм', color: COLORS.sam, speed: 62, stride: 34 });
    g.addActor('max', { name: 'Макс', color: COLORS.max, speed: 70, stride: 26, follow: 'sam' });
    g.addActor('jimmy', { name: 'Джимми Два Зуба', color: COLORS.jimmy, scale: 1.2 });
    g.addActor('superball', { name: 'Агент Суперболл', color: COLORS.superball, speed: 60, stride: 30 });
    g.addActor('chuckles', { name: 'Чаклз', costume: 'agentc', color: COLORS.chuckles, speed: 66, stride: 28 });
    g.addActor('pres', { name: 'Президент', costume: 'puppet', color: COLORS.pres });
    g.addActor('lincoln', { name: 'Авраам Линкольн', color: COLORS.lincoln, speed: 44, stride: 70, scale: 1 });
    g.addActor('whizzer', { name: 'Губернатор Уиззер', color: COLORS.whizzer, speed: 95, stride: 20, scale: 1 });
    g.addActor('specs', { name: 'Губернатор Спекс', color: COLORS.specs, speed: 80, stride: 20 });
    g.addActor('peepers', { name: 'Губернатор Пиперс', color: COLORS.peepers, speed: 90, stride: 20 });
    g.addActor('hugh', { name: 'Хью Блисс', color: COLORS.hugh, speed: 50, stride: 26 });
    g.addActor('bosco', { name: 'Товарищ Босковорский', costume: 'boscov', color: COLORS.bosco });
    g.addActor('sybil', { name: 'Сибил', costume: 'sybil4', color: COLORS.sybil, speed: 84, stride: 26 });
    g.addActor('roach', { name: 'Жучок', costume: 'roach', color: COLORS.roach, speed: 70, stride: 8, scale: 1 });
    g.inv = ['max', 'gun', 'roach'];
    g.f.cards = ['life', 'wrongs'];
    g.f.today = 12;
    g.f.budget = '';
    g.place('sam', 'office', 150, 166, 's');
    g.place('max', 'office', 120, 170, 'e');
    g.place('jimmy', 'lawn', 238, 183, 'e');
    g.place('superball', 'lawn', 330, 141, 's');
    g.place('chuckles', 'oval', 306, 146, 'w');
    g.place('pres', 'oval', 260, 143, 's');
    g.place('lincoln', 'nowhere', 0, 0, 's');
    g.place('whizzer', 'nowhere', 0, 0, 'e');
    g.place('specs', 'nowhere', 0, 0, 'e');
    g.place('peepers', 'nowhere', 0, 0, 'e');
    g.place('hugh', 'street', 372, 150, 's');
    g.place('bosco', 'bosco', 250, 150, 's');
    g.place('sybil', 'sybil', 206, 152, 's');
    g.place('roach', 'nowhere', 0, 0, 'e');
    for (const id of ['whizzer', 'specs', 'peepers']) g.actors[id].v = 'gov';
    g.actors.sybil.v = 'heart';
    g.actors.jimmy.act = 'peek'; g.actors.jimmy.keepAct = true;
    g.actors.superball.act = 'block'; g.actors.superball.keepAct = true;
  };

  E.afterLoad = function (g) {
    const room = g.room;
    if (room && room.onLoad) room.onLoad(g);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
