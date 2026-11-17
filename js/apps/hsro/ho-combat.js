(function (HO) {
  'use strict';
  const H = globalThis.Hsr98;
  const N = H.HD.N;
  const T = HO.TUN;
  const C = HO.CMB;
  const sec = s => Math.round(s * T.hz);
  const HARMFUL = new Set(['dot', 'debuff', 'stun', 'root', 'poly', 'freeze', 'imprison']);
  const CONTROL = new Set(['stun', 'poly', 'freeze']);

  HO.DENY = {
    dead: 'Вы без сознания',
    cast: 'Вы уже заняты',
    gcd: 'Умение ещё не готово',
    cd: 'Умение ещё не готово',
    level: 'Умение ещё не изучено',
    cost: 'Не хватает запаса',
    energy: 'Не хватает Энергии',
    ooc: 'Только вне боя',
    target: 'Нет подходящей цели',
    range: 'Цель слишком далеко',
    near: 'Цель слишком близко',
    sight: 'Цель вне поля зрения',
    facing: 'Цель должна быть перед вами',
    control: 'Вы не можете действовать',
    elite: 'На эту цель не действует',
    learn: 'Умение не изучено: загляните к наставнику',
    trainer: 'Рядом нет наставника',
    known: 'Это умение уже изучено',
    credits: 'Не хватает кредитов',
    far: 'Подойдите ближе'
  };

  const dist = (a, b) => { const dx = a.x - b.x, dz = a.z - b.z; return Math.sqrt(dx * dx + dz * dz); };

  function elemsOf(a, ab) {
    if (ab && ab.elems) return ab.elems;
    if (ab && ab.elem) return [ab.elem];
    return [HO.PATHS[a.path].elems[0]];
  }

  Object.assign(HO.World.prototype, {
    byUid(uid) {
      for (const a of this.state.actors) if (a.uid === uid) return a;
      return null;
    },

    heroes() {
      return this.state.actors.filter(a => a.kind === 'hero');
    },

    foes() {
      return this.state.actors.filter(a => a.kind === 'foe');
    },

    spawnNpcs() {
      for (const n of this.zone.npcs || []) {
        this.state.actors.push({
          uid: this.state.uid++, kind: 'npc', id: n.id, name: n.name, role: n.role || '', look: n.look || 'terminal', r: n.r || 0.6, h: n.h || 1.6,
          x: n.x, y: Math.max(0, this.floorBelow(n.x, n.z, 50, n.r || 0.6)), z: n.z, yaw: n.yaw || 0, vx: 0, vy: 0, vz: 0, ground: true, dead: false, auras: []
        });
      }
    },

    npcNear(a, uid, role) {
      const n = this.byUid(uid);
      if (!n || n.kind !== 'npc' || (role && n.role !== role)) return null;
      return dist(a, n) <= C.talkRange + n.r ? n : null;
    },

    learn(a, id) {
      const ab = HO.ABILITIES[id], sh = a.sheet;
      const near = this.state.actors.filter(n => n.kind === 'npc' && (n.role === 'trainer' || (n.trains && n.trains.includes(a.path))) && dist(a, n) <= C.talkRange + n.r);
      if (!near.length) return this.deny(a, 'trainer');
      if (!ab || ab.path !== a.path || ab.ult || ab.auto) return this.deny(a, 'level');
      const have = sh.learned[id] || 0;
      if (have >= HO.maxRank(id)) return this.deny(a, 'known');
      const lvl = HO.rankLevel(id, have + 1), cost = HO.trainCost(lvl);
      if (lvl > a.lvl) return this.deny(a, 'level');
      if (!near.some(n => lvl <= (n.trainMax || HO.MAX_LEVEL))) return this.deny(a, 'trainerCap');
      if (sh.credits < cost) return this.deny(a, 'credits');
      sh.credits -= cost;
      sh.learned[id] = have + 1;
      this.events.push({ k: 'learned', uid: a.uid, ab: id, rank: have + 1, cost });
      return true;
    },

    reward(f) {
      const d = HO.FOES[f.id];
      for (const k in f.threat) {
        const h = this.byUid(Number(k));
        if (!h || h.kind !== 'hero' || h.dead || dist(h, f) > C.groupRange) continue;
        const sh = h.sheet, xp = HO.killXp(h.lvl, f.lvl, d.elite), cr = HO.killCredits(f.lvl, d.elite);
        sh.kills++;
        sh.credits += cr;
        this.events.push({ k: 'credits', uid: h.uid, v: cr });
        if (!xp) continue;
        sh.xp += xp;
        this.events.push({ k: 'xp', uid: h.uid, v: xp, src: f.uid });
        while (sh.lvl < HO.MAX_LEVEL && sh.xp >= HO.xpNeed(sh.lvl)) {
          sh.xp -= HO.xpNeed(sh.lvl);
          sh.lvl++;
          this.levelUp(h);
        }
        if (sh.lvl >= HO.MAX_LEVEL) sh.xp = 0;
      }
    },

    levelUp(a) {
      const s = HO.PATH_STATS[a.path], L = a.sheet.lvl;
      a.lvl = L;
      a.base = { hp: s.hp[0] + s.hp[1] * (L - 1), atk: s.atk[0] + s.atk[1] * (L - 1), def: s.def[0] + s.def[1] * (L - 1), pool: s.pool ? s.pool[0] + s.pool[1] * (L - 1) : 0 };
      a.hp = this.stat(a, 'maxHp');
      if (HO.PATHS[a.path].resource !== 'rage') a.res = a.base.pool;
      if (L >= C.ultLevel) a.energy = Math.max(a.energy, C.energyStart);
      this.events.push({ k: 'levelUp', uid: a.uid, lvl: L });
    },

    spawnFoes() {
      for (const f of this.zone.foes || []) { const x = this.addFoe(f.id, f, this.zone.absolute ? f.lvl : this.state.level + (f.lvl || 0)); if (this.zone.instance) x.once = true; }
    },

    addFoe(id, place, lvl) {
      const d = HO.FOES[id], rt = HO.FOE_RT[id];
      const y = place.y !== undefined ? place.y : Math.max(0, this.floorBelow(place.x, place.z, 50, rt.r));
      const f = {
        uid: this.state.uid++, kind: 'foe', id, name: d.name, lvl, elite: d.elite, r: rt.r, h: rt.h,
        x: place.x, y, z: place.z, yaw: place.yaw || 0, vx: 0, vy: 0, vz: 0, wx: 0, wz: 0, ground: true,
        home: { x: place.x, y, z: place.z, yaw: place.yaw || 0 }, pack: place.pack || '',
        base: { hp: (C.foeHp + C.foeHpLvl * (lvl - 1)) * d.hp * (rt.hpMul || 1) * (d.boss ? 1 : this.zone.foeHp || 1), atk: (C.foeAtk + C.foeAtkLvl * (lvl - 1)) * d.atk * (d.boss ? 1 : this.zone.foeAtk || 1), def: 200 + 10 * lvl },
        hp: 0, toughMax: d.tough, tough: d.tough, brokenUntil: 0,
        state: 'idle', threat: {}, aim: 0, swingAt: 0, swings: 0, prep: null, prepAt: 0, prepNext: 0, respawnAt: 0, dead: false, auras: []
      };
      f.hp = this.stat(f, 'maxHp');
      this.state.actors.push(f);
      return f;
    },

    initHero(a, lvl) {
      const s = HO.PATH_STATS[a.path], L = HO.clamp(lvl | 0 || 1, 1, HO.MAX_LEVEL);
      a.lvl = L;
      a.base = { hp: s.hp[0] + s.hp[1] * (L - 1), atk: s.atk[0] + s.atk[1] * (L - 1), def: s.def[0] + s.def[1] * (L - 1), pool: s.pool ? s.pool[0] + s.pool[1] * (L - 1) : 0 };
      a.hp = a.base.hp;
      a.res = HO.PATHS[a.path].resource === 'rage' ? 0 : a.base.pool;
      a.energy = L >= C.ultLevel ? C.energyStart : 0;
      Object.assign(a, { target: 0, attacking: false, swingAt: 0, gcdUntil: 0, cds: {}, cast: null, auras: [], dead: false, sit: false, inCombat: false, combatAt: -9999, spendAt: -9999, nextSwing: null, dash: null });
    },

    resMax(a) {
      return HO.PATHS[a.path].resource === 'rage' ? C.rageMax : a.base.pool;
    },

    auraSum(a, stat) {
      let v = 0;
      for (const x of a.auras) if (x.stat === stat) v += x.v * (x.stacks || 1);
      return v;
    },

    hasAura(a, k) {
      for (const x of a.auras) if (x.k === k) return x;
      return null;
    },

    stat(a, key) {
      const gear = k => (a.sheet && a.sheet.gear && HO.gearStat ? HO.gearStat(a.sheet, k) : 0);
      if (key === 'maxHp') return (a.base.hp + gear('hp')) * (1 + this.auraSum(a, 'hpP'));
      if (key === 'atk') return (a.base.atk + gear('atk')) * (1 + this.auraSum(a, 'atkP') + (a.sheet && HO.setBonus ? HO.setBonus(a.sheet, 'atkP') : 0));
      if (key === 'def') return (a.base.def + gear('def')) * Math.max(0.1, 1 + this.auraSum(a, 'defP'));
      if (key === 'swing') return Math.max(0.5, 1 + this.auraSum(a, 'swingP') + (this.hasAura(a, 'imprison') ? C.imprisonSlow : 0));
      if (key === 'move') return Math.max(0.2, 1 + this.auraSum(a, 'moveP') - (this.hasAura(a, 'imprison') ? C.imprisonSlow : 0));
      return 0;
    },

    controlled(a) {
      for (const x of a.auras) if (CONTROL.has(x.k)) return true;
      return false;
    },

    canMove(a) {
      if (a.dead) return false;
      for (const x of a.auras) if (CONTROL.has(x.k) || x.k === 'root') return false;
      return true;
    },

    moveScale(a) {
      return this.stat(a, 'move') * (a.ghost ? 1.5 : 1);
    },

    los(a, b) {
      const o = [a.x, a.y + 1.5, a.z], e = [b.x, b.y + 1.2, b.z], d = [e[0] - o[0], e[1] - o[1], e[2] - o[2]];
      for (const bx of this.boxes) {
        let t0 = 0, t1 = 1, hit = true;
        for (let i = 0; i < 3 && hit; i++) {
          const lo = bx[i], hi = bx[i + 3];
          if (d[i] === 0) { if (o[i] <= lo || o[i] >= hi) hit = false; continue; }
          let p = (lo - o[i]) / d[i], q = (hi - o[i]) / d[i];
          if (p > q) { const s = p; p = q; q = s; }
          if (p > t0) t0 = p;
          if (q < t1) t1 = q;
          if (t0 >= t1) hit = false;
        }
        if (hit) return false;
      }
      return true;
    },

    facing(a, b) {
      const dx = b.x - a.x, dz = b.z - a.z;
      return N.sin(a.yaw) * dx - N.cos(a.yaw) * dz >= C.facing * Math.sqrt(dx * dx + dz * dz);
    },

    face(a, b) {
      const dx = b.x - a.x, dz = b.z - a.z;
      if (dx !== 0 || dz !== 0) a.yaw = HO.wrapAngle(N.atan2(dx, -dz));
    },

    roll() {
      return this.random();
    },

    applyCombat(c, a) {
      if (c.t === 'target') {
        const t = this.byUid(c.uid);
        a.target = t ? t.uid : 0;
        if (!t) a.attacking = false;
      } else if (c.t === 'attack') {
        const t = this.byUid(a.target);
        a.attacking = c.on && !!t && t.kind === 'foe' && !t.dead;
      } else if (c.t === 'cast') this.tryCast(a, c.ab, c.uid);
      else if (c.t === 'stopCast') this.cancelCast(a, true);
      else if (c.t === 'sit') { if (!a.dead && !a.cast) a.sit = c.on; }
      else if (c.t === 'release' && a.dead) this.releaseHero(a, c.mode);
      else if (c.t === 'learn') { if (!a.dead) this.learn(a, c.ab); }
      else if (this.applyWorld) this.applyWorld(c, a);
    },

    deny(a, why) {
      this.events.push({ k: 'deny', uid: a.uid, why });
      return false;
    },

    resolveTarget(a, ab, uid) {
      const pick = uid ? this.byUid(uid) : this.byUid(a.target);
      if (ab.target === 'self' || ab.target === 'none') return a;
      if (ab.target === 'enemy') return pick && pick.kind === 'foe' && !pick.dead && pick.state !== 'evade' ? pick : null;
      if (ab.target === 'ally') return pick && (pick.kind === 'hero' || pick.ward) && !pick.dead ? pick : a;
      if (ab.target === 'dead') return pick && pick.kind === 'hero' && pick.dead ? pick : null;
      return null;
    },

    abilityOf(a, id) {
      const r = HO.RACIALS[a.race];
      if (r && r.id === id) return Object.assign({ racial: true, gcd: false, target: 'self', cost: 0, cast: 0, fx: [], lvl: 1 }, r);
      const ab = HO.ABILITIES[id];
      return ab && ab.path === a.path ? ab : null;
    },

    costOf(a, ab) {
      if (!ab.cost) return 0;
      return HO.PATHS[a.path].resource === 'rage' ? ab.cost : ab.cost * a.base.pool;
    },

    tryCast(a, id, uid) {
      const ab = this.abilityOf(a, id), tick = this.state.tick;
      if (!ab) return this.deny(a, 'level');
      if (a.dead) return this.deny(a, 'dead');
      if (a.ghost) return this.deny(a, 'ghost');
      if (ab.lvl > a.lvl) return this.deny(a, 'level');
      if (!ab.racial && !ab.auto && !(a.sheet && a.sheet.learned[id] >= 1)) return this.deny(a, 'learn');
      if (this.controlled(a) && id !== 'r_focus') return this.deny(a, 'control');
      if (ab.auto) {
        const t = this.resolveTarget(a, ab, uid);
        if (!t) return this.deny(a, 'target');
        a.target = t.uid;
        a.attacking = true;
        return true;
      }
      if (a.cast) return this.deny(a, 'cast');
      if (ab.gcd && tick < a.gcdUntil) return this.deny(a, 'gcd');
      if ((a.cds[id] || 0) > tick) return this.deny(a, 'cd');
      if (ab.ooc && a.inCombat) return this.deny(a, 'ooc');
      if (ab.ult && a.energy < C.energyMax) return this.deny(a, 'energy');
      const cost = this.costOf(a, ab);
      if (cost > a.res + 1e-9) return this.deny(a, 'cost');
      const t = this.resolveTarget(a, ab, uid);
      if (!t) return this.deny(a, 'target');
      if (t !== a) {
        const d = dist(a, t), reach = ab.range === 'melee' ? C.melee + (t.r || T.radius) : ab.range + (t.r || 0);
        if (d > reach) return this.deny(a, 'range');
        if (ab.minRange && d < ab.minRange) return this.deny(a, 'near');
        if (!this.los(a, t)) return this.deny(a, 'sight');
        if (t.kind === 'foe' && ab.target === 'enemy' && !ab.ooc && !this.facing(a, t)) return this.deny(a, 'facing');
      }
      if (ab.fx.some(f => f.k === 'poly') && t.elite) return this.deny(a, 'elite');
      a.res -= cost;
      if (cost > 0) a.spendAt = tick;
      a.sit = false;
      if (ab.gcd) a.gcdUntil = tick + sec(C.gcd);
      if (ab.target === 'enemy') {
        a.target = t.uid;
        if (a.path === 'destruction') a.attacking = true;
      }
      const quick = ab.cast > 0 && (this.hasAura(a, 'mind') || this.hasAura(a, 'prepbuff'));
      if (ab.cast > 0 && !quick) {
        const castTime = ab.cast - (id === 'a_heal' && HO.traceOf(a.sheet) === 'a_quick' ? 0.5 : 0);
        a.cast = { ab: id, tgt: t.uid, start: tick, end: tick + sec(castTime), cost };
        this.events.push({ k: 'castStart', uid: a.uid, ab: id });
        return true;
      }
      this.perform(a, id, t);
      return true;
    },

    cancelCast(a, byPlayer) {
      if (!a.cast) return;
      a.res = Math.min(this.resMax(a), a.res + a.cast.cost);
      this.events.push({ k: 'castStop', uid: a.uid, ab: a.cast.ab, why: byPlayer ? 'stop' : 'move' });
      a.cast = null;
      a.gcdUntil = this.state.tick;
    },

    finishCast(a) {
      const c = a.cast, t = this.byUid(c.tgt), ab = this.abilityOf(a, c.ab);
      a.cast = null;
      const bad = !t || (ab.target === 'dead' ? !t.dead : t.dead) || (t !== a && (!this.los(a, t) || dist(a, t) > (ab.range === 'melee' ? C.melee + (t.r || T.radius) : ab.range + (t.r || 0)) + 1));
      if (bad) {
        a.res = Math.min(this.resMax(a), a.res + c.cost);
        this.events.push({ k: 'castStop', uid: a.uid, ab: c.ab, why: 'target' });
        return;
      }
      this.perform(a, c.ab, t);
    },

    perform(a, id, t) {
      const ab = this.abilityOf(a, id), tick = this.state.tick;
      if (ab.cd) a.cds[id] = tick + sec(ab.cd);
      if (ab.racial) return this.performRacial(a, ab);
      let toughMul = 1;
      const prep = this.hasAura(a, 'prepbuff');
      if (ab.cast > 0 || ab.fx.some(f => f.k === 'dmg' || f.k === 'aoe')) {
        if (prep && id !== 'e_prep') { toughMul = 2; this.dropAura(a, prep); }
        const mind = this.hasAura(a, 'mind');
        if (mind && ab.cast > 0) this.dropAura(a, mind);
      }
      if (ab.ult) a.energy = 0;
      else if (a.lvl >= C.ultLevel) a.energy = Math.min(C.energyMax, a.energy + C.energyCast);
      if (ab.hpCost) a.hp = Math.max(1, a.hp - this.stat(a, 'maxHp') * ab.hpCost);
      this.events.push({ k: 'cast', uid: a.uid, ab: id, tgt: t.uid });
      const ctx = { src: a, id, ab, trace: HO.traceOf(a.sheet), elems: elemsOf(a, ab), toughMul, mul: HO.rankMul(a.sheet && a.sheet.learned[id] || 1) };
      for (const fx of ab.fx) this.runFx(ctx, fx, t);
    },

    performRacial(a, ab) {
      if (ab.id === 'r_focus') a.auras = a.auras.filter(x => !(x.k === 'stun' || x.k === 'root' || x.k === 'freeze' || (x.stat === 'moveP' && x.v < 0)));
      if (ab.id === 'r_dash') a.dash = { x: a.x + N.sin(a.yaw) * C.foxDash, z: a.z - N.cos(a.yaw) * C.foxDash, until: this.state.tick + sec(C.dashFor), tgt: 0 };
      this.events.push({ k: 'cast', uid: a.uid, ab: ab.id, tgt: a.uid });
    },

    victims(center, r, src) {
      const out = [];
      for (const f of this.state.actors) if (f.kind === 'foe' && !f.dead && f.state !== 'evade' && dist(center, f) <= r + f.r && this.los(src, f)) out.push(f);
      return out;
    },

    runFx(ctx, fx, t) {
      const a = ctx.src, tick = this.state.tick;
      switch (fx.k) {
        case 'dmg': this.damage(a, t, fx.m * ctx.mul, { elems: ctx.elems, tough: (fx.tough || 0) * ctx.toughMul, critBonus: ctx.trace === 'e_precise' && (ctx.id === 'e_fire' || ctx.id === 'e_ice') ? 0.1 : 0 }); break;
        case 'aoe': {
          let list = this.victims(fx.around === 'self' ? a : t, fx.r, a);
          if (fx.skipTarget) list = list.filter(f => f !== t);
          if (fx.max) list = list.sort((p, q) => dist(t, p) - dist(t, q) || p.uid - q.uid).slice(0, fx.max + (ctx.trace === 'e_chain' && ctx.id === 'e_cascade' ? 1 : 0));
          for (const f of list) {
            this.damage(a, f, fx.m * ctx.mul, { elems: ctx.elems, tough: (fx.tough || 0) * ctx.toughMul });
            for (const s of fx.then || []) this.runFx(ctx, s, f);
          }
          break;
        }
        case 'dot': this.addAura(t, { k: 'dot', key: fx.key, src: a.uid, until: tick + sec(fx.dur), every: sec(fx.every), next: tick + sec(fx.every), amt: this.stat(a, 'atk') * fx.m * ctx.mul / (fx.dur / fx.every), elem: ctx.elems[0] }); break;
        case 'hot': {
          const longer = ctx.trace === 'a_bloom' && ctx.id === 'a_sprout' ? 6 : 0;
          for (const h of fx.group ? this.groupOf(a) : [t]) this.addAura(h, { k: 'hot', key: fx.key, src: a.uid, until: tick + sec(fx.dur + longer), every: sec(fx.every), next: tick + sec(fx.every), amt: this.stat(a, 'atk') * fx.m * ctx.mul / (fx.dur / fx.every) });
          break;
        }
        case 'heal': for (const h of fx.group ? this.groupOf(a) : [t]) this.heal(a, h, this.stat(a, 'atk') * fx.m * ctx.mul); break;
        case 'buff':
          if (fx.stat === 'prep') { this.addAura(a, { k: 'prepbuff', key: 'prep', src: a.uid, until: tick + sec(fx.dur) }); break; }
          for (const h of fx.group ? this.groupOf(a) : [t]) {
            const was = this.stat(h, 'maxHp');
            this.addAura(h, { k: 'buff', key: fx.key, src: a.uid, until: tick + sec(fx.dur), stat: fx.stat, v: fx.v });
            if (fx.stat === 'hpP') h.hp += this.stat(h, 'maxHp') - was;
          }
          break;
        case 'debuff': this.addAura(t, { k: 'debuff', key: fx.key, src: a.uid, until: tick + sec(fx.dur), stat: fx.stat, v: fx.v, stack: fx.stack || 1 }); break;
        case 'stun': this.addAura(t, { k: 'stun', key: 'stun', src: a.uid, until: tick + sec(fx.dur) }); break;
        case 'root': this.addAura(t, { k: 'root', key: 'root', src: a.uid, until: tick + sec(fx.dur) }); break;
        case 'poly': if (!t.elite) { this.addAura(t, { k: 'poly', key: 'poly', src: a.uid, until: tick + sec(fx.dur) }); t.prep = null; } break;
        case 'taunt': this.taunt(t, a, fx.dur); break;
        case 'nextSwing': a.nextSwing = { m: fx.m * ctx.mul, tough: fx.tough }; break;
        case 'conjure': if (a.sheet) { const got = HO.bagAdd(a.sheet, fx.item, fx.n); if (got) this.events.push({ k: 'got', uid: a.uid, item: fx.item, n: got }); else this.deny(a, 'full'); } break;
        case 'dash': a.dash = { x: t.x, z: t.z, until: tick + sec(C.dashFor), tgt: t.uid }; this.addThreat(t, a, 1); break;
        case 'gain': a.res = Math.min(this.resMax(a), a.res + fx.v); break;
        case 'threat': this.addThreat(t, a, (fx.v + (fx.perLvl || 0) * a.lvl) * this.threatMul(a)); break;
        case 'cleanse': {
          const i = t.auras.findIndex(x => x.k === 'dot' || (x.k === 'debuff' && x.v < 0) || x.k === 'root');
          if (i >= 0) { this.events.push({ k: 'cleanse', uid: t.uid, key: t.auras[i].key }); t.auras.splice(i, 1); }
          break;
        }
        case 'revive':
          if (t.dead) {
            t.dead = false;
            t.hp = this.stat(t, 'maxHp') * fx.pct;
            this.events.push({ k: 'revive', uid: t.uid, src: a.uid });
          }
          break;
        default: break;
      }
    },

    groupOf(a) {
      return this.heroes().filter(h => !h.dead && dist(a, h) <= C.groupRange);
    },

    addAura(t, x) {
      if (t.dead) return;
      const old = t.auras.find(o => o.key === x.key && o.src === x.src && o.k === x.k);
      if (old) {
        old.until = x.until;
        if (x.stack) old.stacks = Math.min(x.stack, (old.stacks || 1) + 1);
        if (x.amt !== undefined) { old.amt = x.amt; old.next = x.next; }
        return;
      }
      if (x.stack) x.stacks = 1;
      delete x.stack;
      t.auras.push(x);
      if (CONTROL.has(x.k) && t.kind === 'hero') this.cancelCast(t, false);
    },

    dropAura(t, x) {
      const i = t.auras.indexOf(x);
      if (i >= 0) t.auras.splice(i, 1);
    },

    missChance(src, tgt) {
      return HO.clamp(C.miss + C.missPerLvl * Math.max(0, tgt.lvl - src.lvl), 0, C.missMax);
    },

    damage(src, tgt, m, o) {
      if (!tgt || tgt.dead || tgt.ghost) return 0;
      if (tgt.kind === 'foe' && tgt.state === 'evade') { this.events.push({ k: 'evade', uid: tgt.uid, src: src.uid }); return 0; }
      const opt = o || {};
      this.enterCombat(src, tgt);
      if (!opt.dot && !opt.sure && this.roll() < this.missChance(src, tgt)) {
        this.events.push({ k: 'miss', src: src.uid, uid: tgt.uid });
        if (tgt.kind === 'foe') this.addThreat(tgt, src, 1);
        return 0;
      }
      const elems = opt.elems || ['phys'];
      const weak = tgt.kind === 'foe' && elems.some(e => HO.FOES[tgt.id].weak.includes(e));
      const K = 200 + 10 * src.lvl;
      const defM = K / (this.stat(tgt, 'def') + K);
      const resM = tgt.kind === 'foe' && !weak ? 1 - C.foeRes : 1;
      const brokenM = tgt.kind === 'foe' && !(tgt.tough <= 0) ? C.unbroken : 1;
      const crit = !opt.dot && this.roll() < C.crit + (opt.critBonus || 0);
      const raw = opt.flat !== undefined ? opt.flat : this.stat(src, 'atk') * m;
      const traceM = (src.kind === 'hero' && HO.traceOf(src.sheet) === 'd_rush' ? 1.1 : 1) * (tgt.kind === 'hero' && HO.traceOf(tgt.sheet) === 'd_guard' ? 0.9 : 1);
      const v = Math.max(1, Math.round(raw * traceM * (opt.pure ? 1 : defM * resM * brokenM) * (crit ? 1 + C.critD : 1)));
      tgt.hp -= v;
      if (tgt.kind === 'foe') tgt.hitAt = this.state.tick;
      this.events.push({ k: 'dmg', src: src.uid, uid: tgt.uid, v, crit, elem: elems[0], weak, dot: !!opt.dot, auto: !!opt.auto });
      if (src.kind === 'hero') { const hid = this.hasAura(src, 'unseen'); if (hid) this.dropAura(src, hid); }
      const poly = this.hasAura(tgt, 'poly');
      if (poly) this.dropAura(tgt, poly);
      if (tgt.kind === 'hero') {
        if (tgt.path === 'destruction') this.gainRage(tgt, v / this.stat(tgt, 'maxHp') * C.rageTaken);
        if (tgt.lvl >= C.ultLevel) tgt.energy = Math.min(C.energyMax, tgt.energy + C.energyHit);
        tgt.sit = false;
      }
      if (tgt.kind === 'foe') {
        this.addThreat(tgt, src, v * this.threatMul(src));
        if (opt.tough && weak && tgt.tough > 0) this.hitTough(tgt, src, opt.tough * (tgt.prep ? C.prepTough : 1), elems.find(e => HO.FOES[tgt.id].weak.includes(e)));
      }
      if (tgt.hp <= 0) this.kill(tgt, src);
      return v;
    },

    threatMul(a) {
      return a.kind === 'hero' ? HO.PATHS[a.path].threat * (HO.traceOf(a.sheet) === 'd_guard' ? 1.3 : 1) : 1;
    },

    gainRage(a, v) {
      const low = a.hp / this.stat(a, 'maxHp') < C.rageLow ? C.rageLowMul : 1;
      a.res = Math.min(C.rageMax, a.res + v * low);
    },

    heal(src, tgt, amount) {
      if (tgt.dead) return 0;
      const max = this.stat(tgt, 'maxHp');
      const talent = src.path === 'abundance' && tgt.hp / max < C.talentHealBelow ? C.talentHeal : 1;
      const crit = this.roll() < C.crit;
      const v = Math.round(amount * talent * (crit ? 1 + C.critD : 1));
      const real = Math.min(v, max - tgt.hp);
      tgt.hp += real;
      this.events.push({ k: 'heal', src: src.uid, uid: tgt.uid, v: real, over: v - real, crit });
      if (real > 0) {
        const engaged = this.foes().filter(f => f.state === 'fight' && (f.threat[src.uid] !== undefined || f.threat[tgt.uid] !== undefined));
        for (const f of engaged) this.addThreat(f, src, real * C.healThreat * this.threatMul(src) / engaged.length);
        if (engaged.length) this.enterCombat(src, engaged[0]);
      }
      return real;
    },

    hitTough(f, src, v, elem) {
      f.tough = Math.max(0, f.tough - v);
      this.events.push({ k: 'tough', uid: f.uid, v, left: f.tough });
      if (f.tough <= 0) this.breakFoe(f, src, elem);
    },

    breakFoe(f, src, elem) {
      const tick = this.state.tick;
      f.tough = 0;
      f.brokenUntil = tick + sec(C.brokenFor);
      const hadPrep = !!f.prep;
      if (f.prep) { this.events.push({ k: 'prepCancel', uid: f.uid, skill: f.prep.skill }); f.prep = null; f.prepAt = tick + sec(HO.FOE_RT[f.id].prepEvery || 10); }
      this.events.push({ k: 'break', uid: f.uid, src: src.uid, elem, prep: hadPrep });
      const trial = this.state.trial;
      if (f.trial && trial && !trial.broke.includes(f.uid)) trial.broke.push(f.uid);
      if (!f.elite) this.addAura(f, { k: 'stun', key: 'break', src: src.uid, until: tick + sec(C.breakStun) });
      const maxHp = this.stat(f, 'maxHp');
      if (elem === 'phys') this.addAura(f, { k: 'dot', key: 'bleed', src: src.uid, until: tick + sec(C.bleedFor), every: sec(1), next: tick + sec(1), amt: maxHp * C.bleedPct, elem, flat: true });
      if (elem === 'fire') this.addAura(f, { k: 'dot', key: 'blaze', src: src.uid, until: tick + sec(6), every: sec(2), next: tick + sec(2), amt: this.stat(src, 'atk') * C.burnM / 3, elem });
      if (elem === 'ice') this.addAura(f, { k: 'freeze', key: 'freeze', src: src.uid, until: tick + sec(f.elite ? C.freeze / 2 : C.freeze) });
      if (elem === 'imag') this.addAura(f, { k: 'imprison', key: 'imprison', src: src.uid, until: tick + sec(C.imprison) });
      if (src.kind === 'hero') {
        if (src.path === 'erudition') this.addAura(src, { k: 'mind', key: 'mind', src: src.uid, until: tick + sec(10) });
        if (src.lvl >= C.ultLevel) src.energy = Math.min(C.energyMax, src.energy + C.energyBreak);
      }
    },

    taunt(f, a, dur) {
      if (f.kind !== 'foe' || f.dead) return;
      let top = 0;
      for (const k in f.threat) if (f.threat[k] > top) top = f.threat[k];
      f.threat[a.uid] = top + 1;
      this.addAura(f, { k: 'taunt', key: 'taunt', src: a.uid, until: this.state.tick + sec(dur) });
      if (f.state === 'idle' || f.state === 'raid') this.aggro(f, a);
      f.aim = a.uid;
      this.events.push({ k: 'taunt', uid: f.uid, src: a.uid });
    },

    addThreat(f, a, v) {
      if (f.kind !== 'foe' || f.dead || f.state === 'evade' || a.kind !== 'hero' || a.dead || a.ghost) return;
      f.threat[a.uid] = (f.threat[a.uid] || 0) + v;
      if (f.state === 'idle' || f.state === 'raid') this.aggro(f, a);
    },

    aggro(f, a, seen) {
      if (f.dead || (f.state !== 'idle' && f.state !== 'raid')) return;
      const done = seen || new Set();
      done.add(f.uid);
      f.state = 'fight';
      f.fightAt = this.state.tick;
      if (f.threat[a.uid] === undefined) f.threat[a.uid] = 1;
      f.aim = a.uid;
      f.swingAt = this.state.tick + sec(0.5);
      const rt = HO.FOE_RT[f.id];
      f.prepAt = this.state.tick + sec(rt.prepFirst || rt.prepEvery || 10);
      if (rt.summon && !f.summonAt) { f.summonAt = this.state.tick + sec(rt.summon.first || rt.summon.every); f.summons = 0; }
      if (rt.pulse && !f.pulseAt) f.pulseAt = this.state.tick + sec(rt.pulse.every);
      if (rt.life && !f.lifeEnd) f.lifeEnd = this.state.tick + sec(rt.life.s);
      this.events.push({ k: 'aggro', uid: f.uid, tgt: a.uid });
      for (const o of this.foes()) {
        if (done.has(o.uid) || o.dead || o.state !== 'idle' || o.solo || f.solo) continue;
        const packed = f.pack && o.pack === f.pack;
        const social = HO.FOES[o.id].fam === HO.FOES[f.id].fam && dist(o, f) <= C.social;
        if (packed || social) this.aggro(o, a, done);
      }
    },

    enterCombat(a, b) {
      for (const x of [a, b]) if (x.kind === 'hero') { x.inCombat = true; x.combatAt = this.state.tick; }
    },

    kill(t, src) {
      t.hp = 0;
      t.dead = true;
      t.auras = [];
      t.prep = null;
      this.events.push({ k: 'death', uid: t.uid, src: src ? src.uid : 0 });
      if (t.kind === 'npc') return;
      if (t.kind === 'foe') {
        for (const x of this.foes()) if (x.parent === t.uid && !x.dead) { Object.assign(x, { dead: true, hp: 0, state: 'dead', threat: {}, auras: [], prep: null }); this.events.push({ k: 'vanish', uid: x.uid }); }
        this.reward(t);
        t.state = 'dead';
        t.threat = {};
        t.respawnAt = this.state.tick + sec(C.respawn);
        t.wx = 0; t.wz = 0;
        if (src && src.kind === 'hero' && src.lvl >= C.ultLevel) src.energy = Math.min(C.energyMax, src.energy + C.energyKill);
        for (const h of this.heroes()) if (h.target === t.uid) h.attacking = false;
      } else {
        t.cast = null; t.attacking = false; t.sit = false; t.dash = null;
        t.corpse = { x: t.x, y: t.y, z: t.z };
        if (t.sheet && t.sheet.gear) for (const slot of HO.GEAR_SLOTS || []) { const g = t.sheet.gear[slot]; if (g) g.dur = Math.max(0, g.dur - 10); }
        for (const f of this.foes()) {
          if (f.threat[t.uid] === undefined) continue;
          delete f.threat[t.uid];
          if (f.aim === t.uid) f.aim = 0;
          if (f.state === 'fight' && !Object.keys(f.threat).length) this.evade(f);
        }
      }
    },

    releaseHero(a) {
      const sp = this.zone.spawn;
      a.dead = false;
      a.x = sp.x + a.seat * 1.2; a.y = sp.y; a.z = sp.z; a.yaw = sp.yaw;
      a.vx = 0; a.vy = 0; a.vz = 0; a.ground = true; a.auto = false;
      a.hp = this.stat(a, 'maxHp') * C.releaseHp;
      if (HO.PATHS[a.path].resource !== 'rage') a.res = a.base.pool * C.releaseHp;
      this.events.push({ k: 'release', uid: a.uid });
    },

    respawnFoe(f) {
      const h = f.home;
      Object.assign(f, { x: h.x, y: h.y, z: h.z, yaw: h.yaw, vx: 0, vy: 0, vz: 0, wx: 0, wz: 0, ground: true, dead: false, state: 'idle', threat: {}, aim: 0, prep: null, auras: [], tough: f.toughMax, brokenUntil: 0, loot: null, path: null });
      f.hp = this.stat(f, 'maxHp');
      this.events.push({ k: 'spawn', uid: f.uid });
    },

    combatTick() {
      const tick = this.state.tick;
      for (const a of this.state.actors) this.tickAuras(a);
      for (const a of this.state.actors) {
        if (a.kind === 'hero') this.heroTick(a);
        else if (a.kind === 'foe') this.foeTick(a);
      }
      for (const f of this.foes()) if (!f.dead && f.tough <= 0 && tick >= f.brokenUntil) f.tough = f.toughMax;
    },

    tickAuras(a) {
      const tick = this.state.tick;
      if (a.dead) return;
      for (const x of a.auras.slice()) {
        if ((x.k === 'dot' || x.k === 'hot') && tick >= x.next && tick <= x.until) {
          x.next += x.every;
          const src = this.byUid(x.src) || a;
          if (x.k === 'dot') this.damage(src, a, 0, { flat: x.amt, pure: !!x.flat, elems: [x.elem || 'phys'], dot: true });
          else this.heal(src, a, x.amt);
          if (a.dead) return;
        }
        if (tick >= x.until) this.dropAura(a, x);
      }
    },

    heroTick(a) {
      const tick = this.state.tick;
      if (a.dead) return;
      if (a.sheet) a.sheet.clock += HO.DT;
      if (a.ghost) { a.inCombat = false; a.attacking = false; return; }
      a.inCombat = this.foes().some(f => f.state === 'fight' && f.threat[a.uid] !== undefined && !HO.FOE_RT[f.id].flee) || tick - a.combatAt < sec(1);
      if (a.cast && (a.mf !== 0 || a.ms !== 0 || a.auto || !a.ground || a.dash)) this.cancelCast(a, false);
      if (a.cast && this.controlled(a)) this.cancelCast(a, false);
      if (a.cast && tick >= a.cast.end) this.finishCast(a);
      if (a.mf !== 0 || a.ms !== 0 || a.auto) a.sit = false;
      if (a.attacking && !a.cast && !this.controlled(a)) this.autoAttack(a);
      const rage = HO.PATHS[a.path].resource === 'rage';
      const idle = tick - a.combatAt >= sec(C.oocDelay) && !a.inCombat;
      if (rage && idle) a.res = Math.max(0, a.res - C.rageDecay * HO.DT);
      if (!rage && tick - a.spendAt >= sec(C.fiveSec)) a.res = Math.min(a.base.pool, a.res + a.base.pool * C.powerRegen * HO.DT * (a.sit ? C.sitMul : 1));
      if (idle) a.hp = Math.min(this.stat(a, 'maxHp'), a.hp + this.stat(a, 'maxHp') * C.hpRegen * HO.DT * (a.sit ? C.sitMul : 1));
      if (a.dash && a.dash.tgt) {
        const t = this.byUid(a.dash.tgt);
        if (t) { a.dash.x = t.x; a.dash.z = t.z; }
      }
    },

    autoAttack(a) {
      const t = this.byUid(a.target), tick = this.state.tick;
      if (!t || t.dead || t.kind !== 'foe') { a.attacking = false; return; }
      if (tick < a.swingAt) return;
      const melee = a.path === 'destruction';
      const reach = melee ? C.melee + t.r : HO.ABILITIES[a.path[0] + '_attack'].range + t.r;
      if (dist(a, t) > reach || !this.facing(a, t) || !this.los(a, t)) return;
      const swingTime = (melee ? C.swing : C.rangedSwing) * this.stat(a, 'swing');
      a.swingAt = tick + sec(swingTime);
      const ns = melee ? a.nextSwing : null;
      a.nextSwing = null;
      const m = (melee ? C.swing * C.swingK : C.rangedSwing * C.rangedK) * (1 + (ns ? ns.m : 0));
      this.events.push({ k: 'swing', uid: a.uid, tgt: t.uid, melee, elem: elemsOf(a)[0] });
      const v = this.damage(a, t, m, { elems: elemsOf(a), tough: C.autoTough + (ns ? ns.tough : 0), auto: true });
      if (melee && v > 0) this.gainRage(a, C.rageHit * (HO.traceOf(a.sheet) === 'd_rush' ? 1.2 : 1));
    },

    pickAim(f) {
      const taunt = this.hasAura(f, 'taunt');
      if (taunt) { const t = this.byUid(taunt.src); if (t && !t.dead) return t; }
      let cur = this.byUid(f.aim);
      if (!cur || cur.dead || f.threat[cur.uid] === undefined) cur = null;
      let best = null, bestV = -1;
      for (const k in f.threat) {
        const h = this.byUid(Number(k));
        if (!h || h.dead || h.ghost) continue;
        if (f.threat[k] > bestV) { bestV = f.threat[k]; best = h; }
      }
      if (!best) return null;
      if (!cur) return best;
      if (best === cur) return cur;
      const near = dist(f, best) <= HO.FOE_RT[f.id].range + T.radius + 0.5;
      return bestV > f.threat[cur.uid] * (near ? C.threatMelee : C.threatRanged) ? best : cur;
    },

    foeTick(f) {
      const tick = this.state.tick, rt = HO.FOE_RT[f.id];
      f.wx = 0; f.wz = 0;
      if (f.dead) { if (!f.once && tick >= f.respawnAt) this.respawnFoe(f); return; }
      if (f.state === 'evade') {
        const d = dist(f, f.home);
        if (d < 0.6) {
          f.state = 'idle'; f.hp = this.stat(f, 'maxHp'); f.tough = f.toughMax; f.yaw = f.home.yaw;
          this.events.push({ k: 'reset', uid: f.uid });
        } else {
          if (this.steer) this.steer(f, f.home, C.evadeSpeed, this.state.tick);
          else { f.wx = (f.home.x - f.x) / d * C.evadeSpeed; f.wz = (f.home.z - f.z) / d * C.evadeSpeed; this.face(f, f.home); }
        }
        return;
      }
      if (f.state === 'idle') {
        if (!f.passive) for (const h of this.heroes()) {
          if (h.dead || h.ghost) continue;
          const r = HO.clamp(C.aggro - (h.lvl - f.lvl), C.aggroMin, C.aggroMax);
          if (this.hasAura(h, 'unseen')) continue;
          if (dist(f, h) <= r && Math.abs(h.y - f.y) < 4 && this.los(f, h)) { this.aggro(f, h); break; }
        }
        if (f.state === 'idle') return;
      }
      if (f.state === 'raid') {
        for (const h of this.heroes()) {
          if (h.dead || h.ghost) continue;
          if (dist(f, h) <= C.aggro && this.los(f, h)) { this.aggro(f, h); break; }
        }
        if (f.state === 'raid') { this.raidStep(f); return; }
      }
      if (dist(f, f.home) > (rt.leash || C.leash)) return this.evade(f);
      const t = this.pickAim(f);
      if (!t) return this.evade(f);
      f.aim = t.uid;
      if (this.controlled(f)) return;
      if (rt.flee) {
        if (tick - (f.hitAt || f.fightAt || 0) > sec(8)) return this.evade(f);
        if (this.fleeStep) this.fleeStep(f, t);
        return;
      }
      if (this.foeExtras(f, t)) return;
      if (f.prep) {
        if (tick >= f.prep.end) this.resolvePrep(f);
        return;
      }
      const d = dist(f, t), reach = rt.range + T.radius;
      const seen = this.los(f, t);
      if (d > reach || (rt.bolt && !seen)) {
        const sp = C.foeSpeed * rt.speed;
        if (this.steer) this.steer(f, t, sp, tick);
        else { f.wx = (t.x - f.x) / d * sp; f.wz = (t.z - f.z) / d * sp; this.face(f, t); }
        return;
      }
      this.face(f, t);
      if (rt.preps && tick >= f.prepAt) return this.startPrep(f, t);
      if (tick < f.swingAt) return;
      f.swingAt = tick + sec(rt.swing * this.stat(f, 'swing'));
      f.swings++;
      const skills = HO.FOES[f.id].skills;
      const alt = rt.alt && f.swings % rt.alt.every === 0;
      const sk = alt ? skills[1] : skills[0];
      this.events.push({ k: 'foeSwing', uid: f.uid, tgt: t.uid, skill: sk.n, bolt: !!rt.bolt, elem: sk.e });
      this.damage(f, t, rt.swing * C.foeK * (alt ? rt.alt.m : sk.m), { elems: [sk.e] });
      if (rt.burn && !t.dead && this.roll() < rt.burn.chance) this.addAura(t, { k: 'dot', key: 'burn', src: f.uid, until: tick + sec(rt.burn.dur), every: sec(2), next: tick + sec(2), amt: this.stat(f, 'atk') * rt.burn.m, elem: 'fire' });
      if (rt.poison && !t.dead && this.roll() < rt.poison.chance) this.addAura(t, { k: 'dot', key: 'poison', src: f.uid, until: tick + sec(rt.poison.dur), every: sec(2), next: tick + sec(2), amt: this.stat(f, 'atk') * rt.poison.m, elem: 'imag' });
    },

    evade(f) {
      f.state = 'evade';
      f.threat = {};
      f.aim = 0;
      f.prep = null;
      f.auras = [];
      Object.assign(f, { summonAt: 0, pulseAt: 0, lifeEnd: 0, prepNext: 0, phase2: false });
      for (const x of this.foes()) if (x.parent === f.uid && !x.dead) Object.assign(x, { dead: true, hp: 0, state: 'dead', threat: {}, auras: [], prep: null });
      this.events.push({ k: 'evade', uid: f.uid });
      for (const h of this.heroes()) if (h.target === f.uid) h.attacking = false;
    },

    startPrep(f, t) {
      const rt = HO.FOE_RT[f.id], max = this.stat(f, 'maxHp');
      const ok = rt.preps.filter(p => (!p.below || f.hp / max < p.below) && (!p.above || f.hp / max >= p.above));
      const p = ok[f.prepNext % ok.length], sk = HO.FOES[f.id].skills[p.skill];
      f.prepNext++;
      const pr = { skill: sk.n, idx: rt.preps.indexOf(p), kind: p.kind, start: this.state.tick, end: this.state.tick + sec(p.prep), tgt: t.uid, x: t.x, z: t.z, r: 2.5 };
      if (p.kind === 'around') Object.assign(pr, { x: f.x, z: f.z, r: p.radius });
      if (p.kind === 'cone') Object.assign(pr, { x: f.x, z: f.z, r: p.radius, yaw: N.atan2(t.x - f.x, -(t.z - f.z)), arc: p.arc });
      if (p.kind === 'circles') Object.assign(pr, { r: p.radius, pts: this.heroes().filter(h => !h.dead && !h.ghost && dist(h, f) < 40).map(h => [h.x, h.z]) });
      if (p.kind === 'all') pr.r = 0;
      f.prep = pr;
      this.face(f, t);
      this.events.push({ k: 'prep', uid: f.uid, skill: sk.n, line: p.line.replace('{name}', f.name).replace('{skill}', sk.n) });
    },

    inPrep(pr, h) {
      if (pr.kind === 'around') return dist(h, pr) <= pr.r;
      if (pr.kind === 'cone') {
        if (dist(h, pr) > pr.r) return false;
        let d = N.atan2(h.x - pr.x, -(h.z - pr.z)) - pr.yaw;
        while (d > HO.PI) d -= HO.TWO_PI;
        while (d < -HO.PI) d += HO.TWO_PI;
        return Math.abs(d) <= pr.arc;
      }
      if (pr.kind === 'circles') return pr.pts.some(([x, z]) => (h.x - x) * (h.x - x) + (h.z - z) * (h.z - z) <= pr.r * pr.r);
      if (pr.kind === 'all') return true;
      return false;
    },

    resolvePrep(f) {
      const rt = HO.FOE_RT[f.id], pr = f.prep, p = rt.preps[pr.idx], sk = HO.FOES[f.id].skills[p.skill], tick = this.state.tick;
      f.prep = null;
      f.prepAt = tick + sec(rt.prepEvery);
      f.swingAt = tick + sec(rt.swing);
      const hit = [];
      if (pr.kind === 'single') { const t = this.byUid(pr.tgt); if (t && !t.dead && dist(t, f) <= rt.range + T.radius + 1.5) hit.push(t); }
      else for (const h of this.heroes()) if (!h.dead && !h.ghost && this.inPrep(pr, h)) hit.push(h);
      this.events.push({ k: 'prepHit', uid: f.uid, skill: sk.n, n: hit.length });
      for (const h of hit) {
        this.damage(f, h, rt.swing * C.foeK * p.m, { elems: [sk.e], sure: true });
        if (p.dot && !h.dead) this.addAura(h, { k: 'dot', key: p.dot.key, src: f.uid, until: tick + sec(p.dot.dur), every: sec(2), next: tick + sec(2), amt: this.stat(f, 'atk') * p.dot.m, elem: p.dot.elem || sk.e });
      }
    },

    foeExtras(f, t) {
      const rt = HO.FOE_RT[f.id], tick = this.state.tick;
      if (rt.life && f.lifeEnd && tick >= f.lifeEnd) {
        f.crumbled = true;
        this.events.push({ k: 'crumble', uid: f.uid, text: rt.life.text });
        this.kill(f, null);
        return true;
      }
      if (rt.phase && !f.phase2 && f.hp / this.stat(f, 'maxHp') < rt.phase.below) {
        f.phase2 = true;
        this.addAura(f, { k: 'buff', key: 'awake', src: f.uid, until: tick + sec(3600), stat: 'swingP', v: rt.phase.swingP });
        this.events.push({ k: 'phase', uid: f.uid, text: rt.phase.text });
      }
      if (rt.summon && tick >= f.summonAt) {
        f.summonAt = tick + sec(rt.summon.every);
        const alive = this.foes().filter(x => x.parent === f.uid && !x.dead).length;
        const n = Math.min(f.phase2 && rt.summon.nLow ? rt.summon.nLow : rt.summon.n, rt.summon.max - alive);
        for (let i = 0; i < n; i++) {
          const ang = (i + 1) * 2.1 + f.summons * 0.7;
          const id = rt.summon.ids[(f.summons + i) % rt.summon.ids.length];
          const add = this.addFoe(id, { x: f.x + N.sin(ang) * 3, z: f.z - N.cos(ang) * 3, yaw: 0 }, rt.summon.lvl || f.lvl - 1);
          Object.assign(add, { once: true, parent: f.uid });
          add.base.hp /= this.zone.foeHp || 1;
          add.hp = this.stat(add, 'maxHp');
          this.aggro(add, t);
        }
        f.summons += n;
        if (n > 0) this.events.push({ k: 'summon', uid: f.uid, n, text: rt.summon.text });
      }
      if (rt.pulse && tick >= f.pulseAt) {
        f.pulseAt = tick + sec(rt.pulse.every);
        const hit = this.heroes().filter(h => !h.dead && !h.ghost && dist(h, f) <= rt.pulse.r);
        for (const h of hit) this.addAura(h, { k: 'dot', key: rt.pulse.key, src: f.uid, until: tick + sec(rt.pulse.dur), every: sec(2), next: tick + sec(2), amt: this.stat(f, 'atk') * rt.pulse.m, elem: 'imag' });
        if (hit.length) this.events.push({ k: 'pulse', uid: f.uid, n: hit.length, text: rt.pulse.text });
      }
      return false;
    }
  });

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
