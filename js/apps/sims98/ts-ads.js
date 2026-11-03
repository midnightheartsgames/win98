(function (S) {
  'use strict';
  const MEAL = { seat: 'chair', clip: 'eat', standClip: 'eatStand', mins: 20, gain: { hunger: 72, fun: 3 } };

  S.NEED_NAMES = { hunger: 'Голод', social: 'Общение', bladder: 'Туалет', hygiene: 'Гигиена', energy: 'Энергия', fun: 'Веселье' };
  S.NEED_ORDER = ['hunger', 'social', 'bladder', 'hygiene', 'energy', 'fun'];
  S.NEED_HOURS = { hunger: 30, bladder: 16, energy: 24, hygiene: 30, social: 40, fun: 28 };
  S.AGE_RANK = { toddler: 0, child: 1, teen: 2, adult: 3 };

  S.ADS = {
    fridge_snack: {
      obj: 'fridge', name: 'Перекусить', icon: 'eat', mood: 'snack', age: 'toddler', below: { hunger: 72 },
      steps: [{ pose: 'front', clip: 'use', mins: 3, sound: 'fridge' }, { here: true, clip: 'eatStand', mins: 12, gain: { hunger: 28, fun: 2 } }]
    },
    fridge_cold: {
      obj: 'fridge', name: 'Холодный обед', icon: 'eat', mood: 'coldMeal', age: 'child', below: { hunger: 55 },
      steps: [{ pose: 'front', clip: 'use', mins: 4, sound: 'fridge' }, Object.assign({}, MEAL, { mins: 18, gain: { hunger: 50, fun: 1 } })]
    },
    cook_meal: {
      obj: 'stove', name: 'Приготовить обед', icon: 'cook', mood: 'homeMeal', age: 'teen', below: { hunger: 55 },
      steps: [{ obj: 'fridge', pose: 'front', clip: 'use', mins: 3, sound: 'fridge' }, { pose: 'front', clip: 'cook', mins: 22, loop: 'sizzle', gain: { fun: 3 } }, MEAL]
    },
    grill_cook: {
      obj: 'grill', name: 'Пожарить мясо', icon: 'cook', mood: 'grilled', age: 'teen', below: { hunger: 50 },
      steps: [{ pose: 'front', clip: 'cook', mins: 25, loop: 'sizzle', gain: { fun: 8 } }, MEAL]
    },
    kitchen_wash: { obj: 'kitchen_sink', name: 'Помыть руки', icon: 'wash', age: 'child', below: { hygiene: 50 }, steps: [{ pose: 'front', clip: 'wash', mins: 6, loop: 'water', gain: { hygiene: 14 } }] },
    toilet_use: { obj: 'toilet', name: 'Сходить в туалет', icon: 'toilet', age: 'toddler', below: { bladder: 45 }, urgent: 'bladder', steps: [{ pose: 'sit', clip: 'sit', mins: 8, fill: { bladder: 100 }, end: 'flush' }] },
    shower_take: { obj: 'shower', name: 'Принять душ', icon: 'wash', mood: 'freshShower', age: 'child', below: { hygiene: 60 }, steps: [{ pose: 'inside', clip: 'shower', mins: 20, loop: 'water', fill: { hygiene: 100 } }] },
    bath_take: { obj: 'bathtub', name: 'Принять ванну', icon: 'wash', mood: 'warmBath', age: 'child', below: { hygiene: 50 }, steps: [{ pose: 'lie', clip: 'sleep', mins: 45, loop: 'water', fill: { hygiene: 100 }, gain: { fun: 18 } }] },
    sink_wash: { obj: 'bath_sink', name: 'Умыться', icon: 'wash', mood: 'faceWash', age: 'toddler', below: { hygiene: 55 }, steps: [{ pose: 'front', clip: 'wash', mins: 8, loop: 'water', gain: { hygiene: 24 } }] },
    bed_sleep: { objs: ['bed', 'small_bed'], name: 'Лечь спать', icon: 'sleep', age: 'toddler', below: { energy: 45 }, urgent: 'energy', steps: [{ pose: 'lie', clip: 'sleep', mins: 480, loop: 'snore', fill: { energy: 100 }, rests: true }] },
    bed_nap: { objs: ['bed', 'small_bed'], name: 'Вздремнуть', icon: 'sleep', mood: 'napped', age: 'toddler', below: { energy: 30 }, steps: [{ pose: 'lie', clip: 'sleep', mins: 90, loop: 'snore', gain: { energy: 25 }, rests: true }] },
    sofa_nap: { obj: 'sofa', name: 'Вздремнуть сидя', icon: 'sleep', mood: 'napped', age: 'child', below: { energy: 25 }, steps: [{ pose: 'sit', clip: 'sit', mins: 60, gain: { energy: 14 }, rests: true }] },
    sofa_sit: { obj: 'sofa', name: 'Посидеть', icon: 'sit', age: 'toddler', player: true, steps: [{ pose: 'sit', clip: 'sit', mins: 60, gain: { energy: 3 } }] },
    chair_sit: { objs: ['chair', 'armchair'], name: 'Посидеть', icon: 'sit', age: 'toddler', player: true, steps: [{ pose: 'sit', clip: 'sit', mins: 60, gain: { energy: 3 } }] },
    tv_watch: { obj: 'tv', name: 'Смотреть телевизор', icon: 'tv', mood: 'goodShow', age: 'toddler', below: { fun: 75 }, steps: [{ seat: 'any', clip: 'watch', standClip: 'idle', mins: 60, loop: 'tv', gain: { fun: 58 } }] },
    stereo_listen: { obj: 'stereo', name: 'Послушать музыку', icon: 'music', mood: 'dancing', age: 'child', below: { fun: 70 }, steps: [{ pose: 'front', clip: 'use', mins: 2, sound: 'tick' }, { here: true, clip: 'dance', mins: 30, loop: 'music', gain: { fun: 38, hygiene: -3 } }] },
    book_read: { obj: 'bookshelf', name: 'Почитать', icon: 'book', mood: 'greatBook', age: 'child', below: { fun: 65 }, steps: [{ pose: 'front', clip: 'use', mins: 2 }, { seat: 'any', clip: 'read', standClip: 'readStand', mins: 45, gain: { fun: 34 } }] },
    computer_play: { obj: 'computer', name: 'Поиграть на компьютере', icon: 'keys', mood: 'gameWin', age: 'child', below: { fun: 70 }, steps: [{ pose: 'sit', clip: 'type', mins: 60, loop: 'keys', gain: { fun: 60 } }] },
    computer_chat: { obj: 'computer', name: 'Поболтать в сети', icon: 'keys', mood: 'chatOnline', age: 'teen', below: { social: 55 }, steps: [{ pose: 'sit', clip: 'type', mins: 40, loop: 'keys', gain: { social: 34, fun: 12 } }] },
    easel_paint: { obj: 'easel', name: 'Порисовать', icon: 'paint', mood: 'inspired', age: 'child', below: { fun: 60 }, steps: [{ pose: 'front', clip: 'paint', mins: 45, gain: { fun: 40 } }] },
    punchbag_hit: { obj: 'punchbag', name: 'Постучать по груше', icon: 'punch', mood: 'workedOut', age: 'teen', below: { fun: 55 }, steps: [{ pose: 'front', clip: 'punch', mins: 30, gain: { fun: 32, hygiene: -14, energy: -8 } }] },
    chess_play: { obj: 'chess', name: 'Сыграть в шахматы', icon: 'chess', mood: 'chessGame', age: 'child', below: { fun: 60 }, steps: [{ pose: 'front', clip: 'use', mins: 30, gain: { fun: 30 } }] },
    toybox_play: { obj: 'toybox', name: 'Поиграть', icon: 'toy', mood: 'playtime', age: 'toddler', ageMax: 'child', below: { fun: 75 }, steps: [{ pose: 'front', clip: 'use', mins: 30, gain: { fun: 48 } }] },
    mailbox_check: { obj: 'mailbox', name: 'Проверить почту', icon: 'scroll', age: 'child', player: true, steps: [{ pose: 'front', clip: 'use', mins: 2, gain: { fun: 2 } }] },
    floor_sleep: { name: 'Без сил', icon: 'sleep', mood: 'floorNight', age: 'toddler', player: true, steps: [{ here: true, clip: 'sleepFloor', mins: 120, gain: { energy: 40 }, rests: true }] },
    talk_self: { name: 'Поговорить с собой', icon: 'talk', mood: 'selfTalk', bubble: 'question', traits: ['eccentric'], age: 'toddler', steps: [{ here: true, clip: 'talk', mins: 8, gain: { fun: 14, social: 6 } }] },
    hum_tune: { name: 'Напевать', icon: 'music', bubble: 'music', traits: ['virtuoso'], age: 'toddler', steps: [{ here: true, clip: 'dance', mins: 6, gain: { fun: 12 } }] },
    check_stove: { obj: 'stove', name: 'Проверить плиту', icon: 'cook', bubble: 'bolt', traits: ['neurotic'], age: 'child', steps: [{ pose: 'front', clip: 'use', mins: 3, gain: { fun: 4 } }] },
    grumble: { name: 'Поворчать', icon: 'cloud', mood: 'grumbled', bubble: 'cloud', traits: ['grumpy', 'loser'], age: 'toddler', steps: [{ here: true, clip: 'grumble', mins: 5, gain: { fun: 12 } }] },
    exercise: { name: 'Размяться', icon: 'punch', mood: 'workedOut', bubble: 'punch', traits: ['athletic', 'daredevil'], age: 'child', steps: [{ here: true, clip: 'exercise', mins: 20, gain: { fun: 16, hygiene: -8 } }] },
    daydream: { name: 'Помечтать', icon: 'heart', mood: 'dreamy', bubble: 'heart', traits: ['hopelessRomantic', 'flirty', 'greatKisser', 'absentMinded'], age: 'child', steps: [{ seat: 'any', clip: 'think', standClip: 'think', mins: 15, gain: { fun: 12 } }] },
    polish: { objs: ['counter', 'kitchen_sink', 'bath_sink'], name: 'Навести блеск', icon: 'wash', bubble: 'wash', traits: ['neat'], age: 'child', steps: [{ pose: 'front', clip: 'wash', mins: 10, gain: { fun: 10 } }] },
    kick_trash: { obj: 'trash', name: 'Пнуть урну', icon: 'punch', bubble: 'fire', traits: ['meanSpirited', 'evil', 'hotHeaded'], age: 'child', steps: [{ pose: 'front', clip: 'punch', mins: 2, gain: { fun: 10 } }] },
    sneak_snack: { obj: 'fridge', name: 'Стащить кусочек', icon: 'eat', mood: 'snack', traits: ['mooch', 'slob', 'kleptomaniac'], age: 'toddler', below: { hunger: 85 }, steps: [{ pose: 'front', clip: 'eatStand', mins: 4, gain: { hunger: 14, fun: 6 } }] },
    tinker: { objs: ['stereo', 'tv', 'computer'], name: 'Подкрутить', icon: 'skills', mood: 'fixedIt', bubble: 'skills', traits: ['handy', 'computerWhiz'], age: 'teen', steps: [{ pose: 'front', clip: 'use', mins: 15, gain: { fun: 12 } }] },
    water_bush: { obj: 'bush', name: 'Полить куст', icon: 'tree', mood: 'gardening', bubble: 'tree', traits: ['greenThumb', 'natureLover'], age: 'child', steps: [{ pose: 'near', clip: 'wash', mins: 8, gain: { fun: 12 } }] },
    count_money: { name: 'Пересчитать сбережения', icon: 'money', bubble: 'money', traits: ['frugal'], age: 'child', steps: [{ seat: 'any', clip: 'read', standClip: 'readStand', mins: 10, gain: { fun: 10 } }] },
    work_home: { obj: 'computer', name: 'Поработать из дома', icon: 'job', mood: 'goodWorkday', bubble: 'job', traits: ['workaholic', 'ambitious'], age: 'teen', steps: [{ pose: 'sit', clip: 'type', mins: 45, loop: 'keys', gain: { fun: 14 } }] },
    pocket_thing: { objs: ['bookshelf', 'nightstand'], name: 'Прикарманить безделушку', icon: 'mask', mood: 'trophy', bubble: 'mask', traits: ['kleptomaniac'], age: 'child', steps: [{ pose: 'front', clip: 'use', mins: 2, gain: { fun: 14 } }] },
    mock_art: { obj: 'easel', name: 'Поругать картину', icon: 'paint', bubble: 'cloud', traits: ['artHater'], age: 'child', steps: [{ pose: 'front', clip: 'grumble', mins: 4, gain: { fun: 12 } }] },
    crossword: { name: 'Разгадать кроссворд', icon: 'book', bubble: 'question', traits: ['noHumor'], age: 'child', steps: [{ seat: 'any', clip: 'read', standClip: 'readStand', mins: 20, gain: { fun: 14 } }] },
    veggie_snack: { obj: 'fridge', name: 'Погрызть морковку', icon: 'eat', bubble: 'eat', traits: ['vegetarian'], age: 'toddler', below: { hunger: 90 }, steps: [{ pose: 'front', clip: 'eatStand', mins: 4, gain: { hunger: 10, fun: 4 } }] }
  };
  for (const [id, ad] of Object.entries(S.ADS)) ad.id = id;

  S.adGains = ad => {
    const out = Object.assign({}, ad.wants);
    for (const step of ad.steps) {
      for (const source of [step.gain, step.fill]) {
        if (!source) continue;
        for (const [need, value] of Object.entries(source)) out[need] = (out[need] || 0) + value;
      }
    }
    return out;
  };

  S.adAllowed = (ad, age, sim) => {
    if (S.AGE_RANK[age] < S.AGE_RANK[ad.age]) return false;
    if (ad.traits && !(sim && S.Traits && ad.traits.some(id => S.Traits.has(sim, id)))) return false;
    if (ad.job && !(sim && sim.job && sim.job.id === ad.job[0] && sim.job.level >= ad.job[1])) return false;
    return !ad.ageMax || S.AGE_RANK[age] <= S.AGE_RANK[ad.ageMax] || !!(sim && S.Traits && S.Traits.has(sim, 'childish'));
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
