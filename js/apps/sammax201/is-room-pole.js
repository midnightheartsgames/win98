(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP201;
  const { ROOMS, TALK } = E;
  const A = S.art201;

  const PORTALS = { future: [36, 112], past: [232, 112], present: [540, 112] };

  E.portalBack = function (f, g, cx, x, y, kind) {
    A.portal(f, Math.round(x - cx), y, kind, g.time);
  };

  function* growTopiary(g) {
    if (g.f.topiary) { yield g.say('sam', 'Кустик и так дорос до окна Санты. Дальше ему расти некуда, разве что в комнату.'); return; }
    yield g.anim('sam', 'reach', 0.6);
    g.sfx('splash');
    g.drop('can');
    yield 0.6;
    g.sfx('swell');
    g.fx.shake = 0.6;
    g.f.topiary = true;
    yield 1;
    yield g.say('sam', 'Эльфийские слёзы подействовали. Кустик вымахал до второго этажа и упёрся макушкой в окно Санты.');
    yield g.say('max', 'Сэм! Это самый быстрый садовник в мире! И он плакал!');
  }

  function* fuelSleigh(g) {
    if (!g.f.coalGot) { yield g.say('sam', 'Носок Стинки в котёл? Он гореть не будет. Он будет пахнуть.'); return; }
    if (!g.f.demonOut) { yield g.say('sam', 'Уголь в котёл класть рано. Сани прогорят вхолостую, а носок с углём у меня один.'); return; }
    if (g.f.futureDone) { yield g.say('sam', 'Котёл и так горит. Сани своё отлетали.'); return; }
    yield g.anim('sam', 'reach', 0.6);
    g.drop('sock');
    g.sfx('sizzle');
    yield 0.6;
    g.sfx('engine');
    yield g.say('sam', 'Уголь из носка Стинки горит жарко и неприятно. Котёл запыхтел. Сани дрогнули и сами повернулись к порталу в будущее.');
    yield g.say('max', 'В будущее! Сэм, я хочу узнать, кем я стану! Президентом Земли!');
    yield* E.toFuture(g);
  }

  E.toFuture = function* (g) {
    const max = g.actors.max;
    max.scripted = true;
    g.hideUI = true;
    yield g.fadeOut(3);
    g.closeup = { kind: 'future21', t0: g.time, stage: 0 };
    g.music('future21');
    yield g.fadeIn(3);
    const at = { x: 160, y: 196 };
    yield g.say('fsam', 'Ну наконец-то. Двадцать лет мы ждём на этом камне.', at);
    yield g.say('fmax', 'Мы помнили, что вы прилетите! Вы опоздали на четыре минуты!', at);
    yield g.say('max', 'Сэм! Это мы! Я старый! Я великолепен!', at);
    yield g.say('fmax', 'Ты великолепен.', at);
    yield g.say('sam', 'Что здесь случилось?', at);
    yield g.say('fsam', 'Рождество, двадцать лет спустя. Кто-то забыл прислать за нами сани. Это были вы. То есть мы.', at);
    g.closeup.stage = 1;
    g.sfx('whoosh');
    yield g.say('fsam', 'Подвиньтесь. Вчетвером в санях тесно, но к тесноте мы на камне привыкли.', at);
    yield 1.2;
    yield g.fadeOut(3);
    g.closeup = null;
    g.f.futureDone = true;
    g.music('pole21');
    g.place('fsam', 'pole', 90, 176, 'w');
    g.place('fmax', 'pole', 70, 178, 'w');
    g.place('sam', 'pole', 150, 172, 'w');
    g.place('max', 'pole', 176, 174, 'w');
    yield g.fadeIn(3);
    g.hideUI = false;
    yield g.say('fsam', 'Дальше мы сами. У нас в будущем дела. Мы на них уже опаздываем.');
    yield g.say('fmax', 'Пока, маленький я! Не взрывай Луну! Я пробовал, это скучно!');
    const fs = g.actors.fsam, fm = g.actors.fmax;
    fs.scripted = fm.scripted = true;
    yield [g.walkTo('fsam', 36, 170), g.walkTo('fmax', 30, 174)];
    g.sfx('whoosh');
    g.place('fsam', 'nowhere', 0, 0);
    g.place('fmax', 'nowhere', 0, 0);
    fs.scripted = fm.scripted = false;
    g.anim('gfut', 'nod', 1.2);
    yield 1.2;
    g.sfx('chime');
    yield g.say('sam', 'Дух Будущего Рождества кивнул и ушёл в снежный шар. Слов он не тратит.');
    max.scripted = false;
    yield* E.globeFull(g);
  };

  E.globeFull = function* (g) {
    if (E.spiritsIn(g) < 3 || g.seen.globeFull) return;
    g.seen.globeFull = 1;
    yield g.say('max', 'Сэм! Шар полный! Внутри метель и три Санты!');
  };

  function* jellyDemon(g) {
    const n = E.spiritsIn(g);
    if (n < 3) {
      yield g.say('sam', 'Духи в шаре шевелятся, но наружу не идут. Их там ' + (n ? n + ' из трёх' : 'ни одного') + '.');
      return;
    }
    const santa = g.actors.santa, demon = g.actors.demon, max = g.actors.max;
    santa.scripted = demon.scripted = max.scripted = true;
    g.hideUI = true;
    yield g.anim('sam', 'throw', 0.5);
    g.drop('globe');
    g.sfx('glass');
    g.fx.flash = 0.8;
    g.music('spirit21');
    for (const [id, x] of [['gpast', 470], ['gpres', 506], ['gfut', 538]]) g.place(id, 'pole', x, 172, 'w');
    yield g.say('gpast', 'Чуваки, держите его кольцом!');
    yield g.say('gpres', 'Быстрее. У меня ещё три года по расписанию.');
    g.anim('gfut', 'nod', 1);
    yield g.say('demon', 'Бла-а-аргх? Это нарушение регламента! Я пожалуюсь в профсоюз! У нас нет профсоюза!');
    g.sfx('hypno');
    g.fx.shake = 1;
    yield 1.4;
    g.place('demon', 'nowhere', 0, 0);
    g.f.jelly = true;
    g.sfx('splat');
    yield g.say('sam', 'Демон сжался, задрожал и стал холодцом. На тарелке. С морковкой.');
    yield g.say('gpast', 'Готово, старик. Рождество твоё. Мы полетели.');
    for (const id of ['gpast', 'gpres', 'gfut']) g.place(id, 'nowhere', 0, 0);
    g.sfx('whoosh');
    yield 0.6;
    g.place('santa', 'pole', 430, 150, 'w');
    santa.act = ''; santa.keepAct = false;
    g.sfx('thud');
    yield g.say('santa', 'Что тут у вас? Холодец? Три недели ничего не ел, кроме патронов.');
    yield g.walkTo('santa', 490, 170);
    santa.act = 'eat'; santa.keepAct = true;
    g.sfx('slurp');
    g.f.jelly = false;
    yield 1;
    yield g.say('max', 'Сэм! Он съел демона!');
    santa.act = ''; santa.keepAct = false;
    santa.v = 'evil';
    g.sfx('laugh');
    g.fx.shake = 0.6;
    g.f.santaEvil = true;
    g.music('finale21');
    yield g.say('santa', 'Хо. Хо. Хо. Квартальный план по страданиям будет перевыполнен. Все подарки отзываются!');
    yield g.walkTo('santa', 392, 152);
    g.place('santa', 'nowhere', 0, 0);
    g.sfx('door');
    yield g.say('sam', 'Санта ушёл в мастерскую. Демон теперь сидит в нём, и Санта этим доволен.');
    santa.scripted = demon.scripted = max.scripted = false;
    g.hideUI = false;
  }

  TALK.poppers = {
    start: function* (g) {
      if (g.seen.poppersHello) return;
      g.seen.poppersHello = 1;
      g.f.poppersMet = true;
      yield g.say('peepers', 'Это Сэм и Макс! Они пришли без очереди!');
      yield g.say('specs', 'Очередь живая, господа. Мы в ней с последнего выпуска шоу.');
    },
    options: [
      { id: 'why', icon: 'f:poppers', text: 'Что вы тут делаете?', run: function* (g) {
        yield g.say('specs', 'Ждём Санту. Девятнадцать лет, два месяца и четыре дня без подарков. Я считал.');
        yield g.say('peepers', 'Нам ни разу ничего не дарили! Даже когда мы были звёздами! Особенно когда мы были звёздами!');
        yield g.say('whizzer', 'И тут нет туалета!');
      } },
      { id: 'santa', icon: 'f:santa21', text: 'Почему не заходите?', run: function* (g) {
        yield g.say('specs', 'Санта стреляет в каждого, кто подходит к его двери. Мы ждём, когда у него кончатся патроны. По моим подсчётам, в марте.');
      } },
      { id: 'sleigh', icon: 'sleigh21', text: 'Что с санями?', run: function* (g) {
        yield g.say('whizzer', 'Сани паровые. Санта топит их углём. Говорит, непослушным уголь в носок, а саням в котёл.');
        yield g.say('peepers', 'А послушным ничего! Мы проверяли!');
      } },
      { id: 'snow', icon: 'snow21', text: 'Что за пункт с жёлтым снегом?', run: function* (g) {
        yield g.say('specs', 'Переработка. Не спрашивайте.');
        yield g.say('whizzer', 'Я туда ничего не сдавал! Почти ничего!');
      } },
      { id: 'bye', icon: 'bye', text: 'Стойте дальше.', end: true, run: function* (g) { yield g.say('specs', 'Стоим. Это единственное, что у нас хорошо получается.'); } }
    ]
  };

  const POPPER = (name, look) => ({
    name, walk: [300, 172], face: 'e', look,
    talk: function* (g) { yield g.talkTo('poppers'); },
    use: 'Трогать бывших детских звёзд опасно. Они сразу зовут адвоката.',
    items: {
      gun: function* (g) { yield g.say('peepers', 'Он целится в нас! Как в восемьдесят втором!'); },
      max: function* (g) { yield g.say('max', 'Попперы! Хотите автограф президента?'); yield g.say('specs', 'Мы не берём автографы у тех, кто младше нас по рейтингу.'); },
      snow: function* (g) { yield g.say('whizzer', 'Я тут ни при чём! Совсем ни при чём!'); },
      '*': function* (g) { yield g.say('specs', 'Нам нужен подарок от Санты. От вас не считается.'); }
    }
  });

  ROOMS.pole = {
    id: 'pole', name: 'Северный полюс', w: 720, music: g => (g.f.santaEvil && !g.f.santaDown ? 'finale21' : g.f.demonOut && !g.f.jelly ? 'spirit21' : 'pole21'),
    scale: [140, 0.86, 196, 1.02],
    paint: b => S.BG.pole21(b),
    walk: [[6, 142, 714, 142, 714, 196, 6, 196]],
    layers: [
      { id: 'post', x: 682, y: 120, base: 141 },
      { id: 'sleigh', x: 68, y: 104, base: 178, key: g => (g.f.futureDone ? 'l' + Math.floor(g.time * 8) % 6 : '') },
      { id: 'topiary', x: 440, y: 20, base: 150, key: g => (g.f.topiary ? 'b' : 's') },
      { id: 'desoto', x: 586, y: 150, base: 196 },
      { id: 'jelly', x: 474, y: 158, base: 177, when: g => g.f.jelly }
    ],
    drawBack(f, g, cx) {
      if (!g.f.demonOut) return;
      for (const [kind, [x, y]] of Object.entries(PORTALS)) E.portalBack(f, g, cx, x, y, kind);
    },
    drawFront(f, g) {
      for (let i = 0; i < 60; i++) {
        const sp = 14 + (i % 5) * 6;
        const x = Math.floor((S.hash(i, 5, 1) * 320 + Math.sin(g.time * 0.7 + i) * 10 + 320) % 320);
        const y = Math.floor((S.hash(i, 5, 2) * 200 + g.time * sp) % 200);
        f.set(x, y, i % 4 ? C.grey[5] : C.glow);
      }
    },
    hot: [
      { id: 'workshop', name: 'Мастерская Санты', rect: [372, 92, 38, 58], walk: [392, 156], face: 'n',
        look: 'Дверь мастерской. Венок, колокольчик, табличка «Стучите». Изнутри время от времени стреляют.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('workshop', g.f.santaEvil && !g.f.santaDown ? { x: 170, y: 172, dir: 'e' } : { x: 40, y: 170, dir: 'e' }); } },
      { id: 'house', name: 'Мастерская', rect: [262, 14, 258, 76], look: 'Мастерская Санты. Большой деревянный дом с красной крышей. На крыше труба, из трубы дым, из окна второго этажа время от времени вылетают пули.' },
      { id: 'santawin', name: 'Окно Санты', rect: [444, 22, 34, 26], look: g => g.f.topiary ? 'Окно Санты. Кустик упирается в него макушкой.' : 'Окно второго этажа. Там комната Санты. До неё метров пять гладкой стены.' },
      { id: 'topiary', name: g => (g.f.topiary ? 'Огромный куст' : 'Кустик'), rect: [440, 130, 40, 20], when: g => !g.f.topiary, walk: [462, 156], face: 'n',
        look: 'Крошечный кустик в горшке прямо под окном Санты. Табличка: «Поливать только слезами эльфа. Растёт быстро». Пока не растёт.',
        use: 'Тянуть кустик за уши бесполезно. Ушей у него нет.',
        items: {
          can: function* (g) { yield* growTopiary(g); },
          snow: 'Жёлтым снегом поливать? Табличка требует слёз. Это разные жидкости.',
          gun: 'Стрелять в кустик? Он и так маленький.'
        } },
      { id: 'topiaryb', name: 'Огромный куст', rect: [440, 26, 40, 124], when: g => g.f.topiary, walk: [462, 156], face: 'n',
        look: 'Куст до второго этажа. Подстрижен ёлочкой. По нему удобно лезть, если не бояться иголок.',
        exit: function* (g) {
          if (g.f.santaEvil && !g.f.santaDown) { yield g.say('sam', 'Санта сейчас в мастерской. В его комнате делать нечего.'); return; }
          g.sfx('rip');
          yield* g.goRoom('santa', { x: 150, y: 160, dir: 's' }, { from: 'window' });
        } },
      { id: 'sleigh', name: 'Сани Санты', rect: [92, 132, 100, 46], walk: [140, 182], face: 'n',
        look: g => g.f.futureDone ? 'Сани Санты. Котёл тихо догорает. Полозья в лаве, потом в снегу.' : 'Сани Санты. Красные, с позолотой и паровым котлом. Котёл холодный. Оленей нет.',
        use: 'Без пара сани не поедут. Толкать их я не нанимался.',
        items: { sock: function* (g) { yield* fuelSleigh(g); }, gun: 'Стрелять в сани Санты? Сразу в список непослушных.' } },
      { id: 'boiler', name: 'Котёл саней', rect: [84, 114, 22, 46], walk: [98, 176], face: 'w',
        look: g => g.f.futureDone ? 'Котёл горит. Из трубы идёт дым, пахнет носком.' : 'Паровой котёл саней. На дверце надпись: «Только уголь». Внутри холодно и пусто.',
        use: 'Дверца котла открыта. Внутри пусто, как в моих карманах после Рождества.',
        items: { sock: function* (g) { yield* fuelSleigh(g); }, snow: 'Снегом котёл не топят. Даже жёлтым.', record: 'Пластинку в котёл? Изгнание сгорит вместе с ней.' } },
      { id: 'stand', name: 'Пункт переработки', rect: [566, 96, 58, 48], walk: [592, 156], face: 'n',
        look: '«Переработка жёлтого снега». В ящике лежат готовые снежки. Жёлтые. Ровные. Ни одного вопроса.',
        use: function* (g) {
          if (g.has('snow')) { yield g.say('sam', 'Один жёлтый снежок у меня уже есть. Это больше, чем нужно любому человеку.'); return; }
          if (g.f.presentDone) { yield g.say('sam', 'Снежок мне больше не нужен. И вообще никогда.'); return; }
          if (!g.f.presentSeen) { yield g.say('sam', 'Брать жёлтый снег без веской причины я не стану.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.give('snow');
          g.f.snowGot = true;
          yield g.say('sam', 'Двумя пальцами. Сержант просил зиму. Вот ему зима, армейского цвета.');
        } },
      { id: 'post', name: 'Указатель', rect: [656, 96, 62, 44], walk: [676, 150], face: 'n', look: '«Северный полюс». Столб полосатый, как карамель. Компас у Макса показывает на него и вертится.' },
      { id: 'desoto', name: 'Де Сото', rect: [588, 152, 128, 40], walk: [650, 172], face: 's',
        look: 'Наш Де Сото. Покрылся инеем и выглядит недовольным.',
        use: function* (g) { yield* E.drive(g); } },
      { id: 'pfuture', name: 'Портал в будущее', rect: [14, 78, 44, 68], when: g => g.f.demonOut, walk: [60, 170], face: 'w',
        look: g => g.f.futureDone ? 'Портал в будущее. Внутри лава остывает. Камень пустой.' : 'Портал в будущее. Внутри лава до горизонта и маленький камень. На камне кто-то сидит.',
        use: g => g.f.futureDone ? 'В будущее мне больше не надо. Я туда и так попаду, медленно.' : 'Сразу за краем лава. Пешком туда не войти.' },
      { id: 'ppast', name: 'Портал в прошлое', rect: [210, 78, 44, 68], when: g => g.f.demonOut, walk: [232, 160], face: 'n',
        look: g => g.f.pastDone ? 'Портал в прошлое. Внутри тихо, пахнет старыми обоями.' : 'Портал в прошлое. Внутри старая комната с обоями в цветочек и телевизор. Комната кажется знакомой.',
        exit: function* (g) { g.sfx('whoosh'); yield* g.goRoom('past', { x: 280, y: 170, dir: 'w' }, { from: 'portal' }); } },
      { id: 'ppresent', name: 'Портал в настоящее', rect: [518, 78, 44, 68], when: g => g.f.demonOut, walk: [540, 162], face: 'n',
        look: g => g.f.presentDone ? 'Портал в настоящее Рождество. Там тихо и чисто.' : 'Портал в настоящее Рождество. Внутри закусочная «У Стинки», и она шевелится.',
        exit: function* (g) { g.sfx('whoosh'); yield* g.goRoom('stinkyx', { x: 40, y: 172, dir: 'e' }, { from: 'portal' }); } }
    ],
    actors: {
      specs: POPPER('Спекс', 'Спекс из «Сода-Попперов». В очках и шарфе. Стоит первым в очереди и считает дни.'),
      whizzer: POPPER('Уиззер', 'Уиззер из «Сода-Попперов». Переминается с ноги на ногу. На морозе ему труднее всех.'),
      peepers: POPPER('Пиперс', 'Пиперс из «Сода-Попперов». Глаза как два блюдца. Самый младший и самый обиженный.'),
      demon: {
        name: 'Шаркающее Корпоративное Присутствие', walk: [470, 170], face: 'e',
        look: 'Шаркающее Корпоративное Присутствие. Синий студень с глазами и галстуком. Сидит в снегу и что-то подсчитывает на сосульке.',
        talk: function* (g) {
          yield g.say('demon', 'Бла-а-аргх? Встречи только по записи. Запись на прошлый квартал закрыта.');
          yield g.say('sam', 'Он оптимизирует страдания. На полюсе это несложно.');
        },
        use: 'Трогать демона голыми лапами? Он липкий и, судя по галстуку, юрист.',
        items: {
          globe: function* (g) { yield* jellyDemon(g); },
          gun: function* (g) { yield g.anim('sam', 'shoot', 0.4); g.sfx('gun'); yield g.say('demon', 'Щекотно. Оформите это как служебную записку.'); },
          snow: 'Жёлтый снежок в демона? Он его съест и попросит ещё.',
          record: 'Петь ему второй раз? Он уже пришёл. Больше его звать незачем.',
          max: function* (g) { yield g.say('max', 'Можно я его укушу?'); yield g.say('demon', 'Бла-а-аргх. Подпишите отказ от претензий.'); },
          '*': function* (g) { yield g.say('demon', 'Отклонено. Подайте через отдел.'); }
        }
      },
      santa: {
        name: 'Санта', walk: [420, 156], face: 'n',
        look: 'Санта на крыше. Целится в демона и не попадает. Демон каждый раз благодарит за внимание.',
        talk: 'Санта на крыше и стреляет. Отсюда он меня не услышит, и я этому рад.'
      },
      gpast: {
        name: 'Дух Прошлого Рождества', walk: [250, 166], face: 'w',
        look: g => g.f.pastDone ? 'Дух Прошлого Рождества уже в шаре. Здесь только отблеск.' : 'Дух Прошлого Рождества. Санта в цветах и с бусами. Пахнет благовониями и мандаринами.',
        talk: function* (g) {
          if (g.f.pastDone) { yield g.say('gpast', 'Я уже в шаре, чувак. Это эхо.'); return; }
          yield g.say('gpast', 'Двадцать лет назад, чувак. Рождество одной семьи. Вы его испортили.');
          yield g.say('sam', 'Двадцать лет назад нас там не было.');
          yield g.say('gpast', 'Пока не было. Время, оно как пластинка. Крутится.');
        }
      },
      gpres: {
        name: 'Дух Настоящего Рождества', walk: [520, 166], face: 'e',
        look: g => g.f.presentDone ? 'Дух Настоящего Рождества уже в шаре. Здесь только отблеск.' : 'Дух Настоящего Рождества. Как Санта, только с часами и без терпения.',
        talk: function* (g) {
          if (g.f.presentDone) { yield g.say('gpres', 'Я уже в шаре. Не отвлекайте.'); return; }
          yield g.say('gpres', 'Это Рождество через неделю. Его вы испортили на этой неделе. Идите и смотрите.');
        }
      },
      gfut: {
        name: 'Дух Будущего Рождества', walk: [70, 166], face: 'w',
        look: g => g.f.futureDone ? 'Дух Будущего Рождества уже в шаре.' : 'Дух Будущего Рождества. Капюшон, два огонька вместо глаз. Молчит.',
        talk: function* (g) {
          if (g.f.futureDone) { yield g.say('sam', 'Дух Будущего в шаре. И раньше молчал, и теперь молчит.'); return; }
          g.anim('gfut', 'nod', 1.2);
          yield g.say('sam', 'Это будущее испортили мы?');
          yield 1.2;
          yield g.say('sam', 'Кивнул. Дух Настоящего говорит, что он просто стесняется.');
        }
      }
    },
    enter: function* (g, from) {
      if (!g.f.poleSeen) {
        g.f.poleSeen = true;
        g.sfx('tommy');
        yield g.say('sam', 'Северный полюс. Мастерская Санты, сани без оленей и очередь из трёх бывших детских звёзд.');
        yield g.say('max', 'Сэм! Изнутри стреляют! Санта нас ждёт!');
        return;
      }
      if (g.f.demonOut && !g.seen.portals) {
        g.seen.portals = 1;
        yield g.say('sam', 'У мастерской открылись три портала. Демон сидит в снегу и считает на сосульке. Санта на крыше целится в него и промахивается.');
      }
    },
    setup(g) {
      g.place('specs', 'pole', 290, 160, 'e');
      g.place('whizzer', 'pole', 314, 162, 'e');
      g.place('peepers', 'pole', 336, 160, 'e');
      const santa = g.actors.santa;
      if (g.f.demonOut && !g.f.jelly && !g.f.santaEvil) {
        g.place('demon', 'pole', 476, 172, 'w');
        g.place('santa', 'pole', 432, 48, 'e');
        santa.act = 'shoot'; santa.keepAct = true; santa.v = '';
      } else {
        if (g.actors.demon.room === 'pole') g.place('demon', 'nowhere', 0, 0);
        if (santa.room === 'pole') g.place('santa', 'nowhere', 0, 0);
        santa.act = ''; santa.keepAct = false;
      }
      for (const [id, ok, x] of [['gfut', !g.f.futureDone, 72], ['gpast', !g.f.pastDone, 258], ['gpres', !g.f.presentDone, 516]]) {
        if (g.f.demonOut && ok && !g.f.santaEvil) g.place(id, 'pole', x, 170, 's');
        else if (g.actors[id].room === 'pole') g.place(id, 'nowhere', 0, 0);
      }
    },
    ambient: function* (g) {
      for (;;) {
        yield 2.5 + g.rng.next() * 3;
        if (g.actors.santa.room === 'pole' && g.actors.santa.act === 'shoot') g.sfx('tommy');
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
