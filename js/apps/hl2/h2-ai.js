(function (H) {
  'use strict';

  const CAT = {
    citizen: 'civ', kleiner: 'story', eli: 'story', mossman: 'story', breen: 'story', gman: 'story', dog: 'dog',
    rebel: 'soldier', medic: 'soldier', rebel_rpg: 'soldier', alyx: 'soldier', barney: 'soldier', grigori: 'soldier', vort: 'soldier',
    metrocop: 'soldier', metrocop_pistol: 'soldier', soldier: 'soldier', soldier_shotgun: 'soldier', elite: 'soldier', prisonguard: 'soldier',
    manhack: 'manhack', scanner: 'scanner', headcrab: 'crab', fastcrab: 'crab', poisoncrab: 'crab', zombie: 'zombie', fastzombie: 'zombie', poisonzombie: 'zombie',
    barnacle: 'barnacle', antlion: 'antlion', antlionguard: 'guard', turret: 'turret', rollermine: 'roller', hunterchopper: 'air', gunship: 'air',
    strider: 'strider', apc: 'apc', dropship: 'dropship'
  };

  const LINES = {
    alert: { combine: ['Цель обнаружена!', 'Контакт!', 'Вижу подозреваемого!', 'Нарушитель! Огонь!'], rebel: ['Альянс!', 'Вон они!', 'Комбайны!', 'Осторожно, солдаты!'] },
    grenade: ['Граната!', 'Ложись!'],
    hurt: { rebel: ['Ранен!', 'Меня задело!', 'Больно!'] },
    complain: ['Эй! Смотри, куда стреляешь!', 'Осторожнее!', 'Это же я!', 'Фримен, ты чего?'],
    heal: ['Держи, подлечись.', 'Вот аптечка.', 'Давай подлатаю.'],
    join: ['Ладно, иду с тобой.', 'Веди, Фримен!', 'Я за тобой.'],
    leave: ['Останусь здесь.', 'Буду ждать тут.'],
    idle: { rebel: ['Жаль, у меня нет монтировки.', 'Ты правда тот самый Фримен?', 'Держимся вместе.', 'Надеюсь, мы знаем, что делаем.'] }
  };

  function pick(game, arr) { return arr[Math.floor(game.rng() * arr.length)]; }

  function make(game, type, x, y, z, o = {}) {
    const def = H.NPCS[type];
    if (!def) throw new Error('hl2: unknown npc ' + type);
    const n = {
      id: o.id || ('n' + (game.nextId++)), kind: 'npc', type, def, cat: CAT[type] || 'soldier', team: o.team || def.team, tag: o.tag || null,
      speaker: o.speaker || (type === 'metrocop_pistol' ? 'metrocop' : type),
      pos: { x, y, z }, vel: { x: 0, y: 0, z: 0 }, yaw: o.yaw || 0, aim: 0,
      hp: o.hp || def.hp, maxHp: def.hp, alive: true, essential: !!(o.essential || def.essential),
      state: 'idle', enemy: null, lastSeenT: -99, lastSeenPos: null, acquiredT: -99,
      path: null, pathI: 0, repathT: 0, pathGoal: null, stuckT: 0, lastProg: null, progT: 0,
      weapon: o.weapon !== undefined ? o.weapon : def.weapon || null, wcd: 0.6 + game.rng() * 0.8, burst: 0,
      grenades: def.grenades || 0, grenadeT: game.time + 4 + game.rng() * 5, balls: def.balls || 0,
      follow: !!o.follow, inSquad: !!o.squad, hold: null, script: null, passive: !!o.passive,
      onGround: true, crouch: false, walk: 0, speedNow: 0, act: null, actT: 0, talkT: 0, faceT: o.face || null,
      thinkT: game.rng() * 0.2, sleep: !!o.sleep, wakeDist: o.wakeDist || 7, sight: o.sight || def.sight || 42,
      tacT: 0, tac: null, leapCd: 1, leaping: false, meleeT: 0, windup: 0, knockT: 0, patrol: o.patrol || null, patrolI: 0,
      alt: o.alt || (def.flying ? (type === 'manhack' ? 1.2 : type === 'scanner' ? 3 : 16) : 0), orbit: game.rng() * 6.28,
      opts: { lines: o.lines || null, patrol: o.patrol || null, airPath: o.airPath || null, noDrop: !!o.noDrop, stay: !!o.stay, emerge: !!o.burrow, crabless: !!o.crabless, base: o.yaw || 0 },
      tipped: false, emergeT: o.burrow ? 1.2 : 0, downT: 0, heal: 0, baitT: 0, bait: null, flashT: 4 + game.rng() * 4,
      chargeT: 0, stunT: 0, chargeCd: 2, cannonT: 8, cannonCharge: 0, dropT: 5, pathSpeed: 1, hover: null
    };
    if (o.path) n.script = { path: o.path, i: 0, run: !!o.run, loop: !!o.loop };
    if (o.goto) n.script = { goto: { x: o.goto[0], y: null, z: o.goto[1] }, run: !!o.run };
    if (o.hold) n.hold = { x, y, z };
    if (n.cat === 'strider') n.bodyY = y + 8.5;
    if (n.cat === 'barnacle') n.tongue = Math.max(0.5, y - game.world.surfaceAt(x, z, y - 0.5, 0) - 0.1);
    if (def.flying) n.pos.y = o.y !== undefined && o.y !== null ? o.y : y + n.alt;
    if (o.hate) { n.enemy = game.player; n.lastSeenT = game.time; n.lastSeenPos = H.vcopy(game.player.pos); n.state = 'combat'; }
    game.npcs.push(n);
    return n;
  }

  function targetPos(t) {
    if (t.kind === 'player') return t.vehicle ? t.vehicle.pos : t.pos;
    return t.pos;
  }
  function targetAlive(game, t) {
    if (!t) return false;
    if (t.kind === 'player') return !t.dead && !game.notarget;
    return t.alive;
  }
  function targetHeight(t) {
    if (t.kind === 'player') return t.vehicle ? 1.4 : t.height;
    return t.def.height;
  }
  function chest(t) {
    const p = targetPos(t);
    return { x: p.x, y: p.y + targetHeight(t) * 0.62, z: p.z };
  }
  function eyeOf(n) { return { x: n.pos.x, y: n.pos.y + n.def.height * 0.88, z: n.pos.z }; }

  function canSee(game, n, t) {
    const e = eyeOf(n), c = chest(t);
    if (H.dist(e, c) > n.sight) return false;
    if (!game.world.lineClear(e, c)) return false;
    for (const d of game.doors) {
      if (!d.solid || d.type === 'field') continue;
      const dir = H.vsub(c, e);
      const len = H.vlen(dir);
      const h = H.rayBox(e, H.vscale(dir, 1 / len), d.box.x1, d.box.y1, d.box.z1, d.box.x2, d.box.y2, d.box.z2);
      if (h && h.t < len) return false;
    }
    return true;
  }

  function perceive(game, n) {
    if (n.passive || n.sleep) return;
    const cands = [];
    const pl = game.player;
    if (!pl.dead && !game.notarget && H.hostile(n.team, 'player')) cands.push(pl);
    for (const m of game.npcs) {
      if (m === n || !m.alive || m.held) continue;
      if (!H.hostile(n.team, m.team)) continue;
      if (m.cat === 'dropship' || (m.cat === 'barnacle' && n.cat !== 'soldier')) continue;
      cands.push(m);
    }
    let best = null, bestD = 1e9;
    const fwd = H.forward(n.yaw);
    const alert = n.state !== 'idle';
    for (const t of cands) {
      const tp = targetPos(t);
      const d = H.dist(n.pos, tp);
      if (d > n.sight) continue;
      if (!alert && d > 3) {
        const v = H.vnorm(H.vsub(tp, n.pos));
        if (v.x * fwd.x + v.z * fwd.z < 0.2 && n.cat !== 'air') continue;
      }
      const score = d - (t === n.enemy ? 6 : 0) - (t.kind === 'player' ? 2 : 0);
      if (score >= bestD) continue;
      if (!canSee(game, n, t)) continue;
      bestD = score;
      best = t;
    }
    if (best) {
      if (n.enemy !== best || game.time - n.lastSeenT > 3) {
        n.acquiredT = game.time;
        if (n.state === 'idle') alertBark(game, n);
      }
      n.enemy = best;
      n.lastSeenT = game.time;
      n.lastSeenPos = H.vcopy(targetPos(best));
      n.state = 'combat';
      n.investigate = null;
      return;
    }
    if (n.enemy && !targetAlive(game, n.enemy)) { n.enemy = null; n.state = 'alert'; }
    if (!n.enemy && n.state === 'idle') {
      for (const nz of game.noises) {
        if (nz.who && nz.who.team && !H.hostile(n.team, nz.who.team)) continue;
        if (H.dist(nz.pos, n.pos) < nz.radius) { n.investigate = H.vcopy(nz.pos); n.state = 'alert'; n.alertT = game.time; break; }
      }
    }
  }

  function alertBark(game, n) {
    if (n.team === 'combine' && (n.cat === 'soldier')) { game.bark('combine', n.def.model === 'metrocop' ? 'metrocop' : 'soldier', pick(game, LINES.alert.combine)); game.emit({ type: 'sound', name: 'radio', pos: n.pos }); }
    else if (n.team === 'rebel' && n.cat === 'soldier' && !n.essential) game.bark('rebel', 'rebel', pick(game, LINES.alert.rebel));
    else if (n.cat === 'zombie') game.emit({ type: 'sound', name: n.type === 'fastzombie' ? 'fastzombie_alert' : 'zombie_alert', pos: n.pos });
    else if (n.cat === 'antlion') game.emit({ type: 'sound', name: 'antlion_alert', pos: n.pos });
    else if (n.cat === 'crab') game.emit({ type: 'sound', name: 'crab_alert', pos: n.pos });
    else if (n.cat === 'manhack') game.emit({ type: 'sound', name: 'manhack', pos: n.pos });
  }

  function obstacles(game, n) {
    return game.obstaclesFor(n, { player: true, combine: n.team === 'combine', npcs: n.def.radius > 0.6 });
  }

  function separation(game, n) {
    let sx = 0, sz = 0;
    const r0 = n.def.radius || 0.34;
    for (const m of game.npcs) {
      if (m === n || !m.alive || m.def.flying || m.cat === 'barnacle') continue;
      const dx = n.pos.x - m.pos.x, dz = n.pos.z - m.pos.z;
      const d = Math.hypot(dx, dz);
      const rr = r0 + (m.def.radius || 0.34) + 0.15;
      if (d < rr && d > 1e-3 && Math.abs(n.pos.y - m.pos.y) < 1.5) { sx += dx / d * (rr - d); sz += dz / d * (rr - d); }
    }
    return { x: sx, z: sz };
  }

  function moveGround(game, n, wx, wz, speed, dt, face = true) {
    const sep = separation(game, n);
    let tx = wx * speed + sep.x * 3, tz = wz * speed + sep.z * 3;
    if (n.knockT > 0) { n.knockT -= dt; tx = n.vel.x; tz = n.vel.z; }
    const acc = (n.onGround ? 22 : 4) * dt;
    n.vel.x = H.approach(n.vel.x, tx, acc * Math.max(1, speed));
    n.vel.z = H.approach(n.vel.z, tz, acc * Math.max(1, speed));
    n.vel.y -= H.GRAVITY * dt;
    const wl = game.world.waterAt(n.pos.x, n.pos.z);
    if (wl > n.pos.y + 0.8) { n.vel.y = Math.max(n.vel.y, 0.5); }
    const r = n.def.radius || 0.34;
    const res = game.world.moveBox(n.pos, r, n.crouch ? n.def.height * 0.65 : n.def.height, { x: n.vel.x * dt, y: n.vel.y * dt, z: n.vel.z * dt }, { step: 0.6, grounded: n.onGround, extra: obstacles(game, n) });
    if (res.hitY && n.vel.y < 0) n.vel.y = 0;
    if (res.hitY && n.vel.y > 0) n.vel.y = 0;
    const was = n.onGround;
    n.onGround = res.onGround;
    if (!n.onGround && was && n.vel.y <= 0) {
      const probe = { x: n.pos.x, y: n.pos.y, z: n.pos.z };
      const r2 = game.world.moveBox(probe, r, n.def.height, { x: 0, y: -0.65, z: 0 }, { extra: obstacles(game, n) });
      if (r2.onGround) { n.pos.y = probe.y; n.onGround = true; n.vel.y = 0; }
    }
    if (res.hitX || res.hitZ) n.blocked = (n.blocked || 0) + dt; else n.blocked = 0;
    const hs = Math.hypot(n.vel.x, n.vel.z);
    n.speedNow = hs;
    n.walk += hs * dt * 1.7;
    if (face && hs > 0.3) n.yaw = H.turnTo(n.yaw, Math.atan2(n.vel.x, n.vel.z), dt * 7);
    if (n.pos.y < -60) { n.alive = false; n.deadT = game.time; }
    return res;
  }

  function stand(game, n, dt) { moveGround(game, n, 0, 0, 0, dt, false); }

  function pathTo(game, n, goal, dt, speed, arrive = 0.8, face = true) {
    const d = H.distXZ(n.pos, goal);
    if (d < arrive && Math.abs(goal.y - n.pos.y) < 2) { moveGround(game, n, 0, 0, 0, dt, face); return true; }
    const needRepath = !n.path || !n.pathGoal || H.distXZ(n.pathGoal, goal) > 1.8 || game.time > n.repathT || (n.blocked > 0.8);
    if (needRepath && game.time >= (n.nextPathT || 0)) {
      n.nextPathT = game.time + 0.25 + game.rng() * 0.2;
      n.path = game.world.findPath(n.pos, goal, { noDeep: true, noSand: false, max: 5000 });
      n.pathI = 0;
      n.pathGoal = H.vcopy(goal);
      n.repathT = game.time + 1.2 + game.rng() * 0.8;
      if (n.blocked > 0.8) { n.blocked = 0; n.sidestep = 0.5; n.sideDir = game.rng() < 0.5 ? -1 : 1; }
    }
    let wp = null;
    if (n.path && n.path.length) {
      while (n.pathI < n.path.length - 1 && H.distXZ(n.pos, n.path[n.pathI]) < 0.7) n.pathI++;
      wp = n.path[Math.min(n.pathI, n.path.length - 1)];
    } else if (d < 6) wp = goal;
    if (!wp) { moveGround(game, n, 0, 0, 0, dt, face); return false; }
    let dx = wp.x - n.pos.x, dz = wp.z - n.pos.z;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l; dz /= l;
    if (n.sidestep > 0) {
      n.sidestep -= dt;
      const sx = -dz * n.sideDir, sz = dx * n.sideDir;
      dx = dx * 0.3 + sx; dz = dz * 0.3 + sz;
    }
    moveGround(game, n, dx, dz, speed, dt, face);
    return false;
  }

  function faceTo(n, p, dt, rate = 6) { n.yaw = H.turnTo(n.yaw, Math.atan2(p.x - n.pos.x, p.z - n.pos.z), dt * rate); }

  function stepAll(game, dt) {
    for (let i = 0; i < game.npcs.length; i++) {
      const n = game.npcs[i];
      if (!n.alive) { corpse(game, n, dt); continue; }
      if (n.held) continue;
      n.talkT = Math.max(0, n.talkT - dt);
      if (n.actT > 0) { n.actT -= dt; if (n.actT <= 0) n.act = null; }
      if (n.downT > 0) { n.downT -= dt; stand(game, n, dt); continue; }
      if (n.emergeT > 0) { n.emergeT -= dt; continue; }
      if (n.sleep) {
        const pl = game.player;
        if ((!pl.dead && H.dist(pl.pos, n.pos) < n.wakeDist) || n.lastHurtT > -1) n.sleep = false;
        else { if (!n.def.flying && n.cat !== 'barnacle' && n.cat !== 'turret') stand(game, n, dt); continue; }
      }
      n.thinkT -= dt;
      if (n.thinkT <= 0) { n.thinkT = 0.2; perceive(game, n); }
      if (n.enemy && !targetAlive(game, n.enemy)) { n.enemy = null; n.state = 'alert'; }
      switch (n.cat) {
        case 'soldier': soldier(game, n, dt); break;
        case 'civ': civilian(game, n, dt); break;
        case 'story': story(game, n, dt); break;
        case 'dog': dog(game, n, dt); break;
        case 'crab': crab(game, n, dt); break;
        case 'zombie': zombie(game, n, dt); break;
        case 'antlion': antlion(game, n, dt); break;
        case 'guard': guard(game, n, dt); break;
        case 'manhack': manhack(game, n, dt); break;
        case 'scanner': scanner(game, n, dt); break;
        case 'barnacle': barnacle(game, n, dt); break;
        case 'turret': turret(game, n, dt); break;
        case 'roller': roller(game, n, dt); break;
        case 'air': air(game, n, dt); break;
        case 'strider': strider(game, n, dt); break;
        case 'apc': apc(game, n, dt); break;
        case 'dropship': dropship(game, n, dt); break;
      }
    }
  }

  function runScriptMove(game, n, dt) {
    const s = n.script;
    const speed = n.def.speed * (s.run ? 1 : 0.55);
    if (s.goto) {
      const g = { x: s.goto.x, y: s.goto.y !== null ? s.goto.y : n.pos.y, z: s.goto.z };
      if (pathTo(game, n, g, dt, speed, 0.6)) { n.script = null; n.arrived = game.time; if (s.then) n.hold = H.vcopy(n.pos); }
      return true;
    }
    if (s.path) {
      const pts = game.world.paths[s.path];
      if (!pts) { n.script = null; return false; }
      const p = pts[s.i];
      const g = { x: p.x, y: p.y !== null ? p.y : n.pos.y, z: p.z };
      if (pathTo(game, n, g, dt, speed, 0.9)) {
        s.i++;
        if (s.i >= pts.length) { if (s.loop) s.i = 0; else { n.script = null; n.arrived = game.time; } }
      }
      return true;
    }
    return false;
  }

  function soldier(game, n, dt) {
    const pl = game.player;
    const wpn = H.NPC_WEAPONS[n.weapon] || null;
    const hasEnemy = n.enemy && game.time - n.lastSeenT < 14;
    const visible = hasEnemy && game.time - n.lastSeenT < 0.35;
    if (n.def.medic && n.team === 'rebel' && !pl.dead && pl.hp < 60 && game.time > (n.healT || 0) && H.dist(n.pos, pl.pos) < 3.5) {
      n.healT = game.time + 25;
      pl.hp = Math.min(100, pl.hp + 25);
      game.say(n.speaker, pick(game, LINES.heal), 2);
      game.emit({ type: 'sound', name: 'pickup_health' });
    }
    if (n.script) {
      runScriptMove(game, n, dt);
      if (visible && wpn && !n.passive && !n.script.noFire) aimAndShoot(game, n, wpn, dt, true);
      return;
    }
    if (hasEnemy && wpn && !n.passive) {
      const ep = n.enemy === pl ? targetPos(pl) : n.enemy.pos;
      const dist = H.dist(n.pos, ep);
      if (wpn.melee) {
        if (dist < wpn.range + 0.3) {
          stand(game, n, dt);
          faceTo(n, ep, dt, 10);
          n.meleeT -= dt;
          if (n.meleeT <= 0 && visible) {
            n.meleeT = wpn.rate;
            n.act = 'swing'; n.actT = 0.4;
            hitTarget(game, n, n.enemy, wpn.melee, 'club');
            game.emit({ type: 'sound', name: 'stunstick', pos: n.pos });
          }
        } else pathTo(game, n, n.lastSeenPos, dt, n.def.speed, 1.2);
        return;
      }
      if (game.time > n.tacT) {
        n.tacT = game.time + 2 + game.rng() * 2.5;
        n.tac = chooseTactic(game, n, ep, dist, wpn, visible);
      }
      if (n.tac) {
        const arrived = pathTo(game, n, n.tac, dt, n.def.speed, 0.7, false);
        if (arrived) n.tac = null;
      } else stand(game, n, dt);
      if (visible) aimAndShoot(game, n, wpn, dt, false);
      else {
        faceTo(n, n.lastSeenPos, dt, 4);
        if (n.grenades > 0 && game.time > n.grenadeT && dist > 5 && dist < 22 && game.time - n.lastSeenT < 5) {
          n.grenadeT = game.time + 10 + game.rng() * 6;
          n.grenades--;
          throwGrenadeAt(game, n, n.lastSeenPos);
        }
        if (!n.tac && game.time - n.lastSeenT > 2.5 && !n.follow && !n.hold && !n.opts.stay) n.tac = n.lastSeenPos;
      }
      return;
    }
    if (n.follow && n.team !== 'combine') {
      followPlayer(game, n, dt);
      return;
    }
    if (n.hold) {
      if (H.distXZ(n.pos, n.hold) > 1) pathTo(game, n, n.hold, dt, n.def.speed * 0.7, 0.6);
      else idleLook(game, n, dt);
      return;
    }
    if (n.investigate && !n.opts.stay) {
      if (pathTo(game, n, n.investigate, dt, n.def.speed * 0.6, 1.5) || game.time - n.alertT > 12) { n.investigate = null; n.state = 'idle'; }
      return;
    }
    if (n.patrol) {
      const pts = game.world.paths[n.patrol];
      if (pts && pts.length) {
        const p = pts[n.patrolI % pts.length];
        if (pathTo(game, n, { x: p.x, y: p.y !== null ? p.y : n.pos.y, z: p.z }, dt, n.def.speed * 0.45, 0.9)) n.patrolI++;
        return;
      }
    }
    idleLook(game, n, dt);
  }

  function idleLook(game, n, dt) {
    stand(game, n, dt);
    const pl = game.player;
    if (n.faceT === 'player' || (n.team !== 'combine' && !pl.dead && H.dist(n.pos, pl.pos) < 4.5)) faceTo(n, pl.pos, dt, 4);
    else if (typeof n.faceT === 'number') n.yaw = H.turnTo(n.yaw, n.faceT, dt * 4);
    if (n.team === 'rebel' && n.def.squad && n.follow && game.rng() < dt * 0.01 && LINES.idle.rebel) game.bark('rebelidle', 'rebel', pick(game, LINES.idle.rebel), 30);
  }

  function followPlayer(game, n, dt) {
    const pl = game.player;
    if (n.hold) {
      if (H.distXZ(n.pos, n.hold) > 1) pathTo(game, n, n.hold, dt, n.def.speed, 0.6);
      else idleLook(game, n, dt);
      return;
    }
    const tp = targetPos(pl);
    const d = H.dist(n.pos, tp);
    if (d > 3.8) {
      const idx = game.npcs.filter(m => m.follow && m.alive).indexOf(n);
      const a = pl.yaw + Math.PI + (idx - 1) * 0.7;
      const goal = { x: tp.x + Math.sin(a) * 2.4, y: tp.y, z: tp.z + Math.cos(a) * 2.4 };
      pathTo(game, n, goal, dt, d > 8 ? n.def.speed : n.def.speed * 0.7, 1.2);
    } else idleLook(game, n, dt);
  }

  function chooseTactic(game, n, ep, dist, wpn, visible) {
    const w = game.world;
    const pl = game.player;
    const anchor = n.follow && n.team !== 'combine' ? pl.pos : n.hold || (n.opts.stay ? n.pos : null);
    const lowHp = n.hp < n.maxHp * 0.45;
    const r = game.rng();
    let want;
    if ((lowHp && r < 0.6) || (!visible && r < 0.2)) want = 'cover';
    else if (dist > wpn.range * 0.75) want = 'advance';
    else if (dist < 4.5 && wpn.range > 10) want = 'retreat';
    else want = r < 0.45 ? 'strafe' : 'stay';
    if (n.opts.stay && want !== 'cover') want = 'stay';
    if (want === 'stay') return null;
    const cands = [];
    for (let k = 0; k < 14; k++) {
      const a = game.rng() * Math.PI * 2, rr = 2 + game.rng() * (want === 'cover' ? 9 : 6);
      const base = anchor && H.distXZ(anchor, n.pos) > 8 ? anchor : n.pos;
      const p = { x: base.x + Math.sin(a) * rr, y: n.pos.y, z: base.z + Math.cos(a) * rr };
      const node = w.navNode(p, 1.5);
      if (!node || node.deep || node.hurt) continue;
      const np = { x: node.x, y: node.y, z: node.z };
      if (anchor && H.distXZ(np, anchor) > 9) continue;
      const de = H.dist(np, ep);
      const eyeP = { x: np.x, y: np.y + 1.5, z: np.z };
      const ec = { x: ep.x, y: ep.y + 1.3, z: ep.z };
      let score = 0;
      if (want === 'cover') score = (w.lineClear(eyeP, ec) ? -10 : 10) - H.distXZ(np, n.pos) * 0.3;
      else if (want === 'advance') score = (dist - de) + (w.lineClear(eyeP, ec) ? 3 : -3);
      else if (want === 'retreat') score = de - dist + (w.lineClear(eyeP, ec) ? 2 : 0);
      else score = (w.lineClear(eyeP, ec) ? 5 : -5) - Math.abs(de - wpn.range * 0.5) * 0.2;
      cands.push({ np, score });
    }
    if (!cands.length) return null;
    cands.sort((a, b) => b.score - a.score);
    return cands[0].np;
  }

  function aimAndShoot(game, n, wpn, dt, moving) {
    const t = n.enemy;
    const c = chest(t);
    if (!moving || !n.script) faceTo(n, c, dt, 8);
    const e = eyeOf(n);
    n.aim = Math.atan2(c.y - e.y, Math.hypot(c.x - e.x, c.z - e.z));
    const fwd = H.forward(n.yaw);
    const dir = H.vnorm(H.vsub(c, e));
    if (fwd.x * dir.x + fwd.z * dir.z < 0.85) return;
    n.wcd -= dt;
    if (n.wcd > 0) return;
    if (H.dist(e, c) > wpn.range) { n.wcd = 0.3; return; }
    if (n.team !== 'combine') {
      const h = game.traceLine(e, dir, H.dist(e, c), { ignore: n, player: true });
      if (h && (h.kind === 'player' || (h.kind === 'npc' && !H.hostile(n.team, h.ent.team)))) { n.wcd = 0.25; n.tacT = 0; return; }
    }
    if (n.balls > 0 && game.rng() < 0.08 && H.dist(e, c) > 6) {
      n.balls--;
      n.wcd = 1.5;
      game.emit({ type: 'sound', name: 'ar2_ball', pos: n.pos });
      game.launchBall(H.vadd(e, dir, 0.6), H.vscale(dir, 16), n);
      return;
    }
    fireNpcWeapon(game, n, wpn, t, e, dir);
  }

  function fireNpcWeapon(game, n, wpn, t, e, dir) {
    if (wpn.zap) {
      n.wcd = wpn.rate;
      game.fx.beam(H.vadd(e, dir, 0.3), chest(t), [0.4, 1, 0.5], 0.1, 0.3);
      game.emit({ type: 'sound', name: 'vort_zap', pos: n.pos });
      if (t.kind === 'player') game.damagePlayer(wpn.dmg, { type: 'shock', attacker: n, dir });
      else game.damageNpc(t, wpn.dmg, { type: 'shock', attacker: n, dir, pos: chest(t) });
      return;
    }
    if (wpn.rocket) {
      n.wcd = wpn.rate * (0.8 + game.rng() * 0.5);
      const pos = H.vadd(e, dir, 0.8);
      game.projectiles.push({ kind: 'rocket', pos, dir: H.vnorm(H.vsub(chest(t), pos)), speed: 14, owner: n, t: 0, guided: false, target: t.kind === 'player' ? null : t });
      game.emit({ type: 'sound', name: 'rpg', pos });
      return;
    }
    if (n.burst <= 0) n.burst = wpn.burst || 1;
    n.burst--;
    n.wcd = n.burst > 0 ? wpn.rate : (wpn.pause || wpn.rate) * (0.7 + game.rng() * 0.6);
    const settle = Math.max(0, 1.6 - (game.time - n.acquiredT));
    const moving = t.kind === 'player' ? Math.hypot(t.vel.x, t.vel.z) > 4 : false;
    const spread = wpn.spread * (1 + settle * 1.4) * (moving ? 1.3 : 1) * (game.skillIndex === 0 ? 1.4 : game.skillIndex === 2 ? 0.85 : 1);
    const muzzle = H.vadd(H.vadd(e, dir, 0.55), { x: 0, y: -0.25, z: 0 });
    game.fx.muzzle(muzzle, n.weapon === 'npcar2' || n.weapon === 'turretgun' ? [0.5, 0.8, 1] : [1, 0.8, 0.4], 0.28);
    game.addDynLight(muzzle, [1, 0.8, 0.5], 4, 0.05);
    game.emit({ type: 'sound', name: wpn.sound || 'smg', pos: n.pos, vol: 0.8 });
    game.noise(n.pos, 30, n);
    const pellets = wpn.pellets || 1;
    for (let k = 0; k < pellets; k++) game.fireBullet(muzzle, dir, spread, wpn.dmg, n, n.weapon, null, wpn.range + 10);
    n.act = 'fire'; n.actT = 0.12;
  }

  function hitTarget(game, n, t, dmg, type) {
    const dir = H.vnorm(H.vsub(targetPos(t), n.pos));
    if (t.kind === 'player') {
      game.damagePlayer(dmg, { type, attacker: n, dir });
      t.vel.x += dir.x * 3; t.vel.z += dir.z * 3;
      t.punch += 0.05;
    } else game.damageNpc(t, dmg, { type, attacker: n, dir, pos: chest(t) });
  }

  function throwGrenadeAt(game, n, target) {
    const e = eyeOf(n);
    const dx = target.x - e.x, dz = target.z - e.z;
    const d = Math.hypot(dx, dz);
    const t = Math.max(0.6, d / 12);
    const vy = (target.y - e.y) / t + 0.5 * H.GRAVITY * t;
    game.projectiles.push({ kind: 'grenade', pos: H.vcopy(e), vel: { x: dx / t, y: vy, z: dz / t }, owner: n, t: 0, fuse: 2.8 });
    game.bark('combine', n.def.model === 'metrocop' ? 'metrocop' : 'soldier', pick(game, LINES.grenade), 3);
    n.act = 'throw'; n.actT = 0.6;
  }

  function civilian(game, n, dt) {
    if (n.script) { runScriptMove(game, n, dt); return; }
    let danger = null;
    for (const m of game.npcs) {
      if (!m.alive || m.team === 'neutral' || m.team === 'rebel') continue;
      if (m.state === 'combat' && H.dist(m.pos, n.pos) < 12) { danger = m; break; }
    }
    if (danger && !n.opts.stay) {
      const away = H.vnorm(H.vsub(n.pos, danger.pos));
      const goal = { x: n.pos.x + away.x * 6, y: n.pos.y, z: n.pos.z + away.z * 6 };
      pathTo(game, n, goal, dt, n.def.speed, 1);
      n.crouch = false;
      return;
    }
    if (n.hold && H.distXZ(n.pos, n.hold) > 1) { pathTo(game, n, n.hold, dt, n.def.speed * 0.6, 0.6); return; }
    if (n.patrol) {
      const pts = game.world.paths[n.patrol];
      if (pts && pts.length) {
        const p = pts[n.patrolI % pts.length];
        if (pathTo(game, n, { x: p.x, y: p.y !== null ? p.y : n.pos.y, z: p.z }, dt, n.def.speed * 0.4, 0.9)) n.patrolI++;
        return;
      }
    }
    idleLook(game, n, dt);
  }

  function story(game, n, dt) {
    if (n.script) { runScriptMove(game, n, dt); return; }
    if (n.hold && H.distXZ(n.pos, n.hold) > 1) { pathTo(game, n, n.hold, dt, n.def.speed * 0.6, 0.6); return; }
    if (n.follow) { followPlayer(game, n, dt); return; }
    idleLook(game, n, dt);
  }

  function dog(game, n, dt) {
    const f = n.fetch;
    if (f) {
      const ball = game.props.find(q => !q.dead && q.type === 'ball');
      if (!ball) { n.fetch = null; return; }
      if (f.state === 'wait') {
        idleLook(game, n, dt);
        if (!ball.held && H.vlen(ball.vel) > 3 && ball.thrownBy === 'player') f.state = 'chase';
        else if (!ball.held && H.dist(ball.pos, game.player.pos) > 6 && H.dist(ball.pos, n.pos) > 3) f.state = 'chase';
        return;
      }
      if (f.state === 'chase') {
        if (ball.held) { f.state = 'wait'; return; }
        if (pathTo(game, n, ball.pos, dt, n.def.speed, 1.6)) { f.state = 'carry'; ball.frozen = true; game.flags.dogFetches = (game.flags.dogFetches || 0) + 1; game.emit({ type: 'sound', name: 'dog_happy', pos: n.pos }); }
        return;
      }
      if (f.state === 'carry') {
        const fw = H.forward(n.yaw);
        ball.pos = { x: n.pos.x + fw.x * 1.1, y: n.pos.y + 1.9, z: n.pos.z + fw.z * 1.1 };
        ball.vel = { x: 0, y: 0, z: 0 };
        const pl = game.player;
        if (pathTo(game, n, pl.pos, dt, n.def.speed * 0.8, 4)) {
          faceTo(n, pl.pos, dt, 6);
          const dir = H.vnorm(H.vsub({ x: pl.pos.x, y: pl.pos.y + 1.5, z: pl.pos.z }, ball.pos));
          ball.frozen = false;
          ball.sleeping = false;
          ball.vel = { x: dir.x * 6, y: dir.y * 6 + 3, z: dir.z * 6 };
          ball.thrownBy = 'dog';
          ball.thrownT = game.time;
          f.state = 'wait';
          n.act = 'throw'; n.actT = 0.6;
        }
        return;
      }
    }
    story(game, n, dt);
  }

  function crab(game, n, dt) {
    n.leapCd -= dt;
    if (n.leaping) {
      n.vel.y -= H.GRAVITY * dt;
      const res = game.world.moveBox(n.pos, n.def.radius, n.def.height, { x: n.vel.x * dt, y: n.vel.y * dt, z: n.vel.z * dt }, { extra: game.obstaclesFor(n) });
      if (n.enemy && !n.bit) {
        const b = n.enemy.kind === 'player' ? game.playerBox() : game.npcBox(n.enemy);
        if (n.pos.x + 0.3 > b.x1 && n.pos.x - 0.3 < b.x2 && n.pos.z + 0.3 > b.z1 && n.pos.z - 0.3 < b.z2 && n.pos.y + 0.3 > b.y1 && n.pos.y < b.y2) {
          n.bit = true;
          game.emit({ type: 'sound', name: 'crab_bite', pos: n.pos });
          if (n.def.poison && n.enemy.kind === 'player') game.damagePlayer(Math.max(1, game.player.hp - 1) + 10, { type: 'poison', attacker: n });
          else hitTarget(game, n, n.enemy, n.def.bite || 5, 'bite');
          n.vel.x *= -0.3; n.vel.z *= -0.3;
        }
      }
      if (res.onGround || res.hitX || res.hitZ) { if (res.onGround) { n.leaping = false; n.vel.x = n.vel.z = 0; } else { n.vel.x *= -0.3; n.vel.z *= -0.3; } }
      return;
    }
    if (!n.enemy) { if (n.investigate) pathTo(game, n, n.investigate, dt, n.def.speed * 0.5, 1); else stand(game, n, dt); return; }
    const tp = targetPos(n.enemy);
    const d = H.dist(n.pos, tp);
    if (d < n.def.leap && d > 0.8 && n.leapCd <= 0 && n.onGround && canSee(game, n, n.enemy)) {
      faceTo(n, tp, 1, 99);
      const c = chest(n.enemy);
      const t = Math.max(0.35, d / 7.5);
      n.vel = { x: (c.x - n.pos.x) / t, y: (c.y - 0.3 - n.pos.y) / t + 0.5 * H.GRAVITY * t, z: (c.z - n.pos.z) / t };
      n.leaping = true;
      n.bit = false;
      n.onGround = false;
      n.leapCd = n.type === 'fastcrab' ? 1.1 : n.type === 'poisoncrab' ? 2.6 : 1.8;
      game.emit({ type: 'sound', name: 'crab_leap', pos: n.pos });
      return;
    }
    pathTo(game, n, tp, dt, n.def.speed, 1.2);
  }

  function zombie(game, n, dt) {
    n.moanT = (n.moanT || 3 + game.rng() * 6) - dt;
    if (n.moanT <= 0) { n.moanT = 5 + game.rng() * 8; game.emit({ type: 'sound', name: n.type === 'fastzombie' ? 'fastzombie_moan' : 'zombie_moan', pos: n.pos, vol: 0.6 }); }
    if (n.leaping) {
      n.vel.y -= H.GRAVITY * dt;
      const res = game.world.moveBox(n.pos, n.def.radius || 0.34, n.def.height, { x: n.vel.x * dt, y: n.vel.y * dt, z: n.vel.z * dt }, { extra: game.obstaclesFor(n, { player: true }) });
      if (n.enemy && !n.bit && H.dist(n.pos, targetPos(n.enemy)) < 1.3) { n.bit = true; hitTarget(game, n, n.enemy, 7, 'slash'); }
      if (res.onGround || res.hitX || res.hitZ) { n.leaping = false; n.vel.x = n.vel.z = 0; }
      return;
    }
    if (n.windup > 0) {
      n.windup -= dt;
      stand(game, n, dt);
      if (n.enemy) faceTo(n, targetPos(n.enemy), dt, 5);
      if (n.windup <= 0 && n.enemy && H.dist(n.pos, targetPos(n.enemy)) < 1.9) {
        hitTarget(game, n, n.enemy, n.def.melee, 'slash');
        game.emit({ type: 'sound', name: 'zombie_hit', pos: n.pos });
      }
      return;
    }
    if (!n.enemy) {
      if (n.investigate) { if (pathTo(game, n, n.investigate, dt, n.def.speed * 0.6, 1.5)) n.investigate = null; }
      else stand(game, n, dt);
      return;
    }
    const tp = targetPos(n.enemy);
    const d = H.dist(n.pos, tp);
    n.meleeT -= dt;
    n.throwT = (n.throwT || 2) - dt;
    if (d < 1.6) {
      stand(game, n, dt);
      faceTo(n, tp, dt, 6);
      if (n.meleeT <= 0) { n.meleeT = n.def.meleeRate; n.windup = n.type === 'fastzombie' ? 0.1 : 0.55; n.act = 'swing'; n.actT = 0.7; }
      return;
    }
    if (n.type === 'fastzombie' && d > 3.5 && d < 10 && n.onGround && game.time > (n.leapT || 0) && canSee(game, n, n.enemy)) {
      n.leapT = game.time + 3;
      const t = Math.max(0.4, d / 11);
      const c = chest(n.enemy);
      n.vel = { x: (c.x - n.pos.x) / t, y: (c.y - 1 - n.pos.y) / t + 0.5 * H.GRAVITY * t, z: (c.z - n.pos.z) / t };
      n.leaping = true; n.bit = false; n.onGround = false;
      game.emit({ type: 'sound', name: 'fastzombie_leap', pos: n.pos });
      return;
    }
    if (n.type === 'poisonzombie' && n.crabs === undefined) n.crabs = n.def.throwsCrabs;
    if (n.type === 'poisonzombie' && n.crabs > 0 && d > 4 && d < 15 && n.throwT <= 0 && canSee(game, n, n.enemy)) {
      n.throwT = 5;
      n.crabs--;
      const e = eyeOf(n);
      const c = make(game, 'poisoncrab', e.x, e.y, e.z, { hate: true });
      const t = Math.max(0.5, d / 9);
      const tc = chest(n.enemy);
      c.vel = { x: (tc.x - e.x) / t, y: (tc.y - e.y) / t + 0.5 * H.GRAVITY * t, z: (tc.z - e.z) / t };
      c.leaping = true; c.bit = false; c.leapCd = 2;
      n.act = 'throw'; n.actT = 0.8;
      game.emit({ type: 'sound', name: 'zombie_throw', pos: n.pos });
      return;
    }
    if (n.def.throws && d > 4 && d < 14 && n.throwT <= 0) {
      n.throwT = 2.5;
      const prop = game.props.find(q => !q.dead && !q.held && !q.frozen && q.mass > 3 && q.mass < 70 && H.distXZ(q.pos, n.pos) < 2.2);
      if (prop && canSee(game, n, n.enemy)) {
        const c = chest(n.enemy);
        const t = Math.max(0.5, d / 13);
        prop.vel = { x: (c.x - prop.pos.x) / t, y: (c.y - prop.pos.y) / t + 0.5 * H.GRAVITY * t, z: (c.z - prop.pos.z) / t };
        prop.sleeping = false; prop.thrownBy = 'npc'; prop.thrownT = game.time;
        n.act = 'throw'; n.actT = 0.8;
        game.emit({ type: 'sound', name: 'zombie_throw', pos: n.pos });
        return;
      }
    }
    pathTo(game, n, tp, dt, n.def.speed, 1.2);
  }

  function antlion(game, n, dt) {
    const pl = game.player;
    if (n.team === 'pet') {
      if (n.baitT > 0) n.baitT -= dt;
      if (n.baitT <= 0 && n.bait) { n.bait = null; n.follow = true; }
    }
    if (n.jumping) {
      n.vel.y -= H.GRAVITY * dt;
      const res = game.world.moveBox(n.pos, n.def.radius, n.def.height, { x: n.vel.x * dt, y: n.vel.y * dt, z: n.vel.z * dt }, { extra: game.obstaclesFor(n) });
      n.yaw = Math.atan2(n.vel.x, n.vel.z);
      if (res.onGround) { n.jumping = false; n.vel.x = n.vel.z = 0; }
      return;
    }
    let t = n.enemy;
    if (n.team === 'pet' && t && n.bait && H.dist(targetPos(t), n.bait) > 14) t = null;
    if (t) {
      const tp = targetPos(t);
      const d = H.dist(n.pos, tp);
      n.meleeT -= dt;
      if (d < 1.9) {
        stand(game, n, dt);
        faceTo(n, tp, dt, 8);
        if (n.meleeT <= 0) {
          n.meleeT = n.def.meleeRate;
          n.act = 'swing'; n.actT = 0.4;
          hitTarget(game, n, t, n.def.melee, 'slash');
          game.emit({ type: 'sound', name: 'antlion_hit', pos: n.pos });
        }
        return;
      }
      if (d > 9 && d < 22 && n.onGround && game.rng() < dt * 0.4 && canSee(game, n, t)) { hop(game, n, tp, Math.min(d - 3, 12)); return; }
      if (n.blocked > 0.6 && n.onGround) { hop(game, n, tp, 5); n.blocked = 0; return; }
      pathTo(game, n, tp, dt, n.def.speed, 1.4);
      return;
    }
    if (n.team === 'pet') {
      if (n.bait) { pathTo(game, n, n.bait, dt, n.def.speed, 2.5); return; }
      if (n.follow) {
        const d = H.dist(n.pos, pl.pos);
        if (d > 5) pathTo(game, n, pl.pos, dt, n.def.speed * (d > 12 ? 1 : 0.6), 3);
        else stand(game, n, dt);
        return;
      }
    }
    if (n.investigate) { if (pathTo(game, n, n.investigate, dt, n.def.speed * 0.6, 2)) n.investigate = null; return; }
    stand(game, n, dt);
  }

  function hop(game, n, tp, dist) {
    const dx = tp.x - n.pos.x, dz = tp.z - n.pos.z;
    const l = Math.hypot(dx, dz) || 1;
    const t = 0.9;
    n.vel = { x: dx / l * dist / t, y: 0.5 * H.GRAVITY * t + (tp.y - n.pos.y) / t, z: dz / l * dist / t };
    n.jumping = true;
    n.onGround = false;
    game.emit({ type: 'sound', name: 'antlion_fly', pos: n.pos });
  }

  function guard(game, n, dt) {
    const pl = game.player;
    if (n.stunT > 0) { n.stunT -= dt; stand(game, n, dt); return; }
    if (n.charging) {
      n.chargeT -= dt;
      const fw = H.forward(n.yaw);
      if (n.enemy) {
        const want = Math.atan2(targetPos(n.enemy).x - n.pos.x, targetPos(n.enemy).z - n.pos.z);
        n.yaw = H.turnTo(n.yaw, want, dt * 0.7);
      }
      const r = n.def.radius;
      n.vel.x = fw.x * 11; n.vel.z = fw.z * 11; n.vel.y -= H.GRAVITY * dt;
      const ext = game.obstaclesFor(n).filter(o => !(o.ref && o.ref.kind === 'prop' && o.ref.mass < 400));
      const res = game.world.moveBox(n.pos, r, n.def.height, { x: n.vel.x * dt, y: n.vel.y * dt, z: n.vel.z * dt }, { step: 0.6, grounded: true, extra: ext });
      n.onGround = res.onGround;
      n.walk += dt * 14;
      for (const q of game.props) {
        if (q.dead || q.held) continue;
        if (H.distXZ(q.pos, n.pos) < r + 0.8 && Math.abs(q.pos.y - n.pos.y) < 2) { H.Phys.wake(q); q.vel = { x: fw.x * 14 + (game.rng() - 0.5) * 4, y: 5, z: fw.z * 14 + (game.rng() - 0.5) * 4 }; q.thrownBy = 'npc'; q.thrownT = game.time; }
      }
      const tb = n.enemy ? (n.enemy.kind === 'player' ? game.playerBox() : game.npcBox(n.enemy)) : null;
      if (tb && H.distXZ(targetPos(n.enemy), n.pos) < r + 0.8) {
        hitTarget(game, n, n.enemy, n.def.charge, 'crush');
        if (n.enemy.kind === 'player') { pl.vel.x += fw.x * 12; pl.vel.y += 5; pl.vel.z += fw.z * 12; pl.onGround = false; }
        n.charging = false;
        n.chargeCd = 3;
        game.emit({ type: 'shake', amount: 0.8, dur: 0.5 });
      } else if (res.hitX || res.hitZ || n.chargeT <= 0) {
        n.charging = false;
        n.chargeCd = 2.5;
        if (res.hitX || res.hitZ) { n.stunT = 1.6; game.emit({ type: 'sound', name: 'guard_impact', pos: n.pos }); game.emit({ type: 'shake', amount: 0.5, dur: 0.4 }); }
      }
      return;
    }
    n.chargeCd -= dt;
    if (!n.enemy) { stand(game, n, dt); return; }
    const tp = targetPos(n.enemy);
    const d = H.dist(n.pos, tp);
    faceTo(n, tp, dt, 2.5);
    const facing = Math.abs(H.wrapAngle(Math.atan2(tp.x - n.pos.x, tp.z - n.pos.z) - n.yaw)) < 0.35;
    if (d < 2.6) {
      stand(game, n, dt);
      n.meleeT -= dt;
      if (n.meleeT <= 0) { n.meleeT = 1.2; n.act = 'swing'; n.actT = 0.5; hitTarget(game, n, n.enemy, 20, 'crush'); game.emit({ type: 'sound', name: 'guard_impact', pos: n.pos }); }
      return;
    }
    if (d > 5 && d < 30 && facing && n.chargeCd <= 0 && canSee(game, n, n.enemy)) {
      n.charging = true;
      n.chargeT = 2.4;
      game.emit({ type: 'sound', name: 'guard_roar', pos: n.pos });
      return;
    }
    pathTo(game, n, tp, dt, 3.2, 2, false);
  }

  function flyTo(game, n, goal, speed, dt, accel = 8) {
    const d = H.vsub(goal, n.pos);
    const l = H.vlen(d);
    const want = l > 0.2 ? H.vscale(d, Math.min(speed, l * 2) / l) : { x: 0, y: 0, z: 0 };
    n.vel.x = H.approach(n.vel.x, want.x, accel * dt);
    n.vel.y = H.approach(n.vel.y, want.y, accel * dt);
    n.vel.z = H.approach(n.vel.z, want.z, accel * dt);
    const r = n.def.radius || 0.3;
    if (n.cat === 'air') {
      n.pos.x += n.vel.x * dt; n.pos.y += n.vel.y * dt; n.pos.z += n.vel.z * dt;
      const g = game.world.surfaceAt(n.pos.x, n.pos.z, 400, 0);
      if (n.pos.y < g + 5) { n.pos.y = g + 5; n.vel.y = Math.max(0, n.vel.y); }
      return {};
    }
    const res = game.world.moveBox(n.pos, r, n.def.height, { x: n.vel.x * dt, y: n.vel.y * dt, z: n.vel.z * dt }, { extra: game.obstaclesFor(n) });
    if (res.hitX) n.vel.x *= -0.6;
    if (res.hitZ) n.vel.z *= -0.6;
    if (res.hitY) n.vel.y *= -0.6;
    return res;
  }

  function manhack(game, n, dt) {
    n.spinT = (n.spinT || 0) + dt;
    if (n.thrown) {
      n.vel.y -= H.GRAVITY * 0.3 * dt;
      const res = game.world.moveBox(n.pos, 0.3, 0.3, { x: n.vel.x * dt, y: n.vel.y * dt, z: n.vel.z * dt }, { extra: game.obstaclesFor(n) });
      heldManhackHits(game, n);
      if (res.hitX || res.hitZ || res.hitY) { game.killNpc(n, { type: 'crush' }); game.fx.spark(n.pos, 14); game.emit({ type: 'sound', name: 'manhack_die', pos: n.pos }); }
      return;
    }
    n.touchCd = (n.touchCd || 0) - dt;
    if (!n.enemy) {
      const g = game.world.surfaceAt(n.pos.x, n.pos.z, n.pos.y, 0);
      const goal = n.investigate || { x: n.pos.x + Math.sin(n.spinT) * 0.5, y: g + n.alt, z: n.pos.z + Math.cos(n.spinT) * 0.5 };
      flyTo(game, n, { x: goal.x, y: g + n.alt, z: goal.z }, 3, dt, 6);
      return;
    }
    const c = chest(n.enemy);
    const jitter = { x: Math.sin(n.spinT * 7) * 0.6, y: Math.sin(n.spinT * 5) * 0.3, z: Math.cos(n.spinT * 6) * 0.6 };
    const goal = H.vadd(c, jitter);
    if (n.touchCd > 0.15) {
      const away = H.vnorm(H.vsub(n.pos, c));
      flyTo(game, n, H.vadd(c, away, 3), n.def.speed, dt, 20);
      return;
    }
    const d = H.dist(n.pos, c);
    const dir = H.vnorm(H.vsub(goal, n.pos));
    const r = game.world.raycast(n.pos, dir, Math.min(2, d));
    if (r) flyTo(game, n, H.vadd(n.pos, { x: -dir.z + dir.x * 0.2, y: 1.2, z: dir.x + dir.z * 0.2 }, 2), n.def.speed * 0.6, dt, 16);
    else flyTo(game, n, goal, n.def.speed, dt, 14);
    if (d < 0.9 && n.touchCd <= 0) {
      n.touchCd = 0.45;
      hitTarget(game, n, n.enemy, n.def.touch, 'slash');
      game.emit({ type: 'sound', name: 'manhack_cut', pos: n.pos });
      game.fx.spark(n.pos, 6);
    }
  }

  function heldManhackHits(game, n) {
    for (const m of game.npcs) {
      if (m === n || !m.alive || m.team === 'player' || m.team === 'rebel') continue;
      if (H.dist(chest(m), n.pos) < (m.def.radius || 0.34) + 0.6 && game.time - (m.cutT || -9) > 0.3) {
        m.cutT = game.time;
        game.damageNpc(m, 15, { type: 'slash', attacker: game.player, pos: H.vcopy(n.pos), dir: { x: 0, y: 0, z: 0 } });
        game.emit({ type: 'sound', name: 'manhack_cut', pos: n.pos });
      }
    }
  }

  function scanner(game, n, dt) {
    const pl = game.player;
    n.orbit += dt * 0.35;
    n.flashT -= dt;
    const base = n.enemy ? targetPos(n.enemy) : n.hover || n.pos;
    const g = game.world.surfaceAt(base.x, base.z, base.y + 2, 0);
    const goal = { x: base.x + Math.sin(n.orbit) * 5, y: Math.max(g, base.y) + 3, z: base.z + Math.cos(n.orbit) * 5 };
    if (!n.enemy && !n.hover) n.hover = H.vcopy(n.pos);
    flyTo(game, n, goal, n.def.speed, dt, 3);
    if (n.enemy) faceTo(n, targetPos(n.enemy), dt, 3);
    if (n.enemy === pl && n.flashT <= 0 && H.dist(n.pos, pl.pos) < 11) {
      n.flashT = 7 + game.rng() * 4;
      game.emit({ type: 'sound', name: 'scanner_photo', pos: n.pos });
      const v = H.vnorm(H.vsub(n.pos, game.eye()));
      if (H.vdot(v, game.aimDir()) > 0.7) { game.emit({ type: 'flash', col: [1, 1, 1], dur: 0.9 }); pl.blind = 1; }
      game.addDynLight(n.pos, [2, 2, 2], 10, 0.15);
    }
  }

  function barnacle(game, n, dt) {
    const pl = game.player;
    n.chewT = (n.chewT || 0) - dt;
    if (pl.grabbed === n) {
      const top = n.pos.y - 0.35 - pl.height;
      if (pl.pos.y < top) { pl.pos.y = Math.min(top, pl.pos.y + 1.3 * dt); pl.pos.x = H.lerp(pl.pos.x, n.pos.x, dt * 4); pl.pos.z = H.lerp(pl.pos.z, n.pos.z, dt * 4); }
      else if (n.chewT <= 0) { n.chewT = 0.9; game.damagePlayer(9, { type: 'bite', attacker: n }); game.emit({ type: 'sound', name: 'barnacle_bite', pos: n.pos }); }
      n.tongueLen = n.pos.y - (pl.pos.y + pl.height);
      return;
    }
    n.tongueLen = n.tongue;
    if (pl.dead || pl.vehicle || pl.grabbed || n.releaseT > game.time) return;
    if (H.distXZ(pl.pos, n.pos) < 0.5 && pl.pos.y + pl.height > n.pos.y - n.tongue - 0.1 && pl.pos.y < n.pos.y) {
      pl.grabbed = n;
      pl.vel = { x: 0, y: 0, z: 0 };
      game.emit({ type: 'sound', name: 'barnacle_grab', pos: n.pos });
    }
  }

  function turret(game, n, dt) {
    if (n.tipped) {
      n.tipT = (n.tipT || 2.2) - dt;
      n.wcd -= dt;
      if (n.wcd <= 0 && n.tipT > 0) {
        n.wcd = 0.08;
        const dir = H.forward(n.yaw + (game.rng() - 0.5) * 2, (game.rng() - 0.5) * 0.8);
        game.fireBullet(eyeOf(n), dir, 0.05, 3, n, 'turretgun', null, 25);
        game.emit({ type: 'sound', name: 'smg', pos: n.pos, vol: 0.6 });
      }
      if (n.tipT <= 0) { game.killNpc(n, { type: 'shock' }); game.fx.spark(n.pos, 16); game.emit({ type: 'sound', name: 'turret_die', pos: n.pos }); }
      return;
    }
    const base = n.opts.base;
    if (!n.onGround || Math.abs(n.vel.y) > 0.01) {
      n.vel.y -= H.GRAVITY * dt;
      const res = game.world.moveBox(n.pos, n.def.radius, n.def.height, { x: n.vel.x * dt, y: n.vel.y * dt, z: n.vel.z * dt }, { extra: game.obstaclesFor(n) });
      n.onGround = res.onGround;
      if (res.onGround) { n.vel = { x: 0, y: 0, z: 0 }; }
    }
    if (!n.enemy || n.passive) {
      n.scan = (n.scan || 0) + dt;
      n.yaw = base + Math.sin(n.scan * 0.8) * 0.7;
      return;
    }
    const tp = targetPos(n.enemy);
    const a = Math.atan2(tp.x - n.pos.x, tp.z - n.pos.z);
    if (Math.abs(H.wrapAngle(a - base)) > 1.1) { n.enemy = null; return; }
    n.yaw = H.turnTo(n.yaw, a, dt * 5);
    if (game.time - n.lastSeenT < 0.3) aimAndShoot(game, n, H.NPC_WEAPONS.turretgun, dt, false);
  }

  function tipTurret(game, n, dir) {
    if (n.tipped) return;
    n.tipped = true;
    n.tipDir = dir;
    game.emit({ type: 'sound', name: 'turret_tip', pos: n.pos });
  }

  function roller(game, n, dt) {
    n.roll = (n.roll || 0) + dt * n.speedNow * 3;
    const wl = game.world.waterAt(n.pos.x, n.pos.z);
    if (wl > n.pos.y + 0.3) { game.killNpc(n, { type: 'shock' }); game.fx.spark(n.pos, 20, [0.5, 0.8, 1]); game.emit({ type: 'sound', name: 'roller_die', pos: n.pos }); return; }
    if (n.airborne) {
      n.vel.y -= H.GRAVITY * dt;
      const res = game.world.moveBox(n.pos, 0.32, 0.6, { x: n.vel.x * dt, y: n.vel.y * dt, z: n.vel.z * dt }, { extra: game.obstaclesFor(n) });
      if (res.hitX) n.vel.x *= -0.5;
      if (res.hitZ) n.vel.z *= -0.5;
      if (res.onGround) { n.airborne = false; n.onGround = true; n.vel.y = 0; }
      return;
    }
    n.shockCd = (n.shockCd || 0) - dt;
    if (!n.enemy) { stand(game, n, dt); return; }
    const tp = targetPos(n.enemy);
    const d = H.dist(n.pos, tp);
    if (d < 1.5 && n.shockCd <= 0) {
      n.shockCd = 1.3;
      hitTarget(game, n, n.enemy, n.def.shock, 'shock');
      game.fx.spark(n.pos, 10, [0.5, 0.8, 1]);
      game.emit({ type: 'sound', name: 'roller_shock', pos: n.pos });
      n.vel.y = 4; n.airborne = true;
      const away = H.vnorm(H.vsub(n.pos, tp));
      n.vel.x = away.x * 4; n.vel.z = away.z * 4;
      return;
    }
    if (d < 10) moveGround(game, n, (tp.x - n.pos.x) / d, (tp.z - n.pos.z) / d, n.def.speed, dt);
    else pathTo(game, n, tp, dt, n.def.speed, 1);
  }

  function air(game, n, dt) {
    const pl = game.player;
    n.fireCd = (n.fireCd || 1) - dt;
    if (n.crashing) {
      n.vel.y -= H.GRAVITY * 0.6 * dt;
      n.yaw += dt * 4;
      n.pos.x += n.vel.x * dt; n.pos.y += n.vel.y * dt; n.pos.z += n.vel.z * dt;
      if (game.rng() < 0.6) game.fx.smoke(n.pos, 1, [0.15, 0.15, 0.15], 1.2);
      const g = game.world.surfaceAt(n.pos.x, n.pos.z, n.pos.y + 1, 0);
      const wl = game.world.waterAt(n.pos.x, n.pos.z);
      if (n.pos.y <= Math.max(g, wl) + 0.5) {
        H.Phys.explode(game, n.pos, 60, 9, null);
        game.fx.explosion(H.vadd(n.pos, { x: 2, y: 1, z: 0 }), 8);
        n.crashing = false;
        n.alive = false;
        n.deadT = game.time;
        n.crashed = true;
      }
      return;
    }
    let goal = null;
    const pathPts = n.script && n.script.path ? game.world.paths[n.script.path] : n.opts.airPath ? game.world.paths[n.opts.airPath] : null;
    if (n.script && n.script.goto) goal = { x: n.script.goto.x, y: n.script.goto.y !== null ? n.script.goto.y : n.pos.y, z: n.script.goto.z };
    else if (pathPts) {
      if (n.airI === undefined) n.airI = 0;
      const p = pathPts[n.airI % pathPts.length];
      goal = { x: p.x, y: p.y !== null ? p.y : game.world.surfaceAt(p.x, p.z, 300, 0) + n.alt, z: p.z };
      if (H.dist(goal, n.pos) < 5) {
        n.airI++;
        if (n.script && n.script.path && n.airI >= pathPts.length && !n.script.loop) { n.script = null; n.airI = 0; n.hover = H.vcopy(n.pos); }
      }
    } else if (n.enemy) {
      const tp = targetPos(n.enemy);
      n.orbit += dt * 0.25;
      const rr = n.type === 'gunship' ? 22 : 26;
      goal = { x: tp.x + Math.sin(n.orbit) * rr, y: Math.max(tp.y, game.world.surfaceAt(tp.x, tp.z, 300, 0)) + n.alt, z: tp.z + Math.cos(n.orbit) * rr };
    } else { if (!n.hover) n.hover = H.vcopy(n.pos); goal = n.hover; }
    if (goal) flyTo(game, n, goal, n.def.speed, dt, 7);
    if (n.enemy) faceTo(n, targetPos(n.enemy), dt, 1.5);
    else if (Math.hypot(n.vel.x, n.vel.z) > 1) n.yaw = H.turnTo(n.yaw, Math.atan2(n.vel.x, n.vel.z), dt * 1.5);
    const visible = n.enemy && game.time - n.lastSeenT < 0.4;
    if (visible && !n.passive) {
      const wpn = H.NPC_WEAPONS[n.weapon];
      const e = { x: n.pos.x, y: n.pos.y - 0.6, z: n.pos.z };
      const c = chest(n.enemy);
      const dir = H.vnorm(H.vsub(c, e));
      n.wcd -= dt;
      if (n.wcd <= 0 && H.dist(e, c) < wpn.range) {
        if (n.burst <= 0) { n.burst = wpn.burst; if (n.type === 'hunterchopper') game.emit({ type: 'sound', name: 'chopper_warn', pos: n.pos }); }
        fireNpcWeapon(game, n, wpn, n.enemy, e, dir);
      }
      if (n.type === 'hunterchopper' && n.hp < n.maxHp * 0.6) {
        n.dropT -= dt;
        const tp = targetPos(n.enemy);
        if (n.dropT <= 0 && H.distXZ(n.pos, tp) < 14) {
          n.dropT = 2.2;
          game.projectiles.push({ kind: 'bomb', pos: { x: n.pos.x, y: n.pos.y - 1, z: n.pos.z }, vel: { x: n.vel.x * 0.5, y: 0, z: n.vel.z * 0.5 }, owner: n, t: 0 });
          game.emit({ type: 'sound', name: 'bomb_drop', pos: n.pos });
        }
      }
    }
  }

  function strider(game, n, dt) {
    n.cannonT -= dt;
    const legH = 8.5;
    const gs = game.world.surfaceAt(n.pos.x, n.pos.z, n.pos.y + 14, 1.5);
    const g = gs > -1e6 ? gs : n.pos.y;
    let goal = null;
    const pts = n.script && n.script.path ? game.world.paths[n.script.path] : n.patrol ? game.world.paths[n.patrol] : null;
    if (n.script && n.script.goto) goal = n.script.goto;
    else if (pts) {
      if (n.stI === undefined) n.stI = 0;
      const p = pts[n.stI % pts.length];
      goal = p;
      if (H.distXZ(p, n.pos) < 2) {
        n.stI++;
        if (n.script && n.script.path && n.stI >= pts.length && !n.script.loop) { n.script = null; n.stI = 0; }
      }
    }
    if (goal) {
      const d = H.distXZ(goal, n.pos);
      if (d > 1) {
        const sp = n.def.speed;
        n.pos.x += (goal.x - n.pos.x) / d * sp * dt;
        n.pos.z += (goal.z - n.pos.z) / d * sp * dt;
        n.walk += dt * 2.2;
        if (!n.enemy) n.yaw = H.turnTo(n.yaw, Math.atan2(goal.x - n.pos.x, goal.z - n.pos.z), dt);
      }
    }
    n.pos.y = H.lerp(n.pos.y, g, Math.min(1, dt * 3));
    n.bodyY = n.pos.y + legH;
    if (!n.enemy || n.passive) return;
    const tp = targetPos(n.enemy);
    faceTo(n, tp, dt, 1.2);
    if (n.cannonCharge > 0) {
      n.cannonCharge -= dt;
      if (n.cannonCharge <= 0) {
        const tgt = n.cannonTarget;
        game.fx.beam({ x: n.pos.x, y: n.bodyY - 0.5, z: n.pos.z }, tgt, [0.6, 0.9, 1.4], 0.4, 0.5);
        H.Phys.explode(game, tgt, 140, 6.5, n);
        game.emit({ type: 'sound', name: 'strider_cannon', pos: tgt });
      }
      return;
    }
    const visible = game.time - n.lastSeenT < 0.4;
    if (!visible) return;
    if (n.cannonT <= 0 && H.dist(n.pos, tp) < 60) {
      n.cannonT = 11 + game.rng() * 5;
      n.cannonCharge = 1.8;
      n.cannonTarget = H.vcopy(tp);
      game.emit({ type: 'sound', name: 'strider_charge', pos: n.pos });
      return;
    }
    const e = { x: n.pos.x, y: n.bodyY - 0.4, z: n.pos.z };
    const c = chest(n.enemy);
    const dir = H.vnorm(H.vsub(c, e));
    n.wcd -= dt;
    if (n.wcd <= 0) fireNpcWeapon(game, n, H.NPC_WEAPONS.stridergun, n.enemy, e, dir);
  }

  function apc(game, n, dt) {
    const pts = n.patrol ? game.world.paths[n.patrol] : null;
    if (pts && pts.length) {
      if (n.stI === undefined) n.stI = 0;
      const p = pts[n.stI % pts.length];
      if (pathTo(game, n, { x: p.x, y: p.y !== null ? p.y : n.pos.y, z: p.z }, dt, n.def.speed, 2)) n.stI++;
    } else stand(game, n, dt);
    if (n.enemy && game.time - n.lastSeenT < 0.4) {
      const e = { x: n.pos.x, y: n.pos.y + 2.4, z: n.pos.z };
      n.wcd -= dt;
      if (n.wcd <= 0) {
        n.wcd = 4.5 + game.rng() * 2;
        const c = chest(n.enemy);
        game.projectiles.push({ kind: 'rocket', pos: e, dir: H.vnorm(H.vsub({ x: c.x, y: c.y + 3, z: c.z }, e)), speed: 12, owner: n, t: 0, guided: false, target: n.enemy.kind === 'player' ? game.player : n.enemy });
        game.emit({ type: 'sound', name: 'rpg', pos: e });
      }
    }
  }

  function dropship(game, n, dt) {
    const pts = n.script && n.script.path ? game.world.paths[n.script.path] : null;
    if (!pts) { if (n.leaving) { n.pos.y += dt * 8; if (n.pos.y > 80) n.alive = false; } return; }
    if (n.airI === undefined) n.airI = 0;
    const p = pts[n.airI];
    const goal = { x: p.x, y: p.y !== null ? p.y : n.pos.y, z: p.z };
    flyTo(game, n, goal, n.def.speed, dt, 6);
    if (Math.hypot(n.vel.x, n.vel.z) > 1) n.yaw = H.turnTo(n.yaw, Math.atan2(n.vel.x, n.vel.z), dt);
    if (H.dist(goal, n.pos) < 2.5) {
      if (n.dropGroup && n.airI === n.dropAt) { game.spawnGroup(n.dropGroup); n.dropGroup = null; game.emit({ type: 'sound', name: 'dropship_drop', pos: n.pos }); }
      n.airI++;
      if (n.airI >= pts.length) { n.script = null; n.leaving = true; }
    }
  }

  function corpse(game, n, dt) {
    if (n.crashed || n.removed) return;
    const age = game.time - n.deadT;
    if (n.dissolve) n.dissolve = Math.min(1, n.dissolve + dt * 0.6);
    if (n.dissolve >= 1) { n.removed = true; return; }
    if (n.def.flying && !n.crashed) {
      if (n.cat === 'air') { n.crashing = true; n.alive = true; n.hp = 1; n.def = Object.assign({}, n.def, { invulnerable: true }); n.passive = true; n.vel.y = -2; return; }
      n.vel.y -= H.GRAVITY * dt;
    }
    if (age > 30 && !n.def.boss) return;
    if (n.cat === 'strider' || n.cat === 'barnacle') return;
    n.vel = n.vel || { x: 0, y: 0, z: 0 };
    n.vel.y -= H.GRAVITY * dt;
    const r = Math.min(0.3, n.def.radius || 0.3);
    const res = game.world.moveBox(n.pos, r, 0.3, { x: n.vel.x * dt, y: n.vel.y * dt, z: n.vel.z * dt }, {});
    if (res.onGround) { n.vel.x *= 0.85; n.vel.z *= 0.85; n.vel.y = 0; }
    if (res.hitX) n.vel.x = 0;
    if (res.hitZ) n.vel.z = 0;
  }

  function onHurt(game, n, amount, info) {
    const a = info.attacker;
    if (n.sleep) n.sleep = false;
    if (a && a !== n && (a.kind === 'player' || a.kind === 'npc' || a.driver)) {
      const src = a.driver ? a.driver : a;
      if (H.hostile(n.team, src.team) && !n.passive) {
        if (!n.enemy || game.rng() < 0.4) { n.enemy = src; n.acquiredT = Math.min(n.acquiredT, game.time - 1); }
        n.lastSeenT = game.time;
        n.lastSeenPos = H.vcopy(src.kind === 'player' ? targetPos(src) : src.pos);
        n.state = 'combat';
      }
    }
    if (info.type === 'blast' && info.force && !n.def.flying && !n.def.boss && n.def.height < 3) {
      const d = info.dir || { x: 0, y: 0, z: 0 };
      n.vel.x += d.x * info.force; n.vel.z += d.z * info.force; n.vel.y += info.force * 0.4;
      n.knockT = 0.4;
      n.onGround = false;
    }
    if (n.team === 'rebel' && !n.essential && amount > 8 && game.rng() < 0.3) game.bark('rebelhurt', 'rebel', pick(game, LINES.hurt.rebel), 5);
    if (n.cat === 'turret' && info.type === 'blast') tipTurret(game, n, info.dir || { x: 1, y: 0, z: 0 });
    if (n.cat === 'soldier' && !n.essential) n.tacT = Math.min(n.tacT, game.time + 0.3);
    if (n.cat === 'story' || n.cat === 'civ') game.emit({ type: 'sound', name: 'pain_npc', pos: n.pos });
  }

  function onDeath(game, n, info) {
    const pl = game.player;
    n.vel = n.vel || { x: 0, y: 0, z: 0 };
    if (info.dir && !n.def.flying) { n.vel.x += info.dir.x * 2.5; n.vel.z += info.dir.z * 2.5; }
    if (pl.grabbed === n) { pl.grabbed = null; n.releaseT = game.time + 99; }
    if (n.cat === 'zombie' && !n.opts.crabless && info.type !== 'blast' && info.type !== 'energy' && game.rng() < 0.55) {
      const c = make(game, n.def.crab, n.pos.x, n.pos.y + n.def.height - 0.3, n.pos.z, {});
      c.vel = { x: (game.rng() - 0.5) * 2, y: 2, z: (game.rng() - 0.5) * 2 };
      c.leaping = true; c.bit = true;
      n.headless = true;
    }
    if (n.team === 'combine' && n.def.drop && !n.opts.noDrop && n.cat === 'soldier' && game.rng() < 0.65) {
      game.spawnItem(n.def.drop, n.pos.x + 0.3, n.pos.z, { y: n.pos.y + 0.3 });
      if (game.rng() < 0.2) game.spawnItem(game.rng() < 0.5 ? 'healthvial' : 'battery', n.pos.x - 0.3, n.pos.z, { y: n.pos.y + 0.3 });
    }
    if (n.type === 'soldier' && n.grenades > 0 && game.rng() < 0.25) game.spawnItem('ammo_grenade', n.pos.x, n.pos.z + 0.3, { y: n.pos.y + 0.3 });
    if (n.type === 'elite' && game.rng() < 0.5) game.spawnItem('ammo_ar2ball', n.pos.x, n.pos.z + 0.3, { y: n.pos.y + 0.3 });
    if (n.cat === 'manhack' || n.cat === 'scanner') {
      game.fx.spark(n.pos, 14);
      game.emit({ type: 'sound', name: n.cat === 'manhack' ? 'manhack_die' : 'scanner_die', pos: n.pos });
      if (n.cat === 'scanner') H.Phys.explode(game, n.pos, 10, 2, null);
    }
    if (n.cat === 'strider') { game.fx.explosion({ x: n.pos.x, y: n.pos.y + 8.5, z: n.pos.z }, 9); game.emit({ type: 'sound', name: 'strider_die', pos: n.pos }); n.collapse = 0; }
    if (n.cat === 'apc') { H.Phys.explode(game, { x: n.pos.x, y: n.pos.y + 1, z: n.pos.z }, 60, 7, null); }
    if (n.cat === 'guard') game.emit({ type: 'sound', name: 'guard_die', pos: n.pos });
    if (n.cat === 'antlion') game.emit({ type: 'sound', name: 'antlion_die', pos: n.pos });
    if (n.cat === 'zombie') game.emit({ type: 'sound', name: 'zombie_die', pos: n.pos });
    if (n.cat === 'soldier' && n.team === 'combine') game.emit({ type: 'sound', name: 'radio_die', pos: n.pos });
    if (n.cat === 'turret') game.emit({ type: 'sound', name: 'turret_die', pos: n.pos });
    for (const m of game.npcs) if (m.enemy === n) m.enemy = null;
  }

  function onUse(game, n) {
    if (n.team === 'rebel' && n.def.squad && !n.essential) {
      if (n.inSquad) { n.inSquad = false; n.follow = false; n.hold = H.vcopy(n.pos); game.say(n.speaker === 'medic' ? 'medic' : 'rebel', pick(game, LINES.leave), 1.8); }
      else { n.inSquad = true; n.follow = true; n.hold = null; game.say(n.speaker === 'medic' ? 'medic' : 'rebel', pick(game, LINES.join), 1.8); }
      return;
    }
    if (n.opts.lines && n.opts.lines.length) {
      n.lineI = ((n.lineI === undefined ? -1 : n.lineI) + 1) % n.opts.lines.length;
      game.say(n.speaker, n.opts.lines[n.lineI]);
    }
  }

  function complain(game, n) {
    if (game.time - (n.complainT || -9) < 3) return;
    n.complainT = game.time;
    const who = H.SPEAKERS[n.speaker] ? n.speaker : 'rebel';
    game.say(who, pick(game, LINES.complain), 1.8);
  }

  function launched(game, n, vel) {
    n.held = null;
    n.state = 'combat';
    n.vel = H.vcopy(vel);
    const sp = H.vlen(vel);
    if (n.cat === 'manhack') { if (sp > 5) n.thrown = true; }
    else if (n.cat === 'roller') { n.airborne = true; }
    else if (n.cat === 'turret') {
      n.onGround = false;
      n.yaw = game.player.yaw;
      n.opts.base = game.player.yaw;
      if (sp > 6) tipTurret(game, n, H.vnorm(vel));
    }
  }

  function serialize(n) {
    const r3 = v => Math.round(v * 1000) / 1000;
    return {
      id: n.id, type: n.type, team: n.team, tag: n.tag, pos: [r3(n.pos.x), r3(n.pos.y), r3(n.pos.z)], yaw: n.yaw, hp: n.hp, alive: n.alive,
      follow: n.follow, inSquad: n.inSquad, hold: n.hold, weapon: n.weapon, passive: n.passive, sleep: n.sleep, script: n.script, opts: n.opts,
      tipped: n.tipped, patrol: n.patrol, speaker: n.speaker, headless: !!n.headless, grenades: n.grenades, crabs: n.crabs, fetch: n.fetch || null,
      enemyPlayer: n.enemy && n.enemy.kind === 'player', dropGroup: n.dropGroup || null, dropAt: n.dropAt, alt: n.alt, essential: n.essential
    };
  }

  function deserialize(game, s) {
    const n = make(game, s.type, s.pos[0], s.pos[1], s.pos[2], { id: s.id, team: s.team, tag: s.tag, yaw: s.yaw, y: s.pos[1], weapon: s.weapon, passive: s.passive, sleep: s.sleep, speaker: s.speaker, alt: s.alt });
    Object.assign(n, { hp: s.hp, follow: s.follow, inSquad: s.inSquad, hold: s.hold, script: s.script, opts: Object.assign(n.opts, s.opts), tipped: s.tipped, patrol: s.patrol, headless: s.headless, grenades: s.grenades, crabs: s.crabs, fetch: s.fetch, dropGroup: s.dropGroup, dropAt: s.dropAt, essential: s.essential });
    n.pos.y = s.pos[1];
    if (!s.alive) { n.alive = false; n.deadT = game.time - 60; n.state = 'dead'; }
    if (s.enemyPlayer) { n.enemy = game.player; n.lastSeenT = game.time - 1; n.lastSeenPos = H.vcopy(game.player.pos); n.state = 'combat'; }
    return n;
  }

  H.AI = { make, stepAll, onHurt, onDeath, onUse, complain, tipTurret, launched, heldManhackHits, serialize, deserialize, canSee, chest, targetPos, CAT };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
