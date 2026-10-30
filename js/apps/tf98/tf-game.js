(function (T) {
  'use strict';
  const { TICK, HU } = T;
  const R = T.RULES;
  const JUMP_V = Math.sqrt(2 * R.gravity * R.jumpHeight);

  function blankInput() {
    return { fwd: 0, side: 0, jump: false, crouch: false, fire: false, fire2: false, reload: false, slot: 0, next: 0, last: false, pick: 0, drop: false, yaw: 0, pitch: 0 };
  }
  T.blankInput = blankInput;

  function rayBody(h, ox, oy, oz, dx, dy, dz, maxT) {
    const fx = ox - h.pos.x, fz = oz - h.pos.z, y0 = h.pos.y, y1 = y0 + h.h;
    const a = dx * dx + dz * dz, c = fx * fx + fz * fz - h.r * h.r;
    let tIn = 0, tOut = maxT;
    if (a < 1e-12) {
      if (c > 0) return null;
    } else {
      const b = fx * dx + fz * dz, disc = b * b - a * c;
      if (disc < 0) return null;
      const s = Math.sqrt(disc);
      tIn = Math.max(tIn, (-b - s) / a);
      tOut = Math.min(tOut, (-b + s) / a);
    }
    if (Math.abs(dy) < 1e-12) {
      if (oy < y0 || oy > y1) return null;
    } else {
      const a0 = (y0 - oy) / dy, a1 = (y1 - oy) / dy;
      tIn = Math.max(tIn, Math.min(a0, a1));
      tOut = Math.min(tOut, Math.max(a0, a1));
    }
    return tIn <= tOut ? tIn : null;
  }

  function raySphere(x, y, z, r, ox, oy, oz, dx, dy, dz, maxT) {
    const fx = ox - x, fy = oy - y, fz = oz - z;
    const b = fx * dx + fy * dy + fz * dz, c = fx * fx + fy * fy + fz * fz - r * r;
    const disc = b * b - c;
    if (disc < 0) return null;
    const t = Math.max(0, -b - Math.sqrt(disc));
    return t <= maxT && -b + Math.sqrt(disc) >= 0 ? t : null;
  }

  class Game {
    constructor(opts = {}) {
      this.opts = opts;
      this.rules = Object.assign({ respawn: 0, noRespawn: false }, opts.rules || {});
      this.score = { hot: 0, cold: 0 };
      this.spawnTurn = { hot: 0, cold: 0 };
      this.map = T.buildMap(opts.map || 'yard', { visual: opts.visual !== false });
      this.world = this.map.world;
      this.rand = T.rng(opts.seed || 1);
      this.t = 0;
      this.tickN = 0;
      this.events = [];
      this.heroes = [];
      this.proj = [];
      this.drops = [];
      this.buildings = [];
      this.victims = [];
      this.setupPhase = false;
      this.pickups = this.map.pickups.map(p => Object.assign({ readyAt: 0 }, p));
      this.mode = opts.mode ? new T.Modes[opts.mode](this) : null;
      if (!opts.spectate) {
        this.player = this.addHero(opts.merc || T.MERC_ORDER[0], opts.team || 'hot', true);
        this.respawn(this.player);
      }
      for (const d of this.map.dummies) this.addDummy(d.merc, d.team, d.x, d.y, d.z, d.yaw);
      for (const t of this.map.targets) this.addDummy('strongman', 'none', t.x, t.y, t.z, t.yaw);
      for (const w of this.map.patrols) this.addPatrol(w.merc, w.team, w.points, w.y);
      this.standing = this.map.turrets.map(t => Object.assign({}, t));
      for (const s of this.standing) T.Build.standing(this, s);
      if (opts.bots) this.fillBots(opts.bots);
      if (this.mode) this.mode.start();
    }

    addHero(merc, team, human) {
      const def = T.MERCS[merc];
      const h = {
        id: this.heroes.length, merc, def, team, human, fixed: false, alive: true,
        pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 }, prev: { x: 0, y: 0, z: 0 },
        yaw: 0, pitch: 0, r: R.hullR, h: R.standH, duck: 0, crouched: false, onGround: true,
        hp: def.hp, maxHp: def.hp, breath: R.breath, level: 0,
        jumpHeld: false, jumpBuf: 0, usedDouble: false, climbing: false, ladderLock: 0, leap: 0,
        through: null, wall: null, blocked: 0, peakY: 0, startY: 0, critT: 0, miniT: 0,
        burnT: 0, burnTick: 0, burnBy: null, uberT: 0, lastHurt: -Infinity, lockerReady: 0, fire2Held: false, flag: null, disarmed: false
      };
      this.giveArms(h);
      h.hp = h.maxHp;
      this.heroes.push(h);
      this.refreshVictims();
      return h;
    }

    refreshVictims() { this.victims = this.heroes.concat(this.buildings); }

    rayBody(h, ox, oy, oz, dx, dy, dz, maxT) { return rayBody(h, ox, oy, oz, dx, dy, dz, maxT); }

    addDummy(merc, team, x, y, z, yaw) {
      const h = this.addHero(merc, team, false);
      h.fixed = true;
      h.pos.x = x; h.pos.y = y; h.pos.z = z;
      h.prev.x = x; h.prev.y = y; h.prev.z = z;
      h.yaw = yaw;
      return h;
    }

    fillBots(cfg) {
      const roster = T.BOT_ROSTER;
      for (const team of ['hot', 'cold']) {
        const need = cfg.size - (this.player && this.player.team === team ? 1 : 0);
        const level = (cfg.levels && cfg.levels[team]) || cfg.level;
        for (let i = 0; i < need; i++) this.addBot(roster[i % roster.length], team, level);
      }
    }

    addBot(merc, team, level) {
      if (!this.aiReady) { T.AI.prepare(this); this.aiReady = true; }
      const h = this.addHero(merc, team, false);
      h.brain = true;
      h.botLevel = level;
      h.ai = null;
      this.respawn(h);
      return h;
    }

    aiEnemies(team) {
      if (!this.aiLists[team]) this.aiLists[team] = this.victims.filter(t => t.alive && t.team !== team && t.team !== 'none');
      return this.aiLists[team];
    }

    addPatrol(merc, team, points, y) {
      const h = this.addHero(merc, team, false);
      h.patrol = { points, at: 1, y };
      h.pos.x = h.prev.x = points[0][0];
      h.pos.y = h.prev.y = y;
      h.pos.z = h.prev.z = points[0][1];
      return h;
    }

    patrolInput(h) {
      const w = h.patrol, inp = blankInput();
      let p = w.points[w.at];
      if (Math.hypot(p[0] - h.pos.x, p[1] - h.pos.z) < 0.6) {
        w.at = (w.at + 1) % w.points.length;
        p = w.points[w.at];
      }
      inp.fwd = 1;
      inp.yaw = Math.atan2(p[0] - h.pos.x, p[1] - h.pos.z);
      return inp;
    }

    giveArms(h) {
      h.mods = T.kitMods(h.def);
      h.maxHp = h.def.hp + h.mods.hpDelta;
      h.overHp = T.overFor(h.maxHp);
      h.speed = h.def.speed;
      h.notches = 0;
      h.charging = false; h.chargeRun = 0; h.chargeMeter = 1; h.chargeBoostT = 0; h.chargeBoostKind = null;
      h.arms = (h.def.slots || []).map(id => {
        const base = T.WEAPONS[id];
        const def = h.def.kit && h.def.kit[id] ? Object.assign({}, base, h.def.kit[id]) : base;
        return { def, clip: def.clip || 0, reserve: def.reserve || 0, lastShot: -Infinity, drain: 0, cooldown: 0, charge: 0, wasted: false };
      });
      h.slot = 0; h.lastSlot = 0;
      h.fireCd = 0; h.deployT = 0;
      h.reloading = false; h.reloadT = 0; h.wantReload = false;
      h.swing = null;
      h.speedCap = Infinity; h.noJump = false; h.frozen = false;
      h.flaming = false; h.streamT = 0; h.flameOn = new Map();
      h.chargeT = 0;
      h.spinUp = 0; h.spinDown = 0; h.spunAge = 0;
      h.eatT = 0; h.eatArm = null;
      h.patient = null; h.healing = false;
      h.scoped = false; h.scopeT = 0; h.scopeCharge = 0; h.scopeDelay = 0;
      h.cloakState = 'off'; h.cloakT = 0; h.cloakMeter = 1; h.cloaked = false; h.blinkT = 0;
      h.disguise = null; h.disguiseTo = null; h.disguiseT = 0; h.disguised = false; h.formTeam = T.enemyOf(h.team);
      h.stabReady = false;
      h.metal = h.mods.metal;
      h.ghost = null;
      h.fireHeld = false;
    }

    spawnFor(team) {
      const list = this.map.spawns.filter(s => s.team === team);
      if (!list.length) return this.map.spawns[0];
      const at = this.spawnTurn[team]++;
      return list[at % list.length];
    }

    respawn(h) {
      if (h.flag) this.mode.drop(h);
      const s = h.patrol ? { x: h.patrol.points[0][0], y: h.patrol.y, z: h.patrol.points[0][1], yaw: 0 } : this.spawnFor(h.team);
      if (h.patrol) h.patrol.at = 1;
      h.pos.x = s.x; h.pos.y = s.y; h.pos.z = s.z;
      h.prev.x = s.x; h.prev.y = s.y; h.prev.z = s.z;
      h.vel.x = h.vel.y = h.vel.z = 0;
      h.yaw = s.yaw; h.pitch = 0;
      h.h = R.standH; h.crouched = false; h.duck = 0; h.onGround = true;
      h.breath = R.breath; h.usedDouble = false; h.climbing = false; h.ladderLock = 0; h.leap = 0; h.through = null;
      h.alive = true;
      h.respawnT = 0;
      h.peakY = h.startY = s.y;
      h.critT = 0; h.miniT = 0;
      h.burnT = 0; h.burnBy = null; h.uberT = 0; h.lastHurt = -Infinity;
      for (const p of this.proj) if (p.owner === h && p.def.flight === 'mine') p.dead = true;
      T.Build.dropCarried(this, h);
      this.giveArms(h);
      h.hp = h.maxHp;
      if (this.mode) this.mode.respawned(h);
      this.events.push({ type: 'spawn', hero: h.id });
    }

    setMerc(h, merc) {
      if (h.flag) this.mode.drop(h);
      T.Build.removeAll(this, h);
      h.merc = merc;
      h.def = T.MERCS[merc];
      for (const p of this.proj) if (p.owner === h && p.def.flight === 'mine') p.dead = true;
      this.giveArms(h);
      h.hp = h.maxHp;
      this.events.push({ type: 'merc', hero: h.id, merc });
    }

    setTeam(h, team) {
      T.Build.removeAll(this, h);
      h.team = team;
      this.respawn(h);
    }

    softened(h, amount) {
      if (!h.cloaked) return amount;
      h.blinkT = Math.max(h.blinkT, R.blink);
      return amount * R.cloakArmor;
    }

    hurt(h, amount, cause, soft) {
      if (!h.alive || h.uberT > 0) return false;
      h.hp -= soft ? amount : this.softened(h, amount);
      h.lastHurt = this.t;
      this.events.push({ type: 'hurt', hero: h.id, amount, cause });
      if (h.hp > 0) return false;
      this.events.push({ type: 'death', hero: h.id, cause });
      this.dropItem({ kind: 'ammo', size: R.deathDrop, x: h.pos.x, y: h.pos.y, z: h.pos.z, life: R.dropLife });
      this.bury(h);
      return true;
    }

    bury(h) {
      if (h.flag) this.mode.drop(h);
      if (!this.rules.noRespawn && !(this.rules.respawn > 0) && !(this.rules.wave > 0)) {
        this.respawn(h);
        return;
      }
      h.alive = false;
      h.respawnT = this.rules.noRespawn ? 0 : this.rules.wave > 0 ? (Math.floor(this.t / this.rules.wave) + 2) * this.rules.wave - this.t : this.rules.respawn;
      h.ai = null;
      h.flaming = false;
      h.patient = null;
      h.healing = false;
      h.charging = false;
      h.scoped = false;
      h.swing = null;
      for (const p of this.proj) if (p.owner === h && p.def.flight === 'mine') p.dead = true;
      T.Build.dropCarried(this, h);
    }

    damage(target, amount, info = {}) {
      if (!target.alive || amount <= 0) return false;
      if (target.uberT > 0) {
        this.events.push({ type: 'blocked', dst: target.id, src: info.by ? info.by.id : -1 });
        return false;
      }
      if (info.element && target.mods && target.mods.resist[info.element]) amount *= target.mods.resist[info.element];
      amount = this.softened(target, amount);
      this.events.push({
        type: 'hit', src: info.by ? info.by.id : -1, dst: target.id, amount, boost: info.boost || null, weapon: info.def ? info.def.id : null, head: !!info.head,
        x: target.pos.x, y: target.pos.y + target.h, z: target.pos.z
      });
      if (target.isBuilding) return T.Build.hurt(this, target, amount, info);
      if (target.fixed) {
        target.hp -= amount;
        target.lastHurt = this.t;
        if (target.hp <= 0) {
          this.events.push({ type: 'broken', hero: target.id });
          target.hp = target.maxHp;
          target.burnT = 0;
          this.credit(info);
        }
        return false;
      }
      const died = this.hurt(target, amount, info.cause || 'weapon', true);
      if (died) {
        this.credit(info);
        const by = info.by;
        if (by && by !== target) {
          this.score[by.team] = (this.score[by.team] || 0) + 1;
          this.events.push({ type: 'kill', by: by.id, victim: target.id, weapon: info.def ? info.def.id : null });
        }
      }
      return died;
    }

    credit(info) {
      const by = info.by, def = info.def;
      if (!by || !def || def.kind !== 'melee' || !by.alive) return;
      if (by.mods.meleeKillFill) by.chargeMeter = Math.min(1, by.chargeMeter + by.mods.meleeKillFill);
      if (def.notches) this.addNotch(by, def.notches);
    }

    addNotch(h, n) {
      if (h.notches < n.max) {
        h.notches++;
        h.maxHp += n.hp;
        h.overHp = T.overFor(h.maxHp);
        h.speed = Math.min(n.cap, h.def.speed * (1 + n.speedPct * h.notches));
      }
      h.hp = Math.min(h.maxHp, h.hp + n.heal);
      this.events.push({ type: 'notch', hero: h.id, notches: h.notches });
    }

    startCharge(h) {
      const c = h.mods.charge;
      if (!c || h.charging || h.chargeMeter < 1 || h.frozen || h.level >= 2 || h.ghost) return;
      h.charging = true;
      h.chargeRun = 0;
      h.burnT = 0;
      h.chargeBoostT = 0;
      this.events.push({ type: 'charge', hero: h.id });
    }

    endCharge(h, why) {
      const c = h.mods.charge, frac = h.chargeRun / c.time;
      h.charging = false;
      h.chargeBoostKind = frac >= c.critAt ? 'crit' : frac >= c.miniAt ? 'mini' : null;
      h.chargeBoostT = h.chargeBoostKind ? R.chargeGrace : 0;
      h.chargeMeter = why === 'blast' ? Math.max(0, 1 - frac) : 0;
      const speed = Math.hypot(h.vel.x, h.vel.z);
      if (speed > h.speed) { h.vel.x *= h.speed / speed; h.vel.z *= h.speed / speed; }
      this.events.push({ type: 'chargeEnd', hero: h.id, why });
    }

    stepCharge(h, dt) {
      const c = h.mods.charge;
      if (h.chargeBoostT > 0) h.chargeBoostT = Math.max(0, h.chargeBoostT - dt);
      if (!h.charging) {
        h.chargeMeter = Math.min(1, h.chargeMeter + dt / c.cool);
        return;
      }
      h.chargeRun += dt;
      h.chargeMeter = Math.max(0, 1 - h.chargeRun / c.time);
      for (const t of this.victims) {
        if (t === h || !t.alive || t.team === h.team) continue;
        if (Math.hypot(t.pos.x - h.pos.x, t.pos.z - h.pos.z) > h.r + t.r + 0.1) continue;
        if (h.pos.y >= t.pos.y + t.h || h.pos.y + h.h <= t.pos.y) continue;
        this.events.push({ type: 'ram', hero: h.id, dst: t.id });
        this.endCharge(h, 'ram');
        const died = this.damage(t, c.ram + c.ramPerNotch * h.notches, { by: h, def: T.WEAPONS.lid });
        if (!died && !t.fixed) {
          const d = T.dir(h.yaw, 0);
          this.knock(t, d.x * R.ramPush, R.ramLift, d.z * R.ramPush);
        }
        return;
      }
      if (h.chargeRun >= c.time) this.endCharge(h, 'time');
      else if (h.wall && h.blocked > 0.5) this.endCharge(h, 'wall');
      else if (h.level >= 2) this.endCharge(h, 'water');
    }

    heal(t, amount, cap) {
      if (t.hp >= cap || amount <= 0) return 0;
      const before = t.hp;
      t.hp = Math.min(cap, t.hp + (t.burnT > 0 ? amount * 0.5 : amount));
      return t.hp - before;
    }

    healRate(t) {
      const since = this.t - t.lastHurt;
      if (since <= R.healFrom) return R.healMin;
      if (since >= R.healTo) return R.healMax;
      return R.healMin + (R.healMax - R.healMin) * (since - R.healFrom) / (R.healTo - R.healFrom);
    }

    findPatient(h, def) {
      const eye = this.eye(h), d = T.dir(h.yaw, h.pitch);
      let best = null, bestPerp = Infinity;
      for (const t of this.heroes) {
        if (t === h || !t.alive || t.team !== h.team || t.cloaked) continue;
        const flat = Math.hypot(t.pos.x - eye.x, t.pos.z - eye.z);
        const cy = T.clamp(eye.y + d.y * flat, t.pos.y, t.pos.y + t.h);
        const dx = t.pos.x - eye.x, dy = cy - eye.y, dz = t.pos.z - eye.z;
        const along = dx * d.x + dy * d.y + dz * d.z;
        if (along <= 0 || along > def.range) continue;
        const perp = Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - along * along));
        if (perp > t.r + def.aimR || perp >= bestPerp) continue;
        if (!this.world.clear(eye.x, eye.y, eye.z, t.pos.x, cy, t.pos.z)) continue;
        best = t; bestPerp = perp;
      }
      return best;
    }

    ignite(t, by, def) {
      if (t.isBuilding || t.def.noBurn || t.uberT > 0 || t.level >= 1) return;
      if (t.burnT <= 0) t.burnTick = R.burnTick;
      t.burnT = T.clamp(t.burnT + def.burnAdd, def.burnMin, def.burnMax);
      t.burnBy = by;
    }

    knock(h, vx, vy, vz) {
      const k = h.def.knockMul || 1;
      h.vel.x += vx * k; h.vel.y += vy * k; h.vel.z += vz * k;
      if (h.vel.y > 0) {
        if (h.onGround) h.startY = h.peakY = h.pos.y;
        h.onGround = false;
      }
      h.climbing = false;
      h.ladderLock = R.ladderLock;
      h.leap = 0;
    }

    startDisguise(h, merc, team) {
      if (!merc || h.flag) return;
      h.disguiseTo = { merc, team };
      h.disguiseT = h.disguise ? R.disguiseChange : R.disguiseTime;
      this.events.push({ type: 'disguising', hero: h.id, merc, team });
    }

    dropDisguise(h) {
      if (!h.disguise && !h.disguiseTo) return;
      h.disguise = null; h.disguiseTo = null; h.disguiseT = 0; h.disguised = false;
      this.events.push({ type: 'undisguised', hero: h.id });
    }

    toggleCloak(h) {
      if (h.cloakState === 'off') {
        if (h.cloakMeter < R.cloakMin || h.flag) return;
        h.cloakState = 'in';
        h.cloakT = R.cloakIn;
        h.cloaked = true;
        this.events.push({ type: 'cloak', hero: h.id });
      } else if (h.cloakState === 'in' || h.cloakState === 'on') {
        h.cloakState = 'out';
        h.cloakT = R.cloakOut;
        h.cloaked = false;
        this.events.push({ type: 'decloak', hero: h.id });
      }
    }

    stepDisguise(h, dt) {
      h.disguiseT -= dt;
      if (h.disguiseT > 0) return;
      h.disguiseT = 0;
      h.disguise = h.disguiseTo;
      h.disguiseTo = null;
      h.disguised = h.disguise.team !== h.team;
      this.events.push({ type: 'disguised', hero: h.id, merc: h.disguise.merc, team: h.disguise.team });
    }

    stepSpy(h, dt) {
      if (h.blinkT > 0) h.blinkT = Math.max(0, h.blinkT - dt);
      if (h.cloakState === 'off') {
        h.cloakMeter = Math.min(1, h.cloakMeter + dt / R.cloakRecharge);
      } else if (h.cloakState === 'out') {
        h.cloakT -= dt;
        if (h.cloakT <= 0) h.cloakState = 'off';
      } else {
        h.cloakMeter = Math.max(0, h.cloakMeter - dt / R.cloakDrain);
        if (h.cloakState === 'in') {
          h.cloakT -= dt;
          if (h.cloakT <= 0) h.cloakState = 'on';
        }
        if (h.cloakMeter <= 0) this.toggleCloak(h);
      }
    }

    debugBoost(h, kind) {
      if (kind === 'crit') h.critT = R.debugBoost;
      else h.miniT = R.debugBoost;
    }

    boostOf(h) { return h.critT > 0 ? 'crit' : h.miniT > 0 ? 'mini' : null; }

    eye(h) { return { x: h.pos.x, y: h.pos.y + this.eyeHeight(h), z: h.pos.z }; }

    distanceHu(a, b) {
      if (b.isBuilding) return 512;
      return Math.hypot(a.pos.x - b.pos.x, a.pos.y + a.h / 2 - b.pos.y - b.h / 2, a.pos.z - b.pos.z) / HU;
    }

    mineOnRay(team, ox, oy, oz, dx, dy, dz, maxT) {
      let best = maxT, mine = null;
      for (const p of this.proj) {
        if (p.dead || p.def.flight !== 'mine' || p.team === team) continue;
        const q = raySphere(p.x, p.y, p.z, R.mineHit, ox, oy, oz, dx, dy, dz, best);
        if (q !== null && q < best) { best = q; mine = p; }
      }
      return mine ? { t: best, mine } : null;
    }

    trace(h, ox, oy, oz, dx, dy, dz, maxT) {
      const w = this.world.raycast(ox, oy, oz, dx, dy, dz, maxT);
      let best = w ? w.t : maxT, body = null;
      for (const t of this.victims) {
        if (t === h || !t.alive || t.team === h.team) continue;
        const q = rayBody(t, ox, oy, oz, dx, dy, dz, best);
        if (q !== null && q < best) { best = q; body = t; }
      }
      const m = this.mineOnRay(h.team, ox, oy, oz, dx, dy, dz, best);
      if (m) return { t: m.t, body: null, mine: m.mine };
      if (!w && !body) return null;
      return { t: best, body, mine: null };
    }

    launch(h, def, boost, speed) {
      const eye = this.eye(h), b = T.aimBasis(h.yaw, h.pitch);
      const hit = this.trace(h, eye.x, eye.y, eye.z, b.f.x, b.f.y, b.f.z, 160);
      const far = hit ? hit.t : 160;
      const side = 0.2 * Math.cos(h.pitch);
      let mx = eye.x + b.f.x * 0.4 + b.r.x * side - b.u.x * 0.12;
      let my = eye.y + b.f.y * 0.4 + b.r.y * side - b.u.y * 0.12;
      let mz = eye.z + b.f.z * 0.4 + b.r.z * side - b.u.z * 0.12;
      if (!this.world.clear(eye.x, eye.y, eye.z, mx, my, mz)) { mx = eye.x; my = eye.y; mz = eye.z; }
      let dx = b.f.x, dy = b.f.y, dz = b.f.z;
      if (far > 1.2 && !def.lift) {
        dx = eye.x + b.f.x * far - mx; dy = eye.y + b.f.y * far - my; dz = eye.z + b.f.z * far - mz;
      }
      dy += def.lift || 0;
      const l = Math.hypot(dx, dy, dz);
      const p = {
        x: mx, y: my, z: mz, vx: dx / l * speed, vy: dy / l * speed, vz: dz / l * speed, owner: h, team: h.team, def, boost,
        age: 0, life: def.flight === 'mine' ? Infinity : def.flight === 'needle' ? R.needleLife : R.rocketLife,
        gravity: def.gravity || 0, armT: def.arm || 0, bounced: false, stuck: false, dead: false
      };
      this.proj.push(p);
      return p;
    }

    addMine(h, def, boost, speed) {
      const own = this.proj.filter(p => !p.dead && p.owner === h && p.def.flight === 'mine');
      if (own.length >= def.maxMines) this.explode(own[0], null);
      this.launch(h, def, boost, speed);
    }

    detonate(h) {
      let any = false;
      for (const p of this.proj) {
        if (!p.dead && p.owner === h && p.def.flight === 'mine' && p.armT <= 0) { this.explode(p, null); any = true; }
      }
      return any;
    }

    breakMine(p) {
      p.dead = true;
      this.events.push({ type: 'fizzle', x: p.x, y: p.y, z: p.z });
    }

    smashMineAt(h, eye, d, range) {
      const m = this.mineOnRay(h.team, eye.x, eye.y, eye.z, d.x, d.y, d.z, range);
      if (m) this.breakMine(m.mine);
    }

    explode(p, direct) {
      p.dead = true;
      const flat = p.def.flatAfter !== undefined && p.age >= p.def.flatAfter;
      this.blast(p.x, p.y, p.z, p.owner, p.def, p.boost, direct, flat);
    }

    bounce(p, w, dx, dy, dz, best) {
      const back = Math.max(0, best - 0.02);
      p.x += dx * back; p.y += dy * back; p.z += dz * back;
      const into = p.vx * w.nx + p.vy * w.ny + p.vz * w.nz;
      const e = p.def.bounce;
      p.vx = (p.vx - 2 * into * w.nx) * e; p.vy = (p.vy - 2 * into * w.ny) * e; p.vz = (p.vz - 2 * into * w.nz) * e;
      p.bounced = true;
      if (Math.hypot(p.vx, p.vy, p.vz) < R.restSpeed && w.ny > 0.5) { p.vx = p.vy = p.vz = 0; p.stuck = true; }
    }

    pushOffBody(p) {
      p.vx *= -0.3; p.vz *= -0.3;
      p.bounced = true;
    }

    projectileHit(p, w, body, best, dx, dy, dz) {
      const flight = p.def.flight;
      const back = Math.max(0, best - R.blastBack);
      if (flight === 'rocket') {
        p.x += dx * back; p.y += dy * back; p.z += dz * back;
        this.explode(p, body);
      } else if (flight === 'needle') {
        p.dead = true;
        if (body) this.damage(body, T.hitDamage(p.def, this.distanceHu(p.owner, body), p.boost), { by: p.owner, def: p.def, boost: p.boost });
      } else if (flight === 'grenade') {
        if (body && !p.bounced) {
          p.x += dx * back; p.y += dy * back; p.z += dz * back;
          this.explode(p, body);
        } else if (body) {
          this.pushOffBody(p);
        } else {
          this.bounce(p, w, dx, dy, dz, best);
        }
      } else if (body) {
        this.pushOffBody(p);
      } else if (w.s && (w.s.only || w.s.oneWay)) {
        this.bounce(p, w, dx, dy, dz, best);
      } else {
        p.x += dx * back + w.nx * 0.04; p.y += dy * back + w.ny * 0.04; p.z += dz * back + w.nz * 0.04;
        p.vx = p.vy = p.vz = 0;
        p.stuck = true;
      }
    }

    stepProjectiles(dt) {
      for (const p of this.proj) {
        if (p.dead) continue;
        p.age += dt;
        const def = p.def;
        if (def.fuse && p.age >= def.fuse) { this.explode(p, null); continue; }
        if (p.age > p.life) { p.dead = true; continue; }
        if (p.armT > 0) p.armT -= dt;
        if (p.stuck) continue;
        p.vy -= R.gravity * p.gravity * dt;
        const speed = Math.hypot(p.vx, p.vy, p.vz);
        if (speed < 1e-3) continue;
        const stride = speed * dt, dx = p.vx / speed, dy = p.vy / speed, dz = p.vz / speed;
        const w = this.world.raycast(p.x, p.y, p.z, dx, dy, dz, stride, def.flight === 'mine' || def.flight === 'grenade', true);
        let best = w ? w.t : stride, body = null;
        for (const t of this.victims) {
          if (!t.alive || t === p.owner || t.team === p.team) continue;
          const q = rayBody(t, p.x, p.y, p.z, dx, dy, dz, best);
          if (q !== null && q < best) { best = q; body = t; }
        }
        if (def.flight === 'needle') {
          const m = this.mineOnRay(p.team, p.x, p.y, p.z, dx, dy, dz, best);
          if (m) { this.breakMine(m.mine); p.dead = true; continue; }
        }
        if (w || body) { this.projectileHit(p, w, body, best, dx, dy, dz); continue; }
        p.x += dx * stride; p.y += dy * stride; p.z += dz * stride;
      }
      this.proj = this.proj.filter(p => !p.dead);
    }

    selfDamage(h, def, frac) {
      const s = def.self;
      if (!s) return def.dmg * frac;
      const air = !h.onGround;
      return T.clamp(def.dmg * frac * (air ? s.air : 1), s.min, air ? s.airMax : s.groundMax);
    }

    blast(x, y, z, owner, def, boost, direct, flat) {
      const radius = def.radius;
      const splashDef = { dmg: def.splash || def.dmg, ramp: flat ? undefined : def.ramp };
      const directDef = { dmg: def.dmg, ramp: flat ? undefined : def.ramp };
      this.events.push({ type: 'boom', x, y, z, r: radius, hero: owner.id });
      for (const h of this.victims.slice()) {
        if (!h.alive) continue;
        const self = h === owner;
        if (self && def.noSelf) continue;
        if (!self && h.team === owner.team) continue;
        const cy = T.clamp(y, h.pos.y, h.pos.y + h.h);
        const dist = Math.hypot(h.pos.x - x, cy - y, h.pos.z - z);
        if (h !== direct) {
          if (dist > radius) continue;
          if (!this.world.clear(x, y, z, h.pos.x, h.pos.y + h.h / 2, h.pos.z)) continue;
        }
        const frac = h === direct ? 1 : 1 - 0.5 * dist / radius;
        const hitDef = h === direct ? directDef : splashDef;
        const amount = self ? this.selfDamage(h, def, frac) : T.hitDamage(hitDef, this.distanceHu(owner, h), boost) * frac;
        const died = this.damage(h, amount, { by: owner, def, boost, element: 'blast' });
        if (died || h.fixed) continue;
        let nx = h.pos.x - x, ny = h.pos.y + h.h / 2 - y, nz = h.pos.z - z;
        let l = Math.hypot(nx, ny, nz);
        if (l < 1e-5) { nx = 0; ny = 1; nz = 0; l = 1; }
        nx /= l; ny /= l; nz /= l;
        if (!self && h.onGround && ny < R.knockLift) {
          ny = R.knockLift;
          l = Math.hypot(nx, ny, nz);
          nx /= l; ny /= l; nz /= l;
        }
        const speed = R.knockPerDamage * def.dmg * frac * (def.knock || 1);
        this.knock(h, nx * speed * R.knockFlat, ny * speed, nz * speed * R.knockFlat);
      }
      for (const p of this.proj) {
        if (p.dead || p.def.flight !== 'mine' || p.team === owner.team) continue;
        const dist = Math.hypot(p.x - x, p.y - y, p.z - z);
        if (dist > radius) continue;
        const l = dist || 1, push = R.minePush * (1 - dist / radius);
        p.stuck = false;
        p.vx += (p.x - x) / l * push; p.vy += (p.y - y) / l * push + 1.5; p.vz += (p.z - z) / l * push;
      }
    }

    airblast(h, def) {
      const eye = this.eye(h), d = T.dir(h.yaw, h.pitch);
      this.events.push({ type: 'airblast', hero: h.id, x: eye.x + d.x * 2, y: eye.y + d.y * 2, z: eye.z + d.z * 2 });
      const ahead = (x, y, z) => {
        const dx = x - eye.x, dy = y - eye.y, dz = z - eye.z, l = Math.hypot(dx, dy, dz);
        if (l > def.blastRange) return false;
        return l < 0.6 || (dx * d.x + dy * d.y + dz * d.z) / l >= def.blastCos;
      };
      for (const p of this.proj) {
        if (p.dead || p.team === h.team || !ahead(p.x, p.y, p.z)) continue;
        if (p.def.flight === 'needle') continue;
        if (p.def.flight === 'mine') {
          p.stuck = false;
          p.vx = d.x * def.blastMine; p.vy = d.y * def.blastMine + 2; p.vz = d.z * def.blastMine;
          continue;
        }
        const speed = Math.hypot(p.vx, p.vy, p.vz) || p.def.speed;
        p.vx = d.x * speed; p.vy = d.y * speed; p.vz = d.z * speed;
        p.team = h.team;
        p.owner = h;
        p.boost = p.boost === 'crit' ? 'crit' : 'mini';
        p.age = 0;
        p.bounced = false;
        p.stuck = false;
        this.events.push({ type: 'reflect', hero: h.id, x: p.x, y: p.y, z: p.z });
      }
      for (const t of this.heroes) {
        if (t === h || !t.alive) continue;
        const mid = t.pos.y + t.h / 2;
        if (!ahead(t.pos.x, mid, t.pos.z) || !this.world.clear(eye.x, eye.y, eye.z, t.pos.x, mid, t.pos.z)) continue;
        if (t.team === h.team) {
          if (t.burnT > 0) {
            t.burnT = 0;
            this.heal(h, R.extinguishHeal, h.maxHp);
            this.events.push({ type: 'extinguish', hero: h.id, dst: t.id });
          }
        } else if (!t.fixed) {
          if (t.charging) this.endCharge(t, 'blast');
          const f = Math.hypot(d.x, d.z) || 1;
          this.knock(t, d.x / f * def.blastPush, def.blastLift, d.z / f * def.blastPush);
        }
      }
    }

    dropItem(o) {
      this.drops.push(Object.assign({ vx: 0, vy: 0, vz: 0, moving: !!o.vx, age: 0, owner: null, sandwich: false }, o));
    }

    throwFood(h, a) {
      const def = a.def, eye = this.eye(h), d = T.dir(h.yaw, h.pitch);
      this.drops = this.drops.filter(i => !(i.sandwich && i.owner === h));
      a.cooldown = def.cooldown;
      this.dropItem({
        kind: 'health', size: def.dropSize, x: eye.x + d.x * 0.6, y: eye.y + d.y * 0.6 - 0.2, z: eye.z + d.z * 0.6,
        vx: d.x * def.throwSpeed, vy: d.y * def.throwSpeed + 2, vz: d.z * def.throwSpeed, moving: true, life: def.dropLife, owner: h, sandwich: true
      });
      this.events.push({ type: 'throw', hero: h.id });
    }

    stepDrops(dt) {
      for (const i of this.drops) {
        i.age += dt;
        if (!i.moving) continue;
        i.vy -= R.gravity * dt;
        const speed = Math.hypot(i.vx, i.vy, i.vz), stride = speed * dt;
        const dx = i.vx / speed, dy = i.vy / speed, dz = i.vz / speed;
        const w = this.world.raycast(i.x, i.y, i.z, dx, dy, dz, stride);
        if (w) {
          i.x += dx * Math.max(0, w.t - 0.05); i.y += dy * Math.max(0, w.t - 0.05); i.z += dz * Math.max(0, w.t - 0.05);
          if (w.ny > 0.5) { i.moving = false; i.vx = i.vy = i.vz = 0; }
          else { i.vx *= -0.2; i.vz *= -0.2; }
        } else {
          i.x += i.vx * dt; i.y += i.vy * dt; i.z += i.vz * dt;
        }
      }
      this.drops = this.drops.filter(i => i.age < i.life);
    }

    takeItem(h, item) {
      if (item.kind === 'metal') {
        if (!h.mods.metal || h.metal >= R.metalMax) return false;
        h.metal = Math.min(R.metalMax, h.metal + item.metal);
        return true;
      }
      if (item.kind === 'ammo') {
        let took = false;
        if (h.mods.watch && h.cloakMeter < 1) {
          h.cloakMeter = Math.min(1, h.cloakMeter + item.size);
          took = true;
        }
        if (h.mods.charge && !h.charging && h.chargeMeter < 1) {
          h.chargeMeter = Math.min(1, h.chargeMeter + h.mods.charge.crateFill[item.size]);
          took = true;
        }
        if (h.mods.metal && h.metal < R.metalMax) {
          h.metal = Math.min(R.metalMax, h.metal + R.metalBySize[item.size]);
          took = true;
        }
        for (const a of h.arms) {
          if (!a.def.reserve || a.reserve >= a.def.reserve) continue;
          a.reserve = Math.min(a.def.reserve, a.reserve + Math.ceil(a.def.reserve * item.size));
          took = true;
        }
        return took;
      }
      if (item.sandwich && item.owner === h) {
        const own = h.arms.find(a => a.def.kind === 'food');
        if (own) own.cooldown = 0;
        h.burnT = 0;
        return true;
      }
      if (h.hp < h.maxHp || h.burnT > 0) {
        h.hp = Math.max(h.hp, Math.min(h.maxHp, h.hp + h.maxHp * item.size));
        h.burnT = 0;
        return true;
      }
      const food = h.arms.find(a => a.def.kind === 'food' && a.cooldown > 0);
      if (food) { food.cooldown = 0; return true; }
      return false;
    }

    reaches(h, item) {
      return Math.hypot(h.pos.x - item.x, h.pos.z - item.z) <= R.pickupReach && item.y >= h.pos.y - 0.5 && item.y <= h.pos.y + h.h;
    }

    refill(h) {
      let gave = h.burnT > 0 || h.hp < h.maxHp || (h.mods.metal && h.metal < R.metalMax) || (h.mods.watch && h.cloakMeter < 1) || (h.mods.charge && !h.charging && h.chargeMeter < 1);
      if (h.mods.charge && !h.charging) h.chargeMeter = 1;
      if (h.mods.watch) h.cloakMeter = 1;
      if (h.mods.metal) h.metal = R.metalMax;
      h.burnT = 0;
      h.hp = Math.max(h.hp, h.maxHp);
      for (const a of h.arms) {
        if ((a.def.reserve && a.reserve < a.def.reserve) || (a.def.clip && a.clip < a.def.clip) || a.cooldown > 0) gave = true;
        a.reserve = a.def.reserve || 0;
        a.clip = a.def.clip || 0;
        a.cooldown = 0;
      }
      return gave;
    }

    stepPickups(h) {
      for (const p of this.pickups) {
        if (this.t < p.readyAt || !this.reaches(h, p)) continue;
        if (this.takeItem(h, p)) {
          p.readyAt = this.t + R.pickupRespawn;
          this.events.push({ type: 'pickup', hero: h.id, kind: p.kind, size: p.size });
        }
      }
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const item = this.drops[i];
        if (item.moving || (item.owner === h && item.age < R.ownerGrace)) continue;
        if (!this.reaches(h, item) || !this.takeItem(h, item)) continue;
        this.drops.splice(i, 1);
        this.events.push({ type: 'pickup', hero: h.id, kind: item.kind, size: item.size });
      }
      if (h.flag && this.map.lockers.some(l => Math.hypot(h.pos.x - l.x, h.pos.z - l.z) <= R.lockerReach && Math.abs(h.pos.y - l.y) <= 1)) this.mode.drop(h);
      if (this.t < h.lockerReady) return;
      for (const l of this.map.lockers) {
        if (Math.hypot(h.pos.x - l.x, h.pos.z - l.z) > R.lockerReach || Math.abs(h.pos.y - l.y) > 1) continue;
        if (this.refill(h)) {
          h.lockerReady = this.t + R.lockerCooldown;
          this.events.push({ type: 'locker', hero: h.id });
        }
      }
    }

    selectSlot(h, i) {
      if (i === h.slot || !h.arms[i]) return;
      const old = T.KINDS[h.arms[h.slot].def.kind];
      if (old.leave) old.leave(this, h, h.arms[h.slot]);
      h.lastSlot = h.slot;
      h.slot = i;
      h.deployT = R.deploy;
      h.reloading = false;
      h.wantReload = false;
      h.swing = null;
      h.ghost = null;
      this.events.push({ type: 'switch', hero: h.id, weapon: h.arms[i].def.id });
    }

    startReload(h, a) {
      h.reloading = true;
      h.reloadT = a.def.reload[0];
      h.wantReload = false;
      this.events.push({ type: 'reload', hero: h.id, weapon: a.def.id });
    }

    reloadStep(h, a) {
      const def = a.def;
      if (def.reload.length === 1) {
        const take = Math.min(def.clip - a.clip, a.reserve);
        a.clip += take; a.reserve -= take;
        h.reloading = false;
        return;
      }
      a.clip++; a.reserve--;
      this.events.push({ type: 'shell', hero: h.id, weapon: def.id });
      if (a.clip < def.clip && a.reserve > 0) h.reloadT += def.reload[1];
      else h.reloading = false;
    }

    attack(h, a) {
      const def = a.def;
      if (h.charging) this.endCharge(h, 'swing');
      const boost = this.boostOf(h) || (def.kind === 'melee' && h.chargeBoostT > 0 ? h.chargeBoostKind : null);
      if (def.clip) a.clip--;
      h.fireCd = def.interval;
      h.wantReload = false;
      this.dropDisguise(h);
      this.events.push({ type: 'shot', hero: h.id, weapon: def.id, boost });
      T.KINDS[def.kind].attack(this, h, a, boost);
      a.lastShot = this.t;
    }

    stepArms(h, inp, dt) {
      if (!h.arms.length) return;
      h.fireCd = Math.max(0, h.fireCd - dt);
      h.deployT = Math.max(0, h.deployT - dt);
      h.critT = Math.max(0, h.critT - dt);
      h.miniT = Math.max(0, h.miniT - dt);
      h.speedCap = Infinity;
      h.noJump = false;
      h.healing = false;
      h.stabReady = false;
      if (h.frozen || h.disarmed) return;
      const carrying = !!(h.ghost && h.ghost.carried);
      if (!carrying) {
        if (inp.slot) this.selectSlot(h, inp.slot - 1);
        else if (inp.next) this.selectSlot(h, (h.slot + inp.next + h.arms.length) % h.arms.length);
        else if (inp.last) this.selectSlot(h, h.lastSlot);
      }
      if (h.swing) {
        h.swing.t -= dt;
        if (h.swing.t <= 0) {
          const s = h.swing;
          h.swing = null;
          T.KINDS.melee.resolve(this, h, s.def, s.boost);
        }
      }
      if (h.cloakState !== 'off') inp = Object.assign({}, inp, { fire: false });
      const a = h.arms[h.slot], def = a.def, kind = T.KINDS[def.kind];
      if (def.backstab) {
        const t = kind.target(this, h, def);
        h.stabReady = !!t && !t.isBuilding && t.uberT <= 0 && kind.inRear(h, t);
      }
      if (inp.reload && def.clip) h.wantReload = true;
      if (h.reloading) {
        h.reloadT -= dt;
        if (h.reloadT <= 0) this.reloadStep(h, a);
      }
      const alt = !!inp.fire2 && !h.fire2Held;
      h.fire2Held = !!inp.fire2;
      const press = !!inp.fire && !h.fireHeld;
      h.fireHeld = !!inp.fire;
      if (h.ghost) {
        T.Build.ghostStep(this, h, press, alt);
        return;
      }
      if (alt && kind.alt) {
        kind.alt(this, h, a);
        if (h.ghost) return;
      }
      if (kind.update) {
        kind.update(this, h, a, inp, dt, alt, press);
      } else if ((inp.fire || (def.altSwing && inp.fire2)) && h.deployT <= 0 && h.fireCd <= 0 && !h.swing) {
        if (!def.clip) {
          this.attack(h, a);
        } else if (a.clip > 0) {
          if (!h.reloading || def.reload.length > 1) {
            h.reloading = false;
            this.attack(h, a);
          }
        } else if (a.reserve <= 0) {
          h.fireCd = R.dryDelay;
          this.events.push({ type: 'dry', hero: h.id, weapon: def.id });
        }
      }
      if (alt && !kind.usesAlt) {
        if (!this.detonate(h)) {
          if (h.mods.watch) this.toggleCloak(h);
          else if (h.mods.charge) this.startCharge(h);
        }
      }
      if (h.charging) h.noJump = true;
      if (def.clip && !h.reloading && !h.chargeT && h.fireCd <= 0 && h.deployT <= 0 && a.clip < def.clip && a.reserve > 0 && (h.wantReload || a.clip === 0)) this.startReload(h, a);
    }

    stepBody(h, dt) {
      if (h.disguiseT > 0) this.stepDisguise(h, dt);
      if (h.mods.watch) this.stepSpy(h, dt);
      if (h.burnT > 0) {
        if (h.level >= 1) {
          h.burnT = 0;
        } else {
          h.burnT -= h.cloaked ? dt * R.cloakBurn : dt;
          h.burnTick -= dt;
          if (h.burnTick <= 0) {
            h.burnTick += R.burnTick;
            this.damage(h, R.burnDamage, { by: h.burnBy, cause: 'burn', element: 'fire' });
          }
        }
      }
      if (h.uberT > 0) h.uberT = Math.max(0, h.uberT - dt);
      if (h.hp > h.maxHp) h.hp = Math.max(h.maxHp, h.hp - (h.overHp - h.maxHp) / R.overDecay * dt);
      if (h.def.regen && h.hp < h.maxHp) {
        const since = Math.min(1, (this.t - h.lastHurt) / R.regenFull);
        const rate = (R.regenMin + (R.regenMax - R.regenMin) * since) * (h.healing ? 2 : 1);
        h.hp = Math.min(h.maxHp, h.hp + rate * dt);
      }
      for (const a of h.arms) if (a.cooldown > 0) a.cooldown = Math.max(0, a.cooldown - dt);
      if (h.eatT > 0) {
        const a = h.eatArm;
        h.eatT -= dt;
        this.heal(h, a.def.heal / a.def.eatTime * dt, h.maxHp);
        if (h.eatT <= 0) {
          if (!a.wasted) a.cooldown = a.def.cooldown;
          h.eatT = 0;
          h.eatArm = null;
        }
      }
      h.frozen = h.eatT > 0;
    }

    waterLevel(h) {
      const top = this.world.waterTop(h.pos.x, h.pos.y, h.pos.z);
      if (top === -Infinity) return 0;
      const depth = top - h.pos.y;
      if (depth < R.ankle) return 1;
      return depth < R.eyeStand ? 2 : 3;
    }

    eyeHeight(h) { return R.eyeStand + (R.eyeCrouch - R.eyeStand) * h.duck; }

    updateCrouch(h, inp, swimming, dt) {
      const want = !!inp.crouch && !swimming;
      if (want && !h.crouched) {
        if (!h.onGround) { h.pos.y += R.tuck; h.duck = 1; }
        h.crouched = true;
        h.h = R.crouchH;
      } else if (!want && h.crouched) {
        let feet = h.pos.y;
        if (!h.onGround) {
          const g = this.world.groundAt(h.pos.x, h.pos.z, feet, h.r * 0.55, h);
          feet = Math.max(feet - R.tuck, g);
        }
        if (this.world.fits(h, h.pos.x, h.pos.z, feet, R.standH)) {
          if (!h.onGround) h.duck = 0;
          h.pos.y = feet;
          h.crouched = false;
          h.h = R.standH;
        }
      }
      const rate = dt / R.duckTime;
      h.duck = h.crouched ? Math.min(1, h.duck + rate) : Math.max(0, h.duck - rate);
    }

    wishSpeed(h, inp) {
      let s = Math.min(h.speed, h.speedCap, h.disguise ? T.MERCS[h.disguise.merc].speed : Infinity);
      if (inp.fwd < 0) s *= R.backMul;
      if (h.crouched && h.onGround) s *= R.crouchMul;
      if (h.level >= 2) s *= R.waterMul;
      return s;
    }

    wishDir(h, inp) {
      let f = inp.fwd, s = inp.side;
      const l = Math.hypot(f, s);
      if (l < 1e-6) return { x: 0, z: 0, on: false };
      f /= l; s /= l;
      const sy = Math.sin(h.yaw), cy = Math.cos(h.yaw);
      return { x: sy * f - cy * s, z: cy * f + sy * s, on: true };
    }

    groundMove(h, inp, dt) {
      const v = h.vel;
      const speed = Math.hypot(v.x, v.z);
      if (speed > 1e-4) {
        const drop = Math.max(speed, R.stopSpeed) * R.friction * dt;
        const k = Math.max(0, speed - drop) / speed;
        v.x *= k; v.z *= k;
      }
      const w = this.wishDir(h, inp);
      if (w.on) {
        const wish = this.wishSpeed(h, inp);
        const add = wish - (v.x * w.x + v.z * w.z);
        if (add > 0) {
          const a = Math.min(R.groundAccel * wish * dt, add);
          v.x += w.x * a; v.z += w.z * a;
        }
      }
    }

    airMove(h, inp, dt) {
      const w = this.wishDir(h, inp);
      if (!w.on) return;
      const v = h.vel;
      const before = Math.hypot(v.x, v.z);
      v.x += w.x * R.airAccel * dt; v.z += w.z * R.airAccel * dt;
      const cap = Math.max(before, h.speed);
      const after = Math.hypot(v.x, v.z);
      if (after > cap) { v.x *= cap / after; v.z *= cap / after; }
    }

    jump(h) {
      const v = h.vel;
      const speed = Math.hypot(v.x, v.z), cap = h.speed;
      if (speed > cap) { v.x *= cap / speed; v.z *= cap / speed; }
      v.y = JUMP_V;
      h.onGround = false;
      h.jumpBuf = 0;
      h.startY = h.peakY = h.pos.y;
    }

    doubleJump(h, inp) {
      const w = this.wishDir(h, inp);
      const v = h.vel;
      if (w.on) { v.x = w.x * h.speed; v.z = w.z * h.speed; }
      v.y = JUMP_V;
      h.usedDouble = true;
      h.jumpBuf = 0;
    }

    climb(h, inp, ladder) {
      const v = h.vel;
      const sy = Math.sin(h.yaw), cy = Math.cos(h.yaw);
      const towards = sy * ladder.fx + cy * ladder.fz;
      let up = inp.fwd;
      if (inp.fwd > 0 && h.pitch < -0.6) up = -1;
      if (inp.fwd > 0 && towards < -0.3) up = 0;
      v.y = up * R.climbSpeed;
      const w = this.wishDir(h, inp);
      const drift = towards < -0.3 ? h.def.speed * 0.5 : R.climbDrift;
      v.x = w.on ? w.x * drift : 0;
      v.z = w.on ? w.z * drift : 0;
      if (h.jumpBuf > 0) {
        h.jumpBuf = 0;
        h.ladderLock = R.ladderLock;
        h.climbing = false;
        v.x = -ladder.fx * 3; v.z = -ladder.fz * 3; v.y = JUMP_V * 0.6;
      }
    }

    swim(h, inp, dt, top) {
      const v = h.vel;
      const speed = this.wishSpeed(h, inp);
      const w = this.wishDir(h, inp);
      const pitchK = inp.fwd ? Math.sin(h.pitch) * Math.sign(inp.fwd) : 0;
      const flat = inp.fwd ? Math.cos(h.pitch) : 1;
      const wx = w.on ? w.x * flat * speed : 0, wz = w.on ? w.z * flat * speed : 0;
      let wy = pitchK * speed;
      if (inp.jump) wy = speed;
      else if (inp.crouch) wy = -speed;
      const floatDepth = R.eyeStand - 0.1;
      const depth = top - h.pos.y;
      if (wy === 0 && depth > floatDepth) wy = Math.min(speed, 0.8);
      const k = Math.min(1, dt * 6);
      v.x += (wx - v.x) * k; v.z += (wz - v.z) * k; v.y += (wy - v.y) * k;
      if (depth <= floatDepth && v.y > 0) v.y = (floatDepth - depth) * -3;
      if (inp.jump && h.wall && depth <= floatDepth + 0.3) {
        const need = h.wall.top + 0.15 - h.pos.y;
        if (need > 0 && h.wall.top - top <= 0.95) {
          v.y = Math.sqrt(2 * R.gravity * need);
          v.x = -h.wall.nx * 2.5; v.z = -h.wall.nz * 2.5;
          h.leap = 0.6;
        }
      }
    }

    land(h, fall) {
      h.usedDouble = false;
      const level = this.waterLevel(h);
      let dmg = 0;
      if (fall > R.fallSafe && level === 0) dmg = h.maxHp * (fall / HU) * R.fallPctPerHu;
      this.events.push({ type: 'land', hero: h.id, fall, dmg, peak: h.peakY - h.startY, level });
      if (dmg > 0) this.hurt(h, dmg, 'fall');
      h.startY = h.peakY = h.pos.y;
    }

    moveHero(h, inp, dt) {
      const v = h.vel, world = this.world;
      h.level = this.waterLevel(h);
      h.leap = Math.max(0, h.leap - dt);
      const swimming = h.level >= 2 && !h.onGround && h.leap <= 0;
      this.updateCrouch(h, inp, swimming, dt);
      const pressed = !!inp.jump && !h.jumpHeld;
      h.jumpHeld = !!inp.jump;
      h.jumpBuf = pressed ? R.jumpBuffer : Math.max(0, h.jumpBuf - dt);
      h.ladderLock = Math.max(0, h.ladderLock - dt);

      let ladder = h.ladderLock > 0 || h.charging ? null : world.ladderAt(h.pos.x, h.pos.y, h.pos.z, h.r);
      if (ladder && h.onGround && inp.fwd <= 0) ladder = null;
      if (ladder && h.onGround) {
        const w = this.wishDir(h, inp);
        if (w.x * ladder.fx + w.z * ladder.fz < 0.3) ladder = null;
      }
      h.climbing = !!ladder;

      if (h.charging) {
        const d = T.dir(h.yaw, 0), c = h.mods.charge;
        v.x = d.x * c.speed;
        v.z = d.z * c.speed;
      } else if (ladder) {
        this.climb(h, inp, ladder);
      } else if (swimming) {
        this.swim(h, inp, dt, world.waterTop(h.pos.x, h.pos.y, h.pos.z));
      } else if (h.onGround) {
        this.groundMove(h, inp, dt);
        if (h.jumpBuf > 0 && !h.noJump) this.jump(h);
      } else {
        if (h.jumpBuf > 0 && h.def.double && !h.usedDouble && !h.noJump) this.doubleJump(h, inp);
        this.airMove(h, inp, dt);
      }

      const falling = !h.onGround && !h.climbing && !swimming;
      if (falling) v.y -= R.gravity * dt / 2;
      const wasGround = h.onGround, vyBefore = v.y;
      world.moveChar(h, dt);
      if (falling && !h.onGround) v.y -= R.gravity * dt / 2;
      if (h.pos.y > h.peakY) h.peakY = h.pos.y;
      if (!wasGround && h.onGround) this.land(h, Math.max(0, -vyBefore));
      if (wasGround && !h.onGround) { h.startY = h.peakY = Math.max(h.startY, h.pos.y); }

      if (h.level === 3) {
        h.breath -= dt;
        if (h.breath < 0) this.hurt(h, R.drown * dt, 'water');
      } else {
        h.breath = Math.min(R.breath, h.breath + dt * 4);
      }
      if (h.pos.y < this.map.killY) {
        this.events.push({ type: 'death', hero: h.id, cause: 'pit' });
        this.bury(h);
      }
    }

    bumped(h) {
      h.bumpedT = this.t;
      if (h.cloaked) h.blinkT = Math.max(h.blinkT, R.blink);
    }

    bumpBuildings() {
      for (const h of this.heroes) {
        if (!h.alive || h.fixed) continue;
        for (const b of this.buildings) {
          if (b.team === h.team || b.def.pad) continue;
          if (h.pos.y >= b.pos.y + b.h - 0.1 || h.pos.y + h.h <= b.pos.y) continue;
          const dx = h.pos.x - b.pos.x, dz = h.pos.z - b.pos.z, d = Math.hypot(dx, dz), min = h.r + b.r;
          if (d >= min || d < 1e-5) continue;
          this.shove(h, dx / d * (min - d), dz / d * (min - d));
        }
      }
    }

    separate() {
      this.bumpBuildings();
      const hs = this.heroes;
      for (let i = 0; i < hs.length; i++) {
        const a = hs[i];
        if (!a.alive) continue;
        for (let j = i + 1; j < hs.length; j++) {
          const b = hs[j];
          if (!b.alive || a.team === b.team || (a.fixed && b.fixed)) continue;
          const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
          const min = a.r + b.r;
          if (Math.abs(dx) > min || Math.abs(dz) > min) continue;
          if (a.pos.y > b.pos.y + b.h - 0.2 || b.pos.y > a.pos.y + a.h - 0.2) continue;
          const d = Math.hypot(dx, dz);
          if (d >= min || d < 1e-5) continue;
          this.bumped(a);
          this.bumped(b);
          const nx = dx / d, nz = dz / d, gap = min - d;
          const pa = a.fixed ? 0 : b.fixed ? gap : gap / 2, pb = b.fixed ? 0 : a.fixed ? gap : gap / 2;
          this.shove(a, -nx * pa, -nz * pa);
          this.shove(b, nx * pb, nz * pb);
        }
      }
    }

    shove(h, dx, dz) {
      if (!dx && !dz) return;
      const r = this.world.pushOut(h, h.pos.x + dx, h.pos.z + dz, h.onGround ? R.stepUp : 0.04);
      h.pos.x = r[0]; h.pos.z = r[1];
    }

    step(inp) {
      this.t += TICK;
      this.tickN++;
      this.events.length = 0;
      const given = inp || blankInput();
      if (this.aiReady) T.AI.tick(this);
      for (const h of this.heroes) {
        h.prev.x = h.pos.x; h.prev.y = h.pos.y; h.prev.z = h.pos.z;
        if (!h.alive) {
          if (h.respawnT > 0) {
            h.respawnT -= TICK;
            if (h.respawnT <= 0) this.respawn(h);
          }
          continue;
        }
        this.stepBody(h, TICK);
        if (h.fixed || !h.alive) continue;
        const own = h.human ? given : h.brain ? T.AI.think(this, h, TICK) : h.patrol ? this.patrolInput(h) : blankInput();
        if (h.human || h.brain) {
          if (h.charging) {
            const limit = h.mods.charge.turn * h.mods.turnMul * TICK;
            const want = Math.atan2(Math.sin(own.yaw - h.yaw), Math.cos(own.yaw - h.yaw));
            h.yaw += T.clamp(want, -limit, limit);
          } else {
            h.yaw = own.yaw;
          }
          h.pitch = own.pitch;
        }
        if (h.patrol) h.yaw = own.yaw;
        if (own.drop && h.flag) this.mode.drop(h);
        this.moveHero(h, h.frozen ? Object.assign(blankInput(), { yaw: own.yaw, pitch: own.pitch }) : own, TICK);
        if (!h.alive) continue;
        this.stepArms(h, own, TICK);
        if (h.mods.charge) this.stepCharge(h, TICK);
        this.stepPickups(h);
      }
      this.stepDrops(TICK);
      this.stepProjectiles(TICK);
      T.Build.step(this, TICK);
      T.Build.stepStanding(this);
      this.separate();
      if (this.mode) this.mode.step(TICK);
    }

    stateHash() {
      let s = this.tickN + ';';
      for (const h of this.heroes) {
        s += [h.merc, h.team, h.pos.x, h.pos.y, h.pos.z, h.vel.x, h.vel.y, h.vel.z, h.hp, h.breath, h.crouched ? 1 : 0, h.onGround ? 1 : 0, h.slot, h.fireCd, h.burnT, h.uberT, h.notches, h.chargeMeter].join(',') + ';';
        for (const a of h.arms) s += a.clip + '/' + a.reserve + '/' + a.charge + ';';
      }
      for (const p of this.proj) s += [p.x, p.y, p.z, p.team].join(',') + ';';
      for (const i of this.drops) s += [i.x, i.y, i.z].join(',') + ';';
      for (const b of this.buildings) s += [b.kind, b.level, b.hp, b.ammo, b.upgrade, b.buildLeft, b.aimYaw].join(',') + ';';
      if (this.mode) s += this.mode.hash();
      return T.hash(s);
    }
  }

  T.Game = Game;
  T.JUMP_V = JUMP_V;

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
