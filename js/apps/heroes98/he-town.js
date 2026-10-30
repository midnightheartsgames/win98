(function (H) {
  'use strict';
  const MD = H.MapData, T = H.TOWN;
  const U = id => H.UNITS[id];
  const F = o => H.FACTIONS[o.faction];
  const def = (o, id) => F(o).building[id];
  const has = (o, id) => o.built.includes(id);

  const RUMORS = [
    'Говорят, колокол Звонграда бьёт сам, когда в степи открывается курган.',
    'Мельник с брода клянётся, что тени боятся жерновов. Мельник клянётся во многом.',
    'Солевары жалуются: соль с солончака горчит третий месяц. Старики говорят, так горчат слёзы предков.',
    'В трактире спорили, сколько лун на небе. Сошлись на семи: восьмую трезвым никто не видел.',
    'Купцы Лиги платят за перо беркута втрое. Беркуты об этом не знают.',
    'На старой лунной дороге видели белые повозки. Кто их видел, дальше рассказывать не хочет.',
    'Каменные бабы в степи повернулись лицом к дельте. Пастухи уводят стада.',
    'Цех пушкарей ищет учеников. Условие одно: все пальцы на месте.',
    'Шаманка с белым бубном ходит от кургана к кургану и слушает землю.',
    'В лесу у брода пропадают лесорубы. Через неделю возвращаются бородатыми и довольными.',
    'Ходят слухи о Сердце Восьмой луны: камень, который светит без неба.',
    'Если звонарь ударит трижды, враг путается в ногах. Так говорят звонари.'
  ];

  const list = (S, pid) => S.map.objs.filter(o => o.t === 'town' && !o.gone && (pid == null || o.owner === pid));
  const byId = (S, id) => S.map.objs.find(o => o.id === id && o.t === 'town') || null;

  const price = unit => Object.assign({ gold: U(unit).cost }, U(unit).rare || {});
  const times = (cost, n) => Object.fromEntries(Object.entries(cost).map(([k, v]) => [k, v * n]));
  const afford = (res, cost) => Object.entries(cost).every(([k, v]) => res[k] >= v);
  const most = (res, cost) => Math.min(...Object.entries(cost).filter(([, v]) => v > 0).map(([k, v]) => Math.floor(res[k] / v)));
  const pay = (res, cost) => {
    for (const [k, v] of Object.entries(cost)) res[k] -= v;
  };
  const lack = (res, cost) => Object.fromEntries(Object.entries(cost).filter(([k, v]) => res[k] < v).map(([k, v]) => [k, v - res[k]]));

  const visitor = (S, o) => {
    const [c, r] = MD.entry(o);
    return S.heroes.find(h => h.alive && h.owner === o.owner && h.l === o.l && h.c === c && h.r === r) || null;
  };

  const goldOf = o => o.built.reduce((t, id) => t + ((def(o, id).income || {}).gold || 0), 0);

  const growth = (S, o, tier) => {
    let pct = (o.owner >= 0 ? H.Hero.growthPct(S, o.owner, tier) : 0) + H.Moons.growthPct(S), add = 0;
    for (const id of o.built) {
      const x = def(o, id);
      pct += x.growthPct || 0;
      add += (x.growth && x.growth[tier]) || 0;
    }
    const rival = o.owner >= 0 && !S.players[o.owner].human ? H.DIFFICULTY[S.difficulty].growth : 1;
    return Math.round(U(F(o).units[tier - 1][0]).growth * (1 + pct / 100) * rival) + add;
  };

  const forbidden = (S, o, x) => {
    if ((S.map.forbid || []).includes(x.id)) return 'запрещено на этой карте';
    if (x.water && !o.water) return 'город стоит не у воды';
    if (x.heart && !o.heart) return 'нужно Сердце Восьмой луны';
    if (x.capital && list(S, o.owner).some(t => t !== o && has(t, x.id))) return 'столица у вас уже есть';
    return '';
  };

  const state = (S, o, id) => {
    const x = def(o, id);
    if (has(o, id)) return { s: 'built' };
    const why = o.owner < 0 ? 'не ваш город' : forbidden(S, o, x);
    if (why) return { s: 'forbidden', why };
    const needs = x.needs.filter(n => !has(o, n));
    if (needs.length) return { s: 'needs', needs };
    if (o.today) return { s: 'today' };
    const miss = lack(S.players[o.owner].res, x.cost);
    return Object.keys(miss).length ? { s: 'money', miss } : { s: 'ok' };
  };

  const build = (S, o, id, branch) => {
    const st = state(S, o, id), x = def(o, id);
    if (st.s !== 'ok') return { ok: false, why: st.s, ev: [] };
    if (x.upgrade && branch !== 'a' && branch !== 'b') return { ok: false, why: 'branch', ev: [] };
    pay(S.players[o.owner].res, x.cost);
    o.built.push(id);
    o.today = true;
    if (x.dwelling) o.pool[x.dwelling - 1] = growth(S, o, x.dwelling);
    if (x.upgrade) o.branch[x.upgrade] = branch;
    S.ver++;
    const ev = [{ t: 'built', town: o.id, id }], fresh = teach(S, o);
    if (fresh.length) ev.push({ t: 'learned', hero: visitor(S, o).id, spells: fresh });
    return { ok: true, ev };
  };

  const rollGuild = (S, o) => {
    const own = F(o).schools, all = Object.values(H.SPELLS).filter(s => s.school !== 'road');
    const take = (pool, n) => {
      const list = pool.slice(), out = [];
      while (out.length < n && list.length) out.push(list.splice(Math.floor(H.roll(S) * list.length), 1)[0].id);
      return out;
    };
    const plus = F(o).buildings.map(x => x.guildPlus).find(Boolean) || [];
    o.guild = {};
    o.guildExtra = {};
    T.shelves.forEach((n, i) => {
      const c = i + 1, mine = all.filter(s => s.circle === c && own.includes(s.school)), rest = all.filter(s => s.circle === c && !own.includes(s.school));
      const first = take(mine, c >= 4 ? n : Math.ceil(n / 2)), left = mine.filter(s => !first.includes(s.id));
      o.guild[c] = [...first, ...take(c >= 4 ? [] : [...left, ...rest], n - first.length)];
      const extra = take(all.filter(s => s.circle === c && plus.includes(s.school) && !o.guild[c].includes(s.id)), 1);
      if (extra.length) o.guildExtra[c] = extra[0];
    });
  };
  const shelf = (o, c) => {
    const plus = o.built.some(id => def(o, id).guildPlus) && o.guildExtra[c];
    return plus ? [...o.guild[c], plus] : o.guild[c];
  };
  const teach = (S, o) => {
    const v = visitor(S, o), out = [];
    if (!v) return out;
    T.shelves.forEach((n, i) => {
      if (!has(o, 'guild' + (i + 1))) return;
      for (const id of shelf(o, i + 1)) if (H.Hero.learn(v, id)) out.push(id);
    });
    return out;
  };

  const offers = (o, tier) => {
    if (!has(o, 'dwell' + tier)) return [];
    const row = F(o).units[tier - 1], br = o.branch[tier];
    return br ? [row[0], row[br === 'a' ? 1 : 2]] : [row[0]];
  };

  const slotIn = (army, unit) => H.Hero.slotFor(army, unit);
  const armies = (S, o) => {
    const v = visitor(S, o);
    return v ? [v.army, o.garrison] : [o.garrison];
  };
  const put = (army, unit, n) => H.Hero.addTo(army, slotIn(army, unit), { unit, count: n });

  const room = (S, o, unit) => armies(S, o).some(a => slotIn(a, unit) >= 0);
  const canRecruit = (S, o, tier, unit) => {
    if (!offers(o, tier).includes(unit) || !room(S, o, unit)) return 0;
    return Math.max(0, Math.min(o.pool[tier - 1], most(S.players[o.owner].res, price(unit))));
  };

  const recruit = (S, o, tier, unit, n) => {
    const res = S.players[o.owner].res, cost = times(price(unit), n), army = armies(S, o).find(a => slotIn(a, unit) >= 0);
    if (!offers(o, tier).includes(unit) || !(n >= 1) || n > o.pool[tier - 1] || !army || !afford(res, cost)) return { ok: false, ev: [] };
    pay(res, cost);
    o.pool[tier - 1] -= n;
    put(army, unit, n);
    S.ver++;
    return { ok: true, ev: [{ t: 'recruit', town: o.id, unit, count: n }] };
  };

  const recruitPlan = (S, o, tiers) => {
    const res = Object.assign({}, S.players[o.owner].res), copies = armies(S, o).map(a => a.map(s => s && Object.assign({}, s))), out = [];
    for (let tier = 7; tier >= 1; tier--) {
      const can = offers(o, tier);
      if (!can.length || (tiers && !tiers.includes(tier))) continue;
      const unit = can[can.length - 1], army = copies.find(a => slotIn(a, unit) >= 0), n = Math.min(o.pool[tier - 1], most(res, price(unit)));
      if (!army || n < 1) continue;
      const cost = times(price(unit), n);
      pay(res, cost);
      put(army, unit, n);
      out.push({ tier, unit, n, cost });
    }
    return out;
  };
  const recruitAll = (S, o, tiers) => recruitPlan(S, o, tiers).flatMap(p => recruit(S, o, p.tier, p.unit, p.n).ev);

  const baseTier = (o, unit) => F(o).units.findIndex(row => row[0] === unit) + 1;
  const upgradeOf = (o, unit) => {
    const t = baseTier(o, unit), br = t && o.branch[t];
    return br ? F(o).units[t - 1][br === 'a' ? 1 : 2] : null;
  };
  const upgradeCost = (o, s) => {
    const to = upgradeOf(o, s.unit);
    if (!to) return null;
    const a = price(s.unit), b = price(to), cost = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const d = ((b[k] || 0) - (a[k] || 0)) * s.count;
      if (d > 0) cost[k] = d;
    }
    return { to, cost };
  };
  const upgrade = (S, o, army, slot) => {
    const s = army[slot], up = s && upgradeCost(o, s), res = S.players[o.owner].res;
    if (!up || !afford(res, up.cost)) return { ok: false, ev: [] };
    pay(res, up.cost);
    const same = army.findIndex((x, i) => x && i !== slot && x.unit === up.to);
    if (same >= 0) {
      H.Hero.addTo(army, same, { unit: up.to, count: s.count, stars: s.stars, vet: s.vet });
      army[slot] = null;
    } else army[slot] = Object.assign({}, s, { unit: up.to });
    S.ver++;
    return { ok: true, ev: [{ t: 'upgrade', town: o.id, unit: up.to, count: s.count }] };
  };
  const upgradeAll = (S, o, tier) => {
    const ev = [];
    for (const army of armies(S, o)) {
      army.forEach((s, i) => {
        if (s && baseTier(o, s.unit) === tier) ev.push(...upgrade(S, o, army, i).ev);
      });
    }
    return ev;
  };
  const upgradeTotal = (S, o, tier) => {
    const total = {};
    for (const army of armies(S, o)) {
      for (const s of army) {
        if (!s || baseTier(o, s.unit) !== tier) continue;
        for (const [k, v] of Object.entries(upgradeCost(o, s).cost)) total[k] = (total[k] || 0) + v;
      }
    }
    return total;
  };

  const row = (S, o, side) => (side === 'hero' ? (visitor(S, o) || { army: null }).army : o.garrison);
  const move = (S, o, from, to) => {
    const A = row(S, o, from.side), B = row(S, o, to.side);
    if (!A || !B || !H.Hero.moveStack(A, from.slot, B, to.slot, { keep: from.side === 'hero', n: from.n })) return false;
    S.ver++;
    return true;
  };

  const pickHero = (S, faction, skip) => {
    const free = H.HEROES.filter(x => (!faction || H.CLASSES[x.cls].faction === faction) && !S.heroes.some(h => h.alive && h.hid === x.id) && !skip.includes(x.id));
    return free.length ? free[Math.floor(H.roll(S) * free.length)].id : null;
  };
  const rollTavern = (S, o) => {
    const a = pickHero(S, o.faction, []);
    o.tavern = [a, pickHero(S, null, a ? [a] : [])];
  };
  const refill = (S, o, k) => {
    o.tavern[k] = pickHero(S, k === 0 ? o.faction : null, o.tavern.filter((x, i) => i !== k && x));
  };

  const spot = (S, o) => {
    const [ec, er] = MD.entry(o), M = S.map, g = H.Adv.grid(S, o.l);
    for (let rad = 0; rad <= 2; rad++) {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          const c = ec + dc, r = er + dr;
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== rad || !MD.inside(M, c, r)) continue;
          const i = MD.idx(M, c, r);
          if (g.block[i] || g.guard[i] || (g.entry[i] && g.entry[i] !== o.id) || !MD.groundCost(M, o.l, c, r) || H.Adv.heroAt(S, o.l, c, r)) continue;
          return [c, r];
        }
      }
    }
    return null;
  };

  const hireBlock = (S, o) => {
    if (o.owner < 0 || !has(o, 'tavern')) return 'В городе нет таверны';
    if (S.heroes.filter(h => h.alive && h.owner === o.owner).length >= T.maxHeroes) return 'У вас уже ' + T.maxHeroes + ' героев';
    if (S.players[o.owner].res.gold < T.heroPrice) return 'Не хватает золота';
    if (!spot(S, o)) return 'У ворот нет места';
    return '';
  };

  const hire = (S, o, k) => {
    const id = o.tavern[k], why = hireBlock(S, o) || (id ? '' : 'Некого нанять');
    if (why) return { ok: false, why, ev: [] };
    const rec = H.HEROES.find(x => x.id === id), cls = H.CLASSES[rec.cls], at = spot(S, o);
    S.players[o.owner].res.gold -= T.heroPrice;
    const army = rec.army.map(([unit, lo, hi]) => ({ unit, count: lo + Math.floor(H.roll(S) * (hi - lo + 1)) }));
    const hero = H.Adv.addHero(S, { owner: o.owner, hid: id, name: rec.name, cls: rec.cls, faction: cls.faction, c: at[0], r: at[1], l: o.l, army });
    for (const t of list(S)) t.tavern.forEach((x, i) => { if (x === id) refill(S, t, i); });
    return { ok: true, ev: [{ t: 'hired', town: o.id, hero: hero.id }] };
  };

  const rumor = S => RUMORS[(H.Adv.date(S).week - 1 + S.seed) % RUMORS.length];

  const marketsBuilt = (S, pid) => list(S, pid).reduce((n, o) => n + o.built.reduce((k, id) => k + (def(o, id).market || 0), 0), 0);
  const markets = (S, pid) => (marketsBuilt(S, pid) ? Math.min(T.maxMarket, marketsBuilt(S, pid) + H.Hero.marketBonus(S, pid) + H.Moons.marketStep(S)) : 0);
  const unitPrice = (k, r, side) => (r === 'gold' ? 1 : Math.round(T.value[r] * (side === 'sell' ? T.sell[0] + T.sell[1] * k : T.buy[0] - T.buy[1] * k) * 100) / 100);
  const quote = (S, pid, from, to) => {
    const k = markets(S, pid);
    if (!k || from === to) return null;
    const give = unitPrice(k, from, 'sell'), get = unitPrice(k, to, 'buy');
    return { k, give, get, max: Math.floor(S.players[pid].res[from] * give / get + 1e-9) };
  };
  const tradeCost = (q, m) => Math.ceil(m * q.get / q.give - 1e-9);
  const trade = (S, pid, from, to, m) => {
    const q = quote(S, pid, from, to), res = S.players[pid].res;
    if (!q || !(m >= 1) || m > q.max) return { ok: false, ev: [] };
    const n = tradeCost(q, m);
    res[from] -= n;
    res[to] += m;
    S.ver++;
    return { ok: true, ev: [{ t: 'trade', player: pid, from, to, give: n, get: m }] };
  };

  const income = (S, pid) => {
    const out = {};
    for (const o of list(S, pid)) for (const id of o.built) for (const [k, v] of Object.entries(def(o, id).income || {})) out[k] = (out[k] || 0) + v;
    if (out.gold) out.gold = Math.round(out.gold * H.Moons.goldMul(S));
    return out;
  };

  const init = S => {
    for (const o of list(S)) {
      o.built = Array.from(new Set(['hall1', ...(o.built || [])]));
      o.branch = Object.assign({}, o.branch);
      o.garrison = Array.from({ length: 7 }, (_, i) => (o.garrison && o.garrison[i] ? { unit: o.garrison[i].unit, count: o.garrison[i].count } : null));
      o.pool = Array.from({ length: 7 }, (_, i) => (has(o, 'dwell' + (i + 1)) ? growth(S, o, i + 1) : 0));
      o.today = false;
      rollTavern(S, o);
      rollGuild(S, o);
    }
  };

  const newDay = S => {
    for (const o of list(S)) o.today = false;
  };

  const week = S => {
    for (const o of list(S)) {
      for (let t = 1; t <= 7; t++) {
        if (!has(o, 'dwell' + t)) continue;
        const g = growth(S, o, t);
        o.pool[t - 1] = Math.min(o.pool[t - 1] + g, g * T.poolWeeks);
      }
      rollTavern(S, o);
    }
  };

  const capture = (S, o, hero, ev) => {
    o.owner = hero.owner;
    o.today = false;
    S.ver++;
    ev.push({ t: 'townTaken', town: o.id, hero: hero.id });
  };

  H.OBJ_VISIT.town = (S, hero, o, ev, from) => {
    if (o.owner !== hero.owner) {
      if (o.garrison.some(Boolean)) {
        S.pending = { kind: 'town', hero: hero.id, obj: o.id, from: from || [hero.c, hero.r] };
        ev.push({ t: 'pending', kind: 'town' });
        return;
      }
      capture(S, o, hero, ev);
    }
    const fresh = teach(S, o);
    if (fresh.length) ev.push({ t: 'learned', hero: hero.id, spells: fresh });
    ev.push({ t: 'town', town: o.id, hero: hero.id });
  };

  H.Town = { RUMORS, spot, shelf, teach, list, byId, def, has, goldOf, price, times, afford, most, lack, visitor, growth, forbidden, state, build, offers, room, canRecruit, recruit, recruitPlan, recruitAll, upgradeOf, upgradeCost, upgrade, upgradeAll, upgradeTotal, move, hireBlock, hire, rumor, markets, quote, tradeCost, trade, income, init, newDay, week, capture };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
