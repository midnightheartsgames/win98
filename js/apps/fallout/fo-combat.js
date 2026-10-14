(function (FO) {
  'use strict';

  FO.HIT_MODE = { LEFT_PRIMARY: 0, LEFT_SECONDARY: 1, RIGHT_PRIMARY: 2, RIGHT_SECONDARY: 3, PUNCH: 4, KICK: 5, LEFT_RELOAD: 6, RIGHT_RELOAD: 7 };
  FO.HIT_LOC = { HEAD: 0, LEFT_ARM: 1, RIGHT_ARM: 2, TORSO: 3, RIGHT_LEG: 4, LEFT_LEG: 5, EYES: 6, GROIN: 7, UNCALLED: 8 };
  FO.ATTACK_TYPE = { NONE: 0, UNARMED: 1, MELEE: 2, THROWN: 3, RANGED: 4 };
  FO.DMG = { NORMAL: 0, LASER: 1, FIRE: 2, PLASMA: 3, ELECTRICAL: 4, EMP: 5, EXPLOSION: 6 };
  Object.assign(FO.DAM, {
    HIT: 0x100, CRITICAL: 0x200, ON_FIRE: 0x400, BYPASS: 0x800, EXPLODE: 0x1000, DESTROY: 0x2000, DROP: 0x4000, LOSE_TURN: 0x8000,
    HIT_SELF: 0x10000, LOSE_AMMO: 0x20000, DUD: 0x40000, HURT_SELF: 0x80000, RANDOM_HIT: 0x100000, CRIP_RANDOM: 0x200000,
    BACKWASH: 0x400000, PERFORM_REVERSE: 0x800000
  });
  FO.WEAPON_PERK = { LONG_RANGE: 58, ACCURATE: 59, PENETRATE: 60, KNOCKBACK: 61 };

  const D = FO.DAM;
  const MODE_SUBTYPE = [0, 1, 1, 2, 2, 3, 4, 4, 4];
  const MODE_SKILL = [-1, 3, 3, 4, 4, 5, 0, 0, 0];
  const MODE_ANIM = [0, 16, 17, 42, 41, 18, 45, 46, 47];
  const CRIT_GATE = 864000;
  const UNHURTABLE_PID = 0x1000008;
  const BIG_GUN = 0x100;
  const TWO_HANDED = 0x200;
  const CRIPPLES = [D.CRIP_LEG_LEFT, D.CRIP_LEG_RIGHT, D.CRIP_ARM_LEFT, D.CRIP_ARM_RIGHT];
  const KILL_EXP_FIELD = 'exp';

  FO.combatRand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  const rnd = (a, b) => FO.combatRand(a, b);

  FO.rollCheck = function (chance, crit) {
    const margin = chance - rnd(1, 100);
    const late = !FO.gameTime || FO.gameTime() >= CRIT_GATE;
    if (margin >= 0) return late && rnd(1, 100) <= Math.trunc(margin / 10) + crit ? FO.ROLL.CRIT_SUCCESS : FO.ROLL.SUCCESS;
    return late && rnd(1, 100) <= Math.trunc(-margin / 10) ? FO.ROLL.CRIT_FAIL : FO.ROLL.FAIL;
  };

  FO.statCheck = function (o, stat, mod) {
    return rnd(1, 10) <= FO.statValue(o, stat) + (mod | 0) ? FO.ROLL.SUCCESS : FO.ROLL.FAIL;
  };

  FO.weaponFor = function (o, hitMode) {
    if (hitMode === 0 || hitMode === 1 || hitMode === 6) return FO.equipped(o, FO.FLAG.LEFT_HAND);
    if (hitMode === 2 || hitMode === 3 || hitMode === 7) return FO.equipped(o, FO.FLAG.RIGHT_HAND);
    return null;
  };

  const primary = hitMode => hitMode === 0 || hitMode === 2;

  FO.attackMode = function (weapon, hitMode) {
    const ext = weapon && weapon.proto ? weapon.proto.flagsExt | 0 : 0;
    return primary(hitMode) ? ext & 0xF : (ext >> 4) & 0xF;
  };

  FO.attackSubtype = function (weapon, hitMode) {
    if (!weapon) return FO.ATTACK_TYPE.UNARMED;
    return MODE_SUBTYPE[FO.attackMode(weapon, hitMode)] | 0;
  };

  FO.weaponSkill = function (weapon, hitMode) {
    if (!weapon) return FO.SKILL.UNARMED;
    const s = MODE_SKILL[FO.attackMode(weapon, hitMode)];
    if (s === undefined || s !== 0) return s === undefined ? -1 : s;
    const p = weapon.proto;
    if (p.dmgType === FO.DMG.LASER || p.dmgType === FO.DMG.PLASMA || p.dmgType === FO.DMG.ELECTRICAL) return FO.SKILL.ENERGY;
    return (p.flagsExt & BIG_GUN) ? FO.SKILL.BIG_GUNS : FO.SKILL.SMALL_GUNS;
  };

  FO.attackAnim = function (weapon, hitMode) {
    if (hitMode === FO.HIT_MODE.KICK) return FO.ANIM.KICK;
    if (!weapon) return FO.ANIM.PUNCH;
    return MODE_ANIM[FO.attackMode(weapon, hitMode)] | 0;
  };

  FO.weaponRange = function (o, hitMode) {
    const weapon = FO.weaponFor(o, hitMode);
    if (!weapon || hitMode === 4 || hitMode === 5) return 1;
    let range = primary(hitMode) ? weapon.proto.range1 | 0 : weapon.proto.range2 | 0;
    if (FO.attackSubtype(weapon, hitMode) === FO.ATTACK_TYPE.THROWN) {
      const heave = o.dude ? 2 * FO.perkRank(o, FO.PERK.HEAVE_HO) : 0;
      range = Math.min(range, 3 * (FO.statValue(o, FO.STAT.ST) + heave));
    }
    return range;
  };

  FO.apCost = function (o, hitMode, aimed) {
    if (hitMode === 6 || hitMode === 7) return 2;
    const weapon = FO.weaponFor(o, hitMode);
    let cost;
    if (!weapon || hitMode === 4 || hitMode === 5) cost = 3;
    else {
      cost = primary(hitMode) ? weapon.proto.ap1 | 0 : weapon.proto.ap2 | 0;
      if (o.dude && FO.hasTrait(o, FO.TRAIT.FAST_SHOT)) cost--;
    }
    if (o.dude) {
      const sub = FO.attackSubtype(weapon, hitMode);
      if (FO.perkRank(o, FO.PERK.BONUS_HTH_ATTACKS) > 0 && (sub === FO.ATTACK_TYPE.MELEE || sub === FO.ATTACK_TYPE.UNARMED)) cost--;
      if (FO.perkRank(o, FO.PERK.BONUS_RATE_OF_FIRE) > 0 && sub === FO.ATTACK_TYPE.RANGED) cost--;
    }
    if (aimed) cost++;
    return Math.max(1, cost);
  };

  FO.BAD_SHOT = { OK: 0, NO_AMMO: 1, OUT_OF_RANGE: 2, NO_AP: 3, DEAD: 4, BLOCKED: 5, ARM_CRIPPLED: 6, BOTH_ARMS: 7 };

  FO.objDist = function (a, b) {
    let d = FO.hexDist(a.tile, b.tile);
    if (a.flags & FO.FLAG.MULTIHEX) d--;
    if (b.flags & FO.FLAG.MULTIHEX) d--;
    return Math.max(0, d);
  };

  FO.apPerHexes = function (o, hexes) {
    const r = o.critter ? o.critter.results : 0;
    if ((r & D.CRIP_LEG_LEFT) && (r & D.CRIP_LEG_RIGHT)) return 8 * hexes;
    if (r & (D.CRIP_LEG_LEFT | D.CRIP_LEG_RIGHT)) return 4 * hexes;
    return hexes;
  };

  FO.ammoMax = weapon => (weapon && weapon.proto && weapon.proto.sub === FO.ITEM.WEAPON ? weapon.proto.maxAmmo | 0 : 0);

  FO.weaponDisabled = function (o, weapon) {
    if (!weapon || !weapon.proto || weapon.proto.sub !== FO.ITEM.WEAPON) return false;
    const r = o.critter ? o.critter.results : 0;
    if ((r & D.CRIP_ARM_LEFT) && (r & D.CRIP_ARM_RIGHT)) return true;
    return !!((r & (D.CRIP_ARM_LEFT | D.CRIP_ARM_RIGHT)) && FO.isTwoHanded(weapon));
  };

  FO.badShot = function (w, attacker, target, hitMode, aimed) {
    const B = FO.BAD_SHOT;
    if (target.critter && (target.critter.results & D.DEAD)) return B.DEAD;
    const weapon = FO.weaponFor(attacker, hitMode);
    const r = attacker.critter.results;
    if (weapon) {
      if ((r & D.CRIP_ARM_LEFT) && (r & D.CRIP_ARM_RIGHT)) return B.BOTH_ARMS;
      if ((r & (D.CRIP_ARM_LEFT | D.CRIP_ARM_RIGHT)) && FO.isTwoHanded(weapon)) return B.ARM_CRIPPLED;
    }
    if (FO.apCost(attacker, hitMode, aimed) > attacker.critter.ap) return B.NO_AP;
    if (FO.weaponRange(attacker, hitMode) < FO.objDist(attacker, target)) return B.OUT_OF_RANGE;
    const sub = FO.attackSubtype(weapon, hitMode);
    if (FO.ammoMax(weapon) > 0 && !(weapon.ammo | 0)) return B.NO_AMMO;
    if ((sub === FO.ATTACK_TYPE.RANGED || sub === FO.ATTACK_TYPE.THROWN) && FO.shotBlocked(w, attacker, target)) return B.BLOCKED;
    return B.OK;
  };

  FO.calledShotAllowed = function (o, hitMode) {
    if (o.dude && FO.hasTrait(o, FO.TRAIT.FAST_SHOT)) return false;
    const weapon = FO.weaponFor(o, hitMode);
    const anim = FO.attackAnim(weapon, hitMode);
    if (anim === FO.ANIM.FIRE_BURST || anim === FO.ANIM.FIRE_CONTINUOUS) return false;
    const type = FO.damageType(weapon);
    if (type === FO.DMG.EXPLOSION || type === FO.DMG.FIRE || type === FO.DMG.EMP) return false;
    return !(type === FO.DMG.PLASMA && anim === FO.ANIM.THROW);
  };

  FO.damageType = weapon => (weapon && weapon.proto ? weapon.proto.dmgType | 0 : FO.DMG.NORMAL);

  FO.isTwoHanded = weapon => !!(weapon && weapon.proto && (weapon.proto.flagsExt & TWO_HANDED));

  FO.weaponPerk = weapon => (weapon && weapon.proto ? weapon.proto.perk | 0 : -1);

  FO.tileBeyond = function (from, to, range) {
    const n = FO.hexDist(from, to);
    if (!n) return from;
    const [ax, ay] = FO.hexCenter(from);
    const [bx, by] = FO.hexCenter(to);
    const k = range / n;
    const h = FO.worldHex(ax + (bx - ax) * k + 0.01, ay + (by - ay) * k + 0.01);
    return h >= 0 ? h : to;
  };

  FO.tileToward = function (tile, dir, n) {
    let t = tile;
    for (let i = 0; i < n; i++) {
      const next = FO.hexStep(t, dir);
      if (next < 0) break;
      t = next;
    }
    return t;
  };

  FO.shotLine = function (w, attacker, from, to) {
    const out = [];
    const line = FO.hexLine(from, to);
    for (let i = 1; i < line.length; i++) {
      for (const o of w.at(line[i], attacker.elev)) {
        if (o === attacker || o.flags & FO.FLAG.HIDDEN || out.includes(o)) continue;
        const t = FO.pidType(o.pid);
        if (t === FO.PID.CRITTER) {
          if (!w.isDead(o)) out.push(o);
        } else if ((t === FO.PID.WALL || t === FO.PID.SCENERY) && !(o.flags & FO.FLAG.SHOOT_THRU) && w.blocks(o)) {
          out.push(o);
          return out;
        }
      }
    }
    return out;
  };

  FO.critterKillType = o => (o.proto ? o.proto.killType | 0 : 0);

  FO.determineToHit = function (w, attacker, target, location, hitMode, checkRange, bonus) {
    const weapon = FO.weaponFor(attacker, hitMode);
    let acc = 0;
    let ranged = false;
    if (!weapon || hitMode === 4 || hitMode === 5) acc = FO.skillValue(attacker, FO.SKILL.UNARMED);
    else if (hitMode <= 3) {
      acc = FO.skillValue(attacker, FO.weaponSkill(weapon, hitMode));
      const sub = FO.attackSubtype(weapon, hitMode);
      if (sub === FO.ATTACK_TYPE.RANGED || sub === FO.ATTACK_TYPE.THROWN) {
        ranged = true;
        if (checkRange) {
          const pe = FO.statValue(attacker, FO.STAT.PE);
          const mult = FO.weaponPerk(weapon) === FO.WEAPON_PERK.LONG_RANGE ? 4 : 2;
          let dist = Math.max(FO.hexDist(attacker.tile, target.tile) - mult * pe, -2 * pe);
          if (attacker.dude) dist -= 2 * FO.perkRank(attacker, FO.PERK.SHARPSHOOTER);
          const blind = attacker.critter && (attacker.critter.results & D.BLIND);
          acc += dist >= 0 && blind ? -12 * dist : -4 * dist;
        }
        const between = FO.shotLine(w, attacker, attacker.tile, target.tile).filter(o => o !== target && FO.pidType(o.pid) === FO.PID.CRITTER).length;
        acc -= 10 * between;
      }
      if (attacker.dude && FO.hasTrait(attacker, FO.TRAIT.ONE_HANDER)) acc += FO.isTwoHanded(weapon) ? -40 : 20;
      const short = (weapon.proto.minSt | 0) - FO.statValue(attacker, FO.STAT.ST);
      if (short > 0) acc -= 20 * short;
      if (FO.weaponPerk(weapon) === FO.WEAPON_PERK.ACCURATE) acc += 20;
    }
    acc -= FO.statValue(target, FO.STAT.AC);
    const pen = FO.EXE.hitLocations[location] | 0;
    acc += ranged ? pen : Math.trunc(pen / 2);
    if (target.flags & FO.FLAG.MULTIHEX) acc += 15;
    if (attacker.dude) {
      const light = FO.lightOf ? FO.lightOf(target) : FO.LIGHT_FULL;
      if (light <= 0x6666) acc -= 40;
      else if (light <= 0x9999) acc -= 25;
      else if (light <= 0xCCCC) acc -= 10;
    }
    acc += bonus | 0;
    if (attacker.critter && (attacker.critter.results & D.BLIND)) acc -= 25;
    if (target.critter && (target.critter.results & (D.KNOCKED_OUT | D.KNOCKED_DOWN))) acc += 40;
    if (FO.teamOf(attacker) !== FO.teamOf(w.dude)) {
      const level = FO.combatDifficulty ? FO.combatDifficulty() : 1;
      if (level === 0) acc -= 20;
      else if (level === 2) acc += 20;
    }
    return Math.min(95, acc);
  };

  FO.teamOf = o => (o && o.critter ? o.critter.team | 0 : -1);

  FO.newAttack = function (attacker, defender, hitMode, location) {
    return {
      attacker, hitMode, weapon: FO.weaponFor(attacker, hitMode), attackerDamage: 0, attackerFlags: 0, ammo: 0, message: -1,
      defender, defenderTile: defender ? defender.tile : -1, defenderLocation: location, defenderDamage: 0, defenderFlags: 0, knockback: 0,
      oops: defender, extras: []
    };
  };

  FO.weaponDamageRoll = function (o, hitMode) {
    const weapon = FO.weaponFor(o, hitMode);
    if (!weapon || hitMode === 4 || hitMode === 5) return rnd(1, FO.statValue(o, FO.STAT.MELEE_DMG) + 2);
    let max = weapon.proto.maxDmg | 0;
    const sub = FO.attackSubtype(weapon, hitMode);
    if (sub === FO.ATTACK_TYPE.MELEE || sub === FO.ATTACK_TYPE.UNARMED) max += FO.statValue(o, FO.STAT.MELEE_DMG);
    return rnd(weapon.proto.minDmg | 0, max);
  };

  FO.computeDamage = function (w, ctx, rounds, mult, onExtra) {
    const target = onExtra ? onExtra.critter : (ctx.attackerFlags & D.HIT) ? ctx.defender : ctx.attacker;
    const toDefender = !onExtra && (ctx.attackerFlags & D.HIT);
    if (!target || FO.pidType(target.pid) !== FO.PID.CRITTER) return 0;
    const flags = onExtra ? onExtra.flags : toDefender ? ctx.defenderFlags : ctx.attackerFlags;
    const type = FO.damageType(ctx.weapon);
    let dt = 0;
    let dr = 0;
    if (!((flags & D.BYPASS) && type !== FO.DMG.EMP)) {
      dt = FO.weaponPerk(ctx.weapon) === FO.WEAPON_PERK.PENETRATE ? 0 : FO.statValue(target, FO.STAT.DT + type);
      dr = FO.statValue(target, FO.STAT.DR + type);
      if (ctx.attacker.dude && FO.hasTrait(ctx.attacker, FO.TRAIT.FINESSE)) dr += 30;
    }
    const sub = FO.attackSubtype(ctx.weapon, ctx.hitMode);
    const ranged = ctx.attacker.dude && sub === FO.ATTACK_TYPE.RANGED ? 2 * FO.perkRank(ctx.attacker, FO.PERK.BONUS_RANGED_DAMAGE) : 0;
    let scale = 100;
    if (FO.teamOf(ctx.attacker) !== FO.teamOf(w.dude)) {
      const level = FO.combatDifficulty ? FO.combatDifficulty() : 1;
      if (level === 0) scale = 75;
      else if (level === 2) scale = 125;
    }
    let total = 0;
    for (let i = 0; i < rounds; i++) {
      let dmg = FO.weaponDamageRoll(ctx.attacker, ctx.hitMode) + ranged;
      dmg = Math.trunc(Math.trunc(dmg * mult / 2) * scale / 100) - dt;
      if (dmg > 0) dmg -= Math.trunc(dmg * dr / 100);
      if (dmg > 0) total += dmg;
    }
    let knock = 0;
    if ((onExtra || toDefender) && !(target.flags & FO.FLAG.MULTIHEX)) {
      if (type === FO.DMG.EXPLOSION || !ctx.weapon || sub === FO.ATTACK_TYPE.MELEE) {
        knock = Math.trunc(total / (FO.weaponPerk(ctx.weapon) === FO.WEAPON_PERK.KNOCKBACK ? 5 : 10));
      }
    }
    if (onExtra) {
      onExtra.damage += total;
      onExtra.knockback = knock;
    } else if (toDefender) {
      ctx.defenderDamage += total;
      ctx.knockback = knock;
    } else {
      ctx.attackerDamage += total;
    }
    return total;
  };

  FO.critSuccess = function (w, ctx) {
    const d = ctx.defender;
    if (d && d.pid === UNHURTABLE_PID) return 2;
    ctx.attackerFlags |= D.CRITICAL;
    const roll = rnd(1, 100) + FO.statValue(ctx.attacker, FO.STAT.BETTER_CRITS);
    const level = roll <= 20 ? 0 : roll <= 45 ? 1 : roll <= 70 ? 2 : roll <= 90 ? 3 : roll <= 100 ? 4 : 5;
    const loc = ctx.defenderLocation;
    const entry = d.dude ? FO.EXE.playerCrits[loc][level] : FO.EXE.crits[FO.critterKillType(d)][loc][level];
    const [mult, flags, stat, mod, failFlags, msg, failMsg] = entry;
    ctx.defenderFlags |= flags;
    ctx.message = msg;
    if (stat !== -1 && FO.statCheck(d, stat, mod) <= FO.ROLL.FAIL) {
      ctx.defenderFlags |= failFlags;
      ctx.message = failMsg;
    }
    if (ctx.defenderFlags & D.CRIP_RANDOM) {
      ctx.defenderFlags &= ~D.CRIP_RANDOM;
      ctx.defenderFlags |= CRIPPLES[rnd(0, 3)];
    }
    return mult;
  };

  FO.critFailure = function (w, ctx) {
    ctx.attackerFlags &= ~D.HIT;
    if (ctx.attacker.pid === UNHURTABLE_PID) return 0;
    const sub = FO.attackSubtype(ctx.weapon, ctx.hitMode);
    let type = ctx.weapon && ctx.weapon.proto ? ctx.weapon.proto.critFail | 0 : 0;
    if (type < 0) type = 0;
    const roll = rnd(1, 100) - 5 * (FO.statValue(ctx.attacker, FO.STAT.LK) - 5);
    const level = roll <= 20 ? 0 : roll <= 50 ? 1 : roll <= 75 ? 2 : roll <= 95 ? 3 : 4;
    const flags = (FO.EXE.critFails[type] || [])[level] | 0;
    if (!flags) return 0;
    ctx.attackerFlags |= D.CRITICAL | flags;
    if (flags & D.HIT_SELF) FO.computeDamage(w, ctx, sub === FO.ATTACK_TYPE.RANGED ? ctx.ammo : 1, 2);
    else if (flags & D.EXPLODE) FO.computeDamage(w, ctx, 1, 2);
    if (flags & D.HURT_SELF) ctx.attackerDamage += rnd(1, 5);
    if (flags & D.LOSE_TURN) ctx.attacker.critter.ap = 0;
    if (ctx.attackerFlags & D.LOSE_AMMO) {
      if (sub === FO.ATTACK_TYPE.RANGED) ctx.ammo = ctx.weapon ? ctx.weapon.ammo | 0 : 0;
      else ctx.attackerFlags &= ~D.LOSE_AMMO;
    }
    if (ctx.attackerFlags & D.CRIP_RANDOM) {
      ctx.attackerFlags &= ~D.CRIP_RANDOM;
      ctx.attackerFlags |= CRIPPLES[rnd(0, 3)];
    }
    if (ctx.attackerFlags & D.RANDOM_HIT) {
      const other = FO.randomVictim(w, ctx);
      if (other) {
        ctx.defender = other;
        ctx.attackerFlags = (ctx.attackerFlags | D.HIT) & ~D.CRITICAL;
        ctx.defenderLocation = FO.HIT_LOC.TORSO;
        FO.computeDamage(w, ctx, sub === FO.ATTACK_TYPE.RANGED ? ctx.ammo : 1, 2);
      } else {
        ctx.defender = ctx.oops;
      }
      if (ctx.defender) ctx.defenderTile = ctx.defender.tile;
    }
    return 0;
  };

  FO.facing = function (a, b) {
    const diff = Math.abs((a.rot | 0) - FO.hexDir(a.tile, b.tile));
    return diff <= 1 || diff === 5;
  };

  FO.randomVictim = function (w, ctx) {
    const list = FO.combatList ? FO.combatList(w) : [];
    if (!list.length) return null;
    const start = rnd(0, list.length - 1);
    for (let k = 0; k < list.length; k++) {
      const o = list[(start + k) % list.length];
      if (o === ctx.attacker || o === ctx.defender || !FO.facing(ctx.attacker, o)) continue;
      if (FO.badShot(w, ctx.attacker, o, ctx.hitMode, false) === FO.BAD_SHOT.OK) return o;
    }
    return null;
  };

  FO.shootAround = function (w, ctx) {
    const range = FO.weaponRange(ctx.attacker, ctx.hitMode);
    const end = FO.tileBeyond(ctx.attacker.tile, ctx.defender.tile, range);
    for (const o of FO.shotLine(w, ctx.attacker, ctx.attacker.tile, end)) {
      if (o === ctx.defender) continue;
      if (FO.pidType(o.pid) === FO.PID.CRITTER && rnd(1, 100) > FO.determineToHit(w, ctx.attacker, o, ctx.defenderLocation, ctx.hitMode, true)) continue;
      ctx.defender = o;
      ctx.defenderTile = o.tile;
      ctx.attackerFlags |= D.HIT;
      ctx.defenderLocation = FO.HIT_LOC.TORSO;
      FO.computeDamage(w, ctx, 1, 2);
      return true;
    }
    return false;
  };

  FO.sprayLine = function (w, ctx, end, bullets, anim) {
    let onTarget = 0;
    if (bullets <= 0 && anim !== FO.ANIM.FIRE_CONTINUOUS) return 0;
    let left = bullets;
    for (const o of FO.shotLine(w, ctx.attacker, ctx.attacker.tile, end)) {
      if (left <= 0 && anim !== FO.ANIM.FIRE_CONTINUOUS) break;
      if (FO.pidType(o.pid) !== FO.PID.CRITTER) break;
      const chance = FO.determineToHit(w, ctx.attacker, o, FO.HIT_LOC.TORSO, ctx.hitMode, true);
      let hits = 0;
      if (anim === FO.ANIM.FIRE_CONTINUOUS) left = 1;
      while (left > 0 && rnd(1, 100) <= chance) {
        hits++;
        left--;
      }
      if (!hits) continue;
      if (o === ctx.defender) {
        onTarget += hits;
        continue;
      }
      if (ctx.extras.length >= 6) continue;
      let extra = ctx.extras.find(e => e.critter === o);
      if (!extra) {
        extra = { critter: o, location: FO.HIT_LOC.TORSO, damage: 0, flags: 0, knockback: 0 };
        ctx.extras.push(extra);
      }
      FO.computeDamage(w, ctx, hits, 2, extra);
    }
    return onTarget;
  };

  FO.computeSpray = function (w, ctx, toHit, anim) {
    const weapon = ctx.weapon;
    const rounds = Math.min(weapon.proto.burst | 0, weapon.ammo | 0);
    let roll = FO.rollCheck(toHit, FO.statValue(ctx.attacker, FO.STAT.CRIT_CHANCE));
    const chance = roll === FO.ROLL.CRIT_SUCCESS ? toHit + 20 : toHit;
    let center = 1;
    let left = 1;
    let right = 1;
    let direct = 1;
    if (anim === FO.ANIM.FIRE_BURST) {
      center = Math.trunc(rounds / 3) || 1;
      left = Math.trunc(rounds / 3);
      right = rounds - center - left;
      direct = Math.trunc(center / 2);
      if (!direct) {
        direct = 1;
        center--;
      }
    }
    let hits = 0;
    for (let i = 0; i < direct; i++) if (FO.rollCheck(chance, 0) >= FO.ROLL.SUCCESS) hits++;
    if (!hits && FO.shootAround(w, ctx)) hits = 1;
    const range = FO.weaponRange(ctx.attacker, ctx.hitMode);
    const from = ctx.attacker.tile;
    hits += FO.sprayLine(w, ctx, FO.tileBeyond(from, ctx.defender.tile, range), center - hits, anim);
    const pivot = FO.hexDist(from, ctx.defender.tile) > 3 ? ctx.defender.tile : FO.tileBeyond(from, ctx.defender.tile, 3);
    const dir = FO.hexDir(pivot, from);
    hits += FO.sprayLine(w, ctx, FO.tileBeyond(from, FO.tileToward(pivot, (dir + 1) % 6, 1), range), left, anim);
    hits += FO.sprayLine(w, ctx, FO.tileBeyond(from, FO.tileToward(pivot, (dir + 5) % 6, 1), range), right, anim);
    if (roll === FO.ROLL.FAIL && (hits > 0 || ctx.extras.length > 0)) roll = FO.ROLL.SUCCESS;
    else if (roll >= FO.ROLL.SUCCESS && hits === 0 && ctx.extras.length === 0) roll = FO.ROLL.FAIL;
    return { roll, hits, spent: rounds };
  };

  FO.computeAttack = function (w, ctx) {
    const a = ctx.attacker;
    const range = FO.weaponRange(a, ctx.hitMode);
    const dist = FO.hexDist(a.tile, ctx.defender.tile);
    if (range < dist) return -1;
    const anim = FO.attackAnim(ctx.weapon, ctx.hitMode);
    const toHit = FO.determineToHit(w, a, ctx.defender, ctx.defenderLocation, ctx.hitMode, true, ctx.bonus);
    const type = FO.damageType(ctx.weapon);
    const grenade = anim === FO.ANIM.THROW && (type === FO.DMG.EXPLOSION || type === FO.DMG.PLASMA || type === FO.DMG.EMP);
    if (ctx.defenderLocation === FO.HIT_LOC.UNCALLED) ctx.defenderLocation = FO.HIT_LOC.TORSO;
    const sub = FO.attackSubtype(ctx.weapon, ctx.hitMode);
    let hits = 1;
    let spent = 1;
    let mult = 2;
    let roll;
    if (anim === FO.ANIM.FIRE_BURST || anim === FO.ANIM.FIRE_CONTINUOUS) {
      const s = FO.computeSpray(w, ctx, toHit, anim);
      roll = s.roll;
      hits = s.hits;
      spent = s.spent;
    } else {
      roll = FO.rollCheck(toHit, FO.statValue(a, FO.STAT.CRIT_CHANCE) - (FO.EXE.hitLocations[ctx.defenderLocation] | 0));
    }
    if (roll === FO.ROLL.FAIL && FO.hasTrait(w.dude, FO.TRAIT.JINXED) && rnd(0, 1) === 0) roll = FO.ROLL.CRIT_FAIL;
    if ((sub === FO.ATTACK_TYPE.MELEE || sub === FO.ATTACK_TYPE.UNARMED) && roll === FO.ROLL.SUCCESS && a.dude) {
      if (FO.perkRank(a, FO.PERK.SLAYER) > 0) roll = FO.ROLL.CRIT_SUCCESS;
      const behind = Math.abs((a.rot | 0) - (ctx.defender.rot | 0));
      if (FO.perkRank(a, FO.PERK.SILENT_DEATH) > 0 && (behind === 0 || behind === 1 || behind === 5) && FO.isSneaking(a) && ctx.defender.critter.whoHitMe !== a) mult = 4;
    }
    if (sub === FO.ATTACK_TYPE.RANGED) {
      ctx.ammo = spent;
      if (roll === FO.ROLL.SUCCESS && a.dude && FO.perkRank(a, FO.PERK.SNIPER) > 0 && rnd(1, 10) <= FO.statValue(a, FO.STAT.LK)) roll = FO.ROLL.CRIT_SUCCESS;
    } else if (ctx.weapon && (ctx.weapon.proto.maxAmmo | 0) > 0) {
      ctx.ammo = 1;
    }
    if (roll === FO.ROLL.CRIT_SUCCESS) {
      mult = FO.critSuccess(w, ctx);
      ctx.attackerFlags |= D.HIT;
      FO.computeDamage(w, ctx, hits, mult);
    } else if (roll === FO.ROLL.SUCCESS) {
      ctx.attackerFlags |= D.HIT;
      FO.computeDamage(w, ctx, hits, mult);
    } else if (roll === FO.ROLL.FAIL) {
      if (sub === FO.ATTACK_TYPE.RANGED || sub === FO.ATTACK_TYPE.THROWN) FO.shootAround(w, ctx);
    } else {
      FO.critFailure(w, ctx);
    }
    if ((sub === FO.ATTACK_TYPE.RANGED || sub === FO.ATTACK_TYPE.THROWN) && !(ctx.attackerFlags & (D.HIT | D.CRITICAL))) {
      if (grenade) ctx.defenderTile = FO.tileToward(ctx.defender.tile, rnd(0, 5), Math.max(1, rnd(1, Math.max(1, Math.trunc(dist / 2)))));
      else ctx.defenderTile = FO.tileBeyond(a.tile, ctx.defender.tile, range);
      let struck = FO.shotLine(w, ctx.defender, ctx.defender.tile, ctx.defenderTile)[0] || null;
      if (struck) ctx.defenderTile = struck.tile;
      else struck = w.blocker(ctx.defenderTile, ctx.defender.elev, null);
      if (struck && !(struck.flags & FO.FLAG.SHOOT_THRU)) {
        ctx.attackerFlags |= D.HIT;
        ctx.defender = struck;
        FO.computeDamage(w, ctx, 1, 2);
      }
    }
    if ((type === FO.DMG.EXPLOSION || grenade) && ((ctx.attackerFlags & D.HIT) || !(ctx.attackerFlags & D.CRITICAL))) FO.computeExplosion(w, ctx, false, grenade, false);
    else if (ctx.attackerFlags & D.EXPLODE) FO.computeExplosion(w, ctx, true, grenade, false);
    ctx.grenade = grenade;
    ctx.roll = roll;
    FO.markDeaths(w, ctx);
    return 0;
  };

  FO.computeExplosion = function (w, ctx, fromAttacker, grenade, noDamage) {
    const center = fromAttacker ? ctx.attacker : (ctx.attackerFlags & D.HIT) ? ctx.defender : null;
    const centerTile = center ? center.tile : ctx.defenderTile;
    const elev = ctx.attacker.elev;
    const rings = grenade ? 2 : 3;
    for (let ring = 1; ring <= rings && ctx.extras.length < 6; ring++) {
      let tile = FO.tileToward(centerTile, 0, ring);
      let dir = 2;
      for (let step = 0; step < ring * 6 && ctx.extras.length < 6; step++) {
        if (step) {
          tile = FO.tileToward(tile, dir, 1);
          if (step % ring === 0) dir = (dir + 1) % 6;
        }
        const o = w.blocker(tile, elev, center);
        if (!o || FO.pidType(o.pid) !== FO.PID.CRITTER || w.isDead(o) || (o.flags & FO.FLAG.SHOOT_THRU)) continue;
        if (FO.shotBlocked(w, o, { tile: centerTile, elev })) continue;
        if (o === ctx.attacker) {
          const hit = ctx.attackerFlags & D.HIT;
          ctx.attackerFlags &= ~D.HIT;
          FO.computeDamage(w, ctx, 1, 2);
          ctx.attackerFlags |= hit | D.BACKWASH;
          continue;
        }
        if (ctx.extras.some(e => e.critter === o)) continue;
        const one = FO.newAttack(ctx.attacker, o, ctx.hitMode, FO.HIT_LOC.TORSO);
        if (!noDamage) {
          one.attackerFlags |= D.HIT;
          FO.computeDamage(w, one, 1, 2);
        }
        ctx.extras.push({ critter: o, location: FO.HIT_LOC.TORSO, damage: one.defenderDamage, flags: one.defenderFlags, knockback: one.knockback });
      }
    }
  };

  FO.markDeaths = function (w, ctx) {
    const check = (o, dmg, set) => {
      if (!o || o.pid === UNHURTABLE_PID || FO.pidType(o.pid) !== FO.PID.CRITTER || dmg <= 0) return;
      if ((o.critter.hp | 0) - dmg <= 0) set();
    };
    check(ctx.attacker, ctx.attackerDamage, () => { ctx.attackerFlags |= D.DEAD; });
    check(ctx.defender, ctx.defenderDamage, () => { ctx.defenderFlags |= D.DEAD; });
    for (const e of ctx.extras) check(e.critter, e.damage, () => { e.flags |= D.DEAD; });
  };

  FO.killExp = function (o) {
    return o.proto ? o.proto[KILL_EXP_FIELD] | 0 : 0;
  };
})(globalThis.FO = globalThis.FO || {});
