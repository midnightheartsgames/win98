(function (S) {
  'use strict';
  const { C, COLORS, blit } = S;
  const E = S.EP202;
  const { ROOMS, TALK } = E;

  function drawSpr(f, cx, id, x, y, pose, scale) {
    const sp = S.sprite(id, pose || {}, scale || 1);
    if (sp) blit(f, sp.buf, Math.round(x - cx - sp.ox), Math.round(y - sp.oy));
  }

  TALK.bosco = {
    options: [
      { id: 'suit', icon: 'bosco22', text: 'Боско, что за костюм?', run: function* (g) {
        yield g.say('bosco22', 'Ш-ш-ш! Говори тише! Они настроили треугольную частоту! Любой предмет с тремя углами ретранслирует мои мысли прямо в Бермудский штаб!');
        yield g.say('max', 'Даже долька пиццы?!');
        yield g.say('bosco22', 'Пицца опаснее всего! Я питаюсь только круглыми бубликами!');
      } },
      { id: 'gadget', icon: 'seismic22', text: 'Что это за прибор у тебя на прилавке?', run: function* (g) {
        yield g.say('bosco22', 'Это Сейсмический инвертор частот. Он способен сдвинуть тектоническую плиту или изменить вектор пространственного разлома.');
        yield g.say('sam', 'Сколько ты за него хочешь?');
        yield g.say('bosco22', 'Деньги сейчас бесполезны. Мне нужен экранирующий минерал. Что-то твердое как гранит и древнее как лава!');
      } },
      { id: 'trade', icon: 'sandwich22', text: 'У нас есть гранитный сэндвич из закусочной Вонючки.', when: g => g.has('sandwich') && !g.f.seismicGot, run: function* (g) {
        g.drop('sandwich');
        g.give('seismic');
        g.f.seismicGot = true;
        yield g.say('bosco22', 'Боже правый! Чистейшая вулканическая пемза под слоем базальтовой корки! Ни один треугольный луч не пробьет эту диету!');
        yield g.say('bosco22', 'Забирайте инвертор! И помните: я вас никогда не видел!');
      } },
      { id: 'bye', icon: 'bye', text: 'Оставайся начеку, Боско.', end: true }
    ]
  };

  ROOMS.bosco = {
    id: 'bosco', name: 'Магазин Боско',
    w: 320, h: 200, music: 'bosco',
    paint: (b, g) => S.BG.bosco22(b, g),
    walk: [
      [30, 140, 290, 140, 290, 180, 30, 180]
    ],
    start: [50, 160],
    drawBack(f, g, cx) {
      drawSpr(f, cx, 'bosco22', 210, 130);
    },
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [10, 60, 30, 110], walk: [40, 160], face: 'w',
        exit: function* (g) {
          g.sfx('door');
          yield* g.goRoom('street', { x: 320, y: 154, dir: 's' });
        } },
      { id: 'bosco', name: 'Боско в шлеме', rect: [190, 60, 40, 80], walk: [170, 150], face: 'e',
        look: 'Боско облачился в антирадиационный скафандр с антенной заземления.',
        talk: function* (g) { yield g.talkTo('bosco'); },
        items: {
          sandwich: function* (g) {
            yield TALK.bosco.options.find(o => o.id === 'trade').run(g);
          }
        } },
      { id: 'shelves', name: 'Полки магазина', rect: [10, 20, 100, 70], walk: [80, 145], face: 'n',
        look: 'Все товары треугольной формы с полок демонстративно выброшены.',
        use: 'Тут остались только консервные банки и круглый сыр.' }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
