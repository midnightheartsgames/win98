(function (H) {
  'use strict';
  const MD = H.MapData, Adv = H.Adv, TW = H.Town, HE = H.Hero, BA = H.Battle, BAI = H.BattleAI, MP = H.MAP;
  const PRICE = Object.assign({ gold: 1 }, H.TOWN.value);
  const GUARD_COST = 100000;
  const RUIN_WORTH = 6000;
  const MINE_DAYS = 12;
  const ART_WORTH = { plain: 2500, rare: 6000, relic: 11000 };
  const SHOP_GOLD = 3;
  const DEAL_KEEP = { common: 10, rare: 3 };
  const AIM_WORTH = 40000;
  const RAISE_GOLD = 1500;
  const AIM_LOSS = 0.8;
  const DEAL_GOLD = 1.2;
  const DEAL_TRIP = 0.5;
  const MAX_LOSS = { main: 0.45, helper: 0.25 };
  const TOWN_LOSS = 0.65;
  const MAX_PICKS = 14;
  const MAIN_RANGE = 3.5;
  const SECOND_ARMY = 10000;
  const MAIN_ENOUGH = 40000;
  const GARRISON_SHARE = 0.2;
  const HOME_PAUSE = 4;
  const EXPLORE_WORTH = 18;
  const HUNT_WORTH = 4;
  const PROBE_WORTH = 6000;
  const PROBE_RADIUS = 6;
  const DARK_WORTH = 6;
  const DARK_CAP = 2600;
  const REGION_SHARE = 0.5;
  const LEFT_DAYS = 8;
  const LEFT_SHARE = 0.2;
  const DIG_AREA = 30;
  const HEART_WORTH = 40000;
  const DIG_WORTH = 25000;
  const HELPER_TRANSIT = 0.3;
  const TRANSIT = ['portal', 'moongate', 'whirlpool', 'boat'];
  const RING_WORTH = 1500;
  const RING_MARGIN = 6;

  const REGIONS = new WeakMap();
  const forget = M => REGIONS.delete(M);
  const regionsOf = (M, l) => {
    if (!REGIONS.has(M)) REGIONS.set(M, []);
    const all = REGIONS.get(M);
    if (all[l]) return all[l];
    const n = M.w * M.h, id = new Int32Array(n), wet = new Uint8Array(n), links = new Map();
    for (let i = 0; i < n; i++) wet[i] = MD.isWater(M, l, i % M.w, (i / M.w) | 0) ? 1 : 0;
    const open = i => wet[i] || MD.groundCost(M, l, i % M.w, (i / M.w) | 0) > 0;
    let next = 1;
    for (let i = 0; i < n; i++) {
      if (id[i] || !open(i)) continue;
      const stack = [i], reg = next++;
      id[i] = reg;
      while (stack.length) {
        const u = stack.pop(), uc = u % M.w, ur = (u / M.w) | 0;
        for (const [dc, dr] of H.Path.DIRS) {
          const c = uc + dc, r = ur + dr;
          if (c < 0 || r < 0 || c >= M.w || r >= M.h) continue;
          const v = r * M.w + c;
          if (id[v] || !open(v) || wet[v] !== wet[u]) continue;
          const same = i => open(i) && wet[i] === wet[u];
          if (dc && dr && !same(ur * M.w + c) && !same(r * M.w + uc)) continue;
          id[v] = reg;
          stack.push(v);
        }
      }
    }
    for (let i = 0; i < n; i++) {
      if (!wet[i] || !id[i]) continue;
      const c0 = i % M.w, r0 = (i / M.w) | 0;
      for (const [dc, dr] of H.Path.DIRS) {
        const c = c0 + dc, r = r0 + dr;
        if (c < 0 || r < 0 || c >= M.w || r >= M.h) continue;
        const v = r * M.w + c;
        if (wet[v] || !id[v]) continue;
        if (!links.has(id[i])) links.set(id[i], new Set());
        links.get(id[i]).add(id[v]);
      }
    }
    all[l] = { id, wet, links };
    return all[l];
  };

  const value = army => Adv.armyValue(army);
  const slots = army => army.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
  const stepsOf = d => d % GUARD_COST;

  const field = (S, h, reach) => {
    const M = S.map, n = M.w * M.h, g = Adv.grid(S, h.l, h.owner), walk = new Float64Array(n), dist = new Float64Array(n).fill(Infinity), via = new Int32Array(n), land = h.boat ? regionsOf(M, h.l).wet : null;
    for (let i = 0; i < n; i++) {
      if (g.block[i]) continue;
      walk[i] = Adv.stepCost(S, h, g, h.l, i % M.w, (i / M.w) | 0);
    }
    for (const x of S.heroes) if (x.alive && x !== h && x.l === h.l) walk[MD.idx(M, x.c, x.r)] = 0;
    for (const v of S.caravans) if (v.l === h.l) walk[MD.idx(M, v.c, v.r)] = 0;
    const start = MD.idx(M, h.c, h.r), heap = [];
    dist[start] = 0;
    H.Path.push(heap, [0, start]);
    while (heap.length) {
      const [d, u] = H.Path.pop(heap);
      if (d > dist[u] + 1e-9 || (u !== start && (g.entry[u] || (land && !land[u])))) continue;
      const uc = u % M.w, ur = (u / M.w) | 0;
      for (const [dc, dr] of H.Path.DIRS) {
        const c = uc + dc, r = ur + dr;
        if (c < 0 || r < 0 || c >= M.w || r >= M.h) continue;
        const v = r * M.w + c;
        if (!walk[v]) continue;
        const diag = dc && dr;
        if (diag && !walk[ur * M.w + c] && !walk[r * M.w + uc]) continue;
        const guard = g.guard[v], next = d + walk[v] * (diag ? MP.diagonal : 1) + (guard && g.guard[u] !== guard ? GUARD_COST : 0);
        if (stepsOf(next) > reach || next >= dist[v] - 1e-9) continue;
        dist[v] = next;
        via[v] = via[u] || guard;
        H.Path.push(heap, [next, v]);
      }
    }
    return { dist, via, g };
  };

  const begin = (S, pid) => ({ pid, stage: 'towns', towns: null, queue: null, hero: null, walk: null, picks: {}, skip: new Set(), cache: new Map(), level: H.DIFFICULTY[S.difficulty], main: null, threats: [] });

  const known = (S, T, l, i) => T.level.sees || S.players[T.pid].seen[l][i];

  const foesInSight = (S, T, l) => {
    const vis = Adv.visible(S, T.pid, l, true), M = S.map;
    return S.heroes.filter(x => x.alive && x.owner !== T.pid && !Adv.allied(S, x.owner, T.pid) && x.l === l && (T.level.sees || vis[MD.idx(M, x.c, x.r)]));
  };

  const heroSide = h => HE.battleSide(h, slots(h.army));
  const estimateFor = (S, T, h, key, side) => {
    const k = h.id + ':' + value(h.army) + ':' + h.level + ':' + key;
    if (!T.cache.has(k)) T.cache.set(k, BAI.estimate([heroSide(h), side], H.Moons.battle(S), side.siege));
    return T.cache.get(k);
  };
  const garrisonOf = o => slots(o.garrison).map(i => ({ unit: o.garrison[i].unit, count: o.garrison[i].count, stars: o.garrison[i].stars || 0, vet: o.garrison[i].vet || 0 }));
  const townSide = (S, o) => {
    const v = S.heroes.find(x => x.alive && x.l === o.l && x.owner === o.owner && x.c === MD.entry(o)[0] && x.r === MD.entry(o)[1]);
    const side = v ? heroSide(v) : { stacks: [] };
    side.stacks = [...side.stacks, ...garrisonOf(o)];
    side.siege = Adv.siegeOf(o, side.stacks.reduce((t, s) => t + s.count * H.UNITS[s.unit].cost, 0));
    return side;
  };

  const levelUp = (S, h) => {
    for (let up = HE.nextUp(S, h); up; up = HE.nextUp(S, h)) {
      if (up.step === 'card') {
        const w = H.CLASSES[h.cls].cards, scored = up.cards.map(c => (w[c.skill] || 0) * (c.rank > 1 ? 1.5 : 1));
        HE.pickCard(h, scored[1] > scored[0] ? 1 : 0);
      }
      if (h.up && h.up.step === 'perk') HE.pickPerk(h, Math.floor(H.roll(S) * 2));
      if (h.up && h.up.step === 'talent') HE.pickTalent(h, Math.floor(H.roll(S) * 2));
      HE.closeUp(h);
    }
  };

  const chain = (o, id) => {
    if (TW.has(o, id)) return null;
    for (const n of TW.def(o, id).needs) {
      const under = chain(o, n);
      if (under) return under;
    }
    return id;
  };

  const wants = (S, T, o) => {
    const F = H.FACTIONS[o.faction], order = F.ai.slice(), mage = T.main && H.CLASSES[T.main.cls].mage;
    if (T.threats.includes(o.id)) order.unshift('fort1', 'fort2');
    if (o.heart) order.unshift('altar');
    if (mage) order.splice(2, 0, 'guild1', 'guild2');
    const out = [], seen = new Set();
    if (TW.list(S, T.pid).length > 1) order.splice(5, 0, 'caravan');
    for (const goal of order) {
      const id = chain(o, goal);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const st = TW.state(S, o, id);
      if (st.s === 'forbidden') continue;
      out.push({ id, st });
      if (out.length >= 6) break;
    }
    return out;
  };

  const income = (S, T) => {
    const own = TW.income(S, T.pid).gold || 0;
    return own + S.map.objs.filter(o => !o.gone && o.owner === T.pid && H.OBJ[o.t].res === 'gold').length * MP.mineIncome.gold;
  };

  const trade = (S, T, want) => {
    const res = S.players[T.pid].res, ev = [];
    if (!want || want.st.s !== 'money') return ev;
    for (const [k, need] of Object.entries(want.st.miss)) {
      if (k === 'gold') {
        for (const r of ['wood', 'ore']) {
          if (res[r] < 30) continue;
          const q = TW.quote(S, T.pid, r, 'gold');
          if (q && q.max >= 1) ev.push(...TW.trade(S, T.pid, r, 'gold', Math.min(need, Math.floor((res[r] - 20) * q.give / q.get))).ev);
        }
        continue;
      }
      const q = TW.quote(S, T.pid, 'gold', k), spare = res.gold - 4000;
      if (!q || spare <= 0) continue;
      const m = Math.min(need, Math.floor(spare * q.give / q.get));
      if (m >= 1) ev.push(...TW.trade(S, T.pid, 'gold', k, m).ev);
    }
    return ev;
  };

  const hire = (S, T, o) => {
    const res = S.players[T.pid].res, count = S.heroes.filter(x => x.alive && x.owner === T.pid).length, back = TW.backHeroes(S, o)[0];
    if (count >= heroesWanted(S, T) || (count > 0 && (S.day < 2 || res.gold < H.TOWN.heroPrice + 500))) return [];
    if (back) return TW.hireBack(S, o, back.id).ev;
    const r = TW.hire(S, o, 0);
    return r.ok ? r.ev : (TW.hire(S, o, 1).ev || []);
  };

  const heroesWanted = (S, T) => Math.min(4, 2 + Math.floor(S.day / 21) + Math.max(0, TW.list(S, T.pid).length - 1));
  const holdFor = (S, T, o, want) => {
    const res = S.players[T.pid].res, held = {}, count = S.heroes.filter(x => x.alive && x.owner === T.pid).length;
    if (!count && TW.has(o, 'tavern')) {
      held.gold = Math.min(res.gold, H.TOWN.heroPrice);
      return held;
    }
    if (!want || T.threats.includes(o.id)) return held;
    for (const [k, v] of Object.entries(TW.def(o, want.id).cost)) held[k] = Math.min(res[k], k === 'gold' ? Math.min(v, Math.round(res.gold * 0.6)) : v);
    if (count < heroesWanted(S, T) && S.day >= 2) held.gold = Math.min(res.gold, Math.max(held.gold || 0, H.TOWN.heroPrice));
    return held;
  };
  const recruit = (S, T, o, want) => {
    const res = S.players[T.pid].res, held = holdFor(S, T, o, want);
    for (const [k, v] of Object.entries(held)) res[k] -= v;
    const ev = TW.recruitAll(S, o);
    for (const [k, v] of Object.entries(held)) res[k] += v;
    return ev;
  };
  const upgrade = (S, T, o) => {
    const res = S.players[T.pid].res, ev = [];
    for (let tier = 7; tier >= 1; tier--) {
      if (!o.branch[tier]) continue;
      const total = TW.upgradeTotal(S, o, tier);
      if (Object.keys(total).length && TW.afford(res, total) && (total.gold || 0) * 2 <= res.gold) ev.push(...TW.upgradeAll(S, o, tier));
    }
    return ev;
  };

  const buildToday = (S, T, o) => {
    const list = wants(S, T, o), top = list[0], ev = [];
    if (!top) return ev;
    const soon = top.st.s === 'money' && Object.keys(top.st.miss).join() === 'gold' && top.st.miss.gold <= income(S, T) * 2;
    let pick = soon ? null : list.find(w => w.st.s === 'ok');
    if (!pick) {
      ev.push(...trade(S, T, top));
      if (TW.state(S, o, top.id).s === 'ok') pick = top;
    }
    if (pick) ev.push(...TW.build(S, o, pick.id, H.roll(S) < 0.5 ? 'a' : 'b').ev);
    return ev;
  };

  const stationFor = (S, T, o) => {
    const main = T.main, list = TW.list(S, T.pid).filter(t => t !== o && TW.has(t, 'caravan')), aims = aimsOf(S, T.pid), wanted = list.find(t => t.tag && aims.has(t.tag));
    if (wanted) return wanted;
    if (!main || !list.length) return null;
    const best = list.sort((a, b) => Math.hypot(a.c - main.c, a.r - main.r) - Math.hypot(b.c - main.c, b.r - main.r))[0];
    return Math.hypot(best.c - main.c, best.r - main.r) < Math.hypot(o.c - main.c, o.r - main.r) ? best : null;
  };
  const caravan = (S, T, o) => {
    const to = stationFor(S, T, o), rows = TW.caravanRows(S, o);
    if (!to || T.threats.includes(o.id) || !rows.length) return [];
    if (S.caravans.filter(v => v.owner === T.pid).length >= 3) return [];
    const res = S.players[T.pid].res;
    while (rows.length && !TW.afford(res, TW.caravanCost(to, rows))) rows.shift();
    return rows.length ? TW.sendCaravan(S, o, to, rows).ev : [];
  };

  const buyMachines = (S, T, o) => {
    const h = TW.visitor(S, o), res = S.players[T.pid].res;
    if (!h || !TW.has(o, 'smith')) return;
    for (const id of Object.keys(H.MACHINES)) if (res.gold >= H.UNITS[id].cost * 4) HE.buyMachine(S, h, id);
  };

  const buyArts = (S, T, o) => {
    const ev = [], res = S.players[T.pid].res;
    if (!TW.visitor(S, o)) return ev;
    TW.shop(S, o).forEach((id, i) => {
      if (id && res.gold > H.ARTIFACTS[id].cost * SHOP_GOLD) ev.push(...TW.buyArt(S, o, i).ev);
    });
    return ev;
  };
  const spareGoods = (res, r, n) => res[r] - n >= (r === 'wood' || r === 'ore' ? DEAL_KEEP.common : DEAL_KEEP.rare);
  const dealWanted = (S, T, d) => {
    const res = S.players[T.pid].res, main = T.main;
    if (d.kind === 'supply') return spareGoods(res, d.res, d.n);
    if (!main) return false;
    const x = H.Contracts.target(S, d);
    if (d.kind === 'hire') return main.faction === 'league' && HE.slotFor(main.army, d.unit) >= 0 && res.gold >= x.count * d.each * DEAL_GOLD;
    if (d.hero != null) return value(main.army) > value(x.army);
    const e = estimateFor(S, T, main, 'mon' + x.id + ':' + x.count, { stacks: Adv.splitNeutral(x) });
    return e.win && e.lost[0] <= MAX_LOSS.main;
  };
  const dealsTurn = (S, T, o) => {
    const C = H.Contracts, ev = [], res = S.players[T.pid].res;
    if (!C.desk(o)) return ev;
    for (const d of S.players[T.pid].deals.slice()) if (C.canDeliver(S, o, d) && spareGoods(res, d.res, d.n)) ev.push(...C.deliver(S, o, d.id).ev);
    for (let i = C.board(S, o).length - 1; i >= 0; i--) {
      const d = C.board(S, o)[i];
      if (d && S.players[T.pid].deals.length < H.TOWN.contract.active && dealWanted(S, T, d)) ev.push(...C.take(S, o, i).ev);
    }
    return ev;
  };
  const reforgeAll = (S, T, o) => {
    const h = TW.visitor(S, o);
    if (!h || !TW.canReforge(o)) return;
    for (let k = 0; k < 6; k++) {
      const pair = TW.reforgePairs(h)[0];
      if (!pair || S.players[T.pid].res.gold < TW.reforgeCost(h, H.ARTIFACTS[TW.forgeables(h)[pair[0]].id].rank) * 3 || !TW.reforge(S, o, h, pair[0], pair[1])) return;
      HE.wearBest(h);
    }
  };
  const townTurn = (S, T, o) => {
    const ev = [...hire(S, T, o)];
    buyMachines(S, T, o);
    ev.push(...dealsTurn(S, T, o));
    ev.push(...buyArts(S, T, o));
    reforgeAll(S, T, o);
    if (!o.today) ev.push(...buildToday(S, T, o));
    ev.push(...caravan(S, T, o));
    ev.push(...recruit(S, T, o, wants(S, T, o)[0] || null));
    if (TW.barrowLevel(o) && S.players[T.pid].res.gold > RAISE_GOLD) ev.push(...TW.raiseAll(S, o));
    if (S.players[T.pid].res.gold > 5000) ev.push(...upgrade(S, T, o));
    return ev;
  };

  const stackWorth = s => s.count * H.UNITS[s.unit].cost;
  const takeGarrison = (S, h, o) => {
    const order = slots(o.garrison).sort((a, b) => stackWorth(o.garrison[b]) - stackWorth(o.garrison[a]));
    if (S.day >= 8 && order.length > 1) order.pop();
    let moved = false;
    for (const i of order) {
      let to = HE.slotFor(h.army, o.garrison[i].unit);
      if (to < 0) {
        const weak = slots(h.army).sort((a, b) => stackWorth(h.army[a]) - stackWorth(h.army[b]))[0];
        if (stackWorth(h.army[weak]) >= stackWorth(o.garrison[i])) continue;
        to = weak;
      }
      if (HE.moveStack(o.garrison, i, h.army, to)) moved = true;
    }
    if (moved) S.ver++;
  };

  const leaveGarrison = (S, h, o) => {
    if (value(h.army) < SECOND_ARMY * 2) return;
    const order = slots(h.army).sort((a, b) => stackWorth(h.army[a]) - stackWorth(h.army[b]));
    for (const i of order.slice(0, Math.max(0, order.length - 3))) {
      if (value(o.garrison) >= value(h.army) * GARRISON_SHARE) break;
      const to = HE.slotFor(o.garrison, h.army[i].unit);
      if (to >= 0 && HE.moveStack(h.army, i, o.garrison, to, { keep: true })) S.ver++;
    }
  };

  const spellWorth = (T, h, id) => {
    if (id && (h.spells.includes(id) || !HE.canLearn(h, id))) return 0;
    const circle = id ? H.SPELLS[id].circle : 1;
    return 1100 * circle * (H.CLASSES[h.cls].mage ? 2 : 1);
  };
  const regionValue = (S, T, h, l, reg) => {
    const key = 'r' + h.id + ':' + l + ':' + reg;
    if (T.cache.has(key)) return T.cache.get(key);
    const R = regionsOf(S.map, l), M = S.map, seen = S.players[T.pid].seen[l];
    let best = 0, dark = 0;
    for (let i = 0; i < M.w * M.h; i++) if (R.id[i] === reg && !seen[i]) dark++;
    T.cache.set(key, 0);
    for (const o of M.objs) {
      if (o.gone || o.l !== l || !H.OBJ[o.t].entry) continue;
      const e = MD.entry(o), i = MD.idx(M, e[0], e[1]);
      if (R.id[i] !== reg || !known(S, T, l, i)) continue;
      let v = 0;
      if (o.t === 'town') {
        if (o.owner === T.pid) continue;
        const est = estimateFor(S, T, h, 'town' + o.id + ':' + value(o.garrison), townSide(S, o));
        v = est.win && est.lost[0] <= TOWN_LOSS ? 14000 + (o.owner >= 0 ? 16000 : 0) : 0;
      } else if (H.OBJ[o.t].kind === 'vault') {
        if (o.looted) continue;
        const est = estimateFor(S, T, h, 'vault' + o.id + ':' + o.tier + ':' + (o.left ? o.left.length : 0), { stacks: H.Sites.vaultGuards(o) });
        v = est.win && est.lost[0] <= MAX_LOSS.main ? H.Sites.vaultValue(o) * REGION_SHARE : 0;
      }
      else if (!TRANSIT.includes(H.OBJ[o.t].kind) && H.OBJ[o.t].kind !== 'shipyard') v = objWorth(S, T, h, o) * REGION_SHARE;
      if (v > best) best = v;
    }
    const area = M.heart && l === M.heart.l ? digArea(S, T) : null;
    if (area && h === T.main && area.some(([c, r]) => R.id[MD.idx(M, c, r)] === reg)) best = Math.max(best, DIG_WORTH);
    if (h.heart && TW.list(S, T.pid).some(o => o.l === l && R.id[MD.idx(M, MD.entry(o)[0], MD.entry(o)[1])] === reg)) best = Math.max(best, HEART_WORTH);
    const out = best + Math.min(DARK_CAP, dark * DARK_WORTH);
    T.cache.set(key, out);
    return out;
  };
  const leftShare = (S, h, l, reg) => (h.aiLeft && h.aiLeft.l === l && h.aiLeft.reg === reg && S.day - h.aiLeft.day < LEFT_DAYS ? LEFT_SHARE : 1);
  const seaValue = (S, T, h, l, sea, skip) => {
    const R = regionsOf(S.map, l);
    let v = regionValue(S, T, h, l, sea);
    for (const reg of R.links.get(sea) || []) if (reg !== skip) v = Math.max(v, regionValue(S, T, h, l, reg) * leftShare(S, h, l, reg));
    return v;
  };
  const hereRegion = (S, h) => regionsOf(S.map, h.l).id[MD.idx(S.map, h.c, h.r)];
  const placeValue = (S, T, h, l, c, r) => {
    const R = regionsOf(S.map, l), i = MD.idx(S.map, c, r), reg = R.id[i], mine = l === h.l ? hereRegion(S, h) : -1;
    if (reg === mine) return 0;
    return (R.wet[i] ? seaValue(S, T, h, l, reg, mine) : regionValue(S, T, h, l, reg)) * leftShare(S, h, l, reg);
  };
  const transitValue = (S, T, h, o) => {
    const def = H.OBJ[o.t];
    if ((def.kind === 'moongate' && !H.Sites.gateOpen(S, o)) || h.aiHop === S.day) return 0;
    const to = H.Sites.dest(S, o);
    if (!to) return 0;
    const [c, r] = MD.entry(to);
    return placeValue(S, T, h, to.l, c, r);
  };

  const boatAtHand = (S, h, l) => {
    const M = S.map, R = regionsOf(M, l), mine = l === h.l ? hereRegion(S, h) : -1;
    return M.objs.some(b => b.t === 'boat' && !b.gone && b.l === l && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => MD.inside(M, b.c + dc, b.r + dr) && R.id[MD.idx(M, b.c + dc, b.r + dr)] === mine));
  };
  const outOfBeat = (h, o) => !!h.patrol && (o.l !== h.patrol.l || Math.max(Math.abs(o.c - h.patrol.c), Math.abs(o.r - h.patrol.r)) > h.patrol.rad);
  const objWorth = (S, T, h, o) => {
    if (outOfBeat(h, o)) return 0;
    const def = H.OBJ[o.t];
    if (def.kind === 'pile') return (o.amount || (def.amount[0] + def.amount[1]) / 2) * PRICE[def.res] * (def.res === 'gold' ? 2 : 1);
    if (def.kind === 'mine') {
      const res = H.mineRes(o) || 'ore';
      return o.owner === T.pid ? 0 : MP.mineIncome[res] * PRICE[res] * MINE_DAYS * (o.owner >= 0 ? 1.25 : 1);
    }
    if (def.kind === 'dwelling') {
      const gold = S.players[T.pid].res.gold, can = HE.slotFor(h.army, def.unit) >= 0 ? Math.min(o.pool, Math.floor(gold / H.UNITS[def.unit].cost)) * H.UNITS[def.unit].cost : 0;
      return (def.flag && o.owner !== T.pid ? 2000 : 0) + can * 0.8;
    }
    if (def.kind === 'portal' || def.kind === 'moongate' || def.kind === 'whirlpool') return transitValue(S, T, h, o) * (value(h.army) >= SECOND_ARMY || h === T.main ? 1 : HELPER_TRANSIT);
    if (def.kind === 'boat') return h.boat || h.faction === 'tide' || h.aiHop === S.day || (value(h.army) < SECOND_ARMY && h !== T.main) ? 0 : placeValue(S, T, h, o.l, o.c, o.r);
    if (def.kind === 'shipyard') {
      const dock = H.Sites.dockOf(S, o);
      if (!dock || h.boat) return 0;
      const sea = placeValue(S, T, h, o.l, dock[0], dock[1]), free = H.Sites.dockFree(S, o) && S.players[T.pid].res.gold > MP.boat.gold * 4;
      return (o.owner !== T.pid ? 1500 : 0) + (free && h.faction !== 'tide' && !boatAtHand(S, h, o.l) ? sea * 0.8 : 0);
    }
    if (def.kind === 'witchring') return h.faction === 'thicket' && o.owner !== T.pid ? RING_WORTH : 0;
    if (def.kind === 'quest') return (o.done || []).includes(T.pid) || !H.Sites.questReady(S, h, o.quest) ? 0 : (o.reward.gold || 0) + (o.reward.xp || 0) + (o.reward.art ? ART_WORTH[H.ARTIFACTS[o.reward.art].rank] : 0) + 500;
    if (def.kind === 'questgate') return H.Sites.questReady(S, h, o.quest) ? 4000 : 0;
    if (def.kind === 'ruin' && S.players[T.pid].faction === 'throne') return o.owner === T.pid ? 0 : RUIN_WORTH;
    if (def.worth && def.kind !== 'vault' && def.kind !== 'outpost') return H.Sites.fresh(S, h, o) ? def.worth : 0;
    if (def.kind === 'barrowstone') {
      const shades = S.players[T.pid].shades;
      return h.faction === 'barrows' && (o.week || {})[T.pid] !== S.day - ((S.day - 1) % 7) ? shades.reduce((t, e) => t + e.count * H.UNITS[e.unit].cost, 0) * 0.3 : 0;
    }
    if (def.kind === 'chest') return 2000;
    if (def.kind === 'campfire') return 2800;
    if (def.kind === 'artifact') return h.bag.length >= H.HERO.maxBag ? 0 : H.ARTIFACTS[o.art].cost;
    if (def.kind === 'scroll') return spellWorth(T, h, o.spell);
    if (def.kind === 'shrine') return spellWorth(T, h, o.spell);
    return 0;
  };

  const homeWorth = (S, T, h, o) => {
    const res = S.players[T.pid].res;
    let troops = Math.max(0, value(o.garrison) - value(h.army) * GARRISON_SHARE), gold = res.gold;
    for (let tier = 7; tier >= 1; tier--) {
      const can = TW.offers(o, tier);
      if (!can.length || !o.pool[tier - 1]) continue;
      const cost = H.UNITS[can[0]].cost, n = Math.min(o.pool[tier - 1], Math.floor(gold / cost));
      troops += n * cost;
      gold -= n * cost;
    }
    const spells = [1, 2, 3, 4, 5].filter(c => TW.has(o, 'guild' + c)).flatMap(c => TW.shelf(o, c)).filter(id => !h.spells.includes(id) && HE.canLearn(h, id)).length;
    const need = troops / (troops + value(h.army) + 1), deals = S.players[T.pid].deals.filter(d => d.kind === 'supply' && d.town === o.id && spareGoods(res, d.res, d.n)).reduce((t, d) => t + d.pay, 0);
    return (troops * need * 3 + spells * 700) * (h === T.main || value(h.army) >= SECOND_ARMY ? 1 : 0.3) + deals * DEAL_TRIP;
  };

  const frontier = (S, T, h, F) => {
    const M = S.map, seen = S.players[T.pid].seen[h.l];
    let best = null;
    for (let r = 2; r < M.h; r += 4) {
      for (let c = 2; c < M.w; c += 4) {
        const i = MD.idx(M, c, r), d = F.dist[i];
        if (!(d < GUARD_COST)) continue;
        let dark = 0;
        for (let y = r - 5; y <= r + 5; y += 2) for (let x = c - 5; x <= c + 5; x += 2) if (MD.inside(M, x, y) && !seen[MD.idx(M, x, y)]) dark++;
        if (!dark) continue;
        const v = dark * EXPLORE_WORTH * 4 / (1 + d / 18);
        if (!best || v > best.v) best = { v, c, r };
      }
    }
    return best;
  };

  const closeBy = (a, c, r, rad) => Math.max(Math.abs(a.c - c), Math.abs(a.r - r)) <= rad;

  const digArea = (S, T) => {
    const M = S.map;
    if (!M.heart || M.heart.taken) return null;
    if (T.digArea === undefined) {
      const area = S.players[T.pid].menhirs.length >= H.HEART.need ? H.Sites.heartArea(S, T.pid) : null;
      T.digArea = area && area.length <= DIG_AREA ? area : null;
    }
    return T.digArea;
  };
  const dug = (S, l, c, r) => S.map.objs.some(o => o.t === 'digspot' && o.l === l && o.c === c && o.r === r);
  const digSpot = (S, T, h, F) => {
    const M = S.map, area = h === T.main && h.l === (M.heart || {}).l ? digArea(S, T) : null;
    if (!area) return null;
    let best = null;
    for (const [c, r] of area) {
      if (dug(S, h.l, c, r) || F.g.entry[MD.idx(M, c, r)] || F.g.block[MD.idx(M, c, r)]) continue;
      if (c === h.c && r === h.r) continue;
      const d = F.dist[MD.idx(M, c, r)];
      if (d < GUARD_COST && (!best || d < best.d)) best = { c, r, d };
    }
    return best;
  };
  const digHere = (S, T, h) => {
    const area = h === T.main ? digArea(S, T) : null;
    if (!area || h.l !== S.map.heart.l || h.steps + 1e-9 < Adv.daySteps(S, h) || !area.some(([c, r]) => c === h.c && r === h.r) || H.Sites.digBlocked(S, h)) return null;
    return H.Sites.dig(S, h);
  };

  const darkNear = (S, T, l, o) => {
    const M = S.map, seen = S.players[T.pid].seen[l];
    for (let y = o.r - PROBE_RADIUS; y <= o.r + PROBE_RADIUS; y += 2) {
      for (let x = o.c - PROBE_RADIUS; x <= o.c + PROBE_RADIUS; x += 2) {
        if (MD.inside(M, x, y) && !seen[MD.idx(M, x, y)] && MD.groundCost(M, l, x, y)) return true;
      }
    }
    return false;
  };

  const aimsOf = (S, pid) => {
    const st = S.script, set = new Set((st.aims && st.aims[pid]) || []);
    if (S.players[pid].human) for (const g of st.goals) if (g.state === 'open') for (const t of g.targets || []) set.add(t);
    return set;
  };
  const candidates = (S, T, h, days) => {
    const M = S.map, full = Adv.daySteps(S, h), F = field(S, h, Math.max(days * full, h.steps)), out = [], l = h.l, aims = aimsOf(S, T.pid), aimed = o => (o.tag && aims.has(o.tag) && o.owner !== T.pid && !(H.OBJ[o.t] && H.OBJ[o.t].kind === 'quest' && o.quest && (o.quest.kind === 'rank' || o.quest.kind === 'art') && !H.Sites.questReady(S, h, o.quest)) ? AIM_WORTH : 0);
    const eta = d => Math.max(0, stepsOf(d) - h.steps) / full + stepsOf(d) / full * 0.3;
    const war = value(h.army) >= SECOND_ARMY, main = h === T.main || war, room = main ? MAX_LOSS.main : MAX_LOSS.helper, foes = foesInSight(S, T, l), strong = [], behind = new Map();
    for (const f of S.heroes) if (f.alive && f.owner !== T.pid && !Adv.allied(S, f.owner, T.pid) && f.l === l && f.tag && aims.has(f.tag) && !foes.includes(f)) foes.push(f);
    for (const f of foes) {
      if (outOfBeat(h, f)) continue;
      const e = estimateFor(S, T, h, 'hero' + f.id + ':' + value(f.army), heroSide(f));
      if (!e.win || e.lost[0] > 0.8) strong.push(f);
      let d = Infinity;
      for (const [dc, dr] of H.Path.DIRS) if (MD.inside(M, f.c + dc, f.r + dr)) d = Math.min(d, F.dist[MD.idx(M, f.c + dc, f.r + dr)]);
      if (d >= GUARD_COST || !isFinite(d) || !e.win || e.lost[0] > TOWN_LOSS || T.skip.has('h' + f.id)) continue;
      out.push({ score: (value(f.army) * 0.8 + 5000 + aimed(f)) * (war ? 3 : 1) / (1 + eta(d)) - e.value[0] * 0.6, c: f.c, r: f.r, key: 'h' + f.id });
    }
    for (const o of M.objs) {
      if (o.gone || o.l !== l || outOfBeat(h, o)) continue;
      const def = H.OBJ[o.t], i = MD.idx(M, o.c, o.r);
      if (def.kind === 'decor' || def.kind === 'monster' || T.skip.has('o' + o.id) || Adv.allied(S, o.owner, T.pid)) continue;
      const e = MD.entry(o), ei = MD.idx(M, e[0], e[1]), guest = def.kind === 'town' && o.owner !== T.pid ? TW.visitor(S, o) : null;
      let d = F.dist[ei];
      if (guest) for (const [dc, dr] of H.Path.DIRS) if (MD.inside(M, e[0] + dc, e[1] + dr)) d = Math.min(d, F.dist[MD.idx(M, e[0] + dc, e[1] + dr)]);
      if (!known(S, T, l, ei) && !known(S, T, l, i) && !aimed(o)) continue;
      if (!isFinite(d)) continue;
      if (def.kind === 'vault') {
        if (o.looted) continue;
        const est = estimateFor(S, T, h, 'vault' + o.id + ':' + o.tier + ':' + (o.left ? o.left.length : 0), { stacks: H.Sites.vaultGuards(o) });
        if (!est.win || est.lost[0] > room) continue;
        const worth = H.Sites.vaultValue(o) + aimed(o);
        if (F.via[ei]) behind.set(F.via[ei], (behind.get(F.via[ei]) || 0) + worth / (1 + eta(d)));
        else out.push({ score: worth / (1 + eta(d)) - est.value[0], c: e[0], r: e[1], key: 'o' + o.id });
        continue;
      }
      if (def.kind === 'outpost') {
        if (o.owner === T.pid) continue;
        const est = estimateFor(S, T, h, 'town' + o.id + ':' + value(o.garrison), townSide(S, o));
        if (value(o.garrison) && (!est.win || est.lost[0] > (aimed(o) ? AIM_LOSS : room))) continue;
        const worth = def.worth * (war ? 2 : 1) + aimed(o);
        if (F.via[ei]) behind.set(F.via[ei], (behind.get(F.via[ei]) || 0) + worth / (1 + eta(d)));
        else out.push({ score: worth / (1 + eta(d)) - est.value[0] * 0.5, c: e[0], r: e[1], key: 'o' + o.id });
        continue;
      }
      if (def.kind === 'town') {
        if (o.owner === T.pid) {
          if (d >= GUARD_COST || (e[0] === h.c && e[1] === h.r)) continue;
          const threatened = T.threats.includes(o.id) && main;
          if (!threatened && S.day - (h.homeDay || 0) < HOME_PAUSE) continue;
          const worth = homeWorth(S, T, h, o) + (threatened ? 25000 : 0);
          if (worth > 0) out.push({ score: worth / (1 + eta(d)), c: e[0], r: e[1], key: 'o' + o.id });
          continue;
        }
        const est = estimateFor(S, T, h, 'town' + o.id + ':' + value(o.garrison), townSide(S, o));
        if (!est.win || est.lost[0] > (aimed(o) ? AIM_LOSS : TOWN_LOSS)) continue;
        const worth = (14000 + 1200 * o.built.length + (o.owner >= 0 ? 16000 + (TW.list(S, o.owner).length === 1 ? 30000 : 0) : 0)) * (war ? 3 : 1) + aimed(o);
        if (F.via[ei]) behind.set(F.via[ei], (behind.get(F.via[ei]) || 0) + worth / (1 + eta(d)));
        else out.push({ score: worth / (1 + eta(d)) - est.value[0] * 0.5, c: e[0], r: e[1], key: 'o' + o.id });
        continue;
      }
      const worth = objWorth(S, T, h, o) * (war && def.kind === 'mine' ? 0.4 : 1) + aimed(o);
      if (worth <= 0) continue;
      if (F.via[ei]) behind.set(F.via[ei], (behind.get(F.via[ei]) || 0) + worth / (1 + eta(d)));
      else out.push({ score: worth / (1 + eta(d)), c: e[0], r: e[1], key: 'o' + o.id });
    }
    const lost = war && S.players.some(p => {
      const towns = TW.list(S, p.id);
      return p.id !== T.pid && !p.out && towns.length > 0 && !towns.some(o => o.l === l && known(S, T, l, MD.idx(M, MD.entry(o)[0], MD.entry(o)[1])));
    });
    for (const o of M.objs) {
      if (o.gone || o.l !== l || o.t !== 'monster' || outOfBeat(h, o) || T.skip.has('o' + o.id) || (!known(S, T, l, MD.idx(M, o.c, o.r)) && !behind.has(o.id) && !aimed(o))) continue;
      let d = Infinity;
      for (const [dc, dr] of H.Path.DIRS) {
        const x = o.c + dc, y = o.r + dr;
        if (MD.inside(M, x, y) && F.g.guard[MD.idx(M, x, y)] === o.id) d = Math.min(d, F.dist[MD.idx(M, x, y)]);
      }
      if (!isFinite(d) || d >= GUARD_COST * 2) continue;
      const deal = H.Contracts.dealOn(S, T.pid, o.id), hiring = deal && H.Contracts.hireDeal(S, h, o) && HE.slotFor(h.army, o.unit) >= 0 && S.players[T.pid].res.gold >= H.Contracts.hirePrice(h, deal, o);
      if (hiring) {
        out.push({ score: (o.count * H.UNITS[o.unit].cost + (behind.get(o.id) || 0)) / (1 + eta(d)), c: o.c, r: o.r, key: 'o' + o.id });
        continue;
      }
      const est = estimateFor(S, T, h, 'mon' + o.id + ':' + o.count, { stacks: Adv.splitNeutral(o) });
      if (!est.win || est.lost[0] > (aimed(o) ? AIM_LOSS : room)) continue;
      const probe = lost && !foes.length && darkNear(S, T, l, o) ? PROBE_WORTH * HUNT_WORTH / (1 + eta(d)) : 0;
      const score = (o.count * H.UNITS[o.unit].hp * 2 + (deal && deal.kind === 'bounty' ? deal.gold * 1.5 : 0) + aimed(o)) / (1 + eta(d)) + (behind.get(o.id) || 0) + probe - est.value[0];
      if (score > 0) out.push({ score, c: o.c, r: o.r, key: 'o' + o.id });
    }
    for (const v of S.caravans) {
      if (v.owner === T.pid || Adv.allied(S, v.owner, T.pid) || v.l !== l || outOfBeat(h, v)) continue;
      let d = Infinity;
      for (const [dc, dr] of H.Path.DIRS) if (MD.inside(M, v.c + dc, v.r + dr)) d = Math.min(d, F.dist[MD.idx(M, v.c + dc, v.r + dr)]);
      if (d >= GUARD_COST || T.skip.has('v' + v.id)) continue;
      const est = estimateFor(S, T, h, 'cv' + v.id + ':' + value(v.stacks), { stacks: v.stacks.map(x => ({ unit: x.unit, count: x.count })) });
      if (!est.win || est.lost[0] > room) continue;
      const score = (value(v.stacks) * 0.8 + 2000) / (1 + eta(d)) - est.value[0];
      if (score > 0) out.push({ score, c: v.c, r: v.r, key: 'v' + v.id });
    }
    const merge = !h.patrol && h !== T.main && T.main && T.main.l === l && value(h.army) > value(T.main.army) * 0.15 && value(T.main.army) < MAIN_ENOUGH;
    if (merge) {
      let best = null;
      for (const [dc, dr] of H.Path.DIRS) {
        const x = T.main.c + dc, y = T.main.r + dr;
        if (!MD.inside(M, x, y)) continue;
        const d = F.dist[MD.idx(M, x, y)];
        if (d < GUARD_COST && (!best || d < best.d)) best = { d, x, y };
      }
      if (best && !closeBy(h, T.main.c, T.main.r, 1)) out.push({ score: (value(h.army) * 1.5 + 2000) / (1 + eta(best.d)), c: best.x, r: best.y, key: 'meet' });
    }
    if (h.boat) {
      const R = regionsOf(M, l), best = new Map();
      for (let i = 0; i < M.w * M.h; i++) {
        if (R.wet[i] || !R.id[i] || !isFinite(F.dist[i]) || F.dist[i] >= GUARD_COST) continue;
        const reg = R.id[i], cur = best.get(reg);
        if (!cur || F.dist[i] < cur.d) best.set(reg, { d: F.dist[i], i });
      }
      for (const [reg, b] of best) {
        const worth = regionValue(S, T, h, l, reg) * leftShare(S, h, l, reg);
        if (worth > 0) out.push({ score: worth / (1 + eta(b.d)), c: b.i % M.w, r: (b.i / M.w) | 0, key: 'land' + reg });
      }
    }
    if (h.heart) {
      for (const o of TW.list(S, T.pid)) {
        const e = MD.entry(o), d = o.l === l ? F.dist[MD.idx(M, e[0], e[1])] : Infinity;
        if (d < GUARD_COST) out.push({ score: HEART_WORTH / (1 + eta(d)), c: e[0], r: e[1], key: 'heart' + o.id });
      }
    }
    const spot = digSpot(S, T, h, F);
    if (spot && !h.patrol) out.push({ score: DIG_WORTH / (1 + eta(spot.d)), c: spot.c, r: spot.r, key: 'dig' });
    const far = frontier(S, T, h, F);
    if (far && !h.patrol) out.push({ score: far.v * (lost ? HUNT_WORTH : 1), c: far.c, r: far.r, key: 'x' + far.c + ',' + far.r });
    for (const g of out) {
      for (const f of strong) {
        if (closeBy(f, g.c, g.r, 7)) g.score *= 0.25;
      }
    }
    return out.sort((a, b) => b.score - a.score);
  };

  const mustKeep = (S, o) => S.goals.lose.some(g => g.kind === 'town' && g.town === o.id);
  const townToHold = (S, T) => {
    const aims = aimsOf(S, T.pid);
    return TW.list(S, T.pid).find(t => t.tag && aims.has(t.tag) && S.script.goals.some(g => g.state === 'open' && g.hold === t.tag)) || null;
  };
  const chooseWalk = (S, T, h) => {
    if (h.steps < 0.5) return null;
    const tryList = list => {
      for (const g of list.slice(0, 8)) {
        if (g.score <= 0) break;
        const p = Adv.path(S, h, g.c, g.r);
        if (!p) {
          T.skip.add(g.key);
          continue;
        }
        if (!p.here && (!p.steps.length || p.steps[0].day > 0)) return { stop: true };
        return { p, key: g.key };
      }
      return null;
    };
    if (h === T.main && aimsOf(S, T.pid).size) {
      const far = tryList(candidates(S, T, h, T.level.days * MAIN_RANGE * 3));
      if (far) return far.stop ? null : far;
    }
    const near = tryList(candidates(S, T, h, h === T.main || value(h.army) >= SECOND_ARMY ? T.level.days * MAIN_RANGE : T.level.days));
    if (near) return near.stop ? null : near;
    if (h !== T.main) return null;
    const wide = tryList(candidates(S, T, h, T.level.days * MAIN_RANGE * 3));
    return wide && !wide.stop ? wide : null;
  };

  const threatsOf = (S, T) => {
    const out = [];
    for (const o of TW.list(S, T.pid)) {
      const foes = foesInSight(S, T, o.l).filter(f => closeBy(f, o.c + 2, o.r + 2, 40));
      if (foes.some(f => value(f.army) > value(o.garrison) * 1.1)) out.push(o.id);
    }
    return out;
  };

  const ringHop = (S, T, h) => {
    if (h.faction !== 'thicket' || (h !== T.main && value(h.army) < SECOND_ARMY) || H.Sites.ringWhy(S, h)) return;
    const from = H.Sites.ringHere(S, h), list = from ? H.Sites.ringTargets(S, h, from) : [];
    if (!list.length) return;
    const best = candidates(S, T, h, T.level.days * MAIN_RANGE * 3)[0];
    if (!best) return;
    const far = (c, r) => Math.max(Math.abs(c - best.c), Math.abs(r - best.r)), to = list.map(o => ({ o, d: far(...MD.entry(o)) })).sort((a, b) => a.d - b.d)[0];
    if (to.d + H.Sites.ringCost(S, h) + RING_MARGIN < far(h.c, h.r)) H.Sites.ringJump(S, h, to.o, []);
  };

  const pendingAnswer = (S, T) => {
    const p = S.pending, h = S.heroes[p.hero];
    if (p.kind === 'battle') return { ev: [], battle: true };
    if (p.kind === 'choice') return { ev: Adv.resolve(S, p.ai) };
    if (p.kind === 'vault') {
      const o = Adv.obj(S, p.obj), est = estimateFor(S, T, h, 'vault' + o.id + ':' + o.tier + ':' + (o.left ? o.left.length : 0), { stacks: H.Sites.vaultGuards(o) });
      if (est.win && est.lost[0] <= (h === T.main ? 0.6 : 0.4)) return fight(S, T);
      T.skip.add('o' + o.id);
      return { ev: Adv.resolve(S, 'retreat') };
    }
    if (p.kind === 'chest') return { ev: Adv.resolve(S, S.players[h.owner].res.gold < 4000 || h.level >= 12 ? 'gold' : 'xp') };
    if (p.kind === 'duel' || p.kind === 'caravan') return fight(S, T);
    if (p.kind === 'town') {
      const o = Adv.obj(S, p.obj), est = estimateFor(S, T, h, 'town' + o.id + ':' + value(o.garrison), townSide(S, o));
      if (est.win && est.lost[0] <= (o.tag && aimsOf(S, T.pid).has(o.tag) ? AIM_LOSS : TOWN_LOSS)) return fight(S, T);
      T.skip.add('o' + o.id);
      return { ev: Adv.resolve(S, 'retreat') };
    }
    const o = Adv.obj(S, p.obj), est = estimateFor(S, T, h, 'mon' + o.id + ':' + o.count, { stacks: Adv.splitNeutral(o) });
    const res = S.players[h.owner].res;
    if (p.offer === 'join' && res.gold >= p.price && h.army.some(s => !s || s.unit === o.unit)) return { ev: Adv.resolve(S, 'accept') };
    if (p.offer === 'flee' && !(est.win && est.lost[0] < 0.08)) return { ev: Adv.resolve(S, 'release') };
    if (est.win && est.lost[0] <= (h === T.main ? 0.6 : 0.4)) return fight(S, T);
    T.skip.add('o' + o.id);
    if (p.offer === 'flee') return { ev: Adv.resolve(S, 'release') };
    if (T.cut) T.skip.add(T.cut);
    return { ev: Adv.resolve(S, 'retreat') };
  };

  const fight = (S, T) => {
    const setup = Adv.battleSetup(S);
    if (setup.player != null) return { ev: [], battle: setup };
    const B = BA.create(setup);
    BAI.play(B, 60);
    return { ev: Adv.battleDone(S, B) };
  };

  const stepAside = (S, h) => {
    const M = S.map, exit = M.objs.some(o => !o.gone && o.l === h.l && ['portal', 'moongate', 'whirlpool'].includes(H.OBJ[o.t].kind) && MD.entry(o)[0] === h.c && MD.entry(o)[1] === h.r);
    if (!exit) return null;
    const g = Adv.grid(S, h.l, h.owner), from = [h.c, h.r];
    for (const [dc, dr] of H.Path.DIRS) {
      const c = h.c + dc, r = h.r + dr, i = MD.inside(M, c, r) ? MD.idx(M, c, r) : -1;
      if (i < 0 || g.block[i] || g.guard[i] || g.entry[i] || Adv.heroAt(S, h.l, c, r) || !Adv.stepCost(S, h, g, h.l, c, r)) continue;
      const res = Adv.step(S, h, c, r);
      if (res.ok) return { ev: res.ev, moved: h.id, from, to: [h.c, h.r] };
    }
    return null;
  };

  const heroStep = (S, T) => {
    const h = T.hero;
    if (!h.alive || S.over) {
      T.hero = null;
      T.walk = null;
      return { ev: [] };
    }
    levelUp(S, h);
    if (HE.wearBest(h)) S.ver++;
    if (!T.walk) {
      const found = digHere(S, T, h);
      if (found) {
        T.digArea = undefined;
        return { ev: found };
      }
    }
    if (T.walk) {
      const w = T.walk, next = w.p.steps[w.i];
      if (next && next.day === 0) {
        w.i++;
        const from = [h.c, h.r], res = Adv.step(S, h, next.c, next.r);
        if (!res.ok) {
          T.walk = null;
          T.skip.add(w.key);
          return { ev: res.ev };
        }
        const done = w.i >= w.p.steps.length;
        if (done && (w.p.kind === 'duel' || w.p.kind === 'caravan')) res.ev.push(...Adv.engage(S, h, w.p.target, w.p.kind));
        if (S.pending) T.cut = w.key;
        if (done || S.pending) T.walk = null;
        return { ev: res.ev, moved: h.id, from, to: [h.c, h.r] };
      }
      T.walk = null;
      if (next) {
        T.hero = null;
        return { ev: [] };
      }
    }
    const here = TW.list(S, T.pid).find(o => TW.visitor(S, o) === h);
    if (here) {
      h.homeDay = S.day;
      if (h === T.main || value(h.army) < value(T.main ? T.main.army : h.army)) {
        if (mustKeep(S, here) ? !T.threats.includes(here.id) : !T.threats.includes(here.id) || h === T.main) takeGarrison(S, h, here);
      }
      const fresh = TW.teach(S, here);
      if (fresh.length) S.ver++;
      leaveGarrison(S, h, here);
    }
    ringHop(S, T, h);
    if (T.main && T.main !== h && T.main.alive && value(T.main.army) < MAIN_ENOUGH && HE.adjacent(h, T.main) && !T.gave.has(h.id)) {
      T.gave.add(h.id);
      if (HE.giveArmy(h.army, T.main.army)) S.ver++;
    }
    const held = h === T.main ? townToHold(S, T) : null;
    if (held) {
      const [gc, gr] = MD.entry(held), back = gc === h.c && gr === h.r ? null : Adv.path(S, h, gc, gr);
      if (back && back.steps.length && back.steps[0].day === 0) T.walk = { p: back, i: 0, key: 'hold' };
      else T.hero = null;
      return { ev: [] };
    }
    T.picks[h.id] = (T.picks[h.id] || 0) + 1;
    if (T.picks[h.id] > MAX_PICKS) {
      T.hero = null;
      return stepAside(S, h) || { ev: [] };
    }
    const pick = chooseWalk(S, T, h);
    if (!pick) {
      T.hero = null;
      return stepAside(S, h) || { ev: [] };
    }
    if (pick.p.here) {
      T.walk = null;
      T.skip.add(pick.key);
      return { ev: Adv.engage(S, h, pick.p.target, pick.p.kind) };
    }
    T.walk = { p: pick.p, i: 0, key: pick.key };
    const aim = pick.p.target != null && pick.p.kind === 'visit' ? Adv.obj(S, pick.p.target) : null;
    if (aim && TRANSIT.includes(H.OBJ[aim.t].kind)) {
      h.aiLeft = { l: h.l, reg: hereRegion(S, h), day: S.day };
      h.aiHop = S.day;
    }
    return { ev: [] };
  };

  const step = (S, T) => {
    if (S.over) return { ev: [], done: true };
    if (S.scene) return { ev: [] };
    if (S.pending) return pendingAnswer(S, T);
    if (T.stage === 'towns') {
      if (!T.towns) {
        const mine = S.heroes.filter(x => x.alive && x.owner === T.pid).sort((a, b) => value(b.army) - value(a.army));
        T.main = mine[0] || null;
        T.gave = new Set();
        T.threats = threatsOf(S, T);
        T.towns = TW.list(S, T.pid);
      }
      const o = T.towns.shift();
      if (o) return { ev: o.owner === T.pid ? townTurn(S, T, o) : [] };
      T.stage = 'heroes';
      T.queue = S.heroes.filter(x => x.alive && x.owner === T.pid).sort((a, b) => value(b.army) - value(a.army));
      T.main = T.queue[0] || null;
      return { ev: [] };
    }
    if (T.stage === 'heroes') {
      if (!T.hero) T.hero = T.queue.shift() || null;
      if (T.hero) return heroStep(S, T);
      T.stage = 'evening';
      T.towns = TW.list(S, T.pid);
      return { ev: [] };
    }
    if (T.stage === 'evening') {
      const o = T.towns.shift();
      if (o) return { ev: o.owner === T.pid ? townTurn(S, T, o) : [] };
      T.stage = 'done';
    }
    return { ev: [], done: true };
  };

  const turn = S => {
    const T = begin(S, S.turn);
    for (let i = 0; i < 20000; i++) {
      if (step(S, T).done) return T;
    }
    throw new Error('AI turn did not end');
  };

  H.AI = { forget, regions: regionsOf, begin, step, turn, field, levelUp, threatsOf, candidates, estimateFor, townSide };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
