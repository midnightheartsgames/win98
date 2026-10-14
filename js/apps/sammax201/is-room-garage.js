(function (S) {
  'use strict';
  const E = S.EP201;
  const { ROOMS, TALK } = E;

  E.raceWon = function* (g) {
    g.f.deathGot = true;
    g.give('death');
    yield g.say('curt', 'Двадцать точка. Новый рекорд точка. Всадник ваш запятая забирайте с капота виртуальной машины точка.');
    yield g.say('chippy', 'Пип-пип!');
    yield g.say('bluster', 'ДВАДЦАТЬ КУКОЛ! МЫ ЗАПИШЕМ ЭТО НА ДИСКЕТУ! НА ДВЕ ДИСКЕТЫ!');
    yield g.say('sam', 'Всадник Смерти снят с капота машины, которой нет. На ощупь он настоящий.');
  };

  TALK.cops = {
    start: function* (g) {
      if (g.seen.copsHello) return;
      g.seen.copsHello = 1;
      yield g.say('bob', 'Вы позвонили в гараж К.О.П.С. Для тюнинга нажмите один. Для реальности нажмите два. Чтобы поговорить с Бластером, просто подождите.');
      yield g.say('bluster', 'ЗДРАВСТВУЙТЕ!');
    },
    options: [
      { id: 'moon', icon: 'f:cops21', text: 'Вы же переехали на Луну?', run: function* (g) {
        yield g.say('curt', 'Переехали запятая пока там не кончились розетки точка. Вернулись двоеточие тюнинг и дополненная реальность восклицательный знак.');
      } },
      { id: 'tuning', icon: 'car21', text: 'Что такое тюнинг?', run: function* (g) {
        yield g.say('bluster', 'МЫ ДЕЛАЕМ ИЗ МАШИН ШЕДЕВРЫ! ВЧЕРА К НАМ ЗАЕХАЛ ГРУЗОВИК, А УЕХАЛА ДИСКОТЕКА!');
        yield g.say('bob', 'Грузовик пока не вернулся. Оставайтесь на линии.');
      } },
      { id: 'trophy', icon: 'death21', text: 'Что за всадник на верстаке?', when: g => !g.f.deathGot, run: function* (g) {
        yield g.say('curt', 'Приз точка. Пришёл в коробке от Санты запятая адресован клубу точка. Отдадим тому запятая кто побьёт рекорд нашей игры точка.');
        yield g.say('chippy', 'Пип.');
      } },
      { id: 'game', icon: 'elmer21', text: 'Что за игра?', run: function* (g) {
        yield g.say('bluster', 'ДОПОЛНЕННАЯ РЕАЛЬНОСТЬ! ПРОЕКТОР РИСУЕТ ПАРКОВКУ! ПО ПАРКОВКЕ БЕГАЮТ КУКЛЫ «ЗАМУЧАЙ-МЕНЯ ЭЛМЕР»! ТЫ ИХ ДАВИШЬ!');
        yield g.say('bob', 'Рекорд: девятнадцать кукол за минуту. Чтобы побить рекорд, наберите двадцать.');
        yield g.say('curt', 'Машина едет сама запятая руль следует за указателем мыши точка.');
      } },
      { id: 'play', icon: 'flag21', text: 'Давайте сыграем.', when: g => !g.f.deathGot, say: true, end: true, run: function* (g) {
        g.endDialog();
        yield g.say('bluster', 'ВКЛЮЧАЮ ПРОЕКТОР! ВСЕ В РЕАЛЬНОСТЬ!');
        yield* E.startRace(g);
      } },
      { id: 'again', icon: 'again21', text: 'Ещё заезд, для удовольствия.', when: g => g.f.deathGot, say: true, end: true, run: function* (g) {
        g.endDialog();
        yield* E.startRace(g);
      } },
      { id: 'bye', icon: 'bye', text: 'До связи, клуб.', end: true, run: function* (g) { yield g.say('bob', 'Спасибо за звонок. Ваш визит очень важен для нас.'); } }
    ]
  };

  const COP = (name, look) => ({
    name, walk: [140, 170], face: 'n', look,
    talk: function* (g) { yield g.talkTo('cops'); },
    use: 'Трогать железо клуба без спроса не принято. Чиппи паяет обиды.',
    items: {
      gun: function* (g) { yield g.say('bluster', 'НЕ СТРЕЛЯЙ! У НАС ВСЕ ДАННЫЕ НА ОДНОЙ ДИСКЕТЕ!'); },
      death: function* (g) { yield g.say('curt', 'Приз ваш точка. Возврату не подлежит точка.'); },
      max: function* (g) { yield g.say('max', 'Сделайте мне тюнинг! Хочу фары и кнопку «ракета»!'); yield g.say('bob', 'Президентский тюнинг: нажмите звёздочку.'); },
      '*': function* (g) { yield g.say('chippy', 'Пип?'); }
    }
  });

  ROOMS.garage = {
    id: 'garage', name: 'Гараж К.О.П.С.', w: 320, music: 'garage21',
    paint: b => S.BG.garage21(b),
    walk: [[8, 146, 312, 146, 312, 198, 8, 198]],
    layers: [
      { id: 'tires', x: 40, y: 116, base: 147 },
      { id: 'bench', x: 228, y: 70, base: 148, key: g => (g.f.deathGot ? 'e' : '') },
      { id: 'projector', x: 186, y: 100, base: 170, key: g => Math.floor(g.time * 3) % 2 }
    ],
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [2, 40, 34, 90], walk: [30, 172], face: 'w',
        look: 'Ворота гаража. За ними улица и снег.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street', { x: 70, y: 146, dir: 's' }); } },
      { id: 'bench', name: 'Верстак', rect: [232, 92, 84, 22], walk: [270, 160], face: 'n',
        look: g => g.f.deathGot ? 'Верстак. Паяльник, дискеты, пустое место от всадника.' : 'Верстак. На нём паяльник, дискеты и Всадник Смерти с косой. Табличка: «Приз за рекорд».',
        use: function* (g) {
          if (g.f.deathGot) { yield g.say('sam', 'На верстаке больше нечего брать. Паяльник горячий.'); return; }
          yield g.say('curt', 'Руки прочь от приза точка. Его можно только выиграть точка.');
        } },
      { id: 'screen', name: 'Экран', rect: [60, 18, 120, 70], walk: [120, 150], face: 'n',
        look: '«Дополненная реальность». На экране мигают зелёные точки. Каждая точка, говорят, кукла.' },
      { id: 'record', name: 'Табло', rect: [200, 20, 100, 36], walk: [250, 152], face: 'n',
        look: g => g.f.deathGot ? 'Табло. «Рекорд: 20 кукол». Под рекордом нацарапано: «Пёс в шляпе».' : 'Табло. «Тюнинг. Рекорд: 19 кукол». Девятнадцать набрал Бластер. Говорят, он ещё неделю извинялся.' },
      { id: 'projector', name: 'Проектор', rect: [192, 110, 32, 24], walk: [206, 160], face: 'n',
        look: 'Проектор на треноге. Из него выходит реальность, слегка дополненная.',
        use: function* (g) { yield g.say('bob', 'Чтобы включить проектор, поговорите с оператором.'); } },
      { id: 'tires', name: 'Покрышки', rect: [40, 116, 40, 30], walk: [62, 152], face: 'n', look: 'Покрышки, стопкой. С зимней резиной клуб не шутит.' }
    ],
    actors: {
      curt: COP('Курт 286', 'Курт 286. Самый старый в клубе. Говорит знаками препинания, как телеграф.'),
      bob: COP('Боб Белл', 'Боб Белл. Бывший телефонный автомат. Всё, что он говорит, звучит как меню.'),
      bluster: COP('Бластер-Бахвал', 'Бластер-Бахвал. Самый громкий. Говорят, у него сломана громкость и починить её никто не решается.'),
      chippy: COP('Чиппи', 'Чиппи. Самый маленький. Говорит «пип», и все понимают.')
    },
    setup(g) {
      g.place('curt', 'garage', 92, 156, 'e');
      g.place('bob', 'garage', 132, 154, 's');
      g.place('bluster', 'garage', 166, 160, 's');
      g.place('chippy', 'garage', 266, 158, 'w');
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
