(function (S) {
  'use strict';
  const { C, COLORS, blit } = S;
  const E = S.EP202;
  const { ROOMS, TALK } = E;

  function drawSpr(f, cx, id, x, y, pose, scale) {
    const sp = S.sprite(id, pose || {}, scale || 1);
    if (sp) blit(f, sp.buf, Math.round(x - cx - sp.ox), Math.round(y - sp.oy));
  }

  function* intro(g) {
    g.hideUI = true;
    const max = g.actors.max;
    max.scripted = true;
    g.closeup = { kind: 'titlecard22', t0: g.time, lines: ['SAM & MAX', 'ЭПИЗОД 202', 'БЛЮЗ ИСТУКАНОВ МОАИ'] };
    g.music('title22');
    yield g.fadeIn(1.2);
    yield 4.8;
    yield g.fadeOut(2);
    g.closeup = null;
    g.music('office');
    g.place('max', 'office', 118, 156, 'w');
    g.place('sam', 'office', 150, 164, 'w');
    yield g.fadeIn(1.5);
    yield g.say('max', 'Сэм, за окном что-то гудит как гигантский синий тостер!');
    yield g.say('sam', 'Это не тостер, Макс. На нашем тротуаре открылся светящийся треугольный разлом.');
    yield g.say('max', 'Ура! Геометрические аномалии прямо у порога! Давай бросим туда ботинок!');
    yield g.say('sam', 'Ботинки казенные. Сначала проведем рекогносцировку.');
    g.f.introDone = true;
    g.f.portalSeen = true;
    max.scripted = false;
    g.hideUI = false;
  }

  const CLOSET = {
    name: 'Шкаф с уликами',
    walk: [240, 136],
    face: 'n',
    look: g => g.f.closetOpen ? 'Шкаф открыт. Внутри пылятся трофеи со всех наших прошлых расследований.' : 'Наш шкаф вещдоков. Закрыт на шпингалет, чтобы Макс не съел улики.',
    use: function* (g) {
      g.f.closetOpen = !g.f.closetOpen;
      g.sfx('door');
      yield g.say('sam', g.f.closetOpen ? 'Шкаф открыт. Запах старых тайн и нафталина.' : 'Шкаф закрыт.');
    }
  };

  ROOMS.office = {
    id: 'office', name: 'Офис',
    intro,
    w: 320, h: 200, music: 'office',
    paint: (b, g) => S.BG.office22(b, { closetOpen: g.f.closetOpen, portalGlow: g.f.portalSeen }),
    walk: [
      [20, 136, 300, 136, 300, 175, 20, 175],
      [100, 134, 160, 134, 160, 150, 100, 150]
    ],
    start: [150, 164],
    enter: function* (g) {
      if (!g.f.introDone) yield* intro(g);
    },
    drawBack(f, g, cx) {
      if (g.f.closetOpen) {
        drawSpr(f, cx, 'capgun', 250, 74);
        drawSpr(f, cx, 'mglove', 247, 88);
        drawSpr(f, cx, 'jar', 249, 112);
        drawSpr(f, cx, 'keyex', 226, 66);
      }
    },
    hot: [
      { id: 'edoor', name: 'Дверь на улицу', poly: [276, 32, 306, 23, 306, 170, 276, 142], walk: [284, 162], face: 'e',
        look: 'Наша входная дверь. За ней слышен гул пространственного разлома.',
        exit: function* (g) {
          g.sfx('door');
          yield* g.goRoom('street', { x: 286, y: 146, dir: 's' });
        } },
      { id: 'window', name: 'Окно на улицу', poly: [100, 30, 164, 28, 164, 96, 100, 98], walk: [134, 134], face: 'n',
        look: 'Сквозь стекло видно, как на асфальте кружится синий треугольный портал.',
        use: 'Окно заклинило. Придется выходить через нормальную дверь.' },
      Object.assign({ id: 'closet', poly: [224, 42, 260, 40, 260, 128, 224, 128], when: g => !g.f.closetOpen }, CLOSET),
      Object.assign({ id: 'closetin', rect: [220, 36, 50, 96], when: g => g.f.closetOpen }, CLOSET),
      { id: 'mrbear', name: 'Мистер Мишка', rect: [226, 44, 16, 22], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Плюшевый мишка из студии Майры и очки Реальности 2.0. Артефакты прошлых дел.',
        use: function* (g) { g.sfx('zap'); yield g.say('sam', 'Статическое электричество бьет по лапам.'); } },
      { id: 'preshead', name: 'Голова Линкольна', rect: [243, 46, 15, 20], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Каменная голова прошлого президента из дела о Вашингтоне. Живой Линкольн сейчас на улице.',
        use: 'Челюсть неподвижна. Политическая карьера окончена.' },
      { id: 'capgun', name: 'Пистолет с пистонами', rect: [250, 74, 9, 10], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Игрушечный пистолет Леонарда Стейкчармера. Пахнет старым шоу.',
        use: 'Щелк. Зрители безмолвствуют.' },
      { id: 'mglove', name: 'Боксерская перчатка', rect: [247, 88, 12, 14], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Перчатка мафии игрушек из подпольного казино. Пахнет фрикадельками.',
        use: 'Я надевал ее в прошлом году. Рука до сих пор помнит тот зуд.' },
      { id: 'jar', name: 'Банка с Хью Блиссом', rect: [249, 112, 11, 14], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Банка с переваренной лунной субстанцией Хью Блисса. Жидкость мирно спит на дне.',
        use: 'Крышка затянута намертво.' },
      { id: 'keyex', name: 'Ключ Меймтрона', rect: [226, 66, 20, 8], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Заводной ключ гигантского робота с Северного полюса. Наше прошлое дело закрыто.',
        use: 'Ключ тяжелый и железный.' },
      { id: 'leocloset', name: 'Вещи Леонарда', rect: [226, 76, 20, 36], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Колода крапленых карт и зеленый козырек Леонарда. Сам шулер сбежал сразу после Рождества.',
        use: 'Все тузы краплены ногтем по углам.' },
      { id: 'spatulacloset', name: 'Аквариум с Лопаткой', rect: [242, 66, 16, 18], when: g => g.f.closetOpen && g.f.spatulaCaptured, walk: [240, 136], face: 'n', over: true,
        look: 'Мистер Лопатка плавает в банке за решеткой из проволоки. Верховный жрец на пенсии.',
        use: 'Карась презрительно пускает пузырь.' },
      { id: 'desk', name: 'Стол Сэма', poly: [0, 156, 92, 150, 108, 158, 108, 200, 0, 200], walk: [118, 164], face: 'w',
        look: 'Мой стол. Под стеклом новая записка: Остерегайтесь углов и тропических фруктов.',
        use: 'Ящики полны старых счетов и нераспечатанных повесток.' },
      { id: 'phone', name: 'Телефон', rect: [44, 140, 26, 16], walk: [104, 150], face: 'w', over: true,
        look: 'Старый дисковый аппарат. По нему с нами говорит Комиссар.',
        use: 'Гудок чистый. Комиссар пока молчит, давая нам свободу действий.' },
      { id: 'cabinet', name: 'Картотека', poly: [40, 62, 90, 58, 90, 124, 41, 129], walk: [66, 136], face: 'n',
        look: 'Картотека дел. Папка номер 202 подписана: Остров Пасхи и бермудские неприятности.',
        use: 'Все подшито по алфавиту.' },
      { id: 'picture', name: 'Картина', rect: [43, 17, 39, 33], walk: [62, 136], face: 'n',
        look: 'Собаки за покером. У бульдога в лапе пять тузов.',
        use: 'Висит ровно.' },
      { id: 'hole', name: 'Нора в стене', rect: [203, 114, 16, 15], walk: [204, 138], face: 'n',
        look: 'Нора семейства Двузубиков. Пусто. Джимми и Мэри куда-то запропастились.',
        use: 'Внутри пахнет сыром и детской присыпкой.' }
    ]
  };

  E.epilogue = function* (g) {
    const max = g.actors.max;
    g.hideUI = true;
    g.f.epilogue = true;
    g.f.closetOpen = true;
    g.drop('spatula');
    yield* g.goRoom('office', { x: 236, y: 140, dir: 'n' });
    max.follow = 'sam';
    g.place('max', 'office', 204, 146, 'e');
    max.scripted = true;
    g.music('credits22');
    g.closeup = { kind: 'epilogue22', t0: g.time };
    yield g.fadeIn(2);
    yield 4.0;
    yield g.fadeOut(1.5);
    g.closeup = null;
    yield g.fadeIn(1.5);
    yield g.say('sam', 'Второе дело сезона закрыто. Вулкан спокоен, а Мистер Лопатка занял место на полке.');
    yield g.say('max', 'А Сибил и Линкольн так и остались на пляже строить песчаные замки!');
    yield g.say('sam', 'Они нашли друг друга среди лавы и пальм. Это романтично, Макс.');
    yield g.say('max', 'Это отвратительно! Сэм, пошли скорее искать дело, где что-нибудь взрывается!');
    yield g.say('sam', 'Оно само нас найдет. Телефон уже мигает.');
    max.scripted = false;
    g.hideUI = false;
    g.f.gameWon = true;
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
