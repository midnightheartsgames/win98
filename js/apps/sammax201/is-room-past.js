(function (S) {
  'use strict';
  const E = S.EP201;
  const { ROOMS, TALK } = E;

  const radio = (g, t) => g.say(null, t, { key: 'radio', color: S.C.grey[4], x: 210, y: 96 });

  function* argue(g) {
    const mary = g.actors.mary, yj = g.actors.yjimmy, tim = g.actors.timmy;
    for (const a of [mary, yj, tim]) a.scripted = true;
    g.place('mary', 'past', 196, 146, 'e');
    g.place('timmy', 'past', 184, 148, 'e');
    yield g.say('gpast', 'Двадцать лет назад, чуваки. Сочельник. Узнаёте комнату?');
    yield g.say('sam', 'Наш офис. Только обои в цветочек, кресло старушки и телевизор с ногами. Крысиная нора на том же месте.');
    g.anim('mary', 'nag', 2);
    yield g.say('mary', 'Джеймс! Ты обещал! Тимми нужна операция, а ты дерёшься в напёрстке!');
    g.anim('yjimmy', 'cheer', 1.4);
    yield g.say('yjimmy', 'Сегодня бой за пояс, Мэри! Выиграю, и будут деньги! На операцию и на сыр!');
    yield g.say('mary', 'А если проиграешь, я уйду! В сочельник! Сразу!');
    g.anim('timmy', 'swear', 1.2);
    g.sfx('beep');
    yield g.say('timmy', 'Папа, ***!');
    yield g.say('yjimmy', 'Не выражайся при маме, Тимми.');
    yield g.say('mary', 'Пошли, Тимми. Папа идёт бить свой сахар.');
    yield [g.walkTo('mary', 210, 138), g.walkTo('timmy', 210, 138)];
    g.place('mary', 'nowhere', 0, 0);
    g.place('timmy', 'nowhere', 0, 0);
    for (const a of [mary, yj, tim]) a.scripted = false;
    yield g.say('max', 'Сэм! Это Джимми! Маленький! С волосами!');
  }

  TALK.yjimmy = {
    options: [
      { id: 'who', icon: 'f:yjimmy21', text: 'Ты Джимми Два Зуба?', run: function* (g) {
        yield g.say('yjimmy', 'Джеймс Тиберий Два Зуба, будущий чемпион. А ты кто, большой пёс? Вежливый какой-то.');
      } },
      { id: 'fight', icon: 'punch21', text: 'Что за бой?', run: function* (g) {
        yield g.say('yjimmy', 'Бой за пояс, полусредний крысиный. В полночь в подвале. Призовых хватит на операцию сыну. Если выиграю.');
      } },
      { id: 'thimble', icon: 'jglove21', text: 'Чем ты дерёшься?', run: function* (g) {
        yield g.say('yjimmy', 'Напёрстком. Перчаток крысиного размера в продаже нет. Я спрашивал во всех лавках, даже у Боско. Боско молодой и уже нервный.');
      } },
      { id: 'mary', icon: 'f:mary21', text: 'Мэри правда уйдёт?', when: g => !g.f.maryGot, run: function* (g) {
        yield g.say('yjimmy', 'Мэри всегда грозится. Ни разу не ушла. Куда она уйдёт в восемь вечера, когда у старушки по телевизору «Любовь и сыр»?');
        yield g.say('yjimmy', 'Она его ни разу не пропустила. Выходит из норы, садится на коврик и плачет. Это её отдых.');
      } },
      { id: 'gone', icon: 'mary21', text: 'Где Мэри?', when: g => g.f.maryGot && !g.f.pastDone, run: function* (g) {
        yield g.say('yjimmy', 'Ушла. Как обещала. В сочельник. Я даже не видел, куда.');
        yield g.say('sam', 'Я видел. Лучше бы не видел.');
      } },
      { id: 'bye', icon: 'bye', text: 'Удачи в бою.', end: true }
    ]
  };

  function* tvOn(g) {
    const mary = g.actors.mary;
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('tvon');
    g.vt.tvOn = true;
    if (g.f.maryGot) {
      yield g.say(null, '«Любовь и сыр», серия девятьсот двенадцатая. Он ушёл к другой. Она ушла к третьему...', { key: 'tv', color: S.COLORS.tv, x: 192, y: 52 });
      g.vt.tvOn = false;
      return;
    }
    yield g.say(null, '«Любовь и сыр»! Серия девятьсот двенадцатая!', { key: 'tv', color: S.COLORS.tv, x: 192, y: 52 });
    mary.scripted = true;
    g.place('mary', 'past', 210, 136, 's');
    if (g.f.mazeSet) {
      yield g.walkTo('mary', 211, 134, { free: true });
      g.place('mary', 'nowhere', 0, 0);
      g.vt.maryIn = true;
      g.sfx('trapdoor');
      yield g.say('mary', 'Что это?! Тупик! Кто ставит тупики у норы?! Джеймс!');
      mary.scripted = false;
      g.vt.tvOn = false;
      yield g.say('sam', 'Простейший в мире лабиринт сработал. Вход есть, выхода нет. Мэри внутри и очень недовольна.');
      return;
    }
    yield g.walkTo('mary', 180, 150);
    g.face('mary', 'n');
    yield g.say('mary', 'Ох, Карлос... Не уходи к ней...');
    yield 1.2;
    yield g.say(null, 'Реклама! Сыр «Бодрость»!', { key: 'tv', color: S.COLORS.tv, x: 192, y: 52 });
    yield g.say('mary', 'Реклама. Всё, домой, пока Джеймс не съел ужин.');
    yield g.walkTo('mary', 210, 138);
    g.place('mary', 'nowhere', 0, 0);
    mary.scripted = false;
    g.vt.tvOn = false;
    g.sfx('click');
  }

  function* takeMary(g) {
    yield g.anim('sam', 'reach', 0.5);
    g.vt.maryIn = false;
    g.f.mazeSet = false;
    g.f.maryGot = true;
    g.give('mary');
    yield g.say('mary', 'Поставь меня на место, пёс! Я буду жаловаться! Я буду кусаться!');
    yield g.say('yjimmy', 'Мэри? Мэри! Ушла... В сочельник... Как и обещала.');
    yield g.say('gpast', 'Ну вот, чуваки. Испортили. Как и было записано.');
    yield g.say('max', 'Сэм, мы плохие! Нас надо в автомат Санты!');
  }

  function* giveGlove(g) {
    const yj = g.actors.yjimmy;
    yj.scripted = true;
    g.drop('glove');
    yield g.anim('sam', 'reach', 0.5);
    yj.v = 'glove';
    yield g.say('yjimmy', 'Перчатка! Моего размера! С надписью «Чемпион»! Пёс, ты кто такой?');
    yield g.say('sam', 'Никто. Пёс в шляпе.');
    yield g.say('yjimmy', 'Спасибо, вежливый пёс! Иду за поясом!');
    yield g.walkTo('yjimmy', 210, 136);
    g.place('yjimmy', 'nowhere', 0, 0);
    yj.scripted = false;
    g.music('past21');
    yield 1;
    g.sfx('cheer');
    yield radio(g, 'Из-за стены радио: «...и новый чемпион в полусреднем крысином, Джеймс Два Зуба! Призовые пойдут на операцию сыну!»');
    g.f.pastDone = true;
    yield g.say('gpast', 'Сойдёт, чуваки. Мальчик здоров, отец чемпион, мать... ну, мать у вас. Рождество, оно в целом.');
    g.sfx('chime');
    yield g.say('sam', 'Дух Прошлого Рождества ушёл в шар. Перед этим он подмигнул. Надеюсь, это было благословение.');
    yield* E.globeFull(g);
  }

  ROOMS.past = {
    id: 'past', name: 'Двадцать лет назад', w: 320, music: 'past21',
    paint: b => S.BG.past21(b),
    walk: [[40, 132, 258, 132, 316, 162, 316, 198, 4, 198, 4, 156, 36, 134]],
    layers: [
      { id: 'armchair', x: 40, y: 106, base: 156 },
      { id: 'knit', x: 56, y: 126, base: 157 },
      { id: 'tvglow', x: 175, y: 61, when: g => g.vt.tvOn, key: g => Math.floor(g.time * 4) % 3 },
      { id: 'maze', x: 196, y: 112, base: 139, when: g => g.f.mazeSet || g.vt.maryIn }
    ],
    drawBack(f, g, cx) { E.portalBack(f, g, cx, 296, 110, 'past'); },
    hot: [
      { id: 'portal', name: 'Портал на полюс', rect: [274, 76, 44, 68], walk: [282, 166], face: 'e',
        look: 'Портал обратно на Северный полюс. По краям тлеют старые фотографии.',
        exit: function* (g) { g.vt.tvOn = false; g.sfx('whoosh'); yield* g.goRoom('pole', { x: 232, y: 160, dir: 's' }, { from: 'past' }); } },
      { id: 'tv', name: 'Телевизор старушки', poly: [172, 60, 212, 58, 213, 87, 172, 88], walk: [192, 136], face: 'n',
        look: g => g.vt.tvOn ? 'Телевизор старушки. Идёт «Любовь и сыр».' : 'Телевизор старушки. На том же месте, где через двадцать лет будет наш. Антенна у него из настоящей антенны.',
        use: function* (g) { if (g.vt.tvOn) return; yield* tvOn(g); },
        items: { gun: 'Стрелять в старушкин телевизор? Она вернётся от соседки, а «Любви и сыра» нет.' } },
      { id: 'hole', name: 'Крысиная нора', rect: [203, 114, 16, 15], walk: [212, 140], face: 'n',
        look: g => g.vt.maryIn ? 'У норы стоит лабиринт. В лабиринте Мэри.' : g.f.mazeSet ? 'У выхода из норы стоит простейший в мире лабиринт. Вход прямо напротив норы.' : 'Нора Два Зуба. Та самая. Из неё пахнет сыром и семейной ссорой.',
        use: 'Совать лапу в крысиную нору я не буду ни в одном году.',
        items: {
          maze: function* (g) {
            if (g.f.maryGot) { yield g.say('sam', 'Мэри уже у меня. Ловить больше некого. Тимми слишком мал для лабиринта.'); return; }
            yield g.anim('sam', 'reach', 0.5);
            g.drop('maze');
            g.f.mazeSet = true;
            g.sfx('thud');
            yield g.say('sam', 'Лабиринт стоит у норы, вход напротив выхода. Если из норы кто-то выйдет, выйдет он прямо в лабиринт.');
          },
          gun: 'Стрелять в крысиную нору? Внутри ребёнок.'
        } },
      { id: 'maze', name: g => (g.vt.maryIn ? 'Мэри в лабиринте' : 'Лабиринт'), rect: [198, 116, 26, 20], when: g => g.f.mazeSet || g.vt.maryIn, walk: [212, 140], face: 'n', over: true,
        look: g => g.vt.maryIn ? 'Мэри сидит в простейшем лабиринте у тупика и ругает его.' : 'Простейший в мире лабиринт у норы. Ждёт.',
        use: function* (g) {
          if (g.vt.maryIn) { yield* takeMary(g); return; }
          yield g.anim('sam', 'reach', 0.4);
          g.f.mazeSet = false;
          g.give('maze');
          yield g.say('sam', 'Лабиринт снова у меня.');
        } },
      { id: 'armchair', name: 'Кресло', rect: [40, 106, 56, 50], walk: [80, 162], face: 'n',
        look: 'Кресло старушки, хозяйки комнаты. На сиденье вязание. Сама она у соседки, обсуждает «Любовь и сыр».',
        use: 'Садиться в чужое кресло двадцать лет назад? Это может кончиться плохо для всех трёх эпох.' },
      { id: 'calendar', name: 'Календарь', rect: [232, 14, 24, 22], walk: [240, 136], face: 'n',
        look: 'Календарь на тысяча девятьсот восьмидесятый. Двадцать четвёртое декабря обведено. Подпись: «Любовь и сыр, двойная серия».' },
      { id: 'window', name: 'Окно', poly: [100, 30, 164, 28, 164, 96, 100, 98], walk: [134, 134], face: 'n',
        look: 'Город двадцать лет назад. Те же крыши, другие машины. Робота нет, и это прекрасно.' },
      { id: 'closet', name: 'Шкаф', poly: [224, 42, 260, 40, 260, 128, 224, 128], walk: [240, 136], face: 'n',
        look: 'Шкаф старушки. Тот самый. Через двадцать лет в нём будут сидеть Леонард, мишка и банка с Хью Блиссом.',
        use: 'Заперто. Старушка не доверяет даже шкафу.' },
      { id: 'door', name: 'Дверь', poly: [276, 32, 306, 23, 306, 76, 276, 80], walk: [270, 150], face: 'e',
        look: 'Дверь старушки. Заперта снаружи, чтобы никто не мешал её телевизору.' }
    ],
    actors: {
      yjimmy: {
        name: 'Молодой Джимми', walk: [240, 150], face: 'w',
        look: g => g.actors.yjimmy.v === 'glove' ? 'Молодой Джимми в перчатке.' : 'Джимми Два Зуба, двадцать лет назад. Шерсть темнее, хвост длиннее, на одной лапе напёрсток вместо перчатки. Бьёт кусок сахара.',
        talk: function* (g) { yield g.talkTo('yjimmy'); },
        use: 'Трогать будущего чемпиона перед боем нельзя. Примета.',
        items: {
          glove: function* (g) { yield* giveGlove(g); },
          gun: function* (g) { yield g.say('yjimmy', 'Убери ствол, большой пёс! Я с тобой драться не буду, ты не в моём весе!'); },
          mary: function* (g) { yield g.say('sam', 'Отдать Мэри обратно? Тогда в настоящем Джимми так и простоит на карнизе. Мэри едет со мной.'); },
          max: function* (g) { yield g.say('max', 'Маленький Джимми! Я тебя ущипну за щёку!'); yield g.say('yjimmy', 'Только тронь, кролик! Напёрсток заряжен!'); },
          '*': function* (g) { yield g.say('yjimmy', 'Это мне? Мне нужна перчатка, большой пёс. Остальное у меня есть. Ну, почти.'); }
        }
      },
      gpast: {
        name: 'Дух Прошлого Рождества', walk: [256, 160], face: 'e',
        look: 'Дух Прошлого Рождества. Сидит на подлокотнике кресла и покачивает ногой. Пахнет мандаринами.',
        talk: function* (g) {
          if (!g.f.maryGot) { yield g.say('gpast', 'Здесь вы испортили Рождество, чуваки. Или испортите. Я путаюсь во временах.'); return; }
          if (!g.f.pastDone) { yield g.say('gpast', 'Испортили, молодцы. Теперь чините. Мать уехала, у отца напёрсток. Думайте.'); return; }
          yield g.say('gpast', 'Я уже в шаре, старик. Это эхо.');
        },
        items: { '*': function* (g) { yield g.say('gpast', 'Мне ничего не надо, чувак. Мне надо, чтобы было хорошо.'); } }
      }
    },
    enter: function* (g) {
      if (g.f.pastSeen) return;
      g.f.pastSeen = true;
      yield* argue(g);
    },
    setup(g) {
      g.vt.tvOn = false;
      const yj = g.actors.yjimmy;
      if (!g.f.pastDone) { g.place('yjimmy', 'past', 228, 150, 'w'); yj.v = ''; }
      else if (yj.room === 'past') g.place('yjimmy', 'nowhere', 0, 0);
      if (!g.f.pastDone) g.place('gpast', 'past', 258, 156, 'w');
      else if (g.actors.gpast.room === 'past') g.place('gpast', 'nowhere', 0, 0);
      for (const id of ['mary', 'timmy']) if (g.actors[id].room === 'past') g.place(id, 'nowhere', 0, 0);
    }
  };

  E.install();

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
