(function (H) {
  'use strict';
  const G = H.Gfx, R3 = H.R3, M = R3.M, K = H.Cine.Kit;
  const { W, HGT, C } = H.UI_CONST;
  const { cl, lerp, sm, eOut, seg, rgba, glow, lighter, poly, rect, ell, line, ring, vgrad } = K;
  const LW = 320, LH = 240, CX = 160, CY = 120, hx = G.hash;
  const BAR = 240 / 130, BEAT = BAR / 4;
  const FILM_AT = 0.026 + 4 * BAR;
  const SHOTS = [['lot', BAR], ['gate', BAR], ['dark', BAR], ['pick', BAR]];
  const CINE = BAR * 4;
  const RCOL = { 3: '#6aa8ff', 4: '#c08aff', 5: '#ffd060' };
  const RHOT = { 3: '#e0eeff', 4: '#f4e4ff', 5: '#fff2c8' };
  const HER = { makoto: '#e0304a', amanda: '#ff6aa8', talleah: '#4a90e0' };
  const MASK = { makoto: 'studentLook', amanda: null, talleah: 'rangerLook' };
  const REVEAL = { makoto: 'look', amanda: 'pinkLook', talleah: 'look' };
  const THEME_AT = { amanda: 0.042 + 14 * 240 / 95, makoto: 0.039 + 240 / 86, talleah: 0.041 + 6 * 240 / 164 };
  const POSE_AT = { amanda: 0.042 + 16 * 240 / 95, makoto: 0.039 + 4 * 240 / 86, talleah: 0.041 + 12 * 240 / 164 };
  const QUOTES = { makoto: 'Если я притворяюсь, это не значит, что в этом нет смысла.', amanda: 'Я предпочитаю термин «супергероиня».', talleah: 'Принцесса Авии никогда не терпит неудач!', kazuma: 'Я не косплеер. Я так всегда хожу.', welt: 'Вельт Янг. «Арахато» здесь, увы, никто не смотрел.', himeko: 'Химико. Кофе только чёрный, даже для косплееров.', bronya: 'Броня Рэнд. Парад костюмов почти как Солнечный фестиваль.', gepard: 'Гепард Ландау. Песни сестры я здесь не напеваю. Почти.', clara: 'Клара. Господин Сварог сегодня папа, а не дерево.', yanqing: 'Яньцин. Поролоновые мечи тоже мечи. Беру по два.', bailu: 'Байлу. Пейте больше воды и как следует высыпайтесь.', march: 'Март 7. Фото на память с каждым косплеером!', danheng: 'Дань Хэн. Расписание конвента уже в базе данных.', asta: 'Аста. Диссертация подождёт, тут столько косплея!', arlan: 'Арлан. Чехлы для телефонов тут продают поштучно.', herta: 'Герта. Это кукла. Сама я на конвенты не хожу.', serval: 'Сервал Ландау. Мастерская закрыта, у меня концерт!', natasha: 'Наташа. Сегодня я здесь, так что без глупостей.', sampo: 'Сампо Коски. Бейджи со скидкой, только сегодня!', hook: 'Хук Великий Мрак. Экспедиция на конвент успешна!', pela: 'Пела. Рапорт о конвенте: сорок семь страниц.', lynx: 'Рысь Ландау. Палатка в углу зала, людей не звать.', luka: 'Лука. Чемпион тренируется, пока все косплеят.', sushang: 'Сушан. Три добрых дела до обеда, рекорд!', xueyi: 'Сюэи. Полдня в мире живых, и все на конвенте.', tingyun: 'Тинъюнь. Скидка тому, кто похвалит хвостик.', hanya: 'Ханья. В этот раз судья и есть жюри.', qingque: 'Цинцюэ. Конвент засчитан как рабочий день, да?', yukong: 'Юйкун. Посадка у главной сцены разрешена.', guinaifen: 'Гуйнайфэнь. Стрим с конвента, ставьте лайки!' };
  const WALK = 1.0, SNAP = 0.25, CHAR = 2.9, CONE = 2.1, HOP = 0.35, GOLD = 0.4, TAIL = 1.6;
  const MK = 240 / 86, AM = 240 / 95, TL = 2 * 240 / 164;
  const CUTS = {
    makoto: [['bus', MK], ['snap', MK], ['vault', MK], ['pose', MK]],
    amanda: [['call', AM], ['moths', AM], ['burst', AM], ['blush', AM]],
    talleah: [['lawn', TL], ['knob', TL], ['standee', TL], ['salute', TL]],
    kazuma: [['gate', BAR], ['steal', BAR], ['stage', BAR], ['pose', BAR]],
    welt: [['alley', BAR], ['flip', BAR], ['gravity', BAR], ['pose', BAR]],
    himeko: [['stand', BAR], ['sip', BAR], ['lamp', BAR], ['pose', BAR]],
    bronya: [['mirror', BAR], ['door', BAR], ['parade', BAR], ['pose', BAR]],
    gepard: [['patrol', BAR], ['kids', BAR], ['wall', BAR], ['pose', BAR]],
    clara: [['shy', BAR], ['coat', BAR], ['tree', BAR], ['pose', BAR]],
    yanqing: [['vendor', BAR], ['sheath', BAR], ['duel', BAR], ['pose', BAR]],
    bailu: [['booth', BAR], ['candy', BAR], ['height', BAR], ['pose', BAR]],
    march: [['selfie', BAR], ['pompom', BAR / 2], ['pose', BAR / 2]],
    danheng: [['desk', BAR], ['selfie', BAR / 2], ['pose', BAR / 2]],
    asta: [['shop', BAR], ['gift', BAR / 2], ['pose', BAR / 2]],
    arlan: [['search', BAR], ['found', BAR / 2], ['pose', BAR / 2]],
    herta: [['dolls', BAR], ['spin', BAR / 2], ['pose', BAR / 2]],
    serval: [['gig', BAR], ['brother', BAR / 2], ['pose', BAR / 2]],
    natasha: [['teddy', BAR], ['shot', BAR / 2], ['pose', BAR / 2]],
    sampo: [['deal', BAR], ['chase', BAR / 2], ['pose', BAR / 2]],
    hook: [['march', BAR], ['hide', BAR / 2], ['pose', BAR / 2]],
    pela: [['report', BAR], ['books', BAR / 2], ['pose', BAR / 2]],
    lynx: [['tent', BAR], ['family', BAR / 2], ['pose', BAR / 2]],
    luka: [['arm', BAR], ['snack', BAR / 2], ['pose', BAR / 2]],
    sushang: [['deeds', BAR], ['tales', BAR / 2], ['pose', BAR / 2]],
    xueyi: [['book', BAR], ['chain', BAR / 2], ['pose', BAR / 2]],
    tingyun: [['deal', BAR], ['tail', BAR / 2], ['pose', BAR / 2]],
    hanya: [['judge', BAR], ['sister', BAR / 2], ['pose', BAR / 2]],
    qingque: [['table', BAR], ['win', BAR / 2], ['pose', BAR / 2]],
    yukong: [['kite', BAR], ['traffic', BAR / 2], ['pose', BAR / 2]],
    guinaifen: [['juggle', BAR], ['stream', BAR / 2], ['pose', BAR / 2]]
  };
  const CUT_LINES = {
    makoto: { bus: 'Я милый невинный котёнок. Обещаю не драть диван.', snap: 'Кажется, мне всё-таки придётся…', pose: 'Выбираю самую большую блестяшку. Мяу.' },
    amanda: { call: 'Это с работы. Что им надо?', moths: 'Поверить не могу, что делаю это.', burst: 'За сим… любовь… восторжествует!', blush: 'Спасибо за комплимент! Мне очень приятно!' },
    talleah: { lawn: 'ПРИЁМ, ЖИТЕЛЬНИЦА ЗЕМЛИ! ТЫ ЖИВАЯ?', knob: 'Невероятно!', standee: 'А, ты просто украшение. Тогда живи.', salute: 'Excelsior!' },
    kazuma: { gate: 'Без бейджа в зал не пускаем!', steal: 'Кража!', stage: 'Ловкость рук, коллега.', pose: 'Я не косплеер. Я так всегда хожу.' },
    welt: { alley: 'Вдохновение всегда приходит на рассвете.', flip: 'Работа того стоит. Она превращает мечты в жизнь.', gravity: 'Бейджи! Пом-Пом их не удержит!', pose: 'Новые приключения, новые друзья… Здорово, правда?' },
    himeko: { stand: 'Привет. Устали? Чашечку кофе?', sip: 'Это религиозный напиток?', lamp: 'Я чиню поломку до того, как вы о ней узнаёте.', pose: 'У меня для тебя кое-что есть.' },
    bronya: { mirror: 'П-прости, я ещё не совсем проснулась.', door: 'Сейчас или никогда. Плечом к плечу со мной!', parade: 'Покажи свою храбрость.', pose: 'Спасибо… Я буду твёрдо стоять за свой народ.' },
    gepard: { patrol: 'Если заметишь что-то подозрительное, сообщи мне.', kids: 'Больше заниматься спортом и правильно питаться.', wall: 'Усилить оборону.', pose: 'Я выращиваю цветы, но… получается не очень.' },
    clara: { shy: 'Надо быть храбрее…', coat: 'Красное пальто и шляпа! Ну пожалуйста!', tree: 'Пока я здесь, ты тоже семья.', pose: 'Я с-с-совсем тебя не боюсь!' },
    yanqing: { vendor: 'Я всегда покупаю по два одинаковых!', sheath: 'Кольцо в виде тигра или дракона?', duel: 'Сколько приёмов ты сможешь отразить?', pose: 'Мой меч хорошо обучен. Пора испытать его в деле.' },
    bailu: { booth: 'Кажется, кому-то нужен доктор!', candy: 'Хочешь конфетку? Нет? Тогда я сама съем.', height: 'Маленький рост, блин!', pose: 'Скажи «а-а»!' },
    march: { selfie: 'Мы сегодня ещё не делали селфи!', pompom: 'Проводник лучше всех!', pose: 'Если я рядом, разве мы можем проиграть?' },
    danheng: { desk: 'Сегодня я обновил базу данных.', selfie: 'Отойди. Я не хочу раздувать конфликт.', pose: 'Время пришло.' },
    asta: { shop: 'Если это решается деньгами, мои двери открыты.', gift: 'Подарок от звёзд!', pose: 'Цели как звёзды: они ближе, чем кажется.' },
    arlan: { search: 'Мы уже девять раз устраивали «Найди Пеппи».', found: 'И… все девять раз выиграл я.', pose: 'Меч всегда должен быть наточен.' },
    herta: { dolls: 'Она примерно на 70% похожа на меня в детстве.', spin: 'Пора крутиться!', pose: 'Видел когда-нибудь такой огромный алмаз?' },
    serval: { gig: 'Эта песня только для вас.', brother: 'Сделайте погромче!', pose: 'Самое лучшее ещё впереди!' },
    natasha: { teddy: 'Я иногда тренируюсь накладывать швы на мишке.', shot: 'Пора делать укол.', pose: 'Почувствуй, как бьётся жизнь.' },
    sampo: { deal: 'Я продаю то, что люди хотят купить!', chase: 'Обычно я убегаю, а он бежит за мной.', pose: 'Сампо Коски всегда заботится о друзьях.' },
    hook: { march: 'Кроты выходят из норы! В атаку, храбрые Кроты!', hide: 'Сейчас ты меня видишь… А теперь нет.', pose: 'Хук Великий Мрак прибыла! С дороги!' },
    pela: { report: 'Всё готово? Начнём сегодняшний рапорт.', books: 'Эту серию труднее всего достать…', pose: 'Получены данные о противнике.' },
    lynx: { tent: 'Спальный мешок, каремат… Всё готово.', family: 'Хватит меня опекать, Гепард! Я уже не ребёнок…', pose: 'Каждый шаг тоже часть приключения.' },
    luka: { arm: 'Турнир начинается? Прекрасно! Дай мне разогреться.', snack: 'Овощи… грибы… вот мерзость.', pose: 'Где аплодисменты?' },
    sushang: { deeds: 'Каждый день совершай доброе дело!', tales: 'Рано или поздно я войду в историю!', pose: 'Феникс, восстань!' },
    xueyi: { book: 'Книга основана на событиях моей жизни.', chain: 'Признаёшься ли ты в содеянном?', pose: 'Час пробил.' },
    tingyun: { deal: 'Почти любое дело можно решить переговорами.', tail: 'А что если нам подружиться?', pose: 'Добрый знак! Все за одного!' },
    hanya: { judge: 'Я буду судить тебя именем десяти владык.', sister: 'Новые проступки…', pose: 'Повеление десяти владык ныне записано!' },
    qingque: { table: 'В «Небесный нефрит» нельзя играть в одиночку.', win: 'Время расплаты.', pose: 'Жизнь это игра.' },
    yukong: { kite: 'Отличный день, чтобы поднять паруса, не правда ли?', traffic: 'Скорость, а не спешка.', pose: 'Облачные змеи, стройся!' },
    guinaifen: { juggle: 'Если можете дать денег, давайте!', stream: 'Смотрите и изумляйтесь!', pose: 'Никогда не рано… поздравить с Новым годом!' }
  };
  const CUT_WHO = { kazuma: { gate: 'Пом-Пом', steal: 'Казума', stage: 'Макото', pose: 'Казума' }, welt: { alley: 'Вельт', flip: 'Вельт', gravity: 'Пом-Пом', pose: 'Вельт' }, himeko: { stand: 'Химико', sip: 'Таллея', lamp: 'Химико', pose: 'Химико' }, bronya: { mirror: 'Броня', door: 'Броня', parade: 'Броня', pose: 'Броня' }, gepard: { patrol: 'Гепард', kids: 'Гепард', wall: 'Гепард', pose: 'Гепард' }, clara: { shy: 'Клара', coat: 'Клара', tree: 'Сварог', pose: 'Клара' }, yanqing: { vendor: 'Яньцин', sheath: 'Яньцин', duel: 'Яньцин', pose: 'Яньцин' }, bailu: { booth: 'Байлу', candy: 'Байлу', height: 'Байлу', pose: 'Байлу' }, march: { selfie: 'Март 7', pompom: 'Март 7', pose: 'Март 7' }, danheng: { desk: 'Дань Хэн', selfie: 'Дань Хэн', pose: 'Дань Хэн' }, asta: { shop: 'Аста', gift: 'Аста', pose: 'Аста' }, arlan: { search: 'Арлан', found: 'Арлан', pose: 'Арлан' }, herta: { dolls: 'Герта', spin: 'Герта', pose: 'Герта' }, serval: { gig: 'Сервал', brother: 'Сервал', pose: 'Сервал' }, natasha: { teddy: 'Наташа', shot: 'Наташа', pose: 'Наташа' }, sampo: { deal: 'Сампо', chase: 'Сампо', pose: 'Сампо' }, hook: { march: 'Хук', hide: 'Хук', pose: 'Хук' }, pela: { report: 'Пела', books: 'Пела', pose: 'Пела' }, lynx: { tent: 'Рысь', family: 'Рысь', pose: 'Рысь' }, luka: { arm: 'Лука', snack: 'Лука', pose: 'Лука' }, sushang: { deeds: 'Сушан', tales: 'Сушан', pose: 'Сушан' }, xueyi: { book: 'Сюэи', chain: 'Сюэи', pose: 'Сюэи' }, tingyun: { deal: 'Тинъюнь', tail: 'Тинъюнь', pose: 'Тинъюнь' }, hanya: { judge: 'Ханья', sister: 'Ханья', pose: 'Ханья' }, qingque: { table: 'Цинцюэ', win: 'Цинцюэ', pose: 'Цинцюэ' }, yukong: { kite: 'Юйкун', traffic: 'Юйкун', pose: 'Юйкун' }, guinaifen: { juggle: 'Гуйнайфэнь', stream: 'Гуйнайфэнь', pose: 'Гуйнайфэнь' } };
  const JURY = { kazuma: 'stage', welt: 'pose', himeko: 'pose', bronya: 'pose', gepard: 'pose', clara: 'pose', yanqing: 'pose', bailu: 'pose', march: 'pose', danheng: 'pose', asta: 'pose', arlan: 'pose', herta: 'pose', serval: 'pose', natasha: 'pose', sampo: 'pose', hook: 'pose', pela: 'pose', lynx: 'pose', luka: 'pose', sushang: 'pose', xueyi: 'pose', tingyun: 'pose', hanya: 'pose', qingque: 'pose', yukong: 'pose', guinaifen: 'pose' };
  const CUT_SFX = {
    makoto: { bus: [[0.05, 'rumble'], [0.55, 'step'], [1.6, 'debuff']], snap: [[0.02, 'snap'], [0.1, 'ult'], [1.5, 'tech']], vault: [[0.4, 'whoosh'], [1.05, 'glint'], [1.9, 'warp']], pose: [[0.02, 'lever'], [1.0, 'select'], [MK * 0.75, 'glint'], [MK * 0.8, 'star5']] },
    amanda: { call: [[0.05, 'msg_in'], [0.45, 'msg_in'], [1.0, 'text']], moths: [[0.1, 'sparkle'], [0.9, 'sparkle'], [AM * 0.75, 'shield']], burst: [[0.02, 'break'], [0.08, 'ult'], [AM * 0.5, 'star5']], blush: [[0.05, 'clap'], [0.3, 'cheer'], [AM * 0.75, 'glint']] },
    talleah: { lawn: [[0.1, 'scan'], [1.2, 'text'], [1.32, 'text'], [1.44, 'text']], knob: [[0.3, 'deny'], [0.9, 'deny'], [1.4, 'swing'], [TL * 0.72, 'door'], [TL * 0.82, 'glint']], standee: [[0.55, 'hit'], [1.0, 'tech'], [2.1, 'step'], [2.4, 'step']], salute: [[0.1, 'lever'], [0.6, 'select'], [1.4, 'buff'], [TL * 0.75, 'star5']] },
    kazuma: { gate: [[0.1, 'step'], [0.5, 'deny'], [1.0, 'debuff']], steal: [[0.05, 'tech'], [0.3, 'glint']], stage: [[0.05, 'lever'], [0.3, 'cheer'], [1.0, 'swing'], [1.3, 'select']], pose: [[0.6, 'steam'], [1.4, 'star4']] },
    welt: { alley: [[0.1, 'step'], [0.45, 'text'], [0.75, 'text'], [1.05, 'text'], [1.35, 'text']], flip: [[0.05, 'swing'], [0.3, 'select'], [0.53, 'select'], [0.76, 'select'], [0.99, 'select'], [1.22, 'select'], [1.5, 'glint']], gravity: [[0.08, 'step'], [0.3, 'break_obj'], [0.42, 'tech'], [0.48, 'debuff'], [1.2, 'buff'], [1.62, 'step']], pose: [[0.05, 'lever'], [0.35, 'cheer'], [0.9, 'shutter'], [1.4, 'star5']] },
    himeko: { stand: [[0.1, 'step'], [0.4, 'step'], [0.75, 'chest'], [1.1, 'steam']], sip: [[0.1, 'steam'], [0.8, 'deny'], [1.0, 'text'], [1.12, 'text'], [1.24, 'text']], lamp: [[0.05, 'tech'], [0.22, 'break'], [0.5, 'chest'], [0.7, 'whoosh'], [0.95, 'swing'], [1.1, 'hit'], [1.45, 'lever'], [1.6, 'buff']], pose: [[0.05, 'lever'], [0.3, 'steam'], [0.5, 'cheer'], [0.9, 'shutter'], [1.4, 'star5']] },
    bronya: { mirror: [[0.05, 'lever'], [0.15, 'select'], [0.25, 'select'], [0.35, 'select'], [0.7, 'text']], door: [[0.1, 'step'], [0.45, 'step'], [0.8, 'step'], [1.15, 'step'], [1.5, 'door']], parade: [[0.05, 'whoosh'], [0.3, 'cheer'], [0.6, 'step'], [0.9, 'step'], [1.2, 'buff'], [1.5, 'clap']], pose: [[0.05, 'lever'], [0.3, 'whoosh'], [0.5, 'cheer'], [0.9, 'shutter'], [1.4, 'star5']] },
    gepard: { patrol: [[0.1, 'step'], [0.35, 'text'], [0.6, 'text'], [0.85, 'text'], [1.3, 'deny']], kids: [[0.1, 'cheer'], [0.4, 'step'], [0.7, 'step'], [1.0, 'select'], [1.3, 'clap']], wall: [[0.05, 'rumble'], [0.4, 'shield'], [0.5, 'break'], [0.9, 'hit'], [1.4, 'buff']], pose: [[0.05, 'lever'], [0.4, 'heal'], [0.6, 'cheer'], [0.9, 'shutter'], [1.4, 'star5']] },
    clara: { shy: [[0.1, 'step'], [0.3, 'step'], [0.8, 'select'], [1.25, 'cheer'], [1.35, 'deny']], coat: [[0.1, 'select'], [0.5, 'text'], [1.0, 'whoosh'], [1.3, 'chest'], [1.45, 'tech']], tree: [[0.05, 'lever'], [0.4, 'steam'], [0.9, 'swing'], [1.1, 'heal'], [1.4, 'clap']], pose: [[0.05, 'lever'], [0.35, 'shutter'], [0.6, 'deny'], [0.9, 'shutter'], [1.4, 'star5']] },
    yanqing: { vendor: [[0.1, 'step'], [0.45, 'glint'], [0.9, 'swing'], [1.1, 'swing'], [1.35, 'chest']], sheath: [[0.1, 'select'], [0.45, 'select'], [0.8, 'select'], [1.15, 'chest'], [1.4, 'deny']], duel: [[0.05, 'lever'], [0.3, 'swing'], [0.6, 'whoosh'], [0.72, 'crit'], [0.9, 'swing'], [1.3, 'cheer']], pose: [[0.05, 'lever'], [0.3, 'swing'], [0.6, 'cheer'], [0.9, 'shutter'], [1.4, 'star5']] },
    bailu: { booth: [[0.1, 'step'], [0.5, 'text'], [0.9, 'whoosh'], [1.2, 'heal'], [1.45, 'sparkle']], candy: [[0.1, 'select'], [0.6, 'scan'], [0.75, 'deny'], [1.05, 'whoosh'], [1.3, 'chest']], height: [[0.15, 'step'], [0.45, 'step'], [0.75, 'step'], [1.15, 'heal'], [1.5, 'shutter']], pose: [[0.05, 'lever'], [0.3, 'heal'], [0.6, 'cheer'], [0.9, 'shutter'], [1.4, 'star5']] },
    march: { selfie: [[0.1, 'step'], [0.45, 'shutter'], [0.9, 'shutter'], [1.35, 'shutter']], pompom: [[0.05, 'sparkle'], [0.4, 'cheer']], pose: [[0.05, 'tech'], [0.45, 'star4']] },
    danheng: { desk: [[0.1, 'step'], [0.45, 'text'], [0.75, 'text'], [1.1, 'select'], [1.4, 'ticket']], selfie: [[0.05, 'whoosh'], [0.3, 'shutter'], [0.55, 'deny']], pose: [[0.05, 'swing'], [0.45, 'star4']] },
    asta: { shop: [[0.1, 'select'], [0.4, 'chest'], [0.7, 'chest'], [1.0, 'chest'], [1.3, 'confirm']], gift: [[0.05, 'whoosh'], [0.3, 'sparkle'], [0.6, 'cheer']], pose: [[0.05, 'glint'], [0.45, 'star4']] },
    arlan: { search: [[0.1, 'step'], [0.5, 'scan'], [0.9, 'step'], [1.3, 'glint']], found: [[0.05, 'step'], [0.25, 'heal'], [0.6, 'cheer']], pose: [[0.05, 'tech'], [0.45, 'star4']] },
    herta: { dolls: [[0.1, 'step'], [0.5, 'scan'], [1.0, 'text'], [1.3, 'deny']], spin: [[0.05, 'swing'], [0.3, 'swing'], [0.55, 'break_obj']], pose: [[0.05, 'whoosh'], [0.3, 'break'], [0.5, 'star4']] },
    serval: { gig: [[0.05, 'strum'], [0.5, 'strum'], [0.95, 'strum'], [1.2, 'cheer']], brother: [[0.05, 'strum'], [0.4, 'text'], [0.7, 'cheer']], pose: [[0.05, 'tech'], [0.2, 'strum'], [0.5, 'star4']] },
    natasha: { teddy: [[0.1, 'step'], [0.45, 'select'], [0.7, 'select'], [0.95, 'select'], [1.3, 'heal']], shot: [[0.05, 'step'], [0.2, 'step'], [0.35, 'step'], [0.55, 'deny']], pose: [[0.05, 'heal'], [0.45, 'star4']] },
    sampo: { deal: [[0.1, 'whoosh'], [0.4, 'glint'], [0.8, 'chest'], [1.2, 'ticket']], chase: [[0.05, 'deny'], [0.15, 'step'], [0.3, 'step'], [0.45, 'step'], [0.6, 'step']], pose: [[0.05, 'glint'], [0.45, 'star4']] },
    hook: { march: [[0.1, 'step'], [0.35, 'step'], [0.6, 'step'], [0.85, 'step'], [1.2, 'cheer']], hide: [[0.05, 'whoosh'], [0.5, 'break_obj'], [0.6, 'cheer']], pose: [[0.05, 'ult'], [0.45, 'star4']] },
    pela: { report: [[0.1, 'scan'], [0.5, 'beep'], [0.8, 'beep'], [1.1, 'beep'], [1.4, 'text']], books: [[0.05, 'glint'], [0.35, 'sparkle'], [0.6, 'chest']], pose: [[0.05, 'tech'], [0.45, 'star4']] },
    lynx: { tent: [[0.1, 'step'], [0.5, 'swing'], [0.8, 'swing'], [1.2, 'door']], family: [[0.05, 'step'], [0.3, 'text'], [0.6, 'deny']], pose: [[0.05, 'heal'], [0.45, 'star4']] },
    luka: { arm: [[0.1, 'tech'], [0.5, 'hit'], [0.9, 'hit'], [1.3, 'break']], snack: [[0.05, 'select'], [0.35, 'deny']], pose: [[0.05, 'crit'], [0.3, 'cheer'], [0.5, 'star4']] },
    sushang: { deeds: [[0.3, 'confirm'], [0.75, 'confirm'], [1.2, 'confirm'], [1.4, 'buff']], tales: [[0.05, 'text'], [0.4, 'sparkle']], pose: [[0.05, 'swing'], [0.25, 'ult'], [0.5, 'star4']] },
    xueyi: { book: [[0.1, 'step'], [0.5, 'select'], [0.9, 'text'], [1.3, 'glint']], chain: [[0.05, 'whoosh'], [0.2, 'debuff'], [0.4, 'deny']], pose: [[0.05, 'tech'], [0.3, 'crit'], [0.5, 'star4']] },
    tingyun: { deal: [[0.2, 'text'], [0.5, 'select'], [0.8, 'select'], [1.1, 'select'], [1.4, 'confirm']], tail: [[0.1, 'shutter'], [0.35, 'shutter'], [0.55, 'cheer']], pose: [[0.05, 'buff'], [0.3, 'sparkle'], [0.5, 'star4']] },
    hanya: { judge: [[0.3, 'text'], [0.4, 'clap'], [0.75, 'text'], [0.85, 'clap'], [1.2, 'text'], [1.3, 'cheer']], sister: [[0.05, 'step'], [0.3, 'debuff'], [0.55, 'text']], pose: [[0.05, 'swing'], [0.3, 'debuff'], [0.5, 'star4']] },
    qingque: { table: [[0.1, 'select'], [0.3, 'select'], [0.6, 'step'], [0.9, 'step'], [1.2, 'step']], win: [[0.05, 'chest'], [0.25, 'crit'], [0.5, 'deny']], pose: [[0.05, 'glint'], [0.3, 'select'], [0.5, 'star4']] },
    yukong: { kite: [[0.1, 'whoosh'], [0.6, 'whoosh'], [1.1, 'cheer']], traffic: [[0.05, 'swing'], [0.3, 'swing'], [0.55, 'confirm']], pose: [[0.05, 'whoosh'], [0.3, 'buff'], [0.5, 'star4']] },
    guinaifen: { juggle: [[0.1, 'whoosh'], [0.5, 'whoosh'], [0.9, 'clap'], [1.2, 'chest']], stream: [[0.05, 'beep'], [0.3, 'msg_in'], [0.5, 'msg_in']], pose: [[0.05, 'break'], [0.25, 'sparkle'], [0.5, 'star4']] }
  };
  const BRIEF = { makoto: 'pose', amanda: 'burst', talleah: 'salute', kazuma: 'pose', welt: 'gravity', himeko: 'sip', bronya: 'parade', gepard: 'wall', clara: 'tree', yanqing: 'duel', bailu: 'candy', march: 'pompom', danheng: 'selfie', asta: 'gift', arlan: 'found', herta: 'spin', serval: 'brother', natasha: 'shot', sampo: 'chase', hook: 'hide', pela: 'books', lynx: 'family', luka: 'snack', sushang: 'tales', xueyi: 'chain', tingyun: 'tail', hanya: 'sister', qingque: 'win', yukong: 'traffic', guinaifen: 'stream' };
  const total = list => list.reduce((a, x) => a + x[1], 0);
  const ROWS = { 10: [3, 4, 3] };
  const shotStart = name => { let s = 0; for (const [n, d] of SHOTS) { if (n === name) return s; s += d; } return s; };
  const heroine = id => !!HER[id];
  const lookOf = (id, game, lit) => { const k = H.CHARS[id]; if (!heroine(id)) return G.lookOf(id, game); const key = lit ? REVEAL[id] : MASK[id]; return (key && k[key]) || k.look; };

  const meshCache = new Map();
  function cached(key, fn) { let m = meshCache.get(key); if (!m) { m = fn(); meshCache.set(key, m); } return m; }

  function figure(g, look, x, y, k, o = {}) {
    const cv = G.figureCanvas(look, k), s = o.s || 1, w = cv.width * s, h = cv.height * s, fy = G.FIG_FOOT * k * s;
    g.save();
    g.imageSmoothingEnabled = false;
    if (o.a != null) g.globalAlpha = cl(o.a);
    g.translate(Math.round(x), Math.round(y));
    if (o.flip) g.scale(-1, 1);
    g.drawImage(o.tint ? K.tinted(cv, o.tint, o.ta == null ? 1 : o.ta) : cv, Math.round(-w / 2), Math.round(-fy), Math.round(w), Math.round(h));
    g.restore();
  }

  function lotMesh() {
    return cached('lot', () => {
      const m = R3.mesh();
      R3.quad(m, [-40, 0, 30, 40, 0, 30, 40, 0, -40, -40, 0, -40], '#5c5c64');
      for (let z = 24; z > -16; z -= 3.2) for (const x of [-5.5, 5.5]) R3.box(m, x, 0.01, z, 2.6, 0.02, 0.12, '#d8d8d0');
      for (let z = 26; z > -16; z -= 6.4) R3.box(m, 0, 0.012, z, 0.14, 0.02, 2.2, '#e8d070');
      R3.box(m, 0, 5, -24, 28, 10, 5, '#c8bca8', { cols: ['#d8ccb8', '#a89c88', '#b8ac98', '#b8ac98', '#e0d4c0', '#8a806e'] });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) if (Math.abs(c - 4) > 0) R3.box(m, -12 + c * 3, 2 + r * 2.2, -21.4, 1.6, 1.1, 0.1, '#ffe0a0', { emit: 0.8 });
      R3.quad(m, [-1.4, 0, -21.3, 1.4, 0, -21.3, 1.4, 7, -21.3, -1.4, 7, -21.3], '#9ad8ff', { emit: 1 });
      R3.box(m, 0, 0.4, -20.4, 6, 0.8, 1.6, '#7a8ea0');
      for (const x of [-4.2, 4.2]) { R3.box(m, x, 0.5, -17, 1.2, 1, 1.2, '#b8b0a0'); R3.box(m, x, 1.4, -17.2, 0.8, 0.9, 0.9, '#c8c0b0'); R3.box(m, x, 1.95, -16.8, 0.5, 0.5, 0.5, '#c8c0b0'); }
      for (let z = 18; z > -14; z -= 8) for (const x of [-9, 9]) {
        R3.cyl(m, x, 0, z, 0.18, 0.12, 4.2, 6, '#7a5a3a');
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; R3.box(m, x + Math.cos(a) * 0.9, 4.2, z + Math.sin(a) * 0.9, 1.8, 0.14, 0.5, '#3a8a4a'); }
      }
      return m;
    });
  }

  function busMesh() {
    return cached('bus', () => {
      const m = R3.mesh();
      R3.box(m, 0, 1.45, 0, 2.4, 2.1, 7.2, '#f0c020', { cols: ['#f8d040', '#c89a10', '#e0b018', '#e0b018', '#f8e070', '#7a5a08'] });
      R3.box(m, 0, 0.45, 3.65, 2.5, 0.3, 0.2, '#2a2a30');
      R3.box(m, 0, 0.45, -3.65, 2.5, 0.3, 0.2, '#2a2a30');
      for (const s of [-1, 1]) {
        for (let k = 0; k < 5; k++) R3.box(m, s * 1.21, 1.9, 2.4 - k * 1.3, 0.04, 0.6, 0.9, '#2a3a4a', { emit: 0.15 });
        R3.box(m, s * 1.21, 1.1, 0, 0.03, 0.12, 6.8, '#1a1a20');
        for (const z of [2.4, -2.4]) { const d = R3.mesh(); R3.cyl(d, 0, -0.15, 0, 0.42, 0.42, 0.3, 10, '#16161a'); R3.merge(m, d, M.of(M.t(s * 1.1, 0.42, z), M.rz(Math.PI / 2))); }
      }
      R3.box(m, 0, 2.0, -3.61, 2.1, 0.8, 0.04, '#2a3a4a', { emit: 0.15 });
      return m;
    });
  }

  function hand(g, x, y, s, a, flip) {
    g.save(); g.globalAlpha = cl(a); g.translate(x, y); g.scale(flip ? -s : s, s);
    poly(g, '#2a2a34', [-14, 60, 14, 60, 10, 10, -10, 10]);
    poly(g, '#f0ccb0', [-10, 12, 10, 12, 12, -6, -12, -6]);
    for (let i = 0; i < 4; i++) poly(g, '#f6d8c0', [-11 + i * 6, -4, -7 + i * 6, -4, -6 + i * 6, -20 + Math.abs(i - 1.5) * 3, -10 + i * 6, -20 + Math.abs(i - 1.5) * 3]);
    g.restore();
  }

  function sparks(g, x, y, k, col, n, seed) {
    for (let i = 0; i < n; i++) {
      const a = hx(i, 1, seed) * Math.PI * 2, v = 30 + hx(i, 2, seed) * 70, px = x + Math.cos(a) * v * eOut(k), py = y + Math.sin(a) * v * eOut(k) + 30 * k * k;
      poly(g, rgba(i % 3 ? col : '#ffffff', 1 - k), [px, py - 3, px + 1.5, py, px, py + 3, px - 1.5, py]);
    }
  }

  class SpotlightShow {
    constructor(ui, res, opts = {}) {
      this.ui = ui; this.res = res; this.game = ui.game; this.ban = opts.ban || 'con';
      this.best = Math.max(...res.map(r => r.rar));
      this.R = new R3.Raster(LW, LH);
      this.phase = 'cine'; this.t = 0; this.cue = 0; this.rt = 0;
      this.queue = []; this.cur = -1; this.seen = new Set(); this.fade = 0; this.done = false; this.hop = 0; this.rc = []; this.sel = 0; this.blinked = false;
      const top = res.find(r => r.rar === this.best && r.kind === 'char' && heroine(r.id));
      this.lead = top ? top.id : null;
      this.cues = this.cueList();
    }

    cueList() {
      const gate = shotStart('gate'), dark = shotStart('dark'), pick = shotStart('pick');
      return [[0.1, 'rumble'], [0.9, 'scan'], [gate + 0.3, 'step'], [gate + BEAT * 2, 'beep'], [gate + BEAT * 2.6, 'door'], [dark + 0.05, 'lever'], [dark + BEAT * 2, 'whoosh'],
        [pick, 'lever'], [pick + BEAT, 'lever'], [pick + BEAT * 2, 'lever'], [pick + BEAT * 3, this.best === 5 ? 'star5' : this.best === 4 ? 'star4' : 'glint'], [pick + BEAT * 3.2, this.best === 5 ? 'sparkle' : 'select']].sort((a, b) => a[0] - b[0]);
    }

    item() { return this.res[this.cur]; }

    own(r) {
      if (r.kind !== 'char' || !CUTS[r.id]) return null;
      return r.res === 'new' || !BRIEF[r.id] ? CUTS[r.id] : CUTS[r.id].filter(x => x[0] === BRIEF[r.id]);
    }

    length(r) {
      const own = this.own(r);
      if (own) return total(own) + TAIL;
      const gold = r.rar === 5 ? GOLD : 0;
      return (r.kind === 'char' ? CHAR : CONE) + gold;
    }

    intro() { return this.hop + this.length(this.item()); }

    revealCues(r) {
      const own = this.own(r);
      if (own) { const out = []; let at = 0; for (const [n, d] of own) { for (const [x, id] of (CUT_SFX[r.id] || {})[n] || []) out.push([at + x, id]); at += d; } return out; }
      if (r.kind !== 'char') return [[0.05, 'lever'], [0.4, 'swing'], [0.75, r.rar === 5 ? 'star5' : r.rar === 4 ? 'star4' : 'glint']];
      const list = [[0.05, 'lever'], [0.3, 'step'], [0.6, 'step'], [WALK, 'shutter'], [WALK + SNAP, r.rar === 5 ? 'star5' : r.rar === 4 ? 'star4' : 'glint']];
      if (!heroine(r.id)) list.push([WALK + 0.45, 'cheer'], [WALK + 0.55, 'clap']);
      return list;
    }

    tick(dt) {
      this.fade = Math.max(0, this.fade - dt * 2.4);
      if (this.phase === 'cine') {
        this.t += dt;
        while (this.cue < this.cues.length && this.cues[this.cue][0] <= this.t) this.ui.sfx(this.cues[this.cue++][1]);
        if (this.t >= CINE) this.begin(this.res.map((r, i) => i));
        return;
      }
      const before = this.rt;
      this.rt += dt;
      if (this.phase === 'rack') { if (!this.blinked && this.rt >= 1.0 && this.res.some(r => r.rar === 5)) { this.blinked = true; this.ui.sfx('glint'); } return; }
      for (const [x, id] of this.rc) if (before < this.hop + x && this.rt >= this.hop + x) this.ui.sfx(id);
    }

    begin(queue) {
      const first = this.phase === 'cine';
      this.phase = 'reveal';
      this.queue = queue.filter(i => !this.seen.has(i));
      this.next(first);
      if (first) this.fade = 0.9;
    }

    themeOff() { if (this.themed) { this.ui.audio.stopTheme(0.5); this.themed = null; } }

    next(first) {
      this.themeOff();
      if (!this.queue.length) { if (this.res.length > 1) this.toRack(); else this.done = true; return; }
      this.cur = this.queue.shift();
      this.seen.add(this.cur);
      this.hop = first ? 0 : HOP;
      this.rt = 0;
      this.rc = (this.hop ? [[-this.hop + 0.02, 'lever']] : []).concat(this.revealCues(this.item()));
      const r = this.item();
      if (r.kind === 'char' && heroine(r.id)) { this.themed = r.id; this.ui.audio.theme(r.id, r.res === 'new' ? THEME_AT[r.id] : POSE_AT[r.id], 0.3); }
    }

    retheme() { const r = this.item(); if (this.themed && r) this.ui.audio.theme(r.id, r.res === 'new' ? THEME_AT[r.id] : POSE_AT[r.id], 0.3); }

    toRack() { this.themeOff(); this.phase = 'rack'; this.rt = 0; this.fade = 0.6; this.sel = Math.max(0, this.res.findIndex(r => r.rar === this.best)); this.ui.sfx('shutter'); }

    skip() {
      if (this.res.length === 1) { if (this.phase === 'cine') this.begin([0]); else { this.themeOff(); this.done = true; } return; }
      if (this.phase === 'rack') { this.done = true; return; }
      const five = this.res.map((r, i) => i).filter(i => this.res[i].rar === 5 && !this.seen.has(i));
      if (five.length) { this.themeOff(); this.begin(five); } else this.toRack();
    }

    enter() {
      if (this.phase === 'cine') this.begin(this.res.map((r, i) => i));
      else if (this.phase === 'reveal') { if (this.rt < this.intro()) this.rt = this.intro(); else this.next(); }
      else if (this.rt < 0.8) this.rt = 0.8;
      else this.done = true;
    }

    key(k) {
      if (this.phase !== 'rack' || !k) return;
      const n = this.res.length, d = k === 'left' ? -1 : k === 'right' ? 1 : k === 'up' ? -4 : k === 'down' ? 4 : 0;
      if (!d) return;
      const s = Math.max(0, Math.min(n - 1, this.sel + d));
      if (s !== this.sel) { this.sel = s; this.ui.sfx('select'); }
    }

    shot() {
      let s = 0;
      for (const [n, d] of SHOTS) { if (this.t < s + d) return [n, this.t - s]; s += d; }
      const last = SHOTS[SHOTS.length - 1];
      return [last[0], last[1]];
    }

    lot(R, g, t, T) {
      const z = lerp(14, 2, t / BAR);
      R.light({ amb: [0.6, 0.6, 0.66], dir: [0.4, 1, 0.3], sun: [0.75, 0.72, 0.62], fog: { near: 18, far: 46, col: R3.rgb('#b8c4d4'), max: 0.7 } });
      R.look([5.5, 3.6, z + 8.5], [0, 1.6, z - 8], 52);
      R.clear('#8aa8d0', '#d8e0ea');
      R.draw(lotMesh(), M.id());
      R.draw(busMesh(), M.t(0, 0, z));
      const sz = z + 3.4 - 6.8 * seg(t, 0.8, 1.6);
      if (t > 0.8 && t < 1.6) R.streak([-1.3, 2.56, sz], [1.3, 2.56, sz], 0.18, '#5ab8ff', '#5ab8ff', { world: true, a: 0.9 });
      R.glow([0, 3.5, -21.2], 2.2, '#bfe8ff', { a: 0.3, depth: false });
      R.bake();
      K.vignette(g, 0.35);
      K.flash(g, '#000000', 1 - seg(t, 0, 0.25));
    }

    gate(g, t, T) {
      vgrad(g, 0, LH, [[0, '#1c1a30'], [0.6, '#2c2846'], [1, '#141222']]);
      const open = eOut(seg(t, BEAT * 2.4, BEAT * 3.6)), ok = t >= BEAT * 2;
      rect(g, '#f0e8d0', 108, 60, 104, 150);
      lighter(g, () => glow(g, 160, 120, 60, '#fff4d0', 0.5 * open));
      rect(g, '#3a3a4a', 108 - open * 50, 60, 52, 150); rect(g, '#3a3a4a', 160 + open * 50, 60, 52, 150);
      rect(g, '#2a2a36', 158 - open * 50, 60, 2, 150); rect(g, '#2a2a36', 160 + open * 50, 60, 2, 150);
      rect(g, '#5a5a6e', 92, 44, 136, 18); rect(g, '#5a5a6e', 92, 44, 16, 180); rect(g, '#5a5a6e', 212, 44, 16, 180);
      rect(g, '#7a7a90', 92, 44, 136, 3);
      ell(g, ok ? '#5aff7a' : '#ff4a4a', 160, 53, 5, 5);
      lighter(g, () => glow(g, 160, 53, 14, ok ? '#5aff7a' : '#ff4a4a', 0.8));
      g.save(); g.font = 'bold 9px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#f2e8ff'; g.fillText('КОН-ТОН', 132, 56); g.fillText('ВХОД', 190, 56); g.restore();
      const pp = G.bustCanvas(G.lookOf('pompom', this.game), 64), lift = eOut(seg(t, 0.1, 0.7)), bx = 236, by = 112;
      g.save(); g.imageSmoothingEnabled = false; g.drawImage(pp, bx, by, 80, 80); g.restore();
      rect(g, '#c8243a', bx + 22, by + 72, 36, 8);
      g.save(); g.font = 'bold 6px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText('STAFF', bx + 40, by + 79); g.restore();
      const sx = bx + 6 - 12 * seg(t, 0.4, 0.8), sy = by + 46;
      rect(g, '#1a1a22', sx, sy, 22, 10); rect(g, ok ? '#5aff7a' : '#ff3a3a', sx + 2, sy + 3, 6, 4);
      if (t > 0.5 && !ok) lighter(g, () => line(g, rgba('#ff3a3a', 0.8), 1, sx, sy + 5, 200, 150));
      const hy = lerp(260, 168, lift);
      line(g, '#2a3a8a', 2, 128, hy - 24, 170, hy + 30); line(g, '#2a3a8a', 2, 212, hy - 24, 170, hy + 30);
      hand(g, 132, hy + 16, 0.9, 1, false); hand(g, 210, hy + 16, 0.9, 1, true);
      g.save(); g.translate(150, hy - 30); G.itemIcon(g, 'badge', 0, 0, 40); g.restore();
      if (ok) lighter(g, () => glow(g, 170, hy - 10, 28 * (1 - seg(t, BEAT * 2, BEAT * 3)), '#5aff7a', 0.6));
      K.vignette(g, 0.45);
    }

    stageFloor(g, T, dim) {
      vgrad(g, 0, LH, [[0, '#04040c'], [0.62, '#0a0a18'], [1, '#141024']]);
      for (let i = 0; i < 9; i++) { const x = 18 + i * 36; rect(g, rgba('#2a2a40', dim), x, 0, 3, 18); }
      rect(g, rgba('#1a1a2a', dim), 0, 16, LW, 3);
      g.save(); g.translate(CX, 196); g.scale(1, 0.26);
      ell(g, rgba('#1c1a30', 0.9 * dim + 0.1), 0, 0, 170, 170);
      g.restore();
    }

    beam(g, x, col, a, wide) {
      if (a <= 0) return;
      lighter(g, () => {
        poly(g, rgba(col, 0.18 * a), [x - 8, 0, x + 8, 0, x + (wide || 46), 196, x - (wide || 46), 196]);
        g.save(); g.translate(x, 196); g.scale(1, 0.26); glow(g, 0, 0, (wide || 46) * 1.4, col, 0.55 * a); g.restore();
      });
    }

    motes(g, x, T, a) {
      for (let i = 0; i < 18; i++) { const ph = (T * 0.15 + hx(i, 1, 91)) % 1, mx = x + (hx(i, 2, 91) - 0.5) * 60 * (0.3 + ph); rect(g, rgba('#ffffff', Math.sin(Math.PI * ph) * 0.5 * a), Math.round(mx), Math.round(10 + ph * 180), 1, 1); }
    }

    dark(g, t, T) {
      this.stageFloor(g, T, 0.4);
      const on = seg(t, 0.05, 0.12);
      this.beam(g, CX, '#ffffff', on);
      this.motes(g, CX, T, on);
      const run = seg(t, BEAT * 2, BEAT * 3.4);
      if (run > 0 && run < 1) ['amanda', 'makoto', 'talleah'].forEach((id, i) => figure(g, lookOf(id, this.game, false), lerp(-40 - i * 34, LW + 60 - i * 34, run), 200, 2, { s: 0.42, tint: '#05050a', ta: 1 }));
      K.vignette(g, 0.5);
    }

    pick(g, t, T) {
      this.stageFloor(g, T, 0.6);
      const ids = ['amanda', 'makoto', 'talleah'], xs = [96, 160, 224], b = Math.min(3, Math.floor(t / BEAT));
      const settle = this.lead ? ids.indexOf(this.lead) : 1, on = b < 3 ? b : settle, col = b < 3 ? HER[ids[b]] : RCOL[this.best];
      this.beam(g, xs[on], col, 1, 34);
      ids.forEach((id, i) => figure(g, lookOf(id, this.game, false), xs[i], 200, 2, { s: 0.5, tint: i === on ? col : '#05050a', ta: i === on ? 0.55 : 1 }));
      if (b === 3 && this.best === 5) {
        const k = seg(t, BEAT * 3, BEAT * 3.6), f = seg(t, BEAT * 3.5, BAR);
        lighter(g, () => {
          ids.forEach((id, i) => { if (k < 1) poly(g, rgba(HER[id], 0.5 * (1 - f)), [xs[i] - 3, 196, xs[i] + 3, 196, lerp(xs[i], CX, k) + 2, lerp(196, 60, k), lerp(xs[i], CX, k) - 2, lerp(196, 60, k)]); });
          if (f > 0) sparks(g, CX, 60, f, RHOT[5], 40, 97);
          glow(g, CX, 60, 30 * k, '#ffd060', 0.7 * k * (1 - f));
        });
      }
      K.vignette(g, 0.4);
      K.flash(g, '#ffffff', seg(t, BAR - 0.12, BAR));
    }

    pathStencil(g, path, x, y, col, a) {
      if (!H.PATHS[path] || a <= 0) return;
      const cv = G.mkCanvas(40, 40), cg = cv.getContext('2d');
      G.pathIcon(cg, path, 4, 4, 32, col);
      g.save(); g.globalAlpha = cl(a * 0.55); g.translate(x, y); g.scale(1.6, 0.42); g.imageSmoothingEnabled = false; g.drawImage(cv, -20, -20); g.restore();
    }

    charShot(g, r, t, T) {
      const look = lookOf(r.id, this.game, true), col = heroine(r.id) ? HER[r.id] : RCOL[r.rar], d = H.CHARS[r.id];
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, RCOL[r.rar], seg(t, 0.05, 0.15), 50);
      this.pathStencil(g, d.path, CX, 196, RCOL[r.rar], seg(t, 0.1, 0.4));
      this.motes(g, CX, T, 1);
      const walk = sm(seg(t, 0.15, WALK)), x = lerp(-30, CX, walk), step = t < WALK ? Math.abs(Math.sin(t * 14)) * 2 : 0;
      ell(g, 'rgba(0,0,0,0.5)', x, 199, 26, 5);
      figure(g, look, x, 200 - step, 3, { s: 0.6 });
      if (t >= WALK) this.polaroid(g, r, t - WALK, T, col);
      K.vignette(g, 0.4);
      if (t >= WALK) K.flash(g, '#ffffff', 1 - seg(t, WALK, WALK + 0.18));
    }

    polaroid(g, r, t, T, col) {
      const k = eOut(seg(t, 0, SNAP)), px = 84, py = 16, pw = 152, ph = 170, ix = px + 8, iy = py + 8, iw = pw - 16, ih = pw - 16;
      g.save(); g.globalAlpha = k;
      rect(g, 'rgba(2,2,10,0.7)', 0, 0, LW, py); rect(g, 'rgba(2,2,10,0.7)', 0, py + ph, LW, LH - py - ph); rect(g, 'rgba(2,2,10,0.7)', 0, py, px, ph); rect(g, 'rgba(2,2,10,0.7)', px + pw, py, LW - px - pw, ph);
      rect(g, '#f4f2ea', px, py, pw, 8); rect(g, '#f4f2ea', px, iy + ih, pw, ph - 8 - ih); rect(g, '#f4f2ea', px, py, 8, ph); rect(g, '#f4f2ea', px + pw - 8, py, 8, ph);
      rect(g, rgba(col, 0.85), px + pw / 2 - 18, py - 4, 36, 9);
      if (r.rar === 5) lighter(g, () => { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + T; const sx = px + pw / 2 + Math.cos(a) * 100, sy = py + ph / 2 + Math.sin(a) * 86; poly(g, rgba(RHOT[5], 0.8 * seg(t, 0.3, 0.6)), [sx, sy - 5, sx + 1.2, sy, sx, sy + 5, sx - 1.2, sy]); } });
      g.restore();
    }

    easel(g, x, y, s) {
      line(g, '#6a4a2a', 3 * s, x, y, x - 30 * s, y + 120 * s); line(g, '#6a4a2a', 3 * s, x, y, x + 30 * s, y + 120 * s); line(g, '#5a3a20', 3 * s, x, y, x, y + 116 * s);
      rect(g, '#7a5a3a', x - 40 * s, y + 78 * s, 80 * s, 5 * s);
    }

    coneShot(g, r, t, T) {
      const cd = H.CONES[r.id], col = RCOL[r.rar];
      this.stageFloor(g, T, 0.5);
      if (r.rar >= 4) this.beam(g, CX, col, seg(t, 0.05, 0.2), 60);
      this.easel(g, CX, 64, 1);
      const sig = r.rar === 5 && cd && cd.sig && heroine(cd.sig);
      if (sig) { const peek = eOut(seg(t, 0.8, 1.3)); const cv = G.bustCanvas(lookOf(cd.sig, this.game, true), 64); g.save(); g.imageSmoothingEnabled = false; g.drawImage(cv, Math.round(CX + 18 + 26 * peek), 96, 64, 64); g.restore(); }
      const slide = r.rar === 3 ? eOut(seg(t, 0.1, 0.6)) : 1, cx = lerp(-80, CX, slide), w = 66, h = 92;
      rect(g, '#14121c', cx - w / 2 - 2, 46, w + 4, h + 4);
      const art = G.coneArt(r.id, w, h);
      g.save(); g.imageSmoothingEnabled = false; g.drawImage(art, Math.round(cx - w / 2), 48, w, h); g.restore();
      if (r.rar === 3) { g.save(); g.translate(cx + 30, 136); g.rotate(-0.2); rect(g, '#f2ecdc', -14, -7, 28, 14); g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#c8243a'; g.fillText('3★', 0, 3); g.restore(); }
      else lighter(g, () => glow(g, CX, 94, 70, col, 0.25 * seg(t, 0.2, 0.6)));
      K.vignette(g, 0.4);
      K.flash(g, RHOT[r.rar], 0.6 * (1 - seg(t, 0, 0.25)));
    }

    hopShot(g, t) {
      rect(g, '#02030c', 0, 0, LW, LH);
      lighter(g, () => glow(g, CX, 196, 40 * (1 - seg(t, 0, HOP)), '#ffffff', 0.3));
    }

    beatOf(r, t) {
      let at = 0;
      const own = this.own(r);
      for (const [n, d] of own) { if (t < at + d) return [n, t - at, d]; at += d; }
      const last = own[own.length - 1];
      return [last[0], t - at + last[1], last[1]];
    }

    caption(c, line, a, who) {
      if (a <= 0) return;
      const ui = this.ui, s = (who ? who + ': ' : '') + '«' + line + '»', lw = Math.min(600, ui.measure(s, 13, true) + 34);
      c.save(); c.globalAlpha = cl(a);
      c.fillStyle = 'rgba(10,6,24,0.8)'; c.fillRect(Math.round(W / 2 - lw / 2), HGT - 70, Math.round(lw), 26);
      ui.text(s, W / 2, HGT - 65, { size: 13, bold: true, align: 'center', col: '#ffe8f0' });
      c.restore();
    }

    cutShot(g, r, t, T) {
      const own = this.own(r), end = total(own);
      const [n, bt, d] = this.beatOf(r, Math.min(t, end - 0.001));
      const fn = this[r.id + n[0].toUpperCase() + n.slice(1)], cut = n === own[own.length - 1][0] && H.outfitCutOf ? H.outfitCutOf(H.wornOutfit(r.id, this.game), 'warp') : null;
      if (cut && cut.finale) cut.finale(g, bt, T, G.lookOf(r.id, this.game), this.game);
      else if (fn) fn.call(this, g, bt, T, d);
      if (t >= end) { K.vignette(g, 0.5); rect(g, rgba('#05030a', 0.35 * seg(t, end, end + 0.4)), 0, 0, LW, LH); }
    }

    bustAt(look, x, y, size, s, side) {
      const [bx, by] = G.bustEye(look, side), u = size * s / 64;
      return [x + (bx - 32) * u, y - size * s + by * u, u];
    }

    bust(g, look, x, y, size, s, o = {}) {
      const cv = G.bustCanvas(look, size);
      g.save(); g.imageSmoothingEnabled = false; g.translate(Math.round(x), Math.round(y)); if (o.rot) g.rotate(o.rot); if (o.flip) g.scale(-1, 1); g.scale(s, s); g.drawImage(cv, -size / 2, -size); g.restore();
    }

    wink(g, look, x, y, size, s, side, k) {
      if (k <= 0) return;
      const [ex, ey, u] = this.bustAt(look, x, y, size, s, side), P = look.skin || '#feddd0';
      rect(g, P, Math.round(ex - u * 3.8), Math.round(ey - u * 4.2), Math.round(u * 7.6), Math.round(u * 8.4 * k));
      if (k > 0.6) { g.strokeStyle = '#24161f'; g.lineWidth = Math.max(1, u * 1.2); g.beginPath(); g.moveTo(ex - u * 3.8, ey); g.quadraticCurveTo(ex, ey + u * 2.4, ex + u * 3.8, ey); g.stroke(); }
    }

    busCabin(g, T) {
      vgrad(g, 0, LH, [[0, '#d8ccaa'], [1, '#b8a880']]);
      rect(g, '#8aa8cc', 0, 26, LW, 74);
      rect(g, '#7a7a82', 0, 76, LW, 24);
      for (let i = 0; i < 8; i++) { const x = ((i * 74 - T * 160) % 592 + 592) % 592 - 60; rect(g, '#6a4a2a', x, 40, 3, 36); poly(g, '#3a7a4a', [x - 12, 42, x + 1, 36, x + 16, 42, x + 2, 40]); }
      for (let i = 0; i < 12; i++) { const x = ((i * 40 - T * 220) % 480 + 480) % 480 - 40; rect(g, '#e8e8e0', x, 90, 14, 2); }
      for (let x = 0; x < LW; x += 80) rect(g, '#2a2a30', x, 22, 8, 82);
      rect(g, '#2a2a30', 0, 22, LW, 6); rect(g, '#2a2a30', 0, 98, LW, 6);
      rect(g, '#f0e6c8', 0, 0, LW, 22);
    }

    seatBack(g, x, y, w, h) {
      rect(g, '#2a4a36', x, y, w, h); rect(g, '#3a6a4a', x + 3, y + 3, w - 6, h - 4); rect(g, '#5a8a6a', x + 6, y + 5, w - 12, 4);
    }

    makotoBus(g, t, T) {
      this.busCabin(g, T);
      const H0 = H.CHARS.makoto, stu = H0.studentLook || H0.look, am = H.CHARS.amanda.look;
      this.bust(g, am, 262, 168, 64, 1.1);
      this.seatBack(g, 196, 150, 124, 90);
      const narrow = seg(t, 1.4, 1.9);
      if (narrow > 0) for (const side of [-1, 1]) { const [ex, ey, u] = this.bustAt(am, 262, 168, 64, 1.1, side); rect(g, am.skin, Math.round(ex - u * 4), Math.round(ey - u * 4), Math.round(u * 8), Math.round(u * 4 * narrow)); line(g, '#24161f', 1, ex - u * 4, ey - u * 4 + u * 4 * narrow, ex + u * 4, ey - u * 4 + u * 4 * narrow); }
      const slide = eOut(seg(t, 0.2, 0.9)), x = lerp(-70, 128, slide), curl = sm(seg(t, 0.9, 1.5));
      this.bust(g, stu, x, 236, 64, 2.2, { rot: 0.32 * curl });
      poly(g, '#5a5a66', [196, LH, 214, 186, 250, 170, 300, 176, LW, 200, LW, LH]);
      poly(g, '#4a4a56', [214, 186, 250, 170, 262, 190, 230, 206]);
      if (curl > 0.5) lighter(g, () => { for (let i = 0; i < 3; i++) { const k = (T * 0.8 + i * 0.33) % 1; g.save(); g.globalAlpha = (1 - k) * 0.8; g.font = 'bold 9px sans-serif'; g.fillStyle = '#ff9ac8'; g.fillText('z', 170 + i * 6 + k * 10, 120 - k * 30); g.restore(); } });
      this.seatBack(g, 0, 214, 196, 26);
    }

    corridor(g, T, col) {
      vgrad(g, 0, LH, [[0, '#2a2440'], [0.6, '#3a3058'], [1, '#1c1830']]);
      poly(g, '#4a1a2a', [0, LH, 120, 150, 200, 150, LW, LH]);
      for (let i = 0; i < 6; i++) { const y = 150 + i * 16; rect(g, rgba('#7a2a3a', 0.4), 0, y, LW, 1); }
      poly(g, '#221c34', [0, 0, 120, 40, 120, 150, 0, LH]); poly(g, '#221c34', [LW, 0, 200, 40, 200, 150, LW, LH]);
      for (let i = 0; i < 3; i++) { const x = 20 + i * 28; rect(g, ['#e8b040', '#5ab8e8', '#e85a8a'][i], x, 60 + i * 6, 20, 30 - i * 4); rect(g, ['#e8b040', '#5ab8e8', '#e85a8a'][(i + 1) % 3], LW - x - 20, 60 + i * 6, 20, 30 - i * 4); }
      lighter(g, () => glow(g, CX, 40, 80, col || '#ffe0c0', 0.25));
    }

    makotoSnap(g, t, T) {
      const k = seg(t, 0.06, 0.1), H0 = H.CHARS.makoto, stu = H0.studentLook || H0.look;
      this.corridor(g, T, k > 0 ? '#ff3a5a' : null);
      const look = k > 0 ? H0.look : stu;
      if (k > 0) lighter(g, () => { glow(g, CX, 140, 90, '#ff2a4a', 0.5 * (1 - seg(t, 0.1, 0.9)) + 0.15); for (let i = 0; i < 2; i++) { const q = seg(t, 0.06 + i * 0.12, 0.7 + i * 0.12); if (q > 0 && q < 1) ring(g, rgba('#ff5a7a', 1 - q), 2, CX, 140, 20 + q * 120); } });
      ell(g, 'rgba(0,0,0,0.45)', CX, 222, 30, 6);
      const fade = seg(t, 0.06, 0.55);
      if (fade < 1) figure(g, stu, CX, 224, 3, { s: 0.68, tint: fade > 0 ? '#ff3a5a' : null, ta: 0.5 * fade });
      if (fade > 0) figure(g, look, CX, 224, 3, { s: 0.68, a: fade });
      if (t < 0.1) lighter(g, () => { glow(g, CX + 22, 132, 10, '#ffffff', 1 - seg(t, 0, 0.1)); });
      if (k > 0) {
        const gx = CX + 30, gy = 150;
        poly(g, '#1a1a22', [gx, gy, gx + 14, gy - 2, gx + 15, gy + 3, gx + 5, gy + 4, gx + 5, gy + 10, gx, gy + 10]);
        rect(g, '#fb2894', gx + 2, gy, 10, 1); rect(g, '#5ae8f8', gx + 13, gy - 1, 2, 2);
      }
      K.vignette(g, 0.45);
      K.flash(g, '#ff4a6a', 0.8 * (1 - seg(t, 0.06, 0.3)) * (t >= 0.06 ? 1 : 0));
    }

    makotoVault(g, t, T) {
      vgrad(g, 0, LH, [[0, '#1a0a3a'], [0.5, '#4a1a6a'], [1, '#160a26']]);
      g.save(); g.beginPath(); g.ellipse(CX, 150, 190, 150, 0, Math.PI, 0); g.clip();
      for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI; line(g, rgba('#c8a0ff', 0.25), 1, CX, 150, CX + Math.cos(a) * 200, 150 + Math.sin(a) * 160); }
      K.stars(g, T, 40, 61, 0.7, 150);
      g.restore();
      rect(g, '#2a1440', 0, 180, LW, 60);
      rect(g, '#5a3a7a', 140, 150, 40, 32); rect(g, '#7a5a9a', 136, 146, 48, 6);
      const grab = seg(t, 1.0, 1.2), turn = t > 0.75, H0 = H.CHARS.makoto, tl = H.CHARS.talleah.look;
      const sx = lerp(CX, CX - 64, eOut(seg(t, 1.2, 1.7))), sy = lerp(138, 170, eOut(seg(t, 1.2, 1.7)));
      lighter(g, () => glow(g, sx, sy, 14 + 3 * Math.sin(T * 6), '#ff2a3a', 0.9));
      ell(g, '#ff4a5a', sx, sy, 3, 3);
      const throwK = seg(t, 0.3, 0.75);
      if (throwK > 0 && throwK < 1) lighter(g, () => glow(g, lerp(CX - 70, 290, throwK), 160 - Math.sin(throwK * Math.PI) * 60, 6, '#ff3a3a', 1));
      if (throwK >= 1) lighter(g, () => glow(g, 290, 196, 8 * (1 - seg(t, 0.75, 1.2)), '#ff3a3a', 1));
      figure(g, tl, 252, 214, 3, { s: 0.55, flip: !turn });
      const port = seg(t, 1.7, 2.4), mx = lerp(CX - 90, CX - 64, eOut(seg(t, 0.6, 1.0)));
      if (port < 1) figure(g, H0.look, mx, 214, 3, { s: 0.55, a: 1 - seg(t, 1.9, 2.3) });
      if (t > 1.6) lighter(g, () => { const r = lerp(40, 0, port); if (r > 1) { ring(g, '#ff3a5a', 3, CX - 64, 170, r); glow(g, CX - 64, 170, r, '#ff2a4a', 0.4); } });
      K.vignette(g, 0.5);
    }

    makotoPose(g, t, T) {
      this.stageFloor(g, T, 0.7);
      const on = seg(t, 0.02, 0.12), look = H.CHARS.makoto.look;
      this.beam(g, CX, '#ff3a5a', on, 70);
      this.motes(g, CX, T, on);
      const push = eOut(seg(t, 0.4, 1.2)), s = lerp(2.2, 3.2, push), y = lerp(240, 262, push);
      this.bust(g, look, CX, y, 64, s);
      const lift = seg(t, 0.9, 1.4) * (1 - seg(t, 1.9, 2.3));
      if (lift > 0) { const [ex, ey, u] = this.bustAt(look, CX, y, 64, s, 1); hand(g, ex + u * 2, ey + 40 - 30 * lift, 0.7, lift, true); line(g, rgba('#ffffff', 0.6 * lift), 1, ex - u * 5, ey - u * 3, ex + u * 5, ey - u * 3); }
      this.wink(g, look, CX, y, 64, s, -1, seg(t, MK * 0.72, MK * 0.78) * (1 - seg(t, MK * 0.95, MK)));
      if (t > MK * 0.75) lighter(g, () => { const k = seg(t, MK * 0.75, MK); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + k * 2; const px = CX + 60 + Math.cos(a) * 30 * k, py = 120 + Math.sin(a) * 26 * k; poly(g, rgba('#ffd060', 1 - k), [px, py - 5, px + 1.4, py, px, py + 5, px - 1.4, py]); } });
      K.vignette(g, 0.4);
    }

    heartPath(g, x, y, r) {
      g.beginPath();
      g.moveTo(x, y + r * 0.95);
      g.bezierCurveTo(x - r * 1.35, y + r * 0.05, x - r * 0.95, y - r * 1.05, x, y - r * 0.4);
      g.bezierCurveTo(x + r * 0.95, y - r * 1.05, x + r * 1.35, y + r * 0.05, x, y + r * 0.95);
      g.closePath();
    }

    wand(g, x, y, s, a) {
      g.save(); g.globalAlpha = cl(a); g.translate(x, y); g.scale(s, s);
      rect(g, '#ff7ab8', -1, 0, 2, 28);
      poly(g, '#fbf4f8', [-4, -1, -14, -8, -11, 1]); poly(g, '#fbf4f8', [4, -1, 14, -8, 11, 1]);
      this.heartPath(g, 0, -2, 6); g.fillStyle = '#c5883d'; g.fill();
      this.heartPath(g, 0, -2, 4.6); g.fillStyle = '#ff4a96'; g.fill();
      g.restore();
    }

    amandaCall(g, t, T) {
      this.corridor(g, T);
      const look = H.CHARS.amanda.lanternLook || H.CHARS.amanda.look, x = CX, y = 250, s = 2.6;
      this.bust(g, look, x, y, 64, s);
      const ear = t > 0.9, [ex, ey, u] = this.bustAt(look, x, y, 64, s, 1);
      if (!ear) {
        const bz = Math.sin(T * 60) * 1.5, px = 248 + bz, py = 196;
        rect(g, '#16161c', px, py, 18, 30); rect(g, '#5ab8ff', px + 2, py + 3, 14, 18);
        lighter(g, () => { for (let i = 1; i <= 2; i++) ring(g, rgba('#ffffff', 0.5 * (1 - (T * 2 % 1))), 1, px + 9, py + 12, 14 * i + (T * 20 % 8)); });
      } else {
        const fx = ex + u * 13, fy = ey + u * 4;
        rect(g, '#16161c', fx - 4, fy - 16, 10, 22);
        hand(g, fx + 2, fy + 18, 0.8, 1, true);
      }
      K.vignette(g, 0.45);
    }

    amandaMoths(g, t, T, d) {
      this.corridor(g, T, '#ff6aa8');
      rect(g, rgba('#2a0a20', 0.35), 0, 0, LW, LH);
      const look = H.CHARS.amanda.lanternLook || H.CHARS.amanda.look, close = seg(t, d * 0.55, d * 0.95);
      ell(g, 'rgba(0,0,0,0.45)', CX, 222, 30, 6);
      figure(g, look, CX, 224, 3, { s: 0.68 });
      const wx = CX + Math.cos(T * 4) * 22, wy = 70 + Math.sin(T * 4) * 10;
      this.wand(g, wx, wy, 1.2, 1 - close);
      lighter(g, () => {
        for (let i = 0; i < 36; i++) {
          const k = (t * 0.6 + hx(i, 1, 97)) % 1, a = hx(i, 2, 97) * Math.PI * 2 + k * 3, r = (1 - k) * (90 + hx(i, 3, 97) * 60), px = CX + Math.cos(a) * r, py = 140 + Math.sin(a) * r * 0.8;
          if (i % 5 === 0) { g.fillStyle = rgba('#ff9ad0', 0.9); this.heartPath(g, px, py, 3); g.fill(); }
          else { rect(g, rgba(i % 2 ? '#ff7ab8' : '#ffd0e8', 0.9), px - 2, py, 2, 1); rect(g, rgba('#ffd0e8', 0.9), px + 1, py, 2, 1); }
        }
        glow(g, CX, 140, 40 + 40 * close, '#ff6aa8', 0.3 + 0.4 * close);
      });
      if (close > 0) {
        g.save(); this.heartPath(g, CX, 150, lerp(160, 70, eOut(close))); g.lineWidth = 3; g.strokeStyle = rgba('#ff5aa0', close); g.stroke(); g.fillStyle = rgba('#ff8ac8', 0.75 * close); g.fill(); g.restore();
      }
      K.vignette(g, 0.45);
    }

    amandaBurst(g, t, T, d) {
      vgrad(g, 0, LH, [[0, '#3a0a2a'], [0.6, '#6a1a4a'], [1, '#2a0a20']]);
      lighter(g, () => { for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + T * 0.4; poly(g, rgba('#ff9ad0', 0.12), [CX, 120, CX + Math.cos(a) * 300, 120 + Math.sin(a) * 300, CX + Math.cos(a + 0.12) * 300, 120 + Math.sin(a + 0.12) * 300]); } });
      const k = seg(t, 0, 0.5), base = H.CHARS.amanda.pinkLook || H.CHARS.amanda.look, look = this.noWand || (this.noWand = Object.assign({}, base, { acc: (base.acc || []).filter(a => !a.startsWith('heartwand')) }));
      if (k < 1) lighter(g, () => { for (let i = 0; i < 24; i++) { const a = hx(i, 1, 89) * Math.PI * 2, v = 30 + hx(i, 2, 89) * 140, px = CX + Math.cos(a) * v * eOut(k), py = 150 + Math.sin(a) * v * eOut(k); g.fillStyle = rgba(i % 2 ? '#ff5aa0' : '#ffd0e8', 1 - k); this.heartPath(g, px, py, 4 + 3 * (1 - k)); g.fill(); } });
      const trail = seg(t, 0.1, 0.9);
      lighter(g, () => { for (let i = 0; i < 20; i++) { const q = i / 20, px = lerp(40, CX, q), py = lerp(30, 120, q) + Math.sin(q * 9 + T * 6) * 6; if (q < trail) rect(g, rgba('#ffd0e8', 0.8 * (1 - (trail - q))), px, py, 3, 3); } });
      ell(g, 'rgba(0,0,0,0.45)', CX, 222, 32, 6);
      figure(g, look, CX, 224 - 8 * eOut(seg(t, 0.1, 0.5)), 3, { s: 0.7 });
      this.wand(g, CX + 44, 60 - 10 * eOut(seg(t, 0.4, 0.8)), 1.3, seg(t, 0.3, 0.6));
      K.vignette(g, 0.4);
      K.flash(g, '#ffffff', 0.9 * (1 - seg(t, 0, 0.3)));
    }

    amandaBlush(g, t, T, d) {
      this.stageFloor(g, T, 0.7);
      this.beam(g, CX, '#ff6aa8', 1, 80);
      const look = H.CHARS.amanda.pinkLook || H.CHARS.amanda.look, x = CX, y = 244, s = 2.7, red = seg(t, 0.2, 1.0);
      this.bust(g, look, x, y, 64, s);
      for (const side of [-1, 1]) {
        const [ex, ey, u] = this.bustAt(look, x, y, 64, s, side);
        ell(g, rgba('#ff5a7a', 0.55 * red), ex + side * u * 1.5, ey + u * 7, u * 4, u * 2);
        ell(g, rgba('#ff5a7a', 0.5 * red), ex + side * u * 14, ey + u * 2, u * 2.2, u * 3.4);
        const fr = seg(t, 0.9, 1.3) * (1 - seg(t, d * 0.7, d * 0.8));
        if (fr > 0) line(g, rgba('#5a3a20', fr), Math.max(1, u * 1.1), ex - u * 4, ey - u * (side < 0 ? 6.4 : 5), ex + u * 4, ey - u * (side < 0 ? 5 : 6.4));
      }
      const up = eOut(seg(t, d * 0.65, d * 0.8)), tx = 262, ty = lerp(260, 176, up);
      g.save(); g.translate(tx, ty);
      rect(g, '#3a2030', -13, -8, 26, 24); rect(g, '#3a2030', -6, -26, 12, 20);
      rect(g, '#f2e0ec', -11, -6, 22, 20); rect(g, '#f2e0ec', -4, -24, 8, 20);
      rect(g, '#d8c0d0', 5, -6, 6, 20); rect(g, '#d8c0d0', -11, 1, 22, 1); rect(g, '#d8c0d0', -11, 7, 22, 1);
      rect(g, '#ff7ab8', -11, 12, 22, 3);
      g.restore();
      for (let i = 0; i < 26; i++) {
        const cx2 = 6 + i * 13, cy2 = 222 + (i % 3) * 6, hop = Math.abs(Math.sin(T * 14 + i)) * 3;
        ell(g, '#0a0816', cx2, cy2 - hop, 6, 6); rect(g, '#0a0816', cx2 - 8, cy2 + 4 - hop, 16, 20);
        const clap = Math.sin(T * 20 + i) > 0 ? 2 : 5;
        rect(g, '#0a0816', cx2 - clap - 2, cy2 - 14 - hop, 2, 8); rect(g, '#0a0816', cx2 + clap, cy2 - 14 - hop, 2, 8);
      }
      K.vignette(g, 0.4);
    }

    gynoidAt(g, x, y, size, o = {}) {
      g.save(); g.translate(Math.round(x), Math.round(y)); if (o.rot) g.rotate(o.rot); if (o.a != null) g.globalAlpha = cl(o.a);
      G.drawEnemy(g, { id: 'gynoid' }, 0, 0, size, { t: o.t || 0, aura: false });
      g.restore();
    }

    blaster(g, x, y, s, flip) {
      g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
      rect(g, '#2a2e3a', -2, -1, 18, 8); rect(g, '#c8d0e0', -1, 0, 16, 5); rect(g, '#8a94a8', -1, 4, 16, 1);
      rect(g, '#2a2e3a', 2, 6, 5, 8); rect(g, '#8a94a8', 3, 7, 3, 6);
      ell(g, '#2a2e3a', 8, -2, 4.6, 4.6); ell(g, '#5ab8ff', 8, -2, 3.6, 3.6); ell(g, '#e4f8ff', 7, -3, 1.2, 1.2);
      rect(g, '#2a2e3a', 15, 1, 4, 3);
      g.restore();
    }

    talleahLawn(g, t, T, d) {
      vgrad(g, 0, LH, [[0, '#4a8ae0'], [0.7, '#9ac8f4'], [1, '#d8ecfc']]);
      for (let i = 0; i < 6; i++) { const x = ((i * 70 + T * 8) % 400) - 40, y = 40 + (i % 3) * 50; ell(g, '#f4f8fc', x, y, 30, 10); ell(g, '#f4f8fc', x + 18, y - 6, 18, 9); ell(g, '#e4ecf6', x + 6, y + 4, 26, 6); }
      rect(g, '#5aa84a', 0, 226, LW, 14);
      const lean = eOut(seg(t, 0.05, 0.9)), look = H.CHARS.talleah.look, by = lerp(-170, 0, lean);
      for (const sd of [-1, 1]) this.gynoidAt(g, CX + sd * 104, lerp(-160, -84, eOut(seg(t, 0.4, 1.2))), 150, { rot: Math.PI, t: T });
      this.bust(g, look, CX, by, 64, 2.5, { rot: Math.PI });
      if (t > 1.15 && t < 1.7) lighter(g, () => { for (let i = 0; i < 3; i++) { line(g, rgba('#ffffff', 0.8), 2, CX + 70 + i * 8, 150 - i * 10, CX + 82 + i * 10, 146 - i * 14); } });
      K.vignette(g, 0.35);
    }

    door(g, x, y, open) {
      rect(g, '#1a1418', x - 4, y - 4, 72, 144);
      rect(g, '#fff4d0', x, y, 64, 136);
      lighter(g, () => glow(g, x + 32, y + 68, 60 * open, '#fff0c0', 0.5 * open));
      const w = Math.round(64 * (1 - open * 0.6));
      rect(g, '#7a4a2a', x, y, w, 136); rect(g, '#5a3420', x + 6, y + 8, w - 12, 50); rect(g, '#5a3420', x + 6, y + 70, w - 12, 58);
      return [x + w - 12, y + 72];
    }

    talleahKnob(g, t, T, d) {
      this.corridor(g, T);
      const look = H.CHARS.talleah.look, [kx, ky] = this.door(g, 176, 70, seg(t, d * 0.72, d * 0.9));
      const turn = seg(t, d * 0.6, d * 0.72);
      ell(g, '#8a6a20', kx, ky, 5, 5); ell(g, '#e8c040', kx, ky, 4, 4);
      line(g, '#5a4010', 1.5, kx - Math.cos(turn * 2) * 3, ky - Math.sin(turn * 2) * 3, kx + Math.cos(turn * 2) * 3, ky + Math.sin(turn * 2) * 3);
      if (t > d * 0.5 && t < d * 0.85) hand(g, kx + 6, lerp(260, ky + 22, eOut(seg(t, d * 0.5, d * 0.6))), 0.7, 1, true);
      const fury = t < d * 0.55, hop = fury ? Math.abs(Math.sin(t * 9)) * 12 : 0, sx = fury ? 116 + Math.sin(t * 5) * 8 : 112;
      ell(g, 'rgba(0,0,0,0.4)', sx, 222, 22, 5);
      figure(g, look, sx, 224 - hop, 3, { s: 0.6, flip: fury && Math.sin(t * 5) < 0 });
      if (fury) lighter(g, () => { for (let i = 0; i < 4; i++) { const a = -2.2 + i * 0.4 + Math.sin(T * 12 + i) * 0.1; line(g, rgba('#ffffff', 0.8), 2, sx + Math.cos(a) * 34, 80 + Math.sin(a) * 30, sx + Math.cos(a) * 46, 80 + Math.sin(a) * 42); } });
      if (t > d * 0.82) { const k = seg(t, d * 0.82, d); lighter(g, () => { glow(g, sx, 70, 20, '#ffffff', 0.6 * (1 - k)); }); g.save(); g.font = 'bold 20px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = rgba('#ffe060', 1 - k * 0.3); g.fillText('!', sx + 22, 74 - 6 * k); g.restore(); }
      K.vignette(g, 0.45);
    }

    standee(g, x, y, wob) {
      g.save(); g.translate(x, y); g.rotate(wob);
      rect(g, '#8a6a40', -4, -6, 8, 6);
      poly(g, '#2a1a3a', [-26, 0, 26, 0, 22, -80, 30, -96, 0, -120, -30, -96, -22, -80]);
      poly(g, '#4a1a5a', [-20, -4, 20, -4, 16, -78, -16, -78]);
      ell(g, '#c8a8d8', 0, -100, 11, 13); poly(g, '#2a1a3a', [-12, -108, 12, -108, 8, -122, 0, -114, -8, -122]);
      rect(g, '#1a0a1a', -6, -96, 12, 2); poly(g, '#e8e0f0', [-5, -93, 5, -93, 0, -90]);
      rect(g, '#b89060', -27, -2, 54, 3);
      g.restore();
    }

    talleahStandee(g, t, T, d) {
      this.corridor(g, T);
      const look = H.CHARS.talleah.look, hit = seg(t, 0.4, 0.55), wob = Math.sin(t * 18) * 0.12 * (1 - seg(t, 0.55, 1.4)) * (t > 0.5 ? 1 : 0) + Math.sin(T * 3) * 0.01;
      this.standee(g, 222, 222, wob + (t > 2.0 && t < 2.6 ? Math.sin(t * 20) * 0.03 : 0));
      const run = eOut(seg(t, 0, 0.5)), back = eOut(seg(t, 0.55, 0.9)), sx = lerp(40, 186, run) - 26 * back;
      ell(g, 'rgba(0,0,0,0.4)', sx, 222, 22, 5);
      figure(g, look, sx, 224 - (t > 0.55 && t < 0.9 ? 6 : 0), 3, { s: 0.6 });
      if (hit > 0 && hit < 1) lighter(g, () => { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; line(g, rgba('#ffffff', 1 - hit), 2, 196 + Math.cos(a) * 8, 130 + Math.sin(a) * 8, 196 + Math.cos(a) * (14 + 20 * hit), 130 + Math.sin(a) * (14 + 20 * hit)); } });
      if (t > 0.95 && t < 1.95) { this.blaster(g, sx + 12, 150, 1.6, false); lighter(g, () => glow(g, sx + 26, 147, 8 + 2 * Math.sin(T * 10), '#5ab8ff', 0.6)); }
      if (t > 2.0) { const pat = Math.abs(Math.sin((t - 2.0) * 12)) * 6; hand(g, 206, 132 + pat, 0.55, 1, true); }
      K.vignette(g, 0.45);
    }

    talleahSalute(g, t, T, d) {
      this.stageFloor(g, T, 0.7);
      this.beam(g, CX, '#4a90e0', seg(t, 0.02, 0.12), 90);
      const look = H.CHARS.talleah.look, x = CX, y = 250, s = 2.7, up = eOut(seg(t, 0.4, 0.8)), rep = eOut(seg(t, 1.3, 1.8));
      for (const sd of [-1, 1]) {
        const gx = CX + sd * 104;
        this.gynoidAt(g, gx, 230, 150, { t: T, a: seg(t, 0.8, 1.2) });
        if (rep > 0) { const hy = lerp(170, 98, rep); rect(g, '#bbc8e7', gx - sd * 10 - 6, hy - 1, 14, 12); rect(g, '#14161e', gx - sd * 10 - 5, hy, 12, 10); }
      }
      this.bust(g, look, x, y, 64, s);
      if (up > 0) { const [ex, ey, u] = this.bustAt(look, x, y, 64, s, 1); g.save(); g.translate(ex + u * 9, ey - u * 7 + (1 - up) * 60); g.rotate(-0.45); g.scale(1.7, 1.7); rect(g, '#1a2a44', -14, -6, 30, 13); rect(g, '#bdd6f3', -12, -4, 24, 9); rect(g, '#a4c0e4', -12, 1, 24, 1); rect(g, '#1a2a44', 10, -7, 12, 15); rect(g, '#e2e8f8', 11, -6, 10, 13); g.restore(); }
      if (t > d * 0.7) lighter(g, () => { const k = seg(t, d * 0.7, d); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + k * 2, px = x + Math.cos(a) * 110 * k, py = 120 + Math.sin(a) * 80 * k; poly(g, rgba(i % 2 ? '#7ab4ff' : '#ffffff', 1 - k), [px, py - 5, px + 1.4, py, px, py + 5, px - 1.4, py]); } });
      K.vignette(g, 0.4);
    }

    catSticker(g, x, y, s) {
      g.save(); g.translate(x, y); g.scale(s, s);
      ell(g, '#ffffff', 0, 0, 9, 9);
      poly(g, '#ffffff', [-9, -2, -8, -13, -2, -8]); poly(g, '#ffffff', [9, -2, 8, -13, 2, -8]);
      ell(g, '#e0304a', 0, 0, 7.5, 7.5);
      poly(g, '#e0304a', [-7.5, -2, -6.6, -11, -1.6, -6.4]); poly(g, '#e0304a', [7.5, -2, 6.6, -11, 1.6, -6.4]);
      rect(g, '#ffd060', -4, -2, 2, 2); rect(g, '#ffd060', 2, -2, 2, 2);
      g.restore();
    }

    kazumaGate(g, t, T) {
      vgrad(g, 0, LH, [[0, '#1c1a30'], [0.6, '#2c2846'], [1, '#141222']]);
      rect(g, '#3a3a4a', 108, 60, 104, 150);
      rect(g, '#5a5a6e', 92, 44, 136, 18); rect(g, '#5a5a6e', 92, 44, 16, 180); rect(g, '#5a5a6e', 212, 44, 16, 180);
      ell(g, '#ff4a4a', 160, 53, 5, 5);
      lighter(g, () => glow(g, 160, 53, 14, '#ff4a4a', 0.8));
      const kz = G.lookOf('kazuma', this.game), walk = eOut(seg(t, 0, 0.5)), kx = lerp(-20, 92, walk);
      ell(g, 'rgba(0,0,0,0.4)', kx, 222, 20, 5);
      figure(g, kz, kx, 224 - (t < 0.5 ? Math.abs(Math.sin(t * 14)) * 2 : 0), 3, { s: 0.6 });
      const pp = G.bustCanvas(G.lookOf('pompom', this.game), 64), block = eOut(seg(t, 0.35, 0.6));
      g.save(); g.imageSmoothingEnabled = false; g.drawImage(pp, Math.round(lerp(250, 120, block)), 132, 88, 88); g.restore();
      rect(g, '#c8243a', lerp(250, 120, block) + 26, 210, 36, 8);
      g.save(); g.font = 'bold 6px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText('STAFF', lerp(250, 120, block) + 44, 217); g.restore();
      if (block > 0.9) { g.save(); g.font = 'bold 26px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = rgba('#ff4a4a', 0.9); g.fillText('✕', 164, 124); g.restore(); }
      K.vignette(g, 0.45);
    }

    kazumaSteal(g, t, T) {
      vgrad(g, 0, LH, [[0, '#0a1a10'], [1, '#14281a']]);
      const k = seg(t, 0.02, 0.5), kz = G.lookOf('kazuma', this.game);
      lighter(g, () => { glow(g, CX, 130, 60 + 140 * k, '#5aff7a', 0.8 * (1 - k * 0.6)); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + k; line(g, rgba('#9affb0', 0.7 * (1 - k)), 2, CX + Math.cos(a) * 30, 130 + Math.sin(a) * 30, CX + Math.cos(a) * (40 + 120 * k), 130 + Math.sin(a) * (40 + 120 * k)); } });
      ell(g, 'rgba(0,0,0,0.45)', CX, 222, 26, 6);
      figure(g, kz, CX, 224, 3, { s: 0.68 });
      const up = eOut(seg(t, 0.25, 0.6)), bx = CX + 26, by = lerp(170, 92, up);
      hand(g, bx + 10, by + 34, 0.7, up, true);
      g.save(); g.globalAlpha = up; g.translate(bx - 6, by - 10); G.itemIcon(g, 'badge', 0, 0, 32); g.restore();
      if (up > 0.5) { const st = H.CHARS.makoto.studentLook || H.CHARS.makoto.look; g.save(); g.globalAlpha = up; G.drawPortrait(g, st, bx + 2, by + 9, 8); g.restore(); }
      K.vignette(g, 0.4);
      K.flash(g, '#9affb0', 0.7 * (1 - seg(t, 0.02, 0.3)) * (t >= 0.02 ? 1 : 0));
    }

    kazumaStage(g, t, T) {
      this.stageFloor(g, T, 0.6);
      this.beam(g, CX, '#c08aff', 1, 60);
      const kz = G.lookOf('kazuma', this.game), mk = H.CHARS.makoto.look, rise = seg(t, 0.6, 1.0), take = seg(t, 1.0, 1.3);
      figure(g, mk, CX + 40 - 10 * rise, 220, 3, { s: 0.6, a: 0.2 + 0.8 * rise * (1 - seg(t, 1.5, 1.8)), tint: '#05030a', ta: 0.7 * (1 - rise * 0.6) });
      ell(g, 'rgba(0,0,0,0.45)', CX, 222, 26, 6);
      figure(g, kz, CX, 224, 3, { s: 0.68 });
      const bx = lerp(CX + 30, CX + 60, take), by = lerp(98, 110, take);
      if (take < 1) { g.save(); g.translate(bx - 6, by - 10); G.itemIcon(g, 'badge', 0, 0, 28); g.restore(); }
      if (take > 0.6) this.catSticker(g, CX + 30, 132, 0.9);
      if (take > 0 && take < 1) lighter(g, () => glow(g, CX + 40, 110, 14, '#ff3a5a', 0.7));
      K.vignette(g, 0.4);
    }

    kazumaPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#c08aff', 1, 70);
      const kz = G.lookOf('kazuma', this.game), x = CX - 30, y = 250, s = 2.6;
      this.bust(g, kz, x, y, 64, s);
      for (const side of [-1, 1]) { const [ex, ey, u] = this.bustAt(kz, x, y, 64, s, side); rect(g, kz.skin || '#f2d6c2', Math.round(ex - u * 4), Math.round(ey - u * 4), Math.round(u * 8), Math.round(u * 3.6)); }
      hand(g, 236, 214, 1.1, 1, true);
      this.catSticker(g, 232, 190, 1.1);
      const sigh = seg(t, 0.55, 1.4);
      if (sigh > 0 && sigh < 1) { const [ex, ey, u] = this.bustAt(kz, x, y, 64, s, 1); g.save(); g.globalAlpha = 1 - sigh; ell(g, '#e8eef8', ex + u * 8 + sigh * 20, ey + u * 12 - sigh * 6, 6 + sigh * 6, 4 + sigh * 3); g.restore(); }
      K.vignette(g, 0.4);
    }

    conHall(g, T) {
      vgrad(g, 0, LH, [[0, '#16121e'], [0.5, '#2a2030'], [1, '#1a1420']]);
      for (let i = 0; i < 6; i++) { const x = 26 + i * 54; line(g, '#3a3040', 1, x, 0, x, 22); poly(g, '#5a4a32', [x - 10, 22, x + 10, 22, x + 6, 28, x - 6, 28]); }
      lighter(g, () => { for (let i = 0; i < 6; i++) glow(g, 26 + i * 54, 32, 34, '#ffd890', 0.3); });
      for (let i = 0; i < 5; i++) {
        const x = 8 + i * 64;
        for (let k = 0; k < 3; k++) rect(g, ['#e8b040', '#5ab8e8', '#e85a8a'][(i + k) % 3], x + 6 + k * 16, 66 + ((i + k) % 2) * 5, 12, 24);
        rect(g, '#3a2a3a', x, 92, 52, 24); rect(g, '#5a3a4a', x, 92, 52, 3);
      }
      for (let i = 0; i < 9; i++) { const x = ((i * 44 + T * (10 + i % 3 * 4) * (i % 2 ? 1 : -1)) % 380 + 380) % 380 - 30; ell(g, '#100c16', x, 100, 6, 7); rect(g, '#100c16', x - 7, 106, 14, 24); }
      rect(g, '#221a26', 0, 128, LW, LH - 128);
      for (let i = 0; i < 5; i++) rect(g, rgba('#3a2a3a', 0.6), 0, 136 + i * 22, LW, 1);
    }

    doodle(g, x, y, s, p, col) {
      const S = [[4, 28, 44, 28], [4, 28, 4, 14], [4, 14, 36, 14], [36, 14, 44, 22], [44, 22, 44, 28], [9, 17, 15, 17], [15, 17, 15, 22], [15, 22, 9, 22], [9, 22, 9, 17], [20, 17, 26, 17], [26, 17, 26, 22], [26, 22, 20, 22], [20, 22, 20, 17], [30, 14, 30, 8], [30, 8, 34, 8], [34, 8, 34, 14]];
      const n = S.length * cl(p), w = Math.max(1, s * 0.9);
      let tip = null;
      for (let i = 0; i < Math.ceil(n); i++) {
        const [a, b, c, d] = S[i], k = Math.min(1, n - i), ex = a + (c - a) * k, ey = b + (d - b) * k;
        line(g, col, w, x + a * s, y + b * s, x + ex * s, y + ey * s);
        tip = [x + ex * s, y + ey * s];
      }
      if (p >= 1) for (const wx of [12, 34]) ring(g, col, w, x + wx * s, y + 30 * s, 3 * s);
      return tip;
    }

    weltAlley(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('welt', this.game);
      figure(g, look, 104, 318, 3, { s: 0.88 });
      poly(g, '#4a3630', [0, 166, LW, 166, LW, LH, 0, LH]);
      rect(g, '#6a4a7a', 0, 166, LW, 4);
      g.save(); g.translate(46, 184); g.rotate(-0.06); rect(g, '#f2ecdc', -26, -9, 52, 18); g.font = 'bold 7px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#3a2a4a'; g.fillText('НАБРОСКИ', 0, 3); g.restore();
      g.save(); g.translate(234, 186); g.rotate(-0.08);
      rect(g, 'rgba(0,0,0,0.35)', -60, -18, 124, 42);
      rect(g, '#f4f0e4', -60, -20, 58, 40); rect(g, '#fbf8ee', 2, -20, 58, 40); line(g, '#c8c0b0', 1, 0, -20, 0, 20);
      for (let i = 0; i < 4; i++) line(g, rgba('#a8a090', 0.6), 1, -54, -12 + i * 9, -8, -12 + i * 9);
      const tip = this.doodle(g, 7, -17, 1.0, seg(t, 0.3, 1.5), '#2a2a34');
      if (tip && t < 1.6) { line(g, '#1e1e22', 2, tip[0], tip[1], tip[0] + 9, tip[1] - 13); ell(g, '#1e1e22', tip[0] + 12, tip[1] - 15, 6, 4); }
      g.restore();
      K.vignette(g, 0.4);
    }

    weltFlip(g, t, T) {
      vgrad(g, 0, LH, [[0, '#4a3020'], [1, '#2e1c12']]);
      for (let i = 0; i < 9; i++) line(g, rgba('#6a4a30', 0.5), 1, 0, 12 + i * 27, LW, 18 + i * 27);
      rect(g, 'rgba(0,0,0,0.4)', 26, 30, 270, 190);
      rect(g, '#f4f0e4', 22, 24, 136, 190); rect(g, '#fbf8ee', 162, 24, 136, 190); rect(g, '#c8c0b0', 158, 24, 4, 190);
      const FL = BEAT / 2, run = t < 1.4, f = run ? Math.floor(t / FL) : Math.floor(1.4 / FL), k = run ? (t % FL) / FL : 1;
      const dx = Math.min(f, 6) * 10 - 20;
      this.doodle(g, 30, 70, 2.2, 1, rgba('#a8a090', 0.55));
      this.doodle(g, 166 + dx, 70, 2.2, 1, '#2a2a34');
      for (let i = 0; i < 3; i++) line(g, '#2a2a34', 2, 162 + dx - 8 - i * 6, 112 + i * 10, 162 + dx - 26 - i * 10, 112 + i * 10);
      if (run) {
        const ex = lerp(298, 162, eOut(k)), lift = Math.sin(Math.PI * k) * 18;
        poly(g, 'rgba(0,0,0,0.25)', [ex, 24, 298, 24, 298, 214, ex, 214]);
        poly(g, '#ece6d6', [162, 24, ex, 24 - lift, ex, 214 - lift * 0.4, 162, 214]);
        line(g, '#c8c0b0', 1, ex, 24 - lift, ex, 214 - lift * 0.4);
      } else lighter(g, () => { const q = seg(t, 1.45, BAR); glow(g, 166 + dx + 54, 104, 50, '#ffe8a0', 0.5 * Math.sin(Math.PI * q)); sparks(g, 166 + dx + 54, 104, q, '#ffe8a0', 12, 33); });
      hand(g, 288, 238, 0.9, 1, true);
      K.vignette(g, 0.35);
    }

    weltGravity(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('welt', this.game), held = seg(t, 0.42, 0.5), drop = seg(t, 1.2, 1.75);
      rect(g, '#3a2a4a', 146, 176, 84, 8); rect(g, '#2a1e30', 150, 184, 4, 40); rect(g, '#2a1e30', 222, 184, 4, 40);
      const walk = eOut(seg(t, 0, 0.3)), px = lerp(350, 272, walk), trip = seg(t, 0.28, 0.42);
      if (held > 0) lighter(g, () => {
        glow(g, 226, 112, 100, '#8a4aff', 0.45 * held * (1 - drop * 0.8));
        for (let i = 0; i < 3; i++) { const q = ((T * 0.7 + i / 3) % 1); ring(g, rgba('#c8a0ff', (1 - q) * 0.6 * held * (1 - drop)), 2, 226, 112, 20 + q * 80); }
        line(g, rgba('#c8a0ff', 0.5 * held * (1 - drop)), 2, 112, 150, 226, 112);
      });
      ell(g, 'rgba(0,0,0,0.45)', 96, 222, 26, 6);
      figure(g, look, 96, 224, 3, { s: 0.68 });
      if (held > 0) lighter(g, () => glow(g, 110, 150, 16, '#c8a0ff', 0.8 * held * (1 - drop)));
      const pp = G.bustCanvas(G.lookOf('pompom', this.game), 64);
      g.save(); g.imageSmoothingEnabled = false; g.translate(px, 214); g.rotate(-0.4 * trip * (1 - drop)); g.drawImage(pp, -40, -80, 80, 80); g.restore();
      for (let i = 0; i < 5; i++) {
        const sx = px - 4, sy = 128 - i * 13, fly = Math.min(t, 0.42) - 0.3;
        const vx = -60 - hx(i, 1, 57) * 260, vy = -80 - i * 30;
        let x = sx, y = sy, r = Math.sin(T * 9 + i) * 0.04 * (1 - trip);
        if (fly > 0) { x = sx + vx * fly; y = sy + vy * fly + 260 * fly * fly; r = (hx(i, 2, 57) - 0.5) * 9 * fly; }
        if (held > 0) { x += Math.sin(T * 2 + i) * 2 * (1 - drop); y += Math.cos(T * 2.4 + i * 1.7) * 2 * (1 - drop); r += (hx(i, 3, 57) - 0.5) * 0.6 * seg(t, 0.42, 1.2); }
        if (drop > 0) { const e = eOut(drop); x = lerp(x, 188, e); y = lerp(y, 169 - i * 13, e); r = lerp(r, 0, e); }
        g.save(); g.translate(x, y); g.rotate(r);
        rect(g, '#b88a58', -13, -7, 26, 13); rect(g, '#d8aa70', -13, -7, 26, 3); rect(g, '#c8243a', -3, -4, 6, 8);
        g.restore();
        if (held > 0 && drop < 1) lighter(g, () => glow(g, x, y, 14, '#a070ff', 0.35 * held * (1 - drop)));
      }
      K.vignette(g, 0.4);
    }

    weltPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#a07aff', 1, 70);
      const look = G.lookOf('welt', this.game), x = CX - 30, y = 250, s = 2.6, rise = eOut(seg(t, 0.2, 0.8));
      this.bust(g, look, x, y, 64, s);
      line(g, '#2a2226', 5, 40, LH, 46, 124);
      ell(g, '#c8a050', 46, 120, 7, 5); ell(g, '#c8243a', 46, 119, 3, 3);
      const bx = CX + 96, by = lerp(150, 80, rise);
      if (rise > 0) {
        lighter(g, () => { glow(g, bx, by, 40, '#8a4aff', 0.6 * rise); for (let i = 0; i < 14; i++) { const q = i / 14 * Math.PI * 2 + T * 2.2, r = 18 + 4 * Math.sin(T * 3 + i); rect(g, rgba('#e8d8ff', 0.8 * rise), Math.round(bx + Math.cos(q) * r), Math.round(by + Math.sin(q) * r * 0.4), 1, 1); } });
        g.save(); g.translate(bx, by); g.scale(1, 0.32); ring(g, rgba('#c8a0ff', 0.8 * rise), 2, 0, 0, 16); g.restore();
        ell(g, '#05030a', bx, by, 7 * rise, 7 * rise);
      }
      this.camFlashes(g, t);
      K.vignette(g, 0.4);
    }

    camFlashes(g, t) {
      for (let i = 0; i < 4; i++) { const q = seg(t, 0.35 + i * 0.28, 0.5 + i * 0.28); if (q > 0 && q < 1) lighter(g, () => { const fx = i % 2 ? 14 + i * 4 : LW - 16 - i * 4, fy = 222 - i * 3; glow(g, fx, fy, 9, '#ffffff', 0.9 * (1 - q)); line(g, rgba('#ffffff', 0.9 * (1 - q)), 1, fx - 6, fy, fx + 6, fy); line(g, rgba('#ffffff', 0.9 * (1 - q)), 1, fx, fy - 6, fx, fy + 6); }); }
    }

    cup(g, x, y, s, T, steam) {
      rect(g, '#f4f0e8', x - 5 * s, y - 7 * s, 10 * s, 9 * s); rect(g, '#2a160c', x - 4 * s, y - 6 * s, 8 * s, 2 * s); rect(g, '#d8d0c4', x - 5 * s, y + 1 * s, 10 * s, 1 * s);
      ring(g, '#f4f0e8', Math.max(1, s), x + 6 * s, y - 3 * s, 2.4 * s);
      if (steam > 0) for (let i = 0; i < 3; i++) { const k = (T * 0.6 + i / 3) % 1; ell(g, rgba('#f0f0f0', 0.5 * (1 - k) * steam), x - 2 * s + i * 2 * s + Math.sin(T * 3 + i) * 2 * s, y - 9 * s - k * 14 * s, 2 * s, 3 * s); }
    }

    suitcase(g, x, y, open) {
      rect(g, '#5a3a22', x - 18, y - 22, 36, 22); rect(g, '#c8a050', x - 18, y - 12, 36, 2); rect(g, '#2a1a10', x - 5, y - 26, 10, 4);
      if (open > 0) { const h = 22 * open; poly(g, '#6a4628', [x - 18, y - 22, x + 18, y - 22, x + 18, y - 22 - h, x - 18, y - 22 - h]); rect(g, '#c8a050', x - 18, y - 22 - h, 36, 2); lighter(g, () => glow(g, x, y - 22, 24, '#ffb060', 0.5 * open)); }
    }

    himekoStand(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('himeko', this.game), walk = sm(seg(t, 0, 0.6)), x = lerp(-30, 96, walk), step = t < 0.6 ? Math.abs(Math.sin(t * 14)) * 2 : 0;
      rect(g, '#3a2a22', 168, 160, 120, 8); rect(g, '#5a2a1a', 172, 168, 112, 52); rect(g, '#c8a050', 172, 168, 112, 3);
      g.save(); g.translate(228, 192); rect(g, '#f2ecdc', -26, -10, 52, 20); g.font = 'bold 9px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#2a160c'; g.fillText('КОФЕ', 0, 1); g.font = '6px sans-serif'; g.fillText('только чёрный', 0, 8); g.restore();
      rect(g, '#1e1a18', 182, 136, 16, 24); rect(g, '#3a3230', 184, 132, 12, 4); ring(g, '#1e1a18', 2, 200, 146, 5);
      const pour = seg(t, 0.75, 1.3);
      for (let i = 0; i < 4; i++) this.cup(g, 214 + i * 18, 160, 1.2, T + i, seg(t, 1.0 + i * 0.12, 1.4 + i * 0.12));
      if (pour > 0 && pour < 1) line(g, '#2a160c', 2, 198, 150, 214 + Math.floor(pour * 4) * 18, 152);
      this.suitcase(g, x - 34, 224, 0);
      ell(g, 'rgba(0,0,0,0.45)', x, 222, 26, 6);
      figure(g, look, x, 224 - step, 3, { s: 0.68 });
      K.vignette(g, 0.4);
    }

    himekoSip(g, t, T) {
      this.conHall(g, T);
      rect(g, 'rgba(10,6,16,0.5)', 0, 0, LW, LH);
      const hm = G.lookOf('himeko', this.game), tl = lookOf('talleah', this.game, true), x = 228, y = 252, s = 2.4, sour = seg(t, 0.75, 0.9);
      this.bust(g, hm, 70, 246, 64, 1.7);
      this.bust(g, tl, x, y, 64, s, { flip: true });
      if (sour > 0) for (const side of [-1, 1]) { const [ex, ey, u] = this.bustAt(tl, x, y, 64, s, side); const fx = x - (ex - x); rect(g, tl.skin || '#9ec8f0', Math.round(fx - u * 4), Math.round(ey - u * 4), Math.round(u * 8), Math.round(u * 8 * sour)); if (sour > 0.6) line(g, '#1a2a44', Math.max(1, u), fx - u * 3, ey + u * (side < 0 ? 1 : -1), fx + u * 3, ey + u * (side < 0 ? -1 : 1)); }
      const lift = eOut(seg(t, 0.1, 0.6)), cx = lerp(206, 196, lift), cy = lerp(214, 166, lift) + (sour > 0 ? Math.sin(T * 30) * sour : 0);
      this.cup(g, cx, cy, 2, T, 1 - sour * 0.6);
      hand(g, cx + 4, cy + 34, 0.5, 1, false);
      if (t > 1.0) for (let i = 0; i < 3; i++) { const k = seg(t, 1.0 + i * 0.12, 1.4 + i * 0.12); if (k > 0 && k < 1) { g.save(); g.globalAlpha = 1 - k; g.font = 'bold 9px sans-serif'; g.fillStyle = '#9ad8ff'; g.fillText('щёлк', 262 + i * 6, 70 - i * 12 - k * 10); g.restore(); } }
      K.vignette(g, 0.4);
    }

    himekoLamp(g, t, T) {
      this.stageFloor(g, T, 0.5);
      const look = G.lookOf('himeko', this.game), on = t < 0.22 ? (Math.sin(t * 80) > 0 ? 1 : 0.2) : seg(t, 1.45, 1.6), lx = 128, ly = 28;
      this.beam(g, lx, '#ffd8a0', on, 50);
      rect(g, '#3a3a44', 72, 16, 120, 4); rect(g, '#2a2a32', lx - 14, ly - 10, 28, 20); ell(g, on > 0.5 ? '#fff4d0' : '#4a4a52', lx - 4, ly + 10, 10, 5);
      if (t > 0.18 && t < 0.5) lighter(g, () => sparks(g, lx, ly + 10, seg(t, 0.2, 0.5), '#ffd060', 14, 71));
      const open = eOut(seg(t, 0.45, 0.65));
      this.suitcase(g, 196, 222, open);
      ell(g, 'rgba(0,0,0,0.45)', 128, 222, 24, 6);
      figure(g, look, 128, 224, 3, { s: 0.66 });
      const fly = eOut(seg(t, 0.65, 0.95)), back = eOut(seg(t, 1.5, 1.8)), sx = lerp(lerp(196, lx + 22, fly), 196, back), sy = lerp(lerp(190, ly + 16, fly), 190, back);
      if (fly > 0 && back < 1) {
        ell(g, '#b8c0cc', sx, sy, 6, 6); ell(g, '#e8eef6', sx - 2, sy - 2, 2, 2); line(g, '#b8c0cc', 1, sx, sy - 6, sx + 4, sy - 12);
        for (const d of [-1, 1]) rect(g, '#4a6aa0', sx + d * 7 - (d < 0 ? 6 : 0), sy - 2, 6, 4);
        const weld = t > 0.95 && t < 1.45;
        if (weld) lighter(g, () => { line(g, '#ff4a3a', 2, sx - 4, sy - 2, lx + 6, ly + 4); glow(g, lx + 6, ly + 4, 10, '#ffb040', 0.9); sparks(g, lx + 6, ly + 4, (t * 3) % 1, '#ffd060', 8, 13 + Math.floor(t * 3)); });
      }
      K.vignette(g, 0.4);
    }

    himekoPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#ff8a3a', 1, 70);
      const look = G.lookOf('himeko', this.game), x = CX - 30, y = 250, s = 2.6, give = eOut(seg(t, 0.2, 0.7));
      lighter(g, () => { for (let i = 0; i < 16; i++) { const q = (T * 0.25 + hx(i, 1, 23)) % 1, px = 30 + hx(i, 2, 23) * 260 + Math.sin(T + i) * 6; poly(g, rgba(i % 2 ? '#ff6a2a' : '#ffd060', Math.sin(Math.PI * q) * 0.7), [px, 230 - q * 220 - 3, px + 2, 230 - q * 220, px, 230 - q * 220 + 3, px - 2, 230 - q * 220]); } });
      this.bust(g, look, x, y, 64, s);
      const cx = lerp(CX + 70, CX + 44, give), cy = lerp(250, 196, give);
      hand(g, cx + 6, cy + 40, 0.8, give, true);
      this.cup(g, cx, cy, 2.6, T, give);
      this.camFlashes(g, t);
      K.vignette(g, 0.4);
    }

    bronyaMirror(g, t, T) {
      vgrad(g, 0, LH, [[0, '#2a2230'], [1, '#1a141e']]);
      for (let i = 0; i < 8; i++) rect(g, rgba('#3a2e40', 0.5), i * 40, 0, 1, LH);
      const look = G.lookOf('bronya', this.game), mx = 80, my = 22, mw = 160, mh = 150, x = CX, y = 196, s = 2.1;
      rect(g, '#6a5a40', mx - 8, my - 8, mw + 16, mh + 16);
      g.save(); g.beginPath(); g.rect(mx, my, mw, mh); g.clip();
      vgrad(g, my, my + mh, [[0, '#3a3a52'], [1, '#22223a']], mx, mw);
      this.bust(g, look, x, y, 64, s);
      const blink = Math.max(seg(t, 0.6, 0.68) * (1 - seg(t, 0.72, 0.8)), seg(t, 1.1, 1.16) * (1 - seg(t, 1.2, 1.3)));
      if (blink > 0) for (const side of [-1, 1]) { const [ex, ey, u] = this.bustAt(look, x, y, 64, s, side); rect(g, look.skin, Math.round(ex - u * 4), Math.round(ey - u * 4), Math.round(u * 8), Math.round(u * 8 * blink)); }
      lighter(g, () => { poly(g, 'rgba(255,255,255,0.08)', [mx, my + 40, mx + 60, my, mx + 90, my, mx, my + 90]); poly(g, 'rgba(255,255,255,0.05)', [mx + 110, my + mh, mx + mw, my + 70, mx + mw, my + 100, mx + 140, my + mh]); });
      g.restore();
      for (let i = 0; i < 12; i++) {
        const side = i < 6, k = i % 6, bx = side ? mx - 4 : mx + mw + 4, by = my + 8 + k * 26, on = seg(t, 0.12 + k * 0.05, 0.16 + k * 0.05);
        ell(g, on > 0 ? '#fff0c0' : '#5a5040', bx, by, 4, 4);
        if (on > 0) lighter(g, () => glow(g, bx, by, 14, '#ffe0a0', 0.5 * on));
      }
      rect(g, '#4a3628', 0, 188, LW, LH - 188); rect(g, '#6a4a34', 0, 188, LW, 3);
      rect(g, '#2a5ad8', 60, 196, 30, 6); rect(g, '#d8d0c8', 230, 192, 6, 14); ell(g, '#d8d0c8', 233, 190, 6, 3);
      K.vignette(g, 0.45);
    }

    bronyaDoor(g, t, T) {
      vgrad(g, 0, LH, [[0, '#14121c'], [1, '#0a0810']]);
      const open = seg(t, 1.5, 1.8), dx = CX - 30, dw = 60;
      rect(g, '#2a2232', dx - 6, 40, dw + 12, 168);
      lighter(g, () => { rect(g, rgba('#fff0c0', 0.8), dx, 204, dw, 3); glow(g, CX, 206, 50 + 40 * open, '#ffe0a0', 0.4 + 0.4 * open); rect(g, rgba('#fff0c0', 0.5 + 0.5 * open), dx + dw - 2, 44, 2 + 14 * open, 162); });
      rect(g, '#3a2e44', dx, 44, dw - 14 * open, 162); ell(g, '#c8a050', dx + dw - 10 - 14 * open, 126, 3, 3);
      rect(g, '#1a1620', 0, 208, LW, LH - 208);
      const look = G.lookOf('bronya', this.game), walk = Math.min(t, 1.4), x = t < 1.4 ? CX + Math.sin(walk * 4.5) * 80 : CX + Math.sin(1.4 * 4.5) * 80 * (1 - seg(t, 1.4, 1.7)), dir = Math.cos(walk * 4.5) < 0;
      ell(g, 'rgba(0,0,0,0.5)', x, 226, 22, 5);
      figure(g, look, x, 228 - (t < 1.4 ? Math.abs(Math.sin(t * 12)) * 1.5 : 0), 3, { s: 0.6, flip: t < 1.4 && dir, tint: '#0a0810', ta: 0.35 });
      K.vignette(g, 0.5);
    }

    bronyaParade(g, t, T) {
      this.stageFloor(g, T, 0.6);
      const look = G.lookOf('bronya', this.game), gust = seg(t, 0.02, 0.4);
      for (let i = 0; i < 3; i++) this.beam(g, 70 + i * 70, ['#5a8aff', '#ffffff', '#5a8aff'][i], 0.6 + 0.4 * Math.sin(T * 2 + i), 34);
      const wave = Math.sin(T * 6) * 4 * (0.3 + gust);
      for (let i = 0; i < 6; i++) poly(g, i % 2 ? '#f2f2f6' : '#2a5ad8', [40 + i * 40, 22, 80 + i * 40, 22, 80 + i * 40, 46 + (i % 2 ? wave : -wave), 40 + i * 40, 46 + (i % 2 ? -wave : wave)]);
      rect(g, '#c8a050', 36, 20, 248, 3);
      if (gust > 0 && gust < 1) lighter(g, () => { for (let i = 0; i < 6; i++) line(g, rgba('#c8e0ff', 0.6 * (1 - gust)), 1, lerp(LW, -40, gust) + i * 20, 60 + i * 14, lerp(LW, -40, gust) + i * 20 + 50, 60 + i * 14); });
      ['amanda', 'makoto', 'talleah'].forEach((id, i) => {
        const k = sm(seg(t, 0.4 + i * 0.25, 1.0 + i * 0.25)), x = lerp(-30, 70 + i * 52, k), step = k > 0 && k < 1 ? Math.abs(Math.sin(T * 12 + i)) * 2 : 0;
        ell(g, 'rgba(0,0,0,0.4)', x, 204, 16, 4);
        figure(g, lookOf(id, this.game, false), x, 206 - step, 3, { s: 0.56 });
      });
      ell(g, 'rgba(0,0,0,0.45)', 252, 216, 24, 6);
      figure(g, look, 252, 218, 3, { s: 0.66 });
      if (t > 1.2) lighter(g, () => { for (let i = 0; i < 24; i++) { const k = ((T * 0.4 + hx(i, 1, 61)) % 1), px = hx(i, 2, 61) * LW + Math.sin(T * 3 + i) * 6; rect(g, rgba(['#ffffff', '#5a8aff', '#ffd060'][i % 3], 0.8 * seg(t, 1.2, 1.4)), Math.round(px), Math.round(k * 200), 2, 2); } });
      K.vignette(g, 0.4);
    }

    bronyaPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#5a8aff', 1, 70);
      const look = G.lookOf('bronya', this.game), x = CX - 30, y = 250, s = 2.6, up = eOut(seg(t, 0.2, 0.6));
      lighter(g, () => { for (let i = 0; i < 20; i++) { const k = (T * 0.3 + hx(i, 1, 37)) % 1, px = ((hx(i, 2, 37) * LW - T * 40 * (0.5 + hx(i, 3, 37))) % LW + LW) % LW, py = k * LH; line(g, rgba('#ffffff', 0.6), 1, px - 2, py, px + 2, py); line(g, rgba('#ffffff', 0.6), 1, px, py - 2, px, py + 2); } });
      this.bust(g, look, x, y, 64, s);
      if (up > 0) hand(g, CX + 40, lerp(240, 150, up), 0.8, up, true);
      lighter(g, () => { for (let i = 0; i < 5; i++) line(g, rgba('#c8e0ff', 0.4), 1, ((T * 160 + i * 70) % 400) - 60, 40 + i * 30, ((T * 160 + i * 70) % 400) - 10, 40 + i * 30); });
      this.camFlashes(g, t);
      K.vignette(g, 0.4);
    }

    kid(g, x, y, col, hop, k = 1) {
      g.save(); g.translate(x, y - hop); g.scale(k, k); x = 0;
      const yy = 0;
      rect(g, '#2a2a34', x - 4, yy - 10, 3, 10); rect(g, '#2a2a34', x + 1, yy - 10, 3, 10);
      rect(g, col, x - 6, yy - 26, 12, 16);
      ell(g, '#f2d6c2', x, yy - 31, 5, 5);
      rect(g, '#b8a070', x - 6, yy - 38, 12, 8); rect(g, '#2a2420', x - 4, yy - 33, 8, 2);
      ell(g, '#c8ccd4', x + 8, yy - 18, 5, 7); ell(g, '#e8ecf2', x + 7, yy - 20, 2, 3);
      g.restore();
    }

    iceWall(g, x, y0, y1, k, T) {
      if (k <= 0) return;
      const h = (y1 - y0) * k;
      for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) {
        const cy = y1 - 14 - r * 18, cx = x + c * 16 + (r % 2) * 8;
        if (y1 - cy > h + 10) continue;
        poly(g, rgba('#a8e0ff', 0.45), [cx - 8, cy, cx - 4, cy - 9, cx + 4, cy - 9, cx + 8, cy, cx + 4, cy + 9, cx - 4, cy + 9]);
        line(g, rgba('#e8f8ff', 0.7), 1, cx - 4, cy - 9, cx + 4, cy - 9);
      }
      lighter(g, () => { glow(g, x + 12, y1 - h / 2, 50, '#8ad0f6', 0.35 * k); line(g, rgba('#ffffff', 0.6), 1, x + 4, y1 - h + ((T * 60) % Math.max(1, h)), x + 24, y1 - h + ((T * 60) % Math.max(1, h)) - 8); });
    }

    gepardPatrol(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('gepard', this.game), walk = seg(t, 0, 1.3), x = lerp(90, 170, walk), step = walk < 1 ? Math.abs(Math.sin(t * 9)) * 1.5 : 0, stop = seg(t, 1.3, 1.45);
      ell(g, 'rgba(0,0,0,0.45)', x, 222, 24, 6);
      figure(g, look, x, 224 - step, 3, { s: 0.7 });
      for (let i = 0; i < 4; i++) {
        const k = seg(t, 0.3 + i * 0.25, 1.1 + i * 0.25), a = (1 - k) * (1 - stop);
        if (k > 0 && a > 0) { g.save(); g.globalAlpha = a; g.font = 'bold 12px serif'; g.fillStyle = i % 2 ? '#8ad0f6' : '#ffd060'; g.fillText(i % 2 ? '♫' : '♪', x + 16 + k * 26 + Math.sin(T * 4 + i) * 4, 92 - k * 50); g.restore(); }
      }
      if (stop > 0) { g.save(); g.globalAlpha = stop; poly(g, '#9ad8ff', [x + 18, 74, x + 22, 82, x + 18, 86, x + 14, 82]); g.restore(); }
      K.vignette(g, 0.4);
    }

    gepardKids(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('gepard', this.game);
      ell(g, 'rgba(0,0,0,0.45)', CX, 222, 24, 6);
      figure(g, look, CX, 224, 3, { s: 0.7 });
      const run = eOut(seg(t, 0, 0.5)), cols = ['#2d5bd3', '#e8b040', '#e85a8a', '#3aa85a'];
      cols.forEach((col, i) => {
        const side = i < 2 ? -1 : 1, tx = CX + side * (52 + (i % 2) * 40), x = lerp(side < 0 ? -20 : LW + 20, tx, run), hop = Math.max(0, Math.sin(T * 9 + i * 1.7)) * 6 * seg(t, 0.4, 0.6);
        ell(g, 'rgba(0,0,0,0.35)', x, 200, 14, 4);
        this.kid(g, x, 200, col, hop, 1.7);
      });
      if (t > 1.0) for (let i = 0; i < 4; i++) { const k = seg(t, 1.0 + i * 0.1, 1.5 + i * 0.1); if (k > 0 && k < 1) { g.save(); g.globalAlpha = 1 - k; g.font = 'bold 10px sans-serif'; g.fillStyle = '#ffd060'; g.fillText('!', CX + (i - 1.5) * 50, 150 - k * 20); g.restore(); } }
      K.vignette(g, 0.4);
    }

    gepardWall(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('gepard', this.game), wall = eOut(seg(t, 0.4, 0.6)), line0 = 134, queue = eOut(seg(t, 1.0, 1.6));
      for (let i = 0; i < 9; i++) {
        const rush = lerp(LW + 30 + i * 22, line0 + 6 + i * 6 + hx(i, 1, 81) * 8, eOut(seg(t, 0, 0.55))), qx = line0 + 10 + i * 20, x = lerp(rush, qx, queue), bob = queue < 1 ? Math.abs(Math.sin(T * 12 + i)) * 2 : 0;
        ell(g, '#100c16', x, 172 - bob, 7, 8); rect(g, '#100c16', x - 8, 179 - bob, 16, 30);
        rect(g, ['#e8b040', '#5ab8e8', '#e85a8a'][i % 3], x - 3, 186 - bob, 6, 8);
      }
      ell(g, 'rgba(0,0,0,0.45)', 84, 222, 24, 6);
      figure(g, look, 84, 224, 3, { s: 0.7 });
      this.iceWall(g, line0 - 18, 110, 216, wall, T);
      if (t > 0.5 && t < 0.75) lighter(g, () => sparks(g, line0, 170, seg(t, 0.5, 0.75), '#c8f0ff', 16, 19));
      K.vignette(g, 0.4);
    }

    gepardPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#8ad0f6', 1, 70);
      const look = G.lookOf('gepard', this.game), x = CX - 30, y = 250, s = 2.6, up = seg(t, 0.4, 0.8) * (1 - seg(t, 1.3, 1.6));
      lighter(g, () => { for (let i = 0; i < 14; i++) { const k = (T * 0.2 + hx(i, 1, 43)) % 1, px = hx(i, 2, 43) * LW, py = k * LH; for (const a of [0, 1, 2]) { const q = a * Math.PI / 3; line(g, rgba('#d8f0ff', 0.6), 1, px - Math.cos(q) * 3, py - Math.sin(q) * 3, px + Math.cos(q) * 3, py + Math.sin(q) * 3); } } });
      this.bust(g, look, x, y, 64, s);
      const px = CX + 74, py = 200;
      hand(g, px, py + 34, 0.8, 1, true);
      poly(g, '#b0603a', [px - 12, py - 8, px + 12, py - 8, px + 9, py + 12, px - 9, py + 12]); rect(g, '#c87048', px - 13, py - 10, 26, 4);
      const bend = 1 - up, tipx = px + 14 * bend, tipy = py - 34 + 14 * bend;
      line(g, '#3a8a4a', 2, px, py - 10, px + 4 * bend, py - 24 + 4 * bend); line(g, '#3a8a4a', 2, px + 4 * bend, py - 24 + 4 * bend, tipx, tipy);
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + bend; ell(g, up > 0.5 ? '#f2f2f6' : '#c8c0b8', tipx + Math.cos(a) * 4, tipy + Math.sin(a) * 4, 3, 3); }
      ell(g, '#ffd060', tipx, tipy, 2, 2);
      if (up > 0) lighter(g, () => glow(g, tipx, tipy, 14, '#c8f0ff', 0.5 * up));
      this.camFlashes(g, t);
      K.vignette(g, 0.4);
    }

    hat(g, x, y, s) {
      rect(g, '#16141a', x - 14 * s, y - 2 * s, 28 * s, 4 * s); rect(g, '#1e1c24', x - 8 * s, y - 16 * s, 16 * s, 14 * s); rect(g, '#c42d31', x - 8 * s, y - 5 * s, 16 * s, 3 * s);
    }

    redCoat(g, x, y, s) {
      poly(g, '#c42d31', [x - 22 * s, y, x + 22 * s, y, x + 30 * s, y + 60 * s, x - 30 * s, y + 60 * s]);
      poly(g, '#9a1e24', [x - 4 * s, y, x + 4 * s, y, x + 2 * s, y + 60 * s, x - 2 * s, y + 60 * s]);
      for (let i = 0; i < 3; i++) ell(g, '#f0e8dc', x + 8 * s, y + (14 + i * 14) * s, 2 * s, 2 * s);
    }

    svarogAt(g, x, y, s, o = {}) {
      const sv = G.lookOf('svarog', this.game);
      ell(g, 'rgba(0,0,0,0.45)', x, y - 2, 40 * s, 8 * s);
      figure(g, sv, x, y, 3, { s, tint: o.tint, ta: o.ta });
      lighter(g, () => glow(g, x, y - 158 * s, 22 * s, '#ff2e8e', 0.35 + 0.1 * Math.sin((o.T || 0) * 3)));
    }

    claraShy(g, t, T) {
      this.conHall(g, T);
      const cl0 = G.lookOf('clara', this.game), peek = seg(t, 0.6, 0.9) * (1 - seg(t, 1.25, 1.4));
      figure(g, cl0, lerp(170, 136, peek), 222, 3, { s: 0.56 });
      this.svarogAt(g, 196, 226, 0.86, { T });
      for (let i = 0; i < 5; i++) { const x = ((i * 90 - T * 60) % 420 + 420) % 420 - 50; ell(g, '#100c16', x, 186, 9, 10); rect(g, '#100c16', x - 11, 194, 22, 46); }
      if (t > 1.25 && t < 1.7) { g.save(); g.globalAlpha = 1 - seg(t, 1.5, 1.7); g.font = 'bold 11px sans-serif'; g.fillStyle = '#ffffff'; g.fillText('!', 150, 120); g.restore(); }
      K.vignette(g, 0.4);
    }

    claraCoat(g, t, T) {
      this.conHall(g, T);
      rect(g, '#5a5a66', 20, 120, 2, 80); rect(g, '#5a5a66', 136, 120, 2, 80); rect(g, '#7a7a86', 20, 120, 118, 3);
      for (let i = 0; i < 5; i++) { const x = 32 + i * 22; line(g, '#a8a8b4', 1, x, 123, x, 128); rect(g, ['#2d5bd3', '#3aa85a', '#e8b040', '#8a4aff', '#e85a8a'][i], x - 8, 128, 16, 44); }
      const cl0 = G.lookOf('clara', this.game), fly = eOut(seg(t, 0.95, 1.35)), sx = 230, top = 226 - 166 * 0.86;
      this.svarogAt(g, sx, 226, 0.86, { T });
      ell(g, 'rgba(0,0,0,0.4)', 104, 222, 16, 4);
      figure(g, cl0, 104, 224, 3, { s: 0.56 });
      const hold = Math.sin(T * 6) * 2 * (1 - fly);
      this.redCoat(g, lerp(128, sx, fly), lerp(150, top + 34, fly) + hold, lerp(0.5, 1.2, fly));
      this.hat(g, lerp(124, sx, fly), lerp(136, top - 6, fly) + hold, lerp(0.6, 1.1, fly));
      if (fly >= 1) lighter(g, () => sparks(g, sx, top + 30, seg(t, 1.35, 1.8), '#ffd060', 14, 29));
      K.vignette(g, 0.4);
    }

    claraTree(g, t, T) {
      this.stageFloor(g, T, 0.55);
      this.beam(g, 200, '#ff8ab8', 1, 60);
      const cl0 = G.lookOf('clara', this.game), sx = 200, top = 226 - 166 * 0.86, drop = seg(t, 0.85, 1.2), pat = eOut(seg(t, 1.0, 1.3));
      this.svarogAt(g, sx, 226, 0.86, { T });
      this.redCoat(g, sx, top + 34, 1.2); this.hat(g, sx, top - 6, 1.1);
      for (let i = 0; i < 14; i++) {
        const a = hx(i, 1, 53) * Math.PI * 2, r = 30 + hx(i, 2, 53) * 40, lx = sx + Math.cos(a) * r, ly = top + 20 + Math.sin(a) * r * 0.6 + drop * drop * 200 * (0.6 + hx(i, 3, 53));
        if (ly < LH) ell(g, i % 3 ? '#3a8a4a' : '#5aaa5a', lx, ly, 8, 5);
      }
      ell(g, 'rgba(0,0,0,0.4)', 120, 222, 16, 4);
      figure(g, cl0, 120, 224, 3, { s: 0.56 });
      if (t < 0.85) { g.save(); g.font = 'bold 10px sans-serif'; g.fillStyle = rgba('#ffffff', 0.8); g.fillText('…', 128, 132); g.restore(); }
      if (pat > 0) {
        const hx0 = lerp(sx - 20, 122, pat), hy0 = lerp(top + 60, 100, pat);
        poly(g, '#5a5c70', [sx - 30, top + 40, sx - 18, top + 46, hx0 + 8, hy0 - 2, hx0 - 6, hy0 - 6]);
        rect(g, '#7a7c92', hx0 - 12, hy0 - 4, 24, 10); for (let k = 0; k < 4; k++) rect(g, '#6a6c80', hx0 - 12 + k * 6, hy0 + 5, 5, 6);
        for (let i = 0; i < 5; i++) { const ph = (T * 0.7 + i / 5) % 1; this.heartAt(g, 100 + i * 22, 120 - ph * 40, 3, (1 - ph) * pat); }
      }
      K.vignette(g, 0.4);
    }

    heartAt(g, x, y, r, a) {
      if (a <= 0) return;
      g.save(); g.globalAlpha = cl(a); ell(g, '#ff6aa8', x - r * 0.5, y, r * 0.6, r * 0.6); ell(g, '#ff6aa8', x + r * 0.5, y, r * 0.6, r * 0.6); poly(g, '#ff6aa8', [x - r, y + r * 0.2, x + r, y + r * 0.2, x, y + r * 1.3]); g.restore();
    }

    claraPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#ff8ab8', 1, 70);
      const look = G.lookOf('clara', this.game), sv = G.lookOf('svarog', this.game), x = CX - 30, y = 250, s = 2.6;
      g.save(); g.globalAlpha = 0.55; figure(g, sv, 250, 300, 3, { s: 1.2, tint: '#1a1424', ta: 0.6 }); g.restore();
      lighter(g, () => glow(g, 250, 300 - 158 * 1.2, 26, '#ff2e8e', 0.5));
      this.hat(g, 250, 300 - 166 * 1.2 - 8, 1.4);
      this.bust(g, look, x, y, 64, s);
      let squeeze = 0;
      for (let i = 0; i < 4; i++) squeeze = Math.max(squeeze, seg(t, 0.35 + i * 0.28, 0.4 + i * 0.28) * (1 - seg(t, 0.45 + i * 0.28, 0.55 + i * 0.28)));
      if (squeeze > 0) for (const side of [-1, 1]) { const [ex, ey, u] = this.bustAt(look, x, y, 64, s, side); rect(g, look.skin, Math.round(ex - u * 4), Math.round(ey - u * 4), Math.round(u * 8), Math.round(u * 8 * squeeze)); }
      this.camFlashes(g, t);
      K.vignette(g, 0.4);
    }

    blade(g, x, y, len, ang, col, a = 1) {
      g.save(); g.globalAlpha = cl(a); g.translate(x, y); g.rotate(ang);
      poly(g, col, [-2, 0, 2, 0, 1.5, -len, 0, -len - 4, -1.5, -len]);
      line(g, rgba('#ffffff', 0.6), 1, 0, -2, 0, -len);
      rect(g, '#2a2420', -5, 0, 10, 2); rect(g, '#5a3a2a', -1.5, 2, 3, 8); rect(g, '#c8a050', -2, 10, 4, 2);
      g.restore();
    }

    rapiers(g, x, y, r, T, a, n = 6) {
      for (let i = 0; i < n; i++) {
        const q = i / n * Math.PI * 2 + T * 1.6, px = x + Math.cos(q) * r, py = y + Math.sin(q) * r * 0.42;
        this.blade(g, px, py + 8, 16, q + Math.PI / 2, '#a8e0ff', a);
        lighter(g, () => glow(g, px, py, 6, '#8ad0f6', 0.4 * a));
      }
    }

    yanqingVendor(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('yanqing', this.game), cols = ['#e85a8a', '#5ab8e8', '#ffd060', '#c8ccd4', '#3aa85a', '#8a4aff'];
      rect(g, '#3a2a22', 150, 168, 150, 8); rect(g, '#5a3a2a', 154, 176, 142, 44); rect(g, '#c8a050', 154, 176, 142, 3);
      rect(g, '#4a3a2a', 160, 166, 130, 4);
      const take = [seg(t, 0.9, 1.15), seg(t, 1.1, 1.35)];
      cols.forEach((col, i) => { if (i === 1 && take[0] > 0) return; this.blade(g, 170 + i * 22, 166, 52, 0, col); });
      g.save(); g.translate(250, 198); rect(g, '#f2ecdc', -38, -8, 76, 16); g.font = 'bold 7px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#c8243a'; g.fillText('МЕЧИ · ПОРОЛОН', 0, 3); g.restore();
      const walk = sm(seg(t, 0, 0.5)), x = lerp(-20, 110, walk);
      ell(g, 'rgba(0,0,0,0.45)', x, 222, 22, 5);
      figure(g, look, x, 224 - (t < 0.5 ? Math.abs(Math.sin(t * 14)) * 2 : 0), 3, { s: 0.64 });
      this.blade(g, lerp(192, x - 8, eOut(take[0])), lerp(166, 170, eOut(take[0])), 52, -0.3 * take[0], cols[1], take[0] > 0 ? 1 : 0);
      this.blade(g, lerp(300, x + 8, eOut(take[1])), lerp(150, 170, eOut(take[1])), 52, 0.3 * take[1], cols[1], take[1]);
      const shine = seg(t, 0.45, 0.6);
      if (shine > 0) lighter(g, () => { for (const d of [-1, 1]) { const sx = x + d * 5, sy = 92; poly(g, rgba('#ffffff', shine), [sx, sy - 4, sx + 1, sy, sx, sy + 4, sx - 1, sy]); poly(g, rgba('#ffffff', shine), [sx - 4, sy, sx, sy - 1, sx + 4, sy, sx, sy + 1]); } });
      if (t > 1.35) { g.save(); g.globalAlpha = 1 - seg(t, 1.6, 1.8); g.font = 'bold 14px Georgia, serif'; g.fillStyle = '#ffd060'; g.fillText('×2', x + 22, 112 - seg(t, 1.35, 1.8) * 10); g.restore(); }
      K.vignette(g, 0.4);
    }

    yanqingSheath(g, t, T) {
      vgrad(g, 0, LH, [[0, '#3a1420'], [1, '#22101a']]);
      for (let i = 0; i < 10; i++) rect(g, rgba('#5a2030', 0.4), 0, i * 24, LW, 1);
      const look = G.lookOf('yanqing', this.game), sweep = eOut(seg(t, 1.1, 1.4));
      const sheath = (x, y, body, ring, tiger) => {
        rect(g, body, x - 50, y - 5, 100, 10); rect(g, '#c8a050', x + 44, y - 6, 6, 12); rect(g, '#c8a050', x - 52, y - 6, 4, 12);
        ell(g, ring, x - 20, y - 12, 7, 7); ell(g, '#22101a', x - 20, y - 12, 3, 3);
        if (tiger) for (let i = 0; i < 3; i++) line(g, '#2a1a10', 1, x - 26 + i * 4, y - 18, x - 24 + i * 4, y - 8);
        else { g.strokeStyle = '#1a5a2a'; g.lineWidth = 1; g.beginPath(); g.arc(x - 20, y - 12, 5, 0, Math.PI * 1.6); g.stroke(); }
      };
      const look0 = Math.floor(t / 0.35) % 2;
      sheath(lerp(96, 160, sweep), lerp(70, 120 - 8, sweep), '#1a1418', '#e8902a', true);
      sheath(lerp(224, 160, sweep), lerp(70, 120, sweep), '#a8243a', '#3aa85a', false);
      if (sweep > 0) for (let i = 0; i < 4; i++) { const k = seg(t, 1.2 + i * 0.08, 1.4 + i * 0.08); if (k > 0) { g.save(); g.globalAlpha = k; g.translate(160, 120 - 16 - i * 8); rect(g, ['#3a5a8a', '#8a6a2a', '#2a2a30', '#6a2a6a'][i], -50, -4, 100, 8); g.restore(); } }
      this.bust(g, look, CX, 214, 64, 1.6, { flip: t < 1.1 ? look0 === 1 : false });
      if (t < 1.1) { g.save(); g.font = 'bold 12px sans-serif'; g.fillStyle = '#ffd060'; g.fillText('?', look0 ? 90 : 222, 104 + Math.sin(T * 8) * 2); g.restore(); }
      const purse = seg(t, 1.3, 1.6);
      rect(g, '#6a4a2a', 262, 168, 26, 20); rect(g, '#4a3220', 262, 166, 26, 4);
      if (purse > 0) for (let i = 0; i < 3; i++) { const k = seg(t, 1.3 + i * 0.08, 1.6 + i * 0.08); if (k > 0 && k < 1) ell(g, '#ffd060', 270 + i * 5, 186 + k * 40, 3, 3); }
      K.vignette(g, 0.4);
    }

    yanqingDuel(g, t, T) {
      this.stageFloor(g, T, 0.55);
      this.beam(g, 100, '#e0304a', 0.8, 40); this.beam(g, 220, '#8ad0f6', 0.9, 40);
      const look = G.lookOf('yanqing', this.game), mk = lookOf('makoto', this.game, true), dash = eOut(seg(t, 0.55, 0.72)), back = eOut(seg(t, 1.0, 1.3));
      const yx = lerp(lerp(226, 140, dash), 226, back), pop = seg(t, 0.72, 1.4);
      ell(g, 'rgba(0,0,0,0.45)', 96, 216, 22, 5);
      figure(g, mk, 96, 218, 3, { s: 0.62 });
      if (pop <= 0) this.blade(g, 118, 150, 46, 0.9, '#ff8ac8');
      else this.blade(g, 118 + pop * 40, 150 - Math.sin(Math.PI * pop) * 110 + pop * 60, 46, 0.9 + pop * 14, '#ff8ac8', 1 - seg(t, 1.3, 1.4));
      if (dash > 0 && dash < 1) lighter(g, () => { for (let i = 0; i < 5; i++) line(g, rgba('#c8f0ff', 0.7), 2, yx + 10 + i * 12, 120 + i * 18, yx + 60 + i * 12, 120 + i * 18); });
      ell(g, 'rgba(0,0,0,0.45)', yx, 216, 22, 5);
      figure(g, look, yx, 218, 3, { s: 0.64, flip: true });
      this.blade(g, yx - 20, 150, 46, -0.9 - 0.8 * dash * (1 - back), '#5ab8e8');
      this.rapiers(g, yx, 120, 34, T, 0.9);
      if (t > 0.72 && t < 0.9) lighter(g, () => { glow(g, 128, 140, 24, '#ffffff', 0.9 * (1 - seg(t, 0.72, 0.9))); });
      K.vignette(g, 0.4);
    }

    yanqingPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#8ad0f6', 1, 70);
      const look = G.lookOf('yanqing', this.game), x = CX - 30, y = 250, s = 2.6, up = eOut(seg(t, 0.15, 0.6));
      this.blade(g, x - 40, 236, 150 * up, -0.35, '#5ab8e8', up);
      this.blade(g, x + 40, 236, 150 * up, 0.35, '#5ab8e8', up);
      this.rapiers(g, x, 110, 120, T * 0.6, up, 8);
      this.bust(g, look, x, y, 64, s);
      this.camFlashes(g, t);
      K.vignette(g, 0.4);
    }

    candy(g, x, y, s) {
      poly(g, '#ff9ac8', [x - 9 * s, y - 3 * s, x - 14 * s, y - 6 * s, x - 14 * s, y + 6 * s, x - 9 * s, y + 3 * s]);
      poly(g, '#ff9ac8', [x + 9 * s, y - 3 * s, x + 14 * s, y - 6 * s, x + 14 * s, y + 6 * s, x + 9 * s, y + 3 * s]);
      ell(g, '#ff6aa8', x, y, 9 * s, 6 * s); line(g, '#ffffff', Math.max(1, s), x - 5 * s, y - 2 * s, x + 4 * s, y + 3 * s);
    }

    gourd(g, x, y, s) {
      ell(g, '#d8b060', x, y + 10 * s, 11 * s, 11 * s); ell(g, '#d8b060', x, y - 6 * s, 7 * s, 7 * s);
      rect(g, '#c8243a', x - 7 * s, y + 1 * s, 14 * s, 2 * s); rect(g, '#6a4a2a', x - 2 * s, y - 16 * s, 4 * s, 4 * s);
      ell(g, '#f0d890', x - 4 * s, y + 6 * s, 3 * s, 4 * s);
    }

    plus(g, x, y, r, col, a) {
      if (a <= 0) return;
      rect(g, rgba(col, a), x - r, y - r / 3, r * 2, r * 2 / 3); rect(g, rgba(col, a), x - r / 3, y - r, r * 2 / 3, r * 2);
    }

    bailuBooth(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('bailu', this.game);
      figure(g, look, 64, 222, 3, { s: 0.5 });
      rect(g, '#3a2a22', 30, 168, 120, 8); rect(g, '#e8e4dc', 34, 176, 112, 44);
      g.save(); g.translate(90, 196); rect(g, '#ffffff', -36, -12, 72, 24); this.plus(g, -24, 0, 7, '#d82a3a', 1); g.font = 'bold 8px sans-serif'; g.fillStyle = '#d82a3a'; g.fillText('МЕДПУНКТ', -14, 3); g.restore();
      for (let i = 0; i < 3; i++) rect(g, '#5ab8e8', 108 + i * 10, 152, 6, 16);
      const ids = [['amanda', false], ['kazuma', null], ['makoto', false]], perk = i => seg(t, 1.0 + i * 0.12, 1.3 + i * 0.12);
      ids.forEach(([id, lit], i) => {
        const x = 190 + i * 46, lk = lit === null ? G.lookOf(id, this.game) : lookOf(id, this.game, lit), p = perk(i), sag = 4 * (1 - p);
        ell(g, 'rgba(0,0,0,0.4)', x, 222, 16, 4);
        figure(g, lk, x, 224 + sag, 3, { s: 0.56, tint: p < 1 ? '#6a7080' : null, ta: 0.35 * (1 - p) });
        const fly = eOut(seg(t, 0.8 + i * 0.12, 1.05 + i * 0.12));
        if (fly > 0 && fly < 1) rect(g, '#5ab8e8', lerp(118, x, fly) - 3, lerp(152, 130, fly) - Math.sin(Math.PI * fly) * 30, 6, 14);
        if (p < 1) for (let k = 0; k < 2; k++) { const q = (T * 0.7 + k / 2 + i * 0.3) % 1; g.save(); g.globalAlpha = (1 - q) * (1 - p); g.font = 'bold 9px sans-serif'; g.fillStyle = '#c8d8f0'; g.fillText('z', x + 10 + q * 8, 80 - q * 20); g.restore(); }
        else lighter(g, () => this.plus(g, x + 12, 90 - seg(t, 1.3 + i * 0.12, 1.8) * 20, 4, '#7af0c0', 1 - seg(t, 1.3 + i * 0.12, 1.8)));
      });
      K.vignette(g, 0.4);
    }

    bailuCandy(g, t, T) {
      vgrad(g, 0, LH, [[0, '#14202a'], [1, '#0e161e']]);
      const look = G.lookOf('bailu', this.game), shake = seg(t, 0.6, 0.95), eat = eOut(seg(t, 1.0, 1.3)), puff = seg(t, 1.3, 1.4);
      this.gynoidAt(g, 238 + Math.sin(T * 40) * 4 * shake * (1 - seg(t, 0.9, 0.95)), 236, 150, { t: T });
      if (shake > 0 && shake < 1) lighter(g, () => { line(g, rgba('#ff4a4a', 0.8), 1, 196, 120 + shake * 30, 280, 120 + shake * 30); });
      if (t > 0.75 && t < 1.1) { g.save(); g.font = 'bold 22px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = rgba('#ff4a4a', 0.9); g.fillText('✕', 238, 70); g.restore(); }
      const bx = 96, by = 246, s = 2.2;
      this.bust(g, look, bx, by, 64, s);
      const [mx, my] = this.bustAt(look, bx, by, 64, s, 1), mouthX = bx, mouthY = my + 30;
      const cxp = lerp(lerp(150, 190, eOut(seg(t, 0.1, 0.4))), mouthX, eat), cyp = lerp(160, mouthY, eat);
      if (eat < 1) { this.candy(g, cxp, cyp, 1.4); hand(g, cxp + 4, cyp + 36, 0.6, 1, false); }
      if (puff > 0) { ell(g, look.skin, bx + 22, mouthY - 2, 7 * puff, 6 * puff); ell(g, '#ffb0c0', bx + 24, mouthY - 4, 3 * puff, 2 * puff); for (let i = 0; i < 3; i++) { const q = (T * 0.8 + i / 3) % 1; this.heartAt(g, bx + 40 + i * 12, 120 - q * 30, 3, (1 - q) * puff); } }
      K.vignette(g, 0.4);
    }

    bailuHeight(g, t, T) {
      vgrad(g, 0, LH, [[0, '#2a3a4a'], [1, '#1a2430']]);
      rect(g, '#e8e4dc', 20, 30, 280, 180);
      for (let i = 0; i < 5; i++) { const y = 70 + i * 28; line(g, '#9aa8b8', 1, 20, y, 300, y); g.save(); g.font = '7px sans-serif'; g.fillStyle = '#6a7888'; g.fillText(String(180 - i * 10), 24, y - 2); g.restore(); }
      const look = G.lookOf('bailu', this.game), lift = eOut(seg(t, 1.1, 1.4)), hop = t < 1.1 ? Math.max(0, Math.sin(t / 0.3 * Math.PI)) * 10 : 0;
      ['talleah', 'amanda', 'makoto'].forEach((id, i) => { const x = [70, 220, 270][i]; ell(g, 'rgba(0,0,0,0.3)', x, 222, 18, 4); figure(g, lookOf(id, this.game, true), x, 224, 3, { s: 0.6 }); });
      const bx = 150, by = 224 - hop - 46 * lift;
      if (lift > 0) lighter(g, () => { glow(g, bx, by + 4, 40, '#7af0e0', 0.5 * lift); for (let i = 0; i < 6; i++) { const q = i / 6 * Math.PI * 2 + T * 3; line(g, rgba('#a4f0ee', 0.8 * lift), 1, bx + Math.cos(q) * 20, by + Math.sin(q) * 6, bx + Math.cos(q + 0.6) * 26, by + Math.sin(q + 0.6) * 8); } });
      ell(g, 'rgba(0,0,0,0.3)', bx, 222, 14, 3);
      figure(g, look, bx, by, 3, { s: 0.5 });
      if (t > 1.5) lighter(g, () => glow(g, CX, CY, 200, '#ffffff', 0.6 * (1 - seg(t, 1.5, 1.7))));
      K.vignette(g, 0.4);
    }

    bailuPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#7af0e0', 1, 70);
      const look = G.lookOf('bailu', this.game), x = CX - 30, y = 250, s = 2.6, up = eOut(seg(t, 0.15, 0.6));
      lighter(g, () => { for (let i = 0; i < 12; i++) { const q = (T * 0.25 + hx(i, 1, 67)) % 1; this.plus(g, 30 + hx(i, 2, 67) * 260, 230 - q * 220, 3, '#7af0c0', Math.sin(Math.PI * q) * 0.8); } for (let i = 0; i < 3; i++) { const q = i / 3 * Math.PI * 2 + T * 1.2; line(g, rgba('#a4f0ee', 0.5), 2, x + Math.cos(q) * 90, 130 + Math.sin(q) * 30, x + Math.cos(q + 0.5) * 100, 130 + Math.sin(q + 0.5) * 34); } });
      this.bust(g, look, x, y, 64, s);
      this.gourd(g, lerp(CX + 90, CX + 60, up), lerp(260, 196, up), 2);
      this.camFlashes(g, t);
      K.vignette(g, 0.4);
    }

    phone(g, x, y, s) {
      rect(g, '#2a2a34', x - 6 * s, y - 10 * s, 12 * s, 20 * s); rect(g, '#7ab4ec', x - 5 * s, y - 8 * s, 10 * s, 15 * s); ell(g, '#ea6aa8', x + 3 * s, y - 9 * s, 1.2 * s, 1.2 * s);
    }

    marchSelfie(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('march', this.game), pals = [['amanda', true], ['talleah', true], ['makoto', true]], shot = Math.min(2, Math.floor(t / 0.45) - 1);
      const pal = shot >= 0 ? pals[shot] : null;
      if (pal) { ell(g, 'rgba(0,0,0,0.4)', 196, 222, 18, 4); figure(g, lookOf(pal[0], this.game, pal[1]), 196, 224, 3, { s: 0.6 }); }
      ell(g, 'rgba(0,0,0,0.45)', 140, 222, 20, 5);
      figure(g, look, 140, 224, 3, { s: 0.6 });
      this.phone(g, 112, 104, 1.4);
      line(g, '#f9e0d2', 3, 120, 130, 114, 112);
      for (let i = 0; i <= shot; i++) {
        const k = eOut(seg(t, 0.5 + i * 0.45, 0.75 + i * 0.45));
        g.save(); g.translate(lerp(112, 252 + i * 8, k), lerp(104, 64 + i * 26, k)); g.rotate((i - 1) * 0.15 * k); g.scale(0.4 + 0.6 * k, 0.4 + 0.6 * k);
        rect(g, '#f4f2ea', -16, -14, 32, 30); vgrad(g, -11, 13, [[0, '#2a2a40'], [1, '#6a5aa0']], -13, 26);
        const cv = G.bustCanvas(lookOf(pals[i][0], this.game, pals[i][1]), 64); g.imageSmoothingEnabled = false; g.drawImage(cv, -13, -11, 26, 24);
        g.restore();
      }
      const fl = (t % 0.45) / 0.45;
      if (t > 0.45 && fl < 0.3) lighter(g, () => glow(g, 112, 100, 60, '#ffffff', 0.8 * (1 - fl / 0.3)));
      K.vignette(g, 0.4);
    }

    marchPompom(g, t, T) {
      this.stageFloor(g, T, 0.55);
      this.beam(g, CX, '#ff9ac8', 1, 56);
      const pp = G.bustCanvas(G.lookOf('pompom', this.game), 64), pop = eOut(seg(t, 0, 0.3)), x = CX, y = 214;
      lighter(g, () => sparks(g, x, 120, seg(t, 0, 0.5), '#ff9ac8', 16, 47));
      g.save(); g.imageSmoothingEnabled = false; g.translate(x, y); g.scale(pop, pop); g.drawImage(pp, -64, -128, 128, 128); g.restore();
      if (pop > 0.9) {
        for (const d of [-1, 1]) { poly(g, '#6d173a', [x + d * 18, 104, x + d * 36, 104, x + d * 30, 80]); poly(g, '#ff8ac8', [x + d * 22, 102, x + d * 32, 102, x + d * 29, 88]); }
        rect(g, '#6d173a', x - 34, 104, 68, 4);
        rect(g, '#fb2894', x - 30, 196, 60, 4);
      }
      ell(g, 'rgba(0,0,0,0.4)', 70, 222, 18, 4);
      figure(g, G.lookOf('march', this.game), 70, 224, 3, { s: 0.6 });
      K.vignette(g, 0.4);
    }

    marchPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#7ab4ec', 1, 70);
      const look = G.lookOf('march', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.4));
      lighter(g, () => { for (let i = 0; i < 8; i++) { const q = i / 8 * Math.PI * 2 + T; const px = x + Math.cos(q) * 110 * k, py = 120 + Math.sin(q) * 70 * k; poly(g, rgba('#c8ecff', 0.8), [px, py - 6, px + 3, py, px, py + 6, px - 3, py]); } });
      this.bust(g, look, x, y, 64, s);
      this.phone(g, CX + 60, lerp(250, 190, k), 2);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    spear(g, x, y, len, ang, a = 1) {
      g.save(); g.globalAlpha = cl(a); g.translate(x, y); g.rotate(ang);
      line(g, '#2a2a34', 3, 0, 0, 0, -len); rect(g, '#c8a050', -3, -len * 0.7, 6, 3);
      poly(g, '#d8e4f0', [-4, -len, 4, -len, 0, -len - 16]); line(g, '#ffffff', 1, 0, -len, 0, -len - 12);
      g.restore();
    }

    danhengDesk(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('danheng', this.game);
      ell(g, 'rgba(0,0,0,0.45)', 120, 222, 22, 5);
      figure(g, look, 120, 224, 3, { s: 0.64 });
      rect(g, '#3a2a22', 60, 166, 140, 8); rect(g, '#2a3a4a', 64, 174, 132, 46); rect(g, '#5ab8e8', 64, 174, 132, 3);
      g.save(); g.translate(130, 198); rect(g, '#f2ecdc', -40, -9, 80, 18); g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#2a3a4a'; g.fillText('ИНФОРМАЦИЯ', 0, 3); g.restore();
      for (let i = 0; i < 4; i++) rect(g, ['#f4f0e4', '#e8e4d8', '#f4f0e4', '#dcd8cc'][i], 160, 160 - i * 3, 30, 4);
      const flip = Math.floor(t / 0.12) % 4;
      rect(g, '#1a2a3a', 80, 150, 40, 16); rect(g, '#f4f0e4', 82 + (flip % 2) * 18, 151, 18, 14); line(g, '#9aa8b8', 1, 85 + (flip % 2) * 18, 155, 97 + (flip % 2) * 18, 155);
      ['amanda', 'makoto', 'talleah'].forEach((id, i) => {
        const k = sm(seg(t, 0.2 + i * 0.35, 0.55 + i * 0.35)), x = lerp(LW + 30, 232 + i * 30, k), served = seg(t, 1.1, 1.4);
        ell(g, 'rgba(0,0,0,0.35)', x, 222, 14, 4);
        figure(g, lookOf(id, this.game, false), x, 224, 3, { s: 0.56 });
        if (i === 0 && served > 0) { g.save(); g.translate(lerp(160, x - 10, eOut(served)), lerp(158, 150, eOut(served))); g.rotate(-0.2); rect(g, '#f4f0e4', -8, -6, 16, 12); rect(g, '#e85a8a', -8, -6, 16, 3); g.restore(); }
      });
      K.vignette(g, 0.4);
    }

    danhengSelfie(g, t, T) {
      this.conHall(g, T);
      rect(g, 'rgba(10,6,16,0.45)', 0, 0, LW, LH);
      const dh = G.lookOf('danheng', this.game), mr = G.lookOf('march', this.game), slide = eOut(seg(t, 0, 0.25)), lean = seg(t, 0.45, 0.6);
      this.bust(g, dh, 196 + 12 * lean, 252, 64, 2.2);
      this.bust(g, mr, lerp(-60, 104, slide), 252, 64, 2.2);
      this.phone(g, lerp(-20, 60, slide), 92, 2.2);
      const fl = seg(t, 0.28, 0.42);
      if (fl > 0 && fl < 1) lighter(g, () => glow(g, 60, 90, 90, '#ffffff', 0.9 * (1 - fl)));
      if (t > 0.42) { g.save(); g.globalAlpha = seg(t, 0.42, 0.5); for (let i = 0; i < 3; i++) line(g, '#5ab8e8', 1, 250 + i * 6, 74 - i * 2, 256 + i * 6, 82 - i * 2); g.restore(); }
      K.vignette(g, 0.4);
    }

    danhengPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#5ad8c8', 1, 70);
      const look = G.lookOf('danheng', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.35));
      lighter(g, () => { for (let i = 0; i < 6; i++) { const q = i / 6 * Math.PI * 2 + T * 2.4; g.strokeStyle = rgba('#8af0e0', 0.5 * k); g.lineWidth = 2; g.beginPath(); g.arc(x + 40, 130, 70 + i * 6, q, q + 0.9); g.stroke(); } });
      this.spear(g, lerp(CX + 120, CX + 60, k), 240, 190, -0.12, k);
      this.bust(g, look, x, y, 64, s);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    giftBox(g, x, y, s, col) {
      rect(g, col, x - 8 * s, y - 8 * s, 16 * s, 14 * s); rect(g, '#ffd060', x - 1.5 * s, y - 8 * s, 3 * s, 14 * s); rect(g, '#ffd060', x - 8 * s, y - 3 * s, 16 * s, 3 * s);
      ell(g, '#ffd060', x - 3 * s, y - 10 * s, 3 * s, 2 * s); ell(g, '#ffd060', x + 3 * s, y - 10 * s, 3 * s, 2 * s);
    }

    astaShop(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('asta', this.game), cols = ['#e85a8a', '#5ab8e8', '#ffd060', '#8a4aff', '#3aa85a', '#e8b040'];
      rect(g, '#3a2a22', 150, 168, 150, 8); rect(g, '#5a3a4a', 154, 176, 142, 44); rect(g, '#c8a050', 154, 176, 142, 3);
      const n = Math.min(6, Math.floor(seg(t, 0.3, 1.3) * 6.99));
      cols.forEach((col, i) => { if (i < n) return; rect(g, col, 162 + i * 22, 140, 16, 26); rect(g, '#f4f0e4', 165 + i * 22, 144, 10, 8); });
      for (let i = 0; i < n; i++) { const k = eOut(seg(t, 0.3 + i / 6, 0.45 + i / 6)); rect(g, cols[i], lerp(162 + i * 22, 62 + (i % 3) * 18, k), lerp(140, 196 - Math.floor(i / 3) * 26, k), 16, 26); }
      ell(g, 'rgba(0,0,0,0.45)', 112, 222, 20, 5);
      figure(g, look, 112, 224, 3, { s: 0.62 });
      const card = seg(t, 1.25, 1.5);
      if (card > 0) { g.save(); g.translate(140, 120 - card * 8); g.rotate(-0.2); rect(g, '#d8b050', -12, -7, 24, 14); rect(g, '#2a2420', -12, -3, 24, 3); g.restore(); lighter(g, () => glow(g, 140, 116, 16, '#ffe8a0', 0.6 * (1 - card))); }
      g.save(); g.font = 'bold 10px monospace'; g.fillStyle = '#ffd060'; g.textAlign = 'right'; rect(g, 'rgba(10,6,16,0.7)', 214, 118, 82, 16); g.fillText((n * 20000).toLocaleString('ru-RU') + ' кр.', 292, 130); g.restore();
      K.vignette(g, 0.4);
    }

    astaGift(g, t, T) {
      this.stageFloor(g, T, 0.55);
      this.beam(g, 70, '#ff9a6a', 1, 40);
      const look = G.lookOf('asta', this.game), ids = ['amanda', 'makoto', 'talleah'], cols = ['#ff6aa8', '#e0304a', '#4a90e0'];
      ell(g, 'rgba(0,0,0,0.45)', 70, 222, 20, 5);
      figure(g, look, 70, 224, 3, { s: 0.62 });
      ids.forEach((id, i) => {
        const x = 150 + i * 56, k = eOut(seg(t, 0.05 + i * 0.12, 0.35 + i * 0.12));
        ell(g, 'rgba(0,0,0,0.4)', x, 222, 16, 4);
        figure(g, lookOf(id, this.game, true), x, 224, 3, { s: 0.58 });
        this.giftBox(g, lerp(84, x, k), lerp(150, 168, k) - Math.sin(Math.PI * k) * 50, 1.2, cols[i]);
        if (k >= 1) lighter(g, () => sparks(g, x, 160, seg(t, 0.35 + i * 0.12, 0.9 + i * 0.12), '#ffd060', 8, 71 + i));
      });
      K.vignette(g, 0.4);
    }

    astaPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      const look = G.lookOf('asta', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.5));
      const P = [[214, 44], [244, 62], [270, 50], [290, 80], [256, 96], [226, 84]];
      lighter(g, () => {
        K.stars(g, T, 60, 2, 0.6);
        for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], q = cl(k * P.length - i); if (q > 0) line(g, rgba('#9cd2f6', 0.7), 1, a[0], a[1], lerp(a[0], b[0], q), lerp(a[1], b[1], q)); glow(g, a[0], a[1], 6, '#ffffff', 0.9 * cl(k * P.length - i + 1)); }
      });
      this.beam(g, CX, '#ff9a6a', 1, 70);
      this.bust(g, look, x, y, 64, s);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    peppy(g, x, y, s, T, ears) {
      const wag = Math.sin(T * 14) * 3 * s;
      ell(g, '#f4f2ee', x, y, 12 * s, 7 * s); ell(g, '#f4f2ee', x + 11 * s, y - 6 * s, 7 * s, 6 * s);
      for (const d of [-6, -1, 4, 9]) rect(g, '#e8e4dc', x + d * s, y + 4 * s, 3 * s, 5 * s);
      poly(g, '#f4f2ee', [x - 11 * s, y - 2 * s, x - 18 * s, y - 10 * s + wag, x - 12 * s, y - 6 * s]);
      ell(g, '#d8d0c8', x + 7 * s, y - 10 * s, 3 * s, 4 * s); rect(g, '#1a1a1e', x + 12 * s, y - 8 * s, 2 * s, 2 * s); ell(g, '#2a2a30', x + 17 * s, y - 5 * s, 1.6 * s, 1.4 * s);
      if (ears) { poly(g, '#e0304a', [x + 6 * s, y - 11 * s, x + 9 * s, y - 19 * s, x + 11 * s, y - 11 * s]); poly(g, '#e0304a', [x + 12 * s, y - 11 * s, x + 15 * s, y - 19 * s, x + 17 * s, y - 11 * s]); }
    }

    arlanSearch(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('arlan', this.game), walk = seg(t, 0, 1.0), x = lerp(40, 120, walk), spot = seg(t, 1.25, 1.4);
      const crowd = [['amanda', false], ['makoto', false], ['talleah', false], ['kazuma', null]];
      crowd.forEach(([id, lit], i) => { const cx = 170 + i * 40; ell(g, 'rgba(0,0,0,0.35)', cx, 222, 14, 4); figure(g, lit === null ? G.lookOf(id, this.game) : lookOf(id, this.game, lit), cx, 224, 3, { s: 0.56 }); });
      const px = 190 + Math.sin(T * 2) * 4;
      this.peppy(g, px, 196, 1.3, T, true);
      ell(g, 'rgba(0,0,0,0.45)', x, 222, 20, 5);
      figure(g, look, x, 224 - (walk < 1 ? Math.abs(Math.sin(t * 12)) * 1.5 : 0), 3, { s: 0.64 });
      const ang = lerp(-0.4, 0.3, (Math.sin(t * 4) + 1) / 2) * (1 - spot) + spot * 0.55;
      lighter(g, () => { poly(g, rgba('#fff4c0', 0.18), [x + 10, 110, x + 10 + Math.cos(ang) * 160, 110 + Math.sin(ang) * 160 - 30, x + 10 + Math.cos(ang) * 160, 110 + Math.sin(ang) * 160 + 30]); });
      if (spot > 0) { g.save(); g.globalAlpha = spot; g.font = 'bold 14px sans-serif'; g.fillStyle = '#ffd060'; g.fillText('!', x + 14, 80); g.restore(); }
      K.vignette(g, 0.4);
    }

    arlanFound(g, t, T) {
      this.stageFloor(g, T, 0.55);
      this.beam(g, CX, '#d8388a', 1, 50);
      const look = G.lookOf('arlan', this.game), lift = eOut(seg(t, 0.1, 0.4));
      ell(g, 'rgba(0,0,0,0.45)', CX, 222, 22, 5);
      figure(g, look, CX, 224, 3, { s: 0.66 });
      this.peppy(g, CX + 18, lerp(216, 132, lift), 1.3, T, true);
      if (lift >= 1) for (let i = 0; i < 3; i++) { const q = (T * 0.8 + i / 3) % 1; this.heartAt(g, CX + 30 + i * 12, 110 - q * 30, 3, (1 - q) * seg(t, 0.4, 0.6)); }
      g.save(); g.font = 'bold 13px Georgia, serif'; g.fillStyle = rgba('#ffd060', seg(t, 0.5, 0.7)); g.fillText('10 / 10', 40, 60); g.restore();
      K.vignette(g, 0.4);
    }

    arlanPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#b48cff', 1, 70);
      const look = G.lookOf('arlan', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.35));
      this.blade(g, lerp(CX + 110, CX + 66, k), 236, 150, 0.15, '#c8ccd4', k);
      lighter(g, () => { for (let i = 0; i < 5; i++) { const ph = (T * 3 + i * 0.37) % 1; let px = 40 + i * 60, py = 40; for (let j = 0; j < 4; j++) { const nx = px + (hx(i, j, Math.floor(T * 8)) - 0.5) * 24, ny = py + 24; line(g, rgba('#c8a0ff', 0.8 * (1 - ph)), 1, px, py, nx, ny); px = nx; py = ny; } } });
      this.bust(g, look, x, y, 64, s);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    hammer(g, x, y, s, ang) {
      g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
      line(g, '#4a3a5a', 3, 0, 0, 0, -40); rect(g, '#6a5a8a', -12, -52, 24, 14); rect(g, '#8a7ab0', -12, -52, 24, 4); ell(g, '#ffd060', 0, -45, 3, 3);
      g.restore();
    }

    diamond(g, x, y, r) {
      poly(g, '#bfe8ff', [x - r, y, x - r * 0.5, y - r * 0.6, x + r * 0.5, y - r * 0.6, x + r, y, x, y + r * 1.2]);
      poly(g, '#e8f8ff', [x - r * 0.5, y - r * 0.6, x, y, x + r * 0.5, y - r * 0.6]);
      line(g, rgba('#7ab4ec', 0.8), 1, x - r, y, x + r, y); line(g, rgba('#7ab4ec', 0.8), 1, x, y, x, y + r * 1.2);
    }

    hertaDolls(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('herta', this.game);
      rect(g, '#3a2a22', 150, 168, 150, 8); rect(g, '#4a3a5a', 154, 176, 142, 44); rect(g, '#c8a050', 154, 176, 142, 3);
      g.save(); g.translate(225, 198); rect(g, '#f2ecdc', -34, -8, 68, 16); g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#4a3a5a'; g.fillText('ФИГУРКИ', 0, 3); g.restore();
      for (let i = 0; i < 5; i++) { rect(g, '#2a2232', 160 + i * 28, 164, 20, 4); figure(g, look, 170 + i * 28, 166, 3, { s: 0.22 }); }
      const walk = sm(seg(t, 0, 0.5)), x = lerp(-20, 110, walk);
      ell(g, 'rgba(0,0,0,0.45)', x, 222, 18, 5);
      figure(g, look, x, 224 - (walk < 1 ? Math.abs(Math.sin(t * 14)) * 2 : 0), 3, { s: 0.6 });
      const scan = seg(t, 0.5, 0.9);
      if (scan > 0 && scan < 1) lighter(g, () => line(g, rgba('#9ad8ff', 0.8), 1, 154, 120 + scan * 50, 300, 120 + scan * 50));
      const tag = eOut(seg(t, 0.95, 1.2));
      if (tag > 0) { g.save(); g.translate(226, 124); g.scale(tag, tag); g.rotate(-0.1); rect(g, '#14121c', -24, -12, 48, 24); rect(g, '#f2ecdc', -22, -10, 44, 20); g.font = 'bold 13px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#c8243a'; g.fillText('70%', 0, 5); g.restore(); }
      K.vignette(g, 0.4);
    }

    hertaSpin(g, t, T) {
      this.stageFloor(g, T, 0.55);
      this.beam(g, CX, '#a8d8ff', 1, 56);
      const look = G.lookOf('herta', this.game), sp = t * 18;
      lighter(g, () => { for (let i = 0; i < 3; i++) { g.strokeStyle = rgba('#c8e0ff', 0.5 - i * 0.12); g.lineWidth = 2; g.beginPath(); g.ellipse(CX, 170, 60 + i * 10, 16 + i * 3, 0, sp + i, sp + i + 2.4); g.stroke(); } });
      ell(g, 'rgba(0,0,0,0.45)', CX, 222, 20, 5);
      figure(g, look, CX, 224, 3, { s: 0.62, flip: Math.floor(sp / 3) % 2 === 1 });
      this.hammer(g, CX + Math.cos(sp) * 46, 176 + Math.sin(sp) * 10, 1.1, sp + Math.PI / 2);
      for (let i = 0; i < 4; i++) { const k = seg(t, 0.45 + i * 0.04, 0.9); if (k > 0) figure(g, look, CX + (i - 1.5) * 40 + (i < 2 ? -1 : 1) * k * 120, 180 - Math.sin(Math.PI * k) * 60, 3, { s: 0.22, flip: i % 2 === 0 }); }
      K.vignette(g, 0.4);
    }

    hertaPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#a8d8ff', 1, 70);
      const look = G.lookOf('herta', this.game), x = CX - 30, y = 250, s = 2.6, fall = eOut(seg(t, 0, 0.32));
      this.bust(g, look, x, y, 64, s);
      this.diamond(g, CX + 96, lerp(-40, 90, fall), 26);
      if (t > 0.3 && t < 0.7) lighter(g, () => { sparks(g, CX + 96, 116, seg(t, 0.3, 0.7), '#e8f8ff', 14, 87); glow(g, CX + 96, 90, 40, '#bfe8ff', 0.6 * (1 - seg(t, 0.3, 0.7))); });
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    axe(g, x, y, ang, s) {
      g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
      ell(g, '#2d5bd3', 0, 0, 12, 9); ell(g, '#2d5bd3', -8, -2, 8, 7); ell(g, '#1a1a20', 0, 0, 3, 3);
      rect(g, '#5a3a2a', 8, -1.5, 30, 3); rect(g, '#2a2a30', 36, -3, 7, 6);
      for (let i = 0; i < 3; i++) line(g, rgba('#e8e8f0', 0.8), 1, -6, -2 + i * 1.6, 38, -2 + i * 1.6);
      g.restore();
    }

    servalGig(g, t, T) {
      this.stageFloor(g, T, 0.55);
      const look = G.lookOf('serval', this.game), beat = Math.abs(Math.sin(T * Math.PI * 130 / 60));
      for (let i = 0; i < 3; i++) this.beam(g, 90 + i * 70, ['#2d5bd3', '#ff6aa8', '#ffd060'][i], 0.5 + 0.5 * Math.sin(T * 4 + i * 2), 40);
      ell(g, 'rgba(0,0,0,0.45)', CX, 196, 20, 5);
      figure(g, look, CX, 198, 3, { s: 0.6 });
      this.axe(g, CX + 2, 150, -0.5 + Math.sin(T * 14) * 0.05, 1.1);
      lighter(g, () => { for (let i = 0; i < 4; i++) { const q = (T * 0.9 + i / 4) % 1; g.save(); g.globalAlpha = 1 - q; g.font = 'bold 12px serif'; g.fillStyle = '#9ad8ff'; g.fillText(i % 2 ? '♫' : '♪', CX + 30 + q * 40, 120 - q * 50 + i * 4); g.restore(); } });
      [['amanda', true], ['makoto', true], ['talleah', true], ['kazuma', null]].forEach(([id, lit], i) => {
        const x = 50 + i * 74, hop = beat * 4 * seg(t, 0.3, 0.5);
        g.save(); g.globalAlpha = 0.9; figure(g, lit === null ? G.lookOf(id, this.game) : lookOf(id, this.game, lit), x, 316 - hop, 3, { s: 0.62, tint: '#0a0810', ta: 0.92 }); g.restore();
        lighter(g, () => { const sx = x + 14, sy = 206 - hop; line(g, ['#ff6aa8', '#5ab8e8', '#ffd060', '#9affb0'][i], 3, sx, sy + 10, sx + Math.sin(T * 6 + i) * 6, sy - 10); glow(g, sx, sy - 6, 10, ['#ff6aa8', '#5ab8e8', '#ffd060', '#9affb0'][i], 0.6); });
      });
      K.vignette(g, 0.4);
    }

    servalBrother(g, t, T) {
      this.conHall(g, T);
      rect(g, 'rgba(10,6,16,0.4)', 0, 0, LW, LH);
      const gp = G.lookOf('gepard', this.game), sv = G.lookOf('serval', this.game), bob = Math.sin(T * 8) * 2 * seg(t, 0.2, 0.4);
      this.bust(g, gp, 220, 252 + bob, 64, 2.1);
      for (let i = 0; i < 3; i++) { const q = (T * 0.8 + i / 3) % 1, a = seg(t, 0.3, 0.5) * (1 - q); g.save(); g.globalAlpha = a; g.font = 'bold 12px serif'; g.fillStyle = '#ffd060'; g.fillText(i % 2 ? '♫' : '♪', 262 + i * 8 + q * 16, 96 - q * 40); g.restore(); }
      this.bust(g, sv, 84, 252, 64, 2.0);
      this.wink(g, sv, 84, 252, 64, 2.0, 1, seg(t, 0.55, 0.65));
      this.axe(g, 112, 232, -0.3, 1.4);
      K.vignette(g, 0.4);
    }

    servalPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#8ac8ff', 1, 70);
      const look = G.lookOf('serval', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.3));
      lighter(g, () => { for (let i = 0; i < 6; i++) { let px = 30 + i * 52, py = 30; for (let j = 0; j < 4; j++) { const nx = px + (hx(i, j, Math.floor(T * 10)) - 0.5) * 22, ny = py + 20; line(g, rgba('#9ad8ff', 0.7 * k), 1, px, py, nx, ny); px = nx; py = ny; } } });
      this.bust(g, look, x, y, 64, s);
      this.axe(g, CX + 66, 214, -0.7, 2.2 * k);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    teddy(g, x, y, s, arm) {
      ell(g, '#b8885a', x, y, 10 * s, 12 * s); ell(g, '#b8885a', x, y - 16 * s, 8 * s, 8 * s);
      ell(g, '#b8885a', x - 7 * s, y - 22 * s, 3 * s, 3 * s); ell(g, '#b8885a', x + 7 * s, y - 22 * s, 3 * s, 3 * s);
      ell(g, '#e8c8a0', x, y + 2 * s, 6 * s, 7 * s); ell(g, '#e8c8a0', x, y - 13 * s, 3 * s, 2 * s);
      rect(g, '#2a1a10', x - 4 * s, y - 18 * s, 2 * s, 2 * s); rect(g, '#2a1a10', x + 2 * s, y - 18 * s, 2 * s, 2 * s);
      ell(g, '#b8885a', x - 11 * s, y - 2 * s + arm * 8 * s, 4 * s, 6 * s); ell(g, '#b8885a', x + 11 * s, y - 2 * s, 4 * s, 6 * s);
      if (arm < 1) for (let i = 0; i < 3; i++) line(g, '#2a2a30', 1, x - 13 * s, y - 7 * s + i * 2 * s, x - 9 * s, y - 6 * s + i * 2 * s);
    }

    syringe(g, x, y, ang, s) {
      g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
      rect(g, '#e8f0f4', -14, -4, 28, 8); rect(g, '#ff6aa8', -12, -2, 18, 4); rect(g, '#9aa8b8', 14, -1, 10, 2); rect(g, '#5a6878', -20, -5, 6, 10); rect(g, '#5a6878', -24, -1, 4, 2);
      g.restore();
    }

    natashaTeddy(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('natasha', this.game), sew = seg(t, 0.4, 1.2), give = eOut(seg(t, 1.25, 1.5));
      rect(g, '#f2ecdc', 172, 92, 120, 18); g.save(); g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#c8243a'; g.fillText('ДЕТСКАЯ КОМНАТА', 232, 104); g.restore();
      ell(g, 'rgba(0,0,0,0.45)', 112, 222, 20, 5);
      figure(g, look, 112, 224, 3, { s: 0.62 });
      const kx = 236;
      ell(g, 'rgba(0,0,0,0.35)', kx, 206, 14, 4);
      this.kid(g, kx, 206, '#e8b040', give > 0.9 ? Math.max(0, Math.sin(T * 9)) * 6 : 0, 1.9);
      const bx = lerp(140, kx - 20, give), by = lerp(170, 176, give);
      this.teddy(g, bx, by, 1.1, sew >= 1 ? 1 : 0);
      if (sew > 0 && sew < 1) { const nx = bx - 12 + Math.sin(sew * 30) * 4, ny = by - 6 + sew * 6; line(g, '#c8ccd4', 1, nx, ny, nx + 6, ny - 8); line(g, '#ff6aa8', 1, nx + 6, ny - 8, nx + 14, ny - 14); }
      if (give >= 1) for (let i = 0; i < 3; i++) { const q = (T * 0.8 + i / 3) % 1; this.heartAt(g, kx - 10 + i * 12, 150 - q * 30, 3, 1 - q); }
      if (t < 0.4) { g.save(); g.font = 'bold 10px sans-serif'; g.fillStyle = '#9ad8ff'; g.fillText('у-у…', kx - 10, 160); g.restore(); }
      K.vignette(g, 0.4);
    }

    natashaShot(g, t, T) {
      this.stageFloor(g, T, 0.55);
      this.beam(g, 90, '#ff6aa8', 1, 40);
      const look = G.lookOf('natasha', this.game), kz = G.lookOf('kazuma', this.game), run = seg(t, 0.15, 0.9);
      ell(g, 'rgba(0,0,0,0.45)', 90, 222, 20, 5);
      figure(g, look, 90, 224, 3, { s: 0.62 });
      this.syringe(g, 122, 150, -0.2, 2.2);
      lighter(g, () => glow(g, 150, 146, 14, '#ff6aa8', 0.6));
      const kx = lerp(220, LW + 40, eOut(run));
      ell(g, 'rgba(0,0,0,0.4)', kx, 222, 18, 4);
      figure(g, kz, kx, 224 - Math.abs(Math.sin(T * 18)) * 3 * (run > 0 ? 1 : 0), 3, { s: 0.6 });
      if (run > 0 && run < 1) for (let i = 0; i < 4; i++) line(g, rgba('#c8d0e0', 0.7), 2, kx - 30 - i * 10, 160 + i * 12, kx - 60 - i * 10, 160 + i * 12);
      if (t < 0.3) { g.save(); g.font = 'bold 14px sans-serif'; g.fillStyle = '#ffd060'; g.fillText('!', 226, 100); g.restore(); }
      K.vignette(g, 0.4);
    }

    natashaPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#ff6aa8', 1, 70);
      const look = G.lookOf('natasha', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.35));
      lighter(g, () => { const pulse = (T * 1.6) % 1; let px = 0; g.strokeStyle = rgba('#7af0c0', 0.7); g.lineWidth = 2; g.beginPath(); g.moveTo(0, 60); for (let i = 0; i <= 32; i++) { px = i * 10; const ph = ((i / 32) - pulse + 1) % 1; g.lineTo(px, 60 - (ph < 0.06 ? 24 * Math.sin(ph / 0.06 * Math.PI) : 0)); } g.stroke(); });
      this.bust(g, look, x, y, 64, s);
      this.syringe(g, CX + 100, lerp(260, 214, k), -0.9, 2.6);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    trinkets(g, x, y, open, T) {
      if (open <= 0) return;
      const cols = ['#e0304a', '#ff6aa8', '#4a90e0', '#9affb0', '#ffd060', '#c08aff'];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) { const i = r * 2 + c, sx = x + (c ? 1 : -1) * (10 + 14 * open), sy = y + r * 16; line(g, '#c8a050', 1, sx, sy - 6, sx, sy - 2); ell(g, cols[i], sx, sy + 2, 5 * open, 5 * open); ell(g, '#f2ecdc', sx, sy + 2, 2 * open, 2 * open); }
      lighter(g, () => glow(g, x, y + 16, 30, '#ffd060', 0.3 * open + 0.1 * Math.sin(T * 6)));
    }

    sampoDeal(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('sampo', this.game), open = eOut(seg(t, 0.1, 0.4)), x = 128;
      ell(g, 'rgba(0,0,0,0.45)', x, 222, 22, 5);
      figure(g, look, x, 224, 3, { s: 0.64 });
      this.trinkets(g, x, 128, open, T);
      [['makoto', false], ['kazuma', null]].forEach(([id, lit], i) => {
        const cx = 210 + i * 48, lean = seg(t, 0.4, 0.7);
        ell(g, 'rgba(0,0,0,0.35)', cx, 222, 14, 4);
        figure(g, lit === null ? G.lookOf(id, this.game) : lookOf(id, this.game, lit), cx - 6 * lean, 224, 3, { s: 0.58 });
      });
      const buy = eOut(seg(t, 0.8, 1.1));
      if (buy > 0) { ell(g, '#e0304a', lerp(x + 24, 204, buy), lerp(140, 150, buy) - Math.sin(Math.PI * buy) * 20, 5, 5); for (let i = 0; i < 3; i++) { const k = seg(t, 1.1 + i * 0.08, 1.5 + i * 0.08); if (k > 0 && k < 1) ell(g, '#ffd060', lerp(204, x + 20, k), 150 - Math.sin(Math.PI * k) * 24, 3, 3); } }
      K.vignette(g, 0.4);
    }

    sampoChase(g, t, T) {
      this.conHall(g, T);
      const sp = G.lookOf('sampo', this.game), gp = G.lookOf('gepard', this.game), d = BAR / 2, k = t / d;
      const sx = lerp(-30, LW + 60, k), gx = sx - 110;
      ell(g, 'rgba(0,0,0,0.4)', sx, 222, 18, 4);
      figure(g, sp, sx, 224 - Math.abs(Math.sin(T * 18)) * 3, 3, { s: 0.62, flip: true });
      ell(g, 'rgba(0,0,0,0.4)', gx, 222, 18, 4);
      figure(g, gp, gx, 224 - Math.abs(Math.sin(T * 18 + 1)) * 3, 3, { s: 0.64, flip: true });
      for (let i = 0; i < 3; i++) { const bx = sx - 30 - i * 12; ell(g, ['#e0304a', '#4a90e0', '#ffd060'][i], bx, 200 + Math.sin(T * 10 + i) * 6, 4, 4); }
      lighter(g, () => { for (let i = 0; i < 4; i++) line(g, rgba('#c8d0e0', 0.6), 2, gx - 30 - i * 8, 140 + i * 16, gx - 70 - i * 8, 140 + i * 16); });
      if (k < 0.4) { g.save(); g.font = 'bold 14px sans-serif'; g.fillStyle = '#ff6a6a'; g.fillText('!', gx + 10, 92); g.restore(); }
      K.vignette(g, 0.4);
    }

    sampoPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#c08aff', 1, 70);
      const look = G.lookOf('sampo', this.game), x = CX - 30, y = 250, s = 2.6;
      for (let i = 0; i < 10; i++) { const q = (T * 0.5 + hx(i, 1, 13)) % 1, px = 20 + hx(i, 2, 13) * 280; ell(g, '#ffd060', px, q * 240, 4, 4 * Math.abs(Math.cos(T * 6 + i))); }
      this.bust(g, look, x, y, 64, s);
      this.wink(g, look, x, y, 64, s, 1, seg(t, 0.3, 0.4) * (1 - seg(t, 0.6, 0.7)));
      this.trinkets(g, CX + 80, 160, 1, T);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    drill(g, x, y, s, T) {
      g.save(); g.translate(x, y); g.scale(s, s);
      rect(g, '#6a5a3a', -6, 0, 12, 18); rect(g, '#c8a050', -8, -4, 16, 6);
      poly(g, '#a8acb4', [-10, -4, 10, -4, 0, -34]);
      for (let i = 0; i < 4; i++) { const yy = -8 - i * 7 - ((T * 40) % 7); if (yy > -32) line(g, '#6a6e78', 1.4, -8 + i * 2, yy, 8 - i * 2, yy - 3); }
      g.restore();
    }

    hookMarch(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('hook', this.game), walk = seg(t, 0, 1.3), x = lerp(-20, 200, walk), step = walk < 1 ? Math.abs(Math.sin(T * 12)) * 2 : 0;
      ['#e8b040', '#2d5bd3', '#e85a8a'].forEach((col, i) => { const kx = x - 54 - i * 46; ell(g, 'rgba(0,0,0,0.35)', kx, 204, 14, 4); this.kid(g, kx, 204, col, walk < 1 ? Math.abs(Math.sin(T * 12 + i)) * 4 : 0, 2.1); });
      const kz = G.lookOf('kazuma', this.game), join = seg(t, 1.2, 1.5);
      ell(g, 'rgba(0,0,0,0.4)', 280, 222, 16, 4);
      figure(g, kz, 280, 224, 3, { s: 0.58 });
      ell(g, 'rgba(0,0,0,0.45)', x, 222, 18, 5);
      figure(g, look, x, 224 - step, 3, { s: 0.56 });
      this.drill(g, x + 18, 176 - step, 1.2, T);
      if (join > 0) { const hy = lerp(30, 76, eOut(join)); poly(g, '#e8b040', [266, hy, 294, hy, 288, hy - 14, 272, hy - 14]); rect(g, '#c8a050', 264, hy - 2, 32, 4); }
      K.vignette(g, 0.4);
    }

    hookHide(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('hook', this.game), dive = seg(t, 0.05, 0.2), pop = eOut(seg(t, 0.45, 0.6));
      rect(g, '#3a2a22', 110, 168, 120, 8); rect(g, '#5a3a4a', 114, 176, 112, 46);
      const y = 224 - (1 - dive) * 0 + dive * 80 * (1 - pop) - pop * 30 * Math.sin(Math.PI * Math.min(1, pop * 1.2));
      if (dive < 1 || pop > 0) { g.save(); g.beginPath(); g.rect(0, 0, LW, 176); g.clip(); figure(g, look, 170, y, 3, { s: 0.56 }); g.restore(); }
      if (pop > 0) { lighter(g, () => sparks(g, 170, 150, seg(t, 0.45, 0.85), '#ffd060', 14, 31)); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; rect(g, '#6a4a3a', 170 + Math.cos(a) * 40 * pop, 176 - Math.sin(Math.abs(a)) * 30 * pop, 6, 4); } }
      ['amanda', 'talleah'].forEach((id, i) => { const cx = 60 + i * 210; ell(g, 'rgba(0,0,0,0.35)', cx, 222, 14, 4); figure(g, lookOf(id, this.game, true), cx, 224 - (pop > 0 ? Math.max(0, Math.sin(T * 10)) * 3 : 0), 3, { s: 0.58 }); });
      if (dive >= 1 && pop <= 0) { g.save(); g.font = 'bold 12px sans-serif'; g.fillStyle = '#ffd060'; g.fillText('?', 64, 100); g.fillText('?', 270, 100); g.restore(); }
      K.vignette(g, 0.4);
    }

    hookPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#ff8a3a', 1, 70);
      const look = G.lookOf('hook', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.3));
      lighter(g, () => { for (let i = 0; i < 18; i++) { const q = (T * 0.7 + hx(i, 1, 19)) % 1, px = 20 + hx(i, 2, 19) * 280; poly(g, rgba(i % 2 ? '#ff6a2a' : '#ffd060', Math.sin(Math.PI * q) * 0.8 * k), [px, 240 - q * 200 - 5, px + 3, 240 - q * 200, px, 240 - q * 200 + 4, px - 3, 240 - q * 200]); } });
      this.bust(g, look, x, y, 64, s);
      this.drill(g, CX + 90, lerp(270, 220, k), 2.2, T);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    tablet(g, x, y, s, T) {
      rect(g, '#1a2230', x - 10 * s, y - 7 * s, 20 * s, 14 * s); rect(g, '#5ab8e8', x - 9 * s, y - 6 * s, 18 * s, 12 * s);
      for (let i = 0; i < 3; i++) rect(g, rgba('#e8f8ff', 0.8), x - 7 * s, y - 4 * s + i * 3 * s, (6 + ((Math.floor(T * 4) + i) % 3) * 3) * s, 1 * s);
    }

    pelaReport(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('pela', this.game);
      ell(g, 'rgba(0,0,0,0.45)', 70, 222, 18, 5);
      figure(g, look, 70, 224, 3, { s: 0.6 });
      this.tablet(g, 92, 150, 1.2, T);
      const ids = ['amanda', 'makoto', 'talleah'];
      ids.forEach((id, i) => {
        const x = 150 + i * 60, lock = seg(t, 0.5 + i * 0.3, 0.7 + i * 0.3);
        ell(g, 'rgba(0,0,0,0.35)', x, 222, 14, 4);
        figure(g, lookOf(id, this.game, true), x, 224, 3, { s: 0.58 });
        if (lock > 0) {
          const r = lerp(60, 30, lock), cy = 150;
          g.strokeStyle = rgba('#5ae8f8', 0.9); g.lineWidth = 1;
          for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.moveTo(x + dx * r, cy + dy * (r + 30) - dy * 8); g.lineTo(x + dx * r, cy + dy * (r + 30)); g.lineTo(x + dx * r - dx * 8, cy + dy * (r + 30)); g.stroke(); }
          if (lock >= 1) { g.save(); g.font = 'bold 6px monospace'; g.fillStyle = '#5ae8f8'; g.textAlign = 'center'; g.fillText(['ЦЕЛЬ: РОЗОВАЯ', 'ЦЕЛЬ: КОШКА', 'ЦЕЛЬ: АВИЯ'][i], x, 66); g.restore(); }
        }
      });
      lighter(g, () => line(g, rgba('#5ae8f8', 0.5), 1, 96, 150, 150 + Math.min(2, Math.floor(seg(t, 0.4, 1.4) * 3)) * 60, 140));
      K.vignette(g, 0.4);
    }

    pelaBooks(g, t, T) {
      this.conHall(g, T);
      rect(g, 'rgba(10,6,16,0.4)', 0, 0, LW, LH);
      const look = G.lookOf('pela', this.game), grab = eOut(seg(t, 0.4, 0.7));
      rect(g, '#3a2a22', 150, 178, 150, 8);
      for (let i = 0; i < 5; i++) { if (i === 2 && grab > 0) continue; const bx = 166 + i * 26; rect(g, ['#5a8aff', '#e8f0ff', '#5a8aff', '#e8f0ff', '#5a8aff'][i], bx, 140, 20, 38); rect(g, '#2a4a8a', bx + 2, 146, 16, 4); }
      g.save(); g.font = 'bold 6px sans-serif'; g.fillStyle = '#f2ecdc'; g.fillText('СНЕЖНАЯ СТРАНА · ПЕРЕИЗДАНИЕ', 160, 134); g.restore();
      this.bust(g, look, 84, 252, 64, 2.1);
      if (grab > 0) { g.save(); g.translate(lerp(228, 140, grab), lerp(158, 176, grab)); g.rotate(-0.2 * grab); rect(g, '#5a8aff', -12, -20, 24, 40); rect(g, '#e8f0ff', -8, -14, 16, 10); g.restore(); }
      lighter(g, () => { for (let i = 0; i < 6; i++) { const q = (T * 0.6 + i / 6) % 1, a = i / 6 * Math.PI * 2; poly(g, rgba('#ffffff', (1 - q) * seg(t, 0.1, 0.3)), [84 + Math.cos(a) * 60 * q, 150 + Math.sin(a) * 40 * q - 3, 84 + Math.cos(a) * 60 * q + 2, 150 + Math.sin(a) * 40 * q, 84 + Math.cos(a) * 60 * q, 150 + Math.sin(a) * 40 * q + 3, 84 + Math.cos(a) * 60 * q - 2, 150 + Math.sin(a) * 40 * q]); } });
      K.vignette(g, 0.4);
    }

    pelaPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#8ad0f6', 1, 70);
      const look = G.lookOf('pela', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.35));
      lighter(g, () => { for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const hxp = 20 + c * 52 + (r % 2) * 26, hyp = 30 + r * 30, a = 0.25 * k * (0.5 + 0.5 * Math.sin(T * 3 + r + c)); poly(g, rgba('#5ae8f8', a), [hxp - 10, hyp, hxp - 5, hyp - 9, hxp + 5, hyp - 9, hxp + 10, hyp, hxp + 5, hyp + 9, hxp - 5, hyp + 9]); } });
      this.bust(g, look, x, y, 64, s);
      this.tablet(g, CX + 76, lerp(260, 206, k), 2.4, T);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    tent(g, x, y, up, open, k = 1) {
      if (up <= 0) return;
      const h = 50 * up * k, w = 40 * k;
      poly(g, '#e8902a', [x - w, y, x + w, y, x, y - h]);
      poly(g, '#c8701a', [x, y - h, x + w, y, x + w * 1.3, y - 4, x + 12 * k, y - h - 2]);
      poly(g, '#2a1a10', [x - 12 * k * open, y, x + 12 * k * open, y, x, y - h * 0.6]);
      line(g, '#5a3a20', 1, x, y - h, x, y - h - 8 * k);
    }

    lynxTent(g, t, T) {
      this.conHall(g, T);
      for (let i = 0; i < 6; i++) { const x = ((i * 70 + T * 50) % 420) - 40; ell(g, '#100c16', x, 168, 8, 9); rect(g, '#100c16', x - 10, 176, 20, 46); }
      const look = G.lookOf('lynx', this.game), up = eOut(seg(t, 0.4, 0.9)), inn = seg(t, 1.1, 1.5);
      this.tent(g, 236, 206, up, 1 - inn * 0.7, 1.4);
      if (inn < 1) { const x = lerp(120, 240, sm(seg(t, 0, 0.4)) * 0.6 + inn * 0.4); ell(g, 'rgba(0,0,0,0.45)', x, 222, 18, 5); g.save(); g.globalAlpha = 1 - inn; figure(g, look, x, 224, 3, { s: 0.6 }); g.restore(); }
      if (inn >= 1) { g.save(); g.font = 'bold 9px sans-serif'; g.fillStyle = '#ffd060'; g.fillText('ф-фух', 250, 120); g.restore(); }
      K.vignette(g, 0.4);
    }

    lynxFamily(g, t, T) {
      this.conHall(g, T);
      this.tent(g, CX, 206, 1, 1.4, 1.6);
      const gp = G.lookOf('gepard', this.game), sv = G.lookOf('serval', this.game), lx = G.lookOf('lynx', this.game), peek = eOut(seg(t, 0, 0.3));
      ell(g, 'rgba(0,0,0,0.4)', CX - 74, 222, 18, 4); figure(g, gp, lerp(-30, CX - 74, peek), 224, 3, { s: 0.64 });
      ell(g, 'rgba(0,0,0,0.4)', CX + 74, 222, 18, 4); figure(g, sv, lerp(LW + 30, CX + 74, peek), 224, 3, { s: 0.6 });
      const pop = seg(t, 0.3, 0.45);
      if (pop > 0) { g.save(); g.beginPath(); g.rect(CX - 28, 140, 56, 66); g.clip(); this.bust(g, lx, CX, 240 - 34 * pop, 64, 0.9); g.restore(); }
      K.vignette(g, 0.4);
    }

    lynxPose(g, t, T) {
      vgrad(g, 0, LH, [[0, '#06101e'], [0.6, '#0e1a2a'], [1, '#141024']]);
      const look = G.lookOf('lynx', this.game), x = CX - 30, y = 250, s = 2.6, k = seg(t, 0, 0.5);
      lighter(g, () => { for (let b = 0; b < 3; b++) { g.beginPath(); for (let i = 0; i <= 32; i++) { const px = i * 10, py = 40 + b * 18 + Math.sin(i * 0.4 + T * 1.5 + b) * 10; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.strokeStyle = rgba(['#5af0a0', '#5ad8e8', '#a87aff'][b], 0.45 * k); g.lineWidth = 10; g.stroke(); } });
      K.stars(g, T, 50, 2, 0.6);
      this.bust(g, look, x, y, 64, s);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    lukaArm(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('luka', this.game), push = Math.sin(t * 9) * 0.3 * seg(t, 0.4, 1.2) + (t > 1.25 ? -1.1 * eOut(seg(t, 1.25, 1.4)) : 0);
      this.svarogAt(g, 230, 226, 0.8, { T });
      ell(g, 'rgba(0,0,0,0.45)', 96, 222, 20, 5);
      figure(g, look, 96, 224, 3, { s: 0.64 });
      rect(g, '#3a2a22', 110, 168, 100, 8); rect(g, '#2a1e30', 120, 176, 6, 46); rect(g, '#2a1e30', 196, 176, 6, 46);
      g.save(); g.translate(160, 166); g.rotate(push);
      line(g, '#8a9ab0', 10, -36, 4, -4, -28); line(g, '#5a5c70', 12, 36, 4, 4, -28);
      ell(g, '#c8ccd4', -4, -32, 8, 8); ell(g, '#7a7c92', 5, -32, 9, 9);
      g.restore();
      if (t > 0.4 && t < 1.25) lighter(g, () => sparks(g, 160, 140, (t * 2.4) % 1, '#ffd060', 6, Math.floor(t * 2.4)));
      g.save(); g.translate(160, 198); rect(g, '#f2ecdc', -34, -7, 68, 14); g.font = 'bold 7px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#c8243a'; g.fillText('АРМРЕСТЛИНГ', 0, 3); g.restore();
      if (t > 1.4) { g.save(); g.font = 'bold 12px sans-serif'; g.fillStyle = '#ffd060'; g.fillText('ещё раз!', 22, 60); g.restore(); }
      K.vignette(g, 0.4);
    }

    lukaSnack(g, t, T) {
      this.conHall(g, T);
      rect(g, 'rgba(10,6,16,0.4)', 0, 0, LW, LH);
      const look = G.lookOf('luka', this.game), sour = seg(t, 0.3, 0.45), push = eOut(seg(t, 0.5, 0.8));
      this.bust(g, look, 110, 252, 64, 2.1);
      if (sour > 0) for (const side of [-1, 1]) { const [ex, ey, u] = this.bustAt(look, 110, 252, 64, 2.1, side); rect(g, look.skin, Math.round(ex - u * 4), Math.round(ey - u * 4), Math.round(u * 8), Math.round(u * 8 * sour)); if (sour > 0.6) line(g, '#2a1a10', Math.max(1, u), ex - u * 3, ey + u * (side < 0 ? -1 : 1), ex + u * 3, ey + u * (side < 0 ? 1 : -1)); }
      const px = lerp(220, 290, push), py = lerp(176, 150, push);
      ell(g, '#f4f0e4', px, py, 30, 10); ell(g, '#3a8a4a', px - 8, py - 4, 10, 6); ell(g, '#5aaa5a', px + 6, py - 5, 9, 5); ell(g, '#c8a070', px + 14, py - 6, 5, 4); rect(g, '#e8d8b0', px + 12, py - 6, 3, 6); ell(g, '#c8a070', px - 16, py - 5, 4, 3); rect(g, '#e8d8b0', px - 17, py - 5, 2, 5);
      hand(g, px - 6, py + 36, 0.6, 1, false);
      K.vignette(g, 0.4);
    }

    lukaPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#ff8a3a', 1, 70);
      const look = G.lookOf('luka', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.25));
      this.bust(g, look, x, y, 64, s);
      const fx = lerp(CX + 120, CX + 70, k), fy = 180;
      rect(g, '#5a5c70', fx - 14, fy - 12, 28, 24); rect(g, '#8a9ab0', fx - 12, fy - 10, 24, 6); for (let i = 0; i < 4; i++) rect(g, '#3a3c48', fx - 12 + i * 6, fy + 4, 5, 6);
      if (k >= 1) lighter(g, () => { sparks(g, fx + 10, fy, seg(t, 0.25, 0.7), '#ffd060', 16, 41); glow(g, fx + 10, fy, 30, '#ff8a3a', 0.6 * (1 - seg(t, 0.25, 0.7))); });
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    greatsword(g, x, y, s, ang) {
      g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
      rect(g, '#5a3a2a', -2, 0, 4, 14); rect(g, '#c8a050', -9, -2, 18, 4);
      poly(g, '#d8dce4', [-5, -2, 5, -2, 6, -60, 0, -68, -6, -60]); line(g, '#ffffff', 1, 0, -4, 0, -64); rect(g, '#e8902a', -2, -30, 4, 8);
      g.restore();
    }

    sushangDeeds(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('sushang', this.game), spots = [[70, 'amanda'], [160, 'makoto'], [250, 'talleah']], i = Math.min(2, Math.floor(t / 0.45)), done = Math.min(3, Math.floor((t + 0.15) / 0.45));
      spots.forEach(([x, id]) => { ell(g, 'rgba(0,0,0,0.35)', x, 222, 14, 4); figure(g, lookOf(id, this.game, true), x, 224, 3, { s: 0.56 }); });
      const from = spots[Math.max(0, i - 1)][0] + 28, to = spots[i][0] + 28, k = sm(seg(t % 0.45, 0, 0.25)), x = i === 0 ? lerp(-20, to, k) : lerp(from, to, k);
      ell(g, 'rgba(0,0,0,0.45)', x, 222, 16, 4);
      figure(g, look, x, 224 - Math.abs(Math.sin(T * 14)) * 2, 3, { s: 0.56 });
      if (i === 0) this.giftBox(g, x + 12, 170, 1, '#ff6aa8');
      if (i === 1) ell(g, '#e0304a', x + 12, 160, 5, 5);
      if (i === 2) { g.save(); g.translate(x + 14, 160); rect(g, '#f2ecdc', -6, -8, 12, 16); g.restore(); }
      for (let d = 0; d < 3; d++) { const on = d < done; ell(g, on ? '#ffd060' : '#3a3040', 130 + d * 30, 40, 9, 9); if (on) { g.save(); g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#2a1a10'; g.fillText('✓', 130 + d * 30, 44); g.restore(); } }
      K.vignette(g, 0.4);
    }

    sushangTales(g, t, T) {
      vgrad(g, 0, LH, [[0, '#1a1020'], [1, '#100a14']]);
      rect(g, '#2a2232', 40, 16, 240, 90); rect(g, '#f2ecdc', 50, 26, 220, 70);
      g.save(); g.font = 'bold 9px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#4a2a3a'; g.fillText('СКАЗАНИЯ ОБ ОБЛАЧНЫХ РЫЦАРЯХ', 160, 44); g.restore();
      for (let i = 0; i < 5; i++) { const sx = 80 + i * 40, sy = 70 + Math.sin(T * 3 + i) * 4; this.greatsword(g, sx, sy + 20, 0.32, Math.sin(T * 2 + i) * 0.2); }
      const look = G.lookOf('sushang', this.game), wow = seg(t, 0.2, 0.4);
      this.bust(g, look, 262, 244, 64, 1.7);
      if (wow > 0) for (const side of [-1, 1]) { const [ex, ey] = this.bustAt(look, 262, 244, 64, 1.7, side); lighter(g, () => { poly(g, rgba('#ffffff', wow), [ex, ey - 6, ex + 2, ey, ex, ey + 6, ex - 2, ey]); poly(g, rgba('#ffffff', wow), [ex - 6, ey, ex, ey - 2, ex + 6, ey, ex, ey + 2]); }); }
      K.vignette(g, 0.45);
    }

    sushangPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#ff8a3a', 1, 70);
      const look = G.lookOf('sushang', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0.1, 0.45));
      lighter(g, () => { const cx = CX + 70, cy = 110; glow(g, cx, cy, 60 * k, '#ff6a2a', 0.5 * k); for (const d of [-1, 1]) poly(g, rgba('#ffb040', 0.7 * k), [cx, cy, cx + d * 80 * k, cy - 40 * k, cx + d * 60 * k, cy - 10 * k, cx + d * 90 * k, cy + 10 * k, cx + d * 40 * k, cy + 10 * k]); poly(g, rgba('#ffd060', 0.8 * k), [cx - 6, cy, cx + 6, cy, cx, cy + 40 * k]); });
      this.greatsword(g, CX + 82, 248, 1.6, 0.2);
      this.bust(g, look, x, y, 64, s);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    chains(g, x0, y0, x1, y1, k, col) {
      const n = 12, ex = lerp(x0, x1, k), ey = lerp(y0, y1, k);
      for (let i = 0; i < n; i++) { const q = i / n; if (q > k) break; const cx = lerp(x0, x1, q), cy = lerp(y0, y1, q) - Math.sin(Math.PI * q) * 20 * (1 - k * 0.5); g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, 4, 2.4, i % 2 ? 0.6 : -0.6, 0, Math.PI * 2); g.stroke(); }
      return [ex, ey];
    }

    xueyiBook(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('xueyi', this.game), walk = sm(seg(t, 0, 0.5)), x = lerp(-20, 90, walk);
      rect(g, '#3a2a22', 150, 168, 150, 8); rect(g, '#2a1a24', 154, 176, 142, 44); rect(g, '#c8243a', 154, 176, 142, 3);
      for (let i = 0; i < 4; i++) { const bx = 166 + i * 32; rect(g, '#1a1a20', bx, 132, 26, 36); rect(g, '#c8243a', bx + 2, 134, 22, 6); const cv = G.bustCanvas(look, 64); g.save(); g.imageSmoothingEnabled = false; g.globalAlpha = 0.9; g.drawImage(cv, bx + 3, 142, 20, 20); g.restore(); }
      g.save(); g.translate(225, 198); rect(g, '#f2ecdc', -50, -8, 100, 16); g.font = 'bold 7px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#2a1a24'; g.fillText('«РАБОТА НЕ ДЛЯ КУКОЛ»', 0, 3); g.restore();
      ell(g, 'rgba(0,0,0,0.45)', x, 222, 18, 5);
      figure(g, look, x, 224 - (walk < 1 ? Math.abs(Math.sin(t * 14)) * 2 : 0), 3, { s: 0.6 });
      const pick = eOut(seg(t, 0.6, 0.9));
      if (pick > 0) { g.save(); g.translate(lerp(198, x + 16, pick), lerp(150, 140, pick)); g.rotate(-0.2 * pick); rect(g, '#1a1a20', -10, -14, 20, 28); rect(g, '#c8243a', -8, -12, 16, 4); g.restore(); }
      if (t > 1.2) { g.save(); g.font = 'bold 12px sans-serif'; g.fillStyle = '#c8ccd4'; g.fillText('…', x + 10, 70); g.restore(); }
      K.vignette(g, 0.4);
    }

    xueyiChain(g, t, T) {
      this.conHall(g, T);
      rect(g, 'rgba(10,6,16,0.35)', 0, 0, LW, LH);
      const look = G.lookOf('xueyi', this.game), kz = G.lookOf('kazuma', this.game), k = eOut(seg(t, 0.05, 0.3)), tight = seg(t, 0.3, 0.45);
      ell(g, 'rgba(0,0,0,0.45)', 80, 222, 18, 5);
      figure(g, look, 80, 224, 3, { s: 0.6 });
      const kx = 236 + Math.sin(T * 30) * 2 * tight;
      ell(g, 'rgba(0,0,0,0.4)', kx, 222, 16, 4);
      figure(g, kz, kx, 224, 3, { s: 0.58 });
      g.save(); g.translate(kx + 18, 150); rect(g, '#f4f0e4', -6, -8, 12, 16); rect(g, '#e85a8a', -6, -8, 12, 3); g.restore();
      lighter(g, () => glow(g, 96, 150, 18, '#ff3a4a', 0.5 * k));
      this.chains(g, 96, 150, kx - 10, 150, k, '#c8ccd4');
      if (tight > 0) for (let i = 0; i < 3; i++) { g.strokeStyle = '#c8ccd4'; g.lineWidth = 2; g.beginPath(); g.ellipse(kx, 132 + i * 16, 16, 4, 0, 0, Math.PI * 2 * tight); g.stroke(); }
      if (tight > 0.5) { g.save(); g.font = 'bold 12px sans-serif'; g.fillStyle = '#ffd060'; g.fillText('!', kx + 18, 82); g.restore(); }
      K.vignette(g, 0.4);
    }

    xueyiPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#ff3a4a', 1, 70);
      const look = G.lookOf('xueyi', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.35));
      lighter(g, () => { for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + T * 0.6; this.chains(g, x + Math.cos(a) * 160, 130 + Math.sin(a) * 90, x + Math.cos(a) * 40, 130 + Math.sin(a) * 20, k, rgba('#ff8a9a', 0.6)); } });
      this.bust(g, look, x, y, 64, s);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    fan(g, x, y, s, open) {
      g.save(); g.translate(x, y); g.scale(s, s);
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.22 * open; poly(g, i % 2 ? '#f2ecdc' : '#e8d8b0', [0, 0, Math.cos(a - 0.11 * open) * 22, Math.sin(a - 0.11 * open) * 22, Math.cos(a + 0.11 * open) * 22, Math.sin(a + 0.11 * open) * 22]); }
      rect(g, '#8a5a2a', -1.5, 0, 3, 8); ell(g, '#c8243a', 0, -14, 3 * open, 3 * open);
      g.restore();
    }

    tingyunDeal(g, t, T) {
      this.conHall(g, T);
      const ty = G.lookOf('tingyun', this.game), sp = G.lookOf('sampo', this.game);
      rect(g, '#3a2a22', 110, 168, 100, 8); rect(g, '#5a3a2a', 114, 176, 92, 44);
      ell(g, 'rgba(0,0,0,0.45)', 80, 222, 18, 5); figure(g, ty, 80, 224, 3, { s: 0.6 });
      ell(g, 'rgba(0,0,0,0.45)', 240, 222, 18, 5); figure(g, sp, 240, 224, 3, { s: 0.62 });
      this.fan(g, 104, 150, 1, 1);
      const prices = ['5 000', '3 000', '1 500', '800'], i = Math.min(3, Math.floor(seg(t, 0.4, 1.3) * 3.99));
      g.save(); g.translate(160, 140); g.rotate(-0.06); rect(g, '#14121c', -30, -12, 60, 24); rect(g, '#f2ecdc', -28, -10, 56, 20); g.font = 'bold 11px monospace'; g.textAlign = 'center'; g.fillStyle = i === 3 ? '#2a8a3a' : '#c8243a'; g.fillText(prices[i] + ' кр.', 0, 4); g.restore();
      if (t > 0.4 && t < 1.3) { const q = (t * 3) % 1; g.save(); g.globalAlpha = 1 - q; g.font = 'bold 10px sans-serif'; g.fillStyle = '#ffd060'; g.fillText('…', 100, 100 - q * 10); g.fillText('!?', 236, 96 - q * 10); g.restore(); }
      if (t > 1.35) { const k = eOut(seg(t, 1.35, 1.6)); ell(g, '#f4d8c8', lerp(120, 156, k), 176, 6, 5); ell(g, '#f2d6c2', lerp(200, 164, k), 176, 6, 5); lighter(g, () => sparks(g, 160, 176, seg(t, 1.5, 1.84), '#ffd060', 10, 63)); }
      K.vignette(g, 0.4);
    }

    tingyunTail(g, t, T) {
      this.stageFloor(g, T, 0.55);
      this.beam(g, CX, '#ffd060', 1, 50);
      const look = G.lookOf('tingyun', this.game), wag = Math.sin(T * 5) * 0.3;
      g.save(); g.translate(CX + 10, 186); g.rotate(-0.6 + wag); ell(g, '#d8a060', 22, 0, 26, 10); ell(g, '#f2e8d8', 42, 0, 9, 7); g.restore();
      ell(g, 'rgba(0,0,0,0.45)', CX, 222, 18, 5);
      figure(g, look, CX, 224, 3, { s: 0.6 });
      this.fan(g, CX - 22, 150, 1, 1);
      [['amanda', true], ['makoto', true]].forEach(([id, lit], i) => { const x = i ? 262 : 58; ell(g, 'rgba(0,0,0,0.35)', x, 222, 14, 4); figure(g, lookOf(id, this.game, lit), x, 224, 3, { s: 0.56, flip: i === 1 }); this.phone(g, x + (i ? -16 : 16), 120, 1.1); });
      for (let i = 0; i < 2; i++) { const q = seg(t, 0.1 + i * 0.25, 0.25 + i * 0.25); if (q > 0 && q < 1) lighter(g, () => glow(g, i ? 246 : 74, 118, 30, '#ffffff', 0.9 * (1 - q))); }
      K.vignette(g, 0.4);
    }

    tingyunPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#ffd060', 1, 70);
      const look = G.lookOf('tingyun', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.35));
      lighter(g, () => { for (let i = 0; i < 14; i++) { const q = (T * 0.4 + hx(i, 1, 29)) % 1, px = 20 + hx(i, 2, 29) * 280; poly(g, rgba('#ffd060', Math.sin(Math.PI * q) * 0.8 * k), [px, 230 - q * 200 - 4, px + 2, 230 - q * 200, px, 230 - q * 200 + 4, px - 2, 230 - q * 200]); } });
      this.bust(g, look, x, y, 64, s);
      this.fan(g, CX + 96, lerp(270, 230, k), 2.2, k);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    brush(g, x, y, s, ang) {
      g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
      rect(g, '#5a2a2a', -1.5, -24, 3, 22); rect(g, '#c8a050', -2, -4, 4, 3); poly(g, '#1a1a20', [-2.5, -1, 2.5, -1, 0, 8]);
      g.restore();
    }

    scoreCard(g, x, y, k, txt) {
      if (k <= 0) return;
      g.save(); g.translate(x, y); g.scale(k, k); g.rotate(-0.06);
      rect(g, '#14121c', -14, -11, 28, 22); rect(g, '#f2ecdc', -12, -9, 24, 18);
      g.font = 'bold 11px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#c8243a'; g.fillText(txt, 0, 4);
      g.restore();
    }

    hanyaJudge(g, t, T) {
      this.stageFloor(g, T, 0.6);
      this.beam(g, 200, '#ffffff', 0.8, 50);
      const look = G.lookOf('hanya', this.game), ids = ['amanda', 'makoto', 'talleah'], i = Math.min(2, Math.floor(t / 0.45));
      const id = ids[i], k = sm(seg(t % 0.45, 0, 0.2));
      ell(g, 'rgba(0,0,0,0.4)', 200, 210, 16, 4);
      figure(g, lookOf(id, this.game, true), lerp(LW + 30, 200, k), 212, 3, { s: 0.56 });
      for (let j = 0; j < i; j++) this.scoreCard(g, 230 + j * 28, 40, 1, '10');
      ell(g, 'rgba(0,0,0,0.45)', 70, 222, 18, 5);
      figure(g, look, 70, 224, 3, { s: 0.6 });
      rect(g, '#3a2232', 30, 176, 110, 46); rect(g, '#c8243a', 30, 176, 110, 4);
      g.save(); g.translate(85, 202); rect(g, '#f2ecdc', -26, -7, 52, 14); g.font = 'bold 7px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#c8243a'; g.fillText('ЖЮРИ', 0, 3); g.restore();
      const w = seg(t % 0.45, 0.15, 0.35);
      this.brush(g, 96 + Math.sin(w * 12) * 6, 168, 1.2, 0.5);
      this.scoreCard(g, 116, 150, eOut(seg(t % 0.45, 0.3, 0.42)), '10');
      K.vignette(g, 0.4);
    }

    hanyaSister(g, t, T) {
      this.conHall(g, T);
      const hy = G.lookOf('hanya', this.game), xy = G.lookOf('xueyi', this.game), kz = G.lookOf('kazuma', this.game), walk = eOut(seg(t, 0, 0.3));
      ell(g, 'rgba(0,0,0,0.45)', 70, 222, 18, 5); figure(g, hy, 70, 224, 3, { s: 0.6 });
      const xx = lerp(LW + 20, 210, walk);
      ell(g, 'rgba(0,0,0,0.4)', xx + 50, 222, 16, 4); figure(g, kz, xx + 50, 224, 3, { s: 0.58 });
      for (let i = 0; i < 3; i++) { g.strokeStyle = '#c8ccd4'; g.lineWidth = 2; g.beginPath(); g.ellipse(xx + 50, 132 + i * 16, 16, 4, 0, 0, Math.PI * 2); g.stroke(); }
      ell(g, 'rgba(0,0,0,0.45)', xx, 222, 18, 5); figure(g, xy, xx, 224, 3, { s: 0.6 });
      this.brush(g, 96, 160, 1.2, 0.5 + Math.sin(T * 14) * 0.2 * seg(t, 0.4, 0.8));
      const note = eOut(seg(t, 0.4, 0.7));
      if (note > 0) { g.save(); g.translate(130, 120); g.scale(note, note); rect(g, '#f2ecdc', -22, -14, 44, 28); for (let i = 0; i < 4; i++) line(g, '#2a1a24', 1, -16, -8 + i * 6, 12 - (i % 2) * 8, -8 + i * 6); g.restore(); }
      K.vignette(g, 0.4);
    }

    hanyaPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#ff4a5a', 1, 70);
      const look = G.lookOf('hanya', this.game), x = CX - 30, y = 250, s = 2.6, k = seg(t, 0.05, 0.7);
      lighter(g, () => { g.strokeStyle = rgba('#ff6a7a', 0.8); g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); const P = [[220, 40], [270, 50], [250, 80], [290, 100], [230, 120]]; for (let i = 0; i < P.length; i++) { const q = cl(k * (P.length - 1) - i + 1); if (i === 0) g.moveTo(P[0][0], P[0][1]); else if (q > 0) g.lineTo(lerp(P[i - 1][0], P[i][0], q), lerp(P[i - 1][1], P[i][1], q)); } g.stroke(); g.lineCap = 'butt'; });
      this.bust(g, look, x, y, 64, s);
      this.brush(g, CX + 70, 230, 2.6, 0.4);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    tile(g, x, y, s, suit, face) {
      rect(g, '#2a6a4a', x - 5 * s, y - 7 * s, 10 * s, 14 * s); rect(g, face ? '#f4f0e4' : '#3a8a5a', x - 4 * s, y - 6 * s, 8 * s, 12 * s);
      if (face) ell(g, ['#c8243a', '#2a6a4a', '#2d5bd3', '#c8a050'][suit % 4], x, y, 2.4 * s, 2.4 * s);
    }

    qingqueTable(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('qingque', this.game);
      ell(g, 'rgba(0,0,0,0.45)', 76, 222, 18, 5); figure(g, look, 76, 224, 3, { s: 0.6 });
      ['amanda', 'makoto', 'talleah'].forEach((id, i) => { const k = sm(seg(t, 0.5 + i * 0.3, 0.8 + i * 0.3)), x = lerp(LW + 30, 150 + i * 56, k); ell(g, 'rgba(0,0,0,0.35)', x, 222, 14, 4); figure(g, lookOf(id, this.game, true), x, 224, 3, { s: 0.56 }); });
      rect(g, '#2a6a4a', 96, 166, 200, 8); rect(g, '#1a4a32', 100, 174, 192, 46);
      for (let i = 0; i < 12; i++) this.tile(g, 112 + i * 15, 160, 1, i, false);
      if (t < 0.5) { const w = Math.sin(T * 12) * 0.3; g.save(); g.translate(96, 120); g.rotate(w); hand(g, 0, 30, 0.6, 1, false); g.restore(); }
      K.vignette(g, 0.4);
    }

    qingqueWin(g, t, T) {
      this.stageFloor(g, T, 0.6);
      this.beam(g, CX, '#5ad88a', 1, 70);
      const look = G.lookOf('qingque', this.game), flip = seg(t, 0.05, 0.25);
      this.bust(g, look, 70, 252, 64, 1.8);
      rect(g, '#2a6a4a', 120, 176, 190, 8);
      for (let i = 0; i < 4; i++) { const fx = 150 + i * 30, face = flip > i / 4; this.tile(g, fx, 150, 2.2, 0, face); if (face) lighter(g, () => glow(g, fx, 150, 18, '#ffd060', 0.5 * (1 - seg(t, 0.25, 0.8)))); }
      if (t > 0.3) { g.save(); g.globalAlpha = seg(t, 0.3, 0.45); g.font = 'bold 12px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#ffd060'; g.fillText('ЗАКРЫТЫЙ КОНГ', 195, 112); g.restore(); }
      K.vignette(g, 0.4);
    }

    qingquePose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#5ad88a', 1, 70);
      const look = G.lookOf('qingque', this.game), x = CX - 30, y = 250, s = 2.6;
      for (let i = 0; i < 10; i++) { const q = (T * 0.35 + hx(i, 1, 77)) % 1, px = 24 + hx(i, 2, 77) * 270; g.save(); g.translate(px, 230 - q * 220); g.rotate(T * 2 + i); this.tile(g, 0, 0, 1.4, i, i % 2 === 0); g.restore(); }
      this.bust(g, look, x, y, 64, s);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    kite(g, x, y, s, T) {
      g.save(); g.translate(x, y); g.rotate(Math.sin(T * 2) * 0.15); g.scale(s, s);
      poly(g, '#e8902a', [0, -16, 12, 0, 0, 18, -12, 0]); poly(g, '#ffd060', [0, -16, 12, 0, 0, 0]);
      poly(g, '#e8902a', [-8, -10, -12, -20, -4, -13]); poly(g, '#e8902a', [8, -10, 12, -20, 4, -13]);
      for (let i = 0; i < 4; i++) ell(g, ['#c8243a', '#ffd060'][i % 2], Math.sin(T * 4 + i) * 4, 22 + i * 7, 3, 2);
      g.restore();
    }

    yukongKite(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('yukong', this.game), up = eOut(seg(t, 0, 1.0)), kx = lerp(110, 230, up) + Math.sin(T * 1.5) * 12, ky = lerp(150, 50, up);
      ell(g, 'rgba(0,0,0,0.45)', 96, 222, 18, 5); figure(g, look, 96, 224, 3, { s: 0.62 });
      g.strokeStyle = rgba('#f2ecdc', 0.7); g.lineWidth = 1; g.beginPath(); g.moveTo(108, 150); g.quadraticCurveTo((108 + kx) / 2, ky + 60, kx, ky + 16); g.stroke();
      this.kite(g, kx, ky, 1.5, T);
      ['amanda', 'makoto', 'talleah'].forEach((id, i) => { const x = 170 + i * 50; ell(g, 'rgba(0,0,0,0.35)', x, 222, 14, 4); figure(g, lookOf(id, this.game, false), x, 224, 3, { s: 0.54, tint: '#0a0810', ta: 0.4 }); });
      lighter(g, () => { for (let i = 0; i < 4; i++) { const q = (T * 0.5 + i / 4) % 1; line(g, rgba('#c8e8ff', 0.4 * (1 - q)), 1, q * LW, 60 + i * 20, q * LW + 40, 60 + i * 20); } });
      K.vignette(g, 0.4);
    }

    yukongTraffic(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('yukong', this.game), sort = eOut(seg(t, 0.25, 0.6)), wave = Math.sin(T * 10);
      ell(g, 'rgba(0,0,0,0.45)', 70, 222, 18, 5); figure(g, look, 70, 224, 3, { s: 0.62 });
      for (const [d, a] of [[-1, wave * 0.5], [1, -wave * 0.5]]) { g.save(); g.translate(70 + d * 16, 140); g.rotate(a + d * 0.6); rect(g, '#2a2a30', -1, 0, 2, 10); rect(g, '#ff8a2a', -2, -20, 4, 20); g.restore(); lighter(g, () => glow(g, 70 + d * 22, 128, 10, '#ff8a2a', 0.6)); }
      const ids = [['amanda', true], ['kazuma', null], ['makoto', true], ['talleah', true]];
      ids.forEach(([id, lit], i) => { const jx = 150 + hx(i, 1, 9) * 140, jy = 224 + (hx(i, 2, 9) - 0.5) * 10, x = lerp(jx, 140 + i * 46, sort), y = lerp(jy, 224, sort); ell(g, 'rgba(0,0,0,0.35)', x, 222, 14, 4); figure(g, lit === null ? G.lookOf(id, this.game) : lookOf(id, this.game, lit), x, y, 3, { s: 0.54 }); });
      if (sort >= 1) lighter(g, () => { for (let i = 0; i < 4; i++) glow(g, 140 + i * 46, 236, 8, '#5ad88a', 0.5); });
      K.vignette(g, 0.4);
    }

    yukongPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#ff8a2a', 1, 70);
      const look = G.lookOf('yukong', this.game), x = CX - 30, y = 250, s = 2.6, k = eOut(seg(t, 0, 0.4));
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI + Math.PI + T * 0.4; this.kite(g, x + Math.cos(a) * 130 * k, 130 + Math.sin(a) * 70 * k, 0.9, T + i); }
      this.bust(g, look, x, y, 64, s);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    fireball(g, x, y, r, T) {
      lighter(g, () => { glow(g, x, y, r * 2.4, '#ff6a2a', 0.6); ell(g, '#ffd060', x, y, r, r); ell(g, '#ffffff', x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.4); });
    }

    guinaifenJuggle(g, t, T) {
      this.conHall(g, T);
      const look = G.lookOf('guinaifen', this.game), x = 130;
      ell(g, 'rgba(0,0,0,0.45)', x, 222, 18, 5); figure(g, look, x, 224, 3, { s: 0.62 });
      for (let i = 0; i < 3; i++) { const ph = (T * 1.4 + i / 3) % 1, bx = x + Math.cos(ph * Math.PI * 2) * 30, by = 90 - Math.abs(Math.sin(ph * Math.PI)) * 50; this.fireball(g, bx, by, 5, T); }
      ell(g, '#3a2a22', 70, 196, 16, 5); ell(g, '#5a3a2a', 70, 192, 12, 6);
      const coins = Math.min(6, Math.floor(seg(t, 0.6, 1.5) * 7));
      for (let i = 0; i < coins; i++) ell(g, '#ffd060', 64 + (i % 3) * 5, 190 - Math.floor(i / 3) * 3, 3, 2);
      for (let i = 0; i < 3; i++) { const k = seg(t, 0.6 + i * 0.3, 0.9 + i * 0.3); if (k > 0 && k < 1) ell(g, '#ffd060', lerp(260 - i * 20, 70, k), 150 + 40 * k - Math.sin(Math.PI * k) * 60, 3, 3); }
      [['qingque', null], ['sushang', null]].forEach(([id], i) => { const cx = 250 + i * 46; ell(g, 'rgba(0,0,0,0.35)', cx, 222, 14, 4); figure(g, G.lookOf(id, this.game), cx, 224 - (t > 0.8 ? Math.max(0, Math.sin(T * 10 + i)) * 3 : 0), 3, { s: 0.56 }); });
      K.vignette(g, 0.4);
    }

    guinaifenStream(g, t, T) {
      this.stageFloor(g, T, 0.55);
      this.beam(g, CX, '#ff8a3a', 1, 50);
      const look = G.lookOf('guinaifen', this.game);
      this.bust(g, look, 90, 246, 64, 1.8);
      rect(g, 'rgba(10,6,16,0.75)', 10, 10, 120, 22); ell(g, '#ff3a4a', 22, 21, 5, 5);
      g.save(); g.font = 'bold 9px sans-serif'; g.fillStyle = '#ffffff'; g.fillText('LIVE · ' + (1200 + Math.floor(seg(t, 0, 0.9) * 8800)).toLocaleString('ru-RU'), 32, 25); g.restore();
      rect(g, 'rgba(10,6,16,0.6)', 214, 40, 100, 120);
      const msgs = ['ого!!', 'огонь!', '♥♥♥', 'Малышка Гуй!', 'ещё!'];
      for (let i = 0; i < 5; i++) { const k = seg(t, 0.1 + i * 0.12, 0.2 + i * 0.12); if (k > 0) { g.save(); g.globalAlpha = k; g.font = '8px sans-serif'; g.fillStyle = ['#ffd060', '#ff8a3a', '#ff6aa8', '#9ad8ff', '#9affb0'][i]; g.fillText(msgs[i], 220, 56 + i * 20); g.restore(); } }
      for (let i = 0; i < 3; i++) { const q = (T * 0.8 + i / 3) % 1; this.heartAt(g, 290 - i * 10, 170 - q * 40, 4, (1 - q) * seg(t, 0.3, 0.5)); }
      K.vignette(g, 0.4);
    }

    guinaifenPose(g, t, T) {
      this.stageFloor(g, T, 0.5);
      this.beam(g, CX, '#ff6a2a', 1, 70);
      const look = G.lookOf('guinaifen', this.game), x = CX - 30, y = 250, s = 2.6;
      lighter(g, () => { for (let f = 0; f < 3; f++) { const k = seg(t, 0.05 + f * 0.25, 0.6 + f * 0.25), fx = [230, 70, 280][f], fy = [50, 60, 100][f]; if (k > 0 && k < 1) for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = 40 * eOut(k); rect(g, rgba(['#ffd060', '#ff6a2a', '#ff6aa8'][f], 1 - k), Math.round(fx + Math.cos(a) * r), Math.round(fy + Math.sin(a) * r + 10 * k * k), 2, 2); } } });
      this.bust(g, look, x, y, 64, s);
      this.camFlashes(g, t * 2);
      K.vignette(g, 0.4);
    }

    rackLayout() {
      const n = this.res.length, rows = ROWS[n] || (n <= 4 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)]), cw = 50, ch = 60, gap = 8, out = [];
      const y0 = rows.length === 3 ? 22 : rows.length === 2 ? 52 : 90;
      let i = 0;
      rows.forEach((cnt, row) => {
        const w = cnt * cw + (cnt - 1) * gap, x0 = 128 - w / 2;
        for (let c = 0; c < cnt; c++) out[i++] = { x: x0 + c * (cw + gap), y: y0 + row * (ch + 8), w: cw, h: ch, rot: (hx(i, 3, 41) - 0.5) * 0.12 };
      });
      return out;
    }

    snap(g, r, x, y, w, h) {
      rect(g, '#f4f2ea', x, y, w, h);
      const iw = w - 6, ih = iw;
      if (r.kind === 'char') {
        vgrad(g, y + 3, y + 3 + ih, [[0, '#1a1a30'], [1, rgba(RCOL[r.rar], 0.6)]], x + 3, iw);
        const cv = G.bustCanvas(lookOf(r.id, this.game, true), 64);
        g.save(); g.beginPath(); g.rect(x + 3, y + 3, iw, ih); g.clip(); g.imageSmoothingEnabled = false; g.drawImage(cv, x + 3, y + 3, iw, ih); g.restore();
      } else {
        rect(g, '#1a1830', x + 3, y + 3, iw, ih);
        const art = G.coneArt(r.id, Math.round(iw * 0.7), ih);
        g.save(); g.imageSmoothingEnabled = false; g.drawImage(art, Math.round(x + 3 + iw * 0.15), y + 3, Math.round(iw * 0.7), ih); g.restore();
      }
    }

    gorilla(g, tx, ty, T) {
      const x = 268, y = 70;
      rect(g, '#6a4a1a', x - 30, y - 34, 60, 76); rect(g, '#c8a040', x - 27, y - 31, 54, 70); rect(g, '#2a2a34', x - 24, y - 28, 48, 64);
      ell(g, '#3a3a40', x, y + 2, 20, 22); ell(g, '#4a4a52', x, y + 10, 13, 11); ell(g, '#2a2a30', x, y - 12, 16, 8);
      const blink = this.res.some(r => r.rar === 5) && this.rt > 1.0 && this.rt < 1.16;
      for (const s of [-1, 1]) {
        const ex = x + s * 7, ey = y - 2;
        if (blink) { rect(g, '#2a2a30', ex - 4, ey - 1, 8, 2); continue; }
        ell(g, '#f0ece0', ex, ey, 4, 3.4);
        const dx = cl((tx - ex) / 90 + 0.5) * 4 - 2, dy = cl((ty - ey) / 90 + 0.5) * 3 - 1.5;
        ell(g, '#14141a', ex + dx, ey + dy, 1.6, 1.6);
      }
      ell(g, '#1a1a1e', x - 3, y + 9, 1.4, 1); ell(g, '#1a1a1e', x + 3, y + 9, 1.4, 1);
      rect(g, '#1a1a1e', x - 5, y + 15, 10, 1);
    }

    rack(g, T) {
      vgrad(g, 0, LH, [[0, '#0e1a1e'], [1, '#18282c']]);
      for (let x = 0; x < LW; x += 12) rect(g, 'rgba(255,255,255,0.03)', x, 0, 5, LH);
      for (let y = 6; y < LH; y += 16) for (let x = (y / 16) % 2 ? 6 : 0; x < LW; x += 12) rect(g, 'rgba(200,220,200,0.06)', x, y, 2, 2);
      lighter(g, () => poly(g, 'rgba(140,170,255,0.08)', [0, 0, 60, 0, 140, LH, 0, LH]));
      const L = this.rackLayout(), k = i => eOut(seg(this.rt, i * 0.06, i * 0.06 + 0.35));
      this.res.forEach((r, i) => {
        const p = L[i], a = k(i);
        if (a <= 0) return;
        g.save(); g.globalAlpha = a; g.translate(p.x + p.w / 2, p.y + p.h / 2 + (1 - a) * 12); g.rotate(p.rot);
        if (i === this.sel) { rect(g, '#ffd060', -p.w / 2 - 2, -p.h / 2 - 2, p.w + 4, p.h + 4); }
        this.snap(g, r, -p.w / 2, -p.h / 2, p.w, p.h);
        rect(g, rgba(RCOL[r.rar], 0.85), -p.w / 2 - 3, -p.h / 2 - 2, 12, 5); rect(g, rgba(RCOL[r.rar], 0.85), p.w / 2 - 9, -p.h / 2 - 2, 12, 5);
        g.restore();
      });
      const s = L[this.sel] || { x: CX, y: CY, w: 0, h: 0 };
      this.gorilla(g, s.x + s.w / 2, s.y + s.h / 2, T);
      K.vignette(g, 0.35);
    }

    paint() {
      const R = this.R, g = R.g, T = this.t + this.rt;
      if (this.phase === 'cine') {
        const [n, t] = this.shot();
        if (n === 'lot') this.lot(R, g, t, T);
        else if (n === 'gate') this.gate(g, t, T);
        else if (n === 'dark') this.dark(g, t, T);
        else this.pick(g, t, T);
      } else if (this.phase === 'reveal') {
        const r = this.item(), t = this.rt - this.hop;
        if (t < 0) this.hopShot(g, this.rt);
        else if (this.own(r)) this.cutShot(g, r, t, T);
        else if (r.kind === 'char') this.charShot(g, r, t, T);
        else this.coneShot(g, r, t, T);
      } else this.rack(g, T);
      H.Cine.dither(g);
      return R.cv;
    }

    render() { return this.paint(); }

    draw(c) {
      const cv = this.paint(), was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(cv, 0, 0, W, HGT);
      c.imageSmoothingEnabled = was;
      if (this.phase === 'cine') this.cineOverlay(c);
      else if (this.phase === 'reveal') this.revealOverlay(c);
      else this.rackOverlay(c);
      if (this.fade > 0) { c.fillStyle = 'rgba(255,255,255,' + this.fade.toFixed(3) + ')'; c.fillRect(0, 0, W, HGT); }
    }

    skipButton(c, label) {
      const ui = this.ui, w = ui.measure(label, 10) + 44, x = W - w - 10, y = 10;
      c.fillStyle = 'rgba(10,6,24,0.6)'; c.fillRect(x, y, w, 20);
      c.strokeStyle = 'rgba(255,150,210,0.7)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 19);
      const kw = ui.keycap(x + 6, y + 4, 'Esc');
      ui.text(label, x + 12 + kw, y + 5, { size: 10, col: C.cream });
      ui.hit(x, y, w, 20, () => this.skip());
    }

    cineOverlay(c) {
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Пропустить');
      this.ui.hints([['Enter', 'Пропустить ролик']], 12, HGT - 20, { col: 'rgba(230,210,240,0.8)' });
    }

    plate(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui, ch = r.kind === 'char', d = ch ? H.CHARS[r.id] : H.CONES[r.id], name = ch ? d.fullName || d.name : r.name, col = ch && heroine(r.id) ? HER[r.id] : RCOL[r.rar];
      const x0 = Math.round(30 - 50 * (1 - eOut(a))), y = 392;
      c.save(); c.globalAlpha = cl(a);
      const gr = c.createLinearGradient(x0 - 30, 0, x0 + 380, 0);
      gr.addColorStop(0, 'rgba(10,6,24,0.88)'); gr.addColorStop(0.7, 'rgba(10,6,24,0.5)'); gr.addColorStop(1, 'rgba(10,6,24,0)');
      c.fillStyle = gr; c.fillRect(x0 - 30, y - 8, 410, 56);
      c.fillStyle = col; c.fillRect(x0, y - 2, 4, 38);
      const size = ui.measure(name, 20, true, true) > 280 ? 15 : 20;
      ui.text(name, x0 + 14, y - 4, { size, bold: true, serif: true, col: '#ffffff' });
      const subLine = '★'.repeat(r.rar) + (ch ? ' · ' + H.PATHS[d.path].name : ' · Световой конус');
      ui.text(subLine, x0 + 14, y + 20, { size: 11, col: RCOL[r.rar] });
      if (ch) G.pathIcon(c, d.path, Math.round(x0 + 18 + ui.measure(subLine, 11)), y + 19, 14, RCOL[r.rar]);
      if (ch && r.res === 'new') { const nx = Math.round(x0 + 22 + ui.measure(name, size, true, true)); c.fillStyle = '#ff9ac8'; c.fillRect(nx, y, 38, 12); ui.text('НОВЫЙ', nx + 19, y + 1, { size: 8, bold: true, align: 'center', col: '#2a0a1a', shadow: false }); }
      c.restore();
    }

    jury(c, r, a) {
      if (a <= 0 || r.kind !== 'char' || heroine(r.id)) return;
      const ui = this.ui, d = H.CHARS[r.id], s = 'Косплей: ' + d.name + ' · сходство 100%', w = ui.measure(s, 11, true) + 28, x = W - w - 24, y = 300;
      c.save(); c.globalAlpha = cl(a);
      c.translate(x + w / 2, y); c.rotate(-0.05);
      c.fillStyle = '#14121c'; c.fillRect(-w / 2 - 2, -18, w + 4, 38);
      c.fillStyle = '#f2ecdc'; c.fillRect(-w / 2, -16, w, 34);
      c.fillStyle = '#c8243a'; c.fillRect(-w / 2, -16, w, 12);
      ui.text('ЖЮРИ КОН-ТОНА', 0, -16, { size: 8, bold: true, align: 'center', col: '#ffffff', shadow: false });
      ui.text(s, 0, 0, { size: 11, bold: true, align: 'center', col: '#2a2430', shadow: false });
      c.restore();
    }

    quote(c, q, a) {
      if (!q || a <= 0) return;
      const ui = this.ui, s = '«' + q + '»', lw = Math.min(600, ui.measure(s, 12) + 34);
      c.save(); c.globalAlpha = cl(a);
      c.fillStyle = 'rgba(10,6,24,0.84)'; c.fillRect(Math.round(W / 2 - lw / 2), HGT - 44, Math.round(lw), 22);
      ui.text(s, W / 2, HGT - 40, { size: 12, align: 'center', col: C.cream });
      c.restore();
    }

    resultTag(c, r, a) {
      if (a <= 0) return;
      const ui = this.ui;
      c.save(); c.globalAlpha = cl(a);
      ui.resultTag(W - 196, 50, r, [['Новый персонаж!', C.ok], ['присоединился к экипажу', C.cream]]);
      c.restore();
    }

    revealOverlay(c) {
      const ui = this.ui, r = this.item(), t = this.rt - this.hop, L = this.length(r);
      const own = t >= 0 && this.own(r);
      if (own) {
        const [bn, bt] = this.beatOf(r, t), line = (CUT_LINES[r.id] || {})[bn], end = total(own);
        const who = (CUT_WHO[r.id] || {})[bn];
        if (line && t < end) this.caption(c, line, seg(bt, 0.15, 0.4) * (1 - seg(bt, own.find(x => x[0] === bn)[1] - 0.25, own.find(x => x[0] === bn)[1])), who);
        if (JURY[r.id] === bn && t < end) this.jury(c, r, seg(bt, 0.2, 0.5));
        this.plate(c, r, seg(t, end, end + 0.4));
        this.quote(c, QUOTES[r.id], seg(t, end + 0.2, end + 0.5));
        this.resultTag(c, r, seg(t, L - 0.4, L - 0.1));
      } else if (t >= 0) {
        if (r.kind === 'char') {
          const b = t - WALK;
          this.plate(c, r, seg(b, SNAP, SNAP + 0.4));
          this.jury(c, r, seg(b, 0.45, 0.75));
          this.quote(c, QUOTES[r.id] || (H.WarpIntro ? H.WarpIntro.line(r.id, this.game) : ''), seg(b, 0.6, 0.9));
        } else this.plate(c, r, seg(t, 0.6, 0.9));
        this.resultTag(c, r, seg(t, L - 0.4, L - 0.1));
      }
      if (this.res.length > 1) ui.plate(12, 10, (this.cur + 1) + ' / ' + this.res.length);
      this.skipButton(c, this.res.length > 1 ? 'К итогам' : 'Закрыть');
      ui.hints([['Enter', this.rt < this.intro() ? 'Показать' : this.queue.length || this.res.length > 1 ? 'Далее' : 'Готово']], 12, HGT - 20);
    }

    rackOverlay(c) {
      const ui = this.ui, L = this.rackLayout();
      ui.text('ФОТОСТЕНА', 18, 8, { size: 22, bold: true, serif: true, col: '#ffd8ec' });
      ui.text('Номер 302', 20, 36, { size: 10, col: '#b8c8c0' });
      L.forEach((p, i) => ui.hit(p.x * 2, p.y * 2, p.w * 2, p.h * 2, () => { if (this.sel === i) this.done = true; else { this.sel = i; ui.sfx('select'); } }));
      const r = this.res[this.sel];
      if (r) { const d = r.kind === 'char' ? H.CHARS[r.id] : H.CONES[r.id]; ui.wrap((r.kind === 'char' ? d.fullName || d.name : '«' + d.name + '»'), 150, 12).forEach((l, i) => ui.text(l, 536, 236 + i * 15, { size: 12, bold: true, align: 'center', col: RCOL[r.rar] })); ui.text('★'.repeat(r.rar), 536, 268, { size: 12, align: 'center', col: RCOL[r.rar] }); }
      const five = this.res.filter(x => x.rar === 5).length, four = this.res.filter(x => x.rar === 4).length;
      ui.text('5★: ' + five + ' · 4★: ' + four, 536, 288, { align: 'center', size: 11, col: C.sub });
      ui.hints([['←↑↓→', 'Снимок'], ['Enter', 'Готово']], W / 2, HGT - 22, { align: 'center' });
    }
  }

  H.SpotlightShow = SpotlightShow;
  Object.assign(H, { SPOT_SHOTS: SHOTS, SPOT_CINE: CINE, SPOT_FILM_AT: FILM_AT, SpotKit: { BAR, BEAT, THEME_AT, POSE_AT, QUOTES, CHAR, CONE, HOP, WALK, TAIL, CUTS, CUT_LINES, BRIEF, heroine, cutLen: id => total(CUTS[id]) } });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
