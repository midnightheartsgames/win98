(function (D) {
  'use strict';
  const DD = D.DATA, { HEROES, ITEMS, DT } = DD;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const DIFF = [
    { think: 0.6, abil: 0.35, lh: 0.55, retreat: 0.35, aggro: 0.6, items: 0.4 },
    { think: 0.4, abil: 0.65, lh: 0.8, retreat: 0.3, aggro: 0.85, items: 0.7 },
    { think: 0.25, abil: 0.9, lh: 0.95, retreat: 0.25, aggro: 1, items: 0.95 },
    { think: 0.2, abil: 1, lh: 1, retreat: 0.22, aggro: 1.1, items: 1 }
  ];

  const AI = {
    think(g) {
      if (g.winner >= 0) { if (!g._ggSaid) { g._ggSaid = true; const b = g.heroes.filter(h => h.bot && !h.illusion); for (let i = 0; i < 3 && b.length; i++) { const h = b[Math.floor(g.rng() * b.length)]; g.later(1 + i, () => say(g, h, 'gg')); } } return; }
      if (g.tickN % 30 === 0) for (let t = 0; t < 2; t++) teamThink(g, t);
      for (const h of g.heroes) {
        if (!h.bot || h.illusion) continue;
        const b = h.brain || (h.brain = newBrain(g, h));
        if (g.time < b.nextThink) continue;
        b.nextThink = g.time + DIFF[g.diff].think * (0.8 + g.rng() * 0.4);
        try { heroThink(g, h, b); } catch (e) { if (typeof console !== 'undefined') console.error('bot error', h.hid, e); }
      }
    }
  };
  function newBrain(g, h) {
    return { lane: h.lane, state: 'lane', nextThink: g.time + g.rng() * 0.5, skillI: 0, buyI: 0, lastCmd: null, wardI: 0, mineSpots: null, said: {}, fightT: -99, tpT: -99 };
  }
  function say(g, h, kind) {
    const L = g.opts.lang || 'ru', arr = DD.BOT_CHAT[L][kind]; if (!arr) return;
    g.emit({ type: 'chat', from: h.name, hero: h.hid, text: arr[Math.floor(g.rng() * arr.length)], team: h.team, all: true });
  }
  const T = (g) => g.teamAI || (g.teamAI = [{ mode: 'lane', rally: null, lane: null, defend: null, rosh: false }, { mode: 'lane', rally: null, lane: null, defend: null, rosh: false }]);

  function teamThink(g, t) {
    const S = T(g)[t], mine = g.heroes.filter(h => h.team === t && !h.illusion), alive = mine.filter(h => !h.dead);
    const enemyAlive = g.heroes.filter(h => h.team !== t && !h.illusion && !h.dead).length;
    const min = g.time / 60;
    S.defend = null;
    for (const s of g.structs) {
      if (s.team !== t || s.dead || s.kind === 'fountain') continue;
      const foes = g.unitsIn(s.x, s.y, 1100, u => u.team === 1 - t && u.kind === 'hero' && !u.illusion && u.vis[t]);
      const creeps = g.unitsIn(s.x, s.y, 900, u => u.team === 1 - t && u.kind === 'creep').length;
      if (foes.length >= 1 && (s.hp < s.maxHp * 0.9 || creeps >= 3) && (s.kind !== 'tower' || s.tier >= 2 || min > 8)) {
        const pri = (s.kind === 'ancient' ? 5 : s.kind === 'rax' ? 3 : s.tier) + foes.length;
        if (!S.defend || pri > S.defend.pri) S.defend = { s, pri, n: Math.min(alive.length, foes.length + 1) };
      }
    }
    const avgLvl = alive.reduce((a, h) => a + h.level, 0) / Math.max(1, alive.length);
    if (min < 11 && !(min > 7 && g.teamStats[t].towers >= 2)) S.mode = 'lane';
    else S.mode = alive.length >= 3 && alive.length >= enemyAlive ? 'push' : 'farm';
    S.rosh = g.roshan && !g.roshan.dead && min >= 18 && alive.length >= 4 && alive.length > enemyAlive && avgLvl >= 12 && !g.aegisHolder;
    if (S.mode === 'push' && (!S.lane || g.tickN % 900 === 0 || laneDone(g, t, S.lane))) S.lane = pickPushLane(g, t);
  }
  function laneDone(g, t, lane) { return !g.structs.some(s => s.team !== t && !s.dead && (s.lane === lane && (s.kind === 'tower' || s.kind === 'rax'))) && g.structs.some(s => s.team !== t && s.kind === 'tower' && !s.dead && s.lane !== lane && s.lane !== 'base'); }
  function pickPushLane(g, t) {
    let best = 'mid', bs = -1e9;
    for (const lane of D.LANES) {
      const ts = g.structs.filter(s => s.team !== t && !s.dead && s.lane === lane && (s.kind === 'tower' || s.kind === 'rax'));
      if (!ts.length) continue;
      const first = ts.filter(s => s.kind === 'tower').sort((a, b) => a.tier - b.tier)[0] || ts[0];
      const sc = -first.tier * 100 - first.hp / 50 + (lane === 'mid' ? 30 : 0) + g.rng() * 40;
      if (sc > bs) { bs = sc; best = lane; }
    }
    if (bs === -1e9) return 'mid';
    return best;
  }
  function nextEnemyObjective(g, t, lane) {
    const ts = g.structs.filter(s => s.team !== t && !s.dead && s.kind !== 'fountain' && (s.lane === lane || s.lane === 'base' || s.kind === 'ancient'));
    const order = (s) => s.kind === 'tower' ? (s.lane === lane ? s.tier : 10) : s.kind === 'rax' ? 3.5 : 20;
    ts.sort((a, b) => order(a) - order(b));
    return ts.find(s => !g.isInvuln(s) || s.glyphT > g.time) || ts[0];
  }

  function cmd(g, h, o) {
    const l = h.order;
    if (o.type === 'move' && l && l.type === 'move' && Math.hypot(l.x - o.x, l.y - o.y) < 90) return true;
    if (o.type === 'attack' && l && l.type === 'attack' && l.target === o.target) return true;
    if (o.type === 'amove' && l && l.type === 'amove' && Math.hypot(l.x - o.x, l.y - o.y) < 150) return true;
    return g.order(h, o);
  }
  function heroThink(g, h, b) {
    const Dd = DIFF[g.diff];
    while (h.points > 0) {
      const sk = h.def.skill; let done = false;
      for (let i = b.skillI; i < sk.length && !done; i++) {
        const s = sk[i];
        if (s === 't') { const tier = h.talents.findIndex((c, k) => c < 0 && h.level >= DD.TALENT_LEVELS[k]); if (tier >= 0 && g.learnTalent(h, tier, g.rng() < 0.6 ? 0 : 1)) { b.skillI = i + 1; done = true; } else break; }
        else if (g.levelAbility(h, s)) { b.skillI = i + 1; done = true; }
        else if (g.canLearn(h, s) === false && h.ranks[s] >= (h.def.abilities[s].ult ? 3 : 4)) { b.skillI = i + 1; }
        else break;
      }
      if (!done) {
        let any = false; for (const s of [3, 0, 1, 2]) if (g.levelAbility(h, s)) { any = true; break; }
        if (!any) { const tier = h.talents.findIndex((c, k) => c < 0 && h.level >= DD.TALENT_LEVELS[k]); if (tier >= 0) g.learnTalent(h, tier, 0); else break; }
      }
    }
    if (g.time > 1 && !b.said.hi && h.pos === 1 && g.rng() < 0.5) { b.said.hi = true; say(g, h, 'hi'); } else b.said.hi = true;
    shop(g, h, b);
    if (h.dead) { maybeBuyback(g, h, b); return; }
    if (h.hid === 'techies' && techiesDetonate(g, h)) return;
    if (h.tpCh || h.channel || h.cast || g.has(h, 'busy') || h.pushFx) return;
    if (h.hid === 'pudge' && g.has(h, 'rot') && !g.unitsIn(h.x, h.y, 420, u => u.team !== h.team && !u.dead && !u.structure && !g.isWardLike(u) && u.kind !== 'courier').length) g.order(h, { type: 'cast', slot: 1 });
    useConsumables(g, h, b);
    const S = T(g)[h.team];
    const ctx = context(g, h);
    for (const d of g.drops) if (Math.hypot(d.x - h.x, d.y - h.y) < 900 && (d.item.id !== 'aegis' || (h.pos <= 2 && !g.aegisHolder)) && h.items.includes(null)) { cmd(g, h, { type: 'pickup', drop: d }); return; }
    const hpF = h.hp / h.maxHp;
    const danger = ctx.enemies.length > ctx.allies.length + 1 && hpF < 0.6 || ctx.towerThreat && hpF < 0.5;
    if (b.state === 'retreat' ? (hpF < 0.85 || h.mp < h.maxMp * 0.35 && !atFountain(g, h)) && !(atFountain(g, h) && hpF > 0.8) : hpF < Dd.retreat || danger) {
      if (b.state !== 'retreat') { b.state = 'retreat'; }
      return retreat(g, h, b, ctx);
    }
    if (b.state === 'retreat') b.state = 'lane';
    if (fight(g, h, b, ctx, S)) return;
    if (h.hid === 'techies' && techiesMines(g, h, b, ctx)) return;
    if (h.hid === 'enigma' && enigmaFarm(g, h, b, ctx)) return;
    if (placeWards(g, h, b)) return;
    if (runes(g, h, b)) return;
    if (S.defend && defend(g, h, b, S)) return;
    if (S.rosh && roshan(g, h, b, S)) return;
    if (S.mode === 'push') return push(g, h, b, S, ctx);
    return lane(g, h, b, ctx);
  }
  function atFountain(g, h) { const f = g.map.fountain[h.team]; return Math.hypot(h.x - f[0], h.y - f[1]) < 900; }
  function context(g, h) {
    const enemies = g.unitsIn(h.x, h.y, 1400, u => u.team !== h.team && u.kind === 'hero' && g.canSee(h.team, u) && !g.isInvuln(u));
    const allies = g.unitsIn(h.x, h.y, 1400, u => u.team === h.team && u.kind === 'hero' && u !== h && !u.illusion);
    const tower = g.structs.find(s => s.team !== h.team && !s.dead && (s.kind === 'tower' || s.kind === 'fountain') && Math.hypot(s.x - h.x, s.y - h.y) < 800 + s.r);
    const towerThreat = tower && !g.isInvuln(h) && (tower.target === h || !g.unitsIn(tower.x, tower.y, 750, u => u.team === h.team && (u.kind === 'creep' || u.kind === 'eidolon')).length);
    return { enemies, allies, tower, towerThreat };
  }

  function shop(g, h, b) {
    if ((b.shopT || 0) > g.time) return; b.shopT = g.time + 1.2;
    const build = h.def.build;
    if (h.tp.charges === 0 && g.goldOf(h) >= 100 && g.time > 60) g.buy(h, 'tp');
    const free = h.items.filter(x => !x).length;
    if (free && h.pos >= 4 && g.time > -30 && g.stockLeft(h, 'ward_obs') > 0 && countItem(h, 'ward_obs') < 1 && g.rng() < 0.5) g.buy(h, 'ward_obs');
    if (free && h.pos >= 4 && g.time > 300 && g.goldOf(h) > 250 && countItem(h, 'ward_sentry') < 1 && g.stockLeft(h, 'ward_sentry') > 0 && g.heroes.some(e => e.hid === 'techies' && e.team !== h.team) && g.rng() < 0.3) g.buy(h, 'ward_sentry');
    if (g.nearShop(h) && h.hp < h.maxHp * 0.5 && countItem(h, 'salve') === 0 && g.goldOf(h) > 300) g.buy(h, 'salve');
    while (b.buyI < build.length) {
      const id = build[b.buyI], d = ITEMS[id];
      if (ownsBuilt(h, id)) { b.buyI++; continue; }
      if (d.after && g.time < d.after) break;
      if (d.shard && h.shard) { b.buyI++; continue; }
      const plan = g.buyPlan(h, id);
      if (g.goldOf(h) < plan.cost) {
        const comp = nextComponent(g, h, id);
        if (comp && comp !== id && g.goldOf(h) >= g.buyPlan(h, comp).cost && ITEMS[comp].cost >= 300) { makeRoom(g, h, id); g.buy(h, comp); }
        break;
      }
      if (!d.from && d.cat === 'consumables' && !h.items.includes(null)) { b.buyI++; continue; }
      makeRoom(g, h, id);
      if (!g.buy(h, id)) break;
      b.buyI++;
      if (d.cost >= 2000 && g.rng() < 0.15) g.emit({ type: 'chat', from: h.name, hero: h.hid, text: d.name[g.opts.lang || 'ru'] + '!', team: h.team });
    }
    tidyInventory(g, h);
    if ((h.stash.some(x => x) || h.secretQueue.length) && h.courier && !h.courier.dead && h.courier.state === 'idle' && !atFountain(g, h)) g.courierDeliver(h);
  }
  function countItem(h, id) { let n = 0; for (const it of h.items.concat(h.backpack, h.stash)) if (it && it.id === id) n += it.charges || 1; return n; }
  function ownsBuilt(h, id) {
    const all = h.items.concat(h.backpack, h.stash, h.courier ? h.courier.carry : [], h.secretQueue);
    if (all.some(it => it && it.id === id)) return !ITEMS[id].charges || ITEMS[id].bottle || ITEMS[id].stick;
    const into = (a, b) => { const d = ITEMS[a]; return d.from && (d.from.includes(b) || d.from.some(f => into(f, b))); };
    return all.some(it => it && into(it.id, id));
  }
  function nextComponent(g, h, id) {
    const d = ITEMS[id]; if (!d.from) return id;
    const plan = g.buyPlan(h, id), owned = plan.used.map(p => p.it.id);
    let best = null;
    for (const f of d.from) { const k = owned.indexOf(f); if (k >= 0) { owned.splice(k, 1); continue; } const c = nextComponent(g, h, f); if (!best || ITEMS[c].cost > ITEMS[best].cost && g.goldOf(h) >= ITEMS[c].cost) best = c; }
    return best;
  }
  function makeRoom(g, h, next) {
    const slots = h.items.concat(h.backpack), used = slots.filter(Boolean).length + h.stash.filter(Boolean).length + (h.courier ? h.courier.carry.length : 0);
    if (used < 9 && !(h.k.invFull > g.time - 5)) return;
    const keep = new Set(); const walk = (id) => { keep.add(id); const d = ITEMS[id]; if (d.from) d.from.forEach(walk); };
    if (next) walk(next);
    let best = null, bv = 1e9;
    for (const where of ['backpack', 'items']) h[where].forEach((it, i) => {
      if (!it) return; const d = ITEMS[it.id]; if (d.noSell || keep.has(it.id) || it.id === 'tp' || d.dropOnDeath || d.scepter) return;
      const v = d.cost + (where === 'items' ? 50 : 0) - (['branch', 'tango', 'clarity', 'faerie_fire', 'salve', 'ward_obs', 'ward_sentry', 'magic_stick', 'quelling_blade', 'ring_protection'].includes(it.id) ? 2000 : 0);
      if (v < bv) { bv = v; best = [where, i]; }
    });
    if (best && bv < 1500) { g.sell(h, best[0], best[1], true); h.k.invFull = -99; }
  }
  function tidyInventory(g, h) {
    for (let bi = 0; bi < 3; bi++) {
      const bp = h.backpack[bi]; if (!bp) continue;
      const empty = h.items.indexOf(null); if (empty >= 0) { h.items[empty] = bp; h.backpack[bi] = null; g.recalc(h); continue; }
      let low = -1, lv = 1e9; h.items.forEach((it, i) => { const v = ITEMS[it.id].cost + (ITEMS[it.id].active === 'tp' ? 1e5 : 0) + (it.id === 'aegis' || it.id === 'cheese' || it.id === 'gem' || it.id === 'rapier' ? 1e5 : 0); if (v < lv) { lv = v; low = i; } });
      if (ITEMS[bp.id].cost > lv) g.swapItems(h, 'items', low, 'backpack', bi);
    }
  }
  function maybeBuyback(g, h, b) {
    if (g.diff < 1 || h.buybackCd > g.time || h.aegisRevive || h.respawnT - g.time < 12) return;
    const S = T(g)[h.team];
    const threat = S.defend && (S.defend.s.kind === 'ancient' || S.defend.s.kind === 'rax' || S.defend.s.tier >= 3);
    const cost = g.buybackCost(h);
    if ((threat || g.time > 40 * 60 && h.pos <= 2) && g.goldOf(h) >= cost + (threat ? 0 : 1500)) g.buyback(h);
  }

  function slotOf(h, id) { return h.items.findIndex(it => it && it.id === id); }
  function useConsumables(g, h, b) {
    const hpF = h.hp / h.maxHp, safe = !g.unitsIn(h.x, h.y, 900, u => u.team !== h.team && u.kind === 'hero' && g.canSee(h.team, u)).length;
    const regen = h.status.some(s => s.tag === 'salve' || s.tag === 'tango' || s.tag === 'bottle');
    let i;
    if (hpF < 0.15 && (i = slotOf(h, 'faerie_fire')) >= 0) return g.order(h, { type: 'item', slot: i });
    if (hpF < 0.3 && (i = h.items.findIndex(it => it && ITEMS[it.id].stick && it.charges >= 4)) >= 0 && h.items[i].cd <= 0) return g.order(h, { type: 'item', slot: i });
    if (hpF < 0.5 && (i = slotOf(h, 'cheese')) >= 0 && !safe) return g.order(h, { type: 'item', slot: i });
    if (!regen && safe && h.maxHp - h.hp > 350 && (i = slotOf(h, 'salve')) >= 0) return g.order(h, { type: 'item', slot: i });
    if (!regen && safe && h.maxHp - h.hp > 150 && (i = slotOf(h, 'tango')) >= 0) { const tr = g.map.nearestTree(h.x, h.y, 500); if (tr) return g.order(h, { type: 'item', slot: i, tree: tr }); }
    if (!regen && h.maxHp - h.hp > 110 && (i = slotOf(h, 'bottle')) >= 0 && h.items[i].charges > 0 && h.items[i].cd <= 0) return g.order(h, { type: 'item', slot: i });
    if (safe && h.maxMp - h.mp > 170 && !h.status.some(s => s.tag === 'clarity') && (i = slotOf(h, 'clarity')) >= 0) return g.order(h, { type: 'item', slot: i });
    if (h.maxMp - h.mp > 110 && (i = slotOf(h, 'mango')) >= 0) return g.order(h, { type: 'item', slot: i });
    if ((i = slotOf(h, 'arcane_boots')) >= 0 && h.items[i].cd <= 0 && h.maxMp - h.mp > 175) return g.order(h, { type: 'item', slot: i });
    if ((i = slotOf(h, 'soul_ring')) >= 0 && h.items[i].cd <= 0 && h.mp < h.maxMp * 0.5 && hpF > 0.6) return g.order(h, { type: 'item', slot: i });
    if ((i = slotOf(h, 'mekansm')) >= 0 && h.items[i].cd <= 0 && h.mp >= 100) { const hurt = g.alliesIn(h.team, h.x, h.y, 1100, { heroesOnly: true }).filter(a => a.maxHp - a.hp > 250).length; if (hurt >= 2 || hurt >= 1 && hpF < 0.5) return g.order(h, { type: 'item', slot: i }); }
    if ((i = slotOf(h, 'hand_midas')) >= 0 && h.items[i].cd <= 0) { const c = g.unitsIn(h.x, h.y, 600, u => (u.kind === 'creep' && u.team !== h.team || u.kind === 'neutral' && !u.ancient) && g.canSee(h.team, u)).sort((a, b) => (b.xp || 0) - (a.xp || 0))[0]; if (c) return g.order(h, { type: 'item', slot: i, target: c }); }
    if (h.treads && (i = slotOf(h, 'power_treads')) >= 0) { const want = hpF < 0.4 || !safe ? 'str' : h.def.attr === 'int' ? 'int' : 'agi'; if (h.treads !== want && safe) g.useItem(h, i, {}); }
    return false;
  }

  function retreat(g, h, b, ctx) {
    const f = g.map.fountain[h.team];
    const far = Math.hypot(h.x - f[0], h.y - f[1]) > 4500;
    let i;
    if (ctx.enemies.length) {
      const near = ctx.enemies.filter(e => dist(e, h) < 600);
      if (near.length && (i = slotOf(h, 'force_staff')) >= 0 && h.items[i].cd <= 0 && h.mp >= 25) { h.face = Math.atan2(f[1] - h.y, f[0] - h.x); g.order(h, { type: 'item', slot: i, target: h }); return; }
      if (near.length && (i = slotOf(h, 'blink')) >= 0 && h.items[i].cd <= 0 && h.lastHeroDmgT < g.time - 3) { const a = Math.atan2(f[1] - h.y, f[0] - h.x); g.order(h, { type: 'item', slot: i, x: h.x + Math.cos(a) * 1100, y: h.y + Math.sin(a) * 1100 }); return; }
      if (near.length && (i = slotOf(h, 'glimmer')) >= 0 && h.items[i].cd <= 0 && h.mp >= 90) { g.order(h, { type: 'item', slot: i, target: h }); }
      if (near.length && (i = slotOf(h, 'shadow_blade')) >= 0 && h.items[i].cd <= 0 && h.mp >= 75) { g.order(h, { type: 'item', slot: i }); }
      if (near.length && h.hid === 'techies' && can(g, h, 1)) { g.order(h, { type: 'cast', slot: 1, x: h.x, y: h.y }); return; }
      if (near.length && h.hid === 'techies' && can(g, h, 2) && h.hp < h.maxHp * 0.2 && dist(near[0], h) < 250 && near[0].kind === 'hero') { g.order(h, { type: 'cast', slot: 2, x: near[0].x, y: near[0].y }); return; }
      if (near.length && h.hid === 'juggernaut' && h.ranks[0] && h.cds[0] <= 0 && h.mp >= g.abMana(h, 0)) { g.order(h, { type: 'cast', slot: 0 }); }
      if (near.length && castDisable(g, h, near[0])) return;
    }
    if (far && h.tp.charges > 0 && h.tp.cd <= 0 && !ctx.enemies.some(e => dist(e, h) < 1000) && g.time - b.tpT > 5) { b.tpT = g.time; g.order(h, { type: 'item', slot: 'tp', x: f[0], y: f[1] }); return; }
    cmd(g, h, { type: 'move', x: f[0], y: f[1] });
  }

  function heroPower(g, u) { return (u.hp / u.maxHp * 0.6 + 0.4) * (u.level + 2) * (1 + g.netWorth(u) / 12000); }
  function fight(g, h, b, ctx, S) {
    const Dd = DIFF[g.diff];
    const foes = ctx.enemies.filter(e => !e.illusion || g.rng() < 0.3);
    if (!foes.length) return false;
    const ours = heroPower(g, h) + ctx.allies.reduce((a, u) => a + (dist(u, h) < 1000 ? heroPower(g, u) : 0), 0);
    const theirs = foes.reduce((a, u) => a + heroPower(g, u), 0) * (u => u)(1);
    const target = pickTarget(g, h, foes);
    const killable = target && target.hp < estimateBurst(g, h, target) * 1.1;
    const aggro = (h.def.ai.aggro || 0.5) * Dd.aggro;
    const tower = target && g.structs.find(s => s.team !== h.team && !s.dead && s.kind === 'tower' && Math.hypot(s.x - target.x, s.y - target.y) < 750);
    const want = killable || ours * (0.7 + aggro * 0.5) > theirs;
    if (!want) {
      if (ours < theirs * 0.7 && foes.some(e => dist(e, h) < 900)) { b.state = 'retreat'; retreat(g, h, b, ctx); return true; }
      return false;
    }
    if (tower && !killable && g.time < 20 * 60) return false;
    if (tower && ctx.towerThreat && h.hp < h.maxHp * 0.5) return false;
    if (dist(target, h) > 1300) return false;
    b.fightT = g.time;
    if (g.rng() < Dd.abil && heroAbilities(g, h, b, target, foes, ctx)) return true;
    if (g.rng() < Dd.items && fightItems(g, h, b, target, foes)) return true;
    cmd(g, h, { type: 'attack', target });
    return true;
  }
  function pickTarget(g, h, foes) {
    let best = null, bs = 1e9;
    for (const e of foes) { const d = dist(e, h); const eff = e.hp * (1 + (e.st.armor || 0) * 0.04) + d * 0.6 - (e.pos <= 2 ? 150 : 0) + (e.illusion ? 400 : 0); if (eff < bs) { bs = eff; best = e; } }
    return best;
  }
  function estimateBurst(g, h, t) {
    let d = ((h.st.dmgMin + h.st.dmgMax) / 2 + (h.st.dmgBonus || 0)) * D.armorMul(t.st.armor) * 3;
    const mr = 1 - t.st.mr;
    h.def.abilities.forEach((ab, s) => {
      if (!h.ranks[s] || h.cds[s] > 0 || ab.tgt === 'passive') return;
      const v = ab.v; const dm = (v.dmg ? g.av(h, s, 'dmg') : 0) + (v.dps ? g.av(h, s, 'dps') * 3 : 0);
      if (ab.key === 'culling_blade') d += g.av(h, s, 'threshold') + 100;
      else if (ab.key === 'finger_of_death') d += (g.av(h, s, 'dmg') + h.fingerKills * 40) * mr;
      else if (ab.key === 'black_hole') d += g.av(h, s, 'dmg') * 4;
      else if (ab.key === 'omnislash') d += g.av(h, s, 'jumps') * (h.st.dmgMin + (h.st.dmgBonus || 0));
      else d += dm * mr;
    });
    return d;
  }
  function can(g, h, s) { const ab = g.ability(h, s); return ab && g.rank(h, s) > 0 && ab.tgt !== 'passive' && (ab.charges ? h.charges[s] > 0 && h.cds[s] <= 0 : h.cds[s] <= 0) && h.mp >= g.abMana(h, s) && !g.isSilenced(h); }
  function castOn(g, h, s, t) { return g.order(h, { type: 'cast', slot: s, target: t }); }
  function castAt(g, h, s, x, y) { return g.order(h, { type: 'cast', slot: s, x, y }); }
  function lead(t, sec) { const a = t.face || 0, m = t.anim && t.anim.moving ? t.st.ms * sec : 0; return [t.x + Math.cos(a) * m, t.y + Math.sin(a) * m]; }
  function clusterAt(g, h, list, r, maxRange) {
    let best = null, bn = 0;
    for (const a of list) {
      if (dist(a, h) > maxRange + r) continue;
      const n = list.filter(e => Math.hypot(e.x - a.x, e.y - a.y) <= r).length;
      if (n > bn) { bn = n; best = a; }
    }
    if (!best) return null;
    const grp = list.filter(e => Math.hypot(e.x - best.x, e.y - best.y) <= r);
    const x = grp.reduce((s, e) => s + e.x, 0) / grp.length, y = grp.reduce((s, e) => s + e.y, 0) / grp.length;
    return { x, y, n: grp.length, grp };
  }
  function castDisable(g, h, t) {
    const dis = { sven: 0, lion: 1, crystal_maiden: 1, lina: 1, enigma: 0 }[h.hid];
    if (dis == null || !can(g, h, dis)) return false;
    const ab = g.ability(h, dis);
    if (dist(t, h) > g.abRange(h, dis) + 100) return false;
    if (ab.tgt === 'point') { const [x, y] = lead(t, 0.5); return castAt(g, h, dis, x, y); }
    return castOn(g, h, dis, t);
  }
  function fightItems(g, h, b, t, foes) {
    let i; const d = dist(t, h);
    if ((i = slotOf(h, 'bkb')) >= 0 && h.items[i].cd <= 0 && foes.length >= 2 && foes.some(e => dist(e, h) < 700)) return g.order(h, { type: 'item', slot: i });
    if ((i = slotOf(h, 'blink')) >= 0 && h.items[i].cd <= 0 && d > 500 && d < 1300 && h.lastHeroDmgT < g.time - 3 && (h.def.melee || h.hid === 'lion') && h.hp > h.maxHp * 0.5) {
      const a = Math.atan2(t.y - h.y, t.x - h.x); return g.order(h, { type: 'item', slot: i, x: t.x - Math.cos(a) * 80, y: t.y - Math.sin(a) * 80 });
    }
    if ((i = slotOf(h, 'scythe')) >= 0 && h.items[i].cd <= 0 && h.mp >= 250 && d < 800 && !g.isImmune(t)) return g.order(h, { type: 'item', slot: i, target: t });
    if ((i = slotOf(h, 'abyssal')) >= 0 && h.items[i].cd <= 0 && h.mp >= 75 && d < 250) return g.order(h, { type: 'item', slot: i, target: t });
    if ((i = slotOf(h, 'euls')) >= 0 && h.items[i].cd <= 0 && h.mp >= 175 && d < 575 && t.channel && !g.isImmune(t)) return g.order(h, { type: 'item', slot: i, target: t });
    if ((i = slotOf(h, 'manta')) >= 0 && h.items[i].cd <= 0 && h.mp >= 125 && d < 500) return g.order(h, { type: 'item', slot: i });
    if ((i = slotOf(h, 'mask_madness')) >= 0 && h.items[i].cd <= 0 && d < 400) return g.order(h, { type: 'item', slot: i });
    if ((i = slotOf(h, 'blade_mail')) >= 0 && h.items[i].cd <= 0 && h.mp >= 25 && foes.some(e => dist(e, h) < 300)) return g.order(h, { type: 'item', slot: i });
    if ((i = slotOf(h, 'phase_boots')) >= 0 && h.items[i].cd <= 0 && d > 350) g.useItem(h, i, {});
    if ((i = slotOf(h, 'refresher')) >= 0 && h.items[i].cd <= 0 && h.mp >= 350 + 200) {
      const ult = h.def.abilities[3]; if (h.ranks[3] && h.cds[3] > 20 && ult.key !== 'omnislash' && foes.length >= 1) return g.order(h, { type: 'item', slot: i });
    }
    return false;
  }

  function heroAbilities(g, h, b, t, foes, ctx) {
    const d = dist(t, h), H = h.hid;
    const inR = (s, extra = 0) => d <= g.abRange(h, s) + extra;
    const hard = g.diff >= 2;
    switch (H) {
      case 'techies': {
        const full = g.av(h, 2, 'dmg') * D.armorMul(t.st.armor) * (1 - t.st.mr);
        if (can(g, h, 2) && d < 450 && (t.hp < full * 0.95 || foes.filter(e => dist(e, t) < 220).length >= 2 && h.hp < h.maxHp * 0.5)) return castAt(g, h, 2, t.x, t.y);
        if (can(g, h, 3) && d < g.abRange(h, 3) + 50) { const [x, y] = lead(t, 1.1); return castAt(g, h, 3, x, y); }
        if (can(g, h, 1) && foes.some(e => dist(e, h) < 400)) return castAt(g, h, 1, h.x, h.y);
        if (can(g, h, 0) && foes.some(e => dist(e, h) < 500)) return castAt(g, h, 0, h.x, h.y);
        if (d < 450) { const a = Math.atan2(h.y - t.y, h.x - t.x); cmd(g, h, { type: 'move', x: h.x + Math.cos(a) * 300, y: h.y + Math.sin(a) * 300 }); return true; }
        return false;
      }
      case 'enigma': {
        if (can(g, h, 3)) {
          const c = clusterAt(g, h, foes, 380, 275 + 900);
          const need = hard ? 2 : 1;
          if (c && (c.n >= need || c.n >= 1 && foes.length === 1 && t.hp < t.maxHp * 0.6)) {
            const dd = Math.hypot(c.x - h.x, c.y - h.y);
            let i;
            if (dd > 300 && (i = slotOf(h, 'blink')) >= 0 && h.items[i].cd <= 0 && h.lastHeroDmgT < g.time - 3 && dd < 1400) { g.order(h, { type: 'item', slot: i, x: c.x, y: c.y }); b.nextThink = g.time + 0.05; return true; }
            if ((i = slotOf(h, 'bkb')) >= 0 && h.items[i].cd <= 0 && dd < 600) g.useItem(h, i, {});
            if (dd < 275 + 350) { if (can(g, h, 2) && h.mp >= g.abMana(h, 2) + g.abMana(h, 3)) castAt(g, h, 2, c.x, c.y); return castAt(g, h, 3, c.x, c.y); }
          }
        }
        if (can(g, h, 0) && inR(0, 100)) return castOn(g, h, 0, t);
        if (can(g, h, 2)) { const c = clusterAt(g, h, foes, 450, 700); if (c && (c.n >= 2 || foes.some(e => g.isStunned(e)))) return castAt(g, h, 2, c.x, c.y); }
        return false;
      }
      case 'sven': {
        if (can(g, h, 0) && inR(0, 100) && !g.isImmune(t)) return castOn(g, h, 0, t);
        if (can(g, h, 3) && d < 500) return g.order(h, { type: 'cast', slot: 3 });
        if (can(g, h, 2) && d < 400) return g.order(h, { type: 'cast', slot: 2 });
        return false;
      }
      case 'crystal_maiden': {
        if (can(g, h, 1) && inR(1, 100) && !g.isImmune(t)) return castOn(g, h, 1, t);
        if (can(g, h, 0) && d < g.abRange(h, 0) + 300) { const c = clusterAt(g, h, foes, 400, 700) || { x: t.x, y: t.y }; return castAt(g, h, 0, c.x, c.y); }
        if (can(g, h, 3)) { const near = foes.filter(e => dist(e, h) < 650); if (near.length >= 2 || near.length >= 1 && near.every(e => g.isStunned(e) || g.isRooted(e)) && ctx.allies.length) { let i; if ((i = slotOf(h, 'bkb')) >= 0 && h.items[i].cd <= 0) g.useItem(h, i, {}); return g.order(h, { type: 'cast', slot: 3 }); } }
        return false;
      }
      case 'sniper': {
        if (can(g, h, 3) && t.hp < g.av(h, 3, 'dmg') * (1 - t.st.mr) * 0.95 && d < g.abRange(h, 3) && !foes.some(e => dist(e, h) < 800)) return castOn(g, h, 3, t);
        if (can(g, h, 0) && d < 1700 && !g.areas.some(a => a.kind === 'shrapnel' && Math.hypot(a.x - t.x, a.y - t.y) < 400)) { const [x, y] = lead(t, 1.2); return castAt(g, h, 0, x, y); }
        if (t.def && t.def.melee && d < 350 && h.atkCd > 0.2) { const a = Math.atan2(h.y - t.y, h.x - t.x); cmd(g, h, { type: 'move', x: h.x + Math.cos(a) * 250, y: h.y + Math.sin(a) * 250 }); return true; }
        return false;
      }
      case 'axe': {
        const th = g.av(h, 3, 'threshold') + (g.hasScepter(h) ? 100 : 0);
        if (can(g, h, 3) && t.hp <= th && d < 450) return castOn(g, h, 3, t);
        if (can(g, h, 0)) {
          const near = foes.filter(e => dist(e, h) < g.av(h, 0, 'radius') - 30 && !g.isImmune(e));
          if (near.length >= 1) { let i; if ((i = slotOf(h, 'blade_mail')) >= 0 && h.items[i].cd <= 0 && h.mp >= 25 + g.abMana(h, 0)) g.useItem(h, i, {}); return g.order(h, { type: 'cast', slot: 0 }); }
          let i; if ((i = slotOf(h, 'blink')) >= 0 && h.items[i].cd <= 0 && h.lastHeroDmgT < g.time - 3) { const c = clusterAt(g, h, foes, 280, 1150); if (c && Math.hypot(c.x - h.x, c.y - h.y) > 350) { g.order(h, { type: 'item', slot: i, x: c.x, y: c.y }); b.nextThink = g.time + 0.05; return true; } }
        }
        if (can(g, h, 1) && inR(1) && !t.status.some(s => s.hunger) && !g.isImmune(t)) return castOn(g, h, 1, t);
        return false;
      }
      case 'lina': {
        if (can(g, h, 3) && inR(3, 150) && (t.hp < g.av(h, 3, 'dmg') * (1 - t.st.mr) || foes.length >= 2 && t.hp < t.maxHp * 0.6)) return castOn(g, h, 3, t);
        if (can(g, h, 1) && inR(1, 100) && !g.isImmune(t)) { const [x, y] = g.isStunned(t) || g.isRooted(t) ? [t.x, t.y] : lead(t, 0.9); return castAt(g, h, 1, x, y); }
        if (can(g, h, 0) && inR(0)) return castAt(g, h, 0, t.x, t.y);
        return false;
      }
      case 'juggernaut': {
        if (can(g, h, 3) && inR(3, 100) && t.hp < t.maxHp * 0.55) { const crowd = g.unitsIn(t.x, t.y, 425, u => u.team !== h.team && !u.structure && !g.isWardLike(u)).length; if (crowd <= 3 || foes.length >= 2) return castOn(g, h, 3, t); }
        if (can(g, h, 0) && foes.some(e => dist(e, h) < 250) && (h.hp < h.maxHp * 0.7 || foes.length >= 2)) return g.order(h, { type: 'cast', slot: 0 });
        if (can(g, h, 1) && h.hp < h.maxHp * 0.6 && d < 700) return castAt(g, h, 1, h.x, h.y);
        return false;
      }
      case 'pudge': {
        if (can(g, h, 3) && d < 300 && !g.isImmune(t)) return castOn(g, h, 3, t);
        if (can(g, h, 0) && d < g.av(h, 0, 'len') - 50 && d > 250 && !g.isImmune(t)) {
          const [x, y] = lead(t, d / 1450 + 0.3);
          if (hookClear(g, h, x, y, t) && g.rng() < (hard ? 0.9 : 0.5)) return castAt(g, h, 0, x, y);
        }
        const rot = g.has(h, 'rot');
        if (h.ranks[1] && !rot && d < 280) return g.order(h, { type: 'cast', slot: 1 });
        if (rot && d > 450) g.order(h, { type: 'cast', slot: 1 });
        return false;
      }
      case 'lion': {
        if (can(g, h, 3) && inR(3, 100) && t.hp < (g.av(h, 3, 'dmg') + h.fingerKills * 40) * (1 - t.st.mr)) return castOn(g, h, 3, t);
        if (can(g, h, 1) && inR(1, 100) && !g.isImmune(t) && !g.isStunned(t)) return castOn(g, h, 1, t);
        if (can(g, h, 0) && d < g.abRange(h, 0) + 200 && !g.isImmune(t) && !g.has(t, 'hex')) { const [x, y] = lead(t, 0.4); return castAt(g, h, 0, x, y); }
        if (can(g, h, 3) && inR(3) && foes.length >= 2 && t.hp < t.maxHp * 0.45) return castOn(g, h, 3, t);
        if (can(g, h, 2) && t.illusion && inR(2)) return castOn(g, h, 2, t);
        return false;
      }
    }
    return false;
  }
  function hookClear(g, h, x, y, t) {
    const a = Math.atan2(y - h.y, x - h.x), len = Math.hypot(x - h.x, y - h.y);
    for (let s = 80; s < len - 60; s += 50) {
      const px = h.x + Math.cos(a) * s, py = h.y + Math.sin(a) * s;
      if (g.unitsIn(px, py, 70, u => u !== h && u !== t && !u.structure && !g.isWardLike(u) && u.kind !== 'courier' && !u.dead).length) return false;
    }
    return true;
  }

  function mineSpots(g, h) {
    const m = g.map, out = [];
    const offLane = (x, y) => { for (const k in m.lanes) if (D.polyDist(x, y, m.lanes[k]) < 520) return false; return true; };
    for (const pl of m.paths) for (let i = 0; i < pl.length - 1; i++) {
      const [ax, ay] = pl[i], [bx, by] = pl[i + 1], l = Math.hypot(bx - ax, by - ay);
      for (let s = 0; s < l; s += 350) { const x = ax + (bx - ax) * s / l, y = ay + (by - ay) * s / l; if (offLane(x, y) && m.walkable(x, y) && m.heightAt(x, y) < 2) out.push([x, y]); }
    }
    for (const p of m.powerRunes.concat(m.bountyRunes)) out.push([p[0] + 120, p[1] + 60]);
    out.push([m.roshan[0] - 250, m.roshan[1] + 250]);
    return out;
  }
  function techiesMines(g, h, b, ctx) {
    if (ctx.enemies.length || T(g)[h.team].mode === 'push' && g.rng() < 0.4) return false;
    b.mineSpots = b.mineSpots || mineSpots(g, h);
    const own = g.units.filter(u => u.kind === 'mine' && u.owner === h.id && !u.dead);
    const count = (p, type, r) => own.filter(m => m.mineType === type && Math.hypot(m.x - p[0], m.y - p[1]) < r).length;
    const plans = [], reach = T(g)[h.team].mode === 'lane' ? 1400 : 2400;
    if (can(g, h, 3) && h.mp >= g.abMana(h, 3) + 40) plans.push({ slot: 3, ok: (p) => count(p, 'remote', 300) < 3 && own.filter(m => m.mineType === 'remote').length < 12, spread: 0 });
    if (can(g, h, 0) && h.mp >= g.abMana(h, 0) + 40) plans.push({ slot: 0, ok: (p) => count(p, 'land', 420) === 0 && own.filter(m => m.mineType === 'land').length < 12, spread: 0 });
    if (can(g, h, 1) && h.mp >= g.abMana(h, 1) + 40) plans.push({ slot: 1, ok: (p) => count(p, 'stasis', 600) === 0 && count(p, 'land', 500) + count(p, 'remote', 500) > 0, spread: 0 });
    for (const plan of plans) {
      let best = null, bs = 1e9;
      for (const p of b.mineSpots) {
        if (!plan.ok(p)) continue;
        const d = Math.hypot(p[0] - h.x, p[1] - h.y); if (d > reach) continue;
        const enemySide = (h.team === 0 ? p[0] - p[1] : p[1] - p[0]) > 600;
        const sc = d + (enemySide ? 900 : 0) + g.rng() * 300;
        if (sc < bs) { bs = sc; best = p; }
      }
      if (best) return castAt(g, h, plan.slot, best[0] + (g.rng() - 0.5) * 80, best[1] + (g.rng() - 0.5) * 80);
    }
    return false;
  }
  function techiesDetonate(g, h) {
    if (!can(g, h, 4)) return false;
    const K = D.KITS.techies, r = g.av(h, 3, 'radius'), dmg = K.remoteDamage(g, h);
    const mines = g.units.filter(u => u.kind === 'mine' && u.mineType === 'remote' && u.owner === h.id && !u.dead);
    if (!mines.length) return false;
    for (const e of g.heroes) {
      if (e.team === h.team || e.dead || !g.canSee(h.team, e) || g.isInvuln(e) || g.isImmune(e) || e.illusion) continue;
      const hits = mines.filter(m => Math.hypot(m.x - e.x, m.y - e.y) <= r);
      if (!hits.length) continue;
      const total = hits.length * dmg * (1 - e.st.mr), others = g.heroes.filter(x => x !== e && x.team !== h.team && !x.dead && hits.some(m => Math.hypot(m.x - x.x, m.y - x.y) <= r)).length;
      if (total >= e.hp * 0.9 || others >= 1 || hits.length >= 3 && g.rng() < 0.5) {
        const cx = hits.reduce((a, m) => a + m.x, 0) / hits.length, cy = hits.reduce((a, m) => a + m.y, 0) / hits.length;
        return g.order(h, { type: 'cast', slot: 4, x: cx, y: cy });
      }
    }
    return false;
  }
  function enigmaFarm(g, h, b, ctx) {
    if (!h.ranks[1] || !can(g, h, 1) || ctx.enemies.length) return false;
    if (g.units.some(u => u.kind === 'eidolon' && u.owner === h.id && !u.dead)) return false;
    const c = g.unitsIn(h.x, h.y, 800, u => (u.kind === 'creep' || u.kind === 'neutral' && !u.ancient) && !u.dead && g.canSee(h.team, u) && !g.isInvuln(u)).sort((a, b) => dist(a, h) - dist(b, h))[0];
    if (!c) return false;
    return castOn(g, h, 1, c);
  }

  function placeWards(g, h, b) {
    const bi = h.backpack.findIndex(it => it && (it.id === 'ward_obs' || it.id === 'ward_sentry'));
    if (bi >= 0) { let low = h.items.indexOf(null); if (low < 0) { let lv = 1e9; h.items.forEach((it, k) => { if (ITEMS[it.id].cost < lv && !ITEMS[it.id].dropOnDeath) { lv = ITEMS[it.id].cost; low = k; } }); } if (low >= 0) g.swapItems(h, 'items', low, 'backpack', bi); }
    const i = h.items.findIndex(it => it && (it.id === 'ward_obs' || it.id === 'ward_sentry'));
    if (i < 0) return false;
    b.badWard = b.badWard || [];
    const it = h.items[i], spots = g.map.wardSpots[h.team].concat(g.map.wardSpots[1 - h.team].slice(0, 2));
    const type = it.id === 'ward_obs' ? 'obs' : 'sentry';
    const taken = g.units.filter(u => u.kind === 'ward' && u.team === h.team && !u.dead && u.wardType === type);
    let best = null, bd = 1e9;
    for (const p of spots) { if (b.badWard.includes(p) || taken.some(w => Math.hypot(w.x - p[0], w.y - p[1]) < 700)) continue; const d = Math.hypot(p[0] - h.x, p[1] - h.y); if (d < bd && d < 3500) { bd = d; best = p; } }
    if (!best) return false;
    if (b.wardTry !== best) { b.wardTry = best; b.wardT = g.time; } else if (g.time - b.wardT > 14) { b.badWard.push(best); return false; }
    if (h.order && h.order.type === 'item' && h.order.slot === i) return true;
    return g.order(h, { type: 'item', slot: i, x: best[0], y: best[1] });
  }
  function runes(g, h, b) {
    for (const r of g.runes) {
      const d = Math.hypot(r.x - h.x, r.y - h.y);
      const want = r.kind === 'bounty' ? d < 1500 && (h.pos >= 3 || d < 800) : d < (h.pos === 2 ? 2600 : 1000);
      if (want && g.slotVisible(h.team, r.x, r.y) || want && d < 700) { cmd(g, h, { type: 'pickup', rune: r }); return true; }
    }
    if (h.pos === 2 && g.time > 355) { const next = Math.ceil(g.time / 120) * 120; if (next - g.time < 8) { const p = g.map.powerRunes.reduce((a, s) => Math.hypot(s[0] - h.x, s[1] - h.y) < Math.hypot(a[0] - h.x, a[1] - h.y) ? s : a); if (Math.hypot(p[0] - h.x, p[1] - h.y) < 2500) { cmd(g, h, { type: 'move', x: p[0] + 100, y: p[1] + 100 }); return true; } } }
    return false;
  }

  function tpNear(g, h, b, x, y, minDist = 5000) {
    if (h.tp.charges > 0 && h.tp.cd <= 0 && Math.hypot(x - h.x, y - h.y) > minDist && g.time - b.tpT > 8) { b.tpT = g.time; return g.order(h, { type: 'item', slot: 'tp', x, y }); }
    return false;
  }
  function defend(g, h, b, S) {
    const s = S.defend.s;
    const mine = g.heroes.filter(x => x.team === h.team && !x.dead && !x.illusion && x.bot).sort((a, c) => dist(a, s) - dist(c, s)).slice(0, S.defend.n);
    if (!mine.includes(h)) return false;
    if (tpNear(g, h, b, s.x, s.y)) return true;
    cmd(g, h, { type: 'amove', x: s.x, y: s.y }); return true;
  }
  function roshan(g, h, b, S) {
    const r = g.map.roshan, R = g.roshan;
    const d = Math.hypot(r[0] - h.x, r[1] - h.y);
    const grp = g.heroes.filter(x => x.team === h.team && !x.dead && !x.illusion && Math.hypot(x.x - r[0], x.y - r[1]) < 1200).length;
    if (d > 1200) { cmd(g, h, { type: 'move', x: r[0] + 300, y: r[1] + 300 }); return true; }
    if (grp >= 3 && R && !R.dead) { if (R.vis[h.team] || d < 500) cmd(g, h, { type: 'attack', target: R }); else cmd(g, h, { type: 'move', x: r[0], y: r[1] }); return true; }
    cmd(g, h, { type: 'move', x: r[0] + 250, y: r[1] + 250 }); return true;
  }
  function push(g, h, b, S, ctx) {
    const obj = nextEnemyObjective(g, h.team, S.lane);
    if (!obj) return lane(g, h, b, ctx);
    const allyCreeps = g.unitsIn(obj.x, obj.y, 1200, u => u.team === h.team && u.kind === 'creep').length;
    const d = dist(obj, h);
    if (d > 6000 && tpNear(g, h, b, g.map.lanePoint(S.lane, h.team === 0 ? 0.35 : 0.65)[0], g.map.lanePoint(S.lane, h.team === 0 ? 0.35 : 0.65)[1])) return;
    const group = g.heroes.filter(x => x.team === h.team && !x.dead && !x.illusion && dist(x, obj) < d + 400).length;
    if (d < 1400 && (allyCreeps >= 2 || group >= 3 || obj.hp < obj.maxHp * 0.3 || g.time > 30 * 60)) {
      if (g.isInvuln(obj) && obj.glyphT > g.time) { const a = Math.atan2(h.y - obj.y, h.x - obj.x); cmd(g, h, { type: 'move', x: obj.x + Math.cos(a) * 900, y: obj.y + Math.sin(a) * 900 }); return; }
      const creep = g.unitsIn(h.x, h.y, 500, u => u.team !== h.team && (u.kind === 'creep' || u.kind === 'eidolon') && g.canSee(h.team, u))[0];
      if (creep && creep.hp < 200) return cmd(g, h, { type: 'attack', target: creep });
      if (!g.isInvuln(obj)) return cmd(g, h, { type: 'attack', target: obj });
    }
    const front = laneFront(g, h.team, S.lane);
    const tp = front != null ? Math.min(front, g.map.laneProgress(S.lane, obj.x, obj.y)[0] - (h.team === 0 ? 0.04 : -0.04)) : null;
    const pos = tp != null ? g.map.lanePoint(S.lane, h.team === 0 ? tp - 0.02 : tp + 0.02) : [obj.x, obj.y];
    cmd(g, h, { type: 'amove', x: pos[0], y: pos[1] });
  }
  function laneFront(g, team, lane) {
    let best = null;
    for (const u of g.units) if (u.kind === 'creep' && !u.dead && u.team === team && u.lane === lane) {
      const [t] = g.map.laneProgress(lane, u.x, u.y);
      if (best == null || (team === 0 ? t > best : t < best)) best = t;
    }
    return best;
  }

  function lane(g, h, b, ctx) {
    const L = b.lane || h.lane, team = h.team, Dd = DIFF[g.diff];
    const myDmg = (h.st.dmgMin + (h.st.dmgBonus || 0)) * 0.98;
    let lh = null, lhs = 1e9;
    for (const c of g.unitsIn(h.x, h.y, 800, u => (u.kind === 'creep' || u.kind === 'neutral' && S_ok(g, h, u)) && !u.dead && g.canSee(team, u) && !g.isInvuln(u))) {
      const enemy = c.team !== team;
      if (!enemy && !g.canDeny(h, c)) continue;
      if (!enemy && g.rng() > (g.diff >= 2 ? 0.9 : 0.5)) continue;
      const dmg = myDmg * D.armorMul(c.st.armor);
      const travel = h.base.proj ? dist(h, c) / h.base.proj : 0;
      const incoming = g.unitsIn(c.x, c.y, 700, u => u.team !== c.team && u.target === c && (u.kind === 'creep' || u.kind === 'tower')).length;
      const expected = dmg + incoming * 18 * (g.attackPoint(h) + travel + 0.2) * (Dd.lh + (1 - Dd.lh) * g.rng() * 2);
      if (c.hp <= expected) { const sc = dist(h, c) + (enemy ? 0 : 50); if (sc < lhs) { lhs = sc; lh = c; } }
    }
    if (lh) {
      const tw = g.structs.find(s => s.team !== team && !s.dead && s.kind === 'tower' && Math.hypot(s.x - lh.x, s.y - lh.y) < 720);
      if (!tw || tw.target && tw.target !== h && tw.target.kind === 'creep') return cmd(g, h, { type: 'attack', target: lh });
    }
    const front = laneFront(g, team, L);
    let t;
    if (front == null) {
      const tw = g.structs.filter(s => s.team === team && !s.dead && s.kind === 'tower' && s.lane === L).sort((a, c) => a.tier - c.tier)[0];
      t = tw ? g.map.laneProgress(L, tw.x, tw.y)[0] + (team === 0 ? 0.02 : -0.02) : (team === 0 ? 0.1 : 0.9);
    } else t = front + (team === 0 ? -1 : 1) * (h.def.melee ? 0.012 : 0.028);
    let [px, py] = g.map.lanePoint(L, clamp(t, 0.02, 0.98));
    const etw = g.structs.find(s => s.team !== team && !s.dead && s.kind === 'tower' && Math.hypot(s.x - px, s.y - py) < 800);
    if (etw && !(etw.target && etw.target.kind === 'creep')) { const a = Math.atan2(py - etw.y, px - etw.x); px = etw.x + Math.cos(a) * 860; py = etw.y + Math.sin(a) * 860; }
    const foe = ctx.enemies.find(e => dist(e, h) < h.st.range + 120 && !g.structs.some(s => s.team !== team && !s.dead && s.kind === 'tower' && Math.hypot(s.x - e.x, s.y - e.y) < 760));
    if (foe && g.rng() < 0.25 * Dd.aggro * (h.def.ai.aggro || 0.5) * 2 && h.hp > h.maxHp * 0.5) return cmd(g, h, { type: 'attack', target: foe });
    if (h.pos >= 4) { const carry = g.heroes.find(x => x.team === team && x.pos === (h.pos === 5 ? 1 : 3) && !x.dead); if (carry && dist(carry, h) > 900 && dist(carry, h) < 3000) { px = (px + carry.x) / 2; py = (py + carry.y) / 2; } }
    if (Math.hypot(px - h.x, py - h.y) > 120) {
      const far = Math.hypot(px - h.x, py - h.y) > 5500;
      if (far && g.time > 60 && tpNear(g, h, b, px, py)) return;
      return cmd(g, h, { type: 'move', x: px + (g.rng() - 0.5) * 60, y: py + (g.rng() - 0.5) * 60 });
    }
    if (!h.order) { const any = g.acquire(h, 0, true); if (any && any.kind === 'creep' && any.team !== team && any.hp < any.maxHp * 0.35 && g.rng() < 0.3) cmd(g, h, { type: 'attack', target: any }); }
  }
  function S_ok(g, h, u) { return false; }

  D.AI = AI; D.AI_DIFF = DIFF;
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Dota98 = globalThis.Dota98 || {});
