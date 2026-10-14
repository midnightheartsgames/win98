(function (FO) {
  'use strict';

  const D = FO.DAM;
  const S = FO.STAT;
  const MINUTE = 600;
  const HOUR = 36000;
  const BOOKS = { 73: [FO.SKILL.SCIENCE, 802], 76: [FO.SKILL.REPAIR, 803], 80: [FO.SKILL.FIRST_AID, 804], 102: [FO.SKILL.SMALL_GUNS, 805], 86: [FO.SKILL.OUTDOORSMAN, 806] };
  const PIDS = {
    FLARE: 79, FLARE_LIT: 205, DYNAMITE: 51, DYNAMITE_LIT: 206, PLASTIC: 85, PLASTIC_LIT: 209,
    MOTION_SENSOR: 59, GEIGER: 52, GEIGER_ON: 207, STEALTH_BOY: 54, STEALTH_BOY_ON: 210
  };
  const MSG = {
    READ: 800, NOTHING_NEW: 801, NOT_IN_COMBAT: 902, USE: 580, USE_ON: 581, NO_EFFECT: 582, DEAD: 583,
    FLARE_LIT: 587, FLARE_ALREADY: 588, TIMER_SET: 589, TIMER_TICKING: 590
  };
  const ITEM_MSG = { GAINED: 1, LOST: 2, BETTER: 3, OVERDOSE: 4, NO_CHARGES: 5, ON: 6, OFF: 7, GEIGER: 8, BAR_ONLY: 9, NOTHING: 10 };
  const MISC_MSG = { POISONED: 3000, POISON_DAMAGE: 3001, RAD_LEVEL: 1000, RAD_DEATH: 1006, RAD_LARGE: 1007, PREMATURE: 4000 };
  const FLARE_TICKS = 72000;
  const WITHDRAWAL_MINUTES = 10080;
  const CHEM_RELIANT_MINUTES = 5040;
  const RAD_HEAL_TICKS = 6048000;
  const RAD_LEVELS = [99, 199, 399, 599, 999];
  const TRICKLE = { [PIDS.STEALTH_BOY]: 600, [PIDS.STEALTH_BOY_ON]: 600, [PIDS.GEIGER]: 3000, [PIDS.GEIGER_ON]: 3000 };
  const ROBOTIC = 2;

  const rnd = (a, b) => FO.combatRand(a, Math.max(a, b));
  const isCritter = o => !!o && FO.pidType(o.pid) === FO.PID.CRITTER && !!o.critter;
  const say = (play, id, file, args) => {
    let s = play.text(id, file);
    if (!s) return;
    for (const a of args || []) s = s.replace(/%[sd]/, String(a));
    play.say(s);
  };

  FO.critterIsDead = o => isCritter(o) && ((o.critter.hp | 0) <= 0 || !!(o.critter.results & D.DEAD));

  FO.setStatBonus = function (play, o, stat, value) {
    if (stat === S.HP) return FO.adjustHits(play, o, value);
    if (stat === S.POISON) return FO.adjustPoison(play, o, value);
    if (stat === S.RAD) return FO.adjustRads(play, o, value);
    return FO.setBonusStat(o, stat, value);
  };

  FO.adjustHits = function (play, o, delta) {
    const c = o.critter;
    c.hp = (c.hp | 0) + delta;
    const max = FO.statValue(o, S.MAX_HP);
    if (c.hp > max) c.hp = max;
    else if (c.hp <= 0 && !(c.results & D.DEAD) && play.sc) play.sc.kill(o, -1);
    return 0;
  };

  FO.adjustPoison = function (play, o, amount) {
    if (!o.dude) return -1;
    const c = o.critter;
    let a = amount;
    if (a > 0) a -= Math.trunc(a * FO.statValue(o, S.POISON_RESIST) / 100);
    c.poison = (c.poison | 0) + a;
    if (c.poison <= 0) {
      c.poison = 0;
      return 0;
    }
    play.sc.removeEvents(o, 'poison');
    play.sc.addEvent(o, 10 * (505 - 5 * c.poison), 'poison');
    say(play, MISC_MSG.POISONED, 'MISC');
    return 0;
  };

  FO.adjustRads = function (play, o, amount) {
    if (!o.dude) return -1;
    const c = o.critter;
    let a = amount;
    if (a > 0) a -= Math.trunc(a * FO.statValue(o, S.RAD_RESIST) / 100);
    if (a > 0) o.radExposed = true;
    if (a >= 10) say(play, MISC_MSG.RAD_LARGE, 'MISC');
    c.rad = Math.max(0, (c.rad | 0) + a);
    return 0;
  };

  FO.applyDrugStats = function (play, o, stats, amounts, loud) {
    let random = stats[0] === -2;
    let shown = false;
    for (let i = random ? 1 : 0; i < 3; i++) {
      const stat = stats[i];
      if (stat === -1) continue;
      const before = o.dude ? FO.statValue(o, stat) : 0;
      const delta = random ? rnd(amounts[i - 1], amounts[i]) : amounts[i];
      random = false;
      FO.setStatBonus(play, o, stat, FO.statBonus(o, stat) + delta);
      if (!o.dude) continue;
      const after = FO.statValue(o, stat);
      if (after === before) continue;
      say(play, after > before ? ITEM_MSG.GAINED : ITEM_MSG.LOST, 'ITEM', [Math.abs(after - before), play.text(100 + stat, 'STAT')]);
      shown = true;
    }
    if (FO.statValue(o, S.HP) <= 0) {
      if (!(o.critter.results & D.DEAD) && play.sc) play.sc.kill(o, -1);
      if (o.dude) say(play, ITEM_MSG.OVERDOSE, 'ITEM');
    } else if (o.dude && !shown && loud) {
      say(play, ITEM_MSG.NOTHING, 'ITEM');
    }
  };

  const addictionGvar = pid => {
    const i = FO.EXE.addiction.pids.indexOf(pid);
    return i < 0 ? -1 : FO.EXE.addiction.gvars[i];
  };

  FO.isAddicted = function (play, pid) {
    const gv = play.sc ? play.sc.gvars : [];
    if (pid === -1) return FO.EXE.addiction.gvars.some(g => (gv[g] | 0) !== 0);
    const g = addictionGvar(pid);
    return g >= 0 && (gv[g] | 0) !== 0;
  };

  function queueDrug(play, o, minutes, stats, amounts) {
    if (amounts.every(a => !a)) return;
    let ticks = minutes * MINUTE;
    if (o.dude && FO.hasTrait(o, FO.TRAIT.CHEM_RESISTANT)) ticks = Math.floor(ticks / 2);
    play.sc.addEvent(o, ticks, 'drug', { stats: stats.slice(), amounts: amounts.slice() });
  }

  function queueWithdrawal(play, o, start, minutes, perk, pid) {
    play.sc.addEvent(o, minutes * MINUTE, 'withdrawal', { start, pid, perk });
  }

  FO.takeDrug = function (play, o, drug) {
    if (FO.critterIsDead(o)) return -1;
    if (!o.dude && o.proto && (o.proto.body | 0) === ROBOTIC) return -1;
    const p = drug.proto;
    const gvar = addictionGvar(drug.pid);
    for (const t of play.sc.eventsOf(o, 'withdrawal')) {
      if (addictionGvar(t.data.pid) !== gvar) continue;
      if (!t.data.start) {
        FO.perkRemoveEffect(o, t.data.perk);
        if (o.dude) say(play, ITEM_MSG.BETTER, 'ITEM');
      }
      play.sc.dropEvent(t);
      queueWithdrawal(play, o, true, p.addictionOnset | 0, t.data.perk, t.data.pid);
    }
    FO.applyDrugStats(play, o, p.stats, p.amount0, true);
    queueDrug(play, o, p.duration1 | 0, p.stats, p.amount1);
    queueDrug(play, o, p.duration2 | 0, p.stats, p.amount2);
    if (!FO.isAddicted(play, drug.pid)) {
      let chance = p.addictionRate | 0;
      if (o.dude) {
        if (FO.hasTrait(o, FO.TRAIT.CHEM_RELIANT)) chance *= 2;
        if (FO.hasTrait(o, FO.TRAIT.CHEM_RESISTANT)) chance = Math.trunc(chance / 2);
        if (FO.perkRank(o, FO.PERK.FLOWER_CHILD) > 0) chance = Math.trunc(chance / 2);
      }
      if (rnd(1, 100) <= chance) {
        queueWithdrawal(play, o, true, p.addictionOnset | 0, p.addictionEffect | 0, drug.pid);
        if (o.dude) {
          if (gvar >= 0) play.sc.gvars[gvar] = 1;
          FO.setPcFlag(o, FO.PC_FLAG.ADDICTED, true);
        }
      }
    }
    return 1;
  };

  function withdrawal(play, o, data) {
    if (data.start) {
      FO.perkAddEffect(o, data.perk);
      if (o.dude) play.say(play.text(201 + data.perk, 'PERK'));
      let minutes = WITHDRAWAL_MINUTES;
      if (o.dude) {
        if (FO.hasTrait(o, FO.TRAIT.CHEM_RELIANT)) minutes = CHEM_RELIANT_MINUTES;
        if (FO.perkRank(o, FO.PERK.FLOWER_CHILD) > 0) minutes = Math.trunc(minutes / 2);
      }
      queueWithdrawal(play, o, false, minutes, data.perk, data.pid);
      return;
    }
    FO.perkRemoveEffect(o, data.perk);
    if (!o.dude) return;
    say(play, ITEM_MSG.BETTER, 'ITEM');
    const g = addictionGvar(data.pid);
    if (g >= 0) play.sc.gvars[g] = 0;
    if (!FO.isAddicted(play, -1)) FO.setPcFlag(o, FO.PC_FLAG.ADDICTED, false);
  }

  function radiationLevel(play, o, level, healing) {
    if (!level) return;
    const R = FO.EXE.radiation;
    const sign = healing ? -1 : 1;
    if (o.dude) say(play, MISC_MSG.RAD_LEVEL + level - 1, 'MISC');
    R.stats.forEach((stat, i) => FO.setStatBonus(play, o, stat, FO.statBonus(o, stat) + R.penalty[level - 1][i] * sign));
    if (!(o.critter.results & D.DEAD)) {
      for (let i = 0; i < 6; i++) {
        const stat = R.stats[i];
        if (FO.baseStat(o, stat) > 0) continue;
        if (play.sc) play.sc.kill(o, -1);
        break;
      }
    }
    if ((o.critter.results & D.DEAD) && o.dude) say(play, MISC_MSG.RAD_DEATH, 'MISC');
  }

  FO.processRads = function (play) {
    const d = play.w.dude;
    if (!d.radExposed) return;
    const sc = play.sc;
    let current = 0;
    for (const t of sc.eventsOf(d, 'radiation')) current = t.data.level;
    const rads = d.critter.rad | 0;
    let level = RAD_LEVELS.findIndex(v => rads <= v);
    if (level < 0) level = 5;
    if (FO.statCheck(d, S.EN, FO.EXE.radiation.enMod[level]) <= FO.ROLL.FAIL) level++;
    if (level > current) sc.addEvent(d, HOUR * rnd(4, 18), 'radiation', { level, healing: false });
    d.radExposed = false;
  };

  function radiation(play, o, data) {
    if (!data.healing) {
      for (const t of play.sc.eventsOf(o, 'radiation')) {
        if (t.data.healing) radiationLevel(play, o, t.data.level, true);
        play.sc.dropEvent(t);
      }
      play.sc.addEvent(o, RAD_HEAL_TICKS, 'radiation', { level: data.level, healing: true });
    }
    radiationLevel(play, o, data.level, data.healing);
  }

  FO.explosionDamage = function (min, max, o, out) {
    let dmg = rnd(min, max) - FO.statValue(o, S.DT + FO.DMG.EXPLOSION);
    if (dmg > 0) dmg -= Math.trunc(dmg * FO.statValue(o, S.DR + FO.DMG.EXPLOSION) / 100);
    if (dmg < 0) dmg = 0;
    if (out && !(o.flags & FO.FLAG.MULTIHEX)) out.knockback = Math.trunc(dmg / 10);
    return dmg;
  };

  FO.explode = function (play, tile, elev, min, max, source) {
    const w = play.w;
    const cb = play.combat;
    const target = w.blocker(tile, elev, null);
    const victim = target && isCritter(target) && !(target.critter.results & D.DEAD) ? target : null;
    const blast = FO.fid(FO.ART.MISC, 10, 0, 0);
    play.g.art.load(blast);
    const center = FO.tempObject(w, blast, tile, elev);
    const ctx = FO.newAttack(center, victim, FO.HIT_MODE.PUNCH, FO.HIT_LOC.TORSO);
    ctx.defenderTile = tile;
    ctx.attackerFlags = D.HIT;
    if (victim) {
      const k = {};
      ctx.defenderDamage = FO.explosionDamage(min, max, victim, k);
      ctx.knockback = k.knockback | 0;
    }
    FO.computeExplosion(w, ctx, false, false, true);
    for (const e of ctx.extras) {
      const k = {};
      e.damage = FO.explosionDamage(min, max, e.critter, k);
      e.knockback = k.knockback | 0;
    }
    FO.markDeaths(w, ctx);
    const steps = [];
    steps.push({ kind: 'unhide', obj: center }, { kind: 'anim', obj: center, delay: 0, hideAfter: true });
    const temps = [center];
    for (let i = 0; i < 6; i++) {
      const ring = FO.tempObject(w, blast, FO.tileToward(tile, i, 1), elev);
      temps.push(ring);
      steps.push({ kind: 'unhide', obj: ring, delay: i ? 0 : 2 }, { kind: 'anim', obj: ring, delay: 0, hideAfter: true });
    }
    const hit = [victim, ...ctx.extras.map(e => e.critter)].filter(Boolean);
    hit.forEach((o, i) => {
      const dmg = i === 0 && victim ? ctx.defenderDamage : ctx.extras[victim ? i - 1 : i].damage;
      const flags = i === 0 && victim ? ctx.defenderFlags : ctx.extras[victim ? i - 1 : i].flags;
      const knock = i === 0 && victim ? ctx.knockback : ctx.extras[victim ? i - 1 : i].knockback;
      steps.push(...FO.damageSteps(cb, o, dmg, flags, null, 1, knock, FO.hexDir(tile, o.tile), FO.ANIM.STAND, center, 0));
    });
    for (const t of temps) steps.push({ kind: 'erase', obj: t, delay: -1 });
    steps.push({
      kind: 'call', obj: center, delay: -1, fn: () => {
        FO.combatDisplay(cb, ctx);
        FO.applyAttack(cb, ctx, true);
        let exp = 0;
        for (const o of hit) {
          if (o.critter.results & D.DEAD) {
            if (source && source.dude && !o.dude) exp += FO.killExp(o);
          } else {
            FO.setWhoHitMe(o, w.dude);
          }
        }
        if (exp > 0 && play.giveExp) play.giveExp(exp);
        if (w.inCombat) return;
        const angry = hit.find(o => !(o.critter.results & D.DEAD) && !o.dude);
        if (angry) play.requestCombat({ attacker: angry, defender: w.dude, apBonus: 0, accuracy: 0, damageBonus: 0, min: 0, max: 0x7FFFFFFF, changeFlags: 0 });
      }
    });
    w.anim.runCombat(steps);
    return 0;
  };

  function explosion(play, item, premature) {
    if (premature) say(play, MISC_MSG.PREMATURE, 'MISC');
    const holder = item.owner || item;
    const dynamite = item.pid === PIDS.DYNAMITE || item.pid === PIDS.DYNAMITE_LIT;
    const [min, max] = dynamite ? [30, 50] : [40, 80];
    if (holder.tile < 0) return;
    FO.explode(play, holder.tile, holder.elev, min, max, play.w.dude);
    FO.destroyObject(play, item);
  }

  FO.destroyObject = function (play, item) {
    const w = play.w;
    if (item.owner) {
      const list = item.owner.inventory || [];
      const i = list.findIndex(e => e.obj === item);
      if (i >= 0) {
        if (list[i].count > 1) list[i].count--;
        else list.splice(i, 1);
      }
    } else if (item.tile >= 0) {
      w.remove(item);
    }
    item.destroyed = true;
    if (play.sc) play.sc.removeTimers(item);
  };

  FO.consumeOne = function (play, owner, item) {
    const list = owner ? owner.inventory || [] : [];
    const i = list.findIndex(e => e.obj === item);
    if (i < 0) {
      FO.destroyObject(play, item);
      return;
    }
    if (list[i].count > 1) list[i].count--;
    else {
      list.splice(i, 1);
      item.owner = null;
      item.destroyed = true;
      if (owner.dude) FO.refreshDudeArt(play);
    }
  };

  function useBook(play, item) {
    const book = BOOKS[item.pid];
    if (!book) return -1;
    const w = play.w;
    if (w.inCombat) {
      say(play, MSG.NOT_IN_COMBAT, 'PROTO');
      return 0;
    }
    const d = w.dude;
    const [skill, learned] = book;
    if (FO.dip) FO.dip(play.g);
    const n = Math.trunc((100 - FO.skillValue(d, skill)) / 10);
    d.skillPoints = (d.skillPoints | 0) + n;
    for (let i = 0; i < n; i++) FO.skillIncPoint(d, skill);
    play.passTime((11 - FO.statValue(d, S.IN)) * 3600, false);
    say(play, MSG.READ, 'PROTO');
    say(play, n > 0 ? learned : MSG.NOTHING_NEW, 'PROTO');
    return 1;
  }

  function useFlare(play, item) {
    if (item.pid !== PIDS.FLARE && item.pid !== PIDS.FLARE_LIT) return -1;
    if (item.pid === PIDS.FLARE_LIT || play.sc.eventsOf(item, 'flare').length) {
      say(play, MSG.FLARE_ALREADY, 'PROTO');
      return 0;
    }
    say(play, MSG.FLARE_LIT, 'PROTO');
    item.pid = PIDS.FLARE_LIT;
    item.proto = play.g.protos.get(PIDS.FLARE_LIT) || item.proto;
    item.lightRadius = 8;
    item.lightIntensity = FO.LIGHT_FULL;
    play.w.baseLight[item.elev] = null;
    play.sc.addEvent(item, FLARE_TICKS, 'flare');
    return 0;
  }

  function useScripted(play, item) {
    if (!item.script) return -1;
    play.sc.exec(item.script, FO.ACT.USE, { source: play.w.dude });
    return 0;
  }

  function useExplosive(play, item) {
    if (![PIDS.DYNAMITE, PIDS.PLASTIC, PIDS.DYNAMITE_LIT, PIDS.PLASTIC_LIT].includes(item.pid)) return -1;
    if (play.sc.eventsOf(item, 'explosion').length || play.sc.eventsOf(item, 'explosionFailure').length) {
      say(play, MSG.TIMER_TICKING, 'PROTO');
      return 0;
    }
    play.openModal(new FO.MoveItemsScreen(play, item, 180, seconds => {
      say(play, MSG.TIMER_SET, 'PROTO');
      if (item.pid === PIDS.DYNAMITE) item.pid = PIDS.DYNAMITE_LIT;
      else if (item.pid === PIDS.PLASTIC) item.pid = PIDS.PLASTIC_LIT;
      item.proto = play.g.protos.get(item.pid) || item.proto;
      const d = play.w.dude;
      const ticks = seconds * 10;
      const [roll] = FO.rollVs(FO.skillValue(d, FO.SKILL.TRAPS), FO.statValue(d, S.CRIT_CHANCE), rnd);
      if (roll === FO.ROLL.CRIT_FAIL) play.sc.addEvent(item, 0, 'explosionFailure');
      else if (roll === FO.ROLL.FAIL) play.sc.addEvent(item, Math.floor(ticks / 2), 'explosionFailure');
      else play.sc.addEvent(item, ticks, 'explosion');
    }, { timer: true }));
    return 0;
  }

  const charges = item => (item.charges === undefined || item.charges === null ? (item.proto && item.proto.charges) | 0 : item.charges | 0);

  function spendCharge(item) {
    const n = charges(item);
    if (n <= 0) return -1;
    item.charges = n - 1;
    return 0;
  }

  function holderOf(item) {
    let o = item.owner;
    while (o && o.owner) o = o.owner;
    return o || null;
  }

  function stealthHeld(holder, except) {
    return [FO.FLAG.LEFT_HAND, FO.FLAG.RIGHT_HAND].some(f => {
      const it = FO.equipped(holder, f);
      return it && it !== except && it.pid === PIDS.STEALTH_BOY_ON;
    });
  }

  function deviceOn(play, item) {
    const holder = holderOf(item);
    const name = FO.objName(play, item);
    if (!holder) {
      say(play, ITEM_MSG.BAR_ONLY, 'ITEM');
      return -1;
    }
    if (spendCharge(item) !== 0) {
      if (holder.dude) say(play, ITEM_MSG.NO_CHARGES, 'ITEM', [name]);
      return -1;
    }
    const stealth = item.pid === PIDS.STEALTH_BOY || item.pid === PIDS.STEALTH_BOY_ON;
    play.sc.addEvent(item, TRICKLE[item.pid], 'trickle');
    item.pid = stealth ? PIDS.STEALTH_BOY_ON : PIDS.GEIGER_ON;
    item.proto = play.g.protos.get(item.pid) || item.proto;
    if (stealth) holder.flags |= FO.FLAG.TRANS_GLASS;
    if (!holder.dude) return 0;
    say(play, ITEM_MSG.ON, 'ITEM', [name]);
    if (item.pid === PIDS.GEIGER_ON) say(play, ITEM_MSG.GEIGER, 'ITEM', [holder.critter.rad | 0]);
    return 0;
  }

  function deviceOff(play, item) {
    const holder = holderOf(item);
    play.sc.removeEvents(item, 'trickle');
    if (item.pid === PIDS.STEALTH_BOY_ON) {
      item.pid = PIDS.STEALTH_BOY;
      if (holder && !stealthHeld(holder, item)) holder.flags &= ~FO.FLAG.TRANS_GLASS;
    } else if (item.pid === PIDS.GEIGER_ON) {
      item.pid = PIDS.GEIGER;
    }
    item.proto = play.g.protos.get(item.pid) || item.proto;
    if (holder && holder.dude) say(play, ITEM_MSG.OFF, 'ITEM', [FO.objName(play, item)]);
    return 0;
  }

  function useDevice(play, user, item) {
    if (item.pid === PIDS.MOTION_SENSOR) {
      if (spendCharge(item) !== 0) {
        say(play, ITEM_MSG.NO_CHARGES, 'ITEM', [FO.objName(play, item)]);
        return 0;
      }
      if (FO.AutomapScreen) play.openModal(new FO.AutomapScreen(play, { scanner: true }));
      return 0;
    }
    if (![PIDS.GEIGER, PIDS.GEIGER_ON, PIDS.STEALTH_BOY, PIDS.STEALTH_BOY_ON].includes(item.pid)) return -1;
    if (play.sc.eventsOf(item, 'trickle').length) deviceOff(play, item);
    else deviceOn(play, item);
    return 0;
  }

  FO.useItem = function (play, user, item) {
    const p = item.proto;
    let r = -1;
    if (p && (p.sub === FO.ITEM.WEAPON || p.sub === FO.ITEM.MISC)) {
      r = useBook(play, item);
      if (r === -1) r = useFlare(play, item);
      if (r === -1) r = useScripted(play, item);
      if (r === -1) r = useExplosive(play, item);
      if (r === -1 && (p.charges | 0) > 0) r = useDevice(play, user, item);
    } else if (p && p.sub === FO.ITEM.DRUG) {
      return -1;
    }
    if (r === -1) {
      say(play, MSG.NO_EFFECT, 'PROTO');
      return -1;
    }
    if (r === 1) FO.consumeOne(play, user, item);
    return r === 1 ? 0 : r;
  };

  FO.useItemOn = function (play, user, target, item) {
    const p = item.proto;
    let r = -1;
    if (p && p.sub === FO.ITEM.DRUG) {
      if (!isCritter(target)) {
        if (user.dude) say(play, MSG.NO_EFFECT, 'PROTO');
        return -1;
      }
      if (FO.critterIsDead(target)) {
        say(play, MSG.DEAD + rnd(0, 3), 'PROTO');
        return -1;
      }
      r = FO.takeDrug(play, target, item);
      if (user.dude && !target.dude) say(play, MSG.USE_ON, 'PROTO', [FO.objName(play, item), FO.objName(play, target)]);
    } else if (p && p.sub === FO.ITEM.MISC) {
      r = useFlare(play, item);
      if (r === -1) say(play, MSG.NO_EFFECT, 'PROTO', [FO.objName(play, item)]);
    } else {
      say(play, MSG.NO_EFFECT, 'PROTO', [FO.objName(play, item)]);
    }
    if (r === 1) FO.consumeOne(play, user, item);
    return r;
  };

  FO.itemEvent = function (play, t) {
    const o = t.obj;
    if (!o || o.destroyed) return null;
    switch (t.kind) {
      case 'drug':
        if (isCritter(o)) FO.applyDrugStats(play, o, t.data.stats, t.data.amounts, false);
        return !!o.dude && FO.critterIsDead(o);
      case 'withdrawal':
        if (isCritter(o)) withdrawal(play, o, t.data);
        return !!o.dude;
      case 'sneak':
        if (o.dude) FO.rollSneak(play);
        return false;
      case 'poison':
        if (!o.dude) return false;
        FO.adjustPoison(play, o, -2);
        FO.adjustHits(play, o, -1);
        say(play, MISC_MSG.POISON_DAMAGE, 'MISC');
        return (o.critter.hp | 0) <= 5;
      case 'radiation':
        if (isCritter(o)) radiation(play, o, t.data);
        return true;
      case 'flare':
        FO.destroyObject(play, o);
        return true;
      case 'explosion':
        explosion(play, o, false);
        return true;
      case 'explosionFailure':
        explosion(play, o, true);
        return true;
      case 'trickle':
        if (spendCharge(o) === 0) play.sc.addEvent(o, TRICKLE[o.pid] || 600, 'trickle');
        else {
          const holder = holderOf(o);
          if (holder && holder.dude) say(play, ITEM_MSG.NO_CHARGES, 'ITEM', [FO.objName(play, o)]);
          deviceOff(play, o);
        }
        return false;
      default:
        return null;
    }
  };

  const LEAVE_ORDER = ['drug', 'knockout', 'withdrawal', null, 'midnight', 'flare', 'explosion', 'trickle', 'sneak', 'explosionFailure'];

  FO.leaveMapEvents = function (play) {
    const sc = play.sc;
    const w = play.w;
    const all = () => (w.map && w.map.timers ? w.map.timers : []).concat(sc.events);
    for (const kind of LEAVE_ORDER) {
      for (const t of all().filter(e => (e.kind || null) === kind)) {
        const o = t.obj;
        const member = !!o && (!!o.dude || FO.isPartyMember(w, o));
        let drop = true;
        if (kind === 'drug') {
          drop = !member;
          if (drop && isCritter(o)) FO.applyDrugStats(play, o, t.data.stats, t.data.amounts, false);
        } else if (kind === 'knockout') {
          drop = false;
          if (isCritter(o) && !(o.critter.results & D.DEAD)) {
            o.critter.results &= ~(D.KNOCKED_OUT | D.KNOCKED_DOWN);
            o.fid = FO.fid(FO.ART.CRITTER, FO.fidIndex(o.fid), FO.ANIM.STAND, FO.fidWeapon(o.fid));
            o.frame = 0;
          }
        } else if (kind === 'withdrawal') {
          drop = !member;
          if (drop && isCritter(o) && !t.data.start) FO.perkRemoveEffect(o, t.data.perk);
        } else if (kind === 'flare') {
          if (o && !o.destroyed) FO.destroyObject(play, o);
        } else if (kind === 'explosion' || kind === 'explosionFailure') {
          if (o && !o.destroyed) explosion(play, o, false);
        } else if (kind === 'trickle') {
          if (o && !o.destroyed) deviceOff(play, o);
        } else if (kind === 'sneak') {
          FO.setPcFlag(w.dude, FO.PC_FLAG.SNEAK, false);
        }
        if (drop) sc.dropEvent(t);
      }
    }
  };
})(globalThis.FO = globalThis.FO || {});
