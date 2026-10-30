(function (T) {
  'use strict';
  const R = T.RULES;

  T.BOT_LEVELS = {
    novice: { id: 'novice', name: 'Новичок', reaction: 1, aimEvery: 0.25, turn: 3, err: 0.07, lead: 0.45, blast: 0, swap: 0.1, cone: 0.16, head: false, scopeWait: 0.2, rush: false, hop: 0 },
    worker: { id: 'worker', name: 'Рабочий', reaction: 0.5, aimEvery: 0.1, turn: 5, err: 0.03, lead: 0.7, blast: 0.5, swap: 0.6, cone: 0.11, head: false, scopeWait: 0.4, rush: true, hop: 0 },
    foreman: { id: 'foreman', name: 'Бригадир', reaction: 0.3, aimEvery: 0.05, turn: 8, err: 0.018, lead: 0.88, blast: 0.9, swap: 1, cone: 0.08, head: true, scopeWait: 0.65, rush: true, hop: 0.1 },
    master: { id: 'master', name: 'Мастер', reaction: 0.2, aimEvery: 0.05, turn: 12, err: 0.01, lead: 0.98, blast: 1, swap: 1, cone: 0.06, head: true, scopeWait: 0.65, rush: true, hop: 0.2 }
  };
  T.BOT_ORDER = ['novice', 'worker', 'foreman', 'master'];

  const SIGHT = 65;
  const SEES_BEHIND = 7;
  const HEAR = 26;
  const STEPS_HEARD = 9;
  const MEMORY = 3;
  const SHARE = 20;
  const ENGAGE = 18;
  const PUSH_FIGHT = 7;
  const PUSH_CHASE = 14;
  const SCAN_EVERY = 0.2;
  const PATHS_PER_TICK = 2;
  const REPATH = 1.2;
  const NODE_REACH = 0.75;
  const LAST_STRETCH = 2;
  const ARRIVED = 0.3;
  const JUMP_FROM = 1.3;
  const PLAIN_JUMP = 0.85;
  const STUCK_AFTER = 1.1;
  const STUCK_MOVE = 0.012;
  const LOW_HEALTH = 0.4;
  const SUPPLY_RANGE = 45;
  const STRAFE_MIN = 0.5;
  const STRAFE_MAX = 1.4;
  const SWAP_EVERY = 0.7;
  const IDLE_RANGE = 15;
  const DIRECT_RANGE = 8;
  const NO_PATH_WAIT = 3;
  const FALL_AVOID = 1.5;
  const EMPTY_PENALTY = 25;
  const SCOPE_FROM = 12;
  const SCOPE_DROP = 8;
  const GOAL_FIGHT = 1, GOAL_HUNT = 2, GOAL_SUPPLY = 100, GOAL_ROAM = 10000, GOAL_ORDER = 20000;

  const WEAPON_SCORE = {
    pellets: d => (d < 3 ? 80 : d < 14 ? 90 - d * 2 : 45 - d),
    bullet: d => (d < 30 ? 60 - d * 0.4 : 30),
    projectile: (d, def) => {
      if (def.flight === 'rocket') return d < 3.5 ? 25 : 85 - d * 0.3;
      if (def.flight === 'grenade') return d < 4 ? 20 : d < 24 ? 80 : 30;
      return d < 22 ? 72 - d : 20;
    },
    charge: d => (d < 4 ? 15 : d < 22 ? 60 : 25),
    stream: d => (d < 6 ? 100 : d < 9 ? 45 : 0),
    spin: d => (d < 25 ? 95 - d : 50),
    scope: d => (d > 12 ? 100 : 35),
    melee: d => (d < 2.6 ? 100 : 12)
  };
  const IDEAL = { pellets: 7, bullet: 16, projectile: 12, charge: 12, stream: 3.5, spin: 12, scope: 32, melee: 1.2 };
  const HOLDS_CLOSE = { melee: true, stream: true, pellets: true };

  function newBrain(g, h) {
    const L = T.BOT_LEVELS[h.botLevel] || T.BOT_LEVELS.worker;
    return {
      L, aimT: g.aiRand() * L.aimEvery, scanT: g.aiRand() * SCAN_EVERY,
      target: null, want: null, seenFor: 0, lastSeen: null,
      yaw: h.yaw, pitch: 0,
      goal: null, goalKey: 0, path: null, at: 0, repath: 0, noPathUntil: 0,
      roam: -1, roamT: 0, highJump: false,
      strafe: 1, strafeT: 0, swapT: 0, tap: false, detonate: false, rolled: new WeakSet(),
      stuckT: 0, dodgeT: 0, dodge: 1, lastX: h.pos.x, lastZ: h.pos.z
    };
  }

  const angleTo = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

  function canSee(g, h, t) {
    if (!t.alive || t.team === h.team) return false;
    if (t.cloaked && t.blinkT <= 0 && t.burnT <= 0) return false;
    if (t.disguised) return false;
    const eye = g.eye(h);
    const tx = t.pos.x, ty = t.pos.y + t.h * 0.7, tz = t.pos.z;
    const dx = tx - eye.x, dz = tz - eye.z, flat = Math.hypot(dx, dz);
    if (flat > SIGHT) return false;
    if (flat > SEES_BEHIND && (dx * Math.sin(h.yaw) + dz * Math.cos(h.yaw)) / flat < -0.25) return false;
    return g.world.clear(eye.x, eye.y, eye.z, tx, ty, tz);
  }

  function heard(h, t) {
    if (!t.vel || t.fixed || t.cloaked) return false;
    const d = Math.hypot(t.pos.x - h.pos.x, t.pos.z - h.pos.z);
    if (t.charging || t.fireCd > 0 || t.flaming) return d < HEAR;
    return d < STEPS_HEARD && Math.hypot(t.vel.x, t.vel.z) > 1;
  }

  function spotHydrants(g, h) {
    const known = g.aiKnown[h.team];
    for (const b of g.buildings) {
      if (b.kind !== 'hydrant' || known.includes(b) || !canSee(g, h, b)) continue;
      known.push(b);
      g.aiDirty[h.team] = true;
    }
  }

  function sense(g, h, ai, full) {
    const had = ai.target;
    let best = null, bestD = Infinity;
    if (had && canSee(g, h, had)) {
      best = had;
      bestD = Math.hypot(had.pos.x - h.pos.x, had.pos.z - h.pos.z) * 0.7;
    }
    const list = full ? g.aiEnemies(h.team) : [];
    for (const t of list) {
      if (t === best) continue;
      const d = Math.hypot(t.pos.x - h.pos.x, t.pos.z - h.pos.z);
      if (d < bestD && canSee(g, h, t)) { best = t; bestD = d; }
    }
    if (best !== had) ai.seenFor = 0;
    ai.target = best;
    if (full && g.buildings.length) spotHydrants(g, h);
    if (best) {
      ai.lastSeen = { x: best.pos.x, y: best.pos.y, z: best.pos.z, t: g.t };
      g.aiIntel[h.team] = ai.lastSeen;
      return;
    }
    if (!full) return;
    const noise = list.find(t => heard(h, t));
    if (noise) {
      ai.lastSeen = { x: noise.pos.x, y: noise.pos.y, z: noise.pos.z, t: g.t };
      return;
    }
    const shared = g.aiIntel[h.team];
    if (shared && g.t - shared.t < MEMORY && (!ai.lastSeen || shared.t > ai.lastSeen.t) && Math.hypot(shared.x - h.pos.x, shared.z - h.pos.z) < SHARE) ai.lastSeen = shared;
  }

  function usable(a) {
    if (!WEAPON_SCORE[a.def.kind]) return false;
    if (a.def.clip) return a.clip > 0 || a.reserve > 0;
    return a.def.reserve ? a.reserve > 0 : true;
  }

  function chooseSlot(h, dist) {
    let best = -1, bestS = -Infinity;
    h.arms.forEach((a, i) => {
      if (!usable(a)) return;
      let s = WEAPON_SCORE[a.def.kind](dist, a.def) + (i === h.slot ? 6 : 0);
      if (a.def.clip && a.clip === 0) s -= EMPTY_PENALTY;
      if (s > bestS) { bestS = s; best = i; }
    });
    return best;
  }

  function lobPitch(flat, dy, def) {
    const G = R.gravity * def.gravity, v2 = def.speed * def.speed;
    const lift = def.lift ? Math.atan(def.lift) : 0;
    const disc = v2 * v2 - G * (G * flat * flat + 2 * dy * v2);
    if (disc < 0) return Math.PI / 4 - lift;
    return Math.atan2(v2 - Math.sqrt(disc), G * flat) - lift;
  }

  function aimPoint(g, h, ai, t, def) {
    const eye = g.eye(h), L = ai.L;
    let x = t.pos.x, y = t.pos.y + t.h * 0.6, z = t.pos.z;
    const speed = def.speed || 0;
    const dist = Math.hypot(x - eye.x, y - eye.y, z - eye.z);
    if (speed > 0 && t.vel) {
      const time = dist / speed;
      x += t.vel.x * time * L.lead;
      z += t.vel.z * time * L.lead;
      if (!t.onGround) y += t.vel.y * time * L.lead * 0.5;
    }
    if ((def.flight === 'rocket' || def.flight === 'mine') && t.onGround && dist > 5 && g.world.clear(eye.x, eye.y, eye.z, x, t.pos.y + 0.15, z)) y = t.pos.y + 0.15;
    if (def.kind === 'scope' && L.head) y = t.pos.y + t.h - 0.12;
    const dx = x - eye.x, dy = y - eye.y, dz = z - eye.z, flat = Math.hypot(dx, dz) || 0.01;
    const pitch = def.gravity && speed ? lobPitch(flat, dy, def) : Math.atan2(dy, flat);
    return { yaw: Math.atan2(dx, dz), pitch: T.clamp(pitch, -1.45, 1.45) };
  }

  function refreshAim(g, h, ai) {
    if (!ai.target) { ai.want = null; return; }
    const want = aimPoint(g, h, ai, ai.target, h.arms[h.slot].def);
    want.yaw += (g.aiRand() - 0.5) * 2 * ai.L.err;
    want.pitch += (g.aiRand() - 0.5) * 2 * ai.L.err;
    ai.want = want;
  }

  function steer(ai, yaw, pitch, dt) {
    const step = ai.L.turn * dt;
    ai.yaw += T.clamp(angleTo(ai.yaw, yaw), -step, step);
    ai.pitch += T.clamp(pitch - ai.pitch, -step, step);
  }

  function setGoal(ai, x, y, z, key) {
    if (ai.goalKey !== key) { ai.goalKey = key; ai.repath = 0; }
    ai.goal = ai.goal || { x: 0, y: 0, z: 0 };
    ai.goal.x = x; ai.goal.y = y; ai.goal.z = z;
  }

  function refreshPath(g, h, ai, dt) {
    ai.repath -= dt;
    if (ai.repath > 0 || !ai.goal || g.aiPathBudget <= 0 || (!h.onGround && h.level < 2)) return;
    g.aiPathBudget--;
    ai.repath = REPATH + g.aiRand() * 0.4;
    const nav = g.nav;
    let a = nav.nearest(h.pos.x, h.pos.y, h.pos.z, 2, true);
    if (a < 0) a = nav.nearest(h.pos.x, h.pos.y, h.pos.z, 4);
    const p = nav.path(a, nav.nearest(ai.goal.x, ai.goal.y, ai.goal.z, 4), h.team);
    ai.path = p;
    ai.at = p && p.length > 1 ? 1 : 0;
    if (!p) { ai.noPathUntil = g.t + NO_PATH_WAIT; ai.roam = -1; }
  }

  function reached(nav, n, h) {
    if (Math.hypot(nav.x[n] - h.pos.x, nav.z[n] - h.pos.z) >= NODE_REACH) return false;
    return nav.wet[n] > 0 || (nav.y[n] - h.pos.y < 0.4 && h.pos.y - nav.y[n] < 1.4);
  }

  function followPath(g, h, ai, inp) {
    const p = ai.path, nav = g.nav;
    if (!p || p.length < 2) return null;
    let n = p[ai.at];
    while (ai.at < p.length - 1 && reached(nav, n, h)) { ai.at++; n = p[ai.at]; }
    if (ai.at === p.length - 1 && reached(nav, n, h)) return null;
    const dx = nav.x[n] - h.pos.x, dz = nav.z[n] - h.pos.z;
    const rise = nav.y[n] - h.pos.y;
    if (h.onGround) ai.highJump = false;
    else if (ai.highJump) inp.crouch = true;
    if (h.level >= 2 && rise > R.stepUp) inp.jump = true;
    const needs = nav.edgeFlag(p[ai.at - 1], n) === T.Nav.F_WALK ? PLAIN_JUMP : R.stepUp;
    if (h.onGround && rise > needs && Math.hypot(dx, dz) < JUMP_FROM) {
      inp.jump = true;
      ai.highJump = rise > PLAIN_JUMP;
    }
    return { x: dx, z: dz };
  }

  function lastStretch(h, ai) {
    if (!ai.goal || Math.abs(ai.goal.y - h.pos.y) > 1) return null;
    const dx = ai.goal.x - h.pos.x, dz = ai.goal.z - h.pos.z;
    return Math.hypot(dx, dz) < LAST_STRETCH ? { x: dx, z: dz } : null;
  }

  function applyMove(inp, dx, dz) {
    const l = Math.hypot(dx, dz);
    if (l < 1e-4) return;
    const fx = Math.sin(inp.yaw), fz = Math.cos(inp.yaw), nx = dx / l, nz = dz / l;
    inp.fwd = nx * fx + nz * fz;
    inp.side = -nx * fz + nz * fx;
  }

  function edgeAhead(g, h, dx, dz) {
    const l = Math.hypot(dx, dz);
    if (l < 1e-4 || !h.onGround) return false;
    const y = g.world.groundAt(h.pos.x + dx / l, h.pos.z + dz / l, h.pos.y + R.stepUp, 0);
    return y === -Infinity || h.pos.y - y > FALL_AVOID;
  }

  function supplyGoal(g, h) {
    const low = h.hp < h.maxHp * LOW_HEALTH;
    const a = h.arms.find(x => WEAPON_SCORE[x.def.kind] && x.def.kind !== 'melee');
    const dry = a && a.def.reserve && a.reserve + a.clip <= (a.def.clip || a.def.reserve) * 0.2;
    if (!low && !dry) return -1;
    const want = low ? 'health' : 'ammo';
    let best = -1, bestD = SUPPLY_RANGE;
    g.pickups.forEach((p, i) => {
      if (p.kind !== want || g.t < p.readyAt) return;
      const d = Math.hypot(p.x - h.pos.x, p.z - h.pos.z) + Math.abs(p.y - h.pos.y) * 3;
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function roamGoal(g, h, ai, dt) {
    const list = g.map.roam;
    if (!list.length) return null;
    ai.roamT -= dt;
    if (ai.roam >= 0) {
      const r = list[ai.roam];
      if (Math.hypot(r.x - h.pos.x, r.z - h.pos.z) < 2.5 && Math.abs(r.y - h.pos.y) < 1.5) ai.roam = -1;
    }
    if (ai.roam < 0 || ai.roamT <= 0) {
      ai.roam = Math.floor(g.aiRand() * list.length);
      ai.roamT = 8 + g.aiRand() * 8;
    }
    return list[ai.roam];
  }

  function chaseRange(order, kind) {
    if (order && order.push) return HOLDS_CLOSE[kind] ? PUSH_CHASE : PUSH_FIGHT;
    return HOLDS_CLOSE[kind] ? Infinity : ENGAGE;
  }

  function chooseGoal(g, h, ai, t, dist, order, supply, dt) {
    const free = g.t >= ai.noPathUntil;
    const follow = () => setGoal(ai, order.x, order.y, order.z, GOAL_ORDER + order.key);
    if (order && order.urgent) {
      follow();
    } else if (supply >= 0 && free) {
      const p = g.pickups[supply];
      setGoal(ai, p.x, p.y, p.z, GOAL_SUPPLY + supply);
    } else if (t && free && dist < chaseRange(order, h.arms[h.slot].def.kind)) {
      setGoal(ai, t.pos.x, t.pos.y, t.pos.z, GOAL_FIGHT);
    } else if (order && order.push) {
      follow();
    } else if (!t && !(order && order.hold) && ai.lastSeen && free && g.t - ai.lastSeen.t < MEMORY) {
      setGoal(ai, ai.lastSeen.x, ai.lastSeen.y, ai.lastSeen.z, GOAL_HUNT);
    } else if (order) {
      follow();
    } else {
      const r = roamGoal(g, h, ai, dt);
      if (r) setGoal(ai, r.x, r.y, r.z, GOAL_ROAM + ai.roam);
    }
  }

  function fireWeapon(g, h, ai, inp, t, dist) {
    const want = ai.want, L = ai.L, a = h.arms[h.slot], def = a.def, kind = def.kind;
    const off = Math.hypot(angleTo(ai.yaw, want.yaw), want.pitch - ai.pitch);
    const lined = off < Math.max(L.cone, Math.atan2(t.r + 0.15, Math.max(dist, 0.5)));
    const ready = ai.seenFor >= L.reaction;
    if (kind === 'melee') {
      if (ready && off < 0.6 && dist <= def.range + t.r + 0.3) inp.fire = true;
    } else if (kind === 'stream') {
      if (ready && lined && dist <= def.range + t.r) inp.fire = true;
    } else if (kind === 'spin') {
      if (ready && lined) inp.fire = true;
      else inp.fire2 = true;
    } else if (kind === 'charge') {
      if (ai.tap) ai.tap = false;
      else if (ready && lined && h.fireCd <= 0 && a.clip > 0) { inp.fire = true; ai.tap = true; }
    } else if (kind === 'scope') {
      if (h.scoped ? dist <= SCOPE_DROP : dist > SCOPE_FROM && h.onGround) inp.fire2 = !h.fire2Held;
      if (ready && lined && (h.scoped ? h.scopeCharge >= L.scopeWait : dist <= SCOPE_FROM)) inp.fire = true;
    } else if (ready && lined && (dist > 2 || L.id === 'novice' || !def.radius)) {
      inp.fire = true;
    }
  }

  function reactToShells(g, h, ai, inp) {
    const a = h.arms[h.slot], def = a.def;
    if (def.kind !== 'stream' || ai.L.blast <= 0 || h.fireCd > 0 || h.deployT > 0 || a.reserve < def.blastCost) return;
    const eye = g.eye(h);
    for (const p of g.proj) {
      if (p.team === h.team || (p.def.flight !== 'rocket' && p.def.flight !== 'grenade')) continue;
      const dx = p.x - eye.x, dy = p.y - eye.y, dz = p.z - eye.z;
      if (Math.hypot(dx, dy, dz) > def.blastRange || ai.rolled.has(p)) continue;
      ai.rolled.add(p);
      if (g.aiRand() >= ai.L.blast) continue;
      ai.yaw = Math.atan2(dx, dz);
      ai.pitch = Math.atan2(dy, Math.hypot(dx, dz));
      inp.fire2 = true;
      return;
    }
  }

  function watchMines(g, h, ai) {
    if (ai.detonate || !h.arms.some(a => a.def.flight === 'mine')) return;
    const enemies = g.aiEnemies(h.team);
    for (const p of g.proj) {
      if (p.owner !== h || p.def.flight !== 'mine' || p.armT > 0) continue;
      const reach = p.def.radius * 0.8;
      if (enemies.some(t => Math.hypot(t.pos.x - p.x, t.pos.y + t.h / 2 - p.y, t.pos.z - p.z) < reach)) { ai.detonate = true; return; }
    }
  }

  function useCharge(h, ai, inp, t, dist) {
    const c = h.mods.charge;
    if (!c || !t || !ai.want) return;
    if (h.charging) {
      if (dist <= h.arms[h.slot].def.range + t.r + 0.4 && (h.chargeRun / c.time >= c.critAt || dist < 1.4)) inp.fire = true;
    } else if (ai.L.rush && h.chargeMeter >= 1 && dist > 6 && dist < 19 && Math.abs(angleTo(ai.yaw, ai.want.yaw)) < 0.15) {
      inp.fire2 = !h.fire2Held;
    }
  }

  function moveInFight(g, h, ai, inp, t, dist, def, step, dt) {
    const ideal = IDEAL[def.kind] || 10, fx = Math.sin(ai.yaw), fz = Math.cos(ai.yaw);
    if (dist > ideal * 1.3) {
      if (dist < DIRECT_RANGE && !h.wall && Math.abs(t.pos.y - h.pos.y) < 1) return { x: t.pos.x - h.pos.x, z: t.pos.z - h.pos.z, following: false };
      return step ? { x: step.x, z: step.z, following: true } : { x: fx, z: fz, following: false };
    }
    ai.strafeT -= dt;
    if (ai.strafeT <= 0 || (h.wall && h.blocked > 0.5)) {
      ai.strafe = g.aiRand() < 0.5 ? -1 : 1;
      ai.strafeT = STRAFE_MIN + g.aiRand() * (STRAFE_MAX - STRAFE_MIN);
      if (g.aiRand() < ai.L.hop && def.kind !== 'scope') inp.jump = true;
    }
    const back = dist < ideal * 0.6 && !HOLDS_CLOSE[def.kind] ? -1 : 0;
    const x = fx * back - fz * ai.strafe, z = fz * back + fx * ai.strafe;
    if (!edgeAhead(g, h, x, z)) return { x, z, following: false };
    ai.strafe = -ai.strafe;
    return { x: 0, z: 0, following: false };
  }

  T.AI = {
    prepare(g) {
      g.nav = new T.Nav(g.map);
      g.aiRand = T.rng((g.opts.seed || 1) * 7919 + 13);
      g.aiIntel = { hot: null, cold: null };
      g.aiKnown = { hot: [], cold: [] };
      g.aiDirty = { hot: false, cold: false };
      g.aiLists = { hot: null, cold: null };
      g.aiPathBudget = PATHS_PER_TICK;
      g.aiStuck = 0;
    },

    tick(g) {
      g.aiPathBudget = PATHS_PER_TICK;
      g.aiLists.hot = g.aiLists.cold = null;
      for (const team of ['hot', 'cold']) {
        const known = g.aiKnown[team];
        if (!g.aiDirty[team] && known.every(b => b.alive)) continue;
        g.aiKnown[team] = known.filter(b => b.alive);
        g.aiDirty[team] = false;
        g.nav.setDanger(team, g.aiKnown[team]);
      }
    },

    think(g, h, dt) {
      const ai = h.ai || (h.ai = newBrain(g, h));
      const L = ai.L, inp = T.blankInput();
      if (h.charging) ai.yaw = h.yaw;
      ai.aimT -= dt;
      ai.scanT -= dt;
      if (ai.aimT <= 0) {
        ai.aimT = L.aimEvery;
        const full = ai.scanT <= 0;
        if (full) ai.scanT = SCAN_EVERY;
        sense(g, h, ai, full);
        if (full) watchMines(g, h, ai);
        refreshAim(g, h, ai);
      }
      if (ai.target && !ai.target.alive) { ai.target = null; ai.want = null; ai.seenFor = 0; }
      const t = ai.target;
      if (t) ai.seenFor += dt;
      const dist = t ? Math.hypot(t.pos.x - h.pos.x, t.pos.y - h.pos.y, t.pos.z - h.pos.z) : 0;

      ai.swapT -= dt;
      if (ai.swapT <= 0 && !h.charging) {
        ai.swapT = SWAP_EVERY;
        if (!usable(h.arms[h.slot]) || g.aiRand() < L.swap) {
          const slot = t ? chooseSlot(h, dist) : usable(h.arms[0]) ? 0 : chooseSlot(h, IDLE_RANGE);
          if (slot >= 0 && slot !== h.slot) inp.slot = slot + 1;
        }
      }
      const arm = h.arms[h.slot], def = arm.def;

      const order = g.mode ? g.mode.order(h) : null;
      const supply = order && order.urgent ? -1 : supplyGoal(g, h);
      chooseGoal(g, h, ai, t, dist, order, supply, dt);
      refreshPath(g, h, ai, dt);
      const step = followPath(g, h, ai, inp) || lastStretch(h, ai);

      if (ai.want) steer(ai, ai.want.yaw, ai.want.pitch, dt);
      else if (step) steer(ai, Math.atan2(step.x, step.z), 0, dt);
      reactToShells(g, h, ai, inp);
      inp.yaw = ai.yaw;
      inp.pitch = ai.pitch;

      const pressing = order && (order.urgent || (order.push && ai.goalKey !== GOAL_FIGHT));
      let move = null;
      if (t && supply < 0 && !pressing) move = moveInFight(g, h, ai, inp, t, dist, def, step, dt);
      else if (step) move = { x: step.x, z: step.z, following: Math.hypot(step.x, step.z) > ARRIVED };
      let mx = move ? move.x : 0, mz = move ? move.z : 0;

      const moved = Math.hypot(h.pos.x - ai.lastX, h.pos.z - ai.lastZ);
      ai.lastX = h.pos.x;
      ai.lastZ = h.pos.z;
      if (move && move.following && moved < STUCK_MOVE && !h.frozen) {
        ai.stuckT += dt;
        if (ai.stuckT > STUCK_AFTER) {
          ai.stuckT = 0;
          ai.repath = 0;
          ai.path = null;
          ai.roam = -1;
          ai.dodgeT = 0.5;
          ai.dodge = g.aiRand() < 0.5 ? -1 : 1;
          inp.jump = true;
          g.aiStuck++;
        }
      } else {
        ai.stuckT = 0;
      }
      if (ai.dodgeT > 0) {
        ai.dodgeT -= dt;
        const fx = Math.sin(ai.yaw), fz = Math.cos(ai.yaw);
        mx = -fz * ai.dodge + fx * 0.3;
        mz = fx * ai.dodge + fz * 0.3;
      }
      applyMove(inp, mx, mz);

      if (t && ai.want) {
        if (h.deployT <= 0 && !inp.slot) fireWeapon(g, h, ai, inp, t, dist);
      } else {
        if (def.clip && arm.clip < def.clip * 0.6 && arm.reserve > 0) inp.reload = true;
        if (h.scoped) inp.fire2 = !h.fire2Held;
      }
      if (ai.detonate && !h.fire2Held) { inp.fire2 = true; ai.detonate = false; }
      useCharge(h, ai, inp, t, dist);
      return inp;
    }
  };

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
