(function (S) {
  'use strict';
  const OFFER_SLOTS = 3, PROMISE_SLOTS = 4, OFFER_LIFE = 240, OFFER_EVERY = 45, DREAM_BONUS = 1.5, DREAM_CHOICES = 5;
  const HAPPY_FROM = 50, HAPPY_TOP = 140, HAPPY_LOW_RATE = 5, HAPPY_HIGH_RATE = 40, HAPPY_TOP_RATE = 60;
  const STREAK_MOODS = ['wishDone', 'wishDone2', 'wishDone3'];
  const NOW = 16, LONG_SLEEP = 720;

  const GROUPS = [
    ['skills', 'Навыки'], ['traits', 'Черты'], ['work', 'Работа и школа'], ['places', 'Места и норы'], ['family', 'Семья и дети'],
    ['age', 'Возраст'], ['social', 'Общение и любовь'], ['things', 'Вещи и деньги'], ['trips', 'Поездки по городу'], ['daily', 'Повседневное']
  ];

  const ACT_TEXT = {
    easel_paint: ['Порисовать', 'Нарисовать три картины', 'paint'], book_read: ['Почитать книгу', 'Прочитать три книги', 'book'],
    computer_play: ['Поиграть на компьютере', 'Пройти три игры', 'keys'], computer_chat: ['Поболтать в сети', 'Три вечера в сети', 'keys'],
    chess_play: ['Сыграть партию в шахматы', 'Сыграть три партии', 'chess'], stereo_listen: ['Потанцевать под радио', 'Три танца под радио', 'music'],
    tv_watch: ['Посмотреть телевизор', 'Три передачи подряд', 'tv'], sofa_nap: ['Вздремнуть на диване', 'Три раза вздремнуть на диване', 'sleep'],
    punchbag_hit: ['Постучать по груше', 'Три тренировки на груше', 'punch'], exercise: ['Размяться', 'Размяться три раза', 'punch'],
    talk_self: ['Поговорить с собой', 'Три беседы с собой', 'question'], hum_tune: ['Напеть мелодию', 'Напеть три мелодии', 'music'],
    check_stove: ['Проверить плиту', 'Проверить плиту трижды', 'cook'], grumble: ['Поворчать вволю', 'Поворчать три раза', 'cloud'],
    daydream: ['Помечтать', 'Помечтать три раза', 'heart'], polish: ['Навести блеск', 'Навести блеск трижды', 'wash'],
    kick_trash: ['Пнуть урну', 'Пнуть урну три раза', 'punch'], sneak_snack: ['Стащить кусочек', 'Стащить три кусочка', 'eat'],
    tinker: ['Подкрутить технику', 'Подкрутить три вещи', 'skills'], water_bush: ['Полить кусты', 'Полить кусты три раза', 'tree'],
    count_money: ['Пересчитать сбережения', 'Пересчитать сбережения трижды', 'money'], work_home: ['Поработать из дома', 'Три смены дома', 'job'],
    pocket_thing: ['Прикарманить безделушку', 'Собрать три трофея', 'mask'], toybox_play: ['Поиграть с игрушками', 'Три игры с игрушками', 'toy'],
    mock_art: ['Высказать всё картине', 'Поругать картины трижды', 'paint'], crossword: ['Разгадать кроссворд', 'Три кроссворда', 'book'],
    veggie_snack: ['Погрызть морковку', 'Три морковки', 'eat'], tell_joke: ['Рассказать анекдот', 'Три анекдота', 'toy'],
    compliment: ['Сказать комплимент', 'Три комплимента', 'heart'], tease: ['Подколоть кого-нибудь', 'Подколоть троих', 'fire'],
    complain: ['Пожаловаться на жизнь', 'Пожаловаться трижды', 'cloud'], heart_talk: ['Поговорить по душам', 'Три разговора по душам', 'heart'],
    cook_meal: ['Приготовить обед', 'Приготовить три обеда', 'cook'], grill_cook: ['Пожарить мясо', 'Три раза у гриля', 'cook'],
    bath_take: ['Полежать в ванне', 'Три тёплые ванны', 'wash'], shower_take: ['Принять душ', 'Три раза в душ', 'wash'],
    sink_wash: ['Умыться', 'Умыться трижды', 'wash'], sim_chat: ['Поболтать с кем-нибудь', 'Три хороших разговора', 'talk']
  };
  const GO_TEXT = { walk: ['Прогуляться вокруг квартала', 'Три прогулки', 'tree'], jog: ['Пробежаться вокруг квартала', 'Три пробежки', 'walk'] };

  const PLACES = [
    ['park', 'Сходить в парк', 'tree', 300], ['beach', 'Погулять у моря', 'sun', 350], ['shop', 'Заглянуть в магазин', 'money', 250],
    ['office', 'Посмотреть на контору', 'job', 200], ['school', 'Дойти до школы', 'book', 200], ['plant', 'Сходить к складу', 'skills', 250]
  ];
  const FUTURE_PLACES = [
    ['Посидеть в бистро «Цедра»', 'eat'], ['Пообедать в закусочной «У Дока»', 'eat'], ['Сходить в театр «Бархат»', 'music'], ['Попасть на матч на стадионе', 'toy'],
    ['Выбрать книгу в «Переплёте»', 'book'], ['Провести день в спа', 'wash'], ['Побывать на экскурсии в Ратуше', 'job'], ['Посмотреть на базу морской авиации', 'bolt'],
    ['Сдать находку на станцию «Цитрус»', 'chance'], ['Заглянуть в склеп ночью', 'grave'], ['Почитать в городской библиотеке', 'book'], ['Позаниматься в «28 часах»', 'punch'],
    ['Поплавать в «Большой Лагуне»', 'wash'], ['Посмотреть картины в Институте искусства', 'paint'], ['Порыбачить на Причале рыбаков', 'fish'], ['Посидеть у Лесного родника', 'tree'],
    ['Увидеть Озеро Водопада', 'sun'], ['Пройтись по Саду Ормонда', 'tree'], ['Встретить закат на Мысе Чаек', 'heart'], ['Прогуляться по Тихим Рядам', 'grave'],
    ['Устроить пикник на Поле Лайма', 'sun'], ['Посидеть у фонтана в сквере', 'sun'], ['Покататься с горки в бассейне «Лайм»', 'toy'], ['Встретить рассвет на Северном пляже', 'sun'],
    ['Сходить в кино', 'tv'], ['Послушать симфонию', 'music'], ['Попасть на концерт', 'music'], ['Сходить на день города', 'star'], ['Поучаствовать в пикете у Ратуши', 'scroll'], ['Сфотографироваться у Ратуши', 'job']
  ];
  const SKILLS = [['athletic', 'спорту'], ['charisma', 'обаянию'], ['cooking', 'готовке'], ['fishing', 'рыбалке'], ['gardening', 'саду'], ['guitar', 'гитаре'], ['handiness', 'ремонту'], ['logic', 'логике'], ['painting', 'рисованию'], ['writing', 'письму']];
  const SKILL_EXTRA = [
    ['Пробежать километр', { kind: 'stat', key: 'jogTiles', n: 1000 }], ['Поднять штангу 20 раз', null, 23], ['Научиться новой шутке', { kind: 'skill', key: 'charisma', n: 1 }],
    ['Выучить новый рецепт', { kind: 'stat', key: 'recipesKnown', n: 1 }], ['Приготовить блюдо на отлично', { kind: 'count', key: 'fineDish' }], ['Поймать 10 рыб', { kind: 'count', key: 'fishCaught', n: 10, skill: 'fishing' }], ['Поймать редкую рыбу', { kind: 'count', key: 'rareFish', skill: 'fishing' }],
    ['Вырастить безупречный помидор', { kind: 'count', key: 'perfectTomato', skill: 'gardening' }], ['Собрать первый урожай', { kind: 'count', key: 'harvest', skill: 'gardening' }], ['Сыграть песню для семьи', { kind: 'count', key: 'songFamily', skill: 'guitar' }], ['Сыграть за чаевые', { kind: 'count', key: 'tips', skill: 'guitar' }], ['Починить сломанную вещь', { kind: 'count', key: 'fix' }],
    ['Улучшить технику', { kind: 'count', key: 'upgrade', skill: 'handiness' }], ['Решить задачу за деньги', { kind: 'act', key: 'solve_problems' }], ['Посмотреть в телескоп', null, 23], ['Продать картину', { kind: 'count', key: 'paintingSold', skill: 'painting' }], ['Нарисовать портрет', { kind: 'count', key: 'portrait', skill: 'painting' }],
    ['Дописать первый роман', { kind: 'count', key: 'novelDone', skill: 'writing' }], ['Получить гонорар за книгу', { kind: 'count', key: 'royalty', skill: 'writing' }], ['Выиграть турнир по шахматам', { kind: 'count', key: 'chessWins', n: 3 }]
  ];
  const SKILLS_NOW = new Set(['athletic', 'charisma', 'cooking', 'logic', 'fishing', 'gardening', 'guitar', 'handiness', 'painting', 'writing']);
  const CAREERS = [['business', 'бизнесе'], ['crime', 'преступном мире'], ['culinary', 'кулинарии'], ['journalism', 'журналистике'], ['police', 'полиции'], ['medical', 'медицине'], ['military', 'армии'], ['music', 'музыке'], ['politics', 'политике'], ['sports', 'спорте'], ['science', 'науке']];
  const SCHOOL = [
    ['Сделать уроки', { kind: 'count', key: 'homework' }, ['homework']], ['Учиться на отлично', { kind: 'grade', n: 80, abs: true }, ['grade']],
    ['Не опоздать к автобусу', { kind: 'count', key: 'onTime' }, ['school']], ['Подружиться с одноклассниками', { kind: 'mood', key: 'schoolFriends' }, ['school']],
    ['Получить хороший табель', { kind: 'mood', key: 'goodGrades' }, ['school']], ['Сделать уроки три раза', { kind: 'count', key: 'homework', n: 3 }, ['school']],
    ['Остаться после уроков на кружок', { kind: 'count', key: 'opp_sp_club', opp: 'sp_club' }, ['school']], ['Сдать проект по рисованию', { kind: 'count', key: 'opp_sp_project', opp: 'sp_project' }, ['school']]
  ];
  const FAMILY = [
    'Завести ребёнка', 'Узнать, кто родится', 'Собрать детскую', 'Покормить малыша', 'Научить малыша ходить', 'Научить малыша говорить', 'Почитать ребёнку сказку', 'Помочь с уроками',
    'Отпраздновать первый день рождения', 'Увидеть, как ребёнок пошёл в школу', 'Обнять каждого в семье', 'Поужинать всей семьёй', 'Сходить всей семьёй в парк', 'Усыновить ребёнка', 'Родить двойню',
    'Вырастить ребёнка до подростка', 'Порадоваться оценкам ребёнка', 'Пережить подростковый бунт', 'Дождаться внуков', 'Собрать семейный альбом', 'Устроить семейный праздник',
    'Выбрать имя для малыша', 'Успокоить плачущего малыша', 'Уложить малыша спать', 'Передать ребёнку любимое дело'
  ];
  const AGES = ['Отпраздновать свой день рождения', 'Испечь торт ко дню рождения', 'Загадать желание над свечами', 'Стать подростком', 'Повзрослеть', 'Дожить до пенсии', 'Дожить до правнуков', 'Встретить старость в своём доме', 'Пережить середину жизни без кризиса', 'Отметить юбилей свадьбы'];
  const SOCIAL_NEXT = [
    ['social_new_friend', 'Завести нового друга', 'relations', 500, { kind: 'count', key: 'friend' }, 'С друзьями город теплее.', 'child'],
    ['social_best_friend', 'Завести лучшего друга', 'star', 1200, { kind: 'count', key: 'best' }, 'Нужен человек, которому можно сказать всё.', 'child'],
    ['social_make_up', 'Помириться после ссоры', 'relations', 600, { kind: 'count', key: 'reconcile' }, 'Худой мир лучше доброй ссоры.', 'child'],
    ['social_invite', 'Пригласить друга в гости', 'home', 500, { kind: 'count', key: 'invites' }, 'Дома веселее, когда приходят гости.', 'child'],
    ['social_party', 'Устроить вечеринку', 'music', 900, { kind: 'count', key: 'parties' }, 'Пора позвать всех знакомых.', 'adult'],
    ['social_go_party', 'Сходить на вечеринку', 'music', 450, { kind: 'later' }, 'Говорят, у соседей будет весело.', 'child', 19],
    ['social_call', 'Позвонить другу', 'phone', 250, { kind: 'count', key: 'calls' }, 'Давно не слышали знакомый голос.', 'child'],
    ['social_flirt', 'Пофлиртовать', 'heart', 400, { kind: 'soc', key: 'flirt' }, 'Сердце просит лёгкости.', 'adult'],
    ['social_date', 'Сходить на свидание', 'heart', 800, { kind: 'count', key: 'dates' }, 'Хочется вечера только на двоих.', 'adult'],
    ['social_first_kiss', 'Первый поцелуй', 'heart', 900, { kind: 'mood', key: 'firstKiss' }, 'Говорят, его помнят всю жизнь.', 'teen'],
    ['social_love', 'Признаться в любви', 'heart', 900, { kind: 'soc', key: 'declare_love', win: true }, 'Молчать уже нет сил.', 'adult'],
    ['social_propose', 'Сделать предложение', 'ring', 1500, { kind: 'soc', key: 'propose', win: true }, 'Пора решиться.', 'adult'],
    ['social_wedding', 'Сыграть свадьбу', 'ring', 2000, { kind: 'count', key: 'spouse' }, 'Кольца, гости, торт.', 'adult'],
    ['social_honeymoon', 'Провести медовый месяц', 'heart', 1000, { kind: 'mood', key: 'honeymoon' }, 'Пару дней только вдвоём.', 'adult'],
    ['social_five_friends', 'Завести пять друзей', 'relations', 1500, { kind: 'friends', n: 5, abs: true }, 'Одного друга мало.', 'teen'],
    ['social_neighbors', 'Познакомиться с соседями', 'relations', 600, { kind: 'count', key: 'met', n: 3 }, 'Кто все эти люди за забором?', 'child'],
    ['social_dinner', 'Пригласить соседей на ужин', 'eat', 700, { kind: 'later' }, 'Хороший ужин сближает.', 'adult', 19],
    ['social_toast', 'Сказать тост на празднике', 'music', 450, { kind: 'later' }, 'Слова уже готовы.', 'teen', 19],
    ['social_life_of_party', 'Стать душой компании', 'music', 1500, { kind: 'count', key: 'greatParty' }, 'Хочется праздника, о котором будут говорить.', 'adult'],
    ['social_celebrity', 'Познакомиться со знаменитостью', 'star', 750, { kind: 'later' }, 'В городе живут люди с громкими именами.', 'child', 19],
    ['social_argue', 'Поссориться и не жалеть', 'fire', 300, { kind: 'soc', key: 'argue' }, 'Накипело.', 'teen'],
    ['social_rebuff', 'Отказать в свидании', 'heartBroken', 450, { kind: 'count', key: 'rebuff' }, 'Не всякое внимание приятно.', 'adult'],
    ['social_letter_answer', 'Ответить на письмо', 'scroll', 600, { kind: 'later' }, 'Письмо ждёт ответа.', 'child', 19],
    ['social_letter_old', 'Написать письмо старому другу', 'scroll', 750, { kind: 'later' }, 'Интересно, как там дела.', 'child', 19],
    ['social_enemy_peace', 'Помириться с врагом', 'relations', 1200, { kind: 'count', key: 'peace' }, 'Хватит вражды.', 'child'],
    ['social_fall_in_love', 'Влюбиться', 'heart', 700, { kind: 'mood', key: 'inLove' }, 'Хочется, чтобы сердце стучало чаще.', 'adult'],
    ['social_hold_hands', 'Пройтись за руку', 'heart', 500, { kind: 'soc', key: 'hold_hands', win: true }, 'Просто держаться за руки.', 'teen'],
    ['social_gift', 'Подарить подарок', 'rewards', 750, { kind: 'later' }, 'Хочется сделать приятное.', 'child', 23],
    ['social_comfort', 'Утешить друга', 'heart', 300, { kind: 'soc', key: 'comfort' }, 'Кому-то рядом плохо.', 'child'],
    ['social_hug', 'Обняться с другом', 'relations', 300, { kind: 'soc', key: 'hug_friend', win: true }, 'Объятия лечат.', 'toddler']
  ];
  const THINGS_LATER = [
    'Купить новую кровать', 'Купить телевизор побольше', 'Купить картину', 'Купить новый холодильник', 'Купить машину', 'Обставить детскую', 'Построить второй этаж', 'Перекрасить стены',
    'Посадить сад', 'Купить музыкальный центр', 'Купить компьютер получше', 'Повесить новые шторы', 'Купить камин', 'Скопить §10 000', 'Скопить §50 000', 'Заплатить все счета вовремя',
    'Получить наследство', 'Продать картину подороже', 'Найти кошелёк', 'Вложить деньги', 'Получить прибыль с вложения', 'Купить дом побольше', 'Переехать в новый дом', 'Купить телескоп',
    'Купить беговую дорожку', 'Купить гитару', 'Купить мольберт получше', 'Купить ванну с гидромассажем', 'Купить книжный шкаф', 'Завести сейф', 'Купить что-нибудь дорогое', 'Купить шахматы', 'Обновить кухню', 'Купить красивую лампу', 'Купить новый диван', 'Купить аквариум', 'Купить статую', 'Купить садовую мебель', 'Купить новый гриль'
  ];
  const THINGS_NOW = { 13: { kind: 'funds', n: 10000, abs: true }, 14: { kind: 'funds', n: 50000, abs: true }, 15: { kind: 'count', key: 'billsOnTime' }, 17: { kind: 'count', key: 'paintingBig', skill: 'painting' }, 18: { kind: 'count', key: 'wallet' } };
  const THINGS_STAGE = { 16: 18, 19: 19, 20: 19, 21: 27, 22: 27 };
  const DAILY = [
    ['daily_cook', 'Поесть домашнего', 'cook', 150, { kind: 'mood', key: 'homeMeal' }, 'Сытная еда с плиты поднимает настроение.'],
    ['daily_grill', 'Пожарить мясо на гриле', 'cook', 250, { kind: 'act', key: 'grill_cook' }, 'Летом гриль сам зовёт во двор.'],
    ['daily_rest', 'Хорошо выспаться', 'sleep', 200, { kind: 'mood', key: 'wellRested' }, 'Полный сон, и день пойдёт лучше.'],
    ['daily_shower', 'Принять душ', 'wash', 100, { kind: 'act', key: 'shower_take' }, 'Свежесть никому не мешала.'],
    ['daily_bath', 'Полежать в ванне', 'wash', 200, { kind: 'act', key: 'bath_take' }, 'Тёплая ванна после долгого дня.'],
    ['daily_tv', 'Посмотреть хорошую передачу', 'tv', 150, { kind: 'mood', key: 'goodShow' }, 'Вечером по телевизору что-то интересное.'],
    ['daily_dance', 'Потанцевать', 'music', 200, { kind: 'act', key: 'stereo_listen' }, 'Музыка сама просится погромче.'],
    ['daily_chat', 'Поболтать с кем-нибудь', 'talk', 150, { kind: 'act', key: 'sim_chat' }, 'День без разговора скучный.'],
    ['daily_family_dinner', 'Поужинать вместе с семьёй', 'relations', 400, { kind: 'mood', key: 'familyDinner' }, 'За одним столом веселее.'],
    ['daily_sunny', 'Побыть на солнце', 'sun', 150, { kind: 'mood', key: 'sunnyDay' }, 'Лето, а сим всё дома.'],
    ['daily_mood', 'Подняться до прекрасного настроения', 'star', 600, { kind: 'moodAt', key: 140 }, 'Чтобы всё сложилось как надо.'],
    ['daily_good_mood', 'Провести день в хорошем настроении', 'sun', 300, { kind: 'moodAt', key: 50 }, 'Хочется просто хорошего дня.'],
    ['daily_nap', 'Вздремнуть днём', 'sleep', 150, { kind: 'mood', key: 'napped' }, 'Полчаса сна среди дня творят чудеса.'],
    ['daily_snack', 'Перекусить ночью', 'eat', 150, { kind: 'mood', key: 'midnightSnack' }, 'Холодильник ночью особенно манит.'],
    ['daily_mail', 'Проверить почту', 'scroll', 100, { kind: 'act', key: 'mailbox_check' }, 'Вдруг пришло что-то хорошее.'],
    ['daily_wash_face', 'Умыться холодной водой', 'wash', 100, { kind: 'act', key: 'sink_wash' }, 'Чтобы голова стала ясной.'],
    ['daily_read', 'Почитать перед сном', 'book', 150, { kind: 'act', key: 'book_read' }, 'Пара страниц, и спится лучше.'],
    ['daily_game', 'Выиграть компьютерную игру', 'keys', 200, { kind: 'mood', key: 'gameWin' }, 'Последний уровень не даёт покоя.'],
    ['daily_paint', 'Нарисовать что-нибудь', 'paint', 200, { kind: 'act', key: 'easel_paint' }, 'Руки просят кисть.'],
    ['daily_chess', 'Сыграть в шахматы', 'chess', 200, { kind: 'act', key: 'chess_play' }, 'Партия для ума.'],
    ['daily_cozy', 'Посидеть в красивой комнате', 'home', 150, { kind: 'mood', key: 'niceRoom' }, 'В хорошей обстановке легче думать.'],
    ['daily_toys', 'Поиграть с игрушками', 'toy', 150, { kind: 'act', key: 'toybox_play' }, 'Кубики сами себя не построят.']
  ];
  const SOCIAL_NOW = [
    ['social_stranger', 'Поболтать с незнакомцем', 'talk', 400, { kind: 'stranger', n: 1 }, 'В городе полно людей, с которыми ещё не говорили.', 'teen'],
    ['social_strangers3', 'Поговорить с тремя горожанами', 'talk', 900, { kind: 'stranger', n: 3 }, 'Пора узнать, кто живёт по соседству.', 'teen'],
    ['social_learn', 'Узнать чужую черту', 'question', 350, { kind: 'learn', n: 1 }, 'Интересно, что за человек живёт через улицу.', 'child'],
    ['social_learn3', 'Узнать три чужие черты', 'question', 800, { kind: 'learn', n: 3 }, 'Чем больше знаешь о людях, тем проще с ними.', 'teen'],
    ['social_joke', 'Рассмешить кого-нибудь', 'toy', 300, { kind: 'act', key: 'tell_joke' }, 'Хорошая шутка просится наружу.', 'child'],
    ['social_kind', 'Сказать доброе слово', 'heart', 250, { kind: 'act', key: 'compliment' }, 'Кому-то сегодня нужна поддержка.', 'child'],
    ['social_family_talk', 'Поговорить по душам', 'heart', 300, { kind: 'act', key: 'heart_talk' }, 'Давно не говорили о важном.', 'child'],
    ['social_family3', 'Поболтать с тремя членами семьи', 'relations', 400, { kind: 'act', key: 'sim_chat', n: 3 }, 'В своей семье тоже стоит общаться.', 'toddler'],
    ['social_laughed', 'Посмеяться до слёз', 'toy', 300, { kind: 'mood', key: 'laughed' }, 'Смех продлевает жизнь.', 'child'],
    ['social_kind_deed', 'Сделать доброе дело', 'heart', 400, { kind: 'mood', key: 'kindDeed' }, 'Кому-то сейчас тяжело.', 'child']
  ];
  const TRIPS = [
    ['trip_walk_1km', 'Пройти километр пешком', 'walk', 300, { kind: 'walked', n: 100 }, 'Ноги просят движения.', 'child'],
    ['trip_walk_3km', 'Пройти три километра за день', 'walk', 700, { kind: 'walked', n: 300 }, 'Настоящая прогулка, а не до холодильника.', 'teen'],
    ['trip_drive', 'Прокатиться на машине по городу', 'car', 300, { kind: 'drove', n: 1 }, 'Машина без дела стоит у дома.', 'adult'],
    ['trip_three_places', 'Побывать в трёх местах города', 'chance', 900, { kind: 'placesDistinct', n: 3 }, 'Город большой, а видел сим немного.', 'teen'],
    ['trip_five_places', 'Обойти пять мест города', 'chance', 1500, { kind: 'placesDistinct', n: 5 }, 'Хочется знать город как свои пять пальцев.', 'teen'],
    ['trip_park_walk', 'Прогуляться до парка и обратно', 'tree', 400, { kind: 'place', key: 'park' }, 'Говорят, в парке хорошо по утрам.', 'child'],
    ['trip_sea', 'Дойти до моря', 'sun', 500, { kind: 'place', key: 'beach' }, 'Море совсем рядом, а сим его давно не видел.', 'child'],
    ['trip_walk_jog', 'Пробежаться вокруг квартала', 'walk', 300, { kind: 'go', key: 'jog' }, 'Свежий воздух и немного пульса.', 'child'],
    ['trip_stroll', 'Прогуляться вокруг квартала', 'tree', 250, { kind: 'go', key: 'walk' }, 'Просто пройтись и подумать.', 'child'],
    ['trip_neighbor', 'Познакомиться с соседом', 'relations', 400, { kind: 'stranger', n: 1 }, 'Рядом живут люди, а имён их никто не знает.', 'teen']
  ];

  const TRAIT_WISHES = [
    ['absentMinded', 'Вспомнить, куда делись ключи', { kind: 'count', key: 'foundKey', skill: 'fishing' }], ['artistic', 'Нарисовать шедевр', { kind: 'count', key: 'masterpiece', skill: 'painting' }], ['bookworm', 'Прочитать всю книжную полку', { kind: 'stat', key: 'books', n: 4, abs: true }],
    ['artHater', 'Убрать картину с глаз долой', null, 23], ['computerWhiz', 'Собрать компьютер мечты', { kind: 'count', key: 'upgrade_processor' }, 0, 'teen'], ['excitable', 'Испытать настоящий восторг', { kind: 'mood', key: 'thrilled' }],
    ['genius', 'Решить задачу, которую никто не решил', { kind: 'skill', key: 'logic', n: 5, abs: true }], ['greenThumb', 'Вырастить самый большой помидор', { kind: 'count', key: 'bigTomato', skill: 'gardening' }], ['handy', 'Починить всё в доме', { kind: 'count', key: 'fix', n: 3 }],
    ['eccentric', 'Устроить странный ужин', { kind: 'count', key: 'weirdDish' }, 0, 'teen'], ['naturalCook', 'Приготовить что-то новое', { kind: 'count', key: 'newDish' }, 0, 'teen'], ['neurotic', 'Спокойно проспать ночь', { kind: 'mood', key: 'wellRested' }],
    ['virtuoso', 'Сыграть на гитаре для всех', { kind: 'count', key: 'songAll', skill: 'guitar' }], ['athletic', 'Пробежать два километра', { kind: 'stat', key: 'jogTiles', n: 2000 }], ['brave', 'Поймать вора', { kind: 'count', key: 'catchThief' }, 0, 'teen'],
    ['clumsy', 'Пройти день и ни разу не упасть', { kind: 'quiet', key: 'stumble', mins: 1440 }], ['couchPotato', 'Пересмотреть все каналы', { kind: 'act', key: 'tv_watch', n: 5 }], ['coward', 'Пережить ночь без страха', null, 18],
    ['heavySleeper', 'Проспать двенадцать часов', { kind: 'count', key: 'longSleep' }], ['hydrophobic', 'Пережить купание', null, 19], ['lightSleeper', 'Выспаться в тишине', { kind: 'mood', key: 'wellRested' }],
    ['lucky', 'Найти что-нибудь ценное', { kind: 'mood', key: 'foundIt' }], ['neat', 'Навести идеальный порядок', { kind: 'count', key: 'chores', n: 5 }], ['shy', 'Помыться, когда никого нет', { kind: 'act', key: 'bath_take' }],
    ['slob', 'Неделю не убираться', { kind: 'quiet', key: 'chore', mins: 10080 }], ['unlucky', 'Пережить день без беды', { kind: 'quiet', key: 'badLuck', mins: 1440 }], ['charismatic', 'Очаровать незнакомца', { kind: 'stranger', n: 1 }],
    ['commitmentIssues', 'Сменить работу', { kind: 'count', key: 'jobChange' }, 0, 'adult', ['any']], ['dislikesChildren', 'Провести день без детей', null, 17], ['easilyImpressed', 'Удивиться чему-нибудь', { kind: 'mood', key: 'thrilled' }],
    ['flirty', 'Подмигнуть незнакомцу', { kind: 'soc', key: 'flirt', town: true }, 0, 'adult'], ['friendly', 'Помахать соседу', { kind: 'soc', key: 'wave', town: true }], ['goodHumor', 'Рассмешить незнакомца', { kind: 'soc', key: 'tell_joke', win: true, town: true }],
    ['greatKisser', 'Поцелуй, от которого кружится голова', { kind: 'soc', key: 'make_out', win: true }], ['grumpy', 'Высказать всё соседу', { kind: 'soc', key: 'tell_off' }, 0, 'teen'], ['hopelessRomantic', 'Погулять вдвоём на закате', { kind: 'soc', key: 'walk_together', win: true }],
    ['inappropriate', 'Ляпнуть неловкость при всех', { kind: 'soc', key: 'blurt' }], ['loner', 'Провести вечер в одиночестве', { kind: 'mood', key: 'aloneTime' }], ['loser', 'Хоть раз выиграть', { kind: 'mood', key: 'gameWin' }],
    ['meanSpirited', 'Разыграть соседа', { kind: 'soc', key: 'prank', win: true }], ['mooch', 'Пообедать за чужой счёт', null, 19], ['noHumor', 'Объяснить кому-нибудь шутку', { kind: 'soc', key: 'tell_joke' }],
    ['partyAnimal', 'Устроить вечеринку до утра', { kind: 'count', key: 'parties' }, 0, 'adult'], ['schmoozer', 'Понравиться начальнику', { kind: 'count', key: 'bossLiked' }, 0, 'teen', ['boss']], ['snob', 'Купить что-нибудь роскошное', null, 23],
    ['unflirty', 'Отшить ухажёра', { kind: 'count', key: 'rebuff' }, 0, 'adult'], ['ambitious', 'Получить повышение раньше срока', { kind: 'count', key: 'promotion' }, 0, 'teen', ['anyUp']], ['angler', 'Поймать рыбу размером с руку', { kind: 'count', key: 'armFish', skill: 'fishing' }],
    ['childish', 'Устроить бой подушками', { kind: 'soc', key: 'pillow_fight', win: true }], ['daredevil', 'Сделать что-нибудь безрассудное', { kind: 'count', key: 'daring' }, 0, 'teen'], ['evil', 'Насладиться чужой неудачей', { kind: 'mood', key: 'gloat' }],
    ['familyOriented', 'Собрать всю семью за столом', { kind: 'mood', key: 'familyDinner' }], ['frugal', 'Найти скидку', { kind: 'count', key: 'coupon' }], ['goodTrait', 'Помочь соседу', { kind: 'soc', key: 'cheer_up', town: true }],
    ['agoraphobic', 'Целый день не выходить из дома', null, 19], ['hotHeaded', 'Остыть после ссоры', { kind: 'soc', key: 'apologize' }], ['kleptomaniac', 'Унести что-нибудь из гостей', null, 32],
    ['natureLover', 'Встретить рассвет на улице', null, 19], ['tearful', 'Поплакать над хорошим фильмом', { kind: 'mood', key: 'cried' }], ['perfectionist', 'Сделать что-то безупречно', { kind: 'mood', key: 'flawless' }],
    ['technophobe', 'Неделю не включать компьютер', { kind: 'quiet', key: 'computer', mins: 10080 }], ['vegetarian', 'Найти новый овощной рецепт', { kind: 'count', key: 'vegRecipe' }, 0, 'teen'], ['workaholic', 'Поработать в выходной', { kind: 'count', key: 'weekendWork' }, 0, 'teen', ['home']]
  ];

  const DREAMS = [
    ['astronaut', 'Из Лайм-Харбора на орбиту', '10 ступень армии', 30000, ['athletic', 'brave', 'daredevil', 'handy'], 15],
    ['madScientist', ['Безумный учёный на зарплате', 'Безумная учёная на зарплате'], '9 ступень науки', 29000, ['genius', 'greenThumb', 'handy', 'eccentric'], 15],
    ['heistKing', ['Король ограблений', 'Королева ограблений'], 'Вор, 10 ступень преступной ветви', 32500, ['kleptomaniac', 'athletic', 'daredevil'], 15],
    ['stadiumLegend', 'Легенда стадиона', '9 ступень спорта', 29000, ['athletic', 'daredevil', 'partyAnimal'], 15],
    ['fearedChef', 'Шеф, которого боятся', '10 ступень кулинарии', 30000, ['naturalCook', 'greenThumb'], 15],
    ['bigBoss', ['Самый главный начальник', 'Самая главная начальница'], '10 ступень бизнеса', 27500, ['ambitious', 'charismatic', 'workaholic', 'schmoozer'], 15],
    ['grandmaster', 'Гроссмейстер', 'Логика 10 и высший разряд шахмат', 30000, ['genius', 'computerWhiz'], 13],
    ['forensics', 'Глава криминалистики', 'Следственная ветвь полиции, 10 ступень', 30000, ['genius', 'computerWhiz', 'goodTrait'], 15],
    ['prenup', 'Брачный договор', 'Пережить богатого супруга и увидеть его призрак', 20000, ['mooch', 'evil', 'flirty'], 18],
    ['goldenTongue', 'Золотой язык, золотые пальцы', 'Обаяние 10 и гитара 10', 30000, ['charismatic', 'virtuoso', 'hopelessRomantic'], 14],
    ['heartBreaker', ['Разбиватель сердец', 'Разбивательница сердец'], 'Быть парой с 10 разными людьми', 35000, ['flirty', 'commitmentIssues', 'meanSpirited'], 12],
    ['symphony', 'Симфония навсегда', 'Симфоническая ветвь музыки, 10 ступень', 30000, ['virtuoso', 'artistic', 'genius'], 15],
    ['storyPainter', 'Рассказчик и живописец', 'Письмо 10 и рисование 10', 30000, ['artistic', 'bookworm'], 14],
    ['faceless', 'Агент без лица', 'Оперативная ветвь полиции, 10 ступень', 30000, ['athletic', 'brave', 'goodTrait'], 15],
    ['triedAll', ['Попробовал всё', 'Попробовала всё'], '5 ступень в 4 разных карьерах', 35000, ['childish', 'commitmentIssues', 'workaholic'], 15],
    ['mayor', 'Мэр Лайм-Харбора и не только', '10 ступень политики', 30000, ['charismatic', 'ambitious', 'schmoozer'], 15],
    ['museumHome', 'Дом как музей', 'Состояние семьи 100 000', 32500, ['ambitious', 'snob', 'mooch'], 16],
    ['guitarPainter', ['Художник с гитарой', 'Художница с гитарой'], 'Рисование 10 и гитара 10', 30000, ['artistic', 'virtuoso'], 14],
    ['headAndLegs', 'Голова и ноги', 'Логика 10 и спорт 10', 30000, ['athletic', 'genius', 'perfectionist'], 13],
    ['fishCollection', 'Лучшая рыбная коллекция', '13 видов безупречной рыбы в аквариумах', 32500, ['angler', 'perfectionist', 'natureLover'], 14],
    ['royalties', 'Живёт на роялти', '4 000 в неделю от книг', 32500, ['bookworm', 'artistic', 'couchPotato'], 14],
    ['knowItAll', 'Всезнайка', '10 уровень в 3 навыках', 35000, ['genius', 'workaholic'], 13],
    ['stadiumRock', 'Рок на стадионе', 'Рок-ветвь музыки, 10 ступень', 30000, ['artistic', 'virtuoso', 'partyAnimal'], 15],
    ['newsFace', 'Лицо вечерних новостей', '10 ступень журналистики', 30000, ['charismatic', 'bookworm', 'friendly'], 15],
    ['everyoneFriend', ['Всем друг', 'Всем подруга'], '20 друзей', 30000, ['friendly', 'charismatic', 'partyAnimal'], 12],
    ['bigFamily', 'Большая семья', 'Вырастить 5 детей от младенца до подростка', 35000, ['familyOriented', 'goodTrait'], 17],
    ['ormondSafe', 'Как у Ормонда в сейфе', '50 000 наличными', 35000, ['frugal', 'ambitious'], 16],
    ['cookbook', 'Городская кулинарная книга', 'Выучить все рецепты', 30000, ['naturalCook', 'vegetarian'], 13],
    ['basementLord', ['Властелин подвала', 'Властительница подвала'], 'Злая ветвь преступников, 10 ступень', 32500, ['evil', 'ambitious', 'meanSpirited'], 15],
    ['perfectGarden', 'Безупречный огород', '8 видов безупречных растений', 32500, ['greenThumb', 'perfectionist', 'natureLover'], 14],
    ['masterMechanic', 'Мастер и механик', 'Ремонт 10 и логика 10', 30000, ['handy', 'genius'], 14],
    ['knifePulse', 'Нож и пульс', '10 ступень медицины', 32500, ['genius', 'workaholic', 'goodTrait'], 15]
  ];
  const DREAM_ACTS = {
    grandmaster: ['chess_play'], goldenTongue: ['sim_chat', 'compliment'], storyPainter: ['easel_paint', 'write_novel'], guitarPainter: ['easel_paint', 'hum_tune'],
    headAndLegs: ['chess_play', 'punchbag_hit', 'exercise'], knowItAll: ['book_read', 'chess_play'], masterMechanic: ['tinker', 'chess_play'], fearedChef: ['cook_meal', 'grill_cook'],
    cookbook: ['cook_meal'], everyoneFriend: ['sim_chat', 'compliment', 'tell_joke', 'introduce'], heartBreaker: ['flirt', 'kiss', 'sweet_talk'], stadiumLegend: ['punchbag_hit', 'exercise'], astronaut: ['exercise', 'tinker'],
    royalties: ['write_novel'], perfectGarden: ['garden_water', 'garden_weed', 'garden_harvest'], fishCollection: ['fish_pond', 'tank_watch'], symphony: ['stereo_listen', 'hum_tune'], stadiumRock: ['stereo_listen', 'hum_tune']
  };

  const REWARDS = [
    ['fastTrade', 'Быстрый обмен', 5000, 'money', 'Продажа вещей без потерь.', 16], ['quickClean', 'Быстрая уборка', 5000, 'wash', 'Уборка вдвое быстрее.', 16],
    ['freeLunch', 'Бесплатный обед', 5000, 'eat', 'Раз в день обед в закусочной за счёт заведения.', 19], ['confidentSlacker', 'Уверенный бездельник', 5000, 'sleep', 'Безделье на работе не портит производительность.', 15],
    ['sharpEye', 'Цепкий глаз', 5000, 'chance', 'Находки на улице попадаются чаще.', 14], ['officeHero', 'Герой офиса', 5000, 'job', 'Коллеги относятся лучше с первого дня.', 15],
    ['partyHost', 'Хозяин вечеринки', 5000, 'music', 'Гости всегда приходят и уходят довольными.', 12], ['freeTheatre', 'Бесплатный театр', 5000, 'tv', 'Вход в театр и кино без денег.', 19],
    ['bookDiscount', 'Скидка в книжной', 10000, 'book', 'Книги и рецепты за полцены.', 19], ['fertile', 'Хорошая плодовитость', 10000, 'baby', 'Чаще двойни и тройни.', 17],
    ['chanceCatcher', 'Ловец возможностей', 10000, 'chance', 'Возможности приходят чаще и щедрее.', 16], ['doubleShift', 'Занят за двоих', 10000, 'job', 'Можно работать на двух работах.', 15],
    ['steelBladder', 'Стальной пузырь', 10000, 'toilet', 'В туалет хочется вдвое реже.', NOW], ['neverBored', 'Никогда не наскучит', 10000, 'toy', 'Скука подкрадывается вдвое медленнее.', NOW],
    ['changeDream', 'Сменить мечту', 10000, 'star', 'Можно выбрать новую мечту всей жизни.', NOW],
    ['silentCharm', 'Обаяние без слов', 15000, 'heart', 'Знакомые быстрее становятся друзьями.', 12], ['guiltFreeVacation', 'Отпуск без последствий', 15000, 'sun', 'Отгулы не портят карьеру.', 15],
    ['haggler', 'Мастер торга', 15000, 'money', 'Покупки на 10 процентов дешевле.', 23], ['fastLearner', 'Быстрый ученик', 15000, 'skills', 'Навыки растут быстрее.', 13],
    ['noDirt', 'Без грязи', 15000, 'wash', 'Гигиена почти не падает.', NOW],
    ['eternalFriends', 'Дружба не ржавеет', 20000, 'relations', 'Отношения не остывают со временем.', 12], ['midlifeCrisis', 'Кризис среднего возраста', 20000, 'question', 'Позволяет заново выбрать черты.', 21],
    ['greenHands', 'Зелёные руки', 20000, 'tree', 'Растения растут быстрее и не болеют.', 14],
    ['airDiet', 'Сыт от воздуха', 25000, 'eat', 'Голод больше не мучает.', NOW],
    ['bodySculptor', 'Лепщик тела', 30000, 'punch', 'Предмет: меняет фигуру за ночь. Иногда не туда.', 22], ['bestseller', 'Автор с успехом', 30000, 'book', 'Книги продаются лучше.', 14],
    ['moreCreative', 'Ещё творчества', 30000, 'paint', 'Картины и песни удаются чаще.', 14],
    ['collectorHelper', 'Помощник коллекционера', 40000, 'chance', 'Предмет: показывает находки на карте.', 14], ['mealCopier', 'Копир блюд', 50000, 'cook', 'Предмет: делает копию любого блюда.', 13],
    ['moodRemover', 'Убиратель настроения', 60000, 'cloud', 'Предмет: снимает плохие мудлеты. Иногда и хорошие.', NOW], ['teleport', 'Телепорт', 75000, 'bolt', 'Предмет: мгновенно переносит в любое место города.', 23]
  ];
  const REWARD_RATES = { steelBladder: { bladder: 0.5 }, neverBored: { fun: 0.5 }, noDirt: { hygiene: 0.25 }, airDiet: { hunger: 0 } };

  const build = () => {
    const out = {};
    const add = (id, group, name, icon, points, goal, why, extra) => {
      out[id] = Object.assign({ id, group, name, icon, points, goal, why, stage: NOW, age: 'toddler' }, extra || {});
    };
    for (const [id, name, icon, points, goal, why] of DAILY) add(id, 'daily', name, icon, points, goal, why);
    for (const [id, name, icon, points, goal, why, age] of SOCIAL_NOW) add(id, 'social', name, icon, points, goal, why, { age });
    for (const [id, name, icon, points, goal, why, age] of TRIPS) add(id, 'trips', name, icon, points, goal, why, { age });
    for (const [key, name, icon, points] of PLACES) add('place_' + key, 'places', name, icon, points, { kind: 'place', key }, 'Хочется выбраться из дома.', { age: 'child' });
    FUTURE_PLACES.forEach(([name, icon], i) => add('place_later_' + i, 'places', name, icon, 400 + (i % 4) * 100, { kind: 'later' }, 'Город манит своими местами.', { stage: i < 24 ? 19 : 28, age: 'child' }));
    for (const trait of Object.values(S.TRAITS)) {
      const acts = (trait.pastimes || []).concat(Object.entries(trait.likes).filter(([, f]) => f >= 2).map(([id]) => id));
      const seen = new Set();
      for (const act of acts) {
        if (seen.has(act)) continue;
        seen.add(act);
        const text = ACT_TEXT[act] || GO_TEXT[act];
        if (!text) continue;
        const goal = GO_TEXT[act] ? { kind: 'go', key: act } : { kind: 'act', key: act };
        const age = S.ADS[act] ? S.ADS[act].age : 'child';
        const why = 'Так подсказывает черта «' + trait.names[0] + '».';
        for (const [prefix, n, name, points] of [['t_', 1, text[0], 200], ['t3_', 3, text[1], 550]]) {
          const twin = Object.values(out).find(w => !w.traits && w.goal.kind === goal.kind && w.goal.key === goal.key && (w.goal.n || 1) === n);
          if (twin) {
            twin.likedBy = (twin.likedBy || []).concat([trait.id]);
            continue;
          }
          if (!out[prefix + act]) add(prefix + act, 'traits', name, text[2], points, n > 1 ? Object.assign({ n }, goal) : goal, why, { traits: [trait.id], age });
          else out[prefix + act].traits.push(trait.id);
        }
      }
    }
    for (const id of Object.keys(out)) {
      if (out[id].traits && out[id].traits.length > 1) out[id].why = 'Так подсказывают черты: ' + out[id].traits.map(t => '«' + S.TRAITS[t].names[0] + '»').join(', ') + '.';
    }
    for (const [trait, name, goal, stage, age, work] of TRAIT_WISHES) {
      const def = S.TRAITS[trait];
      add('trait_' + trait, 'traits', name, def.icon, goal ? 450 : 600, goal || { kind: 'later' }, 'Так подсказывает черта «' + def.names[0] + '».', { traits: [trait], stage: goal ? NOW : stage, age: age || def.age, work: work || null });
    }
    for (const [key, dative] of SKILLS) {
      const live = SKILLS_NOW.has(key), age = S.SKILLS[key].age, later = { kind: 'later' };
      const book = live && Object.values(S.SKILL_BOOKS).some(b => b.skill === key);
      add('skill_book_' + key, 'skills', 'Прочитать книгу по ' + dative, 'book', 250, book ? { kind: 'count', key: 'book_' + key } : later, 'С книгой учиться легче.', { stage: book ? NOW : 19, age });
      add('skill_start_' + key, 'skills', 'Начать учиться ' + dative, 'skills', 200, live ? { kind: 'skill', key, n: 1, abs: true } : later, 'Новое дело всегда манит.', { stage: live ? NOW : 14, age });
      for (const level of [3, 5, 7, 10]) add('skill_' + key + '_' + level, 'skills', 'Дойти до ' + level + ' уровня по ' + dative, 'skills', 200 + level * 120, live ? { kind: 'skill', key, n: level, abs: true } : later, 'Хочется уметь больше.', { stage: live ? NOW : 14, age });
    }
    SKILL_EXTRA.forEach(([name, goal, stage], i) => add('skill_extra_' + i, 'skills', name, 'skills', 500 + (i % 5) * 150, goal || { kind: 'later' }, 'Навык просит настоящего дела.', { stage: goal ? NOW : stage, age: 'child' }));
    for (const [key, where] of CAREERS) {
      add('job_' + key, 'work', 'Устроиться работать в ' + where, 'job', 400, { kind: 'count', key: 'job_' + key }, 'Своя работа, свои деньги.', { age: 'adult', work: ['seek', key] });
      add('job_' + key + '_pay', 'work', 'Получить первую зарплату в ' + where, 'money', 300, { kind: 'count', key: 'pay_' + key }, 'Первые свои деньги.', { age: 'adult', work: ['fresh', key] });
      add('job_' + key + '_up', 'work', 'Получить повышение в ' + where, 'job', 700, { kind: 'count', key: 'up_' + key }, 'Пора расти.', { age: 'adult', work: ['up', key] });
      add('job_' + key + '_5', 'work', 'Дойти до 5 ступени в ' + where, 'job', 1200, { kind: 'career', key, n: 5, abs: true }, 'Половина пути к вершине.', { age: 'adult', work: ['below', key, 5] });
      add('job_' + key + '_top', 'work', 'Подняться на вершину в ' + where, 'job', 2000, { kind: 'career', key, n: 10, abs: true }, 'Выше уже некуда.', { age: 'adult', work: ['below', key, 10, 5] });
    }
    add('job_part', 'work', 'Найти подработку', 'money', 350, { kind: 'count', key: 'partJob' }, 'Свои деньги на карманные расходы.', { age: 'teen', work: ['part'] });
    SCHOOL.forEach(([name, goal, work, stage], i) => add('school_' + i, 'work', name, 'book', 200 + (i % 3) * 100, goal || { kind: 'later' }, 'Школа ещё никого не обошла.', { stage: goal ? NOW : stage, age: 'child', work }));
    FAMILY.forEach((name, i) => add('family_' + i, 'family', name, 'baby', 400 + (i % 5) * 200, { kind: 'later' }, 'Семья растёт.', { stage: 17, age: 'teen' }));
    AGES.forEach((name, i) => add('age_' + i, 'age', name, 'rewards', 500 + (i % 3) * 250, { kind: 'later' }, 'Жизнь идёт своим чередом.', { stage: 17, age: 'child' }));
    for (const [id, name, icon, points, goal, why, age, stage] of SOCIAL_NEXT) add(id, 'social', name, icon, points, goal, why, { age, stage: stage || NOW });
    THINGS_LATER.forEach((name, i) => add('things_' + i, 'things', name, 'money', 300 + (i % 5) * 200, THINGS_NOW[i] || { kind: 'later' }, 'Дом должен быть удобным.', { stage: THINGS_NOW[i] ? NOW : THINGS_STAGE[i] || 23, age: 'teen' }));
    add('things_reward', 'things', 'Купить награду за счастье', 'rewards', 500, { kind: 'reward' }, 'Счастья накоплено, пора его потратить.', { age: 'child' });
    return out;
  };

  S.WISH_GROUPS = GROUPS.map(([id, name]) => ({ id, name }));
  S.WISHES = build();
  S.DREAMS = {};
  for (const [id, name, goal, points, traits, stage] of DREAMS) {
    const names = Array.isArray(name) ? name : [name, name];
    S.DREAMS[id] = { id, name: names[0], names, goal, points, traits, stage, acts: DREAM_ACTS[id] || [] };
  }
  S.REWARDS = {};
  for (const [id, name, price, icon, text, stage] of REWARDS) S.REWARDS[id] = { id, name, price, icon, text, stage, rates: REWARD_RATES[id] || null, item: /^Предмет/.test(text) };

  const fresh = () => ({ offered: [], promised: [], memo: { acts: {}, go: {}, moods: {}, places: {}, learned: 0, strangers: 0, walked: 0, drove: 0, moodTop: 0, soc: {}, friendsNow: 0, last: {}, now: 0, funds: 0, slept: 0 }, streak: 0, offerLeft: 0, lastLot: -1, lastX: 0, lastZ: 0, hadCar: false });

  const counter = (sim, goal) => {
    const m = sim.wish.memo;
    switch (goal.kind) {
      case 'act': return m.acts[goal.key] || 0;
      case 'go': return m.go[goal.key] || 0;
      case 'mood': return m.moods[goal.key] || 0;
      case 'place': return m.places[goal.key] || 0;
      case 'placesDistinct': return Object.keys(m.places).length;
      case 'learn': return m.learned;
      case 'stranger': return m.strangers;
      case 'walked': return Math.floor(m.walked / 10);
      case 'drove': return m.drove;
      case 'moodAt': return m.moodTop >= goal.key ? 1 : 0;
      case 'reward': return (sim.rewards || []).length;
      case 'soc': return (m.soc || {})[goal.key + (goal.win ? '+' : '') + (goal.town ? '@' : '')] || 0;
      case 'count': return (m.soc || {})['#' + goal.key] || 0;
      case 'friends': return m.friendsNow || 0;
      case 'skill': return S.Skills.level(sim, goal.key);
      case 'funds': return Math.floor(m.funds || 0);
      case 'quiet': {
        const last = m.last || {}, from = Math.max(last[goal.key] || 0, last[goal.key + ':p'] || 0);
        return (m.now || 0) - from >= goal.mins ? 1 : 0;
      }
      case 'career': return S.Jobs.dreamLevel(sim, goal.key);
      case 'grade': return sim.school ? Math.floor(sim.school.grade) : 0;
      case 'stat': {
        const value = sim.skill ? sim.skill.stats[goal.key] : 0;
        return Array.isArray(value) ? value.length : Math.floor(value || 0);
      }
      default: return 0;
    }
  };

  const target = goal => (goal.kind === 'moodAt' || goal.kind === 'quiet' ? 1 : goal.n || 1);

  const placeKey = lot => (lot && lot.kind !== 'home' ? lot.id : null);

  const usable = (world, sim, wish) => {
    if (wish.stage > NOW || !S.adAllowed({ age: wish.age }, sim.age)) return false;
    if (wish.work && !S.Jobs.wishFits(world, sim, wish.work)) return false;
    if (wish.goal.opp && !S.Opps.activeOf(world, sim).some(a => a.id === wish.goal.opp)) return false;
    const goal = wish.goal;
    if (goal.kind === 'act') {
      const ad = S.ADS[goal.key];
      if (!ad || !S.adAllowed(ad, sim.age, sim) || (S.Acts && S.Acts.skillClosed(sim, goal.key))) return false;
      if (ad.obj || ad.objs) return sim.home.house.items.some(item => S.objectOf(item) && (ad.obj === S.baseOf(item) || (ad.objs || []).includes(S.baseOf(item))));
      return true;
    }
    if (goal.kind === 'go') return S.Traits.adFactor(sim, goal.key) > 0 && (goal.key !== 'jog' || S.AGE_RANK[sim.age] >= S.AGE_RANK.child);
    if (goal.kind === 'place') return world.lots.some(lot => placeKey(lot) === goal.key);
    if (goal.kind === 'drove') return sim.hasCar;
    if (goal.kind === 'skill') return S.Skills.can(sim, goal.key) && (!goal.abs || S.Skills.level(sim, goal.key) < goal.n);
    if (goal.kind === 'stat' && goal.abs && counter(sim, goal) >= goal.n) return false;
    if (goal.kind === 'funds' && counter(sim, goal) >= goal.n) return false;
    if (goal.kind === 'stat' && (goal.key === 'recipesKnown' || goal.key === 'jogTiles')) return S.Skills.can(sim, goal.key === 'recipesKnown' ? 'cooking' : 'athletic');
    if (goal.kind === 'soc') {
      const row = S.Social.SOCIALS[goal.key];
      return !!row && S.AGE_RANK[sim.age] >= S.AGE_RANK[row.age] && (!row.trait || S.Traits.has(sim, row.trait)) && (!row.romance || S.AGE_RANK[sim.age] >= S.AGE_RANK.teen);
    }
    if (goal.kind === 'mood' && S.Traits.ignores(sim, goal.key)) return false;
    if (goal.skill && !S.Skills.can(sim, goal.skill)) return false;
    if (goal.skill === 'guitar' && !(sim.bag && sim.bag.some(it => it.k === 'guitar'))) return false;
    if (goal.skill === 'gardening' && !sim.home.house.items.some(item => S.baseOf(item) === 'garden')) return false;
    return true;
  };

  const weightOf = (sim, wish) => {
    let w = 1;
    if (wish.traits && wish.traits.some(id => S.Traits.has(sim, id))) w *= 6;
    else if (wish.traits) return 0;
    if (wish.likedBy && wish.likedBy.some(id => S.Traits.has(sim, id))) w *= 4;
    const tags = new Set(S.Traits.of(sim).flatMap(id => S.TRAITS[id].wishes || []));
    if (wish.group === 'trips' && (tags.has('adventure') || tags.has('nature') || tags.has('freedom') || tags.has('fitness'))) w *= 2.5;
    if (wish.group === 'social' && (tags.has('friends') || tags.has('family'))) w *= 2.5;
    if (wish.group === 'places' && (tags.has('nature') || tags.has('friends') || tags.has('adventure'))) w *= 2;
    if (wish.group === 'daily' && tags.has('calm')) w *= 1.5;
    if (S.Wishes.forDream(sim, wish)) w *= 2;
    return w;
  };

  S.Wishes = {
    OFFER_SLOTS, PROMISE_SLOTS, OFFER_LIFE, DREAM_BONUS, DREAM_CHOICES, HAPPY_FROM, HAPPY_TOP, NOW,
    fresh,
    counter,
    target,
    usable,
    placeKey,

    forDream(sim, wish) {
      const dream = sim.dream && S.DREAMS[sim.dream.id];
      return !!(dream && wish.goal.kind === 'act' && dream.acts.includes(wish.goal.key));
    },

    pointsOf(sim, wish) {
      return Math.round(wish.points * (S.Wishes.forDream(sim, wish) ? DREAM_BONUS : 1));
    },

    progress(sim, entry) {
      const wish = S.WISHES[entry.id];
      return Math.max(0, Math.min(target(wish.goal), counter(sim, wish.goal) - entry.base));
    },

    happyRate(mood) {
      if (mood < HAPPY_FROM) return 0;
      if (mood >= HAPPY_TOP) return HAPPY_TOP_RATE;
      return HAPPY_LOW_RATE + (mood - HAPPY_FROM) / (HAPPY_TOP - HAPPY_FROM) * (HAPPY_HIGH_RATE - HAPPY_LOW_RATE);
    },

    needRate(sim, need) {
      let k = 1;
      for (const id of sim.rewards || []) {
        const rates = S.REWARDS[id].rates;
        if (rates && rates[need] !== undefined) k *= rates[need];
      }
      return k;
    },

    offer(world, sim) {
      const w = sim.wish, taken = new Set(w.offered.map(e => e.id).concat(w.promised.map(e => e.id)));
      const pool = [];
      let sum = 0;
      for (const wish of Object.values(S.WISHES)) {
        if (taken.has(wish.id) || !usable(world, sim, wish)) continue;
        const weight = weightOf(sim, wish);
        if (weight <= 0) continue;
        pool.push([wish.id, weight]);
        sum += weight;
      }
      while (w.offered.length < OFFER_SLOTS && pool.length) {
        let pick = S.roll(world.rng) * sum, index = pool.length - 1;
        for (let i = 0; i < pool.length; i++) {
          pick -= pool[i][1];
          if (pick <= 0) {
            index = i;
            break;
          }
        }
        const [id, weight] = pool.splice(index, 1)[0];
        sum -= weight;
        w.offered.push({ id, left: OFFER_LIFE });
      }
    },

    promise(world, sim, index) {
      const w = sim.wish, entry = w.offered[index];
      if (!entry || w.promised.length >= PROMISE_SLOTS) return false;
      w.offered.splice(index, 1);
      const goal = S.WISHES[entry.id].goal;
      if (goal.kind === 'quiet') (w.memo.last = w.memo.last || {})[goal.key + ':p'] = w.memo.now || 0;
      w.promised.push({ id: entry.id, base: goal.abs || goal.kind === 'quiet' ? 0 : counter(sim, goal) });
      return true;
    },

    dismiss(world, sim, index, promised) {
      const list = promised ? sim.wish.promised : sim.wish.offered;
      if (!list[index]) return false;
      list.splice(index, 1);
      if (promised) sim.wish.streak = 0;
      return true;
    },

    fulfil(world, sim, index) {
      const w = sim.wish, entry = w.promised[index], wish = S.WISHES[entry.id], points = S.Wishes.pointsOf(sim, wish);
      w.promised.splice(index, 1);
      w.streak++;
      sim.happy += points;
      S.Moods.add(sim, STREAK_MOODS[Math.min(w.streak, STREAK_MOODS.length) - 1], 0, world);
      world.events.push({ type: 'wish', sim: sim.id, name: sim.name, text: wish.name, points });
    },

    chooseDream(world, sim, id) {
      if (!S.DREAMS[id] || S.AGE_RANK[sim.age] < S.AGE_RANK.adult) return false;
      sim.dream = { id };
      return true;
    },

    dreamName(id, sex) {
      const dream = S.DREAMS[id];
      return dream ? dream.names[sex === 'f' ? 1 : 0] : id;
    },

    dreamChoices(sim) {
      const mine = new Set(S.Traits.of(sim));
      return Object.values(S.DREAMS).map(dream => [dream, dream.traits.filter(id => mine.has(id)).length]).sort((a, b) => b[1] - a[1] || (a[0].id < b[0].id ? -1 : 1)).slice(0, DREAM_CHOICES).map(([dream]) => dream.id);
    },

    buy(world, sim, id) {
      const reward = S.REWARDS[id];
      if (!reward || !sim.rewards || sim.happy < reward.price || (sim.rewards.includes(id) && !reward.item && id !== 'changeDream')) return false;
      sim.happy -= reward.price;
      if (id === 'changeDream') sim.dream = null;
      else sim.rewards.push(id);
      world.events.push({ type: 'reward', sim: sim.id, name: sim.name, text: reward.name });
      return true;
    },

    useMoodRemover(world, sim) {
      if (!sim.rewards || !sim.rewards.includes('moodRemover')) return false;
      const bad = sim.moods.filter(([id]) => S.MOODLETS[id].value < 0);
      sim.moods = sim.moods.filter(([id]) => S.MOODLETS[id].value >= 0);
      if (S.roll(world.rng) < 0.3) sim.moods = sim.moods.filter(([id]) => S.MOODLETS[id].value <= 0 || id === 'newHome');
      world.events.push({ type: 'reward', sim: sim.id, name: sim.name, text: 'Убиратель настроения сработал', removed: bad.length });
      return true;
    },

    actDone(world, sim, act) {
      if (!sim.wish || act.failed) return;
      const m = sim.wish.memo;
      if (act.ad) m.acts[act.ad] = (m.acts[act.ad] || 0) + 1;
      if (act.ad && (S.ADS[act.ad].obj === 'computer' || (S.ADS[act.ad].objs || []).includes('computer') && act.item >= 0 && S.baseOf(world.lots[act.lot].house.items[act.item]) === 'computer')) S.Wishes.mark(sim, 'computer');
      if (act.go && act.mood) {
        const kind = act.mood === 'jog' ? 'jog' : act.mood === 'walk' ? 'walk' : null;
        if (kind) m.go[kind] = (m.go[kind] || 0) + 1;
      }
      if (act.ad && S.ADS[act.ad].person && act.with !== undefined && world.sims[act.with] && world.sims[act.with].free) m.strangers++;
    },

    bump(sim, key) {
      if (!sim.wish) return;
      const m = sim.wish.memo;
      m.soc = m.soc || {};
      m.soc['#' + key] = (m.soc['#' + key] || 0) + 1;
    },

    dreamProgress(world, sim, dream) {
      const lvl = id => S.Skills.level(sim, id), jobs = S.Jobs.dreamProgress(world, sim, dream);
      if (jobs) return jobs;
      if (dream.id === 'museumHome') return [S.Econ.wealth(world), 100000];
      if (dream.id === 'ormondSafe') return [world.funds, 50000];
      if (dream.id === 'heartBreaker' || dream.id === 'everyoneFriend') return S.Social.dreamProgress(world, sim, dream);
      if (dream.id === 'knowItAll') return [Object.keys(S.SKILLS).filter(id => lvl(id) >= S.Skills.TOP).length, 3];
      if (dream.id === 'cookbook') return [sim.skill ? sim.skill.stats.recipesKnown || 0 : 0, Object.keys(S.RECIPES).length];
      if (dream.id === 'headAndLegs') return [lvl('logic') + lvl('athletic'), 2 * S.Skills.TOP];
      if (dream.id === 'grandmaster') return [lvl('logic') + (S.Skills.chessRank(sim) === 'Гроссмейстер' ? 1 : 0), S.Skills.TOP + 1];
      const pairs = { goldenTongue: ['charisma', 'guitar'], storyPainter: ['writing', 'painting'], guitarPainter: ['painting', 'guitar'], masterMechanic: ['handiness', 'logic'] };
      if (pairs[dream.id]) return [lvl(pairs[dream.id][0]) + lvl(pairs[dream.id][1]), 2 * S.Skills.TOP];
      if (dream.id === 'fishCollection') return [S.Fish.perfectTanks(world, sim), 13];
      if (dream.id === 'royalties') return [S.Art.weekly(world, sim), 4000];
      if (dream.id === 'perfectGarden') return [sim.skill && sim.skill.stats.perfectKinds ? sim.skill.stats.perfectKinds.length : 0, 8];
      return null;
    },

    checkDream(world, sim) {
      const dream = sim.dream && !sim.dream.done && S.DREAMS[sim.dream.id];
      if (!dream || dream.stage > NOW) return;
      const progress = S.Wishes.dreamProgress(world, sim, dream);
      if (progress && progress[0] >= progress[1]) S.Wishes.dreamDone(world, sim);
    },

    socDone(world, sim, row, other, win, role) {
      const m = sim.wish.memo;
      m.soc = m.soc || {};
      const add = key => {
        m.soc[key] = (m.soc[key] || 0) + 1;
      };
      if (role === 'to') {
        if (row.romance && !win) add('#rebuff');
        return;
      }
      const town = !!other && !other.needs;
      add(row.id);
      if (win) add(row.id + '+');
      if (town) add(row.id + '@');
      if (town && win) add(row.id + '+@');
    },

    dreamDone(world, sim) {
      const dream = sim.dream && S.DREAMS[sim.dream.id];
      if (!dream || sim.dream.done) return false;
      sim.dream.done = world.day;
      sim.happy += dream.points;
      S.Moods.add(sim, 'dreamDone', 0, world);
      world.events.push({ type: 'dream', sim: sim.id, name: sim.name, text: S.Wishes.dreamName(dream.id, sim.sex), points: dream.points });
      return true;
    },

    mark(sim, key) {
      if (!sim.wish) return;
      const m = sim.wish.memo;
      (m.last = m.last || {})[key] = m.now || 0;
    },

    onMood(sim, id) {
      if (sim.wish) sim.wish.memo.moods[id] = (sim.wish.memo.moods[id] || 0) + 1;
    },

    held(sim, list) {
      if (!sim.wish) return;
      const m = sim.wish.memo, before = m.held || [];
      for (const id of list) if (!before.includes(id)) m.moods[id] = (m.moods[id] || 0) + 1;
      m.held = list.slice();
    },

    learned(sim) {
      if (sim.wish) sim.wish.memo.learned++;
    },

    step(world, sim, dt) {
      if (!sim.wish) return;
      const w = sim.wish, m = w.memo;
      sim.happy += S.Wishes.happyRate(S.Moods.mood(sim)) * dt / 60;
      m.moodTop = Math.max(m.moodTop, S.Moods.mood(sim));
      m.now = world.day * 1440 + world.clock;
      m.funds = world.funds;
      if (S.Acts.isAsleep(sim)) m.slept = (m.slept || 0) + dt;
      else {
        if ((m.slept || 0) >= LONG_SLEEP) S.Wishes.bump(sim, 'longSleep');
        m.slept = 0;
      }
      if (!sim.inside && !sim.car && sim.state !== 'drive') {
        const moved = Math.hypot(sim.x - w.lastX, sim.z - w.lastZ);
        if (moved < 3) m.walked += moved;
      }
      w.lastX = sim.x;
      w.lastZ = sim.z;
      if (w.hadCar && !sim.car) m.drove++;
      w.hadCar = !!sim.car;
      const lot = sim.inside || sim.lot, index = lot ? lot.index : -1;
      if (index !== w.lastLot) {
        w.lastLot = index;
        const key = placeKey(lot);
        if (key) m.places[key] = (m.places[key] || 0) + 1;
      }
      for (const entry of w.offered) entry.left -= dt;
      if (w.offered.some(e => e.left <= 0)) w.offered = w.offered.filter(e => e.left > 0);
      for (let i = w.promised.length - 1; i >= 0; i--) {
        if (S.Wishes.progress(sim, w.promised[i]) >= target(S.WISHES[w.promised[i].id].goal)) S.Wishes.fulfil(world, sim, i);
      }
      w.offerLeft -= dt;
      if (w.offerLeft <= 0) {
        w.offerLeft = OFFER_EVERY;
        if (w.offered.length < OFFER_SLOTS) S.Wishes.offer(world, sim);
      }
    },

    pack(sim) {
      if (!sim.wish) return null;
      return { wish: JSON.parse(JSON.stringify(sim.wish)), happy: sim.happy, dream: sim.dream ? Object.assign({}, sim.dream) : null, rewards: sim.rewards.slice() };
    },

    unpack(r) {
      if (r === null) return null;
      if (!r || typeof r !== 'object' || !r.wish || !Array.isArray(r.wish.offered) || !Array.isArray(r.wish.promised) || !Number.isFinite(r.happy)) throw new Error('повреждены желания жителя');
      for (const e of r.wish.offered.concat(r.wish.promised)) if (!S.WISHES[e.id]) throw new Error('неизвестное желание в файле: ' + e.id);
      if (r.dream && !S.DREAMS[r.dream.id]) throw new Error('неизвестная мечта в файле: ' + r.dream.id);
      for (const id of r.rewards || []) if (!S.REWARDS[id]) throw new Error('неизвестная награда в файле: ' + id);
      return { wish: r.wish, happy: r.happy, dream: r.dream, rewards: (r.rewards || []).slice() };
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
