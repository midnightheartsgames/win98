(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP103;
  const { ROOMS, TALK, LAYERS } = E;
  const { sprite, textOn } = S.BG;
  const A = S.art103;
  const MUG = { x: 184, y: 118 };

  LAYERS.sybil = {
    lamp: () => S.LAYERS.sybil.lamp(),
    board: () => sprite(100, 38, (P, b) => {
      P.part(P.rect(0, 0, 100, 38), C.oak, { b: 3 });
      P.part(P.rect(3, 3, 94, 32), C.sand, { b: 3, sh: 0, hi: 0 });
      P.part(P.rect(6, 5, 42, 10), C.cream, { b: 4, sh: 0 });
      textOn(b, 'СУД: ПТ', 9, 6, C.red[2], 0);
      for (let i = 0; i < 3; i++) {
        const x = 54 + i * 14;
        P.part(P.rect(x, 6, 12, 14), C.grey, { b: 5, sh: 0 });
        A.bearMask(new S.Pen(b).at(x + 6, 14, 0.22), 0, 0, Object.assign({}, [A.MOB.lovey, A.MOB.cuddly, A.MOB.guard][i], { hat: null }), {});
        P.px(x + 6, 7, C.red[3]);
      }
      P.part(P.rect(6, 20, 40, 12), C.cream, { b: 4, sh: 0 });
      for (let i = 0; i < 3; i++) P.line(9, 23 + i * 3, 42, 23 + i * 3, C.cream[1]);
      P.line(47, 26, 96, 26, C.red[3]);
      textOn(b, 'ВИДЕЛА!', 52, 25, C.red[2], 0);
    }),
    stand: () => sprite(54, 50, (P, b) => {
      P.part(P.poly([2, 20, 52, 20, 50, 50, 4, 50]), C.wood, { b: 2 });
      for (let i = 0; i < 3; i++) P.part(P.rect(7 + i * 15, 25, 12, 20), C.wood, { b: 2, sh: 1, hi: 1 });
      P.part(P.rect(0, 16, 54, 5), C.wood, { b: 4, sh: 0 });
      for (let x = 4; x < 52; x += 6) P.part(P.rect(x, 4, 2, 12), C.wood, { b: 3, sh: 0 });
      P.part(P.rect(0, 2, 54, 3), C.wood, { b: 4, sh: 0 });
      P.part(P.rect(8, 8, 12, 8), C.night, { b: 1 });
      P.part(P.rect(9, 9, 10, 1.5), C.gold, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.cap(40, 16, 42, 6, 1), C.grey, { b: 1, sh: 0 });
      P.part(P.ell(42, 5, 2, 2.4), C.grey, { b: 2, sh: 0 });
    }),
    desk: () => sprite(64, 48, P => {
      P.part(P.poly([2, 12, 62, 10, 64, 18, 0, 20]), C.wood, { b: 3 });
      P.part(P.poly([0, 20, 64, 18, 64, 48, 0, 48]), C.wood, { b: 2 });
      P.part(P.rect(6, 24, 22, 20), C.wood, { b: 2, sh: 1, hi: 1 });
      P.part(P.rect(36, 24, 22, 20), C.wood, { b: 2, sh: 1, hi: 1 });
      P.part(P.rect(40, 0, 16, 12), C.grey, { b: 1 });
      P.part(P.rect(42, 2, 12, 5), C.night, { b: 1, sh: 0, hi: 0 });
      P.part(P.ell(48, 11, 3, 1.4), C.oak, { b: 1, sh: 0 });
      P.part(P.rect(6, 6, 12, 6), C.cream, { b: 4, sh: 0 });
    }),
    mug: g => sprite(12, 12, P => {
      const k = g && g.f.mugBack;
      P.part(P.rect(1, 3, 8, 8), C.grey, { b: 5 });
      P.part(P.path('M 8 5 Q 12 5 11 8 Q 10 10 8 9.4'), C.grey, { b: 4, sh: 0 });
      P.part(P.ell(5, 3.4, 3.8, 1.1), k ? C.red : C.oak, { b: k ? 2 : 1, sh: 0, hi: 0 });
      P.part(P.rect(2, 6, 6, 2), C.gold, { b: 3, sh: 0, hi: 0, ol: 0 });
    }),
    shards: () => sprite(40, 10, P => {
      P.part(P.ell(20, 6, 18, 3.4), C.red, { b: 2, sh: 0, hi: 0 });
      for (const [x, y] of [[8, 4], [14, 7], [26, 5], [31, 7]]) P.part(P.poly([x, y, x + 3, y - 2, x + 4, y + 1]), C.grey, { b: 5, sh: 0, hi: 0 });
    }),
    cactus: g => sprite(24, 56, P => {
      P.part(P.poly([4, 56, 20, 56, 18, 42, 6, 42]), C.brick, { b: 3 });
      P.part(P.rect(3, 40, 18, 4), C.brick, { b: 4, sh: 0 });
      P.part(P.cap(12, 40, 12, 14, 5), C.green, { b: 3 });
      P.part(P.cap(12, 30, 5, 24, 2.4), C.green, { b: 3 });
      P.part(P.cap(5, 24, 5, 18, 2.4), C.green, { b: 3 });
      P.part(P.cap(12, 26, 19, 22, 2.2), C.green, { b: 2 });
      for (let i = 0; i < 6; i++) P.px(10 + (i % 2) * 4, 18 + i * 4, C.cream[4]);
      if (!(g && g.f.webcamEaten)) {
        P.part(P.rect(6, 2, 12, 9), C.grey, { b: 2 });
        P.part(P.ell(12, 6.5, 3, 3), C.grey, { b: 0, sh: 0 });
        P.part(P.ell(12, 6.5, 1.4, 1.4), C.sky, { b: 4, sh: 0, hi: 0, ol: 0 });
        P.px(16, 4, g && Math.floor(g.time * 2) % 2 ? C.red[4] : C.red[1]);
        P.part(P.rect(10, 11, 4, 4), C.grey, { b: 1, sh: 0 });
      }
    }),
    diploma: () => sprite(34, 22, (P, b) => {
      P.part(P.rect(0, 0, 34, 22), C.gold, { b: 3 });
      P.part(P.rect(2, 2, 30, 18), C.cream, { b: 4, sh: 0, hi: 0 });
      textOn(b, 'ОЧЕВ.', 4, 3, C.red[2], 0);
      P.line(5, 13, 29, 13, C.cream[1]);
      P.part(P.ell(26, 16, 2.4, 2.4), C.red, { b: 3, sh: 0, hi: 0 });
    })
  };

  function* ambient(g) {
    const sy = g.actors.sybil;
    for (;;) {
      yield 3.5;
      if (g.f.sybilFaked || g.f.sybilDone) continue;
      if (g.f.mugBack) {
        g.vt.kWait = (g.vt.kWait || 0) + 3.5;
        if (g.vt.kWait < 24 || g.busy) continue;
        g.vt.kWait = 0;
        g.f.mugOnDesk = false;
        sy.act = 'drink'; sy.keepAct = true;
        g.sfx('slurp');
        yield g.say('sybil', 'Кофе сегодня густой... Это КЕТЧУП! Сэм, это твои шутки?');
        g.f.mugBack = false; g.f.mugFilled = false;
        sy.act = ''; sy.keepAct = false;
        g.f.mugOnDesk = true;
        yield g.say('sybil', 'Вот, пустая. Теперь у меня и кофе нет, и аппетита.');
        continue;
      }
      if (g.f.mugTaken || g.busy) continue;
      if (g.f.mugOnDesk) {
        g.f.mugOnDesk = false;
        sy.act = 'drink'; sy.keepAct = true;
        g.sfx('slurp');
        yield 1.4;
        sy.act = 'hold';
        yield 2.2;
        sy.act = ''; sy.keepAct = false;
        g.f.mugOnDesk = true;
      }
    }
  }

  function* takeMug(g) {
    if (g.f.sybilDone || g.f.sybilFaked) { yield g.say('sam', 'От кружки остались осколки. И лужа, которая всех убедила.'); return; }
    if (g.f.mugBack) { yield g.say('sam', 'Второй раз она мне кружку не простит. Пусть стоит и краснеет.'); return; }
    if (!g.f.mugOnDesk) { yield g.say('sam', 'Вырвать кружку у женщины на двенадцатом кофе? Я видел, как она держит степлер.'); return; }
    yield g.anim('sam', 'reach', 0.5);
    g.f.mugOnDesk = false;
    g.f.mugTaken = true;
    g.give('mug');
    const sy = g.actors.sybil;
    sy.act = 'jitter'; sy.keepAct = true;
    yield g.say('sybil', 'Где моя кружка? Сэм, отдай кружку! Без кружки у меня дрожат руки. С кружкой тоже, но не так заметно.');
    yield g.say('sam', 'Я её помою, Сибил. Изнутри.');
  }

  function* putBack(g) {
    if (g.f.mugBack) return;
    yield g.anim('sam', 'reach', 0.5);
    g.drop('kmug');
    g.f.mugBack = true;
    g.f.mugTaken = false;
    g.vt.kWait = 0;
    const sy = g.actors.sybil;
    sy.act = ''; sy.keepAct = false;
    yield g.say('sybil', 'Моя кружка! Спасибо, Сэм. Сейчас выпью. Вот только договорю про пятницу.');
    yield g.say('max', 'Сэм! Она сейчас выпьет кетчуп! Делай что-нибудь смешное и быстрое!');
  }

  function* shootMug(g) {
    const sy = g.actors.sybil, sam = g.actors.sam;
    if (g.f.sybilFaked) { yield g.say('sam', 'Хватит стрелять. Сибил уже убита. Понарошку, но убедительно.'); return; }
    if (!g.f.mugBack) {
      if (g.f.mugTaken) { yield g.say('sam', 'Кружка у меня в кармане. Стрелять в собственный карман я пока не готов.'); return; }
      if (!g.f.mugOnDesk) { yield g.say('sam', 'Она держит кружку у лица. Стрелять не буду. Я не настолько хороший стрелок. Или настолько, но проверять не стану.'); return; }
      yield g.say('sam', 'Разбить пустую кружку? Шума на доллар, зрелища ни на цент. Такое кино мафия не досмотрит.');
      return;
    }
    g.faceTo('sam', MUG.x);
    yield g.anim('sam', 'shoot', 0.5);
    g.sfx('gun');
    g.fx.flash = 0.3;
    g.sfx('glass');
    g.f.mugBack = false;
    g.f.sybilFaked = true;
    sy.v = 'ketchup';
    sy.act = 'shock'; sy.keepAct = true;
    yield g.say('sybil', 'А-а-а! Я ранена! Я вся в крови! Я вся... в кетчупе?');
    sy.act = 'dead';
    g.place('sybil', 'sybil', 222, 174, 's');
    g.sfx('thud');
    g.fx.shake = 0.4;
    sam.act = '';
    yield g.walkTo('sam', 150, 178);
    g.faceTo('sam', 222);
    yield g.say('sam', 'Лежи, Сибил, и не шевелись. На тебя смотрит мафия.');
    yield g.say('sybil', 'Через кактус?');
    yield g.say('sam', 'Через кактус.');
    yield g.say('max', 'Сибил, ты лучший труп в моей жизни! А я их повидал!');
    sam.act = '';
  }

  function* eatWebcam(g) {
    const max = g.actors.max, sy = g.actors.sybil;
    if (g.f.webcamEaten) { yield g.say('max', 'Я её уже съел! Добавки нет!'); return; }
    if (!g.f.sybilFaked) {
      yield g.say('max', 'Можно я съем камеру? Она мигает, как конфета!');
      yield g.say('sam', 'Потерпи, Макс. Это единственный зритель, который смотрит нас до конца.');
      return;
    }
    max.scripted = true;
    yield g.walkTo('max', 64, 166);
    g.face('max', 'n');
    g.sfx('crunch');
    g.f.webcamEaten = true;
    yield 1.0;
    yield g.say('max', 'Хрустит! На вкус как провод с укропом!');
    max.scripted = false;
    g.f.sybilDone = true;
    sy.act = ''; sy.keepAct = false;
    g.place('sybil', 'sybil', 206, 152, 's');
    yield g.say('sybil', 'Можно вставать? У меня кетчуп в ухе.');
    yield g.say('sam', 'Вставай. Для мафии ты мертва. Для суда в пятницу, надеюсь, живая.');
    yield g.say('sybil', 'Мне придётся давать показания в платье с кетчупом. Хотя это даже убедительно.');
    yield* E.trialDone(g);
  }

  TALK.sybil = {
    start: function* (g) {
      if (!g.seen.sybil103) {
        g.seen.sybil103 = 1;
        yield g.say('sybil', 'Сэм! Макс! Слава богу! Заходите! Дверь закройте! Кофе будете? Я на двенадцатой кружке!');
      }
    },
    options: [
      { id: 'job', icon: 'q', text: 'Кем ты теперь работаешь?', run: function* (g) {
        yield g.say('sybil', 'Профессиональный свидетель! Меня нанимают, и я вижу. Всё, что нужно суду. Работа нервная, зато почасовая.');
        yield g.say('sybil', 'Газета закрылась после первого номера. Тираж скупил один джентльмен с усами. Я потом узнала, что он в берете.');
        g.f.sybilWitness = true;
      } },
      { id: 'trial', icon: 'gavel', text: 'Против кого ты свидетельствуешь?', run: function* (g) {
        yield g.say('sybil', 'Против Игрушечной мафии. Я видела, как они... ну, я видела. Мне заплатили за «всё». Подробности уточняются.');
        yield g.say('sybil', 'Суд в пятницу. До пятницы мне надо просто не умереть. Звучит несложно, но это без учёта мафии.');
        g.f.sybilWitness = true;
      } },
      { id: 'nerves', icon: 'coffee', text: 'Ты какая-то нервная.', run: function* (g) {
        yield g.say('sybil', 'Я? Нервная? Я выпила двенадцать кружек кофе, потому что мне страшно! И мне страшно, потому что я выпила двенадцать кружек!');
        yield g.say('sam', 'Попробуй без кофеина.');
        yield g.say('sybil', 'Без кофеина я усну. А если я усну, меня убьют во сне. Сэм, я профессионал, я всё продумала.');
      } },
      { id: 'fake', icon: 'fire', text: 'Может, тебе инсценировать свою смерть?', when: g => g.f.joined, run: function* (g) {
        yield g.say('sybil', 'Инсценировать? Это нечестно! Суд на такое не рассчитывает!');
        yield g.say('sybil', 'Хотя если бы меня «убили» у всех на глазах, мафия бы успокоилась. Но у кого на такое хватит наглости?');
        yield g.say('max', 'У нас!');
        yield g.say('sybil', 'Что?');
        yield g.say('sam', 'Макс говорит, у нас хватило бы. Чисто теоретически.');
        g.f.sybilWitness = true;
      } },
      { id: 'trust', icon: 'heart', text: 'Как ты держишься, Сибил?', once: true, run: function* (g) {
        yield g.say('sybil', 'Знаешь, Сэм, вы с Максом единственные, кому я сейчас доверяю.');
        yield g.say('max', 'Ой.');
        yield g.say('sam', 'Это... очень трогательно, Сибил. Правда.');
      } },
      { id: 'cactus', icon: 'eye', text: 'Откуда у тебя кактус с камерой?', run: function* (g) {
        yield g.say('sybil', 'Подарок от поклонника! Принесли вчера. Кактусы я не люблю. Зато камера милая. Мигает, когда я пью кофе.');
        yield g.say('sam', 'Она мигает всё время, Сибил.');
        yield g.say('sybil', 'Вот именно.');
      } },
      { id: 'code', icon: 'rug', text: E.CODE, run: function* (g) {
        yield g.say('sybil', 'Сэм, у меня нет штор. У меня жалюзи. Жалюзи подходят к паранойе.');
      } },
      { id: 'bye', icon: 'bye', text: 'Береги себя.', end: true, run: function* (g) {
        yield g.say('sybil', 'Если я не доживу до пятницы, скажите суду, что я видела всё.');
      } }
    ]
  };

  ROOMS.sybil = {
    id: 'sybil', name: 'Контора Сибил', w: 320, music: 'sybil',
    paint: b => S.BG.sybil(b, {}),
    walk: [[6, 126, 316, 126, 316, 198, 6, 198]],
    block: [[164, 150, 228, 150, 228, 160, 164, 160], [66, 148, 118, 148, 118, 156, 66, 156]],
    layers: [
      { id: 'board', x: 60, y: 50 },
      { id: 'diploma', x: 126, y: 90 },
      { id: 'stand', x: 64, y: 104, base: 154 },
      { id: 'desk', x: 164, y: 112, base: 160 },
      { id: 'mug', x: MUG.x - 6, y: MUG.y - 8, base: 161, when: g => (g.f.mugOnDesk || g.f.mugBack) && !g.f.sybilFaked, key: g => g.f.mugBack ? 'k' : '' },
      { id: 'shards', x: 176, y: 160, base: 161, when: g => g.f.sybilFaked },
      { id: 'cactus', x: 44, y: 94, base: 150, key: g => (g.f.webcamEaten ? 'e' : '') + (Math.floor(g.time * 2) % 2) },
      { id: 'lamp', x: 232, y: 72, base: 131 }
    ],
    ambient,
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [4, 36, 38, 112], walk: [40, 168], face: 'w', look: 'Дверь на улицу. Три замка, цепочка и табличка «Не стреляйте, я свидетель».',
        exit: function* (g) {
          if (g.f.sybilFaked && !g.f.webcamEaten) { yield g.say('sybil', 'Вы уходите? А я? Оно же мигает! Мне так лежать до пятницы?'); return; }
          g.sfx('door');
          yield* g.goRoom('street', { x: 82, y: 146, dir: 's' });
        } },
      { id: 'cactus', name: g => g.f.webcamEaten ? 'Кактус' : 'Кактус с камерой', rect: [44, 94, 24, 56], walk: [70, 160], face: 'w',
        look: g => g.f.webcamEaten ? 'Кактус. Камеры на нём больше нет. Макс утверждает, что она была вкусная.' : 'Кактус у двери. Сверху прикручена веб-камера, мигает красным. Кактусу интернет ни к чему.',
        use: g => g.f.webcamEaten ? 'Колючий. Камера была мягче.' : 'Отвернуть камеру? Мафия заметит. Она заплатила за это кино целым кактусом.',
        items: {
          max: function* (g) { yield* eatWebcam(g); },
          gun: 'Разбить камеру выстрелом? Мафия увидит, что камеру разбили. И начнёт думать. Мафии думать вредно.',
          roach: 'Жучок на камере? Через неё и так подслушивают. Двойная слежка уже бюрократия.',
          kmug: 'Облить камеру кетчупом? Мафия решит, что убили кактус.'
        } },
      { id: 'mug', name: 'Кружка Сибил', rect: [MUG.x - 7, MUG.y - 9, 14, 12], walk: [178, 170], face: 'n', over: true, when: g => !g.f.sybilFaked && !g.f.mugTaken && !g.has('kmug'),
        look: g => g.f.mugBack ? 'Кружка с кетчупом стоит на столе. Сибил вот-вот за ней потянется.' : g.f.mugOnDesk ? 'Кружка «Свидетель года». Стоит на столе. Сибил на секунду о ней забыла.' : 'Кружка в руках у Сибил. Сибил держит её обеими руками, как спасательный круг.',
        use: function* (g) { yield* takeMug(g); },
        items: {
          gun: function* (g) { yield* shootMug(g); },
          capgun: 'Пистонами кружку не разбить. Она пережила двенадцать кофе и одну Сибил.',
          kmug: function* (g) { yield* putBack(g); }
        } },
      { id: 'desk', name: 'Стол', rect: [164, 118, 64, 30], walk: [178, 170], face: 'n',
        look: 'Стол Сибил. Рядом с кофеваркой лежит расписание: «Пятница. Суд. Не умереть до суда».',
        use: 'Бумаги трогать не буду. Там показания. Вдруг я в них есть.',
        items: {
          kmug: function* (g) { yield* putBack(g); },
          mug: 'Вернуть пустую? Сибил расплачется. Она и над полной плачет.',
          gun: function* (g) { yield* shootMug(g); }
        } },
      { id: 'coffee', name: 'Кофеварка', rect: [204, 110, 18, 12], walk: [212, 168], face: 'n',
        look: 'Кофеварка работает без выходных. Как Сибил. Только кофеварка не боится.',
        use: 'Ещё кофе? Сибил и так вибрирует.' },
      { id: 'stand', name: 'Свидетельская трибуна', rect: [64, 104, 54, 50], walk: [92, 164], face: 'n',
        look: 'Свидетельская трибуна. Сибил на ней репетирует. На перилах выцарапано: «Я видела ВСЁ».',
        use: 'Подняться на трибуну? Меня сразу приведут к присяге, а я сегодня в мафии.' },
      { id: 'board', name: 'Пробковая доска', rect: [60, 50, 100, 38], walk: [110, 132], face: 'n',
        look: ['Доска Сибил. «Суд: пятница». Под надписью фотографии трёх мишек в костюмах. Подпись: «Видела!»', 'Внизу приколота квитанция: «Оплата за показания: почасовая». Часов, судя по всему, будет много.'] },
      { id: 'diploma', name: 'Грамота', rect: [126, 90, 34, 22], walk: [142, 160], face: 'n', look: 'Новая грамота: «Очевидец месяца». Рядом старые дипломы: психолог, мастер тату, водитель погрузчика, сомелье по газировке.' },
      { id: 'books', name: 'Книжный шкаф', rect: [170, 22, 50, 76], walk: [196, 132], face: 'n',
        look: ['«Как запомнить лицо за три секунды». «Как забыть лицо за три тысячи долларов».', '«Фрейд для начинающих» по-прежнему стоит корешком внутрь.'] },
      { id: 'window', name: 'Окно', rect: [230, 26, 44, 58], walk: [252, 132], face: 'n', look: 'Жалюзи закрыты наглухо. Сибил говорит, что снайперы уважают жалюзи.' },
      { id: 'plant', name: 'Фикус', rect: [240, 84, 32, 38], walk: [252, 134], face: 'n', look: 'Фикус пережил психотерапию и газету. Свидетельские показания его, похоже, доконают.' },
      { id: 'closet', name: 'Шкаф', rect: [282, 30, 34, 90], walk: [290, 136], face: 'n',
        look: 'Шкаф Сибил. После истории с Пиперсом она проверяет его каждое утро.',
        use: 'Не открою. Вдруг там опять кто-нибудь сидит в её парике.' }
    ],
    actors: {
      sybil: {
        name: 'Сибил', walk: [176, 172], face: 'e',
        look: g => g.f.sybilFaked && !g.f.sybilDone ? 'Сибил лежит в луже кетчупа и старательно не дышит. Одним глазом подглядывает.' : g.f.sybilDone ? 'Сибил в платье с кетчупом. Говорит, что в таком виде будет давать показания. Суд запомнит.' : 'Сибил Пандемик, профессиональный свидетель. Глаза как блюдца, в руках кружка. Её трясёт от кофе и от мафии, пропорции неизвестны.',
        talk: function* (g) {
          if (g.f.sybilFaked && !g.f.webcamEaten) { yield g.say('sybil', 'Я мертва, Сэм. Мёртвые молчат и думают о кетчупе.'); return; }
          yield g.talkTo('sybil');
        },
        items: {
          kmug: function* (g) { yield* putBack(g); },
          mug: function* (g) { yield g.say('sybil', 'Моя кружка! Пустая? Сэм, вернуть пустую кружку это жестоко.'); },
          gun: function* (g) { yield* shootMug(g); },
          capgun: function* (g) { yield g.say('sybil', 'Пистоны? Сэм, ты меня убиваешь. Пока в переносном смысле.'); },
          roach: function* (g) { yield* E.bugPlant(g, 'sybil'); },
          bearbox: function* (g) { yield g.say('sybil', 'Мишка от мафии?! Уберите! Я его видела! В смысле, я теперь всех видела.'); },
          max: function* (g) { yield g.say('max', 'Сибил, хочешь, я буду твоим телохранителем?'); yield g.say('sybil', 'Нет, Макс. Мне нужен кто-то, кто хранит тело. А ты его скорее потеряешь.'); }
        }
      }
    },
    setup(g) {
      const sy = g.actors.sybil;
      g.place('sybil', 'sybil', 206, 152, 's');
      sy.visible = true;
      if (g.f.sybilFaked && !g.f.sybilDone) { g.place('sybil', 'sybil', 222, 174, 's'); sy.act = 'dead'; sy.keepAct = true; sy.v = 'ketchup'; }
      else if (g.f.mugTaken) { sy.act = 'jitter'; sy.keepAct = true; }
      else { sy.act = ''; sy.keepAct = false; }
      if (g.f.sybilDone) sy.v = 'ketchup';
      if (!g.f.mugTaken && !g.f.mugBack && !g.f.sybilFaked) g.f.mugOnDesk = true;
    },
    onLoad(g) { ROOMS.sybil.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
