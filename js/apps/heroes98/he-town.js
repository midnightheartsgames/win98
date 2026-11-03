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

  const B = T.barrow;
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
    if ((S.map.forbid || []).includes(x.id) || (o.forbid || []).includes(x.id)) return 'запрещено на этой карте';
    if (x.water && !o.water) return 'город стоит не у воды';
    if (x.heart && !o.heart) return 'нужно Сердце Восьмой луны';
    if (x.capital && list(S, o.owner).some(t => t !== o && has(t, x.id))) return 'столица у вас уже есть';
    if (x.seat && list(S, o.owner).some(t => t !== o && has(t, x.id))) return H.HERO.throne.seat;
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
    if (x.barrow === 1) {
      const p = S.players[o.owner];
      for (const e of p.shades) shadesInto(o.barrow, e.unit, e.count);
      p.shades = [];
    }
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

  const shadesInto = (store, unit, n) => {
    if (n <= 0) return;
    const e = store.find(x => x.unit === unit);
    if (e) e.count += n;
    else store.push({ unit, count: n });
  };
  const barrowLevel = o => o.built.reduce((top, id) => Math.max(top, def(o, id).barrow || 0), 0);
  const heroesOf = (S, pid) => S.heroes.filter(h => h.alive && h.owner === pid);
  const barrowLimit = (S, o) => {
    const level = barrowLevel(o);
    return level ? Math.round(B.limits[level - 1] * (heroesOf(S, o.owner).some(h => H.Hero.hasTalent(h, 'barrows-5')) ? 1 + B.ratLimit : 1)) : 0;
  };
  const raiseCut = (S, pid) => heroesOf(S, pid).reduce((top, h) => {
    const sp = H.Hero.spec(h), own = sp && sp.trait === 'barrow' ? Math.min(B.speakerTop, B.speakerStep * h.level) : 0;
    return Math.max(top, own + (H.Hero.hasTalent(h, 'barrows-5') ? B.ratPrice : 0));
  }, 0);
  const raisePrice = (S, pid, unit) => Math.max(1, Math.round(U(unit).cost * B.price * (1 - raiseCut(S, pid))));
  const raiseLeft = (S, o) => Math.max(0, barrowLimit(S, o) - (o.raised || 0));
  const canRaise = (S, o, unit) => {
    const e = (o.barrow || []).find(x => x.unit === unit);
    if (!e || !room(S, o, unit)) return 0;
    return Math.max(0, Math.min(e.count, Math.floor(raiseLeft(S, o) / U(unit).cost), Math.floor(S.players[o.owner].res.gold / raisePrice(S, o.owner, unit))));
  };
  const raise = (S, o, unit, n) => {
    if (!(n >= 1) || n > canRaise(S, o, unit)) return { ok: false, ev: [] };
    const e = o.barrow.find(x => x.unit === unit), army = armies(S, o).find(a => slotIn(a, unit) >= 0), p = S.players[o.owner];
    p.res.gold -= raisePrice(S, o.owner, unit) * n;
    e.count -= n;
    if (!e.count) o.barrow = o.barrow.filter(x => x !== e);
    o.raised = (o.raised || 0) + n * U(unit).cost;
    p.risen = (p.risen || 0) + n;
    put(army, unit, n);
    S.ver++;
    return { ok: true, ev: [{ t: 'risen2', town: o.id, unit, count: n }] };
  };
  const raiseAll = (S, o) => {
    const out = [];
    for (const e of (o.barrow || []).slice().sort((a, b) => U(b.unit).cost - U(a.unit).cost)) {
      const n = canRaise(S, o, e.unit);
      if (n) out.push(...raise(S, o, e.unit, n).ev);
    }
    return out;
  };
  const barrowShare = (S, pid, h) => {
    if (list(S, pid).some(t => t.built.some(id => def(t, id).barrowShare))) return Math.max(...list(S, pid).flatMap(t => t.built.map(id => def(t, id).barrowShare || 0)));
    return h && H.Hero.hasTalent(h, 'barrows-1') ? B.trizna : B.share;
  };
  const nearestBarrow = (S, pid, at) => list(S, pid).filter(t => barrowLevel(t)).sort((a, b) => Math.hypot(a.c - at.c, a.r - at.r) - Math.hypot(b.c - at.c, b.r - at.r))[0] || null;
  const fallen = (S, pid, h, at, lost, souls, ev) => {
    const p = S.players[pid], town = nearestBarrow(S, pid, at), share = barrowShare(S, pid, h), store = town ? town.barrow : p.shades;
    let sent = 0;
    for (const row of lost) {
      if (U(row.unit).faction !== 'barrows' || row.lost <= 0) continue;
      const n = Math.floor(row.lost * share + H.roll(S));
      shadesInto(store, row.unit, n);
      sent += n;
    }
    const caught = Math.floor((souls || 0) / U('shade').hp);
    if (caught) {
      shadesInto(store, 'shade', caught);
      sent += caught;
    }
    if (sent) ev.push({ t: 'barrow', player: pid, town: town ? town.id : null, count: sent });
  };

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
    const cast = S.campaign ? H.Script.speakers(S.map.scenes) : [];
    const free = H.HEROES.filter(x => !x.story && !cast.includes(x.id) && (!faction || H.CLASSES[x.cls].faction === faction) && !S.heroes.some(h => (h.alive || h.away) && h.hid === x.id) && !skip.includes(x.id) && !S.map.objs.some(o => o.t === 'prison' && !o.gone && o.hid === x.id));
    return free.length ? free[Math.floor(H.roll(S) * free.length)].id : null;
  };
  const rollTavern = (S, o) => {
    const a = pickHero(S, o.faction, []);
    o.tavern = [a, pickHero(S, null, a ? [a] : [])];
  };
  const refill = (S, o, k) => {
    o.tavern[k] = pickHero(S, k === 0 ? o.faction : null, o.tavern.filter((x, i) => i !== k && x));
  };

  const spot = (S, o, rim) => {
    const [ec, er] = MD.entry(o), M = S.map, g = H.Adv.grid(S, o.l);
    for (let rad = rim || 0; rad <= 2 + (rim || 0); rad++) {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          const c = ec + dc, r = er + dr;
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== rad || !MD.inside(M, c, r)) continue;
          const i = MD.idx(M, c, r);
          if (g.block[i] || g.guard[i] || (g.entry[i] && g.entry[i] !== o.id) || !MD.groundCost(M, o.l, c, r) || H.Adv.heroAt(S, o.l, c, r) || H.Adv.caravanAt(S, o.l, c, r)) continue;
          return [c, r];
        }
      }
    }
    return null;
  };

  const hireBlockFor = (S, o, pid) => {
    if (S.heroes.filter(h => h.alive && h.owner === pid).length >= T.maxHeroes) return 'У вас уже ' + T.maxHeroes + ' героев';
    if (S.players[pid].res.gold < T.heroPrice) return 'Не хватает золота';
    if (!spot(S, o)) return 'У ворот нет места';
    return '';
  };
  const hireBlock = (S, o) => (o.owner < 0 || !has(o, 'tavern') ? 'В городе нет таверны' : hireBlockFor(S, o, o.owner));

  const inns = S => S.map.objs.filter(o => o.t === 'inn' && !o.gone && o.tavern);
  const hireFor = (S, o, pid, k) => {
    const id = o.tavern[k], why = hireBlockFor(S, o, pid) || (id ? '' : 'Некого нанять');
    if (why) return { ok: false, why, ev: [] };
    const rec = H.HEROES.find(x => x.id === id), cls = H.CLASSES[rec.cls], at = spot(S, o);
    S.players[pid].res.gold -= T.heroPrice;
    const army = rec.army.map(([unit, lo, hi]) => ({ unit, count: lo + Math.floor(H.roll(S) * (hi - lo + 1)) }));
    const hero = H.Adv.addHero(S, { owner: pid, hid: id, name: rec.name, cls: rec.cls, faction: cls.faction, c: at[0], r: at[1], l: o.l, army });
    for (const t of [...list(S), ...inns(S)]) t.tavern.forEach((x, i) => { if (x === id) refill(S, t, i); });
    return { ok: true, ev: [{ t: 'hired', town: o.id, hero: hero.id }] };
  };
  const hire = (S, o, k) => (hireBlock(S, o) ? { ok: false, why: hireBlock(S, o), ev: [] } : hireFor(S, o, o.owner, k));
  const rollInn = (S, o) => {
    const a = pickHero(S, null, []);
    o.tavern = [a, pickHero(S, null, a ? [a] : [])];
  };

  const hasRing = o => o.built.some(id => def(o, id).ring);
  const volcano = (S, pid) => pid >= 0 && list(S, pid).some(o => o.built.some(id => def(o, id).volcano));
  const kings = (S, pid) => pid >= 0 && list(S, pid).some(o => o.built.some(id => def(o, id).kings));
  const mirrorHall = (S, pid) => pid >= 0 && list(S, pid).some(o => o.built.some(id => def(o, id).mirrorHall));
  const foundry = (S, pid) => pid >= 0 && list(S, pid).some(o => o.built.some(id => def(o, id).foundry));
  const machinePrice = (S, pid, id) => Math.round(H.UNITS[H.MACHINES[id].unit].cost * (foundry(S, pid) ? 0.5 : 1));
  const canReforge = o => o.built.some(id => def(o, id).reforge);
  const NEXT_RANK = { plain: 'rare', rare: 'relic' };
  const reforgeCost = (h, rank) => Math.round(H.HERO.forge.reforge[rank] * (1 - ((H.Hero.spec(h) || {}).smith || 0)));
  const forgeables = h => [...h.bag.map((id, i) => ({ id, bag: i })), ...Object.entries(h.arts).filter(([, id]) => id).map(([slot, id]) => ({ id, slot }))];
  const reforgePairs = h => {
    const list = forgeables(h), out = [];
    list.forEach((a, i) => list.forEach((b, j) => {
      const x = H.ARTIFACTS[a.id], y = H.ARTIFACTS[b.id];
      if (i < j && x && y && !x.scroll && x.slot === y.slot && x.rank === y.rank && NEXT_RANK[x.rank]) out.push([i, j]);
    }));
    return out;
  };
  const reforge = (S, o, h, i, j) => {
    const list = forgeables(h), p = list[i], q = list[j], a = p && H.ARTIFACTS[p.id], b = q && H.ARTIFACTS[q.id], res = S.players[h.owner].res;
    if (!canReforge(o) || visitor(S, o) !== h || i === j || !a || !b || a.slot !== b.slot || a.rank !== b.rank || !NEXT_RANK[a.rank]) return null;
    const cost = reforgeCost(h, a.rank);
    if (res.gold < cost) return null;
    const relic = a.rank === 'plain' && H.Hero.hasTalent(h, 'forge-5') && H.roll(S) < H.HERO.forge.relic;
    const rank = relic ? 'relic' : NEXT_RANK[a.rank], pool = Object.values(H.ARTIFACTS).filter(x => x.slot === a.slot && x.rank === rank && !x.scroll);
    if (!pool.length) return null;
    const made = pool[Math.floor(H.roll(S) * pool.length)].id;
    for (const ref of [p, q]) if (ref.slot) h.arts[ref.slot] = null;
    h.bag = h.bag.filter((x, k) => k !== p.bag && k !== q.bag);
    h.bag.push(made);
    res.gold -= cost;
    S.ver++;
    return made;
  };
  const beaconOf = o => (o.built || []).reduce((top, id) => Math.max(top, def(o, id).beacon || 0), 0);
  const harbor = (S, pid) => pid >= 0 && list(S, pid).some(o => o.built.some(id => def(o, id).harbor));
  const cradle = (S, pid) => pid >= 0 && list(S, pid).some(o => o.built.some(id => def(o, id).cradle));
  const worldTree = (S, pid) => pid >= 0 && list(S, pid).some(o => o.built.some(id => def(o, id).worldTree));
  const nearestTavern = (S, h) => list(S, h.owner).filter(t => has(t, 'tavern')).sort((a, b) => Math.hypot(a.c - h.c, a.r - h.r) - Math.hypot(b.c - h.c, b.r - h.r))[0] || null;
  const backHeroes = (S, o) => S.returning.filter(w => w.kind !== 'altar' && w.day <= S.day && S.heroes[w.hero].owner === o.owner && nearestTavern(S, S.heroes[w.hero]) === o).map(w => S.heroes[w.hero]);
  const revive = (S, o, h, at) => {
    const rec = H.Hero.record(h);
    S.returning = S.returning.filter(w => w.hero !== h.id);
    h.alive = true;
    h.away = false;
    [h.c, h.r] = at;
    h.l = o.l;
    if (!h.army.some(Boolean)) {
      const rows = rec ? rec.army : [[F(o).units[0][0], 5, 10]];
      rows.forEach(([unit, lo, hi], i) => { h.army[i] = { unit, count: lo + Math.floor(H.roll(S) * (hi - lo + 1)), stars: 0, vet: 0 }; });
    }
    h.steps = H.Adv.daySteps(S, h);
    H.Adv.reveal(S, h.owner, h.l, h.c, h.r, H.Hero.sight(S, h));
    S.ver++;
  };
  const hireBack = (S, o, id) => {
    const h = S.heroes[id], why = hireBlock(S, o) || (backHeroes(S, o).includes(h) ? '' : 'Этого героя здесь нет');
    if (why) return { ok: false, why, ev: [] };
    S.players[o.owner].res.gold -= T.heroPrice;
    revive(S, o, h, spot(S, o));
    return { ok: true, ev: [{ t: 'hired', town: o.id, hero: h.id }] };
  };
  const altarRise = (S, h) => list(S, h.owner).find(t => t.built.some(id => def(t, id).heroRise)) || null;
  const riseAtAltars = (S, ev) => {
    for (const w of S.returning.filter(x => x.kind === 'altar' && x.day <= S.day)) {
      const h = S.heroes[w.hero], o = byId(S, w.town), at = o && o.owner === h.owner ? spot(S, o) : null;
      if (at) {
        revive(S, o, h, at);
        ev.push({ t: 'risen', hero: h.id, town: o.id });
      }
    }
  };

  const isDwelling = o => H.OBJ[o.t].kind === 'dwelling';
  const caravanRows = (S, from) => {
    if (isDwelling(from)) return from.pool > 0 ? [{ tier: 0, unit: H.OBJ[from.t].unit, n: from.pool }] : [];
    const out = [];
    for (let tier = 1; tier <= 7; tier++) {
      const can = offers(from, tier);
      if (can.length && from.pool[tier - 1] > 0) out.push({ tier, unit: can[can.length - 1], n: from.pool[tier - 1] });
    }
    return out;
  };
  const caravanSources = (S, to) => [...list(S, to.owner).filter(o => o !== to), ...S.map.objs.filter(o => !o.gone && isDwelling(o) && H.OBJ[o.t].flag && o.owner === to.owner && o.l === to.l)].filter(o => caravanRows(S, o).length);
  const caravanCost = (to, rows) => {
    const cost = {};
    let value = 0;
    for (const r of rows) {
      for (const [k, v] of Object.entries(price(r.unit))) cost[k] = (cost[k] || 0) + v * r.n;
      value += U(r.unit).cost * r.n;
    }
    cost.gold = (cost.gold || 0) + Math.ceil(value * T.caravanFee * (F(to).caravanMul || 1));
    return cost;
  };
  const caravanWhy = (S, from, to, rows) => {
    if (to.owner < 0 || from.owner !== to.owner || from === to) return 'Нужны два своих города';
    if (!has(to, 'caravan')) return 'В городе нет Обозной станции';
    if (!rows.length) return 'Некого отправить';
    if (!spot(S, from, 1)) return 'У ворот нет места';
    if (!H.Adv.caravanRoute(S, from, to)) return 'Дорогу держит охрана';
    return afford(S.players[to.owner].res, caravanCost(to, rows)) ? '' : 'Не хватает ресурсов';
  };
  const sendCaravan = (S, from, to, rows) => {
    const why = caravanWhy(S, from, to, rows);
    const short = r => (isDwelling(from) ? r.unit !== H.OBJ[from.t].unit || r.n > from.pool : !offers(from, r.tier).includes(r.unit) || r.n > from.pool[r.tier - 1]) || !(r.n >= 1);
    if (why || rows.some(short)) return { ok: false, why: why || 'Столько нет', ev: [] };
    pay(S.players[to.owner].res, caravanCost(to, rows));
    for (const r of rows) {
      if (isDwelling(from)) from.pool -= r.n;
      else from.pool[r.tier - 1] -= r.n;
    }
    const at = spot(S, from, 1), cv = { id: S.nextCaravan++, owner: to.owner, to: to.id, l: from.l, c: at[0], r: at[1], dir: 1, stacks: rows.map(r => ({ unit: r.unit, count: r.n, stars: 0, vet: 0 })) };
    S.caravans.push(cv);
    S.ver++;
    return { ok: true, ev: [{ t: 'caravanSent', caravan: cv.id, town: to.id }] };
  };

  const shop = (S, o) => {
    if (!o.built.some(id => def(o, id).shop)) return [];
    if (o.shopWeek !== H.Moons.weekOf(S)) {
      o.shopWeek = H.Moons.weekOf(S);
      o.shop = ['plain', 'plain', 'rare'].map(rank => H.Sites.rollArt(S, rank));
    }
    return o.shop;
  };
  const buyArt = (S, o, i) => {
    const list = shop(S, o), id = list[i], h = visitor(S, o);
    if (!id) return { ok: false, why: 'Товара нет', ev: [] };
    if (!h) return { ok: false, why: 'Купить может только герой в городе', ev: [] };
    if (S.players[o.owner].res.gold < H.ARTIFACTS[id].cost) return { ok: false, why: 'Не хватает золота', ev: [] };
    if (!H.Hero.giveArt(h, id)) return { ok: false, why: 'Сумка полна', ev: [] };
    S.players[o.owner].res.gold -= H.ARTIFACTS[id].cost;
    list[i] = null;
    S.ver++;
    return { ok: true, ev: [{ t: 'artifact', hero: h.id, art: id }] };
  };

  const rumor = S => RUMORS[(H.Adv.date(S).week - 1 + S.seed) % RUMORS.length];

  const marketsBuilt = (S, pid) => list(S, pid).reduce((n, o) => n + o.built.reduce((k, id) => k + (def(o, id).market || 0), 0), 0);
  const markets = (S, pid) => (marketsBuilt(S, pid) ? (H.Hero.bestRate(S, pid) ? T.maxMarket : Math.min(T.maxMarket, marketsBuilt(S, pid) + H.Hero.marketBonus(S, pid) + H.Moons.marketStep(S))) : 0);
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
      o.barrow = o.barrow || [];
      o.raised = 0;
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
      o.raised = 0;
      rollTavern(S, o);
    }
    for (const o of S.map.objs) if (o.t === 'inn' && o.tavern) rollInn(S, o);
  };

  const capture = (S, o, hero, ev) => {
    o.owner = hero.owner;
    o.today = false;
    S.ver++;
    ev.push({ t: 'townTaken', town: o.id, hero: hero.id });
  };

  H.OBJ_VISIT.town = (S, hero, o, ev, from) => {
    if (H.Adv.allied(S, o.owner, hero.owner)) {
      ev.push({ t: 'note', text: o.name + ': город союзника' });
      return;
    }
    if (o.owner !== hero.owner) {
      if (o.garrison.some(Boolean)) {
        S.pending = { kind: 'town', hero: hero.id, obj: o.id, from: from || [hero.c, hero.r] };
        ev.push({ t: 'pending', kind: 'town' });
        return;
      }
      capture(S, o, hero, ev);
    }
    if (hero.heart && !o.heart) {
      hero.heart = false;
      o.heart = true;
      S.ver++;
      ev.push({ t: 'heartHome', town: o.id, hero: hero.id });
    }
    const fresh = teach(S, o);
    if (fresh.length) ev.push({ t: 'learned', hero: hero.id, spells: fresh });
    ev.push({ t: 'town', town: o.id, hero: hero.id });
  };

  H.Town = { kings, mirrorHall, volcano, foundry, machinePrice, canReforge, reforgeCost, forgeables, reforgePairs, reforge, beaconOf, harbor, cradle, hasRing, worldTree, shadesInto, barrowLevel, barrowLimit, raisePrice, raiseLeft, canRaise, raise, raiseAll, barrowShare, nearestBarrow, fallen, shop, buyArt, hireBlockFor, hireFor, rollInn, riseAtAltars, altarRise, nearestTavern, backHeroes, hireBack, caravanRows, caravanSources, caravanCost, caravanWhy, sendCaravan, RUMORS, spot, shelf, teach, list, byId, def, has, goldOf, price, times, afford, most, lack, visitor, growth, forbidden, state, build, offers, room, canRecruit, recruit, recruitPlan, recruitAll, upgradeOf, upgradeCost, upgrade, upgradeAll, upgradeTotal, move, hireBlock, hire, rumor, markets, quote, tradeCost, trade, income, init, newDay, week, capture };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
