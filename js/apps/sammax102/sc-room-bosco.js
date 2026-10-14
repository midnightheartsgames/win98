(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP102;
  const { ROOMS, TALK, LAYERS } = E;
  const { sprite, textOn } = S.BG;

  LAYERS.bosco = {
    counter: () => S.LAYERS.bosco.counter(),
    table: () => S.LAYERS.bosco.table(),
    glovearm: g => S.LAYERS.bosco.glovearm(g),
    wcOpen: () => S.LAYERS.bosco.wcOpen(),
    cream: () => sprite(14, 20, P => {
      P.part(P.rect(3, 6, 8, 13), C.teal, { b: 3 });
      P.part(P.rect(3, 10, 8, 4), C.grey, { b: 5, sh: 0, hi: 0 });
      P.part(P.rect(4.5, 3, 5, 3), C.grey, { b: 2, sh: 0 });
      P.part(P.ell(10, 2.5, 3, 2.2), C.grey, { b: 5, sh: 0 });
    }),
    freecard: () => sprite(28, 10, (P, b) => {
      P.part(P.poly([1, 9, 3, 1, 27, 1, 27, 9]), C.cream, { b: 4, sh: 0 });
      textOn(b, 'FREE', 5, 1, C.red[2], 0);
    }),
    condiments: () => sprite(36, 38, (P, b) => {
      P.part(P.rect(1, 12, 34, 18), C.grey, { b: 3 });
      P.part(P.ell(7, 34, 3.5, 3.5), C.grey, { b: 0 });
      P.part(P.ell(29, 34, 3.5, 3.5), C.grey, { b: 0 });
      const bottles = [[7, C.red], [14, C.yellow], [21, C.cream], [28, C.green]];
      for (const [x, r] of bottles) {
        P.part(P.poly([x - 2.5, 13, x - 2.5, 5, x - 1, 2, x + 1, 2, x + 2.5, 5, x + 2.5, 13]), r, { b: 3, sh: 1 });
        P.part(P.rect(x - 1, 0, 2, 2.5), r, { b: 1, sh: 0 });
      }
      textOn(b, 'СОУСЫ', 4, 18, C.grey[1], 0);
    }),
    modulator: () => sprite(40, 24, P => {
      P.part(P.ell(26, 9, 8, 8.5), C.pink, { b: 3 });
      P.part(P.ell(23, 6, 2, 1.5), C.pink, { b: 4, sh: 0, hi: 0, ol: 0 });
      P.curve('M 26 18 Q 30 22 24 23 Q 18 23 20 19 Q 22 16 14 18', C.yellow[3]);
      P.part(P.rect(4, 14, 9, 9), C.grey, { b: 4 });
      P.part(P.rect(6, 11, 4, 4), C.orange, { b: 3, sh: 0 });
    }),
    tag: () => sprite(44, 12, (P, b) => { P.part(P.rect(0, 0, 44, 11), C.grey, { b: 5 }); textOn(b, '1 000 000$', 2, 2, C.red[2], 0); })
  };

  function* theft(g) {
    yield g.anim('sam', 'reach', 0.5);
    yield g.say('sam', 'Возьму образец. Бриться мне ни к чему, но бесплатное грех не взять.');
    const gang = ['jimmy', 'rat1', 'rat2'];
    for (const id of gang) { const a = g.actors[id]; a.scripted = true; a.visible = true; a.act = ''; a.keepAct = false; a.scale = 1.1; }
    g.place('jimmy', 'bosco', 22, 172, 'e');
    g.place('rat1', 'bosco', 14, 182, 'e');
    g.place('rat2', 'bosco', 16, 162, 'e');
    g.sfx('door');
    yield g.say('rat1', 'Бритые хвосты! Налёт!');
    yield [g.walkTo('jimmy', 60, 152), g.walkTo('rat1', 42, 166), g.walkTo('rat2', 48, 180)];
    g.f.creamStolen = true;
    g.sfx('squeak');
    yield g.say('jimmy', 'Спасибо, начальник, что подержал! Пена наша!');
    g.sfx('squeak');
    yield [g.walkTo('jimmy', 10, 172), g.walkTo('rat1', 8, 182), g.walkTo('rat2', 10, 162)];
    for (const id of gang) { g.place(id, 'nowhere', 0, 0); g.actors[id].scripted = false; }
    g.sfx('door');
    yield g.say('bosco', 'Грабёж средь бела дня! Антивор-О-Мат, фас!');
    yield 0.6;
    yield g.say('bosco', 'Молчит. Датчик настроен на воров ростом от метра. Крысы, дьявол их побери, ниже.');
    yield* E.ratsFlee(g);
  }

  function* buyModulator(g) {
    if (g.f.modBought) { yield g.say('bosco', 'Второго модулятора нет, старина. Гелий нынче в дефиците.'); return; }
    yield g.say('sam', 'Милорд, мы берём модулятор. Вот миллион.');
    yield g.say('bosco', 'Продовольственные талоны? На миллион? В приличном обществе такое не берут.');
    yield g.say('bosco', 'К счастью, общество у нас неприличное.');
    g.actors.bosco.act = 'give'; g.actors.bosco.actT = 1;
    g.sfx('cash');
    g.drop('stamps');
    g.give('modulator');
    g.f.modBought = true;
    yield g.say('bosco', 'Прошу. Инструкция на шарике. Не вдыхать рядом с открытым огнём и налоговой.');
  }

  function* frostCake(g) {
    yield g.anim('sam', 'reach', 0.6);
    g.sfx('splat');
    g.swap('cake', 'kcake');
    yield g.say('sam', 'Щедрый слой кетчупа. Издали вылитая красная глазурь.');
    yield g.say('bosco', 'Эй! Соусы для покупателей! ...Ладно. Лорды щедры, когда за ними наблюдают.');
  }

  TALK.lord = {
    start: function* (g) {
      if (!g.seen.lordHi) {
        g.seen.lordHi = 1;
        yield g.say('bosco', 'Добрый день, милейшие! Лорд Реджинальд Рамплботтом Третий, граф Герцогства, к вашим услугам.');
        yield g.say('max', 'Сэм, на каком языке он говорит?');
        yield g.say('sam', 'Не уверен, Макс. Похоже... на английском.');
        yield g.say('max', 'Ой.');
      } else yield g.say('bosco', 'Снова вы, старина. Чем обязан?');
    },
    options: [
      { id: 'who', icon: 'q', text: 'Боско, это ты?', run: function* (g) {
        yield g.say('bosco', 'Боско? Не имею чести. Судя по имени, достойнейший был человек. Осторожный. Уехал.');
        yield g.say('sam', 'Куда уехал?');
        yield g.say('bosco', 'Туда, где его не найдёт налоговая, старина. В Англию. Которая здесь.');
      } },
      { id: 'why', icon: 'f:lord', text: 'Зачем этот маскарад?', run: function* (g) {
        yield g.say('bosco', 'Какой маскарад? Это твид. А усы у меня фамильные. Передаются по наследству. На клею.');
        yield g.say('bosco', 'Три дня назад налоговая прислала мне открытку. С котёнком, Сэм! С котёнком! Так они дают понять, что знают адрес.');
      } },
      { id: 'sell', icon: 'money', text: 'Что у вас продаётся?', run: function* (g) {
        yield g.say('bosco', 'Гордость заведения: химический модулятор голоса. Один вдох, и вас не узнает родная мать. И налоговый инспектор, что важнее.');
        if (!g.f.modBought) {
          yield g.say('sam', 'Почём?');
          yield g.say('bosco', 'Миллион долларов. Торг неуместен. Табличка по-прежнему висит.');
          if (!g.f.knowMod) {
            yield g.say('max', 'Сэм, у нас есть миллион?');
            yield g.say('sam', 'У нас есть пять долларов, Макс. И те я занял у Сибил под проценты.');
          }
        }
        g.f.knowMod = true;
      } },
      { id: 'how', icon: 'modulator', text: 'Как работает модулятор?', when: g => g.f.knowMod, run: function* (g) {
        yield g.say('bosco', 'Воздушный шар с благородным газом, ингалятор и трубочка с завитком. Вдыхаете и говорите.');
        yield g.say('bosco', 'Голос поднимается на две октавы. Как у оперной дивы. Или у белки, если дива простужена.');
      } },
      { id: 'cream', icon: 'cream', text: 'А что за пена на столе?', when: g => !g.f.creamStolen, run: function* (g) {
        yield g.say('bosco', 'Бесплатный образец для джентльменов. Бритьё успокаивает нервы. Мои нервы бреются каждые полчаса.');
      } },
      { id: 'rats', icon: 'f:rat', text: 'Кто эти крысы?', when: g => g.f.creamStolen, run: function* (g) {
        yield g.say('bosco', 'Банда «Бритые хвосты». Джимми Два Зуба у них за главного. Бреют хвосты налысо, вот и таскают мою пену.');
        yield g.say('bosco', 'Гоняют на своём хот-роде по шоссе. На шоссе полно открытых люков. Намёк понятен, старина?');
      } },
      { id: 'myra', icon: 'tv', text: 'Что вы думаете о Майре Стамп?', run: function* (g) {
        yield g.say('bosco', 'Телевизор смотрит на нас, Сэм. Я затянул экран фольгой. Майру слышно и сквозь фольгу.');
        yield g.say('bosco', 'Она говорит, что никто не уйдёт без подарка. Я ухожу без подарков каждый день. Может, поэтому я до сих пор жив.');
      } },
      { id: 'sauce', icon: 'noodles', text: 'Соусы у туалета бесплатные?', once: true, run: function* (g) {
        yield g.say('bosco', 'Соусы для покупателей. Покупателей у лорда нет, значит, соусы для всех. Но официально для покупателей.');
      } },
      { id: 'bye', icon: 'bye', text: 'Всего доброго, милорд.', end: true, run: function* (g) {
        yield g.say('bosco', 'Честь имею. И не говорите никому, что лорд торгует кетчупом.');
      } }
    ]
  };

  ROOMS.bosco = {
    id: 'bosco', name: 'Лавка лорда', w: 320, music: 'bosco',
    paint: b => S.BG.bosco(b),
    walk: [[8, 136, 212, 136, 232, 176, 312, 176, 312, 198, 8, 198]],
    layers: [
      { id: 'condiments', x: 194, y: 96, base: 131 },
      { id: 'modulator', x: 252, y: 28, when: g => !g.f.modBought },
      { id: 'tag', x: 250, y: 50, when: g => !g.f.modBought },
      { id: 'glovearm', x: 46, y: 18 },
      { id: 'table', x: 44, y: 118, base: 147 },
      { id: 'cream', x: 58, y: 104, base: 148, when: g => !g.f.creamStolen && !g.has('cream') },
      { id: 'freecard', x: 64, y: 114, base: 148 },
      { id: 'wcOpen', x: 137, y: 39, when: g => g.f.wcOpen },
      { id: 'counter', x: 216, y: 110, base: 172 }
    ],
    hot: [
      { id: 'exit', name: 'Выход на улицу', rect: [4, 30, 40, 110], walk: [30, 170], face: 'w',
        look: 'Дверь на улицу. Над ней по-прежнему висит Антивор-О-Мат. Его перчатка теперь в клетчатом чехле.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street', { x: 484, y: 146, dir: 's' }); } },
      { id: 'antivor', name: 'Антивор-О-Мат', rect: [40, 4, 56, 34],
        look: 'Антивор-О-Мат три тысячи. Перчатка отполирована до блеска. Лорд, похоже, чистит её по вечерам.',
        use: function* (g) { yield g.say('bosco', 'Не трогайте, старина. Я перенастраиваю его на крыс.'); } },
      { id: 'table', name: g => g.f.creamStolen || g.has('cream') ? 'Столик' : 'Пена для бритья', rect: [44, 104, 44, 42], walk: [74, 152], face: 'n',
        look: g => g.f.creamStolen || g.has('cream') ? 'Пустой столик. Табличка «FREE» осталась. Пена уехала кататься.' : 'Баллончик пены для бритья «Джентльмен». Табличка: «FREE». Бесплатное у Боско? Лорд явно не в себе.',
        use: function* (g) {
          if (g.f.creamStolen || g.has('cream')) { yield g.say('sam', 'На столе ничего. Крысы подчистили даже крошки.'); return; }
          yield* theft(g);
        } },
      { id: 'condiments', name: 'Тележка с соусами', rect: [194, 96, 36, 36], walk: [212, 140], face: 'n',
        look: 'Тележка с соусами у туалета. Кетчуп, горчица, хрен и что-то зелёное с надписью «Для лордов».',
        use: 'Выдавить кетчуп в пустоту? Нет. Сначала найду, на что его выдавить.',
        items: {
          cake: function* (g) { yield* frostCake(g); },
          kcake: 'Кетчупа на нём уже больше, чем торта.',
          plate: 'Тарелка с кетчупом и без еды. Печально, как ужин холостяка.',
          cream: 'Пена с горчицей? Это рецепт для «Готовим не глядя», не для меня.'
        } },
      { id: 'moddisplay', name: 'Модулятор голоса', rect: [250, 26, 46, 36], walk: [250, 180], face: 'e', when: g => !g.f.modBought,
        look: 'Химический модулятор голоса. Розовый шарик, ингалятор и трубочка-загогулина. Ценник: миллион долларов.',
        use: function* (g) { yield g.say('bosco', 'Руки прочь от экспоната, милейший! Миллион, и он ваш.'); g.f.knowMod = true; } },
      { id: 'wc', name: 'Туалет', rect: [136, 30, 36, 82], walk: [154, 136], face: 'n',
        look: 'Туалет. Табличка: «Только для джентльменов». Ниже мелко: «Уиззер, тебя это тоже касается».',
        use: 'Не сейчас. Джентльмены терпят.' },
      { id: 'barrel', name: 'Бочка', rect: [172, 92, 22, 32], walk: [182, 140], face: 'n',
        look: 'Та самая бочка. Теперь на ней британский флажок. Что бы там ни лежало, оно теперь подданное короны.',
        use: function* (g) { yield g.say('bosco', 'Не открывать! Там хранятся семейные реликвии. И, возможно, огурцы.'); } },
      { id: 'shelves', name: 'Полки', rect: [56, 20, 78, 84], walk: [96, 140], face: 'n',
        look: ['«Чай "Файв-о-клок". Английский. Сделано в Джерси».', '«Монокль запасной. Один на двоих».', '«Портрет королевы. Не той».', '«Накладные бакенбарды. Размер: джентльмен».', '«Зонт-трость. Открывается по вторникам».'],
        use: 'Лорд просил ничего не трогать. Лорды просят вежливо и один раз.' },
      { id: 'register', name: 'Касса', rect: [272, 110, 34, 16], walk: [250, 182], face: 'e', look: 'Касса. На ней бумажка: «Принимаем фунты, доллары и налоговые вычеты».', use: function* (g) { yield g.say('bosco', 'Касса опечатана, старина. Мной. На всякий случай.'); } },
      { id: 'safe', name: 'Сейф', rect: [286, 30, 26, 30], look: 'Сейф «SAFE». Сверху мелом приписано: «лорда».' },
      { id: 'signs', name: 'Табличка', rect: [186, 14, 56, 12], look: '«Не слоняться!» Рядом новая табличка: «Джентльменам можно».' }
    ],
    actors: {
      bosco: {
        name: 'Лорд Рамплботтом', walk: [238, 182], face: 'e', pad: 10,
        look: 'Боско в котелке, с моноклем и усами, которые держатся на честном слове. Называет себя лордом Рамплботтомом.',
        talk: function* (g) { yield g.talkTo('lord'); },
        items: {
          stamps: function* (g) { yield* buyModulator(g); },
          coin: function* (g) { yield g.say('bosco', 'Пятьдесят центов? Лорды не берут мелочь. Мелочь брал Боско. Боско уехал.'); },
          cream: function* (g) { yield g.say('bosco', 'Возвращаете пену? Оставьте себе. Джентльмен не отнимает то, что у него уже украли.'); },
          gun: function* (g) { yield g.say('bosco', 'Опустите оружие, милейший. Под прилавком у лорда три таких же. Фамильные.'); },
          launcher: function* (g) { yield g.say('bosco', 'Мой старый гранатомёт! Узнаю. Сдачи не дам.'); },
          vtape: function* (g) { yield g.say('bosco', 'Уберите кассету. Телевизор следит за нами через кассеты. Все знают.'); },
          paper: function* (g) { yield g.say('bosco', 'Этот номер у меня есть. Весь тираж, если быть точным. Изучаю противника.'); },
          photo: function* (g) { yield g.say('bosco', 'Зелёный человек? Поосторожнее с ним. Зелёные читают мысли. Я свои мысли прячу под котелком.'); },
          contract: function* (g) { yield g.say('bosco', 'Контракт? Мой совет: не подписывайте ничего, что может прочитать налоговая.'); },
          cake: function* (g) { yield g.say('bosco', 'Уберите торт от прилавка. В прошлый раз в торте был жучок. Настоящий, с антенной.'); },
          kcake: function* (g) { yield g.say('bosco', 'Кетчуп на торте? Я видел многое, старина. Но я англичанин и делаю вид, что не видел.'); },
          max: function* (g) { yield g.say('max', 'Лорд, продайте мне что-нибудь взрывное!'); yield g.say('bosco', 'Взрывное продаётся только пэрам Англии. Вы пэр?'); yield g.say('max', 'Я кролик!'); yield g.say('bosco', 'Тогда приходите через год. С рекомендациями.'); }
        }
      }
    },
    setup(g) {
      const b = g.actors.bosco;
      b.act = ''; b.keepAct = false;
      g.f.wcOpen = false;
    },
    onLoad(g) { ROOMS.bosco.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
