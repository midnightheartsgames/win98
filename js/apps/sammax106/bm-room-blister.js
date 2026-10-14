(function (S) {
  'use strict';
  const E = S.EP106;
  const { ROOMS, TALK, LAYERS } = E;
  const SEAT = { car: [608, 146], sign: [621, 58] };
  const CAR_X = 592;
  const AT = { abe: { x: 84, y: 34 }, syb: { x: 236, y: 40 }, sam: { x: 84, y: 190 } };
  const abe = (g, t) => g.say('lincoln', t, AT.abe);
  const syb = (g, t) => g.say('sybil', t, AT.syb);
  let carBuf = null;

  function* tween(g, dur, fn) {
    const t0 = g.time;
    while (g.time - t0 < dur && !g.skipping) { fn((g.time - t0) / dur); yield null; }
    fn(1);
  }

  function placeRed(g) {
    const red = g.actors.maxred;
    const st = g.vt.red || (g.vt.red = { seat: 'car', t: 0 });
    const p = SEAT[st.seat];
    g.place('maxred', 'blister', p[0], p[1], 'w');
    red.v = 'red';
    red.upside = false;
  }

  function* shotAt(g) {
    const red = g.actors.maxred;
    yield g.walkTo('sam', 540, 172);
    g.face('sam', 'e');
    red.act = 'shoot'; red.actT = 0.8;
    g.sfx('gun');
    g.fx.flash = 0.2;
    yield g.say('maxred', 'ПИФ-ПАФ! Ближе не подходи! Это МОИ горки!');
    yield g.walkTo('sam', 512, 176);
    g.face('sam', 'e');
    yield g.say('sam', 'Пуля сбила пылинку с моей шляпы. Рука у Макса всегда была твёрдая. Отдельно от Макса она ещё твёрже.');
  }

  function* knock(g) {
    const red = g.actors.maxred;
    yield* tween(g, 0.4, k => { g.vt.carX = CAR_X - k * 24; red.x = 608 - k * 24; });
    g.sfx('bonk');
    g.fx.shake = 0.6;
    g.fx.flash = 0.3;
    red.upside = true;
    g.place('maxred', 'blister', 566, 136, 'w');
    yield* tween(g, 0.6, k => { g.vt.carX = CAR_X - 24 - k * 38; });
    yield* tween(g, 0.8, k => { g.vt.carX = 530 + k * 62; });
    g.vt.carX = CAR_X;
    yield g.say('maxred', 'Ай. Кто повесил тут ложку?');
    yield g.say('sam', 'Ложковилка сняла его с вагонетки на полном ходу. Лежит вверх ногами и больше не стреляет.');
    red.upside = false;
    g.place('maxred', 'nowhere', 0, 0);
    yield g.say('sam', 'Красный Макс выцвел и втянулся в собственную руку. Рука ещё тёплая и сжата в кулак.');
    yield* E.partBack(g, 'red');
  }

  function* shootButton(g) {
    const red = g.actors.maxred;
    const here = red.room === 'blister';
    const seat = here ? (g.vt.red || {}).seat : '';
    g.faceTo('sam', 530);
    yield g.anim('sam', 'shoot', 0.5);
    g.sfx('gun');
    yield 0.2;
    g.sfx('ding');
    yield g.say('sam', 'Попал. Кнопка утоплена, вагонетка пошла.');
    g.sfx('whoosh');
    if (seat === 'car' && g.f.sporkBent) { yield* knock(g); return; }
    yield* tween(g, 0.9, k => { g.vt.carX = CAR_X - k * 62; if (seat === 'car') red.x = 608 - k * 62; });
    yield* tween(g, 0.9, k => { g.vt.carX = 530 + k * 62; if (seat === 'car') red.x = 546 + k * 62; });
    g.vt.carX = CAR_X;
    if (seat === 'car') {
      yield g.say('maxred', 'ЕЩЁ! ЕЩЁ КРУГ! И ПАТРОНОВ!');
      yield g.say('sam', 'Он прокатился до упора и обратно. Доволен. Перезаряжает на ходу.');
    } else if (here) {
      yield g.say('maxred', 'Мимо! Я наверху! Ха!');
      yield g.say('sam', 'Вагонетка съездила пустой. Красный Макс проводил её взглядом с вывески.');
    } else yield g.say('sam', 'Вагонетка съездила до упора и вернулась. Кататься на ней некому.');
  }

  function* bendSpork(g) {
    if (g.f.sporkBent) { yield g.say('sam', 'Ложковилка уже согнута. Висит над рельсами на высоте головы.'); return; }
    yield g.say('sam', 'Наполовину она всё-таки ложка. Талисману хватает и половины.');
    g.sfx('hypno');
    yield 0.6;
    g.sfx('clang');
    g.f.sporkBent = true;
    yield g.say('sam', 'Согнулась. Золотой Хью теперь держит её поперёк рельсов, как шлагбаум.');
    if (g.actors.maxred.room === 'blister') yield g.say('max', 'Красный я любит кататься, Сэм. Быстро. Он никогда не смотрит, что впереди.');
  }

  function* endCall(g) {
    yield g.fadeOut(5);
    g.closeup = null;
    g.vt.call = null;
    g.music('blister6');
    yield g.fadeIn(5);
  }

  function* failCall(g, reply) {
    const cu = g.closeup;
    if (cu) cu.mood = 'angry';
    yield syb(g, reply);
    g.sfx('hangup');
    g.endDialog();
    yield* endCall(g);
    const n = g.count('callFail');
    yield g.say('lincoln', 'Она повесила трубку, сэр. Мрамор не краснеет, но я близок.');
    yield g.say('sam', n === 1 ? 'Королевы обидчивы. Сибил была обидчива ещё до короны.' : 'Опять мимо. Я знаю шесть её профессий и до сих пор не знаю, что ей приятно слышать.');
  }

  function* winCall(g) {
    const cu = g.closeup;
    if (cu) cu.mood = 'swoon';
    yield syb(g, 'Один на один... Авраам. Эйб. Четверг, королевский каток. Коньки мы вам найдём. Ноги тоже.');
    yield abe(g, 'Я буду, сударыня. Я встану там, где вы меня поставите.');
    g.sfx('hangup');
    g.endDialog();
    yield* endCall(g);
    g.actors.lincoln.v = '';
    g.f.gastroGot = true;
    g.give('gastro');
    yield g.say('lincoln', 'Она назвала меня «Эйб», сэр. Вы подсказывали лучше любой карточки. Талисман ваш.');
    yield g.say('sam', g.f.caseInMax ? 'Талисман гастрокинеза. Власть над чужим желудком. Макс, не пяться.' : 'Талисман гастрокинеза. Власть над чужим желудком. Применять буду с осторожностью.');
    yield g.say('max', 'Сэм, ты свёл королеву с головой! Хочу на свадьбу! Я буду бросать рис. Вместе с кастрюлей!');
  }

  function* prompt(g, line, reply, good) {
    yield abe(g, line);
    if (!good) { yield* failCall(g, reply); return; }
    const call = g.vt.call;
    if (call.stage >= 2) { yield* winCall(g); return; }
    if (g.closeup) g.closeup.mood = '';
    yield syb(g, reply);
    call.stage++;
  }

  const hint = (id, icon, line, reply, good) => ({ id, icon, text: 'Шепнуть: «' + line + '»', say: false, run: function* (g) { yield* prompt(g, line, reply, good); } });

  const STAGES = [
    [
      hint('order', 'ex', 'Сударыня, успокойтесь немедленно.', 'Нам приказывают? Нам? До свидания, Авраам.', false),
      hint('relax', 'zzz', 'Расслабьтесь, сударыня. Просто расслабьтесь.', 'Это наш первый указ. Слово в слово. Вы читали наши указы, Авраам?', true),
      hint('state', 'badge', 'Я звоню по государственному делу.', 'По государственным делам звонят премьер-министру. До свидания.', false)
    ],
    [
      hint('fox', 'fox6', 'Сударыня, вы лиса. Хладнокровная каменная лиса.', 'Лиса... Так нас зовут только подданные. И только в лучшие дни.', true),
      hint('battle', 'star', 'Вы прекрасны, как Геттисберг на рассвете.', 'Нас сравнили с полем боя. Благодарим. До свидания.', false),
      hint('congress', 'f:abe6', 'Вы мудры, как конгресс.', 'Как конгресс? Мы вешаем трубку.', false)
    ],
    [
      hint('memorial', 'pray', 'Приглашаю вас на мой мемориал.', 'От него осталась лестница. Мы на ней уже стояли. Одни.', false),
      hint('dinner', 'donut', 'Поужинаем? Я угощаю.', 'Вам нечем ужинать, Авраам. И не во что.', false),
      hint('hockey', 'hockey6', 'Сыграем один на один, сударыня. В любовный хоккей.', '', true)
    ]
  ];

  TALK.call = {
    options: g => STAGES[Math.min(2, (g.vt.call || { stage: 0 }).stage)].concat([
      { id: 'bye', icon: 'phone', text: 'Повесить трубку.', say: false, end: true, run: function* (gg) {
        gg.sfx('hangup');
        gg.endDialog();
        yield* endCall(gg);
        yield gg.say('lincoln', 'Вы повесили трубку, сэр. Я не успел даже вздохнуть.');
      } }
    ])
  };

  function* callSybil(g) {
    yield g.say('sam', 'Канцелярия королевы Канады. Держитесь, господин Линкольн, трубка у вашего уха.');
    g.sfx('dial');
    yield 0.9;
    g.sfx('ring');
    yield 0.9;
    yield g.fadeOut(5);
    g.closeup = { kind: 'call6', t0: g.time, mood: 'wait' };
    g.music('queen6');
    yield g.fadeIn(5);
    g.closeup.mood = '';
    yield syb(g, 'Канцелярия королевы Канады. Мы слушаем.');
    yield abe(g, 'Сударыня... Это Авраам.');
    g.closeup.mood = 'angry';
    yield syb(g, 'Авраам. Тот самый, который видел нас впервые.');
    yield g.say('sam', 'Трубку она пока не повесила. Дальше шёпотом, господин Линкольн. Повторяйте за мной.', AT.sam);
    g.vt.call = { stage: 0 };
    yield g.talkTo('call');
  }

  TALK.abe = {
    start: function* (g) {
      if (g.f.abeMet) return;
      g.f.abeMet = true;
      yield g.say('lincoln', 'Сограждане. Я потерял тело, но не потерял слог.');
      yield g.say('sam', 'Здравствуйте, господин Линкольн. Мы знакомы. Ракету на шоссе 95 наводили мы.');
      yield g.say('lincoln', 'Я помню, сэр. У мрамора хорошая память.');
    },
    options: [
      { id: 'why', icon: 'rainbow6', text: 'Что вы делаете в Пузыре?', run: function* (g) {
        yield g.say('lincoln', 'Ищу покоя, сэр. Господин Блисс подобрал меня на шоссе, дал тележку и талисман.');
        if (!g.f.gastroGot) yield g.say('lincoln', 'Талисман гастрокинеза. Голове без желудка он ни к чему. Я вижу в этом иронию и молчу.');
      } },
      { id: 'sad', icon: 'heart', text: 'Вы вздыхаете.', when: g => !g.f.gastroGot, run: function* (g) {
        g.anim('lincoln', 'sad', 2);
        yield g.say('lincoln', 'Я обидел даму, сэр. На ступенях Белого дома, при свидетелях.');
        yield g.say('lincoln', 'Она сказала: «Авраам». Я сказал: «Сударыня, я вижу вас впервые». Так было написано на карточке.');
        yield g.say('sam', 'Сибил Пандемик. То свидание назначал вам я.');
        yield g.say('lincoln', 'Она теперь королева. Будь у меня руки набрать номер и верные слова, я отдал бы за них талисман.');
        g.f.knowLove = true;
        yield g.say('sam', 'Руки у меня есть. Со словами хуже, но дебаты я уже вёл.');
      } },
      { id: 'tal', icon: 'gastro6', text: 'Отдайте нам талисман.', when: g => !g.f.gastroGot, run: function* (g) {
        yield g.say('lincoln', 'Он подарен мне, сэр. Подарки не передают без причины. Дайте мне причину.');
      } },
      { id: 'how', icon: 'hockey6', text: 'Как настроение, господин Линкольн?', when: g => g.f.gastroGot, run: function* (g) {
        yield g.say('lincoln', 'В четверг матч, сэр. Я стою в воротах. Больше я ничего не умею, и её это устраивает.');
      } },
      { id: 'beam', icon: 'beam6', text: 'Ваш Блисс загипнотизировал Землю.', when: g => !!g.f.beam, run: function* (g) {
        yield g.say('lincoln', 'Народ, которому хорошо по приказу, уже не народ, сэр. Это я сказал сам, без карточки.');
        if (g.f.gastroGot) yield g.say('lincoln', 'И в четверг некому будет играть. Верните мне королеву, сэр.');
      } },
      { id: 'bye', icon: 'bye', text: 'Держитесь, господин Линкольн.', end: true, run: function* (g) { yield g.say('lincoln', 'Мне не за что, сэр. Но я постараюсь.'); } }
    ]
  };

  TALK.cops = {
    start: function* (g) {
      if (g.f.copsMet) return;
      g.f.copsMet = true;
      yield g.say('curt', 'Клуб переехал на Луну точка. Здесь нас никто не выключает запятая и розетка бесплатная точка.');
      yield g.say('bob', 'Вы позвонили в К.О.П.С. Чтобы просветлиться, нажмите один. Чтобы сыграть, нажмите два.');
    },
    options: [
      { id: 'why', icon: 'f:cops6', text: 'Что вы делаете у Хью?', run: function* (g) {
        yield g.say('curt', 'Господин Блисс выделил нам розетку и талисман точка. За это мы развлекаем просветлённых точка.');
        yield g.say('bluster', 'ИГРОЙ! ВЕЛИКОЙ ИГРОЙ! «КРЕСТИКИ-НОЛИКИ СУДНОГО ДНЯ»!');
      } },
      { id: 'game', icon: 'doom6', text: 'Что за игра?', run: function* (g) {
        yield g.say('bluster', 'ТРИ НА ТРИ! ЧЕЛОВЕК ПРОТИВ МАШИНЫ! МАШИНА ЭТО Я!');
        yield g.say('curt', 'Машина пока не выиграла ни одной партии точка. Ноль побед из четырёхсот точка. Программу писал Чиппи точка.');
        yield g.say('chippy', 'Пип.');
        yield g.say('curt', 'Он говорит запятая что перепутал «выиграть» и «не выиграть» точка. Исправить нечем двоеточие паяльник остался на Земле точка.');
      } },
      { id: 'tal', icon: 'lead6', text: 'У вас есть талисман?', when: g => !g.f.leadGot, run: function* (g) {
        yield g.say('curt', 'Талисман свинцового зрения точка. Видит сквозь свинец точка. У нас внутри свинцовый припой запятая и мы стесняемся точка.');
        yield g.say('bob', 'Талисман получит первый, кто проиграет машине. Ничьи не принимаются. Оставайтесь на линии.');
        g.f.knowDoom = true;
      } },
      { id: 'play', icon: 'wheel6', text: 'Сыграем.', say: false, end: true, run: function* (g) {
        g.endDialog();
        yield g.say('sam', 'Сыграем.');
        yield g.say('bluster', 'ВЫЗОВ ПРИНЯТ! ГОТОВЬСЯ ПРОИГРАТЬ! ТО ЕСТЬ ВЫИГРАТЬ! ТО ЕСТЬ... ИГРАЙ!');
        yield* E.startDoom(g);
      } },
      { id: 'bye', icon: 'bye', text: 'Не перегревайтесь.', end: true, run: function* (g) { yield g.say('chippy', 'Пип-пип.'); } }
    ]
  };

  E.doomWon = function* (g) {
    if (g.f.leadGot) { yield g.say('bluster', 'ДВЕ ПОБЕДЫ! Я ТРЕБУЮ ПАМЯТНИК! ИЗ СВИНЦА!'); return; }
    g.f.leadGot = true;
    g.f.copsMet = true;
    yield g.say('bob', 'Поздравляем. Вы проиграли. Ваш приз: талисман свинцового зрения. Чтобы забрать приз, протяните руку.');
    g.give('lead');
    yield g.say('sam', 'Талисман свинцового зрения. Видит сквозь свинец и больше ни сквозь что. Самая узкая специальность после моей.');
    yield g.say('max', 'Сэм, ты проиграл игровому автомату! Я никому не скажу. Я всем напишу!');
  };

  TALK.philo = {
    start: function* (g) {
      if (g.seen.philoHello) return;
      g.seen.philoHello = 1;
      yield g.say('philo', 'Юноша! Вы застали мастера за репетицией. Номер «Зверь из шляпы», вечером, для просветлённых.');
    },
    options: [
      { id: 'you', icon: 'f:philo6', text: 'Фило, вы теперь фокусник?', run: function* (g) {
        yield g.say('philo', 'Актёр играет всё, мальчик мой. В Пузыре нужен был иллюзионист. Господин Блисс и сам начинал с фокусов.');
        yield g.say('philo', 'Он показывал мне талисман, которым меняются местами со зрителем. Свой, личный. В руки не дал.');
      } },
      { id: 'trick', icon: 'hat6', text: 'Что за номер?', run: function* (g) {
        yield g.say('philo', 'Классика! Пустая шляпа, взмах, и из неё является живое существо. Желательно с хвостом.');
        yield g.say('philo', 'Кролик мне отказал. Профсоюз. Вашего друга я не прошу: у него зубы не по роли.');
        if (!E.husk(g)) yield g.say('max', 'Я играю только главные роли! И только себя!');
      } },
      { id: 'sky', icon: 'q', text: 'А если зверь свалится в шляпу с неба?', when: g => !g.f.jimmyFlown, run: function* (g) {
        yield g.say('philo', 'Тогда это будет лучший фокус в моей карьере, юноша. Шляпу я держу открытой. На всякий случай.');
      } },
      { id: 'hat', icon: 'hatrat6', text: 'Что у вас в шляпе?', when: g => g.f.jimmyFlown && !g.f.hatGot, run: function* (g) {
        g.anim('philo', 'shock', 1.4);
        yield g.say('philo', 'Грызун, мальчик мой! Упал с неба прямо в цилиндр и с тех пор бранится.');
        yield g.say('jimmy', 'Я подам в суд на шляпу! И на небо!', { x: 462, y: 112 });
        yield g.say('philo', 'С таким ассистентом я к публике не выйду. Заберите его. Вместе со шляпой: он в ней застрял.');
        g.f.hatGot = true;
        g.give('hat');
        yield g.say('sam', 'Шляпа фокусника с Джимми внутри. Впервые ношу с собой свидетеля, который сам себя стережёт.');
      } },
      { id: 'beam', icon: 'beam6', text: 'Вы видели, что сделал Хью?', when: g => !!g.f.beam, run: function* (g) {
        yield g.say('philo', 'Величайший номер, юноша! Весь зал под гипнозом, а зал размером с планету. Как коллега я восхищён. Как курица обеспокоен.');
      } },
      { id: 'bye', icon: 'bye', text: 'Ни пуха, Фило.', end: true, run: function* (g) { g.anim('philo', 'bow', 1.2); yield g.say('philo', 'К перьям это пожелание не относится, юноша.'); } }
    ]
  };

  const ROACH = [
    'Сэр! Сержант Жучок, в бессрочном увольнении, сэр! Дышу по уставу: вдох, выдох, доклад!',
    'Господин Блисс сказал, что во мне сидит радуга, сэр! Разрешите не вынимать, сэр!',
    'Жёлтый уровень, сэр! Турист, сэр! Зато с подушкой, сэр!'
  ];

  const cop = (name, look) => ({
    name, look, walk: [232, 186], face: 'n',
    talk: function* (g) { yield g.talkTo('cops'); },
    use: 'Трогать их незачем. Они старые, а на Луне нет мастерской.',
    items: {
      uni: function* (g) {
        yield g.say('curt', g.f.uniRed ? 'Единорог точка. Рог красный точка. Завидуем запятая у нас красной бывает только лампочка ошибки точка.' : 'Единорог точка. Рог жёлтый точка. У нас в клубе жёлтый только корпус Курта запятая от времени точка.');
        yield* E.uniShown(g, 'cops');
      },
      gun: function* (g) { yield g.say('bluster', 'ОРУЖИЕ! Я ТОЖЕ ВООРУЖЁН! У МЕНЯ ДЖОЙСТИК!'); },
      glove: 'Бить компьютер перчаткой? Их чинят иначе. Хотя Бластеру, похоже, помогало.',
      lead: function* (g) { yield g.say('curt', 'Не смотрите на нас сквозь него точка. Там припой точка. Это личное точка.'); },
      saw: function* (g) { yield g.say('bob', 'Пила обнаружена. Для отказа от распила нажмите все кнопки сразу.'); },
      max: function* (g) {
        if (E.husk(g)) { yield g.say('max', 'Здравствуйте, машины. Вы гудите. Это красиво.'); return; }
        yield g.say('max', 'Железяки! Я президент! Назначаю вас министерством игр!');
        yield g.say('bluster', 'ПРИНИМАЮ ПОСТ! ТРЕБУЮ БЮДЖЕТ И НОВЫЕ КНОПКИ!');
      }
    }
  });

  ROOMS.blister = {
    id: 'blister', name: 'Пузырь Покоя', w: 640, music: 'blister6',
    scale: [156, 0.9, 196, 1.04],
    paint: b => S.BG.blister6(b),
    walk: [[8, 156, 632, 156, 632, 196, 8, 196]],
    layers: [
      { id: 'earth', x: 396, y: 2, key: g => (E.blissed(g) ? 'b' + Math.floor(g.time * 4) % 8 : g.f.boiled ? 'm' : '') },
      { id: 'spork', x: 550, y: 8, key: g => (g.f.sporkBent ? 'b' : '') },
      { id: 'hat', x: 452, y: 119, when: g => g.f.jimmyFlown && !g.f.hatGot }
    ],
    sprites(g) {
      if (!carBuf) carBuf = LAYERS.blister.car();
      const x = g.vt.carX === undefined ? CAR_X : g.vt.carX;
      return [{ y: 151, draw: (f, cx) => S.blit(f, carBuf, Math.round(x) - cx, 130) }];
    },
    hot: [
      { id: 'exit', name: 'Шлюз', rect: [6, 50, 40, 104], walk: [44, 172], face: 'w',
        look: 'Шлюз наружу. За стеклом звёзды и спина Суперболла.',
        exit: function* (g) { g.sfx('gate'); yield* g.goRoom('moon', { x: 590, y: 154, dir: 's' }); } },
      { id: 'earth', name: 'Земля за куполом', rect: [410, 16, 46, 46],
        look: g => E.blissed(g) ? 'Земля в радужном кольце. Отсюда, из-под купола, на неё смотрят и улыбаются.' : 'Земля за стеклом купола. Прихожане Хью глядят на неё сверху вниз. Буквально.' },
      { id: 'payphone', name: 'Телефон-автомат', rect: [130, 78, 22, 44], walk: [146, 168], face: 'n',
        look: 'Телефон-автомат. Межпланетный тариф: доллар за минуту. С Канадой дороже.',
        use: function* (g) {
          if (g.f.gastroGot) { yield g.say('sam', 'Линия занята. Голова и королева обсуждают четверг.'); return; }
          if (!g.f.knowLove) { yield g.say('sam', 'Звонить с Луны мне некому. Тариф не по карману вольной полиции.'); return; }
          yield* callSybil(g);
        },
        items: { cad: 'Сто триллионов в щель для монет не лезут.', gun: 'Стрелять в единственный телефон на Луне? Нет.' } },
      { id: 'banner', name: 'Растяжка', rect: [174, 34, 108, 25],
        look: '«Крестики-нолики Судного дня». Судный день наступает для проигравшего. Пока это всегда машина.' },
      { id: 'lift', name: 'Радужный лифт', rect: [338, 40, 44, 116], walk: [360, 160], face: 'n',
        look: 'Радужный лифт. Прозрачная труба уходит сквозь купол вверх. На кнопке одна надпись: «К Хью».',
        exit: function* (g) { g.sfx('whoosh'); yield* g.goRoom('vest', { x: 66, y: 172, dir: 'e' }); } },
      { id: 'hattable', name: g => (g.f.jimmyFlown && !g.f.hatGot ? 'Шляпа фокусника' : 'Столик фокусника'), rect: [448, 120, 32, 32], walk: [462, 164], face: 'n',
        look: g => g.f.jimmyFlown && !g.f.hatGot ? 'Цилиндр на столике. Из него торчат уши Джимми и доносится брань.' : g.f.hatGot ? 'Столик под красной скатертью. Шляпы нет, Фило репетирует с пустыми крыльями.' : 'Столик под красной скатертью. На нём место для шляпы. Шляпу Фило держит открытой к небу.',
        use: g => g.f.jimmyFlown && !g.f.hatGot ? 'Фило следит за реквизитом одним глазом. Вторым он следит за мной.' : 'На столике пусто.',
        talk: function* (g) {
          if (!(g.f.jimmyFlown && !g.f.hatGot)) { yield g.say('sam', 'Столик молчит.'); return; }
          yield g.say('jimmy', 'Начальник! Вытащи меня! Нет, стой. Сначала найди адвоката!', { x: 462, y: 112 });
        } },
      { id: 'button', name: 'Кнопка пуска', rect: [524, 118, 14, 14], walk: [512, 176], face: 'e', noWalkItem: true,
        look: 'Кнопка пуска. Красная, на столбике. Отправляет вагонетку по рельсам.',
        use: function* (g) {
          if (g.actors.maxred.room === 'blister') { yield* shotAt(g); return; }
          yield g.walkTo('sam', 540, 172);
          g.sfx('click');
          g.sfx('whoosh');
          yield* tween(g, 0.9, k => { g.vt.carX = CAR_X - k * 62; });
          yield* tween(g, 0.9, k => { g.vt.carX = 530 + k * 62; });
          g.vt.carX = CAR_X;
          yield g.say('sam', 'Вагонетка съездила до упора и вернулась. Весело. Одному.');
        },
        items: { gun: function* (g) { yield* shootButton(g); } } },
      { id: 'statue', name: 'Статуя Хью', rect: [544, 44, 28, 106], walk: [512, 176], face: 'e',
        look: 'Хью Блисс в позолоте. В поднятых руках держит ложковилку длиной с багор. На постаменте одно слово: «Хью».',
        use: 'Позолота не стирается. Я потёр.',
        items: { spoon: function* (g) { yield* bendSpork(g); }, gun: 'Стрелять в золотого Хью приятно, но бесполезно. Настоящий наверху.' } },
      Object.assign({ id: 'spork', poly: [556, 44, 616, 12, 622, 22, 562, 52], when: g => !g.f.sporkBent }, {
        name: 'Ложковилка', walk: [512, 176], face: 'e',
        look: 'Ложковилка. Наполовину ложка, наполовину вилка. Статуя держит её над рельсами, как знамя.',
        use: 'Не дотянусь. До неё три метра и один золотой Хью.',
        items: { spoon: function* (g) { yield* bendSpork(g); }, gun: 'Пуля звякнет и отскочит. Ложковилку отлили на совесть, в отличие от Хью.' } }),
      { id: 'spork2', name: 'Согнутая ложковилка', rect: [572, 28, 22, 96], when: g => g.f.sporkBent, walk: [512, 176], face: 'e',
        look: 'Ложковилка висит над рельсами на высоте головы. Кто поедет в вагонетке, встретится с ней лбом.',
        use: 'Не дотянусь. И разгибать её я не собираюсь.',
        items: { spoon: function* (g) { yield* bendSpork(g); } } },
      { id: 'sign', name: 'Вывеска', rect: [602, 58, 38, 13],
        look: '«Горки». Аттракцион для просветлённых. Говорят, на спуске выдыхают даже красные.' },
      { id: 'car', name: 'Вагонетка', rect: [594, 130, 32, 18], walk: [512, 176], face: 'e',
        look: 'Вагонетка. Семь цветов и ремень, которым никто не пристёгивается.',
        use: function* (g) {
          if (g.actors.maxred.room === 'blister') { yield* shotAt(g); return; }
          yield g.say('sam', 'Кататься некогда.');
        } }
    ],
    actors: {
      lincoln: {
        name: 'Голова Линкольна', walk: [140, 172], face: 'w',
        look: g => g.f.gastroGot ? 'Голова Линкольна. Улыбается и косится на телефон. Талисман он отдал.' : 'Голова Авраама Линкольна. Шесть метров мрамора мы разнесли ракетой на шоссе 95. Голова уцелела, стоит на тележке и вздыхает. На шее талисман.',
        talk: function* (g) { yield g.talkTo('abe'); },
        use: 'Катить голову президента по Пузырю я не стану. У неё и так мало достоинства на квадратный метр.',
        items: {
          uni: function* (g) { yield g.say('lincoln', 'Единорог. В моё время таких не было. Был мул. Мул был честнее.'); yield* E.uniShown(g, 'lincoln'); },
          gun: 'Стрелять в голову Линкольна? Мы его уже взрывали. Хватит с него.',
          glove: 'Бить мрамор перчаткой? Перчатка сломается первой.',
          gastro: 'Наводить на него его же подарок невежливо. И желудка у головы нет.',
          cad: function* (g) { yield g.say('lincoln', 'На этой купюре моя дама, сэр. Уберите. Мне и так неспокойно.'); },
          deed: function* (g) { yield g.say('lincoln', 'Купчая на Союз? Сэр, за него я стоял шесть метров в высоту. Уберите.'); },
          max: function* (g) {
            if (E.husk(g)) { yield g.say('max', 'Здравствуй, Эйб. Прости за ракету. Мне теперь за всё хочется просить прощения.'); yield g.say('lincoln', 'Это не тот кролик, сэр. Того я уважал.'); return; }
            yield g.say('max', 'Эйб! Без обид за ракету? Это была предвыборная борьба!');
            yield g.say('lincoln', 'Я не в обиде, сэр. Народ сделал выбор. Ракету тоже выбрал народ.');
          }
        }
      },
      curt: cop('Курт 286', 'Курт 286. Переносной компьютер размером с чемодан, на крышке радужная наклейка. Знаки препинания он произносит вслух.'),
      bob: cop('Боб Белл', 'Боб Белл. Телефон-автомат на ножках. Отвечает на всё голосом справочной.'),
      bluster: cop('Бластер-Бахвал', 'Бластер-Бахвал. Игровой автомат с красными глазами. На экране поле три на три и счёт: «Побед: ноль».'),
      chippy: cop('Чиппи', 'Чиппи. Приставка с одной игрой. Умеет пищать, паять и путать «выиграть» с «не выиграть».'),
      philo: {
        name: 'Фило Пенниуорт', walk: [404, 168], face: 'e',
        look: 'Фило Пенниуорт, в миру мистер Фезерли. Актёр куриного происхождения. Репетирует номер со шляпой.',
        talk: function* (g) { yield g.talkTo('philo'); },
        use: 'Хватать артиста за крыло перед выходом нельзя. Примета.',
        items: {
          uni: function* (g) { yield g.say('philo', 'Единорог! Недурной реквизит, мальчик мой. Рог, правда, переигрывает.'); yield* E.uniShown(g, 'philo'); },
          hat: function* (g) { yield g.say('philo', 'Нет-нет, юноша, он ваш. Я уже приглядел себе голубя.'); },
          gun: function* (g) { g.anim('philo', 'shock', 1.2); yield g.say('philo', 'Юноша! В театре стреляют только в третьем акте!'); },
          mtal: function* (g) { yield g.say('philo', 'Талисман маэстро! Где вы его... Впрочем, хороший фокусник не спрашивает.'); },
          max: function* (g) {
            if (E.husk(g)) { yield g.say('max', 'Здравствуй, курица. Я тебя больше не хочу съесть. Странное чувство.'); return; }
            yield g.say('max', 'Курица! Покажи фокус с исчезновением себя в моём животе!');
            yield g.say('philo', 'Этот номер я не репетировал, мальчик мой. И не стану.');
          }
        }
      },
      roach: {
        name: 'Сержант Жучок', walk: [520, 182], face: 'w', pad: 8,
        look: 'Сержант Жучок на фиолетовой подушке. Через панцирь повязана радужная ленточка. Впервые в жизни он никого не подслушивает.',
        talk: function* (g) {
          if (g.f.beam) { yield g.say('roach', 'Сэр! С Земли на всех частотах идёт «Здравствуйте, я Хью Блисс», сэр! Подслушивать стало нечего!'); return; }
          const n = g.count('roachTalk') - 1;
          g.anim('roach', 'salute', 1.2);
          yield g.say('roach', ROACH[n % ROACH.length]);
        },
        use: 'Пусть сидит. Увольнение он заслужил ещё в казино.',
        items: {
          uni: function* (g) { yield g.say('roach', 'Единорог опознан, сэр! Рог есть, угрозы нет, сэр!'); },
          max: function* (g) { yield g.say('max', E.husk(g) ? 'Здравствуй, жучок. Дыши.' : 'Сержант! Вольно! Нет, смирно! Нет, дыши дальше, у тебя смешно выходит!'); }
        }
      },
      maxred: {
        name: 'Красный Макс', walk: [512, 176], face: 'e', pad: 8,
        look: 'Рука Макса с ушами. Красная, злая и вооружённая. Палит во всё, что шевелится, и в то, что стоит.',
        talk: function* (g) {
          const red = g.actors.maxred;
          red.act = 'shoot'; red.actT = 0.8;
          g.sfx('gun');
          yield g.say('maxred', 'ПИФ! ПАФ! Ты убит! И ты! Все убиты!');
          yield g.say('sam', 'Вся злость Макса без самого Макса. Раньше её хоть кто-то придерживал.');
        },
        use: function* (g) { yield* shotAt(g); },
        items: {
          gun: 'Перестрелка с рукой Макса? Она стреляет быстрее. Она и есть та самая рука.',
          glove: 'До него не дойти. Он держит на мушке весь проход.',
          hat: 'Накрыть его шляпой? До него сначала надо добраться.',
          max: function* (g) { yield g.say('max', 'Он сердится за нас обоих, Сэм. Пусть сердится. Мне нечем.'); }
        }
      }
    },
    enter: function* (g) {
      if (!g.seen.blister) {
        g.seen.blister = 1;
        yield g.say('sam', 'Пузырь Покоя. Горки, золотой Хью и радужный лифт. Половина нашей картотеки сидит тут и дышит.');
        yield g.say('max', 'Сэм, тут К.О.П.С., курица и Линкольн! Это вечеринка, и нас не позвали!');
        return;
      }
      if (g.actors.maxred.room === 'blister' && !g.seen.redSeen) {
        g.seen.redSeen = 1;
        yield g.say('sam', 'На горках кто-то красный палит по куполу. Уши у него знакомые.');
        yield g.say('max', 'Это я, Сэм. Та часть, которая всегда хотела выстрелить первой.');
      }
    },
    setup(g) {
      const red = g.actors.maxred;
      g.actors.lincoln.v = g.f.gastroGot ? '' : 'tal';
      if (g.f.maxSplit && !g.f.redDone) { if (!g.vt.red) g.vt.red = { seat: 'car', t: 0 }; placeRed(g); }
      else if (red.room === 'blister') g.place('maxred', 'nowhere', 0, 0);
      red.upside = false;
      g.vt.carX = CAR_X;
      g.vt.call = null;
    },
    update(g, dt) {
      const red = g.actors.maxred;
      if (red.room !== 'blister' || g.f.redDone || g.busy || g.dialog || g.mode !== 'room') return;
      const st = g.vt.red || (g.vt.red = { seat: 'car', t: 0 });
      st.t += dt;
      if (st.t < (st.seat === 'car' ? 8 : 4)) return;
      st.seat = st.seat === 'car' ? 'sign' : 'car';
      st.t = 0;
      placeRed(g);
      g.sfx('boing');
    }
  };

  function* bendSconce(g) {
    yield g.say('sam', 'Кронштейн считает себя ложкой. Талисман с ним согласен, даже сквозь свинец.');
    g.sfx('hypno');
    g.vt.sconceT = g.time;
    yield 0.9;
    g.sfx('thud');
    yield 0.3;
    g.sfx('click');
    g.f.doorOpen = true;
    g.vt.sconceT = 0;
    g.sfx('gate');
    g.fx.shake = 0.4;
    yield g.say('sam', 'Кронштейн согнулся, шар упал на кнопку. Дверь поехала в стену.');
    yield g.say('max', 'Хью! Мы идём! Приготовь то, чем ты собирался меня выворачивать!');
  }

  function* xray(g) {
    if (g.f.doorOpen) { yield g.say('sam', 'Дверь открыта. Смотреть сквозь неё больше незачем.'); return; }
    if (g.f.doorSeen) { yield g.say('sam', 'Я уже всё вижу. Кронштейн, шар, кнопка.'); return; }
    yield g.say('sam', 'Свинец сквозь талисман прозрачный, как витрина у Гарри.');
    g.sfx('scan');
    g.f.doorSeen = true;
    yield g.say('sam', 'За дверью кронштейн в форме ложки. В нём лежит шар для боулинга. Под шаром кнопка «Открыть». Хью запер себя на шар.');
    yield g.say('max', g.f.spoonGot ? 'Он запер дверь шаром для боулинга! Сэм, у злодеев кончились замки!' : 'Он запер дверь шаром для боулинга! Сэм, у злодеев кончились замки и ложки!');
  }

  ROOMS.vest = {
    id: 'vest', name: 'Преддверие', w: 320, music: 'sanctum6',
    paint: b => S.BG.vest6(b),
    walk: [[8, 154, 312, 154, 312, 198, 8, 198]],
    layers: [
      { id: 'xray', x: 158, y: 38, when: g => g.f.doorSeen && !g.f.doorOpen, key: g => Math.floor(g.time * 5) % 3 + (g.vt.sconceT ? 'f' + Math.floor(g.time * 20) : '') },
      { id: 'open', x: 150, y: 30, when: g => g.f.doorOpen }
    ],
    hot: [
      { id: 'lift', name: 'Радужный лифт', rect: [14, 40, 44, 116], walk: [60, 172], face: 'w',
        look: 'Лифт вниз, в Пузырь. Вверх отсюда уже некуда.',
        exit: function* (g) { g.sfx('whoosh'); yield* g.goRoom('blister', { x: 360, y: 170, dir: 's' }); } },
      { id: 'plaque', name: 'Табличка', rect: [171, 7, 58, 13],
        look: '«Хью Блисс». Ниже мелко: «Приёма нет. Хью уже внутри вас».' },
      { id: 'door', name: 'Свинцовая дверь', rect: [150, 30, 100, 122], walk: [200, 160], face: 'n',
        look: g => g.f.doorOpen ? 'Дверь открыта. Изнутри тянет озоном и самодовольством.' : g.f.doorSeen ? 'Сквозь свинец видно устройство замка. Шар для боулинга лежит на кронштейне, прямо над кнопкой «Открыть».' : 'Дверь в святилище. Свинец толщиной в ладонь. Ни ручки, ни скважины. Посередине выбито «Pb».',
        exit: function* (g) {
          if (!g.f.doorOpen) { yield g.say('sam', g.f.doorSeen ? 'Не двигается. Кнопка с той стороны, шар над кнопкой, а я с этой.' : 'Свинец не двигается. Ни ручки, ни скважины, одна химическая формула.'); return; }
          yield* g.goRoom('sanctum', { x: 78, y: 172, dir: 'e' }, { from: 'vest' });
        },
        items: {
          lead: function* (g) { yield* xray(g); },
          spoon: function* (g) {
            if (g.f.doorOpen) { yield g.say('sam', 'Дверь уже открыта.'); return; }
            if (!g.f.doorSeen) { yield g.say('sam', 'Гнуть дверь? На ложку она не похожа. Талисман обиженно молчит.'); return; }
            yield* bendSconce(g);
          },
          gun: 'Свинец ловит пули. Он из них сделан.',
          glove: 'Перчатка стучит глухо. Хью не открывает.',
          key: 'Скважины нет. Ключ от модуля тут ни при чём.',
          saw: 'Пилить свинец в ладонь толщиной? К утру я пропилю царапину.',
          hanger: 'Скважины нет. Ковырять нечего.',
          max: function* (g) { yield g.say('max', E.husk(g) ? 'Дверь. За ней тот, кто сделал мне хорошо.' : 'Открывай, Хью! Именем президента! Я знаю, что ты дома, у тебя радуга горит!'); }
        } },
      { id: 'sconce', name: 'Кронштейн за дверью', rect: [162, 44, 50, 28], when: g => g.f.doorSeen && !g.f.doorOpen, walk: [200, 160], face: 'n',
        look: 'Кронштейн за дверью. Ручка и чашка, вылитая ложка. В чашке лежит шар для боулинга.',
        use: 'Рукой сквозь свинец не достать. Вижу, но не трогаю.',
        items: { spoon: function* (g) { yield* bendSconce(g); }, lead: function* (g) { yield* xray(g); }, gun: 'Пуля сквозь свинец не пройдёт. Она сама из него.' } },
      { id: 'crystals', name: 'Кристаллы', rect: [264, 56, 54, 94],
        look: 'Кристаллы. Растут прямо из пола. В каждом отражаюсь я, и в каждом чуть счастливее, чем есть.' },
      { id: 'lamps', name: 'Светильник', rect: [128, 56, 12, 32],
        look: 'Светильник из кристалла. Горит ровно. Кронштейн у него самый обычный, не ложкой.' }
    ],
    enter: function* (g) {
      if (g.f.vestSeen) return;
      g.f.vestSeen = true;
      yield g.say('sam', 'Лифт привёз под самый купол. Дальше одна дверь. Свинцовая.');
      yield g.say('max', E.husk(g) ? 'За ней Хью. Он добрый. Он забрал лишнее.' : 'Свинец! Сэм, он боится, что за ним подглядывают!');
    },
    setup(g) { g.vt.sconceT = 0; }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
