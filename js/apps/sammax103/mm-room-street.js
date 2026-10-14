(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP103;
  const { ROOMS, TALK, LAYERS } = E;
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
      textOn(b, 'СВИДЕТЕЛЬСКИЕ УСЛУГИ', 12, 2, C.yellow[4], C.black);
    }),
    sybilPlate: () => sprite(36, 20, (P, b) => {
      P.part(P.rect(0, 0, 36, 20), C.gold, { b: 3 });
      textOn(b, 'ВИДЕЛА', 1, 1, C.gold[0], 0);
      textOn(b, 'ВСЁ', 9, 10, C.gold[0], 0);
    }),
    boscoFlag: () => sprite(24, 34, P => {
      P.part(P.rect(1, 0, 2, 34), C.grey, { b: 2, sh: 0 });
      P.part(P.rect(3, 2, 7, 14), C.blue, { b: 3, sh: 0 });
      P.part(P.rect(10, 2, 7, 14), C.grey, { b: 5, sh: 0 });
      P.part(P.rect(17, 2, 7, 14), C.red, { b: 3, sh: 0 });
    }),
    boscoPoster: () => sprite(34, 30, (P, b) => {
      P.part(P.rect(0, 0, 34, 30), C.cream, { b: 4 });
      P.part(P.ell(17, 12, 8, 8), C.red, { b: 3 });
      P.part(P.cap(10, 5, 24, 19, 1.4), C.grey, { b: 5, sh: 0, hi: 0 });
      A_bear(P, 17, 15);
      textOn(b, 'МИШКАМ', 1, 21, C.red[2], 0);
    })
  };

  function A_bear(P, x, y) {
    P.part(P.ell(x - 3, y - 7, 1.6, 1.6), C.oak, { b: 3, sh: 0 });
    P.part(P.ell(x + 3, y - 7, 1.6, 1.6), C.oak, { b: 3, sh: 0 });
    P.part(P.ell(x, y - 4, 4, 3.6), C.oak, { b: 3, sh: 0 });
  }

  TALK.cuddlyout = {
    options: [
      { id: 'hi', icon: 'f:cuddly', text: 'Обнимашка? Что ты тут делаешь?', run: function* (g) {
        yield g.say('cuddly', 'Сдаю?');
        yield g.say('sam', 'Здесь нет карт.');
        yield g.say('cuddly', 'Сдаю?');
      } },
      { id: 'paper', icon: 'newspaper', text: 'Что читаешь?', run: function* (g) {
        yield g.say('sam', 'Газета «Вестник инопланетных треугольников». Прошлого месяца. Вверх ногами.');
        yield g.say('cuddly', 'Сдаю?');
      } },
      { id: 'code', icon: 'rug', text: E.CODE, run: function* (g) {
        yield g.say('cuddly', 'Сдаю?');
        yield g.say('max', 'Он не крот, Сэм. Кроты хотя бы роют.');
      } },
      { id: 'bye', icon: 'bye', text: 'Не будем мешать.', end: true, run: function* (g) { yield g.say('cuddly', 'Сдаю?'); } }
    ]
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
      { id: 'boscoFlag', x: 440, y: 58 },
      { id: 'boscoPoster', x: 520, y: 68 },
      { id: 'lamp', x: 166, y: 56, base: 166 },
      { id: 'lamp2', art: 'lamp', x: 436, y: 56, base: 166 },
      { id: 'hydrant', x: 258, y: 148, base: 166 },
      { id: 'mailbox', x: 384, y: 136, base: 164 },
      { id: 'desoto', x: 14, y: 156, base: 200 },
      { id: 'redcar', x: 150, y: 162, base: 199 }
    ],
    hot: [
      { id: 'sybildoor', name: 'Контора Сибил', rect: [66, 76, 34, 64], walk: [82, 143], face: 'n',
        look: 'Дверь Сибил. Новая табличка: «Видела всё». Ниже приписка: «Остальное по договорённости».',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('sybil', { x: 40, y: 170, dir: 'e' }); } },
      { id: 'officedoor', name: 'Наш офис', rect: [284, 58, 38, 82], walk: [303, 141], face: 'n',
        look: 'Наш подъезд. На двери кто-то нацарапал «Крыса внутри». Это правда, но звучит обидно для Джимми.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('office', { x: 284, y: 162, dir: 'w' }); } },
      { id: 'boscodoor', name: 'Лавка Боско', rect: [466, 60, 36, 80], walk: [484, 143], face: 'n',
        look: 'Лавка Боско. Над дверью французский флаг. На стекле плакат: мишка, перечёркнутый красным.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('bosco', { x: 36, y: 172, dir: 'e' }); } },
      { id: 'desoto', name: 'Де Сото', rect: [16, 158, 128, 40], walk: [80, 164], face: 's', walkUse: true,
        look: ['Наш Де Сото. Мотор тёплый, бак полупустой. Как и мы с Максом после обеда.', 'Среди фантиков на заднем сиденье лежит что-то пушистое. Лучше его не будить.'],
        use: function* (g) { yield* S.openMap(g); } },
      { id: 'redcar', name: 'Чужая машина', rect: [152, 164, 84, 32], walk: [200, 164], face: 's',
        look: 'Чужая машина. Стоит здесь с первого дела. Её хозяин, видимо, нашёл место получше.',
        use: 'Заперто. Мафия бы открыла. Мы пока не мафия.' },
      { id: 'oldgraffiti', name: 'Граффити с Максом', rect: [186, 78, 66, 58], walk: [218, 148], face: 'n',
        look: 'Рожица Макса поверх старого граффити. Кто-то пририсовал ей мишкины уши. Мафия метит территорию.',
        use: 'Стирать не буду. Это уже часть городской истории. Самая неприличная часть.' },
      { id: 'newgraffiti', name: 'Старое граффити', rect: [342, 80, 44, 50], walk: [364, 147], face: 'n',
        look: 'Недорисованное «EYE-BO». Краска облупилась. Глаз по-прежнему смотрит, но уже без энтузиазма.' },
      { id: 'window', name: 'Окно нашего офиса', rect: [194, 10, 52, 46], walk: [218, 148], face: 'n',
        look: 'Окно нашего офиса. В нём отражается реклама Теда И. Бэра на крыше напротив.' },
      { id: 'hydrant', name: 'Гидрант', rect: [256, 146, 16, 20], walk: [250, 160],
        look: 'Гидрант. Кто-то приклеил к нему магнитик с мишкой. Мафия щедра на сувениры.',
        use: 'Пожара нет. Гидрант отдыхает.' },
      { id: 'mailbox', name: 'Почтовый ящик', rect: [384, 136, 20, 30], walk: [378, 158],
        look: 'Из щели торчит купон: «Первый жетон в казино Теда И. Бэра бесплатно! Последний тоже!»',
        use: 'Чужие письма я не читаю. Особенно те, что с мишками.' },
      { id: 'boscosign', name: 'Вывеска Боско', rect: [404, 24, 156, 30], look: 'BOSCO\'S. Рядом прибита дощечка: «Анархия и неудобства. С 9 до 18».' },
      { id: 'boscoposter', name: 'Плакат', rect: [520, 68, 34, 30], look: 'Плакат «Нет мишкам!». Мишка перечёркнут так старательно, что прорвал бумагу.' },
      { id: 'sybilsign', name: 'Вывеска Сибил', rect: [4, 44, 144, 11], look: '«Свидетельские услуги». В прошлом месяце тут была газета, до неё психотерапия. Сибил меняет профессии чаще, чем я шляпы. Я шляпы не меняю.' },
      { id: 'alley', name: 'Переулок', rect: [566, 0, 74, 140], look: 'Тёмный переулок за лавкой Боско. Оттуда кто-то посматривает. Может, кошка. Может, мафия.' }
    ],
    actors: {
      cuddly: {
        name: 'Обнимашка с газетой', walk: [410, 160], face: 'e', dist: 30, when: g => g.actors.cuddly.room === 'street',
        look: 'Обнимашка, крупье из казино. Стоит у лавки Боско и читает газету. Газета вверх ногами. Дыра для глаз прорезана криво.',
        talk: function* (g) { yield g.talkTo('cuddlyout'); },
        items: {
          gun: 'Стрелять в наблюдателя? Мафия решит, что мы нервные.',
          bearbox: 'Он возьмёт, скажет «сдаю?» и завернёт в газету. Чаклз просил по-другому.',
          roach: function* (g) { yield* E.bugPlant(g, 'cuddly'); },
          max: function* (g) { yield g.say('max', 'Можно я почитаю газету вместе с тобой?'); yield g.say('cuddly', 'Сдаю?'); }
        }
      }
    },
    enter: function* (g) {
      if (!g.seen.street103 && g.f.caseOpen) {
        g.seen.street103 = 1;
        yield g.say('max', 'Сэм, у Сибил опять новая вывеска! А у Боско французский флаг!');
        yield g.say('sam', 'Весь квартал поменял профессии, кроме нас. Мы по-прежнему бесплатно рискуем жизнью.');
      }
      if (g.actors.cuddly.room === 'street' && !g.seen.cuddlyOut) {
        g.seen.cuddlyOut = 1;
        yield g.say('max', 'Смотри, Сэм! У лавки Боско мафиози с газетой! Совсем незаметный!');
        yield g.say('sam', 'Незаметный, как рояль в кустах. Газету он держит вверх ногами, чтобы мы не узнали, что он читает.');
      }
    },
    setup(g) {
      const cu = g.actors.cuddly;
      if (g.f.joined && !g.f.boscoDone && !g.f.inducted) { g.place('cuddly', 'street', 430, 150, 'w'); cu.act = 'read'; cu.keepAct = true; cu.visible = true; }
    },
    onLoad(g) { ROOMS.street.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
