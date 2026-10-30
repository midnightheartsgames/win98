(function (T) {
  'use strict';
  const { hu } = T;
  const R = T.RULES;
  const LEVELS = 3;
  const UPGRADE_COST = 200;
  const SPOT_DIST = 1.7;
  const TURN = [3, 4.5, 6];
  const SWEEP_SPEED = 0.8;
  const SWEEP_SPAN = Math.PI / 2;
  const FIRE_CONE = 0.09;
  const THINK_TICKS = 6;
  const BUSY_AFTER_UPGRADE = 1.6;
  const SEAL_WAKE = 0.5;
  const PAD_WAIT = 0.4;
  const MELEE_COS = 0.6;

  T.BUILDINGS = {
    hydrant: {
      id: 'hydrant', name: 'Гидрант', cost: 130, build: 10, r: 0.45, h: 1.1, health: [150, 180, 216],
      interval: [0.225, 0.135, 0.135], ammo: [150, 200, 200], rockets: 20, rocketEvery: 3.06, range: hu(1100), dmg: 16, dmgClose: 19.49, scrap: 65
    },
    titan: {
      id: 'titan', name: 'Титан', cost: 100, build: 20, r: 0.5, h: 1.35, health: [150, 180, 216],
      heal: [10, 15, 20], ammoShare: [0.2, 0.3, 0.4], metal: [40, 50, 60], metalEvery: 5, range: 3
    },
    enter: { id: 'enter', name: 'Люк-вход', cost: 50, build: 20, r: 0.7, h: 0.16, health: [150, 180, 216], pad: true, recharge: [10, 5, 3] },
    exit: { id: 'exit', name: 'Люк-выход', cost: 50, build: 20, r: 0.7, h: 0.16, health: [150, 180, 216], pad: true }
  };
  T.BUILD_ORDER = ['hydrant', 'titan', 'enter', 'exit'];

  const ROCKET = { id: 'hydrantRocket', flight: 'rocket', dmg: 100, ramp: 1, speed: hu(1100), radius: hu(146), noSelf: true };

  T.hydrantBullet = function (dHu) {
    const def = T.BUILDINGS.hydrant, d = T.distanceFactor(dHu);
    return d > 1 ? def.dmg + (def.dmgClose - def.dmg) * (d - 1) / 0.5 : def.dmg;
  };

  function angleTo(from, to) {
    let d = (to - from) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function own(g, h, kind) { return g.buildings.find(b => b.owner === h && b.kind === kind); }
  function pairOf(g, b) { return own(g, b.owner, b.kind === 'enter' ? 'exit' : 'enter'); }

  function ready(b) { return b.buildLeft <= 0 && b.busyT <= 0 && !b.sealed && b.wakeT <= 0; }

  function makeBuilding(g, h, kind, spot, yaw, carried) {
    const def = T.BUILDINGS[kind];
    const b = carried || {
      isBuilding: true, fixed: true, alive: true, kind, def, owner: h, team: h.team, r: def.r, h: def.h,
      level: 1, upgrade: 0, hp: 0, maxHp: def.health[0], ammo: def.ammo ? def.ammo[0] : 0, rockets: 0,
      sealed: false, sealHits: 0, wakeT: 0, busyT: 0, hits: 0, hitsT: 0, fireCd: 0, rocketCd: 0, think: 0, target: null,
      sweep: 0, sweepDir: 1, pulse: 0, charge: 0, waitT: 0, waiter: null, lastHurt: -Infinity, pos: { x: 0, y: 0, z: 0 }, yaw: 0, aimYaw: 0, aimPitch: 0
    };
    b.pos.x = spot.x; b.pos.y = spot.y; b.pos.z = spot.z;
    b.yaw = yaw;
    b.aimYaw = yaw;
    b.sweep = 0;
    b.target = null;
    b.buildTotal = carried ? def.build / 2 : def.build;
    b.buildLeft = b.buildTotal;
    b.redeploy = !!carried;
    if (!carried) b.hp = b.maxHp * R.buildStartHealth;
    g.buildings.push(b);
    g.refreshVictims();
    return b;
  }

  function spotFor(g, h) {
    const x = h.pos.x + Math.sin(h.yaw) * SPOT_DIST, z = h.pos.z + Math.cos(h.yaw) * SPOT_DIST;
    const def = T.BUILDINGS[h.ghost.kind];
    const y = g.world.groundAt(x, z, h.pos.y + 0.8, 0, h);
    const spot = { x, y, z, ok: false };
    if (y === -Infinity || !h.onGround || Math.abs(y - h.pos.y) > 0.8) return spot;
    const c = def.r;
    for (const [ox, oz] of [[c, c], [-c, c], [c, -c], [-c, -c]]) {
      const q = g.world.groundAt(x + ox, z + oz, y + 0.3, 0, h);
      if (q === -Infinity || Math.abs(q - y) > R.buildFlat) return spot;
    }
    if (!g.world.fits({ r: c, team: h.team, through: null }, x, z, y + R.stepUp, def.h)) return spot;
    if (g.world.waterTop(x, y, z) > -Infinity) return spot;
    for (const n of g.map.noBuild) if (x >= n.x0 && x <= n.x1 && z >= n.z0 && z <= n.z1) return spot;
    for (const b of g.buildings) if (Math.hypot(b.pos.x - x, b.pos.z - z) < b.r + c) return spot;
    for (const t of g.heroes) {
      if (t === h || !t.alive || t.team === h.team) continue;
      if (Math.hypot(t.pos.x - x, t.pos.z - z) < t.r + c) return spot;
    }
    spot.ok = true;
    return spot;
  }

  function waterBetween(g, ax, ay, az, bx, by, bz) {
    for (const w of g.world.water) {
      if ((ay - w.y1) * (by - w.y1) >= 0) continue;
      const k = (w.y1 - ay) / (by - ay);
      const x = ax + (bx - ax) * k, z = az + (bz - az) * k;
      if (x >= w.x0 && x <= w.x1 && z >= w.z0 && z <= w.z1) return true;
    }
    return false;
  }

  function visible(g, b, t) {
    const mx = b.pos.x, my = b.pos.y + b.h * 0.8, mz = b.pos.z;
    const tx = t.pos.x, ty = t.pos.y + t.h * 0.6, tz = t.pos.z;
    const dist = Math.hypot(tx - mx, ty - my, tz - mz);
    if (dist > b.def.range) return false;
    if (!g.world.clear(mx, my, mz, tx, ty, tz)) return false;
    if (waterBetween(g, mx, my, mz, tx, ty, tz)) return false;
    const l = dist || 1, dx = (tx - mx) / l, dy = (ty - my) / l, dz = (tz - mz) / l;
    for (const o of g.buildings) {
      if (o === b || o === t || o.def.pad) continue;
      if (g.rayBody(o, mx, my, mz, dx, dy, dz, dist) !== null) return false;
    }
    return true;
  }

  function seen(g, b, t) {
    if (!t.alive || t.team === b.team) return false;
    if (t.cloaked) return false;
    if (b.endless && t.fixed) return false;
    if (t.disguised && b.target !== t) return false;
    return visible(g, b, t);
  }

  function chooseTarget(g, b) {
    let best = null, bestD = Infinity;
    for (const t of g.heroes) {
      if (!seen(g, b, t)) continue;
      const d = Math.hypot(t.pos.x - b.pos.x, t.pos.z - b.pos.z);
      if (d < bestD) { bestD = d; best = t; }
    }
    if (best) return best;
    for (const t of g.buildings) {
      if (t === b || !seen(g, b, t)) continue;
      const d = Math.hypot(t.pos.x - b.pos.x, t.pos.z - b.pos.z);
      if (d < bestD) { bestD = d; best = t; }
    }
    return best;
  }

  function fireBullet(g, b, t) {
    const lvl = b.level - 1, def = b.def;
    if (b.ammo <= 0) return;
    if (!b.endless) b.ammo--;
    b.fireCd = def.interval[lvl];
    const dist = g.distanceHu(b, t);
    g.events.push({ type: 'turret', hero: b.owner.id, x: b.pos.x, y: b.pos.y + b.h * 0.8, z: b.pos.z, tx: t.pos.x, ty: t.pos.y + t.h * 0.6, tz: t.pos.z });
    g.damage(t, T.hydrantBullet(t.isBuilding ? 512 : dist), { by: b.owner, def, boost: null });
    if (!t.isBuilding && !t.fixed && t.alive) {
      const dx = t.pos.x - b.pos.x, dz = t.pos.z - b.pos.z, l = Math.hypot(dx, dz) || 1;
      g.knock(t, dx / l * R.hydrantKnock, 0, dz / l * R.hydrantKnock);
    }
  }

  function fireRocket(g, b, t) {
    if (!b.endless) b.rockets--;
    b.rocketCd = b.def.rocketEvery;
    const mx = b.pos.x, my = b.pos.y + b.h, mz = b.pos.z;
    const tx = t.pos.x - mx, ty = t.pos.y + t.h * 0.5 - my, tz = t.pos.z - mz, l = Math.hypot(tx, ty, tz) || 1;
    g.proj.push({
      x: mx, y: my, z: mz, vx: tx / l * ROCKET.speed, vy: ty / l * ROCKET.speed, vz: tz / l * ROCKET.speed,
      owner: b.owner, team: b.team, def: ROCKET, boost: null, age: 0, life: R.rocketLife, gravity: 0, armT: 0, bounced: false, stuck: false, dead: false
    });
    g.events.push({ type: 'turretRocket', hero: b.owner.id, x: mx, y: my, z: mz });
  }

  function hydrantTick(g, b, dt) {
    b.fireCd = Math.max(0, b.fireCd - dt);
    b.rocketCd = Math.max(0, b.rocketCd - dt);
    if (!ready(b)) { b.target = null; return; }
    b.think--;
    if (b.think <= 0 || (b.target && !seen(g, b, b.target))) {
      b.think = THINK_TICKS;
      b.target = chooseTarget(g, b);
    }
    const t = b.target;
    const turn = TURN[b.level - 1] * dt;
    if (!t) {
      b.sweep += b.sweepDir * SWEEP_SPEED * dt;
      if (Math.abs(b.sweep) > SWEEP_SPAN) { b.sweep = Math.sign(b.sweep) * SWEEP_SPAN; b.sweepDir = -b.sweepDir; }
      const want = angleTo(b.aimYaw, b.yaw + b.sweep);
      b.aimYaw += T.clamp(want, -turn, turn);
      return;
    }
    const want = Math.atan2(t.pos.x - b.pos.x, t.pos.z - b.pos.z);
    const left = angleTo(b.aimYaw, want);
    b.aimYaw += T.clamp(left, -turn, turn);
    if (Math.abs(angleTo(b.aimYaw, want)) > FIRE_CONE) return;
    if (b.fireCd <= 0) fireBullet(g, b, t);
    if (b.level === LEVELS && b.rockets > 0 && b.rocketCd <= 0) fireRocket(g, b, t);
  }

  function titanTick(g, b, dt) {
    if (!ready(b)) return;
    const lvl = b.level - 1, def = b.def;
    const mid = b.pos.y + b.h * 0.6;
    b.pulse += dt;
    const pay = b.pulse >= def.metalEvery;
    if (pay) b.pulse -= def.metalEvery;
    for (const h of g.heroes) {
      if (!h.alive || h.fixed || (h.team !== b.team && !h.disguised)) continue;
      if (Math.hypot(h.pos.x - b.pos.x, h.pos.y + h.h / 2 - mid, h.pos.z - b.pos.z) > def.range) continue;
      if (!g.world.clear(b.pos.x, mid, b.pos.z, h.pos.x, h.pos.y + h.h / 2, h.pos.z)) continue;
      g.heal(h, def.heal[lvl] * dt, h.maxHp);
      if (h.mods.watch) h.cloakMeter = Math.min(1, h.cloakMeter + (h.cloaked ? R.titanCloak[lvl] / R.cloakDrain : (lvl + 1) / R.cloakRecharge) * dt);
      for (const a of h.arms) {
        if (!a.def.reserve || a.reserve >= a.def.reserve) continue;
        a.share = (a.share || 0) + a.def.reserve * def.ammoShare[lvl] * dt;
        const whole = Math.floor(a.share);
        a.share -= whole;
        a.reserve = Math.min(a.def.reserve, a.reserve + whole);
      }
      if (pay && h.mods.metal) h.metal = Math.min(R.metalMax, h.metal + def.metal[lvl]);
    }
  }

  function padTick(g, b, dt) {
    if (b.kind !== 'enter') return;
    b.charge = Math.max(0, b.charge - dt);
    const exit = pairOf(g, b);
    if (!exit || !ready(b) || !ready(exit) || b.charge > 0) { b.waiter = null; return; }
    let on = null;
    for (const h of g.heroes) {
      if (!h.alive || h.fixed) continue;
      if (h.team !== b.team && !h.mods.padThief) continue;
      if (h.flag) continue;
      if (Math.hypot(h.pos.x - b.pos.x, h.pos.z - b.pos.z) > b.r || Math.abs(h.pos.y - b.pos.y) > 0.5) continue;
      on = h;
      break;
    }
    if (!on || on !== b.waiter) { b.waiter = on; b.waitT = PAD_WAIT; return; }
    b.waitT -= dt;
    if (b.waitT > 0) return;
    for (const t of g.heroes) {
      if (!t.alive || t === on || t.team === on.team) continue;
      if (Math.hypot(t.pos.x - exit.pos.x, t.pos.z - exit.pos.z) > exit.r || Math.abs(t.pos.y - exit.pos.y) > 1) continue;
      g.damage(t, R.telefrag, { by: on, def: b.def });
    }
    on.pos.x = exit.pos.x; on.pos.y = exit.pos.y + exit.h; on.pos.z = exit.pos.z;
    on.prev.x = on.pos.x; on.prev.y = on.pos.y; on.prev.z = on.pos.z;
    on.vel.x = on.vel.y = on.vel.z = 0;
    on.yaw = exit.yaw;
    on.onGround = false;
    b.charge = b.def.recharge[b.level - 1];
    b.waiter = null;
    g.events.push({ type: 'teleport', hero: on.id, x: exit.pos.x, y: exit.pos.y, z: exit.pos.z, yaw: exit.yaw });
  }

  function destroy(g, b, broken) {
    const at = g.buildings.indexOf(b);
    if (at >= 0) g.buildings.splice(at, 1);
    b.alive = false;
    g.refreshVictims();
    for (const h of g.heroes) if (h.ghost && h.ghost.carried === b) h.ghost = null;
    if (b.def.pad) {
      const other = pairOf(g, b);
      if (other) setLevel(other, 1);
    }
    g.events.push({ type: 'destroyed', hero: b.owner.id, kind: b.kind, x: b.pos.x, y: b.pos.y, z: b.pos.z, broken });
    if (broken && b.def.scrap) g.dropItem({ kind: 'metal', size: 0.5, metal: b.def.scrap, x: b.pos.x, y: b.pos.y, z: b.pos.z, life: R.dropLife });
  }

  function setLevel(b, level) {
    const before = b.maxHp;
    b.level = level;
    b.maxHp = b.def.health[level - 1];
    b.hp = level > 1 ? b.hp + (b.maxHp - before) : Math.min(b.hp, b.maxHp);
    b.upgrade = 0;
    if (b.def.ammo) {
      b.ammo = Math.min(b.def.ammo[level - 1], b.ammo + (b.def.ammo[level - 1] - b.def.ammo[Math.max(0, level - 2)]));
      if (level === LEVELS) b.rockets = b.def.rockets;
      if (level < LEVELS) b.rockets = 0;
    }
  }

  function addUpgrade(g, h, b, amount) {
    const pair = b.def.pad ? pairOf(g, b) : null;
    const add = Math.min(amount, h.metal, UPGRADE_COST - b.upgrade);
    if (add <= 0) return 0;
    h.metal -= add;
    b.upgrade += add;
    if (pair) pair.upgrade = b.upgrade;
    if (b.upgrade >= UPGRADE_COST) {
      setLevel(b, b.level + 1);
      b.busyT = BUSY_AFTER_UPGRADE;
      if (pair) { setLevel(pair, b.level); pair.busyT = BUSY_AFTER_UPGRADE; }
      g.events.push({ type: 'levelup', hero: h.id, kind: b.kind, level: b.level, x: b.pos.x, y: b.pos.y, z: b.pos.z });
    }
    return add;
  }

  T.Build = {
    ready,
    own,
    spotFor,

    standing(g, spec) {
      if (!spec.owner) {
        const side = spec.kind === 'hydrant' ? 1.8 : 0;
        spec.owner = g.addDummy(spec.merc, spec.team, spec.x - side, spec.y, spec.z, spec.yaw);
      }
      const b = makeBuilding(g, spec.owner, spec.kind, spec, spec.yaw, null);
      b.buildLeft = 0;
      b.hp = b.maxHp;
      b.endless = true;
      spec.building = b;
      spec.backAt = 0;
      return b;
    },

    stepStanding(g) {
      for (const spec of g.standing) {
        if (spec.building.alive) continue;
        if (!spec.backAt) spec.backAt = g.t + R.standingBack;
        else if (g.t >= spec.backAt) this.standing(g, spec);
      }
    },

    step(g, dt) {
      for (const b of g.buildings.slice()) {
        if (!b.alive) continue;
        if (b.wakeT > 0) b.wakeT = Math.max(0, b.wakeT - dt);
        if (b.busyT > 0) b.busyT = Math.max(0, b.busyT - dt);
        if (b.hitsT > 0) { b.hitsT -= dt; if (b.hitsT <= 0) b.hits = 0; }
        if (b.sealed) {
          b.target = null;
          b.hp -= R.sealDps * dt;
          if (b.hp <= 0) destroy(g, b, true);
          continue;
        }
        if (b.buildLeft > 0) {
          const rate = 1 + 0.5 * b.hits;
          const was = b.buildLeft;
          b.buildLeft = Math.max(0, b.buildLeft - rate * dt);
          if (!b.redeploy) b.hp = Math.min(b.maxHp, b.hp + b.maxHp * (1 - R.buildStartHealth) * (was - b.buildLeft) / b.buildTotal);
          continue;
        }
        if (b.kind === 'hydrant') hydrantTick(g, b, dt);
        else if (b.kind === 'titan') titanTick(g, b, dt);
        else padTick(g, b, dt);
      }
    },

    hurt(g, b, amount, info) {
      b.hp -= amount;
      b.lastHurt = g.t;
      if (b.hp > 0) return false;
      destroy(g, b, true);
      if (info && info.by) g.events.push({ type: 'wrecked', hero: info.by.id, kind: b.kind });
      return false;
    },

    menu(g, h, pick) {
      const kind = T.BUILD_ORDER[pick - 1];
      if (!kind) return;
      const def = T.BUILDINGS[kind];
      if (own(g, h, kind)) { g.events.push({ type: 'buildDenied', hero: h.id, why: 'есть' }); return; }
      if (h.metal < def.cost) { g.events.push({ type: 'buildDenied', hero: h.id, why: 'металл' }); return; }
      h.ghost = { kind, yaw: h.yaw, turn: 0, carried: null };
    },

    scrap(g, h, pick) {
      const kind = T.BUILD_ORDER[pick - 1];
      const b = kind && own(g, h, kind);
      if (b) destroy(g, b, false);
    },

    pick(g, h) {
      const b = this.aimed(g, h, h.arms[h.slot].def.range);
      if (!b || b.owner !== h || b.sealed || b.buildLeft > 0 || h.ghost) return;
      const at = g.buildings.indexOf(b);
      g.buildings.splice(at, 1);
      g.refreshVictims();
      h.ghost = { kind: b.kind, turn: 0, carried: b };
      h.reloading = false;
      h.swing = null;
      g.events.push({ type: 'carry', hero: h.id, kind: b.kind });
    },

    ghostStep(g, h, press, alt) {
      const ghost = h.ghost;
      if (ghost.carried) h.speedCap = h.speed * R.carrySpeed;
      if (alt) ghost.turn = (ghost.turn + 1) % 4;
      if (!press) return;
      const spot = spotFor(g, h);
      if (!spot.ok) { g.events.push({ type: 'buildDenied', hero: h.id, why: 'место' }); return; }
      const def = T.BUILDINGS[ghost.kind];
      if (!ghost.carried) h.metal -= def.cost;
      makeBuilding(g, h, ghost.kind, spot, h.yaw + ghost.turn * Math.PI / 2, ghost.carried);
      const carried = !!ghost.carried;
      h.ghost = null;
      g.events.push({ type: 'placed', hero: h.id, kind: ghost.kind, x: spot.x, y: spot.y, z: spot.z });
      if (!carried) g.selectSlot(h, h.arms.findIndex(a => a.def.wrench));
    },

    dropCarried(g, h) {
      if (h.ghost && h.ghost.carried) {
        h.ghost.carried.alive = false;
        g.events.push({ type: 'destroyed', hero: h.id, kind: h.ghost.kind, x: h.pos.x, y: h.pos.y, z: h.pos.z, broken: true });
      }
      h.ghost = null;
    },

    removeAll(g, h) {
      this.dropCarried(g, h);
      for (const b of g.buildings.slice()) if (b.owner === h) destroy(g, b, false);
    },

    seal(g, h, def) {
      const b = this.aimed(g, h, def.range, true);
      if (!b || b.sealed) return false;
      b.sealed = true;
      b.sealHits = 0;
      const pair = b.def.pad ? pairOf(g, b) : null;
      if (pair && pair.buildLeft <= 0) { pair.sealed = true; pair.sealHits = 0; }
      g.events.push({ type: 'sealed', hero: h.id, owner: b.owner.id, kind: b.kind, x: b.pos.x, y: b.pos.y, z: b.pos.z });
      return true;
    },

    aimed(g, h, range, enemy) {
      const eye = g.eye(h), d = T.dir(h.yaw, h.pitch);
      let best = null, bestD = Infinity;
      for (const b of g.buildings) {
        if ((b.team === h.team) === !!enemy) continue;
        const cy = T.clamp(eye.y + d.y * range, b.pos.y, b.pos.y + b.h);
        const dx = b.pos.x - eye.x, dy = cy - eye.y, dz = b.pos.z - eye.z;
        const dist = Math.hypot(dx, dy, dz);
        if (dist - b.r > range) continue;
        if (dist > b.r && (dx * d.x + dy * d.y + dz * d.z) / dist < MELEE_COS) continue;
        if (!g.world.clear(eye.x, eye.y, eye.z, b.pos.x, cy, b.pos.z)) continue;
        if (dist < bestD) { bestD = dist; best = b; }
      }
      return best;
    },

    wrench(g, h, b, def) {
      if (b.sealed) {
        b.sealHits++;
        if (b.sealHits >= R.sealHits) {
          b.sealed = false;
          b.sealHits = 0;
          b.wakeT = SEAL_WAKE;
          const pair = b.def.pad ? pairOf(g, b) : null;
          if (pair && pair.sealed) { pair.sealed = false; pair.sealHits = 0; pair.wakeT = SEAL_WAKE; }
          g.events.push({ type: 'unsealed', hero: h.id, kind: b.kind });
        }
        return;
      }
      if (b.buildLeft > 0) {
        b.hits = Math.min(R.buildHitsMax, b.hits + 1);
        b.hitsT = R.buildHitsKeep;
        return;
      }
      const pad = !!b.def.pad;
      const need = Math.min(b.maxHp - b.hp, pad ? R.repairPad : R.repairHit);
      if (need > 0 && h.metal > 0) {
        const per = pad ? R.repairPad / R.repairPadCost : R.repairHit / R.repairCost;
        const cost = Math.min(h.metal, Math.ceil(need / per));
        h.metal -= cost;
        b.hp = Math.min(b.maxHp, b.hp + cost * per);
        return;
      }
      if (b.level < LEVELS) addUpgrade(g, h, b, g.setupPhase ? R.upgradeHit * 2 : R.upgradeHit);
      if (b.kind === 'hydrant') {
        const room = b.def.ammo[b.level - 1] - b.ammo;
        const bullets = Math.min(room, R.ammoHit, h.metal);
        if (bullets > 0) { b.ammo += bullets; h.metal -= bullets; }
        if (b.level === LEVELS) {
          const rockets = Math.min(b.def.rockets - b.rockets, Math.floor(R.rocketHit / 2), Math.floor(h.metal / 2));
          if (rockets > 0) { b.rockets += rockets; h.metal -= rockets * 2; }
        }
      }
    }
  };

  T.KINDS.place = {
    update(g, h, a, inp, dt, alt, press) {
      if (h.deployT > 0) return;
      if (a.def.seal) {
        if (press) T.Build.seal(g, h, a.def);
        return;
      }
      if (!inp.pick) return;
      if (a.def.scrap) T.Build.scrap(g, h, inp.pick);
      else T.Build.menu(g, h, inp.pick);
    }
  };

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
