(function (H) {
  'use strict';
  const CW = H.CW, TUN = CW.TUN;
  const { alive } = H.battleStat;
  const GP = H.Game.prototype, BP = H.Battle.prototype;
  const rnd = run => CW.rnd(run);
  const pick = (run, arr) => arr[Math.floor(rnd(run) * arr.length)];
  const BOND_KEYS = Object.keys(CW.BONDS).filter(k => CW.BONDS[k].kind !== 'special');
  const gold = (run, n) => { run.gold += n; run.earned += Math.max(0, n); };
  const pay = (rec, n, why) => { if (!n) return; rec.bondGold += n; rec.coins += n; rec.bondLines.push(why + ': +' + n); };
  const perfect = (rec, f) => rec.win && !f.near && rec.kind !== 'reward';

  function give(g, run, id, star) {
    if (!id) return null;
    const need = Math.pow(3, (star || 1) - 1);
    if ((star || 1) <= 1) { if (!(run.pool[id] > 0) || !g.cwRoomFor(run, id)) return null; return g.cwGive(run, id); }
    const at = CW.benchFree(run);
    if (run.pool[id] < need || at < 0) return null;
    run.pool[id] -= need;
    const u = { uid: ++run.uid, id, star };
    run.board.bench[at] = u;
    return { u, merged: g.cwMerge(run) };
  }
  const giveCost = (g, run, cost, star) => give(g, run, g.cwDraw(run, cost), star);
  const member = (g, run, k) => { const ids = CW.POOL.filter(id => CW.UNITS[id].bonds.includes(k) && run.pool[id] > 0); return ids.length ? give(g, run, pick(run, ids), 1) : null; };

  const ENVS = {
    gunpowder: { name: 'Запах пороха', text: 'Старт с 2 «Ящиками с простым вооружением».', take(g, run) { g.cwGift(run, 'armsBox'); g.cwGift(run, 'armsBox'); } },
    privileged: { name: 'Привилегированный класс', text: '«Ящик с особым вооружением» в начале измерения 2.', plane(g, run) { if (run.plane === 1) g.cwInvAdd(run, 'boxSpecial'); } },
    emission: { name: 'Эмиссия денег', text: 'Руда на 6 / 8 / 12 монет в начале каждого измерения.', take(g, run) { gold(run, 6); }, plane(g, run) { gold(run, [6, 8, 12][Math.min(2, run.plane)]); } },
    arena: { name: 'Затонувшая арена', text: '«Самоцвет богатства» за первую серию из 5 побед.', after(g, run, rec, st) { if (!st.done && run.streak >= 5) { st.done = true; g.cwInvAdd(run, 'gem'); rec.bondLines.push('Затонувшая арена: самоцвет'); } } },
    overheat: { name: 'Перегрев экономики', text: 'Все узлы наград со свинками-копилками: добычи в полтора раза больше.', after(g, run, rec) { if (rec.kind === 'reward' && !rec.harvest) pay(rec, Math.round((rec.coins - (rec.bondGold || 0)) * 0.5), 'Свинки-копилки'); } },
    secondHand: { name: 'Секонд-хенд', text: 'После 20 обновлений магазина 30 монет и «Проектор сотрудника».', refresh(g, run, st) { st.n = (st.n || 0) + 1; if (st.n === 20) { gold(run, 30); g.cwInvAdd(run, 'projector'); } } },
    accident: { name: 'Страхование от несчастных случаев', text: 'Перед каждым боссом ещё одно снабжение.', nodes(g, run) { const bi = run.nodes.indexOf('boss'); if (bi > 0 && run.nodes[bi - 1] !== 'supply') { run.nodes.splice(bi, 0, 'supply'); run.nodeOpp.splice(bi, 0, null); run.frenzy = run.frenzy.map(i => (i >= bi ? i + 1 : i)); } } },
    overfund: { name: 'Избыточное финансирование', text: 'В снабжении у героев по 2 предмета.' },
    talents: { name: 'Привлечение талантов', text: 'Старт со случайным героем стоимости 4.', take(g, run) { giveCost(g, run, 4, 1); } },
    ageP: { name: 'Радужный век', age: 'p', text: 'Все стратегии партии призматические.' },
    ageG: { name: 'Золотой век', age: 'g', text: 'Все стратегии партии золотые.' },
    ageS: { name: 'Серебряный век', age: 's', text: 'Все стратегии партии серебряные, сложность от них не растёт.' },
    blueOcean: { name: 'Синий океан', text: 'Случайная среда и 6 монет.', take(g, run) { gold(run, 6); const pool = Object.keys(ENVS).filter(k => k !== 'blueOcean' && !(run.envs || []).includes(k)); g.cwTakeEnvId(run, pick(run, pool)); } },
    rotation: { name: 'Ротация', text: 'В каждом этапе подготовки у случайной стоимости шанс в магазине вдвое выше.', node(g, run) { run.rotCost = 1 + Math.floor(rnd(run) * 5); } },
    peppy3: { name: 'Пеппи 3★', text: 'Пеппи с тремя случайными эмблемами.', take(g, run) { const sp = g.cwSpecial(run), pool = Object.keys(CW.ITEMS).filter(k => CW.ITEMS[k].kind === 'emblem'); sp.peppyPerm = Math.max(sp.peppyPerm || 0, 3); for (let i = 0; i < 3 && pool.length; i++) sp.peppy.push({ uid: ++run.iuid, id: pool.splice(Math.floor(rnd(run) * pool.length), 1)[0], sp: false, perm: true }); } },
    warFront: { name: 'Рубеж войны', text: 'Все битвы измерения 3 становятся встречами.', nodes(g, run) { if (run.plane === 2) run.nodes = run.nodes.map(k => (k === 'fight' ? 'enc' : k)); } },
    longGain: { name: 'Долгосрочная выгода', text: 'После 30 платных обновлений 20 монет, дальше обновление стоит 1.', paid(g, run, st) { st.n = (st.n || 0) + 1; if (st.n === 30) { gold(run, 20); run.cheapRefresh = true; } } },
    sediment: { name: 'Осадка талантов', text: 'В магазине бывают 2★ герои.' },
    coDecision: { name: 'Совместное решение', text: 'В узле 2-6 ещё одна стратегия (не в Быстрой игре).', node(g, run, st) { if (!st.done && run.mode !== 'quick' && run.plane === 1 && run.node === 5) { st.done = true; g.cwStratQueue(run, g.cwStratRollQ(run), 0, run.step); } } },
    jackpot: { name: 'Джекпот', text: 'Первая стратегия призматическая.', first: 0 },
    lastChance: { name: 'Последний шанс', text: 'Третья стратегия призматическая.', first: 2 },
    redAristo: { name: 'Аристократ красного алмаза', text: 'Старт с красным алмазом и «Ящиком с простым вооружением».', take(g, run) { g.cwInvAdd(run, 'red'); g.cwGift(run, 'armsBox'); } },
    blueAristo: { name: 'Аристократ синего алмаза', text: 'Старт с синим алмазом и «Ящиком с простым вооружением».', take(g, run) { g.cwInvAdd(run, 'blue'); g.cwGift(run, 'armsBox'); } },
    heroExit: { name: 'Выход героя', text: '2★ герой стоимости 5, которого можно выставить через 19 узлов; каждая идеальная победа приближает срок на 1.', take(g, run) { const got = giveCost(g, run, 5, 2); if (got && got.u) got.u.lockN = 19; }, node(g, run) { for (const x of g.cwUnits(run)) if (x.u.lockN > 0) x.u.lockN--; }, after(g, run, rec, st, f) { if (perfect(rec, f)) for (const x of g.cwUnits(run)) if (x.u.lockN > 0) x.u.lockN--; } },
    fate: { name: 'Подарок судьбы', text: '«Коробка-сюрприз», открывается через 12 узлов; идеальная победа приближает срок на 1.', take(g, run, st) { st.left = 12; }, node(g, run, st) { if (st.left > 0 && --st.left === 0) g.cwFateOpen(run); }, after(g, run, rec, st, f) { if (st.left > 0 && perfect(rec, f) && --st.left === 0) g.cwFateOpen(run); } },
    tricolor: { name: 'Золото, серебро, призма', text: 'При выборе стратегий левая карточка серебряная, средняя золотая, правая призматическая, +2 обновления.' },
    powerUp: { name: 'Повышение боевой мощи', text: '2★ герой стоимости 1, который в каждом узле навсегда получает случайную прибавку.', take(g, run) { const got = giveCost(g, run, 1, 2); if (got && got.u) got.u.grow = { pow: 0, hp: 0, spd: 0 }; }, node(g, run) { g.cwGrowUnits(run); } },
    powerBurst: { name: 'Всплеск боевой мощи', text: '2★ герой стоимости 2, который в каждом узле навсегда получает случайную прибавку.', take(g, run) { const got = giveCost(g, run, 2, 2); if (got && got.u) got.u.grow = { pow: 0, hp: 0, spd: 0 }; }, node(g, run) { g.cwGrowUnits(run); } },
    luckyExp: { name: 'Удачный опыт', text: 'После 8-го уровня 3 узла подряд по 12 опыта.', node(g, run, st) { if (st.left == null && run.lvl >= 8) st.left = 3; if (st.left > 0) { st.left--; g.cwAddExp(run, 12); } } },
    reserve: { name: 'Резерв талантов', text: 'Стартовые герои: 3 случайных стоимости 3. Их 2★/3★ дают +11/33% скорости и +22/66% урона.', take(g, run) { for (const z of ['on', 'off', 'bench']) run.board[z].forEach((u, i) => { if (u) { run.pool[u.id] += Math.pow(3, u.star - 1); run.board[z][i] = null; } }); run.reserveIds = []; for (let i = 0; i < 3; i++) { const id = g.cwDraw(run, 3); if (!id) continue; run.pool[id]--; run.reserveIds.push(id); const z = CW.UNITS[id].pos === 'off' ? 'off' : 'on'; run.board[z][run.board[z].indexOf(null)] = { uid: ++run.uid, id, star: 1 }; } } },
    evolution: { name: 'Алгоритм эволюции', text: 'В каждом узле герои поля навсегда получают +4% обеих сил и +2% понижения урона.', node(g, run) { for (const u of run.board.on) if (u) u.evo = (u.evo || 0) + 1; } },
    rearKill: { name: 'Уничтожение тыла', text: 'Один аффикс врагов отключён на всю партию.', take(g, run) { const list = (run.affixes || []).slice().sort((a, b) => CW.AFFIXES[b].danger - CW.AFFIXES[a].danger); run.affixOff = list.length ? [list[0]] : []; } },
    stratMaster: { name: 'Мастер стратегий', text: 'Каждая стратегия даёт 2 × (число стратегий) монет. В узле 3-5 ещё одна стратегия.', node(g, run, st) { if (!st.done && run.plane === 2 && run.node === 4) { st.done = true; g.cwStratQueue(run, g.cwStratRollQ(run), 0, run.step); } } },
    contractHunters: { name: 'Контракт «Охотники за Стелларонами»', text: 'Старт с Кафкой. После боя, где вместе дрались Кафка, Блэйд и Волк, Блэйд 2★.', take(g, run) { give(g, run, 'kafka', 1); }, after(g, run, rec, st, f) { const ids = (f.so2 && f.so2.ids) || []; if (!st.done && ['kafka', 'blade', 'silverwolf'].every(id => ids.includes(id))) { st.done = true; give(g, run, 'blade', 2); rec.bondHeroes.push(H.CHARS.blade.name + ' 2★'); } } },
    contractInaba: { name: 'Контракт «Команда расследования»', text: 'Старт с Ёсуке и Чие. После 10 «Ещё раз!» за партию: Ю.', take(g, run) { give(g, run, 'yosuke', 1); give(g, run, 'chie', 1); }, after(g, run, rec, st, f) { st.n = (st.n || 0) + ((f.so2 && f.so2.oneMore) || 0); if (!st.done && st.n >= 10) { st.done = true; give(g, run, 'yu', 1); rec.bondHeroes.push(H.CHARS.yu.name); } } },
    contractKazuma: { name: 'Контракт «Отряд Казумы»', text: 'Старт с Казумой. После 3 «Удачных дней»: Аква, после 6: Мегумин.', take(g, run) { give(g, run, 'kazuma', 1); }, after(g, run, rec, st, f) { st.n = (st.n || 0) + ((f.so2 && f.so2.days) || 0); if (!st.a && st.n >= 3) { st.a = true; give(g, run, 'aqua', 1); rec.bondHeroes.push(H.CHARS.aqua.name); } if (!st.m && st.n >= 6) { st.m = true; give(g, run, 'megumin', 1); rec.bondHeroes.push(H.CHARS.megumin.name); } } },
    contractConton: { name: 'Контракт «Кон-Тон»', text: 'Старт с Макото. После 4 «Выходов на бис»: Аманда и Таллея 1★.', take(g, run) { give(g, run, 'makoto', 1); }, after(g, run, rec, st, f) { st.n = (st.n || 0) + ((f.so2 && f.so2.encores) || 0); if (!st.done && st.n >= 4) { st.done = true; give(g, run, 'amanda', 1); give(g, run, 'talleah', 1); rec.bondHeroes.push(H.CHARS.amanda.name, H.CHARS.talleah.name); } } },
    contractDot: { name: 'Контракт «Периодический урон»', text: 'Старт с Сампо и Кафкой. За каждого врага, павшего с разными видами периодического урона, счёт растёт; при 180: Янаги.', take(g, run) { give(g, run, 'sampo', 1); give(g, run, 'kafka', 1); }, after(g, run, rec, st, f) { st.n = (st.n || 0) + ((f.so2 && f.so2.dot) || 0); if (!st.done && st.n >= 180) { st.done = true; give(g, run, 'yanagi', 1); rec.bondHeroes.push(H.CHARS.yanagi.name); } } }
  };

  for (const k of BOND_KEYS) {
    const name = CW.BOND_NAMES[k];
    ENVS['unique_' + k] = { name: 'Уникальные акции «' + name + '»', bond: k, text: 'Старт с героем связи и простым предметом, герои связи в магазине чаще.', take(g, run) { member(g, run, k); g.cwGift(run, 'basic'); } };
    ENVS['invite_' + k] = { name: 'Приглашение «' + name + '»', bond: k, text: 'Эмблема связи «' + name + '».', take(g, run) { g.cwInvAdd(run, 'em_' + k); } };
  }

  const on = (run, id) => !!run && (run.envs || []).includes(id);
  const stOf = (run, id) => { run.envSt = run.envSt || {}; return run.envSt[id] || (run.envSt[id] = {}); };
  const each = (run, hook, fn) => { for (const id of (run.envs || []).slice()) { const E = ENVS[id]; if (E && E[hook]) fn(E, stOf(run, id), id); } };
  const ageOf = run => { const id = (run.envs || []).find(k => ENVS[k].age); return id ? ENVS[id].age : null; };

  Object.assign(GP, {
    cwEnvOn(run, id) { return on(run, id); },

    cwEnvDeal(run, n) {
      const keys = Object.keys(ENVS), fam = k => (ENVS[k].bond ? k.split('_')[0] : k), out = [];
      const pool = keys.slice();
      while (out.length < n && pool.length) {
        const k = pool.splice(Math.floor(rnd(run) * pool.length), 1)[0];
        if (ENVS[k].bond && out.some(x => fam(x) === fam(k))) continue;
        out.push(k);
      }
      const seen = (this.cw().seen.envs = this.cw().seen.envs || {});
      for (const k of out) seen[k] = seen[k] || 1;
      return out;
    },

    cwTakeEnvId(run, id) {
      const E = ENVS[id];
      if (!E || on(run, id)) return null;
      (run.envs = run.envs || []).push(id);
      const seen = (this.cw().seen.envs = this.cw().seen.envs || {});
      seen[id] = 2;
      if (E.take) E.take(this, run, stOf(run, id));
      if (E.nodes) E.nodes(this, run, stOf(run, id));
      return id;
    },

    cwTakeEnv(i) {
      const run = this.cwRun(), pk = run && run.envPick;
      if (!pk || !pk.opts[i]) return 'empty';
      const id = pk.opts[i];
      run.envPick = null;
      this.cwTakeEnvId(run, id);
      return { id };
    },

    cwFateOpen(run) {
      const o = this.cwOpenOres(run, ['ore3', 'ore2']), g0 = o.reduce((a, x) => a + x.gold, 0);
      gold(run, g0);
      run.fateOpened = o;
    },

    cwGrowUnits(run) {
      for (const x of this.cwUnits(run)) {
        const gr = x.u.grow;
        if (!gr) continue;
        const k = pick(run, ['pow', 'hp', 'spd']);
        gr[k] += { pow: 0.08, hp: 0.06, spd: 0.04 }[k];
      }
    }
  });

  const new0 = GP.cwNew;
  GP.cwNew = function (o = {}) {
    const run = new0.call(this, o);
    run.envPick = { opts: this.cwEnvDeal(run, 3) };
    return run;
  };

  const enter0 = GP.cwEnterPlane;
  GP.cwEnterPlane = function (run) {
    enter0.call(this, run);
    each(run, 'nodes', (E, st) => E.nodes(this, run, st));
  };

  const begin0 = GP.cwBeginNode;
  GP.cwBeginNode = function (run) {
    if (run.node === 0 && run.step > 0) each(run, 'plane', (E, st) => E.plane(this, run, st));
    each(run, 'node', (E, st) => E.node(this, run, st));
    return begin0.call(this, run);
  };

  const rollQ0 = GP.cwStratRollQ;
  GP.cwStratRollQ = function (run) {
    const age = ageOf(run);
    if (age) return age;
    const n = (run.strats || []).length + (run.stratQ || []).length + (run.stratPick ? 1 : 0);
    for (const id of run.envs || []) if (ENVS[id].first === n) return 'p';
    return rollQ0.call(this, run);
  };

  const takeStrat0 = GP.cwTakeStrat;
  GP.cwTakeStrat = function (i) {
    const run = this.cwRun();
    const r = takeStrat0.call(this, i);
    if (r && r.id && run && on(run, 'stratMaster')) gold(run, 2 * run.strats.length);
    return r;
  };

  const costRoll0 = GP.cwCostRoll;
  GP.cwCostRoll = function (run, lvl) {
    if (on(run, 'rotation') && run.rotCost) {
      const odds = TUN.shopOdds[Math.min(TUN.shopOdds.length - 1, lvl)], sum = odds.reduce((a, b) => a + b, 0), p = sum ? (odds[run.rotCost - 1] || 0) / sum : 0;
      const has = CW.POOL.some(id => CW.UNITS[id].cost === run.rotCost && run.pool[id] > 0);
      if (p > 0 && has && rnd(run) < p / (1 + p)) return run.rotCost;
    }
    return costRoll0.call(this, run, lvl);
  };

  const draw0 = GP.cwDraw;
  GP.cwDraw = function (run, cost, only) {
    const u = (run.envs || []).find(k => /^unique_/.test(k));
    if (u && !only && rnd(run) < 0.35) {
      const k = ENVS[u].bond, id = draw0.call(this, run, cost, d => d.bonds.includes(k));
      if (id) return id;
    }
    return draw0.call(this, run, cost, only);
  };

  const roll0 = GP.cwRollShop;
  GP.cwRollShop = function (run) {
    roll0.call(this, run);
    if (on(run, 'sediment')) run.shopStar = run.shop.map((id, i) => ((run.shopStar && run.shopStar[i] === 2) || (id && run.pool[id] >= 3 && rnd(run) < 0.1) ? 2 : 1));
  };

  const refresh0 = GP.cwRefresh;
  GP.cwRefresh = function () {
    const run = this.cwRun(), paid = run && !(run.free > 0);
    if (run && paid && run.cheapRefresh && this.cwPrepOpen(run) && !(run.noBuy != null && run.step < run.noBuy)) {
      if (run.gold < 1) return false;
      run.gold -= 1; run.spent += 1; run.free = 1;
    }
    const ok = refresh0.call(this);
    if (ok) { each(run, 'refresh', (E, st) => E.refresh(this, run, st)); if (paid) each(run, 'paid', (E, st) => E.paid(this, run, st)); }
    return ok;
  };

  const move0 = GP.cwMove;
  GP.cwMove = function (fz, fi, tz, ti) {
    const run = this.cwRun(), u = run && run.board[fz] && run.board[fz][fi];
    if (u && u.lockN > 0 && (tz === 'on' || tz === 'off')) return 'locked';
    return move0.call(this, fz, fi, tz, ti);
  };

  const place0 = GP.cwPlace;
  GP.cwPlace = function (fz, fi) {
    const run = this.cwRun(), u = run && run.board[fz] && run.board[fz][fi];
    if (u && u.lockN > 0 && fz === 'bench') return 'locked';
    return place0.call(this, fz, fi);
  };

  const takeOffer0 = GP.cwTakeOffer;
  GP.cwTakeOffer = function (i) {
    const run = this.cwRun(), r = takeOffer0.call(this, i);
    if (r && !r.full && on(run, 'overfund')) this.cwGift(run, 'basic');
    return r;
  };

  const rewards0 = GP.cwBondRewards;
  GP.cwBondRewards = function (run, rec) {
    rewards0.call(this, run, rec);
    const f = run.fight || {};
    each(run, 'after', (E, st) => E.after(this, run, rec, st, f));
  };

  const compile0 = GP.cwCompile;
  GP.cwCompile = function (run, kind) {
    const cw = compile0.call(this, run, kind);
    const byUid = {};
    for (const u of this.cwDeployed(run)) byUid[u.uid] = u;
    for (const cu of Object.values(cw.units)) {
      const u = byUid[cu.uid];
      if (!u) continue;
      let spd = 0;
      if (u.grow) { cu.powPlus += u.grow.pow; spd += u.grow.spd; }
      if (u.evo) { cu.powPlus += 0.04 * u.evo; cu.it.dr = (cu.it.dr || 0) + 0.02 * u.evo; }
      if ((run.reserveIds || []).includes(u.id) && u.star >= 2) { cu.hackAmp = (cu.hackAmp || 0) + [0, 0.22, 0.66][Math.min(2, u.star - 1)]; spd += [0, 0.11, 0.33][Math.min(2, u.star - 1)]; }
      const hpK = u.grow ? u.grow.hp : 0;
      if (spd || hpK) {
        const p = cw.party.find(x => x.cw === u.uid);
        if (p) { p.stats.spd = Math.round(p.stats.spd * (1 + spd) * 10) / 10; if (hpK) { p.stats.hp = Math.round(p.stats.hp * (1 + hpK)); p.hp = p.stats.hp; } }
        const o = cw.off.find(x => x.uid === u.uid);
        if (o) o.stats.spd = Math.round(o.stats.spd * (1 + spd) * 10) / 10;
      }
    }
    return cw;
  };

  const end0 = GP.cwEndBattle;
  GP.cwEndBattle = function (b, ctx, out) {
    const run = this.cw().run, I = b.cwInfo;
    if (run && run.fight && I) run.fight.so2 = { ids: Object.values(b.cw.units).map(u => u.id), oneMore: I.oneMoreN || 0, days: I.days || 0, encores: I.encores || 0, dot: I.dotKill || 0 };
    return end0.call(this, b, ctx, out);
  };

  const push0 = BP.push;
  BP.push = function (e) {
    if (this.cwInfo && e && e.t === 'oneMore') this.cwInfo.oneMoreN = (this.cwInfo.oneMoreN || 0) + 1;
    return push0.call(this, e);
  };

  const kitsKill0 = BP.cwKitsKill;
  BP.cwKitsKill = function (t, src) {
    kitsKill0.call(this, t, src);
    if (t && t.side === 'enemy' && t.dots && t.dots.length) this.cwInfo.dotKill = (this.cwInfo.dotKill || 0) + new Set(t.dots.map(d => d.type)).size * 10;
  };

  CW.ENVS = ENVS;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
