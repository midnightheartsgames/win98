(function (K) {
  'use strict';
  const G = K.Game.prototype;
  const PERCEIVE = 13;

  G.update = function (dt) {
    if (this.pendingTravel) this.doTravel();
    if (this.pendingDuel && this.area && this.area.id === 'duel_ring') { this.pendingDuel = false; this.beginDuelFight(); }
    if (this.mode !== 'play' || this.paused) {
      this.animOnly(dt);
      return;
    }
    dt = Math.min(dt, 0.1);
    this.time += dt;
    if (this.duel && this.duel.endT != null) { this.duel.endT -= dt; if (this.duel.endT <= 0) { this.finishDuel(this.duel.won); return; } }
    if (this.duel && this.duel.countdown > 0) {
      this.duel.countdown -= dt;
      if (this.duel.countdown <= 0) { this.duel.foe.faction = 'hostile'; this.duel.foe.aggro = true; this.enterCombat(); this.emit('toast', { text: 'Бой!' }); this.emit('sfx', { id: 'gong' }); }
    }
    this.updateStrikes(dt);
    const list = this.creatures.slice();
    for (const c of list) this.updateCreature(c, dt);
    this.separate();
    this.updateDoors(dt);
    this.updateObjects(dt);
    this.updateCombatState(dt);
    this.revealTimer = (this.revealTimer || 0) - dt;
    if (this.revealTimer <= 0) { this.revealTimer = 0.3; this.revealAround(); }
  };

  G.animOnly = function (dt) {
    for (const c of this.creatures) if (c.anim) c.anim.t += dt;
    for (const d of this.doors) if (d.open && d.anim < 1) d.anim = Math.min(1, d.anim + dt * 3);
  };

  G.updateDoors = function (dt) {
    for (const d of this.doors) {
      if (d.open) { if (d.anim < 1) d.anim = Math.min(1, d.anim + dt * 3); continue; }
      if (d.locked && !(d.keyItem && this.countItem(d.keyItem))) continue;
      for (const c of this.creatures) {
        if (c.dead || c.static) continue;
        if (Math.abs(c.x - (d.x + 0.5)) < 1.35 && Math.abs(c.z - (d.z + 0.5)) < 1.35 && (c.path || c.faction === 'hostile') && (!d.locked || c.faction === 'party')) { if (d.locked) this.useDoor(d); else this.openDoor(d); break; }
      }
    }
  };

  G.updateObjects = function (dt) {
    const L = this.leader;
    if (!L) return;
    this.objTimer = (this.objTimer || 0) - dt;
    const scan = this.objTimer <= 0;
    if (scan) this.objTimer = 0.4;
    for (const o of this.objects.slice()) {
      if (o.type === 'trig') {
        if (K.dist(L.x, L.z, o.x, o.z) <= (o.def.r || 2) && !this.dialog && this.evalReq(o.def.req)) {
          if (o.def.once !== false) { this.areaState(this.area.id).trig[o.key] = 1; this.objects.splice(this.objects.indexOf(o), 1); }
          K.SCRIPTS[o.def.run](this, { obj: o });
          if (this.mode !== 'play') return;
        }
      } else if (o.type === 'mine' && o.armed) {
        for (const c of this.livingParty()) {
          const d = K.dist(c.x, c.z, o.x, o.z);
          if (!o.found && scan && d < 5) {
            if (this.rng.d20() + K.skill(c, 'awa') >= o.def.dc - 2) {
              o.found = true;
              this.addLog(c.name + ' замечает мину!', '#ffd070');
              this.emit('float', { uid: c.uid, text: 'Мина!', col: '#ffd070' });
              if (this.settings.autoPause && !this.headless) { this.paused = true; this.emit('pause', { on: true, why: 'mine' }); }
            }
          }
          if (d < 0.55 && !(o.found && c === L && L.interact === o)) { this.detonateMine(o); break; }
        }
      }
    }
    if (scan) {
      for (const c of this.creatures) {
        if (!c.sight || c.dead || c.faction !== 'neutral' || !c.dlg || this.dialog || this.combat) continue;
        const st = this.areaState(this.area.id);
        const key = 'sight_' + c.npcId;
        if (st.seen[key] || this.flags[key]) continue;
        if (K.dist(c.x, c.z, L.x, L.z) <= c.sight && this.los(c.x, c.z, L.x, L.z)) {
          st.seen[key] = 1;
          this.flags[key] = true;
          L.path = null;
          this.startDialog(c.dlg, c);
          return;
        }
      }
    }
  };

  G.updateCombatState = function (dt) {
    const L = this.leader;
    let any = false;
    for (const c of this.creatures) {
      if (c.faction === 'hostile' && c.aggro && !c.dead && K.dist(c.x, c.z, L.x, L.z) < 34) { any = true; break; }
    }
    if (this.combat && !any) {
      this.combat = false;
      for (const c of this.partyCreatures()) {
        if (c.dead) { c.dead = false; c.hp = 1; c.anim = { a: 'getup', t: 0 }; }
        c.target = null; c.attacking = false; c.queue = []; c.roundDef = 0;
      }
      this.emit('combat', { on: false });
      this.addLog('Бой окончен.', '#c8e0ff');
    } else if (!this.combat && any) this.enterCombat();
    if (!this.combat) {
      this.regenT = (this.regenT || 0) + dt;
      if (this.regenT >= 1) {
        this.regenT = 0;
        for (const c of this.partyCreatures()) {
          if (!c.dead && !c.effects.some(e => e.id === 'plague')) {
            if (c.hp < c.maxHp) c.hp = Math.min(c.maxHp, c.hp + Math.max(1, Math.floor(c.maxHp / 60)));
            if (c.fp < c.maxFp) c.fp = Math.min(c.maxFp, c.fp + 1);
          }
        }
      }
    }
    const living = this.livingParty();
    if (!living.length && this.mode === 'play') {
      if (this.duel) { this.finishDuel(false); return; }
      this.mode = 'gameover';
      this.emit('mode', { mode: 'gameover' });
      this.emit('sfx', { id: 'gameover' });
    } else if (L.dead && living.length) {
      this.leaderId = living[0].pid;
      this.emit('leader', { pid: this.leaderId });
    }
  };

  G.updateCreature = function (c, dt) {
    c.anim.t += dt;
    if (c.dead) { c.deadT = (c.deadT || 0) + dt; return; }
    for (let i = c.effects.length - 1; i >= 0; i--) {
      const e = c.effects[i];
      e.t -= dt;
      if (e.id === 'plague') {
        e.tick = (e.tick || 0) + dt;
        if (e.tick >= 3) { e.tick = 0; this.applyDamage(c, 2, 'poison', null, true); if (c.dead) return; }
      }
      if (e.t <= 0) c.effects.splice(i, 1);
    }
    if (c.roundT > 0) c.roundT -= dt;
    if (c.roundT <= ROUND_DEF_RESET) c.roundDef = 0;
    const disabled = K.hasEffect(c, 'stun') || K.hasEffect(c, 'knockdown');
    if (disabled) { c.path = null; return; }
    if (c.faction === 'party') this.partyThink(c, dt);
    else if (c.faction === 'hostile') this.hostileThink(c, dt);
    else this.neutralThink(c, dt);
    this.moveAlong(c, dt);
  };
  const ROUND_DEF_RESET = 0.2;

  G.moveAlong = function (c, dt) {
    if (!c.path || !c.path.length) { c.moving = false; return; }
    const sp = this.speedOf(c);
    const p = c.path[0];
    const dx = p[0] - c.x, dz = p[1] - c.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.12) {
      c.path.shift();
      if (!c.path.length) { c.path = null; c.moving = false; }
      return;
    }
    const step = Math.min(d, sp * dt);
    const nx = c.x + dx / d * step, nz = c.z + dz / d * step;
    const ox = c.x, oz = c.z;
    this.moveTo(c, nx, nz);
    const want = Math.atan2(dx, dz);
    c.ang += K.wrapAngle(want - c.ang) * Math.min(1, dt * 12);
    c.moving = true;
    c.walkPh += step * 2.2;
    c.chkT = (c.chkT || 0) + dt;
    if (!c.chkPos) c.chkPos = [c.x, c.z];
    let slow = false;
    if (c.chkT >= 1) { slow = Math.hypot(c.x - c.chkPos[0], c.z - c.chkPos[1]) < sp * 0.15; c.chkT = 0; c.chkPos = [c.x, c.z]; }
    const moved = Math.hypot(c.x - ox, c.z - oz);
    if (slow) c.stuckT = 1;
    if (moved < step * 0.25 || slow) {
      c.stuckT = (c.stuckT || 0) + dt;
      if (c.stuckT > 0.8) {
        c.stuckT = 0;
        const last = c.path[c.path.length - 1];
        const d2 = this.doorAt(Math.floor(p[0]), Math.floor(p[1]));
        if (d2 && !d2.open && !d2.locked) this.openDoor(d2);
        this.pathTo(c, last[0], last[1], false);
        if (c.path && c.path.length) c.path = c.path.slice();
        c.stuckN = (c.stuckN || 0) + 1;
        if (c.stuckN > 4) { c.path = null; c.stuckN = 0; }
      }
    } else { c.stuckT = 0; c.stuckN = 0; }
  };

  G.speedOf = function (c) {
    if (c.walkSlow) return 1.6;
    if (c.faction === 'party') return c.pid === this.leaderId ? 5.0 : 5.4;
    if (c.faction === 'neutral') return c.runTo ? 4.5 : 1.5;
    if (c.big) return 3.4;
    return c.beast ? 4.6 : 4.0;
  };

  G.moveTo = function (c, nx, nz) {
    const r = c.radius;
    c.x = nx;
    this.pushOut(c, r);
    c.z = nz;
    this.pushOut(c, r);
  };

  G.pushOut = function (c, r) {
    const x0 = Math.floor(c.x - r), x1 = Math.floor(c.x + r), z0 = Math.floor(c.z - r), z1 = Math.floor(c.z + r);
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        if (!this.solid(x, z)) continue;
        const px = K.clamp(c.x, x, x + 1), pz = K.clamp(c.z, z, z + 1);
        const dx = c.x - px, dz = c.z - pz;
        const d = Math.hypot(dx, dz);
        if (d < r) {
          if (d > 1e-5) { c.x = px + dx / d * r; c.z = pz + dz / d * r; }
          else {
            const cx = x + 0.5, cz = z + 0.5;
            const ax = c.x - cx, az = c.z - cz;
            if (Math.abs(ax) > Math.abs(az)) c.x = ax > 0 ? x + 1 + r : x - r; else c.z = az > 0 ? z + 1 + r : z - r;
          }
        }
      }
    }
  };

  G.separate = function () {
    const cs = this.creatures;
    for (let i = 0; i < cs.length; i++) {
      const a = cs[i];
      if (a.dead) continue;
      for (let j = i + 1; j < cs.length; j++) {
        const b = cs[j];
        if (b.dead) continue;
        const dx = b.x - a.x, dz = b.z - a.z;
        const rr = a.radius + b.radius;
        if (Math.abs(dx) > rr || Math.abs(dz) > rr) continue;
        const d = Math.hypot(dx, dz);
        if (d >= rr || d < 1e-6) continue;
        const push = (rr - d) / 2;
        const ux = dx / d, uz = dz / d;
        let aw = a.static || a.caged ? 0 : (b.static || b.caged ? 2 : 1), bw = b.static || b.caged ? 0 : (a.static || a.caged ? 2 : 1);
        if (aw && bw && !!a.path !== !!b.path) { if (a.path) { aw = 0.15; bw = 1.85; } else { aw = 1.85; bw = 0.15; } }
        if (aw) { a.x -= ux * push * aw; a.z -= uz * push * aw; this.pushOut(a, a.radius); }
        if (bw) { b.x += ux * push * bw; b.z += uz * push * bw; this.pushOut(b, b.radius); }
      }
    }
  };

  G.nearestHostileTo = function (c, maxD, needLos) {
    let best = null, bd = maxD || 1e9;
    for (const o of this.creatures) {
      if (!this.isHostile(c, o) || (o.faction === 'hostile' && !o.aggro)) continue;
      const d = K.dist(c.x, c.z, o.x, o.z);
      if (d < bd && (!needLos || this.los(c.x, c.z, o.x, o.z))) { bd = d; best = o; }
    }
    return best;
  };

  G.partyThink = function (c, dt) {
    const L = this.leader;
    const isLeader = c === L;
    if (isLeader && c.interact) {
      const o = c.interact;
      const range = o.uid ? 2.9 : 1.9;
      if (o.dead && o.uid) { c.interact = null; }
      else if (K.dist(c.x, c.z, o.x, o.z) <= range + (o.radius || 0)) { this.doInteraction(c, o); return; }
      else if (!c.path) { this.pathTo(c, o.x, o.z, true); if (!c.path) { c.interact = null; this.addLog('Не пройти.', '#ffb0b0'); } }
      return;
    }
    const controlled = isLeader && !this.autoLeader;
    if (this.combat) {
      if (c.queue.length || c.attacking || !controlled || (this.settings.autoFight && !c.path)) this.combatAct(c, controlled);
      return;
    }
    if (controlled) {
      if (c.queue.length) this.combatAct(c, true);
      return;
    }
    if (c.queue.length) { this.combatAct(c, false); return; }
    if (isLeader) return;
    const idx = this.active.indexOf(c.pid);
    const back = -1.6, side = idx === 1 ? -1.1 : 1.1;
    const fx = L.x + Math.sin(L.ang) * back + Math.cos(L.ang) * side;
    const fz = L.z + Math.cos(L.ang) * back - Math.sin(L.ang) * side;
    const d = K.dist(c.x, c.z, L.x, L.z);
    c.followT = (c.followT || 0) - dt;
    if (d > 2.6 || (L.moving && d > 1.8)) {
      if (c.followT <= 0 || !c.path) {
        c.followT = 0.5;
        const tx = this.pathWalk(Math.floor(fx), Math.floor(fz)) ? fx : L.x, tz = this.pathWalk(Math.floor(fx), Math.floor(fz)) ? fz : L.z;
        if (d > 18) { const p = K.nearestWalkable(this.area.w, this.area.h, (x, z) => this.baseWalk(x, z) && !this.solid(x, z), L.x, L.z, 3); if (p) { c.x = p[0] + 0.5; c.z = p[1] + 0.5; } c.path = null; }
        else this.pathTo(c, tx, tz, false);
      }
    } else if (!L.moving && d < 2.0) { c.path = null; c.ang += K.wrapAngle(L.ang - c.ang) * Math.min(1, dt * 3); }
  };

  G.combatAct = function (c, controlled) {
    let t = c.target ? this.creatureByUid(c.target) : null;
    if (t && (t.dead || t.faction !== 'hostile')) { t = null; c.target = null; if (controlled) c.attacking = false; }
    if (!controlled) {
      if (this.aiSupport(c)) return;
      const L = this.leader;
      const lt = L.target ? this.creatureByUid(L.target) : null;
      if (!t) {
        t = lt && !lt.dead && lt.faction === 'hostile' ? lt : this.nearestHostileTo(c, 30, false);
        if (t) c.target = t.uid;
      }
    } else if (!t && this.settings.autoFight && !c.queue.length) {
      const near = this.nearestHostileTo(c, c.attacking ? 30 : K.weaponRange(c) + 2, true);
      if (near && (this.combatHitMe(c) || K.dist(c.x, c.z, near.x, near.z) <= K.weaponRange(c) + 1)) { t = near; c.target = t.uid; c.attacking = true; }
    }
    const q = c.queue[0];
    if (q && (q.k === 'item' || (q.k === 'power' && K.POWERS[q.power].target !== 'enemy'))) {
      if (c.roundT <= 0) { c.queue.shift(); this.execQueued(c, q); }
      return;
    }
    if (q && q.target) {
      const qt = this.creatureByUid(q.target);
      if (!qt || qt.dead) { c.queue.shift(); return; }
      t = qt;
    }
    if (!t) return;
    if (!q && !controlled && c.roundT <= 0 && this.rng.chance(0.4)) {
      const opts = c.feats.filter(f => K.FEATS[f] && K.FEATS[f].type === (K.isRanged(c) ? 'ranged' : 'melee'));
      if (opts.length) { c.queue.push({ k: 'attack', target: t.uid, feat: this.rng.pick(opts) }); return; }
    }
    this.engage(c, t, q);
  };

  G.combatHitMe = function (c) { return this.creatures.some(o => o.faction === 'hostile' && o.target === c.uid && !o.dead); };

  G.engage = function (c, t, q) {
    const ranged = q && (q.k === 'power' || q.k === 'grenade') ? true : K.isRanged(c);
    const range = q && q.k === 'grenade' ? 11 : q && q.k === 'power' ? (K.POWERS[q.power].range || 12) : K.weaponRange(c) + (ranged ? 0 : t.radius);
    const d = K.dist(c.x, c.z, t.x, t.z);
    const see = !ranged || this.los(c.x, c.z, t.x, t.z);
    if (d > range || !see) {
      c.repathT = (c.repathT || 0) - 0.05;
      if (!c.path || c.repathT <= 0) {
        c.repathT = 0.6;
        this.pathTo(c, t.x, t.z, true);
      }
      return;
    }
    c.path = null;
    c.ang = Math.atan2(t.x - c.x, t.z - c.z);
    if (c.roundT > 0) return;
    if (q) c.queue.shift();
    if (q && q.k === 'grenade') { this.throwGrenade(c, q.item, t); return; }
    if (q && q.k === 'power') { this.castPower(c, q.power, t); return; }
    this.performAttack(c, t, q && q.feat);
  };

  G.execQueued = function (c, q) {
    if (q.k === 'item') {
      const t = this.creatureByUid(q.target) || c;
      if (this.countItem(q.item)) this.useItemNow(c, q.item, t);
      c.roundT = K.ROUND;
      c.anim = { a: 'use', t: 0 };
    } else if (q.k === 'power') this.castPower(c, q.power, c);
  };

  G.aiSupport = function (c) {
    if (c.roundT > 0 || c.queue.length) return false;
    const party = this.livingParty();
    if (c.powers.indexOf('cure') >= 0 && c.fp >= K.POWERS.cure.fp) {
      const hurt = party.filter(p => p.hp < p.maxHp * 0.45 && !p.droid).length;
      if (hurt >= 1) { this.castPower(c, 'cure', c); return true; }
    }
    if (c.powers.indexOf('battle_med') >= 0 && c.fp >= K.POWERS.battle_med.fp && !K.hasEffect(c, 'battle_med') && this.creatures.filter(o => o.faction === 'hostile' && o.aggro && !o.dead).length >= 3) { this.castPower(c, 'battle_med', c); return true; }
    if (c.powers.indexOf('stun') >= 0 && c.fp >= K.POWERS.stun.fp + 5) {
      const boss = this.creatures.find(o => o.faction === 'hostile' && o.aggro && !o.dead && !o.droid && (o.boss || o.big) && !K.hasEffect(o, 'stun') && K.dist(c.x, c.z, o.x, o.z) < 12);
      if (boss && this.rng.chance(0.5)) { c.queue.push({ k: 'power', power: 'stun', target: boss.uid }); return false; }
    }
    const foes = this.creatures.filter(o => o.faction === 'hostile' && o.aggro && !o.dead);
    if (foes.length >= 3 && this.countItem('frag') && this.rng.chance(0.3)) {
      let best = null, bn = 0;
      for (const f of foes) {
        const d = K.dist(c.x, c.z, f.x, f.z);
        if (d < 3.5 || d > 11 || !this.los(c.x, c.z, f.x, f.z)) continue;
        if (this.livingParty().some(p => K.dist(p.x, p.z, f.x, f.z) < 2.8)) continue;
        const n = foes.filter(o => K.dist(o.x, o.z, f.x, f.z) < 2.6).length;
        if (n > bn) { bn = n; best = f; }
      }
      if (best && bn >= 2) { this.throwGrenade(c, 'frag', best); return true; }
    }
    if (c.hp < c.maxHp * 0.4) {
      const item = c.droid ? 'repair_kit' : (this.countItem('adv_medpac') && c.hp < c.maxHp * 0.2 ? 'adv_medpac' : 'medpac');
      if (this.countItem(item)) { this.useItemNow(c, item, c); c.roundT = K.ROUND; c.anim = { a: 'use', t: 0 }; return true; }
    }
    return false;
  };

  G.hostileThink = function (c, dt) {
    const L = this.leader;
    c.thinkT = (c.thinkT || 0) - dt;
    if (!c.aggro) {
      if (c.thinkT > 0) return;
      c.thinkT = 0.35;
      for (const p of this.livingParty()) {
        const d = K.dist(c.x, c.z, p.x, p.z);
        if (d < (c.big ? 9 : PERCEIVE) && this.los(c.x, c.z, p.x, p.z)) { this.alertGroup(c); break; }
      }
      if (!c.aggro && c.wander) this.neutralThink(c, dt);
      return;
    }
    let t = c.target ? this.creatureByUid(c.target) : null;
    if (!t || t.dead || t.faction !== 'party') { t = null; c.target = null; }
    if (c.thinkT <= 0) {
      c.thinkT = 1.2 + this.rng.next();
      let best = null, bs = 1e9;
      for (const p of this.livingParty()) {
        const d = K.dist(c.x, c.z, p.x, p.z) - (p === L ? 1 : 0) - (t === p ? 3 : 0);
        if (d < bs) { bs = d; best = p; }
      }
      if (best) { t = best; c.target = best.uid; }
    }
    if (!t) return;
    if (c.leash && c.home && K.dist(c.home[0], c.home[1], t.x, t.z) > c.leash + 7) {
      if (K.dist(c.x, c.z, c.home[0], c.home[1]) > 1) { if (!c.path) this.pathTo(c, c.home[0], c.home[1], false); }
      else { c.path = null; if (c.hp < c.maxHp) c.hp = Math.min(c.maxHp, c.hp + dt * 4); }
      return;
    }
    if (c.roundT <= 0 && c.items && c.items.length && this.rng.chance(0.2)) {
      const d = K.dist(c.x, c.z, t.x, t.z);
      if (d > 3.5 && d < 10 && this.los(c.x, c.z, t.x, t.z)) { const it = c.items.shift(); this.throwGrenade(c, it, t); return; }
    }
    if (c.roundT <= 0 && c.hp < c.maxHp * 0.3 && !c.usedMed && !c.beast && !c.droid && this.rng.chance(0.35)) {
      c.usedMed = true;
      const v = 15;
      c.hp = Math.min(c.maxHp, c.hp + v);
      this.emit('float', { uid: c.uid, text: '+' + v, col: '#60ff80' });
      c.roundT = K.ROUND;
      return;
    }
    let feat = null;
    if (c.feats.length && this.rng.chance(0.2)) {
      const opts = c.feats.filter(f => K.FEATS[f] && K.FEATS[f].type === (K.isRanged(c) ? 'ranged' : 'melee'));
      if (opts.length) feat = this.rng.pick(opts);
    }
    this.engage(c, t, feat ? { k: 'attack', target: t.uid, feat, auto: true } : null);
    if (c.queue.length && c.queue[0].auto) c.queue.length = 0;
  };

  G.alertGroup = function (c) {
    const g = c.group;
    for (const o of this.creatures) {
      if (o.faction !== 'hostile' || o.dead || o.aggro) continue;
      if (o === c || (g && o.group === g) || K.dist(o.x, o.z, c.x, c.z) < 7) {
        o.aggro = true;
        o.thinkT = 0;
        o.roundT = Math.max(o.roundT, 0.4 + this.rng.next() * 0.8);
      }
    }
    c.aggro = true;
    if (!this.combat) {
      this.enterCombat();
      if (this.settings.autoPause && !this.headless) { this.paused = true; this.emit('pause', { on: true, why: 'enemy' }); }
      this.addLog('Враг замечен!', '#ff8080');
      this.emit('sfx', { id: 'alert' });
    }
  };

  G.neutralThink = function (c, dt) {
    if (c.runTo) {
      if (!c.path) this.pathTo(c, c.runTo[0], c.runTo[1], false);
      if (K.dist(c.x, c.z, c.runTo[0], c.runTo[1]) < 0.8 || !c.path) { const cb = c.onArrive; c.runTo = null; c.path = null; if (cb) cb(); }
      return;
    }
    if (!c.wander || c.static || this.dialog) return;
    c.wanderT = (c.wanderT || this.rng.next() * 4) - dt;
    if (c.wanderT > 0 || c.path) return;
    c.wanderT = 4 + this.rng.next() * 6;
    const h = c.home || [c.x, c.z];
    for (let i = 0; i < 6; i++) {
      const x = h[0] + (this.rng.next() * 2 - 1) * c.wander, z = h[1] + (this.rng.next() * 2 - 1) * c.wander;
      if (this.baseWalk(Math.floor(x), Math.floor(z)) && !this.doorAt(Math.floor(x), Math.floor(z))) { this.pathTo(c, x, z, false); c.walkSlow = true; break; }
    }
  };

  G.performAttack = function (c, t, feat) {
    const w = K.weaponOf(c, 'r');
    const ranged = w.wt === 'ranged';
    let f = feat && K.FEATS[feat] && K.hasFeat(c, feat) && K.FEATS[feat].type === (ranged ? 'ranged' : 'melee') ? feat : null;
    const fd = f ? K.FEATS[f] : null;
    const slots = [{ s: 'r', ab: 0 }];
    if (K.isDual(c)) slots.push({ s: 'l', ab: 0 });
    else if (w.dbl) { const tw = K.hasFeat(c, 'two_weapon') || c.cls === 'sentinel'; slots[0].ab = tw ? -2 : -4; slots.push({ s: 'r', ab: tw ? -4 : -8 }); }
    if (fd && fd.extra) slots.push({ s: 'r', ab: 0 });
    c.roundDef = fd && fd.def ? fd.def : 0;
    c.roundT = K.ROUND;
    const gap = ranged ? 0.32 : 0.42;
    c.anim = { a: ranged ? 'shoot' : 'swing', t: 0, n: slots.length, gap };
    if (f) this.emit('float', { uid: c.uid, text: fd.n, col: '#ffe080' });
    slots.forEach((sl, i) => {
      const res = K.rollAttack(this.rng, c, t, sl.s, f, { ab: sl.ab });
      const delay = 0.18 + i * gap;
      const wi = K.weaponOf(c, sl.s);
      if (ranged) this.emit('bolt', { from: c.uid, to: t.uid, delay, col: (wi && wi.bolt) || '#ff4030', miss: !res.hit, deflect: res.deflect });
      this.strikes.push({ t: delay + (ranged ? 0.14 : 0.12), a: c.uid, d: t.uid, res, ranged, saber: !!(wi && wi.saber) });
    });
    this.emit('sfx', { id: ranged ? (w.heavy ? 'heavy' : 'blaster') : (w.saber ? 'saber' : 'swing') });
  };

  G.updateStrikes = function (dt) {
    for (let i = this.strikes.length - 1; i >= 0; i--) {
      const s = this.strikes[i];
      s.t -= dt;
      if (s.t > 0) continue;
      this.strikes.splice(i, 1);
      const a = this.creatureByUid(s.a), t = this.creatureByUid(s.d);
      if (!a || !t || t.dead || (a.dead && !s.ranged)) continue;
      const r = s.res;
      if (r.deflect) {
        this.emit('float', { uid: t.uid, text: 'Отражено', col: '#ffe060' });
        this.emit('sfx', { id: 'deflect' });
        if (r.reflect && r.dmg) { this.emit('bolt', { from: t.uid, to: a.uid, delay: 0, col: '#ffe060' }); this.applyDamage(a, r.dmg, 'energy', t); }
        continue;
      }
      if (!r.hit) {
        this.emit('float', { uid: t.uid, text: 'Промах', col: '#b0b0b0' });
        this.addLog(a.name + ' → ' + t.name + ': промах (' + r.roll + (r.ab >= 0 ? '+' : '') + r.ab + '=' + r.total + ' против ' + r.def + ')', '#9098a8');
        if (!s.ranged) this.emit('sfx', { id: s.saber ? 'saberclash' : 'whoosh' });
        continue;
      }
      if (r.crit) { this.stats.crits++; this.emit('shake', { v: 0.25 }); }
      this.addLog(a.name + ' → ' + t.name + ': ' + (r.crit ? 'КРИТ! ' : '') + r.dmg + ' урона (' + r.total + ' против ' + r.def + ')' + (r.sneak ? ', скрытая атака +' + r.sneak : ''), a.faction === 'party' ? '#d0e8ff' : '#ffc0c0');
      this.applyDamage(t, r.dmg, r.dt, a, false, r.crit);
      if (r.stun && !t.dead && !K.rollSave(this.rng, t, 'fort', 12)) { this.addEffect(t, { id: 'stun', t: 4 }); this.emit('float', { uid: t.uid, text: 'Оглушён', col: '#ffe080' }); }
      if (r.plague && !t.dead && !t.droid && !K.rollSave(this.rng, t, 'fort', 13)) {
        this.addEffect(t, { id: 'plague', t: 18 });
        this.emit('float', { uid: t.uid, text: 'Чума ракгулов', col: '#a0ff60' });
      }
      this.emit('sfx', { id: s.saber ? 'saberhit' : s.ranged ? 'hit' : 'hitmelee' });
    }
  };

  G.applyDamage = function (t, dmg, dt, src, quiet, crit) {
    if (t.dead) return;
    const sh = t.effects.find(e => e.id === 'shield');
    if (sh && (dt === 'energy' || dt === 'ion')) {
      if (dt === 'ion') { t.effects.splice(t.effects.indexOf(sh), 1); dmg = 0; this.emit('float', { uid: t.uid, text: 'Щит снят', col: '#80c0ff' }); }
      else {
        const ab = Math.min(sh.absorb, dmg);
        sh.absorb -= ab; dmg -= ab;
        if (sh.absorb <= 0) t.effects.splice(t.effects.indexOf(sh), 1);
        if (ab) this.emit('float', { uid: t.uid, text: 'Щит −' + ab, col: '#80c0ff' });
      }
    }
    if (this.settings.difficulty !== 1 && t.faction === 'party') dmg = Math.round(dmg * this.settings.difficulty);
    if (dmg <= 0) return;
    t.hp -= dmg;
    t.hitT = this.time;
    if (!quiet || dmg) this.emit('float', { uid: t.uid, text: String(dmg), col: t.faction === 'party' ? '#ff6060' : '#ffffff', crit });
    if (t.anim.a === 'idle' || t.anim.a === 'hit') t.anim = { a: 'hit', t: 0 };
    if (src && t.faction === 'hostile' && !t.aggro) this.alertGroup(t);
    if (src && t.faction === 'hostile' && src.faction === 'party' && !t.target) t.target = src.uid;
    if (t.immortal && t.hp < 1) t.hp = 1;
    if (this.duel && t === this.player && t.hp <= 0) { t.hp = 1; if (this.duel.endT == null) { this.duel.endT = 1.0; this.duel.won = false; t.faction = 'party'; this.addEffect(t, { id: 'knockdown', t: 5 }); if (this.duel.foe) { this.duel.foe.faction = 'neutral'; this.duel.foe.aggro = false; this.duel.foe.path = null; } } return; }
    if (t.hp <= 0) this.kill(t, src);
  };

  G.kill = function (t, src) {
    t.hp = 0;
    t.dead = true;
    t.deadT = 0;
    t.path = null;
    t.queue = [];
    t.effects = [];
    t.anim = { a: 'die', t: 0 };
    this.emit('death', { uid: t.uid });
    this.emit('sfx', { id: t.droid ? 'droiddie' : t.big ? 'roar' : 'die' });
    if (t.faction === 'party') {
      this.stats.deaths++;
      this.addLog(t.name + ' без сознания!', '#ff8080');
      return;
    }
    this.stats.kills++;
    if (t.spawnKey) this.areaState(this.area.id).dead[t.spawnKey] = 1;
    const pl = this.partyLevel();
    const tl = t.level;
    const mult = K.clamp(1 + (tl - pl) * 0.15, 0.25, 2.5);
    if (t.cr) this.gainXp(t.cr * mult);
    this.dropLoot(t);
    if (this.duel && t === this.duel.foe) { this.duel.endT = 1.4; this.duel.won = true; return; }
    if (K.DEATH_HOOKS) {
      const h = K.DEATH_HOOKS[t.tpl] || (t.npcId && K.DEATH_HOOKS[t.npcId]);
      if (h) h(this, t);
      const g = t.group && K.DEATH_HOOKS['group:' + t.group];
      if (g && !this.creatures.some(o => o.group === t.group && !o.dead && o.faction !== 'party')) g(this, t);
    }
  };

  G.dropLoot = function (t) {
    const items = [];
    for (const [id, p] of (t.loot || [])) if (this.rng.next() < p) items.push({ id, n: 1 });
    let cr = 0;
    if (t.credits) cr = this.rng.int(t.credits[0], t.credits[1]);
    if (!items.length && !cr) return;
    const key = 'corpse_' + t.uid + '_' + Math.floor(this.time * 10);
    const o = { type: 'corpse', key, x: t.x, z: t.z, n: 'Останки: ' + t.name, items, cr, model: 'remains' };
    this.objects.push(o);
    this.areaState(this.area.id).corpses.push({ key, x: t.x, z: t.z, n: o.n, items: items.slice(), cr, model: 'remains' });
  };

  G.throwGrenade = function (c, itemId, t) {
    const it = K.ITEMS[itemId];
    const u = it.use;
    if (c.faction === 'party') { if (!this.countItem(itemId)) return; this.removeItem(itemId, 1); }
    c.roundT = K.ROUND;
    c.anim = { a: 'throw', t: 0 };
    const tx = t.x, tz = t.z;
    this.emit('grenade', { from: c.uid, x: tx, z: tz, kind: u.grenade });
    this.addLog(c.name + ' бросает: ' + it.n, '#ffd070');
    const self = this;
    setTimeoutLike(this, 0.7, () => {
      self.emit('fx', { kind: u.grenade === 'frag' ? 'explosion' : u.grenade === 'ion' ? 'ion' : 'stun', x: tx, z: tz });
      self.emit('sfx', { id: 'explode' });
      self.emit('shake', { v: 0.4 });
      for (const o of self.creatures.slice()) {
        if (o.dead || K.dist(o.x, o.z, tx, tz) > u.r) continue;
        if (c.faction === 'party' ? o.faction === 'party' : o.faction !== 'party') continue;
        if (o.faction === 'neutral') continue;
        if (u.grenade === 'frag') {
          let dmg = self.rng.d(u.dmg[0], u.dmg[1]);
          if (K.rollSave(self.rng, o, 'ref', u.dc)) dmg = Math.floor(dmg / 2);
          self.applyDamage(o, dmg, 'fire', c);
        } else if (u.grenade === 'ion') {
          if (o.droid) self.applyDamage(o, self.rng.d(u.dmg[0], u.dmg[1]), 'ion', c);
          const sh = o.effects.find(e => e.id === 'shield');
          if (sh) o.effects.splice(o.effects.indexOf(sh), 1);
        } else if (u.grenade === 'stun') {
          if (!o.droid && !K.rollSave(self.rng, o, 'will', u.dc)) { self.addEffect(o, { id: 'stun', t: u.t }); self.emit('float', { uid: o.uid, text: 'Оглушён', col: '#ffe080' }); }
          if (!o.aggro && o.faction === 'hostile') self.alertGroup(o);
        }
      }
    });
  };

  function setTimeoutLike(g, t, fn) {
    g.timers = g.timers || [];
    g.timers.push({ t, fn });
  }
  K.later = setTimeoutLike;

  const baseUpdateStrikes = G.updateStrikes;
  G.updateStrikes = function (dt) {
    if (this.timers && this.timers.length) {
      for (let i = this.timers.length - 1; i >= 0; i--) {
        const tm = this.timers[i];
        tm.t -= dt;
        if (tm.t <= 0) { this.timers.splice(i, 1); tm.fn(); }
      }
    }
    baseUpdateStrikes.call(this, dt);
  };

  G.castPower = function (c, power, t) {
    const p = K.POWERS[power];
    if (c.fp < p.fp) return false;
    c.fp -= p.fp;
    c.roundT = K.ROUND;
    c.anim = { a: 'cast', t: 0 };
    this.emit('float', { uid: c.uid, text: p.n, col: '#a0d0ff' });
    this.emit('sfx', { id: 'force' });
    const dc = 10 + Math.floor(c.level / 2) + K.attrMod(c, 'wis');
    if (power === 'cure') {
      const v = 5 + c.level * 2 + Math.max(0, K.attrMod(c, 'wis'));
      for (const o of this.livingParty()) if (!o.droid && K.dist(o.x, o.z, c.x, c.z) <= p.range) this.heal(o, v);
    } else if (power === 'battle_med') {
      for (const o of this.livingParty()) { this.addEffect(o, { id: 'battle_med', t: 45 }); this.emit('fx', { kind: 'force', x: o.x, z: o.z }); }
      this.addLog('Боевая медитация Бастилы воодушевляет отряд!', '#a0d0ff');
    } else if (power === 'stun' && t) {
      this.emit('fx', { kind: 'force', x: t.x, z: t.z });
      if (t.droid || K.rollSave(this.rng, t, 'will', dc)) { this.emit('float', { uid: t.uid, text: 'Сопротивление', col: '#b0b0b0' }); }
      else { this.addEffect(t, { id: 'stun', t: 9 }); this.emit('float', { uid: t.uid, text: 'Оглушён', col: '#ffe080' }); }
      if (!t.aggro) this.alertGroup(t);
    } else if (power === 'push' && t) {
      this.emit('fx', { kind: 'force', x: t.x, z: t.z });
      let dmg = this.rng.d(Math.max(1, Math.ceil(c.level / 2)), 6);
      const saved = K.rollSave(this.rng, t, 'fort', dc) || t.big;
      if (saved) dmg = Math.floor(dmg / 2);
      else {
        const dx = t.x - c.x, dz = t.z - c.z, d = Math.hypot(dx, dz) || 1;
        this.moveTo(t, t.x + dx / d * 1.8, t.z + dz / d * 1.8);
        this.addEffect(t, { id: 'knockdown', t: 3 });
        t.anim = { a: 'knock', t: 0 };
      }
      this.applyDamage(t, Math.max(1, dmg), 'force', c);
    }
    return true;
  };

  K.PERCEIVE = PERCEIVE;
  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
