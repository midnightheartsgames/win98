(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP103;
  const { ROOMS } = E;
  const EXT = [206, 148];
  const LEVER = [158, 168];
  const DROP = [284, 150];

  function stage(g) { return g.f.fac || ''; }

  function hint(g) {
    const s = stage(g);
    if (s === 'hypno') return 'Сэм! Шёпотом! Он хочет, чтобы ты меня застрелил! У тебя есть пистолет с пистонами! Стреляй в меня им! Я красиво умру!';
    if (s === 'panic') return 'Он под пылесосом! Дёргай рычаг, Сэм! Рычаг у котла!';
    if (!g.has('screwdriver') && !g.f.boxOut) return 'Я мёртвый, но я вижу отвёртку на верстаке. Мёртвые всё видят.';
    if (!g.f.boxOut) return 'Открути панель на Мишке-бандите! Внутри голосовой блок! Он кричит «Ты в огне!»';
    if (!g.has('voicebox') && !g.f.boxIn && !g.f.bearReady && !g.has('firebear')) return 'Возьми голосовой блок из лотка бандита!';
    if (g.has('voicebox')) return 'Брось голосовой блок в оранжевый ящик! Робот вставит его в мишку!';
    if (!g.has('firebear')) return 'Мишка с новым голосом упал с конвейера! Подбери его!';
    return 'Дай мишку Дону! Он их тискает, как ненормальный! Пусть мишка скажет ему, что он в огне!';
  }

  function* arrive(g) {
    const ted = g.actors.ted, sam = g.actors.sam, max = g.actors.max;
    g.f.fac = 'hypno';
    g.f.frozen = true;
    g.hideUI = true;
    max.scripted = true;
    g.place('ted', 'factory', 380, 166, 'w');
    ted.visible = true; ted.v = ''; ted.act = 'gun'; ted.keepAct = true;
    yield g.walkTo('sam', 324, 172);
    g.face('sam', 'e');
    yield g.walkTo('max', 296, 180);
    g.face('max', 'e');
    yield g.say('ted', 'Вы вернулись! Невероятно! Но ни шагу ближе! У меня пистолет и мишка. И то и другое заряжено!');
    ted.act = 'hypno';
    g.sfx('hypno');
    g.fx.hypno = 1;
    g.music('hypno');
    yield g.say('ted', 'Смотрите в глаза мишке... Глубже... Глубже... Вы слушаетесь Теда И. Бэра...');
    yield g.say('sam', 'Под шляпой тихо звенит дуршлаг. Шлем держит.', { color: C.grey[4] });
    yield g.say('max', 'Мистер Мишка из шкафа смотрел страшнее! Я неделю тренировался!', { color: C.grey[4] });
    sam.act = 'hypno'; sam.keepAct = true;
    yield g.say('sam', 'Мы... слушаемся... Мастер.');
    yield g.say('max', 'Слушаемся... и повинуемся... и хотим бутерброд.');
    g.fx.hypno = 0;
    g.music('factory');
    ted.act = 'gun';
    yield g.say('ted', 'Проверим, насколько глубоко. Пёс! Пристрели кролика!');
    g.hideUI = false;
  }

  function* shootMax(g, real) {
    const ted = g.actors.ted, sam = g.actors.sam, max = g.actors.max;
    if (real) { yield g.say('sam', 'Настоящим? Нет. Даже ради спектакля. Особенно ради спектакля.', { color: C.grey[4] }); return; }
    g.faceTo('sam', max.x);
    sam.act = 'shoot'; sam.keepAct = false; sam.actT = 0.6;
    g.sfx('cap');
    g.fx.flash = 0.2;
    yield 0.6;
    max.act = 'grin'; max.keepAct = true;
    yield g.say('max', 'А-а-ах! Сэм... Ты... Как ты мог... Я помню, как мы впервые встретились... Нет, не помню. Но это было прекрасно!');
    yield g.say('max', 'Передай маме... у меня нет мамы... передай кому-нибудь... что я любил всё, что взрывается!');
    yield g.say('max', 'Темнеет... Я вижу свет... Там буфет... Бесплатный! Иду к тебе, буфет!');
    max.act = 'dead'; max.keepAct = true;
    g.sfx('thud');
    yield 0.8;
    yield g.say('ted', 'Если он скажет ещё хоть слово, стреляй снова.');
    yield 0.6;
    yield g.say('ted', 'Превосходно. Ты мой, пёс. Стой здесь и охраняй кролика. Мне надо позвонить Чаклзу.');
    g.f.fac = 'free';
    g.f.frozen = false;
    sam.act = ''; sam.keepAct = false;
    g.drop('capgun');
    ted.scripted = true;
    yield g.walkTo('ted', 440, 170);
    g.face('ted', 'n');
    ted.act = ''; ted.keepAct = false;
    ted.scripted = false;
    g.f.maxDead = true;
  }

  function* openBandit(g) {
    if (g.f.boxOut) { yield g.say('sam', 'Панель уже снята. Внутри провода и запах фрикаделек.'); return; }
    if (!g.has('screwdriver')) { yield g.say('sam', 'Панель на четырёх винтах. Мафия закручивает на совесть, хотя совести у неё нет.'); return; }
    yield g.anim('sam', 'reach', 0.8);
    g.sfx('click');
    g.f.boxOut = true;
    yield g.say('sam', 'Четыре винта, и мафия раскрылась. В лоток для выигрышей выпало что-то зелёное.');
    yield g.say(null, E.FIRE, { key: 'vbox', color: COLORS.slotvoice });
    yield g.say('sam', 'Голосовой блок. Тот самый, что кричит «Ты в огне!» всем, кто выиграл.');
  }

  function* dropBox(g) {
    const hb = g.actors.hbear;
    yield g.anim('sam', 'reach', 0.5);
    g.drop('voicebox');
    g.f.boxIn = true;
    g.sfx('servo');
    yield g.say('sam', 'Один зелёный среди красных. Робот хватает не глядя.');
    yield 1.2;
    g.sfx('servo');
    yield 1.0;
    g.sfx('thump');
    g.f.bearReady = true;
    g.place('hbear', 'factory', DROP[0], DROP[1], 's');
    hb.visible = true;
    yield g.say(null, E.FIRE, { key: 'vbox', color: COLORS.slotvoice, x: 284, y: 110 });
    yield g.say('sam', 'Контроль качества его не пропустил. Бракованный и крикливый. Мне он уже нравится.');
  }

  function* takeBear(g) {
    if (!g.f.bearReady || g.has('firebear')) return;
    yield g.anim('sam', 'reach', 0.5);
    g.place('hbear', 'nowhere', 0, 0);
    g.give('firebear');
    g.f.bearTaken = true;
    yield g.say('sam', 'Не сжимать. Не смотреть в глаза. Очень хочется и того и другого.');
  }

  function* giveBear(g) {
    const ted = g.actors.ted;
    if (stage(g) !== 'free') return;
    yield g.say('sam', 'Мастер. Этот мишка упал с конвейера. Он бракованный?');
    g.drop('firebear');
    ted.act = 'hypno'; ted.keepAct = true;
    yield g.say('ted', 'Бракованный? Мои мишки не бывают бракованными! Дай сюда. Иди к папочке...');
    g.sfx('hypno');
    yield g.say(null, E.FIRE, { key: 'vbox', color: COLORS.slotvoice, x: ted.x, y: 60 });
    yield g.say('ted', 'Я... в огне? Я В ОГНЕ! Я ГОРЮ!');
    ted.act = 'panic'; ted.keepAct = true;
    ted.scripted = true;
    g.sfx('alarm');
    yield g.walkTo('ted', EXT[0], EXT[1], { speed: 1.8 });
    g.face('ted', 'n');
    ted.act = 'pull';
    g.f.fac = 'panic';
    yield g.say('ted', 'Огнетушитель! Он прикручен! Кто прикрутил огнетушитель?! Я прикрутил! Чтобы не украли!');
    ted.scripted = false;
  }

  function* pullLever(g) {
    const ted = g.actors.ted, max = g.actors.max, sam = g.actors.sam;
    const s = stage(g);
    if (s === 'hypno') { yield g.say('ted', 'Стоять, пёс! Сначала кролик!'); return; }
    if (s !== 'panic') {
      yield g.anim('sam', 'reach', 0.5);
      g.f.leverDown = true;
      g.sfx('vacuum');
      yield 0.8;
      g.f.leverDown = false;
      yield g.say('ted', 'Не трогай пылесос! Он для брака! Ты не брак, пёс. Пока.');
      return;
    }
    g.hideUI = true;
    yield g.anim('sam', 'reach', 0.6);
    g.f.leverDown = true;
    g.sfx('vacuum');
    ted.act = 'sucked'; ted.keepAct = true;
    ted.scripted = true;
    yield g.say('ted', 'Что это?! Меня тянет! Я не брак! Я Дон!');
    yield g.walkTo('ted', EXT[0] - 8, 96, { free: true, speed: 0.5 });
    g.fx.shake = 0.6;
    g.sfx('thud');
    yield g.say('ted', 'Я застрял! Я слишком большой для этой трубы! Это всё экзоскелет!');
    g.f.fac = 'boom';
    g.sfx('hiss');
    for (let i = 0; i < 5; i++) { g.f.pressure = 0.3 + i * 0.18; g.fx.shake = 0.3; yield 0.4; }
    max.act = ''; max.keepAct = false;
    max.scripted = true;
    yield g.say('max', 'Сэм! Стрелка на красном! Красный это хорошо или плохо?');
    yield g.say('sam', 'Для фабрики плохо. Для нас зависит от того, как быстро мы бегаем. БЕЖИМ!');
    g.sfx('alarm');
    yield g.say('max', 'Буфет, Сэм! В казино остался буфет! Там двенадцать канноли! Они ни в чём не виноваты!');
    yield g.fadeOut(1.5);
    sam.act = ''; sam.keepAct = false;
    g.f.frozen = false;
    g.closeup = { kind: 'boom', t0: g.time };
    g.music('mobchase');
    yield g.fadeIn(2);
    g.sfx('explosion');
    g.fx.flash = 1;
    g.fx.shake = 1.4;
    yield 1.6;
    g.sfx('explosion');
    yield 1.2;
    g.f.factoryGone = true;
    g.f.pressure = 0;
    ted.scripted = false;
    g.place('ted', 'nowhere', 0, 0);
    yield g.say('max', 'Сэм! Мы живы! Сэндвич тоже жив! Он у меня в ухе!', { x: 160, y: 190 });
    yield g.say('sam', 'Фабрика мишек ушла в небо. Вместе с казино, буфетом и доном.', { x: 160, y: 190 });
    yield g.fadeOut(1.5);
    g.closeup = null;
    g.setRoom('street');
    g.place('sam', 'nowhere', 0, 0);
    g.place('max', 'nowhere', 0, 0);
    const ch = g.actors.chuckles;
    g.place('chuckles', 'street', 600, 150, 'w');
    ch.visible = true; ch.act = ''; ch.keepAct = false; ch.scripted = true;
    g.camLock = 440;
    g.centerCam(true);
    g.fx.tint = [18, 22, 70, 0.4];
    g.music('mob');
    yield g.fadeIn(1.5);
    yield g.walkTo('chuckles', 520, 150);
    g.face('chuckles', 's');
    yield g.say('chuckles', 'Жаль Теда. Хороший был крот. Рыл быстро, думал медленно.', { x: 160, y: 190 });
    yield g.say('chuckles', 'Ничего. Мишек можно делать и в другом месте. Переходим к плану Б.', { x: 160, y: 190 });
    yield g.say('chuckles', 'В Вашингтоне любят плюшевые подарки.', { x: 160, y: 190 });
    yield g.walkTo('chuckles', 660, 150, { free: true });
    ch.scripted = false;
    g.place('chuckles', 'nowhere', 0, 0);
    g.camLock = null;
    g.fx.tint = null;
    g.place('sam', 'street', 300, 150, 's');
    g.place('max', 'street', 280, 152, 's');
    max.act = ''; max.keepAct = false; max.scripted = false; max.follow = 'sam';
    g.hideUI = false;
    yield* E.ending(g);
  }

  const w = (x, y) => g => g.f.frozen ? null : [x, y];

  ROOMS.factory = {
    id: 'factory', name: 'Фабрика мишек', w: 480, music: 'factory', noSave: true,
    paint: b => S.BG.factory(b),
    walk: [[6, 150, 474, 150, 474, 198, 6, 198]],
    block: [[18, 150, 94, 150, 94, 166, 18, 166]],
    maxHint: hint,
    layers: [
      { id: 'gauge', x: 102, y: 58, key: g => Math.round((g.f.pressure || 0) * 10) },
      { id: 'robot', x: 292, y: 26, key: g => Math.floor(g.time * 8) % 16 + (g.f.boxIn && !g.f.bearReady ? 'g' : '') },
      { id: 'belt', x: 228, y: 110, base: 144, key: g => Math.floor(g.time * 12) % 8 },
      { id: 'bin', x: 220, y: 124, base: 150 },
      { id: 'lever', x: 146, y: 112, base: 168, key: g => g.f.leverDown ? 'd' : '' },
      { id: 'bench', x: 18, y: 132, base: 168 },
      { id: 'bandit', x: 40, y: 86, base: 169, key: g => g.f.boxOut ? 'o' : '' },
      { id: 'screwdriver', x: 64, y: 130, base: 170, when: g => !g.has('screwdriver') && !g.f.screwTaken }
    ],
    sprites(g) {
      const out = [];
      const off = (g.time * 14) % 40;
      for (let i = 0; i < 7; i++) {
        const x = 470 - off - i * 40;
        if (x < 236) continue;
        out.push({ y: 143, draw: (f, cx) => { const sp = S.sprite('hbear', { act: i % 3 === 0 ? 'spin' : '', t: g.time }, 0.9); S.blit(f, sp.buf, Math.round(x - sp.ox - cx), Math.round(118 - sp.oy)); } });
      }
      if (g.f.fac === 'boom') {
        out.push({ y: 500, draw: (f, cx) => {
          for (let i = 0; i < 10; i++) {
            const a = S.hash(i, Math.floor(g.time * 10), 4) * Math.PI;
            S.line(f, 198 - cx + Math.cos(a) * 30, 88 + Math.sin(a) * 6, 198 - cx, 86, C.grey[4]);
          }
        } });
      }
      return out;
    },
    hot: [
      { id: 'door', name: 'Выход', rect: [440, 44, 40, 96], walk: w(452, 172), face: 'e',
        look: 'Дверь обратно в заднюю комнату. Табличка «Выход». Сейчас это скорее пожелание.',
        exit: function* (g) {
          const s = stage(g);
          if (s === 'hypno' || s === 'free' || s === 'panic') { yield g.say('ted', s === 'panic' ? 'Не уходи! Я горю! Помоги!' : 'Куда, пёс? Стоять.'); return; }
          g.sfx('door');
          yield* g.goRoom('backroom', { x: 280, y: 170, dir: 'w' });
        } },
      { id: 'window', name: 'Окна', rect: [24, 28, 144, 50], walk: w(96, 176), face: 'n', look: 'Ночной город. Где-то там Комиссар ждёт звонка. Сейчас лучше его не расстраивать.' },
      { id: 'boiler', name: 'Котёл', rect: [92, 38, 46, 94], walk: w(116, 172), face: 'n',
        look: 'Котёл с манометром. Стрелка дрожит на зелёном. Красная часть шкалы нарисована с любовью.',
        use: 'Крутить вентили не буду. Я не знаю, какой из них «не взрывать».' },
      { id: 'gauge', name: 'Манометр', rect: [102, 58, 26, 26], walk: w(116, 172), face: 'n', look: g => (g.f.pressure || 0) > 0.6 ? 'Стрелка ушла в красное. Даже шкала выглядит испуганной.' : 'Манометр. Стрелка на зелёном. Пока.' },
      { id: 'hood', name: 'Пылесос для брака', rect: [170, 62, 56, 28], walk: w(200, 168), face: 'n',
        look: 'Огромный пылесос. Табличка «Брак». Засасывает бракованных мишек обратно в производство. Жестоко, но экономно.',
        use: 'До раструба не дотянуться. И слава богу: на табличке «Брак», а я сегодня не в форме.' },
      { id: 'ext', name: 'Огнетушитель', rect: [190, 90, 20, 32], walk: w(EXT[0], EXT[1] + 16), face: 'n',
        look: 'Огнетушитель прямо под пылесосом. Прикручен к стойке болтами. Мафия своим не доверяет.',
        use: 'Прикручен намертво. Если что-то загорится, придётся гореть медленно.' },
      { id: 'lever', name: 'Рычаг пылесоса', rect: [146, 112, 24, 56], walk: w(LEVER[0], LEVER[1] + 6), face: 'e',
        look: 'Большой рычаг с красной ручкой. Подписано: «Пылесос. Не для людей». Написано старательно, но без уверенности.',
        use: function* (g) { yield* pullLever(g); } },
      { id: 'bandit', name: 'Мишка-бандит', rect: [40, 86, 34, 56], walk: w(56, 172), face: 'n',
        look: g => g.f.boxOut ? 'Мишка-бандит без панели. Голосовой блок выпал в лоток.' : 'Второй Мишка-бандит из зала, в ремонте. На бирке: «Кричит невпопад».',
        use: function* (g) { if (g.f.boxOut && !g.has('voicebox') && !g.f.boxIn && !g.f.bearReady) { yield g.anim('sam', 'reach', 0.5); g.give('voicebox'); g.f.boxTaken = true; yield g.say('sam', 'Первый выигрыш в этом казино, который можно унести.'); return; } yield* openBandit(g); },
        items: {
          screwdriver: function* (g) { yield* openBandit(g); },
          arm: 'Ручка у этого бандита на месте. Вторая ему ни к чему.',
          gun: 'Стрелять в автомат? Дон услышит. И поймёт, что я не такой уж загипнотизированный.'
        } },
      { id: 'screwdriver', name: 'Отвёртка', rect: [62, 128, 22, 10], walk: w(72, 172), face: 'n', over: true, when: g => !g.has('screwdriver') && !g.f.screwTaken,
        look: 'Отвёртка с зелёной ручкой. Лежит на верстаке рядом с бандитом.',
        use: function* (g) {
          if (stage(g) === 'hypno') { yield g.say('ted', 'Стоять, пёс! Сначала кролик!'); return; }
          yield g.anim('sam', 'reach', 0.4);
          g.give('screwdriver');
          g.f.screwTaken = true;
          yield g.say('sam', 'Мафия оставляет инструменты там, где их легко найти. Особенно загипнотизированным.');
        } },
      { id: 'bench', name: 'Верстак', rect: [18, 132, 78, 30], walk: w(56, 176), face: 'n', look: 'Верстак ремонтника. Среди гаек лежит недоеденная фрикаделька. Мафия ест на рабочем месте.' },
      { id: 'hopper', name: 'Ящик с голосами', rect: [338, 86, 42, 28], walk: w(352, 168), face: 'n',
        look: 'Оранжевый ящик «Блоки». Полон красных голосовых блоков. Робот хватает их по одному и вставляет в мишек.',
        use: 'Взять красный блок? Такой шепчет только «Слушайся Теда И. Бэра». Мне хватает одного Теда.',
        items: {
          voicebox: function* (g) { yield* dropBox(g); },
          firebear: 'Мишка уже с нужным голосом. Второй раз его не озвучить.',
          screwdriver: 'Разбирать ящик? Там только красные блоки и тоска.'
        } },
      { id: 'robot', name: 'Робот-сборщик', rect: [300, 26, 58, 88], walk: w(330, 168), face: 'n',
        look: 'Жёлтый робот. Хватает блоки из ящика и вставляет в мишек. Не смотрит, что берёт. Идеальный сотрудник мафии.',
        use: 'Отвлекать робота на работе? Его и так никто не хвалит.' },
      { id: 'voicemachine', name: 'Машина «Голос»', rect: [262, 58, 42, 50], walk: w(284, 168), face: 'n', look: 'Машина «Голос». Робот кладёт в неё блок, и очередной мишка обретает дар речи. Недолгий и неприятный.' },
      { id: 'belt', name: 'Конвейер', rect: [228, 110, 212, 26], walk: w(330, 170), face: 'n',
        look: 'Конвейер. Мишки едут один за другим, некоторые крутят глазами. Мишки для лавок, мишки для телевидения, мишки для всех.',
        use: 'Хватать мишек с конвейера? Они смотрят. Все восемь тысяч, и все на меня.' },
      { id: 'dropbear', name: 'Упавший мишка', rect: [DROP[0] - 10, DROP[1] - 24, 20, 26], walk: w(DROP[0], DROP[1] + 18), face: 'n', over: true, when: g => g.f.bearReady && !g.has('firebear') && !g.f.bearTaken,
        look: 'Мишка упал с конвейера. Кричит «Ты в огне!» каждому, кто на него посмотрит.',
        use: function* (g) { yield* takeBear(g); } },
      { id: 'bin', name: 'Готовые мишки', rect: [220, 124, 38, 26], walk: w(240, 170), face: 'n', look: 'Ящик «Готово». Мишки лежат кучей и смотрят в потолок. Потолок, кажется, уже загипнотизирован.' },
      { id: 'quality', name: 'Табличка', rect: [390, 26, 40, 40], look: '«Отдел качества. 98%». Остальные два процента засасывает пылесос.' }
    ],
    actors: {
      ted: {
        name: g => g.f.fac ? 'Гарри Кротман' : 'Дон Тед И. Бэр', walk: null, face: 'e', when: g => g.actors.ted.room === 'factory',
        look: g => stage(g) === 'panic' ? 'Кротман дёргает огнетушитель и кричит, что горит. Не горит. Но очень старается.' : 'Гарри Кротман, он же Дон Тед И. Бэр. Крот в фиолетовом костюме с розочкой. Экзоскелет делает его шире. Совесть уже.',
        talk: function* (g) {
          const s = stage(g);
          if (s === 'hypno') { yield g.say('ted', 'Молчать, пёс! Выполняй приказ!'); return; }
          if (s === 'panic') { yield g.say('ted', 'Помоги! Я горю! Или нет? Я не уверен! Мишка уверен!'); return; }
          yield g.say('ted', 'Не отвлекай меня, пёс. Я звоню Чаклзу. Чаклз не берёт трубку. Это меня нервирует.');
        },
        items: {
          firebear: function* (g) { yield* giveBear(g); },
          capgun: function* (g) { yield g.say('ted', 'В меня? Пёс, ты должен стрелять в кролика!'); },
          gun: function* (g) {
            if (stage(g) === 'hypno') { yield* shootMax(g, true); return; }
            yield g.say('sam', 'Стрелять в Дона? У него экзоскелет и восемь тысяч мишек. И он думает, что я загипнотизирован. Пусть думает.', { color: C.grey[4] });
          },
          voicebox: function* (g) { yield g.say('ted', 'Голосовой блок? Мне? Пёс, отнеси это роботу. Я не собираю мишек руками. У меня для этого робот.'); },
          screwdriver: function* (g) { yield g.say('ted', 'Отвёртку мне? Я Дон. Слесари у меня в подвале.'); },
          max: function* (g) { yield g.say('ted', 'Кролик мёртв, пёс. Хватит его таскать.'); }
        }
      },
      max: {
        name: 'Макс', walk: null, face: 'e', when: g => g.actors.max.room === 'factory',
        look: g => g.f.maxDead ? 'Макс изображает мёртвого. Изображает громко: он всё время подглядывает и дышит.' : 'Макс изображает загипнотизированного. Изображает старательно. Ему нравится роль.',
        talk: function* (g) { if (stage(g) === 'hypno') { yield g.say('max', hint(g)); return; } yield g.say('max', hint(g), { color: C.grey[4] }); },
        use: function* (g) { if (g.f.maxDead) yield g.say('max', 'Не трогай! Я мёртвый! Мёртвые щекотки не боятся! Ой!'); },
        items: {
          capgun: function* (g) { if (stage(g) === 'hypno') { yield* shootMax(g, false); return; } yield g.say('max', 'Второй раз умирать? Сэм, у меня кончились монологи.'); },
          gun: function* (g) { if (stage(g) === 'hypno') { yield* shootMax(g, true); return; } yield g.say('max', 'Сэм, я уже мёртвый! Не порть мне спектакль!'); },
          '*': function* (g) { yield g.say('max', 'Я мёртвый, Сэм. Мёртвым подарки не нужны. Хотя давай, я посмотрю.'); }
        }
      }
    },
    enter: function* (g) {
      if (!g.f.fac) yield* arrive(g);
    },
    setup(g) {
      const max = g.actors.max;
      if (g.f.fac === 'free' || g.f.fac === 'panic') {
        max.follow = null; max.scripted = true;
        g.place('max', 'factory', 296, 180, 'e');
        max.act = 'dead'; max.keepAct = true;
      }
    },
    onLoad(g) { ROOMS.factory.setup(g); }
  };

  E.factory = { arrive, shootMax, giveBear, pullLever, dropBox, hint };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
