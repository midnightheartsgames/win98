(function (S) {
  'use strict';
  const { clamp, wrapAng } = S;
  const D = S.DATA, PL = D.PLAYER, MV = D.MOVES;
  const DT = 1 / 60, PI = Math.PI, BUF = 0.24;

  function newPlayer(g) {
    return { team: 'hero', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, face: 0, r: PL.r, h: PL.h, hp: g.maxHp, st: 'move', move: null, mt: 0, ground: true, jumps: 0, hiked: false, airCombo: 0,
      lock: null, exceed: 0, exWin: -9, dt: 0, dtOn: false, charge: 0, gunHeld: false, invul: 0, buf: {}, runT: 0, lastMove: null, lastEnd: -9, awayT: -9, hitDone: new Set(),
      anim: null, animU: 0, phase: 0, moveK: 0, combat: 0, holding: null, grabbed: null, safe: [0, 0, 0], doorCool: 0, airShots: 0, t: 0 };
  }

  function bufferInput(g, inp) {
    const b = g.player.buf;
    for (const k of ['sword', 'gun', 'bring', 'jump', 'exceed', 'dtk', 'taunt']) if (inp[k]) b[k] = g.t;
  }
  const fresh = (g, k) => g.player.buf[k] != null && g.t - g.player.buf[k] <= BUF;
  const eat = (g, k) => { g.player.buf[k] = null; };

  function moveDir(inp) {
    const mx = inp.mx || 0, mz = inp.mz || 0, m = Math.hypot(mx, mz);
    if (m < 0.2) return null;
    const cy = inp.cam || 0, fx = Math.sin(cy), fz = Math.cos(cy), rx = -Math.cos(cy), rz = Math.sin(cy);
    const wx = fx * mz + rx * mx, wz = fz * mz + rz * mx, l = Math.hypot(wx, wz) || 1;
    return { x: wx / l, z: wz / l, m: Math.min(1, m) };
  }
  function faceTo(p, x, z) { p.face = Math.atan2(x - p.x, z - p.z); }
  function turnTo(p, a, rate) { const d = wrapAng(a - p.face); p.face = wrapAng(p.face + clamp(d, -rate * DT, rate * DT)); }

  function targets(g) { return g.foes.filter(e => !e.dead && !e.spawnT && !e.hidden && e.st !== 'grabbed'); }
  function lockables(g) {
    const L = targets(g).filter(e => !e.noLock);
    if (g.boss && g.boss.lures) for (const l of g.boss.lures) if (l.on) L.push(l);
    return L;
  }
  function pickLock(g, inp) {
    const p = g.player, cy = inp.cam || p.face; let best = null, bs = Infinity;
    for (const e of lockables(g)) {
      const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz); if (d > 28) continue;
      const a = Math.abs(wrapAng(Math.atan2(dx, dz) - cy));
      const s = d + a * 6 - (e.boss ? 4 : 0) - (e.lure ? 12 : 0);
      if (s < bs) { bs = s; best = e; }
    }
    return best;
  }
  function softTarget(g, face, range, cone) {
    const p = g.player; let best = null, bs = Infinity;
    for (const e of targets(g)) {
      const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz) - e.r; if (d > range) continue;
      if (Math.abs(e.y - p.y) > 3 + (e.h || 2)) continue;
      const a = Math.abs(wrapAng(Math.atan2(dx, dz) - face)); if (a > cone) continue;
      const s = d + a * 2; if (s < bs) { bs = s; best = e; }
    }
    return best;
  }

  function canAct(p) {
    if (p.st === 'move' || p.st === 'air') return true;
    if (p.st === 'act' && p.move && MV[p.move] && p.mt >= (MV[p.move].open || MV[p.move].dur)) return true;
    if (p.st === 'act' && p.special === 'shoot' && p.mt >= 0.18) return true;
    return false;
  }

  function startMove(g, key, dir) {
    const p = g.player, m = MV[key];
    p.st = 'act'; p.move = key; p.special = null; p.mt = 0; p.hitDone.clear(); p.combat = 4; p.followed = false; p.landed = false;
    p.anim = key; p.animU = 0;
    let ex = 0;
    if (p.exceed >= 1) { ex = m.ex ? Math.min(Math.floor(p.exceed), m.ex) : 1; p.exceed -= ex; g.sfx('exfire', p.x, p.y, p.z); }
    p.exLv = ex;
    if (p.lock && !p.lock.dead) faceTo(p, p.lock.x, p.lock.z);
    else {
      const f = dir ? Math.atan2(dir.x, dir.z) : p.face;
      const t = softTarget(g, f, 5.5, 1.3);
      p.face = t ? Math.atan2(t.x - p.x, t.z - p.z) : f;
    }
    if (m.air) {
      if (m.plunge) { p.vy = 4; }
      else { p.vy = Math.max(p.vy, 1.2); }
      p.vx *= 0.3; p.vz *= 0.3;
    } else { p.vx *= 0.2; p.vz *= 0.2; }
    if (m.sfx) g.sfx(m.sfx, p.x, p.y + 1, p.z);
    if (m.arc && m.hits.length) g.ev({ t: 'swoosh', who: p, at: m.hits[0].t, arc: m.arc, ex, dt: p.dtOn });
  }

  function special(g, kind, dur) {
    const p = g.player;
    p.st = 'act'; p.move = null; p.special = kind; p.mt = 0; p.sdur = dur; p.anim = kind; p.animU = 0; p.combat = 4;
  }

  function swordInput(g, dir, rel) {
    const p = g.player;
    const since = g.t - p.lastEnd;
    if (!p.ground) {
      if (p.lock && rel === 'toward' && g.has('split')) return startMove(g, 'split', dir);
      if (p.lock && rel === 'toward' && g.t - p.awayT < 0.4 && g.has('calibur')) return startMove(g, 'calibur', dir);
      if (p.airCombo >= 3) return;
      let next = 'air1';
      if (p.st === 'act' && p.move === 'air1') next = 'air2';
      else if (p.st === 'act' && p.move === 'air2') next = 'air3';
      else if (p.lastMove === 'air2' && since > 0.08 && since < 0.5 && g.has('roulette')) next = 'roulette';
      else if (p.lastMove === 'air1' && since < 0.3) next = 'air2';
      else if (p.lastMove === 'air2' && since < 0.08) next = 'air3';
      p.airCombo++;
      return startMove(g, next, dir);
    }
    if (p.lock && rel === 'toward' && g.t - p.awayT < 0.45 && g.t - p.awayT > 0.05 && g.has('shuffle')) return startMove(g, 'shuffle', dir);
    if (p.lock && rel === 'toward') return startMove(g, 'streak', dir);
    if (p.lock && rel === 'away') return startMove(g, 'highroller', dir);
    let next = 'a1';
    if (p.st === 'act' && p.move) {
      const i = D.COMBO_A.indexOf(p.move);
      if (i >= 0 && i < 3) next = D.COMBO_A[i + 1];
      else if (p.move === 'b3') next = 'b4';
    } else if (p.lastMove) {
      const i = D.COMBO_A.indexOf(p.lastMove), close = MV[p.lastMove] && MV[p.lastMove].close;
      if (p.lastMove === 'a2' && since > 0.12 && since < 0.55) next = 'b3';
      else if (i >= 0 && i < 3 && close && since < close - MV[p.lastMove].dur) next = D.COMBO_A[i + 1];
      else if (p.lastMove === 'b3' && since < 0.3) next = 'b4';
    }
    startMove(g, next, dir);
  }

  function fireGun(g, charged, lv) {
    const p = g.player, G = D.GUN;
    let t = p.lock && !p.lock.dead ? p.lock : softTarget(g, p.face, G.range, 0.35);
    if (t && t.lure) t = null;
    let ex = p.x + Math.sin(p.face) * G.range, ey = p.y + 1.3, ez = p.z + Math.cos(p.face) * G.range;
    if (t) { ex = t.x; ey = t.y + (t.hitY || (t.h || 2) * 0.55); ez = t.z; faceTo(p, t.x, t.z); }
    const ox = p.x + Math.sin(p.face) * 0.5, oy = p.y + 1.35, oz = p.z + Math.cos(p.face) * 0.5;
    const dx = ex - ox, dy = ey - oy, dz = ez - oz, d = Math.hypot(dx, dy, dz) || 1;
    const wall = g.W.ray(ox, oy, oz, dx / d, dy / d, dz / d, d);
    const hitT = t && wall >= d - 0.5 ? t : null;
    const hx = ox + dx / d * Math.min(wall, d), hy = oy + dy / d * Math.min(wall, d), hz = oz + dz / d * Math.min(wall, d);
    if (charged) {
      g.shots.push({ kind: 'charge', lv, x: ox, y: oy, z: oz, vx: dx / d * 42, vy: dy / d * 42, vz: dz / d * 42, life: 1.2, r: 0.4, team: 'hero', target: hitT });
      g.sfx('charge' + lv, ox, oy, oz); g.ev({ t: 'muzzle', x: ox, y: oy, z: oz, big: true });
      return;
    }
    g.ev({ t: 'tracer', x0: ox, y0: oy, z0: oz, x1: hx, y1: hy, z1: hz });
    g.sfx('gun', ox, oy, oz);
    if (hitT) {
      if (hitT.shotHit) hitT.shotHit(g, hitT, G.dmg);
      else if (S.hitFoe(g, hitT, { dmg: G.dmg * (p.dtOn ? PL.dtDmg : 1), stun: G.stun, juggle: G.juggle, kb: 0.2, key: 'gun', gun: true, fromX: p.x, fromZ: p.z, hstop: 0 })) g.styleHit('gun', G.style, !hitT.ground);
    } else S.shootObjects(g, ox, oy, oz, hx, hy, hz);
    if (!p.ground && p.airShots < 6) { p.airShots++; p.vy = Math.max(p.vy, 0.5); }
  }

  function tryBuster(g, e) {
    const p = g.player;
    if (e.busterable && !e.busterable(g, e)) {
      p.st = 'hurt'; p.mt = 0; p.hdur = 0.35; p.anim = 'hurt'; const a = Math.atan2(p.x - e.x, p.z - e.z); p.vx = Math.sin(a) * 6; p.vz = Math.cos(a) * 6;
      g.sfx('clang', e.x, e.y + 1, e.z); g.ev({ t: 'hit', x: (p.x + e.x) / 2, y: p.y + 1.2, z: (p.z + e.z) / 2, kind: 'block' });
      g.msg('Рука дьявола отскакивает. Сначала оглушите его!', 2.2);
      return;
    }
    special(g, p.ground ? 'buster' : 'busterAir', D.BUSTER.dur);
    p.grabbed = e; faceTo(p, e.x, e.z);
    e.st = 'grabbed'; e.stT = 0; e.grabBy = p; e.vx = e.vz = 0;
    g.sfx('grab', p.x, p.y + 1, p.z);
    if (e.onGrab) e.onGrab(g, e);
  }
  function doBuster(g) {
    const p = g.player, e = p.grabbed; if (!e) return;
    const B = D.BUSTER, fx = Math.sin(p.face), fz = Math.cos(p.face);
    const heavy = e.heavy >= 1;
    let dmg = (e.boss ? (e.busterDmg || 300) : heavy ? B.heavy : B.dmg) * (p.dtOn ? 1.6 : 1) * (p.ground ? 1 : B.air + 0.2);
    const sx = p.x + fx * 1.6, sz = p.z + fz * 1.6;
    e.grabBy = null; p.grabbed = null;
    if (e.boss) e.st = 'idle';
    else { e.st = 'hurt'; e.x = sx; e.z = sz; e.y = g.W.groundAt(sx, sz, e.r, p.y + 2); if (!isFinite(e.y)) e.y = p.y; }
    S.hitFoe(g, e, { dmg, knock: !e.boss, kb: 5, up: 3, stun: 1.2, key: 'buster', raw: true, fromX: p.x, fromZ: p.z, buster: true, hstop: 0.14 });
    for (const o of targets(g)) if (o !== e && Math.hypot(o.x - sx, o.z - sz) < B.aoe + o.r) S.hitFoe(g, o, { dmg: B.aoeDmg, knock: true, kb: 6, up: 3, stun: 0.8, key: 'buster', fromX: sx, fromZ: sz, raw: true });
    g.styleHit(e.boss ? 'busterBoss' : 'buster', B.style * (p.dtOn ? 1.3 : 1), !p.ground);
    g.shake = Math.max(g.shake, 0.7); g.hitstop = Math.max(g.hitstop, 0.12);
    g.ev({ t: 'slam', x: sx, y: e.y, z: sz, dt: p.dtOn }); g.sfx('buster', sx, p.y, sz);
    if (p.dtOn) g.ev({ t: 'flash', c: [0.4, 0.5, 1], a: 0.4 });
    if (e.afterBuster) e.afterBuster(g, e);
    if (e.boss) g.dropOrbs(sx, e.y + 1, sz, 30, 'red');
    if (p.dt < g.dtMax && g.save.dt) p.dt = Math.min(g.dtMax, p.dt + 25);
  }

  function bringerInput(g, dir) {
    const p = g.player;
    if (p.holding) { S.throwHeld(g); return; }
    const lock = p.lock && !p.lock.dead ? p.lock : null;
    const snatchR = g.has('snatch2') ? PL.snatch2 : PL.snatch;
    if (lock) {
      const d = Math.hypot(lock.x - p.x, lock.z - p.z) - (lock.r || 0.5);
      if (!lock.lure && d <= PL.grab && Math.abs(lock.y - p.y) < 2.5 + (lock.h || 2) * 0.5) return tryBuster(g, lock);
      if (d <= snatchR + 4) return snatch(g, lock);
    }
    const f = dir ? Math.atan2(dir.x, dir.z) : p.face;
    for (const o of g.objs) if (o.kind === 'gyroMachine' && Math.hypot(o.x - p.x, o.z - p.z) < 3.2) { special(g, 'buster', 0.7); S.spawnGyro(g, o); return; }
    const near = softTarget(g, f, PL.grab, 1.1);
    if (near) return tryBuster(g, near);
    const grip = pickGrip(g, f, g.has('snatch2') ? PL.gripRange + 5 : PL.gripRange);
    if (grip) return hellbound(g, grip);
    const far = softTarget(g, f, snatchR, 0.5);
    if (far) return snatch(g, far);
    special(g, 'snatch', 0.4); g.sfx('snatch', p.x, p.y + 1, p.z);
    g.ev({ t: 'arm', who: p, x: p.x + Math.sin(f) * 6, y: p.y + 1.3, z: p.z + Math.cos(f) * 6, dur: 0.3 });
  }
  function pickGrip(g, f, range) {
    const p = g.player; let best = null, bs = Infinity;
    if (!g.flags.evilLegacy && g.M.id === 'm2') return null;
    for (const o of g.objs) {
      if (o.kind !== 'grip') continue;
      const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz, o.y - p.y); if (d > range || d < 1.5) continue;
      const a = Math.abs(wrapAng(Math.atan2(dx, dz) - f)); if (a > 1.1) continue;
      const s = d + a * 8; if (s < bs) { bs = s; best = o; }
    }
    return best;
  }
  function hellbound(g, grip) {
    const p = g.player;
    special(g, 'hellbound', 3); p.zip = { x: grip.x, y: grip.y - 1.9, z: grip.z, grip: true, stop: 0.3 };
    faceTo(p, grip.x, grip.z); g.sfx('snatch', p.x, p.y + 1, p.z);
    g.ev({ t: 'arm', who: p, x: grip.x, y: grip.y, z: grip.z, dur: 0.6, hold: true });
    g.styleHit('hellbound', 6, true);
  }
  function snatch(g, e) {
    const p = g.player;
    special(g, 'snatch', 0.45); faceTo(p, e.x, e.z);
    g.sfx('snatch', p.x, p.y + 1, p.z);
    g.ev({ t: 'arm', who: p, x: e.x, y: e.y + (e.hitY || 1.2), z: e.z, dur: 0.25 });
    if (e.onSnatch && e.onSnatch(g, e) === false) return;
    if (e.lure || e.boss || e.heavy >= 2) {
      p.zip = { x: e.x, y: e.lure ? e.y - 1 : e.boss ? e.y + (e.zipY || 0) : e.y, z: e.z, stop: (e.r || 0.5) + 1.1, target: e };
      p.special = 'hellbound'; p.sdur = 2;
    } else {
      e.st = 'pulled'; e.stT = 0; e.pullTo = p; e.atk = null; S.releaseToken(g, e);
    }
    g.styleHit('snatch', 18, !p.ground);
  }

  function jumpInput(g, dir, rel) {
    const p = g.player;
    if (p.ground) {
      if (p.lock && rel === 'side') { p.st = 'roll'; p.mt = 0; p.anim = 'roll'; p.rollDir = { x: dir.x, z: dir.z }; g.sfx('roll', p.x, p.y, p.z); return; }
      if (p.lock && rel === 'away') { p.vy = PL.jump * 0.8; p.vx = dir.x * 7; p.vz = dir.z * 7; p.ground = false; p.st = 'air'; p.invul = Math.max(p.invul, 0.3); p.flip = 0.6; g.sfx('jump', p.x, p.y, p.z); return; }
      p.vy = PL.jump; p.ground = false; p.st = 'air'; p.airCombo = 0; p.hiked = false; p.airShots = 0;
      g.sfx('jump', p.x, p.y, p.z);
      return;
    }
    for (const e of targets(g)) {
      const dh = Math.hypot(e.x - p.x, e.z - p.z) - (e.r || 0.5);
      if (dh < 1.4 && p.y > e.y - 1 && p.y < e.y + (e.h || 2) + 1.2) {
        p.vy = PL.stepJump; p.st = 'air'; p.airCombo = 0; p.hiked = false; p.airShots = 0;
        g.styleHit('estep', 12, true); g.sfx('estep', p.x, p.y, p.z); g.ev({ t: 'hit', x: p.x, y: p.y, z: p.z, kind: 'step' });
        return;
      }
    }
    if (g.has('airHike') && !p.hiked) { p.hiked = true; p.vy = PL.hike; p.st = 'air'; g.sfx('hike', p.x, p.y, p.z); g.ev({ t: 'hike', x: p.x, y: p.y, z: p.z }); }
  }

  function applyHits(g, key, m, exLv) {
    const p = g.player;
    m.hits.forEach((h, i) => {
      if (p.hitDone.has(i) || p.mt < h.t) return;
      p.hitDone.add(i);
      const fx = Math.sin(p.face), fz = Math.cos(p.face), cosA = Math.cos((h.arc / 2) * PI / 180);
      let n = 0;
      const mul = (p.dtOn ? PL.dtDmg : 1) * (exLv ? PL.exMul : 1);
      for (const e of targets(g)) {
        const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz);
        if (d - e.r > h.reach) continue;
        if (h.arc < 360 && d > 0.3 && (dx * fx + dz * fz) / d < cosA) continue;
        const top = e.y + (e.h || 2), bot = e.y;
        if (p.y + 2.1 < bot || p.y - 0.9 > top) continue;
        const ok = S.hitFoe(g, e, { dmg: h.dmg * mul, kb: h.kb, up: h.up, stun: h.stun, knock: h.knock, juggle: h.juggle, launch: h.launch, key, fromX: p.x, fromZ: p.z, air: !p.ground, sword: true, ex: exLv, hy: p.y + 1.2, hstop: h.hstop });
        if (ok) {
          n++;
          if (exLv) S.hitFoe(g, e, { dmg: 7 * exLv, key: 'exfire', fire: true, raw: true, fromX: p.x, fromZ: p.z, stun: 0.05 });
        }
      }
      S.swordObjects(g, h);
      if (n) {
        p.exWin = g.t;
        const st = m.style * (1 + 0.25 * (n - 1)) * (exLv ? 1.3 : 1);
        g.styleHit(key, st, !p.ground);
        g.hitstop = Math.max(g.hitstop, h.hstop * (exLv ? 1.4 : 1));
        if (g.save.dt && !p.dtOn) p.dt = Math.min(g.dtMax, p.dt + PL.dtGain * n);
        if (m.shake) g.shake = Math.max(g.shake, m.shake);
        if (!p.ground) p.vy = Math.max(p.vy, m.hover ? 0.8 : p.vy);
      }
    });
  }

  function exceedInput(g) {
    const p = g.player, since = g.t - p.exWin;
    if (since >= 0 && since <= PL.exAct && p.exceed < 3 && p.st === 'act' && p.move) {
      const perfect = since <= PL.maxAct && g.has('maxAct');
      const gain = perfect ? 3 : 1;
      p.exceed = Math.min(3, Math.floor(p.exceed) + gain); p.exWin = -9;
      g.sfx(perfect ? 'maxact' : 'exact', p.x, p.y + 1, p.z);
      g.ev({ t: 'exact', max: perfect });
      g.styleHit('exact', perfect ? 30 : 14, false);
      return;
    }
    p.exceed = Math.min(3, p.exceed + PL.revTap);
    g.sfx('rev', p.x, p.y + 1, p.z);
    g.ev({ t: 'rev' });
  }

  function dtInput(g) {
    const p = g.player;
    if (!g.save.dt) { g.hintMsg('Devil Trigger ещё не пробуждён.'); return; }
    if (p.dtOn) { p.dtOn = false; g.sfx('dtoff', p.x, p.y + 1, p.z); return; }
    if (p.dt < PL.dtMin) { g.hintMsg('Шкала Devil Trigger не заполнена.'); return; }
    special(g, 'dt', 0.6); p.invul = Math.max(p.invul, 0.7); p.dtBurst = false;
  }

  function hurtPlayer(g, dmg, from, o = {}) {
    const p = g.player;
    if (p.dead || g.cut || g.state !== 'play') return false;
    if (p.invul > 0 || p.st === 'grab' || p.special === 'buster' || p.special === 'busterAir' || p.special === 'dt' || p.st === 'door') return false;
    if (p.st === 'roll' && p.mt >= PL.iframesRoll[0] && p.mt <= PL.iframesRoll[1]) { if (!p.dodged) { p.dodged = true; g.styleHit('dodge', 20, false); } return false; }
    const d = dmg * g.diff.dmgIn * (p.dtOn ? 0.75 : 1) * (g.o.god ? 0 : 1);
    p.hp -= d; g.stats.dmg += d;
    g.styleHurt();
    if (g.save.dt && !p.dtOn) p.dt = Math.min(g.dtMax, p.dt + PL.dtGainHurt);
    g.ev({ t: 'hurt', x: p.x, y: p.y + 1.2, z: p.z, kind: o.kind || 'hit' }); g.sfx('hurt', p.x, p.y + 1, p.z);
    if (p.grabbed) { const e = p.grabbed; e.st = 'hurt'; e.stT = 0; e.grabBy = null; p.grabbed = null; }
    if (p.holding && o.knock) S.dropHeld(g);
    if (p.hp <= 0) { p.hp = 0; g.die(); return true; }
    const fx = from ? p.x - from.x : -Math.sin(p.face), fz = from ? p.z - from.z : -Math.cos(p.face), fl = Math.hypot(fx, fz) || 1;
    if (p.dtOn && !o.knock && dmg < 14) { p.invul = 0.25; return true; }
    p.special = null; p.move = null;
    if (o.knock) {
      p.st = 'knock'; p.mt = 0; p.anim = 'knock'; p.vx = fx / fl * (o.kb || 7); p.vz = fz / fl * (o.kb || 7); p.vy = o.up || 6; p.ground = false; p.invul = 0.2;
      p.face = Math.atan2(-fx, -fz);
    } else {
      p.st = 'hurt'; p.mt = 0; p.hdur = 0.38; p.anim = 'hurt'; p.vx = fx / fl * (o.kb || 3); p.vz = fz / fl * (o.kb || 3); p.invul = 0.35;
    }
    if (o.freeze) { p.frozen = o.freeze; }
    return true;
  }

  function physics(g, gravScale = 1) {
    const p = g.player, W = g.W;
    p.vy -= PL.grav * gravScale * DT; if (p.vy < -PL.termVel) p.vy = -PL.termVel;
    p.x += p.vx * DT; p.z += p.vz * DT;
    W.collide(p);
    const gy = W.groundAt(p.x, p.z, p.r, p.y + 0.1);
    const wasGround = p.ground;
    p.y += p.vy * DT;
    if (p.vy <= 0 && p.y <= gy + 0.02) { p.y = gy; p.vy = 0; p.ground = true; }
    else if (wasGround && p.vy <= 0 && gy > p.y - 0.5 && gy <= p.y + 0.02) { p.y = gy; p.vy = 0; p.ground = true; }
    else if (p.y > gy + 0.05) p.ground = false;
    const ceil = W.ray(p.x, p.y + 1, p.z, 0, 1, 0, p.h - 0.9);
    if (p.vy > 0 && ceil < p.h - 1) p.vy = 0;
    if (p.ground && !wasGround) { g.sfx('land', p.x, p.y, p.z, 0.6); p.airCombo = 0; p.hiked = false; p.airShots = 0; }
    if (p.ground && p.st !== 'zip' && isFinite(gy) && !S.inHazard(g, p.x, p.z)) { const s = p.safe; s[0] = p.x; s[1] = p.y; s[2] = p.z; }
    if (p.y < (g.W.voidY)) {
      p.x = p.safe[0]; p.y = p.safe[1] + 0.2; p.z = p.safe[2]; p.vx = p.vy = p.vz = 0; p.st = 'move'; p.special = null; p.move = null;
      p.invul = 1; g.ev({ t: 'flash', c: [0, 0, 0], a: 1 }); g.sfx('fall');
      hurtPlayer(g, 10, null, {}); if (p.st === 'hurt') p.st = 'move';
    }
  }

  function updatePlayer(g, inp) {
    const p = g.player;
    p.t += DT; p.mt += DT;
    p.invul = Math.max(0, p.invul - DT); p.doorCool = Math.max(0, p.doorCool - DT); p.combat = Math.max(g.fight || (g.boss && !g.boss.won) ? 1 : 0, p.combat - DT);
    if (p.flip) p.flip = Math.max(0, p.flip - DT);
    bufferInput(g, inp);
    if (p.dead) { p.anim = 'dead'; p.animU = Math.min(1, p.mt / 1.2); physics(g); return; }
    const dir = moveDir(inp);
    if (inp.lock) { if (!p.lock || p.lock.dead || p.lock.gone || (p.lock.lure && !p.lock.on) || (p.lock.lures && p.lock.lures.some(l => l.on))) p.lock = pickLock(g, inp); }
    else p.lock = null;
    let rel = null;
    if (p.lock && dir) {
      const tx = p.lock.x - p.x, tz = p.lock.z - p.z, tl = Math.hypot(tx, tz) || 1, dot = (dir.x * tx + dir.z * tz) / tl;
      rel = dot > 0.5 ? 'toward' : dot < -0.5 ? 'away' : 'side';
      if (rel === 'away') p.awayT = g.t;
    }
    if (p.dtOn) { p.dt -= PL.dtDrain * DT; p.hp = Math.min(g.maxHp, p.hp + PL.dtRegen * DT); if (p.dt <= 0) { p.dt = 0; p.dtOn = false; g.sfx('dtoff', p.x, p.y + 1, p.z); } }
    if (inp.gunHeld) { p.gunHeld = true; p.charge += DT; const lv = chargeLevel(g, p.charge); if (lv > (p.chargeLv || 0)) { p.chargeLv = lv; g.sfx('chargeup', p.x, p.y + 1, p.z, 0.5); } }
    if (fresh(g, 'exceed')) { eat(g, 'exceed'); exceedInput(g); }
    if (p.frozen) { p.frozen -= DT; if (fresh(g, 'jump') || fresh(g, 'sword')) { p.frozen -= 0.25; eat(g, 'jump'); eat(g, 'sword'); } if (p.frozen > 0) { p.vx = p.vz = 0; physics(g); return; } p.frozen = 0; g.sfx('icebreak', p.x, p.y + 1, p.z); }

    if (canAct(p)) {
      const rel2 = rel;
      if (!inp.gunHeld && p.gunHeld) {
        p.gunHeld = false; const lv = chargeLevel(g, p.charge); p.charge = 0; p.chargeLv = 0;
        if (lv > 0) { special(g, 'shoot', 0.4); fireGun(g, true, lv); g.styleHit('charge', D.GUN.cstyle[lv - 1], !p.ground); }
      } else if (fresh(g, 'dtk')) { eat(g, 'dtk'); dtInput(g); }
      else if (fresh(g, 'bring')) { eat(g, 'bring'); bringerInput(g, dir); }
      else if (fresh(g, 'sword')) { eat(g, 'sword'); swordInput(g, dir, rel2); }
      else if (fresh(g, 'gun')) { eat(g, 'gun'); special(g, 'shoot', D.GUN.dur); p.shotsDone = 0; if (p.lock && !p.lock.dead) faceTo(p, p.lock.x, p.lock.z); }
      else if (fresh(g, 'jump') && (p.st !== 'act' || p.mt > 0.1)) { eat(g, 'jump'); jumpInput(g, dir || { x: Math.sin(p.face), z: Math.cos(p.face) }, rel2); }
      else if (fresh(g, 'taunt') && p.ground) { eat(g, 'taunt'); special(g, 'taunt', 1.1); p.taunted = false; }
    }
    if (!inp.gunHeld && p.charge > 0 && !p.gunHeld) { p.charge = 0; p.chargeLv = 0; }

    switch (p.st) {
      case 'move': case 'air': {
        const speed = (g.has('speed') && p.runT > 3 ? PL.speedRun : PL.run);
        if (dir) {
          const tv = speed * dir.m, ax = dir.x * tv, az = dir.z * tv, k = Math.min(1, (p.ground ? 14 : 5) * DT);
          p.vx += (ax - p.vx) * k; p.vz += (az - p.vz) * k;
          if (p.lock && !p.lock.dead) turnTo(p, Math.atan2(p.lock.x - p.x, p.lock.z - p.z), 16); else turnTo(p, Math.atan2(dir.x, dir.z), p.ground ? 15 : 6);
          p.runT = p.ground ? p.runT + DT : p.runT;
        } else {
          const k = Math.min(1, (p.ground ? 16 : 0.4) * DT); p.vx -= p.vx * k; p.vz -= p.vz * k; p.runT = 0;
          if (p.lock && !p.lock.dead) turnTo(p, Math.atan2(p.lock.x - p.x, p.lock.z - p.z), 12);
        }
        const sp = Math.hypot(p.vx, p.vz);
        p.moveK = sp / PL.run; p.phase += sp * DT * 1.55;
        if (p.ground && sp > 1 && Math.floor(p.phase / PI) !== Math.floor((p.phase - sp * DT * 1.55) / PI)) g.sfx('step', p.x, p.y, p.z, 0.4);
        p.anim = null; p.st = p.ground ? 'move' : 'air';
        if (p.gunHeld && p.charge > 0.3) { p.anim = 'charge'; p.animU = 0.5; }
        physics(g);
        break;
      }
      case 'act': {
        const m = p.move ? MV[p.move] : null;
        if (m) {
          p.animU = Math.min(1, p.mt / m.dur);
          const fx = Math.sin(p.face), fz = Math.cos(p.face);
          if (m.back && p.mt < m.back) { p.vx = -fx * 9; p.vz = -fz * 9; }
          else if (m.lunge && p.mt >= (m.lungeAt || 0) && p.mt < (m.lungeAt || 0) + m.lungeT) {
            let v = m.lunge; const t = p.lock && !p.lock.dead ? p.lock : null;
            if (m.lungeStop && t && Math.hypot(t.x - p.x, t.z - p.z) - t.r < m.lungeStop) v = 0;
            if (!m.lungeStop) { const s = softTarget(g, p.face, 1.2, 0.8); if (s) v = 0; }
            p.vx = fx * v; p.vz = fz * v;
          } else { p.vx *= 0.8; p.vz *= 0.8; }
          let grav = 1;
          if (m.air) {
            if (m.plunge) { if (p.mt > 0.12) p.vy = -30; grav = 0; }
            else { grav = 1 - (m.hover || 0) * 0.88; if (m.rise && p.mt < m.dur * 0.8) p.vy = m.rise; }
          }
          if (m.follow && !p.followed && p.mt >= m.follow && inp.swordHeld) { p.followed = true; p.vy = PL.jump * 1.08; p.ground = false; g.sfx('jump', p.x, p.y, p.z); }
          applyHits(g, p.move, m, p.exLv);
          physics(g, grav);
          if (m.plunge && p.ground && !p.landed) {
            p.landed = true; const L = m.land, r = L.r * (p.exLv ? 1.4 : 1);
            for (const e of targets(g)) if (Math.hypot(e.x - p.x, e.z - p.z) - e.r < r && Math.abs(e.y - p.y) < 2) S.hitFoe(g, e, { dmg: L.dmg * (p.exLv ? 1.8 : 1) * (p.dtOn ? PL.dtDmg : 1), kb: L.kb, up: L.up, stun: L.stun, knock: true, key: 'split', fromX: p.x, fromZ: p.z, sword: true });
            S.swordObjects(g, { reach: r, arc: 360 });
            g.styleHit('split', m.style, false); g.shake = 0.6; g.ev({ t: 'shock', x: p.x, y: p.y, z: p.z, r, ex: p.exLv }); g.sfx('slam', p.x, p.y, p.z);
            p.move = null; p.special = 'splitLand'; p.anim = 'splitLand'; p.mt = 0; p.sdur = 0.45;
            break;
          }
          if (m.air && p.ground && !m.plunge && p.mt > 0.1) { endAct(g); break; }
          if (p.mt >= m.dur) endAct(g);
        } else runSpecial(g, inp);
        break;
      }
      case 'roll': {
        const k = 1 - p.mt / 0.45; p.vx = p.rollDir.x * PL.rollSpeed * Math.max(0.2, k); p.vz = p.rollDir.z * PL.rollSpeed * Math.max(0.2, k);
        p.anim = 'roll'; p.animU = p.mt / 0.45;
        physics(g);
        if (p.mt >= 0.45) { p.st = 'move'; p.dodged = false; }
        break;
      }
      case 'hurt': {
        p.vx *= 0.88; p.vz *= 0.88; p.anim = 'hurt'; p.animU = p.mt / p.hdur; physics(g);
        if (p.mt >= p.hdur) p.st = p.ground ? 'move' : 'air';
        break;
      }
      case 'knock': {
        p.anim = 'knock'; physics(g);
        if (p.ground && p.mt > 0.15) { p.st = 'down'; p.mt = 0; p.vx = p.vz = 0; g.sfx('land', p.x, p.y, p.z); }
        break;
      }
      case 'down': {
        p.anim = 'down'; physics(g); p.invul = Math.max(p.invul, 0.3);
        if (p.mt >= 0.55 || (p.mt > 0.2 && (fresh(g, 'jump') || dir))) { eat(g, 'jump'); p.st = 'getup'; p.mt = 0; }
        break;
      }
      case 'getup': {
        p.anim = 'getup'; p.animU = p.mt / 0.4; p.invul = Math.max(p.invul, 0.35); physics(g);
        if (p.mt >= 0.4) p.st = 'move';
        break;
      }
      case 'door': p.vx = p.vz = 0; p.anim = null; p.moveK = 0; break;
      case 'board': runSpecial(g, inp); break;
      default: physics(g);
    }
  }

  function chargeLevel(g, t) {
    const C = D.GUN.charge; let lv = 0;
    if (t >= C[0]) lv = 1; if (t >= C[1] && g.has('charge2')) lv = 2; if (t >= C[2] && g.has('charge3')) lv = 3;
    return lv;
  }

  function endAct(g) {
    const p = g.player;
    p.lastMove = p.move || p.lastMove; p.lastEnd = g.t;
    p.st = p.ground ? 'move' : 'air'; p.move = null; p.special = null; p.anim = null;
  }

  function runSpecial(g, inp) {
    const p = g.player, k = p.special;
    p.animU = Math.min(1, p.mt / (p.sdur || 1));
    switch (k) {
      case 'shoot': {
        const G = D.GUN;
        for (let i = 0; i < G.shots.length; i++) if ((p.shotsDone || 0) <= i && p.mt >= G.shots[i]) { p.shotsDone = i + 1; fireGun(g, false); }
        p.vx *= 0.85; p.vz *= 0.85; physics(g, p.ground ? 1 : 0.35);
        if (p.mt >= p.sdur) endAct(g);
        break;
      }
      case 'buster': case 'busterAir': {
        const e = p.grabbed, B = D.BUSTER;
        p.vx = p.vz = 0;
        if (e) {
          const fx = Math.sin(p.face), fz = Math.cos(p.face), u = clamp((p.mt - B.grab) / (B.slam - B.grab), 0, 1);
          if (!e.boss) { e.x = p.x + fx * (1.2 - u * 0.3); e.z = p.z + fz * (1.2 - u * 0.3); e.y = p.y + Math.sin(u * PI) * 2.2 + 0.2; }
          if (p.mt >= B.slam) doBuster(g);
        }
        physics(g, k === 'busterAir' ? 0.3 : 1);
        if (p.mt >= p.sdur) endAct(g);
        break;
      }
      case 'snatch': { p.vx *= 0.7; p.vz *= 0.7; physics(g); if (p.mt >= p.sdur) endAct(g); break; }
      case 'hellbound': {
        const z = p.zip;
        if (!z) { endAct(g); break; }
        if (z.target && (z.target.dead || z.target.gone)) { p.zip = null; p.st = 'air'; p.special = null; break; }
        const tx = z.target ? z.target.x : z.x, tz = z.target ? z.target.z : z.z, ty = z.target ? (z.target.lure ? z.target.y - 1 : z.target.y + (z.target.zipY || 0)) : z.y;
        const dx = tx - p.x, dy = ty - p.y, dz = tz - p.z, d = Math.hypot(dx, dy, dz);
        if (p.mt < 0.12) { physics(g, 0); p.vx = p.vz = 0; p.vy = 0; break; }
        const hd = Math.hypot(dx, dz);
        if (d <= z.stop + 0.15 || hd <= z.stop || p.mt > 1.4) {
          p.zip = null; p.special = null; p.st = 'air'; p.ground = false; p.anim = null; p.airCombo = 0; p.hiked = false;
          if (z.grip) { const l = Math.hypot(p.vx, p.vz) || 1; p.vx = p.vx / l * 9; p.vz = p.vz / l * 9; p.vy = 7.5; }
          else { p.vx *= 0.1; p.vz *= 0.1; p.vy = 4; }
          p.lastMove = 'hellbound'; p.lastEnd = g.t;
          break;
        }
        const v = PL.hellbound / d; p.vx = dx * v; p.vz = dz * v; p.vy = dy * v;
        p.face = Math.atan2(dx, dz);
        p.x += p.vx * DT; p.z += p.vz * DT; p.y += p.vy * DT; g.W.collide(p);
        const gy = g.W.groundAt(p.x, p.z, p.r, p.y + 0.1); if (p.y < gy) p.y = gy;
        break;
      }
      case 'taunt': {
        p.vx = p.vz = 0; physics(g);
        if (!p.taunted && p.mt >= 0.4) { p.taunted = true; if (targets(g).some(e => Math.hypot(e.x - p.x, e.z - p.z) < 22)) { g.styleHit('taunt', 45, false); g.ev({ t: 'taunt' }); } g.sfx('taunt', p.x, p.y + 1, p.z); }
        if (p.mt >= p.sdur) endAct(g);
        break;
      }
      case 'dt': {
        p.vx = p.vz = 0; physics(g, 0.2);
        if (!p.dtBurst && p.mt >= 0.2) {
          p.dtBurst = true; p.dtOn = true;
          for (const e of targets(g)) if (Math.hypot(e.x - p.x, e.z - p.z) < 4.5 + e.r) S.hitFoe(g, e, { dmg: 20, kb: 9, up: 4, knock: !e.boss, stun: 0.8, key: 'dt', fromX: p.x, fromZ: p.z, raw: true });
          g.styleHit('dt', 30, false); g.ev({ t: 'dton', x: p.x, y: p.y, z: p.z }); g.ev({ t: 'flash', c: [0.4, 0.5, 1], a: 0.7 }); g.sfx('dt', p.x, p.y + 1, p.z); g.shake = 0.5;
        }
        if (p.mt >= p.sdur) endAct(g);
        break;
      }
      case 'splitLand': { p.vx = p.vz = 0; physics(g); if (p.mt >= p.sdur) endAct(g); break; }
      case 'hop': { S.boardHop(g); break; }
      default: physics(g); if (p.mt >= (p.sdur || 0.5)) endAct(g);
    }
  }

  S.newPlayer = newPlayer; S.bufferInput = bufferInput; S.updatePlayer = updatePlayer; S.hurtPlayer = hurtPlayer; S.playerPhysics = physics;
  S.chargeLevel = chargeLevel; S.endAct = endAct; S.pSpecial = special; S.faceTo = faceTo;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
