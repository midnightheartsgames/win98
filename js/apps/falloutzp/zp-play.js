(function (Z) {
  'use strict';

  const G = Z.Game.prototype;
  Z.SWAP_COOL = 0.6;
  Z.DRAW_COOL = 0.4;

  Z.GAME_INIT.push(g => {
    g.ext.nav = Z.buildExteriorNav(g.map, g.town, nav => { for (const fn of Z.NAV_HOOKS || []) fn(g, nav); });
    g.onDeath = (t, info) => g.handleDeath(t, info);
    g.onHit = (t, info) => g.handleHit(t, info);
  });

  G.playerActions = function (inp) {
    const p = this.player;
    if (!p || p.dead) return;
    if (p.wieldEntry !== p.equip.weapon) {
      if (p.wieldEntry !== undefined && !p.quickSwap) p.cool = Math.max(p.cool || 0, Z.SWAP_COOL);
      p.wieldEntry = p.equip.weapon;
    }
    if (p.holstered && (inp.fire || inp.reload || inp.aimPressed)) { p.holstered = false; p.cool = Math.max(p.cool || 0, Z.DRAW_COOL); return; }
    if (inp.reload) this.reload(p);
    const wd = p.weapon();
    const needPress = wd.thrown || wd.mine || (wd.wtype === 'melee' && !inp.firePressed && p.lastSwingHeld);
    const want = inp.fire && (!needPress || inp.firePressed);
    if (want && this.canAttack(p) && !p.swim) {
      const ok = this.attack(p, { aim: inp.aim, origin: inp.origin, dir: inp.dir, muzzle: inp.muzzle });
      if (ok) this.ev.emit('playerAttack', { wd });
    }
  };

  G.giveXP = function (n, why) {
    const p = this.player;
    if (!p || n <= 0) return;
    const k = Math.round(n * p.sheet.xpMult());
    p.sheet.xp += k;
    this.ev.emit('xp', { n: k, why });
    while (p.sheet.level < Z.LEVEL_CAP && p.sheet.xp >= Z.xpFor(p.sheet.level + 1)) {
      p.sheet.level++;
      p.sheet.pendingSkill = (p.sheet.pendingSkill || 0) + p.sheet.skillPointsPerLevel();
      if (p.sheet.level % 2 === 0) p.sheet.pendingPerk = (p.sheet.pendingPerk || 0) + 1;
      p.refreshMax();
      p.hp = p.hpMax;
      this.ev.emit('levelup', { level: p.sheet.level });
      this.msg('Новый уровень: ' + p.sheet.level + '!', 'level');
    }
  };

  G.addKarma = function (n) {
    const before = Z.karmaTitle(this.karma);
    this.karma = Z.clamp(this.karma + n, -1000, 1000);
    const after = Z.karmaTitle(this.karma);
    this.ev.emit('karma', { n });
    if (before !== after) this.msg('Карма: ' + after, 'karma');
  };

  G.addRep = function (f, fame, inf) {
    const r = this.rep[f];
    if (!r) return;
    const before = this.repLevel(f);
    r.fame = Math.max(0, r.fame + (fame || 0));
    r.inf = Math.max(0, r.inf + (inf || 0));
    const after = this.repLevel(f);
    const fd = Z.FACTIONS.find(x => x.id === f);
    if (before.id !== after.id) this.msg((fd ? fd.short : f) + ': ' + after.name, after.v < before.v ? 'warn' : 'rep');
    this.ev.emit('rep', { f, fame, inf });
  };

  G.handleHit = function (t, info) {
    const src = info.src;
    if (!src || t.dead || !t.ai) return;
    if (src.kind === 'player' || src.companion) {
      t.attackedPlayer = true;
      if (!this.hostileToPlayer(t)) {
        t.provoked = true;
        if (t.kind === 'npc' && !t.cdef) {
          t.hostile = true;
          this.crime(t, 'assault');
        }
      }
      t.ai.alerted = true;
      t.ai.aware = 1.5;
      if (t.ai.state !== 'combat' && t.ai.state !== 'flee') this.enterCombat(t, src);
      else if (!t.ai.target || t.ai.target.dead) t.ai.target = src;
      if (!t.cdef && this.rng() < 0.4) this.bark(t, 'hurt');
    } else if (t.kind !== 'player') {
      if (!this.hostileTo(t, src) && !src.dead) { t.ai.grudge = src.id; }
      if (t.ai.state !== 'combat') this.enterCombat(t, src);
    }
  };

  G.crime = function (victim, kind) {
    const f = victim.faction;
    if (!f || !this.rep[f] || this.flags.crimeT && this.time - this.flags.crimeT < 0.02) return;
    this.flags.crimeT = this.time;
    for (const o of this.cell.actors) {
      if (o === victim || o.dead || !o.ai || o.faction !== f || o.kind === 'player') continue;
      if (Math.hypot(o.x - victim.x, o.z - victim.z) > 40) continue;
      o.hostile = true;
      o.ai.alerted = true;
      o.ai.aware = 1.2;
    }
    if (kind === 'assault') this.addRep(f, 0, 3);
    if (kind === 'murder') this.addRep(f, 0, 12);
    if (kind === 'theft') this.addRep(f, 0, 2);
  };

  G.handleDeath = function (t, info) {
    const src = info.src;
    this.ev.emit('death', { a: t, info });
    if (t.kind === 'player') { this.ev.emit('playerDied', { info }); return; }
    if (t.ai) { t.ai.state = 'dead'; t.combat = false; }
    t.lootable = true;
    const byPlayer = src && (src.kind === 'player' || src.companion);
    if (byPlayer) {
      if (t.xpReward) this.giveXP(t.xpReward, t.name);
      if (t.kind === 'npc' && !t.cdef) {
        const evil = t.faction === 'shpana' || t.faction === 'raiders' || t.evil;
        const wasHostile = t.hostile && !t.provoked;
        if (evil && wasHostile) this.addKarma(5);
        else if (!wasHostile) { this.addKarma(t.essential ? -100 : -50); this.crime(t, 'murder'); }
        if (t.faction && this.rep[t.faction] && !evil) this.addRep(t.faction, 0, wasHostile ? 2 : 8);
        if (t.faction === 'shpana') this.addRep('vozn', 1, 0);
      }
    }
    if (t.onDeath) t.onDeath(this, t, info);
    for (const fn of Z.DEATH_HOOKS || []) fn(this, t, info);
  };
  Z.DEATH_HOOKS = Z.DEATH_HOOKS || [];

  G.stepPlayerState = function (dt) {
    const p = this.player;
    if (!p || p.dead) return;
    if (this.cell.exterior && p.swim) {
      p.radT = (p.radT || 0) + dt;
      if (p.radT > 1) { p.radT = 0; this.addRads(p, 2); }
    }
    if (p.rads >= 1000 && !p.dead) p.applyDamage(9999, { rads: true });
    if (p.dead) this.handleDeath(p, { rads: true });
  };

  G.addRads = function (a, n) {
    const rr = a.sheet.radRes ? a.sheet.radRes() : 0;
    const v = n * (1 - rr / 100);
    if (v <= 0) return 0;
    const before = a.rads;
    a.rads = Math.min(1000, a.rads + v);
    if (a.kind === 'player') {
      this.ev.emit('rads', { a, n: v });
      const lv = r => r >= 800 ? 4 : r >= 600 ? 3 : r >= 400 ? 2 : r >= 200 ? 1 : 0;
      if (lv(a.rads) > lv(before)) this.msg(['', 'Лёгкая лучевая болезнь.', 'Средняя лучевая болезнь.', 'Тяжёлая лучевая болезнь!', 'Крайне тяжёлая лучевая болезнь!'][lv(a.rads)], 'warn');
      this.applyRadSickness(a);
    }
    return v;
  };

  G.applyRadSickness = function (a) {
    a.sheet.mods = a.sheet.mods.filter(m => !m.radSick);
    const r = a.rads;
    if (r >= 800) a.sheet.mods.push({ radSick: true, end: -3, agi: -2, str: -2 });
    else if (r >= 600) a.sheet.mods.push({ radSick: true, end: -2, agi: -1, str: -1 });
    else if (r >= 400) a.sheet.mods.push({ radSick: true, end: -2, agi: -1 });
    else if (r >= 200) a.sheet.mods.push({ radSick: true, end: -1 });
  };

  G.useItem = function (e) {
    const p = this.player, d = Z.item(e.id);
    if (!d || p.dead) return false;
    if (d.cat === 'book') {
      if (d.mag) {
        const dur = 180 * (p.sheet.has('retention') ? 3 : p.sheet.has('comprehension') ? 2 : 1);
        p.addEffect('mag_' + d.skill, { ['sk_' + d.skill]: 10 }, dur);
        this.msg('Прочитано: ' + d.name + '. ' + Z.skillName(d.skill) + ' +10 на ' + Math.round(dur / 60) + ' мин.', 'info');
      } else {
        const n = p.sheet.has('comprehension') ? 4 : 3;
        p.sheet.books[d.skill] = (p.sheet.books[d.skill] || 0) + n;
        this.msg('Прочитано: ' + d.name + '. ' + Z.skillName(d.skill) + ' +' + n + '.', 'level');
      }
      p.take(e.id, 1);
      this.ev.emit('read', { id: e.id });
      return true;
    }
    if (d.cat !== 'aid') return false;
    if (d.limbs) { p.healLimbs(true); this.msg('Увечья вылечены.', 'info'); }
    if (d.heal) {
      const med = d.food ? (1 + p.sheet.skill('survival') / 100) : (1 + p.sheet.skill('medicine') / 100);
      const amount = d.heal * med;
      if (this.hardcore || d.over) { p.healOver = (p.healOver || 0) + amount; p.healRate = amount / (d.over || 4); }
      else p.heal(amount);
    }
    if (d.rad > 0) this.addRads(p, d.rad * (p.sheet.has('leadbelly') ? 0.5 : 1));
    if (d.rad < 0) { p.radOver = (p.radOver || 0) - d.rad; p.radRate = -d.rad / (d.over || 10); }
    if (d.effect) {
      const eff = Object.assign({}, d.effect);
      if (eff.apRestore) { p.ap = Math.min(p.sheet.maxAP(), p.ap + eff.apRestore); delete eff.apRestore; }
      if (Object.keys(eff).length) {
        const dur = (d.dur || 120) * (p.sheet.has('pharmacist') ? 2 : 1);
        p.addEffect(d.id, eff, dur);
      }
      if (d.addict && this.rng() < d.addict * (p.sheet.has('teetotal') ? 0.5 : 1)) {
        p.addict = p.addict || {};
        if (!p.addict[d.id]) { p.addict[d.id] = true; this.msg('Привыкание: ' + d.name + '.', 'warn'); }
      }
    }
    if (this.hardcore && this.needs) { if (d.h2o) this.needs.h2o = Math.max(0, this.needs.h2o - d.h2o); if (d.fod) this.needs.fod = Math.max(0, this.needs.fod - d.fod); }
    p.take(e.id, 1);
    this.ev.emit('use', { id: e.id, food: d.food, drink: d.drink });
    return true;
  };

  G.stepHealing = function (dt) {
    const p = this.player;
    if (!p || p.dead) return;
    if (p.healOver > 0) { const k = Math.min(p.healOver, (p.healRate || 10) * dt); p.heal(k); p.healOver -= k; }
    if (p.radOver > 0) { const k = Math.min(p.radOver, (p.radRate || 15) * dt); p.rads = Math.max(0, p.rads - k); p.radOver -= k; this.applyRadSickness(p); }
  };

  const baseUpdate = G.update;
  G.update = function (dt, inp) {
    if (this.paused) return;
    const slow = this.timeScale || 1;
    const sdt = dt * slow;
    baseUpdate.call(this, sdt, inp);
    if (inp) this.playerActions(inp);
    this.stepCombat(sdt);
    this.stepAI(sdt);
    this.stepPlayerState(sdt);
    this.stepHealing(sdt);
  };

  G.debugTeleport = function (x, z) {
    if (!this.cell.exterior) this.enterCell('ext', null);
    const p = this.player;
    p.x = x; p.z = z;
    p.y = this.ext.cw.groundAt(x, z, 300);
    const sw = this.waterSwim(p);
    if (sw !== null && sw !== undefined) p.y = sw;
    p.vx = p.vz = p.vy = 0;
    for (const l of this.locations) if (Math.hypot(l.x - x, l.z - z) < (l.r || 40)) this.discover(l.id, true);
  };

  G.debugSetClock = function (minuteOfDay) {
    const day = Math.floor(this.time / 1440);
    const t = day * 1440 + Z.clamp(minuteOfDay, 0, 1439.99);
    const ahead = t - this.time;
    this.time = t;
    if (ahead > 0) this.ev.emit('timePassed', { minutes: ahead, sleep: false });
  };

  G.debugAdvance = function (minutes) {
    this.time += minutes;
    this.ev.emit('timePassed', { minutes, sleep: false });
  };

  G.debugXP = function (n) {
    const p = this.player;
    this.giveXP(Math.ceil(n / Math.max(0.01, p.sheet.xpMult())), 'F7');
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
