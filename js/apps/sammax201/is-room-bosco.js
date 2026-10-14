(function (S) {
  'use strict';
  const E = S.EP201;
  const { ROOMS, TALK } = E;

  function* secondParcel(g) {
    if (g.seen.parcel2) return;
    g.seen.parcel2 = 1;
    g.sfx('alarm');
    g.anim('bosco', 'gasp', 1.6);
    yield g.say('bosco', 'Сэм! Пришла вторая! Она тикает громче первой! В два раза! Я посчитал!');
    yield g.say('bosco', 'Я понял. Первая была приманкой. Настоящая бомба вторая. Они хотели, чтобы я смотрел на первую!');
    g.anim('bosco', 'give', 1.4);
    yield g.say('bosco', 'Забирай приманку, Сэм, и беги! А вторую я замурую в туалете!');
    g.f.famineGot = true;
    g.give('famine');
    g.sfx('pickup');
    yield g.say('sam', 'Внутри приманки всадник Голода и будильник на скотче. Будильник и тикал. Боско замуровывает секундомер.');
    g.sfx('gate');
    yield g.say('max', 'Сэм, а если бомба на самом деле в секундомере?');
    yield g.say('sam', 'Тогда Боско будет прав. Ему это пойдёт на пользу.');
  }

  TALK.bosco = {
    start: function* (g) {
      if (g.seen.boscoHello) return;
      g.seen.boscoHello = 1;
      g.anim('bosco', 'point', 1.4);
      yield g.say('bosco', 'Сэм! Не подходи к прилавку! На прилавке посылка, и она тикает!');
    },
    options: [
      { id: 'parcel', icon: 'parcel21', text: 'Что за посылка?', run: function* (g) {
        yield g.say('bosco', 'Пришла утром. Без обратного адреса. «Боско, от Санты». Санта мне ничего не дарил с самого детства.');
        yield g.say('bosco', 'Значит, это не Санта. Значит, это бомба.');
      } },
      { id: 'open', icon: 'q', text: 'Почему ты её не откроешь?', run: function* (g) {
        yield g.say('bosco', 'Я не открываю посылки, которые тикают, Сэм. И которые не тикают, тоже. Я вообще ничего не открываю. Даже окна.');
      } },
      { id: 'xray', icon: 'famine21', text: 'На рентгене всадник с весами.', when: g => g.f.xray && !g.f.famineGot, run: function* (g) {
        yield g.say('bosco', 'Всадник, будильник и скотч. Я знаю этот почерк. Так присылают бомбы, которые притворяются игрушками.');
        yield g.say('sam', 'Или игрушки, которые притворяются бомбами.');
        yield g.say('bosco', 'Это ещё хуже. От такой даже не знаешь, чего ждать.');
      } },
      { id: 'wish', icon: 'gift21', text: 'Что ты хочешь на Рождество?', run: function* (g) {
        yield g.say('bosco', 'Знать, Сэм. Знать точное время. До секунды. Когда знаешь время, остальное можно пережить.');
      } },
      { id: 'gate', icon: 'zap21', text: 'Что это у туалета?', run: function* (g) {
        yield g.say('bosco', 'Лазерная сигнализация «Боско-Тех». В прошлый раз оттуда кто-то унёс крышку от бачка. Я знаю кто, Сэм. Я всё знаю.');
      } },
      { id: 'flint', icon: 'f:flint21', text: 'Тебя ищет детектив.', when: g => g.f.flintMet, run: function* (g) {
        g.anim('bosco', 'gasp', 1.4);
        yield g.say('bosco', 'Детектив? Кто его нанял? Нет, не говори. Если это она, я уехал. Сэм, я уже уехал, ты меня не видел.');
      } },
      { id: 'bye', icon: 'bye', text: 'Береги себя, Боско.', end: true, run: function* (g) { yield g.say('bosco', 'Если услышишь взрыв, это был не я. Это была посылка.'); } }
    ]
  };

  ROOMS.bosco = {
    id: 'bosco', name: 'Лавка Боско', w: 320, music: 'bosco',
    paint: b => S.BG.bosco(b),
    walk: [[8, 136, 212, 136, 232, 176, 312, 176, 312, 198, 8, 198]],
    block: [[44, 138, 96, 138, 96, 152, 44, 152]],
    layers: [
      { id: 'glovearm', x: 46, y: 18 },
      { id: 'gate', x: 134, y: 34, key: g => Math.floor(g.time * 4) % 2 },
      { id: 'table', x: 44, y: 118, base: 150 },
      { id: 'xray', x: 252, y: 40 },
      { id: 'counter', x: 216, y: 110, base: 172 },
      { id: 'parcel', x: 254, y: 94, base: 173, when: g => !g.f.famineGot, key: g => Math.floor(g.time * 4) % 2 },
      { id: 'parcel2', x: 282, y: 94, base: 173, when: g => g.f.giftBosco && !g.seen.parcel2, key: g => Math.floor(g.time * 6) % 2 }
    ],
    hot: [
      { id: 'exit', name: 'Выход на улицу', rect: [4, 30, 40, 110], walk: [30, 170], face: 'w',
        look: 'Дверь на улицу. Четыре замка, глазок и табличка «Посылки оставлять на улице».',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street', { x: 472, y: 146, dir: 's' }); } },
      { id: 'antivor', name: 'Антивор-О-Мат', rect: [40, 4, 56, 14],
        look: 'Антивор-О-Мат. Перчатка на пружине. С первого дела ни разу не промахнулась.',
        use: function* (g) { yield g.say('bosco', 'Не тронь! Он заряжен и обидчив.'); } },
      { id: 'shelves', name: 'Полки', rect: [56, 28, 78, 76], walk: [112, 140], face: 'n',
        look: ['«Консервы «Боско-Тех». Открываются только с разрешения».', '«Гирлянда без лампочек. Не мигает, не выдаёт местоположение».', 'Шоколадные Санты. Боско повернул их лицом к стене.'],
        use: 'Мне ничего не нужно. Шоколадные Санты смотрят в стену, и я их понимаю.' },
      { id: 'xray', name: 'Рентген для посылок', rect: [254, 40, 44, 40], walk: [250, 182], face: 'n',
        look: function* (g) {
          if (g.f.famineGot) { yield g.say('sam', 'Рентген «Боско-Тех». На экране пусто. Посылка уехала со мной.'); return; }
          yield g.say('sam', 'Рентген «Боско-Тех» над прилавком. На экране посылка изнутри: всадник на тощем коне, весы, круглый будильник.');
          if (!g.f.xray) { g.f.xray = true; yield g.say('max', 'Сэм! В посылке всадник! Третий! То есть какой по счёту, неважно! Всадник!'); }
        },
        use: function* (g) { yield g.say('bosco', 'Не крути ручки! Рентген «Боско-Тех» откалиброван под мою паранойю.'); } },
      { id: 'parcel', name: 'Тикающая посылка', rect: [254, 94, 26, 20], when: g => !g.f.famineGot, walk: [250, 182], face: 'n', over: true,
        look: 'Посылка в коричневой бумаге. Тикает. «Боско, от Санты». Обратного адреса нет.',
        use: function* (g) { g.anim('bosco', 'gasp', 1.2); yield g.say('bosco', 'Не трогай! Если она взорвётся у тебя в руках, это будет на моей совести. А совесть у меня застрахована не полностью.'); },
        items: { gun: 'Стрелять в посылку, которая тикает? Боско умрёт от страха раньше, чем от взрыва.', tags: 'Отправить посылку обратно? Обратного адреса нет. Бирка не поможет.' } },
      { id: 'parcel2', name: 'Вторая посылка', rect: [282, 94, 26, 20], when: g => g.f.giftBosco && !g.seen.parcel2, walk: [262, 184], face: 'n', over: true,
        look: 'Вторая посылка. Тикает громче первой.' },
      { id: 'table', name: 'Столик', rect: [44, 124, 44, 22], walk: [104, 146], face: 'w', look: 'Столик. На нём табличка «Всё по одной цене. Цена меняется».' },
      { id: 'wc', name: 'Туалет', rect: [136, 34, 38, 76], walk: [154, 138], face: 'n',
        look: 'Туалет за лазерной сигнализацией. Красные лучи гуляют туда-сюда, как охранники.',
        use: 'Через лазеры я не полезу. Это не тот туалет, ради которого рискуют.' }
    ],
    actors: {
      bosco: {
        name: 'Боско', walk: [238, 182], face: 'n',
        look: 'Боско в своём собственном виде. Без парика и без акцента. Смотрит на посылку так, как другие смотрят на тигра.',
        talk: function* (g) { yield g.talkTo('bosco'); },
        use: 'Боско не любит, когда его трогают. Особенно сегодня.',
        items: {
          gun: function* (g) { yield g.say('bosco', 'Ты что, Сэм! Одна пуля, и посылка решит, что её атакуют!'); },
          famine: function* (g) { yield g.say('bosco', 'Унеси её от меня! Будильник ещё тикает!'); },
          tags: function* (g) { yield g.say('bosco', 'Бирки? Мне не нужны бирки. Мне нужна тишина.'); },
          max: function* (g) { yield g.say('max', 'Боско! Давай откроем посылку! Я подержу!'); yield g.say('bosco', 'Ты и держишь как бомба, кролик.'); },
          '*': function* (g) { yield g.say('bosco', 'Сколько хочешь за это, Сэм? Подожди, ты мне это продаёшь или отдаёшь? Если отдаёшь, я не возьму. Бесплатное тикает.'); }
        }
      }
    },
    enter: function* (g) {
      if (g.f.giftBosco && !g.seen.parcel2) yield* secondParcel(g);
    },
    setup(g) { g.place('bosco', 'bosco', 250, 150, 's'); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
