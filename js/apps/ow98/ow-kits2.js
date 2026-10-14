(function (O) {
  'use strict';
  const K = O.KITS;
  const { act, reloading, startReload, common, aimAt } = O.KitUtil;

  K.reinhardt = {
    init(g, h) {
      h.k.bar = { hp: h.def.barrier.hp };
      h.k.bOn = false; h.k.bOff = 0;
      h.maxAmmo = 0; h.ammo = 0;
    },
    speed(g, h) { return h.k.bOn ? h.def.barrier.speedMul : 1; },
    barrier(g, h) {
      if (!h.k.bOn || h.k.bar.hp <= 0) return;
      const fx = Math.sin(h.yaw), fz = Math.cos(h.yaw);
      g.barriers.push({ kind: 'rect', team: h.team, x: h.pos.x + fx * 1.25, z: h.pos.z + fz * 1.25, nx: fx, nz: fz, y0: h.pos.y - 0.3, y1: h.pos.y + 3.0, w: h.def.barrier.w, hp: h.k.bar.hp, ref: h.k.bar, owner: true, ownerIdx: h.id });
    },
    interrupt(g, h) {
      if (h.k.charging > 0) this.endCharge(g, h, false);
      h.k.shatterT = 0;
    },
    tick(g, h, inp, dt) {
      const d = h.def;
      const bar = h.k.bar;
      if (h.k.charging > 0) { h.k.bOn = false; return; }
      if (h.k.shatterT > 0) {
        h.k.shatterT -= dt;
        h.k.bOn = false;
        if (h.k.shatterT <= 0) this.shatter(g, h);
        return;
      }
      if (h.k.swingHit > 0) {
        h.k.swingHit -= dt;
        if (h.k.swingHit <= 0) {
          const hits = g.melee(h, d.hammer.dmg, d.hammer.range, d.hammer.arc, { cleave: true, ability: 'rhammer', knock: 1.5, lift: 1 });
          g.sound(hits.length ? 'hammerHit' : 'swingBig', h.pos, { h: h.id });
        }
      }
      if (h.k.strikeT > 0) {
        h.k.strikeT -= dt;
        if (h.k.strikeT <= 0) {
          const e = g.eye(h), f = g.aim(h);
          g.spawnProj(h, { kind: 'strike', pos: { x: e.x, y: e.y - 0.2, z: e.z }, vel: { x: f.x * d.strike.speed, y: f.y * d.strike.speed, z: f.z * d.strike.speed }, r: 0.7, life: d.strike.range / d.strike.speed, dmg: d.strike.dmg, pierce: true, pierceBarrier: true, ability: 'strike' });
          g.sound('fireStrike', h.pos, { h: h.id });
        }
      }
      const wantShield = !!inp.fire2 && !(h.cd.barrier > 0) && bar.hp > 0 && !(h.k.strikeT > 0);
      if (wantShield && !h.k.bOn) g.sound('barrierUp', h.pos, { h: h.id });
      h.k.bOn = wantShield;
      h.vis.shield = h.k.bOn;
      if (h.k.bOn) h.k.bOff = 0; else h.k.bOff += dt;
      if (h.k.bOn && bar.hp <= 0) { h.k.bOn = false; h.cd.barrier = d.barrier.breakCd; }
      if (!h.k.bOn && h.k.bOff > d.barrier.delay) bar.hp = Math.min(d.barrier.hp, bar.hp + d.barrier.regen * dt);
      if (bar.hp <= 0 && !(h.cd.barrier > 0) && h.k.wasUp) h.cd.barrier = d.barrier.breakCd;
      h.k.wasUp = h.k.bOn;
      if (!h.k.bOn && inp.fire && h.fireCd <= 0) {
        h.fireCd = d.hammer.interval;
        h.k.swingHit = d.hammer.delay;
        h.k.swingSide = -(h.k.swingSide || 1);
        act(g, h, 'swing');
        h.vis.side = h.k.swingSide;
        h.vis.shotT = g.t;
      }
      if (g.pressed(h, inp, 'shift') && !(h.cd.shift > 0)) {
        h.k.charging = d.charge.dur;
        h.k.cyaw = h.yaw;
        h.k.pin = null;
        h.k.bumped = new Set();
        h.k.bOn = false;
        h.st.unstoppable = d.charge.dur;
        act(g, h, 'charge');
        g.sound('charge', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'e') && !(h.cd.e > 0) && !h.k.bOn) {
        h.cd.e = d.strike.cd;
        h.k.strikeT = 0.35;
        act(g, h, 'strike');
      }
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        g.useUlt(h, 'shatter');
        h.ultOn = null;
        h.k.shatterT = 0.55;
        h.k.bOn = false;
        act(g, h, 'shatter');
      }
    },
    shatter(g, h) {
      const d = h.def.shatter;
      const fx = Math.sin(h.yaw), fz = Math.cos(h.yaw);
      const base = { x: h.pos.x, y: h.pos.y + 0.6, z: h.pos.z };
      for (const t of g.heroes) {
        if (t.team === h.team || !g.targetable(t)) continue;
        const dx = t.pos.x - h.pos.x, dz = t.pos.z - h.pos.z, dist = Math.hypot(dx, dz);
        if (dist > d.range || dist < 0.1) continue;
        if ((dx * fx + dz * fz) / dist < Math.cos(d.arc) && dist > 2.5) continue;
        if (t.pos.y - h.pos.y > 3 || h.pos.y - t.pos.y > 4) continue;
        const tp = { x: t.pos.x, y: t.pos.y + 0.6, z: t.pos.z };
        if (!g.world.clear(base.x, base.y, base.z, tp.x, tp.y, tp.z)) continue;
        if (g.blockedByBarrier(h.team, base, tp)) continue;
        if (t.st.invuln > 0) continue;
        g.damage(h, t, d.dmg, { kind: 'splash', ability: 'shatter', from: h.pos });
        if (!t.alive) continue;
        t.st.knock = d.down;
        const kit = O.KITS[t.heroId];
        if (kit && kit.interrupt) kit.interrupt(g, t);
        g.ev('stunned', { h: t.id, dur: d.down });
      }
      g.addFx('shatter', { x: h.pos.x, y: h.pos.y, z: h.pos.z, yaw: h.yaw, range: d.range, arc: d.arc, team: h.team });
      g.sound('shatter', h.pos, { h: h.id });
    },
    move(g, h, inp, dt) {
      if (!(h.k.charging > 0)) return false;
      const d = h.def.charge;
      h.k.charging -= dt;
      const diff = O.angDiff(h.k.cyaw, inp.yaw);
      h.k.cyaw += Math.max(-d.turn * dt, Math.min(d.turn * dt, diff));
      const fx = Math.sin(h.k.cyaw), fz = Math.cos(h.k.cyaw);
      h.vel.x = fx * d.speed; h.vel.z = fz * d.speed;
      h.vel.y -= O.GRAVITY * dt;
      h.dyn = g.dyn;
      g.world.moveChar(h, dt);
      for (const t of g.heroes) {
        if (t.team === h.team || !g.targetable(t) || t === h) continue;
        const dx = t.pos.x - h.pos.x, dz = t.pos.z - h.pos.z, dist = Math.hypot(dx, dz);
        if (dist > h.r + t.r + 0.5 || Math.abs(t.pos.y - h.pos.y) > 2) continue;
        if ((dx * fx + dz * fz) < -0.2) continue;
        if (h.k.pin === null) {
          h.k.pin = t.id;
          g.ev('pinned', { src: h.id, dst: t.id });
          g.sound('pin', t.pos, { h: t.id });
        } else if (h.k.pin !== t.id && !h.k.bumped.has(t.id)) {
          h.k.bumped.add(t.id);
          g.damage(h, t, d.bump, { kind: 'melee', ability: 'charge', from: h.pos });
          const sx = -fz * Math.sign(dx * -fz + dz * fx || 1), sz = fx * Math.sign(dx * -fz + dz * fx || 1);
          g.knock(t, sx * 9, 4, sz * 9);
        }
      }
      if (h.k.pin !== null) {
        const t = g.heroes[h.k.pin];
        if (t && t.alive) {
          t.pos.x = h.pos.x + fx * (h.r + t.r + 0.2);
          t.pos.z = h.pos.z + fz * (h.r + t.r + 0.2);
          t.pos.y = h.pos.y + 0.3;
          t.vel.x = t.vel.y = t.vel.z = 0;
          t.st.hooked = 0.1;
        } else h.k.pin = null;
      }
      const hitWall = h.wall && h.blocked > 0.55;
      if (hitWall || h.k.charging <= 0 || h.st.stun > 0) this.endCharge(g, h, hitWall);
      return true;
    },
    endCharge(g, h, wall) {
      const d = h.def.charge;
      h.k.charging = 0;
      h.st.unstoppable = 0;
      h.cd.shift = d.cd;
      h.vel.x *= 0.1; h.vel.z *= 0.1;
      if (h.k.pin !== null) {
        const t = g.heroes[h.k.pin];
        if (t && t.alive) {
          g.damage(h, t, wall ? d.pinDmg : d.dropDmg, { kind: 'melee', ability: 'charge', from: h.pos });
          if (t.alive) t.st.stun = Math.max(t.st.stun || 0, 0.4);
        }
        h.k.pin = null;
      }
      if (wall) {
        g.addFx('slam', { x: h.pos.x + Math.sin(h.k.cyaw) * 1, y: h.pos.y + 1.2, z: h.pos.z + Math.cos(h.k.cyaw) * 1 });
        g.sound('chargeWall', h.pos, { h: h.id });
      }
      h.st.stun = Math.max(h.st.stun || 0, 0.3);
    }
  };

  K.roadhog = {
    init(g, h) { h.maxAmmo = h.def.w.ammo; h.ammo = h.maxAmmo; h.k.pull = null; },
    speed(g, h) { return h.k.breath > 0 ? h.def.breather.speedMul : 1; },
    interrupt(g, h) { h.k.breath = 0; if (h.ultOn === 'hog') h.ultOn = null; },
    tick(g, h, inp, dt) {
      const d = h.def;
      if (h.k.pull) this.pullTick(g, h, dt);
      if (h.k.breath > 0) {
        h.k.breath -= dt;
        g.heal(h, h, d.breather.heal / d.breather.dur * dt, { noUlt: true });
        h.vis.breath = true;
        return;
      }
      h.vis.breath = false;
      if (h.ultOn === 'hog') {
        h.ultT += dt;
        if (h.ultT >= d.hog.dur) { h.ultOn = null; return; }
        if (inp.fire) {
          h.k.hogT = (h.k.hogT || 0) - dt;
          if (h.k.hogT <= 0) {
            h.k.hogT = 1 / d.hog.rate;
            const f = g.aim(h);
            const knocked = new Set();
            for (let i = 0; i < d.hog.pellets; i++) {
              const r = g.hitscan(h, g.spreadDir(f, d.hog.spread), 25, d.hog.dmg, { fall: [8, 20, 0.3], ability: 'wholehog', tracer: 'pellet', noFx: i > 3 });
              if (r.hero && !knocked.has(r.hero.id)) {
                knocked.add(r.hero.id);
                const dx = r.hero.pos.x - h.pos.x, dz = r.hero.pos.z - h.pos.z, l = Math.hypot(dx, dz) || 1;
                g.knock(r.hero, dx / l * d.hog.knock, 1.2, dz / l * d.hog.knock);
              }
            }
            h.vis.shotT = g.t;
            g.sound('hogShot', h.pos, { h: h.id });
          }
        }
        return;
      }
      if (common(g, h, inp, dt, d.w.reload)) return;
      const rl = reloading(g, h, dt);
      if (!rl && h.fireCd <= 0 && h.ammo > 0 && (inp.fire || inp.fire2)) {
        if (inp.fire) {
          const f = g.aim(h);
          for (let i = 0; i < d.w.pellets; i++) g.hitscan(h, g.spreadDir(f, d.w.spread), 40, d.w.dmg, { fall: d.w.fall, ability: 'scrapgun', tracer: 'pellet', noFx: i > 5 });
          h.vis.shotT = g.t;
          g.sound('scrapgun', h.pos, { h: h.id });
        } else {
          g.fireProj(h, 60, { kind: 'shell', r: 0.12, life: d.alt.burst / 60, dmg: 10, explodeOnEnd: false, ability: 'scrapgun' });
          h.vis.shot2T = g.t;
          g.sound('scrapgun', h.pos, { h: h.id, alt: true });
        }
        h.ammo--; h.fireCd = d.w.interval;
      }
      if (g.pressed(h, inp, 'shift') && !(h.cd.shift > 0)) {
        h.cd.shift = d.hook.cd;
        const e = g.eye(h), f = g.aim(h);
        const p = g.spawnProj(h, { kind: 'hook', pos: { x: e.x, y: e.y - 0.3, z: e.z }, vel: { x: f.x * d.hook.speed, y: f.y * d.hook.speed, z: f.z * d.hook.speed }, r: 0.3, life: d.hook.range / d.hook.speed, ability: 'hook' });
        h.k.hookProj = p.id;
        act(g, h, 'hook');
        g.sound('hookThrow', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'e') && !(h.cd.e > 0)) {
        h.cd.e = d.breather.cd;
        h.k.breath = d.breather.dur;
        act(g, h, 'breather');
        g.sound('breather', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        g.useUlt(h, 'hog');
        h.k.hogT = 0.4;
        act(g, h, 'hog');
      }
    },
    pullTick(g, h, dt) {
      const pl = h.k.pull;
      const t = g.heroes[pl.id];
      pl.t += dt;
      if (!t || !t.alive || pl.t > 0.45) {
        if (t && t.alive) { t.st.stun = Math.max(t.st.stun || 0, 0.25); t.vel.x = t.vel.y = t.vel.z = 0; }
        h.k.pull = null;
        return;
      }
      const fx = Math.sin(h.yaw), fz = Math.cos(h.yaw);
      const tx = h.pos.x + fx * h.def.hook.pullTo, tz = h.pos.z + fz * h.def.hook.pullTo, ty = h.pos.y;
      const k = Math.min(1, pl.t / 0.35);
      t.pos.x = pl.x0 + (tx - pl.x0) * k;
      t.pos.z = pl.z0 + (tz - pl.z0) * k;
      t.pos.y = pl.y0 + (ty - pl.y0) * k + Math.sin(k * Math.PI) * 0.6;
      const r = g.world.pushOut(t, t.pos.x, t.pos.z);
      t.pos.x = r[0]; t.pos.z = r[1];
      t.vel.x = t.vel.y = t.vel.z = 0;
      t.st.hooked = 0.2;
    },
    proj(g, p, type, ev) {
      if (p.kind === 'hook') {
        const h = g.heroes[p.owner];
        if (type === 'hero') {
          const t = ev.h;
          g.damage(h, t, h.def.hook.dmg, { kind: 'proj', ability: 'hook', from: h.pos });
          if (t.alive && !(t.st.invuln > 0)) {
            const kit = O.KITS[t.heroId];
            if (kit && kit.interrupt) kit.interrupt(g, t);
            h.k.pull = { id: t.id, t: 0, x0: t.pos.x, y0: t.pos.y, z0: t.pos.z };
            t.st.hooked = 0.5;
            g.ev('hooked', { src: h.id, dst: t.id });
            g.sound('hookHit', t.pos, { h: t.id });
          }
          p.dead = true;
          return true;
        }
        if (type === 'world' || type === 'barrier' || type === 'dep') { p.dead = true; g.sound('hookMiss', p.pos); return true; }
        return true;
      }
      if (p.kind === 'shell') {
        if (type === 'hero' || type === 'world' || type === 'barrier' || type === 'dep') {
          if (type === 'hero') this.burst(g, p, ev.h);
          else this.burst(g, p);
          p.dead = true;
          return true;
        }
        return false;
      }
      return false;
    },
    burst(g, p) {
      const h = g.heroes[p.owner];
      if (!h) return;
      const d = h.def;
      const v = p.vel, l = Math.hypot(v.x, v.y, v.z) || 1;
      const dir = { x: v.x / l, y: v.y / l, z: v.z / l };
      const from = { x: p.pos.x - dir.x * 0.4, y: p.pos.y - dir.y * 0.4, z: p.pos.z - dir.z * 0.4 };
      for (let i = 0; i < d.w.pellets; i++) g.hitscan(h, g.spreadDir(dir, d.alt.spread), 30, d.w.dmg, { from, fall: [8, 18, 0.3], ability: 'scrapgun', tracer: 'pellet', noFx: i > 4, muzzle: from });
      g.addFx('impact', { x: p.pos.x, y: p.pos.y, z: p.pos.z, kind: 'shell', team: p.team });
    }
  };
  const origEnd = O.Game.prototype.projEnd;
  O.Game.prototype.projEnd = function (p, ev) {
    if (!p.dead && p.kind === 'shell' && !ev) { K.roadhog.burst(this, p); p.dead = true; return; }
    origEnd.call(this, p, ev);
  };

  K.winston = {
    init(g, h) { h.maxAmmo = h.def.tesla.ammo; h.ammo = h.maxAmmo; h.k.leap = false; },
    tick(g, h, inp, dt) {
      const d = h.def;
      h.vis.beams = [];
      if (h.ultOn === 'rage') {
        h.ultT += dt;
        if (h.ultT >= d.rage.dur) this.endRage(g, h);
        else {
          if (inp.fire && h.fireCd <= 0) {
            h.fireCd = d.rage.interval;
            const hits = g.melee(h, d.rage.dmg, d.rage.range, 1.1, { cleave: true, knock: d.rage.knock, lift: 4, ability: 'rage' });
            act(g, h, 'punch');
            h.vis.shotT = g.t;
            g.sound(hits.length ? 'punch' : 'swingBig', h.pos, { h: h.id });
          }
          if (g.pressed(h, inp, 'shift') && !(h.cd.shift > 0)) this.leap(g, h, d.rage.jumpCd);
          return;
        }
      }
      if (common(g, h, inp, dt, d.tesla.reload)) return;
      const rl = reloading(g, h, dt);
      if (!rl && inp.fire && h.ammo > 0) {
        h.ammo = Math.max(0, h.ammo - d.tesla.drain * dt);
        const e = g.eye(h), f = g.aim(h);
        const cands = [];
        for (const t of g.heroes) {
          if (t.team === h.team || !g.targetable(t)) continue;
          const c = g.chest(t);
          const dx = c.x - e.x, dy = c.y - e.y, dz = c.z - e.z, dd = Math.hypot(dx, dy, dz);
          if (dd - t.r > d.tesla.range) continue;
          if ((dx * f.x + dy * f.y + dz * f.z) / dd < Math.cos(d.tesla.cone) && dd > 1.6) continue;
          if (!g.world.clear(e.x, e.y, e.z, c.x, c.y, c.z)) continue;
          cands.push({ t, dd, c });
        }
        cands.sort((a, b) => a.dd - b.dd);
        let barHit = null;
        for (const b of g.barriers) {
          if (b.team === h.team || b.hp <= 0) continue;
          const bt = g.rayBarrier(b, e.x, e.y, e.z, f.x, f.y, f.z, d.tesla.range);
          if (bt !== null) { barHit = { b, t: bt }; break; }
        }
        const beams = [];
        for (const c of cands.slice(0, d.tesla.targets)) {
          if (g.blockedByBarrier(h.team, e, c.c)) continue;
          g.damage(h, c.t, d.tesla.dps * dt, { kind: 'beam', ability: 'tesla', from: e });
          beams.push({ to: c.t.id, kind: 'tesla' });
        }
        if (barHit) { g.damageBarrier(barHit.b, d.tesla.dps * dt * 1.5, h); beams.push({ x: e.x + f.x * barHit.t, y: e.y + f.y * barHit.t, z: e.z + f.z * barHit.t, kind: 'tesla' }); }
        for (const dep of g.deploy) {
          if (dep.team === h.team || !dep.shootable || dep.hp <= 0) continue;
          const dx = dep.pos.x - e.x, dz = dep.pos.z - e.z, dy = dep.pos.y + 0.4 - e.y, dd = Math.hypot(dx, dy, dz);
          if (dd > d.tesla.range || (dx * f.x + dy * f.y + dz * f.z) / dd < Math.cos(d.tesla.cone)) continue;
          g.damageDeploy(dep, d.tesla.dps * dt, h);
          beams.push({ x: dep.pos.x, y: dep.pos.y + 0.4, z: dep.pos.z, kind: 'tesla' });
        }
        if (!beams.length) beams.push({ x: e.x + f.x * d.tesla.range * 0.7, y: e.y + f.y * d.tesla.range * 0.7, z: e.z + f.z * d.tesla.range * 0.7, kind: 'tesla', miss: true });
        h.vis.beams = beams;
        h.vis.shotT = g.t;
        h.k.buzz = (h.k.buzz || 0) - dt;
        if (h.k.buzz <= 0) { h.k.buzz = 0.25; g.sound('tesla', h.pos, { h: h.id }); }
      }
      if (g.pressed(h, inp, 'shift') && !(h.cd.shift > 0)) this.leap(g, h, d.jump.cd);
      if (g.pressed(h, inp, 'e') && !(h.cd.e > 0)) {
        h.cd.e = d.bubble.cd;
        const e = g.eye(h), f = g.aim(h);
        g.spawnProj(h, { kind: 'bubbleThrow', pos: { x: e.x, y: e.y - 0.3, z: e.z }, vel: { x: f.x * 11 + h.vel.x * 0.5, y: f.y * 11 + 3, z: f.z * 11 + h.vel.z * 0.5 }, grav: 20, r: 0.25, life: 2, noHero: true, noBarrier: true, ability: 'bubble' });
        act(g, h, 'throw', 'bubble');
      }
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        g.useUlt(h, 'rage');
        h.maxHp += d.rage.hp;
        h.hp = h.maxHp;
        h.armor = h.maxArmor;
        h.cd.shift = 0;
        act(g, h, 'rage');
      }
    },
    endRage(g, h) {
      h.ultOn = null;
      h.maxHp = Math.max(1, h.maxHp - h.def.rage.hp);
      h.hp = Math.min(h.hp, h.maxHp);
    },
    endUlt(g, h) { if (h.ultOn === 'rage') this.endRage(g, h); },
    leap(g, h, cd) {
      const d = h.def.jump;
      h.cd.shift = cd;
      const f = O.dir(h.yaw, Math.max(0, h.pitch) * 0.8);
      h.vel.x = Math.sin(h.yaw) * d.vh; h.vel.z = Math.cos(h.yaw) * d.vh;
      h.vel.y = d.vy + f.y * 6;
      h.onGround = false;
      h.k.leap = true;
      h.st.kb = 0;
      act(g, h, 'leap');
      g.sound('jumpPack', h.pos, { h: h.id });
    },
    move(g, h, inp, dt) {
      if (!h.k.leap) return false;
      h.vel.y -= O.GRAVITY * 1.05 * dt;
      if (inp.fwd || inp.side) {
        const sy = Math.sin(h.yaw), cy = Math.cos(h.yaw);
        h.vel.x += (sy * inp.fwd - cy * inp.side) * 3 * dt;
        h.vel.z += (cy * inp.fwd + sy * inp.side) * 3 * dt;
      }
      h.dyn = g.dyn;
      const vy = h.vel.y;
      g.world.moveChar(h, dt);
      if (h.onGround) this.landed(g, h, vy);
      return true;
    },
    landed(g, h) {
      if (!h.k.leap) return;
      h.k.leap = false;
      const d = h.def.jump;
      for (const t of g.heroes) {
        if (t.team === h.team || !g.targetable(t)) continue;
        if (Math.hypot(t.pos.x - h.pos.x, t.pos.z - h.pos.z) > d.landR + t.r || Math.abs(t.pos.y - h.pos.y) > 2.5) continue;
        g.damage(h, t, d.landDmg, { kind: 'splash', ability: 'jumppack', from: h.pos });
        const dx = t.pos.x - h.pos.x, dz = t.pos.z - h.pos.z, l = Math.hypot(dx, dz) || 1;
        g.knock(t, dx / l * 4, 2.5, dz / l * 4);
      }
      g.addFx('land', { x: h.pos.x, y: h.pos.y, z: h.pos.z, r: d.landR });
      g.sound('winstonLand', h.pos, { h: h.id });
      h.vel.x *= 0.3; h.vel.z *= 0.3;
    },
    proj(g, p, type) {
      if (p.kind !== 'bubbleThrow') return false;
      if (type === 'world' || type === 'dep') {
        const h = g.heroes[p.owner];
        const d = O.HEROES.winston.bubble;
        const gy = g.world.groundAt(p.pos.x, p.pos.z, p.pos.y + 0.3);
        const y = gy > -Infinity && gy > p.pos.y - 3 ? gy : p.pos.y;
        const dep = g.addDeploy(h, { kind: 'bubble', pos: { x: p.pos.x, y, z: p.pos.z }, life: d.dur, hp: d.hp, maxHp: d.hp, shootable: false });
        dep.barrier = { kind: 'sphere', team: h.team, x: p.pos.x, y: y + 0.4, z: p.pos.z, r: d.r, hp: d.hp, ref: dep, owner: true, ownerIdx: h.id };
        p.dead = true;
        g.sound('bubble', dep.pos, { h: h.id });
        return true;
      }
      return true;
    },
    deploy(g, d) {
      if (d.kind === 'bubble' && d.barrier && d.barrier.hp <= 0) d.dead = true;
    }
  };

  K.lucio = {
    init(g, h) { h.maxAmmo = h.def.w.ammo; h.ammo = h.maxAmmo; h.k.song = h.k.song || 'heal'; h.k.amp = 0; h.k.burst = 0; },
    tick(g, h, inp, dt) {
      const d = h.def;
      this.aura(g, h, dt);
      if (h.k.amp > 0) h.k.amp -= dt;
      h.vis.song = h.k.song; h.vis.amp = h.k.amp > 0;
      if (h.k.burst > 0) {
        h.k.burstT -= dt;
        if (h.k.burstT <= 0 && h.ammo > 0) {
          g.fireProj(h, d.w.speed, { kind: 'sonic', dmg: d.w.dmg, r: 0.14, life: 1.2, crit: d.w.crit, ability: 'amp' });
          h.ammo--; h.k.burst--; h.k.burstT = d.w.gap; h.vis.shotT = g.t;
          g.sound('sonic', h.pos, { h: h.id });
        }
        if (h.ammo <= 0) h.k.burst = 0;
      }
      if (common(g, h, inp, dt, d.w.reload)) return;
      const rl = reloading(g, h, dt);
      if (!rl && inp.fire && h.fireCd <= 0 && h.ammo > 0 && h.k.burst <= 0) {
        h.k.burst = d.w.burst; h.k.burstT = 0; h.fireCd = d.w.interval;
      }
      if (inp.fire2 && !(h.cd.fire2 > 0)) {
        h.cd.fire2 = d.wave.cd;
        this.soundwave(g, h);
      }
      if (g.pressed(h, inp, 'shift') && !(h.cd.shift > 0)) {
        h.cd.shift = 0.8;
        h.k.song = h.k.song === 'heal' ? 'speed' : 'heal';
        g.sound('crossfade', h.pos, { h: h.id, song: h.k.song });
        g.ev('song', { h: h.id, song: h.k.song });
      }
      if (g.pressed(h, inp, 'e') && !(h.cd.e > 0)) {
        h.cd.e = d.amp.cd;
        h.k.amp = d.amp.dur;
        act(g, h, 'amp');
        g.sound('ampItUp', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        g.useUlt(h, 'barrier');
        h.ultOn = null;
        for (const t of g.heroes) {
          if (!t.alive || t.team !== h.team) continue;
          if (Math.hypot(t.pos.x - h.pos.x, t.pos.y - h.pos.y, t.pos.z - h.pos.z) > d.barrier.r) continue;
          t.temp = d.barrier.shields;
          t.aux.tempDecay = d.barrier.shields / d.barrier.dur;
        }
        act(g, h, 'soundbarrier');
        g.addFx('soundbarrier', { x: h.pos.x, y: h.pos.y, z: h.pos.z, team: h.team, r: d.barrier.r });
      }
    },
    passive(g, h, dt) { this.aura(g, h, dt); },
    aura(g, h, dt) {
      const d = h.def;
      const amp = h.k.amp > 0;
      for (const t of g.heroes) {
        if (!t.alive || t.team !== h.team) continue;
        if (Math.hypot(t.pos.x - h.pos.x, t.pos.y - h.pos.y, t.pos.z - h.pos.z) > d.song.r) continue;
        if (h.k.song === 'heal') {
          const rate = (amp ? d.amp.heal : d.song.heal) * (t === h ? d.song.selfMul : 1);
          g.heal(h, t, rate * dt, { self: true });
          t.st.healSong = 0.2;
        } else {
          t.st.song = 0.2;
          t.aux.songMul = amp ? d.amp.speed : d.song.speed;
        }
      }
    },
    soundwave(g, h) {
      const d = h.def.wave;
      const e = g.eye(h), f = g.aim(h);
      for (const t of g.heroes) {
        if (t.team === h.team || !g.targetable(t)) continue;
        const c = g.chest(t);
        const dx = c.x - e.x, dy = c.y - e.y, dz = c.z - e.z, dd = Math.hypot(dx, dy, dz);
        if (dd - t.r > d.range) continue;
        if ((dx * f.x + dy * f.y + dz * f.z) / dd < Math.cos(d.arc) && dd > 1.5) continue;
        if (!g.world.clear(e.x, e.y, e.z, c.x, c.y, c.z)) continue;
        g.damage(h, t, d.dmg, { kind: 'splash', ability: 'soundwave', from: e });
        const l = Math.hypot(f.x, f.z) || 1;
        g.knock(t, f.x / l * d.knock, 3 + Math.max(0, f.y) * 6, f.z / l * d.knock);
      }
      g.addFx('soundwave', { x: e.x, y: e.y - 0.3, z: e.z, yaw: h.yaw, pitch: h.pitch, team: h.team });
      act(g, h, 'wave');
      h.vis.shot2T = g.t;
      g.sound('soundwave', h.pos, { h: h.id });
    },
    move(g, h, inp, dt, stunned) {
      const wr = h.k.wall;
      if (stunned) { h.k.wall = null; h.vis.wallride = null; return false; }
      if (!h.onGround && inp.jump) {
        const w = g.world.wallNear(h.pos.x, h.pos.y, h.pos.z, h.r + 0.45);
        if (w && (wr || h.vel.y < 4)) {
          h.k.wall = w;
          h.vis.wallride = [w.nx, w.nz];
          const sp = 5.5 * 1.35 * g.speedMul(h);
          const sy = Math.sin(h.yaw), cy = Math.cos(h.yaw);
          let vx = sy, vz = cy;
          const dot = vx * w.nx + vz * w.nz;
          vx -= w.nx * dot; vz -= w.nz * dot;
          const l = Math.hypot(vx, vz);
          if (l > 0.05) { vx /= l; vz /= l; }
          h.vel.x = vx * sp - w.nx * 1.2; h.vel.z = vz * sp - w.nz * 1.2;
          h.vel.y = Math.max(-0.5, Math.min(0.5, h.vel.y * 0.8));
          h.dyn = g.dyn;
          g.world.moveChar(h, dt);
          return true;
        }
      }
      if (wr) {
        h.k.wall = null;
        h.vis.wallride = null;
        if (!inp.jump) { h.vel.y = 5.5; h.vel.x += wr.nx * 3; h.vel.z += wr.nz * 3; }
      }
      return false;
    }
  };

  K.mercy = {
    init(g, h) { h.maxAmmo = h.def.blaster.ammo; h.ammo = h.maxAmmo; h.weapon = 0; h.k.beamTo = null; h.k.beamMode = 'heal'; h.k.lost = 0; h.k.ga = null; },
    passive(g, h, dt) { this.regen(g, h, dt); },
    regen(g, h, dt) {
      const d = h.def.regen;
      if (g.t - h.lastHurt > d.delay && h.hp < h.maxHp) g.heal(h, h, d.rate * dt, { noUlt: true });
    },
    tick(g, h, inp, dt) {
      const d = h.def;
      this.regen(g, h, dt);
      if (inp.slot === 1) h.weapon = 0;
      if (inp.slot === 2) { h.weapon = 1; h.k.beamTo = null; }
      h.vis.weapon = h.weapon;
      h.vis.beams = [];
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        const dead = g.heroes.filter(t => t.team === h.team && !t.alive && t.spawned && t.deathPos && t.respawnT > 0.2 && Math.hypot(t.deathPos.x - h.pos.x, t.deathPos.y - h.pos.y, t.deathPos.z - h.pos.z) < d.rez.r);
        if (dead.length) {
          g.useUlt(h, 'rez');
          h.ultOn = null;
          for (const t of dead) {
            t.alive = true; t.hp = t.maxHp; t.armor = t.maxArmor; t.shield = t.maxShield;
            t.pos = { x: t.deathPos.x, y: t.deathPos.y, z: t.deathPos.z };
            t.vel = { x: 0, y: 0, z: 0 };
            t.respawnT = 0; t.st = { invuln: 2 };
            t.vis.act = 'rez'; t.vis.actT = g.t;
            g.ev('rez', { src: h.id, dst: t.id });
          }
          h.st.invuln = d.rez.invuln;
          h.stats.rez = (h.stats.rez || 0) + dead.length;
          g.addFx('rez', { x: h.pos.x, y: h.pos.y, z: h.pos.z, r: d.rez.r, team: h.team });
          act(g, h, 'rez');
        }
      }
      if (g.pressed(h, inp, 'shift') && !(h.cd.shift > 0)) {
        let t = g.lookTarget(h, d.ga.range, 0.35, 'ally');
        if (!t && h.k.beamTo !== null) t = g.heroes[h.k.beamTo];
        if (t && t.alive && t !== h) {
          h.k.ga = { to: t.id, t: 0 };
          h.cd.shift = d.ga.cd;
          act(g, h, 'ga');
          g.sound('guardian', h.pos, { h: h.id });
        }
      }
      if (h.weapon === 0) {
        const want = inp.fire ? 'heal' : inp.fire2 ? 'boost' : null;
        if (!want) { h.k.beamTo = null; }
        else {
          let t = h.k.beamTo !== null ? g.heroes[h.k.beamTo] : null;
          if (t && (!t.alive || Math.hypot(t.pos.x - h.pos.x, t.pos.y - h.pos.y, t.pos.z - h.pos.z) > d.staff.keep)) t = null;
          if (t && !g.hasLos(h, t)) { h.k.lost += dt; if (h.k.lost > 1) t = null; } else h.k.lost = 0;
          if (!t) {
            t = g.lookTarget(h, d.staff.range, 0.4, 'ally');
            if (t && h.k.beamTo !== t.id) g.sound('beamOn', h.pos, { h: h.id });
          }
          h.k.beamTo = t ? t.id : null;
          h.k.beamMode = want;
          if (t) {
            if (want === 'heal') g.heal(h, t, d.staff.heal * dt);
            else { t.st.boost = 0.25; t.aux.boostBy = h.id; if (g.tickN % 30 === 0) g.addUlt(h, 3); }
            h.vis.beams = [{ to: t.id, kind: want }];
          }
        }
        common(g, h, inp, dt, 0);
      } else {
        if (common(g, h, inp, dt, d.blaster.reload)) return;
        const rl = reloading(g, h, dt);
        if (!rl && inp.fire && h.fireCd <= 0 && h.ammo > 0) {
          g.fireProj(h, d.blaster.speed, { kind: 'blaster', dmg: d.blaster.dmg, r: 0.1, life: 1.5, crit: d.blaster.crit, ability: 'blaster' });
          h.ammo--; h.fireCd = 1 / d.blaster.rate; h.vis.shotT = g.t;
          g.sound('blaster', h.pos, { h: h.id });
        }
      }
    },
    gravity(g, h, inp, gr) {
      if (!h.onGround && inp.jump && h.vel.y < -h.def.descent.fall) { h.vel.y = -h.def.descent.fall; h.vis.descent = true; return 0; }
      h.vis.descent = false;
      return gr;
    },
    move(g, h, inp, dt) {
      const ga = h.k.ga;
      if (!ga) return false;
      const t = g.heroes[ga.to];
      ga.t += dt;
      if (!t || !t.alive || ga.t > 2 || h.st.stun > 0) { h.k.ga = null; return false; }
      const tx = t.pos.x, ty = t.pos.y + 0.8, tz = t.pos.z;
      const dx = tx - h.pos.x, dy = ty - h.pos.y, dz = tz - h.pos.z, d = Math.hypot(dx, dy, dz);
      if (d < 1.6) { h.k.ga = null; h.vel.x *= 0.4; h.vel.z *= 0.4; h.vel.y = Math.max(h.vel.y * 0.3, 1); return false; }
      const sp = h.def.ga.speed;
      h.vel.x = dx / d * sp; h.vel.y = dy / d * sp; h.vel.z = dz / d * sp;
      h.dyn = g.dyn;
      g.world.moveChar(h, dt);
      if (h.blocked > 0.97 && ga.t > 0.3) h.k.ga = null;
      h.vis.fly = true;
      return true;
    }
  };

  K.zenyatta = {
    init(g, h) { h.maxAmmo = h.def.orb.ammo; h.ammo = h.maxAmmo; h.k.harmony = null; h.k.discord = null; h.k.hLost = 0; h.k.dLost = 0; h.k.volleyT = -1; },
    speed(g, h) { return h.ultOn === 'trans' ? h.def.trans.speed : 1; },
    tick(g, h, inp, dt) {
      const d = h.def;
      this.orbs(g, h, dt);
      if (h.ultOn === 'trans') {
        h.ultT += dt;
        h.st.invuln = 0.1;
        for (const t of g.heroes) {
          if (!t.alive || t.team !== h.team) continue;
          if (Math.hypot(t.pos.x - h.pos.x, t.pos.y - h.pos.y, t.pos.z - h.pos.z) > d.trans.r) continue;
          g.heal(h, t, d.trans.heal * dt, { noUlt: true, self: true });
        }
        if (h.ultT >= d.trans.dur) h.ultOn = null;
        return;
      }
      if (common(g, h, inp, dt, d.orb.reload)) { h.k.volleyT = -1; return; }
      const rl = reloading(g, h, dt);
      if (!rl && inp.fire2 && h.ammo > 0) {
        if (h.k.volleyT < 0) h.k.volleyT = 0;
        h.k.volleyT += dt;
        h.k.volley = Math.min(d.volley.max, h.ammo, 1 + Math.floor(h.k.volleyT / d.volley.per));
        h.vis.volley = h.k.volley;
      } else if (h.k.volleyT >= 0) {
        const n = h.k.volley || 1;
        if (h.k.volleyT > 0.2 && !rl) {
          for (let i = 0; i < n; i++) g.fireProj(h, d.orb.speed, { kind: 'orb', dmg: d.orb.dmg, r: 0.16, life: 1.4, crit: d.orb.crit, ability: 'orb' }, 1, i ? 0.035 : 0);
          h.ammo -= n; h.fireCd = 0.5; h.vis.shot2T = g.t;
          g.sound('volley', h.pos, { h: h.id, n });
        }
        h.k.volleyT = -1; h.k.volley = 0; h.vis.volley = 0;
      } else if (!rl && inp.fire && h.fireCd <= 0 && h.ammo > 0) {
        g.fireProj(h, d.orb.speed, { kind: 'orb', dmg: d.orb.dmg, r: 0.16, life: 1.4, crit: d.orb.crit, ability: 'orb' });
        h.ammo--; h.fireCd = d.orb.interval; h.vis.shotT = g.t;
        g.sound('orb', h.pos, { h: h.id });
      }
      if (g.pressed(h, inp, 'shift') && !(h.cd.shift > 0)) {
        const t = g.lookTarget(h, d.harmony.range, 0.3, 'ally');
        if (t && t !== h) { h.k.harmony = t.id; h.k.hLost = 0; h.cd.shift = 1; g.sound('orbCast', h.pos, { h: h.id, good: true }); act(g, h, 'cast'); }
      }
      if (g.pressed(h, inp, 'e') && !(h.cd.e > 0)) {
        const t = g.lookTarget(h, d.discord.range, 0.25, 'enemy');
        if (t) { h.k.discord = t.id; h.k.dLost = 0; h.cd.e = 1; g.sound('orbCast', h.pos, { h: h.id, good: false }); act(g, h, 'cast'); g.ev('discord', { src: h.id, dst: t.id }); }
      }
      if (g.pressed(h, inp, 'q') && g.ultReady(h)) {
        g.useUlt(h, 'trans');
        h.st.invuln = 0.1;
        act(g, h, 'trans');
      }
    },
    passive(g, h, dt) { this.orbs(g, h, dt); },
    orbs(g, h, dt) {
      const d = h.def;
      if (h.k.harmony !== null) {
        const t = g.heroes[h.k.harmony];
        if (!t || !t.alive) h.k.harmony = null;
        else {
          if (g.hasLos(h, t)) h.k.hLost = 0; else h.k.hLost += dt;
          if (h.k.hLost > d.harmony.los) h.k.harmony = null;
          else { g.heal(h, t, d.harmony.heal * dt); t.st.harmony = 0.2; }
        }
      }
      if (h.k.discord !== null) {
        const t = g.heroes[h.k.discord];
        if (!t || !t.alive) h.k.discord = null;
        else {
          if (g.hasLos(h, t)) h.k.dLost = 0; else h.k.dLost += dt;
          if (h.k.dLost > d.discord.los) h.k.discord = null;
          else { t.st.discord = 0.2; t.aux.discordBy = h.id; }
        }
      }
    }
  };

  K.trainbot = {
    init(g, h) { h.maxAmmo = h.def.w.ammo; h.ammo = h.maxAmmo; },
    tick(g, h, inp, dt) {
      const d = h.def.w;
      if (!inp.fire || h.fireCd > 0) return;
      g.hitscan(h, g.spreadDir(g.aim(h), d.spread), 60, d.dmg, { fall: d.fall, crit: d.crit, ability: 'rifle', tracer: 'pulse' });
      h.fireCd += 1 / d.rate;
      h.vis.shotT = g.t;
      g.sound('pulseRifle', h.pos, { h: h.id });
    }
  };

  for (const id of Object.keys(K)) {
    const k = K[id];
    for (const m of Object.keys(k)) if (typeof k[m] === 'function') k[m] = k[m].bind(k);
  }
})(globalThis.Ow98 = globalThis.Ow98 || {});
