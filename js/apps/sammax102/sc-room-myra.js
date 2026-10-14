(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP102;
  const { ROOMS, TALK } = E;

  const fan = (g, t, x) => g.say(null, t, { key: x ? 'fan2' : 'fan', color: x ? C.grey[4] : COLORS.fan, x: x || 120, y: 176 });

  function hint(g) {
    if (!g.f.banjoOk) return 'Похвастайся Майре, что ты выиграл «Позорного идола»! Может, она даст тебе спеть!';
    if (!g.f.wet) return g.f.high ? 'Ты уже пищишь! Играй на банджо и пой! Разбей ей стакан!' : 'Вдохни из модулятора и сыграй на банджо! Высокая нота разобьёт стакан!';
    return 'Вода на столе, микрофон на шнуре! Расскажи Майре про снимок в газете. Скажи, что там была корова Бесси! Майра от коров падает в обморок!';
  }

  E.enterShow = function* (g) {
    yield g.fadeOut(2);
    g.setRoom('myra');
    yield g.fadeIn(2);
    const my = g.actors.myra;
    my.act = 'gift'; my.actT = 1.4;
    g.sfx('applause');
    yield g.say('myra', 'Мои дорогие! Встречайте! Звёзды «Ковбоев из центра», победитель «Позорного идола» и герои межпланетного скандала! Сэм и Макс!');
    yield fan(g, 'Ура-а-а...');
    yield g.say('myra', 'Садитесь, садитесь! Диван у нас мягкий. С него не встают.');
    yield g.say('max', 'Сэм, этот диван меня засасывает! Как зыбучий песок! Мне нравится!');
    yield g.say('sam', 'Мишка на столе смотрит прямо на нас. Глаза крутятся. Надо до него добраться. Вежливо.');
    g.f.showOn = true;
  };

  function* grabBear(g) {
    const sam = g.actors.sam, my = g.actors.myra;
    yield g.say('sam', 'Позвольте взглянуть на вашего мишку...');
    sam.act = 'reach'; sam.actT = 0.5;
    my.act = 'point'; my.actT = 1.2;
    yield g.say('myra', 'СИДЕТЬ!');
    g.fx.shake = 0.2;
    if (g.count('sit') === 1) {
      yield g.say('sam', 'Сижу. Ненавижу, когда это срабатывает.');
      yield g.say('max', 'А мне скажите «сидеть»! Я тоже хочу!');
      yield g.say('myra', 'Кролик, сидеть!');
      yield g.say('max', 'Не буду!');
    } else yield g.say('sam', 'Сижу. Опять. Рефлексы сильнее убеждений.');
  }

  function* playBanjo(g) {
    if (!g.f.banjoOk) { yield g.say('sam', 'Хватать чужое банджо посреди эфира невежливо. Невежливых Майра держит в зале.'); return; }
    if (g.f.wet) { yield g.say('sam', 'Хватит музыки. Стакан своё отзвучал.'); return; }
    g.f.banjoPlaying = true;
    g.face('sam', 'e');
    g.sfx('banjo');
    yield 0.6;
    g.sfx('banjo');
    if (g.f.high) {
      g.f.high = false;
      yield E.squeak(g, 'О-о-о, Майра-а-а, отпусти-и-и народ домо-о-ой!');
      g.sfx('glass');
      g.f.wet = true;
      g.fx.shake = 0.4;
      yield 0.6;
      g.f.banjoPlaying = false;
      yield g.say('myra', 'Браво! Какая высота! Ой! Мой стакан!');
      yield fan(g, 'Бра-а-аво...');
      yield g.say('myra', 'Ничего, продюсеры принесут новый. Ах да. Продюсеры тоже в зале.');
      yield g.say('sam', 'Вода растекается по столу прямо к микрофонному шнуру. Теперь бы Майре уронить туда микрофон.');
      return;
    }
    yield g.say('sam', 'Майра, отпусти народ домой, и тостеры отдай назад...');
    g.f.banjoPlaying = false;
    yield g.say('myra', 'Мило! Баритон! Но у меня в зале триста баритонов, сладенький.');
    yield g.say('sam', 'Стакан даже не дрогнул. Нужно выше. Намного выше.');
  }

  function* zap(g) {
    const my = g.actors.myra, bear = g.actors.bear, max = g.actors.max;
    g.sfx('sizzle');
    g.fx.flash = 1; g.fx.shake = 1.2;
    g.f.zap = g.time;
    yield 1.4;
    my.act = 'fried'; my.keepAct = true; my.hypno = false;
    bear.act = 'fried'; bear.keepAct = true;
    g.sfx('explosion');
    g.fx.flash = 0.6;
    g.f.bearFried = true;
    yield 1.0;
    g.f.zap = 0;
    g.music('electro');
    yield fan(g, 'Где мы? Почему у меня семь тостеров?');
    yield fan(g, 'Домой! Скорее домой, пока она не очнулась!', 230);
    g.sfx('cheer');
    g.f.crowdFree = true;
    yield 1.0;
    yield g.say('max', 'Сэм! Ты поджарил ведущую в прямом эфире! Это лучшая серия в истории телевидения!');
    yield g.say('sam', 'Технически её поджарил микрофон. Я только спел.');
    my.act = 'frazzled';
    yield g.say('myra', 'Ох... Голова. Что случилось? Последнее, что помню: курьер принёс мишку. Сказал, подарок от поклонников.');
    yield g.say('myra', 'Это было три дня назад?!');
    yield g.say('sam', 'Три дня назад, Майра. Ваши зрители как раз расходятся по домам.');
    yield g.say('myra', 'Без подарков?!');
    yield g.say('sam', 'С тостерами.');
    yield g.say('myra', 'Ну хоть так. Мои дорогие... кажется, я возьму отпуск.');
    yield g.say('sam', 'На ярлыке у мишки написано: «Сделано с любовью. Не для детей». Приятная фирма.');
    yield g.say('max', 'Сэм, он ещё дёргается!');
    yield g.say('sam', 'Упакуем его для Комиссара. Пусть дёргается у него на столе.');
    g.f.frozen = false;
    g.f.showOn = false;
    max.follow = 'sam'; max.scripted = false;
    yield* E.ending(g);
  }

  function* faint(g) {
    const my = g.actors.myra;
    my.act = 'up'; my.actT = 0.6;
    yield g.say('myra', 'С... С КОРОВОЙ?!');
    my.act = 'faint'; my.keepAct = true;
    g.sfx('thump');
    g.fx.shake = 0.4;
    if (!g.f.wet) {
      yield 1.2;
      yield fan(g, 'Майра упала...');
      yield 1.0;
      my.act = ''; my.keepAct = false;
      yield g.say('myra', 'Где я? Ах да, эфир! Мои дорогие, я в полном порядке! В полном и сухом порядке!');
      yield g.say('sam', 'Обморок есть, толку нет. Микрофон упал на сухой стол. Здесь не хватает воды.');
      return;
    }
    yield* zap(g);
  }

  const WHO = {
    hugh: { icon: 'f:hugh', text: 'Хью Блисс.', act: 'up', line: 'Хью Блисс?! Святой человек! Ведущий-мистик! В треугольнике?!', dry: 'Микрофон взлетел к потолку.', wet: 'Микрофон взлетел к потолку. Мимо лужи.' },
    director: { icon: 'f:director', text: 'Режиссёрша с WARP.', act: 'wave', line: 'Режиссёрша?! Когда она успевает? Она же снимает все передачи сразу!', dry: 'Майра мотнула микрофоном в сторону пульта.', wet: 'Микрофон мотнулся к пульту. Мимо лужи.' },
    featherly: { icon: 'f:featherly', text: 'Мистер Фезерли.', act: 'hug', line: 'Бедный мистер Фезерли! Он же курица! Как он решился?', dry: 'Прижала микрофон к груди. От жалости.', wet: 'Прижала микрофон к груди. Жалость у неё, увы, сухая.' }
  };

  TALK.myra = {
    options: (g, d) => {
      if (d.data.menu === 'who') {
        return Object.entries(WHO).map(([id, w]) => ({
          id, icon: w.icon, text: w.text,
          run: function* (gg) {
            const my = gg.actors.myra;
            my.act = w.act; my.actT = 1.4;
            yield gg.say('myra', w.line);
            yield gg.say('sam', gg.f.wet ? w.wet : w.dry);
          }
        })).concat([
          { id: 'bessy', icon: 'cow', text: 'Корова Бесси.', end: true, run: function* (gg) { d.data.menu = null; gg.endDialog(); yield* faint(gg); } },
          { id: 'back', icon: 'bye', text: 'Нет, никого не было.', run: function* (gg) { d.data.menu = null; yield gg.say('myra', 'Жаль! Зал так надеялся.'); } }
        ]);
      }
      return [
        { id: 'free', icon: 'ex', text: 'Майра, отпустите зрителей.', run: function* (gg) {
          yield gg.say('myra', 'Отпустить? Они же счастливы! Мистер Мишка говорит, что никто не уйдёт без подарка. И я с ним согласна.');
        } },
        { id: 'bear', icon: 'f:bear', text: 'Откуда у вас этот мишка?', run: function* (gg) {
          yield gg.say('myra', 'Мне его прислали. Без записки. Такой милый! С тех пор я не могу закончить эфир. Не хочу. Не могу. Не хочу.');
        } },
        { id: 'idol', icon: 'mic', text: 'Кстати, я выиграл «Позорного идола».', when: gg => !gg.f.banjoOk, run: function* (gg) {
          yield gg.say('myra', 'Певец! Мои дорогие, у нас музыкальный номер!');
          yield gg.say('myra', 'Сэм, вон банджо нашего оркестра. Оркестр ушёл на перерыв три дня назад. Играйте!');
          gg.f.banjoOk = true;
        } },
        { id: 'photo', icon: 'paper', text: 'Майра, насчёт снимка в «Вестнике»...', run: function* (gg) {
          yield gg.say('myra', 'Да! Межпланетный треугольник! Рассказывайте всё!');
          yield gg.say('sam', 'На снимке не все. За кадром был кое-кто ещё.');
          yield gg.say('myra', 'Кто?! Говорите! Зал ждёт!');
          d.data.menu = 'who';
        } },
        { id: 'ads', icon: 'tv', text: 'Может, прервёмся на рекламу?', once: true, run: function* (gg) {
          yield gg.say('myra', 'Никакой рекламы! Три дня прямого эфира! Реклама для слабаков. И для спонсоров.');
        } },
        { id: 'bye', icon: 'bye', text: 'Пожалуй, нам пора.', end: true, run: function* (gg) {
          yield gg.say('myra', 'Сидеть! Эфир не закончен.');
          yield gg.say('sam', 'Сижу.');
        } }
      ];
    }
  };

  ROOMS.myra = {
    id: 'myra', name: 'Студия «Майра!»', w: 320, music: 'myra', noSave: true,
    paint: b => S.BG.myra(b),
    walk: [[20, 150, 300, 150, 300, 196, 20, 196]],
    layers: [
      { id: 'banjo', x: 8, y: 98, base: 150, key: g => g.f.banjoPlaying ? 'p' : '' },
      { id: 'couch', x: 36, y: 104, base: 140 },
      { id: 'desk', x: 184, y: 108, base: 158 },
      { id: 'glass', x: 202, y: 100, base: 159, key: g => g.f.wet ? 'w' : '' },
      { id: 'puddle', x: 196, y: 110, base: 160, when: g => g.f.wet },
      { id: 'couchFront', x: 36, y: 138, base: 170 },
      { id: 'crowd', x: 0, y: 166, base: 400, key: g => g.f.crowdFree ? 'f' : '' }
    ],
    maxHint: hint,
    sprites(g) {
      const out = [];
      if (g.f.banjoPlaying) {
        const sam = g.actors.sam;
        out.push({ y: 171, draw: (f, cx) => S.blit(f, S.icon('banjo'), Math.round(sam.x - 6 - cx), Math.round(sam.y - 38)) });
      }
      if (g.f.zap) {
        out.push({ y: 500, draw: (f, cx) => {
          for (let i = 0; i < 16; i++) {
            const a = S.hash(i, Math.floor(g.time * 20), 3) * Math.PI * 2, r = 6 + S.hash(i, 7, Math.floor(g.time * 20)) * 30;
            S.line(f, 230 - cx, 104, 230 - cx + Math.cos(a) * r, 104 + Math.sin(a) * r * 0.6, i % 2 ? C.lamp : C.sky[4]);
          }
        } });
      }
      return out;
    },
    hot: [
      { id: 'glass', name: g => g.f.wet ? 'Осколки и лужа' : 'Стакан воды', rect: [200, 98, 14, 16], walk: null,
        look: g => g.f.wet ? 'Осколки и лужа. Лужа ползёт к шнуру микрофона.' : 'Стакан воды. Стоит у Майры с первого выпуска. Воду она не пьёт. Вода для искренности.',
        use: 'Встать и опрокинуть стакан? Майра не даст мне встать.',
        items: { gun: 'Стрелять в стакан на столе ведущей? Пуля уйдёт в зал.', launcher: 'Газом по стакану? Газ стекло не бьёт. Газ бьёт по заложникам.' } },
      { id: 'console', name: 'Звуковой пульт', rect: [278, 118, 38, 30], walk: null,
        look: 'Звуковой пульт. Шнур микрофона Майры тянется прямо к нему. Пульт гудит, как трансформаторная будка.',
        use: 'До пульта не дотянуться. Диван держит крепче наручников.' },
      { id: 'banjo', name: 'Банджо', rect: [8, 96, 26, 56], walk: null,
        look: g => g.f.banjoOk ? 'Банджо оркестра. Майра разрешила сыграть.' : 'Банджо на подставке. Оркестр ушёл на перерыв три дня назад и не вернулся.',
        use: function* (g) { yield* playBanjo(g); },
        items: { modulator: 'Банджо гелий ни к чему. Гелий нужен мне.', gun: 'Стрелять в банджо? Оно ни в чём не виновато. Оно даже не расстроено.' } },
      { id: 'crowd', name: 'Зрители', rect: [0, 166, 320, 34], walk: null,
        look: g => g.f.crowdFree ? 'Последние зрители пробираются к выходу. С тостерами.' : 'Триста зрителей. У всех по тостеру, у некоторых по два. Сидят не шевелясь и смотрят на мишку.',
        talk: function* (g) {
          if (g.f.crowdFree) { yield fan(g, 'Спасибо, собачка! Тостер хотите?'); return; }
          yield g.say('sam', 'Как вы там?');
          yield fan(g, 'Помогите... То есть спасибо, Майра!');
        } },
      { id: 'sign', name: 'Вывеска', rect: [84, 4, 156, 30], walk: null, look: '«МАЙРА!» с лампочками. Восклицательный знак самый большой. В нём можно жить.' },
      { id: 'window', name: 'Нарисованный город', rect: [150, 40, 150, 70], walk: null, look: 'Нарисованный вечерний город. В каждом нарисованном окне нарисованный телевизор. На всех «Майра!».' }
    ],
    actors: {
      myra: {
        name: 'Майра Стамп', walk: null, face: 'e',
        look: g => g.f.bearFried ? 'Майра Стамп. Причёска стоит дыбом, взгляд ясный. Впервые за три дня.' : 'Майра Стамп. Розовая причёска высотой с телебашню, на макушке завиток. Зелёная водолазка, бусы с сердечком. Глаза крутятся, как у её мишки.',
        talk: function* (g) { yield g.talkTo('myra'); },
        items: {
          gun: 'Стрелять в ведущую в прямом эфире? Рейтинг взлетит, а Комиссар нет.',
          launcher: 'Газ в студии, где триста заложников? Макс бы одобрил. Я нет.',
          modulator: 'Предложить Майре гелий? Её голос и так бьёт по ушам.',
          cream: 'Намазать Майру пеной? Это не из той передачи.',
          max: function* (g) { yield g.say('max', 'Майра! Хотите, я расскажу о себе? Это займёт часов шесть.'); yield g.say('myra', 'Потом, сладенький. После рекламы. Которой не будет.'); }
        }
      },
      bear: {
        name: 'Мистер Мишка', walk: null, face: 'e',
        look: g => g.f.bearFried ? 'Мишка обуглился. Из шва торчит проводок. Плюшевые мишки проводками не набиваются.' : 'Синий плюшевый мишка. Глаза медленно крутятся спиралями. Зрители смотрят на мишку, Майра смотрит на мишку, мишка смотрит на всех.',
        use: function* (g) { if (g.f.bearFried) { yield g.say('sam', 'Трогать его сейчас? Он ещё искрит.'); return; } yield* grabBear(g); },
        talk: 'Разговаривать с мишкой? Майра с ним уже поговорила. Результат налицо.',
        items: {
          gun: 'Мишка стоит прямо перед Майрой. Промахнусь, и у нас будет совсем другое шоу.',
          launcher: 'Газом по мишке? Мишке всё равно. Заложникам нет.',
          cream: 'Залепить ему глаза пеной? Для этого надо встать. А встать мне не дадут.'
        }
      },
      max: {
        name: 'Макс', walk: null, face: 'e',
        look: 'Макс тонет в диване и сияет. Он наконец в телевизоре.',
        talk: function* (g) { yield g.talkTo('max'); }
      }
    },
    setup(g) {
      g.f.frozen = true;
      const max = g.actors.max, my = g.actors.myra, bear = g.actors.bear;
      g.place('sam', 'myra', 84, 157, 'e');
      g.place('max', 'myra', 122, 157, 'e');
      max.follow = null; max.scripted = true; max.visible = true;
      g.place('myra', 'myra', 230, 150, 'w');
      my.visible = true; my.hypno = !g.f.bearFried; my.act = g.f.bearFried ? 'frazzled' : ''; my.keepAct = !!g.f.bearFried;
      g.place('bear', 'myra', 258, 118, 's');
      bear.z = 60; bear.visible = true;
    },
    onLoad(g) { ROOMS.myra.setup(g); }
  };

  E.myraShow = { playBanjo, faint, zap };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
