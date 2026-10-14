(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP102;
  const { ROOMS, TALK, LAYERS } = E;
  const { sprite, textOn } = S.BG;

  LAYERS.sybil = {
    couch: g => S.LAYERS.sybil.couch(g),
    lamp: () => S.LAYERS.sybil.lamp(),
    papers: () => sprite(80, 22, P => {
      for (let i = 0; i < 4; i++) {
        const x = 4 + i * 19, h = 8 + (i % 2) * 5;
        P.part(P.rect(x, 20 - h, 15, h), C.grey, { b: 4, sh: 1, hi: 0 });
        for (let k = 3; k < h; k += 2) P.line(x + 1, 20 - h + k, x + 13, 20 - h + k, C.grey[3]);
        P.part(P.rect(x, 20 - h - 3, 15, 4), C.grey, { b: 5, sh: 0, hi: 0 });
        P.line(x + 2, 20 - h - 2, x + 12, 20 - h - 2, C.red[3]);
      }
    }),
    typedesk: () => sprite(58, 56, P => {
      P.part(P.poly([2, 18, 56, 16, 58, 24, 0, 26]), C.wood, { b: 3 });
      P.part(P.poly([0, 26, 58, 24, 58, 56, 0, 56]), C.wood, { b: 2 });
      P.part(P.rect(6, 30, 20, 22), C.wood, { b: 2, sh: 1, hi: 1 });
      P.part(P.rect(32, 30, 20, 22), C.wood, { b: 2, sh: 1, hi: 1 });
      P.part(P.poly([14, 17, 38, 16, 40, 8, 16, 9]), C.grey, { b: 1 });
      P.part(P.rect(18, 6, 18, 3), C.grey, { b: 5, sh: 0 });
      P.part(P.poly([19, 7, 35, 7, 34, 0, 20, 0]), C.cream, { b: 4, sh: 0, hi: 0 });
      for (let i = 0; i < 5; i++) P.px(18 + i * 4, 14, C.grey[4]);
      P.part(P.rect(44, 12, 8, 5), C.red, { b: 3 });
    }),
    board: () => sprite(100, 38, (P, b) => {
      P.part(P.rect(0, 0, 100, 38), C.oak, { b: 3 });
      P.part(P.rect(3, 3, 94, 32), C.sand, { b: 3, sh: 0, hi: 0 });
      const pins = [[8, 6, 18, 14, C.grey], [30, 8, 16, 12, C.cream], [50, 5, 20, 15, C.grey], [74, 7, 18, 13, C.cream]];
      for (const [x, y, w, h, r] of pins) {
        P.part(P.rect(x, y, w, h), r, { b: 4 });
        P.px(x + w / 2, y + 1, C.red[3]);
      }
      P.part(P.ell(17, 12, 5, 1.8), C.grey, { b: 1, sh: 0 });
      P.part(P.ell(17, 11, 2.4, 1.4), C.sky, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(60, 12, 3, 4.5), C.fur, { b: 2, sh: 0 });
      for (let i = 0; i < 3; i++) P.line(33, 11 + i * 3, 43, 11 + i * 3, C.grey[2]);
      for (let i = 0; i < 3; i++) P.line(77, 10 + i * 3, 89, 10 + i * 3, C.grey[2]);
      P.part(P.rect(10, 24, 80, 9), C.cream, { b: 4, sh: 0 });
      textOn(b, 'НУЖЕН СКАНДАЛ!', 12, 25, C.red[2], 0);
    })
  };

  function* printPaper(g) {
    const sy = g.actors.sybil;
    g.drop('photo');
    g.f.photoGiven = true;
    yield g.say('sybil', 'Зелёный незнакомец, собака и кролик! Межпланетный любовный треугольник! Сэм, это же сенсация!');
    sy.act = 'write'; sy.keepAct = true;
    for (let i = 0; i < 6; i++) { g.sfx('type'); yield 0.18; }
    g.sfx('ding');
    yield g.say('sybil', 'Заголовок: «Пёс, кролик и зелёный незнакомец: любовь без границ». Подзаголовок: «Кто третий лишний?»');
    for (let i = 0; i < 6; i++) { g.sfx('type'); yield 0.16; }
    sy.act = ''; sy.keepAct = false;
    g.f.paperOut = true;
    yield g.say('sybil', 'Готово! Мальчишка уже везёт тираж в автомат у лавки Боско. Возьмите себе экземпляр. Пятьдесят центов.');
    yield g.say('sam', 'Даже героям обложки?');
    yield g.say('sybil', 'Героям обложки особенно. Звёзды должны поддерживать прессу.');
  }

  function* givePhoto(g) {
    const c = g.f.photoColor || '';
    if (c === 'green') { yield* printPaper(g); return; }
    if (c === 'red') yield g.say('sybil', 'Красный мужчина? Похоже на солнечный ожог. Мне нужен пришелец, Сэм. Пришельцы зелёные.');
    else if (c === 'blue') yield g.say('sybil', 'Синий? Выглядит как простуженный гражданин. Пришельцы зелёные, Сэм. Это знает каждый ребёнок и каждый мой читатель.');
    else yield g.say('sybil', 'Обычный мужчина, собака и кролик. Это не скандал. Это семейный альбом.');
    g.f.knowGreen = true;
  }

  TALK.sybil = {
    start: function* (g) {
      if (!g.seen.sybil102) {
        g.seen.sybil102 = 1;
        yield g.say('sybil', 'Сэм! Макс! Вы вовремя. У меня горит первый номер, а поджечь его нечем.');
      }
    },
    options: [
      { id: 'job', icon: 'q', text: 'Сибил, ты опять сменила работу?', run: function* (g) {
        yield g.say('sybil', 'Жёлтая пресса. Своя газета: «Вестник инопланетных треугольников».');
        yield g.say('sybil', 'Психотерапия себя не окупала. Люди приходили выговориться и уходили, не заплатив. Теперь они будут платить, чтобы читать, как выговариваются другие.');
      } },
      { id: 'paper', icon: 'paper', text: 'О чём твоя газета?', run: function* (g) {
        yield g.say('sybil', 'Звёзды, пришельцы и их запутанная личная жизнь. Первый номер свёрстан весь, кроме первой полосы.');
        yield g.say('sybil', 'Нет главного скандала. Без скандала первая полоса выглядит как меню в больнице.');
      } },
      { id: 'scandal', icon: 'heart', text: 'Нам как раз нужен скандал. Для Майры.', run: function* (g) {
        yield g.say('sybil', 'Отлично, нам по пути. Принесите фотографию: вы двое и пришелец. Любовный треугольник, межпланетный масштаб.');
        yield g.say('sybil', 'Со знаменитостью было бы идеально. Остальное я допишу сама. Я умею дописывать.');
        g.f.knowScandal = true;
      } },
      { id: 'alien', icon: 'sw_green', text: 'Как выглядят пришельцы?', when: g => g.f.knowScandal, run: function* (g) {
        yield g.say('sybil', 'Зелёные. Это знают все. Если на снимке будет зелёный человек, читатели сами всё поймут.');
        yield g.say('sybil', 'Мои читатели очень сообразительные. Особенно насчёт того, чего не было.');
        g.f.knowGreen = true;
      } },
      { id: 'myra', icon: 'f:myra', text: 'Что ты знаешь о Майре Стамп?', run: function* (g) {
        yield g.say('sybil', 'Майра третий день в прямом эфире. Говорят, у неё на столе новый плюшевый медведь, и с тех пор она не уходит домой.');
        yield g.say('sybil', 'Мне пришла анонимка: «Мишку прислали не поклонники». Печатать не стала. Слишком похоже на правду, такое у нас не читают.');
      } },
      { id: 'bills', icon: 'money', text: 'Как у тебя с деньгами?', once: true, run: function* (g) {
        yield g.say('sybil', 'Типография берёт вперёд, бумага дорожает. Кушетку я продала, но покупатель её вернул. Сказал, на ней слишком много плакали.');
      } },
      { id: 'sales', icon: 'star', text: 'Как продаётся газета?', when: g => g.f.paperOut, run: function* (g) {
        yield g.say('sybil', 'Первый тираж разошёлся за час. Почти весь купил один джентльмен с накладными усами. Сказал, изучает противника.');
      } },
      { id: 'bye', icon: 'bye', text: 'Удачи с газетой.', end: true, run: function* (g) {
        yield g.say('sybil', 'Удача в этом деле ни при чём, Сэм. Нужен скандал.');
      } }
    ]
  };

  ROOMS.sybil = {
    id: 'sybil', name: 'Редакция Сибил', w: 320, music: 'sybil',
    paint: b => S.BG.sybil(b, {}),
    walk: [[6, 126, 316, 126, 316, 198, 6, 198]],
    block: [[64, 150, 158, 150, 158, 162, 64, 162], [170, 150, 228, 150, 228, 162, 170, 162]],
    layers: [
      { id: 'board', x: 60, y: 52 },
      { id: 'couch', x: 60, y: 118, base: 160 },
      { id: 'papers', x: 72, y: 124, base: 161 },
      { id: 'typedesk', x: 170, y: 108, base: 160 },
      { id: 'lamp', x: 232, y: 72, base: 131 }
    ],
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [4, 36, 38, 112], walk: [40, 168], face: 'w', look: 'Дверь на улицу. С этой стороны на ней висит табличка «Не беспокоить. Идёт вёрстка».',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street', { x: 82, y: 146, dir: 's' }); } },
      { id: 'closet', name: 'Шкаф', rect: [282, 30, 34, 90], walk: [290, 136], face: 'n',
        look: 'Шкаф. После истории с Пиперсом Сибил держит в нём только архив и запасной парик.',
        use: 'Открывать не буду. Архив Сибил может оказаться кусачим.' },
      { id: 'couch', name: 'Кушетка', rect: [62, 118, 96, 40], walk: [110, 170], face: 'n',
        look: 'Кушетка завалена газетами. Пациентов на ней больше не бывает. Только корректура.',
        use: 'Прилечь? На ней уже лежит тираж прошлой недели.' },
      { id: 'board', name: 'Пробковая доска', rect: [60, 52, 100, 38], walk: [110, 132], face: 'n',
        look: ['Пробковая доска. Размытые тарелки, вырезка «Снежный человек женился» и крупно: «Нужен скандал!»', 'Внизу приколот счёт из типографии. Сумма обведена красным три раза.'] },
      { id: 'typedesk', name: 'Печатная машинка', rect: [170, 112, 58, 36], walk: [160, 172], face: 'e',
        look: 'Печатная машинка «Ундервуд». Буква «ё» западает, поэтому в газете Сибил все ёжики будут через «е».',
        use: function* (g) { yield g.say('sybil', 'Руки прочь от машинки, Сэм. Она печатает только правду. Мою.'); } },
      { id: 'books', name: 'Книжный шкаф', rect: [170, 22, 50, 76], walk: [196, 132], face: 'n',
        look: ['«Как написать сенсацию за пять минут». «Пришельцы среди нас. Том третий».', '«Фрейд для начинающих» стоит корешком внутрь. Прошлое не отпускает.'] },
      { id: 'window', name: 'Окно', rect: [230, 26, 44, 58], walk: [252, 132], face: 'n', look: 'Жалюзи закрыты. Сибил считает, что пришельцы подглядывают с крыши напротив.' },
      { id: 'plant', name: 'Фикус', rect: [240, 84, 32, 38], walk: [252, 134], face: 'n', look: 'Фикус пережил психотерапию. Посмотрим, переживёт ли он жёлтую прессу.' },
      { id: 'diplomas', name: 'Дипломы', rect: [54, 20, 114, 28], walk: [110, 132], face: 'n', look: 'Дипломы: психолог, мастер тату, водитель погрузчика, сомелье по газировке. Рядом приколот пропуск прессы. Самодельный.' }
    ],
    actors: {
      sybil: {
        name: 'Сибил', walk: [160, 172], face: 'e',
        look: 'Сибил Пандемик. Карандаш за ухом, пальцы в чернилах и взгляд человека, который ищет сенсацию и найдёт её в чём угодно.',
        talk: function* (g) { yield g.talkTo('sybil'); },
        items: {
          photo: function* (g) { yield* givePhoto(g); },
          vtape: function* (g) { yield g.say('sybil', 'Ковбои и корова? Это не скандал, Сэм. Это семейный просмотр.'); },
          contract: function* (g) { yield g.say('sybil', 'Контракт на запись. Солидно. Скандала в этом ни на грош.'); },
          cards: function* (g) { yield g.say('sybil', 'Вопросы без ответов? Прекрасно. Готовые заголовки на неделю вперёд.'); },
          coin: function* (g) { yield g.say('sybil', 'Пятьдесят центов? Это ровно один номер. Приберегите.'); },
          paper: function* (g) { yield g.say('sybil', 'Мой первый номер! Правда, красиво? Сама верстала, сама себе завидую.'); },
          gun: function* (g) { yield g.say('sybil', 'Уберите пушку, Сэм. В журналистов стреляют только редакторы.'); },
          cake: function* (g) { yield g.say('sybil', 'Розовый торт, который светится? Напишу о нём в рубрике «Необъяснимое».'); },
          kcake: function* (g) { yield g.say('sybil', 'Торт в кетчупе? Это пойдёт в раздел «Преступления».'); },
          lyrics: function* (g) { yield g.say('sybil', '«Я синий? Кто ты такой?» Похоже на письма моих читателей.'); },
          max: function* (g) { yield g.say('max', 'Сибил, а про меня напишешь?'); yield g.say('sybil', 'Напишу, Макс. В рубрике «Их разыскивают соседи».'); }
        }
      }
    },
    setup(g) {
      const sy = g.actors.sybil;
      g.place('sybil', 'sybil', 206, 152, 's');
      sy.visible = true; sy.act = ''; sy.keepAct = false;
    },
    onLoad(g) { ROOMS.sybil.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
