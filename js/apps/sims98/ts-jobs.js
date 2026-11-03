(function (S) {
  'use strict';
  const DAY = 1440, LEAD_BASE = 55, LEAD_MIN = 30, LEAD_MAX = 120, ROAD_FACTOR = 2, GAP = 60, LATE_SLACK = 10, GIVE_UP = 120, WAKE_BEFORE = 60;
  const PERF_HOUR = 4, PERF_SHIFT = 480, STUDY_RATE = 0.6, BONUS_HOURS = 12, TOP_BONUS_HOURS = 8, TOP_PERF = 60, LOW_DAYS = 3, MISS_FIRE = 3, PENSION = 0.285, EARLY_PERF = 10, HOME_PERF = 3;
  const ASK_FLOOR = 70, ASK_FAIL = 10, MISS_PERF = 20, LATE_PERF = 5, START_PERF = 30, AFTER_PROMOTION = 25, DEMOTED_PERF = 40, ADOPT_PERF = 50, BOSS_LIKES = 40;
  const BREAK_BELOW = 45, BREAK_HOUR = 25, MEET_HOUR = 0.25, FRIENDS_HOUR = 3, CLASS_FRIENDS_HOUR = 2, BOSS_HOUR = 4, SUCK_UP_HOUR = 6, MATES_SEEN = 8;
  const HOMEWORK_PULL = 8, GRADE_START = 50, GRADE_HOUR = 1 / 6, HOMEWORK_GAIN = 3, HOMEWORK_MISS = 4, SCHOOL_DAY = 2, TRUANT = 8, EARLY_GRADE = 4, CLASS_HOMEWORK = 90, BULLY = 0.05, FRIEND_VISIT = 0.1, OFFERS = 5;
  const GRADES = [[80, 'Отлично'], [60, 'Хорошо'], [40, 'Удовлетворительно'], [20, 'Плохо'], [0, 'Совсем плохо']];

  const t = (m, f) => [m, f || m];
  const CAREER_ROWS = [
    ['business', 'Бизнес', 'office', 540, 1020, 15, 180, [['charisma', 3, 2], ['friends', 5, 4]], [t('Курьер'), t('Младший клерк'), t('Клерк'), t('Помощник менеджера', 'Помощница менеджера'), t('Менеджер'), t('Старший менеджер'), t('Руководитель отдела'), t('Директор по развитию'), t('Вице-президент'), t('Президент компании')]],
    ['crime', 'Преступный мир', 'plant', 1080, 1410, 14, 160, [['athletic', 3, 2]], [t('Мелкий хулиган', 'Мелкая хулиганка'), t('Карманник', 'Карманница'), t('Подручный', 'Подручная'), t('Взломщик', 'Взломщица'), t('Налётчик', 'Налётчица'), t('Правая рука')], 7, {
      villain: ['Злодей', [['logic', 7, 5]], [t('Злой гений'), t('Тёмный стратег'), t('Повелитель подвала', 'Повелительница подвала'), t('Король подполья', 'Королева подполья')]],
      thief: ['Вор', [['handiness', 7, 4]], [t('Вор-домушник', 'Воровка-домушница'), t('Мастер отмычек'), t('Похититель шедевров', 'Похитительница шедевров'), t('Неуловимая тень')]]
    }],
    ['culinary', 'Кулинария', 'bistro', 360, 840, 14, 150, [['cooking', 2, 1]], [t('Мойщик посуды', 'Мойщица посуды'), t('Помощник повара', 'Помощница повара'), t('Повар на раздаче'), t('Повар'), t('Повар горячего цеха'), t('Су-шеф'), t('Шеф-повар'), t('Шеф ресторана'), t('Ресторатор'), t('Звёздный шеф')]],
    ['journalism', 'Журналистика', 'office', 600, 1080, 15, 165, [['writing', 3, 2], ['charisma', 5, 4]], [t('Разносчик газет', 'Разносчица газет'), t('Корректор'), t('Младший репортёр'), t('Репортёр'), t('Колумнист'), t('Обозреватель'), t('Редактор отдела'), t('Ведущий новостей', 'Ведущая новостей'), t('Главный редактор'), t('Медиамагнат')]],
    ['police', 'Полиция', 'police', 480, 960, 16, 170, [['logic', 3, 2]], [t('Курсант', 'Курсантка'), t('Патрульный', 'Патрульная'), t('Участковый', 'Участковая'), t('Сержант'), t('Детектив')], 6, {
      operative: ['Оперативник', [['athletic', 6, 4]], [t('Оперативник', 'Оперативница'), t('Старший оперативник', 'Старшая оперативница'), t('Командир группы'), t('Начальник спецотдела', 'Начальница спецотдела'), t('Агент без лица')]],
      expert: ['Эксперт', [['painting', 6, 4]], [t('Лаборант', 'Лаборантка'), t('Криминалист', 'Криминалистка'), t('Старший эксперт'), t('Начальник экспертизы', 'Начальница экспертизы'), t('Глава криминалистики')]]
    }],
    ['medical', 'Медицина', 'hospital', 480, 1020, 18, 240, [['logic', 2, 1]], [t('Санитар', 'Санитарка'), t('Медбрат', 'Медсестра'), t('Фельдшер'), t('Интерн'), t('Ординатор'), t('Врач'), t('Старший врач'), t('Хирург'), t('Заведующий отделением', 'Заведующая отделением'), t('Главный врач')]],
    ['military', 'Армия', 'base', 420, 900, 18, 200, [['athletic', 3, 2], ['handiness', 5, 4]], [t('Рядовой', 'Рядовая'), t('Ефрейтор'), t('Сержант'), t('Лейтенант'), t('Капитан'), t('Майор'), t('Подполковник'), t('Полковник'), t('Генерал'), t('Космонавт')]],
    ['music', 'Музыка', 'theatre', 840, 1320, 13, 210, [['guitar', 2, 1]], [t('Билетёр', 'Билетёрша'), t('Рабочий сцены'), t('Аккомпаниатор'), t('Музыкант оркестра'), t('Солист', 'Солистка')], 6, {
      rock: ['Рок', [], [t('Гитарист группы', 'Гитаристка группы'), t('Лидер группы'), t('Звезда клубов'), t('Рок-идол'), t('Рок-легенда')]],
      symphony: ['Симфония', [['logic', 6, 4]], [t('Первая скрипка'), t('Концертмейстер'), t('Второй дирижёр'), t('Дирижёр'), t('Маэстро')]]
    }],
    ['politics', 'Политика', 'cityhall', 540, 1020, 15, 190, [['charisma', 2, 1], ['friends', 5, 4]], [t('Расклейщик листовок', 'Расклейщица листовок'), t('Помощник депутата', 'Помощница депутата'), t('Секретарь'), t('Советник', 'Советница'), t('Депутат городского совета'), t('Председатель комитета'), t('Глава администрации'), t('Вице-мэр'), t('Мэр'), t('Губернатор')]],
    ['sports', 'Спорт', 'stadium', 600, 1020, 16, 220, [['athletic', 2, 1]], [t('Подающий мячи', 'Подающая мячи'), t('Запасной игрок'), t('Игрок дубля'), t('Игрок основы'), t('Лидер атаки'), t('Капитан команды'), t('Звезда лиги'), t('Чемпион', 'Чемпионка'), t('Легенда стадиона'), t('Живая легенда')]],
    ['science', 'Наука', 'lab', 540, 1020, 18, 200, [['logic', 3, 2], ['gardening|handiness|fishing', 5, 4]], [t('Мойщик пробирок', 'Мойщица пробирок'), t('Лаборант', 'Лаборантка'), t('Младший научный сотрудник', 'Младшая научная сотрудница'), t('Научный сотрудник', 'Научная сотрудница'), t('Старший научный сотрудник', 'Старшая научная сотрудница'), t('Кандидат наук'), t('Руководитель группы'), t('Заведующий лабораторией', 'Заведующая лабораторией'), t('Безумный учёный', 'Безумная учёная'), t('Светило науки')]]
  ];
  const PART_ROWS = [
    ['books', 'Книжная лавка', 'books', 900, 1140, 10, 18, [t('Продавец книг', 'Продавщица книг'), t('Старший продавец', 'Старшая продавщица'), t('Управляющий лавкой', 'Управляющая лавкой')]],
    ['cashier', 'Магазин', 'shop', 900, 1140, 10, 18, [t('Кассир'), t('Старший кассир'), t('Администратор зала')]],
    ['spaDesk', 'Спа: стойка', 'spa', 900, 1140, 10, 19, [t('Администратор'), t('Старший администратор'), t('Управляющий спа', 'Управляющая спа')]],
    ['masseur', 'Спа: массаж', 'spa', 900, 1140, 12, 24, [t('Массажист', 'Массажистка'), t('Старший массажист', 'Старшая массажистка'), t('Мастер массажа')]],
    ['crypt', 'Склеп', 'crypt', 1200, 1430, 11, 20, [t('Смотритель склепа', 'Смотрительница склепа'), t('Хранитель ключей', 'Хранительница ключей'), t('Служитель склепа', 'Служительница склепа')]]
  ];
  const WORK_TONES = [
    ['normal', 'Работать как обычно', 'job', 'Обычный день: производительность растёт ровно.', 1],
    ['hard', 'Усердствовать', 'bolt', 'Производительность растёт быстрее, но сил и веселья уходит больше.', 1.5],
    ['friends', 'Дружить с коллегами', 'relations', 'Отношения с коллегами растут, работа идёт медленнее.', 0.5],
    ['suckUp', 'Подлизываться к начальству', 'heart', 'Начальство теплеет быстрее всего, работа идёт медленнее.', 0.5],
    ['boss', 'Говорить с начальником', 'talk', 'Отношения с начальником растут, работа идёт чуть медленнее.', 0.8],
    ['study', 'Изучать дело', 'book', 'Растёт навык, которого не хватает для повышения, а если хватает всех, то главный навык профессии. Работа идёт медленнее.', 0.6],
    ['relax', 'Расслабиться', 'sun', 'Веселье восстанавливается, производительность падает.', -0.5]
  ];
  const SCHOOL_TONES = [
    ['normal', 'Учиться как обычно', 'book', 'Обычный школьный день.', 1],
    ['hard', 'Стараться', 'bolt', 'Оценки растут быстрее, сил и веселья меньше.', 1.6],
    ['lazy', 'Лениться', 'sun', 'Веселье растёт, оценки падают.', -0.5],
    ['friends', 'Дружить', 'relations', 'Дружба с одноклассниками крепнет.', 0.6],
    ['chat', 'Болтать', 'talk', 'Общение растёт, оценки чуть ниже.', 0.4],
    ['homework', 'Доделывать уроки', 'scroll', 'Домашнее задание делается прямо на уроках, но медленно.', 0.6],
    ['sleep', 'Спать за партой', 'sleep', 'Силы возвращаются, оценки падают.', -0.6]
  ];
  const LOVE = {
    business: ['ambitious', 'charismatic', 'schmoozer'], crime: ['evil', 'kleptomaniac', 'meanSpirited'], culinary: ['naturalCook'], journalism: ['bookworm', 'charismatic'],
    police: ['brave', 'goodTrait'], medical: ['genius', 'goodTrait'], military: ['brave', 'athletic', 'daredevil'], music: ['virtuoso', 'artistic'],
    politics: ['charismatic', 'schmoozer', 'ambitious'], sports: ['athletic', 'daredevil'], science: ['genius', 'computerWhiz', 'greenThumb'],
    books: ['bookworm'], cashier: ['friendly'], spaDesk: ['friendly'], masseur: ['goodTrait'], crypt: ['loner']
  };
  const HATE = {
    business: ['loner', 'couchPotato'], crime: ['goodTrait'], culinary: ['vegetarian'], journalism: ['noHumor'], police: ['coward', 'kleptomaniac'], medical: ['coward'],
    military: ['coward', 'couchPotato'], music: ['noHumor'], politics: ['loner'], sports: ['couchPotato'], science: ['technophobe'], crypt: ['coward']
  };
  const TOWN_CAREERS = ['business', 'business', 'crime', 'culinary', 'journalism', 'police', 'medical', 'military', 'music', 'politics', 'sports', 'science', 'medical', 'culinary'];
  const DREAM_JOBS = {
    astronaut: ['military', null, 10], madScientist: ['science', null, 9], heistKing: ['crime', 'thief', 10], stadiumLegend: ['sports', null, 9], fearedChef: ['culinary', null, 10],
    bigBoss: ['business', null, 10], forensics: ['police', 'expert', 10], symphony: ['music', 'symphony', 10], faceless: ['police', 'operative', 10], mayor: ['politics', null, 10],
    stadiumRock: ['music', 'rock', 10], newsFace: ['journalism', null, 10], basementLord: ['crime', 'villain', 10], knifePulse: ['medical', null, 10]
  };
  const TRIED_ALL = [5, 4];

  S.CAREERS = {};
  for (const [id, name, lot, start, end, p1, p10, reqs, levels, branchAt, branches] of CAREER_ROWS) {
    const career = { id, name, lot, start, end, pay: [p1, p10], reqs, levels, branchAt: branchAt || 0, branches: {} };
    for (const [bid, [bname, breqs, blevels]] of Object.entries(branches || {})) career.branches[bid] = { id: bid, name: bname, reqs: breqs, levels: blevels };
    S.CAREERS[id] = career;
  }
  S.PART_TIME = {};
  for (const [id, name, lot, start, end, p1, p3, levels] of PART_ROWS) S.PART_TIME[id] = { id, name, lot, start, end, pay: [p1, p3], levels, part: true, reqs: [], branchAt: 0, branches: {} };
  S.WORK_TONES = {};
  WORK_TONES.forEach(([id, name, icon, text, rate], order) => { S.WORK_TONES[id] = { id, name, icon, text, rate, order }; });
  S.SCHOOL_TONES = {};
  SCHOOL_TONES.forEach(([id, name, icon, text, rate], order) => { S.SCHOOL_TONES[id] = { id, name, icon, text, rate, order }; });
  S.SCHOOL = { child: [540, 900], teen: [540, 840], lot: 'school' };

  S.ADS.homework = { id: 'homework', objs: ['desk', 'table'], name: 'Сделать уроки', icon: 'scroll', age: 'child', ageMax: 'teen', wants: { fun: 24 }, steps: [{ seat: 'chair', clip: 'read', standClip: 'readStand', mins: 45, homework: true }] };
  S.ADS.job_find = { id: 'job_find', obj: 'computer', name: 'Найти работу', icon: 'job', age: 'teen', player: true, steps: [{ pose: 'sit', clip: 'type', mins: 20, loop: 'keys', jobFind: true }] };
  S.ADS.job_home = { id: 'job_home', obj: 'computer', name: 'Поработать на дом', icon: 'job', age: 'teen', player: true, steps: [{ pose: 'sit', clip: 'type', mins: 60, loop: 'keys', gain: { fun: -6 }, homeShift: true }] };
  S.ADS.work_home.steps[0].homeShift = true;
  S.OBJECTS.desk.ads = (S.OBJECTS.desk.ads || []).concat(['homework']);
  S.OBJECTS.table.ads = (S.OBJECTS.table.ads || []).concat(['homework']);
  S.OBJECTS.computer.ads.splice(S.OBJECTS.computer.ads.indexOf('work_home'), 0, 'job_find', 'job_home');

  const weekday = world => (world.day - 1) % 7;
  const workdayOf = day => (day - 1) % 7 >= 1 && (day - 1) % 7 <= 5;
  const workday = world => workdayOf(world.day);
  const defOf = job => S.CAREERS[job.id] || S.PART_TIME[job.id];
  const top = def => (def.part ? 3 : 10);
  const lotById = (world, id) => world.lots.find(l => l.id === id) || null;
  const sexIndex = sim => (sim.sex === 'f' ? 1 : 0);
  const jobsOf = sim => [sim.job, sim.side].filter(Boolean);
  const isSchool = (sim, state) => !!state && state === sim.school;
  const shiftOf = (sim, state) => (isSchool(sim, state) ? S.SCHOOL[sim.age] || S.SCHOOL.teen : [defOf(state).start, defOf(state).end]);
  const placeOf = (world, sim, state) => lotById(world, isSchool(sim, state) ? S.SCHOOL.lot : defOf(state).lot);
  const clash = (a, b) => a.start < b.end + GAP && b.start < a.end + GAP;
  const owns = (sim, id) => !!(sim.rewards && sim.rewards.includes(id));
  const pickOf = (list, rng) => list[Math.floor(S.roll(rng) * list.length)];
  const grown = sim => sim.age === 'teen' || sim.age === 'adult' || sim.age === 'elder';
  const levelOf = (o, id) => (o.work && o.work.id === id ? o.work.level : (jobsOf(o).find(j => j.id === id) || { level: 0 }).level);

  const freshJob = (id, day, level, perf, branch) => ({ id, branch: branch || null, level, perf, day: -1, at: -1, worked: 0, late: false, tone: 'normal', misses: 0, lows: 0, hired: day, asked: -1, first: true, queued: -1 });

  const touch = (world, a, b, dv) => {
    const rel = S.Rel.make(world, a, b), band = S.Rel.band(rel.v);
    rel.f |= S.Rel.F.met;
    if (rel.met < 0) rel.met = world.day;
    rel.last = S.Social.now(world);
    rel.v = S.clamp(rel.v + dv, -100, 100);
    if (S.Rel.band(rel.v) !== band) rel.since = world.day;
    return rel;
  };

  const event = (world, sim, text, extra) => world.events.push(Object.assign({ type: 'job', sim: sim.id, text }, extra || {}));

  const bump = (sim, key) => {
    if (sim.wish) S.Wishes.bump(sim, key);
  };

  S.Jobs = {
    DAY, PERF_HOUR, BONUS_HOURS, PENSION, GRADES, LEAD_MIN, LEAD_MAX, MISS_FIRE, DREAM_JOBS, TRIED_ALL,
    workday, weekday, workdayOf, jobsOf,

    def: defOf,

    top: job => top(defOf(job)),

    branchOf(job) {
      const def = defOf(job);
      return def.branchAt && job.level >= def.branchAt && job.branch ? def.branches[job.branch] : null;
    },

    titleAt(def, level, branch, sex) {
      if (def.branchAt && level >= def.branchAt) {
        const b = def.branches[branch] || Object.values(def.branches)[0];
        return b.levels[level - def.branchAt][sex];
      }
      return def.levels[level - 1][sex];
    },

    title(sim, job) {
      const state = job || sim.job;
      return state ? S.Jobs.titleAt(defOf(state), state.level, state.branch, sexIndex(sim)) : '';
    },

    payAt(def, level) {
      const n = top(def), [a, b] = def.pay;
      return Math.round(a * Math.pow(b / a, (level - 1) / (n - 1)));
    },

    pay: job => S.Jobs.payAt(defOf(job), job.level),

    lot: (world, job) => lotById(world, defOf(job).lot),

    reqsFor(def, level, branch) {
      const out = [], list = def.reqs.concat(def.branchAt && level >= def.branchAt && def.branches[branch] ? def.branches[branch].reqs : []);
      for (const [key, from, offset] of list) if (level >= from) out.push([key, Math.min(10, level - offset)]);
      return out;
    },

    has(world, sim, key, need) {
      if (key === 'friends') return S.Rel && world.rels ? S.Rel.friends(world, sim) >= need : false;
      return key.split('|').some(id => S.Skills.level(sim, id) >= need);
    },

    missing(world, sim, job) {
      const state = job || sim.job;
      if (!state || state.level >= S.Jobs.top(state)) return [];
      return S.Jobs.reqsFor(defOf(state), state.level + 1, state.branch || (defOf(state).branchAt === state.level + 1 ? S.Jobs.pickBranch(world, sim, defOf(state)) : null)).filter(([key, need]) => !S.Jobs.has(world, sim, key, need));
    },

    reqName(key, need) {
      if (key === 'friends') return 'друзей: ' + need;
      return key.split('|').map(id => S.SKILLS[id].name.toLowerCase()).join(' или ') + ' ' + need;
    },

    canWork(sim, def) {
      if (def.part) return grown(sim) ? null : 'Подработка с подросткового возраста';
      return sim.age === 'adult' || sim.age === 'elder' ? null : 'Работа для взрослых. Подросткам подработка';
    },

    whyNot(sim, def) {
      return S.Jobs.canWork(sim, def) || (jobsOf(sim).some(j => j.id === def.id) ? 'Уже здесь работает' : null);
    },

    slotFor(sim, def) {
      if (!sim.job) return 'job';
      if (owns(sim, 'doubleShift') && !sim.side && sim.job.id !== def.id && !clash(def, defOf(sim.job))) return 'side';
      return 'job';
    },

    offerOption(world, sim, def) {
      const slot = S.Jobs.slotFor(sim, def), lot = lotById(world, def.lot);
      const note = slot === 'side' ? ' Вторая работа: часы не пересекаются.' : sim.job && sim.job.id !== def.id ? ' Заменит нынешнюю работу.' : '';
      return {
        label: def.name + ': ' + S.Jobs.titleAt(def, 1, null, sexIndex(sim)) + ', §' + S.Jobs.payAt(def, 1) + '/ч', job: def.id, closed: S.Jobs.whyNot(sim, def),
        tip: { title: def.name, text: S.Jobs.hoursText(def) + ', по будням. Место: ' + (lot ? lot.name : def.lot) + '. Начало с первой ступени.' + note }
      };
    },

    offersAt(world, sim, lot) {
      return Object.values(S.CAREERS).concat(Object.values(S.PART_TIME)).filter(def => def.lot === lot.id).map(def => S.Jobs.offerOption(world, sim, def));
    },

    hoursText: def => 'с ' + S.timeText(def.start) + ' до ' + S.timeText(def.end % DAY),

    dailyOffers(world, sim) {
      const pool = Object.values(S.CAREERS).concat(Object.values(S.PART_TIME)).filter(def => !S.Jobs.canWork(sim, def)), out = [];
      const rng = { rs: (world.day * 7919 + world.sims.indexOf(sim) * 104729) >>> 0 };
      while (pool.length && out.length < OFFERS) out.push(pool.splice(Math.floor(S.roll(rng) * pool.length), 1)[0]);
      return out;
    },

    lotMenu(world, sim, goal) {
      const lot = goal.enter, out = [];
      for (const state of [sim.job, sim.side, sim.school]) {
        if (!state || placeOf(world, sim, state) !== lot || !S.Jobs.onShift(world, sim, state)) continue;
        const school = isSchool(sim, state);
        out.push({ label: school ? 'Пойти в школу' : 'Пойти на работу', go: goal, work: true });
        if (S.Sim.wantsCar(world, sim, goal)) out.push({ label: school ? 'Поехать в школу' : 'Поехать на работу', go: goal, work: true, car: true, closed: sim.hasCar ? null : 'Машины водят взрослые' });
      }
      const offers = S.Jobs.offersAt(world, sim, lot).map(o => Object.assign(o, { go: goal }));
      if (offers.length) out.push({ label: 'Устроиться…', section: offers });
      return out;
    },

    computerMenu(world, sim, lot, item) {
      const out = [];
      if (!grown(sim)) return [{ label: 'Найти работу…', closed: 'Работа с подросткового возраста' }];
      out.push({ label: 'Найти работу…', section: S.Jobs.dailyOffers(world, sim).map(def => Object.assign(S.Jobs.offerOption(world, sim, def), { ad: 'job_find', lot, item })) });
      out.push({ label: S.ADS.job_home.name, ad: 'job_home', lot, item, closed: sim.job ? null : 'Сначала нужна работа' });
      return out;
    },

    join(world, sim, id, quiet) {
      const def = S.CAREERS[id] || S.PART_TIME[id];
      if (!def || S.Jobs.whyNot(sim, def)) return false;
      const slot = S.Jobs.slotFor(sim, def), was = sim.job, state = freshJob(id, world.day, 1, START_PERF);
      if (slot === 'side') sim.side = state;
      else {
        if (was) S.Jobs.stopShift(world, sim, was);
        if (was) sim.lastJob = was.id;
        sim.job = state;
        if (sim.side && clash(defOf(sim.side), def)) S.Jobs.quit(world, sim, sim.side);
      }
      if (S.Rel && world.rels && owns(sim, 'officeHero')) {
        for (const other of S.Jobs.coworkers(world, sim, state)) {
          const rel = touch(world, sim, other, 0);
          rel.v = Math.max(rel.v, 20);
        }
      }
      if (!quiet && S.News) S.News.add(world, sim.name + (sim.surname ? ' ' + sim.surname : '') + ' начинает работать: ' + S.Jobs.title(sim, state).toLowerCase() + ' (' + def.name + ').');
      if (!quiet) event(world, sim, sim.name + ': новая работа, ' + S.Jobs.title(sim, state).toLowerCase() + ' (' + def.name + '), §' + S.Jobs.pay(state) + '/ч, ' + S.Jobs.hoursText(def));
      bump(sim, 'job_' + id);
      if (def.part) bump(sim, 'partJob');
      if (was && slot === 'job') bump(sim, 'jobChange');
      return true;
    },

    adopt(world, sim) {
      const work = sim.work, def = work && defOf(work);
      sim.side = null;
      sim.school = null;
      sim.job = def && !S.Jobs.canWork(sim, def) ? Object.assign(freshJob(work.id, world.day, work.level, ADOPT_PERF, work.branch), { first: false }) : null;
    },

    release(world, sim) {
      sim.work = sim.job ? { id: sim.job.id, level: sim.job.level, branch: sim.job.branch } : null;
      sim.job = null;
      sim.side = null;
      sim.school = null;
    },

    stopShift(world, sim, state) {
      if (state.at < 0 || sim.inside !== placeOf(world, sim, state)) return;
      state.at = -1;
      state.day = world.day;
      S.Acts.add(world, sim, S.Jobs.goHome(world, sim, state), true);
    },

    quit(world, sim, job) {
      const state = job || sim.job;
      if (!state) return false;
      S.Jobs.stopShift(world, sim, state);
      if (state === sim.job) {
        sim.job = sim.side;
        sim.side = null;
      } else sim.side = null;
      sim.lastJob = state.id;
      event(world, sim, sim.name + ' уходит с работы: ' + defOf(state).name);
      return true;
    },

    retire(world, sim) {
      if (!sim.job || sim.age !== 'elder') return false;
      const def = defOf(sim.job);
      sim.pension = Math.round(S.Jobs.pay(sim.job) * ((def.end - def.start) / 60) * PENSION);
      for (const state of jobsOf(sim)) S.Jobs.stopShift(world, sim, state);
      sim.lastJob = sim.job.id;
      sim.job = null;
      sim.side = null;
      event(world, sim, sim.name + ' уходит на пенсию: §' + sim.pension + ' в день');
      return true;
    },

    coworkers(world, sim, job) {
      const state = job || sim.job || sim.side;
      if (!state) return [];
      return world.sims.filter(o => o !== sim && (world.family.includes(o) ? jobsOf(o).some(j => j.id === state.id) : !!o.work && o.work.id === state.id));
    },

    boss(world, sim, job) {
      const state = job || sim.job;
      if (!state) return null;
      let best = null, bestLevel = state.level;
      for (const o of S.Jobs.coworkers(world, sim, state)) {
        const level = levelOf(o, state.id);
        if (level > bestLevel) {
          best = o;
          bestLevel = level;
        }
      }
      return best;
    },

    classmates(world, sim) {
      return world.sims.filter(o => o !== sim && o.age === sim.age && o.inside && o.inside.id === S.SCHOOL.lot);
    },

    mates(world, sim, state) {
      return isSchool(sim, state) ? S.Jobs.classmates(world, sim) : S.Jobs.coworkers(world, sim, state).filter(o => o.inside && o.inside === sim.inside);
    },

    shiftOf,
    placeOf,

    onShift(world, sim, state) {
      return !!state && workday(world) && world.clock < shiftOf(sim, state)[1] && state.day !== world.day;
    },

    stateAt(world, sim) {
      if (!sim.inside) return null;
      for (const state of [sim.job, sim.side, sim.school]) {
        if (state && state.at >= 0 && state.day !== world.day && placeOf(world, sim, state) === sim.inside) return state;
      }
      return null;
    },

    atWork: (world, sim) => !!S.Jobs.stateAt(world, sim),

    busyInside(world, sim) {
      if (!sim.inside) return false;
      if (S.Jobs.stateAt(world, sim)) return true;
      return workday(world) && [sim.job, sim.side, sim.school].some(state => {
        if (!state || state.day === world.day || placeOf(world, sim, state) !== sim.inside) return false;
        const [start, end] = shiftOf(sim, state);
        return world.clock >= start - LEAD_MAX && world.clock < end;
      });
    },

    rideOf: (sim, state) => (isSchool(sim, state) ? 'bus' : 'carpool'),

    leadFor(world, sim, lot) {
      const dist = Math.hypot(lot.doorOut[0] - sim.x, lot.doorOut[1] - sim.z);
      return S.clamp(LEAD_BASE + dist * ROAD_FACTOR / S.METRICS.car, LEAD_MIN, LEAD_MAX);
    },

    wakeAt(world, sim) {
      if (!workday(world)) return null;
      let best = null;
      for (const state of [sim.job, sim.side, sim.school]) {
        const lot = state && state.day !== world.day ? placeOf(world, sim, state) : null;
        if (!lot) continue;
        const at = shiftOf(sim, state)[0] - S.Jobs.leadFor(world, sim, lot) - WAKE_BEFORE;
        if (best === null || at < best) best = at;
      }
      return best;
    },

    commute(world, sim, state) {
      const lot = placeOf(world, sim, state), act = S.Acts.goAct({ x: lot.doorOut[0], z: lot.doorOut[1], floor: 0, lot, enter: lot }, true);
      act.go.ride = S.Jobs.rideOf(sim, state);
      act.work = true;
      return act;
    },

    goHome(world, sim, state) {
      const home = sim.home, act = S.Acts.goAct({ x: home.doorOut[0], z: home.doorOut[1], floor: 0, lot: home }, true);
      act.go.ride = S.Jobs.rideOf(sim, state);
      act.home = true;
      return act;
    },

    step(world, dt) {
      for (const sim of world.family) {
        if (!sim.needs) continue;
        const pupil = sim.age === 'child' || sim.age === 'teen';
        if (pupil && !sim.school) sim.school = S.Jobs.freshSchool();
        if (!pupil && sim.school) sim.school = null;
        for (const state of [sim.job, sim.side, sim.school]) if (state) S.Jobs.stepShift(world, sim, state, dt);
        if (sim.pension && world.clock < dt) S.Econ.earn(world, sim.pension, sim.name + ': пенсия +§' + sim.pension, sim);
      }
    },

    stepShift(world, sim, state, dt) {
      const lot = placeOf(world, sim, state);
      if (!lot || !workday(world) || state.day === world.day) return;
      const [start, end] = shiftOf(sim, state), minute = world.clock, here = sim.inside === lot;
      if (!here && state.at < 0 && state.queued !== world.day && minute >= start - S.Jobs.leadFor(world, sim, lot) && minute < start + GIVE_UP) {
        state.queued = world.day;
        if (S.Acts.list(sim).some(a => a.work)) return;
        sim.queue.length = 0;
        S.Acts.add(world, sim, S.Jobs.commute(world, sim, state), true);
        event(world, sim, (isSchool(sim, state) ? 'Школьный автобус ждёт: ' : 'Развозка ждёт: ') + sim.name, { ride: true });
        return;
      }
      if (here && minute >= start - LEAD_MAX && minute < end) {
        if (state.at < 0) S.Jobs.arrive(world, sim, state, minute);
        if (minute >= start) S.Jobs.workTick(world, sim, state, dt);
        return;
      }
      if (state.at >= 0 && !here) {
        S.Jobs.endShift(world, sim, state, true);
        return;
      }
      if (minute >= end) {
        if (state.at >= 0) S.Jobs.endShift(world, sim, state, false);
        else S.Jobs.missed(world, sim, state);
      }
    },

    arrive(world, sim, state, minute) {
      const [start] = shiftOf(sim, state), school = isSchool(sim, state);
      state.at = minute;
      state.worked = 0;
      state.late = minute > start + LATE_SLACK;
      if (school) {
        if (state.late) state.grade = Math.max(0, state.grade - LATE_PERF);
        else bump(sim, 'onTime');
      } else {
        if (state.first) {
          state.first = false;
          S.Moods.add(sim, 'firstDay', 0, world);
        }
        if (state.late) {
          state.perf = Math.max(0, state.perf - LATE_PERF);
          S.Moods.add(sim, 'late', 0, world);
        }
        if (start < 7 * 60) S.Moods.add(sim, 'earlyStart', 0, world);
      }
      if (S.Rel && world.rels) for (const o of S.Jobs.mates(world, sim, state).slice(0, MATES_SEEN)) touch(world, sim, o, 0);
      if (!school && S.Opps) S.Opps.workOffer(world, sim);
      event(world, sim, sim.name + (school ? ' в школе' : ' на работе') + (state.late ? ', с опозданием' : ''), { quiet: true });
    },

    workTick(world, sim, state, dt) {
      const school = isSchool(sim, state), tones = school ? S.SCHOOL_TONES : S.WORK_TONES, tone = tones[state.tone] || tones.normal;
      const mood = S.Moods.mood(sim), needs = sim.needs, hours = dt / 60;
      const base = mood < -50 ? -0.5 : mood < 0 ? 0.5 : mood >= 50 ? 1.25 : 1;
      let rate = tone.rate < 0 || base < 0 ? PERF_HOUR * Math.min(tone.rate, base) : PERF_HOUR * tone.rate * base;
      state.worked += dt;
      if (school) {
        state.grade = S.clamp(state.grade + rate * hours * GRADE_HOUR, 0, 100);
        if (tone.id === 'homework' && state.homeworkDue && !state.homework) {
          state.hwDone += dt;
          if (state.hwDone >= CLASS_HOMEWORK) S.Jobs.homeworkDone(world, sim);
        }
      } else {
        if (tone.id === 'relax' && owns(sim, 'confidentSlacker')) rate = Math.max(rate, 0);
        else if (rate > 0) rate *= (S.Traits.has(sim, 'ambitious') ? 1.2 : 1) * (S.Traits.has(sim, 'workaholic') ? 1.15 : 1);
        const [start, end] = shiftOf(sim, state);
        state.perf = S.clamp(state.perf + rate * hours * PERF_SHIFT / (end - start), 0, 100);
        const skill = tone.id === 'study' ? S.Jobs.studySkill(world, sim, state) : null;
        if (skill) S.Skills.practice(world, sim, skill, STUDY_RATE, dt);
      }
      if (needs.bladder < BREAK_BELOW) needs.bladder = S.clamp(needs.bladder + BREAK_HOUR * hours, 0, 100);
      if (needs.hunger < BREAK_BELOW) needs.hunger = S.clamp(needs.hunger + BREAK_HOUR * hours, 0, 100);
      if (tone.id === 'hard') {
        needs.energy = S.clamp(needs.energy - 4 * hours, 0, 100);
        needs.fun = S.clamp(needs.fun - 4 * hours, 0, 100);
      } else if (tone.id === 'relax' || tone.id === 'lazy') needs.fun = S.clamp(needs.fun + 6 * hours, 0, 100);
      else if (tone.id === 'sleep') needs.energy = S.clamp(needs.energy + 8 * hours, 0, 100);
      else if (tone.id === 'chat' || tone.id === 'friends') needs.social = S.clamp(needs.social + 5 * hours, 0, 100);
      else needs.social = S.clamp(needs.social + (school ? 2 : 1) * hours, 0, 100);
      if (!S.Rel || !world.rels) return;
      const k = (tone.id === 'friends' || tone.id === 'chat' ? (school ? CLASS_FRIENDS_HOUR : FRIENDS_HOUR) : MEET_HOUR) * hours;
      for (const o of S.Jobs.mates(world, sim, state).slice(0, MATES_SEEN)) touch(world, sim, o, k);
      if (!school && (tone.id === 'suckUp' || tone.id === 'boss')) {
        const boss = S.Jobs.boss(world, sim, state);
        if (boss && boss.inside === sim.inside) touch(world, sim, boss, (tone.id === 'suckUp' ? SUCK_UP_HOUR : BOSS_HOUR) * hours * (S.Traits.has(sim, 'schmoozer') ? 1.5 : 1));
      }
    },

    endShift(world, sim, state, early) {
      if (isSchool(sim, state)) {
        S.Jobs.endSchool(world, sim, state, early);
        return;
      }
      const job = state, def = defOf(job), [start, end] = shiftOf(sim, job), hours = job.worked / 60;
      job.day = world.day;
      job.at = -1;
      job.misses = 0;
      if (early) job.perf = Math.max(0, job.perf - EARLY_PERF);
      const wage = Math.round(S.Jobs.pay(job) * Math.min(hours, (end - start) / 60));
      if (wage > 0) S.Econ.earn(world, wage, sim.name + ': зарплата +§' + wage + (early ? ', смена не доработана' : ''), sim);
      if (sim.skill) S.Skills.stat(world, sim, 'workDays', 1);
      bump(sim, 'payday');
      bump(sim, 'pay_' + job.id);
      const boss = S.Rel && world.rels ? S.Jobs.boss(world, sim, job) : null;
      if (boss && S.Rel.value(world, sim, boss) >= BOSS_LIKES) bump(sim, 'bossLiked');
      const topLevel = job.level >= S.Jobs.top(job), lack = S.Jobs.missing(world, sim, job);
      if (job.perf >= 100 && topLevel) S.Jobs.topRaise(world, sim, job);
      else if (job.perf >= 100 && !lack.length) S.Jobs.promote(world, sim, true, job);
      else if (job.perf >= 100) event(world, sim, 'Для повышения не хватает: ' + lack.map(([key, need]) => S.Jobs.reqName(key, need)).join(', ') + ' (' + sim.name + ')');
      else if (job.perf <= 5) {
        job.lows++;
        if (job.lows >= LOW_DAYS) S.Jobs.demote(world, sim, job);
        else S.Moods.add(sim, 'hardWorkday', 0, world);
      } else {
        job.lows = 0;
        if (job.perf >= 75) S.Moods.add(sim, 'goodWorkday', 0, world);
      }
      if (def.end >= 23 * 60) S.Moods.add(sim, 'sleeplessNight', 0, world);
      if (!early && sim.inside) S.Acts.add(world, sim, S.Jobs.goHome(world, sim, job), true);
    },

    endSchool(world, sim, state, early) {
      state.day = world.day;
      state.at = -1;
      state.misses = 0;
      state.grade = S.clamp(state.grade + SCHOOL_DAY - (state.homeworkDue && !state.homework ? HOMEWORK_MISS : 0) + (state.homework ? HOMEWORK_GAIN : 0) - (early ? EARLY_GRADE : 0), 0, 100);
      state.homework = false;
      state.homeworkDue = true;
      state.hwDone = 0;
      if (S.Rel && world.rels) {
        const friends = S.Jobs.classmates(world, sim).filter(o => S.Rel.value(world, sim, o) >= S.Rel.FRIEND).length;
        if (friends >= 2) S.Moods.add(sim, 'schoolFriends', 0, world);
        else if (S.roll(world.rng) < BULLY) S.Moods.add(sim, 'bullied', 0, world);
      }
      if (weekday(world) === 5) S.Jobs.report(world, sim);
      event(world, sim, sim.name + ': уроки кончились', { quiet: true });
      if (!early && sim.inside) S.Acts.add(world, sim, S.Jobs.goHome(world, sim, state), true);
      S.Jobs.maybeFriend(world, sim);
    },

    missed(world, sim, state) {
      state.day = world.day;
      state.misses++;
      if (isSchool(sim, state)) {
        state.grade = Math.max(0, state.grade - TRUANT);
        S.Moods.add(sim, 'truant', 0, world);
        event(world, sim, 'Прогул школы: ' + sim.name);
        return;
      }
      const vacation = owns(sim, 'guiltFreeVacation');
      if (!vacation) state.perf = Math.max(0, state.perf - MISS_PERF);
      event(world, sim, 'Пропущен рабочий день: ' + sim.name + ' (' + defOf(state).name + ')' + (vacation ? ', без последствий' : ''));
      if (state.misses >= MISS_FIRE && !vacation) S.Jobs.fire(world, sim, state);
    },

    promote(world, sim, earned, job) {
      const state = job || sim.job, def = defOf(state);
      state.level++;
      if (def.branchAt && state.level === def.branchAt && !state.branch) state.branch = S.Jobs.pickBranch(world, sim, def);
      state.perf = AFTER_PROMOTION;
      state.lows = 0;
      const bonus = earned ? S.Jobs.pay(state) * BONUS_HOURS : 0;
      S.Moods.add(sim, 'promoted', 0, world);
      if (bonus) S.Econ.earn(world, bonus, sim.name + ': премия за повышение +§' + bonus, sim);
      event(world, sim, sim.name + ': повышение! Теперь ' + S.Jobs.title(sim, state).toLowerCase() + ', §' + S.Jobs.pay(state) + '/ч', { promoted: true });
      if (S.News) S.News.add(world, sim.name + (sim.surname ? ' ' + sim.surname : '') + ' получает повышение: ' + S.Jobs.title(sim, state).toLowerCase() + ' (' + def.name + ').');
      bump(sim, 'promotion');
      bump(sim, 'up_' + state.id);
      const stats = sim.skill ? sim.skill.stats : null;
      if (stats) {
        const tops = stats.tops || (stats.tops = {});
        if (state.branch && def.branchAt && state.level >= def.branchAt) tops[state.id + ':' + state.branch] = Math.max(tops[state.id + ':' + state.branch] || 0, state.level);
        tops[state.id] = Math.max(tops[state.id] || 0, state.level);
        S.Skills.setStat(world, sim, 'careerTop', Math.max(stats.careerTop || 0, state.level));
      }
      if (S.Wishes) S.Wishes.checkDream(world, sim);
    },

    studySkill(world, sim, state) {
      const lack = S.Jobs.missing(world, sim, state).find(([key]) => key !== 'friends'), main = defOf(state).reqs.find(([key]) => key !== 'friends');
      const key = lack ? lack[0] : main ? main[0] : null;
      if (!key) return null;
      return key.split('|').filter(id => S.SKILLS[id]).sort((a, b) => S.Skills.level(sim, b) - S.Skills.level(sim, a))[0] || null;
    },

    topRaise(world, sim, job) {
      const bonus = S.Jobs.pay(job) * TOP_BONUS_HOURS;
      job.perf = TOP_PERF;
      job.lows = 0;
      S.Moods.add(sim, 'raise', 0, world);
      S.Econ.earn(world, bonus, sim.name + ': надбавка за отличную работу +§' + bonus, sim);
    },

    pickBranch(world, sim, def) {
      let best = null, bestScore = -1;
      for (const id of Object.keys(def.branches)) {
        const reqs = def.branches[id].reqs;
        const score = reqs.length ? reqs.reduce((s, [key]) => s + (key === 'friends' ? 0 : S.Skills.level(sim, key.split('|')[0])), 0) : 3;
        if (score > bestScore) {
          best = id;
          bestScore = score;
        }
      }
      return best;
    },

    setBranch(sim, branch, job) {
      const state = job || sim.job, def = state && defOf(state);
      if (!def || !def.branches[branch] || state.level >= def.branchAt) return false;
      state.branch = branch;
      return true;
    },

    demote(world, sim, job) {
      const state = job || sim.job;
      state.lows = 0;
      if (state.level <= 1) {
        S.Jobs.fire(world, sim, state);
        return;
      }
      state.level--;
      state.perf = DEMOTED_PERF;
      S.Moods.add(sim, 'demoted', 0, world);
      event(world, sim, sim.name + ': понижение, теперь ' + S.Jobs.title(sim, state).toLowerCase());
    },

    fire(world, sim, job) {
      const state = job || sim.job, def = defOf(state);
      S.Jobs.stopShift(world, sim, state);
      if (state === sim.job) {
        sim.job = sim.side;
        sim.side = null;
      } else sim.side = null;
      sim.lastJob = state.id;
      S.Moods.add(sim, 'fired', 0, world);
      event(world, sim, 'Увольнение: ' + sim.name + ' (' + def.name + ')');
    },

    askRaise(world, sim, job) {
      const state = job || sim.job;
      if (!state || state.asked === world.day || state.level >= S.Jobs.top(state)) return false;
      state.asked = world.day;
      const boss = S.Jobs.boss(world, sim, state), rel = boss && S.Rel && world.rels ? S.Rel.value(world, sim, boss) : 0;
      const chance = (state.perf - ASK_FLOOR) / 60 + rel / 200 + (S.Traits.has(sim, 'schmoozer') ? 0.15 : 0);
      if (state.perf >= ASK_FLOOR && !S.Jobs.missing(world, sim, state).length && S.roll(world.rng) < chance) {
        S.Jobs.promote(world, sim, false, state);
        return true;
      }
      state.perf = Math.max(0, state.perf - ASK_FAIL);
      event(world, sim, 'Начальство говорит «не сейчас». Производительность −' + ASK_FAIL + ' (' + sim.name + ')');
      return false;
    },

    freshSchool: () => ({ grade: GRADE_START, homework: false, homeworkDue: false, hwDone: 0, day: -1, at: -1, worked: 0, late: false, tone: 'normal', misses: 0, queued: -1 }),

    gradeName(grade) {
      return GRADES.find(([from]) => grade >= from)[1];
    },

    report(world, sim) {
      const grade = sim.school.grade;
      if (grade >= 60) S.Moods.add(sim, 'goodGrades', 0, world);
      else if (grade < 40) S.Moods.add(sim, 'badGrades', 0, world);
      event(world, sim, sim.name + ': табель за неделю, «' + S.Jobs.gradeName(grade).toLowerCase() + '»');
    },

    homeworkDone(world, sim) {
      const school = sim.school;
      if (!school || school.homework || !school.homeworkDue) return false;
      school.homework = true;
      school.hwDone = 0;
      S.Moods.remove(sim, 'homework');
      if (sim.held) sim.held = sim.held.filter(id => id !== 'homework');
      if (sim.skill) S.Skills.stat(world, sim, 'homeworks', 1);
      bump(sim, 'homework');
      event(world, sim, sim.name + ': уроки сделаны', { quiet: true });
      return true;
    },

    homeworkMins(world, sim) {
      const helper = world.family.find(o => o !== sim && o.act && o.act.ad === 'homework' && o.act.phase === 'run' && Math.hypot(o.x - sim.x, o.z - sim.z) < 4);
      return helper ? 0.66 : 1;
    },

    homeShift(world, sim) {
      if (!sim.job) return;
      sim.job.perf = Math.min(100, sim.job.perf + HOME_PERF);
      if (!workday(world)) bump(sim, 'weekendWork');
    },

    maybeFriend(world, sim) {
      if (!S.Social || !world.rels || S.roll(world.rng) >= FRIEND_VISIT) return;
      const mate = S.Jobs.classmates(world, sim).find(o => o.free && !o.visit && S.Rel.value(world, sim, o) >= S.Rel.FRIEND);
      if (!mate) return;
      S.Social.invite(world, sim, mate, 'guest', 60, 180);
      world.events.push({ type: 'visit', sim: sim.id, text: 'После школы в гости придёт ' + (mate.sex === 'f' ? 'одноклассница ' : 'одноклассник ') + mate.name });
    },

    factor(world, sim, ad) {
      if (ad.id !== 'homework') return 1;
      return sim.school && sim.school.homeworkDue && !sim.school.homework ? 3 : 0;
    },

    duty(world, sim, ad) {
      return ad.id === 'homework' && sim.school && sim.school.homeworkDue && !sim.school.homework ? HOMEWORK_PULL : 0;
    },

    heldMoods(world, sim) {
      const out = [];
      if (sim.school && sim.school.homeworkDue && !sim.school.homework) out.push('homework');
      if (sim.job) {
        const love = LOVE[sim.job.id] || [], hate = HATE[sim.job.id] || [];
        if (S.Traits.has(sim, 'workaholic') || love.some(id => S.Traits.has(sim, id))) out.push('loveJob');
        else if (hate.some(id => S.Traits.has(sim, id))) out.push('wrongJob');
      }
      const state = S.Jobs.stateAt(world, sim);
      if (state && !isSchool(sim, state) && state.tone === 'hard' && sim.needs.energy < 30) out.push('overworked');
      return out;
    },

    status(world, sim) {
      const state = S.Jobs.stateAt(world, sim);
      if (!state) return null;
      const school = isSchool(sim, state), left = Math.max(0, shiftOf(sim, state)[1] - world.clock);
      const inside = world.sims.filter(o => o !== sim && o.inside === sim.inside && S.Rel && world.rels && S.Rel.get(world, sim, o) && (S.Rel.get(world, sim, o).f & S.Rel.F.met));
      return { state, school, place: sim.inside, left, tone: state.tone, tones: school ? S.SCHOOL_TONES : S.WORK_TONES, inside, text: sim.name + (school ? ' учится' : ' работает') + ', ещё ' + S.Moods.timeText(Math.ceil(left)) };
    },

    setTone(world, sim, tone) {
      const state = S.Jobs.stateAt(world, sim) || sim.job || sim.school, tones = isSchool(sim, state) ? S.SCHOOL_TONES : S.WORK_TONES;
      if (!state || !tones[tone]) return false;
      state.tone = tone;
      return true;
    },

    leaveEarly(world, sim) {
      const state = S.Jobs.stateAt(world, sim);
      if (!state) return false;
      S.Acts.dropCurrent(world, sim);
      sim.queue.length = 0;
      S.Acts.add(world, sim, S.Jobs.goHome(world, sim, state), true);
      return true;
    },

    describe(world, sim) {
      if (sim.job) return 'Работает: ' + S.Jobs.title(sim).toLowerCase() + ', ' + S.Jobs.lot(world, sim.job).name;
      if (sim.work) return 'Работает: ' + S.Jobs.titleAt(defOf(sim.work), sim.work.level, sim.work.branch, sexIndex(sim)).toLowerCase() + ', ' + S.Jobs.lot(world, sim.work).name;
      if (sim.school || sim.age === 'child' || sim.age === 'teen') return 'Учится в школе';
      if (sim.pension) return 'На пенсии';
      return '';
    },

    trainerFor(world, sim, key) {
      const skills = key.split('|'), lot = sim.home;
      for (const item of lot.house.items) {
        const object = S.objectOf(item);
        if (!object) continue;
        for (const ad of object.ads) {
          const source = S.Skills.SOURCES[ad];
          if (source && skills.includes(source[0]) && S.adAllowed(S.ADS[ad], sim.age, sim)) return { lot, item, skill: source[0], ad };
        }
      }
      return null;
    },

    dreamLevel(sim, career, branch) {
      const hist = sim.skill && sim.skill.stats.tops ? sim.skill.stats.tops : {};
      return hist[career + (branch ? ':' + branch : '')] || 0;
    },

    careersAt(sim, level) {
      const hist = sim.skill && sim.skill.stats.tops ? sim.skill.stats.tops : {};
      return Object.keys(hist).filter(key => !key.includes(':') && S.CAREERS[key] && hist[key] >= level).length;
    },

    dreamProgress(world, sim, dream) {
      if (dream.id === 'triedAll') return [Math.min(TRIED_ALL[1], S.Jobs.careersAt(sim, TRIED_ALL[0])), TRIED_ALL[1]];
      const goal = DREAM_JOBS[dream.id];
      if (!goal) return null;
      return [Math.min(goal[2], S.Jobs.dreamLevel(sim, goal[0], goal[1])), goal[2]];
    },

    wishFits(world, sim, work) {
      const [mode, career, below, from] = work, jobs = jobsOf(sim), mine = career ? jobs.find(j => j.id === career) : null;
      if (mode === 'seek') return !mine && !S.Jobs.canWork(sim, S.CAREERS[career]);
      if (mode === 'fresh') return !!mine && mine.first;
      if (mode === 'up') return !!mine && mine.level < S.Jobs.top(mine);
      if (mode === 'below') return !!mine && mine.level < below && mine.level >= (from || 1);
      if (mode === 'any') return jobs.length > 0;
      if (mode === 'anyUp') return jobs.some(j => j.level < S.Jobs.top(j));
      if (mode === 'boss') return !!(sim.job && S.Jobs.boss(world, sim, sim.job));
      if (mode === 'home') return jobs.length > 0 && sim.home.house.items.some(item => S.objectOf(item) && S.objectOf(item).ads.includes('job_home'));
      if (mode === 'part') return !sim.job && grown(sim);
      if (mode === 'school') return !!sim.school;
      if (mode === 'homework') return !!(sim.school && sim.school.homeworkDue && !sim.school.homework);
      if (mode === 'grade') return !!(sim.school && sim.school.grade < 80);
      return false;
    },

    assignTown(world, sim, rng) {
      if (sim.age === 'adult') {
        const sketch = sim.day;
        if (!sketch || !sketch[1] || !sketch[1][1] || sketch[1][1].kind !== 'work') return null;
        const id = TOWN_CAREERS[Math.floor(S.roll(rng) * TOWN_CAREERS.length)], def = S.CAREERS[id];
        const level = Math.min(10, 1 + Math.floor(Math.pow(S.roll(rng), 1.6) * 10));
        const ids = Object.keys(def.branches), branch = ids.length ? ids[Math.floor(S.roll(rng) * ids.length)] : null;
        return { id, level, branch };
      }
      if (sim.age === 'teen' && S.roll(rng) < 0.3) {
        const parts = Object.keys(S.PART_TIME);
        return { id: parts[Math.floor(S.roll(rng) * parts.length)], level: 1 + Math.floor(S.roll(rng) * 3), branch: null };
      }
      return null;
    },

    townPlans(world, sim, rng) {
      const home = sim.home, sketch = sim.day, work = sim.work, jitter = () => Math.floor(S.roll(rng) * 45);
      if (sim.age === 'toddler') return { week: sketch, rest: sketch };
      const shops = world.lots.filter(l => l.kind === 'shop'), parks = world.lots.filter(l => l.kind === 'park');
      const free = () => (S.roll(rng) < 0.5 ? pickOf(parks, rng) : pickOf(shops, rng));
      const rest = [[0, home], [660 + jitter(), free()], [840 + jitter(), home], [1020 + jitter(), free()], [1200 + jitter(), home]];
      if (!work) return { week: sketch, rest };
      const def = defOf(work), lot = lotById(world, def.lot), off = Math.min(DAY - 1, def.end + 5);
      if (def.part) {
        const school = sketch[1], out = (S.SCHOOL[sim.age] || S.SCHOOL.teen)[1];
        const week = def.start - 30 - out < GAP ? [[0, home], school, [def.start - 30, lot], [off, home]] : [[0, home], school, sketch[2], sketch[3], [def.start - 30, lot], [off, home]];
        return { week, rest };
      }
      const early = sketch[1][0] - 480, after = sketch[2][1], leave = Math.max(1, def.start - 60 + early), back = Math.min(DAY - 1, def.end + Math.floor(early / 3));
      const week = [[0, home], [leave, lot], [back, back < 20 * 60 ? after : home]];
      if (back < 20 * 60 && after !== home) week.push([Math.max(back + 90, 19 * 60) + early, home]);
      return { week, rest };
    },

    pack(sim) {
      const job = j => j && [j.id, j.branch, j.level, j.perf, j.day, j.at, j.worked, j.late ? 1 : 0, j.tone, j.misses, j.lows, j.hired, j.asked, j.first ? 1 : 0, j.queued];
      const s = sim.school;
      return [job(sim.job), s && [s.grade, s.homework ? 1 : 0, s.homeworkDue ? 1 : 0, s.hwDone, s.day, s.at, s.worked, s.late ? 1 : 0, s.tone, s.misses, s.queued], sim.pension || 0, sim.lastJob || null, job(sim.side), sim.work ? [sim.work.id, sim.work.level, sim.work.branch] : null];
    },

    unpack(r) {
      if (r === null || r === undefined) return null;
      if (!Array.isArray(r) || r.length !== 6) throw new Error('повреждена работа жителя');
      const [j, s, pension, last, side, work] = r;
      const job = a => {
        if (!a) return null;
        if (!Array.isArray(a) || a.length !== 15 || !(S.CAREERS[a[0]] || S.PART_TIME[a[0]]) || !(a[2] >= 1 && a[2] <= top(defOf({ id: a[0] }))) || !Number.isFinite(a[3])) throw new Error('неизвестная работа в файле');
        if (a[1] !== null && !defOf({ id: a[0] }).branches[a[1]]) throw new Error('неизвестная ветвь карьеры в файле');
        return { id: a[0], branch: a[1], level: a[2], perf: a[3], day: a[4], at: a[5], worked: a[6], late: !!a[7], tone: a[8], misses: a[9], lows: a[10], hired: a[11], asked: a[12], first: !!a[13], queued: a[14] };
      };
      const out = { job: job(j), side: job(side), school: null, pension: Number.isFinite(pension) ? pension : 0, lastJob: typeof last === 'string' ? last : null, work: null };
      if (s) {
        if (!Array.isArray(s) || s.length !== 11 || !Number.isFinite(s[0])) throw new Error('повреждена школа в файле');
        out.school = { grade: s[0], homework: !!s[1], homeworkDue: !!s[2], hwDone: s[3], day: s[4], at: s[5], worked: s[6], late: !!s[7], tone: s[8], misses: s[9], queued: s[10] };
      }
      if (work) {
        if (!Array.isArray(work) || work.length !== 3 || !(S.CAREERS[work[0]] || S.PART_TIME[work[0]])) throw new Error('неизвестная работа горожанина в файле');
        out.work = { id: work[0], level: work[1], branch: work[2] };
      }
      return out;
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
