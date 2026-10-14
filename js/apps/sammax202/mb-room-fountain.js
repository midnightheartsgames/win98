(function (S) {
  'use strict';
  const { C, COLORS, blit } = S;
  const E = S.EP202;
  const { ROOMS, TALK } = E;

  function drawSpr(f, cx, id, x, y, pose, scale) {
    const sp = S.sprite(id, pose || {}, scale || 1);
    if (sp) blit(f, sp.buf, Math.round(x - cx - sp.ox), Math.round(y - sp.oy));
  }

  TALK.bjimmy = {
    options: [
      { id: 'baby', icon: 'bjimmy22', text: 'Джимми, как тебе в памперсах?', run: function* (g) {
        yield g.say('bjimmy22', 'Агу-агу, начальник! Я по-прежнему держу этот район! Плати дань молоком или получишь погремушкой в глаз!');
        yield g.say('max', 'Какой восхитительно злобный младенец! Дай я подержу его за хвост!');
      } },
      { id: 'tea', icon: 'suntea22', text: 'Попробуй этот сорокалетний солнечный чай из закусочной.', when: g => g.has('suntea') && !g.f.rattleGot, run: function* (g) {
        g.drop('suntea');
        g.give('rattle');
        g.f.rattleGot = true;
        yield g.say('bjimmy22', 'Ого! Какая забористая кислятина! Настоящее пойло для матерых грызунов!');
        yield g.say('bjimmy22', 'Забирай погремушку, начальник! У меня теперь есть банка чая!');
      } },
      { id: 'bye', icon: 'bye', text: 'Не подавись соской, Джимми.', end: true }
    ]
  };

  TALK.mary = {
    options: [
      { id: 'husband', icon: 'mary22', text: 'Мэри, сочувствую твоей семейной драме.', run: function* (g) {
        yield g.say('mary22', 'Только мы воссоединились на Рождество, как он прыгнул в этот проклятый источник за монеткой! И вот результат. Теперь он требует сырную кашу каждые два часа!');
      } },
      { id: 'bye', icon: 'bye', text: 'Терпения тебе, Мэри.', end: true }
    ]
  };

  ROOMS.fountain = {
    id: 'fountain', name: 'Грот молодости',
    w: 320, h: 200, music: 'fountain22',
    paint: (b, g) => S.BG.fountain22(b, g),
    walk: [
      [30, 145, 290, 145, 290, 185, 30, 185]
    ],
    start: [50, 165],
    drawBack(f, g, cx) {
      drawSpr(f, cx, 'bjimmy22', 250, 160);
      drawSpr(f, cx, 'mary22', 275, 155);
    },
    hot: [
      { id: 'exit', name: 'Возврат на пляж', rect: [10, 80, 30, 90], walk: [40, 165], face: 'w',
        exit: function* (g) {
          yield* g.goRoom('beach', { x: 520, y: 160, dir: 'w' });
        } },
      { id: 'pool', name: 'Источник молодости', poly: [120, 130, 200, 130, 200, 170, 120, 170], walk: [160, 168], face: 'n',
        look: 'Кристально чистая вода искрится магическими переливами.',
        use: function* (g) {
          if (!g.has('youthwater')) {
            g.give('youthwater');
            yield g.say('sam', 'Набираю кружку искрящейся воды молодости.');
          } else {
            yield g.say('sam', 'У нас уже есть полная кружка. Лишний объем только расплескается по карманам.');
          }
        } },
      { id: 'jimmy', name: 'Малыш Джимми Двузубик', rect: [240, 135, 20, 30], walk: [225, 165], face: 'e',
        look: 'Крысиный авторитет, уменьшившийся до размеров пупса в пеленке.',
        talk: function* (g) { yield g.talkTo('bjimmy'); },
        items: {
          suntea: function* (g) {
            yield TALK.bjimmy.options.find(o => o.id === 'tea').run(g);
          }
        } },
      { id: 'mary', name: 'Мэри Двузубик', rect: [265, 120, 20, 45], walk: [245, 165], face: 'e',
        look: 'Уставшая супруга с ложкой детского питания наперевес.',
        talk: function* (g) { yield g.talkTo('mary'); } }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
