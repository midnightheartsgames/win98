(function (S) {
  'use strict';
  const { C, ROOMS, LAYERS } = S;
  const { sprite } = S.BG;

  LAYERS.dream = {
    pump: () => sprite(12, 22, P => {
      P.part(P.rect(4, 4, 4, 14), C.grey, { b: 3 });
      P.part(P.rect(0, 1, 12, 3), C.grey, { b: 1, sh: 0 });
      P.part(P.rect(1, 18, 10, 3), C.grey, { b: 1, sh: 0 });
    }),
    sign: () => sprite(40, 16, (P, b) => {
      P.part(P.rect(1, 3, 38, 12), C.grey, { b: 5 });
      P.part(P.poly([6, 8, 26, 8, 26, 5, 34, 9, 26, 13, 26, 10, 6, 10]), C.grey, { b: 0, sh: 0, hi: 0 });
      P.px(20, 1, C.grey[1]); P.px(20, 2, C.grey[2]);
      S.font.draw(b, 'ONE', 5, 4, C.black, 0);
    }),
    signDown: () => sprite(40, 16, P => {
      P.part(P.poly([2, 10, 36, 4, 38, 14, 4, 15]), C.grey, { b: 5 });
    }),
    antenna: () => sprite(34, 16, P => {
      P.curve('M 17 1 Q 20 1 19 4 L 17 6 L 2 14 L 32 14 L 17 6', C.grey[4]);
    })
  };

  function allDone(g) { const d = g.f.dr; return d && d.bulb && d.tv && d.cheese && d.max; }

  function* check(g) {
    if (!allDone(g)) return;
    yield g.say('sam', 'Всё. Ни одного Брэди. Сон снова мой.');
    yield* wake(g);
  }

  function* wake(g) {
    g.fx.flash = 1;
    g.sfx('swell');
    yield g.fadeOut(1);
    for (const id of ['head', 'bmax', 'bulb', 'bcheese']) g.place(id, 'nowhere', 0, 0);
    const j = g.actors.jimmy;
    j.scale = 1.25; j.visible = false; j.act = 'peek'; j.keepAct = true;
    g.place('jimmy', 'office', 211, 128, 'w');
    const max = g.actors.max;
    g.place('max', 'studio', 224, 132, 's');
    max.hypno = true; max.act = ''; max.keepAct = false; max.visible = true;
    for (const it of ['pump', 'antenna', 'maxhead', 'tapes', 'cheese']) g.drop(it);
    g.fx.flip = 0; g.fx.flipTo = 0;
    const sam = g.actors.sam;
    sam.hypno = false;
    g.f.samHypno = false;
    g.f.samCured = true;
    g.f.dream = false;
    g.setRoom('bosco', { x: 46, y: 176, dir: 'e' });
    sam.act = 'ko'; sam.keepAct = true;
    yield g.fadeIn(1);
    yield g.say('bosco', 'Сэм! Ты живой? Мой Антивор-О-Мат бьёт как паровоз.');
    sam.act = ''; sam.keepAct = false;
    yield g.say('sam', 'Боско... Мне снилось, что у меня в голове жил Брэди Калчер. Четыре штуки.');
    yield g.say('bosco', 'Бывает. У меня в голове живёт налоговая. Уже лет двадцать.');
    yield g.say('sam', 'Макс! Макс остался у Брэди!');
    yield g.say('sam', 'Если я просто приду туда, Брэди опять сделает из меня курьера. Нужна защита от гипноза.');
    yield g.say('bosco', 'Защита от гипноза? Ну-ка, ну-ка. Это моя любимая тема.');
  }

  S.startDream = function* (g) {
    g.f.dream = true;
    g.f.dr = { bulb: 0, tv: 0, cheese: 0, max: 0 };
    g.f.dCloset = false; g.f.signDown = false; g.f.pumpTaken = false; g.f.antennaTaken = false;
    g.setRoom('dream', { x: 150, y: 168, dir: 's' });
    const sam = g.actors.sam;
    sam.hypno = false; sam.act = ''; sam.keepAct = false;
    yield g.fadeIn(1);
    yield g.say('sam', 'Где я? Это наш офис... Только какой-то фиолетовый. И пахнет лаком для волос.');
    yield g.say('bulb', 'Сэм! Я свет твоей жизни!');
    yield g.say(null, 'А я твоя любимая передача!', { key: 'tvb', color: S.COLORS.brady, x: 192, y: 56 });
    yield g.say('bmax', 'А я твой лучший друг Макс! Смотри мне в глаза, напарник!');
    yield g.say(null, 'А я твой ужин!', { key: 'closet', color: S.COLORS.brady, x: 242, y: 34 });
    yield g.say('head', 'Сэм! Сэ-э-эм! Я тут, наверху! Этот тип украл моё тело!');
    yield g.say('sam', 'Сибил говорила, что во сне надо уничтожить незваного гостя. Гостей четверо. И все Брэди Калчеры.');
  };

  function* flipOnce(g) {
    g.sfx('flip');
    g.fx.flipTo = 1;
    yield g.until(gg => gg.fx.flip >= 1);
    const h = g.actors.head;
    h.y = 196; h.floatBase = 196;
    g.sfx('thump');
    yield g.say('sam', 'Ого! Всё вверх ногами! Голова Макса упала на... потолок. Который теперь пол.');
    yield g.say('head', 'Сэм! Лови меня, пока знак не раскачался обратно!');
    g.sfx('flip');
    g.fx.flipTo = 0;
    yield g.until(gg => gg.fx.flip <= 0);
    h.y = 58; h.floatBase = 58;
    yield g.say('sam', 'И обратно. Знак висит на одном гвозде, и комната качается вместе с ним. Вот если бы он упал совсем...');
  }

  function* shootNail(g) {
    yield g.anim('sam', 'shoot', 0.4);
    g.sfx('gun'); g.fx.flash = 0.3;
    g.f.signDown = true;
    g.sfx('flip');
    g.fx.flipTo = 1;
    yield g.until(gg => gg.fx.flip >= 1);
    const h = g.actors.head;
    h.y = 196; h.floatBase = 196;
    g.sfx('thump');
    yield g.say('head', 'А-а-а! Я падаю! То есть поднимаюсь! То есть падаю вверх!');
    yield g.walkTo('sam', h.x + 14, 150);
    yield g.anim('sam', 'reach', 0.5);
    h.visible = false; g.place('head', 'nowhere', 0, 0);
    g.give('maxhead');
    yield g.say('sam', 'Поймал! Макс, ты цел?');
    yield g.say('max', 'Цел! Меня только немного мутит. Это нормально для отрезанной головы?', { x: 160, y: 60 });
    g.sfx('flip');
    g.fx.flipTo = 0;
    yield g.until(gg => gg.fx.flip <= 0);
    yield g.say('sam', 'Комната на месте. Теперь голову на место.');
  }

  function* swapHeads(g) {
    const bm = g.actors.bmax;
    yield g.walkTo('sam', bm.x - 22, bm.y + 1);
    g.face('sam', 'e');
    yield g.anim('sam', 'reach', 0.5);
    g.sfx('pop'); g.fx.flash = 0.4;
    g.drop('maxhead');
    yield g.say('bmax', 'Нет! Моё новое тело! Верните! Я ещё не успел надеть на него свитер!');
    const x = bm.x, y = bm.y;
    g.place('bmax', 'nowhere', 0, 0);
    const max = g.actors.max;
    g.place('max', 'dream', x, y, 'w');
    max.visible = true; max.hypno = false; max.scripted = true; max.follow = null; max.act = 'grin'; max.actT = 1.2;
    g.f.dr.max = 1;
    yield g.say('max', 'Сэм! Моё тело! Я по нему скучал!');
    yield g.say('sam', 'С возвращением, Макс. Хотя бы во сне.');
    yield* check(g);
  }

  function* pumpJimmy(g) {
    const j = g.actors.jimmy;
    yield g.walkTo('sam', 214, 150);
    g.face('sam', 'e');
    for (let i = 0; i < 4; i++) { g.sfx('pump'); j.scale = 1.25 + (i + 1) * 0.35; yield 0.45; }
    yield g.say('jimmy', 'Я огромный! Я могучий! И я ГОЛОДНЫЙ!');
    yield g.say('bcheese', 'Нет! Не ешь меня! Я звезда! Я честное лицо телевидения! Я...');
    g.sfx('eat');
    g.place('bcheese', 'nowhere', 0, 0);
    yield 0.8;
    yield g.say('jimmy', 'Вкусная звезда. Суховатая, но с характером.');
    g.sfx('pump');
    j.scale = 1.25;
    g.drop('pump');
    g.f.dr.cheese = 1;
    yield g.say('sam', 'Джимми сдулся обратно. Сыра нет. Брэди тоже.');
    yield* check(g);
  }

  ROOMS.dream = {
    id: 'dream', name: 'Сон Сэма', w: 320, music: 'dream', dream: true, noSave: true,
    paint: (b) => S.BG.office(b, { dream: true }),
    walk: [[40, 132, 258, 132, 316, 162, 316, 198, 4, 198, 4, 156, 36, 134]],
    block: [[0, 152, 96, 147, 112, 158, 112, 200, 0, 200]],
    layers: [
      { id: 'closetOpen', src: 'office', x: 222, y: 38, when: g => g.f.dCloset, key: () => 'd' },
      { id: 'desk', src: 'office', x: 0, y: 138, base: 176 },
      { id: 'pump', x: 124, y: 140, base: 162, when: g => !g.f.pumpTaken },
      { id: 'sign', x: 262, y: 10, when: g => !g.f.signDown },
      { id: 'signDown', x: 266, y: 150, base: 163, when: g => g.f.signDown },
      { id: 'antenna', x: 175, y: 44, when: g => !g.f.antennaTaken }
    ],
    drawBack(f, g, cx) {
      for (let y = 63; y < 84; y++) for (let x = 176; x < 205; x++) f.set(x - cx, y, g.f.antennaTaken ? (S.hash(x, y, Math.floor(g.time * 20)) > 0.5 ? C.grey[4] : C.grey[1]) : C.sky[1]);
      if (!g.f.antennaTaken) {
        const P = new S.Pen(f).at(190 - cx, 76, 0.62);
        S.art.bradyHead(P, 0, 0, { talk: g.speech.some(s => s.who === 'tvb') && Math.floor(g.time * 8) % 2, t: g.time });
      }
    },
    update(g) {
      const h = g.actors.head;
      if (h.room === 'dream' && h.floatBase) h.y = h.floatBase + (g.fx.flip > 0.5 ? 0 : Math.sin(g.time * 2) * 3);
    },
    hot: [
      { id: 'edoor', name: 'Дверь', poly: [276, 32, 306, 23, 306, 170, 276, 142], walk: [284, 162], face: 'e', look: 'Дверь. Во сне двери ведут только в другие сны. Не хочу рисковать.', exit: 'Не уйду, пока в моей голове живёт хоть один Брэди.' },
      { id: 'switch', name: 'Выключатель', rect: [266, 73, 9, 14], walk: [262, 142], face: 'e', look: 'Выключатель. Интересно, что он выключает во сне.',
        use: function* (g) {
          if (g.f.dr.bulb) { yield g.say('sam', 'Лампочка уже погасла. Навсегда, надеюсь.'); return; }
          yield g.anim('sam', 'reach', 0.3);
          g.sfx('click');
          g.actors.bulb.v = 'off';
          yield g.say('bulb', 'Эй! Кто выключил свет моей славы?! Темно... Я не вижу своего отражения...');
          g.f.dr.bulb = 1;
          yield g.say('sam', 'Одним Брэди меньше.');
          yield* check(g);
        } },
      { id: 'closet', name: 'Шкаф', poly: [224, 42, 260, 40, 260, 128, 224, 128], walk: [240, 136], face: 'n',
        look: g => g.f.dCloset ? 'Шкаф открыт. Внутри Брэди-сыр и Джимми, который смотрит на него влюблёнными глазами.' : 'Шкаф. Изнутри доносится: «Я твой ужин!» Звучит как угроза.',
        use: function* (g) {
          if (g.f.dCloset) { yield g.say('sam', 'Закрывать не буду. Джимми работает.'); return; }
          yield g.anim('sam', 'reach', 0.4);
          g.sfx('door');
          g.f.dCloset = true;
          g.place('bcheese', 'dream', 244, 128, 's');
          const j = g.actors.jimmy;
          g.place('jimmy', 'dream', 226, 132, 'e');
          j.visible = true; j.act = ''; j.keepAct = false; j.scale = 1.25;
          yield g.say('bcheese', 'Я сыр твоей мечты, Сэм! Самый выдержанный сыр телевидения!');
          yield g.say('jimmy', 'Такой большой сыр... Мне в жизни его не осилить. Вот бы мне стать побольше...');
        } },
      { id: 'tv', name: 'Телевизор', poly: [172, 60, 212, 58, 213, 87, 172, 88], walk: [192, 136], face: 'n',
        look: g => g.f.antennaTaken ? 'Телевизор показывает помехи. Самая честная передача на свете.' : 'По телевизору Брэди Калчер. Антенна из плечиков ловит его на всех каналах.',
        talk: function* (g) { if (g.f.antennaTaken) { yield g.say('sam', 'Помехи не разговаривают. Этим они и хороши.'); return; } yield g.say(null, 'Смотри мне в глаза! Я на всех каналах! Пока у меня есть антенна, я вечен!', { key: 'tvb', color: S.COLORS.brady, x: 192, y: 56 }); },
        use: 'Кнопок нет. Только антенна.' },
      { id: 'antenna', name: 'Антенна-плечики', rect: [175, 42, 34, 16], when: g => !g.f.antennaTaken, walk: [192, 136], face: 'n',
        look: 'Антенна телевизора. Это же мои плечики! Во сне всё не на своём месте.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.5);
          g.f.antennaTaken = true;
          g.give('antenna');
          g.sfx('tvon');
          yield g.say(null, 'Помехи! Я теряю сигнал! Я теряю... рейтинги... ш-ш-ш-ш...', { key: 'tvb', color: S.COLORS.brady, x: 192, y: 56 });
          g.f.dr.tv = 1;
          yield g.say('sam', 'Без антенны он просто шум.');
          yield* check(g);
        } },
      { id: 'pump', name: 'Велосипедный насос', rect: [120, 138, 16, 24], when: g => !g.f.pumpTaken, walk: [132, 166], face: 'n',
        look: 'Велосипедный насос. Во сне у меня всегда под рукой насос. Не спрашивайте.',
        use: function* (g) { yield g.anim('sam', 'reach', 0.5); g.f.pumpTaken = true; g.give('pump'); yield g.say('sam', 'Беру. Мало ли что тут придётся надуть.'); } },
      { id: 'sign', name: 'Знак «Одностороннее движение»', rect: [262, 8, 40, 18], when: g => !g.f.signDown, walk: [262, 142], face: 'e',
        look: 'Знак «Одностороннее движение». Висит на одном гвозде и показывает... вверх? Или это я вверх ногами?',
        use: function* (g) { yield* flipOnce(g); },
        items: { gun: function* (g) { yield* shootNail(g); }, max: 'Макс сейчас не весь. Большая его часть чужая.' } },
      { id: 'signdown', name: 'Упавший знак', rect: [264, 148, 42, 18], when: g => g.f.signDown, look: 'Знак упал. Движение теперь двустороннее.' },
      { id: 'window', name: 'Окно', poly: [100, 30, 164, 28, 164, 96, 100, 98], walk: [134, 134], face: 'n', look: 'За окном ночной город. Во всех окнах один и тот же глаз.' },
      { id: 'cabinet', name: 'Картотека', poly: [40, 62, 90, 58, 90, 124, 41, 129], walk: [66, 136], face: 'n', look: 'Картотека. Во сне в ней хранятся все мои нераскрытые дела. Их больше, чем я думал.' },
      { id: 'desk', name: 'Стол', poly: [0, 156, 92, 150, 108, 158, 108, 200, 0, 200], walk: [118, 164], face: 'w', look: 'Мой стол. Во сне он точно такой же. Обидно.' }
    ],
    actors: {
      bulb: {
        name: 'Брэди-лампочка', walk: [150, 140], face: 'n', when: g => g.actors.bulb.room === 'dream',
        look: g => g.f.dr.bulb ? 'Погасшая лампочка с лицом Брэди. Больше не светится от самодовольства.' : 'Лампочка с лицом Брэди Калчера. Сорок ватт самодовольства.',
        talk: function* (g) { if (g.f.dr.bulb) { yield g.say('bulb', '...темно...'); return; } yield g.say('bulb', 'Я свет твоей жизни, Сэм! Только не трогай выключатель! Ни за что!'); },
        use: 'Не дотянусь. Но где-то тут был выключатель.',
        items: { gun: 'Осколки и во сне режутся. Есть способ проще.' }
      },
      bcheese: {
        name: 'Брэди-сыр', walk: [216, 150], face: 'e',
        look: 'Огромный сыр с лицом Брэди Калчера. Дырки на месте, наглость тоже.',
        talk: function* (g) { yield g.say('bcheese', 'Я выдержанный, я благородный, я звезда сырной тарелки!'); },
        use: 'Он слишком большой, чтобы съесть его в одиночку. Даже во сне.',
        items: { gun: 'Дырки его только украсят.', pump: 'Надуть сыр? Он и так надутый.' }
      },
      jimmy: {
        name: 'Джимми Два Зуба', walk: [204, 150], face: 'e',
        look: 'Джимми Два Зуба. Смотрит на сыр так, как я смотрю на пончики.',
        talk: function* (g) { yield g.say('jimmy', 'Чего уставился, начальник? Мне бы габаритов побольше. Раза в три.'); },
        items: { pump: function* (g) { yield* pumpJimmy(g); }, max: 'Макс сейчас немного без головы.' }
      },
      bmax: {
        name: 'Брэди-Макс', walk: g => [g.actors.bmax.x - 22, g.actors.bmax.y + 1], face: 'e',
        look: 'Тело Макса с головой Брэди Калчера. С головой Макса оно смотрелось лучше.',
        talk: function* (g) { yield g.say('bmax', 'Привет, напарник! Я Макс! Я обожаю хаос и... кассеты «Ай-Бо»! Смотри мне в глаза!'); yield g.say('sam', 'Макс никогда не просил меня смотреть ему в глаза. Он просил перестать.'); },
        items: {
          maxhead: function* (g) { yield* swapHeads(g); },
          gun: 'Стрелять в тело Макса? Макс мне этого не простит. Когда вернёт голову.',
          glove: 'Бить тело Макса? Оно же потом Максу достанется. С синяками.'
        }
      },
      head: {
        name: 'Голова Макса', walk: null,
        look: 'Голова Макса. Парит под потолком, как воздушный шарик. Тело, похоже, занято.',
        talk: function* (g) { yield g.say('head', 'Сэм! Верни мне тело, пока он не надел на него свитер!'); },
        use: 'Не достать. Слишком высоко. Вот если бы потолок стал полом...'
      },
      max: {
        name: 'Макс', walk: null, when: g => g.f.dr && g.f.dr.max,
        look: 'Макс. Целиком. Во сне, но целиком.',
        talk: function* (g) { yield g.say('max', allDone(g) ? 'Просыпайся, Сэм!' : 'Добьём остальных Брэди, Сэм!'); }
      }
    },
    setup(g) {
      g.fx.dream = true;
      if (!g.f.dr) g.f.dr = { bulb: 0, tv: 0, cheese: 0, max: 0 };
      const place =(id, x, y, o) => { const a = g.actors[id]; g.place(id, 'dream', x, y, 's'); Object.assign(a, { visible: true, act: '', keepAct: false, scripted: true }, o || {}); };
      place('bulb', 150, 38, { v: g.f.dr.bulb ? 'off' : '', z: -60 });
      if (!g.f.dr.max) place('bmax', 118, 174, { dir: 'e' });
      if (!g.f.dr.max && !g.has('maxhead')) { place('head', 100, 58, { act: 'head', keepAct: true, z: 200 }); g.actors.head.floatBase = 58; }
      const max = g.actors.max;
      if (!g.f.dr.max && max.room === 'dream') g.place('max', 'studio', 224, 132, 's');
    }
  };

  S.dream = { wake, check };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
