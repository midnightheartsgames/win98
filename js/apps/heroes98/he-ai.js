(function (H) {
  'use strict';
  const MD = H.MapData, Adv = H.Adv, TW = H.Town, HE = H.Hero, BA = H.Battle, BAI = H.BattleAI, MP = H.MAP;
  const PRICE = Object.assign({ gold: 1 }, H.TOWN.value);
  const GUARD_COST = 100000;
  const MINE_DAYS = 12;
  const ART_WORTH = { plain: 2500, rare: 6000, relic: 11000 };
  const MAX_LOSS = { main: 0.45, helper: 0.25 };
  const TOWN_LOSS = 0.65;
  const MAX_PICKS = 14;
  const MAIN_DAYS = 10;
  const SECOND_ARMY = 10000;
  const MAIN_ENOUGH = 40000;
  const GARRISON_SHARE = 0.2;
  const HOME_PAUSE = 4;
  const EXPLORE_WORTH = 18;
  const HUNT_WORTH = 12;

  const value = army => Adv.armyValue(army);
  const slots = army => army.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
  const stepsOf = d => d % GUARD_COST;

  const field = (S, h, reach) => {
    const M = S.map, n = M.w * M.h, g = Adv.grid(S, h.l), walk = new Float64Array(n), dist = new Float64Array(n).fill(Infinity), via = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      if (g.block[i]) continue;
      const c = i % M.w, r = (i / M.w) | 0;
      walk[i] = HE.ground(h, MD.groundCost(M, h.l, c, r) || HE.overGround(S, h, MD.terrainAt(M, h.l, c, r).id));
    }
    for (const x of S.heroes) if (x.alive && x !== h && x.l === h.l) walk[MD.idx(M, x.c, x.r)] = 0;
    const start = MD.idx(M, h.c, h.r), heap = [];
    dist[start] = 0;
    H.Path.push(heap, [0, start]);
    while (heap.length) {
      const [d, u] = H.Path.pop(heap);
      if (d > dist[u] + 1e-9 || (u !== start && g.entry[u])) continue;
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
    const vis = Adv.visible(S, T.pid, l), M = S.map;
    return S.heroes.filter(x => x.alive && x.owner !== T.pid && x.l === l && (T.level.sees || vis[MD.idx(M, x.c, x.r)]));
  };

  const heroSide = h => HE.battleSide(h, slots(h.army));
  const estimateFor = (S, T, h, key, side) => {
    const k = h.id + ':' + value(h.army) + ':' + h.level + ':' + key;
    if (!T.cache.has(k)) T.cache.set(k, BAI.estimate([heroSide(h), side], H.Moons.battle(S)));
    return T.cache.get(k);
  };
  const garrisonOf = o => slots(o.garrison).map(i => ({ unit: o.garrison[i].unit, count: o.garrison[i].count, stars: o.garrison[i].stars || 0, vet: o.garrison[i].vet || 0 }));
  const townSide = (S, o) => {
    const v = S.heroes.find(x => x.alive && x.l === o.l && x.owner === o.owner && x.c === MD.entry(o)[0] && x.r === MD.entry(o)[1]);
    if (!v) return { stacks: garrisonOf(o) };
    const side = heroSide(v);
    side.stacks = [...side.stacks, ...garrisonOf(o)].sort((a, b) => b.count * H.UNITS[b.unit].cost - a.count * H.UNITS[a.unit].cost).slice(0, 7);
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
    if (mage) order.splice(2, 0, 'guild1', 'guild2');
    const out = [], seen = new Set();
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
    const res = S.players[T.pid].res, count = S.heroes.filter(x => x.alive && x.owner === T.pid).length;
    if (count >= heroesWanted(S, T) || (count > 0 && (S.day < 2 || res.gold < H.TOWN.heroPrice + 500))) return [];
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

  const townTurn = (S, T, o) => {
    const list = wants(S, T, o), res = S.players[T.pid].res, top = list[0], ev = [];
    ev.push(...hire(S, T, o));
    if (!o.today) {
      let pick = list.find(w => w.st.s === 'ok');
      const onlyGold = top && top.st.s === 'money' && Object.keys(top.st.miss).join() === 'gold';
      if (onlyGold && top.st.miss.gold <= income(S, T) * 2 && pick !== top) pick = null;
      if (!pick) ev.push(...trade(S, T, top));
      const again = pick ? null : wants(S, T, o).find(w => w.st.s === 'ok' && w.id === (top && top.id));
      const chosen = pick || again;
      if (chosen) ev.push(...TW.build(S, o, chosen.id, H.roll(S) < 0.5 ? 'a' : 'b').ev);
    }
    const next = wants(S, T, o).find(w => w.st.s !== 'ok' || !o.today) || null;
    ev.push(...recruit(S, T, o, o.today || (next && next.st.s === 'money') ? next : null));
    if (res.gold > 5000) ev.push(...upgrade(S, T, o));
    return ev;
  };

  const stackWorth = s => s.count * H.UNITS[s.unit].cost;
  const takeGarrison = (S, T, h, o) => {
    const order = slots(o.garrison).sort((a, b) => stackWorth(o.garrison[b]) - stackWorth(o.garrison[a])), keep = S.day >= 8 && order.length > 1 ? order.pop() : -1;
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
    return keep;
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
  const objWorth = (S, T, h, o) => {
    const def = H.OBJ[o.t];
    if (def.kind === 'pile') return (o.amount || (def.amount[0] + def.amount[1]) / 2) * PRICE[def.res];
    if (def.kind === 'mine') return o.owner === T.pid ? 0 : MP.mineIncome[def.res] * PRICE[def.res] * MINE_DAYS * (o.owner >= 0 ? 1.25 : 1);
    if (def.kind === 'chest') return 2000;
    if (def.kind === 'campfire') return 2800;
    if (def.kind === 'artifact') return h.bag.length >= H.HERO.maxBag ? 0 : ART_WORTH[H.ARTIFACTS[o.art].rank];
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
    const need = troops / (troops + value(h.army) + 1);
    return (troops * need * 3 + spells * 700) * (h === T.main || value(h.army) >= SECOND_ARMY ? 1 : 0.3);
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

  const candidates = (S, T, h, days) => {
    const M = S.map, full = Adv.daySteps(S, h), F = field(S, h, Math.max(days * full, h.steps)), out = [], l = h.l;
    const eta = d => Math.max(0, stepsOf(d) - h.steps) / full + stepsOf(d) / full * 0.3;
    const war = value(h.army) >= SECOND_ARMY, main = h === T.main || war, room = main ? MAX_LOSS.main : MAX_LOSS.helper, foes = foesInSight(S, T, l), strong = [], behind = new Map();
    for (const f of foes) {
      const e = estimateFor(S, T, h, 'hero' + f.id + ':' + value(f.army), heroSide(f));
      if (!e.win || e.lost[0] > 0.8) strong.push(f);
      const i = MD.idx(M, f.c, f.r);
      let d = Infinity;
      for (const [dc, dr] of H.Path.DIRS) if (MD.inside(M, f.c + dc, f.r + dr)) d = Math.min(d, F.dist[MD.idx(M, f.c + dc, f.r + dr)]);
      if (d >= GUARD_COST || !isFinite(d) || !e.win || e.lost[0] > TOWN_LOSS || T.skip.has('h' + f.id)) continue;
      out.push({ score: (value(f.army) * 0.8 + 5000) / (1 + eta(d)) - e.value[0] * 0.6, c: f.c, r: f.r, key: 'h' + f.id, i });
    }
    for (const o of M.objs) {
      if (o.gone || o.l !== l) continue;
      const def = H.OBJ[o.t], i = MD.idx(M, o.c, o.r);
      if (def.kind === 'decor' || def.kind === 'monster' || T.skip.has('o' + o.id)) continue;
      const e = MD.entry(o), ei = MD.idx(M, e[0], e[1]), d = F.dist[ei];
      if (!known(S, T, l, ei) && !known(S, T, l, i)) continue;
      if (!isFinite(d)) continue;
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
        if (!est.win || est.lost[0] > TOWN_LOSS) continue;
        const worth = (14000 + 1200 * o.built.length + (o.owner >= 0 ? 16000 + (TW.list(S, o.owner).length === 1 ? 30000 : 0) : 0)) * (war ? 3 : 1);
        if (F.via[ei]) behind.set(F.via[ei], (behind.get(F.via[ei]) || 0) + worth / (1 + eta(d)));
        else out.push({ score: worth / (1 + eta(d)) - est.value[0] * 0.5, c: e[0], r: e[1], key: 'o' + o.id });
        continue;
      }
      const worth = objWorth(S, T, h, o) * (war && def.kind === 'mine' ? 0.4 : 1);
      if (worth <= 0) continue;
      if (F.via[ei]) behind.set(F.via[ei], (behind.get(F.via[ei]) || 0) + worth / (1 + eta(d)));
      else out.push({ score: worth / (1 + eta(d)), c: e[0], r: e[1], key: 'o' + o.id });
    }
    for (const o of M.objs) {
      if (o.gone || o.l !== l || o.t !== 'monster' || T.skip.has('o' + o.id) || !known(S, T, l, MD.idx(M, o.c, o.r))) continue;
      let d = Infinity;
      for (const [dc, dr] of H.Path.DIRS) {
        const x = o.c + dc, y = o.r + dr;
        if (MD.inside(M, x, y) && F.g.guard[MD.idx(M, x, y)] === o.id) d = Math.min(d, F.dist[MD.idx(M, x, y)]);
      }
      if (!isFinite(d) || d >= GUARD_COST * 2) continue;
      const est = estimateFor(S, T, h, 'mon' + o.id + ':' + o.count, { stacks: Adv.splitNeutral(o) });
      if (!est.win || est.lost[0] > room) continue;
      const gain = o.count * H.UNITS[o.unit].hp * 2 + (behind.get(o.id) || 0);
      const score = gain / (1 + eta(d)) - est.value[0];
      if (score > 0) out.push({ score, c: o.c, r: o.r, key: 'o' + o.id });
    }
    const merge = h !== T.main && T.main && T.main.l === l && value(h.army) > value(T.main.army) * 0.15 && value(T.main.army) < MAIN_ENOUGH;
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
    const far = frontier(S, T, h, F);
    const lost = war && S.players.some(p => {
      const towns = TW.list(S, p.id);
      return p.id !== T.pid && !p.out && towns.length > 0 && !towns.some(o => o.l === l && known(S, T, l, MD.idx(M, MD.entry(o)[0], MD.entry(o)[1])));
    });
    if (far) out.push({ score: far.v * (lost ? HUNT_WORTH : 1), c: far.c, r: far.r, key: 'x' + far.c + ',' + far.r });
    for (const g of out) {
      for (const f of strong) {
        if (closeBy(f, g.c, g.r, 7) && !('hero' === g.key)) g.score *= 0.25;
      }
    }
    return out.sort((a, b) => b.score - a.score);
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
    const near = tryList(candidates(S, T, h, h === T.main || value(h.army) >= SECOND_ARMY ? MAIN_DAYS : T.level.days));
    if (near) return near.stop ? null : near;
    if (h !== T.main) return null;
    const wide = tryList(candidates(S, T, h, MAIN_DAYS * 3));
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

  const pendingAnswer = (S, T) => {
    const p = S.pending, h = S.heroes[p.hero];
    if (p.kind === 'battle') return { ev: [], battle: true };
    if (p.kind === 'chest') return { ev: Adv.resolve(S, S.players[h.owner].res.gold < 4000 || h.level >= 12 ? 'gold' : 'xp') };
    if (p.kind === 'duel') return fight(S, T);
    if (p.kind === 'town') {
      const o = Adv.obj(S, p.obj), est = estimateFor(S, T, h, 'town' + o.id + ':' + value(o.garrison), townSide(S, o));
      if (est.win && est.lost[0] <= TOWN_LOSS) return fight(S, T);
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
    return { ev: Adv.resolve(S, 'retreat') };
  };

  const fight = (S, T) => {
    const setup = Adv.battleSetup(S);
    if (setup.player != null) return { ev: [], battle: setup };
    const B = BA.create(setup);
    BAI.play(B, 60);
    return { ev: Adv.battleDone(S, B) };
  };

  const heroStep = (S, T) => {
    const h = T.hero;
    if (!h.alive || S.over) {
      T.hero = null;
      T.walk = null;
      return { ev: [] };
    }
    levelUp(S, h);
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
        if (done && w.p.kind === 'duel') res.ev.push(...Adv.engage(S, h, w.p.target, 'duel'));
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
        if (!T.threats.includes(here.id) || h === T.main) takeGarrison(S, T, h, here);
      }
      const fresh = TW.teach(S, here);
      if (fresh.length) S.ver++;
      leaveGarrison(S, h, here);
    }
    if (T.main && T.main !== h && T.main.alive && value(T.main.army) < MAIN_ENOUGH && HE.adjacent(h, T.main) && !T.gave.has(h.id)) {
      T.gave.add(h.id);
      if (HE.giveArmy(h.army, T.main.army)) S.ver++;
    }
    T.picks[h.id] = (T.picks[h.id] || 0) + 1;
    if (T.picks[h.id] > MAX_PICKS) {
      T.hero = null;
      return { ev: [] };
    }
    const pick = chooseWalk(S, T, h);
    if (!pick) {
      T.hero = null;
      return { ev: [] };
    }
    if (pick.p.here) {
      T.walk = null;
      T.skip.add(pick.key);
      return { ev: Adv.engage(S, h, pick.p.target, pick.p.kind) };
    }
    T.walk = { p: pick.p, i: 0, key: pick.key };
    return { ev: [] };
  };

  const step = (S, T) => {
    if (S.over) return { ev: [], done: true };
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

  H.AI = { begin, step, turn, field, levelUp, threatsOf, candidates, estimateFor, townSide };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
