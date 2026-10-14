/**
 * League of Legends 98 — bot AI. Each bot thinks ~10 times a second and issues the same orders a player would
 * (move / attack / cast / summoner spell / item / recall / buy). Behaviours: shopping by build order, laning with
 * last hits, harass and turret awareness, jungling with smite and ganks, fights evaluated by local team power,
 * retreat and recall, dodging skill shots, objectives (dragon, Baron) and late-game grouping / pushing / defending.
 */
(function (L) {
  'use strict';
  const { ITEMS, SPELLS, MINIONS, BOT_CHAT, DT } = L.DATA;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const DIFF = [
    { react: 0.7, aim: 0.3, lastHit: 0.55, cast: 0.35, dodge: 0, aggro: 0.8, kite: false, flash: false, think: 6 },
    { react: 0.35, aim: 0.14, lastHit: 0.82, cast: 0.7, dodge: 0.35, aggro: 1, kite: true, flash: false, think: 4 },
    { react: 0.15, aim: 0.05, lastHit: 0.96, cast: 0.95, dodge: 0.75, aggro: 1.1, kite: true, flash: true, think: 3 }
  ];
  const LANE_OF = { top: 'top', mid: 'mid', adc: 'bot', support: 'bot', jungle: null };

  function brain(g, c) {
    return { lane: LANE_OF[c.role] || null, state: 'start', t: 0, buildIdx: 0, lastThink: 0, gankT: 0, gank: null, campKey: null, chatT: 0, recallAsk: 0, dodgeT: 0, wardT: 60 + g.rng() * 60, shroomT: 0, hawkT: 90, lat: (g.rng() - 0.5) * 260, fleeT: 0, rng: g.rng };
  }
  function teamState(g, team) { g.aiTeam = g.aiTeam || [{}, {}]; return g.aiTeam[team]; }
  function say(g, c, kind, chance = 1) {
    if (g.rng() > chance || g.time - (c.brain.chatT || -99) < 20) return;
    const arr = BOT_CHAT[kind]; c.brain.chatT = g.time;
    g.emit({ type: 'chat', from: c.name, team: c.team, all: kind !== 'mia', text: arr[Math.floor(g.rng() * arr.length)], cid: c.cid });
  }

  // ------------------------------------------------------------------ estimates
  function attackDmg(c, t) { const arm = t.st.armor; return c.st.ad * (arm >= 0 ? 100 / (100 + arm) : 1); }
  function dps(u) { return u.st.ad * u.st.as * (1 + (u.st.crit || 0)) + (u.st.ap || 0) * 0.9 + (u.level || 1) * 12; }
  function spellDmg(c, slot) {
    const a = c.def.abilities[slot], r = c.ranks[slot]; if (!r || !a.v) return 0;
    const v = a.v, pick = x => Array.isArray(x) ? x[Math.min(x.length, r) - 1] : 0;
    let d = pick(v.d) || 0;
    if (v.ap) d += v.ap * c.st.ap; if (v.adr) d += v.adr * c.st.ad; if (v.bad) d += v.bad * c.bonusAd; if (v.mana) d += v.mana * c.maxMp;
    if (c.cid === 'garen' && slot === 2) d *= 6;
    return d;
  }
  function ready(g, c, slot) {
    const a = c.def.abilities[slot];
    if (!c.ranks[slot] || a.target === 'passive') return false;
    if (c.cid === 'teemo' && slot === 3) return c.charges > 0 && c.mp >= g.abilityCost(c, 3);
    return c.cds[slot] <= 0 && c.mp >= g.abilityCost(c, slot) && g.canCast(c);
  }
  function burst(g, c, t) {
    let d = attackDmg(c, t) * 2;
    for (let s = 0; s < 4; s++) if (ready(g, c, s)) d += spellDmg(c, s) * 0.8;
    const ig = c.spells.indexOf('ignite'); if (ig >= 0 && c.spellCds[ig] <= 0) d += 50 + 20 * c.level;
    return d;
  }
  function power(g, u) { return (u.hp + g.shieldTotal(u)) * (1 + u.st.armor / 150) * dps(u) * (u.kind === 'champ' ? 1 + [0, 1, 2, 3].filter(s => ready(g, u, s)).length * 0.12 : 1); }
  function enemyTowerNear(g, team, x, y, margin = 0) {
    for (const s of g.structs) if (s.kind === 'tower' && !s.dead && s.team !== team && Math.hypot(s.x - x, s.y - y) < 830 + margin) return s;
    return null;
  }
  function ownTowerNear(g, team, x, y, r = 900) { for (const s of g.structs) if (s.kind === 'tower' && !s.dead && s.team === team && Math.hypot(s.x - x, s.y - y) < r) return s; return null; }
  function visibleEnemies(g, c, r, x = c.x, y = c.y) { return g.champs.filter(e => e.team !== c.team && !e.dead && e.vis[c.team] && Math.hypot(e.x - x, e.y - y) < r && !g.has(e, 'untargetable')); }
  function alliesNear(g, c, r) { return g.champs.filter(a => a.team === c.team && !a.dead && dist(a, c) < r); }

  // local fight evaluation around a point: >1 favourable
  function advantage(g, c, x, y) {
    let mine = 0, theirs = 0;
    for (const u of g.champs) {
      if (u.dead || Math.hypot(u.x - x, u.y - y) > 1300) continue;
      if (u.team === c.team) mine += power(g, u); else if (u.vis[c.team]) theirs += power(g, u);
    }
    const et = enemyTowerNear(g, c.team, x, y, 100); if (et) theirs += 250 * 3000 * (et.tier === 'outer' ? 0.8 : 1.2);
    const ot = ownTowerNear(g, c.team, x, y, 850); if (ot) mine += 250 * 3000;
    if (!theirs) return 99;
    return mine / theirs;
  }

  // ------------------------------------------------------------------ shopping
  function nextBuild(c) {
    const b = c.brain, list = c.def.build;
    while (b.buildIdx < list.length) {
      const id = list[b.buildIdx], def = ITEMS[id];
      if (def.cat === 'cons') return id;
      const owned = c.items.some(it => it && (it.id === id || contains(it.id, id)));
      if (!owned) return id;
      b.buildIdx++;
    }
    return null;
  }
  function contains(parent, child) { const f = ITEMS[parent].from || []; return f.includes(child) || f.some(x => contains(x, child)); }
  function shop(g, c) {
    const b = c.brain;
    for (let guard = 0; guard < 12; guard++) {
      const want = nextBuild(c); if (!want) break;
      const def = ITEMS[want];
      if (def.cat === 'cons') {
        const e = g.buy(c, want);
        if (e === 'full') { if (!makeRoom(g, c)) { b.buildIdx++; continue; } continue; }
        if (e === 'gold') break;
        b.buildIdx++; continue;
      }
      let e = g.buy(c, want);
      if (!e) { b.buildIdx++; continue; }
      if (e === 'full') { if (makeRoom(g, c)) continue; break; }
      if (e === 'boots') { b.buildIdx++; continue; }
      if (e === 'gold') {
        // buy the most expensive affordable missing component
        const comp = affordableComponent(g, c, want);
        if (!comp) break;
        const e2 = g.buy(c, comp);
        if (e2 === 'full') { if (makeRoom(g, c)) continue; break; }
        if (e2) break;
        continue;
      }
      break;
    }
    // supports and junglers keep a ward, everyone keeps a potion early
    if (c.role === 'support' && c.gold > 150 && !c.items.some(it => it && it.id === 'ward')) g.buy(c, 'ward');
    if (g.time < 900 && c.gold > 100 && !c.items.some(it => it && it.id === 'hpPot') && c.items.includes(null)) g.buy(c, 'hpPot');
  }
  function affordableComponent(g, c, id) {
    let best = null, bc = -1;
    const walk = (iid) => {
      for (const f of ITEMS[iid].from || []) {
        if (c.items.some(it => it && (it.id === f || contains(it.id, f)))) continue;
        const plan = g.buyPlan(c, f);
        if (plan.price <= c.gold && ITEMS[f].cost > bc) { best = f; bc = ITEMS[f].cost; }
        walk(f);
      }
    };
    walk(id);
    return best;
  }
  function makeRoom(g, c) {
    const order = ['hpPot', 'manaPot', 'ward', 'doranRing', 'doranBlade', 'doranShield', 'sapphire', 'ruby', 'longSword', 'dagger', 'clothArmor', 'tome'];
    for (const id of order) { const i = c.items.findIndex(it => it && it.id === id); if (i >= 0) { c.items[i] = null; c.gold += Math.floor(ITEMS[id].cost * 0.7); g.recalc(c); return true; } }
    return false;
  }
  function nextCost(g, c) { const w = nextBuild(c); return w ? g.buyPlan(c, w).price : 99999; }

  // ------------------------------------------------------------------ movement helpers
  function moveTo(g, c, x, y) {
    const o = c.order;
    if (o && o.type === 'move' && Math.hypot(o.x - x, o.y - y) < 120) return;
    g.order(c, { type: 'move', x, y });
  }
  function attack(g, c, u) { if (c.order && c.order.type === 'attack' && c.order.unit === u) return; g.order(c, { type: 'attack', unit: u }); }
  function fountain(g, c) { return g.map.fountain[c.team]; }
  function retreatPoint(g, c) {
    // nearest own tower that is further from the enemy base than we are, else the fountain
    const f = fountain(g, c); let best = null, bd = 1e9;
    const myD = Math.hypot(c.x - f[0], c.y - f[1]);
    for (const s of g.structs) if (s.team === c.team && !s.dead && s.kind === 'tower') {
      const sd = Math.hypot(s.x - f[0], s.y - f[1]); if (sd > myD - 400) continue;
      const d = dist(s, c); if (d < bd) { bd = d; best = s; }
    }
    if (best && bd < 3500) { const dx = f[0] - best.x, dy = f[1] - best.y, l = Math.hypot(dx, dy) || 1; return [best.x + dx / l * 350, best.y + dy / l * 350]; }
    return f;
  }
  function predict(u, t) { const vx = (u.x - u.px) / DT, vy = (u.y - u.py) / DT; return [u.x + vx * t, u.y + vy * t]; }

  // ------------------------------------------------------------------ ability usage
  function castAt(g, c, slot, tgt) { const r = g.cast(c, slot, tgt); return !r; }
  function aimSkillshot(g, c, slot, t, hint) {
    const d0 = dist(c, t), tt = d0 / (hint.speed || 1500) + (hint.delay || 0) + 0.1;
    let [px, py] = predict(t, tt * (0.6 + 0.4 * (1 - DIFF[g.diff].aim * 2)));
    const err = (g.rng() - 0.5) * 2 * DIFF[g.diff].aim, a = Math.atan2(py - c.y, px - c.x) + err, d = Math.hypot(px - c.x, py - c.y);
    px = c.x + Math.cos(a) * d; py = c.y + Math.sin(a) * d;
    if (hint.stopsOnUnit) {
      // do not waste a single-target skill shot on a minion in the way
      const blocked = g.near((c.x + px) / 2, (c.y + py) / 2, d / 2 + 60, u => u.team !== c.team && (u.kind === 'minion' || u.kind === 'monster') && L.Map.segDist(u.x, u.y, c.x, c.y, px, py) < (hint.width || 60) + u.r);
      if (blocked.length) return false;
    }
    return castAt(g, c, slot, { x: px, y: py });
  }
  // offensive / defensive spell logic for a fight against target t
  function combat(g, c, t, ctx) {
    const kit = L.KITS[c.cid], D = DIFF[g.diff];
    if (g.rng() > D.cast) return;
    const dT = dist(c, t);
    for (let s = 0; s < 4; s++) {
      const h = kit.ai[s]; if (!h || !ready(g, c, s)) continue;
      const a = c.def.abilities[s];
      switch (h.type) {
        case 'skillshot': if (dT < (h.range || a.range) * 0.92 && !(s === 3)) { if (aimSkillshot(g, c, s, t, h)) return; } break;
        case 'targetDmg': if (dT < a.range + 50 || (h.gapclose && dT < a.range + 150)) { if (h.knockback && ctx.adv < 1 && dT > 300) break; if (castAt(g, c, s, { unit: t })) return; } break;
        case 'poly': {
          const threat = visibleEnemies(g, c, 700).sort((x, y) => dps(y) - dps(x))[0];
          if (threat && (dist(threat, c) < 500 || ctx.fighting)) { if (castAt(g, c, s, { unit: threat })) return; }
          break;
        }
        case 'shield': {
          const al = alliesNear(g, c, 650).filter(x => g.time - x.lastChampDmgT < 1.5 && x.hp / x.maxHp < 0.8).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
          if (al) { if (castAt(g, c, s, { unit: al })) return; }
          else if (dT < a.range && c.mp > c.maxMp * 0.4) { if (castAt(g, c, s, { unit: t })) return; }
          break;
        }
        case 'saveAlly': {
          const al = alliesNear(g, c, 900).filter(x => x.hp / x.maxHp < 0.3 && visibleEnemies(g, x, 600).length).sort((x, y) => x.hp - y.hp)[0];
          if (al) { if (castAt(g, c, s, { unit: al })) return; }
          break;
        }
        case 'jinxToggle': {
          const v = a.v, r = c.ranks[s], minR = c.def.stats.range, far = dT > minR + 60 && dT < minR + v.rng[r - 1];
          if (far !== !!c.k.rocket && (c.k.rocket || c.mp > 60)) { castAt(g, c, s, {}); return; }
          break;
        }
        case 'trapFeet': if (dT < 850 && (dT < 450 || g.has(t, 'stun') || g.has(t, 'root') || g.has(t, 'knockup') || g.has(t, 'poly'))) { const [px, py] = predict(t, 0.5); if (castAt(g, c, s, { x: px, y: py })) return; } break;
        case 'selfEngage': if (dT < 650 && ctx.engage) { if (castAt(g, c, s, {})) return; } break;
        case 'selfDefense': if (g.time - c.lastChampDmgT < 1 && c.hp / c.maxHp < (h.ult ? 0.5 : 0.8) && ctx.enemies.length) { if (castAt(g, c, s, {})) return; } break;
        case 'aoeSelf': if (ctx.enemies.some(e => dist(e, c) < h.r - 20)) { if (castAt(g, c, s, {})) return; } break;
        case 'execute': {
          const v = a.v, r = c.ranks[s];
          for (const e of visibleEnemies(g, c, a.range + 60)) { const dmg = v.d[r - 1] + v.miss[r - 1] * (e.maxHp - e.hp); if (dmg >= e.hp + g.shieldTotal(e)) { if (castAt(g, c, s, { unit: e })) return; } }
          break;
        }
        case 'cone': if (dT < a.range) { if (castAt(g, c, s, { x: t.x, y: t.y })) return; } break;
        case 'aoePoint': {
          if (dT > a.range + (h.engage ? 0 : 50)) break;
          const n = visibleEnemies(g, c, h.r + 50, t.x, t.y).length;
          const killable = t.hp < burst(g, c, t) * 1.1;
          if (n >= 2 || killable || (h.engage && ctx.adv > 1.3 && ctx.engage) || c.hp / c.maxHp < 0.3) { const [px, py] = predict(t, 0.25); if (castAt(g, c, s, { x: px, y: py })) return; }
          break;
        }
        case 'selfAttackBuff': if (dT < c.st.range + 250 && (!h.ult || ctx.engage || c.hp / c.maxHp < 0.5)) { if (castAt(g, c, s, {})) return; } break;
        case 'selfSpeed': if (ctx.flee || (ctx.engage && dT > c.st.range + 100)) { if (castAt(g, c, s, {})) return; } break;
        case 'trapPlace': if (dT < 500 && ctx.flee) { if (castAt(g, c, s, { x: c.x, y: c.y })) return; } else if (dT < 400) { if (castAt(g, c, s, { x: t.x, y: t.y })) return; } break;
        case 'selfBuffFight': if (dT < 700) { if (castAt(g, c, s, {})) return; } break;
        case 'healAoe': if (alliesNear(g, c, 575).some(x => x.hp / x.maxHp < 0.65)) { if (castAt(g, c, s, {})) return; } break;
        case 'channelHeal': break;
        case 'globalCC': if (dT < 1600 && ctx.fighting) { const hh = { speed: 1600, width: 130, delay: 0 }; if (aimSkillshot(g, c, s, t, hh)) return; } break;
        case 'globalExecute': break;
      }
    }
  }
  function summoners(g, c, t, ctx) {
    const D = DIFF[g.diff];
    for (let i = 0; i < 2; i++) {
      if (c.spellCds[i] > 0) continue;
      const id = c.spells[i], hp = c.hp / c.maxHp;
      if (id === 'heal' && hp < 0.25 && ctx.enemies.length) { g.useSpell(c, i, {}); return; }
      if (id === 'barrier' && hp < 0.22 && ctx.enemies.length) { g.useSpell(c, i, {}); return; }
      if (id === 'ghost' && (ctx.flee && hp < 0.4 || ctx.engage && t && dist(c, t) > c.st.range + 300 && t.hp / t.maxHp < 0.4)) { g.useSpell(c, i, {}); return; }
      if (!t) continue;
      if (id === 'ignite' && dist(c, t) < 600 && (t.hp < 50 + 20 * c.level + attackDmg(c, t) * 2 || (ctx.engage && t.hp / t.maxHp < 0.35))) { g.useSpell(c, i, { unit: t }); return; }
      if (id === 'exhaust' && ctx.fighting) { const e = visibleEnemies(g, c, 650).sort((a, b) => dps(b) - dps(a))[0]; if (e && dist(e, c) < 600) { g.useSpell(c, i, { unit: e }); return; } }
      if (id === 'flash' && D.flash) {
        if (ctx.flee && hp < 0.15 && ctx.enemies.some(e => dist(e, c) < 350)) { const f = fountain(g, c); const dx = f[0] - c.x, dy = f[1] - c.y, l = Math.hypot(dx, dy); g.useSpell(c, i, { x: c.x + dx / l * 400, y: c.y + dy / l * 400 }); return; }
        if (ctx.engage && t.hp / t.maxHp < 0.12 && dist(c, t) > c.st.range + 100 && dist(c, t) < c.st.range + 450 && !enemyTowerNear(g, c.team, t.x, t.y)) { g.useSpell(c, i, { x: t.x, y: t.y }); return; }
      }
    }
  }
  function useItems(g, c, ctx) {
    const hp = c.hp / c.maxHp;
    for (let i = 0; i < 6; i++) {
      const it = c.items[i]; if (!it) continue;
      if (it.id === 'hpPot' && hp < 0.55 && !g.tagged(c, 'hpPot') && !g.inShop(c)) { g.useItem(c, i); return; }
      if (it.id === 'zhonya' && hp < 0.2 && ctx.enemies.length && it.cd <= 0) { g.useItem(c, i); return; }
    }
  }
  function maybeWard(g, c) {
    const b = c.brain; if (g.time < b.wardT) return;
    const i = c.items.findIndex(it => it && it.id === 'ward'); if (i < 0) return;
    const spots = WARD_SPOTS[c.team][b.lane || 'mid'] || [];
    const s = spots.find(p => Math.hypot(p[0] - c.x, p[1] - c.y) < 600 && !g.units.some(u => u.kind === 'ward' && !u.dead && u.team === c.team && Math.hypot(u.x - p[0], u.y - p[1]) < 800));
    if (s) { g.useItem(c, i, { x: s[0], y: s[1] }); b.wardT = g.time + 60 + g.rng() * 60; }
  }
  const R = p => [14000 - p[0], 14000 - p[1]];
  const WARD_BLUE = { top: [[2300, 3200], [4500, 3700], [1900, 5800]], mid: [[5850, 6350], [6150, 7250], [8000, 7000]], bot: [[10000, 10450], [10200, 11250], [8900, 12150]] };
  const WARD_SPOTS = [WARD_BLUE, { top: WARD_BLUE.bot.map(R), mid: WARD_BLUE.mid.map(R), bot: WARD_BLUE.top.map(R) }];

  // ------------------------------------------------------------------ dodge
  function dodge(g, c) {
    const D = DIFF[g.diff]; if (!D.dodge || g.time < c.brain.dodgeT) return false;
    for (const p of g.projectiles) {
      if (p.kind !== 'line' || p.team === c.team) continue;
      const rx = c.x - p.x, ry = c.y - p.y, along = rx * p.dx + ry * p.dy;
      if (along < 0 || along > 900) continue;
      const perp = rx * -p.dy + ry * p.dx;
      if (Math.abs(perp) > p.width + c.r + 20) continue;
      c.brain.dodgeT = g.time + 0.6;
      if (g.rng() > D.dodge) return false;
      const side = perp >= 0 ? 1 : -1, nx = c.x + -p.dy * side * 260, ny = c.y + p.dx * side * 260;
      if (g.map.walkable(nx, ny)) { g.order(c, { type: 'move', x: nx, y: ny }); return true; }
    }
    return false;
  }

  // ------------------------------------------------------------------ team calls
  function teamThink(g, team) {
    const ts = teamState(g, team);
    if (g.time < (ts.nextT || 0)) return ts;
    ts.nextT = g.time + 3;
    const enemiesDead = g.champs.filter(c => c.team !== team && c.dead).length;
    const alive = g.champs.filter(c => c.team === team && !c.dead);
    const dragon = g.camps.find(k => k.def.key === 'dragon'), baron = g.camps.find(k => k.def.key === 'baron');
    const dAlive = dragon.alive.some(m => !m.dead), bAlive = baron.alive.some(m => !m.dead);
    const avgLvl = alive.reduce((s, c) => s + c.level, 0) / Math.max(1, alive.length);
    ts.call = null;
    if (bAlive && g.time > 1200 && enemiesDead >= 2 && alive.length >= 4 && avgLvl >= 11) ts.call = { kind: 'baron', x: baron.def.p[0], y: baron.def.p[1] };
    else if (dAlive && avgLvl >= 6 && (enemiesDead >= 2 || (enemiesDead >= 1 && alive.length >= 4 && g.time > 480))) ts.call = { kind: 'dragon', x: dragon.def.p[0], y: dragon.def.p[1] };
    // defending: enemies pushing our structures
    ts.defend = null;
    for (const s of g.structs) {
      if (s.team !== team || s.dead) continue;
      const en = g.champs.filter(e => e.team !== team && !e.dead && e.vis[team] && dist(e, s) < 1100);
      if (en.length && (s.kind !== 'tower' || s.tier !== 'outer' || en.length >= 2)) { ts.defend = { s, n: en.length }; break; }
    }
    // late game grouping lane: the lane with our most advanced wave
    if (g.time > 900) {
      let best = 'mid', bs = -1;
      for (const lane of ['top', 'mid', 'bot']) {
        const path = g.map.lanePath(lane, team);
        let s = 0; for (const m of g.units) if (m.kind === 'minion' && !m.dead && m.team === team && m.lane === lane) s = Math.max(s, g.map.project(path, m.x, m.y).s);
        const enemyStructs = g.structs.filter(x => x.team !== team && !x.dead && x.lane === lane && x.kind !== 'nexus').length;
        const score = s - enemyStructs * 800 + (lane === 'mid' ? 1500 : 0);
        if (score > bs) { bs = score; best = lane; }
      }
      if (!ts.groupLane || g.time > (ts.groupT || 0)) { ts.groupLane = best; ts.groupT = g.time + 45; }
    }
    return ts;
  }

  // ------------------------------------------------------------------ main
  function update(g, c) {
    if (!c.brain) c.brain = brain(g, c);
    const b = c.brain, D = DIFF[g.diff];
    if (c.dead) { if (b.state !== 'dead') { b.state = 'dead'; say(g, c, 'death', 0.15); } return; }
    if ((g.tickN + c.id) % D.think) return;
    const ts = teamThink(g, c.team);
    if (b.state === 'dead' || b.state === 'start') { b.state = 'shop'; }
    if (!b.greeted && g.time > 4 + (c.id % 7)) { b.greeted = true; say(g, c, 'start', 0.35); }
    if (g.winner >= 0) { if (!b.gg) { b.gg = true; b.chatT = -99; say(g, c, g.winner === c.team ? 'win' : 'lose', 0.6); } return; }

    const hp = c.hp / c.maxHp;
    const enemies = visibleEnemies(g, c, 1400);
    const threats = enemies.filter(e => dist(e, c) < 1000);
    const f = fountain(g, c), atBase = Math.hypot(c.x - f[0], c.y - f[1]) < 1200;
    const ctx = { enemies: threats, adv: advantage(g, c, c.x, c.y), fighting: false, engage: false, flee: false };

    // --- at base: shop, heal up
    if (atBase) {
      if (b.state === 'shop' || b.state === 'recall' || g.time - (b.shopT || -99) > 20) { shop(g, c); b.shopT = g.time; }
      if (b.state === 'shop' || b.state === 'recall' || b.state === 'retreat') {
        if (hp < 0.9 || (c.maxMp && c.mp / c.maxMp < 0.7)) { g.order(c, { type: 'stop' }); return; }
        b.state = 'go';
      }
      if (g.time < 20) { return; } // wait for the game to start
    }
    if (g.has(c, 'recall')) { if (threats.some(e => dist(e, c) < 900)) g.order(c, { type: 'stop' }); else return; }
    if (c.k.channel) { if (threats.some(e => dist(e, c) < 500) && hp > 0.4) g.endChannel(c); else return; }
    if (c.dash || !g.canAct(c)) return;
    if (dodge(g, c)) return;
    useItems(g, c, ctx);
    if (c.role === 'support' || c.role === 'jungle') maybeWard(g, c);

    // --- retreat / recall
    const lowHp = hp < 0.28 || (hp < 0.4 && threats.length && ctx.adv < 1.2);
    if (b.state === 'retreat' && hp > 0.7 && !atBase) b.state = 'go';
    if (lowHp) b.state = 'retreat';
    if (b.state === 'retreat') {
      ctx.flee = true;
      const chaser = threats.sort((a, x) => dist(a, c) - dist(x, c))[0];
      summoners(g, c, chaser, ctx);
      if (chaser && dist(chaser, c) < 600) combat(g, c, chaser, ctx);
      if (!threats.length && !enemyTowerNear(g, c.team, c.x, c.y, 200) && !atBase) {
        if (c.cid === 'masteryi' && ready(g, c, 1) && hp < 0.6) { castAt(g, c, 1, {}); return; }
        if (g.recall(c)) { b.state = 'recall'; return; }
      }
      moveTo(g, c, f[0], f[1]);
      return;
    }
    // recall to spend gold or heal
    if (!threats.length && !atBase && g.time > 90) {
      const wantGold = c.gold >= nextCost(g, c) + (c.role === 'support' ? 0 : 150) && c.gold > 900;
      if ((wantGold && waveSafe(g, c)) || hp < 0.4 || (c.maxMp && c.mp / c.maxMp < 0.12 && hp < 0.7)) {
        if (!enemyTowerNear(g, c.team, c.x, c.y, 300) && g.recall(c)) { b.state = 'recall'; return; }
      }
    }

    // --- fighting
    const target = pickTarget(g, c, enemies);
    if (target) {
      const adv = advantage(g, c, target.x, target.y);
      ctx.adv = adv;
      const killable = target.hp + g.shieldTotal(target) < burst(g, c, target) * D.aggro;
      const dive = enemyTowerNear(g, c.team, target.x, target.y, 0);
      const diveOk = !dive || (target.hp / target.maxHp < 0.25 && hp > 0.6 && (dive.target !== c)) || g.near(dive.x, dive.y, 850, u => u.team === c.team && u.kind === 'minion').length >= 3 && adv > 1.5;
      const want = (adv * D.aggro > 1.25 || killable || (b.gank === target)) && diveOk;
      const inLaneTrade = b.lane && !want && adv > 0.8 && dist(c, target) < c.st.range + 100 && !dive && hp > 0.5 && g.rng() < 0.25 * D.aggro;
      if (want || inLaneTrade || (dist(c, target) < 350 && adv > 0.7 && !dive)) {
        ctx.fighting = true; ctx.engage = want;
        combat(g, c, target, ctx);
        summoners(g, c, target, ctx);
        // globals when someone is low anywhere
        kite(g, c, target) || attack(g, c, target);
        if (want && dist(c, target) < 800) say(g, c, 'kill', 0.01);
        return;
      }
      if (adv < 0.75 && threats.length) {
        ctx.flee = true; combat(g, c, threats[0], ctx);
        if (hp < 0.5) summoners(g, c, threats[0], ctx);
        const rp = retreatPoint(g, c); moveTo(g, c, rp[0], rp[1]); return;
      }
    }
    globalUlts(g, c);

    // --- team calls
    if (ts.call && dist(c, ts.call) < 6000 && (c.role !== 'top' || ts.call.kind === 'baron')) { if (objective(g, c, ts.call)) return; }
    if (ts.defend && dist(c, ts.defend.s) < 5000 && (c.role !== 'jungle' || dist(c, ts.defend.s) < 3500)) { const s = ts.defend.s; if (dist(c, s) > 500) { moveTo(g, c, s.x, s.y); return; } }

    // --- role behaviour
    let lane = b.lane;
    if (g.time > 900 && ts.groupLane && c.role !== 'top') lane = ts.groupLane;
    if (g.time > 1500 && ts.groupLane) lane = ts.groupLane;
    if (c.role === 'jungle' && g.time < 900) return jungle(g, c, ctx);
    if (c.role === 'jungle' && !lane) lane = ts.groupLane || 'mid';
    laning(g, c, lane || 'mid', ctx);
  }
  function waveSafe(g, c) {
    // allied wave nearby or we are not in a lane
    const lane = g.map.laneOf(c.x, c.y); if (lane.d > 600) return true;
    const en = g.units.filter(u => u.kind === 'minion' && !u.dead && u.team !== c.team && dist(u, c) < 1200).length;
    return en <= 2;
  }
  function pickTarget(g, c, enemies) {
    let best = null, bs = -1e9;
    for (const e of enemies) {
      const d = dist(e, c); if (d > 1300) continue;
      let s = -d * 0.8 - e.hp * 0.9 + (e.hp / e.maxHp < 0.3 ? 600 : 0) + dps(e) * 2;
      if (g.has(e, 'stun') || g.has(e, 'root') || g.has(e, 'knockup')) s += 300;
      if (s > bs) { bs = s; best = e; }
    }
    return best;
  }
  function kite(g, c, t) {
    const D = DIFF[g.diff];
    if (!D.kite || !c.def.ranged || t.def && t.def.ranged) return false;
    if (c.atkCd > 0.15 && c.windup <= 0 && dist(c, t) < c.st.range * 0.6) {
      const dx = c.x - t.x, dy = c.y - t.y, l = Math.hypot(dx, dy) || 1;
      const nx = c.x + dx / l * 200, ny = c.y + dy / l * 200;
      if (g.map.walkable(nx, ny)) { g.order(c, { type: 'move', x: nx, y: ny }); return true; }
    }
    return false;
  }
  function globalUlts(g, c) {
    if ((g.tickN + c.id) % 15) return;
    const kit = L.KITS[c.cid], h = kit.ai[3]; if (!h || !ready(g, c, 3)) return;
    if (h.type === 'globalExecute') {
      const v = c.def.abilities[3].v, r = c.ranks[3];
      for (const e of g.champs) {
        if (e.team === c.team || e.dead || !e.vis[c.team]) continue;
        const d = dist(c, e); if (d > 9000) continue;
        const f = Math.min(1, 0.1 + 0.9 * d / 1500), dmg = ((v.d[r - 1] + v.bad * c.bonusAd) * f + v.miss[r - 1] * (e.maxHp - e.hp)) * (100 / (100 + e.st.armor));
        if (dmg > e.hp + g.shieldTotal(e) && g.rng() < DIFF[g.diff].cast) { aimSkillshot(g, c, 3, e, { speed: 1900, delay: 0.6 }); return; }
      }
    }
    if (h.type === 'globalCC') {
      for (const e of g.champs) {
        if (e.team === c.team || e.dead || !e.vis[c.team] || e.hp / e.maxHp > 0.35) continue;
        const d = dist(c, e); if (d > 5000) continue;
        if (g.champs.some(a => a.team === c.team && !a.dead && a !== c && dist(a, e) < 900) && g.rng() < DIFF[g.diff].cast) { aimSkillshot(g, c, 3, e, { speed: 1600 }); return; }
      }
    }
  }
  function objective(g, c, call) {
    const camp = g.camps.find(k => k.def.key === call.kind); const mob = camp && camp.alive.find(m => !m.dead);
    if (!mob) return false;
    if (dist(c, mob) > 900) { moveTo(g, c, mob.x, mob.y); return true; }
    const si = c.spells.indexOf('smite');
    if (si >= 0 && c.spellCds[si] <= 0 && mob.hp < 390 + 20 * c.level && dist(c, mob) < 650) { g.useSpell(c, si, { unit: mob }); return true; }
    attack(g, c, mob); return true;
  }

  // ------------------------------------------------------------------ laning
  function laning(g, c, lane, ctx) {
    const b = c.brain, path = g.map.lanePath(lane, c.team), len = g.map.pathLength(path);
    // our wave front and the enemy minions near it
    let front = -1, frontM = null;
    for (const m of g.units) {
      if (m.kind !== 'minion' || m.dead || m.team !== c.team || m.lane !== lane) continue;
      const s = g.map.project(path, m.x, m.y).s; if (s > front) { front = s; frontM = m; }
    }
    // outermost own tower in this lane
    let safeS = 1500;
    for (const s of g.structs) if (s.kind === 'tower' && s.team === c.team && !s.dead && s.lane === lane) safeS = Math.max(safeS, g.map.project(path, s.x, s.y).s);
    let holdS;
    if (frontM) holdS = front - (c.def.ranged ? 420 : 200) - (c.role === 'support' ? 120 : 0);
    else holdS = safeS - 300;
    if (g.time < 80) holdS = Math.min(holdS, safeS + 400);
    // don't stand in an enemy turret's range unless our minions tank it
    for (let guard = 0; guard < 20; guard++) {
      const p = g.map.pointAt(path, holdS);
      const et = enemyTowerNear(g, c.team, p[0], p[1], 60);
      if (!et) break;
      const tanked = et.target && et.target.kind === 'minion' && g.near(et.x, et.y, 850, u => u.kind === 'minion' && u.team === c.team).length >= 2 && !visibleEnemies(g, c, 1200, et.x, et.y).length;
      if (tanked) { holdS = Math.min(holdS, g.map.project(path, et.x, et.y).s - 150); break; }
      holdS -= 200;
    }
    holdS = Math.max(300, Math.min(holdS, len - 300));
    const hp = g.map.pointAt(path, holdS), p2 = g.map.pointAt(path, holdS + 20);
    const nl = Math.hypot(p2[0] - hp[0], p2[1] - hp[1]) || 1, nx = -(p2[1] - hp[1]) / nl, ny = (p2[0] - hp[0]) / nl;
    let hx = hp[0] + nx * b.lat, hy = hp[1] + ny * b.lat;
    if (!g.map.walkable(hx, hy)) { hx = hp[0]; hy = hp[1]; }

    // far from the lane: walk there
    const pr = g.map.project(path, c.x, c.y);
    if (pr.d > 900 || Math.abs(pr.s - holdS) > 1800) { moveTo(g, c, hx, hy); return; }

    // turret: hit it when minions tank and no enemy champion defends
    const et = enemyTowerNear(g, c.team, c.x, c.y, 300);
    if (et && g.isStructureVulnerable(et) && et.target && et.target.kind === 'minion' && !visibleEnemies(g, c, 1300).length) { attack(g, c, et); return; }
    // inhibitor / nexus
    for (const s of g.structs) if (s.team !== c.team && !s.dead && (s.kind === 'inhib' || s.kind === 'nexus') && dist(s, c) < 900 && g.isStructureVulnerable(s) && !enemyTowerNear(g, c.team, c.x, c.y, 0) && !visibleEnemies(g, c, 1200).length) { attack(g, c, s); return; }

    // last hits
    const D = DIFF[g.diff];
    const supportPassive = c.role === 'support' && alliesNear(g, c, 900).some(a => a.role === 'adc');
    const minions = g.near(c.x, c.y, c.st.range + 450, u => (u.kind === 'minion' || u.kind === 'pet') && u.team !== c.team && u.vis[c.team]);
    let lh = null;
    for (const m of minions) {
      const myDmg = attackDmg(c, m);
      const travel = (c.def.ranged ? dist(c, m) / (c.def.proj ? c.def.proj.speed : 1500) : 0) + 0.3 / c.st.as + Math.max(0, dist(c, m) - g.attackRange(c, m)) / c.st.ms;
      let incoming = 0; for (const a of g.near(m.x, m.y, 650, u => u.kind === 'minion' && u.team === c.team && u.target === m)) incoming += a.st.ad * a.st.as;
      const predicted = m.hp - incoming * travel * 0.8;
      if (predicted <= myDmg * (0.95 + (1 - D.lastHit) * 0.4) && predicted > 0 || m.hp <= myDmg) { if (!lh || m.hp < lh.hp) lh = m; }
    }
    if (lh && !supportPassive && g.rng() < D.lastHit + 0.1 && !enemyTowerNear(g, c.team, lh.x, lh.y, -60)) { attack(g, c, lh); return; }
    // farming spells
    const kit = L.KITS[c.cid];
    if (!supportPassive && c.mp > c.maxMp * 0.6 && g.rng() < 0.15 * D.cast) for (let s = 0; s < 3; s++) {
      const h = kit.ai[s]; if (!h || !ready(g, c, s)) continue;
      if (h.farm) { const m = minions.find(m => m.hp < spellDmg(c, s) * 0.9 && dist(m, c) < c.def.abilities[s].range); if (m) { castAt(g, c, s, { unit: m }); return; } }
      if ((h.type === 'aoeSelf' || h.type === 'cone') && minions.filter(m => dist(m, c) < (h.r || 500)).length >= 4 && (c.def.manaless || c.mp > c.maxMp * 0.75)) { castAt(g, c, s, h.type === 'cone' ? { x: minions[0].x, y: minions[0].y } : {}); return; }
    }
    // harass the enemy laner
    const foe = visibleEnemies(g, c, c.st.range + 200).sort((a, x) => a.hp - x.hp)[0];
    if (foe && !enemyTowerNear(g, c.team, foe.x, foe.y, 0) && ctx.adv > 0.9) {
      const enemyMinionsNear = g.near(c.x, c.y, 600, u => u.kind === 'minion' && u.team !== c.team).length;
      if ((enemyMinionsNear < 3 || c.def.ranged && c.st.range >= (foe.st.range || 0)) && g.rng() < 0.3 * D.aggro) {
        if (c.mp > c.maxMp * 0.45 || c.def.manaless) combat(g, c, foe, Object.assign({}, ctx, { fighting: false, engage: false }));
        attack(g, c, foe); return;
      }
    }
    // push: no enemy champion around, hit the lowest minion
    if (!visibleEnemies(g, c, 1400).length && minions.length && !supportPassive) {
      const m = minions.filter(m => !enemyTowerNear(g, c.team, m.x, m.y, -80)).sort((a, x) => a.hp - x.hp)[0];
      if (m && (c.role !== 'support' || g.time > 900)) { attack(g, c, m); return; }
    }
    // teemo shrooms in brush near lane
    if (c.cid === 'teemo' && ready(g, c, 3) && c.charges >= 2 && g.time > c.brain.shroomT) {
      const spots = WARD_SPOTS[c.team][lane] || []; const s = spots[Math.floor(g.rng() * spots.length)];
      if (s && Math.hypot(s[0] - c.x, s[1] - c.y) < 1200) { c.brain.shroomT = g.time + 20; g.cast(c, 3, { x: s[0], y: s[1] }); return; }
    }
    if (c.cid === 'ashe' && ready(g, c, 2) && g.time > c.brain.hawkT) { c.brain.hawkT = g.time + 60; const spots = [[9800, 9500], [4300, 3900], [7000, 7000]]; const s = spots[Math.floor(g.rng() * 3)]; castAt(g, c, 2, { x: s[0], y: s[1] }); return; }
    if (c.cid === 'masteryi' && c.hp / c.maxHp < 0.5 && ready(g, c, 1) && !visibleEnemies(g, c, 1200).length) { castAt(g, c, 1, {}); return; }
    // hold position (small idle wiggle)
    if (Math.hypot(c.x - hx, c.y - hy) > 120) moveTo(g, c, hx, hy);
    else if (c.order && c.order.type === 'attack' && c.order.unit.kind === 'champ' && dist(c, c.order.unit) > c.st.range + 250) g.order(c, { type: 'stop' });
  }

  // ------------------------------------------------------------------ jungle
  function jungle(g, c, ctx) {
    const b = c.brain, D = DIFF[g.diff];
    // gank: enemy laner low or overextended near our side
    if (c.level >= 3 && g.time > b.gankT) {
      b.gankT = g.time + 8;
      let best = null, bs = 0;
      for (const e of g.champs) {
        if (e.team === c.team || e.dead || !e.vis[c.team] || e.role === 'jungle') continue;
        const d = dist(c, e); if (d > 5500) continue;
        const allyNear = g.champs.some(a => a.team === c.team && !a.dead && a !== c && dist(a, e) < 1200);
        const et = enemyTowerNear(g, c.team, e.x, e.y, 200);
        let s = (1 - e.hp / e.maxHp) * 2 + (allyNear ? 1 : 0) - d / 5500 - (et ? 2 : 0);
        if (s > bs && s > 0.6) { bs = s; best = e; }
      }
      if (best) { b.gank = best; b.gankUntil = g.time + 20; }
    }
    if (b.gank && (b.gank.dead || g.time > b.gankUntil || !b.gank.vis[c.team] || enemyTowerNear(g, c.team, b.gank.x, b.gank.y, 100))) b.gank = null;
    if (b.gank) { moveTo(g, c, b.gank.x, b.gank.y); return; }

    // clear camps on our side (steal the enemy's later)
    const camps = g.camps.filter(k => k.def.side === c.team || (c.level >= 9 && k.def.side === 1 - c.team && g.rng() < 0.02) || (k.def.key === b.campKey)).filter(k => k.alive.some(m => !m.dead));
    let camp = camps.find(k => k.def.key === b.campKey);
    if (!camp) {
      camp = camps.sort((a, x) => (Math.hypot(a.def.p[0] - c.x, a.def.p[1] - c.y) - (a.def.id === 'blue' || a.def.id === 'red' ? 1500 : 0)) - (Math.hypot(x.def.p[0] - c.x, x.def.p[1] - c.y) - (x.def.id === 'blue' || x.def.id === 'red' ? 1500 : 0)))[0];
      b.campKey = camp ? camp.def.key : null;
    }
    if (!camp) {
      // nothing up: visit the lane closest to a respawning camp or help mid
      const next = g.camps.filter(k => k.def.side === c.team).sort((a, x) => a.respawnAt - x.respawnAt)[0];
      if (next && next.respawnAt - g.time < 25) { moveTo(g, c, next.def.p[0], next.def.p[1]); return; }
      return laning(g, c, 'mid', ctx);
    }
    const mobs = camp.alive.filter(m => !m.dead).sort((a, x) => x.maxHp - a.maxHp);
    const big = mobs[0];
    if (dist(c, big) > 700) { moveTo(g, c, big.x, big.y); return; }
    const si = c.spells.indexOf('smite');
    if (si >= 0 && c.spellCds[si] <= 0 && big.hp < 390 + 20 * c.level && (big.mtype === 'blue' || big.mtype === 'red' || big.mtype === 'dragon' || big.mtype === 'baron' || c.hp / c.maxHp < 0.4)) { g.useSpell(c, si, { unit: big }); return; }
    // spells on camps
    if (c.mp > c.maxMp * 0.3 || c.def.manaless) {
      const kit = L.KITS[c.cid];
      for (let s = 0; s < 4; s++) {
        const h = kit.ai[s]; if (!h || !ready(g, c, s) || h.ult) continue;
        if (h.type === 'targetDmg' && dist(c, big) < c.def.abilities[s].range) { castAt(g, c, s, { unit: big }); break; }
        if ((h.type === 'aoeSelf') && dist(c, big) < h.r) { castAt(g, c, s, {}); break; }
        if (h.type === 'selfAttackBuff' && dist(c, big) < c.st.range + 200) { castAt(g, c, s, {}); break; }
        if (h.type === 'skillshot' && D.cast > g.rng()) { castAt(g, c, s, { x: big.x, y: big.y }); break; }
        if (h.type === 'channelHeal' && c.hp / c.maxHp < 0.35 && !big.aggro) { castAt(g, c, s, {}); break; }
      }
    }
    const t = mobs.find(m => m.aggro === c) || (mobs.length > 1 ? mobs.slice().sort((a, x) => a.hp - x.hp)[0] : big);
    attack(g, c, t);
  }

  L.AI = { update, DIFF, advantage, power, nextBuild, shop, say };
  if (typeof module !== 'undefined') module.exports = L;
})(globalThis.LoL98 = globalThis.LoL98 || {});
