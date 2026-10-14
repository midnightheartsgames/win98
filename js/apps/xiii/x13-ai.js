(function (X) {
  'use strict';
  const W = X.WEAPONS, F = X.F;
  const AI = {};
  X.AI = AI;

  const PROF = {
    beretta: { range: 24, acc: 0.42, burst: [1, 3], pause: [0.6, 1.2] },
    silenced: { range: 24, acc: 0.42, burst: [1, 3], pause: [0.6, 1.2] },
    magnum: { range: 30, acc: 0.55, burst: [1, 2], pause: [0.8, 1.5] },
    shotgun: { range: 13, acc: 0.62, burst: [1, 1], pause: [1.0, 1.5] },
    m16: { range: 38, acc: 0.3, burst: [3, 6], pause: [0.7, 1.4] },
    kalash: { range: 38, acc: 0.28, burst: [3, 6], pause: [0.7, 1.4] },
    sniper: { range: 95, acc: 0.8, burst: [1, 1], pause: [2.4, 3.4] },
    crossbow: { range: 40, acc: 0.6, burst: [1, 1], pause: [2, 3] },
    m60: { range: 40, acc: 0.24, burst: [8, 14], pause: [1.0, 1.7] },
    bazooka: { range: 50, acc: 0.6, burst: [1, 1], pause: [4, 6] }
  };
  AI.PROF = PROF;
  const NONE = { range: 0, acc: 0, burst: [0, 0], pause: [1, 1] };

  function rnd(g, a, b) { return a + (b - a) * g.rng(); }

  AI.init = function (g, ch, s) {
    const mode = s.ai || (ch.team === 'ally' ? 'follow' : ch.team === 'neutral' ? 'civilian' : (s.path ? 'patrol' : 'guard'));
    ch.ai = {
      mode, alert: 0, sus: 0, target: null, lastSeen: null, lastSeenT: -100, seeNow: false, seeT: -100,
      investigate: null, invT: 0, searchT: 0, route: null, ri: 0, goal: null, repathT: 0, run: false,
      percT: g.rng() * 0.2, thinkT: g.rng() * 0.3, fireCd: 0, burst: 0, reactT: 0, strafe: 0, strafeT: 0,
      crouchT: 0, stunT: 0, sayT: -10, alarmGoal: null, alarmT: 0, pi: 0, waitT: rnd(g, 0.5, 2),
      home: ch.pos.slice(), homeYaw: s.lookYaw !== undefined ? s.lookYaw : ch.yaw, order: s.order || (mode === 'follow' ? { type: 'follow' } : null),
      stuckT: 0, lastPos: ch.pos.slice(), grenadeT: g.time + rnd(g, 6, 14), bodies: {}, canAlarm: s.canAlarm !== false,
      sight: s.sight || (mode === 'sniper' ? 70 : 30), aggressive: !!s.aggressive, points: s.points || null, pointI: 0,
      grenadier: !!s.grenadier, static: !!s.static || !!ch.grp, shots: 0, panic: false, pose: s.pose || null, deaf: !!s.deaf,
      scripted: null, lookT: 0, headYaw: 0, memory: 0, phase: 0, taunts: s.taunts || null, tauntT: g.time + 6, spot: s.spot || null, untargetable: !!s.untargetable
    };
    if (s.pose) ch.pose = s.pose;
  };

  AI.save = function (c) { return { order: c.ai.order, mode: c.ai.mode, pi: c.ai.pi, pose: c.pose }; };
  AI.load = function (c, s) {
    if (s.order) c.ai.order = s.order;
    if (s.mode) c.ai.mode = s.mode;
    c.ai.pi = s.pi || 0;
    c.pose = s.pose || null;
  };

  function targetsOf(g, ch) {
    const out = [];
    const p = g.player;
    if (ch.team === 'enemy') {
      if (p.alive && !g.flags.ignorePlayer) out.push(p);
      for (const c of g.chars) if (c.state === 'alive' && (c.team === 'ally' || c.team === 'prisoner') && !c.ai.untargetable) out.push(c);
    } else if (ch.team === 'ally' || ch.team === 'prisoner') {
      for (const c of g.chars) if (c.state === 'alive' && c.team === 'enemy') out.push(c);
    }
    return out;
  }
  function isPlayer(g, t) { return t === g.player; }
  function chestOf(g, t) {
    if (isPlayer(g, t)) return [t.pos[0], t.pos[1] + (t.crouched ? 0.8 : 1.25), t.pos[2]];
    return [t.pos[0], t.pos[1] + (t.crouch > 0.5 ? 0.8 : 1.2), t.pos[2]];
  }
  function headOf(g, t) {
    if (isPlayer(g, t)) return [t.pos[0], t.pos[1] + t.eye, t.pos[2]];
    return [t.pos[0], t.pos[1] + (t.crouch > 0.5 ? 1.05 : 1.6), t.pos[2]];
  }
  function eyeOf(ch) { return [ch.pos[0], ch.pos[1] + (ch.crouch > 0.5 ? 1.05 : 1.6), ch.pos[2]]; }

  function lightAt(g, p) {
    let k = g.def.light === undefined ? 1 : g.def.light;
    for (const z of g.zones) {
      if (p[0] < z.x0 || p[0] > z.x1 || p[2] < z.z0 || p[2] > z.z1 || p[1] < z.y0 || p[1] > z.y1) continue;
      if (z.kind === 'dark') k = Math.min(k, z.k || 0.5);
      else if (z.kind === 'lit') k = Math.max(k, z.k || 1);
    }
    if (g.flags.powerOff && g.def.powerLight !== undefined) k = Math.min(k, g.def.powerLight);
    return k;
  }
  AI.lightAt = lightAt;

  function say(g, ch, kind, force) {
    const ai = ch.ai;
    if (!force && g.time - ai.sayT < 5) return;
    if (!force && g.time - (g.lastSay || -10) < 1.4) return;
    const set = X.LINES[ch.def.lines || 'thug'] || X.LINES.thug;
    const list = set[kind] || X.LINES.thug[kind];
    if (!list) return;
    ai.sayT = g.time; g.lastSay = g.time;
    g.say(ch.id, list[Math.floor(g.rng() * list.length)]);
  }
  AI.say = say;

  AI.alert = function (g, ch, pos) {
    const ai = ch.ai;
    if (!ai || ai.dead) return;
    if (ch.team === 'neutral') { AI.panic(g, ch, pos); return; }
    if (ai.mode === 'follow') return;
    if (ai.alert < 2) {
      if (ch.pose) ch.pose = null;
      ai.reactT = 0.6 * g.diff.react;
      g.ev({ t: 'word', text: '!', p: [ch.pos[0], ch.pos[1] + 2.2, ch.pos[2]], style: 'alert' });
    }
    ai.alert = 2;
    ai.memory = 1;
    if (pos && (!ai.seeNow)) { ai.lastSeen = pos.slice(); ai.lastSeenT = g.time; }
    ai.route = null;
  };

  AI.onHostage = function (g, c) {
    c.ai.route = null;
    c.ai.seeNow = false;
  };

  AI.onHurt = function (g, ch, from) {
    const ai = ch.ai;
    if (!ai) return;
    if (ch.team === 'neutral') { AI.panic(g, ch, from || ch.pos); return; }
    if (ai.mode === 'follow') return;
    const wasCalm = ai.alert < 2;
    AI.alert(g, ch, from || g.player.pos);
    if (from) { ch.yaw = X.yawTo(ch.pos, from); ai.lastSeen = from.slice(); ai.lastSeenT = g.time; }
    if (wasCalm) ai.reactT = 0.3;
    say(g, ch, 'hurt');
    if (ai.points && ai.points.length > 1) { ai.pointI = (ai.pointI + 1) % ai.points.length; ai.route = null; ai.moveT = g.time; }
  };

  AI.panic = function (g, ch, from) {
    const ai = ch.ai;
    if (ai.panic) return;
    ai.panic = true;
    ai.panicFrom = from ? from.slice() : ch.pos.slice();
    ch.pose = null;
    say(g, ch, 'spot', true);
    if (!g.nav) return;
    let best = null, bs = -1;
    g.nav.nodesNear(ch.pos, 14, n => {
      if (g.rng() > 0.25) return;
      const p = g.nav.pos(n);
      if (Math.abs(p[1] - ch.pos[1]) > 3) return;
      const d = X.hdist(p, ai.panicFrom);
      if (d > bs && g.nav.connected(n, g.nav.nearest(ch.pos))) { bs = d; best = p; }
    });
    if (best) { ai.goal = best; ai.route = g.nav.path(ch.pos, best); ai.ri = 0; ai.run = true; }
  };

  AI.hear = function (g, ch, pos, kind, frac, src) {
    const ai = ch.ai;
    if (!ai || ai.dead || ai.deaf || ch.state !== 'alive') return;
    if (src && g.byId[src] && !X.hostile(g.byId[src].team, ch.team) && kind !== 'shot' && kind !== 'body') return;
    if (ch.team === 'neutral') {
      if (kind === 'shot' || kind === 'explosion') AI.panic(g, ch, pos);
      return;
    }
    if (ai.mode === 'follow') return;
    if (kind === 'shot' || kind === 'explosion' || kind === 'glass' || kind === 'impact') {
      if (src && g.byId[src] && g.byId[src].team === ch.team && kind === 'shot') {
        const shooter = g.byId[src];
        if (shooter.ai && shooter.ai.lastSeen && ai.alert < 2) { AI.alert(g, ch, shooter.ai.lastSeen); }
        return;
      }
      if (ai.alert < 2) say(g, ch, 'hear');
      AI.alert(g, ch, pos);
      return;
    }
    if (kind === 'step' || kind === 'melee' || kind === 'body' || kind === 'throw') {
      if (ai.alert >= 2) { if (kind === 'step' && src === 'player' && !ai.seeNow) { ai.lastSeen = pos.slice(); ai.lastSeenT = g.time; } return; }
      if (ai.alert === 0) {
        ai.alert = 1;
        g.ev({ t: 'word', text: '?', p: [ch.pos[0], ch.pos[1] + 2.2, ch.pos[2]], style: 'question' });
        say(g, ch, 'hear');
      }
      ai.investigate = pos.slice();
      ai.invT = 0;
      ai.route = null;
      ai.lookAt = pos.slice();
      ai.turnWait = 0.8;
    }
  };

  function hasLos(g, ch, t) {
    const e = eyeOf(ch);
    if (g.world.visible(e, chestOf(g, t))) return true;
    return g.world.visible(e, headOf(g, t));
  }
  AI.hasLos = hasLos;

  function perceive(g, ch, dtp) {
    const ai = ch.ai;
    const eye = eyeOf(ch);
    const f = X.fwd(ch.yaw, 0);
    const targets = targetsOf(g, ch);
    let best = null, bd = 1e9;
    ai.seeNow = false;
    for (const t of targets) {
      const tp = chestOf(g, t);
      const dx = tp[0] - eye[0], dy = tp[1] - eye[1], dz = tp[2] - eye[2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const pl = isPlayer(g, t);
      let range = ai.sight * g.diff.sight;
      if (pl) {
        range *= lightAt(g, t.pos);
        if (t.crouched) range *= 0.6;
        else if (t.speed < 2.6) range *= 0.85;
        if (t.swim && t.underwater) range *= 0.2;
      }
      if (ai.alert === 2) range = Math.max(range, ai.sight * 0.9);
      if (d > range) continue;
      const dot = (dx * f[0] + dz * f[2]) / Math.max(0.01, Math.hypot(dx, dz));
      const recently = g.time - ai.seeT < 2.5 && ai.target === t;
      const fov = ai.alert === 2 ? -0.1 : 0.34;
      if (d > 2.2 && dot < fov && !recently) continue;
      if (d <= 2.2 && dot < -0.3 && !recently && ai.alert < 2) continue;
      if (!hasLos(g, ch, t)) continue;
      if (pl && ai.alert < 2) {
        const rate = 2.6 * Math.pow(Math.max(0.05, 1 - d / range), 0.6) * (t.speed > 3 ? 1.4 : 1) * (ai.memory ? 1.6 : 1) * (d < 3.5 ? 4 : 1);
        ai.sus += dtp * rate;
        if (ai.sus >= 0.35 && ai.alert === 0) {
          ai.alert = 1;
          g.ev({ t: 'word', text: '?', p: [ch.pos[0], ch.pos[1] + 2.2, ch.pos[2]], style: 'question' });
          say(g, ch, 'hear');
        }
        if (ai.alert === 1) { ai.investigate = t.pos.slice(); ai.lookAt = tp; ai.route = null; ai.turnWait = 0.4; }
        if (ai.sus < 1) continue;
      }
      if (d < bd) { bd = d; best = t; }
    }
    if (best) {
      const wasCalm = ai.alert < 2;
      ai.target = best;
      ai.seeNow = true;
      ai.seeT = g.time;
      ai.lastSeen = best.pos.slice();
      ai.lastSeenT = g.time;
      if (wasCalm) {
        AI.alert(g, ch, best.pos);
        say(g, ch, 'spot', true);
        if (isPlayer(g, best)) g.ev({ t: 'spotted', id: ch.id });
        if (ai.mode === 'sniper' && isPlayer(g, best)) g.panel({ kind: 'char', id: ch.id, dur: 2.2, text: 'СНАЙПЕР!', tint: 'red' });
      }
      ai.seeNow = true;
    } else if (ai.alert < 2) {
      ai.sus = Math.max(0, ai.sus - dtp * 0.25);
    }
    if (ai.alert < 2 && ch.team === 'enemy') {
      for (const c of g.chars) {
        if ((c.state !== 'dead' && c.state !== 'ko') || c.team !== 'enemy' || ai.bodies[c.id] || c.carried || c.hiddenBody) continue;
        const bp = [c.pos[0], c.pos[1] + 0.3, c.pos[2]];
        const d = X.vdist(eye, bp);
        if (d > 14 * lightAt(g, c.pos) + 3) continue;
        const dot = ((bp[0] - eye[0]) * f[0] + (bp[2] - eye[2]) * f[2]) / Math.max(0.01, X.hdist(bp, eye));
        if (dot < 0.3) continue;
        if (!g.world.visible(eye, bp)) continue;
        ai.bodies[c.id] = 1;
        say(g, ch, 'body', true);
        g.ev({ t: 'bodyFound', id: ch.id, body: c.id });
        AI.alert(g, ch, c.pos);
        ai.lastSeen = c.pos.slice();
        ai.lastSeenT = g.time - 6;
        if (ai.canAlarm && g.alarms.length) startAlarmRun(g, ch);
        break;
      }
    }
  }

  function startAlarmRun(g, ch) {
    const ai = ch.ai;
    if (g.alarmOn || ai.alarmGoal || !g.alarms.length || !g.nav || g.def.noAlarm) return;
    if (g.chars.some(c => c !== ch && c.state === 'alive' && c.ai && c.ai.alarmGoal)) return;
    let best = null, bd = 40;
    for (const a of g.alarms) {
      if (a.off) continue;
      const d = X.vdist(a.pos, ch.pos);
      if (d < bd) { bd = d; best = a; }
    }
    if (!best) return;
    const f = X.fwd(best.yaw, 0);
    const spot = [best.pos[0] + f[0] * 0.8, best.pos[1] - 1.3, best.pos[2] + f[2] * 0.8];
    const route = g.nav.path(ch.pos, spot);
    if (!route) return;
    ai.alarmGoal = best; ai.alarmSpot = spot; ai.route = route; ai.ri = 0; ai.run = true; ai.alarmT = 0;
    say(g, ch, 'alarm', true);
    g.panel({ kind: 'char', id: ch.id, dur: 3.2, text: 'ТРЕВОГА!', tint: 'sepia', live: true });
  }
  AI.startAlarmRun = startAlarmRun;

  function setRoute(g, ch, goal, run) {
    const ai = ch.ai;
    if (!g.nav) { ai.route = [goal.slice()]; ai.ri = 0; ai.run = run; return true; }
    if (ai.goal && ai.route && X.vdist(ai.goal, goal) < 1.2 && g.time - ai.repathT < 2.5) { ai.run = run; return true; }
    if (g.time - ai.repathT < 0.5) return !!ai.route;
    ai.repathT = g.time;
    const r = g.nav.path(ch.pos, goal);
    ai.goal = goal.slice();
    ai.run = run;
    if (!r) { ai.route = null; return false; }
    ai.route = r; ai.ri = 0;
    return true;
  }

  function followRoute(g, ch, dt) {
    const ai = ch.ai;
    if (!ai.route || ai.ri >= ai.route.length) { ai.route = null; return false; }
    const tp = ai.route[ai.ri];
    const dx = tp[0] - ch.pos[0], dz = tp[2] - ch.pos[2];
    const d = Math.hypot(dx, dz);
    if (d < 0.35 && Math.abs(tp[1] - ch.pos[1]) < 1.2) {
      ai.ri++;
      if (ai.ri >= ai.route.length) { ai.route = null; return false; }
      return true;
    }
    let sp = ai.run ? 4.0 : 1.55;
    if (ch.crouch > 0.5) sp = 1.4;
    if (ch.type === 'carrington') sp = Math.min(sp, 3.0);
    const wd = W[ch.weapon];
    if (wd && wd.heavy) sp *= 0.85;
    ch.vel[0] = dx / d * sp; ch.vel[2] = dz / d * sp;
    const e = [ch.pos[0], ch.pos[1] + 1.1, ch.pos[2]];
    const hit = g.world.ray(e, [dx / d, 0, dz / d], 1.1, F.SOLID);
    if (hit && hit.block && hit.block.isMover) {
      const door = g.doors.find(q => q.block === hit.block);
      if (door && !door.locked && !door.noAI && door.target === 0) g.openDoor(door, ch.pos);
    }
    return true;
  }

  function turnTowards(ch, yaw, rate, dt) { ch.yaw = X.turnTo(ch.yaw, yaw, rate * dt); }

  function engage(g, ch, dt) {
    const ai = ch.ai;
    const t = ai.target;
    const prof = PROF[ch.weapon] || NONE;
    if (!t) return;
    const tp = chestOf(g, t);
    const d = X.vdist(eyeOf(ch), tp);
    if (ai.points && ai.points.length) {
      const pt = ai.points[ai.pointI];
      if (X.hdist(pt, ch.pos) > 0.8) { setRoute(g, ch, pt, true); return; }
      if (g.time - (ai.moveT || 0) > (ai.hold || 7)) { ai.pointI = (ai.pointI + 1) % ai.points.length; ai.moveT = g.time; }
      ai.route = null;
      return;
    }
    if (ai.static || ai.mode === 'sniper') { ai.route = null; return; }
    if (d > prof.range * 0.85 || (!ch.weapon && ch.team !== 'ally')) { setRoute(g, ch, t.pos, true); return; }
    if (ai.route && d < prof.range * 0.6) ai.route = null;
    ai.strafeT -= dt * 4;
    if (ai.strafeT <= 0) {
      ai.strafeT = rnd(g, 1.2, 3);
      ai.strafe = g.rng() < 0.35 ? 0 : (g.rng() < 0.5 ? -1 : 1);
      if (ch.weapon === 'm16' || ch.weapon === 'kalash' || ch.weapon === 'sniper') ai.crouchT = g.rng() < 0.4 ? rnd(g, 1.5, 3.5) : 0;
      if (ch.boss) ai.crouchT = 0;
      if (ai.strafe) {
        const r = X.right(X.yawTo(ch.pos, t.pos));
        const side = [ch.pos[0] + r[0] * ai.strafe * 2.2, ch.pos[1], ch.pos[2] + r[2] * ai.strafe * 2.2];
        if (!g.nav || g.nav.walkable(ch.pos, side)) { ai.route = [side]; ai.ri = 0; ai.run = false; ai.goal = side; }
        else ai.strafe = 0;
      }
    }
    if (ch.health < ch.maxHealth * 0.35 && !ai.tookCover && !ch.boss && g.nav) {
      ai.tookCover = true;
      const cover = findCover(g, ch, t);
      if (cover) { ai.route = g.nav.path(ch.pos, cover); ai.ri = 0; ai.run = true; ai.goal = cover; ai.coverUntil = g.time + 4; }
    }
  }

  function findCover(g, ch, t) {
    let best = null, bd = 1e9;
    const tp = headOf(g, t);
    let n = 0;
    g.nav.nodesNear(ch.pos, 8, id => {
      if (n > 60 || g.rng() > 0.3) return;
      const p = g.nav.pos(id);
      if (Math.abs(p[1] - ch.pos[1]) > 1.5) return;
      n++;
      if (g.world.visible([p[0], p[1] + 1.5, p[2]], tp)) return;
      const d = X.hdist(p, ch.pos);
      if (d < bd) { bd = d; best = p; }
    });
    return best;
  }

  function fire(g, ch, dt) {
    const ai = ch.ai;
    ai.fireCd -= dt;
    if (!ai.seeNow || !ch.weapon || !ai.target) return;
    const t = ai.target;
    const wd = W[ch.weapon], prof = PROF[ch.weapon] || NONE;
    if (!wd) return;
    if (ai.reactT > 0) { ai.reactT -= dt; return; }
    const tp = chestOf(g, t);
    const eye = eyeOf(ch);
    const want = X.yawTo(ch.pos, tp);
    if (Math.abs(X.angDiff(ch.yaw, want)) > 0.3) return;
    const d = X.vdist(eye, tp);
    if (d > prof.range * 1.3) return;
    if (isPlayer(g, t) && t.hostage && !ch.boss && t.hostage.team === ch.team) {
      const pf = X.fwd(t.yaw, 0);
      const to = X.vnorm([ch.pos[0] - t.pos[0], 0, ch.pos[2] - t.pos[2]]);
      if (pf[0] * to[0] + pf[2] * to[2] > -0.25) { say(g, ch, 'hostage'); ai.fireCd = 0.5; return; }
    }
    if (ai.fireCd > 0) return;
    if (ai.burst <= 0) ai.burst = Math.round(rnd(g, prof.burst[0], prof.burst[1]));
    ai.burst--;
    ai.shots++;
    ai.fireCd = ai.burst > 0 ? wd.rate * 1.25 : rnd(g, prof.pause[0], prof.pause[1]) * (ch.boss ? 0.7 : 1);
    if (wd.clip && ai.shots % wd.clip === 0) { ai.fireCd = Math.max(ai.fireCd, 2.2); ch.reloadT = g.time; }
    ch.fireT = g.time;
    const r = X.right(ch.yaw);
    const muzzle = [ch.pos[0] + r[0] * 0.25 + X.fwd(ch.yaw, 0)[0] * 0.5, ch.pos[1] + (ch.crouch > 0.5 ? 1.0 : 1.4), ch.pos[2] + r[2] * 0.25 + X.fwd(ch.yaw, 0)[2] * 0.5];
    g.ev({ t: 'fire', w: ch.weapon, who: ch.id });
    g.noise(ch.pos, wd.noise, 'shot', ch.id);
    if (wd.kind === 'proj') {
      const dir = X.vnorm(X.vsub(tp, muzzle));
      g.spawnProj(wd.proj, muzzle, X.vscale(dir, wd.speed), ch.weapon, ch.id);
      return;
    }
    const pellets = wd.pellets || 1;
    if (isPlayer(g, t)) {
      const p = t;
      let chance = prof.acc * g.diff.acc * (1 - Math.min(0.75, d / (prof.range * 1.4)));
      if (p.speed > 3) chance *= 0.7;
      if (p.crouched) chance *= 0.85;
      if (ai.shots <= 1) chance *= 0.55;
      if (ch.boss) chance *= 1.25;
      if (p.swim && p.underwater) chance *= 0.2;
      let hits = 0;
      for (let i = 0; i < pellets; i++) if (g.rng() < chance) hits++;
      const dir = X.vnorm(X.vsub(tp, muzzle));
      if (hits) {
        g.hurtPlayer(wd.dmg * hits * g.diff.dmg * 0.5 * (pellets > 1 ? 0.8 : 1), dir, 'shot');
        g.ev({ t: 'shot', w: ch.weapon, from: muzzle, to: [tp[0] + (g.rng() - 0.5) * 0.3, tp[1] + (g.rng() - 0.5) * 0.3, tp[2] + (g.rng() - 0.5) * 0.3], who: ch.id, atPlayer: true });
      } else {
        const miss = [tp[0] + (g.rng() - 0.5) * 2.2, tp[1] + (g.rng() - 0.3) * 1.4, tp[2] + (g.rng() - 0.5) * 2.2];
        const md = X.vnorm(X.vsub(miss, muzzle));
        const h = g.world.ray(muzzle, md, d + 12, F.SHOT);
        const end = h ? h.p : X.vma(muzzle, d + 12, md);
        g.ev({ t: 'shot', w: ch.weapon, from: muzzle, to: end, who: ch.id, whiz: true });
        if (h) {
          if (h.block && (h.block.flags & F.GLASS)) g.breakGlass(h.block, h.p);
          else g.ev({ t: 'impact', p: h.p, n: h.n, mat: h.block ? h.block.mat : g.terrainMat(h.p) });
        }
      }
      return;
    }
    const spread = (1 - prof.acc * g.diff.acc) * 0.05 + 0.006;
    const aim = X.vnorm(X.vsub(tp, muzzle));
    for (let i = 0; i < pellets; i++) g.traceShot(muzzle, g.perturb(aim, spread), wd, ch.weapon, ch, i === 0);
  }

  function throwGrenade(g, ch) {
    const ai = ch.ai;
    const tgt = ai.lastSeen;
    if (!tgt) return;
    const from = [ch.pos[0], ch.pos[1] + 1.7, ch.pos[2]];
    const dx = tgt[0] - from[0], dz = tgt[2] - from[2];
    const dh = Math.hypot(dx, dz);
    const tFlight = Math.max(0.6, dh / 11);
    const vy = (tgt[1] + 0.3 - from[1] + 0.5 * X.GRAVITY * tFlight * tFlight) / tFlight;
    const pr = g.spawnProj('grenade', from, [dx / tFlight, vy, dz / tFlight], 'grenade', ch.id);
    pr.fuse = tFlight + 0.9;
    ai.grenadeT = g.time + rnd(g, 14, 24);
    g.ev({ t: 'throw', kind: 'grenade', id: pr.id, who: ch.id });
    g.ev({ t: 'word', text: 'GRENADE!', p: [ch.pos[0], ch.pos[1] + 2.2, ch.pos[2]], style: 'alert' });
  }

  function calm(g, ch, dt) {
    const ai = ch.ai;
    if (ai.mode === 'patrol' && ch.spawn.path && ch.spawn.path.length) {
      const pts = ch.spawn.path;
      if (ai.waitT > 0) { ai.waitT -= dt; ch.vel[0] = ch.vel[2] = 0; return; }
      const tp = pts[ai.pi % pts.length];
      if (X.hdist(tp, ch.pos) < 0.5) {
        ai.pi = (ai.pi + 1) % pts.length;
        ai.waitT = ch.spawn.wait === undefined ? rnd(g, 1, 3.5) : ch.spawn.wait;
        ai.route = null;
        return;
      }
      if (!ai.route) setRoute(g, ch, tp, false);
      if (!followRoute(g, ch, dt)) { ai.route = null; ai.stuckN = (ai.stuckN || 0) + 1; if (ai.stuckN > 30) { ai.pi = (ai.pi + 1) % pts.length; ai.stuckN = 0; } }
      return;
    }
    if (X.hdist(ai.home, ch.pos) > 0.7 && !ai.static) {
      if (!ai.route) setRoute(g, ch, ai.home, false);
      followRoute(g, ch, dt);
      return;
    }
    ch.vel[0] = ch.vel[2] = 0;
    ai.lookT -= dt;
    if (ai.lookT <= 0) {
      ai.lookT = rnd(g, 2, 5);
      ai.lookYaw = ai.homeYaw + (ch.pose ? 0 : (g.rng() - 0.5) * 1.6);
    }
    if (ai.lookYaw !== undefined) turnTowards(ch, ai.lookYaw, 1.2, dt);
  }

  function investigate(g, ch, dt) {
    const ai = ch.ai;
    if (ai.turnWait > 0) {
      ai.turnWait -= dt;
      if (ai.lookAt) turnTowards(ch, X.yawTo(ch.pos, ai.lookAt), 3, dt);
      ch.vel[0] = ch.vel[2] = 0;
      return;
    }
    if (!ai.investigate) { ai.alert = 0; return; }
    if (ai.static) {
      ai.invT += dt;
      turnTowards(ch, X.yawTo(ch.pos, ai.investigate), 2.5, dt);
      if (ai.invT > 4) { ai.alert = 0; ai.investigate = null; ai.sus = 0; say(g, ch, 'calm'); }
      return;
    }
    if (X.hdist(ai.investigate, ch.pos) > 1.2 && ai.invT < 12) {
      ai.invT += dt;
      if (!ai.route) { if (!setRoute(g, ch, ai.investigate, false)) ai.investigate = null; }
      followRoute(g, ch, dt);
      return;
    }
    ai.invT += dt;
    ch.vel[0] = ch.vel[2] = 0;
    ai.route = null;
    turnTowards(ch, ch.yaw + 1, 1.2, dt);
    if (ai.invT > 16 || (X.hdist(ai.investigate, ch.pos) <= 1.2 && (ai.lookAround = (ai.lookAround || 0) + dt) > 4)) {
      ai.alert = 0; ai.investigate = null; ai.sus = 0; ai.lookAround = 0; ai.invT = 0;
      say(g, ch, 'calm');
    }
  }

  function combat(g, ch, dt) {
    const ai = ch.ai;
    if (ai.alarmGoal) {
      if (g.alarmOn) { ai.alarmGoal = null; }
      else {
        const a = ai.alarmGoal;
        if (X.hdist(ai.alarmSpot, ch.pos) < 1.0) {
          ch.vel[0] = ch.vel[2] = 0;
          turnTowards(ch, X.yawTo(ch.pos, a.pos), 6, dt);
          ai.alarmT += dt;
          if (ai.alarmT > 1.4) { ai.alarmGoal = null; g.raiseAlarm(ch.pos, ch.id); }
          return;
        }
        if (!ai.route) { if (!setRoute(g, ch, ai.alarmSpot, true)) ai.alarmGoal = null; }
        followRoute(g, ch, dt);
        return;
      }
    }
    if (ai.seeNow && ai.target) {
      if (ai.canAlarm && !g.alarmOn && g.alarms.length && ai.target === g.player && !ai.alarmTried) {
        ai.alarmTried = true;
        if (g.rng() < (ch.spawn.alarmChance === undefined ? 0.5 : ch.spawn.alarmChance)) { startAlarmRun(g, ch); if (ai.alarmGoal) return; }
      }
      engage(g, ch, dt);
      if (ai.coverUntil && g.time < ai.coverUntil && ai.route) { followRoute(g, ch, dt); return; }
      if (ai.route) followRoute(g, ch, dt); else ch.vel[0] = ch.vel[2] = 0;
      const tp = chestOf(g, ai.target);
      turnTowards(ch, X.yawTo(ch.pos, tp), 7, dt);
      ch.pitch = X.pitchTo(eyeOf(ch), tp);
      return;
    }
    ai.crouchT = 0;
    if (ai.aggressive && g.player.alive) { ai.lastSeen = g.player.pos.slice(); ai.lastSeenT = g.time; }
    if (ai.grenadier && ai.lastSeen && g.time > ai.grenadeT && g.time - ai.lastSeenT < 8) {
      const d = X.hdist(ai.lastSeen, ch.pos);
      if (d > 5 && d < 22) { throwGrenade(g, ch); return; }
    }
    if (ai.static || ai.mode === 'sniper') {
      ch.vel[0] = ch.vel[2] = 0;
      if (ai.lastSeen) turnTowards(ch, X.yawTo(ch.pos, ai.lastSeen), 2, dt);
      if (g.time - ai.lastSeenT > 20 && !ai.aggressive) { ai.alert = 1; ai.investigate = ai.lastSeen; ai.invT = 0; }
      return;
    }
    if (ai.points && ai.points.length) { engage(g, ch, dt); if (ai.route) followRoute(g, ch, dt); else ch.vel[0] = ch.vel[2] = 0; if (ai.lastSeen) turnTowards(ch, X.yawTo(ch.pos, ai.lastSeen), 4, dt); return; }
    if (ai.lastSeen && g.time - ai.lastSeenT < (ai.aggressive ? 1e9 : 14)) {
      if (X.hdist(ai.lastSeen, ch.pos) > 1.5) {
        if (!ai.route || (ai.goal && X.vdist(ai.goal, ai.lastSeen) > 2)) setRoute(g, ch, ai.lastSeen, true);
        if (!followRoute(g, ch, dt)) { ai.searchT += dt; ch.vel[0] = ch.vel[2] = 0; }
        return;
      }
      ai.searchT += dt;
      ch.vel[0] = ch.vel[2] = 0;
      turnTowards(ch, ch.yaw + 1, 1.5, dt);
      if (ai.searchT > 5 && !ai.aggressive) {
        ai.searchT = 0;
        if (g.nav) {
          let pick = null;
          g.nav.nodesNear(ch.pos, 9, n => { if (!pick && g.rng() < 0.01) pick = g.nav.pos(n); });
          if (pick && Math.abs(pick[1] - ch.pos[1]) < 2) { ai.lastSeen = pick; }
        }
      }
      return;
    }
    say(g, ch, 'lost');
    ai.alert = 0;
    ai.investigate = null;
    ai.sus = 0.3;
    ai.route = null;
  }

  function civilian(g, ch, dt) {
    const ai = ch.ai;
    if (ai.panic) {
      if (ai.route) { followRoute(g, ch, dt); if (ch.vel[0] || ch.vel[2]) turnTowards(ch, Math.atan2(-ch.vel[0], -ch.vel[2]), 8, dt); return; }
      ch.vel[0] = ch.vel[2] = 0;
      ch.pose = 'cower';
      return;
    }
    calm(g, ch, dt);
  }

  function follow(g, ch, dt) {
    const ai = ch.ai;
    const o = ai.order || { type: 'follow' };
    const p = g.player;
    let enemy = null, ed = 1e9;
    if (ch.weapon && g.tickN % 6 === 0) {
      const eye = eyeOf(ch);
      for (const c of g.chars) {
        if (c.state !== 'alive' || c.team !== 'enemy') continue;
        const d = X.vdist(c.pos, ch.pos);
        if (d > 38 || d > ed) continue;
        if (!g.world.visible(eye, chestOf(g, c))) continue;
        enemy = c; ed = d;
      }
      ai.target = enemy; ai.seeNow = !!enemy;
      if (enemy) { ai.lastSeen = enemy.pos.slice(); ai.lastSeenT = g.time; ai.seeT = g.time; }
    } else if (ai.target && ai.target.state !== 'alive') { ai.target = null; ai.seeNow = false; }
    let goal = null, run = false;
    if (o.type === 'follow' && p.alive) {
      const d = X.hdist(p.pos, ch.pos);
      if (d > (ai.seeNow ? 7 : 4) || Math.abs(p.pos[1] - ch.pos[1]) > 1.6) { goal = p.pos; run = d > 7; }
    } else if ((o.type === 'goto' || o.type === 'hold') && o.pos) {
      if (X.hdist(o.pos, ch.pos) > 0.6) { goal = o.pos; run = !!o.run; }
      else if (o.type === 'goto') { ai.order = { type: 'hold', pos: o.pos }; g.script.fire('arrive:' + ch.id); }
    }
    if (goal) {
      if (!ai.route || g.time - ai.repathT > 1.2) setRoute(g, ch, goal, run);
      if (!followRoute(g, ch, dt)) ch.vel[0] = ch.vel[2] = 0;
    } else { ch.vel[0] = ch.vel[2] = 0; ai.route = null; }
    if (ai.seeNow && ai.target) {
      const tp = chestOf(g, ai.target);
      turnTowards(ch, X.yawTo(ch.pos, tp), 6, dt);
      ch.pitch = X.pitchTo(eyeOf(ch), tp);
    } else if (ch.vel[0] || ch.vel[2]) turnTowards(ch, Math.atan2(-ch.vel[0], -ch.vel[2]), 6, dt);
    else if (o.face !== undefined) turnTowards(ch, o.face, 3, dt);
    else if (p.alive) turnTowards(ch, X.yawTo(ch.pos, p.pos), 2, dt);
    const enemyNear = g.chars.some(c => c.state === 'alive' && c.team === 'enemy' && c.ai && c.ai.alert === 2 && X.hdist(c.pos, ch.pos) < 20);
    ch.crouch = !ch.weapon && enemyNear && !goal ? 1 : 0;
    if (!enemyNear && ch.health < ch.maxHealth) ch.health = Math.min(ch.maxHealth, ch.health + dt * 4);
  }

  AI.update = function (g, ch, dt) {
    const ai = ch.ai;
    if (!ai || ai.dead) return;
    if (ai.scripted) { scripted(g, ch, dt); physics(g, ch, dt); return; }
    ai.stunT = Math.max(0, (ai.stunT || 0) - dt);
    if (ai.stunT > 0) { ch.vel[0] = ch.vel[2] = 0; physics(g, ch, dt); return; }
    ai.percT -= dt;
    if (ai.mode !== 'follow' && ch.team !== 'neutral' && ai.percT <= 0) {
      ai.percT += 0.15;
      perceive(g, ch, 0.15);
    }
    if (ch.team === 'neutral') civilian(g, ch, dt);
    else if (ai.mode === 'follow') { follow(g, ch, dt); fire(g, ch, dt); }
    else if (ai.alert === 2) { combat(g, ch, dt); fire(g, ch, dt); }
    else if (ai.alert === 1) investigate(g, ch, dt);
    else calm(g, ch, dt);
    if (ai.alert < 2 && ai.mode !== 'follow' && (ch.vel[0] || ch.vel[2])) turnTowards(ch, Math.atan2(-ch.vel[0], -ch.vel[2]), 5, dt);
    if (ai.alert === 2 && !ai.seeNow && (ch.vel[0] || ch.vel[2])) turnTowards(ch, Math.atan2(-ch.vel[0], -ch.vel[2]), 6, dt);
    ch.crouch = ai.mode === 'follow' ? ch.crouch : (ai.crouchT > 0 && ai.seeNow ? 1 : 0);
    if (ai.crouchT > 0) ai.crouchT -= dt;
    if (ch.boss && ai.taunts && ai.alert === 2 && g.time > ai.tauntT) {
      ai.tauntT = g.time + rnd(g, 9, 15);
      g.say(ch.id, ai.taunts[Math.floor(g.rng() * ai.taunts.length)]);
    }
    physics(g, ch, dt);
  };

  function physics(g, ch, dt) {
    const ai = ch.ai;
    if (ai.static || ch.grp) {
      ch.speed = 0;
      return;
    }
    const before = [ch.pos[0], ch.pos[2]];
    if (!ch.onGround) ch.vel[1] -= X.GRAVITY * dt;
    g.moveBody(ch, 0.3, ch.crouch > 0.5 ? 1.15 : 1.75, dt, false);
    const moved = Math.hypot(ch.pos[0] - before[0], ch.pos[2] - before[1]);
    ch.speed = moved / dt;
    const want = Math.hypot(ch.vel[0], ch.vel[2]);
    if (want > 0.5 && ch.speed < want * 0.25) {
      ai.stuckT += dt;
      if (ai.stuckT > 1.0) {
        ai.stuckT = 0;
        if (ai.route && ai.ri < ai.route.length - 1) ai.ri++;
        else { ai.route = null; ai.repathT = -10; }
      }
    } else ai.stuckT = Math.max(0, ai.stuckT - dt);
    if (ch.speed > 0.5) {
      ch.stepAcc = (ch.stepAcc || 0) + moved;
      if (ch.stepAcc > (ch.speed > 3 ? 1.1 : 0.8)) { ch.stepAcc = 0; ch.lastStep = g.time; }
    }
  }

  function scripted(g, ch, dt) {
    const s = ch.ai.scripted;
    if (s.goto) {
      if (X.hdist(s.goto, ch.pos) > 0.4) {
        if (!ch.ai.route) setRoute(g, ch, s.goto, !!s.run);
        if (!followRoute(g, ch, dt)) { ch.vel[0] = ch.vel[2] = 0; }
        if (ch.vel[0] || ch.vel[2]) turnTowards(ch, Math.atan2(-ch.vel[0], -ch.vel[2]), 6, dt);
        return;
      }
      ch.vel[0] = ch.vel[2] = 0;
      const id = s.id;
      if (s.face !== undefined) ch.yaw = s.face;
      ch.ai.scripted = s.then || null;
      ch.ai.route = null;
      if (s.pose) ch.pose = s.pose;
      if (id) g.script.fire('arrive:' + id, true);
      return;
    }
    ch.vel[0] = ch.vel[2] = 0;
    if (s.face !== undefined) turnTowards(ch, s.face, 4, dt);
    if (s.lookAtPlayer) turnTowards(ch, X.yawTo(ch.pos, g.player.pos), 4, dt);
  }

  AI.goto = function (g, ch, pos, o) {
    o = o || {};
    ch.ai.scripted = { goto: pos.slice(), run: !!o.run, id: o.id || ch.id, face: o.face, pose: o.pose, then: o.then || null };
    ch.ai.route = null;
    ch.pose = null;
  };
  AI.release = function (g, ch) { ch.ai.scripted = null; ch.ai.route = null; };

  AI.vehicle = function (g, v, dt) {
    if (!v.active || v.friendly) return;
    const p = g.player;
    if (v.dead) {
      if (!v.crashed) {
        v.vel = v.vel || [0, 0, 0];
        v.vel[1] -= X.GRAVITY * 0.6 * dt;
        v.pos = X.vma(v.pos, dt, v.vel);
        v.yaw += dt * 4;
        const gy = g.world.groundY(v.pos[0], v.pos[2], v.pos[1] + 2);
        if (v.pos[1] <= gy + 1 || v.pos[1] < (v.crashY === undefined ? -200 : v.crashY)) {
          v.crashed = true;
          g.ev({ t: 'explode', p: v.pos.slice(), r: 10, kind: 'vehicle' });
          g.ev({ t: 'word', text: 'KA-BOOOM!', p: v.pos.slice(), style: 'explode' });
        }
      }
      return;
    }
    v.t = (v.t || 0) + dt;
    const c = v.center || p.pos;
    const ang = (v.phase || 0) + v.t * (v.orbit || 0.18);
    const tgt = [c[0] + Math.cos(ang) * (v.radius || 30), (v.height || c[1] + 14) + Math.sin(v.t * 0.7) * 2, c[2] + Math.sin(ang) * (v.radius || 30)];
    const prev = v.pos.slice();
    const want = X.vsub(tgt, v.pos), wl = X.vlen(want);
    const stepL = Math.min(wl * Math.min(1, dt * 0.6), (v.maxSpeed || 32) * dt);
    if (wl > 1e-6) v.pos = X.vma(v.pos, stepL / wl, want);
    v.vel = X.vscale(X.vsub(v.pos, prev), 1 / dt);
    v.yaw = X.turnTo(v.yaw || 0, X.yawTo(v.pos, p.pos), dt * 1.2);
    const fwdSpeed = -(v.vel[0] * Math.sin(v.yaw) + v.vel[2] * Math.cos(v.yaw));
    const sideSpeed = v.vel[0] * Math.cos(v.yaw) - v.vel[2] * Math.sin(v.yaw);
    v.pitch = X.approach(v.pitch || 0, X.clamp(-fwdSpeed * 0.012, -0.3, 0.3), dt * 0.8);
    v.roll = X.approach(v.roll || 0, X.clamp(-sideSpeed * 0.015, -0.35, 0.35), dt * 0.8);
    v.fireCd = (v.fireCd || 0) - dt;
    v.rocketCd = (v.rocketCd === undefined ? 5 : v.rocketCd) - dt;
    if (!p.alive) return;
    const eye = [p.pos[0], p.pos[1] + 1.2, p.pos[2]];
    const gun = [v.pos[0], v.pos[1] - 1.2, v.pos[2]];
    if (X.vdist(gun, eye) > (v.range || 110)) return;
    const los = g.world.visible(gun, eye);
    if (!los) return;
    if (v.fireCd <= 0) {
      v.burst = (v.burst || 0) - 1;
      if (v.burst < 0) { v.burst = 10; v.fireCd = 1.6; return; }
      v.fireCd = 0.1;
      const d = X.vdist(gun, eye);
      const chance = 0.22 * g.diff.acc * (1 - Math.min(0.7, d / 80)) * (p.speed > 3 ? 0.7 : 1);
      g.ev({ t: 'fire', w: 'm60', who: v.id, from: gun });
      if (g.rng() < chance) {
        g.hurtPlayer(7 * g.diff.dmg, X.vnorm(X.vsub(eye, gun)), 'shot');
        g.ev({ t: 'shot', w: 'm60', from: gun, to: eye, who: v.id, atPlayer: true });
      } else {
        const miss = [eye[0] + (g.rng() - 0.5) * 4, eye[1] - g.rng() * 1.5, eye[2] + (g.rng() - 0.5) * 4];
        const md = X.vnorm(X.vsub(miss, gun));
        const h = g.world.ray(gun, md, d + 10, F.SHOT);
        g.ev({ t: 'shot', w: 'm60', from: gun, to: h ? h.p : X.vma(gun, d + 10, md), who: v.id, whiz: true });
        if (h) g.ev({ t: 'impact', p: h.p, n: h.n, mat: h.block ? h.block.mat : 'snow' });
      }
    }
    if (v.rocketCd <= 0 && v.rockets !== false) {
      v.rocketCd = rnd(g, 7, 11);
      const lead = X.vma(eye, 0.4, p.vel);
      const dir = X.vnorm(X.vsub(lead, gun));
      g.spawnProj('rocket', X.vma(gun, 2, dir), X.vscale(dir, 26), 'bazooka', v.id);
      g.ev({ t: 'fire', w: 'bazooka', who: v.id, from: gun });
    }
  };
})(globalThis.XIII = globalThis.XIII || {});
