(function (S, B) {
  'use strict';
  const C = B.C;
  const E = B.EP1;
  const G = B.grey;
  const { ROOMS, TALK, LAYERS } = E;
  const { card, doc, PAPERS } = B.games;
  const WIN = { x: 520, y: 150 };

  LAYERS.street86 = {
    edna: () => {
      const spr = S.sprite('bt_edna86', { dir: 's', act: 'horn', walk: -1 }, 0.8);
      const h = Math.min(spr.buf.h, 64);
      const b = new S.Buf(spr.buf.w, h);
      for (let y = 0; y < h; y++) b.px.set(spr.buf.px.subarray(y * spr.buf.w, (y + 1) * spr.buf.w), y * spr.buf.w);
      return b;
    }
  };
  LAYERS.edna86 = {
    chair: () => G.layer(84, 84, b => {
      const P = new S.Pen(b);
      P.part(P.path('M 12 54 L 10 10 Q 12 2 42 2 Q 72 2 74 10 L 72 54 Z'), C.mustard, { b: 2, sh: 1 });
      for (let x = 16; x < 70; x += 5) P.line(x, 8, x, 52, C.mustard[1]);
      P.part(P.rect(14, 46, 56, 18), C.mustard, { b: 3, sh: 1 });
      for (const x of [2, 66]) { P.part(P.rect(x, 34, 16, 40), C.mustard, { b: 2, sh: 1 }); P.part(P.ell(x + 8, 34, 8, 5), C.mustard, { b: 3, sh: 0 }); }
      for (const x of [8, 72]) P.part(P.rect(x, 74, 5, 8), C.wood, { b: 1, sh: 0 });
    }),
    binoc: () => G.layer(40, 30, b => {
      const P = new S.Pen(b);
      for (const x of [12, 28]) { P.part(P.rect(x - 6, 8, 12, 18), C.stone, { b: 1, sh: 0 }); P.part(P.ell(x, 8, 6, 3), C.steel, { b: 3, sh: 0 }); }
      P.part(P.rect(16, 12, 8, 6), C.stone, { b: 2, sh: 0 });
    })
  };

  function shout(g, text) { g.sfx('megaphone'); return E.voice(g, 'ednaOld', text, WIN.x, WIN.y - 10); }

  const SHOUTS = ['Я ВИЖУ, КАК ТЫ КРАДЁШЬСЯ В ВИННЫЙ, МОЛОДОЙ ЧЕЛОВЕК!', 'ДЖЕК! ДИАНА! Я ЗНАЮ, ЧЕМ ВЫ ЗАНИМАЕТЕСЬ ЗА ТЕМ ДЕРЕВОМ!', 'ТИФФ ТАННЕН, ПОЛОЖИ КОЛПАК НА МЕСТО!', '«ПОЗОР» ПИШЕТСЯ С БУКВОЙ «О», ВАНДАЛ!', 'ПОДНИМИ ФАНТИК, ТЫ НЕ В ХЛЕВУ!'];

  ROOMS.street86 = {
    id: 'street86', name: 'Улица у дома Эдны', w: 960, music: 'bt_street86',
    scale: [306, 0.9, 470, 1],
    paint: b => B.BG.paintStreet86(b),
    walk: [[20, 306, 940, 306, 952, 472, 8, 472]],
    layers: [{ id: 'edna', x: 494, y: 116, base: -500, when: g => !g.f.ednaIn }],
    hot: [
      { id: 'window', name: 'Окно Эдны', rect: [470, 110, 100, 70], walk: [520, 330], face: 'n', look: 'Эркер на втором этаже. Из него торчит мегафон.', talk: function* (g) { yield g.talkTo('ednaWin'); }, act: 'talk', items: { shoe: shoeGift, photo: 'Показать снизу фото? Она его даже не разглядит.' } },
      { id: 'buzzer', name: 'Звонок', rect: [450, 240, 20, 24], walk: [480, 330], face: 'n', look: 'Табличка у звонка: «Э. СТРИКЛЕНД».', use: function* (g) { g.sfx('buzzer'); yield shout(g, 'КТО ТАМ? ХУЛИГАНЫ?'); yield g.talkTo('ednaWin'); }, items: { shoe: shoeGift } },
      { id: 'arcade', name: 'Звёздная база Зеро', rect: [40, 200, 200, 104], walk: [140, 330], face: 'n', look: 'Игровой зал. Надеюсь, Джимми починил «Дикого стрелка».', use: 'Не до игр.' },
      { id: 'liquor', name: 'Винный «A1»', rect: [640, 200, 220, 104], walk: [750, 330], face: 'n', look: 'Мистер Фиггинс поставил на окна новые решётки.', use: 'Мне туда рано. Да и Эдна смотрит.' },
      { id: 'hydrant', name: 'Гидрант', rect: [300, 270, 24, 34], walk: [312, 330], face: 'n', look: 'Красный гидрант.' },
      { id: 'bin', name: 'Урна', rect: [900, 250, 40, 54], walk: [900, 330], face: 'n', look: 'Урна. Эдна, наверное, проверяет её каждое утро.' },
      { id: 'back', name: 'Обратно к гаражу', rect: [0, 300, 20, 170], walk: [20, 420], exitDir: 'w', exit: { room: 'yard', x: 300, y: 400, dir: 'e' }, look: 'Дорога назад к гаражу Дока.' }
    ],
    actors: {
      einstein: { name: 'Эйнштейн', dist: 40, look: 'Эйнштейн сидит у подъезда и смотрит на окно.', talk: function* (g) { yield g.say('einstein', 'Гав!'); }, items: { shoe: 'Он уже привёл меня, куда надо.' } }
    },
    ambient: function* (g) {
      let i = 0;
      for (;;) {
        yield 7 + g.rng.next() * 6;
        if (!g.busy && !g.dialog) shout(g, SHOUTS[i++ % SHOUTS.length]);
      }
    },
    enter: function* (g) {
      if (!g.f.streetSeen) {
        g.f.streetSeen = true;
        yield shout(g, 'ЭЙ, ТЫ! ТОТ БЕЗДЕЛЬНИК МАКФЛАЙ НА СКЕЙТЕ!');
        yield shout(g, 'ВСЕ СКЕЙТЕРЫ ХУЛИГАНЫ. ЭТО ФАКТ. ПРОВЕРЬТЕ.');
      }
    }
  };

  function* shoeGift(g) {
    if (!g.f.ednaAsk) { yield shout(g, 'НЕ ТРЯСИ ТАМ НИЧЕМ, ХУЛИГАН!'); return; }
    yield shout(g, 'ЭТО ЖЕ МОЯ ТУФЛЯ! ПОДНИМАЙСЯ. ВЫТРИ НОГИ.');
    g.f.ednaIn = true;
    yield* g.goRoom('edna86', { x: 140, y: 420, dir: 'e' });
  }

  TALK.ednaWin = { portrait: 'ednaOld', options: [
    { id: 'hi', text: 'Здравствуйте, миссис Стрикленд!', run: function* (g) { yield shout(g, 'МИСС! И Я ВЫЗОВУ ПОЛИЦИЮ.'); } },
    { id: 'gift', text: 'У меня для вас кое-что есть.', run: function* (g) { g.f.ednaAsk = true; yield shout(g, 'ДЛЯ МЕНЯ? НУ, ПОКАЖИ. ТОЛЬКО БЕЗ ФОКУСОВ.'); } },
    { id: 'brother', text: 'Вы сестра нашего завуча?', once: true, run: function* (g) { yield shout(g, 'ДЖЕРАЛЬД ВЕЧНО ЖАЛУЕТСЯ НА ТЕБЯ. ТЕПЕРЬ Я ПОНИМАЮ ПОЧЕМУ.'); } },
    { id: 'bye', text: 'Извините за беспокойство.', end: true }
  ] };

  const HEADLINES = [
    ['28 октября 1985', '«Стрельба у „Одинокой сосны“: власти в недоумении»', 'Это же та самая ночь. Я там был.'],
    ['1955 год', '«Местный хулиган угодил в кузов с навозом»', 'Бифф. Кто же ещё.'],
    ['1885 год', '«Клинт Иствуд погиб в ущелье Шонаш»', 'Ну, это как посмотреть.'],
    ['1932 год', '«На месте бывшего бара заложен фундамент»', null],
    ['1931 год', '«Певица исчезла»', null],
    ['1931 год', '«Выставка в Хилл-Вэлли радует публику»', null],
    ['1931 год', '«Столовая разоблачена»', 'Столовая? Интересно, какая.']
  ];

  const PHOTOS = [
    ['Маршал Джеймс Стрикленд', 'Мой прадед. Его застрелил Бешеный Пёс Таннен.', true],
    ['Джеральд и Стэнфорд', 'Мои братья. В мамином платье. Не спрашивай.', false],
    ['Кошка', 'Мисс Пушистые Усы в молодости.', false]
  ];

  ROOMS.edna86 = {
    id: 'edna86', name: 'Квартира Эдны', w: 800, music: 'bt_edna',
    scale: [300, 0.92, 470, 1],
    paint: b => B.BG.paintFlat86(b),
    walk: [[20, 300, 780, 300, 792, 472, 8, 472]],
    noSave: g => !!(g.vt && g.vt.kitchen),
    layers: [{ id: 'chair', x: 380, y: 300, base: 370 }, { id: 'binoc', x: 470, y: 330, base: 372 }],
    hot: [
      { id: 'binoc', name: 'Бинокль', rect: [470, 330, 40, 30], walk: [480, 400], face: 'n', look: 'Бинокль на тумбочке. Эдна следит за площадью, как часовой.', use: function* (g) {
        if (g.vt.kitchen === undefined && g.actors.ednaOld.room === 'edna86' && !g.f.binocOk) yield g.say('ednaOld', 'Смотри, смотри. Всё равно ничего хорошего не увидишь.');
        g.f.binocOk = true;
        if (!g.f.knowPlace) { yield* card(g, '', ['Площадь: суд, игровой зал, видеопрокат «Видео Вэлли». Ничего особенного.'], { art: B.BG.binocView(false), textY: 420 }); return; }
        yield* card(g, '', ['Видеопрокат «Видео Вэлли». Из дверей выходит Бифф с кассетой.', 'На фасаде табличка: «ПЕРЕСТРОЕНО В ФЕВРАЛЕ 1932».'], { art: B.BG.binocView(true), textY: 400 });
        g.f.year1931 = true;
        yield g.say('marty', 'Значит, бар сгорел в тридцать первом.');
      } },
      { id: 'papers', name: 'Газеты', rect: [560, 240, 200, 70], walk: [660, 400], face: 'n', look: function* (g) {
        const i = g.f.headI || 0;
        g.f.headI = i + 1;
        if (i === 0) { yield g.say('marty', 'Стопки «Хилл-Вэлли телеграф» в пакетах и коробках. Похоже, все номера с самого начала.'); return; }
        const [date, head, note] = HEADLINES[(i - 1) % HEADLINES.length];
        yield g.say('marty', 'Сверху номер, ' + date + ': ' + head + '.');
        if (note) yield g.say('marty', note);
      }, use: function* (g) {
        if (g.actors.ednaOld.room === 'edna86') { yield g.say('ednaOld', 'Руки прочь от моего архива!'); return; }
        if (!g.f.knowFire || !g.f.year1931) { yield g.say('marty', 'Тут газеты за сто лет. Без года можно копаться до пенсии.'); return; }
        yield g.anim('marty', 'reach', 0.6);
        yield g.say('marty', 'Тридцать первый, июнь... Вот! «Поджигатель бара убит».');
        yield* doc(g, PAPERS.v1);
        g.give('paper');
        g.f.dateKnown = true;
        yield g.say('marty', 'Карл Саган? Это же Док! Четырнадцатое июня тридцать первого... Я должен его спасти!');
        g.sfx('thud');
        yield g.say('marty', 'Ой.');
        g.vt.kitchen = 0;
        yield* backAngry(g);
      } },
      { id: 'valve', name: 'Вентиль батареи', rect: [40, 150, 70, 100], walk: [90, 360], face: 'n', look: 'Белая батарея с красным вентилем.', use: function* (g) {
        g.sfx('hiss');
        yield g.say('marty', 'Ш-ш-ш...');
        if (g.actors.ednaOld.room !== 'edna86') return;
        yield g.say('ednaOld', 'Чайник! Я же только что поставила...');
        const e = g.actors.ednaOld;
        e.scripted = true; e.act = ''; e.keepAct = false;
        yield g.walkTo('ednaOld', 680, 320);
        e.room = 'kitchen86';
        e.scripted = false;
        g.vt.kitchen = 25;
      } },
      { id: 'photos', name: 'Фотографии', rect: [140, 80, 130, 90], walk: [200, 360], face: 'n', look: function* (g) {
        const i = (g.f.photoI || 0) % PHOTOS.length;
        g.f.photoI = i + 1;
        const [name, text, marshal] = PHOTOS[i];
        yield g.say('marty', name + '.');
        if (g.actors.ednaOld.room === 'edna86') yield g.say('ednaOld', text);
        if (marshal && g.actors.ednaOld.room === 'edna86') { g.f.fateFlux = true; yield g.say('marty', 'Застрелил? Не помню такого.'); yield g.say('ednaOld', 'Конечно, не помнишь. Ты же не читаешь газет.'); }
      } },
      { id: 'trophies', name: 'Кубки', rect: [140, 172, 180, 26], walk: [230, 360], face: 'n', look: 'Кубки журнала «Любители кошек». Мисс Пушистые Усы брала все призы подряд.', use: 'Кубки трогать нельзя. Это я понял без слов.' },
      { id: 'typewriter', name: 'Пишущая машинка', rect: [130, 240, 60, 30], walk: [160, 360], face: 'n', look: 'Пишущая машинка. В каретке лист: «Хулиганство в городе растёт. Это факт».', use: 'Дописывать за Эдну? Жить ещё хочется.' },
      { id: 'tin', name: 'Жестянка', rect: [192, 250, 24, 18], walk: [200, 360], face: 'n', look: 'Жестянка из-под конфет. Внутри засохшие леденцы и книжка «1984». Эдна знает толк в слежке.', use: 'Леденцы старше меня. Спасибо, не надо.' },
      { id: 'tv', name: 'Телевизор', rect: [240, 230, 60, 60], walk: [270, 360], face: 'n', look: 'Телевизор с рогатой антенной.', use: function* (g) { if (g.actors.ednaOld.room === 'edna86') yield g.say('ednaOld', 'Не трогай. Скоро шоу Мерва.'); else yield g.say('marty', 'Лучше не трогать. Скоро шоу Мерва.'); } },
      { id: 'kitchen', name: 'Кухня', rect: [610, 110, 150, 120], walk: [680, 330], face: 'n', look: 'Дверь на кухню. На плите красный чайник. Точно такой же плавает в аквариуме у Дока.', use: g => g.actors.ednaOld.room === 'edna86' ? 'Без приглашения на кухню к Эдне? Нет уж.' : 'Эдна там гремит чашками. Лучше не попадаться.' },
      { id: 'out', name: 'Дверь', rect: [0, 300, 20, 170], walk: [24, 420], exitDir: 'w', look: 'Выход на лестницу.', exit: function* (g) {
        if (!g.f.dateKnown) { yield g.say('marty', 'Уйти сейчас? Эдна знает про туфлю больше, чем говорит.'); return; }
        yield* g.goRoom('yard', { x: 300, y: 400, dir: 'e' });
      } }
    ],
    actors: {
      ednaOld: { name: 'Эдна', dist: 50, look: 'Эдна Стрикленд. Розовый кардиган, мегафон под рукой.', talk: function* (g) { yield g.talkTo('edna86'); }, items: { shoe: 'Она уже забрала её.', photo: function* (g) { yield g.say('ednaOld', 'Твой отец? Тоже был хулиганом. Пока не начал писать книжки.'); } } }
    },
    setup(g) {
      const e = g.actors.ednaOld;
      if (e.room === 'edna86' && !e.scripted && !e.path) { e.act = 'sit'; e.keepAct = true; }
    },
    update(g, dt) {
      if (g.vt.kitchen > 0) {
        g.vt.kitchen -= dt;
        if (g.vt.kitchen <= 0 && !g.busy) {
          g.vt.kitchen = undefined;
          g.run(function* () {
            const e = g.actors.ednaOld;
            e.scripted = true;
            g.place('ednaOld', 'edna86', 680, 320, 's');
            yield g.say('ednaOld', 'Странно, чайник холодный.');
            yield g.walkTo('ednaOld', 420, 372);
            e.act = 'sit'; e.keepAct = true; e.scripted = false;
          }, { name: 'ednaBack' });
        }
      }
    },
    enter: function* (g) {
      if (!g.f.shoeGiven) {
        g.f.shoeGiven = true;
        g.drop('shoe');
        yield g.say('ednaOld', 'Давай сюда. Вот она, пара. Полвека ждала.');
        yield g.say('ednaOld', 'Как аккуратно.');
        E.setChapter(g, 2);
      }
    }
  };

  function* backAngry(g) {
    const e = g.actors.ednaOld;
    e.scripted = true;
    g.place('ednaOld', 'edna86', 680, 320, 's');
    yield g.say('ednaOld', 'ЧТО ТЫ СДЕЛАЛ С МОИМ АРХИВОМ?!');
    yield g.say('ednaOld', 'Вон! Вон отсюда, хулиган!');
    e.scripted = false;
    yield* card(g, '', ['Эдна выставляет Марти за дверь. Больше она её не откроет.']);
    g.place('ednaOld', 'edna86', 420, 372, 's');
    e.act = 'sit'; e.keepAct = true;
    yield* g.goRoom('yard', { x: 300, y: 400, dir: 'e' });
    yield g.say('marty', 'Держись, Док. Я иду.');
  }

  TALK.edna86 = { portrait: 'ednaOld', options: [
    { id: 'shoe', text: 'Когда вы потеряли туфлю?', run: function* (g) {
      yield g.say('ednaOld', 'В тот день, когда сгорел подпольный бар. Ужасный день. Хотя для города, может, и хороший.');
      g.f.knowFire = true;
    } },
    { id: 'where', text: 'Подпольный бар? А где он был?', when: g => g.f.knowFire, run: function* (g) {
      yield g.say('ednaOld', 'На площади. Там, где теперь этот видеопрокат.');
      g.f.knowPlace = true;
    } },
    { id: 'papers', text: 'Зачем вам столько газет?', run: function* (g) {
      yield g.say('ednaOld', 'Здесь все номера «Хилл-Вэлли телеграф» с тысяча восемьсот семьдесят первого года.');
      yield g.say('ednaOld', 'Половину, наверное, я сама и написала. Я была ещё та репортёрша.');
    } },
    { id: 'binoc', text: 'Хороший у вас бинокль.', once: true, run: function* (g) {
      yield g.say('ednaOld', 'Город надо держать в поле зрения. Иначе он распускается.');
    } },
    { id: 'tea', text: 'Спасибо за чай.', once: true, run: function* (g) {
      yield g.say('ednaOld', 'Какой чай? А, чайник. Сейчас закипит.');
      yield g.say('marty', 'Плита не горит.');
      yield g.say('ednaOld', 'Не учи меня кипятить воду, молодой человек.');
    } },
    { id: 'bye', text: 'Я тут посмотрю, ладно?', end: true }
  ] };

  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
