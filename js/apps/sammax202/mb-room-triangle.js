(function (S) {
  'use strict';
  const { C, COLORS, blit } = S;
  const E = S.EP202;
  const { ROOMS, TALK } = E;

  function drawSpr(f, cx, id, x, y, pose, scale) {
    const sp = S.sprite(id, pose || {}, scale || 1);
    if (sp) blit(f, sp.buf, Math.round(x - cx - sp.ox), Math.round(y - sp.oy));
  }

  TALK.pedro = {
    options: [
      { id: 'song', icon: 'pedro22', text: 'Педро, почему вы играете посреди пустоты?', run: function* (g) {
        yield g.say('pedro22', 'Ола, сеньорес! Мы застряли в Бермудском треугольнике в 1974 году! С тех пор каждый день наш день рождения!');
        yield g.say('max', 'Каждый день торт и битье пиньяты?! Я остаюсь здесь навсегда!');
      } },
      { id: 'rattle', icon: 'rattle22', text: 'Взгляни на эту золотую погремушку с острова Пасхи.', when: g => g.has('rattle') && !g.f.pedroDone, run: function* (g) {
        g.drop('rattle');
        g.give('pedrokey');
        g.f.pedroDone = true;
        g.f.volcanoReady = true;
        g.f.volcanoKnown = true;
        yield g.say('pedro22', 'Святая Мария! Эта жемчужина внутри звенит на идеальной ноте Фа-диез треугольного пространства!');
        yield g.say('pedro22', 'Возьмите наш священный трезвучный камертон! С ним вы сможете открыть проход в жерло вулкана и обуздать пламя!');
      } },
      { id: 'bye', icon: 'bye', text: 'Продолжайте концерт, маэстро.', end: true }
    ]
  };

  ROOMS.triangle = {
    id: 'triangle', name: 'Бермудский треугольник',
    w: 320, h: 200, music: 'triangle22',
    paint: (b, g) => S.BG.triangle22(b, g),
    walk: [
      [40, 145, 280, 145, 280, 185, 40, 185]
    ],
    start: [160, 168],
    drawBack(f, g, cx) {
      drawSpr(f, cx, 'portal22', 80, 145, { t: g.time });
      drawSpr(f, cx, 'pedro22', 160, 145);
    },
    hot: [
      { id: 'portal', name: 'Бермудский портал', poly: [50, 85, 110, 85, 110, 165, 50, 165], walk: [80, 160], face: 'n',
        look: 'Выход из аномальной зоны в реальный мир.',
        use: function* (g) {
          yield g.say('sam', 'Возвращаемся через портал.');
          yield g.talkTo('portalTrip');
        } },
      { id: 'pedro', name: 'Педро Мариачи', rect: [140, 75, 40, 75], walk: [180, 160], face: 'w',
        look: 'Музыкант в широком сомбреро играет праздничные рулады на трубе.',
        talk: function* (g) { yield g.talkTo('pedro'); },
        items: {
          rattle: function* (g) {
            yield TALK.pedro.options.find(o => o.id === 'rattle').run(g);
          }
        } },
      { id: 'plane', name: 'Парящий самолет', poly: [40, 40, 110, 40, 110, 90, 40, 90], walk: [100, 155], face: 'n',
        look: 'Двухмоторный гидроплан 1945 года завис в невесомости между временными слоями.',
        use: 'Он парит слишком высоко над нашей платформой.' }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
