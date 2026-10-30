(function (H) {
  'use strict';
  const MP = H.MAP, MD = H.MapData;
  const U = id => H.UNITS[id];

  const armyValue = army => army.reduce((t, s) => t + (s ? s.count * U(s.unit).cost : 0), 0);
  const strength = n => {
    let word = MP.strength[0][1];
    for (const [min, w] of MP.strength) if (n >= min) word = w;
    return word;
  };

  const daySteps = (S, hero) => {
    const speeds = hero.army.filter(Boolean).map(s => U(s.unit).speed);
    let n = MP.daySteps;
    if (speeds.length && speeds.every(v => v >= MP.fastArmy)) n += MP.armyStep;
    if (speeds.some(v => v <= MP.slowArmy)) n -= MP.armyStep;
    return H.Hero.steps(S, hero, n);
  };

  const heroAt = (S, l, c, r) => S.heroes.find(h => h.alive && h.l === l && h.c === c && h.r === r) || null;

  const grid = (S, l) => {
    const M = S.map, n = M.w * M.h, block = new Int32Array(n), entry = new Int32Array(n), guard = new Int32Array(n);
    for (const o of M.objs) {
      if (o.l !== l || o.gone) continue;
      for (const [c, r] of MD.cells(o)) if (MD.inside(M, c, r)) block[MD.idx(M, c, r)] = o.id;
      const e = MD.entry(o);
      if (e) {
        block[MD.idx(M, e[0], e[1])] = 0;
        entry[MD.idx(M, e[0], e[1])] = o.id;
      }
      if (o.t === 'monster') {
        for (const [dc, dr] of H.Path.DIRS) {
          const c = o.c + dc, r = o.r + dr;
          if (MD.inside(M, c, r) && !guard[MD.idx(M, c, r)]) guard[MD.idx(M, c, r)] = o.id;
        }
      }
    }
    return { block, entry, guard };
  };

  const obj = (S, id) => S.map.objs.find(o => o.id === id && !o.gone) || null;
  const remove = (S, o) => {
    o.gone = true;
    S.ver++;
  };

  const reveal = (S, pid, l, c, r, rad) => {
    const M = S.map, seen = S.players[pid].seen[l];
    for (let y = r - rad; y <= r + rad; y++) {
      for (let x = c - rad; x <= c + rad; x++) {
        if (MD.inside(M, x, y) && (x - c) ** 2 + (y - r) ** 2 <= rad * rad + rad) seen[MD.idx(M, x, y)] = 1;
      }
    }
  };
  const sources = (S, pid, l) => [
    ...S.heroes.filter(h => h.alive && h.owner === pid && h.l === l).map(h => [h.c, h.r, H.Hero.sight(S, h)]),
    ...S.map.objs.filter(o => !o.gone && o.l === l && o.owner === pid && (H.OBJ[o.t].kind === 'mine' || o.t === 'town')).map(o => { const e = MD.entry(o); return [e[0], e[1], o.t === 'town' ? MP.townSight : MP.mineSight]; })
  ];
  const visible = (S, pid, l) => {
    const M = S.map, out = new Uint8Array(M.w * M.h);
    for (const [c, r, rad] of sources(S, pid, l)) {
      for (let y = r - rad; y <= r + rad; y++) {
        for (let x = c - rad; x <= c + rad; x++) {
          if (MD.inside(M, x, y) && (x - c) ** 2 + (y - r) ** 2 <= rad * rad + rad) out[MD.idx(M, x, y)] = 1;
        }
      }
    }
    return out;
  };
  const revealAll = (S, pid) => {
    for (let l = 0; l < S.map.levels; l++) for (const [c, r, rad] of sources(S, pid, l)) reveal(S, pid, l, c, r, rad);
  };

  const addHero = (S, h) => {
    const army = Array.from({ length: 7 }, (_, i) => (h.army[i] ? { unit: h.army[i].unit, count: h.army[i].count, stars: h.army[i].stars || 0, vet: h.army[i].vet || 0 } : null));
    const hero = H.Hero.init({ id: S.heroes.length, owner: h.owner, hid: h.hid || null, name: h.name, cls: h.cls, faction: h.faction, c: h.c, r: h.r, l: h.l || 0, army, xp: 0, steps: 0, dir: 1, alive: true }, h);
    hero.steps = daySteps(S, hero);
    S.heroes.push(hero);
    reveal(S, hero.owner, hero.l, hero.c, hero.r, H.Hero.sight(S, hero));
    S.ver++;
    return hero;
  };

  const startRes = (p, k) => Object.fromEntries(Object.entries(MP.start).map(([id, v]) => [id, p.human ? Math.round(v * k) : v]));

  const create = (map, o) => {
    const S = { v: 1, seed: o.seed >>> 0, rs: ((o.seed >>> 0) ^ 0x85ebca6b) >>> 0, day: 1, ver: 1, map, players: [], heroes: [], pending: null, battle: null, over: null, moons: null, turn: 0, difficulty: o.difficulty || 'normal', mapName: o.name || map.name || '', goals: o.goals || map.goals || { win: [{ kind: 'defeat' }], lose: [{ kind: 'all' }] }, debug: false };
    if (o.moons !== null) S.moons = o.moons || H.Moons.roll(S);
    const k = H.DIFFICULTY[S.difficulty].start;
    for (const p of o.players) {
      S.players.push({ id: S.players.length, name: p.name, color: p.color, faction: p.faction, human: !!p.human, out: false, townless: 0, hadTown: false, res: Object.assign(startRes(p, k), p.res || {}), seen: Array.from({ length: map.levels }, () => new Array(map.w * map.h).fill(0)) });
    }
    for (const h of o.heroes) addHero(S, h);
    H.Town.init(S);
    for (const p of S.players) {
      p.hadTown = H.Town.list(S, p.id).length > 0;
      revealAll(S, p.id);
    }
    return S;
  };

  const passCost = (S, l, g, hero) => i => {
    const M = S.map, c = i % M.w, r = (i / M.w) | 0;
    if (g.block[i]) return 0;
    const h = heroAt(S, l, c, r);
    if (h && h !== hero) return 0;
    return H.Hero.ground(hero, MD.groundCost(M, l, c, r) || H.Hero.overGround(S, hero, MD.terrainAt(M, l, c, r).id));
  };

  const foeAt = (S, hero, l, c, r) => {
    const h = heroAt(S, l, c, r);
    return h && h.owner !== hero.owner ? h : null;
  };

  const path = (S, hero, c, r) => {
    const M = S.map, l = hero.l;
    if (!MD.inside(M, c, r) || (c === hero.c && r === hero.r)) return null;
    const g = grid(S, l), cost = passCost(S, l, g, hero), at = MD.idx(M, c, r);
    const goals = new Set();
    let kind = 'move', target = null;
    const zoc = id => {
      kind = 'attack';
      target = id;
      for (let i = 0; i < M.w * M.h; i++) if (g.guard[i] === id && cost(i)) goals.add(i);
    };
    const duel = foe => {
      kind = 'duel';
      target = foe.id;
      for (const [dc, dr] of H.Path.DIRS) {
        const x = foe.c + dc, y = foe.r + dr;
        if (MD.inside(M, x, y) && cost(MD.idx(M, x, y))) goals.add(MD.idx(M, x, y));
      }
    };
    const blocker = g.block[at] ? obj(S, g.block[at]) : null, foe = foeAt(S, hero, l, c, r);
    if (foe) duel(foe);
    else if (blocker && blocker.t === 'monster') zoc(blocker.id);
    else if (blocker) {
      const e = MD.entry(blocker);
      if (!e) return null;
      const ei = MD.idx(M, e[0], e[1]), holder = foeAt(S, hero, l, e[0], e[1]);
      if (holder) duel(holder);
      else if (g.guard[ei]) zoc(g.guard[ei]);
      else {
        kind = 'visit';
        target = blocker.id;
        goals.add(ei);
      }
    } else {
      if (!cost(at)) return null;
      if (g.guard[at]) zoc(g.guard[at]);
      else {
        if (g.entry[at]) {
          kind = 'visit';
          target = g.entry[at];
        }
        goals.add(at);
      }
    }
    const start = MD.idx(M, hero.c, hero.r);
    if (goals.has(start)) return { kind, target, steps: [], here: true };
    const terminal = i => i !== start && (g.guard[i] > 0 || g.entry[i] > 0);
    const found = H.Path.find(M.w, M.h, start, goals, cost, terminal, 0.4);
    if (!found) return null;
    const full = daySteps(S, hero);
    let left = hero.steps, day = 0, prev = start;
    const steps = found.cells.map(i => {
      const pc = prev % M.w, pr = (prev / M.w) | 0, nc = i % M.w, nr = (i / M.w) | 0;
      const k = cost(i) * (pc !== nc && pr !== nr ? MP.diagonal : 1);
      if (left + 1e-9 < k) {
        day++;
        left = full;
      }
      left -= k;
      prev = i;
      return { c: nc, r: nr, cost: k, day };
    });
    return { kind, target, steps };
  };

  const visitAt = (S, hero, ev, from) => {
    const g = grid(S, hero.l), o = obj(S, g.entry[MD.idx(S.map, hero.c, hero.r)]);
    if (o) H.OBJ_VISIT[H.OBJ[o.t].kind](S, hero, o, ev, from);
  };

  const encounter = (S, hero, o, from, ev) => {
    const mine = armyValue(hero.army), theirs = o.count * U(o.unit).cost, ratio = mine / theirs;
    const talk = H.Hero.hasPerk(hero, 'parley');
    let offer = null, chance = 0;
    for (const [min, p] of MP.join[o.mood] || []) {
      if (ratio >= min) {
        chance = Math.min(1, p * (talk ? H.HERO.parleyChance : 1));
        offer = H.roll(S) < chance ? 'join' : min >= MP.power ? 'flee' : null;
        break;
      }
    }
    const price = U(o.unit).faction === hero.faction ? 0 : Math.round(o.count * U(o.unit).cost * (talk ? H.HERO.parleyPrice : 1));
    S.pending = { kind: 'encounter', hero: hero.id, obj: o.id, from, ratio, offer, chance, price };
    ev.push({ t: 'pending', kind: 'encounter' });
  };

  const step = (S, hero, c, r) => {
    const ev = [], M = S.map, g = grid(S, hero.l);
    if (S.pending || !hero.alive) return { ok: false, ev };
    if (Math.max(Math.abs(c - hero.c), Math.abs(r - hero.r)) !== 1) return { ok: false, ev };
    const k = passCost(S, hero.l, g, hero)(MD.idx(M, c, r)) * (c !== hero.c && r !== hero.r ? MP.diagonal : 1);
    if (!k) return { ok: false, ev };
    if (hero.steps + 1e-9 < k) return { ok: false, ev: [{ t: 'tired', hero: hero.id }] };
    const from = [hero.c, hero.r];
    hero.steps = Math.max(0, hero.steps - k);
    if (c !== hero.c) hero.dir = Math.sign(c - hero.c);
    hero.c = c;
    hero.r = r;
    S.ver++;
    reveal(S, hero.owner, hero.l, c, r, H.Hero.sight(S, hero));
    ev.push({ t: 'step', hero: hero.id, c, r });
    const guard = g.guard[MD.idx(M, c, r)];
    if (guard) encounter(S, hero, obj(S, guard), from, ev);
    else visitAt(S, hero, ev, from);
    conclude(S, ev);
    return { ok: true, ev };
  };

  const engage = (S, hero, target, kind) => {
    const ev = [];
    if (S.pending) return ev;
    if (kind === 'duel') {
      const foe = S.heroes[target];
      if (!foe || !foe.alive || foe.owner === hero.owner || foe.l !== hero.l || Math.max(Math.abs(foe.c - hero.c), Math.abs(foe.r - hero.r)) !== 1) return ev;
      S.pending = { kind: 'duel', hero: hero.id, enemy: foe.id, from: [hero.c, hero.r] };
      ev.push({ t: 'pending', kind: 'duel' });
      return ev;
    }
    const o = obj(S, target);
    if (!o) return ev;
    if (o.t === 'monster') encounter(S, hero, o, [hero.c, hero.r], ev);
    else visitAt(S, hero, ev);
    S.ver++;
    conclude(S, ev);
    return ev;
  };

  const splitNeutral = o => {
    const k = Math.min(o.count, H.clamp(Math.round(o.count / 8) + 2, MP.split[0], MP.split[1]));
    return Array.from({ length: k }, (_, i) => ({ unit: o.unit, count: Math.floor(o.count / k) + (i < o.count % k ? 1 : 0) }));
  };

  const slotsOf = army => army.map((s, i) => (s ? i : -1)).filter(i => i >= 0);

  const stackCopy = s => ({ unit: s.unit, count: s.count, stars: s.stars || 0, vet: s.vet || 0 });

  const battleSetup = S => {
    const p = S.pending, hero = S.heroes[p.hero], foe = p.kind === 'duel' ? S.heroes[p.enemy] : null, o = foe ? null : obj(S, p.obj), town = !!o && o.t === 'town';
    const slots = slotsOf(hero.army), foeSlots = foe ? slotsOf(foe.army) : town ? slotsOf(o.garrison) : null;
    p.slots = slots;
    p.foeSlots = foeSlots;
    p.target = foe ? 'hero' : town ? 'town' : 'monster';
    p.kind = 'battle';
    const defender = foe ? foe.owner : town ? o.owner : -1;
    return {
      name: foe ? 'Бой с героем: ' + foe.name : town ? 'Бой за город: ' + o.name : 'Бой: ' + U(o.unit).name,
      player: S.players[hero.owner].human ? 0 : defender >= 0 && S.players[defender].human ? 1 : null,
      moon: H.Moons.battle(S),
      seed: Math.floor(H.roll(S) * 1e9),
      sides: [H.Hero.battleSide(hero, slots), foe ? H.Hero.battleSide(foe, foeSlots) : { stacks: town ? foeSlots.map(i => stackCopy(o.garrison[i])) : splitNeutral(o) }]
    };
  };

  const beaten = (S, pid) => !S.heroes.some(h => h.alive && h.owner === pid) && !H.Town.list(S, pid).length;

  const WIN = {
    defeat: { text: () => 'Разбить всех врагов', done: (S, p) => S.players.length > 1 && S.players.every(q => q.id === p.id || q.out) },
    town: { text: (M, g) => 'Взять город ' + M.objs.find(o => o.id === g.town).name, done: (S, p, g) => S.map.objs.find(o => o.id === g.town).owner === p.id },
    gold: { text: (M, g) => 'Накопить ' + g.n + ' золота', done: (S, p, g) => p.res.gold >= g.n },
    hero: { text: (M, g) => 'Победить героя ' + H.HEROES.find(x => x.id === g.hid).name, done: (S, p, g) => S.heroes.some(h => h.hid === g.hid && !h.alive && h.owner !== p.id) }
  };
  const LOSE = {
    all: { text: () => 'Потерять все города и всех героев', done: () => false },
    town: { text: (M, g) => 'Потерять город ' + M.objs.find(o => o.id === g.town).name, done: (S, p, g) => S.map.objs.find(o => o.id === g.town).owner !== p.id },
    hero: { text: (M, g) => 'Потерять героя ' + H.HEROES.find(x => x.id === g.hid).name, done: (S, p, g) => S.heroes.some(h => h.hid === g.hid && !h.alive && h.owner === p.id) },
    day: { text: (M, g) => 'Не успеть за ' + g.day + ' ' + H.plural(g.day, 'день', 'дня', 'дней'), done: (S, p, g) => S.day > g.day }
  };
  const goalText = (M, goals) => ({ win: goals.win.map(g => WIN[g.kind].text(M, g)), lose: goals.lose.map(g => LOSE[g.kind].text(M, g)) });

  const eliminate = (S, p, ev) => {
    p.out = true;
    for (const h of S.heroes) if (h.alive && h.owner === p.id) h.alive = false;
    for (const o of S.map.objs) if (!o.gone && o.owner === p.id && H.OBJ[o.t].kind === 'mine') o.owner = -1;
    S.ver++;
    ev.push({ t: 'out', player: p.id });
  };
  const conclude = (S, ev) => {
    if (S.over) return;
    for (const p of S.players) {
      if (p.out) continue;
      if (beaten(S, p.id) || S.goals.lose.some(g => (g.who == null ? p.human : g.who === p.id) && LOSE[g.kind].done(S, p, g))) eliminate(S, p, ev);
    }
    const alive = S.players.filter(p => !p.out), humans = S.players.filter(p => p.human);
    for (const p of alive) {
      const g = S.goals.win.find(x => (x.who == null || x.who === p.id) && WIN[x.kind].done(S, p, x));
      if (g) {
        S.over = { winner: p.id, why: g.kind };
        break;
      }
    }
    if (!S.over && (humans.length ? !humans.some(p => !p.out) : !alive.length)) S.over = { winner: alive.length === 1 ? alive[0].id : -1, why: 'lost' };
    if (S.over) ev.push({ t: 'over', winner: S.over.winner, why: S.over.why });
  };

  const settle = B => {
    if (B.winner >= 0) return;
    const value = side => B.stacks.filter(s => s.side === side && !s.summoned).reduce((t, s) => t + s.count * U(s.unit).cost, 0);
    B.winner = value(0) >= value(1) ? 0 : 1;
    B.active = -1;
  };

  const backFromBattle = (hero, slots, B, from, side, ev) => {
    slots.forEach((slot, i) => {
      const s = B.stacks[from + i], after = H.Hero.afterFight(hero.army[slot], s);
      hero.army[slot] = after.stack;
      if (after.star) ev.push({ t: 'star', hero: hero.id, unit: s.unit, stars: after.stack.stars });
    });
    if (B.sides[side].hero) hero.mana = B.sides[side].hero.mana;
  };

  const heroFell = (S, loser, winner, ev) => {
    loser.alive = false;
    const had = Object.values(loser.arts).filter(Boolean).length + loser.bag.length;
    if (winner && H.Hero.giveArts(loser, winner) && had) ev.push({ t: 'looted', hero: winner.id, count: had });
    ev.push({ t: 'lost', hero: loser.id });
  };

  const battleDone = (S, B) => {
    settle(B);
    const p = S.pending, hero = S.heroes[p.hero], foe = p.target === 'hero' ? S.heroes[p.enemy] : null, o = foe ? null : obj(S, p.obj), ev = [], res = H.Battle.result(B);
    backFromBattle(hero, p.slots, B, 0, 0, ev);
    if (foe) backFromBattle(foe, p.foeSlots, B, p.slots.length, 1, ev);
    S.pending = null;
    S.battle = null;
    S.ver++;
    if (B.winner === 0) {
      const xp = H.Hero.addXp(hero, res.xp[0]);
      ev.push({ t: 'won', hero: hero.id, xp });
      if (foe) heroFell(S, foe, hero, ev);
      else if (p.target === 'town') {
        o.garrison = o.garrison.map(() => null);
        H.Town.capture(S, o, hero, ev);
        ev.push({ t: 'town', town: o.id, hero: hero.id });
      } else {
        remove(S, o);
        visitAt(S, hero, ev);
      }
    } else {
      if (foe) ev.push({ t: 'won', hero: foe.id, xp: H.Hero.addXp(foe, res.xp[1]) });
      else if (p.target === 'town') {
        p.foeSlots.forEach((slot, i) => {
          const s = B.stacks[p.slots.length + i];
          o.garrison[slot] = s.count > 0 ? Object.assign({}, o.garrison[slot], { count: s.count }) : null;
        });
      } else o.count = B.stacks.filter(s => s.side === 1).reduce((t, s) => t + s.count, 0);
      heroFell(S, hero, foe, ev);
    }
    conclude(S, ev);
    return ev;
  };

  const slotFor = (army, unit) => {
    const same = army.findIndex(s => s && s.unit === unit);
    return same >= 0 ? same : army.findIndex(s => !s);
  };

  const resolve = (S, choice) => {
    const p = S.pending, ev = [];
    if (!p) return ev;
    const hero = S.heroes[p.hero], o = obj(S, p.obj);
    if (p.kind === 'chest') {
      const xp = choice === 'gold' ? 0 : H.Hero.addXp(hero, p.xp);
      if (choice === 'gold') S.players[hero.owner].res.gold += p.gold;
      ev.push({ t: 'gain', hero: hero.id, res: choice === 'gold' ? { gold: p.gold } : {}, xp });
      S.pending = null;
      remove(S, o);
      return ev;
    }
    if (p.kind === 'duel' && choice === 'retreat') {
      S.pending = null;
      ev.push({ t: 'retreat', hero: hero.id });
      return ev;
    }
    if (p.kind !== 'encounter' && p.kind !== 'town') return ev;
    if (choice === 'retreat') {
      hero.c = p.from[0];
      hero.r = p.from[1];
      S.pending = null;
      S.ver++;
      ev.push({ t: 'retreat', hero: hero.id });
    } else if (choice === 'accept' && p.offer === 'join') {
      const slot = slotFor(hero.army, o.unit), res = S.players[hero.owner].res;
      if (slot < 0 || res.gold < p.price) return ev;
      res.gold -= p.price;
      H.Hero.addTo(hero.army, slot, { unit: o.unit, count: o.count });
      S.pending = null;
      remove(S, o);
      ev.push({ t: 'joined', hero: hero.id, unit: o.unit, count: o.count, price: p.price });
      visitAt(S, hero, ev);
    } else if (choice === 'release' && p.offer === 'flee') {
      S.pending = null;
      remove(S, o);
      ev.push({ t: 'fled', hero: hero.id, unit: o.unit });
      visitAt(S, hero, ev);
    }
    return ev;
  };

  const endDay = S => {
    const ev = [];
    if (S.pending) return ev;
    S.day++;
    S.ver++;
    ev.push({ t: 'day', day: S.day });
    for (const p of S.players) {
      const gain = H.Town.income(S, p.id);
      for (const [k, v] of Object.entries(H.Hero.income(S, p.id))) gain[k] = (gain[k] || 0) + v;
      for (const o of S.map.objs) {
        if (o.gone || o.owner !== p.id || H.OBJ[o.t].kind !== 'mine') continue;
        const res = H.OBJ[o.t].res;
        gain[res] = (gain[res] || 0) + MP.mineIncome[res];
      }
      if (!p.human) for (const k of Object.keys(gain)) gain[k] = Math.round(gain[k] * H.DIFFICULTY[S.difficulty].income);
      for (const [k, v] of Object.entries(gain)) p.res[k] += v;
      if (Object.keys(gain).length) ev.push({ t: 'income', player: p.id, res: gain });
    }
    H.Town.newDay(S);
    H.Hero.newDay(S, ev);
    for (const h of S.heroes) if (h.alive) h.steps = daySteps(S, h);
    if ((S.day - 1) % 7 === 0) {
      for (const o of S.map.objs) {
        if (o.gone || o.t !== 'monster') continue;
        o.count = Math.min(o.max || Infinity, Math.max(o.count + 1, Math.round(o.count * (1 + H.Moons.neutralRate(S)))));
      }
      H.Town.week(S);
      ev.push({ t: 'week', week: (S.day - 1) / 7 + 1 });
    }
    for (const p of S.players) {
      if (p.out) continue;
      if (H.Town.list(S, p.id).length) {
        p.hadTown = true;
        p.townless = 0;
      } else if (p.hadTown && ++p.townless >= MP.townless) eliminate(S, p, ev);
    }
    conclude(S, ev);
    return ev;
  };

  const endTurn = S => {
    const ev = [], n = S.players.length;
    if (S.pending || S.over) return ev;
    let t = S.turn;
    for (let i = 0; i < n; i++) {
      t = (t + 1) % n;
      if (t === 0) ev.push(...endDay(S));
      if (S.over || !S.players[t].out) break;
    }
    S.turn = t;
    S.ver++;
    ev.push({ t: 'turn', player: t });
    return ev;
  };

  const SIZE_SCORE = [[48, 1], [80, 1.5], [112, 2], [144, 2.5]];
  const DIFF_SCORE = { easy: 0.8, normal: 1, hard: 1.3, impossible: 1.6 };
  const score = S => {
    const size = (SIZE_SCORE.find(([w]) => S.map.w <= w) || SIZE_SCORE[3])[1];
    return Math.max(10, Math.round(1000 * size * DIFF_SCORE[S.difficulty] * 60 / (60 + S.day)));
  };

  const date = S => ({ week: Math.floor((S.day - 1) / 7) + 1, day: (S.day - 1) % 7 + 1 });

  H.Adv = { create, addHero, daySteps, armyValue, strength, grid, obj, remove, heroAt, foeAt, path, step, engage, resolve, battleSetup, battleDone, endDay, endTurn, conclude, score, goalText, visible, reveal, splitNeutral, date, beaten };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
