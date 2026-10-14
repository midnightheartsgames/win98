(function (S) {
  'use strict';
  const { C, COLORS, blit } = S;
  const E = S.EP202;
  const { ROOMS, TALK } = E;

  function drawSpr(f, cx, id, x, y, pose, scale) {
    const sp = S.sprite(id, pose || {}, scale || 1);
    if (sp) blit(f, sp.buf, Math.round(x - cx - sp.ox), Math.round(y - sp.oy));
  }

  TALK.spatula = {
    options: [
      { id: 'master', icon: 'spatula22', text: 'Мистер Лопатка, сдавайтесь. Ваши водные фокусы окончены.', run: function* (g) {
        g.sfx('bubbles');
        yield g.say('spatula22', 'Буль-буль! Глупцы! Я повелеваю огнем этой горы! Лава очистит мир от кулеров и сухопутных детективов!');
        yield g.say('max', 'Он разговаривает пузырями ненависти! Сэм, давай сварим уху!');
      } },
      { id: 'divert', icon: 'seismic22', text: 'Посмотрим, как ты справишься с сейсмической волной.', when: g => g.has('seismic') && !g.f.lavaDiverted, run: function* (g) {
        yield* E.divertLava(g);
      } },
      { id: 'capture', icon: 'spatula22', text: 'Взять верховного жреца под стражу!', when: g => g.f.lavaDiverted && !g.f.spatulaCaptured, run: function* (g) {
        yield* E.defeatSpatula(g);
      } },
      { id: 'bye', icon: 'bye', text: 'Мы еще вернемся за тобой, рыба.', end: true }
    ]
  };

  ROOMS.volcano = {
    id: 'volcano', name: 'Вулкан Беллависта',
    w: 520, h: 200, music: 'volcano22',
    scale: [150, 0.9, 185, 1.05],
    paint: (b, g) => S.BG.volcano22(b, g),
    walk: [
      [30, 150, 490, 150, 490, 185, 30, 185]
    ],
    start: [80, 166],
    drawBack(f, g, cx) {
      if (!g.f.spatulaCaptured) drawSpr(f, cx, 'spatula22', 260, 105, { t: g.time });
      drawSpr(f, cx, 'portal22', 420, 140, { t: g.time });
    },
    hot: [
      { id: 'exit', name: 'Спуск на пляж', rect: [10, 80, 40, 90], walk: [50, 166], face: 'w',
        exit: function* (g) {
          yield* g.goRoom('beach', { x: 580, y: 160, dir: 'w' });
        } },
      { id: 'portal', name: 'Бермудский портал', poly: [390, 80, 450, 80, 450, 165, 390, 165], walk: [420, 160], face: 'n',
        look: 'Портал висит над дымящимся базальтом.',
        use: function* (g) {
          yield g.say('sam', 'Шагаем в разлом.');
          yield g.talkTo('portalTrip');
        } },
      { id: 'altar', name: 'Алтарь верховного жреца', poly: [230, 80, 290, 80, 290, 140, 230, 140], walk: [260, 160], face: 'n',
        look: g => g.f.spatulaCaptured ? 'Опустевший каменный постамент.' : 'На вершине алтаря в золотом куполе восседает Мистер Лопатка, повелевающий извержением.',
        talk: function* (g) { yield g.talkTo('spatula'); },
        use: function* (g) {
          if (!g.f.lavaDiverted && g.has('seismic')) yield* E.divertLava(g);
          else if (g.f.lavaDiverted && !g.f.spatulaCaptured) yield* E.defeatSpatula(g);
          else yield g.say('sam', 'Алтарь раскален докрасна.');
        },
        items: {
          seismic: function* (g) {
            if (!g.f.lavaDiverted) yield* E.divertLava(g);
          }
        } },
      { id: 'lava', name: 'Поток магмы', poly: [140, 130, 380, 130, 380, 180, 140, 180], walk: [200, 166], face: 'n',
        look: g => g.f.lavaDiverted ? 'Остывающее базальтовое русло. Лава ушла через разлом.' : 'Кипящая огненная река бурлит и грозит перехлестнуть через край.',
        use: 'Трогать лаву лапами не стоит даже ради науки.' }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
