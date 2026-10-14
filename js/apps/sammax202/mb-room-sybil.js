(function (S) {
  'use strict';
  const { C, COLORS, blit } = S;
  const E = S.EP202;
  const { ROOMS, TALK } = E;

  function drawSpr(f, cx, id, x, y, pose, scale) {
    const sp = S.sprite(id, pose || {}, scale || 1);
    if (sp) blit(f, sp.buf, Math.round(x - cx - sp.ox), Math.round(y - sp.oy));
  }

  TALK.sybil = {
    options: [
      { id: 'job', icon: 'sybil22', text: 'Сибил, ты теперь сваха?', run: function* (g) {
        yield g.say('sybil22', 'Я дипломированный консультант по матримониальной совместимости, Сэм. Анализирую биоритмы и психологические анкеты.');
        yield g.say('max', 'А можно мне анкету? Я ищу кого-нибудь огнеупорного!');
        yield g.say('sybil22', 'В моей базе таких пока нет.');
      } },
      { id: 'lincoln', icon: 'lincoln22', text: 'Как продвигаются успехи с Авраамом?', run: function* (g) {
        yield g.say('sybil22', 'Он зачитывает мне Геттисбергскую речь в стихах и предлагает объединить наши союзы. Это мило, но ему не хватает тропической страсти.');
      } },
      { id: 'bye', icon: 'bye', text: 'Не будем мешать амурным делам.', end: true }
    ]
  };

  TALK.lincoln = {
    options: [
      { id: 'love', icon: 'lincoln22', text: 'Господин президент, как ваше сердце?', run: function* (g) {
        yield g.say('lincoln22', 'Сэм, моя душа пылает ярче факелов свободы. Я жажду подарить этой прекрасной даме незабываемый жест.');
        yield g.say('sam', 'Женщины любят экзотические цветы. Особенно сорванные на краю действующего вулкана.');
        yield g.say('lincoln22', 'Если бы у меня был такой цветок, наш союз был бы нерушим.');
      } },
      { id: 'flower', icon: 'flower22', text: 'Вот тропический гибискус с острова Пасхи.', when: g => g.has('flower'), run: function* (g) {
        g.drop('flower');
        yield g.say('lincoln22', 'Боже мой. Какая пылкая расцветка.');
        yield g.say('lincoln22', 'Сибил! Прими сей дар с далеких полинезийских берегов как символ моих вечных чувств!');
        yield g.say('sybil22', 'Авраам! Это великолепно! Мы немедленно отправляемся на свидание на этот пляж!');
        g.f.lincolnDate = true;
        yield g.say('sam', 'Совет да любовь. И не наступайте на крабов.');
      } },
      { id: 'bye', icon: 'bye', text: 'Держитесь, мистер Линкольн.', end: true }
    ]
  };

  ROOMS.sybil = {
    id: 'sybil', name: 'Служба знакомств Сибил',
    w: 320, h: 200, music: 'sybil22',
    paint: (b, g) => S.BG.sybil22(b, g),
    walk: [
      [30, 140, 290, 140, 290, 180, 30, 180]
    ],
    start: [50, 160],
    drawBack(f, g, cx) {
      if (!g.f.lincolnDate) {
        drawSpr(f, cx, 'sybil22', 220, 130);
        drawSpr(f, cx, 'lincoln22', 140, 135);
      }
    },
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [10, 60, 30, 110], walk: [40, 160], face: 'w',
        exit: function* (g) {
          g.sfx('door');
          yield* g.goRoom('street', { x: 630, y: 154, dir: 's' });
        } },
      { id: 'sybil', name: 'Сибил Пандемик', rect: [205, 70, 35, 70], when: g => !g.f.lincolnDate, walk: [180, 150], face: 'e',
        look: 'Сибил в элегантном деловом костюме изучает анкеты влюбленных.',
        talk: function* (g) { yield g.talkTo('sybil'); } },
      { id: 'lincoln', name: 'Авраам Линкольн', rect: [125, 45, 35, 95], when: g => !g.f.lincolnDate, walk: [160, 150], face: 'w',
        look: 'Шестнадцатый президент Соединенных Штатов. Влюблен и немного растерян.',
        talk: function* (g) { yield g.talkTo('lincoln'); },
        items: {
          flower: function* (g) {
            yield TALK.lincoln.options.find(o => o.id === 'flower').run(g);
          }
        } }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
