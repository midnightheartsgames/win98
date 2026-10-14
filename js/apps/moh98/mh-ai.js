(function (S) {
  'use strict';
  const { clamp, wrapAng } = S;
  const D = S.DATA, WP = D.WEAPONS, DT = 1 / 60, B = D.BARKS;

  function bark(g, a, list, force) {
    if (!a.ai || a.hidden) return;
    if (!force && a.ai.barkT > 0) return;
    a.ai.barkT = 4 + g.rng() * 5;
    const d = Math.hypot(a.x - g.player.x, a.z - g.player.z);
    if (d > 45) return;
    g.emit({ t: 'bark', uid: a.uid, text: g.L(list[Math.floor(g.rng() * list.length)]), x: a.x, y: a.y + 2, z: a.z, voice: a.tpl === 'stahl' ? 2 : a.uid % 2 });
  }
  S.bark = bark;

  function newAI(g) {
    return { state: 'idle', t: 0, percT: g.rng() * 0.3, decT: g.rng() * 0.5, target: null, lastSeen: null, seenT: 99, alertT: 0, sus: 0, path: null, pathI: 0, pathT: 0,
      cover: null, coverT: 0, peek: false, burst: 0, shootT: 0, reactT: 0, reloadT: 0, barkT: g.rng() * 5, strafe: 1, strafeT: 0, nadeT: 6 + g.rng() * 8, patrolI: 0, wanderT: 0,
      waitT: 0, stuckT: 0, lastPos: null, combatT: 0, dodgeT: 0, bodyT: 0, firstShot: 1, surT: 0 };
  }
  let UIDC = 1000;
  S.makeHuman = function (g, n, idx) {
    const tpl = D.HUMANS[n.tpl] || D.HUMANS.rifleman, r = g.rng, look = S.LOOKS[tpl.look] || {};
    const wid = tpl.weapons.length ? tpl.weapons[Math.floor(r() * tpl.weapons.length)] : null;
    const hp = Math.round(tpl.hp * (tpl.ally ? 1 : g.sk.hp));
    const a = {
      uid: ++UIDC, kind: 'human', tpl: n.tpl, src: idx, id: n.id || null, look: tpl.look, x: n.x, z: n.z, y: n.y != null ? n.y : g.W.groundAt(n.x, n.z, 0.3), vx: 0, vy: 0, vz: 0, r: 0.32, h: 1.8,
      yaw: n.yaw || 0, ground: true, hp, maxHp: hp, dead: false, deadT: 0, beh: n.beh || 'guard', home: { x: n.x, z: n.z, yaw: n.yaw || 0 }, pathId: n.path || null, group: n.group || null,
      leash: n.leash == null ? (n.beh === 'mg' || n.beh === 'sniper' ? 0 : 22) : n.leash, hidden: !!n.hidden, ally: !!tpl.ally, weapon: wid, mag: wid ? WP[wid].mag : 0, acc: tpl.acc,
      drops: n.drops || [], helmet: look.head === 'm35' || look.head === 'm1', crouch: 0, anim: null, freed: false, surrender: 0
    };
    a.ai = newAI(g);
    return a;
  };
  S.makeDog = function (g, n, idx) {
    const DG = D.DOG;
    const a = { uid: ++UIDC, kind: 'dog', src: idx, id: n.id || null, x: n.x, z: n.z, y: g.W.groundAt(n.x, n.z, 0.3), vx: 0, vy: 0, vz: 0, r: DG.r, h: DG.h, yaw: n.yaw || 0, ground: true,
      hp: DG.hp, maxHp: DG.hp, dead: false, deadT: 0, beh: n.beh || 'guard', home: { x: n.x, z: n.z, yaw: n.yaw || 0 }, pathId: n.path || null, hidden: !!n.hidden, leash: 60, anim: null };
    a.ai = newAI(g);
    return a;
  };
  S.makeTank = function (g, t) {
    const TK = D.TANK;
    return { id: t.id || null, x: t.x, z: t.z, y: t.y, yaw: t.rot || 0, turret: 0, elev: 0, hp: TK.hp, dead: false, deadT: 0, r: TK.r, pathId: t.path || null, pathI: 1, fireT: 3, mgT: 0, burst: 0, wait: 0 };
  };

  S.actorHeight = function (a) {
    if (a.kind === 'dog') return 0.8;
    if (a.dead) return 0.45;
    return 1.8 - a.crouch * 0.6;
  };
  S.actorHead = function (a) {
    if (a.kind === 'dog') return [a.x + Math.sin(a.yaw) * 0.55, a.y + 0.7, a.z + Math.cos(a.yaw) * 0.55, 0.16];
    const h = S.actorHeight(a);
    if (a.dead) return [a.x + Math.sin(a.yaw) * 0.8, a.y + 0.2, a.z + Math.cos(a.yaw) * 0.8, 0.14];
    return [a.x, a.y + h - 0.13, a.z, 0.145];
  };
  S.pointLineDist = function (px, py, pz, ax, ay, az, bx, by, bz) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, l2 = dx * dx + dy * dy + dz * dz; let t = l2 ? ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / l2 : 0; t = clamp(t, 0, 1);
    return Math.hypot(px - ax - dx * t, py - ay - dy * t, pz - az - dz * t);
  };
  const eyeOf = a => a.y + (a.kind === 'dog' ? 0.6 : 1.62 - a.crouch * 0.6);
  const posOf = (g, t) => (t === 'player' ? g.player : t);
  const chestOf = (g, t) => (t === 'player' ? g.player.y + (g.player.crouch > 0.5 ? 0.85 : 1.3) : t.y + S.actorHeight(t) * 0.62);
  const hostileToPlayer = (g, a) => !a.ally && !g.disguised && a.beh !== 'worker' && a.tpl !== 'worker';

  function dropWeapon(g, a) {
    if (!a.weapon || !WP[a.weapon] || WP[a.weapon].npcOnly) { a.weapon = null; return; }
    const d = WP[a.weapon];
    g.dropPickup(a.weapon, a.x + Math.sin(a.yaw) * 0.6, g.W.groundAt(a.x, a.z, 0.2) + 0.02, a.z + Math.cos(a.yaw) * 0.6, { n: Math.max(d.mag || 1, Math.round((d.mag || 5) * (0.6 + g.rng() * 0.8))), dropped: a.uid });
    a.weapon = null;
  }
  S.damageActor = function (g, a, dmg, type, src, dir, pow, loc) {
    if (a.hidden) return;
    if (a.dead) { if (dir && pow) { a.vx += dir[0] * pow * 0.4; a.vz += dir[2] * pow * 0.4; } return; }
    if (a.ally && src === 'player') return;
    if (a.ally) dmg *= a.tpl === 'agent' ? 0.3 : 0.6;
    a.hp -= dmg; a.ai.hurtT = 0.35; a.flash = 0.15; a.flinch = 1;
    if (dir && pow) { a.vx += dir[0] * pow * 0.5; a.vz += dir[2] * pow * 0.5; }
    const killed = a.hp <= 0;
    if (killed) { die(g, a, src, type, loc); return; }
    if (a.kind === 'dog') { g.emit({ t: 'sound', s: 'dog_hurt', x: a.x, y: a.y + 0.5, z: a.z }); if (src) acquire(g, a, src === 'player' ? 'player' : src, true); return; }
    if (dmg > 6) { bark(g, a, B.hurt); g.emit({ t: 'sound', s: 'hurt_de', x: a.x, y: a.y + 1.6, z: a.z }); }
    if (loc === 'legs') a.limp = 6;
    if (a.ally) return;
    if (src === 'player' && g.disguised) g.raiseAlarm('attack');
    if (loc === 'arm' && a.weapon && a.tpl !== 'stahl' && a.tpl !== 'mg' && g.rng() < 0.35) { dropWeapon(g, a); surrender(g, a); return; }
    if (a.hp < a.maxHp * 0.25 && a.tpl !== 'stahl' && a.tpl !== 'mg' && a.surrender === 0 && g.rng() < 0.15) { dropWeapon(g, a); surrender(g, a); return; }
    if (a.ai.state === 'surrender') return;
    if (src === 'player' && a.ai.state !== 'combat') acquire(g, a, 'player', true);
    else if (src && typeof src === 'object' && !src.dead && a.ai.state !== 'combat') acquire(g, a, src, true);
    if (a.ai.state === 'combat' && g.rng() < 0.3 && a.beh !== 'mg' && a.beh !== 'sniper') a.ai.dodgeT = 0.5;
  };
  function surrender(g, a) {
    a.ai.state = 'surrender'; a.ai.surT = 10 + g.rng() * 8; a.ai.path = null; a.surrender = 1; a.crouch = 0; a.tvx = a.tvz = 0;
    bark(g, a, B.surrender, true);
  }
  function die(g, a, src, type, loc) {
    a.dead = true; a.deadT = 0; a.hp = 0; a.crouch = 0; a.fallDir = g.rng() < 0.5 ? 1 : -1;
    if (loc === 'head' && a.helmet && type === 'bullet' && g.rng() < 0.5) { a.helmet = false; g.emit({ t: 'helmet', uid: a.uid, x: a.x, y: a.y + 1.8, z: a.z, yaw: a.yaw + Math.PI }); }
    g.emit({ t: 'death', uid: a.uid, x: a.x, y: a.y, z: a.z, kind: a.kind, gib: type === 'explosion' });
    g.emit({ t: 'sound', s: a.kind === 'dog' ? 'dog_die' : a.tpl === 'stahl' ? 'die_stahl' : 'die_de', x: a.x, y: a.y + 1, z: a.z });
    if (a.ally) return;
    if (src === 'player' || (src && src.owner === 'player')) {
      g.stats.kills++;
      if (loc === 'head' && a.lastHead) g.stats.headshots++;
      if (a.ai.state === 'surrender') g.stats.dishonor++;
    }
    if (a.kind === 'human') {
      const tpl = D.HUMANS[a.tpl];
      if (a.weapon && g.rng() < (tpl.drop || 0)) dropWeapon(g, a);
      for (const id of a.drops) g.dropPickup(id, a.x + (g.rng() - 0.5) * 0.8, g.W.groundAt(a.x, a.z, 0.2) + 0.02, a.z + (g.rng() - 0.5) * 0.8);
      if (g.rng() < 0.12) g.dropPickup(g.rng() < 0.7 ? 'canteen' : 'medkit', a.x + 0.4, g.W.groundAt(a.x, a.z, 0.2) + 0.02, a.z - 0.4);
      if (g.disguised) {
        for (const o of g.actors) {
          if (o === a || o.dead || o.hidden || o.ally || o.kind !== 'human') continue;
          const d = Math.hypot(o.x - a.x, o.z - a.z);
          if (d < 25 && g.W.los(o.x, eyeOf(o), o.z, a.x, a.y + 1, a.z)) { g.raiseAlarm('witness'); break; }
        }
      }
      if (a.tpl === 'stahl') bark(g, a, [D.T('Befehl… ist… Befehl…', 'Befehl… ist… Befehl…')], true);
    }
  }
  S.dieActor = die;
  S.alertActor = function (g, a, x, z, kind) {
    if (a.dead || a.hidden || a.ally) return;
    const ai = a.ai;
    if (ai.state === 'combat' || ai.state === 'surrender') return;
    if (g.disguised) { if (kind === 'step') return; if (kind === 'shot' && a.kind === 'human') { g.raiseAlarm('shot'); return; } }
    if (kind === 'step' && a.kind === 'human' && ai.state === 'idle') { ai.sus += 0.4; if (ai.sus < 1) { ai.lookAt = { x, z, t: 2 }; return; } }
    if (a.tpl === 'worker') { ai.state = 'flee'; ai.path = null; return; }
    ai.lastSeen = { x, z }; ai.alertT = 12; ai.state = 'alert'; ai.t = 0; ai.path = null;
  };
  function acquire(g, a, t, instant) {
    const ai = a.ai, fresh = ai.state !== 'combat';
    if (a.tpl === 'worker') { ai.state = 'flee'; ai.path = null; return; }
    ai.target = t; ai.seenT = 0; const p = posOf(g, t); ai.lastSeen = { x: p.x, z: p.z };
    if (fresh) {
      ai.state = 'combat'; ai.reactT = (instant ? 0.2 : 0.4 + g.rng() * 0.6) * g.sk.react; ai.decT = 0; ai.cover = null; ai.combatT = 0;
      if (a.kind === 'human') bark(g, a, a.tpl === 'stahl' ? B.stahl : B.spot);
      else g.emit({ t: 'sound', s: 'dog_bark', x: a.x, y: a.y + 0.6, z: a.z });
    }
  }
  S.acquire = acquire;

  function perceive(g, a) {
    const ai = a.ai, p = g.player, env = g.def.env;
    const dog = a.kind === 'dog';
    const baseR = dog ? D.DOG.sight : a.beh === 'sniper' ? 90 : (ai.state === 'idle' ? 46 : 75) - (env.night || 0) * 20;
    const ex = a.x, ey = eyeOf(a), ez = a.z, fwdX = Math.sin(a.yaw), fwdZ = Math.cos(a.yaw);
    let best = null, bd = Infinity;
    const see = (tx, ty, tz, R) => {
      const dx = tx - ex, dz = tz - ez, d = Math.hypot(dx, dz);
      if (d > R) return -1;
      const close = d < (dog ? 8 : 4);
      if (!close && ai.state === 'idle') { const dot = (dx * fwdX + dz * fwdZ) / (d || 1); if (dot < 0.1) return -1; }
      if (!g.W.los(ex, ey, ez, tx, ty, tz)) return -1;
      return d;
    };
    if (!p.dead) {
      let R = baseR; if (p.crouch > 0.5) R *= 0.6; if (p.walk) R *= 0.85;
      if (g.disguised && !dog) {
        const d = see(p.x, p.y + 1.4, p.z, 30);
        if (d >= 0) {
          const armed = g.cur && g.cur !== 'papers' && WP[g.cur] && !WP[g.cur].throw;
          if (armed && d < 9 && (p.aim > 0.4 || d < 4)) { ai.sus += 0.35 * (1.5 - d / 9); if (ai.sus >= 1) { bark(g, a, B.alarm, true); g.raiseAlarm('spotted'); } }
          if (a.beh === 'inspector' && ai.state === 'idle' && d < 14 && !a.cleared && ai.inspCD <= 0) { ai.state = 'inspect'; ai.asked = false; ai.inspT = 0; ai.path = null; }
        }
      } else if (hostileToPlayer(g, a) || dog && !g.disguised) {
        const d = see(p.x, p.y + (p.crouch > 0.5 ? 0.9 : 1.4), p.z, R);
        if (d >= 0) {
          if (ai.state === 'idle' && !dog && d > 6) { ai.sus += 0.22 * (0.25 + 2.2 * (1 - d / R) * (1 - d / R)) * (p.crouch > 0.5 ? 0.6 : 1) * (p.walk ? 0.8 : 1); if (ai.sus < 1) { ai.lookAt = { x: p.x, z: p.z, t: 1.5 }; } else if (d < bd) { bd = d; best = 'player'; } }
          else if (d < bd) { bd = d; best = 'player'; }
        }
      }
    }
    if (!dog && !g.disguised) for (const o of g.actors) {
      if (!o.ally || o.dead || o.hidden || o.beh !== 'follow') continue;
      const d = see(o.x, o.y + 1.3, o.z, baseR * 0.8); if (d >= 0 && d < bd) { bd = d; best = o; }
    }
    ai.sus = Math.max(0, ai.sus - 0.04);
    if (!dog && ai.state !== 'combat') {
      ai.bodyT -= 0.25;
      if (ai.bodyT <= 0) {
        ai.bodyT = 1;
        for (const o of g.actors) {
          if (!o.dead || o.ally || o.seenBy || o.kind !== 'human') continue;
          if (Math.abs(o.x - a.x) > 18 || Math.abs(o.z - a.z) > 18) continue;
          if (see(o.x, o.y + 0.3, o.z, 18) < 0) continue;
          o.seenBy = a.uid; bark(g, a, B.body, true);
          if (g.disguised || g.mission.objectives.some(q => q.type === 'stealth')) g.raiseAlarm('body');
          else { ai.state = 'alert'; ai.lastSeen = { x: o.x, z: o.z }; ai.alertT = 14; ai.path = null; }
          break;
        }
      }
    }
    if (best) {
      if (ai.state === 'combat' && ai.target === best) { ai.seenT = 0; const q = posOf(g, best); ai.lastSeen = { x: q.x, z: q.z }; }
      else if (ai.state === 'combat' && ai.target && ai.target !== best) { const cur = posOf(g, ai.target); if (Math.hypot(cur.x - a.x, cur.z - a.z) > bd + 6 || ai.seenT > 1) acquire(g, a, best); }
      else if (ai.state !== 'surrender') acquire(g, a, best);
      return true;
    }
    return false;
  }
  function targetVisible(g, a) {
    const t = a.ai.target; if (!t) return false;
    if (t !== 'player' && (t.dead || t.hidden)) return false;
    if (t === 'player' && g.player.dead) return false;
    const q = posOf(g, t);
    return g.W.los(a.x, eyeOf(a), a.z, q.x, chestOf(g, t), q.z);
  }

  function pathTo(g, a, x, z, maxNodes = 3500) {
    const ai = a.ai;
    ai.path = g.W.findPath(a.x, a.z, x, z, maxNodes); ai.pathI = 0; ai.pathT = 0; ai.goal = { x, z };
    return !!ai.path;
  }
  function follow(g, a, speed, faceMove = true) {
    const ai = a.ai;
    if (!ai.path || ai.pathI >= ai.path.length) { a.tvx = 0; a.tvz = 0; return true; }
    const wp = ai.path[ai.pathI], dx = wp[0] - a.x, dz = wp[1] - a.z, d = Math.hypot(dx, dz);
    if (d < (ai.pathI === ai.path.length - 1 ? 0.5 : 0.9)) { ai.pathI++; if (ai.pathI >= ai.path.length) { a.tvx = 0; a.tvz = 0; return true; } return false; }
    const sp = speed * (a.limp > 0 ? 0.55 : 1);
    a.tvx = dx / d * sp; a.tvz = dz / d * sp;
    if (faceMove) turnTo(a, Math.atan2(dx, dz), 6);
    return false;
  }
  function turnTo(a, yaw, rate) { const d = wrapAng(yaw - a.yaw); a.yaw = wrapAng(a.yaw + clamp(d, -rate * DT, rate * DT)); return Math.abs(d); }
  function moveBody(g, a) {
    let sx = 0, sz = 0;
    for (const o of g.nearby) { if (o === a || o.dead || o.hidden) continue; const dx = a.x - o.x, dz = a.z - o.z, d2 = dx * dx + dz * dz, rr = (a.r + o.r) * 1.1; if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2); sx += dx / d * (rr - d) * 4; sz += dz / d * (rr - d) * 4; } }
    const p = g.player; { const dx = a.x - p.x, dz = a.z - p.z, d2 = dx * dx + dz * dz, rr = a.r + p.r; if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2); sx += dx / d * (rr - d) * 6; sz += dz / d * (rr - d) * 6; } }
    for (const t of g.tanks) { const dx = a.x - t.x, dz = a.z - t.z, d = Math.hypot(dx, dz), rr = a.r + t.r; if (d < rr && d > 1e-4) { a.x += dx / d * (rr - d); a.z += dz / d * (rr - d); } }
    const k = Math.min(1, DT * 9);
    a.vx += ((a.tvx || 0) + sx - a.vx) * k; a.vz += ((a.tvz || 0) + sz - a.vz) * k;
    g.W.move(a, DT);
    if (a.y < -60) { a.y = g.W.groundAt(a.home.x, a.home.z, 0.3); a.x = a.home.x; a.z = a.home.z; }
    const sp = Math.hypot(a.vx, a.vz);
    a.walk = (a.walk || 0) + sp * DT * (a.kind === 'dog' ? 2.6 : 2.9);
    const ai = a.ai; ai.stuckT = (ai.stuckT || 0) + DT;
    if (ai.stuckT > 1.2) { const lp = ai.lastPos; if (lp && Math.hypot(lp[0] - a.x, lp[1] - a.z) < 0.3 && Math.hypot(a.tvx || 0, a.tvz || 0) > 0.5) { ai.path = null; ai.blocked = (ai.blocked || 0) + 1; } else ai.blocked = 0; ai.lastPos = [a.x, a.z]; ai.stuckT = 0; }
  }

  function preferRange(a) { if (!a.weapon) return [1, 2]; const d = WP[a.weapon]; if (d.cat === 1) return [6, 14]; if (d.cat === 2) return [7, 20]; if (d.cat === 5) return [18, 45]; return [12, 34]; }
  function findCover(g, a, tx, ty, tz) {
    const W = g.W; let best = null, bs = -Infinity;
    const [rmin, rmax] = preferRange(a);
    for (const rad of [3, 6, 10]) for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 + rad, x = a.x + Math.cos(ang) * rad, z = a.z + Math.sin(ang) * rad;
      const c = W.cellOf(x, z); if (c < 0 || !W.navOK[c]) continue;
      const y = W.navH[c];
      if (Math.abs(y - a.y) > 2.5) continue;
      const dt = Math.hypot(tx - x, tz - z); if (dt < 4) continue;
      if (W.los(tx, ty, tz, x, y + 0.9, z)) continue;
      const peek = W.los(tx, ty, tz, x, y + 1.55, z);
      let s = -rad * 0.6 + (peek ? 6 : 0) - Math.abs(dt - (rmin + rmax) / 2) * 0.25;
      if (a.leash > 0 && Math.hypot(x - a.home.x, z - a.home.z) > a.leash) s -= 20;
      if (s > bs) { bs = s; best = { x, z, peek }; }
    }
    return best;
  }
  function humanShoot(g, a, dt) {
    const ai = a.ai; if (!a.weapon) return;
    const d = WP[a.weapon];
    ai.shootT -= dt;
    if (ai.reloadT > 0) { ai.reloadT -= dt; if (ai.reloadT <= 0) a.mag = d.mag; return; }
    if (a.mag <= 0) { ai.reloadT = d.reload * 1.2; bark(g, a, B.reload); g.emit({ t: 'sound', s: 'reload_npc', x: a.x, y: a.y + 1.3, z: a.z, vol: 0.7 }); return; }
    if (ai.shootT > 0 || ai.reactT > 0) return;
    const t = ai.target, q = posOf(g, t), ty = chestOf(g, t);
    const ex = a.x, ey = eyeOf(a) - 0.1, ez = a.z;
    const dx = q.x - ex, dy = ty - ey, dz = q.z - ez, dist = Math.hypot(dx, dy, dz);
    if (Math.abs(wrapAng(Math.atan2(dx, dz) - a.yaw)) > 0.35) return;
    const tMove = t === 'player' ? Math.hypot(g.player.vx, g.player.vz) : Math.hypot(t.vx, t.vz);
    const errDeg = ((1.3 - a.acc) * 3.2 / g.sk.acc) + d.spread * 0.4 + (tMove > 2 ? 1.3 : 0) + (dist > 30 ? (dist - 30) * 0.05 : 0) + (Math.hypot(a.vx, a.vz) > 1.5 ? 1.5 : 0) + ai.firstShot * 2.4 + (t === 'player' && g.player.crouch > 0.5 ? 0.6 : 0);
    ai.firstShot = Math.max(0, ai.firstShot - 0.35);
    const dir = g.coneDir([dx / dist, dy / dist, dz / dist], errDeg * Math.PI / 180);
    if (d.proj) {
      g.projs.push({ kind: 'rocket', x: ex + dir[0], y: ey + dir[1], z: ez + dir[2], vx: dir[0] * 34, vy: dir[1] * 34, vz: dir[2] * 34, t: 0, fuse: 4, owner: a, dmg: d.dmg * 0.8, radius: d.radius, straight: true });
      a.mag--; ai.shootT = 4 + g.rng() * 3;
    } else {
      g.bullet(a, ex, ey, ez, dir, d.dmg * 0.42, true);
      a.mag--;
      if (d.auto) { ai.burst--; if (ai.burst <= 0) { ai.burst = (a.tpl === 'mg' ? 6 : 2) + Math.floor(g.rng() * 4); ai.shootT = (a.tpl === 'mg' ? 0.6 : 0.5) + g.rng() * 0.8; } else ai.shootT = 60 / d.rpm; }
      else ai.shootT = Math.max(60 / d.rpm, (a.beh === 'sniper' ? 2.4 : 0.8) + g.rng() * 0.8);
    }
    g.emit({ t: 'npcfire', uid: a.uid, w: a.weapon, x: ex + Math.sin(a.yaw) * 0.6, y: ey, z: ez + Math.cos(a.yaw) * 0.6 });
    g.emit({ t: 'sound', s: d.sound, x: ex, y: ey, z: ez, vol: 1 });
    a.recoil = 1;
    if (!ai.noiseT || ai.noiseT <= 0) { ai.noiseT = 1; for (const o of g.actors) { if (o === a || o.dead || o.hidden || o.ally || o.ai.state !== 'idle') continue; if (Math.hypot(o.x - a.x, o.z - a.z) < 60) { o.ai.state = 'alert'; o.ai.lastSeen = { x: q.x, z: q.z }; o.ai.alertT = 14; o.ai.path = null; } } }
  }
  function grenadeReact(g, a) {
    const ai = a.ai;
    for (const pr of g.projs) {
      if (pr.owner !== 'player' || pr.straight || pr.dead) continue;
      const d = Math.hypot(pr.x - a.x, pr.z - a.z); if (d > 5 || Math.abs(pr.y - a.y) > 2) continue;
      if (ai.nadeRx !== pr) {
        ai.nadeRx = pr;
        const chance = [0.2, 0.35, 0.5][g.skill] || 0.35;
        ai.throwback = pr.fuse > 1.6 && a.weapon && a.beh !== 'mg' && a.beh !== 'sniper' && g.rng() < chance;
        bark(g, a, B.grenade, true);
      }
      if (ai.throwback && pr.fuse > 0.9) {
        if (d < 1.1) {
          pr.dead = true; const p = g.player;
          g.npcThrow(a, p.x + (g.rng() - 0.5) * 2, p.z + (g.rng() - 0.5) * 2, pr.kind === 'stick' ? 'stick' : 'grenade', Math.max(0.9, pr.fuse - 0.6));
          bark(g, a, B.throwback, true); a.throwT = 0.5; ai.throwback = false; return true;
        }
        const ang = Math.atan2(pr.x - a.x, pr.z - a.z); a.tvx = Math.sin(ang) * 4.5; a.tvz = Math.cos(ang) * 4.5; turnTo(a, ang, 10); ai.path = null; return true;
      }
      const ang = Math.atan2(a.x - pr.x, a.z - pr.z); a.tvx = Math.sin(ang) * 5; a.tvz = Math.cos(ang) * 5; turnTo(a, ang, 8); ai.path = null; a.crouch = 0; return true;
    }
    return false;
  }
  function humanCombat(g, a, dt) {
    const ai = a.ai, t = ai.target;
    if (!t || (t !== 'player' && (t.dead || t.hidden)) || (t === 'player' && g.player.dead)) { ai.state = 'alert'; ai.alertT = 8; ai.target = null; a.crouch = 0; return; }
    if (t === 'player' && g.disguised) { ai.state = 'idle'; ai.target = null; return; }
    ai.combatT += dt;
    if (ai.combatT > 4 && !g.alarm && t === 'player' && g.def.alarms.length) g.raiseAlarm('combat');
    const vis = targetVisible(g, a), q = posOf(g, t);
    if (vis) { ai.seenT = 0; ai.lastSeen = { x: q.x, z: q.z }; } else ai.seenT += dt;
    ai.reactT = Math.max(0, ai.reactT - dt);
    const dist = Math.hypot(q.x - a.x, q.z - a.z), [rmin, rmax] = preferRange(a);
    const lx = vis ? q.x : ai.lastSeen.x, lz = vis ? q.z : ai.lastSeen.z;
    ai.decT -= dt; ai.coverT -= dt; ai.nadeT -= dt;
    if (a.throwT > 0) { a.throwT -= dt; a.tvx = a.tvz = 0; turnTo(a, Math.atan2(lx - a.x, lz - a.z), 6); return; }
    if (grenadeReact(g, a)) return;
    const stay = a.beh === 'mg' || a.beh === 'sniper' || a.leash <= 0;
    if (ai.dodgeT > 0 && !stay) {
      ai.dodgeT -= dt; const rx = -Math.cos(a.yaw), rz = Math.sin(a.yaw), sx = a.x + rx * ai.strafe * 2, sz = a.z + rz * ai.strafe * 2;
      if (g.W.walkableAt(sx, sz)) { a.tvx = rx * ai.strafe * 5; a.tvz = rz * ai.strafe * 5; a.crouch = 0.8; } else ai.strafe = -ai.strafe;
      turnTo(a, Math.atan2(lx - a.x, lz - a.z), 5); return;
    }
    if (ai.decT <= 0 && !stay) {
      ai.decT = 0.5 + g.rng() * 0.4;
      const leashOK = (x, z) => Math.hypot(x - a.home.x, z - a.home.z) < a.leash + 10;
      if (ai.seenT > 14) { ai.state = 'alert'; ai.alertT = 14; bark(g, a, B.lost); a.crouch = 0; ai.path = null; return; }
      if (!vis && ai.seenT > 2.5) {
        const dl = Math.hypot(ai.lastSeen.x - a.x, ai.lastSeen.z - a.z), nade = D.HUMANS[a.tpl].nade || 0;
        if (ai.nadeT <= 0 && dl > 8 && dl < 26 && t === 'player' && g.rng() < nade) { a.throwT = 0.6; g.npcThrow(a, ai.lastSeen.x, ai.lastSeen.z, 'stick'); bark(g, a, B.grenade, true); ai.nadeT = 14 + g.rng() * 8; }
        else if (leashOK(ai.lastSeen.x, ai.lastSeen.z)) { pathTo(g, a, ai.lastSeen.x + (g.rng() - 0.5) * 3, ai.lastSeen.z + (g.rng() - 0.5) * 3); ai.cover = null; a.crouch = 0; }
      } else if (vis) {
        const needCover = !ai.cover || ai.coverT <= 0 || (ai.hurtT > 0 && g.rng() < 0.5);
        if (needCover && dist < rmax * 1.4) {
          const c = findCover(g, a, q.x, (t === 'player' ? g.player.y : t.y) + 1.5, q.z);
          if (c) { ai.cover = c; ai.coverT = 5 + g.rng() * 5; pathTo(g, a, c.x, c.z, 1500); }
          else { ai.cover = null; ai.coverT = 2; }
        }
        if (!ai.cover) {
          if (dist > rmax && leashOK(q.x, q.z)) pathTo(g, a, q.x, q.z, 2500);
          else if (dist < rmin * 0.6) { const ang = Math.atan2(a.x - q.x, a.z - q.z), bx = a.x + Math.sin(ang) * 5, bz = a.z + Math.cos(ang) * 5; if (g.W.walkableAt(bx, bz)) pathTo(g, a, bx, bz, 800); }
          else { ai.path = null; ai.strafeT -= 0.5; if (ai.strafeT <= 0) { ai.strafe = -ai.strafe; ai.strafeT = 1 + g.rng() * 2; } }
        }
        const nade = D.HUMANS[a.tpl].nade || 0;
        if (ai.nadeT <= 0 && dist > 9 && dist < 25 && g.rng() < 0.25 * nade) { a.throwT = 0.6; g.npcThrow(a, q.x, q.z, 'stick'); bark(g, a, B.grenade, true); ai.nadeT = 16 + g.rng() * 10; }
        if (t === 'player' && g.player.aim > 0.5 && dist < 30 && g.rng() < 0.08) { const f = g.forward(), vx = a.x - g.player.x, vz = a.z - g.player.z, vd = Math.hypot(vx, vz) || 1; if ((f[0] * vx + f[2] * vz) / vd > 0.97) ai.dodgeT = 0.45; }
      }
    }
    if (stay) { a.tvx = a.tvz = 0; ai.path = null; if (a.beh === 'mg') a.crouch = 0.35; }
    else {
      const arrived = follow(g, a, 4.2, false);
      if (!ai.path && !ai.cover && vis && ai.strafe) { const rx = -Math.cos(a.yaw), rz = Math.sin(a.yaw), sx = a.x + rx * ai.strafe * 1.5, sz = a.z + rz * ai.strafe * 1.5; if (g.W.walkableAt(sx, sz)) { a.tvx = rx * ai.strafe * 1.8; a.tvz = rz * ai.strafe * 1.8; } else { ai.strafe = -ai.strafe; a.tvx = a.tvz = 0; } }
      if (ai.cover && arrived) {
        ai.peekT = (ai.peekT || 0) - dt;
        if (ai.peekT <= 0) { ai.peek = !ai.peek; ai.peekT = ai.peek ? 1.8 + g.rng() * 2.2 : 1.0 + g.rng() * 1.4; }
        if (ai.reloadT > 0) ai.peek = false;
        a.crouch = ai.peek ? (ai.cover.peek ? 0 : 1) : 1;
      } else a.crouch = Math.max(0, a.crouch - dt * 3);
    }
    const yawTo = Math.atan2(lx - a.x, lz - a.z);
    if (a.beh === 'mg') { const lim = wrapAng(yawTo - a.home.yaw); turnTo(a, a.home.yaw + clamp(lim, -1.2, 1.2), 3); }
    else turnTo(a, yawTo, 5);
    if (vis && (!ai.cover || ai.peek || a.beh === 'mg' || a.beh === 'sniper' || !ai.path)) humanShoot(g, a, dt);
    else if (ai.reloadT > 0) humanShoot(g, a, dt);
  }
  function humanIdle(g, a, dt) {
    const ai = a.ai, p = g.player;
    const toHome = Math.hypot(a.x - a.home.x, a.z - a.home.z);
    ai.inspCD = Math.max(0, (ai.inspCD || 0) - dt);
    switch (a.beh) {
      case 'patrol': {
        const pts = g.def.paths[a.pathId]; if (!pts) { a.beh = 'guard'; break; }
        if (ai.waitT > 0) { ai.waitT -= dt; a.tvx = a.tvz = 0; break; }
        if (!ai.path) pathTo(g, a, pts[ai.patrolI % pts.length][0], pts[ai.patrolI % pts.length][1], 2500);
        if (follow(g, a, 1.5)) { ai.patrolI++; ai.path = null; ai.waitT = 1 + g.rng() * 3; }
        break;
      }
      case 'wander': {
        ai.wanderT -= dt;
        if (ai.wanderT <= 0) { ai.wanderT = 7 + g.rng() * 9; const ang = g.rng() * 6.28, r = g.rng() * (a.leash || 8); pathTo(g, a, a.home.x + Math.cos(ang) * r, a.home.z + Math.sin(ang) * r, 1200); }
        if (follow(g, a, 1.3)) ai.path = null;
        break;
      }
      case 'prisoner': a.tvx = a.tvz = 0; a.sitting = !a.freed ? 1 : 0; turnTo(a, a.home.yaw, 2); break;
      case 'follow': {
        a.sitting = 0;
        const d = Math.hypot(a.x - p.x, a.z - p.z);
        if (d > 4) { if (!ai.path || ai.pathT <= 0) { pathTo(g, a, p.x, p.z, 3000); ai.pathT = 1.2; } ai.pathT -= dt; follow(g, a, d > 10 ? 4.6 : 3); }
        else { a.tvx = a.tvz = 0; ai.path = null; turnTo(a, Math.atan2(p.x - a.x, p.z - a.z), 3); }
        allyShoot(g, a, dt);
        break;
      }
      case 'flee': {
        a.sitting = 0;
        const z = g.def.zones.find(q => q.id === 'truck') || g.def.zones[0];
        if (!z) break;
        const tx = (z.x0 + z.x1) / 2, tz = (z.z0 + z.z1) / 2;
        if (!ai.path || ai.pathT <= 0) { pathTo(g, a, tx, tz, 9000); ai.pathT = 4; }
        ai.pathT -= dt; follow(g, a, 3.8);
        if (g.inRect(z, a.x, a.z)) { a.hidden = true; a.escaped = true; g.emit({ t: 'escaped', id: a.id }); }
        break;
      }
      default: {
        if (a.tpl === 'worker' && g.alarm) { ai.state = 'flee'; break; }
        if (toHome > 1.2 && a.leash > 0) { if (!ai.path || ai.pathT <= 0) { pathTo(g, a, a.home.x, a.home.z, 1500); ai.pathT = 3; } ai.pathT -= dt; follow(g, a, 1.6); }
        else {
          a.tvx = a.tvz = 0; ai.path = null;
          let yaw = a.home.yaw;
          if (ai.lookAt && ai.lookAt.t > 0) { yaw = Math.atan2(ai.lookAt.x - a.x, ai.lookAt.z - a.z); ai.lookAt.t -= dt; }
          else if (a.beh !== 'mg' && a.beh !== 'sniper') yaw += Math.sin(g.realT * 0.3 + a.uid) * 0.6;
          turnTo(a, yaw, 2.5);
        }
      }
    }
  }
  function allyShoot(g, a, dt) {
    const ai = a.ai; if (!a.weapon) return;
    ai.allyT = (ai.allyT || 0) - dt;
    if (ai.allyT <= 0) {
      ai.allyT = 0.5; ai.target = null;
      let bd = 30;
      for (const o of g.actors) { if (o.dead || o.hidden || o.ally || o.ai.state === 'surrender' || o.tpl === 'worker') continue; const d = Math.hypot(o.x - a.x, o.z - a.z); if (d < bd && g.W.los(a.x, eyeOf(a), a.z, o.x, o.y + 1.2, o.z)) { bd = d; ai.target = o; } }
    }
    const t = ai.target; if (!t || t.dead) return;
    turnTo(a, Math.atan2(t.x - a.x, t.z - a.z), 6); a.aimT = 0.5;
    humanShoot(g, a, dt);
  }
  function humanAlert(g, a, dt) {
    const ai = a.ai; ai.alertT -= dt;
    if (ai.alertT <= 0 || !ai.lastSeen) { ai.state = 'idle'; ai.path = null; ai.sus = 0; a.crouch = 0; return; }
    if (grenadeReact(g, a)) return;
    const d = Math.hypot(ai.lastSeen.x - a.x, ai.lastSeen.z - a.z);
    if (a.leash <= 0) { turnTo(a, Math.atan2(ai.lastSeen.x - a.x, ai.lastSeen.z - a.z), 3); a.tvx = a.tvz = 0; return; }
    if (d > 3 && Math.hypot(ai.lastSeen.x - a.home.x, ai.lastSeen.z - a.home.z) < a.leash + 40) { if (!ai.path) pathTo(g, a, ai.lastSeen.x, ai.lastSeen.z, 3000); follow(g, a, g.alarm ? 3.8 : 2.4); a.crouch = 0.4; }
    else { a.tvx = a.tvz = 0; turnTo(a, a.yaw + Math.sin(g.realT * 0.8 + a.uid) * 1.5, 1.5); }
  }
  function humanInspect(g, a, dt) {
    const ai = a.ai, p = g.player;
    if (!g.disguised) { ai.state = 'idle'; return; }
    const d = Math.hypot(p.x - a.x, p.z - a.z);
    turnTo(a, Math.atan2(p.x - a.x, p.z - a.z), 4);
    if (!ai.asked) {
      if (d > 2.4) { if (!ai.path || ai.pathT <= 0) { pathTo(g, a, p.x, p.z, 2000); ai.pathT = 1; } ai.pathT -= dt; follow(g, a, 2.2, false); ai.inspT += dt; if (ai.inspT > 25) { ai.state = 'idle'; ai.inspCD = 20; } return; }
      ai.asked = true; ai.inspT = 7; a.tvx = a.tvz = 0; ai.path = null;
      g.emit({ t: 'bark', uid: a.uid, text: g.str('papersAsk'), x: a.x, y: a.y + 2, z: a.z, voice: 0, force: true });
      g.emit({ t: 'papersAsk', uid: a.uid });
      return;
    }
    a.tvx = a.tvz = 0;
    ai.inspT -= dt;
    if (d > 9) ai.inspT -= dt * 2;
    if (ai.inspT <= 0) { g.emit({ t: 'bark', uid: a.uid, text: g.str('papersFail'), x: a.x, y: a.y + 2, z: a.z, voice: 0, force: true }); g.raiseAlarm('papers'); acquire(g, a, 'player', true); }
  }
  S.papersShown = function (g, a) {
    const ai = a.ai; a.cleared = true; ai.state = 'idle'; ai.asked = false; ai.inspCD = 60; ai.path = null;
    g.emit({ t: 'bark', uid: a.uid, text: g.str('papersOk'), x: a.x, y: a.y + 2, z: a.z, voice: 0, force: true });
    g.emit({ t: 'sound', s: 'paper' });
  };
  function humanFlee(g, a, dt) {
    const ai = a.ai, p = g.player;
    if (!ai.path || ai.pathT <= 0) { const ang = Math.atan2(a.x - p.x, a.z - p.z) + (g.rng() - 0.5); pathTo(g, a, a.x + Math.sin(ang) * 14, a.z + Math.cos(ang) * 14, 1200); ai.pathT = 3; }
    ai.pathT -= dt;
    if (follow(g, a, 3.6)) { a.tvx = a.tvz = 0; a.surrender = 1; }
  }
  function humanSurrender(g, a, dt) {
    const ai = a.ai, p = g.player;
    a.tvx = a.tvz = 0; ai.path = ai.path && ai.retake ? ai.path : null;
    turnTo(a, Math.atan2(p.x - a.x, p.z - a.z), 3);
    ai.surT -= dt;
    if (ai.retake) {
      a.surrender = Math.max(0, a.surrender - dt * 3);
      const it = g.pickups.find(i => i.dropped === a.uid && !i.taken);
      if (!it) { ai.retake = false; ai.surT = 8; return; }
      if (follow(g, a, 3.5)) { it.taken = true; a.weapon = it.id; a.mag = WP[it.id].mag; ai.retake = false; a.surrender = 0; ai.state = 'idle'; acquire(g, a, 'player', true); }
      return;
    }
    a.surrender = Math.min(1, a.surrender + dt * 3);
    if (ai.surT <= 0) {
      ai.surT = 3;
      const f = g.forward(), vx = a.x - p.x, vz = a.z - p.z, vd = Math.hypot(vx, vz) || 1, looking = (f[0] * vx + f[2] * vz) / vd > 0.9 && vd < 25;
      const it = g.pickups.find(i => i.dropped === a.uid && !i.taken && Math.hypot(i.x - a.x, i.z - a.z) < 8);
      if (!looking && it && g.rng() < 0.5) { ai.retake = true; pathTo(g, a, it.x, it.z, 600); }
    }
  }
  function updateHuman(g, a, dt) {
    const ai = a.ai;
    ai.barkT -= dt; ai.hurtT = Math.max(0, (ai.hurtT || 0) - dt); ai.noiseT = (ai.noiseT || 0) - dt; a.recoil = Math.max(0, (a.recoil || 0) - dt * 6); a.flash = Math.max(0, (a.flash || 0) - dt); a.flinch = Math.max(0, (a.flinch || 0) - dt * 4); a.limp = Math.max(0, (a.limp || 0) - dt);
    if (ai.state === 'surrender') { humanSurrender(g, a, dt); return; }
    if (a.ally) { a.sitting = a.beh === 'prisoner' && !a.freed ? 1 : 0; humanIdle(g, a, dt); return; }
    ai.percT -= dt;
    if (ai.percT <= 0) { ai.percT = 0.25; perceive(g, a); }
    if (ai.state === 'combat') { if (!a.weapon) { surrender(g, a); return; } humanCombat(g, a, dt); }
    else if (ai.state === 'alert') humanAlert(g, a, dt);
    else if (ai.state === 'inspect') humanInspect(g, a, dt);
    else if (ai.state === 'flee') humanFlee(g, a, dt);
    else humanIdle(g, a, dt);
    if (ai.state !== 'combat') { ai.firstShot = 1; if (ai.reloadT > 0) { ai.reloadT -= dt; if (ai.reloadT <= 0 && a.weapon) a.mag = WP[a.weapon].mag; } }
  }

  function updateDog(g, a, dt) {
    const ai = a.ai, DG = D.DOG, p = g.player;
    a.flash = Math.max(0, (a.flash || 0) - dt); ai.attackT = (ai.attackT || 0) - dt; a.biteT = Math.max(0, (a.biteT || 0) - dt * 3);
    ai.percT -= dt;
    if (ai.percT <= 0) { ai.percT = 0.3; perceive(g, a); }
    if (ai.state === 'combat') {
      const t = ai.target;
      if (!t || (t !== 'player' && (t.dead || t.hidden)) || (t === 'player' && (p.dead || g.disguised))) { ai.state = 'idle'; ai.target = null; return; }
      const q = posOf(g, t), dx = q.x - a.x, dz = q.z - a.z, d = Math.hypot(dx, dz), ang = Math.atan2(dx, dz);
      const vis = g.W.los(a.x, eyeOf(a), a.z, q.x, chestOf(g, t), q.z);
      if (vis) ai.seenT = 0; else ai.seenT += dt;
      if (ai.seenT > 12) { ai.state = 'idle'; ai.target = null; ai.path = null; return; }
      if (d < 1.4 && ai.attackT <= 0 && Math.abs(wrapAng(ang - a.yaw)) < 0.9) {
        ai.attackT = 1.2 + g.rng() * 0.5; a.biteT = 1;
        if (t === 'player') g.hurtPlayer(DG.dmg, 'bite', a); else S.damageActor(g, t, DG.dmg, 'bite', a, [dx / d, 0, dz / d], 0, 'torso');
        g.emit({ t: 'sound', s: 'dog_attack', x: a.x, y: a.y + 0.5, z: a.z });
      }
      const direct = vis && d < 25 && g.W.walkLine(g.W.cellOf(a.x, a.z), g.W.cellOf(q.x, q.z));
      if (direct || g.W.cellOf(a.x, a.z) < 0) { a.tvx = dx / (d || 1) * DG.speed * (d < 1.1 ? 0 : 1); a.tvz = dz / (d || 1) * DG.speed * (d < 1.1 ? 0 : 1); ai.path = null; turnTo(a, ang, 9); }
      else { ai.pathT -= dt; if (!ai.path || ai.pathT <= 0) { pathTo(g, a, q.x, q.z, 2500); ai.pathT = 0.8; } follow(g, a, DG.speed); }
      a.running = 1;
      ai.growlT = (ai.growlT || 0) - dt; if (ai.growlT <= 0) { ai.growlT = 1.5 + g.rng() * 2; g.emit({ t: 'sound', s: 'dog_bark', x: a.x, y: a.y + 0.5, z: a.z, vol: 0.9 }); }
      return;
    }
    a.running = 0;
    if (ai.state === 'alert') {
      ai.alertT -= dt;
      if (ai.alertT <= 0 || !ai.lastSeen) { ai.state = 'idle'; ai.path = null; return; }
      if (!ai.path) pathTo(g, a, ai.lastSeen.x, ai.lastSeen.z, 2000);
      if (follow(g, a, 3.5)) ai.alertT = Math.min(ai.alertT, 2);
      return;
    }
    humanIdle(g, a, dt);
    if (a.beh === 'patrol') { a.tvx *= 1.3; a.tvz *= 1.3; }
  }

  S.damageTank = function (g, t, dmg, src) {
    if (t.dead) return;
    t.hp -= dmg; t.flash = 0.2;
    g.emit({ t: 'sound', s: 'tankhit', x: t.x, y: t.y + 1.5, z: t.z });
    if (t.hp <= 0) {
      t.dead = true; t.deadT = 0;
      g.emit({ t: 'explosion', x: t.x, y: t.y + 1.8, z: t.z, r: 9 }); g.emit({ t: 'sound', s: 'explosion', x: t.x, y: t.y + 1.5, z: t.z, vol: 2 });
      g.emit({ t: 'tankDown', id: t.id }); g.msg(g.str('tankDown'), '#f0d080');
      if (src === 'player' || (src && src.owner === 'player')) g.stats.kills++;
    }
  };
  S.updateTanks = function (g) {
    const p = g.player, TK = D.TANK, dt = DT;
    for (const t of g.tanks) {
      t.flash = Math.max(0, (t.flash || 0) - dt);
      if (t.dead) { t.deadT += dt; continue; }
      const dx = p.x - t.x, dz = p.z - t.z, d = Math.hypot(dx, dz);
      const vis = !p.dead && d < TK.range && g.W.los(t.x, t.y + 2.6, t.z, p.x, p.y + 1.2, p.z);
      t.fireT -= dt; t.mgT -= dt;
      let moving = false;
      const pts = t.pathId ? g.def.paths[t.pathId] : null;
      if (pts && !(vis && d < 40)) {
        const wp = pts[t.pathI % pts.length], wx = wp[0] - t.x, wz = wp[1] - t.z, wd = Math.hypot(wx, wz);
        if (wd < 2) { t.pathI++; t.wait = 2; }
        else if (t.wait > 0) t.wait -= dt;
        else {
          const want = Math.atan2(wx, wz), diff = wrapAng(want - t.yaw);
          t.yaw = wrapAng(t.yaw + clamp(diff, -TK.turn * dt, TK.turn * dt));
          if (Math.abs(diff) < 0.5) { const sp = 2.6; t.x += Math.sin(t.yaw) * sp * dt; t.z += Math.cos(t.yaw) * sp * dt; t.y = g.W.terrainAt(t.x, t.z); moving = true; }
        }
      }
      t.track = (t.track || 0) + (moving ? dt * 2.6 : 0);
      const aimYaw = vis ? wrapAng(Math.atan2(dx, dz) - t.yaw) : Math.sin(g.realT * 0.2) * 0.6;
      const diffT = wrapAng(aimYaw - t.turret);
      t.turret = wrapAng(t.turret + clamp(diffT, -0.6 * dt, 0.6 * dt));
      t.elev = clamp(Math.atan2(p.y + 1 - (t.y + 2.2), d), -0.1, 0.25);
      if (vis && Math.abs(diffT) < 0.06 && t.fireT <= 0 && d > 8) {
        t.fireT = TK.reload * (1.2 - g.skill * 0.15);
        const yaw = t.yaw + t.turret, mx = t.x + Math.sin(yaw) * 5.6, mz = t.z + Math.cos(yaw) * 5.6, my = t.y + 2.2;
        const err = (g.rng() - 0.5) * 0.06, ty = p.y + 0.8, ddx = p.x - mx, ddz = p.z - mz, dd = Math.hypot(ddx, ddz);
        const vx = Math.sin(Math.atan2(ddx, ddz) + err), vz = Math.cos(Math.atan2(ddx, ddz) + err), vy = (ty - my) / dd;
        const l = Math.hypot(vx, vy, vz);
        g.projs.push({ kind: 'shell', x: mx, y: my, z: mz, vx: vx / l * 60, vy: vy / l * 60, vz: vz / l * 60, t: 0, fuse: 3, owner: t, dmg: TK.shell, radius: TK.radius, straight: true });
        g.emit({ t: 'tankfire', x: mx, y: my, z: mz }); g.emit({ t: 'sound', s: 'cannon', x: mx, y: my, z: mz, vol: 1.8 });
        g.noise(t.x, t.z, 80, 'noise');
      }
      if (vis && d < 38 && t.mgT <= 0) {
        if (t.burst <= 0) { t.burst = 8; t.mgT = 1.2 + g.rng(); }
        else {
          t.burst--; t.mgT = 0.07;
          const yaw = t.yaw, ox = t.x + Math.sin(yaw) * 3.1 - Math.cos(yaw) * 0.6, oz = t.z + Math.cos(yaw) * 3.1 + Math.sin(yaw) * 0.6, oy = t.y + 1.5;
          const ddx = p.x - ox, ddy = p.y + 1.2 - oy, ddz = p.z - oz, dl = Math.hypot(ddx, ddy, ddz);
          const hullAng = Math.abs(wrapAng(Math.atan2(ddx, ddz) - yaw));
          if (hullAng < 0.7) { g.bullet({ x: ox, z: oz, uid: -1 }, ox, oy, oz, g.coneDir([ddx / dl, ddy / dl, ddz / dl], 3.2 * Math.PI / 180), 9, true); g.emit({ t: 'sound', s: 'mg42', x: ox, y: oy, z: oz, vol: 0.8 }); }
        }
      }
      t.anim = { turret: t.turret, elev: t.elev };
    }
  };

  S.updateActors = function (g) {
    const p = g.player, dt = DT;
    for (const a of g.actors) {
      if (a.hidden) continue;
      if (a.dead) {
        a.deadT += dt;
        if (a.deadT < 3) { a.tvx = a.tvz = 0; a.vx *= 0.9; a.vz *= 0.9; g.W.move(a, dt); }
        continue;
      }
      const far = Math.abs(a.x - p.x) > 150 || Math.abs(a.z - p.z) > 150;
      if (far && a.ai.state === 'idle' && a.beh !== 'follow' && a.beh !== 'flee') { a.ai.farT = (a.ai.farT || 0) - dt; if (a.ai.farT > 0) continue; a.ai.farT = 0.5; }
      g.nearby = g.actors.filter(o => o !== a && Math.abs(o.x - a.x) < 3 && Math.abs(o.z - a.z) < 3);
      if (a.kind === 'human') updateHuman(g, a, dt); else updateDog(g, a, dt);
      moveBody(g, a);
      const sp = Math.hypot(a.vx, a.vz);
      a.anim = {
        walk: a.walk || 0, move: clamp(sp / (a.kind === 'dog' ? 2.2 : 1.6), 0, 1), run: clamp((sp - 2.2) / 2, 0, 1), crouch: a.crouch, aim: a.ai.state === 'combat' || a.aimT > 0 ? 1 : 0,
        t: g.realT + (a.uid % 97), recoil: a.recoil || 0, attack: a.biteT || 0, leap: 0, look: 0, sit: a.sitting ? 1 : 0, surrender: a.surrender || 0, flinch: a.flinch || 0,
        throwing: a.throwT > 0 ? clamp(a.throwT / 0.6, 0, 1) : 0, behind: a.beh === 'prisoner' && !a.freed && a.tpl === 'pow', papers: a.ai.state === 'inspect' && a.ai.asked
      };
      a.aimT = Math.max(0, (a.aimT || 0) - dt);
    }
    g.nearby = [];
  };
  S.updateHuman = updateHuman; S.updateDog = updateDog;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Moh98 = globalThis.Moh98 || {});
