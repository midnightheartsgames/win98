(function (S) {
  'use strict';
  const { C, COLORS, blit } = S;
  const E = S.EP202;
  const { ROOMS, TALK } = E;

  function drawSpr(f, cx, id, x, y, pose, scale) {
    const sp = S.sprite(id, pose || {}, scale || 1);
    if (sp) blit(f, sp.buf, Math.round(x - cx - sp.ox), Math.round(y - sp.oy));
  }

  TALK.bernie = {
    options: [
      { id: 'cry', icon: 'moai_bernie22', text: 'Почему ты плачешь, каменный великан?', when: g => !g.f.bernieHappy, run: function* (g) {
        yield g.say('bernie22', 'Гора Беллависта прогневалась! Огненные реки поглотят наши базальтовые шеи! Мы все расплавимся в безжалостной магме!');
        yield g.say('max', 'Какая поэтичная трагедия! Дай мне ведро, я соберу твои слезы на сувениры!');
      } },
      { id: 'happy', icon: 'kiss22', text: 'Взгляни на Сибил и Линкольна. Любовь побеждает страх.', when: g => g.f.lincolnDate && !g.f.bernieHappy, run: function* (g) {
        yield g.say('bernie22', 'Какая чистота чувств... Президент шепчет нежные речи прекрасной даме прямо под пальмой...');
        yield g.say('bernie22', 'Мои слезы высохли. В моем каменном сердце затеплилась надежда.');
        g.f.bernieHappy = true;
      } },
      { id: 'bye', icon: 'bye', text: 'Держись бодрее.', end: true }
    ]
  };

  TALK.billy = {
    options: [
      { id: 'laugh', icon: 'moai_billy22', text: 'Что тебя так веселит, Билли?', when: g => !g.f.billySerious, run: function* (g) {
        yield g.say('billy22', 'Ха-ха-ха! Вы только посмотрите на этих пушистых двуногих! Скоро лава сделает из вас жареные сосиски! Ха-ха-ха!');
      } },
      { id: 'serious', icon: 'moai_billy22', text: 'Билли, мы только что были в подземелье под твоими ногами.', when: g => g.f.tickleDone && !g.f.billySerious, run: function* (g) {
        yield g.say('billy22', 'О нет... Вы нашли мои гигантские пальцы ног? Пожалуйста, только не трогайте мизинец!');
        yield g.say('billy22', 'Я больше не смеюсь. Я абсолютно серьезен и соблюдаю протокол пророчества.');
        g.f.billySerious = true;
      } },
      { id: 'bye', icon: 'bye', text: 'Смейся дальше, пока можешь.', end: true }
    ]
  };

  TALK.mort = {
    options: [
      { id: 'prophecy', icon: 'moai_mort22', text: 'Расскажи нам древнее пророчество, Мортимер.', run: function* (g) {
        yield g.say('mort22', 'Слушайте слова предков: когда плач смолкнет, смех обратится в трепет, а три звука разлома прозвучат в унисон, путь к сердцу вулкана откроется.');
        if (!g.has('prophecy')) {
          g.give('prophecy');
          g.f.prophecyGot = true;
          yield g.say('mort22', 'Возьмите эту скрижаль. На ней высечены знаки спасения.');
        }
      } },
      { id: 'bye', icon: 'bye', text: 'Мы выполним заветы предков.', end: true }
    ]
  };

  ROOMS.beach = {
    id: 'beach', name: 'Остров Пасхи',
    w: 640, h: 200, music: 'beach22',
    scale: [145, 0.9, 185, 1.05],
    paint: (b, g) => S.BG.beach22(b, g),
    walk: [
      [20, 145, 620, 145, 620, 185, 20, 185]
    ],
    start: [250, 160],
    enter: function* (g) {
      g.f.beachVisited = true;
    },
    drawBack(f, g, cx) {
      drawSpr(f, cx, 'portal22', 120, 145, { t: g.time });
      drawSpr(f, cx, 'moai_bernie', 200, 130, { happy: g.f.bernieHappy });
      drawSpr(f, cx, 'moai_billy', 320, 130, { serious: g.f.billySerious });
      drawSpr(f, cx, 'moai_mort', 440, 130);
      if (g.f.lincolnDate) {
        drawSpr(f, cx, 'lincoln22', 170, 165);
        drawSpr(f, cx, 'sybil22', 230, 165);
      }
    },
    hot: [
      { id: 'portal', name: 'Бермудский портал', poly: [90, 80, 150, 80, 150, 165, 90, 165], walk: [120, 160], face: 'n',
        look: 'Портал переливается лазурными вспышками, соединяя остров с другими временами.',
        use: function* (g) {
          yield g.say('sam', 'Ныряем в портал.');
          yield g.talkTo('portalTrip');
        } },
      { id: 'bernie', name: 'Плачущий истукан Берни', poly: [170, 70, 230, 70, 230, 150, 170, 150], walk: [200, 160], face: 'n',
        look: g => g.f.bernieHappy ? 'Берни умиротворенно улыбается каменными губами.' : 'Огромный каменный моаи заливает песок слезами.',
        talk: function* (g) { yield g.talkTo('bernie'); } },
      { id: 'billy', name: 'Хохочущий истукан Билли', poly: [290, 70, 350, 70, 350, 150, 290, 150], walk: [320, 160], face: 'n',
        look: g => g.f.billySerious ? 'Билли сжал каменные челюсти в предельной серьезности.' : 'Истукан сотрясается от раскатистого издевательского хохота.',
        talk: function* (g) { yield g.talkTo('billy'); } },
      { id: 'mort', name: 'Истукан Мортимер', poly: [410, 70, 470, 70, 470, 150, 410, 150], walk: [440, 160], face: 'n',
        look: 'Самый мудрый и древний из истуканов. Смотрит на океан с глубоким пониманием.',
        talk: function* (g) { yield g.talkTo('mort'); } },
      { id: 'flower', name: 'Цветок гибискуса', rect: [35, 120, 25, 30], when: g => !g.has('flower') && !g.f.lincolnDate, walk: [50, 160], face: 'n',
        look: 'Роскошный алый цветок, благоухающий тропической свежестью.',
        use: function* (g) {
          g.give('flower');
          yield g.say('sam', 'Срываю цветок. Идеальный романтический сувенир.');
        } },
      { id: 'cave', name: 'Вход в подземелье', poly: [0, 130, 30, 130, 30, 185, 0, 185], walk: [30, 160], face: 'w',
        exit: function* (g) {
          yield* g.goRoom('cavern', { x: 260, y: 165, dir: 'w' });
        } },
      { id: 'fountain', name: 'Тропа к гроту', poly: [500, 130, 540, 130, 540, 185, 500, 185], walk: [520, 160], face: 'n',
        exit: function* (g) {
          yield* g.goRoom('fountain', { x: 60, y: 165, dir: 'e' });
        } },
      { id: 'volcano', name: 'Подъем к вулкану', poly: [580, 120, 640, 120, 640, 185, 580, 185], walk: [600, 160], face: 'e',
        exit: function* (g) {
          yield* g.goRoom('volcano', { x: 80, y: 166, dir: 'e' });
        } }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
