(function (S, B) {
  'use strict';
  const C = B.C;
  const E = B.EP1;
  const G = B.grey;
  const { ROOMS, TALK, LAYERS } = E;
  const { card, play, Fuel } = B.games;

  E.checkBoth = function* (g) {
    if (!g.f.hoochSent || !g.f.served || g.f.chapter >= 6) return;
    E.setChapter(g, 6);
    yield* card(g, '13 июня 1931, вечер', ['Особняк Браунов. Наверху собирается общество трезвости, внизу Эмметт разжигает аппарат для топлива.']);
    g.place('emmett', 'brownlab', 360, 380, 'w');
    yield* g.goRoom('brownlab', { x: 220, y: 400, dir: 'e' });
  };

  LAYERS.brownlab = { drill: () => G.layer(100, 30, B.BG31.paintDrill) };

  ROOMS.brownlab = {
    id: 'brownlab', name: 'Мастерская Эмметта', w: 640, music: 'bt_lab31',
    scale: [310, 0.9, 470, 1],
    paint: b => B.BG31.paintLab31(b),
    layers: [{ id: 'drill', x: 120, y: 206, base: 300, when: g => !g.has('drill') && !g.f.night }],
    walk: [[20, 310, 620, 310, 632, 472, 8, 472]],
    hot: [
      { id: 'machine', name: 'Аппарат', rect: [260, 160, 120, 140], walk: [320, 340], face: 'n', look: 'Котёл, мехи, газовый пузырь, аквариум с бактериями и колесо генератора. Всё соединено трубками.', use: function* (g) {
        if (g.has('drill')) { yield g.say('marty', 'Топливо готово. Бур у меня.'); return; }
        yield* fuel(g);
      } },
      { id: 'board', name: 'Доска', rect: [60, 90, 160, 90], walk: [140, 340], face: 'n', look: 'Формулы, чертежи бура и задача Иванова, обведённая три раза.' },
      { id: 'plans', name: 'Чертежи', rect: [420, 120, 160, 70], walk: [500, 340], face: 'n', look: 'Синие чертежи ракетного бура. В углу журнал «Современные изобретения».' },
      { id: 'stairs', name: 'Лестница наверх', rect: [560, 60, 60, 240], walk: [590, 330], face: 'n', look: 'Наверху общество трезвости. Слышно, как звенят чашки.', use: 'Наверху судья и двадцать трезвых дам. Нет уж.' }
    ],
    actors: {
      emmett: { name: 'Эмметт', dist: 44, look: 'Эмметт в фартуке поверх жилета. Глаза горят.', talk: function* (g) { if (g.has('drill')) yield g.say('emmett', 'Газ на восьми. Не забудьте.'); else yield* fuel(g); } }
    },
    enter: function* (g) {
      if (!g.f.labBrief) {
        g.f.labBrief = true;
        yield g.say('marty', 'Ты уверен, что это сработает, Эмметт?');
        yield g.say('emmett', 'Поздно, реакция уже пошла! Мехи для огня, клапан для давления, корм для бактерий и колесо для тока. Я буду подсказывать, что когда.');
        yield E.voice(g, 'judge', 'ЭММЕТТ! Что за дамы с плакатами в моей гостиной?!', 590, 80);
        yield g.say('emmett', 'Это отец. Не обращайте на него внимания. Слушайте только меня!');
        yield* fuel(g);
      }
    }
  };

  function* fuel(g) {
    g.events.push({ t: 'autosave' });
    yield null;
    const r = yield* play(g, new Fuel(g.rng));
    if (!r) return;
    g.f.fuel = true;
    g.f.fuelClean = r.clean;
    yield g.say('emmett', r.clean ? 'Ни одной ошибки! Отец бы так не смог. Да он и не пробовал.' : 'Получилось! Пару раз погасло, но получилось!');
    yield E.voice(g, 'judge', 'Эмметт, мы ещё не договорили!', 590, 80);
    yield g.say('emmett', 'Договорили, отец. Я больше не клерк. Я учёный.');
    yield g.talkTo('patent');
  }

  TALK.patent = { portrait: 'emmett', start: function* (g) { yield g.say('emmett', 'Когда мне ждать ответа из патентного бюро?'); }, options: [
    { id: 'soon', text: 'Месяц, может, полтора...', end: true, run: confess },
    { id: 'truth', text: 'Эмметт, я должен кое-что сказать.', end: true, run: confess }
  ] };

  function* confess(g) {
    yield g.say('marty', 'Я не из патентного бюро. Бур нужен, чтобы спасти друга. Прости.');
    yield g.say('emmett', 'Не из бюро...');
    yield g.say('marty', 'Но ты станешь великим изобретателем. Это я знаю точно.');
    yield g.say('emmett', 'Берите. Только верните. И газ держите примерно на восьми.');
    g.give('drill');
    g.f.night = true;
    yield* card(g, '13 июня 1931, ночь', ['Площадь суда. Фонари, тишина, полицейский участок.']);
    yield* g.goRoom('square', { x: 200, y: 420, dir: 'w' });
  }

  LAYERS.wagonb = {
    body: g => G.layer(640, 420, b => B.BG31.paintWagonBack(b, { open: g.f.doorsOpen, lock: !g.f.doorsOpen, kidGun: g.f.doorsOpen && !g.f.gunDown, gunFloor: g.f.gunDown && !g.has('gun') && !g.f.docFree, free: g.f.docFree }))
  };
  LAYERS.wagonr = { body: g => G.layer(640, 420, b => B.BG31.paintWagonSide(b, false, { antenna: !g.has('antenna') && !g.f.keysGot, box: !g.has('iron') && !g.f.hubcapGot })) };
  LAYERS.wagonl = { body: g => G.layer(640, 420, b => B.BG31.paintWagonSide(b, true, { keys: !g.f.keysGot, hubcap: !g.f.hubcapGot })) };
  const WAGON_KEY = {
    b: g => [g.f.doorsOpen, g.f.gunDown, g.has('gun'), g.f.docFree].map(v => v ? 1 : 0).join(''),
    r: g => [g.has('antenna'), g.f.keysGot, g.has('iron'), g.f.hubcapGot].map(v => v ? 1 : 0).join(''),
    l: g => [g.f.keysGot, g.f.hubcapGot].map(v => v ? 1 : 0).join('')
  };

  const ARROWS = { b: [['wagonr', 'Правый борт', 'e'], ['wagonl', 'Левый борт', 'w']], r: [['wagonb', 'К задним дверям', 'w']], l: [['wagonb', 'К задним дверям', 'e']] };

  function exits(side) {
    return ARROWS[side].map(([to, name, dir]) => ({ id: 'go' + to, name, rect: dir === 'e' ? [600, 330, 40, 140] : [0, 330, 40, 140], walk: null, exitDir: dir, exit: { room: to, x: 320, y: 420, dir: 'n' }, look: name + '.' }));
  }

  function wagonRoom(side, name, hot, extra) {
    return Object.assign({
      id: 'wagon' + side, name, w: 640, music: 'bt_wagon', noSave: true,
      scale: [330, 1, 470, 1],
      paint: B.BG31.paintNight,
      drawBack: (f, g) => B.BG31.road(f, g, side),
      layers: [{ id: 'body', x: 0, y: B.BG31.WY, base: -500, key: WAGON_KEY[side] }],
      walk: [[260, 400, 380, 400, 380, 440, 260, 440]],
      hot: exits(side).concat(hot)
    }, extra || {});
  }

  ROOMS.wagonb = wagonRoom('b', 'Фургон: задние двери', [
    { id: 'window', name: 'Окно Дока', rect: [250, 100, 140, 60], walk: null, look: g => g.f.docFree ? 'Док свободен и держится за поручень.' : 'За решёткой Док в кандалах.', act: 'talk', talk: function* (g) { yield g.talkTo('docWagon'); } },
    { id: 'lock', name: 'Замок', rect: [300, 200, 40, 30], when: g => !g.f.doorsOpen, walk: null, look: 'Висячий замок на задних дверях.', use: 'Без ключа не открыть.', items: { keys: function* (g) {
      g.drop('keys');
      g.f.doorsOpen = true;
      g.sfx('click');
      yield g.say('marty', 'Открыто!');
      yield E.voice(g, 'kid', 'Ах ты, заморыш! Получай!', 320, 120);
      g.sfx('gun');
      yield g.say('marty', 'Он стреляет через окошко кабины!');
    }, iron: 'Монтировкой замок не сбить на ходу.' } },
    { id: 'kidgun', name: 'Кид с пистолетом', rect: [280, 120, 80, 40], when: g => g.f.doorsOpen && !g.f.gunDown, walk: null, look: 'Кид целится через окошко между кабиной и кузовом.', items: { hubcap: function* (g) {
      g.drop('hubcap');
      g.f.gunDown = true;
      yield g.say('kid', 'Ой! Моя рука!');
      yield g.say('marty', 'Пистолет упал в кузов.');
    }, iron: 'Монтировку не добросить.' } },
    { id: 'gun', name: 'Пистолет', rect: [214, 366, 42, 24], when: g => g.f.gunDown && !g.has('gun') && !g.f.docFree, walk: null, look: 'Револьвер Кида лежит на полу кузова.', use: function* (g) { g.give('gun'); yield g.say('marty', 'Есть.'); } },
    { id: 'chains', name: 'Кандалы Дока', rect: [260, 240, 120, 40], when: g => g.f.doorsOpen && !g.f.docFree, walk: null, look: 'Цепь от кандалов Дока прикована к скобе.', items: { gun: function* (g) {
      g.drop('gun');
      g.sfx('gun');
      g.f.docFree = true;
      yield g.say('doc', 'Свободен! Марти, ты гений!');
    } } }
  ]);

  ROOMS.wagonr = wagonRoom('r', 'Фургон: правый борт', [
    { id: 'box', name: 'Ящик с инструментами', rect: [360, 262, 80, 48], when: g => !g.has('iron') && !g.f.hubcapGot, walk: null, look: 'Ящик под пассажирской дверью.', use: function* (g) { g.give('iron'); yield g.say('marty', 'Монтировка.'); } },
    { id: 'antenna', name: 'Антенна', rect: [186, 24, 24, 60], when: g => !g.has('antenna') && !g.f.keysGot, walk: null, look: 'Антенна на крыше. Длинная и гибкая.', use: function* (g) { g.give('antenna'); yield g.say('marty', 'Прощай, радио.'); } }
  ]);

  ROOMS.wagonl = wagonRoom('l', 'Фургон: левый борт', [
    { id: 'spare', name: 'Запасное колесо', rect: [294, 254, 92, 92], walk: null, look: g => g.f.hubcapGot ? 'Колесо без колпака.' : 'Запаска с блестящим колпаком.', use: 'Колпак держится крепко. Пальцами не подцепить.', items: { iron: function* (g) {
      if (g.f.hubcapGot) return;
      g.f.hubcapGot = true;
      g.give('hubcap');
      yield g.say('marty', 'Блестит. Сгодится.');
    } } },
    { id: 'cab', name: 'Окно водителя', rect: [76, 110, 140, 72], walk: null, look: function* (g) {
      yield g.say('marty', g.f.keysGot ? 'Кид рулит и ругается.' : 'За рулём Кид. Ключи на приборной доске.');
    }, items: { antenna: function* (g) {
      if (g.f.keysGot) return;
      if (!g.f.distract) { yield g.say('marty', 'Не дотягиваюсь. И Кид косится в зеркало.'); yield g.say('kid', 'Кто там шуршит?!'); return; }
      g.f.keysGot = true;
      g.give('keys');
      yield g.say('marty', 'Попались, голубчики.');
    } } }
  ]);

  TALK.docWagon = { portrait: 'doc', options: [
    { id: 'distract', text: 'Отвлеки его!', when: g => !g.f.distract, run: function* (g) {
      yield g.say('doc', 'Мистер Таннен! У вас на шляпе... паук! Огромный!');
      yield E.voice(g, 'kid', 'Где?! Убери его!', 320, 120);
      g.f.distract = true;
      yield g.say('doc', 'Кажется, ключи на доске съехали к окну.');
    } },
    { id: 'hold', text: 'Держись, Док!', when: g => !g.f.docFree, run: function* (g) { yield g.say('doc', 'Держусь, Марти! Мне больше ничего и не остаётся!'); } },
    { id: 'throttle', text: 'Газу!', when: g => g.f.docFree, end: true, run: ending },
    { id: 'bye', text: 'Сейчас что-нибудь придумаю.', end: true }
  ] };

  function* ending(g) {
    yield g.say('doc', 'Полный вперёд!');
    yield* B.cine.play(g, B.cine.manure());
    g.f.ending = true;
    yield* B.cine.play(g, B.cine.finale());
    g.ended = true;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
