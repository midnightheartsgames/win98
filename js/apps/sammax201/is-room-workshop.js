(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP201;
  const { ROOMS, TALK } = E;
  const A = S.art201;
  const TAU = Math.PI * 2;
  const TRAMP = 3, POUND = 1;
  const pcSay = (g, t) => g.say(null, t, { key: 'pc', color: C.neonB, x: 200, y: 70 });

  E.planeAt = p => ({ x: 300 + 150 * Math.cos(p * TAU / 8), y: 42 + 10 * Math.sin(p * TAU / 8) });
  const FIN_CAM = 140;
  const WALK = [[6, 140, 476, 140, 490, 150, 554, 150, 554, 198, 6, 198]];
  const FIN_WALK = [[144, 140, 470, 140, 470, 198, 144, 198]];

  function planePos(ft) {
    const i = Math.floor(ft.phase / 2);
    const local = ft.phase - i * 2;
    return (i % 8) + Math.max(0, local - 1);
  }
  E.planeStation = ft => Math.floor(ft.phase / 2) % 8;

  function newFinale() { return { phase: 4.2, moving: true, ball: 'cannon', bounce: 0, swing: 0, anim: null, started: true }; }

  const SONG = [
    { lines: ['Жил да был ужасный демон,', 'Страшный с головы до пят.', 'А на вид он был...'], opts: [['bulb21', '...как лампочка!'], ['bill21', '...как квитанция за свет!'], ['ferret21', '...как два хорька в одном свитере!'], ['goo21', '...как студень!']], ok: 3 },
    { lines: ['Был он злее всех на свете,', 'Злобу прятал под ремнём.', 'А родился он...'], opts: [['tube21', '...в пробирке!'], ['leaf21', '...в Нижней Манитобе!'], ['car21', '...на заднем сиденье «Де Сото»!'], ['cheese', '...в очереди за сыром у Боско!']], ok: 1 },
    { lines: ['Даже демоны другие', 'Не играли с ним вдвоём.', 'Не пускали в игры вроде...'], opts: [['donkey21', '...«Прицепи ослу хвост»!'], ['ttt21', '...«Крестиков-ноликов Судного дня»!'], ['mime21', '...«Мимосапёра»!'], ['eyes21', '...«Я шпион с сотней глаз»!']], ok: 2 },
    { lines: ['Если хочешь с ним увидеться,', 'Не беги и не молчи.', 'Просто громко позови:'], opts: [['tie21', 'Эй, Шаркающее Корпоративное Присутствие!'], ['scream21', 'Эй, Тот, Чьи Вопли Без Ответа!'], ['sue21', 'Эй, Безымянный, Ранее Известный Как Зина!'], ['you21', 'Эй, ты!']], ok: 0 }
  ];
  E.SONG = SONG;

  const recSay = (g, t) => g.say(null, t, { key: 'record', color: S.COLORS.record21, x: 160, y: 66 });

  function* singVerse(g) {
    const v = SONG[g.vt.song.stage];
    for (const l of v.lines) yield recSay(g, l);
  }

  E.startSong = function* (g) {
    g.vt.song = { stage: 0 };
    g.hideUI = true;
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('vcr');
    g.closeup = { kind: 'song21', t0: g.time };
    g.music('demon21');
    yield 0.6;
    yield* singVerse(g);
    g.hideUI = false;
    yield g.talkTo('song');
  };

  function stopSong(g) {
    g.closeup = null;
    g.vt.song = null;
    g.music(ROOMS.workshop.music(g));
  }

  TALK.song = {
    options: g => {
      const st = g.vt.song;
      const v = st && SONG[st.stage];
      const list = v ? v.opts.map(([icon, text], i) => ({ id: 'o' + i, icon, text, run: function* (gg) {
        if (i !== v.ok) {
          gg.endDialog();
          gg.sfx('rip');
          stopSong(gg);
          yield gg.say('sam', 'Пластинка взвизгнула и замолчала. Строчка явно была не та.');
          yield gg.say('elfr', 'Сначала, пожалуйста. Или лучше не надо.');
          return;
        }
        gg.vt.song.stage++;
        if (gg.vt.song.stage >= SONG.length) {
          gg.endDialog();
          gg.sfx('cymbal');
          stopSong(gg);
          yield* E.demonRelease(gg);
          return;
        }
        yield* singVerse(gg);
      } })) : [];
      list.push({ id: 'bye', icon: 'bye', text: 'Замолчать.', end: true, run: function* (gg) { stopSong(gg); } });
      return list;
    }
  };

  E.demonRelease = function* (g) {
    const elfr = g.actors.elfr, elfg = g.actors.elfg, santa = g.actors.santa, demon = g.actors.demon, max = g.actors.max;
    for (const a of [elfr, elfg, santa, demon, max]) a.scripted = true;
    g.hideUI = true;
    g.f.demonOut = true;
    elfr.act = 'scared'; elfr.keepAct = true;
    g.sfx('hypno');
    g.fx.shake = 0.8;
    yield 1;
    g.fx.flash = 0.8;
    g.sfx('splat');
    g.place('demon', 'workshop', 190, 176, 'e');
    elfr.act = 'faint';
    yield g.say('demon', 'Бла-а-аргх! Кто назвал меня полным именем?! Полным именем меня зовёт только начальство!');
    yield g.say('max', 'Он сидел в эльфе! В красном!');
    g.sfx('door');
    g.place('santa', 'workshop', 520, 92, 'w');
    santa.act = 'shoot'; santa.keepAct = true;
    yield g.walkTo('santa', 470, 150, { free: true, speed: 1.4 });
    yield g.say('santa', 'Я знал! Эльф! Три недели я сидел у двери и стрелял, чтобы он ко мне не поднялся!');
    yield g.say('demon', 'Бла-а-аргх. Встреча переносится.');
    g.walkTo('demon', 10, 170);
    yield 0.8;
    yield g.say('santa', 'Стой, студень! Рождество отменяется! Для тебя лично!');
    g.sfx('tommy');
    yield g.walkTo('santa', 12, 172);
    g.place('demon', 'nowhere', 0, 0);
    g.place('santa', 'nowhere', 0, 0);
    santa.act = ''; santa.keepAct = false;
    elfg.act = 'scared'; elfg.keepAct = true;
    yield g.say('elfg', 'Демон! Настоящий! Всё, я ухожу в стоматологи!');
    yield g.walkTo('elfg', 10, 174);
    g.place('elfg', 'nowhere', 0, 0);
    elfg.act = ''; elfg.keepAct = false;
    yield g.say('max', 'Сэм! Санта стрелял в эльфа! Санта хороший!');
    yield g.say('sam', 'Хороший Санта с автоматом. Такого Рождества я не заказывал.');
    g.music('spirit21');
    g.sfx('chime');
    for (const [id, x] of [['gpast', 70], ['gpres', 104], ['gfut', 138]]) g.place(id, 'workshop', x, 174, 'e');
    yield g.say('gpres', 'Санта нас звал. Мы прилетели. Демона нет. Чудесно.');
    yield g.say('gpast', 'Не кипятись, старик. Мы его запечатаем. Только сначала эти двое кое-что починят.');
    yield g.say('sam', 'Мы?');
    yield g.say('gpres', 'Три Рождества. Прошлое, настоящее и будущее. Все три испортили вы.');
    yield g.say('sam', 'Мы ничего не портили.');
    yield g.say('gpres', 'Пока.');
    yield g.say('gpast', 'Время, чувак. Оно как пластинка. Крутится.');
    g.anim('gfut', 'nod', 1.2);
    yield 1.2;
    yield g.say('gpres', 'Порталы откроем у мастерской. Когда Рождество будет починено, его дух сядет в шар. Полный шар запечатает демона.');
    g.give('globe');
    g.f.spirits = true;
    yield g.say('sam', 'Пустой снежный шар. Дух Будущего вручил его молча.');
    for (const id of ['gpast', 'gpres', 'gfut']) g.place(id, 'nowhere', 0, 0);
    g.sfx('whoosh');
    for (const a of [elfr, elfg, santa, demon, max]) a.scripted = false;
    g.hideUI = false;
  };

  const WISH = { stinky: 'bath', bosco: 'watch', lincoln: 'moai', sybil: 'quiet' };
  const FLAG = { stinky: 'giftStinky', bosco: 'giftBosco', lincoln: 'giftAbe', sybil: 'giftSybil' };
  const WHO = [['stinky', 'f:stinky21', 'Стинки, закусочная.'], ['bosco', 'f:bosco', 'Боско, лавка.'], ['lincoln', 'f:lincoln21', 'Голова Линкольна, тележка.'], ['sybil', 'f:sybil', 'Сибил, канцелярия.']];
  const GIFTS = [['bath', 'bath21', 'Ванночка для ног с пираньями.'], ['watch', 'watch21', 'Секундомер «Навязчивость».'], ['moai', 'moai21', '«Мой первый каменный истукан».'], ['quiet', 'quiet21', 'Тишина в коробке.']];
  const GIFT_LINE = {
    bath: 'Ванночка ушла. Пираньи в ней поют гимн доставки.',
    watch: 'Секундомер уехал. Тикает так громко, что слышно сквозь три слоя бумаги.',
    moai: 'Каменный истукан уехал к Линкольну. Профиль у истукана, как у президента, только суровее.',
    quiet: 'Тишину отправили Сибил. Коробка пустая, и это входит в комплект.'
  };

  function* sendGift(g, what) {
    const to = g.vt.gift && g.vt.gift.to;
    g.vt.gift = { stage: 'menu' };
    if (WISH[to] !== what) { g.sfx('buzzer'); yield pcSay(g, 'ОШИБКА. ПОЛУЧАТЕЛЬ ТАКОГО НЕ ЗАГАДЫВАЛ. СВЕРЬТЕСЬ СО СПИСКОМ ЖЕЛАНИЙ.'); return; }
    if (g.f[FLAG[to]]) { g.sfx('buzzer'); yield pcSay(g, 'ОШИБКА. ПОДАРОК УЖЕ ОТПРАВЛЕН. ВТОРОЙ ПОЛОЖЕН В СЛЕДУЮЩЕМ ГОДУ.'); return; }
    g.f[FLAG[to]] = true;
    g.vt.giftT = g.time + 1.6;
    g.sfx('servo');
    yield 0.8;
    g.sfx('whoosh');
    yield pcSay(g, 'ПОДАРОК УПАКОВАН. БИРКА ПРИВЯЗАНА. ДОСТАВКА СЕГОДНЯ.');
    yield g.say('sam', GIFT_LINE[what]);
  }

  TALK.gifts = {
    start: function* (g) {
      g.vt.gift = { stage: 'menu' };
      yield pcSay(g, 'РАЗДАТЧИК ПОДАРКОВ «ЖУК-3». ВЫБЕРИТЕ ДЕЙСТВИЕ.');
    },
    options: g => {
      const st = (g.vt.gift && g.vt.gift.stage) || 'menu';
      if (st === 'to') return WHO.map(([id, icon, text]) => ({ id: 'to_' + id, icon, text, run: function* (gg) { gg.vt.gift = { stage: 'what', to: id }; yield pcSay(gg, 'ВЫБЕРИТЕ ПОДАРОК.'); } }))
        .concat([{ id: 'back', icon: 'bye', text: 'Назад.', run: function* (gg) { gg.vt.gift = { stage: 'menu' }; } }]);
      if (st === 'what') return GIFTS.map(([id, icon, text]) => ({ id: 'g_' + id, icon, text, run: function* (gg) { yield* sendGift(gg, id); } }))
        .concat([{ id: 'back', icon: 'bye', text: 'Назад.', run: function* (gg) { gg.vt.gift = { stage: 'to' }; } }]);
      return [
        { id: 'log', icon: 'log21', text: 'Журнал отправок.', run: function* (gg) {
          yield pcSay(gg, 'МАЙМТРОН 9000: СЭМУ И МАКСУ. ПОЖЕЛАНИЕ ОТПРАВИТЕЛЯ: «УНИЧТОЖИТЬ».');
          yield pcSay(gg, 'ВСАДНИК МОРА: ЗАКУСОЧНАЯ «У СТИНКИ». ВСАДНИК ВОЙНЫ: ДЖИММИ ДВА ЗУБА. ВСАДНИК СМЕРТИ: ГАРАЖ К.О.П.С. ВСАДНИК ГОЛОДА: БОСКО.');
          yield pcSay(gg, 'ВСЕ ОТПРАВКИ ПОДТВЕРДИЛ: КРАСНЫЙ ЭЛЬФ.');
          gg.f.logRead = true;
          yield gg.say('sam', 'Всех четырёх всадников разослали по нашей улице. А робота нам. Красный эльф работает быстро.');
        } },
        { id: 'wish', icon: 'wish21', text: 'Список желаний.', run: function* (gg) {
          yield pcSay(gg, 'СТИНКИ: ВАННОЧКУ ДЛЯ НОГ. БОСКО: ЗНАТЬ ТОЧНОЕ ВРЕМЯ. ГОЛОВА ЛИНКОЛЬНА: ДРУГА С ТАКИМ ЖЕ ЛИЦОМ.');
          yield pcSay(gg, 'СИБИЛ: ЧТОБЫ НЕ ЗВОНИЛИ. СОДА-ПОПЕРЫ: ВСЁ, ЧТО НЕДОДАЛИ. МАКС: ВСЁ.');
          gg.f.wishRead = true;
          yield gg.say('max', 'Я просил всё! И мне до сих пор ничего не дали!');
        } },
        { id: 'send', icon: 'gift21', text: 'Отправить подарок.', run: function* (gg) {
          if (!gg.has('tags')) { gg.sfx('buzzer'); yield pcSay(gg, 'ВСТАВЬТЕ ПОДАРОЧНУЮ БИРКУ. БЕЗ БИРКИ ПОДАРОК УХОДИТ НА СКЛАД.'); return; }
          gg.vt.gift = { stage: 'to' };
          yield pcSay(gg, 'КОМУ? ВЫБЕРИТЕ ИЗ СПИСКА ЖЕЛАНИЙ.');
        } },
        { id: 'bye', icon: 'bye', text: 'Выключить.', end: true }
      ];
    },
    end: function* (g) { g.vt.gift = null; }
  };

  TALK.elfr = {
    options: [
      { id: 'who', icon: 'f:elfr21', text: 'Кто вы?', run: function* (g) {
        yield g.say('elfr', 'Красный эльф, старший смены. До Рождества неделя, а план по куклам выполнен на сорок процентов. Вы по какому вопросу?');
      } },
      { id: 'santa', icon: 'f:santa21', text: 'Что с Сантой?', run: function* (g) {
        yield g.say('elfr', 'Три недели сидит наверху и стреляет в дверь. Работать мешает только шумом. Я привык.');
        yield g.say('elfr', 'Вниз он не спускается. Еду ему кидаем на лестницу.');
      } },
      { id: 'pc', icon: 'mime21', text: 'Чем вы заняты за компьютером?', run: function* (g) {
        g.anim('elfr', 'work', 1.4);
        yield g.say('elfr', 'Отчётностью. А в перерыве «Мимосапёр». Рекорды не мои, если вы об этом.');
      } },
      { id: 'crate', icon: 'q', text: 'Что в ящике у стены?', run: function* (g) {
        yield g.say('elfr', 'Пришёл на прошлой неделе. Не открывали. Течёт. Я поставил его в план как «прочее».');
      } },
      { id: 'robot', icon: 'robot21', text: 'Вы прислали нам робота.', run: function* (g) {
        yield g.say('elfr', 'Мы рассылаем то, что в списке. Список у нас в компьютере. Спрашивайте компьютер.');
      } },
      { id: 'bye', icon: 'bye', text: 'Не буду мешать плану.', end: true }
    ]
  };

  function* elfCry(g) {
    const elfg = g.actors.elfg;
    yield g.say('elfg', 'Как... не существует? А кто тогда стреляет наверху?!');
    elfg.act = 'cry'; elfg.keepAct = true;
    g.sfx('sting');
    yield g.say('elfg', 'Уа-а-а! Я плачу! Я впервые плачу! Это ужасно и прекрасно!');
    g.f.elfCried = true;
    g.f.canGot = true;
    g.give('can');
    yield g.say('elfg', 'Возьмите лейку! Я не могу на неё смотреть! Я постою в углу!');
    elfg.act = ''; elfg.keepAct = false;
    yield g.walkTo('elfg', 520, 180);
    g.face('elfg', 'n');
    yield g.say('sam', 'Слёзы эльфа капали прямо в лейку. Немного, зато настоящие.');
    yield g.say('max', 'Сэм, ты жестокий. Мне нравится.');
  }

  TALK.elfg = {
    options: g => [
      { id: 'who', icon: 'f:elfg21', text: 'Ты кто?', run: function* (gg) {
        yield gg.say('elfg', 'Зелёный эльф! Практикант! Меня сделали на эльфийской фабрике, а живу я в приюте. Это уже неловко, я взрослый.');
      } },
      { id: 'job', icon: 'can21', text: 'Чем ты занимаешься?', run: function* (gg) {
        yield gg.say('elfg', 'Моя работа: поливать ёлки слезами эльфа! От слёз они растут как сумасшедшие! Только я ни разу не плакал. Мне всегда хорошо!');
        gg.f.knowTears = true;
      } },
      { id: 'try', icon: 'cry21', text: 'Давай я помогу тебе заплакать.', when: gg => gg.f.knowTears && !gg.f.elfCried, run: function* (gg) {
        yield gg.say('elfg', 'Попробуйте! Меня ничего не берёт! Я видел щенка под дождём и улыбнулся!');
        gg.vt.scare = true;
      } },
      { id: 'max', icon: 'f:max', text: 'Смотри, Макс страшный кролик-убийца.', when: gg => gg.vt.scare && !gg.f.elfCried, run: function* (gg) {
        yield gg.say('max', 'Р-р-р! Я тебя съем! С бубенчиком!');
        yield gg.say('elfg', 'Какой пушистый! Пушистое не бывает страшным!');
        yield gg.say('max', 'Сэм, он меня обидел.');
      } },
      { id: 'tax', icon: 'bill21', text: 'Налог на подарки повысят вдвое.', when: gg => gg.vt.scare && !gg.f.elfCried, run: function* (gg) {
        yield gg.say('elfg', 'А мне всё равно! Мне подарков не дарят!');
        yield gg.say('sam', 'Он сказал это с улыбкой. Это даже грустнее налогов.');
      } },
      { id: 'santa', icon: 'f:santa21', text: 'Санты не существует.', when: gg => gg.vt.scare && !gg.f.elfCried, run: function* (gg) { yield* elfCry(gg); } },
      { id: 'bye', icon: 'bye', text: 'Работай, практикант.', end: true }
    ]
  };

  function* placeHorse(g, id) {
    yield g.anim('sam', 'reach', 0.5);
    g.drop(id);
    g.f[id + 'Set'] = true;
    g.sfx('clang');
    const n = E.placed(g);
    if (n < 4) { yield g.say('sam', n === 1 ? 'Первый всадник встал у столба. Столб потянул его к себе магнитом.' : 'Ещё один всадник у столба. Их уже ' + n + '.'); return; }
    yield g.say('sam', 'Четыре всадника стоят у столба. Столб гудит, как трансформатор.');
    yield g.say('max', 'Апокалипсис укомплектован! Сэм, я чувствую себя пятым всадником!');
  }

  function* recordOn(g) {
    if (g.f.demonOut) { yield g.say('sam', 'Песню я уже спел. Повторять её демону незачем, он и так пришёл.'); return; }
    if (E.placed(g) < 4) {
      yield g.anim('sam', 'reach', 0.4);
      g.sfx('vcr');
      g.music('demon21');
      yield recSay(g, 'Жил да был ужасный демон...');
      g.music('workshop21');
      g.sfx('rip');
      yield g.say('sam', 'Без всадников у столба это просто плохая песня. Иглу я снял, пока никто не запомнил мотив.');
      return;
    }
    yield* E.startSong(g);
  }

  function* shootSwitch(g) {
    const ft = g.vt.finale;
    yield g.anim('sam', 'shoot', 0.4);
    g.sfx('gun');
    g.sfx('click');
    if (ft.moving) {
      const i = Math.floor(ft.phase / 2);
      if (ft.phase - i * 2 > 1) ft.phase = (i + 1) * 2;
      else ft.phase = i * 2;
      ft.moving = false;
      const st = E.planeStation(ft);
      if (st === POUND && ft.ball === 'plane') { yield* dropBall(g); return; }
      if (st === POUND) yield g.say('sam', 'Самолёт завис над Камбалобоем. Бомболюк открылся. Пустой.');
      else if (st === TRAMP) yield g.say('sam', 'Самолёт завис над батутом.');
      else yield g.say('sam', 'Самолёт остановился. Под ним пол и ничего интересного.');
    } else {
      ft.moving = true;
      yield g.say('sam', 'Самолёт снова закружил под потолком.');
    }
  }

  function* shootCannon(g) {
    const ft = g.vt.finale;
    yield g.anim('sam', 'shoot', 0.4);
    g.sfx('gun');
    if (ft.ball !== 'cannon') { yield g.say('sam', 'Пушка пустая. Мяч уже в самолёте.'); return; }
    g.sfx('explosion');
    const hit = !ft.moving && E.planeStation(ft) === TRAMP;
    ft.anim = { kind: hit ? 'up' : 'miss', t0: g.time };
    ft.bounce = g.time + 0.9;
    yield 0.6;
    g.sfx('boing');
    yield 0.9;
    ft.anim = null;
    if (hit) {
      ft.ball = 'plane';
      g.sfx('clang');
      yield g.say('sam', 'Мяч отскочил от батута и лёг точно в бомболюк самолёта.');
      yield g.say('santa', 'Игрушки?! Игрушки против меня?! Я сорок лет их делаю!');
    } else yield g.say('sam', 'Мяч ударился о батут, взлетел к потолку, никого не задел и закатился обратно в пушку.');
  }

  function* dropBall(g) {
    const ft = g.vt.finale;
    const santa = g.actors.santa;
    santa.scripted = true;
    ft.ball = 'drop';
    ft.anim = { kind: 'drop', t0: g.time };
    yield g.say('sam', 'Самолёт завис над Камбалобоем. Бомболюк открылся.');
    yield 0.8;
    ft.anim = null;
    ft.ball = 'done';
    ft.swing = g.time + 2;
    g.sfx('whack');
    g.fx.shake = 1;
    santa.act = ''; santa.keepAct = false;
    yield g.walkTo('santa', 300, 150, { free: true, speed: 3 });
    g.place('santa', 'nowhere', 0, 0);
    g.sfx('crash');
    g.f.santaDown = true;
    santa.scripted = false;
    g.music('workshop21');
    yield g.say('sam', 'Камбалобой ударил Санту хвостом. Санта пролетел полмастерской и сел в ящик. Крышка захлопнулась.');
    yield g.say('max', 'Сэм, мы нокаутировали Санту! Я этого никому не расскажу! Я расскажу это всем!');
  }

  E.ending = function* (g) {
    const max = g.actors.max, elfr = g.actors.elfr, elfg = g.actors.elfg, specs = g.actors.specs;
    for (const a of [max, elfr, elfg, specs]) a.scripted = true;
    g.hideUI = true;
    g.f.shipped = true;
    yield g.say('sam', 'Под Сантой в ящике лежит вторая накладная, внутренняя. Мокрая, но читается: «САТАНЕ, Ад, до востребования».');
    yield g.say('sam', 'Почта прочла «Сатане» как «Санте». Перепутала одну букву и порядок остальных. Демон приехал не на тот полюс.');
    yield g.say('max', 'Отправим по адресу! С Сантой внутри! Пусть там разберутся!');
    yield g.say('sam', 'Демон в Санте, Санта в ящике, ящик в аду. В аду есть отдел возвратов. Должен быть.');
    elfr.act = ''; elfr.keepAct = false;
    g.place('elfr', 'workshop', 160, 170, 'e');
    yield g.say('elfr', 'Что случилось? Почему я на полу? Почему план выполнен только на сорок процентов?');
    yield g.say('sam', 'Три недели ты работал на демона. Он выполнял план из принципа плохо.');
    yield g.say('elfr', 'А кто развезёт подарки? До Рождества неделя!');
    g.place('elfg', 'workshop', 20, 176, 'e');
    yield g.walkTo('elfg', 80, 176);
    yield g.say('elfg', 'Я вернулся! Стоматология это страшно! Там плачут без всяких лейок!');
    g.place('specs', 'workshop', 30, 172, 'e');
    yield g.say('specs', 'Мы слышали, что тут раздают подарки. Девятнадцать лет, два месяца и пять дней.');
    yield g.say('sam', 'Подарки развозим мы. Сани, Де Сото и три бывшие звезды. Платим подарками.');
    yield g.say('specs', 'Согласны. Это больше, чем нам предлагали.');
    yield g.fadeOut(2);
    g.closeup = { kind: 'deliver21', t0: g.time };
    g.music('title21');
    yield g.fadeIn(2);
    yield E.narr(g, 'В ту ночь над городом летели сани. Подарки падали в трубы, в форточки и один раз в гидрант.');
    yield E.narr(g, 'Ящик с надписью «САТАНЕ» ушёл почтой. Обратный адрес на нём кто-то вписал заранее.');
    yield 2;
    yield g.fadeOut(2);
    g.closeup = null;
    for (const a of [max, elfr, elfg, specs]) a.scripted = false;
    for (const id of ['elfr', 'elfg', 'specs']) g.place(id, 'nowhere', 0, 0);
    yield* E.epilogue(g);
  };

  E.finaleEnter = function* (g) {
    if (!g.vt.finale) g.vt.finale = newFinale();
    if (g.seen.finaleHello) return;
    g.seen.finaleHello = 1;
    yield g.say('santa', 'Добро пожаловать в отдел возвратов. Все подарки отзываются. Начнём с вас.');
    yield g.say('max', 'Сэм, у него глаза светятся! Как у меня, когда я голодный!');
  };

  const CAN_FIN = g => E.finale(g) && g.vt.finale;

  ROOMS.workshop = {
    id: 'workshop', name: 'Мастерская Санты', w: 560, music: g => (E.finale(g) ? 'finale21' : g.f.demonOut && !g.f.santaDown ? 'spirit21' : 'workshop21'),
    scale: [140, 0.86, 196, 1],
    paint: b => S.BG.workshop21(b),
    walk: g => (E.finale(g) ? FIN_WALK : WALK),
    block: [[278, 168, 324, 168, 324, 200, 278, 200], [390, 170, 426, 170, 426, 200, 390, 200]],
    noSave: g => E.finale(g),
    layers: [
      { id: 'recplayer', x: 44, y: 76, base: 137, key: g => (g.f.recordSet ? 'r' : '') },
      { id: 'redpc', x: 96, y: 88, base: 138, key: g => Math.floor(g.time * 2) % 3 },
      { id: 'pole', x: 151, y: 10, base: 139, key: g => E.placed(g) + (g.f.pestSet ? 'p' : '') + (g.f.deathSet ? 'd' : '') + (g.f.warSet ? 'w' : '') + (g.f.famineSet ? 'f' : '') + (E.placed(g) === 4 && !g.f.demonOut ? Math.floor(g.time * 6) % 12 : '') },
      { id: 'tree', x: 215, y: 10, base: 139, key: g => (g.f.bettyGot ? 'b' : '') + (g.f.mazeGot ? 'm' : '') },
      { id: 'dispenser', x: 346, y: 40, base: 140, key: g => (g.vt.giftT && g.time < g.vt.giftT ? 'g' + Math.floor(g.time * 6) % 3 : '') },
      { id: 'greenpc', x: 438, y: 94, base: 140, key: g => Math.floor(g.time * 3) % 2 },
      { id: 'tags', x: 468, y: 110, base: 141, key: g => (g.f.tagsGot ? 'e' : '') },
      { id: 'cannon', x: 136, y: 166, base: 191 },
      { id: 'tramp', x: 172, y: 176, base: 191, key: g => (g.vt.finale && g.vt.finale.bounce > g.time ? 'b' : '') },
      { id: 'crate', x: 270, y: 146, base: 196, key: g => (g.f.santaDown ? 's' : '') + (g.f.demonOut ? 'o' : '') },
      { id: 'pounder', x: 356, y: 140, base: 197, key: g => (g.f.santaDown || (g.vt.finale && g.vt.finale.swing > g.time) ? 'w' : '') }
    ],
    update(g, dt) {
      const ft = g.vt.finale;
      if (CAN_FIN(g)) { if (ft.moving && !g.busy) ft.phase = (ft.phase + dt) % 16; g.camLock = FIN_CAM; }
      else { g.vt.decor = ((g.vt.decor || 0) + dt * 0.6) % 16; if (g.camLock === FIN_CAM) g.camLock = null; }
    },
    drawFront(f, g, cx) {
      const ft = CAN_FIN(g) ? g.vt.finale : null;
      const pos = ft ? planePos(ft) : planePos({ phase: g.vt.decor || 0 });
      const p = E.planeAt(pos);
      A.plane(new S.Pen(f), Math.round(p.x - cx), Math.round(p.y), { ball: ft && ft.ball === 'plane' });
      if (ft && ft.anim) {
        const t = Math.min(1, (g.time - ft.anim.t0) / 1.4);
        let x, y;
        if (ft.anim.kind === 'drop') { const q = E.planeAt(POUND); x = q.x; y = q.y + 8 + t * 120; }
        else if (t < 0.45) { const k = t / 0.45; x = 163 + (194 - 163) * k; y = 169 - Math.sin(k * Math.PI) * 24 + k * 13; }
        else { const k = (t - 0.45) / 0.55; x = 194; y = ft.anim.kind === 'up' ? 182 - k * 130 : 182 - Math.sin(k * Math.PI) * 150; }
        const P = new S.Pen(f);
        P.part(P.ell(Math.round(x - cx), Math.round(y), 2.6, 2.6), C.night, { b: 2 });
      }
      for (let i = 0; i < 18; i++) {
        const x = 254 + ((i * 13 + Math.floor(g.time * 20)) % 34);
        const y = 38 + ((i * 7 + Math.floor(g.time * 30)) % 30);
        if (x - cx >= 0 && x - cx < 320 && (x < 288 || x > 330)) f.set(x - cx, y, C.grey[5]);
      }
    },
    hot: [
      { id: 'door', name: 'Выход', rect: [4, 66, 34, 68], when: g => !E.finale(g), walk: [30, 170], face: 'w',
        look: 'Дверь на улицу, к саням и Сода-Попперам.',
        exit: function* (g) {
          if (E.finale(g)) { yield g.say('sam', 'Уйти и оставить эльфов с демоном в бороде? Нет.'); return; }
          g.sfx('door');
          yield* g.goRoom('pole', { x: 392, y: 156, dir: 's' });
        } },
      { id: 'switch', name: 'Выключатель самолёта', rect: [148, 90, 16, 18], walk: [164, 150], face: 'n', noWalkItem: true,
        look: 'Выключатель на стене. Подписано: «Самолёт. Вкл/Выкл». Провод уходит к рельсу под потолком.',
        use: function* (g) { if (CAN_FIN(g)) { yield g.say('sam', 'Пальцем до выключателя не дотянуться: Санта держит его на прицеле.'); return; } yield g.say('sam', 'Щёлкнул. Самолёт под потолком даже не заметил. У него своё расписание.'); },
        items: { gun: function* (g) { if (!CAN_FIN(g)) { yield g.say('sam', 'Стрелять по выключателю в мастерской Санты? Эльфы и так нервные.'); return; } yield* shootSwitch(g); } } },
      { id: 'plane', name: 'Игрушечный бомбардировщик', rect: [80, 18, 440, 34],
        look: g => CAN_FIN(g) ? (g.vt.finale.ball === 'plane' ? 'Игрушечный бомбардировщик. В бомболюке лежит мяч.' : 'Игрушечный бомбардировщик кружит по рельсу под потолком. Бомболюк пустой.') : 'Игрушечный бомбардировщик на рельсе под потолком. Кружит, останавливаясь, как трамвай.',
        items: { gun: 'Стрелять в самолёт? Он жестяной и летит по кругу. Попаду в рельс, рельс попадёт в меня.' } },
      { id: 'recplayer', name: 'Проигрыватель', rect: [46, 86, 44, 50], when: g => !E.finale(g), walk: [70, 152], face: 'n',
        look: g => g.f.recordSet ? 'Проигрыватель с раструбом. На диске «Сатанинские рождественские песни».' : 'Проигрыватель с раструбом. Диск пустой. Эльфы под него, наверное, водят хороводы.',
        use: function* (g) {
          if (g.f.recordSet) { yield* recordOn(g); return; }
          yield g.say('sam', 'Проигрыватель крутит пустой диск и шипит. Эльфам, судя по всему, этого хватает.');
        },
        items: {
          record: function* (g) { g.drop('record'); g.f.recordSet = true; yield* recordOn(g); },
          gun: 'Стрелять в проигрыватель? Музыку это не улучшит.'
        } },
      { id: 'redpc', name: 'Красный компьютер', rect: [100, 92, 36, 44], when: g => !E.finale(g), walk: [120, 152], face: 'n',
        look: 'Компьютер красного эльфа. Открыт «Мимосапёр». Таблица рекордов: Ш.К.П., Ш.К.П., Ш.К.П. И так сто строчек.',
        use: function* (g) { if (g.f.demonOut) { yield g.say('sam', 'Таблица рекордов пуста. Игрок ушёл.'); return; } yield g.say('elfr', 'Не трогайте! У меня там партия!'); } },
      { id: 'pole', name: 'Полосатый столб', rect: [174, 14, 24, 124], walk: [188, 152], face: 'n',
        look: g => E.placed(g) ? 'Северный полюс, полосатый столб. У основания всадников: ' + E.placed(g) + ' из четырёх.' : 'Северный полюс, тот самый, полосатый. Внутри магнит. Мой револьвер в кобуре сам тянется к нему.',
        use: 'Столб холодный и прямой. Лизать его не буду, Макс уже пробовал.',
        items: {
          pest: function* (g) { yield* placeHorse(g, 'pest'); },
          death: function* (g) { yield* placeHorse(g, 'death'); },
          war: function* (g) { yield* placeHorse(g, 'war'); },
          famine: function* (g) { yield* placeHorse(g, 'famine'); },
          gun: 'Револьвер прилип к столбу. Я отлепил его с трудом. В магнит стрелять бесполезно.',
          key: 'Ключ тоже прилип. Магнит не разбирает, где улика, а где железо.'
        } },
      { id: 'tree', name: 'Ёлка', rect: [229, 14, 84, 94], walk: [270, 152], face: 'n',
        look: 'Ёлка мастерской. Под ней лежат игрушки, которые никто не упаковал. План, видимо, не позволяет.',
        use: 'Трясти ёлку? Сверху упадёт звезда. Звезда тяжёлая.',
        items: { can: 'Ёлка и так выросла до потолка. Слёзы эльфа ей уже ни к чему.' } },
      { id: 'betty', name: 'Боксёрская Бетти', rect: [235, 108, 22, 30], when: g => !g.f.bettyGot, walk: [250, 152], face: 'n', over: true,
        look: 'Кукла «Боксёрская Бетти». В перчатках, с пультом в спине. На этикетке: «Побеждает всех. Ключ продаётся отдельно».',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.5);
          g.f.bettyGot = true;
          g.give('betty');
          yield g.say('elfr', 'Эй! Это для детей! Ладно, спишу как брак.');
        } },
      { id: 'maze', name: 'Простейший лабиринт', rect: [284, 124, 24, 15], when: g => !g.f.mazeGot, walk: [296, 152], face: 'n', over: true,
        look: '«Простейший в мире лабиринт». Для грызунов. Вход есть, выхода не предусмотрено.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.5);
          g.f.mazeGot = true;
          g.give('maze');
          yield g.say('max', 'Лабиринт для крыс! Сэм, у нас как раз есть знакомая крыса!');
        } },
      { id: 'dispenser', name: 'Раздатчик подарков', rect: [358, 44, 68, 94], walk: [392, 152], face: 'n',
        look: 'Раздатчик подарков «Жук-3». Огромный зелёный жук из жести. Подарки выходят у него из брюшка. Об остальном лучше не думать.',
        use: 'Раздатчик управляется с зелёного компьютера рядом.',
        items: { gun: 'Стрелять в жука? Подарки выйдут с дырками.', tags: 'Бирки вставляют в компьютер раздатчика. Жук бумагу не ест.' } },
      { id: 'greenpc', name: 'Зелёный компьютер', rect: [440, 98, 26, 42], walk: [452, 152], face: 'n',
        look: 'Зелёный компьютер раздатчика. На экране меню: «Журнал. Желания. Отправка».',
        use: function* (g) { if (CAN_FIN(g)) { yield g.say('sam', 'До компьютера мне не дойти, Санта стоит рядом.'); return; } yield g.talkTo('gifts'); },
        items: { tags: function* (g) { yield g.talkTo('gifts'); } } },
      { id: 'tags', name: 'Подарочные бирки', rect: [470, 112, 26, 18], when: g => !g.f.tagsGot && !E.finale(g), walk: [480, 152], face: 'n', over: true,
        look: 'Пачка подарочных бирок на столике. «Кому». Пустые.',
        use: function* (g) { yield g.anim('sam', 'reach', 0.4); g.f.tagsGot = true; g.give('tags'); yield g.say('sam', 'Пачка бирок. В графе «Кому» везде пусто. Санта до них, видимо, не добрался.'); } },
      { id: 'stairs', name: 'Дверь Санты', rect: [520, 40, 34, 46], when: g => !E.finale(g), walk: [500, 150], face: 'e',
        look: g => g.f.demonOut ? 'Дверь в комнату Санты. Вся в дырках. Теперь открыта.' : 'Дверь в комнату Санты наверху. Вся в дырках от пуль. Дырки свежие и все изнутри.',
        exit: function* (g) {
          if (E.finale(g)) { yield g.say('sam', 'Наверх, в пустую комнату? Санта тут, внизу.'); return; }
          if (!g.f.demonOut) {
            g.sfx('tommy');
            g.fx.shake = 0.4;
            yield g.say(null, 'Ещё шаг, и Рождество отменяется! Для тебя лично!', { key: 'santav', color: S.COLORS.santa21, x: 260, y: 30 });
            g.f.santaShot = true;
            yield g.say('sam', 'Санта стреляет сквозь дверь. По этой лестнице сегодня ходят только пули.');
            return;
          }
          g.sfx('door');
          yield* g.goRoom('santa', { x: 270, y: 166, dir: 'w' }, { from: 'door' });
        } },
      { id: 'cannon', name: 'Игрушечная пушка', rect: [138, 168, 30, 24], walk: [176, 166], face: 'w', noWalkItem: true,
        look: g => CAN_FIN(g) && g.vt.finale.ball !== 'cannon' ? 'Игрушечная пушка. Пустая.' : 'Игрушечная пушка с мячом в стволе. На лафете: «Стреляет от удара по запалу».',
        use: 'Запал у пушки маленький, пальцем его не нажать.',
        items: { gun: function* (g) { if (!CAN_FIN(g)) { yield g.say('sam', 'Палить из пушки в мастерской? Мяч прилетит в ёлку, ёлка в эльфа.'); return; } yield* shootCannon(g); } } },
      { id: 'tramp', name: 'Батут', rect: [172, 178, 44, 14], walk: [200, 168], face: 's', noWalkItem: true,
        look: 'Батут для кукол. Пружинит так, что мяч от него взлетает до потолка.',
        use: 'Прыгать на кукольном батуте я не буду. Он не для моего веса и не для моей должности.' },
      { id: 'pounder', name: 'Камбалобой', rect: [396, 150, 30, 46], walk: [440, 168], face: 'w', noWalkItem: true,
        look: g => g.f.santaDown ? 'Камбалобой. Хвост опущен. Своё он отработал.' : 'Камбалобой. Игрушечная рыба на пружине. Если в чашу сверху падает что-нибудь тяжёлое, рыба бьёт хвостом.',
        use: 'Пружина тугая. Рыба ждёт груза в чаше.' },
      { id: 'crate', name: 'Ящик', rect: [280, 164, 44, 32], walk: [302, 160], face: 's',
        look: function* (g) {
          if (g.f.santaDown && !g.f.shipped) { yield* E.ending(g); return; }
          if (g.f.demonOut) { yield g.say('sam', 'Ящик открыт и пуст. Внутри слизь и запах офиса.'); return; }
          yield g.say('sam', 'Ящик сочится слизью. Слизь дрожит, как студень. Штемпель: «Нижняя Манитоба». Адрес: «САНТЕ, Северный полюс».');
          yield g.say('sam', 'На боку бумажка: «Содержимое: Шаркающее Корпоративное Присутствие, одна штука». Почерк казённый.');
        },
        use: function* (g) {
          if (g.f.santaDown && !g.f.shipped) { yield* E.ending(g); return; }
          yield g.say('sam', g.f.demonOut ? 'Пустой ящик. Даже слизь уже ушла.' : 'Ящик заколочен. Изнутри что-то булькает. Открывать не хочется.');
        } }
    ],
    actors: {
      elfr: {
        name: 'Красный эльф', walk: [140, 156], face: 'w',
        look: g => g.f.demonOut ? 'Красный эльф лежит без сознания. Глаза у него крестиками, но дышит ровно.' : 'Красный эльф, старший смены. Колпак, планшет, взгляд человека, у которого горит квартал. Чем-то он пахнет. Кажется, студнем.',
        talk: function* (g) { if (g.f.demonOut) { yield g.say('sam', 'Эльф без сознания. Пусть полежит, он три недели работал на демона.'); return; } yield g.talkTo('elfr'); },
        use: 'Трогать эльфа на смене? Он внесёт меня в план.',
        items: { gun: function* (g) { yield g.say('elfr', 'Без стрельбы, пожалуйста. Стрельба у нас наверху.'); }, max: function* (g) { yield g.say('max', 'Эльф! Ты пахнешь холодцом!'); yield g.say('elfr', 'Это новый одеколон. Корпоративный.'); }, '*': function* (g) { yield g.say('elfr', 'Это не по плану. Оформите заявку.'); } }
      },
      elfg: {
        name: 'Зелёный эльф', walk: g => (g.f.elfCried ? [500, 176] : [310, 156]), face: 'e',
        look: g => g.f.elfCried ? 'Зелёный эльф стоит в углу носом к стене и шмыгает. Ему впервые грустно, и он этим немного гордится.' : 'Зелёный эльф-практикант. С лейкой. Улыбается так, будто ему за это доплачивают.',
        talk: function* (g) { yield g.talkTo('elfg'); },
        use: 'Щекотать эльфа? Он и так смеётся без перерыва.',
        items: { gun: function* (g) { yield g.say('elfg', 'Ой, пистолет! Блестит! Можно потрогать?'); yield g.say('sam', 'Даже оружие его не пугает.'); }, max: function* (g) { yield g.say('max', 'Р-р-р!'); yield g.say('elfg', 'Ути какой!'); }, '*': function* (g) { yield g.say('elfg', 'Это мне?! Спасибо! Ой, нет, вы просто показываете. Всё равно спасибо!'); } }
      },
      santa: {
        name: 'Злой Санта', walk: [360, 176], face: 'e',
        look: 'Санта с демоном внутри. Глаза зелёные, в бороде слизь, автомат на взводе. Стоит между ящиком и Камбалобоем и никого не выпускает.',
        talk: function* (g) {
          const lines = ['Хо. Хо. Хо. Ваш запрос обрабатывается. Срок обработки вечность.', 'Список непослушных пересмотрен. Теперь в нём все.', 'Подарки отзываются. Возврат по почте, за ваш счёт.'];
          yield g.say('santa', lines[(g.count('evilsanta') - 1) % lines.length]);
        },
        use: 'Подойти к Санте с автоматом? Мне дорога шляпа.',
        items: {
          gun: function* (g) { yield g.anim('sam', 'shoot', 0.4); g.sfx('gun'); yield g.say('santa', 'Пуля в бороде. Бороду зачтём как бронежилет.'); },
          glove: 'Перчатка Джимми против Санты с демоном? Нужно что-то потяжелее.',
          '*': function* (g) { yield g.say('santa', 'Подарок? Отклонено. Подарков больше нет.'); }
        }
      }
    },
    enter: function* (g) {
      if (E.finale(g)) { yield* E.finaleEnter(g); return; }
      if (!g.seen.workshop201) {
        g.seen.workshop201 = 1;
        g.f.workshopSeen = true;
        g.sfx('tommy');
        yield g.say('sam', 'Мастерская Санты. Ёлка, игрушки, раздатчик подарков в виде жука и два эльфа, которые делают вид, что не слышат стрельбы сверху.');
      }
    },
    setup(g) {
      const elfr = g.actors.elfr, elfg = g.actors.elfg, santa = g.actors.santa;
      if (!g.f.demonOut) { g.place('elfr', 'workshop', 146, 150, 'w'); elfr.act = 'work'; elfr.keepAct = true; }
      else if (!g.f.shipped) { g.place('elfr', 'workshop', 150, 172, 'e'); elfr.act = 'faint'; elfr.keepAct = true; }
      else if (elfr.room === 'workshop') g.place('elfr', 'nowhere', 0, 0);
      if (!g.f.demonOut) { if (g.f.elfCried) g.place('elfg', 'workshop', 520, 180, 'n'); else g.place('elfg', 'workshop', 330, 156, 'w'); elfg.act = ''; elfg.keepAct = false; }
      else if (elfg.room === 'workshop' && !g.f.shipped) g.place('elfg', 'nowhere', 0, 0);
      if (E.finale(g)) {
        if (!g.vt.finale) g.vt.finale = newFinale();
        g.place('santa', 'workshop', 352, 168, 'w');
        santa.v = 'evil'; santa.act = 'shoot'; santa.keepAct = true;
      } else if (santa.room === 'workshop') g.place('santa', 'nowhere', 0, 0);
    },
    ambient: function* (g) {
      for (;;) {
        yield 3 + g.rng.next() * 2;
        if (E.finale(g) && !g.busy) { g.sfx('tommy'); g.fx.shake = Math.max(g.fx.shake, 0.15); }
      }
    }
  };

  E.FINALE = { TRAMP, POUND, newFinale, planePos, FIN_CAM };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
