(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP103;
  const { ROOMS, TALK } = E;

  const sing = (g, t) => g.say(null, t, { key: 'heads', color: C.gold[4], x: 334, y: 92 });

  function* giveToken(g, line) {
    const lv = g.actors.lovey;
    lv.act = 'give'; lv.actT = 1;
    yield g.say('lovey', line);
    g.sfx('chips');
    g.give('token');
    g.f.tokenGot = true;
  }

  function* greet(g) {
    g.f.casinoSeen = true;
    const lv = g.actors.lovey;
    lv.act = 'wave'; lv.actT = 1.4;
    g.music('playland');
    yield g.say('lovey', 'Добро пожаловать в Игровой рай и казино Теда И. Бэра! Весело, азартно и без мафии!');
    yield* giveToken(g, 'Держите жетон. Символический.');
    yield g.say('max', 'Сэм, у него голова мишки! Он из мафии!');
    yield g.say('sam', 'Это костюм, Макс. Надеюсь.');
    yield g.say('lovey', 'Это костюм! И я не из мафии! Мафии здесь нет! Мы даже табличку повесили!');
  }

  TALK.lovey = {
    options: [
      { id: 'who', icon: 'f:lovey', text: 'Кто вы?', run: function* (g) {
        yield g.say('lovey', 'Лапочка! Встречаю гостей. Раздаю жетоны, улыбаюсь. Улыбка у меня нарисованная, но искренняя.');
      } },
      { id: 'mafia', icon: 'ex', text: 'А мафия здесь есть?', run: function* (g) {
        yield g.say('lovey', 'Мафия? Здесь? Нет! Ни капли! Табличку «Без мафии» мы сами повесили. Сама мафия и повесила. То есть администрация!');
        yield g.say('sam', 'Понятно.');
        yield g.say('lovey', 'Ничего вам не понятно!');
      } },
      { id: 'ted', icon: 'f:ted', text: 'Кто такой Тед И. Бэр?', run: function* (g) {
        yield g.say('lovey', 'Наш маскот! Добрый весёлый мишка! Заказывает он только пиццу. Иногда на людей. В смысле, на компанию!');
        yield g.say('lovey', 'Сам он сидит в задней комнате. Которой нет. Забудьте, что я сказал.');
      } },
      { id: 'token', icon: 'token', text: 'Можно ещё жетон?', when: g => !g.has('token'), run: function* (g) {
        yield* giveToken(g, 'Конечно! У гостя всегда должен быть жетон. Грустный гость уходит, а уходить от нас не принято.');
      } },
      { id: 'look', icon: 'mole', text: 'Мы ищем одного человека.', run: function* (g) {
        yield g.say('lovey', 'У нас много людей. В основном проигравших. Выигравший один, его зовут Леонард, он сидит за покерным столом.');
      } },
      { id: 'code', icon: 'rug', text: E.CODE, run: function* (g) {
        yield g.say('lovey', 'Ковёр? Шторы? У нас всё в тон! Мишки на ковре, мишки на шторах! Приятного отдыха!');
        yield g.say('sam', 'Не крот. Слишком жизнерадостный.');
        g.f.codeLovey = true;
      } },
      { id: 'meat', icon: 'sandwich', text: 'Куда делся сэндвич из витрины?', when: g => g.f.meatStolen && !g.f.meatDone, run: function* (g) {
        yield g.say('lovey', 'Сэндвич? Какой сэндвич? Витрина всегда была пустая! То есть нет! Ограбление! Мама!');
      } },
      { id: 'bye', icon: 'bye', text: 'Пойдём осмотримся.', end: true, run: function* (g) {
        yield g.say('lovey', 'Помните: пока вы проигрываете, мы выигрываем!');
      } }
    ]
  };

  function* pit(g) {
    const max = g.actors.max;
    max.scripted = true;
    yield g.walkTo('max', 346, 178);
    g.sfx('boing');
    max.visible = false;
    yield 1.0;
    g.sfx('boing');
    max.visible = true;
    max.scripted = false;
    if (!g.seen.pitToken && !g.has('token')) {
      g.seen.pitToken = 1;
      yield g.say('max', 'Смотри, что я нашёл! Жетон! И чей-то зуб! Зуб оставлю себе!');
      g.give('token');
      return;
    }
    const lines = ['Шарики! Шарики везде! Я живу здесь теперь!', 'Сэм, на дне кто-то есть! Нет, это я.', 'Я нырнул так глубоко, что видел мафию. Шучу. Видел носок.'];
    yield g.say('max', lines[(g.count('pit') - 1) % lines.length]);
  }

  ROOMS.playland = {
    id: 'playland', name: 'Игровой рай Теда И. Бэра', w: 480, music: 'playland',
    paint: b => S.BG.playland(b),
    walk: [[6, 156, 474, 156, 474, 198, 6, 198]],
    block: [[290, 150, 406, 150, 406, 176, 290, 176]],
    layers: [
      { id: 'caseGlass', x: 124, y: 82, base: 152, key: g => g.f.meatStolen ? 'e' : '' },
      { id: 'whack', x: 180, y: 56, base: 154, key: g => Math.floor(g.time * 2) % 10 },
      { id: 'pit', x: 292, y: 142, base: 176 }
    ],
    hot: [
      { id: 'exit', name: 'Выход к машине', rect: [22, 84, 44, 54], walk: [44, 168], face: 'w',
        look: 'Выход через пасть огромного мишки. Внутрь входишь с опаской, наружу выходишь без денег.',
        exit: function* (g) { g.sfx('door'); yield* S.openMap(g); } },
      { id: 'bighead', name: 'Голова Теда И. Бэра', rect: [2, 10, 86, 74],
        look: 'Голова Теда И. Бэра над входом. Ресницы у мишки длиннее, чем у Сибил. Зубы размером с меня.' },
      { id: 'poster', name: 'Табличка', rect: [96, 26, 44, 26], look: '«Без мафии!» Табличку повесили так старательно, что сразу хочется проверить.' },
      { id: 'case', name: g => g.f.meatStolen ? 'Пустая витрина' : 'Оригинальный сэндвич', rect: [124, 82, 40, 70], walk: [146, 168], face: 'n',
        look: g => g.f.meatDone ? 'Витрина пустая. Чаклз унёс сэндвич в заднюю комнату. Говорит, для церемонии.' : g.f.meatStolen ? 'Витрина пуста. Внутри крошки и отпечаток большого пальца. Отпечаток, если приглядеться, усатый.' : 'Оригинальный сэндвич с фрикадельками под стеклом. Табличка: «Руками не трогать. Зубами тем более».',
        use: function* (g) {
          if (g.f.meatStolen) { yield g.say('sam', 'Трогать пустую витрину? Отпечатков там и так хватает.'); return; }
          yield g.say('max', 'Сэм, давай его съедим! Он смотрит на меня фрикадельками!');
          yield g.say('sam', 'Это оригинал, Макс. Оригиналы не едят. Их берегут, чтобы потом никто не съел.');
        },
        items: { gun: 'Стрелять по сэндвичу? Меня сразу примут в мафию. В качестве мишени.' } },
      { id: 'whack', name: '«Прихлопни крысу!»', rect: [180, 56, 60, 98], walk: [210, 164], face: 'n',
        look: 'Автомат «Прихлопни крысу!». Крысы выглядывают из норок и поют. Джимми бы оскорбился. Или попросил процент.',
        use: function* (g) { yield* E.startWhack(g); },
        items: {
          token: function* (g) { yield* E.startWhack(g); },
          tokens: function* (g) { yield* E.startWhack(g); },
          gun: 'Пистолет у автомата свой, на цепочке. Мой ему не понравится.'
        } },
      { id: 'rules', name: 'Правила', rect: [246, 76, 32, 36], walk: [262, 164], face: 'n',
        look: '«Прихлопни крысу!» Стреляйте в поющих крыс. Молчаливые не считаются. Двадцать поющих за сорок пять секунд, и приз ваш. Ниже мелко: «Крыс не кормить».' },
      { id: 'heads', name: 'Поющие мишки', rect: [254, 14, 164, 62], walk: [334, 180], face: 'n',
        look: 'Три мишкины головы на золотых звёздах. Глаза стеклянные, рты открыты. Надеюсь, для пения.',
        use: function* (g) {
          g.sfx('ratsing');
          yield sing(g, 'У Теда И. Бэра весело всегда!');
          yield sing(g, 'Карты, сэндвичи, жетоны, а мафии нет и следа!');
          yield g.say('sam', 'Жуткая песня. Особенно та часть, где нет мафии.');
        },
        talk: function* (g) { g.sfx('ratsing'); yield sing(g, 'Приходите к мишке Теду! Вам понравится! Иначе...'); yield sing(g, 'Иначе вам всё равно понравится!'); },
        items: { gun: 'Стрелять в поющие головы? Они поют про отсутствие мафии. Мне ещё нужно в этом убедиться.' } },
      { id: 'balloons', name: 'Шарики', rect: [294, 62, 30, 18], walk: [306, 184], face: 'n', look: 'Воздушные шарики. На одном написано «Тед И. Бэр любит тебя». На другом «Молчи».' },
      { id: 'pit', name: 'Сухой бассейн', rect: [292, 142, 112, 34], walk: [346, 184], face: 'n',
        look: 'Сухой бассейн с шариками. Табличка: «До двенадцати лет». Макс считает, что ему как раз двенадцать. Уже давно.',
        use: function* (g) { yield* pit(g); },
        items: { max: function* (g) { yield* pit(g); }, roach: 'Жучка в шарики? Я его потом не найду. А он будет докладывать оттуда всю жизнь.' } },
      { id: 'drapes', name: 'Шторы', rect: [420, 52, 16, 88], walk: [444, 164], face: 'n',
        look: 'Шторы фиолетовые, ковёр фиолетовый. Подходят. Если бы крот был здесь, он бы уже дал мне пощёчину.' },
      { id: 'casinodoor', name: 'Казино', rect: [436, 54, 44, 86], walk: [452, 164], face: 'e',
        look: 'Проход в казино. Из-за штор доносится звон жетонов и чей-то плач.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('casino', { x: 30, y: 172, dir: 'e' }); } }
    ],
    actors: {
      lovey: {
        name: 'Лапочка', walk: [130, 172], face: 'w', dist: 26, when: g => g.actors.lovey.room === 'playland',
        look: 'Лапочка, мишка-швейцар. Жёлтая голова, шляпа, полосатый костюм и улыбка, приклеенная намертво.',
        talk: function* (g) { yield g.talkTo('lovey'); },
        items: {
          gun: function* (g) { yield g.say('lovey', 'Оружие сдавать не нужно! У нас свободная зона! То есть у нас его нет! Ни у кого!'); },
          roach: function* (g) { yield* E.bugPlant(g, 'lovey'); },
          token: function* (g) { yield g.say('lovey', 'Жетон мне? Нет-нет, жетоны дарю я. Это моя работа. Единственная.'); },
          ace: function* (g) { yield g.say('lovey', 'Туз? Садитесь за покер! Там Леонард! Он всех обыгрывает. Честно. Почти.'); },
          bearbox: function* (g) { yield g.say('lovey', 'Это для лавки на вашей улице! Не мне! Мне нельзя, у меня аллергия на ответственность.'); },
          max: function* (g) { yield g.say('max', 'Можно потрогать вашу голову?'); yield g.say('lovey', 'Нельзя! Она настоящая! То есть ненастоящая! То есть нельзя!'); }
        }
      }
    },
    enter: function* (g) {
      if (!g.f.casinoSeen) { yield* greet(g); return; }
      if (!g.has('token') && !g.has('tokens') && g.actors.lovey.room === 'playland' && !g.f.inducted) yield* giveToken(g, 'Жетон для постоянного гостя! Грустить у нас запрещено.');
    },
    setup(g) {
      const lv = g.actors.lovey;
      if (!g.f.inducted) { g.place('lovey', 'playland', 104, 170, 'e'); lv.visible = true; lv.act = ''; lv.keepAct = false; }
      else g.place('lovey', 'nowhere', 0, 0);
    },
    onLoad(g) { ROOMS.playland.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
