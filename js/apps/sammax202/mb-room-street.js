(function (S) {
  'use strict';
  const { C, blit } = S;
  const E = S.EP202;
  const { ROOMS, TALK } = E;

  function drawSpr(f, cx, id, x, y, pose, scale) {
    const sp = S.sprite(id, pose || {}, scale || 1);
    if (sp) blit(f, sp.buf, Math.round(x - cx - sp.ox), Math.round(y - sp.oy));
  }

  ROOMS.street = {
    id: 'street', name: 'Улица',
    w: 880, h: 200, music: 'street',
    scale: [138, 0.84, 166, 0.92],
    paint: (b, g) => S.BG.street22(b, g),
    walk: [
      [20, 144, 860, 144, 860, 185, 20, 185]
    ],
    start: [286, 146],
    drawBack(f, g, cx) {
      drawSpr(f, cx, 'portal22', 420, 140, { t: g.time });
    },
    hot: [
      { id: 'officedoor', name: 'Дверь в офис', poly: [270, 70, 302, 70, 302, 146, 270, 146], walk: [286, 146], face: 'n',
        look: 'Вход в наш офис вольнопрактикующих детективов.',
        exit: function* (g) {
          g.sfx('door');
          yield* g.goRoom('office', { x: 284, y: 162, dir: 'w' });
        } },
      { id: 'portal', name: 'Бермудский портал', poly: [390, 80, 450, 80, 450, 160, 390, 160], walk: [420, 154], face: 'n',
        look: 'Светящийся треугольник висит над асфальтом и пахнет морским бризом.',
        use: function* (g) {
          yield g.say('sam', 'Шагаем прямо в центр разлома.');
          yield g.talkTo('portalTrip');
        } },
      { id: 'sybildoor', name: 'Служба знакомств Сибил', poly: [610, 60, 650, 60, 650, 146, 610, 146], walk: [630, 146], face: 'n',
        look: 'Новая вывеска Сибил: Сертифицированный консультант по поиску второй половинки.',
        exit: function* (g) {
          g.sfx('door');
          yield* g.goRoom('sybil', { x: 60, y: 160, dir: 'e' });
        } },
      { id: 'boscodoor', name: 'Магазин Боско', poly: [306, 60, 340, 60, 340, 146, 306, 146], walk: [320, 146], face: 'n',
        look: 'Лавка Боско. Витрина обклеена слоями фольги.',
        exit: function* (g) {
          g.sfx('door');
          yield* g.goRoom('bosco', { x: 50, y: 160, dir: 'e' });
        } },
      { id: 'stinkydoor', name: 'Закусочная Вонючки', poly: [760, 60, 800, 60, 800, 146, 760, 146], walk: [780, 146], face: 'n',
        look: 'Закусочная юной Вонючки. На двери надпись: Экзотическая кухня южных морей.',
        exit: function* (g) {
          g.sfx('door');
          yield* g.goRoom('stinky', { x: 50, y: 160, dir: 'e' });
        } },
      { id: 'desoto', name: 'Де Сото', poly: [120, 130, 220, 130, 230, 180, 110, 180], walk: [170, 160], face: 's',
        look: 'Наш верный полицейский крейсер Де Сото 1960 года выпуска.',
        use: function* (g) {
          yield g.say('sam', 'Машина припаркована отлично. По городу сейчас лучше ходить пешком.');
        } }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
