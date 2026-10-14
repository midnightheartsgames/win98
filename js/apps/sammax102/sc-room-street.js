(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP102;
  const { ROOMS, LAYERS } = E;
  const { sprite, textOn } = S.BG;

  LAYERS.street = {
    lamp: () => S.LAYERS.street.lamp(),
    hydrant: () => S.LAYERS.street.hydrant(),
    mailbox: () => S.LAYERS.street.mailbox(),
    desoto: () => S.LAYERS.street.desoto(),
    redcar: () => S.LAYERS.street.redcar(),
    oldGraffiti: () => S.LAYERS.street.oldGraffiti({ f: { graffitiRuined: true } }),
    newGraffiti: () => S.LAYERS.street.newGraffiti(),
    sybilSign: () => sprite(144, 11, (P, b) => {
      P.part(P.rect(0, 0, 144, 11), C.plum, { b: 1 });
      textOn(b, 'РЕДАКЦИЯ ГАЗЕТЫ', 28, 2, C.yellow[4], C.black);
    }),
    sybilPlate: () => sprite(36, 20, (P, b) => {
      P.part(P.rect(0, 0, 36, 20), C.cream, { b: 4 });
      textOn(b, 'ВЕСТ-', 4, 1, C.red[2], 0);
      textOn(b, 'НИК', 9, 10, C.red[2], 0);
    }),
    boscoPoster: () => sprite(20, 30, (P, b) => {
      P.part(P.rect(0, 0, 20, 30), C.pink, { b: 4 });
      P.part(P.ell(10, 9, 5, 5.4), C.red, { b: 3 });
      P.curve('M 10 14 Q 12 17 9 19', C.grey[1]);
      textOn(b, '1М', 3, 20, C.black, 0);
    }),
    paperbox: g => sprite(24, 34, (P, b) => {
      P.part(P.rect(2, 4, 20, 22), C.red, { b: 3 });
      P.part(P.rect(4, 7, 16, 11), C.sky, { b: 3, sh: 0 });
      if (g && g.f.paperOut) {
        P.part(P.rect(6, 9, 12, 8), C.cream, { b: 4, sh: 0, hi: 0 });
        P.part(P.rect(6, 9, 12, 2), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
        P.part(P.ell(14, 14, 1.6, 1.8), C.slime, { b: 3, sh: 0, hi: 0, ol: 0 });
      } else for (let i = 0; i < 3; i++) P.line(6, 10 + i * 3, 17, 10 + i * 3, C.grey[3]);
      P.part(P.rect(8, 20, 8, 2), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(4, 26, 3, 8), C.grey, { b: 1, sh: 0 });
      P.part(P.rect(17, 26, 3, 8), C.grey, { b: 1, sh: 0 });
    })
  };

  E.ratsFlee = function* (g) {
    const back = g.saveSpot();
    g.setRoom('street');
    g.camLock = 400;
    g.centerCam(true);
    const car = g.actors.ratcar;
    g.place('ratcar', 'street', 606, 178, 'e');
    car.visible = true; car.scripted = true;
    g.sfx('engine');
    yield g.say(null, 'Бритые хвосты рулят!', { key: 'rats', color: S.COLORS.rat, x: 250, y: 150 });
    g.sfx('engine');
    yield g.walkTo('ratcar', 760, 178, { free: true, speed: 3 });
    car.visible = false;
    g.place('ratcar', 'nowhere', 0, 0);
    g.camLock = null;
    yield g.say('max', 'Они удирают на игрушечной машинке! Сэм, в погоню!');
    yield g.say('sam', 'Садимся в Де Сото. Крыс на колёсах я ещё не арестовывал.');
    yield* g.goRoom('bosco', back, { fade: 3 });
  };

  ROOMS.street = {
    id: 'street', name: 'Улица', w: 640, music: 'street',
    scale: [138, 0.84, 166, 0.92],
    paint: b => S.BG.street(b),
    walk: [[0, 139, 640, 139, 640, 166, 0, 166]],
    layers: [
      { id: 'oldGraffiti', x: 186, y: 78 },
      { id: 'newGraffiti', x: 342, y: 80 },
      { id: 'sybilSign', x: 4, y: 44 },
      { id: 'sybilPlate', x: 102, y: 88 },
      { id: 'boscoPoster', x: 434, y: 76 },
      { id: 'lamp', x: 166, y: 56, base: 166 },
      { id: 'lamp2', art: 'lamp', x: 436, y: 56, base: 166 },
      { id: 'hydrant', x: 258, y: 148, base: 166 },
      { id: 'mailbox', x: 384, y: 136, base: 164 },
      { id: 'paperbox', x: 518, y: 132, base: 165, key: g => g.f.paperOut ? 'p' : '' },
      { id: 'desoto', x: 14, y: 156, base: 200 },
      { id: 'redcar', x: 150, y: 162, base: 199 }
    ],
    hot: [
      { id: 'sybildoor', name: 'Редакция Сибил', rect: [66, 76, 34, 64], walk: [82, 143], face: 'n',
        look: 'Дверь Сибил. Новая табличка: «Редакция. Стучать громко, мы печатаем».',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('sybil', { x: 40, y: 170, dir: 'e' }); } },
      { id: 'officedoor', name: 'Наш офис', rect: [284, 58, 38, 82], walk: [303, 141], face: 'n',
        look: 'Наш подъезд. Над дверью наклейка «Смотри Майру!». Отдеру, когда вернёмся.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('office', { x: 284, y: 162, dir: 'w' }); } },
      { id: 'boscodoor', name: 'Лавка Боско', rect: [466, 60, 36, 80], walk: [484, 143], face: 'n',
        look: 'Лавка Боско. На двери новая табличка: «Поставщик двора Её Величества». Какого двора, не уточняется.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('bosco', { x: 36, y: 172, dir: 'e' }); } },
      { id: 'desoto', name: 'Де Сото', rect: [16, 158, 128, 40], walk: [80, 164], face: 's', walkUse: true,
        look: ['Наш Де Сото. На лобовом стекле штраф за парковку. На штрафе автограф Макса.', 'Мотор тёплый. Де Сото всегда готов к погоне, в отличие от меня.'],
        use: function* (g) { yield* S.openMap(g); } },
      { id: 'redcar', name: 'Чужая машина', rect: [152, 164, 84, 32], walk: [200, 164], face: 's',
        look: 'Та же чужая машина. Её хозяин, похоже, третий день сидит у Майры в зале.',
        use: 'Заперто. Хозяину, надеюсь, подарят новую машину. Хотя подарят, скорее, тостер.' },
      { id: 'oldgraffiti', name: 'Граффити с Максом', rect: [186, 78, 66, 58], walk: [218, 148], face: 'n',
        look: 'Граффити Спекса с моими дорисовками. Спекс ушёл на телевидение, а рожица Макса осталась.',
        use: 'Стирать не буду. Макс считает это своим лучшим портретом.' },
      { id: 'newgraffiti', name: 'Старое граффити', rect: [342, 80, 44, 50], walk: [364, 147], face: 'n',
        look: 'Недорисованное «EYE-BO». Краска облупилась, а глаз смотрит как ни в чём не бывало.' },
      { id: 'window', name: 'Окно нашего офиса', rect: [194, 10, 52, 46], walk: [218, 148], face: 'n',
        look: 'Окно нашего офиса. Отсюда видно, что мы не выключили телевизор.' },
      { id: 'hydrant', name: 'Гидрант', rect: [256, 146, 16, 20], walk: [250, 160],
        look: 'Гидрант. На нём кто-то нарисовал сердечко и подписал: «Майра навсегда».',
        use: 'Воды хватит на пожар, но на Майру не хватит.' },
      { id: 'mailbox', name: 'Почтовый ящик', rect: [384, 136, 20, 30], walk: [378, 158],
        look: 'Из щели торчит конверт: «Бесплатный билет на шоу Майры! Только сегодня! Только навсегда!»',
        use: 'Чужие письма я не трогаю. Даже с бесплатными билетами в плен.' },
      { id: 'paperbox', name: 'Газетный автомат', rect: [518, 130, 24, 36], walk: [530, 150], face: 'n',
        look: g => g.f.paperOut ? '«Вестник инопланетных треугольников»! Наш номер. Пятьдесят центов.' : 'Газетный автомат. Внутри вчерашний «Утренний курьер» с прогнозом погоды. Погода плохая.',
        use: function* (g) {
          if (!g.f.paperOut) { yield g.say('sam', 'Вчерашние новости мне ни к чему. Мне бы сегодняшние пережить.'); return; }
          if (g.has('paper') || g.f.proofPaper) { yield g.say('sam', 'Один номер у нас уже есть. Второй подарю Максу на день рождения.'); return; }
          if (g.has('coin')) { yield* buyPaper(g); return; }
          yield g.say('sam', 'Пятьдесят центов за номер. В карманах у меня только ворс и билет в кино семьдесят девятого года.');
        },
        items: {
          coin: function* (g) {
            if (!g.f.paperOut) { yield g.say('sam', 'Платить за вчерашнюю погоду? Нет.'); return; }
            if (g.has('paper') || g.f.proofPaper) { yield g.say('sam', 'Второй номер нам не нужен.'); return; }
            yield* buyPaper(g);
          },
          gun: 'Грабить газетный автомат? Сибил не простит. Это её тираж.',
          stamps: 'Талоны автомат не принимает. Он старой закалки.'
        } },
      { id: 'boscosign', name: 'Вывеска Боско', rect: [404, 24, 156, 30], look: 'BOSCO\'S. Под вывеской прибита дощечка: «Ныне владение лорда Рамплботтома».' },
      { id: 'sybilsign', name: 'Вывеска Сибил', rect: [4, 44, 144, 11], look: '«Редакция газеты». В прошлом месяце тут была психотерапия, до неё ремонт часов. Сибил не стоит на месте.' },
      { id: 'alley', name: 'Переулок', rect: [566, 0, 74, 140],
        look: g => g.actors.ratcar.room === 'street' ? 'Переулок за лавкой Боско. Там стоит крошечная машина с огнями на капоте.' : 'Пустой переулок. Пахнет мятой и выхлопом.' }
    ],
    actors: {
      ratcar: {
        name: 'Крысиный хот-род', walk: [590, 164], face: 'e', when: g => g.actors.ratcar.visible && !g.busy,
        look: 'Крысиный хот-род. Три сиденья, огни на капоте и наклейка «Бритые хвосты рулят». Колёса размером с пуговицу.',
        use: 'Хозяева вернутся и покусают. Я с этими крысами ещё не знаком, но уже их не люблю.',
        items: { gun: 'Стрелять в пустую машину невежливо. Подожду, пока в ней кто-нибудь будет.' }
      }
    },
    enter: function* (g) {
      if (!g.seen.street102 && g.f.caseOpen) {
        g.seen.street102 = 1;
        yield g.say('max', 'Сэм, у Сибил опять новая вывеска!');
        yield g.say('sam', 'Похоже, она снова сменила работу. Надо будет зайти. Поздравить или посочувствовать, по ситуации.');
      }
    },
    setup(g) {
      const car = g.actors.ratcar;
      if (!g.f.creamStolen) { g.place('ratcar', 'street', 606, 178, 'w'); car.visible = true; car.z = 10; }
    },
    onLoad(g) { ROOMS.street.setup(g); }
  };

  function* buyPaper(g) {
    yield g.anim('sam', 'reach', 0.5);
    g.drop('coin');
    g.sfx('cash');
    yield 0.4;
    g.give('paper');
    yield g.say('sam', 'Щёлк. Свежий номер наш.');
    yield* g.exec(E.ITEMS.paper.look, 'item.paper.look');
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
