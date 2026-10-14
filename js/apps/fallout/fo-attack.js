(function (FO) {
  'use strict';

  const D = FO.DAM;
  const A = FO.ANIM;
  const DEATH_SOFT = [A.DANCING_AUTOFIRE, A.SLICED, A.CHARRED, A.CHARRED, A.ELECTRIFY, A.FALL_BACK, A.BIG_HOLE];
  const DEATH_HARD = [A.CHUNKS, A.SLICED, A.FIRE_DANCE, A.MELTED, A.ELECTRIFIED_TO_NOTHING, A.FALL_BACK, A.EXPLODED];
  const EXPLODE_DEATH_PIDS = [0x1000017, 0x1000031, 0x1000032];
  const STAY_UPRIGHT_PIDS = [0x1000031, 0x1000032, 0x1000008];
  const UNHURTABLE_PID = 0x1000008;
  const ZAPPER_PID = 0x20001EB;
  const TURRET_FID = 0x20001F5;
  const EXPLOSION_ART = 10;
  const BLAST_ART = { grenade: 29, plasma: 31, emp: 2 };
  const MELEE_ANIMS = [A.PUNCH, A.KICK, A.THRUST, A.SWING, A.THROW];
  const MSG_YOU = 506;
  const MSG_AND = 108;
  const MSG_WEAK = 107;
  const LOCATION_BASE = 1000;
  const SFX = FO.SFX_WEAPON;
  const EXTRA = FO.SFX_EXTRA;
  const EXPLODE_HIT_MODE = 2;

  const rnd = (a, b) => FO.combatRand(a, Math.max(a, b));
  const isCritter = o => !!o && FO.pidType(o.pid) === FO.PID.CRITTER;
  const violence = cb => (cb.p.g.prefs && cb.p.g.prefs.violenceLevel !== undefined ? cb.p.g.prefs.violenceLevel : 3);
  const artOf = (o, anim) => FO.fid(FO.ART.CRITTER, FO.fidIndex(o.fid), anim, FO.fidWeapon(o.fid));
  const exists = (cb, o, anim) => cb.p.g.art.exists(artOf(o, anim));
  const artSfx = (cb, o, anim, extra) => FO.sfxArt(cb.p.g, o, anim, extra || 0);
  const weaponSfx = (cb, effect, ctx) => FO.sfxWeapon(cb.p.g, effect, ctx.weapon, ctx.hitMode, ctx.defender);
  const sameFacing = (a, b) => {
    const diff = Math.abs((a.rot | 0) - (b.rot | 0));
    return diff === 0 || diff === 1 || diff === 5;
  };

  FO.objName = function (play, o) {
    if (!o) return '';
    if (o.dude) return o.name || 'None';
    return play.g.protos.name(o.pid) || '';
  };

  FO.tempObject = function (w, fid, tile, elev) {
    const o = {
      id: w.newId(), pid: FO.PID.MISC << 24, fid, tile: -1, elev, rot: 0, frame: 0, flags: FO.FLAG.HIDDEN | FO.FLAG.NO_BLOCK,
      x: 0, y: 0, lightRadius: 0, lightIntensity: 0, inventory: [], proto: null, temp: true
    };
    return w.add(o, tile, elev);
  };

  FO.actionFrame = function (cb, fid) {
    const frm = cb.p.g.art.get(fid);
    return frm ? frm.action | 0 : 0;
  };

  FO.checkDeathAnim = function (cb, o, anim, minViolence, fallBack) {
    if (violence(cb) >= minViolence && exists(cb, o, anim)) return anim;
    if (fallBack) return A.FALL_BACK;
    return exists(cb, o, A.FALL_FRONT) ? A.FALL_BACK : A.FALL_FRONT;
  };

  FO.pickDeathAnim = function (cb, source, o, damage, type, anim, fallBack) {
    const v = violence(cb);
    if (EXPLODE_DEATH_PIDS.includes(o.pid)) return FO.checkDeathAnim(cb, o, A.EXPLODED, 2, fallBack);
    const bloody = !!(source && source.dude && FO.hasTrait(source, FO.TRAIT.BLOODY_MESS));
    let death;
    if (MELEE_ANIMS.includes(anim)) death = v === 3 && bloody ? A.BIG_HOLE : A.FALL_BACK;
    else if (anim === A.FIRE_SINGLE && type === FO.DMG.NORMAL) death = v === 3 && (bloody || damage >= 45) ? A.BIG_HOLE : A.FALL_BACK;
    else if (v <= 1 || (!bloody && damage < 15)) death = A.FALL_BACK;
    else if (v <= 2 || (!bloody && damage < 45)) death = DEATH_SOFT[type];
    else {
      death = DEATH_HARD[type];
      if (FO.checkDeathAnim(cb, o, death, 3, fallBack) !== death) death = DEATH_SOFT[type];
    }
    if (!fallBack && death === A.FALL_BACK) death = A.FALL_FRONT;
    return FO.checkDeathAnim(cb, o, death, 0, fallBack);
  };

  FO.adjustFall = function (cb, o, anim) {
    const w = cb.w;
    let out = anim;
    if (anim === A.FALL_FRONT || anim === A.FALL_BACK) {
      const dir = anim === A.FALL_FRONT ? o.rot : (o.rot + 3) % 6;
      for (let n = 1; n <= 2; n++) {
        if (w.blocker(FO.tileToward(o.tile, dir, n), o.elev, o)) {
          out = anim === A.FALL_FRONT ? A.FALL_BACK : A.FALL_FRONT;
          break;
        }
      }
    }
    if (out === A.FALL_FRONT && !exists(cb, o, A.FALL_FRONT)) out = A.FALL_BACK;
    return out;
  };

  function bloodFall(cb, o, anim, delay, steps) {
    if (!violence(cb)) return anim;
    const blood = anim === A.FALL_BACK ? A.FALL_BACK_BLOOD : anim === A.FALL_FRONT ? A.FALL_FRONT_BLOOD : -1;
    if (blood < 0 || !exists(cb, o, blood)) return anim;
    steps.push({ kind: 'anim', obj: o, code: blood, delay, hold: true });
    return blood;
  }

  function knockback(cb, o, anim, distance, dir, delay, steps) {
    const w = cb.w;
    let a = anim;
    if (a === A.FALL_FRONT && !exists(cb, o, A.FALL_FRONT)) a = A.FALL_BACK;
    let n = 1;
    for (; n <= distance; n++) {
      if (w.blocker(FO.tileToward(o.tile, dir, n), o.elev, o)) {
        n--;
        break;
      }
    }
    n--;
    steps.push({ kind: 'sfx', obj: o, delay, sound: artSfx(cb, o, a, EXTRA.KNOCKDOWN) });
    if (n > 0) steps.push({ kind: 'straight', obj: o, tile: FO.tileToward(o.tile, dir, n), code: a, delay: 0, hold: true });
    else steps.push({ kind: 'anim', obj: o, code: a, delay: 0, hold: true });
    return a;
  }

  FO.damageSteps = function (cb, o, damage, flags, weapon, fallBack, knock, dir, anim, source, delay) {
    const steps = [];
    const c = o.critter;
    const prone = (c.results & (D.KNOCKED_OUT | D.KNOCKED_DOWN)) || FO.isFallAnim(FO.fidAnim(o.fid));
    let death = -1;
    if (prone) {
      if (!(flags & D.DEAD) || (c.results & D.DEAD)) return steps;
      death = bloodFall(cb, o, FO.fidAnim(o.fid), delay, steps);
    } else if (flags & D.DEAD) {
      if (source && source.fid === FO.fid(FO.ART.MISC, EXPLOSION_ART, 0, 0)) death = FO.checkDeathAnim(cb, o, A.EXPLODED, 3, fallBack);
      else if (source && source.pid === ZAPPER_PID) death = FO.checkDeathAnim(cb, o, A.ELECTRIFIED_TO_NOTHING, 3, fallBack);
      else if (source && source.fid === TURRET_FID) death = FO.checkDeathAnim(cb, o, anim, 3, fallBack);
      else death = FO.pickDeathAnim(cb, source, o, damage, FO.damageType(weapon), anim, fallBack);
      if (death === A.FIRE_DANCE) {
        if (exists(cb, o, A.FIRE_DANCE)) {
          steps.push({ kind: 'sfx', obj: o, delay, sound: artSfx(cb, o, A.FIRE_DANCE) });
          steps.push({ kind: 'anim', obj: o, code: A.FIRE_DANCE, delay: 0, hold: true });
          const d = rnd(0, 5);
          for (let n = rnd(2, 5); n > 0; n--) {
            const t = FO.tileToward(o.tile, d, n);
            if (FO.hexLine(o.tile, t).slice(1).some(x => cb.w.blocker(x, o.elev, o))) continue;
            steps.push({ kind: 'rotate', obj: o, tile: t, delay: -1 });
            steps.push({ kind: 'straight', obj: o, tile: t, delay: 0 });
            break;
          }
        }
        death = A.BURNED_TO_NOTHING;
        steps.push({ kind: 'sfx', obj: o, delay: -1, sound: artSfx(cb, o, death) });
        steps.push({ kind: 'anim', obj: o, code: death, delay: 0, hold: true });
      } else if (knock && (death === A.FALL_FRONT || death === A.FALL_BACK)) {
        const a = knockback(cb, o, death, knock, dir, delay, steps);
        death = bloodFall(cb, o, a, -1, steps);
      } else {
        steps.push({ kind: 'sfx', obj: o, delay, sound: artSfx(cb, o, death, EXTRA.DIE) });
        death = FO.adjustFall(cb, o, death);
        steps.push({ kind: 'anim', obj: o, code: death, delay: 0, hold: true });
        if (death === A.FALL_FRONT || death === A.FALL_BACK) death = bloodFall(cb, o, death, -1, steps);
      }
    } else if (flags & (D.KNOCKED_OUT | D.KNOCKED_DOWN)) {
      const a = fallBack ? A.FALL_BACK : A.FALL_FRONT;
      steps.push({ kind: 'sfx', obj: o, delay, sound: artSfx(cb, o, a, EXTRA.KNOCKDOWN) });
      if (knock) knockback(cb, o, a, knock, dir, 0, steps);
      else steps.push({ kind: 'anim', obj: o, code: FO.adjustFall(cb, o, a), delay: 0, hold: true });
    } else if ((flags & D.ON_FIRE) && exists(cb, o, A.FIRE_DANCE)) {
      steps.push({ kind: 'anim', obj: o, code: A.FIRE_DANCE, delay });
    } else if (knock) {
      const a = knockback(cb, o, fallBack ? A.FALL_BACK : A.FALL_FRONT, knock, dir, delay, steps);
      steps.push({ kind: 'anim', obj: o, code: a === A.FALL_BACK ? A.BACK_TO_STANDING : A.PRONE_TO_STANDING, delay: -1 });
    } else {
      const hit = !fallBack && exists(cb, o, A.HIT_BACK) ? A.HIT_BACK : A.HIT_FRONT;
      steps.push({ kind: 'sfx', obj: o, delay, sound: artSfx(cb, o, hit) });
      steps.push({ kind: 'anim', obj: o, code: hit, delay: 0 });
    }
    if (weapon && weapon.owner === o) {
      if (flags & D.EXPLODE) {
        steps.push({ kind: 'call', obj: o, delay: -1, fn: () => FO.dropItem(cb, o, weapon) });
        steps.push({ kind: 'fid', obj: weapon, fid: FO.fid(FO.ART.MISC, EXPLOSION_ART, 0, 0), delay: 0 });
        steps.push({ kind: 'unhide', obj: weapon, delay: 0 });
        steps.push({ kind: 'anim', obj: weapon, delay: 0, hideAfter: true });
        steps.push({ kind: 'sfx', obj: weapon, delay: 0, sound: FO.sfxWeapon(cb.p.g, SFX.HIT, weapon, EXPLODE_HIT_MODE, o) });
        steps.push({ kind: 'erase', obj: weapon, delay: -1 });
      } else if (flags & D.DESTROY) {
        steps.push({ kind: 'call', obj: o, delay: -1, fn: () => FO.destroyItem(cb, o, weapon) });
      } else if (flags & D.DROP) {
        steps.push({ kind: 'call', obj: o, delay: -1, fn: () => FO.dropItem(cb, o, weapon) });
      }
    }
    if (flags & D.DEAD) steps.push({ kind: 'call', obj: o, delay: -1, fn: () => FO.showDeath(cb, o, death) });
    return steps;
  };

  FO.isFallAnim = a => (a >= A.FALL_BACK && a <= A.FALL_FRONT_BLOOD) || (a >= A.FALL_BACK_SF && a <= 63);

  FO.dropItem = function (cb, o, item) {
    const list = o.inventory || [];
    const i = list.findIndex(e => e.obj === item);
    if (i < 0) return;
    const e = list[i];
    list.splice(i, 1);
    if (item.flags & FO.FLAG.WORN) FO.adjustArmor(o, item, null);
    item.flags &= ~(FO.FLAG.LEFT_HAND | FO.FLAG.RIGHT_HAND | FO.FLAG.WORN);
    item.owner = null;
    item.quantityOnGround = e.count;
    cb.w.add(item, o.tile, o.elev);
    FO.refreshCritterArt(cb.p, o);
  };

  FO.destroyItem = function (cb, o, item) {
    const list = o.inventory || [];
    const i = list.findIndex(e => e.obj === item);
    if (i >= 0) list.splice(i, 1);
    item.owner = null;
    item.destroyed = true;
    FO.refreshCritterArt(cb.p, o);
  };

  FO.refreshCritterArt = function (play, o) {
    if (o.dude) {
      FO.refreshDudeArt(play);
      return;
    }
    const right = FO.equipped(o, FO.FLAG.RIGHT_HAND);
    const code = right && right.proto && right.proto.sub === FO.ITEM.WEAPON ? right.proto.anim | 0 : 0;
    o.fid = FO.fid(FO.ART.CRITTER, FO.fidIndex(o.fid), FO.fidAnim(o.fid), code);
  };

  FO.showDeath = function (cb, o, anim) {
    if (!STAY_UPRIGHT_PIDS.includes(o.pid)) o.flags |= FO.FLAG.NO_BLOCK | FO.FLAG.FLAT;
    o.outline = 0;
    if ((anim === A.ELECTRIFIED_TO_NOTHING || anim === A.EXPLODED) && !EXPLODE_DEATH_PIDS.includes(o.pid)) {
      for (const e of (o.inventory || []).slice()) FO.dropItem(cb, o, e.obj);
    }
    cb.w.baseLight[o.elev] = null;
  };

  FO.showDamage = function (cb, ctx, anim, delay, gates) {
    const a = ctx.attacker;
    const steps = [];
    const self = () => FO.damageSteps(cb, a, ctx.attackerDamage, ctx.attackerFlags, ctx.weapon, 1, 0, 0, anim, a, -1);
    for (const e of ctx.extras) {
      if (!isCritter(e.critter)) continue;
      const gate = { open: false };
      gates.push({ gate, extra: e });
      steps.push({ kind: 'call', obj: a, delay: steps.length ? 0 : delay, fn: () => { gate.open = true; } });
    }
    const lead = steps.length ? 0 : delay;
    if (ctx.attackerFlags & D.HIT) {
      const d = ctx.defender;
      if (isCritter(d)) {
        const hitAnim = a.fid === TURRET_FID ? anim : FO.attackAnim(ctx.weapon, ctx.hitMode);
        steps.push(...FO.damageSteps(cb, d, ctx.defenderDamage, ctx.defenderFlags, ctx.weapon, sameFacing(a, d) ? 0 : 1,
          ctx.knockback, FO.hexDir(a.tile, d.tile), hitAnim, a, lead));
      }
      if (ctx.attackerFlags & D.BACKWASH) steps.push(...self());
    } else if (ctx.attackerFlags & (D.CRITICAL | D.BACKWASH)) {
      steps.push(...self());
    }
    return steps;
  };

  function extraSequences(cb, ctx, gates) {
    const a = ctx.attacker;
    const anim = FO.attackAnim(ctx.weapon, ctx.hitMode);
    for (const { gate, extra } of gates) {
      const o = extra.critter;
      const steps = [{ kind: 'until', obj: o, test: () => gate.open }];
      steps.push(...FO.damageSteps(cb, o, extra.damage, extra.flags, ctx.weapon, sameFacing(a, o) ? 0 : 1, extra.knockback, FO.hexDir(a.tile, o.tile), anim, a, 0));
      cb.w.anim.runCombat(steps);
    }
  }

  function tauntSteps(cb, ctx, steps) {
    const d = ctx.defender;
    if (!isCritter(d)) return;
    const type = (ctx.attackerFlags & D.HIT) ? ((ctx.defenderFlags & D.DEAD) ? -1 : FO.AI_MSG.HIT) : FO.AI_MSG.MISS;
    if (type < 0) return;
    const s = FO.aiMessageStep(cb, d, type, ctx, -1);
    if (s) steps.push(s);
  }

  function meleeSequence(cb, ctx, anim) {
    const a = ctx.attacker;
    const d = ctx.defender;
    const steps = [{ kind: 'rotate', obj: a, tile: d.tile }];
    const frame = FO.actionFrame(cb, artOf(a, anim));
    const unarmed = anim === A.PUNCH || anim === A.KICK;
    const swing = unarmed ? artSfx(cb, a, anim) : weaponSfx(cb, SFX.ATTACK, ctx);
    const taunt = FO.aiMessageStep(cb, a, FO.AI_MSG.ATTACK, ctx, 0);
    if (taunt) steps.push(taunt);
    const gates = [];
    if (!(ctx.attackerFlags & (D.HIT | D.CRITICAL))) {
      if (d.critter.results & (D.KNOCKED_OUT | D.KNOCKED_DOWN)) {
        steps.push({ kind: 'sfx', obj: a, delay: -1, sound: swing }, { kind: 'anim', obj: a, code: anim, delay: 0 });
      } else if (exists(cb, d, A.DODGE)) {
        const dodge = FO.actionFrame(cb, artOf(d, A.DODGE));
        const dodgeSfx = artSfx(cb, d, A.DODGE);
        if (dodge > frame) {
          steps.push({ kind: 'sfx', obj: d, delay: -1, sound: dodgeSfx }, { kind: 'anim', obj: d, code: A.DODGE, delay: 0 });
          steps.push({ kind: 'sfx', obj: a, delay: dodge - frame, sound: swing }, { kind: 'anim', obj: a, code: anim, delay: 0 });
        } else {
          steps.push({ kind: 'sfx', obj: a, delay: -1, sound: swing }, { kind: 'anim', obj: a, code: anim, delay: 0 });
          steps.push({ kind: 'sfx', obj: d, delay: frame - dodge, sound: dodgeSfx }, { kind: 'anim', obj: d, code: A.DODGE, delay: 0 });
        }
      }
    } else {
      steps.push({ kind: 'sfx', obj: a, delay: 0, sound: swing }, { kind: 'anim', obj: a, code: anim, delay: 0 });
      steps.push({ kind: 'sfx', obj: a, delay: frame, sound: unarmed ? artSfx(cb, a, anim, EXTRA.CONTACT) : weaponSfx(cb, SFX.HIT, ctx) });
      steps.push(...FO.showDamage(cb, ctx, anim, 0, gates));
    }
    tauntSteps(cb, ctx, steps);
    cb.w.anim.runCombat(steps);
    extraSequences(cb, ctx, gates);
    return 0;
  }

  function throwOne(cb, a, weapon) {
    const ground = { inventory: [] };
    const thrown = FO.transfer(cb.p, a, ground, weapon, 1) || weapon;
    thrown.flags &= ~(FO.FLAG.LEFT_HAND | FO.FLAG.RIGHT_HAND | FO.FLAG.WORN);
    thrown.owner = null;
    const left = (a.inventory || []).find(e => e.obj.pid === weapon.pid && (e.obj.flags & FO.FLAG.RIGHT_HAND)) || null;
    if (!left) FO.refreshCritterArt(cb.p, a);
    if (a.dude && cb.p.iface.refreshItems) cb.p.iface.refreshItems();
    return { thrown, next: left ? left.obj : null };
  }

  function rangedSequence(cb, ctx, anim) {
    const w = cb.w;
    const g = cb.p.g;
    const a = ctx.attacker;
    const d = ctx.defender;
    const weapon = ctx.weapon;
    const type = FO.damageType(weapon);
    const attackFid = artOf(a, anim);
    const frame = FO.actionFrame(cb, attackFid);
    const steps = [{ kind: 'rotate', obj: a, tile: d.tile }];
    const grenade = anim === A.THROW && (type === FO.DMG.EXPLOSION || type === FO.DMG.PLASMA || type === FO.DMG.EMP);
    if (anim !== A.THROW) steps.push({ kind: 'anim', obj: a, code: A.POINT, delay: -1, hold: true });
    const taunt = FO.aiMessageStep(cb, a, FO.AI_MSG.ATTACK, ctx, 0);
    if (taunt) steps.push(taunt);
    steps.push({ kind: 'sfx', obj: a, delay: -1, sound: FO.fidWeapon(a.fid) ? weaponSfx(cb, SFX.ATTACK, ctx) : artSfx(cb, a, anim) });
    steps.push({ kind: 'anim', obj: a, fid: attackFid, delay: 0, hold: anim !== A.THROW });
    const temps = [];
    let proj = null;
    let savedFid = -1;
    let next = null;
    let damageDelay = 0;
    const flies = anim !== A.FIRE_CONTINUOUS && ((ctx.attackerFlags & D.HIT) || !(ctx.attackerFlags & D.CRITICAL));
    const pp = weapon && weapon.proto && weapon.proto.projPid > 0 ? g.protos.get(weapon.proto.projPid) : null;
    if (!flies) {
      damageDelay = frame;
    } else if (pp && pp.fid !== -1) {
      const start = FO.tileToward(a.tile, FO.hexDir(a.tile, d.tile), 1);
      if (anim === A.THROW) {
        const t = throwOne(cb, a, weapon);
        proj = t.thrown;
        next = t.next;
        savedFid = proj.fid;
        proj.fid = pp.fid;
        proj.flags |= FO.FLAG.HIDDEN;
        w.add(proj, start, a.elev);
      } else {
        proj = FO.tempObject(w, pp.fid, start, a.elev);
        temps.push(proj);
      }
      proj.rot = FO.hexDir(a.tile, d.tile);
      g.art.load(proj.fid);
      steps.push({ kind: 'unhide', obj: proj, delay: frame });
      steps.push({ kind: 'sfx', obj: proj, delay: 0, sound: weaponSfx(cb, SFX.FLY, ctx) });
      const hit = !!(ctx.attackerFlags & D.HIT);
      const end = hit ? d.tile : ctx.defenderTile;
      steps.push({ kind: 'straight', obj: proj, tile: end, delay: 0 });
      const travel = hit ? FO.hexLine(start, end).length - 1 : 0;
      if (grenade || type === FO.DMG.EXPLOSION) {
        if (!(ctx.attackerFlags & D.DUD)) {
          const art = !grenade ? EXPLOSION_ART : type === FO.DMG.EMP ? BLAST_ART.emp : type === FO.DMG.PLASMA ? BLAST_ART.plasma : BLAST_ART.grenade;
          const blast = FO.fid(FO.ART.MISC, art, 0, 0);
          g.art.load(blast);
          steps.push({ kind: 'fid', obj: proj, fid: blast, delay: -1 });
          steps.push({ kind: 'sfx', obj: proj, delay: 0, sound: weaponSfx(cb, SFX.HIT, ctx) });
          steps.push({ kind: 'anim', obj: proj, delay: 0, hideAfter: true });
          for (let i = 0; i < 6; i++) {
            const ring = FO.tempObject(w, blast, FO.tileToward(end, i, 1), a.elev);
            temps.push(ring);
            steps.push({ kind: 'unhide', obj: ring, delay: i ? 0 : type === FO.DMG.PLASMA ? 4 : 2 });
            steps.push({ kind: 'anim', obj: ring, delay: 0, hideAfter: true });
          }
          if (anim === A.THROW) temps.push(proj);
        }
      } else {
        if (anim !== A.THROW) steps.push({ kind: 'hide', obj: proj, delay: -1 });
        steps.push({ kind: 'sfx', obj: weapon || a, delay: travel, sound: weaponSfx(cb, SFX.HIT, ctx) });
      }
    } else {
      if (!(ctx.attackerFlags & D.HIT) && !(d.critter.results & (D.KNOCKED_OUT | D.KNOCKED_DOWN))) steps.push({ kind: 'anim', obj: d, code: A.DODGE, delay: frame });
      else steps.push({ kind: 'sfx', obj: weapon || a, delay: frame, sound: weaponSfx(cb, SFX.HIT, ctx) });
    }
    const gates = [];
    steps.push(...FO.showDamage(cb, ctx, anim, damageDelay, gates));
    tauntSteps(cb, ctx, steps);
    if (proj && anim === A.THROW && !temps.includes(proj)) steps.push({ kind: 'fid', obj: proj, fid: savedFid, delay: -1 });
    for (const t of temps) steps.push({ kind: 'erase', obj: t, delay: -1 });
    if (!(ctx.attackerFlags & (D.DEAD | D.KNOCKED_OUT | D.KNOCKED_DOWN))) {
      if (anim === A.THROW) {
        if (next && next.proto && (next.proto.anim | 0)) {
          steps.push({ kind: 'sfx', obj: a, delay: -1, sound: artSfx(cb, a, A.TAKE_OUT, next.proto.anim | 0) });
          steps.push({ kind: 'anim', obj: a, fid: FO.fid(FO.ART.CRITTER, FO.fidIndex(a.fid), A.TAKE_OUT, next.proto.anim | 0), delay: 0 });
        }
        else steps.push({ kind: 'fid', obj: a, fid: FO.fid(FO.ART.CRITTER, FO.fidIndex(a.fid), A.STAND, 0), delay: -1, reset: true });
      } else {
        steps.push({ kind: 'anim', obj: a, code: A.UNPOINT, delay: -1 });
      }
    }
    w.anim.runCombat(steps);
    extraSequences(cb, ctx, gates);
    return 0;
  }

  FO.attackSequence = function (cb, ctx) {
    const w = cb.w;
    const busy = o => !!o && w.anim.busy(o);
    if (busy(ctx.attacker) || busy(ctx.defender) || ctx.extras.some(e => busy(e.critter))) return -1;
    const anim = FO.attackAnim(ctx.weapon, ctx.hitMode);
    if (anim >= A.FIRE_SINGLE || anim === A.THROW) return rangedSequence(cb, ctx, anim);
    return meleeSequence(cb, ctx, anim);
  };

  FO.attackArt = function (cb, ctx) {
    const a = ctx.attacker;
    const d = ctx.defender;
    const anim = FO.attackAnim(ctx.weapon, ctx.hitMode);
    const list = [artOf(a, anim), artOf(a, A.POINT), artOf(a, A.UNPOINT), artOf(a, A.STAND)];
    for (const o of [d, ...ctx.extras.map(e => e.critter), a]) {
      if (!isCritter(o)) continue;
      for (const k of [A.DODGE, A.HIT_FRONT, A.HIT_BACK, A.FALL_BACK, A.FALL_FRONT, A.FALL_BACK_BLOOD, A.FALL_FRONT_BLOOD, A.BACK_TO_STANDING, A.PRONE_TO_STANDING]) list.push(artOf(o, k));
    }
    const pp = ctx.weapon && ctx.weapon.proto && ctx.weapon.proto.projPid > 0 ? cb.p.g.protos.get(ctx.weapon.proto.projPid) : null;
    if (pp && pp.fid !== -1) list.push(pp.fid);
    return cb.p.g.art.loadAll(list.filter(f => cb.p.g.art.exists(f)));
  };

  FO.locationName = function (cb, o, loc) {
    const e = cb.combatMsg.get(LOCATION_BASE + 10 * cb.p.g.art.aliasOf(FO.fidIndex(o.fid)) + loc);
    return e ? e.text : '';
  };

  function msg(cb, id) {
    const e = cb.combatMsg.get(id);
    return e ? e.text : '';
  }

  function fmt(s, args) {
    let i = 0;
    return s.replace(/%[sd]/g, () => String(args[i++]));
  }

  function baseOf(o) {
    if (o.dude) return 500;
    return FO.statValue(o, FO.STAT.GENDER) === 1 ? 700 : 600;
  }

  function nameOf(cb, o) {
    return o.dude ? msg(cb, MSG_YOU) : FO.objName(cb.p, o);
  }

  function hitText(cb, o, damage) {
    const base = baseOf(o);
    const id = damage === 0 ? base + 27 : damage === 1 ? base + 23 : base + 13;
    return fmt(msg(cb, id), damage > 1 ? [nameOf(cb, o), damage] : [nameOf(cb, o)]);
  }

  function flagText(cb, flags, o) {
    if (!flags) return '';
    const base = o.dude ? 200 : FO.statValue(o, FO.STAT.GENDER) === 0 ? 300 : 400;
    if (flags & D.DEAD) return msg(cb, MSG_AND) + msg(cb, base + 7);
    const bits = [];
    for (let i = 0; i < 32; i++) {
      const bit = 2 ** i;
      if (bit === D.HIT || bit === D.CRITICAL) continue;
      if ((flags >>> 0) & bit) bits.push(i);
    }
    if (!bits.length) return '';
    let out = '';
    for (let i = 0; i < bits.length - 1; i++) out += ', ' + msg(cb, base + bits[i]);
    return out + msg(cb, MSG_AND) + msg(cb, base + bits[bits.length - 1]);
  }

  FO.combatDisplay = function (cb, ctx) {
    const p = cb.p;
    const a = ctx.attacker;
    const lines = [];
    if (a && a.dude) {
      const weapon = FO.weaponFor(a, ctx.hitMode);
      if (weapon && (weapon.proto.minSt | 0) > FO.statValue(a, FO.STAT.ST)) lines.push(msg(cb, MSG_WEAK));
    }
    const main = (ctx.attackerFlags & D.HIT) ? ctx.defender : a;
    let name = '';
    let base = 600;
    if (main && main.dude) {
      name = msg(cb, MSG_YOU);
      base = 500;
    } else if (main) {
      name = FO.objName(p, main);
      base = FO.statValue(main, FO.STAT.GENDER) === 1 ? 700 : 600;
    }
    const d = ctx.defender;
    if (d && ctx.oops && d !== ctx.oops && (ctx.attackerFlags & D.HIT)) {
      if (isCritter(d)) {
        if (ctx.oops.dude) lines.push(fmt(msg(cb, base + 8), [name]));
        else lines.push(fmt(msg(cb, base + 9), [name, FO.objName(p, ctx.oops)]));
      } else {
        const id = a.dude ? 515 : FO.statValue(a, FO.STAT.GENDER) === 0 ? 615 : 715;
        lines.push(fmt(msg(cb, id), [a.dude ? msg(cb, MSG_YOU) : FO.objName(p, a)]) + '.');
      }
    }
    if ((ctx.attackerFlags & D.HIT) && isCritter(d) && !(d.critter.results & D.DEAD)) {
      const loc = ctx.defenderLocation;
      const dmg = ctx.defenderDamage;
      const crit = !!(ctx.attackerFlags & D.CRITICAL);
      let s = '';
      if (loc === FO.HIT_LOC.TORSO) {
        if (crit) {
          const id = dmg === 0 ? base + 28 : dmg === 1 ? base + 24 : base + 20;
          s = fmt(msg(cb, id), dmg > 1 ? [name, dmg] : [name]);
        } else {
          s = hitText(cb, d, dmg);
        }
      } else {
        const where = FO.locationName(cb, d, loc);
        if (where) {
          const id = crit ? (dmg === 0 ? base + 25 : dmg === 1 ? base + 21 : base + 11) : (dmg === 0 ? base + 26 : dmg === 1 ? base + 22 : base + 12);
          s = fmt(msg(cb, id), dmg > 1 ? [name, where, dmg] : [name, where]);
        }
      }
      const verbose = !p.g.prefs || p.g.prefs.combatMessages !== 0;
      if (verbose && crit && ctx.message !== -1) {
        s += msg(cb, ctx.message);
        if (ctx.defenderFlags & D.DEAD) {
          lines.push(s + '.');
          const killed = d.dude ? 207 : FO.statValue(d, FO.STAT.GENDER) === 0 ? 307 : 407;
          s = name + ' ' + msg(cb, killed);
        }
      } else {
        s += flagText(cb, ctx.defenderFlags, d);
      }
      lines.push(s + '.');
    }
    if (a && a.critter && !(a.critter.results & D.DEAD)) {
      const aName = a.dude ? msg(cb, MSG_YOU) : FO.objName(p, a);
      const aBase = baseOf(a);
      if (!(ctx.attackerFlags & D.HIT)) {
        let s;
        if (ctx.attackerFlags & D.CRITICAL) {
          const dmg = ctx.attackerDamage;
          const id = dmg === 0 ? aBase + 14 : dmg === 1 ? aBase + 33 : aBase + 34;
          s = fmt(msg(cb, id), dmg > 1 ? [aName, dmg] : [aName]);
        } else {
          s = fmt(msg(cb, aBase + 15), [aName]);
        }
        lines.push(s + flagText(cb, ctx.attackerFlags, a) + '.');
      }
      if (((ctx.attackerFlags & D.HIT) || !(ctx.attackerFlags & D.CRITICAL)) && ctx.attackerDamage > 0) {
        lines.push(hitText(cb, a, ctx.attackerDamage) + flagText(cb, ctx.attackerFlags, a) + '.');
      }
    }
    for (const e of ctx.extras) {
      if (!isCritter(e.critter) || (e.critter.critter.results & D.DEAD)) continue;
      lines.push(hitText(cb, e.critter, e.damage) + flagText(cb, e.flags, e.critter) + '.');
    }
    for (const l of lines) p.say(l);
    return lines;
  };

  FO.setResults = function (cb, o, flags) {
    if (!isCritter(o) || o.pid === UNHURTABLE_PID) return;
    if (flags & D.DEAD) cb.clearEvents(o);
    else if (flags & D.KNOCKED_OUT) cb.knockOut(o, 10 * (35 - 3 * FO.statValue(o, FO.STAT.EN)));
    o.critter.results |= flags & 0x80FF;
    if (o.dude && (flags & (D.CRIP_ARM_LEFT | D.CRIP_ARM_RIGHT)) && cb.p.iface.refreshItems) cb.p.iface.refreshItems();
  };

  FO.damageCritter = function (cb, o, damage, animated, hitOther, source) {
    if (!isCritter(o) || o.pid === UNHURTABLE_PID || damage <= 0) return;
    const c = o.critter;
    const max = FO.statValue(o, FO.STAT.MAX_HP);
    c.hp = Math.min(max, (c.hp | 0) - damage);
    c.damageLastTurn = (c.damageLastTurn | 0) + damage;
    if (!hitOther) cb.runScript(o, FO.ACT.DAMAGE, { source });
    if (!(c.results & D.DEAD)) {
      if (c.hp <= 0) cb.p.sc.kill(o, -1);
      return;
    }
    const who = FO.whoHitMe(o);
    const s = cb.runScript(o, FO.ACT.DESTROY, { source: who });
    const w = cb.w;
    if (!o.dude && (who === w.dude || (who && FO.teamOf(who) === FO.teamOf(w.dude))) && !(s && s.overrides)) {
      cb.exp += FO.killExp(o);
      const d = w.dude;
      const type = FO.critterKillType(o);
      d.kills = d.kills || {};
      d.kills[type] = (d.kills[type] | 0) + 1;
    }
    cb.dropScript(o);
    if (w.party) w.party = w.party.filter(x => x !== o);
  };

  FO.applyAttack = function (cb, ctx, animated) {
    const a = ctx.attacker;
    const live = isCritter(a);
    const other = ctx.defender !== ctx.oops;
    if (live && !(a.critter.results & D.DEAD)) {
      FO.setResults(cb, a, ctx.attackerFlags);
      FO.damageCritter(cb, a, ctx.attackerDamage, animated, other, null);
    }
    if (ctx.oops && ctx.oops !== ctx.defender && isCritter(ctx.oops)) FO.aiNotifyOnlookers(cb, ctx.oops);
    const hurt = (o, flags, damage, location) => {
      if (!isCritter(o) || (o.critter.results & D.DEAD)) return;
      FO.setResults(cb, o, flags);
      if (live) {
        if (o.critter.results & (D.DEAD | D.KNOCKED_OUT)) FO.setWhoHitMe(o, a);
        else if (o === ctx.oops || FO.teamOf(o) !== FO.teamOf(a)) FO.aiCheckRetaliation(o, a);
      }
      FO.damageCritter(cb, o, damage, animated, other, a);
      FO.aiNotifyOnlookers(cb, o);
      if (damage >= 0 && (ctx.attackerFlags & D.HIT)) cb.runScript(a, FO.ACT.COMBAT, { target: o, fixed: 2 });
    };
    hurt(ctx.defender, ctx.defenderFlags, ctx.defenderDamage, ctx.defenderLocation);
    for (const e of ctx.extras) hurt(e.critter, e.flags, e.damage, e.location);
  };
})(globalThis.FO = globalThis.FO || {});
