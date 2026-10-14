(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP103;
  const { ROOMS, TALK, LAYERS } = E;
  const { sprite, textOn } = S.BG;
  const A = S.art103;

  const mrBear = A.mrBear;

  Object.assign(LAYERS, {
    office: {
      closetOpen: g => S.LAYERS.office.closetOpen(g),
      wig: () => sprite(34, 34, P => {
        P.part(P.ell(17, 31.6, 8.5, 1.9), C.grey, { b: 1 });
        P.part(P.rect(16, 27, 2, 4), C.grey, { b: 3, sh: 0 });
        const Q = new S.Pen(P.b).at(17, 20, 1);
        Q.part(Q.rect(-3, 6, 6, 5), C.stone, { b: 3, sh: 0 });
        Q.part(Q.ell(0, 0.5, 7.4, 8.4), C.stone, { b: 4 });
        S.art.bradyHair(Q, 0, 0);
        Q.line(10.5, -7, 12.5, -1, C.grey[4]);
        P.part(P.rect(28, 18, 5, 4), C.grey, { b: 5, sh: 0 });
      }),
      mrbear: g => sprite(24, 26, P => mrBear(P, 12, 24, g ? g.time : 0)),
      leoCloset: () => sprite(36, 92, (P, b) => {
        const sp = S.sprite('leonard', { act: 'tied', v: 'tape', dir: 's' }, 0.8);
        S.blit(b, sp.buf, 14 - sp.ox, 88 - sp.oy);
        S.art.bradyHair(new S.Pen(b).at(14, 42, 0.8), 0, 0);
      }),
      sign: () => sprite(22, 20, (P, b) => {
        P.part(P.rect(10, 9, 2, 11), C.wood, { b: 2, sh: 0 });
        P.part(P.rect(0, 0, 22, 10), C.cream, { b: 4 });
        textOn(b, 'СКУП', 1, 1, C.red[2], 0);
      }),
      cards: () => sprite(64, 16, P => {
        const pos = [[4, 8, 0.3], [14, 4, -0.2], [26, 9, 0.5], [40, 5, 0.1], [52, 10, -0.4], [34, 12, 0.2]];
        for (const [x, y, r] of pos) {
          const c = Math.cos(r), s = Math.sin(r);
          const pts = [[-4, -2.6], [4, -2.6], [4, 2.6], [-4, 2.6]].flatMap(([px, py]) => [x + px * c - py * s, y + px * s + py * c]);
          P.part(P.poly(pts), r > 0 ? C.grey : C.red, { b: r > 0 ? 5 : 3, sh: 0, hi: 0 });
        }
      }),
      desk: () => S.LAYERS.office.desk(),
      phone: () => S.LAYERS.office.phone()
    }
  });

  function* ring(g, times) {
    for (let i = 0; i < times; i++) { g.sfx('ring'); yield 1.1; }
  }

  function* pickUp(g) {
    yield g.walkTo('sam', 104, 150);
    g.face('sam', 'w');
    const sam = g.actors.sam;
    sam.act = 'phone'; sam.keepAct = true;
    yield g.say('sam', 'Вольная полиция. Сэм у аппарата.');
  }

  function hangUp(g) {
    g.sfx('hangup');
    const sam = g.actors.sam;
    sam.act = ''; sam.keepAct = false;
  }

  function* intro(g) {
    g.hideUI = true;
    const sam = g.actors.sam, max = g.actors.max, j = g.actors.jimmy;
    max.scripted = true;
    g.place('max', 'office', 190, 172, 'n');
    g.place('sam', 'office', 190, 142, 's');
    g.f.tvOff = true;
    g.closeup = { kind: 'titlecard3', t0: g.time, lines: ['SAM & MAX', 'ЭПИЗОД 103', 'КРОТ, МАФИЯ И ФРИКАДЕЛЬКА'] };
    g.music('title3');
    yield g.fadeIn(1.2);
    yield 4.2;
    yield g.fadeOut(2);
    g.closeup = null;
    g.music('office');
    sam.act = 'reach'; sam.keepAct = true;
    yield g.fadeIn(1.5);
    yield g.say('max', 'Дама пик! У тебя дама пик и две шестёрки, Сэм!');
    yield g.say('sam', 'Макс, ты опять смотришь в телевизор у меня за спиной.');
    yield g.say('max', 'Я смотрю телевизор! Он выключен, но я его не брошу!');
    yield g.say('sam', 'В тёмном экране отражаются мои карты. В приличных домах это называется жульничеством.');
    yield g.say('max', 'А в нашем называется внимательностью! Раздача! Раздача!');
    sam.act = ''; sam.keepAct = false;
    max.act = 'grin'; max.actT = 1;
    g.sfx('deal');
    g.vt.cardsFly = g.time;
    yield 1.4;
    g.vt.cardsFly = 0;
    g.f.cardsOnFloor = true;
    g.sfx('squeak');
    g.place('jimmy', 'office', 211, 128, 'w');
    j.visible = true; j.act = 'peek'; j.keepAct = true;
    yield g.say('jimmy', 'Туз пик заехал ко мне в нору. Что упало в нору, то сдано в скупку. Правила заведения, начальник.');
    j.visible = false;
    g.f.aceInHole = true;
    yield g.say('max', 'Он спёр нашего туза! Сэм, это ограбление!');
    yield g.say('sam', 'Это скупка краденого, Макс. Джимми сменил профессию. На ту же самую, только теперь с вывеской.');
    yield* ring(g, 2);
    yield* pickUp(g);
    yield E.phone(g, 'Сэм, это Комиссар. Дело деликатное, так что слушайте молча.');
    yield E.phone(g, 'Игровой рай и казино Теда И. Бэра. На вывеске написано, что мафии там нет. Там Игрушечная мафия.');
    yield E.phone(g, 'Месяц назад я отправил туда своего человека. Крота. Три недели от него ни звука.');
    yield g.say('sam', 'Может, он просто проигрался и стесняется позвонить.');
    max.scripted = false;
    g.hideUI = false;
    yield g.talkTo('commish');
  }

  TALK.commish = {
    options: [
      { id: 'mole', icon: 'mole', text: 'Кто этот крот?', run: function* (g) {
        yield E.phone(g, 'Лучший агент управления. Имя вам ни к чему, он под прикрытием.');
        yield g.say('sam', 'Хотя бы приметы.');
        yield E.phone(g, 'Невысокий. В костюме. Хорошо роет.');
      } },
      { id: 'code', icon: 'rug', text: 'Как мы его узнаем?', run: function* (g) {
        yield E.phone(g, 'Подойдёте и спросите: «Ковёр подходит к шторам?» Крот ответит: «Ну, знаете ли!» И даст вам пощёчину.');
        yield g.say('sam', 'Пощёчину?');
        yield E.phone(g, 'Для достоверности. Пароль мы выбирали целый месяц.');
        g.f.knowCode = true;
      } },
      { id: 'bear', icon: 'f:hbear', text: 'А что с мишкой из дела Майры?', run: function* (g) {
        yield E.phone(g, 'Эксперты его вскрыли. Внутри клеймо: «Фабрика игрушек Теда И. Бэра». Так что дело у вас одно.');
        yield E.phone(g, 'Самого мишку я вам вернул. Он всю ночь смотрел на меня из сейфа.');
        yield g.say('sam', 'Теперь он живёт у нас в шкафу, Комиссар. Макс играет с ним в гляделки.');
      } },
      { id: 'bomb', icon: 'f:max', text: 'А можно просто всё взорвать?', speaker: 'max', run: function* (g) {
        yield E.phone(g, 'Там наш крот, Макс. И посетители.');
        yield g.say('max', 'Посетители мафии?');
        yield E.phone(g, 'Посетители казино. Они платят налоги.');
        yield g.say('max', 'Вот так всегда. Как только что-то интересное, сразу налоги.');
      } },
      { id: 'where', icon: 'car', text: 'Где это казино?', run: function* (g) {
        yield E.phone(g, 'За городом, у шоссе. Вывеска с мишкой видна за три мили. Мишка улыбается. Не доверяйте ему.');
      } },
      { id: 'bye', icon: 'bye', text: 'Найдём мы вашего крота.', end: true, run: function* (g) {
        yield E.phone(g, 'И постарайтесь не проиграть там всё управление.');
        hangUp(g);
        g.f.caseOpen = true;
        g.f.knowCode = true;
        yield g.say('sam', 'Собирайся, Макс. Едем в казино.');
        yield g.say('max', 'В казино! Сэм, у тебя под шляпой что-то звякнуло.');
        yield g.say('sam', 'Дуршлаг. Шлем от Боско. После Брэди Калчера я без него из дома не выхожу.');
        yield g.say('max', 'А мне шлем?');
        yield g.say('sam', 'Тебе ни к чему. Ты неделю играешь в гляделки с мишкой из шкафа и до сих пор не моргнул.');
        yield g.say('max', 'Я его почти победил!');
      } }
    ]
  };

  const TV_PROGS = ['ad', 'news', 'meatball', 'champ'];

  function* watchTv(g) {
    const i = g.f.tvSeg || 0;
    const prog = i < TV_PROGS.length ? TV_PROGS[i] : 'rerun';
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('tvon');
    g.closeup = { kind: 'tv3', prog, t0: g.time };
    const tv = (t, c) => E.tv(g, t, c);
    if (prog === 'ad') {
      g.music('playland');
      yield tv('У Теда И. Бэра весело всегда! Карты, сэндвичи, жетоны...', C.gold[4]);
      yield tv('...а мафии нет и следа!', C.gold[4]);
      yield tv('Игровой рай и казино Теда И. Бэра. Мафии нет! Спросите любого сотрудника!');
    } else if (prog === 'news') {
      g.music('office');
      yield tv('Новости. В пятницу начинается суд над Игрушечной мафией. Главный свидетель обвинения обещает рассказать всё.');
      yield tv('Я видела всё! За умеренную плату увижу ещё больше!', COLORS.sybil);
    } else if (prog === 'meatball') {
      g.music('casino');
      yield tv('Минутка гурмана. Гордость казино Теда И. Бэра: Оригинальный сэндвич с фрикадельками. Хранится под стеклом с восемьдесят седьмого года.');
      yield tv('Есть его нельзя. На него можно смотреть и завидовать.');
    } else if (prog === 'champ') {
      g.music('casino');
      yield tv('Спорт. Леонард Стейкчармер выиграл в казино Теда И. Бэра десять миллионов жетонов. По одному жетону за партию.');
      yield tv('Индейский покер самая честная игра на свете. Я просто всегда знаю, какая у меня карта.', COLORS.leonard);
    } else {
      g.music('playland');
      yield tv('Повтор рекламы. У Теда И. Бэра весело всегда...', C.gold[4]);
    }
    g.closeup = null;
    g.music('office');
    g.f.tvOff = false;
    g.f.tvSeg = i + 1;
    if (prog === 'ad') { yield g.say('sam', 'Реклама, которая отрицает то, в чём её никто не обвинял.'); yield g.say('max', 'Мне понравилась песенка! Там было про сэндвичи!'); }
    if (prog === 'news') { yield g.say('sam', 'Это Сибил. Она опять сменила работу. На этот раз на опасную для жизни.'); g.f.tvSybil = true; }
    if (prog === 'meatball') { yield g.say('max', 'Я смотрю и завидую, Сэм! Мне плохо!'); yield g.say('sam', 'Двенадцать лет под стеклом. Сэндвичу тоже, наверное, плохо.'); }
    if (prog === 'champ') { yield g.say('sam', 'Он знает карту у себя на лбу. У меня на лбу обычно шляпа, и то я в ней не всегда уверен.'); g.f.tvDone = true; }
    if (prog === 'rerun') yield g.say('sam', 'Мишки поют в третий раз. На четвёртый я начну подпевать, и тогда нас уже не спасти.');
  }

  function* jimmyShow(g) {
    const j = g.actors.jimmy;
    g.place('jimmy', 'office', 211, 128, 'w');
    j.visible = true; j.act = 'peek'; j.keepAct = true;
    g.sfx('squeak');
  }

  function* tradeAce(g) {
    if (g.has('ace') || g.f.aceOnNose || g.f.pokerWon) { yield g.say('jimmy', 'Туза ты уже выкупил, начальник. Второго у меня нет. Первый был краденый.'); return; }
    yield* jimmyShow(g);
    yield g.say('sam', 'Жетон казино Теда И. Бэра за нашего туза.');
    yield g.say('jimmy', 'Блестит! Мафия за такие жетоны закапывает. Беру.');
    g.drop('token');
    g.sfx('pickup');
    yield 0.4;
    g.give('ace');
    g.f.aceGot = true;
    yield g.say('jimmy', 'Туз пик, слегка погрызенный. Погрызенное не возвращается.');
    g.actors.jimmy.visible = false;
  }

  TALK.jimmy = {
    start: function* (g) { yield* jimmyShow(g); },
    end: function* (g) { g.actors.jimmy.visible = false; g.sfx('squeak'); },
    options: [
      { id: 'ace', icon: 'ace', text: 'Верни туза, Джимми.', when: g => !g.has('ace') && !g.f.aceOnNose && !g.f.pokerWon, run: function* (g) {
        yield g.say('jimmy', 'Туз лежит у меня на витрине. Витрина, правда, в норе. Меняю на что-нибудь блестящее, начальник. Пуговицы не предлагать, у меня их полная нора.');
        g.f.knowAce = true;
      } },
      { id: 'token', icon: 'token', text: 'Как насчёт жетона из казино?', when: g => g.has('token') && !g.has('ace') && !g.f.aceOnNose && !g.f.pokerWon, end: true, run: function* (g) {
        g.endDialog();
        yield* tradeAce(g);
      } },
      { id: 'job', icon: 'q', text: 'Ты теперь скупщик краденого?', run: function* (g) {
        yield g.say('jimmy', 'После погони на шоссе «Бритые хвосты» распались. Хвосты отросли, а какая банда без бритья?');
        yield g.say('jimmy', 'Теперь у меня честный бизнес. Покупаю краденое, продаю краденое. Налоги плачу краденым.');
      } },
      { id: 'mob', icon: 'f:chuckles', text: 'Что ты знаешь об Игрушечной мафии?', run: function* (g) {
        yield g.say('jimmy', 'Мишки в костюмах. Товар у них плюшевый, а разговор нет. Я с ними дел не имею.');
        yield g.say('jimmy', 'Пока они не приносят чего-нибудь вкусного.');
      } },
      { id: 'leo', icon: 'f:leonard', text: 'Что тебе предлагал Леонард?', when: g => g.f.leonardCaught, run: function* (g) {
        yield g.say('jimmy', 'Сэндвич. Оригинальный, говорит. Я чуть не купил. У крыс, начальник, слабость к оригиналам. Копии мы едим бесплатно.');
      } },
      { id: 'bye', icon: 'bye', text: 'Не скучай, Джимми.', end: true, run: function* (g) {
        yield g.say('jimmy', 'Заходи, начальник. Скупаю всё, кроме неприятностей.');
      } }
    ]
  };

  function* holdup(g) {
    g.f.leonardHere = true;
    const leo = g.actors.leonard, j = g.actors.jimmy, sam = g.actors.sam;
    g.hideUI = true;
    yield g.say('leonard', 'Оригинал, клянусь мамой! Сам Тед И. Бэр его не трогал. Двадцать тысяч, и он твой.');
    yield g.say('jimmy', 'Пятнадцать. И дай понюхать.');
    yield g.say('max', 'Сэм! Это он! Он продаёт наш сэндвич!');
    g.faceTo('leonard', sam.x);
    leo.act = 'aim'; leo.keepAct = true;
    g.sfx('click');
    j.visible = false;
    yield g.say('leonard', 'Ни с места! Руки вверх! Или вниз! Как вам удобнее, только медленно!');
    g.hideUI = false;
    yield g.talkTo('holdup');
  }

  function* capture(g) {
    const leo = g.actors.leonard, max = g.actors.max;
    yield g.say('leonard', 'Он н-настоящий! Почти! Он стреляет! Громко!');
    yield g.say('max', 'У меня был такой же! Я его съел!');
    max.scripted = true;
    g.sfx('boing');
    yield g.walkTo('max', leo.x - 8, leo.y + 2, { speed: 3 });
    g.sfx('punch');
    g.fx.shake = 0.6;
    leo.act = 'tied'; leo.keepAct = true;
    g.place('max', 'office', leo.x + 20, leo.y + 4, 'w');
    yield 0.5;
    g.sfx('cap');
    yield g.say('max', 'Пистоны! Я так и знал! Сэм, я его связал! Верёвкой из-под твоего стола!');
    yield g.say('sam', 'Это был удлинитель, Макс.');
    yield g.say('max', 'Теперь это верёвка!');
    max.scripted = false;
    g.give('capgun');
    g.f.leonardCaught = true;
    yield g.say('sam', 'Пистоны конфискованы, Леонард. Такие вещи опасны. Особенно в руках у людей вроде тебя.');
  }

  TALK.holdup = {
    options: [
      { id: 'why', icon: 'sandwich', text: 'Зачем ты украл сэндвич?', run: function* (g) {
        yield g.say('leonard', 'Вы отняли мои десять миллионов! Мама говорит: сынок, если у тебя что-то отняли, отними что-нибудь сам. Лучше съедобное.');
      } },
      { id: 'where', icon: 'q', text: 'Где сэндвич, Леонард?', run: function* (g) {
        yield g.say('leonard', 'Спрятан. Там, где его никто не найдёт. Даже я иногда не нахожу.');
      } },
      { id: 'calm', icon: 'bye', text: 'Опусти пистолет.', run: function* (g) {
        yield g.say('leonard', 'Ещё чего! Я опасен! Мама говорит, я весь в отца!');
        yield g.say('sam', 'А отец?');
        yield g.say('leonard', 'Отец торгует пылесосами.');
      } },
      { id: 'code', icon: 'rug', text: E.CODE, run: function* (g) {
        yield g.say('leonard', 'Какие шторы? У меня нет ни ковра, ни штор. У меня есть мама и пистолет.');
      } },
      { id: 'eat', icon: 'f:max', text: 'Можно я съем сэндвич?', speaker: 'max', run: function* (g) {
        yield g.say('leonard', 'Никто не съест сэндвич! Это оригинал! Его нельзя есть, его можно только продать!');
      } },
      { id: 'cap', icon: 'capgun', text: 'Эй! Это что, пистолет с пистонами?', speaker: 'max', end: true, run: function* (g) {
        g.endDialog();
        yield* capture(g);
        yield g.talkTo('leonard2');
      } }
    ]
  };

  function* confess(g) {
    const leo = g.actors.leonard;
    leo.v = 'r4';
    yield g.say('leonard', 'Хватит! Хватит! Только не про маму!');
    yield g.say('leonard', 'Сэндвич в Мишке-бандите! В казино! Я засунул его в лоток для выигрышей и открутил ручку!');
    yield g.say('leonard', 'Ручка у меня в кармане. Берите. Мама бы меня не простила. Мама меня и так не прощает.');
    yield g.anim('sam', 'reach', 0.5);
    g.give('arm');
    g.f.leonardTalked = true;
    yield g.say('sam', 'Посидишь пока в шкафу, Леонард. Компания там приличная. Парик и плюшевый медведь, оба бывшие злодеи.');
    yield g.say('leonard', 'В шкафу?! Там же темно! Можно хотя бы колоду?');
    yield g.say('max', 'Колоду нельзя! Ты жульничаешь!');
    yield g.fadeOut(3);
    g.f.leonardCloset = true;
    g.f.closetOpen = true;
    g.place('leonard', 'nowhere', 0, 0);
    leo.act = ''; leo.keepAct = false; leo.v = '';
    g.sfx('door');
    yield g.fadeIn(3);
    yield g.say('max', 'У нас в шкафу живой человек, Сэм! Его надо кормить?');
    yield g.say('sam', 'Раз в день, Макс. И не сэндвичем.');
  }

  const STARTS = [
    { id: 'fat', text: 'Твоя мама такая толстая...' },
    { id: 'old', text: 'Твоя мама такая старая...' },
    { id: 'stingy', text: 'Твоя мама такая скупая...' },
    { id: 'short', text: 'Твоя мама такая маленькая...' },
    { id: 'rude', text: 'Твоя мама такая грубая...' },
    { id: 'ugly', text: 'Твоя мама такая страшная...' }
  ];
  const ENDS = [
    { id: 'fat', icon: 'envelope', text: '...что у неё свой почтовый индекс!' },
    { id: 'old', icon: 'waves', text: '...что помнит Мёртвое море ещё больным!' },
    { id: 'stingy', icon: 'eyelid', text: '...что моргает по очереди, чтобы не тратить оба века!' },
    { id: 'short', icon: 'limbo', text: '...что проходит под планкой для лимбо не нагибаясь!' },
    { id: 'rude', icon: 'phone', text: '...что автоответчик у неё извиняется!' },
    { id: 'ugly', icon: 'scarecrow', text: '...что вороны при виде неё возвращают всё украденное!' }
  ];
  const MISS = [
    'Ха! Мимо. Даже мама не обиделась бы.',
    'Это про чью-то чужую маму. Моя бы даже не обернулась.',
    'Не смешно. У вас шутки не сходятся, как карты у новичка.',
    'Мама в таких случаях говорит: «Мальчики, начните сначала».'
  ];
  const RED = ['', 'r1', 'r2', 'r3'];

  TALK.leonard2 = {
    options: [
      { id: 'where', icon: 'sandwich', text: 'Где сэндвич?', run: function* (g) {
        yield g.say('leonard', 'Ничего не скажу! Хоть пытайте!');
        yield g.say('sam', 'Мы Вольная полиция, Леонард. Пытки у нас запрещены. Кроме словесных.');
        yield g.say('leonard', 'Словами меня не возьмёшь! Меня мама с пелёнок словами закаляла!');
        yield g.say('max', 'У него есть мама, Сэм! А у меня про мам целая коллекция!');
        g.f.knowMama = true;
      } },
      { id: 'mama', icon: 'mama', text: 'Поговорим о твоей маме.', when: g => g.f.knowMama, end: true, run: function* (g) {
        yield g.say('leonard', 'Не смейте! Мама святая женщина! Она мне каждое утро гладит водолазку!');
        g.endDialog();
        yield g.talkTo('yomama');
      } },
      { id: 'cheat', icon: 'ace', text: 'Ты жульничал в покер.', run: function* (g) {
        yield g.say('leonard', 'Я смотрел в нос статуе! Смотреть никто не запрещал! Это ловкость!');
        yield g.say('leonard', 'А вы повесили туда туза! Вот это жульничество!');
      } },
      { id: 'bye', icon: 'bye', text: 'Подумай пока.', end: true, run: function* (g) {
        yield g.say('leonard', 'Я подумаю. Но ничего не скажу. Думать мама разрешает.');
      } }
    ]
  };

  TALK.yomama = {
    options: (g, d) => {
      const hits = d.data.hits || [];
      if (!d.data.start) {
        return STARTS.filter(s => !hits.includes(s.id)).map(s => ({ id: 's_' + s.id, icon: 'mama', text: s.text, run: function* () { d.data.start = s.id; } })).concat([
          { id: 'stop', icon: 'bye', text: 'Передохнём.', end: true, run: function* (gg) { yield gg.say('leonard', 'Передохните! И подумайте о своём поведении!'); } }
        ]);
      }
      return ENDS.map(e => ({
        id: 'e_' + e.id, icon: e.icon, text: e.text, speaker: 'max',
        run: function* (gg) {
          const ok = e.id === d.data.start;
          d.data.start = null;
          if (!ok) { yield gg.say('leonard', MISS[(gg.count('yomiss') - 1) % MISS.length]); return; }
          hits.push(e.id);
          d.data.hits = hits;
          gg.sfx('laugh');
          if (hits.length >= 4) { gg.endDialog(); yield* confess(gg); return; }
          gg.actors.leonard.v = RED[hits.length];
          yield gg.say('leonard', ['Неправда! Она ходит на аэробику!', 'Мама! Они смеются над тобой! Я тоже немножко!', 'Хватит... У меня лицо горит...'][hits.length - 1]);
        }
      }));
    }
  };

  const CLOSET = {
    name: 'Шкаф', walk: [240, 136], face: 'n',
    look: g => g.f.closetOpen ? (g.f.leonardCloset ? 'Шкаф с уликами. Внизу Леонард, наверху мишка. Парик нашёл себе новую голову.' : 'Шкаф с уликами двух прошлых дел. Парик Брэди внизу, мишка Майры на полке.') : 'Шкаф. Туда мы убираем улики, которые лучше не видеть каждый день.',
    use: function* (g) {
      yield g.anim('sam', 'reach', 0.4);
      g.sfx('door');
      g.f.closetOpen = !g.f.closetOpen;
      if (g.f.closetOpen && !g.seen.closet103) {
        g.seen.closet103 = 1;
        yield g.say('max', 'Мистер Мишка! Привет! Сэм, он опять на меня смотрит! Я не моргну!');
        yield g.say('sam', 'У него глаза крутятся, Макс. А у тебя уже слезятся.');
      } else if (g.f.closetOpen && g.f.leonardCloset && !g.seen.leoCloset) {
        g.seen.leoCloset = 1;
        g.sfx('mumble');
        yield g.say('leonard', 'Мм-мм! Мм-мм-мм!');
        yield g.say('max', 'Он говорит «спасибо за парик»!');
      }
    }
  };

  ROOMS.office = {
    id: 'office', name: 'Офис Сэма и Макса', w: 320, music: 'office',
    paint: b => S.BG.office(b, {}),
    walk: [[40, 132, 258, 132, 316, 162, 316, 198, 4, 198, 4, 156, 36, 134]],
    block: [[0, 152, 96, 147, 112, 158, 112, 200, 0, 200]],
    layers: [
      { id: 'closetOpen', x: 222, y: 38, when: g => g.f.closetOpen },
      { id: 'mrbear', x: 228, y: 42, when: g => g.f.closetOpen, key: g => Math.floor(g.time * 3) % 8 },
      { id: 'wig', x: 225, y: 92, when: g => g.f.closetOpen && !g.f.leonardCloset },
      { id: 'leoCloset', x: 222, y: 38, when: g => g.f.closetOpen && g.f.leonardCloset },
      { id: 'sign', x: 186, y: 110 },
      { id: 'cards', x: 124, y: 150, base: 151, when: g => g.f.cardsOnFloor },
      { id: 'desk', x: 0, y: 138, base: 176 },
      { id: 'phone', x: 46, y: 142, base: 177 }
    ],
    drawBack(f, g, cx) {
      if (g.f.tvOff) return;
      for (let y = 63; y < 84; y++) for (let x = 176; x < 205; x++) f.set(x - cx, y, y < 74 ? C.purple[2] : C.purple[1]);
      const k = Math.floor(g.time * 2) % 3;
      const cfg = [A.MOB.lovey, A.MOB.cuddly, A.MOB.guard][k];
      A.bearMask(new S.Pen(f).at(190 - cx, 74 + (Math.floor(g.time * 4) % 2), 0.36), 0, 0, Object.assign({}, cfg, { hat: null }), { talk: Math.floor(g.time * 6) % 2 === 0 });
      for (let i = 0; i < 5; i++) f.set(178 + i * 6 - cx, 64, C.cycle[(i + Math.floor(g.time * 5)) % 8]);
    },
    sprites(g) {
      if (!g.vt.cardsFly) return [];
      const t = g.time - g.vt.cardsFly;
      const out = [];
      for (let i = 0; i < 7; i++) {
        const k = Math.min(1, t / 1.2);
        const x0 = 190, y0 = 150;
        const tx = i === 6 ? 211 : 126 + i * 10, ty = i === 6 ? 128 : 152 + (i % 3) * 2;
        const x = x0 + (tx - x0) * k, y = y0 + (ty - y0) * k - Math.sin(k * Math.PI) * (40 + i * 5);
        out.push({ y: 300, draw: (f, cx) => { const P = new S.Pen(f); P.part(P.rect(x - cx - 3, y - 2, 6, 4), i % 2 ? C.red : C.grey, { b: i % 2 ? 3 : 5, sh: 0, hi: 0 }); } });
      }
      return out;
    },
    hot: [
      { id: 'edoor', name: 'Дверь на улицу', poly: [276, 32, 306, 23, 306, 170, 276, 142], walk: [284, 162], face: 'e',
        look: 'Наша дверь. На стекле всё та же надпись. Буквы кое-где процарапаны: Макс проверял, съедобные ли они.',
        exit: function* (g) {
          if (!g.f.caseOpen) { yield g.say('sam', 'Комиссар ещё на проводе. Он обижается, когда от него уходят пешком.'); return; }
          g.sfx('door');
          yield* g.goRoom('street', { x: 300, y: 146, dir: 's' });
        } },
      { id: 'tv', name: 'Телевизор', poly: [172, 60, 212, 58, 213, 87, 172, 88], walk: [192, 136], face: 'n',
        look: g => g.f.tvOff ? 'Телевизор выключен. В тёмном экране отражается весь офис. Макс это давно понял.' : 'По телевизору опять реклама Теда И. Бэра. Мишки на экране поют и не моргают.',
        use: function* (g) { yield* watchTv(g); },
        items: {
          gun: 'Стрелять в рекламу? Её крутят на всех каналах. Патронов не хватит.',
          ace: 'Показать туза телевизору? Он и так видит все мои карты.'
        } },
      { id: 'vcr', name: 'Видеомагнитофон', rect: [177, 88, 31, 10], walk: [192, 136], face: 'n',
        look: 'Видеомагнитофон. На часах «00:00». Прошлые кассеты разошлись по делам.',
        use: 'Смотреть нечего. Последнюю кассету Макс сдал Джимми в скупку.' },
      { id: 'phone', name: 'Телефон', rect: [44, 140, 26, 16], walk: [118, 160], face: 'w', over: true,
        look: 'Наш телефон. Комиссар звонит в него, когда ему плохо. Нам после его звонков тоже.',
        use: 'Звонить Комиссару без повода опасно. Он обязательно найдёт повод сам.' },
      { id: 'desk', name: 'Стол', poly: [0, 156, 92, 150, 108, 158, 108, 200, 0, 200], walk: [118, 164], face: 'w',
        look: 'Мой стол. Под кружкой лежит таблица наших партий в карты. Макс выигрывает всегда. Теперь ясно почему.',
        use: 'В ящиках пусто. Всё ценное давно лежит у Джимми в скупке.' },
      { id: 'cards', name: 'Колода', rect: [124, 148, 64, 14], walk: [156, 170], face: 'n', when: g => g.f.cardsOnFloor,
        look: g => g.has('ace') || g.f.aceOnNose ? 'Наша колода. Туз пик на задании.' : 'Наша колода, рассыпанная по полу. Не хватает туза пик. Он уехал к Джимми в нору.',
        use: 'Собирать колоду без туза? Это как играть в покер без совести. То есть как Леонард.' },
      Object.assign({ id: 'closet', poly: [224, 42, 260, 40, 260, 128, 224, 128], when: g => !g.f.closetOpen }, CLOSET),
      Object.assign({ id: 'closetin', rect: [222, 38, 47, 92], when: g => g.f.closetOpen }, CLOSET),
      { id: 'wig', name: 'Парик Брэди Калчера', rect: [225, 92, 34, 34], when: g => g.f.closetOpen && !g.f.leonardCloset, walk: [240, 136], face: 'n', over: true,
        look: 'Парик Брэди Калчера из первого дела. Кок до сих пор держится на лаке и самомнении. Без Брэди он совсем не опасен.',
        use: function* (g) { yield g.say('max', 'Примерь, Сэм! В мафии нужен стиль!'); yield g.say('sam', 'В мафии нужен костюм. Причёска у меня своя, и она под шляпой.'); },
        items: { gun: 'Стрелять в парик? Он сдался ещё в прошлом деле.' } },
      { id: 'mrbear', name: 'Мистер Мишка', rect: [230, 46, 20, 20], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: ['Мистер Мишка из студии Майры. Обугленный, в скотче, с проводком из шва. Глаза до сих пор медленно крутятся.', 'На ярлыке клеймо: «Фабрика игрушек Теда И. Бэра. Сделано с любовью. Не для детей». Приятная фирма.'],
        use: function* (g) {
          g.sfx('zap');
          yield g.say('sam', 'Шипит, как сковородка, и дёргает лапой. Для вещественного доказательства он слишком живой.');
          yield g.say('max', 'Он со мной разговаривает! Он говорит: «Моргни!» Не дождёшься!');
        },
        items: {
          gun: 'Мишка уже пережил короткое замыкание и Комиссара. Пуля ему не страшна.',
          capgun: 'Пугать пистонами мишку, которого пытали током? Он и не заметит.',
          screwdriver: 'Разбирать мишку? Эксперты Комиссара уже разобрали его и собрали. Лишние детали лежат у него в столе.'
        } },
      { id: 'leocloset', name: 'Леонард', rect: [226, 72, 26, 54], when: g => g.f.closetOpen && g.f.leonardCloset, walk: [240, 136], face: 'n', over: true,
        look: 'Леонард Стейкчармер в шкафу. Связан, рот заклеен, на голове парик Брэди. Выглядит моложе. И значительно тише.',
        talk: function* (g) { g.sfx('mumble'); yield g.say('leonard', 'Мм-мм-мм! Мм!'); yield g.say('sam', 'Он говорит, что подумает о своём поведении. Или о маме. Разобрать трудно.'); },
        use: 'Выпускать его пока рано. Сначала пусть мафия забудет, как он выглядит.',
        items: { capgun: 'Свой пистолет он больше не получит. Пистоны детям не игрушка.' } },
      { id: 'hole', name: 'Нора Джимми', rect: [203, 114, 16, 15], walk: [204, 138], face: 'n',
        look: g => g.f.aceInHole && !g.has('ace') && !g.f.aceOnNose && !g.f.pokerWon ? 'Нора Джимми Два Зуба. Из темноты блестит край нашего туза пик.' : 'Нора Джимми Два Зуба. Теперь это скупка краденого. Изнутри пахнет сыром и сделками.',
        use: 'Совать лапу в крысиную нору? Потом месяц ходить на уколы от бешенства.',
        talk: function* (g) { yield g.talkTo('jimmy'); },
        items: {
          token: function* (g) { yield* tradeAce(g); },
          tokens: 'Весь мешок? За десять миллионов Джимми продаст нору вместе с собой. Столько Джимми мне не нужно.',
          gun: 'Стрелять в нору? Там свидетель. Неприятный, но свидетель.',
          '*': function* (g) { yield* jimmyShow(g); yield g.say('jimmy', 'Такое не беру, начальник. Даже я. А я беру всё.'); g.actors.jimmy.visible = false; }
        } },
      { id: 'sign', name: 'Табличка', rect: [186, 110, 22, 10], walk: [196, 138], face: 'n',
        look: '«Скупка». Ниже мелко: «Вопросов не задаём. Ответов не даём. Джимми Два Зуба».' },
      { id: 'window', name: 'Окно', poly: [100, 30, 164, 28, 164, 96, 100, 98], walk: [134, 134], face: 'n',
        look: 'Над домами напротив висит рекламный мишка Теда И. Бэра. Улыбается даже ночью.',
        use: 'Открывать не буду. В прошлый раз в окно залетел голубь и потребовал пароль.' },
      { id: 'cabinet', name: 'Картотека', poly: [40, 62, 90, 58, 90, 124, 41, 129], walk: [66, 136], face: 'n',
        look: 'Картотека. Дело Брэди и дело Майры подшиты рядом. Дело мишки из шкафа пока открыто.',
        use: 'Пока класть нечего. Новое дело надо сначала раскрыть.' },
      { id: 'picture', name: 'Картина', rect: [43, 17, 39, 33], walk: [62, 136], face: 'n',
        look: 'Собаки играют в покер. Та, что похожа на меня, проигрывает. За её спиной висит зеркало. Теперь я понимаю, почему.',
        use: 'Картина висела криво. Теперь криво висит зеркало на ней.' },
      { id: 'rack', name: 'Вешалка', rect: [10, 50, 22, 78], walk: [42, 146], face: 'w', look: 'Вешалка. Плечики так и не вернулись с первого дела. Они теперь антенна.', use: 'Вешать нечего. Шляпу я не снимаю. Особенно теперь.' },
      { id: 'switch', name: 'Выключатель', rect: [266, 73, 9, 14], walk: [262, 142], face: 'e', look: 'Выключатель.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.3);
          g.sfx('click');
          g.fx.dark = !g.fx.dark;
          yield g.say(g.fx.dark ? 'max' : 'sam', g.fx.dark ? 'Сэм! Глаза у Мистера Мишки светятся в темноте! Это так красиво и так страшно!' : 'Со светом лучше. Мишка в шкафу хотя бы делает вид, что спит.');
        } },
      { id: 'crate', name: 'Ящик', rect: [176, 99, 33, 30], walk: [192, 138], face: 'n', look: 'Ящик «FRAGILE». В нём осколки прошлых дел и одна целая лампочка. Её мы бережём.', use: 'Пусть стоит. Если его открыть, дело придётся закрывать заново.' },
      { id: 'bulb', name: 'Лампочка', rect: [144, 0, 12, 19], look: 'Лампочка. Сорок ватт. Как и наша зарплата, если перевести в ватты.', use: 'Не достану. Макс достанет, но об этом лучше не просить.' }
    ],
    actors: {
      jimmy: {
        name: 'Джимми Два Зуба', walk: [196, 138], face: 'e', when: g => g.actors.jimmy.visible && g.actors.jimmy.room === 'office',
        look: 'Джимми Два Зуба, скупщик краденого. За ухом карандаш, на шее лупа ювелира. Лупа тоже краденая.',
        talk: function* (g) { yield g.talkTo('jimmy'); },
        items: { token: function* (g) { yield* tradeAce(g); }, gun: 'Он и так всего боится. Кроме меня.' }
      },
      leonard: {
        name: 'Леонард Стейкчармер', walk: [150, 164], face: 'e', dist: 30, when: g => g.actors.leonard.room === 'office',
        look: g => g.f.leonardCaught ? 'Леонард, связанный нашим удлинителем. Лицо у него краснеет с каждой шуткой. Мама бы расстроилась.' : 'Леонард Стейкчармер. Целится в нас из блестящего пистолета. Рука у него дрожит.',
        talk: function* (g) { yield g.talkTo(g.f.leonardCaught ? 'leonard2' : 'holdup'); },
        items: {
          gun: 'Он связан. Стрелять в связанного даже мафия не станет.',
          capgun: 'Пугать его собственным пистолетом? Это жестоко. И громко.',
          max: function* (g) { yield g.say('max', 'Можно я его покусаю?'); yield g.say('leonard', 'Не надо! У меня от укусов пятна!'); }
        }
      }
    },
    enter: function* (g) {
      if (g.f.meatStolen && !g.f.leonardHere) yield* holdup(g);
    },
    setup(g) {
      const j = g.actors.jimmy, leo = g.actors.leonard;
      if (j.room === 'office') j.visible = false;
      g.fx.dark = false;
      if (g.f.meatStolen && !g.f.leonardTalked) {
        g.place('leonard', 'office', 192, 152, 'e');
        leo.visible = true;
        if (!g.f.leonardHere) { g.place('jimmy', 'office', 211, 128, 'w'); j.visible = true; j.act = 'peek'; j.keepAct = true; leo.act = ''; leo.keepAct = false; }
        else if (g.f.leonardCaught) { leo.act = 'tied'; leo.keepAct = true; }
        else { leo.act = 'aim'; leo.keepAct = true; }
      }
    },
    onLoad(g) { ROOMS.office.setup(g); }
  };

  E.ending = function* (g) {
    yield g.fadeOut(1);
    g.fx.dark = false;
    g.f.frozen = false;
    g.setRoom('office', { x: 150, y: 166, dir: 's' });
    g.place('max', 'office', 186, 150, 'n');
    const max = g.actors.max, sam = g.actors.sam;
    max.follow = 'sam'; max.scripted = true; max.act = ''; max.keepAct = false; max.visible = true;
    sam.act = ''; sam.keepAct = false;
    g.f.closetOpen = false;
    g.music('office');
    yield g.fadeIn(1);
    yield* ring(g, 2);
    yield* pickUp(g);
    yield E.phone(g, 'Сэм, это Комиссар. Казино Теда И. Бэра взлетело на воздух. Вместе с фабрикой.');
    yield g.say('sam', 'Технически взлетела фабрика. Казино просто стояло рядом.');
    yield E.phone(g, 'А крот?');
    yield g.say('sam', 'Крот стал доном, Комиссар. Потом его засосало в пылесос для бракованных мишек.');
    yield E.phone(g, 'Жаль. Отличный был агент. Сорок долларов в неделю, и ни одной жалобы.');
    yield E.phone(g, 'Кстати. Где Оригинальный сэндвич с фрикадельками? Это улика.');
    g.sfx('eat');
    yield g.say('max', 'Какой сэндвич?');
    yield g.say('sam', 'Улика уничтожена при задержании, Комиссар.');
    hangUp(g);
    yield g.say('max', 'Он был оригинальный, Сэм. Со вкусом улики. И немножко стекла.');
    g.f.closetOpen = true;
    g.sfx('mumble');
    yield g.say('leonard', 'Мм-мм-мм!');
    yield g.say('sam', 'Шкаф у нас понемногу становится музеем. Парик, мишка и шулер. На будущее надо купить шкаф побольше.');
    const j = g.actors.jimmy;
    g.place('jimmy', 'office', 211, 128, 'w');
    j.visible = true; j.act = 'peek'; j.keepAct = true;
    g.sfx('squeak');
    yield g.say('jimmy', 'Начальник, а шулера можно сдать в скупку? Дам хорошую цену. Он почти не ношеный.');
    yield g.say('max', 'Сэм, давай его продадим! Купим новую колоду!');
    yield g.say('sam', 'Людей не продают, Макс. Даже шулеров. Даже Джимми.');
    yield g.say('max', 'Тогда давай сыграем в карты! Только ты садись к телевизору спиной!');
    j.visible = false;
    yield g.fadeOut(0.5);
    g.ended = true;
  };

  E.startNewGame = function (g) {
    E.newGame(g);
    g.setRoom('office');
    g.fade = 1; g.fadeTo = 1;
    g.run(intro, { name: 'intro' });
  };

  E.office = { intro, ring, holdup, confess, mrBear };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
