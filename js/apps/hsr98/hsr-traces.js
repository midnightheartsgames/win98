(function (H) {
  'use strict';

  const PATH_LINES = {
    dest: ['destruction', 'Разрушения', ['Расколотый клинок', 'Безжизненный клинок', 'Всеразрушающий клинок']],
    hunt: ['hunt', 'Охоты', ['Стрела охотника', 'Стрела убийцы демонов', 'Стрела охотника за звёздами']],
    erud: ['erudition', 'Эрудиции', ['Ключ к вдохновению', 'Ключ к знаниям', 'Ключ к мудрости']],
    harm: ['harmony', 'Гармонии', ['Гармоничная мелодия', 'Песнь рода', 'Симфония созвездий']],
    nihil: ['nihility', 'Небытия', ['Обсидиан ужаса', 'Обсидиан запустения', 'Обсидиан одержимости']],
    pres: ['preservation', 'Сохранения', ['Выносливость бронзы', 'Клятва мёрзлой стали', 'Страж янтаря']],
    abund: ['abundance', 'Изобилия', ['Семя изобилия', 'Росток жизни', 'Цветок вечности']],
    memo: ['remembrance', 'Памяти', ['Семя раздумий', 'Росток осознания', 'Бутон сознания']],
    elat: ['elation', 'Радости', ['Нарисованные от руки раскадровки «Пушистого скитальца»', 'Юбилейный выпуск «Пушистого скитальца»', 'Коллекционное собрание «Пушистого скитальца»']]
  };

  const FOE_LINES = {
    core: ['монстров Фрагментума', ['Угасшее ядро', 'Мерцающее ядро', 'Извивающееся ядро']],
    legion: ['Легиона Антиматерии', ['Инстинкт вора', 'Искажённые амбиции', 'Воля завоевателя']],
    silver: ['Среброгривых Стражей, бродяг и Теней вечнозимья', ['Значок Среброгривых Стражей', 'Знак отличия Среброгривых Стражей', 'Медаль Среброгривых Стражей']],
    ancient: ['автоматонов', ['Древняя деталь', 'Древний вал передачи', 'Древний двигатель']],
    scion: ['Мерзостей Изобилия с Лофу', ['Ростки бессмертия', 'Эфирный цветок бессмертия', 'Ветвь бессмертной славы']],
    artifex: ['Зачарованных изобретений с Лофу', ['Искусственный механический компонент', 'Механическое цилиндрическое колесо', 'Механическое сердце хаоса']]
  };

  const ECHOES = {
    echo_doom: ['Последний путь разрушителя', 'Зверь Судного дня'],
    echo_lament: ['Скорбь хранительницы', 'Кокоулия'],
    echo_ochema: ['Покаяние вечного ложного тела', 'Фантилия'],
    echo_borehole: ['Прошлые бедствия червоточины', 'Король роя']
  };

  const ITEMS = {};
  for (const [line, [, gen, names]] of Object.entries(PATH_LINES)) names.forEach((name, i) => {
    ITEMS[line + (i + 1)] = { name, kind: 'mat', mat: 'path', line, tier: i + 1, rar: i + 2, price: 0, text: 'Материал для Следов героев Пути ' + gen + '.' };
  });
  for (const [line, [from, names]] of Object.entries(FOE_LINES)) names.forEach((name, i) => {
    ITEMS[line + (i + 1)] = { name, kind: 'mat', mat: 'foe', line, tier: i + 1, rar: i + 2, price: 0, text: 'Материал для Следов. Остаётся после ' + from + '.' };
  });
  for (const [id, [name, boss]] of Object.entries(ECHOES)) ITEMS[id] = { name, kind: 'mat', mat: 'echo', boss, rar: 4, price: 0, text: 'Продвинутый материал для Следов. Память о бое: ' + boss + '.' };
  ITEMS.tracks = { name: 'Отпечатки судьбы', kind: 'mat', mat: 'tracks', rar: 5, price: 0, text: 'Продвинутый материал для Следов. Победа держится на бесчисленных неудачах, и каждый маленький шаг вёл к повороту судьбы.' };
  ITEMS.tears = { name: 'Слёзы мечтаний', kind: 'mat', mat: 'tears', rar: 4, price: 0, src: 'Снабжение: контракты Герты.', text: 'Запечатанные мысли и чувства. Заменяют материалы Пути для Следов, когда их не хватает: 1 слеза за материал 2★, 3 за 3★, 9 за 4★.' };
  ITEMS.shadow_dest = { name: 'Тень Разрушения', kind: 'mat', mat: 'shadow', path: 'destruction', rar: 5, price: 0, text: 'Повышает Эйдолон Первопроходца на Пути Разрушения.' };
  ITEMS.shadow_pres = { name: 'Тень Сохранения', kind: 'mat', mat: 'shadow', path: 'preservation', rar: 5, price: 0, text: 'Повышает Эйдолон Первопроходца на Пути Сохранения.' };
  Object.assign(H.ITEMS, ITEMS);

  const row = (cr, ft, fn, pt, pn, echo, tracks) => ({ cr, foe: ft ? [ft, fn] : null, path: pt ? [pt, pn] : null, echo: echo || 0, tracks: tracks || 0 });
  const COST = {
    4: {
      g2: row(2000, 1, 2), g3: row(4000, 1, 4, 1, 2), g4: row(8000, 2, 2, 2, 2), g5: row(16000, 2, 3, 2, 4), g6: row(24000, 2, 5, 2, 6), g7: row(36000, 3, 2, 3, 2),
      g8: row(64000, 3, 3, 3, 4, 1), g9: row(128000, 0, 0, 3, 6, 1), g10: row(240000, 0, 0, 3, 11, 1, 1), b6: row(128000, 3, 3, 3, 6),
      a2: row(4000, 0, 0, 1, 2, 1), a4: row(16000, 0, 0, 2, 4, 1, 1), a6: row(128000, 0, 0, 3, 6, 1, 1), s1: row(2000, 1, 2), s70: row(128000, 3, 6, 3, 6)
    },
    5: {
      g2: row(2500, 1, 3), g3: row(5000, 1, 6, 1, 3), g4: row(10000, 2, 3, 2, 3), g5: row(20000, 2, 4, 2, 5), g6: row(30000, 2, 6, 2, 7), g7: row(45000, 3, 3, 3, 3),
      g8: row(80000, 3, 4, 3, 5, 1), g9: row(160000, 0, 0, 3, 8, 1, 1), g10: row(300000, 0, 0, 3, 14, 1, 1), b6: row(160000, 3, 4, 3, 8),
      a2: row(5000, 0, 0, 1, 3, 1), a4: row(20000, 0, 0, 2, 5, 1, 1), a6: row(160000, 0, 0, 3, 8, 1, 1), s1: row(2500, 1, 2), s70: row(160000, 3, 8, 3, 8)
    }
  };

  const PHASE_LVL = [0, 20, 30, 40, 50, 60, 70];
  const CAP = { gen: [1, 2, 3, 4, 6, 8, 10], basic: [1, 1, 2, 3, 4, 5, 6] };
  const ABILITIES = [['basic', 'Атака', 6], ['skill', 'Навык', 10], ['ult', 'Абсолютная техника', 10], ['talent', 'Талант', 10]];
  const BONUS_GATE = { a2: 30, a4: 50, a6: 70 };
  const STAT_ROW = { 1: 's1', 30: 'g3', 40: 'g4', 50: 'g5', 60: 'g7', 70: 's70', 75: 's70', 80: 's70' };
  const BASIC_ROW = { 2: 'g3', 3: 'g4', 4: 'g5', 5: 'g7', 6: 'b6' };
  const TIERS = { atkP: [0.04, 0.06, 0.08], hpP: [0.04, 0.06, 0.08], ehr: [0.04, 0.06, 0.08], elation: [0.04, 0.06, 0.08], res: [0.04, 0.06, 0.08], defP: [0.05, 0.075, 0.1], critR: [0.027, 0.04, 0.053], critD: [0.053, 0.08, 0.107], breakE: [0.053, 0.08, 0.107], spd: [2, 3, 4] };
  for (const k of ['physP', 'fireP', 'iceP', 'elecP', 'windP', 'quantP', 'imagP']) TIERS[k] = [0.032, 0.048, 0.064];
  const STAT_TITLE = {
    atkP: 'Усиление атаки', hpP: 'Усиление HP', defP: 'Усиление защиты', critR: 'Усиление крит. шанса', critD: 'Усиление крит. урона', ehr: 'Усиление шанса попадания эффектов',
    res: 'Усиление сопротивления эффектам', breakE: 'Усиление пробития', spd: 'Усиление скорости', physP: 'Усиление физического урона', fireP: 'Усиление огненного урона',
    iceP: 'Усиление ледяного урона', elecP: 'Усиление электрического урона', windP: 'Усиление ветряного урона', quantP: 'Усиление квантового урона', imagP: 'Усиление мнимого урона', elation: 'Усиление Радости'
  };

  const phaseOf = lvl => { let p = 0; for (let i = 1; i < PHASE_LVL.length; i++) if (lvl >= PHASE_LVL[i]) p = i; return p; };
  const abilityCap = (ab, lvl) => (ab === 'basic' ? CAP.basic : CAP.gen)[phaseOf(lvl)];
  const abilityGate = (ab, to) => PHASE_LVL[(ab === 'basic' ? CAP.basic : CAP.gen).findIndex(c => c >= to)];

  function traceNodes(kitId) {
    const d = H.TRACES[kitId];
    if (!d) return [];
    const out = ABILITIES.map(([id, title, max]) => ({ id, kind: 'ability', title, max, gate: 1, pre: null }));
    out.push({ id: 'tech', kind: 'tech', title: 'Техника', max: 1, gate: 1, pre: null });
    d.bonus.forEach(([name, text, pre], i) => { const id = 'a' + (2 + 2 * i); out.push({ id, kind: 'bonus', title: name, text, max: 1, gate: BONUS_GATE[id], pre }); });
    d.stats.forEach(([stat, value, gate, pre], i) => out.push({ id: 's' + (i + 1), kind: 'stat', title: STAT_TITLE[stat], stat, value, max: 1, gate, pre }));
    return out;
  }

  function traceRow(kitId, node, to) {
    const d = H.TRACES[kitId], T = COST[d.cost];
    if (node === 'tech') return null;
    if (node === 'basic') return T[BASIC_ROW[to]] || null;
    if (node === 'skill' || node === 'ult' || node === 'talent') return to >= 2 && to <= 10 ? T['g' + to] : null;
    if (BONUS_GATE[node]) return T[node];
    const s = d.stats[+node.slice(1) - 1];
    return s ? T[STAT_ROW[s[2]]] : null;
  }

  function traceCost(kitId, node, to, raw) {
    const d = H.TRACES[kitId], r = traceRow(kitId, node, to || 1);
    if (!d || !r) return null;
    const items = {};
    const add = (id, n) => { if (n) items[id] = (items[id] || 0) + n; };
    if (r.foe) add(d.mats[1] + r.foe[0], r.foe[1]);
    if (r.path) add(d.mats[0] + r.path[0], r.path[1]);
    add(d.mats[2], r.echo);
    add('tracks', r.tracks);
    return { credits: raw ? r.cr : Math.round(r.cr * H.TUNING.trCredit), items };
  }

  const TEAR_RATE = { 2: 1, 3: 3, 4: 9 };
  function tearsFor(items, inv) {
    let n = 0;
    for (const [m, need] of Object.entries(items)) {
      const it = H.ITEMS[m], miss = need - (inv[m] || 0);
      if (miss > 0 && it.mat === 'path') n += miss * TEAR_RATE[it.rar];
    }
    return n;
  }

  if (H.TUNING.trCredit == null) H.TUNING.trCredit = 0.2;
  if (H.TUNING.trLevels == null) H.TUNING.trLevels = true;
  if (!H.TUNING.trFoeHp) H.TUNING.trFoeHp = [0.62, 0.62, 0.7, 0.74, 0.8, 0.95, 1];
  if (!H.TUNING.trFoeAtk) H.TUNING.trFoeAtk = [0.85, 0.85, 0.88, 0.9, 0.93, 0.97, 1];

  const ABIL_IDS = ABILITIES.map(a => a[0]);
  const REF = { basic: 6, skill: 10, ult: 10, talent: 10 };
  const CURVE = {
    basic: [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1],
    skill: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8125, 0.875, 0.9375, 1, 1.05, 1.1],
    ult: [0.6, 0.64, 0.68, 0.72, 0.76, 0.8, 0.85, 0.9, 0.95, 1, 1.04, 1.08],
    support: [0.6667, 0.7083, 0.75, 0.7917, 0.8333, 0.8667, 0.9, 0.9333, 0.9667, 1, 1.0333, 1.0667]
  };
  const SCALED = {
    dmg: ['m', 'adj', 'plusDef', 'adjDef', 'hpM', 'tallyM', 'adjHp', 'adjTally', 'vsSlow'], heal: ['m', 'flat'], hot: ['m', 'flat'], shield: ['m', 'flat'], dot: ['m'], drain: ['m'],
    ilStrike: ['m', 'adj'], tzStrike: ['m'], castigation: ['m', 'bonus'], wave: ['m'], polarity: ['m'], svarogMarked: ['m'], swing: ['m']
  };
  const SUPPORT_FX = new Set(['heal', 'hot', 'shield']);

  function traceRatio(ab, lv, support) {
    const curve = ab === 'basic' ? CURVE.basic : support ? CURVE.support : CURVE[ab];
    if (!curve) return 1;
    const i = clampI(lv, 1, curve.length) - 1;
    return curve[i] / curve[REF[ab] - 1];
  }
  function clampI(v, a, b) { return Math.max(a, Math.min(b, Math.round(v) || a)); }

  function kitRatio(kit, which, lv) {
    const c = kit && H.TRACES[kit] && H.TRACES[kit].curves && H.TRACES[kit].curves[which];
    return c ? c[clampI(lv, 1, c.length) - 1] / c[REF[which] - 1] : null;
  }

  function scaleAb(ab, which, lv, kit) {
    if (!ab || !ab.fx || !REF[which] || which === 'talent') return ab;
    const own = kitRatio(kit, which, lv), r = own != null ? own : traceRatio(which, lv), rs = own != null ? own : traceRatio(which, lv, true);
    if (r === 1 && rs === 1) return ab;
    const cache = ab.traced || Object.defineProperty(ab, 'traced', { value: new Map() }).traced, key = which + lv + (own != null ? kit : '');
    if (!cache.has(key)) cache.set(key, Object.assign({}, ab, {
      fx: ab.fx.map(f => {
        if (f.fixed) return f;
        const extra = !SCALED[f.k] && H.TRACES[kit] && H.TRACES[kit].scaled && H.TRACES[kit].scaled[f.k];
        const keys = SCALED[f.k] || (extra && (Array.isArray(extra) ? extra : extra.keys));
        if (!keys) return f;
        const cv = extra && extra.curve && (Array.isArray(extra.curve) ? extra.curve : extra.curve[which]);
        const k = cv ? cv[clampI(lv, 1, cv.length) - 1] / cv[REF[which] - 1] : SUPPORT_FX.has(f.k) ? rs : r, g = Object.assign({}, f);
        for (const p of keys) if (typeof g[p] === 'number') g[p] = g[p] * k;
        return g;
      })
    }));
    return cache.get(key);
  }

  const freshTrace = () => ({ lv: { basic: 1, skill: 1, ult: 1, talent: 1 }, on: [] });
  const eidFx = kitId => !!(H.TRACES[kitId] && H.TRACES[kitId].eidFx);

  function eidUp(kitId, eid) {
    const out = { basic: 0, skill: 0, ult: 0, talent: 0 }, d = H.TRACES[kitId];
    if (!d || !d.eidFx) return out;
    for (const [n, up] of Object.entries(d.up)) if ((eid || 0) >= +n) for (const [ab, v] of Object.entries(up)) out[ab] += v;
    return out;
  }

  function preset(kitId, lvl, all) {
    const t = freshTrace();
    for (const ab of ABIL_IDS) t.lv[ab] = all ? ABILITIES.find(a => a[0] === ab)[2] : abilityCap(ab, lvl);
    let added = true;
    while (added) {
      added = false;
      for (const n of traceNodes(kitId)) {
        if ((n.kind !== 'bonus' && n.kind !== 'stat') || t.on.includes(n.id)) continue;
        if ((all || lvl >= n.gate) && (!n.pre || t.on.includes(n.pre))) { t.on.push(n.id); added = true; }
      }
    }
    return t;
  }

  const T = () => H.TUNING;
  if (H.TUNING.lootElite == null) H.TUNING.lootElite = 2;
  if (!H.TUNING.treasure) H.TUNING.treasure = [3000, 6000, 12000, 20000];
  const FOE_OF_FAMILY = { spawn: 'core', voidranger: 'legion', silvermane: 'silver', shade: 'silver', automaton: 'ancient' };
  const LOOT = [
    { upTo: 19, odds: [0.7, 0, 0] },
    { upTo: 39, odds: [0.5, 0.35, 0] },
    { upTo: Infinity, odds: [0.3, 0.45, 0.15] }
  ];
  const CALYX_PATH = [
    [[3, 4], null, null],
    [[3, 4], [1, 2], null],
    [[2, 3], [2, 3], [1, 1]],
    [[2, 3], [3, 4], [3, 4]]
  ];
  const CALYX_FOE = [
    [[2, 2], null, null],
    [[2, 2], [1, 1], null],
    [[1, 1], [2, 2], null],
    [null, [2, 2], [1, 1]]
  ];
  const ECHO_N = [[1, 1], [1, 1], [2, 2], [2, 3]];
  const ECHO_LIMIT = 3;
  const FIRST_CLEAR = { doomsday: 'echo_doom', cocolia2: 'echo_lament' };
  const SYNTH_LINES = Object.assign(Object.fromEntries(Object.keys(PATH_LINES).map(k => [k, 'path'])), Object.fromEntries(Object.keys(FOE_LINES).map(k => [k, 'foe'])));

  const MAIL = {
    id: 'v16_traces', from: H.BRAND.team, title: 'Патч 1.6: Следы и Эйдолоны',
    give: { credits: 20000, items: Object.fromEntries(Object.keys(PATH_LINES).concat(Object.keys(FOE_LINES)).map(line => [line + '1', 3])) },
    text: [
      'Уважаемый Первопроходец!',
      'В меню «Персонажи» появился раздел «Следы». В нём растут уровни атаки, навыка, абсолютной техники и таланта, открываются доп. способности и прибавки к характеристикам. Световой конус по-прежнему меняют в разделе «Детали».',
      'Материалы для Следов остаются после врагов, растут в багровых чашелистах и выпадают в Эхе войны. Багровые чашелисты Разрушения и Сохранения ждут вас на станции «Герта». Омни-синтезатор в Вагоне для вечеринок собирает из трёх материалов один более ценный и меняет два материала на один нужный.',
      'Эйдолоны теперь дают способности из оригинала. Героев переводим на новые Эйдолоны по одному, а пока у остальных Эйдолоны усиливают характеристики, как раньше.',
      'Следы героев, которые уже были в экипаже, открыты до потолка их уровня. Во вложении кредиты и по три материала каждого вида для начала.'
    ]
  };
  if (H.MAIL && !H.MAIL.some(m => m.id === MAIL.id)) H.MAIL.push(MAIL);

  H.TRACE_FX = H.TRACE_FX || {};
  Object.assign(H, { traceRatio, traceKitRatio: kitRatio, traceScaleAb: scaleAb, traceEidUp: eidUp, tracePreset: preset, TRACE_LOOT: LOOT, TRACE_CALYX_PATH: CALYX_PATH, TRACE_CALYX_FOE: CALYX_FOE, TRACE_ECHO_N: ECHO_N, TRACE_ECHO_LIMIT: ECHO_LIMIT, TRACE_FIRST_CLEAR: FIRST_CLEAR, TRACE_FOE_OF_FAMILY: FOE_OF_FAMILY });

  Object.assign(H.Game.prototype, {
    traceOf(key, kitId) {
      const r = this.state.roster[key];
      if (!r) return null;
      const kit = kitId || this.kitOf(key);
      if (!r.tr) r.tr = {};
      return r.tr[kit] || (r.tr[kit] = freshTrace());
    },

    traceKits(key) { return key === 'trail' ? ['trail', 'trail_p'] : [key]; },

    traceLevel(key, ab) {
      const r = this.state.roster[key], kit = this.kitOf(key);
      return this.traceOf(key).lv[ab] + eidUp(kit, r.eid)[ab];
    },

    traceNode(key, id) {
      const r = this.state.roster[key], kit = this.kitOf(key), n = traceNodes(kit).find(x => x.id === id);
      if (!r || !n) return null;
      const t = this.traceOf(key), out = { node: n, cur: 0, max: n.max, to: 0, gate: n.gate, cost: null, ok: false, why: null };
      if (n.kind === 'tech') return Object.assign(out, { cur: 1, why: 'max' });
      if (n.kind === 'ability') { out.cur = t.lv[id]; out.up = eidUp(kit, r.eid)[id]; }
      else out.cur = t.on.includes(id) ? 1 : 0;
      if (out.cur >= n.max) return Object.assign(out, { why: 'max' });
      out.to = out.cur + 1;
      if (n.kind === 'ability') out.gate = abilityGate(id, out.to);
      out.cost = traceCost(kit, id, out.to);
      const inv = this.state.inv.items;
      out.tears = tearsFor(out.cost.items, inv);
      if (r.lvl < out.gate) out.why = 'lvl';
      else if (n.pre && !t.on.includes(n.pre)) out.why = 'pre';
      else if (this.state.credits < out.cost.credits) out.why = 'credits';
      else if (Object.entries(out.cost.items).some(([m, c]) => (inv[m] || 0) < c && H.ITEMS[m].mat !== 'path') || out.tears > (inv.tears || 0)) out.why = 'mats';
      out.ok = !out.why;
      return out;
    },

    canTrace(key, id) { const st = this.traceNode(key, id); return !!(st && st.ok); },

    trace(key, id) {
      const st = this.traceNode(key, id);
      if (!st || !st.ok) return false;
      const s = this.state, t = this.traceOf(key);
      s.credits -= st.cost.credits;
      const pay = Object.assign({}, st.cost.items);
      if (st.tears) { for (const m of Object.keys(pay)) if (H.ITEMS[m].mat === 'path') pay[m] = Math.min(pay[m], s.inv.items[m] || 0); pay.tears = st.tears; }
      for (const [m, c] of Object.entries(pay)) { if (!c) continue; s.inv.items[m] -= c; if (!s.inv.items[m]) delete s.inv.items[m]; }
      if (st.node.kind === 'ability') t.lv[id] = st.to;
      else t.on.push(id);
      this.clampHp(key);
      this.emit({ t: 'trace', key, id, lv: st.to });
      return true;
    },

    traceStats(key) {
      const kit = this.kitOf(key), r = this.state.roster[key];
      if (!r || !H.TRACES[kit]) return [];
      const on = r.guest ? preset(kit, r.lvl).on : this.traceOf(key).on;
      return traceNodes(kit).filter(n => n.kind === 'stat' && on.includes(n.id)).map(n => [n.stat, n.value]);
    },

    traceSpec(key, floor) {
      const r = this.state.roster[key], kit = this.kitOf(key);
      if (!H.TRACES[kit]) return null;
      let t = r.guest ? preset(kit, r.lvl) : this.traceOf(key);
      if (floor && floor > r.lvl) {
        const f = preset(kit, floor);
        t = { lv: Object.fromEntries(ABIL_IDS.map(ab => [ab, Math.max(t.lv[ab], f.lv[ab])])), on: [...new Set(t.on.concat(f.on))] };
      }
      const up = eidUp(kit, r.eid);
      return Object.assign(Object.fromEntries(ABIL_IDS.map(ab => [ab, t.lv[ab] + up[ab]])), { on: t.on.slice() });
    },

    traceTrialSpec(kitId, lvl) {
      const t = preset(kitId, lvl);
      return Object.assign({}, t.lv, { on: t.on });
    },

    fillTraces(key, mode) {
      const r = this.state.roster[key];
      if (!r) return false;
      for (const kit of this.traceKits(key)) {
        if (!H.TRACES[kit]) continue;
        if (!r.tr) r.tr = {};
        r.tr[kit] = mode === 'reset' ? freshTrace() : preset(kit, r.lvl, mode === 'all');
      }
      this.clampHp(key);
      return true;
    },

    autoTraces(key) {
      const kit = this.kitOf(key), ids = traceNodes(kit).filter(n => n.kind !== 'tech').map(n => n.id);
      const rank = st => (st.node.kind === 'ability' ? 0 : st.node.kind === 'bonus' ? 1 : 2) * 1e9 + st.cost.credits;
      let n = 0;
      for (;;) {
        const ready = ids.map(id => this.traceNode(key, id)).filter(st => st && st.ok).sort((a, b) => rank(a) - rank(b));
        if (!ready.length) return n;
        this.trace(key, ready[0].node.id);
        n++;
      }
    },

    useShadow(id) {
      const it = H.ITEMS[id], s = this.state, r = s.roster.trail;
      if (!it || it.mat !== 'shadow' || !r || !(s.inv.items[id] > 0)) return false;
      const kit = it.path === 'destruction' ? 'trail' : 'trail_p';
      if (kit === s.mcPath) {
        if (r.eid >= 6) return false;
        if (r.eidSeen == null) r.eidSeen = r.eid;
        r.eid++;
      } else {
        r.eidBy = r.eidBy || {};
        if ((r.eidBy[kit] || 0) >= 6) return false;
        r.eidBy[kit] = (r.eidBy[kit] || 0) + 1;
      }
      s.inv.items[id]--;
      if (!s.inv.items[id]) delete s.inv.items[id];
      return true;
    },

    fixTraces(old) {
      const s = this.state;
      if (old) {
        for (const key of Object.keys(s.roster)) if (!s.roster[key].guest) this.fillTraces(key, 'cap');
        const back = {}, add = (id, n) => { if (n) back[id] = (back[id] || 0) + n; };
        for (const lvl of s.tlGot || []) for (const [id, n] of Object.entries((H.TL_TRACE_ITEMS || {})[lvl] || {})) add(id, n);
        for (const [enc, id] of Object.entries(FIRST_CLEAR)) if (s.flags['first_' + enc]) { add(id, 2); s.flags['tr_first_' + enc] = true; }
        if (s.flags.rumor_echo) add('echo_doom', 2);
        add('shadow_pres', (s.mcPath === 'trail_p' || s.flags.ending ? 1 : 0) + (s.flags.ending ? 1 : 0));
        for (const w of [3, 4]) if (s.flags['su_clear_' + w]) add('tracks', 1);
        if (Object.keys(back).length) { this.give({ items: back }); s.trBack = back; }
      }
      s.trv = 1;
    },

    traceRoll(r) { return r ? r[0] + this.rng.int(r[1] - r[0] + 1) : 0; },

    traceBattleLoot(b, ctx) {
      const s = this.state, rw = b.result && b.result.reward, items = {};
      const add = (id, n) => { if (n > 0) items[id] = (items[id] || 0) + n; };
      if (rw && !ctx.calyx && !b.opts.su && !b.opts.fh) for (const f of rw.foes || []) {
        const line = FOE_OF_FAMILY[f.fam];
        if (!line || f.boss) continue;
        const odds = LOOT.find(x => f.lvl <= x.upTo).odds;
        for (let n = 0; n < (f.elite ? T().lootElite : 1); n++) odds.forEach((p, i) => { if (this.rng() < p) add(line + (i + 1), 1); });
      }
      const fc = FIRST_CLEAR[ctx.encId];
      if (fc && !s.flags['tr_first_' + ctx.encId]) { s.flags['tr_first_' + ctx.encId] = true; add(fc, 2); }
      return Object.keys(items).length ? this.give({ items }) : [];
    },

    traceCalyx(c, tier) {
      const items = {}, add = (id, n) => { if (n > 0) items[id] = (items[id] || 0) + n; };
      if (c.reward === 'path') {
        const line = Object.keys(PATH_LINES).find(k => PATH_LINES[k][0] === c.path);
        CALYX_PATH[tier].forEach((r, i) => add(line + (i + 1), this.traceRoll(r)));
      } else if (c.reward === 'echo' && c.mat) add(c.mat, this.traceRoll(ECHO_N[tier]));
      else if (c.pool) {
        const lines = c.pool.map(id => H.ENEMIES[id] && FOE_OF_FAMILY[H.ENEMIES[id].fam]).filter(Boolean);
        if (lines.length) { const line = lines[this.rng.int(lines.length)]; CALYX_FOE[tier].forEach((r, i) => add(line + (i + 1), this.traceRoll(r))); }
      }
      return Object.keys(items).length ? this.give({ items }) : [];
    },

    echoSync() {
      const s = this.state, h = Math.floor(this.now() / 3600000);
      if (!s.echo || s.echo.hour !== h) s.echo = { hour: h, n: 0 };
      return s.echo;
    },

    echoLeft() { return Math.max(0, ECHO_LIMIT - this.echoSync().n); },

    echoClaim() {
      if (!this.echoLeft()) return false;
      this.echoSync().n++;
      return true;
    },

    synthList() {
      const out = [];
      for (const [line, kind] of Object.entries(SYNTH_LINES)) for (const t of [1, 2]) out.push({ kind, from: line + t, to: line + (t + 1), n: 3 });
      return out;
    },

    synth(from, times) {
      const it = H.ITEMS[from], k = Math.max(1, times || 1), inv = this.state.inv.items;
      if (!it || it.kind !== 'mat' || !SYNTH_LINES[it.line] || it.tier > 2 || (inv[from] || 0) < 3 * k) return false;
      const to = it.line + (it.tier + 1);
      inv[from] -= 3 * k;
      if (!inv[from]) delete inv[from];
      inv[to] = (inv[to] || 0) + k;
      return true;
    },

    exchangeOk(from, to) {
      const a = H.ITEMS[from], b = H.ITEMS[to];
      return !!(a && b && from !== to && a.kind === 'mat' && b.kind === 'mat' && a.mat === b.mat && (a.mat === 'path' || a.mat === 'foe') && a.tier === b.tier);
    },

    exchange(from, to, times) {
      const k = Math.max(1, times || 1), inv = this.state.inv.items;
      if (!this.exchangeOk(from, to) || (inv[from] || 0) < 2 * k) return false;
      inv[from] -= 2 * k;
      if (!inv[from]) delete inv[from];
      inv[to] = (inv[to] || 0) + k;
      return true;
    }
  });

  Object.assign(H.Battle.prototype, {
    traceLv(u, ab) { return u.tr ? u.tr[ab] : REF[ab]; },

    hasBonus(u, id) { return !u.tr || u.tr.on.includes(id); },

    traceTalent(u) {
      if (!H.TUNING.trLevels || !u.tr) return 1;
      const own = kitRatio(u.charId, 'talent', u.tr.talent);
      return own != null ? own : traceRatio('skill', u.tr.talent);
    },

    kitFx(u, ev, a, b, c, d) {
      const f = u && H.TRACE_FX && H.TRACE_FX[u.charId];
      return f && f[ev] ? f[ev](this, u, a, b, c, d) : undefined;
    },

    traceStart() { for (const a of this.allies) if (a.hp > 0) this.kitFx(a, 'start'); },

    traceDmg(src, tgt, o) {
      if (!src || src.side !== 'ally') return 0;
      let v = this.kitFx(src, 'dmg', tgt, o) || 0;
      for (const a of this.allies) if (a.hp > 0 && !a.dead) v += this.kitFx(a, 'teamDmg', src, tgt, o) || 0;
      return v;
    },

    traceCrit(src, tgt, o) { return (src && src.side === 'ally' && this.kitFx(src, 'crit', tgt, o)) || 0; },

    traceFoe(list) {
      const T = H.TUNING;
      if (!T.trLevels || !T.trFoeHp || !this.allies.some(a => a.tr)) return;
      for (const u of list) {
        const p = phaseOf(u.lvl), hp = Math.round(u.maxHp * T.trFoeHp[p]);
        u.maxHp = hp; u.hp = hp;
        u.base.atk *= T.trFoeAtk[p];
      }
    },

    eidOn(u, n) { return (u.eid || 0) >= n && eidFx(u.charId); },

    traceAb(u, ab, kind) {
      const which = kind === 'enhanced' ? 'basic' : kind;
      if (!H.TUNING.trLevels || !u.tr || !REF[which] || which === 'talent') return ab;
      return scaleAb(ab, which, u.tr[which], u.charId);
    }
  });

  Object.assign(H, {
    TRACE_PATH_LINES: PATH_LINES, TRACE_FOE_LINES: FOE_LINES, TRACE_ECHOES: ECHOES, TRACE_COST: COST, TRACE_TIERS: TIERS, TRACE_PHASE_LVL: PHASE_LVL,
    TRACE_CAP: CAP, TRACE_ABILITIES: ABILITIES, TRACE_BONUS_GATE: BONUS_GATE, TRACE_STAT_TITLE: STAT_TITLE,
    tracePhase: phaseOf, TEAR_RATE, traceTears: tearsFor, traceAbilityCap: abilityCap, traceAbilityGate: abilityGate, traceNodes, traceCost
  });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
