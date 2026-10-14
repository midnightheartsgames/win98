(function (S) {
  'use strict';
  const { clamp, wrapAng } = S;
  const D = S.DATA, AI = S.FOE_AI;
  const DT = 1 / 60, PI = Math.PI;
  const faceP = S.faceP, distP = S.distP, strike = S.strike, begin = S.beginAtk, at = S.atAtk, stop = S.stopFoe, walk = S.walkFoe;

  function startBoss(g, id, sp) {
    const e = S.spawnFoe(g, id, sp.x, sp.z, { instant: true, y: sp.y });
    e.boss = true; e.face = sp.face || 0; e.stT = 0; e.cd = 1.2; e.t = 0; e.home = [sp.x, e.y, sp.z]; e.arena = sp.zone || g.def.bounds;
    g.boss = e;
    g.setSeal(true);
    g.ev({ t: 'music', m: 'boss' }); g.ev({ t: 'boss', id });
    return e;
  }
  function bossDefeated(g, e) {
    if (e.won) return; e.won = true;
    g.bossSouls = (g.bossSouls || 0) + (e.def.souls || 0);
    for (const f of g.foes) if (f !== e && !f.dead) { f.dead = true; f.st = 'dead'; f.stT = 0; }
    g.setSeal(false); g.ev({ t: 'music', m: 'none' }); g.ev({ t: 'bossdown', id: e.type });
    g.slowmo = 1.2; g.styleHit('bosskill', 120, false);
    if (e.type !== 'dante' && e.type !== 'agnus') g.dropOrbs(e.x, e.y + 2, e.z, 250, 'red');
    e.winT = 0;
  }
  function updateBoss(g, e) {
    e.t += DT; e.stT += DT; e.flash = Math.max(0, e.flash - DT);
    if (e.invul > 0) e.invul -= DT;
    if (e.won) { e.winT += DT; if (AI[e.type].dying) AI[e.type].dying(g, e); if (e.winT > 1.8 && !e.outro) { e.outro = true; g.hook('bossDead', e.type); } return; }
    if (e.dead) { bossDefeated(g, e); return; }
    if (e.st === 'grabbed') { e.anim = 'stun'; return; }
    AI[e.type].update(g, e);
    const A = e.arena, m = e.r * 0.5;
    if (A) { e.x = clamp(e.x, A[0] + m, A[2] - m); e.z = clamp(e.z, A[1] + m, A[3] - m); }
    if (e.y < g.W.voidY + 4) { e.x = e.home[0]; e.y = e.home[1]; e.z = e.home[2]; e.vx = e.vy = e.vz = 0; }
  }
  function turn(e, g, rate) { return faceP(e, g, rate); }
  function stunned(e) { return e.stunT > 0; }

  AI.dante = {
    init(g, e) { e.stunDmg = 0; e.stunT = 0; e.busterDmg = 190; e.hitLog = []; e.combat = 1; e.finish = false; e.m = S.model('dante'); e.combatPose = true; },
    busterable(g, e) { return e.stunT > 0 || e.finish; },
    dmgMul(g, e) { return e.finish ? 0 : 1; },
    onHit(g, e, h) {
      if (e.finish) return false;
      e.hitLog.push(g.t); e.hitLog = e.hitLog.filter(t => g.t - t < 2);
      if (e.hp <= e.maxHp * e.def.end) { e.finish = true; e.stunT = 99; e.atk = null; e.pose = 'kneel'; e.anim = null; g.msg('Данте пошатнулся. Сейчас — Buster (L)!', 5, 'tip'); g.sfx('dante_hurt', e.x, e.y + 1, e.z); return false; }
      if (e.stunT > 0) return false;
      if (e.stunDmg >= 230 * g.diff.hpMul) { e.stunDmg = 0; e.stunT = 2.8; e.atk = null; e.pose = 'kneel'; e.anim = null; g.sfx('dante_hurt', e.x, e.y + 1, e.z); if (!g.flags.tipBuster) { g.flags.tipBuster = true; g.msg('Данте оглушён! Подойдите и нажмите L — Buster.', 4, 'tip'); } return false; }
      if (e.atk && (e.atk.name === 'stinger' || e.atk.name === 'helm') && e.atk.t > 0.2) return false;
      if (e.hitLog.length >= 5 && g.rng() < 0.55 * g.diff.aggr) { e.hitLog = []; begin(e, 'escape', 0.7, { anim: 'roll' }); const a = e.face + PI + (g.rng() - 0.5); e.vx = Math.sin(a) * 12; e.vz = Math.cos(a) * 12; e.vy = 7; e.ground = false; e.invul = 0.5; g.sfx('jump', e.x, e.y, e.z); return false; }
      if (h.up && !e.atk) { e.vy = h.up * 0.8; e.ground = false; }
      e.atk = null; e.st = 'hurt'; e.stT = 0; e.stun = Math.min(0.35, h.stun || 0.2); e.anim = 'hurt';
      return false;
    },
    afterBuster(g, e) {
      if (e.finish) { e.hp = 0; e.dead = true; e.st = 'dead'; return; }
      e.stunT = 0; e.pose = null; e.st = 'down'; e.stT = 0; e.stunDmg = 0; e.vy = 5; e.ground = false;
    },
    update(g, e) {
      if (e.finish) { e.pose = 'kneel'; e.vx = e.vz = 0; S.foePhysics(g, e); e.stunT -= DT; if (e.stunT < 99 - 14) { e.hp = 0; e.dead = true; } return; }
      if (e.stunT > 0) { e.stunT -= DT; e.pose = 'kneel'; stop(e); S.foePhysics(g, e); if (e.stunT <= 0) { e.pose = null; begin(e, 'taunt', 1, { anim: 'taunt' }); g.ev({ t: 'bark', who: 'Данте', text: 'Неплохо, малыш!' }); } return; }
      e.pose = null;
      if (e.st === 'hurt') { e.anim = 'hurt'; e.animU = e.stT / 0.3; e.vx *= 0.85; e.vz *= 0.85; S.foePhysics(g, e); if (e.stT > e.stun) { e.st = 'idle'; e.anim = null; e.cd = Math.min(e.cd, 0.3); } return; }
      if (e.st === 'down') { e.anim = e.ground ? 'down' : 'knock'; S.foePhysics(g, e); if (e.ground && e.stT > 0.9) { e.st = 'idle'; e.anim = null; begin(e, 'escape', 0.5, { anim: 'roll' }); e.vy = 8; e.ground = false; } return; }
      const d = distP(e, g), A = e.atk;
      if (!A) {
        e.cd -= DT * g.diff.aggr; turn(e, g, 8);
        if (d > 7) walk(e, g, 1, 6); else if (d < 2.5) walk(e, g, -0.4, 4, e.strafe); else walk(e, g, 0.2, 4, e.strafe);
        e.anim = null; e.combat = 4;
        if (e.cd <= 0) {
          const r = g.rng();
          if (d > 9) r < 0.55 ? begin(e, 'stinger', 1.1, { anim: 'stinger' }) : begin(e, 'guns', 1.4, { anim: 'gunsE' });
          else if (d > 4) r < 0.35 ? begin(e, 'guns', 1.4, { anim: 'gunsE' }) : r < 0.7 ? begin(e, 'helm', 1.5, { anim: 'helm' }) : begin(e, 'stinger', 1.1, { anim: 'stinger' });
          else r < 0.65 ? begin(e, 'combo', 1.3, { anim: 'slashE' }) : r < 0.85 ? begin(e, 'helm', 1.5, { anim: 'helm' }) : begin(e, 'taunt', 1.1, { anim: 'taunt' });
          if (e.atk && e.atk.name === 'taunt') g.ev({ t: 'bark', who: 'Данте', text: g.rng() < 0.5 ? 'Ну же, малыш!' : 'Это всё, на что ты способен?' });
        }
        S.foePhysics(g, e);
        return;
      }
      A.t += DT; e.animU = Math.min(1, A.t / A.dur);
      switch (A.name) {
        case 'guns': stop(e); turn(e, g, 10); for (let i = 0; i < 6; i++) if (at(e, 0.25 + i * 0.17, 's' + i)) S.foeShot(g, e, 'bullet', 40, 2.5, { hy: 1.3, side: i % 2 ? 0.25 : -0.25 }); break;
        case 'stinger': if (A.t < 0.3) { stop(e); turn(e, g, 10); } else if (A.t < 0.8) { e.vx = Math.sin(e.face) * 20; e.vz = Math.cos(e.face) * 20; if (!A.hit && strike(g, e, { reach: 1.6, arc: 70, dmg: 13, knock: true, kb: 9 })) A.hit = true; } else stop(e); if (at(e, 0.3, 'sfx')) g.sfx('stinger', e.x, e.y + 1, e.z); break;
        case 'combo': if (A.t < 0.9) turn(e, g, 6); stop(e); e.anim = A.t < 0.55 ? 'slashE' : A.t < 0.9 ? 'overE' : 'slashE'; e.animU = (A.t % 0.45) / 0.45; for (const [k, dm, kn] of [[0.3, 7, false], [0.62, 7, false], [1.0, 11, true]]) if (at(e, k, k)) { e.vx = Math.sin(e.face) * 5; e.vz = Math.cos(e.face) * 5; strike(g, e, { reach: 2.6, arc: 120, dmg: dm, knock: kn, kb: 7 }); g.sfx('swingE', e.x, e.y + 1, e.z); } break;
        case 'helm': {
          if (at(e, 0.2, 'j')) { const p = g.player, dx = p.x - e.x, dz = p.z - e.z; e.vx = dx / 0.8; e.vz = dz / 0.8; e.vy = 11; e.ground = false; g.sfx('jump', e.x, e.y, e.z); }
          if (A.t > 0.75 && A.t < 0.8) { e.vy = -24; }
          if (A.t > 0.8 && e.ground && !A.land) { A.land = true; e.vx = e.vz = 0; g.shake = 0.4; g.ev({ t: 'shock', x: e.x, y: e.y, z: e.z, r: 2.8 }); g.sfx('slam', e.x, e.y, e.z); strike(g, e, { reach: 2.8, arc: 360, dmg: 15, knock: true, kb: 8, hi: 1.2 }); }
          if (A.t < 0.2) { stop(e); turn(e, g, 10); }
          break;
        }
        case 'escape': break;
        default: stop(e);
      }
      S.foePhysics(g, e);
      if (A.t >= A.dur) { e.atk = null; e.st = 'idle'; e.anim = null; e.cd = (0.6 + g.rng() * 1.1) / g.diff.aggr; }
    },
    onDeath(g, e) { e.st = 'dead'; },
    dying(g, e) { e.pose = 'kneel'; }
  };

  AI.berial = {
    init(g, e) { e.flameMax = 460 * g.diff.hpMul; e.flame = e.flameMax; e.stunT = 0; e.busterDmg = 380; e.zipY = 3.4; e.burnT = 0; e.hitY = 3.5; e.phase2 = false; },
    busterable(g, e) { return e.stunT > 0; },
    dmgMul(g, e, h) { return e.stunT > 0 ? 1.5 : h.hy != null && h.hy > e.y + 3 ? 1.25 : 1; },
    onHit(g, e, h) {
      if (e.stunT > 0) return false;
      e.flame -= h.dmg * (h.hy != null && h.hy > e.y + 3 ? 1.6 : 1) * (h.gun ? 1.5 : 1);
      if (e.flame <= 0) { e.flame = 0; e.stunT = 5.5; e.atk = null; e.anim = 'stun'; e.vx = e.vz = 0; g.sfx('extinguish', e.x, e.y + 2, e.z); g.ev({ t: 'smoke', x: e.x, y: e.y + 2, z: e.z }); if (!g.flags.tipBerial) { g.flags.tipBerial = true; g.msg('Пламя Бериала погасло! Buster (L) — пока он не поднялся.', 4, 'tip'); } }
      return false;
    },
    afterBuster(g, e) { e.stunT = Math.min(e.stunT, 0.6); g.shake = 1; },
    update(g, e) {
      const d = distP(e, g), p = g.player;
      if (!e.phase2 && e.hp < e.maxHp * 0.5) { e.phase2 = true; g.ev({ t: 'bark', who: 'Бериал', text: 'Жалкий человек! Сгори в пламени ада!' }); begin(e, 'roar', 1.4, { anim: 'roar' }); }
      if (e.stunT > 0) {
        e.stunT -= DT; e.anim = 'stun'; stop(e); S.foePhysics(g, e);
        if (e.stunT <= 0) { e.flame = e.flameMax; begin(e, 'reignite', 1.5, { anim: 'roar' }); g.sfx('roarB', e.x, e.y + 3, e.z); }
        return;
      }
      e.burnT -= DT;
      if (e.burnT <= 0 && d < e.r + 1 && p.y < e.y + 3.5) { e.burnT = 0.7; S.hurtPlayer(g, 5, e, { kb: 5, kind: 'fire' }); }
      const A = e.atk;
      if (!A) {
        e.cd -= DT * g.diff.aggr * (e.phase2 ? 1.3 : 1);
        const ang = turn(e, g, 1.6);
        if (d > 7) walk(e, g, 1, 4.5); else if (d < 4) walk(e, g, -0.3, 3); else stop(e);
        e.anim = null;
        if (e.cd <= 0) {
          const r = g.rng();
          if (d < 5 && r < 0.4) begin(e, 'stomp', 1.3, { anim: 'stomp' });
          else if (d < 8.5 && ang < 0.8 && r < 0.8) begin(e, 'swing', 1.7, { anim: 'swing' });
          else if (d > 9 && r < 0.5) begin(e, 'charge', 2.4, { anim: null });
          else if (e.phase2 && r < 0.75) begin(e, 'wave', 1.4, { anim: 'swing' });
          else begin(e, 'rain', 1.6, { anim: 'cast' });
        }
        S.foePhysics(g, e);
        return;
      }
      A.t += DT; e.animU = Math.min(1, A.t / A.dur);
      switch (A.name) {
        case 'swing': stop(e); if (A.t < 0.6) turn(e, g, 1.8); if (at(e, 0.1, 'w')) g.sfx('roarB', e.x, e.y + 3, e.z, 0.5); if (at(e, 0.72, 'h')) { strike(g, e, { reach: 7.5, arc: 200, dmg: 18, knock: true, kb: 10, hi: 2.6, kind: 'fire' }); g.ev({ t: 'firearc', x: e.x, y: e.y + 1, z: e.z, face: e.face, r: 7 }); g.sfx('swing3', e.x, e.y + 2, e.z); g.shake = 0.4; } break;
        case 'stomp': stop(e); if (at(e, 0.75, 'h')) { g.ev({ t: 'shock', x: e.x, y: e.y, z: e.z, r: 6, fire: true }); g.shake = 0.6; g.sfx('slam', e.x, e.y, e.z); strike(g, e, { reach: 6, arc: 360, dmg: 14, knock: true, kb: 9, hi: 1.1, lo: -1 }); } break;
        case 'charge': {
          if (A.t < 0.6) { stop(e); turn(e, g, 3); if (at(e, 0.1, 'r')) g.sfx('roarB', e.x, e.y + 3, e.z); }
          else if (A.t < 2.1 && !A.wall) {
            e.vx = Math.sin(e.face) * 15; e.vz = Math.cos(e.face) * 15; e.moveK = 1.6; e.phase += 15 * DT * 0.6;
            if (!A.hit && strike(g, e, { reach: 1, arc: 360, dmg: 20, knock: true, kb: 12, hi: 3 })) A.hit = true;
            const ox = e.x, oz = e.z; S.foePhysics(g, e); if (Math.hypot(e.x - ox - e.vx * DT, e.z - oz - e.vz * DT) > 0.05) { A.wall = true; e.stunT = 1.6; g.shake = 0.7; g.sfx('slam', e.x, e.y, e.z); g.ev({ t: 'shock', x: e.x, y: e.y, z: e.z, r: 3 }); }
            return;
          } else stop(e);
          break;
        }
        case 'rain': stop(e); if (at(e, 0.6, 'c')) { for (let i = 0; i < (e.phase2 ? 9 : 6); i++) { const a = g.rng() * PI * 2, r = i === 0 ? 0 : 1 + g.rng() * 6; S.meteor(g, p.x + Math.sin(a) * r, p.z + Math.cos(a) * r, 1.1 + i * 0.12); } g.sfx('cast', e.x, e.y + 3, e.z); } break;
        case 'wave': stop(e); if (A.t < 0.6) turn(e, g, 2); if (at(e, 0.72, 'w')) { S.fireWave(g, e); g.sfx('swing3', e.x, e.y + 2, e.z); } break;
        case 'reignite': case 'roar': stop(e); if (at(e, 0.5, 'b')) { g.ev({ t: 'shock', x: e.x, y: e.y, z: e.z, r: 6.5, fire: true }); strike(g, e, { reach: 6.5, arc: 360, dmg: 12, knock: true, kb: 10, hi: 2, lo: -1 }); g.shake = 0.5; } break;
        default: stop(e);
      }
      S.foePhysics(g, e);
      if (A.t >= A.dur) { e.atk = null; e.anim = null; e.st = 'idle'; e.cd = 0.8 + g.rng() * 1.2; }
    },
    onDeath(g, e) { e.st = 'dead'; },
    dying(g, e) { e.anim = 'dead'; e.animU = Math.min(1, e.winT / 1.5); }
  };

  function lurePos(e, side) {
    const f = e.face, fx = Math.sin(f), fz = Math.cos(f), rx = Math.cos(f), rz = -Math.sin(f);
    const out = e.atk && e.atk.name === 'lure';
    const fwd = out ? 4.6 : 3.4, up = out ? 3.2 : 4.8;
    return [e.x + fx * fwd + rx * side * 1.4, e.y + up, e.z + fz * fwd + rz * side * 1.4];
  }
  AI.bael = {
    init(g, e) {
      e.stunT = 0; e.stunDmg = 0; e.busterDmg = 380; e.zipY = 1.8; e.hitY = 2.5;
      e.lures = [-1, 1].map(s => ({ lure: true, side: s, on: false, r: 0.6, h: 1.4, x: 0, y: 0, z: 0, boss: false, parent: e, onSnatch: (g2, l) => { AI.bael.stun(g2, e, 'lure'); l.on = false; return false; } }));
    },
    stun(g, e, why) { e.stunT = 5; e.atk = null; e.anim = 'stun'; e.hidden = false; e.stunDmg = 0; for (const l of e.lures) l.on = false; g.sfx('baelhurt', e.x, e.y + 2, e.z); if (!g.flags.tipBael) { g.flags.tipBael = true; g.msg(why === 'lure' ? 'Баэль оглушён! Buster (L)!' : 'Баэль повержен на землю! Buster (L)!', 4, 'tip'); } },
    busterable(g, e) { return e.stunT > 0; },
    dmgMul(g, e) { return e.stunT > 0 ? 1.25 : 1; },
    onHit(g, e) { if (e.stunT <= 0 && e.stunDmg > 1300 * g.diff.hpMul) AI.bael.stun(g, e, 'dmg'); return false; },
    afterBuster(g, e) { e.stunT = Math.min(e.stunT, 0.8); },
    update(g, e) {
      const p = g.player, d = distP(e, g);
      for (const l of e.lures) { const q = lurePos(e, l.side); l.x = q[0]; l.y = q[1]; l.z = q[2]; }
      if (e.stunT > 0) { e.stunT -= DT; e.anim = 'stun'; stop(e); S.foePhysics(g, e); if (e.stunT <= 0) { begin(e, 'roar', 1, { anim: 'breath' }); g.sfx('roarF', e.x, e.y + 2, e.z); } return; }
      const A = e.atk;
      if (!A) {
        e.cd -= DT * g.diff.aggr;
        turn(e, g, 1.5);
        if (d > 9) walk(e, g, 1, 3); else if (d < 5) walk(e, g, -0.4, 2.5); else stop(e);
        e.anim = null;
        if (e.cd <= 0) {
          const r = g.rng(), hurt = e.hp < e.maxHp * 0.6;
          if (r < 0.2 || (hurt && r < 0.3)) begin(e, 'lure', 4.2, { anim: 'lure' });
          else if (d < 11 && r < 0.45) begin(e, 'tongue', 1.4, { anim: 'tongue' });
          else if (d < 9 && r < 0.65) begin(e, 'breath', 2.2, { anim: 'breath' });
          else if (r < 0.85) begin(e, 'jump', 1.8, { anim: 'jump' });
          else begin(e, 'burrow', 4.2, { anim: 'burrow' });
        }
        S.foePhysics(g, e);
        return;
      }
      A.t += DT; e.animU = Math.min(1, A.t / A.dur);
      switch (A.name) {
        case 'tongue': stop(e); if (A.t < 0.6) turn(e, g, 2); if (at(e, 0.72, 'h')) { g.ev({ t: 'tongue', who: e, len: 11 }); g.sfx('tongue', e.x, e.y + 1, e.z); strike(g, e, { reach: 11, arc: 26, dmg: 14, knock: true, kb: 8, hi: 3 }); } break;
        case 'breath': stop(e); if (A.t < 0.6) turn(e, g, 1.4); if (A.t > 0.55 && A.t < 1.9) { A.tick = (A.tick || 0) - DT; if (at(e, 0.55, 's')) g.sfx('breath', e.x, e.y + 2, e.z); g.ev({ t: 'breath', who: e }); if (A.tick <= 0) { A.tick = 0.25; if (strike(g, e, { reach: 9.5, arc: 60, dmg: 4, kind: 'ice', hi: 3 })) { A.hits = (A.hits || 0) + 1; if (A.hits === 3) { p.frozen = 1.3; g.msg('Неро заморожен! Жмите Пробел.', 1.5); } } } } break;
        case 'jump': {
          if (at(e, 0.4, 'j')) { const dx = p.x - e.x, dz = p.z - e.z; e.vx = dx / 1; e.vz = dz / 1; e.vy = 13; e.ground = false; g.sfx('jump', e.x, e.y, e.z); }
          if (A.t < 0.4) { stop(e); turn(e, g, 3); }
          if (A.t > 0.5 && e.ground && !A.land) { A.land = true; e.vx = e.vz = 0; g.shake = 0.8; g.ev({ t: 'shock', x: e.x, y: e.y, z: e.z, r: 5.5, ice: true }); g.sfx('slam', e.x, e.y, e.z); strike(g, e, { reach: 5.5, arc: 360, dmg: 16, knock: true, kb: 10, hi: 1.2, lo: -1 }); }
          break;
        }
        case 'burrow': {
          if (A.t < 0.8) { stop(e); e.anim = 'burrow'; e.animU = A.t / 0.8; }
          else if (A.t < 3.2) { e.hidden = true; e.anim = 'burrow'; e.animU = 1; walk(e, g, 1, 7); if (at(e, 0.8, 'dig')) g.sfx('rumble', e.x, e.y, e.z); if (g.rng() < 0.4) g.ev({ t: 'snowburst', x: e.x, y: e.y, z: e.z }); if (d < 1.5) A.t = Math.max(A.t, 3.2); }
          else { stop(e); e.hidden = false; e.anim = 'rise'; e.animU = Math.min(1, (A.t - 3.2) / 0.7); if (at(e, 3.25, 'up')) { g.ev({ t: 'shock', x: e.x, y: e.y, z: e.z, r: 3.5, ice: true }); g.sfx('slam', e.x, e.y, e.z); g.shake = 0.6; strike(g, e, { reach: 3.5, arc: 360, dmg: 18, knock: true, kb: 9, up: 9, lo: -2 }); } }
          break;
        }
        case 'lure': {
          stop(e); turn(e, g, 1);
          for (const l of e.lures) l.on = A.t > 0.4 && A.t < 3.8;
          if (at(e, 0.4, 'm')) { g.sfx('lure', e.x, e.y + 3, e.z); if (!g.flags.tipLure) { g.flags.tipLure = true; g.msg('Светящиеся приманки! Захват (Shift) на приманку и Snatch (L).', 4, 'tip'); } }
          if (at(e, 3.8, 'f')) { for (const l of e.lures) { l.on = false; for (let i = 0; i < 3; i++) S.foeShot(g, { x: l.x, y: l.y - 1.2, z: l.z, face: Math.atan2(p.x - l.x, p.z - l.z), h: 0 }, 'ice', 18, 9, { spread: (i - 1) * 0.2, hy: 0 }); } g.sfx('icehit', e.x, e.y + 3, e.z); }
          break;
        }
        case 'roar': stop(e); break;
        default: stop(e);
      }
      S.foePhysics(g, e);
      if (A.t >= A.dur) { for (const l of e.lures) l.on = false; e.hidden = false; e.atk = null; e.anim = null; e.st = 'idle'; e.cd = 1 + g.rng() * 1.3; }
    },
    onDeath(g, e) { e.hidden = false; for (const l of e.lures) l.on = false; },
    dying(g, e) { e.anim = 'dead'; }
  };

  AI.agnus = {
    init(g, e) {
      e.noLock = true; e.pose = 'talk'; e.m = S.model('agnusY');
      g.msg('Поймайте гладиус: захват (Shift) + L. Затем L — метнуть его в стекло.', 7, 'tip'); e.elec = 3; e.elecOn = false; e.warn = false; e.lineT = 5; e.glassHits = 0; e.hp = 3; e.maxHp = 3;
    },
    guard() { return 'immune'; },
    glassHit(g, e) {
      if (e.won) return;
      e.hp -= 1; e.glassHits++; g.shake = 0.6; g.ev({ t: 'glass', n: e.glassHits }); g.sfx('glass', 0, 6, 10);
      g.styleHit('glass', 60, false);
      const lines = ['Н-н-невозможно! Стекло... моё с-с-стекло!', 'П-п-прекрати! Ты не понимаешь, с чем играешь!', 'Н-нет...'];
      g.ev({ t: 'bark', who: 'Агнус', text: lines[Math.min(2, e.glassHits - 1)] });
      if (e.hp <= 0) { e.dead = true; e.st = 'dead'; }
    },
    update(g, e) {
      const p = g.player;
      e.pose = 'talk'; e.face = Math.atan2(p.x - e.x, p.z - e.z);
      e.lineT -= DT;
      if (e.lineT <= 0) { e.lineT = 9 + g.rng() * 5; const L = ['Какое в-в-великолепное создание... Эта рука!', 'Гладиусы, п-п-приведите его ко мне!', 'Ты — ошибка природы, мальчишка!', 'С-с-сила Ямато... она будет моей!']; g.ev({ t: 'bark', who: 'Агнус', text: L[Math.floor(g.rng() * L.length)] }); }
      const alive = g.foes.filter(f => f.type === 'gladius' && !f.dead && f.st !== 'held').length + (p.holding ? 1 : 0);
      e.cd -= DT;
      if (alive < 4 && e.cd <= 0) { const f = S.spawnFoe(g, 'gladius', -4 + g.rng() * 8, 8, { y: 6 }); f.minion = true; f.catchable = true; f.noLockBoss = true; e.cd = 1.8; }
      e.elec -= DT;
      if (!e.warn && !e.elecOn && e.elec < 1.3) { e.warn = true; g.sfx('buzz', 0, 0, 0); g.ev({ t: 'elecwarn' }); if (!g.flags.tipElec) { g.flags.tipElec = true; g.msg('Пол под напряжением! Прыгайте или встаньте на платформу.', 3.5, 'tip'); } }
      if (e.elec <= 0 && !e.elecOn) { e.elecOn = true; e.elecT = 1.5; g.sfx('zap', 0, 0, 0); }
      if (e.elecOn) {
        e.elecT -= DT;
        if (p.ground && p.y < 0.4 && p.invul <= 0) S.hurtPlayer(g, 11, null, { kb: 2, kind: 'elec' });
        if (e.elecT <= 0) { e.elecOn = false; e.warn = false; e.elec = 6 + g.rng() * 2.5; }
      }
      g.elec = e.elecOn ? 2 : e.warn ? 1 : 0;
    },
    onDeath() {},
    dying(g, e) { e.pose = 'kneel'; }
  };

  AI.credo = {
    init(g, e) { e.guardDmg = 0; e.guardMax = 190 * g.diff.hpMul; e.stunT = 0; e.stunDmg = 0; e.busterDmg = 380; e.zipY = 0.3; e.phase2 = false; e.blockLog = []; e.m = S.model('credoAngelo'); },
    busterable(g, e) { return e.stunT > 0; },
    dmgMul(g, e) { return e.stunT > 0 ? 1.4 : 1; },
    guard(g, e, h) {
      if (e.stunT > 0 || (e.atk && e.atk.name !== 'guard')) return null;
      const p = g.player, a = Math.abs(wrapAng(Math.atan2(p.x - e.x, p.z - e.z) - e.face));
      if (a > 1.4) return null;
      e.guardDmg += h.dmg * (h.ex ? 2 : 1) * (h.gun ? 0.4 : 1) + (h.key === 'charge' ? 45 : 0) + (p.dtOn ? h.dmg * 0.6 : 0);
      e.blockLog.push(g.t); e.blockLog = e.blockLog.filter(t => g.t - t < 1.5);
      if (e.guardDmg >= e.guardMax) { e.guardDmg = 0; AI.credo.stun(g, e, 4.2); g.sfx('shieldbreak', e.x, e.y + 1, e.z); g.styleHit('guardbreak', 50, false); return 'block'; }
      if (e.blockLog.length >= 4 && !e.atk) { e.blockLog = []; begin(e, 'counter', 0.8, { anim: 'slashE' }); }
      return 'block';
    },
    stun(g, e, t) { e.stunT = t; e.atk = null; e.pose = 'kneel'; e.anim = null; e.stunDmg = 0; g.sfx('credohurt', e.x, e.y + 1, e.z); if (!g.flags.tipCredo) { g.flags.tipCredo = true; g.msg('Щит Кредо разбит! Buster (L)!', 4, 'tip'); } },
    onHit(g, e) { if (e.stunT <= 0 && e.stunDmg > 750 * g.diff.hpMul) AI.credo.stun(g, e, 3); return false; },
    afterBuster(g, e) { e.stunT = Math.min(e.stunT, 0.7); },
    update(g, e) {
      const p = g.player, d = distP(e, g);
      if (!e.phase2 && e.hp < e.maxHp * 0.5) { e.phase2 = true; g.ev({ t: 'bark', who: 'Кредо', text: 'Я не позволю тебе пройти, Неро! Ради Ордена!' }); }
      if (e.stunT > 0) { e.stunT -= DT; e.pose = 'kneel'; stop(e); S.foePhysics(g, e); if (e.stunT <= 0) { e.pose = null; begin(e, 'guard', 1, { anim: 'shieldE' }); } return; }
      e.pose = null;
      const A = e.atk, sp = e.phase2 ? 1.35 : 1;
      if (!A) {
        e.cd -= DT * g.diff.aggr * sp;
        turn(e, g, 7);
        if (d > 6) walk(e, g, 1, 5); else if (d < 2.5) walk(e, g, -0.5, 4, e.strafe); else walk(e, g, 0, 3.5, e.strafe);
        e.anim = null; e.combat = 4;
        if (e.cd <= 0) {
          const r = g.rng();
          if (d > 8 && r < 0.45) begin(e, 'dash', 1.2, { anim: 'thrustE' });
          else if (r < 0.28) begin(e, 'spears', e.phase2 ? 3.6 : 2.8, { anim: 'spearThrow' });
          else if (e.phase2 && r < 0.42) begin(e, 'rain', 2, { anim: 'high' });
          else if (d < 4 && r < 0.75) begin(e, 'combo', 1.5, { anim: 'slashE' });
          else if (d < 3 && r < 0.9) begin(e, 'bash', 0.9, { anim: 'thrustE' });
          else begin(e, 'guard', 1.4 + g.rng(), { anim: 'shieldE' });
        } else if (!e.atk && g.rng() < 0.01) begin(e, 'guard', 1.2, { anim: 'shieldE' });
        S.foePhysics(g, e);
        return;
      }
      A.t += DT; e.animU = Math.min(1, A.t / A.dur);
      switch (A.name) {
        case 'guard': stop(e); turn(e, g, 9); e.anim = null; e.pose = null; break;
        case 'combo': if (A.t < 1.1) turn(e, g, 5); stop(e); e.anim = A.t < 0.5 ? 'slashE' : A.t < 1 ? 'overE' : 'thrustE'; e.animU = (A.t % 0.5) / 0.5; for (const [k, dm, kn] of [[0.32, 9, false], [0.78, 9, false], [1.22, 13, true]]) if (at(e, k, k)) { e.vx = Math.sin(e.face) * 6; e.vz = Math.cos(e.face) * 6; strike(g, e, { reach: 3.3, arc: 130, dmg: dm, knock: kn, kb: 8 }); g.sfx('swingE', e.x, e.y + 1, e.z); } break;
        case 'counter': stop(e); if (A.t < 0.25) turn(e, g, 12); if (at(e, 0.3, 'c')) { strike(g, e, { reach: 3.4, arc: 160, dmg: 13, knock: true, kb: 9 }); g.sfx('swing3', e.x, e.y + 1, e.z); g.ev({ t: 'bark', who: 'Кредо', text: 'Наивно!' }); } break;
        case 'bash': stop(e); if (at(e, 0.35, 'b')) { e.vx = Math.sin(e.face) * 8; e.vz = Math.cos(e.face) * 8; strike(g, e, { reach: 2.4, arc: 90, dmg: 8, knock: true, kb: 11 }); g.sfx('clang', e.x, e.y + 1, e.z); } break;
        case 'dash': if (A.t < 0.4) { stop(e); turn(e, g, 10); } else if (A.t < 0.95) { e.vx = Math.sin(e.face) * 21; e.vz = Math.cos(e.face) * 21; if (!A.hit && strike(g, e, { reach: 1.8, arc: 70, dmg: 16, knock: true, kb: 10 })) A.hit = true; } else stop(e); if (at(e, 0.4, 's')) g.sfx('stinger', e.x, e.y + 1, e.z); break;
        case 'spears': {
          stop(e); turn(e, g, 6);
          if (A.t < 0.6) { e.vy = 7; e.ground = false; }
          else e.vy = Math.max(e.vy, 0) * 0.9 + 26 * DT;
          const n = e.phase2 ? 5 : 3;
          for (let i = 0; i < n; i++) if (at(e, 0.9 + i * 0.45, 's' + i)) { S.foeShot(g, e, 'spear', 28, 12, { hy: 1.6 }); g.sfx('spear', e.x, e.y + 2, e.z); }
          if (A.t > A.dur - 0.5) e.vy = -8;
          break;
        }
        case 'rain': stop(e); if (at(e, 0.6, 'r')) { for (let i = 0; i < 8; i++) { const a = g.rng() * PI * 2, r = i === 0 ? 0 : 1.5 + g.rng() * 6; S.spearRain(g, p.x + Math.sin(a) * r, p.z + Math.cos(a) * r, 0.9 + i * 0.1); } g.sfx('cast', e.x, e.y + 2, e.z); } break;
        default: stop(e);
      }
      S.foePhysics(g, e, A.name === 'spears' ? 0.2 : 1);
      if (A.t >= A.dur) { e.atk = null; e.anim = null; e.st = 'idle'; e.cd = (0.5 + g.rng() * 1) / sp; }
    },
    onDeath() {},
    dying(g, e) { e.pose = 'kneel'; }
  };

  S.startBoss = startBoss; S.updateBoss = updateBoss; S.bossDefeated = bossDefeated;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
