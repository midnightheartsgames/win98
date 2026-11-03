(function (S) {
  'use strict';
  const FRIEND = 35, GOOD = 60, BEST_AT = 80, COLD = -10, DISLIKE = -25, ENEMY = -60, CRUSH = 15, KNOWS_WELL = 35;
  const OLD_DAYS = 30, DISTANT_DAYS = 10, MISS_DAYS = 7, LONGING_DAYS = 2, DECAY_AFTER = 3, LOVE_AT = 50;
  const CHAT_MINS = 15, REPLY_MIN = 1, REPLY_SPREAD = 2, TALK_NEAR = 1.2, TOUCH_NEAR = 0.7, FAR_NEAR = 2.6, FOLLOW_GAP = 2.5, SEEN = 12, NEAR_CHAT = 3.2;
  const PARTY_DELAY = 60, PARTY_MINS = 240, WEDDING_MINS = 180, GUEST_MINS = 180, DATE_MINS = 180, WALK_MINS = 90, PARTY_GUESTS = 8, FAMILY_LIMIT = 8, MINGLE_EVERY = 20, VISIT_DELAY = 60;
  const CHARM_STEP = 0.015, CHARM_GAIN = 0.03, CHARM_SECTIONS = new Set(['friendly', 'romance', 'jokes', 'ask', 'special']);
  const SLOW_TOP = 150, MEET_FLOOR = 1.5, CHAT_PULL = 2, CHAT_TIRE = 0.85, REL_GAIN = 1.6, MEAN_CAP = 50, ENEMY_SPITE = 0.5, ENEMY_AVOID = 0.3, W_CAP = 3.5;
  const DAY = 1440, NOW = 16, TEEN = 2, CHILD = 1, ADULT = 3, LISTEN_SOCIAL = 1.6, LISTEN_FUN = 1.2, REL_KEY = 4096;
  const F = { met: 1, romance: 2, couple: 4, engaged: 8, spouse: 16, ex: 32, exSpouse: 64, best: 128, oath: 256, distant: 512, kissed: 1024 };
  const LOVE = F.couple | F.engaged | F.spouse;

  const SECTIONS = [
    { id: 'friendly', name: 'Дружеское', icon: 'talk', weight: 1, gain: { social: 2.2 }, react: 'talk', miss: 'shrug', bubble: 'talk' },
    { id: 'ask', name: 'Спросить', icon: 'question', weight: 0.5, gain: { social: 2 }, react: 'talk', miss: 'shrug', bubble: 'talk' },
    { id: 'jokes', name: 'Шутки', icon: 'toy', weight: 0.6, gain: { social: 1.6, fun: 1.8 }, react: 'laugh', miss: 'shrug', bubble: 'toy' },
    { id: 'romance', name: 'Романтика', icon: 'heart', weight: 1, gain: { social: 2, fun: 1 }, react: 'blush', miss: 'shrug', bubble: 'heart' },
    { id: 'mean', name: 'Злое', icon: 'fire', weight: 0.25, gain: { social: 1.2 }, react: 'grumble', miss: 'shrug', bubble: 'fire' },
    { id: 'special', name: 'Особое', icon: 'star', weight: 0.9, gain: { social: 2.2 }, react: 'talk', miss: 'shrug', bubble: 'talk' }
  ];

  const ROWS = {
    friendly: [
      ['sim_chat', 'Поболтать', 'talk', 'talk', 12, 'any', 'toddler', 3, -1, 0.85, { mood: ['niceChat', 'niceChat'], learn: true }],
      ['introduce', 'Представиться', 'relations', 'handshake', 4, 'new', 'child', 5, 0, 0.95, { learn: true, touch: true, react: 'handshake' }],
      ['wave', 'Помахать рукой', 'relations', 'wave', 2, 'any', 'toddler', 1, 0, 0.95, { far: true, react: 'wave' }],
      ['handshake', 'Пожать руку', 'relations', 'handshake', 3, 'met', 'child', 2, 0, 0.9, { touch: true, react: 'handshake' }],
      ['compliment', 'Сказать комплимент', 'talk', 'talk', 6, 'met', 'child', 5, -2, 0.75, { mood: [null, 'compliment'] }],
      ['heart_talk', 'Поговорить по душам', 'heart', 'talk', 15, 'friend', 'child', 7, -2, 0.75, { mood: ['niceChat', 'niceChat'], learn: true }],
      ['complain', 'Пожаловаться на жизнь', 'cloud', 'grumble', 10, 'met', 'child', 3, -3, 0.6, { mood: ['grumbled', null], sad: [null, 'awkward'] }],
      ['hug_friend', 'Обнять по-дружески', 'relations', 'hug', 3, 'friend', 'toddler', 4, -4, 0.8, { touch: true, react: 'hug', mood: ['familyHug', 'familyHug'], sad: [null, 'awkward'] }],
      ['high_five', 'Дать пять', 'toy', 'highFive', 2, 'met', 'child', 3, -1, 0.85, { touch: true, react: 'highFive' }],
      ['weather', 'Поговорить о погоде', 'sun', 'talk', 6, 'any', 'child', 2, 0, 0.9, {}],
      ['talk_hobby', 'Рассказать об увлечении', 'paint', 'talk', 8, 'met', 'child', 3, -1, 0.75, { learn: true }],
      ['gossip', 'Посплетничать', 'talk', 'talk', 8, 'friend', 'child', 4, -3, 0.7, { mood: ['gossip', 'gossip'] }],
      ['comfort', 'Утешить', 'heart', 'hug', 5, 'sad', 'child', 6, -2, 0.75, { touch: true, react: 'hug', mood: ['kindDeed', 'familyHug'] }],
      ['apologize', 'Извиниться', 'cloud', 'bow', 4, 'cold', 'child', 8, -3, 0.6, {}],
      ['make_up', 'Помириться', 'relations', 'handshake', 6, 'dislike', 'child', 0, -5, 0.45, { set: 'makeUp', touch: true, react: 'handshake' }],
      ['thank', 'Поблагодарить', 'heart', 'talk', 3, 'met', 'child', 3, 0, 0.9, {}],
      ['cheer_up', 'Подбодрить', 'sun', 'talk', 5, 'met', 'child', 4, -1, 0.8, { mood: ['kindDeed', 'thrilled'] }],
      ['share_secret', 'Поделиться секретом', 'mask', 'talk', 8, 'good', 'child', 6, -6, 0.7, {}],
      ['best_friends', 'Предложить лучшую дружбу', 'star', 'hug', 5, 'good', 'child', 6, -8, 0.7, { min: BEST_AT, set: 'best', touch: true, react: 'hug', auto: 0.2 }],
      ['talk_family', 'Поговорить о семье', 'home', 'talk', 8, 'met', 'child', 3, -1, 0.8, {}],
      ['talk_work', 'Поговорить о работе и учёбе', 'job', 'talk', 8, 'met', 'child', 3, -1, 0.75, {}],
      ['dance_together', 'Потанцевать вместе', 'music', 'dance', 15, 'friend', 'child', 5, -3, 0.75, { react: 'dance', fun: true, mood: ['dancing', 'dancing'] }],
      ['pattycake', 'Поиграть в ладушки', 'toy', 'highFive', 6, 'any', 'toddler', 4, 0, 0.9, { ageMax: 'child', touch: true, react: 'highFive', fun: true, mood: ['playtime', 'playtime'] }],
      ['word_game', 'Поиграть в слова', 'book', 'talk', 10, 'met', 'child', 4, -1, 0.85, { pmin: 'child', fun: true, mood: ['playtime', 'playtime'] }],
      ['tickle', 'Пощекотать', 'toy', 'tickle', 3, 'friend', 'child', 4, -4, 0.75, { touch: true, react: 'laugh', mood: [null, 'tickled'], sad: [null, 'awkward'] }],
      ['goodbye', 'Попрощаться', 'relations', 'wave', 2, 'met', 'toddler', 1, 0, 0.95, { react: 'wave', end: true, auto: 0.2 }],
      ['praise', 'Похвалить', 'star', 'talk', 4, 'kin', 'teen', 5, 0, 0.9, { pmax: 'teen', mood: [null, 'thrilled'] }],
      ['reminisce', 'Вспомнить былое', 'scroll', 'talk', 10, 'good', 'teen', 5, -1, 0.85, { pmin: 'teen', mood: ['niceChat', 'niceChat'] }],
      ['bedtime_story', 'Рассказать сказку', 'book', 'talk', 15, 'kin', 'teen', 6, 0, 0.95, { pmax: 'child', mood: [null, 'bedtimeStory'] }],
      ['invite_home', 'Позвать к себе в гости', 'home', 'talk', 4, 'friend', 'child', 3, -1, 0.75, { follow: 'guest', away: true, auto: 0.1 }]
    ],
    ask: [
      ['ask_day', 'Спросить, как прошёл день', 'question', 'talk', 6, 'met', 'child', 3, 0, 0.9, {}],
      ['ask_traits', 'Спросить о характере', 'question', 'talk', 6, 'met', 'child', 3, -1, 0.85, { ask: 'trait' }],
      ['ask_dream', 'Спросить о мечте', 'star', 'talk', 6, 'friend', 'teen', 3, -1, 0.85, { ask: 'dream', pmin: 'adult' }],
      ['ask_job', 'Спросить о работе', 'job', 'talk', 5, 'met', 'teen', 2, 0, 0.9, { ask: 'job' }],
      ['ask_home', 'Спросить, где живёт', 'home', 'talk', 4, 'met', 'child', 2, 0, 0.9, { ask: 'home' }],
      ['ask_family', 'Спросить о семье', 'relations', 'talk', 6, 'met', 'child', 3, 0, 0.85, { ask: 'family' }],
      ['ask_hobby', 'Спросить об увлечениях', 'paint', 'talk', 6, 'met', 'child', 3, 0, 0.85, { ask: 'trait' }],
      ['ask_advice', 'Попросить совета', 'question', 'talk', 8, 'friend', 'child', 4, -1, 0.8, { mood: ['niceChat', null] }],
      ['ask_news', 'Спросить, что нового', 'scroll', 'talk', 6, 'met', 'child', 3, 0, 0.85, { mood: ['gossip', null] }],
      ['ask_wrong', 'Спросить, что случилось', 'cloud', 'talk', 6, 'sad', 'child', 4, 0, 0.85, { ask: 'mood' }],
      ['ask_single', 'Спросить, свободно ли сердце', 'heart', 'talk', 4, 'met', 'adult', 1, -2, 0.85, { ask: 'single', pmin: 'adult' }],
      ['ask_childhood', 'Спросить о детстве', 'baby', 'talk', 8, 'friend', 'teen', 4, 0, 0.85, { pmin: 'teen' }]
    ],
    jokes: [
      ['tell_joke', 'Рассказать анекдот', 'toy', 'talk', 6, 'any', 'child', 4, -2, 0.7, { miss: 'grumble', mood: [null, 'laughed'], sad: [null, 'awkward'] }],
      ['pun', 'Скаламбурить', 'toy', 'talk', 3, 'met', 'child', 3, -1, 0.65, {}],
      ['funny_face', 'Скорчить рожицу', 'toy', 'laugh', 2, 'any', 'toddler', 3, -1, 0.8, { mood: [null, 'funnyScene'] }],
      ['silly_story', 'Рассказать смешную историю', 'scroll', 'talk', 8, 'met', 'child', 4, -2, 0.7, { mood: [null, 'laughed'] }],
      ['imitate', 'Изобразить общего знакомого', 'mask', 'talk', 5, 'friend', 'child', 5, -3, 0.65, { mood: ['funnyScene', 'funnyScene'] }],
      ['prank', 'Разыграть', 'mask', 'laugh', 4, 'met', 'child', -2, -6, 0.6, { react: 'grumble', miss: 'grumble', mood: ['prankDone', 'pranked'], sad: [null, 'offended'] }],
      ['self_joke', 'Посмеяться над собой', 'toy', 'laugh', 4, 'met', 'child', 4, 0, 0.85, {}],
      ['riddle', 'Загадать загадку', 'question', 'talk', 5, 'met', 'child', 3, -1, 0.75, { react: 'think' }],
      ['tall_tale', 'Рассказать байку', 'scroll', 'talk', 10, 'met', 'teen', 4, -2, 0.65, { mood: [null, 'funnyScene'] }],
      ['pillow_fight', 'Бой подушками', 'toy', 'punch', 6, 'friend', 'child', 5, -2, 0.8, { react: 'punch', fun: true, peer: true, mood: ['playtime', 'playtime'] }]
    ],
    romance: [
      ['flirt_compliment', 'Похвалить внешность', 'heart', 'talk', 4, 'crush', 'teen', 5, -4, 0.65, { romance: 'teen', mood: [null, 'crush'], sad: ['rejected', null] }],
      ['confess_crush', 'Признаться в симпатии', 'heart', 'blush', 5, 'crush', 'teen', 6, -6, 0.6, { romance: 'teen', set: 'romance', mood: ['crush', 'crush'], sad: ['rejected', null] }],
      ['hold_hands', 'Взять за руку', 'heart', 'handshake', 6, 'romance', 'teen', 5, -4, 0.75, { romance: 'teen', touch: true, react: 'handshake' }],
      ['romantic_hug', 'Нежно обнять', 'heart', 'hug', 4, 'romance', 'teen', 6, -5, 0.75, { romance: 'teen', touch: true, react: 'hug' }],
      ['cheek_kiss', 'Поцеловать в щёку', 'heart', 'peck', 2, 'romance', 'teen', 6, -6, 0.7, { romance: 'teen', touch: true, react: 'blush', set: 'kissed', kiss: true, mood: ['kiss', 'kiss'], sad: ['rejected', null] }],
      ['first_kiss', 'Первый поцелуй', 'heart', 'peck', 3, 'unkissed', 'teen', 10, -8, 0.6, { romance: 'teen', min: 30, touch: true, react: 'peck', set: 'kissed', kiss: true, mood: ['firstKiss', 'firstKiss'], sad: ['rejected', null] }],
      ['walk_together', 'Позвать погулять', 'walk', 'talk', 4, 'romance', 'teen', 4, -3, 0.75, { romance: 'teen', follow: 'walk' }],
      ['go_steady', 'Предложить встречаться', 'ring', 'talk', 5, 'romance', 'teen', 10, -10, 0.6, { romance: 'teen', min: 40, set: 'couple', react: 'hug', mood: ['thrilled', 'thrilled'], sad: ['rejected', null], auto: 0.3 }],
      ['break_up', 'Расстаться', 'heartBroken', 'talk', 5, 'partner', 'teen', -40, -40, 1, { romance: 'teen', set: 'ex', react: 'cry', mood: ['breakup', 'heartbreak'], auto: 0 }],
      ['flirt', 'Пофлиртовать', 'heart', 'flirt', 4, 'met', 'adult', 5, -5, 0.6, { romance: 'adult', set: 'romance', mood: ['crush', 'crush'], sad: ['rejected', 'awkward'] }],
      ['sweet_talk', 'Наговорить нежностей', 'heart', 'talk', 6, 'romance', 'adult', 6, -5, 0.7, { romance: 'adult', mood: [null, 'crush'] }],
      ['kiss', 'Поцеловать', 'heart', 'kiss', 2, 'romance', 'adult', 7, -7, 0.7, { romance: 'adult', min: 30, touch: true, react: 'kiss', set: 'kissed', kiss: true, mood: ['kiss', 'kiss'], sad: ['rejected', null] }],
      ['make_out', 'Долгий поцелуй', 'heart', 'kiss', 5, 'couple', 'adult', 8, -8, 0.75, { romance: 'adult', touch: true, react: 'kiss', set: 'kissed', kiss: true, mood: ['kiss', 'kiss'], sad: ['rejected', null] }],
      ['slow_dance', 'Медленный танец', 'music', 'hug', 12, 'romance', 'adult', 7, -4, 0.75, { romance: 'adult', touch: true, react: 'hug', mood: ['dancing', 'dancing'] }],
      ['ask_date', 'Пригласить на свидание', 'heart', 'talk', 4, 'romance', 'adult', 4, -6, 0.7, { romance: 'adult', follow: 'date', sad: ['rejected', null] }],
      ['declare_love', 'Признаться в любви', 'heart', 'talk', 6, 'couple', 'adult', 10, -10, 0.7, { romance: 'adult', min: 55, react: 'hug', mood: ['thrilled', 'thrilled'], sad: ['rejected', null] }],
      ['propose', 'Сделать предложение', 'ring', 'bow', 6, 'couple', 'adult', 12, -15, 0.6, { romance: 'adult', min: 70, set: 'engaged', react: 'hug', mood: ['engaged', 'engaged'], sad: ['rejected', null], auto: 0 }],
      ['marry_now', 'Пожениться сразу', 'ring', 'hug', 10, 'engaged', 'adult', 10, -5, 0.9, { romance: 'adult', set: 'spouse', touch: true, react: 'hug', mood: ['wedding', 'wedding'], auto: 0 }],
      ['plan_wedding', 'Назначить свадьбу', 'ring', 'talk', 5, 'engaged', 'adult', 5, -3, 0.9, { romance: 'adult', party: 'wedding', auto: 0 }],
      ['intimacy', 'Близость', 'heart', 'talk', 2, 'couple', 'adult', 8, -6, 0.75, { romance: 'adult', min: 50, bed: true, sad: ['rejected', null], auto: 0.15 }],
      ['try_baby', 'Завести ребёнка', 'baby', 'talk', 2, 'couple', 'adult', 8, -6, 0.75, { romance: 'adult', min: 50, stage: 17, auto: 0 }],
      ['divorce', 'Развестись', 'heartBroken', 'talk', 6, 'spouse', 'adult', -50, -50, 1, { romance: 'adult', set: 'exSpouse', react: 'cry', mood: ['divorce', 'divorce'], auto: 0 }]
    ],
    mean: [
      ['tease', 'Подколоть', 'fire', 'talk', 4, 'met', 'child', -4, -1, 0.75, { mood: [null, 'mocked'] }],
      ['insult', 'Обругать', 'fire', 'grumble', 4, 'met', 'child', -10, -3, 0.85, { react: 'cry', mood: [null, 'insulted'] }],
      ['mock', 'Высмеять', 'fire', 'laugh', 4, 'met', 'child', -8, -2, 0.8, { mood: [null, 'mocked'] }],
      ['argue', 'Поспорить', 'cloud', 'grumble', 8, 'met', 'teen', -6, -2, 0.7, { mood: ['quarrel', 'quarrel'], family: 'familyFight' }],
      ['tell_off', 'Высказать всё', 'fire', 'fistShake', 6, 'met', 'teen', -12, -4, 0.8, { mood: ['quarrel', 'quarrel'], family: 'familyFight' }],
      ['blame', 'Обвинить во всём', 'exclaim', 'point', 4, 'met', 'child', -8, -3, 0.75, { react: 'shrug', mood: [null, 'offended'] }],
      ['scare', 'Напугать', 'ghost', 'scare', 2, 'met', 'child', -4, -2, 0.7, { react: 'stumble', mood: ['prankDone', 'fright'] }],
      ['tongue', 'Показать язык', 'toy', 'grumble', 2, 'any', 'toddler', -3, -1, 0.85, { react: 'shrug', mood: [null, 'offended'] }],
      ['ignore', 'Не замечать', 'cloud', 'idle', 5, 'met', 'child', -5, -1, 0.85, { react: 'shrug', mood: [null, 'ignored'] }],
      ['slap', 'Дать пощёчину', 'fire', 'slap', 2, 'met', 'teen', -15, -8, 0.8, { touch: true, peer: true, react: 'cry', mood: [null, 'insulted'], sound: 'slap' }],
      ['shove', 'Толкнуть', 'fire', 'shove', 2, 'met', 'child', -10, -6, 0.8, { touch: true, peer: true, react: 'stumble', mood: [null, 'offended'] }],
      ['fight', 'Подраться', 'punch', 'punch', 8, 'dislike', 'teen', -20, -15, 0.5, { touch: true, peer: true, fight: true, react: 'punch', miss: 'punch', mood: ['fumed', 'quarrel'], sad: ['quarrel', 'fumed'], family: 'familyFight', auto: 0.3 }],
      ['enemy_oath', 'Поклясться во вражде', 'fire', 'fistShake', 3, 'enemy', 'teen', -10, -5, 0.9, { set: 'oath', react: 'fistShake', auto: 0.2 }],
      ['push_pool', 'Столкнуть в бассейн', 'fire', 'shove', 2, 'met', 'teen', -12, -6, 0.7, { stage: 25, peer: true, pool: true }]
    ],
    special: [
      ['art_talk', 'Обсудить искусство', 'paint', 'talk', 8, 'any', 'child', 4, -1, 0.7, { trait: 'artistic', share: 'artistic' }],
      ['book_talk', 'Обсудить книгу', 'book', 'talk', 8, 'any', 'child', 4, -1, 0.7, { trait: 'bookworm', share: 'bookworm' }],
      ['tech_talk', 'Поговорить о компьютерах', 'keys', 'talk', 8, 'any', 'child', 4, -2, 0.6, { trait: 'computerWhiz', share: 'computerWhiz' }],
      ['food_talk', 'Поделиться рецептом', 'cook', 'talk', 6, 'any', 'teen', 4, -1, 0.75, { trait: 'naturalCook', share: 'naturalCook' }],
      ['sport_talk', 'Поговорить о спорте', 'punch', 'talk', 6, 'any', 'child', 4, -1, 0.7, { trait: 'athletic', share: 'athletic' }],
      ['nature_talk', 'Рассказать о природе', 'tree', 'talk', 8, 'any', 'child', 4, -1, 0.75, { trait: 'natureLover', share: 'natureLover' }],
      ['odd_theory', 'Рассказать странную теорию', 'question', 'talk', 8, 'any', 'child', 3, -3, 0.5, { trait: 'eccentric', share: 'eccentric', react: 'think' }],
      ['neat_lecture', 'Прочитать лекцию о чистоте', 'wash', 'talk', 6, 'met', 'child', 2, -4, 0.5, { trait: 'neat', share: 'neat' }],
      ['evil_laugh', 'Злобно расхохотаться', 'fire', 'laugh', 2, 'any', 'child', -3, -1, 0.9, { trait: 'evil', react: 'stumble', mood: ['gloat', 'fright'] }],
      ['schmooze', 'Подольститься', 'job', 'talk', 5, 'met', 'teen', 6, -3, 0.75, { trait: 'schmoozer' }],
      ['blurt', 'Ляпнуть неловкость', 'exclaim', 'talk', 3, 'met', 'child', -2, -4, 0.5, { trait: 'inappropriate', react: 'blush', mood: ['funnyScene', 'awkward'] }],
      ['party_dance', 'Зажечь танцем', 'music', 'dance', 10, 'met', 'child', 5, -2, 0.75, { trait: 'partyAnimal', share: 'partyAnimal', react: 'dance', fun: true, mood: ['dancing', 'dancing'] }],
      ['kids_talk', 'Рассказать о детях', 'baby', 'talk', 8, 'met', 'adult', 4, -2, 0.7, { trait: 'familyOriented', share: 'familyOriented' }],
      ['brave_story', 'Рассказать о подвиге', 'bolt', 'talk', 8, 'met', 'child', 4, -2, 0.65, { trait: 'brave', share: 'daredevil' }],
      ['borrow', 'Попросить в долг', 'money', 'talk', 4, 'friend', 'teen', -2, -6, 0.5, { trait: 'mooch', stage: 16 }],
      ['pickpocket', 'Обчистить карманы', 'mask', 'handshake', 2, 'met', 'teen', -5, -15, 0.5, { trait: 'kleptomaniac', jobAlt: ['crime', 2], stage: 16, touch: true }],
      ['pep_talk', 'Вдохновить речью', 'sun', 'talk', 6, 'met', 'teen', 6, -2, 0.8, { skill: ['charisma', 3], mood: [null, 'thrilled'] }],
      ['great_story', 'Захватывающая история', 'scroll', 'talk', 10, 'met', 'teen', 7, -2, 0.75, { skill: ['charisma', 5], mood: ['niceChat', 'niceChat'] }],
      ['smooth_compliment', 'Сказать блестящий комплимент', 'star', 'talk', 4, 'met', 'teen', 8, -2, 0.85, { skill: ['charisma', 7], mood: [null, 'compliment'] }],
      ['heal', 'Осмотреть как врач', 'heart', 'talk', 8, 'any', 'adult', 4, 0, 0.9, { stage: 15, job: 'medical', jobLevel: 4, auto: 0 }],
      ['arrest', 'Задержать', 'job', 'point', 4, 'any', 'adult', -10, -5, 0.7, { stage: 15, job: 'police', jobLevel: 5, auto: 0 }],
      ['health_tip', 'Дать совет о здоровье', 'heart', 'talk', 5, 'met', 'adult', 4, -1, 0.8, { stage: 16, job: 'medical', jobLevel: 2 }],
      ['check_docs', 'Проверить документы', 'job', 'point', 4, 'any', 'adult', -2, -4, 0.8, { stage: 16, job: 'police', jobLevel: 2, auto: 0 }],
      ['deal', 'Предложить сделку', 'money', 'talk', 8, 'met', 'adult', 5, -3, 0.6, { stage: 16, job: 'business', jobLevel: 4, auto: 0, perf: 5 }],
      ['interview', 'Взять интервью', 'scroll', 'talk', 10, 'any', 'adult', 4, -2, 0.75, { stage: 16, job: 'journalism', jobLevel: 2, auto: 0, perf: 4 }],
      ['salute', 'Отдать честь', 'job', 'point', 2, 'any', 'adult', 3, 0, 0.95, { stage: 16, job: 'military', jobLevel: 3 }],
      ['autograph', 'Дать автограф', 'star', 'talk', 3, 'any', 'adult', 5, -1, 0.85, { stage: 16, job: 'sports', jobLevel: 4 }],
      ['campaign', 'Агитировать', 'scroll', 'talk', 6, 'any', 'adult', 3, -4, 0.6, { stage: 16, job: 'politics', jobLevel: 3, auto: 0, perf: 4 }],
      ['threaten', 'Запугать', 'fire', 'point', 4, 'met', 'adult', -8, -6, 0.6, { stage: 16, job: 'crime', jobLevel: 5, auto: 0, perf: 4 }],
      ['cooking_tip', 'Дать кулинарный совет', 'cook', 'talk', 6, 'met', 'adult', 4, -1, 0.8, { stage: 16, job: 'culinary', jobLevel: 3 }],
      ['teach_guitar', 'Научить играть', 'guitar', 'talk', 10, 'met', 'adult', 4, -1, 0.8, { stage: 16, job: 'music', jobLevel: 4, auto: 0 }]
    ]
  };

  const TRAIT_SOCIAL = {
    friendly: { auto: { friendly: 2, mean: 0.2, introduce: 3 }, give: { friendly: 0.1 }, take: { friendly: 0.1 }, gain: 1.25 },
    meanSpirited: { auto: { mean: 6, friendly: 0.6 }, give: { mean: 0.1 } },
    evil: { auto: { mean: 6, friendly: 0.5, evil_laugh: 3 }, give: { mean: 0.15 } },
    hotHeaded: { auto: { argue: 3, tell_off: 3, fight: 4, slap: 2 }, take: { mean: 0.1 }, hurt: 1.3 },
    grumpy: { auto: { complain: 2, tell_off: 2, friendly: 0.7 }, take: { friendly: -0.1, jokes: -0.1 } },
    goodHumor: { auto: { jokes: 3 }, give: { jokes: 0.2 }, take: { jokes: 0.15 } },
    noHumor: { auto: { jokes: 0.2 }, give: { jokes: -0.2 }, take: { jokes: -0.4 } },
    charismatic: { auto: { friendly: 2 }, give: { friendly: 0.1, romance: 0.1 }, gain: 1.2 },
    loner: { auto: { friendly: 0.4, jokes: 0.4, romance: 0.5, ask: 0.6, introduce: 0.3 }, take: { friendly: -0.05 } },
    flirty: { auto: { romance: 5, flirt: 6, friendly: 1.3 }, give: { romance: 0.15 }, take: { romance: 0.1 }, strangers: true },
    unflirty: { auto: { romance: 0.1 }, take: { romance: -0.4 } },
    hopelessRomantic: { auto: { romance: 2, sweet_talk: 2, slow_dance: 2 }, take: { romance: 0.1 } },
    greatKisser: { auto: { kiss: 2, make_out: 2 }, give: { kiss: 0.25, make_out: 0.25, cheek_kiss: 0.25, first_kiss: 0.25 } },
    commitmentIssues: { auto: { romance: 0.8 }, take: { go_steady: -0.25, propose: -0.5 } },
    partyAnimal: { auto: { dance_together: 3, jokes: 1.3 } },
    goodTrait: { auto: { comfort: 4, cheer_up: 3, compliment: 2, mean: 0 }, take: { friendly: 0.05 } },
    familyOriented: { auto: { talk_family: 3, bedtime_story: 3, praise: 3, heart_talk: 2 } },
    childish: { auto: { pattycake: 3, tickle: 3, funny_face: 3, pillow_fight: 3 } },
    inappropriate: { auto: { tease: 1.5, blurt: 3, jokes: 1.5 } },
    schmoozer: { auto: { compliment: 2, schmooze: 3 }, give: { compliment: 0.2, schmooze: 0.2 } },
    excitable: { take: { jokes: 0.1, friendly: 0.05 } },
    easilyImpressed: { take: { jokes: 0.15, special: 0.1 } }
  };

  const NEEDS = {
    any: { test: () => true },
    new: { test: rel => !metOf(rel), hide: true },
    met: { test: rel => metOf(rel), why: 'Сначала надо познакомиться' },
    friend: { test: rel => !!rel && rel.v >= FRIEND, why: 'Вы пока не друзья' },
    good: { test: rel => !!rel && rel.v >= GOOD, why: 'Нужна крепкая дружба' },
    cold: { test: rel => metOf(rel) && rel.v <= COLD, hide: true },
    dislike: { test: rel => metOf(rel) && rel.v <= DISLIKE, hide: true },
    enemy: { test: rel => !!rel && rel.v <= ENEMY, why: 'Вы ещё не враги' },
    crush: { test: rel => !!rel && rel.v >= CRUSH, why: 'Вы мало знакомы' },
    romance: { test: rel => !!rel && !!(rel.f & (F.romance | LOVE)), why: 'Между вами пока нет романтики' },
    unkissed: { test: rel => !!rel && !!(rel.f & (F.romance | LOVE)) && !(rel.f & F.kissed), hide: true },
    couple: { test: rel => !!rel && !!(rel.f & LOVE), why: 'Сначала нужно стать парой' },
    engaged: { test: rel => !!rel && !!(rel.f & F.engaged), why: 'Сначала нужна помолвка' },
    spouse: { test: rel => !!rel && !!(rel.f & F.spouse), hide: true },
    partner: { test: rel => !!rel && !!(rel.f & (F.couple | F.engaged)) && !(rel.f & F.spouse), hide: true },
    sad: { test: (rel, a, b) => !!b.moods && S.Moods.mood(b) < 0, hide: true },
    kin: { test: (rel, a, b, world) => !!S.Rel.kinOf(world, a, b), hide: true }
  };

  const STATUS_WORDS = {
    stranger: ['Незнакомец', 'Незнакомка'], known: ['Знакомый', 'Знакомая'], distant: ['Давний знакомый', 'Давняя знакомая'],
    friend: ['Друг', 'Подруга'], goodFriend: ['Хороший друг', 'Хорошая подруга'], best: ['Лучший друг', 'Лучшая подруга'], oldFriend: ['Старый друг', 'Старая подруга'],
    dislike: ['Неприязнь', 'Неприязнь'], enemy: ['Враг', 'Враг'], oldEnemy: ['Старый враг', 'Старый враг'],
    romance: ['Романтический интерес', 'Романтический интерес'], couple: ['Парень', 'Девушка'], engaged: ['Жених', 'Невеста'], spouse: ['Муж', 'Жена'],
    ex: ['Бывший', 'Бывшая'], exSpouse: ['Бывший муж', 'Бывшая жена']
  };
  const KIN_WORDS = {
    parent: ['Отец', 'Мать'], child: ['Сын', 'Дочь'], sibling: ['Брат', 'Сестра'], grandparent: ['Дедушка', 'Бабушка'], grandchild: ['Внук', 'Внучка'],
    uncle: ['Дядя', 'Тётя'], nephew: ['Племянник', 'Племянница'], cousin: ['Двоюродный брат', 'Двоюродная сестра']
  };
  const STATUS_ORDER = ['spouse', 'engaged', 'couple', 'romance', 'best', 'oldFriend', 'goodFriend', 'friend', 'known', 'distant', 'ex', 'exSpouse', 'dislike', 'enemy', 'oldEnemy', 'stranger'];
  const STATUS_NEWS = {
    known: 'теперь знакомы', friend: 'теперь друзья', goodFriend: 'теперь хорошие друзья', best: 'теперь лучшие друзья', dislike: 'недолюбливают друг друга',
    enemy: 'теперь враги', oldEnemy: 'поклялись во вражде', romance: 'нравятся друг другу', couple: 'теперь пара', engaged: 'помолвлены', spouse: 'поженились',
    ex: 'расстались', exSpouse: 'развелись', reconcile: 'помирились'
  };
  const PHONE_WHY = {
    chat: 'Поболтать по телефону', invite: 'Пригласить в гости', date: 'Пригласить на свидание', walk: 'Позвать погулять', party: 'Устроить вечеринку',
    pizza: 'Заказать пиццу', maid: 'Нанять горничную', maidOff: 'Отказаться от горничной', repair: 'Вызвать мастера', nanny: 'Вызвать няню',
    nannyOff: 'Отказаться от няни', police: 'Вызвать полицию', fire: 'Вызвать пожарных', report: 'Заявить о краже'
  };

  const metOf = rel => !!rel && !!(rel.f & F.met);
  const rank = sim => S.AGE_RANK[sim.age];
  const now = world => world.day * DAY + world.clock;
  const ix = (world, sim) => (sim.ix !== undefined ? sim.ix : (sim.ix = world.sims.indexOf(sim)));
  const relKey = (a, b) => (a < b ? a * REL_KEY + b : b * REL_KEY + a);
  const has = (sim, id) => !!(S.Traits && S.Traits.has(sim, id));
  const moodOf = sim => (sim.moods ? S.Moods.mood(sim) : 20);
  const wordOf = (words, sim) => words[sim.sex === 'f' ? 1 : 0];
  const near = (a, b, d) => a.lot === b.lot && a.floor === b.floor && !a.inside && !b.inside && Math.hypot(a.x - b.x, a.z - b.z) <= d;
  const ownsReward = (sim, id) => !!(sim.rewards && sim.rewards.includes(id));

  const ALL = [];
  const SOCIALS = {};
  SECTIONS.forEach(section => {
    for (const [id, name, icon, clip, mins, need, age, win, lose, chance, extra] of ROWS[section.id]) {
      const row = Object.assign({ id, section: section.id, name, icon, clip, mins, need, age, win, lose, chance }, extra);
      ALL.push(row);
      SOCIALS[id] = row;
    }
  });

  const gainOf = row => {
    const out = {}, section = SECTIONS.find(s => s.id === row.section);
    for (const [need, rate] of Object.entries(section.gain)) out[need] = Math.round(rate * row.mins);
    if (row.fun) out.fun = (out.fun || 0) + Math.round(1.5 * row.mins);
    return out;
  };

  for (const row of ALL) {
    const ad = {
      id: row.id, person: true, soc: row, name: row.name, icon: row.icon, bubble: row.icon, age: row.age,
      steps: [{ talk: true, clip: row.clip, mins: row.mins, gain: gainOf(row), near: row.touch ? TOUCH_NEAR : row.far ? FAR_NEAR : TALK_NEAR }]
    };
    if (row.ageMax) ad.ageMax = row.ageMax;
    if (row.trait) ad.traits = [row.trait];
    S.ADS[row.id] = ad;
  }
  S.ADS.phone_call = {
    id: 'phone_call', name: 'Телефон', icon: 'phone', age: 'child', player: true, phone: true,
    steps: [{ here: true, clip: 'phone', mins: 12, gain: { social: 18 }, sound: 'ring' }]
  };
  S.ADS.bed_together = {
    id: 'bed_together', name: 'Близость', icon: 'heart', age: 'adult', player: true, mood: 'intimacy', bubble: 'heart', objs: ['bed'],
    steps: [{ pose: 'lie', clip: 'sleep', mins: 25, loop: 'snore', gain: { fun: 30, social: 30 }, end: 'chime' }]
  };

  const traitSum = (sim, key, row) => {
    let sum = 0;
    for (const id of (S.Traits ? S.Traits.of(sim) : [])) {
      const t = TRAIT_SOCIAL[id];
      if (!t || !t[key]) continue;
      const v = t[key][row.id] !== undefined ? t[key][row.id] : t[key][row.section];
      if (v !== undefined) sum += v;
    }
    return sum;
  };

  const traitProduct = (sim, key, row) => {
    let k = 1;
    for (const id of (S.Traits ? S.Traits.of(sim) : [])) {
      const t = TRAIT_SOCIAL[id];
      if (!t || !t[key]) continue;
      const v = t[key][row.id] !== undefined ? t[key][row.id] : t[key][row.section];
      if (v !== undefined) k *= v;
    }
    return k;
  };

  const traitFlag = (sim, key) => (S.Traits ? S.Traits.of(sim) : []).some(id => TRAIT_SOCIAL[id] && TRAIT_SOCIAL[id][key]);

  const listOf = (world, i) => {
    let list = world.relList.get(i);
    if (!list) world.relList.set(i, (list = []));
    return list;
  };

  const parentsOf = sim => sim.parents || [];

  const sharesParent = (world, x, y) => x !== y && parentsOf(x).some(p => parentsOf(y).includes(p));

  S.Rel = {
    F, FRIEND, GOOD, BEST_AT, DISLIKE, ENEMY, CRUSH, STATUS_WORDS, KIN_WORDS, STATUS_ORDER,

    reset(world) {
      world.rels = new Map();
      world.relList = new Map();
    },

    get(world, a, b) {
      return world.rels.get(relKey(ix(world, a), ix(world, b))) || null;
    },

    make(world, a, b) {
      const i = ix(world, a), j = ix(world, b), key = relKey(i, j);
      let rel = world.rels.get(key);
      if (!rel) {
        rel = { a: Math.min(i, j), b: Math.max(i, j), v: 0, f: 0, met: -1, last: -1, since: -1, by: -1 };
        world.rels.set(key, rel);
        listOf(world, rel.a).push(rel);
        listOf(world, rel.b).push(rel);
      }
      return rel;
    },

    value: (world, a, b) => {
      const rel = S.Rel.get(world, a, b);
      return rel ? rel.v : 0;
    },

    other: (world, rel, sim) => world.sims[rel.a === ix(world, sim) ? rel.b : rel.a],

    of: (world, sim) => world.relList.get(ix(world, sim)) || [],

    band: v => (v >= GOOD ? 'good' : v >= FRIEND ? 'friend' : v <= ENEMY ? 'enemy' : v <= DISLIKE ? 'dislike' : 'known'),

    statusOf(world, rel) {
      if (!metOf(rel)) return 'stranger';
      const f = rel.f, band = S.Rel.band(rel.v), old = rel.since >= 0 && world.day - rel.since >= OLD_DAYS;
      if (f & F.spouse) return 'spouse';
      if (f & F.engaged) return 'engaged';
      if (f & F.couple) return 'couple';
      if (f & F.romance) return 'romance';
      if (band === 'enemy') return f & F.oath || old ? 'oldEnemy' : 'enemy';
      if (band === 'dislike') return f & F.exSpouse ? 'exSpouse' : f & F.ex ? 'ex' : 'dislike';
      if (f & F.exSpouse) return 'exSpouse';
      if (f & F.ex) return 'ex';
      if (f & F.best && rel.v >= GOOD) return 'best';
      if (band === 'good') return old ? 'oldFriend' : 'goodFriend';
      if (band === 'friend') return old ? 'oldFriend' : 'friend';
      return f & F.distant ? 'distant' : 'known';
    },

    status(world, a, b) {
      const rel = S.Rel.get(world, a, b);
      return rel ? S.Rel.statusOf(world, rel) : 'stranger';
    },

    word(world, a, b) {
      return wordOf(STATUS_WORDS[S.Rel.status(world, a, b)], b);
    },

    kinOf(world, a, b) {
      if (a === b) return null;
      const ia = ix(world, a), ib = ix(world, b), pa = parentsOf(a), pb = parentsOf(b);
      if (pa.includes(ib)) return 'parent';
      if (pb.includes(ia)) return 'child';
      if (sharesParent(world, a, b)) return 'sibling';
      if (pa.some(p => parentsOf(world.sims[p]).includes(ib))) return 'grandparent';
      if (pb.some(p => parentsOf(world.sims[p]).includes(ia))) return 'grandchild';
      if (pa.some(p => sharesParent(world, world.sims[p], b))) return 'uncle';
      if (pb.some(p => sharesParent(world, world.sims[p], a))) return 'nephew';
      if (pa.some(p => pb.some(q => sharesParent(world, world.sims[p], world.sims[q])))) return 'cousin';
      return null;
    },

    kinWord(world, a, b) {
      const kin = S.Rel.kinOf(world, a, b);
      return kin ? wordOf(KIN_WORDS[kin], b) : '';
    },

    family(world, a, b) {
      const rel = S.Rel.get(world, a, b);
      return !!S.Rel.kinOf(world, a, b) || !!(rel && rel.f & F.spouse);
    },

    count(world, sim, test) {
      let n = 0;
      for (const rel of S.Rel.of(world, sim)) if (test(rel, S.Rel.statusOf(world, rel))) n++;
      return n;
    },

    friends(world, sim) {
      return S.Rel.count(world, sim, (rel, status) => ['friend', 'goodFriend', 'best', 'oldFriend'].includes(status) && !S.Rel.kinOf(world, sim, S.Rel.other(world, rel, sim)));
    },

    rows(world, sim) {
      const out = [], seen = new Set();
      for (const rel of S.Rel.of(world, sim)) {
        const other = S.Rel.other(world, rel, sim);
        if (!metOf(rel) && !S.Rel.kinOf(world, sim, other)) continue;
        seen.add(other);
        out.push(S.Rel.row(world, sim, other, rel));
      }
      for (const other of world.family) {
        if (other !== sim && !seen.has(other)) out.push(S.Rel.row(world, sim, other, null));
      }
      return out;
    },

    row(world, sim, other, rel) {
      const status = rel ? S.Rel.statusOf(world, rel) : 'stranger', kin = S.Rel.kinOf(world, sim, other);
      return { other, rel, v: rel ? rel.v : 0, status, word: wordOf(STATUS_WORDS[status], other), kin, kinWord: kin ? wordOf(KIN_WORDS[kin], other) : '', last: rel ? rel.last : -1 };
    },

    pack(world) {
      const out = [];
      for (const rel of world.rels.values()) out.push([rel.a, rel.b, rel.v, rel.f, rel.met, rel.last, rel.since, rel.by]);
      return out;
    },

    unpack(world, list) {
      if (!Array.isArray(list)) throw new Error('повреждены отношения');
      const n = world.sims.length, rels = [];
      for (const r of list) {
        if (!Array.isArray(r) || r.length !== 8 || !r.every(Number.isFinite) || r[0] < 0 || r[1] >= n || r[0] >= r[1]) throw new Error('повреждена запись отношений');
        rels.push(r);
      }
      return rels;
    },

    apply(world, rels) {
      S.Rel.reset(world);
      for (const [a, b, v, f, met, last, since, by] of rels) {
        const rel = { a, b, v, f, met, last, since, by };
        world.rels.set(relKey(a, b), rel);
        listOf(world, a).push(rel);
        listOf(world, b).push(rel);
      }
    }
  };

  const romanceOk = (world, a, b, row) => {
    if (S.Rel.kinOf(world, a, b)) return false;
    const ra = rank(a), rb = rank(b);
    if (ra < TEEN || rb < TEEN) return false;
    if (ra === TEEN || rb === TEEN) return ra === TEEN && rb === TEEN && (!row || row.romance === 'teen');
    return true;
  };

  const peerGroup = sim => rank(sim);

  const doubleBed = lot => lot.house.items.find(item => {
    const object = S.objectOf(item), kind = S.KINDS[S.KIND_ID[item.kind]];
    return object && kind && kind.model === 'bed';
  });

  const allowed = (world, a, b, row) => {
    if (a === b || !b) return { hide: true };
    if (row.job && !(a.job && a.job.id === row.job && a.job.level >= (row.jobLevel || 1))) return { hide: true };
    const ra = rank(a), rb = rank(b);
    if (ra < S.AGE_RANK[row.age] || (row.ageMax && ra > S.AGE_RANK[row.ageMax] && !has(a, 'childish'))) return { hide: true };
    if ((row.pmin && rb < S.AGE_RANK[row.pmin]) || (row.pmax && rb > S.AGE_RANK[row.pmax])) return { hide: true };
    if (row.section === 'mean' && rb < CHILD) return { hide: true };
    if (row.peer && peerGroup(a) !== peerGroup(b)) return { hide: true };
    if (row.romance && !romanceOk(world, a, b, row)) return { hide: true };
    if (row.trait && !has(a, row.trait) && !(row.jobAlt && a.job && a.job.id === row.jobAlt[0] && a.job.level >= row.jobAlt[1])) return { hide: true };
    if (row.skill && !(S.Skills && S.Skills.started(a, row.skill[0]))) return { hide: true };
    if (row.away && a.lot === a.home) return { hide: true };
    const rel = S.Rel.get(world, a, b), need = NEEDS[row.need];
    if (!need.test(rel, a, b, world)) return need.hide ? { hide: true } : { closed: need.why };
    if (row.min && (!rel || rel.v < row.min)) return { closed: 'Отношения пока слабоваты' };
    if (row.skill && S.Skills.level(a, row.skill[0]) < row.skill[1]) return { closed: 'Нужно ' + S.SKILLS[row.skill[0]].name.toLowerCase() + ' ' + row.skill[1] };
    if (row.stage && row.stage > NOW) return { closed: 'Заработает на этапе ' + row.stage };
    if (row.follow && b.needs) return { closed: row.follow === 'guest' ? 'Вы и так живёте вместе' : 'Вы живёте вместе, свидание не нужно' };
    if (row.follow && b.visit) return { closed: b.name + ' уже в гостях' };
    if (row.bed && !(b.needs && b.home === a.home)) return { closed: 'Только с тем, кто живёт в семье' };
    if (row.bed && !doubleBed(a.home)) return { closed: 'Нет двуспальной кровати' };
    if (row.party && world.party) return { closed: 'Праздник уже назначен' };
    if (row.set === 'couple' || row.set === 'engaged' || row.set === 'spouse' || row.party) {
      const taken = sim => S.Rel.of(world, sim).find(r => r !== rel && r.f & (row.set === 'couple' ? LOVE : F.engaged | F.spouse));
      const busy = taken(a) || taken(b);
      if (busy) return { closed: busy.f & F.spouse ? 'Сначала нужен развод' : busy.f & F.engaged ? 'Уже есть помолвка' : 'Сначала нужно расстаться' };
    }
    return {};
  };

  const chance = (world, a, b, row) => {
    if (row.chance >= 1) return 1;
    const rel = S.Rel.get(world, a, b), v = rel ? rel.v : 0;
    let c = row.chance;
    if (row.section === 'romance') c += (v - 30) / 150;
    else if (row.section !== 'mean') c += v / 250;
    c += (moodOf(a) - 20) / 400 + (moodOf(b) - 20) / 300;
    c += traitSum(a, 'give', row) + traitSum(b, 'take', row);
    if (row.share && has(b, row.share)) c += 0.3;
    if (row.section === 'friendly' && ownsReward(a, 'silentCharm')) c += 0.1;
    if (S.Skills && CHARM_SECTIONS.has(row.section)) c += S.Skills.level(a, 'charisma') * CHARM_STEP;
    if (S.Skills && row.need === 'new' && S.Skills.has(a, 'knowsAll')) c = 1;
    if (S.Skills && row.section === 'mean' && S.Skills.has(b, 'noEnemies')) c -= 0.2;
    if (S.Skills && row.fight) c += S.Skills.level(a, 'athletic') * 0.03 + (S.Skills.has(a, 'ironGrip') ? 0.2 : 0) - S.Skills.level(b, 'athletic') * 0.03;
    if (row.romance && S.Rel.of(world, b).some(r => r !== rel && r.f & LOVE)) c -= has(b, 'flirty') ? 0.1 : 0.3;
    if (moodOf(b) < -30 && (row.section === 'friendly' || row.section === 'jokes')) c -= 0.15;
    return S.clamp(c, 0.05, 0.95);
  };

  const knowsWell = (world, a, b) => {
    const rel = S.Rel.get(world, a, b);
    return S.Rel.family(world, a, b) || (!!rel && rel.v >= KNOWS_WELL);
  };

  const dotOf = p => (p >= 0.7 ? 'green' : p >= 0.4 ? 'gold' : 'red');

  const effectText = row => {
    const parts = [];
    if (row.set === 'met' || row.need === 'new') parts.push('знакомит');
    if (row.set === 'romance') parts.push('может начаться роман');
    if (row.set === 'couple') parts.push('делает парой');
    if (row.set === 'engaged') parts.push('помолвка');
    if (row.set === 'spouse') parts.push('свадьба сразу');
    if (row.set === 'best') parts.push('лучшие друзья');
    if (row.set === 'ex' || row.set === 'exSpouse') parts.push('конец отношений');
    if (row.set === 'oath') parts.push('вражда навсегда');
    if (row.set === 'makeUp') parts.push('ссора забыта');
    if (row.party) parts.push('свадьба через час, с гостями');
    if (row.follow === 'date') parts.push('свидание на три часа');
    if (row.follow === 'walk') parts.push('прогулка вдвоём');
    if (row.follow === 'guest') parts.push('гость пойдёт с вами');
    if (row.ask) parts.push('сим что-то узнает');
    if (row.bed) parts.push('за кадром, в спальне');
    if (!parts.length) parts.push(row.win > 0 ? 'отношения +' + Math.round(row.win * REL_GAIN) : row.win < 0 ? 'отношения −' + Math.abs(row.win) : 'отношения не меняются');
    return parts.join(', ');
  };

  S.Social = {
    SECTIONS, ROWS, ALL, SOCIALS, TRAIT_SOCIAL, F, NOW, PARTY_GUESTS, FAMILY_LIMIT, CHAT_MINS, PHONE_WHY,
    romanceOk, allowed, chance, knowsWell, now,

    seed(world) {
      S.Rel.reset(world);
      world.party = null;
      world.socialDay = world.day;
      world.sims.forEach((sim, i) => {
        sim.ix = i;
        if (sim.surname === undefined) sim.surname = '';
        if (sim.parents === undefined) sim.parents = null;
        sim.visit = null;
        sim.line = null;
        sim.replyIn = 0;
        sim.chatWith = -1;
        sim.chatLeft = 0;
        sim.chatLines = 0;
        sim.couples = sim.needs ? [] : null;
        sim.mingleIn = 0;
      });
      const byId = new Map(world.sims.map(s => [s.id, s]));
      for (const person of S.Sample.FAMILY) {
        const sim = byId.get(person.id);
        if (!sim) continue;
        sim.surname = person.surname || '';
        sim.parents = person.parents ? person.parents.map(id => ix(world, byId.get(id))) : null;
      }
      const family = world.family, t = now(world);
      for (let i = 0; i < family.length; i++) {
        for (let j = i + 1; j < family.length; j++) {
          const a = family[i], b = family[j], pa = S.Sample.FAMILY.find(p => p.id === a.id) || {}, pb = S.Sample.FAMILY.find(p => p.id === b.id) || {}, spouse = pa.spouse === b.id || pb.spouse === a.id;
          const kin = S.Rel.kinOf(world, a, b);
          if (!spouse && !kin) continue;
          const rel = S.Rel.make(world, a, b);
          rel.f = F.met | (spouse ? F.romance | F.couple | F.spouse | F.kissed : 0);
          rel.v = spouse ? 70 : kin === 'sibling' ? 45 : 60;
          rel.met = 1;
          rel.since = 1;
          rel.last = t;
          if (spouse) {
            a.couples.push(b.id);
            b.couples.push(a.id);
          }
        }
      }
    },

    menu(world, a, b) {
      const out = [], known = knowsWell(world, a, b);
      for (const section of SECTIONS) {
        const list = [];
        for (const row of ALL) {
          if (row.section !== section.id) continue;
          const rule = allowed(world, a, b, row);
          if (rule.hide) continue;
          const p = rule.closed ? 0 : chance(world, a, b, row);
          const option = { label: row.name, ad: row.id, with: b, closed: rule.closed || null, tip: { title: row.name, text: 'Что будет: ' + effectText(row) + '.', line: known && !rule.closed ? 'Шанс: ' + Math.round(p * 100) + '%' : '' } };
          if (known && !rule.closed) option.dot = dotOf(p);
          list.push(option);
        }
        if (!list.length) continue;
        list.sort((x, y) => (x.closed ? 1 : 0) - (y.closed ? 1 : 0));
        out.push({ label: section.name + '…', section: list, icon: section.icon });
      }
      return out;
    },

    contacts(world, sim, test) {
      const out = [];
      for (const rel of S.Rel.of(world, sim)) {
        if (!metOf(rel)) continue;
        const other = S.Rel.other(world, rel, sim);
        if (other.needs || !test(other, rel)) continue;
        out.push([other, rel]);
      }
      out.sort((x, y) => y[1].v - x[1].v || x[1].a - y[1].a || x[1].b - y[1].b);
      return out;
    },

    phoneMenu(world, sim) {
      if (rank(sim) < CHILD) return [];
      const out = [];
      const list = (kind, label, test, closedWhy) => {
        const contacts = S.Social.contacts(world, sim, test);
        const options = contacts.slice(0, 24).map(([other, rel]) => ({ label: other.name, phone: kind, with: other, closed: other.visit ? other.name + ' сейчас в гостях' : null, tip: { title: other.name, text: wordOf(STATUS_WORDS[S.Rel.statusOf(world, rel)], other) + ', отношения ' + Math.round(rel.v) } }));
        out.push(options.length ? { label: label + '…', section: options } : { label: label + '…', closed: closedWhy });
      };
      list('chat', 'Позвонить', () => true, 'Пока некому звонить: познакомьтесь с кем-нибудь');
      list('invite', 'Пригласить в гости', (o, rel) => rel.v >= 0, 'Пока некого звать');
      if (rank(sim) >= ADULT) {
        const plan = world.party;
        out.push({ label: 'Устроить вечеринку', phone: 'party', closed: plan ? 'Праздник уже назначен' : S.Social.contacts(world, sim, (o, rel) => rel.v >= 0).length ? null : 'Пока некого звать', tip: { title: 'Вечеринка', text: 'Гости придут через час, праздник продлится четыре часа. Музыка и еда поднимают оценку.' } });
        list('date', 'Пригласить на свидание', (o, rel) => romanceOk(world, sim, o, SOCIALS.ask_date) && !!(rel.f & (F.romance | LOVE)), 'Пока не с кем');
      } else if (rank(sim) === TEEN) {
        list('walk', 'Позвать погулять', (o, rel) => romanceOk(world, sim, o, SOCIALS.walk_together) && !!(rel.f & (F.romance | LOVE)) || (rank(o) === TEEN && rel.v >= FRIEND), 'Пока не с кем');
      }
      return out;
    },

    weight(world, a, b, row) {
      if (row.auto === 0 || row.stage > NOW) return 0;
      const rule = allowed(world, a, b, row);
      if (rule.hide || rule.closed) return 0;
      const section = SECTIONS.find(s => s.id === row.section), rel = S.Rel.get(world, a, b), v = rel ? rel.v : 0;
      let w = section.weight * traitProduct(a, 'auto', row) * (row.auto === undefined ? 1 : row.auto);
      if (row.section === 'mean') w *= v < 0 ? 1 + Math.min(-v, MEAN_CAP) / MEAN_CAP : traitProduct(a, 'auto', row) > 1 ? 0.8 : 0.3;
      else if (row.section === 'romance') {
        if (v < CRUSH && !traitFlag(a, 'strangers')) return 0;
        if (rel && rel.f & F.ex && v < GOOD) return 0;
        w *= traitFlag(a, 'strangers') ? Math.max(0.6, v / 50) : Math.max(0.2, v / 50);
      } else w *= v >= 0 ? 1 + v / 200 : Math.max(0.2, 1 + v / 60);
      if (row.need === 'new') w = Math.max(w * 3, has(a, 'loner') ? 0 : MEET_FLOOR);
      if (v <= ENEMY) w *= row.section === 'mean' ? ENEMY_SPITE : ENEMY_AVOID;
      if (row.end) w *= a.chatLeft > 0 && a.chatWith === ix(world, b) ? 0.3 : 0;
      w = Math.min(w, W_CAP);
      if (a.chatWith === ix(world, b) && a.chatLeft > 0) w *= CHAT_PULL * Math.pow(CHAT_TIRE, a.chatLines || 0);
      if (S.AGE_RANK[b.age] <= CHILD && has(a, 'dislikesChildren')) w *= 0.2;
      return w;
    },

    begin(world, a, b, act) {
      const row = SOCIALS[act.ad], section = SECTIONS.find(s => s.id === row.section);
      act.win = S.roll(world.rng) < S.Social.chance(world, a, b, row) ? 1 : 0;
      const react = act.win ? row.react || (row.touch ? row.clip : section.react) : row.miss || section.miss;
      act.react = react;
      if (row.sound) world.events.push({ type: 'sound', name: row.sound, x: a.x, z: a.z });
      if (row.kiss && act.win) world.events.push({ type: 'sound', name: 'kiss', x: a.x, z: a.z });
      b.yaw = Math.atan2(a.x - b.x, a.z - b.z);
      S.Acts.listen(world, b, a, row.mins, react);
    },

    listenGain(sim, act, dt) {
      const row = SOCIALS[act.ad];
      if (!row || row.section === 'mean') return;
      const k = S.Traits ? S.Traits.product(sim, 'social') : 1;
      sim.needs.social = S.clamp(sim.needs.social + LISTEN_SOCIAL * dt * k, 0, 100);
      if (row.section === 'jokes' || row.fun) sim.needs.fun = S.clamp(sim.needs.fun + LISTEN_FUN * dt, 0, 100);
    },

    talking(world, speaker, listener) {
      const i = ix(world, listener);
      return !!(speaker.act && !speaker.act.listen && speaker.act.with === i && speaker.act.phase === 'run') || !!(speaker.line && speaker.line.with === i);
    },

    lineDone(world, a, b, act) {
      const row = SOCIALS[act.ad];
      if (!row || !b) return;
      const win = !!act.win, rel = S.Rel.make(world, a, b), before = S.Rel.statusOf(world, rel), wasMet = metOf(rel), bandBefore = S.Rel.band(rel.v);
      rel.f = (rel.f | F.met) & ~F.distant;
      if (rel.met < 0) rel.met = world.day;
      rel.last = now(world);
      let dv = win ? row.win : row.lose;
      if (dv > 0) {
        dv *= REL_GAIN * traitProduct(a, 'gain', row) * (row.section === 'friendly' && ownsReward(a, 'silentCharm') ? 1.5 : 1) * (1 - Math.max(0, rel.v) / SLOW_TOP) * (1 + (S.Skills ? S.Skills.level(a, 'charisma') : 0) * CHARM_GAIN);
        if (row.share && has(b, row.share) && win) dv *= 2;
      } else if (dv < 0) dv *= traitProduct(b, 'hurt', row);
      rel.v = S.clamp(rel.v + dv, -100, 100);
      if (win && row.set) applySet(world, a, b, rel, row.set);
      const bandAfter = S.Rel.band(rel.v);
      if (bandAfter !== bandBefore) rel.since = world.day;
      if (rel.f & F.best && rel.v < GOOD - 10) rel.f &= ~F.best;
      const pair = win ? row.mood : row.sad;
      if (pair) {
        const fight = row.family && S.Rel.family(world, a, b);
        if (pair[0]) mood(world, a, fight ? row.family : pair[0], row, b);
        if (pair[1]) mood(world, b, fight ? row.family : pair[1] === 'laughed' && has(b, 'noHumor') ? 'awkward' : pair[1], row, a);
      }
      if (!wasMet) {
        mood(world, a, 'newAcquaintance');
        mood(world, b, 'newAcquaintance');
        bump(a, 'met');
        bump(b, 'met');
      }
      const after = S.Rel.statusOf(world, rel);
      if (after !== before) statusNews(world, a, b, before, after, row);
      if ((row.learn || row.ask === 'trait') && S.Traits) {
        S.Traits.learn(world, a, b);
        if (row.learn) S.Traits.learn(world, b, a);
      }
      if (win && row.ask) answer(world, a, b, row.ask);
      if (win && row.romance) jealousy(world, a, b);
      if (win && row.follow) S.Social.follow(world, a, b, row.follow);
      if (win && row.party) S.Social.planParty(world, a, row.party, b);
      if (win && row.bed) bedTogether(world, a, b);
      if (row.fight) {
        for (const s of [a, b]) if (s.needs) s.needs.hygiene = Math.max(0, s.needs.hygiene - 10);
        world.events.push({ type: 'rel', sim: a.id, text: a.name + ' и ' + b.name + ' подрались. ' + (win ? a.name : b.name) + ' берёт верх.' });
      }
      const i = ix(world, a), j = ix(world, b);
      a.chatLines = a.chatWith === j && a.chatLeft > 0 ? (a.chatLines || 0) + 1 : 1;
      b.chatLines = b.chatWith === i && b.chatLeft > 0 ? (b.chatLines || 0) + 1 : 1;
      a.chatWith = j;
      b.chatWith = i;
      a.chatLeft = b.chatLeft = row.end ? 0 : CHAT_MINS;
      if (!b.needs && b.live && !row.end && !b.line) {
        const want = 0.5 + (has(b, 'friendly') ? 0.2 : 0) - (has(b, 'loner') ? 0.25 : 0) + (rel.v < 0 && !has(b, 'meanSpirited') && !has(b, 'hotHeaded') ? -0.3 : 0);
        if (S.roll(world.rng) < want) b.replyIn = REPLY_MIN + S.roll(world.rng) * REPLY_SPREAD;
      }
      if (win) countVisit(world, a, b, row);
      if (a.wish) S.Wishes.socDone(world, a, row, b, win, 'by');
      if (b.wish) S.Wishes.socDone(world, b, row, a, win, 'to');
      refresh(world, a);
      refresh(world, b);
      S.Traits.bubble(b, win ? (row.section === 'mean' ? 'cloud' : row.section === 'romance' ? 'heart' : row.section === 'jokes' ? 'toy' : 'talk') : 'cloud');
    },

    follow(world, host, guest, kind) {
      const t = now(world), mins = kind === 'date' ? DATE_MINS : kind === 'walk' ? WALK_MINS : GUEST_MINS;
      guest.visit = { kind, host: ix(world, host), lot: host.home.index, from: t, until: t + mins, sent: 1, follow: 1, wins: 0, came: 1 };
      if (kind === 'guest') bump(host, 'invites');
      world.events.push({ type: 'rel', sim: host.id, text: guest.name + (kind === 'date' ? ': свидание началось' : kind === 'walk' ? ': гуляем вместе' : ': идём в гости') });
    },

    invite(world, host, guest, kind, delay, mins) {
      const t = now(world), from = t + delay;
      guest.visit = { kind, host: ix(world, host), lot: host.home.index, from, until: from + mins, sent: 0, follow: 0, wins: 0, came: 0 };
    },

    accepts(world, host, guest, at, always) {
      if (always) return true;
      const rel = S.Rel.get(world, host, guest), v = rel ? rel.v : 0;
      if (guest.visit || guest.duty) return false;
      if (guest.day && rank(guest) >= CHILD) {
        const minute = ((at % DAY) + DAY) % DAY, plan = S.Town.planOf(guest, Math.floor(at / DAY)), place = plan[S.Town.dayIndexAt(plan, minute)][1];
        if (place && place.kind === 'work' && !has(guest, 'partyAnimal')) return false;
      }
      return S.roll(world.rng) < 0.55 + v / 200;
    },

    phoneDone(world, sim, act) {
      const kind = act.phone, other = act.with >= 0 ? world.sims[act.with] : null, t = now(world);
      if (S.Services.PHONE[kind]) {
        S.Services.call(world, sim, kind);
        return;
      }
      if (kind === 'party') {
        S.Social.planParty(world, sim, 'party', null);
        return;
      }
      if (!other) return;
      const rel = S.Rel.make(world, sim, other);
      rel.last = t;
      rel.f = (rel.f | F.met) & ~F.distant;
      if (kind === 'chat') {
        const win = S.roll(world.rng) < chance(world, sim, other, SOCIALS.sim_chat);
        rel.v = S.clamp(rel.v + (win ? 4 : -1), -100, 100);
        world.events.push({ type: 'rel', sim: sim.id, text: sim.name + ' и ' + other.name + (win ? ': хороший разговор по телефону' : ': разговор по телефону не клеился') });
        bump(sim, 'calls');
        if (win) mood(world, sim, 'niceChat');
        refresh(world, sim);
        return;
      }
      if (!S.Social.accepts(world, sim, other, t + VISIT_DELAY, false)) {
        world.events.push({ type: 'rel', sim: sim.id, text: other.name + ' не может прийти' });
        return;
      }
      const mins = kind === 'date' ? DATE_MINS : kind === 'walk' ? WALK_MINS : GUEST_MINS;
      S.Social.invite(world, sim, other, kind, VISIT_DELAY, mins);
      world.events.push({ type: 'rel', sim: sim.id, text: other.name + ' придёт ' + clockText(t + VISIT_DELAY) + (kind === 'date' ? ' на свидание' : kind === 'walk' ? ' погулять' : ' в гости') });
      if (kind !== 'date') bump(sim, 'invites');
    },

    planParty(world, host, kind, partner) {
      if (world.party) return false;
      const t = now(world), start = t + PARTY_DELAY, mins = kind === 'wedding' ? WEDDING_MINS : PARTY_MINS, always = ownsReward(host, 'partyHost');
      const guests = [];
      for (const [other, rel] of S.Social.contacts(world, host, (o, r) => r.v >= 0 && o !== partner)) {
        if (guests.length >= PARTY_GUESTS) break;
        if (S.Social.accepts(world, host, other, start, always)) guests.push(other);
        else if (rel.v > FRIEND) world.events.push({ type: 'rel', sim: host.id, text: other.name + ' не сможет прийти' });
      }
      if (partner && !partner.needs && !partner.visit) guests.push(partner);
      if (!guests.length && kind === 'party') {
        world.events.push({ type: 'rel', sim: host.id, text: 'Никто не смог прийти, вечеринка отменена' });
        return false;
      }
      for (const guest of guests) {
        guest.visit = { kind, host: ix(world, host), lot: host.home.index, from: start - 20, until: start + mins, sent: 0, follow: 0, wins: 0, came: 0 };
      }
      world.party = { kind, host: ix(world, host), lot: host.home.index, start, end: start + mins, guests: guests.map(g => ix(world, g)), on: 0, wins: 0, music: 0, food: 0, grill: 0, couple: partner ? [ix(world, host), ix(world, partner)] : null };
      world.events.push({ type: 'party', sim: host.id, text: (kind === 'wedding' ? 'Свадьба' : 'Вечеринка') + ' начнётся ' + clockText(start) + ', гостей: ' + guests.length });
      if (kind === 'party') bump(host, 'parties');
      return true;
    },

    join(world, sim, quiet) {
      if (world.family.includes(sim) || world.family.length >= FAMILY_LIMIT) return false;
      const home = world.family[0].home;
      Object.assign(sim, {
        townHome: sim.home, townDay: sim.day, townRest: sim.rest,
        free: false, home, day: null, rest: null, dayIndex: -1, visit: null, hold: 0, holdClip: null, line: null, replyIn: 0, act: null, queue: [], thinkLeft: 0,
        needs: S.Acts.newNeeds(), moods: [], held: [], knows: {}, wish: S.Wishes.fresh(), happy: 0, dream: null, rewards: [], skill: S.Skills.fresh(), bag: sim.bag || [], novel: null, couples: sim.couples || []
      });
      world.family.push(sim);
      S.Jobs.adopt(world, sim);
      if (!sim.live) S.Sim.toLive(world, sim);
      world.live = world.sims.filter(s => s.live);
      if (quiet) return true;
      S.Moods.add(sim, 'newHome', 0, world);
      world.events.push({ type: 'rel', sim: sim.id, text: sim.name + ' теперь живёт с семьёй' });
      return true;
    },

    leave(world, sim) {
      if (!sim.townHome) return false;
      Object.assign(sim, {
        free: true, home: sim.townHome, day: sim.townDay, rest: sim.townRest || null, dayIndex: -1, needs: null, moods: null, held: [], knows: null, wish: null, happy: 0, dream: null, rewards: null, skill: null,
        act: null, queue: [], couples: null, townHome: null, townDay: null, townRest: null
      });
      S.Jobs.release(world, sim);
      world.family.splice(world.family.indexOf(sim), 1);
      return true;
    },

    restoreFamily(world, list) {
      const want = list ? list.map(i => world.sims[i]) : world.family.filter(s => !s.townHome);
      for (const sim of world.family.slice()) if (!want.includes(sim)) S.Social.leave(world, sim);
      for (const sim of want) if (!world.family.includes(sim)) S.Social.join(world, sim, true);
      world.family.sort((a, b) => want.indexOf(a) - want.indexOf(b));
    },

    grewUp(world, sim) {
      for (const rel of S.Rel.of(world, sim)) {
        const other = S.Rel.other(world, rel, sim);
        if (!(rel.f & (F.romance | LOVE))) continue;
        if (romanceOk(world, sim, other, { romance: 'adult' }) || romanceOk(world, sim, other, { romance: 'teen' })) continue;
        rel.f &= ~(F.romance | LOVE);
        rel.v = Math.max(rel.v, FRIEND);
        world.events.push({ type: 'rel', sim: sim.id, text: sim.name + ' и ' + other.name + ' теперь просто друзья' });
      }
    },

    heldMoods(world, sim) {
      const out = [], t = now(world);
      let love = false, longing = false, miss = false;
      for (const rel of S.Rel.of(world, sim)) {
        if (rel.last < 0) continue;
        const days = (t - rel.last) / DAY, other = S.Rel.other(world, rel, sim);
        if (rel.f & LOVE && rel.v >= LOVE_AT) {
          if (days < LONGING_DAYS || near(sim, other, SEEN)) love = true;
          else longing = true;
        } else if (rel.v >= GOOD && days >= MISS_DAYS && !S.Rel.kinOf(world, sim, other) && !near(sim, other, SEEN)) miss = true;
      }
      if (love) out.push('inLove');
      if (longing) out.push('longing');
      if (miss) out.push('missFriend');
      return out;
    },

    dreamProgress(world, sim, dream) {
      if (dream.id === 'heartBreaker') return [(sim.couples || []).length, 10];
      if (dream.id === 'everyoneFriend') return [S.Rel.friends(world, sim), 20];
      return null;
    },

    step(world, dt) {
      const t = now(world);
      if (world.socialDay !== world.day) {
        world.socialDay = world.day;
        daily(world, t);
      }
      for (const sim of world.sims) {
        if (sim.chatLeft > 0) {
          sim.chatLeft -= dt;
          if (sim.chatLeft <= 0) {
            sim.chatLeft = 0;
            sim.chatWith = -1;
            sim.chatLines = 0;
          }
        }
        if (sim.needs) continue;
        if (sim.bubbleLeft > 0) {
          sim.bubbleLeft -= dt;
          if (sim.bubbleLeft <= 0) sim.bubble = null;
        }
        if (sim.line) stepLine(world, sim, dt);
        else if (sim.replyIn > 0) {
          sim.replyIn -= dt;
          if (sim.replyIn <= 0) {
            sim.replyIn = 0;
            reply(world, sim);
          }
        } else if (sim.chatLeft > 0 && sim.chatWith >= 0 && sim.live) {
          const partner = world.sims[sim.chatWith];
          if (partner && near(sim, partner, NEAR_CHAT) && sim.hold < 1 && !sim.car) {
            sim.yaw = Math.atan2(partner.x - sim.x, partner.z - sim.z);
            S.Sim.hold(sim, 1, 'idle');
          }
        }
        if (sim.visit) stepVisit(world, sim, t, dt);
      }
      if (world.party) stepParty(world, t, dt);
    },

    packSim(sim) {
      const v = sim.visit;
      return [sim.surname || '', sim.parents, v && [v.kind, v.host, v.lot, v.from, v.until, v.sent, v.follow, v.wins, v.came], sim.line && [sim.line.ad, sim.line.with, sim.line.left, sim.line.win, sim.line.react], sim.replyIn || 0, sim.chatWith, sim.chatLeft || 0, sim.couples, sim.mingleIn || 0, sim.chatLines || 0];
    },

    unpackSim(world, r) {
      if (r === null) return null;
      if (!Array.isArray(r) || r.length !== 10) throw new Error('повреждена запись общения');
      const n = world.sims.length, okIndex = i => Number.isInteger(i) && i >= -1 && i < n;
      const [surname, parents, visit, line, replyIn, chatWith, chatLeft, couples, mingleIn, chatLines] = r;
      if (typeof surname !== 'string' || (parents !== null && !(Array.isArray(parents) && parents.every(p => okIndex(p) && p >= 0)))) throw new Error('повреждена родня');
      if (visit !== null && !(Array.isArray(visit) && visit.length === 9 && ['guest', 'party', 'wedding', 'date', 'walk'].includes(visit[0]) && okIndex(visit[1]) && world.lots[visit[2]])) throw new Error('повреждён визит');
      if (line !== null && !(Array.isArray(line) && line.length === 5 && SOCIALS[line[0]] && okIndex(line[1]))) throw new Error('неизвестная реплика в файле');
      if (!okIndex(chatWith) || ![replyIn, chatLeft, mingleIn, chatLines].every(Number.isFinite)) throw new Error('повреждён разговор');
      return {
        surname, parents,
        visit: visit && { kind: visit[0], host: visit[1], lot: visit[2], from: visit[3], until: visit[4], sent: visit[5], follow: visit[6], wins: visit[7], came: visit[8] },
        line: line && { ad: line[0], with: line[1], left: line[2], win: line[3], react: line[4] },
        replyIn, chatWith, chatLeft, couples: Array.isArray(couples) ? couples.slice() : null, mingleIn, chatLines
      };
    },

    packParty(world) {
      const p = world.party;
      return p && [p.kind, p.host, p.lot, p.start, p.end, p.guests, p.on, p.wins, p.music, p.food, p.grill, p.couple];
    },

    unpackParty(world, r) {
      if (r === null || r === undefined) return null;
      if (!Array.isArray(r) || r.length !== 12 || !['party', 'wedding'].includes(r[0]) || !world.sims[r[1]] || !world.lots[r[2]] || !Array.isArray(r[5])) throw new Error('повреждён праздник');
      return { kind: r[0], host: r[1], lot: r[2], start: r[3], end: r[4], guests: r[5].slice(), on: r[6], wins: r[7], music: r[8], food: r[9], grill: r[10], couple: r[11] };
    }
  };

  const clockText = t => {
    const m = ((t % DAY) + DAY) % DAY, h = Math.floor(m / 60), mm = Math.floor(m % 60);
    return 'в ' + h + ':' + String(mm).padStart(2, '0');
  };

  const mood = (world, sim, id, row, other) => {
    if (!sim.moods || !id || !S.MOODLETS[id]) return;
    S.Moods.add(sim, id, 0, world);
    if (id === 'kiss' && other && has(other, 'greatKisser')) S.Moods.add(sim, 'kiss', S.MOODLETS.kiss.mins * 2, world);
  };

  const bump = (sim, key) => {
    if (!sim.wish) return;
    const memo = sim.wish.memo;
    memo.soc = memo.soc || {};
    memo.soc['#' + key] = (memo.soc['#' + key] || 0) + 1;
  };

  const refresh = (world, sim) => {
    if (!sim.wish) return;
    sim.wish.memo.friendsNow = S.Rel.friends(world, sim);
    if (S.Skills) S.Skills.socialStats(world, sim);
    S.Wishes.checkDream(world, sim);
  };

  const applySet = (world, a, b, rel, set) => {
    if (set === 'romance') rel.f |= F.romance;
    else if (set === 'couple') {
      rel.f |= F.romance | F.couple;
      rel.f &= ~(F.ex | F.exSpouse);
      for (const [x, y] of [[a, b], [b, a]]) if (x.couples && !x.couples.includes(y.id)) x.couples.push(y.id);
    } else if (set === 'engaged') {
      rel.f |= F.romance | F.couple | F.engaged;
      rel.by = ix(world, a);
    } else if (set === 'spouse') marry(world, rel, a, b);
    else if (set === 'ex') {
      rel.f = (rel.f & ~(F.romance | F.couple | F.engaged)) | F.ex;
    } else if (set === 'exSpouse') {
      rel.f = (rel.f & ~(F.romance | LOVE)) | F.exSpouse;
    } else if (set === 'best') rel.f |= F.best;
    else if (set === 'oath') rel.f |= F.oath;
    else if (set === 'kissed') rel.f |= F.kissed;
    else if (set === 'makeUp') {
      const enemies = rel.v <= ENEMY;
      if (rel.v < 0) rel.v = 0;
      rel.f &= ~F.oath;
      world.events.push({ type: 'rel', sim: a.id, text: a.name + ' и ' + b.name + ' ' + STATUS_NEWS.reconcile });
      for (const s of [a, b]) {
        bump(s, 'reconcile');
        if (enemies) bump(s, 'peace');
      }
    }
  };

  const marry = (world, rel, a, b) => {
    rel.f = (rel.f | F.romance | F.couple | F.spouse) & ~F.engaged;
    const proposer = rel.by >= 0 ? world.sims[rel.by] : a, other = proposer === a ? b : a;
    if (proposer.surname) other.surname = proposer.surname;
    for (const s of [a, b]) mood(world, s, 'honeymoon');
    const townie = !a.needs ? a : !b.needs ? b : null;
    if (townie) world.events.push({ type: 'join', sim: townie.id, index: ix(world, townie), with: ix(world, townie === a ? b : a), text: townie.name + ': переезд в семью?' });
  };

  const statusNews = (world, a, b, before, after, row) => {
    if (!a.needs && !b.needs) return;
    if (after === 'friend' && before !== 'goodFriend' && before !== 'best') {
      mood(world, a, 'newFriend');
      mood(world, b, 'newFriend');
      bump(a, 'friend');
      bump(b, 'friend');
    }
    if (after === 'best') {
      bump(a, 'best');
      bump(b, 'best');
    }
    if (after === 'spouse') {
      bump(a, 'spouse');
      bump(b, 'spouse');
    }
    if (after === 'couple') {
      bump(a, 'couple');
      bump(b, 'couple');
    }
    const key = after === 'oldEnemy' && row.set !== 'oath' ? 'enemy' : after;
    const news = STATUS_NEWS[key];
    if (news) world.events.push({ type: 'rel', sim: a.id, text: a.name + ' и ' + b.name + ' ' + news });
  };

  const answer = (world, a, b, kind) => {
    if (!a.needs) return;
    let text = null;
    if (kind === 'dream') {
      const dream = b.dream && S.DREAMS[b.dream.id];
      text = b.name + ': ' + (dream ? 'мечта всей жизни «' + S.Wishes.dreamName(dream.id, b.sex) + '»' : 'мечты пока нет');
    } else if (kind === 'job') {
      const work = S.Jobs.describe(world, b);
      text = b.name + ': ' + (work ? work.charAt(0).toLowerCase() + work.slice(1) : 'работы пока нет');
    } else if (kind === 'home') {
      text = b.name + ': дом отмечен на карте';
      world.events.push({ type: 'mark', sim: a.id, index: ix(world, b) });
    } else if (kind === 'family') {
      const mates = world.sims.filter(o => o !== b && o.home === b.home && o.free === b.free).map(o => o.name);
      text = b.name + ': ' + (mates.length ? 'соседи по дому: ' + mates.slice(0, 4).join(', ') : 'соседей по дому нет');
    } else if (kind === 'mood') {
      const worst = b.moods ? S.Moods.list(b).filter(e => e.def.value < 0)[0] : null;
      text = b.name + ': ' + (worst ? '«' + worst.def.name + '»' : 'ничего особенного');
    } else if (kind === 'single') {
      text = b.name + ': ' + (S.Rel.of(world, b).some(r => r.f & LOVE) ? 'сердце занято' : 'сердце свободно');
    }
    if (text) world.events.push({ type: 'ask', sim: a.id, text });
  };

  const jealousy = (world, a, b) => {
    for (const [cheat, other] of [[a, b], [b, a]]) {
      for (const rel of S.Rel.of(world, cheat)) {
        if (!(rel.f & LOVE)) continue;
        const partner = S.Rel.other(world, rel, cheat);
        if (partner === other || !partner.moods || !near(partner, cheat, SEEN)) continue;
        S.Moods.add(partner, 'jealous', 0, world);
        rel.v = S.clamp(rel.v - 15, -100, 100);
        const third = S.Rel.make(world, partner, other);
        third.f |= F.met;
        third.v = S.clamp(third.v - 15, -100, 100);
        world.events.push({ type: 'rel', sim: partner.id, text: partner.name + ' ревнует' });
      }
    }
  };

  const bedTogether = (world, a, b) => {
    const lot = a.home, bed = doubleBed(lot);
    if (!bed) return;
    for (const s of [a, b]) {
      if (!s.needs) continue;
      if (s.act && s !== a) S.Acts.dropCurrent(world, s);
      s.queue.unshift(S.Acts.adAct('bed_together', lot, bed));
    }
  };

  const countVisit = (world, a, b, row) => {
    for (const [guest, host] of [[a, b], [b, a]]) {
      const v = guest.visit;
      if (v && v.host === ix(world, host) && (row.section === 'romance' || row.section === 'friendly' || row.section === 'jokes')) v.wins++;
    }
    const party = world.party;
    if (party && party.on && (party.guests.includes(ix(world, a)) || party.guests.includes(ix(world, b)))) party.wins++;
  };

  const daily = (world, t) => {
    for (const rel of world.rels.values()) {
      if (rel.last < 0 || !metOf(rel)) continue;
      const a = world.sims[rel.a], b = world.sims[rel.b], days = (t - rel.last) / DAY, kin = !!S.Rel.kinOf(world, a, b) || !!(rel.f & F.spouse);
      const keep = ownsReward(a, 'eternalFriends') || ownsReward(b, 'eternalFriends'), slow = S.Skills && (S.Skills.has(a, 'manyFriends') || S.Skills.has(b, 'manyFriends')) ? 0.5 : 1;
      if (days >= DECAY_AFTER && !keep) {
        if (rel.v > 0) rel.v = Math.max(0, rel.v - (kin ? 0.5 : 1) * slow);
        else if (rel.v < 0 && !(rel.f & F.oath)) rel.v = Math.min(0, rel.v + 0.5);
      }
      if (days >= DISTANT_DAYS && rel.v >= FRIEND && !kin && !(rel.f & (LOVE | F.distant)) && !keep) {
        rel.v = rel.v >= GOOD ? GOOD - 1 : FRIEND - 1;
        rel.f |= F.distant;
        rel.since = world.day;
      }
    }
  };

  const reply = (world, sim) => {
    const partner = sim.chatWith >= 0 ? world.sims[sim.chatWith] : null;
    if (!partner || !sim.live || !near(sim, partner, NEAR_CHAT) || sim.car || sim.inside) return;
    if (partner.act && !partner.act.listen) return;
    const options = [];
    let sum = 0;
    for (const row of ALL) {
      if (row.need === 'new' || row.touch || row.follow || row.party || row.bed || row.set === 'ex' || row.set === 'exSpouse' || row.set === 'engaged' || row.set === 'spouse') continue;
      const w = S.Social.weight(world, sim, partner, row);
      if (w <= 0) continue;
      options.push([row, w]);
      sum += w;
    }
    if (!options.length) return;
    let pick = S.roll(world.rng) * sum, row = options[0][0];
    for (const [r, w] of options) {
      pick -= w;
      if (pick <= 0) {
        row = r;
        break;
      }
    }
    const act = { ad: row.id, with: ix(world, partner), left: row.mins, win: 0, react: null };
    S.Social.begin(world, sim, partner, act);
    sim.line = act;
    sim.yaw = Math.atan2(partner.x - sim.x, partner.z - sim.z);
    S.Sim.hold(sim, row.mins + 0.2, row.clip);
    S.Traits.bubble(sim, row.icon);
  };

  const stepLine = (world, sim, dt) => {
    const line = sim.line, partner = world.sims[line.with];
    line.left -= dt;
    if (line.left > 0) return;
    sim.line = null;
    if (partner && near(sim, partner, NEAR_CHAT + 1)) S.Social.lineDone(world, sim, partner, line);
  };

  const goalOnLot = (world, lot, rng) => {
    const nav = lot.nav;
    for (let i = 0; i < 16; i++) {
      const x = 1 + Math.floor(S.roll(rng) * (lot.w - 2)), z = 1 + Math.floor(S.roll(rng) * (lot.d - 2));
      if (nav.isFree(0, x, z)) return { x: lot.x + x + 0.5, z: lot.z + z + 0.5, floor: 0, lot, enter: null };
    }
    return { x: lot.doorOut[0], z: lot.doorOut[1], floor: 0, lot, enter: null };
  };

  const stepVisit = (world, sim, t, dt) => {
    const v = sim.visit, host = world.sims[v.host], lot = world.lots[v.lot];
    if (t >= v.until) {
      endVisit(world, sim);
      return;
    }
    if (v.follow) {
      if (!host || host.inside || host.car) return;
      if (v.kind === 'guest' && host.lot === lot && sim.lot === lot) {
        v.follow = 0;
        v.came = 1;
        return;
      }
      if (sim.hold > 0 || sim.line) return;
      if (!near(sim, host, FOLLOW_GAP) && !S.Sim.busy(sim)) S.Sim.go(world, sim, { x: host.x + 0.8, z: host.z + 0.6, floor: host.floor, lot: host.lot, car: false });
      return;
    }
    if (!v.sent) {
      if (t < v.from) return;
      v.sent = 1;
      S.Sim.go(world, sim, { x: lot.doorOut[0], z: lot.doorOut[1], floor: 0, lot, enter: null });
      return;
    }
    if (!v.came) {
      if (sim.lot === lot && !S.Sim.busy(sim)) {
        v.came = 1;
        if (v.kind !== 'party' && v.kind !== 'wedding') world.events.push({ type: 'visit', sim: host ? host.id : '', text: sim.name + ' на пороге' + (v.kind === 'date' ? ', свидание начинается' : '') });
        S.Sim.go(world, sim, goalOnLot(world, lot, world.rng));
      }
      return;
    }
    if (sim.hold > 0 || sim.line || S.Sim.busy(sim)) return;
    sim.mingleIn -= dt;
    if (sim.mingleIn > 0) return;
    sim.mingleIn = MINGLE_EVERY * (0.5 + S.roll(world.rng));
    const party = world.party, roll = S.roll(world.rng);
    if (party && party.on && (v.kind === 'party' || v.kind === 'wedding')) {
      const others = party.guests.map(i => world.sims[i]).filter(o => o !== sim && o.visit && o.visit.came && o.hold <= 0 && !o.line && !S.Sim.busy(o) && near(o, sim, 8));
      if (roll < 0.35 && others.length) {
        const o = others[Math.floor(S.roll(world.rng) * others.length)];
        for (const [x, y] of [[sim, o], [o, sim]]) {
          x.yaw = Math.atan2(y.x - x.x, y.z - x.z);
          S.Sim.hold(x, 8, 'talk');
        }
        const rel = S.Rel.make(world, sim, o);
        rel.f |= F.met;
        rel.v = S.clamp(rel.v + 2, -100, 100);
        rel.last = t;
        return;
      }
      if (roll < 0.65 && party.music > 0) {
        S.Sim.hold(sim, 12, 'dance');
        return;
      }
    }
    if (roll < 0.8) S.Sim.go(world, sim, goalOnLot(world, lot, world.rng));
  };

  const endVisit = (world, sim) => {
    const v = sim.visit, host = world.sims[v.host];
    sim.visit = null;
    sim.dayIndex = -1;
    if (!host) return;
    const rel = S.Rel.make(world, host, sim);
    rel.f |= F.met;
    rel.last = now(world);
    if (v.kind === 'date' || v.kind === 'walk') {
      const good = v.wins >= 3, bad = v.wins === 0;
      rel.v = S.clamp(rel.v + (good ? 8 : bad ? -10 : 3), -100, 100);
      if (v.kind === 'date') {
        mood(world, host, good ? 'goodDate' : bad ? 'badDate' : null);
        bump(host, 'dates');
      } else if (good) mood(world, host, 'walk');
      world.events.push({ type: 'rel', sim: host.id, text: (v.kind === 'date' ? 'Свидание ' : 'Прогулка ') + (good ? 'удалась' : bad ? 'не удалась' : 'прошла неплохо') + ': ' + host.name + ' и ' + sim.name });
    } else if (v.kind === 'guest') {
      if (v.came) {
        rel.v = S.clamp(rel.v + (v.wins >= 2 ? 5 : 1), -100, 100);
        bump(host, 'guests');
      }
      world.events.push({ type: 'rel', sim: host.id, text: sim.name + ' уходит домой' });
    }
    refresh(world, host);
  };

  const stepParty = (world, t, dt) => {
    const p = world.party;
    if (!p.on) {
      if (t < p.start) return;
      p.on = 1;
      world.events.push({ type: 'party', text: p.kind === 'wedding' ? 'Свадьба начинается' : 'Вечеринка начинается' });
      return;
    }
    const lot = world.lots[p.lot];
    for (const sim of world.family) {
      const act = sim.act;
      if (!act || act.phase !== 'run' || sim.lot !== lot) continue;
      if (act.ad === 'stereo_listen' || act.ad === 'dance_together' || act.ad === 'party_dance') p.music += dt;
      if (act.ad === 'cook_meal' || act.ad === 'grill_cook') p.food += dt;
      if (act.ad === 'grill_cook') p.grill = 1;
    }
    if (t >= p.end) finishParty(world);
  };

  const finishParty = (world) => {
    const p = world.party, host = world.sims[p.host], lot = world.lots[p.lot];
    world.party = null;
    const came = p.guests.filter(i => world.sims[i].visit && world.sims[i].visit.came).length;
    let score = 2 + Math.min(2, p.wins / 4) + Math.min(1, p.music / 60) + Math.min(1, p.food / 30) + moodOf(host) / 100;
    if (ownsReward(host, 'partyHost')) score += 1;
    if (has(host, 'partyAnimal')) score += 0.5;
    if (came < 2) score -= 1;
    const stars = S.clamp(Math.round(score), 1, 5);
    for (const sim of world.family) {
      if (sim.lot !== lot) continue;
      if (stars >= 4) mood(world, sim, 'greatParty');
      else if (stars <= 2 && sim === host) mood(world, sim, 'dullParty');
      if (p.grill) mood(world, sim, 'barbecue');
    }
    for (const i of p.guests) {
      const guest = world.sims[i];
      if (guest.visit && guest.visit.came) {
        const rel = S.Rel.make(world, host, guest);
        rel.f |= F.met;
        rel.v = S.clamp(rel.v + (stars - 3) * 4, -100, 100);
        rel.last = now(world);
      }
      if (guest.visit) endVisit(world, guest);
    }
    if (p.kind === 'wedding' && p.couple) {
      const a = world.sims[p.couple[0]], b = world.sims[p.couple[1]], rel = S.Rel.make(world, a, b);
      if (rel.f & F.engaged) {
        const before = S.Rel.statusOf(world, rel);
        marry(world, rel, a, b);
        for (const s of [a, b]) mood(world, s, 'wedding');
        statusNews(world, a, b, before, S.Rel.statusOf(world, rel), SOCIALS.marry_now);
      }
    }
    if (stars >= 4) bump(host, 'greatParty');
    world.events.push({ type: 'party', sim: host.id, text: (p.kind === 'wedding' ? 'Свадьба окончена' : 'Вечеринка окончена') + ': ' + stars + ' из 5', stars });
    refresh(world, host);
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
