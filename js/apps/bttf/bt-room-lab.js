(function (S, B) {
  'use strict';
  const C = B.C;
  const E = B.EP1;
  const G = B.grey;
  const { ROOMS, TALK, LAYERS, ACTOR_HOT } = E;

  LAYERS.lab = {
    box: () => G.layer(56, 44, b => {
      const P = new S.Pen(b);
      P.part(P.poly([22, 6, 50, 0, 53, 4, 25, 10]), C.wood, { b: 2, sh: 0 });
      P.part(P.ell(18, 16, 9, 7), C.gold, { b: 3 });
      P.part(P.rect(2, 16, 48, 26), C.tan, { b: 3 });
      P.part(P.poly([2, 16, 10, 10, 26, 10, 18, 16]), C.tan, { b: 4, sh: 0 });
      P.line(26, 18, 26, 40, C.tan[1]);
    }),
    chair: () => G.layer(104, 100, b => {
      const P = new S.Pen(b);
      P.part(P.path('M 14 60 L 12 12 Q 52 -2 92 12 L 90 60 Z'), C.maroon, { b: 2 });
      for (let x = 24; x < 84; x += 12) P.line(x, 10, x, 56, C.maroon[1]);
      P.part(P.rect(8, 58, 88, 22), C.maroon, { b: 3 });
      for (const x of [2, 86]) P.part(P.path(`M ${x} 82 L ${x} 46 Q ${x + 8} 38 ${x + 16} 46 L ${x + 16} 82 Z`), C.maroon, { b: 2 });
      for (const x of [10, 88]) P.part(P.rect(x, 82, 6, 14), C.wood, { b: 1 });
    }),
    court: () => G.layer(34, 30, b => B.BG.paintCourt(b, 34)),
    clothes: () => G.layer(36, 18, b => { G.rect(b, 1, 6, 34, 11, C.snow, { b: 3 }); G.rect(b, 4, 1, 28, 8, C.wood, { b: 2 }); }),
    can: () => G.layer(16, 18, b => { G.rect(b, 2, 2, 12, 15, C.red, { b: 3 }); G.rect(b, 2, 7, 12, 3, C.snow, { b: 4, sh: 0 }); })
  };
  LAYERS.labback = {
    court: () => G.layer(44, 30, b => B.BG.paintCourt(b, 44))
  };

  function* biffSits(g) {
    const biff = g.actors.biff;
    biff.scripted = true;
    g.place('biff', 'lab', 884, 412, 's');
    biff.act = 'sit'; biff.keepAct = true;
    biff.scripted = false;
  }

  function* modelScene(g) {
    yield g.say('marty', 'Погоди... Это что, блокнот Дока? Прямо внутри суда.');
    const biff = g.actors.biff;
    biff.scripted = true;
    yield g.walkTo('biff', 380, 362);
    g.faceTo('biff', 330);
    yield g.say('biff', 'О, макетик. Как раз для моего аквариума.');
    yield g.say('marty', 'Бифф, он не продаётся.');
    yield g.say('biff', 'На двери написано «распродажа». Значит, продаётся.');
    yield g.say('biff', 'А дарёному коню, как говорится, в зад не смотрят.');
    yield g.anim('biff', 'reach', 0.6);
    g.sfx('crack');
    g.f.biffHasCourt = true;
    yield g.say('biff', 'Опа, крыша отскочила. А тут тетрадка. «Потоковый катетер»... Звучит дорого.');
    yield g.say('biff', 'Площадь, так и быть, оставлю. Суд забираю.');
    g.f.modelSeen = true;
    yield g.walkTo('biff', 40, 380);
    biff.scripted = false;
    yield* biffSits(g);
  }

  function* boxScene(g) {
    const george = g.actors.george;
    george.scripted = true;
    g.faceTo('george', g.actors.marty.x);
    yield g.say('george', 'Марти! Тут коробка с твоими вещами, её тоже выставили. Забирай, пока не купили.');
    g.f.boxOut = true;
    george.scripted = false;
  }

  function* guitarOnAmp(g) {
    const biff = g.actors.biff;
    const george = g.actors.george;
    if (!g.f.biffHasCourt) { yield g.say('marty', 'Не до концертов сейчас.'); return; }
    yield g.anim('marty', 'guitar', 1.2);
    g.sfx('chord');
    if (!g.f.georgeBack) {
      biff.scripted = true; biff.act = ''; biff.keepAct = false;
      yield g.walkTo('biff', g.actors.marty.x + 60, g.actors.marty.y);
      g.faceTo('biff', g.actors.marty.x);
      yield g.say('biff', 'Дай сюда, Чак Дурья Башка. Покажу, как играют настоящие мужики.');
      george.scripted = true;
      yield g.walkTo('george', g.actors.marty.x - 50, g.actors.marty.y + 4);
      g.faceTo('george', biff.x);
      yield g.say('george', 'Бифф, оставь Марти в покое.');
      yield g.say('biff', 'Ладно, ладно. Только ради тебя, Джордж.');
      g.f.biffTried = true;
      yield g.walkTo('biff', 884, 412);
      yield* biffSits(g);
      yield g.walkTo('george', 236, 352);
      g.face('george', 's');
      george.scripted = false;
      return;
    }
    if (!g.f.ampMax) {
      yield g.say('biff', 'Это что, музыка? Моя газонокосилка и то громче.');
      return;
    }
    biff.scripted = true; biff.act = ''; biff.keepAct = false;
    yield g.walkTo('biff', g.actors.marty.x + 50, g.actors.marty.y);
    g.faceTo('biff', g.actors.marty.x);
    yield g.say('biff', 'Дай-ка сюда.');
    g.drop('guitar');
    yield g.anim('biff', 'guitar', 0.8);
    g.sfx('blast');
    g.fx.shake = 1; g.fx.flash = 0.6;
    g.place('biff', 'lab', 884, 412, 's');
    biff.act = 'sit'; biff.keepAct = true;
    g.f.biffBlasted = true;
    yield 0.6;
    yield g.say('biff', 'У-у-ух...');
    yield g.say('george', 'Бифф? Ты цел?');
    yield g.say('biff', 'Кто выключил звук?');
    g.give('guitar');
    biff.scripted = false;
    yield g.say('marty', 'Кажется, суд упал.');
  }

  function* takeNotebook(g) {
    yield g.anim('marty', 'reach', 0.5);
    g.give('notebook');
    g.f.notebookGot = true;
    yield g.say('marty', 'Блокнот Дока. Целый.');
    yield g.say('biff', 'Эй, это мой суд!');
    yield g.say('marty', 'Суд оставь себе.');
    yield 0.5;
    g.f.boom = true;
    g.f.frost = true;
    g.sfx('boom');
    g.fx.shake = 0.8;
    yield 0.4;
    yield g.say('george', 'Это ещё что такое?');
    yield g.say('marty', 'Грохнуло во дворе.');
  }

  ROOMS.lab = {
    id: 'lab', name: 'Лаборатория Дока', w: 1120, music: 'bt_lab',
    scale: [318, 0.86, 470, 1],
    paint: b => B.BG.paintLab(b),
    walk: [[20, 318, 1100, 318, 1112, 472, 8, 472]],
    layers: [
      { id: 'clothes', x: 250, y: 230, base: 300, when: g => !g.f.dressed },
      { id: 'can', x: 960, y: 446, base: 470, when: g => g.f.biffBlasted && !g.has('can') && !g.f.fusion },
      { id: 'box', x: 246, y: 206, base: 300, when: g => g.f.boxOut && !g.f.guitarTaken },
      { id: 'chair', x: 832, y: 320, base: 400 },
      { id: 'court', x: 940, y: 420, base: 450, when: g => g.f.biffBlasted && !g.f.notebookGot }
    ],
    hot: [
      { id: 'door', name: 'Дверь во двор', rect: [20, 128, 70, 178], walk: [70, 330], face: 'w', exit: function* (g) {
        if (!g.f.notebookGot) { yield g.say('marty', 'Уйти и оставить вещи Дока Биффу? Нет уж.'); return; }
        yield* g.goRoom('yard', { x: 170, y: 340, dir: 'e' });
      }, look: 'На двери табличка «Распродажа». Как будто Дока уже похоронили.' },
      { id: 'back', name: 'Задняя комната', rect: [1050, 118, 62, 190], walk: [1080, 330], face: 'e', exitDir: 'e', exit: { room: 'labback', x: 60, y: 360, dir: 'e' }, look: 'Проход в заднюю комнату.' },
      { id: 'portraits', name: 'Портреты', rect: [130, 66, 200, 74], walk: [230, 340], face: 'n', look: 'Ньютон, Франклин, Эдисон и Эйнштейн. Док называл их своей командой.', use: 'Пусть висят. Им тут место.' },
      { id: 'clocks', name: 'Часы', rect: [360, 36, 200, 160], walk: [460, 330], face: 'n', look: ['Десятки часов, и все показывают разное время.', 'Часы-кошка водит глазами. Мне не по себе.'], use: 'Подводить их бесполезно. Док говорил, что все они правы по-своему.' },
      { id: 'clothes', name: 'Старая одежда', rect: [250, 230, 36, 18], when: g => !g.f.dressed, walk: [266, 334], face: 'n', look: 'Старые вещи Дока: жилеты, рубашки, брюки на подтяжках. Похоже на тридцатые.', use: function* (g) {
        if (!g.f.dateKnown) { yield g.say('marty', 'Маскарад подождёт.'); return; }
        yield g.fadeOut(3);
        g.f.dressed = true;
        E.dress(g);
        yield g.fadeIn(3);
        yield g.say('marty', 'Жилет, рубашка, брюки. Сойду за местного. Наверное.');
      } },
      { id: 'can', name: 'Пивная банка', rect: [960, 446, 16, 18], when: g => g.f.biffBlasted && !g.has('can') && !g.f.fusion, walk: [990, 452], face: 'e', look: 'Банка, которую уронил Бифф. Пустая.', use: function* (g) {
        yield g.anim('marty', 'reach', 0.5);
        g.give('can');
      } },
      { id: 'prices', name: 'Прейскурант', rect: [343, 210, 22, 34], walk: [354, 330], face: 'n', look: 'Прейскурант. Машины времени в нём нет, и слава богу.', use: 'Цены не мои. Торговаться не буду.' },
      { id: 'table', name: 'Стол распродажи', rect: [110, 248, 220, 62], walk: [220, 334], face: 'n', look: 'Вещи Дока с ценниками. Полжизни по доллару за штуку.', use: 'Тут всё чужое. Ну, почти всё.' },
      { id: 'box', name: 'Коробка с моими вещами', rect: [248, 208, 52, 40], when: g => g.f.boxOut && !g.f.guitarTaken, walk: [276, 334], face: 'n', look: 'Мои старые вещи. И гитара! Её чуть не продали.', use: function* (g) {
        yield g.anim('marty', 'reach', 0.5);
        g.f.guitarTaken = true;
        g.give('guitar');
        yield g.say('marty', 'Иди ко мне, красавица.');
      } },
      { id: 'jukebox', name: 'Музыкальный автомат', rect: [588, 188, 64, 122], walk: [620, 334], face: 'n', look: 'Автомат Дока. Набит пластинками пятидесятых и одной восьмидесятых.', use: function* (g) {
        g.music('bt_jukebox');
        yield g.say('marty', '«Back in Time». Док понимал в музыке.');
      } },
      { id: 'tv', name: 'Телевизор', rect: [680, 226, 80, 84], walk: [720, 334], face: 'n', look: 'Передача «Космос». Ведущий рассуждает о путешественнике во времени, который не дал родиться самому себе.', use: 'Пусть говорит. Как будто про меня.' },
      { id: 'tank', name: 'Аквариум', rect: [778, 246, 48, 64], walk: [802, 334], face: 'n', look: 'В аквариуме вместо рыбок плавает красный чайник.', use: 'Рыбу Док так и не завёл. Чайник не жалуется.' },
      { id: 'speaker', name: 'Огромный динамик', rect: [838, 88, 122, 220], walk: [900, 334], face: 'n', look: 'Тот самый динамик. В прошлом году он отправил меня в полёт через всю комнату.', use: 'Он не играет сам по себе.' },
      { id: 'dials', name: 'Ручки усилителя', rect: [966, 238, 70, 26], walk: [990, 340], face: 'n', look: g => g.f.ampMax ? 'Все три на максимуме.' : 'Громкость, тембр, перегрузка.', use: function* (g) {
        if (g.f.ampMax) { yield g.say('marty', 'Дальше крутить некуда.'); return; }
        g.sfx('click');
        g.f.ampMax = true;
        yield g.say('marty', 'Все три до упора. Как в тот раз.');
      }, items: { guitar: guitarOnAmp } },
      { id: 'amp', name: 'Усилитель', rect: [962, 264, 78, 44], walk: [990, 340], face: 'n', look: 'Усилитель CRM-114. Я сам чинил его после прошлогоднего взрыва.', use: 'Включён и ждёт.', items: { guitar: guitarOnAmp } },
      { id: 'court', name: 'Суд из макета', rect: [940, 420, 34, 30], when: g => g.f.biffBlasted && !g.f.notebookGot, walk: [990, 440], face: 'e', look: 'Суд из макета. Внутри что-то есть.', use: takeNotebook }
    ],
    actors: {
      george: { name: 'Джордж', dist: 40, look: 'Папа. С тех пор как вышла его книга, его не узнать.', talk: function* (g) { yield g.talkTo('george'); }, items: { guitar: 'Пап, потом сыграю. Честно.', photo: 'Папа на фото выглядит увереннее, чем в жизни. Хотя сейчас тоже ничего.' } },
      biff: { name: 'Бифф', dist: 44, look: g => g.f.biffBlasted ? 'Бифф приходит в себя. В ушах звенит, наверное.' : 'Бифф Таннен в шлеме Дока. К шлему приделаны две банки пива.', talk: function* (g) { yield g.talkTo('biff'); }, items: { guitar: 'Гитару Биффу? Сломает и не заметит.', photo: 'Показать Биффу папу? Плохая идея.' } }
    },
    enter: function* (g) {
      if (g.f.modelSeen && !g.f.boxOut) yield* boxScene(g);
    },
    setup(g) { if (E.dress) E.dress(g); },
    onLoad(g) { if (E.dress) E.dress(g); }
  };

  ROOMS.labback = {
    id: 'labback', name: 'Задняя комната', w: 640, music: 'bt_lab',
    scale: [318, 0.86, 470, 1],
    paint: b => B.BG.paintBack(b),
    walk: [[20, 318, 620, 318, 632, 472, 8, 472]],
    layers: [{ id: 'court', x: 300, y: 270, base: 301, when: g => !g.f.biffHasCourt }],
    hot: [
      { id: 'out', name: 'Лаборатория', rect: [10, 118, 62, 190], walk: [40, 340], face: 'w', exitDir: 'w', exit: { room: 'lab', x: 1060, y: 360, dir: 'w' }, look: 'Обратно в лабораторию.' },
      { id: 'model', name: 'Макет Хилл-Вэлли', rect: [196, 270, 268, 60], walk: [330, 352], face: 'n', look: g => g.f.modelSeen ? 'Без суда площадь выглядит странно. Будто закон отменили.' : 'Макет площади 1955 года. Док построил его, чтобы поймать молнию.', use: function* (g) {
        if (g.f.modelSeen) { yield g.say('marty', 'Без суда тут смотреть не на что.'); return; }
        yield* modelScene(g);
      } },
      { id: 'shelves', name: 'Полки', rect: [120, 120, 80, 150], walk: [160, 334], face: 'n', look: 'Банки с болтами, провода, книги Жюля Верна.', use: 'Тут ничего опасного. Если не считать проводов.' },
      { id: 'junk', name: 'Хлам', rect: [520, 140, 90, 120], walk: [560, 334], face: 'n', look: 'Детали, которые Док не успел превратить в изобретения.', use: 'Без Дока это просто железки.' }
    ],
    actors: {
      biff: { name: 'Бифф', dist: 44, look: 'Бифф примеряется к макету.', talk: function* (g) { yield g.talkTo('biff'); } }
    },
    setup(g) { if (E.dress) E.dress(g); }
  };

  TALK.george = { portrait: 'george', options: [
    { id: 'sale', text: 'Как идёт распродажа?', run: function* (g) {
      yield g.say('george', 'Банк забирает гараж, город хочет построить тут стоянку. Я хотя бы прослежу, чтобы с вещами Дока обошлись по-человечески.');
    } },
    { id: 'keep', text: 'Можно мне что-нибудь на память?', once: true, run: function* (g) {
      yield g.say('george', 'Одну вещь, Марти. Выбирай с умом.');
    } },
    { id: 'doc', text: 'Думаешь, Док вернётся?', run: function* (g) {
      yield g.say('george', 'Полгода прошло, сынок. Иногда люди просто уходят.');
      yield g.say('marty', 'Только не Док.');
    } },
    { id: 'fight', text: 'Я сам за себя постою, пап.', when: g => g.f.biffTried && !g.f.georgeBack, run: function* (g) {
      yield g.say('george', 'Уверен? Ну ладно. Вмешиваться не буду.');
      g.f.georgeBack = true;
    } },
    { id: 'bye', text: 'Ладно, пап, я пошёл.', end: true }
  ] };

  TALK.biff = { portrait: 'biff', options: [
    { id: 'give', text: 'Отдай суд, Бифф.', when: g => g.f.biffHasCourt && !g.f.biffBlasted, run: function* (g) {
      yield g.say('biff', 'Нашёл дурака. Я его купил.');
      yield g.say('marty', 'Ты ничего не платил.');
      yield g.say('biff', 'Заплачу. Когда-нибудь. Если не забуду.');
    } },
    { id: 'money', text: 'Сколько хочешь за него?', when: g => g.f.biffHasCourt && !g.f.biffBlasted, run: function* (g) {
      yield g.say('biff', 'Больше, чем у тебя есть, Макфлай. Это ж антиквариат. Почти.');
    } },
    { id: 'shame', text: 'Док бы этого не одобрил.', when: g => g.f.biffHasCourt && !g.f.biffBlasted, run: function* (g) {
      yield g.say('biff', 'Док свалил. Кто успел, тот и сел, как говорится.');
    } },
    { id: 'what', text: 'Что ты тут делаешь, Бифф?', when: g => !g.f.biffHasCourt, run: function* (g) {
      yield g.say('biff', 'Покупаю. Тут всё по доллару, а я люблю дёшево.');
    } },
    { id: 'ears', text: 'Живой, Бифф?', when: g => g.f.biffBlasted, run: function* (g) {
      yield g.say('biff', 'Чего? Говори громче, у меня в ушах звенит.');
    } },
    { id: 'bye', text: 'Ну и сиди тут.', end: true }
  ] };

  E.DRESS.push(function (g) {
    const biff = g.actors.biff;
    if (biff && biff.room === 'lab' && !biff.scripted && !biff.path) {
      const sitting = Math.abs(biff.x - 884) < 4 && Math.abs(biff.y - 412) < 4;
      biff.act = sitting ? 'sit' : '';
      biff.keepAct = sitting;
    }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
