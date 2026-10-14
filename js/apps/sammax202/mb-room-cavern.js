(function (S) {
  'use strict';
  const { C, COLORS, blit } = S;
  const E = S.EP202;
  const { ROOMS } = E;

  function drawSpr(f, cx, id, x, y, pose, scale) {
    const sp = S.sprite(id, pose || {}, scale || 1);
    if (sp) blit(f, sp.buf, Math.round(x - cx - sp.ox), Math.round(y - sp.oy));
  }

  ROOMS.cavern = {
    id: 'cavern', name: 'Подземелье',
    w: 320, h: 200, music: 'cavern22',
    paint: (b, g) => S.BG.cavern22(b, g),
    walk: [
      [30, 145, 290, 145, 290, 185, 30, 185]
    ],
    start: [260, 165],
    drawBack(f, g, cx) {
      drawSpr(f, cx, 'moai_feet', 80, 155);
    },
    hot: [
      { id: 'exit', name: 'Лестница на пляж', rect: [280, 80, 30, 90], walk: [270, 165], face: 'e',
        exit: function* (g) {
          yield* g.goRoom('beach', { x: 40, y: 160, dir: 'e' });
        } },
      { id: 'tunnel', name: 'Туннель к жерлу', rect: [130, 40, 60, 60], walk: [160, 150], face: 'n',
        exit: function* (g) {
          yield* g.goRoom('volcano', { x: 80, y: 166, dir: 'e' });
        } },
      { id: 'feet', name: 'Каменные ступни истукана', poly: [40, 120, 120, 120, 120, 170, 40, 170], walk: [140, 165], face: 'w',
        look: 'Колоссальные каменные ноги уходят в базальтовый свод. Судя по форме пальцев, это ноги хохотуна Билли.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.5);
          g.sfx('scrape');
          g.fx.shake = 0.6;
          g.f.tickleDone = true;
          yield g.say('sam', 'Провожу пальцем по каменной пятке. Сверху по острову прокатывается панический вопль.');
          yield g.say('max', 'Камни боятся щекотки! Какая потрясающая анатомическая уязвимость!');
        } }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
