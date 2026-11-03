(function (H) {
  'use strict';

  const SECTIONS = [
    { id: 'daily', label: 'Ежедневная тренировка', icon: 'gdaily', open: g => g.state.flags.express_intro ? null : 'после знакомства с Экспрессом' },
    { id: 'index', label: 'Индекс выживаемости', icon: 'gindex', open: g => g.calyxList().some(x => x.open) ? null : 'с первым открытым чашелистом' },
    { id: 'cosmic', label: 'Космический раздор', icon: 'gcosmic', open: g => g.state.flags.su_open ? null : 'после первого теста Виртуальной вселенной' },
    { id: 'treasure', label: 'Озарённые светом сокровища', icon: 'gtreasure', open: g => g.fhOpen() || g.state.flags.pf_open ? null : 'после встречи с Посланником Зала забвения' },
    { id: 'trail', label: 'Первопроходческий опыт', icon: 'gtrail', open: () => null }
  ];

  const ACTS = [
    { world: 'herta', title: 'Пролог: Космическая станция «Герта»', parts: [['prologue', 'Раздел I'], ['crown', 'Продолжение I']] },
    { world: 'jarilo', title: 'Акт I: Ярило-VI', parts: [['winter', 'Раздел I'], ['dawn', 'Раздел II'], ['awake', 'Продолжение I']] },
    { world: 'luofu', title: 'Акт II: Лофу Сяньчжоу', parts: [['wander', 'Раздел I'], ['tower', 'Раздел II'], ['karmic', 'Раздел III']] }
  ];

  const DAILY = [
    { id: 'login', text: 'Войдите в игру', pts: 100, need: 1, fixed: true, go: null },
    { id: 'power', text: 'Потратьте 120 энергии освоения', pts: 200, need: 120, fixed: true, go: 'index' },
    { id: 'contact', text: 'Проведите успешный Контакт с противником 1 раз', pts: 200, need: 1, fixed: true, go: 'field' },
    { id: 'su', text: 'Пройдите Виртуальную вселенную 1 раз', pts: 500, need: 1, fixed: true, when: g => !!g.state.flags.su_open, go: 'su' },
    { id: 'kills', text: 'Одолейте 20 противников', pts: 100, need: 20, go: 'field' },
    { id: 'breaks', text: 'Нанесите Пробитие уязвимости 5 раз', pts: 100, need: 5, go: 'field' },
    { id: 'synth', text: 'Используйте Синтез 1 раз', pts: 100, need: 1, go: 'synth' },
    { id: 'trace', text: 'Активируйте или поднимите уровень Следов 1 раз', pts: 100, need: 1, go: 'trace' },
    { id: 'levelup', text: 'Повысьте уровень персонажа 1 раз', pts: 100, need: 1, go: 'levelup' },
    { id: 'coneup', text: 'Повысьте уровень светового конуса 1 раз', pts: 100, need: 1, when: g => g.state.inv.cones.length > 0, go: 'coneup' },
    { id: 'tech', text: 'Используйте Технику 1 раз', pts: 100, need: 1, go: 'field' },
    { id: 'item', text: 'Используйте расходный предмет 1 раз', pts: 100, need: 1, go: 'item' },
    { id: 'fusion', text: 'Проведите Слияние в бою 1 раз', pts: 100, need: 1, when: g => Object.keys((g.state.bank || {}).fusions || {}).length > 0, go: 'field' }
  ];
  const DAILY_POOL = 3, DAILY_MAX = 500, DAILY_STEPS = [100, 200, 300, 400, 500];
  const DAILY_REWARDS = {
    exp: [200, 230, 260, 290, 320, 350, 380],
    jade: [10, 10, 10, 15, 15],
    credits100: [12800, 14700, 16600, 18600, 20500, 22400, 24300],
    credits400: [17600, 20200, 22900, 25500, 28200, 30800, 33400],
    mats200: [4, 4, 5, 5, 6, 7, 7],
    mats500: [5, 6, 6, 7, 8, 8, 9],
    books300: [6, 7, 8, 9, 10, 11, 12]
  };
  const HOUR = 3600000;
  if (H.TUNING.dtCredit == null) H.TUNING.dtCredit = 0.2;

  const INDEX = [
    { id: 'target', label: 'Цель развития', sub: 'Выберите героя', icon: 'chars', col: '#c9a45c' },
    { id: 'orn', label: 'Извлечение украшений', sub: 'Планарные украшения', icon: 'gcosmic', col: '#80c8ff' },
    { id: 'golden', label: 'Чашелист (золотой)', sub: 'Материалы опыта и кредиты', icon: 'calyx', col: '#e8c060' },
    { id: 'crimson', label: 'Чашелист (багровый)', sub: 'Материалы Следов', icon: 'calyx', col: '#e05a5a' },
    { id: 'shadow', label: 'Застойная тень', sub: 'Возвышение, реликвии', icon: 'calyx', col: '#b080ff' },
    { id: 'cavern', label: 'Пещера коррозии', sub: 'Реликвии', icon: 'calyx', col: '#5ad0c0' },
    { id: 'echo', label: 'Эхо войны', sub: 'Материалы Эха войны', icon: 'calyx', col: '#ff8a5a' }
  ];
  const SIMULATOR = { map: 'express', ch: 't' };
  const HOP_NEAR = 4;

  const MAT_ORDER = ['path', 'foe', 'echo', 'asc', 'tracks'];
  const SCORE = [[12, 'S'], [9, 'A'], [6, 'B'], [0, 'C']];
  const REC_ABILITY = ['skill', 'ult', 'talent'];
  const REC_NODE = n => n.kind === 'bonus' || (n.kind === 'ability' && REC_ABILITY.includes(n.id));

  let WARP_SRC = null;
  const warpSources = () => {
    if (WARP_SRC) return WARP_SRC;
    const out = new Map(), std = H.BANNERS.std || {}, events = Object.values(H.BANNERS).filter(B => B !== std && B.stars);
    const add = (id, tag, src, five) => { if (!String(id).startsWith('cone:') && H.CHARS[id] && H.TRACES[id] && !out.has(id)) out.set(id, { tag, src, five }); };
    for (const B of events) for (const [id, S] of Object.entries(B.stars)) if (!S.cone) add(id, 'Прыжок', B.kind, true);
    for (const B of events) for (const S of Object.values(B.stars)) if (!S.cone) for (const id of (S.four || []).concat(B.extra4 || [])) add(id, 'Прыжок', B.kind, false);
    for (const id of (std.featured || []).concat(H.WARP_POOL.five, H.WARP_POOL.four)) add(id, 'Стандарт', std.kind || 'Стандартный прыжок', false);
    WARP_SRC = out;
    return out;
  };

  const calyxKind = c => c.reward === 'path' ? 'crimson' : c.reward === 'echo' ? 'echo' : c.reward === 'exp' || c.reward === 'credits' || c.reward === 'aether' ? 'golden' : c.boss ? 'shadow' : 'cavern';

  const CHAPTER_PHOTO = { prologue: 'doom', winter: 'belobog_intro', dawn: 'ending', awake: 'fm2_done' };
  const CHAPTER_SCENE = { crown: { bg: 'station', cast: ['ruanmei', 'trail'] }, wander: { bg: 'lf_port', cast: ['march', 'trail', 'welt'] }, tower: { bg: 'lf_sea', cast: ['imbibitor', 'jingyuan'] }, karmic: { bg: 'lf_night', cast: ['yukong', 'trail', 'march'] } };

  const RULES = {
    intro: [
      'Ради достижения всеобщего мира и исполнения желания Повелителя Янтаря о Сохранении!',
      'Ради спасения каждой планеты от грядущей разрушительной катастрофы!',
      'Корпорация межзвёздного мира распространяет Межзвёздный путеводитель по всей Вселенной. Действуйте в соответствии с инструкциями Путеводителя и защитите свой мир!',
      'Это руководство включает в себя: Как выжить в Апокалипсисе. Шаг за шагом: Развитие собственной силы. Имитационное обучение выживанию (и ежедневные миссии). Обзор и анализ явлений Фрагментума. Обычные явления Фрагментума и их опасности.'
    ],
    sign: '2158 я. э. | Версия 1.0',
    daily: 'Ежедневная тренировка обновляется каждый час. Выполняйте задачи, забирайте за них очки активности и получайте награды на 100, 200, 300, 400 и 500 очках. Награды растут с уровнем равновесия. Набрать можно 500 очков, остальные задачи этого часа можно пропустить.',
    index: 'Индекс выживаемости перечисляет места, куда можно возвращаться за материалами и реликвиями: чашелисты, Застойные тени, Пещеры коррозии, Эхо войны и миры Виртуальной вселенной. «Войти» переносит команду к ближайшему активированному якорю пространства и сразу открывает вход. Телепорт работает, когда команда стоит у якоря пространства или в безопасной зоне. Круглая кнопка Топливного купона (F) проводит быстрое получение чашелиста или Застойной тени без телепорта, лупа (L) показывает испытание. Бюст цели развития отмечает строки, где растёт то, что ей нужно.',
    cosmic: 'Космический раздор показывает миры Виртуальной вселенной Герты: какие открыты, какие пройдены, какую награду дадут и какие украшения выпадут. «Перейти к испытанию» ведёт к машине в офисе Герты.',
    treasure: 'Озарённые светом сокровища показывают испытания Зала забвения: звёзды, награды за них, Эхо Зала на этой неделе и обновление лавки «Шутки сбываются». Вторая строка показывает Чистый вымысел: сезон, этапы, звёзды и награды, которые можно забрать. «Перейти к испытанию» ведёт к зеркалу в гостиной Экспресса, сумка открывает лавку Зала.',
    trail: 'Раздел собирает главы Освоения, которые вы прошли или проходите сейчас. Карточка главы открывает её миссии в порядке прохождения.'
  };

  const baseAlerts = H.Game.prototype.alerts;

  Object.assign(H.Game.prototype, {
    alerts() {
      const out = baseAlerts.call(this);
      out.guide_treasure = (this.fhOpen && this.fhAlert ? this.fhAlert() : false) || (this.pfAlert ? this.pfAlert() : false);
      out.guide_cosmic = !!this.state.flags.su_open && this.suClaims().length > 0;
      out.guide_daily = this.dailyAlert();
      out.guide = out.guide_treasure || out.guide_cosmic || out.guide_daily;
      return out;
    },

    chapterMissions(ch) {
      const s = this.state, ms = this.missionsState();
      const trail = H.TRAIL_MISSIONS.filter(m => m.ch === ch).map(m => ({ id: m.id, name: m.name, desc: this.fill(m.desc || ''), done: !!ms.done[m.id] }));
      const quests = Object.keys(H.QUESTS).filter(id => H.QUESTS[id].type === 'trail' && H.QUESTS[id].ch === ch).map(id => ({ id, name: H.QUESTS[id].name, desc: this.fill(H.QUESTS[id].desc || ''), done: s.quests[id] === 'done' }));
      return trail.concat(quests);
    },

    chapterState(ch) {
      const list = this.chapterMissions(ch), done = list.filter(m => m.done).length;
      return { list, done, total: list.length, finished: list.length > 0 && done === list.length, started: done > 0 };
    },

    guideActs() {
      return ACTS.map(a => {
        const world = H.WORLDS.find(w => w.id === a.world);
        const parts = a.parts.map(([ch, part]) => Object.assign({ ch, part, name: H.MISSION_CHAPTERS[ch].name }, this.chapterState(ch)));
        const open = !!(world && world.open !== null && this.cond(world.open || ''));
        return { world: a.world, title: a.title, open, parts, done: parts.filter(p => p.finished).length, finished: parts.length > 0 && parts.every(p => p.finished) };
      });
    },

    guideSite(kind, id) {
      for (const [map, def] of Object.entries(H.MAPS)) for (const [ch, mk] of Object.entries(def.marks || {})) {
        if (kind === 'calyx' && mk.type === 'prop' && [].concat(mk.calyx || []).includes(id)) return { map, ch };
        if (kind === 'su' && mk.obj === 'su_machine') return { map, ch };
        if (kind === 'fh' && mk.obj === 'fhmirror') return { map, ch };
        if (kind === 'pf' && mk.obj === 'pfcage') return { map, ch };
      }
      return kind === 'calyx' ? Object.assign({ sim: true }, SIMULATOR) : null;
    },

    guidePlace(site) {
      if (!site) return '';
      if (site.sim) return 'Экспресс, Симулятор';
      const a = this.areaOf(site.map);
      return a ? a.area.name || a.area : '';
    },

    guideIndexRows(cat) {
      if (cat === 'orn') {
        return H.SU.WORLDS.filter(w => w.set).map(w => ({ kind: 'su', id: w.id, name: w.name + ': ' + w.title, cost: H.SU.TUN.power, open: this.suWorldOpen(w), why: 'Сначала пройдите прошлый мир.', set: w.set, place: this.guidePlace(this.guideSite('su')) }));
      }
      return H.CALYX.filter(c => calyxKind(c) === cat).map(c => {
        const site = this.guideSite('calyx', c.id), path = c.owns && Object.values(H.TRACE_PATH_LINES || {}).find(l => l[0] === c.owns);
        return { kind: 'calyx', id: c.id, c, name: c.name.split(': ').slice(1).join(': ') || c.name, cost: c.cost, open: this.calyxOpen(c), why: c.ownsMat ? 'Нужен герой с этим материалом.' : c.owns ? 'Нужен герой Пути ' + (path ? path[1] : c.owns) + '.' : 'Откроется по сюжету.', place: this.guidePlace(site) };
      }).sort((a, b) => (b.open ? 1 : 0) - (a.open ? 1 : 0));
    },

    guideTargetIds() {
      const key = this.guideTarget(), ids = new Set();
      if (!key) return ids;
      for (const n of this.targetNeeds(key)) if (n.row) ids.add(n.row.id);
      const b = H.guideBuild(this.kitOf(key));
      for (const set of [b.set, b.planar]) { const r = this.setSource(set); if (r) ids.add(r.id); }
      return ids;
    },

    guideIndexList(cat) {
      const ids = this.guideTargetIds(), rows = this.guideIndexRows(cat).map((r, i) => Object.assign(r, { forTarget: ids.has(r.id), at: i }));
      return rows.sort((a, b) => (b.open - a.open) || (b.forTarget - a.forTarget) || (a.at - b.at));
    },

    guideHop(site) {
      const L = H.mapLayout(site.map), at = L.marks[site.ch];
      if (!at) return { ok: false, why: 'Сюда не проложен путь.' };
      const [x, y] = at[0], p = this.player;
      if (this.map && this.map.id === site.map && p && Math.abs(p.x - x) + Math.abs(p.y - y) <= HOP_NEAR) return { ok: true, here: true };
      const pts = this.navPoints(site.map).filter(q => q.kind === 'anchor' || q.kind === 'landing').sort((a, b) => (Math.abs(a.x - x) + Math.abs(a.y - y)) - (Math.abs(b.x - x) + Math.abs(b.y - y)));
      let why = 'В этой зоне нет якоря пространства.';
      for (const q of pts) { const tp = this.teleportFor(q); if (tp.ok) return { ok: true, dest: tp.dest }; if (tp.why) why = tp.why; }
      const area = this.areaOf(site.map);
      if (!pts.length && !this.state.su && area && this.areaOpen(area.area) && !(this.ksSwapped && this.ksSwapped() && area.world.id !== 'belzerg')) return { ok: true, dest: { kind: 'map', map: site.map, at: site.ch, name: area.area.name || '' } };
      return { ok: false, why };
    },

    equilibriumLevel() { return Math.min(6, Object.keys(this.state.flags).filter(f => f.startsWith('first_')).length); },

    dailySync() {
      const s = this.state, hour = Math.floor(this.now() / HOUR), d = s.daily;
      if (d && d.hour === hour) return d;
      const ok = t => !t.when || t.when(this);
      const rng = H.makeRandom(hour * 7919 + 17), pool = DAILY.filter(t => !t.fixed && ok(t)).map(t => t.id), pick = DAILY.filter(t => t.fixed && ok(t)).map(t => t.id);
      for (let i = 0; i < DAILY_POOL && pool.length; i++) pick.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
      s.daily = { hour, pick, prog: { login: 1 }, got: {}, pts: 0, claimed: [] };
      return s.daily;
    },

    dailyLeft() { return HOUR - this.now() % HOUR; },

    dailyCount(id, n = 1) {
      const d = this.dailySync(), t = DAILY.find(x => x.id === id);
      if (!t || !d.pick.includes(id) || n <= 0) return;
      d.prog[id] = Math.min(t.need, (d.prog[id] || 0) + n);
    },

    dailyTasks() {
      const d = this.dailySync();
      return d.pick.map(id => { const t = DAILY.find(x => x.id === id), prog = d.prog[id] || 0; return { def: t, prog, done: prog >= t.need, got: !!d.got[id], full: d.pts >= DAILY_MAX }; });
    },

    dailyClaimTask(id) {
      const d = this.dailySync(), t = this.dailyTasks().find(x => x.def.id === id);
      if (!t || !t.done || t.got || d.pts >= DAILY_MAX) return false;
      d.got[id] = true;
      d.pts = Math.min(DAILY_MAX, d.pts + t.def.pts);
      return true;
    },

    dailyReward(i) {
      const e = this.equilibriumLevel(), R = DAILY_REWARDS, T = H.TUNING, out = { exp: R.exp[e], jade: R.jade[i], items: {} };
      if (i === 0) out.credits = Math.round(R.credits100[e] * T.dtCredit);
      if (i === 3) out.credits = Math.round(R.credits400[e] * T.dtCredit);
      if (i === 1) out.items.rice = R.mats200[e];
      if (i === 4) out.items.herbs = R.mats500[e];
      if (i === 2) out.items.exp2 = R.books300[e];
      return out;
    },

    dailySteps() {
      const d = this.dailySync();
      return DAILY_STEPS.map((need, i) => ({ i, need, ready: d.pts >= need, got: d.claimed.includes(i), reward: this.dailyReward(i) }));
    },

    dailyClaimStep(i) {
      const d = this.dailySync(), st = this.dailySteps()[i];
      if (!st || !st.ready || st.got) return null;
      d.claimed.push(i);
      const r = st.reward, tlMax = this.state.tl.lvl >= H.TL_MAX, out = this.give({ jade: r.jade, credits: (r.credits || 0) + (tlMax ? Math.round(r.exp * 10 * H.TUNING.dtCredit) : 0), items: r.items });
      if (!tlMax) { this.addTrailExp(r.exp); out.unshift(r.exp + ' опыта Освоения'); }
      return out;
    },

    dailyClaimAll() {
      const out = [];
      for (const t of this.dailyTasks()) if (this.dailyClaimTask(t.def.id)) out.push('+' + t.def.pts + ' активности');
      for (const st of this.dailySteps()) { const got = this.dailyClaimStep(st.i); if (got) out.push(...got); }
      return out;
    },

    dailyAlert() {
      if (!this.state.flags.express_intro) return false;
      return this.dailyTasks().some(t => t.done && !t.got && !t.full) || this.dailySteps().some(st => st.ready && !st.got);
    },

    guideState() { return this.state.guide || (this.state.guide = { target: null }); },

    guideWarpHeroes() { return [...warpSources().keys()]; },

    guideWarpInfo(k) { return warpSources().get(this.kitOf(k)) || null; },

    guideOwned(k) { const r = this.state.roster[k]; return !!(r && !r.guest); },

    guideTargets() {
      const s = this.state, warp = this.guideWarpHeroes(), own = Object.keys(s.roster).filter(k => !s.roster[k].guest && H.TRACES[this.kitOf(k)]);
      const first = own.filter(k => this.guideIsWarp(k)), rest = own.filter(k => !first.includes(k));
      return first.concat(rest, warp.filter(id => !s.roster[id]));
    },

    guideIsWarp(k) { const w = this.guideWarpInfo(k); return !!(w && w.five); },

    guideTarget() { const k = this.guideState().target; return k && this.guideTargets().includes(k) ? k : null; },

    setGuideTarget(k) { if (this.guideTargets().includes(k)) this.guideState().target = k; },

    guideRecOnly() { return !!this.guideState().recOnly; },

    setGuideRecOnly(on) { this.guideState().recOnly = !!on; },

    targetCost(key, recOnly = this.guideRecOnly()) {
      const kit = this.kitOf(key), t = this.traceOf(key) || { lv: { basic: 1, skill: 1, ult: 1, talent: 1 }, on: [] }, r = this.state.roster[key] || { lvl: 1, exp: 0 }, items = {};
      let credits = 0;
      for (const n of H.traceNodes(kit)) {
        if (n.kind === 'tech' || (recOnly && !REC_NODE(n))) continue;
        const cur = n.kind === 'ability' ? t.lv[n.id] : t.on.includes(n.id) ? 1 : 0;
        for (let to = cur + 1; to <= n.max; to++) {
          const c = H.traceCost(kit, n.id, to);
          if (!c) continue;
          credits += c.credits;
          for (const [m, x] of Object.entries(c.items)) items[m] = (items[m] || 0) + x;
        }
      }
      const pay = c => {
        credits += c.credits;
        for (const [m, x] of Object.entries(c.items)) items[m] = (items[m] || 0) + x;
      };
      for (let p = this.state.roster[key] ? this.ascOf(key) : 0; p < 6; p++) pay(this.ascCost(key, p));
      let exp = -r.exp;
      for (let l = r.lvl; l < H.MAX_LVL; l++) exp += H.expToNext(l);
      exp = r.lvl >= H.MAX_LVL ? 0 : Math.max(0, exp);
      credits += this.expCredits(exp);
      let coneExp = 0;
      const cn = r.cone != null ? this.coneOf(r.cone) : null;
      if (cn) {
        this.coneFix(cn);
        for (let p = cn.asc; p < 6; p++) pay(this.coneAscCost(cn, p));
        coneExp = -cn.exp;
        for (let l = cn.lvl; l < H.MAX_LVL; l++) coneExp += this.coneNeed(cn, l);
        coneExp = cn.lvl >= H.MAX_LVL ? 0 : Math.max(0, coneExp);
        credits += this.coneCredits(coneExp);
      }
      return { items, credits, exp, coneExp };
    },

    targetNeeds(key) {
      const s = this.state, inv = s.inv.items, cost = this.targetCost(key), out = [];
      for (const [id, n] of Object.entries(cost.items)) { const miss = n - (inv[id] || 0); if (miss > 0) out.push({ id, need: n, miss }); }
      const rank = id => { const it = H.ITEMS[id]; return MAT_ORDER.indexOf(it.mat) * 100 + (it.tier || 0); };
      out.sort((a, b) => rank(a.id) - rank(b.id));
      const book = H.ITEMS.exp3.use.exp, have = ['exp1', 'exp2', 'exp3'].reduce((a, id) => a + (inv[id] || 0) * H.ITEMS[id].use.exp, 0);
      if (cost.exp > have) out.push({ id: 'exp3', need: Math.ceil(cost.exp / book), miss: Math.ceil((cost.exp - have) / book) });
      const aether = H.ITEMS.aether3.coneExp, haveAether = ['aether1', 'aether2', 'aether3'].reduce((a, id) => a + (inv[id] || 0) * H.ITEMS[id].coneExp, 0);
      if (cost.coneExp > haveAether) out.push({ id: 'aether3', need: Math.ceil(cost.coneExp / aether), miss: Math.ceil((cost.coneExp - haveAether) / aether) });
      if (cost.credits > s.credits) out.push({ id: 'credits', need: cost.credits, miss: cost.credits - s.credits });
      return out.map(o => Object.assign(o, this.needSource(o.id)));
    },

    needSource(id) {
      const it = H.ITEMS[id], rows = kind => this.guideIndexRows(kind);
      let row = null;
      if (it && it.mat === 'path') { const path = H.TRACE_PATH_LINES[it.line][0]; row = rows('crimson').find(r => r.c.path === path); }
      else if (it && it.mat === 'foe') row = rows('golden').find(r => (r.c.pool || []).some(e => H.ENEMIES[e] && H.TRACE_FOE_OF_FAMILY[H.ENEMIES[e].fam] === it.line)) || null;
      else if (it && it.mat === 'echo') row = rows('echo').find(r => r.c.mat === id);
      else if (it && it.mat === 'asc') row = rows('shadow').find(r => r.c.mat === id);
      else if (id === 'exp3') row = rows('golden').find(r => r.id === 'cx_exp');
      else if (it && it.coneExp) row = rows('golden').find(r => r.id === 'cx_aether');
      else if (id === 'credits') row = rows('golden').find(r => r.id === 'cx_credits');
      if (row) return { row, src: row.name + (row.place ? ', ' + row.place : '') };
      if (it && it.mat === 'foe') return { row: null, src: 'Враги: ' + H.TRACE_FOE_LINES[it.line][0] };
      if (it && it.mat === 'tracks') return { row: null, src: 'Снабжение, награды проводника', supply: true };
      if (it && it.src) return { row: null, src: it.src };
      return { row: null, src: '' };
    },

    setSource(set) {
      const def = H.RELIC_SETS[set];
      if (def.planar) return this.guideIndexRows('orn').find(r => r.set === set) || null;
      const all = this.guideIndexRows('cavern').concat(this.guideIndexRows('shadow')).filter(r => (r.c.sets || []).includes(set));
      return all.find(r => r.open) || all[0] || null;
    },

    relicScore(key) {
      const s = this.state, r = s.roster[key] || {}, subs = H.guideBuild(this.kitOf(key)).subs;
      const worn = Object.values(r.relics || {}).map(uid => s.inv.relics.find(x => x.uid === uid)).filter(Boolean);
      const useful = worn.reduce((a, rel) => a + rel.subs.filter(([k]) => subs.includes(k)).length, 0);
      return { useful, worn: worn.length, grade: worn.length ? SCORE.find(([n]) => useful >= n)[1] : '—' };
    },

    guideCosmic() {
      return H.SU.WORLDS.map(w => ({ kind: 'su', id: w.id, w, name: w.name + ': ' + w.title, open: this.suWorldOpen(w), first: this.suFirst(w), rw: this.suReward(w, this.suFirst(w)), cost: H.SU.TUN.power, why: 'Сначала пройдите прошлый мир.' }));
    },

    guideTreasure() {
      const total = H.FH.STAGES.length * 3, stars = this.fhTotal();
      return { kind: 'fh', id: 'fh', open: this.fhOpen(), why: 'Сначала встретьте Посланника.', name: H.FH.SERIES[0].name, stars, total, tiers: this.fhTiers(), echo: this.fhEchoUsed(), echoMax: H.FH.TUN.echoWeek, shopLeft: this.fhShopLeft(), cleared: H.FH.STAGES.filter(st => (this.fhRec(st.n) || {}).clear).length };
    },

    chapterPhoto(ch) {
      if (CHAPTER_SCENE[ch]) return CHAPTER_SCENE[ch];
      const p = H.PHOTOS.find(x => x[0] === CHAPTER_PHOTO[ch]);
      return p ? { bg: p[1], cast: p[3] } : { bg: 'station', cast: [] };
    }
  });

  const P = H.Game.prototype;
  const counted = (name, id, test) => { const base = P[name]; if (base) P[name] = function (...a) { const r = base.apply(this, a); if (test ? test.call(this, r, a) : r) this.dailyCount(id); return r; }; };
  const spending = name => { const base = P[name]; if (base) P[name] = function (...a) { const p0 = this.state.power, r = base.apply(this, a), d = p0 - this.state.power; if (d > 0) this.dailyCount('power', d); return r; }; };
  ['synth', 'exchange', 'cook', 'craftRelic'].forEach(n => counted(n, 'synth'));
  counted('trace', 'trace');
  const raising = (name, id, levelOf) => {
    const base = P[name];
    if (base) P[name] = function (who, ...a) { const before = levelOf.call(this, who), r = base.call(this, who, ...a); if (r && levelOf.call(this, who) > before) this.dailyCount(id); return r; };
  };
  const heroLevel = function (key) { const r = this.state.roster[key]; return r ? r.lvl : 0; };
  const coneLevel = cn => (cn && cn.lvl) || 1;
  ['useExp', 'applyUp'].forEach(n => raising(n, 'levelup', heroLevel));
  ['coneUseExp', 'coneApply'].forEach(n => raising(n, 'coneup', coneLevel));
  counted('technique', 'tech', r => r !== false);
  counted('useItem', 'item', (r, a) => r && a[0] !== 'fuel');
  counted('suComplete', 'su', function () { const su = this.state.su; return !!(su && su.result && su.result.win); });
  ['calyxReward', 'suComplete', 'suClaim'].forEach(spending);
  const baseStart = P.startBattle;
  P.startBattle = function (o) {
    const r = baseStart.call(this, o), b = this.battle;
    if (b && !b.dailyHook) {
      const push = b.push.bind(b);
      b.dailyHook = true;
      b.push = e => {
        if (e.t === 'kill' && e.u && e.u.side !== 'ally') this.dailyCount('kills');
        else if (e.t === 'break') this.dailyCount('breaks');
        else if (e.t === 'fusion') this.dailyCount('fusion');
        else if (e.t === 'leave') this.dailyCount('contact');
        return push(e);
      };
    }
    return r;
  };

  const MAIL = {
    id: 'v16_guide', from: H.BRAND.team, title: 'Патч 1.6: Межзвёздный путеводитель и Синтез',
    give: { items: { remains: 300, metal: 10, basic: 10, phlog: 10, seed: 10, water: 10, gas: 10, mech: 5, rice: 5, particle: 5, herbs: 5 } },
    text: [
      'Уважаемый Первопроходец!',
      'В телефоне появились плитки «Путеводитель» и «Синтез». Сохранение и загрузка переехали в правую панель телефона, сразу под шестерёнку настроек.',
      'Межзвёздный путеводитель собирает всё, к чему стоит возвращаться: ежедневную тренировку (она обновляется каждый час), Индекс выживаемости с целью развития героя, Виртуальную вселенную, Зал забвения и пройденные главы Освоения. Кнопка «Войти» переносит команду к нужному месту.',
      'В Синтезе готовят расходные предметы по рецептам, синтезируют и меняют материалы и создают реликвии. Проданная реликвия теперь расщепляется: кредиты прежние, а сверху Обломки Реликвии. Сто Обломков дают реликвию любого набора и слота, Самомоделирующаяся смола выбирает её главную характеристику.',
      'Пещеры коррозии и Застойные тени теперь роняют свои пары наборов, как в оригинале. Где что падает, видно в Индексе выживаемости.',
      'Симулятор Экспресса проводит испытания сериями, а Топливные купоны дают материалы чашелистов и Застойных теней без боя. Первые купоны Пом-Пом пришлёт отдельным письмом.',
      'Во вложении Обломки Реликвии и материалы синтеза для первых рецептов. Спасибо, что едете с нами!'
    ]
  };
  if (H.MAIL && !H.MAIL.some(m => m.id === MAIL.id)) H.MAIL.push(MAIL);

  Object.assign(H, { GUIDE_REC_ABILITY: REC_ABILITY, DAILY_TASKS: DAILY, DAILY_REWARDS, DAILY_STEPS, GUIDE_INDEX: INDEX, guideCalyxKind: calyxKind, GUIDE_SECTIONS: SECTIONS, GUIDE_ACTS: ACTS, GUIDE_RULES: RULES });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
