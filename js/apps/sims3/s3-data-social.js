(function (S) {
  'use strict';
  const X = (name, cat, base, icon, anim, o) => Object.assign({ name, cat, base, icon, anim, dur: 12, req: {}, ok: { rel: 3, social: 8 }, fail: { rel: -3 } }, o || {});

  const SOCIAL_CATS = {
    friendly: { name: 'Дружеское...', icon: 'm_hand' },
    funny: { name: 'Весёлое...', icon: 'm_laugh' },
    romantic: { name: 'Романтическое...', icon: 'm_heart' },
    mean: { name: 'Недружелюбное...', icon: 'm_angry' },
    care: { name: 'Забота...', icon: 'm_baby' },
    special: { name: 'Особое...', icon: 'm_star' }
  };

  const SOCIALS = {
    introduce: X('Познакомиться', 'friendly', 96, 'm_hand', 'wave', { top: true, req: { met: false }, ok: { rel: 6, social: 12, special: 'meet' }, fail: { rel: -2 } }),
    chat: X('Поболтать', 'friendly', 92, 'n_social', 'talk', { top: true, req: { met: true }, ok: { rel: 3, social: 10 } }),
    talk_interests: X('Обсудить интересы', 'friendly', 85, 'm_idea', 'talk', { req: { met: true, rel: [8, 101] }, ok: { rel: 5, social: 12, special: 'reveal' } }),
    compliment: X('Сделать комплимент', 'friendly', 82, 'm_sparkle', 'talk', { req: { met: true, rel: [5, 101] }, ok: { rel: 6, social: 10 }, fail: { rel: -4, moodA: 'rejected' } }),
    ask_job: X('Спросить о работе', 'friendly', 92, 'm_briefcase', 'talk', { req: { met: true }, ok: { rel: 3, social: 8, special: 'reveal_job' } }),
    tell_story: X('Рассказать историю', 'friendly', 76, 'm_book', 'gesture', { req: { met: true, rel: [15, 101] }, ok: { rel: 6, social: 12, fun: 6 } }),
    friendly_hug: X('Обнять по-дружески', 'friendly', 80, 'm_heart', 'hug', { req: { met: true, rel: [35, 101], minAge: 'child' }, ok: { rel: 7, social: 12 }, fail: { rel: -5, moodA: 'rejected' } }),
    high_five: X('Дать пять', 'friendly', 86, 'm_hand', 'highfive', { req: { met: true, rel: [20, 101], minAge: 'child' }, ok: { rel: 5, social: 8, fun: 5 } }),
    comfort: X('Утешить', 'friendly', 82, 'm_halo', 'hug', { req: { met: true, rel: [15, 101], targetSad: true }, ok: { rel: 9, social: 12, moodB: 'good_convo', special: 'good_deed' } }),
    offer_bff: X('Предложить лучшую дружбу', 'friendly', 72, 'm_star', 'hug', { req: { met: true, rel: [80, 101], noflags: ['bff'], notFamilyRomance: true }, ok: { rel: 10, social: 15, set: 'bff', moodA: 'thrilled', moodB: 'thrilled' }, fail: { rel: -5, moodA: 'rejected' } }),
    brag: X('Похвастаться', 'friendly', 50, 'm_money', 'gesture', { req: { met: true }, ok: { rel: 2, social: 6 }, fail: { rel: -6 } }),
    borrow_money: X('Занять денег', 'friendly', 60, 'm_money', 'talk', { req: { met: true, rel: [60, 101], actorSkill: ['charisma', 6], otherHousehold: true }, ok: { rel: -2, social: 6, special: 'borrow' }, fail: { rel: -8, moodA: 'rejected' } }),
    talk_books: X('Поговорить о книгах', 'friendly', 80, 'm_book', 'talk', { req: { met: true, actorTrait: 'bookworm' }, ok: { rel: 5, social: 10, shared: 'bookworm' } }),
    talk_sports: X('Поговорить о спорте', 'friendly', 80, 'm_ball', 'talk', { req: { met: true, actorTrait: 'athletic' }, ok: { rel: 5, social: 10, shared: 'athletic' } }),
    talk_tech: X('Поговорить о компьютерах', 'friendly', 80, 'm_computer', 'talk', { req: { met: true, actorTrait: 'computer_whiz' }, ok: { rel: 5, social: 10, shared: 'computer_whiz' } }),
    talk_nature: X('Поговорить о природе', 'friendly', 80, 'm_leaf', 'talk', { req: { met: true, actorTrait: 'loves_outdoors' }, ok: { rel: 5, social: 10, shared: 'loves_outdoors' } }),
    talk_food: X('Поговорить о кулинарии', 'friendly', 80, 'm_food', 'talk', { req: { met: true, actorTrait: 'natural_cook' }, ok: { rel: 5, social: 10, shared: 'natural_cook' } }),
    complain: X('Пожаловаться на жизнь', 'friendly', 60, 'm_cloud', 'gesture', { req: { met: true, actorTrait: 'grumpy' }, ok: { rel: 1, social: 8, moodA: 'vented' }, fail: { rel: -4 } }),
    move_in: X('Предложить переехать', 'friendly', 70, 'm_house', 'talk', { req: { met: true, rel: [60, 101], otherHousehold: true, ownLot: true, minAge: 'ya', targetMinAge: 'ya' }, ok: { rel: 5, social: 10, special: 'move_in' }, fail: { rel: -5, moodA: 'rejected' } }),
    goodbye: X('Попрощаться', 'friendly', 99, 'm_hand', 'wave', { top: true, req: { visitorOnOwnLot: true }, ok: { rel: 1, social: 3, special: 'leave' } }),

    joke: X('Рассказать анекдот', 'funny', 70, 'm_laugh', 'gesture', { req: { met: true }, ok: { rel: 5, social: 10, fun: 10, moodB: 'laughed' }, fail: { rel: -3, moodB: 'not_funny' } }),
    funny_face: X('Скорчить рожицу', 'funny', 76, 'm_laugh', 'funny', { req: { met: true }, ok: { rel: 4, social: 8, fun: 8 }, fail: { rel: -3 } }),
    tickle: X('Пощекотать', 'funny', 74, 'm_laugh', 'tickle', { req: { met: true, rel: [30, 101] }, ok: { rel: 6, social: 10, fun: 10 }, fail: { rel: -5 } }),
    tease: X('Подразнить', 'funny', 55, 'm_laugh', 'gesture', { req: { met: true }, ok: { rel: 2, social: 6, fun: 6 }, fail: { rel: -6, moodB: 'insulted' } }),
    prank: X('Разыграть', 'funny', 50, 'm_swirl', 'funny', { req: { met: true, rel: [20, 101] }, ok: { rel: 4, social: 8, fun: 12 }, fail: { rel: -8, moodB: 'insulted' } }),
    inappropriate_joke: X('Пошутить неприлично', 'funny', 45, 'm_blush', 'gesture', { req: { met: true, actorTrait: 'inappropriate' }, ok: { rel: 5, social: 10, fun: 12 }, fail: { rel: -8, moodB: 'embarrassed' } }),

    flirt: X('Флиртовать', 'romantic', 58, 'm_heart', 'flirt', { req: { met: true, rel: [15, 101], romanticAges: true }, ok: { rel: 6, social: 10, set: 'crush', moodA: 'flirty', moodB: 'flirty' }, fail: { rel: -6, moodA: 'rejected' } }),
    compliment_looks: X('Сделать комплимент внешности', 'romantic', 60, 'm_sparkle', 'flirt', { req: { met: true, rel: [20, 101], romanticAges: true }, ok: { rel: 6, social: 10, set: 'crush' }, fail: { rel: -5, moodA: 'rejected' } }),
    confess: X('Признаться в симпатии', 'romantic', 58, 'm_heart', 'flirt', { req: { met: true, rel: [35, 101], flags: ['crush'], noflags: ['romance'], romanticAges: true }, ok: { rel: 8, social: 12, set: 'romance', moodA: 'flirty', moodB: 'flirty' }, fail: { rel: -8, moodA: 'rejected' } }),
    romantic_hug: X('Романтично обнять', 'romantic', 72, 'm_heart', 'hug', { req: { flags: ['romance'], romanticAges: true }, ok: { rel: 7, social: 12 }, fail: { rel: -6, moodA: 'rejected' } }),
    kiss: X('Поцеловать', 'romantic', 66, 'm_kiss', 'kiss', { req: { flags: ['romance'], romanticAges: true }, ok: { rel: 10, social: 15, special: 'kiss' }, fail: { rel: -10, moodA: 'rejected', moodB: 'insulted' } }),
    make_out: X('Страстно целоваться', 'romantic', 70, 'm_kiss', 'kiss', { req: { flags: ['romance'], rel: [60, 101], romanticAges: true }, ok: { rel: 10, social: 15, fun: 8, special: 'kiss' }, fail: { rel: -10, moodA: 'rejected' } }),
    go_steady: X('Предложить встречаться', 'romantic', 66, 'm_heart', 'hug', { req: { flags: ['romance'], rel: [50, 101], noflags: ['steady', 'engaged', 'married'], romanticAges: true }, ok: { rel: 12, social: 15, set: 'steady', moodA: 'in_love', moodB: 'in_love' }, fail: { rel: -10, moodA: 'rejected' } }),
    propose: X('Сделать предложение', 'romantic', 66, 'm_ring', 'propose', { req: { flags: ['steady'], rel: [75, 101], noflags: ['engaged', 'married'], minAge: 'ya', targetMinAge: 'ya' }, ok: { rel: 15, social: 15, set: 'engaged', moodA: 'engaged', moodB: 'engaged' }, fail: { rel: -15, moodA: 'heartbroken' } }),
    marry: X('Пожениться', 'romantic', 92, 'm_ring', 'kiss', { req: { flags: ['engaged'], minAge: 'ya', targetMinAge: 'ya' }, ok: { rel: 20, social: 20, special: 'marry' }, fail: { rel: -10, moodA: 'rejected' } }),
    woohoo: X('Шуры-муры', 'romantic', 70, 'm_heart', 'kiss', { bed: 'woohoo', req: { flags: ['romance'], rel: [55, 101], minAge: 'ya', targetMinAge: 'ya' }, ok: { rel: 10, social: 20, fun: 20 }, fail: { rel: -8, moodA: 'rejected' } }),
    try_baby: X('Завести ребёнка', 'romantic', 75, 'm_baby', 'kiss', { bed: 'baby', req: { flags: ['romance'], rel: [55, 101], canBaby: true }, ok: { rel: 10, social: 20, fun: 20 }, fail: { rel: -8, moodA: 'rejected' } }),
    break_up: X('Расстаться', 'romantic', 100, 'm_broken', 'argue', { req: { flags: ['steady'], noflags: ['married'] }, ok: { rel: -40, social: 0, special: 'break_up' } }),
    divorce: X('Развестись', 'romantic', 100, 'm_broken', 'argue', { req: { flags: ['married'] }, ok: { rel: -50, social: 0, special: 'divorce' } }),

    insult: X('Оскорбить', 'mean', 72, 'm_angry', 'argue', { req: { met: true }, ok: { rel: -10, social: 6, moodB: 'insulted', special: 'mean' }, fail: { rel: -6 } }),
    argue: X('Поспорить', 'mean', 72, 'm_angry', 'argue', { req: { met: true }, ok: { rel: -6, social: 6, special: 'mean' }, fail: { rel: -4 } }),
    mock: X('Высмеять', 'mean', 70, 'm_laugh', 'gesture', { req: { met: true }, ok: { rel: -8, social: 6, moodB: 'embarrassed', special: 'mean' }, fail: { rel: -4 } }),
    shove: X('Толкнуть', 'mean', 66, 'm_fist', 'shove', { req: { met: true, rel: [-101, 15], minAge: 'child' }, ok: { rel: -12, social: 4, special: 'mean' }, fail: { rel: -8 } }),
    slap: X('Дать пощёчину', 'mean', 72, 'm_angry', 'slap', { req: { met: true, rel: [-101, 0], minAge: 'teen' }, ok: { rel: -15, social: 4, moodB: 'slapped', special: 'mean' }, fail: { rel: -10 } }),
    fight: X('Подраться', 'mean', 90, 'm_fist', 'fight', { dur: 25, req: { met: true, rel: [-101, -25], minAge: 'teen', targetMinAge: 'teen' }, ok: { rel: -20, social: 0, special: 'fight' } }),
    evil_gossip: X('Злобно посплетничать', 'mean', 65, 'm_horns', 'talk', { req: { met: true, actorTrait: 'evil' }, ok: { rel: 3, social: 8, moodA: 'evil_joy' }, fail: { rel: -4 } }),
    tell_leave: X('Выгнать из дома', 'mean', 100, 'm_house', 'argue', { req: { visitorOnOwnLot: true }, ok: { rel: -10, social: 0, special: 'leave' } }),

    peekaboo: X('Сыграть в «ку-ку»', 'care', 95, 'm_laugh', 'funny', { req: { targetAge: ['baby', 'toddler'], minAge: 'child' }, ok: { rel: 6, social: 10, fun: 10 } }),
    play_tag: X('Поиграть в догонялки', 'care', 90, 'm_ball', 'jog', { dur: 20, req: { targetAge: ['child', 'teen'], actorAges: ['child', 'teen'] }, ok: { rel: 6, social: 10, fun: 15 } }),
    teach_walk: X('Учить ходить', 'care', 100, 'sk_walk', 'kneel', { dur: 30, req: { targetAge: ['toddler'], minAge: 'teen', teach: 'walk' }, ok: { rel: 4, social: 6, special: 'teach' } }),
    teach_talk: X('Учить говорить', 'care', 100, 'sk_talk', 'kneel', { dur: 30, req: { targetAge: ['toddler'], minAge: 'teen', teach: 'talk' }, ok: { rel: 4, social: 6, special: 'teach' } }),
    help_homework: X('Помочь с уроками', 'care', 100, 'm_book', 'talk', { dur: 40, req: { targetAge: ['child', 'teen'], minAge: 'teen', homework: true }, ok: { rel: 5, social: 6, special: 'homework' } }),
    greet: X('Пригласить в дом', 'special', 100, 'm_house', 'wave', { top: true, req: { greetable: true }, ok: { rel: 3, social: 6, special: 'greet' } })
  };
  const SOCIAL_KEYS = Object.keys(SOCIALS);

  const CARE = {
    pick_up: { name: 'Взять на руки', targetAge: ['baby', 'toddler'] },
    put_down: { name: 'Поставить на пол', targetAge: ['toddler'] },
    feed_baby: { name: 'Покормить', targetAge: ['baby', 'toddler'] },
    change: { name: 'Сменить подгузник', targetAge: ['baby', 'toddler'] },
    to_crib: { name: 'Уложить спать', targetAge: ['baby', 'toddler'] },
    cuddle: { name: 'Понянчить', targetAge: ['baby'] },
    bathe: { name: 'Искупать', targetAge: ['baby', 'toddler'] }
  };

  const TOPICS = ['m_sun', 'm_money', 'm_heart', 'm_ball', 'm_food', 'm_book', 'm_note', 'm_tv', 'm_house', 'm_car', 'm_computer', 'm_leaf', 'm_star', 'm_cloud', 'm_fish', 'm_briefcase'];

  Object.assign(S, { SOCIALS, SOCIAL_KEYS, SOCIAL_CATS, CARE, TOPICS });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
