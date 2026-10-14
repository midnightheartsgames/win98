(function (S) {
  'use strict';
  const { C, COLORS, blit } = S;
  const E = S.EP202;
  const { ROOMS, TALK } = E;

  function drawSpr(f, cx, id, x, y, pose, scale) {
    const sp = S.sprite(id, pose || {}, scale || 1);
    if (sp) blit(f, sp.buf, Math.round(x - cx - sp.ox), Math.round(y - sp.oy));
  }

  TALK.stinky = {
    options: [
      { id: 'menu', icon: 'stinky22', text: 'Что сегодня в меню, Вонючка?', run: function* (g) {
        yield g.say('stinky22', 'Фирменный гранитный бутерброд по рецепту моих полинезийских предков. Стоит десять долларов или один комплимент моей прическе.');
      } },
      { id: 'sandwich', icon: 'sandwich22', text: 'Твоя прическа великолепна. Дай нам бутерброд.', when: g => !g.has('sandwich') && !g.f.seismicGot, run: function* (g) {
        g.give('sandwich');
        yield g.say('stinky22', 'Забирайте. Только не уроните на пол, а то пробьете перекрытие в подвал.');
      } },
      { id: 'bye', icon: 'bye', text: 'Приятного аппетита всем присутствующим.', end: true }
    ]
  };

  TALK.gstinky = {
    options: [
      { id: 'tales', icon: 'gstinky22', text: 'Дедушка, вы бывали в Бермудском треугольнике?', run: function* (g) {
        yield g.say('gstinky22', 'Бывал ли я? Да я там швартовался прямо к облаку в тридцать четвертом! Вода там кружится штопором, а посреди бури бренчат мариачи на трехструнных гитарах!');
      } },
      { id: 'water', icon: 'youthwater22', text: 'Вот вода из грота молодости на острове Пасхи.', when: g => g.has('youthwater') && !g.f.gstinkyYoung, run: function* (g) {
        g.drop('youthwater');
        g.f.gstinkyYoung = true;
        yield g.say('gstinky22', 'Глоток! О святые каракатицы! Поясница не ноет, глаза видят как у орла!');
        yield g.say('gstinky22', 'Держите мой капитанский совет: мариачи в треугольнике поют не просто так. Их мелодия открывает проход в самое жерло вулкана!');
        g.f.volcanoKnown = true;
      } },
      { id: 'bye', icon: 'bye', text: 'Попутного ветра, капитан.', end: true }
    ]
  };

  ROOMS.stinky = {
    id: 'stinky', name: 'Закусочная Вонючки',
    w: 320, h: 200, music: 'diner22',
    paint: (b, g) => S.BG.stinky22(b, g),
    walk: [
      [30, 140, 290, 140, 290, 180, 30, 180]
    ],
    start: [50, 160],
    drawBack(f, g, cx) {
      drawSpr(f, cx, 'stinky22', 230, 110);
      drawSpr(f, cx, 'gstinky22', 90, 135);
    },
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [10, 60, 30, 110], walk: [40, 160], face: 'w',
        exit: function* (g) {
          g.sfx('door');
          yield* g.goRoom('street', { x: 780, y: 154, dir: 's' });
        } },
      { id: 'stinky', name: 'Юная Вонючка', rect: [215, 60, 35, 65], walk: [190, 150], face: 'e',
        look: 'Хозяйка заведения с надменным видом вытирает стойку жирной тряпкой.',
        talk: function* (g) { yield g.talkTo('stinky'); } },
      { id: 'gstinky', name: 'Дедушка Вонючка', rect: [70, 75, 40, 70], walk: [120, 150], face: 'w',
        look: 'Старый морской волк вспоминает былые плавания и ворчит на молодежь.',
        talk: function* (g) { yield g.talkTo('gstinky'); },
        items: {
          youthwater: function* (g) {
            yield TALK.gstinky.options.find(o => o.id === 'water').run(g);
          }
        } },
      { id: 'suntea', name: 'Банка с солнечным чаем', rect: [270, 90, 16, 20], when: g => !g.has('suntea'), walk: [240, 150], face: 'e',
        look: 'Банка с чаем, настаивающимся на солнце несколько десятилетий.',
        use: function* (g) {
          g.give('suntea');
          yield g.say('sam', 'Беру чай в вещдоки. Экспертиза на бактериологическое оружие не помешает.');
        } }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
