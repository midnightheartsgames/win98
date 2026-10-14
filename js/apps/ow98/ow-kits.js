(function (O) {
  'use strict';
  const K = O.KITS = O.KITS || {};
  const G = O.Game.prototype;

  G.melee = function (h, dmg, range, arc, o = {}) {
    const e = this.eye(h), f = this.aim(h);
    const hits = [];
    const cosA = Math.cos(arc);
    for (const t of this.heroes) {
      if (t.team === h.team || !this.targetable(t)) continue;
      const c = this.chest(t);
      const dx = c.x - e.x, dy = c.y - e.y, dz = c.z - e.z;
      const d = Math.hypot(dx, dy, dz);
      if (d - t.r > range) continue;
      const hd = Math.hypot(dx, dz) || 1;
      const fh = Math.hypot(f.x, f.z) || 1;
      const dot = (dx * f.x + dz * f.z) / (hd * fh);
      if (d > t.r + 0.6 && dot < cosA) continue;
      if (Math.abs(dy) > range * 0.9 + 1) continue;
      if (!this.world.clear(e.x, e.y, e.z, c.x, c.y, c.z)) continue;
      if (this.blockedByBarrier(h.team, e, c)) {
        const b = this.barriers.find(b => b.team !== h.team && b.hp > 0);
        if (b) this.damageBarrier(b, dmg, h);
        continue;
      }
      hits.push(t);
      if (!o.cleave && hits.length) break;
    }
    if (!hits.length && !o.noBarrier) {
      const r = this.trace(h, e.x, e.y, e.z, f.x, f.y, f.z, range);
      if (r.barrier) this.damageBarrier(r.barrier, dmg, h);
      else if (r.dep) this.damageDeploy(r.dep, dmg, h);
    }
    for (const t of hits) {
      this.damage(h, t, dmg, { kind: 'melee', ability: o.ability || 'melee', from: e });
      if (o.knock) {
        const dx = t.pos.x - h.pos.x, dz = t.pos.z - h.pos.z, l = Math.hypot(dx, dz) || 1;
        this.knock(t, dx / l * o.knock, o.lift || 2.5, dz / l * o.knock);
      }
    }
    return hits;
  };

  G.lookTarget = function (h, range, cone, team, o = {}) {
    const e = this.eye(h), f = this.aim(h);
    let best = null, bs = -Infinity;
    const cosC = Math.cos(cone);
    for (const t of this.heroes) {
      if (!t.alive || t === h || (team === 'ally' ? t.team !== h.team : t.team === h.team)) continue;
      if (team !== 'ally' && !this.targetable(t)) continue;
      if (o.filter && !o.filter(t)) continue;
      const c = this.chest(t);
      const dx = c.x - e.x, dy = c.y - e.y, dz = c.z - e.z;
      const d = Math.hypot(dx, dy, dz);
      if (d > range || d < 0.01) continue;
      const dot = (dx * f.x + dy * f.y + dz * f.z) / d;
      if (dot < cosC) continue;
      if (!this.world.clear(e.x, e.y, e.z, c.x, c.y, c.z)) continue;
      const score = dot * 3 - d / range;
      if (score > bs) { bs = score; best = t; }
    }
    return best;
  };

  G.hasLos = function (a, b) {
    const e = this.eye(a), c = this.chest(b);
    return this.world.clear(e.x, e.y, e.z, c.x, c.y, c.z);
  };

  function act(g, h, name, item) { h.vis.act = name; h.vis.actT = g.t; h.vis.item = item || null; }
  function reloading(g, h, dt) {
    if (h.reloadT > 0) {
      h.reloadT -= dt;
      if (h.reloadT <= 0) { h.reloadT = 0; h.ammo = h.maxAmmo; h.vis.reloading = false; }
      return true;
    }
    return false;
  }
  function startReload(g, h, time) {
    if (h.ammo >= h.maxAmmo || h.reloadT > 0) return;
    h.reloadT = time;
    h.vis.reloading = true;
    act(g, h, 'reload');
    g.sound('reload', h.pos, { hero: h.heroId, h: h.id });
  }
  function common(g, h, inp, dt, reloadTime) {
    if (g.pressed(h, inp, 'melee') && !(h.cd.melee > 0) && !h.k.busy) {
      h.cd.melee = O.MELEE.cd;
      h.reloadT = 0; h.vis.reloading = false;
      act(g, h, 'melee');
      g.melee(h, O.MELEE.dmg, O.MELEE.range, O.MELEE.arc, { ability: 'melee', knock: h.heroId === 'zenyatta' ? 6 : 0 });
      g.sound('melee', h.pos, { h: h.id });
      h.fireCd = Math.max(h.fireCd, 0.45);
      return true;
    }
    if (reloadTime && inp.reload && h.ammo < h.maxAmmo && h.reloadT <= 0) startReload(g, h, reloadTime);
    if (reloadTime && h.ammo <= 0 && h.reloadT <= 0) startReload(g, h, reloadTime);
    return false;
  }
  function moveDir(h, inp) {
    let f = inp.fwd, s = inp.side;
    if (Math.abs(f) < 0.1 && Math.abs(s) < 0.1) f = 1;
    const sy = Math.sin(h.yaw), cy = Math.cos(h.yaw);
    let x = sy * f - cy * s, z = cy * f + sy * s;
    const l = Math.hypot(x, z) || 1;
    return { x: x / l, z: z / l };
  }
  function dash(g, h, dx, dz, dist) {
    const saveV = { x: h.vel.x, y: h.vel.y, z: h.vel.z };
    h.vel.x = dx * dist / O.TICK; h.vel.z = dz * dist / O.TICK; h.vel.y = 0;
    const wasGround = h.onGround;
    g.world.moveChar(h, O.TICK);
    h.vel.x = saveV.x; h.vel.y = wasGround ? 0 : Math.max(0, saveV.y); h.vel.z = saveV.z;
  }
  function aimAt(g, h, t) {
    const e = g.eye(h), c = g.chest(t);
    const dx = c.x - e.x, dy = c.y - e.y, dz = c.z - e.z, l = Math.hypot(dx, dy, dz) || 1;
    return { x: dx / l, y: dy / l, z: dz / l };
  }
  O.KitUtil = { act, reloading, startReload, common, moveDir, dash, aimAt };

  K.mccree = {
    init(g, h) { h.maxAmmo = h.def.w.ammo; h.ammo = h.maxAmmo; },
    speed(g, h) { return h.ultOn === 'deadeye' ? h.def.deadeye.speedMul : 1; },
    tick(g, h, inp, dt) {
      const d = h.def;
      if (h.ultOn === 'deadeye') { this.deadeye(g, h, inp, dt); return; }
      if (h.k.roll > 0) return;
      if (h.k.fan > 0) {
        h.k.fanT -= dt;
        if (h.k.fanT <= 0 && h.ammo > 0) {
          const dir = g.spreadDir(g.aim(h), d.fan.spread);
          g.hitscan(h, dir, 60, d.fan.dmg, { fall: d.w.fall, ability: 'fan', tracer: 'tracer' });
          h.ammo--; h.k.fanT = d.fan.interval; h.vis.shot2T = g.t;
          g.sound('revolver', h.pos, { h: h.id, fan: true });
        }
        if (h.ammo <= 0) { h.k.fan = 0; h.fireCd = 0.3; startReload(g, h, d.w.reload); }
        return;
      }
      if (common(g, h, inp, dt, d.w.reload)) return;
      const rl = reloading(g, h, dt);
      if (!rl && inp.fire && h.fireCd <= 0 && h.ammo > 0) {
        g.hitscan(h, g.aim(h), 120, d.w.dmg, { fall: d.w.fall, crit: d.w.crit, ability: 'revolver' });
        h.ammo--; h.fireCd = d.w.interval; h.vis.shotT = g.t;
        g.sound('revolver', h.pos, { h: h.id });
      } else if (!rl && inp.fire2 && h.fireCd <= 0 && h.ammo > 0) {
        h.k.fan = 1; h.k.fanT = 0;
      }
      if (g.pressed(h, inp, 'shift') && !(h.cd.shift > 0)) {
        h.cd.shift = d.roll.cd;
        h.k.roll = d.roll.dur;
        h.k.rollDir = moveDir(h, inp);
        h.ammo = h.maxAmmo; h.reloadT = 0; h.vis.reloading = false;
        act(g, h, 'roll');
        g.sound('roll', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'e') && !(h.cd.e > 0)) {
        h.cd.e = d.flash.cd;
        const e = g.eye(h), f = g.aim(h);
        g.spawnProj(h, { kind: 'flash', pos: e, vel: { x: f.x * 25, y: f.y * 25, z: f.z * 25 }, r: 0.2, life: d.flash.range / 25, explodeOnEnd: false, ability: 'flash' });
        act(g, h, 'throw', 'flash');
        g.sound('throw', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        g.useUlt(h, 'deadeye');
        h.k.marks = {};
        act(g, h, 'deadeye');
      }
    },
    move(g, h, inp, dt) {
      if (!(h.k.roll > 0)) return false;
      const d = h.def.roll;
      h.k.roll -= dt;
      h.vel.x = h.k.rollDir.x * d.dist / d.dur;
      h.vel.z = h.k.rollDir.z * d.dist / d.dur;
      h.vel.y -= O.GRAVITY * dt;
      h.dyn = g.dyn;
      g.world.moveChar(h, dt);
      if (h.k.roll <= 0) { h.vel.x *= 0.3; h.vel.z *= 0.3; }
      return true;
    },
    deadeye(g, h, inp, dt) {
      const d = h.def.deadeye;
      h.ultT += dt;
      const e = g.eye(h), f = g.aim(h);
      for (const t of g.heroes) {
        if (t.team === h.team || !g.targetable(t)) continue;
        const c = g.chest(t);
        const dx = c.x - e.x, dy = c.y - e.y, dz = c.z - e.z, dd = Math.hypot(dx, dy, dz);
        const vis = dd < 80 && (dx * f.x + dy * f.y + dz * f.z) / dd > Math.cos(0.75) && g.world.clear(e.x, e.y, e.z, c.x, c.y, c.z);
        if (vis) h.k.marks[t.id] = (h.k.marks[t.id] || 0) + d.rate * dt;
        h.k.vis = h.k.vis || {};
        h.k.vis[t.id] = vis;
      }
      if ((inp.fire && h.ultT > 0.4) || h.ultT >= d.dur) {
        let any = false;
        for (const id in h.k.marks) {
          const t = g.heroes[id];
          if (!t || !g.targetable(t) || !h.k.vis[id]) continue;
          const dmg = h.k.marks[id];
          if (dmg < 1) continue;
          any = true;
          const dir = aimAt(g, h, t);
          const r = g.trace(h, e.x, e.y, e.z, dir.x, dir.y, dir.z, 90);
          if (r.hero === t) g.damage(h, t, dmg, { kind: 'bullet', ability: 'deadeye', from: e });
          else if (r.barrier) g.damageBarrier(r.barrier, dmg, h);
          g.addFx('tracer', { x0: e.x, y0: e.y - 0.15, z0: e.z, x1: r.x, y1: r.y, z1: r.z, team: h.team, hero: 'mccree', owner: h.id, hit: true, big: true });
        }
        g.sound('deadeyeFire', h.pos, { h: h.id, any });
        h.vis.shotT = g.t;
        h.ultOn = null; h.k.marks = {};
        h.ammo = Math.max(0, h.ammo - 1);
        h.fireCd = 0.6;
        act(g, h, 'fire');
      }
    },
    endUlt(g, h) { h.k.marks = {}; },
    proj(g, p, type) {
      if (p.kind !== 'flash') return false;
      if (type === 'fly') return true;
      if (type === 'hero' || type === 'world' || type === 'barrier' || type === 'dep') {
        this.flashBoom(g, p);
        p.dead = true;
        return true;
      }
      return false;
    },
    flashBoom(g, p) {
      const src = g.heroes[p.owner], d = O.HEROES.mccree.flash;
      for (const t of g.heroes) {
        if (t.team === p.team || !g.targetable(t)) continue;
        const c = g.chest(t);
        if (Math.hypot(c.x - p.pos.x, c.y - p.pos.y, c.z - p.pos.z) > d.r + t.r) continue;
        if (!g.world.clear(p.pos.x, p.pos.y, p.pos.z, c.x, c.y, c.z)) continue;
        g.damage(src, t, d.dmg, { kind: 'splash', ability: 'flash', from: p.pos });
        stun(g, t, d.stun);
      }
      g.addFx('flash', { x: p.pos.x, y: p.pos.y, z: p.pos.z, team: p.team });
      g.sound('flashbang', p.pos);
    }
  };

  function stun(g, t, dur) {
    if (!t.alive || t.st.invuln > 0) return;
    t.st.stun = Math.max(t.st.stun || 0, dur);
    const kit = O.KITS[t.heroId];
    if (kit && kit.interrupt) kit.interrupt(g, t);
    g.ev('stunned', { h: t.id, dur });
  }
  O.stun = stun;

  K.mccree.interrupt = function (g, h) {
    if (h.ultOn === 'deadeye') { h.ultOn = null; h.k.marks = {}; }
    h.k.fan = 0;
  };

  K.soldier = {
    init(g, h) { h.maxAmmo = h.def.w.ammo; h.ammo = h.maxAmmo; h.k.shots = 0; h.k.lastShot = -9; },
    speed(g, h) { return h.k.sprint ? h.def.sprint.mul : 1; },
    tick(g, h, inp, dt) {
      const d = h.def;
      if (h.ultOn === 'visor') { h.ultT += dt; if (h.ultT >= d.visor.dur) h.ultOn = null; }
      h.k.sprint = !!inp.shift && inp.fwd > 0.3 && !inp.fire && !inp.fire2 && h.onGround !== undefined && !(h.k.helixN > 0);
      h.vis.sprint = h.k.sprint;
      if (h.k.helixN > 0) {
        h.k.helixT -= dt;
        if (h.k.helixT <= 0) {
          g.fireProj(h, d.helix.speed, { kind: 'helix', dmg: 25, r: 0.15, life: 2, ability: 'helix', splash: { dmg: 15, r: 2.2, self: 0.5, minF: 0.3, ability: 'helix', knock: 3, fx: 'small' } }, 1, 0.012);
          h.k.helixN--; h.k.helixT = d.helix.gap;
          g.sound('helix', h.pos, { h: h.id });
        }
      }
      if (common(g, h, inp, dt, h.ultOn === 'visor' ? 0 : d.w.reload)) return;
      const rl = reloading(g, h, dt);
      if (g.t - h.k.lastShot > 0.28) h.k.shots = 0;
      if (!rl && inp.fire && !h.k.sprint && h.fireCd <= 0 && (h.ammo > 0 || h.ultOn === 'visor')) {
        let dir;
        let crit = d.w.crit;
        if (h.ultOn === 'visor') {
          const t = g.lookTarget(h, 70, 0.9, 'enemy');
          dir = t ? aimAt(g, h, t) : g.aim(h);
          crit = 0;
        } else {
          const spread = h.k.shots < 2 ? d.w.spreadMin : Math.min(d.w.spreadMax, d.w.spreadMin + (h.k.shots - 1) * d.w.bloom);
          dir = g.spreadDir(g.aim(h), spread);
        }
        g.hitscan(h, dir, 120, d.w.dmg, { fall: d.w.fall, crit, ability: h.ultOn === 'visor' ? 'visor' : 'rifle', tracer: 'pulse' });
        if (h.ultOn !== 'visor') h.ammo--;
        h.fireCd += 1 / d.w.rate; if (h.fireCd < 0) h.fireCd = 0;
        h.k.shots++; h.k.lastShot = g.t; h.vis.shotT = g.t;
        g.sound('pulseRifle', h.pos, { h: h.id });
      }
      if (inp.fire2 && !(h.cd.fire2 > 0) && !h.k.sprint) {
        h.cd.fire2 = d.helix.cd; h.k.helixN = d.helix.count; h.k.helixT = 0; h.vis.shot2T = g.t;
      }
      if (g.pressed(h, inp, 'e') && !(h.cd.e > 0)) {
        h.cd.e = d.field.cd;
        const x = h.pos.x + Math.sin(h.yaw) * 1.2, z = h.pos.z + Math.cos(h.yaw) * 1.2;
        const gy = g.world.groundAt(x, z, h.pos.y + 0.6);
        const y = gy > -Infinity && gy > h.pos.y - 3 ? gy : h.pos.y;
        g.addDeploy(h, { kind: 'field', pos: { x: g.world.clear(h.pos.x, h.pos.y + 0.5, h.pos.z, x, y + 0.5, z) ? x : h.pos.x, y, z: g.world.clear(h.pos.x, h.pos.y + 0.5, h.pos.z, x, y + 0.5, z) ? z : h.pos.z }, life: d.field.dur, shootable: false });
        act(g, h, 'throw', 'field');
        g.sound('biotic', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        g.useUlt(h, 'visor');
        h.ammo = h.maxAmmo; h.reloadT = 0; h.vis.reloading = false;
      }
    },
    deploy(g, d, dt) {
      if (d.kind !== 'field') return;
      const src = g.heroes[d.owner];
      const def = O.HEROES.soldier.field;
      for (const t of g.heroes) {
        if (!t.alive || t.team !== d.team) continue;
        if (Math.hypot(t.pos.x - d.pos.x, t.pos.z - d.pos.z) > def.r || Math.abs(t.pos.y - d.pos.y) > 3) continue;
        g.heal(src, t, def.heal * dt, { self: true });
      }
    }
  };

  K.tracer = {
    init(g, h) { h.maxAmmo = h.def.w.ammo; h.ammo = h.maxAmmo; h.k.blinks = h.def.blink.charges; h.k.blinkT = 0; h.k.side = 1; },
    tick(g, h, inp, dt) {
      const d = h.def;
      if (h.k.recalling > 0) return;
      if (h.k.blinks < d.blink.charges) {
        h.k.blinkT += dt * (g.rules.cdMul === 1 ? 1 : 1 / g.rules.cdMul);
        if (h.k.blinkT >= d.blink.cd) { h.k.blinks++; h.k.blinkT = 0; }
      }
      h.cd.shift = h.k.blinks > 0 ? 0 : d.blink.cd - h.k.blinkT;
      if (common(g, h, inp, dt, d.w.reload)) return;
      const rl = reloading(g, h, dt);
      if (!rl && inp.fire && h.fireCd <= 0 && h.ammo > 0) {
        h.k.side = -h.k.side;
        g.hitscan(h, g.spreadDir(g.aim(h), d.w.spread), 80, d.w.dmg, { fall: d.w.fall, crit: d.w.crit, ability: 'pistols', side: h.k.side, tracer: 'pulse' });
        h.ammo--; h.fireCd += 1 / d.w.rate; if (h.fireCd < 0) h.fireCd = 0;
        h.vis.shotT = g.t; h.vis.side = h.k.side;
        if ((g.tickN & 1) === 0) g.sound('pistol', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'shift') && h.k.blinks > 0 && !(h.st.root > 0)) {
        h.k.blinks--;
        const md = moveDir(h, inp);
        const from = { x: h.pos.x, y: h.pos.y, z: h.pos.z };
        dash(g, h, md.x, md.z, d.blink.dist);
        g.addFx('blink', { x0: from.x, y0: from.y + 1, z0: from.z, x1: h.pos.x, y1: h.pos.y + 1, z1: h.pos.z, owner: h.id });
        act(g, h, 'blink');
        g.sound('blink', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'e') && !(h.cd.e > 0) && h.hist.length > 5) {
        h.cd.e = d.recall.cd;
        const snap = h.hist[0];
        h.k.recalling = d.recall.dur;
        h.k.recFrom = { x: h.pos.x, y: h.pos.y, z: h.pos.z };
        h.k.recTo = snap;
        h.k.recPath = h.hist.slice();
        act(g, h, 'recall');
        g.sound('recall', h.pos, { h: h.id });
        g.addFx('recall', { x: h.pos.x, y: h.pos.y + 1, z: h.pos.z, owner: h.id });
      }
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        g.useUlt(h, 'bomb');
        const e = g.eye(h), f = g.aim(h);
        g.spawnProj(h, { kind: 'bomb', pos: e, vel: { x: f.x * d.bomb.speed, y: f.y * d.bomb.speed + 3, z: f.z * d.bomb.speed }, grav: 14, r: 0.25, life: 3, ability: 'pulsebomb' });
        h.ultOn = null;
        act(g, h, 'throw', 'bomb');
      }
    },
    move(g, h, inp, dt) {
      if (!(h.k.recalling > 0)) return false;
      const d = h.def.recall;
      h.k.recalling -= dt;
      const path = h.k.recPath;
      const f = 1 - Math.max(0, h.k.recalling) / d.dur;
      const idx = Math.max(0, Math.min(path.length - 1, Math.round((1 - f) * (path.length - 1))));
      const p = path[idx];
      h.pos.x = p.x; h.pos.y = p.y; h.pos.z = p.z;
      h.vel.x = h.vel.y = h.vel.z = 0;
      if (h.k.recalling <= 0) {
        const s = h.k.recTo;
        h.pos.x = s.x; h.pos.y = s.y; h.pos.z = s.z;
        h.hp = Math.max(h.hp, Math.min(h.maxHp, s.hp));
        h.ammo = h.maxAmmo; h.reloadT = 0; h.vis.reloading = false;
        h.k.recalling = 0;
        h.hist = [];
        g.addFx('recall', { x: h.pos.x, y: h.pos.y + 1, z: h.pos.z, owner: h.id, end: true });
      }
      return true;
    },
    proj(g, p, type, ev, dt) {
      if (p.kind !== 'bomb') return false;
      const d = O.HEROES.tracer.bomb;
      if (type === 'stuck') {
        p.fuse -= dt;
        if (p.stuckTo >= 0) {
          const t = g.heroes[p.stuckTo];
          if (t && t.alive) { p.pos.x = t.pos.x + p.off.x; p.pos.y = t.pos.y + p.off.y; p.pos.z = t.pos.z + p.off.z; }
          else if (t) { p.pos.x = t.deathPos ? t.deathPos.x : p.pos.x; }
        }
        if (p.fuse <= 0) {
          const src = g.heroes[p.owner];
          g.explode(src, p.pos, d.dmg, d.r, { self: 0.3, minF: 0.25, ability: 'pulsebomb', fx: 'pulse', snd: 'pulseBoom' });
          p.dead = true;
        }
        return true;
      }
      if (type === 'hero') {
        p.stuckTo = ev.h.id;
        p.off = { x: p.pos.x - ev.h.pos.x, y: Math.max(0.6, p.pos.y - ev.h.pos.y), z: p.pos.z - ev.h.pos.z };
        p.fuse = d.fuse; p.life = 99;
        g.ev('stuck', { src: p.owner, dst: ev.h.id });
        g.sound('bombStick', p.pos, { h: p.owner });
        return true;
      }
      if (type === 'world' || type === 'barrier' || type === 'dep') {
        p.stuckTo = -1; p.fuse = d.fuse; p.life = 99;
        g.sound('bombStick', p.pos);
        return true;
      }
      if (type === 'fly') return true;
      return false;
    }
  };

  K.junkrat = {
    init(g, h) { h.maxAmmo = h.def.w.ammo; h.ammo = h.maxAmmo; h.k.mine = null; h.k.trap = null; h.k.tire = null; },
    speed(g, h) { return h.ultOn === 'tire' ? 0 : 1; },
    tick(g, h, inp, dt) {
      const d = h.def;
      if (h.ultOn === 'tire') {
        const tire = g.deploy.find(x => x.id === h.k.tire);
        if (!tire || tire.dead) { h.ultOn = null; h.k.tire = null; }
        else if (g.pressed(h, inp, 'fire') || g.pressed(h, inp, 'q')) tire.boom = true;
        return;
      }
      if (h.k.mine !== null && (g.pressed(h, inp, 'fire2') || g.pressed(h, inp, 'shift'))) {
        const m = g.deploy.find(x => x.id === h.k.mine) || g.proj.find(x => x.id === h.k.mine);
        if (m) this.mineBoom(g, h, m);
        h.k.mine = null;
        h.cd.shift = d.mine.cd;
      } else if (g.pressed(h, inp, 'shift') && h.k.mine === null && !(h.cd.shift > 0)) {
        const f = g.aim(h), e = g.eye(h);
        const p = g.spawnProj(h, { kind: 'mine', pos: e, vel: { x: f.x * d.mine.speed, y: f.y * d.mine.speed + 2.5, z: f.z * d.mine.speed }, grav: 12, r: 0.2, life: 6, noHero: false, ability: 'mine' });
        h.k.mine = p.id;
        h.cd.shift = 0.4;
        act(g, h, 'throw', 'mine');
        g.sound('throw', h.pos, { h: h.id });
      }
      if (common(g, h, inp, dt, d.w.reload)) return;
      const rl = reloading(g, h, dt);
      if (!rl && inp.fire && h.fireCd <= 0 && h.ammo > 0) {
        g.fireProj(h, d.w.speed, { kind: 'frag', dmg: d.w.dmg, grav: d.w.grav, r: 0.16, life: d.w.fuse, bounce: 99, rest: 0.55, explodeOnEnd: true, ability: 'frag', splash: { dmg: d.w.dmg, r: d.w.r, self: d.w.selfMul, minF: 0.25, ability: 'frag', knock: 3 } });
        h.ammo--; h.fireCd = d.w.interval; h.vis.shotT = g.t;
        g.sound('frag', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'e') && !(h.cd.e > 0)) {
        h.cd.e = d.trap.cd;
        const old = g.deploy.find(x => x.id === h.k.trap);
        if (old) old.dead = true;
        const f = g.aim(h), e = g.eye(h);
        const p = g.spawnProj(h, { kind: 'trapThrow', pos: e, vel: { x: f.x * 11, y: f.y * 11 + 3, z: f.z * 11 }, grav: 16, r: 0.2, life: 4, noHero: true, ability: 'trap' });
        h.k.trapProj = p.id;
        act(g, h, 'throw', 'trap');
      }
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        g.useUlt(h, 'tire');
        const x = h.pos.x + Math.sin(h.yaw) * 1.2, z = h.pos.z + Math.cos(h.yaw) * 1.2;
        const ok = g.world.clear(h.pos.x, h.pos.y + 0.5, h.pos.z, x, h.pos.y + 0.5, z);
        const tire = g.addDeploy(h, { kind: 'tire', pos: { x: ok ? x : h.pos.x, y: h.pos.y + 0.1, z: ok ? z : h.pos.z }, hp: d.tire.hp, maxHp: d.tire.hp, shootable: true, rad: 0.55, cy: 0.5, life: d.tire.dur + 0.5, yaw: h.yaw });
        tire.vel = { x: 0, y: 0, z: 0 };
        tire.e = { pos: tire.pos, vel: tire.vel, r: 0.45, h: 1.0, team: h.team, onGround: true };
        h.k.tire = tire.id;
        act(g, h, 'tire');
      }
    },
    mineBoom(g, h, m) {
      const d = h.def.mine;
      const pos = m.pos;
      g.explode(h, pos, d.dmg, d.r, { self: 0, minF: 0.35, ability: 'mine', knock: d.knock, lift: 0.75, fx: 'mine' });
      const dx = h.pos.x - pos.x, dy = h.pos.y + 1 - pos.y, dz = h.pos.z - pos.z, dd = Math.hypot(dx, dy, dz);
      if (dd < d.r + 0.5) {
        const l = Math.hypot(dx, dz) || 1;
        h.vel.x += dx / l * d.knock * 0.9; h.vel.z += dz / l * d.knock * 0.9; h.vel.y = Math.max(h.vel.y, 9.5);
        h.onGround = false; h.st.kb = 0.5;
      }
      m.dead = true;
    },
    proj(g, p, type, ev) {
      if (p.kind === 'frag') {
        if (type === 'hero') {
          const src = g.heroes[p.owner];
          g.explode(src, p.pos, p.dmg, p.splash.r, Object.assign({}, p.splash, { direct: ev.h }));
          p.dead = true;
          return true;
        }
        if (type === 'dep' || type === 'barrier') {
          const src = g.heroes[p.owner];
          if (type === 'barrier') g.damageBarrier(ev.b, p.dmg, src); else g.damageDeploy(ev.d, p.dmg, src);
          g.explode(src, p.pos, p.dmg * 0.5, p.splash.r, p.splash);
          p.dead = true;
          return true;
        }
        return false;
      }
      if (p.kind === 'mine') {
        if (type === 'world' || type === 'dep' || type === 'hero' || type === 'barrier') {
          p.vel.x = p.vel.y = p.vel.z = 0; p.grav = 0; p.life = 60; p.stuckTo = -2;
          if (type === 'hero') { p.stuckTo = ev.h.id; p.off = { x: p.pos.x - ev.h.pos.x, y: p.pos.y - ev.h.pos.y, z: p.pos.z - ev.h.pos.z }; }
          g.sound('mineStick', p.pos);
          return true;
        }
        if (type === 'stuck') {
          if (p.stuckTo >= 0) { const t = g.heroes[p.stuckTo]; if (t && t.alive) { p.pos.x = t.pos.x + p.off.x; p.pos.y = t.pos.y + p.off.y; p.pos.z = t.pos.z + p.off.z; } else p.stuckTo = -2; }
          const own = g.heroes[p.owner];
          if (!own || !own.alive) { p.dead = true; if (own) own.k.mine = null; }
          return true;
        }
        return true;
      }
      if (p.kind === 'trapThrow') {
        if (type === 'world' || type === 'barrier' || type === 'dep') {
          const src = g.heroes[p.owner];
          const gy = g.world.groundAt(p.pos.x, p.pos.z, p.pos.y + 0.5);
          const t = g.addDeploy(src, { kind: 'trap', pos: { x: p.pos.x, y: gy > -Infinity ? gy : p.pos.y, z: p.pos.z }, hp: 100, maxHp: 100, shootable: true, rad: 0.45, cy: 0.15 });
          src.k.trap = t.id;
          p.dead = true;
          g.sound('trapSet', p.pos);
          return true;
        }
        return true;
      }
      if (p.kind === 'mayhem') return false;
      return false;
    },
    deploy(g, d, dt) {
      const def = O.HEROES.junkrat;
      if (d.kind === 'trap') {
        if (d.sprung) { d.sprungT -= dt; if (d.sprungT <= 0) d.dead = true; return; }
        for (const t of g.heroes) {
          if (t.team === d.team || !g.targetable(t)) continue;
          if (Math.hypot(t.pos.x - d.pos.x, t.pos.z - d.pos.z) > def.trap.r + t.r * 0.5 || Math.abs(t.pos.y - d.pos.y) > 1) continue;
          const src = g.heroes[d.owner];
          g.damage(src, t, def.trap.dmg, { kind: 'trap', ability: 'trap', from: d.pos });
          t.st.root = def.trap.root;
          t.pos.x = d.pos.x; t.pos.z = d.pos.z;
          d.sprung = true; d.sprungT = def.trap.root; d.victim = t.id; d.shootable = false;
          g.ev('trapped', { src: d.owner, dst: t.id });
          g.sound('trapSnap', d.pos, { h: t.id });
          break;
        }
        return;
      }
      if (d.kind === 'tire') this.tireTick(g, d, dt);
    },
    tireTick(g, d, dt) {
      const own = g.heroes[d.owner];
      const def = O.HEROES.junkrat.tire;
      if (!own || !own.alive) { d.dead = true; return; }
      const inp = own.inp;
      d.yaw = own.yaw;
      const sp = def.speed;
      const e = d.e;
      e.vel.x = Math.sin(d.yaw) * sp; e.vel.z = Math.cos(d.yaw) * sp;
      if (d.climb) e.vel.y = 7;
      else { e.vel.y -= O.GRAVITY * dt; if (inp.jump && e.onGround) { e.vel.y = 7; e.onGround = false; } }
      g.world.moveChar(e, dt);
      d.climb = !!(e.wall && e.blocked > 0.3 && e.wall.top < e.pos.y + 12);
      if (d.pos.y < g.map.killY) { d.dead = true; own.ultOn = null; own.k.tire = null; return; }
      d.spin = (d.spin || 0) + sp * dt * 2;
      if (d.boom || d.age >= def.dur) {
        g.explode(own, { x: d.pos.x, y: d.pos.y + 0.5, z: d.pos.z }, def.dmg, def.r, { self: 0, minF: 0.2, ability: 'tire', fx: 'huge', snd: 'tireBoom', knock: 4 });
        d.dead = true;
        own.ultOn = null; own.k.tire = null;
      }
    },
    deployDied(g, d) {
      if (d.kind === 'tire') { const own = g.heroes[d.owner]; if (own) { own.ultOn = null; own.k.tire = null; } }
    },
    onDeath(g, h) {
      const d = h.def.mayhem;
      for (let i = 0; i < d.count; i++) {
        const a = g.rand() * Math.PI * 2, s = 2 + g.rand() * 3;
        g.spawnProj(h, { kind: 'mayhem', pos: { x: h.pos.x, y: h.pos.y + 1, z: h.pos.z }, vel: { x: Math.cos(a) * s, y: 3 + g.rand() * 2, z: Math.sin(a) * s }, grav: 14, r: 0.15, life: 1 + g.rand() * 0.4, bounce: 99, rest: 0.4, explodeOnEnd: true, dmg: d.dmg, noHero: true, ability: 'mayhem', splash: { dmg: d.dmg, r: d.r, self: 0, minF: 0.3, ability: 'mayhem', fx: 'small' } });
      }
      const tire = g.deploy.find(x => x.id === h.k.tire);
      if (tire) tire.dead = true;
      h.k.tire = null;
    },
    cleanup(g, h) {
      for (const d of g.deploy) if (d.owner === h.id) d.dead = true;
      for (const p of g.proj) if (p.owner === h.id && (p.kind === 'mine')) p.dead = true;
    }
  };

  K.torbjorn = {
    init(g, h) {
      h.maxAmmo = h.def.w.ammo; h.ammo = h.maxAmmo; h.weapon = 0;
      h.k.scrap = h.k.scrap === undefined ? 50 : h.k.scrap;
      const t = g.deploy.find(d => d.kind === 'turret' && d.owner === h.id);
      h.k.turret = t ? t.id : null;
    },
    tick(g, h, inp, dt) {
      const d = h.def;
      const mol = h.ultOn === 'molten';
      h.k.scrap = Math.min(d.scrap.max, h.k.scrap + d.scrap.passive * dt);
      if (mol) {
        h.ultT += dt;
        if (h.ultT >= d.molten.dur) { h.ultOn = null; h.packArmor = Math.min(h.packArmor, h.k.prePack || 0); const t = g.deploy.find(x => x.id === h.k.turret); if (t && t.level === 3) { t.level = 2; t.maxHp = d.turret.levels[1].hp; t.hp = Math.min(t.hp, t.maxHp); } }
      }
      if (inp.slot === 1) h.weapon = 0;
      if (inp.slot === 2) h.weapon = 1;
      h.vis.weapon = h.weapon;
      for (const p of g.deploy) {
        if (p.kind !== 'scrap' || p.dead) continue;
        if (Math.hypot(p.pos.x - h.pos.x, p.pos.z - h.pos.z) < 1.4 && Math.abs(p.pos.y - h.pos.y) < 1.5) { h.k.scrap = Math.min(d.scrap.max, h.k.scrap + p.amount); p.dead = true; g.sound('scrap', h.pos, { h: h.id }); }
      }
      if (common(g, h, inp, dt, h.weapon === 0 ? d.w.reload / (mol ? 1.6 : 1) : 0)) return;
      const rl = h.weapon === 0 ? reloading(g, h, dt) : false;
      const rm = mol ? d.molten.rateMul : 1;
      if (h.weapon === 0) {
        if (!rl && inp.fire && h.fireCd <= 0 && h.ammo > 0) {
          g.fireProj(h, d.w.speed, { kind: 'rivet', dmg: d.w.dmg, grav: d.w.grav, r: 0.1, life: 2, crit: d.w.crit, ability: 'rivet' });
          h.ammo--; h.fireCd = d.w.interval / rm; h.vis.shotT = g.t;
          g.sound('rivet', h.pos, { h: h.id });
        } else if (!rl && inp.fire2 && h.fireCd <= 0 && h.ammo >= d.alt.ammo) {
          for (let i = 0; i < d.alt.pellets; i++) g.hitscan(h, g.spreadDir(g.aim(h), d.alt.spread), 30, d.alt.dmg, { fall: d.alt.fall, ability: 'rivet', tracer: 'pellet', noFx: i > 4 });
          h.ammo -= d.alt.ammo; h.fireCd = d.alt.interval / rm; h.vis.shot2T = g.t;
          g.sound('rivetAlt', h.pos, { h: h.id });
        }
      } else if (inp.fire && h.fireCd <= 0) {
        h.fireCd = d.hammer.interval / rm;
        act(g, h, 'hammer');
        const tur = g.deploy.find(x => x.id === h.k.turret);
        let used = false;
        if (tur && !tur.dead) {
          const e = g.eye(h), f = g.aim(h);
          const tx = tur.pos.x - e.x, ty = tur.pos.y + 0.6 - e.y, tz = tur.pos.z - e.z, dd = Math.hypot(tx, ty, tz);
          if (dd < d.hammer.range + 0.8 && (tx * f.x + ty * f.y + tz * f.z) / dd > 0.6) {
            used = true;
            if (tur.hp < tur.maxHp) tur.hp = Math.min(tur.maxHp, tur.hp + d.hammer.repair);
            if (tur.level === 1) { tur.up = (tur.up || 0) + 1; if (tur.up >= d.hammer.hits) { tur.level = 2; tur.maxHp = d.turret.levels[1].hp; tur.hp = Math.min(tur.maxHp, tur.hp + 150); g.sound('turretUp', tur.pos); } }
            g.sound('hammerHit', tur.pos);
          }
        }
        if (!used) {
          const hit = g.melee(h, d.hammer.dmg, d.hammer.range, 0.7, { ability: 'hammer' });
          g.sound(hit.length ? 'hammerHit' : 'swing', h.pos, { h: h.id });
        }
        h.vis.shotT = g.t;
      }
      if (g.pressed(h, inp, 'shift') && !(h.cd.shift > 0) && !h.k.turret) {
        const ap = g.aimPoint(h, 6);
        let x = ap.x, z = ap.z;
        const fx = Math.sin(h.yaw), fz = Math.cos(h.yaw);
        if (ap.t > 5.5 || ap.t < 1) { x = h.pos.x + fx * 2; z = h.pos.z + fz * 2; }
        else { x -= fx * 0.6; z -= fz * 0.6; }
        let gy = g.world.groundAt(x, z, h.pos.y + 2.5);
        if (gy === -Infinity || Math.abs(gy - h.pos.y) > 3 || !g.world.clear(h.pos.x, h.pos.y + 0.8, h.pos.z, x, gy + 0.8, z)) { x = h.pos.x + fx * 1.4; z = h.pos.z + fz * 1.4; gy = h.pos.y; }
        const lvl = mol ? 3 : 1;
        const tur = g.addDeploy(h, { kind: 'turret', pos: { x, y: gy, z }, hp: 30, maxHp: d.turret.levels[lvl - 1].hp, level: lvl, build: d.turret.build, shootable: true, rad: 0.6, cy: 0.6, yaw: h.yaw, pitch: 0, fireT: 0, rocketT: 0 });
        h.k.turret = tur.id;
        act(g, h, 'throw', 'turret');
        g.sound('turretBuild', tur.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'e') && h.k.scrap >= d.pack.cost) {
        h.k.scrap -= d.pack.cost;
        const x = h.pos.x + Math.sin(h.yaw) * 1.5, z = h.pos.z + Math.cos(h.yaw) * 1.5;
        const ok = g.world.clear(h.pos.x, h.pos.y + 0.5, h.pos.z, x, h.pos.y + 0.5, z);
        const gy = g.world.groundAt(ok ? x : h.pos.x, ok ? z : h.pos.z, h.pos.y + 1);
        g.addDeploy(h, { kind: 'pack', pos: { x: ok ? x : h.pos.x, y: gy > -Infinity ? gy : h.pos.y, z: ok ? z : h.pos.z }, life: 30, shootable: false });
        act(g, h, 'throw', 'pack');
        g.sound('throw', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        g.useUlt(h, 'molten');
        h.k.prePack = h.packArmor;
        h.packArmor += d.molten.armor;
        h.ammo = h.maxAmmo; h.reloadT = 0;
        const t = g.deploy.find(x => x.id === h.k.turret);
        if (t) { t.level = 3; t.maxHp = d.turret.levels[2].hp; t.hp = t.maxHp; }
      }
    },
    deploy(g, d, dt) {
      const def = O.HEROES.torbjorn;
      if (d.kind === 'scrap') return;
      if (d.kind === 'pack') {
        for (const t of g.heroes) {
          if (!t.alive || t.team !== d.team || t.packArmor >= def.pack.armor) continue;
          if (Math.hypot(t.pos.x - d.pos.x, t.pos.z - d.pos.z) > 1.3 || Math.abs(t.pos.y - d.pos.y) > 1.6) continue;
          const src = g.heroes[d.owner];
          const got = def.pack.armor - t.packArmor;
          t.packArmor = def.pack.armor;
          if (src) { src.stats.heal += got; g.addUlt(src, got * 0.5); }
          d.dead = true;
          g.sound('armorUp', t.pos, { h: t.id });
          g.ev('armorpack', { src: d.owner, dst: t.id });
          break;
        }
        return;
      }
      if (d.kind !== 'turret') return;
      const own = g.heroes[d.owner];
      if (!own || own.heroId !== 'torbjorn') { d.dead = true; return; }
      if (d.age < d.build) { d.hp = Math.min(d.maxHp, d.hp + (d.maxHp - 30) * dt / d.build); return; }
      const lv = def.turret.levels[d.level - 1];
      const hx = d.pos.x, hy = d.pos.y + 0.95, hz = d.pos.z;
      if (!d.tgt || (g.tickN + d.id) % 6 === 0) {
        let best = null, bd = def.turret.range;
        for (const t of g.heroes) {
          if (t.team === d.team || !g.targetable(t)) continue;
          const c = g.chest(t);
          const dist = Math.hypot(c.x - hx, c.y - hy, c.z - hz);
          if (dist > bd) continue;
          if (!g.world.clear(hx, hy, hz, c.x, c.y, c.z)) continue;
          best = t; bd = dist;
        }
        d.tgt = best ? best.id : null;
      }
      const t = d.tgt !== null ? g.heroes[d.tgt] : null;
      if (!t || !g.targetable(t)) { d.tgt = null; d.firing = false; return; }
      const c = g.chest(t);
      const want = Math.atan2(c.x - hx, c.z - hz);
      const dy = O.angDiff(d.yaw, want);
      d.yaw += Math.max(-4 * dt, Math.min(4 * dt, dy));
      d.pitch = Math.atan2(c.y - hy, Math.hypot(c.x - hx, c.z - hz));
      d.firing = Math.abs(dy) < 0.15;
      if (!d.firing) return;
      d.fireT -= dt;
      if (d.fireT <= 0) {
        d.fireT += 1 / lv.rate;
        if (d.fireT < 0) d.fireT = 0;
        const dir = O.dir(d.yaw, d.pitch);
        const sp = g.spreadDir(dir, 0.02);
        const r = g.trace({ team: d.team }, hx, hy, hz, sp.x, sp.y, sp.z, def.turret.range + 2);
        if (r.hero) g.damage(own, r.hero, lv.dmg, { kind: 'bullet', ability: 'turret', from: { x: hx, y: hy, z: hz } });
        else if (r.barrier) g.damageBarrier(r.barrier, lv.dmg, own);
        else if (r.dep) g.damageDeploy(r.dep, lv.dmg, own);
        g.addFx('tracer', { x0: hx + Math.sin(d.yaw) * 0.6, y0: hy, z0: hz + Math.cos(d.yaw) * 0.6, x1: r.x, y1: r.y, z1: r.z, team: d.team, hero: 'turret', owner: d.owner, hit: !!r.hero });
        d.shotT = g.t;
        if ((g.tickN & 1) === 0) g.sound('turretShot', d.pos);
      }
      if (d.level === 3) {
        d.rocketT -= dt;
        if (d.rocketT <= 0) {
          d.rocketT = 3;
          for (let i = 0; i < 4; i++) {
            const dir = g.spreadDir(O.dir(d.yaw, d.pitch + 0.05), 0.05);
            g.spawnProj(own, { kind: 'turretRocket', pos: { x: hx, y: hy + 0.3, z: hz }, vel: { x: dir.x * 30, y: dir.y * 30, z: dir.z * 30 }, r: 0.15, life: 2, dmg: 20, ability: 'turret', splash: { dmg: 20, r: 2, self: 0, minF: 0.3, ability: 'turret', fx: 'small' } });
          }
        }
      }
    },
    deployDied(g, d) {
      if (d.kind === 'turret') {
        const own = g.heroes[d.owner];
        if (own && own.k.turret === d.id) { own.k.turret = null; own.cd.shift = O.HEROES.torbjorn.turret.cd; }
        g.ev('turretDown', { owner: d.owner });
      }
    },
    scrapDrop(g, victim) {
      if (!g.heroes.some(h => h.heroId === 'torbjorn')) return;
      g.addDeploy(victim, { kind: 'scrap', team: -1, pos: { x: victim.pos.x, y: victim.pos.y, z: victim.pos.z }, life: 20, amount: O.HEROES.torbjorn.scrap.kill, shootable: false });
    },
    cleanup(g, h) { for (const d of g.deploy) if (d.owner === h.id && (d.kind === 'turret' || d.kind === 'pack')) d.dead = true; }
  };

  K.widowmaker = {
    init(g, h) { h.maxAmmo = h.def.ammo; h.ammo = h.maxAmmo; h.k.scopeT = 0; h.k.hook = null; },
    speed(g, h) { return h.k.scoped ? h.def.scope.speedMul : 1; },
    tick(g, h, inp, dt) {
      const d = h.def;
      if (h.ultOn === 'infra') { h.ultT += dt; if (h.ultT >= d.infra.dur) { h.ultOn = null; } }
      if (h.k.hook) { h.k.scoped = false; h.vis.scope = -1; return; }
      h.k.scoped = !!inp.fire2 && h.reloadT <= 0;
      if (h.k.scoped) { h.k.scopeT += dt; } else h.k.scopeT = 0;
      const charge = h.k.scoped ? Math.max(0, Math.min(1, (h.k.scopeT - 0.3) / d.scope.charge)) : 0;
      h.vis.scope = h.k.scoped ? charge : -1;
      h.k.charge = charge;
      if (common(g, h, inp, dt, d.reload)) { h.k.scopeT = 0; return; }
      const rl = reloading(g, h, dt);
      if (!rl && h.fireCd <= 0 && h.ammo > 0) {
        if (h.k.scoped && g.pressed(h, inp, 'fire') && h.k.scopeT > 0.2) {
          const dmg = d.scope.min + (d.scope.max - d.scope.min) * charge;
          g.hitscan(h, g.aim(h), 200, dmg, { crit: d.scope.crit, ability: 'sniper', tracer: 'sniper', charge });
          h.ammo = Math.max(0, h.ammo - d.scope.cost);
          h.fireCd = d.scope.interval;
          h.k.scopeT = 0.3;
          h.vis.shotT = g.t; h.vis.big = true;
          g.sound('sniper', h.pos, { h: h.id });
        } else if (!h.k.scoped && inp.fire) {
          g.hitscan(h, g.spreadDir(g.aim(h), d.auto.spread), 80, d.auto.dmg, { fall: d.auto.fall, crit: d.auto.crit, ability: 'sniper', tracer: 'pulse' });
          h.ammo--; h.fireCd += 1 / d.auto.rate; if (h.fireCd < 0) h.fireCd = 0;
          h.vis.shotT = g.t; h.vis.big = false;
          if ((g.tickN & 1) === 0) g.sound('widowAuto', h.pos, { h: h.id });
        }
      }
      if (g.pressed(h, inp, 'shift') && !(h.cd.shift > 0)) {
        const e = g.eye(h), f = g.aim(h);
        const r = g.world.raycast(e.x, e.y, e.z, f.x, f.y, f.z, d.hook.range);
        if (r) {
          h.cd.shift = d.hook.cd;
          h.k.hook = { x: e.x + f.x * r.t, y: e.y + f.y * r.t, z: e.z + f.z * r.t, t: 0, top: r.ny > 0.5 };
          act(g, h, 'hook');
          g.sound('grapple', h.pos, { h: h.id });
        } else h.cd.shift = 1;
      }
      if (g.pressed(h, inp, 'e') && !(h.cd.e > 0)) {
        h.cd.e = d.venom.cd;
        for (const x of g.deploy) if (x.kind === 'venom' && x.owner === h.id) x.dead = true;
        const e = g.eye(h), f = g.aim(h);
        g.spawnProj(h, { kind: 'venomThrow', pos: e, vel: { x: f.x * 20, y: f.y * 20 + 2, z: f.z * 20 }, grav: 10, r: 0.15, life: 3, noHero: true, ability: 'venom' });
        act(g, h, 'throw', 'venom');
      }
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        g.useUlt(h, 'infra');
        g.infra = g.infra || [0, 0];
        g.infra[h.team] = g.t + d.infra.dur;
      }
    },
    move(g, h, inp, dt) {
      const hk = h.k.hook;
      if (!hk) return false;
      hk.t += dt;
      const dx = hk.x - h.pos.x, dy = hk.y - (h.pos.y + 1) , dz = hk.z - h.pos.z, d = Math.hypot(dx, dy, dz);
      const sp = h.def.hook.speed;
      if (d < 1.3 || hk.t > 1.4 || h.st.stun > 0) {
        h.k.hook = null;
        h.vel.x *= 0.5; h.vel.z *= 0.5; h.vel.y = hk.top ? 6.5 : 4;
        return false;
      }
      h.vel.x = dx / d * sp; h.vel.y = dy / d * sp + 1.5; h.vel.z = dz / d * sp;
      h.dyn = g.dyn;
      g.world.moveChar(h, dt);
      if (h.blocked > 0.95 && hk.t > 0.25) { h.k.hook = null; h.vel.y = 6.5; }
      return true;
    },
    proj(g, p, type) {
      if (p.kind !== 'venomThrow') return false;
      if (type === 'world' || type === 'barrier' || type === 'dep') {
        const src = g.heroes[p.owner];
        g.addDeploy(src, { kind: 'venom', pos: { x: p.pos.x, y: p.pos.y, z: p.pos.z }, hp: 1, maxHp: 1, shootable: true, rad: 0.3, cy: 0, arm: 0.6 });
        p.dead = true;
        g.sound('mineStick', p.pos);
        return true;
      }
      return true;
    },
    deploy(g, d, dt) {
      if (d.kind !== 'venom') return;
      if (d.age < d.arm) return;
      const def = O.HEROES.widowmaker.venom;
      const src = g.heroes[d.owner];
      let trig = false;
      for (const t of g.heroes) {
        if (t.team === d.team || !g.targetable(t)) continue;
        const c = g.chest(t);
        if (Math.hypot(c.x - d.pos.x, c.y - d.pos.y, c.z - d.pos.z) < 2.4 && g.world.clear(d.pos.x, d.pos.y + 0.1, d.pos.z, c.x, c.y, c.z)) { trig = true; break; }
      }
      if (!trig) return;
      for (const t of g.heroes) {
        if (t.team === d.team || !g.targetable(t)) continue;
        const c = g.chest(t);
        if (Math.hypot(c.x - d.pos.x, c.y - d.pos.y, c.z - d.pos.z) > def.r + t.r) continue;
        t.st.poison = def.dur; t.aux.poisonSrc = d.owner; t.aux.poisonDps = def.dmg / def.dur;
        t.st.revealed = def.dur;
        if (src) g.ev('poisoned', { src: src.id, dst: t.id });
      }
      g.addFx('venom', { x: d.pos.x, y: d.pos.y, z: d.pos.z, r: def.r });
      g.sound('venom', d.pos, { h: d.owner });
      d.dead = true;
    }
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
