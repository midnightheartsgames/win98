(function (S) {
  'use strict';
  const { ROOMS, TALK } = S;

  S.checkCures = function* (g) {
    const f = g.f;
    if (f.specsCured && f.whizzerCured && f.peepersCured && !f.allCured) {
      f.allCured = true;
      yield g.say('sam', 'Все три Сода-Поппера снова в своём уме. В том, какой был.');
      if (g.roomId === 'street') yield* vanScene(g);
      else yield g.say('max', 'Пошли на улицу, Сэм! Пусть Попперы нас отблагодарят. Деньгами.');
    }
  };

  function* vanScene(g) {
    const sp = g.actors.specs, wz = g.actors.whizzer, pp = g.actors.peepers;
    g.camLock = null;
    g.place('specs', 'street', 330, 150, 'w'); sp.act = ''; sp.keepAct = false; sp.hypno = false; sp.visible = true;
    g.place('whizzer', 'street', 470, 150, 'w'); wz.act = ''; wz.hypno = false; wz.v = 'nobasket'; wz.visible = true;
    g.place('peepers', 'street', 250, 150, 'e'); pp.act = ''; pp.hypno = false; pp.v = ''; pp.visible = true;
    yield g.walkTo('sam', 300, 152);
    g.face('sam', 'e');
    yield g.walkTo('whizzer', 350, 152);
    yield g.say('specs', 'Вольная полиция! Спасибо, что вылечили. Или стукнули. Мы ещё не решили.');
    yield g.say('whizzer', 'Спасибо, вольная полиция!');
    yield g.say('peepers', 'А я стою. На месте. Ноги чешутся.');
    yield g.say('sam', 'Где прячется Брэди Калчер?');
    yield g.say('specs', 'Не знаем. Нас возили к нему в фургоне без окон, и всю дорогу крутили «Ай-Бо».');
    yield g.say('whizzer', 'Вон он! Фургон «Ай-Бо», в переулке у Боско!');
    g.camLock = 400;
    yield g.panTo(400);
    g.sfx('horn');
    yield g.say(null, 'Бр-р-рум!', { key: 'van', color: S.C.grey[5], x: 250, y: 150 });
    const van = g.actors.van;
    van.dir = 'e';
    yield g.walkTo('van', 760, 170, { free: true, speed: 3 });
    van.visible = false;
    g.camLock = null;
    yield g.say('max', 'Удирает! В машину, Сэм! Я поведу!');
    yield g.say('sam', 'Нет. Держись крепче.');
    yield g.walkTo('sam', 80, 164);
    for (const id of ['specs', 'whizzer', 'peepers']) g.place(id, 'nowhere', 0, 0);
    yield* S.startDrive(g, 'chase');
  }

  S.vanScene = vanScene;

  function* ruinGraffiti(g) {
    yield g.walkTo('sam', 218, 148);
    g.face('sam', 'n');
    g.actors.sam.act = 'spray';
    g.sfx('spray');
    yield 1.0;
    g.actors.sam.act = '';
    g.f.graffitiRuined = true;
    g.drop('spray');
    yield g.say('sam', 'Пара штрихов от меня. Улыбка и автограф Макса.');
    yield g.say('max', 'Это мой лучший автопортрет!');
    const sp = g.actors.specs;
    sp.act = ''; sp.keepAct = false;
    g.face('specs', 'w');
    yield g.say('specs', 'Что?! Кто тронул мой рисунок?! МОЙ РИСУНОК!');
    yield g.walkTo('sam', 262, 152);
    g.face('sam', 'w');
    yield g.walkTo('specs', 216, 149);
    g.face('specs', 'n');
    sp.act = 'spray'; sp.keepAct = true;
    yield g.say('specs', 'Всё испорчено! Начинаю заново! Не сойду с места, пока не закончу!');
    yield g.say('sam', 'Он стоит ровно под нашим окном, Макс.');
    yield g.say('max', 'Обожаю такие совпадения!');
  }

  TALK.specs = {
    options: [
      { id: 'what', icon: 'q', text: 'Что это ты тут рисуешь?', run: function* (g) {
        yield g.say('specs', 'Это послание. Ай-Бо. Смотрите в глаза. Покупайте кассеты.');
      } },
      { id: 'who', icon: 'q', text: 'Ты ведь Спекс из «Сода-Попперов»?', run: function* (g) {
        yield g.say('specs', 'Сода-Попперы... Газировка, газировка... лопни пузырёк...');
        yield g.say('specs', 'Нас было трое. Я, Уиззер, Пиперс. Теперь мы служим Ай-Бо.');
        g.f.knowPoppers = true;
      } },
      { id: 'brady', icon: 'f:brady', text: 'Кто такой Брэди Калчер?', when: g => g.f.knowPoppers, run: function* (g) {
        yield g.say('specs', 'Брэди наш друг. Брэди наш учитель. Брэди ребёнок-звезда, который так и не стал звездой.');
        yield g.say('specs', 'Это неважно. Смотрите в глаза.');
        g.f.knowBrady = true;
      } },
      { id: 'eyebo', icon: 'eye', text: 'Что такое «Ай-Бо»?', run: function* (g) {
        yield g.say('specs', 'Аэробика для глаз. Бесплатные кассеты у Боско. Смотрите. Покупайте. Смотрите снова.');
        g.f.knowEyebo = true;
      } },
      { id: 'stop', icon: 'ex', text: 'Прекрати портить стены!', run: function* (g) {
        yield g.say('specs', 'Не могу. Я не закончил. Никто не смеет трогать мой рисунок. Никто!');
      } },
      { id: 'glasses', icon: 'duck', text: 'Не жмут очки?', run: function* (g) {
        yield g.say('specs', 'Сорок диоптрий. Всё, что впереди, я вижу за три квартала. Вверх смотреть не нужно. Там только небо.');
        g.f.knowSpecsUp = true;
      } },
      { id: 'bye', icon: 'bye', text: 'Ну, рисуй-рисуй.', end: true, run: function* (g) { yield g.say('specs', 'Смотрите в глаза.'); } }
    ]
  };

  TALK.specsOk = {
    options: [
      { id: 'how', icon: 'q', text: 'Как самочувствие?', run: function* (g) { yield g.say('specs', 'Как будто мне на голову упал шар для боулинга.'); yield g.say('max', 'Так и было!'); } },
      { id: 'mem', icon: 'eye', text: 'Что ты помнишь?', run: function* (g) {
        yield g.say('specs', 'Кассету. Глаз. Голос Брэди: «Смотри мне в глаза, Спекс, ты никогда не был звездой». Потом только стены и краска.');
      } },
      { id: 'where', icon: 'f:brady', text: 'Где Брэди держит свой приют?', run: function* (g) {
        yield g.say('specs', 'Не знаю. Помню фургон без окон. Он до сих пор ездит по району, развозит кассеты.');
        g.f.knowVan = true;
      } },
      { id: 'bye', icon: 'bye', text: 'Береги голову.', end: true, run: function* (g) { yield g.say('specs', 'Поздно.'); } }
    ]
  };

  ROOMS.street = {
    id: 'street', name: 'Улица', w: 640, music: g => g.f.samHypno ? 'hypno' : 'street',
    scale: [138, 0.84, 166, 0.92],
    paint: (b) => S.BG.street(b),
    walk: [[0, 139, 640, 139, 640, 166, 0, 166]],
    layers: [
      { id: 'oldGraffiti', x: 186, y: 78, key: g => g.f.graffitiRuined && !g.f.specsFixed ? 'r' : '' },
      { id: 'newGraffiti', x: 342, y: 80 },
      { id: 'lamp', x: 166, y: 56, base: 166 },
      { id: 'lamp', art: 'lamp', x: 436, y: 56, base: 166 },
      { id: 'hydrant', x: 258, y: 148, base: 166 },
      { id: 'mailbox', x: 384, y: 136, base: 164 },
      { id: 'desoto', x: 14, y: 156, base: 200 },
      { id: 'redcar', x: 150, y: 162, base: 199 },
      { id: 'spray', x: 238, y: 160, base: 200, when: g => !g.f.sprayTaken }
    ],
    sprites(g) {
      const out = [];
      if (g.f.ballFalling) {
        const t = Math.min(1, (g.time - g.f.ballFalling) / 1.0);
        const y = -20 + t * t * 110;
        out.push({ y: 300, draw: (f, cx) => { const ic = S.icon('ball'); S.blit(f, ic, 216 - 12 - cx, y); } });
      }
      return out;
    },
    hot: [
      { id: 'sybildoor', name: 'Кабинет Сибил', rect: [66, 76, 34, 64], walk: [82, 143], face: 'n',
        look: 'Дверь в кабинет Сибил Пандемик. Табличка: «Психотерапия. Лицензия почти настоящая».',
        exit: function* (g) {
          if (g.f.samHypno) { yield g.say('sam', 'Там нет получателя кассет.'); return; }
          g.sfx('door');
          yield* g.goRoom('sybil', { x: 40, y: 170, dir: 'e' });
        } },
      { id: 'officedoor', name: 'Наш офис', rect: [284, 58, 38, 82], walk: [303, 141], face: 'n',
        look: 'Вход в наш дом. Офис на втором этаже. Лифта нет, Макс его съел.',
        exit: function* (g) {
          if (g.f.samHypno) { yield g.say('sam', 'Офис. Кассет там нет.'); return; }
          g.sfx('door');
          yield* g.goRoom('office', { x: 284, y: 162, dir: 'w' });
        } },
      { id: 'boscodoor', name: 'Лавка Боско', rect: [466, 60, 36, 80], walk: [484, 143], face: 'n',
        look: 'Магазин неудобств Боско. Витрины обещают сыр, гранатомёты и загадочные «-0%».',
        exit: function* (g) {
          g.sfx('door');
          yield* g.goRoom('bosco', { x: 36, y: 172, dir: 'e' });
        } },
      { id: 'desoto', name: 'Де Сото', rect: [16, 158, 128, 40], walk: [80, 164], face: 's', walkUse: true,
        look: ['Наш Де Сото «Адвенчурер» шестидесятого года. Кабриолет, мегафон и мигалка на приборной панели.', 'Двигатель V8. Тормоза тоже есть, но мы ими редко пользуемся.'],
        use: function* (g) {
          if (g.f.samHypno) { yield g.say('sam', 'Машина. Мастер сказал: доставлять пешком.'); return; }
          yield* S.openMap(g);
        } },
      { id: 'redcar', name: 'Чужая машина', rect: [152, 164, 84, 32], walk: [200, 164], face: 's',
        look: 'Чужая машина. Судя по вмятинам, хозяин паркуется на слух.',
        use: 'Заперта. А объяснять Комиссару очередной угон мне не хочется.',
        items: { gun: 'Машина ни в чём не виновата.', hanger: 'Могу вскрыть её плечиками, но зачем? Внутри только штраф за парковку.' } },
      { id: 'spray', name: 'Баллончик с краской', rect: [236, 156, 14, 16], when: g => !g.f.sprayTaken, walk: [240, 165], face: 's',
        look: 'Баллончик с краской на багажнике чужой машины. Кто-то закрашивал царапину и бросил на полпути.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.5);
          g.f.sprayTaken = true; g.give('spray');
          yield g.say('sam', 'Конфискую как вещественное доказательство. Чего-нибудь.');
        } },
      { id: 'oldgraffiti', name: g => g.f.graffitiRuined ? 'Испорченное граффити' : 'Граффити «Ай-Бо»', rect: [186, 78, 66, 58], walk: [218, 148], face: 'n',
        look: g => g.f.graffitiRuined ? (g.f.specsCured ? 'Граффити с моей правкой. Спекс так и не закончил.' : 'Моя правка. Спексу не понравилось.') : 'Старое граффити Спекса: зелёный глаз и надпись «EYE-BO!». Сам Спекс сейчас рисует у другой стены.',
        use: 'Оттирать это лапами я не буду.',
        items: {
          spray: function* (g) {
            if (g.f.graffitiRuined) { yield g.say('sam', 'Хватит. Шедевр не терпит суеты.'); return; }
            yield* ruinGraffiti(g);
          },
          gun: 'Пулевые дырки только добавят ему выразительности.'
        } },
      { id: 'newgraffiti', name: 'Свежее граффити', rect: [342, 80, 44, 50], walk: [364, 147], face: 'n',
        look: 'Свежее граффити на заколоченном окне. Краска ещё капает. Спекс работает быстро и бездарно.',
        items: { spray: 'Спекс стоит рядом и сразу всё поправит. Лучше испортить ту картину, что он оставил без присмотра.' } },
      { id: 'window', name: 'Окно нашего офиса', rect: [194, 10, 52, 46], walk: [218, 148], face: 'n',
        look: g => g.f.graffitiRuined && !g.f.specsCured ? 'Наше окно. Как раз над Спексом.' : 'Окно нашего офиса. Отсюда видно, как пыльно у нас внутри.' },
      { id: 'hydrant', name: 'Гидрант', rect: [256, 146, 16, 20], walk: [250, 160], look: 'Пожарный гидрант. Макс однажды пытался его усыновить.', use: 'Нужен специальный ключ. И пожар.' },
      { id: 'mailbox', name: 'Почтовый ящик', rect: [384, 136, 20, 30], walk: [378, 158], look: 'Почтовый ящик. Макс, не ешь письма.', use: function* (g) { yield g.say('max', 'Они сами лезут мне в рот, Сэм!'); } },
      { id: 'boscosign', name: 'Вывеска Боско', rect: [404, 24, 156, 30], look: '«BOSCO\'S. Магазин неудобств». Самая честная вывеска в городе.' },
      { id: 'sybilsign', name: 'Вывеска', rect: [4, 44, 144, 12], look: '«Психотерапия». В прошлом месяце здесь было написано «Ремонт часов». Сибил часто меняет профессию.' },
      { id: 'alley', name: 'Переулок', rect: [566, 0, 74, 140], look: g => g.f.allCured ? 'Пустой переулок. От фургона осталось масляное пятно.' : 'Переулок за лавкой Боско. Там стоит фургон без окон. В таких ничего хорошего не возят.' }
    ],
    actors: {
      specs: {
        name: 'Спекс', dist: 30,
        walk: g => g.f.graffitiRuined && !g.f.specsCured ? [250, 152] : g.f.specsCured ? undefined : [396, 150],
        look: g => g.f.specsCured ? 'Спекс. Снова нормальный, насколько это возможно для бывшей детской звезды.' : 'Спекс из «Сода-Попперов». Очки толщиной с бутылочное дно. Взгляд как у телевизора после конца эфира.',
        talk: function* (g) {
          g.f.metSpecs = true;
          if (g.f.specsCured) { yield g.say('specs', 'Привет! Вы те, кто уронил на меня шар? Спасибо! Кажется.'); yield g.talkTo('specsOk'); return; }
          yield g.say('sam', 'Добрый день! Вольная полиция.');
          yield g.say('specs', 'Смотрите в глаза. Покупайте кассеты. Смотрите в глаза.');
          yield g.talkTo('specs');
        },
        items: {
          glove: g => (g.f.knowCure || g.f.whizzerCured) ? 'Спереди к нему не подобраться, он видит меня за три квартала. Разве что сверху.' : 'Бить бывших детских звёзд просто так я не стану.',
          gun: 'Нет. Он под гипнозом. Виноват только отчасти.',
          spray: 'Он и так весь в краске.',
          ball: 'В лоб? Он увидит и увернётся.',
          max: function* (g) { yield g.say('max', 'Можно я его укушу? Он пахнет краской и безысходностью!'); yield g.say('sam', 'Позже, Макс.'); }
        }
      }
    },
    enter: function* (g) {
      if (!g.seen.streetFirst && g.f.caseOpen && !g.f.samHypno) {
        g.seen.streetFirst = 1;
        yield g.say('max', 'Смотри, Сэм! Вандал!');
        yield g.say('sam', 'Сначала поговорим. Бить будем потом, по ситуации.');
      }
      if (g.f.allCured && !g.f.vanChased && !g.f.homeKnown) yield* vanScene(g);
    },
    setup(g) {
      const sp = g.actors.specs;
      if (g.f.specsCured) {
        if (g.f.homeKnown) g.place('specs', 'nowhere', 0, 0);
        else if (sp.room === 'street' && !g.f.allCured) { sp.hypno = false; sp.act = ''; sp.keepAct = false; sp.x = 236; sp.y = 151; sp.dir = 's'; }
      } else if (g.f.graffitiRuined) { sp.x = 216; sp.y = 149; sp.dir = 'n'; sp.act = 'spray'; sp.keepAct = true; }
      else { sp.x = 364; sp.y = 147; sp.dir = 'n'; sp.act = 'spray'; sp.keepAct = true; }
      const van = g.actors.van;
      van.visible = !g.f.vanChased;
      if (van.visible) { g.place('van', 'street', 604, 170, 'w'); van.z = 10; }
    },
    ambient: function* (g) {
      for (;;) {
        yield 3 + g.rng.next() * 3;
        const sp = g.actors.specs;
        if (sp.room === 'street' && !g.f.specsCured && !g.busy && sp.act === 'spray') g.sfx('spray');
      }
    },
    onLoad(g) { ROOMS.street.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
