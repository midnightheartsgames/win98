(function (S) {
  'use strict';
  const { clamp, wrapAng } = S;
  const D = S.DATA;
  const DT = 1 / 60, PI = Math.PI;

  function spawnFoe(g, type, x, z, o = {}) {
    const d = D.FOES[type] || D.BOSSES[type];
    const y = o.y != null ? o.y : g.W.groundAt(x, z, 0.4, 30);
    const hpMul = g.diff.hpMul;
    const e = {
      team: 'foe', type, def: d, m: S.model(d.model), x, y: isFinite(y) ? y : 0, z, vx: 0, vy: 0, vz: 0, face: Math.atan2(g.player.x - x, g.player.z - z),
      r: d.r, h: d.h, hp: d.hp * hpMul, maxHp: d.hp * hpMul, st: 'spawn', stT: 0, spawnT: o.instant ? 0 : 0.9, ground: true, cd: 1 + g.rng() * 1.5, poiseDmg: 0, t: g.rng() * 10,
      anim: null, animU: 0, phase: 0, moveK: 0, id: (g.foeId = (g.foeId || 0) + 1), heavy: d.heavy || 0, flash: 0, stun: 0, strafe: g.rng() < 0.5 ? 1 : -1, hitY: d.hitY
    };
    if (d.cloak) e.cloak = d.cloak * hpMul;
    if (d.fly) { e.hover = d.fly; e.y += d.fly; }
    if (o.instant) e.st = 'idle';
    const ai = AI[type];
    if (ai) { for (const k of ['busterable', 'afterBuster', 'onSnatch', 'onGrab']) if (ai[k]) e[k] = ai[k]; if (ai.init) ai.init(g, e); }
    g.foes.push(e);
    if (!o.instant) { g.ev({ t: 'spawnfx', x, y: e.y, z, big: d.h > 2.5 }); g.sfx('spawn', x, e.y, z); }
    return e;
  }

  function token(g, e) {
    if (g.tokens.has(e.id)) return true;
    const max = 1 + (g.diff.aggr > 1.2 ? 1 : 0) + (g.foes.filter(f => !f.dead).length > 4 ? 1 : 0);
    if (g.tokens.size >= max) return false;
    g.tokens.add(e.id); return true;
  }
  const release = (g, e) => g.tokens.delete(e.id);

  function foePhysics(g, e, grav = 1) {
    e.vy -= 26 * grav * DT; if (e.vy < -30) e.vy = -30;
    e.x += e.vx * DT; e.z += e.vz * DT;
    g.W.collide(e);
    for (const o of g.foes) {
      if (o === e || o.dead || o.hidden || o.st === 'grabbed' || e.st === 'grabbed' || o.fly || e.def.fly) continue;
      const dx = e.x - o.x, dz = e.z - o.z, d = Math.hypot(dx, dz), m = e.r + o.r;
      if (d < m && d > 0.001 && Math.abs(e.y - o.y) < 2) { const k = (m - d) / d * (o.boss ? 1 : 0.5); e.x += dx * k; e.z += dz * k; }
    }
    const p = g.player;
    if (!e.def.fly && !e.hidden) {
      const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz), m = e.r + p.r;
      if (d < m && d > 0.001 && Math.abs(e.y - p.y) < 1.6 && p.st !== 'hellbound') { const k = (m - d) / d; if (e.boss || e.heavy >= 2) { p.x -= dx * k; p.z -= dz * k; } else { e.x += dx * k * 0.6; e.z += dz * k * 0.6; p.x -= dx * k * 0.4; p.z -= dz * k * 0.4; } }
    }
    const gy = g.W.groundAt(e.x, e.z, e.r * 0.8, e.y + 0.5), was = e.ground;
    e.y += e.vy * DT;
    const floor = gy + (e.hover && !e.dead && e.st !== 'down' ? e.hover : 0);
    if (e.vy <= 0 && e.y <= floor + 0.02) { e.y = floor; e.vy = 0; e.ground = true; }
    else if (was && e.vy <= 0 && floor > e.y - 0.5 && floor <= e.y + 0.02) { e.y = floor; e.vy = 0; e.ground = true; }
    else if (e.y > floor + 0.05) e.ground = false;
    if (e.y < g.W.voidY && !e.boss) { e.hp = 0; kill(g, e, {}); e.gone = true; }
  }

  function strike(g, e, a) {
    const p = g.player;
    const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz) - p.r;
    if (d > a.reach) return false;
    if (a.arc < 360 && d > 0.4) { const ang = Math.abs(wrapAng(Math.atan2(dx, dz) - e.face)); if (ang > a.arc * PI / 360) return false; }
    const lo = e.y + (a.lo != null ? a.lo : -0.6), hi = e.y + (a.hi != null ? a.hi : e.h + 0.4);
    if (p.y + 1.6 < lo || p.y > hi) return false;
    return S.hurtPlayer(g, a.dmg * (a.mul || 1), e, a);
  }

  function hitFoe(g, e, h) {
    if (e.dead || e.spawnT > 0 || e.invul > 0 || e.hidden) return false;
    const ai = AI[e.type];
    if (ai && ai.guard && !h.raw && !h.buster) {
      const r = ai.guard(g, e, h);
      if (r === 'block') { g.ev({ t: 'hit', x: e.x, y: e.y + 1.3, z: e.z, kind: 'block' }); g.sfx('clang', e.x, e.y + 1, e.z); g.hitstop = Math.max(g.hitstop, 0.04); return false; }
      if (r === 'immune') { g.ev({ t: 'hit', x: e.x, y: e.y + 1.3, z: e.z, kind: 'ghost' }); return false; }
    }
    let dmg = h.dmg;
    if (ai && ai.dmgMul) dmg *= ai.dmgMul(g, e, h);
    e.hp -= dmg; e.flash = 0.12; e.lastHit = g.t;
    if (e.stunDmg != null) e.stunDmg += dmg;
    const hy = h.hy != null ? h.hy : e.y + (e.hitY || e.h * 0.55);
    g.ev({ t: 'hit', x: e.x + (h.fromX != null ? Math.sign(h.fromX - e.x) * 0 : 0), y: Math.min(hy, e.y + e.h * 0.9), z: e.z, kind: h.fire ? 'fire' : h.gun ? 'gun' : e.m.fam === 'angelo' ? 'metal' : e.type === 'frost' ? 'ice' : 'slash', ex: h.ex, big: h.buster || h.knock });
    if (!h.fire) g.sfx(h.gun ? 'hitgun' : h.buster ? 'slam' : 'hit', e.x, e.y + 1, e.z, h.gun ? 0.6 : 1);
    if (e.hp <= 0) { kill(g, e, h); return true; }
    if (ai && ai.onHit && ai.onHit(g, e, h) === false) return true;
    if (e.boss) return true;
    e.poiseDmg += dmg;
    const stagger = e.def.poise === 0 || e.poiseDmg >= e.def.poise || h.buster || h.knock || h.launch || !e.ground;
    const fx = e.x - (h.fromX != null ? h.fromX : g.player.x), fz = e.z - (h.fromZ != null ? h.fromZ : g.player.z), fl = Math.hypot(fx, fz) || 1;
    const kbm = e.heavy >= 2 ? 0.2 : e.heavy ? 0.5 : 1;
    if (!stagger) { e.vx += fx / fl * (h.kb || 0) * 0.3 * kbm; e.vz += fz / fl * (h.kb || 0) * 0.3 * kbm; return true; }
    e.poiseDmg = 0; release(g, e); e.atk = null;
    e.vx = fx / fl * (h.kb || 0.5) * kbm; e.vz = fz / fl * (h.kb || 0.5) * kbm;
    if (h.up && !e.heavy && !e.def.fly) { e.vy = h.up; e.ground = false; e.st = 'air'; e.stT = 0; e.float = 0.25; e.knocked = h.knock; return true; }
    if (!e.ground && !e.def.fly) { e.vy = h.juggle != null && h.juggle !== 0 ? h.juggle : Math.max(e.vy, 2); e.float = 0.35; e.st = h.juggle < 0 ? 'knock' : 'air'; e.stT = 0; if (h.juggle < 0) e.knocked = true; return true; }
    if (h.knock && e.heavy < 2) { e.st = 'knock'; e.stT = 0; e.vy = Math.max(e.vy, 4 + (h.up || 0) * (e.heavy ? 0.3 : 1)); e.ground = false; e.knocked = true; return true; }
    e.st = 'hurt'; e.stT = 0; e.stun = (h.stun || 0.3) * (e.heavy ? 0.7 : 1);
    return true;
  }

  function kill(g, e, h) {
    if (e.dead) return;
    e.dead = true; e.st = 'dead'; e.stT = 0; e.hp = 0; release(g, e);
    const ai = AI[e.type];
    if (e.boss) { if (ai && ai.onDeath) ai.onDeath(g, e, h); return; }
    g.stats.kills++;
    const rank = g.style.rank, n = Math.round((e.def.orbs || 5) * g.diff.orbMul * (1 + rank * 0.12));
    g.dropOrbs(e.x, e.y, e.z, n, 'red');
    if (g.rng() < 0.16) g.dropOrbs(e.x, e.y, e.z, 1, 'green', 12);
    if (g.save.dt && g.rng() < 0.2) g.dropOrbs(e.x, e.y, e.z, 1, 'white', 40);
    g.styleHit('kill', 10, !e.ground);
    g.sfx('die_' + (e.def.model === 'mega' ? 'scarecrow' : e.def.model === 'scarecrowLeg' ? 'scarecrow' : e.def.model), e.x, e.y + 1, e.z);
    if (e.vy <= 0 && e.ground) e.vy = 3;
  }

  function faceP(e, g, rate = 8) { const p = g.player, a = Math.atan2(p.x - e.x, p.z - e.z), d = wrapAng(a - e.face); e.face = wrapAng(e.face + clamp(d, -rate * DT, rate * DT)); return Math.abs(d); }
  function distP(e, g) { const p = g.player; return Math.hypot(p.x - e.x, p.z - e.z); }
  function walk(e, g, toward, speed, strafe = 0) {
    const p = g.player, dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz) || 1;
    const fx = dx / d, fz = dz / d, sx = -fz * strafe, sz = fx * strafe;
    const tx = (fx * toward + sx) * speed, tz = (fz * toward + sz) * speed, k = Math.min(1, 8 * DT);
    e.vx += (tx - e.vx) * k; e.vz += (tz - e.vz) * k;
    e.moveK = Math.hypot(e.vx, e.vz) / Math.max(1, speed) * 0.9; e.phase += Math.hypot(e.vx, e.vz) * DT * 1.6;
  }
  function stop(e) { e.vx *= 0.8; e.vz *= 0.8; e.moveK *= 0.8; }
  function begin(e, name, dur, o = {}) { e.atk = Object.assign({ name, dur, t: 0, done: {} }, o); e.anim = o.anim || name; e.animU = 0; e.st = 'atk'; e.stT = 0; }
  function at(e, t, key) { if (e.atk.t >= t && !e.atk.done[key]) { e.atk.done[key] = true; return true; } return false; }

  function common(g, e) {
    e.t += DT; e.stT += DT; e.flash = Math.max(0, e.flash - DT);
    if (e.invul > 0) e.invul -= DT;
    if (e.spawnT > 0) { e.spawnT -= DT; e.anim = null; if (e.spawnT <= 0) { e.spawnT = 0; e.st = 'idle'; } return true; }
    if (e.dead) { if (e.boss) { e.deadT = (e.deadT || 0) + DT; foePhysics(g, e); return true; } e.anim = 'dead'; e.animU = Math.min(1, e.stT / 0.8); e.vx *= 0.9; e.vz *= 0.9; foePhysics(g, e); if (e.stT > 1.3) e.gone = true; return true; }
    switch (e.st) {
      case 'grabbed': if (!e.grabBy) { e.st = 'hurt'; e.stun = 0.4; e.stT = 0; } e.anim = 'hurt'; e.animU = 0.5; return true;
      case 'held': { const p = g.player; if (p.holding !== e) { e.st = 'idle'; return true; } e.x = p.x + Math.sin(p.face - 0.6) * 0.5; e.z = p.z + Math.cos(p.face - 0.6) * 0.5; e.y = p.y + 1.7; e.face = p.face; return true; }
      case 'pulled': {
        const p = e.pullTo || g.player, tx = p.x + Math.sin(p.face) * 1.5, tz = p.z + Math.cos(p.face) * 1.5, ty = p.y + (p.ground ? 0 : 0.3);
        const dx = tx - e.x, dz = tz - e.z, dy = ty - e.y, d = Math.hypot(dx, dz, dy);
        e.anim = 'knock';
        if ((d < 0.6 || e.stT > 0.5) && e.catchable) { e.st = 'held'; p.holding = e; g.msg('Гладиус пойман! L — метнуть его в стекло.', 2.5); return true; }
        if (d < 0.6 || e.stT > 0.5) { e.st = 'hurt'; e.stun = 0.7; e.stT = 0; e.vx = e.vz = 0; e.vy = p.ground ? 0 : 3; e.float = 0.5; return true; }
        const v = 20 / d; e.x += dx * v * DT; e.z += dz * v * DT; e.y += dy * v * DT; g.W.collide(e);
        return true;
      }
      case 'hurt': e.anim = 'hurt'; e.animU = Math.min(1, e.stT / Math.max(0.1, e.stun)); e.vx *= 0.9; e.vz *= 0.9; foePhysics(g, e, e.float > 0 ? 0.3 : 1); e.float = Math.max(0, (e.float || 0) - DT); if (!e.ground && !e.def.fly) { e.st = 'air'; } else if (e.stT >= e.stun) { e.st = 'idle'; e.cd = Math.max(e.cd, 0.4); } return true;
      case 'air': e.anim = 'knock'; e.float = Math.max(0, (e.float || 0) - DT); e.vx *= 0.97; e.vz *= 0.97; foePhysics(g, e, e.float > 0 ? 0.35 : 1); if (e.ground && e.stT > 0.1) { e.st = e.knocked ? 'down' : 'hurt'; e.stT = 0; e.stun = 0.3; e.knocked = false; if (e.st === 'down') g.sfx('thud', e.x, e.y, e.z); } return true;
      case 'knock': e.anim = 'knock'; foePhysics(g, e); if (e.ground && e.stT > 0.1) { e.st = 'down'; e.stT = 0; e.vx = e.vz = 0; g.sfx('thud', e.x, e.y, e.z); } return true;
      case 'down': e.anim = 'down'; e.vx *= 0.8; e.vz *= 0.8; foePhysics(g, e); if (e.stT > 1.0 * (1.2 - g.diff.aggr * 0.2)) { e.st = 'getup'; e.stT = 0; } return true;
      case 'getup': e.anim = 'getup'; e.animU = e.stT / 0.6; foePhysics(g, e); if (e.stT > 0.6) { e.st = 'idle'; e.cd = 0.5; } return true;
      default: return false;
    }
  }

  function melee(g, e, o) {
    const d = distP(e, g), A = e.atk;
    if (!A) {
      e.cd -= DT * g.diff.aggr;
      const ang = faceP(e, g, o.turn || 6);
      if (d > o.reach + 0.4) { walk(e, g, 1, o.speed, d < 6 && !g.tokens.has(e.id) ? e.strafe * 0.6 : 0); e.anim = null; }
      else if (!token(g, e) || e.cd > 0) { if (d < o.reach * 0.7) walk(e, g, -0.5, o.speed * 0.6, e.strafe * 0.5); else walk(e, g, 0, o.speed * 0.5, e.strafe); e.anim = null; if (g.rng() < 0.005) e.strafe *= -1; }
      else if (ang < 0.5) { o.pick(); }
      foePhysics(g, e);
      return;
    }
    A.t += DT; e.animU = Math.min(1, A.t / A.dur);
    o.run(A);
    foePhysics(g, e);
    if (A.t >= A.dur) { e.atk = null; e.st = 'idle'; e.anim = null; release(g, e); const cd = e.def.cd || [1.5, 3]; e.cd = cd[0] + g.rng() * (cd[1] - cd[0]); }
  }

  const AI = {
    scarecrow: {
      update(g, e) {
        melee(g, e, { reach: 2, speed: e.def.speed, turn: 5,
          pick: () => g.rng() < 0.3 ? begin(e, 'spin', 1.1) : begin(e, 'attack', 0.95),
          run: A => {
            if (A.name === 'attack') { stop(e); if (A.t < 0.4) faceP(e, g, 4); if (A.t > 0.4 && A.t < 0.52) { const f = e.face; e.vx = Math.sin(f) * 4; e.vz = Math.cos(f) * 4; } if (at(e, 0.48, 'h')) { strike(g, e, { reach: 2.3, arc: 110, dmg: e.def.dmg }); g.sfx('swingE', e.x, e.y + 1, e.z, 0.7); } }
            else { stop(e); if (A.t > 0.3) { const f = e.face; e.vx = Math.sin(f) * 2.5; e.vz = Math.cos(f) * 2.5; } for (const k of [0.4, 0.65, 0.9]) if (at(e, k, k)) strike(g, e, { reach: 2.1, arc: 360, dmg: e.def.dmg * 0.6 }); }
          } });
      }
    },
    scarecrowLeg: {
      update(g, e) {
        melee(g, e, { reach: 2.3, speed: e.def.speed, turn: 5,
          pick: () => distP(e, g) > 1.6 && g.rng() < 0.5 ? begin(e, 'roll', 1.2) : begin(e, 'kick', 0.9),
          run: A => {
            if (A.name === 'kick') { if (A.t < 0.35) { stop(e); faceP(e, g, 5); } else if (A.t < 0.6) { e.vx = Math.sin(e.face) * 6; e.vz = Math.cos(e.face) * 6; } else stop(e); if (at(e, 0.5, 'h')) strike(g, e, { reach: 2.2, arc: 100, dmg: e.def.dmg }); }
            else { if (A.t < 0.3) { stop(e); faceP(e, g, 5); } else if (A.t < 1.0) { e.vx = Math.sin(e.face) * 9; e.vz = Math.cos(e.face) * 9; if (!A.hit && strike(g, e, { reach: 1.2, arc: 360, dmg: e.def.dmg * 0.9 })) A.hit = true; } else stop(e); }
          } });
      }
    },
    mega: {
      update(g, e) {
        melee(g, e, { reach: 3, speed: e.def.speed, turn: 3,
          pick: () => distP(e, g) > 2.5 && g.rng() < 0.45 ? begin(e, 'roll', 1.8) : begin(e, 'attack', 1.35),
          run: A => {
            if (A.name === 'attack') { stop(e); if (A.t < 0.6) faceP(e, g, 2.5); if (at(e, 0.7, 'h')) { strike(g, e, { reach: 3.4, arc: 120, dmg: e.def.dmg, knock: true, kb: 8 }); g.shake = Math.max(g.shake, 0.3); g.sfx('slam', e.x, e.y, e.z, 0.6); } }
            else { if (A.t < 0.5) { stop(e); faceP(e, g, 3); } else if (A.t < 1.5) { e.vx = Math.sin(e.face) * 11; e.vz = Math.cos(e.face) * 11; if (!A.hit && strike(g, e, { reach: 1.4, arc: 360, dmg: e.def.dmg, knock: true, kb: 9 })) A.hit = true; } else stop(e); }
          } });
      }
    },
    frost: {
      init(g, e) { e.cocooned = false; },
      guard(g, e, h) { if (e.st === 'cocoon') { e.ice -= h.dmg; g.ev({ t: 'hit', x: e.x, y: e.y + 1.2, z: e.z, kind: 'ice' }); g.sfx('icehit', e.x, e.y + 1, e.z); if (e.ice <= 0) { e.st = 'hurt'; e.stT = 0; e.stun = 1.4; g.sfx('icebreak', e.x, e.y + 1, e.z); g.ev({ t: 'shatter', x: e.x, y: e.y + 1, z: e.z }); } return 'block'; } return null; },
      onHit(g, e, h) {
        if (!e.cocooned && e.hp < e.maxHp * e.def.cocoon && !h.buster) { e.cocooned = true; e.st = 'cocoon'; e.stT = 0; e.ice = 70 * g.diff.hpMul; e.atk = null; release(g, e); e.vx = e.vz = 0; g.sfx('freeze', e.x, e.y + 1, e.z); return false; }
        if (h.sword && e.st !== 'atk' && e.ground && g.rng() < 0.12 * g.diff.aggr && !h.knock) { e.st = 'idle'; e.cd = 0; e.vx = -Math.sin(e.face) * 9; e.vz = -Math.cos(e.face) * 9; e.vy = 6; e.ground = false; g.sfx('jump', e.x, e.y, e.z, 0.5); return false; }
        return true;
      },
      update(g, e) {
        if (e.st === 'cocoon') { e.anim = 'cocoon'; e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.16 * DT); stop(e); foePhysics(g, e); if (e.stT > 3.2) { e.st = 'idle'; g.sfx('icebreak', e.x, e.y + 1, e.z); g.ev({ t: 'shatter', x: e.x, y: e.y + 1, z: e.z }); } return; }
        const d = distP(e, g);
        melee(g, e, { reach: 2.3, speed: e.def.speed, turn: 7,
          pick: () => { const r = g.rng(); if (d > 5 && r < 0.45) begin(e, 'pounce', 1.2, { anim: 'pounce' }); else if (d > 4 && r < 0.75) begin(e, 'spit', 1.1, { anim: 'spit' }); else begin(e, 'claw', 1.0, { anim: 'claw' }); },
          run: A => {
            if (A.name === 'claw') { if (A.t < 0.25) { stop(e); faceP(e, g, 8); } else if (A.t < 0.45 || (A.t > 0.55 && A.t < 0.7)) { e.vx = Math.sin(e.face) * 7; e.vz = Math.cos(e.face) * 7; } else stop(e); e.anim = A.t < 0.5 ? 'claw' : 'claw2'; e.animU = (A.t % 0.5) / 0.5; if (at(e, 0.38, 'a')) strike(g, e, { reach: 2.2, arc: 110, dmg: e.def.dmg * 0.7 }); if (at(e, 0.68, 'b')) strike(g, e, { reach: 2.4, arc: 110, dmg: e.def.dmg, knock: true, kb: 6 }); }
            else if (A.name === 'pounce') { if (A.t < 0.3) { stop(e); faceP(e, g, 8); } if (at(e, 0.3, 'j')) { const p = g.player, dx = p.x - e.x, dz = p.z - e.z, dd = Math.hypot(dx, dz) || 1; e.vx = dx / dd * Math.min(14, dd * 1.4); e.vz = dz / dd * Math.min(14, dd * 1.4); e.vy = 8; e.ground = false; g.sfx('roarS', e.x, e.y + 1, e.z, 0.6); } if (A.t > 0.4 && !A.hit && strike(g, e, { reach: 1.5, arc: 360, dmg: e.def.dmg, knock: true, kb: 7 })) A.hit = true; if (A.t > 0.45 && e.ground) stop(e); }
            else { stop(e); faceP(e, g, 6); for (const k of [0.45, 0.65, 0.85]) if (at(e, k, k)) { S.foeShot(g, e, 'ice', 22, 8); } }
          } });
      }
    },
    angelo: {
      init(g, e) { e.guardDmg = 0; e.shieldDown = 0; },
      guard(g, e, h) {
        if (e.shieldDown > 0 || e.st === 'hurt' || e.st === 'down' || e.st === 'air' || e.st === 'knock' || (e.atk && e.atk.name === 'thrust' && e.atk.t > 0.4)) return null;
        const p = g.player, a = Math.abs(wrapAng(Math.atan2(p.x - e.x, p.z - e.z) - e.face));
        if (a > 1.3) return null;
        const pow = h.dmg * (h.ex ? 2.2 : 1) * (h.gun ? 0.3 : 1) + (h.key === 'charge' ? 40 : 0);
        e.guardDmg += pow;
        if (e.guardDmg >= 75 * g.diff.hpMul) { e.guardDmg = 0; e.shieldDown = 5; e.st = 'hurt'; e.stT = 0; e.stun = 1.5; e.atk = null; release(g, e); g.sfx('shieldbreak', e.x, e.y + 1, e.z); g.ev({ t: 'hit', x: e.x, y: e.y + 1.2, z: e.z, kind: 'metal', big: true }); g.styleHit('guardbreak', 40, false); return 'block'; }
        if (g.rng() < 0.25) e.cd = Math.min(e.cd, 0.1);
        return 'block';
      },
      update(g, e) {
        if (e.shieldDown > 0) e.shieldDown -= DT;
        const d = distP(e, g);
        melee(g, e, { reach: 2.8, speed: e.def.speed, turn: 4,
          pick: () => d > 3.5 || g.rng() < 0.35 ? begin(e, 'thrust', 1.4, { anim: 'thrustE' }) : begin(e, 'slash', 1.1, { anim: 'slashE' }),
          run: A => {
            if (A.name === 'thrust') { if (A.t < 0.5) { stop(e); faceP(e, g, 4); } else if (A.t < 0.95) { e.vx = Math.sin(e.face) * 13; e.vz = Math.cos(e.face) * 13; if (!A.hit && strike(g, e, { reach: 2.6, arc: 50, dmg: e.def.dmg, knock: true, kb: 8 })) A.hit = true; } else stop(e); }
            else { stop(e); if (A.t < 0.45) faceP(e, g, 4); if (at(e, 0.55, 'h')) { strike(g, e, { reach: 3, arc: 140, dmg: e.def.dmg }); g.sfx('swingE', e.x, e.y + 1, e.z); } }
          } });
      }
    },
    mephisto: {
      init(g, e) { e.cloakMax = e.cloak; e.bare = 0; if (!g.flags.tipMeph) { g.flags.tipMeph = true; g.msg('Мефисто укрыт тьмой: заряженный выстрел (удерживать K) или Snatch срывает покров.', 7, 'tip'); } },
      guard(g, e, h) {
        if (e.cloak <= 0) return null;
        if (h.key === 'charge' || h.key === 'dt' || h.key === 'holy') { strip(g, e); return null; }
        e.cloak -= h.dmg * (h.ex ? 1.5 : 0.5); e.flash = 0.08;
        if (e.cloak <= 0) { strip(g, e); return 'block'; }
        e.vx += -Math.sin(e.face) * 2; e.vz += -Math.cos(e.face) * 2;
        return 'immune';
      },
      update(g, e) {
        if (e.cloak <= 0) { e.bare -= DT; e.hover = 0.5; if (e.bare <= 0) { e.cloak = e.cloakMax; e.hover = e.def.fly; g.sfx('cloak', e.x, e.y + 1, e.z); } } else e.hover = e.def.fly + Math.sin(e.t * 2) * 0.3;
        const d = distP(e, g);
        melee(g, e, { reach: 2.3, speed: e.cloak > 0 ? e.def.speed : e.def.speed * 0.6, turn: 5,
          pick: () => d > 3 && g.rng() < 0.5 ? begin(e, 'swoop', 1.2, { anim: 'swoop' }) : begin(e, 'claw', 1, { anim: 'claw' }),
          run: A => {
            if (A.name === 'swoop') { if (A.t < 0.4) { stop(e); faceP(e, g, 6); } else if (A.t < 0.85) { e.vx = Math.sin(e.face) * 12; e.vz = Math.cos(e.face) * 12; if (!A.hit && strike(g, e, { reach: 1.8, arc: 120, dmg: e.def.dmg, knock: true, kb: 5, lo: -2.5 })) A.hit = true; } else stop(e); }
            else { stop(e); faceP(e, g, 5); if (at(e, 0.4, 'a')) strike(g, e, { reach: 2.4, arc: 120, dmg: e.def.dmg * 0.7, lo: -2.5 }); if (at(e, 0.7, 'b')) strike(g, e, { reach: 2.4, arc: 120, dmg: e.def.dmg * 0.8, lo: -2.5 }); }
          } });
      },
      onSnatch(g, e) { if (e.cloak > 0) strip(g, e); return true; }
    },
    assault: {
      guard(g, e, h) {
        if (e.st !== 'idle' || h.gun || h.ex) return null;
        const p = g.player, a = Math.abs(wrapAng(Math.atan2(p.x - e.x, p.z - e.z) - e.face));
        if (a < 1.2 && g.rng() < e.def.block * g.diff.aggr) { e.anim = 'block'; e.blockT = 0.3; if (g.rng() < 0.5) { e.cd = 0; g.tokens.add(e.id); begin(e, 'claw', 0.75, { anim: 'claw', fast: true }); } return 'block'; }
        return null;
      },
      update(g, e) {
        const d = distP(e, g);
        melee(g, e, { reach: 2.3, speed: e.def.speed, turn: 9,
          pick: () => d > 4.5 && g.rng() < 0.55 ? begin(e, 'pounce', 1.1, { anim: 'pounce' }) : begin(e, 'claw', 0.95, { anim: 'claw' }),
          run: A => {
            if (A.name === 'claw') { const w = A.fast ? 0.15 : 0.3; if (A.t < w) { stop(e); faceP(e, g, 9); } else if (A.t < w + 0.2) { e.vx = Math.sin(e.face) * 8; e.vz = Math.cos(e.face) * 8; } else stop(e); e.anim = A.t < w + 0.25 ? 'claw' : 'claw2'; if (at(e, w + 0.12, 'a')) strike(g, e, { reach: 2.2, arc: 110, dmg: e.def.dmg * 0.8 }); if (at(e, w + 0.4, 'b')) strike(g, e, { reach: 2.3, arc: 110, dmg: e.def.dmg }); }
            else { if (A.t < 0.3) { stop(e); faceP(e, g, 9); } if (at(e, 0.3, 'j')) { const p = g.player, dx = p.x - e.x, dz = p.z - e.z, dd = Math.hypot(dx, dz) || 1; e.vx = dx / dd * Math.min(15, dd * 1.5); e.vz = dz / dd * Math.min(15, dd * 1.5); e.vy = 7; e.ground = false; g.sfx('roarS', e.x, e.y + 1, e.z, 0.5); } if (A.t > 0.35 && !A.hit && strike(g, e, { reach: 1.4, arc: 360, dmg: e.def.dmg * 1.1, knock: true, kb: 7 })) A.hit = true; if (A.t > 0.45 && e.ground) stop(e); }
          } });
      }
    },
    gladius: {
      update(g, e) {
        const p = g.player;
        e.orbit = (e.orbit || g.rng() * PI * 2) + DT * 1.2;
        if (e.st === 'dive') {
          e.x += e.vx * DT; e.y += e.vy * DT; e.z += e.vz * DT;
          if (!e.hitP && Math.hypot(p.x - e.x, p.z - e.z) < 1 && e.y > p.y - 0.2 && e.y < p.y + 2.2) { e.hitP = S.hurtPlayer(g, e.def.dmg, e, {}); }
          if (e.stT > 1.2 || e.y < 0.3) { e.st = 'idle'; e.stT = 0; e.hitP = false; e.cd = 1.5 + g.rng() * 2; }
          e.face = Math.atan2(e.vx, e.vz);
          return;
        }
        e.cd -= DT * g.diff.aggr;
        const tx = p.x + Math.sin(e.orbit) * 6, tz = p.z + Math.cos(e.orbit) * 6, ty = 3 + Math.sin(e.t * 2 + e.id) * 0.6;
        e.x += (tx - e.x) * 2 * DT; e.z += (tz - e.z) * 2 * DT; e.y += (ty - e.y) * 2 * DT;
        e.face = Math.atan2(p.x - e.x, p.z - e.z);
        if (e.cd <= 0 && e.st === 'idle') { const dx = p.x - e.x, dy = p.y + 1 - e.y, dz = p.z - e.z, dd = Math.hypot(dx, dy, dz) || 1; e.vx = dx / dd * 18; e.vy = dy / dd * 18; e.vz = dz / dd * 18; e.st = 'dive'; e.stT = 0; g.sfx('whoosh', e.x, e.y, e.z, 0.6); }
      }
    }
  };
  function strip(g, e) { e.cloak = 0; e.bare = 9; e.hover = 0.5; g.sfx('cloakoff', e.x, e.y + 1, e.z); g.ev({ t: 'hit', x: e.x, y: e.y + 1.4, z: e.z, kind: 'ghost', big: true }); g.styleHit('strip', 30, false); e.st = 'hurt'; e.stT = 0; e.stun = 1; e.atk = null; release(g, e); }

  function updateFoe(g, e) {
    if (e.boss) { S.updateBoss(g, e); return; }
    if (common(g, e)) return;
    const ai = AI[e.type];
    if (e.st === 'spawn') e.st = 'idle';
    if (ai) ai.update(g, e);
  }

  S.spawnFoe = spawnFoe; S.updateFoe = updateFoe; S.hitFoe = hitFoe; S.killFoe = kill; S.FOE_AI = AI;
  S.foeCommon = common; S.foePhysics = foePhysics; S.strike = strike; S.faceP = faceP; S.distP = distP; S.walkFoe = walk; S.stopFoe = stop; S.beginAtk = begin; S.atAtk = at; S.releaseToken = release;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
