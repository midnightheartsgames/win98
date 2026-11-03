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

  const allied = (S, a, b) => a !== b && a >= 0 && b >= 0 && S.players[a].team != null && S.players[a].team === S.players[b].team;
  const heroAt = (S, l, c, r) => S.heroes.find(h => h.alive && h.l === l && h.c === c && h.r === r) || null;
  const caravanAt = (S, l, c, r) => S.caravans.find(v => v.l === l && v.c === c && v.r === r) || null;

  const grid = (S, l, pid) => {
    const M = S.map, n = M.w * M.h, block = new Int32Array(n), entry = new Int32Array(n), guard = new Int32Array(n);
    for (const o of M.objs) {
      if (o.l !== l || o.gone || H.OBJ[o.t].flat) continue;
      for (const [c, r] of MD.cells(o)) if (MD.inside(M, c, r)) block[MD.idx(M, c, r)] = o.id;
      const e = MD.entry(o);
      if (e) {
        block[MD.idx(M, e[0], e[1])] = 0;
        if (pid == null || !H.Sites.openFor(S, o, pid)) entry[MD.idx(M, e[0], e[1])] = o.id;
      }
      if (o.t === 'monster') {
        for (const [dc, dr] of H.Path.DIRS) {
          const c = o.c + dc, r = o.r + dr;
          if (MD.inside(M, c, r) && !guard[MD.idx(M, c, r)]) guard[MD.idx(M, c, r)] = o.id;
        }
      }
    }
    return { block, entry, guard, tree: pid != null && H.Town.worldTree(S, pid), cradle: pid != null && H.Town.cradle(S, pid), kings: pid != null && H.Town.kings(S, pid) };
  };

  const obj = (S, id) => S.map.objs.find(o => o.id === id && !o.gone) || null;
  const remove = (S, o) => {
    o.gone = true;
    S.ver++;
  };

  const sharers = (S, pid) => S.players.filter(q => q.id === pid || allied(S, pid, q.id));
  const reveal = (S, pid, l, c, r, rad) => {
    const M = S.map, all = sharers(S, pid).filter(q => q.id === pid || q.human).map(q => q.seen[l]);
    for (let y = r - rad; y <= r + rad; y++) {
      for (let x = c - rad; x <= c + rad; x++) {
        if (MD.inside(M, x, y) && (x - c) ** 2 + (y - r) ** 2 <= rad * rad + rad) for (const seen of all) seen[MD.idx(M, x, y)] = 1;
      }
    }
  };
  const sources = (S, pid, l) => [
    ...S.heroes.filter(h => h.alive && h.owner === pid && h.l === l).map(h => [h.c, h.r, H.Hero.sight(S, h)]),
    ...S.map.objs.filter(o => !o.gone && o.l === l && o.owner === pid && H.OBJ[o.t].flag).map(o => { const e = MD.entry(o); return [e[0], e[1], o.t === 'town' ? Math.max(MP.townSight, H.Town.beaconOf(o)) : H.OBJ[o.t].sight]; })
  ];
  const visible = (S, pid, l, alone) => {
    const M = S.map, out = new Uint8Array(M.w * M.h);
    for (const [c, r, rad] of (alone ? [S.players[pid]] : sharers(S, pid)).flatMap(q => sources(S, q.id, l))) {
      for (let y = r - rad; y <= r + rad; y++) {
        for (let x = c - rad; x <= c + rad; x++) {
          if (MD.inside(M, x, y) && (x - c) ** 2 + (y - r) ** 2 <= rad * rad + rad) out[MD.idx(M, x, y)] = 1;
        }
      }
    }
    if (H.Town.list(S, pid).some(o => H.Town.beaconOf(o))) {
      const seen = S.players[pid].seen[l];
      for (const b of [...S.heroes.filter(h => h.alive && h.boat && h.l === l), ...M.objs.filter(o => o.t === 'boat' && !o.gone && o.l === l)]) {
        out[MD.idx(M, b.c, b.r)] = 1;
        seen[MD.idx(M, b.c, b.r)] = 1;
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
    if (h.tag) hero.tag = h.tag;
    if (h.patrol) hero.patrol = { c: h.c, r: h.r, l: h.l || 0, rad: h.patrol };
    if (h.xp) H.Hero.addXp(hero, h.xp);
    for (const id of h.arts || []) H.Hero.giveArt(hero, id);
    hero.steps = daySteps(S, hero);
    S.heroes.push(hero);
    reveal(S, hero.owner, hero.l, hero.c, hero.r, H.Hero.sight(S, hero));
    S.ver++;
    return hero;
  };

  const startRes = (p, k) => Object.fromEntries(Object.entries(MP.start).map(([id, v]) => [id, p.human ? Math.round(v * k) : v]));

  const create = (map, o) => {
    const S = { v: 1, seed: o.seed >>> 0, rs: ((o.seed >>> 0) ^ 0x85ebca6b) >>> 0, day: 1, ver: 1, map, players: [], heroes: [], pending: null, battle: null, over: null, moons: null, turn: 0, caravans: [], nextCaravan: 1, returning: [], nextDeal: 1, difficulty: o.difficulty || 'normal', mapName: o.name || map.name || '', goals: o.goals || map.goals || { win: [{ kind: 'defeat' }], lose: [{ kind: 'all' }] }, debug: false };
    if (o.moons !== null) S.moons = o.moons || H.Moons.roll(S);
    const k = H.DIFFICULTY[S.difficulty].start;
    for (const p of o.players) {
      S.players.push({ id: S.players.length, name: p.name, color: p.color, faction: p.faction, human: !!p.human, team: p.team == null ? null : p.team, out: false, townless: 0, hadTown: false, res: Object.assign(startRes(p, k), p.res || {}), deals: [], dealsDone: 0, shades: [], risen: 0, seals: [], menhirs: [], kills: 0, seen: Array.from({ length: map.levels }, () => new Array(map.w * map.h).fill(0)) });
    }
    for (const h of o.heroes) addHero(S, h);
    H.Town.init(S);
    H.Sites.init(S);
    H.Script.init(S, o.slotMap);
    if (o.campaign) H.Campaign.enter(S, o.campaign);
    for (const p of S.players) {
      p.hadTown = H.Town.list(S, p.id).length > 0;
      revealAll(S, p.id);
    }
    return S;
  };

  const boatAt = (S, g, i) => {
    const o = g.entry[i] ? obj(S, g.entry[i]) : null;
    return !!o && o.t === 'boat';
  };
  const stepCost = (S, hero, g, l, c, r) => {
    const M = S.map, i = MD.idx(M, c, r), ground = MD.groundCost(M, l, c, r), wet = MD.isWater(M, l, c, r);
    if (hero.boat) return (!wet && !ground) || (wet && boatAt(S, g, i)) ? 0 : MP.boatStep;
    if (wet && !ground && boatAt(S, g, i)) return MP.boatStep;
    const terrain = MD.terrainAt(M, l, c, r).id;
    if (MD.roadAt(M, l, c, r) === 3 && ((g && g.kings) || hero.faction === 'throne')) return H.Hero.ground(hero, g && g.kings ? H.HERO.throne.kingRoad : H.HERO.throne.road);
    if (g && g.tree && terrain === 'forest' && !MD.roadAt(M, l, c, r)) return H.Hero.ground(hero, H.ROADS[1].cost);
    if (g && g.cradle && wet && hero.faction === 'tide') return H.Hero.ground(hero, H.ROADS[1].cost);
    return H.Hero.ground(hero, ground && !MD.roadAt(M, l, c, r) ? H.Hero.footCost(hero, terrain, ground) : ground || H.Hero.overGround(S, hero, terrain));
  };
  const passCost = (S, l, g, hero) => i => {
    const M = S.map, c = i % M.w, r = (i / M.w) | 0;
    if (g.block[i]) return 0;
    const h = heroAt(S, l, c, r);
    if ((h && h !== hero) || caravanAt(S, l, c, r)) return 0;
    return stepCost(S, hero, g, l, c, r);
  };
  const reboard = (S, hero) => {
    const b = S.map.objs.find(o => o.t === 'boat' && !o.gone && o.l === hero.l && o.c === hero.c && o.r === hero.r);
    if (!b) return;
    hero.boat = b.id;
    b.gone = true;
  };

  const foeAt = (S, hero, l, c, r) => {
    const h = heroAt(S, l, c, r);
    return h && h.owner !== hero.owner && !allied(S, h.owner, hero.owner) ? h : null;
  };

  const path = (S, hero, c, r) => {
    const M = S.map, l = hero.l;
    if (!MD.inside(M, c, r) || (c === hero.c && r === hero.r)) return null;
    const g = grid(S, l, hero.owner), cost = passCost(S, l, g, hero), at = MD.idx(M, c, r);
    const goals = new Set();
    let kind = 'move', target = null;
    const zoc = id => {
      kind = 'attack';
      target = id;
      for (let i = 0; i < M.w * M.h; i++) if (g.guard[i] === id && cost(i)) goals.add(i);
    };
    const around = (x0, y0) => {
      for (const [dc, dr] of H.Path.DIRS) {
        const x = x0 + dc, y = y0 + dr;
        if (MD.inside(M, x, y) && cost(MD.idx(M, x, y))) goals.add(MD.idx(M, x, y));
      }
    };
    const duel = foe => {
      kind = 'duel';
      target = foe.id;
      around(foe.c, foe.r);
    };
    const blocker = g.block[at] ? obj(S, g.block[at]) : null, foe = foeAt(S, hero, l, c, r), wagon = caravanAt(S, l, c, r), friend = heroAt(S, l, c, r);
    if (wagon && (wagon.owner === hero.owner || allied(S, wagon.owner, hero.owner))) return null;
    if (friend && allied(S, friend.owner, hero.owner)) {
      kind = 'meet';
      target = friend.id;
      around(c, r);
    } else if (wagon) {
      kind = 'caravan';
      target = wagon.id;
      around(c, r);
    } else if (foe) duel(foe);
    else if (blocker && blocker.t === 'monster') zoc(blocker.id);
    else if (blocker) {
      const e = MD.entry(blocker);
      if (!e) return null;
      const ei = MD.idx(M, e[0], e[1]), holder = foeAt(S, hero, l, e[0], e[1]);
      if (holder) duel(holder);
      else if (g.guard[ei]) zoc(g.guard[ei]);
      else {
        kind = H.OBJ[blocker.t].pass && !g.entry[ei] ? 'manage' : 'visit';
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
    const terminal = i => i !== start && (g.guard[i] > 0 || g.entry[i] > 0 || (!!hero.boat && !MD.isWater(M, l, i % M.w, (i / M.w) | 0)));
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
    const g = grid(S, hero.l, hero.owner), o = obj(S, g.entry[MD.idx(S.map, hero.c, hero.r)]);
    if (!o) return;
    if (o.msg) {
      ev.push({ t: 'read', title: H.OBJ[o.t].name, text: o.msg });
      o.msg = '';
    }
    H.OBJ_VISIT[H.OBJ[o.t].kind](S, hero, o, ev, from);
    if (o.tag) H.Script.on(S, 'visit', { pid: hero.owner, hero: hero.id, tag: o.tag }, ev);
  };

  const encounter = (S, hero, o, from, ev) => {
    const mine = armyValue(hero.army), theirs = o.count * U(o.unit).cost, ratio = mine / theirs;
    if (o.msg) {
      ev.push({ t: 'read', title: U(o.unit).name, text: o.msg });
      o.msg = '';
    }
    const talk = H.Hero.hasPerk(hero, 'parley') || !!H.Hero.gear(hero).parley;
    let offer = null, chance = 0;
    for (const [min, p] of MP.join[o.mood] || []) {
      if (ratio >= min) {
        chance = Math.min(1, p * (talk ? H.HERO.parleyChance : 1));
        offer = H.roll(S) < chance ? 'join' : min >= MP.power ? 'flee' : null;
        break;
      }
    }
    let price = U(o.unit).faction === hero.faction ? 0 : Math.round(o.count * U(o.unit).cost * (talk ? H.HERO.parleyPrice : 1));
    const deal = H.Contracts.hireDeal(S, hero, o);
    if (deal) {
      offer = 'join';
      chance = 1;
      price = H.Contracts.hirePrice(hero, deal, o);
    }
    S.pending = { kind: 'encounter', hero: hero.id, obj: o.id, from, ratio, offer, chance, price, deal: deal ? deal.id : null };
    ev.push({ t: 'pending', kind: 'encounter' });
  };

  const step = (S, hero, c, r) => {
    const ev = [], M = S.map, g = grid(S, hero.l, hero.owner);
    if (S.pending || S.scene || !hero.alive) return { ok: false, ev };
    if (Math.max(Math.abs(c - hero.c), Math.abs(r - hero.r)) !== 1) return { ok: false, ev };
    const k = passCost(S, hero.l, g, hero)(MD.idx(M, c, r)) * (c !== hero.c && r !== hero.r ? MP.diagonal : 1);
    if (!k) return { ok: false, ev };
    if (hero.steps + 1e-9 < k) return { ok: false, ev: [{ t: 'tired', hero: hero.id }] };
    const from = [hero.c, hero.r], landing = !!hero.boat && !MD.isWater(M, hero.l, c, r);
    hero.steps = landing && hero.faction !== 'tide' ? 0 : Math.max(0, hero.steps - k);
    if (landing) {
      const b = M.objs.find(o => o.id === hero.boat);
      Object.assign(b, { gone: false, c: hero.c, r: hero.r, l: hero.l, owner: hero.owner });
      hero.boat = null;
    }
    if (c !== hero.c) hero.dir = Math.sign(c - hero.c);
    hero.c = c;
    hero.r = r;
    S.ver++;
    reveal(S, hero.owner, hero.l, c, r, H.Hero.sight(S, hero));
    ev.push({ t: 'step', hero: hero.id, c, r });
    S.script.hero = hero.id;
    const guard = g.guard[MD.idx(M, c, r)];
    if (guard) encounter(S, hero, obj(S, guard), from, ev);
    else visitAt(S, hero, ev, from);
    H.Script.on(S, 'cell', { pid: hero.owner, hero: hero.id, c, r, l: hero.l }, ev);
    conclude(S, ev);
    return { ok: true, ev };
  };

  const engage = (S, hero, target, kind) => {
    const ev = [];
    if (S.pending || S.scene || kind === 'meet') return ev;
    S.script.hero = hero.id;
    if (kind === 'caravan') {
      const wagon = S.caravans.find(v => v.id === target);
      if (!wagon || wagon.owner === hero.owner || wagon.l !== hero.l || Math.max(Math.abs(wagon.c - hero.c), Math.abs(wagon.r - hero.r)) !== 1) return ev;
      S.pending = { kind: 'caravan', hero: hero.id, caravan: wagon.id, from: [hero.c, hero.r] };
      ev.push({ t: 'pending', kind: 'caravan' });
      return ev;
    }
    if (kind === 'duel') {
      const foe = S.heroes[target];
      if (!foe || !foe.alive || foe.owner === hero.owner || foe.l !== hero.l || Math.max(Math.abs(foe.c - hero.c), Math.abs(foe.r - hero.r)) !== 1) return ev;
      const held = H.Town.list(S, foe.owner).find(t => H.Town.visitor(S, t) === foe);
      S.pending = held ? { kind: 'town', hero: hero.id, obj: held.id, from: [hero.c, hero.r] } : { kind: 'duel', hero: hero.id, enemy: foe.id, from: [hero.c, hero.r] };
      ev.push({ t: 'pending', kind: S.pending.kind });
      return ev;
    }
    const o = obj(S, target);
    if (!o) return ev;
    if (o.t === 'monster') encounter(S, hero, o, [hero.c, hero.r], ev);
    else if (kind === 'manage') H.OBJ_VISIT[H.OBJ[o.t].kind](S, hero, o, ev);
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

  const fortLevel = o => [3, 2, 1].find(n => (o.built || []).includes('fort' + n)) || 0;
  const siegeOf = (o, defenders) => {
    const fort = fortLevel(o), T = H.SIEGE, glass = (o.built || []).some(id => H.Town.def(o, id).obsidian);
    return fort ? { fort, faction: o.faction, dmg: Math.round((T.towerBase + T.towerShare * defenders) * (glass ? 1.5 : 1)), wallMul: glass ? 2 : 1 } : null;
  };
  const townBonus = o => (o.built || []).reduce((t, id) => {
    const x = H.FACTIONS[o.faction].building[id];
    t.morale += x.siegeMorale || 0;
    t.guard += x.siegeDef || 0;
    t.luck += x.siegeLuck || 0;
    t.hp += x.siegeHp || 0;
    return t;
  }, { morale: 0, guard: 0, luck: 0, hp: 0 });

  const retreatRights = (S, side, h, hasEnemy, holdsTown) => Object.assign(side, {
    canFlee: !holdsTown && !!H.Town.nearestTavern(S, h),
    ransomOk: hasEnemy,
    gold: S.players[h.owner].res.gold,
    aiFlees: !S.players[h.owner].human
  });

  const altarMorale = (S, pid) => H.Town.list(S, pid).reduce((t, o) => Math.max(t, ...o.built.map(id => H.Town.def(o, id).altarMorale || 0)), 0);
  const heroSide = (S, h, slots) => {
    const side = H.Hero.battleSide(h, slots);
    side.morale += altarMorale(S, h.owner);
    if (H.Town.volcano(S, h.owner)) {
      side.hero.atk += H.HERO.forge.atk;
      side.hero.heatStart = true;
    }
    if (H.Town.kings(S, h.owner)) side.hero.kings = H.HERO.throne.edge;
    if (side.hero.mirror && H.Town.mirrorHall(S, h.owner)) side.hero.mirrorShare += H.HERO.throne.hall;
    return side;
  };
  const townDefenders = (S, o, guest, guestSlots, foeSlots) => {
    const bonus = townBonus(o), garrison = foeSlots.map(i => Object.assign(stackCopy(o.garrison[i]), { guard: bonus.guard, hpPlus: bonus.hp }));
    if (!guest) return { morale: bonus.morale, luck: bonus.luck, stacks: garrison };
    const side = heroSide(S, guest, guestSlots);
    side.morale += bonus.morale;
    side.luck += bonus.luck;
    for (const x of side.stacks) x.guard = bonus.guard;
    side.front = side.stacks.length;
    side.stacks.push(...garrison);
    return side;
  };

  const battleSetup = S => {
    const p = S.pending, hero = S.heroes[p.hero], foe = p.kind === 'duel' ? S.heroes[p.enemy] : null, wagon = p.kind === 'caravan' ? S.caravans.find(v => v.id === p.caravan) : null;
    const o = foe || wagon ? null : obj(S, p.obj), town = !!o && !!H.OBJ[o.t].held, guest = town ? H.Town.visitor(S, o) : null, vault = !!o && H.OBJ[o.t].kind === 'vault';
    const slots = slotsOf(hero.army), foeSlots = foe ? slotsOf(foe.army) : town ? slotsOf(o.garrison) : null, guestSlots = guest ? slotsOf(guest.army) : null;
    p.slots = slots;
    p.foeSlots = foeSlots;
    p.guest = guest ? guest.id : null;
    p.guestSlots = guestSlots;
    p.target = foe ? 'hero' : wagon ? 'caravan' : town ? 'town' : vault ? 'vault' : 'monster';
    p.kind = 'battle';
    const defender = foe ? foe.owner : town ? o.owner : wagon ? wagon.owner : -1;
    const near = retreatRights(S, heroSide(S, hero, slots), hero, defender >= 0, false);
    let far;
    if (foe) far = retreatRights(S, heroSide(S, foe, foeSlots), foe, true, false);
    else if (town) far = townDefenders(S, o, guest, guestSlots, foeSlots);
    else if (wagon) far = { stacks: wagon.stacks.map(stackCopy) };
    else if (vault) far = { stacks: H.Sites.vaultGuards(o) };
    else far = { stacks: splitNeutral(o) };
    near.plantByHand = S.players[hero.owner].human;
    if (foe || guest) far.plantByHand = S.players[(foe || guest).owner].human;
    const wet = (h, l) => !!h && MD.isWater(S.map, l, h.c, h.r);
    const held = far.stacks.reduce((t, s) => t + s.count * U(s.unit).cost, 0);
    return {
      name: foe ? 'Бой с героем: ' + foe.name : wagon ? 'Бой с обозом' : o.t === 'town' ? 'Бой за город: ' + o.name : town || vault ? 'Бой: ' + H.OBJ[o.t].name : 'Бой: ' + U(o.unit).name,
      player: S.players[hero.owner].human ? 0 : defender >= 0 && S.players[defender].human ? 1 : null,
      humans: [S.players[hero.owner].human ? 0 : -1, defender >= 0 && S.players[defender].human ? 1 : -1].filter(x => x >= 0),
      colors: [S.players[hero.owner].color, defender >= 0 ? S.players[defender].color : -1],
      moon: H.Moons.battle(S),
      seed: Math.floor(H.roll(S) * 1e9),
      siege: town ? siegeOf(o, held) : null,
      deck: wet(hero, hero.l) || wet(foe, hero.l),
      shore: H.Path.DIRS.some(([dc, dr]) => MD.inside(S.map, hero.c + dc, hero.r + dr) && MD.isWater(S.map, hero.l, hero.c + dc, hero.r + dr)),
      field: MD.fieldAt(S.map, hero.l, hero.c, hero.r),
      sides: [near, far]
    };
  };

  const beaten = (S, pid) => !S.heroes.some(h => h.alive && h.owner === pid) && !H.Town.list(S, pid).length;

  const WIN = {
    defeat: { text: () => 'Разбить всех врагов', done: (S, p) => S.players.length > 1 && S.players.every(q => q.id === p.id || q.out || allied(S, q.id, p.id)) },
    town: { text: (M, g) => 'Взять город ' + M.objs.find(o => o.id === g.town).name, done: (S, p, g) => S.map.objs.find(o => o.id === g.town).owner === p.id },
    gold: { text: (M, g) => 'Накопить ' + g.n + ' золота', done: (S, p, g) => p.res.gold >= g.n },
    hero: { text: (M, g) => 'Победить героя ' + H.HEROES.find(x => x.id === g.hid).name, done: (S, p, g) => S.heroes.some(h => h.hid === g.hid && !h.alive && h.owner !== p.id) },
    heart: { text: () => 'Поднять Сердце Восьмой луны: построить лунный алтарь', done: (S, p) => H.Town.list(S, p.id).some(o => o.built.includes('altar')) },
    flag: { text: (M, g) => g.text || 'Выполнить задание карты', done: (S, p, g) => !!S.script.flags[g.flag] }
  };
  const LOSE = {
    all: { text: () => 'Потерять все города и всех героев', done: () => false },
    town: { text: (M, g) => 'Потерять город ' + M.objs.find(o => o.id === g.town).name, done: (S, p, g) => S.map.objs.find(o => o.id === g.town).owner !== p.id },
    hero: { text: (M, g) => 'Потерять героя ' + H.HEROES.find(x => x.id === g.hid).name, done: (S, p, g) => S.heroes.some(h => h.hid === g.hid && !h.alive && !h.away && h.owner === p.id) },
    day: { text: (M, g) => 'Не успеть за ' + g.day + ' ' + H.plural(g.day, 'день', 'дня', 'дней'), done: (S, p, g) => S.day > g.day },
    flag: { text: (M, g) => g.text || 'Провалить задание карты', done: (S, p, g) => !!S.script.flags[g.flag] }
  };
  const goalText = (M, goals) => ({ win: goals.win.map(g => WIN[g.kind].text(M, g)), lose: goals.lose.map(g => LOSE[g.kind].text(M, g)) });

  const eliminate = (S, p, ev) => {
    p.out = true;
    for (const h of S.heroes) if (h.alive && h.owner === p.id) h.alive = false;
    for (const o of S.map.objs) if (!o.gone && o.owner === p.id && o.t !== 'town' && H.OBJ[o.t].flag) o.owner = -1;
    S.ver++;
    ev.push({ t: 'out', player: p.id });
  };
  const conclude = (S, ev) => {
    if (S.over) return;
    H.Contracts.sweep(S, ev);
    H.Script.poll(S, ev);
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
    const recover = side === B.winner ? H.Hero.gear(hero).recover || 0 : 0;
    slots.forEach((slot, i) => {
      const s = B.stacks[from + i], after = H.Hero.afterFight(hero.army[slot], s), back = Math.round((s.start - (s.count - (s.borrowed || 0))) * recover);
      hero.army[slot] = after.stack;
      if (back > 0) H.Hero.addTo(hero.army, slot, { unit: s.unit, count: back, stars: s.stars, vet: s.vet });
      if (after.star) ev.push({ t: 'star', hero: hero.id, unit: s.unit, stars: after.stack.stars });
    });
    if (B.sides[side].hero) hero.mana = B.sides[side].hero.mana;
    hero.fresh = { morale: 0, luck: 0 };
    for (const s of B.stacks) {
      if (s.side !== side || !U(s.unit).machine || s.count > 0 || !hero.machines.includes(s.unit)) continue;
      hero.machines = hero.machines.filter(id => id !== s.unit);
      ev.push({ t: 'machineLost', hero: hero.id, unit: s.unit });
    }
  };

  const withdraw = (S, h, fled, ev) => {
    if (fled.kind === 'ransom') S.players[h.owner].res.gold = Math.max(0, S.players[h.owner].res.gold - fled.price);
    H.Sites.dropHeart(S, h, null);
    h.alive = false;
    h.away = true;
    S.returning.push({ hero: h.id, day: S.day + 1, kind: fled.kind });
    ev.push({ t: 'withdrew', hero: h.id, kind: fled.kind, price: fled.price });
  };

  const heroFell = (S, loser, winner, ev) => {
    H.Sites.dropHeart(S, loser, winner);
    loser.alive = false;
    const had = Object.values(loser.arts).filter(Boolean).length + loser.bag.length;
    if (winner && H.Hero.giveArts(loser, winner) && had) ev.push({ t: 'looted', hero: winner.id, count: had });
    if (winner) S.players[winner.owner].kills = (S.players[winner.owner].kills || 0) + 1;
    const altar = H.Town.altarRise(S, loser);
    if (altar) {
      loser.away = true;
      S.returning.push({ hero: loser.id, day: S.day + H.Town.def(altar, 'altar').heroRise, kind: 'altar', town: altar.id });
    }
    ev.push({ t: 'lost', hero: loser.id });
  };

  const battleDone = (S, B) => {
    settle(B);
    const p = S.pending, hero = S.heroes[p.hero], foe = p.target === 'hero' ? S.heroes[p.enemy] : null, guest = p.guest != null ? S.heroes[p.guest] : null, wagon = p.target === 'caravan' ? S.caravans.find(v => v.id === p.caravan) : null;
    const o = foe || wagon ? null : obj(S, p.obj), ev = [], res = H.Battle.result(B), from = p.slots.length, after = from + (guest ? p.guestSlots.length : 0);
    backFromBattle(hero, p.slots, B, 0, 0, ev);
    if (foe) backFromBattle(foe, p.foeSlots, B, from, 1, ev);
    if (guest) backFromBattle(guest, p.guestSlots, B, from, 1, ev);
    S.pending = null;
    S.battle = null;
    S.ver++;
    H.Town.fallen(S, hero.owner, hero, hero, res.lost[0], res.souls[0], ev);
    const keeper = foe || guest;
    const ownerFar = foe ? foe.owner : guest ? guest.owner : o && o.owner >= 0 ? o.owner : -1;
    if (ownerFar >= 0) H.Town.fallen(S, ownerFar, keeper, keeper || o, res.lost[1], res.souls[1], ev);
    if (B.winner === 0) {
      const xp = H.Hero.addXp(hero, res.xp[0]);
      ev.push({ t: 'won', hero: hero.id, xp });
      if (foe) {
        H.Contracts.won(S, hero.owner, { hero: foe.id }, ev);
        if (B.fled) withdraw(S, foe, B.fled, ev);
        else heroFell(S, foe, hero, ev);
      } else if (wagon) {
        for (const x of wagon.stacks) {
          const slot = H.Hero.slotFor(hero.army, x.unit), n = Math.ceil(x.count * H.TOWN.caravanLoot);
          if (slot >= 0) H.Hero.addTo(hero.army, slot, { unit: x.unit, count: n, stars: 0, vet: 0 });
        }
        S.caravans = S.caravans.filter(v => v !== wagon);
        ev.push({ t: 'caravanTaken', hero: hero.id });
      } else if (p.target === 'town') {
        if (guest) {
          H.Contracts.won(S, hero.owner, { hero: guest.id }, ev);
          heroFell(S, guest, hero, ev);
        }
        o.garrison = o.garrison.map(() => null);
        if (o.t === 'town') {
          H.Town.capture(S, o, hero, ev);
          ev.push({ t: 'town', town: o.id, hero: hero.id });
        } else {
          o.owner = hero.owner;
          ev.push({ t: 'capture', obj: o.id });
        }
      } else if (p.target === 'vault') H.Sites.vaultWon(S, hero, o, ev);
      else {
        remove(S, o);
        H.Contracts.won(S, hero.owner, { obj: o.id }, ev);
        visitAt(S, hero, ev);
        H.Sites.mercOffer(S, hero, o, ev);
      }
    } else {
      if (foe) ev.push({ t: 'won', hero: foe.id, xp: H.Hero.addXp(foe, res.xp[1]) });
      else if (guest) ev.push({ t: 'won', hero: guest.id, xp: H.Hero.addXp(guest, res.xp[1]) });
      if (wagon) {
        wagon.stacks.forEach((x, i) => { x.count = B.stacks[from + i].count; });
        wagon.stacks = wagon.stacks.filter(x => x.count > 0);
      } else if (p.target === 'town') {
        p.foeSlots.forEach((slot, i) => {
          const s = B.stacks[after + i];
          o.garrison[slot] = s.count > 0 ? Object.assign({}, o.garrison[slot], { count: s.count }) : null;
        });
      } else if (p.target === 'vault') H.Sites.vaultLost(o, B, from);
      else if (!foe) o.count = B.stacks.filter(s => s.side === 1).reduce((t, s) => t + s.count, 0);
      if (foe || guest) H.Contracts.won(S, (foe || guest).owner, { hero: hero.id }, ev);
      if (B.fled) withdraw(S, hero, B.fled, ev);
      else heroFell(S, hero, foe || guest, ev);
    }
    conclude(S, ev);
    return ev;
  };

  const caravanCost = (S, l, g, gi) => i => ((g.block[i] || g.guard[i]) && i !== gi ? 0 : MD.groundCost(S.map, l, i % S.map.w, (i / S.map.w) | 0));
  const caravanRoute = (S, from, to) => {
    const M = S.map, a = MD.entry(from), b = MD.entry(to), gi = MD.idx(M, b[0], b[1]), g = grid(S, to.l);
    if (from.l !== to.l) return null;
    return H.Path.find(M.w, M.h, MD.idx(M, a[0], a[1]), new Set([gi]), caravanCost(S, to.l, g, gi), () => false, 0.4);
  };
  const caravanStep = (S, v, ev) => {
    const M = S.map, town = H.Town.byId(S, v.to);
    if (!town || town.owner !== v.owner) {
      const near = H.Town.list(S, v.owner).sort((a, b) => Math.hypot(a.c - v.c, a.r - v.r) - Math.hypot(b.c - v.c, b.r - v.r))[0];
      if (!near) return;
      v.to = near.id;
      return caravanStep(S, v, ev);
    }
    const goal = MD.entry(town), gi = MD.idx(M, goal[0], goal[1]), g = grid(S, v.l), road = caravanCost(S, v.l, g, gi);
    const cost = i => {
      const c = i % M.w, r = (i / M.w) | 0;
      return i !== gi && (heroAt(S, v.l, c, r) || caravanAt(S, v.l, c, r)) ? 0 : road(i);
    };
    const found = H.Path.find(M.w, M.h, MD.idx(M, v.c, v.r), new Set([gi]), cost, () => false, 0.4) || H.Path.find(M.w, M.h, MD.idx(M, v.c, v.r), new Set([gi]), road, () => false, 0.4);
    if (!found) return;
    let left = MP.caravanSteps, at = MD.idx(M, v.c, v.r);
    for (const i of found.cells) {
      const c = i % M.w, r = (i / M.w) | 0, pc = at % M.w, pr = (at / M.w) | 0, k = road(i) * (pc !== c && pr !== r ? MP.diagonal : 1);
      if (left + 1e-9 < k) return;
      if (i === gi) {
        deliver(S, v, town, ev);
        return;
      }
      if (heroAt(S, v.l, c, r)) return;
      left -= k;
      at = i;
      if (caravanAt(S, v.l, c, r)) continue;
      if (c !== v.c) v.dir = Math.sign(c - v.c);
      v.c = c;
      v.r = r;
    }
  };
  const deliver = (S, v, town, ev) => {
    v.stacks = v.stacks.filter(x => {
      const slot = H.Hero.slotFor(town.garrison, x.unit);
      if (slot < 0) return true;
      H.Hero.addTo(town.garrison, slot, x);
      return false;
    });
    if (!v.stacks.length) {
      S.caravans = S.caravans.filter(q => q !== v);
      ev.push({ t: 'caravanCame', town: town.id, owner: v.owner });
      if (town.tag) H.Script.on(S, 'caravan', { pid: v.owner, tag: town.tag }, ev);
    }
  };
  const moveRoutes = (S, ev) => {
    let moved = false;
    for (const o of S.map.objs) {
      if (o.gone || o.t !== 'monster' || !o.route || o.routeDone) continue;
      for (let left = o.pace || 10; left > 0 && !o.routeDone; left--) {
        const to = o.route[o.routeAt || 0];
        if (!to) {
          o.routeDone = true;
          break;
        }
        if (o.c === to[0] && o.r === to[1]) {
          o.routeAt = (o.routeAt || 0) + 1;
          left++;
          continue;
        }
        const c = o.c + Math.sign(to[0] - o.c), r = o.r + Math.sign(to[1] - o.r);
        const near = S.heroes.some(h => h.alive && h.l === o.l && Math.max(Math.abs(h.c - c), Math.abs(h.r - r)) <= 1);
        if (near) break;
        o.c = c;
        o.r = r;
        moved = true;
        for (const p of S.players) if (p.human && !p.out) reveal(S, p.id, o.l, c, r, 2);
      }
    }
    if (moved) {
      H.AI.forget(S.map);
      S.ver++;
      ev.push({ t: 'routes' });
    }
  };
  const moveCaravans = (S, ev) => {
    for (const v of S.caravans.slice()) caravanStep(S, v, ev);
    if (S.caravans.length) S.ver++;
  };

  const slotFor = (army, unit) => {
    const same = army.findIndex(s => s && s.unit === unit);
    return same >= 0 ? same : army.findIndex(s => !s);
  };

  const resolve = (S, choice) => {
    const p = S.pending, ev = [];
    if (!p) return ev;
    const hero = S.heroes[p.hero], o = obj(S, p.obj);
    if (p.kind === 'choice') {
      S.pending = null;
      H.SITE_PICK[p.site](S, hero, o, choice, ev, p);
      conclude(S, ev);
      return ev;
    }
    if (p.kind === 'chest') {
      const xp = choice === 'gold' ? 0 : H.Hero.addXp(hero, p.xp);
      if (choice === 'gold') S.players[hero.owner].res.gold += p.gold;
      ev.push({ t: 'gain', hero: hero.id, res: choice === 'gold' ? { gold: p.gold } : {}, xp });
      S.pending = null;
      remove(S, o);
      return ev;
    }
    if ((p.kind === 'duel' || p.kind === 'caravan') && choice === 'retreat') {
      S.pending = null;
      ev.push({ t: 'retreat', hero: hero.id });
      return ev;
    }
    if (p.kind !== 'encounter' && p.kind !== 'town' && p.kind !== 'vault') return ev;
    if (choice === 'retreat') {
      hero.c = p.from[0];
      hero.r = p.from[1];
      reboard(S, hero);
      S.pending = null;
      S.ver++;
      ev.push({ t: 'retreat', hero: hero.id });
    } else if (choice === 'accept' && p.offer === 'join') {
      const slot = slotFor(hero.army, o.unit), res = S.players[hero.owner].res;
      if (slot < 0 || res.gold < p.price) return ev;
      res.gold -= p.price;
      H.Hero.addTo(hero.army, slot, { unit: o.unit, count: o.count });
      S.pending = null;
      if (p.deal != null) H.Contracts.hired(S, hero.owner, p.deal, ev);
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
    if (S.pending || S.scene) return ev;
    S.day++;
    S.ver++;
    ev.push({ t: 'day', day: S.day });
    for (const p of S.players) {
      const gain = H.Town.income(S, p.id);
      for (const [k, v] of Object.entries(H.Hero.income(S, p.id))) gain[k] = (gain[k] || 0) + v;
      for (const o of S.map.objs) {
        if (o.gone || o.owner !== p.id || H.OBJ[o.t].kind !== 'mine') continue;
        const res = H.mineRes(o);
        gain[res] = (gain[res] || 0) + MP.mineIncome[res];
      }
      if (!p.human) for (const k of Object.keys(gain)) gain[k] = Math.round(gain[k] * H.DIFFICULTY[S.difficulty].income);
      for (const [k, v] of Object.entries(gain)) p.res[k] += v;
      if (Object.keys(gain).length) ev.push({ t: 'income', player: p.id, res: gain });
    }
    H.Town.newDay(S);
    H.Hero.newDay(S, ev);
    moveCaravans(S, ev);
    moveRoutes(S, ev);
    H.Town.riseAtAltars(S, ev);
    if ((S.day - 1) % 7 === 0) H.Sites.week(S, ev);
    for (const h of S.heroes) if (h.alive) h.steps = daySteps(S, h);
    if ((S.day - 1) % 7 === 0) {
      for (const o of S.map.objs) {
        if (o.gone || o.t !== 'monster') continue;
        o.count = Math.min(o.max || Infinity, Math.max(o.count + 1, Math.round(o.count * (1 + H.Moons.neutralRate(S)))));
      }
      H.Town.week(S);
      for (const p of S.players) {
        if (p.out || !S.heroes.some(h => h.alive && h.owner === p.id && H.Hero.hasTalent(h, 'tide-6'))) continue;
        const n = H.Town.list(S, p.id).filter(o => o.water).length;
        p.res.salt += n;
        p.res.amber += n;
      }
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
    if (S.pending || S.scene || S.over) return ev;
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

  H.Adv = { allied, WIN, LOSE, stepCost, reboard, altarMorale, heroSide, create, addHero, daySteps, armyValue, strength, grid, obj, remove, heroAt, foeAt, caravanAt, caravanRoute, fortLevel, siegeOf, path, step, engage, resolve, battleSetup, battleDone, endDay, endTurn, conclude, score, goalText, visible, reveal, splitNeutral, date, beaten };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
