(function (S) {
  'use strict';
  const NOW = 14, TOP = 10, LEVEL_XP = [0, 60, 180, 360, 600, 900, 1300, 1850, 2600, 3600, 5000];
  const GOOD_MOOD = 50, GOOD_RATE = 1.2, BAD_RATE = 0.7, FAST_LEARNER = 1.5, BOOK_CAP = 3, BOOK_MINS = 60;
  const CHESS_RANKS = [[0, 'Новичок'], [5, 'Любитель'], [15, 'Третий разряд'], [30, 'Второй разряд'], [50, 'Первый разряд'], [75, 'Кандидат в мастера'], [100, 'Мастер'], [150, 'Гроссмейстер']];

  const ROWS = [
    ['cooking', 'Готовка', 'cook', 'teen', 13, 'готовке', 'Плита, гриль и книги рецептов. Уровень открывает новые блюда, качество растёт, кухня горит реже.'],
    ['athletic', 'Спорт', 'punch', 'teen', 13, 'спорту', 'Груша, пробежка, зарядка под телевизор. Тренировки утомляют меньше, в драке легче устоять.'],
    ['logic', 'Логика', 'chess', 'child', 13, 'логике', 'Шахматы и книги. Партии выигрываются чаще, растёт шахматный разряд.'],
    ['charisma', 'Обаяние', 'talk', 'teen', 13, 'обаянию', 'Разговоры, звонки, репетиция у зеркала. Реплики удаются чаще, открываются новые.'],
    ['fishing', 'Рыбалка', 'fish', 'child', 14, 'рыбалке', 'Удочка у моря, пруда и ручья. С 1 уровня видно, кто водится, с 3 наживка, с 5 живая. Каждые 2 уровня новые рыбы.'],
    ['gardening', 'Сад', 'tree', 'teen', 14, 'саду', 'Грядки во дворе: посадить, полить, прополоть, подкормить, собрать. Редкие посадки с 5 и 7 уровня.'],
    ['guitar', 'Гитара', 'guitar', 'teen', 14, 'гитаре', 'Гитара в инвентаре: играть дома, петь для семьи, собирать чаевые в парке. С каждым уровнем новая песня.'],
    ['handiness', 'Ремонт', 'skills', 'teen', 14, 'ремонту', 'Улучшения плиты, душа, кровати, телевизора и другой техники. Новичка электрика бьёт током.'],
    ['painting', 'Рисование', 'paint', 'child', 14, 'рисованию', 'Мольберт: рисунки, с 4 уровня настоящая живопись и шедевры. Картины продаются из инвентаря.'],
    ['writing', 'Письмо', 'keys', 'child', 14, 'письму', 'Романы на компьютере, 12 жанров. Рукопись уходит издателю за аванс и гонорар каждую неделю.']
  ];

  const SOURCES = {
    cook_meal: ['cooking', 1, 1], grill_cook: ['cooking', 0.8, 0],
    punchbag_hit: ['athletic', 1, 0], exercise: ['athletic', 0.7, 0], tv_workout: ['athletic', 0.9, 0],
    chess_play: ['logic', 0.8, 0], mirror_speech: ['charisma', 0.9, 0], phone_call: ['charisma', 0.5, 0],
    read_cooking: ['cooking', 1.4, 1], read_athletic: ['athletic', 1.4, 1], read_logic: ['logic', 1.4, 1], read_charisma: ['charisma', 1.4, 1],
    fish_here: ['fishing', 1, 0], fish_pond: ['fishing', 1, 0], fish_scan: ['fishing', 0.5, 0],
    garden_plant: ['gardening', 1, 0], garden_water: ['gardening', 1, 0], garden_weed: ['gardening', 1.2, 0], garden_feed: ['gardening', 1.2, 0], garden_harvest: ['gardening', 1, 0], garden_revive: ['gardening', 1.5, 0], water_bush: ['gardening', 0.6, 0],
    guitar_play: ['guitar', 1, 0], guitar_song: ['guitar', 1.2, 0], guitar_tips: ['guitar', 0.9, 0],
    upgrade: ['handiness', 1.2, 0], tinker: ['handiness', 0.5, 0],
    easel_paint: ['painting', 1, 0], paint_canvas: ['painting', 1, 0],
    write_novel: ['writing', 1, 0]
  };
  const TRAIT_RATES = {
    naturalCook: { cooking: 1.5 }, genius: { logic: 1.5 }, athletic: { athletic: 1.5 }, charismatic: { charisma: 1.5 }, schmoozer: { charisma: 1.2 },
    couchPotato: { athletic: 0.6 }, loner: { charisma: 0.7 }, bookworm: { book: 1.5 }, perfectionist: { all: 0.9 }, absentMinded: { book: 0.8 }
  };
  const SOCIAL_PRACTICE = new Set(['friendly', 'romance', 'jokes', 'ask', 'special']);

  const CHALLENGES = [
    ['chef', 'cooking', 'Шеф одной кухни', 'Приготовить 50 блюд', 'meals', 50, 'Блюда выходят на полступени лучше.'],
    ['allRecipes', 'cooking', 'Знаток всех рецептов', 'Знать все 28 рецептов', 'recipesKnown', 28, 'На этой кухне больше не бывает пожаров.'],
    ['hundredPerfect', 'cooking', 'Сто безупречных блюд', 'Приготовить 100 блюд на «превосходно» и выше', 'great', 100, 'Совершенство выходит чаще.'],
    ['endurance', 'athletic', 'Выносливость', 'Тренироваться 40 часов', 'workoutMins', 2400, 'Тренировка отнимает вдвое меньше сил.'],
    ['ironGrip', 'athletic', 'Железная хватка', 'Набить 20 часов на груше', 'punchMins', 1200, 'В драке побеждает чаще.'],
    ['halfTown', 'athletic', 'Полгорода бегом', 'Пробежать 10 километров', 'jogTiles', 10000, 'Пробежка даёт больше опыта и веселья.'],
    ['champion', 'logic', 'Школьный чемпион', 'Выиграть 40 шахматных партий', 'chessWins', 40, 'Партии выигрываются чаще.'],
    ['astronomer', 'logic', 'Астроном', 'Найти 10 туманностей в телескоп', 'nebulae', 10, 'Звёзды видны лучше.', 23],
    ['mathematician', 'logic', 'Математик', 'Решить 20 задач за деньги', 'problems', 20, 'Задачи решаются быстрее.', 16],
    ['manyFriends', 'charisma', 'Много друзей', 'Иметь 10 друзей сразу', 'friendsNow', 10, 'Дружба остывает медленнее.'],
    ['knowsAll', 'charisma', 'Знает всех', 'Познакомиться с 40 людьми', 'peopleMet', 40, 'Знакомство всегда удаётся.'],
    ['noEnemies', 'charisma', 'Ни одного врага', '15 друзей и ни одного врага', 'friendsNoFoes', 15, 'Злые реплики чаще проходят мимо.'],
    ['fishExpert', 'fishing', 'Знаток рыб', 'Поймать все 20 видов рыб', 'fishKinds', 20, 'Рыба попадается крупнее.'],
    ['bigCatch', 'fishing', 'Рыбак с большим счётом', 'Поймать 300 рыб', 'fishCaught', 300, 'Клюёт чаще.'],
    ['trophy', 'fishing', 'Трофей', 'Поймать рыбу тяжелее 10 кг', 'bigFish', 1, 'Безупречная рыба попадается чаще.'],
    ['plantedAll', 'gardening', 'Всё посажено', 'Посадить все 19 растений', 'plantedKinds', 19, 'Семена с грядки попадаются вдвое чаще.'],
    ['perfectHarvest', 'gardening', 'Безупречный урожай', 'Собрать 25 безупречных плодов', 'perfectCrop', 25, 'Урожай выходит лучше.'],
    ['farm', 'gardening', 'Своя ферма', 'Сдать в магазин товара на §2 000', 'shopSales', 2000, 'Урожай дороже на пятую часть.'],
    ['hundredSongs', 'guitar', 'Сотня песен', 'Сыграть 100 песен', 'songs', 100, 'Песни веселят слушателей сильнее.'],
    ['square', 'guitar', 'Звезда площади', 'Собрать §1 500 чаевых', 'tips', 1500, 'Чаевые щедрее на четверть.'],
    ['concert', 'guitar', 'Сольный концерт', 'Заработать §150 за одно выступление', 'concert', 1, 'Слушатели привязываются сильнее.'],
    ['mechanic', 'handiness', 'Механик', 'Поставить 20 улучшений', 'upgrades', 20, 'Улучшения ставятся вдвое быстрее.'],
    ['garage', 'handiness', 'Гараж', 'Провести с отвёрткой 30 часов', 'tinkerMins', 1800, 'Детали для улучшений вдвое дешевле.'],
    ['noShock', 'handiness', 'Без единого удара током', '15 улучшений техники подряд без удара током', 'noShockRun', 15, 'Током больше не бьёт.'],
    ['brush', 'painting', 'Кисть', 'Написать 20 картин', 'paintings', 20, 'Картины пишутся быстрее.'],
    ['masterpieces', 'painting', 'Шедевры', 'Написать 5 шедевров', 'masterpieces', 5, 'Шедевры выходят чаще.'],
    ['pricey', 'painting', 'Дорогая картина', 'Продать картину за §1 000', 'priciest', 1000, 'Картины продаются дороже.'],
    ['bestseller', 'writing', 'Автор бестселлера', 'Написать бестселлер', 'bestsellers', 1, 'Гонорары выше.'],
    ['manyGenres', 'writing', 'Много жанров', 'Написать романы в 8 жанрах', 'genresWritten', 8, 'Романы пишутся быстрее.'],
    ['prolific', 'writing', 'Плодовитое перо', 'Написать 25 романов', 'novels', 25, 'Авансы больше в полтора раза.']
  ];

  S.SKILLS = {};
  for (const [id, name, icon, age, stage, dative, text] of ROWS) S.SKILLS[id] = { id, name, icon, age, stage, dative, text };
  S.SKILL_CHALLENGES = {};
  for (const [id, skill, name, goal, stat, n, perk, stage] of CHALLENGES) S.SKILL_CHALLENGES[id] = { id, skill, name, goal, stat, n, perk, stage: stage || NOW };
  S.SKILL_BOOKS = {
    read_cooking: { skill: 'cooking', name: 'Книга «Кухня без страха»' },
    read_athletic: { skill: 'athletic', name: 'Книга «Утренняя зарядка»' },
    read_logic: { skill: 'logic', name: 'Книга «Задачи для ума»' },
    read_charisma: { skill: 'charisma', name: 'Книга «Искусство беседы»' }
  };

  const levelOf = xp => {
    let level = 0;
    while (level < TOP && xp >= LEVEL_XP[level + 1]) level++;
    return level;
  };

  const blank = () => ({ meals: 0, perfect: 0, great: 0, recipesKnown: 0, cooked: {}, fires: 0, workoutMins: 0, punchMins: 0, jogTiles: 0, chessGames: 0, chessWins: 0, mirrorMins: 0, books: [], nebulae: 0, problems: 0, peopleMet: 0, friendsNow: 0, friendsNoFoes: 0, fishCaught: 0, fishKinds: 0, bigFish: 0, plantedKinds: 0, perfectCrop: 0, harvests: 0, shopSales: 0, songs: 0, tips: 0, concert: 0, upgrades: 0, tinkerMins: 0, noShockRun: 0, paintings: 0, masterpieces: 0, paintingsSold: 0, priciest: 0, novels: 0, genresWritten: 0, bestsellers: 0, published: 0, royaltiesEarned: 0, kindsFound: 0 });

  S.Skills = {
    NOW, TOP, LEVEL_XP, SOURCES, CHESS_RANKS, BOOK_CAP, BOOK_MINS, levelOf,

    fresh: () => ({ xp: {}, stats: blank(), done: [], certs: [] }),

    level(sim, id) {
      return sim.skill && sim.skill.xp[id] !== undefined ? levelOf(sim.skill.xp[id]) : 0;
    },

    started(sim, id) {
      return !!(sim.skill && sim.skill.xp[id] !== undefined);
    },

    list(sim) {
      return sim.skill ? Object.keys(sim.skill.xp).filter(id => S.SKILLS[id]).sort((a, b) => S.Skills.level(sim, b) - S.Skills.level(sim, a) || (a < b ? -1 : 1)) : [];
    },

    can(sim, id) {
      const def = S.SKILLS[id];
      return !!(def && sim.skill && def.stage <= NOW && S.AGE_RANK[sim.age] >= S.AGE_RANK[def.age]);
    },

    rate(world, sim, id, base, book) {
      let k = base;
      for (const trait of S.Traits ? S.Traits.of(sim) : []) {
        const t = TRAIT_RATES[trait];
        if (!t) continue;
        if (t[id]) k *= t[id];
        if (book && t.book) k *= t.book;
        if (t.all) k *= t.all;
      }
      const mood = sim.moods ? S.Moods.mood(sim) : 0;
      k *= mood >= GOOD_MOOD ? GOOD_RATE : mood < 0 ? BAD_RATE : 1;
      if (sim.rewards && sim.rewards.includes('fastLearner')) k *= FAST_LEARNER;
      return k;
    },

    practice(world, sim, id, base, dt, cap) {
      if (!S.Skills.can(sim, id)) return false;
      const skill = sim.skill, before = S.Skills.level(sim, id);
      if (cap !== undefined && before >= cap) return false;
      const first = skill.xp[id] === undefined;
      skill.xp[id] = Math.min(LEVEL_XP[TOP], (skill.xp[id] || 0) + S.Skills.rate(world, sim, id, base, cap !== undefined) * dt);
      if (cap !== undefined) skill.xp[id] = Math.min(skill.xp[id], LEVEL_XP[cap]);
      const after = S.Skills.level(sim, id);
      if (first) world.events.push({ type: 'skill', sim: sim.id, name: sim.name, skill: id, level: after, text: sim.name + ': начат навык «' + S.SKILLS[id].name + '»' });
      for (let level = before + 1; level <= after; level++) S.Skills.levelUp(world, sim, id, level);
      return true;
    },

    levelUp(world, sim, id, level) {
      if (S.MOODLETS.skillUp) S.Moods.add(sim, level === TOP ? 'mastery' : 'skillUp', 0, world);
      world.events.push({ type: 'skill', sim: sim.id, name: sim.name, skill: id, level, text: sim.name + ': «' + S.SKILLS[id].name + '», уровень ' + level });
      if (level === TOP && !sim.skill.certs.includes(id)) {
        sim.skill.certs.push(id);
        world.events.push({ type: 'skill', sim: sim.id, name: sim.name, skill: id, level, cert: true, text: sim.name + ' получает сертификат мастера: «' + S.SKILLS[id].name + '»' });
        if (S.Econ && sim.bag) S.Econ.certificate(world, sim, id);
      }
      if (id === 'cooking' && S.Food) S.Food.learnRecipes(world, sim);
      S.Skills.check(world, sim);
      if (S.Wishes) S.Wishes.checkDream(world, sim);
    },

    stat(world, sim, key, add) {
      if (!sim.skill) return;
      const stats = sim.skill.stats;
      stats[key] = (stats[key] || 0) + add;
      S.Skills.check(world, sim);
    },

    setStat(world, sim, key, value) {
      if (!sim.skill || sim.skill.stats[key] === value) return;
      sim.skill.stats[key] = value;
      S.Skills.check(world, sim);
    },

    progress(sim, challenge) {
      const def = S.SKILL_CHALLENGES[challenge], value = sim.skill ? sim.skill.stats[def.stat] || 0 : 0;
      return [Math.min(value, def.n), def.n];
    },

    has(sim, challenge) {
      return !!(sim.skill && sim.skill.done.includes(challenge));
    },

    check(world, sim) {
      const skill = sim.skill;
      if (!skill) return;
      for (const def of Object.values(S.SKILL_CHALLENGES)) {
        if (def.stage > NOW || skill.done.includes(def.id) || !S.Skills.started(sim, def.skill)) continue;
        if ((skill.stats[def.stat] || 0) < def.n) continue;
        skill.done.push(def.id);
        world.events.push({ type: 'skill', sim: sim.id, name: sim.name, skill: def.skill, challenge: def.id, text: sim.name + ': вызов «' + def.name + '» пройден. ' + def.perk });
      }
    },

    chessRank(sim) {
      const wins = sim.skill ? sim.skill.stats.chessWins || 0 : 0;
      let rank = CHESS_RANKS[0][1];
      for (const [need, name] of CHESS_RANKS) {
        if (wins < need) break;
        if (name === 'Гроссмейстер' && S.Skills.level(sim, 'logic') < TOP) break;
        rank = name;
      }
      return rank;
    },

    chessGame(world, sim) {
      if (!sim.skill) return;
      const chance = 0.3 + S.Skills.level(sim, 'logic') * 0.06 + (S.Skills.has(sim, 'champion') ? 0.1 : 0), won = S.roll(world.rng) < chance;
      const before = S.Skills.chessRank(sim);
      S.Skills.stat(world, sim, 'chessGames', 1);
      if (won) S.Skills.stat(world, sim, 'chessWins', 1);
      const after = S.Skills.chessRank(sim);
      world.events.push({ type: 'skill', sim: sim.id, name: sim.name, skill: 'logic', text: sim.name + (won ? ': партия выиграна' : ': партия проиграна') + (after !== before ? '. Новый разряд: ' + after : '') });
      if (won && sim.wish) S.Wishes.bump(sim, 'chessWins');
      if (S.Wishes) S.Wishes.checkDream(world, sim);
    },

    social(world, sim, row, dt) {
      if (row && SOCIAL_PRACTICE.has(row.section)) S.Skills.practice(world, sim, 'charisma', 0.3, dt);
    },

    bookDone(world, sim, ad) {
      const book = S.SKILL_BOOKS[ad];
      if (!book || !sim.skill) return;
      if (!sim.skill.stats.books.includes(ad)) sim.skill.stats.books.push(ad);
      if (sim.wish) S.Wishes.bump(sim, 'book_' + book.skill);
    },

    socialStats(world, sim) {
      if (!sim.skill || !S.Rel || !world.rels) return;
      const friends = S.Rel.friends(world, sim), foes = S.Rel.count(world, sim, (rel, status) => status === 'enemy' || status === 'oldEnemy'), met = S.Rel.count(world, sim, rel => !!(rel.f & S.Rel.F.met) && !S.Rel.kinOf(world, sim, S.Rel.other(world, rel, sim)));
      sim.skill.stats.friendsNow = friends;
      sim.skill.stats.peopleMet = met;
      sim.skill.stats.friendsNoFoes = foes ? 0 : friends;
      S.Skills.check(world, sim);
    },

    pack(sim) {
      return sim.skill ? JSON.parse(JSON.stringify(sim.skill)) : null;
    },

    unpack(r) {
      if (r === null || r === undefined) return null;
      if (!r || typeof r !== 'object' || !r.xp || !r.stats || !Array.isArray(r.done) || !Array.isArray(r.certs)) throw new Error('повреждены навыки жителя');
      for (const id of Object.keys(r.xp)) if (!S.SKILLS[id] || !Number.isFinite(r.xp[id])) throw new Error('неизвестный навык в файле: ' + id);
      for (const id of r.done) if (!S.SKILL_CHALLENGES[id]) throw new Error('неизвестный вызов в файле: ' + id);
      return { xp: Object.assign({}, r.xp), stats: Object.assign(blank(), r.stats), done: r.done.slice(), certs: r.certs.slice() };
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
