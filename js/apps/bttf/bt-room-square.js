(function (S, B) {
  'use strict';
  const C = B.C;
  const E = B.EP1;
  const G = B.grey;
  const { ROOMS, TALK, LAYERS } = E;
  const { card, doc, PAPERS } = B.games;
  const AL = g => E.alias(g);

  LAYERS.square = {
    rocket: () => G.layer(44, 26, b => { G.rect(b, 2, 8, 30, 12, C.grey, { b: 2 }); G.poly(b, [32, 6, 42, 14, 32, 22], C.steel, { b: 3 }); }),
    bike: () => G.layer(80, 50, b => { for (const x of [16, 62]) G.ell(b, x, 34, 14, 14, C.grey, { b: 1 }); G.poly(b, [16, 34, 36, 14, 62, 34], C.pink, { b: 3 }); G.rect(b, 54, 8, 20, 12, C.wood, { b: 2 }); })
  };

  const MUTTER = 'Думай, Эмметт, думай! H в степени A, умноженное на обратную A...';

  function* mutter(g) {
    g.vt.muttering = true;
    g.f.heardMutter = true;
    yield g.say('emmett', MUTTER, { dur: 2.4 });
    g.vt.muttering = false;
  }

  ROOMS.square = {
    id: 'square', name: 'Площадь суда', w: 1600, music: g => g.f.night ? 'bt_night' : 'bt_square',
    scale: [330, 0.86, 472, 1],
    bgKey: g => g.f.night ? 'n' : '',
    paint: (b, g) => B.BG31.paintSquare31(b, g.f.night),
    walk: [[24, 330, 1576, 330, 1590, 472, 10, 472]],
    noSave: g => !g.f.alias,
    layers: [
      { id: 'rocket', x: 140, y: 380, base: 404, when: g => g.f.night && g.f.jailFailed && !g.has('rocket') && !g.f.rocketBike },
      { id: 'bike', x: 220, y: 370, base: 418, when: g => g.f.night && g.f.jailFailed && !g.f.rocketBike }
    ],
    hot: [
      { id: 'west', name: 'Улица у дома №10', rect: [0, 300, 24, 172], walk: [20, 420], exitDir: 'w', look: 'Переулок за участком.', exit: function* (g) {
        if (g.f.night) { yield g.say('marty', 'Сейчас не до прогулок.'); return; }
        yield* g.goRoom('arthur', { x: 600, y: 420, dir: 'w' });
      } },
      { id: 'station', name: 'Дверь участка', rect: [150, 220, 40, 85], walk: [170, 340], face: 'n', look: 'Полицейский участок, основан в 1891 году.', use: 'Заперто. И стучаться туда в моём положении глупо.' },
      { id: 'jail', name: 'Окно камеры', rect: [80, 190, 46, 40], walk: [104, 340], face: 'n', look: g => g.f.jailFailed ? 'Камера пуста. Дока увезли.' : 'Зарешёченное окно камеры.', act: 'talk', talk: function* (g) {
        if (g.f.jailFailed) { yield g.say('marty', 'Пусто.'); return; }
        yield g.talkTo('doc31');
      }, items: { recorder: function* (g) { if (g.f.mutter && !g.f.hamilton) yield* hamilton(g); else yield g.say('doc', 'Эту кассету я уже слышал, Марти. Сам и записывал.'); }, paper: 'Доку лучше не знать, что про него пишут.', photo: function* (g) { yield g.say('doc', 'Джордж! Прекрасно выглядит. Береги его, Марти.'); }, '*': function* (g) { yield g.say('doc', 'Марти, сейчас не до сувениров.'); } } },
      { id: 'kitchen', name: 'Столовая сестёр милосердия', rect: [350, 220, 44, 85], walk: [372, 340], face: 'n', look: '«Приходите за супом, оставайтесь ради спасения».', exitDir: 'n', exit: function* (g) {
        if (g.f.night) { yield g.say('marty', 'Закрыто.'); return; }
        yield* g.goRoom('kitchen', { x: 700, y: 420, dir: 'w' });
      } },
      { id: 'tree', name: 'Дерево', rect: [490, 100, 80, 200], walk: [530, 360], face: 'n', look: 'Старый дуб посреди сквера.' },
      { id: 'bandstand', name: 'Эстрада', rect: [600, 120, 170, 185], walk: [690, 345], face: 'n', look: 'Восьмигранная эстрада с флагом.', use: 'Лезть на крышу просто так? Нет.' },
      { id: 'courthouse', name: 'Двери суда', rect: [905, 215, 46, 90], walk: [928, 340], face: 'n', look: 'Суд Хилл-Вэлли. Часы на фронтоне идут, и никакой молнии.', use: function* (g) {
        if (!g.f.butler) { yield g.say('marty', 'Мне в суд не надо. Пока.'); return; }
        if (g.f.emmettMet) { yield g.say('marty', 'Эмметт и так всё время туда-сюда бегает.'); return; }
        yield* meetEmmett(g);
      } },
      { id: 'lawsign', name: 'Вывеска конторы', rect: [1023, 173, 84, 28], walk: [1065, 340], face: 'n', look: function* (g) { g.f.hiBob = true; yield g.say('marty', 'Юридическая контора «Гейл, Земекис и Файн». Звучит знакомо. Где-то я эти фамилии видел.'); }, use: 'Табличка: «Коммивояжёрам не входить».' },
      { id: 'furs', name: 'Меха Ламонта', rect: [1120, 170, 80, 135], walk: [1160, 340], face: 'n', look: 'Меха Ламонта. В июне тут, наверное, тихо.' },
      { id: 'ruins', name: 'Развалины бара', rect: [1210, 150, 130, 155], walk: [1275, 340], face: 'n', look: 'Здесь стоял подпольный бар. Доски крест-накрест, табличка «Закрыто». Ещё пахнет гарью.', use: 'Тут уже нечего искать.' },
      { id: 'stationers', name: 'Канцтовары', rect: [1350, 170, 70, 135], walk: [1385, 340], face: 'n', look: 'Канцтовары Хилл-Вэлли, с 1900 года.' },
      { id: 'barber', name: 'Парикмахерская О’Мэлли', rect: [1430, 160, 110, 70], walk: [1485, 340], face: 'n', look: 'Парикмахерская О’Мэлли и сыновей. Полосатый столб, у входа помост чистильщика.', use: 'Попросить муссу? Здесь решат, что я про лося.' },
      { id: 'poster', name: 'Афиша', rect: [1546, 200, 50, 70], walk: [1560, 340], face: 'n', look: '«Акула». Снимали, похоже, настоящую акулу.' },
      { id: 'east', name: 'Дорога из города', rect: [1590, 300, 10, 172], walk: [1584, 420], exitDir: 'e', look: 'Две мили до щита, за которым спрятан ДеЛориан.', exit: 'Без Дока я туда не вернусь.' },
      { id: 'rocket', name: 'Ракета', rect: [140, 380, 44, 26], when: g => g.f.night && g.f.jailFailed && !g.has('rocket') && !g.f.rocketBike, walk: [170, 420], face: 'w', look: 'От бура осталась одна ракета. Двигатель цел.', use: function* (g) { yield g.anim('marty', 'reach', 0.5); g.give('rocket'); } },
      { id: 'bike', name: 'Велосипед Эдны', rect: [220, 370, 80, 48], when: g => g.f.night && g.f.jailFailed && !g.f.rocketBike, walk: [260, 430], face: 'n', look: 'Бледно-розовый велосипед с корзиной.', use: 'Педалями фургон не догнать.', items: { rocket: rocketBike } }
    ],
    actors: {
      edna: { name: 'Эдна', dist: 46, look: 'Эдна Стрикленд. Репортёр, блокнот и карандаш наготове.', talk: function* (g) { yield g.talkTo('edna31'); }, items: { paper: 'Эдне лучше не видеть газету из будущего.', photo: function* (g) { yield g.say('edna', 'Хорошее лицо. Порядочное. Не то что у некоторых.'); } } },
      einstein: { name: 'Эйнштейн', dist: 40, look: 'Эйнштейн нюхает траву у дерева.', talk: function* (g) { yield g.say('einstein', 'Гав!'); }, items: { hat: function* (g) {
        yield g.say('marty', 'Найдёшь хозяина этой шляпы?');
        yield g.say('einstein', 'Гав!');
        g.f.arthurFound = true;
        g.place('einstein', 'arthur', 300, 420, 'e');
        yield* card(g, '', ['Эйнштейн тянет Марти в переулок за участком, к дому №10 над бильярдной.']);
        yield* g.goRoom('arthur', { x: 420, y: 420, dir: 'w' });
      }, shoe: 'Туфлю он уже нашёл.' } },
      emmett: { name: 'Эмметт', dist: 44, hold: true, look: 'Эмметт Браун, семнадцать лет. Длинный, нервный и всё время куда-то спешит.', talk: function* (g) { yield g.talkTo('emmett'); }, items: { recorder: function* (g) {
        if (!g.vt.muttering) {
          g.vt.hold = g.time + 8;
          const t0 = g.time;
          yield g.until(gg => gg.vt.muttering || gg.time > t0 + 6);
          if (!g.vt.muttering) { yield g.say('marty', 'Записывать пока нечего. Он молчит.'); return; }
        }
        g.f.mutter = true;
        g.sfx('click');
        yield g.say('marty', 'Есть.');
      } } },
      kid: { name: 'Кид Таннен', dist: 50, look: 'Ирвинг «Кид» Таннен. Костюм в полоску, шляпа, взгляд как у бульдога.', talk: function* (g) {
        if (g.f.arthurRefused && !g.f.kidTaped) { yield* chase(g); return; }
        yield g.talkTo('kid');
      }, items: { subpoena: 'Показать Киду повестку? Тогда Арти точно не доживёт до суда.', photo: 'Киду мою семью лучше не показывать.' } },
      matches: { name: 'Спичка', dist: 44, look: 'Спичка. Длинный, тощий, со спичкой в зубах.', talk: function* (g) { yield g.say('matches', 'Проваливай, малец.'); } }
    },
    ambient: function* (g) {
      const PTS = [[928, 352, false], [995, 360, true], [1062, 354, false], [995, 360, true]];
      let i = 0, next = 0;
      for (;;) {
        yield 0.3;
        const e = g.actors.emmett;
        if (!e || e.room !== 'square' || g.f.emmettHelps || !g.f.emmettMet || g.vt.muttering) continue;
        const held = g.vt.hold && g.vt.hold > g.time;
        if (e.scripted || g.dialog || held) {
          if (held && !e.scripted && !g.dialog && g.time > next) { next = g.time + 3; yield* mutter(g); }
          continue;
        }
        const [x, y, m] = PTS[i++ % PTS.length];
        yield g.walkTo('emmett', x, y);
        if (m && !g.dialog && !e.scripted) yield* mutter(g);
        else yield 1;
      }
    },
    enter: function* (g) {
      if (g.f.arrived && !g.f.alias) yield* interview(g);
      else if (g.f.night && !g.f.jailFailed) yield* jailbreak(g);
    },
    setup(g) { E.dress(g); },
    leave(g) { g.vt.muttering = false; }
  };

  function* interview(g) {
    const e = g.actors.edna;
    e.scripted = true;
    yield g.walkTo('edna', g.actors.marty.x - 60, g.actors.marty.y);
    g.faceTo('edna', g.actors.marty.x);
    yield g.say('edna', 'Эдна Стрикленд, «Хилл-Вэлли телеграф». Утренний выпуск: «Карл Саган предстанет перед судом за поджог бара».');
    yield* doc(g, PAPERS.young);
    yield g.say('edna', 'Что вы думаете о Карле Сагане, незнакомце, который в одиночку сделал то, чего не смог закон?');
    yield g.talkTo('interview');
    e.scripted = false;
    yield g.walkTo('edna', 820, 404);
    g.face('edna', 'w');
    if (g.actors.einstein.room === 'square') {
      yield g.say('edna', 'И уберите собаку. Злых собак водят на поводке. Это закон. Проверьте.');
      yield g.say('einstein', 'Гав!');
    }
  }

  TALK.interview = { portrait: 'edna', options: (g, d) => {
    const st = d.data.step || 0;
    if (st === 0) return [
      { id: 'fan', text: 'Я его поклонник.', run: function* () { d.data.step = 1; yield g.say('edna', 'Поклонник поджигателя? Смело. Я запишу «сочувствующий».'); yield g.say('edna', 'Ваше имя?'); } },
      { id: 'against', text: 'Я против поджогов.', run: function* () { d.data.step = 1; yield g.say('edna', 'Вот это гражданская позиция. Ваше имя?'); } },
      { id: 'dunno', text: 'Я здесь проездом.', run: function* () { d.data.step = 1; yield g.say('edna', 'Приезжие тоже граждане. Ваше имя?'); } }
    ];
    if (st === 1) return ['Майкл Корлеоне', 'Гарри Каллахан', 'Сонни Крокетт'].map((nm, i) => ({ id: 'n' + i, text: nm + '.', run: function* () {
      g.f.alias = nm; d.data.step = 2;
      yield g.say('edna', nm + '. Записала. Что вы скажете преступному миру Хилл-Вэлли?');
    } }));
    return [
      { id: 'day', text: 'Давай, порадуй меня.', end: true, run: function* () { yield g.say('edna', 'Порадовать чем? Ладно, сойдёт для подписи под фото.'); } },
      { id: 'run', text: 'Бегите, пока не поздно.', end: true, run: function* () { yield g.say('edna', 'Коротко и по делу. Мне нравится.'); } }
    ];
  } };

  TALK.doc31 = { portrait: 'doc', start: function* (g) {
    if (!g.f.docMet) {
      g.f.docMet = true;
      E.setChapter(g, 4);
      yield g.say('doc', 'Марти!');
      yield g.say('marty', 'Док! Ты жив!');
      yield g.say('doc', 'Пока. Я приехал разобраться с пожаром в баре, попал под взрыв, получил кирпичом по голове. Очнулся здесь, а Кид Таннен говорит, что поджигатель я.');
    }
  }, options: [
    { id: 'back', text: 'Давай просто вернёмся в будущее.', run: function* (g) { yield g.say('doc', 'Прекрасная мысль. Осталось пройти сквозь решётку.'); } },
    { id: 'break', text: 'Тогда я вытащу тебя из тюрьмы.', run: function* (g) {
      yield g.say('doc', 'Несколько месяцев назад мой семнадцатилетний я подал заявку на патент ракетного бура. Если его достроить, он прогрызёт эту стену как сыр.');
      g.f.drillKnown = true;
    } },
    { id: 'where', text: 'Где найти тебя молодого?', when: g => g.f.drillKnown && !g.has('number') && !g.f.butler, run: function* (g) {
      yield g.say('doc', 'Позвони домой, Браунам. Номер я помню. Вот.');
      g.give('number');
    } },
    { id: 'mut', text: 'Молодой ты всё время что-то бормочет.', when: g => g.f.heardMutter && !g.f.hamilton, once: true, run: function* (g) {
      yield g.say('doc', 'Задача Иванова! Она мучила меня всё лето тридцать первого.');
    } },
    { id: 'tape', text: 'Я записал бормотание молодого тебя.', when: g => g.f.mutter && !g.f.hamilton, run: function* (g) { yield* hamilton(g); } },
    { id: 'car', text: 'Откуда у тебя этот ДеЛориан?', once: true, run: function* (g) {
      g.f.docCar = true;
      yield g.say('doc', 'Помнишь грозу пятьдесят пятого? Молния дала временного двойника: копия машины ушла на семьдесят лет вперёд, в 2025 год.');
      yield g.say('doc', 'Я её оттуда забрал и поставил автовозврат. Как видишь, не зря.');
    } },
    { id: 'family', text: 'Как Клара и дети?', once: true, run: function* (g) {
      yield g.say('doc', 'Жюлю и Верну скоро по тринадцать. Мы с Кларой спорим, в каком десятилетии отдавать их в колледж.');
      yield g.say('doc', 'А в 2011 году мы собирались навестить вас с Дженнифер.');
    } },
    { id: 'bye', text: 'Держись, Док.', end: true }
  ] };

  function* hamilton(g) {
    g.sfx('rewind');
    yield g.say('marty', 'Послушай. Это молодой ты.');
    yield E.voice(g, 'emmett', MUTTER, 104, 300);
    yield g.say('doc', 'Задача Иванова! H здесь оператор. Гамильтониан!');
    yield g.say('doc', 'Хотя подсказывать самому себе опасно. Разве что вся реальность окажется голографической иллюзией на огромной двумерной мембране. Тогда можно.');
    g.f.hamilton = true;
  }

  function* meetEmmett(g) {
    g.f.emmettMet = true;
    g.sfx('door');
    g.place('emmett', 'square', 928, 330, 's');
    const e = g.actors.emmett;
    e.scripted = true;
    yield g.walkTo('emmett', 940, 360);
    g.faceTo('emmett', g.actors.marty.x);
    yield g.say('marty', 'Эмметт Браун?');
    yield g.say('emmett', 'Простите, я на службе. Отец ждёт бумаги.');
    e.scripted = false;
  }

  TALK.emmett = { portrait: 'emmett', options: [
    { id: 'help', text: 'У меня к тебе важное дело.', when: g => !g.f.hamilton, run: function* (g) { yield g.say('emmett', 'У всех важное дело. А у меня папки.'); } },
    { id: 'sci', text: 'Я тоже учёный!', when: g => !g.f.hamilton, run: function* (g) { yield g.say('emmett', 'Вы меня с кем-то путаете. Я юрист. Наука меня совершенно не интересует!'); } },
    { id: 'drill', text: 'Я слышал, ты строишь ракетный бур.', when: g => !g.f.hamilton, run: function* (g) { yield g.say('emmett', 'Тише! Кто вам сказал? Здесь всё слышно до самого зала заседаний.'); } },
    { id: 'scared', text: 'Ты чего такой испуганный?', when: g => !g.f.hamilton, once: true, run: function* (g) { yield g.say('emmett', 'Отец здесь судья. Если он узнает, чем я занимаюсь по ночам... Неважно.'); } },
    { id: 'ham', text: 'Может, H это оператор Гамильтона?', when: g => g.f.hamilton && !g.f.patent, run: function* (g) {
      yield g.say('emmett', 'Гамильтониан... Ну конечно! Как я сам не...');
      yield g.say('emmett', 'Откуда вы знаете про задачу Иванова? Кто вы?');
      yield g.say('marty', 'Скажем так, я из будущего.');
      yield g.say('emmett', 'Из будущего... Из патентного бюро! Вы читали мою заявку!');
      yield g.say('marty', 'Ага. Именно. Из бюро. В Вашингтоне. Если бур не будет готов, патент уйдёт некоему доктору Маккою.');
      g.f.patent = true;
    } },
    { id: 'need1', text: 'Мне нужен твой бур.', when: g => g.f.patent && !g.f.emmettHelps, run: function* (g) { yield g.say('emmett', 'Он почти готов. Почти.'); } },
    { id: 'need2', text: 'Мне ОЧЕНЬ нужен твой бур.', when: g => g.f.patent && !g.f.emmettHelps && g.used['emmett.need1'], run: function* (g) { yield g.say('emmett', 'Очень почти готов.'); } },
    { id: 'tonight', text: 'Он нужен мне сегодня!', when: g => g.f.patent && !g.f.emmettHelps, run: function* (g) {
      yield g.say('marty', 'Это твоё будущее, Док... Эмметт. Во всех смыслах.');
      yield g.say('emmett', 'Сегодня? Для топлива нужен спирт в девяносто пять градусов. А на дворе сухой закон.');
      yield g.say('emmett', 'И я не могу уйти: отец велел вручить повестку свидетелю. Некоему Артуру Макфлаю. Он должен дать показания против Кида Таннена.');
      yield g.say('marty', 'Макфлаю? Давай повестку. Я вручу.');
      g.give('subpoena');
      g.f.emmettHelps = true;
      E.setChapter(g, 5);
      yield g.say('emmett', 'Тогда я буду в столовой. Там хотя бы сидят и не задают вопросов.');
    } },
    { id: 'bye', text: 'Ещё увидимся.', end: true }
  ], end: function* (g) {
    if (g.f.emmettHelps && g.actors.emmett.room === 'square') g.place('emmett', 'kitchen', 120, 410, 'e');
  } };

  TALK.edna31 = { portrait: 'edna', options: [
    { id: 'scoop', text: 'Что нового?', run: function* (g) { yield g.say('edna', 'В столовой сестёр милосердия что-то нечисто. Суп возят бочками, а нищих там не прибавляется.'); } },
    { id: 'sss', text: 'Что за общество трезвости?', run: function* (g) {
      yield g.say('edna', '«Трезвый взгляд». Я основательница. Нас выгнали из церковного подвала, и теперь нам негде собираться.');
      g.f.ednaSociety = true;
    } },
    { id: 'meet', text: 'Я знаю, где обществу собраться! У Браунов.', when: g => g.f.ednaSociety && g.f.emmettHelps && !g.f.ednaMeet, run: function* (g) {
      yield g.say('edna', 'В доме судьи Брауна? Это было бы... достойно. Я передам дамам.');
      g.f.ednaMeet = true;
    } },
    { id: 'soup', text: 'Вы развозите суп?', run: function* (g) {
      yield g.say('edna', 'Беру горячий суп в столовой и развожу по приютам: сиротский приют, ранчо для нежеланных детей, лечебница для неизлечимых, дом престарелых.');
    } },
    { id: 'help', text: 'Я могу помочь с супом.', when: g => !g.f.ednaSoup, run: function* (g) {
      yield g.say('edna', 'Тогда говорите мне, где кончился суп. Я сразу привезу.');
      g.f.ednaSoup = true;
    } },
    { id: 'bike', text: 'Отличный велик. Нервный?', once: true, run: function* (g) { yield g.say('edna', 'Велосипед не нервный. Я не нервная. Я страстная!'); } },
    { id: 'charity', text: 'Я знаю, кому нужен суп: обществу трезвости!', when: g => g.f.ednaHooch && g.f.ednaMeet && g.f.ednaSoup && !g.f.hoochSent, run: function* (g) {
      yield g.say('edna', 'Отвезти суп на собрание? Прекрасная мысль.');
      const em = g.actors.emmett;
      g.place('emmett', 'square', g.actors.marty.x + 50, g.actors.marty.y, 'w');
      em.scripted = true;
      yield g.say('emmett', 'Во имя Томаса Алвы Эдисона, что вы творите?! Пьяницы, пусть и бывшие, в доме отца?');
      em.scripted = false;
      yield g.talkTo('sober');
    } },
    { id: 'bye', text: 'Хорошего дня, мисс Стрикленд.', end: true }
  ] };

  TALK.sober = { portrait: 'emmett', options: [
    { id: 'sober', text: 'Они трезвые.', run: function* (g) { yield g.say('emmett', 'Сегодня трезвые. А завтра?'); } },
    { id: 'quiet', text: 'Они будут тихими.', run: function* (g) { yield g.say('emmett', 'Тихие дамы с плакатами? Таких не бывает.'); } },
    { id: 'forget', text: 'Ладно. Забудь. Без бура патента не будет.', end: true, run: function* (g) {
      yield g.say('emmett', 'Стойте! Ладно. Пусть приезжают. Только в гостиную, не в подвал.');
      yield g.say('edna', 'Суп будет у Браунов к вечеру.');
      g.f.hoochSent = true;
      g.place('emmett', 'kitchen', 120, 410, 'e');
      yield* E.checkBoth(g);
    } }
  ], end: function* (g) { if (!g.f.hoochSent) yield g.say('edna', 'Я подожду, пока вы договоритесь.'); } };

  TALK.kid = { portrait: 'kid', start: function* (g) {
    if (!g.f.kidMet) {
      g.f.kidMet = true;
      yield g.say('kid', 'Спичка, ты мне всю ваксу на носки посадил!');
      yield g.say('matches', 'Простите, босс.');
      yield g.say('kid', 'Пошёл вон!');
      const m = g.actors.matches;
      m.scripted = true;
      yield g.walkTo('matches', 1540, 410);
      m.scripted = false;
    }
  }, options: [
    { id: 'shine', text: 'Видимо, я пришёл почистить вам ботинки.', once: true, run: function* (g) { yield g.say('kid', 'Новенький? Ну, чисть. Только без фокусов, как этот.'); } },
    { id: 'artie', text: 'Я ищу Артура Макфлая.', run: function* (g) { yield g.say('kid', 'Арти занят. Сидит, где я сказал, и считает мои деньги.'); g.f.askArtie = true; } },
    { id: 'hat', text: 'Это же шляпа Арти?', when: g => g.f.askArtie && !g.has('hat') && !g.f.hatTaken, run: function* (g) { yield g.say('kid', 'Была его. Теперь это миска для арахиса. Удобная.'); g.f.seenHat = true; } },
    { id: 'nuts', text: 'Можно арахиса?', when: g => g.f.seenHat && !g.f.hatTaken, run: function* (g) { yield g.say('kid', 'Угощайся. Добрый я сегодня.'); g.f.nutsOffered = true; } },
    { id: 'what', text: 'Это ещё что такое?!', when: g => g.f.nutsOffered && !g.f.hatTaken, end: true, run: function* (g) {
      yield g.say('kid', 'Где?!');
      g.f.hatTaken = true;
      g.give('hat');
      yield g.say('kid', 'Эй! Шляпа! Держи его!');
      yield* card(g, '', ['Марти с шляпой Арти ныряет в толпу у суда. Кид машет кулаком, но со стула не встаёт: ботинки ещё не дочищены.']);
    } },
    { id: 'bye', text: 'Хорошего дня, мистер Таннен.', end: true }
  ] };

  function* chase(g) {
    yield g.say('kid', 'Ты! Тот, что со шляпой! Спичка, взять его!');
    yield* B.cine.play(g, B.cine.squareChase());
    g.place('kid', 'bandstand', 260, 440, 'n');
    g.place('matches', 'bandstand', 400, 446, 'n');
    g.place('einstein', 'bandstand', 520, 440, 'w');
    yield* g.goRoom('bandstand', { x: 320, y: 250, dir: 's' });
  }

  function* jailbreak(g) {
    yield* B.cine.play(g, B.cine.drillBlast());
    yield g.say('marty', 'Док? Док!');
    g.drop('drill');
    yield g.say('marty', 'Камера пуста.');
    g.f.paperV = 2;
    yield* B.cine.play(g, B.cine.rewrite());
    yield* doc(g, PAPERS.v2);
    yield g.say('marty', 'Он всё равно погибает, только по-другому. Это нечестно.');
    g.place('edna', 'square', 300, 410, 'w');
    yield g.say('edna', 'Фургон только что уехал! Арестанта перевозят. Но за рулём не полицейский. Это Кид Таннен!');
    g.f.jailFailed = true;
    E.setChapter(g, 7);
  }

  function* rocketBike(g) {
    g.drop('rocket');
    g.f.rocketBike = true;
    yield g.say('edna', 'Это мой велосипед!');
    yield g.say('marty', 'Я верну. Наверное.');
    yield* B.cine.play(g, B.cine.rocketRide());
    g.place('kid', null, 0, 0, 's');
    yield* g.goRoom('wagonb', { x: 320, y: 420, dir: 'n' });
  }

  E.DRESS.push(g => {
    const e = g.actors.edna;
    if (e && !e.scripted && !e.path) { e.act = 'hips'; e.keepAct = true; }
    const k = g.actors.kid;
    if (k && k.room === 'square' && !k.scripted && !k.path) { k.act = 'sit'; k.keepAct = true; }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
