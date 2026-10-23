(function (H) {
  'use strict';

  const TYPES = {
    trail: { name: 'Миссии Освоения', tab: 'Освоение', one: 'Миссия Освоения', col: '#f2c040', dim: '#7a5a18', icon: 'mtrail', map: 'questTrail' },
    comp: { name: 'Миссии компаньона', tab: 'Компаньоны', one: 'Миссия компаньона', col: '#c890ff', dim: '#5a2e8a', icon: 'mcomp', map: 'quest' },
    adv: { name: 'Миссии приключения', tab: 'Приключения', one: 'Миссия приключения', col: '#60c8f0', dim: '#1e5a78', icon: 'madv', map: 'questAdv' }
  };
  const TYPE_ORDER = ['trail', 'comp', 'adv'];

  const CHAPTERS = {
    prologue: { type: 'trail', label: 'Пролог: Космическая станция «Герта»', name: 'Ещё вчера сегодня было завтра' },
    winter: { type: 'trail', label: 'Акт I: Ярило-VI', name: 'В иссушающую зимнюю ночь' },
    dawn: { type: 'trail', label: 'Акт I: Ярило-VI', name: 'Под палящим рассветным солнцем' },
    awake: { type: 'trail', label: 'Продолжение Освоения: Ярило-VI', name: 'Пробуждение от зимнего сна' },
    furnace: { type: 'comp', label: 'Компаньон: Хук', name: 'Обрывки жизней пред горнилом' }
  };

  const M = (id, ch, name, done, area, face, desc, reward) => ({ id, ch, name, done, area, face, desc, reward });
  const TRAIL = [
    M('tb_chaos', 'prologue', 'Хаос глубин', 'chaos', 'hs_base', 'kafka',
      'Легион Антиматерии штурмует станцию «Герта». Посреди хаоса женщина в тёмных очках спокойно идёт к хранилищу, где запечатан Стелларон.',
      { credits: 1500, items: { exp1: 1 } }),
    M('tb_storm', 'prologue', 'Эпицентр бури', 'storm', 'hs_storage', 'march',
      'Ты приходишь в себя в Галерее теней, а в голове звучит чужой голос: «Выбирай то, о чём не пожалеешь». Март и Дань Хэн с Экспресса ведут тебя к лифту, но Зона хранения отрезана от Главной контрольной зоны.',
      { jade: 40, credits: 1500 }),
    M('tb_moment', 'prologue', 'Момент вселенского спокойствия', 'moment', 'hs_control', 'asta',
      'Аста держит оборону у главного пульта и ждёт новых волн Легиона. Исследователи напуганы, а Герта не отвечает на письма.',
      { jade: 40, credits: 1500, items: { exp1: 2 } }),
    M('tb_shadows', 'prologue', 'Неисчезающие тени', 'express_intro', 'hs_supply', 'himeko',
      'Щит Зоны поддержки слабеет, и к перрону ломится что-то огромное. Экспресс должен забрать команду, но до перрона ещё надо добраться.',
      { jade: 40, credits: 4000, items: { exp1: 2 } }),
    M('tb_icy', 'winter', 'Оледенительное приключение', 'jarilo_arrive', 'express', 'pompom',
      'Экспресс стоит у Ярило-VI, планеты под Вечной мерзлотой. Первая экспедиция начнётся, как только навигационный пульт получит команду.',
      { credits: 2000, items: { exp1: 2 } }),
    M('tb_travelers', 'winter', 'Путешественники ночью зимней', 'plains_met', 'j_plains', 'sampo',
      'Вокруг только ледяной ветер и снег. Где-то впереди стоят стены Белобога, последнего города на планете.',
      { jade: 40, items: { exp1: 2, exp2: 1 } }),
    M('tb_night', 'winter', 'Ночь в городе вечнозимья', 'bp_in|fled', 'j_belobog', 'bronya',
      'Верховная хранительница Коколия принимает гостей и обещает помочь со Стеллароном. Город можно осмотреть, а ночевать предстоит в отеле «Гёте».',
      { credits: 2000, items: { exp1: 2, exp2: 1 } }),
    M('tb_run', 'winter', 'Можешь бежать, но тебе не спрятаться', 'underworld', 'j_backwater', 'march',
      'Броня гонится за вами по Сточному проходу, торговой улице, которую поглотил Фрагментум. Стражи перекрыли выходы, а ворота открывает только Соединитель магнитных потоков.',
      { items: { medkit: 3, hotpot: 2 } }),
    M('tb_hide', 'winter', 'Игра в прятки', 'club|moles', 'u_boulder', 'hook',
      'Сампо утащил вас в Подземье. Март ищет Дань Хэна и попадает к детской банде «Кротов», которая знает, куда его увели.',
      { jade: 40, items: { exp1: 3, exp2: 2 } }),
    M('tb_rule8', 'winter', 'Восьмое и последнее правило', 'moles', 'u_boulder', 'danheng',
      'Хук ведёт вас в Бойцовский клуб. Дань Хэн где-то на ринге, а Сампо явно не хочет отвечать на вопросы.',
      { credits: 1500, items: { exp2: 1 } }),
    M('tb_blade', 'winter', 'Долгое ожидание лезвия клинка', 'seele_trial', 'u_boulder', 'seele',
      'Сампо обещал свести вас с «Диким Огнём». По дороге бродяги окружают девушку из Надмирья, и кто-то должен вмешаться.',
      { credits: 1500, items: { exp2: 1 } }),
    M('tb_abyss', 'winter', 'Уж сколько их упало в эту бездну', 'mine_done', 'u_mine', 'oleg',
      'В Большой шахте беспорядки, а предводитель «Дикого Огня» Олег где-то в глубине выработок.',
      { jade: 40, items: { exp1: 3, exp2: 2 } }),
    M('tb_sunset', 'winter', 'Свидание на закате', 'night_talk', 'u_boulder', 'bronya',
      'Беспорядки в шахте закончились, и Олег предоставил вам жильё. Подземье впервые даёт передохнуть.',
      { credits: 3000, items: { exp1: 2, exp2: 1 } }),
    M('tb_avalanche', 'winter', 'Прошлое накроет снежной лавиной', 'rivet_intro', 'u_rivet', 'seele',
      'Наташе в клинике не хватает пластин, бинтов, спирта и обезболивающих. Зеле знает, где их искать: в брошенном Заклёпкограде, где она выросла.',
      { jade: 40, items: { exp1: 3, exp2: 2 } }),
    M('tb_rust', 'winter', 'Лежащие среди ржавчин', 'rust_done', 'u_boulder', 'natasha',
      'Припасы из Заклёпкограда доставлены в клинику. Наташа идёт с отрядом, а в Месте собраний Олег помогает составить план, как найти общий язык со Сварогом.',
      { jade: 40, items: { exp1: 2, exp2: 2 } }),
    M('tb_rot', 'winter', 'Гнить или гореть', 'rivet_done', 'u_settle', 'clara',
      'Путь к Стелларону лежит через Сварога. Сампо ведёт в Поселение роботов, где ворота базы открываются только по разрешению, а настоящий ключ у Клары.',
      { jade: 40, items: { exp1: 5, exp2: 3 } }),
    M('tb_farewell', 'winter', 'Мы не умеем прощаться', 'returned', 'u_boulder', 'natasha',
      'Правда о Стеллароне почти раскрыта. Чтобы закончить начатое, придётся вернуться в Надмирье.',
      { credits: 3000, items: { exp2: 2 } }),
    M('tb_purge', 'dawn', 'Очистка внешней тьмы', 'finale_open', 'j_belobog', 'serval',
      'Наверху комендантский час, Сампо исчез, а Броня ушла к матушке. Нужно незаметно добраться до мастерской Сервал Ландау.',
      { credits: 3000, items: { exp2: 2 } }),
    M('tb_idol', 'dawn', 'Не сотвори кумира', 'rz_dunn', 'j_restricted', 'serval',
      'Сервал проводит вас в Запретную зону под видом ремонтников. Чтобы повернуть шестерёнчатый мост, нужен ключ от центра энергоснабжения.',
      { credits: 3000, items: { exp2: 2 } }),
    M('tb_guard', 'dawn', 'Молодая гвардия', 'rz_gepard', 'j_restricted', 'gepard',
      'Мост ведёт к передовой, где стоит Гепард. Сестра надеется его уговорить, но шансов немного.',
      { jade: 40, items: { exp2: 2 } }),
    M('tb_ranks', 'dawn', 'Отставить разговоры в строю', 'fissures_intro', 'j_restricted', 'gepard',
      'Гепард согласен открыть ворота во Фрагментум. Монстры пойдут волнами, и стражам нужна помощь.',
      { jade: 40, items: { exp1: 2, exp3: 1 } }),
    M('tb_stars', 'dawn', 'Звёзды - это замёрзшие игрушки', 'cor_done', 'j_fissures', 'bronya',
      'Коридор исчезающего эха ведёт к Холму вечнозимья. Вокруг тишина Фрагментума, а впереди следы Брони и Коколии.',
      { jade: 40, items: { exp1: 2, exp3: 1 } }),
    M('tb_past', 'dawn', 'Пути в прошлое давно закрыты: А зори здесь...', 'dawn_done', 'j_everwinter', 'cocolia',
      'Спиральная тропа ведёт на Платформу созидания. Коколия держит там Броню и ждёт её выбора.',
      { jade: 40, items: { exp1: 3, exp3: 2 } }),
    M('tb_return', 'dawn', 'Пути в прошлое давно закрыты: Возвращение', 'ending', 'j_pathspace', 'bronya',
      'Янтарная пустота, чужие воспоминания и Воля хранительницы. Отсюда нужно вернуться в бой.',
      { jade: 40, items: { exp3: 2 } }),
    M('tb_swamp', 'dawn', 'Опасное болото', 'swamp_done', 'u_boulder', 'natasha',
      'Подземье должно узнать о победе. Наташа просит разнести весть, а Сварогу и Кларе стоит рассказать лично.',
      { jade: 30, credits: 4000, items: { exp2: 2 } }),
    M('tb_time', 'dawn', 'Время не ждёт, мой друг', 'time_done', 'j_belobog', 'bronya',
      'Канатная дорога снова работает. Белобог встречает новую Верховную хранительницу.',
      { credits: 5000, items: { exp3: 1 } }),
    M('tb_galaxy', 'dawn', 'Тишина галактики', 'jarilo_done', 'j_belobog', 'march',
      'Фото на память, последняя ночь в отеле «Гёте» и прощание с Белобогом. Экспресс ждёт.',
      { jade: 60, items: { exp3: 2 } }),
    M('tb_fm0', 'awake', 'Рынок будущего. Предисловие', 'fm0_done', 'j_belobog', 'march',
      'Броня зовёт экипаж на Солнечный фестиваль. По дороге в город Март знакомится с Топаз из Корпорации межзвёздного мира.',
      { jade: 30, credits: 3000, items: { suncake: 2 } }),
    M('tb_fm1', 'awake', 'Рынок будущего I', 'fm1_done', 'u_mine', 'topaz',
      'КММ требует с Белобога старый долг, а её сотрудники захватили Большую шахту. Переговоры с Топаз сорвались.',
      { jade: 40, items: { exp2: 2, exp3: 1 } }),
    M('tb_fm2', 'awake', 'Рынок будущего II', 'fm2_done', 'j_pillars', 'bronya',
      'Топаз предлагает отдать Ярило-VI под управление КММ. Броне нужно решить, а экипажу найти Топаз в Заклёпкограде.',
      { jade: 60, items: { exp3: 2 } })
  ];

  Object.assign(H.QUESTS.su_beta, {
    type: 'trail', ch: 'prologue', face: 'herta', area: 'hs_office',
    desc: 'Герта построила Виртуальную вселенную и ищет испытателя со Стеллароном внутри. В симуляции тебе предстоит сыграть Эона Освоения.',
    reward: { jade: 50, credits: 3000, items: { exp1: 2 }, cone: 'databank' }, joins: 'herta'
  });

  const worldOf = map => {
    const car = H.expressArea(map);
    if (car) return { world: 'Звёздный экспресс', area: car.name };
    for (const w of H.WORLDS) for (const gr of w.groups) for (const a of gr.areas) if (a.map === map) return { world: w.name, area: a.name };
    const def = H.MAPS[map];
    return { world: '', area: def ? def.name.split(': ').pop() : '' };
  };

  Object.assign(H.Game.prototype, {
    missionsState() {
      const s = this.state;
      if (!s.missions) s.missions = { done: {}, track: null, seen: {} };
      if (!s.missions.seen) s.missions.seen = {};
      if (!s.missions.done) s.missions.done = {};
      return s.missions;
    },

    fixMissions(old) {
      const ms = this.missionsState();
      if (!old) return;
      for (const m of TRAIL) if (this.cond(m.done)) ms.done[m.id] = 1;
      for (const id of Object.keys(this.state.quests)) ms.seen[id] = 1;
      ms.seen.main = 1;
    },

    missionTick() {
      const ms = this.missionsState();
      for (const m of TRAIL) {
        if (ms.done[m.id] || !this.cond(m.done)) continue;
        ms.done[m.id] = this.now();
        const got = this.give(m.reward);
        this.addTrailExp(H.TL_QUEST_EXP.trail);
        this.emit({ t: 'mission', id: m.id, type: 'trail', name: m.name, got });
        ms.seen.main = 0;
      }
    },

    missionNew(id) {
      const ms = this.missionsState();
      if (this.state.quests[id] === 'done') { delete ms.seen[id]; if (ms.track === id) ms.track = null; }
      else if (!(id in ms.seen)) ms.seen[id] = 0;
    },

    trailCurrent() {
      const ms = this.missionsState();
      return TRAIL.find(m => !ms.done[m.id] && !this.cond(m.done)) || null;
    },

    missionPlace(map) {
      const p = worldOf(map);
      return p.world && p.area ? p.world + ' - ' + p.area : p.world || p.area;
    },

    missionList() {
      const out = [], ms = this.missionsState(), main = this.trailCurrent();
      if (main) {
        const goal = this.objTarget(), map = goal ? goal.map : main.area;
        out.push({ id: 'main', key: main.id, type: 'trail', ch: main.ch, name: main.name, text: this.state.obj, desc: main.desc, face: main.face, reward: main.reward, map, place: this.missionPlace(map), target: goal, isNew: ms.seen.main === 0 });
      }
      for (const q of this.questList()) {
        const def = H.QUESTS[q.id], map = q.at ? q.at.split(':')[0] : def.area || null;
        out.push({ id: q.id, key: q.id, type: q.type, ch: def.ch || null, name: q.name, text: q.text, desc: q.desc, face: def.face || null, reward: def.reward || null, joins: def.joins || null, map, place: map ? this.missionPlace(map) : '', target: q.at ? { map, mark: q.at.split(':')[1] || null } : null, giver: q.giver, isNew: ms.seen[q.id] === 0 });
      }
      return out;
    },

    missionTracked() {
      const ms = this.missionsState(), list = this.missionList();
      if (ms.track === 'none') return null;
      return list.find(m => m.id === ms.track) || list.find(m => m.type !== 'adv') || list[0] || null;
    },

    trackMission(id) { this.missionsState().track = id || 'none'; },

    seeMission(id) { const ms = this.missionsState(); if (ms.seen[id] === 0) ms.seen[id] = 1; },

    missionAlert() { return this.missionList().some(m => m.isNew); }
  });

  Object.assign(H, { MISSION_TYPES: TYPES, MISSION_TYPE_ORDER: TYPE_ORDER, MISSION_CHAPTERS: CHAPTERS, TRAIL_MISSIONS: TRAIL });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
