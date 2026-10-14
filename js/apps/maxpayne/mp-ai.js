(function (M) {
  'use strict';
  const GRAV = 13.5;
  const FIRE = {
    beretta: { burst: [2, 4], gap: 0.26, rest: [0.75, 1.35], dmg: 9 },
    beretta2: { burst: [4, 7], gap: 0.15, rest: [0.85, 1.5], dmg: 8 },
    deagle: { burst: [1, 2], gap: 0.62, rest: [1.0, 1.6], dmg: 24 },
    pump: { burst: [1, 1], gap: 1, rest: [1.05, 1.55], dmg: 5.2 },
    sawed: { burst: [2, 2], gap: 0.32, rest: [1.5, 2.1], dmg: 4.8 },
    ingram: { burst: [5, 9], gap: 0.08, rest: [0.95, 1.6], dmg: 6.2 },
    ingram2: { burst: [8, 13], gap: 0.055, rest: [1.1, 1.8], dmg: 5.6 },
    training: { burst: [1, 2], gap: 0.9, rest: [1.6, 2.4], dmg: 3, speed: 13, spread: 0.02 }
  };
  const RANGE = {
    beretta: [5, 15], beretta2: [4, 12], deagle: [6, 18], pump: [2, 7], sawed: [1.5, 5.5], ingram: [4, 12], ingram2: [3, 10],
    pipe: [0, 1.4], bat: [0, 1.5], training: [0, 99]
  };
  const PRESSURE = [3.4, 2.2, 1.6, 1.6];
  let barkGlobal = -9;

  function T(c) { return M.ENEMY[c.type] || M.ENEMY.thug; }
  function chest(g) {
    const p = g.player;
    const s = M.bodySpheres(p);
    return s[1].c;
  }
  function eyeOf(c) { return [c.pos[0], c.pos[1] + (c.posture === 'crouch' ? 1.02 : 1.58), c.pos[2]]; }

  const AI = {
    init(g, c) {
      const t = T(c);
      c.ai = Object.assign({
        mode: c.mode || 'ambush', t: 0, aware: false, reactT: 0, seenT: 0, lostT: 99, lastSeen: null, sees: false, percT: g.rng.next() * 0.12,
        decideT: g.rng.range(0.2, 0.8), action: 'hold', cd: g.rng.range(0.2, 0.6), burst: 0, strafe: g.rng.chance(0.5) ? 1 : -1,
        path: null, pathI: 0, repathT: 0, barkT: -9, flinch: 0, cover: null, peekT: 0, reload: 0, stuckT: 0, lastPos: c.pos.slice(),
        faceYaw: c.yaw, leash: c.leash || 13, want: [0, 0], speedMul: 1, grenT: g.rng.range(3, 7), route: 0, hostT: 0, burn: 0
      }, c.ai || {});
      if (c.type === 'dummy') c.ai.mode = 'dummy';
      if (c.deaf) c.ai.deaf = true;
      if (c.popup && !c.raised) { c.posture = 'lie'; c.noHit = true; }
      c.speed = c.speed || t.speed;
      if (c.gren === undefined) c.gren = 0;
    },

    wake(g, c, mode) {
      if (mode === 'alert') this.alertChar(g, c, g.player.pos, 0.15);
      else if (mode) c.ai.mode = mode;
    },

    alertChar(g, c, pos, react) {
      const ai = c.ai;
      if (c.state !== 'alive') return;
      if (c.civilian) { ai.aware = true; return; }
      if (c.pose && ['sit', 'tv', 'fridge', 'count', 'drunk', 'sing', 'dance'].includes(c.pose) && !c.stay) c.pose = null;
      if (!ai.aware) ai.reactT = react !== undefined ? react : g.rng.range(T(c).react[0], T(c).react[1]) * g.diff.react;
      ai.aware = true;
      ai.lastSeen = pos ? pos.slice() : g.player.pos.slice();
      if (['ambush', 'idle', 'patrol', 'search', 'guard'].includes(ai.mode)) ai.mode = 'combat';
    },

    hear(g, pos, r, kind) {
      for (const c of g.chars) {
        if (c.state !== 'alive' || c.civilian || c.friendly || c.ai.mode === 'dummy') continue;
        const ai = c.ai;
        if (ai.deaf) continue;
        const d = M.dist(c.pos, pos);
        if (d > r || Math.abs(c.pos[1] - pos[1]) > 5) continue;
        if (kind === 'step') {
          if (!ai.aware && d < r) ai.faceYaw = M.yawOf(pos[0] - c.pos[0], pos[2] - c.pos[2]);
          continue;
        }
        const near = d < r * 0.5 || g.world.visible(eyeOf(c), [pos[0], pos[1] + 1, pos[2]]);
        if (!near) continue;
        if (ai.mode === 'combat' && ai.sees) continue;
        if (!ai.aware || ai.mode === 'search' || ai.mode === 'guard' || ai.mode === 'ambush' || ai.mode === 'idle' || ai.mode === 'patrol') {
          if (['ambush', 'idle', 'patrol', 'guard'].includes(ai.mode) || ai.mode === 'search') {
            ai.mode = 'search';
            ai.searchPos = pos.slice();
            ai.searchT = 0;
            ai.path = null;
            if (!ai.heard) { ai.heard = true; this.bark(g, c, 'search'); }
          }
        }
      }
    },

    onHurt(g, c, dir, src) {
      const ai = c.ai;
      ai.flinch = 0.28;
      c.anim.flinchT = 0;
      if (ai.mode === 'dummy' || c.civilian) return;
      if (src === 'player') {
        c.blind = false; c.holdFire = false; ai.deaf = false;
        if (ai.mode === 'hold' && !c.stay) ai.mode = 'combat';
        if (ai.mode === 'hostage') { ai.hostT = 99; }
        this.alertChar(g, c, g.player.pos, 0.25);
        ai.faceYaw = M.yawOf(g.player.pos[0] - c.pos[0], g.player.pos[2] - c.pos[2]);
        if (g.rng.chance(0.35)) this.bark(g, c, 'hurt');
        if (ai.action === 'hold' && g.rng.chance(0.4)) ai.decideT = 0;
      }
    },

    onDeath(g, c) {
      let barked = false;
      for (const o of g.chars) {
        if (o === c || o.state !== 'alive' || o.civilian || o.friendly) continue;
        if (M.dist(o.pos, c.pos) > 16) continue;
        if (o.ai.mode === 'hostage') continue;
        this.alertChar(g, o, g.player.pos);
        if (!barked && g.rng.chance(0.55)) { barked = this.bark(g, o, 'ally'); }
      }
    },

    scriptMove(g, c, pos, o) {
      const ai = c.ai;
      if (c.state === 'hidden') c.state = 'alive';
      ai.mode = 'script';
      ai.goal = pos.slice();
      ai.path = null;
      ai.run = o.run !== false;
      ai.then = o.then || 'idle';
      ai.arriveEv = o.event || 'arrive:' + c.id;
      ai.faceAfter = o.face;
    },

    bark(g, c, kind, force) {
      const ai = c.ai;
      if (!force && (g.real - ai.barkT < 4.5 || g.real - barkGlobal < 1.4)) return false;
      const set = M.BARKS[c.barks || T(c).barks] || M.BARKS.mob;
      const list = set[kind];
      if (!list || !list.length) return false;
      if (!force && M.dist(c.pos, g.player.pos) > 26) return false;
      ai.barkT = g.real;
      barkGlobal = g.real;
      g.say(c.speaker || c.name, g.rng.pick(list), 2.6, { npc: c.id });
      return true;
    },

    perceive(g, c) {
      const ai = c.ai, p = g.player;
      if (p.dead || c.blind) { ai.sees = false; return; }
      const e = eyeOf(c), tgt = chest(g);
      const d = M.dist(e, tgt);
      let sees = false;
      if (d < (c.sight || 44)) {
        const to = M.scale(M.sub(tgt, e), 1 / (d || 1));
        const f = M.fwdOf(c.yaw);
        const facing = to[0] * f[0] + to[2] * f[2];
        if (ai.aware || facing > 0.05 || d < 2.6) {
          const hit = g.world.raycast(e, M.sub(tgt, e), { noGlass: true, see: true });
          if (!hit) sees = true;
          else {
            const head = p.posture === 'cover' ? M.bodySpheres(p)[0].c : [p.pos[0], p.pos[1] + (p.posture === 'stand' ? 1.62 : 0.7), p.pos[2]];
            if (!g.world.raycast(e, M.sub(head, e), { noGlass: true, see: true })) sees = true;
          }
        }
      }
      if (sees) {
        if (!ai.aware) {
          this.alertChar(g, c, p.pos);
          this.bark(g, c, 'spot');
          for (const o of g.chars) {
            if (o === c || o.state !== 'alive' || o.civilian || o.friendly || o.ai.aware) continue;
            if (o.ai.mode === 'hostage' || o.ai.mode === 'script' || o.ai.mode === 'flee' || o.ai.mode === 'dummy') continue;
            const same = c.group && o.group === c.group;
            if (M.dist(o.pos, c.pos) < (same ? 30 : 11)) this.alertChar(g, o, p.pos, g.rng.range(0.5, 1.1));
          }
        }
        ai.lastSeen = p.pos.slice();
        ai.lostT = 0;
      }
      ai.sees = sees;
    },

    update(g, c, dt) {
      const ai = c.ai;
      ai.t += dt;
      ai.flinch -= dt;
      ai.cd -= dt;
      ai.decideT -= dt;
      ai.reactT -= dt;
      ai.repathT -= dt;
      ai.grenT -= dt;
      c.anim.fireT += dt;
      c.anim.flinchT += dt;
      c.anim.throwT += dt;
      c.anim.swingT += dt;
      ai.want = [0, 0];
      ai.speedMul = 1;
      ai.aiming = false;
      if (ai.mode === 'prop') { c.anim.speed = 0; c.anim.move = [0, 0]; g.carryOnMover(c); return; }
      ai.percT -= dt;
      if (ai.percT <= 0) {
        ai.percT = 0.12;
        if (ai.mode !== 'script' || ai.watch) this.perceive(g, c);
      }
      if (ai.sees) ai.seenT += dt; else { ai.seenT = Math.max(0, ai.seenT - dt * 2); ai.lostT += dt; }
      switch (ai.mode) {
        case 'dummy': this.dummy(g, c, dt); break;
        case 'script': this.script(g, c, dt); break;
        case 'hostage': this.hostage(g, c, dt); break;
        case 'flee': this.flee(g, c, dt); break;
        case 'cop': this.cop(g, c, dt); break;
        case 'cower': c.posture = 'crouch'; break;
        case 'surrender': c.posture = 'crouch'; c.anim.hands = true; break;
        case 'hold': if (ai.sees && ai.reactT <= 0) this.shoot(g, c, dt); ai.faceYaw = ai.sees ? M.yawOf(g.player.pos[0] - c.pos[0], g.player.pos[2] - c.pos[2]) : ai.faceYaw; if (ai.aware && !ai.sees && ai.lostT > 4 && !c.stay) ai.mode = 'combat'; break;
        case 'search': this.search(g, c, dt); break;
        case 'patrol': this.patrol(g, c, dt); if (ai.aware) ai.mode = 'combat'; break;
        case 'combat': this.combat(g, c, dt); break;
        default: if (ai.aware) ai.mode = 'combat'; else if (ai.idleChat && g.rng.chance(dt * 0.05)) this.bark(g, c, 'idle');
      }
      this.move(g, c, dt);
      if (ai.burn > 0) ai.burn -= dt;
    },

    move(g, c, dt) {
      const ai = c.ai;
      if (c.static || ai.mode === 'dummy') { c.anim.speed = 0; c.anim.move = [0, 0]; this.face(c, dt); return; }
      let vx = ai.want[0], vz = ai.want[1];
      if (ai.flinch > 0) { vx *= 0.3; vz *= 0.3; }
      for (const o of g.chars) {
        if (o === c || o.state !== 'alive') continue;
        const dx = c.pos[0] - o.pos[0], dz = c.pos[2] - o.pos[2];
        const d2 = dx * dx + dz * dz;
        if (d2 < 0.5 && d2 > 1e-6 && Math.abs(c.pos[1] - o.pos[1]) < 1.5) {
          const d = Math.sqrt(d2);
          vx += dx / d * 1.6; vz += dz / d * 1.6;
        }
      }
      const pl = g.player;
      {
        const dx = c.pos[0] - pl.pos[0], dz = c.pos[2] - pl.pos[2];
        const d2 = dx * dx + dz * dz;
        if (d2 < 0.45 && d2 > 1e-6 && Math.abs(c.pos[1] - pl.pos[1]) < 1.5) { const d = Math.sqrt(d2); vx += dx / d * 2; vz += dz / d * 2; }
      }
      const acc = 22 * dt;
      c.vel[0] += M.clamp(vx - c.vel[0], -acc, acc);
      c.vel[2] += M.clamp(vz - c.vel[2], -acc, acc);
      c.vel[1] -= GRAV * dt;
      const sp = Math.hypot(vx, vz);
      if (sp > 0.2) g.pushDoors(c, [vx / sp, 0, vz / sp]);
      c.h = c.posture === 'crouch' ? 1.15 : 1.8;
      const res = g.world.move(c, dt, { step: 0.45 });
      g.carryOnMover(c);
      if (res.blocked && ai.action === 'strafe') ai.strafe *= -1;
      const moved = M.dist2d(c.pos, ai.lastPos);
      if (sp > 0.8 && moved < 0.02 * dt * 60) {
        ai.stuckT += dt;
        if (ai.stuckT > 0.6) {
          ai.stuckT = 0; ai.path = null; ai.repathT = 0; ai.strafe *= -1; ai.decideT = Math.min(ai.decideT, 0.1);
          const d = g.nav.randomNear(c.pos, 2.2, g.rng, q => M.dist2d(q, c.pos) > 0.8);
          if (d) { ai.detour = d; ai.detourT = 0.9; }
        }
      }
      else ai.stuckT = Math.max(0, ai.stuckT - dt);
      ai.lastPos = c.pos.slice();
      this.face(c, dt);
      const f = M.fwdOf(c.yaw), r = M.rightOf(c.yaw);
      c.anim.move = [c.vel[0] * r[0] + c.vel[2] * r[2], c.vel[0] * f[0] + c.vel[2] * f[2]];
      c.anim.speed = Math.hypot(c.vel[0], c.vel[2]);
      c.anim.crouch = c.posture === 'crouch';
      c.anim.aim = ai.aiming || ai.aware && ai.mode === 'combat';
      c.anim.burn = ai.burn > 0;
      const hide = ai.hidden && ai.mode === 'combat' && ai.action === 'cover' ? 1 : 0;
      c.anim.coverK = M.clamp((c.anim.coverK || 0) + (hide ? dt * 5 : -dt * 7), 0, 1);
      if (hide && ai.cover && ai.cover.n) c.anim.coverYaw = M.yawOf(-ai.cover.n[0], -ai.cover.n[2]);
    },

    face(c, dt) {
      c.yaw = M.turnTo(c.yaw, c.ai.faceYaw, (c.turnRate || 7) * dt);
    },

    goTo(g, c, target, speedMul) {
      const ai = c.ai;
      if (ai.detourT > 0 && ai.detour) {
        ai.detourT -= M.TICK;
        const dx = ai.detour[0] - c.pos[0], dz = ai.detour[2] - c.pos[2];
        const d = Math.hypot(dx, dz);
        if (d > 0.3) {
          const sp = c.speed * (speedMul || 1);
          ai.want = [dx / d * sp, dz / d * sp];
          ai.faceYaw = ai.sees && ai.mode === 'combat' ? ai.faceYaw : M.yawOf(dx, dz);
          return false;
        }
        ai.detourT = 0;
      }
      if (!ai.path || ai.repathT <= 0 || !ai.pathGoal || M.dist(ai.pathGoal, target) > 1.2) {
        ai.path = g.nav.path(c.pos, target);
        ai.pathI = 1;
        ai.repathT = 1.4 + g.rng.next() * 0.6;
        ai.pathGoal = target.slice();
      }
      let wp = null;
      if (ai.path) {
        wp = ai.path[ai.pathI];
        while (wp && M.dist2d(c.pos, wp) < 0.4) { ai.pathI++; wp = ai.path[ai.pathI]; }
        if (!wp) return true;
      } else {
        if (M.dist2d(c.pos, target) < 0.5) return true;
        wp = target;
      }
      const dx = wp[0] - c.pos[0], dz = wp[2] - c.pos[2];
      const d = Math.hypot(dx, dz) || 1;
      const sp = c.speed * (speedMul || 1) * (c.posture === 'crouch' ? 0.5 : 1);
      ai.want = [dx / d * sp, dz / d * sp];
      if (!ai.sees || ai.mode === 'script' || ai.mode === 'flee') ai.faceYaw = M.yawOf(dx, dz);
      return M.dist2d(c.pos, target) < 0.5;
    },

    script(g, c, dt) {
      const ai = c.ai;
      c.posture = 'stand';
      const arrived = this.goTo(g, c, ai.goal, ai.run ? 1 : 0.45);
      if (arrived) {
        ai.mode = ai.then;
        ai.path = null;
        if (ai.faceAfter !== undefined) { ai.faceYaw = ai.faceAfter; c.yaw = ai.faceAfter; }
        c.vel[0] = 0; c.vel[2] = 0;
        g.later(0, ai.arriveEv);
      }
    },

    patrol(g, c, dt) {
      const ai = c.ai;
      if (!c.patrol || !c.patrol.length) return;
      const p = c.patrol[ai.route % c.patrol.length];
      const target = [p[0], c.pos[1], p[1]];
      if (this.goTo(g, c, target, 0.4)) { ai.route++; ai.path = null; }
    },

    search(g, c, dt) {
      const ai = c.ai;
      if (ai.aware && ai.sees) { ai.mode = 'combat'; return; }
      ai.searchT = (ai.searchT || 0) + dt;
      const home = c.home;
      let target = ai.searchPos;
      if (M.dist(target, home) > ai.leash + 4 && !c.hunter) target = M.mix3(home, target, (ai.leash + 4) / M.dist(target, home));
      const arrived = this.goTo(g, c, target, 0.75);
      if (arrived || ai.searchT > 9) {
        ai.lookT = (ai.lookT || 0) + dt;
        ai.faceYaw += dt * 1.1;
        if (ai.lookT > 3.5) { ai.mode = ai.aware ? 'combat' : 'guard'; ai.lookT = 0; ai.heard = false; }
      }
    },

    prefer(c) { return RANGE[c.weapon] || [4, 12]; },

    decide(g, c) {
      const ai = c.ai, p = g.player, rng = g.rng;
      const W = M.WEAPONS[c.weapon] || {};
      const d = M.dist2d(c.pos, p.pos);
      const [lo, hi] = this.prefer(c);
      ai.decideT = rng.range(0.8, 1.6) * (c.boss ? 0.7 : 1);
      if (g.flags.ceasefire) { ai.action = 'hold'; return; }
      const fromHome = M.dist2d(c.pos, c.home);
      if (W.melee || c.melee) { ai.action = 'charge'; ai.decideT = 0.5; return; }
      if (c.boss === 'lupino' || c.type === 'lupino') {
        ai.action = d > 7 ? 'charge' : rng.pick(['strafe', 'strafe', 'charge', 'hold']);
        if (c.molo > 0 && ai.grenT <= 0 && d > 3.5 && d < 16) ai.action = 'grenade';
        return;
      }
      const pc = p.cover;
      if (pc && !c.stay && pc.hidT > (PRESSURE[g.diffIndex] || 2.2) && this.coverBlocks(g, c)) {
        if ((c.gren > 0 || c.molo > 0) && ai.grenT <= 0 && d > 4 && d < 19) { ai.action = 'grenade'; return; }
        if (!this.flanker(g) && this.findFlank(g, c)) {
          ai.action = 'flank';
          ai.decideT = 9;
          g.flankBy = c.id;
          this.bark(g, c, 'flank');
          return;
        }
      }
      if (!ai.sees) {
        if ((c.gren > 0 || c.molo > 0) && ai.grenT <= 0 && ai.lastSeen && d > 5 && d < 19 && ai.lostT < 5) { ai.action = 'grenade'; return; }
        if (c.stay) { ai.action = 'hold'; return; }
        ai.action = ai.lostT > 1.2 ? 'advance' : rng.chance(0.5) ? 'hold' : 'advance';
        return;
      }
      if ((c.gren > 0 || c.molo > 0) && ai.grenT <= 0 && d > 6 && d < 17 && rng.chance(0.3)) { ai.action = 'grenade'; return; }
      if (d > hi && !c.stay && (fromHome < ai.leash || c.hunter)) { ai.action = 'advance'; return; }
      if (d < lo && !c.stay && c.weapon !== 'pump' && c.weapon !== 'sawed') { ai.action = rng.chance(0.6) ? 'backoff' : 'strafe'; return; }
      const roll = rng.next();
      if (c.stay) ai.action = roll < 0.6 ? 'hold' : 'crouch';
      else if (roll < 0.3) ai.action = 'hold';
      else if (roll < 0.58) { ai.action = 'strafe'; if (rng.chance(0.5)) ai.strafe *= -1; }
      else if (roll < 0.72) ai.action = 'crouch';
      else ai.action = this.findCover(g, c) ? 'cover' : 'strafe';
    },

    findCover(g, c) {
      const ai = c.ai, p = g.player;
      const head = [p.pos[0], p.pos[1] + 1.5, p.pos[2]];
      const nodes = g.nav.nodesIn(c.pos, 6);
      let best = null, bs = -1e9;
      for (let k = 0; k < 26 && nodes.length; k++) {
        const q = nodes[Math.floor(g.rng.next() * nodes.length)];
        const pos = g.nav.pos(q);
        if (M.dist2d(pos, c.home) > ai.leash && !c.hunter) continue;
        const dp = M.dist2d(pos, p.pos);
        if (dp < 3.5) continue;
        const low = [pos[0], pos[1] + 1.0, pos[2]];
        const seg = M.sub(head, low);
        const hid = g.world.raycast(low, seg, { noGlass: true, noDyn: false });
        if (!hid) continue;
        const high = [pos[0], pos[1] + 1.62, pos[2]];
        const peek = !g.world.raycast(high, M.sub(head, high), { noGlass: true });
        const wall = hid.n[1] === 0 && hid.t * M.len(seg) < 1.1;
        const score = (peek ? 3 : 0.5) + (wall ? 1.2 : 0) - M.dist2d(pos, c.pos) * 0.35 - Math.abs(dp - 9) * 0.1;
        if (score > bs) { bs = score; best = { pos, peek, n: wall ? [hid.n[0], 0, hid.n[2]] : null, hit: hid.pos }; }
      }
      if (best && best.n) {
        const x = best.hit[0] + best.n[0] * 0.38, z = best.hit[2] + best.n[2] * 0.38, y = best.pos[1];
        if (!g.world.overlaps([x - 0.3, y + 0.05, z - 0.3], [x + 0.3, y + 1.15, z + 0.3], 'char')) best.pos = [x, y, z];
      }
      ai.cover = best;
      ai.peekT = 0;
      return !!best;
    },

    coverBlocks(g, c) {
      const e = eyeOf(c), tgt = chest(g);
      return !!g.world.raycast(e, M.sub(tgt, e), { noGlass: true });
    },

    flanker(g) {
      const c = g.flankBy ? g.char(g.flankBy) : null;
      return c && c.state === 'alive' && c.ai.action === 'flank' ? c : null;
    },

    findFlank(g, c) {
      const ai = c.ai, p = g.player;
      const tgt = M.bodySpheres(p)[1].c;
      const nodes = g.nav.nodesIn(p.pos, 9);
      let best = null, bs = -1e9;
      for (let k = 0; k < 40 && nodes.length; k++) {
        const pos = g.nav.pos(nodes[Math.floor(g.rng.next() * nodes.length)]);
        const dp = M.dist2d(pos, p.pos);
        if (dp < 2.5 || dp > 9) continue;
        if (!c.hunter && M.dist2d(pos, c.home) > ai.leash + 6) continue;
        const eye = [pos[0], pos[1] + 1.4, pos[2]];
        if (g.world.raycast(eye, M.sub(tgt, eye), { noGlass: true })) continue;
        const score = -M.dist2d(pos, c.pos) * 0.5 - Math.abs(dp - 5) * 0.3;
        if (score > bs) { bs = score; best = pos; }
      }
      ai.flank = best;
      ai.flankT = 0;
      return !!best;
    },

    combat(g, c, dt) {
      const ai = c.ai, p = g.player, rng = g.rng;
      ai.hidden = false;
      if (p.dead) { c.posture = 'stand'; return; }
      if (ai.decideT <= 0) this.decide(g, c);
      const toP = [p.pos[0] - c.pos[0], p.pos[2] - c.pos[2]];
      const d = Math.hypot(toP[0], toP[1]);
      if (ai.sees) ai.faceYaw = M.yawOf(toP[0], toP[1]);
      else if (ai.lastSeen && ai.action !== 'advance') ai.faceYaw = M.yawOf(ai.lastSeen[0] - c.pos[0], ai.lastSeen[2] - c.pos[2]);
      let crouch = false;
      switch (ai.action) {
        case 'hold': break;
        case 'crouch': crouch = !c.noCrouch; break;
        case 'strafe': {
          const r = M.rightOf(c.yaw);
          const sp = c.speed * 0.72;
          ai.want = [r[0] * ai.strafe * sp, r[2] * ai.strafe * sp];
          break;
        }
        case 'backoff': {
          const sp = c.speed * 0.6;
          ai.want = [-toP[0] / (d || 1) * sp, -toP[1] / (d || 1) * sp];
          break;
        }
        case 'advance': {
          const goal = ai.lastSeen || p.pos;
          if (M.dist(goal, c.home) > ai.leash + 3 && !c.hunter) { ai.action = 'hold'; break; }
          const arrived = this.goTo(g, c, goal, 1);
          if (arrived || (ai.sees && d < this.prefer(c)[1] * 0.85)) ai.decideT = Math.min(ai.decideT, 0.05);
          break;
        }
        case 'charge': {
          const arrived = this.goTo(g, c, p.pos, c.boss ? 1.05 : 1);
          if (ai.sees) ai.faceYaw = M.yawOf(toP[0], toP[1]);
          const W = M.WEAPONS[c.weapon];
          if (W && W.melee && d < 1.5 && Math.abs(p.pos[1] - c.pos[1]) < 1.2 && ai.cd <= 0 && ai.flinch <= 0) {
            ai.cd = 1.0;
            c.anim.swingT = 0;
            g.later(0.22, 'aiMelee', c.id);
          }
          if (arrived) ai.decideT = 0;
          break;
        }
        case 'cover': {
          if (!ai.cover) { ai.action = 'strafe'; break; }
          if (M.dist2d(c.pos, ai.cover.pos) > 0.45) { this.goTo(g, c, ai.cover.pos, 1); if (!ai.sees) break; }
          else {
            ai.peekT += dt;
            const cyc = ai.peekT % 3.2;
            crouch = cyc < 1.4;
            ai.hidden = crouch && !!ai.cover.n;
            ai.decideT = Math.max(ai.decideT, 0.5);
            if (ai.peekT > 7) ai.decideT = 0;
          }
          break;
        }
        case 'flank': {
          if (!ai.flank || !p.cover) { ai.decideT = 0; break; }
          ai.flankT += dt;
          const arrived = this.goTo(g, c, ai.flank, 1);
          if (arrived || ai.flankT > 7 || (ai.sees && ai.flankT > 0.6)) { ai.action = 'hold'; ai.decideT = 0.4; }
          break;
        }
        case 'grenade': {
          if (!ai.throwing) {
            ai.throwing = true;
            c.anim.throwT = 0;
            ai.throwAt = g.time + 0.45;
          } else if (g.time >= ai.throwAt) {
            ai.throwing = false;
            const kind = c.molo > 0 && (c.gren <= 0 || rng.chance(0.5)) ? 'molotov' : 'grenade';
            if (kind === 'molotov') c.molo--; else c.gren--;
            const tgt = (ai.sees ? p.pos : ai.lastSeen || p.pos).slice();
            if (c.boss && d < 3.5) { tgt[0] = c.pos[0] + rng.range(-1, 1); tgt[2] = c.pos[2] + rng.range(-1, 1); }
            tgt[0] += rng.range(-1.2, 1.2); tgt[2] += rng.range(-1.2, 1.2);
            this.throwAt(g, c, kind, tgt);
            ai.grenT = c.boss ? rng.range(4, 6) : rng.range(8, 14);
            ai.decideT = 0.4;
            ai.action = 'hold';
            this.bark(g, c, 'grenade');
          }
          break;
        }
      }
      c.posture = crouch ? 'crouch' : 'stand';
      if (ai.action !== 'grenade') this.shoot(g, c, dt);
    },

    swingPending(g, c) {
      const d = M.dist(c.pos, g.player.pos);
      if (d < 1.9 && Math.abs(c.pos[1] - g.player.pos[1]) < 1.2) {
        const dir = M.norm(M.sub(g.player.pos, c.pos));
        g.hurtPlayer(c.meleeDmg || 16, dir, c.id, c.weapon);
        g.emit({ t: 'sfx', id: 'bash', pos: g.player.pos.slice() });
      } else g.emit({ t: 'sfx', id: 'swing', pos: c.pos.slice() });
    },

    throwAt(g, c, kind, tgt) {
      const s = [c.pos[0], c.pos[1] + 1.7, c.pos[2]];
      const dx = tgt[0] - s[0], dz = tgt[2] - s[2], dy = tgt[1] + 0.2 - s[1];
      const dh = Math.hypot(dx, dz);
      const Tt = M.clamp(dh / 10, 0.55, 1.35);
      g.spawnThrow(kind, s, [dx / Tt, dy / Tt + 0.5 * GRAV * Tt, dz / Tt], c.id);
    },

    shoot(g, c, dt) {
      const ai = c.ai, p = g.player;
      const W = M.WEAPONS[c.weapon];
      if (!W || W.melee || W.throwable) return;
      ai.aiming = ai.sees;
      if (ai.reload > 0) {
        ai.reload -= dt;
        c.anim.reloadT = 0;
        if (ai.reload <= 0) c.clip = W.clip;
        return;
      }
      if (!ai.sees || ai.reactT > 0 || ai.flinch > 0 || ai.cd > 0 || c.holdFire || g.flags.ceasefire) return;
      if (c.posture === 'crouch' && ai.action === 'cover') return;
      if (c.clip <= 0) {
        ai.reload = W.reload * 1.3;
        if (g.rng.chance(0.4)) this.bark(g, c, 'reload');
        return;
      }
      const F = FIRE[c.fireAs || c.weapon] || FIRE.beretta;
      if (ai.burst <= 0) ai.burst = g.rng.int(F.burst[0], F.burst[1]);
      ai.burst--;
      c.clip--;
      ai.cd = ai.burst > 0 ? F.gap : g.rng.range(F.rest[0], F.rest[1]);
      this.fire(g, c, F, W);
    },

    fire(g, c, F, W) {
      const p = g.player, ai = c.ai;
      const f = M.fwdOf(c.yaw), r = M.rightOf(c.yaw);
      const side = W.hold === 'dual' ? (ai.side = 1 - (ai.side || 0)) : 0;
      const sx = side ? -0.22 : 0.22;
      const h = c.posture === 'crouch' ? 0.95 : 1.42;
      const muzzle = [c.pos[0] + f[0] * 0.55 + r[0] * sx, c.pos[1] + h, c.pos[2] + f[2] * 0.55 + r[2] * sx];
      const eye = eyeOf(c);
      const blocked = g.world.raycast(eye, M.sub(muzzle, eye), { noGlass: true });
      const from = blocked ? M.addScaled(eye, M.sub(muzzle, eye), Math.max(0, blocked.t - 0.05)) : muzzle;
      const tgt = chest(g);
      let dir = M.norm(M.sub(tgt, from));
      const t = T(c);
      let spread = (F.spread || 0.042) / Math.max(0.3, g.diff.acc * t.acc * (c.accMul || 1));
      spread /= Math.max(0.5, g.adapt);
      const pv = Math.hypot(p.vel[0], p.vel[2]);
      if (pv > 2) spread *= 1.45;
      if (p.dodge && p.dodge.phase === 'air') spread *= 2.6;
      else if (p.dodge) spread *= 1.2;
      if (p.crouch) spread *= 0.9;
      if (ai.seenT < 0.9) spread *= 1.6;
      if (g.bt.on) spread *= 1.1;
      const pellets = W.pellets || 1;
      for (let i = 0; i < pellets; i++) {
        const d = g.jitter(dir, spread + (pellets > 1 ? W.spread * 0.8 : 0));
        g.spawnBullet(from, d, F.speed || W.speed * 0.85, F.dmg, c.id, c.fireAs || c.weapon);
      }
      c.anim.fireT = 0;
      c.anim.side = side;
      g.emit({ t: 'shot', weapon: c.fireAs || c.weapon, pos: from, dir, owner: c.id, side, npc: true });
    },

    hostage(g, c, dt) {
      const ai = c.ai;
      const h = g.char(c.hostage);
      if (!h || h.state !== 'alive') { ai.mode = 'combat'; ai.aware = true; return; }
      ai.faceYaw = M.yawOf(g.player.pos[0] - c.pos[0], g.player.pos[2] - c.pos[2]);
      c.anim.hostage = true;
      if (ai.sees) {
        if (!ai.threat) { ai.threat = true; g.say(c.name, c.threatLine || 'Ещё шаг, и он труп! Слышишь?!', 3); g.fireEvent('hostage:' + c.id); }
        ai.hostT += dt;
        if (ai.hostT > (c.hostageTime || 2.4)) {
          c.anim.fireT = 0;
          g.emit({ t: 'shot', weapon: c.weapon, pos: [c.pos[0], c.pos[1] + 1.4, c.pos[2]], dir: M.norm(M.sub(h.pos, c.pos)), owner: c.id, npc: true });
          g.killChar(h, M.norm(M.sub(h.pos, c.pos)), 'head', c.weapon, c.id);
          ai.mode = 'combat';
          c.anim.hostage = false;
        }
      }
    },

    flee(g, c, dt) {
      const ai = c.ai, p = g.player;
      const route = c.route || [];
      const pt = route[ai.route];
      if (!pt) { ai.mode = c.fleeThen || 'combat'; return; }
      const d = M.dist(p.pos, c.pos);
      const go = ai.fleeGo || d < (pt.near || c.fleeNear || 13) || pt.go;
      if (go) {
        ai.fleeGo = true;
        const arrived = this.goTo(g, c, pt.p, pt.speed || 1);
        if (arrived) {
          ai.fleeGo = false;
          ai.route++;
          ai.path = null;
          if (pt.ev) g.fireEvent(pt.ev, c.id);
        }
      } else {
        ai.faceYaw = M.yawOf(p.pos[0] - c.pos[0], p.pos[2] - c.pos[2]);
        if (ai.sees && d < 18) this.shoot(g, c, dt);
      }
      if (go && ai.sees && d < 12 && g.rng.chance(dt * 0.8) && ai.cd <= 0 && c.clip > 0) {
        const W = M.WEAPONS[c.weapon];
        if (W && !W.melee) { ai.cd = 0.5; c.clip--; this.fire(g, c, FIRE[c.weapon] || FIRE.beretta, W); }
      }
      if (c.clip <= 0) c.clip = (M.WEAPONS[c.weapon] || {}).clip || 10;
    },

    cop(g, c, dt) {
      const ai = c.ai;
      c.posture = 'stand';
      if (g.flags.copsFire && ai.sees) {
        ai.faceYaw = M.yawOf(g.player.pos[0] - c.pos[0], g.player.pos[2] - c.pos[2]);
        ai.reactT = Math.min(ai.reactT, 0);
        this.shoot(g, c, dt);
      } else if (c.faceYaw !== undefined) ai.faceYaw = c.faceYaw;
    },

    dummy(g, c, dt) {
      const ai = c.ai;
      if (c.popup && !c.raised) { c.posture = 'lie'; c.noHit = true; return; }
      c.noHit = false;
      c.posture = 'stand';
      if (c.rail) {
        ai.railT = (ai.railT || 0) + dt * (c.railSpeed || 0.5);
        const k = (Math.sin(ai.railT) + 1) / 2;
        c.pos[0] = M.lerp(c.rail[0], c.rail[2], k);
        c.pos[2] = M.lerp(c.rail[1], c.rail[3], k);
      }
      if (c.shoots && ai.sees) {
        ai.reactT = Math.min(ai.reactT, 0.4);
        const W = M.WEAPONS.beretta;
        if (ai.cd <= 0 && ai.reactT <= 0) {
          const F = FIRE.training;
          ai.cd = g.rng.range(F.rest[0], F.rest[1]);
          this.fire(g, c, F, W);
        }
      }
    }
  };
  M.AI = AI;

  M.SYSTEM_EVENTS = Object.assign(M.SYSTEM_EVENTS || {}, {
    aiMelee(g, id) {
      const c = g.char(id);
      if (c && c.state === 'alive') AI.swingPending(g, c);
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
