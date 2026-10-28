(function (K) {
  'use strict';

  const SIDES = ['up', 'right', 'left', 'down'];
  const PREFER = Object.freeze({
    axe: [2, 3, 2, 1, 2, 1, 2, 3], bardiche: [2, 2, 3, 1, 2, 1, 3, 2], sickle: [3, 2, 1, 1, 3, 1, 1, 2],
    mace: [2, 2, 3, 1, 1, 1, 3, 2], knife: [3, 1, 1, 1, 3, 1, 1, 1], sword: [3, 2, 2, 1, 3, 1, 2, 2], spear: [2, 1, 1, 1, 2, 1, 1, 1]
  });

  const PACE = 0.74;

  const brain = () => ({ t: 0, seen: null, guardAt: 0, guardDir: null, dropAt: 0, next: 0.6, windFor: 0, strafe: 1, strafeT: 0, chest: 1.3 });

  const turn = (from, to, max) => {
    let d = to - from;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return from + K.clamp(d, -max, max);
  };

  const eyeOf = who => who.mv.pos[1] + (who.mv.crouch ? K.METRICS.eyeCrouch : K.METRICS.eyeStand) * K.Body.figure(who.kit).sy;

  function aimAt(who, target, dt, rate, face) {
    const F = who.fight, mv = who.mv, dx = target.mv.pos[0] - mv.pos[0], dz = target.mv.pos[2] - mv.pos[2], d = Math.hypot(dx, dz);
    const yaw = turn(mv.yaw, Math.atan2(dx, -dz) + eyeTurn(who.kit), (rate || 6) * dt);
    const eye = [mv.pos[0], eyeOf(who), mv.pos[2]], chest = face ? eyeOf(target) : target.mv.pos[1] + 1.25 * K.Body.figure(target.kit).sy;
    F.aim = { eye, yaw, pitch: Math.atan2(chest - eye[1], Math.max(0.3, d)) };
    return { yaw, d };
  }

  function arrivalSides(att, def) {
    const a = att.fight, dir = K.Combat.dirOf(a.steer[0], a.steer[1], a.lastDir);
    const b = K.Combat.view(a), w = [b.right[0] * Math.cos(dir * Math.PI / 4) + b.up[0] * Math.sin(dir * Math.PI / 4), b.right[1] * Math.cos(dir * Math.PI / 4) + b.up[1] * Math.sin(dir * Math.PI / 4), b.right[2] * Math.cos(dir * Math.PI / 4) + b.up[2] * Math.sin(dir * Math.PI / 4)];
    const db = K.Combat.view(def.fight), h = w[0] * db.right[0] + w[1] * db.right[1] + w[2] * db.right[2], v = w[0] * db.up[0] + w[1] * db.up[1] + w[2] * db.up[2];
    const out = [];
    if (v > 0.38) out.push('up');
    if (v < -0.38) out.push('down');
    if (h > 0.38) out.push('right');
    if (h < -0.38) out.push('left');
    return out.length ? out : ['right'];
  }

  const armed = who => {
    const F = who.fight, cut = who.kit.cut || {};
    return !!F.weapon && !cut.rFore && !cut.rArm;
  };

  function think(who, dt, rnd) {
    const F = who.fight, mv = who.mv, tgt = F.hostile;
    if (!tgt || !tgt.fight || tgt.fight.down || F.down) return null;
    const B = who.brain || (who.brain = brain()), X = K.Data.EXP[F.exp] || K.Data.EXP.soldier;
    B.t += dt;
    const { yaw, d } = aimAt(who, tgt, dt, 6, B.face && F.act && F.act.kind !== 'swing');
    const inp = { fwd: 0, side: 0, yaw, sprint: false };
    mv.walk = d < 3.5 && !B.rush;
    if (K.Wounds && !K.Wounds.caps(who.kit).stand) {
      K.Combat.guard(F, false);
      return { fwd: d < 30 ? 1 : 0, side: 0, yaw: turn(mv.yaw, Math.atan2(-(tgt.mv.pos[0] - mv.pos[0]), tgt.mv.pos[2] - mv.pos[2]), 3 * dt), sprint: false };
    }
    if (!armed(who)) {
      inp.fwd = d < 8 ? -1 : 0;
      K.Combat.guard(F, false);
      return inp;
    }
    const wp = K.Data.WEAPONS[F.weapon], their = tgt.fight.weapon ? K.Data.WEAPONS[tgt.fight.weapon] : null;
    let ideal = K.clamp(wp.reach - 0.22, 0.6, 2.0);
    if (their && their.reach > wp.reach + 0.3) ideal = Math.max(0.6, wp.reach - 0.4);
    const tired = mv.stamina < 22;
    if (tired) ideal += 1.2;
    const theirs = tgt.fight.act, opening = tgt.fight.stun > 0 || (theirs && theirs.kind === 'recover') || (tgt.fight.weapon === null);
    B.rush = !tired && their && their.reach > wp.reach + 0.25 && d > ideal + 0.05 && (opening || rnd() < X.aggr * 0.015 || B.rush);
    if (B.rush && d <= ideal + 0.05) B.rush = false;
    if (B.rush) mv.walk = false;
    if (K.Missile && K.Missile.ranged(tgt.fight) && d > wp.reach - 0.1) {
      mv.walk = false;
      inp.fwd = 1;
      inp.side = 0;
      if (d > 2.5 && mv.stamina > 30 && !mv.tired) inp.sprint = true;
    }
    const away = B.prevD !== undefined && d > B.prevD + 0.01;
    B.prevD = d;
    if (away && d > 3.5 && mv.stamina > 30 && !mv.tired) { mv.walk = false; inp.sprint = true; }
    if (Math.abs(d - ideal) > 0.1) inp.fwd = K.clamp((d - ideal) * 3, -1, 1);
    B.strafeT -= dt;
    if (B.strafeT <= 0) { B.strafe = rnd() < 0.5 ? -1 : 1; B.strafeT = 0.8 + rnd() * 1.6; }
    if (d < ideal + 1 && rnd() < X.aggr * 0.02) B.strafe = 0;
    inp.side = B.strafe * 0.7;
    if (K.Missile && K.Missile.ranged(tgt.fight) && tgt.fight.draw && d > 4) { inp.fwd = 1; B.weave = (B.weave || 0) - dt; if (B.weave <= 0) { B.weaveDir = rnd() < 0.5 ? -1 : 1; B.weave = 0.4 + rnd() * 0.5; } inp.side = B.weaveDir; }
    const T = tgt.fight.act;
    if (T && (T.kind === 'wind' || T.kind === 'swing' || T.kind === 'thrust') && T !== B.seen) {
      B.seen = T;
      let react = X.react * (0.85 + rnd() * 0.3);
      if (rnd() < X.parry && T.kind === 'wind' && their) react = Math.max(react, their.wind[0] - 0.09);
      B.guardAt = B.t + react;
      B.guardDir = null;
    }
    if (B.seen && B.t >= B.guardAt && B.guardAt > 0) {
      const live = T && T === B.seen && (T.kind === 'wind' || T.kind === 'swing' || T.kind === 'thrust');
      if (live) {
        if (!B.guardDir) {
          const right = arrivalSides(tgt, who);
          B.guardDir = rnd() < X.acc ? right[Math.floor(rnd() * right.length)] : SIDES.filter(s => !right.includes(s))[Math.floor(rnd() * 3) % 3];
        }
        const winding = F.act && F.act.kind === 'wind';
        if (!F.act || (winding && (F.act.t < 0.12 || rnd() < X.parry))) K.Combat.guard(F, true, B.guardDir);
        B.dropAt = B.t + 0.18 + rnd() * 0.12;
      } else if (B.t >= B.dropAt) {
        K.Combat.guard(F, false);
        B.guardAt = 0;
        B.seen = null;
      }
    }
    if (F.guard && F.shield && d < 1.15 && tgt.fight.guard && tgt.fight.shield && rnd() < 0.02) K.Combat.kick(F, mv);
    const a = F.act;
    if (a && a.kind === 'wind' && !a.released && a.t >= B.windFor) K.Combat.release(F, mv);
    const closing = B.lastD !== undefined && B.lastD - d > 0.025;
    B.lastD = d;
    const stop = closing && d <= wp.reach + 0.1 && d > wp.reach - 0.7 && rnd() < 0.5 + X.parry * 0.5;
    if (!a && !F.guard && (B.t >= B.next || stop) && !tired && d <= wp.reach - 0.02 + (stop ? 0.12 : 0) && F.stun <= 0) {
      const open = tgt.fight.stun > 0 || (tgt.fight.act && tgt.fight.act.kind === 'recover');
      const crowded = wp.reach >= 1 && d < ideal - 0.15, keepAway = crowded && F.weapon === 'spear' && !open;
      if ((tgt.fight.shield && d < 1.2 && rnd() < (tgt.fight.guard ? 0.4 : 0.1)) || (crowded && rnd() < (keepAway ? 0.6 : 0.22))) K.Combat.kick(F, mv);
      else if (keepAway) B.next = B.t;
      else if (wp.stab > 0 && ((stop && F.weapon === 'spear') || rnd() < (F.weapon === 'spear' ? 0.85 : 0.15) || (open && rnd() < 0.35))) {
        K.Combat.press(F);
        B.windFor = !stop && rnd() < (F.weapon === 'spear' ? 0.5 : 0.3) ? wp.wind[0] + (wp.wind[1] - wp.wind[0]) * (0.3 + 0.6 * rnd()) : 0.08 + rnd() * 0.05;
        B.face = rnd() < 0.06 + X.parry * 0.15;
      } else {
        const w = PREFER[F.weapon].map((v, i) => {
          if (!tgt.fight.guard) return v;
          const sides = arrivalSidesFor(who, tgt, i);
          return sides.includes(tgt.fight.guard.dir) ? v * 0.15 : v * 1.4;
        });
        let x = rnd() * w.reduce((s, v) => s + v, 0), dir = 0;
        for (; dir < 7 && x > w[dir]; dir++) x -= w[dir];
        K.Combat.press(F);
        F.steer = [Math.cos(dir * Math.PI / 4) * 100, Math.sin(dir * Math.PI / 4) * 100];
        B.windFor = open ? wp.wind[0] : wp.wind[0] + (wp.wind[1] - wp.wind[0]) * (0.2 + rnd() * 0.8 * (1 - X.aggr * 0.5));
      }
      B.next = B.t + (0.35 + rnd() * (1.3 - X.aggr)) * (wp.wind[0] + wp.swing + wp.recover) / PACE;
    }
    return inp;
  }

  function arrivalSidesFor(att, def, dir) {
    const a = att.fight, b = K.Combat.view(a), c = Math.cos(dir * Math.PI / 4), s = Math.sin(dir * Math.PI / 4);
    const w = [b.right[0] * c + b.up[0] * s, b.right[1] * c + b.up[1] * s, b.right[2] * c + b.up[2] * s];
    const db = K.Combat.view(def.fight), h = w[0] * db.right[0] + w[1] * db.right[1] + w[2] * db.right[2], v = w[0] * db.up[0] + w[1] * db.up[1] + w[2] * db.up[2];
    const out = [];
    if (v > 0.38) out.push('up');
    if (v < -0.38) out.push('down');
    if (h > 0.38) out.push('right');
    if (h < -0.38) out.push('left');
    return out;
  }

  const idleAim = who => ({ eye: [who.mv.pos[0], eyeOf(who), who.mv.pos[2]], yaw: who.mv.yaw, pitch: 0 });

  function regrow(S, p) {
    let changed = false;
    for (const [part, at] of Object.entries(p.regrow)) {
      if (S.time < at) continue;
      delete p.regrow[part];
      p.kit.cut = Object.assign({}, p.kit.cut);
      delete p.kit.cut[part];
      if (part === 'lArm') delete p.kit.cut.lFore;
      if (part === 'rArm') delete p.kit.cut.rFore;
      for (let i = S.parts.length - 1; i >= 0; i--) {
        const pc = S.parts[i];
        if (pc.straw === p.id && pc.keep.some(k => K.Body.PARTS[k] === part)) S.parts.splice(i, 1);
      }
      changed = true;
    }
    return changed;
  }

  const FORGET = 60, LOST = 12, LOOK = 0.2, IDEAL = Object.freeze({ bow: 18, crossbow: 20, javelin: 11, taxe: 8 }), TOO_CLOSE = 6;

  function ballistic(e, c, v) {
    const dx = c[0] - e[0], dz = c[2] - e[2], dh = Math.max(0.1, Math.hypot(dx, dz)), dy = c[1] - e[1], g = 9.81, k = v * v;
    const disc = k * k - g * (g * dh * dh + 2 * dy * k);
    return { yaw: Math.atan2(dx, -dz), pitch: disc < 0 ? Math.PI / 4 : Math.atan((k - Math.sqrt(disc)) / (g * dh)), dh };
  }

  function aimShot(who, tgt) {
    const F = who.fight, m = K.Data.MISSILES[K.Data.LAUNCHERS[F.mode].missile], B = who.brain || {}, full = K.Missile.drawTime(who, F.mode) || 1;
    const power = F.mode === 'crossbow' ? 1 : K.clamp((B.drawFor || full) / full, 0.15, 1), v = m.speed[0] + (m.speed[1] - m.speed[0]) * power;
    const e = [who.mv.pos[0], eyeOf(who), who.mv.pos[2]], c0 = K.Senses.chest(tgt), X = K.Data.EXP[F.exp] || K.Data.EXP.soldier;
    if (!B.guess || B.guessT <= 0) { B.guess = 1 + (Math.sin((who.id || 0) * 12.9898 + (B.t || 0) * 78.233) * 0.5) * (1 - X.acc) * 2.2; B.guessT = 0.6; }
    const tv = (tgt.mv.vel || [0, 0, 0]).map(v => v * B.guess);
    let t = Math.hypot(c0[0] - e[0], c0[2] - e[2]) / v, sol = null;
    for (let i = 0; i < 3; i++) {
      const c = [c0[0] + tv[0] * t, c0[1], c0[2] + tv[2] * t];
      sol = ballistic(e, c, v);
      t = sol.dh / (v * Math.cos(sol.pitch));
    }
    F.aim = { eye: e, yaw: sol.yaw, pitch: sol.pitch };
    return sol;
  }

  const pickRanged = (who, d) => {
    const M = K.Missile, F = who.fight;
    if (!M) return 'melee';
    for (const m of ['crossbow', 'bow']) if (M.usable(who, m) && d > (m === 'bow' && who.kit.side === 'elf' ? (F.mode === 'bow' ? 2.5 : 3.2) : TOO_CLOSE) && (m !== 'crossbow' || F.loaded || d > 9)) return m;
    if (M.usable(who, 'javelin') && d > 4.5 && d < 22) return 'javelin';
    if (M.usable(who, 'taxe') && d > 3.5 && d < 11) return 'taxe';
    if (!F.weapon && M.modes(who).length > 1) return M.modes(who).filter(m => m !== 'melee')[0];
    return 'melee';
  };

  function shoot(who, tgt, dt, rnd, S, W, d) {
    const F = who.fight, mv = who.mv, M = K.Missile, B = who.brain;
    B.guessT = (B.guessT || 0) - dt;
    const sol = aimShot(who, tgt), inp = { fwd: 0, side: 0, yaw: turn(mv.yaw, sol.yaw, 8 * dt), sprint: false };
    const ideal = IDEAL[F.mode] || 15, clearShot = K.Senses.clear(W, [mv.pos[0], eyeOf(who), mv.pos[2]], K.Senses.chest(tgt));
    mv.walk = false;
    if (d < TOO_CLOSE + 1 && (F.mode === 'bow' || F.mode === 'crossbow') && !B.stand && who.kit.side !== 'elf') {
      B.flee = B.flee > 0 ? B.flee - dt : 1.4;
      if (B.flee > 0.25) { M.cancel(F); return { fwd: 1, side: 0, yaw: turn(mv.yaw, sol.yaw + Math.PI, 10 * dt), sprint: mv.stamina > 30 }; }
    }
    if (B.hideAt) {
      const hx = B.hideAt[0] - mv.pos[0], hz = B.hideAt[1] - mv.pos[2], hd = Math.hypot(hx, hz);
      if (hd < 0.8 || S.time > B.hideUntil) B.hideAt = null;
      else { M.cancel(F); mv.crouch = true; mv.walk = false; return { fwd: 1, side: 0, yaw: turn(mv.yaw, Math.atan2(hx, -hz), 8 * dt), sprint: false }; }
    }
    const spotted = !!(tgt.brain && tgt.brain.seenNow && tgt.fight.hostile === who && K.Senses.sees(tgt, who, W, S.hour, K.Weather.at(S)));
    if (who.kit.side === 'elf' && W.flora && W.flora.bushAt && (spotted || B.shot) && d < 22 && !F.draw && S.time > (B.hideNext || 0)) {
      B.shot = false;
      const away = Math.atan2(mv.pos[0] - tgt.mv.pos[0], -(mv.pos[2] - tgt.mv.pos[2]));
      for (let i = 0; i < 12 && !B.hideAt; i++) {
        const ang = away + (i % 2 ? 1 : -1) * (spotted ? 0.5 + 0.25 * Math.floor(i / 2) : 1.3 + 0.15 * Math.floor(i / 2)), r = 8 + (i % 3) * 2, x = mv.pos[0] + Math.sin(ang) * r, z = mv.pos[2] - Math.cos(ang) * r;
        if (W.flora.bushAt(x, z, 0.9) && K.Senses.clear(W, [x, 1.2, z], [x, 1.2, z])) { B.hideAt = [x, z]; B.hideUntil = S.time + 8; }
      }
      B.hideNext = S.time + 4;
      if (B.hideAt) return inp;
    }
    if (Math.abs(d - ideal) > 3 && !F.draw) inp.fwd = K.clamp((d - ideal) * 0.4, -1, 1);
    if (!clearShot && !F.draw) { B.strafeT -= dt; if (B.strafeT <= 0) { B.strafe = rnd() < 0.5 ? -1 : 1; B.strafeT = 1 + rnd() * 1.5; } inp.side = B.strafe; }
    if (who.kit.side === 'elf' && d > 9) mv.crouch = true;
    else if (d < 7) mv.crouch = false;
    if (F.mode === 'crossbow' && !F.loaded && !F.reload) { M.reload(who); return Object.assign(inp, { fwd: 0, side: 0 }); }
    if (F.reload) return Object.assign(inp, { fwd: 0, side: 0 });
    if (!F.draw && clearShot && !F.cool && !F.switching && Math.abs(Math.atan2(Math.sin(inp.yaw - sol.yaw), Math.cos(inp.yaw - sol.yaw))) < 0.2) { M.press(who); B.drawFor = F.mode === 'crossbow' ? 0.05 : M.drawTime(who, F.mode) * (0.85 + rnd() * 0.2); }
    if (F.draw) {
      inp.fwd = 0;
      inp.side = 0;
      if (F.draw.t >= B.drawFor && clearShot) { M.release(who, S, rnd); B.shot = true; }
      else if (F.draw.t > 3) M.cancel(F);
    }
    return inp;
  }

  function engage(who, dt, rnd, S, W) {
    const F = who.fight, mv = who.mv, tgt = F.hostile, B = who.brain || (who.brain = brain());
    if (!tgt || !tgt.fight || tgt.fight.down || F.down) return null;
    B.look = (B.look || 0) - dt;
    if (B.look <= 0) {
      B.look = LOOK;
      const hurtBy = F.hitBy === tgt && S.time - (F.hitTime || -99) < 1.5;
      B.seenNow = K.Senses ? K.Senses.sees(who, tgt, W, S.hour, K.Weather.at(S)) || K.Senses.hears(who, tgt, K.Weather.at(S)) || hurtBy : true;
      if (B.seenNow) {
        const direct = !hurtBy || K.Senses.sees(who, tgt, W, S.hour, K.Weather.at(S)) || K.Senses.hears(who, tgt, K.Weather.at(S));
        if (direct) B.last = tgt.mv.pos.slice();
        else if (!B.guessAt || S.time - B.guessAt > 1.4) {
          const dx = tgt.mv.pos[0] - mv.pos[0], dz = tgt.mv.pos[2] - mv.pos[2], dl = Math.hypot(dx, dz) || 1, k = 0.4 + rnd() * 1.2, side = (rnd() - 0.5) * 0.6;
          B.last = [mv.pos[0] + (dx * k - dz * side), tgt.mv.pos[1], mv.pos[2] + (dz * k + dx * side)];
          B.guessAt = S.time;
        }
        B.lostT = 0;
      }
      else B.lostT = (B.lostT || 0) + LOOK;
    }
    if (!B.last) B.last = tgt.mv.pos.slice();
    if (B.lostT > (who.kit.side === 'elf' && K.Missile && K.Missile.usable(who, 'bow') ? LOST * 5 : LOST)) { F.hostile = null; K.Combat.guard(F, false); if (K.Missile) K.Missile.cancel(F); return null; }
    if (!B.seenNow && K.Missile && ['bow', 'crossbow'].some(m => K.Missile.usable(who, m)) && (B.lostT < LOST * 0.75 || who.kit.side === 'elf')) {
      K.Missile.cancel(F);
      if (who.kit.side === 'elf') mv.crouch = true;
      const dx = B.last[0] - mv.pos[0], dz = B.last[2] - mv.pos[2], dl = Math.hypot(dx, dz), stalk = who.kit.side === 'elf' && B.lostT > 3 && dl > 7;
      return { fwd: stalk ? 1 : 0, side: 0, yaw: turn(mv.yaw, Math.atan2(dx, -dz), 3 * dt), sprint: false };
    }
    if (!B.seenNow) {
      if (K.Missile) K.Missile.cancel(F);
      K.Combat.guard(F, false);
      mv.crouch = false;
      const dx = B.last[0] - mv.pos[0], dz = B.last[2] - mv.pos[2], dl = Math.hypot(dx, dz);
      mv.walk = dl < 6;
      return dl > 1.2 ? { fwd: 1, side: 0, yaw: turn(mv.yaw, Math.atan2(dx, -dz), 5 * dt), sprint: false } : { fwd: 0, side: 0, yaw: mv.yaw + 1.6 * dt, sprint: false };
    }
    const d = Math.hypot(tgt.mv.pos[0] - mv.pos[0], tgt.mv.pos[2] - mv.pos[2]);
    const seenMe = !!(tgt.brain && tgt.brain.seenNow && tgt.fight.hostile === who);
    if (K.Missile && who.kit.side === 'elf' && seenMe && d < 8 && d > 1.2 && S.time > (B.fleeNext || 0) && mv.stamina > 20 && K.Missile.usable(who, 'bow')) { B.fleeUntil = S.time + 3; B.fleeNext = S.time + 6; }
    if (S.time < (B.fleeUntil || 0) && (!K.Wounds || K.Wounds.caps(who.kit).stand)) {
      K.Missile.cancel(F);
      mv.crouch = false;
      mv.walk = false;
      return { fwd: 1, side: 0, yaw: turn(mv.yaw, Math.atan2(mv.pos[0] - tgt.mv.pos[0], -(mv.pos[2] - tgt.mv.pos[2])), 10 * dt), sprint: true };
    }
    if (K.Missile && (!K.Wounds || K.Wounds.caps(who.kit).stand)) {
      const want = pickRanged(who, d);
      if (F.mode !== want && !F.draw && !F.act && !F.reload) K.Missile.setMode(who, want);
      if (K.Missile.ranged(F)) return shoot(who, tgt, dt, rnd, S, W, d);
    }
    mv.crouch = false;
    if (tgt.beast && K.Beasts) return K.Beasts.duel(who, tgt, dt, rnd, S);
    const aimed = tgt.fight.draw || (S.missiles || []).some(m => m.owner === (tgt === S.player ? 'player' : tgt.id) && Math.hypot(m.pos[0] - mv.pos[0], m.pos[2] - mv.pos[2]) < 12);
    if (F.shield && aimed && d > 2.2 && !F.act) {
      K.Combat.guard(F, true, 'right');
      const inp = think(who, dt, rnd) || { fwd: 0, side: 0, yaw: mv.yaw };
      if (!F.guard) K.Combat.guard(F, true, 'right');
      return inp;
    }
    return think(who, dt, rnd);
  }

  const MEMORY = 120;

  function retaliate(S, p, W) {
    const F = p.fight;
    if (p.kit.side === 'straw' || F.down || (p.team && !fighting(p))) return;
    const B = p.brain || (p.brain = brain()), foes = B.foes || (B.foes = new Map());
    if (F.hostile) { foes.set(F.hostile, S.time); return; }
    if (S.time < (B.ignoreUntil || 0)) return;
    let best = null, bd = 30;
    const all = S.player ? [S.player, ...S.people] : S.people;
    for (const q of all) {
      if (!q.fight || q.fight.down || q === p || captive(q) || p.role === 'watch' && !(town(q) && wanted(S, q))) continue;
      const d = Math.hypot(q.mv.pos[0] - p.mv.pos[0], q.mv.pos[2] - p.mv.pos[2]);
      const known = foes.has(q) && S.time - foes.get(q) < MEMORY && d < FORGET && (!K.Senses || K.Senses.sees(p, q, W, S.hour, K.Weather.at(S)));
      if ((q.fight.hostile === p || known) && d < Math.max(bd, known ? FORGET : 0)) { bd = d; best = q; }
    }
    if (best) { F.hostile = best; B.lostT = 0; B.last = best.mv.pos.slice(); B.defending = best; }
  }

  const NEAR_TICK = 0.1, FAR_TICK = 1, FAR = 250, SEE = 0.2, CALL = 40, HELP = 20, LIFT = 30, LOOT = 25, CALM = 8, RESCUE = 30;
  const STUCK_T = 10, GIVE_UP = 30, TIE = 2, SEARCH = 3, FLEE = 5, LEASH = 3.5, LINE_GAP = 1.3, RANK_GAP = 1.6, ALERT = 12, NEAR_FOE = 12;

  const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const xz = v => [v[0], v[2]];
  const captive = q => !!q && (q.state === 'surrender' || q.state === 'bound' || q.state === 'led' || q.state === 'jailed');
  const teamOf = (S, q) => q === S.player ? S.player.team || null : q.team || null;
  const enemies = (a, b) => !!a && !!b && (K.Data.ENEMIES[a] || []).includes(b);
  const hasItem = (p, id) => (p.sack || []).some(s => s.id === id && s.n > 0);
  const takeOne = (bag, id) => { const s = bag.find(x => x.id === id && x.n > 0); if (!s) return false; s.n--; if (!s.n) bag.splice(bag.indexOf(s), 1); return true; };
  const stash = (bag, id, n) => { const s = bag.find(x => x.id === id); if (s) s.n += n; else bag.push({ id, n }); };
  const byId = (S, id) => id === 'player' ? S.player : S.people.find(q => q.id === id) || null;
  const where = t => t.pts ? K.Body.anchorOf(t) : t.mv.pos;
  const claimed = (t, p, S) => (t.aidBy !== undefined && t.aidBy !== p.id && S.time - t.aidAt < 1) || !!(p.brain && p.brain.unreach && p.brain.unreach.has(t));
  const claim = (t, p, S) => { t.aidBy = p.id; t.aidAt = S.time; };
  const ranges = p => !!K.Missile && K.Missile.modes(p).length > 1;
  const fighting = p => !!p.fight && (!!p.fight.weapon || ranges(p));
  const alive = F => F.down === 'ko' && (F.ko > 0 || !!F.stable);
  const stats = S => S.stats || (S.stats = { stuck: 0, surrender: 0, knife: 0, bound: 0, carried: 0, jailed: 0, rescued: 0 });
  const standingOf = (S, team) => { const st = K.Data.STANDING[team]; return st ? (S.standing || {})[st.stat] || 0 : 0; };
  const valued = (S, team) => { const st = K.Data.STANDING[team]; return !!st && standingOf(S, team) >= st.rescue; };
  const eyeTurn = kit => { const c = K.Wounds ? K.Wounds.caps(kit).view : { l: 'ok', r: 'ok' }; return c.r === 'dark' && c.l !== 'dark' ? 0.25 : c.l === 'dark' && c.r !== 'dark' ? -0.25 : 0; };

  function steer(p, goal, dt, S, W, o) {
    const B = p.brain, mv = p.mv, N = K.Nav.of(W), opt = o || {}, here = xz(mv.pos), left = Math.hypot(goal[0] - here[0], goal[1] - here[1]);
    mv.walk = !!opt.walk && !opt.sprint;
    if (left < (opt.reach || 0.8)) { B.path = null; return null; }
    if (B.avoid && S.time > B.avoidUntil) B.avoid = null;
    let P = B.path;
    const last = P && P.pts[P.pts.length - 1], spent = P && P.i >= P.pts.length - 1 && Math.hypot(last[0] - here[0], last[1] - here[1]) < 0.9 && Math.hypot(last[0] - goal[0], last[1] - goal[1]) > 0.5;
    if (!P || P.i >= P.pts.length || spent || (Math.hypot(P.goal[0] - goal[0], P.goal[1] - goal[1]) > 1 && S.time - P.at > 0.5)) {
      const o2 = { side: p.kit.side, avoid: B.avoid || undefined }, direct = left < 60 && K.Nav.line(N, here, goal, o2);
      const r = direct ? { ok: true, pts: [goal.slice()] } : K.Nav.route(N, here, goal, o2);
      P = B.path = { goal: goal.slice(), pts: r.pts.length ? r.pts : [goal.slice()], i: 0, at: S.time, check: S.time, d0: null, g0: goal.slice() };
    }
    while (P.i < P.pts.length - 1 && Math.hypot(P.pts[P.i][0] - here[0], P.pts[P.i][1] - here[1]) < 0.9) P.i++;
    if (P.i < P.pts.length - 1 && S.time - (P.skip || 0) > 0.5) { P.skip = S.time; if (K.Nav.line(N, here, P.pts[P.i + 1])) P.i++; }
    let rest = Math.hypot(P.pts[P.i][0] - here[0], P.pts[P.i][1] - here[1]);
    for (let k = P.i + 1; k < P.pts.length; k++) rest += Math.hypot(P.pts[k][0] - P.pts[k - 1][0], P.pts[k][1] - P.pts[k - 1][1]);
    if (P.d0 === null || Math.hypot(goal[0] - P.g0[0], goal[1] - P.g0[1]) > 1 || S.time - (P.last || 0) > 0.5) { P.check = S.time; P.d0 = rest; P.g0 = goal.slice(); }
    else if (S.time - P.check >= STUCK_T) {
      if (P.d0 - rest < 1 && left > 2) {
        stats(S).stuck++;
        const yb = K.basis(mv.yaw, 0);
        B.avoid = [[here[0] + yb.fwd[0] * 1.2, here[1] + yb.fwd[2] * 1.2, 1.6]];
        B.avoidUntil = S.time + 20;
        B.path = null;
        B.stuckAt = S.time;
        if (B.job && B.job.target) { (B.unreach || (B.unreach = new WeakSet())).add(B.job.target); B.job = null; }
      } else { P.check = S.time; P.d0 = rest; }
      if (B.path) { P.check = S.time; P.d0 = rest; }
    }
    P.last = S.time;
    const w = P.pts[Math.min(P.i, P.pts.length - 1)], yaw = Math.atan2(w[0] - here[0], -(w[1] - here[1])), off = Math.abs(Math.atan2(Math.sin(yaw - mv.yaw), Math.cos(yaw - mv.yaw)));
    return { fwd: off > 1.4 ? 0.15 : off > 0.8 ? 0.5 : 1, side: 0, yaw: turn(mv.yaw, yaw, (opt.turn || 6) * dt), sprint: !!opt.sprint && off < 0.5 && mv.stamina > 30 && !mv.tired };
  }

  const squadOf = S => S.people.filter(q => q.squad === 'player' && !captive(q) && q.fight && !q.fight.down).sort((a, b) => a.id - b.id);
  const rankOf = q => q.fight.shield || q.fight.weapon === 'spear' ? 1 : ranges(q) ? -1 : 0;

  function slotOf(p, S) {
    const Q = S.squad, P = S.player;
    if (!Q || !P) return null;
    if (Q.order === 'hold') return p.brain && p.brain.holdAt ? p.brain.holdAt : null;
    const list = squadOf(S), i = list.indexOf(p);
    if (i < 0) return null;
    if (Q.order === 'line' && Q.at) {
      const ord = list.slice().sort((a, b) => rankOf(b) - rankOf(a) || a.id - b.id), k = ord.indexOf(p), rank = Math.floor(k / 5), wide = Math.min(5, ord.length - rank * 5), col = k % 5 - (wide - 1) / 2, b = K.basis(Q.face, 0);
      return [Q.at[0] + b.right[0] * col * LINE_GAP - b.fwd[0] * rank * RANK_GAP, Q.at[1] + b.right[2] * col * LINE_GAP - b.fwd[2] * rank * RANK_GAP];
    }
    const b = K.basis(P.mv.yaw, 0), row = Math.floor(i / 3), col = i % 3 - 1, back = 2.4 + row * 1.6;
    return [P.mv.pos[0] - b.fwd[0] * back + b.right[0] * col * 1.6, P.mv.pos[2] - b.fwd[2] * back + b.right[2] * col * 1.6];
  }

  function canCommand(S) {
    const team = S.player && S.player.team, st = K.Data.STANDING[team];
    if (!st) return { ok: false, why: 'Здесь командовать некем' };
    if (standingOf(S, team) < st.command) return { ok: false, why: 'Командовать можно, когда ' + st.name + ' не ниже ' + st.command };
    if (!squadOf(S).length) return { ok: false, why: 'Рядом нет вашего отряда' };
    return { ok: true, most: st.most };
  }

  function order(S, id, target) {
    const Q = S.squad || (S.squad = { order: 'follow', fire: false, at: null, face: 0 }), P = S.player, list = squadOf(S);
    if (id === 'fire') { Q.fire = !Q.fire; return { ok: true, text: Q.fire ? 'Стрелять по готовности' : 'Не стрелять без приказа' }; }
    if (id === 'attack') {
      if (!target || !target.fight || target.fight.down || target === P) return { ok: false, why: 'Наведите прицел на цель' };
      for (const q of list) { q.fight.hostile = target; const B = q.brain || (q.brain = brain()); B.last = target.mv.pos.slice(); B.lostT = 0; B.ignoreUntil = 0; }
      Q.target = target;
      return { ok: true, text: 'Атаковать: ' + K.Body.nameOf(target) };
    }
    Q.order = id;
    if (id === 'line') { const b = K.basis(P.mv.yaw, 0); Q.at = [P.mv.pos[0] + b.fwd[0] * 2.5, P.mv.pos[2] + b.fwd[2] * 2.5]; Q.face = P.mv.yaw; }
    for (const q of list) {
      const B = q.brain || (q.brain = brain());
      B.path = null;
      B.retreated = false;
      if (id === 'hold') B.holdAt = xz(q.mv.pos);
      if (id === 'retreat') { q.fight.hostile = null; K.Combat.guard(q.fight, false); if (K.Missile) K.Missile.cancel(q.fight); B.ignoreUntil = S.time + 8; }
    }
    return { ok: true, text: K.Data.COMMANDS.find(c => c.id === id).name };
  }

  const WANTED = 90, BLAME_GAP = 20, BLAME = 10, HOSTILE_TOWN = -50;
  const town = q => !!q && !!q.mv && K.Places.inTown(q.mv.pos[0], q.mv.pos[2]);
  const lawKey = (S, q) => q === S.player ? 'player' : q.id;
  const lawOf = S => S.law || (S.law = { wanted: {}, blamed: -99, offenses: 0 });
  function wanted(S, q) {
    if (!q) return false;
    if (q === S.player && ((S.relations && S.relations.town) || 0) < HOSTILE_TOWN && town(q)) return true;
    const L = S.law;
    return !!L && (L.wanted[lawKey(S, q)] || -1) > S.time;
  }
  const defending = (S, a, v) => !!(a.brain && a.brain.defending === v) || a === S.player && !!v.fight && v.fight.hostile === S.player && !!v.fight.act;
  const exempt = (S, q) => q.duel || q.test || (q !== S.player && !q.team) || (q.kit && q.kit.side === 'straw');
  const foeOf = (p, q, S) => p.role === 'watch' && town(q) && wanted(S, q) || enemies(p.team, teamOf(S, q)) && !(town(p) && town(q) && !wanted(S, q));

  function law(S, events) {
    const out = [];
    for (const e of events) {
      if (e.kind !== 'hit' && e.kind !== 'kick' && e.kind !== 'hooked') continue;
      const a = e.who, v = e.to;
      if (!a || !v || !a.mv || !v.mv || a.beast || v.beast || e.body || e.prey || e.what === 'body' || !v.fight) continue;
      if (exempt(S, a) || exempt(S, v) || (!town(a) && !town(v)) || wanted(S, v) || defending(S, a, v) || a !== S.player && a.fight && a.fight.hostile !== v) continue;
      const L = lawOf(S), key = lawKey(S, a), fresh = (L.wanted[key] || -1) <= S.time;
      L.wanted[key] = S.time + WANTED;
      L.offenses++;
      if (a === S.player && S.time - L.blamed > BLAME_GAP) {
        L.blamed = S.time;
        const R = S.relations || (S.relations = {});
        R.town = (R.town || 0) - BLAME;
      }
      if (fresh) out.push({ kind: 'offense', who: a, to: v, at: a.mv.pos.slice() });
    }
    return out;
  }

  function nearestFoe(p, S, r) {
    let best = null, bd = r;
    const look = q => {
      if (!q || !q.fight || q.fight.down || q === p || captive(q) || !foeOf(p, q, S)) return;
      const d = flat(p.mv.pos, q.mv.pos);
      if (d < bd) { bd = d; best = q; }
    };
    for (const q of S.people) look(q);
    look(S.player);
    return best;
  }

  const engaging = (q, S) => { const h = q.fight && q.fight.hostile; return !!h && (h === S.player || h.squad === 'player'); };

  function acquire(p, S, W) {
    const F = p.fight, B = p.brain;
    if (S.time < (B.ignoreUntil || 0)) return;
    if (F.hostile && (F.hostile.fight.down || captive(F.hostile))) { F.hostile = null; K.Combat.guard(F, false); }
    let best = null, bd = Infinity;
    const look = q => {
      if (!q || !q.fight || q.fight.down || q === p || captive(q) || !foeOf(p, q, S)) return;
      const d = flat(p.mv.pos, q.mv.pos);
      if (d > K.Senses.DAY || !(K.Senses.sees(p, q, W, S.hour, K.Weather.at(S)) || K.Senses.hears(p, q, K.Weather.at(S)))) return;
      B.foeAt = S.time;
      B.foePos = q.mv.pos.slice();
      if (p.squad === 'player' && S.squad && !S.squad.fire && d > 6 && !engaging(q, S) && q !== S.squad.target) return;
      let load = 0;
      for (const o of S.people) if (o !== p && o.team === p.team && o.fight && o.fight.hostile === q) load++;
      const score = d + load * 3;
      if (score < bd) { bd = score; best = q; }
    };
    for (const q of S.people) look(q);
    look(S.player);
    if (!best) return;
    const cur = F.hostile;
    if (cur && cur !== best && bd + 4 >= flat(p.mv.pos, cur.mv.pos)) return;
    if (cur === best) return;
    F.hostile = best;
    B.last = best.mv.pos.slice();
    B.lostT = 0;
    B.seenNow = true;
    for (const o of S.people) {
      if (o === p || o.team !== p.team || !o.fight || o.fight.down || o.fight.hostile || captive(o) || flat(o.mv.pos, p.mv.pos) > CALL) continue;
      const OB = o.brain || (o.brain = brain());
      OB.alert = { pos: best.mv.pos.slice(), t: S.time };
    }
  }

  function release(p, S) {
    const B = p.brain || (p.brain = brain()), home = K.Places.HEALERS[p.team] || K.Places.HEALERS.town;
    p.state = null;
    p.leader = null;
    p.captor = null;
    p.witness = true;
    p.fight.hostile = null;
    B.ignoreUntil = S.time + 60;
    B.path = null;
    p.act = { kind: 'stand', post: home.at.slice(), face: home.face };
  }

  function jail(p, S, pr, out) {
    const k = S.people.filter(q => q.state === 'jailed').length;
    p.state = 'jailed';
    p.leader = null;
    p.act = { kind: 'stand', post: [pr.at[0] + (k % 4 - 1.5) * 1.1, pr.at[1] + Math.floor(k / 4) * 1.1], face: pr.face };
    p.brain.path = null;
    stats(S).jailed++;
    if (out) out.push({ kind: 'jailed', who: p, prison: pr });
  }

  function surrender(p, S, out) {
    const F = p.fight;
    if (K.Missile) K.Missile.cancel(F);
    K.Combat.dropGear(S, p);
    F.hostile = null;
    F.act = null;
    F.guard = null;
    p.state = 'surrender';
    p.brain.giveUp = 0;
    stats(S).surrender++;
    out.push({ kind: 'surrender', who: p });
  }

  function captiveStep(p, S, dt, W, out) {
    const mv = p.mv, F = p.fight, B = p.brain || (p.brain = brain()), still = { fwd: 0, side: 0, yaw: mv.yaw };
    F.hostile = null;
    if (F.guard) K.Combat.guard(F, false);
    F.act = null;
    F.aim = idleAim(p);
    mv.kneel = p.state === 'surrender' || p.state === 'bound';
    mv.tied = p.state !== 'surrender';
    mv.crouch = false;
    if (p.state === 'surrender') {
      B.giveUp = nearestFoe(p, S, 25) || p.captor ? 0 : (B.giveUp || 0) + dt;
      if (B.giveUp > GIVE_UP) { release(p, S); p.witness = false; mv.kneel = false; }
      return still;
    }
    if (p.state === 'led') {
      const L = byId(S, p.leader);
      if (!L || !L.fight || L.fight.down) { p.state = 'bound'; p.leader = null; return still; }
      if (p.leader === 'player') {
        const pr = K.Places.PRISONS[S.player.team];
        if (pr && Math.hypot(L.mv.pos[0] - pr.at[0], L.mv.pos[2] - pr.at[1]) < 5) { jail(p, S, pr, out); return still; }
      }
      const lb = K.basis(L.mv.yaw, 0), spot = [L.mv.pos[0] - lb.fwd[0] * 1.6, L.mv.pos[2] - lb.fwd[2] * 1.6], far = Math.hypot(spot[0] - mv.pos[0], spot[1] - mv.pos[2]);
      return steer(p, spot, dt, S, W, { reach: 0.6, walk: far < 4 }) || { fwd: 0, side: 0, yaw: turn(mv.yaw, L.mv.yaw, 4 * dt) };
    }
    if (p.state === 'jailed') {
      const a = p.act;
      if (a && a.post && Math.hypot(a.post[0] - mv.pos[0], a.post[1] - mv.pos[2]) > 1.5) return steer(p, a.post, dt, S, W, { walk: true, reach: 0.4 }) || still;
      return K.Body.drive(p, dt);
    }
    return still;
  }

  const CARRIED = (() => { const q = K.Body.restPose(); Object.assign(q, { pitch: 1.57, spine: 0.95, neck: 0.5, lSh: 1.3, rSh: 1.3, lEl: 0.25, rEl: 0.25, lHip: 1.25, rHip: 1.25, lKnee: 0.35, rKnee: 0.35, plant: 0 }); return q; })();
  const DRAGGED = (() => { const q = K.Body.restPose(); Object.assign(q, { pitch: -1.45, neck: -0.2, lSh: 2.9, rSh: 2.9, lEl: 0.1, rEl: 0.1, lOut: -0.15, rOut: -0.15, lHip: 0.1, rHip: 0.1, lKnee: 0.15, rKnee: 0.1, plant: 0 }); return q; })();

  function holdBody(b, c, W) {
    const fig = K.Body.figure(b.kit), mv = c.mv, yb = K.basis(mv.yaw, 0);
    if (mv.load === 'drag') {
      const x = mv.pos[0] - yb.fwd[0] * 1.55, z = mv.pos[2] - yb.fwd[2] * 1.55, g = W.groundAt ? W.groundAt(x, z, mv.pos[1] + 0.5) : W.terrain.heightAt(x, z);
      b.frames = K.Body.fk(fig, Object.assign(DRAGGED, { lift: 0.14 - fig.origin[2][1] }), [x, g, z], mv.yaw + Math.PI, b.frames);
    } else {
      const sh = mv.pos[1] + 1.43 * K.Body.figure(c.kit).sy;
      b.frames = K.Body.fk(fig, Object.assign(CARRIED, { lift: 0 }), [mv.pos[0] - yb.fwd[0] * 0.06, sh - fig.origin[2][1] + 0.1, mv.pos[2] - yb.fwd[2] * 0.06], mv.yaw + Math.PI / 2, b.frames);
    }
    b.pts = K.Body.particles(fig, b.frames, b.pts);
  }

  function lift(S, b, c) {
    const was = b.carrier === 'player' ? S.player : b.carrier !== undefined && b.carrier !== null ? S.people.find(q => q.id === b.carrier) : null;
    if (was && was !== c) { was.carry = null; if (was.mv) was.mv.load = null; }
    b.carrier = c === S.player ? 'player' : c.id;
    b.frozen = true;
    b.prev = null;
    b.near = null;
    if (c !== S.player) c.carry = b.id;
    return b;
  }

  function putDown(S, b) {
    const c = b.carrier === 'player' ? S.player : S.people.find(q => q.id === b.carrier);
    if (c) { c.carry = null; if (c.mv) c.mv.load = null; }
    b.carrier = null;
    b.frozen = false;
    b.prev = Float64Array.from(b.pts);
    b.t = 1;
    b.still = 0;
    b.near = null;
    S.version = (S.version || 0) + 1;
    return b;
  }

  function revive(S, b, W, by, out) {
    const who = b.who || { team: b.kit.side, name: null, debt: 0, exp: 'soldier', hand: 'r' }, H = K.Places.HEALERS[who.team] || K.Places.HEALERS.town;
    const cut = Object.assign({}, b.kit.cut || {});
    for (const [k, v] of Object.entries(cut)) if (v === 'fresh') cut[k] = 'bandaged';
    b.kit.cut = cut;
    const k = S.people.filter(q => q.healed).length, hb = K.basis(H.face, 0), away = 1.5 + Math.floor(k / 3) * 1.1, x = H.at[0] + hb.fwd[0] * away + hb.right[0] * (k % 3 - 1) * 1.2, z = H.at[1] + hb.fwd[2] * away + hb.right[2] * (k % 3 - 1) * 1.2;
    const p = K.Body.person(b.id, b.kit, x, z, H.face, W, { kind: 'stand', post: [x, z], face: H.face });
    p.sack = b.sack || [];
    p.fight = K.Combat.fighter({ exp: who.exp || 'soldier', hand: who.hand || 'r' });
    p.fight.life = 60;
    p.team = who.team;
    p.name = who.name;
    p.debt = who.debt || 0;
    if (by === 'player') p.debt = Math.min(5, p.debt + 2);
    else if (who.nearHero && !who.helped) p.debt = Math.max(0, p.debt - 1);
    p.healed = true;
    S.bodies.splice(S.bodies.indexOf(b), 1);
    if (S.stuck) S.stuck = S.stuck.filter(s => s.host !== b.id);
    S.people.push(p);
    S.version = (S.version || 0) + 1;
    stats(S).carried++;
    out.push({ kind: 'healed', who: p, by, healer: H });
    return p;
  }

  function deliver(S, b, W, by, out) {
    const team = (b.who && b.who.team) || b.kit.side, H = K.Places.HEALERS[team] || K.Places.HEALERS.town;
    const alive = b.cause === 'ko' && (b.ko > 0 || b.stable);
    if (!alive) { putDown(S, b); out.push({ kind: 'healed', who: null, body: b, by, healer: H, dead: true }); return null; }
    const c = b.carrier === 'player' ? S.player : S.people.find(q => q.id === b.carrier);
    if (c) { c.carry = null; if (c.mv) c.mv.load = null; }
    b.carrier = null;
    return revive(S, b, W, by, out);
  }

  const healerNear = (S, pos, team, r) => { const H = K.Places.HEALERS[team] || K.Places.HEALERS.town; return Math.hypot(pos[0] - H.at[0], pos[2] - H.at[1]) < (r || 4) ? H : null; };

  function loot(p, b, S) {
    const bag = p.sack || (p.sack = []), from = b.sack || [];
    const want = ['bandage', 'silver'];
    if (hasItem(p, 'bow')) want.push('arrow');
    if (hasItem(p, 'crossbow')) want.push('bolt');
    for (const id of want) {
      const s = from.find(x => x.id === id);
      if (s) { stash(bag, id, s.n); from.splice(from.indexOf(s), 1); }
    }
    if (K.Missile && S.stuck) for (const s of K.Missile.inBody(S, b)) {
      const ammo = K.Data.MISSILES[s.kind].ammo;
      if (want.includes(ammo)) { stash(bag, ammo, 1); S.stuck.splice(S.stuck.indexOf(s), 1); }
    }
    b.looted = true;
    b.version = (b.version || 0) + 1;
  }

  function decide(p, S, W, rnd, caps, out) {
    const F = p.fight, mv = p.mv, B = p.brain, P = S.player;
    if (p.role === 'watch' && F.hostile && (!wanted(S, F.hostile) || !town(F.hostile))) { F.hostile = null; K.Combat.guard(F, false); if (K.Missile) K.Missile.cancel(F); }
    if (S.time - (B.seeAt || -9) >= SEE) { B.seeAt = S.time; acquire(p, S, W); }
    const calm = S.time - (B.foeAt === undefined ? -99 : B.foeAt) > CALM;
    const foe = F.hostile || (S.time - (B.foeAt || -99) < 3 ? nearestFoe(p, S, NEAR_FOE) : null);
    if (F.binding) { B.job = { kind: 'bind' }; return; }
    if (B.job && B.job.kind === 'flee' && S.time < B.job.until && caps.stand) return;
    if (p.carry !== undefined && p.carry !== null) {
      const b = S.bodies.find(x => x.id === p.carry);
      if (!b || b.carrier !== p.id) { p.carry = null; mv.load = null; }
      else if (foe && flat(mv.pos, foe.mv.pos) < 10) { putDown(S, b); mv.load = null; }
      else { B.job = { kind: 'carry', body: b }; return; }
    }
    if (p.escort !== undefined && p.escort !== null) {
      const q = S.people.find(x => x.id === p.escort);
      if (!q || q.state !== 'led' || q.leader !== p.id) p.escort = null;
      else if (!(foe && flat(mv.pos, foe.mv.pos) < 10)) { B.job = { kind: 'escort', who: q }; return; }
    }
    if (!caps.stand) {
      if (!B.called && (foe || K.Wounds.bleeding(F))) {
        B.called = true;
        out.push({ kind: 'call', who: p });
        for (const o of S.people) if (o !== p && o.team === p.team && !o.state && flat(o.mv.pos, mv.pos) < CALL) { const OB = o.brain || (o.brain = brain()); OB.alert = { pos: mv.pos.slice(), t: S.time, help: true }; }
      }
      F.hostile = null;
      B.job = { kind: 'crawl', from: foe ? foe.mv.pos.slice() : B.job && B.job.kind === 'crawl' ? B.job.from : null };
      return;
    }
    if (!fighting(p) && caps.weapon) {
      if (hasItem(p, 'knife')) {
        takeOne(p.sack, 'knife');
        F.weapon = 'knife';
        F.mode = 'melee';
        F.hand = K.Wounds.handFor(p.kit, F.hand) || 'r';
        B.next = (B.t || 0) + 1;
        stats(S).knife++;
        out.push({ kind: 'knife', who: p });
      } else if (foe && flat(mv.pos, foe.mv.pos) < 15) { if (p.villager !== undefined) { B.job = { kind: 'flee', from: foe.mv.pos.slice(), until: S.time + FLEE }; return; } surrender(p, S, out); B.job = null; return; }
    }
    if (!fighting(p)) {
      F.hostile = null;
      if (foe && flat(mv.pos, foe.mv.pos) < 25) { B.job = { kind: 'flee', from: foe.mv.pos.slice(), until: S.time + FLEE }; return; }
    }
    if (F.life < 25 && K.Wounds.bleeding(F) && hasItem(p, 'bandage') && foe && flat(mv.pos, foe.mv.pos) < 10 && !(B.fleeUntil > S.time) && S.time > (B.fledAt || -99) + 20) {
      B.fleeUntil = S.time + FLEE;
      B.fledAt = S.time;
      B.ignoreUntil = S.time + FLEE + 4;
      F.hostile = null;
      K.Combat.guard(F, false);
      if (K.Missile) K.Missile.cancel(F);
    }
    if (B.fleeUntil > S.time) { B.job = { kind: 'flee', from: (B.foePos || mv.pos).slice(), until: B.fleeUntil }; return; }
    const Q = p.squad === 'player' ? S.squad : null;
    if (Q && Q.order === 'retreat' && !B.retreated) { B.job = { kind: 'retreat' }; return; }
    if (F.hostile) { B.job = { kind: 'fight' }; return; }
    const PF = P && P.fight;
    if (PF && alive(PF) && P.team === p.team && caps.bindOther && flat(mv.pos, P.mv.pos) <= RESCUE && (!S.rescue || S.rescue.by === p.id) && ((p.debt || 0) >= 1 || valued(S, p.team))) {
      if (!S.rescue) S.rescue = { by: p.id, from: P.mv.pos.slice(), t: S.time };
      B.job = { kind: 'rescue' };
      return;
    }
    let need = null, urgency = Infinity;
    if (caps.bindOther && hasItem(p, 'bandage') && !(foe && flat(mv.pos, foe.mv.pos) < 8)) {
      for (const q of S.people) {
        if (q === p || q.noAid || q.team !== p.team || !q.fight || q.fight.down || q.fight.binding || claimed(q, p, S) || q.state === 'jailed') continue;
        const b = q.fight.bleed, fresh = Object.values(q.kit.cut || {}).includes('fresh');
        if (!(b && (b.heavy >= 0 || b.medium > 0)) && !fresh) continue;
        const d = flat(mv.pos, q.mv.pos), u = b && b.heavy >= 0 ? b.heavy : b && b.medium > 0 ? 40 + d : 60 + d;
        if (d < HELP && u < urgency) { urgency = u; need = q; }
      }
      for (const b of S.bodies) {
        if (!(b.ko > 0) || b.stable || b.carrier || !b.who || b.who.team !== p.team || claimed(b, p, S)) continue;
        const d = flat(mv.pos, K.Body.anchorOf(b));
        if (d < HELP && b.ko < urgency) { urgency = b.ko; need = b; }
      }
    }
    if (need) { claim(need, p, S); B.job = { kind: 'aid', target: need }; return; }
    if (calm) {
      let best = null, bd = Infinity, kind = null;
      for (const b of S.bodies) {
        if (b.carrier || !b.who || b.cause !== 'ko' || claimed(b, p, S)) continue;
        const d = flat(mv.pos, K.Body.anchorOf(b));
        if (b.who.team === p.team && b.stable && caps.carry && d < LIFT && d < bd) { bd = d; best = b; kind = 'lift'; }
      }
      if (!best && K.Places.PRISONS[p.team]) for (const q of S.people) {
        if ((q.state !== 'surrender' && q.state !== 'bound') || q.leader || (q.captor && q.captor !== p.id) || !enemies(p.team, q.team) || claimed(q, p, S)) continue;
        const d = flat(mv.pos, q.mv.pos);
        if (d < LOOT && d < bd) { bd = d; best = q; kind = 'capture'; }
      }
      if (!best) for (const b of S.bodies) {
        if (b.carrier || b.looted || !b.who || !enemies(p.team, b.who.team) || claimed(b, p, S)) continue;
        const d = flat(mv.pos, K.Body.anchorOf(b));
        if (d < LOOT && d < bd) { bd = d; best = b; kind = 'loot'; }
      }
      if (best) { claim(best, p, S); if (kind === 'capture') best.captor = p.id; B.job = { kind, target: best }; return; }
    }
    if (K.Elves && S.village) { const j = K.Elves.bucketJob(S, p) || K.Elves.burnJob(S, p); if (j) { B.job = j; return; } }
    if (B.alert && S.time - B.alert.t < ALERT && flat(mv.pos, B.alert.pos) > 3) { B.job = { kind: 'go', pos: B.alert.pos }; return; }
    if (p.tell) { B.job = { kind: 'go', pos: [p.tell.haven[0], 0, p.tell.haven[1]] }; return; }
    if (p.convoy && K.Caravan) { const slot = K.Caravan.slotOf(S, p); if (slot) { B.job = { kind: 'convoy', slot }; return; } }
    if (p.march && K.World) { const slot = K.World.slotOf(S, p); if (slot) { B.job = { kind: 'convoy', slot, march: true }; return; } }
    if (Q && Q.order !== 'retreat') { B.job = { kind: 'order' }; return; }
    if (Q && B.retreated) { B.job = { kind: 'order' }; return; }
    B.job = { kind: 'idle' };
  }

  function idle(p, S, dt, W) {
    const a = p.act, mv = p.mv;
    if (a && a.kind === 'stand' && a.post && Math.hypot(a.post[0] - mv.pos[0], a.post[1] - mv.pos[2]) > 3) { const s = steer(p, a.post, dt, S, W, { walk: true, reach: 0.4 }); if (s) return s; }
    if (a && a.route) {
      const t = a.route[p.leg % a.route.length];
      if (Math.hypot(t[0] - mv.pos[0], t[1] - mv.pos[2]) > 12) { const s = steer(p, t, dt, S, W, { walk: true, reach: 1 }); if (s) return s; }
    }
    return a ? K.Body.drive(p, dt) : { fwd: 0, side: 0, yaw: mv.yaw };
  }

  function perform(p, S, dt, W, rnd, caps, out) {
    const F = p.fight, mv = p.mv, B = p.brain, job = B.job || { kind: 'idle' }, still = { fwd: 0, side: 0, yaw: mv.yaw };
    mv.load = null;
    if (job.kind !== 'loot') mv.crouch = job.kind === 'fight' ? mv.crouch : false;
    switch (job.kind) {
      case 'bind': F.aim = idleAim(p); return still;
      case 'crawl': {
        F.aim = idleAim(p);
        if (!job.from || flat(mv.pos, job.from) > 30) return still;
        return { fwd: 1, side: 0, yaw: turn(mv.yaw, Math.atan2(mv.pos[0] - job.from[0], -(mv.pos[2] - job.from[2])), 3 * dt), sprint: false };
      }
      case 'flee': {
        F.aim = idleAim(p);
        mv.walk = false;
        return { fwd: 1, side: 0, yaw: turn(mv.yaw, Math.atan2(mv.pos[0] - job.from[0], -(mv.pos[2] - job.from[2])), 8 * dt), sprint: mv.stamina > 25 };
      }
      case 'retreat': {
        F.aim = idleAim(p);
        const P = S.player, s = P ? steer(p, xz(P.mv.pos), dt, S, W, { sprint: true, reach: 4 }) : null;
        if (!s) { B.retreated = true; return still; }
        return s;
      }
      case 'fight': {
        const tgt = F.hostile;
        if (!tgt) break;
        const Q = p.squad === 'player' ? S.squad : null, ranged = K.Missile && K.Missile.ranged(F);
        if (Q && (Q.order === 'line' || Q.order === 'hold') && !ranged && tgt !== Q.target) {
          const slot = slotOf(p, S);
          if (slot && Math.hypot(tgt.mv.pos[0] - slot[0], tgt.mv.pos[2] - slot[1]) > LEASH) {
            const e = engage(p, dt, rnd, S, W);
            const s = steer(p, slot, dt, S, W, { reach: 0.5 });
            if (s) return s;
            K.Combat.guard(F, flat(mv.pos, tgt.mv.pos) < 6, 'right');
            return { fwd: 0, side: 0, yaw: e ? e.yaw : mv.yaw };
          }
        }
        const e = engage(p, dt, rnd, S, W);
        if (!F.hostile) break;
        const d = flat(mv.pos, tgt.mv.pos), goal = B.seenNow ? xz(tgt.mv.pos) : B.last ? [B.last[0], B.last[2]] : xz(tgt.mv.pos);
        if (d > 3 && !(ranged && B.seenNow)) {
          if (S.time - (B.lineAt || -9) > 0.3) { B.lineAt = S.time; B.lineOk = K.Nav.line(K.Nav.of(W), xz(mv.pos), goal); }
          if (!B.lineOk) { const s = steer(p, goal, dt, S, W, { sprint: d > 8 }); if (s) return s; }
        }
        if (e) return e;
        break;
      }
      case 'rescue': {
        const P = S.player, PF = P.fight;
        F.aim = idleAim(p);
        if (!alive(PF) || (S.rescue && S.rescue.by !== p.id)) { B.job = null; break; }
        const s = steer(p, xz(P.mv.pos), dt, S, W, { sprint: true, reach: 1.3 });
        if (s) return s;
        if (!F.binding && !PF.stable) K.Wounds.bind(p, P, hasItem(p, 'bandage') ? p.sack : [{ id: 'bandage', n: 1 }]);
        return still;
      }
      case 'aid': {
        const t = job.target, at = where(t);
        F.aim = idleAim(p);
        if ((t.fight && (t.fight.down || t.fight.binding)) || (t.pts && (t.stable || !(t.ko > 0) || t.carrier))) { B.job = null; break; }
        claim(t, p, S);
        const s = steer(p, xz(at), dt, S, W, { reach: 1.2, sprint: flat(mv.pos, at) > 6 });
        if (s) return s;
        if (!F.binding) { const r = K.Wounds.bind(p, t, p.sack); if (!r.ok) B.job = null; }
        return { fwd: 0, side: 0, yaw: turn(mv.yaw, Math.atan2(at[0] - mv.pos[0], -(at[2] - mv.pos[2])), 4 * dt) };
      }
      case 'lift': {
        const b = job.target;
        F.aim = idleAim(p);
        if (b.carrier || !S.bodies.includes(b)) { B.job = null; break; }
        claim(b, p, S);
        const s = steer(p, xz(K.Body.anchorOf(b)), dt, S, W, { reach: 1.1 });
        if (s) return s;
        lift(S, b, p);
        B.job = { kind: 'carry', body: b };
        return still;
      }
      case 'carry': {
        const b = job.body, team = (b.who && b.who.team) || p.team, H = K.Places.HEALERS[team] || K.Places.HEALERS.town;
        F.aim = idleAim(p);
        mv.load = 'carry';
        if (healerNear(S, mv.pos, team, 2.5)) { deliver(S, b, W, p.id, out); mv.load = null; B.job = null; return still; }
        return steer(p, H.at, dt, S, W, { reach: 2 }) || still;
      }
      case 'capture': {
        const q = job.target;
        F.aim = idleAim(p);
        if (q.leader || (q.state !== 'surrender' && q.state !== 'bound')) { B.job = null; break; }
        claim(q, p, S);
        const s = steer(p, xz(q.mv.pos), dt, S, W, { reach: 1.2 });
        if (s) { B.tieT = 0; return s; }
        B.tieT = (B.tieT || 0) + dt;
        if (B.tieT >= TIE) { q.state = 'led'; q.leader = p.id; q.captor = p.id; p.escort = q.id; B.tieT = 0; stats(S).bound++; out.push({ kind: 'tied', who: q, by: p }); B.job = { kind: 'escort', who: q }; }
        return still;
      }
      case 'escort': {
        const pr = K.Places.PRISONS[p.team];
        F.aim = idleAim(p);
        if (!pr) { p.escort = null; B.job = null; break; }
        if (Math.hypot(mv.pos[0] - pr.at[0], mv.pos[2] - pr.at[1]) < 3) { jail(job.who, S, pr, out); p.escort = null; B.job = null; return still; }
        return steer(p, pr.at, dt, S, W, { walk: true, reach: 2 }) || still;
      }
      case 'loot': {
        const b = job.target;
        F.aim = idleAim(p);
        if (b.looted || b.carrier || !S.bodies.includes(b)) { B.job = null; mv.crouch = false; break; }
        claim(b, p, S);
        const s = steer(p, xz(K.Body.anchorOf(b)), dt, S, W, { reach: 1.3, walk: true });
        if (s) { B.lootT = 0; mv.crouch = false; return s; }
        mv.crouch = true;
        B.lootT = (B.lootT || 0) + dt;
        if (B.lootT >= SEARCH) { loot(p, b, S); B.lootT = 0; mv.crouch = false; B.job = null; }
        return still;
      }
      case 'go': {
        F.aim = idleAim(p);
        const s = steer(p, xz(job.pos), dt, S, W, { reach: 3, sprint: true });
        if (s) return s;
        B.alert = null;
        break;
      }
      case 'convoy': {
        F.aim = idleAim(p);
        const slot = (job.march ? K.World.slotOf(S, p) : K.Caravan.slotOf(S, p)) || job.slot, d = Math.hypot(slot[0] - mv.pos[0], slot[1] - mv.pos[2]);
        if (d < 0.7) return { fwd: 0, side: 0, yaw: mv.yaw };
        if (d < 8) { mv.walk = d < 3; return { fwd: 1, side: 0, yaw: turn(mv.yaw, Math.atan2(slot[0] - mv.pos[0], -(slot[1] - mv.pos[2])), 5 * dt), sprint: false }; }
        const s = steer(p, slot, dt, S, W, { reach: 1, sprint: d > 20 });
        if (s) return s;
        break;
      }
      case 'bucket': {
        F.aim = idleAim(p);
        const s = K.Elves.bucketStep(p, S, dt, W);
        if (s) return s;
        break;
      }
      case 'torch': {
        F.aim = idleAim(p);
        const s = K.Elves.torchStep(p, S, dt, W);
        if (s) return s;
        break;
      }
      case 'order': {
        F.aim = idleAim(p);
        const slot = slotOf(p, S), Q = S.squad, P = S.player;
        if (!slot) break;
        const d = Math.hypot(slot[0] - mv.pos[0], slot[1] - mv.pos[2]);
        const s = steer(p, slot, dt, S, W, { reach: Q.order === 'follow' ? 1.2 : 0.4, walk: d < 5 && !(P && P.mv.speed > 2.5), sprint: d > 12 });
        if (s) return s;
        return { fwd: 0, side: 0, yaw: turn(mv.yaw, Q.order === 'follow' ? P.mv.yaw : Q.order === 'line' ? Q.face : mv.yaw, 4 * dt) };
      }
      default: break;
    }
    F.aim = idleAim(p);
    return idle(p, S, dt, W);
  }

  function mind(p, S, dt, W, rnd, out) {
    const F = p.fight, mv = p.mv, B = p.brain || (p.brain = brain());
    mv.kneel = false;
    mv.tied = false;
    if (p.state) return captiveStep(p, S, dt, W, out);
    const caps = K.Wounds.caps(p.kit);
    B.tick = (B.tick || 0) - dt;
    if (B.tick <= 0) {
      const far = S.player && flat(S.player.mv.pos, mv.pos) > FAR;
      B.tick = far ? FAR_TICK : NEAR_TICK;
      decide(p, S, W, rnd, caps, out);
    }
    return perform(p, S, dt, W, rnd, caps, out);
  }

  function carryOut(S, W) {
    const R = S.rescue, P = S.player, F = P.fight, by = R ? byId(S, R.by) : null, H = K.Places.HEALERS[P.team] || K.Places.HEALERS.town;
    if (P.gear) K.Combat.dropGear(S, P);
    else { F.weapon = null; F.shield = false; }
    const cut = Object.assign({}, P.kit.cut || {});
    for (const [k, v] of Object.entries(cut)) if (v === 'fresh') cut[k] = 'bandaged';
    P.kit.cut = cut;
    const hb = K.basis(H.face, 0);
    P.mv = K.Move.body(W, H.at[0] + hb.fwd[0] * 1.5, H.at[1] + hb.fwd[2] * 1.5, H.face);
    Object.assign(F, { down: null, ko: 0, stable: false, life: 60, binding: null, act: null, guard: null, reported: false, hostile: null, mode: 'melee', draw: null, reload: null });
    F.bleed = K.Wounds.bleed();
    S.hour = (S.hour || 0) + 6;
    if (S.hour >= 24) { S.hour -= 24; S.day = (S.day || 1) + 1; }
    if (by) { by.mv = K.Move.body(W, H.at[0] + hb.fwd[0] * 0.6 + hb.right[0] * 1.4, H.at[1] + hb.fwd[2] * 0.6 + hb.right[2] * 1.4, H.face); by.brain.path = null; by.brain.job = null; }
    for (const q of S.people) if (q.fight && q.fight.hostile === P) { q.fight.hostile = null; K.Combat.guard(q.fight, false); }
    S.rescue = null;
    stats(S).rescued++;
    S.version = (S.version || 0) + 1;
    return { by, healer: H };
  }

  function run(S, dt, W, rnd, scratch) {
    const pose = scratch || K.Body.restPose(), minds = [], convoy = K.Caravan && S.caravans ? K.Caravan.run(S, dt, W, rnd) : [];
    if (K.World && S.world) convoy.push(...K.World.run(S, dt, W, rnd));
    if (K.Elves && S.world) convoy.push(...K.Elves.run(S, dt, W, rnd));
    if (K.Guard && S.world) convoy.push(...K.Guard.run(S, dt, W, rnd));
    if (K.Villain && S.world) convoy.push(...K.Villain.run(S, dt, W, rnd));
    for (const p of S.people) {
      const F = p.fight;
      if (F && F.hostile && (F.hostile.fight.down || Math.hypot(F.hostile.mv.pos[0] - p.mv.pos[0], F.hostile.mv.pos[2] - p.mv.pos[2]) > FORGET)) { F.hostile = null; K.Combat.guard(F, false); F.act = null; }
      if (p.kit.side === 'straw') {
        if (F) F.aim = idleAim(p);
      } else {
        if (F && !captive(p)) retaliate(S, p, W);
        let inp = p.team && F ? mind(p, S, dt, W, rnd, minds) : F && F.hostile ? engage(p, dt, rnd, S, W) : null;
        if (!inp) { inp = K.Body.drive(p, dt); if (F) F.aim = idleAim(p); }
        p.mv.brush = p.kit.side !== 'elf';
        if (K.Wounds) { p.mv.limit = K.Wounds.caps(p.kit); p.mv.aid = (p.sack || []).some(s => s.id === 'crutch') ? 'crutch' : null; }
        if (F && F.binding) inp = Object.assign({}, inp, { fwd: 0, side: 0 });
        if (!p.mv.chair) K.Move.step(p.mv, inp, dt, W);
      }
      if (!p.anim) p.anim = K.Anim.state();
      K.Anim.update(p.anim, p.mv, dt);
    }
    for (const c of S.chairs || []) {
      if (c.rider === null && c.pusher === null && (Math.abs(c.speed) > 0.01 || Math.abs(K.Move.chairUphill(W.terrain, c)) > 2)) K.Move.rollChair(c, {}, dt, W);
      const r = typeof c.rider === 'number' ? S.people.find(p => p.id === c.rider) : null;
      if (r) { r.mv.pos = c.pos.slice(); r.mv.yaw = c.yaw; r.mv.chair = c.id; r.mv.speed = Math.abs(c.speed); }
    }
    const crowd = S.people.filter(p => p.kit.side !== 'straw' && !p.mv.chair).map(p => p.mv);
    if (S.player) crowd.unshift(S.player.mv);
    K.Body.separate(crowd);
    for (const p of S.people) K.Anim.dress(p, p.anim, pose);
    if (S.player && S.player.anim && S.player.fight && !S.player.fight.down) K.Anim.dress(S.player, S.player.anim, pose);
    const wild = K.Beasts && (S.beasts || S.fauna || S.focus || S.player) ? K.Beasts.step(S, dt, W, rnd) : [];
    const events = K.Combat.step(S, dt, rnd);
    events.unshift(...wild);
    if (K.Missile) events.push(...K.Missile.step(S, dt, W, rnd));
    const results = K.Combat.apply(S, events);
    events.push(...law(S, events));
    events.push(...convoy);
    if (K.Caravan && S.caravans) K.Caravan.react(S, events);
    if (K.World && S.world) K.World.react(S, events);
    if (K.Wounds) {
      const wounds = K.Wounds.step(S, dt);
      events.push(...wounds);
      for (const e of wounds) if (e.kind === 'drip') K.Wounds.pool(S, e.at[0], e.at[2], e.big ? 0.07 : 0.045, S.time, W.terrain.heightAt(e.at[0], e.at[2]));
      if (wounds.some(e => e.kind === 'faint')) results.push(...K.Combat.apply(S, []));
      for (const e of wounds) {
        if (e.kind !== 'bound') continue;
        if (e.to === S.player && S.rescue && e.who.id === S.rescue.by) events.push({ kind: 'rescued', by: e.who, healer: K.Places.HEALERS[S.player.team] || K.Places.HEALERS.town, from: S.rescue.from });
        else if (e.who === S.player && e.to !== S.player) {
          if (e.to.pts && e.to.who) { e.to.who.debt = Math.min(5, (e.to.who.debt || 0) + 1); e.to.who.helped = true; }
          else if (e.to.team) e.to.debt = Math.min(5, (e.to.debt || 0) + 1);
        }
      }
    }
    if (K.Elves && S.world) K.Elves.post(S, events, W, rnd);
    if (K.Guard && S.world) K.Guard.post(S, events, W, rnd);
    if (K.Villain && S.world) K.Villain.post(S, events, W, rnd, results);
    events.push(...minds);
    if (S.player) for (const r of results) {
      if (r.kind !== 'down' || !r.body || !r.body.who || r.body.who.team !== S.player.team) continue;
      if (flat(S.player.mv.pos, r.who.mv.pos) < HELP) r.body.who.nearHero = true;
    }
    for (const b of S.bodies) {
      if (!b.carrier) continue;
      const c = b.carrier === 'player' ? S.player : S.people.find(q => q.id === b.carrier);
      if (!c || !c.fight || c.fight.down || (c !== S.player && c.carry !== b.id)) { putDown(S, b); continue; }
      holdBody(b, c, W);
    }
    let settled = results.some(r => r.kind === 'down' || r.kind === 'piece');
    const frozen = [];
    for (const b of S.bodies) if (!b.frozen && !b.carrier && K.Body.simulate(b, dt, W)) { settled = true; frozen.push(b); }
    for (const pc of S.parts) if (!pc.frozen && K.Body.simulate(pc, dt, W)) { settled = true; frozen.push(pc); }
    for (const it of S.items) if (!it.frozen && K.Body.simulateItem(it, dt, W)) settled = true;
    for (const p of S.people) if (p.regrow && regrow(S, p)) settled = true;
    if (settled) S.version = (S.version || 0) + 1;
    return { events, results, frozen };
  }

  K.AI = { WANTED, wanted, law, inTown: town, foeOf, brain, think, engage, aimShot, ballistic, aimAt, eyeOf, armed, run, idleAim, mind, steer, slotOf, squadOf, canCommand, order, captive, enemies, release, jail, lift, putDown, deliver, healerNear, carryOut, valued, standingOf };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
