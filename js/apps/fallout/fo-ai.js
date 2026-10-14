(function (FO) {
  'use strict';

  const D = FO.DAM;
  const M = { ENGAGING: 1, DISENGAGING: 2, FLEEING: 4 };
  const MSG = { RUN: 0, MOVE: 1, ATTACK: 2, MISS: 3, HIT: 4 };
  const HURT = { blind: 0x40, crippled: 0x3C, crippled_legs: 0x0C, crippled_arms: 0x30 };
  const KEYS = ['packet_num', 'max_dist', 'min_to_hit', 'min_hp', 'aggression', 'secondary_freq', 'called_freq', 'font', 'color',
    'outline_color', 'chance', 'run_start', 'move_start', 'attack_start', 'miss_start', 'hit_head_start', 'hit_left_arm_start',
    'hit_right_arm_start', 'hit_torso_start', 'hit_right_leg_start', 'hit_left_leg_start', 'hit_eyes_start', 'hit_groin_start', 'last_msg'];
  const HIT_KEYS = KEYS.slice(15);
  const FALLBACK = { name: '', packet_num: 0, max_dist: 15, min_to_hit: 1, min_hp: 3, hurt_too_much: 0x7C, secondary_freq: 5, called_freq: 10, chance: 0 };
  const STIMPAK_PIDS = [40, 144];
  const MISC_USES = 5000;
  const MISC_OUT_OF_AMMO = 5001;
  const MISC_RELOADS = 5002;
  const BODY_BIPED = 0;
  const BODY_ROBOTIC = 2;

  FO.AI_PATH = 'DATA\\AI.TXT';
  FO.MANEUVER = M;
  FO.AI_MSG = MSG;

  const rnd = (a, b) => FO.combatRand(a, Math.max(a, b));
  const alive = o => !!o && !!o.critter && !(o.critter.results & D.DEAD);
  const whoHit = o => (o && o.critter && o.critter.whoHitMe && typeof o.critter.whoHitMe === 'object' ? o.critter.whoHitMe : null);
  const team = o => (o && o.critter ? o.critter.team | 0 : -1);
  const body = o => (o.dude ? BODY_BIPED : o.proto ? o.proto.body | 0 : BODY_BIPED);
  const sub = item => (item && item.proto ? item.proto.sub : -1);

  FO.readAiPackets = function (text) {
    const out = [];
    let cur = null;
    for (const raw of String(text).split(/\r?\n/)) {
      const line = raw.replace(/;.*$/, '').trim();
      if (!line) continue;
      const head = line.match(/^\[(.*)\]$/);
      if (head) {
        cur = { name: head[1].trim(), hurt_too_much: 0 };
        out.push(cur);
        continue;
      }
      const eq = line.indexOf('=');
      if (!cur || eq < 0) continue;
      const key = line.slice(0, eq).trim().toLowerCase();
      const value = line.slice(eq + 1).trim();
      if (key === 'hurt_too_much') cur.hurt_too_much = value.split(',').reduce((m, s) => m | (HURT[s.trim().toLowerCase()] | 0), 0);
      else if (KEYS.includes(key)) cur[key] = parseInt(value, 10) | 0;
    }
    return out;
  };

  FO.aiPacket = function (o) {
    const list = FO.AI_PACKETS || [];
    const n = o && o.critter ? o.critter.ai | 0 : 0;
    return list.find(p => p.packet_num === n) || list[0] || FALLBACK;
  };

  FO.setWhoHitMe = function (o, who) {
    if (o && o.critter) o.critter.whoHitMe = who || null;
  };

  FO.whoHitMe = whoHit;

  FO.isPartyMember = (w, o) => !!(w.party && w.party.includes(o));

  FO.withinPerception = function (w, o, target) {
    const dist = FO.objDist(target, o);
    const pe = FO.statValue(o, FO.STAT.PE);
    const sneaking = FO.isSneakWorking(target);
    if (FO.facing(o, target)) {
      let max = 5 * pe;
      if (target.flags & FO.FLAG.TRANS_GLASS) max = Math.trunc(max / 2);
      if (sneaking) max = Math.trunc(max / 4);
      if (dist <= max) return true;
    }
    let max = w.inCombat ? 2 * pe : pe;
    if (sneaking) max = Math.trunc(max / 4);
    return dist <= max;
  };

  const byDistance = (list, ref) => list.slice().sort((a, b) => {
    if (!a) return b ? 1 : 0;
    if (!b) return -1;
    return FO.objDist(a, ref) - FO.objDist(b, ref);
  });

  FO.aiNearestOfTeam = function (cb, o, other, sameTeam) {
    for (const x of byDistance(cb.list, o)) {
      if (x === o || !alive(x)) continue;
      if (sameTeam ? team(x) === team(other) : team(x) !== team(other)) return x;
    }
    return null;
  };

  FO.aiFindAttackers = function (cb, o) {
    const mine = team(o);
    let hitMe = null;
    let hitFriend = null;
    let friendFoe = null;
    let found = 0;
    for (const x of byDistance(cb.list, o)) {
      if (found >= 3) break;
      if (x === o) continue;
      if (!hitMe && alive(x) && whoHit(x) === o) {
        hitMe = x;
        found++;
      }
      if (!hitFriend && mine === team(x)) {
        const h = whoHit(x);
        if (h && h !== o && team(h) !== mine && alive(h)) {
          hitFriend = h;
          found++;
        }
      }
      if (!friendFoe && team(x) !== mine && alive(x)) {
        const h = whoHit(x);
        if (h && team(h) === mine) {
          friendFoe = x;
          found++;
        }
      }
    }
    return [hitMe, hitFriend, friendFoe];
  };

  FO.aiDangerSource = function (cb, o) {
    let first = null;
    const who = whoHit(o);
    if (who && who !== o) {
      if (alive(who)) return who;
      if (team(o) !== team(who)) first = FO.aiNearestOfTeam(cb, o, who, true);
    }
    for (const x of byDistance([first, ...FO.aiFindAttackers(cb, o)], o)) if (x && FO.withinPerception(cb.w, o, x)) return x;
    return null;
  };

  FO.aiWantToJoin = function (cb, o) {
    const w = cb.w;
    const c = o.critter;
    if (o.flags & FO.FLAG.HIDDEN) return false;
    if (o.elev !== w.dude.elev) return false;
    if (c.results & (D.KNOCKED_OUT | D.DEAD)) return false;
    if ((c.damageLastTurn | 0) > 0) return true;
    if (cb.combatProc) cb.combatProc(o, 5);
    if (c.maneuver & M.ENGAGING) return true;
    if (c.maneuver & (M.DISENGAGING | M.FLEEING)) return false;
    return !!FO.aiDangerSource(cb, o);
  };

  FO.aiWantToStop = function (cb, o) {
    const c = o.critter;
    if (c.maneuver & M.DISENGAGING) return true;
    if (c.results & (D.KNOCKED_OUT | D.DEAD)) return true;
    if (c.maneuver & M.FLEEING) return true;
    const src = FO.aiDangerSource(cb, o);
    if (!src || !FO.withinPerception(cb.w, o, src)) return true;
    return FO.statValue(o, FO.STAT.MAX_AP) === (c.ap | 0);
  };

  FO.aiNotifyOnlookers = function (cb, victim) {
    for (const x of cb.list) if (FO.withinPerception(cb.w, x, victim)) x.critter.maneuver |= M.ENGAGING;
  };

  FO.aiThreat = function (o) {
    if (!o || FO.pidType(o.pid) !== FO.PID.CRITTER || !o.critter) return 0;
    if (o.critter.results & (D.KNOCKED_OUT | D.DEAD)) return 0;
    let best = FO.statValue(o, FO.STAT.MELEE_DMG);
    for (const flag of [FO.FLAG.RIGHT_HAND, FO.FLAG.LEFT_HAND]) {
      const item = FO.equipped(o, flag);
      if (sub(item) === FO.ITEM.WEAPON) best = Math.max(best, item.proto.maxDmg | 0);
    }
    return best + FO.statValue(o, FO.STAT.AC);
  };

  FO.aiCheckRetaliation = function (o, candidate) {
    if (FO.aiThreat(candidate) > FO.aiThreat(whoHit(o))) FO.setWhoHitMe(o, candidate);
  };

  FO.aiMessage = function (cb, o, type, ctx) {
    const p = cb.p;
    if (!o || FO.pidType(o.pid) !== FO.PID.CRITTER || o.dude || !o.critter) return null;
    if (p.g.prefs && p.g.prefs.combatTaunts === 0) return null;
    if (o.critter.results & (D.KNOCKED_OUT | D.DEAD)) return null;
    const pk = FO.aiPacket(o);
    if (rnd(1, 100) > (pk.chance | 0)) return null;
    let start;
    let end;
    if (type === MSG.HIT) {
      const loc = ctx ? ctx.defenderLocation : FO.HIT_LOC.TORSO;
      start = pk[HIT_KEYS[loc]] | 0;
      end = (pk[HIT_KEYS[loc + 1]] | 0) - 1;
    } else {
      start = pk[KEYS[11 + type]] | 0;
      end = (pk[KEYS[12 + type]] | 0) - 1;
    }
    if (end < start) return null;
    const e = cb.combatAiMsg && cb.combatAiMsg.get(rnd(start, end));
    if (!e) return null;
    return () => {
      if (p.floats.length) return;
      p.floatText(o, e.text, pk.font || 101, pk.color | 0, pk.outline_color | 0);
    };
  };

  FO.aiMessageStep = function (cb, o, type, ctx, delay) {
    const fn = FO.aiMessage(cb, o, type, ctx);
    return fn ? { kind: 'call', obj: o, delay, fn } : null;
  };

  FO.rightHand = function (o) {
    const item = FO.equipped(o, FO.FLAG.RIGHT_HAND);
    return sub(item) === FO.ITEM.WEAPON ? item : null;
  };

  FO.canReload = function (weapon, ammo) {
    if (sub(weapon) !== FO.ITEM.WEAPON || sub(ammo) !== FO.ITEM.AMMO) return false;
    if ((ammo.proto.caliber | 0) !== (weapon.proto.caliber | 0)) return false;
    return !(weapon.ammo | 0) || ammo.pid === weapon.ammoPid;
  };

  FO.packRounds = ammo => (ammo.quantity === undefined || ammo.quantity === null ? ammo.proto.quantity | 0 : ammo.quantity | 0);

  FO.reloadWeapon = function (weapon, ammo) {
    if (!FO.canReload(weapon, ammo)) return -1;
    const max = weapon.proto.maxAmmo | 0;
    let cur = weapon.ammo | 0;
    let rest = FO.packRounds(ammo);
    if (cur < max) {
      if (cur + rest <= max) {
        cur += rest;
        rest = 0;
      } else {
        rest -= max - cur;
        cur = max;
      }
      weapon.ammoPid = ammo.pid;
      ammo.quantity = rest;
      weapon.ammo = cur;
    }
    return rest;
  };

  FO.spendPack = function (owner, ammo) {
    const list = owner.inventory || [];
    const i = list.findIndex(e => e.obj === ammo);
    if (i < 0) return;
    if (list[i].count > 1) {
      list[i].count--;
      ammo.quantity = ammo.proto.quantity | 0;
    } else {
      list.splice(i, 1);
      ammo.owner = null;
      ammo.destroyed = true;
    }
  };

  FO.tryReload = function (owner, weapon) {
    if ((weapon.ammo | 0) === (weapon.proto.maxAmmo | 0)) return -1;
    const e = (owner.inventory || []).find(x => FO.canReload(weapon, x.obj));
    if (!e) return -1;
    const rest = FO.reloadWeapon(weapon, e.obj);
    if (rest === 0) FO.spendPack(owner, e.obj);
    return rest === -1 ? -1 : 0;
  };

  FO.wieldRight = function (play, o, item) {
    for (const e of o.inventory || []) e.obj.flags &= ~FO.FLAG.RIGHT_HAND;
    if (item) item.flags |= FO.FLAG.RIGHT_HAND;
    if (o.dude) {
      FO.refreshDudeArt(play);
      return;
    }
    const code = sub(item) === FO.ITEM.WEAPON ? item.proto.anim | 0 : 0;
    o.fid = FO.fid(FO.ART.CRITTER, FO.fidIndex(o.fid), FO.ANIM.STAND, code);
  };

  FO.aiHaveAmmo = function (o, weapon) {
    const e = (o.inventory || []).find(x => FO.canReload(weapon, x.obj));
    return e ? e.obj : null;
  };

  FO.aiCanUseWeapon = function (cb, o, weapon, hitMode) {
    const r = o.critter.results;
    if ((r & D.CRIP_ARM_LEFT) && (r & D.CRIP_ARM_RIGHT)) return false;
    if ((r & (D.CRIP_ARM_LEFT | D.CRIP_ARM_RIGHT)) && FO.isTwoHanded(weapon)) return false;
    const fid = FO.fid(FO.ART.CRITTER, FO.fidIndex(o.fid), FO.attackAnim(weapon, hitMode), weapon.proto.anim | 0);
    if (!cb.p.g.art.exists(fid)) return false;
    return FO.skillValue(o, FO.weaponSkill(weapon, hitMode)) >= (FO.aiPacket(o).min_to_hit | 0);
  };

  FO.aiBestWeapon = function (cb, a, b) {
    if (!a) return b;
    if (!b) return a;
    const ta = FO.attackSubtype(a, FO.HIT_MODE.RIGHT_PRIMARY);
    const tb = FO.attackSubtype(b, FO.HIT_MODE.RIGHT_PRIMARY);
    if (ta !== tb) {
      if (ta === FO.ATTACK_TYPE.RANGED) return a;
      if (tb === FO.ATTACK_TYPE.RANGED) return b;
      if (ta === FO.ATTACK_TYPE.THROWN) return a;
      if (tb === FO.ATTACK_TYPE.THROWN) return b;
    }
    return FO.itemCost(cb.p.g.protos, b) > FO.itemCost(cb.p.g.protos, a) ? b : a;
  };

  FO.aiSearchInven = function (cb, o, checkAp) {
    const kind = body(o);
    if (kind !== BODY_BIPED && kind !== BODY_ROBOTIC) return null;
    const hand = FO.rightHand(o);
    let best = null;
    for (const e of o.inventory || []) {
      const it = e.obj;
      if (sub(it) !== FO.ITEM.WEAPON || it === hand) continue;
      if (checkAp && (it.proto.ap1 | 0) > o.critter.ap) continue;
      if (!FO.aiCanUseWeapon(cb, o, it, FO.HIT_MODE.RIGHT_PRIMARY)) continue;
      if (FO.attackSubtype(it, FO.HIT_MODE.RIGHT_PRIMARY) === FO.ATTACK_TYPE.RANGED && !(it.ammo | 0) && !FO.aiHaveAmmo(o, it)) continue;
      best = FO.aiBestWeapon(cb, best, it);
    }
    return best;
  };

  FO.aiSearchEnviron = function (cb, o, type) {
    if (body(o) !== BODY_BIPED) return null;
    const w = cb.w;
    const items = (w.map.byElev[w.elev] || []).filter(x => FO.pidType(x.pid) === FO.PID.ITEM && x.tile >= 0 && !(x.flags & FO.FLAG.HIDDEN));
    const max = FO.statValue(o, FO.STAT.PE) + 5;
    const hand = FO.rightHand(o);
    for (const it of byDistance(items, o)) {
      if (FO.objDist(o, it) > max) break;
      if (sub(it) !== type) continue;
      if (type === FO.ITEM.WEAPON && FO.aiCanUseWeapon(cb, o, it, FO.HIT_MODE.RIGHT_PRIMARY)) return it;
      if (type === FO.ITEM.AMMO && FO.canReload(hand, it)) return it;
    }
    return null;
  };

  FO.aiPickHitMode = function (cb, o, weapon) {
    const H = FO.HIT_MODE;
    if (!weapon || sub(weapon) !== FO.ITEM.WEAPON) return H.PUNCH;
    const kind = FO.attackSubtype(weapon, H.RIGHT_SECONDARY);
    if (kind === FO.ATTACK_TYPE.NONE) return H.RIGHT_PRIMARY;
    if (!FO.aiCanUseWeapon(cb, o, weapon, H.RIGHT_SECONDARY)) return H.RIGHT_PRIMARY;
    if (rnd(1, FO.aiPacket(o).secondary_freq | 0) !== 1) return H.RIGHT_PRIMARY;
    if (kind === FO.ATTACK_TYPE.THROWN) {
      if (FO.aiSearchInven(cb, o, false)) return H.RIGHT_SECONDARY;
      return FO.statCheck(o, FO.STAT.IN, 0) > FO.ROLL.FAIL ? H.RIGHT_PRIMARY : H.RIGHT_SECONDARY;
    }
    return H.RIGHT_SECONDARY;
  };

  FO.aiCalledShot = function (cb, o, target, hitMode) {
    const torso = FO.HIT_LOC.TORSO;
    if (FO.apCost(o, hitMode, true) > o.critter.ap) return torso;
    if (!FO.calledShotAllowed(o, hitMode)) return torso;
    const pk = FO.aiPacket(o);
    if (rnd(1, pk.called_freq | 0) !== 1) return torso;
    const level = FO.combatDifficulty ? FO.combatDifficulty() : 1;
    const need = level === 0 ? 7 : level === 2 ? 3 : 5;
    if (FO.statValue(o, FO.STAT.IN) < need) return torso;
    const loc = rnd(0, 8);
    return FO.determineToHit(cb.w, o, target, loc, hitMode, true) < (pk.min_to_hit | 0) ? torso : loc;
  };

  FO.aiMagicHands = async function (cb, o, item, msgId) {
    cb.w.anim.runCombat([{ kind: 'anim', obj: o, code: FO.ANIM.MAGIC_HANDS_MIDDLE }]);
    await cb.wait();
    if (msgId < 0) return;
    const name = FO.objName(cb.p, o);
    const text = cb.p.text(msgId, 'MISC');
    if (item) cb.p.say(name + ' ' + text + ' ' + FO.objName(cb.p, item) + '.');
    else cb.p.say(name + ' ' + text + '.');
  };

  FO.aiRetrieve = async function (cb, o, item) {
    const w = cb.w;
    if (FO.hexDist(o.tile, item.tile) > 1) {
      if (!w.findPath(o, item.tile, 1)) return null;
      w.anim.runCombat([{ kind: 'move', obj: o, tile: item.tile, near: 1, limit: o.critter.ap }]);
      await cb.wait();
      if (FO.hexDist(o.tile, item.tile) > 1 || item.tile < 0) return null;
    }
    w.anim.runCombat([{ kind: 'rotate', obj: o, tile: item.tile }, { kind: 'anim', obj: o, code: FO.ANIM.MAGIC_HANDS_GROUND }]);
    await cb.wait();
    if (item.tile < 0) return null;
    w.take(o, item, item.quantityOnGround || 1);
    return (o.inventory || []).some(e => e.obj === item) ? item : null;
  };

  FO.aiRunAway = async function (cb, o) {
    const w = cb.w;
    const c = o.critter;
    const pk = FO.aiPacket(o);
    if (FO.objDist(o, w.dude) > (pk.max_dist | 0)) {
      c.maneuver |= M.DISENGAGING;
      return;
    }
    c.maneuver |= M.FLEEING;
    const ap = c.ap | 0;
    if (ap <= 0) return;
    const dir = FO.hexDir(w.dude.tile, o.tile);
    const dirs = [dir, (dir + 1) % 6, (dir + 5) % 6];
    let dest = -1;
    for (let n = ap; n > 0 && dest < 0; n--) {
      for (const d of dirs) {
        const t = FO.tileToward(o.tile, d, n);
        const path = t !== o.tile ? w.findPath(o, t, 0) : null;
        if (path && path.length) {
          dest = t;
          break;
        }
      }
    }
    if (dest < 0) return;
    const steps = [];
    const say = FO.aiMessageStep(cb, o, MSG.RUN, null, 0);
    if (say) steps.push(say);
    steps.push({ kind: 'move', obj: o, tile: dest, run: true, limit: ap, delay: 0 });
    w.anim.runCombat(steps);
    await cb.wait();
  };

  FO.aiMoveCloser = async function (cb, o, target, first) {
    const w = cb.w;
    if (FO.objDist(o, target) <= 1) return -1;
    if (!w.findPath(o, target.tile, 1)) return -1;
    const steps = [];
    const say = first ? FO.aiMessageStep(cb, o, MSG.MOVE, null, 0) : null;
    if (say) steps.push(say);
    steps.push({ kind: 'move', obj: o, tile: target.tile, near: 1, limit: o.critter.ap, delay: 0 });
    w.anim.runCombat(steps);
    await cb.wait();
    return 0;
  };

  FO.aiWield = async function (cb, o, item) {
    FO.wieldRight(cb.p, o, item);
    const code = item.proto.anim | 0;
    if (code && cb.p.g.art.exists(FO.critterFid(o, FO.ANIM.TAKE_OUT))) {
      cb.w.anim.runCombat([{ kind: 'sfx', obj: o, sound: FO.sfxArt(cb.p.g, o, FO.ANIM.TAKE_OUT, code) }, { kind: 'anim', obj: o, code: FO.ANIM.TAKE_OUT, delay: 0 }]);
      await cb.wait();
    }
  };

  FO.aiSwitchWeapons = async function (cb, o, s) {
    s.weapon = null;
    s.hitMode = FO.HIT_MODE.PUNCH;
    const found = FO.aiSearchInven(cb, o, true);
    if (found) {
      s.weapon = found;
      s.hitMode = FO.aiPickHitMode(cb, o, found);
    } else {
      const near = FO.aiSearchEnviron(cb, o, FO.ITEM.WEAPON);
      if (!near) return FO.apCost(o, s.hitMode, false) > o.critter.ap ? -1 : 0;
      const got = await FO.aiRetrieve(cb, o, near);
      if (got) {
        s.weapon = got;
        s.hitMode = FO.aiPickHitMode(cb, o, got);
      }
    }
    if (!s.weapon) return -1;
    await FO.aiWield(cb, o, s.weapon);
    return FO.apCost(o, s.hitMode, false) > o.critter.ap ? -1 : 0;
  };

  FO.aiReloadWith = async function (cb, o, weapon, ammo) {
    const rest = FO.reloadWeapon(weapon, ammo);
    if (rest === 0) FO.spendPack(o, ammo);
    if (rest === -1) return;
    FO.playSfxAt(cb.p.g, FO.sfxWeapon(cb.p.g, FO.SFX_WEAPON.READY, weapon, FO.HIT_MODE.RIGHT_PRIMARY, null), o);
    await FO.aiMagicHands(cb, o, weapon, MISC_RELOADS);
    o.critter.ap = Math.max(0, o.critter.ap - 2);
  };

  FO.aiAttack = async function (cb, o, target, hitMode) {
    if (o.critter.maneuver & M.FLEEING) return -1;
    cb.w.anim.runCombat([{ kind: 'rotate', obj: o, tile: target.tile }]);
    await cb.wait();
    const loc = FO.aiCalledShot(cb, o, target, hitMode);
    if (await cb.attack(o, target, hitMode, loc) !== 0) return -1;
    await cb.wait();
    return 0;
  };

  FO.aiTryAttack = async function (cb, o, target) {
    const w = cb.w;
    const c = o.critter;
    const B = FO.BAD_SHOT;
    const pk = FO.aiPacket(o);
    FO.setWhoHitMe(o, target);
    let first = true;
    const s = { weapon: FO.rightHand(o), hitMode: 0 };
    s.hitMode = FO.aiPickHitMode(cb, o, s.weapon);
    if (!s.weapon) {
      const punch = FO.fid(FO.ART.CRITTER, FO.fidIndex(o.fid), FO.ANIM.PUNCH, 0);
      if (body(target) !== BODY_BIPED || FO.fidWeapon(target.fid) !== 0 || !cb.p.g.art.exists(punch)) await FO.aiSwitchWeapons(cb, o, s);
    }
    for (let attempt = 0; attempt < 10; attempt++) {
      if (c.results & (D.KNOCKED_OUT | D.DEAD | D.LOSE_TURN)) break;
      const r = FO.badShot(w, o, target, s.hitMode, false);
      if (r === B.NO_AMMO) {
        const ammo = FO.aiHaveAmmo(o, s.weapon);
        if (ammo) {
          await FO.aiReloadWith(cb, o, s.weapon, ammo);
          continue;
        }
        const near = FO.aiSearchEnviron(cb, o, FO.ITEM.AMMO);
        if (near) {
          const got = await FO.aiRetrieve(cb, o, near);
          if (got) await FO.aiReloadWith(cb, o, s.weapon, got);
          continue;
        }
        FO.playSfxAt(cb.p.g, FO.sfxWeapon(cb.p.g, FO.SFX_WEAPON.OUT_OF_AMMO, s.weapon, s.hitMode, null), o);
        await FO.aiMagicHands(cb, o, s.weapon, MISC_OUT_OF_AMMO);
        FO.wieldRight(cb.p, o, null);
        await FO.aiSwitchWeapons(cb, o, s);
      } else if (r === B.OUT_OF_RANGE) {
        if (FO.determineToHit(w, o, target, FO.HIT_LOC.UNCALLED, s.hitMode, false) < (pk.min_to_hit | 0)) {
          await FO.aiRunAway(cb, o);
          return 0;
        }
        if (s.weapon) {
          if (await FO.aiMoveCloser(cb, o, target, first) === -1) return -1;
          first = false;
        } else {
          const sw = await FO.aiSwitchWeapons(cb, o, s);
          if (sw === -1 || !s.weapon) {
            if (await FO.aiMoveCloser(cb, o, target, first) === -1) return -1;
            first = false;
          }
        }
      } else if (r === B.NO_AP || r === B.ARM_CRIPPLED || r === B.BOTH_ARMS) {
        if (await FO.aiSwitchWeapons(cb, o, s) === -1) return -1;
      } else if (r === B.BLOCKED) {
        if (await FO.aiMoveCloser(cb, o, target, first) === -1) return -1;
        first = false;
      } else if (r === B.OK) {
        if (FO.determineToHit(w, o, target, FO.HIT_LOC.UNCALLED, s.hitMode, true) >= (pk.min_to_hit | 0)) {
          if (await FO.aiAttack(cb, o, target, s.hitMode) === -1 || FO.apCost(o, s.hitMode, false) > c.ap) return -1;
        } else {
          if (FO.determineToHit(w, o, target, FO.HIT_LOC.UNCALLED, s.hitMode, false) < (pk.min_to_hit | 0)) {
            await FO.aiRunAway(cb, o);
            return 0;
          }
          if (await FO.aiMoveCloser(cb, o, target, first) === -1) {
            await FO.aiRunAway(cb, o);
            return 0;
          }
          first = false;
        }
      }
    }
    return -1;
  };

  FO.aiCheckDrugs = async function (cb, o) {
    if (body(o) !== BODY_BIPED || !FO.takeDrug) return;
    const c = o.critter;
    const half = Math.trunc(FO.statValue(o, FO.STAT.MAX_HP) / 2);
    let from = 0;
    while ((c.hp | 0) < half && c.ap >= 2) {
      const list = o.inventory || [];
      const i = list.findIndex((e, k) => k >= from && sub(e.obj) === FO.ITEM.DRUG);
      if (i < 0) break;
      const drug = list[i].obj;
      from = i + 1;
      if (!STIMPAK_PIDS.includes(drug.pid)) continue;
      if (list[i].count > 1) list[i].count--;
      else list.splice(i, 1);
      if (FO.takeDrug(cb.p, o, drug) === -1) cb.p.sc.addItem(o, drug, 1);
      else await FO.aiMagicHands(cb, o, drug, MISC_USES);
      c.ap = Math.max(0, c.ap - 2);
      from = 0;
    }
  };

  FO.combatAi = async function (cb, o, target) {
    const w = cb.w;
    const c = o.critter;
    const pk = FO.aiPacket(o);
    if ((c.maneuver & M.FLEEING) || (c.results & (pk.hurt_too_much | 0)) || (c.hp | 0) < (pk.min_hp | 0)) {
      await FO.aiRunAway(cb, o);
      return target;
    }
    let t = target;
    if (t) await FO.aiTryAttack(cb, o, t);
    else {
      await FO.aiCheckDrugs(cb, o);
      t = FO.aiDangerSource(cb, o);
      if (t) await FO.aiTryAttack(cb, o, t);
    }
    if (t && alive(t) && c.ap > 0 && FO.objDist(o, t) > (pk.max_dist | 0)) c.maneuver |= M.DISENGAGING;
    const party = FO.isPartyMember(w, o);
    if (!t && !party) {
      const who = whoHit(o);
      if (who && alive(who) && (c.damageLastTurn | 0) > 0) await FO.aiRunAway(cb, o);
    }
    if (!t && party && FO.objDist(o, w.dude) > 5) await FO.aiMoveCloser(cb, o, w.dude, false);
    return t;
  };
})(globalThis.FO = globalThis.FO || {});
