(function (HO) {
  'use strict';
  const Q = o => Object.assign({ req: [], reward: {}, give: [] }, o);

  HO.QUESTS = {
    b_pass: Q({
      zone: 'base', lvl: 1, giver: 'wen_minde', turnIn: 'wen_minde', title: 'Пропуск добровольца',
      offer: 'Пропуск у тебя уже на шее, я вижу. Осталась формальность: учебный терминал у стены должен тебя запомнить. Подойди к нему, он сам всё спросит.',
      wait: 'Терминал у стены. Он не кусается.',
      done: 'Записал? Отлично. Теперь ты числишься в программе, а значит, ко мне можно приставать с вопросами. Держи немного кредитов на первые уроки.',
      goals: [{ k: 'talk', npc: 'base_terminal', text: 'Поговорить с учебным терминалом' }],
      reward: { credits: 20 }
    }),
    b_checkup: Q({
      zone: 'base', lvl: 1, giver: 'joanna', turnIn: 'joanna', title: 'Медосмотр', req: ['b_pass'],
      offer: 'Каждый новый доброволец проходит медосмотр. Ляг в любую капсулу у стены, полежи минутку. Если она запищит, не пугайся, она всегда пищит.',
      wait: 'Капсулы у западной стены. Любая свободная.',
      done: 'Сердце, давление, реакция в порядке. Возьми аптечки. В коридоре они тебе понадобятся раньше, чем ты думаешь.',
      goals: [{ k: 'use', obj: 'capsule', n: 1, text: 'Лечь в капсулу медосмотра' }],
      reward: { items: [['medkit', 3]] }
    }),
    b_baryons: Q({
      zone: 'base', lvl: 1, giver: 'watson', turnIn: 'watson', title: 'Барионы в коридоре', req: ['b_pass'],
      offer: 'В Коридоре портретов завелись Барионы. Шесть штук, я считал. Ну, может, они просто перелетают с места на место, и их меньше. Проверь, а?',
      wait: 'Коридор портретов, прямо на север. Гудят они громко, не промахнёшься.',
      done: 'Тишина. Я даже слышу, как гудит вентиляция. Это хороший гул. Выбери что-нибудь со склада, я всё равно не знаю, кому это отдать.',
      goals: [{ k: 'kill', foe: 'baryon', n: 6, text: 'Победить Барионов' }],
      reward: { choice: ['head2', 'hands2', 'body2'] }
    }),
    b_shards: Q({
      zone: 'base', lvl: 2, giver: 'abraham', turnIn: 'abraham', title: 'Осколки', req: ['b_baryons'],
      offer: 'В Северном холле Антибарионы. Когда они рассыпаются, остаются осколки. Мне нужно пять. Для науки. И немного для коллекции.',
      wait: 'Пять осколков. Они звенят, их легко найти.',
      done: 'Пять. Слышишь? Каждый звенит по-своему. Возьми ботинки, у тебя подошвы уже стёрлись об этот пол.',
      goals: [{ k: 'collect', item: 'shard', n: 5, text: 'Собрать осколки антиматерии' }],
      reward: { credits: 30, items: [['feet2', 1]] }
    }),
    b_robot: Q({
      zone: 'base', lvl: 2, giver: 'robot', turnIn: 'robot', title: 'Робот заблудился', req: ['b_pass'],
      offer: 'Бип. Робот показывает на дверь, потом на себя, потом снова на дверь. Кажется, он хочет в Приёмный центр, но один идти боится.',
      wait: 'Бип-бип. Робот держится за тобой.',
      done: 'Бип! Робот радостно катается кругами по Приёмному центру. Из его корпуса выпадает горсть кредитов и пара пакетиков кофе.',
      goals: [{ k: 'escort', npc: 'robot', area: 'reception', text: 'Проводить робота в Приёмный центр' }],
      reward: { credits: 25, items: [['coffee', 5]] }
    }),
    b_blindspot: Q({
      zone: 'base', lvl: 3, giver: 'wen_minde', turnIn: 'wen_minde', title: 'Слепое пятно', req: ['b_checkup', 'b_baryons'],
      offer: 'В Комнате наблюдения щиток, который надо выключить, а перед ним Отродья пламени. Там же лежит диковина № 211, «Слепое пятно». Возьми её в руки: пока держишь, тебя не замечают. Дальше сам. Только не держи её слишком долго.',
      wait: 'Диковина у входа в Комнату наблюдения, щиток в дальнем углу.',
      done: 'Щиток выключен, Отродья остались без тепла. Хорошая работа. Держи учебный конус, программа выдаёт их тем, кто дошёл до этого места.',
      goals: [{ k: 'use', obj: 'curio211', n: 1, text: 'Взять диковину «Слепое пятно»' }, { k: 'use', obj: 'panel', n: 1, text: 'Выключить щиток' }],
      reward: { pathItem: true }
    }),
    b_lift: Q({
      zone: 'base', lvl: 3, giver: 'wen_minde', turnIn: 'asta', title: 'Лифт в центр', req: ['b_blindspot'],
      offer: 'Аста собирает добровольцев в Главной контрольной зоне. Космический лифт в шлюзе на юге. Говорят, его ещё чинят, так что если не поедет, вернись к нему позже.',
      wait: 'Лифт в шлюзе на юге.',
      done: 'Аста кивает и что-то отмечает в планшете.',
      goals: [{ k: 'travel', zone: 'control', text: 'Доехать до Главной контрольной зоны' }]
    }),

    s_dock: Q({
      zone: 'supply', lvl: 1, giver: 'captain', turnIn: 'captain', title: 'Стоянка у перрона',
      offer: 'Раз мы здесь застряли, познакомься с местными. Боб из ремонтной бригады знает, где что лежит. И отметься у учебного терминала, станция любит, когда всё записано.',
      wait: 'Боб у западного выхода, терминал у южной стены.',
      done: 'Познакомились? Боб хороший. Говорит много, но работает ещё больше. Вот кредиты на уроки.',
      goals: [{ k: 'talk', npc: 'bob', text: 'Поговорить с Бобом' }, { k: 'talk', npc: 'supply_terminal', text: 'Поговорить с учебным терминалом' }],
      reward: { credits: 20 }
    }),
    s_pass: Q({
      zone: 'supply', lvl: 1, giver: 'bob', turnIn: 'bob', title: 'Посетитель не авторизован', req: ['s_dock'],
      offer: 'Ваш груз на Складе запчастей, а люк меня не пускает. «Посетитель не авторизован Гертой». Меня, представляешь. Допуск выписывает Адлер, он в переговорной «Версия 1», на севере за диспетчерской.',
      wait: 'Адлер в переговорной. На север через диспетчерскую.',
      done: 'Допуск! С ним люк откроется. Сам люк в коридоре к складу, приложи бумагу к панели.',
      goals: [{ k: 'talk', npc: 'adler', give: 'pass', text: 'Получить допуск у Адлера' }]
    }),
    s_cargo: Q({
      zone: 'supply', lvl: 2, giver: 'bob', turnIn: 'bob', title: 'Груз под замком', req: ['s_pass'],
      offer: 'На складе Барионы. Пока они там, ваши ящики никто не вынесет. Разгони шестерых и принеси четыре ящика с маркировкой Комиссии.',
      wait: 'Шесть Барионов и четыре ящика. Ящики синие, их видно.',
      done: 'Четыре ящика, и склад снова склад. Возьми что-нибудь из снаряжения ремонтной бригады, нам оно всё равно велико.',
      goals: [{ k: 'kill', foe: 'baryon', n: 6, text: 'Победить Барионов' }, { k: 'collect', item: 'cargo', n: 4, text: 'Забрать ящики груза' }],
      reward: { choice: ['head2', 'hands2', 'body2'] }
    }),
    s_power: Q({
      zone: 'supply', lvl: 2, giver: 'wen_tw', turnIn: 'wen_tw', title: 'Подстанция', req: ['s_dock'],
      offer: 'Электроподстанция в конце Западного коридора. Рубильник у дальней стены. Вокруг Антибарионы, четыре как минимум. Включи свет, а? Я уже третий день читаю с фонариком.',
      wait: 'Рубильник у дальней стены подстанции.',
      done: 'Свет! Ровный, без мигания. Держи ботинки, у меня их две пары, а ходить мне всё равно некуда.',
      goals: [{ k: 'use', obj: 'switch', n: 1, text: 'Включить рубильник' }, { k: 'kill', foe: 'antibaryon', n: 4, text: 'Победить Антибарионов' }],
      reward: { credits: 30, items: [['feet2', 1]] }
    }),
    s_bridge: Q({
      zone: 'supply', lvl: 3, giver: 'captain', turnIn: 'captain', title: 'Мост к судну', req: ['s_cargo'],
      offer: 'Наш грузчик должен попасть на Грузовой причал за складом. Отталкивающий мост выключен, пульт у южного выхода со склада. Включи мост и проводи его, один он не пойдёт.',
      wait: 'Пульт моста у южного выхода со склада. Грузчик ждёт тебя.',
      done: 'Он на причале, ящики уходят на судно. Программа станции выдаёт добровольцам учебный конус, а я добавлю от себя: спасибо.',
      goals: [{ k: 'use', obj: 'console', n: 1, text: 'Включить отталкивающий мост' }, { k: 'escort', npc: 'loader', area: 'dock', text: 'Проводить грузчика на причал' }],
      reward: { pathItem: true }
    }),
    s_trotter: Q({
      zone: 'supply', lvl: 2, giver: 'adler', turnIn: 'adler', title: 'Свинка у перрона', req: ['s_pass'],
      offer: 'По перрону бегает Свинка-копилка пространства. Звенит монетами и никому не даётся. Поймай её, пока она не убежала в лифт.',
      wait: 'Свинка на перроне. Быстрая. Очень быстрая.',
      done: 'Поймал? Вот это да. Монеты оставь себе, я просто хотел посмотреть, получится ли.',
      goals: [{ k: 'kill', foe: 'trotter', n: 1, text: 'Поймать Свинку-копилку пространства' }],
      reward: { credits: 40 }
    }),
    s_lift: Q({
      zone: 'supply', lvl: 3, giver: 'captain', turnIn: 'asta', title: 'Лифт в центр', req: ['s_bridge'],
      offer: 'Аста собирает добровольцев в Главной контрольной зоне. Лифт в диспетчерской. Если не поедет, значит, его ещё чинят, возвращайся позже.',
      wait: 'Лифт в диспетчерской, на север от перрона.',
      done: 'Аста кивает и что-то отмечает в планшете.',
      goals: [{ k: 'travel', zone: 'control', text: 'Доехать до Главной контрольной зоны' }]
    })
  };
  HO.QUEST_IDS = Object.keys(HO.QUESTS);
  HO.LATER_NPCS = ['asta'];
  HO.MAX_QUESTS = 20;

  HO.questXp = q => 100 + 80 * q.lvl;

  HO.questGoalCount = function (sheet, qid, i) {
    const q = HO.QUESTS[qid], g = q.goals[i], st = sheet.quests[qid];
    if (!st) return 0;
    if (g.k === 'collect') return Math.min(g.n, HO.bagCount(sheet, g.item));
    return st.prog[i] || 0;
  };

  HO.goalNeed = g => (g.k === 'kill' || g.k === 'collect' || g.k === 'use' || g.k === 'scan' ? g.n : 1);
  HO.goalNpc = (g, sheet) => (g.byPath ? g.byPath[sheet.path] : g.npc);

  HO.questReady = function (sheet, qid) {
    const q = HO.QUESTS[qid];
    return !!sheet.quests[qid] && q.goals.every((g, i) => HO.questGoalCount(sheet, qid, i) >= HO.goalNeed(g));
  };

  HO.questAvailable = function (sheet, qid) {
    const q = HO.QUESTS[qid];
    return !sheet.done[qid] && !sheet.quests[qid] && (!q.path || q.path === sheet.path) && q.req.every(r => sheet.done[r]) && sheet.lvl >= q.lvl - (q.class ? 0 : 1);
  };

  HO.npcQuests = function (sheet, npcId) {
    const out = { offer: [], ready: [], active: [], later: [] };
    for (const qid of HO.QUEST_IDS) {
      const q = HO.QUESTS[qid];
      if (q.turnIn === npcId && sheet.quests[qid]) (HO.questReady(sheet, qid) ? out.ready : out.active).push(qid);
      else if (q.giver === npcId && !sheet.quests[qid] && !sheet.done[qid]) {
        if (HO.questAvailable(sheet, qid)) out.offer.push(qid);
        else if ((!q.path || q.path === sheet.path) && q.req.every(r => sheet.done[r])) out.later.push(qid);
      }
    }
    return out;
  };

  HO.npcMark = function (sheet, npcId) {
    const n = HO.npcQuests(sheet, npcId);
    if (n.ready.length) return '?';
    if (n.offer.length) return '!';
    if (n.later.length) return '…';
    if (n.active.length) return '·';
    return '';
  };

  HO.goalProgress = function (sheet, kind, match, events, uid) {
    for (const qid of Object.keys(sheet.quests)) {
      const q = HO.QUESTS[qid], st = sheet.quests[qid];
      q.goals.forEach((g, i) => {
        if (g.k !== kind) return;
        if ((kind === 'kill' && g.foe === match) || (kind === 'use' && g.obj === match) || (kind === 'talk' && HO.goalNpc(g, sheet) === match) || (kind === 'escort' && g.npc === match) || (kind === 'travel' && g.zone === match) || ((kind === 'anchor' || kind === 'bind') && g.anchor === match) || (kind === 'trial' && g.trial === match) || kind === 'scan') {
          const need = HO.goalNeed(g);
          if ((st.prog[i] || 0) >= need) return;
          if (kind === 'scan') {
            st.seen = st.seen || [];
            if (st.seen.includes(match)) return;
            st.seen.push(match);
          }
          st.prog[i] = (st.prog[i] || 0) + 1;
          if (g.give) HO.bagAdd(sheet, g.give, 1);
          if (events) events.push({ k: 'goal', uid, q: qid, i, have: st.prog[i], need });
        }
      });
    }
  };

  HO.wantsItem = function (sheet, item) {
    for (const qid of Object.keys(sheet.quests)) for (const g of HO.QUESTS[qid].goals) if (g.k === 'collect' && g.item === item && HO.bagCount(sheet, item) < g.n) return true;
    return false;
  };

  HO.wantsObject = function (sheet, objId) {
    for (const qid of Object.keys(sheet.quests)) {
      const q = HO.QUESTS[qid], st = sheet.quests[qid];
      for (let i = 0; i < q.goals.length; i++) {
        const g = q.goals[i];
        if (g.k === 'use' && g.obj === objId && (st.prog[i] || 0) < g.n) return true;
        if (g.k === 'collect') {
          const zoneObj = Object.values(HO.ZONES).some(z => (z.objects || []).some(o => o.id === objId && o.give === g.item));
          if (zoneObj && HO.bagCount(sheet, g.item) < g.n) return true;
        }
      }
    }
    return false;
  };

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
